// ================= THE TOWN KIT: houses of every people, market stalls, carts, lamps, banners, docks and fields =================
// hx: the frame of one building. x, z its middle (town-local), rot the way its front faces (its door looks along +z
// turned by rot). Parts are placed in the building's own coordinates: lx to its right, ly up from its foot, lz forward.
function hx(B, x, z, rot, base) {
  const cs = Math.cos(rot), sn = Math.sin(rot), y0 = base ?? B.gy(x, z);
  const W = (lx, lz) => [x + lx * cs + lz * sn, z - lx * sn + lz * cs];
  const mat = (lx, ly, lz, r, s) => { const [wx, wz] = W(lx, lz); return new THREE.Matrix4().compose(new V3(wx, y0 + ly, wz), new THREE.Quaternion().setFromEuler(new THREE.Euler(r ? r[0] : 0, rot + (r ? r[1] : 0), r ? r[2] : 0, 'YXZ')), new V3(s ? s[0] : 1, s ? s[1] : 1, s ? s[2] : 1)); };
  return {
    W, y0, rot, x, z, mat,
    // a box standing on ly (its bottom), a box around a middle, a cylinder standing on ly, any shape
    box: (w, h, d, lx, ly, lz, c, r, jit) => B.add(new THREE.BoxGeometry(w, h, d), mat(lx, ly + h / 2, lz, r), c, jit),
    mid: (w, h, d, lx, ly, lz, c, r, jit) => B.add(new THREE.BoxGeometry(w, h, d), mat(lx, ly, lz, r), c, jit),
    cyl: (rt, rb, h, lx, ly, lz, c, seg, r, open) => B.add(new THREE.CylinderGeometry(rt, rb, h, seg || 10, 1, !!open), mat(lx, ly + h / 2, lz, r), c),
    geo: (g, lx, ly, lz, c, r, s, jit) => B.add(g, mat(lx, ly, lz, r, s), c, jit),
    glow: (g, lx, ly, lz, c, r, s) => B.glow(g, mat(lx, ly, lz, r, s), c),
    solid: (w, d, lx, lz) => { const [wx, wz] = W(lx || 0, lz || 0); B.solidBox(w, d, wx, wz, rot); },
    spot: (kind, lx, lz, a, o) => { const [wx, wz] = W(lx, lz); B.spot(kind, wx, wz, rot + (a || 0), o); }
  };
}
const shade = (c, k) => { const q = col(c); return k > 0 ? q.lerp(new THREE.Color(1, 1, 1), k) : q.multiplyScalar(1 + k); };
const GLOWC = '#ffc870';
// ---------- a house of a people ----------
// o: w, d, h (the walls), style, wall, roof, trim, door, shut (shutters), plinth, floors, chimney, rh (roof height)
function house(B, x, z, rot, o) {
  const st = o.style || 'plain', w = o.w, d = o.d, h = o.h, H = hx(B, x, z, rot, B.gy(x, z) - 0.3), R = mulberry32((Math.abs(x * 73 + z * 31) | 0) + 9);
  const wall = o.wall, trim = o.trim || '#3a2a1c', door = o.door || '#5a3a22', shut = o.shut;
  const base = o.plinth !== false;
  if (base) H.box(w + 0.18, 0.62, d + 0.18, 0, 0, 0, o.plinth || '#7a746a', null, 0.05);
  H.box(w, h + 0.3, d, 0, 0.02, 0, wall, null, 0.035);
  const top = h + 0.32;
  // the door, its frame and a step before it
  const dw = o.dw || 0.95, dh = o.dh || 1.85, arch = st === 'arab' || st === 'india' || st === 'stone';
  H.box(dw + 0.22, dh + 0.12, 0.08, 0, 0.3, d / 2 + 0.02, trim);
  H.box(dw, dh, 0.06, 0, 0.32, d / 2 + 0.06, door);
  if (arch) H.geo(new THREE.CylinderGeometry(dw / 2 + 0.11, dw / 2 + 0.11, 0.08, 12, 1, false, -Math.PI / 2, Math.PI), 0, 0.3 + dh, d / 2 + 0.02, trim, [Math.PI / 2, 0, 0]);
  H.box(dw + 0.5, 0.18, 0.5, 0, 0.12, d / 2 + 0.3, o.plinth || '#8a847a');
  H.spot('door', 0, d / 2 + 0.9, Math.PI);
  // windows: a frame, a pane that is lit at night, and shutters
  const win = (side, t, y, ww, wh) => {
    const fx = side === 'f' || side === 'b', L = fx ? w : d, s = side === 'f' || side === 'r' ? 1 : -1, off = (fx ? d : w) / 2 + 0.03;
    const lx = fx ? t * L : s * off, lz = fx ? s * off : t * L, ry = fx ? (s > 0 ? 0 : Math.PI) : (s > 0 ? Math.PI / 2 : -Math.PI / 2);
    const out = (k) => fx ? [lx, lz + s * k] : [lx + s * k, lz];
    const [ax, az] = out(0.01);
    H.mid(ww + 0.16, wh + 0.16, 0.06, ax, y, az, trim, [0, ry, 0]);
    const [gx, gz] = out(0.042); H.geo(new THREE.PlaneGeometry(ww, wh), gx, y, gz, '#283038', [0, ry, 0]);
    const [bx, bz] = out(0.052); H.glow(new THREE.PlaneGeometry(ww, wh), bx, y, bz, GLOWC, [0, ry, 0]);
    if (arch) { const [cx, cz] = out(0.04); H.glow(new THREE.CircleGeometry(ww / 2, 10, 0, Math.PI), cx, y + wh / 2, cz, GLOWC, [0, ry, 0]); }
    if (shut) for (const k of [-1, 1]) { const q = k * (ww / 2 + 0.17); const [sx, sz] = fx ? [lx + q * (s > 0 ? 1 : -1), lz + s * 0.06] : [lx + s * 0.06, lz + q * (s > 0 ? -1 : 1)]; H.mid(0.3, wh + 0.04, 0.04, sx, y, sz, shut, [0, ry, 0]); }
    if (o.box && side === 'f' && y < 2.5) { const [qx, qz] = out(0.16); H.mid(ww + 0.2, 0.16, 0.22, qx, y - wh / 2 - 0.1, qz, '#6a4a2c', [0, ry, 0]); for (let k = 0; k < 4; k++) { const [fx2, fz2] = fx ? [lx - ww / 2 + 0.1 + k * (ww - 0.2) / 3, qz] : [qx, lz - ww / 2 + 0.1 + k * (ww - 0.2) / 3]; H.geo(new THREE.SphereGeometry(0.09, 6, 5), fx2, y - wh / 2 + 0.04, fz2, ['#d8302a', '#e8b030', '#e070a0', '#f2efe6'][(k + (R() * 4 | 0)) % 4]); } }
  };
  const floors = o.floors || (h > 4.2 ? 2 : 1), ww = o.ww || 0.62, wh = o.wh || 0.72;
  if (!o.noWin) for (let f = 0; f < floors; f++) {
    const y = 0.3 + (f + 0.6) * (h / floors);
    const nF = Math.max(1, Math.floor(w / 2.2)), nS = Math.max(1, Math.floor(d / 2.4));
    for (let k = 0; k < nF; k++) { const t = (k + 0.5) / nF - 0.5; if (f === 0 && Math.abs(t * w) < dw / 2 + 0.55) continue; win('f', t, y, ww, wh); }
    if (o.backWin !== false) for (let k = 0; k < nF; k++) win('b', (k + 0.5) / nF - 0.5, y, ww, wh);
    for (let k = 0; k < nS; k++) { win('l', (k + 0.5) / nS - 0.5, y, ww, wh); win('r', (k + 0.5) / nS - 0.5, y, ww, wh); }
  }
  // timber frames: posts at the corners, beams at each floor, braces across the wall
  if (st === 'tudor') {
    const t = 0.13, ys = [0.32, top - 0.1]; for (let f = 1; f < floors; f++) ys.push(0.3 + f * h / floors);
    for (const [cx, cz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) H.box(t, h, t, cx * (w / 2 + 0.01), 0.3, cz * (d / 2 + 0.01), trim);
    for (const y of ys) { H.mid(w + 0.06, t, 0.05, 0, y, d / 2 + 0.03, trim); H.mid(w + 0.06, t, 0.05, 0, y, -d / 2 - 0.03, trim); H.mid(0.05, t, d + 0.06, w / 2 + 0.03, y, 0, trim); H.mid(0.05, t, d + 0.06, -w / 2 - 0.03, y, 0, trim); }
    const fh = h / floors, L = Math.hypot(w / 2 - 0.4, fh), an = Math.atan2(fh, w / 2 - 0.4);
    for (let f = 0; f < floors; f++) for (const s of [-1, 1]) for (const zz of [d / 2 + 0.035, -d / 2 - 0.035]) H.mid(L, 0.1, 0.04, s * (w / 4 + 0.1), 0.3 + fh * (f + 0.5), zz, trim, [0, 0, s * an * (zz > 0 ? 1 : -1)]);
  }
  // the roof
  const rh = o.rh || Math.min(w, d) * 0.55, rt = o.roof;
  if (st === 'arab' || st === 'egypt' || st === 'mali' || st === 'india' || o.flat) {
    H.box(w + 0.1, 0.22, d + 0.1, 0, top, 0, shade(wall, -0.08));
    for (const [px, pz, pw, pd] of [[0, d / 2, w + 0.1, 0.14], [0, -d / 2, w + 0.1, 0.14], [w / 2, 0, 0.14, d + 0.1], [-w / 2, 0, 0.14, d + 0.1]]) H.box(pw, 0.42, pd, px, top + 0.2, pz, wall);
    if (st === 'mali') { for (const [cx, cz] of [[-1, -1], [1, -1], [1, 1], [-1, 1], [0, 1], [0, -1]]) H.geo(new THREE.ConeGeometry(0.16, 0.7, 6), cx * w / 2, top + 0.9, cz * d / 2, wall); for (let k = 0; k < Math.floor(w / 0.9); k++) for (const zz of [d / 2 + 0.2, -d / 2 - 0.2]) H.mid(0.08, 0.08, 0.5, -w / 2 + 0.45 + k * 0.9, top - 0.6, zz, '#6a4a2a'); }
    if (st === 'arab' && R() < 0.4) H.geo(new THREE.SphereGeometry(Math.min(w, d) * 0.32, 14, 8, 0, TAU, 0, Math.PI / 2), 0, top + 0.2, 0, o.dome || '#f2ece0');
    if (st === 'egypt') { for (const [cx, cz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) H.box(0.1, 1.4, 0.1, cx * (w / 2 - 0.5), top + 0.2, cz * (d / 2 - 0.5), '#6a4a2a'); H.box(w - 0.6, 0.08, d - 0.6, 0, top + 1.6, 0, '#b8a070'); for (let k = 0; k < 4; k++) H.box(0.7, 0.25, 0.6, w / 2 + 0.36, 0.3 + k * (top / 4), -d / 2 + 0.4 + k * 0.6, wall); }
    if (st === 'india' && R() < 0.5) { const cx = w / 2 - 0.8, cz = -d / 2 + 0.8; for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) H.box(0.08, 0.9, 0.08, cx + a * 0.4, top + 0.2, cz + b * 0.4, wall); H.geo(new THREE.SphereGeometry(0.62, 12, 8, 0, TAU, 0, Math.PI / 2), cx, top + 1.1, cz, shade(wall, 0.25)); }
    if (st === 'arab' && floors > 1) H.box(1.2, 1.1, 0.5, w * 0.25, 0.3 + h * 0.62, d / 2 + 0.25, '#6a4a2c');
  } else if (st === 'china' || st === 'japan') {
    // a hip roof with long eaves, its corners turned up, a ridge with ends
    const ov = st === 'china' ? 0.8 : 0.7, g = new THREE.ConeGeometry(Math.SQRT1_2, 1, 4); g.rotateY(Math.PI / 4);
    H.geo(g, 0, top + rh / 2, 0, rt, null, [w + ov * 2, rh, d + ov * 2]);
    H.mid(w * 0.55, 0.16, 0.16, 0, top + rh * 0.86, 0, shade(rt, -0.25));
    for (const s of [-1, 1]) H.geo(new THREE.ConeGeometry(0.1, 0.36, 4), s * w * 0.28, top + rh * 0.95, 0, shade(rt, -0.3), [0, 0, -s * 0.5]);
    for (const [cx, cz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) H.geo(new THREE.ConeGeometry(0.09, 0.6, 4), cx * (w / 2 + ov - 0.05), top + 0.12, cz * (d / 2 + ov - 0.05), rt, [cz * 0.9, 0, -cx * 0.9]);
    if (st === 'china') for (const s of [-1, 1]) H.cyl(0.14, 0.14, h + 0.05, s * (w / 2 - 0.25), 0.3, d / 2 + 0.55, '#a8302a', 8);
    if (st === 'japan') { H.box(w + 0.6, 0.18, 1.0, 0, 0.45, d / 2 + 0.5, '#7a5a3a'); for (let k = 0; k <= Math.floor(w / 0.6); k++) H.mid(0.04, h * 0.9, 0.04, -w / 2 + k * (w / Math.floor(w / 0.6)), 0.3 + h * 0.5, d / 2 + 0.035, '#3a2a1c'); H.mid(w, 0.05, 0.05, 0, 0.3 + h * 0.62, d / 2 + 0.035, '#3a2a1c'); }
  } else if (st === 'viking') {
    // low walls of planks, a steep roof of turf along the house, the door in the gable, crossed boards at the ridge's ends
    const ov = 0.5, g = prismGeo(1, 1, 1); g.rotateY(Math.PI / 2);
    H.geo(g, 0, top - 0.05, 0, rt, null, [w + ov * 2, rh, d + ov * 2], 0.05);
    for (const s of [-1, 1]) {
      const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute([-w / 2, 0, 0, w / 2, 0, 0, 0, rh - 0.1, 0], 3)); gg.computeVertexNormals();
      H.geo(gg, 0, top - 0.05, s * (d / 2 + 0.02), wall, [0, s > 0 ? 0 : Math.PI, 0]);
      for (let k = 0; k < Math.floor(w / 0.45); k++) { const lx = -w / 2 + 0.25 + k * 0.45, hh = h + 0.3 + (rh - 0.1) * (1 - Math.abs(lx) / (w / 2)); H.mid(0.035, hh, 0.02, lx, hh / 2, s * (d / 2 + 0.04), shade(wall, -0.18)); }
      for (const k of [-1, 1]) H.mid(0.11, 1.4, 0.07, k * 0.28, top + rh + 0.15, s * (d / 2 + ov + 0.02), '#4a3020', [0, 0, k * 0.65]);
    }
    for (const s of [-1, 1]) for (let k = 0; k < Math.floor(d / 0.45); k++) H.mid(0.02, h, 0.035, s * (w / 2 + 0.03), 0.3 + h / 2, -d / 2 + 0.25 + k * 0.45, shade(wall, -0.18));
  } else {
    const ov = 0.4, g = st === 'hip' ? (() => { const q = new THREE.ConeGeometry(Math.SQRT1_2, 1, 4); q.rotateY(Math.PI / 4); return q; })() : prismGeo(1, 1, 1);
    if (st === 'hip') H.geo(g, 0, top + rh / 2, 0, rt, null, [w + ov * 2, rh, d + ov * 2], 0.04);
    else { H.geo(g, 0, top - 0.02, 0, rt, null, [w + ov * 2, rh, d + ov * 2], 0.04); H.mid(w + ov * 2 + 0.1, 0.12, 0.12, 0, top + rh - 0.02, 0, shade(rt, -0.3)); }
    if (o.chimney !== false && (st === 'tudor' || st === 'stone' || st === 'plain')) { const cx = (R() < 0.5 ? -1 : 1) * w * 0.3; H.box(0.55, rh + 0.9, 0.55, cx, top + 0.1, -d * 0.12, o.chimC || '#8a7a6a', null, 0.05); H.box(0.7, 0.14, 0.7, cx, top + rh + 1.0, -d * 0.12, '#6a5a4a'); B.chim = (B.chim || []); B.chim.push(H.W(cx, -d * 0.12).concat(H.y0 + top + rh + 1.2)); }
  }
  H.solid(w + 0.2, d + 0.2);
  return H;
}
// ---------- the things of a street and a market ----------
function stall(B, x, z, rot, cols, goods) {
  const H = hx(B, x, z, rot), a = cols[0], b = cols[1] || '#f2efe6';
  H.box(2.2, 0.85, 0.75, 0, 0, 0.35, '#7a5a3a');
  H.box(2.3, 0.06, 0.85, 0, 0.85, 0.35, '#8a6a4a');
  for (const [px, pz] of [[-1.1, 0.75], [1.1, 0.75], [-1.1, -0.85], [1.1, -0.85]]) H.box(0.08, pz > 0 ? 2.1 : 2.45, 0.08, px, 0, pz, '#5a3a22');
  // a striped awning sloping to the front
  for (let k = 0; k < 6; k++) H.mid(2.5 / 6, 0.04, 1.9, -1.25 + (k + 0.5) * 2.5 / 6, 2.3, -0.05, k % 2 ? a : b, [-0.17, 0, 0]);
  for (let k = 0; k < 6; k++) H.mid(2.5 / 6, 0.22, 0.03, -1.25 + (k + 0.5) * 2.5 / 6, 2.04, 0.9, k % 2 ? a : b);
  const G = goods || 'fruit';
  for (let k = 0; k < 5; k++) {
    const gx = -0.85 + k * 0.42;
    if (G === 'fruit') { H.cyl(0.18, 0.14, 0.12, gx, 0.9, 0.35, '#a8834a', 10); for (let q = 0; q < 3; q++) H.geo(new THREE.SphereGeometry(0.07, 7, 5), gx + (q - 1) * 0.07, 1.04, 0.35 + (q % 2) * 0.05, ['#c8302a', '#e8a020', '#7ab030', '#e0c040', '#8a2a5a'][(k + q) % 5]); }
    else if (G === 'cloth') H.geo(new THREE.CylinderGeometry(0.09, 0.09, 0.62, 10), gx, 0.98, 0.35, ['#a8302a', '#2a4a8a', '#d8a020', '#2a7a5a', '#7a2a6a'][k], [Math.PI / 2, 0, 0]);
    else if (G === 'pots') { H.geo(new THREE.SphereGeometry(0.14, 10, 8), gx, 1.02, 0.35, ['#b0603a', '#8a4a2a', '#c87a4a'][k % 3], null, [1, 1.2, 1]); H.cyl(0.05, 0.07, 0.1, gx, 1.16, 0.35, '#b0603a', 8); }
    else if (G === 'spice') H.geo(new THREE.ConeGeometry(0.16, 0.22, 10), gx, 1.0, 0.35, ['#d8a020', '#c8302a', '#8a5a2a', '#e8c040', '#5a8a2a'][k]);
    else if (G === 'fish') H.geo(new THREE.SphereGeometry(0.06, 6, 5), gx, 0.93, 0.35, '#9aa4ae', [0, 0.3, 0], [3, 1, 1]);
    else if (G === 'bread') H.geo(new THREE.SphereGeometry(0.11, 8, 6), gx, 0.94, 0.35, '#c89050', null, [1.4, 0.7, 1]);
    else if (G === 'meat') H.geo(new THREE.SphereGeometry(0.1, 8, 6), gx, 1.6, 0.6, '#9a3a2a', null, [0.8, 1.4, 0.8]);
  }
  H.box(0.5, 0.4, 0.4, 0.6, 0, -0.45, '#8a6a42'); H.geo(new THREE.SphereGeometry(0.22, 8, 6), -0.6, 0.2, -0.5, '#c8b080', null, [1, 0.8, 1]);
  H.spot('market', 0, -0.45, 0);
  H.solid(2.3, 1.0, 0, 0.3);
  return H;
}
function cart(B, x, z, rot, load) {
  const H = hx(B, x, z, rot);
  H.box(1.3, 0.12, 2.0, 0, 0.62, 0, '#7a5a3a');
  for (const s of [-1, 1]) H.box(0.06, 0.38, 2.0, s * 0.62, 0.74, 0, '#6a4a2c');
  for (const s of [-1, 1]) { H.geo(new THREE.TorusGeometry(0.5, 0.05, 6, 16), s * 0.74, 0.52, -0.1, '#4a3020', [0, Math.PI / 2, 0]); for (let k = 0; k < 4; k++) H.mid(0.04, 0.96, 0.04, s * 0.74, 0.52, -0.1, '#5a3a22', [k * Math.PI / 4, 0, 0]); }
  for (const s of [-1, 1]) H.mid(0.07, 0.07, 2.0, s * 0.35, 0.55, 1.75, '#6a4a2c', [0.18, 0, 0]);
  if (load === 'hay') H.geo(new THREE.SphereGeometry(1, 12, 8), 0, 1.0, 0, '#d8c070', null, [0.62, 0.45, 0.95]);
  else if (load === 'barrels') for (let k = 0; k < 3; k++) H.cyl(0.25, 0.25, 0.55, (k - 1) * 0.4, 0.68, (k % 2) * 0.3 - 0.2, '#7a5634', 10);
  else for (let k = 0; k < 4; k++) H.geo(new THREE.SphereGeometry(0.24, 8, 6), (k % 2 - 0.5) * 0.5, 0.85, (k > 1 ? 0.4 : -0.3), '#c8b080', null, [1, 0.8, 1.2]);
  H.solid(1.4, 2.2);
}
function barrels(B, x, z, n, rot) { const H = hx(B, x, z, rot || 0); for (let k = 0; k < n; k++) { const bx = (k % 3) * 0.62 - 0.6, bz = Math.floor(k / 3) * 0.62; H.cyl(0.27, 0.27, 0.78, bx, 0, bz, '#7a5634', 12); for (const y of [0.12, 0.62]) H.cyl(0.285, 0.285, 0.05, bx, y, bz, '#3a3a3a', 12); } H.solid(1.9, 1.3); }
function crates(B, x, z, n, rot) { const H = hx(B, x, z, rot || 0); for (let k = 0; k < n; k++) H.box(0.6, 0.55, 0.6, (k % 2) * 0.65 - 0.3, k > 1 ? 0.55 : 0, Math.floor(k / 2) % 2 * 0.1, k % 2 ? '#8a6a42' : '#9a7a50', [0, k * 0.2, 0], 0.05); H.solid(1.4, 0.9); }
function sacks(B, x, z, rot) { const H = hx(B, x, z, rot || 0); for (let k = 0; k < 5; k++) H.geo(new THREE.SphereGeometry(0.28, 9, 7), (k % 3) * 0.48 - 0.48, 0.24 + (k > 2 ? 0.38 : 0), (k > 2 ? 0.1 : 0), '#c8b088', null, [1, 1.1, 0.8]); }
function hay(B, x, z, n, rot) { const H = hx(B, x, z, rot || 0); for (let k = 0; k < n; k++) H.geo(new THREE.CylinderGeometry(0.55, 0.55, 1.1, 12), (k % 3) * 1.15 - 1.15, 0.55 + (k > 2 ? 1.0 : 0), 0, '#d8c070', [0, 0, Math.PI / 2], null, 0.04); H.solid(3.4, 1.2); }
function woodpile(B, x, z, rot) { const H = hx(B, x, z, rot || 0); for (let r = 0; r < 4; r++) for (let k = 0; k < 6 - r; k++) H.geo(new THREE.CylinderGeometry(0.14, 0.14, 1.4, 7), (k - (5 - r) / 2) * 0.29, 0.14 + r * 0.25, 0, '#6a4a2c', [Math.PI / 2, 0, 0], null, 0.06); H.solid(1.9, 1.5); }
function lamp(B, x, z, color) { const H = hx(B, x, z, 0); H.cyl(0.07, 0.09, 2.6, 0, 0, 0, '#3a2a20', 6); H.box(0.28, 0.36, 0.28, 0, 2.55, 0, '#2a2a2a'); H.glow(new THREE.BoxGeometry(0.22, 0.26, 0.22), 0, 2.73, 0, color || GLOWC); H.geo(new THREE.ConeGeometry(0.24, 0.2, 4), 0, 3.0, 0, '#2a2a2a', [0, Math.PI / 4, 0]); B.solid(x, z, 0.25); }
function torch(B, x, z, y, rot) { const H = hx(B, x, z, rot, B.gy(x, z)); H.mid(0.06, 0.5, 0.06, 0, y, 0.12, '#3a2a20', [0.5, 0, 0]); H.glow(new THREE.ConeGeometry(0.09, 0.28, 6), 0, y + 0.36, 0.26, '#ffa040'); }
function banner(B, x, z, rot, color, h) { const H = hx(B, x, z, rot); h = h || 4; H.cyl(0.06, 0.07, h, 0, 0, 0, '#4a3a2a', 6); H.mid(0.9, 0.06, 0.06, 0, h - 0.1, 0.05, '#4a3a2a'); H.mid(0.8, 1.6, 0.03, 0, h - 1.0, 0.08, color); H.geo(new THREE.ConeGeometry(0.4, 0.5, 3), 0, h - 2.05, 0.08, color, [Math.PI, Math.PI / 2, 0], [1, 1, 0.05]); }
function bench(B, x, z, rot) { const H = hx(B, x, z, rot); H.box(1.6, 0.08, 0.4, 0, 0.42, 0, '#7a5a3a'); for (const s of [-1, 1]) H.box(0.1, 0.42, 0.36, s * 0.65, 0, 0, '#5a3a22'); H.spot('bench', 0, 0.35, 0); }
function trough(B, x, z, rot) { const H = hx(B, x, z, rot); H.box(2.2, 0.55, 0.7, 0, 0, 0, '#6a4a2c'); H.glow(new THREE.PlaneGeometry(2.0, 0.5), 0, 0.5, 0, '#3a6a8a', [-Math.PI / 2, 0, 0]); H.solid(2.2, 0.8); }
function forge(B, x, z, rot) {
  // a smithy: a hearth under a hood with a chimney, glowing coals, an anvil on a stump, tools on the wall
  const H = hx(B, x, z, rot);
  H.box(1.6, 0.9, 1.2, 0, 0, -0.9, '#6a625a', null, 0.06); H.glow(new THREE.BoxGeometry(1.1, 0.12, 0.8), 0, 0.95, -0.9, '#ff6a20');
  H.geo(new THREE.ConeGeometry(1.05, 0.9, 4), 0, 2.2, -0.9, '#5a524a', [0, Math.PI / 4, 0]); H.box(0.5, 2.4, 0.5, 0, 2.4, -0.95, '#6a625a');
  H.cyl(0.25, 0.3, 0.55, 0.3, 0, 0.6, '#5a3a22', 9); H.box(0.6, 0.2, 0.22, 0.3, 0.55, 0.6, '#3a3a40'); H.geo(new THREE.ConeGeometry(0.1, 0.3, 4), 0.68, 0.65, 0.6, '#3a3a40', [0, 0, -Math.PI / 2]);
  for (const s of [-1, 1]) H.box(0.12, 2.6, 0.12, s * 1.6, 0, 1.0, '#5a3a22');
  H.box(3.6, 0.1, 2.9, 0, 2.6, -0.4, '#7a5a3a', [0.12, 0, 0]);
  H.spot('forge', 0.3, 1.25, Math.PI); H.solid(1.7, 1.3, 0, -0.9);
}
function well2(B, x, z) { bWell(B, x, z); const H = hx(B, x, z, 0); for (let k = 0; k < 3; k++) { const a = k / 3 * TAU + 0.5; H.spot('well', Math.sin(a) * 1.6, Math.cos(a) * 1.6, a + Math.PI); } }
function laundry(B, x, z, rot) { const H = hx(B, x, z, rot); for (const s of [-1, 1]) H.cyl(0.05, 0.06, 2.2, s * 1.8, 0, 0, '#5a3a22', 6); H.mid(3.6, 0.02, 0.02, 0, 2.1, 0, '#d8d0c0'); for (let k = 0; k < 5; k++) H.mid(0.5, 0.65 + (k % 2) * 0.2, 0.02, -1.3 + k * 0.62, 1.72 - (k % 2) * 0.1, 0, ['#f2efe6', '#4a6a9a', '#c8302a', '#e8d8a0', '#6a8a4a'][k]); }
function anvilYard(B, x, z, rot) { forge(B, x, z, rot); }
// trees inside the towns (nothing grows there on its own): a palm, a cypress, a round tree, a cherry in blossom
function townTree(B, x, z, kind, s) {
  const H = hx(B, x, z, (x * 3.7 + z) % TAU); s = s || 1;
  if (kind === 'palm') {
    for (let k = 0; k < 6; k++) H.cyl(0.2 * s - k * 0.012, 0.22 * s - k * 0.012, 1.1 * s, Math.sin(k * 0.5) * 0.12, k * 1.05 * s, 0, k % 2 ? '#7a6040' : '#8a7050', 7);
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; H.mid(0.5 * s, 0.05, 2.6 * s, Math.sin(a) * 1.1 * s, 6.4 * s, Math.cos(a) * 1.1 * s, k % 2 ? '#3a6a2a' : '#4a7a30', [0.45, a, 0]); }
    H.geo(new THREE.SphereGeometry(0.3 * s, 8, 6), 0, 6.35 * s, 0, '#6a4a20');
  } else if (kind === 'cypress') { H.cyl(0.12, 0.16, 1.2 * s, 0, 0, 0, '#5a3a22', 6); H.geo(new THREE.SphereGeometry(0.75 * s, 10, 8), 0, 3.4 * s, 0, '#2a4a2a', null, [1, 3.0, 1], 0.05); }
  else if (kind === 'cherry') { H.cyl(0.14, 0.2, 2.0 * s, 0, 0, 0, '#4a3020', 7); for (let k = 0; k < 5; k++) { const a = k * 1.3; H.geo(new THREE.SphereGeometry(0.9 * s, 10, 8), Math.sin(a) * 0.8 * s, 2.6 * s + (k % 2) * 0.5, Math.cos(a) * 0.8 * s, k % 2 ? '#f0b8cc' : '#e8a0b8', null, null, 0.05); } }
  else if (kind === 'bamboo') { for (let k = 0; k < 9; k++) { const a = k * 2.4, r = 0.3 + (k % 3) * 0.2; H.cyl(0.05, 0.06, 4 + (k % 4) * 0.8, Math.sin(a) * r, 0, Math.cos(a) * r, '#6a9a3a', 6); H.geo(new THREE.SphereGeometry(0.45, 7, 5), Math.sin(a) * r, 4.2 + (k % 4) * 0.8, Math.cos(a) * r, '#5a8a2a', null, [1, 0.6, 1]); } }
  else { H.cyl(0.18, 0.25, 2.2 * s, 0, 0, 0, '#5a3a22', 7); H.geo(new THREE.SphereGeometry(1.4 * s, 10, 8), 0, 3.4 * s, 0, kind === 'olive' ? '#6a7a4a' : '#3a6a2a', null, [1, 0.85, 1], 0.06); }
  B.solid(x, z, 0.4);
}
// a plaza of flagstones or packed earth (a thin skin over the ground)
function plaza(B, x, z, r, color, square) {
  const n = square ? 1 : 0, H = hx(B, x, z, 0);
  if (square) H.box(r * 2, 0.08, r * 2, 0, 0.0, 0, color, null, 0.02);
  else H.cyl(r, r, 0.08, 0, 0.0, 0, color, 24);
  H.spot('plaza', 0, 0, 0); return n;
}
// a pier of planks on posts, out over the water, with a boat tied to it
function pier(B, x, z, rot, L, boat) {
  const H = hx(B, x, z, rot, Math.max(B.gy(x, z) + 0.3, -B.c.y + 0.35));
  H.box(1.8, 0.14, L, 0, 0.35, L / 2, '#7a5a3a', null, 0.04);
  for (let k = 0; k <= L / 2; k++) for (const s of [-1, 1]) H.cyl(0.1, 0.1, 2.4, s * 0.85, -2, k * 2, '#5a3a22', 6);
  H.spot('dock', 0.4, L - 0.6, 0); H.spot('dock', -0.4, L * 0.6, Math.PI / 2);
  if (boat) { const g = new THREE.SphereGeometry(1, 14, 6, 0, TAU, Math.PI / 2, Math.PI / 2); H.geo(g, 1.9, 0.25, L * 0.65, boat, null, [0.75, 0.55, 2.4]); H.mid(1.2, 0.05, 0.25, 1.9, 0.3, L * 0.65, '#6a4a2c'); }
}
// fields: rows of a crop on brown earth (wheat, vines, rice in water, vegetables)
function field2(B, x, z, w, d, rot, kind) {
  if (roadHits(B.c.x + x, B.c.z + z, Math.max(w, d) * 0.6)) return;
  const H = hx(B, x, z, rot, B.gy(x, z) + 0.02), n = Math.floor(w / 1.1);
  if (kind === 'rice') H.glow(new THREE.PlaneGeometry(w, d), 0, 0.06, 0, '#5a8a8a', [-Math.PI / 2, 0, 0]);
  H.box(w, 0.08, d, 0, 0, 0, kind === 'rice' ? '#4a6a5a' : '#6a5032');
  for (let k = 0; k < n; k++) {
    const t = (k + 0.5) / n * w - w / 2;
    if (kind === 'wheat') H.box(0.42, 0.75, d * 0.94, t, 0.06, 0, k % 2 ? '#d8b850' : '#c8a840', null, 0.05);
    else if (kind === 'vines') { H.box(0.3, 1.1, d * 0.92, t, 0.06, 0, '#4a7a2a', null, 0.06); for (let q = 0; q <= 3; q++) H.box(0.06, 1.3, 0.06, t, 0.06, -d * 0.46 + q * d * 0.31, '#5a3a22'); }
    else if (kind === 'rice') for (let q = 0; q < Math.floor(d / 0.8); q++) H.geo(new THREE.ConeGeometry(0.16, 0.5, 5), t, 0.3, -d / 2 + 0.4 + q * 0.8, '#7ab040');
    else if (kind === 'veg') for (let q = 0; q < Math.floor(d / 0.7); q++) H.geo(new THREE.SphereGeometry(0.2, 7, 5), t, 0.2, -d / 2 + 0.35 + q * 0.7, q % 3 ? '#4a8a2a' : '#6a9a3a', null, [1, 0.7, 1]);
    else if (kind === 'millet') H.box(0.38, 1.4, d * 0.94, t, 0.06, 0, '#b8a050', null, 0.06);
    else H.box(0.35, 0.3, d * 0.95, t, 0.06, 0, '#7a9a3a');
  }
  for (let k = 0; k < 3; k++) H.spot('field', (k - 1) * w * 0.3, (k % 2 ? 0.2 : -0.2) * d, rot);
}
