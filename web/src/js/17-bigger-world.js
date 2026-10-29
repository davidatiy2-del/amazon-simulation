// ================= A LARGER JUNGLE: new land beyond the old mountains, more rivers and lakes, open meadows =================
// The old valley is made exactly as it always was, so old games keep their villages, their tribes and their felled trees.
// Then the mountains that closed it move far out, and new land opens all around: the great river runs on to the south,
// three new lakes are fed by brooks from the far mountains, and wide meadows open between the forests.
const WORLD0 = { S: null, river: null, band: null, old: false };
// ---------- a square of the grid kept aside: the land as it was before something new was made around it ----------
const GRIDS = () => ({ HM, NY, FO: FOREST, WS: WSURF, SD: STREAMD });
function gridSnap(half) {
  const i0 = Math.round((W.half - half) / W.cell), n = W.N - 2 * i0 + 1, A = {}, G = GRIDS();
  for (const k in G) { const src = G[k], a = new Float32Array(n * n); for (let r = 0; r < n; r++) { const o = (i0 + r) * W.V + i0; a.set(src.subarray(o, o + n), r * n); } A[k] = a; }
  return { i0, n, A };
}
// the kept square and the land in its place change places (doing it again brings everything back)
function gridSwap(S) {
  const G = GRIDS(), tmp = new Float32Array(S.n);
  for (const k in S.A) {
    const src = G[k], a = S.A[k];
    for (let r = 0; r < S.n; r++) { const o = (S.i0 + r) * W.V + S.i0, q = r * S.n; tmp.set(src.subarray(o, o + S.n)); src.set(a.subarray(q, q + S.n), o); a.set(tmp, q); }
  }
}
// the height of the ground in a kept square
function getHS(S, x, z) {
  const A = S.A.HM, n = S.n, fx = (x + W.half) / W.cell - S.i0, fz = (z + W.half) / W.cell - S.i0;
  const ix = clamp(Math.floor(fx), 0, n - 2), iz = clamp(Math.floor(fz), 0, n - 2), tx = clamp(fx - ix, 0, 1), tz = clamp(fz - iz, 0, 1), i = iz * n + ix;
  const a = A[i], b = A[i + 1], c = A[i + n], d = A[i + n + 1];
  return tx + tz <= 1 ? a + (b - a) * tx + (c - a) * tz : d + (c - d) * (1 - tx) + (b - d) * (1 - tz);
}
let RIVER_EXT = [];
const LEGACY_LIMIT = 455;
const eOld = (x, z) => Math.pow(Math.pow(Math.abs(x / 500), 5) + Math.pow(Math.abs(z / 500), 5), 0.2);
const NEWW = { lakes: [], meadow: null };
// open grassland: in the new land only, where the noise says so
function meadowK(x, z) {
  const band = smooth(0.7, 0.86, eOld(x, z)); if (band <= 0) return 0;
  const n = Noise.fbm(x * 0.0045 + 71.3, z * 0.0045 - 41.7, 3);
  return band * smooth(0.04, 0.2, n);
}
function carveRiverAt(h, x, z, P) {
  const r = nearestOnPoly(x, z, P), d = r[0], hw = P[Math.min(P.length - 1, Math.round(r[1]))].w / 2;
  if (d > hw + 30) return h;
  if (d < hw) { const k = d / hw; return Math.min(h, -3.4 * (1 - k * k) - 0.3); }
  return Math.min(h, lerp(0.35, h, smooth(hw, hw + 26, d)));
}
function forestAt(i, x, z) {
  const h = HM[i];
  let f = smooth(-0.42, -0.02, Noise.fbm(x * 0.0075 + 40, z * 0.0075 - 12, 3));
  f *= smooth(0.6, 2.4, h) * (1 - smooth(110, 160, h)) * smooth(0.55, 0.8, NY[i]);
  if (STREAMD[i] < 5) f *= 0.3;
  if (CLAYM[i] > 0.05) f *= 0.05;
  if (h > 75 && Math.hypot(x - TEP.x, z - TEP.z) < TEP.r + 10) f *= 0.35;
  return f * (1 - meadowK(x, z));
}
// the lowest wide ground near a place: where a lake will lie
function lowSpot(cx, cz, R, full) {
  let best = null, bs = 1e9;
  for (let dz = -R; dz <= R; dz += 12) for (let dx = -R; dx <= R; dx += 12) {
    const x = cx + dx, z = cz + dz; if (Math.abs(x) > JL - 70 || Math.abs(z) > JL - 70 || eOld(x, z) < 0.86) continue;
    if (nearestOnPoly(x, z, full)[0] < 150 || Math.hypot(x - TEP.x, z - TEP.z) < 200) continue;
    let s = getH(x, z) * 2; for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; s += getH(x + Math.cos(a) * 45, z + Math.sin(a) * 45); }
    s += Math.hypot(dx, dz) * 0.02;
    if (s < bs) { bs = s; best = { x, z }; }
  }
  return best;
}
function worldGrow() {
  // the old world, kept as it was
  WORLD0.S = gridSnap(560); WORLD0.river = RIVER.slice();
  // the great river runs on, south to the edge of the world
  const last = RIVER[RIVER.length - 1], n0 = RIVER.length;
  RIVER_EXT = catmull([[last.x, last.z], [40, 650], [15, 740], [0, 870]], 4).slice(1).map((p, k) => ({ x: p.x, z: p.z, w: 19 + 7 * Noise.n2((n0 + k) * 0.025, 5.5) }));
  const full = RIVER.concat(RIVER_EXT), rbb = polyBBox(full, 60);
  // where the old mountains stood the land is new: lower near the valley, rising to the far mountains at the new edge.
  // An old brook keeps its bed and its water on the new ground; the river is carved again.
  for (let iz = MI0; iz <= MI1; iz++) for (let ix = MI0; ix <= MI1; ix++) {
    const x = gx(ix), z = gx(iz); if (eOld(x, z) <= 0.7) continue;
    const i = iz * W.V + ix, h0 = rawH(x, z), h1 = rawH(x, z, true), dh = h1 - h0;
    let h = HM[i] + dh;
    if (WSURF[i] > -900) WSURF[i] += dh;
    // by the river the bed is carved again into the new ground (the old gorge through the mountains is gone)
    if (x > rbb[0] && x < rbb[1] && z > rbb[2] && z < rbb[3]) { const r = nearestOnPoly(x, z, full), hw = full[Math.min(full.length - 1, Math.round(r[1]))].w / 2; if (r[0] < hw + 30) h = carveRiverAt(h1, x, z, full); }
    HM[i] = h;
  }
  // beyond the jungle's square (until the lands around it are made) the ground is the jungle's own edge, as when the world ended there
  for (let iz = 0; iz < W.V; iz++) {
    const jz = clamp(iz, MI0, MI1), inZ = iz >= MI0 && iz <= MI1;
    for (let ix = 0; ix < W.V; ix++) { if (inZ && ix >= MI0 && ix <= MI1) continue; HM[iz * W.V + ix] = HM[jz * W.V + clamp(ix, MI0, MI1)]; }
  }
  for (const s of STREAMS) for (let k = 0; k < s.path.length; k++) {
    const p = s.path[k]; if (eOld(p.x, p.z) <= 0.7) continue;
    const dh = rawH(p.x, p.z, true) - rawH(p.x, p.z); s.surf[k] += dh; s.bed[k] += dh;
  }
  RIVER = full;
  // three new lakes, each fed by brooks from the far mountains
  const LK = [['אגם הדקלים', -560, 470, 34, [[-690, 640, 3.2, 11.3, 24], [-700, 300, 2.8, 12.9, 20]]], ['אגם הצפון', -470, -560, 30, [[-260, -700, 3, 14.1, 26], [-700, -470, 2.6, 15.7, 18]]], ['אגם הזריחה', 580, 330, 32, [[700, 560, 3, 16.2, 22], [700, 110, 2.7, 17.4, 24]]]];
  NEWW.lakes = [];
  for (const [n, cx, cz, r, brooks] of LK) {
    const s = lowSpot(cx, cz, 70, full) || { x: cx, z: cz };
    carveDisk(s.x, s.z, r, 4.4, 22); NEWW.lakes.push({ x: s.x, z: s.z, r, n });
    for (const [ax, az, hw, seed, wig] of brooks) STREAMS.push(makeStream(ax, az, s.x, s.z, hw, seed, wig));
  }
  // two brooks run down from the southern mountains into the river
  const rx = f => RIVER_EXT[Math.floor(f * (RIVER_EXT.length - 1))];
  { const a = rx(0.35), b = rx(0.75); STREAMS.push(makeStream(-470, 700, a.x - 8, a.z, 3, 18.8, 26)); STREAMS.push(makeStream(520, 700, b.x + 8, b.z, 3.2, 19.9, 24)); }
  // light and forest for the new land; the old valley keeps its own exactly
  for (let iz = MI0; iz <= MI1; iz++) for (let ix = MI0; ix <= MI1; ix++) {
    const i = iz * W.V + ix;
    const hl = HM[iz * W.V + Math.max(0, ix - 1)], hr = HM[iz * W.V + Math.min(W.N, ix + 1)];
    const hd = HM[Math.max(0, iz - 1) * W.V + ix], hu = HM[Math.min(W.N, iz + 1) * W.V + ix];
    const nx = (hl - hr) / (2 * W.cell), nz = (hd - hu) / (2 * W.cell);
    NY[i] = 1 / Math.sqrt(nx * nx + nz * nz + 1);
  }
  const band = WORLD0.band = new Uint8Array(NV).fill(1), S0 = WORLD0.S, A0 = S0.A;
  for (let iz = MI0; iz <= MI1; iz++) for (let ix = MI0; ix <= MI1; ix++) {
    const i = iz * W.V + ix, x = gx(ix), z = gx(iz), jx = ix - S0.i0, jz = iz - S0.i0, inS = jx >= 0 && jz >= 0 && jx < S0.n && jz < S0.n, j = jz * S0.n + jx;
    if (eOld(x, z) > 0.7 || (inS && STREAMD[i] !== A0.SD[j])) FOREST[i] = forestAt(i, x, z);
    // the new land: wherever the ground, the water or the forest differ from the old valley
    if (!inS) continue;
    const wetO = A0.WS[j] > A0.HM[j] || A0.HM[j] < WATER_Y, wetN = WSURF[i] > HM[i] || HM[i] < WATER_Y;
    band[i] = Math.abs(HM[i] - A0.HM[j]) > 1.2 || wetO !== wetN || Math.abs(FOREST[i] - A0.FO[j]) > 0.15 ? 1 : 0;
  }
  buildWaterGrid();
  // names on the map
  for (const L of NEWW.lakes) POI.push({ x: L.x, z: L.z, n: L.n });
  { const e = rx(0.55); POI.push({ x: e.x, z: e.z, n: 'הנהר הדרומי' }); }
  let bm = null, bv = 0;
  for (let k = 0; k < 900; k++) { const x = -JL + 60 + (k % 30) / 29 * (JL * 2 - 120), z = -JL + 60 + ((k / 30) | 0) / 29 * (JL * 2 - 120), m = meadowK(x, z); if (m > bv && waterDist(x, z) > 40 && getNY(x, z) > 0.9) { bv = m; bm = { x, z }; } }
  if (bm) { NEWW.meadow = bm; POI.push({ x: bm.x, z: bm.z, n: 'ערבות הסוסים' }); }
}
// the old valley comes back for a moment: to draw the old forest and find the old tribes exactly where they always were
function worldOld(on) {
  if (!WORLD0.S || WORLD0.old === on) return;
  gridSwap(WORLD0.S);
  const r = RIVER; RIVER = WORLD0.river; WORLD0.river = r;
  WORLD0.old = on;
}
const inBand = (x, z) => { if (Math.abs(x) > LEGACY_LIMIT - 5 || Math.abs(z) > LEGACY_LIMIT - 5) return true; return !!WORLD0.band[nearIdx(x, z)]; };
// ---------- new tribes in the new land: a flat place near water, far from every other camp ----------
const NEW_TRIBES = [
  { tribe: 'שבט האגם', key: 'lake' }, { tribe: 'שבט ההר', key: 'hill' }, { tribe: 'שבט הערבה', key: 'plain' }, { tribe: 'שבט הנחש', key: 'snake' }
];
function campSpotOk(x, z, minD, camps) {
  if (Math.abs(x) > JL - 45 || Math.abs(z) > JL - 45 || waterDepth(x, z) > 0) return false;
  const h = getH(x, z); if (h < 0.8 || h > 38 || getNY(x, z) < 0.95) return false;
  for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; if (Math.abs(getH(x + Math.cos(a) * 6, z + Math.sin(a) * 6) - h) > 1.2 || waterDepth(x + Math.cos(a) * 6, z + Math.sin(a) * 6) > 0) return false; }
  if (Math.hypot(x - TEP.x, z - TEP.z) < 180 || (LAKE && Math.hypot(x - LAKE.x, z - LAKE.z) < 80)) return false;
  for (const L of NEWW.lakes) if (Math.hypot(x - L.x, z - L.z) < L.r + 30) return false;
  for (const c of camps) if (Math.hypot(c.x - x, c.z - z) < minD) return false;
  return true;
}
function pickNewCamps() {
  const R = mulberry32(9177), out = [], all = HUNT.camps.slice();
  for (const T of NEW_TRIBES) {
    let best = null, bs = -1e9;
    for (let t = 0; t < 1600; t++) {
      const x = -JL + 50 + R() * (JL * 2 - 100), z = -JL + 50 + R() * (JL * 2 - 100);
      if (eOld(x, z) < 0.8 || !campSpotOk(x, z, 240, all)) continue;
      const wd = waterDist(x, z); if (wd > 55 || wd < 9) continue;
      let far = 1e9; for (const c of all) far = Math.min(far, Math.hypot(c.x - x, c.z - z));
      const sc = -Math.abs(wd - 22) * 0.4 + Math.min(far, 420) * 0.03 + R();
      if (sc > bs) { bs = sc; best = { x, z }; }
    }
    if (!best) continue;
    const w = nearestWater(best.x, best.z) || best;
    const c = { x: best.x, z: best.z, y: getH(best.x, best.z), rx: w.x, rz: w.z, hunters: [], flames: [], glow: null, tribe: T.tribe, key: T.key, fresh: true };
    out.push(c); all.push(c);
  }
  return out;
}
// the graphics card keeps its own copy of a shape that never changes: the arrays can be let go once it has them (they are big)
const _freeArr = function () { this.array = null; };
function freeAfterUpload(g) {
  if (!g || g.userData.free) return; g.userData.free = true;
  if (!g.boundingSphere) g.computeBoundingSphere();
  for (const k in g.attributes) g.attributes[k].onUpload(_freeArr);
  if (g.index) g.index.onUpload(_freeArr);
}
// ---------- the terrain in pieces: only what can be seen through the haze is drawn ----------
const TCHUNK = { list: [] };
function terrainChunks(geo, mat) {
  const K = Math.round(W.N / 60), C = W.N / K, A = geo.attributes, P0 = A.position.array, N0 = A.normal.array, C0 = A.color.array, F0 = A.aForest.array;
  const idx = new Uint16Array(C * C * 6); let q = 0;
  for (let j = 0; j < C; j++) for (let i = 0; i < C; i++) { const a = j * (C + 1) + i, b = a + 1, c = a + C + 1, d = c + 1; idx[q++] = a; idx[q++] = c; idx[q++] = b; idx[q++] = b; idx[q++] = c; idx[q++] = d; }
  for (let cz = 0; cz < K; cz++) for (let cx = 0; cx < K; cx++) {
    const n = (C + 1) * (C + 1), pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), cl = new Float32Array(n * 3), fo = new Float32Array(n);
    let k = 0;
    for (let j = 0; j <= C; j++) for (let i = 0; i <= C; i++, k++) {
      const s = (cz * C + j) * W.V + cx * C + i;
      for (let e = 0; e < 3; e++) { pos[k * 3 + e] = P0[s * 3 + e]; nor[k * 3 + e] = N0[s * 3 + e]; cl[k * 3 + e] = C0[s * 3 + e]; }
      fo[k] = F0[s];
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setAttribute('color', new THREE.BufferAttribute(cl, 3)); g.setAttribute('aForest', new THREE.BufferAttribute(fo, 1));
    g.setIndex(new THREE.BufferAttribute(idx, 1)); g.computeBoundingSphere(); freeAfterUpload(g);
    const m = new THREE.Mesh(g, mat); m.receiveShadow = true; scene.add(m);
    TCHUNK.list.push({ m, x: g.boundingSphere.center.x, z: g.boundingSphere.center.z, r: g.boundingSphere.radius });
  }
  geo.dispose();
  return TCHUNK.list[0].m;
}
// the haze hides everything farther than about twice the view distance: those pieces are not drawn at all
function terrainCull() {
  if (!camera) return;
  const c = camera.position, D = Math.min(1500, Math.max(QUAL[SET.q].view * 2.3 + 40, 3.3 / (scene.fog ? scene.fog.density : 1)));
  for (const ch of TCHUNK.list) ch.m.visible = Math.hypot(ch.x - c.x, ch.z - c.z) - ch.r < D;
}
// ---------- the forest: the old valley exactly as before, then the jungle's ring, then the lands around it ----------
function buildVegetation() {
  // the jungle as it was before the lands around it were made: its tribes and its plants are found exactly where they always were
  worldMid(true);
  worldOld(true); if (!HUNT.camps.length) pickCamps(); worldOld(false);
  const fresh = pickNewCamps();
  const atlas = makeAtlas();
  VEG.mat = new THREE.MeshLambertMaterial({ map: atlas, vertexColors: true, alphaTest: 0.42, side: THREE.DoubleSide, alphaToCoverage: QUAL[SET.q].aa });
  VEG.mat.onBeforeCompile = sh => {
    sh.uniforms.uTime = VEG.uni.uTime; sh.uniforms.uWind = VEG.uni.uWind; sh.uniforms.uNear = VEG.uni.uNear;
    // dither away foliage that sits right in front of the camera (third person view)
    sh.fragmentShader = 'uniform float uNear;\nvarying float vCamD;\n' + sh.fragmentShader.replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
      float nearK = smoothstep(uNear * 0.35, uNear, vCamD);
      if (nearK < 0.999 && fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) > nearK) discard;`);
    sh.vertexShader = 'uniform float uTime;\nuniform float uWind;\nattribute float aSway;\nvarying float vCamD;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n      vCamD = -mvPosition.z;').replace('#include <begin_vertex>', `#include <begin_vertex>
      #ifdef USE_INSTANCING
        float ph = instanceMatrix[3].x * 0.13 + instanceMatrix[3].z * 0.09;
      #else
        float ph = 0.0;
      #endif
      float sw = step(0.01, aSway) * uWind, hh = min(position.y, 24.0);
      transformed.x += (sin(uTime * 1.1 + ph) * 0.5 + sin(uTime * 2.3 + ph * 1.7) * 0.22) * sw * 0.016 * hh;
      transformed.z += cos(uTime * 0.9 + ph * 1.3) * 0.5 * sw * 0.014 * hh;
      float leafy = clamp(aSway * 2.0 - 1.0, 0.0, 1.0);
      transformed += objectNormal * sin(uTime * 4.0 + position.x * 1.7 + position.z * 1.9 + ph) * 0.045 * leafy * uWind;`);
  };
  const T = (id, vars, n, rule, o) => VEG.types.push(Object.assign({ id, vars, n, rule }, o));
  T('giant', [bGiant(0), bGiant(1)], 90, s => s.fo > 0.45 && s.ny > 0.86 && s.h < 75 && s.sd > 8 ? s.fo : 0, { near: 150, farD: 999, col: 2.4, crown: true, shadow: true, sc: [0.9, 1.15], fixed: true });
  T('canopy', [bCanopy(0), bCanopy(1), bCanopy(2)], 4600, s => s.fo > 0.22 && s.ny > 0.72 && s.sd > 4 ? s.fo : 0, { near: 105, col: 0.75, crown: true, shadow: true, sc: [0.8, 1.2] });
  T('under', [bUnder(0), bUnder(1)], 2600, s => s.fo > 0.12 && s.ny > 0.65 ? s.fo * 0.9 : 0, { near: 85, farD: 200, col: 0.3, shadow: true, sc: [0.8, 1.25] });
  T('palm', [bPalm(0), bPalm(1)], 1300, s => { if (s.h < 0.35 || s.h > 40 || s.ny < 0.75 || s.sd < 3) return 0; return 0.15 + 0.6 * smooth(4, 0.6, s.h) + 0.3 * s.fo; }, { near: 105, col: 0.35, shadow: true, sc: [0.8, 1.2] });
  T('tfern', [bTreeFern()], 500, s => s.h > 35 && s.h < 150 && s.ny > 0.55 ? 0.8 : 0, { near: 110, col: 0.3, shadow: true, sc: [0.8, 1.4] });
  T('fern', [bFern(0), bFern(1)], 16000, s => s.ny > 0.6 && s.h > 0.6 ? 0.25 + 0.75 * s.fo : 0, { near: 70, sc: [0.7, 1.4] });
  T('heli', [bHeli()], 2600, s => s.ny > 0.7 && s.h > 0.8 && s.h < 60 ? 0.25 + 0.6 * s.fo : 0, { near: 78, sc: [0.8, 1.3], flower: true });
  T('bush', [bBush(0), bBush(1)], 7000, s => s.ny > 0.6 && s.h > 0.7 ? 0.3 + 0.7 * s.fo : 0, { near: 82, sc: [0.7, 1.4] });
  T('grass', [bGrass(false)], 5000, s => s.h > 0.9 && s.ny > 0.8 && s.fo < 0.35 && s.clay < 0.3 ? 1 - s.fo * 2 : 0, { near: 55, sc: [0.8, 1.4] });
  T('reeds', [bGrass(true)], 3200, s => s.h > -0.4 && s.h < 1.5 && s.wd < 0.5 ? 1 : 0, { near: 70, sc: [0.8, 1.3] });
  T('rock', [bRock(0), bRock(1), bRock(2)], 1300, s => (s.ny < 0.82 && s.wd === 0) || s.sd < 5 || (s.h > 80 && s.ny > 0.8) ? 0.8 : (s.wd === 0 ? 0.06 : 0), { near: 170, col: 1.0, shadow: true, sc: [0.5, 2.4], sink: 0.25 });
  T('log', [bLog()], 380, s => s.fo > 0.4 && s.ny > 0.86 && s.wd === 0 ? 0.6 : 0, { near: 90, sc: [0.8, 1.2], sink: 0.1 });
  T('lily', [bLily()], 520, s => s.wd > 0.5 && s.wd < 2.1 && s.h < -0.4 ? 1 : 0, { near: 140, sc: [0.9, 1.5], onWater: true });
  T('flower', [bFlower()], 2000, s => s.ny > 0.7 && s.h > 0.8 && s.wd === 0 ? 0.3 + 0.5 * s.fo : 0, { near: 60, sc: [0.7, 1.3], flower: true });
  // the plants of the lands around the jungle (they take no numbers from the jungle's own)
  regionVegTypes(T);
  for (let i = 0; i < 2 * GN * GN; i++) TRUNKS.g.push(null);
  for (let i = 0; i < 2 * CGN * CGN; i++) CROWNG.push([]);
  VEG.chunks = [];
  for (let i = 0; i < VEG.CN * VEG.CN; i++) VEG.chunks.push({ cx: VEG.O + (i % VEG.CN + 0.5) * VEG.CS, cz: VEG.O + (((i / VEG.CN) | 0) + 0.5) * VEG.CS, items: [] });
  // the jungle's plants (as the old game made them) and the new lands' plants, in lists of their own
  const lists = VEG.types.map(t => t.vars.map(() => VEG.chunks.map(() => []))), listsN = VEG.types.map(t => t.vars.map(() => VEG.chunks.map(() => [])));
  // 1. the old valley: the same random numbers in the same order give the same plants in the same places
  worldOld(true);
  VEG.types.forEach((t, ti) => { if (!t.outer) vegPlace(t, lists[ti], true, fresh); });
  worldOld(false);
  for (const c of fresh) { HUNT.camps.push(c); POI.push({ x: c.x, z: c.z, n: c.tribe, camp: true }); }
  // 2. the jungle's ring, with numbers of its own: as many plants per square metre as in the valley
  const R2 = mulberry32(40427);
  let inB = 0; for (let k = 0; k < 4000; k++) if (inBand(-JL + 5 + R2() * (JL * 2 - 10), -JL + 5 + R2() * (JL * 2 - 10))) inB++;
  const bandK = inB / 4000 * Math.pow((JL * 2 - 10) / (LEGACY_LIMIT * 2 - 10), 2);
  VEG.types.forEach((t, ti) => { if (!t.outer) vegPlace(t, lists[ti], false, null, R2, bandK); });
  worldMid(false);
  // 3. the lands around the jungle: their tribes, then their plants (and the jungle's own plants in the passes through its mountains)
  regionCamps();
  vegOuter(listsN, mulberry32(77031));
  // 4. the meshes, one set per chunk: first the jungle's, mixed with the old numbers exactly as the old game mixed them (a plant
  // of a changed place keeps its turn, too small to see), so a lower quality hides the same plants as before; then the new ones
  vegMeshes(lists, R2); vegMeshes(listsN, mulberry32(91573));
  updateVeg(true);
}
function vegMeshes(lists, R) {
  for (let ti = 0; ti < VEG.types.length; ti++) {
    const t = VEG.types[ti], per = lists[ti];
    t.vars.forEach((V, vi) => per[vi].forEach((list, ci) => {
      if (!list.length) return;
      for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); const tmp = list[i]; list[i] = list[j]; list[j] = tmp; }
      const near = new THREE.InstancedMesh(V.near, VEG.mat, list.length);
      list.forEach((m, i) => near.setMatrixAt(i, m)); near.instanceMatrix.needsUpdate = true;
      near.receiveShadow = true; near.computeBoundingSphere && near.computeBoundingSphere();
      if (!near.computeBoundingSphere) near.frustumCulled = false;
      scene.add(near);
      let far = null;
      if (V.far) {
        far = new THREE.InstancedMesh(V.far, VEG.mat, list.length); far.instanceMatrix = near.instanceMatrix;
        far.computeBoundingSphere && far.computeBoundingSphere(); if (!far.computeBoundingSphere) far.frustumCulled = false;
        far.receiveShadow = true; scene.add(far);
      }
      VEG.chunks[ci].items.push({ t, near, far, total: list.length });
    }));
  }
}
// one kind of plant: in the old valley (the old numbers, the old ground) or in the jungle's ring (its own numbers)
const _vm4 = new THREE.Matrix4(), _vq4 = new THREE.Quaternion(), _vs4 = new V3(), _vp4 = new V3(), _ve4 = new THREE.Euler();
function vegPlace(t, per, legacy, avoid, R2, bandK) {
  const R = legacy ? rng : R2, RR = (a, b) => a + (b - a) * R();
  const L = legacy ? LEGACY_LIMIT : JL, N = legacy ? t.n : Math.round(t.n * bandK), old = legacy ? t.vars.map(() => new Map()) : null;
  let placed = 0;
  for (let tries = 0; placed < N && tries < N * 14; tries++) {
    const x = RR(-L + 5, L - 5), z = RR(-L + 5, L - 5);
    if (!legacy && !inBand(x, z)) continue;
    const s = vegSite(x, z);
    if (nearCamp(x, z, t.id === 'grass' || t.id === 'flower' || t.id === 'fern' ? 4.5 : 9)) continue;
    if (t.id !== 'lily' && t.id !== 'reeds' && s.wd > 0) continue;
    if (R() > t.rule(s)) continue;
    const vi = Math.floor(R() * t.vars.length), sc = RR(t.sc[0], t.sc[1]);
    // a plant of the old valley stands on the new ground (the same, except near the old mountains)
    const y = t.onWater ? WATER_Y : (legacy && WORLD0.old ? getHS(WORLD0.S, x, z) : s.h) - (t.sink || 0) * sc;
    const ry = R() * TAU, tilt = t.id === 'canopy' || t.id === 'giant' || t.id === 'palm' ? 0 : RR(-0.08, 0.08);
    placed++;
    if (legacy) {
      // the old game shuffled each chunk of its 10x10 grid with these numbers: count them, to use up the same ones
      const oc = clamp(Math.floor((z + 500) / 100), 0, 9) * 10 + clamp(Math.floor((x + 500) / 100), 0, 9), mo = old[vi];
      mo.set(oc, (mo.get(oc) || 0) + 1);
      // the new land and the new tribes' camps get plants of their own
      if (inBand(x, z)) continue;
      if (avoid && avoid.some(c => Math.hypot(c.x - x, c.z - z) < (t.id === 'grass' || t.id === 'flower' || t.id === 'fern' ? 4.5 : 9))) continue;
    }
    // the ways cut through the jungle's mountains get new plants (in the last pass); this one keeps its place in the list
    else if (WORLD1.band[nearIdx(x, z)]) { per[vi][vegCi(x, z)].push(_vm4.compose(_vp4.set(x, y, z), _vq4.identity(), _vs4.set(1e-5, 1e-5, 1e-5)).clone()); continue; }
    vegPut(t, per, vi, x, y, z, sc, ry, tilt);
  }
  if (legacy) for (const mo of old) for (const n of mo.values()) for (let i = n - 1; i > 0; i--) rng();
}
const vegCi = (x, z) => clamp(Math.floor((z - VEG.O) / VEG.CS), 0, VEG.CN - 1) * VEG.CN + clamp(Math.floor((x - VEG.O) / VEG.CS), 0, VEG.CN - 1);
// a plant in its place: its matrix in its chunk, its trunk for walking into, its crown for climbing
function vegPut(t, per, vi, x, y, z, sc, ry, tilt) {
  const V = t.vars[vi];
  _vp4.set(x, y, z); _vq4.setFromEuler(_ve4.set(tilt, ry, tilt * 0.5)); _vs4.set(sc, sc, sc); _vm4.compose(_vp4, _vq4, _vs4);
  per[vi][vegCi(x, z)].push(_vm4.clone());
  if (t.col) {
    const rad = (V.trunk ? V.trunk * (t.id === 'giant' ? 1.7 : 1.15) : (V.r || 1) * t.col) * sc;
    const k = g10(x, z);
    (TRUNKS.g[k] || (TRUNKS.g[k] = [])).push(x, z, rad);
  }
  if (t.crown && V.crown) {
    const cr = { x, z, y: y + V.crown.y * sc, top: y + V.crown.top * sc, r: V.crown.r * sc, giant: t.id === 'giant' };
    CROWNS.push(cr); CROWNG[g25(x, z)].push(cr);
  }
  if (V.hang) { const hp = V.hang.clone().applyMatrix4(_vm4); HANGS.push({ x: hp.x, y: hp.y, z: hp.z, ry }); }
  if (t.flower && FLOWERS.length < 9000) FLOWERS.push({ x, y: y + 1.2 * sc, z });
}
// ================= BORDERS AND CONQUEST: build in another tribe's land and they come to tear it down; =================
// ================= a tribe that loses a war serves the winner, pays tribute, fights at its side, and in time becomes one with it =================
// ---------- the land of a tribe: the ground right around its camp, wider as the tribe grows ----------
function tribeZoneR(i) {
  const c = HUNT.camps[i]; if (!c || c.own || c.gone) return 0;
  const n = c.hunters.filter(h => h.alive && !h.gone).length;
  return 70 + clamp((n - 10) * 2.5, 0, 45) + (c.lvl || 0) * 6;
}
// the tribe whose land this is (-1: nobody's); our own vassals do not mind
function zoneTribeAt(x, z) {
  let best = -1, bd = 1e9;
  for (const i of npcIdx()) { if (isVassal(i, 'own')) continue; const c = HUNT.camps[i], d = Math.hypot(c.x - x, c.z - z); if (d < tribeZoneR(i) && d < bd) { bd = d; best = i; } }
  return best;
}
// something was built in their land: they declare war and send warriors to tear it down
function borderProvoke(i, at, what) {
  const c = HUNT.camps[i]; if (!c || c.gone || !ownCamp() || !at || isVassal(i, 'own')) return;
  VX.known.add(i);
  const r = relGet('own', i);
  if (r.st !== 'war') { declareWar(i, `${campName(i)} הכריזו מלחמה: בניתם ${what} בשטח שלהם`); PROG.flags.provoked = 1; }
  r.raidT = Math.max(r.raidT || 0, rr(420, 640));   // the village itself is raided later; first they come for the building
  if (WAR.parties.some(p => !p.done && !p.mine && p.from === i && p.site)) return;
  const p = raidStart(i, 'own', { x: at.x, z: at.z, b: at.b || null, what });
  if (p) UI.notify(`⚔️ ${campName(i)} ראו שבניתם ${what} בשטח שלהם. הלוחמים שלהם יוצאים להרוס את זה!`, 'bad');
}
// ---------- the raiders who came for a building ----------
const siteTargets = p => BLD.list.filter(q => !q.broken && q.t !== 'torch' && Math.hypot(q.x - p.site.x, q.z - p.site.z) < 30 && zoneTribeAt(q.x, q.z) === p.from);
const siteDone = p => !siteTargets(p).length;
function raiderWreck(h, p, dt) {
  let b = h.rb && BLD.list.includes(h.rb) && !h.rb.broken ? h.rb : null;
  if (!b) { const L = siteTargets(p); b = h.rb = L.length ? L.sort((x, y) => bldDist(x, h.pos.x, h.pos.z) - bldDist(y, h.pos.x, h.pos.z))[0] : null; if (!b) { h.rtask = 'fight'; return; } }
  // stand beside the fence line, or at the wall of the house
  let tx, tz;
  if (BTYPES[b.t].len) { const e = segEnds(b), t = clamp((h.pos.x - e.ax) * e.ux + (h.pos.z - e.az) * e.uz, 0.3, e.L - 0.3), cx = e.ax + e.ux * t, cz = e.az + e.uz * t, sd = ((h.pos.x - cx) * -e.uz + (h.pos.z - cz) * e.ux) >= 0 ? 1 : -1; tx = cx - e.uz * sd * 1.1; tz = cz + e.ux * sd * 1.1; }
  else { const ang = Math.atan2(h.pos.x - b.x, h.pos.z - b.z), r = BTYPES[b.t].r + 0.9; tx = b.x + Math.sin(ang) * r; tz = b.z + Math.cos(ang) * r; }
  if (jobGo(h, tx, tz, h.sp.run * 0.8, dt) > 1.1) return;
  h.move(0, 0, 0, dt); h.yaw += angDiff(h.yaw, Math.atan2(b.x - h.pos.x, b.z - h.pos.z)) * Math.min(1, dt * 5);
  if (BTYPES[b.t].def && b.done) { h.pose = 'idle'; if (G.t - (h.defHitT || -9) > 1.0) { h.defHitT = G.t; h.anim.atk = 0.42; if (h.dCam < 45) AUD.at('chop', h.pos, 0.55); defHit(b, h.rwpn === 'sword' ? 26 : 18, h); } return; }
  h.pose = 'kneel'; h.wreckT = (h.wreckT || 0) + dt;
  if (h.wreckT > 3.2) { h.wreckT = 0; if (b.done) buildingBurn(b, h); else siteTearDown(b, h); h.rb = null; }
}
// a building site torn down: what was paid for it is lost
function siteTearDown(b, h) {
  buildRemove(b);
  if (P.a && dist2(P.a.pos, b) < 120) UI.notify(`🔥 ${h ? h.name : 'האויבים'} ${h ? heb(h, 'פירק', 'פירקה') : 'פירקו'} את ${BTYPES[b.t].len ? `קטע ה${BTYPES[b.t].n}` : `אתר הבנייה של ${BTYPES[b.t].n}`}`, 'bad');
}
// out of sight: decided by numbers
function siteRaidAbstract(p, A) {
  const i = p.from, D = ownPower(true) * rr(0.4, 0.8), r = relGet('own', i);
  p.done = true; p.abstract = true;
  if (A > D) {
    const L = siteTargets(p); for (const b of L) buildRemove(b);
    r.sc[i] = (r.sc[i] || 0) + 1;
    if (L.length) { const t = `${campName(i)} הרסו את ${p.site.what ? `ה${p.site.what}` : 'מה'} שבניתם בשטח שלהם`; warLog(t, 'bad'); UI.notify(`⚔️ ${t}`, 'bad'); }
  } else { WAR.men[i] = Math.max(0, (WAR.men[i] || 0) - 1); r.sc.own = (r.sc.own || 0) + 1; const t = `הלוחמים שלכם הדפו את ${campName(i)}. ${p.site.what ? `ה${p.site.what}` : 'הבנייה'} עומד${/[הת]$/.test(p.site.what || '') ? 'ת' : ''} בשטח שלהם`; warLog(t, 'good'); UI.notify(`🛡️ ${t}`, 'good'); }
  saveGame();
}
function siteRaidEnd(p) {
  p.done = true; p.doneT = G.t;
  const i = p.from, r = relGet('own', i), torn = siteDone(p), lost = p.lost;
  if (torn) { r.sc[i] = (r.sc[i] || 0) + 1; const t = `${campName(i)} הרסו את ${p.site.what ? `ה${p.site.what}` : 'מה'} שבניתם בשטח שלהם${lost ? `. ${lost} מהלוחמים שלהם נפלו` : ''}`; warLog(t, 'bad'); UI.notify(`⚔️ ${t}`, 'bad'); }
  else { r.sc.own = (r.sc.own || 0) + 2; PROG.flags.raidWonTribe = 1; const t = `הדפתם את ${campName(i)}!${lost ? ` ${lost} מהלוחמים שלהם נפלו.` : ''} מה שבניתם בשטח שלהם עדיין עומד`; warLog(t, 'good'); UI.notify(`🛡️ ${t}`, 'good'); AUD.play('cheer', 0.5); }
  saveGame();
}
// ---------- vassals: the defeated tribe serves the winner ----------
const vasOf = i => (WAR.vas && WAR.vas[i]) || null;
const isVassal = (i, lord) => { const v = vasOf(i); return !!v && (lord === undefined || v.lord === lord); };
const lordName = l => l === 'own' ? 'השבט שלך' : campName(l);
// i lost a war against lord ('own' or the index of another tribe)
function makeVassal(i, lord, why) {
  const c = HUNT.camps[i]; if (!c || c.gone || c.own || isVassal(i)) return;
  if (lord !== 'own' && (!HUNT.camps[lord] || HUNT.camps[lord].gone || isVassal(lord))) return;
  WAR.vas[i] = { lord, since: G.day, loy: 8, taxDay: G.day };
  // a vassal keeps no vassals of its own: they go free
  for (const k in WAR.vas) if (WAR.vas[k].lord === i) freeVassal(+k, true);
  const r = relGet(lord, i); r.st = 'peace'; r.truce = -1; r.days = 0; r.raidT = null; r.sc = {};
  for (const p of WAR.parties) if (!p.done && ((p.from === i && (p.to === lord || p.site)) || (p.from === lord && p.to === i) || (p.mine && p.to === i && lord === 'own'))) { if (p.mine) raidHome(p, true); else p.phase = 'retreat'; }
  WAR.terr[i] = Math.max(60, (WAR.terr[i] || 110) - 20);
  if (lord === 'own') { VX.known.add(i); addTrust(i, Math.max(0, 30 - campTrust(i))); PROG.flags.vassal = 1; }
  else { npcTrustAdd(i, lord, 50); WAR.terr[lord] = Math.min(190, (WAR.terr[lord] || 110) + 10); }
  vassalBanner(c);
  warLog(`${campName(i)} נכנעו ל${lordName(lord)}${why ? ` (${why})` : ''} והם עכשיו שבט חסות שלהם`, lord === 'own' ? 'good' : '');
  if (lord === 'own') { UI.big(`${campName(i)} נכנעו!`, 'מעכשיו הם שבט חסות שלך: שולחים מס של אוכל כל בוקר ונלחמים באויבים שלך. עם הזמן הם יצטרפו לשבט שלך'); AUD.play('cheer', 0.7); }
  else if (VX.known.has(i) || VX.known.has(lord)) UI.notify(`🏳️ ${campName(i)} הפסידו במלחמה ונכנעו ל${campName(lord)}`, '');
  saveGame();
}
function freeVassal(i, silent) {
  const v = vasOf(i); if (!v) return;
  delete WAR.vas[i]; const c = HUNT.camps[i]; if (c) vassalBanner(c);
  const r = relGet(v.lord, i); r.st = 'truce'; r.truce = G.day + 3;
  if (!silent) { warLog(`${campName(i)} שוחררו והם שוב שבט עצמאי`, ''); if (v.lord === 'own') { addTrust(i, 25); UI.notify(`${campName(i)} חופשיים שוב. הם זוכרים לכם את זה לטובה`, 'good'); } }
}
// a little flag of the lord's colour beside the vassal's fire
function vassalBanner(c) {
  if (c.banner) { scene.remove(c.banner); c.banner = null; }
  const v = vasOf(campIndex(c)); if (!v || c.gone) return;
  const lc = v.lord === 'own' ? TRIBEC.own : TRIBEC[tribeKeyOf(HUNT.camps[v.lord])] || '#e2a93b', g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 3.6, 6), new THREE.MeshLambertMaterial({ color: '#5a3f28' })); pole.position.y = 1.8; g.add(pole);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.8), new THREE.MeshLambertMaterial({ color: lc, side: THREE.DoubleSide })); fl.position.set(0.66, 3.1, 0); g.add(fl);
  const x = c.x + 2.2, z = c.z - 1.6; g.position.set(x, getH(x, z), z); scene.add(g); c.banner = g;
}
// every morning: the tribute comes, the vassal follows its lord to war, loyalty grows; at last the two tribes become one
function vassalDaily() {
  for (const k of Object.keys(WAR.vas)) {
    const i = +k, v = WAR.vas[k], c = HUNT.camps[i];
    if (!c || c.gone) { delete WAR.vas[k]; continue; }
    const L = v.lord === 'own' ? ownCamp() : HUNT.camps[v.lord];
    if (!L || L.gone) { freeVassal(i); continue; }
    const n = clamp(Math.round((WAR.food[i] || 0) * 0.3), 2, 9); WAR.food[i] = Math.max(0, (WAR.food[i] || 0) - n);
    if (v.lord === 'own') { boxStore().cooked += n; if (P.a) UI.notify(`🏳️ ${campName(i)} שלחו מס: ${n} מנות אוכל למחסן`, 'good'); }
    else WAR.food[v.lord] = (WAR.food[v.lord] || 0) + n;
    v.loy += 14 + Math.min(10, (v.lord === 'own' ? ownPower(true) : npcPower(v.lord)) / 3) - Math.min(6, c.hunters.filter(h => h.alive).length / 4);
    if (v.loy >= 100) mergeTribe(i, v.lord);
  }
  // NPC wars: a tribe beaten again and again gives in
  const ids = npcIdx();
  for (let a = 0; a < ids.length; a++) for (let b = a + 1; b < ids.length; b++) {
    const i = ids[a], j = ids[b], r = WAR.rel[pk(i, j)]; if (!r || r.st !== 'war') continue;
    const si = r.sc[i] || 0, sj = r.sc[j] || 0;
    if (si - sj >= 3 && npcPower(j) < npcPower(i) * 0.75) makeVassal(j, i, 'הפסידו במלחמה');
    else if (sj - si >= 3 && npcPower(i) < npcPower(j) * 0.75) makeVassal(i, j, 'הפסידו במלחמה');
  }
}
// a vassal fights its lord's wars, and its lord's enemies are its own
function vassalWars() {
  // they give in once the winners have taken what they came for
  if (WAR.pend && WAR.pend.length) for (let k = WAR.pend.length - 1; k >= 0; k--) { const q = WAR.pend[k]; if (G.t >= q.at && !WAR.parties.some(p => p.mine && !p.done && p.to === q.i && p.phase === 'loot')) { WAR.pend.splice(k, 1); makeVassal(q.i, q.lord, 'הפסידו במלחמה'); } }
  for (const k in WAR.vas) {
    const i = +k, v = WAR.vas[k];
    for (const j of npcIdx()) {
      if (j === i || isVassal(j, v.lord)) continue;
      const lordWar = v.lord === 'own' ? atWar(j) : atWarK(v.lord, j);
      const r = relGet(i, j); if (lordWar && r.st !== 'war') { r.st = 'war'; r.since = G.day; r.days = 0; r.sc = r.sc || {}; }
    }
    if (v.lord !== 'own' && ownCamp()) { const lr = WAR.rel[pk('own', v.lord)], r = relGet('own', i); if (lr && lr.st === 'war' && r.st !== 'war') { r.st = 'war'; r.since = G.day; r.days = 0; r.sc = {}; r.raidT = rr(500, 800); } else if ((!lr || lr.st !== 'war') && r.st === 'war') { r.st = 'truce'; r.truce = G.day + 2; } }
  }
}
// ---------- one tribe: the vassal's people move to the lord, the old camp is left ----------
function mergeTribe(i, lord) {
  const c = HUNT.camps[i]; if (!c || c.gone) return;
  const people = c.hunters.filter(h => h.alive && !h.gone && !h.raider && h.brain !== 'captive');
  let real = 0, res = 0, cows = 0;
  if (lord === 'own') {
    const v = ownCamp();
    for (const h of people) {
      h.duel = false; h.fleeing = false; h.state = 'idle'; h.foe = null; h.pets = (h.pets || []).filter(b => b.alive);
      if (clanReal().length < MAXREAL) {
        const young = !!h.young; h.cls = young ? 'child' : h.cls === 'chief' || h.cls === 'elder' ? 'builder' : WORK.includes(h.cls) ? h.cls : 'gatherer';
        tribeJoin(h); if (young) { h.kidAge = h.kidAge || KID_H * 0.5; } if (!TRIBE.adults.includes(h)) TRIBE.adults.push(h);
        if (h.home && v) h.home.set(v.x, 0, v.z); h.job = null; h.escort = false; real++;
      } else { h.remove(); CLAN.residents++; res++; }
    }
    if (c.cowGroup && v && v.cowGroup) for (const m of c.cowGroup.members.slice()) if (m.alive && !m.gone) { cowMove(m, v); cows++; }
    WAR.ownTerr = Math.min(130, (WAR.ownTerr || 0) + 20);
    UI.big(`${c.tribe} הצטרפו לשבט שלך!`, `${real + res} אנשים${cows ? ` ו־${cows} פרות` : ''} עוברים לגור בכפר. המחנה הישן שלהם ננטש`); AUD.play('cheer', 0.7); PROG.flags.merged = 1;
  } else {
    const L = HUNT.camps[lord];
    for (const h of people) { const k = c.hunters.indexOf(h); if (k >= 0) c.hunters.splice(k, 1); h.camp = L; L.hunters.push(h); h.home.set(L.x, 0, L.z); retemplate(h, ensureTribal(h.young ? 'child' : h.cls || 'gatherer', tribeKeyOf(L), h.sex)); h.state = 'idle'; h.stT = 1; }
    if (c.cowGroup && L.cowGroup) for (const m of c.cowGroup.members.slice()) if (m.alive && !m.gone) cowMove(m, L);
    WAR.men[lord] = Math.min(24, (WAR.men[lord] || 0) + (WAR.men[i] || 0)); WAR.terr[lord] = Math.min(200, (WAR.terr[lord] || 110) + 22); WAR.food[lord] = (WAR.food[lord] || 0) + (WAR.food[i] || 0);
    if ((L.lvl || 0) < 3) tribeLevelUp(L, lord, true);   // a bigger tribe: more room, more huts
    if (VX.known.has(i) || VX.known.has(lord)) UI.notify(`🏳️ ${c.tribe} הצטרפו ל${L.tribe}. המחנה הישן שלהם ננטש`, '');
  }
  warLog(`${c.tribe} הפכו לחלק מ${lordName(lord)}`, lord === 'own' ? 'good' : '');
  delete WAR.vas[i]; WAR.gone[i] = { into: lord, day: G.day };
  campGone(c);
  saveGame();
}
function cowMove(m, camp) {
  const g = m.group; if (g) { const k = g.members.indexOf(m); if (k >= 0) g.members.splice(k, 1); if (g.leader === m) g.leader = g.members.find(q => q.alive) || null; }
  const ng = camp.cowGroup; m.group = ng; ng.members.push(m); if (!ng.leader) ng.leader = m;
  m.cowCamp = camp; m.home.set(camp.x, 0, camp.z);
  if (m.dCam > 60) { const ang = rng() * TAU; m.pos.set(camp.x + Math.cos(ang) * 11, 0, camp.z + Math.sin(ang) * 11); m.ground(1, true); }
}
// an empty camp: no fire, no people, no smoke
function campGone(c) {
  c.gone = true;
  for (const h of c.hunters.slice()) if (!h.gone) h.remove();
  c.hunters = [];
  if (c.mesh) scene.remove(c.mesh); if (c.glowMesh) scene.remove(c.glowMesh); for (const m of c.flames || []) scene.remove(m); if (c.glow) scene.remove(c.glow);
  if (c.banner) { scene.remove(c.banner); c.banner = null; }
  for (const m of c.huts || []) scene.remove(m.mesh);
  if (c.cowGroup) for (const m of c.cowGroup.members.slice()) if (!m.gone && m.cowCamp === c) m.remove();
  const pi = POI.findIndex(p => p.camp && Math.hypot(p.x - c.x, p.z - c.z) < 1); if (pi >= 0) POI.splice(pi, 1);
  if (VX.mem === campIndex(c)) { VX.mem = -1; VX.rank = 0; VX.pts = 0; if (CAMPH.camp === c) CAMPH.camp = ownCamp(); }
}
// a beaten tribe may simply give in when asked
function surrenderChance(i) {
  const r = relGet('own', i), my = r.sc.own || 0, th = r.sc[i] || 0, k = ownPower(true) / Math.max(1, npcPower(i));
  return clamp(0.08 + (my - th) * 0.09 + (k - 1.2) * 0.25 + r.days * 0.03, 0.03, 0.9);
}
function demandSurrender(i) {
  const r = relGet('own', i); r.surDay = G.day;
  if (rng() < surrenderChance(i)) { makeVassal(i, 'own', 'נכנעו בלי קרב'); return true; }
  addTrust(i, -6); UI.notify(`${campName(i)} מסרבים להיכנע. צריך לנצח אותם במלחמה`, 'bad'); warLog(`${campName(i)} סירבו להיכנע`, 'bad');
  return false;
}
// ================= MORE TRIBES, AND THEY TGROW: new tribes in the new land, camps that become villages, families that found new tribes =================
Object.assign(TRIBEC, { lake: '#1f9e98', hill: '#8d5cc8', plain: '#e07b2a', snake: '#c9b12c', sun: '#e0569b', stone: '#6f7f99', moon: '#4f6fd6', clay: '#a8432b' });
Object.assign(CLOTH, { lake: '#6f8a72', hill: '#6e5a7a', plain: '#a8763e', snake: '#8a7a3a', sun: '#9a5a6a', stone: '#6a6a62', moon: '#5a5e7a', clay: '#8a4a32' });
const DAUGHTERS = [{ tribe: 'שבט השמש', key: 'sun' }, { tribe: 'שבט האבן', key: 'stone' }, { tribe: 'שבט הירח', key: 'moon' }, { tribe: 'שבט החימר', key: 'clay' }];
const LVLN = ['מחנה', 'כפר', 'כפר גדול', 'עיירה'];
const TGROW = { day: -1 };
const tribeCap = c => (c.deep ? 8 : 10) + (c.lvl || 0) * 3;
// cows: a tribe's herd grows with it; your village keeps more cows as it grows (and a pen holds more)
function cowCap(c) { if (c.own) return 2 + Math.max(0, villageTier()) * 2 + (CAMPH.up.pen ? 2 : 0) + BLD.list.filter(b => b.done && b.t === 'stable').length; return c.civ ? 5 + (c.lvl || 0) * 2 : 3 + (c.lvl || 0); }
// ---------- huts around a growing camp ----------
const HUTSET = [[], ['hut', 'hut'], ['house', 'hut'], ['long', 'house']];
function campHutSpot(c, t) {
  const R = mulberry32(((c.x * 73) ^ (c.z * 131) ^ ((c.huts || []).length * 977)) | 0), T = BTYPES[t];
  for (let k = 0; k < 60; k++) {
    const ang = R() * TAU, d = 9 + T.r + R() * 8, x = c.x + Math.cos(ang) * d, z = c.z + Math.sin(ang) * d;
    if (waterDepth(x, z) > 0 || !inBounds(x, z)) continue;
    let lo = 1e9, hi = -1e9; for (let q = 0; q < 6; q++) { const a = q / 6 * TAU, h = getH(x + Math.cos(a) * T.r, z + Math.sin(a) * T.r); lo = Math.min(lo, h); hi = Math.max(hi, h); if (waterDepth(x + Math.cos(a) * T.r, z + Math.sin(a) * T.r) > 0) hi = 1e9; }
    if (hi - lo > 1.4) continue;
    if ((c.huts || []).some(u => Math.hypot(u.x - x, u.z - z) < BTYPES[u.t].r + T.r + 2)) continue;
    if (BLD.list.some(b => bldDist(b, x, z) < T.r + bldR(b) + 2)) continue;
    return { t, x, z, rot: Math.atan2(c.x - x, c.z - z) };
  }
  return null;
}
function campHutMesh(c, u) {
  const m = bMesh(u.t); m.position.set(u.x, getH(u.x, u.z) - 0.05, u.z); m.rotation.y = u.rot; scene.add(m); u.mesh = m;
  u.obs = []; for (const [ox, oz, r] of BOBS[u.t] || []) { const cs = Math.cos(u.rot), s = Math.sin(u.rot), x = u.x + ox * cs + oz * s, z = u.z - ox * s + oz * cs, k = g10(x, z); (TRUNKS.g[k] || (TRUNKS.g[k] = [])).push(x, z, r); u.obs.push([k, x, z]); }
  treeScan(TREES.g, u.x, u.z, BTYPES[u.t].r + 0.8, e => { treeCut(e, {}); }); clearUnder(u.x, u.z, BTYPES[u.t].r + 1);
}
function campHutRemove(u) { if (u.mesh) scene.remove(u.mesh); removeObstacles(u); }
function campHuts(c) {
  c.huts = c.huts || []; if (c.civ || c.bandit) return;
  for (const t of HUTSET[c.lvl || 0] || []) { const u = campHutSpot(c, t); if (u) { c.huts.push(u); campHutMesh(c, u); } }
}
// ---------- every morning: food and peace make a tribe grow ----------
function tgDaily() {
  for (const i of npcIdx()) {
    const c = HUNT.camps[i], war = atWar(i) || npcIdx().some(j => atWarK(i, j)), food = WAR.food[i] || 0;
    if (c.civ || c.bandit) continue;   // the Old World's towns and the bandits keep their size
    c.gp = (c.gp || 0) + (food > 30 ? 1.25 : food > 16 ? 0.75 : 0.25) * (war ? 0.4 : 1) * (isVassal(i) ? 0.6 : 1);
    if ((c.lvl || 0) < 3 && c.gp >= 3 + (c.lvl || 0) * 2) { c.gp = 0; tribeLevelUp(c, i); }
    else if ((c.lvl || 0) >= 3 && c.gp >= 6 && !isVassal(i) && !war && npcIdx().filter(j => campLand(HUNT.camps[j]) === campLand(c)).length < (campLand(c) ? 4 : 11) && tribeSplit(c, i)) c.gp = 0;
  }
}
function tribeLevelUp(c, i, quiet) {
  c.lvl = Math.min(3, (c.lvl || 0) + 1);
  WAR.terr[i] = Math.min(190, (WAR.terr[i] || 110) + 10); WAR.men[i] = Math.min(24, (WAR.men[i] || 0) + 2);
  campHuts(c);
  if (quiet) return;
  for (let k = 0; k < 2; k++) spawnHunter(c, false);
  if (VX.known.has(i)) { UI.notify(`🏘️ ${c.tribe} גדל והפך ל${LVLN[c.lvl]}`, ''); warLog(`${c.tribe} גדל והפך ל${LVLN[c.lvl]}`, ''); }
}
// ---------- a big tribe sends families out to found a new tribe ----------
function tribeSplit(c, i) {
  const L = campLand(c), used = new Set(HUNT.camps.map(q => q.key)), D = (L ? LAND_DAUGHTERS[L] : DAUGHTERS).find(d => !used.has(d.key)); if (!D) return false;
  const R = mulberry32(((c.x * 31) ^ (c.z * 17) ^ (G.day * 7919)) | 0), live = HUNT.camps.filter(q => !q.gone), v = ownCamp();
  let best = null, bs = -1e9;
  for (let t = 0; t < 700; t++) {
    const ang = R() * TAU, d = 180 + R() * 200, x = c.x + Math.cos(ang) * d, z = c.z + Math.sin(ang) * d;
    if (!(L ? landSpotOk(x, z, L, 200, live) : campSpotOk(x, z, 200, live)) || (v && Math.hypot(v.x - x, v.z - z) < villageR() + 140) || zoneTribeAt(x, z) >= 0) continue;
    const wd = waterDist(x, z); if (wd > 55 || wd < 9) continue;
    const sc = -Math.abs(wd - 22) * 0.4 + R(); if (sc > bs) { bs = sc; best = { x, z }; }
  }
  if (!best) return false;
  const nc = newTribeCamp(best.x, best.z, D.tribe, D.key, i);
  const ni = campIndex(nc);
  // a few families walk out with a warrior who will lead them
  const go = c.hunters.filter(h => h.alive && !h.gone && h.cls !== 'chief' && !h.raider && !h.duel).sort((a, b) => (a.cls === 'warrior' ? -1 : 0) - (b.cls === 'warrior' ? -1 : 0)).slice(0, 4);
  for (const h of go) { const k = c.hunters.indexOf(h); c.hunters.splice(k, 1); h.camp = nc; nc.hunters.push(h); h.home.set(nc.x, 0, nc.z); retemplate(h, ensureTribal(h.young ? 'child' : h.cls, D.key, h.sex)); h.state = 'idle'; h.stT = 1; h.brain = h.cls === 'gatherer' || h.young || h.cls === 'elder' ? 'villager' : null; }
  const w = nc.hunters.find(h => h.cls === 'warrior'); if (w) { w.cls = 'chief'; w.elite = true; w.maxHp *= 1.2; retemplate(w, ensureTribal('chief', D.key, w.sex)); }
  WAR.men[ni] = Math.floor((WAR.men[i] || 0) / 2); WAR.men[i] = (WAR.men[i] || 0) - WAR.men[ni]; WAR.food[ni] = Math.round((WAR.food[i] || 0) * 0.4); WAR.food[i] -= WAR.food[ni];
  npcTrustAdd(i, ni, 60);
  if (VX.known.has(i)) { UI.notify(`🏕️ משפחות מ${c.tribe} יצאו והקימו שבט חדש: ${D.tribe}`, 'good'); warLog(`משפחות מ${c.tribe} הקימו את ${D.tribe}`, ''); }
  return true;
}
// a new camp: before your own camp in the list, so every tribe keeps its number (a loaded one goes back to the number it had)
function newTribeCamp(x, z, tribe, key, mother, at) {
  const w = nearestWater(x, z) || { x, z };
  const nc = { x, z, y: getH(x, z), rx: w.x, rz: w.z, hunters: [], flames: [], glow: null, tribe, key, fresh: true, mother, lvl: 0, gp: 0, dau: true };
  if (TRIBE_LAND[key]) nc.land = TRIBE_LAND[key];
  const oi = HUNT.camps.findIndex(q => q.own), lim = oi >= 0 ? oi : HUNT.camps.length;
  HUNT.camps.splice(at != null ? Math.min(at, lim) : lim, 0, nc);
  buildCamp(nc); POI.push({ x, z, n: tribe, camp: true });
  const grp = { kind: 'herd', members: [], leader: null, cows: nc }; GROUPS.push(grp); nc.cowGroup = grp; addCow(nc, grp); addCow(nc, grp);
  warEnsure(); WAR.terr[campIndex(nc)] = 90;
  return nc;
}
// a camp keeps no more people than it has room for (after a load or a new game); nobody in sight disappears
function campTrim(c, cap, unseen) {
  const busy = new Set(); for (const p of WAR.parties) for (const h of p.men || []) busy.add(h);
  const L = c.hunters.filter(h => h.alive && !h.gone); let n = L.length;
  for (let k = L.length - 1; k >= 0 && n > cap; k--) {
    const h = L[k]; if (h.cls === 'chief' || busy.has(h) || h.duel || h.isPartner || h.raider || h.brain === 'captive' || (unseen && (h.dCam || 999) < 60)) continue;
    h.remove(); const j = c.hunters.indexOf(h); if (j >= 0) c.hunters.splice(j, 1); n--;
  }
}
// ---------- save, load, a new game ----------
function tgSave() {
  const L = {}, D = [];
  HUNT.camps.forEach((c, i) => {
    if (c.own) return;
    const o = { l: c.lvl || 0, g: +(c.gp || 0).toFixed(2), h: (c.huts || []).map(u => [u.t, +u.x.toFixed(1), +u.z.toFixed(1), +u.rot.toFixed(2)]) };
    if (c.dau) D.push({ i, x: +c.x.toFixed(2), z: +c.z.toFixed(2), n: c.tribe, k: c.key, m: c.mother, ...o }); else if (o.l || o.g) L[i] = o;
  });
  return { L, D };
}
function tgApply(c, o) {
  c.lvl = o.l || 0; c.gp = o.g || 0;
  for (const u of c.huts || []) campHutRemove(u); c.huts = [];
  for (const [t, x, z, rot] of o.h || []) { if (!BTYPES[t]) continue; const u = { t, x, z, rot }; c.huts.push(u); campHutMesh(c, u); }
}
function tgLoad(d) {
  tgReset();
  if (!d) return;
  for (const q of (d.D || []).slice().sort((a, b) => a.i - b.i)) { const nc = newTribeCamp(q.x, q.z, q.n, q.k, q.m, q.i); tgApply(nc, q); }
  for (const k in d.L || {}) { const c = HUNT.camps[+k]; if (c && !c.own && !c.dau) tgApply(c, d.L[k]); }
  // a grown tribe has its people back at once
  for (const i of npcIdx()) { const c = HUNT.camps[i]; campTrim(c, tribeCap(c) + 2, true); let n = c.hunters.filter(h => h.alive).length, guard = 0; while (n < tribeCap(c) - 1 && guard++ < 20) { if (spawnHunter(c, false)) n++; else break; } }
}
// a new game: the tribes as they were at the start, merged tribes come back, the new ones are gone
function tgReset() {
  for (let i = HUNT.camps.length - 1; i >= 0; i--) {
    const c = HUNT.camps[i]; if (c.own) continue;
    for (const u of c.huts || []) campHutRemove(u); c.huts = []; c.lvl = 0; c.gp = 0;
    if (c.dau) { for (const h of c.hunters) if (!h.gone) h.remove(); if (c.mesh) scene.remove(c.mesh); if (c.glowMesh) scene.remove(c.glowMesh); for (const m of c.flames || []) scene.remove(m); if (c.glow) scene.remove(c.glow); if (c.cowGroup) for (const m of c.cowGroup.members.slice()) if (!m.gone) m.remove(); const pi = POI.findIndex(p => p.camp && Math.hypot(p.x - c.x, p.z - c.z) < 1); if (pi >= 0) POI.splice(pi, 1); HUNT.camps.splice(i, 1); continue; }
    if (c.gone) campRevive(c, i); else campTrim(c, tribeCap(c), false);
  }
  // a gang of bandits beaten in another game is back at its camp (unless this game beat it a short while ago)
  for (const c of HUNT.camps) if (c.bandit && !c.dormant && c.clearDay != null) { c.clearDay = null; c.looted = false; civPopulate(c, campIndex(c)); }
}
function campRevive(c, i) {
  c.gone = false; buildCamp(c); tribePopulate(c, i);
  if (!POI.some(p => p.camp && Math.hypot(p.x - c.x, p.z - c.z) < 1)) POI.push({ x: c.x, z: c.z, n: c.tribe, camp: true });
  if (c.cowGroup) { const n = 3 + (rng() * 2 | 0); for (let k = c.cowGroup.members.filter(m => m.alive).length; k < n; k++) addCow(c, c.cowGroup); }
}
function tgUpdate() {
  if (TGROW.day < 0) TGROW.day = G.day;
  if (G.day !== TGROW.day && G.time > 7) { TGROW.day = G.day; tgDaily(); }
}
