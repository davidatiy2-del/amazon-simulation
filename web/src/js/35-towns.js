// ---------- the settlements, people by people: castles and keeps, pagodas, domes, yurts, longhouses and mud mosques ----------
const WALLED = [];   // walled places: { x, z, ang, half, gin, gout } (walkers go round to the gate)
// a frame for a settlement: the front (its gate) looks towards its water
function townFrame(c) {
  const fa = c.rx !== c.x || c.rz !== c.z ? Math.atan2(c.rx - c.x, c.rz - c.z) : 0, cs = Math.cos(fa), sn = Math.sin(fa);
  return { fa, p: (lx, lz) => [lx * cs + lz * sn, -lx * sn + lz * cs] };
}
function addWalled(c, T, half) {
  const g1 = T.p(0, half - 3.5), g2 = T.p(0, half + 4.5);
  WALLED.push({ x: c.x, z: c.z, ang: T.fa, half, gin: { x: c.x + g1[0], z: c.z + g1[1] }, gout: { x: c.x + g2[0], z: c.z + g2[1] }, c });
  c.gate = { x: c.x + g2[0], z: c.z + g2[1] };
}
// a square wall with towers at the corners and a gate in the front
// a tower in the Chinese way: square, with a pavilion of red posts under a roof whose corners turn up
function chinaTower(B, x, z, r, h, stone, roof, rot) {
  const H = hx(B, x, z, rot, B.gy(x, z) - 0.5);
  H.box(r * 1.9, h + 0.5, r * 1.9, 0, 0, 0, stone, null, 0.03);
  for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) H.cyl(0.14, 0.14, 2.2, a * r * 0.75, h + 0.5, b * r * 0.75, '#a8302a', 8);
  const g = new THREE.ConeGeometry(Math.SQRT1_2, 1, 4); g.rotateY(Math.PI / 4); H.geo(g, 0, h + 3.4, 0, roof, null, [r * 3.0, 1.6, r * 3.0]);
  for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) H.geo(new THREE.ConeGeometry(0.12, 0.7, 4), a * r * 1.42, h + 2.75, b * r * 1.42, roof, [b * 0.9, 0, -a * 0.9]);
  H.glow(new THREE.SphereGeometry(0.22, 8, 6), 0, h + 1.6, r * 0.95, '#ff5a30', null, [1, 1.3, 1]);
  B.solid(x, z, r + 0.15);
}
function squareWall(B, T, half, h, t, stone, tr, th, towerRoof, flag, gate, style) {
  const P = (x, z) => T.p(x, z), Ccs = [[-half, -half], [half, -half], [half, half], [-half, half]];
  const tower = (px, pz, r, hh, o) => style === 'china' ? chinaTower(B, px, pz, r, hh, stone, towerRoof, T.fa) : bTower(B, px, pz, r, hh, stone, towerRoof, o);
  for (const [x, z] of Ccs) { const [px, pz] = P(x, z); tower(px, pz, tr, th, { flag: z < 0 ? flag : null }); }
  const seg = (a, b) => { const [x0, z0] = P(a[0], a[1]), [x1, z1] = P(b[0], b[1]); bWall(B, x0, z0, x1, z1, h, t, stone, true); };
  seg([-half + tr, -half], [half - tr, -half]); seg([-half, -half + tr], [-half, half - tr]); seg([half, -half + tr], [half, half - tr]);
  const gw = gate || 3.2;
  seg([-half + tr, half], [-gw - 1.6, half]); seg([gw + 1.6, half], [half - tr, half]);
  for (const s of [-1, 1]) { const [px, pz] = P(s * (gw + 1), half); tower(px, pz, 2.1, th - 1, { flag }); }
  const [gx0, gz0] = P(0, half), ga = T.fa, y = B.gy(gx0, gz0);
  B.add(new THREE.BoxGeometry(gw * 2 + 2, 2.2, t + 0.4), M([gx0, y + h + 0.2, gz0], [0, ga, 0]), stone, 0.03);
}
function houseRing(B, T, n, r0, r1, a0, a1, w, d, h, C, o, seed) {
  const R = mulberry32(seed), out = [];
  for (let k = 0, t = 0; k < n && t < n * 12; t++) {
    const a = lerp(a0, a1, R()), r = lerp(r0, r1, R()), lx = Math.sin(a) * r, lz = Math.cos(a) * r;
    if (out.some(q => Math.hypot(q[0] - lx, q[1] - lz) < Math.max(w, d) + 2.2)) continue;
    const [x, z] = T.p(lx, lz), ww = w * lerp(0.85, 1.15, R()), dd = d * lerp(0.85, 1.15, R());
    if (B.gy(x, z) < -1.2 || waterDepth(B.c.x + x, B.c.z + z) > 0 || roadHits(B.c.x + x, B.c.z + z, Math.max(w, d) * 0.6 + 0.8)) continue;
    bHouse(B, x, z, ww, dd, h, C.wall, C.roof, Math.atan2(-lx, -lz) + T.fa, Object.assign({ door: C.door, timber: C.timber, win: C.win }, o || {}));
    out.push([lx, lz]); k++;
  }
  return out;
}
// ---------- Europe: a castle with a keep, towers and a gate; towns with a church and a windmill ----------
// the helpers every town uses: a place in the town's own frame, a house that faces where it should, the ground's colour
function townKit(B, c, seed) {
  const T = townFrame(c), R = mulberry32(seed + (c.x | 0)), P = (lx, lz) => T.p(lx, lz), A = a => a + T.fa, pk = a => a[Math.floor(R() * a.length)];
  const free = (lx, lz, r) => { const [x, z] = P(lx, lz); return B.gy(x, z) > -1.2 && waterDepth(c.x + x, c.z + z) <= 0 && !roadHits(c.x + x, c.z + z, r); };
  return { T, R, P, A, pk, free };
}
function townKnights(B, c, S) {
  const K = townKit(B, c, 31), { T, R, P, A, pk } = K, stone = '#a19c90', ban = S.col || '#c0392b', C = HOUSEC.knights;
  const walls = ['#efe6d2', '#e8dcc4', '#f2ead8', '#e0d4bc', '#e8e0c8'], roofs = ['#9a4a32', '#8a3a2a', '#a8583a', '#7a4a3a', '#8a5a40', '#6a6a70'], shuts = ['#3a5a3a', '#7a2a2a', '#2a4a6a', '#6a5a2a', '#4a3a5a'];
  const home = (lx, lz, w, d, h, face, o) => {
    if (!K.free(lx, lz, Math.max(w, d) * 0.6 + 0.8)) return false;
    const [x, z] = P(lx, lz);
    house(B, x, z, A(face ?? Math.atan2(-lx, -lz)), Object.assign({ style: R() < 0.72 ? 'tudor' : 'stone', w, d, h, wall: pk(walls), roof: pk(roofs), trim: '#4a3424', shut: pk(shuts), box: R() < 0.4, door: pk(['#5a3a22', '#6a2a1a', '#3a4a2a', '#4a3a2a']) }, o || {}));
    return true;
  };
  const ring = (n, r0, r1, a0, a1, w, d, h) => { const out = []; for (let k = 0, t = 0; k < n && t < n * 14; t++) { const a = lerp(a0, a1, R()), r = lerp(r0, r1, R()), lx = Math.sin(a) * r, lz = Math.cos(a) * r; if (out.some(q => Math.hypot(q[0] - lx, q[1] - lz) < Math.max(w, d) + 2.6)) continue; const hh = h * lerp(0.9, 1.25, R()); if (home(lx, lz, w * lerp(0.85, 1.2, R()), d * lerp(0.85, 1.15, R()), hh)) { out.push([lx, lz]); k++; } } return out; };
  const at = (fn, lx, lz, ...a) => { const [x, z] = P(lx, lz); fn(B, x, z, ...a); };
  if (S.kind === 'castle') {
    const half = 17;
    squareWall(B, T, half, 8, 1.6, stone, 3.1, 12, null, ban, 3.2); addWalled(c, T, half);
    // the keep: windows, a door up a stair, two long banners of the kingdom, turrets and the flag
    const [kx, kz] = P(0, -7.5); B.box(11, 17, 11, kx, kz, '#958f83', { ry: T.fa, jit: 0.03, solid: true });
    const KH = hx(B, kx, kz, T.fa, B.gy(kx, kz));
    for (const y of [5, 9, 13]) for (const lx of [-3, 0, 3]) { KH.mid(0.7, 1.3, 0.12, lx, y, 5.52, '#3a3430'); KH.glow(new THREE.PlaneGeometry(0.45, 1.0), lx, y, 5.6, GLOWC); KH.glow(new THREE.PlaneGeometry(0.45, 1.0), lx, y, -5.6, GLOWC, [0, Math.PI, 0]); }
    for (const s of [-1, 1]) KH.mid(1.4, 7, 0.06, s * 3.4, 10.5, 5.56, ban);
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) KH.mid(1.4, 0.3, 0.07, s * 3.4, 8 + k * 2.2, 5.58, '#e8b830');
    KH.box(2.2, 3, 0.2, 0, 0, 5.56, '#4a3220'); KH.mid(2.6, 0.4, 0.3, 0, 3.1, 5.6, '#7a746a');
    for (let k = 0; k < 4; k++) KH.box(3.2 - k * 0.2, 0.25, 0.6, 0, -0.1 + k * 0.25, 6.0 + (3 - k) * 0.5, '#8a847a');
    torch(B, ...P(-1.6, -1.8), 2.6, A(0)); torch(B, ...P(1.6, -1.8), 2.6, A(0));
    for (const [sx, sz] of [[-5, -5], [5, -5], [5, 5], [-5, 5]]) { const [px, pz] = P(sx, -7.5 + sz); bTower(B, px, pz, 1.4, 19, '#958f83', '#6a3a3a', { tall: 2.6 }); }
    const [fx, fz] = P(0, -7.5); bFlag(B, fx, fz, B.gy(fx, fz) + 17, ban);
    // the gate: a portcullis raised, the doors open; banners on the gate towers
    const GH = hx(B, ...P(0, half), T.fa); for (let k = 0; k < 7; k++) GH.mid(0.08, 2.0, 0.1, -2.4 + k * 0.8, 6.2, 0.2, '#2a2a2a'); for (let k = 0; k < 3; k++) GH.mid(5.2, 0.08, 0.1, 0, 5.4 + k * 0.8, 0.2, '#2a2a2a');
    for (const s of [-1, 1]) { GH.mid(1.5, 4.5, 0.12, s * 2.5, 2.25, -0.9, '#5a3a22', [0, s * 1.1, 0]); GH.mid(1.2, 3.6, 0.05, s * 4.4, 6.5, 2.2, ban); }
    torch(B, ...P(-3.5, half + 1.3), 3.2, A(0)); torch(B, ...P(3.5, half + 1.3), 3.2, A(0));
    // the chapel with its bell tower, the stable, the smithy, the well
    const [p1, p2] = P(11, 3); house(B, p1, p2, A(-Math.PI / 2), { style: 'stone', w: 8, d: 5, h: 5, wall: '#e6e0d0', roof: '#5a5a62', trim: '#6a5a4a', door: '#5a3a22', chimney: false, ww: 0.5, wh: 1.4 });
    const [q1, q2] = P(11, -1.5); bTower(B, q1, q2, 1.2, 9, '#e6e0d0', '#5a5a62', { tall: 3.4, seg: 6 });
    B.spot('temple', ...P(7.5, 3), A(Math.PI / 2));
    const [s1, s2] = P(-11, 4); house(B, s1, s2, A(Math.PI / 2), { style: 'plain', w: 7, d: 4, h: 3, wall: '#8a6a48', roof: '#6a4a30', chimney: false, noWin: true, dw: 2.2, dh: 2.4, door: '#3a2a1a' });
    at(hay, -11, 9, 4, A(0.3)); at(trough, -7.5, 5, A(Math.PI / 2)); at(forge, -11, -5, A(Math.PI / 2));
    at(well2, 7, 9); at(stall, 4.5, 12.5, A(-Math.PI / 2), ['#c0392b', '#f2efe6'], 'bread'); at(stall, -4.5, 12.5, A(Math.PI / 2), ['#2a5a8a', '#f2efe6'], 'fruit');
    at(cart, -6.5, 15, A(0.4), 'barrels'); at(barrels, 13, 10, 5, A(0)); at(crates, -13.5, 11.5, 4, A(0.2)); at(lamp, -3, 6); at(lamp, 3, 1);
    // a straw man for the knights to strike, targets for the archers
    const QH = hx(B, ...P(9, -9), A(0)); QH.cyl(0.08, 0.1, 2.1, 0, 0, 0, '#5a3a22', 6); QH.mid(1.4, 0.1, 0.1, 0, 1.6, 0, '#5a3a22'); QH.geo(new THREE.SphereGeometry(0.3, 8, 6), 0, 1.95, 0, '#c8b070'); QH.mid(0.5, 0.6, 0.06, 0.5, 1.3, 0.05, ban);
    for (const k of [0, 1]) { const AH = hx(B, ...P(13.5, -12 + k * 2.6), A(-Math.PI / 2)); AH.geo(new THREE.CylinderGeometry(0.7, 0.7, 0.25, 16), 0, 1.0, 0, '#d8c070', [Math.PI / 2 - 0.2, 0, 0]); AH.geo(new THREE.CylinderGeometry(0.45, 0.45, 0.26, 16), 0, 1.0, 0.01, '#c8302a', [Math.PI / 2 - 0.2, 0, 0]); AH.geo(new THREE.CylinderGeometry(0.18, 0.18, 0.27, 12), 0, 1.0, 0.02, '#f2efe6', [Math.PI / 2 - 0.2, 0, 0]); }
    // guards at the gate and on the yard, the court in front of the keep
    for (const s of [-1, 1]) B.spot('gate', ...P(s * 2.4, half + 2.4), A(0));
    for (const [lx, lz] of [[-12, 12], [12, 12], [-12, -12], [12, -12], [0, 13]]) B.spot('patrol', ...P(lx, lz), 0);
    B.spot('guard', ...P(-1.8, -0.8), A(0)); B.spot('guard', ...P(1.8, -0.8), A(0));
    B.spot('plaza', ...P(0, 6), 0);
    // the village under the castle, its fields and haystacks, a windmill on the hill
    ring(9, half + 9, half + 22, -1.25, 1.25, 5, 4, 3.2);
    for (const [lx, lz, a, k] of [[-26, 32, 0.2, 'wheat'], [24, 34, -0.2, 'wheat'], [-34, 14, 0.5, 'veg'], [34, 16, -0.4, 'veg']]) { const [x, z] = P(lx, lz); field2(B, x, z, 11, 8, A(a), k); }
    at(hay, -18, 40, 3, A(0.2)); at(hay, 18, 42, 2, A(-0.4)); at(cart, -14, 30, A(1.2), 'hay');
    for (const [lx, lz] of [[-30, 2], [30, 4], [-38, 26], [36, 30]]) if (K.free(lx, lz, 2)) at(townTree, lx, lz, 'round', 1.1);
  } else {
    const town = S.kind === 'town', n = town ? 12 : 8;
    plaza(B, 0, 0, town ? 7.5 : 5, '#9a907e');
    ring(n, town ? 10 : 8, town ? 24 : 17, -Math.PI, Math.PI, 5, 4, town ? 3.6 : 3.1);
    if (town) {
      // a church of stone with its spire, a windmill on the edge, the market round the square
      const [cx, cz] = P(0, -14); house(B, cx, cz, A(0), { style: 'stone', w: 6, d: 11, h: 6, wall: '#e6e0d0', roof: '#5a5a62', trim: '#6a5a4a', chimney: false, ww: 0.5, wh: 1.6, door: '#5a3a22' });
      B.spot('temple', ...P(0, -7.6), A(0));
      const [tx, tz] = P(0, -20.5); bTower(B, tx, tz, 1.8, 11, '#e6e0d0', '#5a5a62', { tall: 4, seg: 4 });
      windmill(B, ...P(-22, 12), A(0.6));
      at(stall, -5.5, 3.5, A(Math.PI / 2 + 0.3), ['#c0392b', '#f2efe6'], 'bread'); at(stall, 5.5, 3.5, A(-Math.PI / 2 - 0.3), ['#2a5a8a', '#e8d8a0'], 'cloth'); at(stall, 0, 6.5, A(Math.PI), ['#3a6a3a', '#f2efe6'], 'fruit');
      at(forge, 13, -6, A(-Math.PI / 2 + 0.4));
    } else {
      // the vineyard's press: barrels and a cart
      at(barrels, 6, -6, 6, A(0.3)); at(cart, -7, -5, A(-0.6), 'barrels');
      at(stall, 0, 5, A(Math.PI), ['#7a2a5a', '#f2efe6'], 'fruit');
    }
    at(well2, 3, -3); at(lamp, -4, -3); at(lamp, 4, 4); at(bench, -3, 2.5, A(0.2));
    at(laundry, town ? 16 : 12, town ? 12 : 9, A(1.2)); at(woodpile, town ? -15 : -10, town ? -8 : -6, A(0.4));
    for (const [lx, lz, a] of [[-26, 20, 0.3], [22, -24, -0.4], [28, 18, 0.1], [-24, -22, 0.6]]) { const [x, z] = P(lx, lz); field2(B, x, z, 11, 8, A(a), S.id === 'vines' ? 'vines' : 'wheat'); }
    at(hay, -18, 28, 3, A(0.3));
    for (const [lx, lz] of [[-9, 14], [12, -16], [-16, -12], [20, 6]]) if (K.free(lx, lz, 2)) at(townTree, lx, lz, R() < 0.5 ? 'olive' : 'round', 0.9);
    B.spot('plaza', 0, 0, 0);
  }
}
// a windmill: a round tower, a turning cap, four sails of lattice
function windmill(B, x, z, rot) {
  const H = hx(B, x, z, rot);
  H.cyl(1.9, 2.4, 8.5, 0, 0, 0, '#d8d0bc', 14); H.box(1.0, 1.9, 0.1, 0, 0, 2.3, '#5a3a22');
  H.geo(new THREE.ConeGeometry(2.3, 2.2, 14), 0, 9.6, 0, '#6a4a30');
  H.geo(new THREE.SphereGeometry(0.35, 8, 6), 0, 8.6, 2.4, '#5a3a22');
  for (let k = 0; k < 2; k++) H.mid(0.2, 7.8, 0.2, 0, 8.6, 2.45, '#5a3a22', [0, 0, -(k * Math.PI / 2 + 0.4)]);
  for (let k = 0; k < 4; k++) {
    const a = k * Math.PI / 2 + 0.4, dx = Math.sin(a), dy = Math.cos(a), px = Math.cos(a), py = -Math.sin(a);
    H.mid(1.2, 3.4, 0.05, dx * 2.4 + px * 0.65, 8.6 + dy * 2.4 + py * 0.65, 2.55, '#e8e0cc', [0, 0, -a]);
    for (let q = 0; q < 4; q++) H.mid(1.25, 0.06, 0.07, dx * (1.0 + q * 0.95) + px * 0.65, 8.6 + dy * (1.0 + q * 0.95) + py * 0.65, 2.6, '#6a4a2c', [0, 0, -a]);
  }
  H.spot('mill', 0, 3.2, 0); B.solid(x, z, 2.5);
}
// ---------- the Vikings: longhouses of turf, a great hall, a palisade, longships at the shore ----------
function longship(B, x, z, rot, y) {
  const H = hx(B, x, z, rot, y), hull = '#5a3a22', sail = ['#a8302a', '#e8e0d0'];
  H.geo(new THREE.SphereGeometry(1, 16, 6, 0, TAU, Math.PI / 2, Math.PI / 2), 0, 0.5, 0, hull, null, [1.5, 0.95, 7]);
  H.mid(2.6, 0.08, 12.5, 0, 0.42, 0, '#6a4a2c');
  // the prow and the stern rise in a curl: a dragon's neck at the front
  for (let k = 0; k < 6; k++) { const t = k / 5; H.geo(new THREE.SphereGeometry(0.2 - t * 0.05, 7, 5), 0, 0.6 + t * 1.6, 6.6 + Math.sin(t * 1.4) * 0.9, hull); H.geo(new THREE.SphereGeometry(0.18 - t * 0.05, 7, 5), 0, 0.6 + t * 1.2, -6.6 - Math.sin(t * 1.2) * 0.6, hull); }
  H.geo(new THREE.ConeGeometry(0.16, 0.5, 6), 0, 2.4, 7.7, '#c8a040', [Math.PI / 2, 0, 0]);
  for (const s of [-1, 1]) for (let k = 0; k < 7; k++) { H.geo(new THREE.CylinderGeometry(0.28, 0.28, 0.05, 12), s * 1.42, 0.85, -4.2 + k * 1.4, k % 2 ? sail[0] : '#d8a020', [0, 0, Math.PI / 2]); H.mid(0.06, 0.06, 3.2, s * 2.6, 0.55, -4.2 + k * 1.4 + 0.7, '#6a4a2c', [0, s * 1.35, 0.2 * s]); }
  H.cyl(0.11, 0.13, 7, 0, 0.4, 0, '#4a3020', 7);
  // the square sail stands across the ship, a little bellied by the wind
  for (let k = 0; k < 6; k++) H.mid(4.2, 0.85, 0.05, 0, 3.0 + k * 0.82, 0.15 + Math.sin((k + 0.5) / 6 * Math.PI) * 0.35, sail[k % 2], [0.06 * (k - 2.5), 0, 0]);
  H.mid(4.6, 0.12, 0.12, 0, 7.95, 0.15, '#4a3020');
}
function runestone(B, x, z, rot) { const H = hx(B, x, z, rot); H.geo(new THREE.CylinderGeometry(0.55, 0.75, 2.4, 6), 0, 1.15, 0, '#8a8680', null, [1, 1, 0.35], 0.05); for (let k = 0; k < 3; k++) H.mid(0.06, 1.6, 0.03, -0.2 + k * 0.2, 1.3, 0.27, '#a8302a', [0, 0, 0.3 * (k - 1)]); H.spot('temple', 0, 1.4, 0); B.solid(x, z, 0.7); }
function fishRack(B, x, z, rot) { const H = hx(B, x, z, rot); for (const s of [-1, 1]) H.cyl(0.06, 0.07, 2.2, s * 1.4, 0, 0, '#5a3a22', 6); for (const y of [1.5, 2.05]) { H.mid(3.0, 0.06, 0.06, 0, y, 0, '#6a4a2c'); for (let k = 0; k < 7; k++) H.geo(new THREE.SphereGeometry(0.07, 6, 5), -1.2 + k * 0.4, y - 0.28, 0, '#9a9a8a', null, [0.7, 3.4, 0.5]); } H.solid(3, 0.6); }
function townVikings(B, c, S) {
  const K = townKit(B, c, 400), { T, R, P, A, pk } = K, town = S.kind === 'town', at = (fn, lx, lz, ...a) => fn(B, ...P(lx, lz), ...a);
  // the great hall: the longest house, its door in the gable, shields at its sides, horns over the door
  const [hx0, hz0] = P(0, -8); const HH = house(B, hx0, hz0, A(0), { style: 'viking', w: 7.5, d: 15, h: 2.5, wall: '#6a4a2e', roof: '#5f7a3a', rh: 3.8, door: '#2a1a10', plinth: '#5a5048', noWin: true, dw: 1.4, dh: 2.3 });
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) HH.geo(new THREE.CylinderGeometry(0.42, 0.42, 0.06, 14), s * (1.5 + k * 0.95), 1.6, 7.6, ['#a8302a', '#2a5a8a', '#d8a020'][k], [Math.PI / 2, 0, 0]);
  B.spot('guard', ...P(-1.6, 0.6), A(0)); B.spot('guard', ...P(1.6, 0.6), A(0));
  // longhouses round the yard, their doors to the middle
  const roofs = ['#5f7a3a', '#6a8040', '#9a8a5a', '#5a6a3a'], walls = ['#7a5a3a', '#6a4a2e', '#8a6a44'];
  for (let k = 0, t = 0, out = []; k < (town ? 7 : 4) && t < 90; t++) {
    const a = R() * TAU, r = 10 + R() * 9, lx = Math.sin(a) * r, lz = Math.cos(a) * r;
    if (Math.cos(a) > 0.82 || out.some(q => Math.hypot(q[0] - lx, q[1] - lz) < 9) || Math.hypot(lx, lz + 8) < 11 || !K.free(lx, lz, 5)) continue;
    const [x, z] = P(lx, lz); house(B, x, z, A(Math.atan2(-lx, -lz)), { style: 'viking', w: 4.6, d: 9 + R() * 2, h: 2.2, wall: pk(walls), roof: pk(roofs), rh: 2.8, door: '#2a1a10', plinth: '#5a5048', noWin: true });
    out.push([lx, lz]); k++;
  }
  // the palisade: sharpened logs round the town, open towards the water, two watchtowers by the opening
  const n = 72, r = 24;
  for (let k = 0; k < n; k++) { const a2 = k / n * TAU - Math.PI; if (Math.abs(a2) < 0.3) continue; const [x, z] = P(Math.sin(a2) * r, Math.cos(a2) * r); B.cyl(0.22, 0.25, 4 + R() * 0.6, x, z, '#6b5034', { seg: 6 }); B.cone(0.25, 0.6, x, z, '#5a4028', { y: 4.4, seg: 6 }); B.solid(x, z, 0.5); }
  for (const s of [-1, 1]) { const WH = hx(B, ...P(s * 8.2, r - 0.4), A(0)); for (const [px, pz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) WH.cyl(0.12, 0.14, 5.5, px * 1.0, 0, pz * 1.0, '#5a4028', 6); WH.box(2.6, 0.15, 2.6, 0, 5.0, 0, '#6a4a2c'); WH.box(2.6, 0.9, 0.1, 0, 5.1, 1.25, '#6b5034'); WH.geo(new THREE.ConeGeometry(2.0, 1.6, 4), 0, 6.8, 0, '#5a6a3a', [0, Math.PI / 4, 0]); B.spot('gate', ...P(s * 2.6, r + 2.5), A(0)); }
  for (const [lx, lz] of [[-17, 0], [17, 0], [-12, -17], [12, -17], [0, -21]]) B.spot('patrol', ...P(lx, lz), 0);
  // the yard: a fire pit with a cauldron, racks of drying fish, a smithy, woodpiles, the runestone
  plaza(B, 0, 4, 6, '#7a6a52');
  at(runestone, 6, 8, A(-0.5)); at(forge, -14, 6, A(Math.PI / 2 - 0.3)); at(woodpile, -9, 13, A(0.6)); at(woodpile, 12, -12, A(-0.3));
  at(fishRack, 8, 15, A(0.2)); at(fishRack, -6, 17, A(-0.3)); at(barrels, 13, 9, 4, A(0.4)); at(lamp, -3, 9); at(lamp, 4, 1);
  const CH = hx(B, 0, 4, 0); CH.geo(new THREE.SphereGeometry(0.45, 10, 8, 0, TAU, Math.PI / 2, Math.PI / 2), 0, 0.9, 0, '#2a2a2a'); for (let k = 0; k < 3; k++) CH.mid(0.06, 1.3, 0.06, Math.sin(k * 2.1) * 0.5, 0.55, Math.cos(k * 2.1) * 0.5, '#3a2a1c', [Math.cos(k * 2.1) * 0.35, 0, -Math.sin(k * 2.1) * 0.35]);
  // the shore: piers and longships
  const [sx, sz] = P(0, r + 10), sy = Math.max(0.1, B.gy(sx, sz));
  if (town) { longship(B, sx, sz, A(Math.PI / 2), Math.max(sy, -c.y + 0.3)); const [px2, pz2] = P(-9, r + 2); pier(B, px2, pz2, A(0), 10, '#6a4a2c'); }
  else { const [px2, pz2] = P(0, r + 2); pier(B, px2, pz2, A(0), 8, '#6a4a2c'); }
  for (const [lx, lz, a2, kd] of [[-30, -10, 0.4, 'veg'], [30, -12, -0.3, 'wheat']]) { const [x, z] = P(lx, lz); field2(B, x, z, 10, 7, A(a2), kd); }
  B.spot('plaza', ...P(0, 4), 0);
}
// ---------- the Mongols: white yurts with painted doors, the khan's great yurt, horse lines, an ovoo of stones ----------
function yurt(B, x, z, rot, r, top) {
  const H = hx(B, x, z, rot);
  H.cyl(r, r * 1.02, 1.9, 0, 0, 0, '#efe8da', 18); H.geo(new THREE.ConeGeometry(r * 1.08, r * 0.62, 18), 0, 1.9 + r * 0.31, 0, '#e4dcc8');
  H.cyl(r * 0.2, r * 0.2, 0.18, 0, 1.9 + r * 0.56, 0, top || '#8a3a2a', 10);
  for (let k = 0; k < 3; k++) H.cyl(r * 1.012, r * 1.012, 0.07, 0, 0.45 + k * 0.55, 0, '#8a3a2a', 18, null, true);
  H.cyl(r * 1.015, r * 1.015, 0.22, 0, 1.55, 0, '#2a5a8a', 18, null, true);
  for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; H.mid(0.08, 0.12, 0.02, Math.sin(a) * r * 1.02, 1.66, Math.cos(a) * r * 1.02, '#d8a020', [0, a, 0]); }
  H.box(1.1, 1.6, 0.12, 0, 0, r - 0.02, '#c8602a'); H.mid(1.3, 0.12, 0.16, 0, 1.66, r, '#d8a020'); H.mid(0.06, 1.6, 0.14, 0, 0.8, r + 0.02, '#8a3a1a');
  H.cyl(0.07, 0.07, 0.8, r * 0.45, 1.9 + r * 0.3, -r * 0.2, '#3a3a3a', 6);
  H.spot('door', 0, r + 0.9, Math.PI); B.solid(x, z, r + 0.1);
}
function townMongols(B, c, S) {
  const K = townKit(B, c, 500), { T, R, P, A } = K, at = (fn, lx, lz, ...a) => fn(B, ...P(lx, lz), ...a);
  if (S.cap) { at(yurt, 0, -8, A(0), 4.6, '#d8a020'); for (const s of [-1, 1]) at(banner, s * 3.4, -2.6, A(0), '#d8a020', 5); B.spot('guard', ...P(-1.6, -2.6), A(0)); B.spot('guard', ...P(1.6, -2.6), A(0)); }
  for (let k = 0, t = 0, out = []; k < (S.cap ? 11 : 7) && t < 120; t++) {
    const a = R() * TAU, r = 8 + R() * 13, lx = Math.sin(a) * r, lz = Math.cos(a) * r;
    if (out.some(q => Math.hypot(q[0] - lx, q[1] - lz) < 6.5) || (S.cap && Math.hypot(lx, lz + 8) < 8.5) || !K.free(lx, lz, 3)) continue;
    at(yurt, lx, lz, A(Math.atan2(-lx, -lz)), 2.3 + R() * 0.6); out.push([lx, lz]); k++;
  }
  // horse lines and pens, the tall horsehair banners, an ovoo of stones with blue scarves
  const [px, pz] = P(17, 15); bFence(B, [[px - 7, pz - 5], [px + 7, pz - 5], [px + 7, pz + 5], [px - 7, pz + 5], [px - 7, pz - 1]], '#6b5034');
  B.spot('herd', ...P(17, 15), 0);
  for (const [lx, lz] of [[-3, 2], [3, 2]]) { const [x, z] = P(lx, lz); B.cyl(0.07, 0.08, 5.5, x, z, '#4a3020', { seg: 6 }); B.cone(0.35, 1.2, x, z, '#2a2420', { y: 4.4, seg: 8 }); B.cone(0.1, 0.5, x, z, '#d8a020', { y: 5.5, seg: 6 }); }
  const OH = hx(B, ...P(-16, -14), 0); for (let k = 0; k < 14; k++) { const a = k * 2.3, rr2 = 1.6 - (k / 14) * 1.3; OH.geo(new THREE.DodecahedronGeometry(0.42, 0), Math.sin(a) * rr2, 0.25 + k * 0.16, Math.cos(a) * rr2, k % 2 ? '#8a8680' : '#9a968e', [a, a, 0]); } OH.cyl(0.05, 0.06, 4.2, 0, 0.5, 0, '#5a3a22', 6); for (let k = 0; k < 5; k++) OH.mid(0.1, 1.4, 0.02, Math.sin(k) * 0.3, 3.4 - k * 0.2, Math.cos(k) * 0.3, '#3a7ad8', [0.5, k * 1.3, 0.3]); OH.spot('temple', 0, 2.6, Math.PI);
  for (const [lx, lz, rot2] of [[-10, 14, 0.4], [9, -16, -0.8]]) at(cart, lx, lz, A(rot2), 'sacks');
  plaza(B, 0, 4, 5, '#9a8a6a'); at(lamp, 4, 5); at(woodpile, -8, -2, A(0.3)); at(forge, 12, -4, A(-Math.PI / 2));
  const FH = hx(B, ...P(0, 4), 0); FH.geo(new THREE.SphereGeometry(0.5, 10, 8, 0, TAU, Math.PI / 2, Math.PI / 2), 0, 0.95, 0, '#2a2a2a');
  for (let k = 0; k < 2; k++) { const [x, z] = P(-14 + k * 4, 6); const AH = hx(B, x, z, A(Math.PI / 2)); AH.cyl(0.05, 0.06, 1.2, 0, 0, 0, '#5a3a22', 6); AH.geo(new THREE.CylinderGeometry(0.5, 0.5, 0.15, 14), 0, 1.3, 0, '#d8c070', [Math.PI / 2, 0, 0]); AH.geo(new THREE.CylinderGeometry(0.2, 0.2, 0.16, 12), 0, 1.3, 0.01, '#c8302a', [Math.PI / 2, 0, 0]); }
  B.spot('plaza', ...P(0, 4), 0);
}
// ---------- China: a walled city, the emperor's hall on its terrace, a pagoda, lanterns; villages among rice ----------
function pagoda(B, x, z, n, base, col1, roofC) {
  const H = hx(B, x, z, 0); let y = 0, w = base;
  for (let k = 0; k < n; k++) {
    H.box(w * 0.72, 2.6, w * 0.72, 0, y, 0, col1);
    for (const s of [-1, 1]) { H.mid(0.3, 1.5, 0.06, 0, y + 1.3, s * w * 0.362, '#2a2a2a'); H.mid(0.06, 1.5, 0.3, s * w * 0.362, y + 1.3, 0, '#2a2a2a'); }
    const g = new THREE.ConeGeometry(w * 0.82, 1.3, 4); g.rotateY(Math.PI / 4); H.geo(g, 0, y + 3.1, 0, roofC);
    for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) H.geo(new THREE.ConeGeometry(0.22, 0.8, 4), sx * w * 0.56, y + 2.6, sz * w * 0.56, roofC, [sz * 0.8, 0, -sx * 0.8]);
    for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) H.glow(new THREE.SphereGeometry(0.16, 8, 6), sx * w * 0.5, y + 2.25, sz * w * 0.5, '#ff6a3a');
    y += 2.8; w *= 0.82;
  }
  H.cyl(0.08, 0.1, 2.4, 0, y + 0.8, 0, '#d8a020', 6); for (let k = 0; k < 4; k++) H.geo(new THREE.TorusGeometry(0.2 - k * 0.03, 0.04, 5, 10), 0, y + 1.2 + k * 0.35, 0, '#d8a020', [Math.PI / 2, 0, 0]);
  B.solid(x, z, base * 0.5);
}
function lanternPost(B, x, z, rot) { const H = hx(B, x, z, rot); H.cyl(0.08, 0.1, 3, 0, 0, 0, '#3a2a20', 6); H.mid(1.0, 0.08, 0.08, 0.4, 2.9, 0, '#3a2a20'); H.glow(new THREE.SphereGeometry(0.28, 10, 8), 0.8, 2.45, 0, '#ff5a30', null, [1, 1.25, 1]); H.mid(0.3, 0.06, 0.3, 0.8, 2.86, 0, '#2a2a2a'); B.solid(x, z, 0.2); }
function paifang(B, x, z, rot, w) {
  const H = hx(B, x, z, rot); w = w || 7;
  for (const s of [-1, 1]) { H.cyl(0.22, 0.25, 4.6, s * w / 2, 0, 0, '#a8302a', 10); H.box(0.7, 0.6, 0.7, s * w / 2, 0, 0, '#8a8478'); }
  H.box(w + 1.0, 0.45, 0.45, 0, 3.9, 0, '#a8302a'); H.box(w * 0.6, 0.6, 0.12, 0, 4.4, 0, '#2a4a7a');
  const g = new THREE.ConeGeometry(Math.SQRT1_2, 1, 4); g.rotateY(Math.PI / 4); H.geo(g, 0, 5.4, 0, '#3a3a40', null, [w + 2.4, 1.0, 1.6]);
  for (const s of [-1, 1]) H.geo(new THREE.ConeGeometry(0.12, 0.6, 4), s * (w / 2 + 1.1), 5.05, 0, '#3a3a40', [0, 0, -s * 0.9]);
  for (const s of [-1, 1]) H.glow(new THREE.SphereGeometry(0.26, 10, 8), s * w * 0.3, 3.2, 0.35, '#ff5a30', null, [1, 1.25, 1]);
}
function gardenPond(B, x, z, r) {
  const H = hx(B, x, z, 0);
  H.cyl(r + 0.4, r + 0.5, 0.25, 0, -0.05, 0, '#8a8478', 18); H.glow(new THREE.CircleGeometry(r, 20), 0, 0.22, 0, '#4a7a7a', [-Math.PI / 2, 0, 0]);
  H.geo(new THREE.TorusGeometry(r * 0.75, 0.12, 6, 14, Math.PI), 0, 0.2, 0, '#a8302a', [0, Math.PI / 2, 0], [1, 0.55, 1]);
  for (let k = 0; k < 4; k++) H.geo(new THREE.DodecahedronGeometry(0.4, 0), Math.sin(k * 1.7) * (r + 0.9), 0.3, Math.cos(k * 1.7) * (r + 0.9), '#7a766e', [k, k, 0]);
  for (let k = 0; k < 5; k++) H.glow(new THREE.CircleGeometry(0.22, 8), Math.sin(k * 2.3) * r * 0.5, 0.24, Math.cos(k * 2.3) * r * 0.5, '#4a9a4a', [-Math.PI / 2, 0, 0]);
  B.solid(x, z, r + 0.3);
}
function townChina(B, c, S) {
  const K = townKit(B, c, 66), { T, R, P, A, pk } = K, at = (fn, lx, lz, ...a) => fn(B, ...P(lx, lz), ...a);
  const walls = ['#e8e0d0', '#ddd2bc', '#e6dccc', '#d8ccb8'], roofs = ['#3a3a40', '#4a4a50', '#3a4048'];
  const home = (lx, lz, w, d, h) => { if (!K.free(lx, lz, Math.max(w, d) * 0.6 + 1)) return false; const [x, z] = P(lx, lz); house(B, x, z, A(Math.atan2(-lx, -lz)), { style: 'china', w, d, h, wall: pk(walls), roof: pk(roofs), trim: '#5a2a1a', door: '#9a2a22', rh: 1.5, shut: null, plinth: '#8a8478' }); return true; };
  const ring = (n, r0, r1, a0, a1) => { for (let k = 0, t = 0, out = []; k < n && t < n * 14; t++) { const a = lerp(a0, a1, R()), r = lerp(r0, r1, R()), lx = Math.sin(a) * r, lz = Math.cos(a) * r; if (out.some(q => Math.hypot(q[0] - lx, q[1] - lz) < 7.2)) continue; if (home(lx, lz, 5 + R(), 4 + R() * 0.6, 2.8 + R() * 0.6)) { out.push([lx, lz]); k++; } } };
  if (S.kind === 'city') {
    const half = 20; squareWall(B, T, half, 6.5, 1.6, '#a8a092', 2.6, 9, '#3a3a40', '#c8202a', 3.4, 'china'); addWalled(c, T, half);
    // the gate's tower: a hall with a red front and a double roof over the gate
    const GH = hx(B, ...P(0, half), T.fa, B.gy(...P(0, half)) + 7.1); GH.box(8, 2.6, 3.2, 0, 0, 0, '#a8302a'); const g1 = new THREE.ConeGeometry(Math.SQRT1_2, 1, 4); g1.rotateY(Math.PI / 4); GH.geo(g1, 0, 3.3, 0, '#3a3a40', null, [10.5, 1.4, 5]); const g2 = new THREE.ConeGeometry(Math.SQRT1_2, 1, 4); g2.rotateY(Math.PI / 4); GH.geo(g2, 0, 4.6, 0, '#3a3a40', null, [7, 1.2, 3.4]);
    for (const s of [-1, 1]) B.spot('gate', ...P(s * 2.4, half + 2.4), A(0));
    // the emperor's hall: a white terrace with stairs, red columns, a golden double roof
    const [hx1, hz1] = P(0, -9), TH = hx(B, hx1, hz1, T.fa);
    TH.box(20, 1.6, 12, 0, -0.4, 0, '#e8e4dc', null, 0.02); for (let k = 0; k < 4; k++) TH.box(5 - k * 0.3, 0.4, 0.8, 0, -0.4 + k * 0.4, 6.4 + (3 - k) * 0.7, '#e0dcd2');
    house(B, hx1, hz1, A(0), { style: 'china', w: 15, d: 8, h: 5, wall: '#a8302a', roof: '#d8a020', trim: '#5a1a12', door: '#5a1a12', rh: 2.6, plinth: '#e8e4dc', dw: 2.2, dh: 3.2, ww: 1.0, wh: 1.4 });
    const g3 = new THREE.ConeGeometry(Math.SQRT1_2, 1, 4); g3.rotateY(Math.PI / 4); TH.geo(g3, 0, 9.6, 0, '#d8a020', null, [11, 1.8, 5.5]);
    for (const s of [-6, -2, 2, 6]) TH.cyl(0.32, 0.32, 5, s, 1.2, 4.6, '#8a1a12', 10);
    B.spot('guard', ...P(-2.4, -1.6), A(0)); B.spot('guard', ...P(2.4, -1.6), A(0)); B.spot('temple', ...P(0, -1.2), A(0));
    const [px, pz] = P(-12, 10); pagoda(B, px, pz, 5, 6.5, '#a8302a', '#3a3a40');
    ring(6, 8, 16, 0.9, 2.1); ring(4, 8, 16, -2.1, -0.9);
    at(paifang, 0, 12, A(0), 6); at(gardenPond, 12, 6, 2.6);
    at(stall, 6, 14, A(-Math.PI / 2), ['#c8202a', '#e8b830'], 'cloth'); at(stall, -6, 14.5, A(Math.PI / 2), ['#2a4a7a', '#e8e0d0'], 'pots'); at(stall, -6, 6, A(Math.PI / 2), ['#c8202a', '#f2efe6'], 'spice');
    for (const [lx, lz] of [[-3.5, 3], [3.5, 3], [-3.5, 9], [3.5, 9]]) at(lanternPost, lx, lz, A(lx < 0 ? 0 : Math.PI));
    at(townTree, 15, 13, 'bamboo'); at(townTree, -16, -15, 'bamboo'); at(townTree, 16, -15, 'round', 0.9); at(well2, 9, 13);
    for (const [lx, lz] of [[-16, 16], [16, 16], [-16, -16], [16, -16]]) B.spot('patrol', ...P(lx, lz), 0);
    B.spot('plaza', ...P(0, 6), 0);
    for (const [lx, lz, a2] of [[-34, 26, 0.1], [32, 30, -0.2], [0, 44, 0]]) { const [x, z] = P(lx, lz); field2(B, x, z, 12, 9, A(a2), 'rice'); }
  } else {
    ring(7, 7, 17, -Math.PI, Math.PI);
    const [px, pz] = P(0, -11); pagoda(B, px, pz, 3, 5, '#a8302a', '#3a3a40'); B.spot('temple', ...P(0, -7.6), A(0));
    at(paifang, 0, 7, A(0), 5); at(well2, 4, 2); at(stall, -4, 3, A(Math.PI / 2), ['#c8202a', '#e8e0d0'], 'fruit'); at(lanternPost, -2, -3, A(0)); at(lanternPost, 3, -4, A(Math.PI));
    for (const [lx, lz] of [[-12, 12], [13, -10]]) at(townTree, lx, lz, 'bamboo');
    for (const [lx, lz, a2] of [[-22, 14, 0.1], [20, 18, -0.2], [0, 26, 0], [-24, -12, 0.3], [24, -14, -0.3]]) { const [x, z] = P(lx, lz); field2(B, x, z, 12, 8, A(a2), 'rice'); }
    plaza(B, 0, 0, 4.5, '#9a9080'); B.spot('plaza', 0, 0, 0);
  }
}
// ---------- Japan: a castle of white tiers on a stone base, a pagoda, cherry trees, a torii; a fishing village ----------
function torii(B, x, z, rot, w) {
  const H = hx(B, x, z, rot); w = w || 5.2;
  for (const s of [-1, 1]) { H.cyl(0.22, 0.26, 5, s * w / 2, 0, 0, '#c8302a', 10); H.box(0.6, 0.4, 0.6, s * w / 2, 0, 0, '#2a2a2a'); }
  H.box(w + 2, 0.45, 0.5, 0, 4.6, 0, '#c8302a'); H.box(w + 2.4, 0.3, 0.6, 0, 5.05, 0, '#2a2a2a'); H.box(w + 0.6, 0.25, 0.3, 0, 3.8, 0, '#c8302a'); H.box(0.3, 0.8, 0.25, 0, 3.9, 0, '#c8302a');
}
function stoneLantern(B, x, z) { const H = hx(B, x, z, 0); H.box(0.5, 1.0, 0.5, 0, 0, 0, '#9a958a'); H.box(0.8, 0.3, 0.8, 0, 1.0, 0, '#8a857a'); H.box(0.55, 0.5, 0.55, 0, 1.3, 0, '#9a958a'); H.glow(new THREE.BoxGeometry(0.3, 0.3, 0.6), 0, 1.55, 0, '#ffb060'); H.geo(new THREE.ConeGeometry(0.6, 0.4, 4), 0, 2.0, 0, '#8a857a', [0, Math.PI / 4, 0]); B.solid(x, z, 0.4); }
function townJapan(B, c, S) {
  const K = townKit(B, c, 91), { T, R, P, A, pk } = K, at = (fn, lx, lz, ...a) => fn(B, ...P(lx, lz), ...a);
  const walls = ['#efe8d8', '#e8e0cc', '#f2ece0'], roofs = ['#3a4048', '#4a4a50', '#5a4a3a'];
  const home = (lx, lz, w, d, h) => { if (!K.free(lx, lz, Math.max(w, d) * 0.6 + 1)) return false; const [x, z] = P(lx, lz); house(B, x, z, A(Math.atan2(-lx, -lz)), { style: 'japan', w, d, h, wall: pk(walls), roof: pk(roofs), trim: '#3a2a1c', door: '#5a3a28', rh: 1.4, plinth: '#7a746a', ww: 0.9, wh: 0.8 }); return true; };
  const ring = (n, r0, r1, a0, a1) => { for (let k = 0, t = 0, out = []; k < n && t < n * 14; t++) { const a = lerp(a0, a1, R()), r = lerp(r0, r1, R()), lx = Math.sin(a) * r, lz = Math.cos(a) * r; if (out.some(q => Math.hypot(q[0] - lx, q[1] - lz) < 7)) continue; if (home(lx, lz, 5 + R(), 4 + R() * 0.5, 2.6)) { out.push([lx, lz]); k++; } } };
  if (S.kind === 'castle') {
    const [x, z] = P(0, -6), y0 = B.gy(x, z), CH = hx(B, x, z, T.fa, y0);
    // the stone base sloping in, then tiers of white walls with dark roofs, little gables, and golden fish on the top
    const g = new THREE.CylinderGeometry(7.5 * Math.SQRT2 * 0.82, 9.5 * Math.SQRT2 * 0.72, 5, 4); g.rotateY(Math.PI / 4); CH.geo(g, 0, 2.3, 0, '#8a8478', null, null, 0.04);
    let y = 4.8, w = 10;
    for (let k = 0; k < 4; k++) {
      CH.box(w, 3, w * 0.85, 0, y, 0, '#f2efe8');
      for (let q = -1; q <= 1; q++) for (const s of [-1, 1]) { CH.mid(0.7, 0.9, 0.06, q * w * 0.3, y + 1.6, s * (w * 0.425 + 0.02), '#2a2a2a'); CH.glow(new THREE.PlaneGeometry(0.5, 0.7), q * w * 0.3, y + 1.6, s * (w * 0.425 + 0.06), GLOWC, [0, s > 0 ? 0 : Math.PI, 0]); }
      CH.mid(w + 0.05, 0.25, w * 0.85 + 0.05, 0, y + 0.3, 0, '#2a2a2a');
      const r = new THREE.ConeGeometry(Math.SQRT1_2, 1, 4); r.rotateY(Math.PI / 4); CH.geo(r, 0, y + 3.6, 0, '#3a4a50', null, [w * 1.35, 1.6, w * 1.2]);
      for (const s of [-1, 1]) CH.geo(prismGeo(w * 0.35, 1.0, 1.1), 0, y + 3.0, s * w * 0.55, '#3a4a50', [0, Math.PI / 2, 0]);
      y += 3.4; w *= 0.78;
    }
    for (const s of [-1, 1]) CH.geo(new THREE.ConeGeometry(0.25, 0.9, 6), s * 1.6, y + 1.2, 0, '#d8a020', [0, 0, s * 0.4]);
    CH.geo(new THREE.ConeGeometry(0.4, 1, 6), 0, y + 0.9, 0, '#d8a020');
    B.solid(x, z, 8); B.spot('guard', ...P(-2, 1.5), A(0)); B.spot('guard', ...P(2, 1.5), A(0));
    at(torii, 0, 16, A(0)); for (const s of [-1, 1]) B.spot('gate', ...P(s * 3.6, 18), A(0));
    ring(6, 13, 23, 0.6, TAU - 0.6);
    const [px, pz] = P(16, -8); pagoda(B, px, pz, 5, 5.5, '#5a3a2a', '#3a4048'); B.spot('temple', ...P(16, -3.6), A(0));
    for (const [lx, lz] of [[-4, 10], [4, 10], [-4, 4], [4, 4]]) at(stoneLantern, lx, lz);
    for (const [lx, lz] of [[-12, 8], [10, 10], [-15, -6], [-8, 14], [13, 4], [-18, 10]]) if (K.free(lx, lz, 2)) at(townTree, lx, lz, 'cherry');
    at(stall, -7, 12, A(Math.PI / 2), ['#c8302a', '#f2efe6'], 'fish'); at(stall, 7, 12.5, A(-Math.PI / 2), ['#2a3a5a', '#f2efe6'], 'cloth');
    at(forge, -14, -10, A(Math.PI / 2)); at(well2, 9, 1);
    for (const [lx, lz] of [[-14, 14], [14, 16], [-18, -14], [12, -16]]) B.spot('patrol', ...P(lx, lz), 0);
    B.spot('plaza', ...P(0, 8), 0);
    for (const [lx, lz, a2] of [[-30, 26, 0.2], [30, 28, -0.2]]) { const [x2, z2] = P(lx, lz); field2(B, x2, z2, 11, 8, A(a2), 'rice'); }
  } else {
    ring(7, 6, 15, -Math.PI, Math.PI);
    at(torii, 0, 9, A(0), 4); B.spot('temple', ...P(0, 6.5), A(Math.PI));
    for (const [lx, lz] of [[-2.5, 6], [2.5, 6]]) at(stoneLantern, lx, lz);
    const [wx, wz] = P(0, 18); const wy = B.gy(wx, wz);
    for (const s of [-1, 1]) { const [qx, qz] = P(s * 7, 17); pier(B, qx, qz, A(0), 9, '#6a4a2c'); }
    for (let k = 0; k < 3; k++) { const NH = hx(B, ...P(-12 + k * 4, 11), A(0.3)); for (const s of [-1, 1]) NH.cyl(0.05, 0.06, 2.2, s * 1.4, 0, 0, '#5a3a22', 6); NH.mid(2.8, 1.6, 0.03, 0, 1.3, 0, '#5a6a6a'); }
    at(fishRack, 11, 10, A(-0.3)); at(stall, -4, 2, A(Math.PI / 2), ['#2a3a5a', '#f2efe6'], 'fish'); at(well2, 4, -2);
    for (const [lx, lz] of [[-10, -6], [9, -8], [-14, 4]]) if (K.free(lx, lz, 2)) at(townTree, lx, lz, 'cherry', 0.9);
    plaza(B, 0, 0, 4.5, '#9a9080'); B.spot('plaza', 0, 0, 0);
    if (wy < -0.5) B.spot('dock', ...P(0, 16), A(0));
  }
}
// ---------- Arabia: a walled city of white houses, a mosque with a dome and minarets, a covered market, palms ----------
function minaret(B, x, z, h, color, top) { B.cyl(0.9, 1.1, h, x, z, color, { seg: 10, solid: true }); B.cyl(1.4, 1.2, 0.5, x, z, color, { y: h * 0.75, seg: 10 }); B.cyl(0.7, 0.8, 2.2, x, z, color, { y: h, seg: 10 }); B.cone(0.8, 2, x, z, top || '#2a8a5a', { y: h + 2.2, seg: 10 }); const H = hx(B, x, z, 0); for (let k = 0; k < 6; k++) H.glow(new THREE.PlaneGeometry(0.25, 0.5), Math.sin(k) * 0.72, h + 1.0, Math.cos(k) * 0.72, '#ffd080', [0, k, 0]); }
function fountain(B, x, z, r) { const H = hx(B, x, z, 0); H.cyl(r, r + 0.15, 0.6, 0, 0, 0, '#d8ccb0', 16); H.glow(new THREE.CircleGeometry(r - 0.15, 16), 0, 0.58, 0, '#4a8aa8', [-Math.PI / 2, 0, 0]); H.cyl(0.18, 0.25, 1.2, 0, 0.5, 0, '#d8ccb0', 10); H.cyl(0.6, 0.4, 0.2, 0, 1.6, 0, '#d8ccb0', 12); H.glow(new THREE.ConeGeometry(0.12, 0.7, 8), 0, 2.0, 0, '#bfe0f0'); B.solid(x, z, r + 0.1); for (let k = 0; k < 4; k++) { const a = k / 4 * TAU; H.spot('well', Math.sin(a) * (r + 0.7), Math.cos(a) * (r + 0.7), a + Math.PI); } }
function carpets(B, x, z, rot) { const H = hx(B, x, z, rot); for (const s of [-1, 1]) H.cyl(0.05, 0.06, 2.4, s * 1.7, 0, 0, '#5a3a22', 6); H.mid(3.4, 0.03, 0.03, 0, 2.3, 0, '#5a3a22'); for (let k = 0; k < 3; k++) { H.mid(0.95, 1.6, 0.03, -1.1 + k * 1.1, 1.45, 0, ['#a8302a', '#2a4a8a', '#8a5a2a'][k]); H.mid(0.7, 1.3, 0.035, -1.1 + k * 1.1, 1.45, 0, ['#d8a020', '#c8302a', '#2a6a5a'][k]); } }
function townArabs(B, c, S) {
  const K = townKit(B, c, 71), { T, R, P, A, pk } = K, at = (fn, lx, lz, ...a) => fn(B, ...P(lx, lz), ...a);
  const walls = ['#f2ece0', '#e6d4b0', '#efe4cc', '#e0ccaa', '#f2efe6'], doors = ['#2a6a8a', '#6a3a2a', '#2a8a6a', '#8a5a2a'];
  const home = (lx, lz, w, d, h) => { if (!K.free(lx, lz, Math.max(w, d) * 0.6 + 1)) return false; const [x, z] = P(lx, lz), wl = pk(walls); house(B, x, z, A(Math.atan2(-lx, -lz)), { style: 'arab', w, d, h, wall: wl, roof: wl, trim: '#8a6a4a', door: pk(doors), dome: pk(['#2a8a5a', '#f2ece0', '#3a7aa8']), shut: null, ww: 0.42, wh: 0.7, plinth: '#c8b898' }); return true; };
  const ring = (n, r0, r1, a0, a1) => { for (let k = 0, t = 0, out = []; k < n && t < n * 14; t++) { const a = lerp(a0, a1, R()), r = lerp(r0, r1, R()), lx = Math.sin(a) * r, lz = Math.cos(a) * r; if (out.some(q => Math.hypot(q[0] - lx, q[1] - lz) < 6.6)) continue; if (home(lx, lz, 4.6 + R(), 4.6 + R(), R() < 0.45 ? 5 : 3.2)) { out.push([lx, lz]); k++; } } };
  if (S.kind === 'city') {
    const half = 21; squareWall(B, T, half, 6, 1.8, '#d8c49a', 2.7, 8, null, '#1f7a4a', 3.4); addWalled(c, T, half);
    for (const s of [-1, 1]) B.spot('gate', ...P(s * 2.4, half + 2.4), A(0));
    // the mosque: its prayer hall under a green dome, a row of arches in front, two minarets, a court with a fountain
    const [mx, mz] = P(0, -10); B.box(14, 7, 10, mx, mz, '#f2ece0', { ry: T.fa, solid: true }); B.ball(5, mx, mz, '#2a8a5a', { y: 7, half: true, seg: 20 }); B.cone(0.3, 1.6, mx, mz, '#d8a020', { y: 12, seg: 6 });
    const MH = hx(B, mx, mz, T.fa, B.gy(mx, mz));
    for (let k = 0; k < 7; k++) { const lx = -6 + k * 2; MH.cyl(0.22, 0.25, 3.4, lx, 0, 6.2, '#e8dcc4', 8); if (k < 6) { MH.geo(new THREE.TorusGeometry(0.95, 0.16, 5, 10, Math.PI), lx + 1, 3.4, 6.2, '#e8dcc4'); MH.glow(new THREE.CircleGeometry(0.7, 10, 0, Math.PI), lx + 1, 3.2, 5.05, '#ffd080'); } }
    MH.box(14.4, 0.6, 2.6, 0, 3.9, 5.9, '#f2ece0');
    for (const s of [-1, 1]) { const [x, z] = P(s * 9, -15); minaret(B, x, z, 16, '#f2ece0'); }
    at(fountain, 0, -1.5, 1.8); B.spot('temple', ...P(0, -3.5), A(0));
    ring(6, 7, 18, 0.95, 2.3); ring(6, 7, 18, -2.3, -0.95);
    // the souk: two rows of stalls along the way from the gate, carpets on lines, lanterns
    const G = ['spice', 'cloth', 'pots', 'fruit', 'spice', 'bread'];
    for (let k = 0; k < 3; k++) { at(stall, -4.6, 6 + k * 4, A(Math.PI / 2), [pk(['#c0392b', '#2a6ab0', '#e0a020', '#2a8a5a']), '#f2efe6'], G[k]); at(stall, 4.6, 6 + k * 4, A(-Math.PI / 2), [pk(['#c0392b', '#2a6ab0', '#e0a020', '#2a8a5a']), '#f2efe6'], G[k + 3]); }
    at(carpets, -8, 15, A(Math.PI / 2)); at(carpets, 8, 9, A(-Math.PI / 2));
    for (const [lx, lz] of [[-2.6, 4], [2.6, 8], [-2.6, 12], [2.6, 16]]) at(lamp, lx, lz, '#ffd080');
    for (const [lx, lz] of [[-15, 6], [15, 4], [-12, -16], [13, -2], [-17, 15], [17, 15]]) if (K.free(lx, lz, 1.5)) at(townTree, lx, lz, 'palm');
    at(sacks, 9, 17, A(0)); at(barrels, -10, 18, 3, A(0.2)); at(forge, 15, -12, A(-Math.PI / 2));
    for (const [lx, lz] of [[-17, 17], [17, 17], [-17, -17], [17, -17]]) B.spot('patrol', ...P(lx, lz), 0);
    B.spot('guard', ...P(-2, -4.4), A(0)); B.spot('plaza', ...P(0, 2), 0);
    for (const [lx, lz, a2] of [[-34, 30, 0.2], [32, 32, -0.2]]) { const [x, z] = P(lx, lz); field2(B, x, z, 11, 8, A(a2), 'wheat'); }
  } else {
    ring(4, 8, 14, -Math.PI, Math.PI);
    for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + 0.5, [x, z] = P(Math.sin(a) * 17, Math.cos(a) * 17); B.roof(4.4, 3.2, 1.9, x, z, '#3a2e26', { ry: a + T.fa }); B.box(2.6, 0.03, 3.4, x, z, ['#a8322a', '#2a4a8a'][k % 2], { ry: a + T.fa }); B.solid(x, z, 1.6); B.spot('door', x, z + 1, 0); }
    // the oasis: a pool among palms
    const OH = hx(B, ...P(0, -9), 0); OH.cyl(4.2, 4.4, 0.2, 0, -0.08, 0, '#c8b088', 20); OH.glow(new THREE.CircleGeometry(3.8, 20), 0, 0.14, 0, '#3a7a8a', [-Math.PI / 2, 0, 0]);
    for (let k = 0; k < 7; k++) { const a = k / 7 * TAU, [x, z] = P(Math.sin(a) * 6, -9 + Math.cos(a) * 6); townTree(B, x, z, 'palm', 0.9 + (k % 3) * 0.1); }
    for (let k = 0; k < 3; k++) { const a = k / 3 * TAU; B.spot('well', ...P(Math.sin(a) * 4.8, -9 + Math.cos(a) * 4.8), A(a + Math.PI)); }
    at(stall, 4, 4, A(-Math.PI / 2), ['#a8302a', '#f2efe6'], 'fruit'); at(sacks, -5, 4, A(0.3)); at(lamp, 0, 3, '#ffd080');
    plaza(B, 0, 2, 4, '#c8b088'); B.spot('plaza', ...P(0, 2), 0);
  }
}
// ---------- Egypt: a city on the Nile, a temple behind its pylon, sphinxes along the way, boats with sails ----------
function felucca(B, x, z, rot, y) {
  const H = hx(B, x, z, rot, y);
  H.geo(new THREE.SphereGeometry(1, 14, 6, 0, TAU, Math.PI / 2, Math.PI / 2), 0, 0.35, 0, '#7a5a3a', null, [0.9, 0.6, 3.2]);
  H.mid(1.5, 0.06, 5.6, 0, 0.32, 0, '#8a6a4a'); H.cyl(0.07, 0.09, 6.5, 0, 0.3, 0.6, '#5a3a22', 6);
  const sail = new THREE.BufferGeometry(); sail.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 4.6, 0, 6.8, -1.2, 0, 0, 0, 0, 6.8, -1.2, 0, 0, 4.6], 3)); sail.computeVertexNormals();
  H.geo(sail, 0, 0.9, -1.2, '#f2efe6', [0, 0.25, 0]);
}
function sphinxSmall(B, x, z, rot) { const H = hx(B, x, z, rot); H.box(0.9, 0.7, 2.0, 0, 0.4, 0, '#cfae78'); H.box(0.8, 1.0, 0.8, 0, 0.8, 0.75, '#cfae78'); H.box(1.0, 0.6, 0.3, 0, 1.2, 0.9, '#2a62b8'); H.box(1.1, 0.4, 2.3, 0, 0, 0, '#bfa070'); B.solid(x, z, 1.0); }
function townEgypt(B, c, S) {
  const K = townKit(B, c, 73), { T, R, P, A, pk } = K, at = (fn, lx, lz, ...a) => fn(B, ...P(lx, lz), ...a);
  // the temple: a pylon of two sloping towers with a gate between, painted bands and flagpoles; the hall of columns
  const [tx, tz] = P(0, -12); B.box(16, 7, 10, tx, tz, '#d8bc8a', { ry: T.fa, solid: true });
  const TH = hx(B, tx, tz, T.fa, B.gy(tx, tz));
  for (const s of [-1, 1]) { const g = new THREE.CylinderGeometry(2.6 * Math.SQRT2, 3.4 * Math.SQRT2, 10, 4); g.rotateY(Math.PI / 4); TH.geo(g, s * 4.6, 5, 6, '#d8c08a', null, [1, 1, 0.45], 0.03); for (let k = 0; k < 3; k++) TH.mid(5, 0.4, 0.05, s * 4.6, 2.5 + k * 2.6, 6 + 1.55 - k * 0.09, ['#2a62b8', '#c8302a', '#2a8a6a'][k]); TH.cyl(0.08, 0.1, 12, s * 2.4, 0, 7.4, '#6a4a2a', 6); TH.mid(0.06, 1.0, 0.7, s * 2.4, 11.2, 7.75, '#c8302a'); }
  TH.box(3.4, 6.5, 2.2, 0, 0, 6, '#d8c08a'); TH.box(2.4, 4.5, 0.1, 0, 0, 7.12, '#3a2a1c'); B.spot('temple', ...P(0, -4), A(0)); B.spot('guard', ...P(-2.3, -3.8), A(0)); B.spot('guard', ...P(2.3, -3.8), A(0));
  for (let k = 0; k < 6; k++) { const [x, z] = P(-7.5 + k * 3, -18.5); B.cyl(0.7, 0.75, 7, x, z, '#e0c898', { seg: 10, solid: true }); B.cyl(0.95, 0.75, 0.6, x, z, '#2a62b8', { y: 6.5, seg: 10 }); }
  for (const s of [-1, 1]) { const [x, z] = P(s * 4, 3); const g = new THREE.CylinderGeometry(0.3, 0.75, 9, 4); g.rotateY(Math.PI / 4); B.add(g, M([x, B.gy(x, z) + 4.5, z], [0, T.fa, 0]), '#c8a870'); B.add(new THREE.ConeGeometry(0.42, 0.8, 4), M([x, B.gy(x, z) + 9.4, z], [0, T.fa + Math.PI / 4, 0]), '#d8a020'); B.solid(x, z, 1); }
  for (let k = 0; k < 4; k++) for (const s of [-1, 1]) at(sphinxSmall, s * 3.2, -1 + k * 3.4 + 2, A(-s * Math.PI / 2));
  // houses of mud brick with terraces on their roofs
  const walls = ['#c8a878', '#d8b886', '#bfa070', '#e6d4b0', '#d0b080'];
  for (let k = 0, t = 0, out = []; k < 10 && t < 150; t++) { const a = R() * TAU, r = 10 + R() * 12, lx = Math.sin(a) * r, lz = Math.cos(a) * r; if (Math.abs(lx) < 6 && lz > -20 && lz < 14) continue; if (out.some(q => Math.hypot(q[0] - lx, q[1] - lz) < 7) || !K.free(lx, lz, 4)) continue; const [x, z] = P(lx, lz), wl = pk(walls); house(B, x, z, A(Math.atan2(-lx, -lz)), { style: 'egypt', w: 5 + R(), d: 4.5 + R() * 0.8, h: 3, wall: wl, roof: wl, trim: '#7a5a3a', door: pk(['#2a62b8', '#5a3a22', '#2a8a6a']), shut: null, ww: 0.5, wh: 0.5, plinth: '#a89070' }); out.push([lx, lz]); k++; }
  // the market, granaries, palms along the river, reeds, boats with sails on the Nile
  at(stall, -8, 6, A(Math.PI / 2), ['#2a62b8', '#f2efe6'], 'bread'); at(stall, 8, 6, A(-Math.PI / 2), ['#c8302a', '#f2efe6'], 'pots'); at(stall, -8, 11, A(Math.PI / 2), ['#d8a020', '#f2efe6'], 'cloth');
  for (let k = 0; k < 3; k++) { const GH = hx(B, ...P(14 + k * 2.6, -14), 0); GH.cyl(1.1, 1.2, 1.6, 0, 0, 0, '#c8a878', 12); GH.geo(new THREE.SphereGeometry(1.1, 12, 8, 0, TAU, 0, Math.PI / 2), 0, 1.6, 0, '#c8a878', null, [1, 1.3, 1]); B.solid(GH.x, GH.z, 1.2); }
  for (let k = 0; k < 8; k++) { const a = -0.9 + k * 0.26, [x, z] = P(Math.sin(a) * 25, Math.cos(a) * 25); if (waterDepth(c.x + x, c.z + z) <= 0) townTree(B, x, z, 'palm', 0.9 + (k % 3) * 0.12); }
  const [rx, rz] = P(0, 34); const wy = -c.y + 0.25;
  if (B.gy(rx, rz) < -0.5) { felucca(B, rx, rz, A(1.3), wy); const [r2x, r2z] = P(-14, 38); if (B.gy(r2x, r2z) < -0.5) felucca(B, r2x, r2z, A(1.9), wy); B.spot('dock', ...P(0, 27), A(0)); }
  at(well2, 6, 12); at(lamp, -3, 13, '#ffd080'); at(lamp, 3, 1, '#ffd080'); at(sacks, 10, 12, A(0.4)); at(cart, -12, 14, A(0.8), 'sacks');
  plaza(B, 0, 9, 5, '#c8b088'); B.spot('plaza', ...P(0, 9), 0);
  for (const [lx, lz, a2] of [[-28, 24, 0.2], [28, 26, -0.2], [-34, 2, 0.6]]) { const [x, z] = P(lx, lz); field2(B, x, z, 11, 8, A(a2), 'wheat'); }
}
// the pyramids: three of them, a little apart from the city, and the sphinx
function egyptPyramids(c) {
  const B = new SB(c), T = townFrame(c), base = T.p(0, -70);
  for (const [lx, lz, s] of [[0, 0, 1], [36, 30, 0.8], [-30, 40, 0.6]]) {
    const [x, z] = T.p(lx, -70 + lz), Bw = 46 * s, H = 30 * s, g = new THREE.ConeGeometry(Bw * Math.SQRT1_2, H, 4); g.rotateY(Math.PI / 4);
    B.add(g, M([x, B.gy(x, z) + H / 2 - 0.5, z], [0, T.fa, 0]), '#d8c08a');
    B.add(new THREE.ConeGeometry(Bw * Math.SQRT1_2 * 0.12, H * 0.12, 4).rotateY(Math.PI / 4), M([x, B.gy(x, z) + H * 0.94 - 0.5, z], [0, T.fa, 0]), '#f0e0b0');
    for (let k = 1; k < 8; k++) { const q = new THREE.ConeGeometry(Bw * Math.SQRT1_2 * (1 - k / 8) + 0.12, 0.25, 4, 1, true); q.rotateY(Math.PI / 4); B.add(q, M([x, B.gy(x, z) - 0.5 + H * k / 8, z], [0, T.fa, 0]), '#c8b07a'); }
    B.solidBox(Bw * 0.9, Bw * 0.9, x, z, T.fa);
  }
  const [sx, sz] = T.p(-16, -32); B.box(3.6, 3, 11, sx, sz, '#cfae78', { ry: T.fa, solid: true }); B.box(3, 3.2, 2.8, ...T.p(-16, -27), '#cfae78', { y: 2.6, ry: T.fa }); B.box(4.2, 2.2, 1.2, ...T.p(-16, -26.8), '#2a62b8', { y: 3.6, ry: T.fa });
  const m = B.mesh(); m.position.set(c.x, c.y, c.z); scene.add(m); c.extra = (c.extra || []).concat(m);
  POI.push({ x: c.x + base[0], z: c.z + base[1], n: 'הפירמידות' });
}
// ---------- Mali: the great mosque of mud and beams, flat houses of mud, round huts, granaries, baobabs ----------
function townMali(B, c, S) {
  const K = townKit(B, c, 600), { T, R, P, A, pk } = K, at = (fn, lx, lz, ...a) => fn(B, ...P(lx, lz), ...a);
  const hut = (x, z, r) => { const H = hx(B, x, z, R() * TAU); H.cyl(r, r * 1.05, 2, 0, 0, 0, '#b07a4a', 14); H.geo(new THREE.ConeGeometry(r * 1.35, r * 1.2, 14), 0, 2 + r * 0.6, 0, '#c8a868', null, null, 0.05); H.geo(new THREE.ConeGeometry(0.2, 0.5, 6), 0, 2 + r * 1.35, 0, '#9a7a48'); H.box(0.7, 1.3, 0.1, 0, 0, r - 0.02, '#3a2a1c'); H.spot('door', 0, r + 0.8, Math.PI); B.solid(x, z, r + 0.1); };
  if (S.kind === 'city') {
    // the great mosque: thick walls of mud, buttresses crowned with spikes, wooden beams sticking out all over, three towers
    const [mx, mz] = P(0, -10), MH = hx(B, mx, mz, T.fa, B.gy(mx, mz));
    MH.box(18, 8, 12, 0, 0, 0, '#a8703e', null, 0.03); B.solidBox(18, 12, mx, mz, T.fa);
    for (let k = 0; k <= 9; k++) for (const zz of [6.1, -6.1]) { MH.box(0.8, 9, 0.6, -9 + k * 2, 0, zz, '#a8703e'); MH.geo(new THREE.ConeGeometry(0.35, 1.2, 6), -9 + k * 2, 9.6, zz, '#a8703e'); }
    for (const s of [-6, 0, 6]) { MH.box(2.6, 13, 2.6, s, 0, 6.5, '#a8703e'); MH.geo(new THREE.ConeGeometry(1.2, 2.6, 8), s, 14.3, 6.5, '#a8703e'); for (let k = 0; k < 6; k++) { MH.mid(0.14, 0.14, 1.8, s, 2.5 + k * 1.8, 6.5, '#6a4a2a'); MH.mid(1.8, 0.14, 0.14, s, 3.4 + k * 1.8, 6.5, '#6a4a2a'); } MH.geo(new THREE.SphereGeometry(0.3, 8, 6), s, 15.8, 6.5, '#f2efe6'); }
    for (let k = 0; k < 16; k++) for (const y of [3.5, 6]) MH.mid(0.12, 0.12, 0.9, -8.5 + k * 1.13, y, 6.3, '#6a4a2a');
    MH.box(2.4, 3.2, 0.2, -3, 0, 6.05, '#3a2a1c'); MH.box(2.4, 3.2, 0.2, 3, 0, 6.05, '#3a2a1c');
    B.spot('temple', ...P(-3, -2.4), A(0)); B.spot('temple', ...P(3, -2.4), A(0)); B.spot('guard', ...P(0, -2.6), A(0));
    // flat houses of mud with beams and spiked roofs, and round huts among them
    const walls = ['#b07a4a', '#a8703e', '#c08850', '#b88450'];
    for (let k = 0, t = 0, out = []; k < 9 && t < 140; t++) { const a = R() * TAU, r = 9 + R() * 14, lx = Math.sin(a) * r, lz = Math.cos(a) * r; if (Math.cos(a) < -0.35 && r < 18) continue; if (out.some(q => Math.hypot(q[0] - lx, q[1] - lz) < 6.5) || !K.free(lx, lz, 4)) continue; const [x, z] = P(lx, lz), wl = pk(walls); if (R() < 0.55) house(B, x, z, A(Math.atan2(-lx, -lz)), { style: 'mali', w: 5 + R(), d: 4.5, h: 3, wall: wl, roof: wl, trim: '#6a4a2a', door: '#4a2a1a', shut: null, ww: 0.4, wh: 0.5, plinth: '#8a5a3a' }); else hut(x, z, 1.8 + R() * 0.5); out.push([lx, lz]); k++; }
    at(stall, -6, 6, A(Math.PI / 2), ['#d8a020', '#2a3a8a'], 'cloth'); at(stall, 6, 6, A(-Math.PI / 2), ['#2a7a5a', '#f2efe6'], 'fruit'); at(stall, 0, 10, A(Math.PI), ['#a8302a', '#f2efe6'], 'pots');
    const SH = hx(B, ...P(-9, 10), A(0.4)); for (let k = 0; k < 6; k++) SH.box(1.2, 0.18, 0.6, (k % 3) * 1.25 - 1.25, Math.floor(k / 3) * 0.2, 0, '#f2efe6'); B.spot('market', ...P(-9, 11.2), A(Math.PI));
    for (let k = 0; k < 4; k++) { const GH = hx(B, ...P(16 + (k % 2) * 3, -12 + Math.floor(k / 2) * 3.2), 0); for (const [a2, b2] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) GH.box(0.3, 0.6, 0.3, a2 * 0.6, 0, b2 * 0.6, '#7a7068'); GH.cyl(1.0, 0.9, 1.4, 0, 0.6, 0, '#b07a4a', 10); GH.geo(new THREE.ConeGeometry(1.35, 1.2, 10), 0, 2.6, 0, '#c8a868'); B.solid(GH.x, GH.z, 1.1); }
  } else {
    for (let k = 0, t = 0, out = []; k < 8 && t < 100; t++) { const a = R() * TAU, r = 8 + R() * 10, lx = Math.sin(a) * r, lz = Math.cos(a) * r; if (out.some(q => Math.hypot(q[0] - lx, q[1] - lz) < 5.5) || !K.free(lx, lz, 3)) continue; hut(...P(lx, lz), 1.8 + R() * 0.5); out.push([lx, lz]); k++; }
    at(stall, 0, 5, A(Math.PI), ['#d8a020', '#f2efe6'], 'fruit');
    for (const [lx, lz, a2] of [[-22, 14, 0.2], [20, 16, -0.3]]) { const [x, z] = P(lx, lz); field2(B, x, z, 11, 8, A(a2), 'millet'); }
  }
  for (const [lx, lz] of [[-18, -6], [19, 4], [-14, 18], [12, -20]]) if (K.free(lx, lz, 2.5)) { const [x, z] = P(lx, lz); baobab(B, x, z); }
  at(well2, 4, 3); at(lamp, -3, 3, '#ffd080'); at(woodpile, 10, 14, A(0.5));
  plaza(B, 0, 3, 5, '#b89870'); B.spot('plaza', ...P(0, 3), 0);
}
function baobab(B, x, z) { const H = hx(B, x, z, (x + z) % TAU); H.cyl(0.9, 1.4, 5.5, 0, 0, 0, '#8a7a6a', 10); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; H.mid(0.3, 2.2, 0.3, Math.sin(a) * 1.3, 6.2, Math.cos(a) * 1.3, '#7a6a5a', [Math.cos(a) * 0.7, 0, -Math.sin(a) * 0.7]); H.geo(new THREE.SphereGeometry(1.0, 8, 6), Math.sin(a) * 2.3, 7.2, Math.cos(a) * 2.3, '#5a7a3a', null, [1, 0.6, 1]); } B.solid(x, z, 1.3); }
// ---------- India: the maharaja's palace of domes and arches over a long pool, painted houses, a stepwell, a temple ----------
function onion(B, x, z, y, r, color, tip) { B.ball(r, x, z, color, { y: y + r * 0.8, s: [1, 1.15, 1], seg: 16 }); B.cone(r * 0.5, r * 1.3, x, z, color, { y: y + r * 1.75, seg: 12 }); B.cyl(0.06, 0.06, 1, x, z, tip || '#d8a020', { y: y + r * 3, seg: 5 }); }
function stepwell(B, x, z, s) {
  const H = hx(B, x, z, 0); s = s || 6;
  for (let k = 0; k < 5; k++) { const w = s - k * 1.0; H.box(w, 0.35, 0.5, 0, -k * 0.35, w / 2 - 0.25, '#b8906a'); H.box(w, 0.35, 0.5, 0, -k * 0.35, -w / 2 + 0.25, '#b8906a'); H.box(0.5, 0.35, w, w / 2 - 0.25, -k * 0.35, 0, '#b8906a'); H.box(0.5, 0.35, w, -w / 2 + 0.25, -k * 0.35, 0, '#b8906a'); }
  H.glow(new THREE.PlaneGeometry(s - 5, s - 5), 0, -1.45, 0, '#3a7a7a', [-Math.PI / 2, 0, 0]);
  for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { H.box(0.4, 1.8, 0.4, a * (s / 2 + 0.3), 0, b * (s / 2 + 0.3), '#c8a07a'); H.geo(new THREE.SphereGeometry(0.4, 10, 6, 0, TAU, 0, Math.PI / 2), a * (s / 2 + 0.3), 1.8, b * (s / 2 + 0.3), '#e8c8a0'); }
  B.solid(x, z, s / 2); for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + 0.3; H.spot('well', Math.sin(a) * (s / 2 + 1), Math.cos(a) * (s / 2 + 1), a + Math.PI); }
}
function shikhara(B, x, z, rot, s) {
  const H = hx(B, x, z, rot); s = s || 1;
  H.box(4 * s, 0.6, 6 * s, 0, 0, 0, '#c8a07a'); H.box(3.4 * s, 3.2 * s, 3.4 * s, 0, 0.6, -1 * s, '#d8a878');
  for (let k = 0; k < 6; k++) { const r = (1.9 - k * 0.24) * s; H.cyl(r * 0.9, r, 1.0 * s, 0, 3.8 * s + k * 0.95 * s, -1 * s, k % 2 ? '#d8a878' : '#c89868', 8); }
  H.geo(new THREE.SphereGeometry(0.5 * s, 10, 8), 0, 9.8 * s, -1 * s, '#d8a020', null, [1, 0.6, 1]); H.cyl(0.04, 0.04, 1.6, 0, 10.1 * s, -1 * s, '#5a3a22', 5); H.mid(0.6, 0.4, 0.02, 0.3, 11.4 * s, -1 * s, '#e8601a');
  for (const [a, b] of [[-1, 1], [1, 1], [-1, 2.6], [1, 2.6]]) H.cyl(0.14, 0.16, 2.4 * s, a * 1.4 * s, 0.6, b * s, '#c89868', 8);
  H.box(3.6 * s, 0.3, 2.4 * s, 0, 3.0 * s, 1.8 * s, '#c89868'); H.box(1.2, 2.0, 0.1, 0, 0.6, 0.72 * s, '#4a2a1a');
  H.spot('temple', 0, 3.6 * s, Math.PI); B.solidBox(4 * s, 6 * s, x, z, rot);
}
function townIndia(B, c, S) {
  const K = townKit(B, c, 74), { T, R, P, A, pk } = K, at = (fn, lx, lz, ...a) => fn(B, ...P(lx, lz), ...a);
  const walls = ['#e8a878', '#d88a6a', '#88a8c8', '#e8c878', '#e09090', '#f0e0c8'];
  const home = (lx, lz, w, d, h) => { if (!K.free(lx, lz, Math.max(w, d) * 0.6 + 1)) return false; const [x, z] = P(lx, lz), wl = pk(walls); house(B, x, z, A(Math.atan2(-lx, -lz)), { style: 'india', w, d, h, wall: wl, roof: wl, trim: '#7a4a2a', door: pk(['#2a6a8a', '#8a2a5a', '#2a8a6a', '#a8602a']), shut: null, ww: 0.45, wh: 0.75, plinth: '#a8805a' }); return true; };
  const ring = (n, r0, r1, a0, a1) => { for (let k = 0, t = 0, out = []; k < n && t < n * 14; t++) { const a = lerp(a0, a1, R()), r = lerp(r0, r1, R()), lx = Math.sin(a) * r, lz = Math.cos(a) * r; if (out.some(q => Math.hypot(q[0] - lx, q[1] - lz) < 6.6)) continue; if (home(lx, lz, 4.8 + R(), 4.2 + R() * 0.6, R() < 0.4 ? 4.8 : 3.1)) { out.push([lx, lz]); k++; } } };
  if (S.kind === 'city') {
    const half = 19; squareWall(B, T, half, 6, 1.6, '#b0603a', 2.5, 8, null, '#e07a20', 3.4); addWalled(c, T, half);
    for (const s of [-1, 1]) B.spot('gate', ...P(s * 2.4, half + 2.4), A(0));
    // the palace: white walls, a row of arches, little balconies with domes, the great dome, towers at its corners
    const [px, pz] = P(0, -8); B.box(15, 8, 10, px, pz, '#f0e8dc', { ry: T.fa, solid: true }); onion(B, px, pz, 8, 3.4, '#f4f0e8');
    const PH = hx(B, px, pz, T.fa, B.gy(px, pz));
    for (let k = 0; k < 5; k++) { const lx = -6 + k * 3; PH.box(1.6, 3, 0.2, lx, 0, 5.02, '#3a2a20'); PH.geo(new THREE.CylinderGeometry(0.8, 0.8, 0.22, 12, 1, false, -Math.PI / 2, Math.PI), lx, 3, 5.02, '#3a2a20', [Math.PI / 2, 0, 0]); PH.glow(new THREE.PlaneGeometry(1.2, 2.4), lx, 1.6, 5.15, '#ffd080'); }
    for (let k = 0; k < 4; k++) { const lx = -4.5 + k * 3; PH.box(1.4, 1.2, 0.8, lx, 5.4, 5.3, '#e8dcc8'); PH.geo(new THREE.SphereGeometry(0.7, 10, 6, 0, TAU, 0, Math.PI / 2), lx, 6.6, 5.3, '#f4f0e8'); PH.glow(new THREE.PlaneGeometry(0.8, 0.7), lx, 6.0, 5.72, '#ffd080'); }
    for (const [sx, sz] of [[-6, -4], [6, -4], [-6, 4], [6, 4]]) { const [x, z] = P(sx, -8 + sz); B.cyl(0.9, 0.9, 10, x, z, '#f0e8dc', { seg: 10 }); onion(B, x, z, 10, 1.1, '#f4f0e8'); }
    B.spot('guard', ...P(-2, -2.2), A(0)); B.spot('guard', ...P(2, -2.2), A(0));
    // the long pool before the palace, fountains in it, cypresses along it
    const WH = hx(B, ...P(0, 5), T.fa); WH.box(3.6, 0.3, 12, 0, -0.1, 0, '#d8c8b0'); WH.glow(new THREE.PlaneGeometry(3, 11.4), 0, 0.22, 0, '#3a7a9a', [-Math.PI / 2, 0, 0]); for (let k = 0; k < 4; k++) WH.glow(new THREE.ConeGeometry(0.08, 0.8, 6), 0, 0.6, -4.5 + k * 3, '#bfe0f0'); B.solidBox(3.6, 12, ...P(0, 5), T.fa);
    for (let k = 0; k < 5; k++) for (const s of [-1, 1]) at(townTree, s * 3.4, 0 + k * 2.6, 'cypress', 0.9);
    ring(4, 9, 16, 1.2, 2.2); ring(4, 9, 16, -2.2, -1.2);
    at(stall, -9, 12, A(Math.PI / 2), ['#e8a020', '#c8302a'], 'spice'); at(stall, 9, 12, A(-Math.PI / 2), ['#e0407a', '#f2efe6'], 'cloth'); at(stall, -9, 7, A(Math.PI / 2), ['#2a8a8a', '#f2efe6'], 'fruit');
    at(stepwell, 12, -12, 6); at(lamp, -6, 15, '#ffd080'); at(lamp, 6, 15, '#ffd080'); at(forge, -14, -13, A(Math.PI / 2));
    for (const [lx, lz] of [[-15, 15], [15, 15], [-15, -15], [15, -15]]) B.spot('patrol', ...P(lx, lz), 0);
    B.spot('plaza', ...P(0, 13), 0);
    for (const [lx, lz, a2] of [[-32, 28, 0.2], [30, 30, -0.2]]) { const [x, z] = P(lx, lz); field2(B, x, z, 11, 8, A(a2), 'veg'); }
  } else {
    ring(7, 7, 16, -Math.PI, Math.PI);
    at(shikhara, 0, -11, A(0), 0.9);
    at(stepwell, 8, 6, 5); at(stall, -5, 4, A(Math.PI / 2), ['#e8a020', '#c8302a'], 'spice');
    const BH = hx(B, ...P(-12, 10), 0); BH.cyl(0.8, 1.1, 4, 0, 0, 0, '#7a6a5a', 10); BH.geo(new THREE.SphereGeometry(4.2, 12, 8), 0, 6.2, 0, '#3a6a2a', null, [1, 0.55, 1], 0.05); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; BH.cyl(0.08, 0.08, 5, Math.sin(a) * 3, 0, Math.cos(a) * 3, '#7a6a5a', 5); } B.solid(BH.x, BH.z, 1.2); B.spot('bench', ...P(-12, 13), A(Math.PI));
    for (const [lx, lz, a2] of [[-22, -14, 0.3], [22, -16, -0.3], [-24, 16, 0.1]]) { const [x, z] = P(lx, lz); field2(B, x, z, 11, 8, A(a2), 'veg'); }
    plaza(B, 0, 0, 4.5, '#b89070'); at(lamp, 3, -2, '#ffd080'); B.spot('plaza', 0, 0, 0);
  }
}
// ---------- the bandits: dark tents around a fire, a cart of stolen goods, a lookout ----------
function townBandits(B, c) {
  const R = mulberry32(700 + (c.x | 0)), tc = c.land === 10 ? '#8a7656' : c.land === 7 || c.land === 11 ? '#615643' : '#3e3a32';
  for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + R(), x = Math.sin(a) * 5.5, z = Math.cos(a) * 5.5; B.add(new THREE.ConeGeometry(1.7, 2.2, 4), M([x, B.gy(x, z) + 1.1, z], [0, a, 0]), k % 2 ? tc : '#4a4234'); B.solid(x, z, 1.4); B.spot('door', x * 0.75, z * 0.75, a + Math.PI); }
  B.box(0.18, 4.2, 0.18, -4, 3, '#5a4030', { y: 0 }); B.box(1.4, 0.12, 1.4, -4, 3, '#5a4030', { y: 4.2 }); B.box(1.2, 0.6, 0.08, -4, 3.66, '#4a3020', { y: 4.3 });
  for (let k = 0; k < 4; k++) B.box(0.05, 2.1, 0.05, 1 + k * 0.3, 4, '#6b4a2c', { y: 0, rz: 0.12 });
  cart(B, 3, -3, 0.3, 'barrels'); crates(B, 5.5, -1, 3, 0.4); sacks(B, 1.5, -5.5, 0.2);
  torch(B, -2, -4, 1.4, 0); torch(B, 2, 4, 1.4, Math.PI);
  B.spot('guard', -4, 4, Math.PI); B.spot('plaza', 0, 0, 0);
}
// a pier where the town meets its water, for its fishers and its boats (when the water is near)
function townPier(B, c) {
  if (c.rx === c.x && c.rz === c.z) return;
  const dx = c.rx - c.x, dz = c.rz - c.z, L = Math.hypot(dx, dz); if (L > 80) return;
  const ux = dx / L, uz = dz / L, r0 = WALLED.some(w => w.c === c) ? (c.set ? SET_R[c.kind] : 20) * 0.75 : 6;
  let found = -1; for (let s = r0; s < L + 12; s += 0.8) if (waterDepth(c.x + ux * s, c.z + uz * s) > 0.25) { found = s; break; }
  if (found < 0 || found < r0 + 3) return;
  pier(B, ux * (found - 2.2), uz * (found - 2.2), Math.atan2(ux, uz), 9, '#6a4a2c');
}
// ---------- building a settlement ----------
const TOWN_BUILD = { knights: townKnights, vikings: townVikings, mongols: townMongols, china: townChina, japan: townJapan, arabs: townArabs, egypt: townEgypt, mali: townMali, india: townIndia };
function civBuildCamp(c) {
  if (!HUNT.mat) HUNT.mat = new THREE.MeshLambertMaterial({ vertexColors: true });
  const B = new SB(c), braz = !c.bandit && (c.kind === 'city' || c.kind === 'castle' || c.kind === 'town');
  if (braz) { const H = hx(B, 0, 0, 0); H.cyl(0.18, 0.3, 0.9, 0, 0, 0, '#3a3634', 8); H.cyl(0.62, 0.38, 0.3, 0, 0.9, 0, '#2a2624', 12); H.glow(new THREE.CylinderGeometry(0.5, 0.5, 0.06, 12), 0, 1.16, 0, '#ff7a30'); B.solid(0, 0, 0.7); } else bFire(B);
  if (c.bandit) townBandits(B, c); else { (TOWN_BUILD[c.civ] || townKnights)(B, c, c.set); if (!B.spots.dock) townPier(B, c); }
  const m = B.mesh(); m.position.set(c.x, c.y, c.z); scene.add(m); c.mesh = m; c.obs = B.obs; c.spots = B.spots;
  const gm = B.glowMesh(); if (gm) { gm.position.set(c.x, c.y, c.z); scene.add(gm); c.glowMesh = gm; }
  if (c.civ === 'egypt' && c.cap) egyptPyramids(c);
  // the fire in the middle, like every camp's
  const fl = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.8, 7), new THREE.MeshBasicMaterial({ color: '#ffb347', transparent: true, opacity: 0.88, fog: true })); fl.userData.h = 0.8;
  c.fy = c.y + (braz ? 1.15 : 0); fl.position.set(c.x, c.fy + 0.4, c.z); scene.add(fl); c.flames = [fl];
}
// walking round a wall: inside to outside (or back) goes by the gate
function gateDetour(a, tx, tz) {
  for (const Wd of WALLED) {
    if (Math.abs(a.pos.x - Wd.x) > Wd.half + 40 || Math.abs(a.pos.z - Wd.z) > Wd.half + 40) continue;
    const cs = Math.cos(Wd.ang), sn = Math.sin(Wd.ang), loc = (x, z) => { const dx = x - Wd.x, dz = z - Wd.z; return [dx * cs - dz * sn, dx * sn + dz * cs]; };
    const [ax, az] = loc(a.pos.x, a.pos.z), [bx, bz] = loc(tx, tz), H = Wd.half;
    const aIn = Math.abs(ax) < H - 0.8 && Math.abs(az) < H - 0.8, bIn = Math.abs(bx) < H - 0.8 && Math.abs(bz) < H - 0.8;
    const gi = Wd.gin, go = Wd.gout;
    // in the gateway itself: through it to the far end first, then on
    if (Math.abs(ax) < 3.2 && az > H - 4 && az < H + 4) {
      if (!bIn && az < H + 3.4 && Math.hypot(a.pos.x - go.x, a.pos.z - go.z) > 1.4) return go;
      if (bIn && az > H - 3 && Math.hypot(a.pos.x - gi.x, a.pos.z - gi.z) > 1.4) return gi;
      continue;
    }
    if (aIn === bIn) continue;
    const atGate = Math.abs(ax) < 3 && az > H - 4.5;
    if (aIn) return atGate ? go : gi;
    return Math.hypot(a.pos.x - go.x, a.pos.z - go.z) < 2.5 || atGate ? gi : go;
  }
  return null;
}
