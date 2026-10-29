// ================= THE WHOLE WORLD: the jungle in the middle, a land on every side of it, the sea in the south =================
// The jungle (the whole old world) is made exactly as before. Around its mountains four lands open: the frozen north,
// the savanna in the east with its great white mountain, the desert in the west with its oasis, and in the south the
// coast, where the great river reaches the sea. Ways are cut through the jungle's mountains to each of them.
const LANDS = [
  { k: 'jungle', n: 'הג׳ונגל', in: 'בג׳ונגל', to: 'לג׳ונגל' }, { k: 'north', n: 'הצפון הקפוא', in: 'בצפון הקפוא', to: 'לצפון הקפוא' },
  { k: 'east', n: 'הסוואנה', in: 'בסוואנה', to: 'לסוואנה' }, { k: 'west', n: 'המדבר', in: 'במדבר', to: 'למדבר' }, { k: 'south', n: 'חוף הים', in: 'בחוף הים', to: 'לחוף הים' }];
const KILI = { x: 1180, z: 260, r: 270, h: 200 };
const ISLES = [{ x: -620, z: 1330, r: 95, h: 13, n: 'אי הצבים' }, { x: 380, z: 1305, r: 70, h: 10, n: 'אי הדקלים' }, { x: 1040, z: 1385, r: 52, h: 7, n: 'אי השחפים' }];
const WORLD1 = { S: null, river: null, wg: null, on: false, band: null };
const OUTW = { passes: [], ice: null, cold: null, holes: [], oasis: null, mouth: null };
let WBLUE = null, TCOL = null;   // the colour of the water, the colour of the ground (for the map)
// where each land's animals are born: the jungle inside its old border, every other land in its own box
const LANDBOX = [[-JL + 25, JL - 25, -JL + 25, JL - 25], [-LIMIT + 40, LIMIT - 40, -LIMIT + 40, -MID - 60], [MID + 60, LIMIT - 40, -LIMIT + 40, LIMIT - 40], [-LIMIT + 40, -MID - 60, -LIMIT + 40, LIMIT - 40], [-LIMIT + 40, LIMIT - 40, MID + 60, LIMIT - 40]];
let SPAWN_LAND = 0;

// how far outside the jungle's square a place is (below zero: inside it)
const outD = (x, z) => Math.max(Math.abs(x), Math.abs(z)) - MID;
// where the sea begins
const coastZ = x => 1095 + Noise.fbm(x * 0.0023 + 3.3, 7.7, 3) * 120;
// the four lands around the jungle: [north, east, west, south], soft along wobbly borders on the diagonals
const _rw = [0, 0, 0, 0];
let _rwd = 0;
function regW(x, z) {
  const ax = Math.abs(x), az = Math.abs(z);
  _rwd = ax - az + Noise.fbm(x * 0.0021 + 13.7, z * 0.0021 - 4.1, 2) * 110;
  const k = smooth(-55, 55, _rwd);
  _rw[0] = z < 0 ? 1 - k : 0; _rw[1] = x > 0 ? k : 0; _rw[2] = x <= 0 ? k : 0; _rw[3] = z >= 0 ? 1 - k : 0;
  return _rw;
}
// how much a place belongs to each land: [jungle, north, east, west, south]
const _lw = [1, 0, 0, 0, 0];
function landW(x, z) {
  const k = smooth(-25, 25, outD(x, z));
  _lw[0] = 1 - k; if (k <= 0) { _lw[1] = _lw[2] = _lw[3] = _lw[4] = 0; return _lw; }
  const w = regW(x, z); for (let r = 0; r < 4; r++) _lw[r + 1] = k * w[r];
  return _lw;
}
function landAt(x, z) { if (!inMain(x, z)) return owLandAt(x, z); const L = landW(x, z); let b = 0; for (let r = 1; r < 5; r++) if (L[r] > L[b]) b = r; return b; }
const atSea = (x, z) => z > coastZ(x) + 20 && getHT(x, z) < -1.5;

// ---------- the ground of each land ----------
function hNorth(x, z) {
  // rolling hills under the pines, then the open tundra
  let h = 6 + Noise.fbm(x * 0.0032 + 21, z * 0.0032 - 8, 4) * 10;
  const hl = Math.max(0, Noise.fbm(x * 0.0046 - 7, z * 0.0046 + 33, 3) - 0.08); h += hl * hl * 110;
  return h;
}
function hEast(x, z) {
  // the savanna: wide flat grassland, rocky kopjes standing out of it, and the great mountain with a crater at its top
  let h = 4.2 + Noise.fbm(x * 0.0024 - 5, z * 0.0024 + 12, 3) * 4 + Noise.fbm(x * 0.021, z * 0.021, 2) * 0.5;
  const kp = smooth(0.4, 0.5, Noise.fbm(x * 0.0062 + 50, z * 0.0062 - 21, 3));
  if (kp > 0) h += kp * (4 + Noise.ridge(x * 0.04, z * 0.04, 2) * 7);
  const d = Math.hypot(x - KILI.x, z - KILI.z);
  if (d < KILI.r) { const t = 1 - d / KILI.r, cone = t * t * (3 - 2 * t); h += KILI.h * cone * (0.88 + 0.24 * Noise.fbm(x * 0.012, z * 0.012, 3)) - smooth(0.93, 1, t) * 26; }
  return h;
}
function hWest(x, z) {
  // the desert: long dunes, and flat-topped red mesas with cliffs
  const wx = x + Noise.fbm(x * 0.0017 + 9, z * 0.0017, 2) * 160;
  let h = 5 + Noise.fbm(x * 0.0021 + 61, z * 0.0021, 3) * 4;
  const dk = smooth(-0.15, 0.3, Noise.fbm(x * 0.0019 - 40, z * 0.0019 + 6, 2)), dn = Noise.ridge(wx * 0.0042, z * 0.0105 + 3, 3);
  h += dn * dn * 18 * dk;
  const ms = smooth(0.3, 0.37, Noise.fbm(x * 0.0043 + 40, z * 0.0043 + 12, 3)) * (1 - dk * 0.6);
  h += ms * (22 + Noise.fbm(x * 0.05, z * 0.05, 2) * 1.5);
  return h;
}
function hSouth(x, z) {
  // the coast: a low green plain down to the beaches
  return 3.4 + Noise.fbm(x * 0.0031 + 8, z * 0.0031 + 55, 3) * 3.6 + Noise.fbm(x * 0.017, z * 0.017, 2) * 0.7;
}
function outerH(x, z) {
  const ax = Math.abs(x), dm = outD(x, z), w = regW(x, z), bd = _rwd;
  let h = 0;
  if (w[0] > 0.002) h += w[0] * hNorth(x, z);
  if (w[1] > 0.002) h += w[1] * hEast(x, z);
  if (w[2] > 0.002) h += w[2] * hWest(x, z);
  if (w[3] > 0.002) h += w[3] * hSouth(x, z);
  // ridges between the north and the lands east and west of it, with a saddle half way along
  if (z < -MID + 60) {
    const rk = smooth(95, 0, Math.abs(bd)) * smooth(-20, 70, dm), gap = smooth(80, 0, Math.abs((ax - z) * 0.5 - 1150));
    if (rk > 0) h += rk * (38 + Noise.ridge(x * 0.009 + 4, z * 0.009 - 2, 3) * 70) * (1 - 0.85 * gap);
  }
  // the far mountains along the edge of the world (the south is open sea)
  const cz = coastZ(x), sea = smooth(cz - 30, cz + 80, z);
  const ek = Math.max(smooth(1230, 1470, ax), smooth(1230, 1470, -z)) * (1 - sea);
  if (ek > 0) h += ek * ek * (70 + Noise.ridge(x * 0.0058 + 3, z * 0.0058 - 7, 4) * 150);
  // the sea: the land goes down under the water, deeper and deeper
  if (sea > 0) h = lerp(h, -1.2 - Math.min(26, Math.max(0, z - cz) * 0.085) + Noise.fbm(x * 0.01, z * 0.01, 2) * 1.2, sea);
  // islands, each on a shallow shelf
  for (const I of ISLES) {
    const d = Math.hypot(x - I.x, z - I.z); if (d > I.r + 95) continue;
    const e = smooth(I.r + 75, I.r * 0.35, d + Noise.fbm(x * 0.012 + I.x * 0.01, z * 0.012, 2) * 30);
    if (e > 0) h = Math.max(h, lerp(-6, I.h * (0.75 + 0.35 * Noise.fbm(x * 0.02, z * 0.02, 2)), e));
  }
  // right outside the jungle: its mountains, going down into the new land
  if (dm < 150) h = lerp(rawH(x, z, true), h, smooth(0, 150, dm));
  return h;
}
// the lowest wide ground near a place
function flatLow(cx, cz, R) {
  let best = { x: cx, z: cz }, bs = 1e9;
  for (let dz = -R; dz <= R; dz += 10) for (let dx = -R; dx <= R; dx += 10) {
    const x = cx + dx, z = cz + dz; let s = getH(x, z) * 2;
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; s += getH(x + Math.cos(a) * 40, z + Math.sin(a) * 40); }
    s += Math.hypot(dx, dz) * 0.03; if (s < bs) { bs = s; best = { x, z }; }
  }
  return best;
}
// a way through the mountains: a flat floor between steep sides, from the jungle's floor to the new land's
function carvePass(ax, az, bx, bz, n) {
  const P = makePath(ax, az, bx, bz, 6, 26, ax * 0.0131 + bz * 0.0173 + 5), L = P.length - 1;
  const hA = getH(ax, az), hB = getH(bx, bz);
  forGrid(polyBBox(P, 95), (i, x, z) => {
    const r = nearestOnPoly(x, z, P), d = r[0]; if (d > 90) return;
    const t = r[1] / L, fl = lerp(hA, hB, t * t * (3 - 2 * t)) + Math.sin(Math.PI * t) * 8 + 0.3;
    const nh = lerp(fl, HM[i], Math.max(smooth(15, 85, d), smooth(40, 12, STREAMD[i]))); if (nh < HM[i]) HM[i] = nh;
  });
  const m = P[Math.round(L * 0.55)];
  return { P, x: m.x, z: m.z, n, a: { x: ax, z: az }, b: { x: bx, z: bz } };
}
// the great river runs on to the sea, in a wide green valley through the mountains
function riverToSea() {
  const last = RIVER[RIVER.length - 1], n0 = RIVER.length, cz = coastZ(0);
  const ext = catmull([[last.x, last.z], [-16, 960], [14, 1040], [0, cz + 30], [-6, cz + 170]], 4).slice(1)
    .map((p, k) => ({ x: p.x, z: p.z, w: (19 + 7 * Noise.n2((n0 + k) * 0.025, 5.5)) * (1 + 1.5 * smooth(cz - 150, cz + 30, p.z)) }));
  RIVER = RIVER.concat(ext);
  const P = RIVER, V = P.filter(p => p.z > 540);
  forGrid(polyBBox(V, 160), (i, x, z) => {
    if (z < 560) return;
    const r = nearestOnPoly(x, z, P), d = r[0], hw = P[Math.min(P.length - 1, Math.round(r[1]))].w / 2;
    if (d > hw + 150) return;
    let h = HM[i];
    const floor = lerp(13, 2.2, smooth(600, 780, z)) + smooth(hw + 50, hw + 90, d) * 2.5;
    h = Math.min(h, lerp(floor, h, Math.max(smooth(hw + 60, hw + 150, d), d > hw + 30 ? smooth(40, 12, STREAMD[i]) : 0)));
    if (z > MID - 1 || Math.abs(x) > MID - 1) h = carveRiverAt(h, x, z, P);
    HM[i] = h;
  });
  OUTW.mouth = { x: 0, z: cz };
  // the jungle's brook that ran off the edge of the old world runs on into the river
  const b = STREAMS.find(q => { const e = q.path[q.path.length - 1]; return e.z > MID - 25 && e.x > 60; });
  if (b) { const e = b.path[b.path.length - 1], j = nearestOnPoly(e.x, e.z, P), q = P[Math.min(P.length - 1, Math.round(j[1]))]; STREAMS.push(makeStream(e.x, e.z, q.x + 8, q.z, b.hw, 27.7, 12)); }
}
// the forest of the new lands: pines in the north (thinning out to the tundra), palm groves on the coast
function forestOut(i, x, z) {
  const h = HM[i], ny = NY[i]; if (h < 0.4 || ny < 0.6) return 0;
  const w = regW(x, z); let f = 0;
  if (w[0] > 0.01) f += w[0] * smooth(-0.38, 0.02, Noise.fbm(x * 0.0062 + 9, z * 0.0062 + 3, 3)) * smooth(-1330, -980, z) * (1 - smooth(70, 120, h));
  if (w[1] > 0.01) f += w[1] * smooth(16, 4, STREAMD[i]) * 0.5;
  if (w[3] > 0.01) f += w[3] * smooth(-0.25, 0.2, Noise.fbm(x * 0.007 - 3, z * 0.007 + 17, 3)) * 0.75 * smooth(1.2, 3, h) * (1 - smooth(40, 80, h));
  if (STREAMD[i] < 5) f *= 0.3;
  return f * smooth(0.6, 0.8, ny);
}
function worldOuter() {
  // the jungle as it is now, kept aside: its forest, its tribes and everything in it are found again exactly where they were
  WORLD1.S = gridSnap(MID); WORLD1.river = RIVER.slice(); WORLD1.wg = WG.near;
  // 1. the lands beyond the mountains
  for (let iz = 0; iz < W.V; iz++) {
    const z = gx(iz), inZ = iz >= MI0 && iz <= MI1;
    for (let ix = 0; ix < W.V; ix++) { if (inZ && ix >= MI0 && ix <= MI1) continue; const i = iz * W.V + ix; HM[i] = outerH(gx(ix), z); WSURF[i] = -999; STREAMD[i] = 999; }
  }
  // 2. the river to the sea; 3. ways through the jungle's mountains to the north, the east and the west
  riverToSea();
  for (const [ax, az, bx, bz, n] of [[-80, -575, -70, -1000, 'מעבר הצפון'], [590, -95, 1000, -80, 'מעבר המזרח'], [-575, -120, -1000, -140, 'מעבר המערב']]) OUTW.passes.push(carvePass(ax, az, bx, bz, n));
  // 4. water: a frozen lake and a cold lake in the north, waterholes in the savanna, an oasis in the desert
  { const c = flatLow(280, -1130, 90), R = 105; OUTW.ice = { x: c.x, z: c.z, r: R };
    forGrid([c.x - R - 50, c.x + R + 50, c.z - R - 50, c.z + R + 50], (i, x, z) => {
      const d = Math.hypot(x - c.x, z - c.z) + Noise.n2(x * 0.03, z * 0.03) * 7;
      if (d < R) HM[i] = 0.12; else if (d < R + 45) HM[i] = Math.min(HM[i], lerp(0.12, HM[i], smooth(R, R + 45, d)));
    }); }
  { const c = flatLow(-520, -1030, 80); OUTW.cold = { x: c.x, z: c.z, r: 46 }; carveDisk(c.x, c.z, 46, 5, 26); }
  for (const [cx, cz, r] of [[960, -420, 30], [1010, 640, 34]]) { const c = flatLow(cx, cz, 60); OUTW.holes.push({ x: c.x, z: c.z, r }); carveDisk(c.x, c.z, r, 2.4, 18); }
  { const c = flatLow(-1060, 150, 110); OUTW.oasis = { x: c.x, z: c.z, r: 24 }; carveDisk(c.x, c.z, 24, 2.2, 14); }
  // brooks: from the far northern mountains into the lakes, from the great mountain to the waterholes, from the jungle's mountains to the sea
  const I = OUTW.ice, C = OUTW.cold, H1 = OUTW.holes[0], H2 = OUTW.holes[1];
  STREAMS.push(makeStream(-700, -1395, C.x, C.z, 3.2, 21.3, 30));
  STREAMS.push(makeStream(560, -1400, I.x, I.z, 3, 22.9, 26));
  STREAMS.push(makeStream(1010, 130, H1.x, H1.z, 2.8, 23.7, 34));
  STREAMS.push(makeStream(1120, 540, H2.x, H2.z, 2.6, 24.1, 20));
  STREAMS.push(makeStream(-460, 800, -470, coastZ(-470) + 30, 3, 25.5, 28));
  STREAMS.push(makeStream(540, 805, 560, coastZ(560) + 30, 3, 26.2, 24));
  // 5. light and forest for the new lands
  for (let iz = 0; iz < W.V; iz++) for (let ix = 0; ix < W.V; ix++) {
    const i = iz * W.V + ix;
    const hl = HM[iz * W.V + Math.max(0, ix - 1)], hr = HM[iz * W.V + Math.min(W.N, ix + 1)];
    const hd = HM[Math.max(0, iz - 1) * W.V + ix], hu = HM[Math.min(W.N, iz + 1) * W.V + ix];
    const nx = (hl - hr) / (2 * W.cell), nz = (hd - hu) / (2 * W.cell);
    NY[i] = 1 / Math.sqrt(nx * nx + nz * nz + 1);
  }
  for (let iz = 0; iz < W.V; iz++) {
    const z = gx(iz), inZ = iz >= MI0 && iz <= MI1;
    for (let ix = 0; ix < W.V; ix++) { if (inZ && ix >= MI0 && ix <= MI1) continue; const i = iz * W.V + ix; FOREST[i] = forestOut(i, gx(ix), z); }
  }
  // 6. where the jungle itself was changed (the ways through its mountains, the river valley): new plants grow there
  const S = WORLD1.S, A = S.A, b2 = WORLD1.band = new Uint8Array(NV);
  for (let r = 0; r < S.n; r++) for (let c = 0; c < S.n; c++) {
    const i = (S.i0 + r) * W.V + S.i0 + c, j = r * S.n + c;
    if (Math.abs(HM[i] - A.HM[j]) > 0.02 || (WSURF[i] > HM[i]) !== (A.WS[j] > A.HM[j]) || Math.abs(FOREST[i] - A.FO[j]) > 0.02 || Math.abs(STREAMD[i] - A.SD[j]) > 0.01) b2[i] = 3;
  }
  // and two rings around them (a plant stands on the ground of three points of the grid)
  for (let k = 0; k < 2; k++) for (let iz = MI0 + 1; iz < MI1; iz++) for (let ix = MI0 + 1; ix < MI1; ix++) {
    const i = iz * W.V + ix, want = 3 - k; if (b2[i]) continue;
    if (b2[i - 1] === want || b2[i + 1] === want || b2[i - W.V] === want || b2[i + W.V] === want) b2[i] = want - 1;
  }
  for (let i = 0; i < NV; i++) if (b2[i]) b2[i] = 1;
  // 7. the colour of the water: the jungle's is brown-green, the north's and the oasis' clear, the sea blue
  WBLUE = new Uint8Array(NV); TCOL = new Uint8Array(NV * 3);
  for (let iz = 0; iz < W.V; iz++) for (let ix = 0; ix < W.V; ix++) {
    const x = gx(ix), z = gx(iz); if (outD(x, z) < -30) continue;
    const L = landW(x, z), sea = smooth(coastZ(x) - 250, coastZ(x) - 60, z);
    WBLUE[iz * W.V + ix] = clamp(L[1] * 0.85 + L[2] * 0.3 + L[3] * 0.75 + L[4] * (0.55 + 0.45 * sea), 0, 1) * 255;
  }
  // 8. names on the map
  POI.push({ x: -40, z: -1220, n: 'הצפון הקפוא' }, { x: 1050, z: -170, n: 'הסוואנה' }, { x: -1110, z: -330, n: 'המדבר הגדול' }, { x: -300, z: 960, n: 'חוף הים' },
    { x: 0, z: 1330, n: 'הים הגדול' }, { x: KILI.x, z: KILI.z, n: 'ההר הלבן' }, { x: I.x, z: I.z, n: 'האגם הקפוא' }, { x: C.x, z: C.z, n: 'אגם הדובים' },
    { x: H1.x, z: H1.z, n: 'בור המים' }, { x: H2.x, z: H2.z, n: 'בור הפילים' }, { x: OUTW.oasis.x, z: OUTW.oasis.z, n: 'נווה המדבר' }, { x: OUTW.mouth.x + 40, z: OUTW.mouth.z - 30, n: 'שפך הנהר' });
  for (const Q of ISLES) POI.push({ x: Q.x, z: Q.z, n: Q.n });
  for (const p of OUTW.passes) POI.push({ x: p.x, z: p.z, n: p.n });
}
// the jungle as it was before the lands around it were made comes back for a moment (to find its tribes and its plants)
function worldMid(on) {
  if (!WORLD1.S || WORLD1.on === on) return;
  gridSwap(WORLD1.S);
  const r = RIVER; RIVER = WORLD1.river; WORLD1.river = r;
  const g = WG.near; WG.near = WORLD1.wg; WORLD1.wg = g;
  WORLD1.on = on;
}

