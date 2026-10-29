// ================= FAMILIES BY CHOICE, TERRITORIES, AND THE HUNTER'S TRIBE =================
// ---------- pregnancy: optional, and as many times as you like ----------
const GEST = { hunter: 6, piranha: 2, arapaima: 3, eel: 3, macaw: 3, toucan: 3, harpy: 3, frog: 2 };
const gestOf = () => GEST[P.spId] || 4;
const pregWord = () => P.bird || P.spId === 'frog' || P.fish ? 'ביצים' : 'הריון';
function canPreg(m) { return !!m && m.alive && !m.preg && (m === P.a ? P.a.sex === 'f' && aliveMates().length > 0 : P.a.sex === 'm' && m.isPartner); }
function startPreg(m) {
  if (!canPreg(m)) return;
  if (P.cubs.filter(c => c.alive).length >= 30) { UI.notify('יש כבר הרבה צאצאים קטנים. כשחלק יגדלו אפשר להביא עוד'); return; }
  m.preg = gestOf(); if (m === P.a) P.preg = m.preg;
  const mins = Math.round(m.preg * HOUR * 2 / 60);
  UI.notify(m === P.a ? `את ${P.bird || P.fish || P.spId === 'frog' ? 'מטילה ביצים בקרוב' : 'בהריון'}! הצאצאים יגיעו בעוד כ-${mins} דקות` : `${m.name} ${P.bird || P.fish || P.spId === 'frog' ? 'תטיל ביצים בקרוב' : 'בהריון'}! הצאצאים יגיעו בעוד כ-${mins} דקות`, 'love');
  FX.spawn('heart', m.pos.x, m.pos.y + m.height, m.pos.z, 8); AUD.play('heart'); PROG.flags.preg = 1;
}
function askPreg(t) {
  if (G.mode !== 'play' || !t || !t.alive) return;
  if ([...document.querySelectorAll('.ov')].some(o => !o.hidden && o.id !== 'pregov') || G.paused) { setTimeout(() => askPreg(t), 1500); return; }
  const target = P.a.sex === 'f' ? P.a : t;
  if (!canPreg(target)) return;
  const el = uiCard('pregov', `<h2>${t.name} ${heb(t, 'הצטרף', 'הצטרפה')} אליך</h2><p>להביא צאצאים? אפשר להחליט גם אחר כך, בכפתור ⓘ בלשונית משפחה. אין הגבלה על מספר ההריונות.</p><div class="btns"><button class="btn pri" data-a="yes">כן, להביא צאצאים</button><button class="btn" data-a="no">לא עכשיו</button></div>`);
  el.onclick = e => { const b = e.target.closest('button'); if (!b) return; closeCard('pregov'); if (b.dataset.a === 'yes') startPreg(target); };
}
function pregTick(gh) {
  if (P.a && P.a.preg) { P.a.preg -= gh; P.preg = P.a.preg; if (P.a.preg <= 0) { P.a.preg = 0; P.preg = 0; birth(P.a); } }
  for (const m of aliveMates()) if (m.preg) { m.preg -= gh; if (m.preg <= 0) { m.preg = 0; birth(m); } }
}
function pregRows() {
  const out = [];
  if (P.a.sex === 'f') {
    if (P.a.preg) out.push(`<p class="idim">${pregWord()}: ${Math.round((1 - P.a.preg / gestOf()) * 100)}%</p>`);
    else if (aliveMates().length) out.push(`<div class="btns"><button class="btn pri" data-preg="self">${P.bird || P.fish || P.spId === 'frog' ? 'להטיל ביצים' : 'להיכנס להריון'}</button></div>`);
  } else aliveMates().forEach((m, i) => {
    out.push(m.preg ? `<p class="idim">${m.name}: ${pregWord()} ${Math.round((1 - m.preg / gestOf()) * 100)}%</p>` : `<div class="btns"><button class="btn pri" data-preg="${i}">להביא צאצאים עם ${m.name}</button></div>`);
  });
  return out.join('');
}

// ---------- territories: predators attack only if you come into their space, attack them, or bother them ----------
const TERRR = { jaguar: 30, puma: 26, ocelot: 12, caiman: 14, anaconda: 10, bushdog: 22 };
const TERR = { t: 0, told: false };
DANGER.off = true;
function territoryUpdate(dt) {
  TERR.t -= dt; if (TERR.t > 0) return; TERR.t = 0.5;
  const p = P.a; if (G.mode !== 'play' || !p || !p.alive || P.sleeping || (P.bird && P.flying) || (P.growth || 1) >= 2.6) return;
  shQuery(p.pos.x, p.pos.z, 34, (b, d) => {
    const R = TERRR[b.spId];
    if (!R || !b.alive || b.isPlayer || b.young || b.pet || b.isPartner || b.cub || b.escort || b.tribe || b.legend || b.spId === P.spId || b.stunT > 0) return;
    if (['fight', 'flee', 'eat', 'sleep', 'hunt', 'held'].includes(b.state) || preys(p, b)) { b.terrWarn = 0; return; }
    const dh = Math.hypot(p.pos.x - b.home.x, p.pos.z - b.home.z);
    if (dh > R || d > 22) { b.terrWarn = 0; return; }
    if (!b.terrWarn) {
      b.terrWarn = G.t; b.stT = 4; b.yaw = Math.atan2(p.pos.x - b.pos.x, p.pos.z - b.pos.z); b.pose = 'idle';
      AUD.at(b.sp.call || 'growl', b.pos, 1); combatText(`ה${b.sp.he} נוהם: זה השטח שלו`, 'bad');
      if (!TERR.told) { TERR.told = true; UI.notify('נכנסת לשטח של טורף. אם לא תתרחק, הוא יתקוף', 'bad'); }
      return;
    }
    if (G.t - b.terrWarn > 3.5 && dh < R * 0.85) { b.state = 'fight'; b.foe = p; b.terrWarn = 0; combatText(`ה${b.sp.he} תוקף!`, 'bad'); }
  });
}

// ---------- hunters: they can die, the camps refill, and the player can dive with a spear ----------
function hunterKilled(t, src) {
  if (t.camp && t.camp.bandit) banditBounty(t, src);
  for (const c of HUNT.camps) { const i = (c.hunters || []).indexOf(t); if (i >= 0) c.hunters.splice(i, 1); }
  if (P.a && dist2(t.pos, P.a.pos) < 90) UI.notify(`${t.name || 'צייד'} נהרג על ידי ${src.sp.he}`, P.human ? 'bad' : '');
}
function campsRefill() { for (const c of HUNT.camps) if (!c.own && !c.gone && (c.hunters || []).filter(h => h.alive).length < 3) spawnHunter(c, false); }
function diveStab() {
  const a = P.a, fx = Math.sin(a.yaw), fz = Math.cos(a.yaw); let best = null, bd = 2.6;
  shQuery(a.pos.x, a.pos.z, 3, (b, d) => { if (b === a || !b.alive || b.pet === a || b.tribe || b.isPartner || b.cub) return; const dd = Math.hypot(b.pos.x - a.pos.x, b.pos.y - a.pos.y, b.pos.z - a.pos.z), dot = ((b.pos.x - a.pos.x) * fx + (b.pos.z - a.pos.z) * fz) / (Math.hypot(b.pos.x - a.pos.x, b.pos.z - a.pos.z) || 1); if (dot > 0.2 && dd < bd) { bd = dd; best = b; } });
  P.atkCD = 0.6; a.anim.atk = 0.45; AUD.play('swipe', 0.5);
  if (!best) { combatText('דקירה באוויר', 'bad'); return; }
  strike(best, 1.5, false); FX.spawn('splash', best.pos.x, best.pos.y, best.pos.z, 4); PROG.flags.diveStab = 1;
}

