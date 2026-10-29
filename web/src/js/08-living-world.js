// ================= NEXT LEVEL: jungle legends, cinematic look, photo mode, dynamic music =================
(function () {
  const st = document.createElement('style');
  st.textContent = `#boss{position:absolute;top:calc(env(safe-area-inset-top,0px) + 84px);left:50%;transform:translateX(-50%);width:min(440px,64vw);text-align:center;opacity:0;transition:opacity .4s;pointer-events:none}
#boss.on{opacity:1}#boss b{display:block;font-family:'Karantina','Rubik',sans-serif;font-size:34px;line-height:1;color:#fff3d6;text-shadow:0 2px 10px rgba(0,0,0,.75)}
#boss span{display:block;font-size:12px;color:#f4d9a8;margin:2px 0 5px;text-shadow:0 1px 4px #000}
#boss i{display:block;height:9px;border-radius:5px;background:rgba(0,0,0,.45);border:1px solid rgba(255,220,180,.35);overflow:hidden}
#boss em{display:block;height:100%;width:100%;background:linear-gradient(90deg,#7a120c,#d8402c);transition:width .25s}
body.touch #boss{top:calc(env(safe-area-inset-top,0px) + 46px);width:min(360px,46vw)}body.touch #boss b{font-size:24px}
#photobar{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 18px);transform:translateX(-50%);z-index:35;display:flex;gap:10px;align-items:center;padding:8px 12px;border-radius:999px;background:rgba(10,18,12,.55);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);color:#f4efe1;font-size:12px}
#photobar .btn{color:#f4efe1;border-color:rgba(244,239,225,.45)}#photobar .btn.pri{color:#1c1608}`;
  document.head.appendChild(st);
})();

// ---------- legendary animals ----------
const LEG = { t: 3, told: {}, bar: null, active: null };
const LEGENDS = [
  { id: 'shadow', sp: 'jaguar', tpl: 'jaguarBlack', name: 'הצל השחור', title: 'יגואר שחור ענק', f: false, scale: 1.38, hp: 2.6, dmg: 1.25, aggro: 22, roar: 'jaguar', where: 'ליד המפל הגדול' },
  { id: 'mother', sp: 'anaconda', name: 'אם הנהר', title: 'אנקונדה ענקית', f: true, scale: 1.75, hp: 3.0, dmg: 1.3, aggro: 13, roar: 'hiss', where: 'באגם שמתחת למפל' },
  { id: 'queen', sp: 'harpy', name: 'מלכת השמיים', title: 'עיט ענקית', f: true, scale: 1.55, hp: 2.4, dmg: 1.3, aggro: 55, roar: 'screech', where: 'בצמרות שליד הר השולחן' }
];
function legendReset() { LEG.told = {}; LEG.active = null; LEG.t = 3; for (const L of LEGENDS) { L.a = null; L.done = false; } legendBar(null); }
function legendLair(L) {
  if (L.id === 'shadow') { const fb = FALL.base || FALL; return habitatPoint('forest', p => { const d = Math.hypot(p.x - fb.x, p.z - fb.z); return d > 35 && d < 120; }) || habitatPoint('forest'); }
  if (L.id === 'mother') return habitatPoint('water', p => LAKE && Math.hypot(p.x - LAKE.x, p.z - LAKE.z) < 75) || habitatPoint('water');
  if (L.id === 'scar') return habitatPoint('water', p => !LAKE || Math.hypot(p.x - LAKE.x, p.z - LAKE.z) > 140) || habitatPoint('water');
  const c = pickCrownNear(TEP.x + 40, TEP.z + 140, 170, true);
  return c ? { x: c.x, z: c.z, crown: c } : habitatPoint('forest');
}
function spawnLegend(L) {
  const p = legendLair(L); if (!p) return null;
  if (L.tpl === 'jaguarBlack' && !TPL.jaguarBlack) {
    const o = TPL.jaguar.o;
    TPL.jaguarBlack = buildQuad(Object.assign({}, o, { c: Object.assign({}, o.c, { fur: '#1d1b20', belly: '#2d2a31', nose: '#141216', eye: '#e8b83a', jaw: '#2a282e', snout: '#242228' }), patCol: '#050406' }));
  }
  if (L.tpl === 'caimanBlack') buildCaimanBlack();
  const a = new Animal(L.sp, p.x, p.z, { sex: L.f ? 'f' : 'm', scale: L.scale, tpl: L.tpl });
  Object.assign(a, { legend: L, name: L.name, socialExtra: true, vd: 280, dmgK: 0.8 });
  a.maxHp *= L.hp; a.hp = a.maxHp; a.home.set(p.x, 0, p.z);
  if (L.sp === 'harpy' && p.crown) { a.crown = p.crown; a.pos.set(p.crown.x, p.crown.top + 0.2, p.crown.z); a.state = 'perch'; a.stT = 30; }
  Object.assign(L, { a, lair: p, roarT: 0, enraged: false, rage: false, diveT: 4, coilT: 0 });
  return a;
}
function legendSpawnTick() {
  if (G.mode !== 'play' || !P.a || G.day < 1) return;
  for (const L of LEGENDS) {
    if ((L.a && !L.a.gone) || PROG.flags['legend_' + L.id]) continue;
    if (!spawnLegend(L)) continue;
    if (!LEG.told[L.id]) { LEG.told[L.id] = 1; UI.big('שמועה בג׳ונגל', `${L.name}, ${L.title}, ${L.f ? 'נראתה' : 'נראה'} ${L.where}`); P.pings.push({ x: L.lair.x, z: L.lair.z, t: 45, rival: true }); }
    break;
  }
}
function legendRoar(L, a) {
  L.roarT = 16; AUD.at(L.roar, a.pos, 1); CAM.shake = Math.max(CAM.shake, 0.4);
  combatText(L.sp === 'anaconda' ? 'לחישה מקפיאה!' : L.sp === 'harpy' ? 'צווחה מחרישה!' : 'שאגה מצמררת!', 'bad');
  const p = P.a; if (p && p.alive && dist2(a.pos, p.pos) < 11 && !P.fish) P.stun = Math.max(P.stun, 0.7);
  shQuery(a.pos.x, a.pos.z, 30, b => { if (b !== a && b.alive && !b.isPlayer && b.tpl.kind === 'quad' && !b.isPartner && !b.pet) threatReact(b, a, true); });
}
function legendDown(L) {
  L.done = true; const a = L.a, mine = a.lastHit && a.lastHit.isPlayer;
  PROG.flags['legend_' + L.id] = 1;
  if (mine && G.mode === 'play') {
    UI.big('אגדה הובסה!', `${L.name} ${L.f ? 'הובסה' : 'הובס'}. כל הג׳ונגל ידבר עליך`);
    gainXP(300); P.renown += 3; unlockSkin(L.id); cineStart(a, 2.4); combatText('ניצחון אגדי!', 'crit'); AUD.play('chime'); PROG.flags.legend = 1; saveGame();
  } else if (G.mode === 'play') UI.notify(`${L.name} ${L.f ? 'מתה' : 'מת'}. האגדה נגמרה`);
  LEG.active = null; legendBar(null);
}
function legendBar(L) {
  if (!LEG.bar) { if (!$('hud')) return; const el = document.createElement('div'); el.id = 'boss'; el.innerHTML = '<b></b><span></span><i><em></em></i>'; $('hud').appendChild(el); LEG.bar = el; }
  const el = LEG.bar, tg = $('target');
  if (!L || !L.a || !L.a.alive) { el.classList.remove('on'); if (tg) tg.style.visibility = ''; return; }
  el.classList.add('on'); if (tg) tg.style.visibility = 'hidden';
  el.querySelector('b').textContent = L.name;
  el.querySelector('span').textContent = L.enraged ? `${L.title} · ${L.f ? 'משתוללת' : 'משתולל'}` : L.title;
  el.querySelector('em').style.width = (clamp(L.a.hp / L.a.maxHp, 0, 1) * 100).toFixed(1) + '%';
}
function legendUpdate(dt) {
  if (!MUSIC.g && AUD.ctx) musicInit();
  LEG.t -= dt; if (LEG.t <= 0) { LEG.t = 2; legendSpawnTick(); }
  const p = P.a; let best = null, bd = 1e9;
  for (const L of LEGENDS) {
    const a = L.a; if (!a) continue;
    if (!a.alive || a.gone) { if (!a.alive && !L.done) legendDown(L); continue; }
    if (!p || !p.alive || G.mode !== 'play') continue;
    const d = dist2(a.pos, p.pos);
    if (a.state !== 'fight' && a.state !== 'dive' && Math.hypot(a.pos.x - L.lair.x, a.pos.z - L.lair.z) > 140) a.home.set(L.lair.x, 0, L.lair.z);
    const reach = L.aggro * clamp(P.noise || 1, 0.5, 1.3);
    if (L.sp === 'harpy') {
      L.diveT -= dt;
      if (d < reach && L.diveT <= 0 && a.state !== 'dive' && a.state !== 'carry') { L.diveT = rr(9, 14); a.state = 'dive'; a.target = p; a.stT = 12; combatText(`${L.name} צוללת עליך!`, 'bad'); }
    } else if (d < reach && a.state !== 'fight' && !P.fish && !(P.bird && P.flying)) { a.state = 'fight'; a.foe = p; }
    const k = a.hp / a.maxHp;
    if (!L.rage && k < 0.6) { L.rage = true; legendRoar(L, a); }
    else if (k < 0.6 && (L.roarT -= dt) <= 0 && d < 14 && a.state === 'fight') legendRoar(L, a);
    if (!L.enraged && k < 0.3) { L.enraged = true; combatText(`${L.name} ${L.f ? 'משתוללת' : 'משתולל'}!`, 'bad'); }
    if (L.enraged && a.atkCD > 0.55) a.atkCD = 0.55;
    if (L.sp === 'anaconda' && a.state === 'fight' && a.foe === p && a.anim.atk > 0.35 && d < a.rad + 2.2 && !P.coil && (L.coilT -= dt) <= 0) { L.coilT = 12; startCoil(a); }
    if (d < 55 && d < bd && (a.state === 'fight' || a.state === 'dive' || d < 26)) { bd = d; best = L; }
  }
  LEG.active = best; legendBar(best);
}

