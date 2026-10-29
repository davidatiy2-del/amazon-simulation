// ================= TRAPS: snares and pits for meat, a cage that keeps an animal alive to be trained =================
const TRAPT = {
  snare: { n: 'מלכודת חבל', ic: '🪢', wood: 2, r: 0.9, catch: ['agouti', 'coati', 'capybara', 'peccary'], hold: 20, word: 'בלולאה',
    d: 'לולאה על ענף כפוף: אגוטי, קואטי, קפיברה ופקארי נתפסים ברגל ונשארים עד שבאים' },
  pit: { n: 'בור ציד', ic: '🕳️', wood: 4, r: 1.35, catch: ['tapir', 'anteater', 'peccary', 'capybara'], hold: 0, word: 'בבור',
    d: 'בור עמוק מכוסה בענפים: גם טפיר ונמלן נופלים פנימה ולא יוצאים' },
  cage: { n: 'מלכודת כלוב', ic: '🪤', wood: 5, r: 0.85, catch: ['bushdog', 'coati', 'agouti', 'ocelot'], hold: 0, live: 1, word: 'בכלוב',
    d: 'כלוב עם דלת נופלת: החיה נשארת בחיים. כלב יער שנתפס מתאלף, לך או למלונה של השבט' }
};
const TRAPS = { list: [], t: 0, seq: 0, near: null, geo: {}, baitM: null, told: {} };
const trapsMax = () => 6 + 2 * Math.max(0, villageTier());
const myTraps = () => TRAPS.list.filter(T => T.owner === 'p');
// ---------- how they look: armed, and sprung ----------
function trapGeo(k, armed) {
  const key = k + (armed ? 1 : 0); if (TRAPS.geo[key]) return TRAPS.geo[key];
  const G2 = new GB(), A = (geo, p, r, s, c, v) => G2.add(geo, M(p, r, s), c, v);
  const leaf = (x, z, s, c) => A(new THREE.IcosahedronGeometry(0.22 * s, 0), [x, 0.05, z], [0, x * 3, 0], [1.2, 0.25, 1], c, 0.25);
  if (k === 'snare') {
    A(new THREE.CylinderGeometry(0.035, 0.05, 0.25, 5), [0.85, 0.08, 0], null, null, '#5a3f28');
    if (armed) {
      A(new THREE.CylinderGeometry(0.025, 0.04, 1.0, 5), [0.85, 0.5, 0], [0, 0, 0.12], null, '#6b4a2c');
      A(new THREE.CylinderGeometry(0.018, 0.026, 1.05, 5), [0.42, 1.08, 0], [0, 0, 1.15], null, '#6b4a2c');
      A(new THREE.CylinderGeometry(0.006, 0.006, 1.0, 3), [0.02, 0.55, 0], null, null, '#d8c9a0');
      A(new THREE.TorusGeometry(0.26, 0.013, 4, 16), [0, 0.04, 0], [Math.PI / 2, 0, 0], null, '#d8c9a0');
      A(new THREE.CylinderGeometry(0.02, 0.025, 0.22, 4), [-0.3, 0.06, 0.05], [0.3, 0, 0], null, '#5a3f28');
    } else {
      A(new THREE.CylinderGeometry(0.025, 0.04, 1.75, 5), [0.85, 0.85, 0], [0, 0, 0.04], null, '#6b4a2c');
      A(new THREE.CylinderGeometry(0.006, 0.006, 0.8, 3), [0.83, 1.3, 0], null, null, '#d8c9a0');
      A(new THREE.TorusGeometry(0.15, 0.013, 4, 12), [0.83, 0.86, 0], null, null, '#d8c9a0');
    }
    for (let i = 0; i < 5; i++) leaf(Math.cos(i * 1.3) * 0.5, Math.sin(i * 1.3) * 0.45, 1, i % 2 ? '#3f5a24' : '#5a4a2a');
  } else if (k === 'pit') {
    if (armed) {
      for (let i = 0; i < 6; i++) A(new THREE.BoxGeometry(2.6, 0.05, 0.06), [0, 0.05, 0], [0, i * 0.52 + 0.2, 0], null, i % 2 ? '#6b4a2c' : '#5a3f28');
      for (let i = 0; i < 14; i++) { const a = i * 2.4, r = 0.25 + (i % 5) * 0.2; leaf(Math.cos(a) * r, Math.sin(a) * r, 1.4, ['#3f5a24', '#5a4a2a', '#4a6a2a', '#6a5532'][i % 4]); }
    } else {
      A(new THREE.CylinderGeometry(1.15, 1.15, 0.03, 20), [0, 0.02, 0], null, null, '#140d08', 0.05);
      A(new THREE.TorusGeometry(1.22, 0.11, 4, 22), [0, 0.04, 0], [Math.PI / 2, 0, 0], null, '#5a4030');
      for (let i = 0; i < 5; i++) A(new THREE.BoxGeometry(1.1, 0.05, 0.06), [Math.cos(i * 1.9) * 1.5, 0.05, Math.sin(i * 1.9) * 1.5], [0, i * 0.9, 0], null, '#6b4a2c');
    }
  } else if (k === 'cage') {
    const W = 0.95, Lz = 1.3, H = 0.95;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) A(new THREE.BoxGeometry(0.07, H, 0.07), [sx * W / 2, H / 2, sz * Lz / 2], null, null, '#5a3f28');
    for (const sx of [-1, 1]) A(new THREE.BoxGeometry(0.06, 0.06, Lz), [sx * W / 2, H, 0], null, null, '#6b4a2c');
    for (const sz of [-1, 1]) A(new THREE.BoxGeometry(W, 0.06, 0.06), [0, H, sz * Lz / 2], null, null, '#6b4a2c');
    A(new THREE.BoxGeometry(W, 0.04, Lz), [0, 0.03, 0], null, null, '#7a5a38');
    for (const sx of [-1, 1]) for (let i = 1; i < 6; i++) A(new THREE.CylinderGeometry(0.018, 0.018, H, 4), [sx * W / 2, H / 2, -Lz / 2 + i * Lz / 6], null, null, '#8a6a42');
    for (let i = 1; i < 4; i++) A(new THREE.CylinderGeometry(0.018, 0.018, H, 4), [-W / 2 + i * W / 4, H / 2, -Lz / 2], null, null, '#8a6a42');
    for (let i = 1; i < 4; i++) A(new THREE.CylinderGeometry(0.016, 0.016, Lz, 4), [-W / 2 + i * W / 4, H, 0], [Math.PI / 2, 0, 0], null, '#8a6a42');
    // the door: up when armed, down when it has dropped
    const dy = armed ? H + 0.42 : H / 2;
    for (let i = 0; i < 4; i++) A(new THREE.CylinderGeometry(0.018, 0.018, H, 4), [-W / 2 + (i + 0.5) * W / 4, dy, Lz / 2 + 0.03], null, null, '#8a6a42');
    A(new THREE.BoxGeometry(W, 0.06, 0.05), [0, dy + H / 2 - 0.03, Lz / 2 + 0.03], null, null, '#6b4a2c');
    if (armed) { for (const sx of [-1, 1]) A(new THREE.BoxGeometry(0.05, 0.6, 0.05), [sx * W / 2, H + 0.3, Lz / 2 + 0.03], null, null, '#5a3f28'); A(new THREE.CylinderGeometry(0.005, 0.005, 1.3, 3), [0, H + 0.05, 0], [Math.PI / 2, 0, 0], null, '#d8c9a0'); }
  }
  return (TRAPS.geo[key] = G2.build());
}
function trapLook(T) {
  T.mesh.geometry = trapGeo(T.k, T.armed);
  if (!TRAPS.baitM) { TRAPS.baitM = new THREE.MeshLambertMaterial({ color: '#9a2a1c' }); TRAPS.baitG = new THREE.IcosahedronGeometry(0.11, 0); }
  if (T.bait && !T.baitMesh) { T.baitMesh = new THREE.Mesh(TRAPS.baitG, TRAPS.baitM); T.baitMesh.position.set(0, T.k === 'cage' ? 0.14 : 0.12, T.k === 'cage' ? -0.25 : 0); T.mesh.add(T.baitMesh); }
  if (T.baitMesh) T.baitMesh.visible = !!T.bait && T.armed;
}
function trapAdd(k, x, z, rot, owner) {
  if (!BLD.mat) BLD.mat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
  const T = { id: ++TRAPS.seq, k, x, z, rot, owner: owner || 'p', armed: true, bait: 0, caught: null, lure: null, cT: 0, mesh: new THREE.Mesh(trapGeo(k, true), BLD.mat) };
  T.mesh.position.set(x, getH(x, z), z); T.mesh.rotation.y = rot; T.mesh.castShadow = true; T.mesh.receiveShadow = true; scene.add(T.mesh);
  TRAPS.list.push(T); trapLook(T); return T;
}
function trapRemove(T) {
  if (T.caught && T.caught.alive) trapRelease(T, false);
  if (T.lure && T.lure.trapLure === T) T.lure.trapLure = null;
  scene.remove(T.mesh); const i = TRAPS.list.indexOf(T); if (i >= 0) TRAPS.list.splice(i, 1);
}
// ---------- setting a trap where you stand ----------
function trapWhy(k, x, z) {
  const R = TRAPT[k].r;
  if (waterDepth(x, z) > 0) return 'מלכודת שמים על אדמה יבשה';
  if (getNY(x, z) < 0.82) return 'השטח כאן משופע מדי';
  if (trunkPush({ x, z }, R)) return 'עץ או מבנה בדרך';
  if (TRAPS.list.some(T => Math.hypot(T.x - x, T.z - z) < 4)) return 'יש כבר מלכודת קרובה';
  for (const c of HUNT.camps) if (Math.hypot(c.x - x, c.z - z) < 12) return 'קרוב מדי למדורה: חיות לא יבואו לכאן';
  if (DEF.n && defNearSeg(x, z, R + 0.5)) return 'גדר בדרך';
  return '';
}
function trapSet(k) {
  const a = P.a, T0 = TRAPT[k]; if (!a || !P.human) return false;
  if (a.swimming || P.boat) { UI.notify('מלכודות טומנים על היבשה', 'bad'); return false; }
  if (myTraps().length >= trapsMax()) { UI.notify(`יש לך כבר ${trapsMax()} מלכודות. אפשר לפרק אחת ישנה (כפתור הזהב לידה)`, 'bad'); return false; }
  let spot = null, why = '';
  for (const d of [1.7, 2.4, 1.2, 3.1]) { const x = a.pos.x + Math.sin(a.yaw) * d, z = a.pos.z + Math.cos(a.yaw) * d; why = trapWhy(k, x, z); if (!why) { spot = { x, z }; break; } }
  if (!spot) { UI.notify(why, 'bad'); return false; }
  if (!takeRes('wood', T0.wood)) { UI.notify(`צריך ${T0.wood} עצים ל${T0.n}`, 'bad'); return false; }
  const T = trapAdd(k, spot.x, spot.z, a.yaw, 'p');
  PROG.flags.trap = 1; AUD.play('net', 0.5); saveGame();
  const food = (P.inv.meat || 0) + (P.inv.fish || 0) + (P.inv.cooked || 0);
  UI.notify(`${T0.ic} טמנת ${T0.n}. ${k === 'cage' ? 'כלבי יער ואוצלוטים' : 'חיות'} יגיעו אליה עם הזמן${food ? '. פיתיון מושך אותן מהר יותר: כפתור הזהב ליד המלכודת' : ''}`, 'good');
  return T;
}
// ---------- what can be caught, and the walk to the trap ----------
function trapFits(T, b) {
  return !!b && b.alive && !b.dead && !b.gone && b.tpl.kind === 'quad' && TRAPT[T.k].catch.includes(b.spId) && !b.pet && !b.tribe && !b.tribeDog && !b.hunter && !b.isPlayer && !b.isPartner && !b.cub && !b.trapped && !b.cowCamp && !b.legend && !b.swimming && !b.perched && !b.carriedBy && !b.heldBy && b.state !== 'held';
}
function trapUnlure(b) { const T = b.trapLure; b.trapLure = null; if (T && T.lure === b) T.lure = null; }
function trapLureStep(b, dt) {
  const T = b.trapLure;
  if (!T || !T.armed || T.caught || !TRAPS.list.includes(T) || G.t > (b.trapLureT || 0) || !trapFits(T, b) || b.state === 'flee' || b.state === 'fight' || b.state === 'hunt') { trapUnlure(b); return false; }
  const p = P.a;
  if (p && p.alive && dist2(p.pos, b.pos) < 6.5 && !P.crouch && P.noise > 0.55) { trapUnlure(b); threatReact(b, p, true); return true; }
  const dx = T.x - b.pos.x, dz = T.z - b.pos.z, d = Math.hypot(dx, dz) || 0.01;
  if (d < TRAPT[T.k].r + b.rad * 0.3) { trapCatch(T, b); return true; }
  b.move(dx / d, dz / d, (b.sp.walk || 1.5) * (d > 10 ? 0.75 : 0.5), dt); b.pose = 'move';
  if (d < 4) b.look = Math.sin(G.t * 2.4 + b.id) * 0.5;
  return true;
}
// ---------- caught: the animal is held at the trap until someone comes ----------
function trapCatch(T, b, quiet) {
  trapUnlure(b); if (T.lure && T.lure !== b) trapUnlure(T.lure);
  T.caught = b; T.armed = false; T.cT = 0; T.bait = 0; b.trapped = T; b.frozen = true; b.state = 'held'; b.speed = 0; b.foe = null; b.target = null; b.threat = null;
  if (b.group) { const m = b.group.members, j = m.indexOf(b); if (j >= 0) m.splice(j, 1); if (b.group.leader === b) b.group.leader = m[0] || null; b.group = null; }
  b.yaw = T.rot + (T.k === 'cage' ? Math.PI : rr(-0.6, 0.6));
  trapLook(T); trapHoldPos(T, 0);
  if (quiet) return;
  const near = P.a && dist2(P.a.pos, T) < 45;
  if (near) AUD.play(T.k === 'cage' ? 'hammer' : 'net', 0.6);
  if (b.dCam < 50) AUD.at('hurt', b.pos, 0.5);
  if (T.owner === 'p') {
    P.pings.push({ x: T.x, z: T.z, t: 12 }); PROG.flags.trapCatch = 1;
    UI.notify(`${TRAPT[T.k].ic} ${b.sp.he} ${heb(b, 'נתפס', 'נתפסה')} ${TRAPT[T.k].word}!${near ? '' : ` (${whereIs({ pos: T })}, מסומן במפה)`}`, 'good');
    if (T.k === 'cage' && b.spId === 'bushdog' && !TRAPS.told.dog) { TRAPS.told.dog = 1; setTimeout(() => UI.notify('כלב יער בכלוב: אפשר לאלף אותו לך, או לתת אותו למלונה של השבט', 'good'), 2500); }
  } else tribeNews(`${b.sp.he} ${heb(b, 'נתפס', 'נתפסה')} במלכודת של הציידים`);
}
function trapHoldPos(T, dt) {
  const b = T.caught; if (!b || !b.alive) return;
  const g = getH(T.x, T.z);
  if (T.k === 'pit') { b.ownY = true; b.pos.set(T.x, g - Math.min(0.8 * b.scale + 0.1, b.height * 0.58), T.z); }
  else if (T.k === 'cage') { const off = -0.1; b.ownY = true; b.pos.set(T.x + Math.sin(T.rot) * off, g + 0.05, T.z + Math.cos(T.rot) * off); }
  else { const pull = 0.35 + Math.max(0, Math.sin(G.t * 3.1 + T.id)) * 0.18; b.pos.set(T.x + Math.sin(b.yaw) * pull, g, T.z + Math.cos(b.yaw) * pull); }
  b.speed = 0; if (b.vel) b.vel.set(0, 0, 0);
  // it struggles
  if ((T.jerk = (T.jerk || 0) - dt) <= 0) { T.jerk = rr(0.8, 2.4); b.anim.hurt = 0.22; b.yaw += rr(-0.35, 0.35); if (b.dCam < 22 && rng() < 0.3) AUD.at(b.sp.call || 'growl', b.pos, 0.35); }
  b.pose = T.k === 'snare' && Math.sin(G.t * 3.1 + T.id) > 0.3 ? 'move' : 'idle';
}
function trapRelease(T, scare) {
  const b = T.caught; T.caught = null; if (!b) return;
  b.trapped = null; b.frozen = false; b.ownY = false; b.state = 'idle'; b.stT = 2;
  if (b.alive) { if (T.k === 'pit' || T.k === 'cage') { const L = trapOut(T); b.pos.set(L.x, 0, L.z); } b.ground(1, true); if (scare && P.a) threatReact(b, P.a, true); }
}
const trapOut = T => ({ x: T.x + Math.sin(T.rot) * 1.6, z: T.z + Math.cos(T.rot) * 1.6 });
// killing what is in the trap: the body is pulled out beside it, ready for the knife
function trapKill(T, killer) {
  const c = T.caught; if (!c || !c.alive) return null;
  trapLost(T); c.hp = 0; kill(c, killer);
  if (T.k !== 'snare') { const L = trapOut(T); c.pos.set(L.x, getH(L.x, L.z), L.z); }
  c.ownY = false; return c;
}
// ---------- every second: catches, lures, escapes ----------
function trapsUpdate(dt) {
  if (!TRAPS.list.length) return;
  for (const T of TRAPS.list) if (T.caught) { if (!T.caught.alive || T.caught.gone || T.caught.pet) trapLost(T); else trapHoldPos(T, dt); }
  TRAPS.t -= dt; if (TRAPS.t > 0) return; TRAPS.t = 1;
  const gh = timeRate();
  for (const T of TRAPS.list.slice()) {
    const K = TRAPT[T.k];
    if (T.caught) {
      T.cT += gh;
      if (K.hold && T.cT > K.hold) { const b = T.caught; trapRelease(T, true); if (T.owner === 'p') UI.notify(`${b.sp.he} ${heb(b, 'קרע', 'קרעה')} את ${K.n} ו${heb(b, 'ברח', 'ברחה')}. צריך לבדוק מלכודות לפני שעובר יום`, 'bad'); }
      continue;
    }
    if (!T.armed) continue;
    if (T.bait && (T.baitT = (T.baitT || 0) + gh) > 30) { T.bait = 0; trapLook(T); }
    // whatever walks into an armed trap is caught
    let hit = null; shQuery(T.x, T.z, K.r + 2.5, (b, d) => { if (!hit && trapFits(T, b) && d < K.r + b.rad * 0.3) hit = b; });
    if (hit) { trapCatch(T, hit); continue; }
    if (T.lure && (!T.lure.alive || T.lure.trapLure !== T)) T.lure = null;
    if (!T.lure && rng() < (T.bait ? 0.09 : 0.03) * (isNight() ? 1.5 : 1)) {
      const R = T.bait ? 60 : 30; let best = null, bd = 1e9;
      shQuery(T.x, T.z, R, (b, d) => { if (d < bd && trapFits(T, b) && !b.trapLure && !b.lured && b.state !== 'flee' && b.state !== 'fight' && b.state !== 'hunt' && !(P.a && dist2(P.a.pos, b.pos) < 9)) { bd = d; best = b; } });
      if (best) { T.lure = best; best.trapLure = T; best.trapLureT = G.t + 150; }
    }
  }
}
// the animal died in the trap (a predator, a spear): the trap is sprung, the body stays for butchering
function trapLost(T) {
  const b = T.caught; T.caught = null;
  if (b) { b.trapped = null; b.frozen = false; if (T.k !== 'pit') b.ownY = false; else if (b.dead) { const L = trapOut(T); b.pos.set(L.x, getH(L.x, L.z), L.z); b.ownY = false; } }
  T.armed = false; trapLook(T);
}
// ---------- the gold button by a trap ----------
CTXT.trap = ['trap', 'מלכודת', 'לבדוק את המלכודת'];
function trapNear(r) {
  const a = P.a; if (!a) return null; let best = null, bd = 1e9;
  for (const T of TRAPS.list) { const d = Math.hypot(T.x - a.pos.x, T.z - a.pos.z); if (d < (r || 2.2) + TRAPT[T.k].r && d < bd) { bd = d; best = T; } }
  return best;
}
function trapCtx() {
  const T = trapNear(); if (!T) return null;
  // a body lying by the trap is butchered first
  let carcass = false; shQuery(P.a.pos.x, P.a.pos.z, 3, b => { if (b.dead && (b.food || 0) > 0.5 && b.tpl.kind === 'quad') carcass = true; });
  if (carcass && !T.caught) return null;
  TRAPS.near = T; return 'trap';
}
CTXH.trap = () => { if (CLB.latch) return; CLB.latch = true; const T = TRAPS.near && TRAPS.list.includes(TRAPS.near) ? TRAPS.near : trapNear(); if (T) trapCard(T); };
const foodInv = () => (P.inv.meat || 0) + (P.inv.fish || 0) + (P.inv.cooked || 0);
function payFood1() { if ((P.inv.meat || 0) > 0) P.inv.meat--; else if ((P.inv.fish || 0) > 0) P.inv.fish--; else if ((P.inv.cooked || 0) > 0) P.inv.cooked--; else return false; return true; }
function trapCard(T) {
  const K = TRAPT[T.k], b = T.caught && T.caught.alive ? T.caught : null, own = ownCamp(), kennel = own && BLD.list.some(q => q.done && q.t === 'kennel');
  const pets = (P.a.pets || []).filter(q => q.alive && !q.gone).length, roomPet = pets < P.mods.petsMax;
  let txt = '', btns = '';
  if (b) {
    const dog = b.spId === 'bushdog', tame = T.k === 'cage' && TAME_OK.includes(b.spId);
    txt = `<p><b>${b.sp.he}</b> ${heb(b, 'נתפס', 'נתפסה')} ${K.word}${tame ? ` ${heb(b, 'וחי. אפשר לאלף אותו', 'וחיה. אפשר לאלף אותה')}${dog ? '' : ' ולהפוך לחיית לוויה'}` : T.k === 'cage' ? ` ${heb(b, 'ונשאר', 'ונשארה')} בחיים` : ''}.</p>`;
    if (tame) {
      btns += `<button class="btn pri" data-a="tame"${foodInv() && roomPet ? '' : ' disabled'}>❤️ לאלף לי (מנת אוכל)</button>`;
      if (kennel && dog) btns += '<button class="btn pri" data-a="tribe">🐕 למלונה של השבט</button>';
      if (!roomPet) txt += `<p class="idim">יש לך כבר ${pets} חיות מאולפות, וזה המקסימום.</p>`; else if (!foodInv()) txt += '<p class="idim">כדי לאלף צריך מנת אוכל: בשר, דג או מבושל.</p>';
    }
    btns += `<button class="btn${tame ? '' : ' pri'}" data-a="kill">🔪 לשחוט ולחתוך בשר</button><button class="btn" data-a="free">🕊️ לשחרר</button>`;
  } else if (T.armed) {
    txt = `<p>המלכודת דרוכה${T.bait ? ', עם פיתיון. חיות מגיעות מרחוק' : '. בלי פיתיון חיות מגיעות לאט'}.</p><p class="idim">${K.d}</p>`;
    if (!T.bait) btns += `<button class="btn pri" data-a="bait"${foodInv() ? '' : ' disabled'}>🍖 לשים פיתיון (מנת אוכל)</button>`;
    btns += '<button class="btn" data-a="take">🧺 לפרק ולקחת</button>';
  } else {
    txt = `<p>המלכודת נסגרה${T.k === 'pit' ? ' והבור פתוח' : ''}. צריך לדרוך אותה מחדש.</p>`;
    btns += '<button class="btn pri" data-a="arm">🔧 לדרוך מחדש</button><button class="btn" data-a="take">🧺 לפרק ולקחת</button>';
  }
  const who = T.owner === 't' ? '<span class="cchip">של הציידים של השבט</span>' : '';
  const el = uiCard('trapov', `<div class="itabs"><b style="flex:1;font-size:18px">${K.ic} ${K.n}</b>${who}<button class="ix" data-a="close" aria-label="סגירה">✕</button></div>${txt}<div class="btns" style="flex-wrap:wrap">${btns}</div>`);
  el.querySelector('.card').classList.add('vxcard');
  el.onclick = e => {
    const x = e.target.closest('button'); if (!x || x.disabled) return;
    const A = x.dataset.a, c = T.caught;
    closeCard('trapov');
    if (A === 'kill' && c && c.alive) { trapKill(T, P.a); AUD.play('bite', 0.5); UI.notify(`${c.sp.he} מוכן לחיתוך: להחזיק את כפתור הזהב ליד הגוף`, 'good'); }
    else if (A === 'free' && c) { trapRelease(T, true); T.armed = false; trapLook(T); }
    else if (A === 'tame' && c && c.alive && payFood1()) {
      trapRelease(T, false); T.armed = false; trapLook(T);
      const dog = c.spId === 'bushdog';
      c.name = c.name || pick(NAMES[c.sex]); c.social = false; c.isRival = false; c.brain = null; c.hunger = 90; makePet(P.a, c); PROG.flags.trapTameAny = 1; if (dog) { PROG.flags.tamedDog = 1; PROG.flags.trapTame = 1; }
      UI.notify(dog ? heb(c, `אילפת את ${c.name}. הוא הולך איתך, צד ונלחם לצידך. צריך להאכיל אותו`, `אילפת את ${c.name}. היא הולכת איתך, צדה ונלחמת לצידך. צריך להאכיל אותה`)
        : heb(c, `אילפת את ${c.name} ה${c.sp.he}. הוא הולך איתך לכל מקום`, `אילפת את ${c.name} ה${c.sp.he}. היא הולכת איתך לכל מקום`), 'love');
      FX.spawn('heart', c.pos.x, c.pos.y + c.height, c.pos.z, 6); AUD.play('heart');
    }
    else if (A === 'tribe' && c && c.alive) {
      trapRelease(T, false); T.armed = false; trapLook(T);
      c.name = c.name || pick(DOGN[c.sex]); c.socialExtra = true; c.tribeDog = true; c.hunger = 100; c.brain = null;
      const o = clanAdults().find(m => (m.cls === 'hunter' || m.cls === 'warrior') && !(m.pets || []).some(q => q.alive && q.tribeDog));
      if (o) makePet(o, c); else { c.state = 'idle'; c.home.set(own.x, 0, own.z); }
      UI.notify(`${c.name} ${heb(c, 'הצטרף', 'הצטרפה')} לכלבים של השבט${o ? ` ${heb(c, 'ויוצא', 'ויוצאת')} עם ${o.name}` : ''}`, 'good'); PROG.flags.trapTame = 1;
    }
    else if (A === 'bait' && payFood1()) { T.bait = 1; T.baitT = 0; trapLook(T); UI.notify('שמת פיתיון. חיות יריחו אותו מרחוק', 'good'); AUD.play('eat', 0.3); }
    else if (A === 'arm') { T.armed = true; trapLook(T); AUD.play('net', 0.4); UI.notify('המלכודת דרוכה שוב', 'good'); }
    else if (A === 'take') { trapRemove(T); P.inv.wood = Math.min(CARRY.wood, (P.inv.wood || 0) + Math.max(1, TRAPT[T.k].wood - 1)); UI.notify('פירקת את המלכודת והחזרת את רוב העצים', 'good'); }
    saveGame();
  };
}
// ---------- the toolbox: set a trap right here ----------
function trapsBoxHtml() {
  const n = myTraps().length, mx = trapsMax(), wood = resHave('wood'), here = P.a && !P.a.swimming && !P.boat;
  const full = myTraps().filter(T => T.caught && T.caught.alive).length;
  return `<h3>מלכודות <small style="font-weight:400;color:var(--dim)">${n}/${mx}${full ? ` · ${full} תפסו משהו!` : ''}</small></h3><div class="btns" style="flex-wrap:wrap">` +
    Object.entries(TRAPT).map(([k, T]) => `<button class="btn${k === 'snare' ? ' pri' : ''}" data-a="trap_${k}"${wood < T.wood || n >= mx || !here ? ' disabled' : ''}>${T.ic} ${T.n} (${T.wood} 🪵)</button>`).join('') +
    `</div><p class="idim">טומנים לפניך, במקום שיש בו חיות ורחוק מהמדורה. חבל לטרף קטן, בור לגדול, כלוב לחיה חיה: כלב יער שנתפס בכלוב מתאלף. פיתיון מושך מהר יותר, ומלכודת שתפסה מסומנת במפה.</p>`;
}
// ---------- the tribe's hunters set snares around the village, check every trap and bring the catch ----------
function trapTribeWant(v) {
  const hunters = clanAdults().filter(m => m.cls === 'hunter').length; if (hunters < 2) return null;
  const mine = TRAPS.list.filter(T => T.owner === 't');
  const want = Math.min(4, 1 + Math.floor(hunters / 2)) + (BLD.list.some(q => q.done && q.t === 'kennel') ? 1 : 0);
  if (mine.length >= want) return null;
  const k = !mine.some(T => T.k === 'cage') && BLD.list.some(q => q.done && q.t === 'kennel') ? 'cage' : mine.length % 3 === 2 ? 'pit' : 'snare';
  for (let t = 0; t < 14; t++) {
    const ang = rng() * TAU, r = villageR() + rr(18, 60), x = v.x + Math.cos(ang) * r, z = v.z + Math.sin(ang) * r;
    if (!inBounds(x, z) || trapWhy(k, x, z)) continue;
    return { k, x, z };
  }
  return null;
}
function trapForTribe(a, v) {
  const R = villageR() + 95; let best = null, bd = 1e9;
  for (const T of TRAPS.list) {
    if (T.claim && T.claim !== a && T.claim.alive && T.claim.job && T.claim.job.T === T) continue;
    const d = Math.hypot(T.x - v.x, T.z - v.z); if (d > R || (T.owner === 'p' && d > villageR() + 40)) continue;
    const c = T.caught && T.caught.alive ? T.caught : null;
    // the tribe empties its own traps, and your snares and pits near the village; your cages are yours to tame from
    const want = c ? T.owner === 't' || T.k !== 'cage' : T.owner === 't' && !T.armed;
    if (!want) continue;
    const dd = dist2(T, a.pos); if (dd < bd) { bd = dd; best = T; }
  }
  return best;
}
function trapJob(a, dt, v) {
  const j = a.job, T = j.T;
  if (j.set) {
    const d = jobGo(a, j.x, j.z, a.sp.walk * 1.3, dt);
    if (d < 1.4) { a.move(0, 0, 0, dt); a.pose = 'kneel'; j.t = (j.t || 0) + dt; if (j.t > 3) { if (!trapWhy(j.set, j.x, j.z)) { const st = boxStore(); if ((st.wood || 0) >= TRAPT[j.set].wood) { st.wood -= TRAPT[j.set].wood; trapAdd(j.set, j.x, j.z, a.yaw, 't'); tribeNews(`${a.name} ${heb(a, 'טמן', 'טמנה')} ${TRAPT[j.set].n} ליד הכפר`); } } a.job = null; } }
    return;
  }
  if (!T || !TRAPS.list.includes(T)) { a.job = null; return; }
  T.claim = a;
  const d = jobGo(a, T.x + Math.sin(T.rot) * 1.4, T.z + Math.cos(T.rot) * 1.4, a.sp.walk * 1.4, dt);
  if (d > 1.2) return;
  a.move(0, 0, 0, dt); a.yaw = Math.atan2(T.x - a.pos.x, T.z - a.pos.z); a.pose = 'kneel';
  j.t = (j.t || 0) + dt; if (j.t < 2) return;
  const c = T.caught && T.caught.alive ? T.caught : null; T.claim = null;
  if (c && T.k === 'cage' && c.spId === 'bushdog') {
    trapRelease(T, false); T.armed = true; trapLook(T); a.job = null;
    if (!BLD.list.some(q => q.done && q.t === 'kennel')) return;   // no kennel to keep it: let it go
    c.name = c.name || pick(DOGN[c.sex]); c.socialExtra = true; c.tribeDog = true; c.hunger = 100; c.brain = null; makePet(a, c);
    tribeNews(`${a.name} ${heb(a, 'אילף', 'אילפה')} את ${c.name}, כלב יער שנתפס בכלוב`); return;
  }
  if (c) { trapKill(T, a); T.armed = true; trapLook(T); a.job = { k: 'collect', c, t: 2.6 }; return; }
  T.armed = true; trapLook(T); a.job = null;
}
// ---------- save, load, reset ----------
function trapsSave() { return TRAPS.list.map(T => [T.k, +T.x.toFixed(2), +T.z.toFixed(2), +T.rot.toFixed(2), T.armed ? 1 : 0, T.bait ? 1 : 0, T.owner, T.caught && T.caught.alive ? [T.caught.spId, T.caught.sex, T.caught.name || '', +T.cT.toFixed(1)] : 0]); }
function trapsReset() { for (const T of TRAPS.list.slice()) trapRemove(T); TRAPS.list = []; TRAPS.told = {}; }
function trapsLoad(d) {
  trapsReset(); if (!d) return;
  for (const q of d) {
    if (!TRAPT[q[0]]) continue;
    const T = trapAdd(q[0], q[1], q[2], q[3], q[6] || 'p'); T.armed = !!q[4]; T.bait = q[5] ? 1 : 0; trapLook(T);
    if (q[7] && SPECIES[q[7][0]]) { const b = new Animal(q[7][0], T.x, T.z, { sex: q[7][1] }); if (q[7][2]) b.name = q[7][2]; trapCatch(T, b, true); T.cT = q[7][3] || 0; }
  }
}
// the map shows your traps; a full one blinks
function trapMiniDots(pt) {
  for (const T of TRAPS.list) {
    const full = T.caught && T.caught.alive;
    pt(T.x, T.z, 3.5, T.owner === 'p' ? '#f0d9a0' : '#bba57a');
    if (full) pt(T.x, T.z, 6 + Math.sin(G.t * 6) * 1.5, '#ffcf4a', true, T.owner === 'p');
    else if (!T.armed && T.owner === 'p') pt(T.x, T.z, 5, 'rgba(240,217,160,.6)', true);
  }
}
// ================= FENCES, GATES AND OBSTACLES: the village closes itself in as it grows =================
// Every piece is a building in BLD.list. Segments (fences, walls, gates) are lines with a thickness; the finished ones
// live in DEF.g (10 m cells) for collisions. Gates let our people through and stop everyone else.
Object.assign(BTYPES, {
  fence: { n: 'גדר עץ', dn: 'גדר העץ', g: 'f', d: 'גדר נמוכה של מוטות וקורות. עוצרת חיות ופושטים, ואפשר לקפוץ מעליה', wood: 4, work: 10, r: 2, len: 4, need: 0, tier: 0, ic: '🪵', water: 999, def: { th: 0.2, hp: 70, low: 1, up: 'palisade' } },
  gate: { n: 'שער', dn: 'השער', g: 'm', d: 'שער בגדר: אנשי השבט עוברים בו, ואויבים וחיות נעצרים', wood: 6, work: 14, r: 2, len: 4, need: 0, tier: 0, ic: '🚪', water: 999, def: { th: 0.22, hp: 110, gate: 1, up: 'gatehouse' } },
  stakes: { n: 'יתדות חדים', dn: 'היתדות החדים', g: 'p', d: 'שורת יתדות מחודדים נעוצים באלכסון. אויב או טורף שנדחף אליהם נפצע', wood: 5, work: 12, r: 1.6, len: 3.2, need: 0, tier: 1, ic: '🔱', water: 999, def: { th: 0.5, hp: 90, low: 1, dmg: 9 } },
  thorns: { n: 'משוכת קוצים', dn: 'משוכת הקוצים', g: 'f', d: 'גדר חיה של קוצים: חוסמת, שורטת את מי שנדחף אליה, וצומחת בחזרה כשנפגעת', wood: 3, work: 9, r: 2, len: 4, need: 0, tier: 1, ic: '🌵', water: 999, def: { th: 0.45, hp: 60, low: 1, dmg: 4, regrow: 1, up: 'palisade' } },
  palisade: { n: 'חומת יתדות', dn: 'חומת היתדות', g: 'f', d: 'חומה גבוהה של גזעים מחודדים. אי אפשר לקפוץ מעליה, וטורפים לא פורצים אותה', wood: 10, work: 24, r: 2.2, len: 4.4, need: 0, tier: 2, ic: '🛡️', water: 999, def: { th: 0.3, hp: 240, up: 'stonewall' } },
  spikepit: { n: 'בור יתדות', dn: 'בור היתדות', g: 'm', d: 'בור מוסווה עם יתדות. אויב שדורך עליו נופל, נפצע קשה ונתקע. אנשי השבט יודעים לעקוף אותו', wood: 6, work: 16, r: 1.4, need: 0, tier: 2, ic: '🕳️', water: 999, def: { pit: 1, dmg: 45, hp: 1 } },
  stonewall: { n: 'חומת אבן', dn: 'חומת האבן', g: 'f', d: 'אבנים וטיט על יסוד עץ: החומה החזקה ביותר. פושטים מתקשים מאוד לפרוץ אותה', wood: 14, work: 40, r: 2.2, len: 4.4, need: 0, tier: 3, ic: '🧱', water: 999, def: { th: 0.45, hp: 600 } },
  gatehouse: { n: 'שער מבוצר', dn: 'השער המבוצר', g: 'm', d: 'שער כבד בין שני מגדלונים. לוחם עם קשת שומר עליו מלמעלה', wood: 22, work: 50, r: 2.6, len: 5.2, need: 0, tier: 3, ic: '🏯', water: 999, def: { th: 0.5, hp: 450, gate: 1, post: 1 } },
  walltower: { n: 'מגדל חומה', dn: 'מגדל החומה', g: 'm', d: 'מגדל אבן בתוך קו החומה. קשת עומד עליו ויורה על פושטים וטורפים, ואי אפשר כמעט לפרוץ אותו', wood: 26, work: 60, r: 2.4, len: 4.4, need: 0, tier: 4, ic: '🗼', water: 999, def: { th: 1.25, hp: 900, post: 1 } }
});
const DEFT = Object.keys(BTYPES).filter(k => BTYPES[k].def);
const isDef = t => !!(BTYPES[t] && BTYPES[t].def);
const defDN = t => BTYPES[t].dn || 'ה' + BTYPES[t].n;   // the name with "the"
const defG = (t, m, f, p) => ({ f, p })[BTYPES[t].g] || m;
const DEF = { n: 0, segs: [], pits: [], gates: [], g: new Map(), dirty: true, ver: 0, t: 0, fixT: 0, told: {}, warnT: -99, pitFall: [] };
function defDirty() { DEF.dirty = true; DEF.n = Math.max(DEF.n, 1); }
// ---------- how they look (local X runs along the piece, centred; Y up from the ground) ----------
const STONE = ['#8a857a', '#77726a', '#9a9486', '#6c675f'];
function leafParts(A, hx, dir, w, h) {
  const n = Math.max(4, Math.round(w / 0.38)), pw = w / n;
  for (let i = 0; i < n; i++) A(new THREE.BoxGeometry(pw - 0.02, h, 0.06), [hx + dir * (pw * (i + 0.5)), h / 2 + 0.06, 0], null, null, i % 2 ? '#6b4a2c' : '#5f4228');
  for (const y of [h * 0.25, h * 0.8]) A(new THREE.BoxGeometry(w, 0.1, 0.05), [hx + dir * w / 2, y, 0.05], null, null, '#4f3722');
  A(new THREE.BoxGeometry(Math.hypot(w, h * 0.55), 0.08, 0.04), [hx + dir * w / 2, h * 0.52, 0.06], [0, 0, dir * Math.atan2(h * 0.55, w)], null, '#4f3722');
}
const LEAF = { gate: [1.95, 1.92, 1.62], gatehouse: [1.6, 1.58, 2.35] };
function defGeo(t, part) {
  const G2 = new GB(), A = (geo, p, r, s, c, v) => G2.add(geo, M(p, r, s), c, v);
  if (t === 'fence') {
    for (let i = 0; i <= 4; i++) A(new THREE.CylinderGeometry(0.06, 0.085, 1.5, 6), [-2 + i, 0.6, 0], [0, 0, i % 2 ? 0.03 : -0.03], null, '#5a3f28');
    for (const [y, z] of [[0.42, 0.06], [0.98, -0.06]]) A(new THREE.BoxGeometry(4.12, 0.075, 0.07), [0, y, z], [0, 0, 0.01], null, '#6b4a2c');
    for (let i = 0; i < 4; i++) for (let k = 0; k < 3; k++) A(new THREE.CylinderGeometry(0.022, 0.028, 1.12, 4), [-2 + i + 0.25 + k * 0.25, 0.52, 0], [0, 0, (k - 1) * 0.05], null, '#7a5a38');
    for (let i = 0; i <= 4; i++) for (const y of [0.42, 0.98]) A(new THREE.BoxGeometry(0.13, 0.1, 0.17), [-2 + i, y, 0], null, null, '#2e2014', 0.05);
  } else if (t === 'gate' || t === 'gatehouse') {
    const [hx, w, h] = LEAF[t];
    if (t === 'gate') {
      for (const sx of [-1, 1]) { A(new THREE.CylinderGeometry(0.12, 0.15, 2.4, 7), [sx * 2.0, 1.05, 0], null, null, '#4f3722'); A(new THREE.ConeGeometry(0.15, 0.32, 7), [sx * 2.0, 2.4, 0], null, null, '#3a2a1c'); }
      A(new THREE.BoxGeometry(4.5, 0.17, 0.18), [0, 2.12, 0], null, null, '#5c4128'); A(new THREE.BoxGeometry(4.15, 0.1, 0.12), [0, 1.92, 0], null, null, '#6b4a2c');
      A(new THREE.CylinderGeometry(0.24, 0.24, 0.05, 12), [0, 1.62, 0.14], [Math.PI / 2, 0, 0], null, '#b3321f', 0.1);
      A(new THREE.SphereGeometry(0.07, 6, 5), [0, 1.62, 0.18], null, null, '#efe6d2', 0.05);
      for (const s of [-1, 1]) A(new THREE.BoxGeometry(0.06, 0.4, 0.02), [s * 0.17, 1.36, 0.14], [0, 0, s * 0.3], null, '#e8b83a', 0.1);
    } else {
      for (const sx of [-1, 1]) {
        A(new THREE.BoxGeometry(1.3, 3.9, 1.45), [sx * 2.25, 1.75, 0], null, null, STONE[sx > 0 ? 0 : 2], 0.14);
        for (let r = 0; r < 4; r++) A(new THREE.BoxGeometry(1.34, 0.05, 1.49), [sx * 2.25, 0.45 + r * 0.9, 0], null, null, '#5e5a52', 0.05);
        A(new THREE.ConeGeometry(1.1, 1.05, 4), [sx * 2.25, 4.22, 0], [0, Math.PI / 4, 0], null, '#a68c4c', 0.2);
        A(new THREE.BoxGeometry(0.5, 1.0, 0.04), [sx * 2.25, 2.6, 0.75], null, null, sx > 0 ? '#b3321f' : '#2f6fbf', 0.1);
        A(new THREE.BoxGeometry(0.5, 1.0, 0.04), [sx * 2.25, 2.6, -0.75], null, null, sx > 0 ? '#b3321f' : '#2f6fbf', 0.1);
      }
      A(new THREE.BoxGeometry(3.3, 0.22, 1.5), [0, 3.02, 0], null, null, '#5c4128');
      A(new THREE.BoxGeometry(3.25, 0.28, 0.28), [0, 2.74, 0], null, null, '#4f3722');
      for (const z of [-0.7, 0.7]) A(new THREE.BoxGeometry(3.3, 0.5, 0.08), [0, 3.38, z], null, null, '#6b4a2c');
      for (let i = 0; i < 5; i++) for (const z of [-0.7, 0.7]) A(new THREE.BoxGeometry(0.07, 0.6, 0.09), [-1.5 + i * 0.75, 3.38, z], null, null, '#4f3722');
    }
    if (part !== 'body') { leafParts(A, -hx, 1, w, h); leafParts(A, hx, -1, w, h); }
  } else if (t === 'leaf_gate' || t === 'leaf_gatehouse') {
    const [, w, h] = LEAF[t.slice(5)]; leafParts(A, 0, 1, w, h);
  } else if (t === 'stakes') {
    A(new THREE.CylinderGeometry(0.11, 0.12, 3.4, 7), [0, 0.16, 0], [0, 0, Math.PI / 2], null, '#5a3f28');
    for (let i = 0; i < 9; i++) {
      const x = -1.5 + i * 0.375, s = i % 2 ? 1 : -1, L = 1.7 + (i % 3) * 0.15, a = 0.62, cy = 0.55, cz = s * 0.32;
      A(new THREE.CylinderGeometry(0.035, 0.065, L, 5), [x, cy, cz], [s * a, 0, 0], null, '#6b4a2c');
      A(new THREE.ConeGeometry(0.037, 0.24, 5), [x, cy + Math.cos(a) * (L / 2 + 0.1), cz + s * Math.sin(a) * (L / 2 + 0.1)], [s * a, 0, 0], null, '#d9c79a');
    }
  } else if (t === 'thorns') {
    for (let i = 0; i < 7; i++) A(new THREE.IcosahedronGeometry(0.55 + (i % 3) * 0.08, 1), [-1.8 + i * 0.6, 0.5 + (i % 2) * 0.12, i % 2 ? 0.08 : -0.08], [i, i * 2, 0], [1.05, 0.8, 0.75], i % 2 ? '#2f4a1f' : '#3a5626', 0.25);
    for (let i = 0; i < 30; i++) {
      const x = -1.95 + (i * 0.131) % 3.9, y = 0.25 + (i % 6) * 0.15, side = i % 3 === 0 ? 0 : i % 2 ? 1 : -1;
      A(new THREE.ConeGeometry(0.028, 0.2, 4), [x, side ? y : 0.95 + (i % 4) * 0.05, side * 0.4], [side ? side * Math.PI / 2 : 0, 0, 0], null, '#d8c9a0', 0.1);
    }
    for (let i = 0; i < 6; i++) A(new THREE.SphereGeometry(0.05, 5, 4), [-1.6 + i * 0.62, 0.7 + (i % 2) * 0.2, (i % 2 ? 0.42 : -0.42)], null, null, '#8a1f1f', 0.1);
  } else if (t === 'palisade') {
    for (let i = 0; i < 13; i++) {
      const x = -2.16 + i * 0.36, H = 2.75 + ((i * 7) % 4) * 0.11;
      A(new THREE.CylinderGeometry(0.165, 0.185, H, 7), [x, H / 2 - 0.2, 0], [0, i, i % 2 ? 0.02 : -0.02], null, i % 3 ? '#5f4429' : '#6b4b2e', 0.2);
      A(new THREE.ConeGeometry(0.17, 0.42, 7), [x, H - 0.2 + 0.19, 0], [0, i, 0], null, '#4a3220');
    }
    for (const y of [0.9, 2.05]) A(new THREE.BoxGeometry(4.6, 0.13, 0.1), [0, y, -0.23], null, null, '#3e2a1a');
  } else if (t === 'stonewall') {
    for (let row = 0; row < 4; row++) {
      const ws = row % 2 ? [0.37, 0.74, 0.74, 0.74, 0.74, 0.74, 0.37] : [0.74, 0.74, 0.74, 0.74, 0.74, 0.74];
      let x = -2.22; ws.forEach((w, i) => { A(new THREE.BoxGeometry(w - 0.03, 0.47, 0.86 - row * 0.04), [x + w / 2, 0.24 + row * 0.5, 0], null, null, STONE[(i + row * 2) % 4], 0.12); x += w; });
    }
    A(new THREE.BoxGeometry(4.46, 0.16, 0.92), [0, 2.08, 0], null, null, '#6c675f', 0.08);
    for (let i = 0; i < 5; i++) A(new THREE.BoxGeometry(0.5, 0.42, 0.8), [-1.9 + i * 0.95, 2.36, 0], null, null, STONE[i % 4], 0.1);
  } else if (t === 'walltower') {
    const H = 4.6, D = 2.6;
    A(new THREE.BoxGeometry(4.4, H, D), [0, H / 2 - 0.1, 0], null, null, STONE[1], 0.1);
    for (let r = 1; r < 6; r++) A(new THREE.BoxGeometry(4.44, 0.05, D + 0.04), [0, r * 0.78, 0], null, null, '#5e5a52', 0.05);
    for (let r = 0; r < 6; r++) for (const z of [-1, 1]) {
      const xs = r % 2 ? [[-1.93, 0.48], [-1.1, 0.98], [0, 0.98], [1.1, 0.98], [1.93, 0.48]] : [[-1.65, 0.98], [-0.55, 0.98], [0.55, 0.98], [1.65, 0.98]];
      xs.forEach(([x, w], i) => A(new THREE.BoxGeometry(w, 0.7, 0.05), [x, 0.3 + r * 0.78, z * (D / 2 + 0.01)], null, null, STONE[(i + r) % 4], 0.12));
    }
    A(new THREE.BoxGeometry(4.7, 0.2, D + 0.3), [0, H, 0], null, null, '#5c4128');
    for (let i = 0; i < 5; i++) for (const z of [-1, 1]) A(new THREE.BoxGeometry(0.55, 0.55, 0.36), [-1.9 + i * 0.95, H + 0.37, z * (D / 2 - 0.02)], null, null, STONE[(i + 1) % 4], 0.1);
    for (const x of [-1, 1]) A(new THREE.BoxGeometry(0.36, 0.55, 0.6), [x * 2.17, H + 0.37, 0], null, null, STONE[2], 0.1);
    for (const x of [-1.1, 0, 1.1]) for (const z of [-1, 1]) A(new THREE.BoxGeometry(0.13, 0.75, 0.06), [x, 2.9, z * (D / 2 + 0.03)], null, null, '#1d1712', 0.02);
    A(new THREE.CylinderGeometry(0.04, 0.05, 1.7, 5), [1.75, H + 0.95, 0.85], null, null, '#4f3722');
    A(new THREE.BoxGeometry(0.75, 0.45, 0.03), [2.13, H + 1.5, 0.85], null, null, '#b3321f', 0.1);
  } else if (t === 'spikepit' || t === 'spikepit_open') {
    if (t === 'spikepit') {
      for (let i = 0; i < 6; i++) A(new THREE.BoxGeometry(2.8, 0.05, 0.06), [0, 0.05, 0], [0, i * 0.52 + 0.3, 0], null, i % 2 ? '#6b4a2c' : '#5a3f28');
      for (let i = 0; i < 16; i++) { const a = i * 2.4, r = 0.2 + (i % 6) * 0.2; A(new THREE.IcosahedronGeometry(0.3, 0), [Math.cos(a) * r, 0.06, Math.sin(a) * r], [0, a, 0], [1.2, 0.22, 1], ['#3f5a24', '#5a4a2a', '#4a6a2a', '#6a5532'][i % 4], 0.25); }
    } else {
      A(new THREE.CylinderGeometry(1.25, 1.25, 0.03, 20), [0, 0.02, 0], null, null, '#120b06', 0.05);
      A(new THREE.TorusGeometry(1.32, 0.12, 4, 22), [0, 0.04, 0], [Math.PI / 2, 0, 0], null, '#5a4030');
      for (let i = 0; i < 7; i++) { const a = i * 0.9; A(new THREE.ConeGeometry(0.05, 0.55, 5), [Math.cos(a) * 0.65, 0.12, Math.sin(a) * 0.65], [Math.cos(a) * 0.2, 0, Math.sin(a) * 0.2], null, '#d9c79a'); }
      for (let i = 0; i < 4; i++) A(new THREE.BoxGeometry(1.2, 0.05, 0.06), [Math.cos(i * 1.7) * 1.7, 0.05, Math.sin(i * 1.7) * 1.7], [0, i, 0], null, '#6b4a2c');
    }
  }
  return G2.build();
}
const DEFGEO = {};
const defGeoC = (t, part) => DEFGEO[t + (part || '')] || (DEFGEO[t + (part || '')] = defGeo(t, part));
// ---------- the line of a segment ----------
function segEnds(b) {
  const T = BTYPES[b.t], L = T.len * (b.sx || 1), ux = Math.cos(b.rot), uz = -Math.sin(b.rot), h = L / 2;
  return { ax: b.x - ux * h, az: b.z - uz * h, bx: b.x + ux * h, bz: b.z + uz * h, ux, uz, L };
}
function segDist(px, pz, ax, az, ux, uz, L) { let t = (px - ax) * ux + (pz - az) * uz; t = t < 0 ? 0 : t > L ? L : t; return Math.hypot(px - ax - ux * t, pz - az - uz * t); }
// the distance from a point to a building: to the line for a segment, to the centre otherwise
function bldDist(b, x, z) { const T = BTYPES[b.t]; if (T.span) { const e = b.br || brEnds(b); return segDist(x, z, e.ax, e.az, e.ux, e.uz, e.L); } if (!T.len) return Math.hypot(b.x - x, b.z - z); const e = segEnds(b); return segDist(x, z, e.ax, e.az, e.ux, e.uz, e.L); }
const bldR = b => { const T = BTYPES[b.t]; return T.span ? BR_W + 0.15 : T.len ? T.def.th + 0.25 : T.r; };
function defNearSeg(x, z, r) { for (const b of BLD.list) if (BTYPES[b.t].len && bldDist(b, x, z) < r + BTYPES[b.t].def.th) return b; return null; }
// a free end of a fence line near a point (an end with only one piece on it)
function segFreeEnd(x, z, R, skip) {
  const ends = [];
  for (const b of BLD.list) { if (!BTYPES[b.t].len || b === BLD.moveB) continue; const e = segEnds(b); ends.push({ x: e.ax, z: e.az, ux: -e.ux, uz: -e.uz, b }, { x: e.bx, z: e.bz, ux: e.ux, uz: e.uz, b }); }
  let best = null, bd = R;
  for (const p of ends) {
    if (skip && Math.hypot(p.x - skip.x, p.z - skip.z) < 0.4) continue;
    const d = Math.hypot(p.x - x, p.z - z); if (d >= bd) continue;
    let n = 0; for (const q of ends) if (Math.hypot(q.x - p.x, q.z - p.z) < 0.4) n++;
    if (n < 2) { bd = d; best = p; }
  }
  return best;
}
// where a piece goes while it is being placed: it continues a fence line you look along, or lies across your view
function segAim(t, a, fx, fz) {
  const T = BTYPES[t], L = T.len, ax = a.pos.x + fx * (L * 0.5 + 2), az = a.pos.z + fz * (L * 0.5 + 2);
  const E = segFreeEnd(ax, az, 4.5);
  let x1, z1, ux, uz;
  if (E) {
    x1 = E.x; z1 = E.z; let dx = ax + fx * L * 0.5 - x1, dz = az + fz * L * 0.5 - z1; const dl = Math.hypot(dx, dz);
    if (dl < 0.8) { dx = E.ux; dz = E.uz; } else { dx /= dl; dz /= dl; }
    // a gentle snap: straight on, or turning by 15 degree steps
    const base = Math.atan2(E.ux, E.uz), ang = Math.atan2(dx, dz), st = Math.round(angDiff(base, ang) / (Math.PI / 12)) * (Math.PI / 12);
    ux = Math.sin(base + st); uz = Math.cos(base + st);
  } else { const r = Math.atan2(fx, fz) + Math.PI / 2 + BLD.rot; ux = Math.sin(r); uz = Math.cos(r); x1 = ax - ux * L / 2; z1 = az - uz * L / 2; }
  let x2 = x1 + ux * L, z2 = z1 + uz * L, sx = 1;
  const F = segFreeEnd(x2, z2, 1.7, E ? { x: x1, z: z1 } : null);
  if (F) { const l2 = Math.hypot(F.x - x1, F.z - z1); if (l2 > L * 0.45 && l2 < L * 1.45) { x2 = F.x; z2 = F.z; sx = l2 / L; ux = (x2 - x1) / l2; uz = (z2 - z1) / l2; } }
  const h1 = getH(x1, z1), h2 = getH(x2, z2);
  return { x: (x1 + x2) / 2, z: (z1 + z2) / 2, rot: Math.atan2(-uz, ux), sx, tilt: Math.atan2(h2 - h1, L * sx), y: (h1 + h2) / 2, snapped: !!E, closes: !!F };
}
// can a piece stand here? (skip: the piece being moved, which does not block its own new place)
function segCheck(t, x, z, rot, sx, plan, skip, soft) {
  const v = ownCamp(), T = BTYPES[t]; if (!v) return 'קודם צריך מחנה משלך';
  if (!skip && !buildUnlocked(t)) return T.tier ? `נפתח כשהמחנה הופך ל${TIERN[T.tier]}` : `צריך שבט של ${T.need} אנשים`;
  if (!plan && !skip && woodHave() < T.wood) return `צריך ${T.wood} עצים (יש ${woodHave()})`;
  const b = { t, x, z, rot, sx: sx || 1 }, e = segEnds(b), maxR = Math.max(70, villageR() + 60) + 30;
  if (Math.hypot(e.ax - v.x, e.az - v.z) > maxR || Math.hypot(e.bx - v.x, e.bz - v.z) > maxR) return 'רחוק מדי מהכפר';
  if (segDist(v.x, v.z, e.ax, e.az, e.ux, e.uz, e.L) < (CAMPH.up.walls ? 12.5 : 7)) return 'קרוב מדי למדורה ולמחנה';
  // a fence may cross a brook or stand in the shallows; deep water stops it
  const n = Math.ceil(e.L / 0.5);
  if (T.def.water) {
    let deep = 0, max = 0; for (let i = 0; i <= n; i++) { const d = waterDepthT(e.ax + e.ux * e.L * i / n, e.az + e.uz * e.L * i / n); if (d > 0.45) deep++; if (d > max) max = d; }
    if (!deep) return 'שער מים עומד בתוך המים: בונים אותו מעל נהר או ערוץ, בין שתי חומות';
    if (max > 5.5) return 'המים כאן עמוקים מדי אפילו לשער מים';
  } else {
    for (let i = 0; i <= n; i++) { const px = e.ax + e.ux * e.L * i / n, pz = e.az + e.uz * e.L * i / n; if (waterDepth(px, pz) > 0.7) return 'המים כאן עמוקים מדי'; }
    if (Math.abs(getH(e.ax, e.az) - getH(e.bx, e.bz)) > 3.2) return 'השטח משופע מדי';
  }
  for (const q of BLD.list) {
    if (q === skip || (soft && soft.has(q.t))) continue;
    const Q = BTYPES[q.t];
    if (Q.len) { if (Math.hypot(q.x - x, q.z - z) < 0.9 && Math.abs(Math.sin(q.rot - rot)) < 0.5) return `יש כאן כבר ${Q.n}`; continue; }
    if (segDist(q.x, q.z, e.ax, e.az, e.ux, e.uz, e.L) < Q.r + T.def.th + 0.3) return `צמוד מדי ל${Q.n}`;
  }
  for (const Tr of TRAPS.list) if (segDist(Tr.x, Tr.z, e.ax, e.az, e.ux, e.uz, e.L) < TRAPT[Tr.k].r + 0.4) return 'מלכודת בדרך';
  return '';
}
// ---------- collisions: the grid of finished pieces ----------
function defRebuild() {
  DEF.dirty = false; DEF.segs = []; DEF.pits = []; DEF.gates = []; DEF.g.clear(); DEF.ver++; DEF.wg = []; DEF.wgb = [];
  for (const b of BLD.list) {
    const T = BTYPES[b.t]; b.seg = null; if (!T.def || !b.done) continue;
    if (T.def.pit) { if (!b.sprung) DEF.pits.push(b); continue; }
    if (b.broken || !T.len) continue;
    const e = segEnds(b), s = { b, ax: e.ax, az: e.az, ux: e.ux, uz: e.uz, L: e.L, nx: -e.uz, nz: e.ux, cx: b.x, cz: b.z, th: T.def.th, gate: !!T.def.gate, low: !!T.def.low, dmg: T.def.dmg || 0 };
    b.seg = s; DEF.segs.push(s); if (s.gate) DEF.gates.push(s); if (T.def.water) { DEF.wg.push(s); DEF.wgb.push(b); }
    const x0 = g10c(Math.min(e.ax, e.bx) - 1.5), x1 = g10c(Math.max(e.ax, e.bx) + 1.5), z0 = g10r(e.ax, Math.min(e.az, e.bz) - 1.5), z1 = g10r(e.ax, Math.max(e.az, e.bz) + 1.5);
    for (let cz = z0; cz <= z1; cz++) for (let cx = x0; cx <= x1; cx++) { const k = cz * GN + cx; let L = DEF.g.get(k); if (!L) DEF.g.set(k, L = []); L.push(s); }
  }
  DEF.n = DEF.segs.length + DEF.pits.length;
}
// who is who at a fence: ours (gates open), guests (peaceful people, gates open), foes (they break in), the wild (blocked)
function defSide(w) {
  if (!w) return 'wild';
  if (w.isPlayer || w.tribe || w.isPartner || w.cub || w.escort || w.cowCamp || w.tribeDog || w.tribeHorse || (w.pet && (w.pet === P.a || w.pet.tribe || w.pet.isPlayer))) return 'ours';
  if (w.hunter) return w.raider || w.duel || enemyOf(w) ? 'foe' : 'guest';
  if (w.brain === 'captive') return 'guest';
  if (w.invader || ((w.state === 'fight' || w.state === 'defend') && ourSide(w.foe)) || ((w.state === 'hunt' || w.state === 'stalk') && ourSide(w.target))) return 'foe';
  return 'wild';
}
function defPush(p, rad, who, dt) {
  if (DEF.dirty) defRebuild();
  if (!DEF.segs.length) return false;
  const ix = g10c1(p.x), iz = g10r1(p.x, p.z);
  let side = null, hit = false;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const L = DEF.g.get((iz + dz) * GN + ix + dx); if (!L) continue;
    for (const s of L) {
      let t = (p.x - s.ax) * s.ux + (p.z - s.az) * s.uz; t = t < 0 ? 0 : t > s.L ? s.L : t;
      const cx = s.ax + s.ux * t, cz = s.az + s.uz * t, ex = p.x - cx, ez = p.z - cz, d2 = ex * ex + ez * ez, R = s.th + rad;
      if (d2 >= R * R) continue;
      if (side === null) side = defSide(who);
      if (s.gate && (side === 'ours' || side === 'guest')) continue;
      if (who && who.isPlayer && who.airborne && s.low) continue;
      if (who && side !== 'foe' && G.t < (who.climbT || 0)) continue;
      const d = Math.sqrt(d2); let nx = s.nx, nz = s.nz;
      if (d > 1e-4) { nx = ex / d; nz = ez / d; } else if ((p.x - s.cx) * s.nx + (p.z - s.cz) * s.nz < 0) { nx = -nx; nz = -nz; }
      p.x = cx + nx * R; p.z = cz + nz * R; hit = true;
      // a foe hacking at a piece stands his ground until it gives way
      if (side === 'foe' && who.defBreakS === s && G.t - (who.defHitT || -9) < 1.6) { p.x = who.pos.x; p.z = who.pos.z; }
      if (who && dt) defContact(who, s, side, dt, nx, nz);
    }
  }
  return hit;
}
// pressing against a fence: our people look for a gate, foes break through, the wild gives up
function defContact(w, s, side, dt, nx, nz) {
  if (w.defLastT !== G.t) { if (G.t - (w.defLastT || -9) > 0.4) w.defT = 0; w.defT = (w.defT || 0) + dt; w.defLastT = G.t; }
  w.defS = s;
  if (side === 'ours' || side === 'guest') {
    if (w.isPlayer) { if (w.defT > 2.5 && !s.low && !defGateNear(w.pos, 70)) { w.climbT = G.t + 1.4; vxTell('climbWall', 'אין שער קרוב, אז טיפסת מעל החומה. כדאי לבנות שער'); } return; }
    w.defNx = nx; w.defNz = nz;
    if (w.gw || w.defT < 0.5) return;
    const g = defGateNear(w.pos, 90);
    if (g) { w.gw = { b: g.b, side: gateSide(w.pos, g), ph: 0, t: G.t + 30 }; DEF.nGate = (DEF.nGate || 0) + 1; }
    else { w.climbT = G.t + 1.6; DEF.nClimb = (DEF.nClimb || 0) + 1; }
    return;
  }
  if (side === 'wild') { if (w.defT > 7) w.climbT = G.t + 2; return; }
  // foes: thorns and stakes hurt; raiders hack the fence apart, predators claw the low ones
  if (s.dmg && G.t - (w.defDmgT || -9) > 0.7 && (!w.hunter || w.hp > w.maxHp * 0.3)) { w.defDmgT = G.t; hurt(w, s.dmg, null); if (w.dCam < 40) FX.spawn('blood', w.pos.x, w.pos.y + w.height * 0.5, w.pos.z, 2); }
  if (w.defT < 1.2 || G.t - (w.defHitT || -9) < (w.hunter ? 1.0 : 1.35)) return;
  const dmg = w.hunter ? (w.rwpn === 'sword' ? 20 : 14) : s.low ? 7 + massOf(w) * 0.08 : 0;
  if (!dmg) { if (w.defT > 9 && !w.hunter) { w.invader = false; w.state = 'idle'; w.foe = null; w.target = null; w.stT = 4; w.defT = 0; } return; }
  w.defHitT = G.t; w.defBreakS = s; w.anim.atk = 0.42; w.yaw = Math.atan2(-nx, -nz);
  if (w.dCam < 45) AUD.at(w.hunter ? 'chop' : 'growl', w.pos, 0.55);
  if (w.dCam < 30) FX.spawn('dust', s.ax + s.ux * s.L / 2, getH(s.cx, s.cz) + 0.8, s.az + s.uz * s.L / 2, 3);
  defHit(s.b, dmg, w);
}
// which side of a gate someone is on: the side of its line, flipped for every fence crossed on the way there
// (outside a round fence you can stand on the inner side of the gate's own line)
function gateSide(p, g) {
  let n = 0; const dx = g.cx - p.x, dz = g.cz - p.z;
  for (const s of DEF.segs) {
    if (s === g) continue;
    const ex = s.ux * s.L, ez = s.uz * s.L, den = dx * ez - dz * ex; if (Math.abs(den) < 1e-6) continue;
    const qx = s.ax - p.x, qz = s.az - p.z, t = (qx * ez - qz * ex) / den, u = (qx * dz - qz * dx) / den;
    if (t > 0.02 && t < 0.98 && u >= 0 && u <= 1) n++;
  }
  const sd = (p.x - g.cx) * g.nx + (p.z - g.cz) * g.nz;
  return (sd >= 0 ? 1 : -1) * (n % 2 ? -1 : 1);
}
function defGateNear(pos, R) { let best = null, bd = R; for (const g of DEF.gates) { const d = Math.hypot(g.cx - pos.x, g.cz - pos.z); if (d < bd) { bd = d; best = g; } } return best; }
// the way through a gate: to the near side of it, then out the far side
function gateSteer(w, dx, dz) {
  const g = w.gw, s = g.b && g.b.seg;
  if (!s || !s.gate || G.t > g.t) { w.gw = null; return [dx, dz]; }
  if (g.ph === 0) {
    const tx = s.cx + s.nx * g.side * 1.6, tz = s.cz + s.nz * g.side * 1.6; let ex = tx - w.pos.x, ez = tz - w.pos.z; const e = Math.hypot(ex, ez);
    if (e < 0.9) g.ph = 1;
    else {
      ex /= e; ez /= e;
      if (G.t - (w.defLastT || -9) < 0.3 && w.defNx != null) { ex += w.defNx * 0.75; ez += w.defNz * 0.75; const l = Math.hypot(ex, ez) || 1; ex /= l; ez /= l; }
      return [ex, ez];
    }
  }
  const sd = (w.pos.x - s.cx) * s.nx + (w.pos.z - s.cz) * s.nz;
  if (sd * g.side < -1.1) { w.gw = null; return [dx, dz]; }
  const tx = s.cx - s.nx * g.side * 1.9, tz = s.cz - s.nz * g.side * 1.9, ex = tx - w.pos.x, ez = tz - w.pos.z, e = Math.hypot(ex, ez) || 1;
  return [ex / e, ez / e];
}
// ---------- damage, breaking, the look of a piece ----------
function defHit(b, dmg, src) {
  if (!b || !b.done || b.broken) return;
  b.hp = Math.max(0, (b.hp ?? b.maxHp) - dmg); b.hitT = G.t;
  const v = ownCamp(), near = P.a && v && dist2(P.a.pos, b) < 160;
  if (G.t - DEF.warnT > 30 && near) { DEF.warnT = G.t; P.pings.push({ x: b.x, z: b.z, t: 8 }); UI.notify(`⚠️ ${src && src.hunter ? `פושטים מ${src.camp ? src.camp.tribe : 'שבט אויב'} פורצים` : src && src.sp ? `${src.sp.he} שורט` : 'מישהו פורץ'} את ${defDN(b.t)}!`, 'bad'); }
  if (b.hp <= 0) defBreak(b, src);
}
function defBreak(b, src) {
  b.broken = true; b.hp = 0; defLook(b); defDirty();
  const d = P.a ? dist2(P.a.pos, b) : 999;
  if (d < 60) AUD.play('chop', 0.7);
  if (d < 50) FX.spawn('dust', b.x, getH(b.x, b.z) + 0.6, b.z, 12);
  if (src && src.hunter && src.camp) warLog(`${src.camp.tribe} פרצו ${BTYPES[b.t].n} בכפר`, 'bad');
  if (P.a && ownCamp()) { P.pings.push({ x: b.x, z: b.z, t: 14 }); if (G.t - (DEF.breakT || -99) > 20) { DEF.breakT = G.t; UI.notify(`💥 ${BTYPES[b.t].n} ${defG(b.t, 'נפרץ', 'נפרצה', 'נפרצו')}! הבונים יתקנו כשיוכלו`, 'bad'); } }
}
function defLook(b) {
  const T = BTYPES[b.t]; if (!b.mesh || !T || !T.def) return;
  if (T.def.water) { wgLook(b); return; }
  if (T.def.pit) { b.mesh.geometry = defGeoC(b.sprung ? 'spikepit_open' : 'spikepit'); return; }
  b.mesh.scale.y = b.broken ? 0.3 : b.done ? 1 : b.mesh.scale.y;
  b.mesh.rotation.x = b.broken ? 0.12 : 0;
  for (const L of b.leaves || []) L.visible = !b.broken;
}
// a finished gate gets doors that open for our people
function defOnDone(b) {
  const T = BTYPES[b.t]; if (!T.def) return;
  if (b.hp == null || b.hp <= 0 || !b.maxHp) { b.maxHp = T.def.hp; if (b.hp == null || b.hp <= 0) b.hp = b.maxHp; }
  if (T.def.gate && !b.leaves) {
    b.mesh.geometry = defGeoC(b.t, 'body');
    const [hx] = LEAF[b.t], lg = defGeoC('leaf_' + b.t);
    b.leaves = [-1, 1].map(s => { const m = new THREE.Mesh(lg, BLD.mat); m.position.set(s * hx, 0, 0); m.rotation.y = s < 0 ? 0 : Math.PI; m.castShadow = true; b.mesh.add(m); return m; });
    b.open = 0;
  }
  if (b.replaces) { const old = b.replaces; b.replaces = null; if (BLD.list.includes(old)) { if (old.done || !old.unpaid) boxStore().wood += BTYPES[old.t].wood; buildRemove(old); } }
  defLook(b); defDirty();
}
function buildRemove(b) {
  if (b.br && BRG.list.includes(b)) bridgeOff(b);
  scene.remove(b.mesh); if (b.scaf) scene.remove(b.scaf); removeObstacles(b); structClear(b);
  for (const L of [BLD.list, BLD.sites]) { const i = L.indexOf(b); if (i >= 0) L.splice(i, 1); }
  if (isDef(b.t)) defDirty();
}
// ---------- the clock: doors, pits, thorns growing back, warnings ----------
function defUpdate(dt) {
  if (DEF.dirty) defRebuild();
  ringTopUp(dt);
  if (!DEF.n && !DEF.pitFall.length) return;
  // doors swing open when one of ours comes near
  if (P.a) for (const s of DEF.gates) {
    const b = s.b; if (!b.leaves || dist2(camera.position, b) > 90) continue;
    let want = 0; shQuery(b.x, b.z, 3.6, w => { if (!want && w.alive && defSide(w) !== 'foe' && defSide(w) !== 'wild') want = 1; });
    b.open += (want - b.open) * Math.min(1, dt * (want ? 3 : 1.6));
    b.leaves[0].rotation.y = b.open * 1.35; b.leaves[1].rotation.y = Math.PI - b.open * 1.35;
  }
  wgUpdate(dt);
  // a foe that falls into a spike pit is stuck there for a while
  for (let i = DEF.pitFall.length - 1; i >= 0; i--) { const f = DEF.pitFall[i]; f.t -= dt; const w = f.w; if (w.alive) { w.pos.x = f.x; w.pos.z = f.z; w.pos.y = getH(f.x, f.z) - 0.8; w.speed = 0; } if (f.t <= 0 || !w.alive) { w.ownY = false; if (w.alive) { w.pos.x = f.x + f.ox; w.pos.z = f.z + f.oz; w.ground(1, true); } DEF.pitFall.splice(i, 1); } }
  DEF.t -= dt; if (DEF.t > 0) return; DEF.t = 0.25;
  for (const b of DEF.pits) {
    if (b.sprung) continue;
    let w0 = null; shQuery(b.x, b.z, 2.2, w => { if (!w0 && w.alive && !w.swimming && (w.tpl.kind === 'quad' || w.tpl.kind === 'human') && Math.hypot(w.pos.x - b.x, w.pos.z - b.z) < 1.25) { const sd = defSide(w); if (sd === 'foe' || (sd === 'wild' && massOf(w) > 8)) w0 = w; } });
    if (!w0) continue;
    b.sprung = true; defLook(b); defDirty();
    hurt(w0, BTYPES.spikepit.def.dmg * (w0.hunter ? 0.7 : 1), null); w0.stunT = Math.max(w0.stunT || 0, 3.2); w0.ownY = true;
    const a = rng() * TAU; DEF.pitFall.push({ w: w0, t: 3.2, x: b.x, z: b.z, ox: Math.cos(a) * 1.7, oz: Math.sin(a) * 1.7 });
    if (w0.dCam < 60) { AUD.at('hurt', w0.pos, 0.8); FX.spawn('dust', b.x, getH(b.x, b.z) + 0.3, b.z, 10); }
    if (w0.hunter || w0.invader) PROG.flags.pitCatch = 1;
    if (P.a && dist2(P.a.pos, b) < 120) UI.notify(`🕳️ ${w0.hunter ? w0.name || 'פושט' : w0.sp.he} ${heb(w0, 'נפל', 'נפלה')} לבור היתדות!`, 'good');
  }
  if ((DEF.fixT -= 0.25) <= 0) {
    DEF.fixT = 2; const gh = timeRate() * 2;
    for (const b of BLD.list) { const T = BTYPES[b.t]; if (!T.def || !T.def.regrow || !b.done) continue; if (b.broken) { b.regrow = (b.regrow || 0) + gh; if (b.regrow > 24) { b.regrow = 0; b.broken = false; b.hp = b.maxHp * 0.5; defLook(b); defDirty(); } } else if (b.hp < b.maxHp) b.hp = Math.min(b.maxHp, b.hp + 1.2); }
    DEF.unpaid = BLD.sites.filter(s => s.unpaid).length + (DEF.ringWant ? 1 : 0);   // walls waiting for wood: the builders fell more trees
  }
}
// ---------- the builders: new pieces after houses, repairs when there is nothing new ----------
function defPickSite(a) {
  const S = BLD.sites.filter(q => !q.done), near = L => L.sort((p, q) => dist2(p, a.pos) - dist2(q, a.pos))[0];
  const normal = S.filter(q => !isDef(q.t)); if (normal.length) return near(normal);
  const paid = S.filter(q => !q.unpaid); if (paid.length) return near(paid);
  const un = S.filter(q => q.unpaid); if (!un.length) return null;
  // fences are paid from spare wood: whatever the village is saving up for (a house) comes first
  const s = near(un), st = boxStore(), T = BTYPES[s.t], W = CLAN.planWant && BTYPES[CLAN.planWant] ? BTYPES[CLAN.planWant].wood : 0;
  if ((st.wood || 0) < T.wood + Math.max(10, W + 5)) return null;
  st.wood -= T.wood; s.unpaid = false; return s;
}
function defNeedsFix(b) { return b.done && isDef(b.t) && (b.broken || b.sprung || (b.hp != null && b.hp < (b.maxHp || 1) * 0.97)) && !(BTYPES[b.t].def.regrow && !b.broken); }
function defRepairPick(a) {
  let best = null, bd = 1e9;
  for (const b of BLD.list) { if (!defNeedsFix(b) || (b.fixer && b.fixer !== a && b.fixer.alive && b.fixer.job && b.fixer.job.b === b)) continue; const d = dist2(b, a.pos) + (b.broken ? -40 : 0); if (d < bd) { bd = d; best = b; } }
  if (!best) return null;
  if (best.broken && !best.fixPaid) { const st = boxStore(), cost = Math.ceil(BTYPES[best.t].wood / 2); if ((st.wood || 0) < cost) return null; st.wood -= cost; best.fixPaid = true; }
  best.fixer = a; return best;
}
function defRepairJob(a, dt, v) {
  const j = a.job, b = j.b;
  if (!b || !BLD.list.includes(b) || !defNeedsFix(b)) { if (b) b.fixer = null; a.job = null; return; }
  if (j.x == null) {
    const T = BTYPES[b.t];
    if (T.len) { const e = segEnds(b), nx = -e.uz, nz = e.ux, s = ((v.x - b.x) * nx + (v.z - b.z) * nz) >= 0 ? 1 : -1; j.x = b.x + nx * s * 1.1; j.z = b.z + nz * s * 1.1; }
    else { const ang = Math.atan2(v.z - b.z, v.x - b.x); j.x = b.x + Math.cos(ang) * 2; j.z = b.z + Math.sin(ang) * 2; }
  }
  const d = jobGo(a, j.x, j.z, a.sp.walk * 1.3, dt);
  if (d > 0.9) return;
  a.move(0, 0, 0, dt); a.yaw += angDiff(a.yaw, Math.atan2(b.x - a.pos.x, b.z - a.pos.z)) * Math.min(1, dt * 4); a.pose = 'build';
  if ((j.snd = (j.snd || 0) - dt) <= 0) { j.snd = 0.5; if (a.dCam < 45) AUD.at('hammer', a.pos, 0.6); }
  if (b.sprung) { j.t = (j.t || 0) + dt; if (j.t > 4) { b.sprung = false; defLook(b); defDirty(); b.fixer = null; a.job = null; } return; }
  b.hp = Math.min(b.maxHp, (b.hp || 0) + dt * Math.max(10, b.maxHp / 14));
  if (b.broken && b.hp >= b.maxHp * 0.5) { b.broken = false; b.fixPaid = false; defLook(b); defDirty(); if (P.a && dist2(P.a.pos, b) < 80) UI.notify(`${a.name} ${heb(a, 'תיקן', 'תיקנה')} את ${defDN(b.t)}`, 'good'); }
  if (b.hp >= b.maxHp) { b.fixer = null; a.job = null; }
}
// ---------- plans: a fence all around the village, and upgrades as it grows ----------
const gateFor = t => BTYPES.gatehouse && buildUnlocked('gatehouse') && t === 'stonewall' ? 'gatehouse' : 'gate';
function defRingR(v) {
  let R = 17;
  for (const b of BLD.list) { const T = BTYPES[b.t]; if (T.def || b.t === 'torch' || b.t === 'dock') continue; R = Math.max(R, Math.hypot(b.x - v.x, b.z - v.z) + T.r + 4); }
  return R;
}
// a piece of the ring is already there when a fence or wall (built or planned) runs along most of it
function defRingCovered(L0, ax, az, bx, bz, rot) {
  let n = 0, hit = null;
  for (const s of [0.2, 0.5, 0.8]) {
    const px = ax + (bx - ax) * s, pz = az + (bz - az) * s;
    for (const { b, e } of L0) {
      if (Math.abs(Math.sin(b.rot - rot)) > 0.55) continue;
      const t = (px - e.ax) * e.ux + (pz - e.az) * e.uz;
      if (t < -0.2 || t > e.L + 0.2 || Math.abs((px - e.ax) * e.uz - (pz - e.az) * e.ux) > 3.2) continue;
      n++; hit = hit || b; break;
    }
  }
  return n >= 2 ? hit : null;
}
// the line of the ring: it goes around every building with room to walk (closer where the village is small, farther
// where it reaches out), and where the village meets deep water it follows the bank, so the water side is closed too
function defRingLine(v, len) {
  const B = BLD.list.filter(b => !BTYPES[b.t].def && b.t !== 'torch' && b.t !== 'dock'), Rmin = Math.max(17, villageR() * 0.42);
  let far = Rmin; for (const b of B) far = Math.max(far, Math.hypot(b.x - v.x, b.z - v.z) + BTYPES[b.t].r + 4);
  const n = Math.max(14, Math.ceil(TAU * (Rmin + far) * 0.5 / len)), R = new Array(n).fill(Rmin), A = i => i / n * TAU;
  for (const b of B) {
    const dx = b.x - v.x, dz = b.z - v.z, d = Math.hypot(dx, dz), rb = BTYPES[b.t].r + 4, th = Math.atan2(dz, dx);
    for (let i = 0; i < n; i++) {
      const ph = angDiff(th, A(i)), s = d * Math.sin(ph);
      if (Math.abs(s) >= rb || Math.cos(ph) <= 0) { if (d < rb) R[i] = Math.max(R[i], rb - d + 2); continue; }
      R[i] = Math.max(R[i], d * Math.cos(ph) + Math.sqrt(rb * rb - s * s));
    }
  }
  // no deep notches between the buildings: a smooth line is shorter and stronger
  for (let pass = 0; pass < 2; pass++) { const R0 = R.slice(); for (let i = 0; i < n; i++) for (let k = 1; k <= 3; k++) R[i] = Math.max(R[i], R0[(i + k) % n] - k * len * 0.45, R0[(i - k + n) % n] - k * len * 0.45); }
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = A(i), cx = Math.cos(a), cz = Math.sin(a);
    let r = R[i], wet = false;
    // in deep water the line comes back to the bank (it may stand in the shallows)
    if (waterDepth(v.x + cx * r, v.z + cz * r) > 0.55) { let s2 = r; while (s2 > 9 && waterDepth(v.x + cx * s2, v.z + cz * s2) > 0.55) s2 -= 0.5; if (s2 <= 9) wet = true; else r = s2; }
    pts.push({ x: v.x + cx * r, z: v.z + cz * r, a, wet });
  }
  for (let pass = 0; pass < 2; pass++) for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i], q = pts[(i + 1) % pts.length]; if (p.wet || q.wet) continue;
    let deep = false; for (let s = 0.1; s < 1; s += 0.1) if (waterDepth(lerp(p.x, q.x, s), lerp(p.z, q.z, s)) > 0.65) { deep = true; break; }
    if (!deep) continue;
    let mx = (p.x + q.x) / 2, mz = (p.z + q.z) / 2; const dx = mx - v.x, dz = mz - v.z, dl = Math.hypot(dx, dz) || 1;
    let k = 0; while (k++ < 80 && waterDepth(mx, mz) > 0.5) { mx -= dx / dl * 0.5; mz -= dz / dl * 0.5; }
    if (Math.hypot(mx - v.x, mz - v.z) > 9) pts.splice(i + 1, 0, { x: mx, z: mz, a: Math.atan2(mz - v.z, mx - v.x), wet: false });
  }
  return pts;
}
const RING_SOFT = new Set(['field', 'dock', 'torch']);
// the pieces of the ring (each checked, a little pushed out when a building is in the way); gates every 55 m and by every dock
function defRingPieces(t) {
  const v = ownCamp(), T = BTYPES[t]; if (!v || !T || !T.len) return [];
  const pts = defRingLine(v, T.len), n = pts.length, out = [];
  for (let i = 0; i < n; i++) {
    const p = pts[i], q = pts[(i + 1) % n]; if (p.wet || q.wet) { out.push({ gap: 'water', x: (p.x + q.x) / 2, z: (p.z + q.z) / 2 }); continue; }
    const L = Math.hypot(q.x - p.x, q.z - p.z), k = Math.max(1, Math.round(L / (T.len * 1.15)));
    for (let j = 0; j < k; j++) { const a = { x: lerp(p.x, q.x, j / k), z: lerp(p.z, q.z, j / k) }, b = { x: lerp(p.x, q.x, (j + 1) / k), z: lerp(p.z, q.z, (j + 1) / k) }; out.push({ ax: a.x, az: a.z, bx: b.x, bz: b.z }); }
  }
  const segs = out.filter(o => !o.gap), per = segs.reduce((s, o) => s + Math.hypot(o.bx - o.ax, o.bz - o.az), 0);
  const wn = nearestWater(v.x, v.z), wa = wn ? Math.atan2(wn.z - v.z, wn.x - v.x) : 0, ng = Math.max(3, Math.min(7, Math.round(per / 55))), gates = new Set();
  const nearestSeg = (x, z) => { let bi = -1, bd = 1e9; segs.forEach((o, k) => { const d = Math.hypot((o.ax + o.bx) / 2 - x, (o.az + o.bz) / 2 - z); if (d < bd) { bd = d; bi = k; } }); return bi; };
  for (let g = 0; g < ng; g++) { const a = wa + g * TAU / ng, R = defRingR(v); gates.add(nearestSeg(v.x + Math.cos(a) * R, v.z + Math.sin(a) * R)); }
  for (const b of BLD.list) if (b.t === 'dock') { const k = nearestSeg(b.x, b.z); if (k >= 0) gates.add(k); }
  segs.forEach((o, k) => {
    const tt = gates.has(k) ? gateFor(t) : t, L = Math.hypot(o.bx - o.ax, o.bz - o.az), ux = (o.bx - o.ax) / L, uz = (o.bz - o.az) / L;
    o.t = tt; o.rot = Math.atan2(-uz, ux); o.sx = L / BTYPES[tt].len; o.x = (o.ax + o.bx) / 2; o.z = (o.az + o.bz) / 2;
    // a building right on the line: the piece steps out a little
    let why = segCheck(tt, o.x, o.z, o.rot, o.sx, true);
    if (why && /^צמוד/.test(why)) { const rd = Math.hypot(o.x - v.x, o.z - v.z) || 1; for (const off of [1.6, 3.2, -1.6, -3.2]) { const nx = o.x + (o.x - v.x) / rd * off, nz = o.z + (o.z - v.z) / rd * off; if (!segCheck(tt, nx, nz, o.rot, o.sx, true)) { o.x = nx; o.z = nz; why = ''; break; } } }
    if (why && /^צמוד/.test(why) && !segCheck(tt, o.x, o.z, o.rot, o.sx, true, null, RING_SOFT)) why = '';
    if (why === 'המים כאן עמוקים מדי' && buildUnlocked('watergate')) { const sx2 = L / BTYPES.watergate.len; if (!segCheck('watergate', o.x, o.z, o.rot, sx2, true)) { o.t = 'watergate'; o.sx = sx2; why = ''; } }
    o.why = why;
  });
  return out;
}
// Walls are paid when they are placed, like any building: a piece standing in the village always holds its wood, and
// taking it down gives all of it back. When the wood runs out a plan stops there, and the wall grows on as wood comes in.
// What the builders may spend on walls: the store, less what they are saving up for (a house comes first).
function defSpare() { const st = boxStore(), W = CLAN.autoBuild && CLAN.planWant && BTYPES[CLAN.planWant] ? BTYPES[CLAN.planWant].wood : 0; return Math.max(0, (st.wood || 0) - (W ? W + 5 : 5)); }
// opt.hand: the hunter's own order, paid from what he carries and the store. opt.budget / opt.max: limits for the builders.
function defBudget(opt) { return opt && opt.budget != null ? opt.budget : opt && opt.hand ? woodHave() : (boxStore().wood || 0); }
function defPayOut(n, opt) { if (n <= 0) return; if (opt && opt.hand) payWood(n); else boxStore().wood -= n; }
// dry: only count what the plan would add (for the build screen), and how much of it the wood pays for now (fit).
// auto: the builders' own plan keeps out of other tribes' land. auto or opt.keep: it leaves open the spots where the hunter took pieces away.
function defPlanRing(t, dry, auto, opt) {
  const v = ownCamp(), T = BTYPES[t]; if (!v || !T || !T.len || !buildUnlocked(t)) return null;
  const pieces = defRingPieces(t), R = defRingR(v), keep = auto || !!(opt && opt.keep);
  let made = 0, open = 0, wood = 0, has = 0, wip = 0, ngates = 0, n = 0, tribeN = 0; const tribes = new Set(), add = [];
  const L0 = BLD.list.filter(b => BTYPES[b.t].len && BTYPES[b.t].def).map(b => ({ b, e: segEnds(b) }));
  for (const o of pieces) {
    n++;
    if (o.gap) { open++; continue; }
    const cov = defRingCovered(L0, o.ax, o.az, o.bx, o.bz, o.rot); if (cov) { has++; if (!cov.done) wip++; continue; }
    if (o.why) { open++; continue; }
    if (keep && keepAt(o.x, o.z, 1.2, true)) { open++; continue; }   // the hunter took a piece away here: it stays open
    const zi = zoneTribeAt(o.x, o.z);
    if (zi >= 0) { if (auto) { open++; continue; } tribes.add(zi); tribeN++; }
    made++; wood += BTYPES[o.t].wood; if (o.t !== t) ngates++;
    add.push(o);
  }
  // what the wood pays for now, in order along the ring, so the wall grows as one line
  const budget = defBudget(opt), max = opt && opt.max || 1e9;
  let fit = 0, fitW = 0; for (const o of add) { const c = BTYPES[o.t].wood; if (fit >= max || fitW + c > budget) break; fit++; fitW += c; }
  if (!dry) {
    const put = add.slice(0, fit);
    defPayOut(fitW, opt);
    // trees on the line are felled and go to the store; one word about it, not one per piece
    let felled = 0; for (const o of put) felled += addBuilding(o.t, o.x, o.z, o.rot, 0, false, 'q', o.sx).cleared || 0;
    if (felled && opt && opt.hand) UI.notify(`פינו את הקו של הגדר: העצים שעמדו בדרך נכרתו (+${felled} עצים למחסן)`, 'good');
    for (const i of tribes) { const o = put.find(q => zoneTribeAt(q.x, q.z) === i); if (o) borderProvoke(i, o, 'גדר'); }
  }
  // an older, smaller ring inside this one: the village has outgrown it
  let inner = 0, ir = 0; if (!has) for (const { b } of L0) { const d = Math.hypot(b.x - v.x, b.z - v.z); if (d < R - 3.2 - 6) { inner++; ir += d; } }
  if (inner && inner < 0.6 * TAU * (ir / inner) / 4.2) inner = 0;   // a few pieces of a line are not an old ring
  if (!dry) { defDirty(); saveGame(); }
  // dry: made and wood are the whole plan; otherwise what was placed (and paid) now, and left is what still waits for wood
  return dry ? { made, open, n, wood, R, has, wip, gates: ngates, inner, tribes: [...tribes], tribeN, fit, fitW, left: made - fit, leftW: wood - fitW }
    : { made: fit, open, n, wood: fitW, R, has, wip, gates: ngates, inner, tribes: [...tribes], tribeN, fit, fitW, left: made - fit, leftW: wood - fitW };
}
function defRingDry(t) {
  const key = `${t}|${BLD.list.length}|${DEF.ver}|${(G.t / 2) | 0}|${woodHave()}`;
  if (!DEF.ringC || DEF.ringC.k !== key) DEF.ringC = { k: key, r: defPlanRing(t, true, false, { hand: true }) };
  return DEF.ringC.r;
}
// the ring the hunter asked for: when the wood did not cover all of it, the builders add (and pay) more pieces
// whenever there is wood to spare, until it is closed. A piece he takes away later is left open.
function ringTopUp(dt) {
  if (!DEF.ringWant || (DEF.topT = (DEF.topT || 0) - dt) > 0) return; DEF.topT = 6;
  DEF.unpaid = Math.max(DEF.unpaid || 0, 1);
  const t = DEF.ringWant, v = ownCamp(); if (!v) return;
  if (!BTYPES[t] || !buildUnlocked(t)) { DEF.ringWant = null; return; }
  const P0 = defPlanRing(t, true, false, { keep: true, budget: defSpare() });
  if (!P0 || !P0.made) { DEF.ringWant = null; if (P0 && P0.has) UI.notify(`🛡️ כל הקטעים של ${BTYPES[t].n} סביב הכפר שולמו, והבונים בונים אותם`, 'good'); saveGame(); return; }
  if (P0.fit) defPlanRing(t, false, false, { keep: true, budget: defSpare(), max: 10 });
}
// upgrades: every new piece is paid as it is placed; the old one stands until the new one is ready, then its wood goes back to the store
function defUpgradeAll(from, opt) {
  const to = BTYPES[from] && BTYPES[from].def.up; if (!to || !buildUnlocked(to)) return { n: 0, left: 0, wood: 0 };
  const budget = defBudget(opt), c = BTYPES[to].wood;
  let n = 0, left = 0, spent = 0;
  for (const b of BLD.list.slice()) {
    if (b.t !== from || !b.done || BLD.list.some(q => q.replaces === b)) continue;
    if (spent + c > budget) { left++; continue; }
    const sx = (b.sx || 1) * BTYPES[from].len / BTYPES[to].len, nb = addBuilding(to, b.x, b.z, b.rot, 0, false, false, sx); nb.replaces = b; n++; spent += c;
  }
  defPayOut(spent, opt);
  if (n) saveGame();
  return { n, left, wood: spent };
}
// builders who plan on their own fence the village once it is threatened or has grown big, finish what is missing,
// upgrade the fence as stronger kinds open up, and put towers into a city's wall
function famDefend() {
  const tier = villageTier(); if (tier < 1 || (CLAN.defT = (CLAN.defT || 0) - 25) > 0) return false;
  const st = boxStore(), wood = st.wood || 0, war = npcIdx().some(atWar) || WAR.parties.some(p => !p.done && p.to === 'own');
  // pieces from an older game that still wait to be paid come first; and no new plans while many pieces wait for the builders
  if (BLD.sites.some(q => q.unpaid) || wood < (war ? 25 : 70) || BLD.sites.filter(q => isDef(q.t)).length >= 14) return false;
  const threat = tier >= 2 || war || !!(PROG.flags.raidWonTribe || PROG.flags.raidWon);
  if (!threat) return false;
  const ringT = ['stonewall', 'palisade', 'fence'].find(k => buildUnlocked(k)), P0 = ringT && !DEF.ringWant && defPlanRing(ringT, true, true);
  if (P0 && P0.made && !P0.inner && (P0.has || war || wood >= Math.min(P0.wood, 160))) {
    const r = defPlanRing(ringT, false, true, { budget: defSpare(), max: 14 }); CLAN.defT = 150;
    if (r && r.made) { const w = ringT === 'fence' ? 'גדר' : 'חומה'; UI.notify(`🔨 הבונים התחילו ${P0.has ? `להשלים את ה${w}` : `לבנות ${w}`} סביב הכפר${r.made > 1 ? `: ${r.made} קטעים` : ''}${r.left ? `, ועוד ${r.left} כשיהיו עצים` : ''}`, 'good'); PROG.flags.autoDef = 1; return true; }
  }
  for (const [from, need] of [['fence', 160], ['thorns', 160], ['palisade', 260], ['gate', 260]]) {
    const to = BTYPES[from].def.up; if (!to || !buildUnlocked(to) || wood < need) continue;
    if (from === 'gate' && !BLD.list.some(b => b.t === 'stonewall' && b.done)) continue;   // heavy gates go with stone walls
    if (!BLD.list.some(b => b.t === from && b.done && !BLD.list.some(q => q.replaces === b))) continue;
    const r = defUpgradeAll(from, { budget: defSpare() }); CLAN.defT = 300;
    if (r.n) { UI.notify(`🔨 הבונים מחליפים את ${defDN(from)} ב${BTYPES[to].n}${r.n > 1 ? `: ${r.n} ${from === 'gate' ? 'שערים' : 'קטעים'}` : ''}`, 'good'); return true; }
  }
  if (wood >= 220 && defAddTowers(true)) { const n = defAddTowers(false, { budget: defSpare() }); CLAN.defT = 300; if (n) { UI.notify(`🔨 הבונים מוסיפים ${n > 1 ? `${n} מגדלי חומה` : 'מגדל חומה'} לחומת האבן`, 'good'); return true; } }
  return false;
}
// a city puts towers into its stone wall: every so often a piece of wall becomes a tower with a guard (each paid as it is placed)
function defAddTowers(dry, opt) {
  const v = ownCamp(); if (!v || !buildUnlocked('walltower')) return 0;
  const posts = BLD.list.filter(b => b.t === 'walltower' || b.t === 'gatehouse').map(b => ({ x: b.x, z: b.z, r: b.t === 'gatehouse' ? 15 : 30 }));
  const cand = BLD.list.filter(b => b.t === 'stonewall' && b.done && !b.broken && !BLD.list.some(q => q.replaces === b))
    .sort((p, q) => Math.atan2(p.z - v.z, p.x - v.x) - Math.atan2(q.z - v.z, q.x - v.x));
  const budget = dry ? 1e9 : defBudget(opt), c = BTYPES.walltower.wood;
  let n = 0, spent = 0;
  for (const b of cand) {
    if (posts.some(p => Math.hypot(p.x - b.x, p.z - b.z) < p.r)) continue;
    if (spent + c > budget) break;
    posts.push({ x: b.x, z: b.z, r: 30 }); n++;
    if (!dry) { const nb = addBuilding('walltower', b.x, b.z, b.rot, 0, false, false, (b.sx || 1) * BTYPES.stonewall.len / BTYPES.walltower.len); nb.replaces = b; spent += c; }
  }
  if (!dry) { defPayOut(spent, opt); if (n) saveGame(); }
  return n;
}
function defStats() {
  const S = { seg: 0, gates: 0, broken: 0, hurt: 0, pits: 0, plan: 0, byT: {} };
  for (const b of BLD.list) {
    const T = BTYPES[b.t]; if (!T.def) continue;
    if (!b.done) { S.plan++; continue; }
    S.byT[b.t] = (S.byT[b.t] || 0) + 1;
    if (T.def.pit) S.pits++; else if (T.def.gate) S.gates++; else S.seg++;
    if (b.broken) S.broken++; else if (b.hp != null && b.hp < (b.maxHp || 1) * 0.97) S.hurt++;
  }
  return S;
}
// the village's defence counts in war: walls and gates make raids harder
function defPower() {
  let p = 0; for (const b of BLD.list) { if (!b.done || b.broken || !isDef(b.t)) continue; p += { fence: 0.05, gate: 0.07, stakes: 0.08, thorns: 0.06, palisade: 0.12, spikepit: 0.15, stonewall: 0.2, gatehouse: 0.6, walltower: 0.7, watergate: 0.3 }[b.t] || 0; }
  return Math.min(7, p);
}
// ---------- the build screen: the defence section ----------
function defHtml() {
  const v = ownCamp(); if (!v) return '';
  const tier = Math.max(0, villageTier()), wood = woodHave(), S = defStats();
  const cards = DEFT.map(k => {
    const T = BTYPES[k], lock = !buildUnlocked(k), can = !lock && wood >= T.wood, n = S.byT[k] || 0;
    return `<div class="ucard${lock ? ' lock' : ''}"><div class="uic">${T.ic}</div><b>${T.n}${n ? ` <small>(${n})</small>` : ''}</b><span>${T.d}</span><div class="ucost"><span class="cchip${wood >= T.wood ? '' : ' no'}">🪵 ${T.wood}</span>${T.len ? `<span class="cchip">📏 ${T.len} מ׳</span>` : ''}</div>` +
      (lock ? `<div class="ulock">נפתח כשהמחנה הופך ל${TIERN[T.tier]}</div>` : `<button class="btn${can ? ' pri' : ''}" data-b="${k}"${can ? '' : ' disabled'}>${can ? (T.len ? 'לבנות קו' : 'לבחור מקום') : 'חסרים עצים'}</button>`) + '</div>';
  }).join('');
  const ringT = ['stonewall', 'palisade', 'fence'].find(k => buildUnlocked(k)) || 'fence', ring = BTYPES[ringT], P = defRingDry(ringT);
  const ups = DEFT.filter(k => BTYPES[k].def.up && buildUnlocked(BTYPES[k].def.up) && BLD.list.some(b => b.t === k && b.done && !BLD.list.some(q => q.replaces === b)));
  const nTow = defAddTowers(true);
  const stat = S.seg + S.gates + S.pits ? `<p class="idim">🛡️ ${S.seg} קטעי גדר וחומה · 🚪 ${S.gates} שערים${S.pits ? ` · 🕳️ ${S.pits} בורות` : ''}${S.broken ? ` · <b style="color:var(--red)">💥 ${S.broken} פרוצים</b>` : ''}${S.hurt ? ` · ${S.hurt} פגועים` : ''}${S.plan ? ` · 🔨 ${S.plan} בתכנון ובבנייה` : ''}. הבונים מתקנים מה שנפגע.</p>` : '';
  const nW = (n, one, many) => n === 1 ? one : `${n} ${many}`;
  // walls are paid when they are placed: what the wood covers now, and what the builders add later
  const pay = !P || !P.made ? '' : DEF.ringWant === ringT ? ' 🔨 הבונים מוסיפים קטעים בכל פעם שיש עצים פנויים במחסן.' : P.fit >= P.made ? ' העצים יוצאים מהמחסן מיד, והבונים בונים קטע אחרי קטע.'
    : P.fit ? ` יש עכשיו עצים ל־${nW(P.fit, 'קטע אחד', 'קטעים')}: ${P.fit === 1 ? 'הוא משולם' : 'הם משולמים'} מיד, ואת השאר הבונים יוסיפו כשיגיעו עצים.` : ' עוד אין מספיק עצים: הבונים יתחילו כשיגיעו עצים למחסן.';
  const gaps = (P && P.open ? ` ${P.open === 1 ? 'נשאר פתח אחד' : `נשארים ${P.open} פתחים`} (מים עמוקים, צוק או מבנה צמוד).` : '') + (P && P.tribeN ? ` <b style="color:var(--red)">⚠️ ${P.tribeN === 1 ? 'קטע אחד עובר' : `${P.tribeN} קטעים עוברים`} בשטח של ${P.tribes.map(campName).join(' ושל ')}: אם תבנו, הם יתקפו.</b>` : '');
  const plan = (!P ? '' : !P.made ? (P.has ? `<div class="dplan"><div><b>${P.wip ? '🔨 הגדר סביב הכפר בבנייה' : '✅ הכפר מגודר'}</b><span>${P.has} קטעים מקיפים את הכפר${P.wip ? `, ${P.wip === 1 ? 'אחד מהם עוד בבנייה' : `${P.wip} מהם עוד בבנייה`}` : ''}.${gaps} כשהכפר יגדל אפשר יהיה להרחיב את הגדר.</span></div></div>` : '')
    : P.has ? `<div class="dplan"><div><b>🛡️ להשלים את הגדר מסביב</b><span>${P.made === 1 ? 'חסר קטע אחד' : `חסרים ${P.made} קטעים`}${P.gates ? ` (${P.gates === 1 ? (P.made === 1 ? 'שער' : 'אחד מהם שער') : `${P.gates} מהם שערים`})` : ''}, בערך ${P.wood} עצים.${pay}${gaps}</span></div><button class="btn pri" data-a="defRing" data-t="${ringT}">להשלים</button></div>`
    : `<div class="dplan"><div><b>🛡️ ${P.inner ? 'הכפר גדל: להרחיב את הגדר' : 'לגדר את כל הכפר'}</b><span>הבונים יבנו ${ring.n} ${P.inner ? 'רחוקה יותר ' : ''}סביב הכפר: ${nW(P.made - P.gates, 'קטע אחד', 'קטעים')}${P.gates ? (P.gates === 1 ? ' ושער אחד' : ` ו־${P.gates} שערים`) : ''}, בערך ${P.wood} עצים.${pay}${gaps}${P.inner ? ' הגדר הישנה נשארת במקומה.' : ''}</span></div><button class="btn pri" data-a="defRing" data-t="${ringT}">${P.inner ? 'להרחיב' : 'לתכנן גדר מסביב'}</button></div>`) +
    ups.map(k => `<div class="dplan"><div><b>⬆️ לשדרג ${BTYPES[k].n} ל${BTYPES[BTYPES[k].def.up].n}</b><span>${(() => { const nk = BLD.list.filter(b => b.t === k && b.done && !BLD.list.some(q => q.replaces === b)).length, to = BTYPES[BTYPES[k].def.up]; return `${nW(nk, 'קטע אחד', 'קטעים')}, ${nk * to.wood} עצים. כל קטע חדש משולם כשמניחים אותו, הישן עומד עד שהחדש מוכן, ואז העצים שלו חוזרים למחסן.`; })()}</span></div><button class="btn" data-a="defUp" data-t="${k}">לשדרג</button></div>`).join('') +
    (nTow ? `<div class="dplan"><div><b>🗼 להוסיף מגדלים לחומת האבן</b><span>${nTow === 1 ? 'מגדל חומה אחד' : `${nTow} מגדלי חומה, אחד כל כמה עשרות מטרים`}, בערך ${nTow * BTYPES.walltower.wood} עצים. על כל מגדל עולה לוחם עם קשת.</span></div><button class="btn pri" data-a="defTow">להוסיף מגדלים</button></div>` : '');
  return `<h3>🛡️ גדרות ומכשולים <small style="font-weight:400;color:var(--dim)">· ${TIERN[tier]}: חדשים נפתחים ככל שהכפר גדל</small></h3>${stat}${plan}<p class="idim">גדר בונים בקו: מסתכלים לאן שהיא תמשיך ולוחצים שוב ושוב. אנשי השבט עוברים בשערים, ופושטים וטורפים נעצרים או פורצים.</p><div class="ugrid">${cards}</div>`;
}
// the map: fences as lines of dots, gates gold, broken pieces red
function defMiniDots(pt) {
  for (const b of BLD.list) {
    const T = BTYPES[b.t]; if (!T.def) continue;
    const col = b.broken ? '#e0483c' : !b.done ? 'rgba(200,170,120,.45)' : T.def.water ? '#5aa8e0' : T.def.gate ? '#f1c45a' : T.def.pit ? '#6b4a2c' : b.t === 'stonewall' || b.t === 'walltower' ? '#b9b2a2' : '#9a7448';
    if (!T.len || b.t === 'walltower') { pt(b.x, b.z, T.len ? 4.2 : 3, col); if (!T.len) continue; }
    const e = segEnds(b); for (let i = 0; i <= 3; i++) pt(e.ax + (e.bx - e.ax) * i / 3, e.az + (e.bz - e.az) * i / 3, T.def.gate ? 3 : 2.2, col);
  }
}
(function () {
  const st = document.createElement('style');
  st.textContent = `.dplan{display:flex;gap:10px;align-items:center;justify-content:space-between;padding:9px 11px;margin:6px 0;border:1px solid var(--line);border-radius:12px;background:rgba(232,176,75,.07)}.dplan div{display:flex;flex-direction:column;gap:2px}.dplan b{font-size:14px}.dplan span{font-size:12px;color:var(--dim);line-height:1.35}.dplan .btn{flex:0 0 auto;padding:7px 12px;font-size:13px}@media (max-width:520px){.dplan{flex-direction:column;align-items:stretch}.dplan .btn{width:100%}}` +
    // a scrolled card: its title row stays on top without the text showing through it
    `.card.scr>.itabs{background:linear-gradient(var(--panel),var(--panel)),linear-gradient(var(--panel),var(--panel)),linear-gradient(var(--panel),var(--panel));box-shadow:0 -14px 0 var(--panel),0 -14px 0 var(--panel),0 -14px 0 var(--panel),0 1px 0 var(--line)}`;
  document.head.appendChild(st);
  document.addEventListener('scroll', e => { const c = e.target; if (c && c.classList && c.classList.contains('card')) c.classList.toggle('scr', c.scrollTop > 6); }, true);
})();
// ---------- the journey: traps, fences and walls ----------
{
  const ins = (after, ...ms) => { const at = MISSIONS.hunter.findIndex(m => m.id === after); MISSIONS.hunter.splice(at < 0 ? MISSIONS.hunter.length : at + 1, 0, ...ms); };
  ins('hunter.cook', MS('hunter.trap', 'לטמון מלכודת (ארגז הכלים)', 30, FL('trap')), MS('hunter.trapCatch', 'לתפוס חיה במלכודת', 50, FL('trapCatch')));
  ins('hunter.tame1', MS('hunter.trapDog', 'לאלף כלב יער שנתפס בכלוב', 70, FL('trapTame')));
  ins('hunter.tower', MS('hunter.fence', 'לגדר את הכפר: גדר ושער', 90, () => !!(PROG.flags.built_fence && PROG.flags.built_gate)));
  ins('hunter.tier2', MS('hunter.palisade', 'לבנות חומת יתדות', 120, FL('built_palisade')), MS('hunter.spikepit', 'אויב נופל לבור יתדות', 120, FL('pitCatch')));
  ins('hunter.hall', MS('hunter.stonewall', 'חומת אבן ושער מבוצר', 200, () => !!(PROG.flags.built_stonewall && PROG.flags.built_gatehouse)));
  ins('hunter.tier4', MS('hunter.walltower', 'מגדל חומה עם שומר', 250, () => BLD.list.some(b => b.t === 'walltower' && b.done && b.guard && b.guard.onTower)));
  for (const m of MISSIONS.hunter) GOAL[m.id] = m;
}
// ================= THE JUNGLE RENEWS ITSELF: felled trees grow back outside the village, animals breed and their young grow up =================
const NATURE = { t: 0, bt: 6, gt: 0, day: -1, grown: 0, born: 0, young: [] };
const gameH = () => G.day * 24 + G.time;
const REGROW_SAP = 24, REGROW_FULL = 48;   // game hours after the cut: a sapling comes up, then a full tree stands again
const YOUNG_H = 20;                        // game hours for a young animal to grow up
function natureReset() { Object.assign(NATURE, { t: 0, bt: 6, gt: 0, day: -1, grown: 0, born: 0 }); NATURE.young = []; }
// ---------- trees ----------
const _np = new V3(), _nq = new THREE.Quaternion(), _ns = new V3();
function stumpHide(e) {
  if (e.stump == null || !TREES.stumps) { e.stump = null; return; }
  TREES.m.compose(TREES.v.set(e.x, -60, e.z), TREES.q.identity(), TREES.s);
  TREES.stumps.setMatrixAt(e.stump, TREES.m); TREES.stumps.instanceMatrix.needsUpdate = true;
  (TREES.freeSt || (TREES.freeSt = [])).push(e.stump); e.stump = null;
}
// a young tree at a part of its full size: no trunk to bump into and no crown to perch on yet
function treeSap(e, k) {
  if (!e.m0) return;
  e.m0.decompose(_np, _nq, _ns); _ns.multiplyScalar(k);
  TREES.m.compose(_np, _nq, _ns); e.it.near.setMatrixAt(e.i, TREES.m); TREES.dirty.add(e.it.near.instanceMatrix); e.sap = k;
}
// the sapling dies back (the village grew over it): a stump again, and a new wait
function treeWither(e) {
  TREES.m.compose(TREES.v.set(e.x, -60, e.z), TREES.q.identity(), TREES.s); e.it.near.setMatrixAt(e.i, TREES.m); TREES.dirty.add(e.it.near.instanceMatrix);
  e.sap = 0; e.cutH = gameH(); if (e.stump == null) addStump(e);
}
// where a tree may grow again: outside the village, away from buildings, fences, traps and every camp
function regrowOk(e) {
  const v = ownCamp();
  if (v && Math.hypot(e.x - v.x, e.z - v.z) < villageR() + 8) return false;
  for (const c of HUNT.camps) if (Math.hypot(c.x - e.x, c.z - e.z) < 12) return false;
  for (const b of BLD.list) if (Math.abs(b.x - e.x) < 12 && Math.abs(b.z - e.z) < 12 && bldDist(b, e.x, e.z) < bldR(b) + 2.5) return false;
  for (const T of TRAPS.list) if (Math.hypot(T.x - e.x, T.z - e.z) < 3) return false;
  for (const B of BOATS) if (Math.hypot(B.x - e.x, B.z - e.z) < 3) return false;
  return waterDepth(e.x, e.z) === 0;
}
// a grown tree: trunk and crown come back, unless somebody stands right where the trunk will be
function treeRegrow(e) {
  const r = treeTrunkR(e) + 0.6; let busy = false;
  shQuery(e.x, e.z, r + 2, a => { if (!busy && a.alive && !a.perched && a.tpl.kind !== 'bird' && a.tpl.kind !== 'fish' && Math.hypot(a.pos.x - e.x, a.pos.z - e.z) < r + (a.rad || 0.3)) busy = true; });
  if (busy) return false;
  showInst(e); e.cut = false; e.sap = 0; e.cutH = null; stumpHide(e);
  if (!e.ghost) treeSolid(e);   // a tree this quality does not draw keeps no trunk
  TREES.keys.delete(tkey(e.x, e.z)); TREES.cut = Math.max(0, TREES.cut - 1);
  return true;
}
function natureTrees() {
  if (!TREES.built || !TREES.cutList.length) return;
  const H = gameH(), keep = [];
  for (const e of TREES.cutList) {
    if (e.cutH == null) e.cutH = H;
    const age = H - e.cutH;
    if (age < REGROW_SAP) { keep.push(e); continue; }
    if (!regrowOk(e)) { if (e.sap) treeWither(e); else e.cutH = H - REGROW_SAP + 4; keep.push(e); continue; }   // look again in a few hours
    const k = clamp((age - REGROW_SAP) / (REGROW_FULL - REGROW_SAP), 0, 1);
    if (k < 1) { if (!e.sap) stumpHide(e); const s = 0.14 + 0.86 * k; if (s - (e.sap || 0) > 0.03) treeSap(e, s); keep.push(e); continue; }
    if (treeRegrow(e)) NATURE.grown++; else keep.push(e);
  }
  TREES.cutList = keep;
}
function treeCutTimes() { const H = gameH(); return TREES.cutList.map(e => [tkey(e.x, e.z), +(e.cutH ?? H).toFixed(1)]); }
function treeCutTimesLoad(list) {
  const H = gameH(), m = new Map(list || []);
  for (const e of TREES.cutList) { const h = m.get(tkey(e.x, e.z)); e.cutH = h != null ? Math.min(h, H) : H; }
  natureTrees();
}
// ---------- animals: mothers give birth when their kind is scarce, and the young follow them until they are grown ----------
const BREED_AI = new Set(['herb', 'pred', 'pack']);
function canMother(b) {
  return b.alive && !b.dead && !b.young && b.sex === 'f' && b.tpl.kind === 'quad' && BREED_AI.has(b.sp.ai) && !b.isPlayer && !b.pet && !b.tribe && !b.tribeDog && !b.hunter && !b.legend && !b.cowCamp
    && !b.social && !b.socialExtra && !b.isPartner && !b.cub && !b.trapped && !b.frozen && !b.swimming && !b.invader && !b.escort && !['flee', 'fight', 'hunt', 'held', 'follow'].includes(b.state)
    && !(b.group && (b.group.playerLed || (P.a && b.group.members.includes(P.a))));
}
function natureBreed() {
  if (!P.a || G.mode !== 'play') return;
  const v = P.human ? ownCamp() : null, vr = v ? villageR() + 40 : 0, counts = {}, moms = {};
  for (const a of ANIMALS) {
    if (!a.alive || a.isPlayer || a.socialExtra || a.cub) continue;
    counts[a.spId] = (counts[a.spId] || 0) + 1;
    if (a.spId !== P.spId && (a.dCam || 0) > 30 && canMother(a) && !(v && Math.hypot(a.pos.x - v.x, a.pos.z - v.z) < vr)) (moms[a.spId] || (moms[a.spId] = [])).push(a);
  }
  let n = 0;
  for (const id in moms) {
    const sp = SPECIES[id]; if (!sp || !sp.count) continue;
    const target = faunaTarget(sp), c = counts[id] || 0; if (c >= target) continue;
    if (rng() > 0.3 + 0.5 * (1 - c / target)) continue;
    const L = moms[id].filter(m => (m.kids || 0) < 3); if (!L.length) continue;
    if (wildBirth(pick(L))) { n++; if (n >= 5) break; }
  }
}
function wildBirth(mom) {
  const ang = rng() * TAU; let x = mom.pos.x + Math.cos(ang) * 1.3, z = mom.pos.z + Math.sin(ang) * 1.3;
  if (waterDepth(x, z) > 0 || !inBounds(x, z)) { x = mom.pos.x; z = mom.pos.z; }
  const g = mom.group && (mom.group.kind === 'herd' || mom.group.kind === 'pack') ? mom.group : null;
  const tk = Object.keys(TPL).find(k => TPL[k] === mom.tpl);
  const b = new Animal(mom.spId, x, z, { young: true, group: g, tpl: tk, scale: clamp(mom.baseScale * rr(0.94, 1.06), mom.sp.size[0], mom.sp.size[1]) });
  b.ground(1, true); b.growH = 0; b.wmom = mom; b.state = 'follow'; b.followTarget = mom; b.home.copy(mom.home); b.hunger = 20;
  if (g) { g.members.push(b); if (g.kind === 'pack') b.slot = g.members.length - 1; }
  mom.kids = (mom.kids || 0) + 1; NATURE.young.push(b); NATURE.born++;
  return b;
}
// growing up: size, reach and strength follow the age, and a grown one leaves its mother
function wildGrow(b, k) {
  const s1 = b.baseScale * (0.45 + 0.55 * k), r = s1 / b.scale;
  if (Math.abs(r - 1) > 0.002) {
    b.scale = s1; b.mesh.scale.setScalar(s1); b.rad *= r; b.height *= r;
    if (b.swimDepth) b.swimDepth *= r; if (b.floatDepth) b.floatDepth *= r;
    const mh = b.sp.hp * (0.35 + 0.65 * k) * b.baseScale; b.hp = Math.min(mh, b.hp * mh / Math.max(1, b.maxHp)); b.maxHp = mh;
  }
  if (k < 1) return;
  b.young = false; b.growH = null;
  if (b.wmom) b.wmom.kids = Math.max(0, (b.wmom.kids || 1) - 1);
  if (b.state === 'follow' && b.followTarget === b.wmom) { b.state = 'idle'; b.followTarget = null; b.stT = rr(1, 4); }
  b.wmom = null;
}
function natureYoung(dt) {
  const gh = dt * timeRate(), keep = [];
  for (const b of NATURE.young) {
    if (!b.alive || b.gone || b.growH == null) { if (b.wmom) { b.wmom.kids = Math.max(0, (b.wmom.kids || 1) - 1); b.wmom = null; } continue; }
    // an orphan grows up on its own
    if (b.wmom && (b.wmom.gone || !b.wmom.alive)) { b.wmom = null; if (b.state === 'follow') { b.state = 'idle'; b.followTarget = null; b.stT = 1; } }
    // after a scare it runs back to its mother
    else if (b.wmom && b.state !== 'follow' && !['flee', 'fight', 'held', 'eat'].includes(b.state) && !b.trapped && !b.pet) { b.state = 'follow'; b.followTarget = b.wmom; }
    b.growH += gh; wildGrow(b, clamp(b.growH / YOUNG_H, 0, 1)); if (b.growH != null) keep.push(b);
  }
  NATURE.young = keep;
}
// ---------- the clock: trees every few seconds, births now and then, and a word about it every morning ----------
function natureUpdate(dt) {
  if (G.mode !== 'play' || !P.a) return;
  if ((NATURE.t -= dt) <= 0) { NATURE.t = 3; natureTrees(); }
  if ((NATURE.bt -= dt) <= 0) { NATURE.bt = 12; natureBreed(); }
  if ((NATURE.gt -= dt) <= 0) { natureYoung(2 - NATURE.gt); NATURE.gt = 2; }
  if (NATURE.day < 0) NATURE.day = G.day;
  if (G.day !== NATURE.day && G.time >= 6.4) {
    NATURE.day = G.day;
    if (P.human && (NATURE.grown || NATURE.born > 2)) UI.notify(`🌱 הג׳ונגל מתחדש: ${NATURE.grown ? `${NATURE.grown === 1 ? 'עץ אחד צמח' : `${NATURE.grown} עצים צמחו`} מחדש` : ''}${NATURE.grown && NATURE.born > 2 ? ' ו־' : ''}${NATURE.born > 2 ? `${NATURE.born} גורים נולדו ביער` : ''}`, 'good');
    NATURE.grown = 0; NATURE.born = 0;
  }
}
