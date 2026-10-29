// ================= ROLES AND ORDERS FOR EACH PERSON: knights and merchants, residents who take a role, a chief who commands one by one =================
// A knight is a warrior in armour (a helmet, mail, a surcoat and a shield), stronger and harder to bring down; he rides first
// when there are horses. A merchant is a gatherer who also trades: caravans go out with merchants, and each one gets the
// tribe better prices. Anyone of the residents in the houses can be called out and given a role; anyone can be sent home to
// the houses again. And every person can get an order of their own.
Object.assign(CLS, { knight: { m: 'אביר', f: 'אבירה', pl: 'אבירים', ic: '🏇' }, merchant: { m: 'סוחר', f: 'סוחרת', pl: 'סוחרים', ic: '💰' } });
Object.assign(CLSC, { knight: '#a9c4dc', merchant: '#c9a2e6' });
const MAXHAND = 40;   // people of the tribe out in the world (more than this live in the houses as residents)
const ROLEK = ['warrior', 'hunter', 'builder', 'gatherer', 'knight', 'merchant'];
// a role is a class, and for knights and merchants a mark on top of it
const roleOf = m => m.knight ? 'knight' : m.merchant ? 'merchant' : m.cls;
const roleBase = r => r === 'knight' ? 'warrior' : r === 'merchant' ? 'gatherer' : r;
const ROLE_NEED = { knight: { gold: 30, b: 'stable', why: 'צריך אורווה' } };
const ROLE_SAY = { warrior: 'אני אשמור על הכפר', hunter: 'אצא לצוד בשביל כולם', builder: 'אבנה ואכרות עצים', gatherer: 'אביא פירות ומים', knight: 'השריון עליי. אגן על הכפר בכל מחיר', merchant: 'אסחר עם השבטים, ואחזור עם זהב' };
// how strong someone is in a fight, for the odds of a raid
const fightPow = m => m.cls === 'warrior' ? (m.knight ? 2.4 : m.wpn === 'sword' ? 1.75 : 1.4) : m.cls === 'hunter' ? 1.1 : 0.4;
// why a role cannot be given now ('' when it can): short, for the button
function roleBlock(r) {
  const R = ROLE_NEED[r]; if (!R) return '';
  if (R.b && !BLD.list.some(b => b.done && b.t === R.b)) return R.why;
  if (R.gold && goldHave() < R.gold) return `צריך ${R.gold} זהב`;
  return '';
}
const roleWhyLong = r => { const w = roleBlock(r); return !w ? '' : r === 'knight' ? (w === ROLE_NEED.knight.why ? 'אביר צריך אורווה בכפר: בלי סוסים אין אבירים' : `שריון, מגן וחרב לאביר עולים ${ROLE_NEED.knight.gold} זהב (יש ${goldHave()}). זהב מקבלים ממסחר ומפשיטות`) : w; };
const roleCost = r => (ROLE_NEED[r] && ROLE_NEED[r].gold) || 0;
// a knight's body: more life; his weapon: a sword
function roleApply(m) {
  const k = m.knight ? 1.5 : 1, k0 = m.hpK || 1;
  if (k !== k0) { m.maxHp = m.maxHp / k0 * k; m.hp = Math.min(m.maxHp, m.hp * k / k0); m.hpK = k; }
  if (m.knight) m.wpn = 'sword';
}
// give someone of the tribe a role (from the people screen)
function setRole(m, r, quiet) {
  if (!m || m.young) return false;
  if (r === roleOf(m)) return true;
  const why = roleBlock(r); if (why && !(r === 'knight' && m.knightPaid)) { if (!quiet) UI.notify(roleWhyLong(r), 'bad'); return false; }
  if (r === 'knight' && !m.knightPaid) { goldPay(roleCost(r)); m.knightPaid = true; }
  m.knight = r === 'knight'; m.merchant = r === 'merchant';
  setCls(m, roleBase(r), true); m.clsLock = true;
  if (!quiet) { say(m, ROLE_SAY[r] || 'בסדר'); UI.notify(`${m.name} ${heb(m, 'הוא', 'היא')} עכשיו ${clsWord(m)}`, 'good'); }
  return true;
}
// one of the residents comes out of the houses with a role
function promoteResident(r) {
  const v = ownCamp(); if (!v) return false;
  if (CLAN.residents <= 0) { UI.notify('אין עכשיו תושבים בבתים', 'bad'); return false; }
  if (clanReal().length >= MAXHAND) { UI.notify(`כבר יש ${MAXHAND} אנשים עם תפקיד. אפשר להחזיר מישהו לגור בבתים (🏠 ליד השם), ואז לקרוא לתושב אחר`, 'bad'); return false; }
  const why = roleBlock(r); if (why) { UI.notify(roleWhyLong(r), 'bad'); return false; }
  const b = spawnNewcomer(v, roleBase(r), { knight: r === 'knight', merchant: r === 'merchant', knightPaid: r === 'knight' }); if (!b) return false;
  CLAN.residents--; if (roleCost(r)) goldPay(roleCost(r));
  b.clsLock = true; roleApply(b);
  // out of the nearest house
  const hs = BLD.list.filter(q => q.done && BTYPES[q.t].cap); if (hs.length) { const h = pick(hs); b.pos.set(h.x + rr(-1.5, 1.5), 0, h.z + rr(-1.5, 1.5)); b.ground(1, true); }
  say(b, ROLE_SAY[r] || 'אני מוכן', 3);
  UI.notify(`🏠 ${b.name} ${heb(b, 'יצא', 'יצאה')} מהבתים: מעכשיו ${heb(b, 'הוא', 'היא')} ${clsWord(b)}`, 'good'); AUD.play('chime', 0.5);
  PROG.flags.promote = 1; saveGame(); return true;
}
// back to the houses: one more resident, one less person out in the world
function canDemote(m) { return !!m && !m.young && !m.isPartner && TRIBE.adults.includes(m) && !(m.job && (m.job.k === 'raid' || m.job.k === 'ship' || m.job.k === 'boat' || m.job.k === 'caravan')) && !m.inCart && !m.inShip; }
function demoteToResident(m) {
  if (!canDemote(m)) return false;
  if (m.ord) ordLeave(m); if (m.towerB) towerLeave(m);
  // a dog or an eagle stays with someone else who goes out
  for (const q of m.pets || []) if (q.alive) { const o = clanAdults().find(x => x !== m && (x.cls === 'hunter' || x.cls === 'warrior') && !(x.pets || []).length) || clanAdults().find(x => x !== m); if (o) { q.pet = o; (o.pets || (o.pets = [])).push(q); } }
  m.pets = [];
  if (m.spouse && m.spouse.spouse === m) { m.spouse.spouse = null; }
  TRIBE.adults.splice(TRIBE.adults.indexOf(m), 1); CLAN.residents++;
  UI.notify(`🏠 ${m.name} ${heb(m, 'חזר', 'חזרה')} לגור בבתים, עם התושבים`, 'good');
  m.remove(); saveGame(); return true;
}

