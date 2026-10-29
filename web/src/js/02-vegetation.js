// ================= VEGETATION =================
const VEG = { mat: null, uni: { uTime: WUNI.uTime, uWind: { value: 1 }, uNear: { value: 2.3 } }, types: [], chunks: [], CS: 100, CN: Math.round(W.size / 100) | 1, t: 0 };
VEG.O = -VEG.CN * VEG.CS / 2;
const AT = {};
const TRUNKS = { g: [] }, CROWNS = [], CROWNG = [], HANGS = [], FLOWERS = [];
const WHITE = col('#ffffff');

function makeAtlas() {
  const S = 1024, cv = document.createElement('canvas'); cv.width = cv.height = S; const c = cv.getContext('2d');
  const r = mulberry32(555), R = (a, b) => a + (b - a) * r(), P = a => a[Math.floor(r() * a.length)];
  const reg = (n, x, y, w, h) => { AT[n] = [(x + 1) / S, 1 - (y + h - 1) / S, (x + w - 1) / S, 1 - (y + 1) / S]; };
  const clip = (x, y, w, h) => { c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); };
  // bark
  c.fillStyle = '#8b7a62'; c.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 280; i++) {
    const x = R(0, 256); c.strokeStyle = r() < 0.6 ? `rgba(40,28,18,${R(0.12, 0.38)})` : `rgba(225,212,190,${R(0.08, 0.2)})`;
    c.lineWidth = R(1, 4); c.beginPath(); c.moveTo(x, 0); let y = 0, xx = x; while (y < 256) { y += R(10, 30); xx += R(-3, 3); c.lineTo(xx, y); } c.stroke();
  }
  for (let i = 0; i < 45; i++) { c.fillStyle = `rgba(165,180,140,${R(0.15, 0.35)})`; c.beginPath(); c.ellipse(R(0, 256), R(0, 256), R(4, 14), R(3, 10), r() * 3, 0, TAU); c.fill(); }
  reg('bark', 0, 0, 256, 256);
  // leaf cluster
  clip(256, 0, 256, 256);
  const LC = ['#2d6823', '#3b7b2a', '#4a8d34', '#28581e', '#5a9b3e', '#34702a', '#447f2d'];
  for (let i = 0; i < 125; i++) {
    const a = r() * TAU, d = Math.sqrt(r()) * 96, x = 384 + Math.cos(a) * d, y = 128 + Math.sin(a) * d, len = R(26, 50), wid = R(9, 17);
    c.save(); c.translate(x, y); c.rotate(r() * TAU);
    c.fillStyle = P(LC); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(wid, len * 0.45, 0, len); c.quadraticCurveTo(-wid, len * 0.45, 0, 0); c.fill();
    c.fillStyle = 'rgba(255,255,210,0.07)'; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(wid * 0.8, len * 0.45, 0, len); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(18,38,10,0.45)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(0, 2); c.lineTo(0, len - 3); c.stroke();
    c.restore();
  }
  c.restore(); reg('leaf', 256, 0, 256, 256);
  // palm frond (axis vertical, base at bottom)
  clip(512, 0, 256, 256);
  for (let t = 0.04; t < 0.98; t += 0.02) {
    const y = 252 - t * 246, L = 112 * Math.sin(Math.PI * Math.min(1, t * 1.05 + 0.08)) * (1 - t * 0.35);
    for (const s of [-1, 1]) {
      c.strokeStyle = r() < 0.5 ? '#3d7a29' : '#4d8c31'; c.lineWidth = R(3.5, 6);
      c.beginPath(); c.moveTo(640, y); c.quadraticCurveTo(640 + s * L * 0.5, y - L * 0.3, 640 + s * L, y - L * 0.2 + R(-4, 6)); c.stroke();
    }
  }
  c.strokeStyle = '#6f7d34'; c.lineWidth = 5; c.beginPath(); c.moveTo(640, 255); c.lineTo(640, 4); c.stroke();
  c.restore(); reg('palm', 512, 0, 256, 256);
  // fern frond
  clip(768, 0, 256, 256);
  const FC = ['#4c8f33', '#5a9d3a', '#437f2e'];
  for (let t = 0.05; t < 0.97; t += 0.032) {
    const y = 250 - t * 244, L = 80 * Math.sin(Math.PI * Math.min(1, t + 0.05)) * (1 - t * 0.25);
    for (const s of [-1, 1]) for (let k = 0; k < 1; k += 0.11) {
      c.fillStyle = P(FC); c.beginPath(); c.ellipse(896 + s * L * k, y - L * k * 0.35, 6 * (1 - k * 0.55), 3.6 * (1 - k * 0.45), s * 0.4, 0, TAU); c.fill();
    }
  }
  c.strokeStyle = '#3b6a26'; c.lineWidth = 3; c.beginPath(); c.moveTo(896, 255); c.lineTo(896, 6); c.stroke();
  c.restore(); reg('fern', 768, 0, 256, 256);
  // big banana leaf
  clip(0, 256, 256, 256); c.save(); c.translate(128, 384);
  const g1 = c.createLinearGradient(-70, 0, 70, 0); g1.addColorStop(0, '#2f6f25'); g1.addColorStop(0.5, '#4c9436'); g1.addColorStop(1, '#2f6f25');
  c.fillStyle = g1; c.beginPath(); c.moveTo(0, 126); c.bezierCurveTo(82, 70, 82, -62, 0, -126); c.bezierCurveTo(-82, -62, -82, 70, 0, 126); c.fill();
  c.strokeStyle = 'rgba(20,45,12,0.35)'; c.lineWidth = 1;
  for (let y = -112; y < 116; y += 6) for (const s of [-1, 1]) { c.beginPath(); c.moveTo(0, y); c.lineTo(s * 64 * Math.cos(y / 126 * 1.4), y - 14); c.stroke(); }
  c.strokeStyle = '#a9c27a'; c.lineWidth = 4; c.beginPath(); c.moveTo(0, 126); c.lineTo(0, -122); c.stroke();
  c.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 7; i++) { const y = R(-90, 90), s = r() < 0.5 ? -1 : 1; c.lineWidth = R(1.5, 3); c.beginPath(); c.moveTo(s * 80, y); c.lineTo(s * R(8, 30), y + 12); c.stroke(); }
  c.restore(); c.restore(); reg('big', 0, 256, 256, 256);
  // grass
  clip(256, 256, 256, 256);
  for (let i = 0; i < 70; i++) {
    const x = R(268, 500), h = R(120, 245), lean = R(-45, 45);
    c.strokeStyle = P(['#4f8a2f', '#6a9a36', '#8aa64a', '#3f7a29']); c.lineWidth = R(2, 4.5);
    c.beginPath(); c.moveTo(x, 512); c.quadraticCurveTo(x + lean * 0.3, 512 - h * 0.6, x + lean, 512 - h); c.stroke();
  }
  c.restore(); reg('grass', 256, 256, 256, 256);
  // rock
  c.fillStyle = '#8a857a'; c.fillRect(512, 256, 256, 256);
  for (let i = 0; i < 500; i++) { c.fillStyle = r() < 0.5 ? `rgba(40,38,34,${R(0.05, 0.2)})` : `rgba(230,225,210,${R(0.05, 0.15)})`; c.beginPath(); c.ellipse(R(512, 768), R(256, 512), R(2, 16), R(2, 10), r() * 3, 0, TAU); c.fill(); }
  for (let i = 0; i < 60; i++) { c.fillStyle = `rgba(70,110,40,${R(0.15, 0.4)})`; c.beginPath(); c.ellipse(R(512, 768), R(256, 512), R(6, 20), R(4, 14), r() * 3, 0, TAU); c.fill(); }
  reg('rock', 512, 256, 256, 256);
  // giant water lily pad
  clip(768, 256, 256, 256);
  const g2 = c.createRadialGradient(896, 384, 10, 896, 384, 122); g2.addColorStop(0, '#5a9640'); g2.addColorStop(0.85, '#3d7a2c'); g2.addColorStop(1, '#2c5a22');
  c.fillStyle = g2; c.beginPath(); c.arc(896, 384, 124, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(25,55,15,0.5)'; c.lineWidth = 2;
  for (let i = 0; i < 26; i++) { const a = i / 26 * TAU; c.beginPath(); c.moveTo(896, 384); c.lineTo(896 + Math.cos(a) * 120, 384 + Math.sin(a) * 120); c.stroke(); }
  c.strokeStyle = 'rgba(20,50,12,0.3)'; for (let rr2 = 30; rr2 < 120; rr2 += 22) { c.beginPath(); c.arc(896, 384, rr2, 0, TAU); c.stroke(); }
  c.restore(); reg('lily', 768, 256, 256, 256);
  // vines
  clip(0, 512, 256, 256);
  for (let k = 0; k < 7; k++) {
    let x = R(20, 236); c.strokeStyle = P(['#55642f', '#4a5a2a', '#6b7a3a']); c.lineWidth = R(2, 3.5); c.beginPath(); c.moveTo(x, 512);
    for (let y = 512; y <= 768; y += 8) { x += R(-3, 3); c.lineTo(x, y); }
    c.stroke();
    for (let y = 520; y < 760; y += R(10, 22)) { c.fillStyle = P(LC); c.beginPath(); c.ellipse(x + R(-8, 8), y, R(4, 8), R(2.5, 4), r() * 3, 0, TAU); c.fill(); }
  }
  c.restore(); reg('vine', 0, 512, 256, 256);
  // flowers / bromeliads
  clip(256, 512, 256, 256);
  for (let i = 0; i < 9; i++) {
    const a = r() * TAU; c.fillStyle = P(['#3e7a2a', '#4f8b33']); c.save(); c.translate(384, 760); c.rotate(a * 0.4 - 0.6 + i * 0.15);
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(18, -90, 0, -170); c.quadraticCurveTo(-18, -90, 0, 0); c.fill(); c.restore();
  }
  for (let i = 0; i < 9; i++) {
    const x = R(300, 470), y = R(560, 690), pc = P(['#e0468a', '#f2e6ee', '#f08a24', '#d8262a', '#f2c41c', '#b04ad8']), rad = R(9, 15);
    for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; c.fillStyle = pc; c.beginPath(); c.ellipse(x + Math.cos(a) * rad * 0.7, y + Math.sin(a) * rad * 0.7, rad * 0.6, rad * 0.38, a, 0, TAU); c.fill(); }
    c.fillStyle = '#f7e27a'; c.beginPath(); c.arc(x, y, rad * 0.25, 0, TAU); c.fill();
  }
  c.restore(); reg('flower', 256, 512, 256, 256);
  // heliconia bracts
  clip(512, 512, 256, 256);
  c.strokeStyle = '#3d6e26'; c.lineWidth = 5; c.beginPath(); c.moveTo(640, 768); c.lineTo(640, 530); c.stroke();
  for (let k = 0; k < 9; k++) {
    const y = 740 - k * 24, s = k % 2 ? 1 : -1, L = 62 - k * 4;
    c.fillStyle = '#d8261f'; c.beginPath(); c.moveTo(640, y); c.lineTo(640 + s * L, y - 16); c.lineTo(640, y - 26); c.fill();
    c.fillStyle = '#f2c41c'; c.beginPath(); c.moveTo(640 + s * L, y - 16); c.lineTo(640 + s * (L - 14), y - 12); c.lineTo(640 + s * (L - 10), y - 22); c.fill();
  }
  c.restore(); reg('heli', 512, 512, 256, 256);
  atlasMore(c, reg);
  c.fillStyle = '#ffffff'; c.fillRect(992, 992, 32, 32); reg('solid', 996, 996, 24, 24);
  const t = new THREE.CanvasTexture(cv); t.anisotropy = 8; return texSRGB(t);
}

