// ================= HUNTERS & TAMING =================
const HUNT = { camps: [], spears: [], net: null, respawn: [], angry: 0, mat: null, glowTex: null };
const HUNTER_PREY = ['capybara', 'peccary', 'agouti', 'tapir', 'coati'];
const TAME_OK = ['capybara', 'coati', 'agouti', 'peccary', 'tapir', 'otter', 'ocelot', 'jaguar', 'puma', 'anteater'];
const TAME_ADULT = ['coati', 'agouti', 'capybara', 'peccary'];
const HNAMES = { m: ['תומאס', 'רפאל', 'אנטוניו', 'מטאו', 'לואיס', 'חואקין', 'פאבלו'], f: ['אנה', 'קרלה', 'לוסיה', 'מרינה', 'פאולה'] };
const UPV = new V3(0, 1, 0);
const hunterWord = h => vxWord(h);

// ---------- the human model ----------
// o: female, hair (short, long, braids, bun, topknot, ponytail, curly, bald, shaved, mane), beard (none, stubble, full,
// long, braided, goatee, mustache, droop), hat, sleeves (false bare arms, true short, 'long'), eye (colour), and gear
function buildHuman(o) {
  const R = new Rig(), C = colors(o.c), f = o.female ? 0.93 : 1, MK = o.camo ? 0 : 1, CL = 1, fem = !!o.female;
  // the colours each person may wear their own way (a body left bare keeps its "clothes" in the skin's slot)
  const tag = (k, s) => { if (C[k]) { C[k].slot = s; C[k].base = C[k].clone(); } };
  tag('skin', 1); tag('hair', 2); tag('robe', 6);
  for (const [k, s] of [['shirt', 3], ['pants', 4], ['boot', 0], ['hat', 5]]) if (C[k]) { if (o.c[k] === o.c.skin) { C[k].slot = 1; C[k].base = C.skin.base; } else if (s) tag(k, s); }
  const root = R.bone('root', -1, 0, 0.94, 0), spine = R.bone('spine', root, 0, 0.2, 0), chest = R.bone('chest', spine, 0, 0.2, 0);
  const neck = R.bone('neck', chest, 0, 0.17, 0), head = R.bone('head', neck, 0, 0.09, 0.01);
  for (const [s, n] of [[1, 'L'], [-1, 'R']]) { const u = R.bone(n + 'ua', chest, s * 0.2 * f, 0.12, -0.01); const l = R.bone(n + 'la', u, 0, -0.28, 0); R.bone(n + 'ha', l, 0, -0.25, 0.01); }
  for (const [s, n] of [[1, 'L'], [-1, 'R']]) { const t = R.bone(n + 'th', root, s * 0.095, -0.04, 0); R.bone(n + 'sh', t, 0, -0.43, 0); }
  const prof = t => {
    const rx = t < 0.35 ? lerp(0.152, 0.142, t / 0.35) : t < 0.78 ? lerp(0.142, 0.18 * f, (t - 0.35) / 0.43) : lerp(0.18 * f, 0.1, Math.pow((t - 0.78) / 0.22, 1.4));
    const rz = t < 0.35 ? lerp(0.105, 0.094, t / 0.35) : t < 0.78 ? lerp(0.094, 0.12, (t - 0.35) / 0.43) : lerp(0.12, 0.07, Math.pow((t - 0.78) / 0.22, 1.4));
    return [rx, rz];
  };
  const fz = y => prof(clamp((y - 0.95) / 0.58, 0, 1))[1];
  const skinT = (x, y) => y < 1.14 ? [root, spine, clamp((y - 0.98) / 0.16, 0, 1)] : y < 1.34 ? [spine, chest, clamp((y - 1.14) / 0.2, 0, 1)] : [chest, chest, 0];
  const pts = []; for (let i = 0; i <= 11; i++) pts.push(new V3(0, lerp(0.95, 1.53, i / 11), 0));
  R.add(loft(pts, prof, 20), null, skinT, (x, y) => y < 1.02 ? C.belt : C.shirt, CL);
  if (fem) for (const s of [-1, 1]) R.add(new THREE.SphereGeometry(1, 12, 9), M([s * 0.05, 1.318, 0.074], [0.35, 0, 0], [0.056, 0.05, 0.034]), chest, C.shirt, CL);
  R.add(new THREE.SphereGeometry(1, 14, 10), M([0, 0.95, 0], null, [0.158, 0.11, 0.112]), root, C.pants, CL);
  R.add(new THREE.BoxGeometry(0.035, 0.03, 0.012), M([0, 1.0, fz(1.0) + 0.008]), root, col('#b49a5a'), 0);
  if (o.vest) {
    const vp = []; for (let i = 0; i <= 8; i++) vp.push(new V3(0, lerp(1.01, 1.47, i / 8), 0));
    R.add(loft(vp, t => { const q = prof(clamp((lerp(1.01, 1.47, t) - 0.95) / 0.58, 0, 1)); return [q[0] + 0.014, q[1] + 0.016]; }, 18), null, skinT, C.vest, MK);
    R.add(new THREE.BoxGeometry(0.06, 0.38, 0.01), M([0, 1.25, fz(1.25) + 0.021]), chest, C.shirt, CL);
    for (const s of [-1, 1]) {
      R.add(new THREE.BoxGeometry(0.072, 0.066, 0.022), M([s * 0.088, 1.31, fz(1.31) + 0.024]), chest, mixC(C.vest, col('#000000'), 0.22), MK);
      R.add(new THREE.BoxGeometry(0.074, 0.016, 0.024), M([s * 0.088, 1.345, fz(1.31) + 0.026]), chest, mixC(C.vest, col('#000000'), 0.35), MK);
    }
  }
  if (o.bandolier) {
    const zf = fz(1.235) + (o.vest ? 0.03 : 0.014);
    R.add(new THREE.BoxGeometry(0.046, 0.54, 0.012), M([-0.005, 1.235, zf], [0, 0, 0.53]), chest, C.belt, MK);
    for (let i = 0; i < 4; i++) { const t = -0.18 + i * 0.12; R.add(new THREE.BoxGeometry(0.03, 0.04, 0.02), M([-0.005 - Math.sin(0.53) * t, 1.235 + Math.cos(0.53) * t, zf + 0.008], [0, 0, 0.53]), chest, col('#8a6a3a'), MK); }
  }
  if (!o.noPouch) for (const s of [-1, 1]) R.add(new THREE.BoxGeometry(0.07, 0.075, 0.042), M([s * 0.122, 0.985, 0.085], [0, s * -0.55, 0]), root, mixC(C.belt, col('#6b4a2c'), 0.4), MK);
  humanHead(R, o, C, neck, head, MK);
  if (o.hat === 'brim' || o.hat === 'boonie') {
    const b = o.hat === 'boonie';
    R.add(new THREE.CylinderGeometry(b ? 0.158 : 0.182, b ? 0.175 : 0.182, 0.012, 24), M([0, 1.762, -0.006]), head, C.hat, MK);
    R.add(new THREE.CylinderGeometry(b ? 0.094 : 0.088, b ? 0.106 : 0.108, b ? 0.09 : 0.1, 18), M([0, b ? 1.812 : 1.818, -0.006]), head, C.hat, MK);
    R.add(new THREE.CylinderGeometry(0.11, 0.11, 0.022, 18), M([0, 1.777, -0.006]), head, C.band, MK);
  } else if (o.hat === 'cap') {
    R.add(new THREE.SphereGeometry(1, 16, 8, 0, TAU, 0, Math.PI / 2), M([0, 1.742, -0.012], null, [0.108, 0.07, 0.114]), head, C.hat, MK);
    R.add(new THREE.BoxGeometry(0.12, 0.01, 0.09), M([0, 1.744, 0.12], [-0.12, 0, 0]), head, C.hat, MK);
  } else if (o.hat === 'bandana') {
    R.add(new THREE.SphereGeometry(1, 16, 8, 0, TAU, 0, Math.PI / 2), M([0, 1.705, -0.012], null, [0.106, 0.09, 0.114]), head, C.hat, MK);
    for (const s of [-1, 1]) R.add(new THREE.BoxGeometry(0.03, 0.1, 0.01), M([s * 0.022, 1.665, -0.122], [0.35, 0, s * 0.35]), head, C.hat, MK);
  } else if (o.hat === 'band') R.add(new THREE.CylinderGeometry(0.107, 0.107, 0.036, 18), M([0, 1.732, -0.008]), head, C.hat, MK);
  if (o.scarf) {
    R.add(new THREE.TorusGeometry(0.062, 0.022, 6, 16), M([0, 1.5, 0.004], [Math.PI / 2, 0, 0]), neck, C.scarf, MK);
    R.add(new THREE.BoxGeometry(0.056, 0.15, 0.014), M([0.03, 1.425, -0.088], [0.25, 0, -0.18]), chest, C.scarf, MK);
  }
  // arms: short sleeves (true), long sleeves ('long') or bare (false); hands with a palm, curled fingers and a thumb
  const longS = o.sleeves === 'long';
  for (const n of ['L', 'R']) {
    const u = R.map[n + 'ua'], l = R.map[n + 'la'], h = R.map[n + 'ha'], A = R.wp[u], E = R.wp[l], H = R.wp[h], sx = n === 'L' ? 1 : -1;
    const sl = o.sleeves === false ? C.skin : C.shirt, sm = o.sleeves === false ? MK : CL, fa = longS ? C.shirt : C.skin, fm = longS ? CL : MK;
    R.add(new THREE.SphereGeometry(0.054, 12, 9), M([A.x * 0.93, A.y - 0.012, A.z]), u, o.vest ? C.vest : C.shirt, o.vest ? MK : CL);
    R.add(new THREE.CylinderGeometry(0.05, 0.042, 0.28, 12), M([A.x, A.y - 0.14, A.z]), u, sl, sm);
    if (o.sleeves === false) R.add(new THREE.CylinderGeometry(0.053, 0.052, 0.07, 12), M([A.x, A.y - 0.035, A.z]), u, C.shirt, CL);
    R.add(new THREE.SphereGeometry(0.043, 10, 8), M([E.x, E.y, E.z]), u, fa, fm);
    R.add(new THREE.CylinderGeometry(0.041, 0.031, 0.25, 11), M([E.x, E.y - 0.125, E.z]), l, fa, fm);
    if (longS) R.add(new THREE.CylinderGeometry(0.037, 0.039, 0.035, 12), M([E.x, E.y - 0.232, E.z]), l, mixC(C.shirt, col('#000000'), 0.3), CL);
    if (o.bracers) R.add(new THREE.CylinderGeometry(0.045, 0.04, 0.12, 10), M([E.x, E.y - 0.17, E.z]), l, C.belt, MK);
    R.add(new THREE.SphereGeometry(1, 10, 8), M([H.x, H.y - 0.03, H.z + 0.004], null, [0.02, 0.041, 0.033]), h, C.skin, MK);
    R.add(new THREE.SphereGeometry(1, 10, 8), M([H.x - sx * 0.002, H.y - 0.074, H.z + 0.009], [0.28, 0, 0], [0.017, 0.033, 0.029]), h, C.skin, MK);
    R.add(new THREE.SphereGeometry(1, 8, 6), M([H.x - sx * 0.014, H.y - 0.044, H.z + 0.029], [0.45, 0, sx * 0.4], [0.011, 0.023, 0.011]), h, C.skin, MK);
  }
  // legs
  for (const n of ['L', 'R']) {
    const t = R.map[n + 'th'], s = R.map[n + 'sh'], A = R.wp[t], K = R.wp[s];
    R.add(new THREE.CylinderGeometry(0.079, 0.06, 0.44, 12), M([A.x, A.y - 0.22, A.z]), t, C.pants, CL);
    R.add(new THREE.SphereGeometry(0.059, 10, 8), M([K.x, K.y, K.z]), t, C.pants, CL);
    if (o.knees) R.add(new THREE.SphereGeometry(1, 10, 8), M([K.x, K.y - 0.01, K.z + 0.046], null, [0.058, 0.06, 0.03]), s, mixC(C.pants, col('#000000'), 0.35), MK);
    R.add(new THREE.CylinderGeometry(0.057, 0.048, 0.26, 11), M([K.x, K.y - 0.13, K.z]), s, C.pants, CL);
    if (o.sandals) {
      // sandals: the shin bare (or in socks), a sole and a strap over the foot
      const ft = o.c.boot === '#efe8da' ? C.boot : C.skin;
      R.add(new THREE.CylinderGeometry(0.05, 0.042, 0.21, 11), M([K.x, K.y - 0.33, K.z]), s, ft, MK);
      R.add(new THREE.SphereGeometry(1, 12, 8), M([K.x, 0.036, K.z + 0.05], null, [0.05, 0.036, 0.118]), s, ft, MK);
      R.add(new THREE.BoxGeometry(0.1, 0.014, 0.24), M([K.x, 0.007, K.z + 0.05]), s, col('#6a4a2a'), MK);
      R.add(new THREE.BoxGeometry(0.104, 0.012, 0.022), M([K.x, 0.05, K.z + 0.09]), s, col('#5a3a20'), MK);
      continue;
    }
    R.add(new THREE.CylinderGeometry(0.057, 0.053, 0.21, 11), M([K.x, K.y - 0.33, K.z]), s, C.boot, MK);
    R.add(new THREE.CylinderGeometry(0.063, 0.063, 0.028, 11), M([K.x, K.y - 0.228, K.z]), s, mixC(C.boot, col('#ffffff'), 0.12), MK);
    R.add(new THREE.SphereGeometry(1, 12, 8), M([K.x, 0.04, K.z + 0.05], null, [0.056, 0.043, 0.124]), s, C.boot, MK);
    R.add(new THREE.BoxGeometry(0.1, 0.016, 0.23), M([K.x, 0.008, K.z + 0.05]), s, mixC(C.boot, col('#000000'), 0.45), MK);
  }
  // back gear
  if (o.pack) {
    R.add(new THREE.BoxGeometry(0.27, 0.34, 0.15), M([0, 1.25, -0.175]), chest, C.pack, MK);
    R.add(new THREE.BoxGeometry(0.28, 0.06, 0.165), M([0, 1.415, -0.172]), chest, mixC(C.pack, col('#000000'), 0.25), MK);
    R.add(new THREE.CylinderGeometry(0.055, 0.055, 0.34, 10), M([0, 1.475, -0.175], [0, 0, Math.PI / 2]), chest, C.roll, MK);
    for (const s of [-1, 1]) R.add(new THREE.BoxGeometry(0.035, 0.012, 0.26), M([s * 0.09, 1.47, -0.03], [0.5, 0, 0]), chest, C.belt, MK);
  }
  if (o.net) {
    R.add(new THREE.SphereGeometry(1, 12, 10), M([0, 1.24, -0.2], null, [0.17, 0.2, 0.1]), chest, C.rope, MK);
    for (const yy of [1.16, 1.31]) R.add(new THREE.TorusGeometry(0.15, 0.011, 5, 18), M([0, yy, -0.2], [Math.PI / 2, 0, 0], [1, 0.62, 1]), chest, C.belt, MK);
    R.add(new THREE.TorusGeometry(0.072, 0.017, 6, 14), M([-0.165, 0.97, 0.02], [0, Math.PI / 2, 0]), root, C.rope, MK);
  }
  if (o.quiver) {
    const rot = new THREE.Euler(0.12, 0, -0.42), ax = new V3(0, 1, 0).applyEuler(rot), qc = new V3(0.06, 1.24, -0.2);
    R.add(new THREE.CylinderGeometry(0.05, 0.043, 0.56, 12), M([qc.x, qc.y, qc.z], [rot.x, rot.y, rot.z]), chest, C.quiver, MK);
    R.add(new THREE.TorusGeometry(0.05, 0.008, 5, 14), M([qc.x + ax.x * 0.27, qc.y + ax.y * 0.27, qc.z + ax.z * 0.27], [rot.x + Math.PI / 2, rot.y, rot.z]), chest, C.belt, MK);
    for (let i = 0; i < 3; i++) {
      const off = new V3((i - 1) * 0.024, 0, (i % 2) * 0.012), b0 = qc.clone().add(off).addScaledVector(ax, 0.42), tip = qc.clone().add(off).addScaledVector(ax, 0.77);
      R.add(new THREE.CylinderGeometry(0.008, 0.009, 0.5, 5), M([b0.x, b0.y, b0.z], [rot.x, rot.y, rot.z]), chest, C.wood, MK);
      R.add(new THREE.ConeGeometry(0.02, 0.09, 5), M([tip.x, tip.y, tip.z], [rot.x, rot.y, rot.z]), chest, col('#a7adb3'), 0);
    }
    R.add(new THREE.BoxGeometry(0.035, 0.012, 0.3), M([0.07, 1.42, -0.04], [0.55, 0, 0.42]), chest, C.belt, MK);
  }
  if (!o.noRope) R.add(new THREE.TorusGeometry(0.072, 0.017, 6, 14), M([0.165, 0.97, 0.02], [0, Math.PI / 2, 0]), root, C.rope, MK);
  if (!o.noKnife) R.add(new THREE.BoxGeometry(0.03, 0.3, 0.06), M([-0.168, 0.84, -0.05], [0, 0, 0.14]), root, C.belt, MK);
  const Hr = R.wp[R.map.Rha];
  if (o.extra) o.extra(R, C, MK);
  if (!o.noSpear) {
  R.add(new THREE.CylinderGeometry(0.014, 0.017, 1.86, 7), M([Hr.x, Hr.y + 0.31, Hr.z + 0.03]), R.map.Rha, C.wood, MK);
  R.add(new THREE.ConeGeometry(0.032, 0.19, 7), M([Hr.x, Hr.y + 1.335, Hr.z + 0.03]), R.map.Rha, col('#b3b9bf'), 0);
  R.add(new THREE.CylinderGeometry(0.021, 0.021, 0.06, 6), M([Hr.x, Hr.y + 1.215, Hr.z + 0.03]), R.map.Rha, C.rope, MK);
  for (const s of [-1, 1]) R.add(new THREE.BoxGeometry(0.004, 0.06, 0.03), M([Hr.x + s * 0.02, Hr.y + 1.17, Hr.z + 0.03], [0, 0, s * 0.4]), R.map.Rha, C.scarf || C.band, 0);
  }
  const mat = o.camo ? animMat(7, o.camoCol || '#3a4428', 8.5, 10, 'cloth') : animMat(0, null, 1, 10, 'cloth');
  return { kind: 'human', geo: R.geometry(), mat, bones: R.bones, names: R.map, o, base: R.base };
}
// the head: skull, jaw and chin, a nose with a ridge and nostrils, lips, eyes under their lids, brows, ears,
// then the hair and the beard
function humanHead(R, o, C, neck, head, MK) {
  const SK = C.skin, fem = !!o.female, jw = fem ? 0.84 : 0.9, LIP = mixC(SK, col(fem ? '#b0484a' : '#8e4c3e'), fem ? 0.42 : 0.26);
  const add = (g, p, r, s, c, m) => R.add(g, M(p, r, s), head, c, m ?? MK);
  R.add(new THREE.CylinderGeometry(0.047 * jw, 0.055 * jw, 0.14, 12), M([0, 1.54, 0.005]), neck, SK, MK);
  add(new THREE.SphereGeometry(1, 22, 16), [0, 1.666, 0.004], null, [0.092, 0.112, 0.103], SK);
  add(new THREE.SphereGeometry(1, 16, 12), [0, 1.607, 0.034], null, [0.069 * jw, 0.053, 0.074], SK);
  add(new THREE.SphereGeometry(1, 12, 9), [0, 1.583, 0.083], null, [0.025 * jw, 0.02, 0.022], SK);
  // the nose: a ridge from between the eyes down to a round tip, and the nostrils' wings
  add(new THREE.CylinderGeometry(0.0035, 0.011, 0.046, 3), [0, 1.667, 0.1045], [-0.42, 0, 0], null, SK);
  add(new THREE.SphereGeometry(1, 10, 8), [0, 1.646, 0.1155], null, [0.0125, 0.0115, 0.012], SK);
  for (const s of [-1, 1]) add(new THREE.SphereGeometry(1, 8, 6), [s * 0.0115, 1.643, 0.109], null, [0.0085, 0.0075, 0.0085], SK);
  // the lips, and the dark line where they meet
  add(new THREE.SphereGeometry(1, 12, 6), [0, 1.6215, 0.1035], [0.25, 0, 0], [0.0215, 0.0058, 0.0095], LIP);
  add(new THREE.SphereGeometry(1, 12, 6), [0, 1.6125, 0.1012], [-0.2, 0, 0], [0.0185, 0.0068, 0.0098], LIP);
  add(new THREE.BoxGeometry(0.034, 0.0022, 0.006), [0, 1.6172, 0.1075], null, null, col('#4a2620'), 0);
  // the eyes: white, iris, pupil and a glint, under an upper lid that hides their top and a thin lower lid
  const EYE = col(o.eye || '#4a3020'), cosL = Math.cos(Math.PI * 0.31), sinL = Math.sin(Math.PI * 0.31), r0 = 0.0128;
  for (const s of [-1, 1]) {
    const ex = s * 0.0335, ey = 1.686, ez = 0.0935, sc = [1.14, 0.95, 1.04];
    add(new THREE.SphereGeometry(0.0118, 12, 9), [ex, ey, ez], null, [1.12, 0.92, 1], col('#ece6dc'), 0);
    add(new THREE.SphereGeometry(1, 12, 6), [ex, ey, ez + 0.0105], null, [0.0066, 0.0066, 0.0026], EYE, 0);
    add(new THREE.SphereGeometry(1, 8, 5), [ex, ey, ez + 0.0122], null, [0.0031, 0.0031, 0.0012], col('#0a0706'), 0);
    add(new THREE.SphereGeometry(0.0014, 5, 4), [ex + 0.0024, ey + 0.0028, ez + 0.0128], null, null, col('#ffffff'), 3);
    add(new THREE.SphereGeometry(r0, 14, 6, 0, TAU, 0, Math.PI * 0.31), [ex, ey, ez], [0.2, 0, 0], sc, SK);
    add(new THREE.SphereGeometry(r0 * 0.98, 14, 4, 0, TAU, Math.PI * 0.76, Math.PI * 0.24), [ex, ey, ez], [-0.3, 0, 0], sc, SK);
    const lash = new THREE.TorusGeometry(r0 * sinL, 0.0011, 3, 14, Math.PI); lash.rotateX(Math.PI / 2); lash.translate(0, r0 * cosL, 0);
    add(lash, [ex, ey, ez], [0.2, 0, 0], sc, col('#1c120c'), 0);
    if (o.kohl) { add(new THREE.TorusGeometry(r0 * 1.05, 0.0019, 3, 16), [ex, ey, ez + 0.002], null, [1.2, 0.62, 1], col('#120c08'), 0); add(new THREE.BoxGeometry(0.014, 0.0025, 0.004), [ex + s * 0.019, ey + 0.002, ez + 0.006], [0, s * 0.5, s * 0.25], null, col('#120c08'), 0); }
    add(new THREE.BoxGeometry(0.036, fem ? 0.0062 : 0.0098, 0.012), [s * 0.0345, 1.7065, 0.0945], [0.2, s * 0.12, s * -0.08], null, C.hair, 0);
    add(new THREE.SphereGeometry(1, 10, 8), [s * 0.0915, 1.664, -0.004], [0, s * 0.3, 0], [0.013, 0.028, 0.021], SK);
    add(new THREE.SphereGeometry(1, 8, 6), [s * 0.0965, 1.663, -0.0015], [0, s * 0.3, 0], [0.0055, 0.018, 0.012], mixC(SK, col('#5a2a20'), 0.28));
  }
  humanHair(R, o, C, head, MK);
  humanBeard(R, o, C, head, MK);
}
// hair styles: a cap over the crown and one round the back, and whatever the style adds to them
function humanHair(R, o, C, head, MK) {
  const fem = !!o.female, st = o.hair || (fem ? 'ponytail' : 'short'), HC = st === 'shaved' ? mixC(C.skin, C.hair, 0.3) : C.hair;
  const add = (g, p, r, s, c) => R.add(g, M(p, r, s), head, c || HC, MK);
  const top = (k) => add(new THREE.SphereGeometry(1, 18, 11), [0, 1.728, -0.022], null, [0.099 * (k || 1), 0.068 * (k || 1), 0.104 * (k || 1)]);
  const back = (lo) => add(new THREE.SphereGeometry(1, 16, 10), [0, lo ? 1.648 : 1.668, -0.03], null, [0.097, lo ? 0.07 : 0.088, 0.083]);
  const side = (len) => { for (const s of [-1, 1]) add(new THREE.SphereGeometry(1, 10, 8), [s * 0.086, 1.668 - len * 0.5, -0.012], [0, 0, s * 0.06], [0.02, 0.05 + len * 0.5, 0.036]); };
  if (st === 'bald') { back(true); return; }
  if (st === 'shaved') { top(0.985); back(); return; }
  if (st === 'curly') {
    top(1.02); back();
    for (let k = 0; k < 16; k++) { const a = k * 2.4, h = 0.25 + (k % 4) * 0.2, r = Math.sqrt(1 - h * h); add(new THREE.SphereGeometry(0.026, 7, 5), [Math.sin(a) * r * 0.098, 1.728 + h * 0.07, -0.022 + Math.cos(a) * r * 0.1]); }
    return;
  }
  if (st === 'topknot') {
    // the top of the head shaved, the hair of the sides and back gathered into a knot laid along the crown
    back(); side(0.02);
    add(new THREE.SphereGeometry(1, 14, 8), [0, 1.712, -0.052], null, [0.094, 0.06, 0.07]);
    add(new THREE.CylinderGeometry(0.011, 0.012, 0.08, 8), [0, 1.788, -0.02], [Math.PI / 2 - 0.35, 0, 0]);
    add(new THREE.SphereGeometry(0.016, 8, 6), [0, 1.776, -0.062]);
    return;
  }
  top(); back();
  if (st === 'short') { side(0.0); return; }
  if (st === 'bob') {
    for (const s of [-1, 1]) add(new THREE.SphereGeometry(1, 10, 8), [s * 0.09, 1.62, -0.012], null, [0.03, 0.085, 0.055]);
    add(new THREE.SphereGeometry(1, 12, 10), [0, 1.62, -0.07], null, [0.1, 0.09, 0.06]);
    add(new THREE.BoxGeometry(0.15, 0.026, 0.026), [0, 1.73, 0.088], [0.35, 0, 0]);
    return;
  }
  if (st === 'mane' || st === 'long') {
    const L = st === 'long' ? 1 : 0.62;
    add(new THREE.SphereGeometry(1, 14, 12), [0, 1.67 - 0.11 * L, -0.08], [0.12, 0, 0], [0.094, 0.06 + 0.11 * L, 0.05]);
    side(0.05 + 0.06 * L); return;
  }
  if (st === 'ponytail') {
    for (let i = 0; i < 5; i++) add(new THREE.SphereGeometry(1, 9, 7), [0, 1.69 - i * 0.058, -0.118 - i * 0.012], null, [0.04 - i * 0.005, 0.048, 0.04 - i * 0.005]);
    add(new THREE.TorusGeometry(0.03, 0.007, 4, 10), [0, 1.69, -0.112], [0.3, 0, 0], null, C.hat || C.band);
    side(0.0); return;
  }
  if (st === 'bun') {
    add(new THREE.SphereGeometry(0.045, 12, 9), [0, 1.73, -0.112]);
    for (const s of [-1, 1]) add(new THREE.CylinderGeometry(0.003, 0.003, 0.13, 4), [s * 0.02, 1.745, -0.112], [0.3, 0, s * 1.1], null, C.hat || col('#d8a020'));
    side(0.0); return;
  }
  if (st === 'braids') {
    for (const s of [-1, 1]) {
      for (let i = 0; i < 8; i++) { const t = i / 7; add(new THREE.SphereGeometry(0.022 - t * 0.006, 8, 6), [s * lerp(0.075, 0.105, t), lerp(1.6, 1.36, t), lerp(-0.07, 0.065, Math.sqrt(t))]); }
      add(new THREE.CylinderGeometry(0.012, 0.012, 0.02, 8), [s * 0.106, 1.335, 0.07], null, null, C.hat || C.band);
    }
    side(0.02);
  }
}
// beards: stubble, full, long, braided, a goatee, a mustache or a drooping one
function humanBeard(R, o, C, head, MK) {
  const b = o.beard; if (!b || b === 'none' || o.female) return;
  const add = (g, p, r, s, c) => R.add(g, M(p, r, s), head, c || C.hair, MK);
  if (b === 'stubble') { add(new THREE.SphereGeometry(1, 14, 10), [0, 1.603, 0.04], null, [0.0715, 0.054, 0.072], mixC(C.skin, C.hair, 0.38)); return; }
  const must = (droop) => {
    for (const s of [-1, 1]) add(new THREE.SphereGeometry(1, 8, 6), [s * 0.012, 1.6265, 0.1085], [0, 0, s * 0.3], [0.016, 0.0062, 0.0075]);
    if (droop) for (const s of [-1, 1]) add(new THREE.CylinderGeometry(0.0035, 0.0045, 0.045, 5), [s * 0.025, 1.603, 0.104], [0, 0, s * 0.12]);
  };
  if (b === 'mustache' || b === 'droop') { must(b === 'droop'); return; }
  if (b === 'goatee') { must(false); add(new THREE.SphereGeometry(1, 10, 8), [0, 1.584, 0.094], null, [0.022, 0.028, 0.018]); return; }
  // a full beard round the jaw, low enough to leave the lips, a mustache over them
  add(new THREE.SphereGeometry(1, 16, 12), [0, 1.589, 0.046], null, [0.077, 0.06, 0.074]);
  add(new THREE.SphereGeometry(1, 12, 9), [0, 1.566, 0.08], null, [0.048, 0.04, 0.038]);
  must(false);
  if (b === 'long') add(new THREE.SphereGeometry(1, 12, 10), [0, 1.5, 0.088], [0.15, 0, 0], [0.052, 0.1, 0.04]);
  if (b === 'braided') {
    for (let i = 0; i < 5; i++) add(new THREE.SphereGeometry(0.022 - i * 0.0018, 8, 6), [0, 1.535 - i * 0.034, 0.095 + i * 0.006]);
    add(new THREE.CylinderGeometry(0.012, 0.012, 0.016, 8), [0, 1.37, 0.12], null, null, col('#c8a040'));
  }
}
function buildHunterTemplates() {
  const base = { belt: '#3a2a1c', rope: '#c9b07a', wood: '#6b4a2c', roll: '#5d6a4a', band: '#3b2a1c', quiver: '#5a3d25', vest: '#4a3b2a', scarf: '#8a3a2a', pack: '#5b4630' };
  const P = [
    // 0: the veteran (elite and the player's hunter): bandana, full beard, open vest, bandolier, quiver of spears
    { hat: 'bandana', beard: 'full', vest: true, sleeves: false, bandolier: true, quiver: true, bracers: true, knees: true, c: { skin: '#b37a52', shirt: '#6b5a3e', vest: '#3a3428', pants: '#4a4636', hat: '#9b2d22', boot: '#2a2118', hair: '#4a3f36' } },
    // 1: the trapper: wide hat, mustache, vest, a net bundle on the back and two rope coils
    { hat: 'brim', beard: 'mustache', vest: true, net: true, scarf: true, c: { skin: '#c68a5e', shirt: '#7d6c48', vest: '#5b4a32', pants: '#4a5136', hat: '#8a7650', boot: '#2e2419', hair: '#2a1d14', scarf: '#8a3a2a' } },
    // 2: the tracker: camouflage clothes, boonie hat, stubble, backpack
    { hat: 'boonie', beard: 'stubble', pack: true, scarf: true, knees: true, camo: true, camoCol: '#3a4428', c: { skin: '#8d5a3b', shirt: '#6f7a52', pants: '#5f6a46', hat: '#59623f', boot: '#2a2018', hair: '#1a120c', scarf: '#3f4a2c', pack: '#4a3a28' } },
    // 3: the huntress: headband, ponytail, vest, quiver, bracers
    { hat: 'band', female: true, vest: true, quiver: true, bracers: true, scarf: true, c: { skin: '#a8724e', shirt: '#5f6b3e', vest: '#4a3b2a', pants: '#4b4436', hat: '#2d5b8a', boot: '#2e2419', hair: '#20150e', scarf: '#2d5b8a' } }
  ];
  P.forEach((p, i) => { TPL['hunter' + i] = buildHuman(Object.assign({}, p, { c: Object.assign({}, base, p.c) })); });
}

