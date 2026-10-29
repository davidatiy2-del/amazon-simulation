// ================= FX =================
const FX = { max: 600, list: [], pts: null };
function buildFX() {
  const cv = document.createElement('canvas'); cv.width = 320; cv.height = 64; const c = cv.getContext('2d');
  let g = c.createRadialGradient(32, 32, 0, 32, 32, 30); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64);
  c.fillStyle = '#fff'; c.beginPath(); c.moveTo(96, 54); c.bezierCurveTo(70, 36, 70, 10, 88, 12); c.bezierCurveTo(94, 12, 96, 18, 96, 20); c.bezierCurveTo(96, 18, 98, 12, 104, 12); c.bezierCurveTo(122, 10, 122, 36, 96, 54); c.fill();
  c.beginPath(); c.arc(160, 36, 14, 0, TAU); c.moveTo(146, 32); c.lineTo(160, 6); c.lineTo(174, 32); c.fill();
  c.save(); c.translate(224, 32); c.rotate(0.6); c.beginPath(); c.ellipse(0, 0, 10, 24, 0, 0, TAU); c.fill(); c.restore();
  c.strokeStyle = '#fff'; c.lineWidth = 5; c.beginPath(); c.moveTo(270, 6); c.lineTo(296, 26); c.lineTo(276, 36); c.lineTo(300, 58); c.stroke();
  const tex = new THREE.CanvasTexture(cv);
  const n = FX.max, geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(n), 1));
  geo.setAttribute('aAlpha', new THREE.BufferAttribute(new Float32Array(n), 1));
  geo.setAttribute('aSpr', new THREE.BufferAttribute(new Float32Array(n), 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { tex: { value: tex }, uPS: PSCALE },
    vertexShader: `attribute float aSize, aAlpha, aSpr; attribute vec3 color; varying vec3 vC; varying float vA, vS; uniform float uPS;
      void main(){ vC = color; vA = aAlpha; vS = aSpr; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = aSize * uPS / -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform sampler2D tex; varying vec3 vC; varying float vA, vS;
      void main(){ vec4 t = texture2D(tex, vec2((gl_PointCoord.x + vS) / 5.0, 1.0 - gl_PointCoord.y)); if (t.a * vA < 0.02) discard; gl_FragColor = vec4(vC * t.rgb, t.a * vA); }`,
    transparent: true, depthWrite: false
  });
  FX.pts = new THREE.Points(geo, mat); FX.pts.frustumCulled = false; FX.pts.renderOrder = 6; scene.add(FX.pts);
  buildButterflies();
}
const FXT = {
  heart: { spr: 1, col: '#ff5d97', size: [0.25, 0.4], vel: [0.25, 0.9, 1.2], g: -0.2, life: 1.6 },
  hit: { spr: 0, col: '#d8cbb0', size: [0.25, 0.45], vel: [1.6, 1.2, 1.6], g: 1, life: 0.5 },
  blood: { spr: 2, col: '#7a0d0d', size: [0.08, 0.16], vel: [1.2, 1.8, 1.2], g: 6, life: 0.6 },
  splash: { spr: 2, col: '#dfe8e8', size: [0.12, 0.28], vel: [1.6, 3.8, 1.6], g: 9, life: 0.9 },
  dust: { spr: 0, col: '#8a7458', size: [0.5, 0.9], vel: [0.6, 0.4, 0.6], g: -0.1, life: 1.2 },
  spark: { spr: 4, col: '#bfe8ff', size: [0.18, 0.32], vel: [2.2, 2.2, 2.2], g: 0, life: 0.45 },
  poison: { spr: 0, col: '#8bd94a', size: [0.1, 0.2], vel: [0.3, 0.6, 0.3], g: -0.3, life: 1.2 },
  zz: { spr: 3, col: '#cfe0c0', size: [0.12, 0.2], vel: [0.2, 0.5, 0.2], g: -0.1, life: 2 },
  ember: { spr: 0, col: '#ffa83a', size: [0.06, 0.12], vel: [1.4, 2.4, 1.4], g: 5, life: 0.55 }
};
FX.spawn = (type, x, y, z, n = 6) => {
  const t = FXT[type]; if (!t || !FX.pts) return; const c = col(t.col);
  for (let i = 0; i < n && FX.list.length < FX.max; i++) {
    FX.list.push({ x: x + rr(-0.2, 0.2), y: y + rr(-0.1, 0.2), z: z + rr(-0.2, 0.2), vx: rr(-1, 1) * t.vel[0], vy: rr(0.3, 1) * t.vel[1], vz: rr(-1, 1) * t.vel[2], g: t.g, life: t.life * rr(0.7, 1.2), age: 0, size: rr(t.size[0], t.size[1]), spr: t.spr, r: c.r, gg: c.g, b: c.b });
  }
};
FX.update = dt => {
  if (!FX.pts) return;
  const L = FX.list, at = FX.pts.geometry.attributes;
  for (let i = L.length - 1; i >= 0; i--) { const p = L[i]; p.age += dt; if (p.age > p.life) { L.splice(i, 1); continue; } p.vy -= p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; }
  for (let i = 0; i < L.length; i++) {
    const p = L[i], f = p.age / p.life;
    at.position.setXYZ(i, p.x, p.y, p.z); at.color.setXYZ(i, p.r, p.gg, p.b); at.aSize.setX(i, p.size * (p.spr === 1 ? 1 + f * 0.4 : 1)); at.aAlpha.setX(i, (1 - f) * Math.min(1, p.age * 12)); at.aSpr.setX(i, p.spr);
  }
  FX.pts.geometry.setDrawRange(0, L.length);
  for (const k of ['position', 'color', 'aSize', 'aAlpha', 'aSpr']) at[k].needsUpdate = true;
  updateButterflies(dt);
};
// ---- morpho butterflies ----
const BF = { n: 22, mesh: null, list: [] };
function buildButterflies() {
  const g = new THREE.BufferGeometry(), P2 = [], S = [], U = [];
  const wing = (s) => { const q = [[0, 0, 0.04], [s * 0.11, 0, 0.07], [s * 0.1, 0, -0.06], [0, 0, -0.03]]; for (const k of [0, 1, 2, 0, 2, 3]) { P2.push(...q[k]); S.push(k === 0 || k === 3 ? 0 : s); U.push(Math.abs(q[k][0]) / 0.11, (q[k][2] + 0.06) / 0.13); } };
  wing(1); wing(-1);
  g.setAttribute('position', new THREE.Float32BufferAttribute(P2, 3)); g.setAttribute('aSide', new THREE.Float32BufferAttribute(S, 1)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
  const m = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true });
  m.onBeforeCompile = sh => {
    sh.uniforms.uTime = WUNI.uTime; sh.uniforms.uLight = WUNI.uLight;
    sh.vertexShader = 'uniform float uTime;\nattribute float aSide;\nvarying vec2 vUv2;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      float ph = 0.0;
      #ifdef USE_INSTANCING
        ph = instanceMatrix[3].x * 3.1 + instanceMatrix[3].z * 1.7;
      #endif
      float ang = sin(uTime * 13.0 + ph) * 0.95 * sign(aSide);
      float ax = abs(transformed.x); transformed.x = sign(transformed.x) * ax * cos(ang); transformed.y += ax * abs(sin(ang)) * 0.9;
      vUv2 = uv;`);
    sh.fragmentShader = 'uniform float uLight;\nvarying vec2 vUv2;\n' + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      float edge = smoothstep(0.62, 0.9, vUv2.x) + smoothstep(0.2, 0.0, vUv2.y) * 0.4;
      diffuseColor.rgb = mix(vec3(0.08, 0.42, 1.0), vec3(0.03, 0.03, 0.06), clamp(edge, 0.0, 1.0)) * (0.35 + 0.9 * uLight);`);
  };
  BF.mesh = new THREE.InstancedMesh(g, m, BF.n); BF.mesh.frustumCulled = false; scene.add(BF.mesh);
  for (let i = 0; i < BF.n; i++) BF.list.push({ p: new V3(0, -99, 0), v: new V3(), t: rng() * 10 });
}
const _bm = new THREE.Matrix4(), _bq = new THREE.Quaternion(), _be = new THREE.Euler(), _bs = new V3(1.6, 1.6, 1.6);
function updateButterflies(dt) {
  if (!BF.mesh) return;
  const c = P.a && P.a.alive ? P.a.pos : camera.position, show = SKY.day > 0.3 && G.rain < 0.4;
  BF.mesh.visible = show; if (!show) return;
  for (let i = 0; i < BF.n; i++) {
    const b = BF.list[i];
    if (Math.hypot(b.p.x - c.x, b.p.z - c.z) > 40 || b.p.y < -50) { const x = c.x + rr(-35, 35), z = c.z + rr(-35, 35); if (waterDepth(x, z) > 0) continue; b.p.set(x, getH(x, z) + rr(0.6, 2.5), z); }
    b.t -= dt; if (b.t <= 0) { b.t = rr(0.4, 1.6); b.v.set(rr(-1.5, 1.5), rr(-0.4, 0.5), rr(-1.5, 1.5)); }
    b.p.addScaledVector(b.v, dt); const gy = getH(b.p.x, b.p.z); b.p.y = clamp(b.p.y + Math.sin(G.t * 6 + i) * 0.01, gy + 0.3, gy + 3.5);
    if (P.a && P.a.alive && b.p.distanceTo(P.a.pos) < 4 && !P.discovered.has('morpho')) discover('morpho');
    _bq.setFromEuler(_be.set(0, Math.atan2(b.v.x, b.v.z), 0)); _bm.compose(b.p, _bq, _bs); BF.mesh.setMatrixAt(i, _bm);
  }
  BF.mesh.instanceMatrix.needsUpdate = true;
}