// ---------- the colours of the lands ----------
const RCOL = {
  taiga: col('#475236'), tundra: col('#7f7a5a'), snow: col('#eef3f6'), ice: col('#c4dde6'), rockN: col('#6e7075'),
  sav: col('#a99d60'), savD: col('#8c814e'), savG: col('#7f8c4a'), soil: col('#8f6a48'), rockE: col('#857565'), lava: col('#5b4d44'),
  sand: col('#dcc08a'), sandD: col('#c9a46a'), mesa: col('#a8633f'), mesaD: col('#7c4430'), oasis: col('#5d7a2e'),
  coast: col('#5f7f34'), beach: col('#e6d6a6'), wet: col('#b8a67a'), seabed: col('#cdbb8c')
};
const _lc = new THREE.Color(), _lc2 = new THREE.Color();
function landTint(out, i, x, z, h, ny, n1, n2) {
  const w = regW(x, z), steep = smooth(0.78, 0.55, ny), fo = FOREST[i], sd = STREAMD[i];
  out.setRGB(0, 0, 0);
  const mnt = smooth(30, 75, h), pn = Noise.fbm(x * 0.008 + 3, z * 0.008 - 5, 2);
  if (w[0] > 0.001) {
    const far = smooth(-980, -1280, z), sl = lerp(115, 30, smooth(-850, -1300, z));
    const snow = clamp(far * (0.75 + pn * 1.1) + smooth(sl - 25, sl + 15, h) + far * smooth(0.3, 0.9, n2) * 0.2, 0, 1);
    _lc2.copy(RCOL.taiga).lerp(RCOL.tundra, clamp(far * 0.7 + (1 - fo) * 0.35, 0, 1)).lerp(RCOL.rockN, clamp(mnt * 0.7 + steep, 0, 1)).lerp(RCOL.snow, snow * (1 - steep * 0.55));
    const I = OUTW.ice; if (I && h < 0.3 && Math.hypot(x - I.x, z - I.z) < I.r + 8) _lc2.copy(RCOL.ice).lerp(RCOL.snow, clamp(n2 * 0.5 + 0.2, 0, 0.6));
    out.add(_lc2.multiplyScalar(w[0]));
  }
  if (w[1] > 0.001) {
    _lc2.copy(RCOL.sav).lerp(RCOL.savD, clamp(0.5 + n1, 0, 1) * 0.6).lerp(RCOL.soil, smooth(0.25, 0.55, pn) * 0.45).lerp(RCOL.savG, clamp(smooth(16, 4, sd) * 0.7 + fo * 0.6, 0, 1));
    const kd = Math.hypot(x - KILI.x, z - KILI.z);
    _lc2.lerp(RCOL.rockE, clamp(mnt * 0.85 + steep * 0.9, 0, 1));
    if (kd < KILI.r) _lc2.lerp(RCOL.lava, smooth(KILI.r * 0.75, KILI.r * 0.35, kd) * 0.6);
    _lc2.lerp(RCOL.snow, smooth(128, 158, h + n2 * 8) * (1 - steep * 0.4));
    out.add(_lc2.multiplyScalar(w[1]));
  }
  if (w[2] > 0.001) {
    _lc2.copy(RCOL.sand).lerp(RCOL.sandD, clamp(0.5 + n1 * 1.2, 0, 1)).lerp(RCOL.mesa, clamp(smooth(15, 24, h) * 0.75 + steep * 0.7 + mnt * 0.5, 0, 1)).lerp(RCOL.mesaD, clamp(steep * 0.45 + mnt * 0.3, 0, 1));
    const O = OUTW.oasis; if (O) { const d = Math.hypot(x - O.x, z - O.z); if (d < O.r + 45) _lc2.lerp(RCOL.oasis, smooth(O.r + 45, O.r + 6, d) * 0.85); }
    out.add(_lc2.multiplyScalar(w[2]));
  }
  if (w[3] > 0.001) {
    _lc2.copy(RCOL.coast).lerp(RCOL.savG, clamp(0.4 + n1, 0, 1) * 0.3).lerp(RCOL.rockN, clamp(steep * 0.8 + mnt * 0.5, 0, 1));
    out.add(_lc2.multiplyScalar(w[3]));
  }
  // beaches along the sea, and the sea's sandy floor
  const sea = smooth(coastZ(x) - 230, coastZ(x) - 110, z);
  if (sea > 0) { out.lerp(RCOL.beach, smooth(2.1, 0.9, h + n2 * 0.3) * sea); if (h < 0.35) out.lerp(h < -0.3 ? RCOL.seabed : RCOL.wet, sea); }
  return out;
}
function regionColor(c, i, x, z, h, ny, n1, n2) {
  const k = smooth(-45, 30, outD(x, z) + n2 * 12); if (k <= 0) return;
  c.lerp(landTint(_lc, i, x, z, h, ny, n1, n2), k);
}
// the map in the colours of each land (the jungle's own stay as they were)
function mapTint(x, z, h, w, r, g, b) {
  const k = smooth(-45, 30, outD(x, z)); if (k <= 0) return [r, g, b];
  mapBl(x, z);   // between the grid's points: smooth colours from close by
  if (w > -900 && w > h + 0.02) {
    const dep = clamp((w - h) / 14, 0, 1), bl = WBLUE ? mapBg(WBLUE) / 255 : 0;
    return [lerp(r, lerp(70, 16, dep), k * bl), lerp(g, lerp(150, 70, dep), k * bl), lerp(b, lerp(168, 128, dep), k * bl)];
  }
  const hx = getH(x + 2, z) - getH(x - 2, z), hz = getH(x, z + 2) - getH(x, z - 2), sh = clamp(1 + (-hx * 0.7 - hz * 0.45) * 0.1, 0.55, 1.45);
  const f = clamp(mapBg(FOREST), 0, 1) * 0.35;
  return [lerp(r, mapBg(TCOL, 3, 0) * sh * (1 - f), k), lerp(g, mapBg(TCOL, 3, 1) * sh * (1 - f * 0.6), k), lerp(b, mapBg(TCOL, 3, 2) * sh * (1 - f), k)];
}
// a grid between its points: the four points around a place and how much each counts
const _bl = { i: 0, a: 1, b: 0, c: 0, d: 0 };
function mapBl(x, z) {
  const fx = (x + W.half) / W.cell, fz = (z + W.half) / W.cell, ix = clamp(Math.floor(fx), 0, W.N - 1), iz = clamp(Math.floor(fz), 0, W.N - 1), tx = clamp(fx - ix, 0, 1), tz = clamp(fz - iz, 0, 1);
  _bl.i = iz * W.V + ix; _bl.a = (1 - tx) * (1 - tz); _bl.b = tx * (1 - tz); _bl.c = (1 - tx) * tz; _bl.d = tx * tz; return _bl;
}
function mapBg(A, s, o) {
  const i = _bl.i, V = W.V; s = s || 1; o = o || 0;
  return A[i * s + o] * _bl.a + A[(i + 1) * s + o] * _bl.b + A[(i + V) * s + o] * _bl.c + A[(i + V + 1) * s + o] * _bl.d;
}

