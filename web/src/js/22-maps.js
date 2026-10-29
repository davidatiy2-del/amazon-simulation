// ================= THE MAPS: a big map to read (drag it, zoom it, names and icons, a legend, tap anything to see what it is)
// and a clear little map in the corner: north up (or turning with you), where you look, the forest, the village, the tribes,
// and arrows on its rim to home and to your target. Both are drawn by the same hand, so they look alike.
const MAPV = { cx: 0, cz: 0, s: 0, ready: false, open: false, dirty: true, raf: 0, ptrs: new Map(), g: null, feats: [], sel: null,
  north: true, tiles: new Map(), tq: [], tpx: 0, tileT: 0, frame: 0, lastDraw: 0, el: {}, cw: 0, ch: 0, miniLbl: '', miniLblT: 0, legend: false, hint: 0 };
try { MAPV.north = localStorage.getItem('amazonia-map-north') !== '0'; } catch (e) { /* the browser keeps nothing: north up */ }
// the old tap-to-target of the big map is replaced by the map's own taps (this keeps the old one from starting)
{ const cv = document.getElementById('bigmap'); if (cv) cv.dataset.way = '1'; }
const MAPC = { you: '#ffd34d', home: '#f2b84b', way: '#5ab4ff', ally: '#4fd16a', friend: '#a6dc7c', known: '#e2d79e', neutral: '#c9c2b0', tense: '#f3a352', hostile: '#ec6b3c', war: '#ff3d2e', vassal: '#f2b84b', member: '#f3d48a', ink: 'rgba(16,12,6,.92)' };
const MAPFONT = 'Rubik, "Segoe UI", Arial, sans-serif';

// ---------- the colours of the ground (the big picture and the close-up tiles use the same ones) ----------
const _mco = [0, 0, 0];
function mapColorAt(x, z, o, raw) {
  if (!inMain(x, z)) return owMapColorAt(x, z, o);
  const h = getH(x, z), B = mapBl(x, z), i = B.i, V = W.V;
  // the water of the four grid points around, blended: smooth shores
  let w = -999;
  if (h < WATER_Y) w = WATER_Y;
  else {
    let wet = 0, lv = -999;
    if (WSURF[i] > HM[i]) { wet += B.a; lv = WSURF[i]; }
    if (WSURF[i + 1] > HM[i + 1]) { wet += B.b; lv = Math.max(lv, WSURF[i + 1]); }
    if (WSURF[i + V] > HM[i + V]) { wet += B.c; lv = Math.max(lv, WSURF[i + V]); }
    if (WSURF[i + V + 1] > HM[i + V + 1]) { wet += B.d; lv = Math.max(lv, WSURF[i + V + 1]); }
    if (wet >= 0.5) w = Math.max(lv, h + 0.05);
  }
  let r, g, b;
  if (w > -900 && w > h + 0.02) { const dep = clamp((w - h) / 4, 0, 1); r = lerp(108, 34, dep); g = lerp(170, 90, dep); b = lerp(204, 152, dep); }
  else {
    const f = clamp(mapBg(FOREST), 0, 1);
    r = lerp(128, 46, f); g = lerp(150, 90, f); b = lerp(80, 44, f);
    if (h > 40) { const k = smooth(40, 95, h); r = lerp(r, 150, k); g = lerp(g, 124, k); b = lerp(b, 98, k); }
    const hx = getH(x + 2, z) - getH(x - 2, z), hz = getH(x, z + 2) - getH(x, z - 2), sh = clamp(1 + (-hx * 0.7 - hz * 0.45) * 0.1, 0.55, 1.45);
    r *= sh; g *= sh; b *= sh;
    if (Math.hypot(x - CLAY.x, z - CLAY.z) < 9) { r = 196; g = 120; b = 70; }
  }
  if (Math.abs(x) > MID - 70 || Math.abs(z) > MID - 70) { const q = mapTint(x, z, h, w, r, g, b); r = q[0]; g = q[1]; b = q[2]; }
  if (!raw && (Math.abs(x) > LIMIT || Math.abs(z) > LIMIT)) { r *= 0.45; g *= 0.45; b *= 0.45; }
  o[0] = r; o[1] = g; o[2] = b; return o;
}
// close-up tiles of the ground, made a few at a time when they are first needed
const MTILE = 128;
function mapTile(ix, iz, lv, want) {
  const k = lv + ':' + ix + ':' + iz, t = MAPV.tiles.get(k);
  if (t) { t.u = MAPV.frame; if (t.stale) want.push([k, ix, iz, lv]); return t.cv; }   // an old one is shown until the new one is made
  want.push([k, ix, iz, lv]); return null;
}
function mapTileWork(ms) {
  const t0 = performance.now(); let n = 0;
  while (MAPV.tq.length && (n === 0 || performance.now() - t0 < ms)) {
    const [k, ix, iz, lv] = MAPV.tq.shift(); n++;
    const old = MAPV.tiles.get(k); if (old && !old.stale) continue;
    if (old) mapTileDel(k);
    const px = Math.round(MTILE * lv), cv = document.createElement('canvas'); cv.width = cv.height = px;
    const c = cv.getContext('2d'), img = c.createImageData(px, px), d = img.data, x0 = -W.half + ix * MTILE, z0 = -W.half + iz * MTILE, st = MTILE / px;
    for (let j = 0; j < px; j++) for (let i = 0; i < px; i++) {
      mapColorAt(x0 + (i + 0.5) * st, z0 + (j + 0.5) * st, _mco); const p = (j * px + i) * 4;
      d[p] = _mco[0]; d[p + 1] = _mco[1]; d[p + 2] = _mco[2]; d[p + 3] = 255;
    }
    c.putImageData(img, 0, 0); if (lv >= 0.5) mapTileTrees(c, x0, z0, lv); MAPV.tiles.set(k, { cv, u: MAPV.frame, px: px * px }); MAPV.tpx += px * px;
  }
  // a memory of a few dozen tiles: the ones unused the longest go first
  const cap = TOUCH ? 4e6 : 1e7;
  if (MAPV.tpx > cap) { const L = [...MAPV.tiles.entries()].sort((a, b) => a[1].u - b[1].u); for (const [k] of L) { if (MAPV.tpx <= cap * 0.8) break; mapTileDel(k); } }
  return n;
}
function mapTileDel(k) { const t = MAPV.tiles.get(k); if (!t) return; MAPV.tpx -= t.px; MAPV.tiles.delete(k); }
function mapTilesClear() { MAPV.tiles.clear(); MAPV.tpx = 0; }
// the ground changes slowly (the forest is cut, the water is dammed): every few minutes the tiles are made again
function mapTilesFresh() { const now = performance.now(); if (now - MAPV.tileT > 300000) { for (const t of MAPV.tiles.values()) t.stale = true; MAPV.tileT = now; } }

// ---------- a view: where the map looks, how close, turned or not ----------
function mapView(c, cw, ch, ox, oy, cx, cz, s, rot, mini) {
  return { c, cw, ch, ox, oy, cx, cz, s, rot, cr: Math.cos(rot), sr: Math.sin(rot), mini, R: Math.hypot(cw, ch) / 2 / s };
}
function mapP(V, x, z) {
  let dx = ringDX(V.cx, x) * V.s, dz = (z - V.cz) * V.s;
  if (V.rot) { const rx = dx * V.cr - dz * V.sr; dz = dx * V.sr + dz * V.cr; dx = rx; }
  return [V.ox + dx, V.oy + dz];
}
// draw in metres (for the ground, the trees and the buildings)
function mapWorld(V) { const c = V.c; c.save(); c.translate(V.ox, V.oy); if (V.rot) c.rotate(V.rot); c.scale(V.s, V.s); c.translate(-V.cx, -V.cz); }
function mapBase(V, maxLv) {
  // what can be seen: a turned map needs its whole circle, a straight one only its rectangle
  const c = V.c, img = UI.mapImg, hw = V.rot ? V.R : V.cw / 2 / V.s + 2, hh = V.rot ? V.R : V.ch / 2 / V.s + 2, x0 = V.cx - hw, x1 = V.cx + hw, z0 = V.cz - hh, z1 = V.cz + hh;
  const dpr = Math.min(2, devicePixelRatio || 1), dev = V.s * dpr, base = img.width / W.size;
  mapWorld(V); c.imageSmoothingEnabled = true;
  c.fillStyle = '#18241a'; c.fillRect(x0, z0, x1 - x0, z1 - z0);
  c.drawImage(img, -W.half, -W.half, W.size, W.size);
  if (dev > base * 1.4) {
    const lv = Math.min(maxLv, dev <= 0.75 ? 0.5 : dev <= 2.6 || TOUCH ? 1 : 2), N = Math.ceil(W.size / MTILE), pad = 0.6 / V.s, want = [];
    const i0 = clamp(Math.floor((x0 + W.half) / MTILE), 0, N - 1), i1 = clamp(Math.floor((x1 + W.half) / MTILE), 0, N - 1);
    const j0 = clamp(Math.floor((z0 + W.half) / MTILE), 0, N - 1), j1 = clamp(Math.floor((z1 + W.half) / MTILE), 0, N - 1);
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      let t = mapTile(i, j, lv, want);
      if (!t && lv > 0.5) t = MAPV.tiles.has('0.5:' + i + ':' + j) ? MAPV.tiles.get('0.5:' + i + ':' + j).cv : null;   // a rougher one meanwhile
      if (t) c.drawImage(t, -W.half + i * MTILE - pad, -W.half + j * MTILE - pad, MTILE + pad * 2, MTILE + pad * 2);
    }
    // the nearest first
    want.sort((a, b) => Math.hypot(-W.half + (a[1] + 0.5) * MTILE - V.cx, -W.half + (a[2] + 0.5) * MTILE - V.cz) - Math.hypot(-W.half + (b[1] + 0.5) * MTILE - V.cx, -W.half + (b[2] + 0.5) * MTILE - V.cz));
    MAPV.tq = want;
  } else MAPV.tq = [];
  // the edge of the world that can be walked
  c.strokeStyle = 'rgba(255,240,200,.35)'; c.lineWidth = 2 / V.s; c.setLineDash([8 / V.s, 6 / V.s]); c.strokeRect(-LIMIT, -LIMIT, LIMIT * 2, LIMIT * 2); c.setLineDash([]);
  c.restore();
}
// faint lines every 100 m (or 500 m from far away)
function mapGrid(V) {
  const c = V.c, st = V.s >= 0.55 ? 100 : 500, x0 = Math.ceil((V.cx - V.R) / st) * st, z0 = Math.ceil((V.cz - V.R) / st) * st;
  mapWorld(V); c.strokeStyle = 'rgba(255,255,255,.07)'; c.lineWidth = 1 / V.s; c.beginPath();
  for (let x = x0; x < V.cx + V.R; x += st) { c.moveTo(x, V.cz - V.R); c.lineTo(x, V.cz + V.R); }
  for (let z = z0; z < V.cz + V.R; z += st) { c.moveTo(V.cx - V.R, z); c.lineTo(V.cx + V.R, z); }
  c.stroke(); c.restore();
}
// ---------- the forest, tree by tree (drawn into the close-up tiles; a felled or regrown tree makes its tiles again) ----------
const MTREE = { giant: [6.5, '#22492a'], canopy: [3.7, '#2c5a2c'], under: [1.9, '#3d6c35'], palm: [2.6, '#5c8b3c'], tfern: [1.6, '#4b7a3b'], pine: [2.3, '#2d523d'],
  spine: [2.2, '#b9cac3'], birch: [2.0, '#8aa65c'], acacia: [4.3, '#6f7f3a'], baobab: [5.0, '#7f6f49'], dpalm: [2.4, '#6e8b3f'] };
