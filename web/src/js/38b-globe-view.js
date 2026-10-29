// ================= THE GLOBE: the whole round world on a ball. Turn it with a finger, zoom into it, and it opens into the flat map =================
// The world is a ring around the ball: its x goes round the equator (east is east), its z from the ice of the north to the ice
// of the south. The picture on the ball is made once from the maps of both continents and the sea between them (a little at a
// time while you play, so it is ready when you open the map). The ball is drawn pixel by pixel: the sun's light, a shine on the
// sea, a thin veil of clouds, the air glowing at its rim. Over it go the places of the world: you, your village, the tribes,
// towns and castles you know, the roads of the Old World and the ferry's way across the ocean.
const GLB = { LAT: 1.13, tex: null, texV: 0, tb: null, cloud: null, cloudOff: 0, cv: null, ctx: null, img: null, u32: null, key: '', drawn: null,
  stars: null, starsKey: '', vel: null, trk: [], anim: null, fade: null, moveT: 0, lastT: 0, tapT: 0, tapX: 0, tapY: 0 };
// the places of the world on the ball: longitude round the ring, latitude from the north (+) to the south (-)
const glbLon = x => (wrapX(x) - GLOBE.x0) / GLOBE.P * TAU;
const glbLat = z => -z / W.half * GLB.LAT;
const glbX = lon => wrapX(GLOBE.x0 + lon / TAU * GLOBE.P);
const glbZ = lat => clamp(-lat / GLB.LAT * W.half, -W.half, W.half);
// how big the ball is (zoom 1: it fits the map), and the flat map's scale that matches it
const glbR0 = () => Math.min(MAPV.cw || 600, MAPV.ch || 400) * 0.44;
const glbS = gz => glbR0() * gz * TAU / GLOBE.P;
const glbGz = s => s * GLOBE.P / TAU / glbR0();
// the ball opens into the flat map when you see about a day's walk across; the flat map closes back into it a little further out
const glbSIn = () => Math.min(MAPV.cw || 600, MAPV.ch || 400) / 1600;
const glbSOut = () => Math.min(MAPV.cw || 600, MAPV.ch || 400) / 2200;
const glbGzMax = () => glbGz(glbSIn());

