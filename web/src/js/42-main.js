// ================= MAIN =================
const TOUCH = (() => {
  try { const q = new URLSearchParams(location.search).get('touch'); if (q !== null) return q !== '0'; } catch (e) { }
  return matchMedia('(pointer: coarse)').matches || (navigator.maxTouchPoints > 0 && !matchMedia('(any-pointer: fine)').matches);
})();
const PHONE = TOUCH && Math.min(screen.width, screen.height) < 600;
(() => { let saved = null; try { saved = JSON.parse(localStorage.getItem('amazonia-set') || '{}').q; } catch (e) { } if (!saved) SET.q = PHONE ? 'low' : 'med'; })();
let renderer = null, scene = null, camera = null;
const PRT = { low: 1.0, med: 1.3, high: 1.7 };                 // pixel ratio caps on touch devices
const PERF = { dyn: 1, acc: 0, n: 0, hold: 3, pr: 1, paused: false, noAdapt: /noadapt/.test(location.search) };
const MENU = { t: 0, spot: null, time: 15.6, dk: 3.2, dk0: 0.9, hk: 0.95, lk: 0.5, sway: 0.2 };
const nextFrame = () => new Promise(r => requestAnimationFrame(() => setTimeout(r, 0)));

function resize() {
  if (!renderer) return;
  const w = innerWidth, h = innerHeight;
  const base = TOUCH ? PRT[SET.q] : QUAL[SET.q].pr;
  PERF.pr = Math.max(0.5, Math.min(window.devicePixelRatio || 1, base) * PERF.dyn);
  renderer.setPixelRatio(PERF.pr); renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.fov = G.mode === 'menu' ? (h > w ? 62 : 46) : h > w ? 72 : 55;
  setMenuOffset(); camera.updateProjectionMatrix();
  PSCALE.value = h * PERF.pr / (2 * Math.tan(camera.fov * Math.PI / 360));
  const cm = $('cmp');
  if (cm && cm.clientWidth && cm.clientHeight) { const cv = $('cmpC'), W = Math.round(cm.clientWidth / cm.clientHeight * 30); if (cv.width !== W) cv.width = W; }
  UI.checkRotate();
  PERF.paused = false;
}
function menuLayout() {
  const w = innerWidth, h = innerHeight;
  if (G.mode !== 'menu' || w < h * 1.1) return null;
  return h <= 520 ? { ox: 0.26, oy: -0.07 } : { ox: 0.07, oy: 0.06 };
}
function setMenuOffset() {
  const w = innerWidth, h = innerHeight, L = menuLayout();
  if (L) camera.setViewOffset(w, h, w * L.ox, h * L.oy, w, h); else camera.clearViewOffset();
}
function applyQuality() {
  const q = QUAL[SET.q];
  applyShadowQuality();
  if (VEG.mat) { VEG.mat.alphaToCoverage = q.aa; VEG.mat.needsUpdate = true; }
  updateVeg(true); treeGhostSync();
  PERF.dyn = 1; PERF.hold = 2; resize();
}
// dynamic resolution: keep phones and tablets fluid
function adapt(raw) {
  if (PERF.noAdapt || G.mode === 'loading') return;
  if (PERF.hold > 0) { PERF.hold -= raw; PERF.acc = 0; PERF.n = 0; return; }
  if (raw > 0.25) return;
  PERF.acc += raw; PERF.n++;
  if (PERF.acc < 2.5) return;
  const avg = PERF.acc / PERF.n; PERF.acc = 0; PERF.n = 0;
  let d = PERF.dyn;
  if (avg > 1 / 27) d = Math.max(0.5, d * 0.86);
  else if (avg < 1 / 48) d = Math.min(1, d * 1.07);
  if (Math.abs(d - PERF.dyn) > 0.005) { PERF.dyn = d; resize(); }
}