// ---------- the plants of the new lands ----------
function atlasMore(c, reg) {
  const r = mulberry32(8811), R = (a, b) => a + (b - a) * r(), P = a => a[Math.floor(r() * a.length)];
  // a branch of a pine: needles all along a twig pointing out to its tip (the base at the bottom), with or without snow
  const branch = (x0, y0, snow) => {
    c.save(); c.beginPath(); c.rect(x0, y0, 256, 256); c.clip();
    const cx = x0 + 128;
    for (let t = 0.02; t < 0.99; t += 0.011) {
      const y = y0 + 252 - t * 248, L = 96 * Math.sin(Math.PI * Math.min(1, t * 0.88 + 0.12)) * (1 - t * 0.3);
      for (const s of [-1, 1]) for (let k = 0; k < 2; k++) {
        const len = L * R(0.5, 1), a = s * R(0.55, 1.2);
        c.strokeStyle = P(['#3b6436', '#467342', '#33592f', '#4f7d46', '#3d6a39']); c.lineWidth = R(1.6, 3);
        c.beginPath(); c.moveTo(cx + R(-3, 3), y); c.lineTo(cx + Math.sin(a) * len, y - Math.cos(a) * len * 0.5 - R(0, 12)); c.stroke();
      }
    }
    c.strokeStyle = '#5a4630'; c.lineWidth = 4; c.beginPath(); c.moveTo(cx, y0 + 256); c.lineTo(cx, y0 + 8); c.stroke();
    if (snow) for (let i = 0; i < 90; i++) {
      const t = r(), y = y0 + 248 - t * 236, sp = 80 * Math.sin(Math.PI * Math.min(1, t * 0.88 + 0.12));
      c.fillStyle = `rgba(246,249,252,${R(0.75, 0.98)})`; c.beginPath(); c.ellipse(cx + R(-sp, sp), y, R(6, 16), R(3, 7), R(-0.3, 0.3), 0, TAU); c.fill();
    }
    c.restore();
  };
  branch(768, 512, false); reg('needle', 768, 512, 256, 256);
  branch(512, 768, true); reg('sneedle', 512, 768, 256, 256);
  // dry golden grass with seed heads
  c.save(); c.beginPath(); c.rect(0, 768, 256, 256); c.clip();
  for (let i = 0; i < 85; i++) {
    const x = R(12, 244), h = R(110, 240), lean = R(-40, 40);
    c.strokeStyle = P(['#c8a55a', '#d9bb6b', '#b08d48', '#e3cd85', '#a48a4a']); c.lineWidth = R(2, 4);
    c.beginPath(); c.moveTo(x, 1024); c.quadraticCurveTo(x + lean * 0.3, 1024 - h * 0.6, x + lean, 1024 - h); c.stroke();
    if (r() < 0.35) { c.fillStyle = P(['#e8d49a', '#cfae6a', '#f0e2b0']); c.beginPath(); c.ellipse(x + lean, 1024 - h - 6, 3, 11, lean * 0.012, 0, TAU); c.fill(); }
  }
  c.restore(); reg('dgrass', 0, 768, 256, 256);
  // the fine leaves of an acacia: tiny leaflets in feathery sprays
  c.save(); c.beginPath(); c.rect(256, 768, 256, 256); c.clip();
  for (let i = 0; i < 46; i++) {
    const x = R(280, 488), y = R(790, 1000), a = r() * TAU, L = R(26, 46);
    c.strokeStyle = '#4b5a28'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); c.stroke();
    for (let k = 0.1; k < 1; k += 0.1) for (const s of [-1, 1]) {
      const px = x + Math.cos(a) * L * k, py = y + Math.sin(a) * L * k, b = a + s * 1.2;
      c.fillStyle = P(['#6b7d34', '#7e8f3e', '#58692c', '#8a9a48']); c.beginPath(); c.ellipse(px + Math.cos(b) * 4, py + Math.sin(b) * 4, 4.2, 1.7, b, 0, TAU); c.fill();
    }
  }
  c.restore(); reg('acacia', 256, 768, 256, 256);
}
function bPine(v, snow) {
  const r = mulberry32(910 + v * 7 + (snow ? 3 : 0)), R = (a, b) => a + (b - a) * r();
  const near = new VB(), far = new VB(), H = R(13, 19), tr = R(0.3, 0.4), barkC = col('#8a6a52');
  near.geo(new THREE.CylinderGeometry(tr * 0.25, tr, H, 7, 3, true), M([0, H / 2, 0]), AT.bark, barkC, 0.4);
  far.geo(new THREE.CylinderGeometry(tr * 0.25, tr, H * 0.5, 4, 1, true), M([0, H * 0.25, 0]), AT.bark, barkC, 0.4);
  const tiers = 7, base = H * 0.2, gA = col(['#2f5a32', '#355f33', '#2c5230'][v % 3]), gB = col('#4d7a45'), white = col('#eef3f6');
  for (let k = 0; k < tiers; k++) {
    const t = k / (tiers - 1), y = base + (H - base) * t, rad = lerp(3.7, 0.75, Math.pow(t, 0.85)) * R(0.9, 1.1), hh = lerp(3.4, 1.7, t), ph = R(0, TAU);
    // a tier of branches: a cone with a ragged, drooping edge, lighter towards its tips
    const g = new THREE.ConeGeometry(rad, hh, 12, 2, false), p = g.attributes.position;
    for (let q = 0; q < p.count; q++) {
      const x = p.getX(q), yy = p.getY(q), z = p.getZ(q), r0 = Math.hypot(x, z); if (r0 < 1e-4) continue;
      const jag = 1 + 0.2 * Math.sin(Math.atan2(z, x) * 6 + ph) * (r0 / rad);
      p.setX(q, x * jag); p.setZ(q, z * jag); p.setY(q, yy - Math.pow(r0 / rad, 2) * hh * 0.25);
    }
    g.computeVertexNormals();
    const cy = y + hh * 0.35;
    const cf = (pp, nn) => { const up = clamp((pp.y - (cy - hh * 0.5)) / hh, 0, 1), c = mixC(gA, gB, up * 0.6); return snow && nn.y > 0.3 && up > 0.25 ? mixC(c, white, 0.85) : c; };
    near.geo(g, M([0, cy, 0]), AT.solid, cf, 1);
    if (k % 2 === 0 || k === tiers - 1) far.geo(new THREE.ConeGeometry(rad * 0.95, hh * 1.25, 6, 1, false), M([0, cy, 0]), AT.solid, snow ? mixC(gA, white, 0.5) : gA, 1);
    // and branches of needles hanging from it
    const nb = Math.max(3, Math.round(7 - t * 4));
    for (let b = 0; b < nb; b++) near.frond(new V3(0, y + hh * 0.15, 0), b / nb * TAU + ph, R(-0.1, 0.15), rad * R(0.85, 1.0), rad * 0.9, R(0.6, 1.0), snow ? AT.sneedle : AT.needle, WHITE, 3, 1);
  }
  return { near: near.build(), far: far.build(), trunk: tr };
}
function bBirch(v) {
  const r = mulberry32(960 + v), R = (a, b) => a + (b - a) * r();
  const near = new VB(), far = new VB(), H = R(9, 13), tr = 0.2, barkC = col('#ece8df'), leafC = col(['#6e9a3c', '#7fa646'][v % 2]);
  near.geo(new THREE.CylinderGeometry(tr * 0.5, tr, H, 6, 3, true), M([0, H / 2, 0]), AT.bark, barkC, 0.5);
  far.geo(new THREE.CylinderGeometry(tr * 0.5, tr, H, 4, 1, true), M([0, H / 2, 0]), AT.bark, barkC, 0.5);
  const cc = new V3(0, H * 0.78, 0);
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * TAU + R(-0.3, 0.3), p = new V3(Math.cos(a) * R(0.6, 1.3), H * R(0.62, 0.98), Math.sin(a) * R(0.6, 1.3)), s = R(1.3, 1.9);
    addLimb(near, new V3(0, p.y - 1.4, 0), p, 0.08, 0.04, barkC, 4);
    leafBall(near, p, s, leafC, 5, R, cc); if (i % 2 === 0) leafBall(far, p, s * 1.25, leafC, 0, R, cc, true);
  }
  return { near: near.build(), far: far.build(), trunk: tr };
}
function bAcacia(v) {
  const r = mulberry32(980 + v), R = (a, b) => a + (b - a) * r();
  const near = new VB(), far = new VB(), H = R(5.5, 7.5), tr = R(0.24, 0.32), barkC = col('#5e5246'), leafC = col(['#5f6f2c', '#6b7a33'][v % 2]);
  const top = new V3(R(-0.3, 0.3), H * 0.45, R(-0.3, 0.3));
  addLimb(near, new V3(0, 0, 0), top, tr, tr * 0.8, barkC, 7); addLimb(far, new V3(0, 0, 0), top, tr, tr * 0.8, barkC, 4);
  const nb = 3 + (v % 2), pads = [];
  for (let i = 0; i < nb; i++) {
    const a = i / nb * TAU + R(-0.4, 0.4), L = R(2.6, 3.8), e = new V3(top.x + Math.cos(a) * L, H + R(-0.4, 0.5), top.z + Math.sin(a) * L);
    addLimb(near, top, e, tr * 0.6, tr * 0.3, barkC, 5); addLimb(far, top, e, tr * 0.6, tr * 0.3, barkC, 3);
    pads.push(e);
  }
  pads.push(new V3(top.x, H + 0.6, top.z));
  for (const p of pads) {
    const s = R(2.4, 3.2);
    // a flat umbrella of leaves
    near.geo(new THREE.IcosahedronGeometry(s, 1), M([p.x, p.y + 0.3, p.z], [0, R(0, 3), 0], [1, 0.26, 1]), AT.solid, leafC, 1);
    far.geo(new THREE.IcosahedronGeometry(s * 1.05, 0), M([p.x, p.y + 0.3, p.z], [0, R(0, 3), 0], [1, 0.3, 1]), AT.solid, leafC, 1);
    for (let k = 0; k < 7; k++) {
      const q = new V3(p.x + R(-s, s) * 0.8, p.y + 0.3 + R(-0.15, 0.45), p.z + R(-s, s) * 0.8), ang = R(0, TAU);
      near.quad(q, new V3(Math.cos(ang), R(-0.15, 0.15), Math.sin(ang)).normalize(), new V3(-Math.sin(ang), 0.35, Math.cos(ang)).normalize(), s * 1.1, s * 0.9, AT.acacia, WHITE, 1);
    }
  }
  return { near: near.build(), far: far.build(), trunk: tr };
}
function bBaobab(v) {
  const r = mulberry32(990 + v), R = (a, b) => a + (b - a) * r();
  const near = new VB(), far = new VB(), H = R(9, 11.5), barkC = col('#a08d78'), leafC = col('#61742f');
  const g = new THREE.CylinderGeometry(1.05, 1.7, H, 14, 6, true), p = g.attributes.position;
  for (let k = 0; k < p.count; k++) {
    const y = p.getY(k), t = y / H + 0.5, bul = 1 + Math.sin(Math.PI * clamp(t * 1.1, 0, 1)) * 0.18 + Noise.n2(p.getX(k) * 2 + v, y * 0.8) * 0.06;
    p.setX(k, p.getX(k) * bul); p.setZ(k, p.getZ(k) * bul);
  }
  g.computeVertexNormals();
  near.geo(g, M([0, H / 2, 0]), AT.bark, barkC, 0.2);
  far.geo(new THREE.CylinderGeometry(1.1, 1.75, H, 7, 1, true), M([0, H / 2, 0]), AT.bark, barkC, 0.2);
  const top = new V3(0, H, 0);
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * TAU + R(-0.3, 0.3), L = R(2.2, 3.6), e = new V3(Math.cos(a) * L, H + R(0.8, 2.2), Math.sin(a) * L);
    addLimb(near, new V3(Math.cos(a) * 0.6, H - 0.4, Math.sin(a) * 0.6), e, 0.42, 0.16, barkC, 6); addLimb(far, top, e, 0.4, 0.16, barkC, 3);
    if (i % 2 === 0) leafBall(near, e.clone().add(new V3(0, 0.5, 0)), R(0.9, 1.3), leafC, 3, R, top);
  }
  return { near: near.build(), far: far.build(), trunk: 1.6 };
}
function bDryGrass(v) {
  const near = new VB(), w = v ? 1.0 : 1.4, h = v ? 0.7 : 1.35, tint = col(v ? '#cdbd92' : '#ffffff');
  for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI + v * 0.4; near.quad(new V3(0, h / 2, 0), new V3(Math.cos(a), 0, Math.sin(a)), new V3(0, 1, 0), w, h, AT.dgrass, tint, 1); }
  return { near: near.build() };
}
function bShrub(v, leafCs, twigC, n, sz, dry) {
  const r = mulberry32(1010 + v * 13 + n), R = (a, b) => a + (b - a) * r(), near = new VB(), leafC = col(leafCs[v % leafCs.length]), twig = col(twigC);
  const cc = new V3(0, 0.7 * sz, 0);
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + R(-0.4, 0.4); addLimb(near, new V3(0, 0, 0), new V3(Math.cos(a) * R(0.6, 1.1) * sz, R(0.7, 1.3) * sz, Math.sin(a) * R(0.6, 1.1) * sz), 0.05 * sz, 0.02 * sz, twig, 3); }
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU + R(-0.5, 0.5), p = new V3(Math.cos(a) * R(0.3, 0.7) * sz, R(0.7, 1.1) * sz, Math.sin(a) * R(0.3, 0.7) * sz), s = R(0.55, 0.8) * sz;
    leafBall(near, p, s, leafC, 0, R, cc);
    // fine dry leaves, not the jungle's big green ones
    if (!dry) for (let k = 0; k < 3; k++) { const q = p.clone().add(new V3(R(-0.5, 0.5), R(-0.2, 0.5), R(-0.5, 0.5)).multiplyScalar(s)), ang = R(0, TAU);
      near.quad(q, new V3(Math.cos(ang), 0, Math.sin(ang)), new V3(0, 1, 0), s * 1.5, s * 1.3, AT.acacia, WHITE, 1); }
  }
  return { near: near.build() };
}
function bSnowRock(v, top, side) {
  const near = new VB(), g = new THREE.IcosahedronGeometry(1, 2), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    _v.fromBufferAttribute(p, i); const n = 1 + Noise.n2(_v.x * 1.3 + v * 7 + 40, _v.z * 1.3 + _v.y) * 0.24 + Noise.n2(_v.x * 3 + v, _v.y * 3) * 0.08;
    p.setXYZ(i, _v.x * n * 1.25, _v.y * n * 0.8, _v.z * n);
  }
  g.computeVertexNormals();
  const tc = col(top), sc = col(side);
  near.geo(g, M([0, 0.35, 0]), AT.rock, (pp, nn) => nn.y > 0.45 ? tc : sc, 0);
  return { near: near.build(), r: 1.25 };
}
function bDatePalm(v) {
  const r = mulberry32(1060 + v), R = (a, b) => a + (b - a) * r();
  const near = new VB(), far = new VB(), H = R(10, 15), bend = R(0.2, 0.7), barkC = col('#a08a6a');
  let prev = new V3(0, 0, 0); const segs = 7;
  for (let i = 1; i <= segs; i++) {
    const t = i / segs, p = new V3(bend * t * t, H * t, 0);
    addLimb(near, prev, p, 0.3 - t * 0.05, 0.3 - (t + 1 / segs) * 0.05, barkC, 7);
    if (i % 2 === 0) addLimb(far, prev, p, 0.27, 0.2, barkC, 4);
    prev = p;
  }
  const top = prev.clone(), nf = 16;
  for (let i = 0; i < nf; i++) {
    const yaw = i / nf * TAU + R(-0.2, 0.2), el = R(0.25, 1.05), len = R(3.8, 5);
    near.frond(top, yaw, el, len, 1.7, R(0.8, 1.5), AT.palm, col(['#c9d4b0', '#bcc9a4', '#d3dcbc'][i % 3]), 6);
    if (i % 2 === 0) far.frond(top, yaw, el, len, 1.9, 1.1, AT.palm, col('#c4cfa8'), 2);
  }
  for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.4; near.geo(new THREE.IcosahedronGeometry(0.42, 0), M([top.x + Math.cos(a) * 0.55, top.y - 0.9, Math.sin(a) * 0.55], null, [0.8, 1.4, 0.8]), AT.solid, col('#b5651d'), 0.5); }
  return { near: near.build(), far: far.build(), trunk: 0.3 };
}
function bBeachGrass() {
  const near = new VB(), tint = col('#e6e0ae');
  for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI + 0.3; near.quad(new V3(0, 0.45, 0), new V3(Math.cos(a), 0, Math.sin(a)), new V3(0, 1, 0), 1.1, 0.9, AT.grass, tint, 1); }
  return { near: near.build() };
}
// plants per square kilometre in each land: [jungle (the edge of its mountains and the ways through them), north, east, west, south]
const JDENS = { giant: [110, 0, 0, 0, 0], canopy: [5500, 0, 0, 0, 900], under: [3100, 0, 0, 0, 800], palm: [1570, 0, 0, 0, 1900], tfern: [600, 0, 0, 0, 0],
  fern: [19300, 0, 0, 0, 4000], heli: [3100, 0, 0, 0, 600], bush: [8450, 0, 250, 0, 3500], grass: [6000, 0, 0, 0, 5000], reeds: [3900, 700, 600, 500, 2500],
  rock: [1570, 0, 0, 0, 500], log: [460, 300, 0, 0, 150], lily: [630, 0, 250, 400, 250], flower: [2400, 300, 300, 0, 1800] };
