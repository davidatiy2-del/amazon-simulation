// ================= WORLD =================
const W = { size: 3000, half: 1500, N: 960 }; W.cell = W.size / W.N; W.V = W.N + 1;
const GN = W.size / 10, CGN = W.size / 25, SHN = W.size / 20;   // 10 m, 25 m and 20 m lookup grids
// each lookup grid holds two blocks: the New World's, and after it the Old World's (east of OLDX, around x = 4500)
const OLDX = 2250, OLDC = 4500;
const gxo = x => x > OLDX ? x - OLDC : x;
const g10c = x => clamp(((gxo(x) + W.half) / 10) | 0, 0, GN - 1);
const g10r = (x, z) => clamp(((z + W.half) / 10) | 0, 0, GN - 1) + (x > OLDX ? GN : 0);
const g10 = (x, z) => g10r(x, z) * GN + g10c(x);
const g10c1 = x => clamp(((gxo(x) + W.half) / 10) | 0, 1, GN - 2);
const g10r1 = (x, z) => clamp(((z + W.half) / 10) | 0, 1, GN - 2) + (x > OLDX ? GN : 0);
const g25 = (x, z) => (clamp(((z + W.half) / 25) | 0, 0, CGN - 1) + (x > OLDX ? CGN : 0)) * CGN + clamp(((gxo(x) + W.half) / 25) | 0, 0, CGN - 1);
const NV = W.V * W.V;
const HM = new Float32Array(NV), WSURF = new Float32Array(NV).fill(-999), FOREST = new Float32Array(NV),
  STREAMD = new Float32Array(NV).fill(999), CLAYM = new Float32Array(NV), NY = new Float32Array(NV);
const WATER_Y = 0, LIMIT = 1440;
const MID = 750, JL = 690;   // the jungle: the square of the old world and its old border
const MI0 = Math.round((W.half - MID) / W.cell), MI1 = W.N - MI0;   // the jungle's square on the grid
const WR = JL - 55;   // how far the jungle's wandering animals and their homes may go
const TEP = { x: 70, z: -255, r: 95, top: 92 };
let RIVER = [], STREAMS = [], LAKE = null, FALL = null, CLAY = null;
const POI = [];
const gx = i => -W.half + i * W.cell;

function tepR(th) { return TEP.r + 11 * Noise.n2(Math.cos(th) * 1.6 + 3.1, Math.sin(th) * 1.6 - 2.2); }
function rawH(x, z, grown) {
  const nx = x / (grown ? MID : 500), nz = z / (grown ? MID : 500);
  const e = Math.pow(Math.pow(Math.abs(nx), 5) + Math.pow(Math.abs(nz), 5), 0.2);
  let h = 3.2 + Noise.fbm(x * 0.0055 + 11, z * 0.0055 - 7, 4) * 6.5 + Noise.fbm(x * 0.03, z * 0.03, 2) * 1.2;
  const hl = Math.max(0, Noise.fbm(x * 0.0042 - 31, z * 0.0042 + 17, 3) - 0.05);
  h += hl * hl * 70;
  const mt = grown ? smooth(0.8, 0.985, e) : smooth(0.7, 0.97, e);
  if (mt > 0) h += mt * (55 + Noise.ridge(x * 0.007, z * 0.007, 4) * 95) + mt * mt * 30;
  const dx = x - TEP.x, dz = z - TEP.z, d = Math.hypot(dx, dz);
  if (d < TEP.r + 75) {
    const R = tepR(Math.atan2(dz, dx));
    const cliff = smooth(R + 6, R - 5, d), talus = smooth(R + 50, R + 4, d) * 13;
    const top = TEP.top + Noise.fbm(x * 0.03, z * 0.03, 2) * 3;
    h = Math.max(h, lerp(h + talus, top, cliff));
  }
  return h;
}
// the height a walker stands at: the land, or a bridge deck above it
function getH(x, z) { const h = getHT(x, z); return BRG.n ? bridgeH(x, z, h) : h; }
// the land alone, without bridges
function getHT(x, z) {
  if (x <= -W.half || x >= W.half || z <= -W.half || z >= W.half) return farH(x, z);
  const fx = (x + W.half) / W.cell, fz = (z + W.half) / W.cell;
  let ix = Math.floor(fx), iz = Math.floor(fz);
  if (ix < 0) ix = 0; else if (ix > W.N - 1) ix = W.N - 1;
  if (iz < 0) iz = 0; else if (iz > W.N - 1) iz = W.N - 1;
  const tx = clamp(fx - ix, 0, 1), tz = clamp(fz - iz, 0, 1), i = iz * W.V + ix;
  const a = HM[i], b = HM[i + 1], c = HM[i + W.V], d = HM[i + W.V + 1];
  if (tx + tz <= 1) return a + (b - a) * tx + (c - a) * tz;
  return d + (c - d) * (1 - tx) + (b - d) * (1 - tz);
}
function nearIdx(x, z) {
  const ix = clamp(Math.round((x + W.half) / W.cell), 0, W.N), iz = clamp(Math.round((z + W.half) / W.cell), 0, W.N);
  return iz * W.V + ix;
}
const getNY = (x, z) => inMain(x, z) ? NY[nearIdx(x, z)] : inOld(x, z) ? NY2[owIdx(x, z)] : 1;
const gridAt = (arr, x, z) => inMain(x, z) ? arr[nearIdx(x, z)] : owAt(arr, x, z);
function waterAt(x, z) { const h = getH(x, z); if (h < WATER_Y) return WATER_Y; const ws = inMain(x, z) ? WSURF[nearIdx(x, z)] : -999; return ws > h ? ws : -999; }
function waterDepth(x, z) { const h = getH(x, z); if (h < WATER_Y) return WATER_Y - h; const ws = inMain(x, z) ? WSURF[nearIdx(x, z)] : -999; return ws > h ? ws - h : 0; }
// the water as a canoe sees it: it runs on under a bridge
function waterAtT(x, z) { const h = getHT(x, z); if (h < WATER_Y) return WATER_Y; const ws = inMain(x, z) ? WSURF[nearIdx(x, z)] : -999; return ws > h ? ws : -999; }
function waterDepthT(x, z) { const h = getHT(x, z); if (h < WATER_Y) return WATER_Y - h; const ws = inMain(x, z) ? WSURF[nearIdx(x, z)] : -999; return ws > h ? ws - h : 0; }
const inBounds = (x, z) => Math.abs(z) < LIMIT && (Math.abs(x) < LIMIT || Math.abs(x - OW.cx) < LIMIT);

