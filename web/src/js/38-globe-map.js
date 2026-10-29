// ================= THE MAP OF A ROUND WORLD: two continents and the sea, around and around; and the world as a globe =================
const GMAP = { img2: null, S2: 0, rows: 0 };
const SEA_RGB = [28, 74, 112], ICE_RGB = [214, 228, 236];
// the colour of a place outside the New World's grid: the Old World's ground, the open sea, the pack ice
function owMapColorAt(x, z, o) {
  if (Math.abs(z) > LIMIT + 8) { o[0] = ICE_RGB[0]; o[1] = ICE_RGB[1]; o[2] = ICE_RGB[2]; return o; }
  if (!inOld(x, z)) { const d = clamp(-seaFloor(x, z) / 30, 0, 1); o[0] = lerp(40, SEA_RGB[0], d); o[1] = lerp(96, SEA_RGB[1], d); o[2] = lerp(140, SEA_RGB[2], d); return o; }
  const fx = (x - OW.x0) / OW.cell, fz = (z - OW.z0) / OW.cell, ix = clamp(Math.floor(fx), 0, OW.N - 1), iz = clamp(Math.floor(fz), 0, OW.N - 1), tx = clamp(fx - ix, 0, 1), tz = clamp(fz - iz, 0, 1);
  const i = iz * OW.V + ix, wa = (1 - tx) * (1 - tz), wb = tx * (1 - tz), wc = (1 - tx) * tz, wd = tx * tz, V = OW.V;
  const bl = (A, s, k) => A[i * s + k] * wa + A[(i + 1) * s + k] * wb + A[(i + V) * s + k] * wc + A[(i + V + 1) * s + k] * wd;
  const h = owH(x, z);
  if (h < 0) {
    const dep = clamp(-h / 14, 0, 1), sea = WBLUE2 ? bl(WBLUE2, 1, 0) / 255 : 1;
    o[0] = lerp(lerp(96, 52, sea), lerp(40, 22, sea), dep); o[1] = lerp(lerp(150, 140, sea), lerp(90, 74, sea), dep); o[2] = lerp(lerp(120, 170, sea), lerp(110, 120, sea), dep); return o;
  }
  if (!TCOL2) { o[0] = 120; o[1] = 140; o[2] = 80; return o; }
  const hx = owH(x + 3, z) - owH(x - 3, z), hz = owH(x, z + 3) - owH(x, z - 3), sh = clamp(1 + (-hx * 0.7 - hz * 0.45) * 0.08, 0.55, 1.45), f = clamp(bl(FO2, 1, 0), 0, 1) * 0.35;
  o[0] = bl(TCOL2, 3, 0) * sh * (1 - f); o[1] = bl(TCOL2, 3, 1) * sh * (1 - f * 0.6); o[2] = bl(TCOL2, 3, 2) * sh * (1 - f);
  return o;
}
// the Old World's picture, made a few rows at a time (it is only needed once you sail there)
function owMapStep(rows) {
  if (!TCOL2) return false;
  if (!GMAP.img2) { const S = GMAP.S2 = PHONE ? 640 : 900, cv = document.createElement('canvas'); cv.width = cv.height = S; GMAP.img2 = cv; GMAP.ctx2 = cv.getContext('2d'); GMAP.rows = 0; GMAP.d2 = new Uint8ClampedArray(S * S * 4); }
  const S = GMAP.S2; if (GMAP.rows >= S) return true;
  const n = Math.min(rows, S - GMAP.rows), img = GMAP.ctx2.createImageData(S, n), d = img.data, o = [0, 0, 0];
  for (let j = 0; j < n; j++) for (let i = 0; i < S; i++) {
    const x = OW.x0 + (i + 0.5) / S * OW.size, z = OW.z0 + (GMAP.rows + j + 0.5) / S * OW.size; owMapColorAt(x, z, o);
    const k = (j * S + i) * 4; d[k] = o[0]; d[k + 1] = o[1]; d[k + 2] = o[2]; d[k + 3] = 255;
  }
  GMAP.ctx2.putImageData(img, 0, GMAP.rows); GMAP.d2.set(d, GMAP.rows * S * 4); GMAP.rows += n;
  if (GMAP.rows >= S && GLB.tex && !GLB.tex.full) { GLB.tex = null; GLB.tb = null; }   // the globe is made again with the Old World on it
  return GMAP.rows >= S;
}
const owMapReady = () => GMAP.img2 && GMAP.rows >= GMAP.S2;