function regionVegTypes(T) {
  for (const t of VEG.types) if (JDENS[t.id]) t.dens = JDENS[t.id];
  const far = z => smooth(-880, -1180, z);
  T('pine', [bPine(0, false), bPine(1, false), bPine(2, false)], 0, s => s.h > 0.5 && s.h < 120 && s.ny > 0.7 && s.sd > 3 ? (0.15 + 0.85 * s.fo) * (1 - far(s.z) * 0.75) : 0,
    { near: 115, col: 0.9, shadow: true, sc: [0.75, 1.25], outer: true, tree: true, dens: [0, 3200, 0, 0, 0] });
  T('spine', [bPine(0, true), bPine(1, true)], 0, s => s.h > 0.5 && s.h < 140 && s.ny > 0.7 && s.sd > 3 ? (0.1 + 0.9 * s.fo) * far(s.z) : 0,
    { near: 115, col: 0.9, shadow: true, sc: [0.7, 1.2], outer: true, tree: true, dens: [0, 1800, 0, 0, 0] });
  T('birch', [bBirch(0), bBirch(1)], 0, s => s.h > 0.8 && s.ny > 0.8 && s.sd > 3 ? (0.3 + 0.7 * s.fo) * (1 - far(s.z)) : 0,
    { near: 100, col: 0.9, shadow: true, sc: [0.8, 1.2], outer: true, tree: true, dens: [0, 700, 0, 0, 0] });
  T('tundra', [bShrub(0, ['#7a5a3a', '#6e6a3c', '#8a4e3a'], '#4a3a2a', 3, 0.55), bShrub(1, ['#6e6a3c', '#7a5a3a'], '#4a3a2a', 2, 0.45)], 0, s => s.h > 0.4 && s.ny > 0.65 ? 0.3 + 0.7 * (1 - s.fo) : 0,
    { near: 70, sc: [0.8, 1.3], outer: true, dens: [0, 5000, 0, 0, 0] });
  T('snowrock', [bSnowRock(0, '#f4f7f9', '#a3a4a6'), bSnowRock(1, '#f4f7f9', '#a3a4a6')], 0, s => s.ny < 0.8 || s.h > 60 ? 0.8 : 0.06, { near: 170, col: 1.0, shadow: true, sc: [0.5, 2.6], sink: 0.25, outer: true, dens: [0, 800, 0, 0, 0] });
  T('drock', [bSnowRock(2, '#f0cfa2', '#d09a70'), bSnowRock(3, '#e6d2ae', '#bfa486'), bSnowRock(4, '#d8ccb8', '#a89a88')], 0, s => s.ny < 0.8 || s.h > 40 ? 0.8 : 0.07,
    { near: 170, col: 1.0, shadow: true, sc: [0.5, 2.6], sink: 0.25, outer: true, dens: [0, 0, 650, 950, 0] });
  T('acacia', [bAcacia(0), bAcacia(1)], 0, s => s.h > 0.8 && s.h < 120 && s.ny > 0.8 && s.sd > 4 ? 0.3 + 0.7 * s.fo + 0.4 * smooth(25, 6, s.sd) : 0,
    { near: 150, farD: 420, col: 0.9, shadow: true, sc: [0.8, 1.3], outer: true, tree: true, dens: [0, 0, 380, 50, 110] });
  T('baobab', [bBaobab(0), bBaobab(1)], 0, s => s.h > 1 && s.h < 60 && s.ny > 0.88 && s.sd > 6 ? 1 : 0,
    { near: 180, farD: 520, col: 1.0, shadow: true, sc: [0.85, 1.15], outer: true, tree: true, fixed: true, dens: [0, 0, 30, 0, 8] });
  T('dgrass', [bDryGrass(0), bDryGrass(1)], 0, s => s.h > 0.6 && s.ny > 0.7 ? 1 : 0, { near: 62, sc: [0.8, 1.35], outer: true, dens: [0, 1300, 11000, 900, 0] });
  T('thorn', [bShrub(2, ['#5d6530', '#6a6a35'], '#4f4234', 3, 1), bShrub(3, ['#6a6a35'], '#4f4234', 2, 0.8)], 0, s => s.h > 0.6 && s.ny > 0.7 ? 1 : 0,
    { near: 85, sc: [0.8, 1.4], outer: true, dens: [0, 0, 700, 250, 0] });
  T('dshrub', [bShrub(4, ['#9a9a72', '#8f9068'], '#6a5a48', 3, 0.8, true), bShrub(5, ['#a8a47a'], '#6a5a48', 2, 0.6, true)], 0, s => s.h > 0.5 && s.ny > 0.7 && s.h < 32 ? 1 : 0,
    { near: 85, sc: [0.8, 1.4], outer: true, dens: [0, 0, 0, 480, 0] });
  T('dpalm', [bDatePalm(0), bDatePalm(1)], 0, s => s.h > 0.3 && s.ny > 0.75 ? 1 : 0,
    { near: 130, col: 0.35, shadow: true, sc: [0.85, 1.2], outer: true, tree: true, spots: () => OUTW.oasis ? [{ x: OUTW.oasis.x, z: OUTW.oasis.z, r: OUTW.oasis.r + 42, n: 30 }] : [] });
  T('bgrass', [bBeachGrass()], 0, s => s.h > 0.3 && s.h < 3.2 && s.ny > 0.75 ? 1 : 0, { near: 60, sc: [0.8, 1.3], outer: true, dens: [0, 0, 0, 200, 3000] });
}
// the lands around the jungle: each plant where its land is, as thick as the land likes it
function vegOuter(lists, R) {
  const RR = (a, b) => a + (b - a) * R(), E = JL - 5, M2 = MID + 30, L1 = LIMIT - 5, M0 = MID - 30;
  // each land's own box (they overlap at the corners: each keeps only its own share there)
  const BOX = [null, [-L1, L1, -L1, -M0], [M0, L1, -L1, L1], [-L1, -M0, -L1, L1], [-L1, L1, M0, L1]];
  // the outer edge of the jungle's mountains, beyond the jungle's own plants
  const RIM = [[-M2, M2, -M2, -E], [-M2, M2, E, M2], [E, M2, -E, E], [-M2, -E, -E, E]];
  // the parts of the jungle that changed: in boxes around the ways through its mountains and the river valley
  const b2 = WORLD1.band, PB = [];
  for (const p of OUTW.passes) { const bb = polyBBox(p.P, 95); PB.push([Math.max(bb[0], -E), Math.min(bb[1], E), Math.max(bb[2], -E), Math.min(bb[3], E)]); }
  PB.push([-200, 200, 540, E]);
  VEG.types.forEach((t, ti) => {
    const per = lists[ti], dens = t.dens, small = t.id === 'grass' || t.id === 'flower' || t.id === 'fern' || t.id === 'dgrass' || t.id === 'bgrass';
    const one = (x, z, land) => {
      const s = vegSite(x, z); s.x = x; s.z = z;
      if (t.id !== 'lily' && t.id !== 'reeds' && s.wd > 0) return;
      if (Math.abs(x) > L1 || Math.abs(z) > L1 || nearCamp(x, z, small ? 4.5 : 9)) return;
      const p = land < 0 ? 1 : landW(x, z)[land];
      if (R() > p * t.rule(s) * 0.5) return;
      const vi = Math.floor(R() * t.vars.length), sc = RR(t.sc[0], t.sc[1]);
      const y = t.onWater ? WATER_Y : s.h - (t.sink || 0) * sc, ry = R() * TAU, tilt = t.tree || t.id === 'canopy' || t.id === 'giant' || t.id === 'palm' ? 0 : RR(-0.08, 0.08);
      vegPut(t, per, vi, x, y, z, sc, ry, tilt);
    };
    const area = B => (B[1] - B[0]) * (B[3] - B[2]) / 1e6;
    if (dens) {
      for (let land = 1; land <= 4; land++) { if (!dens[land]) continue; const B = BOX[land], n = Math.round(dens[land] * area(B) * 2); for (let k = 0; k < n; k++) one(RR(B[0], B[1]), RR(B[2], B[3]), land); }
      if (dens[0]) {
        for (const B of RIM) { const n = Math.round(dens[0] * area(B) * 2); for (let k = 0; k < n; k++) one(RR(B[0], B[1]), RR(B[2], B[3]), 0); }
        for (const B of PB) { if (B[0] >= B[1] || B[2] >= B[3]) continue; const n = Math.round(dens[0] * area(B) * 2); for (let k = 0; k < n; k++) { const x = RR(B[0], B[1]), z = RR(B[2], B[3]); if (b2[nearIdx(x, z)]) one(x, z, -1); } }
      }
    }
    if (t.spots) for (const S of t.spots()) for (let k = 0; k < S.n * 4; k++) { const a = R() * TAU, d = Math.sqrt(R()) * S.r; one(S.x + Math.cos(a) * d, S.z + Math.sin(a) * d, -1); }
  });
}
// trees of the new lands can be cut for wood, their bushes cleared
Object.assign(TREE_KIND, { pine: { wood: 7, hits: 4, tr: 0.4 }, spine: { wood: 7, hits: 4, tr: 0.4 }, birch: { wood: 5, hits: 3, tr: 0.25 }, acacia: { wood: 6, hits: 3, tr: 0.32 }, baobab: { wood: 20, hits: 8, tr: 1.6 }, dpalm: { wood: 4, hits: 3, tr: 0.3 } });
for (const k of ['tundra', 'snowrock', 'drock', 'dgrass', 'thorn', 'dshrub', 'bgrass']) UNDER_KIND.add(k);

// ---------- the tribes of the new lands: two in each, where their land is good to live in ----------
const REGION_TRIBES = [
  { tribe: 'שבט הזאב', key: 'wolf', land: 1, at: () => [-430, -960], r: 220 },
  { tribe: 'שבט הקרח', key: 'ice', land: 1, at: () => [OUTW.ice.x + 60, OUTW.ice.z - 170], r: 200 },
  { tribe: 'שבט האריה', key: 'lion', land: 2, at: () => [OUTW.holes[0].x + 40, OUTW.holes[0].z + 60], r: 200 },
  { tribe: 'שבט הבאובב', key: 'baobab', land: 2, at: () => [OUTW.holes[1].x - 60, OUTW.holes[1].z - 40], r: 200 },
  { tribe: 'שבט החולות', key: 'sand', land: 3, at: () => [-1100, -620], r: 260 },
  { tribe: 'שבט הנווה', key: 'oasis', land: 3, at: () => [OUTW.oasis.x + 30, OUTW.oasis.z + 50], r: 110 },
  { tribe: 'שבט הים', key: 'sea', land: 4, at: () => [-400, coastZ(-400) - 120], r: 200 },
  { tribe: 'שבט האלמוגים', key: 'coral', land: 4, at: () => [600, coastZ(600) - 120], r: 200 }
];
function regionCamps() {
  const R = mulberry32(5150), all = HUNT.camps.slice();
  for (const T of REGION_TRIBES) {
    const [cx, cz] = T.at(); let best = null, bs = -1e9;
    for (let t = 0; t < 1500; t++) {
      const a = R() * TAU, d = Math.sqrt(R()) * T.r, x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
      if (Math.abs(x) > LIMIT - 60 || Math.abs(z) > LIMIT - 60 || outD(x, z) < 120 || landAt(x, z) !== T.land || waterDepth(x, z) > 0) continue;
      const h = getH(x, z); if (h < 0.8 || h > 60 || getNY(x, z) < 0.95) continue;
      let ok = true; for (let k = 0; k < 8 && ok; k++) { const b = k / 8 * TAU, px = x + Math.cos(b) * 6, pz = z + Math.sin(b) * 6; if (Math.abs(getH(px, pz) - h) > 1.2 || waterDepth(px, pz) > 0) ok = false; }
      if (!ok || all.some(c => Math.hypot(c.x - x, c.z - z) < 230)) continue;
      if (OUTW.passes.some(p => nearestOnPoly(x, z, p.P)[0] < 40)) continue;
      const wd = waterDist(x, z); if (wd < 10) continue;
      const sc = -Math.abs(Math.min(wd, 90) - 26) * 0.35 - d * 0.02 + R();
      if (sc > bs) { bs = sc; best = { x, z }; }
    }
    if (!best) continue;
    const w = nearestWater(best.x, best.z) || best;
    const c = { x: best.x, z: best.z, y: getH(best.x, best.z), rx: w.x, rz: w.z, hunters: [], flames: [], glow: null, tribe: T.tribe, key: T.key, fresh: true, land: T.land };
    HUNT.camps.push(c); all.push(c); POI.push({ x: c.x, z: c.z, n: c.tribe, camp: true });
  }
}
// ================= ANIMALS FROM ALL OVER THE WORLD: every land around the jungle has its own =================
// The savanna: lions, elephants, giraffes, zebras, gazelles, rhinos and hyenas. The desert: camels, oryx, fennec foxes and
// horned vipers. The frozen north: polar and brown bears, wolves, reindeer, arctic foxes and moose. The sea: dolphins,
// sharks, whales, reef fish, sea turtles, crabs on the beach and gulls over it. Each is born in its own land and stays there.
const MANEATER = new Set(['jaguar', 'puma', 'caiman', 'anaconda', 'lion', 'polarbear', 'brownbear', 'hyena', 'wolf', 'shark']);
const OPEN_HABS = new Set(['open', 'beach', 'snow']);
// the box an animal of a land lives in (the jungle's own animals keep the jungle's old range)
const landBox = id => { const L = SPECIES[id] && SPECIES[id].land; return L ? LANDBOX[L] : [-WR, WR, -WR, WR]; };
function landPt(id) {
  const L = SPECIES[id] && SPECIES[id].land, B = landBox(id);
  for (let t = 0; t < 30; t++) { const x = rr(B[0], B[1]), z = rr(B[2], B[3]); if (!L || landAt(x, z) === L) return [x, z]; }
  return [rr(B[0], B[1]), rr(B[2], B[3])];
}
// every land's animals are born in their own land
function spawnGroup(id, n, far) {
  const sp = SPECIES[id]; SPAWN_LAND = sp.land || 0;
  if (sp.land) buildLandTpls();
  try { return spawnGroup0(id, n, far); } finally { SPAWN_LAND = 0; }
}
const SP = (id, o) => { SPECIES[id] = o; if (!GUIDE_ORDER.includes(id)) GUIDE_ORDER.push(id); };
// ---------- the savanna ----------
SP('lion', { he: 'אריה', lat: 'Panthera leo', kind: 'quad', ai: 'pred', hp: 210, dmg: 34, walk: 2.2, run: 12.5, swim: 1.6, reach: 2.4, atkCD: 0.8, sense: 46, food: 95, turn: 5.5,
  prey: ['zebra', 'gazelle', 'giraffe', 'oryx', 'camel', 'cow', 'rhino'], count: 1.3, group: [2, 4], hab: 'open', size: [0.95, 1.08], danger: 3, night: 0.5, call: 'jaguar', diet: 'טורף על', land: 2, tpls: ['lion', 'lioness', 'lioness'],
  guide: 'מלך הסוואנה, והחתול היחיד שחי בלהקה. הלביאות צדות יחד ומקיפות את הטרף, והזכר עם הרעמה שומר על השטח ושואג למרחק של קילומטרים.' });
SP('elephant', { he: 'פיל אפריקני', lat: 'Loxodonta africana', kind: 'quad', ai: 'herb', hp: 620, dmg: 46, walk: 1.5, run: 6.8, swim: 1.6, reach: 2.8, atkCD: 1.6, sense: 34, safe: 60, food: 320, turn: 2.4,
  count: 1.1, group: [3, 6], hab: 'open', size: [0.9, 1.08], danger: 2, herd: true, fight: 0.9, diet: 'עלים, עשב וענפים', land: 2,
  guide: 'היונק היבשתי הגדול בעולם. החדק שלו הוא אף ויד יחד: הוא שותה בו, קוטף בו עלים ומרים בו עצים שלמים. עדר פילים מגן על הצעירים ומסתער על כל מי שמאיים עליהם.' });
SP('giraffe', { he: 'ג׳ירפה', lat: 'Giraffa camelopardalis', kind: 'quad', ai: 'herb', hp: 260, dmg: 24, walk: 1.6, run: 10.5, swim: 0.6, reach: 2.2, atkCD: 1.3, sense: 60, safe: 70, food: 210, turn: 3,
  count: 1, group: [2, 4], hab: 'open', size: [0.92, 1.06], danger: 1, herd: true, fight: 0.3, diet: 'עלי שיטה', land: 2,
  guide: 'החיה הגבוהה בעולם, עד שישה מטרים. היא קוטפת עלים מצמרות עצי השיטה בלשון שחורה באורך חצי מטר, ובעיטה שלה יכולה להרוג אריה.' });
SP('zebra', { he: 'זברה', lat: 'Equus quagga', kind: 'quad', ai: 'herb', hp: 120, dmg: 10, walk: 1.7, run: 12, swim: 1.6, reach: 1.4, atkCD: 1.1, sense: 38, safe: 70, food: 100, turn: 4.5,
  count: 3, group: [6, 10], hab: 'open', size: [0.94, 1.06], danger: 0, herd: true, fight: 0.4, diet: 'עשב', land: 2,
  guide: 'קרובת משפחה של הסוס. לכל זברה דוגמת פסים משלה, והפסים של עדר שלם מבלבלים טורף שמנסה לבחור קורבן אחד.' });
SP('gazelle', { he: 'צבי תומסון', lat: 'Eudorcas thomsonii', kind: 'quad', ai: 'herb', hp: 45, dmg: 5, walk: 1.8, run: 15, swim: 1.2, reach: 1, atkCD: 1, sense: 40, safe: 70, food: 35, turn: 8,
  count: 3.2, group: [6, 10], hab: 'open', size: [0.92, 1.08], danger: 0, herd: true, diet: 'עשב', land: 2,
  guide: 'צבי קטן ומהיר להפליא, עם פס שחור לאורך הצד. כשהוא נבהל הוא קופץ באוויר על ארבע רגליים ישרות, כדי להראות לטורף שאין טעם לרדוף אחריו.' });
SP('rhino', { he: 'קרנף לבן', lat: 'Ceratotherium simum', kind: 'quad', ai: 'herb', hp: 460, dmg: 42, walk: 1.3, run: 9, swim: 1.2, reach: 2.1, atkCD: 1.4, sense: 22, safe: 40, food: 230, turn: 3,
  count: 0.7, group: [1, 2], hab: 'open', size: [0.94, 1.06], danger: 2, fight: 0.9, diet: 'עשב', land: 2,
  guide: 'עור עבה כמו שריון ושתי קרניים על האף. הקרנף רואה רע מאוד אבל שומע ומריח מצוין, וכשהוא נבהל הוא מסתער ישר קדימה.' });
SP('hyena', { he: 'צבוע מנומר', lat: 'Crocuta crocuta', kind: 'quad', ai: 'pack', hp: 95, dmg: 16, walk: 2, run: 11, swim: 1.6, reach: 1.4, atkCD: 0.7, sense: 40, safe: 45, food: 40, turn: 7,
  prey: ['gazelle', 'zebra', 'oryx', 'cow'], count: 1.1, group: [3, 5], hab: 'open', size: [0.94, 1.06], danger: 2, night: 0.7, diet: 'טורף ואוכל נבלות', land: 2,
  guide: 'צייד להקות חזק וחכם, ולא רק אוכל נבלות. הצחוק המפורסם שלו הוא בעצם דרך לדבר עם הלהקה, והלסתות שלו שוברות עצמות.' });
// ---------- the desert ----------
SP('camel', { he: 'גמל', lat: 'Camelus dromedarius', kind: 'quad', ai: 'herb', hp: 210, dmg: 12, walk: 1.5, run: 9, swim: 0.8, reach: 1.6, atkCD: 1.2, sense: 34, safe: 55, food: 170, turn: 3.5,
  count: 1.5, group: [3, 6], hab: 'open', size: [0.94, 1.06], danger: 0, herd: true, fight: 0.3, diet: 'קוצים ועשב יבש', land: 3,
  guide: 'ספינת המדבר. הדבשת מלאה בשומן ולא במים: הגמל יכול ללכת שבוע שלם בלי לשתות, ואז לשתות מאה ליטר בבת אחת.' });
SP('oryx', { he: 'ראם', lat: 'Oryx leucoryx', kind: 'quad', ai: 'herb', hp: 110, dmg: 18, walk: 1.6, run: 12, swim: 1, reach: 1.7, atkCD: 1.1, sense: 40, safe: 60, food: 80, turn: 5,
  count: 1.5, group: [4, 7], hab: 'open', size: [0.94, 1.06], danger: 1, herd: true, fight: 0.5, diet: 'עשב יבש', land: 3,
  guide: 'אנטילופה לבנה עם קרניים ארוכות וישרות כמו חניתות. הראם כמעט לא שותה: הוא מקבל את המים מצמחים ומטל הבוקר.' });
SP('fennec', { he: 'שועל מדבר', lat: 'Vulpes zerda', kind: 'quad', ai: 'herb', hp: 18, dmg: 4, walk: 1.8, run: 10, swim: 1, reach: 0.8, atkCD: 0.6, sense: 38, safe: 40, food: 6, turn: 9,
  count: 1, group: [1, 2], hab: 'open', size: [0.9, 1.1], danger: 0, night: 0.9, diet: 'חרקים ומכרסמים', land: 3,
  guide: 'השועל הקטן בעולם. האוזניים הענקיות שלו שומעות חרקים מתחת לחול ומפזרות את חום המדבר.' });
