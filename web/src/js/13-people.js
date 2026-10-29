// ================= PEOPLE: tribal looks per class, smoother movement, speech bubbles, greetings =================
const CLS = {
  chief: { m: 'ראש השבט', f: 'ראשת השבט', pl: 'ראש השבט', ic: '👑' },
  warrior: { m: 'לוחם', f: 'לוחמת', pl: 'לוחמים', ic: '🛡️' },
  hunter: { m: 'צייד', f: 'ציידת', pl: 'ציידים', ic: '🏹' },
  builder: { m: 'בונה', f: 'בונה', pl: 'בונים', ic: '🪓' },
  gatherer: { m: 'אוסף', f: 'אוספת', pl: 'אוספים', ic: '🧺' },
  elder: { m: 'זקן השבט', f: 'זקנת השבט', pl: 'זקנים', ic: '🪶' },
  child: { m: 'ילד', f: 'ילדה', pl: 'ילדים', ic: '🧒' }
};
const clsWord = h => { const k = CLS[h.knight ? 'knight' : h.merchant ? 'merchant' : h.cls] || CLS.hunter; return h.sex === 'f' ? k.f : k.m; };
function vxWord(h) { if (h.elite || h.cls === 'chief') return heb(h, 'ראש השבט', 'ראשת השבט'); if (h.cls) return clsWord(h); return heb(h, 'צייד', 'ציידת'); }
const SKIN = ['#9a6948', '#8b5d3d', '#a8774f', '#7f5537', '#94643f', '#b07f57'];
const CLOTH = { river: '#9a744a', fish: '#a2603e', forest: '#7c7444', own: '#a8824e' };
function hashStr(s) { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
// decorations added on top of the base body (bones: root, spine, chest, neck, head, L/R ua la ha th sh)
function tribalExtra(cls, tk, female) {
  return (R, C, MK) => {
    const B = R.map, W = n => R.wp[B[n]], paint = col(TRIBEC[tk] || '#e2a93b'), cloth = col(CLOTH[tk] || '#5a4630');
    const white = col('#efe6d2'), red = col('#b3321f'), yel = col('#e8b83a'), dark = col('#20140c'), wood = col('#6b4a2c');
    const add = (g, p, r, s, bone, c, m) => R.add(g, M(p, r, s), B[bone], c, m ?? MK);
    const torsoZ = (x, y) => { const t = clamp((y - 0.95) / 0.58, 0, 1), f = female ? 0.93 : 1; const rx = t < 0.35 ? lerp(0.152, 0.142, t / 0.35) : t < 0.78 ? lerp(0.142, 0.18 * f, (t - 0.35) / 0.43) : lerp(0.18 * f, 0.1, Math.pow((t - 0.78) / 0.22, 1.4)); const rz = t < 0.35 ? lerp(0.105, 0.094, t / 0.35) : t < 0.78 ? lerp(0.094, 0.12, (t - 0.35) / 0.43) : lerp(0.12, 0.07, Math.pow((t - 0.78) / 0.22, 1.4)); return rz * Math.sqrt(Math.max(0, 1 - (x / rx) ** 2)); };
    // waist cloth: a skirt for women, front and back flaps for men and boys
    if (female) {
      add(new THREE.CylinderGeometry(0.168, 0.235, 0.34, 14, 1, true), [0, 0.83, 0], null, [1, 1, 0.78], 'root', cloth);
      for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; add(new THREE.BoxGeometry(0.03, 0.06, 0.008), [Math.sin(a) * 0.235, 0.67, Math.cos(a) * 0.235 * 0.78], [0, a, 0], null, 'root', i % 2 ? paint : white, 0); }
      add(new THREE.CylinderGeometry(0.172, 0.17, 0.1, 18, 1, true), [0, 1.3, 0.004], null, [1, 1, 0.7], 'chest', paint);
    } else {
      const fl = cls === 'child' ? 0.17 : 0.24;
      add(new THREE.BoxGeometry(0.16, fl, 0.012), [0, 0.975 - fl / 2, 0.12], [0.1, 0, 0], null, 'root', cloth);
      add(new THREE.BoxGeometry(0.19, fl * 0.85, 0.012), [0, 0.975 - fl * 0.42, -0.118], [-0.1, 0, 0], null, 'root', cloth);
      for (let i = 0; i < 5; i++) add(new THREE.BoxGeometry(0.022, 0.05, 0.006), [-0.064 + i * 0.032, 0.975 - fl - 0.02, 0.12 + fl * 0.1], [0.1, 0, 0], null, 'root', i % 2 ? paint : white, 0);
    }
    add(new THREE.TorusGeometry(0.16, 0.013, 5, 20), [0, 0.985, 0], [Math.PI / 2, 0, 0], [1, 0.74, 1], 'root', paint);
    // a necklace of beads
    if (cls !== 'child' || female) {
      add(new THREE.TorusGeometry(0.075, 0.008, 5, 16), [0, 1.475, 0.012], [Math.PI / 2 - 0.35, 0, 0], null, 'chest', dark);
      for (let i = 0; i < 7; i++) { const a = -0.9 + i * 0.3; add(new THREE.SphereGeometry(0.013, 6, 5), [Math.sin(a) * 0.08, 1.445 - Math.cos(a) * 0.012, 0.035 + Math.cos(a) * 0.05], null, null, 'chest', i % 2 ? white : (cls === 'chief' ? yel : red), 0); }
    }
    // face paint: two stripes on each cheek
    if (cls !== 'child') for (const s of [-1, 1]) for (const dy of [0, -0.014]) add(new THREE.BoxGeometry(0.034, 0.006, 0.006), [s * 0.056, 1.648 + dy, 0.09], [0, s * 0.62, 0], null, 'head', cls === 'warrior' ? red : paint, 0);
    // arm bands
    if (cls !== 'child') for (const n of ['L', 'R']) { const A = W(n + 'ua'); add(new THREE.TorusGeometry(0.056, 0.011, 5, 14), [A.x, A.y - 0.085, A.z], [Math.PI / 2, 0, 0], null, n + 'ua', paint); }
    // chest paint
    if (cls === 'warrior' || cls === 'chief') {
      for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { const x = s * (0.035 + k * 0.03), y = 1.32 - k * 0.045; add(new THREE.BoxGeometry(0.026, 0.07, 0.004), [x, y, torsoZ(x, y) + 0.003], [0, s * 0.2, s * 0.5], null, 'chest', red, 0); }
      for (const n of ['L', 'R']) { const A = W(n + 'th'); add(new THREE.BoxGeometry(0.11, 0.02, 0.004), [A.x, A.y - 0.12, 0.068], null, null, n + 'th', red, 0); }
    }
    if (cls === 'chief') {
      add(new THREE.TorusGeometry(0.104, 0.016, 6, 22), [0, 1.73, -0.008], [Math.PI / 2, 0, 0], null, 'head', paint);
      for (let i = 0; i < 13; i++) {
        const a = -1.95 + i * (3.9 / 12), x = Math.sin(a) * 0.112, z = Math.cos(a) * 0.112 - 0.008, h = 0.2 + Math.cos(a * 0.8) * 0.07;
        add(new THREE.BoxGeometry(0.032, h, 0.005), [x, 1.74 + h * 0.48, z], [-Math.cos(a) * 0.32, a, Math.sin(a) * 0.32], null, 'head', [red, yel, paint, white][i % 4], 0);
      }
      add(new THREE.BoxGeometry(0.36, 0.56, 0.014), [0, 1.17, -0.14], [-0.13, 0, 0], null, 'chest', col('#7a2a1c'));
      add(new THREE.BoxGeometry(0.38, 0.04, 0.02), [0, 1.44, -0.12], null, null, 'chest', yel, 0);
    }
    if (cls === 'warrior') {
      add(new THREE.CylinderGeometry(0.23, 0.23, 0.028, 18), [0, 1.24, -0.17], [Math.PI / 2, 0, 0], null, 'chest', paint);
      add(new THREE.TorusGeometry(0.2, 0.01, 4, 20), [0, 1.24, -0.186], null, null, 'chest', white, 0);
      add(new THREE.SphereGeometry(0.04, 8, 6), [0, 1.24, -0.19], null, null, 'chest', white, 0);
    }
    if (cls === 'hunter') {
      add(new THREE.TorusGeometry(0.43, 0.012, 5, 18, Math.PI * 0.92), [0.02, 1.2, -0.17], [0, 0, Math.PI / 2 - 1.45], null, 'chest', wood);
      add(new THREE.CylinderGeometry(0.003, 0.003, 0.84, 3), [0.025, 1.2, -0.168], [0, 0, 0.12], null, 'chest', white, 0);
    }
    if (cls === 'gatherer') {
      add(new THREE.CylinderGeometry(0.14, 0.11, 0.26, 12, 1, true), [0, 1.2, -0.21], [0.12, 0, 0], null, 'chest', col('#a8834a'));
      add(new THREE.TorusGeometry(0.14, 0.012, 5, 16), [0, 1.33, -0.225], [Math.PI / 2 + 0.12, 0, 0], null, 'chest', col('#7a5a30'));
      add(new THREE.SphereGeometry(0.09, 8, 6), [0, 1.33, -0.21], null, [1, 0.45, 1], 'chest', col('#3f7a2a'));
      add(new THREE.SphereGeometry(0.02, 6, 5), [-0.09, 1.72, 0.04], null, null, 'head', col('#e04a6a'), 0);
    }
    if (cls === 'builder') {
      const H = W('Rha');
      add(new THREE.CylinderGeometry(0.017, 0.02, 0.66, 6), [H.x, H.y + 0.24, H.z + 0.03], null, null, 'Rha', wood);
      add(new THREE.BoxGeometry(0.024, 0.11, 0.15), [H.x, H.y + 0.52, H.z + 0.1], null, null, 'Rha', col('#8d9298'), 0);
      for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.07, 0.08, 0.04), [s * 0.11, 0.97, 0.1], [0, s * -0.5, 0], null, 'root', col('#5a4028'));
    }
    if (cls === 'elder') {
      const H = W('Rha');
      add(new THREE.CylinderGeometry(0.016, 0.02, 1.25, 6), [H.x, H.y - 0.3, H.z + 0.06], null, null, 'Rha', wood);
      add(new THREE.SphereGeometry(0.03, 6, 5), [H.x, H.y + 0.31, H.z + 0.06], null, null, 'Rha', paint, 0);
    }
  };
}
// v: one of three variations of the shape (hair, beard, headwear) for the peoples of the Old World
const TPLARG = {};
function ensureTribal(cls, tk, sex, ns, v) {
  v = /^cv_/.test(tk) ? (v || 0) % 3 : 0;
  const key = `t_${cls}_${tk}_${sex}${ns ? '_ns' : ''}${v ? '_v' + v : ''}`; if (TPL[key]) return key;
  TPLARG[key] = [cls, tk, sex, !!ns, v];
  const f = sex === 'f', h = hashStr(key), skin = SKIN[h % SKIN.length];
  const hair = cls === 'elder' ? '#cfc8bd' : ['#1b120c', '#22160e', '#120c08'][h % 3];
  const o = {
    hat: 'band', female: f, sleeves: false, bracers: cls === 'warrior' || cls === 'hunter', quiver: cls === 'hunter', noSpear: !!ns || cls === 'builder' || cls === 'gatherer' || cls === 'child' || cls === 'elder',
    beard: !f && cls === 'elder' ? 'full' : 'none',
    c: { skin, shirt: skin, pants: skin, boot: skin, hair, hat: TRIBEC[tk] || '#e2a93b', belt: '#3a2a1c', rope: '#c9b07a', wood: '#6b4a2c', band: TRIBEC[tk], quiver: '#5a3d25', scarf: TRIBEC[tk] },
    extra: /^cv_/.test(tk) ? null : tribalExtra(cls, tk, f)
  };
  if (TRIBE_LAND[tk]) landDress(o, cls, tk, f, h);
  if (/^cv_/.test(tk)) civDress(o, cls, tk, f, h, v);
  if (cls === 'knight' || cls === 'merchant') roleDress(o, cls, tk, f);
  TPL[key] = buildHuman(o); return key;
}
function vxTpl(key, sex) {
  if (key && TPL[key]) return key;
  if (key && TPLARG[key]) return ensureTribal(...TPLARG[key]);
  const m = key && /^t_([a-z]+)_(.+)_([mf])(_ns)?(?:_v(\d))?$/.exec(key);
  if (m) return ensureTribal(m[1], m[2], m[3], !!m[4], +(m[5] || 0));
  return ensureTribal('gatherer', 'own', sex || 'f');
}
const vxKidTpl = sex => ensureTribal('child', 'own', sex);
// the look of a member of your tribe: a warrior with a sword carries no spear
const memberTpl = m => m.young ? vxKidTpl(m.sex) : ensureTribal(m.knight ? 'knight' : m.merchant ? 'merchant' : m.cls || 'builder', 'own', m.sex, !!(m.knight || m.merchant || (m.cls === 'warrior' && m.wpn === 'sword') || m.cls === 'hunter'));
const vxMateTpl = sex => ensureTribal(sex === 'f' ? 'gatherer' : 'hunter', 'own', sex);
function vxTemplates() {
  for (const tk of ['river', 'fish', 'forest']) { ensureTribal('chief', tk, 'm'); ensureTribal('warrior', tk, 'm'); ensureTribal('hunter', tk, 'm'); ensureTribal('gatherer', tk, 'f'); ensureTribal('child', tk, 'm'); ensureTribal('child', tk, 'f'); }
  ensureTribal('elder', 'river', 'm'); ensureTribal('elder', 'fish', 'm');
}
// give a person a new look (a new class, or growing up)
function retemplate(a, key) {
  const tpl = TPL[key]; if (!tpl || !a || a.tplKey === key || a.gone) return;
  const old = a.mesh, sk = makeSkinned(tpl);
  sk.mesh.position.copy(old.position); sk.mesh.rotation.copy(old.rotation); sk.mesh.scale.copy(old.scale); sk.mesh.visible = old.visible;
  scene.remove(old); if (old.skeleton) old.skeleton.dispose(); if (old.material && old.material.userData.own) old.material.dispose();
  a.mesh = sk.mesh; a.B = sk.B; a.bones = sk.bones; a.tpl = tpl; a.tplKey = key;
  const self = a; a.mesh.onBeforeRender = (r, s, c, g, m) => charUniforms(self, m);
  scene.add(a.mesh);
}