// ---------- animation ----------
function animHuman(a, dt) {
  const B = a.B, an = a.anim, st = a.pose; an.t += dt; poseReset(a);
  const spd = a.speed, run = spd > 2.4;
  if (spd > 0.05) an.phase = (an.phase + dt * spd / (run ? 2.3 : 1.45)) % 1;
  const ph = an.phase * TAU, amp = clamp(spd / 1.5, 0, 1) * (run ? 1 : 0.62), crouch = a.crouch && !run;
  let rootY = 0, rootX = 0, rootZ = 0;
  const sl = Math.sin(ph), cl = Math.cos(ph), look = clamp(a.look || 0, -1, 1);
  T(B.Lth, -sl * amp * 0.85 - (crouch ? 0.5 : 0)); T(B.Rth, sl * amp * 0.85 - (crouch ? 0.5 : 0));
  T(B.Lsh, Math.max(0, cl) * amp * 1.5 + 0.04 + (crouch ? 0.8 : 0)); T(B.Rsh, Math.max(0, -cl) * amp * 1.5 + 0.04 + (crouch ? 0.8 : 0));
  T(B.Lua, sl * amp * 0.75, 0, 0.07); T(B.Lla, -0.25 - amp * 0.35);
  T(B.Rua, -sl * amp * 0.3 - 0.3, 0, -0.05); T(B.Rla, -0.35);
  T(B.spine, (run ? 0.22 : 0.03) + (crouch ? 0.35 : 0)); T(B.chest, 0.02 + Math.sin(an.t * 1.6) * 0.015, -sl * amp * 0.12, 0);
  T(B.neck, crouch ? -0.2 : 0, look * 0.5, 0); T(B.head, 0.04, look * 0.4, 0);
  rootY -= Math.abs(sl) * 0.035 * amp + (crouch ? 0.22 : 0);
  switch (st) {
    case 'aim': {
      const k = clamp(1 - (a.windup || 0) / 0.55, 0, 1);
      T(B.Rua, 2.5 * k - 0.3 * (1 - k), 0, -0.25 * k); T(B.Rla, -0.3 - 0.5 * k); T(B.Lua, -1.2 * k, 0, 0.2 * k); T(B.Lla, -0.2);
      T(B.spine, 0.04, -0.45 * k, 0); T(B.Lth, -0.35 * k); T(B.Rth, 0.3 * k); T(B.Lsh, 0.1); T(B.Rsh, 0.25 * k); break;
    }
    case 'kneel':
      T(B.Lth, -1.45); T(B.Lsh, 1.45); T(B.Rth, -0.2); T(B.Rsh, 2.0); rootY -= 0.4;
      T(B.Rua, -1.3 + Math.sin(an.t * 2) * 0.05, 0, 0.1); T(B.Rla, -0.1); T(B.Lua, -0.5, 0, 0.15); T(B.Lla, -0.8);
      T(B.spine, 0.25); T(B.neck, 0.25, look * 0.3, 0); T(B.head, 0.1); break;
    case 'spear':
      T(B.Rua, -0.75, 0, -0.1); T(B.Rla, -0.6); T(B.Lua, -0.9, 0, 0.2); T(B.Lla, -0.5);
      T(B.spine, 0.32); T(B.neck, 0.3); T(B.head, 0.25); T(B.Lth, -0.25); T(B.Rth, 0.15); T(B.Lsh, 0.3); T(B.Rsh, 0.25); rootY -= 0.06; break;
    case 'sit':
      T(B.Lth, -1.5, 0, 0.12); T(B.Rth, -1.5, 0, -0.12); T(B.Lsh, 1.4); T(B.Rsh, 1.4); rootY -= 0.5;
      T(B.Lua, -0.7, 0, 0.2); T(B.Rua, -0.7, 0, -0.2); T(B.Lla, -0.6); T(B.Rla, -0.6); T(B.spine, 0.18); T(B.neck, 0.15 + Math.sin(an.t * 0.3) * 0.05, look * 0.4, 0); break;
    case 'sleep': case 'lie':
      rootZ = 1.45; rootY -= 0.78; T(B.Lth, -0.6); T(B.Rth, -0.4); T(B.Lsh, 0.9); T(B.Rsh, 0.7); T(B.Lua, -0.6); T(B.Rua, -0.9); T(B.neck, 0.1, 0, 0.2); break;
    case 'swim':
      rootX = 1.15; rootY -= 0.55; T(B.Lua, -2.6 + Math.sin(an.t * 4) * 0.8); T(B.Rua, -2.6 - Math.sin(an.t * 4) * 0.8); T(B.Lth, Math.sin(an.t * 6) * 0.3); T(B.Rth, -Math.sin(an.t * 6) * 0.3); T(B.neck, -0.9); break;
  }
  if (an.atk > 0) {
    an.atk -= dt; const f = clamp(an.atk / 0.45, 0, 1), kk = Math.sin(Math.PI * (1 - f));
    if (st === 'spear') { TA(B.Rua, 0.45 * kk); TA(B.Lua, 0.4 * kk); TA(B.spine, 0.15 * kk); }
    else { T(B.Rua, -1.1 * kk + 2.4 * f * f, 0, -0.2); T(B.spine, 0.1, 0.35 * kk, 0); }
  }
  if (an.hurt > 0) { an.hurt -= dt; TA(B.spine, -0.9 * an.hurt); TA(B.head, -0.9 * an.hurt); }
  const kk = damp(dt, 12); poseApply(a, kk);
  const Rb = B.root; Rb.position.y += (Rb.userData.rest.y + rootY - Rb.position.y) * kk;
  Rb.rotation.x += (rootX - Rb.rotation.x) * kk; Rb.rotation.z += (rootZ - Rb.rotation.z) * kk;
}