// ---------- the look of knights and merchants ----------
function roleDress(o, cls, tk, f, v) {
  const C = o.c, acc = TRIBEC[tk] || '#e2a93b';
  o.noSpear = true; o.quiver = false; o.scarf = false; o.beard = f ? 'none' : o.beard;
  if (cls === 'knight') {
    o.sleeves = 'long'; o.bracers = false; o.hat = 'none'; o.noRope = true; o.noPouch = true;
    // the knights of a castle carry their lances; the tribe's own knights their swords
    if (/^cv_/.test(tk)) o.noSpear = false;
    C.shirt = '#8d959c'; C.pants = '#6c7278'; C.boot = '#3b3532'; C.belt = '#4a3524'; C.hat = acc;
    o.extra = (R, Cc, MK) => knightGear(R, Cc, MK, acc, v || 0);
  } else if (cls === 'merchant') {
    o.sleeves = true; o.hat = 'brim';
    C.shirt = '#5b3a7a'; C.pants = '#4a2f63'; C.boot = '#3a2a1c'; C.hat = '#3a2550'; C.band = '#d9b24c'; C.belt = '#d9b24c';
    o.extra = (R, Cc, MK) => merchantGear(R, Cc, MK);
  }
}
function knightGear(R, C, MK, acc, v) {
  const B = R.map, W = n => R.wp[B[n]], steel = col('#a3abb3'), dark = col('#3b3f44'), tab = col(acc), cross = col('#f2efe6');
  const add = (g, p, r, s, bone, c, m) => R.add(g, M(p, r, s), B[bone], c, m ?? MK);
  if (v === 1) {
    // a great helm: a closed pot of steel with a slit for the eyes and holes to breathe
    add(new THREE.CylinderGeometry(0.122, 0.128, 0.24, 16), [0, 1.69, 0.008], null, [1, 1, 1.05], 'head', steel, 0);
    add(new THREE.CylinderGeometry(0.11, 0.122, 0.03, 16), [0, 1.825, 0.008], null, [1, 1, 1.05], 'head', steel, 0);
    add(new THREE.BoxGeometry(0.17, 0.014, 0.02), [0, 1.7, 0.128], null, null, 'head', col('#141414'), 0);
    add(new THREE.BoxGeometry(0.018, 0.13, 0.014), [0, 1.66, 0.13], null, null, 'head', cross, 0);
    for (let k = 0; k < 3; k++) add(new THREE.SphereGeometry(0.004, 4, 3), [0.04 + k * 0.012, 1.64, 0.13], null, null, 'head', col('#141414'), 0);
  } else if (v === 2) {
    // a kettle hat with a wide brim over a mail hood round the face
    add(new THREE.SphereGeometry(1, 16, 10, 0, TAU, 0, Math.PI * 0.62), [0, 1.68, -0.012], [-0.55, 0, 0], [0.122, 0.14, 0.132], 'head', col('#8d959c'), 0);
    for (const s of [-1, 1]) add(new THREE.SphereGeometry(1, 10, 8), [s * 0.083, 1.625, -0.01], null, [0.035, 0.075, 0.075], 'head', col('#8d959c'), 0);
    add(new THREE.TorusGeometry(0.13, 0.03, 6, 18), [0, 1.48, -0.01], [Math.PI / 2, 0, 0], [1.08, 0.85, 1], 'chest', col('#8d959c'), 0);
    add(new THREE.SphereGeometry(1, 16, 8, 0, TAU, 0, Math.PI / 2), [0, 1.76, -0.008], null, [0.12, 0.09, 0.125], 'head', steel, 0);
    add(new THREE.CylinderGeometry(0.2, 0.21, 0.012, 22), [0, 1.765, -0.008], [0.06, 0, 0], null, 'head', steel, 0);
  } else {
    // a round helmet of steel with a rim, a nose guard and a crest in the tribe's colour
    add(new THREE.SphereGeometry(1, 16, 10, 0, TAU, 0, Math.PI * 0.56), [0, 1.686, 0.0], null, [0.118, 0.14, 0.126], 'head', steel, 0);
    add(new THREE.TorusGeometry(0.114, 0.012, 6, 22), [0, 1.7, 0.0], [Math.PI / 2, 0, 0], [1, 1.07, 1], 'head', dark, 0);
    add(new THREE.BoxGeometry(0.02, 0.075, 0.014), [0, 1.662, 0.121], [-0.1, 0, 0], null, 'head', steel, 0);
    add(new THREE.BoxGeometry(0.022, 0.06, 0.17), [0, 1.83, -0.004], null, null, 'head', tab, MK);
  }
  // a surcoat over the mail, a white cross on it, and a cape
  dGown(R, MK, tab, { top: 1.42, bot: 0.56, flare: 0.22, over: 0.008 });
  add(new THREE.BoxGeometry(0.05, 0.3, 0.006), [0, 1.2, 0.147], [0.05, 0, 0], null, 'spine', cross, 0);
  add(new THREE.BoxGeometry(0.17, 0.05, 0.006), [0, 1.25, 0.148], [0.05, 0, 0], null, 'spine', cross, 0);
  dBelt(R, MK, '#3a2a1c'); dScabbard(R, MK, '#3a2a1c');
  if (v !== 2) civCape(R, MK, mixC(tab, col('#000000'), 0.35), false);
  // shoulder plates and gauntlets
  for (const n of ['L', 'R']) {
    const A = W(n + 'ua'), E = W(n + 'la');
    add(new THREE.SphereGeometry(1, 10, 8, 0, TAU, 0, Math.PI / 2), [A.x * 1.02, A.y + 0.012, A.z], null, [0.076, 0.052, 0.076], n + 'ua', steel, 0);
    add(new THREE.CylinderGeometry(0.047, 0.041, 0.13, 9), [E.x, E.y - 0.17, E.z], null, null, n + 'la', steel, 0);
  }
  // the shield on the left arm: the tribe's colour, a white cross, a steel boss
  const E = W('Lla');
  add(new THREE.BoxGeometry(0.03, 0.44, 0.31), [E.x + 0.075, E.y - 0.13, E.z + 0.03], null, null, 'Lla', tab, MK);
  add(new THREE.BoxGeometry(0.034, 0.45, 0.04), [E.x + 0.079, E.y - 0.13, E.z + 0.03], null, null, 'Lla', cross, 0);
  add(new THREE.BoxGeometry(0.034, 0.04, 0.32), [E.x + 0.079, E.y - 0.07, E.z + 0.03], null, null, 'Lla', cross, 0);
  add(new THREE.SphereGeometry(0.032, 8, 6), [E.x + 0.096, E.y - 0.11, E.z + 0.03], null, null, 'Lla', steel, 0);
  add(new THREE.TorusGeometry(0.17, 0.008, 4, 4), [E.x + 0.078, E.y - 0.13, E.z + 0.03], [0, Math.PI / 2, Math.PI / 4], [1, 1.3, 1], 'Lla', dark, 0);
}
function merchantGear(R, C, MK) {
  const B = R.map, gold = col('#d9b24c'), add = (g, p, r, s, bone, c, m) => R.add(g, M(p, r, s), B[bone], c, m ?? MK);
  // a long robe to the ankles, a sash of gold, a purse at the hip and a chain of office
  add(new THREE.CylinderGeometry(0.175, 0.27, 0.74, 16, 1, true), [0, 0.6, 0], null, [1, 1, 0.82], 'root', C.shirt, MK);
  add(new THREE.TorusGeometry(0.165, 0.02, 6, 20), [0, 0.99, 0], [Math.PI / 2, 0, 0], [1, 0.74, 1], 'root', gold, 0);
  add(new THREE.SphereGeometry(1, 10, 8), [0.175, 0.9, 0.04], null, [0.05, 0.065, 0.04], 'root', col('#7a5634'), MK);
  add(new THREE.TorusGeometry(0.03, 0.006, 4, 10), [0.175, 0.96, 0.04], [Math.PI / 2, 0, 0], null, 'root', gold, 0);
  add(new THREE.TorusGeometry(0.086, 0.008, 5, 18), [0, 1.47, 0.02], [Math.PI / 2 - 0.4, 0, 0], null, 'chest', gold, 0);
}