// ---------- human movement: blended walk and run, weight shifts, turning lean, work and social gestures ----------
function animHuman(a, dt) {
  const B = a.B, an = a.anim; an.t += dt; poseReset(a);
  let st = a.pose;
  if ((a.gestT || 0) > 0) { a.gestT -= dt; if (a.speed < 0.6 && (st === 'idle' || st === 'move')) st = a.gest; }
  if ((a.chopT || 0) > 0) { a.chopT -= dt; if (st === 'idle' || st === 'move') st = 'chop'; }
  if ((a.buildT || 0) > 0) { a.buildT -= dt; if (st === 'idle' || st === 'move') st = 'build'; }
  const spd = a.swimming ? 0 : a.speed, runK = smooth(2.1, 4.3, spd), mv = clamp(spd / 1.3, 0, 1);
  if (spd > 0.05) an.phase = (an.phase + dt * spd / lerp(1.5, 2.45, runK)) % 1;
  const ph = an.phase * TAU, s = Math.sin(ph), c = Math.cos(ph), look = clamp(a.look || 0, -1, 1), crouch = a.crouch && runK < 0.5;
  const yr = angDiff(an.ly ?? a.yaw, a.yaw) / Math.max(dt, 1e-3); an.ly = a.yaw;
  an.lean = (an.lean || 0) + (clamp(-yr * spd * 0.035, -0.2, 0.2) - (an.lean || 0)) * Math.min(1, dt * 5);
  let rootY = 0, rootX = 0, rootZ = an.lean * mv, rootYaw = s * 0.08 * mv;
  const amp = mv * lerp(0.55, 0.95, runK), kneeK = lerp(1.05, 1.85, runK);
  T(B.Lth, -s * amp - runK * 0.12 - (crouch ? 0.55 : 0)); T(B.Rth, s * amp - runK * 0.12 - (crouch ? 0.55 : 0));
  T(B.Lsh, Math.max(0, c) * amp * kneeK + 0.05 * mv + (crouch ? 0.85 : 0)); T(B.Rsh, Math.max(0, -c) * amp * kneeK + 0.05 * mv + (crouch ? 0.85 : 0));
  const armA = mv * lerp(0.5, 0.9, runK);
  T(B.Lua, s * armA, 0, 0.08 + runK * 0.06); T(B.Lla, -0.18 - mv * 0.25 - runK * 1.0);
  T(B.Rua, -s * armA * 0.35 - 0.25 - runK * 0.1, 0, -0.06); T(B.Rla, -0.35 - runK * 0.6);
  const br = Math.sin(an.t * 1.7 + a.id) * 0.02 * (1 - mv);
  T(B.spine, 0.03 + runK * 0.2 + (crouch ? 0.35 : 0), -s * 0.06 * mv, 0); T(B.chest, 0.02 + br, -s * 0.1 * mv, 0);
  T(B.neck, crouch ? -0.2 : -runK * 0.12, look * 0.5 + s * 0.05 * mv, 0); T(B.head, 0.04, look * 0.4, 0);
  rootY -= Math.abs(s) * 0.04 * amp + (crouch ? 0.22 : 0);
  if (mv < 0.2 && !crouch && (st === 'idle' || st === 'move')) {
    const w = Math.sin(an.t * 0.45 + a.id);
    rootZ += w * 0.025; TA(B.Lsh, Math.max(0, -w) * 0.12); TA(B.Rsh, Math.max(0, w) * 0.12); TA(B.Lth, -Math.max(0, -w) * 0.06); TA(B.Rth, -Math.max(0, w) * 0.06);
    if (!a.isPlayer) TA(B.neck, 0, Math.sin(an.t * 0.31 + a.id * 1.7) * 0.22, 0);
  }
  if (a.cls === 'elder') { TA(B.spine, 0.22); TA(B.neck, -0.12); }
  if (a.young && mv > 0.5) rootY -= Math.abs(Math.sin(ph * 2)) * 0.02;
  switch (st) {
    case 'aim': {
      const k = (a.windup || 0) > 5 ? 1 : clamp(1 - (a.windup || 0) / 0.55, 0, 1), still = mv < 0.25;
      if (a.aimBow) {
        // drawing a bow: the bow arm straight out front, the string hand pulled back to the cheek
        T(B.Lua, -1.45, 0.15, 0.35); T(B.Lla, -0.08); T(B.Rua, -1.35, 0, -0.55); T(B.Rla, -2.1, 0.2, 0); T(B.chest, 0.02, 0.35, 0); T(B.neck, -0.05, -0.3, 0);
        if (still) { T(B.Lth, -0.18); T(B.Rth, 0.16); T(B.Lsh, 0.1); T(B.Rsh, 0.12); }
        break;
      }
      T(B.Rua, 2.5 * k - 0.3 * (1 - k), 0, -0.25 * k); T(B.Rla, -0.3 - 0.5 * k); T(B.Lua, -1.2 * k, 0, 0.2 * k); T(B.Lla, -0.2);
      T(B.spine, 0.04, -0.45 * k, 0); if (still) { T(B.Lth, -0.35 * k); T(B.Rth, 0.3 * k); T(B.Lsh, 0.1); T(B.Rsh, 0.25 * k); } break;
    }
    case 'kneel':
      T(B.Lth, -1.45); T(B.Lsh, 1.45); T(B.Rth, -0.2); T(B.Rsh, 2.0); rootY -= 0.4;
      T(B.Rua, -1.3 + Math.sin(an.t * 2) * 0.05, 0, 0.1); T(B.Rla, -0.1); T(B.Lua, -0.5, 0, 0.15); T(B.Lla, -0.8);
      T(B.spine, 0.25); T(B.neck, 0.25, look * 0.3, 0); T(B.head, 0.1); break;
    case 'spear':
      T(B.Rua, -0.75, 0, -0.1); T(B.Rla, -0.6); T(B.Lua, -0.9, 0, 0.2); T(B.Lla, -0.5);
      T(B.spine, 0.32); T(B.neck, 0.3); T(B.head, 0.25); T(B.Lth, -0.25); T(B.Rth, 0.15); T(B.Lsh, 0.3); T(B.Rsh, 0.25); rootY -= 0.06; break;
    case 'sit':
      T(B.Lth, -1.5, 0, 0.12); T(B.Rth, -1.5, 0, -0.12); T(B.Lsh, 1.4); T(B.Rsh, 1.4); rootY -= 0.5; rootYaw = 0;
      T(B.Lua, -0.7, 0, 0.2); T(B.Rua, -0.7, 0, -0.2); T(B.Lla, -0.6); T(B.Rla, -0.6); T(B.spine, 0.18); T(B.neck, 0.15 + Math.sin(an.t * 0.3) * 0.05, look * 0.4, 0); break;
    case 'ride': {
      const sp = (a.mount ? a.mount.speed : P.ride && P.ride.speed) || 0, k = Math.sin(an.t * (3 + Math.min(12, sp) * 0.75)) * clamp(sp / 6, 0, 1);
      T(B.Lth, -1.3, 0, 0.6); T(B.Rth, -1.3, 0, -0.6); T(B.Lsh, 1.25); T(B.Rsh, 1.25); rootY -= 0.47 - Math.abs(k) * 0.05; rootYaw = 0;
      T(B.spine, 0.1 + Math.abs(k) * 0.08); T(B.Lua, -0.8, 0, 0.16); T(B.Rua, -0.8, 0, -0.16); T(B.Lla, -0.95); T(B.Rla, -0.95); T(B.neck, -0.06, look * 0.5, 0); break;
    }
    case 'sleep': case 'lie': case 'dead':
      rootZ = 1.45; rootY -= 0.78; rootYaw = 0; T(B.Lth, -0.6); T(B.Rth, -0.4); T(B.Lsh, 0.9); T(B.Rsh, 0.7); T(B.Lua, -0.6); T(B.Rua, -0.9); T(B.neck, 0.1, 0, 0.2);
      T(B.chest, Math.sin(an.t * 1.2) * 0.03); break;
    case 'swim':
      rootX = 1.15; rootY -= 0.55; rootYaw = 0; T(B.Lua, -2.6 + Math.sin(an.t * 4) * 0.8); T(B.Rua, -2.6 - Math.sin(an.t * 4) * 0.8); T(B.Lth, Math.sin(an.t * 6) * 0.3); T(B.Rth, -Math.sin(an.t * 6) * 0.3); T(B.neck, -0.9); break;
    case 'chop': {
      const k = (an.t * 1.33) % 1, up = k < 0.62 ? smooth(0, 0.62, k) : 1 - smooth(0.62, 0.8, k);
      T(B.Lua, lerp(-0.5, -2.75, up), 0, lerp(0.15, -0.25, up)); T(B.Lla, lerp(-0.25, -0.75, up));
      T(B.Rua, lerp(-0.45, -2.4, up), 0, lerp(-0.1, 0.3, up)); T(B.Rla, lerp(-0.3, -0.85, up));
      T(B.spine, lerp(0.42, 0.06, up), lerp(0.18, -0.35, up), 0); T(B.chest, lerp(0.12, -0.05, up)); T(B.neck, 0.2);
      T(B.Lth, -0.3); T(B.Rth, 0.18); T(B.Lsh, 0.3); T(B.Rsh, 0.22); rootY -= 0.05; rootYaw = 0; break;
    }
    case 'hammer': {
      const k = (an.t * 1.4) % 1, up = k < 0.55 ? smooth(0, 0.55, k) : 1 - smooth(0.55, 0.68, k);
      T(B.Rua, lerp(-0.5, -2.3, up), 0, lerp(-0.1, -0.35, up)); T(B.Rla, lerp(-0.7, -1.2, up)); T(B.Lua, -0.75, 0, 0.15); T(B.Lla, -0.9);
      T(B.spine, lerp(0.32, 0.12, up), -0.15, 0); T(B.neck, 0.3); T(B.Lth, -0.2); T(B.Rth, 0.12); T(B.Lsh, 0.2); T(B.Rsh, 0.15); rootYaw = 0; break;
    }
    case 'build': {
      const k = Math.sin(an.t * 8);
      T(B.Lth, -1.35); T(B.Lsh, 1.45); T(B.Rth, -0.25); T(B.Rsh, 1.95); rootY -= 0.38; rootYaw = 0;
      T(B.Rua, -1.25 + k * 0.45, 0, -0.1); T(B.Rla, -0.7 - Math.max(0, k) * 0.3); T(B.Lua, -0.85, 0, 0.2); T(B.Lla, -0.6);
      T(B.spine, 0.38); T(B.neck, 0.35); break;
    }
    case 'gather': {
      const k = Math.sin(an.t * 3 + a.id);
      T(B.spine, 0.78); T(B.chest, 0.18); T(B.neck, 0.3); T(B.Lth, -0.42); T(B.Rth, -0.32); T(B.Lsh, 0.55); T(B.Rsh, 0.45); rootY -= 0.12; rootYaw = 0;
      T(B.Lua, -0.75 + k * 0.25, 0, 0.12); T(B.Rua, -0.6 - k * 0.25, 0, -0.12); T(B.Lla, -0.35); T(B.Rla, -0.35); break;
    }
    case 'carry':
      T(B.Lua, -0.95, 0, 0.14); T(B.Rua, -0.95, 0, -0.14); T(B.Lla, -1.05); T(B.Rla, -1.05); TA(B.spine, -0.08); break;
    case 'wave':
      T(B.Rua, -2.7, 0, -0.35); T(B.Rla, -0.35, 0, Math.sin(an.t * 9) * 0.55); T(B.head, 0.02, look * 0.4, Math.sin(an.t * 2) * 0.08); break;
    case 'talk':
      T(B.Rua, -0.55 + Math.sin(an.t * 2.3 + a.id) * 0.28, 0, -0.12); T(B.Rla, -0.95 + Math.sin(an.t * 3.1) * 0.3); T(B.Lua, -0.3 + Math.sin(an.t * 1.7 + 1) * 0.18, 0, 0.12); T(B.Lla, -0.6);
      TA(B.head, Math.sin(an.t * 4.2) * 0.05); break;
    case 'paddle': case 'fish': {
      const fishing = st === 'fish', amp = a.isPlayer ? clamp((a.speed || 0) / 1.2, 0, 1) : 1, k = fishing ? 0 : Math.sin(an.t * (a.isPlayer ? 1.6 + Math.min(3, a.speed || 0) * 0.5 : 2.3) + a.id) * amp;
      T(B.Lth, -1.45, 0, 0.18); T(B.Rth, -1.45, 0, -0.18); T(B.Lsh, 1.3); T(B.Rsh, 1.3); rootY -= 0.52; rootYaw = 0;
      if (fishing) { T(B.spine, 0.22); T(B.Rua, -1.15 + Math.sin(an.t * 0.7) * 0.05, 0, -0.1); T(B.Rla, -0.35); T(B.Lua, -0.95, 0, 0.12); T(B.Lla, -0.5); T(B.neck, 0.2, look * 0.3, 0); }
      else { T(B.spine, 0.16 + Math.abs(k) * 0.14, k * 0.4, 0); T(B.Lua, -1.05 + k * 0.55, 0, 0.28); T(B.Lla, -0.65); T(B.Rua, -1.05 - k * 0.55, 0, -0.28); T(B.Rla, -0.65); T(B.neck, 0.04, look * 0.4 - k * 0.2, 0); }
      break;
    }
    case 'climb': {
      const k = Math.sin(an.t * 7);
      T(B.Lua, -2.6 + k * 0.4, 0, 0.2); T(B.Rua, -2.6 - k * 0.4, 0, -0.2); T(B.Lla, -0.6); T(B.Rla, -0.6);
      T(B.Lth, -0.9 - k * 0.5); T(B.Rth, -0.9 + k * 0.5); T(B.Lsh, 1.1); T(B.Rsh, 1.1); T(B.spine, 0.1); rootYaw = 0; break;
    }
    case 'cheer':
      T(B.Lua, -2.6 + Math.sin(an.t * 7) * 0.25, 0, 0.3); T(B.Rua, -2.6 - Math.sin(an.t * 7) * 0.25, 0, -0.3); T(B.Lla, -0.3); T(B.Rla, -0.3); rootY += Math.abs(Math.sin(an.t * 6)) * 0.06; break;
  }
  if (an.atk > 0) {
    an.atk -= dt; const f = clamp(an.atk / 0.45, 0, 1), kk = Math.sin(Math.PI * (1 - f));
    if (st === 'spear') { TA(B.Rua, 0.45 * kk); TA(B.Lua, 0.4 * kk); TA(B.spine, 0.15 * kk); }
    else if (st !== 'chop') { T(B.Rua, -1.1 * kk + 2.4 * f * f, 0, -0.2); T(B.spine, 0.1, 0.35 * kk, 0); }
  }
  if (an.hurt > 0) { an.hurt -= dt; TA(B.spine, -0.9 * an.hurt); TA(B.head, -0.9 * an.hurt); }
  const kk = damp(dt, st === 'chop' || st === 'build' || st === 'hammer' ? 18 : 12); poseApply(a, kk);
  const Rb = B.root; Rb.position.y += (Rb.userData.rest.y + rootY - Rb.position.y) * kk;
  Rb.rotation.x += (rootX - Rb.rotation.x) * kk; Rb.rotation.z += (rootZ - Rb.rotation.z) * kk; Rb.rotation.y += (rootYaw - Rb.rotation.y) * kk;
}
// the player's tools sit in the left hand and move with it
function showTool(kind) {
  if (!P.human || !P.a) return;
  if (COOK.toolKind !== kind || !COOK.tool) { if (COOK.tool && COOK.tool.parent) COOK.tool.parent.remove(COOK.tool); COOK.tool = toolMesh(kind); COOK.toolKind = kind; }
  const hand = P.a.B && P.a.B.Lha;
  if (hand && COOK.tool.parent !== hand) { if (COOK.tool.parent) COOK.tool.parent.remove(COOK.tool); hand.add(COOK.tool); COOK.tool.position.set(0, -0.06, 0.03); COOK.tool.rotation.set(0, 0, 0); COOK.tool.userData.bone = true; }
  COOK.tool.visible = true; COOK.toolT = 0.35;
}