// ---------- the hunter's tribe ----------
const TRIBE = { adults: [], t: 0 };
const tribeAll = () => [...aliveMates(), ...P.cubs.filter(c => c.alive), ...TRIBE.adults.filter(b => b.alive && !b.gone)];
function tribeReset() { TRIBE.adults = []; RAID.t = rr(200, 300); RAID.pred = null; }
function tribeJoin(t) {
  for (const c of HUNT.camps) { const i = (c.hunters || []).indexOf(t); if (i >= 0) c.hunters.splice(i, 1); }
  Object.assign(t, { brain: 'tribe', tribe: true, hunter: false, socialExtra: true, role: t.role || (t.young ? 'camp' : 'follow') });
  if (!t.name) t.name = pick(NAMES[t.sex]);
}
function tribeAdult(c) { if (!P.human) return; tribeJoin(c); c.role = 'follow'; if (!TRIBE.adults.includes(c)) TRIBE.adults.push(c); }
function tribeEnsure() { if (!P.human) return; for (const b of [...aliveMates(), ...P.cubs.filter(c => c.alive)]) if (b.brain !== 'tribe') tribeJoin(b); }
function tribeSave() { return TRIBE.adults.filter(b => b.alive && !b.gone).map(b => ({ n: b.name, s: b.sex, r: b.role || 'follow' })); }
function tribeLoad(list) {
  for (const t0 of list || []) {
    const b = new Animal('hunter', P.a.pos.x + rr(-3, 3), P.a.pos.z + rr(-3, 3), { sex: t0.s, tpl: t0.s === 'f' ? 'hunter3' : 'hunter2' }); b.ground(1, true);
    b.name = t0.n; tribeJoin(b); b.role = t0.r || 'follow'; TRIBE.adults.push(b);
  }
}
function tribeFight(a, t, dt) {
  const d = dist2(a.pos, t.pos);
  if (a.young) { const dx = a.pos.x - t.pos.x, dz = a.pos.z - t.pos.z, l = Math.hypot(dx, dz) || 1; a.move(dx / l, dz / l, a.sp.run * 0.8, dt); a.pose = 'move'; return; }
  if (d > 5 && (a.spearCD || 0) <= 0) { hunterThrow(a, t, 'spear'); a.spearCD = rr(2.6, 3.8); return; }
  if (d > 1.6) { const dx = t.pos.x - a.pos.x, dz = t.pos.z - a.pos.z; a.move(dx / d, dz / d, a.sp.run, dt); a.pose = 'move'; return; }
  a.move(0, 0, 0, dt); a.yaw = Math.atan2(t.pos.x - a.pos.x, t.pos.z - a.pos.z);
  if ((a.atkCD || 0) <= 0) { a.atkCD = 1; a.anim.atk = 0.45; hurt(t, 12 * a.scale, a); }
}
BRAIN.tribe = function (a, dt) {
  a.spearCD = (a.spearCD || 0) - dt; a.atkCD = (a.atkCD || 0) - dt;
  if (a.windup > 0) {
    const t = a.throwTgt; a.windup -= dt;
    if (t && t.alive) a.yaw += angDiff(a.yaw, Math.atan2(t.pos.x - a.pos.x, t.pos.z - a.pos.z)) * Math.min(1, dt * 8);
    a.move(0, 0, 0, dt); a.pose = 'aim'; if (a.windup <= 0) hunterLaunch(a); return;
  }
  const p = P.a, c = homeCamp();
  if (a.state === 'fight' && a.foe && a.foe.alive && dist2(a.foe.pos, a.pos) < 35) { tribeFight(a, a.foe, dt); return; }
  if (a.state === 'fight') { a.state = 'follow'; a.foe = null; }
  const atCamp = a.role === 'guard' || (a.young && P.cubsMode !== 'follow' && p && c && Math.hypot(p.pos.x - c.x, p.pos.z - c.z) > 25);
  if (atCamp && c) {
    let th = null; shQuery(c.x, c.z, 20, b => { if (!th && b.alive && !b.isPlayer && !b.tribe && !b.pet && (b.sp.ai === 'pred' || b.sp.ai === 'pack' || b.sp.ai === 'croc') && !b.young) th = b; });
    if (th && !a.young) { a.state = 'fight'; a.foe = th; return; }
    if (!a.post || Math.hypot(a.post.x - a.pos.x, a.post.z - a.pos.z) < 0.8 || (a.postT = (a.postT || 0) - dt) <= 0) { const ang = rng() * TAU, r = rr(2, 6.5); a.post = { x: c.x + Math.cos(ang) * r, z: c.z + Math.sin(ang) * r }; a.postT = rr(6, 14); }
    const dx = a.post.x - a.pos.x, dz = a.post.z - a.pos.z, d = Math.hypot(dx, dz);
    if (d > 0.8) { a.move(dx / d, dz / d, a.sp.walk, dt); a.pose = 'move'; } else { a.move(0, 0, 0, dt); a.pose = isNight() ? 'sleep' : 'idle'; }
    return;
  }
  if (!p) return;
  if (!a.young && P.packT > 0 && P.packTarget && P.packTarget.alive && dist2(P.packTarget.pos, a.pos) < 30) { a.state = 'fight'; a.foe = P.packTarget; return; }
  const slot = a.slot ?? (a.slot = (rng() * 6) | 0), ang = p.yaw + Math.PI + (slot % 2 ? 0.8 : -0.8), r = 2.4 + (slot >> 1) * 1.1;
  const x = p.pos.x + Math.sin(ang) * r, z = p.pos.z + Math.cos(ang) * r, d = Math.hypot(x - a.pos.x, z - a.pos.z);
  if (d > 60) { a.pos.set(x, 0, z); a.ground(1, true); }
  if (d > 1) { a.move((x - a.pos.x) / d, (z - a.pos.z) / d, d > 7 ? a.sp.run : Math.max(a.sp.walk, (p.speed || 0)), dt); a.pose = a.swimming ? 'swim' : 'move'; }
  else { a.move(0, 0, 0, dt); a.pose = P.sleeping ? 'sleep' : 'idle'; }
};
// an unguarded camp attracts raiders while you are away
const RAID = { t: 260, pred: null };
function campRaidUpdate(dt) {
  if (!P.human || G.mode !== 'play' || !P.a || !P.a.alive) return;
  { const hc = homeCamp(); if (!hc || !hc.own) return; }
  const c = homeCamp(); if (!c || CAMPH.up.fence) return;
  if (Math.hypot(P.a.pos.x - c.x, P.a.pos.z - c.z) < 60) return;
  RAID.t -= dt * (isNight() ? 1.5 : 1); if (RAID.t > 0) return; RAID.t = rr(200, 320);
  const guard = tribeAll().find(m => m.role === 'guard' && !m.young);
  let pred = null; shQuery(c.x, c.z, 170, b => { if (!pred && b.alive && !b.isPlayer && (b.spId === 'jaguar' || b.spId === 'puma') && !b.legend && b.state !== 'fight') pred = b; });
  if (!pred) return;
  const victims = [...(c.cowGroup ? c.cowGroup.members.filter(m => m.alive) : []), ...P.cubs.filter(m => m.alive && P.cubsMode !== 'follow')];
  const v = victims.length ? pick(victims) : null;
  if (v) { pred.state = 'hunt'; pred.target = v; pred.stT = 60; } else if (P.inv.fish > 0) P.inv.fish = Math.max(0, P.inv.fish - 2);
  RAID.pred = pred; P.pings.push({ x: c.x, z: c.z, t: 15 });
  if (guard) { guard.state = 'fight'; guard.foe = pred; UI.notify(`${pred.sp.he} מתקרב למחנה. ${guard.name} ${heb(guard, 'שומר', 'שומרת')} עליו`, ''); }
  else UI.notify(`${pred.sp.he} פושט על המחנה! אין שם שומר`, 'bad');
}
// ---------- the new camp screen ----------
function campMenu() {
  const c = homeCamp(), mem = tribeAll(), guard = mem.find(m => m.role === 'guard' && !m.young);
  const roleTxt = m => m.young ? `${heb(m, 'ילד', 'ילדה')} · ${heb(m, 'גדל', 'גדלה')} ${Math.round(clamp((m.age || 0) / 60, 0, 1) * 100)}%` : m.role === 'guard' ? heb(m, 'שומר במחנה', 'שומרת במחנה') : heb(m, 'בא איתך', 'באה איתך');
  const rows = mem.map((m, i) => `<div class="srow"><div><b>${m.name}</b> <small>${m.isPartner ? heb(m, 'בן זוג', 'בת זוג') : m.young ? '' : heb(m, 'בן השבט', 'בת השבט')}</small><span>${roleTxt(m)}</span></div>${m.young ? '' : `<div class="sbtns"><button class="btn${m.role === 'guard' ? '' : ' pri'}" data-g="${i}">${m.role === 'guard' ? 'שיבוא איתי' : 'להשאיר שומר'}</button></div>`}</div>`).join('') || '<p class="idim">עוד אין שבט. אפשר לחזר אחרי ציידת או צייד מהמחנות, ולהקים משפחה.</p>';
  const cows = c && c.cowGroup ? c.cowGroup.members.filter(m => m.alive).length : 0;
  const ICO = { fence: '🪵', fire: '🔥', rack: '🗡️', dry: '🐟', shelter: '⛺' }, chip = (n, ic, ok) => `<span class="cchip${ok ? '' : ' no'}">${ic} ${n}</span>`;
  const ups = '<div class="ugrid">' + UPG.map(u => { const done = CAMPH.up[u.id], ok = canPay(u.cost); return `<div class="ucard${done ? ' done' : ''}"><div class="uic">${ICO[u.id] || '🏕️'}</div><b>${u.n}</b><span>${u.d}</span><div class="ucost">${u.cost.wood ? chip(u.cost.wood, '🪵', P.inv.wood >= u.cost.wood) : ''}${u.cost.fish ? chip(u.cost.fish, '🐟', P.inv.fish >= u.cost.fish) : ''}</div>${done ? '<div class="ubuilt">נבנה ✓</div>' : `<button class="btn${ok ? ' pri' : ''}" data-u="${u.id}"${ok ? '' : ' disabled'}>${ok ? 'לבנות' : 'חסרים חומרים'}</button>`}</div>`; }).join('') + '</div>';
  const status = !c || !c.own ? `אתה איש שבט ב${c ? c.tribe || 'מחנה' : 'מחנה'}. ראש השבט: ${chiefName(c)}` : CAMPH.up.walls ? 'החומה מגינה על המחנה' : CAMPH.up.fence ? 'הגדר מגינה על המחנה' : guard ? `${guard.name} ${heb(guard, 'שומר', 'שומרת')} על המחנה` : 'אין שמירה: כשמתרחקים, טורפים עלולים לפשוט על המחנה';
  const el = uiCard('campov', `<div class="itabs"><b style="flex:1;font-size:18px">${campTitle(c)}</b><button class="ix" data-a="close" aria-label="סגירה">✕</button></div>` +
    `<p class="idim">${status}</p>${c && c.own ? levelHtml() : ''}<h3 style="color:var(--gold);margin:8px 0 2px">השבט</h3>${rows}` +
    `<h3 style="color:var(--gold);margin:12px 0 2px">מחסן המחנה</h3><div class="cstock"><span class="cchip">🍖 ${boxStore().cooked} מבושל</span><span class="cchip">🥩 ${CAMPH.store.meat} בשר</span><span class="cchip">🐟 ${CAMPH.store.fish} דגים</span><span class="cchip">🪵 ${CAMPH.store.wood} עצים</span><span class="cchip">🐄 ${cows} פרות</span></div><p class="idim">מה שאיתך מופיע בארגז הכלים 🧰</p>` +
    `${c && c.own ? '<h3 style="color:var(--gold);margin:12px 0 2px">שדרוגים</h3>' + ups : memberHtml(c)}${foundHtml()}`);
  el.querySelector('.card').style.cssText = 'width:min(560px,94vw);max-height:92vh;overflow:auto';
  el.onclick = e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    if (b.dataset.g) { const m = mem[+b.dataset.g]; if (m) { m.role = m.role === 'guard' ? 'follow' : 'guard'; m.state = 'follow'; m.foe = null; UI.notify(m.role === 'guard' ? `${m.name} ${heb(m, 'נשאר', 'נשארת')} לשמור על המחנה` : `${m.name} ${heb(m, 'בא', 'באה')} איתך`, 'good'); saveGame(); } campMenu(); return; }
    if (b.dataset.u) { const u = UPG.find(q => q.id === b.dataset.u); if (u && canPay(u.cost)) { takeRes('wood', u.cost.wood || 0); takeRes('fish', u.cost.fish || 0); CAMPH.up[u.id] = 1; applyCampUp(u.id, true); PROG.flags.campup = 1; UI.notify(`בנית: ${u.n}`, 'good'); AUD.play('chime'); saveGame(); } campMenu(); return; }
    if (b.dataset.a === 'found') { FOUND.mode = true; closeCard('campov'); UI.notify('צריך ללכת למקום חדש, לפחות 100 מטר מכל מחנה, ושם ללחוץ על כפתור הזהב "להקים מחנה"', 'good'); return; }
    if (b.dataset.a === 'foundCancel') { FOUND.mode = false; campMenu(); return; }
    if (b.dataset.a === 'close') closeCard('campov');
  };
}
// ---------- legends in the info hub ----------
function legendsHtml() {
  return '<h3>אגדות הג׳ונגל</h3>' + LEGENDS.map(L => {
    const done = PROG.flags['legend_' + L.id], at = L.a && L.a.alive ? L.a.pos : L.lair;
    return `<div class="irow"><div><b>${L.name}</b> <small>${L.title}</small><span>${done ? 'הובס ✓' : at ? `${whereIs({ pos: at })}${L.a && L.a.alive ? '' : ' (שמועה)'}` : 'עוד לא נראה'}</span></div>${!done && at ? `<button class="btn" data-leg="${L.id}" style="padding:6px 12px;font-size:13px">ללכת לשם</button>` : ''}</div>`;
  }).join('');
}
function tribeUpdate(dt) {
  TRIBE.t -= dt; if (TRIBE.t <= 0) { TRIBE.t = 1; tribeEnsure(); }
  territoryUpdate(dt); campRaidUpdate(dt);
}

// ================= STATUS BUTTON, BIGGER CAMPS, LAKE FISH, YOUR OWN TRIBE, AND CHIEFS =================
// ---------- the status card becomes a small button on touch screens ----------
const VP = { el: null, openT: 0 };
(function () {
  const st = document.createElement('style');
  st.textContent = `#vPill{display:none}
body.touch #vPill{display:flex;position:absolute;left:calc(env(safe-area-inset-left,0px) + 108px);top:calc(env(safe-area-inset-top,0px) + 10px);gap:4px;align-items:flex-end;padding:6px 8px;border-radius:12px;background:rgba(18,22,16,.6);border:1px solid rgba(255,255,255,.14);pointer-events:auto;z-index:6;height:40px;box-sizing:border-box;cursor:pointer}
body.touch #vPill i{display:block;width:7px;height:26px;border-radius:4px;background:rgba(255,255,255,.18);position:relative;overflow:hidden}
body.touch #vPill i[hidden]{display:none}
body.touch #vPill i b{position:absolute;left:0;right:0;bottom:0;border-radius:4px}
#vPill .hp b{background:#d8473a}#vPill .food b{background:#e08a3a}#vPill .water b{background:#3a8ad8}#vPill .stam b{background:#b8a83a}#vPill .air b{background:#7ad8e8}
#vPill.low{animation:vpl 1s infinite}@keyframes vpl{50%{box-shadow:0 0 0 3px rgba(216,71,58,.75)}}
body.touch:not(.vitalsOpen) #vitals{display:none!important}
body.touch.vitalsOpen #vitals{top:calc(env(safe-area-inset-top,0px) + 56px)!important;left:calc(env(safe-area-inset-left,0px) + 108px)!important;z-index:7}
.ugrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin:6px 0}
.ucard{border:1px solid var(--line);border-radius:12px;padding:9px 10px;display:flex;flex-direction:column;gap:4px;background:rgba(127,127,127,.06)}
.ucard.done{border-color:rgba(109,190,106,.6);background:rgba(109,190,106,.08)}
.ucard .uic{font-size:22px;line-height:1}.ucard b{font-size:15px}.ucard span{font-size:12px;color:var(--dim);line-height:1.35}
.ucard .ucost{display:flex;gap:5px;flex-wrap:wrap}.cchip{font-size:12px;padding:2px 8px;border-radius:999px;background:rgba(232,176,75,.18);border:1px solid rgba(232,176,75,.4)}
.cchip.no{background:rgba(216,71,58,.12);border-color:rgba(216,71,58,.45)}
.ucard .btn{padding:6px 10px;font-size:13px;margin-top:2px}.ubuilt{font-size:13px;color:#6dbe6a;font-weight:600}
.cstock{display:flex;gap:6px;flex-wrap:wrap;margin:4px 0}`;
  document.head.appendChild(st);
})();
function vpillUpdate(dt) {
  if (!VP.el) {
    const hud = document.getElementById('hud'); if (!hud) return;
    VP.el = document.createElement('div'); VP.el.id = 'vPill'; VP.el.setAttribute('role', 'button'); VP.el.setAttribute('aria-label', 'מצב');
    VP.el.innerHTML = '<i class="hp"><b></b></i><i class="food"><b></b></i><i class="water"><b></b></i><i class="stam"><b></b></i><i class="air" hidden><b></b></i>';
    hud.appendChild(VP.el);
    VP.el.addEventListener('pointerdown', e => { e.stopPropagation(); const on = !document.body.classList.contains('vitalsOpen'); document.body.classList.toggle('vitalsOpen', on); VP.openT = on ? 6 : 0; });
  }
  const a = P.a; if (!a || G.mode !== 'play') return;
  const v = [a.hp / a.maxHp, P.food / 100, P.water / 100, P.stam / 100, P.air / 100], bs = VP.el.querySelectorAll('b');
  v.forEach((x, i) => { if (bs[i]) bs[i].style.height = `${Math.round(clamp(x, 0, 1) * 100)}%`; });
  VP.el.lastChild.hidden = !(a.swimming && P.dive);
  VP.el.classList.toggle('low', v[0] < 0.3 || v[1] < 0.2 || v[2] < 0.2);
  if (VP.openT > 0) { VP.openT -= dt; if (VP.openT <= 0) document.body.classList.remove('vitalsOpen'); }
}

