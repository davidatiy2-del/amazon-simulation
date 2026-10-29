// ================= HOME, CAMP & NIGHT =================
// ---------- day and night: long days, ~30 s of darkness, then sleep ----------
const NIGHT = { tried: false };
function timeRate() {
  if ((G.timeMul || 1) > 1) return G.timeMul / HOUR;
  const t = G.time;
  if (t >= 5.3 && t < 19.2) return 13.9 / 1800;
  return 10.1 / 30;
}
function nightUpdate(dt) {
  if (G.mode !== 'play' || !P.a || !P.a.alive) return;
  if (!isNight()) { NIGHT.said = ''; return; }
  if (P.sleeping || NIGHT.said === 'hint') return;
  NIGHT.said = 'hint'; UI.notify(TOUCH ? 'לילה. לחיצה ארוכה על מנוחה כדי לישון' : 'לילה. להחזיק Z כדי לישון');
}

// ---------- the den: a home on the map, cubs with you or at home ----------
CTXT.den = ['heart', 'הבית', 'לנהל את הבית'];
CTXT.buildden = ['up', 'לבנות בית', 'לבנות כאן בית'];
CTXT.rod = ['drop', 'חכה', 'לדוג בחכה'];
CTXT.camp = ['layers', 'המחנה', 'לשדרג את המחנה'];
CTXT.wood = ['leaf', 'עצים', 'להחזיק כדי לאסוף עצים'];
function homeReset() {
  P.workshopOn = false; P.arrows = 12; CAMPH.store = { meat: 0, cooked: 0, fish: 0, wood: 0, spears: 0, arrows: 0 }; clearDen(); P.cubsMode = 'den'; P.inv = { wood: 0, fish: 0, meat: 0, cooked: 0 }; NIGHT.tried = false;
  rodStop(); CAMPH.camp = null; CAMPH.up = {}; CAMPH.cut = {}; CAMPH.built = false; clearCampUps(); DANGER.t = rr(150, 230);
}
function homeContext() {
  const a = P.a; if (!a || P.fish && !DEN.pos && !P.cubs.length) return null;
  if (P.human) return null;
  if (DEN.pos && inDen()) return 'den';
  if (!DEN.pos && (P.cubs.length || aliveMates().length) && denSpotOk()) return 'buildden';
  return null;
}
function uiCard(id, html) {
  let el = document.getElementById(id);
  if (!el) { el = document.createElement('section'); el.id = id; el.className = 'ov'; el.hidden = true; document.body.appendChild(el); }
  el.innerHTML = `<div class="card">${html}</div>`; el.hidden = false; G.paused = true; INPUT.use = false; INPUT.joy = false;
  if (document.pointerLockElement) document.exitPointerLock();
  return el;
}
function closeCard(id) { const el = document.getElementById(id); if (el) el.hidden = true; G.paused = false; }
function openDenMenu() {
  const n = denName(), cubs = P.cubs.filter(c => c.alive).length, follow = P.cubsMode === 'follow';
  const el = uiCard('denov', `<h2>ה${n} שלך</h2><p>ה${n} מסומן במפה ובמפה הקטנה, גם כשמתרחקים. שינה כאן בטוחה ומרפאת מהר.</p>` +
    `<p>${cubs ? `${cubs} צאצאים. עכשיו הם ${follow ? 'באים איתך לכל מקום' : `מחכים כאן ב${n} ${you('כשאתה מתרחק', 'כשאת מתרחקת')}`}.` : 'עוד אין צאצאים.'}</p>` +
    `<div class="btns" style="flex-wrap:wrap">${cubs ? `<button class="btn pri" data-a="${follow ? 'den' : 'follow'}">${follow ? `להשאיר את הצאצאים ב${n}` : 'לקחת את הצאצאים איתי'}</button>` : ''}` +
    `<button class="btn" data-a="destroy">להרוס את ה${n}</button><button class="btn" data-a="close">סגירה</button></div>`);
  el.onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.a === 'follow' || b.dataset.a === 'den') { P.cubsMode = b.dataset.a; UI.notify(P.cubsMode === 'follow' ? 'הצאצאים באים איתך' : `הצאצאים יחכו ב${n}`, 'good'); saveGame(); }
    if (b.dataset.a === 'destroy') { if (!b.dataset.sure) { b.dataset.sure = 1; b.textContent = 'בטוח? ללחוץ שוב'; return; } clearDen(); P.cubsMode = 'follow'; UI.notify(`הרסת את ה${n}. אפשר לבנות חדש במקום אחר`, 'bad'); saveGame(); }
    closeCard('denov');
  };
}
function buildDenHere() {
  const a = P.a; if (!denSpotOk()) { UI.notify('המקום הזה לא מתאים לבית'); return; }
  const y = P.bird ? (P.perchC ? P.perchC.top - 0.15 : a.pos.y) : P.fish ? getH(a.pos.x, a.pos.z) + 0.02 : getH(a.pos.x, a.pos.z);
  buildDen(a.pos.x, y, a.pos.z, false); P.cubsMode = 'den';
}
function homeOnBigMap(c, m) {
  if (!DEN.pos || P.human) return;
  const [x, y] = m(DEN.pos.x, DEN.pos.z);
  c.fillStyle = '#ffd34d'; c.beginPath(); c.arc(x, y, 8, 0, TAU); c.fill(); c.lineWidth = 2.5; c.strokeStyle = '#3a2a10'; c.stroke();
  c.lineWidth = 5; c.strokeStyle = 'rgba(0,0,0,.65)'; c.strokeText(`ה${denName()} שלך`, x, y - 15); c.fillStyle = '#ffe9a8'; c.fillText(`ה${denName()} שלך`, x, y - 15);
}

// ---------- the hunter's camp: wood, upgrades and a fishing rod ----------
const CAMPH = { camp: null, up: {}, cut: {}, meshes: [], built: false, woodT: 0 };
const UPG = [
  { id: 'fence', n: 'גדר יתדות', d: 'טורפים לא נכנסים למחנה, ושינה בו בטוחה', cost: { wood: 8 } },
  { id: 'fire', n: 'מדורה גדולה', d: 'בלילה טורפים מתרחקים מהמחנה, ומנוחה ליד האש מרפאת מהר', cost: { wood: 4 } },
  { id: 'rack', n: 'מתלה חניתות', d: 'עוד שתי חניתות, והאשפה מתמלאת כשחוזרים למחנה', cost: { wood: 5 } },
  { id: 'dry', n: 'מתלה ייבוש', d: 'דגים מהחכה נשמרים, ואפשר לאכול מהם במחנה', cost: { wood: 3, fish: 2 } },
  { id: 'shelter', n: 'מחסה עם ערסל', d: 'שינה במחנה מחזירה את כל הבריאות ולא מרעיבה', cost: { wood: 6 } }
];
const costText = c => [c.wood ? `${c.wood} עצים` : '', c.fish ? `${c.fish} דגים` : ''].filter(Boolean).join(' + ');
const canPay = c => resHave('wood') >= (c.wood || 0) && resHave('fish') >= (c.fish || 0);
function homeCamp() {
  if (!CAMPH.camp && HUNT.camps.some(c => !c.gone) && P.a) CAMPH.camp = HUNT.camps.filter(c => !c.gone).reduce((b, c) => Math.hypot(c.x - P.a.pos.x, c.z - P.a.pos.z) < Math.hypot(b.x - P.a.pos.x, b.z - P.a.pos.z) ? c : b);
  return CAMPH.camp;
}
const inCamp = (r = 8) => { const c = homeCamp(); return !!c && !!P.a && Math.hypot(c.x - P.a.pos.x, c.z - P.a.pos.z) < r; };
function hunterCtx() {
  const a = P.a; if (a.swimming || ROD.phase) return null;
  { const fc = foundCtx(); if (fc) return fc; }
  if (!TOUCH && (P.inv.cooked || 0) > 0 && P.food < 60) return 'meal';
  { const ck = cookCtx(); if (ck) return ck; }
  { const fd = feedCtx(); if (fd) return fd; }
  const fx = Math.sin(a.yaw), fz = Math.cos(a.yaw);
  if (P.water > 85 && waterDepth(a.pos.x + fx * 3, a.pos.z + fz * 3) > 0.4 && waterDepth(a.pos.x, a.pos.z) < 0.5) return 'rod';
  { let cw = null; shQuery(a.pos.x, a.pos.z, 2.8, b => { if (!cw && b.alive && b.cowCamp && b.milkDay !== G.day) cw = b; }); if (cw) { CAMPH.cow = cw; return 'milk'; } }
  if (inCamp(8)) return 'camp';
  const tr = nearTrunk(a.pos.x, a.pos.z, 1.3 + a.rad);
  if (tr && CAMPH.cut[`${tr.x | 0},${tr.z | 0}`] !== G.day) { CAMPH.tree = tr; return 'wood'; }
  return cookLow();
}
function woodStep(dt) {
  const tr = CAMPH.tree; if (!tr) return;
  P.eating = false; CAMPH.woodT += dt; P.a.anim.atk = CAMPH.woodT % 0.6 < dt ? 0.45 : P.a.anim.atk;
  if (CAMPH.woodT >= 0.9) {
    CAMPH.woodT = 0; CAMPH.cut[`${tr.x | 0},${tr.z | 0}`] = G.day; P.inv.wood += 3; PROG.flags.wood = 1;
    UI.notify(`כרתת 3 עצים בגרזן (יש לך ${P.inv.wood})`, 'good'); AUD.play('bite', 0.4);
  }
}
function openCamp() { campMenu(); }
function openCampOld() {
  const rows = UPG.map(u => {
    const done = CAMPH.up[u.id];
    return `<div class="srow"><div><b>${u.n}</b><span>${u.d}</span></div><div class="sbtns">${done ? '<button class="btn" disabled>נבנה ✓</button>' : `<button class="btn${canPay(u.cost) ? ' pri' : ''}" data-u="${u.id}"${canPay(u.cost) ? '' : ' disabled'}>${costText(u.cost)}</button>`}</div></div>`;
  }).join('');
  const store = CAMPH.up.dry && P.inv.fish > 0 ? `<button class="btn pri" data-a="eat">לאכול דג מהמלאי (${P.inv.fish})</button>` : '';
  const el = uiCard('campov', `<h2>המחנה שלך</h2><p>יש לך ${P.inv.wood} עצים ו-${P.inv.fish} דגים. עצים אוספים ליד גזעים, ודגים בחכה.</p>${rows}<div class="btns">${store}<button class="btn" data-a="close">סגירה</button></div>`);
  el.onclick = e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    if (b.dataset.u) {
      const u = UPG.find(q => q.id === b.dataset.u); if (!u || !canPay(u.cost)) return;
      P.inv.wood -= u.cost.wood || 0; P.inv.fish -= u.cost.fish || 0; CAMPH.up[u.id] = 1; applyCampUp(u.id, true); PROG.flags.campup = 1;
      UI.notify(`בנית: ${u.n}`, 'good'); AUD.play('chime'); saveGame(); openCamp(); return;
    }
    if (b.dataset.a === 'eat') { P.inv.fish--; P.food = Math.min(100, P.food + 22); AUD.play('eat'); openCamp(); return; }
    closeCard('campov');
  };
}
function clearCampUps() { for (const m of CAMPH.meshes) scene.remove(m); CAMPH.meshes = []; }
function applyCampUp(id, fresh) {
  const c = homeCamp(); if (!c) return;
  if (CAMPUP2[id]) { CAMPUP2[id](fresh); return; }
  const R = new Rig(), gy = (lx, lz) => getH(c.x + lx, c.z + lz) - c.y, add = (geo, p, r, s, colr) => R.add(geo, M([p[0], p[1] + gy(p[0], p[2]), p[2]], r, s), 0, col(colr), 1);
  if (id === 'fence') {
    const gap = Math.atan2(c.rz - c.z, c.rx - c.x);
    for (let i = 0; i < 34; i++) { const a = i / 34 * TAU; if (Math.abs(angDiff(a, gap)) < 0.32) continue; add(new THREE.CylinderGeometry(0.07, 0.1, 1.5 + (i % 3) * 0.15, 5), [Math.cos(a) * 8.5, 0.72, Math.sin(a) * 8.5], [rr(-0.08, 0.08), 0, rr(-0.08, 0.08)], null, i % 2 ? '#6a4a2c' : '#5a3f28'); }
  } else if (id === 'rack') {
    for (const s of [-1, 1]) add(new THREE.CylinderGeometry(0.04, 0.05, 1.3, 6), [1.9 + s * 0.5, 0.65, 2.6], null, null, '#5a3f28');
    add(new THREE.CylinderGeometry(0.035, 0.035, 1.2, 6), [1.9, 1.15, 2.6], [0, 0, Math.PI / 2], null, '#6b4a2c');
    for (let i = 0; i < 4; i++) add(new THREE.CylinderGeometry(0.016, 0.018, 1.8, 5), [1.55 + i * 0.22, 0.88, 2.75], [0.25, 0, 0], null, '#6b4a2c');
  } else if (id === 'dry') {
    for (const s of [-1, 1]) add(new THREE.CylinderGeometry(0.04, 0.05, 1.6, 6), [-3.2 + s * 0.7, 0.8, 2.4], null, null, '#5a3f28');
    add(new THREE.CylinderGeometry(0.035, 0.035, 1.6, 6), [-3.2, 1.5, 2.4], [0, 0, Math.PI / 2], null, '#6b4a2c');
    for (let i = 0; i < 5; i++) add(new THREE.SphereGeometry(1, 8, 6), [-3.75 + i * 0.27, 1.25, 2.4], null, [0.05, 0.17, 0.03], '#9a7a50');
  } else if (id === 'shelter') {
    for (const s of [-1, 1]) for (const t of [-1, 1]) add(new THREE.CylinderGeometry(0.05, 0.06, 1.9, 6), [3.4 + s * 1.1, 0.95, -3.4 + t * 0.8], null, null, '#5a3f28');
    add(new THREE.BoxGeometry(2.6, 0.04, 2.0), [3.4, 1.92, -3.4], [0.12, 0, 0], null, '#6d7a4a');
    add(new THREE.CylinderGeometry(0.28, 0.28, 2.0, 10, 1, true, 0, Math.PI), [3.4, 0.75, -3.4], [0, 0, Math.PI / 2], [1, 1, 0.5], '#c9b07a');
  } else if (id === 'fire') {
    for (const m of c.flames) m.userData.big = 1.8;
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; add(new THREE.SphereGeometry(0.17, 6, 5), [Math.cos(a) * 0.85, 0.06, Math.sin(a) * 0.85], null, [1, 0.6, 1], '#5f5a55'); }
  }
  if (id === 'rack') { P.mods.spearsMax += 2; if (fresh) P.spears = P.mods.spearsMax; }
  if (!R.parts || true) {
    const mesh = new THREE.Mesh(R.geometry(), HUNT.mat || new THREE.MeshLambertMaterial({ vertexColors: true }));
    mesh.position.set(c.x, c.y, c.z); mesh.castShadow = true; mesh.receiveShadow = true; scene.add(mesh); CAMPH.meshes.push(mesh);
  }
}
function campUpdate(dt) {
  const c = homeCamp(); if (!c || !P.human || G.mode !== 'play' || !P.a) return;
  const a = P.a, here = Math.hypot(c.x - a.pos.x, c.z - a.pos.z), up = CAMPH.up;
  for (const m of c.flames) if (m.userData.big) m.scale.x = m.scale.z = m.userData.big;
  if (up.fence) shQuery(c.x, c.z, 9.5, b => {
    if (!b.alive || b.isPlayer || b.pet || b.hunter || b.tpl.kind !== 'quad' || b.legend) return;
    const dx = b.pos.x - c.x, dz = b.pos.z - c.z, d = Math.hypot(dx, dz) || 0.01;
    if (d < 8.6) { b.pos.x = c.x + dx / d * 8.7; b.pos.z = c.z + dz / d * 8.7; if (b.foe === a || b.target === a) { b.state = 'idle'; b.foe = null; b.target = null; } }
  });
  if (up.fire && isNight()) shQuery(c.x, c.z, 25, b => { if (b.alive && !b.isPlayer && !b.pet && b.tpl.kind === 'quad' && (b.sp.ai === 'pred' || b.sp.ai === 'croc') && b.state !== 'flee') threatReact(b, a, true); });
  if (up.fire && P.resting && here < 6) a.hp = Math.min(a.maxHp, a.hp + dt * 2);
  if (up.rack && here < 8 && P.spears < P.mods.spearsMax) { P.spears = P.mods.spearsMax; UI.notify('לקחת חניתות מהמתלה', 'good'); }
  if (up.shelter && P.sleeping && here < 9) { a.hp = Math.min(a.maxHp, a.hp + dt * 3); P.food = Math.max(P.food, CAMPH.sleepFood ?? P.food); P.water = Math.max(P.water, CAMPH.sleepWater ?? P.water); }
  else { CAMPH.sleepFood = P.food; CAMPH.sleepWater = P.water; }
}