// ---------- cinematic post-processing (bloom, ACES, grading, vignette, grain) ----------
const POST = { rt: null, bA: null, bB: null, scene: null, cam: null, quad: null, mat: {}, w: 0, h: 0, fail: false };
const FILTERS = [
  { n: 'טבעי', sat: 1.15, con: 1.1, warm: 0.12, vig: 0.38, mono: 0, bloom: 0.42 },
  { n: 'שקיעה', sat: 1.15, con: 1.1, warm: 1, vig: 0.42, mono: 0, bloom: 0.6 },
  { n: 'נואר', sat: 1, con: 1.28, warm: 0, vig: 0.55, mono: 1, bloom: 0.22 },
  { n: 'עז', sat: 1.38, con: 1.14, warm: 0.2, vig: 0.25, mono: 0, bloom: 0.45 },
  { n: 'חלום', sat: 0.88, con: 0.92, warm: -0.3, vig: 0.32, mono: 0, bloom: 0.85 }
];
const postDefault = () => (SET.q !== 'low' && !PHONE) ? '1' : '0';
const postWanted = () => !POST.fail && ((SET.fx ?? postDefault()) === '1' || PHOTO.on);
function postInit() {
  POST.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1); POST.scene = new THREE.Scene();
  POST.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2)); POST.quad.frustumCulled = false; POST.scene.add(POST.quad);
  const vs = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
  const mk = (u, fs) => new THREE.ShaderMaterial({ uniforms: u, vertexShader: vs, fragmentShader: fs, depthTest: false, depthWrite: false });
  POST.mat.bright = mk({ tSrc: { value: null } }, 'uniform sampler2D tSrc; varying vec2 vUv; void main(){ vec3 c = texture2D(tSrc, vUv).rgb; float l = dot(c, vec3(0.2126, 0.7152, 0.0722)); gl_FragColor = vec4(c * smoothstep(0.55, 1.7, l), 1.0); }');
  POST.mat.blur = mk({ tSrc: { value: null }, uDir: { value: new THREE.Vector2() } }, 'uniform sampler2D tSrc; uniform vec2 uDir; varying vec2 vUv; void main(){ vec3 c = texture2D(tSrc, vUv).rgb * 0.227; c += (texture2D(tSrc, vUv + uDir * 1.385).rgb + texture2D(tSrc, vUv - uDir * 1.385).rgb) * 0.316; c += (texture2D(tSrc, vUv + uDir * 3.231).rgb + texture2D(tSrc, vUv - uDir * 3.231).rgb) * 0.070; gl_FragColor = vec4(c, 1.0); }');
  POST.mat.comp = mk({ tSrc: { value: null }, tBloom: { value: null }, uExp: { value: 1 }, uBloom: { value: 0.35 }, uSat: { value: 1 }, uCon: { value: 1 }, uWarm: { value: 0 }, uVig: { value: 0.3 }, uGrain: { value: 0.02 }, uTime: { value: 0 }, uMono: { value: 0 } }, `
uniform sampler2D tSrc, tBloom; uniform float uExp, uBloom, uSat, uCon, uWarm, uVig, uGrain, uTime, uMono; varying vec2 vUv;
vec3 fitRRT(vec3 v) { vec3 a = v * (v + 0.0245786) - 0.000090537; vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081; return a / b; }
vec3 aces(vec3 c) { const mat3 mi = mat3(vec3(0.59719, 0.07600, 0.02840), vec3(0.35458, 0.90834, 0.13383), vec3(0.04823, 0.01566, 0.83777));
  const mat3 mo = mat3(vec3(1.60475, -0.10208, -0.00327), vec3(-0.53108, 1.10813, -0.07276), vec3(-0.07367, -0.00605, 1.07602));
  c *= uExp / 0.6; return clamp(mo * fitRRT(mi * c), 0.0, 1.0); }
vec3 srgb(vec3 c) { return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
float h12(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main() {
  vec3 c = texture2D(tSrc, vUv).rgb + texture2D(tBloom, vUv).rgb * uBloom;
  c = srgb(aces(c));
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  c = mix(vec3(l), c, uSat * (1.0 - uMono));
  c = (c - 0.5) * uCon + 0.5 + vec3(0.06, 0.02, -0.05) * uWarm;
  vec2 q = vUv - 0.5; c *= 1.0 - uVig * smoothstep(0.12, 0.55, dot(q, q) * 1.6);
  c += (h12(vUv * 997.0 + uTime) - 0.5) * uGrain;
  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}`);
}
function postResize() {
  const v = renderer.getDrawingBufferSize(POST.v || (POST.v = new THREE.Vector2())), w = Math.max(2, v.x | 0), h = Math.max(2, v.y | 0);
  if (w === POST.w && h === POST.h && POST.rt) return;
  for (const k of ['rt', 'bA', 'bB']) if (POST[k]) POST[k].dispose();
  const ms = renderer.capabilities.isWebGL2 ? (SET.q === 'high' ? 4 : 2) : 0;
  POST.rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: ms });
  POST.bA = new THREE.WebGLRenderTarget(Math.max(2, w >> 2), Math.max(2, h >> 2), { type: THREE.HalfFloatType, depthBuffer: false });
  POST.bB = POST.bA.clone(); POST.w = w; POST.h = h;
}
function postPass(mat, target) { POST.quad.material = mat; renderer.setRenderTarget(target); renderer.render(POST.scene, POST.cam); }
function renderFrame() {
  if (!postWanted()) { renderer.render(scene, camera); return; }
  try {
    if (!POST.scene) postInit();
    postResize();
    renderer.setRenderTarget(POST.rt); renderer.render(scene, camera);
    const M = POST.mat, bw = POST.bA.width, bh = POST.bA.height;
    M.bright.uniforms.tSrc.value = POST.rt.texture; postPass(M.bright, POST.bA);
    for (let i = 0; i < 2; i++) {
      M.blur.uniforms.tSrc.value = POST.bA.texture; M.blur.uniforms.uDir.value.set((1 + i) / bw, 0); postPass(M.blur, POST.bB);
      M.blur.uniforms.tSrc.value = POST.bB.texture; M.blur.uniforms.uDir.value.set(0, (1 + i) / bh); postPass(M.blur, POST.bA);
    }
    const f = FILTERS[PHOTO.on ? PHOTO.f : 0], u = M.comp.uniforms;
    u.tSrc.value = POST.rt.texture; u.tBloom.value = POST.bA.texture; u.uExp.value = renderer.toneMappingExposure;
    u.uBloom.value = f.bloom * (1 + (SKY.night || 0) * 0.6); u.uSat.value = f.sat; u.uCon.value = f.con; u.uWarm.value = f.warm; u.uVig.value = f.vig; u.uMono.value = f.mono;
    u.uGrain.value = PHOTO.on ? 0.012 : 0.02; u.uTime.value = (G.t % 50);
    postPass(M.comp, null);
  } catch (e) { POST.fail = true; renderer.setRenderTarget(null); console.warn('post-processing off:', e); renderer.render(scene, camera); }
}

// ---------- photo mode ----------
const PHOTO = { on: false, yaw: 0, pitch: 0.3, dist: 6, f: 0, bar: null, ptr: new Map(), pd: 0 };
function photoLabel() { const b = $('phF'); if (b) b.textContent = `פילטר: ${FILTERS[PHOTO.f].n}`; }
function photoEnter() {
  if (G.mode !== 'play' || !P.a) return;
  Object.assign(PHOTO, { on: true, yaw: CAM.yaw, pitch: clamp(CAM.pitch, -0.2, 1.1), dist: CAM.dist * (P.a.camSize || 1) });
  PHOTO.perks = !$('perks').hidden; $('perks').hidden = true;
  $('pause').hidden = true; $('hud').hidden = true; $('touch').hidden = true;
  if (!PHOTO.bar) {
    const b = document.createElement('div'); b.id = 'photobar';
    b.innerHTML = `<button class="btn" id="phF"></button><button class="btn pri" id="phX">יציאה</button><span>${TOUCH ? 'גרירה מסובבת, צביטה מקרבת' : 'גרירה מסובבת, גלגלת מקרבת'}</span>`;
    document.body.appendChild(b); PHOTO.bar = b;
    b.addEventListener('click', e => { const t = e.target.closest('button'); if (!t) return; if (t.id === 'phX') photoExit(); else { PHOTO.f = (PHOTO.f + 1) % FILTERS.length; photoLabel(); } });
    addEventListener('pointerdown', e => { if (PHOTO.on && !e.target.closest('#photobar')) { PHOTO.ptr.set(e.pointerId, { x: e.clientX, y: e.clientY }); PHOTO.pd = 0; } });
    addEventListener('pointermove', e => {
      if (!PHOTO.on) return; const p = PHOTO.ptr.get(e.pointerId); if (!p) return;
      if (PHOTO.ptr.size === 1) { PHOTO.yaw -= (e.clientX - p.x) * 0.006; PHOTO.pitch = clamp(PHOTO.pitch + (e.clientY - p.y) * 0.005, -0.35, 1.35); }
      p.x = e.clientX; p.y = e.clientY;
      if (PHOTO.ptr.size === 2) { const [a, b2] = [...PHOTO.ptr.values()], d = Math.hypot(a.x - b2.x, a.y - b2.y); if (PHOTO.pd) PHOTO.dist = clamp(PHOTO.dist * PHOTO.pd / d, 1.2, 30); PHOTO.pd = d; }
    });
    const up = e => { PHOTO.ptr.delete(e.pointerId); PHOTO.pd = 0; };
    addEventListener('pointerup', up); addEventListener('pointercancel', up);
    addEventListener('wheel', e => { if (PHOTO.on) PHOTO.dist = clamp(PHOTO.dist * (1 + e.deltaY * 0.001), 1.2, 30); }, { passive: true });
  }
  PHOTO.bar.hidden = false; photoLabel();
}
function photoExit() {
  PHOTO.on = false; PHOTO.ptr.clear(); if (PHOTO.bar) PHOTO.bar.hidden = true;
  $('hud').hidden = false; if (TOUCH) $('touch').hidden = false; PERF.paused = false;
  if (PHOTO.perks) $('perks').hidden = false; else $('pause').hidden = false;
}
function photoUpdate() {
  const a = P.a; if (!a) { photoExit(); return; }
  const tx = a.pos.x, ty = a.pos.y + (a.camH || 1) * 0.75, tz = a.pos.z, cp = Math.cos(PHOTO.pitch), d = PHOTO.dist;
  const cx = tx - Math.sin(PHOTO.yaw) * cp * d, cz = tz - Math.cos(PHOTO.yaw) * cp * d;
  const cy = Math.max(ty + Math.sin(PHOTO.pitch) * d, getH(cx, cz) + 0.25);
  camera.position.set(cx, cy, cz); camera.lookAt(tx, ty, tz);
}
function syncExtraSegs() {
  for (const [id, key, def] of [['fxSeg', 'fx', postDefault()], ['musSeg', 'mus', '1']]) {
    const el = $(id); if (!el) continue; const v = SET[key] ?? def;
    for (const b of el.querySelectorAll('button')) b.setAttribute('aria-pressed', b.dataset.v === v ? 'true' : 'false');
  }
}

