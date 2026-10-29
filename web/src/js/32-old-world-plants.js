// ---------- the plants of the Old World: oaks, cypresses, bamboo and cherry trees, and the New World's kinds where they belong ----------
function bOak(v) {
  const r = mulberry32(2100 + v), R = (a, b) => a + (b - a) * r();
  const near = new VB(), far = new VB(), H = R(7.5, 10), tr = R(0.42, 0.55);
  const barkC = col(['#6e5b45', '#5f4e3c', '#7a6650'][v % 3]), leafC = col(['#3f6a2a', '#4a7530', '#38602a'][v % 3]);
  near.geo(new THREE.CylinderGeometry(tr * 0.7, tr, H * 0.55, 8, 2, true), M([0, H * 0.275, 0]), AT.bark, barkC, 0.4);
  near.geo(new THREE.CylinderGeometry(tr, tr * 1.6, 1.0, 8, 1, true), M([0, 0.5, 0]), AT.bark, barkC, 0.4);
  far.geo(new THREE.CylinderGeometry(tr * 0.7, tr, H * 0.55, 5, 1, true), M([0, H * 0.275, 0]), AT.bark, barkC, 0.4);
  const top = new V3(0, H * 0.5, 0), cl = [], nb = 5 + (v % 2);
  for (let i = 0; i < nb; i++) {
    const a = i / nb * TAU + R(-0.3, 0.3), el = R(0.35, 0.75), L = R(2.8, 4.2);
    const e = top.clone().add(new V3(Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el)).multiplyScalar(L));
    addLimb(near, top, e, tr * 0.5, tr * 0.22, barkC, 5); addLimb(far, top, e, tr * 0.5, tr * 0.22, barkC, 3);
    cl.push(e.clone().add(new V3(0, R(0.4, 1.0), 0)));
  }
  cl.push(new V3(R(-0.4, 0.4), H + R(0.3, 1.2), R(-0.4, 0.4)));
  const cc = new V3(); cl.forEach(p => cc.add(p)); cc.divideScalar(cl.length);
  for (const p of cl) { const s = R(2.3, 3.1); leafBall(near, p, s, leafC, 6, R, cc); leafBall(far, p, s * 1.15, leafC, 0, R, cc, true); }
  const crownR = Math.max(...cl.map(p => Math.hypot(p.x, p.z))) + 2.5;
  return { near: near.build(), far: far.build(), crown: { y: cc.y + 1, r: crownR, top: H + 3.5 }, trunk: tr };
}
function bCypress(v) {
  const r = mulberry32(2150 + v), R = (a, b) => a + (b - a) * r();
  const near = new VB(), far = new VB(), H = R(9, 13), leafC = col(['#2c4a28', '#335530'][v % 2]), barkC = col('#5a4a3a');
  near.geo(new THREE.CylinderGeometry(0.12, 0.2, 2, 6, 1, true), M([0, 1, 0]), AT.bark, barkC, 0.3);
  const cc = new V3(0, H * 0.55, 0);
  for (let k = 0; k < 5; k++) {
    const t = k / 4, y = lerp(2.4, H - 1.2, t), s = lerp(1.25, 0.55, t) * R(0.9, 1.1);
    near.geo(new THREE.IcosahedronGeometry(1, 1), M([R(-0.1, 0.1), y, R(-0.1, 0.1)], null, [s, s * 1.9, s]), AT.solid, leafC, 1, cc);
    if (k % 2 === 0) far.geo(new THREE.IcosahedronGeometry(1, 0), M([0, y, 0], null, [s, s * 2.1, s]), AT.solid, leafC, 1);
    for (let q = 0; q < 3; q++) { const a = R(0, TAU); near.quad(new V3(Math.cos(a) * s * 0.7, y + R(-0.8, 0.8), Math.sin(a) * s * 0.7), new V3(-Math.sin(a), 0, Math.cos(a)), new V3(0, 1, 0), s * 1.3, s * 2.2, AT.needle, WHITE, 1); }
  }
  return { near: near.build(), far: far.build(), trunk: 0.2 };
}
function bBamboo(v) {
  const r = mulberry32(2200 + v), R = (a, b) => a + (b - a) * r();
  const near = new VB(), far = new VB(), n = 9 + v * 3, cg = [col('#7f9a3a'), col('#93a84a'), col('#6f8a32')];
  for (let i = 0; i < n; i++) {
    const a = R(0, TAU), d = Math.sqrt(R(0, 1)) * 1.2, x = Math.cos(a) * d, z = Math.sin(a) * d, H = R(6, 10), lean = R(-0.12, 0.12);
    const e = new V3(x + lean * H, H, z + R(-0.12, 0.12) * H);
    addLimb(near, new V3(x, 0, z), e, 0.09, 0.06, cg[i % 3], 5); if (i % 3 === 0) addLimb(far, new V3(x, 0, z), e, 0.09, 0.06, cg[i % 3], 3);
    for (let k = 0; k < 4; k++) near.frond(new V3(lerp(x, e.x, 0.65 + k * 0.1), H * (0.62 + k * 0.1), lerp(z, e.z, 0.65 + k * 0.1)), R(0, TAU), R(-0.2, 0.4), R(1.2, 1.9), 0.55, R(0.4, 0.9), AT.palm, col('#cfe0a0'), 3);
  }
  far.geo(new THREE.IcosahedronGeometry(1.8, 0), M([0, 7, 0], null, [1, 1.6, 1]), AT.solid, col('#6f8f3a'), 1);
  return { near: near.build(), far: far.build(), trunk: 0.9 };
}
function bSakura(v) {
  const r = mulberry32(2250 + v), R = (a, b) => a + (b - a) * r();
  const near = new VB(), far = new VB(), H = R(4.5, 6), tr = R(0.22, 0.3), barkC = col('#4a3a32'), pink = [col('#f2a7c3'), col('#f7c0d6'), col('#ec98b8')];
  const top = new V3(R(-0.3, 0.3), H * 0.55, R(-0.3, 0.3));
  addLimb(near, new V3(0, 0, 0), top, tr, tr * 0.8, barkC, 6); addLimb(far, new V3(0, 0, 0), top, tr, tr * 0.8, barkC, 4);
  const cl = [];
  for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + R(-0.3, 0.3), L = R(1.6, 2.6), e = top.clone().add(new V3(Math.cos(a) * L, R(0.8, 1.6), Math.sin(a) * L)); addLimb(near, top, e, tr * 0.5, tr * 0.2, barkC, 4); cl.push(e); }
  cl.push(new V3(top.x, H + 0.5, top.z));
  const cc = new V3(); cl.forEach(p => cc.add(p)); cc.divideScalar(cl.length);
  for (const [k, p] of cl.entries()) {
    const s = R(1.3, 1.8);
    near.geo(new THREE.IcosahedronGeometry(s, 1), M(p.toArray(), [R(0, 3), R(0, 3), 0], [1, 0.75, 1]), AT.solid, pink[k % 3], 1, cc);
    for (let q = 0; q < 4; q++) near.geo(new THREE.IcosahedronGeometry(s * 0.45, 0), M([p.x + R(-s, s) * 0.8, p.y + R(-0.3, 0.6) * s, p.z + R(-s, s) * 0.8]), AT.solid, pink[(k + q) % 3], 1, cc);
    far.geo(new THREE.IcosahedronGeometry(s * 1.1, 0), M(p.toArray(), null, [1, 0.8, 1]), AT.solid, pink[k % 3], 1);
  }
  return { near: near.build(), far: far.build(), crown: { y: cc.y + 0.5, r: 3.4, top: H + 2 }, trunk: tr };
}
Object.assign(TREE_KIND, { oak: { wood: 9, hits: 5, tr: 0.5 }, cypress: { wood: 5, hits: 3, tr: 0.25 }, bamboo: { wood: 3, hits: 2, tr: 0.35 }, sakura: { wood: 4, hits: 3, tr: 0.28 } });
Object.assign(MTREE, { oak: [3.4, '#3d6a2a'], cypress: [1.1, '#2c4a28'], bamboo: [1.7, '#7f9a3a'], sakura: [2.6, '#e8a0bf'] });