// ---------- a deep-jungle camp, bigger camps, and fish in the lake ----------
function pickDeepCamp() {
  for (let t = 0; t < 1400 && !HUNT.camps.some(c => c.deep); t++) {
    const x = rr(-380, 380), z = rr(-380, 380);
    if (!inBounds(x, z) || waterDepth(x, z) > 0) continue;
    const r = nearestOnPoly(x, z, RIVER); if (r[0] < 120) continue;
    const h = getH(x, z); if (h < 1 || h > 45 || getNY(x, z) < 0.95) continue;
    let rough = 0; for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; rough = Math.max(rough, Math.abs(getH(x + Math.cos(a) * 7, z + Math.sin(a) * 7) - h)); }
    if (rough > 1.1) continue;
    if (Math.hypot(x - TEP.x, z - TEP.z) < 150 || (LAKE && Math.hypot(x - LAKE.x, z - LAKE.z) < 90)) continue;
    if (HUNT.camps.some(c => Math.hypot(c.x - x, c.z - z) < 200)) continue;
    const i = Math.floor(r[1]), f = r[1] - i, A = RIVER[i], B = RIVER[Math.min(RIVER.length - 1, i + 1)];
    HUNT.camps.push({ x, z, y: h, rx: A.x + (B.x - A.x) * f, rz: A.z + (B.z - A.z) * f, hunters: [], flames: [], glow: null, deep: true });
  }
}
function spawnLakeFish() {
  if (!LAKE) return;
  const inLake = p => Math.hypot(p.x - LAKE.x, p.z - LAKE.z) < LAKE.r - 4;
  for (const [id, n] of [['pacu', 8], ['pacu', 7], ['piranha', 6], ['arapaima', 1]]) { try { spawnGroup(id, n, inLake); } catch (e) { } }
  let have = ANIMALS.filter(a => a.alive && a.tpl.kind === 'fish' && inLake(a.pos)).length;
  for (let t = 0; t < 300 && have < 6; t++) {
    const ang = rng() * TAU, d = rng() * (LAKE.r - 5), x = LAKE.x + Math.cos(ang) * d, z = LAKE.z + Math.sin(ang) * d, wd = waterDepth(x, z);
    if (wd < 0.9) continue;
    const f = new Animal('arapaima', x, z, {}); f.pos.y = waterAt(x, z) - wd * 0.5; have++;
  }
}

// ---------- founding your own tribe ----------
const FOUND = { mode: false };
CTXT.found = ['up', 'להקים מחנה', 'להקים כאן מחנה חדש'];
const canFound = () => P.human && aliveMates().length > 0;
function foundCtx() {
  if (!FOUND.mode || !P.human) return null; const a = P.a;
  if (a.swimming || waterDepth(a.pos.x, a.pos.z) > 0 || getNY(a.pos.x, a.pos.z) < 0.93) return null;
  if (HUNT.camps.some(c => Math.hypot(c.x - a.pos.x, c.z - a.pos.z) < 100)) return null;
  return 'found';
}
function foundCampAt(x, z, silent) {
  let c = HUNT.camps.find(q => q.own && Math.hypot(q.x - x, q.z - z) < 5);
  if (!c) {
    const r = nearestOnPoly(x, z, RIVER), i = Math.floor(r[1]), f = r[1] - i, A = RIVER[i], B = RIVER[Math.min(RIVER.length - 1, i + 1)];
    c = { x, z, y: getH(x, z), rx: A.x + (B.x - A.x) * f, rz: A.z + (B.z - A.z) * f, hunters: [], flames: [], glow: null, own: true };
    buildCamp(c); HUNT.camps.push(c); POI.push({ x, z, n: 'המחנה של השבט שלך', camp: true });
    const grp = { kind: 'herd', members: [], leader: null, cows: c }; GROUPS.push(grp); c.cowGroup = grp; addCow(c, grp); addCow(c, grp);
  }
  clearCampUps(); CAMPH.camp = c; if (!silent) CAMPH.up = {}; FOUND.mode = false;
  for (const m of tribeAll()) if (m.home) m.home.set(x, 0, z);
  if (!silent) { PROG.flags.found = 1; UI.big('שבט חדש!', 'הקמת מחנה משלך. השבט עובר לגור כאן, ושתי פרות כבר רועות ליד'); AUD.play('chime'); saveGame(); }
  return c;
}
function foundHtml() {
  if (!P.human) return '';
  if (FOUND.mode) return '<h3 style="color:var(--gold);margin:12px 0 2px">שבט חדש</h3><p class="idim">צריך ללכת למקום שטוח, לפחות 100 מטר מכל מחנה. שם כפתור הזהב יציע "להקים מחנה".</p><div class="btns"><button class="btn" data-a="foundCancel">לבטל</button></div>';
  if (!canFound()) return '<h3 style="color:var(--gold);margin:12px 0 2px">שבט חדש</h3><p class="idim">כשתמצא אישה, בהסכמת ראש השבט שלה, אפשר לעזוב ולהקים מחנה משלך.</p>';
  return '<h3 style="color:var(--gold);margin:12px 0 2px">שבט חדש</h3><p class="idim">אפשר לעזוב את המחנה הזה ולהקים שבט חדש במקום אחר. כל המשפחה עוברת איתך.</p><div class="btns"><button class="btn pri" data-a="found">לעזוב ולהקים שבט חדש</button></div>';
}

// ---------- taking a wife from another tribe: ask, bring a gift, or duel the chief ----------
function chiefOf(t) {
  for (const c of HUNT.camps) if ((c.hunters || []).includes(t)) return c.hunters.find(h => h.alive && h.elite && h !== t) || null;
  return null;
}
const DUEL = { ch: null, t: null, cd: 0 };
function consentAsk(t) {
  const ch = chiefOf(t); if (!ch) return false;
  const cn = ch.name || 'הצייד הוותיק', gift = P.inv.fish >= 3 ? { fish: 3, txt: '3 דגים' } : P.inv.wood >= 6 ? { wood: 6, txt: '6 עצים' } : null;
  const el = uiCard('consentov', `<h2>${t.name} מהשבט של ${cn}</h2><p>כדי שהיא תצטרף לשבט שלך צריך את הסכמת ראש השבט. לפעמים הוא מסכים סתם, לפעמים צריך מתנה, ואפשר גם להילחם בו.</p>` +
    `<div class="btns" style="flex-wrap:wrap"><button class="btn pri" data-a="ask"${t.asked ? ' disabled' : ''}>${t.asked ? 'כבר ביקשת' : 'לבקש רשות'}</button>` +
    `<button class="btn${gift ? ' pri' : ''}" data-a="gift"${gift ? '' : ' disabled'}>${gift ? `להביא מתנה: ${gift.txt}` : 'מתנה: צריך 3 דגים או 6 עצים'}</button>` +
    `<button class="btn" data-a="fight">להילחם בו</button><button class="btn" data-a="close">לוותר</button></div>`);
  el.onclick = e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    if (b.dataset.a === 'ask') {
      t.asked = true;
      if (rng() < 0.3 + Math.min(0.4, (P.renown || 0) * 0.05)) { closeCard('consentov'); consentGiven(t, `${cn} מסכים בלי לבקש כלום`); }
      else { UI.notify(`${cn} מסרב. אפשר להביא מתנה או להילחם בו`, 'bad'); consentAsk(t); }
      return;
    }
    if (b.dataset.a === 'gift' && gift) { P.inv.fish -= gift.fish || 0; P.inv.wood -= gift.wood || 0; closeCard('consentov'); consentGiven(t, `${cn} קיבל את המתנה ומסכים`); return; }
    if (b.dataset.a === 'fight') { closeCard('consentov'); startDuel(ch, t); return; }
    closeCard('consentov');
  };
  return true;
}
function consentGiven(t, msg) {
  t.consent = true; UI.notify(`${msg}. ${t.name} מצטרפת לשבט שלך`, 'love'); bond(t); PROG.flags.consent = 1;
}
function startDuel(ch, t) {
  DUEL.ch = ch; DUEL.t = t; DUEL.cd = 1.5; ch.duel = true; ch.stunT = 0.2;
  UI.big('דו-קרב!', `${ch.name || 'הצייד הוותיק'} נלחם על ${t.name}. מי שנחלש ראשון נכנע`); AUD.play('growl', 0.6);
}
function duelUpdate(dt) {
  const ch = DUEL.ch; if (!ch) return;
  const a = P.a, end = (win) => {
    ch.duel = false; DUEL.ch = null; ch.state = 'idle'; ch.foe = null;
    if (win) { P.renown = (P.renown || 0) + 1; consentGiven(DUEL.t, `${ch.name || 'הצייד הוותיק'} נכנע`); }
    else UI.notify('הפסדת בדו-קרב. אפשר לנסות שוב כשתתחזק', 'bad');
  };
  if (!ch.alive || !a || !a.alive || G.mode !== 'play') { if (ch.alive) ch.duel = false; DUEL.ch = null; return; }
  if (ch.hp < ch.maxHp * 0.3) { ch.hp = Math.max(ch.hp, 1); end(true); return; }
  if (a.hp < a.maxHp * 0.25) { end(false); return; }
  ch.stunT = 0.15;
  const dx = a.pos.x - ch.pos.x, dz = a.pos.z - ch.pos.z, d = Math.hypot(dx, dz) || 1;
  ch.yaw = Math.atan2(dx, dz);
  if (d > 1.7) { ch.move(dx / d, dz / d, 3.6, dt); ch.pose = 'move'; } else { ch.pose = 'idle'; }
  DUEL.cd -= dt;
  if (DUEL.cd <= 0 && d < 2) { DUEL.cd = rr(1.1, 1.6); ch.anim.atk = 0.45; hurt(a, rr(9, 14), ch); AUD.play('bite', 0.5); }
}
function tribe2Update(dt) { vpillUpdate(dt); duelUpdate(dt); }
function foundCamp() { return foundCampAt(P.a.pos.x, P.a.pos.z, false); }
MISSIONS.hunter.splice(Math.max(0, MISSIONS.hunter.findIndex(m => m.id === 'hunter.disc14')), 0, MS('hunter.found', 'להקים שבט חדש עם מחנה משלך', 150, FL('found')), MS('hunter.wife2', 'לקחת אישה בהסכמת ראש שבט', 120, FL('consent')));
for (const m of MISSIONS.hunter) GOAL[m.id] = m;