// ---------- speech bubbles ----------
const BUB = { list: [], cd: 0 };
function say(a, text, dur = 3.4) {
  if (!a || !a.alive || !text) return;
  const old = BUB.list.find(b => b.a === a); if (old) { old.el.textContent = text; old.t = dur; return; }
  if (BUB.list.length >= 4) { const o = BUB.list.shift(); o.el.remove(); }
  const el = document.createElement('div'); el.className = 'vxbub'; el.textContent = text; document.body.appendChild(el);
  BUB.list.push({ a, el, t: dur });
}
function bubblesClear() { for (const b of BUB.list) b.el.remove(); BUB.list = []; }
function bubblesUpdate(dt) {
  for (let i = BUB.list.length - 1; i >= 0; i--) {
    const b = BUB.list[i]; b.t -= dt;
    if (b.t <= 0 || !b.a.alive || b.a.gone || G.mode !== 'play' || G.paused) { b.el.remove(); BUB.list.splice(i, 1); continue; }
    _tmp.set(b.a.pos.x, b.a.pos.y + b.a.height + 0.32, b.a.pos.z);
    const d = camera.position.distanceTo(_tmp); _tmp.project(camera);
    if (_tmp.z > 1 || d > 30 || !b.a.mesh.visible) { b.el.style.display = 'none'; continue; }
    b.el.style.display = 'block'; b.el.style.left = `${((_tmp.x * 0.5 + 0.5) * innerWidth).toFixed(0)}px`; b.el.style.top = `${((-_tmp.y * 0.5 + 0.5) * innerHeight).toFixed(0)}px`;
    b.el.style.opacity = Math.min(1, b.t * 2.5).toFixed(2);
  }
}
(function () {
  const st = document.createElement('style');
  st.textContent = `.vxbub{position:fixed;z-index:8;transform:translate(-50%,-100%);max-width:210px;padding:5px 11px;border-radius:12px;background:rgba(255,249,234,.94);color:#2a2016;font:500 13px/1.35 Rubik,sans-serif;direction:rtl;text-align:center;pointer-events:none;box-shadow:0 3px 10px rgba(0,0,0,.3)}
.vxbub::after{content:"";position:absolute;left:50%;bottom:-6px;margin-left:-6px;border:6px solid transparent;border-bottom:0;border-top-color:rgba(255,249,234,.94)}`;
  document.head.appendChild(st);
})();
// ---------- people notice you: they look, wave and greet ----------
const GREET = { t: 0 };
function gesture(a, pose, t) { a.gest = pose; a.gestT = t; }
function peopleUpdate(dt) {
  if (!P.human) return;
  GREET.t -= dt; if (GREET.t > 0) return; GREET.t = 0.5;
  if (BUB.list.length >= 2) return;
  const p = P.a; let n = 0;
  shQuery(p.pos.x, p.pos.z, 14, (b, d) => {
    if (n || !b.alive || b === p || b.tpl.kind !== 'human' || b.state === 'fight' || b.state === 'defend' || b.windup > 0 || b.fleeing) return;
    if (b.hunter || b.tribe) b.look = clamp(angDiff(b.yaw, Math.atan2(p.pos.x - b.pos.x, p.pos.z - b.pos.z)), -1, 1);
    if (G.t - (b.greetT || -999) < 150 || d > 11) return;
    b.greetT = G.t; n = 1;
    let line = greetLine(b); for (let k = 0; k < 4 && BUB.list.some(q => q.el.textContent === line); k++) line = greetLine(b);
    if (!line || BUB.list.some(q => q.el.textContent === line)) return;
    say(b, line); GREET.t = 1.4; if (b.speed < 0.6) gesture(b, b.young ? 'cheer' : 'wave', 1.6);
  });
}
function greetLine(b) {
  if (b.tribe) return b.young ? (b.cub ? pick([you('אבא!', 'אמא!'), you('בוא לשחק!', 'בואי לשחק!'), you('תראה מה מצאתי!', 'תראי מה מצאתי!')]) : pick(['ראש השבט!', you('שלום, ראש השבט', 'שלום, ראשת השבט'), you('תראה כמה גדלתי!', 'תראי כמה גדלתי!'), 'כשאגדל אהיה לוחם!'])) : pick([you('שמח לראות אותך', 'שמחים לראות אותך'), 'הכול בסדר בכפר', 'אנחנו כאן איתך', 'העבודה מתקדמת']);
  const c = b.camp, mem = c && campIndex(c) === VX.mem, known = c && VX.known.has(campIndex(c));
  if (b.young) return pick([you('מי אתה?', 'מי את?'), you('זר! זר!', 'זרה! זרה!'), 'יש לך חנית?']);
  if (b.cls === 'chief') return mem ? you('ברוך שובך, בן השבט', 'ברוכה השבה, בת השבט') : known ? you('שוב אתה, זר', 'שוב את, זרה') : you('אני ראש השבט. מה אתה מחפש כאן?', 'אני ראש השבט. מה את מחפשת כאן?');
  if (mem) return pick([you('שלום, אח', 'שלום, אחות'), 'הציד היה טוב?', 'ראש השבט מחפש אותך', you('בוא לשבת ליד האש', 'בואי לשבת ליד האש')]);
  if (b.cls === 'warrior') return pick([you('עצור, זר. מי אתה?', 'עצרי, זרה. מי את?'), you('תשמור על החנית שלך למטה', 'תשמרי על החנית שלך למטה'), you('דבר עם ראש השבט', 'דברי עם ראש השבט')]);
  return pick([you('שלום, זר', 'שלום, זרה'), you('אתה לא מכאן', 'את לא מכאן'), 'מאיפה באת?', you('תדבר עם ראש השבט', 'תדברי עם ראש השבט')]);
}
// ================= THE HUNTER STARTS ALONE: the first kit, talking to people, the tribe and village screens =================
// ---------- thrown into the forest: far from every camp, but near water, facing the smoke ----------
function humanSpawnPoint() {
  const camps = HUNT.camps.filter(c => !c.own && !c.gone); let best = null, bs = -1e9;
  for (let t = 0; t < 320; t++) {
    const x = rr(-JL + 40, JL - 40), z = rr(-JL + 40, JL - 40);
    if (!inBounds(x, z) || waterDepth(x, z) > 0 || getNY(x, z) < 0.9) continue;
    const h = getH(x, z); if (h < 1 || h > 22) continue;
    const ds = camps.map(c => Math.hypot(c.x - x, c.z - z)), dmin = ds.length ? Math.min(...ds) : 220;
    if (dmin < 150 || dmin > 340) continue;
    const wd = waterDist(x, z); if (wd > 55 || wd < 6) continue;
    if (trunkPush({ x, z }, 1.5)) continue;
    let bush = 0; treeScan(TREES.u, x, z, 5, () => { bush++; });
    const s = -Math.abs(dmin - 210) * 0.04 - wd * 0.05 - gridAt(FOREST, x, z) * 1.2 - bush * 0.4 + rng();
    if (s > bs) { const c = camps[ds.indexOf(dmin)]; bs = s; best = { x, z, yaw: c ? Math.atan2(c.x - x, c.z - z) : rng() * TAU }; }
  }
  return best;
}
// a knife, an axe and one spear; no bow, no arrows, almost no food
function hunterSetup(a) {
  a.pets = [];
  Object.assign(P, { spears: 1, aimT: 0, aimTgt: null, tameT: 0, tameB: null, spearT: 0, arrows: 0, hasBow: false, food: 70, water: 62 });
  P.inv = { wood: 0, fish: 0, meat: 0, cooked: 0 };
  VX.introT = 9;
  // a small clearing where you wake up, so the first look is at the jungle and not into a bush
  if (TREES.built) { const bx = a.pos.x - Math.sin(a.yaw) * 4, bz = a.pos.z - Math.cos(a.yaw) * 4; clearUnder(a.pos.x, a.pos.z, 5); clearUnder(bx, bz, 4); }
}
START_LINES.hunter = () => 'נזרקת לבד ללב הג׳ונגל: סכין, גרזן וחנית אחת. מעל העצים עולה עשן. אולי שם גרים אנשים';
// the bow has to be earned: from a tribe, or carved by a fire
function shootArrow(t) {
  const a = P.a;
  if (!P.hasBow) { if (G.t - (VX.bowT || -99) > 20) { VX.bowT = G.t; UI.notify('אין לך קשת עדיין. מקבלים קשת כשמצטרפים לשבט, או מגלפים אחת ליד אש (4 עצים)', 'bad'); } return false; }
  if ((P.arrows || 0) <= 0) return false;
  P.arrows--; showTool('bow'); a.anim.atk = 0.4; P.atkCD = 0.55; PROG.flags.arrow = 1;
  const fx = Math.sin(a.yaw), fz = Math.cos(a.yaw), sx = a.pos.x + fx * 0.4, sy = a.pos.y + 1.45, sz = a.pos.z + fz * 0.4;
  let tx, ty, tz;
  if (t) {
    const T0 = Math.hypot(t.pos.x - sx, t.pos.z - sz) / 38, v = t.vel || { x: Math.sin(t.yaw) * (t.speed || 0), y: 0, z: Math.cos(t.yaw) * (t.speed || 0) };
    tx = t.pos.x + (v.x || 0) * T0; ty = t.pos.y + t.height * 0.5 + (v.y || 0) * T0; tz = t.pos.z + (v.z || 0) * T0;
  } else { const d = camRay(); tx = camera.position.x + d.x * 40; ty = camera.position.y + d.y * 40; tz = camera.position.z + d.z * 40; }
  const D = Math.hypot(tx - sx, ty - sy, tz - sz), T = Math.max(0.05, D / 38);
  addProjectile(a, 'arrow', sx, sy, sz, (tx - sx) / T, (ty - sy) / T + 4.9 * T, (tz - sz) / T);
  AUD.play('swipe', 0.45); if (t) partnerAssist(t);
  return true;
}
// carving: at any fire, not only in a camp
function craft(kind) {
  if (!inCamp(10) && !nearFire(4.2)) { UI.notify('מגלפים ליד אש: מדורת מחנה, או מדורה שמדליקים עם 2 עצים'); return false; }
  boxStore();
  if (kind === 'bow') {
    if (P.hasBow) return false;
    if (!takeRes('wood', 4)) { UI.notify('צריך 4 עצים לקשת'); return false; }
    P.hasBow = true; PROG.flags.bow = 1; UI.notify('גילפת קשת! עכשיו צריך חצים: עץ אחד לארבעה חצים', 'good'); AUD.play('chime', 0.5); return true;
  }
  if (kind === 'spear') {
    if (!takeRes('wood', 2)) { UI.notify('צריך 2 עצים לחנית'); return false; }
    if (P.spears < P.mods.spearsMax) { P.spears++; UI.notify(`גילפת חנית חדשה (${P.spears} איתך)`, 'good'); } else { CAMPH.store.spears = (CAMPH.store.spears || 0) + 1; UI.notify('גילפת חנית. אין מקום לסחוב אותה, והיא נשמרה במחסן', 'good'); }
  } else {
    if (!P.hasBow) { UI.notify('קודם צריך קשת'); return false; }
    if (!takeRes('wood', 1)) { UI.notify('צריך עץ אחד לארבעה חצים'); return false; }
    const room = CARRY.arrows - (P.arrows || 0), add = Math.min(4, room); P.arrows = (P.arrows || 0) + add; if (add < 4) CAMPH.store.arrows = (CAMPH.store.arrows || 0) + 4 - add;
    UI.notify(`גילפת 4 חצים (${P.arrows} איתך)`, 'good');
  }
  PROG.flags.craft = 1; AUD.play('swipe', 0.4); return true;
}
// the toolbox: food, gear, carving by the fire, the camp store
function openBox() {
  if (G.mode !== 'play' || !P.human || !P.a) return;
  const st = boxStore(), here = inCamp(10), fire = nearFire(4.2), row = (ic, n, have, cap) => `<div class="irow"><div><b>${ic} ${n}</b></div><span style="display:flex;gap:8px;align-items:center">${bar(have, cap)}<b>${have}/${cap}</b></span></div>`;
  const dog = myDogs().find(d => dist2(d.pos, P.a.pos) < 4 && (d.hunger ?? 100) < 85);
  const food = `<h3>אוכל</h3>${row('🍖', 'מבושל, מוכן לאכילה', P.inv.cooked || 0, CARRY.cooked)}${row('🥩', 'בשר נא', P.inv.meat || 0, CARRY.meat)}${row('🐟', 'דגים נאים', P.inv.fish || 0, CARRY.fish)}` +
    `<div class="btns" style="flex-wrap:wrap">${(P.inv.cooked || 0) > 0 && P.food < 98 ? '<button class="btn pri" data-a="eat">לאכול מנה</button>' : ''}` +
    `${fire && rawCount() > 0 ? `<button class="btn pri" data-a="cook">לבשל הכול (${rawCount()})</button>` : ''}${dog && dogFoodAvail() ? `<button class="btn" data-a="feed">להאכיל את ${dog.name || 'הכלב'}</button>` : ''}</div>` +
    (rawCount() > 0 && !fire ? '<p class="idim">אוכל נא מבשלים ליד אש: מדורת מחנה, או מדורה שמדליקים עם 2 עצים.</p>' : '');
  const gear = `<h3>ציוד</h3>${oreBagHtml()}<div class="irow"><div><b>⚔️ ביד: ${WPN_N[P.weapon || 'spear']}</b><span>${TOUCH ? 'הכפתור "נשק" מחליף' : 'מקשים 1 2 3 או R מחליפים'}${P.hasSword ? ' · יש לך חרב' : ''}</span></div><button class="btn" data-a="ars" style="padding:6px 12px;font-size:13px">הארסנל</button></div>${row('🗡️', 'חניתות', P.spears, P.mods.spearsMax)}${P.hasBow ? row('🏹', 'חצים', P.arrows || 0, CARRY.arrows) : '<div class="irow"><div><b>🏹 קשת</b><span>עוד אין. מקבלים בשבט, או מגלפים ליד אש</span></div></div>'}${row('🪵', 'עצים', P.inv.wood || 0, CARRY.wood)}`;
  const crafts = here || fire ? `<h3>לגלף ליד האש</h3><div class="btns" style="flex-wrap:wrap"><button class="btn pri" data-a="cs"${resHave('wood') < 2 ? ' disabled' : ''}>חנית (2 🪵)</button>` +
    (P.hasBow ? `<button class="btn pri" data-a="ca"${resHave('wood') < 1 ? ' disabled' : ''}>4 חצים (1 🪵)</button>` : `<button class="btn pri" data-a="cb"${resHave('wood') < 4 ? ' disabled' : ''}>קשת (4 🪵)</button>`) + (P.hasSword ? '' : `<button class="btn pri" data-a="csw"${resHave('wood') < 5 && !((boxStore().swords || 0) > 0 && inCamp(12)) ? ' disabled' : ''}>${(boxStore().swords || 0) > 0 && inCamp(12) ? 'חרב מבית הנשק' : 'חרב (5 🪵)'}</button>`) + '</div>'
    : '<p class="idim">ליד אש אפשר לגלף חניתות, קשת וחצים.</p>';
  const camp = here ? `<h3>מחסן ${ownCamp() ? 'הכפר' : 'המחנה'}</h3><div class="cstock"><span class="cchip">🍖 ${st.cooked}</span><span class="cchip">🥩 ${st.meat}</span><span class="cchip">🐟 ${st.fish}</span><span class="cchip">🪵 ${st.wood}</span><span class="cchip">🗡️ ${st.spears}</span><span class="cchip">🏹 ${st.arrows}</span>${oreChips(st)}${st.gold ? `<span class="cchip">🪙 ${goldHave()} זהב</span>` : ''}</div>` +
    `${CAMPH.up.dry ? '<p class="idim">מתלה הייבוש הופך לאט בשר ודגים נאים במחסן לאוכל מוכן.</p>' : ''}<div class="btns" style="flex-wrap:wrap"><button class="btn" data-a="dep">להפקיד הכול</button><button class="btn" data-a="wd">לקחת מהמחסן</button></div>` : '';
  const shore = !!shoreProbe(P.a.pos.x, P.a.pos.z, 8), canoe = `<h3>סירה</h3><div class="btns"><button class="btn pri" data-a="cnoe"${resHave('wood') < 8 || !shore || P.boat ? ' disabled' : ''}>🛶 לגלף קאנו (8 🪵)</button></div><p class="idim">${shore ? 'הסירה נשארת על המים. שטים בה בנהר ובאגם, ודגים בחכה מתוכה.' : 'מגלפים קאנו על שפת נהר, אגם או נחל עמוק. בכפר אפשר לבנות מעגן, ובו קאנו לכל השבט.'}</p>`;
  const torch = `<h3>לפיד</h3><div class="btns"><button class="btn" data-a="ptorch"${resHave('wood') < 1 || P.a.swimming || P.boat ? ' disabled' : ''}>🔥 לנעוץ לפיד כאן (1 🪵)</button></div><p class="idim">לפיד נעוץ מאיר בלילה, וטורפים לא מתקרבים אליו.</p>`;
  const tools = trapsBoxHtml() + canoe + torch + `<h3>כלים</h3><p class="idim">סכין לקרב צמוד ולחיתוך בשר · גרזן לכריתת עצים · חנית${P.hasBow ? ' · קשת' : ''} · חכה ליד המים · לפיד בלילה</p>`;
  const el = uiCard('boxov', `<div class="itabs"><b style="flex:1;font-size:18px">ארגז הכלים</b><button class="ix" data-a="close" aria-label="סגירה">✕</button></div>${food}${gear}${crafts}${camp}${tools}`);
  el.onclick = e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    const A = b.dataset.a;
    if (A === 'ars') { closeCard('boxov'); openArsenal(); return; }
    if (A === 'eat') eatOne(); else if (A === 'feed') { DOGF.target = dog; CLB.latch = false; feedDog(); } else if (A === 'cook') { CLB.latch = false; cookTap(); closeCard('boxov'); return; }
    else if (A === 'dep') deposit(); else if (A === 'wd') withdraw(); else if (A === 'cs') craft('spear'); else if (A === 'ca') craft('arrow'); else if (A === 'cb') craft('bow'); else if (A === 'csw') craftSword(); else if (A === 'ptorch') { if (plantTorch()) { closeCard('boxov'); return; } } else if (A === 'cnoe') { if (craftCanoe()) { closeCard('boxov'); return; } } else if (A && A.startsWith('trap_')) { if (trapSet(A.slice(5))) { closeCard('boxov'); return; } }
    else { closeCard('boxov'); return; }
    openBox();
  };
}
// the player's own pose: aiming the spear, or drawing the bow when the arrow will fly
function humanPose(pose) {
  const a = P.a;
  if (P.boat && !AIMX.on && !(P.aimT > 0)) { a.aimBow = false; return ROD.phase ? 'fish' : P.sleeping ? 'sleep' : 'paddle'; }
  if (P.ride && !AIMX.on && !(P.aimT > 0)) { a.aimBow = false; return 'ride'; }
  if (P.cart && !AIMX.on && !(P.aimT > 0)) { a.aimBow = false; return 'sit'; }
  if (P.ship && !AIMX.on && !(P.aimT > 0)) { a.aimBow = false; return 'idle'; }
  if (P.aimT > 0 || AIMX.on) {
    a.aimBow = !!P.hasBow && AIMX.on && (P.weapon === 'bow' || (AIMX.tgt ? flyingBird(AIMX.tgt) || !(P.spears > 0) : !(P.spears > 0)));
    if (a.aimBow) showTool('bow');
    return 'aim';
  }
  a.aimBow = false;
  if (pose === 'eat' || pose === 'drink' || P.tameT > 0) return 'kneel';
  if (pose === 'lie') return 'sit';
  if (pose === 'sleep' || pose === 'swim' || pose === 'move' || pose === 'idle') return pose;
  return a.speed > 0.15 ? 'move' : 'idle';
}
// ---------- the gold button: what the hunter can do right here ----------
// more things the gold button can do, added by later parts of the game: in a vehicle first, then on foot
const XCTX_TOP = [], XCTX = [];
function hunterCtx() {
  const a = P.a; if (ROD.phase || BLD.mode) return null;
  for (const f of XCTX_TOP) { const c = f(); if (c) return c; }
  { const rc = rideCtx(); if (rc) return rc; }
  { const bc = boatCtx(); if (bc) return bc; }
  if (a.swimming || P.boat) return null;
  // keep doing what the button is already doing: chopping the same tree, building the same house
  const held = KEYS.KeyE || INPUT.use, te = CAMPH.treeEnt;
  if (held && P.ctx === 'wood' && te && !te.cut && Math.hypot(te.x - a.pos.x, te.z - a.pos.z) < treeTrunkR(te) + a.rad + 1.7) return 'wood';
  if (held && P.ctx === 'build' && siteNear()) return 'build';
  { const fc = foundCtx(); if (fc) return fc; }
  if (WAR.caps.length && captiveNear()) return 'free';
  if (siteNear()) return 'build';
  for (const f of XCTX) { const c = f(); if (c) return c; }
  { const tc = trapCtx(); if (tc) return tc; }
  { const t = talkTarget(); if (t) { TALK.t = t; return 'talk'; } }
  if (!TOUCH && (P.inv.cooked || 0) > 0 && P.food < 60) return 'meal';
  { const ck = cookCtx(); if (ck) return ck; }
  { const fd = feedCtx(); if (fd) return fd; }
  const fx = Math.sin(a.yaw), fz = Math.cos(a.yaw);
  if (P.water > 85 && waterDepth(a.pos.x + fx * 3, a.pos.z + fz * 3) > 0.4 && waterDepth(a.pos.x, a.pos.z) < 0.5) return 'rod';
  { let cw = null; shQuery(a.pos.x, a.pos.z, 2.8, b => { if (!cw && b.alive && b.cowCamp && b.milkDay !== G.day) cw = b; }); if (cw) { CAMPH.cow = cw; return 'milk'; } }
  if (inCamp(8) && (ownCamp() || memberCamp() === CAMPH.camp)) return 'camp';
  { const cb = clearCtx(), e = treeNearest(a.pos.x, a.pos.z, 4.5, q => Math.hypot(q.x - a.pos.x, q.z - a.pos.z) < treeTrunkR(q) + a.rad + 1.15);
    if (e && !(cb && (P.ctx === 'clearBrush' && held || clearBeforeTree(e)))) { if (CAMPH.treeEnt !== e) { CAMPH.treeEnt = e; CAMPH.woodT = 0; } return 'wood'; }
    if (cb) return cb; }
  return cookLow();
}