SP('hviper', { he: 'צפע חרטומים', lat: 'Cerastes cerastes', kind: 'snake', ai: 'viper', hp: 12, dmg: 8, walk: 0.6, run: 1.2, swim: 0.6, reach: 1.6, atkCD: 2, sense: 2.4, food: 3, turn: 2,
  count: 0.8, group: [1, 1], hab: 'open', size: [0.9, 1.1], danger: 3, venom: true, diet: 'מכרסמים ולטאות', land: 3,
  guide: 'נחש ארסי בצבע החול, עם שתי קרניים קטנות מעל העיניים. הוא קובר את עצמו בחול ומחכה, ולכן כדאי להסתכל איפה דורכים.' });
// ---------- the frozen north ----------
SP('polarbear', { he: 'דוב קוטב', lat: 'Ursus maritimus', kind: 'quad', ai: 'pred', hp: 430, dmg: 42, walk: 1.8, run: 10.5, swim: 3, reach: 2.4, atkCD: 1.1, sense: 50, food: 210, turn: 4,
  prey: ['reindeer', 'arcticfox', 'turtle'], count: 0.6, group: [1, 1], hab: 'snow', size: [0.94, 1.08], danger: 3, swimmer: true, diet: 'טורף על', land: 1,
  guide: 'הטורף היבשתי הגדול בעולם. הפרווה שלו נראית לבנה, אבל השערות שקופות והעור מתחתיה שחור כדי לאגור את חום השמש.' });
SP('brownbear', { he: 'דוב חום', lat: 'Ursus arctos', kind: 'quad', ai: 'pred', hp: 360, dmg: 38, walk: 1.7, run: 11, swim: 2.2, reach: 2.2, atkCD: 1.1, sense: 44, food: 180, turn: 4,
  prey: ['reindeer', 'arcticfox', 'moose'], count: 0.8, group: [1, 1], hab: 'forest', size: [0.92, 1.08], danger: 3, swimmer: true, diet: 'כל-אוכל', land: 1,
  guide: 'דוב ענק שאוכל כמעט הכל: פירות יער, דגים, שורשים ובשר. לפני החורף הוא אוכל בלי הפסקה, ואז ישן חודשים במאורה.' });
SP('wolf', { he: 'זאב אפור', lat: 'Canis lupus', kind: 'quad', ai: 'pack', hp: 85, dmg: 15, walk: 2.2, run: 12, swim: 2.2, reach: 1.4, atkCD: 0.65, sense: 46, safe: 45, food: 35, turn: 7,
  prey: ['reindeer', 'arcticfox', 'moose'], count: 1.3, group: [4, 6], hab: 'open', size: [0.92, 1.08], danger: 2, night: 0.6, diet: 'טורף להקה', land: 1, tpls: ['wolf', 'wolf2', 'wolf3'],
  guide: 'צייד הלהקה של הצפון. הזאבים מיללים כדי לאסוף את הלהקה, והולכים עשרות קילומטרים בלילה אחד בעקבות עדר.' });
SP('reindeer', { he: 'איל הצפון', lat: 'Rangifer tarandus', kind: 'quad', ai: 'herb', hp: 120, dmg: 12, walk: 1.6, run: 11, swim: 2.4, reach: 1.5, atkCD: 1, sense: 40, safe: 65, food: 90, turn: 4.5,
  count: 3, group: [6, 10], hab: 'open', size: [0.94, 1.06], danger: 0, herd: true, fight: 0.3, diet: 'חזזיות ועשב', land: 1,
  guide: 'צבי הצפון, שנודד בעדרים ענקיים. גם לנקבות יש קרניים, והפרסות הרחבות שלו הן כמו נעלי שלג שחופרות לחזזיות מתחת לשלג.' });
SP('arcticfox', { he: 'שועל ארקטי', lat: 'Vulpes lagopus', kind: 'quad', ai: 'herb', hp: 20, dmg: 4, walk: 1.8, run: 10, swim: 1.2, reach: 0.8, atkCD: 0.6, sense: 38, safe: 40, food: 7, turn: 9,
  count: 1, group: [1, 2], hab: 'snow', size: [0.9, 1.1], danger: 0, diet: 'מכרסמים ושאריות', land: 1,
  guide: 'שועל קטן עם הפרווה החמה בעולם. בחורף היא לבנה כשלג, ובקיץ היא מחליפה צבע לחום.' });
SP('moose', { he: 'מוס', lat: 'Alces alces', kind: 'quad', ai: 'herb', hp: 380, dmg: 30, walk: 1.5, run: 10, swim: 2.6, reach: 2.1, atkCD: 1.3, sense: 36, safe: 45, food: 260, turn: 3,
  count: 0.9, group: [1, 2], hab: 'forest', size: [0.94, 1.06], danger: 2, fight: 0.6, diet: 'ענפים וצמחי מים', land: 1,
  guide: 'הצבי הגדול בעולם, עם קרניים רחבות כמו כפות ידיים. הוא שוחה מצוין ואפילו צולל כדי לאכול צמחים מקרקעית האגם.' });
// ---------- the sea and the coast ----------
SP('seadolphin', { he: 'דולפין', lat: 'Tursiops truncatus', kind: 'fish', ai: 'dolphin', prey: ['reeffish'], dmg: 15, hp: 150, swim: 5, food: 0, count: 1.1, group: [1, 1], hab: 'deep', size: [0.92, 1.08], danger: 0, diet: 'דגים', land: 4,
  guide: 'יונק ימי חכם מאוד שחי בלהקות ומדבר בשריקות. לכל דולפין יש שריקה משלו, כמו שם.' });
SP('shark', { he: 'כריש לבן', lat: 'Carcharodon carcharias', kind: 'fish', ai: 'shark', prey: ['reeffish', 'turtle'], dmg: 40, hp: 320, swim: 4.5, food: 120, count: 0.7, group: [1, 1], hab: 'deep', size: [0.9, 1.1], danger: 3, diet: 'טורף על', land: 4,
  guide: 'הדג הטורף הגדול בים. הוא מרגיש טיפת דם מקילומטר ותוקף מלמטה במהירות עצומה. מי ששוחה בים הפתוח צריך להיזהר.' });
SP('whale', { he: 'לווייתן גבנון', lat: 'Megaptera novaeangliae', kind: 'fish', ai: 'whale', hp: 3000, swim: 2.4, food: 0, count: 0.35, group: [1, 1], hab: 'deep', size: [0.92, 1.08], danger: 0, diet: 'קריל ודגים קטנים', land: 4,
  guide: 'ענק עדין באורך של חמישה עשר מטר ששר שירים ארוכים מתחת למים. הוא עולה לנשום ומתיז סילון מים גבוה, ולפעמים קופץ כולו מעל המים.' });
SP('reeffish', { he: 'דגי שונית', lat: 'Pomacentridae', kind: 'fish', ai: 'school', hp: 5, dmg: 0, swim: 3.6, food: 8, count: 3.5, group: [8, 8], hab: 'deep', size: [0.85, 1.15], danger: 0, calm: true, diet: 'פלנקטון', land: 4, tpls: ['reeffish', 'reeffish2'],
  guide: 'להקות של דגים צבעוניים שזזות יחד כמו גוף אחד. הצבעים העזים עוזרים להם להכיר זה את זה ומבלבלים טורפים.' });
SP('turtle', { he: 'צב ים', lat: 'Chelonia mydas', kind: 'quad', ai: 'herb', hp: 120, dmg: 6, walk: 0.5, run: 1.3, swim: 2.6, reach: 1, atkCD: 1.5, sense: 20, safe: 30, food: 60, turn: 2,
  count: 1.4, group: [1, 2], hab: 'beach', size: [0.9, 1.1], danger: 0, swimmer: true, waterLover: true, diet: 'אצות ועשב ים', land: 4,
  guide: 'צב ים ירוק שנודד אלפי קילומטרים. הנקבות חוזרות לחוף שבו נולדו כדי להטיל ביצים בחול.' });
SP('crab', { he: 'סרטן חוף', lat: 'Ocypode', kind: 'quad', ai: 'herb', hp: 5, dmg: 2, walk: 1.4, run: 6.5, swim: 1, reach: 0.4, atkCD: 1, sense: 12, safe: 15, food: 3, turn: 10,
  count: 2, group: [2, 4], hab: 'beach', size: [0.85, 1.15], danger: 0, diet: 'שאריות', land: 4,
  guide: 'סרטן מהיר שרץ על החול וחופר מחילות. כשהוא מרגיש סכנה הוא נעלם לתוך החור שלו בשנייה.' });
SP('seagull', { he: 'שחף', lat: 'Larus', kind: 'bird', ai: 'flock', hp: 8, fly: 11, food: 5, count: 2.2, group: [6, 8], hab: 'air', size: [0.95, 1.05], danger: 0, sense: 22, sea: true, diet: 'דגים ושאריות', land: 4,
  guide: 'ציפור ים צווחנית שעפה בלהקות מעל החוף. שחפים חכמים מאוד: הם גונבים אוכל, ומפילים צדפות על סלעים כדי לשבור אותן.' });
// the tribes of the new lands hunt the animals of their land
for (const id of ['zebra', 'gazelle', 'oryx', 'reindeer', 'arcticfox', 'turtle', 'fennec', 'crab']) if (!HUNTER_PREY.includes(id)) HUNTER_PREY.push(id);
PACKN.hyena = 'להקות צבועים'; PACKN.wolf = 'להקות זאבים'; PACKN.zebra = 'עדרי זברות'; PACKN.gazelle = 'עדרי צבאים'; PACKN.elephant = 'עדרי פילים'; PACKN.reindeer = 'עדרי איילים'; PACKN.camel = 'שיירות גמלים'; PACKN.lion = 'להקות אריות';

