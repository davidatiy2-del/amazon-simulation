// ================= CIVILIZATIONS: kingdoms with castles, knights and kings, and peoples from all over the world =================
const CIVS = {
  knights: { land: 5, n: 'ממלכות האבירים', ppl: 'אבירים', ruler: ['מלך', 'מלכה'], war: ['אביר', 'אבירה'], col: '#c0392b' },
  vikings: { land: 6, n: 'הוויקינגים', ppl: 'ויקינגים', ruler: ['יארל', 'יארלית'], war: ['ויקינג', 'ויקינגית'], col: '#4a6a8a' },
  mongols: { land: 7, n: 'המונגולים', ppl: 'מונגולים', ruler: ['חאן', 'חאנית'], war: ['פרש', 'פרשית'], col: '#3a7a6a' },
  china: { land: 8, n: 'האימפריה הסינית', ppl: 'סינים', ruler: ['קיסר', 'קיסרית'], war: ['חייל', 'חיילת'], col: '#c8202a' },
  japan: { land: 9, n: 'יפן', ppl: 'יפנים', ruler: ['שוגון', 'שוגונית'], war: ['סמוראי', 'סמוראית'], col: '#202020' },
  arabs: { land: 10, n: 'הסולטנות', ppl: 'ערבים', ruler: ['סולטן', 'סולטנית'], war: ['פרש', 'פרשית'], col: '#1f7a4a' },
  egypt: { land: 10, n: 'מצרים', ppl: 'מצרים', ruler: ['פרעה', 'פרעה'], war: ['שומר', 'שומרת'], col: '#2a62b8' },
  mali: { land: 11, n: 'ממלכת מאלי', ppl: 'בני מאלי', ruler: ['מנסה', 'מלכה'], war: ['לוחם', 'לוחמת'], col: '#d8a020' },
  india: { land: 12, n: 'ממלכת המהרג׳ה', ppl: 'הודים', ruler: ['מהרג׳ה', 'מהרני'], war: ['לוחם', 'לוחמת'], col: '#e07a20' }
};
// the settlements: where they want to be (u, v on the Old World's map), how big, and whose
const OW_SETTLE = [
  { id: 'lion', civ: 'knights', kind: 'castle', n: 'טירת האריה', realm: 'ממלכת האריה', at: [-0.62, -0.31], cap: true, col: '#c0392b' },
  { id: 'eagle', civ: 'knights', kind: 'castle', n: 'טירת הנשר', realm: 'ממלכת הנשר', at: [-0.36, -0.36], cap: true, col: '#2f5fb0' },
  { id: 'mill', civ: 'knights', kind: 'town', n: 'עיירת הטחנות', realm: 'ממלכת האריה', at: [-0.71, -0.19], col: '#c0392b' },
  { id: 'vines', civ: 'knights', kind: 'village', n: 'כפר הכרמים', realm: 'ממלכת הנשר', at: [-0.42, -0.22], col: '#2f5fb0' },
  { id: 'fjord', civ: 'vikings', kind: 'town', n: 'נמל הפיורד', at: [-0.42, -0.69], cap: true },
  { id: 'wolves', civ: 'vikings', kind: 'village', n: 'כפר הזאבים', at: [-0.47, -0.58] },
  { id: 'khan', civ: 'mongols', kind: 'camp', n: 'מחנה החאן', at: [0.05, -0.45], cap: true },
  { id: 'herds', civ: 'mongols', kind: 'camp', n: 'מחנה הסוסים', at: [0.28, -0.53] },
  { id: 'forbidden', civ: 'china', kind: 'city', n: 'העיר האסורה', at: [0.56, -0.12], cap: true },
  { id: 'rice', civ: 'china', kind: 'village', n: 'כפר האורז', at: [0.61, 0.13] },
  { id: 'shogun', civ: 'japan', kind: 'castle', n: 'טירת השוגון', at: [0.865, -0.27], cap: true },
  { id: 'fishers', civ: 'japan', kind: 'village', n: 'כפר הדייגים', at: [0.845, 0.02] },
  { id: 'domes', civ: 'arabs', kind: 'city', n: 'עיר הכיפות', at: [0.07, 0.12], cap: true },
  { id: 'palms', civ: 'arabs', kind: 'village', n: 'נווה התמרים', at: [0.01, 0.38] },
  { id: 'nile', civ: 'egypt', kind: 'city', n: 'עיר הנילוס', at: [-0.17, 0.22], cap: true },
  { id: 'timbuktu', civ: 'mali', kind: 'city', n: 'טימבוקטו', at: [-0.55, 0.43], cap: true },
  { id: 'baobabs', civ: 'mali', kind: 'village', n: 'כפר הבאובבים', at: [-0.40, 0.66] },
  { id: 'palace', civ: 'india', kind: 'city', n: 'ארמון המהרג׳ה', at: [0.36, 0.42], cap: true },
  { id: 'spice', civ: 'india', kind: 'village', n: 'כפר התבלינים', at: [0.40, 0.60] }
];
const SET_R = { castle: 30, city: 34, town: 25, village: 18, camp: 22, bandits: 9 };
const OWS = { list: [], plan: false };