// ---------- camps ----------
function pickCamps() {
  HUNT.camps.length = 0;
  for (let t = 0; t < 900 && HUNT.camps.length < 2; t++) {
    const x = rr(-370, 370), z = rr(-370, 370);
    if (!inBounds(x, z) || waterDepth(x, z) > 0) continue;
    const r = nearestOnPoly(x, z, RIVER); if (r[0] < 15 || r[0] > 38) continue;
    const h = getH(x, z); if (h < 1 || h > 24 || getNY(x, z) < 0.95) continue;
    let rough = 0; for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; rough = Math.max(rough, Math.abs(getH(x + Math.cos(a) * 6, z + Math.sin(a) * 6) - h)); }
    if (rough > 1.1) continue;
    if (Math.hypot(x - TEP.x, z - TEP.z) < 150 || (LAKE && Math.hypot(x - LAKE.x, z - LAKE.z) < 70)) continue;
    if (HUNT.camps.some(c => Math.hypot(c.x - x, c.z - z) < 230)) continue;
    const i = Math.floor(r[1]), f = r[1] - i, A = RIVER[i], B = RIVER[Math.min(RIVER.length - 1, i + 1)];
    HUNT.camps.push({ x, z, y: h, rx: A.x + (B.x - A.x) * f, rz: A.z + (B.z - A.z) * f, hunters: [], flames: [], glow: null });
  }
  pickDeepCamp();
  { const TN = ['שבט הנהר', 'שבט הדגים']; let k = 0; for (const c of HUNT.camps) c.tribe = c.deep ? 'שבט היער' : TN[k++ % 2]; }
  for (const c of HUNT.camps) POI.push({ x: c.x, z: c.z, n: c.tribe, camp: true });
}
function nearCamp(x, z, r) { for (const c of HUNT.camps) if (!c.gone && Math.abs(c.x - x) < r && Math.abs(c.z - z) < r && Math.hypot(c.x - x, c.z - z) < r) return c; return null; }
function buildCampBase(c) {
  const R = new Rig();
  const gy = (lx, lz) => getH(c.x + lx, c.z + lz) - c.y;
  const add = (geo, p, r, s, color) => R.add(geo, M([p[0], p[1] + gy(p[0], p[2]), p[2]], r, s), 0, col(color), 1);
  // tent
  add(new THREE.ConeGeometry(1.75, 2.3, 4), [-3.1, 1.12, -1.6], [0, Math.PI / 4 + 0.3, 0], null, '#a1916a');
  add(new THREE.CylinderGeometry(0.035, 0.035, 0.5, 5), [-3.1, 2.45, -1.6], null, null, '#5a3f28');
  add(new THREE.BoxGeometry(0.9, 1.1, 0.04), [-2.5, 0.55, -0.55], [0, 0.85, 0.25], null, '#5f553e');
  // fire pit
  for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; add(new THREE.SphereGeometry(0.14, 6, 5), [Math.cos(a) * 0.55, 0.05, Math.sin(a) * 0.55], null, [1, 0.65, 1], i % 2 ? '#6d6862' : '#58534e'); }
  for (let i = 0; i < 3; i++) add(new THREE.CylinderGeometry(0.06, 0.07, 0.95, 6), [0, 0.14, 0], [Math.PI / 2 - 0.25, i * 1.05, 0], null, '#4a3424');
  add(new THREE.CylinderGeometry(0.44, 0.44, 0.02, 12), [0, 0.01, 0], null, null, '#2b2622');
  // log seats
  add(new THREE.CylinderGeometry(0.19, 0.21, 1.5, 9), [0.2, 0.18, 1.7], [0, 0.2, Math.PI / 2], null, '#5a4030');
  add(new THREE.CylinderGeometry(0.18, 0.2, 1.3, 9), [-1.75, 0.17, 0.7], [0, 1.3, Math.PI / 2], null, '#634632');
  // drying rack with fish
  for (const s of [-1, 1]) add(new THREE.CylinderGeometry(0.04, 0.05, 1.7, 6), [2.7 + s * 0.85, 0.85, -1.3], null, null, '#5a3f28');
  add(new THREE.CylinderGeometry(0.035, 0.035, 1.9, 6), [2.7, 1.6, -1.3], [0, 0, Math.PI / 2], null, '#6b4a2c');
  for (let i = 0; i < 4; i++) add(new THREE.SphereGeometry(1, 8, 6), [2.15 + i * 0.37, 1.32, -1.3], null, [0.06, 0.2, 0.035], '#8a6a48');
  // crates
  add(new THREE.BoxGeometry(0.62, 0.46, 0.46), [-0.9, 0.23, -3.3], [0, 0.4, 0], null, '#7a6040');
  add(new THREE.BoxGeometry(0.42, 0.32, 0.36), [-0.85, 0.62, -3.3], [0, 0.1, 0], null, '#8a7050');
  // a bigger camp: more tents, a lean-to, a totem and firewood
  add(new THREE.ConeGeometry(1.5, 2.0, 4), [3.6, 0.98, 2.9], [0, 0.6, 0], null, '#9c8a62');
  add(new THREE.CylinderGeometry(0.03, 0.03, 0.45, 5), [3.6, 2.08, 2.9], null, null, '#5a3f28');
  add(new THREE.ConeGeometry(1.6, 2.1, 4), [-4.3, 1.02, 3.2], [0, 1.2, 0], null, '#a8986e');
  add(new THREE.CylinderGeometry(0.03, 0.03, 0.45, 5), [-4.3, 2.15, 3.2], null, null, '#5a3f28');
  add(new THREE.BoxGeometry(2.4, 0.05, 1.6), [4.6, 1.0, -2.6], [0.55, 0.3, 0], null, '#6b7a48');
  for (const s of [-1, 1]) add(new THREE.CylinderGeometry(0.05, 0.06, 1.5, 6), [4.6 + s * 1.05, 0.75, -3.2], null, null, '#5a3f28');
  add(new THREE.CylinderGeometry(0.16, 0.2, 2.6, 8), [0.9, 1.3, -4.4], null, null, '#6b4a2c');
  add(new THREE.BoxGeometry(0.5, 0.35, 0.45), [0.9, 2.2, -4.4], null, null, '#b0472f');
  add(new THREE.BoxGeometry(0.62, 0.08, 0.2), [0.9, 2.45, -4.4], null, null, '#e0b04a');
  for (let i = 0; i < 5; i++) add(new THREE.CylinderGeometry(0.09, 0.09, 1.2, 6), [-2.2 + (i % 3) * 0.2, 0.1 + Math.floor(i / 3) * 0.17, -3.6], [0, 0, Math.PI / 2], null, i % 2 ? '#6a4a30' : '#5a3f28');
  const geo = R.geometry();
  if (!HUNT.mat) HUNT.mat = new THREE.MeshLambertMaterial({ vertexColors: true });
  const mesh = new THREE.Mesh(geo, HUNT.mat); mesh.position.set(c.x, c.y, c.z); mesh.castShadow = true; mesh.receiveShadow = true; scene.add(mesh); c.mesh = mesh;
  // flames and night glow
  const fy = c.y + gy(0, 0) + 0.1;
  for (const [r, h, color] of [[0.24, 0.75, '#ff8a2a'], [0.13, 0.5, '#ffe08a']]) {
    const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 7, 1, true), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    m.position.set(c.x, fy + h / 2, c.z); scene.add(m); c.flames.push(m); m.userData.h = h;
  }
  if (!HUNT.glowTex) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,190,110,1)'); gr.addColorStop(0.35, 'rgba(255,140,50,.45)'); gr.addColorStop(1, 'rgba(255,120,40,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    HUNT.glowTex = new THREE.CanvasTexture(cv);
  }
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: HUNT.glowTex, color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  sp.position.set(c.x, fy + 0.6, c.z); sp.scale.setScalar(5); scene.add(sp); c.glow = sp; c.fy = fy;
}
function spawnHunter(c, withPet) {
  const elite = !c.hunters.some(x => x.elite && x.alive && !x.gone), fem = !elite && (!c.hunters.some(x => x.sex === 'f' && x.alive && !x.gone) || rng() < 0.3), sex = fem ? 'f' : 'm', tpl = elite ? 'hunter0' : fem ? 'hunter3' : rng() < 0.5 ? 'hunter1' : 'hunter2';
  for (let t = 0; t < 25; t++) {
    const ang = rng() * TAU, d = rr(2.6, 6), x = c.x + Math.cos(ang) * d, z = c.z + Math.sin(ang) * d;
    if (waterDepth(x, z) > 0) continue;
    const h = new Animal('hunter', x, z, { sex, tpl, scale: rr(0.95, 1.05) });
    if (elite) { h.elite = true; h.maxHp *= 1.5; h.hp = h.maxHp; }
    h.hunter = true; h.camp = c; h.home.set(c.x, 0, c.z); h.name = pick(HNAMES[sex]); h.pets = [];
    h.state = 'idle'; h.stT = rr(2, 10); h.spearCD = rr(0, 2); h.netCD = 0; h.vd = 230;
    c.hunters.push(h);
    if (withPet) {
      const id = pick(['coati', 'capybara', 'ocelot', 'peccary']);
      const b = new Animal(id, x + rr(-2, 2), z + rr(-2, 2), { young: id !== 'coati' });
      if (waterDepth(b.pos.x, b.pos.z) > 0) { b.pos.set(x, 0, z); b.ground(1, true); }
      makePet(h, b);
    }
    return h;
  }
  return null;
}
function spawnHunters() {
  if (!HUNT.camps.length) pickCamps();
  HUNT.camps.forEach((c, i) => { buildCamp(c); spawnHunter(c, true); spawnHunter(c, i === 0); spawnHunter(c, false); if (!c.deep) spawnHunter(c, false); });
}