// ---------- the picture of the world for the ball ----------
// the colour of the open sea: deep blue, a little greyer towards the ice, with slow changes in it
function glbSeaBase(sw, sh) {
  const B = new Float32Array(sw * sh * 3);
  for (let j = 0; j < sh; j++) for (let i = 0; i < sw; i++) {
    const u = i / sw, v = (j + 0.5) / sh, f = uu => Noise.fbm(uu * 7 + 3, v * 2.6 + 7, 3);
    const n = f(u) * (1 - u) + f(u - 1) * u, cold = smooth(0.18, 0.5, Math.abs(v - 0.5)), k = (j * sw + i) * 3;
    B[k] = 13 + n * 7 + cold * 14; B[k + 1] = 50 + n * 12 + cold * 22; B[k + 2] = 96 + n * 14 + cold * 10;
  }
  return B;
}
// water by its depth: light over the sand of the shallows, darkening into the deep sea
function glbWater(d, o, br, bg, bb) {
  const k1 = smooth(0, 4, d), k2 = smooth(3, 22, d);
  o[0] = lerp(lerp(92, 44, k1), br, k2); o[1] = lerp(lerp(172, 118, k1), bg, k2); o[2] = lerp(lerp(176, 160, k1), bb, k2);
}
// a colour from a map's own pixels, blended between the four around (fx, fz in pixels)
function glbSmp(A, S, fx, fz, o) {
  let x = fx - 0.5, z = fz - 0.5;
  if (x < 0) x = 0; else if (x > S - 1.001) x = S - 1.001;
  if (z < 0) z = 0; else if (z > S - 1.001) z = S - 1.001;
  const ix = x | 0, iz = z | 0, tx = x - ix, tz = z - iz, i = (iz * S + ix) * 4, j = i + S * 4;
  for (let c = 0; c < 3; c++) o[c] = (A[i + c] * (1 - tx) + A[i + 4 + c] * tx) * (1 - tz) + (A[j + c] * (1 - tx) + A[j + 4 + c] * tx) * tz;
  return o;
}
// begin the picture: the colours come from both continents' maps and the sea between them, a few rows at a time
function glbTexBegin() {
  if (!UI.mapImg || !UI.mapImg.px) UI.mapImg = buildMapImg();
  const tw = PHONE ? 1536 : 2048, th = Math.round(tw * W.size / GLOBE.P), owOK = owMapReady() && !!GMAP.d2;
  const sw = 160, sh = Math.max(8, Math.round(sw * th / tw));
  GLB.tb = { tw, th, A: UI.mapImg.px, SA: UI.mapImg.width, O: owOK ? GMAP.d2 : null, SO: GMAP.S2, sw, sh, B: glbSeaBase(sw, sh), px: new Uint32Array(tw * th), wet: new Uint8Array(tw * th), j: 0, owOK };
}
function glbTexStep(rows) {
  if (!GLB.tb) glbTexBegin();
  const T = GLB.tb, { tw, th, A, SA, O, SO, sw, sh, B, px, wet } = T, P = GLOBE.P, o = [0, 0, 0], j1 = Math.min(th, T.j + rows);
  for (let j = T.j; j < j1; j++) {
    // (near the poles the ball squeezes the east-west of the picture: the ice's pattern is squeezed the other way, so it stays round)
    const z = -W.half + (j + 0.5) / th * W.size, az = Math.abs(z), ice = az > LIMIT - 45, sq = Math.cos(glbLat(z));
    const bj = clamp((j + 0.5) / th * sh - 0.5, 0, sh - 1), bj0 = Math.floor(bj), bj1 = Math.min(sh - 1, bj0 + 1), fj = bj - bj0;
    for (let i = 0; i < tw; i++) {
      const x = GLOBE.x0 + (i + 0.5) / tw * P, k = j * tw + i;
      // the open sea's colour here (smooth, from the small picture; it goes round the seam)
      const bi = (i + 0.5) / tw * sw - 0.5, bi0 = Math.floor(bi), fi = bi - bi0, a0 = (bi0 + sw) % sw, a1 = (bi0 + 1) % sw;
      const q00 = (bj0 * sw + a0) * 3, q01 = (bj0 * sw + a1) * 3, q10 = (bj1 * sw + a0) * 3, q11 = (bj1 * sw + a1) * 3;
      const w00 = (1 - fi) * (1 - fj), w01 = fi * (1 - fj), w10 = (1 - fi) * fj, w11 = fi * fj;
      const br = B[q00] * w00 + B[q01] * w01 + B[q10] * w10 + B[q11] * w11, bg = B[q00 + 1] * w00 + B[q01 + 1] * w01 + B[q10 + 1] * w10 + B[q11 + 1] * w11, bb = B[q00 + 2] * w00 + B[q01 + 2] * w01 + B[q10 + 2] * w10 + B[q11 + 2] * w11;
      let r = br, g = bg, b = bb, w = 255;
      const nw = inMain(x, z);
      if (nw || (T.owOK && inOld(x, z))) {
        const h = getHT(x, z);
        if (h < -0.4) { glbWater(-h, o, br, bg, bb); r = o[0]; g = o[1]; b = o[2]; }
        else {
          w = 0;
          // the little map darkens the New World beyond the edge that can be walked: here it has its true colours
          if (nw && (Math.abs(x) > LIMIT || az > LIMIT)) mapColorAt(x, z, o, true);
          else if (nw) glbSmp(A, SA, (x + W.half) / W.size * SA, (z + W.half) / W.size * SA, o);
          else glbSmp(O, SO, (x - OW.x0) / OW.size * SO, (z - OW.z0) / OW.size * SO, o);
          r = o[0]; g = o[1]; b = o[2];
        }
      }
      // the pack ice at the top and the bottom of the world
      if (ice) {
        const t = smooth(LIMIT - 45, LIMIT + 28, az + Noise.n2(x * 0.018 * sq + 5, z * 0.018) * 24);
        if (t > 0) { const ic = 224 + Noise.n2(x * 0.05 * sq, z * 0.05) * 14 * (1 - smooth(1465, 1500, az)); r = lerp(r, ic - 8, t); g = lerp(g, ic + 1, t); b = lerp(b, ic + 12, t); w *= 1 - t; }
      }
      px[k] = (255 << 24 | (b > 255 ? 255 : b) << 16 | (g > 255 ? 255 : g) << 8 | (r > 255 ? 255 : r)) >>> 0;
      wet[k] = w;
    }
  }
  T.j = j1;
  if (T.j >= th) { GLB.tex = { w: tw, h: th, px, wet, full: T.owOK }; GLB.texV++; GLB.tb = null; return true; }
  return false;
}
// the picture is ready (or made now, all at once)
function glbTexReady(now) {
  if (GLB.tex && (GLB.tex.full || !owMapReady())) return true;
  if (!now) return false;
  if (GLB.tb && !GLB.tb.owOK && owMapReady()) GLB.tb = null;   // the Old World's map came: begin again with it
  while (!glbTexStep(64));
  return true;
}
// a little of the work while you play (never more than a few milliseconds a frame), so the map opens at once
function mapPrep() {
  if (G.mode !== 'play' || MAPV.open || !UI.mapImg) return;
  if ((MAPV.prepN = (MAPV.prepN || 0) + 1) < 240) return;
  if (!owMapReady()) { if (TCOL2) owMapStep(PHONE ? 3 : 6); return; }
  if (!GLB.tex || !GLB.tex.full) { if (GLB.tb && !GLB.tb.owOK) GLB.tb = null; glbTexStep(PHONE ? 4 : 10); }
  else if (!GLB.cloud) glbCloudBuild();
  else if ((GLB.warm || 0) < 6) { GLB.warm = (GLB.warm || 0) + 1; MAPV.gLon = MAPV.gLon || 0; MAPV.gLat = MAPV.gLat || 0; glbRender(40, 40, 38, 80, 80, 1, 0.4); GLB.key = ''; }
}
// a thin veil of clouds round the ball
function glbCloudBuild() {
  const w = 192, h = 96, d = new Uint8Array(w * h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const u = i / w, v = (j + 0.5) / h, lat = (0.5 - v) * Math.PI, f = uu => Noise.fbm(uu * 6 + 11, v * 3.4 - 3, 3) + 0.4 * Noise.n2(uu * 19 - 5, v * 10 + 9);
    let n = f(u) * (1 - u) + f(u - 1) * u;
    // the wet belt round the middle and the stormy cold seas have more cloud, the dry belts between them less
    n += 0.1 * Math.cos(lat * 5.2) + 0.08 * smooth(0.8, 1.2, Math.abs(lat));
    d[j * w + i] = smooth(0.06, 0.62, n) * 255;
  }
  GLB.cloud = { w, h, d };
}
// the dark of space behind the ball, and its stars
function glbSky(c, cw, ch) {
  const dpr = Math.min(2, devicePixelRatio || 1), key = cw + 'x' + ch + 'x' + dpr;
  if (GLB.starsKey !== key) {
    GLB.starsKey = key; const s = GLB.stars || (GLB.stars = document.createElement('canvas'));
    s.width = Math.round(cw * dpr); s.height = Math.round(ch * dpr);
    const x = s.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0);
    const g = x.createRadialGradient(cw * 0.5, ch * 0.45, 0, cw * 0.5, ch * 0.5, Math.hypot(cw, ch) * 0.62);
    g.addColorStop(0, '#11263f'); g.addColorStop(0.55, '#081524'); g.addColorStop(1, '#02060b'); x.fillStyle = g; x.fillRect(0, 0, cw, ch);
    const r = mulberry32(77), n = Math.round(cw * ch / 1300);
    for (let i = 0; i < n; i++) {
      const a = r(), sz = a > 0.985 ? 1.9 : a > 0.9 ? 1.25 : 0.8;
      x.fillStyle = `rgba(${235 + r() * 20 | 0},${235 + r() * 20 | 0},255,${(0.2 + a * 0.7).toFixed(2)})`; x.fillRect(r() * cw, r() * ch, sz, sz);
    }
  }
  c.drawImage(GLB.stars, 0, 0, cw, ch);
}