// ---------- the bodies ----------
const QB = { L: 1, chestR: 0.3, hipR: 0.3, wid: 0.8, legLen: 0.6, legR: 0.06, pawR: 0.07, neckLen: 0.3, neckR: 0.12, neckUp: 0.5, headR: 0.12, snoutLen: 0.15, snoutR: 0.07, ear: 'point', earR: 0.04, tailLen: 0.3, tailR: 0.03, tailN: 2, eyeR: 0.13 };
const Q = o => buildQuad(Object.assign({}, QB, o));
// a limb of horn, antler or tusk from a to b
function hornSeg(k, a, b, r0, r1, bone, color, seg = 6) { const [m, L] = limbM(a, b); k.R.add(new THREE.CylinderGeometry(r1, r0, L, seg), m, bone, color, 0); }
const V = (x, y, z) => new V3(x, y, z);
function buildLandTpls() {
  if (TPL.lion) return;
  buildHorseTpls(); buildBushdogTpl();
  // the lion: a big tawny cat; the male wears a dark mane
  const cat = TPL.jaguar.o;
  const lionBase = { cheeks: true, brow: true, L: 1.08, chestR: 0.3, hipR: 0.27, waist: 0.03, wid: 0.8, legLen: 0.56, legR: 0.07, pawR: 0.09, neckLen: 0.24, neckR: 0.13, neckUp: 0.42, headR: 0.16, snoutLen: 0.08, snoutR: 0.078,
    snoutSquash: 0.75, snoutY: -0.008, noseK: 0.62, headWid: 1.05, headSquash: 0.94, ear: 'round', earR: 0.042, earX: 0.62, earUp: 0.7, earZ: -0.28, tuck: 0.3, htF: 1.15, htB: 0.95, blades: true,
    tailLen: 0.85, tailR: 0.035, tailN: 4, tailTip: 1.4, eyeR: 0.12, eyeDir: cat.eyeDir, teeth: true, c: { fur: '#c9a066', belly: '#e3cfa2', nose: '#5a3b2e', eye: '#b8902a', jaw: '#e8d8b4', snout: '#d8bf8e', tailTip: '#3a2a1a' } };
  TPL.lion = Q(Object.assign({}, lionBase, { extra: k => {
    const mane = col('#6b4423'), mane2 = col('#8a5a2c');
    k.R.add(new THREE.SphereGeometry(1, 16, 12), M([k.cc[0], k.cc[1] - k.hr * 0.12, k.cc[2] - k.hr * 0.5], null, [k.hr * 1.7, k.hr * 1.65, k.hr * 1.25]), k.head, mane, 1);
    const nb = k.R.wp[k.neck]; k.R.add(new THREE.SphereGeometry(1, 14, 10), M([nb.x, nb.y + 0.02, nb.z - 0.02], [0.4, 0, 0], [0.21, 0.26, 0.24]), k.neck, mane2, 1);
  } }));
  TPL.lioness = Q(Object.assign({}, lionBase, { L: 1.0, chestR: 0.26, hipR: 0.24, headR: 0.14, legLen: 0.52, c: Object.assign({}, lionBase.c, { fur: '#c8a26e' }) }));
  // the elephant: ears like fans, a trunk to the ground, tusks
  TPL.elephant = Q({ L: 1.5, chestR: 0.64, hipR: 0.58, wid: 0.82, legLen: 1.25, legR: 0.17, pawR: 0.19, upFrac: 0.5, shoulderK: 1.3, thighK: 1.4, neckLen: 0.22, neckR: 0.42, neckUp: 0.3, headR: 0.42, headWid: 0.9,
    snoutLen: 0.1, snoutR: 0.17, snoutY: -0.08, ear: 'none', tailLen: 0.65, tailR: 0.03, tailN: 2, tailTip: 1.5, eyeR: 0.07, htF: 1.1, htB: 1.0,
    c: { fur: '#857d78', belly: '#766e69', nose: '#6e6661', eye: '#120e0c', jaw: '#6e6661', tailTip: '#2a2622' },
    extra: k => {
      const skin = col('#857d78'), ivory = col('#efe6d0');
      for (const s of [-1, 1]) k.R.add(new THREE.SphereGeometry(1, 14, 10), M([k.cc[0] + s * k.hr * 0.98, k.cc[1] - k.hr * 0.12, k.cc[2] - k.hr * 0.3], [0, s * 0.45, s * 0.12], [0.06, k.hr * 1.2, k.hr * 1.05]), k.head, skin, 1);
      const t0 = V(k.sc[0], k.sc[1], k.sc[2] + k.sl * 0.4), t1 = t0.clone().add(V(0, -0.5, 0.3)), t2 = t1.clone().add(V(0, -0.55, 0.12)), t3 = t2.clone().add(V(0, -0.45, 0.1));
      hornSeg(k, t0, t1, 0.16, 0.12, k.head, skin, 10); hornSeg(k, t1, t2, 0.12, 0.085, k.head, skin, 10); hornSeg(k, t2, t3, 0.085, 0.06, k.head, skin, 10);
      for (const s of [-1, 1]) { const a = V(k.sc[0] + s * 0.16, k.sc[1] - 0.12, k.sc[2] - 0.05), b = a.clone().add(V(s * 0.05, -0.32, 0.38)), c2 = b.clone().add(V(s * 0.03, 0.08, 0.3)); hornSeg(k, a, b, 0.06, 0.05, k.head, ivory); hornSeg(k, b, c2, 0.05, 0.015, k.head, ivory); }
    } });
  // the giraffe: long legs, a neck of two metres, patches, two little horns
  TPL.giraffe = Q({ L: 1.15, chestR: 0.36, hipR: 0.3, wid: 0.72, legLen: 1.6, legR: 0.06, pawR: 0.075, upFrac: 0.5, neckLen: 1.8, neckR: 0.12, neckUp: 1.18, neckWid: 0.78, headR: 0.13, headWid: 0.8,
    snoutLen: 0.3, snoutR: 0.075, snoutSquash: 0.9, ear: 'point', earR: 0.05, earUp: 0.75, tailLen: 0.8, tailR: 0.02, tailN: 3, tailTip: 1, htF: 1.3, htB: 0.85, eyeR: 0.14,
    c: { fur: '#efdcb4', belly: '#f2e6cc', nose: '#3a2a20', eye: '#120e0c', ear: '#e0c89a', tailTip: '#1a1410', paw: '#3a2a20' }, pat: 9, patCol: '#8a5228', patScale: 4.2,
    extra: k => {
      const dark = col('#3a2a20');
      for (const s of [-1, 1]) { const a = V(k.cc[0] + s * k.hr * 0.35, k.cc[1] + k.cr[1] * 0.75, k.cc[2] - k.hr * 0.3), b = a.clone().add(V(s * 0.02, 0.16, -0.04)); hornSeg(k, a, b, 0.025, 0.022, k.head, col('#c8a878')); k.R.add(new THREE.SphereGeometry(0.035, 8, 6), M([b.x, b.y, b.z]), k.head, dark, 0); }
      const nb = k.R.wp[k.neck], hd = k.R.wp[k.head], [m, L] = limbM(nb.clone().add(V(0, 0.12, -0.08)), hd.clone().add(V(0, 0.1, -0.08)));
      k.R.add(new THREE.BoxGeometry(0.025, L, 0.07), m, k.neck, col('#7a4a22'), 1);
    } });
  // the zebra: a horse's body in stripes
  const H = TPL.horse.o;
  TPL.zebra = buildQuad(Object.assign({}, H, { L: 1.0, chestR: 0.3, hipR: 0.3, legLen: 0.82, neckLen: 0.55, c: { fur: '#f2f0e8', belly: '#f2f0e8', nose: '#1a1a1a', eye: '#120e0c', ear: '#e8e6de', mane: '#1a1a1a', tail: '#1a1a1a', paw: '#1a1a1a' },
    pat: 8, patCol: '#161616', patScale: 9, ring: 0.8 }));
  // the gazelle and the oryx: slender antelopes with horns
  const ante = (o, horn) => Q(Object.assign({ wid: 0.75, upFrac: 0.5, neckUp: 0.8, ear: 'point', earUp: 0.85, tailN: 2, eyeR: 0.16,
    extra: k => { for (const s of [-1, 1]) { const a = V(k.cc[0] + s * k.hr * 0.3, k.cc[1] + k.cr[1] * 0.7, k.cc[2] - k.hr * 0.05), pts = horn(s, a); for (let i = 0; i < pts.length - 1; i++) hornSeg(k, pts[i], pts[i + 1], 0.018 * (1 - i / pts.length) + 0.006, 0.014 * (1 - (i + 1) / pts.length) + 0.004, k.head, col('#2a221c')); } } }, o));
  TPL.gazelle = ante({ L: 0.6, chestR: 0.17, hipR: 0.17, legLen: 0.55, legR: 0.025, pawR: 0.03, neckLen: 0.3, neckR: 0.06, headR: 0.07, headWid: 0.8, snoutLen: 0.12, snoutR: 0.04, earR: 0.035, tailLen: 0.12, tailR: 0.02,
    c: { fur: '#c08a50', belly: '#f2ece0', nose: '#2a1e18', eye: '#120e0c', ear: '#b07a44', tail: '#1a1410' },
    colorFn: (c, x, y, z, nx, ny, nz, C, by) => (Math.abs(ny) < 0.22 && Math.abs(z) < 0.28 && Math.abs(y - by) < 0.08) ? col('#2a1e16') : (z < -0.32 && ny > -0.4 && ny < 0.5 ? col('#f0e8dc') : c) },
    (s, a) => [a, a.clone().add(V(s * 0.03, 0.12, -0.06)), a.clone().add(V(s * 0.05, 0.22, -0.08)), a.clone().add(V(s * 0.05, 0.3, -0.04))]);
  TPL.oryx = ante({ L: 0.85, chestR: 0.26, hipR: 0.25, legLen: 0.72, legR: 0.035, pawR: 0.04, neckLen: 0.35, neckR: 0.09, neckUp: 0.72, headR: 0.09, snoutLen: 0.16, snoutR: 0.05, earR: 0.04, tailLen: 0.35, tailR: 0.025, tailTip: 1.5,
    c: { fur: '#ece6da', belly: '#f4f0e8', nose: '#1a1612', eye: '#120e0c', legs: '#d8d0c0', tailTip: '#1a1612', snout: '#1e1a16' },
    colorFn: (c, x, y, z, nx, ny, nz, C, by) => (z > 0.55 && ny > -0.3 && Math.abs(nx) > 0.5) ? col('#1e1a16') : c },
    (s, a) => [a, a.clone().add(V(s * 0.04, 0.3, -0.22)), a.clone().add(V(s * 0.06, 0.6, -0.42))]);
  // the rhino: a heavy grey body, two horns on the nose
  TPL.rhino = Q({ L: 1.3, chestR: 0.5, hipR: 0.52, wid: 0.85, legLen: 0.55, legR: 0.14, pawR: 0.15, shoulderK: 1.3, thighK: 1.4, neckLen: 0.22, neckR: 0.36, neckUp: 0.05, headR: 0.3, headWid: 0.8, snoutLen: 0.36, snoutR: 0.2,
    snoutSquash: 0.9, ear: 'point', earR: 0.08, earUp: 0.9, tailLen: 0.3, tailR: 0.04, tailN: 2, eyeR: 0.08, htF: 1.12,
    c: { fur: '#8c857c', belly: '#7a736a', nose: '#5e5852', eye: '#120e0c', jaw: '#7a736a' },
    extra: k => { const hc = col('#6a625a'), a = V(k.sc[0], k.sc[1] + k.sr * 0.6, k.sc[2] + k.sl * 0.35); hornSeg(k, a, a.clone().add(V(0, 0.42, 0.12)), 0.1, 0.012, k.head, hc, 8); const b = a.clone().add(V(0, 0.05, -0.28)); hornSeg(k, b, b.clone().add(V(0, 0.2, 0.02)), 0.07, 0.01, k.head, hc, 8); } });
  // the hyena (spotted, sloping back) and the wolves (grey, dark, pale)
  TPL.hyena = Q({ L: 0.75, chestR: 0.22, hipR: 0.18, wid: 0.8, legLen: 0.42, frontLen: 1.22, legR: 0.05, pawR: 0.055, neckLen: 0.2, neckR: 0.11, neckUp: 0.35, headR: 0.11, headWid: 1.05, snoutLen: 0.1, snoutR: 0.06,
    ear: 'round', earR: 0.045, earUp: 0.85, tailLen: 0.28, tailR: 0.03, tailBush: true, tailN: 2, teeth: true, eyeR: 0.12, htF: 1.15, htB: 0.85,
    c: { fur: '#b39a6a', belly: '#a8916a', nose: '#151010', eye: '#2a1c12', snout: '#3a2c20', jaw: '#8a7450', tailTip: '#2a2016' }, pat: 5, patCol: '#3a2a1a', patScale: 9 });
  const wolf = c => Q({ L: 0.8, chestR: 0.2, hipR: 0.18, wid: 0.8, legLen: 0.5, legR: 0.04, pawR: 0.05, neckLen: 0.2, neckR: 0.1, neckUp: 0.32, headR: 0.1, headWid: 1.0, snoutLen: 0.14, snoutR: 0.05,
    ear: 'point', earR: 0.045, earUp: 0.85, tailLen: 0.45, tailR: 0.05, tailBush: true, tailN: 3, tailTip: 0.6, teeth: true, eyeR: 0.13, c });
  TPL.wolf = wolf({ fur: '#8c8a84', belly: '#d8d4ca', nose: '#151010', eye: '#c9a040', jaw: '#d8d4ca', snout: '#c8c4ba', tailTip: '#2a2826' });
  TPL.wolf2 = wolf({ fur: '#4a4642', belly: '#7a756e', nose: '#151010', eye: '#c9a040', jaw: '#8a857e', snout: '#5a5650', tailTip: '#1a1816' });
  TPL.wolf3 = wolf({ fur: '#cfccc4', belly: '#efece6', nose: '#151010', eye: '#c9a040', jaw: '#efece6', snout: '#e0ddd6', tailTip: '#8a8780' });
  // the camel: a hump on a long-legged body
  TPL.camel = Q({ L: 1.1, chestR: 0.34, hipR: 0.32, wid: 0.78, legLen: 1.0, legR: 0.06, pawR: 0.09, pawWid: 1.3, upFrac: 0.5, neckLen: 0.75, neckR: 0.12, neckUp: 0.5, headR: 0.13, headWid: 0.85, snoutLen: 0.22, snoutR: 0.08,
    ear: 'round', earR: 0.035, earUp: 0.9, tailLen: 0.45, tailR: 0.025, tailN: 2, tailTip: 1.3, eyeR: 0.13,
    c: { fur: '#c8a06a', belly: '#d8b480', nose: '#4a3a2a', eye: '#120e0c', tailTip: '#4a3422' },
    extra: k => k.R.add(new THREE.SphereGeometry(1, 16, 10), M([0, k.by + 0.3, 0.02], null, [0.26, 0.3, 0.36]), (x, y, z) => [k.hips, k.chest, clamp((z + k.L / 2) / k.L, 0, 1)], k.C.fur, 1) });
  // small foxes: the fennec with its huge ears, the white arctic fox
  const fox = (c, earR) => Q({ L: 0.42, chestR: 0.11, hipR: 0.1, wid: 0.8, legLen: 0.22, legR: 0.025, pawR: 0.03, neckLen: 0.1, neckR: 0.06, neckUp: 0.4, headR: 0.068, headWid: 1.05, snoutLen: 0.075, snoutR: 0.03,
    ear: 'point', earR, earUp: 0.85, tailLen: 0.35, tailR: 0.05, tailBush: true, tailN: 3, eyeR: 0.15, c });
  TPL.fennec = fox({ fur: '#e8c890', belly: '#f6ecd8', nose: '#151010', eye: '#1a120c', snout: '#f0e0c4', tailTip: '#3a2a1a' }, 0.07);
  TPL.arcticfox = fox({ fur: '#f2f2ee', belly: '#ffffff', nose: '#151010', eye: '#1a1a1a', snout: '#f6f6f2' }, 0.03);
  // the bears
  const bear = (c, o) => Q(Object.assign({ L: 1.2, chestR: 0.42, hipR: 0.4, wid: 0.85, legLen: 0.55, legR: 0.12, pawR: 0.13, pawWid: 1.2, upFrac: 0.5, shoulderK: 1.4, thighK: 1.5, neckLen: 0.36, neckR: 0.22, neckUp: 0.22,
    headR: 0.17, headWid: 0.95, snoutLen: 0.17, snoutR: 0.09, snoutSquash: 0.85, ear: 'round', earR: 0.045, earUp: 0.85, tailLen: 0.08, tailR: 0.05, tailN: 1, claws: true, clawLen: 0.8, eyeR: 0.09, teeth: true, c }, o));
  TPL.polarbear = bear({ fur: '#f0ede2', belly: '#e6e2d4', nose: '#151010', eye: '#151010', snout: '#ebe7da', paw: '#e2ded0' }, { L: 1.3, neckLen: 0.42 });
  TPL.brownbear = bear({ fur: '#5a3c26', belly: '#4e3420', nose: '#151010', eye: '#151010', snout: '#6e4c32', paw: '#3a2a1c' }, { htF: 1.18, neckLen: 0.28 });
  // the reindeer and the moose, with antlers
  const tines = (k, side, a, dirs, r) => { let p = a; for (const d of dirs) { const q = p.clone().add(V(d[0] * side, d[1], d[2])); hornSeg(k, p, q, r, r * 0.8, k.head, col('#c8b494')); if (d[3]) { const t = q.clone().add(V(d[3][0] * side, d[3][1], d[3][2])); hornSeg(k, q, t, r * 0.6, r * 0.3, k.head, col('#d8c8a8')); } p = q; } };
  TPL.reindeer = Q({ L: 0.95, chestR: 0.28, hipR: 0.26, wid: 0.78, legLen: 0.7, legR: 0.045, pawR: 0.07, pawWid: 1.3, upFrac: 0.5, neckLen: 0.4, neckR: 0.11, neckUp: 0.6, headR: 0.1, headWid: 0.9, snoutLen: 0.2, snoutR: 0.07,
    ear: 'point', earR: 0.04, earUp: 0.8, tailLen: 0.1, tailR: 0.04, tailN: 1, eyeR: 0.14,
    c: { fur: '#7a6650', belly: '#e8e0d0', nose: '#2a2018', eye: '#120e0c', legs: '#5a4a3a' },
    colorFn: (c, x, y, z, nx, ny, nz, C, by) => (z > 0.42 && y > by - 0.05) ? col('#e2d8c4') : c,
    extra: k => { for (const s of [-1, 1]) tines(k, s, V(k.cc[0] + s * k.hr * 0.4, k.cc[1] + k.cr[1] * 0.7, k.cc[2] - k.hr * 0.2), [[0.08, 0.2, -0.12, [0.02, 0.06, 0.16]], [0.06, 0.22, -0.1, [0.05, 0.1, 0.12]], [0.02, 0.2, 0.02, [-0.04, 0.1, 0.08]], [-0.02, 0.14, 0.08]], 0.022); } });
  TPL.moose = Q({ L: 1.25, chestR: 0.42, hipR: 0.36, wid: 0.72, legLen: 1.05, legR: 0.06, pawR: 0.08, upFrac: 0.5, neckLen: 0.35, neckR: 0.16, neckUp: 0.35, headR: 0.14, headWid: 0.9, snoutLen: 0.34, snoutR: 0.11, snoutSquash: 1.05,
    ear: 'point', earR: 0.06, earUp: 0.8, tailLen: 0.08, tailR: 0.04, tailN: 1, htF: 1.3, htB: 0.9, eyeR: 0.1,
    c: { fur: '#3e2e22', belly: '#34261c', legs: '#7a6a5a', nose: '#1e1410', eye: '#0e0a08' },
    extra: k => {
      const ac = col('#b8a888');
      for (const s of [-1, 1]) {
        const a = V(k.cc[0] + s * k.hr * 0.5, k.cc[1] + k.cr[1] * 0.6, k.cc[2] - k.hr * 0.25), b = a.clone().add(V(s * 0.28, 0.06, -0.02));
        hornSeg(k, a, b, 0.035, 0.03, k.head, ac);
        k.R.add(new THREE.BoxGeometry(0.42, 0.04, 0.3), M([b.x + s * 0.2, b.y + 0.08, b.z], [0, 0, s * 0.35]), k.head, ac, 0);
        for (let i = 0; i < 4; i++) { const t0 = V(b.x + s * (0.12 + i * 0.08), b.y + 0.12 + i * 0.03, b.z + (i % 2 ? 0.1 : -0.1)); hornSeg(k, t0, t0.clone().add(V(s * 0.04, 0.12, 0)), 0.02, 0.008, k.head, ac); }
      }
      const J = k.R.wp[k.jaw]; k.R.add(new THREE.BoxGeometry(0.04, 0.18, 0.08), M([J.x, J.y - 0.14, J.z - 0.06]), k.head, k.C.fur, 1);
    } });
  // the sea: a dolphin, a great white shark, a whale, reef fish
  TPL.seadolphin = buildFish({ len: 2.4, rx: 0.28, ry: 0.3, peak: 0.4, dolphin: true, beak: 0.2, c: { top: '#5f6a76', side: '#8a96a2', belly: '#e8ecf0', fin: '#5a6470', eye: '#1a1a1a' } });
  TPL.shark = buildFish({ len: 3.4, rx: 0.32, ry: 0.42, peak: 0.33, dorsal: 0.3, c: { top: '#5a6670', side: '#7a8690', belly: '#f0f0ec', fin: '#56626c', eye: '#111111' } });
  TPL.whale = buildFish({ len: 12, rx: 1.35, ry: 1.45, peak: 0.33, dolphin: true, beak: 0.6, c: { top: '#2e3a48', side: '#3e4a58', belly: '#c8ccd0', fin: '#2e3a48', eye: '#111111' } });
  TPL.reeffish = buildFish({ len: 0.28, rx: 0.045, ry: 0.11, peak: 0.4, c: { top: '#2a5ad8', side: '#3a8ae8', belly: '#f0d040', fin: '#f0c020', eye: '#111111' } });
  TPL.reeffish2 = buildFish({ len: 0.26, rx: 0.04, ry: 0.12, peak: 0.4, c: { top: '#f2c018', side: '#f8d830', belly: '#fff0a0', fin: '#e0a010', eye: '#111111' } });
  // the turtle: a domed shell over flippers; the crab: a flat red shell with two claws
  TPL.turtle = Q({ L: 0.6, chestR: 0.28, hipR: 0.26, wid: 1.35, ht: 0.42, legLen: 0.12, legR: 0.06, pawR: 0.13, pawWid: 2.1, spread: 1.25, neckLen: 0.2, neckR: 0.07, neckUp: 0.12, headR: 0.08, headWid: 1.0,
    snoutLen: 0.03, snoutR: 0.05, ear: 'none', tailLen: 0.1, tailR: 0.03, tailN: 1, bodyLift: 0.1, eyeR: 0.14,
    c: { fur: '#7a7a52', belly: '#d8cfa0', nose: '#2a2a1a', eye: '#120e0c', legs: '#7a7a52', paw: '#6a6a46' },
    extra: k => k.R.add(new THREE.SphereGeometry(1, 18, 10, 0, TAU, 0, Math.PI / 2), M([0, k.by - 0.02, 0.0], null, [0.46, 0.22, 0.52]), (x, y, z) => [k.hips, k.chest, clamp((z + k.L / 2) / k.L, 0, 1)], col('#5e4e2c'), 1),
    pat: 2, patCol: '#2e2614', patScale: 6 });
  TPL.crab = Q({ L: 0.12, chestR: 0.08, hipR: 0.08, wid: 1.9, ht: 0.5, legLen: 0.07, legR: 0.012, pawR: 0.014, spread: 1.6, neckLen: 0.01, neckR: 0.02, neckUp: 0.2, headR: 0.03, snoutLen: 0.01, snoutR: 0.012,
    ear: 'none', noTail: true, eyeR: 0.3, c: { fur: '#d0703a', belly: '#e8b080', nose: '#d0703a', eye: '#111111', legs: '#c86030' },
    extra: k => { for (const s of [-1, 1]) { k.R.add(new THREE.SphereGeometry(1, 10, 8), M([s * 0.11, k.by - 0.01, 0.12], [0, s * 0.4, 0], [0.04, 0.03, 0.06]), k.chest, col('#e07a40'), 1); k.R.add(new THREE.CylinderGeometry(0.006, 0.006, 0.05, 5), M([s * 0.025, k.by + 0.06, 0.08]), k.chest, col('#c86030'), 0); } } });
  // the gull and the horned viper
  TPL.seagull = buildBird({ r: 0.07, len: 0.32, headR: 0.05, span: 1.0, chord: 0.17, tailLen: 0.1, tailW: 0.1, beak: 'hook', beakLen: 0.05,
    c: { body: '#f4f4f0', head: '#ffffff', wing: '#a8b0b8', wingMid: '#a8b0b8', wingTip: '#1a1a1a', tail: '#f0f0ec', beak: '#e8c030', beak2: '#c03020', legs: '#e0a030' } });
  TPL.hviper = buildSnake({ len: 0.8, r: 0.032, bones: 8, headWide: true, c: { top: '#d4b688', belly: '#ece0c4' }, pat: 4, patCol: '#9a7448', patScale: 6 });
}