// ---------- a card for one person: role, an order, back to the houses, free to go home ----------
const PCARD = { where: 'home' };
const PORD = ['hunt', 'wood', 'food', 'fish', 'build', 'guard', 'tame'];
function personCard(m) {
  if (!m || !m.alive || m.gone) { campMenu('people'); return; }
  const r = roleOf(m), busy = m.job && (m.job.k === 'raid' || m.job.k === 'caravan' || m.job.k === 'ship');
  const W = ordWhereList(); if (!W.some(w => w.k === PCARD.where)) PCARD.where = 'home';
  const roles = ROLEK.map(k => { const why = k === r ? '' : k === 'knight' && m.knightPaid ? '' : roleBlock(k), cost = k === 'knight' && !m.knightPaid ? roleCost(k) : 0;
    return `<button class="pr${k === r ? ' on' : ''}" data-r="${k}"${why ? ' disabled' : ''} title="${roleWhyLong(k)}"><span>${CLS[k].ic}</span><b>${m.sex === 'f' ? CLS[k].f : CLS[k].m}</b>${why ? `<small>${why}</small>` : cost ? `<small>🪙 ${cost}</small>` : ''}</button>`; }).join('');
  const ords = PORD.filter(k => ORDT[k]).map(k => { const T = ORDT[k], cur = m.ord && !m.ord.done && m.ord.k === k; return `<button class="po${cur ? ' on' : ''}" data-o="${k}"${busy || (k === 'build' && !ordBuildable()) ? ' disabled' : ''}><span>${T.ic}</span><b>${T.n}</b></button>`; }).join('');
  const now = m.ord && !m.ord.done ? `${ORDT[m.ord.k].ic} ${ORDT[m.ord.k].n} · ${ordProgress(m.ord)}` : m.escort ? '🚶 הולך איתך' : doingTribe(m);
  const dr = depChain().findIndex(q => q.m === m);
  const body = `<div class="vxhero"><b>${m.name}</b><span>${clsWord(m)}${m.isPartner ? (m.sex === 'f' ? ' · אשתך' : ' · בעלך') : ''} · ${now} · ${whereIs(m)}${dr >= 0 ? ` · ⭐ ${dr + 1} בסדר הפיקוד${DEP.away && DEP.cur === m ? ` (${heb(m, 'אחראי', 'אחראית')} על הכפר עכשיו)` : ''}` : ''}</span></div>` +
    `<h3>תפקיד</h3><div class="prow">${roles}</div>` +
    `<h3>פקודה ${heb(m, 'לו', 'לה')}</h3><div class="owhere"><span>לאן:</span>${W.map(w => `<button class="${PCARD.where === w.k ? 'on' : ''}" data-w="${w.k}">${w.ic} ${w.n}</button>`).join('')}</div>` +
    `<div class="prow">${ords}<button class="po${m.escort ? ' on' : ''}" data-o="follow"${busy ? ' disabled' : ''}><span>🚶</span><b>לבוא איתי</b></button><button class="po" data-o="back"${!m.ord && !m.escort ? ' disabled' : ''}><span>↩️</span><b>לחזור לעבודה</b></button></div>` +
    (busy ? `<p class="idim">${heb(m, 'הוא', 'היא')} עכשיו ${m.job.k === 'raid' ? 'בפשיטה' : m.job.k === 'caravan' ? 'בשיירה' : 'בספינה'}. אפשר לתת פקודה כש${heb(m, 'יחזור', 'תחזור')}.</p>` : '') +
    `<h3>עוד</h3><div class="btns" style="flex-wrap:wrap">` +
    `<button class="btn${DEP.uid === m.uid ? ' pri' : ''}" data-a="dep">⭐ ${DEP.uid === m.uid ? heb(m, 'הסגן שלך (לבטל)', 'הסגנית שלך (לבטל)') : heb(m, `למנות לסגן: אחראי ${you('כשאתה', 'כשאת')} לא בכפר`, `למנות לסגנית: אחראית ${you('כשאתה', 'כשאת')} לא בכפר`)}</button>` +
    (canDemote(m) ? `<button class="btn" data-a="home">🏠 ${heb(m, 'שיחזור', 'שתחזור')} לגור בבתים</button>` : '') +
    `<button class="btn" data-a="find">📍 איפה ${heb(m, 'הוא', 'היא')}?</button><button class="btn pri" data-a="back">חזרה לאנשים</button></div>`;
  const el = uiCard('campov', `<div class="itabs"><button data-a="back">‹ אנשים</button><b style="flex:1;font-size:16px;padding:0 6px">${m.name}</b><button class="ix" data-a="close" aria-label="סגירה">✕</button></div><div class="ibody">${body}</div>`);
  el.querySelector('.card').classList.add('vxcard');
  el.onclick = e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    if (b.dataset.w) { PCARD.where = b.dataset.w; personCard(m); return; }
    if (b.dataset.r) { if (setRole(m, b.dataset.r)) { PROG.flags.setcls = 1; saveGame(); } personCard(m); return; }
    if (b.dataset.o) {
      const k = b.dataset.o;
      if (k === 'follow') { if (m.ord) ordLeave(m); ordDropCarry(m); m.escort = !m.escort; m.job = null; m.hidden = false; m.sleepAt = null; UI.notify(m.escort ? `🚶 ${m.name} ${heb(m, 'בא', 'באה')} איתך` : `${m.name} ${heb(m, 'חוזר', 'חוזרת')} לעבוד בכפר`, 'good'); saveGame(); personCard(m); return; }
      if (k === 'back') { if (m.ord) { const o = m.ord; ordLeave(m); if (!o.men.length) ordEnd(o, 'quiet'); } m.escort = false; m.job = null; UI.notify(`↩️ ${m.name} ${heb(m, 'חוזר', 'חוזרת')} לעבודה הרגילה`, 'good'); saveGame(); personCard(m); return; }
      if (m.ord) { const o = m.ord; ordLeave(m); if (!o.men.length) ordEnd(o, 'quiet'); }
      m.escort = false;
      if (!ordStart(k, 1, PCARD.where, [m])) UI.notify(k === 'build' ? 'אין עכשיו מה לבנות' : `${m.name} לא ${heb(m, 'יכול', 'יכולה')} לצאת עכשיו`, 'bad');
      personCard(m); return;
    }
    const A = b.dataset.a;
    if (A === 'dep') { depChoose(m); personCard(m); return; }
    if (A === 'home') { if (demoteToResident(m)) campMenu('people'); return; }
    if (A === 'find') { closeCard('campov'); trackWay(m); return; }
    if (A === 'close') { closeCard('campov'); return; }
    campMenu('people');
  };
}
// the residents in the houses: how many, and the roles they can be called out to
function residentsHtml() {
  const n = CLAN.residents, full = clanReal().length >= MAXHAND;
  const btns = ROLEK.map(k => { const why = roleBlock(k), cost = roleCost(k); return `<button class="pr" data-pr="${k}"${!n || full || why ? ' disabled' : ''} title="${roleWhyLong(k)}"><span>${CLS[k].ic}</span><b>${CLS[k].m}</b>${why ? `<small>${why}</small>` : cost ? `<small>🪙 ${cost}</small>` : ''}</button>`; }).join('');
  if (!n) return `<h3>🏠 התושבים בבתים</h3><p class="idim">עוד אין תושבים בבתים. כשהכפר גדל ויש מקום, אנשים חדשים באים לגור בו.</p>`;
  const R = resMix(), w = CLAN.rmix || RMIX0, tot = WORK.reduce((s, k) => s + (w[k] || 0), 0) || 1;
  const DO = { warrior: 'שומרים על החומות', hunter: 'מביאים בשר', builder: 'כורתים עצים ובונים', gatherer: 'מביאים אוכל ומים' };
  const mix = WORK.map(k => `<div class="rmrow"><span>${CLS[k].ic} <b>${R[k]}</b> ${CLS[k].pl}<small>${DO[k]} · ${Math.round((w[k] || 0) / tot * 100)}%</small></span><button data-rm="${k}:-1" aria-label="פחות ${CLS[k].pl}"${!(w[k] > 0) ? ' disabled' : ''}>−</button><button data-rm="${k}:1" aria-label="יותר ${CLS[k].pl}">+</button></div>`).join('');
  return `<h3>🏠 התושבים בבתים · ${n}</h3><p class="idim">גם להם יש תפקידים. הם עובדים ושומרים כמו כולם, רק בלי שרואים כל אחד מהם (כדי שהמשחק ירוץ מהר). ${you('אתה קובע', 'את קובעת')} כמה מהם בכל תפקיד:</p>` +
    `<div class="rmix">${mix}<div class="rmrow"><span>🧒 <b>${R.child}</b> ילדים<small>גדלים בבתים</small></span></div></div>` +
    `<p class="idim">אפשר גם לקרוא לאחד מהם החוצה, ואז ${you('תראה', 'תראי')} אותו מסתובב בכפר ויוצא לפקודות:${full ? ` (כבר יש ${MAXHAND} אנשים בחוץ: קודם להחזיר מישהו לבתים)` : ''}</p><div class="prow">${btns}</div>`;
}
(function () {
  const st = document.createElement('style');
  st.textContent = `.prow{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:6px;margin:4px 0 8px}
.prow button{display:flex;flex-direction:column;align-items:center;gap:2px;padding:7px 4px;border:1px solid var(--line);border-radius:12px;background:rgba(127,127,127,.06);color:var(--ink);cursor:pointer;font:600 12.5px Rubik,sans-serif;min-height:58px}
.prow button span{font-size:20px;line-height:1.1}.prow button b{font-size:12.5px;font-weight:600;text-align:center}.prow button small{font-size:10.5px;color:var(--dim);text-align:center;line-height:1.2}
.prow button.on{background:rgba(232,176,75,.28);border-color:var(--gold)}.prow button:disabled{opacity:.45;cursor:default}
.vxcls button.pc{font-size:15px}
.rmix{display:flex;flex-direction:column;gap:5px;margin:4px 0 8px}.rmrow{display:flex;align-items:center;gap:6px;padding:6px 10px;border:1px solid var(--line);border-radius:11px}
.rmrow span{flex:1;display:flex;align-items:baseline;gap:5px;flex-wrap:wrap;font-size:14px}.rmrow small{color:var(--dim);font-size:12px}
.rmrow button{width:34px;height:30px;border-radius:9px;border:1px solid var(--line);background:rgba(127,127,127,.08);color:var(--ink);font:700 17px Rubik,sans-serif;cursor:pointer}.rmrow button:disabled{opacity:.35;cursor:default}`;
  document.head.appendChild(st);
})();
// ================= TRADE: gold, prices, a market in every camp, and caravans that carry the goods =================
// Gold (🪙) is kept in the village store. Every tribe buys and sells food, wood, spears, arrows, swords, mounts and cattle,
// each at its own price: friends sell cheaper, a hungry tribe pays more for food, the desert pays more for wood, and every
// merchant of your tribe makes the deal better. Near their camp you trade at once; from afar a merchant takes a caravan.
const TRADE = { gold: {}, wood: {}, basket: [], cv: [], day: -1, t: 0, deals: 0 };
const GOODS = {
  food: { n: 'אוכל', ic: '🍖', u: 5, p: 2, un: 'מנות' },
  wood: { n: 'עצים', ic: '🪵', u: 10, p: 0.7, un: 'עצים' },
  spears: { n: 'חניתות', ic: '🗡️', u: 3, p: 4, un: 'חניתות' },
  arrows: { n: 'חצים', ic: '🏹', u: 10, p: 0.6, un: 'חצים' },
  swords: { n: 'חרבות', ic: '⚔️', u: 1, p: 16, un: 'חרב' },
  horse: { n: 'סוסים', ic: '🐎', u: 1, p: 40, un: 'סוס' },
  cow: { n: 'בקר', ic: '🐄', u: 1, p: 22, un: 'פרה' }
};
// the mount of each land: horses in the jungle, reindeer in the north, camels in the desert
const MOUNTN = { horse: ['סוס', 'סוסים', '🐎'], camel: ['גמל', 'גמלים', '🐪'], reindeer: ['איל צפון', 'אילי צפון', '🦌'] };
const goodN = (i, k) => { if (k !== 'horse') return GOODS[k]; const id = (i != null && HUNT.camps[i] && mountOf(HUNT.camps[i])) || 'horse', M0 = MOUNTN[id] || MOUNTN.horse; return Object.assign({}, GOODS.horse, { n: M0[1], un: M0[0], ic: M0[2] }); };
const bundleW = (i, k) => { const G0 = goodN(i, k); return G0.u > 1 ? `${G0.u} ${G0.un}` : G0.un; };
function goldHave() { return Math.floor(boxStore().gold || 0); }
function goldAdd(n) { const st = boxStore(); st.gold = Math.max(0, Math.round((st.gold || 0) + n)); }
function goldPay(n) { goldAdd(-n); }
const merchantsN = () => clanAdults().filter(m => m.merchant).length;
function campGold(i) { const c = HUNT.camps[i]; if (!c) return 0; if (TRADE.gold[i] == null) TRADE.gold[i] = Math.round(20 + (c.lvl || 0) * 18 + rng() * 12); return TRADE.gold[i]; }
const woodBase = i => { const L = campLand(HUNT.camps[i]); return L === 3 ? 6 : L === 4 ? 25 : 45; };
function campWood(i) { if (TRADE.wood[i] == null) TRADE.wood[i] = woodBase(i); return TRADE.wood[i]; }
const campMounts = c => c ? campHorses(c).filter(h => !h.rider && !h.ridden) : [];
const campCows = c => c && c.cowGroup ? c.cowGroup.members.filter(m => m.alive && !m.gone && !m.young) : [];
const ownCows = () => { const v = ownCamp(); return v && v.cowGroup ? v.cowGroup.members.filter(m => m.alive && !m.gone && !m.young) : []; };
const sellHorses = () => tribeHorses().filter(h => !h.mine && !h.ridden && !h.rider && !h.harness && h.alive);
// what each side has (near: what the hunter carries counts too; a caravan takes only from the store)
function ourHave(k, near) {
  const st = boxStore();
  if (k === 'food') return (near ? foodHave() : 0) + st.cooked + st.meat + st.fish;
  if (k === 'wood') return (near ? P.inv.wood || 0 : 0) + (st.wood || 0);
  if (k === 'spears' || k === 'arrows' || k === 'swords') return st[k] || 0;
  if (k === 'horse') return sellHorses().length;
  if (k === 'cow') return ownCows().length;
  if (GOODS[k] && GOODS[k].ore) return oreOurHave(k, near);
  return 0;
}
function theirHave(i, k) {
  const c = HUNT.camps[i], lv = (c && c.lvl) || 0;
  if (k === 'food') return Math.floor(WAR.food[i] || 0);
  if (k === 'wood') return campWood(i);
  if (k === 'spears') return 3 + lv * 3;
  if (k === 'arrows') return 10 + lv * 10;
  if (k === 'swords') return lv >= 2 ? lv - 1 : 0;
  if (k === 'horse') return campMounts(c).length;
  if (k === 'cow') return Math.max(0, campCows(c).length - 2);
  if (GOODS[k] && GOODS[k].ore) return oreTheirs(i)[k] || 0;
  return 0;
}
// the price of one bundle: what you pay when buying, or what you get when selling
function tradePrice(i, k, dir) {
  const G0 = GOODS[k], tr = campTrust(i), rel = clamp((20 - tr) / 220, -0.1, 0.3), mer = Math.min(3, merchantsN()) * 0.05, L = campLand(HUNT.camps[i]);
  let s = 1;
  if (k === 'food' && (WAR.food[i] || 0) < 30) s = 1.4;
  if (k === 'wood' && L === 3) s = 1.7;
  if (k === 'horse' && L !== 0) s = 0.85;
  if (G0.ore) s = orePriceK(i, k);
  const base = G0.p * G0.u * s;
  return dir === 'buy' ? Math.max(1, Math.round(base * (1.2 + rel - mer))) : Math.max(1, Math.round(base * (0.8 - rel + mer)));
}
// ---------- the goods change hands ----------
function giveOurs(k, n, from, h) {
  const st = boxStore();
  if (k === 'food') st.cooked += n;
  else if (k === 'wood') st.wood += n;
  else if (k === 'spears' || k === 'arrows' || k === 'swords') st[k] = (st[k] || 0) + n;
  else if (k === 'cow') { const v = ownCamp(); if (v && v.cowGroup) for (let j = 0; j < n; j++) addCow(v, v.cowGroup); }
  else if (k === 'horse') for (let j = 0; j < n; j++) { if (h) { h.campHorse = null; horseToTribe(h, true); } else mountBuyNew(from); }
  else if (GOODS[k] && GOODS[k].ore) st[k] = (st[k] || 0) + n;
}
function takeOurs(k, n, near) {
  const st = boxStore();
  if (k === 'food') { const inv = near ? Math.min(foodHave(), n) : 0; if (inv) payFood(inv); if (n - inv > 0) takeFood(n - inv); }
  else if (k === 'wood') { const inv = near ? Math.min(P.inv.wood || 0, n) : 0; P.inv.wood = (P.inv.wood || 0) - inv; st.wood = Math.max(0, (st.wood || 0) - (n - inv)); }
  else if (k === 'spears' || k === 'arrows' || k === 'swords') st[k] = Math.max(0, (st[k] || 0) - n);
  else if (k === 'cow') for (const c of ownCows().slice(0, n)) c.remove();
  else if (k === 'horse') for (const h of sellHorses().slice(0, n)) h.remove();
  else if (GOODS[k] && GOODS[k].ore) oreTake(k, n, near);
}
// a mount bought from afar comes home with the caravan: a new one by the stable
function mountBuyNew(i) {
  const v = ownCamp(); if (!v) return; buildHorseTpls();
  const id = (i != null && HUNT.camps[i] && mountOf(HUNT.camps[i])) || 'horse', st = BLD.list.find(b => b.done && b.t === 'stable'), at = st || v;
  for (let t = 0; t < 12; t++) {
    const ang = rng() * TAU, x = at.x + Math.cos(ang) * rr(5, 8), z = at.z + Math.sin(ang) * rr(5, 8); if (waterDepth(x, z) > 0) continue;
    const h = mountAnimal(id, x, z, { scale: rr(0.97, 1.04) }); h.ground(1, true); horseToTribe(h, false); return;
  }
}
// one bundle, right now, by their camp: '' when it went well, or why not
function tradeExec(i, k, dir) {
  const G0 = GOODS[k], pr = tradePrice(i, k, dir), c = HUNT.camps[i];
  if (!c || c.gone) return 'השבט הזה כבר לא שם';
  if (atWar(i)) return 'אתם במלחמה איתם';
  if (dir === 'buy') {
    if (goldHave() < pr) return `צריך ${pr} זהב`;
    if (theirHave(i, k) < G0.u) return 'אין להם מזה עכשיו';
    let h = null;
    if (k === 'food') WAR.food[i] = Math.max(0, (WAR.food[i] || 0) - G0.u);
    else if (k === 'wood') TRADE.wood[i] = campWood(i) - G0.u;
    else if (k === 'cow') { const cw = campCows(c)[0]; if (cw) cw.remove(); }
    else if (k === 'horse') { h = campMounts(c)[0]; if (!h) return 'אין להם עכשיו'; }
    else if (G0.ore) oreTrade(i, k, -G0.u);
    goldPay(pr); TRADE.gold[i] = campGold(i) + pr; giveOurs(k, G0.u, i, h);
  } else {
    if (ourHave(k, true) < G0.u) return `אין לכם ${bundleW(null, k)}`;
    if (campGold(i) < pr) return 'אין להם מספיק זהב';
    takeOurs(k, G0.u, true);
    if (k === 'food') WAR.food[i] = (WAR.food[i] || 0) + G0.u;
    else if (k === 'wood') TRADE.wood[i] = campWood(i) + G0.u;
    else if (k === 'cow' && c.cowGroup) addCow(c, c.cowGroup);
    else if (k === 'horse') campHorseSpawn(c, 1);
    else if (G0.ore) oreTrade(i, k, G0.u);
    TRADE.gold[i] = campGold(i) - pr; goldAdd(pr);
  }
  tradeDone(i); return '';
}
function tradeDone(i) { TRADE.deals = (TRADE.deals || 0) + 1; if (TRADE.deals % 3 === 0) addTrust(i, 2); PROG.flags.market = 1; }
const tradeNear = i => { const c = HUNT.camps[i]; return !!(c && P.a && Math.hypot(P.a.pos.x - c.x, P.a.pos.z - c.z) < 160); };