// ---------- the ball, pixel by pixel ----------
const GL_L = (() => { const x = -0.46, y = 0.5, z = 0.73, l = Math.hypot(x, y, z); return [x / l, y / l, z / l]; })();
const GL_H = (() => { const x = GL_L[0], y = GL_L[1], z = GL_L[2] + 1, l = Math.hypot(x, y, z); return [x / l, y / l, z / l]; })();
function glbRender(cx, cy, R, cw, ch, q, cloudA) {
  const T = GLB.tex, CL = GLB.cloud; if (!T || !CL) return null;
  const x0 = Math.max(0, Math.floor(cx - R - 2)), x1 = Math.min(cw, Math.ceil(cx + R + 2)), y0 = Math.max(0, Math.floor(cy - R - 2)), y1 = Math.min(ch, Math.ceil(cy + R + 2));
  if (x1 <= x0 || y1 <= y0) return null;
  const bw = Math.max(1, Math.round((x1 - x0) * q)), bh = Math.max(1, Math.round((y1 - y0) * q));
  if (!GLB.cv) { GLB.cv = document.createElement('canvas'); GLB.ctx = GLB.cv.getContext('2d'); }
  if (GLB.cv.width !== bw || GLB.cv.height !== bh || !GLB.img) { GLB.cv.width = bw; GLB.cv.height = bh; GLB.img = GLB.ctx.createImageData(bw, bh); GLB.u32 = new Uint32Array(GLB.img.data.buffer); }
  const out = GLB.u32, tw = T.w, th = T.h, TP = T.px, TW = T.wet, cwc = CL.w, chc = CL.h, CD = CL.d;
  const lon0 = MAPV.gLon, la = MAPV.gLat, cl = Math.cos(la), sl = Math.sin(la), LAT = GLB.LAT;
  const iR = 1 / R, st = (x1 - x0) / bw, sty = (y1 - y0) / bh, edge = R / st, rimIn = 1 - 3 / edge;
  const uK = tw / TAU, vK = th / (2 * LAT), cuK = cwc / TAU, cvK = chc / Math.PI, cOff = GLB.cloudOff, HP = Math.PI / 2;
  const Lx = GL_L[0], Ly = GL_L[1], Lz = GL_L[2], Hx = GL_H[0], Hy = GL_H[1], Hz = GL_H[2];
  let k = 0;
  for (let py = 0; py < bh; py++) {
    const Y = (cy - (y0 + (py + 0.5) * sty)) * iR, Y2 = Y * Y;
    for (let px = 0; px < bw; px++, k++) {
      const X = (x0 + (px + 0.5) * st - cx) * iR, r2 = X * X + Y2;
      if (r2 >= 1 + 2.5 / edge) { out[k] = 0; continue; }
      const Z = r2 < 1 ? Math.sqrt(1 - r2) : 0;
      const y2 = Y * cl + Z * sl, z2 = -Y * sl + Z * cl;
      const lat = Math.asin(y2 > 1 ? 1 : y2 < -1 ? -1 : y2), lon = lon0 + Math.atan2(X, z2);
      // the picture (four texels blended); past the ends of the world the last row is the polar ice
      let u = lon * uK - 0.5; u -= Math.floor(u / tw) * tw;
      const iu = u | 0, fu = u - iu, u1 = iu + 1 >= tw ? 0 : iu + 1;
      let v = (LAT - lat) * vK - 0.5; if (v < 0) v = 0; else if (v > th - 1.001) v = th - 1.001;
      const iv = v | 0, fv = v - iv, r0 = iv * tw, r1 = r0 + tw;
      const A = TP[r0 + iu], Bq = TP[r0 + u1], C = TP[r1 + iu], D = TP[r1 + u1];
      const wa = (1 - fu) * (1 - fv), wb = fu * (1 - fv), wc = (1 - fu) * fv, wd = fu * fv;
      let r = (A & 255) * wa + (Bq & 255) * wb + (C & 255) * wc + (D & 255) * wd;
      let g = (A >> 8 & 255) * wa + (Bq >> 8 & 255) * wb + (C >> 8 & 255) * wc + (D >> 8 & 255) * wd;
      let b = (A >> 16 & 255) * wa + (Bq >> 16 & 255) * wb + (C >> 16 & 255) * wc + (D >> 16 & 255) * wd;
      let wet = (TW[r0 + iu] * wa + TW[r0 + u1] * wb + TW[r1 + iu] * wc + TW[r1 + u1] * wd) * 0.00392;
      if (lat > LAT || lat < -LAT) {
        const ca = Math.cos(lat), qx = ca * Math.sin(lon), qz = ca * Math.cos(lon), sd = lat > 0 ? 3.1 : 8.7;
        const n = (Noise.n2(qx * 7 + sd, qz * 7) * 0.6 + Noise.n2(qx * 21 - sd, qz * 21 + 5) * 0.4) * 18 * smooth(LAT, LAT + 0.1, lat > 0 ? lat : -lat);
        r = 216 + n; g = 225 + n; b = 236 + n * 0.7; wet = 0;
      }
      // the sun: light on the near side, a glint on the sea
      const nl = X * Lx + Y * Ly + Z * Lz, dif = 0.4 + 0.74 * (nl > 0 ? nl : 0);
      r *= dif; g *= dif; b *= dif;
      if (wet > 0.05) { const nh = X * Hx + Y * Hy + Z * Hz; if (nh > 0.93) { const t = (nh - 0.93) * 14.3, sp = t * t * t * 120 * wet; r += sp; g += sp; b += sp * 0.92; } }
      // the clouds, lit by the same sun
      if (cloudA > 0.01) {
        let cu = lon * cuK + cOff - 0.5; cu -= Math.floor(cu / cwc) * cwc;
        const icu = cu | 0, fcu = cu - icu, cu1 = icu + 1 >= cwc ? 0 : icu + 1;
        let cv = (HP - lat) * cvK - 0.5; if (cv < 0) cv = 0; else if (cv > chc - 1.001) cv = chc - 1.001;
        const icv = cv | 0, fcv = cv - icv, c0 = icv * cwc, c1 = c0 + cwc;
        const cval = ((CD[c0 + icu] * (1 - fcu) + CD[c0 + cu1] * fcu) * (1 - fcv) + (CD[c1 + icu] * (1 - fcu) + CD[c1 + cu1] * fcu) * fcv) * 0.00392 * cloudA;
        if (cval > 0.01) { const cc = 255 * (0.5 + 0.55 * (nl > 0 ? nl : 0)); r += (cc - r) * cval; g += (cc - g) * cval; b += (cc + 6 - b) * cval; }
      }
      // the air at the rim of the ball
      const e1 = 1 - Z, ra = e1 * e1 * e1 * 0.78;
      r += (105 - r) * ra; g += (168 - g) * ra; b += (255 - b) * ra;
      let al = 255;
      if (r2 > rimIn) { const e = (1 - Math.sqrt(r2)) * edge; al = e >= 1 ? 255 : e <= -1.2 ? 0 : (e + 1.2) * 115.9 | 0; }
      out[k] = (al << 24 | (b > 255 ? 255 : b | 0) << 16 | (g > 255 ? 255 : g | 0) << 8 | (r > 255 ? 255 : r | 0)) >>> 0;
    }
  }
  GLB.ctx.putImageData(GLB.img, 0, 0);
  return { x0, y0, x1, y1 };
}
// where a place of the world is on the screen (null: on the far side of the ball), and back
function glbProj(x, z, cx, cy, R, any) {
  const lon = glbLon(x), lat = glbLat(z), dl = lon - MAPV.gLon, ca = Math.cos(lat), la = MAPV.gLat, cl = Math.cos(la), sl = Math.sin(la);
  const X = ca * Math.sin(dl), y2 = Math.sin(lat), z2 = ca * Math.cos(dl), Y = y2 * cl - z2 * sl, Z = y2 * sl + z2 * cl;
  if (Z < 0.04 && !any) return null;
  return [cx + X * R, cy - Y * R, Z];
}
function glbUnproj(sx, sy, cx, cy, R) {
  const X = (sx - cx) / R, Y = (cy - sy) / R, r2 = X * X + Y * Y; if (r2 > 1) return null;
  const Z = Math.sqrt(1 - r2), la = MAPV.gLat, cl = Math.cos(la), sl = Math.sin(la), y2 = Y * cl + Z * sl, z2 = -Y * sl + Z * cl;
  const lat = Math.asin(clamp(y2, -1, 1)), lon = MAPV.gLon + Math.atan2(X, z2);
  return { lat, lon, x: glbX(lon), z: glbZ(lat), ice: Math.abs(lat) > GLB.LAT * 0.985 };
}
const glbView = () => { const R = glbR0() * MAPV.gz; return { cx: MAPV.cw / 2, cy: MAPV.ch / 2, R }; };