// ---------- the shark hunts swimmers in the open sea; the whale keeps to deep water and blows ----------
BRAIN.shark = (a, dt) => {
  const p = P.a;
  if (p && p.alive && p.swimming && !P.ship && !P.boat && G.mode === 'play') {
    const d = a.pos.distanceTo(p.pos);
    if (d < 22 && waterDepth(p.pos.x, p.pos.z) > 2.5) {
      if (!a.stalk) { a.stalk = true; UI.notify('🦈 כריש! צריך לצאת מהמים', 'bad'); }
      _tmp.copy(p.pos); _tmp.y = Math.min(p.pos.y, -0.4); swimToward(a, _tmp, (a.sp.swim || 4) * 1.6, dt);
      if (d < a.rad + 1.4 && a.atkCD <= 0) { a.atkCD = 1.6; a.anim.atk = 0.35; hurt(p, a.sp.dmg * rr(0.8, 1.1), a); AUD.at('bite', a.pos, 0.9); FX.spawn('splash', p.pos.x, 0, p.pos.z, 10); }
      return;
    }
  }
  a.stalk = false;
  BRAIN.bigfish(a, dt);
};
BRAIN.whale = (a, dt) => {
  a.stT -= dt; a.breath = (a.breath ?? rr(20, 60)) - dt;
  if (!a.goal || a.stT <= 0 || dist2(a.goal, a.pos) < 16) { const g = waterGoal(a, 160, 9); a.goal = g ? { x: g.x, z: g.z, y: -rr(3, 6) } : { x: a.home.x, z: a.home.z, y: -4 }; a.stT = rr(25, 60); }
  let ty = a.goal.y;
  if (a.breath < 0) {
    ty = -0.6;
    if (a.pos.y > -1.2 && !a.blew) { a.blew = true; if (a.dCam < 220) { FX.spawn('splash', a.pos.x, 1.5, a.pos.z, 30); AUD.at('splash', a.pos, 1); } }
    if (a.breath < -5) { a.breath = rr(40, 90); a.blew = false; }
  }
  _tmp.set(a.goal.x, ty, a.goal.z); swimToward(a, _tmp, a.sp.swim || 2.4, dt);
};
// ================= THE TRIBES OF THE NEW LANDS: their own clothes, their own camps, their own herds =================
// The north: furs and hoods, igloos and hide tents, reindeer. The savanna: red cloth and beaded collars, round huts in a ring
// of thorns, cattle. The desert: long robes and turbans, black tents and carpets, camels. The coast: sarongs and flower
// garlands, houses on stilts, canoes on the sand.
Object.assign(TRIBEC, { wolf: '#5d7fa8', ice: '#8fc0d8', lion: '#d8a020', baobab: '#7a9a2a', sand: '#c86a2a', oasis: '#2a8a6a', sea: '#2a6ad0', coral: '#e0607a',
  bear: '#7a5a9a', snow: '#c8d8e8', zebra: '#3a3a3a', spear: '#b04a2a', camelt: '#a87a3a', star: '#3a5aa8', dolph: '#3aa8c8', shell: '#e8b07a' });
Object.assign(CLOTH, { wolf: '#6a5038', ice: '#e6e0d4', lion: '#b3261e', baobab: '#8a2a5a', sand: '#e9e2cf', oasis: '#2c3a66', sea: '#1f8a8a', coral: '#d8642a',
  bear: '#5a4434', snow: '#ece8e0', zebra: '#3a3a3a', spear: '#c0392b', camelt: '#d8c8a8', star: '#33407a', dolph: '#2a7a9a', shell: '#e07a4a' });
const TRIBE_LAND = { wolf: 1, ice: 1, bear: 1, snow: 1, lion: 2, baobab: 2, zebra: 2, spear: 2, sand: 3, oasis: 3, camelt: 3, star: 3, sea: 4, coral: 4, dolph: 4, shell: 4 };
// the families that leave a tribe of a new land found their new tribe in the same land
const LAND_DAUGHTERS = { 1: [{ tribe: 'שבט הדוב', key: 'bear' }, { tribe: 'שבט השלג', key: 'snow' }], 2: [{ tribe: 'שבט הזברה', key: 'zebra' }, { tribe: 'שבט החנית', key: 'spear' }],
  3: [{ tribe: 'שבט הגמל', key: 'camelt' }, { tribe: 'שבט הכוכב', key: 'star' }], 4: [{ tribe: 'שבט הדולפין', key: 'dolph' }, { tribe: 'שבט הצדף', key: 'shell' }] };
// the herd each land's tribes keep by their camp
const LIVESTOCK = { 1: 'reindeer', 2: 'cow', 3: 'camel', 4: 'cow' };
const campLand = c => (c && (c.land || TRIBE_LAND[c.key])) || 0;

// ---------- clothes ----------
function landDress(o, cls, tk, f, h) {
  const L = TRIBE_LAND[tk], C = o.c, cloth = CLOTH[tk], acc = TRIBEC[tk], kid = cls === 'child';
  if (L === 1) {
    C.skin = ['#d9ab86', '#c99a74', '#e0b896'][h % 3]; C.shirt = cloth; C.pants = '#5a4430'; C.boot = '#3e2c1e'; C.hat = cloth; C.scarf = '#f2efe8';
    o.sleeves = true; o.hat = 'bandana'; o.scarf = true;
  } else if (L === 2) {
    C.skin = ['#4e3424', '#5a3a28', '#463020'][h % 3]; C.shirt = cloth; C.pants = cloth; C.boot = '#4a3224'; C.hat = acc;
    o.sleeves = false;
  } else if (L === 3) {
    C.skin = ['#b07f57', '#a8774f', '#c08a60'][h % 3]; C.shirt = cloth; C.pants = cloth; C.boot = '#7a5a3c'; C.hat = cloth; C.scarf = cloth;
    o.sleeves = true; o.hat = 'bandana'; o.scarf = !kid;
  } else if (L === 4) {
    C.skin = ['#8b5d3d', '#9a6948', '#7f5537'][h % 3]; C.pants = cloth; C.boot = C.skin; if (f) C.shirt = acc;
    o.sleeves = false;
  }
  const ex = o.extra;
  o.extra = (R, Cc, MK) => { if (ex) ex(R, Cc, MK); landExtra(L, R, Cc, MK, acc, kid); };
}
function landExtra(L, R, C, MK, acc, kid) {
  const head = R.map.head, chest = R.map.chest, s = kid ? 0.8 : 1;
  if (L === 1) {
    // a fur hood over the head and a white fur ring around the face
    R.add(new THREE.SphereGeometry(1, 16, 10, 0, TAU, 0, Math.PI * 0.62), M([0, 1.682, -0.012], [-0.3, 0, 0], [0.125, 0.135, 0.132]), head, C.hat, MK);
    R.add(new THREE.TorusGeometry(0.1, 0.03, 8, 20), M([0, 1.665, 0.062], [0.12, 0, 0]), head, C.scarf, MK);
  } else if (L === 2) {
    // a beaded collar of three colours over the shoulders
    [['#c0392b', 0.165, 1.445], ['#f2efe6', 0.15, 1.458], [acc, 0.13, 1.47]].forEach(([c, r, y]) => R.add(new THREE.CylinderGeometry(r * s, r * s, 0.014, 22), M([0, y, 0.01]), chest, col(c), MK));
  } else if (L === 3) {
    // a turban wound around the head
    for (let k = 0; k < 3; k++) R.add(new THREE.TorusGeometry(0.098 - k * 0.012, 0.03, 8, 18), M([0, 1.725 + k * 0.032, -0.006], [Math.PI / 2 + 0.08, 0, 0]), head, C.hat, MK);
  } else if (L === 4) {
    // a garland of flowers
    const FL = ['#f2c41c', '#e0468a', '#f08a24', '#f2efe6', '#d8262a'];
    for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; R.add(new THREE.SphereGeometry(0.022 * s, 6, 5), M([Math.sin(a) * 0.115 * s, 1.43 - Math.cos(a) * 0.035, Math.cos(a) * 0.1 * s + 0.01]), chest, col(FL[i % FL.length]), 0); }
  }
}

// ---------- camps ----------
function buildCamp(c) {
  if (c.civ || c.bandit) { civBuildCamp(c); return; }
  const L = campLand(c);
  buildCampBase(c);
  if (!L) return;
  // the jungle tent and crates make way for the land's own houses
  if (c.mesh) { scene.remove(c.mesh); c.mesh.geometry.dispose(); }
  const R = new Rig(), gy = (lx, lz) => getH(c.x + lx, c.z + lz) - c.y;
  const add = (geo, p, r, s, color) => R.add(geo, M([p[0], p[1] + gy(p[0], p[2]), p[2]], r, s), 0, col(color), 1);
  // the fire pit and the log seats, as in every camp
  for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; add(new THREE.SphereGeometry(0.14, 6, 5), [Math.cos(a) * 0.55, 0.05, Math.sin(a) * 0.55], null, [1, 0.65, 1], i % 2 ? '#6d6862' : '#58534e'); }
  for (let i = 0; i < 3; i++) add(new THREE.CylinderGeometry(0.06, 0.07, 0.95, 6), [0, 0.14, 0], [Math.PI / 2 - 0.25, i * 1.05, 0], null, '#4a3424');
  add(new THREE.CylinderGeometry(0.44, 0.44, 0.02, 12), [0, 0.01, 0], null, null, '#2b2622');
  add(new THREE.CylinderGeometry(0.19, 0.21, 1.5, 9), [0.2, 0.18, 1.7], [0, 0.2, Math.PI / 2], null, '#5a4030');
  const spots = [[-4.2, -2.2, 0.5], [4.4, -1.6, -0.6], [-1.2, -5, 0.1], [3.2, 3.6, 2.5], [-4.6, 3.4, 2.1]];
  const k = c.key;
  for (const [x, z, rot] of spots) {
    if (L === 1 && k !== 'wolf' && k !== 'bear') {
      // an igloo with its entrance tunnel
      add(new THREE.SphereGeometry(1.9, 16, 8, 0, TAU, 0, Math.PI / 2), [x, -0.1, z], null, null, '#eef2f4');
      const fx = Math.sin(rot + Math.PI), fz = Math.cos(rot + Math.PI);
      add(new THREE.CylinderGeometry(0.7, 0.7, 1.4, 12, 1, false, 0, Math.PI), [x + fx * 1.9, 0, z + fz * 1.9], [0, rot + Math.PI / 2, Math.PI / 2], null, '#e6ecef');
      add(new THREE.BoxGeometry(0.6, 0.7, 0.05), [x + fx * 2.6, 0.35, z + fz * 2.6], [0, rot, 0], null, '#2a3038');
    } else if (L === 1) {
      // a hide tent on long poles
      add(new THREE.ConeGeometry(1.8, 3.2, 10, 1, true), [x, 1.6, z], [0, rot, 0], null, '#6a5038');
      for (let p = 0; p < 4; p++) { const a = p / 4 * TAU + rot; add(new THREE.CylinderGeometry(0.035, 0.035, 1.1, 5), [x + Math.cos(a) * 0.12, 3.45, z + Math.sin(a) * 0.12], [Math.cos(a) * 0.25, 0, Math.sin(a) * 0.25], null, '#4a3424'); }
      add(new THREE.BoxGeometry(0.7, 1.1, 0.05), [x + Math.sin(rot) * 1.3, 0.55, z + Math.cos(rot) * 1.3], [0.2, rot, 0], null, '#3a2a1e');
    } else if (L === 2) {
      // a round hut of mud with a thatched roof
      add(new THREE.CylinderGeometry(1.55, 1.65, 1.4, 14), [x, 0.7, z], null, null, '#8a6a4a');
      add(new THREE.ConeGeometry(2.1, 1.5, 14), [x, 2.15, z], null, null, '#b89a5a');
      add(new THREE.BoxGeometry(0.7, 1.05, 0.08), [x + Math.sin(rot) * 1.6, 0.52, z + Math.cos(rot) * 1.6], [0, rot, 0], null, '#2a1e16');
    } else if (L === 3) {
      // a long low tent of black goat hair over a carpet
      add(new THREE.CylinderGeometry(1.5, 1.5, 4.2, 3, 1, true), [x, 0.75, z], [0, rot, Math.PI / 2], [1, 1, 0.7], '#3a2e26');
      add(new THREE.BoxGeometry(2.6, 0.03, 3.6), [x + Math.sin(rot) * 0.4, 0.02, z + Math.cos(rot) * 0.4], [0, rot, 0], null, ['#a8322a', '#2a4a8a', '#8a5a2a'][(x * 7 + z) & 1 ? 0 : 1]);
      for (const e of [-1.9, 1.9]) add(new THREE.CylinderGeometry(0.04, 0.04, 1.5, 5), [x + Math.cos(rot) * e, 0.75, z - Math.sin(rot) * e], null, null, '#5a4030');
    } else {
      // a house on stilts with a roof of palm leaves
      for (const [px, pz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) add(new THREE.CylinderGeometry(0.08, 0.09, 1.3, 6), [x + px * 1.2, 0.65, z + pz * 1.2], null, null, '#6a4a2c');
      add(new THREE.BoxGeometry(2.8, 0.14, 2.8), [x, 1.3, z], [0, rot, 0], null, '#8a6a42');
      add(new THREE.BoxGeometry(2.2, 1.3, 2.2), [x, 2.0, z], [0, rot, 0], null, '#b08a5a');
      add(new THREE.ConeGeometry(2.3, 1.6, 4), [x, 3.4, z], [0, rot + Math.PI / 4, 0], null, '#c8a868');
      add(new THREE.BoxGeometry(0.6, 0.9, 0.06), [x + Math.sin(rot) * 1.12, 1.82, z + Math.cos(rot) * 1.12], [0, rot, 0], null, '#3a2a1c');
    }
  }
  // what every land keeps around its camp
  if (L === 1) { for (let i = 0; i < 2; i++) add(new THREE.CylinderGeometry(0.05, 0.06, 1.8, 6), [5.2 + i * 1.6, 0.9, -4], null, null, '#5a3f28'); add(new THREE.CylinderGeometry(0.04, 0.04, 2, 6), [6, 1.7, -4], [0, 0, Math.PI / 2], null, '#6b4a2c'); for (let i = 0; i < 3; i++) add(new THREE.BoxGeometry(0.5, 0.7, 0.04), [5.4 + i * 0.6, 1.25, -4], null, null, ['#8a6a4a', '#d8d0c0', '#6a5038'][i]); }
  if (L === 2) for (let i = 0; i < 26; i++) { const a = i / 26 * TAU; if (Math.abs(angDiff(a, 1.2)) < 0.25) continue; add(new THREE.SphereGeometry(0.75, 7, 5), [Math.cos(a) * 10, 0.4, Math.sin(a) * 10], null, [1.2, 0.65, 1], i % 2 ? '#4a4a2a' : '#5a5530'); }
  if (L === 3) { add(new THREE.BoxGeometry(0.5, 0.45, 0.8), [5, 0.22, 1], [0, 0.4, 0], null, '#8a5a2a'); add(new THREE.CylinderGeometry(0.28, 0.22, 0.6, 10), [5.6, 0.3, 2.1], null, null, '#b06a3a'); add(new THREE.CylinderGeometry(0.22, 0.18, 0.5, 10), [5.1, 0.25, 2.5], null, null, '#c08050'); }
  if (L === 4) { for (let i = 0; i < 2; i++) { add(new THREE.CylinderGeometry(0.42, 0.42, 4.2, 10, 1, false, 0, Math.PI), [6 + i * 1.4, 0.3, -3 + i * 0.6], [Math.PI, 0.3, Math.PI / 2], [1, 1, 0.55], '#7a5230'); }
    for (const s of [-1, 1]) add(new THREE.CylinderGeometry(0.04, 0.05, 1.7, 6), [-6 + s * 0.85, 0.85, -2], null, null, '#5a3f28'); add(new THREE.CylinderGeometry(0.035, 0.035, 1.9, 6), [-6, 1.6, -2], [0, 0, Math.PI / 2], null, '#6b4a2c');
    for (let i = 0; i < 4; i++) add(new THREE.SphereGeometry(1, 8, 6), [-6.5 + i * 0.37, 1.32, -2], null, [0.06, 0.2, 0.035], '#7a8a9a'); }
  // a totem in the colour of the tribe
  add(new THREE.CylinderGeometry(0.16, 0.2, 2.6, 8), [0.9, 1.3, -4.4], null, null, '#6b4a2c');
  add(new THREE.BoxGeometry(0.5, 0.35, 0.45), [0.9, 2.2, -4.4], null, null, TRIBEC[k] || '#b0472f');
  const mesh = new THREE.Mesh(R.geometry(), HUNT.mat); mesh.position.set(c.x, c.y, c.z); mesh.castShadow = true; mesh.receiveShadow = true; scene.add(mesh); c.mesh = mesh;
  campLandObstacles(c);
}
// a good place for a tribe in a land: dry, flat, inside its own land, far enough from every other camp
function landSpotOk(x, z, L, minD, camps) {
  if (Math.abs(x) > LIMIT - 60 || Math.abs(z) > LIMIT - 60 || outD(x, z) < 120 || landAt(x, z) !== L || waterDepth(x, z) > 0) return false;
  const h = getH(x, z); if (h < 0.8 || h > 60 || getNY(x, z) < 0.95) return false;
  for (let k = 0; k < 8; k++) { const b = k / 8 * TAU, px = x + Math.cos(b) * 6, pz = z + Math.sin(b) * 6; if (Math.abs(getH(px, pz) - h) > 1.2 || waterDepth(px, pz) > 0) return false; }
  if (OUTW.passes.some(p => nearestOnPoly(x, z, p.P)[0] < 40)) return false;
  for (const c of camps) if (Math.hypot(c.x - x, c.z - z) < minD) return false;
  return true;
}
// the houses stand on the ground: nothing walks through them
function campLandObstacles(c) {
  if (!campLand(c) || c.obs) return;
  c.obs = [];
  for (const [x, z] of [[-4.2, -2.2], [4.4, -1.6], [-1.2, -5], [3.2, 3.6], [-4.6, 3.4]]) {
    const wx = c.x + x, wz = c.z + z, k = g10(wx, wz);
    (TRUNKS.g[k] || (TRUNKS.g[k] = [])).push(wx, wz, campLand(c) === 4 ? 1.3 : 1.7); c.obs.push(k);
  }
}
// ================= THE AIR OF EACH LAND: haze and light, snow and sandstorms, cold and heat =================
// The jungle keeps its wet green haze. The savanna and the sea are clear (the great mountain shows from far away), the desert
// shimmers warm and its storms are of sand, the north is cold and blue-white and its storms are of snow.
const ATMO = { w: [1, 0, 0, 0, 0], far: 0, cold: 1, heat: 1, land: -1, told: {}, t: 0, flakes: null };
const ATMOC = { fog: [null, col('#c9d5df'), col('#d9c9a0'), col('#e2caa2'), col('#b9d2de')], sand: col('#c99c64'), snowF: col('#dfe6ec'),
  gnd: [null, col('#c8d0d8'), col('#8a7a4a'), col('#b08e60'), col('#6a8a6a')] };