// ---------- menu: the chosen animal on the lake shore, waterfall behind ----------
function findPreviewSpot() {
  const L = LAKE, fb = FALL ? (FALL.base || FALL) : L;
  let best = null, bs = -1e9;
  for (let k = 0; k < 120; k++) {
    const ang = k / 120 * TAU, ux = Math.cos(ang), uz = Math.sin(ang);
    let land = null;
    for (let r = 4; r < L.r + 40; r += 0.5) {
      const x = L.x + ux * r, z = L.z + uz * r, w = waterAt(x, z), h = getH(x, z);
      if (w > -900 && h < w + 0.2) continue;
      land = { x: x + ux * 1.6, z: z + uz * 1.6 }; break;
    }
    if (!land) continue;
    const x = land.x, z = land.z, h = getH(x, z);
    if (getNY(x, z) < 0.86 || Math.abs(h - getH(x + 1.5, z)) > 0.6 || Math.abs(h - getH(x, z + 1.5)) > 0.6) continue;
    const fx = x - fb.x, fz = z - fb.z, fd = Math.hypot(fx, fz);
    if (fd < 25 || fd > 160) continue;
    const away = Math.atan2(fx / fd, fz / fd);
    for (const off of [0, -0.3, 0.3, -0.6, 0.6, -0.9, 0.9]) {
      const yaw = away + off, d = 7, cx = x + Math.sin(yaw) * d, cz = z + Math.cos(yaw) * d;
      const cw = waterAt(cx, cz), ch = getH(cx, cz), overWater = cw > -900 && cw > ch + 0.4;
      if (Math.abs(ch - h) > 2.5 && !overWater) continue;
      let blocked = 0;
      for (let t = 0.05; t < 0.95; t += 0.075) {
        const p = { x: lerp(cx, x, t), z: lerp(cz, z, t) };
        if (trunkPush(p, 0.9)) blocked += 1;
        blocked += gridAt(FOREST, p.x, p.z) * 0.35;
      }
      const sc = (overWater ? 5 : 0) - blocked * 2.5 - Math.abs(off) * 3 - Math.abs(fd - 75) * 0.025 - gridAt(FOREST, cx, cz) * 5 - gridAt(FOREST, x, z) * 2;
      if (sc > bs) { bs = sc; best = { x, z, y: h, camYaw: yaw, dist: d, camH: 1.25, yaw: yaw - 0.75 }; }
    }
  }
  if (!best) { const x = L.x + L.r + 5, z = L.z; best = { x, z, y: getH(x, z), camYaw: 0, dist: 7, camH: 1.4, yaw: -0.7 }; }
  return best;
}
function menuPreview() {
  if (G.mode !== 'menu' || !LAKE) return;
  if (!MENU.spot) MENU.spot = findPreviewSpot();
  const s = MENU.spot;
  if (G.preview) { G.preview.remove(); G.preview = null; }
  const fishy = isFishSp(SET.sp), birdy = isBirdSp(SET.sp); let px = s.x, pz = s.z;
  if (fishy) for (let k = 1; k < 40; k++) { const x = s.x + Math.sin(s.camYaw) * k * 0.6, z = s.z + Math.cos(s.camYaw) * k * 0.6; if (waterDepth(x, z) > 1.1 && getH(x, z) < -0.9) { px = x; pz = z; break; } }
  const a = new Animal(SET.sp, px, pz, { sex: SET.sex, scale: 1, yaw: s.yaw, tpl: SET.sp === 'hunter' ? (SET.sex === 'f' ? 'hunter3' : 'hunter0') : skinTpl(SET.sp) });
  MENU.fish = fishy ? { x: px, z: pz } : null; if (fishy) { a.ownY = true; a.pos.y = -0.3; }
  MENU.bird = birdy ? { x: s.x + Math.sin(s.camYaw) * 1.5, z: s.z + Math.cos(s.camYaw) * 1.5, y: s.y + 1.5 } : null; if (birdy) a.ownY = true;
  a.frozen = true; a.vd = 9999; a.state = 'idle'; a.pose = 'idle';
  a.camSize = { jaguar: 1, puma: 1, ocelot: 0.62, capybara: 0.78, caiman: 1.15, piranha: 0.42, arapaima: 1.25, eel: 0.62, hunter: 0.85, macaw: 0.32, toucan: 0.3, harpy: 0.6, bushdog: 0.55, otter: 0.5, anaconda: 0.85, frog: 0.22 }[SET.sp] || 1;
  if (!fishy && !birdy) a.ground(0.016, true);
  G.preview = a; G.time = MENU.time; G.timeMul = 1;
  resize(); PERF.hold = Math.max(PERF.hold, 1);
}
function menuCamera(dt) {
  const s = MENU.spot, a = G.preview; if (!s) return;
  MENU.t += dt;
  if (MENU.bird && a) {
    const f = MENU.bird, sz = a.camSize, t = MENU.t * 0.5, r = 0.6 + sz * 1.8;
    a.pos.set(f.x + Math.cos(t) * r, f.y + Math.sin(MENU.t * 0.9) * 0.2, f.z + Math.sin(t) * r);
    a.yaw = Math.atan2(-Math.sin(t), Math.cos(t)); a.pose = 'fly'; a.speed = 3; a.bank = -0.4; a.vy = Math.cos(MENU.t * 0.9) * 0.18; a.glide = Math.sin(MENU.t * 0.6) > 0.2 ? 1 : 0;
    const yaw = s.camYaw + Math.sin(MENU.t * 0.09) * MENU.sway * 0.5, d = 1.8 + sz * 8;
    camera.position.set(f.x + Math.sin(yaw) * d, f.y + 0.2 + sz * 1.5, f.z + Math.cos(yaw) * d);
    const sh = innerWidth > innerHeight * 1.1 ? r * 1.1 : 0; camera.lookAt(f.x + Math.cos(yaw) * sh, f.y, f.z - Math.sin(yaw) * sh); return;
  }
  if (MENU.fish && a) {
    const f = MENU.fish, sz = a.camSize, t = MENU.t;
    a.pos.set(f.x + Math.sin(t * 0.4) * 0.12 * sz, -0.16 - sz * 0.06 + Math.sin(t * 1.3) * 0.03, f.z + Math.cos(t * 0.3) * 0.12 * sz);
    a.yaw = s.camYaw + Math.PI / 2 + Math.sin(t * 0.25) * 0.25; a.speed = 0.45; a.vy = Math.cos(t * 1.3) * 0.04;
    const yaw = s.camYaw + Math.sin(t * 0.09) * MENU.sway * 0.4, d = 0.6 + sz * 2.3;
    camera.position.set(f.x + Math.sin(yaw) * d, 0.75 + sz * 1.35, f.z + Math.cos(yaw) * d);
    camera.lookAt(f.x, -0.2, f.z);
    return;
  }
  const sz = a ? a.camSize : 1, d = MENU.dk * sz + MENU.dk0;
  const yaw = s.camYaw + Math.sin(MENU.t * 0.09) * MENU.sway;
  const cx = s.x + Math.sin(yaw) * d, cz = s.z + Math.cos(yaw) * d;
  const w = waterAt(cx, cz), base = Math.max(getH(cx, cz), w > -900 ? w : -99);
  const ay = a ? a.pos.y : s.y, ah = a ? a.height : 0.8;
  camera.position.set(cx, Math.max(base + 0.45, ay + ah * MENU.hk + 0.15), cz);
  camera.lookAt(s.x, ay + ah * MENU.lk, s.z);
}