// ---------- dynamic music: calm while exploring, tense near danger, drums in a fight, a drone for legends ----------
const MUSIC = { g: null, padF: null, noise: null, timer: null, nextT: 0, step: 0, int: 0, th: false, thT: 0 };
function musicInit() {
  const c = AUD.ctx; if (!c || MUSIC.g) return;
  MUSIC.g = c.createGain(); MUSIC.g.gain.value = 0; MUSIC.g.connect(AUD.master);
  MUSIC.padF = c.createBiquadFilter(); MUSIC.padF.type = 'lowpass'; MUSIC.padF.frequency.value = 900; MUSIC.padF.connect(MUSIC.g);
  const n = c.createBuffer(1, c.sampleRate * 0.2, c.sampleRate), d = n.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; MUSIC.noise = n;
  MUSIC.timer = setInterval(musicTick, 120);
}
function musicLevel() {
  if (G.mode !== 'play' || !P.a || !P.a.alive) return 0;
  if (LEG.active && LEG.active.a && (LEG.active.a.state === 'fight' || LEG.active.a.state === 'dive')) return 3;
  if (P.warnFrom || P.coil || HUNT.net || COMBAT.roll) return 2;
  let f = false; shQuery(P.a.pos.x, P.a.pos.z, 20, b => { if (b.alive && b.state === 'fight' && b.foe === P.a) f = true; });
  if (f) return 2;
  MUSIC.thT -= 0.12; if (MUSIC.thT <= 0) { MUSIC.thT = 1; MUSIC.th = !!threatsNear(32); }
  return MUSIC.th ? 1 : 0;
}
function mTone(type, f, t, dur, vol, dest, att, det) {
  const c = AUD.ctx, o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (det) o.detune.value = det;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + att); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(dest || MUSIC.g); o.start(t); o.stop(t + dur + 0.05);
}
function mDrum(t, f, vol) {
  const c = AUD.ctx, o = c.createOscillator(), g = c.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(f * 1.8, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.12);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45); o.connect(g); g.connect(MUSIC.g); o.start(t); o.stop(t + 0.5);
}
function mShaker(t, vol) {
  const c = AUD.ctx, s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter();
  s.buffer = MUSIC.noise; f.type = 'highpass'; f.frequency.value = 6000; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
  s.connect(f); f.connect(g); g.connect(MUSIC.g); s.start(t); s.stop(t + 0.1);
}
function mDrone(t, f, dur, vol) {
  const c = AUD.ctx, o = c.createOscillator(), fl = c.createBiquadFilter(), g = c.createGain();
  o.type = 'sawtooth'; o.frequency.value = f; fl.type = 'lowpass'; fl.frequency.value = 240;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.8); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(fl); fl.connect(g); g.connect(MUSIC.g); o.start(t); o.stop(t + dur + 0.1);
}
function musicBeat(t, s) {
  const k = MUSIC.int, bar = Math.floor(s / 16) % 4, root = 110 * Math.pow(2, [0, -4, 3, -2][bar] / 12), third = bar === 0 ? 1.189 : 1.26, beat = 60 / (70 + k * 22);
  if (s % 16 === 0) { for (const m of [1, third, 1.5]) mTone('triangle', root * m, t, beat * 8.6, 0.05 * (1 - Math.min(0.5, k * 0.15)), MUSIC.padF, beat * 2.5, rr(-6, 6)); if (k > 2.4) mDrone(t, root / 2, beat * 8.6, 0.1); }
  const pent = [0, 3, 5, 7, 10];
  if (s % 2 === 0 && Math.random() < 0.3 - k * 0.05) { const f = root * 2 * Math.pow(2, pent[Math.floor(Math.random() * 5)] / 12); mTone('sine', f, t, 1.2, 0.045, null, 0.005); mTone('sine', f * 3.01, t, 0.25, 0.01, null, 0.003); }
  if (k > 0.55 && s % 4 === 0) mDrum(t, s % 16 === 0 ? 62 : 92, 0.15 * Math.min(1, k - 0.4));
  if (k > 1.5 && s % 2 === 1) mDrum(t, 140, 0.06 * (k - 1.4));
  if (k > 0.3 && s % 2 === 1) mShaker(t, 0.012 + 0.012 * k);
}
function musicTick() {
  const c = AUD.ctx; if (!c || !MUSIC.g) return;
  const want = (SET.mus ?? '1') === '1' && (G.mode === 'play' || G.mode === 'menu' || G.mode === 'dead') && !document.hidden && !G.paused;
  MUSIC.g.gain.setTargetAtTime(want ? 0.5 : 0, c.currentTime, 0.8);
  if (!want) return;
  MUSIC.int += (musicLevel() - MUSIC.int) * 0.08;
  const now = c.currentTime;
  if (MUSIC.nextT < now - 0.5) MUSIC.nextT = now + 0.05;
  const half = 30 / (70 + MUSIC.int * 22);
  while (MUSIC.nextT < now + 0.3) { musicBeat(MUSIC.nextT, MUSIC.step++); MUSIC.nextT += half; }
}

// ================= SPEARS YOU CAN FOLLOW, AND BIRDS THAT GROUND HUNTERS CAN'T CATCH =================
const SPFX = { glow: null, beam: null, beamGeo: null, live: new Set() };
MARKC.mine = '#ffd34d';
function spGlowTex() {
  if (SPFX.glow) return SPFX.glow;
  const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 30);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,255,255,.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return (SPFX.glow = new THREE.CanvasTexture(cv));
}
function spBeamTex() {
  if (SPFX.beam) return SPFX.beam;
  const cv = document.createElement('canvas'); cv.width = 4; cv.height = 64; const g = cv.getContext('2d'), gr = g.createLinearGradient(0, 64, 0, 0);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 4, 64); return (SPFX.beam = new THREE.CanvasTexture(cv));
}
// a glowing streak behind every spear or net in flight, visible through the leaves
function spearTrail(s) {
  if (!s.trail) {
    if (camera.position.distanceTo(s.pos) > 90) return;
    const col = s.from && s.from.isPlayer ? 0xffd34d : s.kind === 'net' ? 0xfff0b0 : 0xfff3e0;
    s.trail = []; s.hist = [];
    for (let i = 0; i < 6; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: spGlowTex(), color: col, transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false }));
      sp.renderOrder = 998; scene.add(sp); s.trail.push(sp);
    }
  }
  s.hist.unshift(s.pos.clone()); if (s.hist.length > 12) s.hist.pop();
  s.trail.forEach((sp, i) => {
    sp.position.copy(s.hist[Math.min(s.hist.length - 1, i * 2)]);
    const k = 1 - i / s.trail.length; sp.material.opacity = 0.9 * k; sp.scale.setScalar((0.6 - i * 0.07) * (s.kind === 'net' ? 1.7 : 1));
  });
}
function dropTrail(s) { if (s.trail) { for (const sp of s.trail) { scene.remove(sp); sp.material.dispose(); } s.trail = null; s.hist = null; } }
// a light beam and a ring over every spear of yours stuck in the ground, so you can find it again
function spearBeacon(s) {
  if (!s.beacon) {
    if (!SPFX.beamGeo) { SPFX.beamGeo = new THREE.CylinderGeometry(0.09, 0.18, 4.5, 10, 1, true); SPFX.beamGeo.translate(0, 2.25, 0); }
    const m = new THREE.Mesh(SPFX.beamGeo, new THREE.MeshBasicMaterial({ map: spBeamTex(), color: 0xffd34d, transparent: true, opacity: 0.8, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false, toneMapped: false }));
    m.renderOrder = 997; scene.add(m); s.beacon = m;
    const r = makeMarker(); for (const c of r.children) c.material.color.set('#ffd34d'); r.scale.setScalar(0.6); scene.add(r); s.ring = r;
  }
  const w = waterAt(s.pos.x, s.pos.z), g = Math.max(getH(s.pos.x, s.pos.z), w > -900 ? w : -99), near = P.a ? Math.hypot(P.a.pos.x - s.pos.x, P.a.pos.z - s.pos.z) : 99;
  s.beacon.position.set(s.pos.x, g, s.pos.z); s.beacon.material.opacity = (0.5 + 0.3 * Math.sin(G.t * 4 + s.pos.x)) * clamp((near - 1.5) / 4, 0.25, 1);
  s.ring.position.set(s.pos.x, g + 0.05, s.pos.z); s.ring.rotation.y += 0.02;
}
function dropBeacon(s) {
  if (s.beacon) { scene.remove(s.beacon); s.beacon.material.dispose(); s.beacon = null; }
  if (s.ring) { scene.remove(s.ring); for (const c of s.ring.children) c.material.dispose(); s.ring = null; }
}
function spearFxUpdate() {
  for (const s of HUNT.spears) {
    SPFX.live.add(s);
    if (s.stuck > 0) { dropTrail(s); if (s.from && s.from.isPlayer && s.kind === 'spear' && G.mode === 'play') spearBeacon(s); }
    else spearTrail(s);
  }
  for (const s of SPFX.live) if (!HUNT.spears.includes(s)) { dropTrail(s); dropBeacon(s); SPFX.live.delete(s); }
}
// follow the throw arc to the ground, so the landing marker shows the real spot
function predictLanding(x, y, z, vx, vy, vz) {
  for (let i = 0; i < 250; i++) {
    vy -= 9.8 * 0.02; x += vx * 0.02; y += vy * 0.02; z += vz * 0.02;
    const w = waterAt(x, z); if (y <= Math.max(getH(x, z), w > -900 ? w : -99)) break;
  }
  return { x, z };
}
// ground animals rarely catch a bird: it sees them coming and takes off
function birdEvade(t, src) {
  if (t.isPlayer) {
    PROG.flags.evade = 1;
    if (!P.flying) { const dx = t.pos.x - src.pos.x, dz = t.pos.z - src.pos.z, d = Math.hypot(dx, dz) || 1; birdTakeOff(dx / d, dz / d, 1); }
    P.vy = Math.max(P.vy || 0, 5); combatText('התחמקת לאוויר!', 'good'); AUD.play('flap', 0.7);
  } else {
    t.scared = 4;
    if (t.group && t.group.kind === 'flock') flockFlush(t.group);
    else if (t.sp.ai === 'perch' && t.state !== 'fly') {
      const c = pickCrownNear(t.pos.x, t.pos.z, 70, false);
      if (c) { t.crown = c; t.offX = rr(-2, 2); t.offZ = rr(-2, 2); t.goal3 = new V3(c.x + t.offX, c.top - 0.3, c.z + t.offZ); t.state = 'fly'; }
    }
  }
  if (t.dCam < 40) FX.spawn('dust', t.pos.x, t.pos.y + 0.3, t.pos.z, 4);
}

// ================= A LIVING WORLD: lightning storms, king vultures, companion commands, legendary skins =================
// ---------- lightning storms ----------
const STORM = { bolts: [], gust: 0, gustT: 0, mat: null };
function boltGeo(pts, w) {
  const pos = [], cam = camera.position;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1], dir = _t2.copy(b).sub(a).normalize(), view = _tmp.copy(cam).sub(a).normalize();
    const side = new V3().crossVectors(dir, view).normalize().multiplyScalar(w * (1 - i / pts.length * 0.6));
    const a1 = a.clone().add(side), a2 = a.clone().sub(side), b1 = b.clone().add(side), b2 = b.clone().sub(side);
    pos.push(a1.x, a1.y, a1.z, a2.x, a2.y, a2.z, b1.x, b1.y, b1.z, a2.x, a2.y, a2.z, b2.x, b2.y, b2.z, b1.x, b1.y, b1.z);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); return g;
}
function boltPath(x0, y0, z0, x1, y1, z1, n, jit) {
  const pts = [new V3(x0, y0, z0)];
  for (let i = 1; i < n; i++) { const k = i / n; pts.push(new V3(lerp(x0, x1, k) + rr(-jit, jit), lerp(y0, y1, k) + rr(-jit, jit) * 0.3, lerp(z0, z1, k) + rr(-jit, jit))); }
  pts.push(new V3(x1, y1, z1)); return pts;
}
function lightning(force) {
  const base = P.a ? P.a.pos : G.preview ? G.preview.pos : camera.position;
  const close = force === 'close' || (force !== 'far' && G.mode === 'play' && rng() < 0.07);
  const fw = camera.getWorldDirection(new V3()), ang = !close && rng() < 0.7 ? Math.atan2(fw.z, fw.x) + rr(-0.9, 0.9) : rng() * TAU, d = close ? rr(14, 34) : rr(130, 420), x = base.x + Math.cos(ang) * d, z = base.z + Math.sin(ang) * d, gy = getH(x, z);
  if (!STORM.mat) STORM.mat = new THREE.MeshBasicMaterial({ color: 0xe8efff, transparent: true, opacity: 1, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false, toneMapped: false });
  const top = gy + rr(120, 170), main = boltPath(x + rr(-30, 30), top, z + rr(-30, 30), x, gy, z, 14, 9);
  const g = new THREE.Group(); g.add(new THREE.Mesh(boltGeo(main, close ? 0.9 : 1.6), STORM.mat.clone()));
  for (let k = 0; k < 2; k++) { const s = main[4 + k * 4], e = s.clone().add(new V3(rr(-30, 30), -rr(25, 45), rr(-30, 30))); g.add(new THREE.Mesh(boltGeo(boltPath(s.x, s.y, s.z, e.x, e.y, e.z, 6, 6), close ? 0.45 : 0.8), STORM.mat.clone())); }
  scene.add(g); STORM.bolts.push({ g, t: 0 });
  G.flash = close ? 1.7 : 0.9;
  setTimeout(() => AUD.play('thunder', close ? 1.3 : 0.75), Math.max(150, d / 343 * 1000));
  if (close && G.mode === 'play') {
    CAM.shake = Math.max(CAM.shake, 0.55); combatText('ברק פגע ממש קרוב!', 'bad');
    shQuery(x, z, 35, b => { if (b.alive && !b.isPlayer && b.tpl.kind === 'quad' && !b.isPartner && !b.pet && !b.legend && !b.cub) threatReact(b, P.a || b, true); });
  }
}
function stormUpdate(dt) {
  for (let i = STORM.bolts.length - 1; i >= 0; i--) {
    const b = STORM.bolts[i]; b.t += dt;
    const op = b.t < 0.06 ? 1 : b.t < 0.12 ? 0.25 : b.t < 0.2 ? 0.9 : Math.max(0, 1 - (b.t - 0.2) / 0.25);
    b.g.children.forEach(m => { m.material.opacity = op; });
    if (b.t > 0.45) { scene.remove(b.g); b.g.children.forEach(m => { m.geometry.dispose(); m.material.dispose(); }); STORM.bolts.splice(i, 1); }
  }
  STORM.gustT -= dt; if (STORM.gustT <= 0) { STORM.gustT = rr(2, 7); STORM.gust = rng() < 0.5 ? rr(0.5, 1.6) * G.rain : 0; }
  const w = VEG.uni.uWind; w.value += (1 + G.rain * 1.5 + STORM.gust - w.value) * Math.min(1, dt * 0.8);
}