// ---------- talking to people ----------
const TALK = { t: null };
CTXT.talk = ['talk', 'לדבר', 'לדבר עם מי שמולך'];
function talkTarget() {
  const a = P.a; let best = null, bs = -1e9; const fx = Math.sin(a.yaw), fz = Math.cos(a.yaw);
  shQuery(a.pos.x, a.pos.z, 3.6, (b, d) => {
    if (b === a || !b.alive || b.gone || b.hidden || b.tpl.kind !== 'human' || b.duel || b.fleeing || b.state === 'fight' || b.state === 'defend' || b.windup > 0 || b.brain === 'leaver' || b.brain === 'captive' || b.raider || enemyOf(b)) return;
    if (!(b.hunter || b.tribe || b.isPartner || b.cub) || d > 2.4 + b.rad) return;
    const dot = d > 0.01 ? ((b.pos.x - a.pos.x) * fx + (b.pos.z - a.pos.z) * fz) / d : 1; if (dot < 0.35 && d > 1.1) return;
    const s = dot * 2 - d + (b.cls === 'chief' ? 1.5 : 0) - (b.young ? 1 : 0); if (s > bs) { bs = s; best = b; }
  });
  return best;
}
CTXH.talk = () => { if (CLB.latch) return; CLB.latch = true; const t = TALK.t; if (t && t.alive) talkOpen(t); };
const foodHave = () => (P.inv.meat || 0) + (P.inv.cooked || 0) + (P.inv.fish || 0);
const LORE = ['שבט גדל רק ליד מים. בלי מים אין כפר, ובלי כפר אין שבט', 'כשכורתים יותר מדי, היער כועס. החיות זוכרות מי לקח להן את הבית',
  'כשהכפר גדל, צריך לוחמים שישמרו עליו, ומגדל שרואה רחוק', 'בלילה הלפיד שומר עליך. טורפים לא אוהבים אש', 'כלבי יער אפשר לאלף בבשר. הם צדים לצידך',
  'קפיברות רועות ליד הנהר בבוקר. שם הציד קל', 'מי שמביא בשר לשבט, השבט זוכר אותו'];
