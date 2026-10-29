
'use strict';
const V3 = THREE.Vector3, TAU = Math.PI * 2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const damp = (dt, k) => 1 - Math.exp(-dt * k);
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
let rng = mulberry32(7741);
const rr = (a, b) => a + (b - a) * rng();
const pick = a => a[Math.floor(rng() * a.length)];
const angDiff = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
const col = h => new THREE.Color(h);
const mixC = (a, b, t) => { const c = a.clone().lerp(b, clamp(t, 0, 1)); if (a.slot) { c.slot = a.slot; c.base = a.base; } return c; };
function M(p, r, s) {
  return new THREE.Matrix4().compose(new V3(p ? p[0] : 0, p ? p[1] : 0, p ? p[2] : 0),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(r ? r[0] : 0, r ? r[1] : 0, r ? r[2] : 0)),
    new V3(s ? s[0] : 1, s ? s[1] : 1, s ? s[2] : 1));
}
function texSRGB(t) { if ('colorSpace' in t) t.colorSpace = THREE.SRGBColorSpace; else t.encoding = THREE.sRGBEncoding; return t; }
const dist2 = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

const Noise = (() => {
  const p = new Uint8Array(512), r = mulberry32(1337), perm = [];
  for (let i = 0; i < 256; i++) perm[i] = i;
  for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = perm[i]; perm[i] = perm[j]; perm[j] = t; }
  for (let i = 0; i < 512; i++) p[i] = perm[i & 255];
  const gx = [1, -1, 1, -1, 1, -1, 0, 0], gy = [1, 1, -1, -1, 0, 0, 1, -1];
  const F2 = 0.5 * (Math.sqrt(3) - 1), G2 = (3 - Math.sqrt(3)) / 6;
  function n2(xin, yin) {
    let n0 = 0, n1 = 0, n2v = 0;
    const s = (xin + yin) * F2, i = Math.floor(xin + s), j = Math.floor(yin + s);
    const t = (i + j) * G2, x0 = xin - (i - t), y0 = yin - (j - t);
    const i1 = x0 > y0 ? 1 : 0, j1 = x0 > y0 ? 0 : 1;
    const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2, x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
    const ii = i & 255, jj = j & 255;
    let t0 = 0.5 - x0 * x0 - y0 * y0; if (t0 > 0) { const g = p[ii + p[jj]] & 7; t0 *= t0; n0 = t0 * t0 * (gx[g] * x0 + gy[g] * y0); }
    let t1 = 0.5 - x1 * x1 - y1 * y1; if (t1 > 0) { const g = p[ii + i1 + p[jj + j1]] & 7; t1 *= t1; n1 = t1 * t1 * (gx[g] * x1 + gy[g] * y1); }
    let t2 = 0.5 - x2 * x2 - y2 * y2; if (t2 > 0) { const g = p[ii + 1 + p[jj + 1]] & 7; t2 *= t2; n2v = t2 * t2 * (gx[g] * x2 + gy[g] * y2); }
    return 70 * (n0 + n1 + n2v);
  }
  function fbm(x, y, o = 4) { let a = 1, f = 1, s = 0, n = 0; for (let i = 0; i < o; i++) { s += a * n2(x * f, y * f); n += a; a *= 0.5; f *= 2.03; } return s / n; }
  function ridge(x, y, o = 4) { let a = 1, f = 1, s = 0, n = 0; for (let i = 0; i < o; i++) { let v = 1 - Math.abs(n2(x * f, y * f)); v *= v; s += a * v; n += a; a *= 0.5; f *= 2.07; } return s / n; }
  return { n2, fbm, ridge };
})();

const QUAL = {
  low: { pr: 0.75, sh: 0, veg: 0.55, view: 185, aa: false, fauna: 5.6 },
  med: { pr: 1.0, sh: 1024, veg: 0.85, view: 245, aa: true, fauna: 8.4 },
  high: { pr: 1.35, sh: 2048, veg: 1, view: 320, aa: true, fauna: 8.8 }
};
const SET = { q: 'med', sex: 'm', sp: 'jaguar' };
try { const s = JSON.parse(localStorage.getItem('amazonia-set') || '{}'); Object.assign(SET, s); } catch (e) { }
function saveSet() { try { localStorage.setItem('amazonia-set', JSON.stringify(SET)); } catch (e) { } }
const G = { mode: 'loading', time: 7.3, day: 1, rain: 0, rainTarget: 0, rainT: 120, t: 0, paused: false, timeMul: 1, flash: 0 };
const KEYS = {};
const HOUR = 40; // real seconds per game hour