// ---------- fishing rod ----------
const ROD = { phase: null, t: 0, bob: null, line: null, rod: null, x: 0, z: 0 };
function rodUse() {
  if (CLB.latch) return; CLB.latch = true;
  if (ROD.phase === 'bite') { rodStrike(); return; }
  if (ROD.phase) return;
  const a = P.a, fx = Math.sin(a.yaw), fz = Math.cos(a.yaw);
  let x = a.pos.x + fx * 4, z = a.pos.z + fz * 4;
  for (let d = 9; d >= 3; d -= 0.5) { const px = a.pos.x + fx * d, pz = a.pos.z + fz * d; if (waterDepth(px, pz) > 0.5) { x = px; z = pz; break; } }
  ROD.x = x; ROD.z = z; ROD.phase = 'wait'; ROD.t = rr(3, 8);
  let shoal = false; shQuery(x, z, 10, b => { if (b.spId === 'pacu' && b.alive) shoal = true; }); if (shoal) ROD.t *= 0.5;
  if (!ROD.bob) {
    ROD.bob = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), new THREE.MeshLambertMaterial({ color: '#e04a3a' }));
    ROD.line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new V3(), new V3()]), new THREE.LineBasicMaterial({ color: '#f2efe6', transparent: true, opacity: 0.8 }));
    ROD.rod = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.022, 2.3, 5), new THREE.MeshLambertMaterial({ color: '#7a5a34' }));
    ROD.rod.geometry.translate(0, 1.15, 0);
  }
  scene.add(ROD.bob, ROD.line, ROD.rod);
  FX.spawn('splash', x, waterAt(x, z), z, 5); AUD.play('swipe', 0.4); a.anim.atk = 0.45;
  if (!PROG.flags.rodTold) { PROG.flags.rodTold = 1; UI.notify(TOUCH ? 'החכה במים. כשהמצוף צולל: להקיש מהר על תקיפה' : 'החכה במים. כשהמצוף צולל: קליק מהר', 'good'); }
}
function rodStop(why) {
  ROD.phase = null;
  for (const m of [ROD.bob, ROD.line, ROD.rod]) if (m) scene.remove(m);
  if (why === 'reel') UI.notify('הוצאת את החכה מהמים');
}
function rodStrike() {
  if (ROD.phase === 'bite') {
    const name = rng() < 0.75 ? 'פאקו' : 'פיראנה';
    if ((P.inv.fish || 0) >= CARRY.fish) { UI.notify('הארגז מלא בדגים, הדג שוחרר. אפשר לבשל או להפקיד במחנה', 'bad'); rodStop(); return; } P.inv.fish++; PROG.flags.rod = 1; PROG.kb = PROG.kb || {}; PROG.kb.pacu = (PROG.kb.pacu || 0) + 1;
    combatText(`דגת ${name}!`, 'good'); FX.spawn('splash', ROD.x, waterAt(ROD.x, ROD.z), ROD.z, 14); AUD.play('splash', 0.8);
    UI.notify(`דגת ${name}. צריך לבשל אותו על אש לפני שאוכלים (יש לך ${P.inv.fish} דגים)`, 'good');
    rodStop(); return;
  }
  combatText('מוקדם מדי, הדג ברח', 'bad'); ROD.phase = 'wait'; ROD.t = rr(4, 8);
}
function rodUpdate(dt) {
  if (!ROD.phase) return;
  const a = P.a;
  if (!a || !a.alive || G.mode !== 'play' || a.swimming || a.speed > 0.6 || !P.human) { rodStop(a && a.speed > 0.6 ? 'reel' : null); return; }
  const w = waterAt(ROD.x, ROD.z), fx = Math.sin(a.yaw), fz = Math.cos(a.yaw), rx = -Math.cos(a.yaw), rz = Math.sin(a.yaw);
  const hx = a.pos.x + rx * 0.22 + fx * 0.25, hz = a.pos.z + rz * 0.22 + fz * 0.25, hy = a.pos.y + 1.05;
  ROD.rod.position.set(hx, hy, hz); ROD.rod.quaternion.setFromUnitVectors(UPV, _t2.set(fx * 0.8, 0.6, fz * 0.8).normalize());
  const tip = new V3(hx, hy, hz).addScaledVector(_t2, 2.3);
  ROD.t -= dt;
  let by = w + 0.02 + Math.sin(G.t * 3) * 0.02;
  if (ROD.phase === 'wait' && ROD.t <= 0) { ROD.phase = 'bite'; ROD.t = 1.3; combatText(TOUCH ? 'נשנוש! להקיש על תקיפה!' : 'נשנוש! קליק!', 'crit'); AUD.play('splash', 0.7); FX.spawn('splash', ROD.x, w, ROD.z, 8); }
  else if (ROD.phase === 'bite') { by = w - 0.12 + Math.sin(G.t * 25) * 0.05; if (ROD.t <= 0) { combatText('הדג ברח', 'bad'); ROD.phase = 'wait'; ROD.t = rr(4, 9); } }
  ROD.bob.position.set(ROD.x, by, ROD.z);
  ROD.line.geometry.setFromPoints([tip, ROD.bob.position]);
}

// ---------- danger for the hunter: now and then a predator stalks you without being provoked ----------
const DANGER = { t: 200 };
function dangerUpdate(dt) {
  if (DANGER.off || !P.human || G.mode !== 'play' || !P.a || !P.a.alive || P.sleeping) return;
  const a = P.a;
  if (CAMPH.up.fence && inCamp(9)) return;
  DANGER.t -= dt * (isNight() ? 1.4 : 1);
  if (DANGER.t > 0) return;
  DANGER.t = rr(150, 240);
  let best = null, bd = 1e9;
  shQuery(a.pos.x, a.pos.z, 90, (b, d) => {
    if (!b.alive || b.isPlayer || b.pet || b.legend || b.young || b.state === 'fight') return;
    const ok = ((b.spId === 'jaguar' || b.spId === 'puma') && d < 90) || (b.spId === 'caiman' && d < 14 && waterDepth(a.pos.x, a.pos.z) > 0.05) || (b.spId === 'peccary' && d < 40);
    if (ok && d < bd) { bd = d; best = b; }
  });
  if (!best) { DANGER.t = rr(40, 80); return; }
  if (best.spId === 'peccary') {
    let n = 0; shQuery(best.pos.x, best.pos.z, 15, b => { if (n < 3 && b.alive && b.spId === 'peccary' && !b.young) { b.state = 'fight'; b.foe = a; n++; } });
    UI.notify('עדר פקארים מסתער עליך!', 'bad');
  } else if (best.spId === 'caiman') { best.state = 'fight'; best.foe = a; UI.notify('קיימן מזנק מהמים!', 'bad'); }
  else { best.state = 'hunt'; best.target = a; best.stT = 40; DANGER.stalker = best; }
  P.pings.push({ x: best.pos.x, z: best.pos.z, t: 10 });
}
function stalkerUpdate() {
  const s = DANGER.stalker; if (!s) return;
  if (!s.alive || s.target !== P.a || !P.a || !P.a.alive) { DANGER.stalker = null; return; }
  if (!s.warned && dist2(s.pos, P.a.pos) < 32) { s.warned = 1; UI.notify(`${s.sp.he} עוקב${s.sp.he.endsWith('ה') ? 'ת' : ''} אחריך!`, 'bad'); combatText('טורף בעקבותיך!', 'bad'); }
}
function homeUpdate(dt) { if (P.ctx !== 'wood') CAMPH.woodT = 0; nightUpdate(dt); campUpdate(dt); rodUpdate(dt); dangerUpdate(dt); stalkerUpdate(); }