// ---------- pets ----------
function makePet(h, b, stolen) {
  b.pet = h; b.state = 'follow'; b.followTarget = h; b.lured = null; b.social = false; b.isRival = false; b.foe = null; b.threat = null;
  if (stolen) b.stolen = stolen;
  h.pets.push(b);
}
function freePets(h) {
  for (const b of h.pets || []) {
    if (!b.alive || b.gone) continue;
    b.pet = null; b.followTarget = null;
    const a = P.a;
    if (b.stolen && a && a.alive && G.mode === 'play') {
      if (b.stolen === 'cub') { b.cub = true; b.state = 'follow'; b.followTarget = a.sex === 'f' || !(P.partner && P.partner.alive) ? a : P.partner; P.cubs.push(b); UI.notify(`${b.name} ${heb(b, 'חזר', 'חזרה')} אל המשפחה!`, 'love'); }
      else if (b.stolen === 'partner' && aliveMates().length < maxMates()) { P.mates.push(b); if (!P.partner) P.partner = b; b.isPartner = true; b.state = 'follow'; b.followTarget = a; UI.notify(`${b.name} ${heb(b, 'השתחרר וחזר', 'השתחררה וחזרה')} אליך!`, 'love'); }
      else { b.state = 'idle'; b.stT = 3; }
      FX.spawn('heart', b.pos.x, b.pos.y + b.height, b.pos.z, 5);
      b.stolen = null;
    } else { b.state = 'flee'; b.threat = h; b.stT = 0; }
  }
  h.pets = [];
}
function luredStep(b, dt) {
  const h = b.lured;
  if (!h || !h.alive || h.gone || h.state !== 'tame' || h.target !== b) { b.lured = null; return false; }
  const p = P.a;
  if (p && p.alive && !p.pet && dist2(p.pos, b.pos) < 9 && P.noise > 0.5 && b !== P.partner && !P.cubs.includes(b)) { b.lured = null; threatReact(b, h, true); h.state = 'idle'; h.stT = 3; return true; }
  const dx = h.pos.x - b.pos.x, dz = h.pos.z - b.pos.z, d = Math.hypot(dx, dz) || 0.01;
  b.look = clamp(angDiff(b.yaw, Math.atan2(dx, dz)), -1, 1);
  if (h.pose === 'kneel' && d > b.rad + 0.9) { b.move(dx / d, dz / d, (b.sp.walk || 1.5) * 0.55, dt); b.pose = 'move'; }
  else { b.move(dx / d, dz / d, 0.01, dt); b.pose = d < b.rad + 1.2 ? 'eat' : 'idle'; }
  return true;
}