const _v = new V3(), _n = new V3(), _r = new V3();
class VB {
  constructor() { this.P = []; this.N = []; this.U = []; this.C = []; this.S = []; }
  push(x, y, z, nx, ny, nz, u, v, c, s) { this.P.push(x, y, z); this.N.push(nx, ny, nz); this.U.push(u, v); this.C.push(c.r, c.g, c.b); this.S.push(s); }
  geo(g, m, reg, c, sway, nFrom) {
    const gg = g.index ? g.toNonIndexed() : g; if (m) gg.applyMatrix4(m);
    const P = gg.attributes.position, N = gg.attributes.normal, UV = gg.attributes.uv;
    for (let i = 0; i < P.count; i++) {
      _v.fromBufferAttribute(P, i); _n.fromBufferAttribute(N, i);
      if (nFrom) { _r.copy(_v).sub(nFrom).normalize(); _n.lerp(_r, 0.7).normalize(); }
      const u = UV ? UV.getX(i) : 0.5, v = UV ? UV.getY(i) : 0.5;
      const cc = typeof c === 'function' ? c(_v, _n) : c;
      this.push(_v.x, _v.y, _v.z, _n.x, _n.y, _n.z, lerp(reg[0], reg[2], u), lerp(reg[1], reg[3], v), cc, sway);
    }
    g.dispose(); if (gg !== g) gg.dispose();
  }
  quad(p, Rv, Uv, w, h, reg, c, sway, nFrom) {
    const hw = w / 2, hh = h / 2, fn = new V3().crossVectors(Rv, Uv).normalize();
    const K = [[-1, -1, reg[0], reg[1]], [1, -1, reg[2], reg[1]], [1, 1, reg[2], reg[3]], [-1, 1, reg[0], reg[3]]];
    const Q = K.map(k => [p.x + Rv.x * hw * k[0] + Uv.x * hh * k[1], p.y + Rv.y * hw * k[0] + Uv.y * hh * k[1], p.z + Rv.z * hw * k[0] + Uv.z * hh * k[1], k[2], k[3]]);
    for (const k of [0, 1, 2, 0, 2, 3]) {
      const q = Q[k]; let nx = fn.x, ny = fn.y, nz = fn.z;
      if (nFrom) { _n.set(q[0] - nFrom.x, q[1] - nFrom.y, q[2] - nFrom.z).normalize(); nx = _n.x; ny = _n.y; nz = _n.z; }
      else if (ny < 0) { nx = -nx; ny = -ny; nz = -nz; }
      this.push(q[0], q[1], q[2], nx, ny * 0.6 + 0.4, nz, q[3], q[4], c, sway);
    }
  }
  frond(base, yaw, elev, len, wid, droop, reg, c, segs, sway = 1) {
    const dx = Math.cos(yaw), dz = Math.sin(yaw), sx = -dz, sz = dx, pts = [];
    const p = base.clone();
    for (let i = 0; i <= segs; i++) {
      pts.push(p.clone()); const a = elev - droop * (i / segs), st = len / segs;
      p.x += dx * Math.cos(a) * st; p.y += Math.sin(a) * st; p.z += dz * Math.cos(a) * st;
    }
    for (let i = 0; i < segs; i++) {
      const t0 = i / segs, t1 = (i + 1) / segs, a = pts[i], b = pts[i + 1];
      const w0 = wid * Math.sin(Math.PI * Math.min(1, t0 * 0.85 + 0.15)) / 2, w1 = wid * Math.sin(Math.PI * Math.min(1, t1 * 0.85 + 0.15)) / 2;
      const roll = 0.25;
      const V = [
        [a.x - sx * w0, a.y - roll * w0, a.z - sz * w0, reg[0], lerp(reg[1], reg[3], t0)],
        [a.x + sx * w0, a.y - roll * w0, a.z + sz * w0, reg[2], lerp(reg[1], reg[3], t0)],
        [b.x + sx * w1, b.y - roll * w1, b.z + sz * w1, reg[2], lerp(reg[1], reg[3], t1)],
        [b.x - sx * w1, b.y - roll * w1, b.z - sz * w1, reg[0], lerp(reg[1], reg[3], t1)]];
      const fwd = new V3(b.x - a.x, b.y - a.y, b.z - a.z).normalize(), nrm = new V3(sx, 0, sz).cross(fwd).normalize();
      if (nrm.y < 0) nrm.negate(); nrm.y += 0.8; nrm.normalize();
      for (const k of [0, 1, 2, 0, 2, 3]) { const q = V[k]; this.push(q[0], q[1], q[2], nrm.x, nrm.y, nrm.z, q[3], q[4], c, sway); }
    }
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.P, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.N, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.U, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.C, 3));
    g.setAttribute('aSway', new THREE.Float32BufferAttribute(this.S, 1));
    g.computeBoundingSphere(); return g;
  }
}
function limbM(a, b) {
  const d = new V3().subVectors(b, a), L = d.length();
  return [new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), new THREE.Quaternion().setFromUnitVectors(new V3(0, 1, 0), d.normalize()), new V3(1, 1, 1)), L];
}
function addLimb(vb, a, b, r0, r1, c, seg = 6) { const [m, L] = limbM(a, b); vb.geo(new THREE.CylinderGeometry(r1, r0, L, seg, 1, true), m, AT.bark, c, 0.5); }
function leafBall(vb, p, s, c, cards, R, cc, far) {
  vb.geo(new THREE.IcosahedronGeometry(s, 0), M(p.toArray(), [R(0, 3), R(0, 3), R(0, 3)], [1, 0.72, 1]), AT.solid, c, 1, cc);
  if (far) return;
  for (let k = 0; k < cards; k++) {
    const d = new V3(R(-1, 1), R(-0.4, 1), R(-1, 1)).normalize();
    const q = p.clone().add(d.clone().multiplyScalar(s * R(0.5, 0.95)));
    const Rv = new V3().crossVectors(d, new V3(R(-1, 1), R(-1, 1), R(-1, 1))).normalize(), Uv = new V3().crossVectors(d, Rv).normalize();
    vb.quad(q, Rv, Uv, s * R(1.3, 1.8), s * R(1.3, 1.8), AT.leaf, col(['#ffffff', '#eef4dc', '#f4f0d8'][k % 3]), 1, cc);
  }
}
function bCanopy(v) {
  const r = mulberry32(100 + v), R = (a, b) => a + (b - a) * r();
  const near = new VB(), far = new VB(), H = R(15, 19), tr = R(0.42, 0.55);
  const barkC = col(['#7a6a55', '#8f8068', '#6b5b48'][v % 3]), leafC = col(['#2c5a20', '#335d22', '#3a6a25'][v % 3]);
  near.geo(new THREE.CylinderGeometry(tr * 0.55, tr, H, 8, 4, true), M([0, H / 2, 0]), AT.bark, barkC, 0.5);
  near.geo(new THREE.CylinderGeometry(tr, tr * 1.9, 1.6, 8, 1, true), M([0, 0.8, 0]), AT.bark, barkC, 0.5);
  far.geo(new THREE.CylinderGeometry(tr * 0.55, tr, H, 5, 1, true), M([0, H / 2, 0]), AT.bark, barkC, 0.5);
  const nB = 4 + (v % 2), cl = [];
  for (let i = 0; i < nB; i++) {
    const a = i / nB * TAU + R(-0.4, 0.4), el = R(0.45, 0.9), L = R(3.6, 5.6);
    const s = new V3(0, H * R(0.72, 0.9), 0), e = s.clone().add(new V3(Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el)).multiplyScalar(L));
    addLimb(near, s, e, tr * 0.4, tr * 0.18, barkC); cl.push(e.clone().add(new V3(0, R(0.6, 1.3), 0)));
  }
  cl.push(new V3(R(-0.6, 0.6), H + R(1.5, 2.6), R(-0.6, 0.6)));
  const cc = new V3(); cl.forEach(p => cc.add(p)); cc.divideScalar(cl.length);
  for (const p of cl) { const s = R(2.5, 3.4); leafBall(near, p, s, leafC, 7, R, cc); leafBall(far, p, s * 1.15, leafC, 0, R, cc, true); }
  if (v !== 1) { const p = cl[0]; near.quad(new V3(p.x * 0.75, p.y - 5, p.z * 0.75), new V3(1, 0, 0), new V3(0, 1, 0), 1.5, 9.5, AT.vine, col('#d8e6c0'), 1); }
  let hang = null;
  if (v === 0) { const s0 = new V3(0, H * 0.62, 0), e0 = new V3(4.8, H * 0.62 + 0.3, 0.4); addLimb(near, s0, e0, tr * 0.34, tr * 0.2, barkC); hang = new V3(3.6, H * 0.62 + 0.05, 0.3); }
  const crownR = Math.max(...cl.map(p => Math.hypot(p.x, p.z))) + 2.5;
  return { near: near.build(), far: far.build(), crown: { y: cc.y + 1.4, r: crownR, top: H + 3.6 }, hang, trunk: tr };
}
function bGiant(v) {
  const r = mulberry32(200 + v), R = (a, b) => a + (b - a) * r();
  const near = new VB(), far = new VB(), H = R(30, 35), tr = R(1.1, 1.35);
  const barkC = col('#b3a994'), leafC = col(['#2f5d22', '#386526'][v % 2]);
  near.geo(new THREE.CylinderGeometry(tr * 0.55, tr, H, 10, 6, true), M([0, H / 2, 0]), AT.bark, barkC, 0.5);
  far.geo(new THREE.CylinderGeometry(tr * 0.55, tr, H, 6, 1, true), M([0, H / 2, 0]), AT.bark, barkC, 0.5);
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * TAU + R(-0.2, 0.2), g = new THREE.BoxGeometry(0.32, 4.6, 4.2, 1, 2, 2), p = g.attributes.position;
    for (let k = 0; k < p.count; k++) { const y = p.getY(k), z = p.getZ(k); const f = clamp((y + 2.3) / 4.6, 0, 1); p.setZ(k, -2.1 + (z + 2.1) * (1 - f * 0.9)); }
    g.computeVertexNormals();
    const m = new THREE.Matrix4().makeRotationY(-a).multiply(M([0, 2.2, tr - 0.3 + 2.1]));
    near.geo(g, m, AT.bark, barkC, 0.3);
  }
  const cl = [], top = new V3(0, H * 0.86, 0);
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * TAU + R(-0.3, 0.3), L = R(8, 11.5), e = new V3(Math.cos(a) * L, H + R(2, 4.5), Math.sin(a) * L);
    addLimb(near, top, e, tr * 0.42, tr * 0.2, barkC, 7); addLimb(far, top, e, tr * 0.42, tr * 0.2, barkC, 4);
    cl.push(e.clone().add(new V3(0, 1.2, 0)), top.clone().lerp(e, 0.55).add(new V3(0, 2.4, 0)));
    const b = top.clone().lerp(e, R(0.4, 0.7)); near.geo(new THREE.IcosahedronGeometry(0.5, 0), M([b.x, b.y + 0.4, b.z]), AT.solid, col(['#c0392b', '#3f7a2a', '#d48a1c'][i % 3]), 0.5);
  }
  cl.push(new V3(0, H + 6, 0));
  const cc = new V3(); cl.forEach(p => cc.add(p)); cc.divideScalar(cl.length);
  for (const p of cl) { const s = R(3.6, 4.6); leafBall(near, p, s, leafC, 8, R, cc); leafBall(far, p, s * 1.1, leafC, 0, R, cc, true); }
  near.quad(new V3(4, H - 6, 1), new V3(0, 0, 1), new V3(0, 1, 0), 1.6, 12, AT.vine, col('#d8e6c0'), 1);
  return { near: near.build(), far: far.build(), crown: { y: H + 4, r: 14, top: H + 8.5 }, trunk: tr * 1.5 };
}
function bUnder(v) {
  const r = mulberry32(300 + v), R = (a, b) => a + (b - a) * r();
  const near = new VB(), far = new VB(), H = R(5.5, 8), tr = 0.18, barkC = col('#9a9078'), leafC = col('#3b6e27');
  near.geo(new THREE.CylinderGeometry(tr * 0.6, tr, H, 6, 2, true), M([0, H / 2, 0]), AT.bark, barkC, 0.5);
  far.geo(new THREE.CylinderGeometry(tr * 0.6, tr, H, 4, 1, true), M([0, H / 2, 0]), AT.bark, barkC, 0.5);
  const cc = new V3(0, H + 0.6, 0);
  for (let i = 0; i < 4; i++) {
    const a = i / 4 * TAU + R(-0.4, 0.4), p = new V3(Math.cos(a) * R(0.8, 1.6), H + R(-0.6, 0.9), Math.sin(a) * R(0.8, 1.6)), s = R(1.5, 2.1);
    leafBall(near, p, s, leafC, 6, R, cc); if (i < 2) leafBall(far, p, s * 1.3, leafC, 0, R, cc, true);
  }
  return { near: near.build(), far: far.build(), trunk: tr };
}
function bPalm(v) {
  const r = mulberry32(400 + v), R = (a, b) => a + (b - a) * r();
  const near = new VB(), far = new VB(), H = R(9, 14), bend = R(0.6, 1.8), barkC = col('#8d8472');
  let prev = new V3(0, 0, 0); const segs = 7;
  for (let i = 1; i <= segs; i++) {
    const t = i / segs, p = new V3(bend * t * t, H * t, 0);
    addLimb(near, prev, p, 0.24 - t * 0.06, 0.24 - (t + 1 / segs) * 0.06, barkC, 7);
    if (i % 2 === 0) addLimb(far, prev, p, 0.22, 0.16, barkC, 4);
    prev = p;
  }
  const top = prev.clone(), nf = 13;
  for (let i = 0; i < nf; i++) {
    const yaw = i / nf * TAU + R(-0.2, 0.2), el = R(0.15, 0.95), len = R(4.2, 5.6);
    near.frond(top, yaw, el, len, 2.1, R(1.0, 1.8), AT.palm, col(['#ffffff', '#f2f6dc', '#e6ecc8'][i % 3]), 6);
    if (i % 2 === 0) far.frond(top, yaw, el, len, 2.3, 1.3, AT.palm, WHITE, 2);
  }
  for (let i = 0; i < 2; i++) near.geo(new THREE.IcosahedronGeometry(0.32, 0), M([top.x + (i ? 0.3 : -0.25), top.y - 0.6, 0.2]), AT.solid, col('#3a1f3a'), 0.5);
  return { near: near.build(), far: far.build(), trunk: 0.24 };
}
function bTreeFern() {
  const r = mulberry32(450), R = (a, b) => a + (b - a) * r();
  const near = new VB(), H = 3.2;
  near.geo(new THREE.CylinderGeometry(0.15, 0.2, H, 6, 1, true), M([0, H / 2, 0]), AT.bark, col('#4a3a2a'), 0.5);
  for (let i = 0; i < 11; i++) near.frond(new V3(0, H, 0), i / 11 * TAU + R(-0.2, 0.2), R(0.3, 0.8), R(2.2, 2.9), 1.1, 1.3, AT.fern, WHITE, 5);
  return { near: near.build(), trunk: 0.18 };
}
function bFern(v) {
  const r = mulberry32(500 + v), R = (a, b) => a + (b - a) * r(), near = new VB();
  for (let i = 0; i < 9; i++) near.frond(new V3(0, 0.05, 0), i / 9 * TAU + R(-0.3, 0.3), R(0.55, 1.15), R(1.1, 1.8), 0.62, R(1.1, 1.6), AT.fern, col(['#ffffff', '#e8f0c8'][i % 2]), 4);
  return { near: near.build() };
}
function bHeli() {
  const r = mulberry32(600), R = (a, b) => a + (b - a) * r(), near = new VB();
  for (let i = 0; i < 6; i++) {
    const yaw = i / 6 * TAU + R(-0.3, 0.3), sh = R(0.8, 1.5);
    addLimb(near, new V3(0, 0, 0), new V3(Math.cos(yaw) * 0.3, sh, Math.sin(yaw) * 0.3), 0.05, 0.035, col('#3b6a26'), 4);
    near.frond(new V3(Math.cos(yaw) * 0.3, sh, Math.sin(yaw) * 0.3), yaw, R(0.5, 1.0), R(1.8, 2.4), 0.8, R(0.7, 1.2), AT.big, WHITE, 4);
  }
  for (let i = 0; i < 2; i++) {
    const a = i * 1.6 + 0.4, p = new V3(Math.cos(a) * 0.4, 1.3, Math.sin(a) * 0.4);
    near.quad(p, new V3(Math.cos(a), 0, Math.sin(a)), new V3(0, 1, 0), 0.6, 0.9, AT.heli, WHITE, 1);
    near.quad(p, new V3(-Math.sin(a), 0, Math.cos(a)), new V3(0, 1, 0), 0.6, 0.9, AT.heli, WHITE, 1);
  }
  return { near: near.build() };
}
function bBush(v) {
  const r = mulberry32(700 + v), R = (a, b) => a + (b - a) * r(), near = new VB(), leafC = col(['#2f5f22', '#3d6f28'][v % 2]);
  const cc = new V3(0, 0.9, 0);
  for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + R(-0.5, 0.5), p = new V3(Math.cos(a) * R(0.3, 0.8), R(0.6, 1.3), Math.sin(a) * R(0.3, 0.8)); leafBall(near, p, R(0.75, 1.1), leafC, 4, R, cc); }
  return { near: near.build() };
}
function bGrass(tall) {
  const near = new VB(), w = tall ? 1.1 : 1.3, h = tall ? 1.9 : 0.75, tint = col(tall ? '#e4e0a8' : '#ffffff');
  for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI; near.quad(new V3(0, h / 2, 0), new V3(Math.cos(a), 0, Math.sin(a)), new V3(0, 1, 0), w, h, AT.grass, tint, 1); }
  return { near: near.build() };
}
function bRock(v) {
  const near = new VB(), g = new THREE.IcosahedronGeometry(1, 2), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    _v.fromBufferAttribute(p, i); const n = 1 + Noise.n2(_v.x * 1.3 + v * 7, _v.z * 1.3 + _v.y) * 0.22 + Noise.n2(_v.x * 3 + v, _v.y * 3) * 0.08;
    p.setXYZ(i, _v.x * n * 1.25, _v.y * n * 0.75, _v.z * n);
  }
  g.computeVertexNormals();
  near.geo(g, M([0, 0.35, 0]), AT.rock, (pp, nn) => nn.y > 0.55 ? col('#7f9a5c') : col('#d8d2c4'), 0);
  return { near: near.build(), r: 1.25 };
}
function bLog() {
  const near = new VB();
  near.geo(new THREE.CylinderGeometry(0.42, 0.5, 7, 9, 1, false), M([0, 0.38, 0], [0, 0, Math.PI / 2]), AT.bark, (pp, nn) => nn.y > 0.4 ? col('#6f8a46') : col('#8a7a62'), 0);
  return { near: near.build() };
}
function bLily() {
  const near = new VB();
  near.geo(new THREE.CircleGeometry(1, 22), M([0, 0.04, 0], [-Math.PI / 2, 0, 0]), AT.lily, WHITE, 0);
  near.geo(new THREE.CylinderGeometry(1.0, 0.95, 0.14, 22, 1, true), M([0, 0.08, 0]), AT.solid, col('#7a2e2a'), 0);
  return { near: near.build() };
}
function bFlower() {
  const near = new VB();
  for (let i = 0; i < 2; i++) { const a = i * Math.PI / 2 + 0.3; near.quad(new V3(0, 0.38, 0), new V3(Math.cos(a), 0, Math.sin(a)), new V3(0, 1, 0), 0.8, 0.8, AT.flower, WHITE, 1); }
  return { near: near.build() };
}