// ================= SLEEP THAT WORKS IN A CROWDED JUNGLE, AND INFO BEHIND ONE SMALL BUTTON =================
// only real danger keeps you awake: something attacking or stalking you, or an awake predator right next to you
function sleepBlocker(r) {
  const a = P.a; if (!a) return null; let n = null;
  shQuery(a.pos.x, a.pos.z, Math.max(r, 40), (b, d) => {
    if (n || !b.alive || b === a || b.pet === a || b.isPartner || b.cub) return;
    const active = (b.state === 'fight' && b.foe === a) || ((b.state === 'hunt' || b.state === 'dive') && b.target === a) || (b.state === 'warn' && d < 15);
    const close = d < r && b.state !== 'sleep' && b.state !== 'rest' && (preys(b, a) || (b.hunter && !b.fleeing && !P.fish && !P.human));
    if (active || close) n = b;
  });
  return n;
}
const INFO_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9.5"/><path d="M12 11v6"/><circle cx="12" cy="7.4" r="0.6" fill="currentColor"/></svg>';
const INFO = { tab: 'family', told: false };
const DIRS = ['צפונה', 'לצפון-מזרח', 'מזרחה', 'לדרום-מזרח', 'דרומה', 'לדרום-מערב', 'מערבה', 'לצפון-מערב'];
function whereIs(b) {
  const a = P.a, dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z, d = Math.hypot(dx, dz);
  if (d < 6) return 'לידך';
  const k = Math.round(((Math.atan2(dx, -dz) + TAU) % TAU) / (TAU / 8)) % 8;
  return `${Math.round(d)} מ׳ ${DIRS[k]}`;
}
function doing(b) {
  const g = (m, f) => heb(b, m, f);
  if (b.stolenBy) return `${g('נלקח', 'נלקחה')} על ידי ${b.stolenBy.name}. ${you('נצח', 'נצחי')} אותו כדי להחזיר`;
  if (b.pet && b.pet !== P.a) return `${g('נלקח', 'נלקחה')} על ידי צייד. ${you('הברח', 'הבריחי')} אותו כדי להחזיר`;
  if (b.state === 'fight') return g('נלחם!', 'נלחמת!');
  if (b.state === 'flee') return g('בורח!', 'בורחת!');
  if (b.atDen) return 'מחכה בבית';
  if (b.stay) return 'מחכה איפה שהשארת';
  if (b.state === 'eat') return g('אוכל', 'אוכלת');
  if (b.state === 'sleep') return g('ישן', 'ישנה');
  if (b.state === 'rest') return g('נח', 'נחה');
  return g('הולך איתך', 'הולכת איתך');
}
const hpBar = b => `<i class="ihp"><b style="width:${Math.round(clamp(b.hp / b.maxHp, 0, 1) * 100)}%"></b></i>`;
function memberRow(b, extra) {
  return `<div class="irow"><div><b>${b.name || b.sp.he}</b> <small>${b.sp.he}${b.sex === 'f' ? ', נקבה' : ', זכר'}</small><span>${doing(b)} · ${whereIs(b)}${extra ? ' · ' + extra : ''}</span></div>${hpBar(b)}</div>`;
}
function famHtml() {
  const a = P.a, out = [];
  const mates = aliveMates(), stolen = ANIMALS.filter(b => b.alive && b.stolenBy && b.spId === P.spId), cubs = P.cubs.filter(c => c.alive), pets = P.human && a.pets ? a.pets.filter(b => b.alive) : [];
  if (mates.length || stolen.length) out.push(`<h3>${P.a.sex === 'm' ? 'בנות זוג' : 'בן זוג'}</h3>` + mates.map(m => memberRow(m)).join('') + stolen.map(m => memberRow(m)).join(''));
  if (cubs.length) out.push(`<h3>${P.human ? 'ילדים' : 'צאצאים'}</h3>` + cubs.map(c => {
    const h = (c.cubHunger || 0) > 60 ? heb(c, 'רעב מאוד', 'רעבה מאוד') : (c.cubHunger || 0) > 35 ? heb(c, 'רעב', 'רעבה') : heb(c, 'שבע', 'שבעה');
    return memberRow(c, `${h} · ${heb(c, 'גדל', 'גדלה')} ${Math.round(clamp((c.age || 0) / 60, 0, 1) * 100)}%`);
  }).join(''));
  if (pets.length) out.push('<h3>חיות מאולפות</h3>' + pets.map(b => memberRow(b, b.spId === 'bushdog' ? dogHungerTxt(b) : '')).join(''));
  if (!P.human) {
    const n = denName();
    if (DEN.pos) {
      const d = Math.hypot(DEN.pos.x - a.pos.x, DEN.pos.z - a.pos.z), k = Math.round(((Math.atan2(DEN.pos.x - a.pos.x, -(DEN.pos.z - a.pos.z)) + TAU) % TAU) / (TAU / 8)) % 8;
      out.push(`<h3>ה${n}</h3><div class="irow"><div><span>${d < 6 ? you('אתה בבית', 'את בבית') : `${Math.round(d)} מ׳ ${DIRS[k]}`} · הצאצאים ${P.cubsMode === 'follow' ? 'באים איתך' : 'מחכים בבית כשמתרחקים'}</span></div></div>` +
        (cubs.length ? `<div class="btns"><button class="btn" data-a="${P.cubsMode === 'follow' ? 'den' : 'follow'}">${P.cubsMode === 'follow' ? 'להשאיר את הצאצאים בבית' : 'לקחת את הצאצאים איתי'}</button></div>` : ''));
    } else out.push(`<h3>ה${n}</h3><p class="idim">עוד אין ${n}. ${mates.length || cubs.length ? 'כפתור הזהב מציע לבנות במקום מתאים.' : 'עם בן או בת זוג אפשר לבנות.'}</p>`);
  } else {
    const c = homeCamp();
    if (c) out.push(`<h3>המחנה</h3><p class="idim">${whereIs({ pos: { x: c.x, z: c.z } })} · שדרוגים: ${Object.keys(CAMPH.up).length}/${UPG.length} · עצים ${P.inv.wood}, דגים ${P.inv.fish}</p>`);
  }
  if (!mates.length && !cubs.length && !pets.length && !stolen.length) out.unshift(`<p class="idim">${P.human ? 'עוד אין חיות מאולפות. ליד חיה צעירה כפתור הזהב מאלף.' : 'עוד אין משפחה. בני זוג אפשריים מסומנים בוורוד במצב החושים.'}</p>`);
  { const pr = pregRows(); if (pr) out.push('<h3>צאצאים חדשים</h3>' + pr); }
  if (!P.human && DEN.pos && Math.hypot(DEN.pos.x - a.pos.x, DEN.pos.z - a.pos.z) > 12) out.push('<div class="btns"><button class="btn pri" data-a="gohome">ללכת הביתה</button></div>');
  if (P.human && homeCamp() && !inCamp(10)) out.push('<div class="btns"><button class="btn pri" data-a="gocamp">ללכת למחנה</button></div>');
  return out.join('');
}
function missionsHtml() {
  const list = missionList(), done = list.filter(m => PROG.done.includes(m.id)).length;
  return `<h3>${missionTitle()}</h3><ul class="imis">${PROG.active.map(id => `<li>${GOAL[id].t} <small>+${GOAL[id].xp}</small></li>`).join('') || '<li>כל המשימות הושלמו!</li>'}</ul>` +
    `<p class="idim">הושלמו ${done} מתוך ${list.length}</p><div class="ixp"><b style="width:${(clamp(PROG.xp / xpNeed(PROG.lvl), 0, 1) * 100).toFixed(0)}%"></b></div><p class="idim">רמה ${PROG.lvl} · עוד ${Math.max(0, Math.round(xpNeed(PROG.lvl) - PROG.xp))} ניסיון לרמה הבאה</p>`;
}
function statusHtml() {
  const perks = PROG.perks.map(id => PERK[id] ? PERK[id].n : '').filter(Boolean);
  const hh = Math.floor(G.time), mm = Math.floor((G.time - hh) * 60);
  const rows = [['חיה', `${P.sp.he}${PROG.gen > 1 ? ` · דור ${PROG.gen}` : ''}`], ['רמה', `${PROG.lvl}`], ['יום ושעה', `יום ${G.day}, ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`],
    ['מעמד', `${P.renown}`], ['טרף', `${P.kills}`], ['ספר השדה', `${P.discovered.size}/${GUIDE_ORDER.length}`]];
  if (GROWERS[P.spId]) rows.push(['אורך', growText()]);
  if (P.spId === 'frog') rows.push(['קפיצה', jumpText()]);
  if (P.human) rows.push(['ציוד', `חניתות ${P.spears}, עצים ${P.inv.wood}, דגים ${P.inv.fish}`]);
  return `<div class="istat">${rows.map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join('')}</div>` +
    `${legendsHtml()}<h3>שדרוגים</h3><p class="idim">${perks.length ? perks.join(' · ') : 'עוד אין. כל עלייה ברמה נותנת שדרוג.'}</p>` +
    `<h3>תצוגה</h3><div class="seg iseg">${[['compact', 'מצומצמת'], ['min', 'נקייה'], ['full', 'מלאה']].map(([v, t]) => `<button data-hud="${v}" class="${HUD.mode === v ? 'on' : ''}">${t}</button>`).join('')}</div>` +
    `<p class="idim">מצומצמת: הודעות קצרות למעלה. נקייה: רק אזהרות. מלאה: כל החלונות על המסך.</p>`;
}
function openInfo(tab) {
  if (G.mode !== 'play' || !P.a) return;
  if (tab) INFO.tab = tab;
  const T = [['family', 'משפחה'], ['missions', 'משימות'], ['status', 'מצב']];
  const body = INFO.tab === 'family' ? famHtml() : INFO.tab === 'missions' ? missionsHtml() : statusHtml();
  const el = uiCard('infohub', `<div class="itabs">${T.map(([k, t]) => `<button data-tab="${k}" class="${INFO.tab === k ? 'on' : ''}">${t}</button>`).join('')}<button class="ix" data-a="close" aria-label="סגירה">✕</button></div><div class="ibody">${body}</div>`);
  el.onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.tab) { openInfo(b.dataset.tab); return; }
    if (b.dataset.leg) { const L = LEGENDS.find(l => l.id === b.dataset.leg), at = L && (L.a && L.a.alive ? L.a.pos : L.lair); closeCard('infohub'); if (at) setWay(at.x, at.z, true, L.name); return; }
    if (b.dataset.preg) { const m = b.dataset.preg === 'self' ? P.a : aliveMates()[+b.dataset.preg]; closeCard('infohub'); startPreg(m); return; }
    if (b.dataset.hud) { HUD.mode = b.dataset.hud; SET.hud = HUD.mode; saveSet(); applyHud(); openInfo('status'); return; }
    if (b.dataset.a === 'follow' || b.dataset.a === 'den') { P.cubsMode = b.dataset.a; saveGame(); openInfo('family'); return; }
    if (b.dataset.a === 'gohome' && DEN.pos) { closeCard('infohub'); setWay(DEN.pos.x, DEN.pos.z, true, 'הבית'); return; }
    if (b.dataset.a === 'gocamp') { const c = homeCamp(); closeCard('infohub'); if (c) setWay(c.x, c.z, true, 'המחנה'); return; }
    if (b.dataset.a === 'close') closeCard('infohub');
  };
}
(function () {
  const st = document.createElement('style');
  st.textContent = `#infohub .card{width:min(560px,94vw);max-height:92vh;max-height:92dvh;overflow:auto;padding:14px 18px}
.itabs{display:flex;gap:6px;align-items:center;margin-bottom:10px;position:sticky;top:-14px;background:inherit;padding-top:2px;z-index:1}
.itabs button{flex:1;padding:8px 6px;border-radius:999px;border:1px solid var(--line);background:transparent;color:var(--ink);font:inherit;font-size:14px;cursor:pointer}
.itabs button.on{background:var(--gold);color:#1c1608;border-color:var(--gold);font-weight:600}
.itabs .ix{flex:0 0 38px;height:38px;padding:0;font-size:16px}
#infohub h3{margin:10px 0 4px;font-size:14px;color:var(--gold)}
.irow{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid var(--line)}
.irow small{color:var(--dim);font-size:12px}.irow span{display:block;font-size:12.5px;color:var(--dim);margin-top:1px}
.ihp{flex:0 0 70px;height:6px;border-radius:3px;background:rgba(127,127,127,.3);overflow:hidden}.ihp b{display:block;height:100%;background:#d8473a}
.idim{color:var(--dim);font-size:13px;margin:4px 0}.imis{margin:4px 0;padding:0 18px 0 0}.imis li{margin:4px 0}.imis small{color:var(--gold)}
.ixp{height:6px;border-radius:3px;background:rgba(127,127,127,.28);overflow:hidden;margin:6px 0}.ixp b{display:block;height:100%;background:var(--gold)}
.istat{display:grid;grid-template-columns:1fr 1fr;gap:6px 14px}.istat div{display:flex;justify-content:space-between;gap:8px;border-bottom:1px solid var(--line);padding:4px 0;font-size:13.5px}.istat span{color:var(--dim)}
.iseg{margin:4px 0}
#tHud.on{background:rgba(10,22,14,.42)}`;
  document.head.appendChild(st);
})();
function infoTip() {
  if (INFO.told || G.mode !== 'play' || !P.a) return;
  INFO.told = true;
  UI.notify(TOUCH ? 'מצב המשפחה, המשימות והרמה: בכפתור ⓘ למעלה' : 'מצב המשפחה, המשימות והרמה: מקש I');
}

// ================= PACKS & GROUPS, AND EASIER TRAVEL =================
// ---------- the bush dog: the Amazon's pack hunter ----------
SPECIES.bushdog = { he: 'כלב יער', lat: 'Speothos venaticus', kind: 'quad', ai: 'pack', hp: 42, dmg: 9, walk: 2.2, run: 11, swim: 3.6, reach: 1.1, atkCD: 0.6, sense: 34, safe: 40, food: 16, turn: 9,
  prey: ['capybara', 'agouti', 'coati', 'peccary'], count: 14, group: [4, 6], hab: 'forest', size: [0.92, 1.08], danger: 2, swimmer: true, call: 'whistle', diet: 'טורף להקה',
  guide: 'כלב קטן וחום שחי בלהקות. הלהקה מקיפה טרף מכמה כיוונים ותוקפת יחד, ולכן היא מצליחה לצוד קפיברות וחיות גדולות ממנה. כלבי יער שוחים מצוין ורודפים טרף גם לתוך המים.',
  pl: { desc: 'כלב קטן שחי בלהקה. לבד הוא חלש, אבל הלהקה שלו מקיפה כל טרף ותוקפת יחד איתו.', stats: [2, 4, 3, 4], risk: 'סכנות: יגוארים, קיימנים במים ואנקונדות.',
    role: 'צייד להקה: תוקפים טרף, והלהקה מקיפה אותו מכל הכיוונים ותוקפת יחד איתך.', pros: ['להקה של ארבעה שתוקפת איתך', 'מקיפים טרף גדול כמו קפיברה', 'שחיין מצוין', 'הלהקה מגינה עליך'],
    over: { hp: 60, dmg: 11, stealth: 0.9, call: 'whistle' } } };
