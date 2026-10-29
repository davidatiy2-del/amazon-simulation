// ================= A ROUND WORLD: the sea goes all the way around, and across it lies the Old World =================
// The world is a ring. Sail far enough east and you come back from the west. The New World (the jungle and the lands
// around it) is one continent; across the ocean lies another, the Old World, on a ground grid of its own. Between them
// there is only the deep sea, and at the top and the bottom of the world the pack ice that no boat gets through.
const OW = { x0: 3000, z0: -1500, size: 3000, N: 480, cx: 4500 }; OW.cell = OW.size / OW.N; OW.V = OW.N + 1; OW.x1 = OW.x0 + OW.size; OW.z1 = OW.z0 + OW.size;
const OWNV = OW.V * OW.V;
const HM2 = new Float32Array(OWNV).fill(-27), NY2 = new Float32Array(OWNV).fill(1), FO2 = new Float32Array(OWNV), SD2 = new Float32Array(OWNV).fill(999), RG2 = new Uint8Array(OWNV);
let TCOL2 = null, WBLUE2 = null;
// the girth of the world: x and x + P are the same place; the seam is in the middle of the western ocean, far from any land
const GLOBE = { P: 9000, x0: -2250, x1: 6750, laps: 0, crossed: 0, ice: null, told: {} };
const inMain = (x, z) => x > -W.half && x < W.half && z > -W.half && z < W.half;
const inOld = (x, z) => x > OW.x0 && x < OW.x1 && z > OW.z0 && z < OW.z1;
// the hunter and the boats may go anywhere between the ice at the top and the bottom of the world
const inWorld = (x, z) => Math.abs(z) < LIMIT;
// the middle of the continent a place belongs to (for keeping animals at home)
const landCX = x => x > (W.half + OW.x0) / 2 && x < OW.x1 + 1500 ? OW.cx : 0;
const isOld = x => x > (W.half + OW.x0) / 2 && x < GLOBE.x1;
// x on the ring, written the usual way
function wrapX(x) { const P = GLOBE.P; let r = (x - GLOBE.x0) % P; if (r < 0) r += P; return GLOBE.x0 + r; }
// the shortest way from a to b around the ring (east is plus)
function ringDX(ax, bx) { const P = GLOBE.P; let d = (bx - ax) % P; if (d > P / 2) d -= P; else if (d < -P / 2) d += P; return d; }
function owIdx(x, z) { const ix = clamp(Math.round((x - OW.x0) / OW.cell), 0, OW.N), iz = clamp(Math.round((z - OW.z0) / OW.cell), 0, OW.N); return iz * OW.V + ix; }
const owX = i => OW.x0 + i * OW.cell, owZ = i => OW.z0 + i * OW.cell;
function owH(x, z) {
  const fx = (x - OW.x0) / OW.cell, fz = (z - OW.z0) / OW.cell;
  let ix = Math.floor(fx), iz = Math.floor(fz);
  if (ix < 0) ix = 0; else if (ix > OW.N - 1) ix = OW.N - 1;
  if (iz < 0) iz = 0; else if (iz > OW.N - 1) iz = OW.N - 1;
  const tx = clamp(fx - ix, 0, 1), tz = clamp(fz - iz, 0, 1), i = iz * OW.V + ix;
  const a = HM2[i], b = HM2[i + 1], c = HM2[i + OW.V], d = HM2[i + OW.V + 1];
  if (tx + tz <= 1) return a + (b - a) * tx + (c - a) * tz;
  return d + (c - d) * (1 - tx) + (b - d) * (1 - tz);
}
// the floor of the open sea: deep, with a slow swell
function seaFloor(x, z) { return -27 + Noise.n2(x * 0.0021 + 7, z * 0.0021 - 3) * 3; }
function farH(x, z) { return inOld(x, z) ? owH(x, z) : seaFloor(x, z); }
// the New World's grids looked up in the Old World: its forest, its brooks, its slopes
function owAt(arr, x, z) {
  if (!inOld(x, z)) return arr === STREAMD ? 999 : arr === NY ? 1 : arr === WSURF ? -999 : arr === HM ? seaFloor(x, z) : 0;
  const i = owIdx(x, z);
  return arr === FOREST ? FO2[i] : arr === STREAMD ? SD2[i] : arr === NY ? NY2[i] : arr === HM ? HM2[i] : arr === WSURF ? -999 : 0;
}