function vegSite(x, z) {
  const i = nearIdx(x, z);
  return { h: getH(x, z), ny: NY[i], fo: FOREST[i], wd: waterDepth(x, z), sd: STREAMD[i], clay: CLAYM[i] };
}
function buildVegetation() {
  if (!HUNT.camps.length) pickCamps();
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
  for (let i = 0; i < 100 * 100; i++) TRUNKS.g.push(null);
  for (let i = 0; i < 40 * 40; i++) CROWNG.push([]);
  VEG.chunks = [];
  for (let i = 0; i < VEG.CN * VEG.CN; i++) VEG.chunks.push({ cx: -W.half + (i % VEG.CN + 0.5) * VEG.CS, cz: -W.half + (((i / VEG.CN) | 0) + 0.5) * VEG.CS, items: [] });
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), s4 = new V3(), p4 = new V3(), e4 = new THREE.Euler();
  for (const t of VEG.types) {
    const per = t.vars.map(() => VEG.chunks.map(() => []));
    let placed = 0;
    for (let tries = 0; placed < t.n && tries < t.n * 14; tries++) {
      const x = rr(-LIMIT + 5, LIMIT - 5), z = rr(-LIMIT + 5, LIMIT - 5), s = vegSite(x, z);
      if (nearCamp(x, z, t.id === 'grass' || t.id === 'flower' || t.id === 'fern' ? 4.5 : 9)) continue;
      if (t.id !== 'lily' && t.id !== 'reeds' && s.wd > 0) continue;
      if (rng() > t.rule(s)) continue;
      const vi = Math.floor(rng() * t.vars.length), V = t.vars[vi], sc = rr(t.sc[0], t.sc[1]);
      const y = t.onWater ? WATER_Y : s.h - (t.sink || 0) * sc;
      const ry = rng() * TAU, tilt = t.id === 'canopy' || t.id === 'giant' || t.id === 'palm' ? 0 : rr(-0.08, 0.08);
      p4.set(x, y, z); q4.setFromEuler(e4.set(tilt, ry, tilt * 0.5)); s4.set(sc, sc, sc); m4.compose(p4, q4, s4);
      const ci = clamp(Math.floor((z + W.half) / VEG.CS), 0, VEG.CN - 1) * VEG.CN + clamp(Math.floor((x + W.half) / VEG.CS), 0, VEG.CN - 1);
      per[vi][ci].push(m4.clone());
      placed++;
      if (t.col) {
        const rad = (V.trunk ? V.trunk * (t.id === 'giant' ? 1.7 : 1.15) : (V.r || 1) * t.col) * sc;
        const k = clamp(((z + W.half) / 10) | 0, 0, 99) * 100 + clamp(((x + W.half) / 10) | 0, 0, 99);
        (TRUNKS.g[k] || (TRUNKS.g[k] = [])).push(x, z, rad);
      }
      if (t.crown && V.crown) {
        const cr = { x, z, y: y + V.crown.y * sc, top: y + V.crown.top * sc, r: V.crown.r * sc, giant: t.id === 'giant' };
        CROWNS.push(cr); CROWNG[clamp(((z + W.half) / 25) | 0, 0, 39) * 40 + clamp(((x + W.half) / 25) | 0, 0, 39)].push(cr);
      }
      if (V.hang) { const hp = V.hang.clone().applyMatrix4(m4); HANGS.push({ x: hp.x, y: hp.y, z: hp.z, ry }); }
      if (t.flower && FLOWERS.length < 4000) FLOWERS.push({ x, y: y + 1.2 * sc, z });
    }
    t.vars.forEach((V, vi) => per[vi].forEach((list, ci) => {
      if (!list.length) return;
      for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const tmp = list[i]; list[i] = list[j]; list[j] = tmp; }
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
  updateVeg(true);
}
function updateVeg(force) {
  grassUpdate();
  VEG.t -= 1;
  if (!force && VEG.t > 0) return;
  VEG.t = 12; terrainCull();
  const c = camera.position, q = QUAL[SET.q], k = q.view / 245;
  for (const ch of VEG.chunks) {
    const d = Math.max(0, Math.hypot(ch.cx - c.x, ch.cz - c.z) - 71);
    for (const it of ch.items) {
      const t = it.t, showNear = d < t.near * k, showFar = !showNear && !!it.far && d < (t.farD ? Math.min(t.farD, q.view + 120) : q.view + 30);
      it.near.visible = showNear; if (it.far) it.far.visible = showFar;
      it.near.castShadow = showNear && !!t.shadow && q.sh > 0 && d < 55;
      const cnt = Math.max(1, Math.ceil(it.total * (t.fixed ? 1 : q.veg)));
      it.near.count = cnt; if (it.far) it.far.count = cnt;
    }
  }
}
function trunkPush(p, rad) {
  const ix = g10c1(p.x), iz = g10r1(p.x, p.z);
  let hit = false;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const cell = TRUNKS.g[(iz + dz) * GN + ix + dx]; if (!cell) continue;
    for (let k = 0; k < cell.length; k += 3) {
      const ddx = p.x - cell[k], ddz = p.z - cell[k + 1], tr = cell[k + 2] + rad, d2 = ddx * ddx + ddz * ddz;
      if (d2 < tr * tr && d2 > 1e-6) { const d = Math.sqrt(d2); p.x = cell[k] + ddx / d * tr; p.z = cell[k + 1] + ddz / d * tr; hit = true; }
    }
  }
  return hit;
}
function crownsNear(x, z, r) {
  const out = [], ix = clamp(((gxo(x) + W.half) / 25) | 0, 0, CGN - 1), iz = clamp(((z + W.half) / 25) | 0, 0, CGN - 1), k = Math.ceil(r / 25), bo = x > OLDX ? CGN : 0;
  for (let dz = -k; dz <= k; dz++) for (let dx = -k; dx <= k; dx++) {
    const jx = ix + dx, jz = iz + dz; if (jx < 0 || jz < 0 || jx > CGN - 1 || jz > CGN - 1) continue;
    for (const c of CROWNG[(jz + bo) * CGN + jx]) if (Math.hypot(c.x - x, c.z - z) < r) out.push(c);
  }
  return out;
}