// ================= FROM TRIBESMAN TO FOUNDER: chiefs, your own camp, and slowly building it strong =================
UPG.push(
  { id: 'tents', n: 'אוהלים נוספים', d: 'מקום למשפחות נוספות. בני השבט שנחים במחנה מחלימים מהר', cost: { wood: 6 } },
  { id: 'pen', n: 'מכלאה לפרות', d: 'טורפים מתרחקים מהפרות, וכל יום נולד עגל חדש', cost: { wood: 8 } },
  { id: 'workshop', n: 'בית מלאכה', d: 'חניתות חדות יותר: נזק גבוה ב-25%', cost: { wood: 8, fish: 2 } },
  { id: 'tower', n: 'מגדל תצפית', d: 'טורף שמתקרב למחנה מסומן במפה, גם כשאתה רחוק', cost: { wood: 12 } },
  { id: 'walls', n: 'חומת עץ', d: 'חומה גבוהה סביב המחנה: אף טורף לא נכנס, והמחנה הופך למבצר', cost: { wood: 20, fish: 4 } }
);
const campLevel = () => 1 + Object.keys(CAMPH.up || {}).length;
const campTier = l => l >= 9 ? 'מבצר' : l >= 6 ? 'כפר' : l >= 3 ? 'מחנה מבוסס' : 'מחנה קטן';
const chiefName = c => { const h = c && (c.hunters || []).find(x => x.alive && x.elite); return h ? h.name : 'אין'; };
const campTitle = c => !c ? 'המחנה' : c.own ? 'המחנה שלך' : (c.tribe || 'מחנה ציידים');
function levelHtml() {
  const l = campLevel(), max = UPG.length + 1;
  return `<div class="cstock"><span class="cchip">רמת המחנה ${l} · ${campTier(l)}</span></div><div class="ixp"><b style="width:${Math.round((l - 1) / (max - 1) * 100)}%"></b></div>`;
}
function memberHtml(c) {
  const her = aliveMates().length;
  return `<h3 style="color:var(--gold);margin:12px 0 2px">הדרך למחנה משלך</h3><p class="idim">${her ? '✓' : '1.'} למצוא אישה. ראש השבט שלה צריך להסכים: לבקש, להביא מתנה או לנצח אותו בדו-קרב.</p>` +
    `<p class="idim">2. לעזוב את ${c ? c.tribe || 'השבט' : 'השבט'} ולהקים מחנה במקום חדש.</p><p class="idim">3. לבנות אותו לאט: גדר, מדורה, מכלאה, בית מלאכה, מגדל ועד חומה. המחנה עולה רמה עם כל בנייה, ממחנה קטן לכפר ולמבצר.</p>`;
}
// visuals for the new upgrades
function campMesh(build) {
  const c = homeCamp(); if (!c) return;
  const R = new Rig(), gy = (lx, lz) => getH(c.x + lx, c.z + lz) - c.y, add = (geo, p, r, s, colr) => R.add(geo, M([p[0], p[1] + gy(p[0], p[2]), p[2]], r, s), 0, col(colr), 1);
  build(add);
  const mesh = new THREE.Mesh(R.geometry(), HUNT.mat || new THREE.MeshLambertMaterial({ vertexColors: true }));
  mesh.position.set(c.x, c.y, c.z); mesh.castShadow = true; mesh.receiveShadow = true; scene.add(mesh); CAMPH.meshes.push(mesh);
}
const CAMPUP2 = {
  tents: () => campMesh(add => { for (const [x, z, r] of [[6.2, 1.2, 0.4], [-6.0, -1.5, 1.1], [1.5, 6.4, 2.0]]) { add(new THREE.ConeGeometry(1.4, 1.9, 4), [x, 0.93, z], [0, r, 0], null, '#a39168'); add(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 5), [x, 1.98, z], null, null, '#5a3f28'); } }),
  pen: () => campMesh(add => {
    const cx = -6.5, cz = -6.5, w = 4.5;
    for (let i = 0; i <= 6; i++) for (const [x, z] of [[cx - w + i * w / 3, cz - w], [cx - w + i * w / 3, cz + w], [cx - w, cz - w + i * w / 3], [cx + w, cz - w + i * w / 3]]) add(new THREE.CylinderGeometry(0.06, 0.07, 1.1, 5), [x, 0.55, z], null, null, '#5f4630');
    for (const [x, z, ry] of [[cx, cz - w, 0], [cx, cz + w, 0], [cx - w, cz, Math.PI / 2], [cx + w, cz, Math.PI / 2]]) for (const y of [0.45, 0.85]) add(new THREE.BoxGeometry(w * 2, 0.07, 0.06), [x, y, z], [0, ry, 0], null, '#6b4a2c');
  }),
  workshop: () => campMesh(add => {
    for (const [x, z] of [[4.6, 5.4], [6.4, 5.4], [4.6, 7.0], [6.4, 7.0]]) add(new THREE.CylinderGeometry(0.06, 0.07, 1.8, 6), [x, 0.9, z], null, null, '#5a3f28');
    add(new THREE.BoxGeometry(2.3, 0.08, 2.1), [5.5, 1.85, 6.2], [0.1, 0, 0], null, '#7a6a42');
    add(new THREE.BoxGeometry(1.4, 0.08, 0.7), [5.5, 0.8, 6.2], null, null, '#8a6a44');
    for (let i = 0; i < 3; i++) add(new THREE.CylinderGeometry(0.015, 0.018, 1.6, 5), [5.0 + i * 0.4, 0.86, 6.2], [0, 0, Math.PI / 2], null, '#6b4a2c');
  }),
  tower: () => campMesh(add => {
    for (const [x, z] of [[-1.8, 6.6], [-0.4, 6.6], [-1.8, 8.0], [-0.4, 8.0]]) add(new THREE.CylinderGeometry(0.08, 0.1, 5.2, 6), [x, 2.6, z], null, null, '#5a3f28');
    add(new THREE.BoxGeometry(2.0, 0.12, 2.0), [-1.1, 4.4, 7.3], null, null, '#7a5a38');
    for (const [x, z, ry] of [[-1.1, 6.35, 0], [-1.1, 8.25, 0], [-2.05, 7.3, Math.PI / 2], [-0.15, 7.3, Math.PI / 2]]) add(new THREE.BoxGeometry(2.0, 0.5, 0.06), [x, 4.75, z], [0, ry, 0], null, '#6b4a2c');
    add(new THREE.ConeGeometry(1.5, 1.0, 4), [-1.1, 5.7, 7.3], [0, Math.PI / 4, 0], null, '#8a7a52');
  }),
  walls: () => campMesh(add => {
    const c = homeCamp(), gap = Math.atan2(c.rz - c.z, c.rx - c.x);
    for (let i = 0; i < 64; i++) { const a = i / 64 * TAU; if (Math.abs(angDiff(a, gap)) < 0.16) continue; add(new THREE.CylinderGeometry(0.16, 0.18, 2.6 + (i % 2) * 0.3, 6), [Math.cos(a) * 11, 1.3, Math.sin(a) * 11], null, null, i % 2 ? '#5f4630' : '#6b4f34'); add(new THREE.ConeGeometry(0.17, 0.4, 6), [Math.cos(a) * 11, 2.8 + (i % 2) * 0.3, Math.sin(a) * 11], null, null, '#4a3424'); }
  })
};
// effects of the new upgrades
const CMP2 = { t: 0, day: -1, towerSeen: new Set() };
function camp2Update(dt) {
  if (!P.human || G.mode !== 'play' || !P.a) return;
  if (!PROG.flags.tribeIntro) {
    const c = homeCamp(); PROG.flags.tribeIntro = 1;
    if (c && !c.own) UI.big('איש שבט', `אתה איש שבט ב${c.tribe || 'מחנה'}, וראש השבט הוא ${chiefName(c)}. המשימה: למצוא אישה, לעזוב, ולהקים מחנה משלך`);
  }
  const c = homeCamp(); if (!c || !c.own) return;
  CMP2.t -= dt; if (CMP2.t > 0) return; CMP2.t = 1;
  const up = CAMPH.up, a = P.a;
  if (up.walls) shQuery(c.x, c.z, 12, b => { if (!b.alive || b.isPlayer || b.pet || b.tribe || b.hunter || b.tpl.kind !== 'quad' || b.legend || b.cowCamp) return; const dx = b.pos.x - c.x, dz = b.pos.z - c.z, d = Math.hypot(dx, dz) || 0.01; if (d < 11.3) { b.pos.x = c.x + dx / d * 11.4; b.pos.z = c.z + dz / d * 11.4; if (b.foe === a) { b.state = 'idle'; b.foe = null; } } });
  if (up.pen && c.cowGroup) for (const cow of c.cowGroup.members) if (cow.alive) shQuery(cow.pos.x, cow.pos.z, 9, b => { if (b.alive && !b.isPlayer && (b.sp.ai === 'pred' || b.sp.ai === 'pack') && b.state !== 'flee') threatReact(b, cow, true); });
  if (up.tents) for (const m of tribeAll()) if (m.alive && Math.hypot(m.pos.x - c.x, m.pos.z - c.z) < 12) m.hp = Math.min(m.maxHp, m.hp + 1.5);
  if (up.workshop && !P.workshopOn) { P.workshopOn = true; P.sp.dmg = (P.sp.dmg || 16) * 1.25; }
  if (up.tower) shQuery(c.x, c.z, 45, b => {
    if (!b.alive || b.isPlayer || b.pet || !(b.sp.ai === 'pred' || b.sp.ai === 'pack' || b.sp.ai === 'croc') || CMP2.towerSeen.has(b)) return;
    CMP2.towerSeen.add(b); P.pings.push({ x: b.pos.x, z: b.pos.z, t: 10 }); if (Math.hypot(a.pos.x - c.x, a.pos.z - c.z) > 40) UI.notify(`המגדל: ${b.sp.he} מתקרב למחנה`, 'bad');
  });
  if (CMP2.day !== G.day) {
    if (CMP2.day >= 0 && up.pen && c.cowGroup && c.cowGroup.members.filter(m => m.alive).length < 8) { addCow(c, c.cowGroup); UI.notify('נולד עגל חדש במכלאה', 'good'); }
    CMP2.day = G.day; CMP2.towerSeen.clear();
  }
}
MISSIONS.hunter.splice(1, 0, MS('hunter.wife1', 'למצוא אישה בהסכמת ראש השבט שלה', 80, () => aliveMates().length >= 1));
MISSIONS.hunter.splice(Math.max(0, MISSIONS.hunter.findIndex(m => m.id === 'hunter.found') + 1), 0,
  MS('hunter.camp3', 'לבנות את המחנה לרמה 3', 100, () => !!(homeCamp() && homeCamp().own) && campLevel() >= 3),
  MS('hunter.camp6', 'להפוך את המחנה לכפר (רמה 6)', 200, () => !!(homeCamp() && homeCamp().own) && campLevel() >= 6),
  MS('hunter.fort', 'להפוך את המחנה למבצר (רמה 9)', 400, () => !!(homeCamp() && homeCamp().own) && campLevel() >= 9));
for (const m of MISSIONS.hunter) GOAL[m.id] = m;

// ================= HERDS STAY PEACEFUL UNLESS PROVOKED, EASIER TAMING, AND HUNTING DOGS =================
if (!TAME_OK.includes('bushdog')) TAME_OK.push('bushdog');
if (!TAME_ADULT.includes('bushdog')) TAME_ADULT.push('bushdog');
const TAMEH = { t: 0, told: false };
const byPlayerSide = th => !!th && (th.isPlayer || th.pet === P.a || !!th.tribe);
function provoke(t, src) { t.provokedT = G.t + 25; if (t.group) { t.group.provokedT = G.t + 25; t.group.provoker = src; } }
// a sneaking hunter can walk right up to an animal that can be tamed
const trustsHunter = (a, b) => b.isPlayer && P.human && P.crouch && (TAME_OK.includes(a.spId) || (a.spId === 'horse' && !a.tribeHorse && !a.campHorse && (P.a.speed || 0) < 2.8));
function tameHints(dt) {
  if (!P.human || G.mode !== 'play' || !P.a || TAMEH.told) return;
  TAMEH.t -= dt; if (TAMEH.t > 0) return; TAMEH.t = 1;
  if (P.crouch || (P.a.pets || []).length >= P.mods.petsMax) return;
  let near = null;
  shQuery(P.a.pos.x, P.a.pos.z, 14, b => { if (!near && b.alive && !b.pet && TAME_OK.includes(b.spId) && (b.young || TAME_ADULT.includes(b.spId))) near = b; });
  if (near) { TAMEH.told = true; UI.notify(TOUCH ? `כדי לאלף ${near.sp.he}: להתגנב (כפתור התגנבות) עד שמגיעים קרוב, ואז להחזיק את כפתור הזהב. כלבי יער יוצאים איתך לציד` : `כדי לאלף ${near.sp.he}: להתגנב (C) עד שמגיעים קרוב, ואז להחזיק E. כלבי יער יוצאים איתך לציד`, 'good'); }
}

// ================= SIZE-BASED HUNTING, COOKING FOR THE HUNTER, AXE AND KNIFE =================
// a body's size is measured by how much meat it carries
const massOf = b => Math.max(1, (b.sp.food || (b.sp.hp || 20) * 0.5) * Math.pow(b.baseScale || 1, 3) * (b.young ? 0.4 : 1) * (b.isPlayer && P.growth ? Math.pow(P.growth, 3) : 1));
// bites and claws depend on the size of the attacker against the target; weapons do not
function sizeDmg(src, t) {
  if (!src || !t || src === t || !src.sp || src.hunter || src.tribe || src.legend || (src.isPlayer && P.human) || src.tpl.kind === 'human') return 1;
  return clamp(Math.pow(massOf(src) / massOf(t), 0.3), 0.45, 1.6);
}
// how much a meal fills you depends on your own size: small bodies fill fast, big ones need much more
const eatRate = () => clamp(1.6 * Math.sqrt(80 / massOf(P.a)), 0.3, 5);