// ---------- the New World's edges go down into the sea (they were mountains at the end of the world) ----------
function worldEdgeSea() {
  const E0 = 1443, E1 = W.half;
  const cells = [];
  for (let iz = 0; iz < W.V; iz++) for (let ix = 0; ix < W.V; ix++) {
    const x = gx(ix), z = gx(iz), e = Math.max(Math.abs(x), Math.abs(z)); if (e < E0) continue;
    const i = iz * W.V + ix, t = smooth(E0, E1, e), fl = seaFloor(x, z);
    // the mountains fall into the sea as cliffs; the low land as a beach
    HM[i] = Math.min(HM[i], lerp(HM[i], fl, Math.pow(t, 0.7)));
    if (e > E1 - 1) HM[i] = fl;
    WSURF[i] = -999; FOREST[i] = 0; cells.push(i);
  }
  for (const i of cells) {
    const ix = i % W.V, iz = (i / W.V) | 0;
    const hl = HM[iz * W.V + Math.max(0, ix - 1)], hr = HM[iz * W.V + Math.min(W.N, ix + 1)];
    const hd = HM[Math.max(0, iz - 1) * W.V + ix], hu = HM[Math.min(W.N, iz + 1) * W.V + ix];
    const nx = (hl - hr) / (2 * W.cell), nz = (hd - hu) / (2 * W.cell);
    NY[i] = 1 / Math.sqrt(nx * nx + nz * nz + 1);
    if (WBLUE) WBLUE[i] = 255;
  }
}