// ---------- caravans: a merchant takes the goods there and comes back with what was bought ----------
const freeMerchant = () => clanAdults().find(m => m.merchant && !m.ord && !m.escort && !m.towerB && m.brain === 'tribe' && !(m.job && ['raid', 'caravan', 'ship', 'boat', 'cart'].includes(m.job.k)) && !m.inCart && !m.inShip && m.hp > m.maxHp * 0.4);
function caravanSend(i) {
  const m = freeMerchant(), L = TRADE.basket.filter(q => q.i === i); if (!m || !L.length) return false;
  if (!sameLandOwn(i)) { UI.notify('שיירה לא חוצה את האוקיינוס. כדי לסחור איתם צריך להגיע אליהם', 'bad'); return false; }
  // what is sold leaves with them now, and the gold for what is bought
  const load = [];
  for (const q of L) {
    const G0 = GOODS[q.k];
    if (q.dir === 'sell') { if (ourHave(q.k, false) < G0.u) continue; takeOurs(q.k, G0.u, false); load.push({ k: q.k, dir: 'sell' }); }
    else { const pr = tradePrice(i, q.k, 'buy'); if (goldHave() < pr) continue; goldPay(pr); load.push({ k: q.k, dir: 'buy', paid: pr }); }
  }
  TRADE.basket = TRADE.basket.filter(q => q.i !== i);
  if (!load.length) { UI.notify('לא נשאר מה לשלוח: חסרים זהב או סחורה', 'bad'); return false; }
  ordDropCarry(m);
  m.job = { k: 'caravan', i, load, ph: 'go', t: 0, got: [], gold: 0, ret: [] }; m.hidden = false; m.sleepAt = null; m.escort = false;
  TRADE.cv.push(m);
  UI.notify(`🐪 ${m.name} ${heb(m, 'יצא', 'יצאה')} עם שיירה אל ${campName(i)} (${load.map(q => (q.dir === 'buy' ? 'לקנות ' : 'למכור ') + goodN(i, q.k).n).join(', ')})`, 'good');
  PROG.flags.caravan = 1; saveGame(); return true;
}
function caravanJob(a, dt, v) {
  const j = a.job, c = HUNT.camps[j.i];
  if (!c || c.gone || !v) { caravanBack(a, true); return; }
  a.hidden = false; a.sleepAt = null;
  if (j.ph === 'go') {
    if (j.ox == null) { const ang = Math.atan2(v.x - c.x, v.z - c.z); j.ox = c.x + Math.sin(ang) * 9; j.oz = c.z + Math.cos(ang) * 9; }
    if (atWar(j.i)) { j.ph = 'back'; j.ret = j.load.filter(q => q.dir === 'sell').map(q => q.k); j.gold += j.load.reduce((s, q) => s + (q.paid || 0), 0); return; }
    const d = jobGo(a, j.ox, j.oz, a.sp.walk * 1.5, dt);
    if (d < 2.5 || (d < 40 && (a.dCam || 0) > 120)) { j.ph = 'trade'; j.t = 4; }
    return;
  }
  if (j.ph === 'trade') {
    a.move(0, 0, 0, dt); a.pose = 'talk'; a.yaw += angDiff(a.yaw, Math.atan2(c.x - a.pos.x, c.z - a.pos.z)) * Math.min(1, dt * 3);
    if ((j.t -= dt) > 0) return;
    caravanTrade(a); j.ph = 'back'; a.carry = j.got.length > 0 || j.gold > 0; return;
  }
  if (j.hx == null) { j.hx = rr(-2, 2); j.hz = rr(-2, 2); }
  const d = jobGo(a, v.x + j.hx, v.z + j.hz, a.sp.walk * 1.5, dt);
  if (d < 4) caravanBack(a, false);
}
// at their camp: what was sold is paid for, what was bought is loaded (if they still have it)
function caravanTrade(a) {
  const j = a.job, i = j.i, c = HUNT.camps[i];
  for (const q of j.load) {
    const G0 = GOODS[q.k];
    if (q.dir === 'sell') {
      const pr = tradePrice(i, q.k, 'sell');
      if (atWar(i) || campGold(i) < pr) { j.ret.push(q.k); continue; }
      TRADE.gold[i] = campGold(i) - pr; j.gold += pr;
      if (q.k === 'food') WAR.food[i] = (WAR.food[i] || 0) + G0.u; else if (q.k === 'wood') TRADE.wood[i] = campWood(i) + G0.u; else if (q.k === 'horse') campHorseSpawn(c, 1); else if (q.k === 'cow' && c.cowGroup) addCow(c, c.cowGroup); else if (G0.ore) oreTrade(i, q.k, G0.u);
    } else {
      if (atWar(i) || theirHave(i, q.k) < G0.u) { j.gold += q.paid; continue; }
      if (q.k === 'food') WAR.food[i] = Math.max(0, (WAR.food[i] || 0) - G0.u); else if (q.k === 'wood') TRADE.wood[i] = campWood(i) - G0.u;
      else if (q.k === 'horse') { const h = campMounts(c)[0]; if (h) h.remove(); } else if (q.k === 'cow') { const cw = campCows(c)[0]; if (cw) cw.remove(); } else if (G0.ore) oreTrade(i, q.k, -G0.u);
      TRADE.gold[i] = campGold(i) + q.paid; j.got.push(q.k);
    }
  }
  if (j.got.length || j.gold) tradeDone(i);
  if ((a.dCam || 99) < 60) say(a, j.got.length || j.gold ? 'עסקה טובה. חוזרים הביתה' : 'לא היה עם מי לסחור. חוזרים', 2.5);
}
function caravanBack(a, lost) {
  const j = a.job; a.carry = false;
  const k = TRADE.cv.indexOf(a); if (k >= 0) TRADE.cv.splice(k, 1);
  if (!j || j.k !== 'caravan') return;
  a.job = null;
  if (lost) { for (const q of j.load) { if (q.dir === 'buy' && !j.got.includes(q.k)) goldAdd(q.paid || 0); else if (q.dir === 'sell') giveOurs(q.k, GOODS[q.k].u, j.i); } UI.notify(`🐪 השיירה של ${a.name} חזרה בלי לסחור`, 'bad'); saveGame(); return; }
  goldAdd(j.gold);
  for (const q of j.got) giveOurs(q, GOODS[q].u, j.i);
  for (const q of j.ret || []) giveOurs(q, GOODS[q].u, j.i);
  const what = [j.gold ? `${j.gold} זהב` : '', ...j.got.map(q => bundleW(j.i, q))].filter(Boolean);
  UI.notify(`🐪 ${a.name} ${heb(a, 'חזר', 'חזרה')} מ${campName(j.i)}${what.length ? ` עם ${what.join(', ')}` : ''}`, 'good'); AUD.play('chime', 0.45);
  saveGame();
}
// a caravan called off (the merchant got another role, or went home): what it carried comes back
function caravanAbort(m) { const j = cvJob(m); if (!j) return; m.job = j; m.prevJob = null; caravanBack(m, true); }
// a merchant who falls on the way: the gold and the goods are lost
const cvJob = m => m.job && m.job.k === 'caravan' ? m.job : m.job && m.job.k === 'flee' && m.prevJob && m.prevJob.k === 'caravan' ? m.prevJob : null;
function caravansUpdate() {
  for (const m of TRADE.cv.slice()) {
    if (m.alive && !m.gone && cvJob(m)) continue;
    TRADE.cv.splice(TRADE.cv.indexOf(m), 1);
    if (!m.alive) { UI.notify(`🐪 ${m.name} ${heb(m, 'נהרג', 'נהרגה')} בדרך. השיירה אבדה`, 'bad'); warLog(`השיירה של ${m.name} אבדה בדרך`, 'bad'); }
  }
}

