// ================= RIGS & ANIMAL MODELS =================
const PAT_GLSL = `
vec3 hash33(vec3 p){ p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx) * p.zyx); }
float h13(vec3 p){ p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float vn3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(mix(h13(i), h13(i+vec3(1.0,0.0,0.0)), f.x), mix(h13(i+vec3(0.0,1.0,0.0)), h13(i+vec3(1.0,1.0,0.0)), f.x), f.y),
             mix(mix(h13(i+vec3(0.0,0.0,1.0)), h13(i+vec3(1.0,0.0,1.0)), f.x), mix(h13(i+vec3(0.0,1.0,1.0)), h13(i+vec3(1.0,1.0,1.0)), f.x), f.y), f.z); }
vec2 worley(vec3 p){ vec3 i = floor(p), f = fract(p); float d1 = 9.0, d2 = 9.0;
  for (int x = -1; x <= 1; x++) for (int y = -1; y <= 1; y++) for (int z = -1; z <= 1; z++) {
    vec3 g = vec3(float(x), float(y), float(z)); vec3 r = g + hash33(i + g) - f; float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) { d2 = d; } }
  return vec2(sqrt(d1), sqrt(d2)); }
vec4 worlId(vec3 p){ vec3 i = floor(p), f = fract(p); float d1 = 9.0; vec3 hb = vec3(0.0);
  for (int x = -1; x <= 1; x++) for (int y = -1; y <= 1; y++) for (int z = -1; z <= 1; z++) {
    vec3 g = vec3(float(x), float(y), float(z)); vec3 h = hash33(i + g); vec3 r = g + 0.2 + 0.6 * h - f; float d = dot(r, r);
    if (d < d1) { d1 = d; hb = h; } }
  return vec4(sqrt(d1), hb); }
void applyPat(inout vec3 c){
  if (vMask > 2.5) return;
  c *= 0.86 + 0.26 * vn3(vPat * 26.0) * (0.6 + 0.4 * vn3(vPat * 7.0));
  #ifdef FUR
  c *= 0.9 + 0.2 * vn3(vPat * vec3(60.0, 60.0, 13.0));
  #endif
  if (vMask < 0.5) return;
  vec3 p = vPat * uPatScale;
  #if PAT == 1
    if (vMask > 1.2 && vMask < 1.45) { vec3 q = p * 1.9; float sp = smoothstep(0.3, 0.19, length(fract(q) - 0.5 + 0.12 * (vec3(h13(floor(q) + 3.1), h13(floor(q) + 7.7), h13(floor(q) + 1.3)) - 0.5))) * step(0.35, h13(floor(q))); c = mix(c, uPatCol, sp); return; }
    // jaguar rosettes: broken dark rings around a darker tawny centre, sometimes with a dot inside
    vec4 w = worlId(p); float R = 0.26 + 0.09 * w.y, th = 0.082;
    float ring = smoothstep(th, th * 0.4, abs(w.x - R));
    ring *= smoothstep(0.24, 0.4, vn3(p * 4.6 + w.yzw * 11.0));
    c = mix(c, c * vec3(0.8, 0.66, 0.52), smoothstep(R, R * 0.6, w.x) * 0.6);
    float dotc = smoothstep(0.075, 0.04, w.x) * step(0.5, w.z);
    float spot = smoothstep(0.1, 0.06, length(fract(p * 1.7 + 0.5) - 0.5)) * step(R + th * 1.6, w.x) * step(0.72, h13(floor(p * 1.7)));
    c = mix(c, uPatCol, clamp(ring + dotc + spot, 0.0, 1.0));
  #elif PAT == 2
    vec2 w = worley(p * vec3(1.0, 1.0, 0.5)); float e = w.y - w.x;
    c = mix(c, c * 0.6, smoothstep(0.42, 0.22, w.x) * 0.55);
    c = mix(c, uPatCol, smoothstep(0.13, 0.05, e));
  #elif PAT == 3
    vec2 w = worley(p * vec3(1.0, 1.0, 0.7)); c = mix(c, uPatCol, smoothstep(0.38, 0.3, w.x));
  #elif PAT == 4
    float b = abs(fract(p.z + abs(p.x) * 1.4) - 0.5); c = mix(c, uPatCol, smoothstep(0.17, 0.1, b));
  #elif PAT == 5
    vec2 w = worley(p); c = mix(c, uPatCol, smoothstep(0.33, 0.25, w.x));
  #elif PAT == 6
    float b = abs(fract(p.z) - 0.5); c = mix(c, uPatCol, smoothstep(0.2, 0.08, b) * 0.65);
  #elif PAT == 7
    float n1 = vn3(p * 0.9), n2 = vn3(p * 2.1 + 11.0), n3 = vn3(p * 1.4 + 37.0);
    c = mix(c, uPatCol, smoothstep(0.5, 0.56, n1) * 0.9);
    c = mix(c, c * 0.55, smoothstep(0.56, 0.62, n2));
    c = mix(c, c * 1.25 + vec3(0.03, 0.03, 0.0), smoothstep(0.6, 0.66, n3) * 0.7);
  #elif PAT == 8
    float legK = smoothstep(uRing, uRing - 0.18, vPat.y);
    float sz = mix(p.z + p.y * 0.35 + vn3(p * 0.33) * 1.5, p.y * 1.5 + vn3(p * 0.5) * 0.5, legK);
    c = mix(c, uPatCol, smoothstep(0.24, 0.15, abs(fract(sz) - 0.5)));
  #elif PAT == 9
    vec2 w = worley(p); c = mix(c, uPatCol, smoothstep(0.06, 0.13, w.y - w.x));
  #endif
  if (vMask > 1.5 && PAT < 8) { float rg = step(0.5, fract(vPat.z * uRing)); c = mix(c, uPatCol, rg * 0.8); }
}
`;
const AMATS = {};
const TINT1 = new Float32Array(21).fill(1);
const CHAR_U = { uRimCol: { value: new THREE.Color(0, 0, 0) }, uNight: { value: 0 }, uHit: { value: 0 }, uWound: { value: 0 }, uTint: { value: TINT1 } };
const LOOKS = { fur: { spec: '#171512', shin: 9, shine: 0.9 }, wet: { spec: '#5c5c56', shin: 42, shine: 1.15 }, feather: { spec: '#2a2a2a', shin: 16, shine: 0.35 }, cloth: { spec: '#1d1d1d', shin: 11, shine: 0 } };
// fresh: a material of its own (for one person in their own colours) that still shares the compiled program
function animMat(pat, patCol, patScale, ring, look = 'fur', fresh = false) {
  const key = [pat | 0, patCol, patScale, ring, look].join('|'); if (AMATS[key] && !fresh) return AMATS[key];
  const Lk = LOOKS[look] || LOOKS.fur;
  const m = new THREE.MeshPhongMaterial({ vertexColors: true, specular: new THREE.Color(Lk.spec), shininess: Lk.shin });
  m.defines = { PAT: pat | 0 }; if (look === 'fur') m.defines.FUR = 1;
  m.onBeforeCompile = sh => {
    sh.uniforms.uPatCol = { value: new THREE.Color(patCol || '#000000') };
    sh.uniforms.uPatScale = { value: patScale || 1 }; sh.uniforms.uRing = { value: ring || 10 };
    sh.uniforms.uRimCol = CHAR_U.uRimCol; sh.uniforms.uNight = CHAR_U.uNight; sh.uniforms.uHit = CHAR_U.uHit; sh.uniforms.uWound = CHAR_U.uWound; sh.uniforms.uTint = CHAR_U.uTint; sh.uniforms.uShine = { value: Lk.shine };
    // each person's own colours: the slot picks one of seven tints (in the vertex shader, where any index is allowed)
    sh.vertexShader = 'attribute vec3 aPat;\nattribute float aMask;\nattribute float aSlot;\nuniform vec3 uTint[7];\nvarying vec3 vPat;\nvarying float vMask;\nvarying vec3 vTint;\n' +
      sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvPat = aPat; vMask = aMask; vTint = uTint[int(aSlot + 0.5)];');
    let f = sh.fragmentShader;
    f = f.replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= vTint;\napplyPat(diffuseColor.rgb);\nif (vMask > 2.5 && vMask < 3.5) diffuseColor.rgb = vec3(1.0);\nif (uWound > 0.01 && vMask < 2.5) diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.34, 0.025, 0.03), uWound * smoothstep(0.6, 0.72, vn3(vPat * 6.5 + 3.7)));');
    f = f.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n{ float fac = clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0);\n  if (vMask > 2.5 && vMask < 3.5) totalEmissiveRadiance += vec3(0.6);\n  totalEmissiveRadiance += vec3(1.0, 0.28, 0.2) * uHit * 0.75;\n  if (vMask > 3.5) totalEmissiveRadiance += diffuseColor.rgb * uNight * uShine * (0.3 + 1.7 * pow(fac, 3.0)); }');
    const rim = '{ float rf = 1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0); outgoingLight += uRimCol * pow(rf, 3.0) * step(vMask, 2.5); }\n';
    f = f.includes('#include <opaque_fragment>') ? f.replace('#include <opaque_fragment>', rim + '#include <opaque_fragment>') : f.replace('#include <output_fragment>', rim + '#include <output_fragment>');
    sh.fragmentShader = 'uniform vec3 uPatCol;\nuniform float uPatScale;\nuniform float uRing;\nuniform vec3 uRimCol;\nuniform float uNight;\nuniform float uShine;\nuniform float uHit;\nuniform float uWound;\nvarying vec3 vPat;\nvarying float vMask;\nvarying vec3 vTint;\n' + PAT_GLSL + f;
  };
  m.customProgramCacheKey = () => 'anim' + (pat | 0) + look;
  m.userData.args = [pat, patCol, patScale, ring, look];
  if (fresh) { m.userData.own = true; return m; }
  AMATS[key] = m; return m;
}
// the renderer sends a material's uniforms again only when the material changes between two drawings, so a person in
// their own colours draws with a material of their own
function personalMat(tpl) { const a = tpl.mat && tpl.mat.userData.args; return a ? animMat(a[0], a[1], a[2], a[3], a[4], true) : tpl.mat; }

