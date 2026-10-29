// ================= THE OLD WORLD: a continent across the ocean, with lands from all over the world =================
// Europe of the castles in the north-west, the Vikings' fjords beyond it, the great steppe of the horsemen, China and
// the islands of Japan in the east, India in the south-east, the deserts of Arabia and Egypt with the Nile, and the
// savanna of Mali in Africa. One ground grid of its own (6.25 m), rivers that run to the sea, and a sea between Europe
// and Africa that ships can sail into.
// u, v: a place on the Old World's own map, -1..1 (v < 0 is the north)
const owU = x => (x - OW.cx) / 1500, owV = z => z / 1500;
const OWL = { europe: 5, north: 6, steppe: 7, china: 8, japan: 9, arabia: 10, africa: 11, india: 12, ocean: 13 };
LANDS.push(
  { k: 'europe', n: 'ממלכות אירופה', in: 'בממלכות אירופה', to: 'לממלכות אירופה' },
  { k: 'nordic', n: 'ארצות הצפון', in: 'בארצות הצפון', to: 'לארצות הצפון' },
  { k: 'steppe', n: 'הערבה הגדולה', in: 'בערבה הגדולה', to: 'לערבה הגדולה' },
  { k: 'china', n: 'סין', in: 'בסין', to: 'לסין' },
  { k: 'japan', n: 'יפן', in: 'ביפן', to: 'ליפן' },
  { k: 'arabia', n: 'ערב ומצרים', in: 'בערב ובמצרים', to: 'לערב ולמצרים' },
  { k: 'africa', n: 'אפריקה', in: 'באפריקה', to: 'לאפריקה' },
  { k: 'india', n: 'הודו', in: 'בהודו', to: 'להודו' },
  { k: 'ocean', n: 'האוקיינוס', in: 'באוקיינוס', to: 'לאוקיינוס' }
);
// the land masses: [u, v, radius u, radius v]
const OW_LOBES = [
  [-0.55, -0.30, 0.34, 0.30], [-0.80, -0.06, 0.13, 0.13], [-0.42, -0.70, 0.17, 0.20], [-0.47, -0.50, 0.08, 0.09],
  [0.02, -0.46, 0.38, 0.30], [0.20, -0.76, 0.48, 0.14], [0.53, -0.14, 0.25, 0.36], [0.37, 0.47, 0.16, 0.27],
  [0.10, 0.08, 0.22, 0.18], [0.02, 0.32, 0.17, 0.20], [-0.17, 0.31, 0.13, 0.18], [-0.40, 0.55, 0.35, 0.33], [-0.62, 0.36, 0.15, 0.13]
];
const OW_ISLES = [[-0.86, -0.55, 0.055, 0.11], [0.865, -0.21, 0.05, 0.17], [0.845, 0.02, 0.035, 0.07]];
// the seas inside it: the Mediterranean, the Black Sea, the Persian Gulf
const OW_SEAS = [[-0.42, 0.105, 0.40, 0.065], [-0.10, -0.11, 0.08, 0.05], [0.20, 0.20, 0.06, 0.04], [0.805, -0.1, 0.022, 0.42]];
// the seeds of the lands: [u, v, land]
const OW_SEEDS = [
  [-0.55, -0.28, 5], [-0.80, -0.06, 5], [-0.86, -0.55, 5], [-0.30, -0.18, 5],
  [-0.42, -0.72, 6], [0.10, -0.82, 6], [0.48, -0.80, 6],
  [-0.02, -0.46, 7], [0.28, -0.50, 7], [0.10, -0.25, 7],
  [0.56, -0.14, 8], [0.54, 0.14, 8], [0.66, -0.36, 8],
  [0.865, -0.21, 9], [0.845, 0.02, 9],
  [0.02, 0.32, 10], [0.14, 0.04, 10], [-0.17, 0.30, 10],
  [-0.40, 0.60, 11], [-0.64, 0.38, 11], [-0.22, 0.70, 11],
  [0.37, 0.47, 12]
];
// mountain ranges: [points [u, v], height, half width in u]
const OW_RIDGES = [
  [[[-0.64, -0.07], [-0.47, -0.13], [-0.32, -0.10]], 92, 0.055],            // the Alps
  [[[-0.79, -0.16], [-0.68, -0.15]], 48, 0.03],                              // the Pyrenees
  [[[-0.19, -0.82], [-0.16, -0.58], [-0.18, -0.30]], 52, 0.04],              // the Urals
  [[[0.12, 0.23], [0.28, 0.28], [0.45, 0.26], [0.60, 0.31]], 175, 0.07],     // the Himalayas
  [[[-0.74, 0.21], [-0.55, 0.22]], 46, 0.03],                                // the Atlas
  [[[-0.48, -0.86], [-0.41, -0.69], [-0.37, -0.56]], 72, 0.05],              // the mountains of the north
  [[[0.858, -0.34], [0.872, -0.07]], 38, 0.03],                               // Japan's spine
  [[[0.38, -0.44], [0.50, -0.38]], 60, 0.05]                                 // the hills at the Great Wall
];
const FUJI = { u: 0.866, v: -0.15, r: 0.045, h: 118 };
// rivers that run to the sea: [name, points [u, v], half width (m)]
const OW_RIVERS = [
  ['הנילוס', [[-0.20, 0.84], [-0.22, 0.62], [-0.16, 0.45], [-0.19, 0.28], [-0.17, 0.14]], 9],
  ['הריין', [[-0.48, -0.13], [-0.52, -0.30], [-0.53, -0.46], [-0.66, -0.58]], 7],
  ['הדנובה', [[-0.40, -0.18], [-0.30, -0.23], [-0.18, -0.17], [-0.11, -0.12]], 8],
  ['הנהר הצהוב', [[0.40, -0.22], [0.55, -0.26], [0.68, -0.18], [0.80, -0.20]], 9],
  ['היאנגצה', [[0.42, 0.05], [0.58, 0.10], [0.70, 0.06], [0.80, 0.08]], 10],
  ['הגנגס', [[0.30, 0.31], [0.38, 0.36], [0.47, 0.40], [0.54, 0.47]], 9],
  ['הניז׳ר', [[-0.70, 0.30], [-0.55, 0.42], [-0.45, 0.60], [-0.50, 0.89]], 9],
  ['הפרת', [[0.04, -0.02], [0.10, 0.06], [0.19, 0.17]], 7]
];
const OWR = { rivers: [], seaK: null };

