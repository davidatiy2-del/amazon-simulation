// ================= ROADS: between the towns and the castles, and the bandits who wait beside them =================
// Roads are found once (the cheapest way over the Old World's ground: gentle slopes, no sea, rivers crossed at fords),
// the ground under them is levelled, and a ribbon of beaten earth is laid on top. Bandit camps hide near the roads, and
// whoever passes by (you, a caravan, a merchant on the way to the next town) may be stopped: the gold or a fight.
// Knights ride out from the castles to keep the roads safe.
const ROADS = { list: [], mesh: null, bandits: [], t: 0, travT: 20, patT: 30, trav: [] };
const ROAD_LINKS = [['lion', 'mill'], ['lion', 'eagle'], ['eagle', 'vines'], ['eagle', 'wolves'], ['wolves', 'fjord'], ['eagle', 'khan'], ['vines', 'khan'], ['khan', 'herds'], ['herds', 'forbidden'],
  ['forbidden', 'rice'], ['khan', 'domes'], ['domes', 'palms'], ['domes', 'nile'], ['nile', 'timbuktu'], ['timbuktu', 'baobabs'], ['palace', 'spice'], ['shogun', 'fishers']];
const BANDIT_N = { 5: 'שודדי היער', 6: 'שודדי הפיורד', 7: 'שודדי הערבה', 8: 'שודדי ההרים', 9: 'שודדי החוף', 10: 'שודדי המדבר', 11: 'שודדי הסוואנה', 12: 'שודדי הג׳ונגל' };
// ---------- finding the way: A* over a 12.5 m grid of the Old World ----------
function roadFind(ax, az, bx, bz) {
  const CS = 12.5, N = Math.round(OW.size / CS), cost = ROADS.cost || (ROADS.cost = roadCostGrid(CS, N)), hg = ROADS.hg;
  const idx = (x, z) => clamp(Math.round((z - OW.z0) / CS), 0, N - 1) * N + clamp(Math.round((x - OW.x0) / CS), 0, N - 1);
  const s = idx(ax, az), t = idx(bx, bz), g = new Float32Array(N * N).fill(1e9), from = new Int32Array(N * N).fill(-1), done = new Uint8Array(N * N);
  const hk = [], hv = [];
  const push = (k, f) => { hk.push(k); hv.push(f); let i = hk.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (hv[p] <= hv[i]) break; [hk[p], hk[i]] = [hk[i], hk[p]]; [hv[p], hv[i]] = [hv[i], hv[p]]; i = p; } };
  const pop = () => {
    const top = hk[0], lk = hk.pop(), lv = hv.pop();
    if (hk.length) {
      hk[0] = lk; hv[0] = lv; let i = 0;
      for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < hk.length && hv[l] < hv[m]) m = l; if (r < hk.length && hv[r] < hv[m]) m = r; if (m === i) break; [hk[m], hk[i]] = [hk[i], hk[m]]; [hv[m], hv[i]] = [hv[i], hv[m]]; i = m; }
    }
    return top;
  };
  const tx = t % N, tz = (t / N) | 0, hf = k => Math.hypot(k % N - tx, ((k / N) | 0) - tz) * 1.15;
  g[s] = 0; push(s, hf(s));
  let n = 0;
  while (hk.length && n++ < 250000) {
    const k = pop(); if (done[k]) continue; done[k] = 1; if (k === t) break;
    const x = k % N, z = (k / N) | 0;
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dz) continue; const nx = x + dx, nz = z + dz; if (nx < 0 || nz < 0 || nx >= N || nz >= N) continue;
      const q = nz * N + nx, c = cost[q]; if (c >= 999 || done[q]) continue;
      const dh = Math.abs(hg[q] - hg[k]), ng = g[k] + (dx && dz ? 1.414 : 1) * (c + cost[k]) * 0.5 + dh * 1.2 + dh * dh * 0.15;
      if (ng < g[q]) { g[q] = ng; from[q] = k; push(q, ng + hf(q)); }
    }
  }
  if (from[t] < 0 && s !== t) return null;
  const out = []; for (let k = t; k >= 0; k = from[k]) { out.push({ x: OW.x0 + (k % N) * CS, z: OW.z0 + ((k / N) | 0) * CS }); if (k === s) break; }
  return out.reverse();
}
function roadCostGrid(CS, N) {
  const cost = new Float32Array(N * N), hg = ROADS.hg = new Float32Array(N * N);
  for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) {
    const wx = OW.x0 + x * CS, wz = OW.z0 + z * CS, h = owH(wx, wz), i = owIdx(wx, wz), k = z * N + x; hg[k] = h;
    if (h < 0.2) { cost[k] = SD2[i] < 14 ? 30 : 999; continue; }   // a river is crossed at a ford; the sea not at all
    const sl = 1 - NY2[i]; cost[k] = 1 + sl * 30 + sl * sl * 400 + (h > 70 ? (h - 70) * 0.4 : 0);
  }
  // through another town only if there is no other way
  for (const S of OWS.list) { const r = Math.ceil((S.r + 6) / CS), cx = Math.round((S.x - OW.x0) / CS), cz = Math.round((S.z - OW.z0) / CS); for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) { const x = cx + dx, z = cz + dz; if (x >= 0 && z >= 0 && x < N && z < N && Math.hypot(dx, dz) * CS < S.r + 4) cost[z * N + x] = Math.max(cost[z * N + x], 8); } }
  return cost;
}
// a line through the same places, with a point every step metres
function roadResample(P, step) {
  const out = [{ x: P[0].x, z: P[0].z }]; let need = step;
  for (let k = 1; k < P.length; k++) {
    let ax = P[k - 1].x, az = P[k - 1].z; const bx = P[k].x, bz = P[k].z; let L = Math.hypot(bx - ax, bz - az);
    while (L >= need) { const f = need / L; ax += (bx - ax) * f; az += (bz - az) * f; out.push({ x: ax, z: az }); L -= need; need = step; }
    need -= L;
  }
  const l = P[P.length - 1], q = out[out.length - 1]; if (Math.hypot(l.x - q.x, l.z - q.z) > step * 0.3) out.push({ x: l.x, z: l.z }); else { q.x = l.x; q.z = l.z; }
  return out;
}
// every Old World cell within rad of a road, with how far it is and where along the road it is nearest
function roadCells(P, rad, fn) {
  const D = ROADS._d || (ROADS._d = new Float32Array(OWNV).fill(1e9)), T = ROADS._t || (ROADS._t = new Float32Array(OWNV)), touched = [];
  for (let k = 0; k < P.length - 1; k++) {
    const a = P[k], b = P[k + 1], bx = b.x - a.x, bz = b.z - a.z, l2 = bx * bx + bz * bz;
    owForGrid([Math.min(a.x, b.x) - rad, Math.max(a.x, b.x) + rad, Math.min(a.z, b.z) - rad, Math.max(a.z, b.z) + rad], (i, x, z) => {
      let f = l2 > 0 ? ((x - a.x) * bx + (z - a.z) * bz) / l2 : 0; f = f < 0 ? 0 : f > 1 ? 1 : f;
      const d = Math.hypot(x - a.x - bx * f, z - a.z - bz * f); if (d > rad) return;
      if (D[i] > 1e8) touched.push(i);
      if (d < D[i]) { D[i] = d; T[i] = k + f; }
    });
  }
  for (const i of touched) { fn(i, D[i], T[i]); D[i] = 1e9; }
}
// ---------- making the roads: out of each town's gate, along the easiest ground, into the next town ----------
function owPlanRoads() {
  const t0 = performance.now(), byId = {};
  for (const S of OWS.list) {
    byId[S.id] = S;
    // the front of the place (its gate) looks towards its water, as the town is built
    const w = nearestWaterOW(S.x, S.z, S.r + 140); S.wp = w; S.fa = w ? Math.atan2(w.x - S.x, w.z - S.z) : 0;
  }
  // a walled place is left by its gate; an open one on the side that faces where the road goes (but not into the water)
  const walled = S => S.civ === 'vikings' || (S.civ === 'knights' && S.kind === 'castle') || ((S.civ === 'china' || S.civ === 'arabs' || S.civ === 'india') && S.kind === 'city');
  const exitAng = (S, O) => {
    if (walled(S)) return S.fa;
    const a0 = Math.atan2(O.x - S.x, O.z - S.z);
    for (let k = 0; k < 13; k++) { const a = a0 + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 0.26, d = S.r * 1.25 + 14; if (owH(S.x + Math.sin(a) * d, S.z + Math.cos(a) * d) > 0.6 && owH(S.x + Math.sin(a) * S.r * 1.25, S.z + Math.cos(a) * S.r * 1.25) > 0.6) return a; }
    return S.fa;
  };
  const out = (S, ang, k, m) => ({ x: S.x + Math.sin(ang) * (S.r * k + (m || 0)), z: S.z + Math.cos(ang) * (S.r * k + (m || 0)) });
  for (const [a, b] of ROAD_LINKS) {
    const A = byId[a], B = byId[b]; if (!A || !B) continue;
    const fa = exitAng(A, B), fb = exitAng(B, A), front = (S, k, m) => out(S, S === A ? fa : fb, k, m);
    // straight out of the gate for a while, and only then towards the other place
    let ga = front(A, 1.25, 14), gb = front(B, 1.25, 14);
    let raw = roadFind(ga.x, ga.z, gb.x, gb.z);
    if (!raw) { ga = front(A, 1.25); gb = front(B, 1.25); raw = roadFind(ga.x, ga.z, gb.x, gb.z); }
    if (!raw || raw.length < 3) continue;
    // fewer corners, then a smooth curve: from the town's street out through the gate, and in at the other end
    const ia = front(A, 0.45), oa = front(A, 1.25), ib = front(B, 0.45), ob = front(B, 1.25);
    let keep = [[oa.x, oa.z], [ga.x, ga.z]]; for (let k = 2; k < raw.length - 2; k += 2) if (Math.hypot(raw[k].x - ga.x, raw[k].z - ga.z) > 20 && Math.hypot(raw[k].x - gb.x, raw[k].z - gb.z) > 20) keep.push([raw[k].x, raw[k].z]);
    keep.push([gb.x, gb.z], [ob.x, ob.z]);
    // evenly spaced points, then the corners rounded (each point drawn a little towards its neighbours, many times over),
    // so every bend is wide enough for a road to turn without folding; the stretch through each gate stays straight
    const P = roadResample(catmull([[ia.x, ia.z], ...keep, [ib.x, ib.z]], 5), 4);
    const fixed = P.map(p => Math.hypot(p.x - A.x, p.z - A.z) < A.r * 1.08 || Math.hypot(p.x - B.x, p.z - B.z) < B.r * 1.08);
    for (let it = 0; it < 60; it++) for (let k = 1; k < P.length - 1; k++) if (!fixed[k]) { const a = P[k - 1], b = P[k + 1], p = P[k]; p.x = p.x * 0.5 + (a.x + b.x) * 0.25; p.z = p.z * 0.5 + (a.z + b.z) * 0.25; }
    let len = 0; for (let k = 1; k < P.length; k++) len += Math.hypot(P[k].x - P[k - 1].x, P[k].z - P[k - 1].z);
    ROADS.list.push({ a, b, P, len, bb: polyBBox(P, 4) });
  }
  // the ground under each road: level across, smooth along; a shallow ford where it meets a river (but the towns stay as they are)
  const inTown = (x, z) => OWS.list.some(S => Math.abs(x - S.x) < S.r + 3 && Math.abs(z - S.z) < S.r + 3 && Math.hypot(x - S.x, z - S.z) < S.r + 3);
  for (const R of ROADS.list) {
    const n = R.P.length, sm = R.P.map(p => owH(p.x, p.z));
    for (let pass = 0; pass < 4; pass++) for (let k = 1; k < n - 1; k++) sm[k] = (sm[k - 1] + sm[k] * 2 + sm[k + 1]) / 4;
    R.y = sm;
    roadCells(R.P, 10.5, (i, d, t) => {
      const x = owX(i % OW.V), z = owZ((i / OW.V) | 0); if (inTown(x, z)) return;
      const k0 = Math.floor(t), k1 = Math.min(n - 1, k0 + 1), y = lerp(sm[k0], sm[k1], t - k0), w = smooth(10.5, 4.8, d);
      if (HM2[i] < 0.25 && SD2[i] < 30) { HM2[i] = lerp(HM2[i], -0.26, w); R.ford = true; }   // the ford
      else HM2[i] = lerp(HM2[i], Math.max(y, 0.45), w);
    });
  }
  // the bandits: a hidden camp off a long road, somewhere along the middle of it
  const used = [];
  for (const R of ROADS.list.slice().sort((p, q) => q.len - p.len)) {
    if (R.len < 380 || ROADS.bandits.length >= 9) continue;
    for (let t = 0; t < 48; t++) {
      const k = Math.floor(R.P.length * (0.3 + 0.4 * ((t * 0.37) % 1))), p = R.P[k], q = R.P[Math.min(R.P.length - 1, k + 1)];
      let nx = -(q.z - p.z), nz = q.x - p.x; const L = Math.hypot(nx, nz) || 1; nx /= L; nz /= L; const side = t % 2 ? 1 : -1, off = 40 + (t % 3) * 8;
      const x = p.x + nx * off * side, z = p.z + nz * off * side;
      if (!inOld(x, z)) continue;
      const h = owH(x, z); if (h < 1.2 || h > 60 || NY2[owIdx(x, z)] < 0.9 || SD2[owIdx(x, z)] < 20) continue;
      if (OWS.list.some(S => Math.hypot(S.x - x, S.z - z) < S.r + 130) || used.some(u => Math.hypot(u.x - x, u.z - z) < 320)) continue;
      if (ROADS.list.some(R2 => Math.abs(x - (R2.bb[0] + R2.bb[1]) / 2) < (R2.bb[1] - R2.bb[0]) / 2 + 30 && Math.abs(z - (R2.bb[2] + R2.bb[3]) / 2) < (R2.bb[3] - R2.bb[2]) / 2 + 30 && nearestOnPoly(x, z, R2.P)[0] < 26)) continue;
      const L2 = owLandAt(x, z); if (L2 < 5 || L2 > 12) continue;
      let wet = false; for (let a = 0; a < 8 && !wet; a++) if (owH(x + Math.cos(a) * 12, z + Math.sin(a) * 12) < 0.5) wet = true; if (wet) continue;
      const b = { x, z, r: 9, land: L2, ambush: { x: p.x, z: p.z }, road: ROADS.list.indexOf(R) }; ROADS.bandits.push(b); used.push(b);
      owForGrid([x - 15, x + 15, z - 15, z + 15], (i, gx2, gz2) => { const d = Math.hypot(gx2 - x, gz2 - z); if (d < 14) HM2[i] = lerp(HM2[i], h, smooth(14, 6, d)); });
      break;
    }
  }
  // nothing grows on a road, and the bandits keep their clearing
  for (const R of ROADS.list) roadCells(R.P, 4.6, i => { if (!OWB[i]) OWB[i] = 2; });
  roadFineMask();
  for (const b of ROADS.bandits) owForGrid([b.x - 12, b.x + 12, b.z - 12, b.z + 12], (i, x, z) => { if (Math.hypot(x - b.x, z - b.z) < 11) OWB[i] = 1; });
  ROADS.ms = performance.now() - t0; ROADS.cost = null; ROADS.hg = null; ROADS._d = null; ROADS._t = null;
}
// a finer picture of the roads, 2 m to a cell: 1 on the road itself, 2 beside it (no plants on a road, no trees right beside it)
const RFN = Math.round(OW.size / 2);
function roadFineMask() {
  const M = ROADS.fine = new Uint8Array(RFN * RFN);
  for (const R of ROADS.list) for (let k = 0; k < R.P.length - 1; k++) {
    const a = R.P[k], b = R.P[k + 1], bx = b.x - a.x, bz = b.z - a.z, l2 = bx * bx + bz * bz;
    const i0 = Math.max(0, Math.floor((Math.min(a.x, b.x) - 7 - OW.x0) / 2)), i1 = Math.min(RFN - 1, Math.ceil((Math.max(a.x, b.x) + 7 - OW.x0) / 2));
    const j0 = Math.max(0, Math.floor((Math.min(a.z, b.z) - 7 - OW.z0) / 2)), j1 = Math.min(RFN - 1, Math.ceil((Math.max(a.z, b.z) + 7 - OW.z0) / 2));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const x = OW.x0 + i * 2 + 1, z = OW.z0 + j * 2 + 1;
      let f = l2 > 0 ? ((x - a.x) * bx + (z - a.z) * bz) / l2 : 0; f = f < 0 ? 0 : f > 1 ? 1 : f;
      const d = Math.hypot(x - a.x - bx * f, z - a.z - bz * f), v = d < 3.9 ? 1 : d < 6.5 ? 2 : 0, q = j * RFN + i;
      if (v && (!M[q] || v < M[q])) M[q] = v;
    }
  }
}
const roadFine = (x, z) => { const M = ROADS.fine; if (!M || !inOld(x, z)) return 0; const i = Math.floor((x - OW.x0) / 2), j = Math.floor((z - OW.z0) / 2); return i >= 0 && j >= 0 && i < RFN && j < RFN ? M[j * RFN + i] : 0; };
// the bandits' camps join the world's camps after the towns (so the numbers of all the others stay as they were)
function owBanditCamps() {
  ROADS.bandits.forEach((b, k) => {
    if (b.camp) return;
    const c = { x: b.x, z: b.z, y: getH(b.x, b.z), rx: b.x, rz: b.z, hunters: [], flames: [], glow: null, tribe: BANDIT_N[b.land] || 'שודדי הדרכים', key: 'c_bandit' + k,
      fresh: true, land: b.land, lvl: 1, bandit: true, kind: 'bandits', set: { kind: 'bandits', id: 'bandit' + k }, ambush: b.ambush, road: b.road, bk: k, dormant: true, old: true };
    b.camp = c; HUNT.camps.push(c); OWS.dormant = true; TRIBEC[c.key] = '#3a3430';
  });
}
// ---------- the roads on the ground: a ribbon of beaten earth that follows every bump ----------
// Where two roads leave a town by the same gate they share the way; that stretch is laid once, and the second road
// branches off at the fork (its first piece slips under the older road, so the two never flicker over each other).
function roadsMesh() {
  if (!ROADS.list.length) return;
  const P = [], C = [], I = [], cols = [col('#7d6c46'), col('#987c55'), col('#937851'), col('#8d7250'), col('#7d6c46')], SIDE = [-2.7, -1.7, 0, 1.7, 2.7], NV = SIDE.length;
  const hash = new Map(), key = (a, b) => a * 100003 + b;
  const taken = (x, z) => {
    const ia = Math.floor(x / 4), ib = Math.floor(z / 4);
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const L = hash.get(key(ia + a, ib + b)); if (L) for (let k = 0; k < L.length; k += 2) if (Math.hypot(L[k] - x, L[k + 1] - z) < 4.6) return true; }
    return false;
  };
  const strip = run => {
    const base = P.length / 3;
    for (let k = 0; k < run.length; k++) {
      const a = run[Math.max(0, k - 2)].p, b = run[Math.min(run.length - 1, k + 2)].p; let tx = b.x - a.x, tz = b.z - a.z; const L = Math.hypot(tx, tz) || 1; tx /= L; tz /= L;
      const nx = -tz, nz = tx, { p, low, end } = run[k];
      for (let q = 0; q < NV; q++) {
        const s = SIDE[q] * (end ? 0.6 : 1), x = p.x + nx * s, z = p.z + nz * s, h = getH(x, z);
        // a little higher on a slope, so the ground between the points does not poke through
        const y = h + (low ? 0.035 : 0.07) + (1 - getNY(x, z)) * 0.9;
        P.push(x, y, z); const j = Noise.n2(x * 0.3, z * 0.3) * 0.05 + (h < 0.05 ? -0.08 : 0), c = cols[q];
        C.push(clamp(c.r + j, 0, 1), clamp(c.g + j, 0, 1), clamp(c.b + j, 0, 1));
      }
      if (k < run.length - 1) { const r0 = base + k * NV, r1 = r0 + NV; for (let q = 0; q < NV - 1; q++) I.push(r0 + q, r0 + q + 1, r1 + q, r0 + q + 1, r1 + q + 1, r1 + q); }
    }
  };
  for (const R of ROADS.list) {
    const pts = []; let acc = 0;
    for (let k = 0; k < R.P.length; k++) { if (k && (acc += Math.hypot(R.P[k].x - R.P[k - 1].x, R.P[k].z - R.P[k - 1].z)) < 2 && k < R.P.length - 1) continue; acc = 0; pts.push(R.P[k]); }
    const n = pts.length, endAt = k => Math.min(k, n - 1 - k) < 2, skip = [];
    const put = p => { const kk = key(Math.floor(p.x / 4), Math.floor(p.z / 4)); let L = hash.get(kk); if (!L) hash.set(kk, L = []); L.push(p.x, p.z); };
    for (let k = 0; k < n; k++) { skip.push(taken(pts[k].x, pts[k].z)); if (k >= 8) put(pts[k - 8]); }
    let run = [];
    // a short piece between two shared stretches would only be a stub beside the other road
    const flush = () => { if (run.length >= 2 && (run.length >= 7 || run[0].p === pts[0] || run[run.length - 1].p === pts[n - 1])) strip(run); run = []; };
    for (let k = 0; k < n; k++) {
      if (!skip[k]) { if (!run.length && k > 0) run.push({ p: pts[k - 1], low: true, end: endAt(k - 1) }); run.push({ p: pts[k], low: false, end: endAt(k) }); }
      else if (run.length) { run.push({ p: pts[k], low: true, end: endAt(k) }); flush(); }
    }
    flush();
    for (let k = Math.max(0, n - 8); k < n; k++) put(pts[k]);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setIndex(I); g.computeVertexNormals(); g.computeBoundingSphere();
  const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  m.receiveShadow = true; scene.add(m); ROADS.mesh = m;
}
const onRoad = (x, z) => roadFine(x, z) === 1;
// does a thing r metres across, standing at x, z, sit on a road?
function roadHits(x, z, r) {
  if (!ROADS.fine || !inOld(x, z)) return false;
  if (roadFine(x, z) === 1) return true;
  for (const f of [0.5, 1]) for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; if (roadFine(x + Math.cos(a) * r * f, z + Math.sin(a) * r * f) === 1) return true; }
  return false;
}