// A rig gathers the parts of a body into one skinned shape. The parts keep their shared corners (an index), so a body
// is a quarter of the points it would be otherwise. A part's colour can carry a slot (skin, hair, clothes...): each
// person then wears their own colours on the same shape (see personTint).
const _rv = new V3(), _rn = new V3(), _rnm = new THREE.Matrix3();
class Rig {
  constructor() { this.pos = []; this.nor = []; this.col = []; this.si = []; this.sw = []; this.msk = []; this.slot = []; this.idx = []; this.bones = []; this.wp = []; this.map = {}; this.base = {}; }
  bone(name, parent, x, y, z) {
    const i = this.bones.length; this.bones.push({ name, parent, p: [x, y, z] });
    const w = new V3(x, y, z); if (parent >= 0) w.add(this.wp[parent]); this.wp.push(w); this.map[name] = i; return i;
  }
  add(geo, m, skin, color, mask) {
    const P = geo.attributes.position.array, N = geo.attributes.normal.array, b0 = this.pos.length / 3;
    if (m) _rnm.getNormalMatrix(m);
    for (let i = 0; i < P.length; i += 3) {
      let x = P[i], y = P[i + 1], z = P[i + 2], nx = N[i], ny = N[i + 1], nz = N[i + 2];
      if (m) { _rv.set(x, y, z).applyMatrix4(m); x = _rv.x; y = _rv.y; z = _rv.z; _rn.set(nx, ny, nz).applyMatrix3(_rnm).normalize(); nx = _rn.x; ny = _rn.y; nz = _rn.z; }
      this.pos.push(x, y, z); this.nor.push(nx, ny, nz); this.msk.push(mask === undefined ? 1 : mask);
      const c = typeof color === 'function' ? color(x, y, z, nx, ny, nz) : color;
      this.col.push(c.r, c.g, c.b); this.slot.push(c.slot || 0);
      if (c.slot && c.base && !this.base[c.slot]) this.base[c.slot] = c.base;
      if (typeof skin === 'number') { this.si.push(skin, 0, 0, 0); this.sw.push(1, 0, 0, 0); }
      else { const s = skin(x, y, z); this.si.push(s[0], s[1], 0, 0); this.sw.push(1 - s[2], s[2], 0, 0); }
    }
    const I = geo.index;
    if (I) for (let i = 0; i < I.count; i++) this.idx.push(b0 + I.array[i]);
    else for (let i = 0, n = P.length / 3; i < n; i++) this.idx.push(b0 + i);
    geo.dispose();
  }
  geometry() {
    const g = new THREE.BufferGeometry(), nv = this.pos.length / 3;
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    const nb = new Int8Array(this.nor.length), cb = new Uint8Array(this.col.length), sb = new Uint8Array(this.sw.length);
    for (let i = 0; i < nb.length; i++) nb[i] = Math.round(clamp(this.nor[i], -1, 1) * 127);
    for (let i = 0; i < cb.length; i++) cb[i] = Math.round(clamp(this.col[i], 0, 1) * 255);
    // the weights of each point add up to exactly one
    for (let i = 0; i < sb.length; i += 4) { let t = 0; for (let k = 1; k < 4; k++) { sb[i + k] = Math.round(clamp(this.sw[i + k], 0, 1) * 255); t += sb[i + k]; } sb[i] = Math.max(0, 255 - t); }
    g.setAttribute('normal', new THREE.BufferAttribute(nb, 3, true));
    g.setAttribute('color', new THREE.BufferAttribute(cb, 3, true));
    g.setAttribute('skinIndex', new THREE.BufferAttribute(Uint8Array.from(this.si), 4));
    g.setAttribute('skinWeight', new THREE.BufferAttribute(sb, 4, true));
    g.setAttribute('aPat', new THREE.BufferAttribute(g.attributes.position.array, 3));   // the shape at rest: the same numbers, kept once
    g.setAttribute('aMask', new THREE.Float32BufferAttribute(this.msk, 1));
    g.setAttribute('aSlot', new THREE.BufferAttribute(Uint8Array.from(this.slot), 1));
    g.setIndex(nv > 65535 ? new THREE.Uint32BufferAttribute(this.idx, 1) : new THREE.Uint16BufferAttribute(this.idx, 1));
    g.computeBoundingSphere(); g.boundingSphere.radius *= 1.7;
    return g;
  }
}
// a colour that belongs to a slot: the shape is built in it, and each person may wear another colour there instead
// (1 skin, 2 hair, 3 the main clothes, 4 the second clothes, 5 the hat or headcloth, 6 a cloak, a robe or a sash)
function slotC(hex, slot) { const c = hex && hex.isColor ? hex.clone() : col(hex); c.slot = slot; c.base = c.clone(); return c; }
function loft(pts, prof, seg) {
  const n = pts.length, pos = [], idx = [], T = new V3(), S = new V3(), U = new V3(), Wv = new V3(0, 1, 0), Zv = new V3(0, 0, 1);
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    T.subVectors(pts[Math.min(n - 1, i + 1)], pts[Math.max(0, i - 1)]).normalize();
    S.crossVectors(Math.abs(T.y) > 0.9 ? Zv : Wv, T).normalize(); U.crossVectors(T, S).normalize();
    const r = prof(t);
    for (let j = 0; j < seg; j++) {
      const a = j / seg * TAU, ca = Math.cos(a) * r[0], sa = Math.sin(a) * r[1];
      pos.push(pts[i].x + S.x * ca + U.x * sa, pts[i].y + S.y * ca + U.y * sa, pts[i].z + S.z * ca + U.z * sa);
    }
  }
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < seg; j++) {
    const j1 = (j + 1) % seg, a = i * seg + j, b = i * seg + j1, c = (i + 1) * seg + j, d = (i + 1) * seg + j1;
    idx.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
function onEll(c, r, d) { const k = 1 / Math.sqrt((d[0] / r[0]) ** 2 + (d[1] / r[1]) ** 2 + (d[2] / r[2]) ** 2); return [c[0] + d[0] * k, c[1] + d[1] * k, c[2] + d[2] * k]; }
function projT(a, b, x, y, z) { const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z, l2 = dx * dx + dy * dy + dz * dz || 1; return ((x - a.x) * dx + (y - a.y) * dy + (z - a.z) * dz) / l2; }
function colors(o) { const C = {}; for (const k in o) C[k] = col(o[k]); return C; }
function addEyes(R, bone, cc, cr, dir, er, eyeC) {
  for (const s of [-1, 1]) {
    const e = onEll(cc, cr, [s * dir[0], dir[1], dir[2]]), en = new V3(e[0] - cc[0], e[1] - cc[1], e[2] - cc[2]).normalize();
    R.add(new THREE.SphereGeometry(er, 10, 8), M([e[0] - en.x * er * 0.35, e[1] - en.y * er * 0.35, e[2] - en.z * er * 0.35]), bone, eyeC, 4);
    R.add(new THREE.SphereGeometry(er * 0.5, 8, 6), M([e[0] + en.x * er * 0.5, e[1] + en.y * er * 0.5, e[2] + en.z * er * 0.5], null, [1, 1.2, 0.6]), bone, col('#070504'), 0);
    R.add(new THREE.SphereGeometry(er * 0.2, 6, 4), M([e[0] + en.x * er * 0.72, e[1] + en.y * er * 0.72 + er * 0.28, e[2] + en.z * er * 0.72]), bone, col('#ffffff'), 3);
  }
}

function buildQuad(o) {
  const R = new Rig(), C = colors(o.c);
  o.bodyR = Math.max(o.chestR, o.hipR);
  const legH = o.legLen, by = legH + o.bodyR * (o.bodyLift ?? 0.25), L = o.L;
  const root = R.bone('root', -1, 0, by, 0);
  const hips = R.bone('hips', root, 0, 0, -L / 2), chest = R.bone('chest', root, 0, 0, L / 2);
  const neck = R.bone('neck', chest, 0, o.chestR * 0.45, o.chestR * 0.55);
  const head = R.bone('head', neck, 0, Math.sin(o.neckUp) * o.neckLen, Math.cos(o.neckUp) * o.neckLen);
  const jaw = R.bone('jaw', head, 0, -o.headR * 0.3 * (o.headSquash || 1), o.headR * 0.4);
  const tails = [];
  if (!o.noTail) {
    const tn = o.tailN || 4, ts = o.tailLen / tn;
    let tp = R.bone('t0', hips, 0, o.hipR * (o.tailY ?? 0.3), -o.hipR * 0.8); tails.push(tp);
    for (let i = 1; i <= tn; i++) { tp = R.bone('t' + i, tp, 0, 0, -ts); tails.push(tp); }
  }
  const up = legH * (o.upFrac || 0.52), lo = legH - up;
  const legs = [['FL', chest, 1], ['FR', chest, -1], ['BL', hips, 1], ['BR', hips, -1]];
  for (const [nm, par, side] of legs) {
    const isF = nm[0] === 'F', fl = isF ? (o.frontLen || 1) : 1;
    const u = R.bone(nm + 'u', par, side * (isF ? o.chestR : o.hipR) * (o.spread || 0.62), legH - by, isF ? (o.frontZ || 0) : (o.backZ || 0));
    R.bone(nm + 'l', u, 0, -up * fl, 0);
  }
  const bellyC = C.belly || C.fur;
  const furFn = (x, y, z, nx, ny, nz) => {
    let c = C.fur;
    if (ny < -0.2) c = mixC(C.fur, bellyC, smooth(-0.2, -0.7, ny));
    if (o.colorFn) c = o.colorFn(c, x, y, z, nx, ny, nz, C, by) || c;
    return c;
  };
  // body
  const z0 = -L / 2 - o.hipR * 0.95, z1 = L / 2 + o.chestR * 0.95, pts = [];
  const prof = t => {
    const z = lerp(z0, z1, t); let r;
    if (z < -L / 2) r = o.hipR * Math.sqrt(Math.max(0, 1 - Math.pow((z + L / 2) / (o.hipR * 0.95), 2)));
    else if (z > L / 2) r = o.chestR * Math.sqrt(Math.max(0, 1 - Math.pow((z - L / 2) / (o.chestR * 0.95), 2)));
    else { const k = (z + L / 2) / L; r = lerp(o.hipR, o.chestR, k) - Math.sin(k * Math.PI) * (o.waist || 0); }
    const ht = o.htF ? lerp(o.htB || 1, o.htF, smooth(-L / 2, L / 2, z)) : (o.ht || 1);
    return [r * (o.wid || 0.85), r * ht];
  };
  const topR = o.chestR * (o.htF || o.ht || 1), minR = o.hipR * (o.htB || o.ht || 1) * 0.75;
  for (let i = 0; i < 16; i++) {
    const t = i / 15, tuck = (o.tuck || 0) * (1 - smooth(0.55, 0.88, t)) * (topR - Math.max(prof(t)[1], minR));
    pts.push(new V3(0, by + (o.arch || 0) * Math.sin(t * Math.PI) + tuck, lerp(z0, z1, t)));
  }
  R.add(loft(pts, prof, 16), null, (x, y, z) => [hips, chest, clamp((z + L / 2) / L, 0, 1)], furFn, 1);
  if (o.blades) for (const s of [-1, 1]) R.add(new THREE.SphereGeometry(1, 10, 8), M([s * o.chestR * 0.4, by + topR * 0.7, L / 2 - o.chestR * 0.12], [0.25, 0, s * 0.2], [o.chestR * 0.3, o.chestR * 0.15, o.chestR * 0.5]), chest, furFn, 1);
  // neck
  const nb = R.wp[neck].clone(), hd = R.wp[head].clone(), np = [];
  for (let i = 0; i <= 5; i++) np.push(nb.clone().lerp(hd, i / 5));
  np[0].add(new V3(0, -o.neckR * 0.4, -o.neckR * 0.7));
  R.add(loft(np, t => { const r = lerp(o.neckR * 1.25, o.neckR * 0.85, t); return [r * (o.neckWid || 0.9), r]; }, 12), null,
    (x, y, z) => { const t = projT(nb, hd, x, y, z); return t < 0.45 ? [chest, neck, smooth(0, 0.45, t)] : [neck, head, smooth(0.55, 1.1, t)]; }, furFn, 1);
  // head
  const H = R.wp[head], hr = o.headR, hs = o.headSquash || 1;
  const cr = [hr * 0.95 * (o.headWid || 1), hr * 0.85 * hs, hr * 1.05], cc = [H.x, H.y + hr * 0.12 * hs, H.z + hr * 0.18];
  const hm = o.headSpots ? 1.3 : 1;
  R.add(new THREE.SphereGeometry(1, 16, 12), M(cc, null, cr), head, C.head || furFn, hm);
  if (o.cheeks) for (const s of [-1, 1]) R.add(new THREE.SphereGeometry(1, 12, 9), M([cc[0] + s * hr * 0.5, cc[1] - hr * 0.26, cc[2] + hr * 0.3], [0, s * 0.3, 0], [hr * 0.44, hr * 0.36, hr * 0.42]), head, C.head || furFn, hm);
  if (o.brow) for (const s of [-1, 1]) { const e = onEll(cc, cr, [s * 0.5, 0.55, 0.68]); R.add(new THREE.SphereGeometry(1, 10, 6), M([e[0], e[1], e[2] - hr * 0.05], [0.3, 0, s * -0.25], [hr * 0.24, hr * 0.085, hr * 0.15]), head, C.head || furFn, hm); }
  const sl = o.snoutLen, sr = o.snoutR, ss = o.snoutSquash || 0.8;
  const sc = [H.x, H.y - hr * 0.05 * hs + (o.snoutY || 0), H.z + hr * 0.7 + sl * 0.5];
  R.add(new THREE.SphereGeometry(1, 14, 10), M(sc, [o.snoutTilt || 0, 0, 0], [sr, sr * ss, sl * 0.62 + hr * 0.25]), head, C.snout || furFn, o.snoutMask ?? 1);
  R.add(new THREE.SphereGeometry(1, 10, 8), M([sc[0], sc[1] + sr * ss * 0.25, sc[2] + sl * 0.62 + hr * 0.18], null, [sr * 0.5 * (o.noseK || 1), sr * 0.36 * ss * (o.noseK || 1), sr * 0.3 * (o.noseK || 1)]), head, C.nose, 0);
  const J = R.wp[jaw];
  R.add(new THREE.SphereGeometry(1, 12, 8), M([J.x, J.y - hr * 0.04, J.z + (sl + hr) * 0.42], null, [sr * 0.82, sr * 0.36 * ss, (sl + hr * 0.4) * 0.56]), jaw, C.jaw || bellyC, 1);
  if (o.teeth) for (const s of [-1, 1]) R.add(new THREE.ConeGeometry(sr * 0.08, sr * 0.35, 4), M([sc[0] + s * sr * 0.45, sc[1] - sr * ss * 0.55, sc[2] + sl * 0.45], [Math.PI, 0, 0]), head, col('#f2eee2'), 0);
  addEyes(R, head, cc, cr, o.eyeDir || [0.55, 0.32, 0.78], hr * (o.eyeR || 0.15), C.eye);
  if (o.ear && o.ear !== 'none') for (const s of [-1, 1]) {
    const e = onEll(cc, cr, [s * (o.earX || 0.55), o.earUp || 0.8, o.earZ || -0.15]), er = o.earR;
    if (o.ear === 'point') R.add(new THREE.ConeGeometry(er, er * 2.4, 6), M([e[0], e[1] + er * 0.8, e[2]], [-0.2, 0, -s * 0.35]), head, furFn, 1);
    else R.add(new THREE.SphereGeometry(1, 10, 8), M([e[0], e[1] + er * 0.45, e[2]], [0.2, s * 0.35, -s * 0.3], [er, er * 1.05, er * 0.38]), head, C.ear || furFn, 1), R.add(new THREE.SphereGeometry(1, 10, 8), M([e[0], e[1] + er * 0.42, e[2] + er * 0.1], [0.2, s * 0.35, -s * 0.3], [er * 0.68, er * 0.74, er * 0.2]), head, C.earIn || mixC(C.belly || C.fur, col('#d9b9a2'), 0.45), 0);
  }
  // tail
  if (tails.length) {
    const tA = R.wp[tails[0]], tn = tails.length - 1, ts = o.tailLen / tn, tp = [], ext = o.hipR * 0.35;
    for (let i = 0; i <= 12; i++) tp.push(new V3(tA.x, tA.y, tA.z + ext - (o.tailLen + ext) * i / 12));
    R.add(loft(tp, t => {
      if (t >= 1) return [0.0001, 0.0001];
      const r = lerp(o.tailR, o.tailR * (o.tailTip ?? 0.55), t) * (o.tailBush ? (0.55 + 1.3 * Math.sin(Math.PI * Math.min(1, t * 1.05))) : 1);
      return [r * (o.tailWid || 1), r * (o.tailHt || 1)];
    }, 10), null,
      (x, y, z) => { const s = clamp((tA.z - z) / ts, 0, tn - 0.001), i0 = Math.floor(s); return [tails[i0], tails[i0 + 1], s - i0]; },
      (x, y, z, nx, ny, nz) => { let c = C.tail || furFn(x, y, z, nx, ny, nz); if (C.tailTip && (tA.z - z) > o.tailLen * 0.8) c = C.tailTip; return c; }, o.tailMask ?? 1);
  }
  // legs: one continuous tapered loft per leg, muscled at the top and blended into the body; hind legs bend at the hock
  for (const [nm, par, side] of legs) {
    const isF = nm[0] === 'F', u = R.map[nm + 'u'], l = R.map[nm + 'l'], A = R.wp[u], K = R.wp[l];
    const lr = o.legR * (isF ? 1 : 1.12), fl = isF ? (o.frontLen || 1) : 1, up2 = up * fl, lo2 = lo * fl, legC = C.legs || furFn;
    const bulk = isF ? (o.shoulderK || 1.75) : (o.thighK || 2.05), inX = -side * lr * 0.35;
    const P0 = isF
      ? [[inX, up2 * 0.45, 0.01], [inX * 0.6, up2 * 0.1, 0], [0, -up2 * 0.5, -up2 * 0.07], [0, -up2, -up2 * 0.04], [0, -up2 - lo2 * 0.55, lo2 * 0.02], [0, -up2 - lo2 * 0.92, lo2 * 0.06]]
      : [[inX, up2 * 0.42, -0.01], [inX * 0.6, up2 * 0.08, 0.02], [0, -up2 * 0.5, up2 * 0.13], [0, -up2 * 0.98, -lo2 * 0.06], [0, -up2 - lo2 * 0.5, -lo2 * 0.16], [0, -up2 - lo2 * 0.92, -0.01]];
    const RD = isF ? [bulk * 1.05, bulk, 1.3, 0.98, 0.86, 0.78] : [bulk * 1.08, bulk, 1.42, 0.95, 0.82, 0.76];
    const pts = new THREE.CatmullRomCurve3(P0.map(p => new V3(A.x + p[0], A.y + p[1], A.z + p[2]))).getPoints(16);
    const prof = t => { const f = t * (RD.length - 1), i = Math.min(RD.length - 2, Math.floor(f)), r = lr * lerp(RD[i], RD[i + 1], f - i), fb = t < 0.45 ? lerp(1.3, 1, t / 0.45) : 1; return [r * 0.9, r * fb]; };
    const kY = K.y;
    R.add(loft(pts, prof, 10), null, (x, y, z) => y > A.y - up2 * 0.08 ? [par, u, smooth(A.y + up2 * 0.38, A.y - up2 * 0.08, y)] : y > kY + up2 * 0.1 ? [u, u, 0] : [u, l, smooth(kY + up2 * 0.1, kY - lo2 * 0.12, y)], legC, o.headSpots ? 1.3 : 1);
    const end = pts[pts.length - 1], pz = o.pawR, px = end.x + side * (o.pawOut || 0), py = end.y - lo2 * 0.08;
    R.add(new THREE.SphereGeometry(1, 12, 8), M([px, py + pz * 0.5, end.z + pz * 0.3], null, [pz * (o.pawWid || 1), pz * 0.55, pz * 1.25]), l, C.paw || legC, 1);
    if (o.cheeks) for (let k = -1; k <= 1; k++) R.add(new THREE.SphereGeometry(pz * 0.3, 8, 6), M([px + k * pz * 0.4, py + pz * 0.3, end.z + pz * 1.1]), l, C.paw || legC, 1);
    if (o.claws) for (let k = -1; k <= 1; k++) R.add(new THREE.ConeGeometry(pz * 0.16, pz * (o.clawLen || 0.9), 4), M([K.x + k * pz * 0.4, K.y - lo2 + pz * 0.3, K.z + pz * 1.35], [Math.PI / 2 + 0.6, 0, 0]), l, col('#1d1914'), 0);
  }
  const ctx = { R, root, hips, chest, neck, head, jaw, tails, by, H, hr, cc, cr, sc, sl, sr, ss, C, furFn, L };
  if (o.extra) o.extra(ctx);
  return { kind: 'quad', geo: R.geometry(), mat: animMat(o.pat || 0, o.patCol, o.patScale, o.ring, o.look || (o.pat === 6 ? 'wet' : 'fur')), bones: R.bones, names: R.map, by, legLen: legH, up, lo, L, o };
}

function buildBird(o) {
  const R = new Rig(), C = colors(o.c), r = o.r, len = o.len, hr = o.headR;
  const root = R.bone('root', -1, 0, 0, 0);
  const nk = o.neckLen || 0, lg = o.legLen || 0;   // the long necks and legs of storks, cranes and flamingos
  const neck = R.bone('neck', root, 0, r * 0.5, len * 0.4);
  const head = R.bone('head', neck, 0, hr * 0.7 + nk, hr * 0.3 + nk * 0.15);
  const tail = R.bone('tail', root, 0, r * 0.15, -len * 0.42);
  const wL1 = R.bone('wL1', root, r * 0.72, r * 0.45, len * 0.1), wL2 = R.bone('wL2', wL1, o.span * 0.24, 0, 0);
  const wR1 = R.bone('wR1', root, -r * 0.72, r * 0.45, len * 0.1), wR2 = R.bone('wR2', wR1, -o.span * 0.24, 0, 0);
  const bodyFn = (x, y, z, nx, ny) => { let c = C.body; if (C.belly && ny < 0) c = mixC(C.body, C.belly, smooth(0, -0.6, ny)); if (C.band && Math.abs(z - len * 0.22) < r * 0.25 && ny < 0.3) c = C.band; return c; };
  R.add(new THREE.SphereGeometry(1, 14, 10), M([0, 0, 0], [-0.15, 0, 0], [r * 0.85, r * 0.9, len * 0.5]), (x, y, z) => z > len * 0.18 ? [root, neck, smooth(len * 0.18, len * 0.45, z)] : [root, root, 0], bodyFn, 1);
  const Hp = R.wp[head], hc = [Hp.x, Hp.y, Hp.z];
  if (nk) { const N0 = R.wp[neck], a0 = new V3(N0.x, N0.y - r * 0.15, N0.z - r * 0.1), [nm, nL] = limbM(a0, new V3(Hp.x, Hp.y - hr * 0.4, Hp.z - hr * 0.2)); R.add(new THREE.CylinderGeometry(hr * 0.42, r * 0.34, nL, 8), nm, neck, C.neck || C.head || C.body, 1); }
  R.add(new THREE.SphereGeometry(hr, 12, 10), M(hc), head, (x, y, z, nx, ny, nz) => (C.face && nz > 0.25 && Math.abs(nx) > 0.3) ? C.face : (C.throat && ny < -0.1 && nz > -0.2 ? C.throat : C.head || C.body), 1);
  const bl = o.beakLen;
  if (o.beak === 'toucan') {
    R.add(new THREE.ConeGeometry(hr * 0.62, bl, 10), M([0, Hp.y - hr * 0.05, Hp.z + hr * 0.6 + bl / 2], [Math.PI / 2, 0, 0], [1, 1, 1.25]), head, (x, y, z) => z > Hp.z + hr * 0.6 + bl * 0.82 ? C.beakTip : (y > Hp.y ? C.beak : C.beak2 || C.beak), 0);
    R.add(new THREE.SphereGeometry(hr * 0.3, 8, 6), M([hr * 0.62, Hp.y + hr * 0.15, Hp.z + hr * 0.25], null, [0.35, 1, 1]), head, C.ring, 0);
    R.add(new THREE.SphereGeometry(hr * 0.3, 8, 6), M([-hr * 0.62, Hp.y + hr * 0.15, Hp.z + hr * 0.25], null, [0.35, 1, 1]), head, C.ring, 0);
  } else if (o.beak === 'needle') {
    R.add(new THREE.CylinderGeometry(hr * 0.05, hr * 0.14, bl, 5), M([0, Hp.y, Hp.z + hr * 0.8 + bl / 2], [Math.PI / 2, 0, 0]), head, C.beak, 0);
  } else {
    R.add(new THREE.ConeGeometry(hr * 0.42, bl, 8), M([0, Hp.y + hr * 0.05, Hp.z + hr * 0.75 + bl * 0.4], [Math.PI / 2 + 0.35, 0, 0]), head, C.beak, 0);
    R.add(new THREE.SphereGeometry(hr * 0.3, 8, 6), M([0, Hp.y - hr * 0.2, Hp.z + hr * 0.75], null, [1, 0.8, 1]), head, C.beak2 || C.beak, 0);
  }
  addEyes(R, head, hc, [hr, hr, hr], [0.75, 0.3, 0.55], hr * 0.18, C.eye || col('#120c08'));
  if (o.crest) for (let i = 0; i < 5; i++) R.add(new THREE.ConeGeometry(hr * 0.18, hr * 0.9, 4), M([(i - 2) * hr * 0.25, Hp.y + hr * 0.9, Hp.z - hr * 0.5], [-0.9, 0, (i - 2) * 0.2]), head, C.crest, 1);
  const wingFn = (x) => { const ax = Math.abs(x) / (o.span * 0.5); if (!C.wingMid) return C.wing; return ax < 0.4 ? C.wing : ax < 0.65 ? C.wingMid : C.wingTip; };
  for (const [s, b1, b2] of [[1, wL1, wL2], [-1, wR1, wR2]]) {
    const A = R.wp[b1], ch = o.chord, w1 = o.span * 0.24, w2 = o.span * 0.27;
    const g1 = new THREE.BoxGeometry(w1, Math.max(0.006, r * 0.08), ch, 2, 1, 1);
    R.add(g1, M([A.x + s * w1 / 2, A.y, A.z - ch * 0.3]), b1, (x) => wingFn(x), 1);
    const g2 = new THREE.BoxGeometry(w2, Math.max(0.005, r * 0.06), ch * 0.85, 3, 1, 1), p2 = g2.attributes.position;
    for (let k = 0; k < p2.count; k++) { const t = (p2.getX(k) / w2 + 0.5); p2.setZ(k, p2.getZ(k) * (1 - t * 0.45) - t * ch * 0.12); }
    R.add(g2, M([A.x + s * (w1 + w2 / 2), A.y, A.z - ch * 0.32]), b2, (x) => wingFn(x), 1);
  }
  const tg = new THREE.BoxGeometry(o.tailW, Math.max(0.005, r * 0.06), o.tailLen, 1, 1, 3), tpp = tg.attributes.position;
  for (let k = 0; k < tpp.count; k++) { const t = 0.5 - tpp.getZ(k) / o.tailLen; tpp.setX(k, tpp.getX(k) * (1 - t * (o.tailTaper ?? 0.5))); }
  const TP = R.wp[tail];
  R.add(tg, M([0, TP.y, TP.z - o.tailLen / 2 + r * 0.2]), tail, (x, y, z) => (C.tailTip && z < TP.z - o.tailLen * 0.55) ? C.tailTip : C.tail || C.body, 1);
  const legsB = lg ? R.bone('legs', root, 0, -r * 0.6, len * 0.05) : root, ll = lg || r * 0.7;
  for (const s of [-1, 1]) {
    R.add(new THREE.CylinderGeometry(r * (lg ? 0.05 : 0.07), r * (lg ? 0.045 : 0.06), ll, 5), M([s * r * 0.3, -r * 0.6 - ll / 2, len * 0.05]), legsB, C.legs || col('#3a3a3a'), 0);
    R.add(new THREE.BoxGeometry(r * 0.3, r * 0.06, r * 0.35), M([s * r * 0.3, -r * 0.6 - ll, len * 0.1]), legsB, C.legs || col('#3a3a3a'), 0);
  }
  return { kind: 'bird', geo: R.geometry(), mat: animMat(0, null, 1, 10, 'feather'), bones: R.bones, names: R.map, o, footY: r * 0.63 + ll };
}

function buildFish(o) {
  const R = new Rig(), C = colors(o.c), len = o.len, zs = [len * 0.22, 0, -len * 0.18, -len * 0.32, -len * 0.44], ids = [];
  let prev = -1;
  zs.forEach((z, i) => { const id = R.bone('s' + i, prev, 0, 0, i === 0 ? z : z - zs[i - 1]); ids.push(id); prev = id; });
  const skin = (x, y, z) => {
    if (z >= zs[0]) return [ids[0], ids[0], 0];
    for (let i = 0; i < zs.length - 1; i++) if (z >= zs[i + 1]) return [ids[i], ids[i + 1], (zs[i] - z) / (zs[i] - zs[i + 1])];
    return [ids[4], ids[4], 0];
  };
  const pts = []; for (let i = 0; i <= 20; i++) pts.push(new V3(0, 0, lerp(len * 0.5, -len * 0.47, i / 20)));
  const pk = o.peak || 0.3;
  R.add(loft(pts, t => { const k = t < pk ? Math.sqrt(Math.max(0, 1 - Math.pow((pk - t) / pk, 2))) : lerp(1, 0.16, Math.pow((t - pk) / (1 - pk), 1.1)); return [Math.max(0.0005, o.rx * k), Math.max(0.0005, o.ry * k)]; }, 14), null, skin,
    (x, y, z, nx, ny) => {
      let c = ny > 0.35 ? C.top : C.side;
      if (ny < -0.3) c = mixC(C.side, C.belly, smooth(-0.3, -0.7, ny));
      if (C.rear && z < -len * 0.05) c = mixC(c, C.rear, smooth(-len * 0.05, -len * 0.3, z) * (ny < 0.6 ? 1 : 0.5));
      if (C.throat && z > len * 0.05 && ny < 0) c = mixC(c, C.throat, smooth(0, -0.5, ny));
      return c;
    }, 1);
  if (o.dolphin) {
    R.add(new THREE.CylinderGeometry(o.ry * 0.12, o.ry * 0.28, o.beak, 8), M([0, -o.ry * 0.15, len * 0.5 + o.beak * 0.4], [Math.PI / 2, 0, 0]), ids[0], C.side, 1);
    R.add(new THREE.BoxGeometry(o.rx * 2.6, 0.03, len * 0.12), M([0, 0, -len * 0.5]), ids[4], C.fin, 1);
    for (const s of [-1, 1]) R.add(new THREE.BoxGeometry(o.rx * 0.9, 0.025, o.ry * 0.6), M([s * o.rx * 1.1, -o.ry * 0.4, len * 0.18], [0, s * 0.5, s * 0.5]), ids[0], C.fin, 1);
    R.add(new THREE.BoxGeometry(0.03, o.ry * 0.3, len * 0.18), M([0, o.ry * 0.95, -len * 0.08]), ids[1], C.top, 1);
  } else {
    const tf = new THREE.BoxGeometry(0.012 + o.rx * 0.08, o.ry * 2.0, len * 0.16, 1, 2, 1), tp = tf.attributes.position;
    for (let k = 0; k < tp.count; k++) { const t = 0.5 - tp.getZ(k) / (len * 0.16); tp.setY(k, tp.getY(k) * (0.3 + 0.7 * t)); }
    R.add(tf, M([0, 0, -len * 0.53]), ids[4], C.fin, 1);
    R.add(new THREE.BoxGeometry(0.01 + o.rx * 0.06, o.ry * 0.6, len * (o.dorsal || 0.22)), M([0, o.ry * 0.95, -len * 0.08], [0.2, 0, 0]), ids[1], C.fin, 1);
    R.add(new THREE.BoxGeometry(0.01 + o.rx * 0.06, o.ry * 0.45, len * 0.16), M([0, -o.ry * 0.9, -len * 0.18], [-0.2, 0, 0]), ids[2], C.fin, 1);
    for (const s of [-1, 1]) R.add(new THREE.BoxGeometry(o.rx * 0.8, 0.008, o.ry * 0.5), M([s * o.rx * 1.05, -o.ry * 0.3, len * 0.16], [0, s * 0.6, s * 0.4]), ids[0], C.fin, 1);
  }
  const hc = [0, o.ry * 0.15, len * 0.36];
  addEyes(R, ids[0], [0, 0, len * 0.3], [o.rx * 0.98, o.ry * 0.9, len * 0.2], [0.8, 0.35, 0.5], Math.max(0.012, o.ry * 0.16), C.eye || col('#d8c070'));
  return { kind: 'fish', geo: R.geometry(), mat: animMat(0, null, 1, 10, 'wet'), bones: R.bones, names: R.map, ids, o };
}

function buildSnake(o) {
  const R = new Rig(), C = colors(o.c), nb = o.bones || 12, len = o.len, seg = len / nb, r = o.r, ids = [];
  let prev = -1;
  for (let i = 0; i < nb; i++) { const id = R.bone('s' + i, prev, 0, i === 0 ? r : 0, i === 0 ? len / 2 - seg * 0.5 : -seg); ids.push(id); prev = id; }
  const z0 = len / 2 - seg * 0.5;
  const skin = (x, y, z) => { const s = clamp((z0 - z) / seg, 0, nb - 1.001), i0 = Math.floor(s); return [ids[i0], ids[Math.min(nb - 1, i0 + 1)], s - i0]; };
  const pts = []; for (let i = 0; i <= 44; i++) pts.push(new V3(0, r, lerp(len / 2 + r * 0.5, -len / 2, i / 44)));
  R.add(loft(pts, t => {
    if (t >= 1) return [0.0001, 0.0001];
    let k = t < 0.03 ? Math.sqrt(t / 0.03) * 0.95 : t < 0.07 ? 0.95 - (t - 0.03) * 4 : t < 0.12 ? lerp(0.79, 1, (t - 0.07) / 0.05) : t < 0.72 ? 1 : lerp(1, 0.08, Math.pow((t - 0.72) / 0.28, 1.4));
    if (o.headWide && t < 0.07) k *= 1.25;
    return [r * k * (o.wid || 1), r * k * 0.85];
  }, 12), null, skin, (x, y, z, nx, ny) => ny < -0.35 ? C.belly : C.top, 1);
  if (o.fin) R.add(new THREE.BoxGeometry(0.008, r * 0.9, len * 0.6, 1, 1, 16), M([0, r * 0.1, -len * 0.12]), (x, y, z) => skin(x, y, z), C.fin || C.top, 1);
  addEyes(R, ids[0], [0, r * 1.05, len / 2 - r * 0.2], [r * 0.85, r * 0.6, r * 1.2], [0.7, 0.55, 0.5], r * 0.22, C.eye || col('#c9a83a'));
  return { kind: 'snake', geo: R.geometry(), mat: animMat(o.pat || 0, o.patCol, o.patScale, 10, 'wet'), bones: R.bones, names: R.map, ids, o };
}

function buildFrog(o) {
  const R = new Rig(), C = colors(o.c), s = o.size, by = s * 0.32;
  const root = R.bone('root', -1, 0, by, 0);
  const legs = [];
  for (const [nm, x, z] of [['HL', 1, -1], ['HR', -1, -1], ['FL', 1, 1], ['FR', -1, 1]]) {
    const u = R.bone(nm + 'u', root, x * s * 0.3, -s * 0.05, z * s * 0.28);
    const l = R.bone(nm + 'l', u, x * s * 0.18, -s * 0.1, z > 0 ? s * 0.05 : s * 0.2); legs.push([u, l, x, z]);
  }
  R.add(new THREE.SphereGeometry(1, 14, 10), M([0, by, 0], [-0.25, 0, 0], [s * 0.42, s * 0.3, s * 0.55]), root, C.body, 1);
  R.add(new THREE.SphereGeometry(1, 12, 8), M([0, by + s * 0.05, s * 0.38], null, [s * 0.36, s * 0.24, s * 0.3]), root, C.body, 1);
  for (const x of [-1, 1]) {
    R.add(new THREE.SphereGeometry(s * 0.11, 8, 6), M([x * s * 0.22, by + s * 0.2, s * 0.45]), root, col('#0b0b0b'), 0);
  }
  for (const [u, l, x, z] of legs) {
    const A = R.wp[u], B = R.wp[l];
    const th = z < 0 ? 0.075 : 0.045;
    const [m1, L1] = limbM(A.clone(), B.clone()); R.add(new THREE.CylinderGeometry(s * th, s * th * 0.8, L1, 6), m1, u, C.legs || C.body, 1);
    const F = B.clone().add(new V3(x * s * 0.05, -B.y + s * 0.03, z < 0 ? -s * 0.08 : s * 0.06));
    const [m2, L2] = limbM(B.clone(), F); R.add(new THREE.CylinderGeometry(s * th * 0.7, s * th * 0.6, L2, 6), m2, l, C.legs || C.body, 1);
    R.add(new THREE.SphereGeometry(1, 6, 5), M([F.x, s * 0.02, F.z], null, [s * 0.09, s * 0.025, s * 0.09]), l, C.legs || C.body, 1);
  }
  return { kind: 'frog', geo: R.geometry(), mat: animMat(o.pat || 0, o.patCol, o.patScale, 10, 'wet'), bones: R.bones, names: R.map, by, o };
}

function makeSkinned(tpl) {
  const bones = tpl.bones.map(d => { const b = new THREE.Bone(); b.position.fromArray(d.p); return b; });
  tpl.bones.forEach((d, i) => { if (d.parent >= 0) bones[d.parent].add(bones[i]); });
  freeAfterUpload(tpl.geo);
  const mesh = new THREE.SkinnedMesh(tpl.geo, tpl.mat);
  mesh.add(bones[0]); mesh.updateMatrixWorld(true);
  mesh.bind(new THREE.Skeleton(bones));
  if ('boundingSphere' in mesh) mesh.boundingSphere = tpl.geo.boundingSphere.clone();
  mesh.castShadow = true;
  const B = {}; for (const k in tpl.names) B[k] = bones[tpl.names[k]];
  bones.forEach(b => { b.userData.rest = b.position.clone(); });
  return { mesh, B, bones };
}

// ================= SPECIES =================
const SPECIES = {
  jaguar: { he: 'יגואר', lat: 'Panthera onca', kind: 'quad', ai: 'pred', hp: 160, dmg: 30, walk: 2.4, run: 11.5, swim: 3.2, reach: 2.3, atkCD: 0.75, sense: 42, food: 80, turn: 6, prey: ['capybara', 'tapir', 'peccary', 'caiman', 'anteater', 'agouti', 'coati', 'otter', 'ocelot'], count: 4, group: [1, 1], hab: 'forest', size: [0.94, 1.08], danger: 3, night: 0.7, swimmer: true, call: 'jaguar', diet: 'טורף על',
    guide: 'החתול הגדול ביבשת אמריקה. הנשיכה שלו מפצחת שריון צב וגולגולת, והוא שחיין מצוין שצד אפילו קיימנים.',
    pl: { desc: 'הטורף החזק בג׳ונגל. נשיכה אחת יכולה להכריע כמעט כל חיה, והוא שוחה מצוין. אבל גוף גדול צריך הרבה בשר.', stats: [5, 3, 3, 4], risk: 'סכנות: אנקונדות, קיימנים גדולים ויגוארים יריבים.' } },
  puma: { he: 'פומה', lat: 'Puma concolor', kind: 'quad', ai: 'pred', hp: 130, dmg: 24, walk: 2.6, run: 13.5, swim: 2.3, reach: 2.2, atkCD: 0.7, sense: 40, food: 65, turn: 7, prey: ['capybara', 'peccary', 'agouti', 'coati', 'anteater', 'otter', 'ocelot'], count: 3, group: [1, 1], hab: 'forest', size: [0.94, 1.06], danger: 3, night: 0.6, call: 'puma', diet: 'טורף',
    guide: 'קופצנית מדהימה שמזנקת לגובה של יותר מחמישה מטרים. היא לא שואגת אלא צורחת, מגרגרת ושורקת.',
    pl: { desc: 'מהירה וקופצנית, ציידת של זינוק קצר. בורחת מכל צרה, אבל לא אוהבת מים.', stats: [4, 5, 3, 2], risk: 'סכנות: יגוארים, קיימנים ואנקונדות.' } },
  ocelot: { he: 'אוצלוט', lat: 'Leopardus pardalis', kind: 'quad', ai: 'pred', hp: 70, dmg: 13, walk: 2.0, run: 10.5, swim: 2.2, reach: 1.45, atkCD: 0.55, sense: 32, food: 25, turn: 8, prey: ['agouti', 'coati', 'otter', 'macaw', 'toucan'], count: 4, group: [1, 1], hab: 'forest', size: [0.92, 1.08], danger: 1, night: 0.9, call: 'ocelot', diet: 'טורף קטן', stealth: 0.75,
    guide: 'חתול בר קטן ושקט שצד בעיקר בלילה מכרסמים, ציפורים ודגים. לכל אוצלוט יש דוגמת כתמים ייחודית משלו.',
    pl: { desc: 'קטן, שקט וחמקן. צד אגוטים וקואטים ונזהר מכל מי שגדול ממנו.', stats: [2, 4, 5, 2], risk: 'סכנות: יגוארים, פומות, עיטי הארפיה ונחשים.' } },
  caiman: { he: 'קיימן', lat: 'Caiman crocodilus', kind: 'quad', ai: 'croc', hp: 150, dmg: 32, walk: 1.3, run: 4.5, swim: 6.5, reach: 2.2, atkCD: 1.1, sense: 26, food: 70, turn: 3, prey: ['capybara', 'tapir', 'peccary', 'agouti', 'coati', 'otter', 'jaguar', 'puma', 'ocelot', 'anteater'], count: 11, group: [1, 1], hab: 'water', size: [0.85, 1.15], danger: 3, swimmer: true, call: 'caiman', diet: 'טורף',
    guide: 'צייד מארב. מחכה מתחת למים כשרק העיניים והנחיריים בחוץ, ומזנק על חיות שבאות לשתות.',
    pl: { desc: 'שליט המים. איטי וכבד ביבשה, אבל מתחת לפני המים הוא כמעט בלתי נראה וקטלני.', stats: [5, 2, 4, 5], risk: 'סכנות: יגוארים שצדים קיימנים, ואנקונדות ענק.' } },
  anaconda: { he: 'אנקונדה', lat: 'Eunectes murinus', kind: 'snake', ai: 'snake', hp: 140, dmg: 11, walk: 1.0, run: 3.0, swim: 2.2, reach: 3.2, atkCD: 1, sense: 18, food: 60, turn: 2.5, prey: ['capybara', 'peccary', 'agouti', 'coati', 'caiman', 'ocelot', 'otter', 'puma', 'jaguar'], count: 4, group: [1, 1], hab: 'shore', size: [0.85, 1.15], danger: 3, swimmer: true, diet: 'טורף',
    guide: 'הנחש הכבד בעולם. אין לה ארס: היא נכרכת סביב הטרף ומהדקת עד שהוא מפסיק לנשום.' },
  harpy: { he: 'עיט הארפיה', lat: 'Harpia harpyja', kind: 'bird', ai: 'raptor', hp: 60, dmg: 20, fly: 15, reach: 1.6, sense: 90, food: 20, prey: ['howler', 'squirrel', 'sloth', 'agouti', 'coati', 'macaw', 'toucan'], count: 2, group: [1, 1], hab: 'air', size: [0.95, 1.05], danger: 2, diet: 'טורף',
    guide: 'העוף הדורס החזק בג׳ונגל. הטפרים שלו גדולים כמו טפרי דוב, והוא חוטף קופים ועצלנים ישר מצמרות העצים.', pl: { desc: 'העוף הדורס החזק ביבשת. טפרים ענקיים, צלילה מהירה בין הצמרות, ונשיאת הטרף אל ענף כדי לאכול בשקט.', stats: [5, 4, 4, 5], risk: 'סכנות: עיטים יריבים על השטח, ורעב כשהקופים מתחבאים.', over: { hp: 100, dmg: 26, walk: 0.8, reach: 1.4, atkCD: 0.9, prey: ['howler', 'squirrel', 'sloth', 'agouti', 'coati', 'macaw', 'toucan', 'capybara', 'frog'], stealth: 0.9, call: 'screech' } } },
  macaw: { he: 'ארה אדום', lat: 'Ara macao', kind: 'bird', ai: 'flock', hp: 10, fly: 12, food: 7, count: 21, group: [7, 7], hab: 'air', size: [0.95, 1.05], danger: 0, sense: 22, diet: 'זרעים ופירות',
    guide: 'תוכי ענק ורועש שעף בזוגות ובלהקות. הארות מתאספות על גדות חימר ואוכלות אדמה כדי לנטרל רעלים מהזרעים שהן אוכלות.', pl: { desc: 'תוכי ענק בצבעי אש. עף מהר מעל הצמרות, אוכל פירות וזרעים, ובבוקר מתאסף על קיר החרסית. בן זוג אחד לכל החיים.', stats: [1, 4, 2, 4], risk: 'סכנות: עיט הארפיה מהשמיים, ואוצלוטים כשנוחתים על הקרקע.', over: { hp: 34, dmg: 4, walk: 0.7, reach: 0.5, atkCD: 0.6, prey: [], stealth: 1.2, call: 'macaw' } } },
  toucan: { he: 'טוקן', lat: 'Ramphastos toco', kind: 'bird', ai: 'perch', hp: 8, fly: 9, food: 5, count: 9, group: [1, 1], hab: 'air', size: [0.95, 1.05], danger: 0, sense: 14, diet: 'פירות וביצים',
    guide: 'המקור הענק קל להפליא, מבנה ספוגי מלא אוויר. הוא עוזר לטוקן לקטוף פירות ולפזר חום.', pl: { desc: 'מקור ענק וקל כמו ספוג. מדלג בין העצים ומגיע לפירות שאחרים לא מגיעים אליהם.', stats: [1, 3, 3, 3], risk: 'סכנות: עיט הארפיה, ואוצלוטים על הקרקע.', over: { hp: 30, dmg: 4, walk: 0.7, reach: 0.5, atkCD: 0.6, prey: ['frog'], stealth: 1, call: 'toucan' } } },
  howler: { he: 'קוף מיילל', lat: 'Alouatta seniculus', kind: 'quad', ai: 'troop', hp: 30, food: 18, count: 15, group: [5, 5], hab: 'canopy', size: [0.9, 1.1], danger: 0, diet: 'עלים ופירות',
    guide: 'היללה שלו נשמעת למרחק של קילומטרים. בבוקר ובערב הלהקה מייללת יחד כדי לסמן לשכנים את גבולות השטח.' },
  sloth: { he: 'עצלן', lat: 'Bradypus variegatus', kind: 'quad', ai: 'sloth', hp: 30, food: 20, count: 9, group: [1, 1], hab: 'hang', size: [0.9, 1.1], danger: 0, diet: 'עלים',
    guide: 'זז כל כך לאט שאצות צומחות לו בפרווה ונותנות לו גוון ירקרק. יורד מהעץ בערך פעם בשבוע.' },
  capybara: { he: 'קפיברה', lat: 'Hydrochoerus hydrochaeris', kind: 'quad', ai: 'herb', hp: 75, dmg: 7, walk: 1.6, run: 9, swim: 3.6, reach: 1.25, atkCD: 0.9, sense: 28, safe: 55, food: 55, turn: 5, count: 26, group: [5, 8], hab: 'shore', size: [0.9, 1.1], danger: 0, swimmer: true, call: 'capy', diet: 'צמחוני', herbivore: true,
    guide: 'המכרסם הגדול בעולם. חי בקבוצות ליד המים, שוחה מצוין ומסוגל להישאר מתחת למים כמה דקות כדי להימלט מטורפים.',
    pl: { desc: 'צמחוני ששורד בזכות אוזניים חדות והמים. מלחך עשב, צולל ונעלם מתחת לפני המים.', stats: [1, 3, 2, 5], risk: 'סכנות: כמעט כולם, ובמיוחד יגוארים, קיימנים ואנקונדות.' } },
  tapir: { he: 'טפיר', lat: 'Tapirus terrestris', kind: 'quad', ai: 'herb', hp: 140, dmg: 16, walk: 1.5, run: 8.5, swim: 2.8, reach: 1.8, atkCD: 1.2, sense: 26, safe: 60, food: 90, turn: 4, count: 7, group: [1, 1], hab: 'forest', size: [0.9, 1.08], danger: 1, swimmer: true, fight: 0.3, diet: 'צמחוני',
    guide: 'היונק היבשתי הגדול בדרום אמריקה. האף והשפה העליונה יוצרים חדק קצר שבעזרתו הוא קוטף עלים ופירות.' },
  peccary: { he: 'פקארי', lat: 'Tayassu pecari', kind: 'quad', ai: 'herb', hp: 55, dmg: 9, walk: 1.8, run: 9, swim: 2, reach: 1.3, atkCD: 0.8, sense: 26, safe: 50, food: 40, turn: 6, count: 20, group: [8, 10], hab: 'forest', size: [0.9, 1.1], danger: 2, fight: 0.85, herd: true, diet: 'כל-אוכל',
    guide: 'חי בעדרים גדולים שמתגוננים יחד. כשהעדר מאוים הם מקישים בשיניים, ואפילו יגואר נזהר מהם.' },
  anteater: { he: 'נמלן ענק', lat: 'Myrmecophaga tridactyla', kind: 'quad', ai: 'herb', hp: 85, dmg: 18, walk: 1.2, run: 6, swim: 1.8, reach: 1.6, atkCD: 1.1, sense: 22, safe: 40, food: 50, turn: 3.5, count: 4, group: [1, 1], hab: 'forest', size: [0.92, 1.08], danger: 1, fight: 0.7, diet: 'נמלים וטרמיטים',
    guide: 'אין לו שיניים בכלל. הלשון שלו באורך של כ-60 ס״מ, והציפורניים הקדמיות מסוכנות גם ליגואר.' },
  otter: { he: 'לוטרת ענק', lat: 'Pteronura brasiliensis', kind: 'quad', ai: 'herb', hp: 45, dmg: 9, walk: 1.6, run: 6, swim: 5.5, reach: 1.2, atkCD: 0.7, sense: 26, safe: 45, food: 30, turn: 6, count: 10, group: [4, 5], hab: 'shore', size: [0.9, 1.1], danger: 1, swimmer: true, fight: 0.6, waterLover: true, diet: 'דגים',
    guide: 'צדה דגים בקבוצות משפחתיות רועשות. אפשר לזהות כל לוטרה לפי הכתם הלבן הייחודי על הגרון.' },
  coati: { he: 'קואטי', lat: 'Nasua nasua', kind: 'quad', ai: 'herb', hp: 25, dmg: 5, walk: 1.7, run: 7.5, swim: 1.5, reach: 1, atkCD: 0.6, sense: 24, safe: 40, food: 15, turn: 7, count: 12, group: [5, 6], hab: 'forest', size: [0.9, 1.1], danger: 0, diet: 'כל-אוכל',
    guide: 'מחטט באדמה עם חוטם גמיש ומסתובב בלהקות של נקבות וצעירים. הזנב המטבעתי מורם למעלה כמו דגל.' },
  frog: { he: 'צפרדע חץ רעל', lat: 'Dendrobates tinctorius', kind: 'frog', ai: 'frog', hp: 2, food: 2, count: 16, group: [1, 1], hab: 'stream', size: [0.9, 1.1], danger: 1, poison: true, tpls: ['frog', 'frogY'], sense: 4, diet: 'חרקים',
    guide: 'הצבעים העזים הם אזהרה: העור שלה רעיל מאוד. בשום אופן לא לאכול אותה.' },
  piranha: { he: 'פיראנה', lat: 'Pygocentrus nattereri', kind: 'fish', ai: 'school', hp: 4, dmg: 3, swim: 4.5, food: 3, count: 54, group: [9, 9], hab: 'deep', size: [0.85, 1.15], danger: 2, diet: 'כל-אוכל',
    guide: 'שיניים חדות כתער ולהקות גדולות. בדרך כלל אוכלת דגים ופגרים, אבל דם במים מושך אותה.', pl: { desc: 'דג קטן עם שיניים חדות כתער. לבד הוא פגיע, אבל כשהוא נושך, כל הלהקה שלו מצטרפת לטירוף.', stats: [2, 5, 3, 5], risk: 'סכנות: דולפינים, ארפאימות, קיימנים וחניתות של ציידים.', over: { hp: 36, dmg: 6, swim: 4.2, run: 7.8, reach: 0.5, atkCD: 0.4, prey: ['pacu', 'capybara', 'agouti', 'coati', 'peccary'], stealth: 0.85 } } },
  arapaima: { he: 'ארפאימה', lat: 'Arapaima gigas', kind: 'fish', ai: 'bigfish', prey: ['pacu', 'piranha'], dmg: 12, hp: 60, swim: 2.5, food: 50, count: 6, group: [1, 1], hab: 'deep', size: [0.85, 1.1], danger: 0, diet: 'דגים',
    guide: 'מדגי המים המתוקים הגדולים בעולם. הוא חייב לעלות לפני המים ולנשום אוויר כל כמה דקות.', pl: { desc: 'ענק של מים מתוקים שבולע דגים שלמים. הוא חייב לעלות לפני המים לנשום, ואז כולם רואים אותו.', stats: [4, 2, 3, 4], risk: 'סכנות: חניתות של ציידים, קיימנים וחוסר אוויר.', over: { hp: 110, dmg: 16, swim: 2.8, run: 6.2, reach: 0.9, atkCD: 0.8, prey: ['pacu', 'piranha', 'frog'], air: 85, stealth: 0.9 } } },
  dolphin: { he: 'דולפין ורוד', lat: 'Inia geoffrensis', kind: 'fish', ai: 'dolphin', prey: ['pacu', 'piranha'], dmg: 15, hp: 120, swim: 4.5, food: 0, count: 4, group: [1, 1], hab: 'deep', size: [0.9, 1.1], danger: 0, diet: 'דגים',
    guide: 'דולפין נהרות שהצבע הוורוד שלו מתחזק עם הגיל. הצוואר הגמיש מאפשר לו לתמרן בין שורשים של יער מוצף.' },
  pacu: { he: 'פאקו', lat: 'Piaractus brachypomus', kind: 'fish', ai: 'shoal', hp: 8, swim: 3.4, food: 12, count: 48, group: [6, 6], hab: 'deep', size: [0.85, 1.2], danger: 0, diet: 'פירות וזרעים',
    guide: 'קרוב משפחה צמחוני של הפיראנה, עם שיניים שנראות כמעט כמו של אדם. להקות פאקו מחכות ליד הגדה לפירות שנופלים למים, ולכן הן טרף טוב לחתולים סבלניים.' },
  hunter: { he: 'צייד', lat: 'Homo sapiens', kind: 'human', ai: 'hunter', hp: 185, dmg: 22, walk: 1.5, run: 5.4, swim: 1.2, reach: 1.8, atkCD: 1.3, sense: 40, food: 0, count: 0, group: [1, 1], hab: 'forest', size: [0.95, 1.05], danger: 3, diet: 'בשר, דגים ופירות',
    guide: 'ציידים עם חניתות, רשתות וחבלים. הם צדים קפיברות ודגים, ומאלפים חיות צעירות שהולכות אחריהם. הם מגינים על עצמם בחנית, וחיה חלשה או ישנה עלולה להיתפס ברשת. אפשר להבריח אותם, ואז החיות המאולפות שלהם משתחררות.', pl: { desc: 'בן אדם עם חנית, רשת וחבל. חלש מיגואר, אבל זורק חניתות מרחוק, דג בנהר ומאלף חיות שהולכות איתו ונלחמות לצידו.', stats: [3, 2, 3, 2], risk: 'סכנות: יגוארים, קיימנים, אנקונדות ופיראנות במים.', over: { hp: 130, dmg: 16, walk: 1.6, run: 5.6, swim: 1.3, reach: 1.9, atkCD: 0.9, prey: ['capybara', 'peccary', 'agouti', 'tapir', 'coati', 'pacu'], stealth: 0.9 } } },
  agouti: { he: 'אגוטי', lat: 'Dasyprocta punctata', kind: 'quad', ai: 'herb', hp: 15, dmg: 2, walk: 1.8, run: 9.5, swim: 1.5, reach: 0.8, atkCD: 1, sense: 26, safe: 40, food: 12, turn: 8, count: 14, group: [1, 2], hab: 'forest', size: [0.9, 1.1], danger: 0, diet: 'זרעים ופירות',
    guide: 'מכרסם קטן שקובר אגוזים ושוכח חלק מהם. כך הוא שותל בלי לדעת עצים חדשים בג׳ונגל.' },
  squirrel: { he: 'קוף סנאי', lat: 'Saimiri sciureus', kind: 'quad', ai: 'troop', hp: 10, food: 6, count: 16, group: [8, 8], hab: 'canopy', size: [0.9, 1.1], danger: 0, diet: 'חרקים ופירות',
    guide: 'קוף קטן וזריז שנע בלהקות גדולות, לפעמים של עשרות פרטים, ומחפש חרקים ופירות.' },
  hummer: { he: 'יונק דבש', lat: 'Trochilidae', kind: 'bird', ai: 'hummer', hp: 1, food: 0, count: 8, group: [1, 1], hab: 'air', size: [1, 1], danger: 0, diet: 'צוף',
    guide: 'מנפנף בכנפיים עשרות פעמים בשנייה, מרחף במקום ואפילו עף אחורה.' },
  morpho: { he: 'פרפר מורפו', lat: 'Morpho peleides', kind: 'fx', count: 0, danger: 0, diet: 'פירות רקובים',
    guide: 'הכחול המבריק לא בא מצבע, אלא ממבנה זעיר בכנפיים ששובר את האור.' },
  viper: { he: 'צפע ראש־חנית', lat: 'Bothrops atrox', kind: 'snake', ai: 'viper', hp: 15, dmg: 8, walk: 0.6, run: 1.2, swim: 0.8, reach: 1.8, atkCD: 2, sense: 2.4, food: 4, turn: 2, count: 7, group: [1, 1], hab: 'forest', size: [0.9, 1.1], danger: 3, venom: true, diet: 'מכרסמים',
    guide: 'מהנחשים המסוכנים באמריקה. הדוגמה שלו מסוואת אותו מצוין בין העלים, אז שים לב איפה אתה דורך.' },
  eel: { he: 'צלופח חשמלי', lat: 'Electrophorus electricus', kind: 'snake', ai: 'eel', hp: 30, dmg: 14, swim: 1.6, reach: 4, food: 15, count: 5, group: [1, 1], hab: 'deep', size: [0.9, 1.1], danger: 2, diet: 'דגים',
    guide: 'בכלל לא צלופח אלא דג סכין. הוא מסוגל להפיק מכת חשמל של מאות וולטים.', pl: { desc: 'מכת חשמל שמשתקת כל מה שנמצא סביבו במים. איטי ורואה רע, אבל אף אחד לא רוצה לגעת בו. גם הוא חייב לעלות לנשום.', stats: [4, 1, 4, 3], risk: 'סכנות: קיימנים, אנקונדות, חניתות של ציידים וחוסר אוויר.', over: { hp: 60, dmg: 9, swim: 2.0, run: 4.4, reach: 0.6, atkCD: 0.8, prey: ['pacu', 'piranha', 'frog'], air: 65, stealth: 0.75 } } }
};
const GUIDE_ORDER = ['jaguar', 'puma', 'ocelot', 'caiman', 'anaconda', 'harpy', 'macaw', 'toucan', 'howler', 'sloth', 'capybara', 'tapir', 'peccary', 'anteater', 'otter', 'coati', 'frog', 'piranha', 'pacu', 'arapaima', 'dolphin', 'agouti', 'squirrel', 'hummer', 'morpho', 'viper', 'eel', 'hunter'];
const PLAYABLE = ['jaguar', 'puma', 'ocelot', 'capybara', 'caiman', 'hunter', 'harpy', 'macaw', 'toucan', 'piranha', 'arapaima', 'eel'];
const NAMES = { f: ['לונה', 'מאיה', 'נאיה', 'זארה', 'טאירה', 'קיארה', 'אינטי', 'סולה', 'אמליה', 'ניה', 'יארה', 'קאיה'], m: ['ריו', 'טאיו', 'אמארו', 'קאי', 'זורו', 'נאו', 'טופא', 'ראמון', 'צ׳אקו', 'אורו', 'ברוּ', 'טיקו'] };

const TPL = {};
function buildTemplates() {
  TPL.jaguar = buildQuad({ cheeks: true, brow: true, L: 0.95, chestR: 0.27, hipR: 0.25, waist: 0.03, wid: 0.8, legLen: 0.47, legR: 0.066, pawR: 0.084, neckLen: 0.22, neckR: 0.12, neckUp: 0.42, headR: 0.146, snoutLen: 0.062, snoutR: 0.07, snoutSquash: 0.72, snoutY: -0.008, noseK: 0.62, headWid: 1.08, headSquash: 0.92, headSpots: true, ear: 'round', earR: 0.043, earX: 0.62, earUp: 0.7, earZ: -0.28, tuck: 0.35, htF: 1.2, htB: 0.95, blades: true, tailLen: 0.75, tailR: 0.043, tailN: 4, tailTip: 0.75, eyeR: 0.13, eyeDir: [0.5, 0.3, 0.82], teeth: true, c: { fur: '#c8903f', belly: '#efe3c8', nose: '#5e3b2e', eye: '#d6b83a', jaw: '#ede0c4', snout: '#dcbd8a' }, pat: 1, patCol: '#1e150c', patScale: 7.0 });
  TPL.puma = buildQuad({ cheeks: true, brow: true, L: 0.95, chestR: 0.23, hipR: 0.22, waist: 0.03, wid: 0.78, legLen: 0.53, legR: 0.055, pawR: 0.072, neckLen: 0.25, neckR: 0.105, neckUp: 0.4, headR: 0.118, snoutLen: 0.058, snoutR: 0.063, snoutSquash: 0.72, snoutY: -0.007, noseK: 0.62, headWid: 1.05, headSquash: 0.92, ear: 'round', earR: 0.046, earX: 0.62, earUp: 0.72, earZ: -0.28, tuck: 0.42, htF: 1.12, htB: 0.92, blades: true, tailLen: 0.85, tailR: 0.045, tailN: 4, tailTip: 0.9, teeth: true, c: { fur: '#b8895c', belly: '#ece0cc', nose: '#b8796a', eye: '#cda640', jaw: '#f0e8da', snout: '#e8dccb', tailTip: '#3a2a1e' } });
  TPL.ocelot = buildQuad({ cheeks: true, brow: true, L: 0.55, chestR: 0.145, hipR: 0.135, waist: 0.015, wid: 0.8, legLen: 0.26, legR: 0.034, pawR: 0.045, neckLen: 0.13, neckR: 0.068, neckUp: 0.42, headR: 0.083, snoutLen: 0.036, snoutR: 0.041, snoutSquash: 0.72, noseK: 0.62, headWid: 1.06, headSquash: 0.92, ear: 'round', earR: 0.04, earX: 0.6, earUp: 0.74, earZ: -0.26, tuck: 0.35, htF: 1.1, htB: 0.94, blades: true, tailLen: 0.36, tailR: 0.024, tailN: 4, eyeR: 0.16, teeth: true, c: { fur: '#cfab6e', belly: '#f2e9d8', nose: '#a8685a', eye: '#b9a43a', jaw: '#f2e9d8', snout: '#eadcbe' }, pat: 2, patCol: '#25170d', patScale: 11, tailMask: 2, ring: 14 });
  TPL.capybara = buildQuad({ L: 0.6, chestR: 0.26, hipR: 0.3, waist: -0.03, wid: 0.92, legLen: 0.29, legR: 0.058, pawR: 0.06, neckLen: 0.1, neckR: 0.17, neckUp: 0.2, headR: 0.14, headWid: 0.85, snoutLen: 0.17, snoutR: 0.115, snoutSquash: 0.95, ear: 'round', earR: 0.03, earUp: 0.95, noTail: true, eyeR: 0.13, eyeDir: [0.7, 0.55, 0.45], c: { fur: '#8a6b48', belly: '#a2845d', nose: '#33251b', eye: '#1a120c', jaw: '#8f7150' } });
  TPL.tapir = buildQuad({ L: 1.0, chestR: 0.31, hipR: 0.36, wid: 0.84, legLen: 0.47, legR: 0.07, pawR: 0.07, neckLen: 0.22, neckR: 0.19, neckUp: 0.12, headR: 0.16, snoutLen: 0.2, snoutR: 0.095, ear: 'round', earR: 0.05, tailLen: 0.06, tailR: 0.035, tailN: 1, c: { fur: '#3b3634', belly: '#4a4341', nose: '#2b2523', eye: '#120e0c', ear: '#8e8780' },
    extra: k => {
      const tip = [k.sc[0], k.sc[1], k.sc[2] + k.sl * 0.62 + k.hr * 0.12];
      k.R.add(new THREE.CylinderGeometry(0.032, 0.055, 0.2, 8), M([tip[0], tip[1] - 0.05, tip[2] + 0.05], [Math.PI / 2 + 0.7, 0, 0]), k.head, k.C.fur, 1);
      const nb = k.R.wp[k.neck], hd = k.R.wp[k.head], [m, L] = limbM(nb.clone().add(new V3(0, 0.17, -0.05)), hd.clone().add(new V3(0, 0.13, 0)));
      k.R.add(new THREE.BoxGeometry(0.03, L, 0.06), m, k.neck, col('#1f1b1a'), 1);
    } });
  TPL.peccary = buildQuad({ L: 0.48, chestR: 0.2, hipR: 0.17, wid: 0.78, legLen: 0.3, legR: 0.03, pawR: 0.035, neckLen: 0.11, neckR: 0.13, neckUp: 0.02, headR: 0.1, snoutLen: 0.17, snoutR: 0.06, snoutTilt: 0.15, ear: 'point', earR: 0.03, tailLen: 0.04, tailR: 0.02, tailN: 1, eyeR: 0.11, arch: 0.04, c: { fur: '#3d3532', belly: '#4a403b', nose: '#c4b2a2', eye: '#140e0c', jaw: '#e7e1d4' },
    extra: k => { for (let i = 0; i < 8; i++) { const z = lerp(-0.24, 0.3, i / 7); k.R.add(new THREE.BoxGeometry(0.02, 0.07, 0.07), M([0, k.by + 0.2 + 0.04 * Math.sin(i / 7 * Math.PI), z]), z < 0 ? k.hips : k.chest, col('#1c1816'), 1); } } });
  TPL.anteater = buildQuad({ L: 0.85, chestR: 0.24, hipR: 0.24, wid: 0.7, legLen: 0.42, legR: 0.06, pawR: 0.07, neckLen: 0.24, neckR: 0.13, neckUp: 0.08, headR: 0.085, snoutLen: 0.36, snoutR: 0.042, snoutSquash: 0.9, ear: 'round', earR: 0.022, tailLen: 0.75, tailR: 0.09, tailHt: 2.2, tailWid: 0.4, tailBush: true, tailN: 4, tailTip: 0.8, claws: true, clawLen: 1.6, eyeR: 0.1, c: { fur: '#5d544a', belly: '#4b4239', nose: '#1b1713', eye: '#0f0b09', legs: '#bdb4a0', paw: '#3a332c' },
    colorFn: (c, x, y, z, nx, ny, nz, C, by) => { if (z < -0.25) return c; const a = Math.abs((z - 0.32) + (y - by) * 1.3); if (a < 0.055) return col('#151210'); if (a < 0.09) return col('#d9d1bf'); return c; } });
  TPL.otter = buildQuad({ L: 0.72, chestR: 0.13, hipR: 0.14, wid: 0.95, legLen: 0.14, legR: 0.042, pawR: 0.058, pawWid: 1.3, neckLen: 0.2, neckR: 0.11, neckUp: 0.22, headR: 0.095, headWid: 1.1, headSquash: 0.85, snoutLen: 0.05, snoutR: 0.068, ear: 'round', earR: 0.018, tailLen: 0.58, tailR: 0.075, tailWid: 1.35, tailHt: 0.55, tailN: 4, tailTip: 0.3, c: { fur: '#3a291e', belly: '#3a291e', nose: '#120c09', eye: '#0c0806', snout: '#4a3628', jaw: '#d6c49d' },
    colorFn: (c, x, y, z, nx, ny) => (z > 0.45 && ny < -0.1) ? col('#d8c7a1') : c });
  TPL.coati = buildQuad({ L: 0.46, chestR: 0.12, hipR: 0.13, wid: 0.82, legLen: 0.22, legR: 0.03, pawR: 0.034, neckLen: 0.1, neckR: 0.075, neckUp: 0.12, headR: 0.068, snoutLen: 0.13, snoutR: 0.028, snoutTilt: -0.15, ear: 'round', earR: 0.02, tailLen: 0.48, tailR: 0.028, tailN: 5, tailTip: 0.55, tailMask: 2, ring: 15, patCol: '#2e1c0e', c: { fur: '#8c5a31', belly: '#c7a378', nose: '#1a120e', eye: '#0e0a08', snout: '#e0d0b4' } });
  TPL.agouti = buildQuad({ L: 0.34, chestR: 0.1, hipR: 0.125, wid: 0.8, legLen: 0.25, legR: 0.02, pawR: 0.024, neckLen: 0.08, neckR: 0.066, neckUp: 0.32, headR: 0.068, snoutLen: 0.07, snoutR: 0.042, ear: 'round', earR: 0.024, noTail: true, eyeR: 0.16, c: { fur: '#a5662c', belly: '#c48c55', nose: '#2a1a10', eye: '#0e0a08' } });
  TPL.howler = buildQuad({ L: 0.36, chestR: 0.15, hipR: 0.125, wid: 0.85, legLen: 0.3, legR: 0.034, pawR: 0.036, frontLen: 1.15, neckLen: 0.06, neckR: 0.085, neckUp: 0.55, headR: 0.1, snoutLen: 0.045, snoutR: 0.06, ear: 'none', tailLen: 0.62, tailR: 0.028, tailN: 6, tailTip: 0.6, eyeR: 0.12, eyeDir: [0.4, 0.25, 0.9], c: { fur: '#8a3b1d', belly: '#73311a', nose: '#20130d', eye: '#120c08', snout: '#2a1a12', head: '#7a3218' },
    extra: k => { const J = k.R.wp[k.jaw]; k.R.add(new THREE.SphereGeometry(1, 10, 8), M([J.x, J.y - 0.05, J.z + 0.03], null, [0.06, 0.075, 0.05]), k.head, k.C.fur, 1); } });
  TPL.squirrel = buildQuad({ L: 0.2, chestR: 0.075, hipR: 0.07, wid: 0.85, legLen: 0.17, legR: 0.017, pawR: 0.018, frontLen: 1.1, neckLen: 0.03, neckR: 0.045, neckUp: 0.5, headR: 0.058, snoutLen: 0.02, snoutR: 0.03, ear: 'round', earR: 0.015, tailLen: 0.38, tailR: 0.012, tailN: 6, tailTip: 0.7, eyeR: 0.16, c: { fur: '#8a8a5c', belly: '#cfc8a6', nose: '#1b1612', eye: '#0e0a08', snout: '#1c1814', head: '#e9e2cd', legs: '#d9a03a', tailTip: '#1b1612' } });
  TPL.sloth = buildQuad({ L: 0.36, chestR: 0.16, hipR: 0.16, wid: 0.92, legLen: 0.42, legR: 0.032, pawR: 0.03, neckLen: 0.07, neckR: 0.1, neckUp: 0.4, headR: 0.095, headWid: 1.05, snoutLen: 0.025, snoutR: 0.055, ear: 'none', tailLen: 0.05, tailR: 0.03, tailN: 1, claws: true, clawLen: 1.8, eyeR: 0.12, eyeDir: [0.42, 0.2, 0.88], c: { fur: '#8f8370', belly: '#7a6f5e', nose: '#2a2018', eye: '#0e0a08', head: '#d7cdb5', snout: '#cfc4aa' },
    extra: k => { for (const s of [-1, 1]) { const e = onEll(k.cc, k.cr, [s * 0.5, 0.18, 0.85]); k.R.add(new THREE.SphereGeometry(1, 8, 6), M([e[0] + s * 0.012, e[1] - 0.005, e[2] - 0.02], [0, s * 0.6, 0], [0.028, 0.018, 0.05]), k.head, col('#3a3026'), 0); } } });
  TPL.caiman = buildQuad({ L: 1.25, chestR: 0.19, hipR: 0.21, wid: 1.3, ht: 0.68, legLen: 0.2, legR: 0.055, pawR: 0.07, pawWid: 1.3, spread: 1.05, neckLen: 0.14, neckR: 0.15, neckUp: 0.0, neckWid: 1.2, headR: 0.13, headWid: 1.25, headSquash: 0.55, snoutLen: 0.42, snoutR: 0.1, snoutSquash: 0.4, ear: 'none', tailLen: 1.35, tailR: 0.15, tailWid: 0.55, tailHt: 1.05, tailN: 5, tailTip: 0.12, eyeR: 0.2, eyeDir: [0.42, 0.85, 0.3], teeth: true, bodyLift: 0.15, c: { fur: '#3f4630', belly: '#b9b08a', nose: '#2a2e20', eye: '#d8c23a', jaw: '#b9b08a' }, pat: 6, patCol: '#232818', patScale: 3.2,
    extra: k => {
      for (let i = 0; i < 9; i++) { const z = lerp(-0.72, 0.65, i / 8); for (const s of [-1, 1]) k.R.add(new THREE.BoxGeometry(0.035, 0.035, 0.07), M([s * 0.07, k.by + 0.13, z]), z < 0 ? k.hips : k.chest, k.C.fur, 1); }
      const t0 = k.R.wp[k.tails[0]], tn = k.tails.length - 1, ts = 1.35 / tn;
      for (let i = 0; i < 13; i++) {
        const f = i / 13, z = t0.z + 0.05 - 1.35 * f, r = lerp(0.15, 0.018, f) * 1.05;
        const sk = () => { const s = clamp((t0.z - z) / ts, 0, tn - 0.001), i0 = Math.floor(s); return [k.tails[i0], k.tails[i0 + 1], s - i0]; };
        k.R.add(new THREE.BoxGeometry(0.02, 0.06 * (1 - f * 0.6), 0.075), M([0, t0.y + r + 0.015, z]), sk, k.C.fur, 1);
      }
    } });
  TPL.harpy = buildBird({ r: 0.2, len: 0.78, headR: 0.11, span: 1.9, chord: 0.46, tailLen: 0.38, tailW: 0.3, tailTaper: 0.2, beak: 'hook', beakLen: 0.09, crest: true, c: { body: '#4b4e53', belly: '#ece8de', band: '#2b2c2f', head: '#a5a5a5', face: '#8f8f8f', beak: '#1b1b1b', legs: '#d9b43c', wing: '#4b4e53', tail: '#3b3d41', crest: '#3a3a3a', eye: '#2a1a0a' } });
  TPL.macaw = buildBird({ r: 0.065, len: 0.34, headR: 0.055, span: 0.92, chord: 0.2, tailLen: 0.48, tailW: 0.075, tailTaper: 0.7, beak: 'hook', beakLen: 0.065, c: { body: '#d4251c', head: '#d4251c', face: '#f1eee6', wing: '#d4251c', wingMid: '#f2c419', wingTip: '#1f58c4', tail: '#c4231a', tailTip: '#1f58c4', beak: '#ede6d6', beak2: '#2a2622', legs: '#4a4a4a' } });
  TPL.toucan = buildBird({ r: 0.08, len: 0.32, headR: 0.062, span: 0.56, chord: 0.16, tailLen: 0.17, tailW: 0.1, beak: 'toucan', beakLen: 0.2, c: { body: '#121212', head: '#121212', throat: '#f3efe0', beak: '#f28a1c', beak2: '#f2b21c', beakTip: '#141414', ring: '#3a7ad6', wing: '#141414', tail: '#121212', legs: '#3a5ad0' } });
  TPL.hummer = buildBird({ r: 0.024, len: 0.085, headR: 0.018, span: 0.12, chord: 0.03, tailLen: 0.035, tailW: 0.025, beak: 'needle', beakLen: 0.04, c: { body: '#2fa36a', belly: '#d9e6dc', head: '#2fa36a', throat: '#c2185b', wing: '#40524a', tail: '#2a5a40', beak: '#141414' } });
  TPL.piranha = buildFish({ len: 0.3, rx: 0.045, ry: 0.11, peak: 0.35, c: { top: '#5d6670', side: '#a7b0b8', belly: '#c9372a', throat: '#d8402e', fin: '#2a2e33', eye: '#d84a2a' } });
  TPL.pacu = buildFish({ len: 0.42, rx: 0.06, ry: 0.17, peak: 0.4, c: { top: '#4b5560', side: '#97a2aa', belly: '#d8793a', throat: '#e08a40', fin: '#3a3f44', eye: '#e8d8a0' } });
  buildHunterTemplates();
  TPL.arapaima = buildFish({ len: 2.4, rx: 0.2, ry: 0.24, peak: 0.25, dorsal: 0.25, c: { top: '#3f473a', side: '#68715c', belly: '#c8c0a6', rear: '#a0342a', fin: '#5a2a22' } });
  TPL.dolphin = buildFish({ len: 2.1, rx: 0.26, ry: 0.28, peak: 0.4, dolphin: true, beak: 0.36, c: { top: '#c98898', side: '#e6a5b5', belly: '#f3cdd5', fin: '#cf93a2', eye: '#2a1a1a' } });
  TPL.anaconda = buildSnake({ len: 5.2, r: 0.12, bones: 14, c: { top: '#55602e', belly: '#c4ae55', eye: '#c9a83a' }, pat: 3, patCol: '#121309', patScale: 4.2 });
  TPL.viper = buildSnake({ len: 1.6, r: 0.036, bones: 10, headWide: true, c: { top: '#9b7a50', belly: '#d8c8a0' }, pat: 4, patCol: '#3a2614', patScale: 4.5 });
  TPL.eel = buildSnake({ len: 1.8, r: 0.07, bones: 10, fin: true, c: { top: '#2b2d23', belly: '#c46a2a', fin: '#3a3a2a' } });
  TPL.frog = buildFrog({ size: 0.12, c: { body: '#1e5fd6', legs: '#1a4cb0' }, pat: 5, patCol: '#0a0a14', patScale: 55 });
  TPL.frogY = buildFrog({ size: 0.12, c: { body: '#f0cf1a', legs: '#202020' }, pat: 5, patCol: '#0a0a0a', patScale: 50 });
}

// ================= ANIMATION =================
const LEGS = ['FL', 'FR', 'BL', 'BR'];
const GAIT_WALK = { BL: 0, FL: 0.25, BR: 0.5, FR: 0.75 }, GAIT_TROT = { FL: 0, BR: 0, FR: 0.5, BL: 0.5 }, GAIT_RUN = { BL: 0, BR: 0.1, FL: 0.45, FR: 0.55 };
function poseReset(a) { for (const b of a.bones) { const t = b.userData.t || (b.userData.t = [0, 0, 0]); t[0] = 0; t[1] = 0; t[2] = 0; } }
function poseApply(a, k) {
  for (const b of a.bones) { const t = b.userData.t; b.rotation.x += (t[0] - b.rotation.x) * k; b.rotation.y += (t[1] - b.rotation.y) * k; b.rotation.z += (t[2] - b.rotation.z) * k; }
}
function T(b, x, y, z) { if (!b) return; const t = b.userData.t; t[0] = x; t[1] = y || 0; t[2] = z || 0; }
function TA(b, x, y, z) { if (!b) return; const t = b.userData.t; t[0] += x; t[1] += y || 0; t[2] += z || 0; }

function animate(a, dt) {
  const k = a.tpl.kind;
  if (k === 'quad') animQuad(a, dt); else if (k === 'bird') animBird(a, dt);
  else if (k === 'fish') animFish(a, dt); else if (k === 'snake') animSnake(a, dt); else if (k === 'frog') animFrog(a, dt); else if (k === 'human') animHuman(a, dt);
}

function animQuad(a, dt) {
  const B = a.B, tp = a.tpl, o = tp.o, sp = a.sp, an = a.anim, st = a.pose, legLen = tp.legLen;
  an.t += dt; poseReset(a);
  const croc = a.spId === 'caiman', monkey = sp.ai === 'troop', sl = a.spId === 'sloth';
  const walk = sp.walk || 1.6, running = a.speed > walk * 2.2, trot = a.speed > walk * 1.2;
  const stride = legLen * (running ? 3.0 : trot ? 2.2 : 1.7) * a.scale;
  if (a.speed > 0.04) an.phase = (an.phase + dt * a.speed / stride) % 1;
  let amp = clamp(a.speed / (legLen * a.scale * 2.4 + 0.3), 0, 1) * (running ? 0.9 : 0.55);
  if (st === 'swim') { an.phase = (an.phase + dt * (1.3 + a.speed * 0.4)) % 1; amp = croc ? 0.15 : 0.62; }
  const off = running ? GAIT_RUN : trot ? GAIT_TROT : GAIT_WALK;
  let rootY = 0, rootX = -(a.pitch || 0), rootZ = 0;
  for (const L of LEGS) {
    const ph = (an.phase + off[L]) * TAU, isF = L[0] === 'F', side = L[1] === 'L' ? 1 : -1;
    const lift = Math.max(0, Math.cos(ph));
    let ux = -amp * Math.sin(ph), lx = amp * 1.5 * lift;
    if (!isF) { ux -= 0.12; lx += 0.22; }
    if (croc) {
      if (st === 'swim') T(B[L + 'u'], 1.1, 0, side * 0.35);
      else { T(B[L + 'u'], ux * 0.8, 0, side * 0.85); T(B[L + 'l'], lx * 0.5, 0, -side * 0.85); continue; }
    } else T(B[L + 'u'], ux, 0, 0);
    T(B[L + 'l'], lx, 0, 0);
  }
  if (croc && st !== 'swim') rootY -= 0.035;
  if (running) { const s = Math.sin(an.phase * TAU); rootY += s * 0.05 * legLen; T(B.hips, s * 0.12 * amp, 0, 0); T(B.chest, -s * 0.1 * amp, 0, 0); }
  else rootY -= Math.abs(Math.sin(an.phase * TAU * 2)) * 0.03 * legLen * amp;
  if (monkey && st !== 'perch' && st !== 'leap') rootX -= 0.18;
  // head & look
  const look = clamp(a.look || 0, -1, 1);
  T(B.neck, -0.05 + Math.sin(an.phase * TAU * 2) * 0.04 * amp, look * 0.5, 0);
  T(B.head, 0.05, look * 0.5, 0);
  // tail
  const tails = tp.names ? a.tailBones : [];
  const tailBase = croc ? 0 : a.spId === 'coati' ? 0.85 : monkey ? -0.2 : a.spId === 'anteater' ? -0.25 : a.spId === 'otter' ? -0.1 : -0.6;
  for (let i = 0; i < tails.length; i++) {
    const sway = Math.sin(an.t * (croc ? 2.5 : 2) + i * 0.7) * (croc ? (st === 'swim' ? 0.35 : 0.12) : 0.16) * (1 + amp);
    T(tails[i], i === 0 ? tailBase : (croc ? 0 : monkey ? -0.12 : 0.14), sway, 0);
  }
  // poses
  switch (st) {
    case 'eat': case 'graze':
      T(B.neck, croc ? 0.2 : 0.95, 0, 0); T(B.head, croc ? 0.1 : 0.45, 0, 0); T(B.jaw, 0.12 + 0.12 * Math.sin(an.t * 13), 0, 0);
      TA(B.FLu, -0.15); TA(B.FRu, -0.15); break;
    case 'drink':
      T(B.neck, croc ? 0.2 : 1.05, 0, 0); T(B.head, 0.5, 0, 0); T(B.jaw, 0.1 + 0.1 * Math.abs(Math.sin(an.t * 9)), 0, 0);
      T(B.FLu, -0.35); T(B.FRu, -0.35); T(B.FLl, 0.6); T(B.FRl, 0.6); rootY -= 0.08 * legLen; break;
    case 'lie': case 'sleep':
      if (!croc) {
        T(B.FLu, -1.35); T(B.FRu, -1.35); T(B.FLl, 0.05); T(B.FRl, 0.05);
        T(B.BLu, -1.25, 0, 0.15); T(B.BRu, -1.25, 0, -0.15); T(B.BLl, 2.45); T(B.BRl, 2.45);
        rootY -= legLen * 0.82;
      } else rootY -= 0.05;
      T(B.neck, st === 'sleep' ? 0.55 : 0.1, st === 'sleep' ? 0.35 : look * 0.4, 0); T(B.head, st === 'sleep' ? 0.35 : 0.05, 0, st === 'sleep' ? 0.25 : 0);
      for (let i = 0; i < tails.length; i++) T(tails[i], i === 0 ? -0.3 : 0.05, i === 0 ? 0.6 : 0.3, 0);
      break;
    case 'sit':
      T(B.BLu, -1.4, 0, 0.1); T(B.BRu, -1.4, 0, -0.1); T(B.BLl, 2.4); T(B.BRl, 2.4);
      T(B.FLu, 0.5); T(B.FRu, 0.5); T(B.FLl, 0); T(B.FRl, 0);
      rootX -= 0.55; rootY -= legLen * 0.38; T(B.neck, -0.3, look * 0.6, 0); T(B.head, 0.35, look * 0.4, 0);
      break;
    case 'dead':
      rootZ = 1.45; rootY -= legLen * 0.7;
      T(B.FLu, -0.4); T(B.FRu, -0.2); T(B.BLu, 0.3); T(B.BRu, 0.5); T(B.neck, 0.2, 0, 0.3); T(B.jaw, 0.25);
      for (let i = 0; i < tails.length; i++) T(tails[i], 0, 0.1, 0);
      break;
    case 'roar': case 'warn': {
      const r = st === 'roar' ? 0.75 : 0.35 + 0.15 * Math.sin(an.t * 6);
      T(B.jaw, r, 0, 0); T(B.neck, st === 'roar' ? -0.35 : 0.3, look * 0.6, 0); T(B.head, st === 'roar' ? -0.15 : 0.1, look * 0.4, 0);
      if (st === 'warn') { rootY -= legLen * 0.12; TA(B.FLu, -0.2); TA(B.FRu, -0.2); TA(B.FLl, 0.4); TA(B.FRl, 0.4); }
      break;
    }
    case 'crouch':
      rootY -= legLen * 0.28; TA(B.FLu, -0.35); TA(B.FRu, -0.35); TA(B.FLl, 0.75); TA(B.FRl, 0.75);
      TA(B.BLu, -0.5); TA(B.BRu, -0.5); TA(B.BLl, 0.95); TA(B.BRl, 0.95); T(B.neck, 0.25, look * 0.5, 0); T(B.head, -0.05, look * 0.5, 0);
      break;
    case 'court': {
      const w = Math.sin(an.t * 3);
      T(B.neck, 0.15, 0.45 * w, 0); T(B.head, 0.1, 0.3 * w, 0.35 * w);
      for (let i = 0; i < tails.length; i++) T(tails[i], i === 0 ? tailBase + 0.5 : 0.12, Math.sin(an.t * 4 + i) * 0.35, 0);
      rootZ = 0.08 * w; break;
    }
    case 'fight': {
      const c = Math.sin(an.t * 5);
      T(B.jaw, 0.35, 0, 0); T(B.neck, 0.2, look * 0.6, 0);
      if (!croc) { rootY -= legLen * 0.1; TA(B.FLu, -0.25 * c); TA(B.FRu, 0.25 * c); }
      break;
    }
    case 'swim':
      T(B.neck, croc ? 0 : -0.35, look * 0.5, 0); T(B.head, croc ? 0 : 0.25, look * 0.4, 0); break;
    case 'climb': {
      rootX = -1.32; const s1 = Math.sin(an.t * 7), c1 = Math.cos(an.t * 7);
      T(B.FLu, -1.9 + s1 * 0.45, 0, 0.25); T(B.FRu, -1.9 - s1 * 0.45, 0, -0.25); T(B.FLl, -0.6 + c1 * 0.3); T(B.FRl, -0.6 - c1 * 0.3);
      T(B.BLu, -0.4 - s1 * 0.4, 0, 0.3); T(B.BRu, -0.4 + s1 * 0.4, 0, -0.3); T(B.BLl, 1.0); T(B.BRl, 1.0);
      break;
    }
    case 'perch':
      rootX = -1.05; rootY -= legLen * 0.55;
      T(B.BLu, -1.5, 0, 0.35); T(B.BRu, -1.5, 0, -0.35); T(B.BLl, 2.2); T(B.BRl, 2.2);
      T(B.FLu, 0.35 + Math.sin(an.t * 0.7) * 0.1, 0, 0.15); T(B.FRu, 0.5, 0, -0.15); T(B.FLl, -0.4); T(B.FRl, -0.5);
      T(B.neck, 0.75, look * 0.8, 0); T(B.head, 0.3, look * 0.4, 0);
      for (let i = 0; i < tails.length; i++) T(tails[i], i === 0 ? 0.2 : -0.08, Math.sin(an.t + i) * 0.05, 0);
      if (a.howl > 0) { T(B.jaw, 0.6); T(B.neck, -0.3, 0, 0); }
      break;
    case 'leap':
      rootX = 0.05; T(B.FLu, -1.5); T(B.FRu, -1.5); T(B.FLl, 0.2); T(B.FRl, 0.2); T(B.BLu, 0.9); T(B.BRu, 0.9); T(B.BLl, 0.3); T(B.BRl, 0.3);
      for (let i = 0; i < tails.length; i++) T(tails[i], 0.05, 0, 0);
      break;
    case 'hang': {
      const m = Math.sin(an.t * 0.35);
      T(B.FLu, 0.1 + m * 0.2); T(B.FRu, 0.1 - m * 0.2); T(B.BLu, -0.1 - m * 0.15); T(B.BRu, -0.1 + m * 0.15);
      T(B.neck, -0.9, m * 0.4, 0); T(B.head, -0.4, 0, 0); break;
    }
  }
  if (sl && st !== 'hang' && st !== 'dead') { T(B.neck, 0.2, look * 0.5, 0); }
  // attack overlay
  if (an.atk > 0) {
    an.atk -= dt; const f = clamp(an.atk / 0.45, 0, 1), kk = Math.sin(Math.PI * (1 - f));
    TA(B.neck, -0.3 * kk); TA(B.head, 0.2 * kk); TA(B.jaw, 0.7 * kk);
    if (!croc) { TA(B.FLu, -0.9 * kk); TA(B.FRu, -0.7 * kk); TA(B.FLl, 0.4 * kk); TA(B.FRl, 0.3 * kk); rootY += 0.1 * kk * legLen; }
    else { TA(B.neck, -0.2 * kk); TA(B.jaw, 0.4 * kk); }
  }
  if (an.hurt > 0) { an.hurt -= dt; TA(B.head, 0.35 * an.hurt * 3); rootZ += 0.1 * Math.sin(an.hurt * 40) * an.hurt; }
  const kk = damp(dt, st === 'dead' ? 4 : 12);
  poseApply(a, kk);
  const R = B.root, ry = R.userData.rest.y + rootY;
  R.position.y += (ry - R.position.y) * kk;
  R.rotation.x += (rootX - R.rotation.x) * kk; R.rotation.z += (rootZ - R.rotation.z) * kk;
}

function animBird(a, dt) {
  const B = a.B, an = a.anim, st = a.pose; an.t += dt; poseReset(a);
  const hum = a.spId === 'hummer', harpy = a.spId === 'harpy';
  let rx = 0, rz = 0;
  if (st === 'fly' || st === 'hover') {
    const glide = harpy ? (Math.sin(an.t * 0.4) > 0.2 ? 1 : 0) : (a.glide || 0);
    const freq = hum ? 52 : harpy ? 3 : a.spId === 'toucan' ? 7 : 5;
    an.phase += dt * freq;
    const f = Math.sin(an.phase) * (hum ? 1.0 : 0.95) * (1 - glide * 0.85) + glide * 0.08;
    T(B.wL1, 0, 0, f); T(B.wR1, 0, 0, -f); T(B.wL2, 0, 0, f * 0.55 + glide * 0.05); T(B.wR2, 0, 0, -f * 0.55 - glide * 0.05);
    rx = st === 'hover' ? -0.75 : -clamp((a.vy || 0) * 0.08, -0.6, 0.6);
    rz = clamp(a.bank || 0, -0.8, 0.8);
    T(B.tail, st === 'hover' ? 0.6 : 0.05 * Math.sin(an.t * 3), 0, 0);
    // long necks reach forward in flight, long legs trail behind
    if ((a.tpl.o.neckLen || 0) > 0.15) { T(B.neck, 1.3, 0, 0); T(B.head, -1.2, 0, 0); } else T(B.neck, st === 'hover' ? 0.5 : -0.1, 0, 0);
    T(B.legs, 1.45, 0, 0);
  } else if (st === 'dead') {
    rz = 1.5; T(B.wL1, 0, 0.4, 0.6); T(B.wR1, 0, -0.4, -0.2);
  } else {
    T(B.wL1, 0, 1.35, -0.12); T(B.wR1, 0, -1.35, 0.12); T(B.wL2, 0, 0.25, 0); T(B.wR2, 0, -0.25, 0);
    rx = st === 'ground' ? -0.15 : -0.45;
    T(B.tail, st === 'ground' ? 0.15 : -0.15, Math.sin(an.t * 0.8) * 0.05, 0);
    const look = Math.sin(an.t * 0.9 + a.id) * 0.6;
    T(B.neck, 0.15, look * 0.6, 0); T(B.head, 0.1 + (st === 'ground' && Math.sin(an.t * 2.3 + a.id) > 0.6 ? 0.6 : 0), look * 0.5, 0);
  }
  const k = damp(dt, hum ? 40 : 16);
  for (const b of a.bones) {
    const t = b.userData.t;
    if (b === B.wL1 || b === B.wR1 || b === B.wL2 || b === B.wR2) { if (st === 'fly' || st === 'hover') { b.rotation.z = t[2]; b.rotation.y += (t[1] - b.rotation.y) * k; b.rotation.x += (t[0] - b.rotation.x) * k; continue; } }
    b.rotation.x += (t[0] - b.rotation.x) * k; b.rotation.y += (t[1] - b.rotation.y) * k; b.rotation.z += (t[2] - b.rotation.z) * k;
  }
  B.root.rotation.x += (rx - B.root.rotation.x) * k; B.root.rotation.z += (rz - B.root.rotation.z) * k;
}

function animFish(a, dt) {
  const an = a.anim, ids = a.bones; an.t += dt;
  const dol = a.spId === 'dolphin', big = a.spId === 'arapaima';
  const freq = dol ? 2.4 : big ? 2.2 : 5 + a.speed * 2.5;
  an.phase += dt * freq;
  const base = dol ? 0.12 : big ? 0.07 : 0.14, amp = base * (0.45 + Math.min(1.5, a.speed * 0.5));
  for (let i = 1; i < ids.length; i++) {
    const v = Math.sin(an.phase - i * 0.9) * amp * (0.5 + i * 0.35);
    if (dol) { ids[i].rotation.x = v; ids[i].rotation.y = 0; } else { ids[i].rotation.y = v; ids[i].rotation.x = 0; }
  }
  ids[0].rotation.z += ((a.dead ? Math.PI : (a.bank || 0) * 0.5) - ids[0].rotation.z) * damp(dt, 4);
  ids[0].rotation.x += ((a.dead ? 0 : -clamp((a.vy || 0) * 0.3, -0.6, 0.6)) - ids[0].rotation.x) * damp(dt, 4);
}

function animSnake(a, dt) {
  const an = a.anim, ids = a.bones, st = a.pose; an.t += dt;
  const eel = a.spId === 'eel';
  an.phase += dt * (1.2 + a.speed * (eel ? 2.5 : 3.2));
  const k = damp(dt, 6);
  for (let i = 0; i < ids.length; i++) {
    let ty, tx = 0;
    if (st === 'coil') ty = i === 0 ? -0.3 : 0.62 + Math.sin(an.t * 2 + i) * 0.03;
    else if (st === 'rest') ty = i < 2 ? 0.2 : 0.75;
    else if (st === 'dead') ty = Math.sin(i * 1.3) * 0.15;
    else ty = Math.sin(an.phase - i * 0.75) * (a.speed > 0.05 ? 0.32 : 0.1) * (i === 0 ? 0.3 : 1);
    if (i < 2 && (st === 'strike' || st === 'rest' || st === 'alert')) tx = st === 'strike' ? -0.15 : -0.35;
    if (st === 'strike' && i < 4) ty *= 0.2;
    ids[i].rotation.y += (ty - ids[i].rotation.y) * (st === 'move' ? 1 : k);
    ids[i].rotation.x += (tx - ids[i].rotation.x) * k;
  }
  ids[0].rotation.z += ((st === 'dead' ? Math.PI : 0) - ids[0].rotation.z) * k;
}

function animFrog(a, dt) {
  const B = a.B, an = a.anim; an.t += dt; poseReset(a);
  if (a.airborne) { for (const s of ['L', 'R']) { T(B['H' + s + 'u'], 0.9, 0, 0); T(B['H' + s + 'l'], -0.3); T(B['F' + s + 'u'], -0.6); } }
  else { const sgn = { L: 1, R: -1 }; for (const s of ['L', 'R']) { T(B['H' + s + 'u'], -0.35, 0, sgn[s] * 0.2); T(B['H' + s + 'l'], 0.6); T(B['F' + s + 'u'], 0.2); } }
  if (a.dead) B.root.rotation.z += (Math.PI - B.root.rotation.z) * damp(dt, 5);
  poseApply(a, damp(dt, 18));
}