// ---------- boot ----------
async function boot() {
  const step = async (p, t) => { (window.__bt = window.__bt || []).push([p, performance.now(), performance.memory ? performance.memory.usedJSHeapSize : 0]); $('loadFill').style.width = p + '%'; if (t) $('loadText').textContent = t; await nextFrame(); };
  try {
    if (!window.THREE) throw new Error('ספריית התלת־ממד לא נטענה. צריך חיבור לאינטרנט');
    if (TOUCH) document.body.classList.add('touch');
    await step(4, 'מכינים את הבד…');
    renderer = new THREE.WebGLRenderer({ canvas: $('c'), antialias: true, powerPreference: 'high-performance', stencil: false });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.15, 1500);
    resize();
    $('c').addEventListener('webglcontextlost', e => { e.preventDefault(); G.paused = true; $('loading').hidden = false; $('loadText').textContent = 'המכשיר עצר את הגרפיקה. צריך לרענן את הדף כדי להמשיך'; });
    await step(8, 'מרימים הרים וחוצבים נהרות…');
    genWorld();
    await step(24, 'מעצבים את פני השטח…');
    buildTerrain(); oldWorldTerrain();
    await step(34, 'ממלאים את הנהר והאגם…');
    buildWater(); oldWorldWater();
    await step(42, 'פורשים שמיים…');
    buildSky(); applyShadowQuality();
    await step(48, 'מגדלים ג׳ונגל…');
    buildVegetation(); oldWorldVeg(); treeIndexBuild();
    await step(70, 'מעירים את החיות…');
    buildTemplates();
    await step(80, 'משחררים אותן לטבע…');
    spawnAll(); buildFX(); buildRays();
    await step(88, 'מכינים את הממשק…');
    UI.init();
    const enter = UI.enterGame.bind(UI);
    UI.enterGame = () => { enter(); camera.clearViewOffset(); PERF.hold = 2; resize(); CAM.init = false; updateCamera(0.016); updateVeg(true); };
    G.mode = 'menu';
    menuPreview(); menuCamera(0);
    updateSky(0, G.preview ? G.preview.pos : camera.position); updateVeg(true);
    for (let i = 0; i < 3; i++) updateAnimals(0.016);
    await step(94, 'מחממים את הכרטיס הגרפי…');
    renderer.compile(scene, camera);
    renderer.render(scene, camera);
    await step(100, '');
    $('loading').hidden = true; $('menu').hidden = false;
    addEventListener('resize', resize);
    if (screen.orientation && screen.orientation.addEventListener) screen.orientation.addEventListener('change', () => setTimeout(resize, 120));
    last = performance.now(); requestAnimationFrame(frame);
  } catch (e) {
    console.error(e);
    $('loadText').textContent = 'משהו השתבש בטעינה: ' + (e && e.message ? e.message : e);
    $('loadFill').style.background = '#ee5348';
  }
}