// ---------- king vultures: they circle over carcasses, so you can spot a kill from far away ----------
SPECIES.vulture = { he: 'נשר המלך', lat: 'Sarcoramphus papa', kind: 'bird', ai: 'vulture', hp: 26, fly: 11, walk: 0.6, food: 9, count: 0, group: [1, 1], hab: 'air', size: [0.95, 1.08], danger: 0, diet: 'נבלות',
  guide: 'עוף אוכל נבלות עם ראש צבעוני ומוטת כנפיים ענקית. הוא דואה גבוה ומזהה פגרים ממרחק. כשכמה נשרים חגים במעגל נמוך, כמעט תמיד יש שם טרף מת.' };
if (!GUIDE_ORDER.includes('vulture')) GUIDE_ORDER.push('vulture');
function spawnVultures() {
  if (!TPL.vulture) TPL.vulture = buildBird({ r: 0.17, len: 0.72, headR: 0.075, span: 1.75, chord: 0.5, tailLen: 0.26, tailW: 0.26, tailTaper: 0.3, beak: 'hook', beakLen: 0.07, crest: false,
    c: { body: '#ece4d4', belly: '#efe8da', band: '#1c1c20', head: '#e3632c', face: '#b53a7e', beak: '#f0a43a', legs: '#8c8c8c', wing: '#1f1f24', tail: '#1c1c20', crest: '#e3632c', eye: '#f2e9d8' } });
  const n = Math.round(7 * QUAL[SET.q].fauna / 1.5);
  for (let i = 0; i < n; i++) {
    const x = rr(-WR * 0.75, WR * 0.75), z = rr(-WR * 0.75, WR * 0.75), v = new Animal('vulture', x, z, {});
    v.pos.y = Math.max(getH(x, z), 10) + rr(55, 85); v.ownY = true; v.vd = 320; v.state = 'soar'; v.circC = new V3(x, 0, z); v.circY = v.pos.y; v.circA = rng() * TAU;
  }
}
function findCarrion(a) {
  let best = null, bd = 1e9;
  for (const b of ANIMALS) {
    if (b.alive || b.gone || b.carriedBy || b.food < 4 || b.tpl.kind === 'fish' || (b.deadT || 0) < 8 || waterDepth(b.pos.x, b.pos.z) > 0.3) continue;
    const d = Math.hypot(b.pos.x - a.pos.x, b.pos.z - a.pos.z); if (d < 460 && d < bd) { bd = d; best = b; }
  }
  return best;
}
function carrionGuarded(c, a, r) {
  let t = false;
  shQuery(c.pos.x, c.pos.z, r, b => { if (!t && b.alive && b !== a && b.spId !== 'vulture' && (b.isPlayer || b.tpl.kind === 'quad' || b.tpl.kind === 'human')) t = true; });
  return t;
}
function vultureSoar(a) { a.state = 'soar'; a.carc = null; a.circC = new V3(a.pos.x, 0, a.pos.z); a.circY = Math.max(getH(a.pos.x, a.pos.z), 10) + rr(55, 85); }
BRAIN.vulture = function (a, dt) {
  a.stT -= dt; a.think = (a.think || 0) - dt;
  const c = a.carc && !a.carc.alive && !a.carc.gone && a.carc.food > 1.5 ? a.carc : null;
  if (!c && a.state !== 'soar') vultureSoar(a);
  if (a.scared > 0 && a.state === 'eat') vultureSoar(a);
  a.glide = 1;
  if (a.state === 'soar') {
    a.circA += dt * 0.12;
    _tmp.set(a.circC.x + Math.cos(a.circA) * 70, a.circY, a.circC.z + Math.sin(a.circA) * 70);
    flyToward(a, _tmp, 11, dt, 1.2); a.pose = 'fly';
    if (a.think <= 0) {
      a.think = rr(2, 3.5); const k = findCarrion(a);
      if (k) { a.carc = k; a.state = 'circle'; a.stT = rr(14, 26); }
      else if (rng() < 0.06) a.circC.set(clamp(a.circC.x + rr(-140, 140), -WR, WR), 0, clamp(a.circC.z + rr(-140, 140), -WR, WR));
    }
    return;
  }
  if (a.state === 'circle') {
    a.circA += dt * 0.55;
    const r = 8 + (a.id % 3) * 3;
    _tmp.set(c.pos.x + Math.cos(a.circA + a.id) * r, getH(c.pos.x, c.pos.z) + 16 + (a.id % 4) * 3, c.pos.z + Math.sin(a.circA + a.id) * r);
    flyToward(a, _tmp, 10, dt, 2); a.pose = 'fly';
    if (a.stT <= 0 && a.think <= 0) { a.think = 1; if (!carrionGuarded(c, a, 10)) a.state = 'land'; }
    return;
  }
  if (a.state === 'land') {
    const ang = a.id * 1.7, x = c.pos.x + Math.cos(ang) * 1.6, z = c.pos.z + Math.sin(ang) * 1.6;
    _tmp.set(x, getH(x, z), z);
    const d = flyToward(a, _tmp, 7, dt, 3); a.pose = 'fly';
    if (d < 0.6) { a.state = 'eat'; a.pos.copy(_tmp); a.vel.set(0, 0, 0); a.stT = rr(20, 45); }
    return;
  }
  a.pose = 'ground'; a.glide = 0; a.vel.set(0, 0, 0); a.vy = 0; a.bank = 0; a.speed = 0; a.pos.y = getH(a.pos.x, a.pos.z);
  a.yaw += angDiff(a.yaw, Math.atan2(c.pos.x - a.pos.x, c.pos.z - a.pos.z)) * Math.min(1, dt * 3);
  c.food -= dt * 0.22;
  if (a.think <= 0) { a.think = 0.5; if (carrionGuarded(c, a, 7)) { vultureSoar(a); a.pos.y += 0.5; return; } }
  if (a.stT <= 0 || c.food <= 1.5) vultureSoar(a);
};

// ---------- commands for your companions (land mates, grown cubs and tamed animals) ----------
function companions() {
  const a = P.a; if (!a) return [];
  return [...aliveMates(), ...P.cubs.filter(c => c.alive && (c.age || 0) > 30), ...(P.human && a.pets ? a.pets.filter(b => b.alive) : [])]
    .filter(b => b.tpl.kind === 'quad' || b.tpl.kind === 'human');
}
function cmdAttack() {
  const t = P.target;
  if (!t || !t.alive || t.isPartner || t.cub || t.pet === P.a || (t.hunter && P.human)) return false;
  const team = companions(); if (!team.length) return false;
  for (const b of team) { b.stay = null; b.state = 'fight'; b.foe = t; }
  combatText(team.length > 1 ? 'תקפו!' : 'תקוף!', 'good'); AUD.play(P.sp.call || 'growl', 0.6); PROG.flags.command = 1;
  return true;
}
function cmdStay() {
  const team = companions();
  if (!team.length) { UI.notify('עוד אין לך מלווים שאפשר לתת להם פקודה'); return; }
  const staying = team.some(b => b.stay);
  for (const b of team) { b.stay = staying ? null : b.pos.clone(); b.state = 'follow'; b.foe = null; }
  UI.notify(staying ? 'המלווים שלך באים אחריך' : 'המלווים שלך מחכים כאן', 'good'); PROG.flags.command = 1;
}
function companionCmd() { if (!cmdAttack()) cmdStay(); }
function stayStep(a, dt) {
  const s = a.stay, dx = s.x - a.pos.x, dz = s.z - a.pos.z, d = Math.hypot(dx, dz);
  if (d > 2.5) { a.move(dx / d, dz / d, (a.sp.walk || 1.5) * 1.3, dt); a.pose = a.swimming ? 'swim' : 'move'; }
  else { a.move(0, 0, 0, dt); a.pose = a.young ? 'sit' : 'lie'; }
  return true;
}
addEventListener('keydown', e => {
  if (G.mode !== 'play' || G.paused || e.repeat || (typeof PROG !== 'undefined' && PROG.choosing)) return;
  if (e.code === 'KeyT') { if (!cmdAttack()) UI.notify('צריך לבחור מטרה קודם: להסתכל על חיה'); }
  else if (e.code === 'KeyY') cmdStay();
});

// ---------- legendary skins: beat a legend, unlock a new look ----------
const SKINS = {
  jaguar: { black: { n: 'שחור', by: 'shadow', tpl: 'jaguarBlack' } },
  harpy: { white: { n: 'לבן', by: 'queen', tpl: 'harpyWhite' } },
  caiman: { emerald: { n: 'ברקת', by: 'mother', tpl: 'caimanEmerald' } }
};
function unlocks() { try { return JSON.parse(localStorage.getItem('amazonia-unlocks') || '{}'); } catch (e) { return {}; } }
function unlockSkin(lid) {
  const u = unlocks(); if (u[lid]) return; u[lid] = 1;
  try { localStorage.setItem('amazonia-unlocks', JSON.stringify(u)); } catch (e) { }
  for (const sp in SKINS) for (const k in SKINS[sp]) if (SKINS[sp][k].by === lid) setTimeout(() => UI.big('מראה חדש נפתח!', `${SPECIES[sp].he} ${SKINS[sp][k].n}. אפשר לבחור אותו בתפריט`), 4500);
}
function ensureSkinTpl(t) {
  if (TPL[t]) return;
  if (t === 'caimanBlack') { buildCaimanBlack(); return; }
  if (t === 'jaguarBlack') { const o = TPL.jaguar.o; TPL.jaguarBlack = buildQuad(Object.assign({}, o, { c: Object.assign({}, o.c, { fur: '#1d1b20', belly: '#2d2a31', nose: '#141216', eye: '#e8b83a', jaw: '#2a282e', snout: '#242228' }), patCol: '#050406' })); }
  else if (t === 'caimanEmerald') { const o = TPL.caiman.o; TPL.caimanEmerald = buildQuad(Object.assign({}, o, { c: Object.assign({}, o.c, { fur: '#2e6b43', top: '#2e6b43', belly: '#d6cf8f', eye: '#e8c23a' }) })); }
  else if (t === 'harpyWhite') TPL.harpyWhite = buildBird({ r: 0.2, len: 0.78, headR: 0.11, span: 1.9, chord: 0.46, tailLen: 0.38, tailW: 0.3, tailTaper: 0.2, beak: 'hook', beakLen: 0.09, crest: true,
    c: { body: '#e9e6df', belly: '#f6f4ee', band: '#bdb8ae', head: '#f2f0ea', face: '#dcd8cf', beak: '#2a2a2a', legs: '#e3be44', wing: '#d9d5cc', tail: '#cfcac0', crest: '#bfb9ad', eye: '#3a2410' } });
}
function skinTpl(id) {
  const k = (SET.skins || {})[id], s = k && SKINS[id] && SKINS[id][k];
  if (!s || !unlocks()[s.by]) return undefined;
  ensureSkinTpl(s.tpl); return s.tpl;
}
function syncSkins() {
  let row = document.getElementById('skinRow');
  if (!row) {
    const sx = document.getElementById('sexSeg'); if (!sx) return;
    sx.parentElement.insertAdjacentHTML('afterend', '<div class="optrow" id="skinRow" hidden><span>מראה</span><div class="seg" id="skinSeg"></div></div>');
    row = document.getElementById('skinRow');
    document.getElementById('skinSeg').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      SET.skins = Object.assign({}, SET.skins, { [SET.sp]: b.dataset.v }); saveSet(); syncSkins(); menuPreview();
    });
  }
  const u = unlocks(), avail = Object.entries(SKINS[SET.sp] || {}).filter(([, s]) => u[s.by]);
  row.hidden = !avail.length; if (!avail.length) return;
  const cur = (SET.skins || {})[SET.sp] || 'base';
  document.getElementById('skinSeg').innerHTML = [['base', 'רגיל'], ...avail.map(([k, s]) => [k, s.n])].map(([v, n]) => `<button data-v="${v}"${v === cur ? ' class="on"' : ''}>${n}</button>`).join('');
}
function worldUpdate(dt) { stormUpdate(dt); }