function mapTileTrees(c, x0, z0, lv) {
  const G = TREES.g; if (!G || !G.length) return;
  const m = 9, B = {}, i0 = g10c(x0 - m), i1 = g10c(x0 + MTILE + m), j0 = g10r(x0, z0 - m), j1 = g10r(x0, z0 + MTILE + m);
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
    const L = G[j * GN + i]; if (!L) continue;
    for (const e of L) { if (e.cut || e.ghost) continue; const k = MTREE[e.id]; if (k) (B[e.id] || (B[e.id] = [])).push((e.x - x0) * lv, (e.z - z0) * lv, k[0] * clamp(e.sc, 0.7, 1.4) * lv); }
  }
  // first the shadows, then the crowns
  c.fillStyle = 'rgba(8,16,6,.3)'; c.beginPath();
  for (const id in B) { const A = B[id]; for (let n = 0; n < A.length; n += 3) { const r = A[n + 2], x = A[n] + r * 0.32, z = A[n + 1] + r * 0.32; c.moveTo(x + r, z); c.arc(x, z, r, 0, TAU); } }
  c.fill();
  for (const id in B) {
    const A = B[id]; c.fillStyle = MTREE[id][1]; c.beginPath();
    for (let n = 0; n < A.length; n += 3) { const r = A[n + 2]; c.moveTo(A[n] + r, A[n + 1]); c.arc(A[n], A[n + 1], r, 0, TAU); }
    c.fill();
  }
}
function mapTreeMark(x, z) {
  if (!MAPV.tiles.size) return;
  const N = Math.ceil(W.size / MTILE), t = v => clamp(Math.floor((v + W.half) / MTILE), 0, N - 1);
  for (const lv of [0.5, 1, 2]) for (let j = t(z - 8); j <= t(z + 8); j++) for (let i = t(x - 8); i <= t(x + 8); i++) { const q = MAPV.tiles.get(lv + ':' + i + ':' + j); if (q) q.stale = true; }
}
// ---------- the village from above: roofs, fields, walls, bridges ----------
const MBLD = { hut: [2.4, 0, '#c09a5a'], house: [2.7, 2.5, '#b58c50'], long: [3.3, 7.0, '#ad854c'], hall: [6.2, 6.2, '#9c6a3c'], granary: [1.5, 0, '#cfac6c'], field: [4.0, 3.0, '#86a84c'],
  tower: [1.3, 1.3, '#7e5f42'], dock: [1.6, 3.2, '#7a5634'], kennel: [1.8, 1.4, '#a17d4f'], armory: [2.6, 2.2, '#8f6b48'], aviary: [1.9, 0, '#a98a5c'], totem: [0.7, 0, '#8a5a3a'],
  stable: [3.6, 2.4, '#a0784a'], cartshop: [2.8, 2.3, '#9a7650'], shipyard: [3.0, 5.0, '#7a5634'], torch: [0.4, 0, '#ff9a3c'] };
function mapBuildings(V) {
  const c = V.c, px = 1 / V.s; if (!BLD.list.length) return;
  mapWorld(V);
  for (const b of BLD.list) {
    const T = BTYPES[b.t]; if (!T) continue;
    if (Math.abs(b.x - V.cx) > V.R + 20 || Math.abs(b.z - V.cz) > V.R + 20) continue;
    if (T.span) { const e = brEnds(b); c.strokeStyle = b.done ? '#6e4c2c' : 'rgba(200,170,120,.6)'; c.lineWidth = Math.max(3, 3 * px); c.lineCap = 'butt'; c.beginPath(); c.moveTo(e.ax, e.az); c.lineTo(e.bx, e.bz); c.stroke(); continue; }
    if (T.len) {
      const e = segEnds(b), D = T.def || {};
      c.strokeStyle = b.broken ? '#e0483c' : !b.done ? 'rgba(220,190,140,.55)' : D.water ? '#5aa8e0' : D.gate ? '#f1c45a' : b.t === 'stonewall' || b.t === 'walltower' ? '#cfc7b4' : '#8c6a42';
      c.lineWidth = Math.max((D.gate ? 2.6 : 1.8) * px, D.gate ? 1.3 : b.t === 'stonewall' ? 1.1 : 0.7); c.lineCap = 'round';
      c.beginPath(); c.moveTo(e.ax, e.az); c.lineTo(e.bx, e.bz); c.stroke(); continue;
    }
    if (b.t === 'torch' && V.s < 2.5) continue;
    const f = MBLD[b.t] || [T.r * 0.7, T.r * 0.7, '#a8875a'];
    c.save(); c.translate(b.x, b.z); c.rotate(-(b.rot || 0)); c.globalAlpha = b.done ? 1 : 0.5;
    c.beginPath(); if (!f[1]) c.arc(0, 0, f[0], 0, TAU); else c.rect(-f[0], -f[1], f[0] * 2, f[1] * 2);
    c.fillStyle = f[2]; c.fill();
    if (b.t === 'field') { c.strokeStyle = 'rgba(52,84,26,.75)'; c.lineWidth = Math.max(0.25, px); c.beginPath(); for (let x = -f[0] + 0.7; x < f[0]; x += 0.9) { c.moveTo(x, -f[1] + 0.3); c.lineTo(x, f[1] - 0.3); } c.stroke(); }
    else if (f[1] && b.t !== 'tower' && b.t !== 'dock') { c.strokeStyle = 'rgba(60,40,16,.55)'; c.lineWidth = Math.max(0.3, px * 1.2); c.beginPath(); if (f[1] > f[0]) { c.moveTo(0, -f[1]); c.lineTo(0, f[1]); } else { c.moveTo(-f[0], 0); c.lineTo(f[0], 0); } c.stroke(); }
    c.lineWidth = px * 1.2; c.strokeStyle = 'rgba(40,26,12,.9)'; if (!b.done) c.setLineDash([3 * px, 2 * px]);
    c.beginPath(); if (!f[1]) c.arc(0, 0, f[0], 0, TAU); else c.rect(-f[0], -f[1], f[0] * 2, f[1] * 2); c.stroke(); c.setLineDash([]);
    c.restore();
  }
  c.restore();
}

// ---------- the little pictures ----------
function icTent(c, x, y, r, fill) {
  c.beginPath(); c.moveTo(x, y - r); c.lineTo(x + r * 1.08, y + r * 0.78); c.lineTo(x - r * 1.08, y + r * 0.78); c.closePath();
  c.fillStyle = fill; c.fill(); c.lineWidth = Math.max(1.4, r * 0.2); c.strokeStyle = MAPC.ink; c.stroke();
  c.beginPath(); c.moveTo(x, y - r * 0.05); c.lineTo(x + r * 0.34, y + r * 0.78); c.lineTo(x - r * 0.34, y + r * 0.78); c.closePath(); c.fillStyle = 'rgba(30,20,10,.8)'; c.fill();
}
function icHouse(c, x, y, r, fill) {
  c.beginPath(); c.moveTo(x, y - r); c.lineTo(x + r, y - r * 0.08); c.lineTo(x + r * 0.72, y - r * 0.08); c.lineTo(x + r * 0.72, y + r * 0.86); c.lineTo(x - r * 0.72, y + r * 0.86);
  c.lineTo(x - r * 0.72, y - r * 0.08); c.lineTo(x - r, y - r * 0.08); c.closePath(); c.fillStyle = fill; c.fill(); c.lineWidth = Math.max(1.4, r * 0.18); c.strokeStyle = MAPC.ink; c.stroke();
  c.fillStyle = 'rgba(30,20,10,.85)'; c.fillRect(x - r * 0.2, y + r * 0.3, r * 0.4, r * 0.56);
}
function icFlag(c, x, y, r, fill) {
  c.lineWidth = Math.max(1.6, r * 0.2); c.strokeStyle = MAPC.ink; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - r * 2.1); c.stroke();
  c.beginPath(); c.moveTo(x, y - r * 2.1); c.lineTo(x + r * 1.4, y - r * 1.65); c.lineTo(x, y - r * 1.2); c.closePath(); c.fillStyle = fill; c.fill(); c.lineWidth = Math.max(1.2, r * 0.14); c.stroke();
  c.beginPath(); c.ellipse(x, y, r * 0.5, r * 0.22, 0, 0, TAU); c.fillStyle = fill; c.fill(); c.stroke();
}
function icDiamond(c, x, y, r, fill) { c.beginPath(); c.moveTo(x, y - r); c.lineTo(x + r, y); c.lineTo(x, y + r); c.lineTo(x - r, y); c.closePath(); c.fillStyle = fill; c.fill(); c.lineWidth = Math.max(1.2, r * 0.22); c.strokeStyle = MAPC.ink; c.stroke(); }
function icDrop(c, x, y, r) {
  c.beginPath(); c.moveTo(x, y - r * 1.1); c.bezierCurveTo(x + r * 0.95, y - r * 0.1, x + r * 0.8, y + r * 0.85, x, y + r * 0.85); c.bezierCurveTo(x - r * 0.8, y + r * 0.85, x - r * 0.95, y - r * 0.1, x, y - r * 1.1);
  c.fillStyle = '#7cc8ff'; c.fill(); c.lineWidth = Math.max(1.2, r * 0.2); c.strokeStyle = '#0b2a44'; c.stroke();
}
function icPeak(c, x, y, r, two) {
  const pk = (px, w, h) => { c.beginPath(); c.moveTo(px - w, y + r * 0.7); c.lineTo(px, y + r * 0.7 - h); c.lineTo(px + w, y + r * 0.7); c.closePath(); c.fillStyle = '#a69a86'; c.fill(); c.lineWidth = Math.max(1.2, r * 0.18); c.strokeStyle = MAPC.ink; c.stroke();
    c.beginPath(); c.moveTo(px - w * 0.36, y + r * 0.7 - h * 0.64); c.lineTo(px, y + r * 0.7 - h); c.lineTo(px + w * 0.36, y + r * 0.7 - h * 0.64); c.closePath(); c.fillStyle = '#f4f1ea'; c.fill(); };
  if (two) { pk(x - r * 0.5, r * 0.75, r * 1.5); pk(x + r * 0.55, r * 0.7, r * 1.25); c.strokeStyle = '#f1c45a'; c.lineWidth = Math.max(1.5, r * 0.22); c.beginPath(); c.moveTo(x - r * 0.05, y + r * 0.95); c.lineTo(x + r * 0.05, y + r * 0.2); c.stroke(); }
  else pk(x, r, r * 1.7);
}
function icPalm(c, x, y, r) {
  c.strokeStyle = '#5a3d22'; c.lineWidth = Math.max(1.6, r * 0.25); c.beginPath(); c.moveTo(x, y + r * 0.9); c.quadraticCurveTo(x + r * 0.25, y, x, y - r * 0.45); c.stroke();
  c.fillStyle = '#4f9a3a'; c.strokeStyle = MAPC.ink; c.lineWidth = Math.max(1, r * 0.12);
  for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k - 2) * 0.62; c.beginPath(); c.ellipse(x + Math.cos(a) * r * 0.55, y - r * 0.45 + Math.sin(a) * r * 0.42, r * 0.62, r * 0.2, a, 0, TAU); c.fill(); c.stroke(); }
}
function icDen(c, x, y, r, fill) {
  c.beginPath(); c.moveTo(x - r, y + r * 0.7); c.quadraticCurveTo(x - r, y - r, x, y - r); c.quadraticCurveTo(x + r, y - r, x + r, y + r * 0.7); c.closePath();
  c.fillStyle = fill; c.fill(); c.lineWidth = Math.max(1.4, r * 0.18); c.strokeStyle = MAPC.ink; c.stroke();
  c.beginPath(); c.ellipse(x, y + r * 0.7, r * 0.42, r * 0.62, 0, Math.PI, TAU); c.fillStyle = 'rgba(30,20,10,.85)'; c.fill();
}
function icArrow(c, x, y, ang, r, fill) {
  c.save(); c.translate(x, y); c.rotate(ang);
  c.beginPath(); c.moveTo(0, -r); c.lineTo(r * 0.72, r * 0.78); c.lineTo(0, r * 0.4); c.lineTo(-r * 0.72, r * 0.78); c.closePath();
  c.fillStyle = fill; c.fill(); c.lineWidth = Math.max(1.6, r * 0.16); c.strokeStyle = MAPC.ink; c.stroke(); c.restore();
}
function icDot(c, x, y, r, fill, ring) {
  c.beginPath(); c.arc(x, y, r, 0, TAU);
  if (ring) { c.strokeStyle = fill; c.lineWidth = Math.max(2, r * 0.3); c.stroke(); return; }
  c.fillStyle = fill; c.fill(); c.lineWidth = Math.max(1, r * 0.32); c.strokeStyle = MAPC.ink; c.stroke();
}
function icCart(c, x, y, r) { c.fillStyle = '#9a7048'; c.strokeStyle = MAPC.ink; c.lineWidth = 1.3; c.fillRect(x - r, y - r * 0.6, r * 2, r * 1.2); c.strokeRect(x - r, y - r * 0.6, r * 2, r * 1.2); c.fillStyle = MAPC.ink; c.beginPath(); c.arc(x - r * 0.6, y + r * 0.7, r * 0.32, 0, TAU); c.arc(x + r * 0.6, y + r * 0.7, r * 0.32, 0, TAU); c.fill(); }
function icShip(c, x, y, r) {
  c.beginPath(); c.moveTo(x - r * 1.2, y + r * 0.2); c.lineTo(x + r * 1.2, y + r * 0.2); c.lineTo(x + r * 0.8, y + r * 0.8); c.lineTo(x - r * 0.8, y + r * 0.8); c.closePath(); c.fillStyle = '#7a5230'; c.fill(); c.strokeStyle = MAPC.ink; c.lineWidth = 1.3; c.stroke();
  c.beginPath(); c.moveTo(x, y - r * 1.1); c.lineTo(x + r * 0.9, y + r * 0.05); c.lineTo(x, y + r * 0.05); c.closePath(); c.fillStyle = '#efe3c4'; c.fill(); c.stroke();
}
// a name on the map: dark edge, light letters; a name that would cover another one waits for a closer look
function mapLabels(V, L) {
  const c = V.c, used = [];
  L.sort((a, b) => b.p - a.p);
  c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
  for (const q of L) {
    c.font = q.f; const w = c.measureText(q.t).width, h = q.h || 14, sub = q.sub ? (c.font = q.sf || `500 11px ${MAPFONT}`, c.measureText(q.sub).width) : 0;
    const bw = Math.max(w, sub) + 6, bh = h + (q.sub ? 13 : 0) + 2, x0 = q.x - bw / 2, y0 = q.y - h / 2 - 1;
    if (!q.force && used.some(u => x0 < u[2] && x0 + bw > u[0] && y0 < u[3] && y0 + bh > u[1])) continue;
    used.push([x0, y0, x0 + bw, y0 + bh]);
    c.font = q.f; c.lineWidth = q.lw || 4; c.strokeStyle = q.halo || 'rgba(8,10,6,.78)'; c.strokeText(q.t, q.x, q.y); c.fillStyle = q.col || '#fff6e2'; c.fillText(q.t, q.x, q.y);
    if (q.sub) { c.font = q.sf || `500 11px ${MAPFONT}`; c.lineWidth = 3.5; c.strokeText(q.sub, q.x, q.y + h / 2 + 7); c.fillStyle = q.sc || '#e8e0c8'; c.fillText(q.sub, q.x, q.y + h / 2 + 7); }
  }
}