// ---------- the hunter butchers and cooks ----------
Object.assign(CTXT, { butcher: ['meat', 'לחתוך בשר', 'להחזיק כדי לחתוך בשר'], cook: ['meat', 'לבשל', 'להחזיק כדי לבשל על האש'], fire: ['up', 'להדליק אש', 'להדליק מדורה (2 עצים)'], meal: ['meat', 'לאכול', 'להחזיק כדי לאכול בשר מבושל'] });
const COOK = { t: 0, fires: [], told: false, tool: null, toolT: 0, toolKind: '' };
const rawCount = () => (P.inv.meat || 0) + (P.inv.fish || 0);
function nearFire(r = 3.2) {
  const a = P.a;
  for (const c of HUNT.camps) if (!c.gone && Math.hypot(c.x - a.pos.x, c.z - a.pos.z) < r) return true;
  return COOK.fires.some(f => f.t > 0 && Math.hypot(f.x - a.pos.x, f.z - a.pos.z) < r);
}
function cookCtx() { return P.human && nearFire() && rawCount() > 0 && !P.a.swimming ? 'cook' : null; }
function cookLow() {
  const a = P.a; if (!P.human || a.swimming) return null;
  if (rawCount() > 0 && (P.inv.wood || 0) >= 2 && !nearFire(25) && waterDepth(a.pos.x, a.pos.z) === 0) return 'fire';
  if (!TOUCH && (P.inv.cooked || 0) > 0 && P.food < 92) return 'meal';
  return null;
}
function butcherStep(dt) {
  const c = P.carcass; P.eating = false; if (!c || c.food <= 0) return;
  COOK.t += dt; showTool('knife');
  if (COOK.t < 1.2) return;
  COOK.t = 0;
  const n = Math.max(1, Math.round(c.food / 9));
  P.inv.meat = (P.inv.meat || 0) + n; c.food = 0; PROG.flags.butcher = 1; dogScraps(c);
  if (c.dCam < 40) FX.spawn('blood', c.pos.x, c.pos.y + 0.3, c.pos.z, 6);
  UI.notify(`חתכת ${n} ${n === 1 ? 'נתח' : 'נתחי'} בשר מה${c.sp.he}. צריך לבשל על אש: במחנה, או להדליק מדורה עם 2 עצים`, 'good'); AUD.play('bite', 0.5);
}
function cookStep(dt) {
  P.eating = false; COOK.t += dt;
  if (COOK.t < 1.2) return;
  COOK.t = 0;
  if ((P.inv.meat || 0) > 0) P.inv.meat--; else if ((P.inv.fish || 0) > 0) P.inv.fish--; else return;
  P.inv.cooked = (P.inv.cooked || 0) + 1; PROG.flags.cook = 1; AUD.play('eat', 0.35);
  combatText(`מבושל: ${P.inv.cooked}`, 'good');
}
function lightFire() {
  if (CLB.latch) return; CLB.latch = true;
  const a = P.a; if ((P.inv.wood || 0) < 2) return;
  P.inv.wood -= 2;
  const fy = getH(a.pos.x + Math.sin(a.yaw) * 1.4, a.pos.z + Math.cos(a.yaw) * 1.4), fx = a.pos.x + Math.sin(a.yaw) * 1.4, fz = a.pos.z + Math.cos(a.yaw) * 1.4;
  const f = { x: fx, z: fz, t: 240, meshes: [] };
  for (const [r, h, colr] of [[0.2, 0.6, '#ff8a2a'], [0.11, 0.42, '#ffe08a']]) {
    const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 7, 1, true), new THREE.MeshBasicMaterial({ color: colr, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    m.position.set(fx, fy + h / 2 + 0.05, fz); m.userData.h = h; scene.add(m); f.meshes.push(m);
  }
  const logs = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.8, 6), new THREE.MeshLambertMaterial({ color: '#4a3424' }));
  logs.position.set(fx, fy + 0.08, fz); logs.rotation.z = Math.PI / 2; scene.add(logs); f.meshes.push(logs);
  COOK.fires.push(f); UI.notify('הדלקת מדורה. עכשיו אפשר לבשל עליה', 'good'); AUD.play('swipe', 0.4);
}
function mealStep(dt) {
  P.eating = false; COOK.t += dt;
  if (COOK.t < 0.6) return;
  COOK.t = 0;
  if ((P.inv.cooked || 0) <= 0 || P.food >= 100) return;
  P.inv.cooked--; P.food = Math.min(100, P.food + 14); AUD.play('eat', 0.6);
}
// ---------- the knife and the axe ----------
function toolMesh(kind) {
  const g = new THREE.Group(), wood = new THREE.MeshLambertMaterial({ color: '#6b4a2c' }), steel = new THREE.MeshLambertMaterial({ color: '#c9ccd2' });
  if (kind === 'knife') {
    const h = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.02, 0.12, 6), wood); h.position.y = 0.06; g.add(h);
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.2, 0.008), steel); b.position.y = 0.22; g.add(b);
  } else if (kind === 'pick') {
    const h = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.024, 0.66, 6), wood); h.position.y = 0.33; g.add(h);
    const hd = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.022, 4, 10, Math.PI * 0.75), steel); hd.position.set(0, 0.46, 0); hd.rotation.z = Math.PI * 0.125; g.add(hd);
  } else if (kind === 'bow') {
    const arc = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.016, 5, 16, Math.PI * 0.9), wood); arc.rotation.z = Math.PI / 2 - Math.PI * 0.45; g.add(arc);
    const str = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.8, 3), new THREE.MeshBasicMaterial({ color: '#e8e2d0' })); g.add(str);
  } else {
    const h = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.024, 0.62, 6), wood); h.position.y = 0.31; g.add(h);
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.11, 0.025), steel); b.position.set(0.07, 0.56, 0); g.add(b);
  }
  return g;
}
function showTool(kind) {
  if (!P.human || !P.a) return;
  if (COOK.toolKind !== kind) { if (COOK.tool) scene.remove(COOK.tool); COOK.tool = toolMesh(kind); COOK.toolKind = kind; scene.add(COOK.tool); }
  COOK.tool.visible = true; COOK.toolT = 0.35;
}
function knifeAttack(t) {
  const a = P.a;
  P.atkCD = 0.45; a.anim.atk = 0.4; showTool('knife');
  a.yaw += angDiff(a.yaw, Math.atan2(t.pos.x - a.pos.x, t.pos.z - a.pos.z)) * 0.8;
  hurt(t, 13 * (P.workshopOn ? 1.25 : 1) * rr(0.9, 1.15) * (t.state !== 'flee' && t.state !== 'fight' ? 1.35 : 1) * (P.crouch ? 1.2 : 1), a);
  if (t.dCam < 40) FX.spawn('blood', t.pos.x, t.pos.y + t.height * 0.6, t.pos.z, 4);
  AUD.play('swipe', 0.6); CAM.shake = Math.max(CAM.shake, 0.08); partnerAssist(t); PROG.flags.knife = 1;
}
function cookUpdate(dt) {
  for (let i = COOK.fires.length - 1; i >= 0; i--) {
    const f = COOK.fires[i]; f.t -= dt * (G.timeMul || 1);
    f.meshes.forEach((m, k) => { if (k < 2) m.scale.y = 0.85 + Math.sin(G.t * 9 + k) * 0.15; });
    if (f.t <= 0) { for (const m of f.meshes) scene.remove(m); COOK.fires.splice(i, 1); }
  }
  if (!P.human || G.mode !== 'play' || !P.a) { if (COOK.tool) COOK.tool.visible = false; return; }
  if (P.ctx !== 'butcher' && P.ctx !== 'cook' && P.ctx !== 'meal') COOK.t = 0;
  if (P.ctx === 'wood' && (KEYS.KeyE || INPUT.use)) showTool('axe');
  if (COOK.tool && COOK.tool.visible) {
    COOK.toolT -= dt; if (COOK.toolT <= 0) COOK.tool.visible = false; if (COOK.tool.userData.bone) return;
    const a = P.a, fx = Math.sin(a.yaw), fz = Math.cos(a.yaw), rx = -Math.cos(a.yaw), rz = Math.sin(a.yaw), sw = Math.sin(G.t * 14) * 0.9;
    COOK.tool.position.set(a.pos.x + rx * 0.24 + fx * 0.3, a.pos.y + 0.95, a.pos.z + rz * 0.24 + fz * 0.3);
    COOK.tool.rotation.set(0.9 + sw, a.yaw, 0, 'YXZ');
  }
  if (!COOK.told) { COOK.told = true; UI.notify('יש לך סכין לקרב צמוד, גרזן לכריתת עצים, וחנית. את הבשר מטרף צריך לחתוך ולבשל על אש', 'good'); }
}
MISSIONS.hunter.splice(Math.max(1, MISSIONS.hunter.findIndex(m => m.id === 'hunter.capy') + 1), 0,
  MS('hunter.butcher', 'לחתוך בשר מטרף', 30, FL('butcher')), MS('hunter.cook', 'לבשל בשר על האש', 40, FL('cook')), MS('hunter.knife', 'להילחם מקרוב עם הסכין', 30, FL('knife')));
for (const m of MISSIONS.hunter) GOAL[m.id] = m;

// ================= EASY EATING AFTER COOKING, AND ONLY DOGS CAN BE TAMED =================
// only bush dogs can be tamed now, and they help with the hunt
TAME_OK.length = 0; TAME_OK.push('bushdog');
TAME_ADULT.length = 0; TAME_ADULT.push('bushdog');
const EAT = { el: null, hold: false, t: 0, key: '' };
(function () {
  const st = document.createElement('style');
  st.textContent = '#tEat{right:172px;bottom:150px;width:58px;height:58px;background:rgba(214,120,40,.82);border-color:#ffd29a}#tEat small{font-size:10px;font-weight:600}';
  document.head.appendChild(st);
})();
function eatOne() {
  if (!P.human || !P.inv || (P.inv.cooked || 0) <= 0 || P.food >= 100 || G.mode !== 'play' || !P.a || !P.a.alive) return false;
  P.inv.cooked--; P.food = Math.min(100, P.food + 14); AUD.play('eat', 0.6); P.a.anim.atk = 0.2;
  combatText(`+14 מזון (נשארו ${P.inv.cooked})`, 'good'); PROG.flags.ateCooked = 1; return true;
}
function eatUpdate(dt) {
  if (!EAT.el) {
    const box = document.getElementById('tbtns'); if (!box) return;
    EAT.el = document.createElement('button'); EAT.el.id = 'tEat'; EAT.el.className = 'tb'; EAT.el.hidden = true; box.appendChild(EAT.el);
    EAT.el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); EAT.hold = true; EAT.t = 0.5; eatOne(); EAT.el.classList.add('down'); });
    for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) EAT.el.addEventListener(ev, () => { EAT.hold = false; EAT.el.classList.remove('down'); });
    addEventListener('keydown', e => { if (e.code === 'KeyX' && !e.repeat && G.mode === 'play') { EAT.hold = true; EAT.t = 0.5; eatOne(); } });
    addEventListener('keyup', e => { if (e.code === 'KeyX') EAT.hold = false; });
  }
  const ck = (P.inv && P.inv.cooked) || 0, show = TOUCH && G.mode === 'play' && P.human && ck > 0 && P.food < 98;
  if (EAT.el.hidden === show) EAT.el.hidden = !show;
  const key = `${ck}`;
  if (show && EAT.key !== key) { EAT.key = key; EAT.el.innerHTML = ICON.meat + `<small>לאכול ${key}</small>`; EAT.el.setAttribute('aria-label', `לאכול, ${key} מנות`); }
  if (EAT.hold) { EAT.t -= dt; if (EAT.t <= 0) { EAT.t = 0.45; if (!eatOne()) EAT.hold = false; } }
}

// ================= HUNTING DOGS NEED THEIR OWNER TO FEED THEM =================
CTXT.feed = ['meat', 'להאכיל', 'להאכיל את הכלב'];
const DOGF = { t: 0, target: null };
const myDogs = () => (P.a && P.a.pets ? P.a.pets.filter(d => d.alive && !d.gone && d.spId === 'bushdog') : []);
const dogFoodAvail = () => !!P.inv && ((P.inv.meat || 0) + (P.inv.fish || 0) + (P.inv.cooked || 0)) > 0;
function dogHungerTxt(d) { const h = d.hunger ?? 100; return h < 25 ? heb(d, 'רעב מאוד!', 'רעבה מאוד!') : h < 55 ? heb(d, 'רעב', 'רעבה') : heb(d, 'שבע', 'שבעה'); }
function feedCtx() {
  if (!P.human || !dogFoodAvail()) return null;
  let best = null, bd = 2.8;
  for (const d of myDogs()) { const dd = dist2(d.pos, P.a.pos); if ((d.hunger ?? 100) < 85 && dd < bd) { bd = dd; best = d; } }
  DOGF.target = best; return best ? 'feed' : null;
}
function feedDog() {
  if (CLB.latch) return; CLB.latch = true;
  const d = DOGF.target; if (!d || !d.alive || !dogFoodAvail()) return;
  let gain = 40;
  if ((P.inv.meat || 0) > 0) P.inv.meat--; else if ((P.inv.fish || 0) > 0) P.inv.fish--; else { P.inv.cooked--; gain = 50; }
  d.hunger = Math.min(100, (d.hunger ?? 100) + gain); d.hungerTold = false; PROG.flags.feedDog = 1;
  if (d.dCam < 40) FX.spawn('heart', d.pos.x, d.pos.y + d.height, d.pos.z, 4);
  AUD.play('eat', 0.5); UI.notify(`${d.name || 'הכלב'} ${heb(d, 'אכל', 'אכלה')} ו${heb(d, 'שבע', 'שבעה')} יותר`, 'good');
}
function dogScraps(c) {
  for (const d of myDogs()) if (dist2(d.pos, c.pos) < 9) { d.hunger = Math.min(100, (d.hunger ?? 100) + 25); d.hungerTold = false; UI.notify(`${d.name || 'הכלב'} ${heb(d, 'קיבל', 'קיבלה')} שאריות מהטרף`, 'good'); }
}
function dogFoodUpdate(dt) {
  if (!P.human || G.mode !== 'play' || !P.a) return;
  DOGF.t -= dt; if (DOGF.t > 0) return; DOGF.t = 1;
  for (const d of myDogs()) {
    if (d.hunger == null) d.hunger = 70;
    d.hunger = Math.max(0, d.hunger - 100 / 720 * Math.min(G.timeMul || 1, 3));
    if (d.hunger < 30 && !d.hungerTold) { d.hungerTold = true; UI.notify(`${d.name || 'הכלב'} ${heb(d, 'רעב', 'רעבה')}! צריך להאכיל ${heb(d, 'אותו', 'אותה')}: לעמוד ליד ${heb(d, 'הכלב', 'הכלבה')} וללחוץ "להאכיל"`, 'bad'); }
    if (d.hunger <= 0) {
      d.hp -= 1.2;
      if (d.hp < d.maxHp * 0.3) {
        const i = P.a.pets.indexOf(d); if (i >= 0) P.a.pets.splice(i, 1);
        d.pet = null; d.followTarget = null; d.state = 'idle'; d.foe = null; d.socialExtra = false;
        UI.notify(`${d.name || 'הכלב'} ${heb(d, 'עזב', 'עזבה')} כי לא ${heb(d, 'קיבל', 'קיבלה')} אוכל`, 'bad');
      }
    }
  }
}