if (!GUIDE_ORDER.includes('bushdog')) GUIDE_ORDER.push('bushdog');
if (!PLAYABLE.includes('bushdog')) PLAYABLE.splice(PLAYABLE.indexOf('ocelot') + 1, 0, 'bushdog');
CARRYMAX.bushdog = 40; MTITLE.bushdog = 'כלב היער';
MISSIONS.bushdog = [MS('bushdog.hunt1', 'לצוד טרף ראשון', 30, () => P.kills >= 1), MS('bushdog.pack', 'לצוד יחד עם הלהקה', 50, FL('packhunt')), MS('bushdog.swim', 'לשחות בנהר', 20, FL('swim')),
  MS('bushdog.capy', 'לצוד קפיברה עם הלהקה', 80, KB('capybara')), MS('bushdog.pecc', 'לצוד פקארי', 70, KB('peccary')), mateM('bushdog'), MS('bushdog.provide', 'לסחוב טרף לגורים', 60, FL('provide')),
  MS('bushdog.young', 'להביא גורים לעולם', 80, () => P.cubs.length > 0 || P.raised > 0), MS('bushdog.hunt5', 'לצוד חמישה טרפים', 80, () => P.kills >= 5), raiseM('bushdog'), ...tailM('bushdog')];
for (const m of MISSIONS.bushdog) GOAL[m.id] = m;
function buildBushdogTpl() {
  if (TPL.bushdog) return;
  TPL.bushdog = buildQuad(Object.assign({}, TPL.ocelot.o, { cheeks: false, brow: false, blades: false, L: 0.5, chestR: 0.15, hipR: 0.14, legLen: 0.19, legR: 0.036, pawR: 0.042, neckLen: 0.1, neckR: 0.075, neckUp: 0.28,
    headR: 0.08, snoutLen: 0.075, snoutR: 0.042, snoutSquash: 0.85, noseK: 0.8, headWid: 1.0, ear: 'round', earR: 0.032, tailLen: 0.15, tailR: 0.03, tailN: 2, eyeR: 0.12, pat: 0, tailMask: 0, teeth: true,
    c: { fur: '#9b5b2c', belly: '#6a4024', nose: '#151010', eye: '#2a1c12', jaw: '#7d4c2a', snout: '#7a4a28' } }));
}
const PACKN = { peccary: 'עדרי פקארים', coati: 'להקות קואטי', bushdog: 'להקות כלבי יער', capybara: 'עדרי קפיברות', howler: 'להקות קופים מיללים', squirrel: 'להקות קופי סנאי' };
function nearPlayer(p, r) { return !!P.a && G.mode === 'play' && Math.hypot(p.x - P.a.pos.x, p.z - P.a.pos.z) < r; }
function spawnPack(id, n, okFar) {
  buildBushdogTpl();
  let c = null; for (let t = 0; t < 40 && !c; t++) { const q = landPt(id), p = { x: q[0], z: q[1] }; if (waterDepth(p.x, p.z) === 0 && getNY(p.x, p.z) > 0.85 && okFar(p) && !HUNT.camps.some(cp => Math.hypot(cp.x - p.x, cp.z - p.z) < 60)) c = p; }
  if (!c) return n;
  const g = { kind: 'pack', members: [], state: 'roam', t: 0, think: rr(0, 3), hunger: rr(20, 70), sp: id }; GROUPS.push(g);
  for (let i = 0; i < n; i++) { const a = new Animal(id, c.x + rr(-3, 3), c.z + rr(-3, 3), { group: g }); a.slot = i; a.ground(1, true); g.members.push(a); }
  return n;
}
function spawnPackEscort(p, sp = 'bushdog', n = 4) {
  buildBushdogTpl();
  const g = { kind: 'pack', members: [], state: 'escort', playerLed: true, sp }; GROUPS.push(g);
  for (let i = 0; i < n; i++) {
    const a = new Animal(sp, p.pos.x + rr(-3, 3), p.pos.z + rr(-3, 3), { group: g, sex: rng() < 0.5 ? 'm' : 'f' });
    Object.assign(a, { slot: i, socialExtra: true, escort: true, brain: 'pack', name: pick(NAMES[a.sex]) }); a.ground(1, true); g.members.push(a);
  }
}
function packPrey(L) {
  let best = null, bs = -1e9;
  shQuery(L.pos.x, L.pos.z, 50, (b, d) => {
    if (!b.alive || b.group === L.group || b.pet || b.hunter || b.legend || !preys(L, b) || waterDepth(b.pos.x, b.pos.z) > 1.5) return;
    if (b.isPlayer && (P.climb || P.flying)) return;
    const s = -d - b.hp * 0.15 + (b.young ? 15 : 0);
    if (s > bs) { bs = s; best = b; }
  });
  return best;
}
function packMove(a, x, z, spd, dt, crouch) {
  const dx = x - a.pos.x, dz = z - a.pos.z, d = Math.hypot(dx, dz) || 0.01;
  if (d < 0.6) { a.move(dx / d, dz / d, 0.01, dt); a.pose = 'idle'; a.crouch = false; return d; }
  a.move(dx / d, dz / d, spd, dt); a.crouch = !!crouch; a.pose = a.swimming ? 'swim' : crouch ? 'crouch' : 'move';
  return d;
}
function packBite(a, t, dt) {
  const dx = t.pos.x - a.pos.x, dz = t.pos.z - a.pos.z, d = Math.hypot(dx, dz) || 0.01, reach = a.sp.reach * a.scale + t.rad;
  if (d > reach) { a.move(dx / d, dz / d, a.swimming ? a.sp.swim * 1.15 : a.sp.run * 1.1, dt); a.pose = a.swimming ? 'swim' : 'move'; return; }
  a.move(dx / d, dz / d, Math.min(a.sp.run, (t.speed || 0) + 1), dt); a.pose = 'move';
  if (a.atkCD <= 0) { a.anim.atk = 0.45; a.atkCD = a.sp.atkCD; hurt(t, a.sp.dmg * a.scale * rr(0.85, 1.2), a); if (a.dCam < 60) AUD.at('bite', a.pos, 0.6); }
}
BRAIN.pack = function (a, dt) {
  if (a.pet && a.pet === P.a && a.state === 'fight') {
    const f = a.foe;
    if (!f || !f.alive || f === P.a || f.pet === P.a || dist2(f.pos, a.pos) > 45) { a.state = 'follow'; a.foe = null; return BRAIN.pred(a, dt); }
    packBite(a, f, dt); return;
  }
  const g = a.group;
  if (!g || a.isPartner || a.cub || a.stolenBy || a.state === 'fight' || a.state === 'flee') return BRAIN.pred(a, dt);
  const L = g.members[0];
  if (g.playerLed) {
    const p = P.a; if (!p || !p.alive) return BRAIN.pred(a, dt);
    const t = P.packT > 0 && P.packTarget && P.packTarget.alive ? P.packTarget : null;
    if (t) { packBite(a, t, dt); return; }
    const ang = (a.slot / g.members.length) * TAU + 0.6, back = p.yaw + Math.PI, r = 2.4 + (a.slot % 2) * 1.4;
    const x = p.pos.x + Math.sin(back) * 2 + Math.cos(ang) * r, z = p.pos.z + Math.cos(back) * 2 + Math.sin(ang) * r;
    const d = Math.hypot(x - a.pos.x, z - a.pos.z);
    if (d > 55) { a.pos.set(x, 0, z); a.ground(1, true); }
    packMove(a, x, z, d > 6 ? a.sp.run : Math.max(a.sp.walk, (p.speed || 0) * 1.1), dt);
    if (p.sleeping || P.resting) { a.pose = 'lie'; }
    return;
  }
  if (g.state === 'hunt' && g.target) {
    const t = g.target;
    if (!t.alive) { packMove(a, t.pos.x + Math.cos(a.slot * 1.3) * 1.2, t.pos.z + Math.sin(a.slot * 1.3) * 1.2, a.sp.run, dt); return; }
    if (g.phase === 'surround') {
      const base = Math.atan2(L.pos.z - t.pos.z, L.pos.x - t.pos.x), ang = base + (a.slot / g.members.length) * TAU;
      packMove(a, t.pos.x + Math.cos(ang) * 5, t.pos.z + Math.sin(ang) * 5, a.sp.walk * 1.8, dt, true); return;
    }
    packBite(a, t, dt); return;
  }
  if (g.state === 'eat' && g.target && !g.target.gone) {
    const c = g.target, d = packMove(a, c.pos.x + Math.cos(a.slot * 1.3) * 1.1, c.pos.z + Math.sin(a.slot * 1.3) * 1.1, a.sp.walk * 1.3, dt);
    if (d < 1.2) { a.pose = 'eat'; c.food -= dt * 0.35; } return;
  }
  if (g.state === 'rest' || isNight()) { if (a !== L) packMove(a, L.pos.x + Math.cos(a.slot * 1.7) * 1.6, L.pos.z + Math.sin(a.slot * 1.7) * 1.6, a.sp.walk, dt); else a.move(0, 0, 0, dt); a.pose = 'lie'; return; }
  if (a === L) { if (g.goal) packMove(a, g.goal.x, g.goal.z, a.sp.walk, dt); return; }
  const ang = L.yaw + Math.PI + (a.slot % 2 ? 0.7 : -0.7), r = 2 + a.slot * 0.8;
  const x = L.pos.x + Math.sin(ang) * r, z = L.pos.z + Math.cos(ang) * r, d = Math.hypot(x - a.pos.x, z - a.pos.z);
  packMove(a, x, z, d > 5 ? a.sp.run * 0.7 : a.sp.walk * 1.1, dt);
};
function updatePack(g, dt) {
  g.members = g.members.filter(m => m.alive && !m.gone); if (!g.members.length) return;
  if (g.playerLed) { if (P.packT > 0) { P.packT -= dt; if (P.packTarget && !P.packTarget.alive && P.packTarget.food > 1) { PROG.flags.packhunt = 1; P.packT = 0; } } return; }
  const L = g.members[0]; g.t -= dt; g.think -= dt;
  if (g.state === 'hunt') {
    const t = g.target; g.huntT += dt;
    if (!t || t.gone) { g.state = 'roam'; g.target = null; g.t = rr(20, 40); return; }
    if (!t.alive) { g.state = 'eat'; g.t = 35; if (nearPlayer(t.pos, 70)) UI.notify(`להקת כלבי היער הפילה ${t.isPlayer ? 'אותך' : t.sp.he}`, t.isPlayer ? 'bad' : ''); return; }
    if (g.huntT > 45 || dist2(t.pos, L.pos) > 85) { g.state = 'roam'; g.target = null; g.t = rr(30, 60); return; }
    if (g.members.filter(m => m.hp < m.maxHp * 0.35).length >= Math.ceil(g.members.length / 2)) {
      for (const m of g.members) { m.state = 'flee'; m.threat = t; } g.state = 'roam'; g.target = null; g.t = 50;
      if (nearPlayer(L.pos, 70)) UI.notify(t.isPlayer ? 'להקת כלבי היער נסוגה ממך!' : `ה${t.sp.he} הדף את להקת כלבי היער`, t.isPlayer ? 'good' : '');
      return;
    }
    if (g.phase === 'surround' && (g.huntT > 2.5 || t.state === 'flee' || t.state === 'fight' || (t.isPlayer && P.noise > 0.75))) { g.phase = 'attack'; AUD.at('whistle', L.pos, 1.1); }
    return;
  }
  if (g.state === 'eat') { if (!g.target || g.target.gone || g.target.food <= 1 || g.t <= 0) { g.state = 'rest'; g.t = rr(25, 50); g.target = null; } return; }
  if (g.state === 'rest') { if (g.t <= 0) g.state = 'roam'; return; }
  if (g.think <= 0) {
    g.think = rr(1.5, 3); g.hunger += 3;
    if (g.hunger > 45 && !isNight()) {
      const t = packPrey(L);
      if (t) {
        g.state = 'hunt'; g.target = t; g.phase = 'surround'; g.huntT = 0; g.hunger = 0; AUD.at('whistle', L.pos, 0.9);
        if (t.isPlayer) { UI.notify('להקת כלבי יער מקיפה אותך! לברוח או להילחם', 'bad'); P.pings.push({ x: L.pos.x, z: L.pos.z, t: 10 }); }
        else if (nearPlayer(t.pos, 70)) UI.notify(`להקת כלבי יער מקיפה ${t.sp.he}`);
      }
    }
  }
  if (!g.goal || g.t <= 0 || Math.hypot(g.goal.x - L.pos.x, g.goal.z - L.pos.z) < 4) {
    for (let k = 0; k < 10; k++) { const B = landBox(g.sp), x = clamp(L.pos.x + rr(-80, 80), B[0], B[1]), z = clamp(L.pos.z + rr(-80, 80), B[2], B[3]); if (waterDepth(x, z) === 0 && getNY(x, z) > 0.8) { g.goal = { x, z }; break; } }
    g.t = rr(20, 40);
  }
}