// ---------- the shape of the land ----------
function owLandK(u, v) {
  let k = -1;
  for (const L of OW_LOBES) { const a = (u - L[0]) / L[2], b = (v - L[1]) / L[3]; k = Math.max(k, 1 - (a * a + b * b)); }
  for (const L of OW_ISLES) { const a = (u - L[0]) / L[2], b = (v - L[1]) / L[3]; k = Math.max(k, (1 - (a * a + b * b)) * 0.9); }
  k += Noise.fbm(u * 3.2 + 41, v * 3.2 - 17, 3) * 0.32 + Noise.fbm(u * 11 - 3, v * 11 + 8, 2) * 0.09;
  for (const S of OW_SEAS) { const a = (u - S[0]) / S[2], b = (v - S[1]) / S[3], e = 1 - (a * a + b * b); if (e > -0.6) k -= smooth(-0.6, 0.35, e) * 1.6; }
  // the far edges of the grid are open sea, like the sea around it
  k -= smooth(0.9, 0.97, Math.max(Math.abs(u), Math.abs(v))) * 3;
  return k;
}
// how much a place belongs to each land (5..12), soft at the borders
const _ow = new Float32Array(14);
function owLandW(u, v) {
  _ow.fill(0);
  const wu = u + Noise.fbm(u * 2.6 + 9, v * 2.6 - 4, 3) * 0.07, wv = v + Noise.fbm(u * 2.6 - 21, v * 2.6 + 13, 3) * 0.07;
  let s = 0;
  for (const S of OW_SEEDS) { const d2 = (wu - S[0]) * (wu - S[0]) + (wv - S[1]) * (wv - S[1]); const w = Math.exp(-d2 / 0.0035); _ow[S[2]] += w; s += w; }
  if (s < 1e-9) { // far from every seed: the nearest one alone
    let bd = 1e9, bl = 5; for (const S of OW_SEEDS) { const d2 = (wu - S[0]) ** 2 + (wv - S[1]) ** 2; if (d2 < bd) { bd = d2; bl = S[2]; } } _ow[bl] = 1; return _ow;
  }
  for (let i = 5; i <= 12; i++) _ow[i] /= s;
  return _ow;
}
function owBestLand(W0) { let b = 5; for (let i = 6; i <= 12; i++) if (W0[i] > W0[b]) b = i; return b; }
function polyDistUV(u, v, P) {
  let best = 1e9;
  for (let i = 0; i < P.length - 1; i++) {
    const ax = P[i][0], az = P[i][1], bx = P[i + 1][0] - ax, bz = P[i + 1][1] - az, l2 = bx * bx + bz * bz;
    let f = l2 > 0 ? ((u - ax) * bx + (v - az) * bz) / l2 : 0; f = f < 0 ? 0 : f > 1 ? 1 : f;
    const dx = u - (ax + bx * f), dz = v - (az + bz * f), d = dx * dx + dz * dz; if (d < best) best = d;
  }
  return Math.sqrt(best);
}