// ---------- who is who: the tribes' colours by how they stand with you ----------
function mapRel(i) {
  if (!P.human) return { col: MAPC.neutral, t: '', k: 'neutral' };
  if (HUNT.camps[i] && HUNT.camps[i].bandit) return { col: MAPC.war, t: '🗡️ שודדים', k: 'war' };
  if (i === VX.mem && !ownCamp()) return { col: MAPC.member, t: 'השבט שלך', k: 'member' };
  if (atWar(i)) return { col: MAPC.war, t: '⚔️ במלחמה', k: 'war' };
  if (isVassal(i, 'own')) return { col: MAPC.vassal, t: '🏳️ שבט חסות שלך', k: 'vassal' };
  if (polAllied('own', i)) return { col: MAPC.ally, t: '🤝 בני ברית', k: 'ally' };
  const tr = campTrust(i);
  return tr >= 40 ? { col: MAPC.friend, t: 'ידידים', k: 'friend' } : tr >= 15 ? { col: MAPC.known, t: 'מכירים', k: 'known' } : tr >= -15 ? { col: MAPC.neutral, t: 'זרים', k: 'neutral' }
    : tr >= -45 ? { col: MAPC.tense, t: 'מתוחים', k: 'tense' } : { col: MAPC.hostile, t: 'עוינים', k: 'hostile' };
}
const campShown = (c, i) => !c.gone && !c.own && (!P.human || VX.known.has(i));
// the names of the places: the lands are written large, the rest beside a little picture
const LAND_POI = new Set(['הצפון הקפוא', 'הסוואנה', 'המדבר הגדול', 'חוף הים', 'הים הגדול']);
function mapPoiKind(n) {
  if (LAND_POI.has(n)) return 'land';
  if (/^מעבר/.test(n)) return 'pass';
  if (/^(אי |נווה)/.test(n)) return 'palm';
  if (/אגם|נהר|מפל|בור|שפך/.test(n)) return 'water';
  if (/^(הר |ההר )/.test(n)) return 'peak';
  return 'place';
}
const POI_KIND = { pass: 'מעבר בין ההרים', palm: 'אי או נווה מדבר', water: 'מים', peak: 'הר', place: 'מקום', land: 'ארץ' };
function mapIcon(c, k, x, y, r) { if (k === 'pass') icPeak(c, x, y, r, true); else if (k === 'peak') icPeak(c, x, y, r); else if (k === 'palm') icPalm(c, x, y, r); else if (k === 'water') icDrop(c, x, y, r * 0.85); else icDiamond(c, x, y, r * 0.7, '#f1ead6'); }
// where a place is, in words: the land, and the nearest named place
function mapWhereText(x, z) {
  const parts = [LANDS[landAt(x, z)].n], v = P.human && ownCamp();
  if (v && Math.hypot(v.x - x, v.z - z) < villageR() + 12) { parts.push(`ב${vxVillageName().replace(/^ה/, '')}`); return parts.join(' · '); }
  let best = null, bd = 170;
  for (const p of POI) { if (p.camp || LAND_POI.has(p.n)) continue; const d = Math.hypot(p.x - x, p.z - z); if (d < bd) { bd = d; best = p.n; } }
  HUNT.camps.forEach((c, i) => { if (!campShown(c, i)) return; const d = Math.hypot(c.x - x, c.z - z); if (d < Math.min(bd, 120)) { bd = d; best = c.tribe; } });
  if (best) parts.push(bd < 35 ? best : `ליד ${best}`);
  return parts.join(' · ');
}