// ---------- hunter brain ----------
function hGoto(h, x, z, then) { h.state = 'goto'; h.goal = { x, z }; h.goalThen = then || null; h.stT = 70; h.blocked = 0; }
function hunterThreat(h) {
  if (h.lastHit && h.lastHit.alive && !h.lastHit.pet && G.t - h.lastHitT < 25 && dist2(h.lastHit.pos, h.pos) < 45) return h.lastHit;
  let best = null, bd = 1e9;
  shQuery(h.pos.x, h.pos.z, 32, (b, d) => {
    if (!b.alive || b === h || b.pet || b.hunter || b.tribe || b.isPartner || b.cub || b.tpl.kind === 'bird' || b.lured) return;
    let range = 0;
    if (b.isPlayer) {
      if (P.fish || P.human) return;
      if (HUNT.angry > 0) range = 30;
      else if ((b.sp.danger || 0) >= 3 || (P.isPred && b.scale * b.rad > 0.35)) range = 13 * clamp(P.noise, 0.45, 1.3);
    } else if (b.tpl.kind === 'fish') return;
    else if ((b.sp.danger || 0) >= 3 && !b.young) range = 13;
    if ((b.state === 'fight' && b.foe && (b.foe === h || b.foe.pet === h)) || (b.state === 'hunt' && b.target && b.target.pet === h)) range = 30;
    if (d < range && d < bd) { bd = d; best = b; }
  });
  if (best && best.isPlayer && G.t - (h.toldP || -99) > 50) { h.toldP = G.t; UI.notify(`${hunterWord(h)} ${heb(h, 'הבחין', 'הבחינה')} בך ${heb(h, 'ומכוון', 'ומכוונת')} חנית!`, 'bad'); P.pings.push({ x: h.pos.x, z: h.pos.z, t: 6 }); }
  return best;
}
function findTameTarget(h, r) {
  let best = null, bd = 1e9; const p = P.a;
  shQuery(h.pos.x, h.pos.z, r, (b, d) => {
    if (!b.alive || b.isPlayer || b.pet || b.hunter || b.lured || b.tpl.kind !== 'quad' || !TAME_OK.includes(b.spId)) return;
    if (!(b.young || TAME_ADULT.includes(b.spId))) return;
    if (b.state === 'flee' || b.state === 'fight' || b.atDen) return;
    const fam = b.isPartner || b.cub;
    if (fam && (!p || !p.alive || dist2(p.pos, b.pos) < 24)) return;
    if (b.social && !fam) return;
    const s = d - (fam ? 12 : 0);
    if (s < bd) { bd = s; best = b; }
  });
  return best;
}
function findHunterPrey(h, r) {
  let best = null, bd = 1e9;
  shQuery(h.pos.x, h.pos.z, r, (b, d) => {
    if (!b.alive || b.pet || b.lured || b.young || b.cub || b.isPartner || !HUNTER_PREY.includes(b.spId) || b.swimming) return;
    const s = d - (b.isPlayer ? 15 : 0);
    if (s < bd) { bd = s; best = b; }
  });
  return best;
}
function fishingSpot(h) {
  const c = h.camp;
  for (let t = 0; t < 30; t++) {
    const ang = rng() * TAU, d = rr(0, 22), x = c.rx + Math.cos(ang) * d, z = c.rz + Math.sin(ang) * d, wd = waterDepth(x, z);
    if (wd > 0.15 && wd < 0.6) {
      let dx = 0, dz = 0; for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; const dd = waterDepth(x + Math.cos(a) * 3, z + Math.sin(a) * 3); dx += Math.cos(a) * dd; dz += Math.sin(a) * dd; }
      return { x, z, face: Math.atan2(dx, dz) };
    }
  }
  return null;
}
function hunterPlan(h) {
  h.crouch = false; h.target = null;
  h.pets = h.pets.filter(b => b.alive && !b.gone && b.pet === h);
  if (isNight()) { hGoto(h, h.camp.x + rr(-2.5, 2.5), h.camp.z + rr(-2.5, 2.5), 'camp'); return; }
  const r = rng();
  if (h.pets.length < 2 && r < 0.4) { const b = findTameTarget(h, 50); if (b) { h.state = 'tame'; h.target = b; h.tameT = 0; h.stT = 45; return; } }
  if (r < 0.7) { const p = findHunterPrey(h, 60); if (p) { h.state = 'hunt'; h.target = p; h.stT = 50; return; } }
  if (r < 0.9) { const s = fishingSpot(h); if (s) { h.fishSpot = s; hGoto(h, s.x, s.z, 'fish'); return; } }
  for (let t = 0; t < 8; t++) {
    const ang = rng() * TAU, d = rr(15, 80), x = h.camp.x + Math.cos(ang) * d, z = h.camp.z + Math.sin(ang) * d;
    if (inBounds(x, z) && waterDepth(x, z) === 0 && getNY(x, z) > 0.8) { hGoto(h, x, z, null); return; }
  }
  h.state = 'idle'; h.stT = rr(3, 8);
}
function hunterThrow(h, t, kind) {
  h.windup = h.windup0 = kind === 'net' ? 0.8 : h.elite ? 0.62 : 0.72; h.throwKind = kind; h.throwTgt = t; h.aimErr = [rr(-1, 1), rr(-1, 1)];
  if (t.isPlayer) { P.warnFrom = h; h.ranged = true; }
  if (h.mark) releaseMarker(h.mark);
  h.mark = t.isPlayer || t.dCam < 60 ? aimMarker(h, kind === 'net' ? 'net' : t.isPlayer ? 'me' : 'other') : null;
}
// where the throw will land: lead the target's motion; the miss offset is fixed when the throw starts, so the marker never lies
function predictAim(h) {
  const t = h.throwTgt; if (!t || !t.alive) return null;
  const V = h.throwKind === 'net' ? 13 : h.throwKind === 'arrow' ? 30 : 22, lead = Math.max(0, h.windup || 0), fl = t.tpl.kind === 'bird' && t.vel;
  const vx = fl ? t.vel.x : Math.sin(t.yaw) * t.speed, vz = fl ? t.vel.z : Math.cos(t.yaw) * t.speed;
  let tx = t.pos.x + vx * lead, tz = t.pos.z + vz * lead;
  const T0 = Math.hypot(tx - h.pos.x, tz - h.pos.z) / V; tx += vx * T0 * 0.9; tz += vz * T0 * 0.9;
  const d0 = Math.hypot(tx - h.pos.x, tz - h.pos.z), e = (0.12 + d0 * 0.016 + t.speed * 0.03) * (h.throwKind === 'net' ? 0.5 : 1) * (h.elite ? 0.6 : 1), q = h.aimErr || [0, 0];
  return { x: tx + q[0] * e, z: tz + q[1] * e };
}
function hunterLaunch(h) {
  const t = h.throwTgt; h.anim.atk = 0.45; h.spearCD = h.elite ? rr(1.6, 2.3) : rr(2.0, 2.9);
  if (h.throwKind === 'net') h.netCD = 26;
  const p = predictAim(h) || (h.mark ? { x: h.mark.position.x, z: h.mark.position.z } : null);
  if (!p) { if (h.mark) { releaseMarker(h.mark); h.mark = null; } return; }
  const sx = h.pos.x - Math.cos(h.yaw) * 0.25, sz = h.pos.z + Math.sin(h.yaw) * 0.25, sy = h.pos.y + 1.7 * h.scale, V = h.throwKind === 'net' ? 13 : h.throwKind === 'arrow' ? 30 : 22;
  const w = waterAt(p.x, p.z), gy = Math.max(getH(p.x, p.z), w > -900 ? w : -99), ty = gy + (t ? Math.min(t.height * 0.42, 0.9) : 0.4);
  const d = Math.hypot(p.x - sx, p.z - sz), TT = Math.max(0.15, d / V);
  const s = addProjectile(h, h.throwKind, sx, sy, sz, (p.x - sx) / TT, (ty - sy) / TT + 4.9 * TT, (p.z - sz) / TT);
  if (h.mark) { placeMarker(h.mark, p.x, p.z, 1); h.mark.userData.proj = s; h.mark = null; }
  AUD.at('spear', h.pos, 0.9);
}
function hunterDefend(h, dt) {
  const f = h.foe;
  if (!f || !f.alive || f.pet) { h.foe = null; h.state = 'idle'; h.stT = 2; return; }
  const dx = f.pos.x - h.pos.x, dz = f.pos.z - h.pos.z, d = Math.hypot(dx, dz) || 0.01;
  if (HUNT.net && HUNT.net.h === h) { if (d > 2.2) { h.move(dx / d, dz / d, (h.sp.walk || 1.5) * 1.3, dt); h.pose = 'move'; } else { h.move(dx / d, dz / d, 0.01, dt); h.pose = 'kneel'; } return; }
  if (d > 40) { h.foe = null; h.state = 'idle'; h.stT = 2; return; }
  for (const b of h.pets || []) if (b.alive && b.state !== 'fight' && d < 25 && !f.isPlayer) { b.state = 'fight'; b.foe = f; }
  h.look = 0; h.crouch = false;
  const face = () => { h.yaw += angDiff(h.yaw, Math.atan2(dx, dz)) * Math.min(1, dt * 7); };
  h.circ = h.circ || (h.id % 2 ? 1 : -1); if (rng() < dt * 0.25) h.circ = -h.circ;
  if (f.isPlayer && COMBAT.charging && d < 10) { strafeMove(h, -dz / d * h.circ, dx / d * h.circ, (h.sp.run || 5) * 0.75, dt); face(); h.pose = 'move'; return; }
  if (d < 2.6 + f.rad) {
    h.move(dx / d, dz / d, 0.01, dt); h.pose = 'idle';
    if (h.atkCD <= 0) { h.atkCD = 1.1; h.anim.atk = 0.45; if (f.isPlayer && P.dodgeT > 0) return; hurt(f, (h.sp.dmg || 18) * 0.75 * (h.elite ? 1.25 : 1) * rr(0.85, 1.15), h); AUD.at('bite', h.pos, 0.7); }
    return;
  }
  const netIt = f.isPlayer && !HUNT.net && !P.coil && h.netCD <= 0 && d < 13 && (f.hp < f.maxHp * 0.45 || P.sleeping || P.stun > 0 || P.resting);
  if (h.spearCD <= 0 && d < 26) { hunterThrow(h, f, netIt ? 'net' : 'spear'); h.yaw = Math.atan2(dx, dz); return; }
  if (d < 8) { h.move(-dx / d, -dz / d, (h.sp.walk || 1.5) * 1.5, dt); face(); h.pose = 'move'; }
  else if (d > 19) { h.move(dx / d, dz / d, (h.sp.run || 5) * 0.55, dt); h.pose = 'move'; }
  else { strafeMove(h, -dz / d * h.circ, dx / d * h.circ, (h.sp.walk || 1.5) * 1.2, dt); face(); h.pose = 'move'; }
}
function hunterHunt(h, dt) {
  const t = h.target;
  if (!t || t.gone || t.pet) { h.state = 'idle'; h.stT = 2; h.crouch = false; return; }
  if (!t.alive) { h.state = 'collect'; h.stT = 25; h.crouch = false; return; }
  const dx = t.pos.x - h.pos.x, dz = t.pos.z - h.pos.z, d = Math.hypot(dx, dz) || 0.01;
  if (d > 65 || h.stT <= 0 || t.swimming) { h.state = 'idle'; h.stT = 3; h.crouch = false; return; }
  h.crouch = d < 32;
  if (d < 17 && h.spearCD <= 0) { hunterThrow(h, t, 'spear'); h.yaw = Math.atan2(dx, dz); return; }
  if (d > 12) { h.move(dx / d, dz / d, h.crouch ? 1.1 : (h.sp.walk || 1.5) * 1.3, dt); h.pose = 'move'; }
  else { h.move(dx / d, dz / d, 0.01, dt); h.pose = 'idle'; }
}
function hunterCollect(h, dt) {
  const t = h.target;
  if (!t || t.gone || t.food <= 0.5) { h.target = null; hGoto(h, h.camp.x, h.camp.z, null); return; }
  const dx = t.pos.x - h.pos.x, dz = t.pos.z - h.pos.z, d = Math.hypot(dx, dz) || 0.01;
  if (d > t.rad + 1.1) { h.move(dx / d, dz / d, (h.sp.walk || 1.5) * 1.4, dt); h.pose = 'move'; if (h.stT <= 0) { h.state = 'idle'; h.target = null; } return; }
  h.move(dx / d, dz / d, 0.01, dt); h.pose = 'kneel'; h.collectT = (h.collectT || 0) + dt;
  if (h.collectT > 3) { h.collectT = 0; t.food = 0; h.catches = (h.catches || 0) + 1; h.target = null; hGoto(h, h.camp.x, h.camp.z, null); }
}
function hunterTame(h, dt) {
  const b = h.target;
  if (!b || !b.alive || b.gone || b.pet || h.stT <= 0 || b.state === 'flee' || b.state === 'fight') { if (b && b.lured === h) b.lured = null; h.state = 'idle'; h.stT = 4; h.crouch = false; return; }
  const dx = b.pos.x - h.pos.x, dz = b.pos.z - h.pos.z, d = Math.hypot(dx, dz) || 0.01;
  if (d > 4.5 && !b.lured) { h.crouch = d < 16; h.move(dx / d, dz / d, h.crouch ? 0.9 : (h.sp.walk || 1.5), dt); h.pose = 'move'; return; }
  h.crouch = false; h.move(dx / d, dz / d, 0.01, dt); h.pose = 'kneel'; b.lured = h;
  h.tameT += dt;
  if (h.tameT > 5.5) {
    b.lured = null;
    const fam = b.cub ? 'cub' : b.isPartner ? 'partner' : null;
    if (fam === 'cub') { const i = P.cubs.indexOf(b); if (i >= 0) P.cubs.splice(i, 1); b.cub = false; }
    if (fam === 'partner') { P.mates = (P.mates || []).filter(m => m !== b); P.partner = P.mates[0] || null; b.isPartner = false; }
    makePet(h, b, fam);
    if (fam) {
      UI.notify(`${hunterWord(h)} ${heb(h, 'אילף', 'אילפה')} את ${b.name}! צריך להבריח ${heb(h, 'אותו', 'אותה')} כדי להחזיר`, 'bad');
      UI.big(fam === 'cub' ? 'הגור נלקח' : (b.sex === 'f' ? 'בת הזוג נלקחה' : 'בן הזוג נלקח'), `${hunterWord(h)} ${heb(h, 'אילף', 'אילפה')} ${heb(b, 'אותו', 'אותה')}. לתקוף את ${heb(h, 'הצייד', 'הציידת')} עד ${heb(h, 'שיברח', 'שתברח')}`);
      P.pings.push({ x: h.pos.x, z: h.pos.z, t: 14 }); AUD.play('hurt', 0.6);
    } else if (b.dCam < 45 && G.mode === 'play') UI.notify(`${hunterWord(h)} ${heb(h, 'אילף', 'אילפה')} ${b.sp.he}. ${heb(b, 'הוא הולך', 'היא הולכת')} ${heb(h, 'אחריו', 'אחריה')} עכשיו`);
    discover(b.spId);
    h.state = 'idle'; h.stT = rr(4, 10); h.target = null;
  }
}
function hunterFish(h, dt) {
  const s = h.fishSpot;
  if (!s || h.stT <= 0 || isNight()) { h.state = 'idle'; h.stT = 3; return; }
  if (dist2(h.pos, s) > 2.5) { hGoto(h, s.x, s.z, 'fish'); return; }
  h.move(Math.sin(s.face), Math.cos(s.face), 0.01, dt); h.pose = 'spear';
  h.fishT = (h.fishT ?? rr(1.5, 4)) - dt;
  if (h.fishT > 0 || h.windup > 0) return;
  h.fishT = rr(2.5, 5);
  let fish = null;
  shQuery(h.pos.x, h.pos.z, 4, (b, d) => { if (b.alive && (b.tpl.kind === 'fish' || b.spId === 'eel') && d < 3.4 && b.pos.y > waterAt(b.pos.x, b.pos.z) - 1.25) fish = b; });
  if (!fish) return;
  if (fish.isPlayer) { P.warnFrom = h; h.windup = 0.42; h.throwKind = 'thrust'; h.throwTgt = fish; } else { h.fishWind = 0.42; h.fishTgt = fish; }
}
function hunterCamp(h, dt) {
  const c = h.camp, dx = c.x - h.pos.x, dz = c.z - h.pos.z, d = Math.hypot(dx, dz) || 0.01;
  if (!isNight() && h.stT <= 0) { hunterPlan(h); return; }
  if (d > 4) { h.move(dx / d, dz / d, h.sp.walk || 1.5, dt); h.pose = 'move'; return; }
  if (d < 1.6) { h.move(-dx / d, -dz / d, 0.6, dt); h.pose = 'move'; return; }
  h.move(dx / d, dz / d, 0.01, dt);
  h.pose = G.time > 22 || G.time < 5 ? 'sleep' : 'sit'; h.stT = 5;
}
function hunterFlee(h, dt) {
  const t = h.fleeFrom, c = h.camp;
  let fx = c.x - h.pos.x, fz = c.z - h.pos.z;
  if (t && t.alive) { const ax = h.pos.x - t.pos.x, az = h.pos.z - t.pos.z, ad = Math.hypot(ax, az) || 1; fx = fx * 0.3 / (Math.hypot(fx, fz) || 1) + ax / ad; fz = fz * 0.3 / (Math.hypot(c.x - h.pos.x, c.z - h.pos.z) || 1) + az / ad; }
  const fl = Math.hypot(fx, fz) || 1;
  if (h.blocked > 0.3) { const k = h.id % 2 ? 1.3 : -1.3, cs = Math.cos(k), sn = Math.sin(k); const nx = fx * cs - fz * sn; fz = fx * sn + fz * cs; fx = nx; }
  h.move(fx / fl, fz / fl, h.sp.run || 5, dt); h.pose = 'move'; h.crouch = false;
  h.fleeT += dt;
  const pd = P.a ? dist2(P.a.pos, h.pos) : 999;
  if ((h.fleeT > 6 && pd > 45 && h.dCam > 55) || h.fleeT > 40) {
    HUNT.respawn.push({ camp: c, t: rr(150, 260) });
    const i = c.hunters.indexOf(h); if (i >= 0) c.hunters.splice(i, 1);
    h.remove();
  }
}
function hunterStartFlee(h, src) {
  if (h.fleeing) return;
  h.fleeing = true; h.fleeT = 0; h.fleeFrom = src; h.windup = 0; h.state = 'flee';
  if (h.lured) h.lured = null;
  const had = h.pets.length;
  freePets(h);
  if (HUNT.net && HUNT.net.h === h) endNet(true);
  if (src && src.isPlayer && G.mode === 'play') {
    PROG.flags.scare = 1;
    P.renown += 1;
    UI.notify(`${hunterWord(h)} ${heb(h, 'נבהל ובורח', 'נבהלה ובורחת')} מהג׳ונגל!${had ? ' החיות שלו חופשיות' : ''}`, 'good');
    UI.big(heb(h, 'הצייד ברח', 'הציידת ברחה'), 'המעמד שלך עלה');
  }
}
function hunterProvoked(h, src) {
  if (!h || !h.alive || h.fleeing || !src || src === h || src.pet === h) return;
  h.foe = src; h.state = 'defend'; h.lastHit = src; h.lastHitT = G.t;
  for (const b of h.pets || []) if (b.alive && b !== src) { b.state = 'fight'; b.foe = src; }
  if (src.isPlayer && h.camp && h.camp.bandit) { for (const o of h.camp.hunters) if (o !== h && o.alive && !o.fleeing && !o.young && dist2(o.pos, h.pos) < 80) { o.foe = src; o.state = 'defend'; } }
  else if (src.isPlayer) {
    HUNT.angry = 60; HUNT.angryWhy = 'כי פגעת באחד הציידים';
    for (const c of HUNT.camps) for (const o of c.hunters) if (o !== h && o.alive && !o.fleeing && dist2(o.pos, h.pos) < 60) { o.foe = src; o.state = 'defend'; }
  }
}
BRAIN.hunter = function (h, dt) {
  h.stT -= dt; h.think -= dt; h.spearCD -= dt; h.netCD -= dt;
  h.hp = Math.min(h.maxHp, h.hp + dt * 0.6);
  if (h.fleeing) return hunterFlee(h, dt);
  if (h.stun > 0) { h.stun -= dt; h.move(0, 0, 0, dt); h.pose = 'idle'; return; }
  if (h.windup > 0) {
    const t = h.throwTgt; h.windup -= dt;
    if (h.mark) { const p = predictAim(h); if (p) placeMarker(h.mark, p.x, p.z, 1 - Math.max(0, h.windup) / (h.windup0 || 0.7)); }
    if (t && t.alive) h.yaw += angDiff(h.yaw, Math.atan2(t.pos.x - h.pos.x, t.pos.z - h.pos.z)) * Math.min(1, dt * 8);
    h.move(0, 0, 0, dt);
    if (h.throwKind === 'thrust') { h.pose = 'spear'; if (h.windup <= 0) { h.anim.atk = 0.45; if (t && t.alive && dist2(t.pos, h.pos) < 3.6 && t.pos.y > waterAt(t.pos.x, t.pos.z) - 1.3) { hurt(t, 20, h); FX.spawn('splash', t.pos.x, waterAt(t.pos.x, t.pos.z), t.pos.z, 8); } } return; }
    h.pose = 'aim'; if (h.windup <= 0) hunterLaunch(h);
    return;
  }
  if (h.ambush && banditCharge(h, dt)) return;
  if (h.fishWind > 0) {
    h.fishWind -= dt; h.pose = 'spear'; h.move(0, 0, 0, dt);
    if (h.fishWind <= 0) {
      h.anim.atk = 0.45; const f = h.fishTgt; h.fishTgt = null;
      if (f && f.alive && dist2(f.pos, h.pos) < 3.6) { FX.spawn('splash', f.pos.x, waterAt(f.pos.x, f.pos.z), f.pos.z, 10); if (f.dCam < 40) AUD.at('splash', f.pos, 0.6); if (rng() < 0.55) { kill(f, h); f.food = 0; h.catches = (h.catches || 0) + 1; } else f.scared = 3; }
    }
    return;
  }
  if (h.think <= 0) {
    h.think = 0.35 + rng() * 0.3;
    const th = hunterThreat(h);
    if (th) { if (h.foe !== th || h.state !== 'defend') { h.foe = th; h.state = 'defend'; if (h.target && h.target.lured === h) h.target.lured = null; if (th.isPlayer) rallyHunters(h, th); } }
    else if (h.state === 'defend') { h.foe = null; h.state = 'idle'; h.stT = rr(2, 4); }
  }
  switch (h.state) {
    case 'defend': return hunterDefend(h, dt);
    case 'hunt': return hunterHunt(h, dt);
    case 'collect': return hunterCollect(h, dt);
    case 'tame': return hunterTame(h, dt);
    case 'fish': return hunterFish(h, dt);
    case 'camp': return hunterCamp(h, dt);
    case 'post': h.move(0, 0, 0, dt); h.yaw += angDiff(h.yaw, h.postA ?? h.yaw) * Math.min(1, dt * 3); h.pose = 'idle'; h.look = Math.sin(h.anim.t * 0.3 + h.id) * 0.5; if ((h.postT = (h.postT || 0) - dt) <= 0) hunterPlan(h); return;
    case 'goto': {
      const g = h.goal; if (!g) { hunterPlan(h); return; }
      h.steerTo(g.x, g.z, dist2(h.pos, g) > 50 ? (h.sp.run || 5) * 0.7 : (h.sp.walk || 1.5), dt); h.pose = 'move';
      const d = Math.hypot(g.x - h.pos.x, g.z - h.pos.z);
      if (d < 1.4 || h.blocked > 1.2 || h.stT <= 0) { if (h.goalThen && d < 4) { h.state = h.goalThen; h.stT = h.goalThen === 'fish' ? rr(40, 75) : 30; } else { h.state = 'idle'; h.stT = rr(2, 6); } }
      return;
    }
  }
  h.move(0, 0, 0, dt); h.pose = 'idle'; h.look = Math.sin(h.anim.t * 0.4 + h.id) * 0.7;
  if (h.stT <= 0) hunterPlan(h);
};