// ================= LEGACY & AWARENESS: dynasties, alarm calls, kill cam =================
// ---------- dynasty: when you fall, continue as one of your grown offspring ----------
const LEGACY = { heirs: [] };
function legacyReset() { LEGACY.heirs = []; PROG.gen = 1; }
function noteHeir(c) {
  tribeAdult(c);
  if (!LEGACY.heirs.includes(c)) LEGACY.heirs.push(c);
  if (!P.human) UI.notify(heb(c, `${c.name} יוכל להמשיך את השושלת שלך`, `${c.name} תוכל להמשיך את השושלת שלך`), 'love');
}
function heirCandidates() {
  const out = LEGACY.heirs.filter(b => b.alive && !b.gone && b.spId === P.spId);
  for (const c of P.cubs) if (c.alive && !c.gone && (c.age || 0) >= 20) out.push(c);
  return out;
}
function heirButton() {
  const b = document.getElementById('heirBtn'); if (!b) return;
  if (!b.dataset.wired) { b.dataset.wired = '1'; b.addEventListener('click', continueAsHeir); }
  const h = heirCandidates()[0];
  b.hidden = !h; if (h) b.textContent = `להמשיך את השושלת בתור ${h.name}`;
}
function continueAsHeir() {
  const h = heirCandidates()[0]; if (!h) return;
  const gen = (PROG.gen || 1) + 1, name = h.name, sex = h.sex, slot = PROG.slot;
  const others = P.cubs.filter(c => c !== h && c.alive && !c.gone);
  const d = {
    v: 1, at: Date.now(), sp: P.spId, sex, pos: [h.pos.x, h.pos.y, h.pos.z], yaw: h.yaw, hp: 1, food: 75, water: 75, stam: 100, air: 100,
    time: G.time, day: G.day, kills: 0, renown: Math.floor(P.renown * 0.6), raised: 0, disc: [...P.discovered],
    xp: PROG.xp, lvl: PROG.lvl, perks: PROG.perks.slice(), done: PROG.done.slice(), flags: Object.assign({}, PROG.flags),
    bondH: 0, litter: false, spears: 0, flying: false, mates: [], pets: [], gen, inv: P.human ? Object.assign({}, P.inv) : null, ownCamp: P.human && CAMPH.camp && CAMPH.camp.own ? [CAMPH.camp.x, CAMPH.camp.z] : null, store: CAMPH.store ? Object.assign({}, CAMPH.store) : null, arrows: P.arrows ?? 0, vx: P.human ? vxSave() : null, campUp: P.human ? Object.assign({}, CAMPH.up) : {}, tribe: P.human ? tribeSave().filter(x => x.n !== h.name).concat(aliveMates().map(m => ({ n: m.name, s: m.sex, r: 'follow' }))) : [],
    cubs: others.map(c => ({ n: c.name, s: c.sex, age: c.age || 0, h: c.cubHunger || 0 }))
  };
  h.remove(); $('death').hidden = true;
  SET.sex = sex; saveSet();
  startGame(false, d); PROG.slot = slot; PROG.gen = gen;
  UI.big(`הדור ה-${gen}`, heb(h, `${name} ממשיך את השושלת`, `${name} ממשיכה את השושלת`));
  AUD.play('chime'); saveGame();
}

// ---------- alarm calls: monkeys and birds scream when they spot a predator ----------
const ALARM = { t: 0 };
const SENTRY = { howler: 'howler', squirrel: 'screech', macaw: 'macaw', toucan: 'toucan', peccary: 'clack' };
const SENTRYN = { howler: 'הקופים המיללים', squirrel: 'קופי הסנאי', macaw: 'הארות', toucan: 'הטוקנים', peccary: 'הפקארים' };
function alarmThreat(b) {
  if (!b.alive || b.cub || b.pet || b.young) return false;
  if (b.isPlayer) return P.isPred && !P.fish;
  return b.sp.ai === 'pred' || b.sp.ai === 'croc' || b.sp.ai === 'raptor' || !!b.hunter || !!b.legend;
}
function alarmUpdate(dt) {
  ALARM.t -= dt; if (ALARM.t > 0 || G.mode !== 'play') return; ALARM.t = 1.2;
  const p = P.a;
  for (const g of GROUPS) {
    if (!g.members || !g.members.length) continue;
    const m0 = g.members[0], call = SENTRY[m0.spId]; if (!call) continue;
    g.alarmT = (g.alarmT || 0) - 1.2; if (g.alarmT > 0) continue;
    if (!p || Math.hypot(m0.pos.x - p.pos.x, m0.pos.z - p.pos.z) > 160) continue;
    let th = null, td = 1e9;
    shQuery(m0.pos.x, m0.pos.z, 30, (b, d) => {
      if (g.members.includes(b) || !alarmThreat(b)) return;
      const det = 24 * (b.isPlayer ? clamp(P.noise, 0.3, 1.4) : 1);
      if (d < det && d < td) { td = d; th = b; }
    });
    if (th) raiseAlarm(g, m0, th, call);
  }
}
function raiseAlarm(g, m0, th, call) {
  g.alarmT = 25;
  AUD.at(call, m0.pos, 1.2); setTimeout(() => AUD.at(call, m0.pos, 1), 380);
  let fled = 0;
  shQuery(m0.pos.x, m0.pos.z, 45, b => {
    if (b.alive && !b.isPlayer && b !== th && b.tpl.kind === 'quad' && preys(th, b) && !b.isPartner && !b.cub && !b.pet && b.state !== 'fight') { threatReact(b, th, true); fled++; }
  });
  if (g.kind === 'flock' && g.state !== 'fly') flockFlush(g);
  const p = P.a; if (!p || !p.alive) return;
  const d = Math.hypot(m0.pos.x - p.pos.x, m0.pos.z - p.pos.z), who = SENTRYN[m0.spId] || m0.sp.he;
  if (th === p) {
    if (d < 80) { combatText('אזעקה! הבחינו בך', 'bad'); UI.notify(`${who} צועקים אזעקה. ${fled ? 'הטרף בסביבה בורח' : 'כל הטרף בסביבה מוזהר'}. כדאי להתגנב לאט יותר`, 'bad'); }
  } else if (d < 90) {
    const danger = preys(th, p) || (th.hunter && !P.human);
    if (danger) PROG.flags.alarm = 1;
    UI.notify(`אזעקה של ${who}: ${th.hunter ? 'צייד' : th.sp.he} בסביבה!`, danger ? 'bad' : '');
    if (danger) P.pings.push({ x: th.pos.x, z: th.pos.z, t: 8 });
  }
}

// ---------- kill cam: a slow-motion orbit around a decisive blow ----------
const CINE = { t: 0, dur: 0, tgt: null, h: 1, ang: 0 };
function cineStart(t, dur) {
  if (!t || G.mode !== 'play' || (typeof PHOTO !== 'undefined' && PHOTO.on)) return;
  Object.assign(CINE, { t: dur, dur, tgt: t.pos.clone(), h: t.height || 1, ang: CAM.yaw + 0.9 });
  COMBAT.slowT = Math.max(COMBAT.slowT, dur * 0.6);
}
function cineUpdate(dt) {
  if (CINE.t <= 0) return;
  CINE.t -= dt;
  const k = 1 - CINE.t / CINE.dur, ang = CINE.ang + k * 1.4, r = 3.2 + CINE.h * 1.5;
  const x = CINE.tgt.x + Math.sin(ang) * r, z = CINE.tgt.z + Math.cos(ang) * r, y = Math.max(getH(x, z) + 0.5, CINE.tgt.y + CINE.h * 0.9 + 0.6);
  camera.position.set(x, y, z); camera.lookAt(CINE.tgt.x, CINE.tgt.y + CINE.h * 0.5, CINE.tgt.z);
}