// ---------- the ground of each land ----------
function owHeight(x, z, u, v, k, W0) {
  if (k <= 0) {
    // the sea: shallow by the coast, then down to the deep floor of the ocean
    return Math.max(seaFloor(x, z), -0.3 + k * 120) + Noise.fbm(x * 0.01, z * 0.01, 2) * 0.8 * smooth(-0.02, -0.15, k);
  }
  let h = 0;
  const ex = x + 2300, ez = z - 1700;   // the New World's lands lent to the Old World's, somewhere else in their noise
  if (W0[5] > 0.003) h += W0[5] * (4.5 + Noise.fbm(x * 0.0031 + 5, z * 0.0031 - 9, 4) * 7 + Math.pow(Math.max(0, Noise.fbm(x * 0.0052 - 17, z * 0.0052 + 3, 3) + 0.05), 2) * 55);
  if (W0[6] > 0.003) h += W0[6] * hNorth(x - 900, z + 2100);
  if (W0[7] > 0.003) h += W0[7] * (4 + Noise.fbm(x * 0.0022 + 70, z * 0.0022, 3) * 3.5 + Noise.fbm(x * 0.02, z * 0.02, 2) * 0.4);
  if (W0[8] > 0.003) { const kp = Noise.ridge(x * 0.012 + 4, z * 0.012 - 8, 2); h += W0[8] * (5 + Noise.fbm(x * 0.0035 - 30, z * 0.0035 + 12, 3) * 6 + smooth(0.62, 0.86, kp) * 34 * smooth(0.1, 0.35, Noise.fbm(x * 0.004 + 9, z * 0.004, 2))); }
  if (W0[9] > 0.003) h += W0[9] * (6 + Noise.fbm(x * 0.006 + 11, z * 0.006 + 5, 3) * 9);
  if (W0[10] > 0.003) h += W0[10] * hWest(ex - 4100, ez);
  if (W0[11] > 0.003) h += W0[11] * hEast(ex, ez - 3000);
  if (W0[12] > 0.003) h += W0[12] * (4 + Noise.fbm(x * 0.0035 + 3, z * 0.0035 + 41, 3) * 4.5);
  for (const R of OW_RIDGES) {
    const d = polyDistUV(u, v, R[0]); if (d > R[2] * 1.6) continue;
    const t = smooth(R[2] * 1.6, 0, d + Noise.fbm(x * 0.01, z * 0.01, 2) * R[2] * 0.4);
    h += t * t * R[1] * (0.55 + 0.45 * Noise.ridge(x * 0.007 + R[1], z * 0.007 - R[1], 4));
  }
  { const d = Math.hypot(u - FUJI.u, v - FUJI.v); if (d < FUJI.r) { const t = 1 - d / FUJI.r; h += FUJI.h * t * t * (3 - 2 * t) - smooth(0.92, 1, t) * 14; } }
  // down to the sea along the coast: beaches
  return lerp(0.6, h, smooth(0, 0.16, k)) + smooth(0.05, 0, k) * -0.9;
}