// ---------- the globe on the map's screen ----------
function globeDraw(c, cw, ch) {
  glbTexReady(true); if (!GLB.cloud) glbCloudBuild();
  const gz = MAPV.gz, R = glbR0() * gz, cx = cw / 2, cy = ch / 2, now = performance.now(), dpr = Math.min(2, devicePixelRatio || 1), s = glbS(gz);
  glbSky(c, cw, ch);
  // the air glowing round the ball
  const gl = c.createRadialGradient(cx, cy, R * 0.97, cx, cy, R * 1.2);
  gl.addColorStop(0, 'rgba(110,175,255,.42)'); gl.addColorStop(0.35, 'rgba(90,150,255,.14)'); gl.addColorStop(1, 'rgba(80,140,255,0)');
  c.fillStyle = gl; c.beginPath(); c.arc(cx, cy, R * 1.2, 0, TAU); c.fill();
  // the ball itself: drawn again only when it turns or grows, and roughly while it moves
  const busy = now - GLB.moveT < 170 || GLB.anim || GLB.vel || (MAPV.g && MAPV.g.moved);
  const area = Math.max(1, (Math.min(cw, cx + R) - Math.max(0, cx - R)) * (Math.min(ch, cy + R) - Math.max(0, cy - R)));
  const budget = busy ? (TOUCH ? 55e3 : 120e3) : (TOUCH ? 170e3 : 420e3), q = Math.round(clamp(Math.sqrt(budget / area), 0.3, dpr) * 16) / 16;
  const cloudA = 0.5 * (1 - smooth(0.11, 0.3, s));
  const key = MAPV.gLon.toFixed(5) + '|' + MAPV.gLat.toFixed(5) + '|' + R.toFixed(2) + '|' + cw + '|' + ch + '|' + q + '|' + GLB.texV + '|' + cloudA.toFixed(2);
  if (key !== GLB.key) { GLB.key = key; GLB.drawn = glbRender(cx, cy, R, cw, ch, q, cloudA); }
  if (GLB.drawn) { const d = GLB.drawn; c.imageSmoothingEnabled = true; c.drawImage(GLB.cv, d.x0, d.y0, d.x1 - d.x0, d.y1 - d.y0); }
  glbMarks(c, cw, ch, cx, cy, R, s, now);
}
// the names of the world, written on the ball
// [name, x, z, from zoom, to zoom, size, sea]
const GLB_NAMES = [
  ['העולם החדש', 0, -40, 0, 1.3, 22], ['העולם הישן', OW.cx, -120, 0, 1.3, 22],
  ['האוקיינוס האטלנטי', 2250, 260, 0, 99, 15, 1], ['האוקיינוס השקט', 6750, 120, 0, 99, 15, 1],
  ['הג׳ונגל', -280, 30, 1.3, 99, 16], ['יפן', OW.cx + 0.87 * 1500, -330, 1.3, 99, 15]];