// ================= AIMING THE SPEAR, DIVING DEPTH, AND KNOWING WHO ATTACKED YOU AND WHY =================
// ---------- spear: hold to aim, the crosshair picks the target, release to throw, aim at the ground to cancel ----------
const AIMX = { on: false, tgt: null, el: null, point: null };
function aimEl() {
  if (AIMX.el) return AIMX.el;
  const el = document.createElement('div'); el.id = 'aimX';
  el.innerHTML = '<svg viewBox="0 0 40 40" width="38" height="38"><circle cx="20" cy="20" r="11" fill="none" stroke="#ffe7a8" stroke-width="2"/><path d="M20 3v8M20 29v8M3 20h8M29 20h8" stroke="#ffe7a8" stroke-width="2" stroke-linecap="round"/></svg><span></span>';
  el.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:12;pointer-events:none;display:none;flex-direction:column;align-items:center;gap:2px;font:600 12px Rubik,sans-serif;color:#fff2c8;text-shadow:0 1px 3px rgba(0,0,0,.85)';
  document.body.appendChild(el); return (AIMX.el = el);
}
function camRay() { const d = new V3(); camera.getWorldDirection(d); return d; }
function aimPick() {
  const a = P.a, o = camera.position, d = camRay(); let best = null, bs = 0.985;
  shQuery(a.pos.x, a.pos.z, 32, b => {
    if (!b.alive || b === a || b.pet === a || b.tribe || b.isPartner || b.cub || b.hunter || b.escort) return;
    const v = _t2.set(b.pos.x - o.x, b.pos.y + b.height * 0.5 - o.y, b.pos.z - o.z), L = v.length(); if (L < 2 || L > 34) return;
    const c = v.dot(d) / L; if (c > bs) { bs = c; best = b; }
  });
  return best;
}
function aimGround() {
  const o = camera.position, d = camRay(), p = new V3();
  for (let s = 1; s < 40; s += 0.75) {
    p.copy(o).addScaledVector(d, s); const w = waterAt(p.x, p.z), g = Math.max(getH(p.x, p.z), w > -900 ? w : -99);
    if (p.y <= g) return p;
  }
  return null;
}
function aimStart() {
  const a = P.a;
  AIMX.on = true; AIMX.tgt = null; a.windup = 99; aimEl().style.display = 'flex';
  if (!PROG.flags.aimTold) { PROG.flags.aimTold = 1; UI.notify(TOUCH ? 'מכוונים: מחזיקים את כפתור החנית וגוררים את האצבע כדי להזיז את הכוונת. עוזבים כדי לזרוק. הכוונת ננעלת לבד על המטרה הכי קרובה, וציפורים באוויר מקבלות חץ מהקשת' : 'מכוונים: מחזיקים את העכבר ומזיזים את המבט. עוזבים כדי לזרוק. הכוונת ננעלת לבד על המטרה הכי קרובה, וציפורים באוויר מקבלות חץ מהקשת', 'good'); }
}
function aimEnd() { AIMX.on = false; AIMX.tgt = null; if (P.a) P.a.windup = 0; if (AIMX.el) AIMX.el.style.display = 'none'; if (P.a && P.a.mark) { releaseMarker(P.a.mark); P.a.mark = null; } }
function aimUpdate() {
  if (!AIMX.on) return;
  const a = P.a;
  if (!a || !a.alive || !P.human || G.mode !== 'play' || (P.spears <= 0 && (P.arrows || 0) <= 0) || a.swimming) { aimEnd(); return; }
  a.windup = 99; a.yaw += angDiff(a.yaw, CAM.yaw) * 0.35;
  const t = aimPick2(); AIMX.tgt = t;
  const g = t ? null : aimGround(), ground = !t && (!g || Math.hypot(g.x - a.pos.x, g.z - a.pos.z) < 7);
  if (!a.mark) a.mark = aimMarker(a, 'mine');
  if (a.mark) { if (t) placeMarker(a.mark, t.pos.x, t.pos.z, 0.5); else if (g && !ground) placeMarker(a.mark, g.x, g.z, 0.5); else a.mark.visible = false; }
  const lab = AIMX.el.lastChild;
  lab.textContent = t ? `${flyingBird(t) ? '🏹 ' : ''}${t.sp.he} · ${Math.round(dist2(t.pos, a.pos))} מ׳` : 'מחפש מטרה...';
  AIMX.el.firstChild.style.opacity = t ? 1 : 0.6;
  if (!INPUT.atkHeld) { aimEnd(); a.mark = null; aimRelease(t); }
}

// ---------- the hunter controls his depth underwater ----------
function diveUpdate(dt) {
  const a = P.a; if (!a || !P.human) return;
  if (!(P.dive && a.swimming)) { a.diveD = null; return; }
  const up = INPUT.up || KEYS.Space, dn = INPUT.down || KEYS.KeyC, floor = Math.max(0.4, waterDepth(a.pos.x, a.pos.z) - 0.5);
  if (a.diveD == null) a.diveD = Math.min(1.4, floor);
  a.diveD = clamp(a.diveD + ((dn ? 1 : 0) - (up ? 1 : 0)) * 1.6 * dt, 0.15, floor);
  if (up && a.diveD <= 0.18) { P.dive = false; a.dive = false; a.diveD = null; UI.notify('עלית לנשום'); }
}

// ---------- who attacked you, and why ----------
const WHY = { last: new Map() };
const playerSide = b => !!b && (b.isPlayer || b.tribe || b.isPartner || b.cub || (b.pet && b.pet === P.a));
function whoIs(src) {
  if (src.hunter) { const c = HUNT.camps.find(k => (k.hunters || []).includes(src)); return `${src.ruler ? '' : hunterWord(src)}${src.name ? (src.ruler ? '' : ' ') + src.name : ''}${c && c.tribe ? ' מ' + c.tribe : ''}`; }
  if (src.legend) return src.name;
  return `ה${src.sp.he}`;
}
function whyAttack(src, t) {
  if (src.hunter) {
    if (src.duel) return 'דו-קרב על אישה';
    if (HUNT.angry > 0) return HUNT.angryWhy || 'הציידים כועסים עליך';
    if (src.lastHit && playerSide(src.lastHit)) return src.lastHit.isPlayer ? 'כי פגעת בו' : `כי ${src.lastHit.name || 'מישהו מהמשפחה שלך'} פגע בו`;
    return 'כי ראה בך איום';
  }
  if (src.legend) return 'אגדה ששומרת על השטח שלה';
  if (src.isRival || src.raider) return 'זכר מתחרה';
  if (src.invader) return 'כי השבט שלך פולש לטריטוריה שלו';
  if ((src.provokedT || 0) > G.t) return 'כי תקפו אותו';
  if (src.state === 'hunt' && src.target === t) return 'כי הוא צד אותך';
  if (typeof TERRR !== 'undefined' && TERRR[src.spId]) return 'כי נכנסת לטריטוריה שלו';
  return 'כי הרגיש מאוים';
}
function attackNote(t, src) {
  if (!src || src === t || !src.sp || playerSide(src) || G.mode !== 'play') return;
  const k = src.id + ':' + (t.isPlayer ? 'p' : t.id); if (G.t - (WHY.last.get(k) || -99) < 12) return; WHY.last.set(k, G.t);
  if (t.isPlayer) UI.notify(`${whoIs(src)} תקף אותך: ${whyAttack(src, t)}`, 'bad');
  else { UI.notify(`${whoIs(src)} תוקף את ${t.name || t.sp.he}! ${whyAttack(src, t)}`, 'bad'); P.pings.push({ x: t.pos.x, z: t.pos.z, t: 8 }); }
}
function aimDiveUpdate(dt) { if (TOUCH) aimDragSetup(); aimUpdate(); diveUpdate(dt); }
// ---------- drag the same finger that holds the spear button to aim ----------
const AIMD = { wired: false, id: null, x: 0, y: 0 };
function aimDragSetup() {
  if (AIMD.wired) return; const b = document.getElementById('tAtk'); if (!b) return; AIMD.wired = true;
  b.addEventListener('pointerdown', e => { AIMD.id = e.pointerId; AIMD.x = e.clientX; AIMD.y = e.clientY; });
  b.addEventListener('pointermove', e => {
    if (e.pointerId !== AIMD.id) return;
    const dx = e.clientX - AIMD.x, dy = e.clientY - AIMD.y; AIMD.x = e.clientX; AIMD.y = e.clientY;
    if (!AIMX.on) return;
    INPUT.lookDX += dx * 1.25; INPUT.lookDY += dy * 1.05; INPUT.looking = true;
  });
  const end = e => { if (e.pointerId !== AIMD.id) return; AIMD.id = null; if (!TC.pts.size) INPUT.looking = false; };
  b.addEventListener('pointerup', end); b.addEventListener('pointercancel', end); b.addEventListener('lostpointercapture', end);
}

