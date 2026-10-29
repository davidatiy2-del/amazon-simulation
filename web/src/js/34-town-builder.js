// ---------- the houses, castles, temples and towers of the Old World's peoples ----------
// A light builder: positions, normals and colours only, merged into one mesh per settlement.
function prismGeo(w, d, h) {
  const x0 = -w / 2, x1 = w / 2, z0 = -d / 2, z1 = d / 2;
  const A = [x0, 0, z0], B = [x0, 0, z1], C = [x0, h, 0], D = [x1, 0, z0], E = [x1, 0, z1], F = [x1, h, 0];
  const T = [A, B, C, D, F, E, A, C, F, A, F, D, B, E, F, B, F, C, A, D, E, A, E, B];
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(T.flat(), 3)); g.computeVertexNormals(); return g;
}
// The parts keep their shared corners (an index). Window panes and lamps go into a second, unlit shape that glows at
// night (glow). Places where people work, sell, pray or stand guard are kept as spots (spot) for the town's life.
class SB {
  constructor(c) { this.c = c; this.pos = []; this.nor = []; this.col = []; this.idx = []; this.obs = []; this.gp = []; this.gc = []; this.gi = []; this.spots = {}; }
  gy(lx, lz) { return getH(this.c.x + lx, this.c.z + lz) - this.c.y; }
  add(geo, m, color, jit) { this._put(geo, m, color, jit, this.pos, this.nor, this.col, this.idx); }
  glow(geo, m, color) { this._put(geo, m, color, 0, this.gp, null, this.gc, this.gi); }
  _put(geo, m, color, jit, PO, NO, CO, IX) {
    const P = geo.attributes.position.array, N = geo.attributes.normal.array, cc = typeof color === 'string' ? col(color) : color, b0 = PO.length / 3;
    const j = jit ? (rng() - 0.5) * jit : 0;
    if (m) _rnm.getNormalMatrix(m);
    for (let i = 0; i < P.length; i += 3) {
      _rv.set(P[i], P[i + 1], P[i + 2]); if (m) _rv.applyMatrix4(m); PO.push(_rv.x, _rv.y, _rv.z);
      if (NO) { _rn.set(N[i], N[i + 1], N[i + 2]); if (m) _rn.applyMatrix3(_rnm).normalize(); NO.push(_rn.x, _rn.y, _rn.z); }
      CO.push(clamp(cc.r + j, 0, 1), clamp(cc.g + j, 0, 1), clamp(cc.b + j, 0, 1));
    }
    const I = geo.index;
    if (I) for (let i = 0; i < I.count; i++) IX.push(b0 + I.array[i]); else for (let i = 0, n = P.length / 3; i < n; i++) IX.push(b0 + i);
    geo.dispose();
  }
  // a place in the town (local coordinates) where someone has something to do, facing `a` (an angle in the world)
  spot(kind, lx, lz, a, o) { (this.spots[kind] || (this.spots[kind] = [])).push(Object.assign({ x: this.c.x + lx, z: this.c.z + lz, a: a || 0 }, o || {})); }
  at(x, z, o) { return (o && o.y || 0) + (o && o.free ? 0 : this.gy(x, z)); }
  // a box standing on the ground at (x, z) (o.y lifts it)
  box(w, h, d, x, z, color, o) { o = o || {}; this.add(new THREE.BoxGeometry(w, h, d), M([x, this.at(x, z, o) + h / 2, z], [o.rx || 0, o.ry || 0, o.rz || 0]), color, o.jit); if (o.solid) this.solidBox(w, d, x, z, o.ry || 0); }
  cyl(rt, rb, h, x, z, color, o) { o = o || {}; this.add(new THREE.CylinderGeometry(rt, rb, h, o.seg || 12, 1, !!o.open), M([x, this.at(x, z, o) + h / 2, z], [o.rx || 0, o.ry || 0, o.rz || 0]), color, o.jit); if (o.solid) this.solid(x, z, Math.max(rt, rb) + 0.15); }
  cone(r, h, x, z, color, o) { o = o || {}; this.add(new THREE.ConeGeometry(r, h, o.seg || 12), M([x, this.at(x, z, o) + h / 2, z], [0, o.ry || 0, 0], o.s), color); }
  ball(r, x, z, color, o) { o = o || {}; this.add(new THREE.SphereGeometry(r, o.seg || 14, o.segv || 10, 0, TAU, 0, o.half ? Math.PI / 2 : Math.PI), M([x, this.at(x, z, o), z], null, o.s), color); }
  // a roof like a tent's ridge: a prism, its ridge along the house's length (w), turned by ry
  roof(w, d, h, x, z, color, o) { o = o || {}; this.add(prismGeo(w, d, h), M([x, this.at(x, z, o), z], [0, o.ry || 0, 0]), color); }
  // obstacles: nothing walks through walls and houses
  solid(x, z, r) { const wx = this.c.x + x, wz = this.c.z + z, k = g10(wx, wz); (TRUNKS.g[k] || (TRUNKS.g[k] = [])).push(wx, wz, r); this.obs.push([k, wx, wz]); }
  solidBox(w, d, x, z, ry) {
    const cs = Math.cos(ry), sn = Math.sin(ry), r = Math.min(w, d) / 2, L = Math.max(w, d) - 2 * r, n = Math.max(1, Math.ceil(L / Math.max(1, r)));
    for (let k = 0; k <= n; k++) { const t = (k / n - 0.5) * L, lx = w >= d ? t : 0, lz = w >= d ? 0 : t; this.solid(x + lx * cs + lz * sn, z - lx * sn + lz * cs, r * 1.02); }
  }
  solidLine(x0, z0, x1, z1, r) { const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / (r * 1.3))); for (let k = 0; k <= n; k++) this.solid(lerp(x0, x1, k / n), lerp(z0, z1, k / n), r); }
  mesh() {
    const g = new THREE.BufferGeometry(), nb = new Int8Array(this.nor.length), cb = new Uint8Array(this.col.length), nv = this.pos.length / 3;
    for (let i = 0; i < nb.length; i++) nb[i] = Math.round(clamp(this.nor[i], -1, 1) * 127);
    for (let i = 0; i < cb.length; i++) cb[i] = Math.round(clamp(this.col[i], 0, 1) * 255);
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nb, 3, true)); g.setAttribute('color', new THREE.BufferAttribute(cb, 3, true));
    g.setIndex(nv > 65535 ? new THREE.Uint32BufferAttribute(this.idx, 1) : new THREE.Uint16BufferAttribute(this.idx, 1));
    g.computeBoundingSphere(); freeAfterUpload(g);
    if (!HUNT.mat) HUNT.mat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const m = new THREE.Mesh(g, this.c && (this.c.civ || this.c.bandit) ? townMat() : HUNT.mat); m.castShadow = true; m.receiveShadow = true;
    return m;
  }
  // the lit windows and lamps: one shape for the whole town, its colour turned up at night (townGlow)
  glowMesh() {
    if (!this.gp.length) return null;
    const g = new THREE.BufferGeometry(), cb = new Uint8Array(this.gc.length), nv = this.gp.length / 3;
    for (let i = 0; i < cb.length; i++) cb[i] = Math.round(clamp(this.gc[i], 0, 1) * 255);
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.gp, 3)); g.setAttribute('color', new THREE.BufferAttribute(cb, 3, true));
    g.setIndex(nv > 65535 ? new THREE.Uint32BufferAttribute(this.gi, 1) : new THREE.Uint16BufferAttribute(this.gi, 1));
    g.computeBoundingSphere(); freeAfterUpload(g);
    if (!TGLOW.mat) TGLOW.mat = new THREE.MeshBasicMaterial({ vertexColors: true, color: new THREE.Color(0, 0, 0) });
    const m = new THREE.Mesh(g, TGLOW.mat); m.visible = TGLOW.k > 0.03; return m;
  }
}
const TGLOW = { mat: null, k: -1 };
// the towns' surfaces: stone laid in courses, roofs in rows of tiles or thatch, flagstones underfoot, some dirt on all
// (worked out from where each point is and which way it faces, so the shapes need no textures)
let TOWNMAT = null;
function townMat() {
  if (TOWNMAT) return TOWNMAT;
  const m = new THREE.MeshLambertMaterial({ vertexColors: true });
  m.onBeforeCompile = sh => {
    sh.vertexShader = 'varying vec3 vWP;\nvarying vec3 vWN;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvWP = (modelMatrix * vec4(position, 1.0)).xyz; vWN = normalize(mat3(modelMatrix) * normal);');
    sh.fragmentShader = 'varying vec3 vWP;\nvarying vec3 vWN;\nfloat th(vec3 p){ p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }\n' +
      'float tn(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(mix(th(i), th(i+vec3(1,0,0)), f.x), mix(th(i+vec3(0,1,0)), th(i+vec3(1,1,0)), f.x), f.y), mix(mix(th(i+vec3(0,0,1)), th(i+vec3(1,0,1)), f.x), mix(th(i+vec3(0,1,1)), th(i+vec3(1,1,1)), f.x), f.y), f.z); }\n' +
      sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      {
        vec3 c = diffuseColor.rgb; float up = abs(vWN.y), hi = max(c.r, max(c.g, c.b)), sat = hi - min(c.r, min(c.g, c.b));
        float n1 = tn(vWP * 0.9), n2 = tn(vWP * 6.0);
        c *= 0.9 + 0.16 * n1 + 0.06 * n2;
        if (up > 0.3 && up < 0.97) {
          float r = fract(vWP.y * 3.4 + n2 * 0.12);
          c *= 0.84 + 0.2 * smoothstep(0.0, 0.3, r);
        } else if (up <= 0.3 && sat < 0.11 && hi > 0.12) {
          float h = dot(vWP.xz, normalize(vec2(-vWN.z, vWN.x) + 1e-4)), row = floor(vWP.y * 2.6), v = fract(vWP.y * 2.6), u = fract(h * 1.25 + row * 0.5);
          c *= (1.0 - 0.26 * max(step(v, 0.07), step(u, 0.045))) * (0.9 + 0.2 * th(vec3(floor(h * 1.25 + row * 0.5), row, 3.0)));
        } else if (up >= 0.97 && sat < 0.14) {
          vec2 q = vWP.xz * 1.1; vec2 g = fract(q), id = floor(q);
          c *= (1.0 - 0.18 * max(step(g.x, 0.06), step(g.y, 0.06))) * (0.88 + 0.22 * th(vec3(id, 5.0)));
        }
        diffuseColor.rgb = c;
      }`);
  };
  m.customProgramCacheKey = () => 'townmat1';
  return (TOWNMAT = m);
}
// windows and lamps light up as the evening comes (one material for every town)
function townGlowUpdate() {
  if (!TGLOW.mat) return;
  const n = clamp(SKY.night || 0, 0, 1), k = Math.round(n * 40) / 40; if (k === TGLOW.k) return; TGLOW.k = k;
  TGLOW.mat.color.setRGB(k * 1.25, k * 1.15, k);
  for (const c of HUNT.camps) if (c.glowMesh) c.glowMesh.visible = k > 0.03;
}
// ---------- pieces many peoples share ----------
function bWall(B, x0, z0, x1, z1, h, t, color, crenel) {
  const L = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(-(z1 - z0), x1 - x0), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const base = Math.min(B.gy(x0, z0), B.gy(x1, z1), B.gy(cx, cz)) - 0.6;
  B.add(new THREE.BoxGeometry(L, h + 0.6, t), M([cx, base + (h + 0.6) / 2, cz], [0, ry, 0]), color, 0.04);
  if (crenel) { const n = Math.max(2, Math.floor(L / 1.2)), ux = (x1 - x0) / L, uz = (z1 - z0) / L; for (let k = 0; k < n; k += 2) { const s = (k + 0.5) * L / n - L / 2; B.add(new THREE.BoxGeometry(0.7, 0.75, t + 0.08), M([cx + ux * s, base + h + 0.97, cz + uz * s], [0, ry, 0]), color, 0.05); } }
  B.solidLine(x0, z0, x1, z1, t * 0.5 + 0.35);
}
function bTower(B, x, z, r, h, color, roof, o) {
  o = o || {}; const y = B.gy(x, z) - 0.5, seg = o.seg || 14;
  B.add(new THREE.CylinderGeometry(r, r * 1.08, h + 0.5, seg), M([x, y + (h + 0.5) / 2, z], [0, o.ry || 0, 0]), color, 0.03);
  if (roof) B.add(new THREE.ConeGeometry(r * 1.22, r * (o.tall || 2.1), seg), M([x, y + h + 0.5 + r * (o.tall || 2.1) / 2, z], [0, o.ry || 0, 0]), roof);
  else for (let k = 0; k < 10; k += 2) { const a = k / 10 * TAU; B.add(new THREE.BoxGeometry(0.85, 0.8, 0.6), M([x + Math.cos(a) * r * 0.9, y + h + 0.9, z + Math.sin(a) * r * 0.9], [0, -a, 0]), color, 0.05); }
  if (o.flag) bFlag(B, x, z, y + h + 0.5 + (roof ? r * (o.tall || 2.1) : 0.4), o.flag);
  B.solid(x, z, r + 0.15);
}
function bFlag(B, x, z, y, color) {
  B.add(new THREE.CylinderGeometry(0.05, 0.06, 3.2, 5), M([x, y + 1.6, z]), '#4a3a2a');
  B.add(new THREE.BoxGeometry(1.5, 0.95, 0.04), M([x + 0.78, y + 2.6, z]), color);
}
// a house: walls, a prism roof, a door looking along +z before it is turned by rot
function bHouse(B, x, z, w, d, h, wall, roof, rot, o) {
  o = o || {}; const y = B.gy(x, z) - 0.3, cs = Math.cos(rot), sn = Math.sin(rot);
  B.add(new THREE.BoxGeometry(w, h + 0.3, d), M([x, y + (h + 0.3) / 2, z], [0, rot, 0]), wall, 0.05);
  if (o.timber) for (const s of [-0.48, 0, 0.48]) B.add(new THREE.BoxGeometry(0.14, h, 0.05), M([x + s * w * cs + (d / 2 + 0.03) * sn, y + h / 2 + 0.3, z - s * w * sn + (d / 2 + 0.03) * cs], [0, rot, 0]), o.timber);
  if (o.flat) B.add(new THREE.BoxGeometry(w + 0.3, 0.3, d + 0.3), M([x, y + h + 0.45, z], [0, rot, 0]), roof);
  else if (o.hip) { const rh = o.rh || Math.min(w, d) * 0.55, g = new THREE.ConeGeometry(Math.SQRT1_2, 1, 4); g.rotateY(Math.PI / 4); g.scale(w + 0.6, rh, d + 0.6); B.add(g, M([x, y + h + 0.3 + rh / 2, z], [0, rot, 0]), roof); }
  else B.add(prismGeo(w + 0.5, d + 0.7, o.rh || Math.min(w, d) * 0.5), M([x, y + h + 0.3, z], [0, rot, 0]), roof);
  B.add(new THREE.BoxGeometry(0.9, 1.7, 0.08), M([x + (d / 2 + 0.04) * sn, y + 1.15, z + (d / 2 + 0.04) * cs], [0, rot, 0]), o.door || '#4a3220');
  if (o.win) for (const s of [-0.3, 0.3]) B.add(new THREE.BoxGeometry(0.5, 0.5, 0.06), M([x + s * w * cs + (d / 2 + 0.04) * sn, y + h * 0.62 + 0.3, z - s * w * sn + (d / 2 + 0.04) * cs], [0, rot, 0]), o.win);
  B.solidBox(w, d, x, z, rot);
}
function bFire(B) { for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; B.add(new THREE.SphereGeometry(0.14, 6, 5), M([Math.cos(a) * 0.55, B.gy(0, 0) + 0.05, Math.sin(a) * 0.55], null, [1, 0.65, 1]), i % 2 ? '#6d6862' : '#58534e'); } }
function bWell(B, x, z) { B.cyl(0.9, 0.95, 0.9, x, z, '#8a8478', { seg: 12, solid: true }); B.cyl(0.75, 0.75, 0.05, x, z, '#1d2a30', { y: 0.86, seg: 12 }); for (const s of [-1, 1]) B.box(0.12, 1.9, 0.12, x + s * 0.8, z, '#5a4030'); B.box(1.9, 0.14, 0.14, x, z, '#5a4030', { y: 1.9 }); B.cone(1.15, 0.6, x, z, '#7a3a2a', { y: 2.0, seg: 4, ry: Math.PI / 4 }); }
function bField(B, x, z, w, d, rot, color, rowC) {
  if (roadHits(B.c.x + x, B.c.z + z, Math.max(w, d) * 0.6)) return;
  const y = B.gy(x, z) + 0.04; B.add(new THREE.BoxGeometry(w, 0.1, d), M([x, y, z], [0, rot, 0]), color);
  const n = Math.floor(w / 1.1), cs = Math.cos(rot), sn = Math.sin(rot);
  for (let k = 0; k < n; k++) { const t = (k + 0.5) / n * w - w / 2; B.add(new THREE.BoxGeometry(0.35, 0.3, d * 0.95), M([x + t * cs, y + 0.14, z - t * sn], [0, rot, 0]), rowC); }
}
function bFence(B, pts, color) { for (let k = 0; k < pts.length - 1; k++) { const [x0, z0] = pts[k], [x1, z1] = pts[k + 1], L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / 2)); for (let q = 0; q <= n; q++) B.box(0.12, 1.1, 0.12, lerp(x0, x1, q / n), lerp(z0, z1, q / n), color); const ry = Math.atan2(-(z1 - z0), x1 - x0); for (const y of [0.45, 0.9]) B.box(L, 0.08, 0.06, (x0 + x1) / 2, (z0 + z1) / 2, color, { y, ry }); } }
// the colours of each people's houses
const HOUSEC = {
  knights: { wall: '#e8e0cc', roof: '#9a4a32', timber: '#4a3424', win: '#3a4a5a' }, vikings: { wall: '#7a5a3a', roof: '#5a6a3a' }, china: { wall: '#e8dcc4', roof: '#3a3a40', door: '#9a2a22' },
  japan: { wall: '#efe8d8', roof: '#3a4048', door: '#5a3a28' }, arabs: { wall: '#e6d4b0', roof: '#d8c49a' }, egypt: { wall: '#d8b886', roof: '#c8a676' }, mali: { wall: '#b07a4a', roof: '#c8a868' },
  india: { wall: '#e8c8a0', roof: '#b8603a' }, mongols: { wall: '#efe8da', roof: '#d8cfba' }
};