// ---------- everything that moves, and the marks: shared by both maps ----------
function mapThings(V, L, F) {
  const c = V.c, a = P.a, s = V.s, mini = V.mini, big = !mini;
  const inView = (x, z, m) => { const [px, py] = mapP(V, x, z); return px > -m && py > -m && px < V.cw + m && py < V.ch + m ? [px, py] : null; };
  const feat = (o) => { if (F) F.push(o); };
  // the tribes' hunting grounds, and your own
  if (P.human && (mini || s >= 0.22)) {
    c.save(); c.setLineDash([7, 6]); c.lineWidth = 2;
    HUNT.camps.forEach((cp, i) => {
      if (!campShown(cp, i) || cp.bandit) return; const rel = mapRel(i), [x, y] = mapP(V, cp.x, cp.z), R = (WAR.terr[i] || 110) * s;
      if (x < -R || y < -R || x > V.cw + R || y > V.ch + R) return;
      c.strokeStyle = rel.col + 'aa'; c.fillStyle = rel.col + '14'; c.beginPath(); c.arc(x, y, R, 0, TAU); c.fill(); c.stroke();
    });
    const v = ownCamp();
    if (v) { const [x, y] = mapP(V, v.x, v.z); c.strokeStyle = 'rgba(242,184,75,.55)'; c.beginPath(); c.arc(x, y, ownTerrR() * s, 0, TAU); c.stroke(); c.strokeStyle = 'rgba(242,184,75,.95)'; c.lineWidth = 2.5; c.beginPath(); c.arc(x, y, Math.max(8, villageR() * s), 0, TAU); c.stroke(); }
    c.restore();
  }
  // the way to your target
  if (WAY.p && a) {
    const [x1, y1] = mapP(V, a.pos.x, a.pos.z), [x2, y2] = mapP(V, WAY.p.x, WAY.p.z);
    c.save(); c.setLineDash([6, 5]); c.lineWidth = 2.5; c.strokeStyle = 'rgba(90,180,255,.85)'; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); c.restore();
  }
  // the places
  for (const p of POI) {
    if (p.camp) continue;
    const k = mapPoiKind(p.n);
    if (k === 'land') { if (big && s < 0.5) { const q = inView(p.x, p.z, 80); if (q) L.push({ t: p.n, x: q[0], y: q[1], p: s < 0.32 ? 75 : 30, f: `700 ${s < 0.3 ? 21 : 18}px ${MAPFONT}`, h: 22, col: 'rgba(255,248,225,.92)', lw: 5 }); } continue; }
    if (mini ? false : (k === 'water' || k === 'place') && s < 0.3) continue;
    const q = inView(p.x, p.z, 30); if (!q) continue;
    const r = mini ? 5 : 7; mapIcon(c, k, q[0], q[1], r);
    if (big) { L.push({ t: p.n, x: q[0], y: q[1] - r - 11, p: k === 'pass' ? 60 : k === 'peak' || k === 'palm' ? 55 : 40, f: `600 13px ${MAPFONT}` }); feat({ x: q[0], y: q[1], r: 12, k: 'poi', o: p, pk: k }); }
  }
  if (big && s < 0.5) { const q = inView(-280, 30, 80); if (q) L.push({ t: 'הג׳ונגל', x: q[0], y: q[1], p: s < 0.32 ? 75 : 30, f: `700 ${s < 0.3 ? 21 : 18}px ${MAPFONT}`, h: 22, col: 'rgba(255,248,225,.92)', lw: 5 }); }
  // the tribes
  HUNT.camps.forEach((cp, i) => {
    if (cp.gone || cp.own) return;
    const shown = campShown(cp, i); if (!shown && (!mini || cp.bandit)) return;
    const q = inView(cp.x, cp.z, 30); if (!q) return;
    const rel = shown ? mapRel(i) : { col: '#8e887a', t: '' }, r = mini ? 6 : 9;
    campIc(c, cp, q[0], q[1], r, rel.col);
    if (big) { L.push({ t: cp.tribe, x: q[0], y: q[1] - r - 12, p: rel.k === 'war' ? 80 : 70, f: `700 14px ${MAPFONT}`, sub: s >= 0.3 ? rel.t : '', sc: rel.col }); feat({ x: q[0], y: q[1], r: 14, k: 'tribe', o: cp, i }); }
  });
  // your village (or your den)
  const v = P.human && ownCamp();
  if (v) {
    const q = inView(v.x, v.z, 40);
    if (q) {
      if (mini || s < 1.1) icHouse(c, q[0], q[1], mini ? 7 : 11, MAPC.home);
      if (big) { L.push({ t: vxVillageName(), x: q[0], y: q[1] - (s < 1.1 ? 24 : 10 + villageR() * s * 0.3), p: 90, f: `800 15px ${MAPFONT}`, col: '#ffe2a0', force: true }); feat({ x: q[0], y: q[1], r: 16, k: 'village', o: v }); }
    }
  }
  if (DEN.pos && !P.human) {
    const q = inView(DEN.pos.x, DEN.pos.z, 30);
    if (q) { icDen(c, q[0], q[1], mini ? 6 : 9, '#ffd34d'); if (big) { L.push({ t: `ה${denName()} שלך`, x: q[0], y: q[1] - 22, p: 90, f: `700 14px ${MAPFONT}`, col: '#ffe9a8', force: true }); feat({ x: q[0], y: q[1], r: 14, k: 'den' }); } }
  }
  // your people, your animals and your boats
  if (P.human && (mini || s >= 0.45)) {
    const rr = mini ? 2.8 : clamp(s * 2.2, 2.6, 5);
    for (const m of clanReal()) { if (m.isPartner || m.cub || m.hidden) continue; const q = inView(m.pos.x, m.pos.z, 10); if (!q) continue; icDot(c, q[0], q[1], m.young ? rr * 0.75 : rr, CLSC[m.young ? 'child' : m.cls] || '#ffd34d'); if (big && s >= 0.8) feat({ x: q[0], y: q[1], r: 9, k: 'person', o: m }); }
    for (const h of tribeHorses()) if (h.mine && !h.ridden) { const q = inView(h.pos.x, h.pos.z, 10); if (q) icDot(c, q[0], q[1], rr * 0.9, '#c98a4a'); }
    for (const C of CARTS.list) { const q = inView(C.x, C.z, 10); if (q) { icCart(c, q[0], q[1], mini ? 3 : 4.5); if (big) feat({ x: q[0], y: q[1], r: 10, k: 'cart', o: C }); } }
    for (const S of SHIPS.list) { const q = inView(S.x, S.z, 10); if (q) { icShip(c, q[0], q[1], mini ? 3.5 : 5.5); if (big) feat({ x: q[0], y: q[1], r: 11, k: 'ship', o: S }); } }
    for (const B of BOATS) if (B !== P.boat) { const q = inView(B.x, B.z, 10); if (q) { c.fillStyle = '#7a5230'; c.strokeStyle = 'rgba(245,214,150,.9)'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(q[0], q[1], mini ? 4 : 5, mini ? 1.8 : 2.4, 0, 0, TAU); c.fill(); c.stroke(); } }
    for (const T of TRAPS.list) { if (!mini && s < 1.2) continue; const q = inView(T.x, T.z, 10); if (!q) continue; const full = T.caught && T.caught.alive; c.fillStyle = full ? '#ffcf4a' : T.owner === 'p' ? '#f0d9a0' : '#bba57a'; c.fillRect(q[0] - 2.5, q[1] - 2.5, 5, 5); c.strokeStyle = MAPC.ink; c.lineWidth = 1; c.strokeRect(q[0] - 2.5, q[1] - 2.5, 5, 5); }
  }
  // war: parties on the march, captives, raiders, a champion
  if (P.human) {
    for (const p of WAR.parties) if (!p.done) for (const h of p.men) if (h.alive && !h.gone) { const q = inView(h.pos.x, h.pos.z, 10); if (q) icDot(c, q[0], q[1], mini ? 2.8 : 3.6, p.mine ? '#ffd34d' : '#ff3b30'); }
    for (const w of WAR.caps) if (w.alive) { const q = inView(w.pos.x, w.pos.z, 10); if (q) icDot(c, q[0], q[1], mini ? 3 : 4, '#ff78ab'); }
    if (PRESS.raider && PRESS.raider.alive) { const q = inView(PRESS.raider.pos.x, PRESS.raider.pos.z, 20); if (q) icDot(c, q[0], q[1], 9, '#ff3b30', true); }
    if (CHAL.ch && CHAL.ch.alive) { const q = inView(CHAL.ch.pos.x, CHAL.ch.pos.z, 20); if (q) icDot(c, q[0], q[1], 8, '#ff3b30', true); }
    // the veins you found (a diamond in the ore's colour), and the raiders' longships at sea
    if (mini || s >= 0.3) for (const d of MINES.list) {
      if (!d.seen || d.off) continue; const q = inView(d.x, d.z, 10); if (!q) continue;
      const r = mini ? 3.2 : clamp(s * 4.5, 4, 7); c.fillStyle = d.left > 0 ? ORE[d.k].dot : '#7a746a'; c.strokeStyle = 'rgba(20,16,8,.85)'; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(q[0], q[1] - r); c.lineTo(q[0] + r, q[1]); c.lineTo(q[0], q[1] + r); c.lineTo(q[0] - r, q[1]); c.closePath(); c.fill(); c.stroke();
      if (big) { feat({ x: q[0], y: q[1], r: 10, k: 'ore', o: d }); if (s >= 1.2) L.push({ t: ORE[d.k].n, x: q[0], y: q[1] - r - 9, p: 25, f: `600 12px ${MAPFONT}` }); }
    }
    for (const S of RAID2.ships) { if (S.gone) continue; const q = inView(S.x, S.z, 12); if (q) { icShip(c, q[0], q[1], mini ? 4 : 6); icDot(c, q[0], q[1] - (mini ? 6 : 9), mini ? 2.4 : 3.2, '#ff3b30'); } }
    const tr = VX.track; if (tr && tr.alive) { const q = inView(tr.pos.x, tr.pos.z, 20); if (q) { icDot(c, q[0], q[1], 9, MAPC.way, true); if (big) L.push({ t: tr.name, x: q[0], y: q[1] - 18, p: 85, f: `600 13px ${MAPFONT}`, col: '#d8eeff' }); } }
  }
  // the family (the animals' too)
  for (const cb of P.cubs) { const q = inView(cb.pos.x, cb.pos.z, 10); if (q) icDot(c, q[0], q[1], mini ? 3 : 4.5, '#ffc1d8'); }
  if (P.partner && P.partner.alive) { const q = inView(P.partner.pos.x, P.partner.pos.z, 10); if (q) { icDot(c, q[0], q[1], mini ? 3.6 : 5.5, '#ff78ab'); if (big) feat({ x: q[0], y: q[1], r: 10, k: 'person', o: P.partner }); } }
  for (const p of P.pings) { const q = inView(p.x, p.z, 20); if (q) icDot(c, q[0], q[1], 8 + (1 - (p.t % 1)) * 7, p.love ? 'rgba(255,120,171,.9)' : 'rgba(238,83,72,.9)', true); }
  // the other players (blue), and the villages in the world's book
  onlineMapMarks(c, (x, z) => inView(x, z, 30), L, F || [], big);
  // your target
  if (WAY.p) {
    const q = inView(WAY.p.x, WAY.p.z, 30);
    if (q) { icFlag(c, q[0], q[1], mini ? 5 : 7.5, MAPC.way); if (big) { L.push({ t: WAY.label || 'היעד', x: q[0], y: q[1] - 26, p: 85, f: `700 13px ${MAPFONT}`, col: '#d8eeff', sub: a ? `${Math.round(Math.hypot(WAY.p.x - a.pos.x, WAY.p.z - a.pos.z))} מ׳` : '' }); feat({ x: q[0], y: q[1] - 6, r: 14, k: 'way' }); } }
  }
}
// you: an arrow that points where you face, a ring so you are easy to find
function mapYou(V, L, F) {
  const a = P.a; if (!a) return;
  const c = V.c, [x, y] = mapP(V, a.pos.x, a.pos.z), r = V.mini ? 8 : 11;
  if (!V.mini) { const t = (performance.now() / 1000) % 1.6 / 1.6; c.beginPath(); c.arc(x, y, r + 4 + t * 16, 0, TAU); c.strokeStyle = `rgba(255,211,77,${0.7 * (1 - t)})`; c.lineWidth = 3; c.stroke(); }
  icArrow(c, x, y, Math.PI - a.yaw + V.rot, r, MAPC.you);
  if (!V.mini) { if (V.s < 0.7) L.push({ t: 'אתה', x, y: y + r + 10, p: 100, f: `800 13px ${MAPFONT}`, col: '#ffe9a8', force: true }); if (F) F.push({ x, y, r: 16, k: 'you' }); }
}