// ================= HUD MODES: keep the jungle visible =================
// compact (phone default): notifications become short toasts at the top, missions and family only peek in when they change
// clean: only health bars, minimap, target and warnings  ·  full: every panel, as before
const HUD = { mode: 'full', sigG: '', sigF: '', flashG: 0, flashF: 0 };
const HUDN = { compact: 'מצומצמת', min: 'נקייה', full: 'מלאה' };
(function () {
  const st = document.createElement('style');
  st.textContent = `
body.hud-compact #goals:not(.peek),body.hud-compact #family:not(.peek),body.hud-min #goals,body.hud-min #family,body.hud-min #cmp{display:none!important}
body.hud-compact #goals.peek li{display:list-item!important}
body.hud-compact #feed,body.hud-min #feed{position:fixed;top:calc(env(safe-area-inset-top,0px) + 66px);left:50%;transform:translateX(-50%);width:min(48vw,440px);z-index:13;display:flex;flex-direction:column;align-items:center;gap:0;pointer-events:none}
body:not(.touch).hud-compact #feed,body:not(.touch).hud-min #feed{top:calc(env(safe-area-inset-top,0px) + 96px)}
body.hud-compact #feed div,body.hud-min #feed div{font-size:12px;padding:5px 12px;text-align:center;line-height:1.35;max-width:100%;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
body.hud-compact #feed div:not(:last-child),body.hud-min #feed div:not(:last-child){display:none}
body.hud-min #feed div:not(.bad){display:none}
body.hud-compact #big,body.hud-min #big{top:24%}
body.hud-compact #big b,body.hud-min #big b{font-size:34px}
body.hud-compact #big span,body.hud-min #big span{font-size:12px}
#tHud.on{background:rgba(232,176,75,.4);border-color:#f6d58e}
body.touch #clock{right:calc(env(safe-area-inset-right,0px) + 214px)!important;left:auto!important;transform:none!important}
#pauseInfo{margin:2px 0 14px;font-size:14px;text-align:right}
#pauseInfo .pi-h{color:var(--dim);font-size:13px}#pauseInfo .pi-h b{color:var(--ink);font-size:15px}
#pauseInfo .xp{height:5px;border-radius:3px;background:rgba(127,127,127,.28);overflow:hidden;margin:6px 0 8px}
#pauseInfo .xp b{display:block;height:100%;background:var(--gold)}
#pauseInfo ul{margin:0;padding:0 18px 0 0}#pauseInfo li{margin:3px 0;line-height:1.35}
#pauseInfo p{color:var(--dim);font-size:13px;margin:8px 0 0}
@media (max-height:520px){
  body.touch.hud-compact #feed,body.touch.hud-min #feed{top:calc(env(safe-area-inset-top,0px) + 52px);width:min(46vw,400px)}
  body.hud-compact #big b,body.hud-min #big b{font-size:30px}
  #pauseInfo{font-size:13px;margin-bottom:10px}
}`;
  document.head.appendChild(st);
})();
function hudInit() { HUD.mode = SET.hud || (TOUCH ? 'compact' : 'full'); applyHud(); }
function applyHud() {
  const b = document.body; b.classList.toggle('hud-compact', HUD.mode === 'compact'); b.classList.toggle('hud-min', HUD.mode === 'min');
  const t = document.getElementById('tHud'); if (t) t.classList.toggle('on', HUD.mode !== 'full');
}
function cycleHud() {
  HUD.mode = HUD.mode === 'compact' ? 'min' : HUD.mode === 'min' ? 'full' : 'compact';
  SET.hud = HUD.mode; saveSet(); applyHud();
  HUD.flashG = HUD.mode === 'compact' ? 4 : 0; HUD.flashF = HUD.flashG;
  UI.notify(`תצוגה ${HUDN[HUD.mode]}`);
}
function hudUpdate(dt) {
  if (HUD.mode === 'full' || G.mode !== 'play' || !P.a) return;
  const mates = (P.mates || []).filter(m => m.alive), pets = P.a.pets ? P.a.pets.filter(b => b.alive) : [];
  const sg = PROG.active.join('|') + ':' + PROG.lvl, sf = `${mates.length}:${P.cubs.length}:${pets.length}`;
  if (sg !== HUD.sigG) { HUD.sigG = sg; infoTip(); }
  if (sf !== HUD.sigF) HUD.sigF = sf;
  if (mates.some(m => m.hp < m.maxHp * 0.4) || P.cubs.some(c => c.alive && c.hp < c.maxHp * 0.4)) HUD.flashF = Math.max(HUD.flashF, 0.5);
  HUD.flashG = Math.max(0, HUD.flashG - dt); HUD.flashF = Math.max(0, HUD.flashF - dt);
  const g = document.getElementById('goals'), f = document.getElementById('family');
  if (g) g.classList.toggle('peek', HUD.mode === 'compact' && HUD.flashG > 0);
  if (f) f.classList.toggle('peek', HUD.mode === 'compact' && HUD.flashF > 0);
  const feed = document.getElementById('feed');
  if (feed) for (const d of [...feed.children]) if (UI.t - (+d.dataset.t || 0) > 3.4) d.remove();
}
function fillPauseInfo() {
  const el = document.getElementById('pauseInfo'); if (!el || !P.a) return;
  const ms = PROG.active.map(id => `<li>${GOAL[id].t}</li>`).join('') || '<li>כל המשימות הושלמו!</li>';
  const fam = [], mates = (P.mates || []).filter(m => m.alive), pets = P.a.pets ? P.a.pets.filter(b => b.alive) : [];
  if (mates.length) fam.push(`${mates.length > 1 ? 'בנות ובני זוג' : P.a.sex === 'm' ? 'בת זוג' : 'בן זוג'}: ${mates.map(m => m.name).join(', ')}`);
  if (P.cubs.length) fam.push(`צאצאים: ${P.cubs.length}`);
  if (pets.length) fam.push(`חיות מאולפות: ${pets.length}`);
  el.innerHTML = `<div class="pi-h"><b>רמה ${PROG.lvl}</b>${PROG.gen > 1 ? ` · דור ${PROG.gen}` : ''} · יום ${G.day}</div>` +
    `<div class="xp"><b style="width:${(clamp(PROG.xp / xpNeed(PROG.lvl), 0, 1) * 100).toFixed(0)}%"></b></div><div class="pi-h" style="margin-top:6px"><b>${missionTitle()}</b></div><ul>${ms}</ul>${fam.length ? `<p>${fam.join(' · ')}</p>` : ''}` + saveStatusHtml();
}
addEventListener('keydown', e => { if (e.code === 'KeyI' && G.mode === 'play' && !e.repeat && !(typeof PROG !== 'undefined' && PROG.choosing)) openInfo(); });

// ================= TREES & FAMILY FOOD =================
// cats climb trees, rest on branches and drop onto prey; predators drag prey home; caimans and capybaras get dive buttons on touch
const CLIMBERS = { jaguar: 2.4, puma: 3.3, ocelot: 3.0 };
const CARRYMAX = { jaguar: 160, puma: 120, ocelot: 35, hunter: 90 };
const CLB = { latch: false, cand: null, prey: null, lab: '', tipT: 0, tipped: false };
const DRAG = { held: false, t0: 0 };
Object.assign(CTXT, { climb: ['up', 'לטפס', 'לטפס על העץ'], descend: ['down', 'לרדת', 'לרדת מהעץ'], drop: ['meat', 'לשחרר', 'לשחרר את הטרף'] });
function climbReset() { P.climb = null; P.drag = null; CLB.lab = ''; CLB.prey = null; if (P.a) P.a.ownY = !!(P.fish || P.bird); }

// ---------- climbing ----------
function nearTrunk(x, z, maxD) {
  const ix = g10c1(x), iz = g10r1(x, z); let best = null, bd = maxD;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const cell = TRUNKS.g[(iz + dz) * GN + ix + dx]; if (!cell) continue;
    for (let k = 0; k < cell.length; k += 3) { const d = Math.hypot(x - cell[k], z - cell[k + 1]) - cell[k + 2]; if (d < bd) { bd = d; best = { x: cell[k], z: cell[k + 1], r: cell[k + 2] }; } }
  }
  return best;
}
function treeFor(tr) {
  let best = null, bd = 6;
  for (const c of crownsNear(tr.x, tr.z, 8)) { const d = Math.hypot(c.x - tr.x, c.z - tr.z); if (d < bd) { bd = d; best = c; } }
  if (!best) return null;
  const g = getH(tr.x, tr.z), h = Math.min(best.y - best.r * 1.05, g + 12);
  return h - g > 3.5 ? { x: tr.x, z: tr.z, r: tr.r, h } : null;
}
function climbContext() {
  const a = P.a; if (!CLIMBERS[P.spId]) return null;
  if (P.climb) return P.climb.phase === 'perch' ? 'descend' : null;
  if (a.swimming || a.airborne || P.drag) return null;
  const tr = nearTrunk(a.pos.x, a.pos.z, 1.3 + a.rad); if (!tr) return null;
  const t = treeFor(tr); if (!t) return null;
  CLB.cand = t; return 'climb';
}
function climbUse() {
  if (CLB.latch) return; CLB.latch = true;
  if (P.ctx === 'climb' && CLB.cand && !P.climb) startClimb(CLB.cand);
  else if (P.ctx === 'descend') climbDown();
}
function startClimb(t) {
  const a = P.a, dx = a.pos.x - t.x, dz = a.pos.z - t.z, d = Math.hypot(dx, dz) || 1;
  P.climb = { t, phase: 'up', ux: dx / d, uz: dz / d }; a.ownY = true; P.crouch = false; P.resting = false; a.airborne = false;
  PROG.flags.climb = 1; AUD.play('swipe', 0.5);
}
function climbDown() { if (P.climb && P.climb.phase === 'perch') { P.climb.phase = 'down'; bhHide('amb'); } }
function endClimb() { const a = P.a; P.climb = null; a.ownY = false; a.ground(1, true); bhHide('amb'); CLB.prey = null; }
function ambushTarget() {
  const a = P.a; let best = null, bd = 1e9;
  shQuery(a.pos.x, a.pos.z, 11, (b, d) => { if (!b.alive || b === a || b.isPartner || b.cub || b.pet === a || b.tpl.kind !== 'quad' || !preys(a, b) || b.swimming) return; if (d < bd) { bd = d; best = b; } });
  return best;
}
function climbStep(dt) {
  const a = P.a, c = P.climb; if (!c) return false;
  const t = c.t, off = t.r + a.rad * 0.55;
  if (c.phase === 'up' || c.phase === 'down') {
    const spd = (CLIMBERS[P.spId] || 2.5) * (c.phase === 'down' ? 1.7 : 1);
    a.pos.x = t.x + c.ux * off; a.pos.z = t.z + c.uz * off; a.yaw = Math.atan2(-c.ux, -c.uz);
    a.pos.y += (c.phase === 'up' ? 1 : -1) * spd * dt; a.speed = spd;
    if (c.phase === 'up') P.stam = Math.max(0, P.stam - dt * 5);
    if (c.phase === 'up' && a.pos.y >= t.h) {
      a.pos.y = t.h; c.phase = 'perch'; CAM.pitch = Math.max(CAM.pitch, 0.98); c.px = t.x + c.ux * (t.r + 0.9); c.pz = t.z + c.uz * (t.r + 0.9);
      UI.notify(TOUCH ? 'על הענף: בטוח לנוח כאן. טרף שעובר מתחת מסומן בירוק, ותקיפה מזנקת עליו' : 'על הענף: בטוח לנוח כאן. טרף שעובר מתחת מסומן בירוק, וקליק מזנק עליו', 'good');
    }
    if (c.phase === 'down' && a.pos.y <= getH(a.pos.x, a.pos.z)) endClimb();
    return true;
  }
  if (c.phase === 'drop') {
    c.time += dt; const p = c.prey, k = Math.min(1, c.time / 0.55);
    if (p) { c.tx = p.pos.x; c.tz = p.pos.z; }
    a.pos.x = lerp(c.x0, c.tx, k); a.pos.z = lerp(c.z0, c.tz, k); a.pos.y = lerp(c.y0, getH(c.tx, c.tz), k) + Math.sin(k * Math.PI) * 1.2;
    a.yaw = Math.atan2(c.tx - c.x0, c.tz - c.z0); a.speed = 9;
    if (k >= 1) { endClimb(); if (p && p.alive) { strike(p, 2.6, true); combatText('זינוק מהעץ!', 'crit'); PROG.flags.ambush = 1; } }
    return true;
  }
  a.pos.set(c.px, t.h, c.pz); a.speed = 0;
  a.yaw += angDiff(a.yaw, CAM.yaw) * Math.min(1, dt * 2);
  P.stam = Math.min(100, P.stam + dt * 12); a.hp = Math.min(a.maxHp, a.hp + dt * 0.9 * (P.mods ? P.mods.regen : 1));
  CLB.prey = ambushTarget();
  if (CLB.prey) bhPlace(bhMarker('amb', '#6dff6a'), CLB.prey, 0.9 + CLB.prey.rad); else bhHide('amb');
  return true;
}
function climbAttack() {
  const c = P.climb, a = P.a;
  if (!c || c.phase !== 'perch') return;
  const p = CLB.prey; if (!p || !p.alive) { combatText('אין טרף מתחת', 'bad'); return; }
  bhHide('amb'); Object.assign(c, { phase: 'drop', prey: p, time: 0, x0: a.pos.x, y0: a.pos.y, z0: a.pos.z, tx: p.pos.x, tz: p.pos.z });
  AUD.play(P.sp.call || 'growl', 0.7);
}
function climbPrompts(pr) {
  if (P.human && P.inv && (P.inv.cooked || 0) > 0 && P.food < 98) pr.push(['X', `לאכול (${P.inv.cooked})`]);
  if (P.climb && P.climb.phase === 'perch') pr.push(['קליק', CLB.prey ? 'לזנק על הטרף' : 'מחכה לטרף מתחת'], ['רווח', 'לרדת']);
  if (P.drag) pr.push(['E', 'הקשה קצרה: לשחרר את הטרף']);
}