// ---------- making it ----------
function oldWorldGen() {
  const t0 = performance.now(), V = OW.V;
  const K = OWR.seaK = new Float32Array(OWNV);
  for (let iz = 0; iz < V; iz++) for (let ix = 0; ix < V; ix++) {
    const i = iz * V + ix, x = owX(ix), z = owZ(iz), u = owU(x), v = owV(z), k = owLandK(u, v);
    K[i] = k;
    const W0 = owLandW(u, v); RG2[i] = k > -0.02 ? owBestLand(W0) : OWL.ocean;
    HM2[i] = owHeight(x, z, u, v, k, W0);
    // the very edge meets the open sea exactly
    const e = Math.max(Math.abs(ix - OW.N / 2), Math.abs(iz - OW.N / 2)) / (OW.N / 2);
    if (e > 0.97) HM2[i] = lerp(HM2[i], seaFloor(x, z), smooth(0.97, 1, e));
  }
  // rivers: a wide green valley, and the river itself down to the sea's level
  for (const [n, P0, hw] of OW_RIVERS) {
    const P = catmull(P0.map(p => [OW.cx + p[0] * 1500, p[1] * 1500]), 6).map(p => ({ x: p.x, z: p.z, w: hw * 2 }));
    OWR.rivers.push({ n, P, hw });
    owForGrid(polyBBox(P, hw + 60), (i, x, z) => {
      const r = nearestOnPoly(x, z, P), d = r[0]; if (d > hw + 55) return;
      let h = HM2[i];
      if (d < hw) h = Math.min(h, -2.6 * (1 - (d / hw) * (d / hw)) - 0.4);
      else h = Math.min(h, lerp(0.45, h, smooth(hw, hw + 50, d)));
      HM2[i] = h; if (d < SD2[i]) SD2[i] = d;
    });
  }
  // where people live: flat ground for the settlements, and the roads between them (which go round the steep places)
  owPlanSettlements(); owSlopes(); owMarkBlocked(); owPlanRoads();
  // slopes, forests
  owSlopes();
  for (let iz = 0; iz < V; iz++) for (let ix = 0; ix < V; ix++) {
    const i = iz * V + ix, x = owX(ix), z = owZ(iz), h = HM2[i], L = RG2[i]; if (h < 0.4 || L === OWL.ocean) { FO2[i] = 0; continue; }
    const n = Noise.fbm(x * 0.0065 + 77, z * 0.0065 - 31, 3);
    const want = { 5: smooth(-0.1, 0.25, n) * 0.85, 6: smooth(-0.35, 0.05, n) * (1 - smooth(-1350, -1150, z) * 0.85), 7: smooth(0.32, 0.5, n) * 0.4, 8: smooth(-0.05, 0.3, n) * 0.7,
      9: smooth(-0.3, 0.1, n) * 0.85, 10: 0, 11: smooth(0.1, 0.4, n) * 0.35, 12: smooth(-0.25, 0.15, n) * 0.85 }[L] || 0;
    FO2[i] = want * smooth(0.6, 0.85, NY2[i]) * (1 - smooth(90, 140, h)) * (SD2[i] < 6 ? 0.3 : 1);
  }
  // the colour of the water and of the ground (the map shows the same ones)
  WBLUE2 = new Uint8Array(OWNV).fill(255);
  for (let i = 0; i < OWNV; i++) { const L = RG2[i]; if (L === OWL.ocean) continue; WBLUE2[i] = { 5: 150, 6: 220, 7: 170, 8: 120, 9: 200, 10: 200, 11: 110, 12: 120 }[L] || 200; if (K[i] < 0.02) WBLUE2[i] = 255; }
  // names on the map
  POI.push({ x: OW.cx - 0.55 * 1500, z: -0.42 * 1500, n: 'אירופה' }, { x: OW.cx - 0.42 * 1500, z: 0.105 * 1500, n: 'הים התיכון' }, { x: OW.cx - 0.10 * 1500, z: -0.11 * 1500, n: 'הים השחור' },
    { x: OW.cx - 0.40 * 1500, z: -0.74 * 1500, n: 'ארצות הצפון' }, { x: OW.cx + 0.05 * 1500, z: -0.50 * 1500, n: 'הערבה הגדולה' }, { x: OW.cx + 0.58 * 1500, z: -0.02 * 1500, n: 'סין' },
    { x: OW.cx + FUJI.u * 1500, z: FUJI.v * 1500, n: 'הר פוג׳י' }, { x: OW.cx + 0.37 * 1500, z: 0.52 * 1500, n: 'הודו' }, { x: OW.cx + 0.36 * 1500, z: 0.26 * 1500, n: 'ההימלאיה' },
    { x: OW.cx - 0.47 * 1500, z: -0.12 * 1500, n: 'הרי האלפים' }, { x: OW.cx + 0.02 * 1500, z: 0.36 * 1500, n: 'מדבר ערב' }, { x: OW.cx - 0.42 * 1500, z: 0.62 * 1500, n: 'אפריקה' },
    { x: OW.cx - 0.94 * 1500 - 300, z: 0.1 * 1500, n: 'האוקיינוס האטלנטי' }, { x: OW.cx + 1500 + 250, z: 0.2 * 1500, n: 'האוקיינוס השקט' });
  for (const R of OWR.rivers) { const m = R.P[Math.round(R.P.length * 0.55)]; POI.push({ x: m.x, z: m.z, n: R.n }); }
  OWR.ms = performance.now() - t0;
}
function owSlopes() {
  const V = OW.V;
  for (let iz = 0; iz < V; iz++) for (let ix = 0; ix < V; ix++) {
    const i = iz * V + ix;
    const hl = HM2[iz * V + Math.max(0, ix - 1)], hr = HM2[iz * V + Math.min(OW.N, ix + 1)], hd = HM2[Math.max(0, iz - 1) * V + ix], hu = HM2[Math.min(OW.N, iz + 1) * V + ix];
    const nx = (hl - hr) / (2 * OW.cell), nz = (hd - hu) / (2 * OW.cell);
    NY2[i] = 1 / Math.sqrt(nx * nx + nz * nz + 1);
  }
}
function owForGrid(bb, fn) {
  const ix0 = clamp(Math.floor((bb[0] - OW.x0) / OW.cell), 0, OW.N), ix1 = clamp(Math.ceil((bb[1] - OW.x0) / OW.cell), 0, OW.N);
  const iz0 = clamp(Math.floor((bb[2] - OW.z0) / OW.cell), 0, OW.N), iz1 = clamp(Math.ceil((bb[3] - OW.z0) / OW.cell), 0, OW.N);
  for (let iz = iz0; iz <= iz1; iz++) for (let ix = ix0; ix <= ix1; ix++) fn(iz * OW.V + ix, owX(ix), owZ(iz));
}
// which land a place is in (the Old World's are 5..12, the open sea 13)
function owLandAt(x, z) { if (!inOld(x, z)) return OWL.ocean; return RG2[owIdx(x, z)]; }