function catmull(pts, step) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const n = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step));
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push({ x: f(p0[0], p1[0], p2[0], p3[0]), z: f(p0[1], p1[1], p2[1], p3[1]) });
    }
  }
  const l = pts[pts.length - 1]; out.push({ x: l[0], z: l[1] });
  return out;
}
function nearestOnPoly(px, pz, P) {
  let best = 1e18, bi = 0, bf = 0;
  for (let i = 0; i < P.length - 1; i++) {
    const ax = P[i].x, az = P[i].z, bx = P[i + 1].x - ax, bz = P[i + 1].z - az, l2 = bx * bx + bz * bz;
    let f = l2 > 0 ? ((px - ax) * bx + (pz - az) * bz) / l2 : 0; f = f < 0 ? 0 : f > 1 ? 1 : f;
    const dx = px - (ax + bx * f), dz = pz - (az + bz * f), d = dx * dx + dz * dz;
    if (d < best) { best = d; bi = i; bf = f; }
  }
  return [Math.sqrt(best), bi + bf];
}
function polyBBox(P, pad) {
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
  for (const p of P) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z); }
  return [x0 - pad, x1 + pad, z0 - pad, z1 + pad];
}
function forGrid(bb, fn) {
  const ix0 = clamp(Math.floor((bb[0] + W.half) / W.cell), 0, W.N), ix1 = clamp(Math.ceil((bb[1] + W.half) / W.cell), 0, W.N);
  const iz0 = clamp(Math.floor((bb[2] + W.half) / W.cell), 0, W.N), iz1 = clamp(Math.ceil((bb[3] + W.half) / W.cell), 0, W.N);
  for (let iz = iz0; iz <= iz1; iz++) for (let ix = ix0; ix <= ix1; ix++) fn(iz * W.V + ix, gx(ix), gx(iz));
}
function carveDisk(cx, cz, r, depth, bank) {
  const pad = r + bank + 12;
  forGrid([cx - pad, cx + pad, cz - pad, cz + pad], (i, x, z) => {
    const a = Math.atan2(z - cz, x - cx), d = Math.hypot(x - cx, z - cz);
    const R = r + 5 * Noise.n2(Math.cos(a) * 1.5 + 9, Math.sin(a) * 1.5 + 2.2);
    let h = HM[i];
    if (d < R) { const k = d / R; h = Math.min(h, -depth * (1 - k * k) - 0.3); }
    else h = Math.min(h, lerp(0.4, h, smooth(R, R + bank, d)));
    HM[i] = h;
  });
}
function carveRiver(P) {
  forGrid(polyBBox(P, 45), (i, x, z) => {
    const r = nearestOnPoly(x, z, P), d = r[0], hw = P[Math.min(P.length - 1, Math.round(r[1]))].w / 2;
    if (d > hw + 30) return;
    let h = HM[i];
    if (d < hw) { const k = d / hw; h = Math.min(h, -3.4 * (1 - k * k) - 0.3); }
    else h = Math.min(h, lerp(0.35, h, smooth(hw, hw + 26, d)));
    HM[i] = h;
  });
}
function makePath(ax, az, bx, bz, step, wig, seed) {
  const L = Math.hypot(bx - ax, bz - az), n = Math.ceil(L / step), px = -(bz - az) / L, pz = (bx - ax) / L, pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, off = Noise.fbm(t * 3.2 + seed, seed * 1.7, 3) * wig * Math.sin(Math.PI * t);
    pts.push({ x: lerp(ax, bx, t) + px * off, z: lerp(az, bz, t) + pz * off });
  }
  return pts;
}
function makeStream(ax, az, bx, bz, hw, seed, wig) {
  let path = makePath(ax, az, bx, bz, 3, wig, seed);
  const n0 = path.length; let prof = new Float32Array(n0);
  for (let i = 0; i < n0; i++) prof[i] = getH(path[i].x, path[i].z);
  for (let i = 1; i < n0; i++) prof[i] = Math.min(prof[i], prof[i - 1]);
  const sm = new Float32Array(n0);
  for (let i = 0; i < n0; i++) { let s = 0; for (let k = -3; k <= 3; k++) s += prof[clamp(i + k, 0, n0 - 1)]; sm[i] = s / 7; }
  let end = n0 - 1;
  for (let i = 6; i < n0; i++) if (sm[i] < 0.6) { end = Math.min(n0 - 1, i + 3); break; }
  path = path.slice(0, end + 1);
  const bed = [], surf = [];
  for (let i = 0; i <= end; i++) { bed.push(sm[i] - 1.0); surf.push(Math.max(sm[i] - 0.45, 0.05)); }
  forGrid(polyBBox(path, hw + 14), (i, x, z) => {
    const r = nearestOnPoly(x, z, path), d = r[0]; if (d > hw + 12) return;
    const i0 = Math.floor(r[1]), f = r[1] - i0, i1 = Math.min(i0 + 1, path.length - 1);
    const b = lerp(bed[i0], bed[i1], f), sf = lerp(surf[i0], surf[i1], f);
    let h = HM[i];
    if (d < hw) h = Math.min(h, b + (d / hw) * (d / hw) * 0.75);
    else h = Math.min(h, lerp(sf + 0.2, h, smooth(hw, hw + 10, d)));
    HM[i] = h;
    if (d < hw + 0.8 && sf > 0.25) WSURF[i] = Math.max(WSURF[i], sf);
    if (d < STREAMD[i]) STREAMD[i] = d;
  });
  return { path, bed, surf, hw };
}