// ---------- every frame: the sea under the camera, and the ring closing behind the hunter ----------
function globeUpdate(dt) {
  if (water) { water.position.x = Math.round(camera.position.x); water.position.z = Math.round(camera.position.z); }
  if (GLOBE.ice) GLOBE.ice.visible = Math.abs(camera.position.z) > 980;
  const a = P.a; if (!a || G.mode !== 'play') return;
  // the Old World wakes up as the hunter comes near it
  if (OWS.dormant && Math.abs(ringDX(a.pos.x, OW.cx)) < 2600) owWakeStep();
  if (!OWS.dormant) { banditsUpdate(dt); owFaunaUpdate(dt); }
  const x = P.ship ? P.ship.x : P.boat ? P.boat.x : a.pos.x;
  if (x > GLOBE.x1) globeShift(-GLOBE.P); else if (x < GLOBE.x0) globeShift(GLOBE.P);
  globeHints(dt);
}
// over the seam: the hunter, what he rides or sails, and who is with him, all move together by the girth of the world
function globeShift(dx) {
  const a = P.a, moved = new Set(), x0 = a.pos.x;
  const mv = b => { if (!b || moved.has(b)) return; moved.add(b); b.pos.x += dx; if (b.mesh) b.mesh.position.x += dx; };
  mv(a); if (a.mount) mv(a.mount);
  if (P.boat) { P.boat.x += dx; if (P.boat.mesh) P.boat.mesh.position.x += dx; }
  if (P.ship) { const S = P.ship; S.x += dx; if (S.mesh) S.mesh.position.x += dx; for (const m of clanReal()) if (m.inShip === S) mv(m); }
  for (const b of ANIMALS) if (b.alive && !moved.has(b) && Math.abs(b.pos.x - x0) < 90 && Math.abs(b.pos.z - a.pos.z) < 90 && (b.isPartner || b.cub || b.pet === a || b.escort || b.followTarget === a || b.inShip)) mv(b);
  camera.position.x += dx; CAM.tgt.x += dx;
  GLOBE.crossed += Math.sign(-dx);
  if (Math.abs(GLOBE.crossed) >= 1 && GLOBE.seenOld && GLOBE.seenNew && !PROG.flags.roundWorld) {
    PROG.flags.roundWorld = 1; GLOBE.laps++;
    UI.big('הקפת את העולם!', 'העולם עגול: מפליגים כל הזמן לאותו כיוון, וחוזרים אל המקום שממנו יצאו'); AUD.play('cheer', 0.7); gainXP(150);
  }
}
// a word when the hunter first sees the open sea, and the wind that carries boats across it
function globeHints(dt) {
  const a = P.a, x = a.pos.x, z = a.pos.z;
  if (isOld(x) && inOld(x, z) && getHT(x, z) > 0) GLOBE.seenOld = true;
  if (inMain(x, z) && getHT(x, z) > 0) GLOBE.seenNew = true;
  if ((GLOBE.ht = (GLOBE.ht || 0) - dt) > 0) return; GLOBE.ht = 2;
  ferryHints();
  // once, in every game: what is new in the world
  if (P.human && !PROG.flags.owNews && (GLOBE.newsT = (GLOBE.newsT || 0) + 2) > 14) {
    PROG.flags.owNews = 1;
    UI.big('חדש: העולם עגול', 'מעבר לאוקיינוס יש יבשת עם טירות, אבירים ומלכים, ושודדים בצידי הדרכים. שבט הים ושבט האלמוגים, על החוף בדרום, מפליגים לשם. הכל בעזרה');
  }
  if (!PROG.flags.globeMap && (PROG.flags.owNews || !P.human) && (GLOBE.newsT = (GLOBE.newsT || 0) + 2) > 40) {
    PROG.flags.globeMap = 1;
    UI.big('🌍 המפה היא גלובוס', 'פותחים את המפה ורואים את כל העולם על כדור: מסובבים באצבע, וכשמתקרבים הכדור נפתח למפה הרגילה');
  }
  if (P.human && PROG.flags.globeMap && !PROG.flags.news3 && (GLOBE.newsT3 = (GLOBE.newsT3 || 0) + 2) > 60) {
    PROG.flags.news3 = 1;
    UI.big('חדש: כרייה, פשיטות ועוד חיות', `מרבצים של זהב, ברזל, מלח ואבני חן על הגבעות, ויקינגים בספינות ורוכבים שפושטים על ערים, ועוד חיות וציפורים בכל ארץ. הכל בעזרה${TOUCH ? '' : ' (H)'}`);
  }
  if (!inMain(x, z) && !inOld(x, z) && !GLOBE.told.ocean) { GLOBE.told.ocean = 1; UI.big('האוקיינוס', 'מים עמוקים מכל הצדדים. מעבר לים יש יבשת אחרת: העולם הישן. ממשיכים מזרחה או מערבה, כי העולם עגול'); }
  if (Math.abs(z) > LIMIT - 70 && !GLOBE.told.ice) { GLOBE.told.ice = 1; UI.notify('קרח עבה לפנים: בקצה העולם הים קפוא, ושום סירה לא עוברת', 'bad'); }
}
// far out at sea a steady wind fills the sails and the current carries the canoe
function seaWind(V, dt, draft) {
  if (!(V.v > 1)) return;
  const d = getHT(V.x, V.z); if (d > -12) return;
  const k = smooth(-12, -22, d) * (V === P.ship ? 3 : 2.5);
  const nx = V.x + Math.sin(V.yaw) * V.v * dt * k, nz = V.z + Math.cos(V.yaw) * V.v * dt * k;
  if (inWorld(nx, nz) && waterDepthT(nx, nz) > draft) { V.x = nx; V.z = nz; }
  if (!GLOBE.told.wind && P.a && (V === P.boat || V === P.ship)) { GLOBE.told.wind = 1; UI.notify('🌬️ רוח גבית בים הפתוח: הסירה שטה כאן הרבה יותר מהר', 'good'); }
}

// ---------- the pack ice at the top and the bottom of the world ----------
function buildPackIce() {
  const g = new THREE.IcosahedronGeometry(1, 0); g.scale(1, 0.18, 1);
  const n = 1400, mesh = new THREE.InstancedMesh(g, new THREE.MeshLambertMaterial({ color: '#e9f2f6' }), n);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new V3(), p = new V3(), r = mulberry32(4242);
  let k = 0;
  for (let t = 0; t < n * 3 && k < n; t++) {
    const side = r() < 0.5 ? -1 : 1, x = GLOBE.x0 + r() * GLOBE.P, dz = Math.pow(r(), 0.6) * 110, z = side * (W.half - dz);
    // not on land, and not at the New World's warm southern sea
    if (getHT(x, z) > -3) continue;
    if (side > 0 && inMain(x, z) && dz > 40) continue;
    const sz = 4 + r() * 16 * (1 - dz / 160);
    p.set(x, 0.15, z); q.setFromEuler(e.set(0, r() * TAU, 0)); s.set(sz, 1 + r() * 2.5, sz * (0.6 + r() * 0.6)); m4.compose(p, q, s); mesh.setMatrixAt(k++, m4);
  }
  mesh.count = k; mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere(); mesh.frustumCulled = false; mesh.receiveShadow = true;
  scene.add(mesh); GLOBE.ice = mesh;
}