// ---------- the colours of the Old World's ground ----------
const OWC = {
  grass: col('#5f8a34'), meadow: col('#7a9a3c'), forest: col('#3d5f26'), field: col('#a99a4a'), rock: col('#7a756a'), snow: col('#eef2f5'), beach: col('#e2d3a4'),
  steppe: col('#9a9a52'), steppeD: col('#8a7c48'), taiga: col('#475236'), tundra: col('#80795a'), sand: col('#dcc08a'), sandD: col('#c9a46a'), nile: col('#4f7a2a'),
  sav: col('#a99d60'), savG: col('#7f8c4a'), red: col('#9a5a38'), jungle: col('#3f6a26'), paddy: col('#7fae4a'), mud: col('#5b4a34'), seabed: col('#cdbb8c')
};
const _oc = new THREE.Color();
function owColor(c, i, x, z, h, ny) {
  const u = owU(x), v = owV(z), W0 = owLandW(u, v), n1 = Noise.fbm(x * 0.045, z * 0.045, 2), n2 = Noise.n2(x * 0.13, z * 0.13);
  const steep = smooth(0.78, 0.5, ny), fo = FO2[i], sd = SD2[i], t = _oc;
  if (h < 0.35) { c.copy(h < -0.3 ? OWC.seabed : OWC.beach); if (sd < 30) c.lerp(OWC.mud, 0.6); return c; }
  c.setRGB(0, 0, 0);
  const add = w => { c.r += t.r * w; c.g += t.g * w; c.b += t.b * w; };
  if (W0[5] > 0.002) { t.copy(OWC.grass).lerp(OWC.meadow, clamp(0.5 + n1, 0, 1) * 0.5).lerp(OWC.field, smooth(0.35, 0.5, Noise.fbm(x * 0.012 + 3, z * 0.012, 2)) * 0.55); add(W0[5]); }
  if (W0[6] > 0.002) { t.copy(OWC.taiga).lerp(OWC.tundra, clamp(smooth(-1050, -1350, z) + (1 - fo) * 0.3, 0, 1)).lerp(OWC.snow, smooth(-1150, -1420, z) * 0.85); add(W0[6]); }
  if (W0[7] > 0.002) { t.copy(OWC.steppe).lerp(OWC.steppeD, clamp(0.5 + n1 * 1.3, 0, 1) * 0.6); add(W0[7]); }
  if (W0[8] > 0.002) { t.copy(OWC.grass).lerp(OWC.paddy, smooth(30, 8, sd) * 0.7).lerp(OWC.jungle, fo * 0.4); add(W0[8]); }
  if (W0[9] > 0.002) { t.copy(OWC.grass).lerp(OWC.forest, fo * 0.5); add(W0[9]); }
  if (W0[10] > 0.002) { t.copy(OWC.sand).lerp(OWC.sandD, clamp(0.5 + n1 * 1.2, 0, 1)).lerp(OWC.red, smooth(15, 26, h) * 0.6).lerp(OWC.nile, smooth(45, 12, sd) * 0.9); add(W0[10]); }
  if (W0[11] > 0.002) { t.copy(OWC.sav).lerp(OWC.savG, clamp(smooth(30, 6, sd) * 0.8 + fo * 0.6, 0, 1)).lerp(OWC.red, smooth(0.25, 0.55, Noise.fbm(x * 0.008 + 3, z * 0.008 - 5, 2)) * 0.35); add(W0[11]); }
  if (W0[12] > 0.002) { t.copy(OWC.jungle).lerp(OWC.grass, clamp(0.5 + n1, 0, 1) * 0.5); add(W0[12]); }
  c.lerp(OWC.forest, fo * 0.45);
  c.lerp(OWC.rock, clamp(steep * 0.9 + smooth(45, 90, h) * 0.6, 0, 1));
  c.lerp(OWC.snow, smooth(85, 125, h + n2 * 8) * (1 - steep * 0.5));
  if (h < 2.2) c.lerp(OWC.beach, smooth(2.2, 0.9, h + n2 * 0.3) * smooth(0.08, 0, OWR.seaK[i]));
  return c;
}