// ================= THE LITTLE MAP IN THE CORNER =================
function miniDraw() {
  const cv = document.getElementById('mini'), a = P.a; if (!cv || !a || !UI.mapImg) return true;
  const css = cv.clientWidth || 150, dpr = Math.min(2, devicePixelRatio || 1), px = Math.round(css * dpr);
  if (cv.width !== px || cv.height !== px) { cv.width = px; cv.height = px; }
  const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, css, css);
  MAPV.frame++;
  const R = css / 2, span = clamp(css * 1.1, 140, 220), s = css / span, rot = MAPV.north ? 0 : CAM.yaw - Math.PI;
  const V = mapView(c, css, css, R, R, a.pos.x, a.pos.z, s, rot, true);
  c.save(); c.beginPath(); c.arc(R, R, R - 1, 0, TAU); c.clip();
  mapBase(V, TOUCH ? 0.5 : 1); mapRoads(V);
  if (P.human) mapBuildings(V);
  const L = [];
  mapThings(V, L, null);
  // the animals close by: what you can hunt (yellow), who hunts you (red, with a ring)
  shQuery(a.pos.x, a.pos.z, span * 0.6, b => {
    if (b === a || b.tribe || b.isPartner || b.cub) return;
    const [x, y] = mapP(V, b.pos.x, b.pos.z);
    if (!b.alive) { if (b.dead && b.food > 1 && b.tpl.kind === 'quad') icDot(c, x, y, 2.8, '#7a1c14'); return; }
    if (b.hunter) { icDot(c, x, y, 3.2, '#f4efe1'); icDot(c, x, y, 5, 'rgba(20,20,20,.85)', true); }
    else if (b.pet) icDot(c, x, y, 2.6, '#9fd3ff');
    else if (preys(b, a) && dist2(b.pos, a.pos) < 70) { icDot(c, x, y, 3.4, '#ff3b30'); icDot(c, x, y, 6, 'rgba(255,59,48,.8)', true); }
    else if ((P.human ? HUNTER_PREY.includes(b.spId) && !b.young : preys(a, b)) && (b.tpl.kind !== 'fish' || P.fish)) icDot(c, x, y, 2.8, '#ffc24a');
    else if (b.spId === 'horse' && !b.tribeHorse) icDot(c, x, y, 2.8, '#c98a4a');
    else if (b.spId === P.spId && !b.young) icDot(c, x, y, 2.8, b.sex === a.sex ? '#f08a3c' : '#f7b6cf');
  });
  if (P.human) for (const sp of HUNT.spears) if (sp.from === a && sp.stuck > 0) { const [x, y] = mapP(V, sp.pos.x, sp.pos.z); icDot(c, x, y, 2.2, '#ffd34d'); }
  // where you look (north up only: the map itself turns otherwise)
  if (MAPV.north) {
    const ang = Math.PI - CAM.yaw - Math.PI / 2, w = 0.62, g = c.createRadialGradient(R, R, 4, R, R, R * 0.9);
    g.addColorStop(0, 'rgba(255,240,200,.32)'); g.addColorStop(1, 'rgba(255,240,200,0)');
    c.fillStyle = g; c.beginPath(); c.moveTo(R, R); c.arc(R, R, R * 0.9, ang - w, ang + w); c.closePath(); c.fill();
  }
  mapYou(V, L, null);
  c.restore();
  // arrows on the rim: home, your target, the one you follow, your partner
  const rim = (x, z, col, draw) => {
    const [px, py] = mapP(V, x, z), dx = px - R, dy = py - R, d = Math.hypot(dx, dy); if (d < R - 9) return;
    const k = (R - 9) / d, ex = R + dx * k, ey = R + dy * k, an = Math.atan2(dy, dx);
    c.save(); c.translate(R + dx / d * (R - 2.5), R + dy / d * (R - 2.5)); c.rotate(an); c.beginPath(); c.moveTo(3, 0); c.lineTo(-4, -4.5); c.lineTo(-4, 4.5); c.closePath(); c.fillStyle = col; c.fill(); c.lineWidth = 1.2; c.strokeStyle = MAPC.ink; c.stroke(); c.restore();
    draw(ex - dx / d * 6, ey - dy / d * 6);
  };
  const v = P.human && ownCamp();
  if (v) rim(v.x, v.z, MAPC.home, (x, y) => icHouse(c, x, y, 5.5, MAPC.home));
  if (DEN.pos && !P.human) rim(DEN.pos.x, DEN.pos.z, '#ffd34d', (x, y) => icDen(c, x, y, 5, '#ffd34d'));
  if (WAY.p) rim(WAY.p.x, WAY.p.z, MAPC.way, (x, y) => icFlag(c, x, y + 4, 4, MAPC.way));
  if (VX.track && VX.track.alive) rim(VX.track.pos.x, VX.track.pos.z, MAPC.way, (x, y) => icDot(c, x, y, 3.5, MAPC.way));
  if (P.partner && P.partner.alive) rim(P.partner.pos.x, P.partner.pos.z, '#ff78ab', (x, y) => icDot(c, x, y, 3.5, '#ff78ab'));
  for (const p of P.pings) rim(p.x, p.z, p.love ? '#ff78ab' : '#ee5348', () => { });
  // the rim, north, and the name of the place
  c.beginPath(); c.arc(R, R, R - 1.5, 0, TAU); c.strokeStyle = 'rgba(232,176,75,.75)'; c.lineWidth = 2.5; c.stroke();
  const nx = R + (R - 10) * Math.sin(rot), ny = R - (R - 10) * Math.cos(rot), nr = css < 120 ? 7.5 : 9.5;
  c.fillStyle = 'rgba(12,22,14,.85)'; c.beginPath(); c.arc(nx, ny, nr, 0, TAU); c.fill(); c.lineWidth = 1.5; c.strokeStyle = 'rgba(232,176,75,.85)'; c.stroke();
  c.fillStyle = '#ffd36b'; c.font = `800 ${css < 120 ? 10.5 : 12.5}px ${MAPFONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('צ', nx, ny + 0.5);
  if (css >= 110) {
    if ((MAPV.miniLblT -= 1) <= 0) { MAPV.miniLblT = 8; MAPV.miniLbl = mapWhereText(a.pos.x, a.pos.z).split(' · ').pop(); }
    const t = MAPV.miniLbl; if (t) { c.font = `700 ${css < 160 ? 10 : 11.5}px ${MAPFONT}`; const w = Math.min(css * 0.8, c.measureText(t).width + 14), y = ny > R + 4 && Math.abs(nx - R) < w / 2 + nr ? (css < 160 ? 17 : 20) : css - (css < 160 ? 17 : 20);
      c.fillStyle = 'rgba(12,22,14,.78)'; c.beginPath(); c.roundRect ? c.roundRect(R - w / 2, y - 8, w, 16, 8) : c.rect(R - w / 2, y - 8, w, 16); c.fill(); c.fillStyle = '#f6efd9'; c.fillText(t, R, y + 0.5, css * 0.8 - 8); }
  }
  mapTileWork(TOUCH ? 4 : 5);
  return true;
}

// ================= THE BIG MAP =================
function bigMapDraw() {
  mapInit();
  const a = P.a;
  MAPV.open = true; MAPV.sel = null; mapInfoShow(null); mapTilesFresh();
  // the first look at the map is the whole world on its globe; after that the map opens the way you left it
  if (!MAPV.opened) { MAPV.opened = true; let g = null; try { g = localStorage.getItem('amazonia-map-globe'); } catch (e) { /* the browser keeps nothing */ } MAPV.globe = g !== '0'; MAPV.gz = 1; }
  if (a) { MAPV.cx = a.pos.x; MAPV.cz = a.pos.z; MAPV.gLon = glbLon(a.pos.x); MAPV.gLat = clamp(glbLat(a.pos.z) * 0.8, -1.1, 1.1); }
  GLB.anim = null; GLB.vel = null; GLB.fade = null; GLB.cloudOff = (Date.now() / 90000) % 256;
  MAPV.fit = !MAPV.s;
  const w = document.getElementById('mapWhere'); if (w && a) w.textContent = mapWhereText(a.pos.x, a.pos.z);
  glbBtn();
  if (MAPV.hint < 3) { MAPV.hint++; const h = document.getElementById('mapHint'); if (h) { h.hidden = false; clearTimeout(MAPV.hintTO); MAPV.hintTO = setTimeout(() => { h.hidden = true; }, 7000); } }
  MAPV.dirty = true; if (!MAPV.raf) MAPV.raf = requestAnimationFrame(mapLoop);
  return true;
}
function mapLoop() {
  MAPV.raf = 0;
  const ov = document.getElementById('mapov'); if (!ov || ov.hidden) { MAPV.open = false; MAPV.ptrs.clear(); MAPV.g = null; GLB.anim = null; GLB.vel = null; return; }
  const now = performance.now(), dt = clamp((now - (GLB.lastT || now)) / 1000, 0, 0.1); GLB.lastT = now;
  glbTick(dt);
  const made = !MAPV.globe && MAPV.tq.length ? mapTileWork(12) : 0;
  if (MAPV.dirty || (made && (now - MAPV.lastDraw > 200 || !MAPV.tq.length)) || now - MAPV.lastDraw > 110) { bigDraw(); MAPV.lastDraw = performance.now(); MAPV.dirty = false; }
  MAPV.raf = requestAnimationFrame(mapLoop);
}
function mapClamp() {
  MAPV.s = clamp(MAPV.s, glbSOut() * 0.999, 9);
  MAPV.cx = wrapX(MAPV.cx); MAPV.cz = clamp(MAPV.cz, -W.half, W.half);
  MAPV.gz = clamp(MAPV.gz || 1, 0.8, glbGzMax()); MAPV.gLat = clamp(MAPV.gLat || 0, -1.25, 1.25);
}
function bigDraw() {
  const cv = document.getElementById('bigmap'); if (!cv || !UI.mapImg) return;
  const wrap = cv.parentElement, cw = Math.max(50, wrap.clientWidth), ch = Math.max(50, wrap.clientHeight), dpr = Math.min(2, devicePixelRatio || 1);
  if (cv.width !== Math.round(cw * dpr) || cv.height !== Math.round(ch * dpr)) { cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr); }
  MAPV.cw = cw; MAPV.ch = ch;
  if (MAPV.fit) { MAPV.fit = false; MAPV.s = Math.min(cw, ch) / 640; }
  mapClamp(); MAPV.frame++;
  const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, cw, ch);
  if (MAPV.globe) { globeDraw(c, cw, ch); mapFadeDraw(c, cw, ch); return; }
  const V = mapView(c, cw, ch, cw / 2, ch / 2, MAPV.cx, MAPV.cz, MAPV.s, 0, false), L = [], F = [];
  mapBase(V, 2); mapGrid(V); mapRoads(V);
  if (P.human && V.s >= 0.9) mapBuildings(V);
  mapThings(V, L, F);
  if (P.human && V.s >= 0.9) for (const b of BLD.list) { const T = BTYPES[b.t]; if (!T || T.len || T.span || b.t === 'torch') continue; const [x, y] = mapP(V, b.x, b.z); if (x > -20 && y > -20 && x < cw + 20 && y < ch + 20) F.push({ x, y, r: Math.max(8, (MBLD[b.t] ? MBLD[b.t][0] : T.r) * V.s), k: 'bld', o: b }); }
  mapYou(V, L, F);
  // what you chose: a ring around it
  const sel = MAPV.sel;
  if (sel) { const [x, y] = sel.wx !== undefined ? mapP(V, sel.wx, sel.wz) : [sel.x, sel.y]; c.save(); c.setLineDash([5, 4]); c.strokeStyle = '#fff'; c.lineWidth = 2.5; c.beginPath(); c.arc(x, y, (sel.r || 12) + 6, 0, TAU); c.stroke(); c.restore(); if (sel.k === 'spot') icFlag(c, x, y, 7, 'rgba(255,255,255,.85)'); }
  mapLabels(V, L);
  // how far is far: a scale, and north
  const steps = [10, 25, 50, 100, 200, 250, 500, 1000], len = steps.find(m => m * V.s >= 70) || 1000, bw = len * V.s, bx = 14, by = ch - 18;
  c.fillStyle = 'rgba(12,22,14,.72)'; c.beginPath(); c.roundRect ? c.roundRect(bx - 8, by - 22, bw + 16, 32, 8) : c.rect(bx - 8, by - 22, bw + 16, 32); c.fill();
  c.strokeStyle = '#f6efd9'; c.lineWidth = 2; c.beginPath(); c.moveTo(bx, by - 4); c.lineTo(bx, by); c.lineTo(bx + bw, by); c.lineTo(bx + bw, by - 4); c.stroke();
  c.fillStyle = '#f6efd9'; c.font = `600 12px ${MAPFONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(len >= 1000 ? 'קילומטר' : `${len} מטר`, bx + bw / 2, by - 12);
  const nx = cw - 26, ny = 26; c.fillStyle = 'rgba(12,22,14,.78)'; c.beginPath(); c.arc(nx, ny, 17, 0, TAU); c.fill(); c.strokeStyle = 'rgba(232,176,75,.8)'; c.lineWidth = 1.5; c.stroke();
  c.fillStyle = '#ffd36b'; c.beginPath(); c.moveTo(nx, ny - 13); c.lineTo(nx + 5, ny - 4); c.lineTo(nx - 5, ny - 4); c.closePath(); c.fill(); c.font = `800 13px ${MAPFONT}`; c.fillText('צ', nx, ny + 5);
  MAPV.feats = F;
  mapFadeDraw(c, cw, ch);
}
// ---------- moving the map: drag, pinch, the wheel, the buttons, the keys ----------
function mapZoomAt(k, sx, sy) {
  if (MAPV.globe) {
    // the ball grows towards the place under the finger (or the mouse); past its largest it opens into the flat map there
    const V = glbView(), q = glbUnproj(sx, sy, V.cx, V.cy, V.R), gz = MAPV.gz * k, f = k > 1 ? 1 - 1 / k : 0;
    if (q && f > 0) { let dl = (q.lon - MAPV.gLon) % TAU; if (dl > Math.PI) dl -= TAU; else if (dl < -Math.PI) dl += TAU; MAPV.gLon += dl * f; MAPV.gLat = clamp(MAPV.gLat + (q.lat - MAPV.gLat) * f, -1.25, 1.25); }
    GLB.anim = null; GLB.vel = null; GLB.moveT = performance.now();
    if (gz > glbGzMax() * 1.001) glbToFlat(glbX(MAPV.gLon), glbZ(MAPV.gLat), glbSIn());
    else { MAPV.gz = clamp(gz, 0.8, glbGzMax()); MAPV.dirty = true; }
    return;
  }
  const s0 = MAPV.s, wx = MAPV.cx + (sx - MAPV.cw / 2) / s0, wz = MAPV.cz + (sy - MAPV.ch / 2) / s0;
  if (s0 * k < glbSOut()) { flatToGlobe(); return; }
  MAPV.s = clamp(s0 * k, glbSOut(), 9);
  MAPV.cx = wx - (sx - MAPV.cw / 2) / MAPV.s; MAPV.cz = wz - (sy - MAPV.ch / 2) / MAPV.s; mapClamp(); MAPV.dirty = true;
}
// two quick taps: closer, there
function mapDoubleTap(sx, sy) {
  MAPV.sel = null; mapInfoShow(null);
  if (!MAPV.globe) { mapZoomAt(2, sx, sy); return; }
  const V = glbView(), q = glbUnproj(sx, sy, V.cx, V.cy, V.R); if (!q) return;
  const gz = MAPV.gz * 1.9, mx = glbGzMax();
  if (gz > mx) glbFlyTo(q.x, q.z, mx, () => glbToFlat(q.x, q.z, glbSIn() * 1.3)); else glbFlyTo(q.x, q.z, gz);
}
function mapPtrs(cv) {
  const pos = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  cv.addEventListener('pointerdown', e => {
    e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (err) { /* nothing to hold */ }
    const p = pos(e); MAPV.ptrs.set(e.pointerId, p); GLB.anim = null; GLB.vel = null; GLB.trk = [];
    if (MAPV.ptrs.size === 1) MAPV.g = { k: 'drag', x0: p[0], y0: p[1], cx0: MAPV.cx, cz0: MAPV.cz, t0: performance.now(), moved: false, lon0: MAPV.gLon || 0, lat0: MAPV.gLat || 0 };
    else if (MAPV.ptrs.size === 2) { const [A, B] = [...MAPV.ptrs.values()]; MAPV.g = { k: 'pinch', d0: Math.hypot(A[0] - B[0], A[1] - B[1]) || 1, s0: MAPV.s, gz0: MAPV.gz, mx: (A[0] + B[0]) / 2, my: (A[1] + B[1]) / 2, cx0: MAPV.cx, cz0: MAPV.cz, moved: true }; }
  });
  cv.addEventListener('pointermove', e => {
    if (!MAPV.ptrs.has(e.pointerId)) return;
    const p = pos(e); MAPV.ptrs.set(e.pointerId, p); const g = MAPV.g; if (!g) return;
    if (g.k === 'drag') {
      const dx = p[0] - g.x0, dy = p[1] - g.y0; if (Math.abs(dx) + Math.abs(dy) > 6) g.moved = true;
      if (g.moved && MAPV.globe) {
        // the ball turns under the finger: the place you grabbed stays under it
        const R = glbR0() * MAPV.gz, now = performance.now();
        MAPV.gLon = g.lon0 - dx / (R * Math.max(0.35, Math.cos(g.lat0))); MAPV.gLat = clamp(g.lat0 + dy / R, -1.25, 1.25);
        GLB.trk.push([now, MAPV.gLon, MAPV.gLat]); while (GLB.trk.length > 2 && now - GLB.trk[0][0] > 140) GLB.trk.shift();
        GLB.moveT = now; MAPV.dirty = true;
      } else if (g.moved) { MAPV.cx = g.cx0 - dx / MAPV.s; MAPV.cz = g.cz0 - dy / MAPV.s; mapClamp(); MAPV.dirty = true; }
    } else if (g.k === 'pinch' && MAPV.ptrs.size >= 2) {
      const [A, B] = [...MAPV.ptrs.values()], d = Math.hypot(A[0] - B[0], A[1] - B[1]) || 1, mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2;
      if (MAPV.globe) {
        const gz = g.gz0 * d / g.d0; GLB.moveT = performance.now();
        // past the ball's largest the flat map takes over, and the same two fingers go on zooming it
        if (gz > glbGzMax() * 1.001) { glbToFlat(glbX(MAPV.gLon), glbZ(MAPV.gLat), glbSIn()); Object.assign(g, { s0: MAPV.s, d0: d, cx0: MAPV.cx, cz0: MAPV.cz, mx: MAPV.cw / 2, my: MAPV.ch / 2 }); }
        else { MAPV.gz = Math.max(0.8, gz); MAPV.dirty = true; }
      } else {
        const wx = g.cx0 + (g.mx - MAPV.cw / 2) / g.s0, wz = g.cz0 + (g.my - MAPV.ch / 2) / g.s0, s = g.s0 * d / g.d0;
        if (s < glbSOut()) { flatToGlobe(); g.gz0 = MAPV.gz; g.d0 = d; }
        else { MAPV.s = clamp(s, glbSOut(), 9); MAPV.cx = wx - (mx - MAPV.cw / 2) / MAPV.s; MAPV.cz = wz - (my - MAPV.ch / 2) / MAPV.s; mapClamp(); MAPV.dirty = true; }
      }
    }
  });
  const up = e => {
    if (!MAPV.ptrs.has(e.pointerId)) return;
    const p = pos(e); MAPV.ptrs.delete(e.pointerId); const g = MAPV.g, now = performance.now();
    if (g && g.k === 'drag' && !g.moved && now - g.t0 < 600 && e.type === 'pointerup') {
      if (now - GLB.tapT < 340 && Math.hypot(p[0] - GLB.tapX, p[1] - GLB.tapY) < 32) { GLB.tapT = 0; mapDoubleTap(p[0], p[1]); }
      else { GLB.tapT = now; GLB.tapX = p[0]; GLB.tapY = p[1]; mapTap(p[0], p[1]); }
    } else if (g && g.k === 'drag' && g.moved && MAPV.globe && e.type === 'pointerup') {
      // a flick sets the ball spinning, slowing down by itself
      const T = GLB.trk, o = T.find(q => now - q[0] < 120);
      if (o && now - o[0] > 10) { const dt = (now - o[0]) / 1000, vl = clamp((MAPV.gLon - o[1]) / dt, -7, 7), va = clamp((MAPV.gLat - o[2]) / dt, -4, 4); if (Math.hypot(vl, va) > 0.3) GLB.vel = { lon: vl, lat: va }; }
    }
    if (!MAPV.ptrs.size) GLB.trk = [];
    if (MAPV.ptrs.size === 1) { const q = [...MAPV.ptrs.values()][0]; MAPV.g = { k: 'drag', x0: q[0], y0: q[1], cx0: MAPV.cx, cz0: MAPV.cz, t0: 0, moved: true, lon0: MAPV.gLon || 0, lat0: MAPV.gLat || 0 }; }
    else if (!MAPV.ptrs.size) MAPV.g = null;
  };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  cv.addEventListener('wheel', e => { e.preventDefault(); const p = pos(e); mapZoomAt(e.deltaY < 0 ? 1.22 : 1 / 1.22, p[0], p[1]); }, { passive: false });
}
addEventListener('keydown', e => {
  if (!MAPV.open || G.mode !== 'play') return;
  if (e.key === '+' || e.key === '=') { mapZoomAt(1.5, MAPV.cw / 2, MAPV.ch / 2); e.preventDefault(); }
  else if (e.key === '-' || e.key === '_') { mapZoomAt(1 / 1.5, MAPV.cw / 2, MAPV.ch / 2); e.preventDefault(); }
  else if (e.key === '0' && P.a) mapTool('me');
  else if (e.code.startsWith('Arrow') && MAPV.globe) { const st = 0.22 / MAPV.gz; if (e.code === 'ArrowLeft') MAPV.gLon -= st; if (e.code === 'ArrowRight') MAPV.gLon += st; if (e.code === 'ArrowUp') MAPV.gLat += st; if (e.code === 'ArrowDown') MAPV.gLat -= st; mapClamp(); GLB.moveT = performance.now(); MAPV.dirty = true; }
  else if (e.code.startsWith('Arrow')) { const st = 80 / MAPV.s; if (e.code === 'ArrowLeft') MAPV.cx -= st; if (e.code === 'ArrowRight') MAPV.cx += st; if (e.code === 'ArrowUp') MAPV.cz -= st; if (e.code === 'ArrowDown') MAPV.cz += st; mapClamp(); MAPV.dirty = true; }
});
addEventListener('resize', () => { if (MAPV.open) MAPV.dirty = true; });
// on the ball: turn to a place; if it is already in the middle, go down into the flat map there
function glbGoTo(x, z, s) {
  let dl = (glbLon(x) - MAPV.gLon) % TAU; if (dl > Math.PI) dl -= TAU; else if (dl < -Math.PI) dl += TAU;
  if (Math.hypot(dl, glbLat(z) - MAPV.gLat) < 0.06) glbFlyTo(x, z, glbGzMax(), () => glbToFlat(x, z, s));
  else glbFlyTo(x, z, Math.max(MAPV.gz, 1.2));
}
function mapTool(k) {
  const a = P.a; MAPV.fit = false;
  if (k === 'in') mapZoomAt(1.6, MAPV.cw / 2, MAPV.ch / 2);
  else if (k === 'out') mapZoomAt(1 / 1.6, MAPV.cw / 2, MAPV.ch / 2);
  else if (k === 'me' && a) {
    if (MAPV.globe) glbGoTo(a.pos.x, a.pos.z, Math.min(MAPV.cw, MAPV.ch) / 640);
    else { MAPV.cx = a.pos.x; MAPV.cz = a.pos.z; MAPV.s = Math.max(MAPV.s, Math.min(MAPV.cw, MAPV.ch) / 640); }
  } else if (k === 'home') {
    const v = P.human ? ownCamp() || (VX.mem >= 0 && HUNT.camps[VX.mem]) : DEN.pos;
    if (!v) { UI.notify(P.human ? 'עוד אין לך כפר או שבט' : `עוד אין לך ${denName()}`); return; }
    if (MAPV.globe) glbGoTo(v.x, v.z, Math.min(MAPV.cw, MAPV.ch) / 200);
    else { MAPV.cx = v.x; MAPV.cz = v.z; MAPV.s = Math.max(MAPV.s, Math.min(MAPV.cw, MAPV.ch) / 200); }
  } else if (k === 'globe') {
    // the button: the ball, or the flat map of where the ball is looking
    if (MAPV.globe) glbToFlat(glbX(MAPV.gLon), glbZ(MAPV.gLat), Math.max(glbSIn(), Math.min(MAPV.cw, MAPV.ch) / 1100));
    else flatToGlobe(1);
  } else if (k === 'legend') { MAPV.legend = !MAPV.legend; mapLegendShow(); }
  if (!MAPV.globe) mapClamp();
  MAPV.dirty = true;
}
// ---------- tapping the map: what is this? ----------
function mapTap(sx, sy) {
  const F = MAPV.feats, tol = TOUCH ? 24 : 16;
  let best = null, bd = 1e9;
  for (const f of F) { const d = Math.hypot(f.x - sx, f.y - sy) - (f.r || 0) * 0.5; if (d < tol && d < bd) { bd = d; best = f; } }
  let wx = MAPV.cx + (sx - MAPV.cw / 2) / MAPV.s, wz = MAPV.cz + (sy - MAPV.ch / 2) / MAPV.s;
  if (MAPV.globe) {
    // on the ball: the place under the finger (off the ball: nothing)
    const V = glbView(), q = glbUnproj(sx, sy, V.cx, V.cy, V.R);
    if (!best && !q) { MAPV.sel = null; mapInfoShow(null); MAPV.dirty = true; return; }
    if (q) { wx = q.x; wz = q.z; }
    if (!best) best = { k: 'spot', x: sx, y: sy, r: 4, ice: q.ice };
  }
  if (!best) best = { k: 'spot', x: sx, y: sy, r: 4 };
  const w = mapFeatWorld(best); best.wx = w ? w[0] : wrapX(wx); best.wz = w ? w[1] : clamp(wz, -LIMIT, LIMIT);
  if (MAPV.sel && MAPV.sel.k === best.k && MAPV.sel.o === best.o && best.k !== 'spot') { MAPV.sel = null; mapInfoShow(null); }
  else { MAPV.sel = best; mapInfoShow(best); }
  MAPV.dirty = true;
}
function mapFeatWorld(f) {
  const o = f.o;
  if (f.k === 'tribe' || f.k === 'village' || f.k === 'poi' || f.k === 'bld' || f.k === 'cart' || f.k === 'ship') return [o.x, o.z];
  if (f.k === 'person') return [o.pos.x, o.pos.z];
  if (f.k === 'you' && P.a) return [P.a.pos.x, P.a.pos.z];
  if (f.k === 'way' && WAY.p) return [WAY.p.x, WAY.p.z];
  if (f.k === 'den' && DEN.pos) return [DEN.pos.x, DEN.pos.z];
  if (f.k === 'online' && o && o.pr) return [+o.pr.x, +o.pr.z];
  if (f.k === 'book' && o) return [o.x, o.z];
  return null;
}
function mapInfoShow(f) {
  const box = document.getElementById('mapInfo'); if (!box) return;
  if (!f) { box.hidden = true; return; }
  const a = P.a, at = { pos: { x: f.wx, z: f.wz } }, far = a ? Math.hypot(f.wx - a.pos.x, f.wz - a.pos.z) : 0, where = a ? (far < 6 ? 'כאן, לידך' : whereIs(at)) : '';
  let t = '', sub = [], acts = [], goName = '';
  const go = far >= 8 ? ['go', 'ללכת לשם'] : null, mark = far >= 8 ? ['mark', '📍 לסמן כיעד'] : null;
  if (f.k === 'you') { t = 'אתה כאן'; sub = [mapWhereText(f.wx, f.wz), MAPV.north ? 'במפה הקטנה הצפון תמיד למעלה' : 'המפה הקטנה מסתובבת איתך']; }
  else if (f.k === 'village') { t = vxVillageName(); goName = 'הכפר'; sub = [`${TIERN[Math.max(0, villageTier())]} · ${popCount()} אנשים · ${BLD.list.filter(b => b.done && !BTYPES[b.t].len && b.t !== 'torch').length} בניינים`, where]; acts = [go, ['build', '🔨 לבנות']]; }
  else if (f.k === 'tribe') {
    const cp = f.o, i = f.i, rel = mapRel(i); t = cp.tribe; goName = cp.tribe;
    sub = [P.human ? `${rel.t || 'זרים'} · ${cp.hunters.filter(h => h.alive).length} אנשים · ראש השבט: ${chiefNow(cp)}` : 'שבט של בני אדם. כדאי להתרחק מהציידים שלו', `${LANDS[landAt(cp.x, cp.z)].n} · ${where}`];
    acts = [go, mark]; if (P.human && VX.known.has(i)) acts.push(['tribe', 'מה קורה איתם']); if (P.human && VX.known.has(i) && !atWar(i) && VX.mem !== i) acts.push(['trade', '🪙 לסחור']);
  } else if (f.k === 'poi') { t = f.o.n; goName = f.o.n; sub = [`${POI_KIND[f.pk] || 'מקום'} ב${LANDS[landAt(f.wx, f.wz)].n.replace(/^ה/, '')}`, where]; acts = [go, mark]; }
  else if (f.k === 'bld') { const b = f.o, T = BTYPES[b.t]; t = `${T.ic || ''} ${T.n}`; goName = T.dn || T.n; sub = [b.done ? T.d : `בבנייה (${Math.round(100 * clamp((b.work || 0) / (T.work || 1), 0, 1))}%)`, where]; acts = [go]; }
  else if (f.k === 'person') { const m = f.o; t = m.name || (m.isPartner ? 'בן או בת הזוג' : 'בן השבט'); goName = m.name; sub = [P.human && m.cls ? clsWord(m) : m.isPartner ? 'בן או בת הזוג' : '', P.human && m.cls ? doingTribe(m) : '', where].filter(Boolean); acts = [go]; if (P.human && ownCamp() && !m.young && m.tribe) acts.push(['pcard', '📣 תפקיד ופקודה']); }
  else if (f.k === 'cart') { t = 'כרכרה'; goName = 'הכרכרה'; sub = [f.o.driver ? 'בדרך' : 'מחכה ליד הסדנה', where]; acts = [go]; }
  else if (f.k === 'ship') { t = 'ספינה'; goName = 'הספינה'; sub = ['ספינה גדולה של השבט', where]; acts = [go]; }
  else if (f.k === 'ore') { const d = f.o, O = ORE[d.k]; t = `${O.ic} מרבץ ${O.n}`; goName = `מרבץ ה${O.n}`; sub = [d.left > 0 ? `נשארו בו ${d.left} ${O.pl}` : 'התרוקן. יתמלא שוב בעוד כמה ימים', where]; acts = [go, mark]; }
  else if (f.k === 'den') { t = `ה${denName()} שלך`; goName = t; sub = [where]; acts = [go]; }
  else if (f.k === 'way') { t = escH(WAY.label || 'היעד'); goName = WAY.label || 'היעד'; sub = ['היעד שסימנת', where]; acts = [go, ['clear', 'לבטל את היעד']]; }
  else if (f.k === 'online') { const e = f.o, pr = e.pr || {}; t = `🌍 ${escH(onlineName(e))}`; goName = onlineName(e); sub = [`${SPECIES[pr.sp] && pr.sp !== 'hunter' ? SPECIES[pr.sp].he : pr.sx === 'f' ? 'ציידת' : 'צייד'}${pr.vn ? ` · ${escH(onlStr(pr.vn, 40))}` : ''} · שחקן מחובר`, where]; acts = [go, mark, ['owave', '👋 לנפנף']]; if (P.human && pr.sp === 'hunter') acts.push(['ogift', '🎁 מתנה']); }
  else if (f.k === 'book') { const r = f.o; t = `🌍 ${escH(r.vn || onlineNameOf(r.id))}`; goName = r.vn || onlineNameOf(r.id); sub = [`הכפר של ${escH(onlineNameOf(r.id))}${r.pop ? ` · ${Math.round(r.pop)} אנשים` : ''} · ${onlineAgo(r.at)}`, where]; acts = [go, mark]; }
  else if (f.ice) { t = 'הקרח בקצה העולם'; goName = 'הקרח'; sub = ['קרח עבה עד האופק. שום סירה לא עוברת כאן', where]; acts = [mark]; }
  else if (landAt(f.wx, f.wz) === OWL.ocean && getHT(f.wx, f.wz) < -6) { t = mapOceanName(f.wx); goName = t; sub = ['מים עמוקים. בסירה או בספינה', where]; acts = [mark]; }
  else { t = 'נקודה במפה'; goName = 'הנקודה'; sub = [mapWhereText(f.wx, f.wz), where]; acts = [go, mark]; }
  if (MAPV.globe) acts.unshift(['zoom', '🔍 להתקרב לכאן']);
  // your people can be sent to a place on the map (the orders screen opens with it as the target)
  if (P.human && ownCamp() && far >= 25 && clanAdults().length && (f.k === 'spot' || f.k === 'poi' || f.k === 'tribe' || f.k === 'way' || f.k === 'ore')) acts.push(['order', f.k === 'ore' ? '⛏️ לשלוח אנשים לכרות שם' : '📣 לשלוח אנשים לשם']);
  if (WAY.p && f.k !== 'way' && !acts.some(q => q && q[0] === 'clear')) acts.push(['clear', 'לבטל יעד']);
  MAPV.selName = goName || t;
  box.innerHTML = `<button class="mix" data-a="x" aria-label="לסגור">✕</button><b>${t}</b>${sub.filter(Boolean).map(q => `<span>${q}</span>`).join('')}<div class="mib">${acts.filter(Boolean).map(q => `<button class="btn${q[0] === 'go' ? ' pri' : ''}" data-a="${q[0]}">${q[1]}</button>`).join('')}</div>`;
  box.hidden = false;
}
function mapInfoAct(k) {
  const f = MAPV.sel; if (!f && k !== 'x') return;
  if (k === 'x') { MAPV.sel = null; mapInfoShow(null); }
  else if (k === 'go') { setWay(f.wx, f.wz, true, MAPV.selName); UI.close(); }
  else if (k === 'mark') { setWay(f.wx, f.wz, false, MAPV.selName); MAPV.sel = null; mapInfoShow(null); }
  else if (k === 'clear') { clearWay(); MAPV.sel = null; mapInfoShow(null); }
  else if (k === 'tribe') { UI.close(); openWar('tribes', f.i); }
  else if (k === 'trade') { UI.close(); tradeCard(f.i, null); }
  else if (k === 'build') { UI.close(); if (typeof buildOpen === 'function') buildOpen(); }
  else if (k === 'pcard') { UI.close(); personCard(f.o); }
  else if (k === 'order') { setWay(f.wx, f.wz, false, MAPV.selName); UI.close(); ordOpen(); }
  else if (k === 'owave') { onlineWave(f.o); }
  else if (k === 'ogift') { UI.close(); onlineGiftCard(f.o); }
  else if (k === 'zoom') { MAPV.sel = null; mapInfoShow(null); const x = f.wx, z = f.wz; glbFlyTo(x, z, glbGzMax(), () => glbToFlat(x, z, Math.min(MAPV.cw, MAPV.ch) / 640)); }
  MAPV.dirty = true;
}
// the oceans by name: the one between the two worlds, and the wide one round the other side
const mapOceanName = x => { const w = wrapX(x); return w > W.half && w < OW.x0 ? 'האוקיינוס האטלנטי' : 'האוקיינוס השקט'; };
// ---------- the legend: every picture of the map, and how the little map turns ----------
function mapLegendRows() {
  const H = P.human;
  const rows = [['arrow', 'אתה (החץ מראה לאן אתה פונה)'], ['flag', 'היעד שלך. נגיעה במקום במפה מסמנת יעד']];
  if (H) rows.push(['house', 'הכפר שלך, והקו הצהוב סביבו: הגבול שלו'], ['tent:ally', 'שבט בברית איתך'], ['tent:friend', 'שבט ידידותי'], ['tent:neutral', 'שבט זר'], ['tent:hostile', 'שבט עוין'], ['tent:war', 'שבט שאתם במלחמה איתו'], ['tent:vassal', 'שבט חסות שלך'],
    ['ring', 'שטחי הציד של שבט (העיגול המקווקו)'], ['ping', 'סכנה שסומנה: טורף, פושט או אגדה'], ['people', 'אנשי השבט: לוחמים, ציידים, בונים, אוספים, ילדים'], ['dot:#c98a4a', 'סוסים של השבט'], ['dot:#ffd34d', 'הלוחמים שלך בדרך לפשיטה'], ['dot:#ff3b30', 'אויבים'], ['dot:#ff78ab', 'שבויים']);
  else rows.push(['den', `ה${denName()} שלך`], ['dot:#ff78ab', 'בן או בת הזוג'], ['dot:#ffc1d8', 'הגורים'], ['tent:neutral', 'מחנה של בני אדם'], ['ping', 'סכנה או אגדה שסומנה']);
  if (H) rows.push(['castle', 'טירה של העולם הישן'], ['city', 'עיר או עיירה של העולם הישן'], ['swords', 'מחנה של שודדי דרכים'], ['road', 'דרך בין ערים (בעולם הישן)'], ['ferry', 'הדרך של הספינה בין שני העולמות (בגלובוס)']);
  rows.push(['pass', 'מעבר בין ההרים'], ['peak', 'הר'], ['water', 'אגם, נהר או בור מים'], ['palm', 'אי או נווה מדבר'], ['place', 'מקום עם שם'], ['trees', 'עצים (כשמתקרבים)']);
  if (H) rows.push(['bld', 'בתים, שדות וחומות (כשמתקרבים)']);
  rows.push(['mini', 'במפה הקטנה: צהוב זו חיה שאפשר לצוד, ואדום עם טבעת זה טורף מסוכן']);
  return rows;
}
function mapLegendIcon(cv, k) {
  const c = cv.getContext('2d'), d = Math.min(2, devicePixelRatio || 1); cv.width = 30 * d; cv.height = 24 * d; c.setTransform(d, 0, 0, d, 0, 0);
  const [a, b] = k.split(':'), x = 15, y = 12;
  if (a === 'arrow') icArrow(c, x, y, 0, 9, MAPC.you);
  else if (a === 'flag') icFlag(c, x - 3, y + 8, 5, MAPC.way);
  else if (a === 'house') icHouse(c, x, y, 9, MAPC.home);
  else if (a === 'den') icDen(c, x, y, 8, '#ffd34d');
  else if (a === 'tent') icTent(c, x, y + 1, 8, MAPC[b]);
  else if (a === 'castle') icCastle(c, x, y + 1, 8, MAPC.neutral);
  else if (a === 'city') icCity(c, x, y + 1, 8, MAPC.neutral);
  else if (a === 'swords') icSwords(c, x, y, 9, MAPC.war);
  else if (a === 'road') { c.lineCap = 'round'; c.strokeStyle = 'rgba(70,54,32,.6)'; c.lineWidth = 5; c.beginPath(); c.moveTo(3, 17); c.quadraticCurveTo(14, 2, 27, 9); c.stroke(); c.strokeStyle = '#c7a873'; c.lineWidth = 3; c.stroke(); }
  else if (a === 'ferry') { c.save(); c.setLineDash([4, 3]); c.strokeStyle = 'rgba(255,236,190,.95)'; c.lineWidth = 2; c.beginPath(); c.moveTo(2, 18); c.quadraticCurveTo(15, 4, 28, 14); c.stroke(); c.restore(); icShip(c, x, y - 1, 5); }
  else if (a === 'ping') icDot(c, x, y, 8, 'rgba(238,83,72,.9)', true);
  else if (a === 'ring') { c.setLineDash([4, 3]); c.strokeStyle = '#9a7a2c'; c.lineWidth = 2.4; c.beginPath(); c.arc(x, y, 9, 0, TAU); c.stroke(); }
  else if (a === 'people') ['warrior', 'hunter', 'builder', 'gatherer', 'child'].forEach((q, i) => icDot(c, 4 + i * 5.5, y + (i % 2 ? 3 : -3), 2.6, CLSC[q]));
  else if (a === 'dot') icDot(c, x, y, 4.5, b);
  else if (a === 'pass') icPeak(c, x, y, 7, true);
  else if (a === 'peak') icPeak(c, x, y, 7);
  else if (a === 'water') icDrop(c, x, y, 7);
  else if (a === 'palm') icPalm(c, x, y, 8);
  else if (a === 'place') icDiamond(c, x, y, 6, '#f1ead6');
  else if (a === 'trees') { for (const [tx, ty, r] of [[8, 9, 5], [18, 8, 6], [13, 16, 5], [23, 16, 4]]) { c.fillStyle = 'rgba(8,16,6,.3)'; c.beginPath(); c.arc(tx + 1.5, ty + 1.5, r, 0, TAU); c.fill(); c.fillStyle = '#2c5a2c'; c.beginPath(); c.arc(tx, ty, r, 0, TAU); c.fill(); } }
  else if (a === 'bld') { c.fillStyle = '#b58c50'; c.fillRect(4, 5, 11, 9); c.strokeStyle = MAPC.ink; c.lineWidth = 1; c.strokeRect(4, 5, 11, 9); c.fillStyle = '#86a84c'; c.fillRect(17, 8, 10, 10); c.strokeRect(17, 8, 10, 10); c.strokeStyle = '#8c6a42'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(3, 20); c.lineTo(27, 20); c.stroke(); }
  else if (a === 'mini') { icDot(c, 9, y, 3.4, '#ffc24a'); icDot(c, 21, y, 3.4, '#ff3b30'); icDot(c, 21, y, 5.6, 'rgba(255,59,48,.75)', true); }
}
function mapLegendShow() {
  const box = document.getElementById('mapLegend'); if (!box) return;
  box.hidden = !MAPV.legend; document.querySelector('#mapov [data-m="legend"]').classList.toggle('on', MAPV.legend);
  if (!MAPV.legend) return;
  const rows = mapLegendRows();
  box.innerHTML = `<div class="mlh"><b>מקרא</b><button class="mix" data-m="legend" aria-label="לסגור את המקרא">✕</button></div><div class="mlr">${rows.map(r => `<div><canvas data-ic="${r[0]}"></canvas><span>${r[1]}</span></div>`).join('')}</div>` +
    `<div class="mlo"><span>המפה הקטנה בפינה</span><div class="seg"><button data-n="1" class="${MAPV.north ? 'on' : ''}">צפון למעלה</button><button data-n="0" class="${MAPV.north ? '' : 'on'}">מסתובבת איתך</button></div></div>`;
  for (const cv of box.querySelectorAll('canvas[data-ic]')) mapLegendIcon(cv, cv.dataset.ic);
}
// ---------- the map's own screen ----------
function mapInit() {
  if (MAPV.ready) return; MAPV.ready = true;
  const ov = document.getElementById('mapov'), card = ov.querySelector('.card'), cv = document.getElementById('bigmap'), close = document.getElementById('mapClose');
  card.classList.add('mapcard'); card.innerHTML = '';
  const head = document.createElement('div'); head.className = 'mhead';
  const I = { in: SVG('<path d="M12 5v14M5 12h14"/>'), out: SVG('<path d="M5 12h14"/>'), me: SVG('<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4"/><circle cx="12" cy="12" r="7.5"/>'),
    home: SVG('<path d="M3.5 11.5L12 4l8.5 7.5"/><path d="M6 10v9.5h12V10"/><path d="M10 19.5v-5h4v5"/>'), world: SVG('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.8 3 2.8 15 0 18M12 3c-2.8 3-2.8 15 0 18"/>'),
    legend: SVG('<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1.4"/><circle cx="4.5" cy="12" r="1.4"/><circle cx="4.5" cy="18" r="1.4"/>') };
  head.innerHTML = `<div class="mtitle"><b>מפה</b><span id="mapWhere"></span></div><div class="mtools">` +
    `<button class="mbt" data-m="in" aria-label="להתקרב">${I.in}</button><button class="mbt" data-m="out" aria-label="להתרחק">${I.out}</button>` +
    `<button class="mbt" data-m="me" aria-label="להראות איפה אני">${I.me}</button><button class="mbt" data-m="home" aria-label="${P.human ? 'הכפר' : 'הבית'}">${I.home}</button>` +
    `<button class="mbt mtx" data-m="globe" aria-label="גלובוס: כל העולם על כדור">${I.world}<span>גלובוס</span></button><button class="mbt mtx" data-m="legend" aria-label="מקרא">${I.legend}<span>מקרא</span></button></div>`;
  close.className = 'mbt mclose'; close.innerHTML = SVG('<path d="M6 6l12 12M18 6L6 18"/>'); close.setAttribute('aria-label', 'לסגור את המפה');
  head.querySelector('.mtools').appendChild(close);
  const wrap = document.createElement('div'); wrap.className = 'mwrap';
  wrap.append(cv);
  wrap.insertAdjacentHTML('beforeend', `<div id="mapInfo" hidden></div><div id="mapLegend" hidden></div><div id="mapHint" hidden>${mapHintText()}</div>`);
  card.append(head, wrap);
  head.addEventListener('click', e => { const b = e.target.closest('[data-m]'); if (b) mapTool(b.dataset.m); });
  wrap.addEventListener('click', e => {
    const b = e.target.closest('#mapInfo [data-a]'); if (b) { mapInfoAct(b.dataset.a); return; }
    const l = e.target.closest('#mapLegend [data-m]'); if (l) { mapTool(l.dataset.m); return; }
    const n = e.target.closest('#mapLegend [data-n]');
    if (n) { MAPV.north = n.dataset.n === '1'; try { localStorage.setItem('amazonia-map-north', MAPV.north ? '1' : '0'); } catch (err) { /* only for this time */ } mapLegendShow(); }
  });
  mapPtrs(cv);
  const st = document.createElement('style');
  st.textContent = `#mapov{padding:calc(env(safe-area-inset-top,0px) + 8px) calc(env(safe-area-inset-right,0px) + 8px) calc(env(safe-area-inset-bottom,0px) + 8px) calc(env(safe-area-inset-left,0px) + 8px)}
#mapov .card.mapcard{width:min(1500px,100%);height:100%;max-height:none;display:flex!important;flex-direction:column;gap:8px;padding:10px;overflow:hidden;align-items:stretch}
#mapov .mhead{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:space-between}
#mapov .mtitle{display:flex;align-items:baseline;gap:10px;min-width:0;flex:1 1 auto}
#mapov .mtitle b{font-family:'Karantina','Rubik',sans-serif;font-size:34px;line-height:1}
#mapov .mtitle span{font-size:14px;color:var(--dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#mapov .mtools{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
#mapov .mbt{display:inline-flex;align-items:center;justify-content:center;gap:5px;min-width:40px;height:40px;padding:0 8px;border-radius:11px;border:1px solid var(--line);background:var(--panel2);color:var(--ink);cursor:pointer;font:600 14px Rubik,sans-serif}
#mapov .mbt svg{width:20px;height:20px}#mapov .mbt.on{background:var(--gold);color:#1a1206;border-color:var(--gold)}
#mapov .mbt.mclose{background:var(--gold);color:#1a1206;border-color:var(--gold)}
#mapov .mwrap{position:relative;flex:1 1 auto;min-height:0;border-radius:12px;overflow:hidden;background:#06101a}
#mapov #bigmap{position:absolute;inset:0;width:100%!important;height:100%!important;border-radius:0;touch-action:none;cursor:grab;display:block}
#mapov #bigmap:active{cursor:grabbing}
#mapInfo{position:absolute;left:50%;bottom:10px;transform:translateX(-50%);width:min(420px,calc(100% - 20px));display:flex;flex-direction:column;gap:3px;padding:12px 14px 12px;border-radius:14px;background:var(--panel);border:1px solid var(--line);color:var(--ink);box-shadow:0 8px 28px rgba(0,0,0,.35);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
#mapInfo b{font-size:17px;padding-left:28px}#mapInfo span{font-size:13px;color:var(--dim);line-height:1.4}
#mapInfo .mib{display:flex;gap:6px;flex-wrap:wrap;margin-top:7px}#mapInfo .mib .btn{padding:7px 13px;font-size:13.5px}
#mapov .mix{position:absolute;top:8px;left:8px;width:28px;height:28px;border-radius:50%;border:1px solid var(--line);background:transparent;color:var(--ink);cursor:pointer;font-size:13px;line-height:1}
#mapLegend{position:absolute;top:10px;right:10px;width:min(300px,calc(100% - 20px));max-height:calc(100% - 20px);overflow:auto;padding:10px 12px;border-radius:14px;background:var(--panel);border:1px solid var(--line);color:var(--ink);box-shadow:0 8px 28px rgba(0,0,0,.35);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);overscroll-behavior:contain}
#mapLegend .mlh{position:relative;display:flex;align-items:center;margin-bottom:6px}#mapLegend .mlh b{font-size:16px}#mapLegend .mlh .mix{top:-2px;left:0}
#mapLegend .mlr>div{display:flex;align-items:center;gap:8px;font-size:12.5px;line-height:1.3;padding:3px 0}#mapLegend canvas{width:30px;height:24px;flex:0 0 auto}
#mapLegend .mlo{margin-top:8px;padding-top:8px;border-top:1px solid var(--line);display:flex;flex-direction:column;gap:6px;font-size:12.5px;color:var(--dim)}
#mapLegend .seg{display:flex;gap:4px}#mapLegend .seg button{flex:1;padding:6px 8px;border-radius:9px;border:1px solid var(--line);background:transparent;color:var(--ink);font:600 12.5px Rubik,sans-serif;cursor:pointer}#mapLegend .seg button.on{background:var(--gold);color:#1a1206;border-color:var(--gold)}
#mapHint{position:absolute;left:50%;top:10px;transform:translateX(-50%);max-width:calc(100% - 90px);padding:6px 12px;border-radius:10px;background:rgba(12,22,14,.8);color:#f6efd9;font-size:12.5px;text-align:center;pointer-events:none}
@media (max-width:620px){#mapov .mtitle b{font-size:28px}#mapov .mbt{min-width:36px;height:36px;padding:0 6px}#mapov .mbt.mtx span{display:none}#mapov .mtitle span{font-size:12.5px}}
@media (max-height:520px){#mapov .card.mapcard{padding:6px;gap:5px}#mapov .mtitle b{font-size:26px}#mapov .mbt{height:34px;min-width:34px}#mapInfo{padding:9px 12px}#mapInfo b{font-size:15px}}`;
  document.head.appendChild(st);
}
// ---------- the touch screen: when the buttons at the top do not fit beside the little map, the little map moves under them ----------
function miniPlace(tt, mini) {
  const b = document.body, n = [...tt.children].filter(q => !q.hidden).length, tr = tt.getBoundingClientRect(), mr = mini.getBoundingClientRect(), was = b.classList.contains('minidown');
  if (!was) MAPV.miniTopW = mr.width;
  const need = n * 32 + (n - 1) * 4, down = tr.right - need - 6 < mr.left + MAPV.miniTopW;
  if (down !== was) b.classList.toggle('minidown', down);
  hlSet(mini, 'top', down ? tr.bottom + 8 : null);
  return down;
}
(function () {
  const st = document.createElement('style');
  st.textContent = '#mini{width:210px;height:210px;pointer-events:auto;cursor:pointer}body.touch.minidown #mini{width:118px;height:118px}';
  document.head.appendChild(st);
})();