// ---------- spears and nets ----------
let SPEAR_PARTS = null;
function addProjectile(h, kind, x, y, z, vx, vy, vz) {
  if (!SPEAR_PARTS) SPEAR_PARTS = {
    shaft: new THREE.CylinderGeometry(0.016, 0.018, 1.7, 6), tip: new THREE.ConeGeometry(0.032, 0.18, 6), net: new THREE.IcosahedronGeometry(0.7, 1),
    wood: new THREE.MeshLambertMaterial({ color: '#6b4a2c' }), metal: new THREE.MeshLambertMaterial({ color: '#a7adb3' }),
    netM: new THREE.MeshBasicMaterial({ color: '#d9c58f', wireframe: true, transparent: true, opacity: 0.9 })
  };
  const S = SPEAR_PARTS, g = new THREE.Group();
  if (kind === 'net') g.add(new THREE.Mesh(S.net, S.netM));
  else if (kind === 'arrow') { const sh = new THREE.Mesh(S.shaft, S.wood); sh.scale.set(0.55, 0.44, 0.55); g.add(sh); const tip = new THREE.Mesh(S.tip, S.metal); tip.scale.setScalar(0.6); tip.position.y = 0.42; g.add(tip); const fl = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.12, 0.004), new THREE.MeshLambertMaterial({ color: '#e8e2d0' })); fl.position.y = -0.32; g.add(fl); }
  else { g.add(new THREE.Mesh(S.shaft, S.wood)); const tip = new THREE.Mesh(S.tip, S.metal); tip.position.y = 0.94; g.add(tip); }
  g.position.set(x, y, z); scene.add(g);
  const s = { g, kind, from: h, pos: g.position, vel: new V3(vx, vy, vz), t: 0, stuck: 0 };
  HUNT.spears.push(s); return s;
}
function projectileHit(s, b) {
  if (s.from && s.from.isPlayer && s.kind === 'spear') PROG.flags.throw = 1;
  if (s.kind === 'net') { if (b.isPlayer) startNet(s.from); else if (b.tpl.kind === 'quad' && TAME_OK.includes(b.spId) && s.from.alive && s.from.pets.length < 3) makePet(s.from, b); return; }
  const dmg = (s.kind === 'arrow' ? 22 * rr(0.85, 1.15) : (s.from.sp.dmg || 15) * rr(0.85, 1.15) * (b.isPlayer ? 0.85 : 1.5) * (s.from.elite ? 1.25 : 1)) * (s.from.isPlayer ? ironK(s.kind) : 1);
  hurt(b, dmg, s.from);
  if (b.dCam < 60) { FX.spawn('blood', s.pos.x, s.pos.y, s.pos.z, 5); AUD.at('bite', b.pos, 0.6); }
  if (b.isPlayer) UI.notify('חנית פגעה בך!', 'bad');
}
function updateProjectiles(dt) {
  for (let i = HUNT.spears.length - 1; i >= 0; i--) {
    const s = HUNT.spears[i];
    if (s.stuck > 0) { s.stuck -= dt; if (s.stuck <= 0) { scene.remove(s.g); HUNT.spears.splice(i, 1); } continue; }
    s.t += dt; s.vel.y -= 9.8 * dt; s.pos.addScaledVector(s.vel, dt);
    if (s.kind === 'net') { s.g.rotation.y += dt * 6; s.g.scale.setScalar(Math.min(1.6, 0.4 + s.t * 2.2)); }
    else s.g.quaternion.setFromUnitVectors(UPV, _t2.copy(s.vel).normalize());
    let hit = null;
    shQuery(s.pos.x, s.pos.z, 3.5, b => {
      if (hit || !b.alive || b === s.from || (s.from && ourPeople(s.from) && (b.isPlayer || b.tribe || (b.pet && (b.pet === P.a || b.pet.tribe)) || b.brain === 'captive')) || b.pet === s.from || (b.hunter && !warHit(s.from, b)) || (s.from && s.from.hunter && playerSide(b) && s.from.foe !== b && s.from.throwTgt !== b)) return;
      if (s.kind === 'arrow') {
        const cx = b.pos.x, cy = b.pos.y + b.height * 0.5, cz = b.pos.z, px = s.pos.x - s.vel.x * dt, py = s.pos.y - s.vel.y * dt, pz = s.pos.z - s.vel.z * dt;
        const sx = s.pos.x - px, sy = s.pos.y - py, sz = s.pos.z - pz, L2 = sx * sx + sy * sy + sz * sz || 1e-6, k = clamp(((cx - px) * sx + (cy - py) * sy + (cz - pz) * sz) / L2, 0, 1);
        const qx = px + sx * k - cx, qy = py + sy * k - cy, qz = pz + sz * k - cz; if (qx * qx + qy * qy + qz * qz < (b.rad + 0.45) ** 2) hit = b;
        return;
      }
      const dx = s.pos.x - b.pos.x, dz = s.pos.z - b.pos.z, dy = s.pos.y - (b.pos.y + b.height * 0.5), r = b.rad + (s.kind === 'net' ? 0.8 : 0.32);
      if (dx * dx + dz * dz < r * r && Math.abs(dy) < b.height * 0.6 + (s.kind === 'net' ? 0.7 : 0.35)) hit = b;
    });
    if (hit && !(hit.isPlayer && P.dodgeT > 0)) { projectileHit(s, hit); if (s.from && s.from.isPlayer && s.kind === 'spear') { const gx = hit.pos.x + rr(-0.7, 0.7), gz = hit.pos.z + rr(-0.7, 0.7); s.pos.set(gx, getH(gx, gz) + 0.55, gz); s.stuck = 120; s.g.quaternion.setFromUnitVectors(UPV, _t2.set(rr(-0.3, 0.3), -1, rr(-0.3, 0.3)).normalize()); } else { scene.remove(s.g); HUNT.spears.splice(i, 1); } continue; }
    const gh = getH(s.pos.x, s.pos.z), w = waterAt(s.pos.x, s.pos.z);
    if (w > -900 && w > gh && s.pos.y < w) {
      if (s.g.position.distanceTo(camera.position) < 60) FX.spawn('splash', s.pos.x, w, s.pos.z, 8);
      if (s.from && s.from.isPlayer && s.kind === 'spear') { s.pos.y = w + 0.05; s.stuck = 150; s.floating = true; s.g.quaternion.setFromUnitVectors(UPV, _t2.set(Math.sin(s.pos.x), 0.04, Math.cos(s.pos.x)).normalize()); continue; }
      scene.remove(s.g); HUNT.spears.splice(i, 1); continue;
    }
    if (s.pos.y < gh + 0.05 || s.t > 5) {
      if (s.kind === 'spear' && s.t <= 5) { s.pos.y = gh + 0.55; s.stuck = s.from && s.from.isPlayer ? 120 : 14; FX.spawn('dust', s.pos.x, gh, s.pos.z, 4); }
      else { scene.remove(s.g); HUNT.spears.splice(i, 1); }
    }
  }
}
function startNet(h) {
  if (!P.a || !P.a.alive || HUNT.net || P.coil || G.mode !== 'play') return;
  const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 2), new THREE.MeshBasicMaterial({ color: '#d9c58f', wireframe: true, transparent: true, opacity: 0.85 }));
  scene.add(mesh);
  HUNT.net = { h, t: 0, mesh }; P.qte = 0.35; P.resting = false;
  if (P.sleeping) wake();
  UI.qte(true, 'net'); AUD.play('net');
  UI.notify(`${hunterWord(h)} ${heb(h, 'זרק', 'זרקה')} עליך רשת! צריך לקרוע אותה מהר`, 'bad');
}
function updateNet(dt) {
  const n = HUNT.net; if (!n) return;
  const a = P.a;
  if (!a || !a.alive || G.mode !== 'play') { endNet(false, true); return; }
  n.t += dt;
  n.mesh.position.set(a.pos.x, a.pos.y + a.height * 0.45, a.pos.z); n.mesh.scale.setScalar(Math.max(0.55, a.rad * 1.3 + a.height * 0.45)); n.mesh.rotation.y += dt * 0.4;
  P.qte = Math.max(0, P.qte - dt * 0.12);
  const h = n.h;
  if (!h.alive || h.fleeing || h.gone) { endNet(true); return; }
  const dx = a.pos.x - h.pos.x, dz = a.pos.z - h.pos.z, d = Math.hypot(dx, dz) || 0.01;
  h.state = 'defend'; h.foe = a;
  if (P.qte >= 1) { endNet(true); return; }
  if (P.qte <= 0 || n.t > 9) {
    endNet(false, true);
    playerDie(you('צייד לכד ואילף אותך. מעכשיו אתה חי במחנה שלו', 'צייד לכד ואילף אותך. מעכשיו את חיה במחנה שלו'));
  }
}
function endNet(escaped, silent) {
  const n = HUNT.net; if (!n) return;
  HUNT.net = null; scene.remove(n.mesh); n.mesh.geometry.dispose(); UI.qte(false);
  if (escaped) PROG.flags.escape = 1;
  if (escaped && !silent) {
    UI.notify(you('קרעת את הרשת והשתחררת!', 'קרעת את הרשת והשתחררת!'), 'good'); AUD.play('swipe');
    if (n.h.alive) { n.h.stun = 2.2; n.h.netCD = 35; }
  }
}
function updateHunters(dt) {
  updateProjectiles(dt); updateNet(dt); updateMarkers(dt);
  HUNT.angry = Math.max(0, HUNT.angry - dt);
  const night = SKY.night || 0;
  for (const c of HUNT.camps) {
    if (c.gone) continue;
    const near = c.glow && Math.hypot(camera.position.x - c.x, camera.position.z - c.z) < 260;
    for (const m of c.flames) { m.visible = near; if (near) { const k = 0.85 + Math.sin(G.t * 13 + m.userData.h * 9) * 0.12 + Math.sin(G.t * 7.3) * 0.08; m.scale.set(1, k, 1); m.position.y = c.fy + m.userData.h * k / 2; } }
    if (c.glow) { c.glow.visible = near && night > 0.05; c.glow.material.opacity = night * (0.75 + Math.sin(G.t * 9) * 0.08); c.glow.scale.setScalar(4 + night * 3); }
    if (near && rng() < dt * 3 && Math.hypot(camera.position.x - c.x, camera.position.z - c.z) < 70) FX.spawn('spark', c.x + rr(-0.15, 0.15), c.fy + 0.5, c.z + rr(-0.15, 0.15), 1);
  }
  for (let i = HUNT.respawn.length - 1; i >= 0; i--) {
    const r = HUNT.respawn[i]; r.t -= dt;
    if (r.t > 0) continue;
    const cd = P.a ? Math.hypot(P.a.pos.x - r.camp.x, P.a.pos.z - r.camp.z) : 999;
    if (cd < 70) { r.t = 20; continue; }
    HUNT.respawn.splice(i, 1); spawnHunter(r.camp, rng() < 0.5);
  }
}
function resetHunters() {
  if (HUNT.net) endNet(false, true);
  for (const s of HUNT.spears) scene.remove(s.g);
  HUNT.spears.length = 0; HUNT.angry = 0;
  for (const c of HUNT.camps) for (const h of c.hunters) { h.foe = null; h.windup = 0; h.lastHit = null; h.state = 'idle'; h.stT = rr(1, 6); h.pets = h.pets.filter(b => b.alive && !b.gone); }
}