// ---------- the market screens ----------
function tradeList(back) {
  const known = npcIdx().filter(i => VX.known.has(i)), dd = i => Math.hypot(HUNT.camps[i].x - P.a.pos.x, HUNT.camps[i].z - P.a.pos.z);
  const rows = known.sort((a, b) => dd(a) - dd(b)).map(i => { const c = HUNT.camps[i], war = atWar(i); return `<div class="oact"><i style="background:${TRIBEC[tribeKeyOf(c)]}"></i><div><b>${c.tribe} <small>${campKindName(c)} · ${LANDS[campLand(c)].n}</small></b><span>${war ? '⚔️ במלחמה: אין מסחר' : `${relWord(i, Math.round(campTrust(i)))} · 🪙 ${campGold(i)} · ${whereIs({ pos: { x: c.x, z: c.z } })}`}</span></div><button class="btn${war ? '' : ' pri'}" data-t="${i}"${war ? ' disabled' : ''}>לסחור</button></div>`; }).join('');
  const nm = merchantsN();
  const body = `<div class="vxhero"><b>מסחר</b><span>🪙 ${goldHave()} זהב במחסן · ${nm ? `${nm === 1 ? 'סוחר אחד' : `${nm} סוחרים`} בשבט` : 'אין עדיין סוחרים בשבט'}</span></div>` +
    `<p class="idim">כל שבט קונה ומוכר אוכל, עצים, נשק, סוסים ובקר. ליד המחנה שלהם סוחרים מיד. מרחוק סוחר מהשבט שלך לוקח את הסחורה בשיירה${nm ? '' : ' (במסך האנשים אפשר להפוך מישהו לסוחר)'}. ידידים מוכרים בזול, שבט רעב משלם יותר על אוכל, וכל סוחר בשבט משפר את המחירים.</p>` +
    (rows || '<p class="idim">עוד לא פגשתם שבטים.</p>');
  const el = uiCard('campov', `<div class="itabs"><button data-a="back">‹ חזרה</button><b style="flex:1;font-size:16px;padding:0 6px">מסחר</b><button class="ix" data-a="close" aria-label="סגירה">✕</button></div><div class="ibody">${body}</div>`);
  el.querySelector('.card').classList.add('vxcard');
  el.onclick = e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    if (b.dataset.t) { tradeCard(+b.dataset.t, () => tradeList(back)); return; }
    if (b.dataset.a === 'close') { closeCard('campov'); return; }
    if (back) back(); else if (ownCamp()) campMenu('store'); else closeCard('campov');
  };
}
function tradeCard(i, back) {
  const c = HUNT.camps[i]; if (!c || c.gone) return;
  if (!VX.known.has(i)) VX.known.add(i);
  const near = tradeNear(i), mer = freeMerchant(), bas = TRADE.basket.filter(q => q.i === i), cv = TRADE.cv.find(m => cvJob(m) && cvJob(m).i === i);
  const over = !near && !sameLandOwn(i), war = atWar(i) || over;
  const chip = (ic, n) => `<span class="cchip">${ic} ${n}</span>`;
  const mine = `<div class="cstock">${chip('🪙', goldHave())}${Object.keys(GOODS).filter(k => !GOODS[k].ore || ourHave(k, near) > 0).map(k => chip(goodN(k === 'horse' ? null : i, k).ic, ourHave(k, near))).join('')}</div>`;
  const rows = Object.keys(GOODS).filter(k => !GOODS[k].ore || theirHave(i, k) > 0 || ourHave(k, near) > 0).map(k => {
    const G0 = goodN(i, k), th = theirHave(i, k), pb = tradePrice(i, k, 'buy'), ps = tradePrice(i, k, 'sell'), inB = bas.filter(q => q.k === k);
    const canB = !war && th >= G0.u && goldHave() >= pb + (near ? 0 : bas.filter(q => q.dir === 'buy').reduce((s, q) => s + tradePrice(i, q.k, 'buy'), 0)), canS = !war && ourHave(k, near) >= G0.u * (1 + (near ? 0 : inB.filter(q => q.dir === 'sell').length)) && campGold(i) >= ps;
    return `<div class="trow"><div class="tg"><b>${G0.ic} ${G0.n}</b><small>${bundleW(i, k)} · אצלם ${th}</small></div>` +
      `<button class="btn" data-b="${k}"${canB ? '' : ' disabled'}>לקנות<br><small>🪙 ${pb}</small></button><button class="btn" data-s="${k}"${canS ? '' : ' disabled'}>למכור<br><small>🪙 ${ps}</small></button>${inB.length ? `<span class="tin">🐪 בשיירה: ${inB.map(q => q.dir === 'buy' ? 'לקנות' : 'למכור').join(', ')}</span>` : ''}</div>`;
  }).join('');
  const how = over ? '<p class="vxalert">הם גרים מעבר לאוקיינוס, ושיירה לא מגיעה לשם. סוחרים איתם כשמגיעים אליהם, בספינה של שבטי החוף</p>' : war ? '<p class="vxalert">אתם במלחמה איתם: אין מסחר עד שיהיה שלום</p>'
    : near ? '<p class="idim">אתם ליד המחנה שלהם: קונים ומוכרים מיד.</p>'
      : mer ? `<p class="idim">המחנה שלהם רחוק. מה שבוחרים נכנס לשיירה, ו${mer.name} ${heb(mer, 'ייקח', 'תיקח')} אותה לשם ${heb(mer, 'ויחזור', 'ותחזור')} עם מה שנקנה. מה שמוכרים יוצא מהמחסן.</p>`
        : '<p class="idim">המחנה שלהם רחוק, ואין עכשיו סוחר פנוי בשבט. אפשר ללכת לשם בעצמך, או להפוך מישהו לסוחר במסך האנשים.</p>';
  const sent = cv ? `<p class="wok">🐪 ${cv.name} ${cvJob(cv).ph === 'back' ? 'בדרך חזרה' : 'בדרך אליהם'} עם שיירה · ${whereIs(cv)}</p>` : '';
  const basket = !near && bas.length ? `<h3>🐪 השיירה אל ${c.tribe}</h3><p class="idim">${bas.map(q => `${q.dir === 'buy' ? 'לקנות' : 'למכור'} ${bundleW(i, q.k)}`).join(' · ')}</p><div class="btns"><button class="btn pri" data-a="send"${mer ? '' : ' disabled'}>🐪 לשלוח את השיירה${mer ? ` עם ${mer.name}` : ''}</button><button class="btn" data-a="clear">לרוקן</button></div>` : '';
  const body = `<div class="vxhero"><b>מסחר עם ${c.tribe}</b><span>${campKindName(c)} · ${relWord(i, Math.round(campTrust(i)))} · 🪙 יש להם ${campGold(i)}</span></div>${how}${sent}<h3>מה יש לכם</h3>${mine}<h3>קונים ומוכרים</h3><div class="ttab">${rows}</div>${basket}`;
  const el = uiCard('campov', `<div class="itabs"><button data-a="back">‹ חזרה</button><b style="flex:1;font-size:16px;padding:0 6px">מסחר עם ${c.tribe}</b><button class="ix" data-a="close" aria-label="סגירה">✕</button></div><div class="ibody">${body}</div>`);
  el.querySelector('.card').classList.add('vxcard');
  el.onclick = e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    const k = b.dataset.b || b.dataset.s, dir = b.dataset.b ? 'buy' : 'sell';
    if (k) {
      if (near) { const why = tradeExec(i, k, dir); if (why) UI.notify(why, 'bad'); else { AUD.play('chime', 0.35); UI.notify(`${dir === 'buy' ? 'קניתם' : 'מכרתם'} ${bundleW(i, k)} ${dir === 'buy' ? 'מ' : 'ל'}${c.tribe}`, 'good'); saveGame(); } }
      else if (TRADE.basket.length >= 12) UI.notify('השיירה מלאה', 'bad'); else TRADE.basket.push({ i, k, dir });
      tradeCard(i, back); return;
    }
    const A = b.dataset.a;
    if (A === 'send') { caravanSend(i); tradeCard(i, back); return; }
    if (A === 'clear') { TRADE.basket = TRADE.basket.filter(q => q.i !== i); tradeCard(i, back); return; }
    if (A === 'close') { closeCard('campov'); return; }
    if (back) back(); else if (ownCamp()) campMenu('store'); else closeCard('campov');
  };
}
// ---------- the clock, save and load ----------
function tradeUpdate(dt) {
  if ((TRADE.t -= dt) > 0) return; TRADE.t = 1;
  caravansUpdate();
  if (TRADE.day !== G.day && G.time > 7) {
    const first = TRADE.day < 0; TRADE.day = G.day; if (first) return;
    for (const i of npcIdx()) { const lv = HUNT.camps[i].lvl || 0; TRADE.gold[i] = Math.min(80 + lv * 40, campGold(i) + 2 + lv * 2); TRADE.wood[i] = Math.min(woodBase(i), campWood(i) + 8); }
    oreDaily();
  }
}
function tradeSave() {
  const v = ownCamp();
  return { g: TRADE.gold, w: TRADE.wood, b: TRADE.basket, d: TRADE.deals || 0, oc: v && v.cowGroup ? v.cowGroup.members.filter(m => m.alive && !m.gone).length : 0,
    cv: TRADE.cv.filter(m => m.alive && cvJob(m)).map(m => { const j = cvJob(m); return { u: m.uid, i: j.i, l: j.load, ph: j.ph, got: j.got, gold: j.gold, ret: j.ret || [] }; }) };
}
function tradeReset() { TRADE.gold = {}; TRADE.wood = {}; TRADE.basket = []; TRADE.cv = []; TRADE.day = -1; TRADE.deals = 0; }
function tradeLoad(d) {
  tradeReset(); if (!d) return;
  TRADE.gold = d.g || {}; TRADE.wood = d.w || {}; TRADE.basket = Array.isArray(d.b) ? d.b.filter(q => GOODS[q.k]) : []; TRADE.deals = d.d || 0;
  // the herd of the village as it was (bought and raided cattle included)
  const v = ownCamp(); if (v && v.cowGroup && d.oc) for (let n = v.cowGroup.members.filter(m => m.alive && !m.gone).length; n < Math.min(12, d.oc); n++) addCow(v, v.cowGroup);
  for (const q of d.cv || []) {
    const m = TRIBE.adults.find(b => b.uid === q.u && b.alive);
    if (!m) { for (const x of q.l || []) if (x.dir === 'buy' && !(q.got || []).includes(x.k)) goldAdd(x.paid || 0); continue; }
    m.job = { k: 'caravan', i: q.i, load: q.l || [], ph: q.ph === 'trade' ? 'go' : q.ph || 'go', t: 0, got: q.got || [], gold: q.gold || 0, ret: q.ret || [] }; TRADE.cv.push(m);
  }
}
(function () {
  const st = document.createElement('style');
  st.textContent = `.ttab{display:flex;flex-direction:column;gap:5px;margin:4px 0 8px}
.trow{display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:6px 8px;border:1px solid var(--line);border-radius:12px;background:rgba(127,127,127,.06)}
.trow .tg{flex:1;min-width:110px;display:flex;flex-direction:column;gap:1px}.trow .tg b{font-size:14px}.trow .tg small{font-size:11.5px;color:var(--dim)}
.trow .btn{padding:5px 10px;font-size:12.5px;line-height:1.15;min-width:66px}.trow .btn small{font-size:11px;opacity:.85}
.trow .tin{width:100%;font-size:11.5px;color:var(--gold)}.trow .btn:disabled{opacity:.36;filter:grayscale(1)}`;
  document.head.appendChild(st);
})();
// ================= RAIDS THAT TAKE: food, property and animals =================
// Before a raid the chief says what to take: food from their store, property (their gold and their weapons), or their
// animals (horses and cattle). After the victory each warrior does one thing: kneels at their store and fills a bag, or
// mounts one of their horses and rides it home. The cattle are driven home behind the warriors.
const LOOTK = {
  food: { ic: '🍖', n: 'אוכל', d: 'מהמחסן שלהם' },
  goods: { ic: '💰', n: 'רכוש', d: 'זהב וכלי נשק' },
  beasts: { ic: '🐎', n: 'בעלי חיים', d: 'סוסים ובקר' }
};
const PLUNDER = { want: { food: true, goods: true, beasts: false }, day: -1, t: 0 };
const LVLD = ['המחנה', 'הכפר', 'הכפר הגדול', 'העיירה'];   // "the camp", "the village"... of a tribe, by its size
// ---------- the raid screen: what to take ----------
function lootChipsHtml() {
  return `<div class="lootw"><span>מה לוקחים אחרי הניצחון:</span><div>${Object.keys(LOOTK).map(k => `<button class="${PLUNDER.want[k] ? 'on' : ''}" data-lw="${k}"><b>${PLUNDER.want[k] ? '✓' : '○'} ${LOOTK[k].ic} ${LOOTK[k].n}</b><small>${LOOTK[k].d}</small></button>`).join('')}</div></div>`;
}
function lootToggle(k) { if (!LOOTK[k]) return; PLUNDER.want[k] = !PLUNDER.want[k]; if (!Object.keys(LOOTK).some(q => PLUNDER.want[q])) PLUNDER.want.food = true; }
// a raid planned before animals were a choice of their own: property meant horses and cattle too
const lootWant = p => { const w = p.want || { food: true }; return w.beasts == null ? Object.assign({}, w, { beasts: !!w.goods }) : w; };
// ---------- after the victory: one thing for each warrior ----------
function lootPlan(p) {
  const c = HUNT.camps[p.to], W = lootWant(p); p.q = []; p.nG = 0; p.nF = 0;
  Object.assign(p.got, { gold: p.got.gold || 0, horses: p.got.horses || 0, cows: p.got.cows || 0, spears: p.got.spears || 0, arrows: p.got.arrows || 0 });
  if (!c) return;
  if (W.beasts) for (const h of campHorses(c).filter(h => !h.rider && !h.ridden).slice(0, 3)) p.q.push({ k: 'horse', h });
  for (const m of p.men) m.lt = null;
}
function lootNext(p, a) {
  const W = lootWant(p);
  while (!a.mount && p.q && p.q.length) {
    const t = p.q.shift();
    if (!t.h.alive || t.h.gone || t.h.rider || !t.h.campHorse) continue;
    return { k: t.k, h: t.h, t: 0 };
  }
  if (W.goods && (!W.food || p.nG <= p.nF)) { p.nG++; return { k: 'gold', t: 0 }; }
  if (W.food) { p.nF++; return { k: 'food', t: 0 }; }
  return { k: 'done', t: 0 };
}
// a bag of their property: gold, and now and then a spear or a bundle of arrows
function lootGoods(p, a, n) {
  TRADE.gold[p.to] = campGold(p.to) - n; a.gold = (a.gold || 0) + n; p.got.gold += n;
  const lv = (HUNT.camps[p.to] && HUNT.camps[p.to].lvl) || 0;
  if (rng() < 0.45 + lv * 0.1) { a.spl = (a.spl || 0) + 1; p.got.spears++; }
  if (rng() < 0.4 + lv * 0.1) { a.arl = (a.arl || 0) + 5; p.got.arrows += 5; }
}
function lootJob(a, dt, p, c) {
  if (!a.lt) a.lt = lootNext(p, a);
  const j = a.lt;
  if (j.k === 'done') {
    // done: keep watch at the edge of their camp until everyone is ready
    const d = jobGo(a, c.x + Math.sin(a.id * 2) * 8, c.z + Math.cos(a.id * 2) * 8, a.sp.walk * 1.2, dt);
    if (d < 1.5) { a.move(0, 0, 0, dt); a.pose = 'idle'; a.look = Math.sin(G.t * 0.7 + a.id) * 0.8; }
    return;
  }
  if (j.k === 'horse') {
    const h = j.h; if (!h.alive || h.gone || h.rider || a.mount) { a.lt = lootNext(p, a); return; }
    const d = jobGo(a, h.pos.x, h.pos.z, a.sp.run * 0.8, dt);
    if (d < 2.2) {
      h.campHorse = null; horseToTribe(h, false); h.pos.set(a.pos.x + 0.6, 0, a.pos.z); h.ground(1, true);
      if (mountUp(a, h)) { p.got.horses++; if (a.dCam < 40) say(a, pick(['סוס טוב! הוא שלנו', 'רוכבים הביתה', 'איזה סוס!']), 2.2); }
      a.lt = { k: 'done', t: 0 };
    }
    return;
  }
  // gold or food: kneel at their store and fill a bag
  const d = jobGo(a, c.x + Math.sin(a.id) * 1.7, c.z + Math.cos(a.id) * 1.7, a.sp.walk * 1.4, dt);
  if (d < 2.4) {
    a.move(0, 0, 0, dt); a.pose = 'kneel'; j.t += dt;
    if (j.t > 2.5) {
      if (j.k === 'gold') lootGoods(p, a, Math.min(campGold(p.to), Math.round(rr(5, 11))));
      else { const n = Math.min(WAR.food[p.to] | 0, Math.round(rr(3, 6))); WAR.food[p.to] -= n; a.loot = (a.loot || 0) + n; p.got.food += n; }
      a.carry = !!(a.loot || a.gold || a.spl); a.lt = { k: 'done', t: 0 };
    }
  }
}
const lootReady = p => p.men.every(m => m.rret || (m.lt && m.lt.k === 'done'));
// the loot phase is over: what was not carried by hand is shared out, the cattle are driven home
function lootFinish(p) {
  const c = HUNT.camps[p.to], W = lootWant(p), men = p.men.filter(m => m.alive);
  for (const m of men) if (!m.lt || m.lt.k !== 'done') m.lt = { k: 'done', t: 0 };
  const share = (key, n) => { const per = men.length ? Math.ceil(n / men.length) : 0; let left = n; for (const m of men) { const t = Math.min(per, left); left -= t; m[key] = (m[key] || 0) + t; if (t) m.carry = true; } };
  if (W.food && !p.got.food) { const n = Math.min(WAR.food[p.to] | 0, 4 + men.length * 2); WAR.food[p.to] -= n; p.got.food += n; share('loot', n); }
  if (W.goods && !p.got.gold && men.length) { const n = Math.min(campGold(p.to), 6 + men.length * 3); lootGoods(p, men[0], 0); TRADE.gold[p.to] = campGold(p.to) - n; p.got.gold += n; share('gold', n); }
  if (W.beasts && c) lootCows(p, c, 2);
}
function lootCows(p, c, n) {
  const v = ownCamp(); if (!v || !v.cowGroup || !c.cowGroup) return;
  for (const m of c.cowGroup.members.filter(q => q.alive && !q.gone && !q.young).slice(0, n)) { cowMove(m, v); p.got.cows++; }
}
// out of sight: the same, decided at once
function lootAbstract(p, A) {
  const c = HUNT.camps[p.to], W = lootWant(p); lootPlan(p);
  const men = p.men.filter(m => m.alive); if (!c || !men.length) return;
  const share = (key, n) => { const per = Math.ceil(n / men.length); let left = n; for (const m of men) { const t = Math.min(per, left); left -= t; m[key] = (m[key] || 0) + t; } };
  if (W.food) { const n = Math.min(WAR.food[p.to] | 0, Math.round(6 + A * 2)); WAR.food[p.to] -= n; p.got.food += n; share('loot', n); }
  if (W.goods) {
    const n = Math.min(campGold(p.to), Math.round(8 + A * 3)); TRADE.gold[p.to] = campGold(p.to) - n; p.got.gold += n; share('gold', n);
    for (const m of men.slice(0, 3)) lootGoods(p, m, 0);
  }
  if (W.beasts) {
    const free = men.filter(m => !m.mount);
    for (const h of campHorses(c).filter(h => !h.rider).slice(0, Math.min(3, free.length))) { const m = free.shift(); h.campHorse = null; horseToTribe(h, false); if (mountUp(m, h)) p.got.horses++; }
    lootCows(p, c, 2);
  }
  for (const m of men) m.lt = { k: 'done', t: 0 };
}
// at the village: everything goes in
function lootHome(a) {
  const st = boxStore();
  if (a.loot) st.cooked += a.loot;
  if (a.gold) goldAdd(a.gold);
  if (a.spl) st.spears = (st.spears || 0) + a.spl;
  if (a.arl) st.arrows = (st.arrows || 0) + a.arl;
  a.loot = null; a.gold = 0; a.spl = 0; a.arl = 0; a.carry = false; a.lt = null;
}
function lootWords(p) {
  const g = p.got, L = [];
  if (g.food) L.push(`${g.food} מנות אוכל`);
  if (g.gold) L.push(`${g.gold} זהב`);
  if (g.spears) L.push(g.spears > 1 ? `${g.spears} חניתות` : 'חנית');
  if (g.arrows) L.push(`${g.arrows} חצים`);
  if (g.horses) L.push(g.horses > 1 ? `${g.horses} סוסים` : 'סוס');
  if (g.cows) L.push(g.cows > 1 ? `${g.cows} פרות` : 'פרה');
  return L;
}
const lootPlanWord = p => { const W = lootWant(p), L = []; if (W.food) L.push('אוכל'); if (W.goods) L.push('זהב וכלי נשק'); if (W.beasts) L.push('סוסים ובקר'); return L.join(', '); };
// someone who once came from another tribe and is going back to it
BRAIN.gohome = function (a, dt) {
  const c = HUNT.camps[a.goHome];
  if (!c || c.gone || c.own) { a.brain = 'leaver'; a.leaveTo = null; return; }
  const dx = c.x - a.pos.x, dz = c.z - a.pos.z, d = Math.hypot(dx, dz);
  if (d > 80 && (a.dCam || 0) > 120) { const ang = Math.atan2(-dx, -dz); a.pos.set(c.x + Math.sin(ang) * 40, 0, c.z + Math.cos(ang) * 40); if (waterDepth(a.pos.x, a.pos.z) > 0) a.pos.set(c.x + rr(-4, 4), 0, c.z + rr(-4, 4)); a.ground(1, true); return; }
  if (d < 6) {
    const young = !!a.young; a.cls = young ? 'child' : 'gatherer';
    Object.assign(a, { brain: 'villager', hunter: true, camp: c, tribe: false, goHome: null, state: 'idle', stT: 2, knight: false, merchant: false });
    if (!c.hunters.includes(a)) c.hunters.push(a); a.home.set(c.x, 0, c.z);
    retemplate(a, ensureTribal(a.cls, tribeKeyOf(c), a.sex));
    if ((a.dCam || 99) < 40) say(a, 'חזרתי הביתה!', 2.4);
    return;
  }
  a.move(dx / d, dz / d, (a.sp.walk || 1.5) * 1.4, dt); a.pose = a.swimming ? 'swim' : 'move';
};
// from an older game: people who were brought from another tribe go back to their own people
function sendHomeOld() {
  let n = 0;
  for (const m of clanReal().slice()) {
    const i = m.oldHome; m.oldHome = null; if (i == null) continue;
    const c = HUNT.camps[i]; if (!c || c.gone || c.own) continue;
    if (m.ord) ordLeave(m); if (m.towerB) towerLeave(m); if (m.mount) mountOff(m);
    if (m.spouse && m.spouse.spouse === m) m.spouse.spouse = null; m.spouse = null; m.preg = 0;
    const k = TRIBE.adults.indexOf(m); if (k >= 0) TRIBE.adults.splice(k, 1);
    Object.assign(m, { tribe: false, escort: false, job: null, state: 'idle', foe: null, hidden: false, sleepAt: null, brain: 'gohome', goHome: i, clsLock: false });
    addTrust(i, 10); n++;
  }
  if (n) UI.notify(`🕊️ ${n > 1 ? `${n} אנשים שהובאו משבטים אחרים חוזרים` : 'מי שהובא משבט אחר חוזר'} לשבט שלהם. הם לא ישכחו את זה`, 'good');
}
function plunderUpdate(dt) {
  if ((PLUNDER.t -= dt) > 0) return; PLUNDER.t = 2;
  if (PLUNDER.day !== G.day && G.time > 9) PLUNDER.day = G.day;
}
function plunderSave() { return { w: PLUNDER.want }; }
function plunderReset() { PLUNDER.want = { food: true, goods: true, beasts: false }; PLUNDER.day = -1; }
function plunderLoad(d) {
  plunderReset();
  if (d && d.w) { const w = d.w; PLUNDER.want = { food: !!w.food, goods: !!w.goods, beasts: w.beasts != null ? !!w.beasts : !!w.goods }; if (!Object.values(PLUNDER.want).some(Boolean)) PLUNDER.want.food = true; }
  setTimeout(sendHomeOld, 1500);
}
(function () {
  const st = document.createElement('style');
  st.textContent = `.lootw{margin:6px 0 8px}.lootw>span{display:block;font-size:12.5px;color:var(--dim);margin-bottom:4px}
.lootw>div{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.lootw button{display:flex;flex-direction:column;align-items:center;gap:1px;padding:7px 4px;border:1px solid var(--line);border-radius:12px;background:rgba(127,127,127,.06);color:var(--ink);cursor:pointer;font:600 13px Rubik,sans-serif}
.lootw button small{font-size:10.5px;color:var(--dim);font-weight:500;text-align:center;line-height:1.2}
.lootw button.on{background:rgba(232,176,75,.28);border-color:var(--gold)}`;
  document.head.appendChild(st);
})();