// ================= AUDIO (synthesized) =================
const AUD = {
  ctx: null, ok: false, amb: {}, callT: 2,
  init() {
    if (this.ctx) { this.resume(); return; }
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    const c = this.ctx;
    this.master = c.createGain(); this.master.gain.value = 0.85;
    this.lp = c.createBiquadFilter(); this.lp.type = 'lowpass'; this.lp.frequency.value = 18000;
    this.master.connect(this.lp); this.lp.connect(c.destination);
    this.sfx = c.createGain(); this.sfx.gain.value = 1; this.sfx.connect(this.master);
    const len = c.sampleRate * 2, b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.nb = b;
    const loop = (type, f, q) => {
      const s = c.createBufferSource(); s.buffer = b; s.loop = true;
      const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
      const g = c.createGain(); g.gain.value = 0; s.connect(fl); fl.connect(g); g.connect(this.master); s.start(0, Math.random() * 1.9);
      return g;
    };
    this.amb.wind = loop('lowpass', 420, 0.6); this.amb.insect = loop('bandpass', 5200, 8); this.amb.river = loop('lowpass', 650, 0.7);
    this.amb.fall = loop('bandpass', 380, 0.45); this.amb.rain = loop('highpass', 1400, 0.5);
    const lfo = c.createOscillator(); lfo.frequency.value = 6.5; const lg = c.createGain(); lg.gain.value = 0.5; lfo.connect(lg);
    const ins = c.createGain(); ins.gain.value = 0.5; lg.connect(ins.gain); this.amb.insect.disconnect(); this.amb.insect.connect(ins); ins.connect(this.master); lfo.start();
    const cr = c.createOscillator(); cr.frequency.value = 4300; const crg = c.createGain(); crg.gain.value = 0;
    const pulse = c.createOscillator(); pulse.type = 'square'; pulse.frequency.value = 24; const pg = c.createGain(); pg.gain.value = 0.5;
    const cm = c.createGain(); cm.gain.value = 0.5; pulse.connect(pg); pg.connect(cm.gain); cr.connect(cm); cm.connect(crg); crg.connect(this.master); cr.start(); pulse.start();
    this.amb.cricket = crg;
    this.ok = true;
  },
  resume() { if (this.ctx && this.ctx.state !== 'running') this.ctx.resume(); },
  set(g, v) { g.gain.setTargetAtTime(v, this.ctx.currentTime, 0.4); },
  update(dt) {
    if (!this.ok) return;
    const cp = camera.position, day = SKY.day, night = SKY.night, rain = G.rain, A = this.amb;
    const w = nearestWater(cp.x, cp.z), wd = w ? Math.hypot(w.x - cp.x, w.z - cp.z) : 999, sd = gridAt(STREAMD, cp.x, cp.z);
    const fd = FALL && FALL.base ? Math.hypot(cp.x - FALL.base.x, cp.z - FALL.base.z) : 999;
    const live = G.mode === 'play' || G.mode === 'menu' ? 1 : 0.4;
    this.set(A.wind, (0.035 + rain * 0.05) * live); this.set(A.insect, day * 0.03 * (1 - rain) * live);
    this.set(A.river, Math.max(smooth(45, 4, wd) * 0.1, smooth(26, 2, sd) * 0.16) * live);
    this.set(A.fall, smooth(300, 20, fd) * 0.5 * live); this.set(A.rain, rain * 0.28 * live); this.set(A.cricket, night * 0.016 * (1 - rain) * live);
    this.lp.frequency.setTargetAtTime(SKY.under ? 500 : 18000, this.ctx.currentTime, 0.1);
    this.callT -= dt;
    if (this.callT <= 0) {
      this.callT = rr(0.6, 2.8);
      if (G.mode === 'play' || G.mode === 'menu') {
        const pan = rr(-0.9, 0.9), v = rr(0.15, 0.4);
        if (night > 0.5) { const r = rng(); if (r < 0.55) this.play('frogs', v, pan); else if (r < 0.8) this.play('owl', v * 0.8, pan); }
        else if (rain < 0.6) { const r = rng(); if (r < 0.65) this.play('bird', v, pan); else if (r < 0.75) this.play('macaw', v * 0.6, pan); else if (r < 0.85) this.play('toucan', v * 0.7, pan); }
      }
    }
  },
  at(name, pos, vol = 1) {
    if (!this.ok || !pos) return;
    const cp = camera.position, dx = pos.x - cp.x, dz = pos.z - cp.z, d = Math.hypot(dx, dz);
    const v = vol / (1 + d * 0.07); if (v < 0.02) return;
    const fx = Math.sin(CAM.yaw), fz = Math.cos(CAM.yaw), rx = -Math.cos(CAM.yaw), rz = Math.sin(CAM.yaw);
    this.play(name, v, d > 0.5 ? clamp((dx * rx + dz * rz) / d, -1, 1) * 0.8 : 0);
  },
  out(node, pan) {
    if (pan && this.ctx.createStereoPanner) { const p = this.ctx.createStereoPanner(); p.pan.value = clamp(pan, -1, 1); node.connect(p); p.connect(this.sfx); }
    else node.connect(this.sfx);
  },
  tone(type, f0, f1, dur, vol, pan, t0 = 0, vib = 0) {
    const c = this.ctx, t = c.currentTime + t0, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    if (vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = vib; lg.gain.value = f0 * 0.08; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + dur + 0.1); }
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + Math.min(0.03, dur * 0.25)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); this.out(g, pan); o.start(t); o.stop(t + dur + 0.05);
  },
  noise(type, f0, f1, q, dur, vol, pan, t0 = 0, att = 0.01) {
    const c = this.ctx, t = c.currentTime + t0, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.nb; f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + att); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); this.out(g, pan); s.start(t, Math.random()); s.stop(t + dur + 0.05);
  },
  play(name, vol = 1, pan = 0) {
    if (!this.ok) return;
    const v = vol;
    try {
      switch (name) {
        case 'bird': { const k = Math.floor(rng() * 4), f = rr(1800, 3600);
          if (k === 0) for (let i = 0; i < 3; i++) this.tone('sine', f, f * 1.3, 0.09, v * 0.5, pan, i * 0.13);
          else if (k === 1) { this.tone('sine', f * 0.7, f, 0.25, v * 0.5, pan); this.tone('sine', f, f * 0.6, 0.3, v * 0.4, pan, 0.3); }
          else if (k === 2) for (let i = 0; i < 6; i++) this.tone('triangle', f, f * 0.9, 0.05, v * 0.35, pan, i * 0.07);
          else { this.tone('sine', f * 0.5, f * 0.55, 0.4, v * 0.35, pan); this.tone('sine', f * 0.62, f * 0.6, 0.35, v * 0.3, pan, 0.45); } break; }
        case 'macaw': for (let i = 0; i < 2; i++) { this.tone('sawtooth', 1150, 820, 0.28, v * 0.25, pan, i * 0.38, 38); this.noise('bandpass', 1600, 1200, 3, 0.25, v * 0.15, pan, i * 0.38); } break;
        case 'toucan': for (let i = 0; i < 3; i++) this.tone('square', 340, 290, 0.12, v * 0.18, pan, i * 0.22); break;
        case 'frogs': for (let i = 0; i < 4; i++) this.tone('sine', 820, 760, 0.06, v * 0.4, pan, i * 0.1); break;
        case 'owl': this.tone('sine', 400, 370, 0.35, v * 0.5, pan); this.tone('sine', 390, 360, 0.5, v * 0.5, pan, 0.55); break;
        case 'howler': for (let i = 0; i < 4; i++) { this.noise('bandpass', 300, 240, 4, 1.2, v * 0.5, pan, i * 0.7, 0.4); this.tone('sawtooth', 80, 95, 1.1, v * 0.15, pan, i * 0.7); } break;
        case 'jaguar': for (let i = 0; i < 6; i++) { this.tone('sawtooth', 105, 70, 0.2, v * 0.45, pan, i * 0.34); this.noise('bandpass', 420, 300, 2, 0.2, v * 0.5, pan, i * 0.34); } break;
        case 'puma': this.tone('sawtooth', 820, 560, 0.9, v * 0.3, pan, 0, 9); this.noise('bandpass', 1400, 900, 2, 0.9, v * 0.25, pan); break;
        case 'ocelot': this.tone('triangle', 620, 420, 0.55, v * 0.4, pan, 0, 7); this.tone('triangle', 560, 380, 0.5, v * 0.35, pan, 0.6, 7); break;
        case 'capy': for (let i = 0; i < 3; i++) this.tone('sine', 1750, 1500, 0.1, v * 0.4, pan, i * 0.16); this.noise('bandpass', 800, 700, 5, 0.06, v * 0.3, pan, 0.5); break;
        case 'caiman': this.tone('sine', 60, 48, 1.5, v * 0.9, pan); this.noise('lowpass', 220, 120, 1, 1.5, v * 0.6, pan, 0, 0.2); break;
        case 'growl': this.tone('sawtooth', 90, 75, 0.9, v * 0.3, pan, 0, 14); this.noise('lowpass', 500, 300, 1, 0.9, v * 0.35, pan, 0, 0.1); break;
        case 'hiss': this.noise('highpass', 3000, 2500, 0.7, 0.8, v * 0.35, pan, 0, 0.05); break;
        case 'clack': for (let i = 0; i < 5; i++) this.noise('bandpass', 2400, 2200, 6, 0.04, v * 0.5, pan, i * 0.09); break;
        case 'screech': this.tone('sawtooth', 1900, 1300, 0.7, v * 0.25, pan, 0, 20); break;
        case 'bite': this.noise('lowpass', 1800, 300, 1, 0.14, v * 0.8, pan); this.tone('square', 130, 60, 0.09, v * 0.3, pan); break;
        case 'swipe': this.noise('bandpass', 2600, 700, 1.5, 0.18, v * 0.5, pan); break;
        case 'hurt': this.tone('sawtooth', 340, 140, 0.32, v * 0.3, pan); break;
        case 'eat': for (let i = 0; i < 3; i++) this.noise('bandpass', rr(900, 1600), 600, 3, 0.07, v * 0.45, pan, i * 0.11); break;
        case 'drink': for (let i = 0; i < 3; i++) this.tone('sine', 560, 900, 0.06, v * 0.25, pan, i * 0.12); break;
        case 'splash': this.noise('lowpass', 3200, 300, 0.8, 0.6, v * 0.6, pan); break;
        case 'thunder': this.noise('lowpass', 160, 60, 0.7, 3.2, v * 1.1, pan, 0, 0.08); break;
        case 'shock': this.tone('square', 60, 55, 0.5, v * 0.35, pan); this.noise('highpass', 4000, 3000, 0.5, 0.5, v * 0.3, pan); break;
        case 'heart': this.tone('sine', 660, 990, 0.25, v * 0.3, pan); this.tone('sine', 880, 1320, 0.3, v * 0.25, pan, 0.15); break;
        case 'chime': this.tone('sine', 1320, 1318, 0.7, v * 0.25, pan); this.tone('sine', 1980, 1975, 0.6, v * 0.18, pan, 0.08); break;
        case 'gulp': this.tone('sine', 150, 60, 0.35, v * 0.6, pan); this.noise('lowpass', 900, 200, 1, 0.3, v * 0.4, pan); break;
        case 'purr': this.noise('lowpass', 220, 180, 1, 1.2, v * 0.5, pan, 0, 0.2); this.tone('sawtooth', 28, 26, 1.2, v * 0.2, pan); break;
        case 'death': this.tone('sine', 220, 110, 1.6, v * 0.4, pan); this.tone('sine', 330, 160, 1.6, v * 0.25, pan, 0.1); break;
        case 'spear': this.noise('bandpass', 1800, 500, 1.2, 0.3, v * 0.45, pan); this.tone('sine', 300, 180, 0.2, v * 0.15, pan); break;
        case 'net': this.noise('bandpass', 900, 400, 0.8, 0.5, v * 0.4, pan); for (let i = 0; i < 3; i++) this.noise('highpass', 2500, 2000, 1, 0.08, v * 0.2, pan, 0.1 + i * 0.12); break;
        case 'ui': this.tone('sine', 880, 990, 0.08, v * 0.2, pan); break;
        case 'whistle': this.tone('sine', 1500, 2300, 0.18, v * 0.3, pan); this.tone('sine', 2200, 1700, 0.3, v * 0.28, pan, 0.22); break;
        case 'flap': for (let i = 0; i < 3; i++) this.noise('lowpass', 900, 300, 0.8, 0.12, v * 0.35, pan, i * 0.13); break;
        case 'chop': this.noise('bandpass', 950, 520, 3, 0.09, v * 0.85, pan); this.tone('square', 190, 90, 0.07, v * 0.3, pan); this.noise('lowpass', 2600, 400, 1, 0.05, v * 0.35, pan, 0.02); break;
        case 'fall': this.tone('sawtooth', 75, 46, 1.0, v * 0.22, pan, 0, 6); this.noise('bandpass', 520, 260, 2, 0.9, v * 0.3, pan, 0, 0.25); this.noise('lowpass', 320, 55, 0.7, 1.5, v * 1.1, pan, 1.0, 0.02); for (let i = 0; i < 4; i++) this.noise('highpass', 2200, 1500, 1, 0.12, v * 0.2, pan, 1.0 + i * 0.09); break;
        case 'hammer': this.noise('bandpass', 1500, 900, 4, 0.05, v * 0.7, pan); this.tone('square', 250, 160, 0.05, v * 0.25, pan); break;
        case 'talk': for (let i = 0; i < 3; i++) this.tone('triangle', rr(170, 260), rr(150, 230), 0.12, v * 0.14, pan, i * 0.15); break;
        case 'horn': this.tone('sawtooth', 104, 98, 1.9, v * 0.2, pan, 0, 5); this.tone('triangle', 208, 196, 1.9, v * 0.12, pan, 0, 5); this.tone('sawtooth', 156, 147, 1.2, v * 0.08, pan, 0.5, 4); break;
        case 'clink': this.tone('triangle', rr(1500, 1900), 1300, 0.14, v * 0.22, pan); this.noise('highpass', 3200, 2400, 1, 0.09, v * 0.18, pan, 0, 0.004); this.noise('lowpass', 600, 300, 1, 0.12, v * 0.2, pan, 0, 0.005); break;
        case 'cheer': for (let i = 0; i < 7; i++) this.noise('bandpass', rr(500, 1150), rr(400, 900), 2, 0.4, v * 0.22, clamp(pan + rr(-0.3, 0.3), -1, 1), i * 0.08, 0.05); this.tone('sine', 420, 640, 0.5, v * 0.1, pan, 0.1); break;
      }
    } catch (e) { }
  }
};