function genWorld() {
  for (let iz = MI0; iz <= MI1; iz++) for (let ix = MI0; ix <= MI1; ix++) HM[iz * W.V + ix] = rawH(gx(ix), gx(iz));
  const fdx = -80, fdz = 195, fl = Math.hypot(fdx, fdz), dir = { x: fdx / fl, z: fdz / fl };
  const th = Math.atan2(dir.z, dir.x), R = tepR(th);
  const E = { x: TEP.x + dir.x * (R - 4), z: TEP.z + dir.z * (R - 4) };
  LAKE = { x: TEP.x + dir.x * (R + 36), z: TEP.z + dir.z * (R + 36), r: 31 };
  carveDisk(LAKE.x, LAKE.z, LAKE.r, 4.6, 20);
  const L = LAKE;
  const ctrl = [[L.x, L.z], [L.x + dir.x * 26, L.z + dir.z * 26], [-35, -55], [-80, 25], [-40, 105], [35, 150], [70, 225], [25, 295], [-35, 350], [-20, 430], [0, 560]];
  RIVER = catmull(ctrl, 4).map((p, i) => ({ x: p.x, z: p.z, w: 19 + 7 * Noise.n2(i * 0.025, 5.5) }));
  carveRiver(RIVER);
  const rs = f => RIVER[Math.floor(f * (RIVER.length - 1))];
  const tA = rs(0.3), tB = rs(0.57);
  STREAMS.push(makeStream(445, -30, tA.x + 6, tA.z, 3.4, 1.3, 26));
  STREAMS.push(makeStream(-445, 150, tB.x - 6, tB.z, 3.0, 4.1, 30));
  const sth = th + 2.2;
  const ps = makeStream(TEP.x + Math.cos(sth) * 38, TEP.z + Math.sin(sth) * 38, E.x, E.z, 2.6, 7.7, 10);
  ps.plateau = true; STREAMS.push(ps);
  FALL = { x: E.x, z: E.z, dir, top: ps.surf[ps.surf.length - 1] };
  // clay lick on a river bank
  const ci = Math.floor(0.64 * (RIVER.length - 1)), c0 = RIVER[ci], c1 = RIVER[ci + 1];
  let px = -(c1.z - c0.z), pz = c1.x - c0.x; const pl = Math.hypot(px, pz); px /= pl; pz /= pl;
  CLAY = { x: c0.x + px * (c0.w / 2 + 7), z: c0.z + pz * (c0.w / 2 + 7) };
  forGrid([CLAY.x - 16, CLAY.x + 16, CLAY.z - 16, CLAY.z + 16], (i, x, z) => {
    const d = Math.hypot(x - CLAY.x, z - CLAY.z); CLAYM[i] = Math.max(CLAYM[i], smooth(13, 5, d));
    if (d < 11) HM[i] = Math.max(HM[i], 0.7);
  });
  // normals & forest mask
  for (let iz = 0; iz < W.V; iz++) for (let ix = 0; ix < W.V; ix++) {
    const i = iz * W.V + ix;
    const hl = HM[iz * W.V + Math.max(0, ix - 1)], hr = HM[iz * W.V + Math.min(W.N, ix + 1)];
    const hd = HM[Math.max(0, iz - 1) * W.V + ix], hu = HM[Math.min(W.N, iz + 1) * W.V + ix];
    const nx = (hl - hr) / (2 * W.cell), nz = (hd - hu) / (2 * W.cell);
    NY[i] = 1 / Math.sqrt(nx * nx + nz * nz + 1);
  }
  for (let iz = MI0; iz <= MI1; iz++) for (let ix = MI0; ix <= MI1; ix++) {
    const i = iz * W.V + ix, x = gx(ix), z = gx(iz), h = HM[i];
    let f = smooth(-0.42, -0.02, Noise.fbm(x * 0.0075 + 40, z * 0.0075 - 12, 3));
    f *= smooth(0.6, 2.4, h) * (1 - smooth(110, 160, h)) * smooth(0.55, 0.8, NY[i]);
    if (STREAMD[i] < 5) f *= 0.3;
    if (CLAYM[i] > 0.05) f *= 0.05;
    if (h > 75 && Math.hypot(x - TEP.x, z - TEP.z) < TEP.r + 10) f *= 0.35;
    FOREST[i] = f;
  }
  POI.push({ x: FALL.x + dir.x * 14, z: FALL.z + dir.z * 14, n: 'המפל הגדול' }, { x: TEP.x, z: TEP.z - 10, n: 'הר השולחן' },
    { x: LAKE.x, z: LAKE.z, n: 'אגם המפל' }, { x: CLAY.x, z: CLAY.z, n: 'גדת החימר' });
  const rp = rs(0.42); POI.push({ x: rp.x, z: rp.z, n: 'הנהר הגדול' });
  worldGrow();
  worldOuter();
  worldEdgeSea();
  oldWorldGen();
  buildWaterGrid();
}

// nearest-water lookup grid (8 m cells, BFS)
const WG = { o: -MID - 8 * Math.ceil((W.half - MID) / 8), n: 0, cs: 8, near: null }; WG.n = Math.ceil(-2 * WG.o / 8);
function buildWaterGrid() {
  const n = WG.n, near = new Int32Array(n * n).fill(-1), q = new Int32Array(n * n); let qh = 0, qt = 0;
  for (let iz = 0; iz < n; iz++) for (let ix = 0; ix < n; ix++) {
    const k = iz * n + ix, x = WG.o + (ix + 0.5) * WG.cs, z = WG.o + (iz + 0.5) * WG.cs;
    if (waterDepth(x, z) > 0.3) { near[k] = k; q[qt++] = k; }
  }
  while (qh < qt) {
    const k = q[qh++], ix = k % n, iz = (k / n) | 0;
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      const jx = ix + dx, jz = iz + dz; if (jx < 0 || jz < 0 || jx >= n || jz >= n) continue;
      const j = jz * n + jx; if (near[j] < 0) { near[j] = near[k]; q[qt++] = j; }
    }
  }
  WG.near = near;
}
function nearestWater(x, z) {
  const n = WG.n, ix = clamp(((x - WG.o) / WG.cs) | 0, 0, n - 1), iz = clamp(((z - WG.o) / WG.cs) | 0, 0, n - 1);
  const k = WG.near[iz * n + ix]; if (k < 0) return null;
  return { x: WG.o + (k % n + 0.5) * WG.cs, z: WG.o + (((k / n) | 0) + 0.5) * WG.cs };
}
function randLand(test, tries = 400) {
  for (let t = 0; t < tries; t++) {
    const x = rr(-LIMIT + 20, LIMIT - 20), z = rr(-LIMIT + 20, LIMIT - 20);
    if (waterDepth(x, z) > 0) continue;
    const h = getH(x, z); if (h < 0.4 || getNY(x, z) < 0.72) continue;
    if (!test || test(x, z, h)) return { x, z };
  }
  return null;
}