// ---------- bandits on the road ----------
const isBandit = h => !!(h && h.camp && h.camp.bandit);
const banditMen = c => c.hunters.filter(h => h.alive && !h.gone && !h.young);
function banditsUpdate(dt) {
  if ((ROADS.t -= dt) > 0 || G.mode !== 'play') return; ROADS.t = 0.5;
  const a = P.a;
  for (const c of HUNT.camps) {
    if (!c.bandit || c.gone || c.dormant) continue;
    const men = banditMen(c);
    // a camp whose bandits all fell: their loot is there for the taking, and after a few days another gang moves in
    if (!men.length) {
      if (c.clearDay == null) { c.clearDay = G.day; PROG.flags['bg' + c.bk] = G.day; if (a && Math.hypot(a.pos.x - c.x, a.pos.z - c.z) < 150) UI.notify(`${c.tribe} לא ישדדו יותר בדרך הזו. במחנה שלהם נשארה השלל`, 'good'); }
      if (!c.looted && a && a.alive && P.human && Math.hypot(a.pos.x - c.x, a.pos.z - c.z) < 9) banditLoot(c);
      if (G.day - c.clearDay >= 3 && (!a || Math.hypot(a.pos.x - c.x, a.pos.z - c.z) > 320)) { c.clearDay = null; c.looted = false; delete PROG.flags['bg' + c.bk]; delete PROG.flags['bl' + c.bk]; civPopulate(c, campIndex(c)); }
      continue;
    }
    // a bandit who went too far after someone comes back to the camp
    for (const h of men) if (h.ambush && (!h.ambush.alive || G.t > h.ambushT)) h.ambush = null;
    if ((c.ambushCD || 0) > G.t) continue;
    const am = c.ambush;
    if (a && a.alive && P.human && !P.ship && !P.boat && !(c.paidT > G.t) && Math.hypot(a.pos.x - am.x, a.pos.z - am.z) < 34) { banditAmbush(c, a); continue; }
    for (const m of TRADE.cv) if (m.alive && Math.hypot(m.pos.x - am.x, m.pos.z - am.z) < 34) { banditAmbush(c, m); break; }
    if ((c.ambushCD || 0) > G.t) continue;
    for (const h of ROADS.trav) if (h.alive && Math.hypot(h.pos.x - am.x, h.pos.z - am.z) < 34) { banditAmbush(c, h); break; }
  }
  roadTravelers(0.5); knightPatrols(0.5);
}
function banditAmbush(c, t) {
  c.ambushCD = G.t + 150;
  const men = banditMen(c).filter(h => !h.fleeing && Math.hypot(h.pos.x - t.pos.x, h.pos.z - t.pos.z) < 230).slice(0, 3);
  if (!men.length) return;
  for (const h of men) { h.ambush = t; h.ambushT = G.t + 50; h.state = 'idle'; h.think = 0.2; }
  const ch = men.find(h => h.ruler) || men[0];
  if (ch.dCam < 70) say(ch, pick(['הזהב או החיים!', 'עצור! הדרך הזו שלנו', 'תן את מה שיש לך, ותמשיך הלאה']), 3);
  if (t.isPlayer) {
    P.pings.push({ x: ch.pos.x, z: ch.pos.z, t: 8 }); AUD.play('whistle', 0.7);
    const g = goldHave(), ask = Math.max(8, Math.min(30, Math.round(g * 0.4)));
    // whoever has no gold may pay in food (they take what they can get)
    if (g >= ask) banditCard(c, ask, men); else if (foodHave() >= 3) banditCard(c, 0, men, 3); else UI.notify(`⚔️ ${c.tribe} יוצאים מבין העצים ומסתערים עליך! אין לך זהב או אוכל לתת להם`, 'bad');
  } else if (t.dCam < 160 || t.tribe) UI.notify(`🗡️ ${c.tribe} תוקפים את ${t.name || 'הסוחר'} בדרך!`, 'bad');
}
function banditCard(c, ask, men, food) {
  const what = food ? `${food} מנות אוכל` : `${ask} זהב`;
  const el = uiCard('warov', `<div class="vxwho"><span class="vxic">🗡️</span><div><h2>שודדי דרכים!</h2><p class="idim">${c.tribe} חוסמים את הדרך</p></div></div><p class="vxsay">"${food ? 'אין לך זהב? אז את האוכל שלך' : 'הזהב או החיים'}! תן לנו ${what}, ותמשיך בשלום."</p>` +
    `<p class="idim">${food ? `יש לך ${foodHave()} מנות אוכל` : `יש לך ${goldHave()} זהב`}. מי שמנצח שודדים מוצא אצלם זהב, ובמחנה שלהם יש שלל</p><div class="btns vxbtns"><button class="btn" data-a="pay">${food ? '🍖' : '🪙'} לתת ${what}</button><button class="btn pri" data-a="fight">⚔️ להילחם</button></div>`);
  el.onclick = e => {
    const b = e.target.closest('button'); if (!b) return; closeCard('warov');
    if (b.dataset.a === 'pay') {
      if (food) payFood(food); else goldPay(ask);
      c.paidT = G.t + 240; c.stolen = (c.stolen || 0) + (food ? 4 : ask);
      for (const h of men) { h.ambush = null; h.foe = null; h.state = 'idle'; if (h.alive) hGoto(h, c.x + rr(-3, 3), c.z + rr(-3, 3), 'camp'); }
      UI.notify(`נתת להם ${what}. השודדים חוזרים אל בין העצים`, '');
    } else UI.notify('⚔️ להילחם! שודד שנופל משאיר את הזהב שלו', 'bad');
  };
}
// a bandit who falls drops what he stole
function banditBounty(t, src) {
  if (!isBandit(t) || !src || !ourPeople(src)) return;
  const n = Math.round(rr(3, 8)); goldAdd(n); PROG.flags.bandit = (PROG.flags.bandit || 0) + 1;
  if (src.isPlayer || (P.a && dist2(t.pos, P.a.pos) < 60)) combatText(`+${n} 🪙`, 'good');
}
// the camp of a gang that is gone: their stolen gold, food and weapons
function banditLoot(c) {
  c.looted = true; PROG.flags['bl' + c.bk] = 1;
  const gold = Math.round(25 + rr(0, 25) + (c.stolen || 0)), food = Math.round(rr(4, 9)), st = boxStore();
  goldAdd(gold); st.meat = (st.meat || 0) + food; st.spears = (st.spears || 0) + 2; if (rng() < 0.5) st.swords = (st.swords || 0) + 1;
  c.stolen = 0; PROG.flags.banditLoot = 1; gainXP(60);
  UI.big('השלל של השודדים', `${gold} זהב, ${food} מנות בשר וכלי נשק. הכל נשלח למחסן ${ownCamp() ? 'של הכפר' : 'שלך'}`); AUD.play('cheer', 0.6); saveGame();
}
// the hunter's side of the BRAIN: bandits who ambush run at their mark until they are close enough to fight
function banditCharge(h, dt) {
  const t = h.ambush; if (!t || !t.alive || G.t > h.ambushT || h.fleeing) { h.ambush = null; return false; }
  const d = Math.hypot(t.pos.x - h.pos.x, t.pos.z - h.pos.z); if (d < 30) return false;
  h.steerTo(t.pos.x, t.pos.z, (h.sp.run || 5) * 0.8, dt); h.pose = 'move'; return true;
}
// ---------- people on the roads: townsfolk walking to the next town and back ----------
function roadTravelers(step) {
  ROADS.trav = ROADS.trav.filter(h => h.alive && !h.gone && h.trav);
  if ((ROADS.travT -= step) > 0 || ROADS.trav.length >= 4 || !P.a || !isOld(P.a.pos.x)) return;
  ROADS.travT = rr(25, 55);
  const R = pick(ROADS.list); if (!R) return;
  const back = rng() < 0.5, from = HUNT.camps.find(c => c.civ && c.set && c.set.id === (back ? R.b : R.a) && !c.dormant && !c.gone); if (!from) return;
  if (Math.hypot(from.x - P.a.pos.x, from.z - P.a.pos.z) > 900) return;
  const h = from.hunters.find(q => q.alive && !q.young && !q.brain && (q.cls === 'builder' || q.cls === 'hunter') && !q.trav && !q.ruler && q.state !== 'defend'); if (!h) return;
  h.trav = { R, back, k: back ? R.P.length - 1 : 0, ph: 'go', wait: 0 };
  h.brain = 'traveler'; ROADS.trav.push(h);
}
BRAIN.traveler = function (h, dt) {
  const T = h.trav; if (!T) { h.brain = null; return; }
  if (h.fleeing || h.state === 'defend' || h.windup > 0 || h.stun > 0) { BRAIN.hunter(h, dt); return; }
  if ((h.think -= dt) <= 0) { h.think = 0.5; const th = hunterThreat(h); if (th) { h.foe = th; h.state = 'defend'; return; } }
  if (T.wait > 0) { T.wait -= dt; h.move(0, 0, 0, dt); h.pose = 'talk'; return; }
  const P0 = T.R.P, dir = (T.ph === 'go') !== T.back ? 1 : -1, p = P0[T.k];
  h.steerTo(p.x, p.z, (h.sp.walk || 1.5) * 1.15, dt); h.pose = 'move';
  const d = Math.hypot(p.x - h.pos.x, p.z - h.pos.z);
  if (d < 3) {
    T.k += dir * 2;
    if (T.k < 0 || T.k > P0.length - 1) {
      T.k = clamp(T.k, 0, P0.length - 1);
      if (T.ph === 'go') { T.ph = 'back'; T.wait = 14; if (h.dCam < 40) say(h, pick(['עוד יום של מסחר בעיר השכנה', 'הדרכים לא בטוחות בימים האלה', 'הבאתי סחורה מהעיר']), 2.5); }
      else { h.brain = null; h.trav = null; h.state = 'idle'; h.stT = 2; }
    }
  }
};
// ---------- the knights keep the roads safe: now and then a warrior walks out to where the bandits wait ----------
function knightPatrols(step) {
  if ((ROADS.patT -= step) > 0) return; ROADS.patT = rr(60, 100);
  for (const c of HUNT.camps) {
    if (!c.civ || c.dormant || c.gone || !(c.kind === 'castle' || c.kind === 'city')) continue;
    let best = null, bd = 950;
    for (const b of HUNT.camps) if (b.bandit && !b.gone && !b.dormant && banditMen(b).length) { const d = Math.hypot(b.ambush.x - c.x, b.ambush.z - c.z); if (d < bd) { bd = d; best = b; } }
    if (!best) continue;
    // one patrol out of each castle at a time
    if (c.hunters.some(h => h.alive && h.patrolT)) continue;
    const k = c.hunters.find(h => h.alive && h.cls === 'warrior' && !h.brain && !h.patrolT && h.state !== 'defend');
    if (!k) continue;
    // a knight rides out on one of the castle's horses
    if (!k.mount && campHorses(c).length) { const h = mountAnimal(mountOf(c) || 'horse', k.pos.x, k.pos.z, { scale: rr(0.98, 1.04) }); h.ground(1, true); Object.assign(h, { socialExtra: true, patrolHorse: true, campHorse: null }); if (!mountUp(k, h)) h.remove(); }
    k.patrolT = G.t + 150; hGoto(k, best.ambush.x + rr(-6, 6), best.ambush.z + rr(-6, 6), null); k.stT = 170;
  }
  for (const c of HUNT.camps) if (c.civ) for (const h of c.hunters) {
    if (h.patrolT && G.t > h.patrolT) h.patrolT = 0;
    // back home from the patrol: the horse goes back to the stable
    if (!h.patrolT && h.mount && h.mount.patrolHorse && Math.hypot(h.pos.x - c.x, h.pos.z - c.z) < 45) { const m = h.mount; mountOff(h); m.remove(); }
  }
}