// ---------- the ground of the map: the sea, the two continents, their close-up tiles; copies across the seam ----------
function mapBase(V, maxLv) {
  const c = V.c, img = UI.mapImg, hw = V.rot ? V.R : V.cw / 2 / V.s + 2, hh = V.rot ? V.R : V.ch / 2 / V.s + 2, x0 = V.cx - hw, x1 = V.cx + hw, z0 = V.cz - hh, z1 = V.cz + hh;
  const dpr = Math.min(2, devicePixelRatio || 1), dev = V.s * dpr;
  if (!owMapReady() && (isOld(V.cx) || V.cx > W.half + 200 || V.cx < -W.half - 200 || MAPV.open)) owMapStep(MAPV.open ? 160 : 40);
  mapWorld(V); c.imageSmoothingEnabled = true;
  c.fillStyle = `rgb(${SEA_RGB})`; c.fillRect(x0, z0, x1 - x0, z1 - z0);
  c.fillStyle = `rgb(${ICE_RGB})`; if (z0 < -LIMIT) c.fillRect(x0, z0, x1 - x0, -LIMIT - z0); if (z1 > LIMIT) c.fillRect(x0, LIMIT, x1 - x0, z1 - LIMIT);
  const want = [], lv = Math.min(maxLv, dev <= 0.75 ? 0.5 : dev <= 2.6 || TOUCH ? 1 : 2), pad = 0.6 / V.s;
  const land = (pic, ox, oz, size, pre, base) => {
    if (x1 < ox || x0 > ox + size || z1 < oz || z0 > oz + size) return;
    if (pic) c.drawImage(pic, ox, oz, size, size);
    if (!(dev > base * 1.4)) return;
    const N = Math.ceil(size / MTILE), i0 = clamp(Math.floor((x0 - ox) / MTILE), 0, N - 1), i1 = clamp(Math.floor((x1 - ox) / MTILE), 0, N - 1), j0 = clamp(Math.floor((z0 - oz) / MTILE), 0, N - 1), j1 = clamp(Math.floor((z1 - oz) / MTILE), 0, N - 1);
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      let t = mapTileAt(pre, i, j, lv, ox, oz, want);
      if (!t && lv > 0.5) { const q = MAPV.tiles.get(pre + '0.5:' + i + ':' + j); t = q ? q.cv : null; }
      if (t) c.drawImage(t, ox + i * MTILE - pad, oz + j * MTILE - pad, MTILE + pad * 2, MTILE + pad * 2);
    }
  };
  for (const o of [-GLOBE.P, 0, GLOBE.P]) {
    land(img, -W.half + o, -W.half, W.size, '', img ? img.width / W.size : 0.3);
    land(owMapReady() ? GMAP.img2 : null, OW.x0 + o, OW.z0, OW.size, 'o', GMAP.S2 ? GMAP.S2 / OW.size : 0.3);
  }
  want.sort((a, b) => Math.hypot(a[4] + (a[1] + 0.5) * MTILE - V.cx, a[5] + (a[2] + 0.5) * MTILE - V.cz) - Math.hypot(b[4] + (b[1] + 0.5) * MTILE - V.cx, b[5] + (b[2] + 0.5) * MTILE - V.cz));
  MAPV.tq = want;
  c.restore();
}
function mapTileAt(pre, ix, iz, lv, ox, oz, want) {
  const k = pre + lv + ':' + ix + ':' + iz, t = MAPV.tiles.get(k);
  if (t) { t.u = MAPV.frame; if (t.stale) want.push([k, ix, iz, lv, ox, oz]); return t.cv; }
  if (pre === 'o' && !TCOL2) return null;
  want.push([k, ix, iz, lv, ox, oz]); return null;
}
function mapTileWork(ms) {
  const t0 = performance.now(); let n = 0;
  while (MAPV.tq.length && (n === 0 || performance.now() - t0 < ms)) {
    const [k, ix, iz, lv, ox0, oz0] = MAPV.tq.shift(); n++;
    const old = MAPV.tiles.get(k); if (old && !old.stale) continue;
    if (old) mapTileDel(k);
    // the tile's corner in the canonical ring (a copy across the seam uses the same tile)
    const ox = wrapX(ox0 + 1) - 1, oz = oz0;
    const px = Math.round(MTILE * lv), cv = document.createElement('canvas'); cv.width = cv.height = px;
    const c = cv.getContext('2d'), img = c.createImageData(px, px), d = img.data, x0 = ox + ix * MTILE, z0 = oz + iz * MTILE, st = MTILE / px;
    for (let j = 0; j < px; j++) for (let i = 0; i < px; i++) {
      mapColorAt(x0 + (i + 0.5) * st, z0 + (j + 0.5) * st, _mco); const p = (j * px + i) * 4;
      d[p] = _mco[0]; d[p + 1] = _mco[1]; d[p + 2] = _mco[2]; d[p + 3] = 255;
    }
    c.putImageData(img, 0, 0); if (lv >= 0.5) mapTileTrees(c, x0, z0, lv);
    MAPV.tiles.set(k, { cv, u: MAPV.frame, px: px * px }); MAPV.tpx += px * px;
  }
  const cap = TOUCH ? 4e6 : 1e7;
  if (MAPV.tpx > cap) { const L = [...MAPV.tiles.entries()].sort((a, b) => a[1].u - b[1].u); for (const [k] of L) { if (MAPV.tpx <= cap * 0.8) break; mapTileDel(k); } }
  return n;
}
function mapTreeMark(x, z) {
  if (!MAPV.tiles.size) return;
  const old = isOld(x), ox = old ? OW.x0 : -W.half, oz = old ? OW.z0 : -W.half, pre = old ? 'o' : '', N = Math.ceil((old ? OW.size : W.size) / MTILE);
  const tx = v => clamp(Math.floor((v - ox) / MTILE), 0, N - 1), tz = v => clamp(Math.floor((v - oz) / MTILE), 0, N - 1);
  for (const lv of [0.5, 1, 2]) for (let j = tz(z - 8); j <= tz(z + 8); j++) for (let i = tx(x - 8); i <= tx(x + 8); i++) { const q = MAPV.tiles.get(pre + lv + ':' + i + ':' + j); if (q) q.stale = true; }
}
// the roads, drawn over the map at every zoom (they are long and thin, so a line is sharper than a tile)
function mapRoads(V) {
  if (!ROADS.list.length) return;
  const c = V.c, w = clamp(5.2 * V.s, V.mini ? 1.6 : 1.3, 7), m = 30;
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  for (const R of ROADS.list) {
    const bb = R.bb, cx = (bb[0] + bb[1]) / 2, cz = (bb[2] + bb[3]) / 2, [px, py] = mapP(V, cx, cz), half = Math.max(bb[1] - bb[0], bb[3] - bb[2]) / 2 * V.s;
    if (px + half < -m || px - half > V.cw + m || py + half < -m || py - half > V.ch + m) continue;
    const step = V.s < 0.25 ? 6 : V.s < 0.6 ? 3 : 1;
    c.beginPath();
    for (let k = 0; k < R.P.length; k += step) { const [x, y] = mapP(V, R.P[k].x, R.P[k].z); if (k) c.lineTo(x, y); else c.moveTo(x, y); }
    const l = R.P[R.P.length - 1], [lx, ly] = mapP(V, l.x, l.z); c.lineTo(lx, ly);
    c.strokeStyle = 'rgba(70,54,32,.55)'; c.lineWidth = w + 1.8; c.stroke();
    c.strokeStyle = '#c9aa74'; c.lineWidth = w; c.stroke();
  }
  c.restore();
}