// ---------- terrain mesh ----------
let terrain, terrainMat;
const TUNI = { tDetail: { value: null }, uVeg: { value: 250 }, uCanopy: { value: new THREE.Color('#24421b') } };
function makeDetailTex() {
  const S = 256, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const ctx = cv.getContext('2d'), img = ctx.createImageData(S, S);
  const octs = [[8, 0.45, 11], [16, 0.28, 12], [32, 0.16, 13], [64, 0.11, 14]];
  const L = octs.map(o => { const r = mulberry32(o[2]), a = new Float32Array(o[0] * o[0]); for (let i = 0; i < a.length; i++) a[i] = r(); return a; });
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    let v = 0;
    for (let k = 0; k < octs.length; k++) {
      const per = octs[k][0], fx = x / S * per, fy = y / S * per, ix = Math.floor(fx), iy = Math.floor(fy);
      const tx = fx - ix, ty = fy - iy, sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty), a = L[k];
      const g = (i, j) => a[(j % per) * per + (i % per)];
      v += octs[k][1] * lerp(lerp(g(ix, iy), g(ix + 1, iy), sx), lerp(g(ix, iy + 1), g(ix + 1, iy + 1), sx), sy);
    }
    const val = 120 + v * 135, p = (y * S + x) * 4;
    img.data[p] = val; img.data[p + 1] = val * 0.985; img.data[p + 2] = val * 0.96; img.data[p + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const r = mulberry32(99);
  for (let i = 0; i < 700; i++) {
    const x = r() * S, y = r() * S, w = 2 + r() * 5, h = 1 + r() * 2.4, a = r() * Math.PI, dark = r() < 0.62;
    ctx.fillStyle = dark ? `rgba(30,22,10,${0.18 + r() * 0.3})` : `rgba(255,236,190,${0.1 + r() * 0.16})`;
    for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {
      if (x + ox < -10 || x + ox > S + 10 || y + oy < -10 || y + oy > S + 10) continue;
      ctx.beginPath(); ctx.ellipse(x + ox, y + oy, w, h, a, 0, TAU); ctx.fill();
    }
  }
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
  return t;
}
function buildTerrain() {
  const pos = new Float32Array(NV * 3), nor = new Float32Array(NV * 3), colA = new Float32Array(NV * 3), fo = new Float32Array(NV);
  const TC = {
    mud: col('#523f2c'), deep: col('#2e2a1e'), bank: col('#66533a'), f1: col('#4d4629'), f2: col('#38461f'), moss: col('#4a6c28'),
    grass: col('#56772b'), rock: col('#6c675b'), rockD: col('#45423a'), tep: col('#8b5236'), tepD: col('#4a2c22'), clay: col('#b9653a'), high: col('#55663a')
  };
  const c = new THREE.Color();
  for (let iz = 0; iz < W.V; iz++) for (let ix = 0; ix < W.V; ix++) {
    const i = iz * W.V + ix, x = gx(ix), z = gx(iz), h = HM[i];
    pos[i * 3] = x; pos[i * 3 + 1] = h; pos[i * 3 + 2] = z;
    const hl = HM[iz * W.V + Math.max(0, ix - 1)], hr = HM[iz * W.V + Math.min(W.N, ix + 1)];
    const hd = HM[Math.max(0, iz - 1) * W.V + ix], hu = HM[Math.min(W.N, iz + 1) * W.V + ix];
    let nx = (hl - hr) / (2 * W.cell), nz = (hd - hu) / (2 * W.cell); const il = 1 / Math.sqrt(nx * nx + nz * nz + 1);
    nor[i * 3] = nx * il; nor[i * 3 + 1] = il; nor[i * 3 + 2] = nz * il;
    const ny = il, n1 = Noise.fbm(x * 0.045, z * 0.045, 2), n2 = Noise.n2(x * 0.13, z * 0.13);
    if (h < -0.15) c.copy(TC.mud).lerp(TC.deep, smooth(-0.2, -3, h));
    else if (h < 1.1) c.copy(TC.bank).lerp(TC.f1, smooth(0.25, 1.1, h));
    else c.copy(TC.f1).lerp(TC.f2, clamp(0.5 + n1 * 0.9, 0, 1));
    const open = (1 - FOREST[i]) * smooth(1.0, 2.6, h) * (1 - smooth(70, 110, h)) * smooth(0.6, 0.95, ny);
    c.lerp(TC.grass, open * 0.75);
    c.lerp(TC.moss, clamp(n2 * 0.5 + 0.2, 0, 1) * 0.4 * FOREST[i]);
    if (h > 60) c.lerp(TC.high, smooth(60, 110, h) * 0.6);
    const steep = smooth(0.74, 0.5, ny);
    c.lerp(TC.rockD.clone().lerp(TC.rock, 0.5 + n2 * 0.5), steep);
    const td = Math.hypot(x - TEP.x, z - TEP.z);
    if (td < TEP.r + 30 && h > 12) {
      const streak = 0.5 + 0.5 * Math.sin(h * 0.85 + Noise.n2(x * 0.08, z * 0.08) * 5);
      c.lerp(TC.tep.clone().lerp(TC.tepD, streak * 0.75), steep * 0.92);
      if (h > 85 && steep < 0.3) c.lerp(TC.rock, 0.35);
    }
    if (CLAYM[i] > 0) c.lerp(TC.clay, CLAYM[i] * (0.8 + n2 * 0.2));
    if (Math.abs(x) > MID - 70 || Math.abs(z) > MID - 70) regionColor(c, i, x, z, h, ny, n1, n2);
    colA[i * 3] = c.r; colA[i * 3 + 1] = c.g; colA[i * 3 + 2] = c.b;
    if (TCOL) { TCOL[i * 3] = Math.pow(c.r, 0.4545) * 255; TCOL[i * 3 + 1] = Math.pow(c.g, 0.4545) * 255; TCOL[i * 3 + 2] = Math.pow(c.b, 0.4545) * 255; }
    fo[i] = FOREST[i];
  }
  const idx = new Uint32Array(W.N * W.N * 6); let k = 0;
  for (let iz = 0; iz < W.N; iz++) for (let ix = 0; ix < W.N; ix++) {
    const a = iz * W.V + ix, b = a + 1, cc = a + W.V, d = cc + 1;
    idx[k++] = a; idx[k++] = cc; idx[k++] = b; idx[k++] = b; idx[k++] = cc; idx[k++] = d;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colA, 3));
  geo.setAttribute('aForest', new THREE.BufferAttribute(fo, 1));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  geo.computeBoundingSphere();
  TUNI.tDetail.value = makeDetailTex();
  terrainMat = new THREE.MeshLambertMaterial({ vertexColors: true });
  terrainMat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, TUNI);
    sh.vertexShader = 'attribute float aForest;\nvarying float vForest;\nvarying vec3 vWP;\nvarying vec3 vWN;\n' +
      sh.vertexShader.replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvWN = normalize(mat3(modelMatrix) * objectNormal);\nvForest = aForest;');
    sh.fragmentShader = 'uniform sampler2D tDetail;\nuniform float uVeg;\nuniform vec3 uCanopy;\nvarying float vForest;\nvarying vec3 vWP;\nvarying vec3 vWN;\n' +
      sh.fragmentShader
        .replace('#include <map_fragment>', `vec3 an = abs(normalize(vWN)); an = an*an*an*an; an /= (an.x + an.y + an.z);
          vec3 dX = texture2D(tDetail, vWP.zy * 0.11).rgb, dY = texture2D(tDetail, vWP.xz * 0.085).rgb, dZ = texture2D(tDetail, vWP.xy * 0.11).rgb;
          vec3 det = (dX * an.x + dY * an.y + dZ * an.z) * 1.32;
          float big = texture2D(tDetail, vWP.xz * 0.0123 + 0.31).r * 1.32;
          diffuseColor.rgb *= det * (0.72 + 0.34 * big);`)
        .replace('#include <color_fragment>', `#include <color_fragment>
          float dcam = length(vWP.xz - cameraPosition.xz);
          float farF = smoothstep(uVeg * 0.5, uVeg * 0.9, dcam) * vForest;
          diffuseColor.rgb = mix(diffuseColor.rgb, uCanopy * (0.62 + 0.5 * big), farF);`)
        .replace('#include <fog_fragment>', `#ifdef USE_FOG
          #ifdef FOG_EXP2
            float fogFactor = 1.0 - exp(- fogDensity * fogDensity * 0.45 * vFogDepth * vFogDepth);
          #else
            float fogFactor = smoothstep(fogNear, fogFar, vFogDepth);
          #endif
          gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, fogFactor);
          #endif`);
  };
  terrain = terrainChunks(geo, terrainMat);
}

// ================= WATER =================
const GLSL_N = `
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float n21(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(h21(i), h21(i+vec2(1.0,0.0)), f.x), mix(h21(i+vec2(0.0,1.0)), h21(i+vec2(1.0,1.0)), f.x), f.y); }
float fbm2(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++){ s += a * n21(p); p = p * 2.03 + 17.1; a *= 0.5; } return s; }
`;
const WUNI = {
  uTime: { value: 0 }, uSunDir: { value: new V3(0, 1, 0) }, uSunCol: { value: new THREE.Color(1, 1, 1) },
  uSky: { value: new THREE.Color('#6fa0d8') }, uHor: { value: new THREE.Color('#b8cfd8') }, uUnder: { value: 0 }, uLight: { value: 1 }, uClear: { value: 0 }
};
const PSCALE = { value: 600 };
let waterMat, water, streamMat, fallMat, mist;