// ---------- loop ----------
let last = 0;
function frame(now) {
  requestAnimationFrame(frame);
  if (window.__freeze) { last = now; return; }
  const t0 = performance.now();
  const raw = Math.max(0, (now - last) / 1000); last = now;
  const dt = Math.min(0.05, raw || 0.016);
  if (PHOTO.on) { photoUpdate(); renderFrame(); return; }
  if (G.mode === 'play' && (G.paused || UI.rotating)) {
    if (!PERF.paused) { renderFrame(); PERF.paused = true; }
    PERF.hold = 0.5; return;
  }
  PERF.paused = false;
  try { step(dt); } catch (err) { reportErr(err); }
  INPUT.press.clear();
  renderFrame();
  PERF.ms = PERF.ms ? PERF.ms * 0.9 + (performance.now() - t0) * 0.1 : performance.now() - t0;
  adapt(raw);
}
const ERRS = new Set();
function reportErr(err) {
  const k = String(err && err.message || err);
  if (ERRS.has(k) || ERRS.size > 20) return; ERRS.add(k); console.error(err);
}
function step(dt) {
  if (COMBAT.slowT > 0) { COMBAT.slowT -= dt; dt *= 0.35; }
  WUNI.uTime.value += dt; G.t += dt;
  if (G.mode === 'play' || G.mode === 'dead') {
    if (G.mode !== 'play') G.timeMul = 1;
    const prev = G.time;
    G.time += dt * timeRate();
    if (G.time >= 24) { G.time -= 24; G.day++; }
    if (G.mode === 'play' && prev < 6 && G.time >= 6 && G.day > 1) {
      P.days = G.day - 1;
      UI.big(`יום ${G.day}`, P.cubs.length ? (P.human ? 'עוד לילה עבר. הילדים גדלים' : 'עוד לילה עבר. הגורים גדלים') : 'השחר עולה על הג׳ונגל'); gainXP(25);
    }
    updateWeather(dt);
  } else {
    G.rain = Math.max(0, G.rain - dt * 0.25); G.rainTarget = 0; G.flash = 0;
  }
  if (G.mode === 'play') updatePlayer(dt);
  updateAnimals(dt);
  if (G.mode === 'menu') menuCamera(dt); else { updateCamera(dt); cineUpdate(dt); }
  updateSky(dt, P.a ? P.a.pos : G.preview ? G.preview.pos : camera.position);
  VEG.uni.uWind.value += (0.75 + G.rain * 1.25 - VEG.uni.uWind.value) * Math.min(1, dt * 0.5);
  updateVeg();
  VEG.uni.uNear.value = G.mode === 'menu' ? 0.6 : 2.3;
  const wantClear = G.mode === 'menu' ? (MENU.fish ? 1 : 0) : P.fish ? 1 : (P.a && P.isPred && !P.a.swimming && GROUPS.some(g => g.kind === 'shoal' && Math.hypot(g.c.x - P.a.pos.x, g.c.z - P.a.pos.z) < 14)) ? 0.85 : 0;
  WUNI.uClear.value += (wantClear - WUNI.uClear.value) * Math.min(1, dt * 2);
  progUpdate(dt); senseUpdate(dt); socUpdate(dt); legendUpdate(dt); spearFxUpdate(); worldUpdate(dt); globeUpdate(dt); mapPrep(); townGlowUpdate(); townLifeUpdate(dt); owKeepOut(dt); owBirdsUpdate(dt); alarmUpdate(dt); hudUpdate(dt); climbUpdate(dt); missionsUpdate(dt); homeUpdate(dt); packsUpdate(dt); herdsUpdate(dt); specialUpdate(dt); growUpdate(dt); bugsUpdate(dt); tribe2Update(dt); camp2Update(dt); tameHints(dt); cookUpdate(dt); eatUpdate(dt); dogFoodUpdate(dt); aimDiveUpdate(dt); gearFrame(dt); foodUpdate(dt); tribeUpdate(dt); vxUpdate(dt); combatUpdate(dt); denUpdate(dt); updateCharLight(); updateBlobs(); updateRays(dt);
  FX.update(dt); AUD.update(dt); UI.update(dt); onlineFrame(dt);
}
boot();