const GLB_LANDS = new Set(['הצפון הקפוא', 'הסוואנה', 'המדבר הגדול', 'חוף הים', 'אירופה', 'ארצות הצפון', 'הערבה הגדולה', 'סין', 'הודו', 'אפריקה', 'מדבר ערב', 'הים התיכון', 'הים השחור', 'ההימלאיה']);
function glbMarks(c, cw, ch, cx, cy, R, s, now) {
  const L = [], F = [], on = (x, z) => glbProj(x, z, cx, cy, R), H = P.human;
  const fade = (q, f) => clamp((q[2] - 0.08) * 3, 0, 1) * f;
  const name = (t, x, z, size, col, p, sea) => {
    const q = on(x, z); if (!q || q[2] < 0.2) return;
    L.push({ t, x: q[0], y: q[1], p, f: `${sea ? 600 : 800} ${size}px ${MAPFONT}`, h: size + 4, col: sea ? `rgba(214,236,255,${fade(q, 0.9).toFixed(2)})` : col || `rgba(255,248,226,${fade(q, 0.96).toFixed(2)})`, lw: sea ? 3 : 4.5, halo: sea ? 'rgba(6,24,48,.55)' : 'rgba(10,12,6,.7)' });
  };
  const gz = MAPV.gz;
  for (const [t, x, z, g0, g1, size, sea] of GLB_NAMES) if (gz >= g0 && gz < g1) name(t, x, z, size, null, sea ? 30 : 70, sea);
  if (gz >= 1.3) for (const p of POI) if (GLB_LANDS.has(p.n)) name(p.n, p.x, p.z, 15, null, 35, /^הים/.test(p.n));
  // the ice at the ends of the world, when you tip the ball to look at it
  if (Math.abs(MAPV.gLat) > 0.45) { const n = MAPV.gLat > 0; name(n ? 'הקרח של הצפון' : 'הקרח של הדרום', glbX(MAPV.gLon), n ? -1680 : 1680, 14, 'rgba(235,245,255,.95)', 25); }
  // the roads of the Old World, faint from far, clearer as you come closer
  if (s >= 0.12 && ROADS.list.length) {
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = `rgba(232,206,150,${(0.35 + smooth(0.12, 0.3, s) * 0.4).toFixed(2)})`; c.lineWidth = s < 0.22 ? 1 : 1.6;
    for (const Rd of ROADS.list) { let pen = false; c.beginPath(); for (let k = 0; k < Rd.P.length; k += 5) { const q = on(Rd.P[k].x, Rd.P[k].z); if (!q) { pen = false; continue; } if (pen) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); pen = true; } c.stroke(); }
    c.restore();
  }
  // the ferry's way across the ocean
  if (H) {
    const NP = HUNT.camps.filter(cp => ferryPort(cp) === 'new'), OP = HUNT.camps.filter(cp => ferryPort(cp) === 'old'); let named = false;
    for (const a of NP) {
      let b = null, bd = 1e9; for (const o of OP) { const d = Math.hypot(ringDX(a.x, o.x), o.z - a.z); if (d < bd) { bd = d; b = o; } }
      if (!b) continue;
      const dx = ringDX(a.x, b.x), dz = b.z - a.z, N = 60; let pen = false, mid = null;
      c.save(); c.setLineDash([6, 5]); c.lineWidth = 2; c.strokeStyle = 'rgba(255,236,190,.85)'; c.beginPath();
      for (let k = 0; k <= N; k++) { const t = k / N, q = on(a.x + dx * t, a.z + dz * t + Math.sin(t * Math.PI) * 90); if (!q) { pen = false; continue; } if (pen) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); pen = true; if (k === N / 2) mid = q; }
      c.stroke(); c.restore();
      if (mid) { icShip(c, mid[0], mid[1], 6); if (!named && mid[2] > 0.3) { named = true; L.push({ t: 'הספינה בין העולמות', x: mid[0], y: mid[1] - 15, p: 50, f: `600 12px ${MAPFONT}`, col: '#ffe9c0' }); } F.push({ x: mid[0], y: mid[1], r: 12, k: 'tribe', o: a, i: HUNT.camps.indexOf(a) }); }
    }
  }
  // the tribes, the towns and the castles you know
  HUNT.camps.forEach((cp, i) => {
    if (!campShown(cp, i)) return; const q = on(cp.x, cp.z); if (!q) return;
    const rel = mapRel(i), big = cp.kind === 'castle' || cp.kind === 'city', imp = big || rel.k === 'war' || rel.k === 'ally' || rel.k === 'vassal';
    const r = clamp(2.5 + s * 16, 3.2, 8.5) * (big ? 1.15 : 1);
    if (s < 0.1 && !imp) icDot(c, q[0], q[1], 2.6, rel.col); else campIc(c, cp, q[0], q[1], r, rel.col);
    if (s >= 0.16 || (imp && s >= 0.08)) L.push({ t: cp.tribe, x: q[0], y: q[1] - r - 9, p: rel.k === 'war' ? 64 : big ? 58 : 46, f: `700 ${s >= 0.25 ? 13 : 12}px ${MAPFONT}`, col: '#fff3dc', sub: s >= 0.25 ? rel.t : '', sc: rel.col });
    F.push({ x: q[0], y: q[1], r: Math.max(9, r + 3), k: 'tribe', o: cp, i });
  });
  // the other players, and the villages in the world's book
  onlineMapMarks(c, (x, z) => on(x, z), L, F, true);
  // your village, your den, your target
  const v = H && ownCamp();
  if (v) { const q = on(v.x, v.z); if (q) { icHouse(c, q[0], q[1], clamp(6 + s * 14, 7, 11), MAPC.home); L.push({ t: vxVillageName(), x: q[0], y: q[1] - 19, p: 90, f: `800 14px ${MAPFONT}`, col: '#ffe2a0', force: true }); F.push({ x: q[0], y: q[1], r: 14, k: 'village', o: v }); } }
  if (DEN.pos && !H) { const q = on(DEN.pos.x, DEN.pos.z); if (q) { icDen(c, q[0], q[1], 8, '#ffd34d'); F.push({ x: q[0], y: q[1], r: 13, k: 'den' }); } }
  if (WAY.p) { const q = on(WAY.p.x, WAY.p.z); if (q) { icFlag(c, q[0], q[1], 6.5, MAPC.way); L.push({ t: WAY.label || 'היעד', x: q[0], y: q[1] - 24, p: 85, f: `700 13px ${MAPFONT}`, col: '#d8eeff' }); F.push({ x: q[0], y: q[1] - 6, r: 13, k: 'way' }); } }
  // what you chose
  const sel = MAPV.sel;
  if (sel && sel.wx !== undefined) { const q = on(sel.wx, sel.wz); if (q) { c.save(); c.setLineDash([5, 4]); c.strokeStyle = '#fff'; c.lineWidth = 2.5; c.beginPath(); c.arc(q[0], q[1], (sel.r || 10) + 6, 0, TAU); c.stroke(); c.restore(); if (sel.k === 'spot') icFlag(c, q[0], q[1], 6, 'rgba(255,255,255,.9)'); } }
  // you: a ring that keeps calling, so you are found at once; on the far side of the ball, an arrow on its rim shows the way round
  const a = P.a;
  if (a) {
    const q = glbProj(a.pos.x, a.pos.z, cx, cy, R, true);
    if (q[2] >= 0.04) {
      const t = (now / 1000) % 1.6 / 1.6; c.beginPath(); c.arc(q[0], q[1], 9 + t * 18, 0, TAU); c.strokeStyle = `rgba(255,211,77,${(0.8 * (1 - t)).toFixed(2)})`; c.lineWidth = 3; c.stroke();
      icArrow(c, q[0], q[1], Math.PI - a.yaw, 9.5, MAPC.you);
      L.push({ t: 'אתה כאן', x: q[0], y: q[1] + 20, p: 100, f: `800 13px ${MAPFONT}`, col: '#ffe9a8', force: true }); F.push({ x: q[0], y: q[1], r: 15, k: 'you' });
    } else {
      const dx = q[0] - cx, dy = q[1] - cy, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d, m = 26;
      const rr = Math.min(R + 16, ux > 0.01 ? (cw - m - cx) / ux : ux < -0.01 ? (m - cx) / ux : 1e9, uy > 0.01 ? (ch - m - cy) / uy : uy < -0.01 ? (m - cy) / uy : 1e9), ex = cx + ux * rr, ey = cy + uy * rr;
      c.save(); c.translate(ex, ey); c.rotate(Math.atan2(dy, dx)); c.beginPath(); c.moveTo(10, 0); c.lineTo(-7, -8); c.lineTo(-7, 8); c.closePath(); c.fillStyle = MAPC.you; c.fill(); c.lineWidth = 1.5; c.strokeStyle = MAPC.ink; c.stroke(); c.restore();
      L.push({ t: 'אתה בצד השני של הכדור', x: ex - ux * 34, y: ey - uy * 20, p: 100, f: `700 12px ${MAPFONT}`, col: '#ffe9a8', force: true }); F.push({ x: ex, y: ey, r: 18, k: 'you' });
    }
  }
  mapLabels({ c }, L);
  // how much of the world you know
  if (H) {
    const all = HUNT.camps.filter(cp => !cp.gone && !cp.own && !cp.bandit), known = all.filter(cp => VX.known.has(HUNT.camps.indexOf(cp))).length;
    const t = `🌍 הכרת ${known} מתוך ${all.length} שבטים, עיירות וטירות`;
    c.font = `600 12.5px ${MAPFONT}`; const w = c.measureText(t).width + 22, x0 = 12, y0 = ch - 40;
    c.fillStyle = 'rgba(8,18,30,.72)'; c.beginPath(); c.roundRect ? c.roundRect(x0, y0, w, 28, 9) : c.rect(x0, y0, w, 28); c.fill();
    c.fillStyle = '#eaf2ff'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText(t, x0 + 11, y0 + 14.5);
  }
  MAPV.feats = F;
}