// ================= CHARACTER FX: rim light, night eyeshine, contact shadows =================
const BLOB = { pool: [], mat: null, geo: null };
function updateCharLight() {
  const n = clamp(SKY.night || 0, 0, 1), day = 1 - n, c = CHAR_U.uRimCol.value;
  CHAR_U.uNight.value = n;
  if (SKY.under) c.setRGB(0.04, 0.13, 0.12);
  else c.setRGB(0.22 * day + 0.035 * n, 0.19 * day + 0.05 * n, 0.14 * day + 0.09 * n);
}
function blobMesh(i) {
  if (!BLOB.mat) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(0,0,0,.6)'); gr.addColorStop(0.5, 'rgba(0,0,0,.36)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    BLOB.mat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4, toneMapped: false });
    BLOB.geo = new THREE.PlaneGeometry(1, 1); BLOB.geo.rotateX(-Math.PI / 2);
  }
  while (BLOB.pool.length <= i) { const m = new THREE.Mesh(BLOB.geo, BLOB.mat); m.renderOrder = 1; m.visible = false; m.matrixAutoUpdate = true; scene.add(m); BLOB.pool.push(m); }
  return BLOB.pool[i];
}
const _blq = new THREE.Quaternion(), _blq2 = new THREE.Quaternion(), _bln = new V3();
function updateBlobs() {
  let n = 0;
  if (QUAL[SET.q].sh === 0 && G.mode !== 'loading') {
    for (const a of ANIMALS) {
      if (n >= 44) break;
      if (a.gone || !a.mesh.visible || a.dCam > 42 || a.carriedBy) continue;
      const k = a.tpl.kind;
      if (k === 'fish' || a.spId === 'eel' || a.swimming || a.hidden) continue;
      const x = a.pos.x, z = a.pos.z, gh = getH(x, z);
      if (a.pos.y - gh > (k === 'bird' ? 0.25 : 0.9) || waterDepth(x, z) > 0.15) continue;
      const m = blobMesh(n++), L = k === 'quad' ? ((a.tpl.L || 0.6) + (a.tpl.o.bodyR || 0.2) * 2) * a.scale : k === 'snake' ? 0.9 * a.scale : k === 'human' ? 0.75 : a.rad * 3;
      const W = k === 'human' ? 0.65 : k === 'snake' ? 0.7 * a.scale : Math.max(0.12, a.rad * 2.4);
      _bln.set(getH(x - 0.4, z) - getH(x + 0.4, z), 0.8, getH(x, z - 0.4) - getH(x, z + 0.4)).normalize();
      _blq.setFromUnitVectors(UPV, _bln); _blq2.setFromAxisAngle(UPV, a.yaw);
      m.quaternion.copy(_blq).multiply(_blq2); m.position.set(x, gh + 0.04, z); m.scale.set(W, 1, L); m.visible = true;
    }
  }
  for (let i = n; i < BLOB.pool.length; i++) BLOB.pool[i].visible = false;
}