// ---------- groups meet: clashes, howling contests and mobbing ----------
const CLASH = { t: 3 };
function clashUpdate(dt) {
  CLASH.t -= dt; if (CLASH.t > 0 || G.mode === 'menu') return; CLASH.t = 2;
  const live = g => g.members && g.members.length && g.members[0].alive && !g.playerLed;
  for (let i = 0; i < GROUPS.length; i++) {
    const A = GROUPS[i]; if (!live(A) || (A.clashCD || 0) > G.t) continue;
    const a0 = A.members[0];
    if ((a0.spId === 'otter' || a0.spId === 'coati' || a0.spId === 'peccary') && A.members.length >= 3) {
      const foeSp = a0.spId === 'otter' ? 'caiman' : a0.spId === 'coati' ? 'ocelot' : 'bushdog';
      let foe = null; shQuery(a0.pos.x, a0.pos.z, 16, b => { if (!foe && b.alive && b.spId === foeSp && !b.isPlayer && !b.legend) foe = b; });
      if (foe) {
        A.clashCD = G.t + 60;
        for (const m of A.members) if (m.alive && !m.young) { m.state = 'fight'; m.foe = foe; }
        if (nearPlayer(a0.pos, 80)) { UI.notify(a0.spId === 'otter' ? 'משפחת לוטרות ענק מתנפלת על קיימן!' : a0.spId === 'coati' ? 'להקת קואטי מתנפלת על אוצלוט!' : 'עדר פקארים מסתער על להקת כלבי יער!'); P.pings.push({ x: foe.pos.x, z: foe.pos.z, t: 8 }); }
        continue;
      }
    }
    for (let j = i + 1; j < GROUPS.length; j++) {
      const B = GROUPS[j]; if (!live(B) || (B.clashCD || 0) > G.t || A.kind !== B.kind) continue;
      const b0 = B.members[0]; if (b0.spId !== a0.spId) continue;
      if (dist2(a0.pos, b0.pos) > (A.kind === 'troop' ? 55 : 28)) continue;
      startClash(A, B); break;
    }
  }
}
function startClash(A, B) {
  A.clashCD = B.clashCD = G.t + 150;
  const sp = A.members[0].spId, sum = g => g.members.reduce((s, m) => s + (m.alive ? m.hp : 0), 0);
  const loser = sum(A) < sum(B) ? A : B, winner = loser === A ? B : A, w0 = winner.members[0], l0 = loser.members[0];
  const near = nearPlayer(w0.pos, 90), name = PACKN[sp] || `קבוצות של ${A.members[0].sp.he}`;
  if (A.kind === 'troop') {
    AUD.at(sp === 'howler' ? 'howler' : 'screech', w0.pos, 1.3); setTimeout(() => AUD.at(sp === 'howler' ? 'howler' : 'screech', l0.pos, 1.2), 900);
    const c = pickCrownNear(l0.pos.x + (l0.pos.x - w0.pos.x) * 2, l0.pos.z + (l0.pos.z - w0.pos.z) * 2, 70, false); if (c) { loser.crown = c; loser.t = 0; }
    if (near) UI.notify(`שתי ${name} מתחרות בצעקות על השטח`);
    return;
  }
  if (sp === 'capybara') { for (const m of loser.members) if (m.alive) { m.state = 'flee'; m.threat = w0; } if (near) UI.notify('עדר קפיברות גדול דוחק עדר קטן ממנו'); return; }
  const fighters = g => g.members.filter(m => m.alive && !m.young);
  for (const m of fighters(A)) { const f = pick(fighters(B)); if (f) { m.state = 'fight'; m.foe = f; m.stT = 0; } }
  for (const m of fighters(B)) { const f = pick(fighters(A)); if (f) { m.state = 'fight'; m.foe = f; m.stT = 0; } }
  setTimeout(() => {
    for (const m of loser.members) if (m.alive && m.state === 'fight') { m.state = 'flee'; m.threat = winner.members.find(x => x.alive) || m; }
    for (const m of winner.members) if (m.alive && m.state === 'fight' && m.foe && m.foe.group === loser) { m.state = 'idle'; m.foe = null; }
    if (nearPlayer(w0.pos, 90)) UI.notify('הקבוצה החזקה ניצחה, והשנייה נסוגה');
  }, 6500);
  if (near) { UI.notify(`שני ${name} מתנגשים על השטח!`); P.pings.push({ x: w0.pos.x, z: w0.pos.z, t: 8 }); }
}

// ---------- easier travel: a target on the map, an arrow, and walking there by itself ----------
const WAY = { p: null, auto: false, run: false, label: '', el: null };
function setWay(x, z, auto, label) {
  WAY.p = { x, z }; WAY.auto = !!auto; WAY.label = label || 'היעד';
  UI.notify(auto ? `בדרך ל${WAY.label}. נגיעה בג׳ויסטיק עוצרת` : 'יעד סומן במפה. החץ למעלה מראה את הכיוון', 'good');
}
function clearWay(msg) { WAY.p = null; WAY.auto = false; if (msg) UI.notify(msg, 'good'); if (WAY.el) WAY.el.hidden = true; }
function wayOnBigMap(c, m) {
  if (!WAY.p) return; const [x, y] = m(WAY.p.x, WAY.p.z);
  c.fillStyle = '#5ab4ff'; c.beginPath(); c.moveTo(x, y - 12); c.lineTo(x + 9, y); c.lineTo(x, y + 12); c.lineTo(x - 9, y); c.closePath(); c.fill(); c.lineWidth = 2.5; c.strokeStyle = '#0d2a40'; c.stroke();
}
function wayMapSetup() {
  const cv = document.getElementById('bigmap'); if (!cv || cv.dataset.way) return; cv.dataset.way = 1;
  cv.style.cursor = 'crosshair';
  cv.insertAdjacentHTML('afterend', '<p class="idim" style="text-align:center;margin:6px 0 0">נגיעה במפה מסמנת יעד</p><div class="btns" id="wayBtns" hidden><button class="btn pri" id="wayGo">ללכת לשם</button><button class="btn" id="wayClr">לבטל יעד</button></div>');
  cv.addEventListener('click', e => {
    if (G.mode !== 'play') return;
    const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * W.size - W.half, z = (e.clientY - r.top) / r.height * W.size - W.half;
    WAY.p = { x: clamp(x, -LIMIT, LIMIT), z: clamp(z, -LIMIT, LIMIT) }; WAY.auto = false; WAY.label = 'היעד';
    UI.drawBigMap(); document.getElementById('wayBtns').hidden = false;
  });
  document.getElementById('wayGo').addEventListener('click', () => { if (WAY.p) { setWay(WAY.p.x, WAY.p.z, true, 'היעד'); UI.close(); } });
  document.getElementById('wayClr').addEventListener('click', () => { clearWay(); UI.drawBigMap(); document.getElementById('wayBtns').hidden = true; });
}
function wayUpdate(dt) {
  if (!WAY.el) {
    WAY.el = document.createElement('div'); WAY.el.id = 'wayArrow'; WAY.el.hidden = true;
    WAY.el.innerHTML = '<svg viewBox="0 0 24 24" width="30" height="30"><path d="M12 2l7 18-7-4-7 4z" fill="#5ab4ff" stroke="#0d2a40" stroke-width="1.5" stroke-linejoin="round"/></svg><span></span>';
    WAY.el.style.cssText = 'position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 98px);transform:translateX(-50%);z-index:12;pointer-events:none;display:flex;flex-direction:column;align-items:center;gap:1px;font:600 12px Rubik,sans-serif;color:#eaf6ff;text-shadow:0 1px 3px rgba(0,0,0,.8)';
    document.body.appendChild(WAY.el); wayMapSetup();
  }
  const a = P.a;
  if (!WAY.p || G.mode !== 'play' || !a || !a.alive) { WAY.el.hidden = true; return; }
  const dx = WAY.p.x - a.pos.x, dz = WAY.p.z - a.pos.z, d = Math.hypot(dx, dz), bearing = Math.atan2(dx, dz);
  if (d < 7) { clearWay(`הגעת ל${WAY.label}`); return; }
  WAY.el.hidden = false; WAY.el.firstChild.style.transform = `rotate(${(-angDiff(CAM.yaw, bearing)).toFixed(3)}rad)`;
  WAY.el.lastChild.textContent = `${Math.round(d)} מ׳${WAY.auto ? ' · בדרך' : ''}`;
  if (WAY.auto) {
    const manual = INPUT.joy || KEYS.KeyW || KEYS.KeyA || KEYS.KeyS || KEYS.KeyD || KEYS.ArrowUp || KEYS.ArrowDown || KEYS.ArrowLeft || KEYS.ArrowRight;
    if (manual || P.coil || HUNT.net || (P.a.lastHitT && G.t - P.a.lastHitT < 0.5)) { WAY.auto = false; UI.notify('ההליכה האוטומטית נעצרה'); return; }
    CAM.yaw += angDiff(CAM.yaw, bearing) * Math.min(1, dt * 2.5);
    if (P.bird) CAM.pitch += (0.26 - CAM.pitch) * Math.min(1, dt * 2);
    WAY.run = d > 35 && P.stam > 25;
  }
}
function packsUpdate(dt) { clashUpdate(dt); wayUpdate(dt); }

// ================= MORE MONKEYS, LLAMAS & ALPACAS, AND THE HUNTERS' CATTLE =================
SPECIES.capuchin = { he: 'קוף קפוצ׳ין', lat: 'Cebus capucinus', kind: 'quad', ai: 'herb', hp: 22, dmg: 5, walk: 1.6, run: 7.5, swim: 1, reach: 0.9, atkCD: 0.5, sense: 30, safe: 40, food: 8, turn: 9,
  count: 14, group: [5, 7], hab: 'forest', size: [0.9, 1.1], danger: 0, herd: true, fight: 0.6, diet: 'פירות, חרקים וביצים',
  guide: 'קוף חכם וסקרן שמחפש אוכל גם על הקרקע. להקות קפוצ׳ין צועקות אזעקה כשהן רואות טורף, ולפעמים מתנפלות עליו יחד.' };
SPECIES.llama = { he: 'למה', lat: 'Lama glama', kind: 'quad', ai: 'herb', hp: 90, dmg: 8, walk: 1.5, run: 8, swim: 1.5, reach: 1.3, atkCD: 1, sense: 32, safe: 55, food: 70, turn: 5,
  count: 8, group: [2, 3], hab: 'open', size: [0.95, 1.08], danger: 1, herd: true, fight: 0.8, diet: 'עשב', tpls: ['llama', 'llama2'],
  guide: 'בהמה גבוהה עם צוואר ארוך שמגינה על העדר. כשטורף מתקרב הלמה מתייצבת מולו, בועטת, ויורקת עליו.' };
SPECIES.alpaca = { he: 'אלפקה', lat: 'Vicugna pacos', kind: 'quad', ai: 'herb', hp: 45, dmg: 4, walk: 1.4, run: 7, swim: 1.2, reach: 1, atkCD: 1, sense: 28, safe: 50, food: 40, turn: 6,
  count: 0, group: [1, 1], hab: 'open', size: [0.92, 1.06], danger: 0, diet: 'עשב', tpls: ['alpaca', 'alpaca2', 'alpaca3'],
  guide: 'קרובה קטנה ופרוותית של הלמה. האלפקות חיות בעדר יחד עם למות שמגינות עליהן, ובורחות יחד כשמגיע טורף.' };
SPECIES.cow = { he: 'פרה', lat: 'Bos taurus', kind: 'quad', ai: 'herb', hp: 120, dmg: 9, walk: 1.2, run: 6.5, swim: 1.2, reach: 1.4, atkCD: 1.2, sense: 22, safe: 40, food: 110, turn: 4,
  count: 0, group: [1, 1], hab: 'open', size: [0.95, 1.08], danger: 0, diet: 'עשב', tpls: ['cow', 'cow2', 'cow3'],
  guide: 'בקר שהציידים מגדלים ליד המחנה. הפרות רועות קרוב לאוהלים, והציידים מגינים עליהן. יגוארים ופומות מנסים לפעמים לטרוף אותן.' };
for (const id of ['capuchin', 'llama', 'alpaca', 'cow']) if (!GUIDE_ORDER.includes(id)) GUIDE_ORDER.push(id);
SPECIES.howler.count = 22; SPECIES.squirrel.count = 24;
for (const [p, list] of [['jaguar', ['cow', 'llama', 'alpaca', 'capuchin']], ['puma', ['cow', 'llama', 'alpaca']], ['ocelot', ['capuchin']], ['harpy', ['capuchin']], ['bushdog', ['alpaca']]])
  if (SPECIES[p] && SPECIES[p].prey) for (const q of list) if (!SPECIES[p].prey.includes(q)) SPECIES[p].prey.push(q);
SENTRY.capuchin = 'screech'; SENTRYN.capuchin = 'הקפוצ׳ינים';
PACKN.capuchin = 'להקות קפוצ׳ין'; PACKN.llama = 'עדרי למות';
CTXT.milk = ['drop', 'לחלוב', 'לחלוב את הפרה'];
MISSIONS.hunter.splice(MISSIONS.hunter.findIndex(m => m.id === 'hunter.wood') + 1, 0, MS('hunter.milk', 'לחלוב פרה במחנה', 30, FL('milk')));
for (const m of MISSIONS.hunter) GOAL[m.id] = m;