// ---------- moving between the ball and the flat map ----------
// a picture of what was on the screen, faded away over the new view
function mapSnap(dir) {
  const cv = document.getElementById('bigmap'); if (!cv || !cv.width) return;
  const s = document.createElement('canvas'); s.width = cv.width; s.height = cv.height; s.getContext('2d').drawImage(cv, 0, 0);
  GLB.fade = { cv: s, t0: performance.now(), dir };
}
function glbSave() { try { localStorage.setItem('amazonia-map-globe', MAPV.globe ? '1' : '0'); } catch (e) { /* only for now */ } }
function glbBtn() { const b = document.querySelector('#mapov [data-m=globe]'); if (b) b.classList.toggle('on', !!MAPV.globe); const h = document.getElementById('mapHint'); if (h) h.textContent = mapHintText(); }
// into the flat map, at a place of the world
function glbToFlat(x, z, s) {
  mapSnap(1); GLB.anim = null; GLB.vel = null;
  MAPV.globe = false; MAPV.cx = wrapX(x); MAPV.cz = clamp(z, -W.half, W.half); MAPV.s = Math.max(s || glbSIn(), glbSIn()); MAPV.fit = false;
  mapClamp(); glbBtn(); glbSave(); MAPV.dirty = true;
}
// out to the ball, turned to where the flat map was looking
function flatToGlobe(gz) {
  mapSnap(-1); GLB.anim = null; GLB.vel = null;
  MAPV.globe = true; MAPV.gLon = glbLon(MAPV.cx); MAPV.gLat = clamp(glbLat(MAPV.cz), -1.25, 1.25); MAPV.gz = clamp(gz || glbGz(glbSOut()), 0.8, glbGzMax() * 0.98);
  MAPV.sel = null; mapInfoShow(null); glbBtn(); glbSave(); MAPV.dirty = true;
}
// turn the ball smoothly to a place (and zoom to gz); then, maybe, something more
function glbFlyTo(x, z, gz, then) {
  const lon1 = glbLon(x), lat1 = clamp(glbLat(z), -1.25, 1.25);
  let dl = (lon1 - MAPV.gLon) % TAU; if (dl > Math.PI) dl -= TAU; else if (dl < -Math.PI) dl += TAU;
  const far = Math.hypot(dl, lat1 - MAPV.gLat);
  GLB.vel = null; GLB.anim = { t0: performance.now(), dur: clamp(300 + far * 420, 300, 1100), lon0: MAPV.gLon, dl, lat0: MAPV.gLat, lat1, gz0: MAPV.gz, gz1: gz || MAPV.gz, then };
  MAPV.dirty = true;
}
// every frame of the map: the ball spinning on by itself after a flick, a flight, the fade between the two maps
function glbTick(dt) {
  let moved = false;
  const A = GLB.anim;
  if (A) {
    const t = clamp((performance.now() - A.t0) / A.dur, 0, 1), e = t * t * (3 - 2 * t);
    MAPV.gLon = A.lon0 + A.dl * e; MAPV.gLat = lerp(A.lat0, A.lat1, e); MAPV.gz = Math.exp(lerp(Math.log(A.gz0), Math.log(A.gz1), e)); moved = true;
    if (t >= 1) { GLB.anim = null; if (A.then) A.then(); }
  }
  const V = GLB.vel;
  if (V && !A) {
    MAPV.gLon += V.lon * dt; MAPV.gLat = clamp(MAPV.gLat + V.lat * dt, -1.25, 1.25);
    const k = Math.exp(-dt * 3.4); V.lon *= k; V.lat *= k; moved = true;
    if (Math.abs(V.lon) + Math.abs(V.lat) < 0.03) GLB.vel = null;
  }
  if (moved) { GLB.moveT = performance.now(); MAPV.dirty = true; }
  if (GLB.fade) MAPV.dirty = true;
}
function mapFadeDraw(c, cw, ch) {
  const F = GLB.fade; if (!F) return;
  const t = (performance.now() - F.t0) / 300; if (t >= 1) { GLB.fade = null; return; }
  const k = F.dir > 0 ? 1 + t * 0.7 : 1 - t * 0.28, w = cw * k, h = ch * k;
  c.save(); c.globalAlpha = (1 - t) * (1 - t); c.imageSmoothingEnabled = true; c.drawImage(F.cv, (cw - w) / 2, (ch - h) / 2, w, h); c.restore();
}
function mapHintText() {
  return MAPV.globe ? 'גוררים כדי לסובב את העולם · צובטים או גלגלת כדי להתקרב, ואז הכדור נפתח למפה · נגיעה במקום מראה מה הוא'
    : 'גוררים כדי לזוז · צובטים או גלגלת כדי להתקרב · מתרחקים עד הסוף, והמפה נסגרת לכדור העולם';
}