function talkOpen(t) {
  P.eating = false;
  const a = P.a; t.yaw = Math.atan2(a.pos.x - t.pos.x, a.pos.z - t.pos.z); t.look = 0;
  if (t.speed < 0.6) gesture(t, 'talk', 4);
  PROG.flags.talk = 1;
  if (t.tribe || t.isPartner || t.cub) { talkOwn(t); return; }
  if (t.hunter && t.camp) talkNpc(t);
}
const whoHead = (t, sub) => `<div class="vxwho"><span class="vxic">${(CLS[t.cls] || CLS.hunter).ic}</span><div><h2>${t.name}</h2><p class="idim">${sub}</p></div></div>`;
function talkNpc(t, said) {
  const c = t.camp, i = campIndex(c), mem = i === VX.mem, tr = campTrust(i), food = foodHave();
  if (!VX.known.has(i)) { VX.known.add(i); PROG.flags.foundTribe = 1; }
  if (t.young) { say(t, pick(['מי אתה?', 'יש לך חנית!', 'אבא שלי הכי חזק בשבט', 'בוא לשחק איתנו!']), 2.6); return; }
  const chief = t.cls === 'chief', q = VX.quest && VX.quest.c === i ? VX.quest : null, btns = [];
  if (chief) PROG.flags.talkChief = 1;
  let line = said || '', info = '';
  if (chief && mem) {
    const nx = RANKS[VX.rank + 1];
    line = line || pick(['הציד שלך מאכיל את הילדים שלנו', 'אני סומך עליך יותר בכל יום', 'שמור על השבט, והשבט ישמור עליך']);
    info = `<p class="idim">${you('אתה', 'את')} ${rankName(VX.rank)}${nx ? `. עוד ${Math.max(0, nx.at - VX.pts)} כבוד לדרגת ${nx.n}` : '. זו הדרגה הגבוהה ביותר'}</p>`;
    btns.push(`<button class="btn pri" data-a="feedTribe"${food ? '' : ' disabled'}>${food ? `לתת לשבט ${Math.min(food, 5)} מנות אוכל (+כבוד)` : 'אין לך אוכל לתת'}</button>`);
    btns.push(`<button class="btn" data-a="wife">${P.sex === 'f' ? 'לבקש בעל מהשבט' : 'לבקש אישה מהשבט'}</button>`);
    if (!ownCamp() && canFound()) btns.push('<button class="btn" data-a="found">להקים שבט משלי</button>');
    btns.push('<button class="btn" data-a="leave">לעזוב את השבט</button>');
  } else if (chief) {
    const pw = c.civ ? (c.cap ? 'ממלכה' : campKindName(c)) : 'שבט';
    line = line || (tr < 15 ? `זר. מה אתה מחפש ב${pw} שלי?` : tr < 40 ? 'אני זוכר אותך. אתה עוד לא אחד מאיתנו' : c.civ ? 'השערים שלנו פתוחים בפניך' : 'השבט שלנו פתוח בפניך');
    if (P.sex === 'f' && tr < 40) line = tr < 15 ? `זרה. מה את מחפשת ב${pw} שלי?` : 'אני זוכר אותך. את עוד לא אחת מאיתנו';
    info = `<div class="vxtrust"><span>אמון</span><i><b style="width:${Math.round(clamp(tr, 0, 100))}%"></b></i></div>` + (q ? `<p class="idim">המשימה: להביא לשבט ${q.need} מנות בשר (${q.have}/${q.need})</p>` : '');
    if (VX.mem >= 0) info += `<p class="idim">${you('אתה', 'את')} כבר ${rankName(VX.rank)} ב${memberCamp() ? memberCamp().tribe : 'שבט אחר'}. אפשר לעבור לשבט הזה.</p>`;
    if (!ownCamp()) btns.push(`<button class="btn pri" data-a="join">לבקש להצטרף ל${pw}</button>`);
    if (q) btns.push(`<button class="btn pri" data-a="quest"${food ? '' : ' disabled'}>${food ? `לתת בשר למשימה (${Math.min(food, q.need - q.have)})` : 'צריך בשר, דגים או אוכל מבושל'}</button>`);
    btns.push(`<button class="btn" data-a="gift"${food >= 2 ? '' : ' disabled'}>מתנה: 2 מנות אוכל (+אמון)</button>`);
    btns.push('<button class="btn" data-a="wife">' + (P.sex === 'f' ? 'לבקש בעל מהשבט' : 'לבקש אישה מהשבט') + '</button>');
    btns.push(`<button class="btn" data-a="lore">לשאול על ${isOld(c.x) ? 'הארץ' : 'הג׳ונגל'}</button>`);
    if (ownCamp()) btns.push('<button class="btn" data-a="war">⚔️ יחסים, מתנות ואתגרים</button>');
    if (!atWar(i)) btns.push('<button class="btn" data-a="trade">🪙 לקנות ולמכור</button>');
  } else {
    line = line || greetLine(t);
    const fem = t.sex === 'f', can = t.sex !== P.a.sex && !t.consent && aliveMates().length < maxMates();
    if (can) btns.push(`<button class="btn pri" data-a="court">${fem ? 'לבקש אותה לאישה' : 'לבקש אותו לבעל'}</button>`);
    btns.push(`<button class="btn" data-a="give1"${food ? '' : ' disabled'}>לתת ${heb(t, 'לו', 'לה')} אוכל (+אמון)</button>`);
    btns.push('<button class="btn" data-a="chief">איפה ראש השבט?</button>');
    if (t.cls === 'hunter' || t.cls === 'warrior') btns.push('<button class="btn" data-a="prey">איפה יש ציד?</button>');
    if (t.cls === 'elder') btns.push('<button class="btn" data-a="lore">לבקש עצה</button>');
    if (!atWar(i) && !mem) btns.push('<button class="btn" data-a="trade">🪙 לקנות ולמכור</button>');
  }
  { const fb = ferryButton(c); if (fb) btns.push(fb); }
  btns.push('<button class="btn" data-a="close">להיפרד</button>');
  const sub = `${chief ? (c.civ && c.cap ? `${vxWord(t)} ${c.realm || c.tribe}` : `${heb(t, 'ראש', 'ראשת')} ${c.tribe}`) : `${c.civ ? vxWord(t) : clsWord(t)} ב${c.tribe}`}${mem ? ' · השבט שלך' : ''}`;
  const el = uiCard('talkov', `${whoHead(t, sub)}<p class="vxsay">"${line}"</p>${info}<div class="btns vxbtns">${btns.join('')}</div>`);
  el.onclick = e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    const A = b.dataset.a, again = s => talkNpc(t, s);
    if (A === 'close') { closeCard('talkov'); return; }
    if (A === 'ferry') { closeCard('talkov'); ferryCard(c, () => talkNpc(t)); return; }
    if (A === 'war') { closeCard('talkov'); openWar('tribes', i); return; }
    if (A === 'trade') { closeCard('talkov'); tradeCard(i, () => { closeCard('campov'); talkNpc(t); }); return; }
    if (A === 'join') {
      if ((tr >= 40 || (P.renown || 0) >= 4) && rng() < 0.95) { closeCard('talkov'); joinTribe(c, `${t.name} מקבל אותך לשבט`); return; }
      if (!q) { const need = c.deep ? 5 : 4; VX.quest = { c: i, need, have: 0 }; addTrust(i, 5); PROG.flags.quest = 1; UI.notify(`המשימה של ${c.tribe}: להביא לראש השבט ${need} מנות בשר`, 'good'); again(`תביא לשבט ${need} מנות בשר, ואז ${you('תהיה אחד', 'תהיי אחת')} מאיתנו`); return; }
      again('קודם תביא את הבשר'); return;
    }
    if (A === 'quest' && q) {
      const n = Math.min(foodHave(), q.need - q.have); payFood(n); q.have += n; addTrust(i, n * 3); AUD.play('eat', 0.4);
      if (q.have >= q.need) { VX.quest = null; addTrust(i, 40); closeCard('talkov'); joinTribe(c, 'הבאת את הבשר. ראש השבט מקבל אותך'); return; }
      again(`עוד ${q.need - q.have}. השבט רעב`); return;
    }
    if (A === 'gift') { payFood(2); addTrust(i, 12); AUD.play('eat', 0.4); again('מתנה טובה. השבט לא שוכח'); return; }
    if (A === 'feedTribe') { const n = Math.min(foodHave(), 5); payFood(n); addTrust(i, n); addPts(n, 'האכלת את השבט'); again(pick(['הילדים יאכלו הלילה', 'כך עושה בן שבט אמיתי', 'הציד שלך טוב'])); return; }
    if (A === 'wife') { closeCard('talkov'); wifeList(c); return; }
    if (A === 'found') { closeCard('talkov'); FOUND.mode = true; UI.notify('צריך ללכת למקום שטוח, לפחות 100 מ׳ מכל שבט ועד 60 מ׳ ממים. שם כפתור הזהב יציע "להקים מחנה"', 'good'); return; }
    if (A === 'leave') { closeCard('talkov'); leaveTribe(); say(t, 'לך בשלום. תמיד יהיה לך מקום ליד האש שלנו'); return; }
    if (A === 'lore') {
      const unk = HUNT.camps.map((k, j) => [k, j]).filter(([k, j]) => !k.own && !k.gone && !k.bandit && !VX.known.has(j));
      if (unk.length && (tr >= 10 || t.cls === 'elder')) { const [k, j] = unk[0]; VX.known.add(j); P.pings.push({ x: k.x, z: k.z, t: 25 }); again(`יש עוד שבט, ${k.tribe}, ${whereIs({ pos: { x: k.x, z: k.z } })}. סימנתי לך במפה`); return; }
      again(pick(LORE)); return;
    }
    if (A === 'court') { closeCard('talkov'); P.target = t; P.courtCD = 0; doCourt(); return; }
    if (A === 'give1') { payFood(1); addTrust(i, 4); t.affinity = Math.min(100, (t.affinity || 0) + 10); AUD.play('eat', 0.4); again(pick([you('תודה. אתה נדיב', 'תודה. את נדיבה'), 'אוכל טוב. תודה', 'אני אספר לראש השבט'])); return; }
    if (A === 'chief') { const ch = c.hunters.find(h => h.alive && h.cls === 'chief'); closeCard('talkov'); if (ch) { trackWay(ch); say(t, 'הוא שם, ליד האש'); } else UI.notify('לשבט הזה אין עכשיו ראש שבט', 'bad'); return; }
    if (A === 'prey') {
      let best = null, bd = 1e9; shQuery(c.x, c.z, 240, (x, d) => { if (x.alive && HUNTER_PREY.includes(x.spId) && !x.pet && !x.young && d > 25 && d < bd) { bd = d; best = x; } });
      if (best) { P.pings.push({ x: best.pos.x, z: best.pos.z, t: 25 }); again(`ראיתי ${best.sp.he} ${whereIs(best)}. סימנתי לך במפה`); } else again('הציד התרחק מכאן. צריך ללכת רחוק');
    }
  };
}
// choosing a wife (or a husband) from a tribe, then the chief decides
function wifeList(c) {
  const want = P.sex === 'f' ? 'm' : 'f', L = c.hunters.filter(h => h.alive && !h.young && h.sex === want && h.cls !== 'chief' && h.cls !== 'elder' && !h.consent);
  if (aliveMates().length >= maxMates()) { UI.notify(P.sex === 'f' ? 'כבר יש לך בעל' : `כבר יש לך ${maxMates()} נשים`); return; }
  if (!L.length) { UI.notify(P.sex === 'f' ? 'אין כרגע בשבט הזה גבר פנוי' : 'אין כרגע בשבט הזה אישה פנויה', 'bad'); return; }
  const el = uiCard('talkov', `<h2>${P.sex === 'f' ? 'מי מבני השבט?' : 'מי מבנות השבט?'}</h2><p class="idim">ראש השבט צריך להסכים. אפשר לבקש, להביא מתנה, או להילחם בו.</p><div class="btns vxbtns">${L.map((h, k) => `<button class="btn pri" data-k="${k}">${h.name} · ${clsWord(h)}</button>`).join('')}<button class="btn" data-a="close">לא עכשיו</button></div>`);
  el.onclick = e => {
    const b = e.target.closest('button'); if (!b) return; closeCard('talkov');
    const h = L[+b.dataset.k]; if (!h || !h.alive) return;
    if (!consentAsk(h)) { P.target = h; doCourt(); }
  };
}
function trackWay(m) { setWay(m.pos.x, m.pos.z, false, m.name || 'היעד'); VX.track = m; }
// your own people: their work, coming along, children
function ownLine(t) {
  const st = boxStore(), food = st.cooked + st.meat + st.fish, s = BLD.sites[0];
  if (t.young) return (t.cubHunger || 0) > 55 ? heb(t, 'אני רעב...', 'אני רעבה...') : pick([you('תראה מה מצאתי!', 'תראי מה מצאתי!'), 'מתי אני אצא איתך לצוד?', you('בוא נשחק!', 'בואי נשחק!'), heb(t, 'אני כבר גדול!', 'אני כבר גדולה!')]);
  if (CLAN.hungry > 0.3) return 'אנחנו רעבים. צריך עוד ציידים ואוספים, או להביא אוכל למחסן';
  if (!ownCamp()) return pick(['לאן הולכים?', 'אני איתך', 'כשיהיה לנו מחנה משלנו, השבט יגדל']);
  if (popCount() >= housing() && rng() < 0.5) return 'אין מקום לאנשים חדשים. צריך לבנות עוד בתים';
  switch (t.cls) {
    case 'builder': return s ? `אנחנו בונים ${BTYPES[s.t].n}. ${Math.round(clamp(s.work / BTYPES[s.t].work, 0, 1) * 100)}% מוכן` : 'אין מה לבנות. אני כורת עצים למחסן';
    case 'hunter': return wildK() < 0.6 ? 'הציד רחוק יותר מפעם. החיות עזבו את היער שלנו' : pick(['הבאתי בשר למחסן', 'ראיתי עקבות של טפיר ליד הנהר', 'הציד היה טוב היום']);
    case 'gatherer': return `יש במחסן ${food} מנות אוכל${CLAN.water < 20 ? '. ואני מביאה מים מהנהר' : ''}`;
    case 'warrior': return pressStage() >= 2 ? `${PRESS_N[pressStage()]}. אני שומר על הכפר` : 'הכפר בטוח. אני שומר';
  }
  return 'הכול בסדר';
}
function talkOwn(t, said) {
  const v = ownCamp(), adult = !t.young, food = foodHave(), btns = [];
  const role = t.isPartner ? (t.sex === 'f' ? 'אשתך' : 'בעלך') : t.young ? (t.cub ? heb(t, 'הבן שלך', 'הבת שלך') : kidLine(t) || heb(t, 'ילד בשבט', 'ילדה בשבט')) : [heb(t, 'בן השבט', 'בת השבט'), famLine(t)].filter(Boolean).join(' · ');
  const sub = adult ? `${clsWord(t)} · ${role}` : `${role} · ${heb(t, 'גדל', 'גדלה')} ${Math.round(clamp(t.cub ? (t.age || 0) / 60 : (t.kidAge || 0) / KID_H, 0, 1) * 100)}%`;
  if (adult) {
    btns.push(`<div class="vxcls big">${WORK.map(k => `<button class="${t.cls === k ? 'on' : ''}" data-cls="${k}">${CLS[k].ic}<small>${heb(t, CLS[k].m, CLS[k].f)}</small></button>`).join('')}</div>`);
    if (v) btns.push(`<button class="btn" data-a="escort">${t.escort ? heb(t, 'שיחזור לעבוד בכפר', 'שתחזור לעבוד בכפר') : heb(t, 'שיבוא איתי', 'שתבוא איתי')}</button>`);
    if (t.isPartner) { const m = P.a.sex === 'f' ? P.a : t; if (canPreg(m)) btns.push('<button class="btn pri" data-a="preg">להביא ילד</button>'); }
    if (!v && canFound() && !FOUND.mode) btns.push('<button class="btn pri" data-a="found">להקים שבט משלנו</button>');
  } else {
    if ((t.cubHunger || 0) > 25 && food) btns.push(`<button class="btn pri" data-a="feedKid">לתת ${heb(t, 'לו', 'לה')} לאכול</button>`);
    if (v) btns.push(`<button class="btn" data-a="kids">${P.cubsMode === 'follow' ? 'שהילדים יישארו בכפר' : 'שהילדים יבואו איתי'}</button>`);
  }
  btns.push('<button class="btn" data-a="close">להמשיך</button>');
  const el = uiCard('talkov', `${whoHead(t, sub)}<p class="vxsay">"${said || ownLine(t)}"</p><p class="idim">${doingTribe(t)} · ${hpWord(t)}</p><div class="btns vxbtns">${btns.join('')}</div>`);
  el.onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.cls) { if (t.cls !== b.dataset.cls) { setCls(t, b.dataset.cls, true); t.clsLock = true; PROG.flags.setcls = 1; saveGame(); } talkOwn(t, { warrior: 'אשמור על הכפר', hunter: 'אצא לצוד בשביל כולם', builder: 'אבנה ואכרות עצים', gatherer: 'אביא פירות ומים, ואבשל' }[t.cls]); return; }
    const A = b.dataset.a;
    if (A === 'escort') { t.escort = !t.escort; t.job = null; t.hidden = false; saveGame(); talkOwn(t, t.escort ? heb(t, 'אני בא איתך', 'אני באה איתך') : 'אני חוזר לעבודה'); return; }
    if (A === 'preg') { closeCard('talkov'); startPreg(P.a.sex === 'f' ? P.a : t); return; }
    if (A === 'found') { closeCard('talkov'); FOUND.mode = true; UI.notify('צריך ללכת למקום שטוח, לפחות 100 מ׳ מכל שבט ועד 60 מ׳ ממים. שם כפתור הזהב יציע "להקים מחנה"', 'good'); return; }
    if (A === 'feedKid') { for (const k of ['cooked', 'meat', 'fish']) if ((P.inv[k] || 0) > 0) { P.inv[k]--; break; } t.cubHunger = Math.max(0, (t.cubHunger || 0) - 50); AUD.play('eat', 0.5); talkOwn(t, 'תודה!'); return; }
    if (A === 'kids') { P.cubsMode = P.cubsMode === 'follow' ? 'den' : 'follow'; saveGame(); talkOwn(t); return; }
    closeCard('talkov');
  };
}
const hpWord = t => { const k = t.hp / t.maxHp; return k > 0.8 ? 'בריא' : k > 0.45 ? 'פצוע קל' : 'פצוע קשה'; };
// what a member of your tribe is doing right now
function doingTribe(m) {
  const g = (x, y) => heb(m, x, y), j = m.job, v = ownCamp();
  if (!m.alive) return g('מת', 'מתה');
  if (m.brain === 'captive') return g('שבוי אצל האויב', 'שבויה אצל האויב');
  if (m.state === 'fight') return g('נלחם!', 'נלחמת!');
  if (j && j.k === 'raid') { const p = j.p; if (p && p.phase === 'loot' && m.lt && m.lt.k !== 'done') return m.lt.k === 'horse' ? g('לוקח סוס', 'לוקחת סוס') : g('אוסף שלל', 'אוספת שלל'); return `${p && (p.phase === 'home' || m.rret) ? g('חוזר מפשיטה על', 'חוזרת מפשיטה על') : g('בפשיטה על', 'בפשיטה על')} ${p ? campName(p.to) : ''}`; }
  if (j && j.k === 'caravan') return `${j.ph === 'back' ? g('חוזר עם שיירה מ', 'חוזרת עם שיירה מ') : j.ph === 'trade' ? g('סוחר עם ', 'סוחרת עם ') : g('בדרך עם שיירה אל ', 'בדרך עם שיירה אל ')}${campName(j.i)}`;
  if (m.onTower || m.towerB) return g('שומר במגדל', 'שומרת במגדל');
  if (j && j.k === 'boat') return j.ph === 'fish' ? g('דג בסירה', 'דגה בסירה') : g('שט בסירה', 'שטה בסירה');
  if (m.inCart) return g('יושב בכרכרה', 'יושבת בכרכרה');
  if (j && j.k === 'ship') return g('מפליג לדוג בספינה', 'מפליגה לדוג בספינה');
  if (m.inShip) return g('על הספינה', 'על הספינה');
  if (j && j.k === 'cart') return j.ph === 'load' ? g('מעמיס עצים על הכרכרה', 'מעמיסה עצים על הכרכרה') : g('נוהג בכרכרה', 'נוהגת בכרכרה');
  if (j && j.k === 'flee') return g('בורח מסכנה', 'בורחת מסכנה');
  if (!v || m.escort || (m.young && P.cubsMode === 'follow')) return g('הולך איתך', 'הולכת איתך');
  if (m.hidden) return g('ישן בבית', 'ישנה בבית');
  if (m.young) return isNight() ? g('ישן', 'ישנה') : g('משחק בכפר', 'משחקת בכפר');
  if (isNight() && m.pose === 'sleep') return g('ישן', 'ישנה');
  if (!j) return g('נח', 'נחה');
  switch (j.k) {
    case 'patrol': return g('שומר על הכפר', 'שומרת על הכפר');
    case 'rest': return j.talk ? g('מדבר ליד האש', 'מדברת ליד האש') : g('נח ליד האש', 'נחה ליד האש');
    case 'scout': return g('מחפש ציד', 'מחפשת ציד');
    case 'hunt': return `${g('צד', 'צדה')} ${j.t && j.t.sp ? j.t.sp.he : ''}`;
    case 'collect': return g('אוסף את הטרף', 'אוספת את הטרף');
    case 'bring': return j.w != null ? g('מביא עצים למחסן', 'מביאה עצים למחסן') : g('מביא בשר למחסן', 'מביאה בשר למחסן');
    case 'build': return `${g('בונה', 'בונה')} ${j.s ? BTYPES[j.s.t].n : ''}`;
    case 'fell': return g('כורת עץ', 'כורתת עץ');
    case 'clear': return g('מנקה שיחים וגדמים', 'מנקה שיחים וגדמים');
    case 'food': return g('אוסף פירות', 'אוספת פירות');
    case 'water': return g('מביא מים', 'מביאה מים');
    case 'home': return j.what === 'fish' ? g('מביא דגים למחסן', 'מביאה דגים למחסן') : j.what === 'food' ? g('מביא אוכל למחסן', 'מביאה אוכל למחסן') : g('חוזר לכפר', 'חוזרת לכפר');
    case 'tame': return j.ph === 'lead' ? g('מוביל סוס לכפר', 'מובילה סוס לכפר') : j.ph === 'calm' ? g('מרגיע סוס בר', 'מרגיעה סוס בר') : g('הולך לעדר הסוסים', 'הולכת לעדר הסוסים');
    case 'shore': return j.there ? g('דג מהגדה', 'דגה מהגדה') : g('הולך לדוג', 'הולכת לדוג');
  }
  return '';
}