// ================= BOW & ARROWS, LOCK-ON AIMING, CRAFTING, THE TOOLBOX AND CAMP STORAGE =================
const CARRY = { meat: 12, cooked: 12, fish: 12, wood: 24, arrows: 30 };
const GEARX = { joinT: 360, womenT: 120, capT: 0 };
const flyingBird = b => b.tpl.kind === 'bird' && b.pos.y > Math.max(getH(b.pos.x, b.pos.z), waterAt(b.pos.x, b.pos.z)) + 1.5;
// the crosshair searches for targets around it and locks on, keeping the current lock unless another is clearly better
function aimPick2() {
  const a = P.a, o = camera.position, d = camRay(); let best = null, bs = -1e9;
  const cur = AIMX.tgt && AIMX.tgt.alive ? AIMX.tgt : null, arrows = (P.arrows || 0) > 0, spears = (P.spears || 0) > 0;
  shQuery(a.pos.x, a.pos.z, 46, b => {
    if (!b.alive || b === a || b.pet === a || b.tribe || b.isPartner || b.cub || b.hunter || b.escort) return;
    const fly = flyingBird(b); if (fly ? !arrows : !(spears || arrows)) return;
    const v = _t2.set(b.pos.x - o.x, b.pos.y + b.height * 0.5 - o.y, b.pos.z - o.z), L = v.length(); if (L < 2 || L > (fly ? 46 : 34)) return;
    const c = v.dot(d) / L; if (c < 0.93) return;
    const s = c * 12 - L * 0.03 + (b === cur ? 0.35 : 0);
    if (s > bs) { bs = s; best = b; }
  });
  return best;
}
function shootArrow(t) {
  const a = P.a; if ((P.arrows || 0) <= 0) return false;
  P.arrows--; showTool('bow'); a.anim.atk = 0.4; P.atkCD = 0.55; PROG.flags.arrow = 1;
  const fx = Math.sin(a.yaw), fz = Math.cos(a.yaw), sx = a.pos.x + fx * 0.4, sy = a.pos.y + 1.45, sz = a.pos.z + fz * 0.4;
  let tx, ty, tz;
  if (t) {
    const T0 = Math.hypot(t.pos.x - sx, t.pos.z - sz) / 38, v = t.vel || { x: Math.sin(t.yaw) * (t.speed || 0), y: 0, z: Math.cos(t.yaw) * (t.speed || 0) };
    tx = t.pos.x + (v.x || 0) * T0; ty = t.pos.y + t.height * 0.5 + (v.y || 0) * T0; tz = t.pos.z + (v.z || 0) * T0;
  } else { const d = camRay(); tx = camera.position.x + d.x * 40; ty = camera.position.y + d.y * 40; tz = camera.position.z + d.z * 40; }
  const D = Math.hypot(tx - sx, ty - sy, tz - sz), T = Math.max(0.05, D / 38);
  addProjectile(a, 'arrow', sx, sy, sz, (tx - sx) / T, (ty - sy) / T + 4.9 * T, (tz - sz) / T);
  AUD.play('swipe', 0.45); if (t) partnerAssist(t);
  return true;
}
// release: birds in flight get an arrow, everything else a spear (or an arrow when the spears run out)
function aimRelease(t) {
  if (t && flyingBird(t)) { shootArrow(t); return; }
  if ((P.spears || 0) > 0) { P.aimTgt = t || null; if (t) partnerAssist(t); P.atkCD = 0.9; playerThrow(); return; }
  shootArrow(t);
}
// ---------- crafting at the camp ----------
function craft(kind) {
  if (!inCamp(10)) { UI.notify('מגלפים חניתות וחצים רק במחנה'); return false; }
  if (kind === 'spear') {
    if (!takeRes('wood', 2)) { UI.notify('צריך 2 עצים לחנית'); return false; } if (P.spears < P.mods.spearsMax) P.spears++; else CAMPH.store.spears = (CAMPH.store.spears || 0) + 1;
    UI.notify(P.spears <= P.mods.spearsMax ? `גילפת חנית חדשה (${P.spears} איתך)` : 'גילפת חנית. היא נשמרה במחסן', 'good');
  } else {
    if (!takeRes('wood', 1)) { UI.notify('צריך עץ אחד ל-4 חצים'); return false; } const room = CARRY.arrows - (P.arrows || 0), add = Math.min(4, room);
    P.arrows = (P.arrows || 0) + add; if (add < 4) CAMPH.store.arrows = (CAMPH.store.arrows || 0) + 4 - add;
    UI.notify(`גילפת 4 חצים (${P.arrows} איתך)`, 'good');
  }
  PROG.flags.craft = 1; AUD.play('swipe', 0.4); return true;
}
// ---------- the toolbox and the camp storage ----------
const BOXK = [['meat', '🥩', 'בשר נא'], ['cooked', '🍖', 'בשר מבושל'], ['fish', '🐟', 'דגים'], ['wood', '🪵', 'עצים']];
function boxStore() { CAMPH.store = Object.assign({ meat: 0, cooked: 0, fish: 0, wood: 0, spears: 0, arrows: 0 }, CAMPH.store || {}); return CAMPH.store; }
function deposit() {
  const st = boxStore();
  for (const [k] of BOXK) { st[k] += P.inv[k] || 0; P.inv[k] = 0; }
  oreDeposit(st);
  if (P.spears > 1) { st.spears += P.spears - 1; P.spears = 1; }
  if ((P.arrows || 0) > 6) { st.arrows += P.arrows - 6; P.arrows = 6; }
  UI.notify('הכול נשמר במחסן המחנה', 'good');
}
function withdraw() {
  const st = boxStore();
  for (const [k] of BOXK) { const take = Math.min(st[k], Math.max(0, CARRY[k] - (P.inv[k] || 0))); st[k] -= take; P.inv[k] = (P.inv[k] || 0) + take; }
  const sp = Math.min(st.spears, Math.max(0, P.mods.spearsMax - P.spears)); st.spears -= sp; P.spears += sp;
  const ar = Math.min(st.arrows, Math.max(0, CARRY.arrows - (P.arrows || 0))); st.arrows -= ar; P.arrows = (P.arrows || 0) + ar;
  UI.notify('לקחת מהמחסן כמה שאפשר לסחוב', 'good');
}
function openBoxOld() {
  if (G.mode !== 'play' || !P.human || !P.a) return;
  const st = boxStore(), here = inCamp(10), row = (ic, n, have, cap) => `<div class="irow"><div><b>${ic} ${n}</b></div><span class="cchip">${have}${cap ? ' / ' + cap : ''}</span></div>`;
  const rows = BOXK.map(([k, ic, n]) => row(ic, n, P.inv[k] || 0, CARRY[k])).join('') + row('🗡️', 'חניתות', P.spears, P.mods.spearsMax) + row('🏹', 'חצים', P.arrows || 0, CARRY.arrows);
  const tools = '<p class="idim">כלים: סכין לקרב צמוד, גרזן לעצים, חנית, קשת לציד ציפורים, וחכה</p>';
  const dog = myDogs().find(d => dist2(d.pos, P.a.pos) < 4 && (d.hunger ?? 100) < 85);
  const acts = [(P.inv.cooked || 0) > 0 && P.food < 98 ? '<button class="btn pri" data-a="eat">לאכול מנה</button>' : '', dog && dogFoodAvail() ? '<button class="btn pri" data-a="feed">להאכיל את הכלב</button>' : ''].join('');
  const camp = here ? `<h3>מחסן המחנה</h3><div class="cstock">${BOXK.map(([k, ic]) => `<span class="cchip">${ic} ${st[k]}</span>`).join('')}<span class="cchip">🗡️ ${st.spears}</span><span class="cchip">🏹 ${st.arrows}</span></div>` +
    `<div class="btns" style="flex-wrap:wrap"><button class="btn" data-a="dep">להפקיד הכול</button><button class="btn" data-a="wd">לקחת מהמחסן</button>` +
    `<button class="btn pri" data-a="cs"${(P.inv.wood || 0) < 2 ? ' disabled' : ''}>לגלף חנית (2 🪵)</button><button class="btn pri" data-a="ca"${(P.inv.wood || 0) < 1 ? ' disabled' : ''}>לגלף 4 חצים (1 🪵)</button></div>`
    : '<p class="idim">במחנה אפשר לשמור הכול במחסן גדול ולגלף חניתות וחצים חדשים.</p>';
  const el = uiCard('boxov', `<div class="itabs"><b style="flex:1;font-size:18px">ארגז הכלים</b><button class="ix" data-a="close" aria-label="סגירה">✕</button></div>${rows}${tools}${acts ? `<div class="btns">${acts}</div>` : ''}${camp}`);
  el.onclick = e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    const A = b.dataset.a;
    if (A === 'eat') eatOne(); else if (A === 'feed') { DOGF.target = dog; CLB.latch = false; feedDog(); }
    else if (A === 'dep') deposit(); else if (A === 'wd') withdraw(); else if (A === 'cs') craft('spear'); else if (A === 'ca') craft('arrow');
    else { closeCard('boxov'); return; }
    openBox();
  };
}
// ---------- joining your own tribe only by request, and women keep coming to the camps ----------
function joinRequest() {
  const own = homeCamp(); if (!own || !own.own) return;
  const cands = []; for (const c of HUNT.camps) if (!c.own) for (const h of c.hunters || []) if (h.alive && !h.elite && !h.fleeing && !h.duel) cands.push([h, c]);
  if (!cands.length) return;
  const [h, c] = pick(cands);
  const el = uiCard('joinov', `<h2>${h.name || hunterWord(h)} רוצה להצטרף</h2><p>${h.name || 'צייד'} מ${c.tribe || 'מחנה אחר'} מבקש להצטרף לשבט שלך. זה השבט שלך, וההחלטה שלך.</p><div class="btns"><button class="btn pri" data-a="yes">לקבל לשבט</button><button class="btn" data-a="no">לא עכשיו</button></div>`);
  el.onclick = e => {
    const b = e.target.closest('button'); if (!b) return; closeCard('joinov');
    if (b.dataset.a === 'yes' && h.alive) { tribeAdult(h); h.role = 'camp'; if (h.home) h.home.set(own.x, 0, own.z); UI.notify(`${h.name || 'הצייד'} ${heb(h, 'הצטרף', 'הצטרפה')} לשבט שלך ושומר על המחנה`, 'good'); }
  };
}
function gearUpdate(dt) {
  if (!P.human || G.mode !== 'play' || !P.a) return;
  if (P.arrows == null) P.arrows = 12;
  GEARX.capT -= dt;
  if (GEARX.capT <= 0) {
    GEARX.capT = 1; let over = false;
    for (const k in CARRY) { const v = k === 'arrows' ? P.arrows : P.inv[k]; if ((v || 0) > CARRY[k]) { over = true; if (k === 'arrows') P.arrows = CARRY[k]; else { boxStore(); if (inCamp(10)) CAMPH.store[k] += P.inv[k] - CARRY[k]; P.inv[k] = CARRY[k]; } } }
    if (over && !GEARX.overTold) { GEARX.overTold = true; UI.notify('הארגז מלא. במחנה אפשר לשמור הרבה יותר במחסן', 'bad'); }
  }
  if (homeCamp() && homeCamp().own && !G.paused) {
    if (GEARX.dayK !== G.day) { GEARX.dayK = G.day; GEARX.joinAt = rr(9, 16); }
    if (PROG.flags.joinDay !== G.day && G.time >= GEARX.joinAt && G.time < 19) { PROG.flags.joinDay = G.day; joinRequest(); }
  }
  GEARX.womenT -= dt;
  if (GEARX.womenT <= 0) { GEARX.womenT = 240; for (const c of HUNT.camps) if (!c.own && !c.gone && !(c.hunters || []).some(h => h.alive && h.sex === 'f')) spawnHunter(c, false); }
}
// ---------- the toolbox button ----------
const BOXB = { el: null };
function boxButton() {
  if (BOXB.el || !TOUCH) return; const top = document.getElementById('ttop'); if (!top) return;
  BOXB.el = document.createElement('button'); BOXB.el.id = 'tBox'; BOXB.el.className = 'tb'; BOXB.el.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6V4.5a3 3 0 0 1 6 0V6"/><rect x="5" y="6" width="14" height="15" rx="3"/><path d="M5 12h14M10 12v2h4v-2"/></svg>'; BOXB.el.setAttribute('aria-label', 'ארגז כלים'); BOXB.el.hidden = true;
  top.insertBefore(BOXB.el, top.firstChild);
  BOXB.el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); openBox(); });
}
addEventListener('keydown', e => { if (e.code === 'KeyV' && !e.repeat && G.mode === 'play' && P.human) openBox(); });
function gearFrame(dt) { boxButton(); if (BOXB.el) BOXB.el.hidden = !(G.mode === 'play' && P.human); gearUpdate(dt); }
MISSIONS.hunter.splice(Math.max(1, MISSIONS.hunter.findIndex(m => m.id === 'hunter.cook') + 1), 0, MS('hunter.arrow', 'לירות חץ בקשת', 30, FL('arrow')), MS('hunter.craft', 'לגלף חנית או חצים במחנה', 40, FL('craft')));
for (const m of MISSIONS.hunter) GOAL[m.id] = m;