// ================= LIGHT SHAFTS THROUGH THE CANOPY & CINEMATIC VIGNETTE =================
const RAYS = { mesh: null, items: [], mat: null, n: 0 };
const _rm = new THREE.Matrix4(), _rx = new V3(), _ry = new V3(), _rz = new V3(), _rc = new V3(), _rcol = new THREE.Color();
function buildRays() {
  const n = SET.q === 'low' ? 8 : SET.q === 'med' ? 14 : 20;
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 256; const g = cv.getContext('2d'), img = g.createImageData(64, 256);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 64; x++) {
    const u = (x + 0.5) / 64 - 0.5, v = (y + 0.5) / 256, i = (y * 64 + x) * 4;
    const a = Math.exp(-u * u * 20) * Math.pow(Math.sin(Math.PI * Math.min(1, v * 1.04)), 0.7) * (1 - v * 0.5);
    img.data[i] = img.data[i + 1] = img.data[i + 2] = 255; img.data[i + 3] = Math.round(a * 255);
  }
  g.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  RAYS.mat = new THREE.MeshBasicMaterial({ map: tex, color: 0xffe0a0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false, toneMapped: false });
  RAYS.mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), RAYS.mat, n);
  RAYS.mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3);
  RAYS.mesh.frustumCulled = false; RAYS.mesh.renderOrder = 5; RAYS.n = n;
  for (let i = 0; i < n; i++) RAYS.items.push({ x: 0, z: 0, w: 2, len: 26, ph: rng() * TAU, ok: false, age: 0 });
  scene.add(RAYS.mesh);
  if (!$('vig')) { const v = document.createElement('div'); v.id = 'vig'; v.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:1;background:radial-gradient(ellipse at 50% 45%,rgba(0,0,0,0) 56%,rgba(8,6,2,.34) 100%)'; document.body.appendChild(v); }
}
function placeRay(r, cam) {
  for (let t = 0; t < 12; t++) {
    const ang = CAM.yaw + rr(-1.2, 1.2), d = rr(8, 45), x = cam.x + Math.sin(ang) * d, z = cam.z + Math.cos(ang) * d;
    if (!inBounds(x, z) || waterDepth(x, z) > 0 || gridAt(FOREST, x, z) < 0.45) continue;
    Object.assign(r, { x, z, w: rr(2.2, 4.6), len: rr(22, 36), ok: true, age: 0 }); return;
  }
  r.ok = false;
}
function updateRays(dt) {
  if (!RAYS.mesh) return;
  const sd = SKY.sunDir, day = clamp((sd.y - 0.1) / 0.3, 0, 1) * (1 - (G.rain || 0)) * (SKY.under ? 0 : 1) * (1 - (SKY.night || 0));
  RAYS.mesh.visible = day > 0.02; if (!RAYS.mesh.visible) return;
  RAYS.mat.opacity = 0.42 * day;
  const cam = camera.position;
  for (let i = 0; i < RAYS.n; i++) {
    const r = RAYS.items[i];
    if (!r.ok || Math.hypot(r.x - cam.x, r.z - cam.z) > 75) placeRay(r, cam);
    if (!r.ok) { _rm.makeScale(0, 0, 0); RAYS.mesh.setMatrixAt(i, _rm); continue; }
    r.age += dt;
    const gy = getH(r.x, r.z);
    _rc.set(r.x + sd.x * r.len * 0.5, gy + sd.y * r.len * 0.5, r.z + sd.z * r.len * 0.5);
    _ry.copy(sd); _rz.set(cam.x - _rc.x, cam.y - _rc.y, cam.z - _rc.z).normalize();
    _rx.crossVectors(_ry, _rz).normalize(); _rz.crossVectors(_rx, _ry);
    _rx.multiplyScalar(r.w); _ry.multiplyScalar(r.len);
    _rm.makeBasis(_rx, _ry, _rz).setPosition(_rc); RAYS.mesh.setMatrixAt(i, _rm);
    const dist = Math.hypot(r.x - cam.x, r.z - cam.z), k = (0.55 + 0.45 * Math.sin(G.t * 0.35 + r.ph)) * Math.min(1, r.age * 1.2) * clamp((75 - dist) / 25, 0, 1) * clamp((dist - 4) / 6, 0, 1);
    RAYS.mesh.setColorAt(i, _rcol.setRGB(k, k, k));
  }
  RAYS.mesh.instanceMatrix.needsUpdate = true; RAYS.mesh.instanceColor.needsUpdate = true;
}