// ---------- founding: your own tribe, near water ----------
function foundHtml() {
  if (!P.human || ownCamp()) return '';
  if (FOUND.mode) return '<h3>שבט משלך</h3><p class="idim">צריך ללכת למקום שטוח, לפחות 100 מ׳ מכל שבט ועד 60 מ׳ ממים (נהר, אגם או נחל). שם כפתור הזהב יציע "להקים מחנה".</p><div class="btns"><button class="btn" data-a="foundCancel">לבטל</button></div>';
  if (!canFound()) return `<h3>שבט משלך</h3><p class="idim">${P.sex === 'f' ? 'כשתמצאי בעל, בהסכמת ראש השבט שלו' : 'כשתמצא אישה, בהסכמת ראש השבט שלה'}, אפשר להקים שבט משלך.</p>`;
  return '<h3>שבט משלך</h3><p class="idim">אפשר להקים שבט חדש במקום אחר, ליד מים. כל המשפחה עוברת איתך, ואנשים חדשים יגיעו כשיהיה מקום ואוכל.</p><div class="btns"><button class="btn pri" data-a="found">להקים שבט משלי</button></div>';
}
function foundCamp() {
  const old = memberCamp(), c = foundCampAt(P.a.pos.x, P.a.pos.z, false);
  if (old) { addTrust(VX.mem, 15); VX.mem = -1; VX.rank = 0; VX.pts = 0; UI.notify(`נפרדת מ${old.tribe} בברכה. הם יזכרו אותך`, 'good'); }
  VX.quest = null; FOUND.mode = false;
  for (const m of clanReal()) { m.escort = false; m.job = null; m.hidden = false; if (m.home) m.home.set(c.x, 0, c.z); }
  CLAN.dayK = G.day; CLAN.pmK = G.day; CLAN.hungry = 0; BLD.tier = 0; PRESS.day = G.day;
  setTimeout(() => UI.notify('עכשיו הבית שלך כאן. ליד המדורה: מסך הכפר. בונים בתים כדי שאנשים חדשים יבואו לגור', 'good'), 3800);
  saveGame();
  return c;
}

