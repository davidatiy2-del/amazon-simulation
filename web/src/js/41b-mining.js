// ================= MINING: gold, iron, copper, salt, gems and stone from the ground =================
// Here and there, on hillsides and among the rocks, a vein shows: yellow gold, rust-red iron, green copper, white salt,
// crystals of gems, or good building stone. Hold the button by the rocks and the pick does the rest: gold goes straight
// into your purse; the rest goes into your bag (up to a load), and into the store when you are home. The village can be
// sent to mine too (an order like hunting or bringing wood). Ore sells at every market, and more where it is rare; iron
// makes stronger spearheads, arrowheads and swords. A vein dug out fills again after a few days, deeper down.
const ORE = {
  stone: { n: 'אבן', pl: 'אבנים', ic: '🪨', col: '#9a958c', vein: '#d8d2c6', hard: 1.1, per: 3, amt: [40, 70], dot: '#c8c2b8' },
  copper: { n: 'נחושת', pl: 'נחושת', ic: '🟤', col: '#7a6656', vein: '#2fb894', hard: 1.8, per: 2, amt: [18, 32], dot: '#3fc49e' },
  iron: { n: 'ברזל', pl: 'ברזל', ic: '⚙️', col: '#6a4a3c', vein: '#c0562c', hard: 2.2, per: 2, amt: [20, 36], dot: '#d0663c' },
  salt: { n: 'מלח', pl: 'מלח', ic: '🧂', col: '#cfc8ba', vein: '#f8f6f0', hard: 1.2, per: 3, amt: [25, 45], dot: '#f4f2ea', crystal: true },
  gold: { n: 'זהב', pl: 'זהב', ic: '🪙', col: '#b0a490', vein: '#ffc81e', hard: 2.8, per: 2, amt: [12, 24], dot: '#ffd34d' },
  gems: { n: 'אבני חן', pl: 'אבני חן', ic: '💎', col: '#4e4856', vein: '#e83c9a', hard: 3.4, per: 1, amt: [5, 10], dot: '#ff5ab4', crystal: true }
};
const ORE_K = ['stone', 'copper', 'iron', 'salt', 'gems'];   // what is carried and sold (gold is money at once)
const ORE_CARRY = 40;
// which ores each land has: the jungle's gold and emeralds, the north's iron, the desert's salt, Africa's gold, India's gems...
const ORE_LAND = {
  0: { gold: 3, stone: 3, gems: 1.5, copper: 1, iron: 1, salt: 0.5 }, 1: { iron: 3.5, stone: 3, copper: 1.5, gold: 1, gems: 0.5 },
  2: { gold: 2, stone: 3, iron: 2, copper: 1.5, gems: 1.5 }, 3: { salt: 3.5, copper: 2, gold: 1.5, stone: 2, gems: 1 }, 4: { salt: 3, stone: 3, copper: 1.5, gold: 1.5, iron: 1 },
  5: { stone: 3, iron: 3, copper: 1.5, salt: 1, gold: 1, gems: 0.5 }, 6: { iron: 4, stone: 3.5, copper: 1.5, gold: 0.5, gems: 0.5 },
  7: { copper: 2.5, stone: 2.5, gold: 2, salt: 2, iron: 1 }, 8: { copper: 2, iron: 2.5, stone: 2, gems: 1.5, salt: 1, gold: 1 },
  9: { iron: 3, copper: 2, gold: 2, stone: 2.5, gems: 0.5 }, 10: { gold: 2.5, salt: 2.5, copper: 2, stone: 2, gems: 1 },
  11: { gold: 4, salt: 2, iron: 2, stone: 1.5, gems: 0.5 }, 12: { gems: 3, iron: 2.5, gold: 1.5, stone: 2, copper: 1 }
};
const MINES = { list: [], made: false, cur: null, t: 0, snd: 0, chk: 0, day: -1, seen: new Set(), kinds: new Set(), dug: 0 };
function mineKindAt(L, R) {
  const W = ORE_LAND[L] || ORE_LAND[0]; let s = R() * Object.values(W).reduce((a, b) => a + b, 0);
  for (const k in W) { s -= W[k]; if (s <= 0) return k; }
  return 'stone';
}
// the veins of the whole world: always in the same places (a seed of their own), on rocky, hilly ground
function mineGen() {
  if (MINES.made) return; MINES.made = true;
  const R = mulberry32(80417), list = MINES.list;
  const area = (x0, x1, z0, z1, n, old) => {
    let made = 0;
    for (let t = 0; t < n * 60 && made < n; t++) {
      const x = x0 + R() * (x1 - x0), z = z0 + R() * (z1 - z0);
      if (!inBounds(x, z) || (old ? !inOld(x, z) : !inMain(x, z))) continue;
      const h = getH(x, z); if (h < 1.4 || waterDepth(x, z) > 0) continue;
      const ny = getNY(x, z); if (ny < 0.62) continue;
      const hill = (1 - ny) * 7 + clamp((h - 8) / 40, 0, 0.6);
      if (R() > 0.18 + hill) continue;
      if (old && typeof roadFine === 'function' && roadFine(x, z)) continue;
      if (list.some(d => Math.abs(d.x - x) < 70 && Math.abs(d.z - z) < 70)) continue;
      const L = landAt(x, z); if (L === 13) continue;
      const k = mineKindAt(L, R), O = ORE[k], amt = Math.round(O.amt[0] + R() * (O.amt[1] - O.amt[0]));
      list.push({ id: list.length, k, x, z, y: h, r: 1.7, max: amt, left: amt, seed: Math.floor(R() * 2e9) + 1, mesh: null, regrow: 0, solid: false });
      made++;
    }
  };
  area(-LIMIT + 60, LIMIT - 60, -LIMIT + 60, LIMIT - 60, 85, false);
  area(OW.x0 + 30, OW.x1 - 30, OW.z0 + 30, OW.z1 - 30, 140, true);
}
// ---------- how a vein looks: a heap of broken rocks with lumps (or crystals) of ore in them ----------
function mineMesh(d) {
  const O = ORE[d.k], R = mulberry32(d.seed), B = new SB({ x: d.x, y: d.y, z: d.z });
  const rock = col(O.col), rock2 = mixC(rock, col('#1a1814'), 0.22), vein = col(O.vein), rocks = [];
  const n = 4 + Math.floor(R() * 3);
  for (let i = 0; i < n; i++) {
    const a = R() * TAU, r = i === 0 ? 0 : 0.8 + R() * 1.0, s = i === 0 ? 1.05 + R() * 0.25 : 0.42 + R() * 0.42;
    const lx = Math.sin(a) * r, lz = Math.cos(a) * r, gy = getH(d.x + lx, d.z + lz) - d.y, sy = 0.62 + R() * 0.32;
    B.add(new THREE.DodecahedronGeometry(s, 0), M([lx, gy + s * sy * 0.55, lz], [R() * 3, R() * 3, R() * 3], [1, sy, 0.85 + R() * 0.3]), i % 2 ? rock2 : rock, 0.06);
    rocks.push([lx, gy + s * sy * 0.55, lz, s, sy]);
  }
  // rubble at the foot of the heap
  for (let i = 0; i < 6; i++) { const a = R() * TAU, r = 1.4 + R() * 1.0, lx = Math.sin(a) * r, lz = Math.cos(a) * r; B.add(new THREE.DodecahedronGeometry(0.12 + R() * 0.12, 0), M([lx, getH(d.x + lx, d.z + lz) - d.y + 0.05, lz], [R() * 3, R() * 3, 0]), rock2, 0.05); }
  if (d.left > 0) {
    const nv = O.crystal ? 12 : 15;
    for (let i = 0; i < nv; i++) {
      const rk = rocks[i % Math.min(rocks.length, 3)], th = R() * TAU, ph = 0.15 + R() * 0.95, rr2 = rk[3] * 0.97;
      const px = rk[0] + Math.cos(ph) * Math.sin(th) * rr2, py = rk[1] + Math.sin(ph) * rr2 * rk[4], pz = rk[2] + Math.cos(ph) * Math.cos(th) * rr2 * 0.95;
      const vc = mixC(vein, col('#ffffff'), R() * 0.22);
      if (O.crystal) B.add(new THREE.OctahedronGeometry(0.12 + R() * 0.1, 0), M([px, py + 0.08, pz], [R() * 0.7 - 0.35, R() * 3, R() * 0.7 - 0.35], [0.6, 2.0, 0.6]), vc);
      else B.add(new THREE.IcosahedronGeometry(0.13 + R() * 0.12, 0), M([px, py, pz], [R() * 3, R() * 3, 0], [1.5, 0.6, 1.3]), vc);
    }
    // a few bright pieces broken off at the foot of the heap
    for (let i = 0; i < 4; i++) { const a = R() * TAU, r = 1.3 + R() * 0.9, lx = Math.sin(a) * r, lz = Math.cos(a) * r; B.add(new THREE.IcosahedronGeometry(0.08 + R() * 0.06, 0), M([lx, getH(d.x + lx, d.z + lz) - d.y + 0.05, lz], [R() * 3, R() * 3, 0]), vein); }
  }
  const m = B.mesh(); m.position.set(d.x, d.y, d.z); m.castShadow = true; m.receiveShadow = true;
  if (!d.solid) { d.solid = true; for (const rk of rocks) if (rk[3] > 0.6) { const wx = d.x + rk[0], wz = d.z + rk[2], k = g10(wx, wz); (TRUNKS.g[k] || (TRUNKS.g[k] = [])).push(wx, wz, rk[3] * 0.8); } }
  return m;
}
function mineRebuild(d) { if (d.mesh) { scene.remove(d.mesh); d.mesh.geometry.dispose(); d.mesh = null; } }
// ---------- near and far: the heaps are drawn only near the camera ----------
function minesUpdate(dt) {
  if (!P.human || G.mode !== 'play' || !P.a) return;
  if ((MINES.chk -= dt) > 0) return; MINES.chk = 0.5;
  mineGen();
  const cx = camera.position.x, cz = camera.position.z, a = P.a;
  // a vein under someone else's houses is not to be dug (checked again when the camps change)
  const nc = HUNT.camps.filter(c => !c.gone).length;
  if (MINES.nc !== nc) { MINES.nc = nc; const v = ownCamp(); for (const d of MINES.list) { const off = HUNT.camps.some(c => !c.gone && c !== v && Math.abs(c.x - d.x) < 55 && Math.abs(c.z - d.z) < 55); if (off && d.mesh) mineRebuild(d); d.off = off; } }
  for (const d of MINES.list) {
    if (d.off) continue;
    const dc = Math.abs(d.x - cx) + Math.abs(d.z - cz);
    if (dc < 330) { if (!d.mesh) { d.mesh = mineMesh(d); scene.add(d.mesh); } }
    else if (dc > 460 && d.mesh) mineRebuild(d);
    if (!d.seen && Math.abs(d.x - a.pos.x) < 40 && Math.abs(d.z - a.pos.z) < 40) mineFound(d);
  }
  if (MINES.day !== G.day && G.time > 6) {
    MINES.day = G.day;
    for (const d of MINES.list) if (d.left <= 0 && d.regrow && G.day >= d.regrow) { d.left = Math.round(d.max * rr(0.6, 0.9)); d.regrow = 0; mineRebuild(d); }
  }
}
function mineFound(d) {
  d.seen = true; MINES.seen.add(d.id);
  const O = ORE[d.k];
  if (!MINES.kinds.has(d.k)) {
    MINES.kinds.add(d.k);
    UI.notify(`⛏️ מצאת מרבץ של ${O.n}! ${TOUCH ? 'עומדים ליד הסלעים ומחזיקים את הכפתור' : 'עומדים ליד הסלעים ומחזיקים E'} כדי לכרות`, 'good');
    if (MINES.kinds.size === 1) setTimeout(() => UI.notify(`${O.ic} ${d.k === 'gold' ? 'זהב נכנס ישר לארנק.' : 'מה שכורים נכנס לתיק, ובכפר למחסן.'} מוכרים מחצבים בכל שוק, ומברזל עושים נשק חזק יותר בארסנל`, ''), 3500);
  }
  P.pings.push({ x: d.x, z: d.z, t: 4 });
}
// the heap the hunter stands by
function mineAt(x, z, r) {
  let best = null, bd = 1e9;
  for (const d of MINES.list) { if (d.off) continue; const q = Math.hypot(d.x - x, d.z - z) - d.r; if (q < r && q < bd) { bd = q; best = d; } }
  return best;
}
function mineNearest(x, z, R, full) {
  let best = null, bd = R;
  for (const d of MINES.list) { if (d.off || (full && d.left <= 0)) continue; const q = Math.hypot(d.x - x, d.z - z); if (q < bd) { bd = q; best = d; } }
  return best;
}
// ---------- the hunter digs ----------
CTXT.mine = ['pick', 'לכרות', 'להחזיק כדי לכרות'];
function mineCtx() {
  const a = P.a; if (!a || !P.human || P.ride || P.boat || P.cart || P.ship || a.swimming || !MINES.list.length) return null;
  const held = KEYS.KeyE || INPUT.use, d0 = MINES.cur;
  if (held && P.ctx === 'mine' && d0 && d0.left > 0 && Math.hypot(d0.x - a.pos.x, d0.z - a.pos.z) < d0.r + a.rad + 1.7) { CTXT.mine[2] = `להחזיק כדי לכרות ${ORE[d0.k].n} (נשארו ${d0.left})`; return 'mine'; }
  const d = mineAt(a.pos.x, a.pos.z, a.rad + 1.25); if (!d || d.left <= 0) return null;
  if (MINES.cur !== d) { MINES.cur = d; MINES.t = 0; }
  CTXT.mine[2] = `להחזיק כדי לכרות ${ORE[d.k].n} (נשארו ${d.left})`;
  return 'mine';
}
XCTX.push(mineCtx);
CTXH.mine = dt => {
  const a = P.a, d = MINES.cur; if (!d || d.left <= 0) return;
  P.eating = false; showTool('pick'); a.chopT = 0.35;
  a.yaw += angDiff(a.yaw, Math.atan2(d.x - a.pos.x, d.z - a.pos.z)) * Math.min(1, dt * 6);
  MINES.t += dt;
  if ((MINES.snd -= dt) <= 0) { MINES.snd = 0.62; AUD.play('clink', 0.8); const fx = d.x + (a.pos.x - d.x) * 0.45, fz = d.z + (a.pos.z - d.z) * 0.45; FX.spawn('dust', fx, getH(fx, fz) + 0.7, fz, 3); }
  const O = ORE[d.k], need = O.hard * (P.workshopOn ? 0.8 : 1);
  vxProgress(MINES.t / need, `כורים ${O.n}...`);
  if (MINES.t < need) return;
  MINES.t = 0; mineYield(d);
};
const oreCarried = () => ORE_K.reduce((s, k) => s + (P.inv[k] || 0), 0);
function mineYield(d) {
  const O = ORE[d.k], n = Math.min(d.left, O.per); if (n <= 0) return;
  const v = ownCamp(), home = !!v && Math.hypot(P.a.pos.x - v.x, P.a.pos.z - v.z) < villageR() + 30;
  if (d.k === 'gold') { d.left -= n; goldAdd(n); UI.notify(`🪙 כרית ${n} זהב! עכשיו יש לך ${goldHave()} זהב`, 'good'); AUD.play('chime', 0.4); PROG.flags.goldMine = (PROG.flags.goldMine || 0) + n; }
  else {
    const room = Math.max(0, ORE_CARRY - oreCarried()), take = Math.min(n, room), rest = n - take;
    if (!take && !home) { UI.notify(`🎒 התיק מלא (${ORE_CARRY} מחצבים). מפקידים במחסן או מוכרים בשוק`, 'bad'); MINES.t = -0.6; return; }
    d.left -= take + (home ? rest : 0);
    P.inv[d.k] = (P.inv[d.k] || 0) + take; if (home && rest) boxStore()[d.k] = (boxStore()[d.k] || 0) + rest;
    UI.notify(`${O.ic} כרית ${take + (home ? rest : 0)} ${O.pl} (בתיק ${P.inv[d.k]}${home && rest ? `, ${rest} למחסן` : ''})`, 'good');
    if (d.k === 'gems') PROG.flags.gems = 1;
  }
  PROG.flags.mine = (PROG.flags.mine || 0) + 1; MINES.dug++;
  if (d.left <= 0) { d.left = 0; d.regrow = G.day + 5; mineRebuild(d); UI.notify(`⛏️ המרבץ התרוקן. בעוד כמה ימים יתגלה בו עוד ${O.n}, עמוק יותר`, ''); }
  if (MINES.dug % 6 === 0) saveGame();
}
// ---------- the bag and the store ----------
function oreDeposit(st) { for (const k of ORE_K) { st[k] = (st[k] || 0) + (P.inv[k] || 0); P.inv[k] = 0; } }
function oreChips(st, near) {
  return ORE_K.map(k => { const n = (st ? st[k] || 0 : 0) + (near ? P.inv[k] || 0 : 0); return n ? `<span class="cchip">${ORE[k].ic} ${n} ${ORE[k].pl}</span>` : ''; }).join('');
}
function oreBagHtml() { const c = oreCarried(); return c ? `<div class="irow"><div><b>🎒 מחצבים בתיק</b><span>${ORE_K.filter(k => P.inv[k]).map(k => `${ORE[k].ic} ${P.inv[k]} ${ORE[k].pl}`).join(' · ')}</span></div><span class="cchip">${c} / ${ORE_CARRY}</span></div>` : ''; }
function oreToStore(k, n) { if (k === 'gold') goldAdd(n); else { const st = boxStore(); st[k] = (st[k] || 0) + n; } }
// ---------- at the market: ore is bought and sold like the rest ----------
Object.assign(GOODS, {
  stone: { n: 'אבנים', ic: '🪨', u: 10, p: 0.3, un: 'אבנים', ore: true },
  copper: { n: 'נחושת', ic: '🟤', u: 4, p: 1.6, un: 'גושי נחושת', ore: true },
  iron: { n: 'ברזל', ic: '⚙️', u: 4, p: 2.2, un: 'גושי ברזל', ore: true },
  salt: { n: 'מלח', ic: '🧂', u: 5, p: 1.3, un: 'גושי מלח', ore: true },
  gems: { n: 'אבני חן', ic: '💎', u: 1, p: 15, un: 'אבן חן', ore: true }
});
// what is rare in a land is dear there (salt in Africa and the jungle, iron where there is none, gems everywhere but India)
const ORE_PRICE = { salt: { 11: 2.2, 0: 1.6, 3: 0.6, 10: 0.7 }, iron: { 11: 1.3, 10: 1.3, 6: 0.7, 5: 0.85 }, copper: { 7: 0.8, 10: 0.85 }, gems: { 12: 0.7, 5: 1.3, 6: 1.3 }, stone: { 3: 1.6, 7: 1.4 } };
const orePriceK = (i, k) => { const L = campLand(HUNT.camps[i]); return (ORE_PRICE[k] && ORE_PRICE[k][L]) || 1; };
function oreTheirs(i) {
  const T = TRADE.ore || (TRADE.ore = {}); if (T[i]) return T[i];
  const L = campLand(HUNT.camps[i]), W = ORE_LAND[L] || ORE_LAND[0], lv = (HUNT.camps[i] && HUNT.camps[i].lvl) || 0, o = {};
  for (const k of ORE_K) o[k] = Math.round((W[k] || 0) * (k === 'stone' ? 9 : k === 'gems' ? 0.8 : 3) * (1 + lv * 0.4) + (k === 'stone' ? 6 : 0));
  return (T[i] = o);
}
const oreOurHave = (k, near) => (near ? P.inv[k] || 0 : 0) + (boxStore()[k] || 0);
function oreTake(k, n, near) { const inv = near ? Math.min(P.inv[k] || 0, n) : 0; P.inv[k] = (P.inv[k] || 0) - inv; const st = boxStore(); st[k] = Math.max(0, (st[k] || 0) - (n - inv)); }
function oreTrade(i, k, n) { const o = oreTheirs(i); o[k] = Math.max(0, (o[k] || 0) + n); }
// the markets restock a little every day
function oreDaily() { const T = TRADE.ore; if (!T) return; for (const i in T) { const L = campLand(HUNT.camps[i]), W = ORE_LAND[L] || ORE_LAND[0]; for (const k of ORE_K) if ((W[k] || 0) > 1.5 && T[i][k] < 24) T[i][k] += 1 + (rng() < 0.5 ? 1 : 0); } }
// ---------- iron: stronger spearheads, arrowheads and blades (at a fire, in the arsenal) ----------
const IRONUP = {
  spear: { n: 'ראשי חנית מברזל', d: 'החניתות פוגעות חזק יותר ב-25%', cost: 5, k: 'ironSpear' },
  arrow: { n: 'ראשי חץ מברזל', d: 'החצים פוגעים חזק יותר ב-20%', cost: 4, k: 'ironArrow', need: () => !!P.hasBow, why: 'צריך קשת' },
  sword: { n: 'להב ברזל לחרב', d: 'החרב פוגעת חזק יותר ב-30%', cost: 8, k: 'ironSword', need: () => !!P.hasSword, why: 'צריך חרב' }
};
const ironHave = () => oreOurHave('iron', true) - (inCamp(12) ? 0 : boxStore().iron || 0);
const ironK = kind => kind === 'arrow' ? (P.ironArrow ? 1.2 : 1) : kind === 'sword' ? (P.ironSword ? 1.3 : 1) : (P.ironSpear ? 1.25 : 1);
function ironHtml(fire) {
  const have = ironHave();
  const rows = Object.keys(IRONUP).map(u => {
    const U = IRONUP[u], done = !!P[U.k], why = done ? '' : U.need && !U.need() ? U.why : !fire ? 'צריך להיות ליד אש' : have < U.cost ? `צריך ${U.cost} ברזל` : '';
    return `<div class="irow"><div><b>⚙️ ${U.n}</b><span>${U.d}</span></div>${done ? '<span class="cchip ok">✓ יש</span>' : `<button class="btn${why ? '' : ' pri'}" data-a="iron_${u}"${why ? ` disabled title="${why}"` : ''}>${U.cost} ⚙️</button>`}</div>`;
  }).join('');
  return `<h3>⚙️ ברזל</h3><p class="idim arsTip">יש לך ${have} ברזל${inCamp(12) ? ' (עם המחסן)' : ''}. כורים ברזל במרבצים של סלעים חלודים, או קונים בשוק.</p>${rows}`;
}
function ironCraft(u) {
  const U = IRONUP[u]; if (!U || P[U.k]) return false;
  if (U.need && !U.need()) { UI.notify(U.why, 'bad'); return false; }
  if (ironHave() < U.cost) { UI.notify(`צריך ${U.cost} ברזל`, 'bad'); return false; }
  oreTake('iron', U.cost, true); P[U.k] = true; PROG.flags.iron = 1;
  UI.notify(`⚙️ ${U.n}: ${U.d}`, 'good'); AUD.play('hammer', 0.7); return true;
}
// ---------- the village digs: an order like hunting or bringing wood ----------
ORDT.mine = { ic: '⛏️', n: 'לכרות במרבץ', d: 'כורים אבן, מתכות, מלח או אבני חן במרבץ הקרוב, ומביאים למחסן (זהב לאוצר)', who: ['builder', 'gatherer', 'warrior', 'hunter'], def: 2, unit: 'מחצבים', goal: n => n * 12, T: 480, area: 1, go: 'יצאו לכרות', go1: ['יצא לכרות', 'יצאה לכרות'] };
PORD.push('mine');
function ordMine(a, dt, v, o) {
  let j = a.job;
  if (j && j.k === 'mhome') {
    const d = jobGo(a, v.x + j.ox, v.z + j.oz, a.sp.walk, dt);
    if (d < 3.2) { oreToStore(j.ore, j.n); o.got += j.n; a.carry = false; a.job = null; }
    return true;
  }
  if (!j || j.k !== 'mine' || j.dep.left <= 0) {
    const dep = mineNearest(o.x, o.z, o.home ? 360 : 150, true);
    if (!dep) { if (!o.men.some(m => m !== a && m.job && (m.job.k === 'mine' || m.job.k === 'mhome'))) ordEnd(o, 'ore'); else ordLeave(a); return false; }
    const ang = rng() * TAU; a.job = j = { k: 'mine', dep, x: dep.x + Math.cos(ang) * (dep.r + 0.9), z: dep.z + Math.sin(ang) * (dep.r + 0.9), t: rr(12, 20), snd: 0 };
  }
  const d = jobGo(a, j.x, j.z, a.sp.walk * 1.1, dt);
  if (d < 1.2 || (a.blocked || 0) > 1.5) {
    a.move(0, 0, 0, dt); a.yaw += angDiff(a.yaw, Math.atan2(j.dep.x - a.pos.x, j.dep.z - a.pos.z)) * Math.min(1, dt * 4); a.pose = 'chop'; j.t -= dt;
    if (a.dCam < 40 && (j.snd -= dt) <= 0) { j.snd = 0.75; AUD.at('clink', a.pos, 0.5); }
    if (j.t <= 0) {
      const O = ORE[j.dep.k], n = Math.min(j.dep.left, O.per + (j.dep.k === 'stone' ? 1 : 0));
      if (n > 0) { j.dep.left -= n; if (j.dep.left <= 0) { j.dep.left = 0; j.dep.regrow = G.day + 5; mineRebuild(j.dep); } a.carry = true; a.job = { k: 'mhome', ore: j.dep.k, n, ox: rr(-1, 1), oz: rr(-1, 1) }; }
      else a.job = null;
    }
  }
  return true;
}
// ---------- on the maps: the veins you found ----------
function mineMiniDots(pt) { for (const d of MINES.list) if (d.seen && !d.off) pt(d.x, d.z, d.left > 0 ? 3.6 : 2.4, d.left > 0 ? ORE[d.k].dot : '#7a746a'); }
function mineBigMap(c, m) {
  c.save(); c.font = 'bold 15px Rubik,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  for (const d of MINES.list) {
    if (!d.seen || d.off) continue; const [x, y] = m(d.x, d.z);
    c.fillStyle = d.left > 0 ? ORE[d.k].dot : '#7a746a'; c.strokeStyle = '#1c1608'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(x, y - 6); c.lineTo(x + 6, y); c.lineTo(x, y + 6); c.lineTo(x - 6, y); c.closePath(); c.fill(); c.stroke();
  }
  c.restore();
}
// ---------- save, load, a new game ----------
function mineSave() {
  const u = {}; for (const d of MINES.list) if (d.left < d.max || d.regrow) u[d.id] = [d.left, d.regrow || 0];
  return { u, s: [...MINES.seen], k: [...MINES.kinds] };
}
function mineReset() { for (const d of MINES.list) { d.left = d.max; d.regrow = 0; d.seen = false; mineRebuild(d); } MINES.seen = new Set(); MINES.kinds = new Set(); MINES.cur = null; MINES.day = -1; if (TRADE) TRADE.ore = {}; }
function mineLoad(o) {
  mineGen(); mineReset(); if (!o) return;
  for (const id in o.u || {}) { const d = MINES.list[+id]; if (d) { d.left = clamp(o.u[id][0] | 0, 0, d.max); d.regrow = o.u[id][1] || 0; } }
  for (const id of o.s || []) { const d = MINES.list[id]; if (d) { d.seen = true; MINES.seen.add(id); } }
  for (const k of o.k || []) if (ORE[k]) MINES.kinds.add(k);
}
{
  const ins = (after, ...ms) => { const at = MISSIONS.hunter.findIndex(m => m.id === after); MISSIONS.hunter.splice(at < 0 ? MISSIONS.hunter.length : at + 1, 0, ...ms); };
  ins('hunter.clear', MS('hunter.mine', 'לכרות במרבץ: אבן, מתכת, מלח או זהב', 60, FL('mine')));
  ins('hunter.ride', MS('hunter.goldmine', 'לכרות זהב', 90, FL('goldMine')), MS('hunter.iron', 'לחשל נשק מברזל בארסנל', 90, FL('iron')));
  ins('hunter.vassal', MS('hunter.raidHelp', 'לעזור לעיר להדוף פושטים', 150, FL('raidHelp')));
  for (const m of MISSIONS.hunter) GOAL[m.id] = m;
}
ICON.pick = SVG('<path d="M4 20L15.5 8.5"/><path d="M8.6 4.4Q18 5.6 19.6 15.2" stroke-width="3.2"/>');