// plants per square kilometre in each land of the Old World [5 europe, 6 north, 7 steppe, 8 china, 9 japan, 10 arabia, 11 africa, 12 india]
const OWDENS = {
  oak: { 5: 2600, 8: 500, 9: 200 }, cypress: { 5: 160, 10: 60 }, bamboo: { 8: 900, 9: 500 }, sakura: { 9: 700, 8: 120 },
  pine: { 5: 450, 6: 3400, 7: 60, 8: 500, 9: 1500 }, spine: { 6: 1400 }, birch: { 5: 450, 6: 800, 7: 140 }, tundra: { 6: 3800 }, snowrock: { 6: 600, 9: 80 },
  bush: { 5: 1500, 8: 1400, 9: 900, 12: 2000 }, grass: { 5: 4500, 7: 2600, 8: 3000, 9: 2000, 12: 2000 }, flower: { 5: 1500, 8: 600, 9: 600, 12: 800 },
  rock: { 5: 300, 7: 180, 8: 300, 9: 200, 12: 200 }, reeds: { 5: 500, 8: 700, 10: 300, 11: 400, 12: 500 },
  dgrass: { 7: 5500, 10: 300, 11: 9000 }, thorn: { 11: 600, 10: 80 }, dshrub: { 10: 320 }, drock: { 10: 650, 11: 400, 7: 120 },
  acacia: { 11: 420, 12: 60 }, baobab: { 11: 30 }, dpalm: { 10: 40, 12: 80 }, palm: { 12: 900 }, canopy: { 12: 700 }, under: { 12: 500 }, fern: { 12: 2600, 9: 400 }, heli: { 12: 450 }
};
// places where nothing grows: the towns, the castles and the roads
let OWB = null;
const owBlocked = (x, z) => OWB ? OWB[owIdx(x, z)] : 0;
function owSite(x, z) { const i = owIdx(x, z); return { h: getH(x, z), ny: NY2[i], fo: FO2[i], wd: waterDepth(x, z), sd: SD2[i], clay: 0, x, z }; }
function oldWorldVeg() {
  const t0 = performance.now();
  // first the people of the Old World take their places (after the New World's tribes, so the old numbers stay)
  owCampsAdd();
  const T = (id, vars, o) => { const t = Object.assign({ id, vars, n: 0 }, o); VEG.types.push(t); return t; };
  T('oak', [bOak(0), bOak(1), bOak(2)], { rule: s => s.h > 0.8 && s.h < 95 && s.ny > 0.78 && s.sd > 5 ? 0.15 + 0.85 * s.fo : 0, near: 125, col: 1.0, crown: true, shadow: true, sc: [0.8, 1.25], tree: true });
  T('cypress', [bCypress(0), bCypress(1)], { rule: s => s.h > 0.8 && s.h < 60 && s.ny > 0.8 && s.sd > 4 ? 1 : 0, near: 120, col: 0.6, shadow: true, sc: [0.85, 1.2], tree: true });
  T('bamboo', [bBamboo(0), bBamboo(1)], { rule: s => s.h > 0.6 && s.h < 70 && s.ny > 0.75 && s.sd > 3 ? 0.25 + 0.75 * s.fo : 0, near: 95, col: 1.0, shadow: true, sc: [0.8, 1.2], tree: true });
  T('sakura', [bSakura(0), bSakura(1)], { rule: s => s.h > 0.8 && s.h < 60 && s.ny > 0.82 && s.sd > 4 ? 1 : 0, near: 110, col: 0.9, crown: true, shadow: true, sc: [0.85, 1.2], tree: true });
  const R = mulberry32(90210), RR = (a, b) => a + (b - a) * R();
  // the cells of each land, to throw plants into
  const cells = {}; for (let L = 5; L <= 12; L++) cells[L] = [];
  for (let i = 0; i < OWNV; i++) { const L = RG2[i]; if (L >= 5 && L <= 12 && HM2[i] > -0.6) cells[L].push(i); }
  const km2 = L => cells[L].length * OW.cell * OW.cell / 1e6;
  // the Old World's own pieces of forest, 100 m on a side
  const CN = OW.size / 100, base = VEG.chunks.length, chunks = [];
  for (let k = 0; k < CN * CN; k++) chunks.push({ cx: OW.x0 + (k % CN + 0.5) * 100, cz: OW.z0 + (((k / CN) | 0) + 0.5) * 100, items: [] });
  const ci = (x, z) => clamp(Math.floor((z - OW.z0) / 100), 0, CN - 1) * CN + clamp(Math.floor((x - OW.x0) / 100), 0, CN - 1);
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), s4 = new V3(), p4 = new V3(), e4 = new THREE.Euler();
  let total = 0;
  for (const t of VEG.types) {
    const D = OWDENS[t.id]; if (!D) continue;
    const per = t.vars.map(() => chunks.map(() => []));
    const small = t.id === 'grass' || t.id === 'flower' || t.id === 'fern' || t.id === 'dgrass';
    for (const Ls in D) {
      const L = +Ls, C = cells[L]; if (!C.length) continue;
      const n = Math.round(D[L] * km2(L) * 2);
      for (let k = 0; k < n; k++) {
        const i = C[(R() * C.length) | 0], x = owX(i % OW.V) + RR(-0.5, 0.5) * OW.cell, z = owZ((i / OW.V) | 0) + RR(-0.5, 0.5) * OW.cell;
        if (owBlocked(x, z) || nearCamp(x, z, small ? 6 : 12)) continue;
        const rf = roadFine(x, z); if (rf === 1 || (rf === 2 && t.tree)) continue;
        const s = owSite(x, z); if (t.id !== 'lily' && t.id !== 'reeds' && s.wd > 0) continue;
        if (R() > t.rule(s) * 0.5) continue;
        const vi = Math.floor(R() * t.vars.length), V = t.vars[vi], sc = RR(t.sc[0], t.sc[1]);
        const y = t.onWater ? WATER_Y : s.h - (t.sink || 0) * sc, ry = R() * TAU, tilt = t.tree || t.id === 'canopy' || t.id === 'palm' ? 0 : RR(-0.08, 0.08);
        p4.set(x, y, z); q4.setFromEuler(e4.set(tilt, ry, tilt * 0.5)); s4.set(sc, sc, sc); m4.compose(p4, q4, s4);
        per[vi][ci(x, z)].push(m4.clone()); total++;
        if (t.col) { const rad = (V.trunk ? V.trunk * 1.15 : (V.r || 1) * t.col) * sc, k2 = g10(x, z); (TRUNKS.g[k2] || (TRUNKS.g[k2] = [])).push(x, z, rad); }
        if (t.crown && V.crown) { const cr = { x, z, y: y + V.crown.y * sc, top: y + V.crown.top * sc, r: V.crown.r * sc, giant: false }; CROWNS.push(cr); CROWNG[g25(x, z)].push(cr); }
        if (t.flower && FLOWERS.length < 12000) FLOWERS.push({ x, y: y + 1.2 * sc, z });
      }
    }
    t.vars.forEach((V, vi) => per[vi].forEach((list, k) => {
      if (!list.length) return;
      const near = new THREE.InstancedMesh(V.near, VEG.mat, list.length);
      list.forEach((m, j) => near.setMatrixAt(j, m)); near.instanceMatrix.needsUpdate = true; near.receiveShadow = true; near.computeBoundingSphere(); scene.add(near);
      let far = null;
      if (V.far) { far = new THREE.InstancedMesh(V.far, VEG.mat, list.length); far.instanceMatrix = near.instanceMatrix; far.computeBoundingSphere(); far.receiveShadow = true; scene.add(far); }
      chunks[k].items.push({ t, near, far, total: list.length });
    }));
  }
  for (const ch of chunks) if (ch.items.length) VEG.chunks.push(ch);
  OWR.veg = { n: total, ms: performance.now() - t0, chunks: VEG.chunks.length - base };
  updateVeg(true);
}