function buildWater() {
  const S = W.V, data = new Uint8Array(S * S * 4);
  for (let i = 0; i < NV; i++) { const v = clamp((HM[i] + 8) / 16, 0, 1) * 255; data[i * 4] = v; data[i * 4 + 1] = WBLUE ? WBLUE[i] : 0; data[i * 4 + 2] = clamp(-HM[i] / 40, 0, 1) * 255; data[i * 4 + 3] = 255; }
  const ht = new THREE.DataTexture(data, S, S, THREE.RGBAFormat);
  ht.magFilter = ht.minFilter = THREE.LinearFilter; ht.needsUpdate = true;
  waterMat = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
      tH: { value: null }, uDeep: { value: new THREE.Color('#1a2614') }, uShallow: { value: new THREE.Color('#58603a') }, uSeaD: { value: new THREE.Color('#06283d') }, uSeaS: { value: new THREE.Color('#2a9a92') },
      uS: { value: S }, uCell: { value: W.cell }, uHalf: { value: W.half }, tH2: { value: null }, uO2: { value: new THREE.Vector4(OW.x0, OW.z0, OW.cell, OW.V) }
    }]),
    vertexShader: `varying vec3 vW;
      #include <fog_pars_vertex>
      void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
      #include <fog_vertex>
      }`,
    fragmentShader: `uniform float uTime, uUnder, uS, uCell, uHalf, uLight, uClear; uniform vec3 uSunDir, uSunCol, uSky, uHor, uDeep, uShallow, uSeaD, uSeaS; uniform sampler2D tH; uniform sampler2D tH2; uniform vec4 uO2;
      varying vec3 vW;
      #include <fog_pars_fragment>
      ${GLSL_N}
      float wh(vec2 p){ float t = uTime; return n21(p*0.33 + vec2(t*0.22, t*0.15))*0.36 + n21(p*0.95 - vec2(t*0.41, -t*0.29))*0.15 + n21(p*2.3 + vec2(t*0.75, t*0.52))*0.05; }
      void main(){
        vec2 uv = ((vW.xz + uHalf) / uCell + 0.5) / uS;
        vec3 tq = texture2D(tH, uv).rgb; float th = tq.r * 16.0 - 8.0, blue = tq.g;
        float depth = max(0.0, -th); if (tq.b > 0.2) depth = max(depth, tq.b * 40.0);
        if (abs(vW.x) > uHalf || abs(vW.z) > uHalf) {
          vec2 u2 = ((vW.xz - uO2.xy) / uO2.z + 0.5) / uO2.w;
          if (u2.x > 0.0 && u2.x < 1.0 && u2.y > 0.0 && u2.y < 1.0) { vec3 t2 = texture2D(tH2, u2).rgb; depth = max(0.0, 8.0 - t2.r * 16.0); if (t2.b > 0.2) depth = max(depth, t2.b * 40.0); blue = t2.g; }
          else { depth = 30.0; blue = 1.0; }
        }
        float e = 0.12; float h0 = wh(vW.xz);
        float wk = 0.55 + blue * 0.75; vec3 n = normalize(vec3(-(wh(vW.xz + vec2(e,0.0)) - h0) / e * wk, 1.0, -(wh(vW.xz + vec2(0.0,e)) - h0) / e * wk));
        vec3 V = normalize(cameraPosition - vW);
        vec3 col; float alpha;
        if (uUnder > 0.5) {
          float up = pow(max(dot(n, -V), 0.0), 1.5);
          col = mix(uDeep * 1.6, uHor * 0.9 * uLight, up * 0.8); alpha = 0.9;
        } else {
          float fres = mix(0.05, 1.0, pow(1.0 - max(dot(n, V), 0.0), 4.0));
          vec3 R = reflect(-V, n);
          vec3 refl = mix(uHor, uSky, clamp(R.y * 1.6, 0.0, 1.0));
          vec3 body = mix(mix(uShallow, uSeaS, blue), mix(uDeep, uSeaD, blue), smoothstep(0.0, mix(3.2, 11.0, blue), depth)) * (0.35 + 0.65 * uLight);
          col = mix(body, refl, fres * 0.85);
          vec3 H = normalize(uSunDir + V);
          col += uSunCol * pow(max(dot(n, H), 0.0), 260.0) * 2.4;
          float foam = smoothstep(0.42, 0.0, depth) * (0.45 + 0.55 * n21(vW.xz * 1.6 + uTime * 0.5));
          col = mix(col, vec3(0.78, 0.76, 0.66) * (0.3 + 0.7 * uLight), foam * 0.5);
          alpha = mix(mix(0.5, 0.3, blue), 0.95, smoothstep(0.0, mix(2.0, 6.0, blue), depth)) * mix(1.0, mix(0.4, 1.0, fres), uClear); alpha = max(alpha, foam * 0.7);
        }
        gl_FragColor = vec4(col, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: true
  });
  waterMat.uniforms.tH.value = ht;
  Object.assign(waterMat.uniforms, WUNI);
  const g = new THREE.PlaneGeometry(W.size * 3, W.size * 3, 1, 1); g.rotateX(-Math.PI / 2);
  water = new THREE.Mesh(g, waterMat); water.position.y = WATER_Y; water.renderOrder = 1;
  scene.add(water);
  buildStreams(); buildFall();
}

function buildStreams() {
  const P = [], UV = [], ST = [], IDX = []; let base = 0;
  for (const s of STREAMS) {
    const path = s.path, n = path.length; let acc = 0;
    for (let i = 0; i < n; i++) {
      const a = path[Math.max(0, i - 1)], b = path[Math.min(n - 1, i + 1)];
      let tx = b.x - a.x, tz = b.z - a.z; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
      const px = -tz, pz = tx, w = s.hw + 0.7, y = s.surf[i];
      const slope = Math.abs(s.surf[Math.max(0, i - 1)] - s.surf[Math.min(n - 1, i + 1)]) / 6;
      if (i > 0) acc += Math.hypot(path[i].x - path[i - 1].x, path[i].z - path[i - 1].z, s.surf[i] - s.surf[i - 1]);
      for (const side of [-1, 0, 1]) {
        P.push(path[i].x + px * w * side, y - (side === 0 ? 0.04 : 0), path[i].z + pz * w * side);
        UV.push(side, acc / 4); ST.push(clamp(slope * 2.4, 0, 1));
      }
      if (i < n - 1) { const r0 = base + i * 3, r1 = r0 + 3; for (let k = 0; k < 2; k++) IDX.push(r0 + k, r1 + k, r0 + k + 1, r0 + k + 1, r1 + k, r1 + k + 1); }
    }
    base += n * 3;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2));
  g.setAttribute('aSteep', new THREE.Float32BufferAttribute(ST, 1));
  g.setIndex(IDX); g.computeBoundingSphere();
  streamMat = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {}]),
    vertexShader: `attribute float aSteep; varying vec2 vUv; varying float vSt; varying vec3 vW;
      #include <fog_pars_vertex>
      void main(){ vUv = uv; vSt = aSteep; vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
      #include <fog_vertex>
      }`,
    fragmentShader: `uniform float uTime, uLight; uniform vec3 uSunDir, uSunCol, uSky, uHor; varying vec2 vUv; varying float vSt; varying vec3 vW;
      #include <fog_pars_fragment>
      ${GLSL_N}
      void main(){
        float sp = 1.2 + vSt * 5.0;
        float f = fbm2(vec2(vUv.x * 2.2, vUv.y * 1.2 - uTime * sp));
        float streak = n21(vec2(vUv.x * 9.0, vUv.y * 0.6 - uTime * sp * 1.4));
        vec3 base = mix(vec3(0.16, 0.2, 0.12), uSky * 0.55, 0.35) * (0.35 + 0.65 * uLight);
        float foam = clamp(vSt * 1.3 * (0.4 + 0.9 * f) + smoothstep(0.65, 1.0, abs(vUv.x)) * 0.35 + streak * vSt * 0.4, 0.0, 1.0);
        vec3 col = mix(base + vec3(0.06) * f, vec3(0.85, 0.88, 0.86) * (0.3 + 0.7 * uLight), foam);
        vec3 V = normalize(cameraPosition - vW);
        col += uSunCol * pow(max(dot(normalize(uSunDir + V), vec3(0.0,1.0,0.0) + vec3(f - 0.5, 0.0, streak - 0.5) * 0.3), 0.0), 120.0) * 0.8;
        float a = (0.78 + foam * 0.2) * smoothstep(1.0, 0.82, abs(vUv.x));
        gl_FragColor = vec4(col, a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: true
  });
  Object.assign(streamMat.uniforms, WUNI);
  const m = new THREE.Mesh(g, streamMat); m.renderOrder = 2; scene.add(m);
}