// ---------- where each settlement stands: flat and dry, by water, in its own land ----------
function owPlanSettlements() {
  const R = mulberry32(7171);
  for (const S of OW_SETTLE) {
    const C = CIVS[S.civ], ax = OW.cx + S.at[0] * 1500, az = S.at[1] * 1500, rad = SET_R[S.kind];
    let best = null, bs = -1e9;
    for (let t = 0; t < 900; t++) {
      const a = R() * TAU, d = Math.sqrt(R()) * 150, x = ax + Math.cos(a) * d, z = az + Math.sin(a) * d;
      if (!inOld(x, z) || owLandAt(x, z) !== C.land) continue;
      const h = owH(x, z); if (h < 1.2 || h > 55) continue;
      let lo = 1e9, hi = -1e9, wet = false;
      for (let k = 0; k < 16 && !wet; k++) { const b = k / 16 * TAU, r2 = rad * (k % 2 ? 1 : 0.55), px = x + Math.cos(b) * r2, pz = z + Math.sin(b) * r2, ph = owH(px, pz); if (ph < 0.6) wet = true; lo = Math.min(lo, ph); hi = Math.max(hi, ph); }
      if (wet || hi - lo > 14) continue;
      const sd = SD2[owIdx(x, z)]; if (sd < rad + 10) continue;
      // near water: a river or the sea
      let wd = 999; for (let k = 0; k < 24; k++) { const b = k / 24 * TAU; for (const r2 of [rad + 25, rad + 60, rad + 110]) if (owH(x + Math.cos(b) * r2, z + Math.sin(b) * r2) < 0) { wd = Math.min(wd, r2); break; } }
      const sc = -(hi - lo) * 1.2 - d * 0.05 - (wd < 999 ? wd * 0.04 : 9) + R() * 0.5;
      if (sc > bs) { bs = sc; best = { x, z, wd }; }
    }
    if (!best) { const h = owH(ax, az); best = { x: ax, z: az, wd: 999 }; if (h < 1) continue; }
    // flat ground under the settlement, blending into the hills around it
    const y = Math.max(1.4, owH(best.x, best.z));
    owForGrid([best.x - rad - 22, best.x + rad + 22, best.z - rad - 22, best.z + rad + 22], (i, x, z) => {
      const d = Math.hypot(x - best.x, z - best.z); if (d > rad + 20) return;
      const k = smooth(rad + 20, rad + 2, d); HM2[i] = lerp(HM2[i], y, k);
    });
    OWS.list.push(Object.assign({}, S, { x: best.x, z: best.z, y, r: rad, water: best.wd }));
  }
  OWS.plan = true;
}
// nothing grows where people live (and on the roads)
function owMarkBlocked() {
  OWB = new Uint8Array(OWNV);
  for (const S of OWS.list) owForGrid([S.x - S.r - 4, S.x + S.r + 4, S.z - S.r - 4, S.z + S.r + 4], (i, x, z) => { if (Math.hypot(x - S.x, z - S.z) < S.r + 4) OWB[i] = 1; });
}
// the settlements join the world's camps (after the New World's, so their numbers stay as they were)
function owCampsAdd() {
  for (const S of OWS.list) {
    if (S.camp) continue;
    const c = { x: S.x, z: S.z, y: getH(S.x, S.z), rx: S.x, rz: S.z, hunters: [], flames: [], glow: null, tribe: S.n, key: 'c_' + S.id, fresh: true, land: CIVS[S.civ].land, lvl: S.kind === 'village' ? 1 : S.kind === 'camp' ? 2 : 3,
      civ: S.civ, kind: S.kind, realm: S.realm || CIVS[S.civ].n, cap: !!S.cap, set: S, old: true };
    const w = S.wp !== undefined ? S.wp : nearestWaterOW(S.x, S.z, S.r + 140); if (w) { c.rx = w.x; c.rz = w.z; }
    c.dormant = true; OWS.dormant = true;
    S.camp = c; HUNT.camps.push(c); POI.push({ x: c.x, z: c.z, n: c.tribe, camp: true });
    TRIBEC[c.key] = S.col || CIVS[S.civ].col;
  }
  owBanditCamps();
}
function nearestWaterOW(x, z, R) {
  let best = null, bd = 1e9;
  for (let r = 10; r <= R; r += 10) for (let k = 0; k < 24; k++) { const a = k / 24 * TAU, px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r; if (waterDepth(px, pz) > 0.3) { const d = r; if (d < bd) { bd = d; best = { x: px, z: pz }; } } }
  return best;
}
const isCiv = c => !!(c && c.civ);
const isOldCamp = c => !!(c && c.x > OLDX && c.x < GLOBE.x1);
// what each land of the Old World rides: horses, and camels in Arabia
Object.assign(LAND_MOUNT, { 5: 'horse', 6: 'horse', 7: 'horse', 8: 'horse', 9: 'horse', 10: 'camel', 11: 'horse', 12: 'horse' });
