// ================= ORDERS: the chief sends people out — to hunt, to bring wood or food, to fish, to help the builders, to guard the village, to come along, or to raid =================
// An order takes a few people away from their usual work for a while. They go where they were sent, do it, carry what they
// got to the store, and go back to their usual work when the job is done (or when they are called back). On the way they
// still run from danger and fight what attacks them, like always.
const ORD = { list: [], seq: 0, n: {}, where: 'home', t: 0 };
const ORDT = {
  hunt: { ic: '🦌', n: 'מסע ציד', d: 'יוצאים לצוד ומביאים את הבשר למחסן', who: ['hunter', 'warrior', 'builder', 'gatherer'], def: 3, unit: 'חיות', goal: n => Math.max(2, n), T: 420, area: 1, go: 'יצאו לצוד', go1: ['יצא לצוד', 'יצאה לצוד'] },
  wood: { ic: '🪵', n: 'להביא עצים', d: 'כורתים עצים וסוחבים אותם למחסן', who: ['builder', 'gatherer', 'hunter', 'warrior'], def: 3, unit: 'עצים', goal: n => n * 16, T: 420, area: 1, go: 'יצאו להביא עצים', go1: ['יצא להביא עצים', 'יצאה להביא עצים'] },
  food: { ic: '🍌', n: 'ללקט אוכל', d: 'אוספים פירות, אגוזים ושורשים ומביאים למחסן', who: ['gatherer', 'builder', 'hunter', 'warrior'], def: 2, unit: 'מנות', goal: n => n * 6, T: 420, area: 1, go: 'יצאו ללקט אוכל', go1: ['יצא ללקט אוכל', 'יצאה ללקט אוכל'] },
  fish: { ic: '🎣', n: 'לדוג', d: 'דגים מהגדה, ובסירה כשיש מעגן', who: ['gatherer', 'hunter', 'builder', 'warrior'], def: 2, unit: 'דגים', goal: n => n * 5, T: 420, area: 1, go: 'יצאו לדוג', go1: ['יצא לדוג', 'יצאה לדוג'] },
  build: { ic: '🔨', n: 'לעזור לבונים', d: 'בונים יחד עד שכל מה שהתחילו לבנות גמור', who: ['builder', 'gatherer', 'hunter', 'warrior'], def: 3, unit: '', T: 600, go: 'הולכים לבנות', go1: ['הולך לבנות', 'הולכת לבנות'] },
  guard: { ic: '🛡️', n: 'לשמור על הכפר', d: 'מסיירים סביב הכפר גם בלילה, ונלחמים בכל מי שתוקף', who: ['warrior', 'hunter', 'builder', 'gatherer'], def: 4, unit: '', T: 1800, go: 'שומרים על הכפר', go1: ['שומר על הכפר', 'שומרת על הכפר'] }
};
const ordIs = (a, k) => !!a && !!a.ord && !a.ord.done && a.ord.k === k;
const ordBusy = m => !!m.ord || !!m.escort || !!m.towerB || m.brain !== 'tribe' || !!(m.job && (m.job.k === 'raid' || m.job.k === 'boat'));
function ordCands(k) {
  const T = ORDT[k], rank = m => { const i = T ? T.who.indexOf(m.cls) : 0; return (i < 0 ? 9 : i) - (m.hp / (m.maxHp || 1)) * 0.5; };
  return clanAdults().filter(m => !ordBusy(m)).sort((p, q) => rank(p) - rank(q));
}
const ordFollowCands = () => clanAdults().filter(m => !m.ord && !m.escort && !m.towerB && m.brain === 'tribe' && !(m.job && m.job.k === 'raid')).sort((p, q) => (q.cls === 'warrior') - (p.cls === 'warrior') || (q.cls === 'hunter') - (p.cls === 'hunter') || q.hp - p.hp);
function ordNum(k, have) { const T = ORDT[k], d = k === 'follow' ? 2 : k === 'guard' ? Math.max(T.def, clsCount('warrior') + clsCount('hunter')) : T.def; return clamp(ORD.n[k] ?? d, have ? 1 : 0, have); }
// where they go: by the village, where the hunter stands now, or the place marked on the map
function ordWhereList() {
  const v = ownCamp(), L = [{ k: 'home', ic: '🏠', n: 'ליד הכפר' }]; if (!v || !P.a) return L;
  const ok = (x, z) => { const d = Math.hypot(x - v.x, z - v.z); return d > villageR() + 12 && d < 460 && inBounds(x, z) && !HUNT.camps.some(c => !c.own && !c.gone && Math.hypot(c.x - x, c.z - z) < 55); };
  if (ok(P.a.pos.x, P.a.pos.z)) L.push({ k: 'me', ic: '📍', n: 'לאן שאני עומד' });
  if (WAY.p && ok(WAY.p.x, WAY.p.z)) L.push({ k: 'mark', ic: '🚩', n: 'ליעד שסימנתי' });
  return L;
}
function ordArea(where) {
  const v = ownCamp(), L = ordWhereList(), w = L.find(q => q.k === where) || L[0];
  if (w.k === 'me') return { x: P.a.pos.x, z: P.a.pos.z, home: false, label: 'איפה שעמדת' };
  if (w.k === 'mark') return { x: WAY.p.x, z: WAY.p.z, home: false, label: 'ליד היעד שסימנת' };
  return { x: v.x, z: v.z, home: true, label: '' };
}
// what someone carried when an order began or ended is not lost: it reaches the store
function ordDropCarry(m) {
  const j = m.job; if (!j || !m.carry) return;
  const st = boxStore();
  if (j.k === 'bring') { if (j.w != null) st.wood += j.w; else st.meat += j.n || 0; }
  else if (j.k === 'home') { if (j.what === 'fish') st.fish += j.n || 2; else if (j.what === 'food') st.cooked += 1; }
  else if (j.k === 'mhome') oreToStore(j.ore, j.n || 0);
  m.carry = false;
}
// men0: the chief chose the people himself (one person, from that person's card)
function ordStart(k, n, where, men0) {
  const v = ownCamp(), T = ORDT[k]; if (!v || !T) return null;
  if (k === 'build' && !ordBuildable()) return null;
  const men = men0 ? men0.filter(m => m.alive && !m.gone && !m.young && m.brain === 'tribe' && !(m.job && ['raid', 'caravan', 'ship', 'boat'].includes(m.job.k)) && !m.inCart && !m.inShip) : ordCands(k).slice(0, n); if (!men.length) return null;
  for (const m of men) { if (m.ord) ordLeave(m); if (m.towerB) towerLeave(m); m.escort = false; }
  const A = T.area ? ordArea(where) : { x: v.x, z: v.z, home: true, label: '' };
  const o = { id: ++ORD.seq, k, men, x: A.x, z: A.z, home: A.home, where: A.label, goal: T.goal ? T.goal(men.length) : 0, got: 0, meat: 0, el: 0, T: T.T, done: false };
  for (const m of men) { ordDropCarry(m); m.ord = o; m.job = null; m.hidden = false; m.sleepAt = null; m.prevJob = null; }
  ORD.list.push(o); PROG.flags['ord_' + k] = 1;
  const names = men.map(m => m.name), who = names.length > 3 ? `${names.slice(0, 3).join(', ')} ועוד ${names.length - 3}` : names.join(' ו');
  UI.notify(`${T.ic} ${who} ${men.length > 1 ? T.go : heb(men[0], T.go1[0], T.go1[1])}${A.label ? ` ${A.label}` : ''}`, 'good');
  if (o.home === false && P.pings) P.pings.push({ x: o.x, z: o.z, t: 6 });
  saveGame();
  return o;
}
function ordLeave(m) { const o = m.ord; m.ord = null; if (!o) return; if (m.job && m.job.k !== 'boat') { ordDropCarry(m); m.job = null; } const i = o.men.indexOf(m); if (i >= 0) o.men.splice(i, 1); }
function ordEnd(o, why) {
  if (!o || o.done) return; o.done = true;
  for (const m of o.men) if (m.ord === o) { m.ord = null; if (m.alive && m.job && m.job.k === 'tame') { const h = m.job.h; if (h && h.ledBy === m) horseToTribe(h, false); else if (h && h.tamer === m) h.tamer = null; } if (m.alive && m.job && m.job.k !== 'boat') { ordDropCarry(m); m.job = null; } }
  const i = ORD.list.indexOf(o); if (i >= 0) ORD.list.splice(i, 1);
  const T = ORDT[o.k]; let txt = '';
  if (o.k === 'hunt') txt = o.got ? `${T.ic} מסע הציד נגמר: ${o.got === 1 ? 'חיה אחת' : `${o.got} חיות`}, ${o.meat} נתחי בשר במחסן` : `${T.ic} מסע הציד נגמר בלי טרף`;
  else if (o.k === 'wood') txt = `${T.ic} ${o.got} עצים הגיעו למחסן`;
  else if (o.k === 'food') txt = `${T.ic} ${o.got} מנות אוכל הגיעו למחסן`;
  else if (o.k === 'fish') txt = `${T.ic} ${o.got} דגים הגיעו למחסן`;
  else if (o.k === 'build') txt = why === 'built' ? `${T.ic} כל המבנים גמורים. כולם חוזרים לעבודה הרגילה` : `${T.ic} העזרה לבונים נגמרה`;
  else if (o.k === 'guard') txt = `${T.ic} השמירה נגמרה`;
  else if (o.k === 'mine') txt = `${T.ic} ${o.got} מחצבים הגיעו למחסן`;
  else if (o.k === 'tame') txt = o.got ? `${T.ic} ${o.got === 1 ? 'סוס בר אחד אולף' : `${o.got} סוסי בר אולפו`} והגיע לכפר` : `${T.ic} לא הצליחו לאלף סוס הפעם`;
  if (why === 'trees') txt = `${T.ic} אין שם עצים לכרות. ${o.got ? `${o.got} עצים הגיעו למחסן, ` : ''}כולם חזרו`;
  else if (why === 'horses') txt = `${T.ic} אין סוסי בר קרובים. ${o.got ? `${o.got} כבר הגיעו לכפר, ` : ''}כולם חזרו. עדרי סוסים רועים בערבות הפתוחות`;
  else if (why === 'ore') txt = `${T.ic} אין מרבצים קרובים לכרות בהם. ${o.got ? `${o.got} מחצבים כבר הגיעו למחסן, ` : ''}כולם חזרו. אפשר לשלוח אותם למרבץ שמצאת: עומדים לידו, או מסמנים אותו במפה`;
  else if (why === 'water') txt = `${T.ic} אין שם מים לדוג בהם. ${o.got ? `${o.got} דגים הגיעו למחסן, ` : ''}כולם חזרו`;
  else if (why === 'gone') txt = o.got ? txt : '';
  if (txt && why !== 'quiet') UI.notify(why === 'stop' ? `↩️ ${txt.replace(/^\S+ /, '')}. חוזרים לעבודה הרגילה` : txt + (why === 'time' && o.goal ? ' (נגמר הזמן)' : ''), 'good');
  saveGame();
}
const ordBuildable = () => BLD.sites.some(s => !s.done && !s.unpaid);
// ---------- each one at work ----------
function ordJob(a, dt, v) {
  const o = a.ord;
  if (!o || o.done) { a.ord = null; if (a.job && a.job.k === 'home') return ordHome(a, dt, v, null); return false; }
  if (a.escort) { ordLeave(a); return false; }
  a.hidden = false; if (a.sleepAt) a.sleepAt = null;
  switch (o.k) {
    case 'hunt': return ordHunt(a, dt, v, o);
    case 'wood': return ordWood(a, dt, v, o);
    case 'food': return ordFood(a, dt, v, o);
    case 'fish': return ordFish(a, dt, v, o);
    case 'build': return ordBuild(a, dt, v, o);
    case 'guard': warriorJob(a, dt, v); return true;
    case 'tame': return ordTame(a, dt, v, o);
    case 'mine': return ordMine(a, dt, v, o);
  }
  return false;
}
// a spot on dry, flat ground near a point
function ordSpot(x, z, r0, r1) {
  for (let k = 0; k < 14; k++) { const ang = rng() * TAU, r = rr(r0, r1), px = x + Math.cos(ang) * r, pz = z + Math.sin(ang) * r; if (inBounds(px, pz) && waterDepth(px, pz) === 0 && getNY(px, pz) > 0.8) return { x: px, z: pz }; }
  return null;
}
const ORD_HUNT = new Set(['hunt', 'collect', 'bring', 'scout']);
function ordHunt(a, dt, v, o) {
  let j = a.job;
  if (!j || !ORD_HUNT.has(j.k)) {
    const t = findClanPrey({ x: o.x, z: o.z }, o.home ? 170 : 130, a);
    if (t) a.job = j = { k: 'hunt', t, T: 130 };
    else { const s = ordSpot(o.x, o.z, o.home ? 50 : 15, o.home ? 130 : 70); a.job = j = { k: 'scout', T: 45, x: s ? s.x : o.x, z: s ? s.z : o.z }; }
  }
  if (j.k === 'bring') { hunterJob(a, dt, v); if (a.job !== j) { o.got++; o.meat += j.n || 0; a.job = null; } return true; }
  hunterJob(a, dt, v);
  if (a.job && a.job.k === 'rest') a.job = null;   // no resting by the fire on a hunt: off again
  return true;
}
function ordWood(a, dt, v, o) {
  let j = a.job;
  if (!j || (j.k !== 'fell' && j.k !== 'bring')) {
    const free = q => !q.cut && (!q.claim || !q.claim.alive || !q.claim.job || q.claim.job.e !== q);
    const e = o.home ? treeToClear(v) : treeNearest(o.x, o.z, 45, free) || treeNearest(o.x, o.z, 110, free);
    if (!e) { if (!o.men.some(m => m !== a && m.job && (m.job.k === 'fell' || m.job.k === 'bring'))) ordEnd(o, 'trees'); else ordLeave(a); return false; }
    e.claim = a; a.job = j = { k: 'fell', e, t: 0, T: 70 + Math.hypot(e.x - a.pos.x, e.z - a.pos.z) / Math.max(0.6, a.sp.walk * 1.3) };
  }
  if (j.k === 'bring') { builderJob(a, dt, v); if (a.job !== j) { o.got += j.w || 0; a.job = null; } return true; }
  builderJob(a, dt, v);
  if (a.job && a.job.k === 'rest') a.job = null;
  return true;
}
function ordFood(a, dt, v, o) {
  let j = a.job;
  if (!j || (j.k !== 'food' && j.k !== 'home')) {
    const s = ordSpot(o.x, o.z, o.home ? 14 : 3, o.home ? 42 : 30) || { x: o.x, z: o.z };
    a.job = j = { k: 'food', x: s.x, z: s.z, t: rr(6, 10) };
  }
  if (j.k === 'home') return ordHome(a, dt, v, o);
  gathererJob(a, dt, v);
  if (a.job && a.job.k === 'rest') a.job = null;
  return true;
}
// carrying fish, fruit or water home (also after a canoe trip, whoever paddled it)
function ordHome(a, dt, v, o) {
  const j = a.job;
  if (j.ox == null) { j.ox = rr(-1, 1); j.oz = rr(-1, 1); }
  const d = jobGo(a, v.x + j.ox, v.z + j.oz, a.sp.walk, dt);
  if (d < 3.2) {
    const st = boxStore(); a.carry = false; let n = 0;
    if (j.what === 'fish') { n = j.n || 2; st.fish += n; }
    else if (j.what === 'food') { n = 1 + Math.min(3, Math.floor(BLD.list.filter(b => b.done && b.t === 'field').length * 0.5 + rng() * 0.6)); st.cooked += n; }
    else CLAN.water = Math.min(100, CLAN.water + 12);
    if (o) o.got += n;
    a.job = null;
  }
  return true;
}
function ordShore(o) {
  for (let k = 0; k < 6; k++) {
    const w = nearestWater(o.x + rr(-18, 18), o.z + rr(-18, 18)); if (!w || Math.hypot(w.x - o.x, w.z - o.z) > (o.home ? 110 : 90)) continue;
    const b = bankFrom(w.x, w.z); if (!b || waterDepth(b.x, b.z) > 0 || !inBounds(b.x, b.z)) continue;
    return { x: b.x, z: b.z, wx: w.x, wz: w.z };
  }
  return null;
}
function ordFish(a, dt, v, o) {
  let j = a.job;
  if (j && j.k === 'home') return ordHome(a, dt, v, o);
  if (!j || j.k !== 'shore') {
    if (o.home && rng() < 0.5 && boatTripStart(a, v)) return true;   // a canoe from the dock (the trip itself runs on its own)
    const s = ordShore(o); if (!s) { if (!o.men.some(m => m !== a && m.job && (m.job.k === 'shore' || m.job.k === 'boat'))) ordEnd(o, 'water'); else ordLeave(a); return false; }
    a.job = j = { k: 'shore', x: s.x, z: s.z, wx: s.wx, wz: s.wz, t: rr(18, 30) };
  }
  if (!j.there) { const d = jobGo(a, j.x, j.z, a.sp.walk * 1.1, dt); if (d < 1.2 || (a.blocked || 0) > 1.5) j.there = true; return true; }
  a.move(0, 0, 0, dt); a.yaw += angDiff(a.yaw, Math.atan2(j.wx - a.pos.x, j.wz - a.pos.z)) * Math.min(1, dt * 3); a.pose = 'fish'; j.t -= dt;
  if (j.t <= 0) { a.carry = true; a.job = { k: 'home', what: 'fish', n: 1 + Math.round(rng() * 1.4 + wildK() * 0.8) }; }
  return true;
}
function ordBuild(a, dt, v, o) {
  let j = a.job;
  if (!j || j.k !== 'build') { const s = defPickSite(a); if (!s) { a.job = null; return false; } a.job = j = { k: 'build', s }; }
  builderJob(a, dt, v);
  return true;
}
// ---------- the clock: goals, time, and people who are gone ----------
function ordUpdate(dt) {
  if (!ORD.list.length) return;
  if ((ORD.t -= dt) > 0) return; const step = 1 - ORD.t; ORD.t = 1;
  const v = ownCamp();
  for (const o of ORD.list.slice()) {
    if (o.done) continue;
    o.el += step;
    o.men = o.men.filter(m => m.alive && !m.gone && m.tribe && m.ord === o);
    if (!v) { ordEnd(o, 'quiet'); continue; }
    if (!o.men.length) { ordEnd(o, 'gone'); continue; }
    if (o.goal && o.got >= o.goal) { ordEnd(o, 'goal'); continue; }
    if (o.k === 'build' && !ordBuildable()) { ordEnd(o, 'built'); continue; }
    if (o.el >= o.T) ordEnd(o, 'time');
  }
}
function ordProgress(o) {
  const left = Math.max(1, Math.ceil((o.T - o.el) / 60)), time = o.k === 'guard' ? 'עד שתחזירו אותם' : `עוד ${left} דק׳`;
  if (o.goal) return `${o.got}/${o.goal} ${ORDT[o.k].unit} · ${time}`;
  if (o.k === 'build') return `${BLD.sites.filter(s => !s.done).length} מבנים בבנייה · ${time}`;
  return time;
}
function ordDoing(m) { const o = m.ord; return o && !o.done ? ORDT[o.k].ic : ''; }
// ---------- save and load ----------
function ordSave() {
  return ORD.list.filter(o => !o.done).map(o => ({ k: o.k, x: Math.round(o.x), z: Math.round(o.z), h: o.home ? 1 : 0, w: o.where || '', g: o.goal, got: o.got, mt: o.meat || 0, el: Math.round(o.el), T: o.T, m: o.men.filter(m => m.alive).map(m => m.isPartner ? 'p' + aliveMates().indexOf(m) : m.uid).filter(u => u && u !== 'p-1') }));
}
function ordReset() { for (const o of ORD.list) for (const m of o.men) if (m.ord === o) m.ord = null; ORD.list = []; ORD.n = {}; ORD.where = 'home'; ORD.t = 0; }
function ordLoad(d) {
  ordReset(); if (!Array.isArray(d)) return;
  for (const q of d) {
    if (!ORDT[q.k]) continue;
    const men = [...new Set((q.m || []).map(u => typeof u === 'string' ? aliveMates()[+u.slice(1)] : TRIBE.adults.find(b => b.uid === u && b.alive && !b.gone && !b.young)))].filter(m => m && !m.ord); if (!men.length) continue;
    const o = { id: ++ORD.seq, k: q.k, men, x: q.x, z: q.z, home: !!q.h, where: q.w || '', goal: q.g || 0, got: q.got || 0, meat: q.mt || 0, el: q.el || 0, T: q.T || ORDT[q.k].T, done: false };
    for (const m of men) { m.ord = o; m.job = null; m.escort = false; }
    ORD.list.push(o);
  }
}
// ---------- the screen ----------
function ordersHtml() {
  const ad = clanAdults(), act = ORD.list.filter(o => !o.done), esc = ad.filter(m => m.escort), raids = WAR.parties.filter(p => !p.done && p.mine), out = act.reduce((s, o) => s + o.men.length, 0);
  let h = `<div class="vxhero"><b>פקודות לשבט</b><span>${ad.length} מבוגרים${out ? ` · ${out} יצאו בפקודה` : ''}${esc.length ? ` · ${esc.length} הולכים איתך` : ''}. השאר עושים את העבודה הרגילה</span></div>`;
  if (act.length || esc.length || raids.length) {
    h += '<h3>עכשיו</h3>';
    for (const o of act) h += `<div class="oact"><i>${ORDT[o.k].ic}</i><div><b>${ORDT[o.k].n}${o.where ? ` <small>${o.where}</small>` : ''}</b><span>${o.men.map(m => m.name).join(', ')} · ${ordProgress(o)}</span></div><button class="btn" data-a="ordStop" data-id="${o.id}">להחזיר</button></div>`;
    for (const p of raids) h += `<div class="oact"><i>⚔️</i><div><b>פשיטה על ${campName(p.to)}</b><span>${p.men.length} לוחמים · ${{ march: 'בדרך', attack: 'נלחמים', loot: 'אוספים שלל', home: 'חוזרים' }[p.phase] || ''}</span></div></div>`;
    if (esc.length) h += `<div class="oact"><i>🚶</i><div><b>הולכים איתך</b><span>${esc.map(m => m.name).join(', ')}</span></div><button class="btn" data-a="ordEscOff">לשחרר</button></div>`;
    if (act.length + (esc.length ? 1 : 0) > 1) h += '<div class="btns"><button class="btn" data-a="ordAll">↩️ כולם חוזרים לעבודה הרגילה</button></div>';
  }
  const W = ordWhereList();
  if (!W.some(w => w.k === ORD.where)) ORD.where = 'home';
  h += `<h3>לשלוח אנשים</h3><div class="owhere"><span>לאן:</span>${W.map(w => `<button class="${ORD.where === w.k ? 'on' : ''}" data-a="ordWhere" data-w="${w.k}">${w.ic} ${w.n}</button>`).join('')}</div>`;
  if (W.length === 1) h += `<p class="idim">כדי לשלוח אנשים למקום אחר: ${TOUCH ? 'ללכת לשם, או לסמן יעד במפה, ולפתוח שוב את המסך הזה' : 'ללכת לשם (או לסמן יעד במפה) וללחוץ O'}.</p>`;
  h += '<div class="ogrid">';
  const card = (k, T, c, note, btn) => {
    const n = ordNum(k, c.length), men = c.slice(0, n), who = men.length > 4 ? `${men.slice(0, 4).map(m => m.name).join(', ')} ועוד ${men.length - 4}` : men.map(m => m.name).join(', ');
    return `<div class="ocard"><div class="oh"><i>${T.ic}</i><div><b>${T.n}</b><span>${T.d}</span></div></div>` +
      `<div class="orow">${note ? '' : `<div class="ostep"><button data-a="ordN" data-k="${k}" data-d="1" aria-label="עוד אחד"${n >= c.length ? ' disabled' : ''}>+</button><b>${n}</b><button data-a="ordN" data-k="${k}" data-d="-1" aria-label="אחד פחות"${n <= 1 ? ' disabled' : ''}>−</button></div>`}<small>${note || who}</small></div>` +
      `<button class="btn${note ? '' : ' pri'}" data-a="ordGo" data-k="${k}"${note ? ' disabled' : ''}>${btn}</button></div>`;
  };
  for (const k of Object.keys(ORDT)) {
    const T = ORDT[k], c = ordCands(k), n = ordNum(k, c.length);
    const note = k === 'build' && !ordBuildable() ? 'אין עכשיו מה לבנות' : !c.length ? 'כולם כבר עסוקים' : '';
    h += card(k, T, c, note, `לשלוח${T.goal && c.length ? ` · ${T.goal(n)} ${T.unit}` : ''}`);
  }
  const fc = ordFollowCands();
  h += card('follow', { ic: '🚶', n: 'לבוא איתי', d: 'הולכים אחריך לכל מקום ונלחמים לצידך' }, fc, fc.length ? '' : 'כולם כבר עסוקים', 'לקרוא להם');
  h += '</div>';
  // raids
  const known = npcIdx().filter(i => VX.known.has(i) && !isVassal(i, 'own')), busy = raids.length > 0;
  h += `<h3>⚔️ פשיטה על שבט</h3><p class="idim">לוחמים וציידים יוצאים אל המחנה של שבט אחר: לוקחים אוכל, משחררים שבויים וכובשים שטח. פשיטה על שבט שאתם לא במלחמה איתו מתחילה מלחמה.</p>`;
  if (!known.length) h += '<p class="idim">עוד לא פגשתם שבטים אחרים.</p>';
  for (const i of known) {
    const war = atWar(i), tr = Math.round(campTrust(i)), my = ownPower(false), th = npcPower(i);
    h += `<div class="oact"><i style="background:${TRIBEC[tribeKeyOf(HUNT.camps[i])]}"></i><div><b>${campName(i)}</b><span>${war ? '⚔️ במלחמה' : relWord(i, tr)} · הכוח שלהם ${th.toFixed(0)}, שלכם ${my.toFixed(0)}</span></div><button class="btn${war ? ' pri' : ' wdanger'}" data-a="ordRaid" data-i="${i}"${busy ? ' disabled' : ''}>${busy ? 'הלוחמים בדרך' : war ? 'לפשוט' : 'מלחמה ופשיטה'}</button></div>`;
  }
  return h;
}
function ordClick(b) {
  const A = b.dataset.a, k = b.dataset.k;
  if (A === 'ordN') { const c = (k === 'follow' ? ordFollowCands() : ordCands(k)).length; ORD.n[k] = clamp(ordNum(k, c) + (+b.dataset.d), 1, Math.max(1, c)); AUD.play('ui', 0.3); campMenu('orders'); return; }
  if (A === 'ordWhere') { ORD.where = b.dataset.w; AUD.play('ui', 0.3); campMenu('orders'); return; }
  if (A === 'ordGo') {
    if (k === 'follow') {
      const c = ordFollowCands(), men = c.slice(0, ordNum(k, c.length));
      for (const m of men) { ordDropCarry(m); m.escort = true; m.job = null; m.hidden = false; m.sleepAt = null; }
      if (men.length) { UI.notify(`🚶 ${men.map(m => m.name).join(' ו')} ${men.length > 1 ? 'הולכים' : heb(men[0], 'הולך', 'הולכת')} איתך`, 'good'); PROG.flags.ord_follow = 1; saveGame(); }
      campMenu('orders'); return;
    }
    const c = ordCands(k); if (!ordStart(k, ordNum(k, c.length), ORD.where)) UI.notify(k === 'build' ? 'אין עכשיו מה לבנות' : 'אין מי שיצא: כולם עסוקים', 'bad');
    campMenu('orders'); return;
  }
  if (A === 'ordStop') { const o = ORD.list.find(q => q.id === +b.dataset.id); if (o) ordEnd(o, 'stop'); campMenu('orders'); return; }
  if (A === 'ordEscOff' || A === 'ordAll') {
    for (const m of clanAdults()) if (m.escort) { m.escort = false; m.job = null; }
    if (A === 'ordAll') { for (const o of ORD.list.slice()) ordEnd(o, 'quiet'); UI.notify('↩️ כולם חוזרים לעבודה הרגילה', 'good'); }
    else UI.notify('🚶 הם חוזרים לעבוד בכפר', 'good');
    saveGame(); campMenu('orders'); return;
  }
  if (A === 'ordRaid') {
    const i = +b.dataset.i; if (!HUNT.camps[i]) return;
    if (atWar(i)) { closeCard('campov'); raidPlanner(i); return; }
    const c = HUNT.camps[i], my = ownPower(true), th = npcPower(i);
    const el = uiCard('campov', `<h2>פשיטה על ${c.tribe}?</h2><p>אתם לא במלחמה איתם. פשיטה עליהם היא הכרזת מלחמה: הלוחמים שלהם יפשטו בחזרה על הכפר, ושבטים שמחבבים אותם יכעסו.</p><p class="idim">הכוח שלכם ${my.toFixed(0)} · הכוח שלהם ${th.toFixed(0)}. ${my > th * 1.3 ? 'אתם חזקים מהם.' : my < th * 0.8 ? 'הם חזקים מכם.' : 'הכוחות שקולים.'}</p><div class="btns"><button class="btn wdanger" data-a="yes">🔥 להכריז מלחמה ולצאת לפשיטה</button><button class="btn" data-a="no">ביטול</button></div>`);
    el.onclick = e => { const q = e.target.closest('button'); if (!q) return; if (q.dataset.a === 'yes') { closeCard('campov'); declareWar(i); raidPlanner(i); } else campMenu('orders'); };
    return;
  }
}
function ordOpen() {
  if (G.mode !== 'play' || !P.human || !P.a) return;
  if (!ownCamp()) { UI.notify('פקודות נותנים לשבט משלך: קודם צריך להקים שבט', 'bad'); return; }
  if (BLD.mode) buildCancel(true);
  if (MNG.on) manageEnd();
  campMenu('orders'); PROG.flags.ordOpen = 1;
}
// ---------- the button (touch) and the key O ----------
const OBTN = { el: null, tip: null };
function ordBtnUpdate() {
  const show = G.mode === 'play' && P.human && !!P.a && !!ownCamp();
  if (TOUCH) {
    const top = document.getElementById('ttop'); if (!top) return;
    if (!OBTN.el) {
      if (!ICON.tribe) ICON.tribe = SVG('<circle cx="9" cy="7.5" r="3"/><path d="M3 20c0-3.6 2.7-6.2 6-6.2s6 2.6 6 6.2"/><circle cx="17" cy="9" r="2.4"/><path d="M16 13.9c2.9.2 5 2.5 5 5.6"/>');
      const b = document.createElement('button'); b.id = 'tOrd'; b.className = 'tb'; b.innerHTML = ICON.tribe; b.hidden = true;
      b.setAttribute('aria-label', 'פקודות לשבט');
      b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); ordOpen(); });
      OBTN.el = b;
    }
    const b = OBTN.el, prev = document.getElementById('tBuild');
    if (prev && prev.parentNode === top && (b.parentNode !== top || b.previousElementSibling !== prev)) top.insertBefore(b, prev.nextElementSibling);
    if (b.hidden === show) b.hidden = !show;
  } else {
    const tip = document.getElementById('helpTip');
    if (tip && !OBTN.tip) { const s = document.createElement('span'); s.id = 'htOrd'; s.innerHTML = ' <kbd>O</kbd>פקודות'; s.hidden = true; tip.appendChild(s); OBTN.tip = s; }
    if (OBTN.tip && OBTN.tip.hidden === show) OBTN.tip.hidden = !show;
  }
  if (show && !PROG.flags.obtnTold && !G.paused && G.t > 8 && clanAdults().length >= 2 && PROG.flags.bbtnTold) { PROG.flags.obtnTold = 1; UI.notify(TOUCH ? '📣 כפתור האנשים למעלה פותח את מסך הפקודות: לשלוח אנשים לצוד, להביא עצים, לשמור על הכפר ולפשוט על שבט' : 'O פותח את מסך הפקודות: לשלוח אנשים לצוד, להביא עצים, לשמור על הכפר ולפשוט על שבט', 'good'); }
}
addEventListener('keydown', e => {
  if (e.code !== 'KeyO' || e.repeat || G.mode !== 'play' || !P.human) return;
  const el = document.getElementById('campov');
  if (el && !el.hidden) { if (VSCR.tab === 'orders') closeCard('campov'); else campMenu('orders'); return; }
  if (!G.paused) ordOpen();
});
(function () {
  const st = document.createElement('style');
  st.textContent = `.ogrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:8px;margin:6px 0}
.ocard{border:1px solid var(--line);border-radius:12px;padding:9px 10px;display:flex;flex-direction:column;gap:6px;background:rgba(127,127,127,.06)}
.ocard .oh{display:flex;gap:8px;align-items:flex-start}.ocard .oh>i{font-style:normal;font-size:22px;line-height:1}.ocard .oh div{display:flex;flex-direction:column;gap:2px}
.ocard .oh b{font-size:15px}.ocard .oh span{font-size:12px;color:var(--dim);line-height:1.35}
.orow{display:flex;align-items:center;gap:8px}.orow small{font-size:12px;color:var(--dim);line-height:1.3;flex:1;min-width:0}
.ostep{display:flex;align-items:center;gap:2px;border:1px solid var(--line);border-radius:10px;padding:2px}.ostep button{width:30px;height:28px;border:0;border-radius:8px;background:rgba(127,127,127,.12);color:var(--ink);font:600 17px Rubik,sans-serif;cursor:pointer}.ostep button:disabled{opacity:.35;cursor:default}.ostep b{min-width:20px;text-align:center;font-size:15px}
.ocard .btn{padding:6px 10px;font-size:13px}
.oact{display:flex;align-items:center;gap:9px;padding:7px 9px;margin:5px 0;border:1px solid var(--line);border-radius:12px;background:rgba(232,176,75,.07)}
.oact>i{font-style:normal;font-size:19px;line-height:1;flex:0 0 auto;min-width:14px;min-height:14px;border-radius:50%}.oact>div{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}.oact b{font-size:14px}.oact b small{font-weight:400;color:var(--dim)}.oact span{font-size:12px;color:var(--dim);line-height:1.35}
.oact .btn{padding:6px 10px;font-size:13px;flex:0 0 auto}
.owhere{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin:4px 0 6px}.owhere span{font-size:13px;color:var(--dim)}.owhere button{border:1px solid var(--line);background:transparent;color:var(--ink);border-radius:10px;padding:6px 10px;font:600 13px Rubik,sans-serif;cursor:pointer}.owhere button.on{background:rgba(232,176,75,.25);border-color:var(--gold)}`;
  document.head.appendChild(st);
})();
// ================= POLITICS: chiefs with a character of their own, alliances, trade, marriages between tribes, and how much your own people back you =================
// Every chief has a character: one is quick to fight, one prefers gifts and talk, one is greedy, one is proud, one is wise.
// Tribes make alliances with each other, and an ally joins its friend's wars. Your tribe can make alliances too: allies
// never attack you, send warriors when you are raided and stand with you in a war — and ask the same of you. Trade
// brings food or wood every morning; a marriage between the tribes brings a new person to the village and the two
// tribes closer. And at home, your own people judge you: food in the store, victories and peace make them trust you;
// hunger, lost raids and long wars wear their trust down, and people who lost faith leave.
const POL = { trait: {}, ch: {}, al: {}, trade: {}, ties: {}, ref: {}, sup: 60, why: [], ask: [], dayK: -1, t: 0, dipT: 45, joining: false, init: 0, lowDay: -1, succ: false };
const TRAITS = {
  war: { n: 'תוקפני', d: 'מהר לכעוס ומהר לצאת למלחמה', warAt: -55, ultAt: -30, peace: -0.1, ally: 50, gift: 1, npcWar: 1.5, join: 0.9 },
  peace: { n: 'שוחר שלום', d: 'מעדיף מתנות ושיחות על פני מלחמה', warAt: -85, ultAt: -55, peace: 0.15, ally: 35, gift: 1.2, npcWar: 0.5, join: 0.5 },
  greed: { n: 'חמדן', d: 'אוהב מתנות וסחר, ודורש הרבה', warAt: -70, ultAt: -35, peace: 0, ally: 45, gift: 1.6, npcWar: 1, join: 0.7 },
  proud: { n: 'גאה', d: 'לא סובל עלבון, ומכבד את מי שמנצח אותו בקרב אלופים', warAt: -65, ultAt: -40, peace: -0.05, ally: 45, gift: 0.8, npcWar: 1.2, join: 0.8 },
  wise: { n: 'נבון', d: 'שוקל כל צעד, ושומר אמונים לבני בריתו', warAt: -78, ultAt: -45, peace: 0.05, ally: 32, gift: 1, npcWar: 0.8, join: 0.75 }
};
const TRAIT_KEYS = Object.keys(TRAITS);
const polTr = i => TRAITS[POL.trait[i]] || TRAITS.wise;
const polKey = k => k === 'own' ? 'own' : +k;
const polAllied = (a, b) => a != null && b != null && a !== b && !!POL.al[pk(a, b)];
function polAllies(a) {
  const L = [], s = String(a);
  for (const k in POL.al) {
    const [x, y] = k.split('|'), o = x === s ? y : y === s ? x : null; if (o == null) continue;
    const q = polKey(o); if (q === 'own' ? !!ownCamp() : !!HUNT.camps[q] && !HUNT.camps[q].gone) L.push(q);
  }
  return L;
}
function polAlly(a, b, quiet) {
  if (polAllied(a, b)) return; POL.al[pk(a, b)] = G.day;
  if (a !== 'own' && b !== 'own') npcTrustAdd(a, b, 8);
  if (quiet) return;
  const k = VX.known.has(a) || VX.known.has(b) || a === 'own' || b === 'own';
  if (k) warLog(`${campName(a)} ו${campName(b)} כרתו ברית`, a === 'own' || b === 'own' ? 'good' : '');
  if (k && a !== 'own' && b !== 'own') UI.notify(`🤝 ${campName(a)} ו${campName(b)} כרתו ברית: מעכשיו הם נלחמים זה לצד זה`, '');
}
function polUnally(a, b, why) {
  if (!polAllied(a, b)) return; delete POL.al[pk(a, b)];
  if (why && (VX.known.has(a) || VX.known.has(b) || a === 'own' || b === 'own')) warLog(`הברית בין ${campName(a)} ל${campName(b)} התפרקה${why === true ? '' : `: ${why}`}`, a === 'own' || b === 'own' ? 'bad' : '');
}
// ---------- the chiefs ----------
function polEnsure() {
  for (const i of npcIdx()) {
    if (!POL.trait[i]) POL.trait[i] = pick(TRAIT_KEYS);
    const ch = chiefOfCamp(HUNT.camps[i]), key = ch ? ch.id : 0;
    if (key && POL.ch[i] && POL.ch[i] !== key) {
      // a new chief stood up while we watched (the old one was gone): a new character
      POL.trait[i] = pick(TRAIT_KEYS);
      if (VX.known.has(i)) { UI.notify(`👑 ל${campName(i)} יש ראש שבט חדש: ${ch.name}, ${polTr(i).n}`, ''); warLog(`${ch.name} הוא ראש השבט החדש של ${campName(i)}`, ''); }
    }
    if (key) POL.ch[i] = key;
  }
  if (!POL.init) {
    // the jungle already has its friendships and its grudges
    POL.init = 1; const ids = npcIdx(), pairs = [];
    for (let a = 0; a < ids.length; a++) for (let b = a + 1; b < ids.length; b++) { npcTrustAdd(ids[a], ids[b], rr(-14, 32)); pairs.push([ids[a], ids[b]]); }
    pairs.sort((p, q) => npcTrust(q[0], q[1]) - npcTrust(p[0], p[1]));
    for (const [i, j] of pairs) if (npcTrust(i, j) > 22 && !atWarK(i, j) && !isVassal(i, j) && !isVassal(j, i) && polAllies(i).length < 1 && polAllies(j).length < 1) polAlly(i, j, true);
  }
}
// a chief falls: the strongest warrior takes his place, with a character of his own
function polChiefDied(i, t, src) {
  const c = HUNT.camps[i]; if (!c || c.gone || c.own) return;
  const L = c.hunters.filter(h => h.alive && !h.gone && !h.young && h !== t && !h.raider && h.brain !== 'captive' && (h.cls === 'warrior' || h.cls === 'hunter')).sort((p, q) => (q.cls === 'warrior') - (p.cls === 'warrior') || q.maxHp - p.maxHp);
  // on a journey the chief had left someone in charge: that one takes the chief's place
  const T = c.trip, dep = T && T.dep && T.dep.alive && !T.dep.gone && T.dep !== t ? T.dep : null; if (T) npcTripEnd(c, false);
  const ours = src && ourPeople(src), nh = dep || L[0];
  POL.trait[i] = ours ? pick(['war', 'war', 'proud', 'wise']) : pick(TRAIT_KEYS);
  if (ours) addTrust(i, -15);
  if (nh) { nh.cls = 'chief'; nh.elite = true; nh.maxHp *= 1.25; nh.hp = Math.min(nh.maxHp, nh.hp + nh.maxHp * 0.3); retemplate(nh, ensureTribal('chief', tribeKeyOf(c), nh.sex)); POL.ch[i] = nh.id; }
  else POL.ch[i] = 0;
  if (VX.known.has(i) || ours) {
    const txt = `👑 ${t.name}, ראש ${c.tribe}, נפל${t.sex === 'f' ? 'ה' : ''}.${nh ? ` ${nh.name} ${heb(nh, 'הוא', 'היא')} ${heb(nh, 'ראש השבט החדש', 'ראשת השבט החדשה')}: ${polTr(i).n}` : ''}`;
    UI.notify(txt, ours ? 'good' : ''); warLog(txt.slice(3), ours ? 'good' : '');
  }
}
// ---------- wars spread along alliances ----------
function polWarStarted(a, b) {
  if (POL.joining) return; POL.joining = true;
  try {
    for (const [side, foe] of [[a, b], [b, a]]) for (const x of polAllies(side)) {
      if (x === foe || polAllied(x, foe) || (x === 'own' ? atWar(foe) : foe === 'own' ? atWar(x) : atWarK(x, foe))) continue;
      if (x !== 'own' && foe !== 'own' && (isVassal(x, foe) || isVassal(foe, x))) continue;
      if (x === 'own') { if (!POL.ask.some(q => q.i === side && q.foe === foe)) POL.ask.push({ i: side, foe, day: G.day }); continue; }
      if (rng() > polTr(x).join) { if (side === 'own') { addTrust(x, -6); UI.notify(`🤝 ${campName(x)} לא הצטרפו למלחמה שלכם נגד ${campName(foe)}`, 'bad'); } else npcTrustAdd(x, side, -8); continue; }
      if (foe === 'own') polJoinVsOwn(x, side);
      else {
        const r = relGet(x, foe); r.st = 'war'; r.since = G.day; r.days = 0; r.sc = {}; r.truce = -1;
        const seen = side === 'own' || VX.known.has(x) || VX.known.has(foe);
        if (seen) { const t = side === 'own' ? `🤝 ${campName(x)} יוצאים למלחמה נגד ${campName(foe)}, לצדכם` : `🤝 ${campName(x)} הצטרפו למלחמה של בני בריתם, ${campName(side)}, נגד ${campName(foe)}`; UI.notify(t, side === 'own' ? 'good' : ''); warLog(t.slice(3), side === 'own' ? 'good' : ''); }
      }
    }
  } finally { POL.joining = false; }
}
function polJoinVsOwn(x, side) {
  const r = relGet('own', x); if (r.st === 'war' || polAllied('own', x)) return;
  r.st = 'war'; r.since = G.day; r.days = 0; r.sc = {}; r.raidT = rr(140, 260); r.truce = -1;
  addTrust(x, -Math.max(0, campTrust(x) + 50));
  const t = `${campName(x)} הצטרפו למלחמה נגדכם, לצד בני בריתם ${campName(side)}`;
  warLog(t, 'bad'); UI.notify(`⚔️ ${t}`, 'bad');
}
// before a war: who will stand with whom
function polWarPreview(i) {
  const theirs = polAllies(i).filter(x => x !== 'own' && !atWar(x)), ours = polAllies('own').filter(x => x !== i && !polAllied(x, i));
  return { theirs, ours };
}
// ---------- allies come to help when the village is raided ----------
function polAllyHelp(p) {
  const v = ownCamp(); if (!v || p.to !== 'own' || p.site) return;
  let n = 0; const names = [];
  for (const i of polAllies('own')) {
    const c = HUNT.camps[i]; if (!c || c.gone || i === p.from || atWar(i) || polAllied(i, p.from)) continue;
    if (Math.hypot(c.x - v.x, c.z - v.z) > 700 || rng() > 0.85 || n >= 5) continue;
    const k = Math.min(5 - n, 2 + (rng() < 0.45 ? 1 : 0)); let got = 0;
    for (let q = 0; q < k; q++) if (polAllyWarrior(c, p, v)) { n++; got++; }
    if (got) names.push(campName(i));
  }
  if (n) { UI.notify(`🤝 ${names.join(' ו')} שלחו ${n} לוחמים לעזור לכם!`, 'good'); warLog(`${names.join(' ו')} שלחו לוחמים לעזור בהגנה על הכפר`, 'good'); PROG.flags.allyHelp = 1; }
}
function polAllyWarrior(c, p, v) {
  const base = Math.atan2(c.x - v.x, c.z - v.z), d = villageR() + 34;
  for (let t = 0; t < 12; t++) {
    const ang = base + rr(-0.5, 0.5), x = v.x + Math.sin(ang) * d, z = v.z + Math.cos(ang) * d;
    if (!inBounds(x, z) || waterDepth(x, z) > 0) continue;
    const role = rng() < 0.35 ? 'hunter' : 'warrior', sd = lookSeed(), h = new Animal('hunter', x, z, { sex: 'm', tpl: ensureTribal(role, tribeKeyOf(c), 'm', true, sd % 3), scale: rr(0.97, 1.05) }); h.ground(1, true);
    Object.assign(h, { hunter: true, camp: c, name: npcName(c, 'm'), cls: role, pets: [], brain: 'allyw', socialExtra: true, state: 'idle', stT: 1, spearCD: rr(0, 2), netCD: 99, vd: 260, allyHelp: 'own', allyP: p, rwpn: role === 'hunter' ? 'bow' : rng() < 0.5 ? 'sword' : 'spear', think: 0 });
    h.maxHp *= 1.15; h.hp = h.maxHp; h.home.set(c.x, 0, c.z); civLook(h, c, sd);
    return h;
  }
  return null;
}
BRAIN.allyw = function (h, dt) {
  h.stT -= dt; h.think -= dt; h.spearCD -= dt; h.atkCD = (h.atkCD || 0) - dt; h.netCD = 99;
  if (h.windup > 0) {
    const t = h.throwTgt; h.windup -= dt;
    if (t && t.alive) h.yaw += angDiff(h.yaw, Math.atan2(t.pos.x - h.pos.x, t.pos.z - h.pos.z)) * Math.min(1, dt * 8);
    h.move(0, 0, 0, dt); h.pose = 'aim'; if (h.windup <= 0) hunterLaunch(h); return;
  }
  const p = h.allyP, v = ownCamp();
  if (!p || p.done || p.phase === 'retreat' || !p.men.length || !v || h.fleeing) {
    if (h.dCam < 40 && !h.fleeing) say(h, pick(['ניצחנו יחד!', 'חוזרים הביתה', 'בני ברית לעולם!']), 2.2);
    h.brain = 'leaver'; h.allyHelp = null; h.allyP = null; h.fleeing = false; h.state = 'idle'; h.leaveTo = { x: h.camp.x, z: h.camp.z }; return;
  }
  if (h.think <= 0) { h.think = 0.5; let best = null, bd = 48; for (const r of p.men) { if (!r.alive || r.gone) continue; const d = dist2(r.pos, h.pos); if (d < bd) { bd = d; best = r; } } h.foe = best; }
  if (h.foe && h.foe.alive) { raiderFight(h, h.foe, dt); return; }
  const d = jobGo(h, v.x + Math.sin(h.id) * 7, v.z + Math.cos(h.id) * 7, h.sp.run * 0.8, dt);
  if (d < 1.5) { h.move(0, 0, 0, dt); h.pose = 'idle'; }
};
// ---------- the tribe behind you ----------
function polEvent(n, text) {
  if (!ownCamp() || !n) return;
  const was = POL.sup; POL.sup = clamp(POL.sup + n, 0, 100);
  const w0 = POL.why[0]; if (w0 && w0.t === text && w0.d >= G.day - 1) { w0.n += n; w0.d = G.day; } else POL.why.unshift({ n, t: text, d: G.day }); if (POL.why.length > 8) POL.why.length = 8;
  if (was >= 30 && POL.sup < 30 && POL.lowDay !== G.day) { POL.lowDay = G.day; UI.notify(`👥 האנשים בשבט מאבדים את האמון בך (${Math.round(POL.sup)}%). אוכל במחסן, ניצחונות ושלום יחזירו אותו`, 'bad'); }
}
const supWord = s => s >= 80 ? 'אוהבים אותך' : s >= 60 ? 'סומכים עליך' : s >= 40 ? 'מהססים' : s >= 25 ? 'ממורמרים' : 'על סף מרד';
function polSupportDaily(v) {
  const st = boxStore(), food = st.cooked + st.meat + st.fish, need = Math.max(4, popCount() * 4);
  if (CLAN.hungry > 0.3) polEvent(-8, 'השבט רעב');
  else if (food > need * 1.5) polEvent(3, 'המחסן מלא');
  const wars = npcIdx().filter(i => atWar(i) && relGet('own', i).days >= 3).length;
  if (wars) polEvent(-2 * wars, wars > 1 ? 'מלחמות ארוכות' : 'מלחמה ארוכה');
  const al = polAllies('own').length; if (al) polEvent(Math.min(2, al), 'בני ברית חזקים');
  // drifting back toward the middle
  if (POL.sup > 70) POL.sup -= 1; else if (POL.sup < 50) POL.sup += 1;
  if (POL.sup < 25 && rng() < 0.55) {
    const L = TRIBE.adults.filter(b => b.alive && !b.gone && !b.isPartner && !b.young && b.brain === 'tribe' && !b.ord && !b.escort && !(b.job && b.job.k === 'raid'));
    const m = L.find(b => !married(b)) || (POL.sup < 12 ? L[0] : null);
    if (m) {
      const i = TRIBE.adults.indexOf(m); TRIBE.adults.splice(i, 1); if (m.towerB) towerLeave(m);
      m.tribe = false; m.brain = 'leaver'; m.job = null; m.escort = false; m.hidden = false; m.ord = null;
      say(m, 'אני לא מאמין יותר בראש השבט הזה', 3); UI.notify(`👥 ${m.name} ${heb(m, 'עזב', 'עזבה')} את השבט: ${heb(m, 'הוא', 'היא')} לא ${heb(m, 'סומך', 'סומכת')} עליך יותר`, 'bad'); warLog(`${m.name} ${heb(m, 'עזב', 'עזבה')} את השבט`, 'bad');
    } else if (CLAN.residents > 0) { const n = Math.max(1, Math.round(CLAN.residents * 0.08)); CLAN.residents -= n; UI.notify(`👥 ${n} תושבים עזבו את הכפר: הם לא סומכים עליך`, 'bad'); }
  }
}
// ---------- trade ----------
const DEALS = {
  wf: { n: 'עצים תמורת אוכל', give: ['wood', 8], get: ['food', 5], ic: '🪵 ← 🍖' },
  fw: { n: 'אוכל תמורת עצים', give: ['food', 5], get: ['wood', 8], ic: '🍖 ← 🪵' }
};
const goodsN = (k, n) => k === 'wood' ? `${n} עצים` : `${n} מנות אוכל`;
function polTradeDaily() {
  const out = [];
  for (const k of Object.keys(POL.trade)) {
    const i = +k, d = POL.trade[k], D = DEALS[d.k], c = HUNT.camps[i];
    if (!D || !c || c.gone || atWar(i)) { delete POL.trade[k]; continue; }
    const st = boxStore(), [gk, gn] = D.give, [rk, rn] = D.get, have = gk === 'wood' ? st.wood || 0 : st.cooked + st.meat + st.fish;
    if (have < gn) { d.miss = (d.miss || 0) + 1; addTrust(i, -2); if (d.miss >= 3) { delete POL.trade[k]; UI.notify(`🔁 הסחר עם ${campName(i)} בוטל: שלושה בקרים לא היה לכם מה לשלוח`, 'bad'); warLog(`הסחר עם ${campName(i)} בוטל`, 'bad'); } else out.push(`לא היו ${gk === 'wood' ? 'עצים' : 'מספיק אוכל'} לסחר עם ${campName(i)}`); continue; }
    if (rk === 'food' && (WAR.food[i] || 0) < rn + 3) { out.push(`ל${campName(i)} לא היה אוכל לשלוח היום`); continue; }
    d.miss = 0;
    if (gk === 'wood') st.wood -= gn; else { takeFood(gn); WAR.food[i] = (WAR.food[i] || 0) + gn; }
    const st2 = boxStore();   // the store object is replaced whenever it is read
    if (rk === 'food') { WAR.food[i] -= rn; st2.cooked += rn; } else st2.wood = (st2.wood || 0) + rn;
    addTrust(i, 1.5 * polTr(i).gift); d.n = (d.n || 0) + 1;
    out.push(`נתתם ל${campName(i)} ${goodsN(gk, gn)} וקיבלתם ${goodsN(rk, rn)}`);
  }
  if (out.length) UI.notify(`🔁 סחר הבוקר: ${out.join(' · ')}`, 'good');
}
// ---------- marriages between the tribes ----------
function polWedPair(i) {
  const c = HUNT.camps[i]; if (!c || c.gone || popCount() >= housing()) return null;
  const theirs = c.hunters.filter(h => h.alive && !h.gone && !h.young && h.cls !== 'chief' && h.cls !== 'elder' && !h.raider && !h.duel && h.brain !== 'captive' && !h.isPartner && !h.consent && !h.fleeing);
  for (const sex of rng() < 0.5 ? ['f', 'm'] : ['m', 'f']) { const ours = singles(sex === 'f' ? 'm' : 'f'), t = theirs.find(h => h.sex === sex); if (ours.length && t) return { ours: pick(ours), theirs: t }; }
  return null;
}
function polWed(i, pair) {
  const c = HUNT.camps[i], m = pair.ours, h = pair.theirs, v = ownCamp(); if (!c || !v || !m.alive || !h.alive || married(m)) return false;
  const cls = WORK.includes(h.cls) ? h.cls : 'gatherer';
  tribeAdult(h); setCls(h, cls, true); h.escort = false; h.state = 'idle'; h.foe = null;
  m.spouse = h; h.spouse = m; (h.sex === 'f' ? h : m).birthCD = rr(1, 4);
  if ((h.dCam || 0) > 90 && Math.hypot(camera.position.x - v.x, camera.position.z - v.z) > 90) { for (let t = 0; t < 10; t++) { const ang = rng() * TAU, x = v.x + Math.cos(ang) * rr(4, 9), z = v.z + Math.sin(ang) * rr(4, 9); if (waterDepth(x, z) === 0) { h.pos.set(x, 0, z); h.ground(1, true); break; } } }
  POL.ties[i] = (POL.ties[i] || 0) + 1; addTrust(i, 22); PROG.flags.polWed = 1; PROG.flags.wedding = 1;
  polEvent(4, `חתונה עם ${c.tribe}`);
  UI.big('חתונה בין השבטים!', `${m.name} מהשבט שלך ו${h.name} מ${c.tribe} התחתנו. ${h.name} ${heb(h, 'עובר', 'עוברת')} לגור בכפר, ושני השבטים קרובים יותר`); AUD.play('cheer', 0.6);
  warLog(`${m.name} ו${h.name} מ${c.tribe} התחתנו: קשר משפחה בין השבטים`, 'good');
  saveGame(); return true;
}
// ---------- actions from the war room ----------
function polAllyNeed(i) { return polTr(i).ally - 10 * (POL.ties[i] || 0); }
function polAllyWhyNot(i) {
  if (atWar(i)) return 'אתם במלחמה איתם';
  if (isVassal(i)) return 'הם שבט חסות';
  const foes = polAllies(i).filter(x => x !== 'own' && atWar(x)); if (foes.length) return `הם בברית עם ${campName(foes[0])}, שאתם במלחמה איתו`;
  const need = polAllyNeed(i); if (campTrust(i) < need) return `הם עוד לא סומכים עליכם מספיק (צריך יחסים של ${need}+)`;
  return '';
}
function polProposeAlly(i) {
  const r = relGet('own', i); r.allyDay = G.day;
  const why = polAllyWhyNot(i); if (why) { UI.notify(`🤝 ${campName(i)} דוחים את הברית: ${why}`, 'bad'); return false; }
  const k = clamp(0.55 + (campTrust(i) - polAllyNeed(i)) / 80 + (ownPower(true) > npcPower(i) ? 0.1 : 0), 0.1, 0.95);
  if (rng() > k) { addTrust(i, -2); UI.notify(`🤝 ${campName(i)} רוצים לחכות עוד קצת לפני ברית. אפשר לנסות שוב מחר`, 'bad'); return false; }
  polAlly('own', i); addTrust(i, 10); polEvent(5, `ברית עם ${campName(i)}`); PROG.flags.alliance = 1;
  UI.big('ברית!', `${campName(i)} ושבט שלך בני ברית: הם לא יתקפו אתכם, ישלחו לוחמים כשפושטים על הכפר ויצטרפו למלחמות שלכם. גם הם יבקשו עזרה כשיותקפו`);
  AUD.play('chime'); saveGame(); return true;
}
function polBreakAlly(i) {
  polUnally('own', i, 'ביטלתם אותה'); addTrust(i, -25); polEvent(-3, `ביטול הברית עם ${campName(i)}`);
  UI.notify(`✂️ ביטלתם את הברית עם ${campName(i)}. הם נעלבו`, 'bad'); saveGame();
}
function polTradeStart(i, k) {
  if (!DEALS[k] || atWar(i)) return;
  POL.trade[i] = { k, since: G.day, n: 0, miss: 0 }; addTrust(i, 4); PROG.flags.trade = 1;
  UI.notify(`🔁 הסכם סחר עם ${campName(i)}: כל בוקר ${goodsN(...DEALS[k].give)} מכם, ${goodsN(...DEALS[k].get)} מהם`, 'good');
  warLog(`הסכם סחר עם ${campName(i)}: ${DEALS[k].n}`, 'good'); saveGame();
}
function polTradeCard(i) {
  const c = HUNT.camps[i], tr = campTrust(i);
  if (tr < 15) { UI.notify(`🔁 ${campName(i)} עוד לא סומכים עליכם מספיק בשביל סחר (צריך יחסים של 15+)`, 'bad'); return; }
  const el = uiCard('warov', `<h2>🔁 סחר עם ${c.tribe}</h2><p>כל בוקר עוברים מטענים בין הכפרים. כל יום של סחר מקרב את השבטים. אם שלושה בקרים לא יהיה לכם מה לשלוח, הסחר מתבטל.</p>` +
    `<div class="btns vxbtns">${Object.entries(DEALS).map(([k, D]) => `<button class="btn${k === 'wf' ? ' pri' : ''}" data-d="${k}">${D.ic} ${D.n}: ${goodsN(...D.give)} מכם, ${goodsN(...D.get)} מהם</button>`).join('')}<button class="btn" data-d="x">ביטול</button></div>` +
    `<p class="idim">יש לכם במחסן ${boxStore().wood} עצים ו־${boxStore().cooked + boxStore().meat + boxStore().fish} מנות אוכל. ל${c.tribe} יש בערך ${Math.round(WAR.food[i] || 0)} מנות אוכל.</p>`);
  el.querySelector('.card').classList.add('vxcard', 'warcard');
  el.onclick = e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.d && b.dataset.d !== 'x') polTradeStart(i, b.dataset.d); openWar(); };
}
function polWedCard(i, offer) {
  const c = HUNT.camps[i], pair = POL.wedPair && POL.wedPair.i === i ? POL.wedPair.p : polWedPair(i);
  if (!pair) { UI.notify(popCount() >= housing() ? '💍 אין מקום בכפר לעוד אדם: צריך לבנות בתים' : `💍 אין עכשיו זוג מתאים: צריך רווק או רווקה בשבט שלך ובשבט של ${campName(i)}`, 'bad'); if (!offer) openWar(); return; }
  POL.wedPair = { i, p: pair };
  const { ours: m, theirs: h } = pair;
  const el = uiCard('warov', `<div class="vxwho"><span class="vxic">💍</span><div><h2>${offer ? `הצעת נישואין מ${c.tribe}` : `נישואין עם ${c.tribe}`}</h2><p class="idim">${offer ? `${chiefOfCamp(c) ? chiefOfCamp(c).name : 'ראש השבט'} מציע לקשור את השבטים` : 'חתונה שקושרת את שני השבטים'}</p></div></div>` +
    `<p class="vxsay">"${h.name}, ${clsWord(h)} מ${c.tribe}, ו${m.name}, ${clsWord(m)} מהשבט שלך."</p><p class="idim">${h.name} ${heb(h, 'יעבור', 'תעבור')} לגור בכפר שלך. היחסים עם ${c.tribe} ישתפרו מאוד, וקל יותר לכרות איתם ברית.</p>` +
    `<div class="btns vxbtns"><button class="btn pri" data-a="yes">💍 לחגוג את החתונה</button><button class="btn" data-a="other">זוג אחר</button><button class="btn" data-a="no">${offer ? 'לסרב בנימוס' : 'ביטול'}</button></div>`);
  el.onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.a === 'other') { POL.wedPair = null; polWedCard(i, offer); return; }
    const pr = POL.wedPair; POL.wedPair = null; relGet('own', i).wedDay = G.day;
    if (b.dataset.a === 'yes') { if (campTrust(i) < 10 && !offer) { UI.notify(`💍 ${campName(i)} מסרבים: הם עוד לא סומכים עליכם`, 'bad'); openWar(); return; } closeCard('warov'); polWed(i, pr.p); return; }
    if (offer) { addTrust(i, -5); closeCard('warov'); UI.notify(`סירבתם בנימוס. ${campName(i)} קצת נעלבו`, ''); return; }
    openWar();
  };
}
// ---------- the other tribes come with offers and requests ----------
function polCanTalk() {
  const v = ownCamp(); return !!v && !!P.a && P.a.alive && !P.sleeping && !CHAL.ch && !BLD.mode && !(typeof AIMX !== 'undefined' && AIMX.on) && !G.paused && G.mode === 'play' && !WAR.parties.some(p => !p.done && !p.mine && p.to === 'own') && G.time > 7 && G.time < 18.5;
}
function polDiplomacy() {
  // while you are away, the envoys come to the one in charge and wait for you
  const away = DEP.away && !!ownCamp() && G.mode === 'play';
  if (!away && !polCanTalk()) return;
  if (!away && DEP.msgs.length && depEnvoys()) return;
  // an ally asks for help
  POL.ask = POL.ask.filter(q => (G.day - q.day <= 2 || q.held) && polAllied('own', q.i) && (q.foe === 'own' ? false : HUNT.camps[q.foe] && !HUNT.camps[q.foe].gone) && atWarK(q.i, q.foe) && !atWar(q.foe));
  if (POL.ask.length) { if (away) { for (const q of POL.ask) if (!q.held) { q.held = true; q.day = G.day; depHold('help', q.i); } return; } polHelpCard(POL.ask.shift()); return; }
  if (WAR.dipAny === G.day) return;
  for (const i of npcIdx()) {
    if (!VX.known.has(i) || isVassal(i) || atWar(i)) continue;
    const r = relGet('own', i), tr = campTrust(i); if (r.dipDay === G.day || r.st === 'war') continue;
    if (!polAllied('own', i) && tr >= polAllyNeed(i) + 8 && !polAllyWhyNot(i) && rng() < 0.12) { r.dipDay = WAR.dipAny = G.day; if (away) depHold('ally', i); else polAllyOffer(i); return; }
    if (away) { if (tr >= 18 && POL.trade[i] == null && rng() < 0.08) { r.dipDay = WAR.dipAny = G.day; depHold('trade', i); return; } continue; }
    if (tr >= 28 && rng() < 0.08 && r.wedDay !== G.day) { const pr = polWedPair(i); if (pr) { r.dipDay = WAR.dipAny = G.day; POL.wedPair = { i, p: pr }; polWedCard(i, true); return; } }
    if (tr >= 18 && POL.trade[i] == null && rng() < 0.08) { r.dipDay = WAR.dipAny = G.day; polTradeOffer(i); return; }
  }
}
function polAllyOffer(i) {
  const c = HUNT.camps[i], ch = chiefOfCamp(c);
  const el = uiCard('warov', `<div class="vxwho"><span class="vxic">🤝</span><div><h2>שליח מ${c.tribe}</h2><p class="idim">${ch ? ch.name : 'ראש השבט'}, ${polTr(i).n}, מציע ברית</p></div></div><p class="vxsay">"נעמוד זה לצד זה: כשיתקפו אתכם, נשלח לוחמים. כשיתקפו אותנו, תבואו אתם."</p>` +
    '<div class="btns vxbtns"><button class="btn pri" data-a="yes">🤝 לכרות ברית</button><button class="btn" data-a="no">לא עכשיו</button></div>');
  el.onclick = e => { const b = e.target.closest('button'); if (!b) return; closeCard('warov'); if (b.dataset.a === 'yes') { polAlly('own', i); addTrust(i, 8); polEvent(5, `ברית עם ${campName(i)}`); PROG.flags.alliance = 1; UI.big('ברית!', `${campName(i)} ושבט שלך בני ברית: הם לא יתקפו אתכם, ישלחו לוחמים כשפושטים על הכפר ויצטרפו למלחמות שלכם`); AUD.play('chime'); saveGame(); } else addTrust(i, -3); };
}
function polTradeOffer(i) {
  const c = HUNT.camps[i], k = (WAR.food[i] || 0) > 24 ? 'wf' : 'fw', D = DEALS[k];
  const el = uiCard('warov', `<div class="vxwho"><span class="vxic">🔁</span><div><h2>סוחרים מ${c.tribe}</h2><p class="idim">${D.n}</p></div></div><p class="vxsay">"כל בוקר: ${goodsN(...D.give)} מכם, ${goodsN(...D.get)} מאיתנו."</p>` +
    '<div class="btns vxbtns"><button class="btn pri" data-a="yes">🔁 לסגור עסקה</button><button class="btn" data-a="no">לא צריך</button></div>');
  el.onclick = e => { const b = e.target.closest('button'); if (!b) return; closeCard('warov'); if (b.dataset.a === 'yes') polTradeStart(i, k); };
}
function polHelpCard(q) {
  const i = q.i, foe = q.foe, c = HUNT.camps[i], ch = chiefOfCamp(c), my = ownPower(true), th = npcPower(foe), fa = polAllies(foe).filter(x => x !== 'own' && !atWar(x));
  const el = uiCard('warov', `<div class="vxwho"><span class="vxic">🤝</span><div><h2>בני הברית מבקשים עזרה</h2><p class="idim">שליח מ${c.tribe}</p></div></div><p class="vxsay">"${campName(foe)} נלחמים בנו. ${ch ? ch.name : 'ראש השבט'} שואל: האם בני הברית שלנו יעמדו לצדנו?"</p>` +
    `<p class="idim">הכוח של ${campName(foe)}: ${th.toFixed(0)}, שלכם ${my.toFixed(0)}.${fa.length ? ` בני הברית שלהם, ${fa.map(campName).join(' ו')}, יילחמו גם בכם.` : ''} אם תסרבו, ${c.tribe} יכעסו, ואולי יבטלו את הברית.</p>` +
    `<div class="btns vxbtns"><button class="btn wdanger" data-a="yes">⚔️ להצטרף למלחמה</button><button class="btn" data-a="no">לא הפעם</button></div>`);
  el.onclick = e => {
    const b = e.target.closest('button'); if (!b) return; closeCard('warov');
    if (b.dataset.a === 'yes') { addTrust(i, 15); polEvent(2, `עמדתם לצד ${campName(i)}`); declareWar(foe); return; }
    POL.ref[i] = (POL.ref[i] || 0) + 1; addTrust(i, -12);
    if (POL.ref[i] >= 2 || campTrust(i) < 25) { polUnally('own', i, 'לא באתם לעזור'); POL.ref[i] = 0; UI.notify(`🤝 ${campName(i)} ביטלו את הברית: "כשהיינו צריכים אתכם, לא באתם"`, 'bad'); }
    else UI.notify(`${campName(i)} מאוכזבים. אם תסרבו שוב, הברית תתבטל`, 'bad');
    saveGame();
  };
}
// ---------- the clock ----------
function polUpdate(dt) {
  if (!P.human) return;
  if ((POL.t -= dt) > 0) return; POL.t = 1;
  polEnsure();
  const v = ownCamp();
  if (POL.dayK !== G.day && G.time > 6.6) { POL.dayK = G.day; polDaily(v); }
  if ((POL.dipT -= 1) <= 0) { POL.dipT = 35; polDiplomacy(); }
}
function polDaily(v) {
  const ids = npcIdx();
  // alliances among the tribes are made and broken
  for (let a = 0; a < ids.length; a++) for (let b = a + 1; b < ids.length; b++) {
    const i = ids[a], j = ids[b]; if (isVassal(i, j) || isVassal(j, i) || !sameLand(i, j)) continue;
    const tr = npcTrust(i, j);
    if (polAllied(i, j)) { if (tr < 10 || atWarK(i, j)) polUnally(i, j, tr < 10 ? 'הם כבר לא סומכים זה על זה' : true); else npcTrustAdd(i, j, 1.5); continue; }
    if (atWarK(i, j) || relGet(i, j).truce > G.day) continue;
    // a common enemy brings tribes together
    if (ids.some(k => k !== i && k !== j && atWarK(i, k) && atWarK(j, k))) npcTrustAdd(i, j, 4);
    if (tr > 45 && rng() < 0.22 * (polTr(i).ally <= 35 || polTr(j).ally <= 35 ? 1.3 : 1)) polAlly(i, j);
  }
  if (!v) return;
  // our allies: closer every day, unless trust is lost
  for (const i of polAllies('own')) { if (i === 'own') continue; if (campTrust(i) < 15) { polUnally('own', i, 'הם כבר לא סומכים עליכם'); UI.notify(`🤝 הברית עם ${campName(i)} התפרקה: הם כבר לא סומכים עליכם`, 'bad'); } else addTrust(i, 1); }
  polTradeDaily();
  polSupportDaily(v);
}
// ---------- save and load ----------
function polSave() { return { tr: POL.trait, al: POL.al, td: POL.trade, ti: POL.ties, rf: POL.ref, s: Math.round(POL.sup), w: POL.why.slice(0, 8), in: POL.init, d: POL.dayK }; }
function polReset() { Object.assign(POL, { trait: {}, ch: {}, al: {}, trade: {}, ties: {}, ref: {}, sup: 60, why: [], ask: [], dayK: -1, t: 0, dipT: 45, joining: false, init: 0, lowDay: -1, wedPair: null }); }
function polLoad(d) {
  polReset(); if (!d) return;
  Object.assign(POL, { trait: d.tr || {}, al: d.al || {}, trade: d.td || {}, ties: d.ti || {}, ref: d.rf || {}, sup: d.s ?? 60, why: d.w || [], init: d.in || 0, dayK: d.d ?? -1 });
}
// ---------- on the screens ----------
function polChip(i) { return polAllied('own', i) ? '<span class="wchip wgood">🤝 בני ברית</span>' : ''; }
function polFacts(i) {
  const c = HUNT.camps[i], ch = chiefOfCamp(c), al = polAllies(i).filter(x => x !== 'own'), t = POL.trade[i], ties = POL.ties[i] || 0;
  return `<span>👑 ${ch ? `${chiefNow(c)} · ${polTr(i).n}` : 'אין ראש שבט'}</span>${al.length ? `<span>🤝 בברית עם ${al.map(campName).join(' ו')}</span>` : ''}${t ? `<span>🔁 ${DEALS[t.k].n}</span>` : ''}${ties ? `<span>💍 ${ties > 1 ? `${ties} חתונות` : 'חתונה'} בין השבטים</span>` : ''}`;
}
function polActs(i) {
  if (!ownCamp() || atWar(i) || isVassal(i)) return [];
  const r = relGet('own', i), acts = [];
  if (polAllied('own', i)) acts.push(`<button class="btn" data-a="unally" data-i="${i}">✂️ לבטל את הברית</button>`);
  else { const why = polAllyWhyNot(i); acts.push(`<button class="btn${why || r.allyDay === G.day ? '' : ' pri'}" data-a="ally" data-i="${i}"${r.allyDay === G.day ? ' disabled' : ''} title="${why}">🤝 ${r.allyDay === G.day ? 'הצעתם ברית היום' : 'להציע ברית'}</button>`); }
  acts.push(POL.trade[i] ? `<button class="btn" data-a="untrade" data-i="${i}">✂️ לבטל את הסחר</button>` : `<button class="btn" data-a="trade" data-i="${i}">🔁 סחר</button>`);
  acts.push(`<button class="btn" data-a="wed" data-i="${i}"${r.wedDay === G.day ? ' disabled' : ''}>💍 נישואין</button>`);
  return acts;
}
function polHtml() {
  polEnsure();
  const v = ownCamp(), known = npcIdx().filter(i => VX.known.has(i)), allies = polAllies('own'), trades = Object.keys(POL.trade).map(Number).filter(i => HUNT.camps[i] && !HUNT.camps[i].gone);
  let h = `<div class="vxhero"><b>פוליטיקה</b><span>${allies.length ? `בני ברית: ${allies.map(campName).join(', ')}` : 'אין לכם בני ברית'}${trades.length ? ` · ${trades.length} הסכמי סחר` : ''}</span></div>`;
  if (v) {
    const s = Math.round(POL.sup), col = s >= 60 ? '#6dbe6a' : s >= 35 ? '#e3ae63' : '#ef6a55';
    h += `<h3>👥 השבט שלך: ${supWord(s)}</h3><div class="wrel"><i><b style="right:0;width:${s}%;background:${col}"></b></i><span>${s}%</span></div>`;
    h += POL.why.length ? `<div class="pwhy">${POL.why.slice(0, 6).map(w => `<span class="${w.n > 0 ? 'wgood' : 'wbad'}">${w.n > 0 ? '+' : ''}${w.n} ${w.t}</span>`).join('')}</div>` : '';
    h += `<p class="idim">${s < 30 ? 'אנשים שאיבדו את האמון עוזבים את השבט. ' : s > 75 ? 'כשסומכים עליך, יותר אנשים באים לגור בכפר. ' : ''}אוכל במחסן, ניצחונות, שלום, בני ברית, סחר וחתונות מחזקים את האמון. רעב, פשיטות שנכשלו ומלחמות ארוכות מחלישים אותו.</p>`;
  }
  if (known.length) {
    h += '<h3>👑 ראשי השבטים</h3>';
    for (const i of known) {
      const c = HUNT.camps[i], ch = chiefOfCamp(c), tr = Math.round(campTrust(i)), T = polTr(i);
      h += `<div class="oact"><i style="background:${TRIBEC[tribeKeyOf(c)]}"></i><div><b>${c.tribe} <small>${ch ? ch.name : 'אין ראש שבט'} · ${T.n}</small></b><span>${T.d} · ${atWar(i) ? '⚔️ במלחמה' : relWord(i, tr)} (${tr > 0 ? '+' : ''}${tr})${polAllied('own', i) ? ' · 🤝 בני ברית' : ''}${POL.trade[i] ? ` · 🔁 ${DEALS[POL.trade[i].k].n}` : ''}</span></div></div>`;
    }
    // the map of friendships and wars
    const lines = [];
    for (let a = 0; a < known.length; a++) for (let b = a + 1; b < known.length; b++) {
      const i = known[a], j = known[b];
      if (polAllied(i, j)) lines.push(`<span class="wgood">🤝 ${campName(i)} ו${campName(j)}</span>`);
      else if (atWarK(i, j)) lines.push(`<span class="wbad">⚔️ ${campName(i)} נגד ${campName(j)}</span>`);
      else if (isVassal(i, j) || isVassal(j, i)) lines.push(`<span>🏳️ ${isVassal(i, j) ? `${campName(i)} נתינים של ${campName(j)}` : `${campName(j)} נתינים של ${campName(i)}`}</span>`);
    }
    h += `<h3>🗺️ בין השבטים</h3>${lines.length ? `<div class="pwhy">${lines.join('')}</div>` : '<p class="idim">אין כרגע בריתות או מלחמות בין השבטים שאתם מכירים.</p>'}`;
  } else h += '<p class="idim">כשתמצאו שבטים, תראו כאן את ראשי השבטים, את הבריתות ואת המלחמות ביניהם.</p>';
  h += '<p class="idim">ברית: בני ברית לא תוקפים זה את זה, שולחים לוחמים כשפושטים על הכפר, ומצטרפים למלחמות. מי שתוקף שבט עם בני ברית, נלחם גם בהם. ראש שבט תוקפני כועס מהר, שוחר שלום מעדיף שיחות, חמדן אוהב מתנות וסחר, גאה לא סובל עלבון, ונבון שומר אמונים.</p>';
  return h;
}
(function () {
  const st = document.createElement('style');
  st.textContent = '.pwhy{display:flex;flex-wrap:wrap;gap:4px 12px;font-size:12.5px;margin:4px 0 6px}.pwhy span{white-space:nowrap}';
  document.head.appendChild(st);
})();