// ================= ONE CLEAR FOOD SYSTEM, A TORCH, DOGS THAT FETCH, ANIMAL DENSITY AND A TIDY TOP BAR =================
// ---------- cooking: one tap at the fire cooks everything while you stay near it ----------
const FOOD = { auto: false, t: 0, done: 0, dryT: 0, fetchT: 0 };
CTXT.cook = ['meat', 'לבשל הכול', 'ללחוץ כדי לבשל את כל האוכל הנא'];
UPG.find(u => u.id === 'dry').d = 'בשר ודגים נאים במחסן מתייבשים לאט לאוכל מוכן';
function cookTap() {
  if (CLB.latch) return; CLB.latch = true;
  if (FOOD.auto) return;
  FOOD.auto = true; FOOD.t = 0; FOOD.done = 0; UI.notify(`מבשל ${rawCount()} מנות. נשארים ליד האש עד שזה נגמר`, 'good');
}
function cookAuto(dt) {
  if (!FOOD.auto) return;
  if (!P.human || !P.a || !P.a.alive || rawCount() <= 0) { if (FOOD.done) UI.notify(`הבישול הסתיים: ${FOOD.done} מנות מוכנות לאכילה`, 'good'); FOOD.auto = false; return; }
  if (!nearFire(4.2)) { FOOD.auto = false; UI.notify('התרחקת מהאש, הבישול נעצר'); return; }
  FOOD.t += dt; if (FOOD.t < 0.9) return; FOOD.t = 0;
  if ((P.inv.meat || 0) > 0) P.inv.meat--; else P.inv.fish--;
  P.inv.cooked = (P.inv.cooked || 0) + 1; FOOD.done++; PROG.flags.cook = 1; AUD.play('eat', 0.3); combatText(`מבושל ${FOOD.done}`, 'good');
}
// ---------- butchering: a single tap is enough; what does not fit stays on the carcass ----------
function butcherNow() {
  const c = P.carcass; if (!c || c.food <= 0 || !P.human) return;
  const all = Math.max(1, Math.round(c.food / 9)), room = Math.max(0, CARRY.meat - (P.inv.meat || 0)), n = Math.min(all, room);
  if (n <= 0) { UI.notify('הארגז מלא בבשר. אפשר לבשל, לאכול או להפקיד במחנה', 'bad'); return; }
  P.inv.meat = (P.inv.meat || 0) + n; c.food = n >= all ? 0 : c.food * (1 - n / all); PROG.flags.butcher = 1; showTool('knife'); dogScraps(c);
  if (c.dCam < 40) FX.spawn('blood', c.pos.x, c.pos.y + 0.3, c.pos.z, 6);
  AUD.play('bite', 0.5); UI.notify(n < all ? `חתכת ${n} נתחים. הארגז מלא, והשאר נשאר על ה${c.sp.he}` : `חתכת ${n} ${n === 1 ? 'נתח' : 'נתחי'} בשר מה${c.sp.he}`, 'good');
}
// ---------- the drying rack slowly turns raw food in the camp store into ready food ----------
function dryUpdate(dt) {
  if (!CAMPH.up || !CAMPH.up.dry || !CAMPH.store) return;
  FOOD.dryT += dt * (G.timeMul || 1); if (FOOD.dryT < 30) return; FOOD.dryT = 0;
  const st = CAMPH.store;
  if (st.meat > 0) st.meat--; else if (st.fish > 0) st.fish--; else return;
  st.cooked = (st.cooked || 0) + 1;
}
// ---------- the toolbox: food, gear and tools in clear sections ----------
const bar = (have, cap) => `<i class="ihp" style="flex:0 0 64px"><b style="width:${Math.round(clamp(have / cap, 0, 1) * 100)}%;background:var(--gold)"></b></i>`;
function openBox() {
  if (G.mode !== 'play' || !P.human || !P.a) return;
  const st = boxStore(), here = inCamp(10), fire = nearFire(4.2), row = (ic, n, have, cap) => `<div class="irow"><div><b>${ic} ${n}</b></div><span style="display:flex;gap:8px;align-items:center">${bar(have, cap)}<b>${have}/${cap}</b></span></div>`;
  const dog = myDogs().find(d => dist2(d.pos, P.a.pos) < 4 && (d.hunger ?? 100) < 85);
  const food = `<h3>אוכל</h3>${row('🍖', 'מבושל, מוכן לאכילה', P.inv.cooked || 0, CARRY.cooked)}${row('🥩', 'בשר נא', P.inv.meat || 0, CARRY.meat)}${row('🐟', 'דגים נאים', P.inv.fish || 0, CARRY.fish)}` +
    `<div class="btns" style="flex-wrap:wrap">${(P.inv.cooked || 0) > 0 && P.food < 98 ? '<button class="btn pri" data-a="eat">לאכול מנה</button>' : ''}` +
    `${fire && rawCount() > 0 ? `<button class="btn pri" data-a="cook">לבשל הכול (${rawCount()})</button>` : ''}${dog && dogFoodAvail() ? `<button class="btn" data-a="feed">להאכיל את ${dog.name || 'הכלב'}</button>` : ''}</div>` +
    (rawCount() > 0 && !fire ? '<p class="idim">אוכל נא מבשלים ליד אש: מדורת המחנה, או מדורה שמדליקים עם 2 עצים.</p>' : '');
  const gear = `<h3>ציוד</h3>${row('🗡️', 'חניתות', P.spears, P.mods.spearsMax)}${row('🏹', 'חצים', P.arrows || 0, CARRY.arrows)}${row('🪵', 'עצים', P.inv.wood || 0, CARRY.wood)}`;
  const tools = '<h3>כלים</h3><p class="idim">סכין לקרב צמוד ולחיתוך בשר · גרזן לעצים · חנית · קשת לציפורים · חכה ליד המים · לפיד בלילה</p>';
  const camp = here ? `<h3>מחסן המחנה</h3><div class="cstock"><span class="cchip">🍖 ${st.cooked}</span><span class="cchip">🥩 ${st.meat}</span><span class="cchip">🐟 ${st.fish}</span><span class="cchip">🪵 ${st.wood}</span><span class="cchip">🗡️ ${st.spears}</span><span class="cchip">🏹 ${st.arrows}</span></div>` +
    `${CAMPH.up.dry ? '<p class="idim">מתלה הייבוש הופך לאט בשר ודגים נאים במחסן לאוכל מוכן.</p>' : ''}<div class="btns" style="flex-wrap:wrap"><button class="btn" data-a="dep">להפקיד הכול</button><button class="btn" data-a="wd">לקחת מהמחסן</button>` +
    `<button class="btn pri" data-a="cs"${resHave('wood') < 2 ? ' disabled' : ''}>לגלף חנית (2 🪵)</button><button class="btn pri" data-a="ca"${resHave('wood') < 1 ? ' disabled' : ''}>לגלף 4 חצים (1 🪵)</button></div>`
    : '<p class="idim">במחנה יש מחסן גדול לאוכל, עצים, חניתות וחצים, ושם גם מגלפים חניתות וחצים חדשים.</p>';
  const el = uiCard('boxov', `<div class="itabs"><b style="flex:1;font-size:18px">ארגז הכלים</b><button class="ix" data-a="close" aria-label="סגירה">✕</button></div>${food}${gear}${camp}${tools}`);
  el.onclick = e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    const A = b.dataset.a;
    if (A === 'eat') eatOne(); else if (A === 'feed') { DOGF.target = dog; CLB.latch = false; feedDog(); } else if (A === 'cook') { CLB.latch = false; cookTap(); closeCard('boxov'); return; }
    else if (A === 'dep') deposit(); else if (A === 'wd') withdraw(); else if (A === 'cs') craft('spear'); else if (A === 'ca') craft('arrow');
    else { closeCard('boxov'); return; }
    openBox();
  };
}
// ---------- a torch at night for the hunter: light, and predators keep their distance ----------
const TORCH = { light: null, flame: null, t: 0 };
function torchUpdate(dt) {
  const on = G.mode === 'play' && P.human && P.a && P.a.alive && isNight() && !P.a.swimming && !P.sleeping;
  if (!TORCH.light) {
    if (!on) return;
    TORCH.light = new THREE.PointLight(0xffa64a, 0, 16, 1.6); scene.add(TORCH.light);
    TORCH.flame = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.26, 6, 1, true), new THREE.MeshBasicMaterial({ color: '#ffb24a', transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })); scene.add(TORCH.flame);
  }
  TORCH.light.intensity += ((on ? 2.2 + Math.sin(G.t * 13) * 0.25 : 0) - TORCH.light.intensity) * Math.min(1, dt * 4);
  TORCH.flame.visible = on;
  if (!on) return;
  const a = P.a, rx = -Math.cos(a.yaw), rz = Math.sin(a.yaw), fx = Math.sin(a.yaw), fz = Math.cos(a.yaw);
  TORCH.flame.position.set(a.pos.x - rx * 0.32 + fx * 0.2, a.pos.y + 1.55, a.pos.z - rz * 0.32 + fz * 0.2); TORCH.flame.scale.y = 0.85 + Math.sin(G.t * 17) * 0.15;
  TORCH.light.position.copy(TORCH.flame.position).y += 0.2;
  TORCH.t -= dt; if (TORCH.t > 0) return; TORCH.t = 1;
  if (!PROG.flags.torchTold) { PROG.flags.torchTold = 1; UI.notify('בלילה הצייד מדליק לפיד: הוא מאיר את הדרך, וטורפים נשארים במרחק', 'good'); }
  shQuery(a.pos.x, a.pos.z, 7, b => { if (b.alive && !b.isPlayer && !b.pet && !b.legend && b.tpl.kind === 'quad' && (b.sp.ai === 'pred' || b.sp.ai === 'pack') && b.state !== 'fight' && b.state !== 'flee') threatReact(b, a, true); });
}
// ---------- dogs bring the prey they bring down to the hunter ----------
function fetchStart(dog, t) {
  if (!dog || !t || t.tpl.kind === 'fish' || (t.sp.food || 20) * (t.baseScale || 1) > 60) return;
  dog.fetch = t; dog.fetchPh = 'go';
}
function fetchUpdate(dt) {
  if (!P.human || !P.a) return;
  for (const d of myDogs()) {
    const c = d.fetch; if (!c) continue;
    if (c.gone || c.food <= 0 || !d.alive || (c.heldBy && c.heldBy !== d)) { if (c && c.heldBy === d) c.heldBy = null; d.fetch = null; continue; }
    if (d.fetchPh === 'go') {
      const dx = c.pos.x - d.pos.x, dz = c.pos.z - d.pos.z, dd = Math.hypot(dx, dz) || 0.01;
      d.stunT = 0.1; if (dd > 1.2) { d.move(dx / dd, dz / dd, d.sp.run * 0.8, dt); d.pose = 'move'; } else { d.fetchPh = 'bring'; c.heldBy = d; }
    } else {
      const hx = P.a.pos.x - d.pos.x, hz = P.a.pos.z - d.pos.z, hd = Math.hypot(hx, hz) || 0.01;
      d.stunT = 0.1; if (hd > 1.8) { d.move(hx / hd, hz / hd, d.sp.run * 0.7, dt); d.pose = 'move'; }
      const fx = Math.sin(d.yaw), fz = Math.cos(d.yaw); c.pos.x = d.pos.x + fx * (d.rad + 0.3); c.pos.z = d.pos.z + fz * (d.rad + 0.3); c.yaw = d.yaw + Math.PI / 2;
      if (c.tpl.kind !== 'quad') c.pos.y = getH(c.pos.x, c.pos.z) + 0.05;
      if (hd < 2.2) { c.heldBy = null; d.fetch = null; UI.notify(`${d.name || 'הכלב'} ${heb(d, 'הביא', 'הביאה')} לך ${c.sp.he}. אפשר לחתוך בשר`, 'good'); PROG.flags.fetch = 1; }
    }
  }
}
// ---------- how many animals live in the jungle (for weaker phones) ----------
const faunaK = () => +SET.fa || 1;
function faunaCull() {
  const want = {}, have = {}, f = QUAL[SET.q].fauna * faunaK();
  for (const id of GUIDE_ORDER) { const sp = SPECIES[id]; if (sp && sp.count) want[id] = Math.round(sp.count * f); }
  for (const a of ANIMALS) if (a.alive && !a.isPlayer && !a.socialExtra && !a.legend && !a.pet && !a.hunter && !a.tribe && !a.cowCamp) have[a.spId] = (have[a.spId] || 0) + 1;
  for (const id in have) {
    let extra = have[id] - (want[id] ?? have[id]); if (extra <= 0) continue;
    for (const a of ANIMALS.slice()) { if (extra <= 0) break; if (a.spId === id && a.alive && !a.isPlayer && !a.socialExtra && !a.legend && !a.pet && !a.hunter && !a.tribe && !a.cowCamp && (a.dCam || 999) > 120) { a.remove(); extra--; } }
  }
}
// ---------- the clock always sits to the left of the top buttons ----------
const TOPB = { t: 0 };
function topBarUpdate(dt) { hudLayout(dt); }
function foodUpdate(dt) { cookAuto(dt); dryUpdate(dt); torchUpdate(dt); fetchUpdate(dt); topBarUpdate(dt); }
MISSIONS.hunter.splice(Math.max(1, MISSIONS.hunter.findIndex(m => m.id === 'hunter.craft') + 1), 0, MS('hunter.fetch', 'שהכלב יביא לך טרף', 50, FL('fetch')));
for (const m of MISSIONS.hunter) GOAL[m.id] = m;
// resources come from what you carry first, then from the camp store when you are in the camp
const resHave = k => (P.inv[k] || 0) + (inCamp(10) && CAMPH.store ? (CAMPH.store[k] || 0) : 0);
function takeRes(k, n) {
  if (!n) return true; if (resHave(k) < n) return false;
  const a = Math.min(P.inv[k] || 0, n); P.inv[k] = (P.inv[k] || 0) - a; if (n - a > 0) CAMPH.store[k] -= n - a; return true;
}

// ================= TOUCH HUD LAYOUT: THE TOP BUTTONS ARE NEVER COVERED, IN LANDSCAPE OR UPRIGHT =================
// Everything near the top is measured and placed around two anchors: the minimap (left) and the button row (right).
// When the status pill does not fit between them (an upright phone, or the hunter's extra button), the HUD switches
// to two columns: pill under the minimap, clock and target card under the buttons, notifications at the bottom.
const HL = { t: 0 };
(function () {
  const st = document.createElement('style');
  st.textContent = `body.touch.ttight #ttop{gap:5px}body.touch.ttight #ttop .tb{width:36px;height:36px}body.touch.ttight #ttop .tb svg{width:18px;height:18px}
body.touch.hstack.hud-compact #feed,body.touch.hstack.hud-min #feed{top:auto!important;bottom:var(--feedB,190px)!important;left:50%!important;right:auto!important;transform:translateX(-50%)!important;width:min(92vw,440px)!important}`;
  document.head.appendChild(st);
  addEventListener('resize', () => { HL.t = 0; });
})();
function hlSet(el, prop, v) { if (!el) return; if (v == null) el.style.removeProperty(prop); else el.style.setProperty(prop, typeof v === 'number' ? `${Math.round(v)}px` : v, 'important'); }
function hlShown(el) { return !!el && !el.hidden && el.getClientRects().length > 0 && getComputedStyle(el).display !== 'none'; }
function hudLayout(dt) {
  HL.t -= dt; if (HL.t > 0) return; HL.t = 0.25;
  const hud = document.getElementById('hud');
  if (!TOUCH || !hud || hud.hidden) return;
  const byId = id => document.getElementById(id), body = document.body, W = innerWidth, H = innerHeight, gap = 6;
  const mini = byId('mini'), tt = byId('ttop'), vp = byId('vPill'), ck = byId('clock');
  if (!hlShown(mini) || !hlShown(tt) || !ck) return;
  // 0. when even the smallest buttons cannot stand beside the minimap, the minimap goes down, under the button row
  const down = miniPlace(tt, mini);
  const mr = mini.getBoundingClientRect(); let tr = tt.getBoundingClientRect();
  // 1. the button row shrinks a little only when it would run into the minimap (or the edge of the screen)
  const nb = [...tt.children].filter(b => !b.hidden).length, fullW = nb * 42 + (nb - 1) * 8, tight = tr.right - fullW < (down ? 10 : mr.right + gap);
  if (tight !== body.classList.contains('ttight')) { body.classList.toggle('ttight', tight); tr = tt.getBoundingClientRect(); }
  // 2. the status pill: beside the minimap when it fits, otherwise under it; its full card opens right below it
  let vpL = mr.right + gap, vpT = tr.top, vw = 0, vh = 0, row = true;
  if (hlShown(vp)) {
    const vr = vp.getBoundingClientRect(); vw = vr.width; vh = vr.height;
    row = !down && mr.right + gap + vw + gap <= tr.left;
    if (row) { vpL = mr.right + gap; vpT = tr.top + (tr.height - vh) / 2; } else { vpL = mr.left; vpT = mr.bottom + gap; }
    hlSet(vp, 'left', vpL); hlSet(vp, 'top', vpT);
    const vt = byId('vitals'); hlSet(vt, 'left', vpL); hlSet(vt, 'top', vpT + vh + gap);
  }
  // 3. the clock: on the button row when it fits, otherwise right under the buttons
  const cr = ck.getBoundingClientRect(), cw = cr.width || 90, chh = cr.height || 22, leftEdge = row && vw ? vpL + vw : mr.right;
  const ckRow = !down && tr.left - 8 - cw >= leftEdge + gap;
  hlSet(ck, 'left', 'auto'); hlSet(ck, 'transform', 'none');
  if (ckRow) { hlSet(ck, 'right', W - tr.left + 8); hlSet(ck, 'top', tr.top + (tr.height - chh) / 2); }
  else { hlSet(ck, 'right', W - tr.right); hlSet(ck, 'top', tr.bottom + gap); }
  const rightBottom = ckRow ? tr.bottom : tr.bottom + gap + chh, stack = !row || !ckRow;
  body.classList.toggle('hstack', stack);
  // 4. on an upright phone the target card sits under the clock, clear of the minimap
  const tg = byId('target');
  if (tg) {
    if (matchMedia('(max-width:520px)').matches) { hlSet(tg, 'top', rightBottom + gap); hlSet(tg, 'max-width', Math.max(140, tr.right - mr.right - gap * 2)); }
    else { hlSet(tg, 'top', null); hlSet(tg, 'max-width', null); }
  }
  // 5. the left column (missions, family) starts under the minimap and the pill; a legend's bar under the right column
  hlSet(byId('lcol'), 'top', stack ? Math.max(mr.bottom, row ? 0 : vpT + vh) + gap : null);
  hlSet(byId('boss'), 'top', stack ? rightBottom + gap : null);
  // 6. with a crowded top, notifications show at the bottom, just above the controls
  if (stack) {
    let ctop = H;
    for (const b of document.querySelectorAll('#tbtns .tb')) if (hlShown(b) && b.id !== 'tWpn') ctop = Math.min(ctop, b.getBoundingClientRect().top);
    const joy = byId('joy'); if (hlShown(joy)) ctop = Math.min(ctop, joy.getBoundingClientRect().top);
    body.style.setProperty('--feedB', `${Math.round(H - ctop + 12)}px`);
  }
}