// ---------- the ground as a mesh: pieces of 60 by 60 cells, like the New World's ----------
function oldWorldTerrain() {
  const V = OW.V, K = OW.N / 60, C = 60;
  const idx = new Uint16Array(C * C * 6); let q = 0;
  for (let j = 0; j < C; j++) for (let i = 0; i < C; i++) { const a = j * (C + 1) + i, b = a + 1, c = a + C + 1, d = c + 1; idx[q++] = a; idx[q++] = c; idx[q++] = b; idx[q++] = b; idx[q++] = c; idx[q++] = d; }
  TCOL2 = new Uint8Array(OWNV * 3);
  const colr = new Float32Array(OWNV * 3), c = new THREE.Color();
  for (let iz = 0; iz < V; iz++) for (let ix = 0; ix < V; ix++) {
    const i = iz * V + ix; owColor(c, i, owX(ix), owZ(iz), HM2[i], NY2[i]);
    colr[i * 3] = c.r; colr[i * 3 + 1] = c.g; colr[i * 3 + 2] = c.b;
    TCOL2[i * 3] = Math.pow(c.r, 0.4545) * 255; TCOL2[i * 3 + 1] = Math.pow(c.g, 0.4545) * 255; TCOL2[i * 3 + 2] = Math.pow(c.b, 0.4545) * 255;
  }
  for (let cz = 0; cz < K; cz++) for (let cx = 0; cx < K; cx++) {
    const n = (C + 1) * (C + 1), pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), cl = new Float32Array(n * 3), fo = new Float32Array(n);
    let k = 0, hiMax = -99;
    for (let j = 0; j <= C; j++) for (let i = 0; i <= C; i++, k++) {
      const ix = cx * C + i, iz = cz * C + j, s = iz * V + ix, h = HM2[s];
      pos[k * 3] = owX(ix); pos[k * 3 + 1] = h; pos[k * 3 + 2] = owZ(iz); if (h > hiMax) hiMax = h;
      const hl = HM2[iz * V + Math.max(0, ix - 1)], hr = HM2[iz * V + Math.min(OW.N, ix + 1)], hd = HM2[Math.max(0, iz - 1) * V + ix], hu = HM2[Math.min(OW.N, iz + 1) * V + ix];
      let nx = (hl - hr) / (2 * OW.cell), nz = (hd - hu) / (2 * OW.cell); const il = 1 / Math.sqrt(nx * nx + nz * nz + 1);
      nor[k * 3] = nx * il; nor[k * 3 + 1] = il; nor[k * 3 + 2] = nz * il;
      cl[k * 3] = colr[s * 3]; cl[k * 3 + 1] = colr[s * 3 + 1]; cl[k * 3 + 2] = colr[s * 3 + 2]; fo[k] = FO2[s];
    }
    if (hiMax < -8) continue;   // a piece of deep sea only: the water covers it
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setAttribute('color', new THREE.BufferAttribute(cl, 3)); g.setAttribute('aForest', new THREE.BufferAttribute(fo, 1));
    g.setIndex(new THREE.BufferAttribute(idx, 1)); g.computeBoundingSphere(); freeAfterUpload(g);
    const m = new THREE.Mesh(g, terrainMat); m.receiveShadow = true; scene.add(m);
    TCHUNK.list.push({ m, x: g.boundingSphere.center.x, z: g.boundingSphere.center.z, r: g.boundingSphere.radius });
  }
  buildPackIce(); roadsMesh();
}
// the water's depths and colours over the Old World, for the sea's shader
function oldWorldWater() {
  const S = OW.V, data = new Uint8Array(S * S * 4);
  for (let i = 0; i < OWNV; i++) { const v = clamp((HM2[i] + 8) / 16, 0, 1) * 255; data[i * 4] = v; data[i * 4 + 1] = WBLUE2 ? WBLUE2[i] : 255; data[i * 4 + 2] = clamp(-HM2[i] / 40, 0, 1) * 255; data[i * 4 + 3] = 255; }
  const ht = new THREE.DataTexture(data, S, S, THREE.RGBAFormat);
  ht.magFilter = ht.minFilter = THREE.LinearFilter; ht.needsUpdate = true;
  waterMat.uniforms.tH2.value = ht;
}