// ---------- dragging prey home ----------
function tapUse() {
  if (P.drag) { dropPrey(); return; }
  const c = P.carcass;
  if (P.ctx !== 'eat' || !c || c.alive || !['quad', 'snake', 'bird', 'fish', 'frog'].includes(c.tpl.kind) || !CARRYMAX[P.spId] || c.carriedBy || P.climb) return;
  if ((c.sp.food || 20) * (c.baseScale || c.scale || 1) > CARRYMAX[P.spId]) { UI.notify('הטרף כבד מדי לסחיבה. אפשר לאכול אותו כאן'); return; }
  P.drag = c; c.heldBy = P.a;
  UI.notify(you('סוחב את הטרף. הקשה נוספת משחררת אותו, ליד המשפחה הם יאכלו', 'סוחבת את הטרף. הקשה נוספת משחררת אותו, ליד המשפחה הם יאכלו'), 'good');
}
function dropPrey(silent) {
  const c = P.drag; P.drag = null; if (!c) return; c.heldBy = null;
  if (silent || !P.a || c.gone) return;
  const fam = [...aliveMates(), ...P.cubs.filter(x => x.alive), ...(P.a.pets || []).filter(x => x.alive)].filter(b => b.tpl.kind === 'quad' && dist2(b.pos, c.pos) < 16);
  if (!fam.length) { UI.notify('שחררת את הטרף'); return; }
  for (const b of fam) {
    b.stay = null; b.state = 'eat'; b.target = c; b.stT = 25;
    if (b.isPartner) b.affinity = Math.min(100, (b.affinity || 0) + 15);
    if (b.cub) b.cubHunger = Math.max(0, (b.cubHunger || 0) - 10);
    FX.spawn('heart', b.pos.x, b.pos.y + b.height, b.pos.z, 3);
  }
  UI.big('הבאת אוכל למשפחה', fam.length > 1 ? `${fam.length} מבני המשפחה אוכלים מהטרף שהבאת` : `${fam[0].name || fam[0].sp.he} ${heb(fam[0], 'אוכל', 'אוכלת')} מהטרף שהבאת`);
  if (!PROG.flags.provide) gainXP(25);
  PROG.flags.provide = 1; AUD.play('purr', 0.7);
}

// ---------- caiman and capybara: dive and surface buttons on touch ----------
function swimLabels() {
  if (!TOUCH || !P.a || !canDive()) return;
  const w = P.a.swimming, key = w ? (P.dive ? (P.human ? 'hu' : 'u') : 'd') : 'land';
  if (key === CLB.lab) return; CLB.lab = key;
  const set = (id, ic, t) => { const e = document.getElementById(id); if (e) { e.innerHTML = ICON[ic] + `<small>${t}</small>`; e.setAttribute('aria-label', t); } };
  if (w && P.human && P.dive) { set('tJump', 'up', 'למעלה'); set('tCrouch', 'down', 'למטה'); }
  else if (w) { set('tJump', P.dive ? 'up' : 'down', P.dive ? 'עלייה' : 'צלילה'); set('tCrouch', 'down', 'צלילה'); }
  else { set('tJump', 'jump', 'קפיצה'); set('tCrouch', 'sneak', 'התגנבות'); }
  if (w && !CLB.swimTold) { CLB.swimTold = true; UI.notify(P.spId === 'caiman' ? 'במים: כפתור "צלילה" מוריד אותך מתחת לפני המים, ושם כמעט אף אחד לא רואה אותך' : 'במים: כפתור "צלילה" מסתיר אותך מתחת לפני המים'); }
}

function climbUpdate(dt) {
  const held = !!(KEYS.KeyE || INPUT.use), now = performance.now();
  if (held && !DRAG.held) DRAG.t0 = now;
  if (!held && DRAG.held && now - DRAG.t0 < 260 && G.mode === 'play' && P.a && P.a.alive) tapUse();
  DRAG.held = held; if (!held) CLB.latch = false;
  if (G.mode !== 'play' || !P.a) return;
  const c = P.drag;
  if (c) {
    if (c.gone || c.food <= 0.5 || !P.a.alive || P.climb) dropPrey(true);
    else { const a = P.a, fx = Math.sin(a.yaw), fz = Math.cos(a.yaw), off = a.rad + c.rad * 0.7 + 0.15; c.pos.x = a.pos.x + fx * off; c.pos.z = a.pos.z + fz * off; c.yaw = a.yaw + Math.PI / 2; if (c.tpl.kind !== 'quad') { const w = waterAt(c.pos.x, c.pos.z); c.pos.y = Math.max(getH(c.pos.x, c.pos.z) + 0.05, w > -900 ? w - 0.1 : -99); } }
  }
  if (!CLB.tipped && P.ctx === 'eat' && CARRYMAX[P.spId] && (aliveMates().length || P.cubs.length)) { CLB.tipped = true; UI.notify(TOUCH ? 'טיפ: לחיצה ארוכה על כפתור הזהב אוכלת. הקשה קצרה סוחבת את הטרף למשפחה' : 'טיפ: להחזיק E כדי לאכול. הקשה קצרה על E סוחבת את הטרף למשפחה'); }
  swimLabels();
}

// ================= MISSIONS PER ANIMAL, AND WHAT EACH ANIMAL IS GOOD AT =================
const KB = (sp, n = 1) => () => ((PROG.kb || {})[sp] || 0) >= n;
const KBA = (list, n = 1) => () => list.reduce((s, k) => s + ((PROG.kb || {})[k] || 0), 0) >= n;
const FL = f => () => !!PROG.flags[f];
const MS = (id, t, xp, c) => ({ id, t, xp, c });
const mateM = sp => MS(sp + '.mate', 'למצוא בן או בת זוג', 80, () => aliveMates().length >= 1);
const raiseM = sp => MS(sp + '.raise', 'לגדל צאצא עד שיהיה עצמאי', 150, () => P.raised >= 1);
const tailM = sp => [MS(sp + '.disc22', 'לגלות 22 מינים בספר השדה', 120, () => P.discovered.size >= 22), MS(sp + '.heir', 'להמשיך את השושלת בתור צאצא', 150, () => (PROG.gen || 1) >= 2), MS(sp + '.day20', 'לשרוד עשרים ימים', 300, () => G.day >= 20)];
const MISSIONS = {
  jaguar: [MS('jaguar.hunt1', 'לצוד טרף ראשון', 30, () => P.kills >= 1), MS('jaguar.climb', 'לטפס על עץ ולנוח על ענף', 30, FL('climb')), MS('jaguar.capy', 'לצוד קפיברה', 40, KB('capybara')),
    MS('jaguar.ambush', 'לזנק מענף על טרף שעובר מתחת', 70, FL('ambush')), MS('jaguar.skull', 'לבצע נשיכת גולגולת (מכת סיום)', 60, FL('finisher')), MS('jaguar.swim', 'לשחות בנהר', 20, FL('swim')),
    MS('jaguar.caiman', 'לצוד קיימן, כמו שיגוארים אמיתיים עושים', 120, KB('caiman')), mateM('jaguar'), MS('jaguar.provide', 'לסחוב טרף למשפחה', 60, FL('provide')),
    MS('jaguar.rival', 'להביס יגואר מתחרה', 90, FL('rival')), raiseM('jaguar'), MS('jaguar.legend', 'להביס את הצל השחור', 300, FL('legend_shadow')), ...tailM('jaguar')],
  puma: [MS('puma.hunt1', 'לצוד טרף ראשון', 30, () => P.kills >= 1), MS('puma.climb', 'לטפס על עץ', 30, FL('climb')), MS('puma.small', 'לצוד אגוטי או קואטי', 40, KBA(['agouti', 'coati'])),
    MS('puma.ambush', 'לזנק מענף על טרף', 70, FL('ambush')), MS('puma.heavy', 'מכה טעונה: להחזיק תקיפה ולשחרר', 40, FL('heavy')), MS('puma.pecc', 'לצוד פקארי', 60, KB('peccary')),
    MS('puma.perfect', 'להתחמק בתזמון מושלם (קפיצה ברגע שמופיע !)', 60, FL('perfect')), mateM('puma'), MS('puma.provide', 'לסחוב טרף לגורים', 60, FL('provide')),
    MS('puma.hunt5', 'לצוד חמישה טרפים', 80, () => P.kills >= 5), raiseM('puma'), MS('puma.legend', 'להביס אגדה של הג׳ונגל', 300, FL('legend')), ...tailM('puma')],
  ocelot: [MS('ocelot.hunt1', 'לצוד טרף קטן', 30, () => P.kills >= 1), MS('ocelot.fish', 'לדוג דג מהגדה', 50, FL('fish')), MS('ocelot.climb', 'לטפס על עץ', 30, FL('climb')),
    MS('ocelot.sense', 'להשתמש בחושים כדי לאתר טרף', 20, FL('sense')), MS('ocelot.ambush', 'לזנק מענף על טרף', 70, FL('ambush')), MS('ocelot.bird', 'לצוד ציפור שנחתה על הקרקע', 60, KBA(['macaw', 'toucan'])),
    mateM('ocelot'), MS('ocelot.provide', 'לסחוב טרף לגורים', 60, FL('provide')), MS('ocelot.hunt5', 'לצוד חמישה טרפים', 80, () => P.kills >= 5), raiseM('ocelot'), ...tailM('ocelot')],
  capybara: [MS('capybara.graze', 'ללחך עשב', 20, FL('graze')), MS('capybara.drink', 'לשתות מים', 20, FL('drink')), MS('capybara.swim', 'לשחות בנהר', 20, FL('swim')),
    MS('capybara.dive', 'לצלול כדי להיעלם מטורף', 40, FL('dive')), MS('capybara.alarm', 'לשמוע אזעקה של קופים או ציפורים ולברוח', 40, FL('alarm')), MS('capybara.full', 'לאכול עד שהבטן מלאה', 25, () => P.food >= 96),
    mateM('capybara'), MS('capybara.young', 'להביא צאצאים לעולם', 80, () => P.cubs.length > 0 || P.raised > 0), MS('capybara.renown', 'להגיע למעמד 3', 90, () => P.renown >= 3),
    MS('capybara.day5', 'לשרוד חמישה ימים', 120, () => G.day >= 5), raiseM('capybara'), ...tailM('capybara')],
  caiman: [MS('caiman.dive', 'לצלול מתחת לפני המים', 30, FL('dive')), MS('caiman.fish', 'לצוד דג', 40, KBA(['pacu', 'piranha'])), MS('caiman.bask', 'להתחמם בשמש: לנוח על החוף ביום', 30, FL('bask')),
    MS('caiman.shore', 'לתפוס חיה שבאה לשתות בגדה', 80, KBA(['capybara', 'peccary', 'tapir', 'agouti', 'coati'])), MS('caiman.heavy', 'מכה טעונה: להחזיק תקיפה ולשחרר', 40, FL('heavy')),
    mateM('caiman'), MS('caiman.young', 'להביא צאצאים לעולם', 80, () => P.cubs.length > 0 || P.raised > 0), MS('caiman.hunt5', 'לצוד חמישה טרפים', 80, () => P.kills >= 5),
    MS('caiman.legend', 'להביס את אם הנהר', 300, FL('legend_mother')), raiseM('caiman'), ...tailM('caiman')],
  hunter: [MS('hunter.throw', 'לפגוע בחנית ממרחק', 40, FL('throw')), MS('hunter.pickup', 'לאסוף חנית מהקרקע', 20, FL('pickup')), MS('hunter.tame1', 'לאלף חיה שתלך איתך', 60, () => !!(P.a.pets && P.a.pets.some(b => b.alive))),
    MS('hunter.whistle', 'לשרוק לחיות שלך', 20, FL('whistle')), MS('hunter.fish', 'לדוג דג בחנית', 50, FL('fish')), MS('hunter.rod', 'לדוג דג בחכה', 40, FL('rod')), MS('hunter.wood', 'לאסוף עצים ליד גזע', 20, FL('wood')), MS('hunter.campup', 'לבנות שדרוג במחנה', 80, FL('campup')), MS('hunter.capy', 'לצוד קפיברה', 50, KB('capybara')),
    MS('hunter.command', 'לתת פקודה למלווים', 40, FL('command')), MS('hunter.tame3', 'להחזיק שלוש חיות מאולפות', 120, () => !!(P.a.pets && P.a.pets.filter(b => b.alive).length >= 3)),
    MS('hunter.disc14', 'לגלות 14 מינים בספר השדה', 70, () => P.discovered.size >= 14), MS('hunter.day10', 'לשרוד עשרה ימים', 200, () => G.day >= 10),
    MS('hunter.disc22', 'לגלות 22 מינים בספר השדה', 120, () => P.discovered.size >= 22), MS('hunter.day20', 'לשרוד עשרים ימים', 300, () => G.day >= 20)],
  harpy: [MS('harpy.fly', 'להמריא ולעוף מעל הנהר', 25, FL('fly')), MS('harpy.perch', 'לנחות על צמרת', 20, FL('perch')), MS('harpy.stoop', 'לצלול על טרף מסומן', 50, FL('stoop')),
    MS('harpy.carry', 'לשאת טרף בטפרים', 60, FL('carry')), MS('harpy.monkey', 'לצוד קוף', 80, KBA(['howler', 'squirrel'])), MS('harpy.sloth', 'לצוד עצלן', 80, KB('sloth')),
    mateM('harpy'), MS('harpy.young', 'להביא גוזלים לעולם', 80, () => P.cubs.length > 0 || P.raised > 0), MS('harpy.legend', 'להביס את מלכת השמיים', 300, FL('legend_queen')), raiseM('harpy'), ...tailM('harpy')],
  macaw: [MS('macaw.fly', 'להמריא ולעוף מעל הנהר', 25, FL('fly')), MS('macaw.perch', 'לנחות על צמרת', 20, FL('perch')), MS('macaw.fruit', 'לאכול פירות בצמרת', 25, FL('fruit')),
    MS('macaw.clay', 'ללקק חרסית בקיר החרסית', 50, FL('clay')), MS('macaw.mob', 'לקרוא ללהקה להבריח טורף', 60, FL('mob')), MS('macaw.evade', 'להתחמק מטורף על הקרקע', 40, FL('evade')),
    mateM('macaw'), MS('macaw.young', 'להביא גוזלים לעולם', 80, () => P.cubs.length > 0 || P.raised > 0), MS('macaw.disc10', 'לגלות 10 מינים בספר השדה', 50, () => P.discovered.size >= 10), raiseM('macaw'), ...tailM('macaw')],
  toucan: [MS('toucan.fly', 'להמריא ולעוף מעל הנהר', 25, FL('fly')), MS('toucan.perch', 'לנחות על צמרת', 20, FL('perch')), MS('toucan.fruit', 'לאכול פירות בצמרת', 25, FL('fruit')),
    MS('toucan.frog', 'לצלול על צפרדע', 60, KB('frog')), MS('toucan.evade', 'להתחמק מטורף על הקרקע', 40, FL('evade')), mateM('toucan'),
    MS('toucan.young', 'להביא גוזלים לעולם', 80, () => P.cubs.length > 0 || P.raised > 0), MS('toucan.disc10', 'לגלות 10 מינים בספר השדה', 50, () => P.discovered.size >= 10), raiseM('toucan'), ...tailM('toucan')],
  piranha: [MS('piranha.frenzy', 'להוביל את הלהקה לטירוף', 50, FL('frenzy')), MS('piranha.pacu', 'לבלוע פאקו', 40, KB('pacu')), MS('piranha.leap', 'לזנק מעל המים', 40, FL('leap')),
    MS('piranha.pacu5', 'לבלוע חמישה פאקו', 80, KB('pacu', 5)), mateM('piranha'), MS('piranha.young', 'לבקוע דגיגים', 80, () => P.cubs.length > 0 || P.raised > 0),
    MS('piranha.renown', 'להגיע למעמד 3', 90, () => P.renown >= 3), MS('piranha.day5', 'לשרוד חמישה ימים', 120, () => G.day >= 5), raiseM('piranha'), ...tailM('piranha')],
  arapaima: [MS('arapaima.breathe', 'לעלות לנשום אוויר', 20, FL('breathe')), MS('arapaima.pacu', 'לבלוע פאקו', 40, KB('pacu')), MS('arapaima.piranha', 'לבלוע פיראנה', 60, KB('piranha')),
    MS('arapaima.leap', 'לזנק מעל המים', 50, FL('leap')), MS('arapaima.fish5', 'לבלוע חמישה דגים', 80, KBA(['pacu', 'piranha'], 5)), mateM('arapaima'),
    MS('arapaima.young', 'לבקוע דגיגים', 80, () => P.cubs.length > 0 || P.raised > 0), MS('arapaima.day5', 'לשרוד חמישה ימים', 120, () => G.day >= 5), raiseM('arapaima'), ...tailM('arapaima')],
  eel: [MS('eel.breathe', 'לעלות לנשום אוויר', 20, FL('breathe')), MS('eel.shock', 'לשתק חיה במכת חשמל', 40, FL('shock')), MS('eel.fish', 'לבלוע דג', 40, KBA(['pacu', 'piranha'])),
    MS('eel.shock3', 'לשתק שלוש חיות במכה אחת', 90, FL('shock3')), mateM('eel'), MS('eel.young', 'לבקוע דגיגים', 80, () => P.cubs.length > 0 || P.raised > 0),
    MS('eel.renown', 'להגיע למעמד 3', 90, () => P.renown >= 3), MS('eel.day5', 'לשרוד חמישה ימים', 120, () => G.day >= 5), raiseM('eel'), ...tailM('eel')]
};
for (const sp in MISSIONS) for (const m of MISSIONS[sp]) GOAL[m.id] = m;
const MTITLE = { jaguar: 'היגואר', puma: 'הפומה', ocelot: 'האוצלוט', capybara: 'הקפיברה', caiman: 'הקיימן', harpy: 'עיט הארפיה', macaw: 'הארה', toucan: 'הטוקן', piranha: 'הפיראנה', arapaima: 'הארפאימה', eel: 'הצלופח' };
const missionList = () => MISSIONS[P.spId] || GOALS;
const missionTitle = () => `משימות ${P.spId === 'hunter' ? (P.sex === 'f' ? 'הציידת' : 'הצייד') : MTITLE[P.spId] || ''}`;
function silentDone() {
  for (const m of missionList()) if (!PROG.done.includes(m.id) && m.c()) PROG.done.push(m.id);
  PROG.active = []; fillGoals();
}