// ---------- hunters call each other ----------
function rallyHunters(h, f) {
  let n = 0;
  for (const c of HUNT.camps) for (const o of c.hunters) {
    if (o === h || !o.alive || o.fleeing || o.gone || o.state === 'defend' || dist2(o.pos, h.pos) > 70) continue;
    o.foe = f; o.state = 'defend'; o.think = 1; n++;
  }
  if (n && G.mode === 'play' && G.t - (HUNT.rallyT || -99) > 40) { HUNT.rallyT = G.t; AUD.at('whistle', h.pos, 1); UI.notify(`${hunterWord(h)} ${heb(h, 'שורק', 'שורקת')} לשאר הציידים. הם מתאספים נגדך!`, 'bad'); }
}
// ---------- target markers: where a spear or net is about to land ----------
const MARK = { pool: [] };
const MARKC = { me: '#ff3b30', other: '#ff9a3c', net: '#ffd34d' };
function makeMarker() {
  const g = new THREE.Group();
  const mk = (geo, op) => { const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: '#ff3b30', transparent: true, opacity: op, depthTest: false, depthWrite: false, side: THREE.DoubleSide, fog: false, toneMapped: false })); m.rotation.x = -Math.PI / 2; m.renderOrder = 998; m.userData.op = op; g.add(m); return m; };
  mk(new THREE.CircleGeometry(1, 40), 0.16);
  mk(new THREE.RingGeometry(0.9, 1, 56), 0.95);
  mk(new THREE.RingGeometry(0.93, 1, 56), 0.7);
  mk(new THREE.CircleGeometry(0.08, 16), 0.95);
  for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2, t = mk(new THREE.PlaneGeometry(0.06, 0.3), 0.9); t.position.set(Math.sin(a) * 0.62, 0, Math.cos(a) * 0.62); t.rotation.z = a; }
  return g;
}
function aimMarker(owner, kind) {
  let m = MARK.pool.find(q => !q.userData.used);
  if (!m) { if (MARK.pool.length >= 12) return null; m = makeMarker(); scene.add(m); MARK.pool.push(m); }
  Object.assign(m.userData, { used: true, owner, proj: null, kind, rel: 0, k: 0 }); m.visible = true;
  const col = MARKC[kind] || MARKC.me; for (const c of m.children) c.material.color.set(col);
  return m;
}
function placeMarker(m, x, z, k) {
  if (!m) return;
  const w = waterAt(x, z); m.position.set(x, Math.max(getH(x, z), w > -900 ? w : -99) + 0.05, z);
  m.userData.k = k; m.scale.setScalar(m.userData.kind === 'net' ? 1.9 : 1.15);
}
function releaseMarker(m) { if (m && m.userData.used && !m.userData.rel) m.userData.rel = 0.3; }
function updateMarkers(dt) {
  for (const m of MARK.pool) {
    const u = m.userData; if (!u.used) continue;
    if (u.proj) { if (!HUNT.spears.includes(u.proj) || u.proj.stuck > 0) releaseMarker(m); }
    else if (!u.owner || !u.owner.alive || u.owner.gone || u.owner.fleeing || !(u.owner.windup > 0) || u.owner.mark !== m) releaseMarker(m);
    let fade = 1;
    if (u.rel) { u.rel -= dt; fade = Math.max(0, u.rel / 0.3); if (u.rel <= 0) { u.used = false; m.visible = false; continue; } }
    const k = u.proj ? 1 : clamp(u.k || 0, 0, 1), pulse = 0.7 + 0.3 * Math.sin(G.t * (u.proj ? 20 : 10));
    m.children[2].scale.setScalar(lerp(2.3, 1, k));
    for (let i = 0; i < m.children.length; i++) { const c = m.children[i]; c.material.opacity = c.userData.op * fade * (i === 1 ? pulse : 1); }
    m.rotation.y += dt * 0.8;
  }
}