// ---------- the little pictures of the Old World's places: a castle, a city of domes and towers, the bandits' crossed blades ----------
function icCastle(c, x, y, r, fill) {
  const w = r * 1.15;
  c.beginPath(); c.moveTo(x - w, y + r * 0.8); c.lineTo(x - w, y - r * 0.5); c.lineTo(x - w * 0.62, y - r * 0.5); c.lineTo(x - w * 0.62, y - r * 0.12); c.lineTo(x - w * 0.24, y - r * 0.12);
  c.lineTo(x - w * 0.24, y - r); c.lineTo(x + w * 0.24, y - r); c.lineTo(x + w * 0.24, y - r * 0.12); c.lineTo(x + w * 0.62, y - r * 0.12); c.lineTo(x + w * 0.62, y - r * 0.5); c.lineTo(x + w, y - r * 0.5); c.lineTo(x + w, y + r * 0.8); c.closePath();
  c.fillStyle = fill; c.fill(); c.lineWidth = Math.max(1.4, r * 0.17); c.strokeStyle = MAPC.ink; c.stroke();
  c.beginPath(); c.moveTo(x - r * 0.24, y + r * 0.8); c.lineTo(x - r * 0.24, y + r * 0.32); c.arc(x, y + r * 0.32, r * 0.24, Math.PI, 0); c.lineTo(x + r * 0.24, y + r * 0.8); c.closePath(); c.fillStyle = 'rgba(30,20,10,.85)'; c.fill();
}
function icCity(c, x, y, r, fill) {
  c.beginPath(); c.moveTo(x - r * 1.1, y + r * 0.8); c.lineTo(x - r * 1.1, y - r * 0.08); c.lineTo(x - r * 0.78, y - r * 0.08); c.lineTo(x - r * 0.78, y - r * 0.95); c.lineTo(x - r * 0.48, y - r * 0.95); c.lineTo(x - r * 0.48, y - r * 0.08);
  c.lineTo(x - r * 0.36, y - r * 0.08); c.arc(x + r * 0.22, y - r * 0.08, r * 0.58, Math.PI, 0); c.lineTo(x + r * 1.1, y - r * 0.08); c.lineTo(x + r * 1.1, y + r * 0.8); c.closePath();
  c.fillStyle = fill; c.fill(); c.lineWidth = Math.max(1.4, r * 0.17); c.strokeStyle = MAPC.ink; c.stroke();
  c.fillStyle = 'rgba(30,20,10,.85)'; c.fillRect(x + r * 0.04, y + r * 0.3, r * 0.36, r * 0.5);
}
function icSwords(c, x, y, r, fill) {
  c.beginPath(); c.arc(x, y, r * 0.95, 0, TAU); c.fillStyle = '#2a2420'; c.fill(); c.lineWidth = Math.max(1.4, r * 0.18); c.strokeStyle = fill; c.stroke();
  c.save(); c.lineCap = 'round'; c.strokeStyle = '#ece6d8'; c.lineWidth = Math.max(1.6, r * 0.2);
  c.beginPath(); c.moveTo(x - r * 0.52, y - r * 0.52); c.lineTo(x + r * 0.42, y + r * 0.42); c.moveTo(x + r * 0.52, y - r * 0.52); c.lineTo(x - r * 0.42, y + r * 0.42); c.stroke();
  c.lineWidth = Math.max(1.2, r * 0.14); c.strokeStyle = '#d8a020'; c.beginPath(); c.moveTo(x + r * 0.16, y + r * 0.56); c.lineTo(x + r * 0.56, y + r * 0.16); c.moveTo(x - r * 0.16, y + r * 0.56); c.lineTo(x - r * 0.56, y + r * 0.16); c.stroke();
  c.restore();
}
function campIc(c, cp, x, y, r, fill) {
  if (cp.bandit) icSwords(c, x, y, r, fill);
  else if (cp.kind === 'castle') icCastle(c, x, y, r * 1.1, fill);
  else if (cp.kind === 'city' || cp.kind === 'town') icCity(c, x, y, r * (cp.kind === 'city' ? 1.1 : 0.95), fill);
  else if (cp.civ && cp.kind === 'village') icHouse(c, x, y, r * 0.9, fill);
  else icTent(c, x, y, r, fill);
}