function buildFall() {
  const d = FALL.dir, px = -d.z, pz = d.x, top = FALL.top, bot = -0.5, H = top - bot, rows = 52, cols = 10;
  const P = [], UV = [], IDX = []; let outPrev = 1.5;
  for (let r = 0; r <= rows; r++) {
    const s = r / rows, y = top - s * H;
    let out = Math.max(outPrev, 1.5 + 17 * Math.sqrt(s));
    for (let k = 0; k < 14 && getH(FALL.x + d.x * out, FALL.z + d.z * out) > y - 1.2 && s > 0.02; k++) out += 1;
    outPrev = out;
    const w = lerp(4.0, 8.5, Math.pow(s, 0.8));
    for (let c = 0; c <= cols; c++) {
      const u = c / cols * 2 - 1, wob = Math.sin(s * 11 + u * 3) * 0.35;
      P.push(FALL.x + d.x * (out + wob) + px * w * u, y, FALL.z + d.z * (out + wob) + pz * w * u);
      UV.push(u, s * H / 5);
    }
    if (r < rows) for (let c = 0; c < cols; c++) { const a = r * (cols + 1) + c, b = a + 1, e = a + cols + 1, f = e + 1; IDX.push(a, e, b, b, e, f); }
  }
  FALL.base = { x: FALL.x + d.x * (outPrev + 1), z: FALL.z + d.z * (outPrev + 1) };
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2));
  g.setIndex(IDX); g.computeVertexNormals(); g.computeBoundingSphere();
  fallMat = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {}]),
    vertexShader: `varying vec2 vUv;
      #include <fog_pars_vertex>
      void main(){ vUv = uv; vec4 mvPosition = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mvPosition;
      #include <fog_vertex>
      }`,
    fragmentShader: `uniform float uTime, uLight; varying vec2 vUv;
      #include <fog_pars_fragment>
      ${GLSL_N}
      void main(){
        float s1 = n21(vec2(vUv.x * 14.0, vUv.y * 0.5 - uTime * 2.6));
        float s2 = fbm2(vec2(vUv.x * 5.0, vUv.y * 1.1 - uTime * 1.9));
        float w = clamp(s1 * 0.6 + s2 * 0.7, 0.0, 1.0);
        vec3 col = mix(vec3(0.42, 0.5, 0.48), vec3(0.95, 0.97, 0.96), w) * (0.25 + 0.75 * uLight);
        float edge = smoothstep(1.0, 0.55, abs(vUv.x + (s2 - 0.5) * 0.3));
        gl_FragColor = vec4(col, (0.45 + 0.5 * w) * edge);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: true
  });
  Object.assign(fallMat.uniforms, WUNI);
  const m = new THREE.Mesh(g, fallMat); m.renderOrder = 3; scene.add(m);
  // mist at the plunge pool
  const n = 240, pos = new Float32Array(n * 3), seed = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const a = rng() * TAU, r = Math.sqrt(rng()) * 9;
    pos[i * 3] = FALL.base.x + Math.cos(a) * r; pos[i * 3 + 1] = 0.3; pos[i * 3 + 2] = FALL.base.z + Math.sin(a) * r; seed[i] = rng();
  }
  const mg = new THREE.BufferGeometry();
  mg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); mg.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  mg.computeBoundingSphere(); mg.boundingSphere.radius += 30;
  const mm = new THREE.ShaderMaterial({
    uniforms: { uTime: WUNI.uTime, uLight: WUNI.uLight, uPS: PSCALE },
    vertexShader: `attribute float aSeed; uniform float uTime, uPS; varying float vA;
      void main(){ float t = fract(uTime * 0.06 + aSeed); vec3 p = position; p.y += t * 22.0;
        p.xz += vec2(sin(aSeed * 40.0 + uTime * 0.3), cos(aSeed * 31.0 + uTime * 0.27)) * t * 7.0;
        vA = (1.0 - t) * smoothstep(0.0, 0.12, t);
        vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_PointSize = (3.0 + 6.0 * t) * uPS / -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float uLight; varying float vA;
      void main(){ float a = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5)) * vA * 0.3; gl_FragColor = vec4(vec3(0.9, 0.93, 0.95) * (0.3 + 0.7 * uLight), a); }`,
    transparent: true, depthWrite: false
  });
  mist = new THREE.Points(mg, mm); mist.renderOrder = 4; scene.add(mist);
}

// ================= SKY / LIGHT / WEATHER =================
const SKY = { sunDir: new V3(0, 1, 0), moonDir: new V3(0, -1, 0), night: 0, day: 1, light: null, hemi: null, uni: null, mesh: null, under: false };
const SKC = {
  zenD: col('#4c8ad2'), zenG: col('#46598f'), zenN: col('#07122b'),
  horD: col('#bfd2d4'), horG: col('#f0a066'), horN: col('#131d33'),
  sunD: col('#fff0d8'), sunG: col('#ffa25c'), moon: col('#9db3ff'),
  skyLD: col('#b5cbe4'), skyLN: col('#1c2745'), gndD: col('#4a4a2a'), gndN: col('#11160d'),
  hazeD: col('#93a596'), rain: col('#6a7276'), under: col('#3c6b5c')
};
function buildSky() {
  SKY.uni = {
    uSun: { value: SKY.sunDir }, uMoon: { value: SKY.moonDir }, uZen: { value: new THREE.Color() }, uHor: { value: new THREE.Color() },
    uSunCol: { value: new THREE.Color() }, uNight: { value: 0 }, uCloud: { value: 0.35 }, uRain: { value: 0 }, uTime: WUNI.uTime
  };
  const mat = new THREE.ShaderMaterial({
    uniforms: SKY.uni,
    vertexShader: `varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform vec3 uSun, uMoon, uZen, uHor, uSunCol; uniform float uNight, uCloud, uRain, uTime; varying vec3 vDir;
      ${GLSL_N}
      float h31(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
      void main(){
        vec3 d = normalize(vDir); float h = d.y;
        vec3 col = mix(uHor, uZen, pow(clamp(h, 0.0, 1.0), 0.5));
        col = mix(col, uHor * 0.7, smoothstep(0.0, -0.3, h));
        float sd = max(dot(d, uSun), 0.0);
        float cl = 0.0;
        if (h > 0.0) {
          vec2 cp = d.xz / (h + 0.18) * 1.6 + vec2(uTime * 0.006, uTime * 0.002);
          cl = smoothstep(0.62 - uCloud * 0.34, 0.88, fbm2(cp * 1.3)) * smoothstep(0.0, 0.2, h);
        }
        col += uSunCol * (pow(sd, 1500.0) * 40.0 * (1.0 - cl) + pow(sd, 10.0) * 0.28 + pow(sd, 3.0) * 0.09);
        float md = max(dot(d, uMoon), 0.0);
        col += vec3(0.85, 0.9, 1.0) * (smoothstep(0.99955, 0.99975, md) * 1.5 + pow(md, 90.0) * 0.12) * uNight * (1.0 - cl);
        if (uNight > 0.01 && h > 0.03) {
          vec3 sp = d * 230.0; vec3 ci = floor(sp); float r = h31(ci);
          float st = step(0.9962, r) * smoothstep(0.42, 0.0, length(fract(sp) - 0.5));
          col += vec3(st) * uNight * (1.0 - cl) * (0.55 + 0.45 * sin(uTime * 2.5 + r * 60.0)) * smoothstep(0.03, 0.2, h);
        }
        vec3 cc = mix(vec3(1.0, 0.985, 0.96), uHor, 0.3) * mix(1.0, 0.16, uNight);
        cc = mix(cc, vec3(0.4, 0.43, 0.45) * mix(1.0, 0.25, uNight), uRain);
        cc += uSunCol * pow(sd, 6.0) * 0.45 * (1.0 - uNight);
        col = mix(col, cc, cl * 0.93);
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`,
    side: THREE.BackSide, depthWrite: false, fog: false, toneMapped: false
  });
  SKY.mesh = new THREE.Mesh(new THREE.SphereGeometry(800, 40, 20), mat);
  SKY.mesh.renderOrder = -10; SKY.mesh.frustumCulled = false;
  scene.add(SKY.mesh);
  SKY.light = new THREE.DirectionalLight(0xffffff, 2.5);
  const s = SKY.light.shadow; s.camera.near = 1; s.camera.far = 420; s.bias = -0.0004; s.normalBias = 0.05;
  scene.add(SKY.light, SKY.light.target);
  SKY.hemi = new THREE.HemisphereLight(0xbcd4ee, 0x3a3a20, 1.0); scene.add(SKY.hemi);
  scene.fog = new THREE.FogExp2(0x8fa0a0, 0.006);
  buildAmbientPoints(); buildRain();
}
function applyShadowQuality() {
  const q = QUAL[SET.q];
  renderer.shadowMap.enabled = q.sh > 0; renderer.shadowMap.type = SET.q === 'high' ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
  SKY.light.castShadow = q.sh > 0;
  if (q.sh > 0) {
    const s = SKY.light.shadow, ext = q.sh > 1500 ? 75 : 58;
    s.mapSize.set(q.sh, q.sh); s.camera.left = -ext; s.camera.right = ext; s.camera.top = ext; s.camera.bottom = -ext; s.camera.updateProjectionMatrix();
    if (s.map) { s.map.dispose(); s.map = null; }
  }
  scene.traverse(o => { if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.needsUpdate = true); } });
}
const _c1 = new THREE.Color(), _c2 = new THREE.Color(), _c3 = new THREE.Color();
function updateSky(dt, focus) {
  const ang = (G.time - 6) / 24 * TAU;
  SKY.sunDir.set(Math.cos(ang), Math.sin(ang), 0.32).normalize();
  SKY.moonDir.set(-Math.cos(ang), -Math.sin(ang), -0.22).normalize();
  const el = SKY.sunDir.y, rain = G.rain;
  const day = smooth(-0.1, 0.22, el), golden = (1 - smooth(0.04, 0.42, Math.abs(el))) * smooth(-0.2, 0.0, el);
  SKY.day = day; SKY.night = 1 - smooth(-0.2, 0.02, el);
  const zen = _c1.copy(SKC.zenN).lerp(SKC.zenD, day).lerp(SKC.zenG, golden * 0.55);
  const hor = _c2.copy(SKC.horN).lerp(SKC.horD, day).lerp(SKC.horG, golden * 0.75);
  zen.lerp(SKC.rain, rain * 0.6 * (0.3 + 0.7 * day)); hor.lerp(SKC.rain, rain * 0.55 * (0.3 + 0.7 * day));
  if (G.flash > 0) { zen.lerp(col('#dfe6ff'), G.flash); hor.lerp(col('#dfe6ff'), G.flash); }
  SKY.uni.uZen.value.copy(zen); SKY.uni.uHor.value.copy(hor);
  const sc = _c3.copy(SKC.sunD).lerp(SKC.sunG, golden);
  SKY.uni.uSunCol.value.copy(sc).multiplyScalar(smooth(-0.06, 0.05, el));
  SKY.uni.uNight.value = SKY.night;
  SKY.uni.uCloud.value = 0.3 + rain * 0.7;
  SKY.uni.uRain.value = rain;
  // lights
  const sunI = 2.9 * smooth(-0.02, 0.28, el) * (1 - 0.6 * rain), moonI = 0.42 * smooth(0.0, 0.22, -el) * (1 - 0.6 * rain);
  const L = SKY.light;
  if (sunI >= moonI) { L.color.copy(sc); L.intensity = sunI + G.flash * 2; WUNI.uSunDir.value.copy(SKY.sunDir); }
  else { L.color.copy(SKC.moon); L.intensity = moonI + G.flash * 2; WUNI.uSunDir.value.copy(SKY.moonDir); }
  const dir = sunI >= moonI ? SKY.sunDir : SKY.moonDir;
  const fx = Math.round(focus.x * 2) / 2, fz = Math.round(focus.z * 2) / 2;
  L.target.position.set(fx, focus.y, fz); L.position.set(fx + dir.x * 160, focus.y + Math.max(dir.y, 0.15) * 160, fz + dir.z * 160);
  SKY.hemi.color.copy(SKC.skyLN).lerp(SKC.skyLD, day);
  SKY.hemi.groundColor.copy(SKC.gndN).lerp(SKC.gndD, day);
  SKY.hemi.intensity = (0.32 + 0.95 * day) * (1 - 0.25 * rain) + G.flash * 1.5;
  WUNI.uSunCol.value.copy(L.color).multiplyScalar(L.intensity / 2.9);
  WUNI.uSky.value.copy(zen); WUNI.uHor.value.copy(hor);
  WUNI.uLight.value = clamp(0.12 + day * 0.88 - rain * 0.25, 0.08, 1);
  // fog
  const q = QUAL[SET.q];
  const morning = smooth(4.5, 6.5, G.time) * (1 - smooth(7.5, 10, G.time));
  let dens = 1.75 / q.view * (1 + rain * 0.9 + morning * 0.45);
  const fogC = scene.fog.color.copy(hor).lerp(SKC.hazeD, 0.35 * day * (1 - rain));
  SKY.under = camera.position.y < waterAt(camera.position.x, camera.position.z) - 0.05;
  if (SKY.under) { fogC.copy(SKC.under).multiplyScalar(0.3 + 0.7 * WUNI.uLight.value); dens = 0.042; }
  scene.fog.density = dens;
  atmoUpdate(dt);
  WUNI.uUnder.value = SKY.under ? 1 : 0;
  SKY.mesh.position.copy(camera.position);
  updateAmbientPoints(dt);
  updateRain(dt);
}
// --------- fireflies & pollen ---------
const AMB = {};
function makePointCloud(n, color, size, additive) {
  const pos = new Float32Array(n * 3), seed = new Float32Array(n);
  for (let i = 0; i < n; i++) { pos[i * 3 + 1] = -999; seed[i] = rng(); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  const m = new THREE.ShaderMaterial({
    uniforms: { uTime: WUNI.uTime, uPS: PSCALE, uA: { value: 0 }, uCol: { value: new THREE.Color(color) }, uSize: { value: size } },
    vertexShader: `attribute float aSeed; uniform float uTime, uPS, uSize; varying float vB;
      void main(){ vec3 p = position + vec3(sin(uTime * 0.5 + aSeed * 30.0), sin(uTime * 0.7 + aSeed * 17.0) * 0.6, cos(uTime * 0.4 + aSeed * 23.0)) * 0.9;
        vB = 0.5 + 0.5 * sin(uTime * (1.5 + aSeed * 2.0) + aSeed * 40.0);
        vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_PointSize = max(1.5, uSize * uPS / -mv.z); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float uA; uniform vec3 uCol; varying float vB;
      void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, d) * uA * vB; gl_FragColor = vec4(uCol, a); }`,
    transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending
  });
  const p = new THREE.Points(g, m); p.frustumCulled = false; scene.add(p);
  return p;
}
function buildAmbientPoints() {
  AMB.ff = makePointCloud(220, '#c8ff6a', 0.09, true); AMB.ffR = 45;
  AMB.dust = makePointCloud(260, '#fff4d6', 0.035, false); AMB.dustR = 18;
}
function scatterCloud(p, R, yMin, yMax, all) {
  const a = p.geometry.attributes.position, c = camera.position;
  for (let i = 0; i < a.count; i++) {
    const x = a.getX(i), z = a.getZ(i);
    if (!all && Math.abs(x - c.x) < R && Math.abs(z - c.z) < R && a.getY(i) > -900) continue;
    const nx = c.x + rr(-R, R), nz = c.z + rr(-R, R);
    a.setXYZ(i, nx, Math.max(getH(nx, nz), waterAt(nx, nz)) + rr(yMin, yMax), nz);
  }
  a.needsUpdate = true;
}
function updateAmbientPoints(dt) {
  AMB.t = (AMB.t || 0) - dt;
  if (AMB.t <= 0) { AMB.t = 0.5; scatterCloud(AMB.ff, AMB.ffR, 0.4, 4); scatterCloud(AMB.dust, AMB.dustR, 0.3, 7); }
  AMB.ff.material.uniforms.uA.value = SKY.night * (1 - G.rain) * 0.95;
  AMB.dust.material.uniforms.uA.value = SKY.day * (1 - G.rain) * 0.5 * (SKY.under ? 0 : 1);
}
// --------- rain ---------
let rainMesh;
function buildRain() {
  const n = 1800, pos = new Float32Array(n * 6), seed = new Float32Array(n * 6), end = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) {
    const x = rng(), y = rng(), z = rng();
    for (let k = 0; k < 2; k++) { pos.set([x, y, z], (i * 2 + k) * 3); end[i * 2 + k] = k; }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aEnd', new THREE.BufferAttribute(end, 1));
  const m = new THREE.ShaderMaterial({
    uniforms: { uTime: WUNI.uTime, uRain: { value: 0 }, uCam: { value: new V3() }, uLight: WUNI.uLight },
    vertexShader: `attribute float aEnd; uniform float uTime; uniform vec3 uCam; varying float vE;
      void main(){ vec3 p = position * 60.0 - 30.0; p.y = mod(position.y * 60.0 - uTime * 24.0, 60.0) - 30.0;
        p.x = mod(p.x - uCam.x, 60.0) - 30.0; p.z = mod(p.z - uCam.z, 60.0) - 30.0;
        vec3 w = vec3(uCam.x + p.x, uCam.y + p.y, uCam.z + p.z) + vec3(0.25, 1.1, 0.1) * aEnd; vE = aEnd;
        gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0); }`,
    fragmentShader: `uniform float uRain, uLight; varying float vE; void main(){ gl_FragColor = vec4(vec3(0.75, 0.8, 0.85) * (0.4 + 0.6 * uLight), uRain * 0.32 * (0.4 + 0.6 * vE)); }`,
    transparent: true, depthWrite: false
  });
  rainMesh = new THREE.LineSegments(g, m); rainMesh.frustumCulled = false; scene.add(rainMesh);
}
function updateRain(dt) {
  const u = rainMesh.material.uniforms; u.uRain.value = SKY.under ? 0 : G.rain * atmoRainK(); u.uCam.value.copy(camera.position);
  rainMesh.visible = u.uRain.value > 0.02;
}
function updateWeather(dt) {
  G.rainT -= dt;
  if (G.rainT <= 0) {
    G.rainT = rr(70, 200);
    G.rainTarget = rng() < 0.32 ? rr(0.5, 1) : 0;
    if (G.rainTarget > 0 && G.mode === 'play') { const wn = weatherName(G.rainTarget > 0.8); UI.big(wn[0], wn[1]); }
  }
  G.rain += clamp(G.rainTarget - G.rain, -dt * 0.05, dt * 0.05);
  G.flash = Math.max(0, G.flash - dt * 4);
  if (G.rain > 0.6 && rng() < dt * (G.rainTarget > 0.8 ? 0.16 : 0.04)) lightning();
}