// ---------- the village screen: home, people, building, store ----------
const VSCR = { tab: 'home' };
const HOUSES = () => BLD.list.filter(b => b.done && (b.t === 'hut' || b.t === 'house' || b.t === 'long' || b.t === 'hall')).length;
const VNAME = ['המחנה שלך', 'הכפר שלך', 'הכפר הגדול שלך', 'העיירה שלך', 'העיר שלך'];
const vxVillageName = () => CLAN.tname || VNAME[Math.max(0, villageTier())] || VNAME[0];
// the tribe's own name, given by its chief: letters, digits, spaces and a few marks, never markup or direction marks
function tribeNameClean(s) { return typeof s === 'string' ? s.replace(/[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2066-\u2069<>&"'`]/g, '').replace(/\s+/g, ' ').trim().slice(0, 24) : ''; }
function tribeRename() {
  const el = uiCard('renov', `<h2>✏️ שם לשבט</h2><p>השם מופיע במסך הכפר, במפה, ברשימת המשחקים ובעולם המשותף. בלי שם, הכפר נקרא לפי הגודל שלו.</p>` +
    `<input id="renIn" type="text" maxlength="24" dir="rtl" autocomplete="off" placeholder="${VNAME[Math.max(0, villageTier())] || VNAME[0]}">` +
    `<div class="btns"><button class="btn pri" data-a="ok">שמירה</button><button class="btn" data-a="close">ביטול</button></div>`);
  const inp = el.querySelector('#renIn'); inp.value = CLAN.tname || ''; setTimeout(() => { try { inp.focus(); } catch (e) { /* phones decide themselves */ } }, 50);
  const done = ok => { if (ok) { const n = tribeNameClean(inp.value); CLAN.tname = n; UI.notify(n ? `🏳️ מעכשיו השבט נקרא ${n}` : 'השבט נקרא שוב לפי הגודל של הכפר', 'good'); saveGame(); } closeCard('renov'); campMenu(); };
  el.onclick = e => { const b = e.target.closest('button'); if (b) done(b.dataset.a === 'ok'); };
  inp.onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter') done(true); if (e.key === 'Escape') done(false); };
}
// the road from a camp to a city: every stage, what it asks for, what it opens, and how far you are
const TIER_IC = ['🔥', '🛖', '🏘️', '🏛️', '🏙️'];
function tierReqText(t, h, live) {
  const R = TIER_REQ[t]; if (!R) return 'המדורה שלך והשבט הראשון';
  const ok = (have, need) => live ? (have >= need ? ' ✓' : ` (${have})`) : '';
  const out = [`👥 ${R.pop} אנשים${ok(h.pop, R.pop)}`];
  if (R.houses) out.push(`🏠 ${R.houses} בתים${ok(h.houses, R.houses)}`);
  if (R.hall) out.push(`🏛️ בית המועצה${live ? (h.hall ? ' ✓' : ' (עוד אין)') : ''}`);
  return out.join(' · ');
}
function tierTodo(t, h) {
  const R = TIER_REQ[t], out = []; if (!R) return '';
  if (h.pop < R.pop) out.push(`עוד ${R.pop - h.pop} אנשים: בתים חדשים מושכים מצטרפים, וזוגות מביאים ילדים`);
  if (h.houses < (R.houses || 0)) out.push(`עוד ${R.houses - h.houses} בתים`);
  if (R.hall && !h.hall) out.push(BLD.list.some(b => b.t === 'hall') ? 'לסיים את בית המועצה' : `לבנות בית המועצה (נפתח כשיש ${BTYPES.hall.need} אנשים, ${BTYPES.hall.wood} עצים)`);
  return out.join(' · ');
}
function tierLadderHtml(tier) {
  const h = tierHave(), unl = t => DEFT.filter(k => BTYPES[k].tier === t && t > 0).map(k => BTYPES[k].n);
  const rows = TIERN.map((n, t) => {
    const st = t <= tier ? 'done' : t === tier + 1 ? 'next' : 'lock', R = TIER_REQ[t], u = unl(t);
    let bar = '';
    if (st === 'next' && R) { const parts = [Math.min(1, h.pop / R.pop)]; if (R.houses) parts.push(Math.min(1, h.houses / R.houses)); if (R.hall) parts.push(h.hall ? 1 : 0); bar = `<div class="tlbar"><i style="width:${Math.round(parts.reduce((a, b) => a + b, 0) / parts.length * 100)}%"></i></div><span class="tltodo">${tierTodo(t, h)}</span>`; }
    return `<div class="tl ${st}"><i>${st === 'done' ? '✓' : TIER_IC[t]}</i><div><b>${n}${t === tier ? ' <small>· עכשיו</small>' : ''}</b><span>${tierReqText(t, h, st === 'next')}</span>${bar}${u.length ? `<em>נפתחים: ${u.join(', ')}</em>` : ''}</div></div>`;
  }).join('');
  return `<h3>שלבי הכפר</h3><div class="tlad">${rows}</div><p class="idim">אנשים: כל מי שגר בכפר, גם תושבים שבאו לגור בבתים. בתים: בקתה, בית, בית ארוך ובית המועצה.</p>`;
}
(function () {
  const st = document.createElement('style');
  st.textContent = `.vxren{background:none;border:0;cursor:pointer;font-size:15px;padding:0 4px;opacity:.7;vertical-align:middle}.vxren:hover{opacity:1}#renIn{width:100%;box-sizing:border-box;padding:10px 12px;border-radius:11px;border:1px solid var(--line);background:var(--panel2);color:var(--ink);font:500 16px Rubik,sans-serif;margin:4px 0 8px}
.tlad{display:flex;flex-direction:column;gap:6px;margin:4px 0 6px}.tl{display:flex;gap:10px;align-items:flex-start;padding:8px 10px;border:1px solid var(--line);border-radius:12px}.tl>i{flex:0 0 26px;height:26px;border-radius:50%;display:grid;place-items:center;font-style:normal;font-size:14px;background:var(--track)}.tl>div{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1}.tl b{font-size:14px}.tl b small{font-weight:400;color:var(--gold)}.tl span{font-size:12.5px;color:var(--dim);line-height:1.4}.tl em{font-style:normal;font-size:12px;color:var(--dim)}.tl.done{opacity:.72}.tl.done>i{background:rgba(120,170,80,.3);color:#4f8a34}.tl.next{border-color:var(--gold);background:rgba(232,176,75,.09)}.tl.next span{color:var(--ink)}.tl.lock{opacity:.6}.tlbar{height:6px;border-radius:4px;background:var(--track);overflow:hidden;margin:3px 0 1px}.tlbar i{display:block;height:100%;background:var(--gold);border-radius:4px}.tl .tltodo{color:var(--dim)}`;
  document.head.appendChild(st);
})();
function villageHtml() {
  const v = ownCamp(), tier = Math.max(0, villageTier()), pop = popCount(), cap = housing(), st = boxStore();
  const food = st.cooked + st.meat + st.fish, perDay = clanAdults().length * 6 + clanReal().filter(m => m.young).length * 2 + CLAN.residents * 5 + 6, days = food / perDay;
  const ps = pressStage(), wd = Math.round(waterDist(v.x, v.z));
  return `<div class="vxhero"><b>${vxVillageName()} <button class="vxren" data-a="rename" aria-label="לתת שם לשבט" title="לתת שם לשבט">✏️</button></b><span>${TIERN[tier]} · ${pop} אנשים · ${you('אתה ראש השבט', 'את ראשת השבט')}</span></div>` +
    `<div class="istat"><div><span>אנשים</span><b>${pop} / ${cap} מקומות</b></div><div><span>אוכל במחסן</span><b>${food} / ${foodCap()} (${days >= 1 ? `ל-${Math.floor(days)} ימים` : 'פחות מיום'})</b></div>` +
    `<div><span>מים</span><b>${wd} מ׳ מהמדורה</b></div><div><span>מבנים</span><b>${BLD.list.filter(b => b.done && !BTYPES[b.t].def).length}${BLD.sites.filter(q => !BTYPES[q.t].def).length ? ` (+${BLD.sites.filter(q => !BTYPES[q.t].def).length} בבנייה)` : ''}</b></div>` +
    `<div><span>👥 האמון בך</span><b class="${POL.sup < 30 ? 'vxbad' : POL.sup < 45 ? 'vxwarn' : ''}">${supWord(POL.sup)} (${Math.round(POL.sup)}%)</b></div><div><span>🤝 בני ברית</span><b>${polAllies('own').length ? polAllies('own').map(campName).join(', ') : 'אין'}</b></div>` +
    `<div><span>⭐ ${DEP.away ? 'אחראי עכשיו' : you('אחראי כשאתה יוצא', 'אחראי כשאת יוצאת')}</span><b>${(() => { const m = DEP.away ? depWho() : depPick(); return m ? `${m.name} · ${depRankWord(m, depRankOf(m))}` : 'אין אף אחד'; })()}</b></div>` +
    `<div><span>עצים כרותים</span><b>${TREES.cut}${TREES.cutList.some(e => e.sap > 0) ? ` · 🌱 ${TREES.cutList.filter(e => e.sap > 0).length} צומחים` : ''}</b></div><div><span>היער סביב</span><b>${Math.round(forestK() * 100)}%</b></div>` +
    `<div><span>חיות בג׳ונגל</span><b>${Math.round(wildK() * 100)}%</b></div><div><span>החיות</span><b class="${ps >= 3 ? 'vxbad' : ps >= 2 ? 'vxwarn' : ''}">${PRESS_N[ps]}</b></div></div>` +
    (CLAN.hungry > 0.3 ? '<p class="vxalert">השבט רעב! צריך יותר ציידים ואוספים, או להביא אוכל למחסן</p>' : '') +
    (pop >= cap ? '<p class="vxalert">אין מקום לאנשים חדשים. צריך לבנות בתים</p>' : '') +
    tierLadderHtml(tier) +
    `<h3>המחיר של הגדילה</h3><p class="idim">${PRESS_D[ps] || 'כל עץ שנכרת וכל חיה שניצודה מרחיקים את הטבע. ככל שהשבט גדל, החיות סביבו נעשות עוינות.'}</p>` +
    warLine() + `<div class="btns" style="flex-wrap:wrap"><button class="btn pri" data-tab="orders">📣 פקודות</button><button class="btn" data-tab="build">לבנות</button><button class="btn" data-tab="people">מי עושה מה</button><button class="btn" data-a="war">⚔️ מלחמה ושלום</button><button class="btn" data-a="map">במפה</button></div>`;
}
const CLSC = { warrior: '#ef6a55', hunter: '#86d46f', builder: '#e3ae63', gatherer: '#f0a8d6', child: '#ffd0e2', chief: '#ffd34d', elder: '#d8d2c4' };
function peopleHtml() {
  const adults = clanAdults(), kids = clanReal().filter(m => m.young), cnt = k => adults.filter(m => m.cls === k).length;
  const kn = adults.filter(m => m.knight).length, me = adults.filter(m => m.merchant).length;
  // everyone in the tribe, also those who live in the houses (resMix): each one has a role
  const R = resMix(), allKids = kids.length + R.child;
  const chips = `<div class="cstock">${WORK.map(k => `<span class="cchip">${CLS[k].ic} ${CLS[k].pl} ${cnt(k) + R[k]}</span>`).join('')}${kn ? `<span class="cchip">🏇 אבירים ${kn}</span>` : ''}${me ? `<span class="cchip">💰 סוחרים ${me}</span>` : ''}${allKids ? `<span class="cchip">🧒 ילדים ${allKids}</span>` : ''}</div>${CLAN.residents ? `<p class="idim" style="margin-top:-2px">הספירה כוללת את ${CLAN.residents} התושבים שגרים בבתים (פירוט למטה)</p>` : ''}`;
  const rows = adults.map(m => { const fl = famLine(m); return `<div class="vxrow"><div class="vxrw"><b>${m.name}</b> <small>${clsWord(m)}${m.isPartner ? (m.sex === 'f' ? ' · אשתך' : ' · בעלך') : ''}${m.wpn === 'sword' && m.cls === 'warrior' && !m.knight ? ' · ⚔️' : ''}${(m.pets || []).some(q => q.alive && q.tribeDog) ? ' · 🐕' : ''}${(m.pets || []).some(q => q.alive && q.brain === 'falcon') ? ' · 🦅' : ''}</small><span>${ordDoing(m) ? `${ordDoing(m)} ` : ''}${doingTribe(m)} · ${whereIs(m)}${fl ? ` · ${fl}` : ''}</span></div><div class="vxcls"><button class="pc" data-m="${m.id}" data-a="pcard" aria-label="תפקיד ופקודה" title="תפקיד ופקודה ל${m.name}">📣</button>${WORK.map(k => `<button class="${m.cls === k ? 'on' : ''}" data-m="${m.id}" data-cls="${k}" aria-label="${CLS[k].m}">${CLS[k].ic}</button>`).join('')}<button class="${m.escort ? 'on' : ''}" data-m="${m.id}" data-a="esc" aria-label="בא איתך">🚶</button>${m.clsLock && !m.isPartner ? `<button data-m="${m.id}" data-a="unlock" aria-label="שהשבט יחליט" title="התפקיד נקבע על ידך. לחיצה: השבט יחליט">🔒</button>` : ''}</div></div>`; }).join('');
  const krows = kids.map(k => `<div class="irow"><div><b>${k.name}</b> <small>${heb(k, 'ילד', 'ילדה')}${kidLine(k) ? ` · ${kidLine(k)}` : k.cub ? ' · שלך' : ''}</small><span>${doingTribe(k)} · ${heb(k, 'גדל', 'גדלה')} ${Math.round(clamp(k.cub ? (k.age || 0) / 60 : (k.kidAge || 0) / KID_H, 0, 1) * 100)}%${(k.cubHunger || 0) > 55 ? ` · <b style="color:var(--red)">${heb(k, 'רעב', 'רעבה')}</b>` : ''}</span></div></div>`).join('');
  const auto = `<div class="vxtog"><button class="${CLAN.autoRoles ? 'on' : ''}" data-a="autoRoles">${CLAN.autoRoles ? '✓' : '○'} השבט מחלק תפקידים לבד</button><span>${CLAN.autoRoles ? 'לפי מה שחסר: אוכל, הגנה או בנייה. מי שקיבל ממך תפקיד מסומן ב-🔒 ונשאר בו' : you('רק אתה מחלק את התפקידים', 'רק את מחלקת את התפקידים')}</span></div>`;
  return chips + depHtml() + auto + '<p class="idim">🛡️ לוחמים שומרים על הכפר · 🏹 ציידים מביאים בשר · 🪓 בונים בונים וכורתים · 🧺 אוספים מביאים פירות ומים ומבשלים · 🚶 בא איתך</p>' +
    '<p class="idim">📣 פותח את הכרטיס של כל אחד: תפקיד (גם אביר וסוחר), פקודה רק לו, לבוא איתך או לחזור לגור בבתים.</p>' +
    (rows || '<p class="idim">עוד אין אנשים בשבט.</p>') + (kids.length ? `<h3>ילדים</h3>${krows}` : '') +
    residentsHtml() + famTribeHtml();
}
function buildHtml() {
  const pop = popCount(), wood = woodHave();
  const cards = Object.entries(BTYPES).filter(([, T]) => !T.def).map(([k, T]) => {
    const lockWhy = !buildUnlocked(k) ? (T.tier && Math.max(0, villageTier()) < T.tier ? `נפתח כשהמחנה הופך ל${TIERN[T.tier]}` : `נפתח בשבט של ${T.need} אנשים`) : T.needB && !BLD.list.some(q => q.done && q.t === T.needB) ? `צריך קודם ${BTYPES[T.needB].n}` : '';
    const lock = !!lockWhy, can = !lock && wood >= T.wood, n = BLD.list.filter(b => b.t === k).length;
    let note = ''; if (T.shore && !lock && T.ship) note = '<span class="unote">🌊 צריך אגם או נהר רחב ועמוק</span>'; else if (T.shore && !lock) { const hs = dockHint(); note = `<span class="unote">${hs ? `🌊 מקום טוב: ${whereIs({ pos: hs })}` : '🌊 ליד הכפר אין מים עמוקים מספיק לסירה'}</span>`; }
    return `<div class="ucard${lock ? ' lock' : ''}"><div class="uic">${T.ic}</div><b>${T.n}${n ? ` <small>(${n})</small>` : ''}</b><span>${T.d}</span>${note}<div class="ucost"><span class="cchip${wood >= T.wood ? '' : ' no'}">🪵 ${T.span ? `${T.wood}+ לפי האורך` : T.wood}</span>${T.span ? '<span class="cchip">🌉 מגדה לגדה</span>' : T.shore ? '<span class="cchip">🌊 על שפת המים</span>' : (T.water || 80) >= 500 ? '<span class="cchip">📍 בכל מקום בכפר</span>' : `<span class="cchip">💧 עד ${T.water || 80} מ׳</span>`}</div>` +
      (lock ? `<div class="ulock">${lockWhy}</div>` : `<button class="btn${can ? ' pri' : ''}" data-b="${k}"${can ? '' : ' disabled'}>${can ? 'לבחור מקום' : 'חסרים עצים'}</button>`) + '</div>';
  }).join('');
  const sites = BLD.sites.filter(s => !BTYPES[s.t].def).map(s => `<div class="irow"><div><b>${BTYPES[s.t].ic} ${BTYPES[s.t].n}</b><span>${whereIs({ pos: s })}</span></div><i class="ihp" style="flex:0 0 90px"><b style="width:${Math.round(clamp(s.work / BTYPES[s.t].work, 0, 1) * 100)}%;background:var(--gold)"></b></i></div>`).join('');
  const want = CLAN.planWant && BTYPES[CLAN.planWant] ? ` · עכשיו אוספים עצים ל${BTYPES[CLAN.planWant].n}` : '';
  const auto = `<div class="vxtog"><button class="${CLAN.autoBuild ? 'on' : ''}" data-a="autoBuild">${CLAN.autoBuild ? '✓' : '○'} הבונים מתכננים ובונים לבד</button><span>${CLAN.autoBuild ? `בתים כשחסר מקום, לפידים, מגדלים, גינות, מחסנים, מעגן, מלונה, בית נשק וכלוב עיטים, מהעצים שבמחסן${want}` : 'הבונים בונים רק מה שתבחר'}</span></div>`;
  const change = `<h3>🔧 לשנות את הכפר</h3><div class="dplan"><div><b>להזיז או להרוס מבנה</b><span>בתים, גדרות, חומות, מגדלים וכל מה שנבנה. הורסים: כל העצים שבמבנה חוזרים למחסן, גם אם עוד לא גמרו לבנות אותו. מזיזים: בלי לשלם שוב. ${TOUCH ? 'הכפתור 🔨 למעלה' : 'המקש N'} פותח את המסך הזה מכל מקום</span></div><button class="btn pri" data-a="manage">לבחור מבנה</button></div>` +
    `<div class="vxtog"><button class="${CLAN.autoClear !== false ? 'on' : ''}" data-a="autoClear">${CLAN.autoClear !== false ? '✓' : '○'} הבונים מנקים גדמים ושיחים בכפר</button><span>כשאין להם מה לבנות. גם אפשר לבד: לעמוד ליד גדם או שיח ולהחזיק את כפתור הזהב</span></div>`;
  return auto + change + `<h3>🏗️ מבנים חדשים</h3><p class="idim">יש ${wood} עצים (איתך ובמחסן). כל מבנה חייב להיות קרוב למים, על קרקע שטוחה ובתוך הכפר. עצים שעומדים בדרך נכרתים.</p><div class="ugrid">${cards}</div>` +
    (sites ? `<h3>בבנייה</h3>${sites}<p class="idim">הבונים בונים לבד. אפשר לעזור: לעמוד ליד ולהחזיק את כפתור הזהב</p>` : '') + defHtml();
}
function storeHtml() {
  const st = boxStore(), cows = ownCamp() && ownCamp().cowGroup ? ownCamp().cowGroup.members.filter(m => m.alive).length : 0;
  const ICO = { fence: '🪵', fire: '🔥', rack: '🗡️', dry: '🐟', shelter: '⛺', tents: '⛺', pen: '🐄', workshop: '🔨', tower: '🗼', walls: '🛡️' }, chip = (n, ic, ok) => `<span class="cchip${ok ? '' : ' no'}">${ic} ${n}</span>`;
  const ups = '<div class="ugrid">' + UPG.map(u => { const done = CAMPH.up[u.id], ok = canPay(u.cost); return `<div class="ucard${done ? ' done' : ''}"><div class="uic">${ICO[u.id] || '🏕️'}</div><b>${u.n}</b><span>${u.d}</span><div class="ucost">${u.cost.wood ? chip(u.cost.wood, '🪵', resHave('wood') >= u.cost.wood) : ''}${u.cost.fish ? chip(u.cost.fish, '🐟', resHave('fish') >= u.cost.fish) : ''}</div>${done ? '<div class="ubuilt">נבנה ✓</div>' : `<button class="btn${ok ? ' pri' : ''}" data-u="${u.id}"${ok ? '' : ' disabled'}>${ok ? 'לבנות' : 'חסרים חומרים'}</button>`}</div>`; }).join('') + '</div>';
  return `<h3>מחסן הכפר</h3><div class="cstock"><span class="cchip">🍖 ${st.cooked} מבושל</span><span class="cchip">🥩 ${st.meat} בשר</span><span class="cchip">🐟 ${st.fish} דגים</span><span class="cchip">🪵 ${st.wood} עצים</span><span class="cchip">🗡️ ${st.spears}</span><span class="cchip">🏹 ${st.arrows}</span>${st.swords ? `<span class="cchip">⚔️ ${st.swords} חרבות</span>` : ''}<span class="cchip">🐄 ${cows} פרות</span><span class="cchip">🪙 ${goldHave()} זהב</span>${oreChips(st)}</div>` +
    '<div class="btns" style="flex-wrap:wrap"><button class="btn" data-a="dep">להפקיד הכול</button><button class="btn" data-a="wd">לקחת מהמחסן</button><button class="btn pri" data-a="market">🪙 מסחר עם השבטים</button></div><p class="idim">מה שאיתך מופיע בארגז הכלים 🧰. הציידים, האוספים והבונים ממלאים את המחסן, וכל השבט אוכל ממנו.</p>' +
    `<h3>שדרוגים למדורה ולמחנה</h3>${ups}`;
}
function campMenu(tab) {
  if (tab) VSCR.tab = tab;
  if (!ownCamp()) { memberScreen(); return; }
  const T = [['home', 'הכפר'], ['orders', 'פקודות'], ['people', 'אנשים'], ['build', 'בנייה'], ['store', 'מחסן']];
  const body = VSCR.tab === 'orders' ? ordersHtml() : VSCR.tab === 'people' ? peopleHtml() : VSCR.tab === 'build' ? buildHtml() : VSCR.tab === 'store' ? storeHtml() : villageHtml();
  const el = uiCard('campov', `<div class="itabs">${T.map(([k, n]) => `<button data-tab="${k}" class="${VSCR.tab === k ? 'on' : ''}">${n}</button>`).join('')}<button class="ix" data-a="close" aria-label="סגירה">✕</button></div><div class="ibody">${body}</div>`);
  el.querySelector('.card').classList.add('vxcard');
  el.onclick = e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    if (b.dataset.tab) { campMenu(b.dataset.tab); return; }
    if (b.dataset.a && b.dataset.a.startsWith('ord')) { ordClick(b); return; }
    if (b.dataset.b) { closeCard('campov'); buildStart(b.dataset.b); UI.notify(BTYPES[b.dataset.b].span ? 'עומדים על הגדה ומסתכלים אל הגדה שמעבר למים: הגשר נמתח מגדה לגדה. ירוק: אפשר לבנות' : BTYPES[b.dataset.b].shore ? 'הולכים לשפת המים ומסתכלים אל המים: המעגן נצמד לגדה. ירוק: אפשר לבנות' : BTYPES[b.dataset.b].len ? 'גדר בונים בקו: הולכים למקום, מסתכלים לאן שהקו יעבור ובונים קטע אחרי קטע. כל קטע חדש ממשיך את הקודם' : 'מזיזים את המבנה בהליכה ובסיבוב המצלמה. ירוק: אפשר לבנות', 'good'); if (BTYPES[b.dataset.b].shore && !BTYPES[b.dataset.b].ship) { const hs = dockHint(true); if (hs) { P.pings.push({ x: hs.x, z: hs.z, t: 6 }); UI.notify(`מקום טוב למעגן: ${whereIs({ pos: hs })} (מסומן במפה)`, 'good'); } else UI.notify('ליד הכפר אין מים עמוקים מספיק לסירה. מעגן צריך נהר, אגם או נחל עמוק', 'bad'); } return; }
    if (b.dataset.pr) { promoteResident(b.dataset.pr); campMenu('people'); return; }
    if (b.dataset.rm) { const [k, d] = b.dataset.rm.split(':'); resShift(k, +d); campMenu('people'); return; }
    if (b.dataset.m) {
      const m = clanReal().find(q => q.id === +b.dataset.m); if (!m) return;
      if (b.dataset.a === 'pcard') { personCard(m); return; }
      if (b.dataset.a === 'depset') { depSet(m); campMenu(); return; }
      if (b.dataset.cls && m.cls !== b.dataset.cls) { setCls(m, b.dataset.cls); m.clsLock = true; PROG.flags.setcls = 1; }
      if (b.dataset.a === 'unlock') { m.clsLock = false; UI.notify(`השבט יחליט לבד מה ${m.name} ${heb(m, 'יעשה', 'תעשה')}`, 'good'); }
      if (b.dataset.a === 'esc') { if (m.ord) ordLeave(m); m.escort = !m.escort; m.job = null; m.hidden = false; UI.notify(m.escort ? `${m.name} ${heb(m, 'בא', 'באה')} איתך` : `${m.name} ${heb(m, 'חוזר', 'חוזרת')} לעבוד בכפר`, 'good'); }
      saveGame(); campMenu(); return;
    }
    if (b.dataset.u) { const u = UPG.find(q => q.id === b.dataset.u); if (u && canPay(u.cost)) { takeRes('wood', u.cost.wood || 0); takeRes('fish', u.cost.fish || 0); CAMPH.up[u.id] = 1; applyCampUp(u.id, true); PROG.flags.campup = 1; UI.notify(`בנית: ${u.n}`, 'good'); AUD.play('chime'); saveGame(); } campMenu(); return; }
    const A = b.dataset.a;
    if (A === 'depauto') { depAutoSet(); campMenu(); return; }
    if (A === 'rename') { tribeRename(); return; }
    if (A === 'war') { closeCard('campov'); openWar(); return; }
    if (A === 'defRing') {
      keepRingClear(); const t = b.dataset.t, r = defPlanRing(t, false, false, { hand: true });
      if (r && (r.made || r.left)) {
        DEF.ringWant = r.left ? t : null; PROG.flags.defPlan = 1;
        const open = r.open ? `. ${r.open > 1 ? `${r.open} מקומות נשארו פתוחים` : 'מקום אחד נשאר פתוח'}: מים עמוקים, צוק או מבנה צמוד` : '';
        UI.notify(r.made ? `🛡️ הבונים יבנו ${r.made > 1 ? `${r.made} קטעים` : 'קטע אחד'} סביב הכפר (${r.wood} עצים שולמו)${r.left ? `. עוד ${r.left > 1 ? `${r.left} קטעים` : 'קטע אחד'}, בערך ${r.leftW} עצים: הבונים יוסיפו כשיגיעו עצים למחסן` : ''}${open}`
          : `🛡️ אין עכשיו מספיק עצים. הבונים יתחילו את ${BTYPES[t].n} סביב הכפר כשיגיעו עצים למחסן (בערך ${r.leftW} עצים)`, 'good');
      } else UI.notify('אין מה להוסיף לגדר מסביב: הכפר כבר מגודר', 'bad');
      campMenu(); return;
    }
    if (A === 'defTow') { const n = defAddTowers(false, { hand: true }), c = BTYPES.walltower.wood; UI.notify(n ? `🗼 הבונים יבנו ${n > 1 ? `${n} מגדלי חומה` : 'מגדל חומה'} במקום קטעים של חומת האבן (${n * c} עצים שולמו)` : defAddTowers(true) ? `חסרים עצים: מגדל חומה עולה ${c} עצים` : 'אין איפה להוסיף מגדלים', n ? 'good' : 'bad'); campMenu(); return; }
    if (A === 'defUp') { const t = b.dataset.t, to = BTYPES[t].def.up, r = defUpgradeAll(t, { hand: true }); UI.notify(r.n ? `⬆️ הבונים ישדרגו ${r.n > 1 ? `${r.n} קטעים, אחד אחרי השני` : 'אותו'} (${r.wood} עצים שולמו). כל קטע ישן מפורק כשהחדש מוכן, והעצים שלו חוזרים למחסן${r.left ? `. עוד ${r.left > 1 ? `${r.left} קטעים מחכים` : 'קטע אחד מחכה'} לעצים: לוחצים שוב כשיש` : ''}` : r.left ? `חסרים עצים: כל ${BTYPES[to].n} עולה ${BTYPES[to].wood} עצים` : 'אין מה לשדרג', r.n ? 'good' : 'bad'); campMenu(); return; }
    if (A === 'autoRoles') { CLAN.autoRoles = !CLAN.autoRoles; CLAN.roleT = 3; saveGame(); campMenu(); return; }
    if (A === 'autoBuild') { CLAN.autoBuild = !CLAN.autoBuild; CLAN.planT = 3; saveGame(); campMenu(); return; }
    if (A === 'autoClear') { CLAN.autoClear = CLAN.autoClear === false; saveGame(); campMenu(); return; }
    if (A === 'manage') { closeCard('campov'); manageStart(); return; }
    if (A === 'eagle') { if (takeEagle()) closeCard('campov'); else campMenu(); return; }
    if (A === 'market') { tradeList(() => campMenu('store')); return; }
    if (A === 'dep') { deposit(); campMenu(); return; }
    if (A === 'wd') { withdraw(); campMenu(); return; }
    if (A === 'map') { closeCard('campov'); UI.open('map'); return; }
    if (A === 'close') closeCard('campov');
  };
}
// a member of another tribe: your rank, the people, the store, and the way to a tribe of your own
function memberScreen() {
  const c = memberCamp(); if (!c) { openInfo('tribe'); return; }
  const nx = RANKS[VX.rank + 1], ch = c.hunters.find(h => h.alive && h.cls === 'chief'), st = boxStore();
  const cnt = k => c.hunters.filter(h => h.alive && h.cls === k).length, prev = RANKS[VX.rank].at;
  const body = `<div class="vxhero"><b>${c.tribe}</b><span>ראש השבט: ${ch ? ch.name : 'אין'} · ${c.hunters.filter(h => h.alive).length} אנשים</span></div>` +
    `<div class="cstock">${['chief', 'warrior', 'hunter', 'gatherer', 'elder', 'child'].map(k => cnt(k) ? `<span class="cchip">${CLS[k].ic} ${CLS[k].pl} ${cnt(k)}</span>` : '').join('')}</div>` +
    `<h3>המעמד שלך</h3><p class="idim">${rankName(VX.rank)}${nx ? ` · עוד ${Math.max(0, nx.at - VX.pts)} כבוד לדרגת ${nx.n}` : ' · הדרגה הגבוהה ביותר'}</p>` +
    `<div class="ixp"><b style="width:${nx ? Math.round(clamp((VX.pts - prev) / (nx.at - prev), 0, 1) * 100) : 100}%"></b></div>` +
    '<p class="idim">כבוד מרוויחים כשמביאים אוכל לראש השבט וכשמגינים על השבט מטורפים. בדרגה גבוהה ראש השבט מסכים בקלות לחתונה.</p>' +
    `<h3>המחסן שלך כאן</h3><div class="cstock"><span class="cchip">🍖 ${st.cooked}</span><span class="cchip">🥩 ${st.meat}</span><span class="cchip">🐟 ${st.fish}</span><span class="cchip">🪵 ${st.wood}</span><span class="cchip">🗡️ ${st.spears}</span><span class="cchip">🏹 ${st.arrows}</span>${oreChips(st)}</div>` +
    '<div class="btns"><button class="btn" data-a="dep">להפקיד הכול</button><button class="btn" data-a="wd">לקחת מהמחסן</button></div>' + foundHtml();
  const el = uiCard('campov', `<div class="itabs"><b style="flex:1;font-size:18px">${c.tribe}</b><button class="ix" data-a="close" aria-label="סגירה">✕</button></div><div class="ibody">${body}</div>`);
  el.querySelector('.card').classList.add('vxcard');
  el.onclick = e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return; const A = b.dataset.a;
    if (A === 'dep') { deposit(); memberScreen(); return; }
    if (A === 'wd') { withdraw(); memberScreen(); return; }
    if (A === 'found') { FOUND.mode = true; closeCard('campov'); UI.notify('צריך ללכת למקום שטוח, לפחות 100 מ׳ מכל שבט ועד 60 מ׳ ממים. שם כפתור הזהב יציע "להקים מחנה"', 'good'); return; }
    if (A === 'foundCancel') { FOUND.mode = false; memberScreen(); return; }
    closeCard('campov');
  };
}
// one line about war and peace on the village screen
function warLine() {
  const w = npcIdx().filter(atWar), inc = WAR.parties.find(p => !p.done && !p.mine && p.to === 'own'), caps = WAR.caps.filter(c => c.alive).length;
  if (!w.length && !caps) return '';
  return `<h3>מלחמה ושלום</h3><p class="idim">${inc ? '⚔️ פשיטה על הכפר עכשיו! ' : ''}${w.length ? `במלחמה עם ${w.map(campName).join(' ו')}.` : ''}${caps ? ` ${caps} מאנשי השבט בשבי.` : ''}</p>`;
}
(function () {
  const st = document.createElement('style');
  st.textContent = `.vxtog{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:6px 0 8px;padding:8px 10px;border-radius:12px;background:rgba(127,127,127,.08);border:1px solid var(--line)}
.vxtog button{border:1px solid var(--line);background:transparent;color:var(--ink);border-radius:10px;padding:6px 11px;font:600 13.5px Rubik,sans-serif;cursor:pointer}.vxtog button.on{background:rgba(109,190,106,.25);border-color:rgba(109,190,106,.7)}.vxtog span{font-size:12.5px;color:var(--dim);flex:1;min-width:180px}
.vxcard{width:min(600px,95vw)!important;max-height:92vh;max-height:92dvh;overflow:auto;padding:14px 18px!important}
.ibody h3{margin:12px 0 4px;font-size:14px;color:var(--gold)}
.vxhero{display:flex;flex-direction:column;gap:2px;padding:10px 12px;margin:2px 0 8px;border-radius:12px;background:linear-gradient(135deg,rgba(232,176,75,.22),rgba(232,176,75,.06));border:1px solid rgba(232,176,75,.35)}
.vxhero b{font-family:'Karantina','Rubik',sans-serif;font-size:30px;line-height:1}.vxhero span{font-size:13px;color:var(--dim)}
.vxbad{color:var(--red)}.vxwarn{color:var(--food)}
.vxalert{margin:8px 0;padding:7px 10px;border-radius:10px;background:rgba(216,71,58,.14);border:1px solid rgba(216,71,58,.45);font-size:13.5px}
.ucard.lock{opacity:.6}.ulock{font-size:12px;color:var(--dim)}.ucard b small{color:var(--dim);font-weight:400}
.vxrow{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--line)}.vxrw small{color:var(--dim);font-size:12px}.vxrw span{display:block;font-size:12.5px;color:var(--dim)}
.vxcls{display:flex;gap:3px;flex-wrap:wrap;justify-content:flex-end}.vxcls button{border:1px solid var(--line);background:transparent;border-radius:9px;min-width:34px;height:32px;font-size:16px;cursor:pointer;color:var(--ink);padding:0 4px}
.vxcls button.on{background:var(--gold);border-color:var(--gold)}
.vxcls.big{width:100%;justify-content:center}.vxcls.big button{display:flex;flex-direction:column;align-items:center;min-width:64px;height:auto;padding:5px 8px;font-size:20px}.vxcls.big small{font-size:11.5px;margin-top:1px}
.vxwho{display:flex;gap:12px;align-items:center;margin-bottom:6px}.vxwho h2{margin:0!important}.vxwho p{margin:0!important}
.vxic{font-size:30px;width:52px;height:52px;display:grid;place-items:center;border-radius:50%;background:rgba(232,176,75,.18);border:1px solid rgba(232,176,75,.45);flex:0 0 52px}
.vxsay{font-size:15.5px;line-height:1.5;padding:8px 12px;border-radius:12px;background:rgba(127,127,127,.1);border-right:3px solid var(--gold)}
.vxbtns{justify-content:flex-start!important}.vxbtns .btn{font-size:14px}
.vxtrust{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--dim);margin:4px 0}.vxtrust i{flex:1;height:7px;border-radius:4px;background:rgba(127,127,127,.25);overflow:hidden}.vxtrust b{display:block;height:100%;background:var(--gold)}
#talkov .card{width:min(520px,94vw);max-height:92vh;max-height:92dvh;overflow:auto;text-align:right}`;
  document.head.appendChild(st);
})();