function buildHerdTpls() {
  if (TPL.llama) return;
  const T = TPL.tapir.o;
  const camel = c => buildQuad(Object.assign({}, T, { L: 0.82, chestR: 0.27, hipR: 0.26, wid: 0.8, legLen: 0.66, legR: 0.055, pawR: 0.05, neckLen: 0.55, neckR: 0.1, neckUp: 0.92, headR: 0.11, snoutLen: 0.12, snoutR: 0.065, ear: 'point', earR: 0.055, tailLen: 0.1, tailR: 0.05, tailN: 1, c }));
  TPL.llama = camel({ fur: '#e9e2d3', belly: '#ddd3c0', nose: '#3a2e26', eye: '#120e0c', ear: '#cfc4ae' });
  TPL.llama2 = camel({ fur: '#7a5236', belly: '#6a4630', nose: '#2a1e18', eye: '#120e0c', ear: '#5a3a26' });
  const alp = c => buildQuad(Object.assign({}, T, { L: 0.62, chestR: 0.25, hipR: 0.25, wid: 0.84, legLen: 0.44, legR: 0.05, pawR: 0.045, neckLen: 0.38, neckR: 0.11, neckUp: 0.9, headR: 0.1, snoutLen: 0.07, snoutR: 0.06, ear: 'point', earR: 0.045, tailLen: 0.08, tailR: 0.05, tailN: 1, c }));
  TPL.alpaca = alp({ fur: '#f1ead8', belly: '#e8dfcb', nose: '#4a3a30', eye: '#120e0c', ear: '#e0d6c0' });
  TPL.alpaca2 = alp({ fur: '#b98d5f', belly: '#a77d52', nose: '#3a2a20', eye: '#120e0c', ear: '#9a7048' });
  TPL.alpaca3 = alp({ fur: '#3a3330', belly: '#2e2826', nose: '#1a1412', eye: '#120e0c', ear: '#2a2422' });
  const cow = c => buildQuad(Object.assign({}, T, { L: 1.1, chestR: 0.36, hipR: 0.34, wid: 0.78, legLen: 0.58, legR: 0.075, pawR: 0.07, neckLen: 0.24, neckR: 0.2, neckUp: 0.18, headR: 0.15, snoutLen: 0.2, snoutR: 0.12, ear: 'round', earR: 0.06, tailLen: 0.62, tailR: 0.022, tailN: 3, c }));
  TPL.cow = cow({ fur: '#7a4a2a', belly: '#6a3e22', nose: '#d9a89a', eye: '#120e0c', ear: '#6a3e22' });
  TPL.cow2 = cow({ fur: '#dcd6ca', belly: '#cfc8ba', nose: '#3a3230', eye: '#120e0c', ear: '#bdb5a6' });
  TPL.cow3 = cow({ fur: '#26221f', belly: '#1f1b19', nose: '#c99a8c', eye: '#120e0c', ear: '#1f1b19' });
  const H = TPL.howler.o;
  TPL.capuchin = buildQuad(Object.assign({}, H, { L: 0.32, chestR: 0.13, hipR: 0.11, headR: 0.09, tailLen: 0.5, c: Object.assign({}, H.c, { fur: '#1f1a17', belly: '#e6d8bf', head: '#e6d8bf', snout: '#d9b99a', nose: '#c08c74' }) }));
}
// open ground: the plateau top or a clearing far from the camps
function openSpot(tries, tepui) {
  let best = null, bs = -1e9;
  for (let i = 0; i < tries; i++) {
    let x, z;
    if (tepui) { const ang = rng() * TAU, d = rng() * TEP.r * 0.65; x = TEP.x + Math.cos(ang) * d; z = TEP.z + Math.sin(ang) * d; }
    else { x = rr(-JL + 35, JL - 35); z = rr(-JL + 35, JL - 35); }
    if (!inBounds(x, z) || waterDepth(x, z) > 0 || getNY(x, z) < 0.9) continue;
    if (HUNT.camps.some(c => Math.hypot(c.x - x, c.z - z) < 70)) continue;
    const s = (1 - gridAt(FOREST, x, z)) * 30 + rng() * 5;
    if (s > bs) { bs = s; best = { x, z }; }
  }
  return best;
}
function spawnCamelids(n, okFar) {
  buildHerdTpls();
  const c = openSpot(60, rng() < 0.5); if (!c || !okFar(c)) return n;
  const grp = { kind: 'herd', members: [], leader: null }; GROUPS.push(grp);
  const na = 2 + (rng() * 3 | 0);
  for (let i = 0; i < n + na; i++) {
    const a = new Animal(i < n ? 'llama' : 'alpaca', c.x + rr(-5, 5), c.z + rr(-5, 5), { group: grp });
    a.ground(1, true); grp.members.push(a); if (!grp.leader) grp.leader = a;
  }
  return n;
}
function addCow(camp, grp) {
  const ang = rng() * TAU, d = rr(9, 15); let x = camp.x + Math.cos(ang) * d, z = camp.z + Math.sin(ang) * d;
  if (waterDepth(x, z) > 0) { x = camp.x + Math.cos(ang) * 6; z = camp.z + Math.sin(ang) * 6; }
  if (campLand(camp)) buildLandTpls();
  const st = stockOf(camp, grp); if (st) owFarmTpls();
  const a = new Animal(st || LIVESTOCK[campLand(camp)] || 'cow', x, z, { group: grp }); a.ground(1, true); a.home.set(camp.x, 0, camp.z); a.leash = st ? 20 : 16; a.cowCamp = camp;
  grp.members.push(a); if (!grp.leader) grp.leader = a; return a;
}
function spawnCows() {
  buildHerdTpls();
  for (const c of HUNT.camps) campCattle(c);
}
// a camp's cattle (the Old World's towns get theirs when they wake: nobody needs them before that)
function campCattle(c) {
  if (c.cowGroup || c.dormant) return;
  const grp = { kind: 'herd', members: [], leader: null, cows: c }; GROUPS.push(grp); c.cowGroup = grp; const n = c.civ ? cowCap(c) : 3 + (rng() * 2 | 0); for (let i = 0; i < n; i++) addCow(c, grp);
}
// the hunters protect their cattle
function cowAttacked(t, src) {
  if (!src || src === t || src.hunter || (src.isPlayer && P.human)) return;
  if (src.isPlayer) { if (!(HUNT.angry > 20)) UI.notify('תקפת פרה של הציידים! הם כועסים ויוצאים להגן עליה', 'bad'); HUNT.angry = 60; HUNT.angryWhy = 'כי תקפת פרה שלהם'; return; }
  for (const c of HUNT.camps) for (const h of c.hunters || []) if (h.alive && !h.fleeing && dist2(h.pos, t.pos) < 60 && !(h.windup > 0) && !((h.spearCD || 0) > 0)) hunterThrow(h, src, 'spear');
  if (P.human && P.a && dist2(P.a.pos, t.pos) < 140 && G.t - (t.warnT || -99) > 20) { t.warnT = G.t; UI.notify(`${src.sp.he} תוקף את הפרות במחנה!`, 'bad'); P.pings.push({ x: t.pos.x, z: t.pos.z, t: 10 }); }
}
function milkCow() {
  const c = CAMPH.cow; if (!c || !c.alive) return;
  c.milkDay = G.day; P.food = Math.min(100, P.food + 14); P.water = Math.min(100, P.water + 12); PROG.flags.milk = 1;
  UI.notify('חלבת את הפרה. אפשר לחלוב כל פרה פעם ביום', 'good'); AUD.play('eat', 0.7);
}
// llamas spit at whatever they are fighting
function spitFx() {
  let el = document.getElementById('spitFx');
  if (!el) { el = document.createElement('div'); el.id = 'spitFx'; el.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:11;opacity:0;background:radial-gradient(circle at 42% 46%,rgba(196,218,168,.62),rgba(176,204,146,.28) 32%,transparent 58%),radial-gradient(circle at 66% 60%,rgba(206,224,176,.5),transparent 28%)'; document.body.appendChild(el); }
  el.style.transition = 'none'; el.style.opacity = 1; requestAnimationFrame(() => requestAnimationFrame(() => { el.style.transition = 'opacity 1.8s'; el.style.opacity = 0; }));
}
const HERDS = { t: 0, day: -1 };
function herdsUpdate(dt) {
  if (G.mode === 'menu') return;
  HERDS.t -= dt; if (HERDS.t > 0) return; HERDS.t = 0.3;
  for (const g of GROUPS) {
    if (g.kind !== 'herd' || !g.members.length) continue;
    for (const m of g.members) {
      if (m.spId !== 'llama' || !m.alive || m.state !== 'fight' || !m.foe || !m.foe.alive) continue;
      m.spitCD = (m.spitCD ?? rr(0, 1.5)) - 0.3; if (m.spitCD > 0) continue;
      const f = m.foe, d = dist2(m.pos, f.pos); if (d > 5.5) continue;
      m.spitCD = rr(4, 7); m.anim.atk = 0.4;
      if (m.dCam < 50) { FX.spawn('splash', f.pos.x, f.pos.y + f.height * 0.8, f.pos.z, 6); AUD.at('clack', m.pos, 0.5); }
      if (f.isPlayer) { P.stun = Math.max(P.stun, 0.6); spitFx(); combatText('למה ירקה עליך!', 'bad'); }
      else if (f.tpl.kind === 'quad' && !f.hunter) threatReact(f, m, true);
    }
  }
  if (HERDS.day !== G.day) {
    if (HERDS.day >= 0) for (const c of HUNT.camps) { const g = c.cowGroup; if (!c.gone && !c.own && g && g.members.filter(m => m.alive).length < cowCap(c)) addCow(c, g); }
    if (HERDS.day >= 0) campsRefill();
    HERDS.day = G.day;
  }
}

// ================= THREE SPECIAL ANIMALS AND A NEW LEGEND =================
const canDive = () => ['caiman', 'capybara', 'otter', 'anaconda', 'hunter'].includes(P.spId);
// ---------- giant otter: a family that swims, fishes and fights with you ----------
Object.assign(SPECIES.otter, { prey: ['pacu', 'piranha', 'frog', 'agouti'] });
SPECIES.otter.pl = { desc: 'לוטרה ענקית שחיה עם משפחה. שוחה מהר מכל יונק, צוללת לדוג, והמשפחה תוקפת יחד איתך.', stats: [2, 3, 3, 5], risk: 'סכנות: יגוארים על החוף, אנקונדות וקיימנים גדולים.',
  role: 'משפחה של שחיינים: צוללים, דגים, ותוקפים יחד אפילו קיימנים.', pros: ['השחיין המהיר ביותר מבין היונקים', 'צוללת ודגה מתחת למים', 'משפחה של שלוש שתוקפת איתך', 'מבריחה קיימנים בהתקפה משותפת'],
  over: { hp: 70, dmg: 10, swim: 7, run: 7.5 } };
// ---------- anaconda: ambush from the water and squeeze ----------
SPECIES.anaconda.pl = { desc: 'הנחש הכבד בעולם. איטי על היבשה, שקט במים, ומי שהוא תופס לא משתחרר בקלות.', stats: [5, 1, 4, 4], risk: 'סכנות: יגוארים, וציידים שרוצים את העור שלך.',
  role: 'צייד מארב: מחכים מתחת למים, תופסים, ומתלפפים עד שהטרף נכנע.', pros: ['ליפוף שמחזיק ומחליש כל טרף', 'בלתי נראה כשהוא צולל', 'עור עבה וחזק', 'צד אפילו קיימנים ויגוארים'],
  over: { hp: 170, dmg: 14, walk: 1.4, run: 3.6, swim: 3.2 } };
// ---------- poison dart frog: tiny, toxic, and a great jumper ----------
SPECIES.frog.pl = { desc: 'צפרדע זעירה בצבעי אזהרה. הרעל שבעור שלה הופך כל טורף שנוגס בה לחולה, והיא קופצת רחוק פי עשרות מגודלה.', stats: [1, 3, 5, 3], risk: 'סכנות: נחשים ועופות שלא מכירים את הרעל, ויובש.',
  role: 'קטנה ורעילה: צדים חרקים, קופצים רחוק, וכל מי שנוגס בך מצטער.', pros: ['טורף שנוגס בך מורעל ובורח', 'קפיצות ענק', 'כמעט בלתי נראית', 'אוכל בכל מקום: חרקים'],
  over: { hp: 18, dmg: 1, walk: 1.1, run: 3.4, jump: 6.5 } };
for (const [after, id] of [['capybara', 'otter'], ['caiman', 'anaconda'], ['eel', 'frog']]) if (!PLAYABLE.includes(id)) PLAYABLE.splice(PLAYABLE.indexOf(after) + 1, 0, id);
Object.assign(MTITLE, { otter: 'לוטרת הענק', anaconda: 'האנקונדה', frog: 'צפרדע החץ' });
CARRYMAX.otter = 30;
MISSIONS.otter = [MS('otter.swim', 'לשחות בנהר', 20, FL('swim')), MS('otter.dive', 'לצלול מתחת לפני המים', 30, FL('dive')), MS('otter.fish', 'לדוג דג מתחת למים', 50, KBA(['pacu', 'piranha'])),
  MS('otter.pack', 'לתקוף יחד עם המשפחה', 50, FL('packhunt')), MS('otter.fish5', 'לדוג חמישה דגים', 80, KBA(['pacu', 'piranha'], 5)), MS('otter.caiman', 'להבריח קיימן עם המשפחה', 120, FL('otterCaiman')),
  mateM('otter'), MS('otter.young', 'להביא גורים לעולם', 80, () => P.cubs.length > 0 || P.raised > 0), raiseM('otter'), ...tailM('otter')];
MISSIONS.anaconda = [MS('anaconda.dive', 'לצלול ולארוב מתחת למים', 30, FL('dive')), MS('anaconda.squeeze', 'להתלפף על טרף עד שייכנע', 60, FL('squeeze')), MS('anaconda.capy', 'לצוד קפיברה שבאה לשתות', 60, KB('capybara')),
  MS('anaconda.big', 'להכניע טורף גדול: יגואר, פומה או קיימן', 150, KBA(['jaguar', 'puma', 'caiman'])), MS('anaconda.hunt5', 'לצוד חמישה טרפים', 80, () => P.kills >= 5), mateM('anaconda'),
  MS('anaconda.young', 'להביא צאצאים לעולם', 80, () => P.cubs.length > 0 || P.raised > 0), raiseM('anaconda'), ...tailM('anaconda')];
MISSIONS.frog = [MS('frog.bugs', 'לצוד חרקים', 20, FL('bugs')), MS('frog.leap', 'לקפוץ קפיצת ענק', 20, FL('frogLeap')), MS('frog.swim', 'לשחות בנחל', 20, FL('swim')), MS('frog.rain', 'להירטב בגשם', 30, FL('rainWet')),
  MS('frog.toxic', 'להרעיל טורף שניסה לטרוף אותך', 80, FL('toxic')), mateM('frog'), MS('frog.young', 'להטיל ביצים ולבקוע ראשנים', 80, () => P.cubs.length > 0 || P.raised > 0),
  MS('frog.day5', 'לשרוד חמישה ימים', 120, () => G.day >= 5), raiseM('frog'), ...tailM('frog')];
MISSIONS.caiman.splice(MISSIONS.caiman.findIndex(m => m.id === 'caiman.legend') + 1, 0, MS('caiman.scar', 'להביס את צלקת, הקיימן השחור', 300, FL('legend_scar')));
for (const sp of ['otter', 'anaconda', 'frog', 'caiman']) for (const m of MISSIONS[sp]) GOAL[m.id] = m;
CTXT.bugs = ['leaf', 'חרקים', 'להחזיק כדי לצוד חרקים'];

// constriction
const SQZ = { t: null, time: 0 };
function sqzAttack() {
  if (P.spId !== 'anaconda') return false;
  if (SQZ.t) { const t = SQZ.t; hurt(t, 6, P.a); P.a.anim.atk = 0.4; combatText('לחיצה!', 'good'); P.atkCD = 0.35; return true; }
  const t = findAttackTarget(); const a = P.a;
  if (!t || t.tpl.kind !== 'quad' || dist2(t.pos, a.pos) > (P.sp.reach || 3) * a.scale + t.rad || t.isPartner || t.cub || t.legend) return false;
  SQZ.t = t; SQZ.time = 0; P.squeeze = true; t.state = 'held'; P.atkCD = 0.4; a.anim.atk = 0.5;
  combatText('התלפפת!', 'crit'); AUD.play('hiss', 0.8); PROG.flags.squeeze = 1;
  UI.notify(TOUCH ? 'מתלפפים: הקשות על תקיפה לוחצות חזק יותר, וקפיצה משחררת' : 'מתלפפים: קליקים לוחצים חזק יותר, ורווח משחרר', 'good');
  return true;
}
function sqzEnd(why) {
  const t = SQZ.t; SQZ.t = null; P.squeeze = false;
  if (t && t.alive) { t.stunT = 0.6; t.state = 'flee'; t.threat = P.a; }
  if (why === 'escape') combatText(t ? `ה${t.sp.he} השתחרר!` : 'הטרף השתחרר', 'bad');
}
function sqzUpdate(dt) {
  const t = SQZ.t; if (!t) return;
  const a = P.a;
  if (!a || !a.alive || G.mode !== 'play') { sqzEnd(); return; }
  if (!t.alive) { sqzEnd(); combatText(`ה${t.sp.he} נכנע`, 'crit'); return; }
  SQZ.time += dt; t.stunT = 0.3;
  const fx = Math.sin(a.yaw), fz = Math.cos(a.yaw); t.pos.x = a.pos.x + fx * (0.9 + t.rad); t.pos.z = a.pos.z + fz * (0.9 + t.rad);
  hurt(t, (8 + (P.sp.dmg || 10) * 0.6) * dt, a);
  const strong = t.maxHp > 140 || t.sp.ai === 'pred' || t.sp.ai === 'croc';
  if (strong && rng() < dt * 0.12 / ((P.growth || 1) ** 2) && SQZ.time > 2) sqzEnd('escape');
}
// the frog: toxic skin, insects, rain and big leaps
function frogToxic(t, src) {
  if (!src || src === t || src.tpl.kind === 'frog') return;
  src.poisonT = 7; if (!src.isPlayer && src.tpl.kind !== 'fish') threatReact(src, t, true);
  if (t.isPlayer) { PROG.flags.toxic = 1; combatText(`ה${src.sp.he} הורעל!`, 'crit'); }
}
function frogCtx() { return null; }
function bugsStep(dt) { P.eating = false; P.food = Math.min(100, P.food + dt * (isNight() ? 5 : 3.5)); PROG.flags.bugs = 1; P.a.anim.atk = (G.t % 0.7) < dt ? 0.3 : P.a.anim.atk; }
function specialUpdate(dt) {
  sqzUpdate(dt); scarUpdate(dt);
  for (const b of ANIMALS) if (b.poisonT > 0 && b.alive) { b.poisonT -= dt; hurt(b, 2.5 * dt, null); if (b.dCam < 30 && rng() < dt * 3) FX.spawn('poison', b.pos.x, b.pos.y + b.height, b.pos.z, 2); }
  const a = P.a; if (G.mode !== 'play' || !a || !a.alive) return;
  if (P.spId === 'frog') {
    if (a.swimming || G.rain > 0.3 || waterDepth(a.pos.x + 0.6, a.pos.z) > 0) P.water = Math.min(100, P.water + dt * 6);
    if (G.rain > 0.3) PROG.flags.rainWet = 1;
    if (a.airborne && (a.vy || 0) > 4) PROG.flags.frogLeap = 1;
  }
  if (P.spId === 'otter' && P.packTarget && P.packTarget.spId === 'caiman' && P.packTarget.state === 'flee') PROG.flags.otterCaiman = 1;
}

// ---------- the new legend: Scar, a giant black caiman of the river ----------
LEGENDS.push({ id: 'scar', sp: 'caiman', tpl: 'caimanBlack', name: 'צלקת', title: 'קיימן שחור ענק', f: false, scale: 1.7, hp: 2.8, dmg: 1.3, aggro: 14, roar: 'growl', where: 'במעלה הנהר' });
SKINS.caiman.black = { n: 'שחור', by: 'scar', tpl: 'caimanBlack' };
function buildCaimanBlack() {
  if (TPL.caimanBlack) return; const o = TPL.caiman.o;
  TPL.caimanBlack = buildQuad(Object.assign({}, o, { c: Object.assign({}, o.c, { fur: '#1b1d19', top: '#1b1d19', belly: '#5f5c48', eye: '#e8c23a' }) }));
}
function scarUpdate(dt) {
  const L = LEGENDS.find(l => l.id === 'scar'), a = L && L.a, p = P.a;
  if (!a || !a.alive || !p || !p.alive || G.mode !== 'play' || P.fish) { if (L && L.mk) L.mk.visible = false; return; }
  L.lungeT = (L.lungeT ?? 6) - dt;
  if (L.lunge) {
    const m = L.lunge; m.t -= dt; a.stunT = Math.max(a.stunT, 0.1); a.yaw += angDiff(a.yaw, Math.atan2(m.x - a.pos.x, m.z - a.pos.z)) * Math.min(1, dt * 6);
    const k = clamp(m.t / 1.1, 0, 1); L.mk.scale.setScalar(1.6 - 0.6 * (1 - k)); L.mk.rotation.y += dt * 2;
    if (m.t > 0) return;
    L.lunge = null; L.mk.visible = false;
    const dx = m.x - a.pos.x, dz = m.z - a.pos.z, d = Math.hypot(dx, dz) || 1; a.pos.x = m.x - dx / d * 1.3; a.pos.z = m.z - dz / d * 1.3;
    const w = waterAt(m.x, m.z); FX.spawn('splash', m.x, w > -900 ? w : getH(m.x, m.z), m.z, 18); AUD.at('splash', a.pos, 1.2); CAM.shake = Math.max(CAM.shake, 0.4);
    if (Math.hypot(p.pos.x - m.x, p.pos.z - m.z) < 2.3 && P.dodgeT <= 0) {
      hurt(p, a.sp.dmg * a.scale * 1.5, a); combatText('צלקת תפס אותך!', 'bad');
      if (p.swimming && !COMBAT.roll && !P.bird) startRoll(a);
    } else combatText('התחמקת מהזינוק!', 'good');
    return;
  }
  const d = dist2(a.pos, p.pos);
  if (L.lungeT <= 0 && d < 16 && d > 3 && !COMBAT.roll && !(P.bird && P.flying)) {
    L.lungeT = rr(6, 9);
    if (!L.mk) { L.mk = makeMarker(); for (const c of L.mk.children) c.material.color.set('#ff3b30'); scene.add(L.mk); }
    const w = waterAt(p.pos.x, p.pos.z), y = Math.max(getH(p.pos.x, p.pos.z), w > -900 ? w : -99) + 0.06;
    L.mk.position.set(p.pos.x, y, p.pos.z); L.mk.visible = true;
    L.lunge = { x: p.pos.x, z: p.pos.z, t: 1.1 };
    AUD.at('growl', a.pos, 1); combatText('צלקת מתכונן לזנק! לצאת מהטבעת', 'bad');
  }
}

// ================= LIFELONG GROWTH: caimans and anacondas never stop growing =================
// growth comes mostly from food, a little from every day survived, and slows as the body gets bigger:
// dS = food * 0.003 / S^1.8  → twice the size takes a few hours, a monster (x3) takes real dedication
const GROWERS = { caiman: 2.4, anaconda: 5.2 };
const GROW = { need: true, g0: null, lastFood: 0, mile: 0, acc: 0, scareT: 0 };
const MILES = [1.25, 1.5, 2, 2.5, 3, 4, 5];
const mileIdx = S => MILES.filter(m => S >= m).length;
const growTitle = S => S >= 4 ? 'אגדה חיה' : S >= 3 ? 'מפלצת' : S >= 2 ? 'ענק' : S >= 1.5 ? 'גדול' : 'צעיר';
for (const id in GROWERS) { const pl = SPECIES[id].pl; if (pl && pl.pros && !pl.pros.some(p => p.includes('כל החיים'))) pl.pros.push('גדל כל החיים: מי שמשקיע מגדל מפלצת'); }
for (const id in GROWERS) {
  const list = MISSIONS[id], at = list.findIndex(m => m.id === id + '.raise');
  list.splice(at < 0 ? list.length : at, 0, MS(id + '.grow2', 'לגדול לפי שניים מהגודל ההתחלתי', 200, () => (P.growth || 1) >= 2), MS(id + '.grow3', 'להפוך למפלצת: פי שלושה מהגודל ההתחלתי', 500, () => (P.growth || 1) >= 3));
  for (const m of list) GOAL[m.id] = m;
}
function growReset() { GROW.need = true; GROW.g0 = null; P.growth = 1; GROW.mile = 0; GROW.acc = 0; }
function applyGrowth() {
  const a = P.a, g = GROW.g0, S = P.growth || 1; if (!a || !g) return;
  const frac = a.maxHp > 0 ? a.hp / a.maxHp : 1;
  a.scale = g.scale * S; a.mesh.scale.setScalar(a.scale); a.rad = g.rad * S; a.height = g.height * S;
  if (P.spId === 'caiman') a.swimDepth = g.swimDepth * S;
  a.floatDepth = g.floatDepth * S;
  a.maxHp = g.maxHp * S ** 1.4; a.hp = clamp(frac, 0, 1) * a.maxHp; a.camSize = g.camSize * S ** 0.85;
}
function growText() {
  const S = P.growth || 1, next = MILES.find(m => m > S), L = GROWERS[P.spId];
  return `${(L * S).toFixed(1)} מ׳ · ${growTitle(S)}${next ? ` · הבא ב-${(L * next).toFixed(1)} מ׳` : ''}`;
}
function growUpdate(dt) {
  const a = P.a;
  if (!a || G.mode !== 'play' || !GROWERS[P.spId]) return;
  if (GROW.need) {
    GROW.need = false; P.growth = P.growth || 1;
    GROW.g0 = { scale: a.scale, rad: a.rad, height: a.height, swimDepth: a.swimDepth, floatDepth: a.floatDepth, maxHp: a.maxHp, camSize: a.camSize };
    GROW.lastFood = P.food; GROW.mile = mileIdx(P.growth); applyGrowth(); return;
  }
  if (!a.alive) return;
  let S = P.growth || 1;
  const df = P.food - GROW.lastFood;
  let dS = (df > 0 ? df * 0.003 : 0) / S ** 1.8 + dt * timeRate() / 24 * 0.03 / S ** 1.8;
  if (dS > 0) { P.growth = S + dS; GROW.acc += dS; if (GROW.acc > 0.004) { GROW.acc = 0; applyGrowth(); } }
  S = P.growth;
  P.food = Math.max(0, P.food - dt * 0.05 * (S ** 0.6 - 1)); GROW.lastFood = P.food;
  const mi = mileIdx(S);
  if (mi > GROW.mile) {
    GROW.mile = mi; applyGrowth();
    UI.big(S >= 2 ? `${growTitle(S)}!` : 'גדלת!', `אורכך עכשיו ${(GROWERS[P.spId] * S).toFixed(1)} מטר${S >= 3 ? '. אפילו יגוארים בורחים ממך' : S >= 1.7 ? '. טורפים כבר לא מעזים לצוד אותך' : ''}`);
    AUD.play(P.sp.call || 'growl', 0.8); CAM.shake = Math.max(CAM.shake, 0.2);
  }
  if (S >= 2.6) {
    GROW.scareT -= dt;
    if (GROW.scareT <= 0) { GROW.scareT = 1; shQuery(a.pos.x, a.pos.z, 14, b => { if (b.alive && !b.isPlayer && !b.legend && !b.pet && (b.sp.ai === 'pred' || b.sp.ai === 'pack') && b.state !== 'flee') threatReact(b, a, true); }); }
  }
}

// ================= INSECTS, AND A FROG THAT HUNTS THEM, CLIMBS AND LEAPS FURTHER WITH PRACTICE =================
const BUGT = [
  { n: 'זבוב', c: '#24242a', s: 0.035, food: 4, fly: true, spd: 1.7 },
  { n: 'יתוש', c: '#6a5c46', s: 0.026, food: 2, fly: true, spd: 1.2 },
  { n: 'עש', c: '#e2d8c0', s: 0.05, food: 6, fly: true, spd: 1.0 },
  { n: 'חיפושית', c: '#2f8a52', s: 0.045, food: 8, fly: false, spd: 0.5 },
  { n: 'צרצר', c: '#7a6236', s: 0.04, food: 6, fly: false, spd: 0.8 }
];
const BUGS = { list: [], mesh: null, ring: null, target: null, tongue: null, tong: null, M: new THREE.Matrix4(), Q: new THREE.Quaternion(), S: new V3(), P: new V3() };
const FROG = { jumping: false, lvl: 1 };
CLIMBERS.frog = 1.4;
const jumpLvl = s => 1 + Math.min(4, Math.floor((s || 0) / 0.2));
function jumpText() { const s = P.jumpSkill || 0; return `רמה ${jumpLvl(s)} · ${Math.round(s * 100)}%`; }
function bugsReset() { P.jumpSkill = 0; FROG.jumping = false; FROG.lvl = 1; for (const b of BUGS.list) b.dead = true; if (BUGS.tong) BUGS.tong.visible = false; }
// the frog's food is now only what it catches
MISSIONS.frog.splice(1, 0, MS('frog.bugs10', 'לצוד 10 חרקים', 50, KB('insect', 10)), MS('frog.climb', 'לטפס על עץ', 30, FL('climb')), MS('frog.jump3', 'להגיע לרמת קפיצה 3', 60, () => (P.jumpSkill || 0) >= 0.4));
MISSIONS.frog.splice(MISSIONS.frog.findIndex(m => m.id === 'frog.day5'), 0, MS('frog.jump5', 'להגיע לרמת קפיצה 5', 150, () => (P.jumpSkill || 0) >= 0.8));
GOAL['frog.bugs'] = Object.assign(GOAL['frog.bugs'] || {}, { t: 'לצוד חרק בלשון' });
for (const m of MISSIONS.frog) GOAL[m.id] = m;
SPECIES.frog.pl.pros = ['טורף שנוגס בה מורעל ובורח', 'קפיצות שמשתפרות עם אימון', 'מטפסת על עצים', 'לשון מהירה שתופסת חרקים'];
SPECIES.frog.pl.role = 'קטנה ורעילה: צדים חרקים בלשון, מטפסים על עצים, והקפיצות משתפרות עם כל קפיצה.';

function frogJump(a) {
  const s = P.jumpSkill || 0;
  a.vy = 6.2 * (1 + 0.65 * s); a.speed = Math.max(a.speed, (P.sp.run || 3.4) * (1.2 + s));
  FROG.jumping = true; a.onLand = frogLanded;
}
function frogLanded() {
  if (!FROG.jumping || P.spId !== 'frog') return; FROG.jumping = false;
  const s = P.jumpSkill || 0; P.jumpSkill = Math.min(1, s + 0.012 * Math.pow(1 - s, 1.3));
  const l = jumpLvl(P.jumpSkill);
  if (l > jumpLvl(s)) { UI.big(`קפיצה: רמה ${l}`, 'הקפיצות שלך גבוהות וארוכות יותר, והלשון מגיעה רחוק יותר'); AUD.play('chime', 0.7); }
}
const tongueRange = () => 1.2 + 0.7 * (P.jumpSkill || 0);

function bugsInit() {
  const n = 80;
  BUGS.mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffffff }), n);
  BUGS.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); BUGS.mesh.frustumCulled = false; scene.add(BUGS.mesh);
  for (let i = 0; i < n; i++) { BUGS.list.push({ dead: true, i }); BUGS.mesh.setColorAt(i, col('#000')); }
  BUGS.ring = makeMarker(); for (const c of BUGS.ring.children) c.material.color.set('#6dff6a'); BUGS.ring.visible = false; scene.add(BUGS.ring);
  BUGS.tong = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.012, 1, 6), new THREE.MeshLambertMaterial({ color: '#e8738a' }));
  BUGS.tong.geometry.translate(0, 0.5, 0); BUGS.tong.visible = false; scene.add(BUGS.tong);
}
function bugSpawn(b) {
  const a = P.a, up = P.climb && P.climb.phase === 'perch';
  for (let k = 0; k < 8; k++) {
    const ang = rng() * TAU, d = up ? rr(0.6, 4) : rr(3, 28), x = a.pos.x + Math.cos(ang) * d, z = a.pos.z + Math.sin(ang) * d;
    if (!inBounds(x, z)) continue;
    const g = getH(x, z), wet = waterDepth(x, z) > 0;
    let ti = rng() < (isNight() ? 0.45 : 0.15) ? 2 : rng() < 0.4 ? 0 : rng() < 0.5 ? 1 : rng() < 0.5 ? 3 : 4;
    if (wet && !BUGT[ti].fly) ti = 1;
    const T = BUGT[ti], y = up ? a.pos.y + rr(-0.5, 1.5) : wet ? waterAt(x, z) + rr(0.15, 1.2) : g + (T.fly ? rr(0.2, 1.8) : 0.02);
    Object.assign(b, { dead: false, ti, x, y, z, ax: x, ay: y, az: z, tx: x, ty: y, tz: z, flee: 0, ph: rng() * TAU, colr: true });
    return;
  }
}
function bugsUpdate(dt) {
  const a = P.a;
  if (!BUGS.mesh) { if (!a) return; bugsInit(); }
  const on = G.mode === 'play' && a && a.alive && !P.fish;
  BUGS.mesh.visible = !!on; if (!on) { BUGS.ring.visible = false; return; }
  const want = P.spId === 'frog' ? 80 : 30, M = BUGS.M, S = BUGS.S, Pp = BUGS.P;
  let best = null, bd = 1e9; const fx = Math.sin(a.yaw), fz = Math.cos(a.yaw), mouthY = a.pos.y + a.height * 0.6;
  for (const b of BUGS.list) {
    if (b.i >= want) { if (!b.dead) { b.dead = true; M.makeScale(0, 0, 0); BUGS.mesh.setMatrixAt(b.i, M); } continue; }
    if (b.dead || Math.hypot(b.x - a.pos.x, b.z - a.pos.z) > 40) bugSpawn(b);
    if (b.dead) continue;
    const T = BUGT[b.ti], dx0 = b.x - a.pos.x, dz0 = b.z - a.pos.z, dp = Math.hypot(dx0, dz0, b.y - mouthY);
    if (dp < 0.7 && a.speed > 1.2 && b.flee <= 0) { b.flee = 0.7; const l = Math.hypot(dx0, dz0) || 1; b.tx = b.x + dx0 / l * 3; b.tz = b.z + dz0 / l * 3; b.ty = b.y + (T.fly ? 0.6 : 0); }
    b.flee -= dt;
    let tx = b.tx - b.x, ty = b.ty - b.y, tz = b.tz - b.z, tl = Math.hypot(tx, ty, tz);
    if (tl < 0.15) {
      const r = T.fly ? 2.5 : 1.2; b.tx = b.ax + rr(-r, r); b.tz = b.az + rr(-r, r);
      b.ty = T.fly ? b.ay + rr(-0.4, 0.5) : getH(b.tx, b.tz) + 0.02; tx = b.tx - b.x; ty = b.ty - b.y; tz = b.tz - b.z; tl = Math.hypot(tx, ty, tz) || 1;
    }
    const sp = T.spd * (b.flee > 0 ? 3 : 1) * dt;
    b.x += tx / tl * Math.min(sp, tl); b.z += tz / tl * Math.min(sp, tl); b.y += ty / tl * Math.min(sp, tl);
    if (T.fly) b.y += Math.sin(G.t * 9 + b.ph) * 0.004; else b.y = Math.max(b.y, getH(b.x, b.z) + 0.02);
    Pp.set(b.x, b.y, b.z); S.setScalar(T.s * (T.fly ? 0.9 + 0.2 * Math.sin(G.t * 40 + b.ph) : 1)); M.compose(Pp, BUGS.Q, S); BUGS.mesh.setMatrixAt(b.i, M);
    if (b.colr) { BUGS.mesh.setColorAt(b.i, col(T.c)); b.colr = false; BUGS.mesh.instanceColor.needsUpdate = true; }
    if (P.spId === 'frog' && dp < tongueRange()) { const dot = (dx0 * fx + dz0 * fz) / (Math.hypot(dx0, dz0) || 1); if (dot > 0.25 && dp < bd) { bd = dp; best = b; } }
  }
  BUGS.mesh.instanceMatrix.needsUpdate = true;
  BUGS.target = best;
  if (best && !BUGS.told && P.spId === 'frog') { BUGS.told = true; UI.notify(TOUCH ? 'חרק בטווח הלשון מסומן בטבעת ירוקה. תקיפה יורה את הלשון' : 'חרק בטווח הלשון מסומן בטבעת ירוקה. קליק יורה את הלשון', 'good'); }
  if (best && !BUGS.tongue) { BUGS.ring.visible = true; BUGS.ring.position.set(best.x, best.y - 0.02, best.z); BUGS.ring.scale.setScalar(0.07); BUGS.ring.rotation.y += dt * 3; }
  else BUGS.ring.visible = false;
  tongueUpdate(dt);
  if (P.spId === 'frog' && a.onLand !== frogLanded) a.onLand = frogLanded;
}
function frogTongue() {
  if (BUGS.tongue || P.atkCD > 0) return;
  P.atkCD = 0.25;
  const a = P.a, b = BUGS.target, fx = Math.sin(a.yaw), fz = Math.cos(a.yaw);
  const from = new V3(a.pos.x + fx * a.rad * 0.9, a.pos.y + a.height * 0.6, a.pos.z + fz * a.rad * 0.9);
  const to = b ? new V3(b.x, b.y, b.z) : from.clone().add(new V3(fx * tongueRange() * 0.6, 0, fz * tongueRange() * 0.6));
  BUGS.tongue = { from, to, b, t: 0 }; a.anim.atk = 0.3; AUD.play('swipe', 0.25);
}
function tongueUpdate(dt) {
  const T = BUGS.tongue; if (!T) { BUGS.tong.visible = false; return; }
  T.t += dt; const k = T.t < 0.08 ? T.t / 0.08 : Math.max(0, 1 - (T.t - 0.08) / 0.1);
  const d = T.from.distanceTo(T.to) * k;
  BUGS.tong.visible = d > 0.01; BUGS.tong.position.copy(T.from); BUGS.tong.scale.set(1, Math.max(0.001, d), 1);
  BUGS.tong.quaternion.setFromUnitVectors(UPV, _t2.copy(T.to).sub(T.from).normalize());
  if (T.b && T.t >= 0.08 && !T.done) {
    T.done = true; const b = T.b;
    if (!b.dead && Math.hypot(b.x - T.to.x, b.y - T.to.y, b.z - T.to.z) < 0.35) {
      const B = BUGT[b.ti]; P.food = Math.min(100, P.food + B.food); PROG.flags.bugs = 1; PROG.kb = PROG.kb || {}; PROG.kb.insect = (PROG.kb.insect || 0) + 1;
      combatText(`${B.n}!`, 'good'); b.dead = true; BUGS.M.makeScale(0, 0, 0); BUGS.mesh.setMatrixAt(b.i, BUGS.M);
    } else combatText('פספוס', 'bad');
  }
  if (T.t > 0.18) BUGS.tongue = null;
}