// ---------- what each animal does, and what it is good at ----------
const ROLES = {
  jaguar: { role: 'צייד מארב: מתגנבים, מזנקים ונושכים בגולגולת. שוחה מצוין וצד אפילו קיימנים.', pros: ['הנשיכה הכי חזקה בג׳ונגל', 'מטפס על עצים ומזנק מענפים', 'שוחה וצד גם במים', 'סוחב טרף למשפחה'] },
  puma: { role: 'צייד מהיר וגמיש: רודף, קופץ, מטפס ותוקף מכל כיוון.', pros: ['המהיר מבין החתולים', 'מטפס הכי מהר', 'קפיצה גבוהה וסבולת בריצה', 'מארב מענפים'] },
  ocelot: { role: 'חתול קטן וחשאי: צד טרף קטן, ציפורים על הקרקע ודגים מהגדה.', pros: ['הכי שקט, וקשה לזהות אותו', 'הדייג הטוב מבין החתולים', 'מטפס על עצים', 'צריך מעט אוכל'] },
  capybara: { role: 'אוכל עשב שחי בין המים ליבשה: מלחך, שוחה ובורח בזמן.', pros: ['שחיין מצוין שצולל כדי להסתתר', 'מוצא אוכל בכל מקום', 'מקבל אזהרה מאזעקות של קופים וציפורים', 'משפחות גדולות'] },
  caiman: { role: 'טורף מים סבלני: אורב מתחת לפני המים ותופס את מי שבא לשתות.', pros: ['כמעט בלתי נראה כשהוא צולל', 'נשיכה חזקה ועור עבה', 'צד דגים וגם חיות בגדה', 'מנוחה בשמש על החוף מחזירה כוח מהר'] },
  hunter: { role: 'בן אדם עם חנית: זורק מרחוק, דג, ומאלף חיות שנלחמות לצידו.', pros: ['תוקף מרחוק עם חניתות', 'מאלף עד שלוש חיות', 'דג בחנית', 'הציידים במחנה ידידותיים'] },
  harpy: { role: 'העוף הדורס החזק ביבשת: צולל מהשמיים על קופים ועצלנים.', pros: ['צלילה אוטומטית על טרף מסומן', 'נושא טרף בטפרים', 'רואה רחוק מהשמיים', 'טורפי קרקע כמעט לא מצליחים לפגוע בו'] },
  macaw: { role: 'תוכי של להקה: פירות בצמרות, חרסית בבוקר, וקריאה שמזעיקה את הלהקה.', pros: ['עף מהר ורחוק', 'הלהקה מגינה עליו מטורפים', 'מוצא פירות כמעט בכל עץ', 'מתחמק בקלות מטורפי קרקע'] },
  toucan: { role: 'מקור ענק וקל: פירות בצמרות, ומדי פעם צלילה על צפרדע.', pros: ['מגיע לפירות שאחרים לא מגיעים אליהם', 'צולל על צפרדעים', 'מתחמק מטורפי קרקע', 'חסכוני באנרגיה'] },
  piranha: { role: 'דג קטן בלהקה גדולה: נשיכה אחת מתחילה טירוף של כל הלהקה.', pros: ['שבעה דגים שתוקפים איתך', 'מהיר וזריז', 'לא צריך לעלות לנשום', 'מסוכן אפילו לחיות גדולות'] },
  arapaima: { role: 'ענק הנהר: בולע דגים שלמים, אבל חייב לעלות לנשום.', pros: ['הדג הגדול והחזק בנהר', 'בולע דגים בבת אחת', 'זינוק מרשים מעל המים', 'מעט אויבים'] },
  eel: { role: 'מכת חשמל שמשתקת כל מה שבמים סביבו.', pros: ['מכה שפוגעת בכמה חיות יחד', 'משתק אויבים לכמה שניות', 'אף טורף לא רוצה לגעת בו', 'עור עבה'] }
};
for (const id in ROLES) if (SPECIES[id] && SPECIES[id].pl) Object.assign(SPECIES[id].pl, ROLES[id]);
(function () {
  const st = document.createElement('style');
  st.textContent = `.sprole{font-size:13.5px;line-height:1.5;color:#e9e4d2;margin:0 0 8px}.sprole b{color:#e8b04b;font-weight:600}
.pros{list-style:none;margin:0 0 10px;padding:0;display:flex;flex-wrap:wrap;gap:4px 6px}
.pros li{font-size:12px;padding:3px 9px;border-radius:999px;background:rgba(232,176,75,.16);border:1px solid rgba(232,176,75,.35);color:#f3ead1}
#spRole{margin:0 0 10px;max-width:520px}#spRole .sprole{font-size:12px;margin-bottom:5px}#spRole .pros li{font-size:11px;padding:2px 8px}`;
  document.head.appendChild(st);
})();
function roleHtml(s) {
  if (!s.pl || !s.pl.role) return '';
  return `<div class="sprole"><b>מה עושים:</b> ${s.pl.role}</div><ul class="pros">${(s.pl.pros || []).map(p => `<li>${p}</li>`).join('')}</ul>`;
}
function syncRoleMini(s) {
  let el = document.getElementById('spRole');
  if (!el) { const mini = document.getElementById('spMini'); if (!mini) return; el = document.createElement('div'); el.id = 'spRole'; mini.insertAdjacentElement('afterend', el); }
  const info = document.getElementById('spInfo');
  el.hidden = !!info && getComputedStyle(info).display !== 'none';
  el.innerHTML = roleHtml(s);
}

// ---------- small progress hooks that the missions above rely on ----------
const MHK = { shockSeen: false };
function missionsUpdate(dt) {
  const a = P.a; if (G.mode !== 'play' || !a || !a.alive) return;
  if (a.swimming && !P.fish) PROG.flags.swim = 1;
  if (P.spId === 'caiman' && !a.swimming && P.resting && !isNight()) { PROG.flags.bask = 1; a.hp = Math.min(a.maxHp, a.hp + dt * 1.2); }
  if (P.spId === 'eel') {
    if (P.callCD > 4.85 && !MHK.shockSeen) {
      MHK.shockSeen = true; let n = 0;
      shQuery(a.pos.x, a.pos.z, 7, b => { if (b !== a && b.alive && b.stunT > 2) n++; });
      if (n >= 3) PROG.flags.shock3 = 1;
    } else if (P.callCD < 4) MHK.shockSeen = false;
  }
}