// how thick the haze is in each land, and how much of the rain falls there (in the desert it is sand, in the north snow)
const ATMOK = { fog: [1, 0.78, 0.6, 0.7, 0.62], rain: [1, 0, 0.6, 0, 0.85] };
function atmoUpdate(dt) {
  const c = camera.position, L = atmoW(c.x, c.z), k = Math.min(1, dt * 0.8);
  for (let r = 0; r < 5; r++) ATMO.w[r] += (L[r] - ATMO.w[r]) * k;
  ATMO.far = smooth(-950, -1200, c.z) * ATMO.w[1];
  const w = ATMO.w, rain = G.rain;
  // the haze: its thickness and its colour
  let fk = 0; for (let r = 0; r < 5; r++) fk += w[r] * ATMOK.fog[r];
  const storm = rain * (w[1] * (0.4 + ATMO.far) + w[3]);
  fk *= 1 + storm * 1.6;
  if (QUAL[SET.q].view < 200) fk = Math.max(fk, 0.8);
  if (!SKY.under) {
    scene.fog.density *= fk;
    const fc = scene.fog.color;
    for (let r = 1; r < 5; r++) if (w[r] > 0.01) fc.lerp(ATMOC.fog[r], w[r] * 0.4 * (0.4 + 0.6 * SKY.day));
    if (w[3] > 0.01 && rain > 0.02) fc.lerp(ATMOC.sand, w[3] * rain * 0.8 * (0.3 + 0.7 * SKY.day));
    if (w[1] > 0.01 && rain > 0.02) fc.lerp(ATMOC.snowF, w[1] * rain * 0.6 * (0.3 + 0.7 * SKY.day));
  }
  // the light bounced from the ground: snow and sand are bright
  for (let r = 1; r < 5; r++) if (w[r] > 0.01) SKY.hemi.groundColor.lerp(ATMOC.gnd[r], w[r] * 0.55 * SKY.day);
  flakesUpdate(dt);
  // cold in the far north (a fire warms), heat in the desert at midday (the oasis and the shade help)
  const a = P.a, day = smooth(8.5, 11, G.time) * (1 - smooth(16, 18.5, G.time));
  ATMO.cold = 1 + (a && G.mode === 'play' && !P.fish && !nearFire(6) ? ATMO.far * (0.5 + rain * 0.5) : 0);
  ATMO.heat = 1 + (a && G.mode === 'play' && !P.fish && !(a.swimming) ? w[3] * day * 0.9 * (1 - rain * 0.5) : 0);
  landTell(dt);
}
// rain falls only where it rains
function atmoRainK() { let rk = 0; for (let r = 0; r < 5; r++) rk += ATMO.w[r] * ATMOK.rain[r]; return rk; }
// ---------- snowflakes and blowing sand around the camera ----------
function buildFlakes() {
  const n = PHONE ? 900 : 1600, pos = new Float32Array(n * 3);
  for (let i = 0; i < n * 3; i++) pos[i] = rng();
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.ShaderMaterial({
    uniforms: { uTime: WUNI.uTime, uCam: { value: new V3() }, uSnow: { value: 0 }, uSand: { value: 0 }, uLight: WUNI.uLight, uPS: PSCALE },
    vertexShader: `uniform float uTime, uSnow, uSand, uPS; uniform vec3 uCam; varying float vA; varying float vSand;
      void main(){
        float sand = step(0.5, fract(position.x * 7.31 + position.z * 3.17)) * step(uSnow, uSand);
        vec3 p = position * 50.0 - 25.0;
        float t = uTime;
        if (sand > 0.5) { p.x = mod(position.x * 50.0 + t * 16.0, 50.0) - 25.0; p.y = mod(position.y * 14.0 + sin(t * 3.0 + position.z * 40.0) * 0.8, 14.0) - 4.0; }
        else { p.y = mod(position.y * 50.0 - t * 2.4, 50.0) - 25.0; p.x += sin(t * 0.7 + position.z * 30.0) * 1.2; p.z += cos(t * 0.6 + position.x * 30.0) * 1.2; }
        p.x = mod(p.x - uCam.x, 50.0) - 25.0; p.z = mod(p.z - uCam.z, 50.0) - 25.0;
        vec4 mv = viewMatrix * vec4(uCam + p, 1.0);
        vSand = sand; vA = sand > 0.5 ? uSand : uSnow;
        gl_PointSize = max(1.0, (sand > 0.5 ? 0.07 : 0.11) * uPS / -mv.z); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float uLight; varying float vA; varying float vSand;
      void main(){ float d = length(gl_PointCoord - 0.5); if (vA < 0.01) discard;
        vec3 c = mix(vec3(0.96, 0.97, 1.0), vec3(0.86, 0.72, 0.5), vSand) * (0.35 + 0.65 * uLight);
        gl_FragColor = vec4(c, smoothstep(0.5, 0.15, d) * vA * 0.85); }`,
    transparent: true, depthWrite: false
  });
  const p = new THREE.Points(g, m); p.frustumCulled = false; p.visible = false; scene.add(p); ATMO.flakes = p;
}
function flakesUpdate() {
  if (!ATMO.flakes) buildFlakes();
  const u = ATMO.flakes.material.uniforms, w = ATMO.w, rain = G.rain;
  u.uSnow.value = SKY.under ? 0 : clamp(ATMO.far * (0.3 + rain * 0.7) + w[1] * rain * 0.6, 0, 1);
  u.uSand.value = SKY.under ? 0 : clamp(w[3] * rain * 1.2, 0, 1);
  u.uCam.value.copy(camera.position);
  ATMO.flakes.visible = u.uSnow.value > 0.02 || u.uSand.value > 0.02;
}
// the weather has the name of the land it falls on
function weatherName(big) {
  const w = ATMO.w, r = w.indexOf(Math.max(...w));
  if (r === 3) return big ? ['סופת חול', 'רוח חמה מרימה חול. קשה לראות רחוק, וכדאי להישאר קרוב למים'] : ['סופת חול קלה', 'אובך של חול באוויר'];
  if (r === 1) return big ? ['סופת שלג', 'קר מאוד. מדורה או הכפר שומרים עליך חם'] : ['שלג יורד', 'פתיתים לבנים מכסים את היער'];
  return big ? ['סערת ברקים', 'רוח חזקה, ברקים ורעמים. כדאי למצוא מחסה'] : ['גשם טרופי', 'השבילים בוציים והחיות מחפשות מחסה'];
}
// ---------- arriving in a land ----------
const LAND_TELL = [null, 'קר כאן: מי שרחוק ממדורה רעב מהר יותר. ביער האורנים יש איילים, זאבים ודובים', 'עדרים של זברות, צבאים ופילים, ואריות שצדים אותם. שימו לב לקרנפים',
  'חם ויבש: הצמא בא מהר בצהריים. המים נמצאים בנווה המדבר, והשבטים כאן רוכבים על גמלים', 'הים פתוח, ויש בו כרישים: לא לשחות רחוק. על החוף יש צבי ים וסרטנים'];
function landTell(dt) {
  if (G.mode !== 'play' || !P.a) return;
  ATMO.t -= dt; if (ATMO.t > 0) return; ATMO.t = 1;
  const r = landAt(P.a.pos.x, P.a.pos.z); if (r === ATMO.land) return;
  ATMO.land = r; if (!r || r === OWL.ocean) return;
  if (!ATMO.told[r]) { ATMO.told[r] = 1; UI.big(`${LANDS[r].n}`, LAND_TELL[r]); AUD.play('chime', 0.5); }
  else UI.notify(`נכנסת ${LANDS[r].to}`);
}
// ================= A CARPET OF GRASS AROUND YOU: thick grass where the land is open, golden in the savanna =================
// Two instanced meshes (green grass, dry grass) are laid out on a grid that follows the camera. Each place of the grid has
// its own fixed grass (from a hash of its position), so the grass does not swim as you walk; it grows in at the edge.
const GRASS = { m: [null, null], cx: 1e9, cz: 1e9, cs: 2.4, R: 30, max: 2000 };
const _gm = new THREE.Matrix4(), _gq = new THREE.Quaternion(), _gs = new V3(), _gp = new V3(), _ge = new THREE.Euler();
function grassClump(dry) {
  const near = new VB(), w = dry ? 1.1 : 1.1, h = dry ? 0.72 : 0.7, tint = col(dry ? '#fff6e0' : '#e8f0d8');
  for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI + 0.3; near.quad(new V3(0, h / 2, 0), new V3(Math.cos(a), 0, Math.sin(a)), new V3(0, 1, 0), w, h, dry ? AT.dgrass : AT.grass, tint, 1); }
  return near.build();
}
function grassBuild() {
  const q = SET.q; GRASS.R = q === 'low' ? 20 : q === 'high' ? 38 : 30; GRASS.max = q === 'low' ? 800 : q === 'high' ? 3200 : 2000;
  for (let k = 0; k < 2; k++) {
    if (GRASS.m[k]) { scene.remove(GRASS.m[k]); GRASS.m[k].dispose(); }
    const m = new THREE.InstancedMesh(grassClump(k === 1), VEG.mat, GRASS.max); m.count = 0; m.frustumCulled = false; m.receiveShadow = true; scene.add(m); GRASS.m[k] = m;
  }
  GRASS.q = q; GRASS.cx = 1e9;
}
// a hash of a place of the grid: the same numbers every time
const ghash = (i, j, s) => { let h = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(s, 1442695041)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
function grassUpdate() {
  if (!VEG.mat || !camera) return;
  if (!GRASS.m[0] || GRASS.q !== SET.q) grassBuild();
  const c = camera.position;
  if (Math.hypot(c.x - GRASS.cx, c.z - GRASS.cz) < 3) return;
  GRASS.cx = c.x; GRASS.cz = c.z;
  const cs = GRASS.cs, R = GRASS.R, i0 = Math.floor((c.x - R) / cs), i1 = Math.floor((c.x + R) / cs), j0 = Math.floor((c.z - R) / cs), j1 = Math.floor((c.z + R) / cs);
  const n = [0, 0], M = GRASS.m, v = P.human && ownCamp(), vr = v ? villageR() + 4 : 0;
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
    for (let s = 0; s < 3; s++) {
      const x = (i + ghash(i, j, s * 3 + 1)) * cs, z = (j + ghash(i, j, s * 3 + 2)) * cs, d = Math.hypot(x - c.x, z - c.z);
      if (d > R || Math.abs(x) > LIMIT || Math.abs(z) > LIMIT) continue;
      const k = grassAt(x, z, ghash(i, j, s * 3 + 3)); if (k < 0 || n[k] >= GRASS.max) continue;
      if (v && Math.hypot(x - v.x, z - v.z) < vr) continue;
      const sc = (0.75 + ghash(i, j, s + 11) * 0.6) * smooth(R, R - 7, d), ry = ghash(i, j, s + 17) * TAU;
      _gp.set(x, getH(x, z) - 0.05, z); _gq.setFromEuler(_ge.set(0, ry, 0)); _gs.set(sc, sc * (0.8 + ghash(i, j, s + 23) * 0.5), sc); _gm.compose(_gp, _gq, _gs);
      M[k].setMatrixAt(n[k]++, _gm);
    }
  }
  for (let k = 0; k < 2; k++) { M[k].count = n[k]; M[k].instanceMatrix.needsUpdate = true; }
}
// which grass grows at a place (-1: none, 0: green, 1: dry), from the land, the ground and the forest
function grassAt(x, z, r) {
  const i = nearIdx(x, z), h = HM[i], ny = NY[i];
  if (h < 0.7 || ny < 0.82 || (WSURF[i] > h - 0.1) || CLAYM[i] > 0.2) return -1;
  const L = landW(x, z), fo = FOREST[i];
  let p = 0, dry = 0;
  // the jungle: thick grass in the clearings and the meadows, none on the dark forest floor (the ferns are there)
  p += L[0] * (fo < 0.45 ? 0.9 - fo * 1.6 : 0);
  // the north: grass among the pines, none on the snow
  const far = smooth(-950, -1200, z); p += L[1] * (1 - far) * 0.55; dry += L[1] * 0.3;
  p += L[2] * 0.6; dry += L[2];
  p += L[3] * (h < 26 ? 0.12 : 0); dry += L[3];
  p += L[4] * (h > 1.6 && z < coastZ(x) - 120 ? 0.8 : 0) * (1 - fo * 0.6);
  if (r > p) return -1;
  if (nearCamp(x, z, 7) || trunkPush(_gp.set(x, 0, z), 0.4)) return -1;
  return dry > 0.5 ? 1 : 0;
}
