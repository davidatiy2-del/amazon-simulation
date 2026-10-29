// ================= TAMING AND RIDERS: the hunter tames a wild horse, the tribe brings horses home, the other tribes keep horses of their own, and warriors ride to war =================
// A wild horse lets the hunter come close. Holding the gold button beside it calms it, and then it has to be ridden: it
// bucks and swerves, and only a rider who keeps it running the way he wants wins it. People of the tribe can be sent to
// tame horses (and lead them home on a rope). The other tribes tame horses of their own; their raiders come mounted,
// and so do the tribe's warriors when there are horses in the stable.
CTXT.tameh = ['horse', 'לאלף', 'להרגיע את סוס הבר ולעלות עליו'];
const TAME = { h: null, k: 0, near: null, t: 0, w: null, day: -1, told: 0 };
const wildHorse = b => b.spId === 'horse' && b.alive && !b.gone && !b.young && !b.tribeHorse && !b.campHorse && !b.pet && !b.rider && !b.ridden && !b.ledBy && b.brain !== 'mount';
function groupLeave(b) {
  const g = b.group; if (!g) return;
  const k = g.members.indexOf(b); if (k >= 0) g.members.splice(k, 1);
  if (g.leader === b) g.leader = g.members.find(q => q.alive) || null;
  b.group = null;
}
// the nearest wild horse that nobody else is after
function wildHorseNear(x, z, r, who) {
  let best = null, bd = 1e9;
  for (const b of ANIMALS) {
    if (!wildHorse(b) || b.swimming || (b.tamer && b.tamer !== who && b.tamer.alive && b.tamer.job && b.tamer.job.h === b)) continue;
    const d = Math.hypot(b.pos.x - x, b.pos.z - z); if (d < r && d < bd) { bd = d; best = b; }
  }
  return best;
}
// ---------- the hunter: calm it, then ride it until it gives in ----------
function tameCtx() {
  const a = P.a; if (!P.human || P.ride || P.boat || a.swimming || P.climb) { TAME.near = null; return null; }
  let best = null, bd = 3.4;
  shQuery(a.pos.x, a.pos.z, 4, (b, d) => { if (!wildHorse(b) || b.swimming || b.state === 'flee' || b.state === 'fight' || (b.tameCD || 0) > G.t) return; if (d < bd) { bd = d; best = b; } });
  TAME.near = best; if (!best) return null;
  CTXT.tameh[2] = `להרגיע את ${best.sex === 'f' ? 'סוסת הבר' : 'סוס הבר'} ולעלות ${best.sex === 'f' ? 'עליה' : 'עליו'}`;
  return 'tameh';
}
XCTX.push(tameCtx);
CTXH.tameh = dt => {
  const h = TAME.near, a = P.a; if (!h || !dt) return;
  if (TAME.h !== h) { TAME.h = h; TAME.k = 0; }
  TAME.k += dt / 3.6; TAME.t = G.t; P.tameT = Math.max(P.tameT || 0, 0.25);
  h.stunT = 0.35; h.state = 'idle'; h.threat = null; h.yaw += angDiff(h.yaw, Math.atan2(a.pos.x - h.pos.x, a.pos.z - h.pos.z)) * Math.min(1, dt * 2.5); h.pose = 'idle';
  a.yaw += angDiff(a.yaw, Math.atan2(h.pos.x - a.pos.x, h.pos.z - a.pos.z)) * Math.min(1, dt * 5);
  vxProgress(TAME.k, `מרגיעים את ${h.sex === 'f' ? 'סוסת הבר' : 'סוס הבר'}…`);
  if (TAME.k >= 1) { TAME.k = 0; TAME.h = null; P.tameT = 0; buckStart(h); }
};
function buckStart(h) {
  groupLeave(h); h.wild = true; h.state = 'idle';
  TAME.w = { h, t: 0, ctrl: 0, kick: 0.8, hop: 0 };
  rideStart(h); CLB.latch = true;   // the button still held does not throw the hunter off at once
  UI.notify(TOUCH ? `🐎 ${h.sex === 'f' ? 'היא מנסה' : 'הוא מנסה'} להפיל אותך! הג׳ויסטיק: לכוון ${heb(h, 'אותו', 'אותה')} כל הזמן לאותו כיוון, עד ${heb(h, 'שייכנע', 'שתיכנע')}` : `🐎 ${h.sex === 'f' ? 'היא מנסה' : 'הוא מנסה'} להפיל אותך! WASD: לכוון ${heb(h, 'אותו', 'אותה')} כל הזמן לאותו כיוון, עד ${heb(h, 'שייכנע', 'שתיכנע')}`, 'good');
  AUD.at('clack', h.pos, 0.8); PROG.flags.buck = 1;
}
// the wild ride: it swerves and leaps; the rider pulls it back on course. Long enough on course, and it gives in
function horseBuck(h, dt, dx, dz, mag) {
  const a = P.a, W = TAME.w && TAME.w.h === h ? TAME.w : (TAME.w = { h, t: 0, ctrl: 0, kick: 0.8, hop: 0 });
  W.t += dt; W.kick -= dt; W.hop = Math.max(0, W.hop - dt);
  if (W.kick <= 0) { W.kick = rr(0.7, 1.3); h.yaw += (rng() < 0.5 ? -1 : 1) * rr(0.7, 1.4); W.hop = 0.32; if (h.dCam < 40) { AUD.at('clack', h.pos, 0.45); FX.spawn('dust', h.pos.x, h.pos.y + 0.1, h.pos.z, 3); } }
  const want = Math.atan2(dx, dz), steer = mag > 0.25;
  if (steer) h.yaw += angDiff(h.yaw, want) * Math.min(1, dt * 3.4);
  const on = steer && Math.abs(angDiff(h.yaw, want)) < 0.6;
  W.ctrl = clamp(W.ctrl + (on ? dt : -dt * 0.55), -3.2, 5);
  const nx = h.pos.x + Math.sin(h.yaw) * 1.6, nz = h.pos.z + Math.cos(h.yaw) * 1.6, wet = waterDepth(nx, nz) > 0.85;
  if (wet) h.yaw += Math.PI * 0.6 * dt * 3;   // it will not run into deep water
  h.move(Math.sin(h.yaw), Math.cos(h.yaw), wet ? 1 : on ? 5.5 : 8, dt); h.pose = 'move';
  const back = h.tpl.L * 0.08 * h.scale, bump = Math.sin(W.hop / 0.32 * Math.PI) * 0.45;
  a.pos.set(h.pos.x - Math.sin(h.yaw) * back, h.pos.y + seatY(h) + bump, h.pos.z - Math.cos(h.yaw) * back);
  a.yaw = h.yaw; a.speed = 0; a.swimming = false; a.airborne = false; a.vy = 0;
  vxProgress((W.ctrl + 3.2) / 8.2, on ? 'הסוס נרגע… להמשיך לכוון' : 'הסוס מנסה להפיל אותך! לכוון אותו קדימה');
  if (W.ctrl >= 5) { horseTamedByHunter(h); return; }
  if (W.ctrl <= -3.2 || W.t > 24) {
    TAME.w = null; h.wild = false; rideEnd(true);
    if (a.alive) { a.airborne = true; a.vy = 3.5; hurt(a, 6, null); }
    h.tameCD = G.t + 25; h.brain = null; h.state = 'flee'; h.threat = a; h.stT = 0;
    UI.notify(`🐎 ${heb(h, 'הסוס', 'הסוסה')} ${heb(h, 'הפיל', 'הפילה')} אותך ${heb(h, 'וברח', 'וברחה')}. אפשר לנסות שוב, או סוס אחר`, 'bad');
  }
}
function horseTamedByHunter(h) {
  TAME.w = null; h.wild = false; h.tameCD = 0;
  horseToTribe(h, true);
  h.prevBrain = null;   // when the hunter gets off, it is a horse of the tribe
  UI.big(h.sex === 'f' ? 'אילפת סוסה!' : 'אילפת סוס!', `${h.name} ${heb(h, 'נכנע', 'נכנעה')} ו${heb(h, 'נושא', 'נושאת')} אותך. ${ownCamp() ? `${heb(h, 'הוא', 'היא')} ${heb(h, 'שייך', 'שייכת')} לשבט, ${BLD.list.some(b => b.done && b.t === 'stable') ? 'וגר באורווה' : 'וכשיש אורווה גר בה'}` : `${heb(h, 'הוא מחכה', 'היא מחכה')} איפה שיורדים ממנו`}`);
  AUD.play('cheer', 0.5); PROG.flags.tameHorse = 1; discover('horse');
  FX.spawn('heart', h.pos.x, h.pos.y + 2, h.pos.z, 6);
}
// a wild horse becomes the tribe's (or the hunter's) horse
function horseToTribe(h, byHunter) {
  groupLeave(h);
  const st = BLD.list.filter(b => b.done && b.t === 'stable'), b = st.length ? st.reduce((p, q) => dist2(q, h.pos) < dist2(p, h.pos) ? q : p) : null, v = ownCamp();
  Object.assign(h, { tribeHorse: true, socialExtra: true, leash: 13, name: h.name || pick(HORSEN[h.sex]), stableB: b, mine: !!byHunter, tamer: null, ledBy: null, wild: false, threat: null, state: 'idle', stT: 2 });
  if (h.brain === 'led') h.brain = null;
  if (b) h.home.set(b.x, 0, b.z); else if (v) h.home.set(v.x + rr(-6, 6), 0, v.z + rr(-6, 6)); else h.home.set(h.pos.x, 0, h.pos.z);
}
// ---------- the tribe tames: a order sends people to a wild herd; each brings a horse home on a rope ----------
ORDT.tame = { ic: '🐎', n: 'לאלף סוסים', d: 'הולכים לעדר של סוסי בר, מרגיעים סוס ומובילים אותו לכפר', who: ['hunter', 'warrior', 'gatherer', 'builder'], def: 2, unit: 'סוסים', goal: n => n, T: 720, area: 1, go: 'יצאו לאלף סוסים', go1: ['יצא לאלף סוסים', 'יצאה לאלף סוסים'] };
function ordTame(a, dt, v, o) {
  let j = a.job;
  if (!j || j.k !== 'tame') {
    const h = wildHorseNear(o.x, o.z, o.home ? 480 : 320, a);
    if (!h) { if (!o.men.some(m => m !== a && m.job && m.job.k === 'tame')) ordEnd(o, 'horses'); else ordLeave(a); return false; }
    h.tamer = a; a.job = j = { k: 'tame', h, ph: 'go', t: 0, T: 260 };
  }
  const h = j.h; j.T -= dt;
  if (!h.alive || h.gone || h.tribeHorse || h.campHorse || h.ridden || (h.tamer && h.tamer !== a) || j.T <= 0) { if (h.tamer === a) h.tamer = null; if (h.ledBy === a) { h.ledBy = null; if (h.brain === 'led') h.brain = null; } a.job = null; return true; }
  a.hidden = false;
  if (j.ph === 'go') {
    const dd = Math.hypot(h.pos.x - a.pos.x, h.pos.z - a.pos.z);
    if (dd > 140 && (a.dCam || 0) > 150 && (h.dCam || 0) > 150) { const ang = rng() * TAU; a.pos.set(h.pos.x + Math.cos(ang) * 12, 0, h.pos.z + Math.sin(ang) * 12); a.ground(1, true); }   // a long walk out of sight
    const d = jobGo(a, h.pos.x, h.pos.z, dd > 30 ? a.sp.run * 0.7 : a.sp.walk * 0.8, dt); a.crouch = d < 12;
    if (d < 2.6) { j.ph = 'calm'; j.t = 0; a.crouch = false; }
    return true;
  }
  if (j.ph === 'calm') {
    const dx = h.pos.x - a.pos.x, dz = h.pos.z - a.pos.z, d = Math.hypot(dx, dz);
    if (d > 4.5) { j.ph = 'go'; return true; }
    h.stunT = 0.35; h.state = 'idle'; h.yaw += angDiff(h.yaw, Math.atan2(-dx, -dz)) * Math.min(1, dt * 2);
    a.move(0, 0, 0, dt); a.yaw += angDiff(a.yaw, Math.atan2(dx, dz)) * Math.min(1, dt * 4); a.pose = 'kneel'; j.t += dt;
    if (j.t > 8) { j.ph = 'lead'; groupLeave(h); h.ledBy = a; h.brain = 'led'; h.state = 'idle'; if (a.dCam < 40) say(a, pick(['בוא, יפה שלי', 'שקט, שקט… בוא איתי', 'עכשיו את שלנו']), 2.2); }
    return true;
  }
  // leading it home
  const dd = Math.hypot(v.x - a.pos.x, v.z - a.pos.z);
  if (dd > 160 && (a.dCam || 0) > 150 && Math.hypot(camera.position.x - v.x, camera.position.z - v.z) > 150) { const ang = rng() * TAU; a.pos.set(v.x + Math.cos(ang) * (villageR() + 25), 0, v.z + Math.sin(ang) * (villageR() + 25)); a.ground(1, true); h.pos.set(a.pos.x + 1.5, 0, a.pos.z + 1.5); h.ground(1, true); }
  const d = jobGo(a, v.x + Math.sin(a.id) * 5, v.z + Math.cos(a.id) * 5, a.sp.walk * 1.05, dt);
  if (d < 4) { horseToTribe(h, false); o.got++; a.job = null; tribeNews(`🐎 ${a.name} ${heb(a, 'הביא', 'הביאה')} ${h.sex === 'f' ? 'סוסת בר מאולפת' : 'סוס בר מאולף'}: ${h.name}`); PROG.flags.tribeHorse = 1; }
  return true;
}
// a horse on a rope walks behind the one who leads it
BRAIN.led = function (h, dt) {
  const a = h.ledBy; if (!a || !a.alive || a.gone || !a.job || a.job.k !== 'tame') { h.brain = null; h.ledBy = null; return; }
  const tx = a.pos.x - Math.sin(a.yaw) * 2, tz = a.pos.z - Math.cos(a.yaw) * 2, dx = tx - h.pos.x, dz = tz - h.pos.z, d = Math.hypot(dx, dz);
  if (d > 0.6) h.move(dx / d, dz / d, Math.min(h.sp.run, Math.max(1.2, d * 1.4)), dt); else h.move(0, 0, 0, dt);
  h.pose = h.speed > 0.2 ? 'move' : 'idle';
  if (d > 30) { h.pos.set(tx, 0, tz); h.ground(1, true); }
};
// ---------- the other tribes keep horses ----------
function campHorses(c) { return ANIMALS.filter(h => h.campHorse === c && h.alive && !h.gone); }
// the tribes of the new lands ride what their land gives them: reindeer in the north, camels in the desert
const LAND_MOUNT = { 1: 'reindeer', 3: 'camel' };
const mountOf = c => campLand(c) ? LAND_MOUNT[campLand(c)] || null : 'horse';
function mountAnimal(id, x, z, o) { if (id !== 'horse') buildLandTpls(); return new Animal(id, x, z, Object.assign({ sex: rng() < 0.5 ? 'm' : 'f', tpl: id === 'horse' ? pick(SPECIES.horse.tpls) : undefined }, o)); }
function wildMountNear(c, r) {
  const id = mountOf(c); if (!id) return null; if (id === 'horse') return wildHorseNear(c.x, c.z, r);
  let best = null, bd = 1e9;
  for (const b of ANIMALS) {
    if (b.spId !== id || !b.alive || b.gone || b.young || b.campHorse || b.cowCamp || b.pet || b.rider || b.ridden || b.swimming || b.brain === 'mount') continue;
    const d = Math.hypot(b.pos.x - c.x, b.pos.z - c.z); if (d < r && d < bd) { bd = d; best = b; }
  }
  return best;
}
function campHorseSpawn(c, n) {
  const id = mountOf(c); if (!id) return;
  buildHorseTpls();
  for (let i = 0; i < n; i++) for (let t = 0; t < 14; t++) {
    const ang = rng() * TAU, r = rr(8, 15), x = c.x + Math.cos(ang) * r, z = c.z + Math.sin(ang) * r;
    if (!inBounds(x, z) || waterDepth(x, z) > 0) continue;
    const h = mountAnimal(id, x, z, { scale: rr(0.97, 1.04) }); h.ground(1, true);
    Object.assign(h, { campHorse: c, socialExtra: true, leash: 14 }); h.home.set(c.x, 0, c.z);
    break;
  }
}
const campHorseCap = c => 1 + Math.min(3, c.lvl || 0);
function npcTameDaily() {
  for (const i of npcIdx()) {
    const c = HUNT.camps[i], have = campHorses(c).length; if (have >= campHorseCap(c) || rng() > 0.4) continue;
    const h = wildMountNear(c, 480); if (!h || (h.dCam || 0) < 150 || Math.hypot(camera.position.x - c.x, camera.position.z - c.z) < 150) continue;
    groupLeave(h); Object.assign(h, { campHorse: c, socialExtra: true, leash: 14, state: 'idle', threat: null, brain: null }); h.home.set(c.x, 0, c.z);
    for (let t = 0; t < 10; t++) { const ang = rng() * TAU, r = rr(8, 14), x = c.x + Math.cos(ang) * r, z = c.z + Math.sin(ang) * r; if (inBounds(x, z) && waterDepth(x, z) === 0) { h.pos.set(x, 0, z); h.ground(1, true); break; } }
    if (VX.known.has(i)) warLog(h.spId === 'horse' ? `${campName(i)} אילפו סוס בר (${have + 1} סוסים)` : `${campName(i)} אילפו ${h.sp.he} לרכיבה`, '');
  }
}
// ---------- riders: a person on a horse moves like one ----------
BRAIN.mount = function (h) { h.state = 'idle'; };
function mountUp(r, h) {
  if (!r || !h || r.mount || h.rider || h.ridden) return false;
  r.mount = h; h.rider = r; r.sp0 = r.sp; r.sp = Object.assign(Object.create(r.sp0), { walk: r.sp0.walk * 2, run: r.sp0.run * 1.6 });
  r.ownY = true; h.prevBrain2 = h.brain || null; h.brain = 'mount'; h.state = 'idle'; h.foe = null; h.threat = null;
  return true;
}
function mountOff(r) {
  const h = r.mount; r.mount = null; if (r.sp0) { r.sp = r.sp0; r.sp0 = null; }
  if (!r.onTower && !(r.job && r.job.k === 'boat')) { r.ownY = false; if (r.alive) r.ground(1, true); }
  if (!h) return;
  h.rider = null; h.brain = h.prevBrain2 || null; h.prevBrain2 = null; h.speed = 0; h.state = 'idle'; h.stT = 2;
  if (h.raidHorse) {
    // a raider's horse with nobody on it: it runs off and is wild again (the hunter may tame it)
    if (!r.alive) { h.raidHorse = null; h.campHorse = null; h.socialExtra = true; h.leash = 0; h.tameCD = G.t + 6; h.state = 'flee'; h.threat = r.lastHit && r.lastHit.alive ? r.lastHit : null; }
    else { h.remove(); }
  }
}
function mountSync(r, dt) {
  const h = r.mount;
  if (!h || !h.alive || h.gone || !r.alive || r.gone || r.brain === 'captive' || r.hidden || waterDepth(r.pos.x, r.pos.z) > 0.75 || (r.tribe && !(r.job && r.job.k === 'raid'))) { mountOff(r); return; }
  r.ownY = true;
  const fx = Math.sin(r.yaw), fz = Math.cos(r.yaw), back = h.tpl.L * 0.08 * h.scale;
  h.pos.x = r.pos.x + fx * back; h.pos.z = r.pos.z + fz * back; h.yaw = r.yaw; h.speed = r.speed; h.pose = r.speed > 0.2 ? 'move' : 'idle';
  h.pos.y = getH(h.pos.x, h.pos.z); r.pos.y = h.pos.y + seatY(h);
  if (r.pose !== 'aim') r.pose = 'ride';
  h.mesh.position.copy(h.pos); h.mesh.rotation.y = h.yaw;
}
// raiders of a tribe with horses come mounted
function mountRaiders(p) {
  const c = HUNT.camps[p.from]; if (!c || p.abstract) return 0;
  const n = Math.min(3, campHorses(c).length, p.men.length), id = mountOf(c) || 'horse'; let k = 0;
  const L = p.men.slice().sort((x, y) => (y.cls === 'warrior') - (x.cls === 'warrior'));
  for (const r of L) {
    if (k >= n) break;
    const h = mountAnimal(id, r.pos.x, r.pos.z, { scale: rr(0.98, 1.04) }); h.ground(1, true);
    Object.assign(h, { socialExtra: true, raidHorse: p, campHorse: null });
    if (mountUp(r, h)) k++; else h.remove();
  }
  return k;
}
// our warriors ride out when the stable has horses
function mountOurs(p) {
  const free = tribeHorses().filter(h => !h.ridden && !h.rider && h.alive && !h.swimming);
  let k = 0;
  for (const m of p.men.slice().sort((x, y) => (!!y.knight - !!x.knight) || (y.cls === 'warrior') - (x.cls === 'warrior'))) {
    const h = free.shift(); if (!h) break;
    h.pos.set(m.pos.x + 1, 0, m.pos.z); h.ground(1, true);
    if (mountUp(m, h)) k++;
  }
  return k;
}
// the hunter whistles: his own horse comes running, and waits where he is
function horseCall(a) {
  const L = tribeHorses().filter(h => h.mine && !h.ridden && !h.rider && Math.hypot(h.pos.x - a.pos.x, h.pos.z - a.pos.z) < 260); if (!L.length) return '';
  const h = L.sort((p, q) => dist2(p.pos, a.pos) - dist2(q.pos, a.pos))[0], d = Math.hypot(h.pos.x - a.pos.x, h.pos.z - a.pos.z);
  if (d > 90 && (h.dCam || 0) > 90) { const ang = rng() * TAU; h.pos.set(a.pos.x + Math.cos(ang) * 30, 0, a.pos.z + Math.sin(ang) * 30); if (waterDepth(h.pos.x, h.pos.z) > 0) h.pos.set(a.pos.x + 3, 0, a.pos.z); h.ground(1, true); }
  if (!h.stableB) h.home.set(a.pos.x, 0, a.pos.z);
  h.threat = null; setGoal(h, a.pos.x + rr(-2, 2), a.pos.z + rr(-2, 2), h.sp.run * 0.55, null);
  return `${h.name} ${heb(h, 'בא', 'באה')} אליך`;
}
// ---------- the clock, save and load ----------
function tameUpdate(dt) {
  if (TAME.h && G.t - TAME.t > 0.6) { TAME.k = Math.max(0, TAME.k - dt * 0.6); if (TAME.k <= 0) TAME.h = null; }
  if (TAME.w && P.ride !== TAME.w.h) TAME.w = null;
  if (TAME.day !== G.day && G.time > 7) { const first = TAME.day < 0; TAME.day = G.day; if (!first) npcTameDaily(); }
  // the first time the hunter stands near wild horses
  if (!TAME.told && P.human && P.a && (TAME.tc = (TAME.tc || 0) - dt) <= 0) {
    TAME.tc = 2; const h = wildHorseNear(P.a.pos.x, P.a.pos.z, 30);
    if (h) { TAME.told = 1; UI.notify(TOUCH ? '🐎 סוסי בר! מתגנבים אל אחד לאט (התגנבות), ומחזיקים לידו את כפתור הזהב כדי להרגיע ולאלף אותו' : '🐎 סוסי בר! מתגנבים אל אחד לאט (C), ומחזיקים לידו E כדי להרגיע ולאלף אותו', 'good'); }
  }
}
function tameSave() { const ch = {}; for (const i of npcIdx()) { const n = campHorses(HUNT.camps[i]).length; if (n) ch[i] = n; } return { ch, told: TAME.told }; }
function tameReset() {
  for (const a of ANIMALS.slice()) { if (a.campHorse || a.raidHorse) a.remove(); else if (a.mount) mountOff(a); }
  TAME.h = null; TAME.k = 0; TAME.w = null; TAME.day = -1; TAME.told = 0;
}
function tameLoad(d) {
  tameReset(); if (!d) return;
  TAME.told = d.told || 0;
  for (const k in d.ch || {}) { const c = HUNT.camps[+k]; if (c && !c.gone && !c.own) campHorseSpawn(c, Math.min(4, d.ch[k] | 0)); }
}
// ================= CARRIAGES: a cartwright's shop builds a carriage; a horse of the tribe is harnessed to it; people ride in the back =================
// The shop stands in the village (it needs a stable: no horses, no carriage). Its carriage waits beside it. The hunter
// drives it (a horse of the tribe is harnessed at once), and the people who walk with him climb in the back. When the
// hunter does not need it, the builders take it into the forest and bring back a whole load of wood.
BTYPES.cartshop = { n: 'סדנת כרכרות', dn: 'סדנת הכרכרות', g: 'f', d: 'נגרים בונים כרכרה עם ארבעה גלגלים. סוס של השבט נרתם אליה: נוהגים בה, מי שהולך איתך יושב מאחור, והבונים מביאים בה עצים מהיער', wood: 26, work: 60, r: 3.0, need: 0, tier: 1, needB: 'stable', water: 999, ic: '🐴' };
CTXT.cart = ['horse', 'לנהוג', 'לרתום סוס לכרכרה ולנהוג'];
CTXT.uncart = ['down', 'לרדת', 'לרדת מהכרכרה'];
const CARTS = { list: [], geo: null, told: 0 };
const CART_D = 2.35;   // from the hitch at the horse to the middle of the carriage
BGEOX.cartshop = A => {
  A(new THREE.BoxGeometry(5.6, 0.14, 4.6), [0, 0.07, 0], null, null, '#7a5a3a');
  for (const s of [-1, 1]) for (const q of [-1, 1]) A(new THREE.BoxGeometry(0.18, 2.6, 0.18), [s * 2.6, 1.3, q * 2.1], null, null, WOOD);
  A(new THREE.BoxGeometry(5.4, 1.6, 0.12), [0, 0.9, -2.1], null, null, WALL, 0.2);
  for (const s of [-1, 1]) A(new THREE.BoxGeometry(6.2, 0.14, 2.7), [0, 2.85, s * 1.15], [s * 0.42, 0, 0], null, TH, 0.22);
  A(new THREE.BoxGeometry(6.3, 0.14, 0.14), [0, 3.32, 0], null, null, WOOD);
  // a wheel being made, planks and a workbench
  A(new THREE.TorusGeometry(0.62, 0.06, 6, 18), [-1.6, 0.66, -1.75], null, null, '#6b4a2c');
  for (let i = 0; i < 6; i++) A(new THREE.BoxGeometry(0.05, 1.2, 0.05), [-1.6, 0.66, -1.75], [0, 0, i / 6 * Math.PI], null, '#7a5a34');
  A(new THREE.BoxGeometry(1.8, 0.12, 0.7), [1.3, 0.85, -1.4], null, null, '#8a6a42');
  for (const s of [-1, 1]) for (const q of [-1, 1]) A(new THREE.BoxGeometry(0.1, 0.8, 0.1), [1.3 + s * 0.8, 0.42, -1.4 + q * 0.28], null, null, WOOD);
  for (let i = 0; i < 4; i++) A(new THREE.BoxGeometry(2.4, 0.08, 0.26), [1.1, 0.18 + i * 0.09, 0.9 + (i % 2) * 0.05], [0, 0.04 * i, 0], null, '#a07a4a', 0.2);
};
function cartGeo() {
  if (CARTS.geo) return CARTS.geo;
  const G1 = new GB(), A = (geo, p, r, s, c, v) => G1.add(geo, M(p, r, s), c, v);
  A(new THREE.BoxGeometry(1.7, 0.1, 2.5), [0, 0.86, 0], null, null, '#8a6a42', 0.18);              // the bed
  for (const s of [-1, 1]) A(new THREE.BoxGeometry(0.08, 0.42, 2.5), [s * 0.83, 1.12, 0], null, null, '#6b4a2c', 0.16);
  A(new THREE.BoxGeometry(1.7, 0.42, 0.08), [0, 1.12, -1.22], null, null, '#6b4a2c', 0.16);
  A(new THREE.BoxGeometry(1.7, 0.62, 0.08), [0, 1.22, 1.22], null, null, '#6b4a2c', 0.16);
  A(new THREE.BoxGeometry(1.5, 0.08, 0.42), [0, 1.48, 0.98], null, null, '#5c4128');                 // the driver's bench
  for (const s of [-1, 1]) A(new THREE.BoxGeometry(0.06, 0.5, 0.06), [s * 0.7, 1.22, 0.98], null, null, '#4a3220');
  for (const z of [-0.85, 0.85]) A(new THREE.BoxGeometry(1.9, 0.09, 0.09), [0, 0.66, z], null, null, '#3e2a1a');   // axles
  for (const s of [-1, 1]) A(new THREE.BoxGeometry(0.1, 0.1, 3.0), [s * 0.4, 0.98, 2.65], [-0.04, 0, 0], null, '#8a6a42');   // the shafts along the horse
  A(new THREE.BoxGeometry(0.9, 0.09, 0.09), [0, 1.0, 1.4], null, null, '#5c4128');
  for (const s of [-1, 1]) A(new THREE.BoxGeometry(0.05, 0.05, 1.2), [s * 0.3, 1.12, 3.6], [0, s * 0.35, 0], null, '#3e2a1a');   // the traces to the collar
  const body = G1.build();
  const G2 = new GB(), B2 = (geo, p, r, s, c, v) => G2.add(geo, M(p, r, s), c, v);
  B2(new THREE.TorusGeometry(0.52, 0.05, 6, 22), [0, 0, 0], [0, Math.PI / 2, 0], null, '#4a3220', 0.1);
  for (let i = 0; i < 8; i++) B2(new THREE.BoxGeometry(0.04, 1.0, 0.04), [0, 0, 0], [i / 8 * Math.PI, 0, 0], null, '#7a5a34', 0.1);
  B2(new THREE.CylinderGeometry(0.1, 0.1, 0.16, 8), [0, 0, 0], [0, 0, Math.PI / 2], null, '#3e2a1a');
  CARTS.geo = { body, wheel: G2.build() };
  return CARTS.geo;
}
function cartAdd(x, z, yaw, shop) {
  if (!BLD.mat) BLD.mat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
  const g = cartGeo(), root = new THREE.Group(), body = new THREE.Mesh(g.body, BLD.mat); body.castShadow = true; root.add(body);
  const wheels = [];
  for (const [wx, wz] of [[-0.98, -0.85], [0.98, -0.85], [-0.98, 0.85], [0.98, 0.85]]) { const w = new THREE.Mesh(g.wheel, BLD.mat); w.position.set(wx, 0.55, wz); w.castShadow = true; root.add(w); wheels.push(w); }
  scene.add(root);
  const C = { x, z, yaw, mesh: root, wheels, shop: shop || null, horse: null, driver: null, v: 0, home: { x, z, yaw } };
  CARTS.list.push(C); cartPlace(C, 0); return C;
}
function cartRemove(C) { cartUnharness(C); for (const m of clanReal()) if (m.inCart === C) cartUnseat(m); if (P.cart === C) cartLeave(true); scene.remove(C.mesh); const i = CARTS.list.indexOf(C); if (i >= 0) CARTS.list.splice(i, 1); }
function cartPlace(C, dt) {
  const fx = Math.sin(C.yaw), fz = Math.cos(C.yaw), hf = getH(C.x + fx * 0.9, C.z + fz * 0.9), hb = getH(C.x - fx * 0.9, C.z - fz * 0.9);
  C.y = (hf + hb) / 2; C.mesh.position.set(C.x, C.y - 0.02, C.z); C.mesh.rotation.set(-Math.atan2(hf - hb, 1.8), C.yaw, 0, 'YXZ');
  if (dt) for (const w of C.wheels) w.rotation.x += C.v * dt / 0.52;
}
// where the carriage is made to stand beside its shop
function cartHome(b) {
  for (let k = 0; k < 16; k++) { const a = b.rot + Math.PI / 2 + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 0.4, x = b.x + Math.sin(a) * (BTYPES.cartshop.r + 2.6), z = b.z + Math.cos(a) * (BTYPES.cartshop.r + 2.6); if (waterDepth(x, z) === 0 && getNY(x, z) > 0.8) return { x, z, yaw: a + Math.PI / 2 }; }
  return { x: b.x + 5, z: b.z, yaw: 0 };
}
// ---------- the horse in front of it ----------
function cartHarness(C, h) {
  if (!h || C.horse) return false;
  C.horse = h; h.harness = C; h.prevBrain3 = h.brain || null; h.brain = 'mount'; h.state = 'idle'; h.threat = null; h.foe = null;
  const fx = Math.sin(C.yaw), fz = Math.cos(C.yaw);
  h.pos.set(C.x + fx * (CART_D + 1.15), 0, C.z + fz * (CART_D + 1.15)); h.ground(1, true); h.yaw = C.yaw;
  return true;
}
function cartUnharness(C) {
  const h = C.horse; if (!h) return; C.horse = null; h.harness = null;
  if (h.brain === 'mount') h.brain = h.prevBrain3 || null; h.prevBrain3 = null; h.speed = 0; h.state = 'idle'; h.stT = 2;
}
const cartHorseFree = h => h.alive && !h.gone && !h.ridden && !h.rider && !h.harness && !h.swimming;
function cartFindHorse(C, r) {
  let best = null, bd = r;
  for (const h of tribeHorses()) { if (!cartHorseFree(h)) continue; const d = Math.hypot(h.pos.x - C.x, h.pos.z - C.z); if (d < bd) { bd = d; best = h; } }
  return best;
}
// the carriage trails its horse: it turns toward the hitch and rolls after it
function cartFollow(C, h, dt) {
  const hx = h.pos.x - Math.sin(h.yaw) * 1.15, hz = h.pos.z - Math.cos(h.yaw) * 1.15;
  C.yaw = Math.atan2(hx - C.x, hz - C.z);
  const nx = hx - Math.sin(C.yaw) * CART_D, nz = hz - Math.cos(C.yaw) * CART_D, mv = Math.hypot(nx - C.x, nz - C.z);
  C.x = nx; C.z = nz; C.v = dt ? mv / dt : 0; cartPlace(C, dt);
}
const cartSeat = (C, k) => { const fx = Math.sin(C.yaw), fz = Math.cos(C.yaw), rx = Math.cos(C.yaw), rz = -Math.sin(C.yaw), sx = k % 2 ? 0.42 : -0.42, sz = k < 2 ? -0.1 : -0.85; return { x: C.x + rx * sx + fx * sz, z: C.z + rz * sx + fz * sz, y: (C.y || getH(C.x, C.z)) + 0.92, yaw: C.yaw + (k % 2 ? -Math.PI / 2 : Math.PI / 2) }; };
// ---------- the hunter drives ----------
function cartNear() {
  const a = P.a; let best = null, bd = 3.2;
  for (const C of CARTS.list) { if (C.driver) continue; const d = Math.hypot(C.x - a.pos.x, C.z - a.pos.z); if (d < bd) { bd = d; best = C; } }
  return best;
}
function cartCtx() {
  if (P.cart) return 'uncart';
  const a = P.a; if (!P.human || P.ride || P.boat || a.swimming || P.climb) return null;
  return cartNear() ? 'cart' : null;
}
XCTX_TOP.push(cartCtx);
CTXH.cart = () => {
  if (CLB.latch) return; CLB.latch = true;
  const C = cartNear(); if (!C) return;
  if (!C.horse) {
    const h = cartFindHorse(C, 140);
    if (!h) { UI.notify(tribeHorses().length ? 'כל הסוסים של השבט עסוקים כרגע' : 'צריך סוס של השבט כדי לרתום לכרכרה: אורווה, או לאלף סוס בר', 'bad'); return; }
    cartHarness(C, h);
  }
  cartEnter(C);
};
CTXH.uncart = () => { if (CLB.latch) return; CLB.latch = true; cartLeave(); };
function cartEnter(C) {
  const a = P.a; P.cart = C; C.driver = a; a.ownY = true; P.crouch = false; P.resting = false; C.v = 0; CAM.yaw = C.yaw;
  // those who walk with the hunter climb in the back
  let k = 0; for (const m of clanReal()) { if (k >= 4) break; if (m.escort && !m.young && !m.inCart && m.alive && Math.hypot(m.pos.x - C.x, m.pos.z - C.z) < 30) { cartBoard(m, C, k++); } }
  PROG.flags.cart = 1; AUD.play('clack', 0.5);
  if (!CARTS.told) { CARTS.told = 1; UI.notify(TOUCH ? `🐴 ${C.horse.name} רתום לכרכרה. הג׳ויסטיק מכוון, ריצה דוהרת. מי שהולך איתך יושב מאחור. כפתור הזהב: לרדת` : `🐴 ${C.horse.name} רתום לכרכרה. WASD מכוונים, Shift דוהר. מי שהולך איתך יושב מאחור. E: לרדת`, 'good'); }
}
function cartLeave(quiet) {
  const C = P.cart, a = P.a; P.cart = null; if (!C) return;
  C.driver = null; C.v = 0;
  for (const m of clanReal()) if (m.inCart === C) cartUnseat(m);
  if (C.horse && !C.trip) { const h = C.horse; cartUnharness(C); if (C.shop && Math.hypot(C.x - C.home.x, C.z - C.home.z) < 12) { /* back home: the horse goes back to the stable */ } else { h.home.set(h.pos.x, 0, h.pos.z); h.homeBack = G.t + 240; } }
  if (!a) return;
  a.ownY = false;
  const rx = Math.cos(C.yaw), rz = -Math.sin(C.yaw); let px = C.x + rx * 1.4, pz = C.z + rz * 1.4;
  if (waterDepth(px, pz) > 0.3) { px = C.x - rx * 1.4; pz = C.z - rz * 1.4; }
  a.pos.set(px, 0, pz); a.ground(1, true); a.speed = 0;
  if (!quiet) AUD.play('clack', 0.35);
}
function cartStep(dt, dx, dz, mag, wantRun) {
  const a = P.a, C = P.cart, h = C && C.horse;
  if (!C || !h || !h.alive || h.gone || !a || !a.alive || P.sleeping || G.mode !== 'play') { cartLeave(true); return; }
  const fast = wantRun && P.stam > 3 && mag > 0.3, spd = mag < 0.08 ? 0 : fast ? 9 : mag > 0.7 ? 5.5 : 3 * Math.max(0.4, mag);
  if (fast) P.stam = Math.max(0, P.stam - dt * 4); else P.stam = Math.min(100, P.stam + dt * 10);
  P.running = fast;
  if (mag > 0.08) h.yaw += angDiff(h.yaw, Math.atan2(dx, dz)) * Math.min(1, dt * (fast ? 1.5 : 2.1));
  const nx = h.pos.x + Math.sin(h.yaw) * 1.8, nz = h.pos.z + Math.cos(h.yaw) * 1.8, wet = waterDepth(nx, nz) > 0.6;
  h.move(Math.sin(h.yaw), Math.cos(h.yaw), wet ? 0 : spd, dt); h.pose = h.speed > 0.2 ? 'move' : 'idle';
  if (wet && spd > 0 && G.t - (CARTS.wetT || -9) > 4) { CARTS.wetT = G.t; combatText('הכרכרה לא עוברת במים עמוקים', 'bad'); }
  cartFollow(C, h, dt);
  const s = cartDriverSpot(C); a.pos.set(s.x, s.y, s.z); a.yaw = C.yaw; a.speed = 0; a.swimming = false; a.airborne = false; a.vy = 0;
  if (h.speed > 6 && rng() < dt * 3 && h.dCam < 40) FX.spawn('dust', C.x, C.y + 0.1, C.z, 2);
}
const cartDriverSpot = C => { const fx = Math.sin(C.yaw), fz = Math.cos(C.yaw); return { x: C.x + fx * 0.98, z: C.z + fz * 0.98, y: (C.y || getH(C.x, C.z)) + 1.0 }; };
// ---------- passengers ----------
function cartBoard(m, C, k) { m.inCart = C; m.seat = k; m.ownY = true; m.job = null; m.state = 'idle'; m.foe = null; m.hidden = false; }
function cartUnseat(m) {
  const C = m.inCart; m.inCart = null; m.seat = null; if (m.onTower) return;
  m.ownY = false; if (!C) { m.ground(1, true); return; }
  const ang = rng() * TAU; let x = C.x + Math.sin(ang) * 2.2, z = C.z + Math.cos(ang) * 2.2; if (waterDepth(x, z) > 0.3) { x = C.x; z = C.z; }
  m.pos.set(x, 0, z); m.ground(1, true);
}
function cartRide(a) {
  const C = a.inCart; if (!C || !CARTS.list.includes(C) || !C.driver || !a.escort) { cartUnseat(a); return false; }
  const s = cartSeat(C, a.seat || 0); a.pos.set(s.x, s.y, s.z); a.yaw = s.yaw; a.speed = 0; a.pose = 'sit'; a.state = 'idle'; a.hidden = false;
  return true;
}
// escorts who catch up while the hunter drives climb in
function cartBoardLate() {
  const C = P.cart; if (!C || C.v > 2.5) return;
  const used = new Set(clanReal().filter(m => m.inCart === C).map(m => m.seat)); if (used.size >= 4) return;
  for (const m of clanReal()) { if (!m.escort || m.young || m.inCart || !m.alive || Math.hypot(m.pos.x - C.x, m.pos.z - C.z) > 4) continue; let k = 0; while (used.has(k)) k++; if (k >= 4) break; cartBoard(m, C, k); used.add(k); }
}
// ---------- the builders bring wood with it ----------
function cartTripStart(a, v) {
  const C = CARTS.list.find(q => !q.driver && !q.trip && q.shop && Math.hypot(q.x - v.x, q.z - v.z) < villageR() + 40); if (!C) return false;
  const h = cartFindHorse(C, 200); if (!h) return false;
  const free = q => !q.cut && (!q.claim || !q.claim.alive || !q.claim.job || q.claim.job.e !== q);
  let goal = null;
  for (let t = 0; t < 10 && !goal; t++) { const ang = rng() * TAU, r = rr(villageR() + 30, villageR() + 110), x = v.x + Math.cos(ang) * r, z = v.z + Math.sin(ang) * r; if (!inBounds(x, z) || waterDepth(x, z) > 0 || getNY(x, z) < 0.85) continue; const e = treeNearest(x, z, 25, free); if (e) goal = { x, z }; }
  if (!goal) return false;
  C.trip = a; a.job = { k: 'cart', C, h, goal, ph: 'walk', t: 0, T: 240 };
  return true;
}
function cartTrip(a, dt, v) {
  const j = a.job, C = j.C, h = j.h; j.T -= dt;
  const end = () => { if (C.driver === a) C.driver = null; C.trip = null; if (C.horse === h) cartUnharness(C); a.ownY = false; a.ground(1, true); a.job = null; };
  if (!CARTS.list.includes(C) || !h.alive || h.gone || (C.driver && C.driver !== a) || P.cart === C || j.T <= 0) { end(); return; }
  if (j.ph === 'walk') {
    const d = jobGo(a, C.x, C.z, a.sp.walk * 1.2, dt);
    if (d < 2.2) { if (!C.horse) { if (h.harness || h.ridden || h.rider) { end(); return; } cartHarness(C, h); } C.driver = a; a.ownY = true; j.ph = 'out'; j.best = null; j.stk = 0; }
    return;
  }
  const seat = () => { const s = cartDriverSpot(C); a.pos.set(s.x, s.y, s.z); a.yaw = C.yaw; a.pose = 'sit'; a.speed = 0; };
  const drive = (x, z, spd) => {
    const dx = x - h.pos.x, dz = z - h.pos.z, d = Math.hypot(dx, dz) || 0.01;
    h.yaw += angDiff(h.yaw, Math.atan2(dx, dz)) * Math.min(1, dt * 1.6);
    const nx = h.pos.x + Math.sin(h.yaw) * 1.8, nz = h.pos.z + Math.cos(h.yaw) * 1.8;
    if (waterDepth(nx, nz) > 0.5) h.yaw += dt * 1.5;
    if ((h.dCam || 0) > 130 && (a.dCam || 0) > 130) { const st = Math.min(d, spd * dt); h.pos.x += dx / d * st; h.pos.z += dz / d * st; h.yaw = Math.atan2(dx, dz); h.speed = spd; h.ground(1, true); }   // out of sight it simply rolls on
    else { h.move(Math.sin(h.yaw), Math.cos(h.yaw), d < 6 ? spd * 0.5 : spd, dt); h.pose = h.speed > 0.2 ? 'move' : 'idle'; }
    cartFollow(C, h, dt); seat();
    if (d < j.best - 0.5 || j.best == null) { j.best = d; j.stk = 0; } else j.stk += dt;
    return d;
  };
  if (j.ph === 'out') { const d = drive(j.goal.x, j.goal.z, 4.5); if (d < 4 || j.stk > 8) { j.ph = 'load'; j.t = 0; h.speed = 0; } return; }
  if (j.ph === 'load') {
    seat(); a.pose = 'sit'; h.move(0, 0, 0, dt); C.v = 0; j.t += dt;
    if (j.t > 22) {
      let w = 0; for (let k = 0; k < 2; k++) { const e = treeNearest(C.x, C.z, 30, q => !q.cut && !q.claim); if (e) w += treeCut(e, { anim: (e.dCam || 999) < 140 && Math.hypot(camera.position.x - e.x, camera.position.z - e.z) < 140, dir: rng() * TAU }); }
      j.load = Math.max(12, w + 6); j.ph = 'back'; j.best = null; j.stk = 0;
    }
    return;
  }
  if (j.ph === 'back') {
    const d = drive(C.home.x + Math.sin(C.home.yaw) * 4, C.home.z + Math.cos(C.home.yaw) * 4, 4.5);
    if (d < 4.5 || j.stk > 10) {
      if (j.stk > 10 && (C.mesh.visible === false || (a.dCam || 0) > 120)) { C.x = C.home.x; C.z = C.home.z; C.yaw = C.home.yaw; cartPlace(C, 0); }
      boxStore().wood += j.load || 12; tribeNews(`🐴 ${a.name} ${heb(a, 'חזר', 'חזרה')} מהיער עם כרכרה מלאה: ${j.load || 12} עצים`);
      C.x = C.home.x; C.z = C.home.z; C.yaw = C.home.yaw; cartPlace(C, 0); end();
    }
  }
}
// ---------- the clock ----------
function cartsUpdate(dt) {
  // every finished shop has its carriage
  for (const b of BLD.list) if (b.t === 'cartshop' && b.done && !CARTS.list.some(C => C.shop === b)) { const p = cartHome(b), C = cartAdd(p.x, p.z, p.yaw, b); C.home = p; if (!CARTS.made) { CARTS.made = 1; UI.notify(`🐴 הכרכרה מוכנה, ליד ${BTYPES.cartshop.dn}. ${TOUCH ? 'כפתור הזהב' : 'E'} לידה: לרתום סוס ולנהוג`, 'good'); } }
  for (const C of CARTS.list.slice()) { if (C.shop && !BLD.list.includes(C.shop)) cartRemove(C); else if (C.shop && (C.hx !== C.shop.x || C.hz !== C.shop.z)) { const first = C.hx == null; C.hx = C.shop.x; C.hz = C.shop.z; C.home = cartHome(C.shop); if (!first && !C.driver && !C.trip) { C.x = C.home.x; C.z = C.home.z; C.yaw = C.home.yaw; cartPlace(C, 0); } } }
  if (P.cart) cartBoardLate();
  // a carriage nobody drives rests where it was left; parked far from home, it is brought back after a while
  for (const C of CARTS.list) {
    if (C.driver) continue;
    if (C.horse && !C.trip) cartUnharness(C);
    if (C.shop && Math.hypot(C.x - C.home.x, C.z - C.home.z) > 6 && Math.hypot(camera.position.x - C.x, camera.position.z - C.z) > 140 && Math.hypot(camera.position.x - C.home.x, camera.position.z - C.home.z) > 140) { C.x = C.home.x; C.z = C.home.z; C.yaw = C.home.yaw; cartPlace(C, 0); }
    C.mesh.visible = Math.hypot(camera.position.x - C.x, camera.position.z - C.z) < 300;
  }
  // horses left far from the stable after a drive go home in the end
  for (const h of tribeHorses()) if (h.homeBack && G.t > h.homeBack && !h.harness && !h.ridden) { h.homeBack = 0; if (h.stableB) h.home.set(h.stableB.x, 0, h.stableB.z); }
}
function cartsSave() { return { c: CARTS.list.map(C => [+C.x.toFixed(1), +C.z.toFixed(1), +C.yaw.toFixed(2), C.shop ? BLD.list.indexOf(C.shop) : -1]), t: CARTS.told, m: CARTS.made || 0 }; }
function cartsReset() { if (P.cart) cartLeave(true); for (const C of CARTS.list.slice()) cartRemove(C); CARTS.told = 0; CARTS.made = 0; }
function cartsLoad(d) {
  cartsReset(); if (!d) return;
  CARTS.told = d.t || 0; CARTS.made = d.m || 0;
  for (const [x, z, yaw, si] of d.c || []) { const b = BLD.list[si]; if (!b || b.t !== 'cartshop') continue; const C = cartAdd(x, z, yaw, b); C.home = cartHome(b); }
}
// ================= SHIPS: only a city can build them. A shipyard on a wide water launches a big sailing ship =================
// The ship needs deep, wide water: a lake or the great river. The hunter takes the helm; the people who walk with him stand
// on the deck. A closed water gate stops it, and a bridge is too low for its mast. When the hunter is not sailing it, the
// fishermen take it out and come back with a hold full of fish.
BTYPES.shipyard = { n: 'מספנה', dn: 'המספנה', g: 'f', d: 'רק עיר יכולה: בונים ספינה גדולה עם מפרש. שטים בה רחוק, עם האנשים שהולכים איתך על הסיפון, והדייגים יוצאים בה ומביאים הרבה דגים', wood: 70, work: 160, r: 3.4, need: 0, tier: 4, ic: '⛵', shore: 1, ship: 1, g2: 'f' };
CTXT.ship = ['boat', 'להפליג', 'לעלות לספינה ולהפליג'];
CTXT.unship = ['boat', 'לחוף', 'לרדת מהספינה לחוף'];
const SHIPS = { list: [], geo: null, told: 0, made: 0 };
const SHIP_DRAFT = 0.85, SHIP_L = 9.6;
BGEOX.shipyard = A => {
  A(new THREE.BoxGeometry(5.2, 0.3, 4.4), [0, 0.15, -0.6], null, null, '#6b4a2c', 0.16);                  // the yard on the bank
  for (let i = 0; i < 9; i++) A(new THREE.BoxGeometry(0.3, 0.12, 7.4), [-1.6 + i * 0.4, 0.05 - 0.02 * i, 3.8], [-0.16, 0, 0], null, i % 2 ? '#7a5a34' : '#6b4a2c', 0.14);   // the slipway into the water
  for (const s of [-1, 1]) { A(new THREE.BoxGeometry(0.34, 6.4, 0.34), [s * 2.4, 3.2, 0.6], null, null, WOOD); A(new THREE.BoxGeometry(0.2, 0.2, 2.6), [s * 2.4, 5.8, 1.5], [0.5, 0, 0], null, WOOD); }
  A(new THREE.BoxGeometry(5.2, 0.32, 0.36), [0, 6.3, 0.6], null, null, '#5c4128');                        // the crane beam
  A(new THREE.CylinderGeometry(0.03, 0.03, 3.4, 4), [0.8, 4.6, 0.6], null, null, '#c9b48a', 0.05);         // a rope
  A(new THREE.BoxGeometry(0.5, 0.5, 0.5), [0.8, 2.9, 0.6], null, null, '#4a3220');
  // the ribs of the next ship
  for (let i = 0; i < 6; i++) A(new THREE.TorusGeometry(1.25 - Math.abs(i - 2.5) * 0.12, 0.07, 4, 12, Math.PI), [0, 1.35, -1.6 + i * 0.7], [Math.PI, 0, 0], null, '#8a6a42', 0.12);
  A(new THREE.BoxGeometry(0.22, 0.22, 4.4), [0, 0.3, 0.1], null, null, '#5c4128');
  for (let i = 0; i < 5; i++) A(new THREE.BoxGeometry(3.2, 0.12, 0.34), [-0.4, 0.36 + i * 0.13, -2.4 + (i % 2) * 0.06], [0, 0.05 * i, 0], null, '#a07a4a', 0.2);
  A(new THREE.BoxGeometry(1.8, 1.6, 1.4), [1.6, 1.0, -2.1], null, null, WALL, 0.2);
  A(new THREE.ConeGeometry(1.5, 1.0, 4), [1.6, 2.3, -2.1], [0, Math.PI / 4, 0], null, TH, 0.2);
};
// the hull: stations along the keel, each a curve from the deck edge down to the keel
function hullGeo(L, W, D) {
  const n = 18, sec = [], pos = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, z = (t - 0.5) * L, k = Math.abs(t - 0.5) * 2, w = W / 2 * Math.pow(Math.max(0, 1 - Math.pow(k, 2.6)), 0.55), sh = (t > 0.5 ? 0.55 : 0.35) * Math.pow(k, 3), d = D * (1 - 0.35 * Math.pow(k, 4));
    const P = []; for (let j = 0; j <= 6; j++) { const a = j / 6 * Math.PI; P.push([Math.cos(a) * w, sh - Math.sin(a) * d + 0.2 * (1 - Math.sin(a)), z]); } sec.push(P);
  }
  const tri = (a, b, c) => pos.push(...a, ...b, ...c);
  for (let i = 0; i < n; i++) for (let j = 0; j < 6; j++) { const a = sec[i][j], b = sec[i + 1][j], c = sec[i + 1][j + 1], d = sec[i][j + 1]; tri(a, b, c); tri(a, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); return g;
}
function deckGeo(L, W) {
  const n = 18, pos = [];
  for (let i = 0; i < n; i++) {
    const w = t => { const k = Math.abs(t - 0.5) * 2; return W / 2 * Math.pow(Math.max(0, 1 - Math.pow(k, 2.6)), 0.55) * 0.96; }, sh = t => (t > 0.5 ? 0.55 : 0.35) * Math.pow(Math.abs(t - 0.5) * 2, 3) + 0.18;
    const t0 = i / n, t1 = (i + 1) / n, z0 = (t0 - 0.5) * L, z1 = (t1 - 0.5) * L;
    pos.push(-w(t0), sh(t0), z0, w(t1), sh(t1), z1, w(t0), sh(t0), z0, -w(t0), sh(t0), z0, -w(t1), sh(t1), z1, w(t1), sh(t1), z1);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); return g;
}
function shipGeo() {
  if (SHIPS.geo) return SHIPS.geo;
  const G1 = new GB(), A = (geo, p, r, s, c, v) => G1.add(geo, M(p, r, s), c, v), L = SHIP_L, W = 2.9;
  A(hullGeo(L, W, 1.3), null, null, null, '#5c4128', 0.12);
  A(deckGeo(L, W), [0, 0.02, 0], null, null, '#a07a4a', 0.16);
  for (const s of [-1, 1]) A(new THREE.BoxGeometry(0.1, 0.32, L * 0.8), [s * W * 0.47, 0.42, 0], null, null, '#4a3220');   // the rails
  for (const s of [-1, 1]) for (let i = 0; i < 6; i++) A(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 12), [s * W * 0.5, 0.32, -2.5 + i * 1.0], [0, 0, Math.PI / 2], null, i % 2 ? '#b3321f' : '#e8d8a8', 0.08);   // shields
  for (const s of [-1, 1]) for (let i = 0; i < 4; i++) A(new THREE.BoxGeometry(0.08, 0.08, 3.0), [s * (W * 0.5 + 0.9), -0.25, -1.8 + i * 1.2], [0.3, s * 1.2, 0], null, '#7a5a34');   // oars
  A(new THREE.CylinderGeometry(0.13, 0.17, 7.6, 8), [0, 3.9, 0.6], null, null, '#4a3220');            // the mast
  A(new THREE.CylinderGeometry(0.08, 0.08, 4.4, 6), [0, 6.6, 0.75], [0, 0, Math.PI / 2], null, '#4a3220');   // the yard
  A(new THREE.BoxGeometry(1.9, 1.1, 1.7), [0, 0.75, -3.1], null, null, '#6b4a2c', 0.14);              // the stern cabin
  A(new THREE.BoxGeometry(2.1, 0.12, 1.9), [0, 1.36, -3.1], null, null, '#4a3220');
  A(new THREE.BoxGeometry(0.14, 0.14, 2.6), [0.7, 0.2, -5.0], [0.55, 0, 0], null, '#5c4128');           // the steering oar
  A(new THREE.ConeGeometry(0.22, 0.9, 6), [0, 1.25, L / 2 + 0.1], [-0.6, 0, 0], null, '#b3321f');       // the prow
  const body = G1.build();
  const G2 = new GB(), S = (geo, p, r, s, c, v) => G2.add(geo, M(p, r, s), c, v);
  for (let i = 0; i < 5; i++) S(new THREE.PlaneGeometry(4.2, 0.92, 6, 1), [0, 6.1 - 0.92 * (i + 0.5), 0.82], null, null, i % 2 ? '#b3321f' : '#efe3c4', 0.06);   // the striped sail
  SHIPS.geo = { body, sail: G2.build() };
  return SHIPS.geo;
}
function shipAdd(x, z, yaw, yard) {
  if (!BLD.mat) BLD.mat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
  const g = shipGeo(), root = new THREE.Group(), body = new THREE.Mesh(g.body, BLD.mat), sail = new THREE.Mesh(g.sail, BLD.mat);
  body.castShadow = true; sail.castShadow = true; root.add(body); root.add(sail); scene.add(root);
  const S = { x, z, yaw, mesh: root, sail, yard: yard || null, user: null, v: 0, crew: [], home: { x, z, yaw } };
  SHIPS.list.push(S); shipPlace(S, 0); return S;
}
function shipRemove(S) { if (P.ship === S) shipLeave(true); for (const m of clanReal()) if (m.inShip === S) shipUnseat(m); scene.remove(S.mesh); const i = SHIPS.list.indexOf(S); if (i >= 0) SHIPS.list.splice(i, 1); }
function shipPlace(S, t) {
  const w = waterAtT(S.x, S.z), y = (w > -900 ? w : getH(S.x, S.z)) + 0.5 + Math.sin(t * 1.1 + S.x) * 0.06;
  S.mesh.position.set(S.x, y, S.z); S.mesh.rotation.set(Math.sin(t * 0.9 + S.z) * 0.025, S.yaw, Math.sin(t * 0.7 + S.x) * 0.035 - S.turn * 0.12 || 0, 'YXZ');
  S.sail.scale.z = 1 + Math.sin(t * 2.3 + S.x) * 0.06 + Math.min(1, S.v / 5) * 0.35; S.y = y;
}
// can the ship be here: deep enough under the whole hull, no closed gate, no bridge over it
function shipFits(x, z, yaw) {
  const fx = Math.sin(yaw), fz = Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
  for (const [f, r] of [[4.6, 0], [2.5, 1.1], [2.5, -1.1], [0, 1.3], [0, -1.3], [-2.8, 1.1], [-2.8, -1.1], [-4.6, 0]]) {
    const px = x + fx * f + rx * r, pz = z + fz * f + rz * r;
    if (!inWorld(px, pz) || waterDepthT(px, pz) < SHIP_DRAFT) return 'shallow';
    if (BRG.n && getH(px, pz) > getHT(px, pz) + 0.5) return 'bridge';
  }
  if (DEF.wg.length && wgClosedNear(x + fx * 3.5, z + fz * 3.5, 2.2)) return 'gate';
  return '';
}
// ---------- the shipyard: on the bank of deep, wide water ----------
function shipyardCheck(x, z, rot) {
  if (waterDepthT(x, z) > 0.25) return 'המספנה נבנית על שפת המים, לא בתוך המים';
  const p = shoreProbe(x, z, 8); if (!p) return 'צריך לעמוד ליד המים ולהסתכל אל המים';
  if (p.d > 3.5) return `קרוב יותר לשפת המים (${Math.round(p.d)} מ׳)`;
  const f = rot != null ? rot : dockFace(x, z), fx = Math.sin(f), fz = Math.cos(f), rx = Math.cos(f), rz = -Math.sin(f);
  let deep = 0; for (let s = 4; s <= 18; s += 0.5) if (waterDepthT(x + fx * s, z + fz * s) >= 1.2) deep++;
  if (deep < 18) return 'המים כאן רדודים או צרים מדי לספינה: צריך אגם או נהר רחב ועמוק';
  let wide = 0; for (const s of [-6, -4, 4, 6]) if (waterDepthT(x + fx * 11 + rx * s, z + fz * 11 + rz * s) >= 1.0) wide++;
  if (wide < 3) return 'המים כאן צרים מדי לספינה גדולה';
  for (const b of BLD.list) if (b !== BLD.moveB && bldDist(b, x, z) < BTYPES.shipyard.r + bldR(b) + 0.6) return `צמוד מדי ל${BTYPES[b.t].n}`;
  return '';
}
// the best bank for a shipyard near the village: the most open deep water in front of it
function shipyardSpot(v) {
  let best = null, bs = -1e9; const R = DOCK_R() + 20;
  for (let ring = 10; ring <= R; ring += 4) {
    const n = Math.max(12, Math.round(ring * 0.7));
    for (let k = 0; k < n; k++) {
      const ang = k / n * TAU, x = v.x + Math.cos(ang) * ring, z = v.z + Math.sin(ang) * ring;
      if (waterDepthT(x, z) > 0 || waterDist(x, z) > 18) continue;
      const p = shoreProbe(x, z, 5); if (!p) continue;
      const s = bankFrom(x + Math.sin(p.a) * p.d, z + Math.cos(p.a) * p.d, p.a);
      if (buildCheck('shipyard', s.x, s.z, s.rot) || zoneTribeAt(s.x, s.z) >= 0) continue;
      let open = 0; for (let q = -3; q <= 3; q++) { const a2 = s.rot + q * 0.3; for (let d = 6; d <= 40; d += 4) if (waterDepthT(s.x + Math.sin(a2) * d, s.z + Math.cos(a2) * d) >= 1.1) open++; }
      const sc = open - Math.hypot(s.x - v.x, s.z - v.z) * 0.05 + rng() * 0.5; if (sc > bs) { bs = sc; best = s; }
    }
  }
  return best;
}
function shipHome(b) {
  const fx = Math.sin(b.rot), fz = Math.cos(b.rot);
  for (let s = 9; s <= 22; s += 1) { const x = b.x + fx * s, z = b.z + fz * s; if (!shipFits(x, z, b.rot + Math.PI / 2)) return { x, z, yaw: b.rot + Math.PI / 2 }; }
  for (let s = 9; s <= 22; s += 1) { const x = b.x + fx * s, z = b.z + fz * s; if (!shipFits(x, z, b.rot)) return { x, z, yaw: b.rot }; }
  return { x: b.x + fx * 12, z: b.z + fz * 12, yaw: b.rot };
}
// ---------- the hunter at the helm ----------
function shipNear() {
  const a = P.a; let best = null, bd = 9;
  for (const S of SHIPS.list) { if (S.user) continue; const d = Math.hypot(S.x - a.pos.x, S.z - a.pos.z); if (d < bd) { bd = d; best = S; } }
  return best;
}
function shipCtx() {
  if (P.ship) return landNear(P.ship.x, P.ship.z, 9) && P.ship.v < 1.2 ? 'unship' : 'shipno';
  const a = P.a; if (!P.human || P.ride || P.boat || P.cart || P.climb) return null;
  return shipNear() ? 'ship' : null;
}
XCTX_TOP.push(() => { const c = shipCtx(); return c === 'shipno' ? null : c; });
CTXH.ship = () => { if (CLB.latch) return; CLB.latch = true; const S = shipNear(); if (S) shipEnter(S); };
CTXH.unship = () => { if (CLB.latch) return; CLB.latch = true; shipLeave(); };
function shipEnter(S) {
  const a = P.a; if (S.user) return;
  if (S.trip) shipTripAbort(S);
  P.ship = S; S.user = a; S.v = 0; a.ownY = true; a.swimming = false; P.dive = false; a.dive = false; P.crouch = false; P.resting = false; CAM.yaw = S.yaw;
  let k = 0; for (const m of clanReal()) { if (k >= 6) break; if (m.escort && !m.young && !m.inShip && m.alive && Math.hypot(m.pos.x - S.x, m.pos.z - S.z) < 35) shipBoard(m, S, k++); }
  PROG.flags.ship = 1; AUD.play('splash', 0.5);
  if (!SHIPS.told) { SHIPS.told = 1; UI.notify(TOUCH ? '⛵ הספינה שלך! הג׳ויסטיק מכוון, ריצה: לחתור מהר. ליד החוף, כפתור הזהב: לרדת. מי שהולך איתך עולה לסיפון' : '⛵ הספינה שלך! WASD מכוונים, Shift: לחתור מהר. ליד החוף, E: לרדת. מי שהולך איתך עולה לסיפון', 'good'); }
}
function shipLeave(quiet) {
  const S = P.ship, a = P.a; P.ship = null; if (!S) return;
  S.user = null; S.v = 0;
  const L = landNear(S.x, S.z, 12);
  for (const m of clanReal()) if (m.inShip === S) shipUnseat(m, L);
  if (!a) return;
  a.ownY = false;
  if (L) a.pos.set(L.x, 0, L.z); else a.pos.set(S.x + Math.cos(S.yaw) * 2.2, 0, S.z - Math.sin(S.yaw) * 2.2);
  a.ground(1, true); a.speed = 0;
  if (!quiet) AUD.play('splash', 0.35);
}
const shipHelm = S => { const fx = Math.sin(S.yaw), fz = Math.cos(S.yaw); return { x: S.x - fx * 3.9, z: S.z - fz * 3.9, y: (S.y || waterAtT(S.x, S.z) + 0.5) + 0.42 }; };
function shipStep(dt, dx, dz, mag, wantRun) {
  const a = P.a, S = P.ship;
  if (!S || S.user !== a || !a.alive || G.mode !== 'play') { shipLeave(true); return; }
  const want = Math.atan2(dx, dz), fwd = mag > 0.08 ? Math.max(0, Math.cos(angDiff(S.yaw, want))) * mag : 0;
  const turn = mag > 0.08 ? clamp(angDiff(S.yaw, want), -1, 1) : 0;
  S.turn = turn; S.yaw += turn * dt * (0.35 + Math.min(0.45, S.v * 0.08));
  const fast = wantRun && P.stam > 4 && fwd > 0.2, top = fast ? 7.5 : 5;
  S.v += (fwd * top - S.v) * Math.min(1, dt * (fwd > 0 ? 0.35 : 0.25));
  if (fast) P.stam = Math.max(0, P.stam - dt * 5); else P.stam = Math.min(100, P.stam + dt * 9);
  P.running = fast;
  const nx = S.x + Math.sin(S.yaw) * S.v * dt, nz = S.z + Math.cos(S.yaw) * S.v * dt, why = shipFits(nx, nz, S.yaw);
  if (!why) { S.x = nx; S.z = nz; seaWind(S, dt, SHIP_DRAFT); }
  else {
    if (Math.abs(S.v) > 0.5 && G.t - (SHIPS.bumpT || -9) > 2.5) { SHIPS.bumpT = G.t; AUD.play('splash', 0.3); combatText(why === 'bridge' ? 'הספינה גבוהה מדי לעבור מתחת לגשר' : why === 'gate' ? 'שער המים סגור' : 'רדוד מדי לספינה', 'bad'); }
    S.v *= -0.2;
  }
  shipPlace(S, G.t);
  const h = shipHelm(S); a.pos.set(h.x, h.y, h.z); a.yaw = S.yaw; a.speed = 0; a.swimming = false; a.airborne = false; a.vy = 0;
  if (S.v > 2 && rng() < dt * 3 && S.mesh.visible) FX.spawn('splash', S.x + Math.sin(S.yaw) * 4.8, waterAtT(S.x, S.z), S.z + Math.cos(S.yaw) * 4.8, 3);
}
// ---------- people on the deck ----------
const DECK = [[0.8, 1.6], [-0.8, 1.6], [0.8, -0.6], [-0.8, -0.6], [0.7, 2.9], [-0.7, 2.9]];
function shipBoard(m, S, k) { m.inShip = S; m.seat = k; m.ownY = true; m.job = m.job && m.job.k === 'ship' ? m.job : null; m.state = 'idle'; m.foe = null; m.hidden = false; m.swimming = false; }
function shipUnseat(m, L) {
  const S = m.inShip; m.inShip = null; m.seat = null; m.ownY = false;
  const at = L || (S ? landNear(S.x, S.z, 14) : null);
  if (at) m.pos.set(at.x + rr(-1.2, 1.2), 0, at.z + rr(-1.2, 1.2)); else if (S) m.pos.set(S.x, 0, S.z);
  m.ground(1, true);
}
function shipRide(a) {
  const S = a.inShip; if (!S || !SHIPS.list.includes(S) || (!S.user && !S.trip)) { shipUnseat(a); return false; }
  if (S.user === P.a && !a.escort) { shipUnseat(a); return false; }
  const [r, f] = DECK[(a.seat || 0) % DECK.length], fx = Math.sin(S.yaw), fz = Math.cos(S.yaw), rx = Math.cos(S.yaw), rz = -Math.sin(S.yaw);
  a.pos.set(S.x + rx * r + fx * f, (S.y || waterAtT(S.x, S.z) + 0.5) + 0.24, S.z + rz * r + fz * f); a.yaw = S.yaw + (r > 0 ? -0.6 : 0.6); a.speed = 0; a.pose = S.trip && S.trip.ph === 'fish' ? 'fish' : 'idle'; a.state = 'idle'; a.hidden = false;
  return true;
}
// ---------- the fishermen take the ship out ----------
function shipTripStart(a, v) {
  const S = SHIPS.list.find(q => !q.user && !q.trip && q.yard && Math.hypot(q.x - v.x, q.z - v.z) < villageR() + 140); if (!S) return false;
  // open water: how far the ship can sail straight out in each direction; one of the long ways, most of the way out
  const ways = [];
  for (let k = 0; k < 16; k++) { const yw = k / 16 * TAU, fx = Math.sin(yw), fz = Math.cos(yw); let far = 0; for (let r = 5; r <= 120; r += 5) { if (shipFits(S.x + fx * r, S.z + fz * r, yw)) break; far = r; } if (far >= 18) ways.push({ yw, far }); }
  if (!ways.length) return false;
  const w = pick(ways), r = w.far * rr(0.55, 0.85), goal = { x: S.x + Math.sin(w.yw) * r, z: S.z + Math.cos(w.yw) * r };
  if (!goal) return false;
  S.trip = { cap: a, goal, ph: 'board', t: 0, T: 260, crew: [a] };
  a.job = { k: 'ship', S };
  // one or two more hands come along
  for (const m of clanAdults()) { if (S.trip.crew.length >= 3) break; if (m !== a && m.brain === 'tribe' && !m.ord && !m.escort && !m.towerB && !m.inCart && !m.inShip && (m.cls === 'gatherer' || m.cls === 'hunter') && (!m.job || m.job.k === 'rest') && Math.hypot(m.pos.x - S.x, m.pos.z - S.z) < 120) { m.job = { k: 'ship', S }; S.trip.crew.push(m); } }
  return true;
}
function shipTripAbort(S) { const tr = S.trip; if (!tr) return; S.trip = null; for (const m of tr.crew) { if (m.job && m.job.k === 'ship') m.job = null; if (m.inShip === S) shipUnseat(m); } }
function shipTrip(a, dt, v) {
  const S = a.job.S, tr = S && S.trip;
  if (!S || !SHIPS.list.includes(S) || !tr || !tr.crew.includes(a) || S.user) { if (a.inShip) shipUnseat(a); a.job = null; return; }
  if (tr.cap !== a) { if (!a.inShip) { const L = landNear(S.x, S.z, 14) || S, d = jobGo(a, L.x, L.z, a.sp.walk * 1.2, dt); if (d < 2.5 || tr.ph !== 'board') shipBoard(a, S, tr.crew.indexOf(a) + 1); } else shipRide(a); return; }
  tr.T -= dt;
  if (tr.ph === 'board') {
    const L = landNear(S.x, S.z, 14) || S, d = jobGo(a, L.x, L.z, a.sp.walk * 1.2, dt);
    if (d < 2.5 || (a.dCam || 0) > 120) { shipBoard(a, S, 0); tr.ph = 'out'; tr.best = null; tr.stk = 0; }
    return;
  }
  shipRide(a); a.pos.set(shipHelm(S).x, shipHelm(S).y, shipHelm(S).z); a.yaw = S.yaw; a.pose = tr.ph === 'fish' ? 'fish' : 'idle';
  const sail = (x, z) => {
    const dx = x - S.x, dz = z - S.z, d = Math.hypot(dx, dz) || 0.01, want = Math.atan2(dx, dz);
    S.turn = clamp(angDiff(S.yaw, want), -1, 1); S.yaw += S.turn * dt * 0.6;
    S.v += (Math.max(0, Math.cos(angDiff(S.yaw, want))) * (d < 12 ? 2.2 : 4.2) - S.v) * Math.min(1, dt * 0.4);
    const nx = S.x + Math.sin(S.yaw) * S.v * dt, nz = S.z + Math.cos(S.yaw) * S.v * dt;
    if (!shipFits(nx, nz, S.yaw)) { S.x = nx; S.z = nz; } else { S.v *= 0.3; S.yaw += dt * 0.8; }
    shipPlace(S, G.t);
    if (d < tr.best - 0.5 || tr.best == null) { tr.best = d; tr.stk = 0; } else tr.stk += dt;
    return d;
  };
  if (tr.ph === 'out') { const d = sail(tr.goal.x, tr.goal.z); if (d < 6 || tr.stk > 12 || tr.T < 120) { tr.ph = 'fish'; tr.t = 0; } return; }
  if (tr.ph === 'fish') { S.v *= Math.max(0, 1 - dt); shipPlace(S, G.t); tr.t += dt; if (tr.t > 30) { tr.ph = 'back'; tr.best = null; tr.stk = 0; tr.n = 8 + Math.round(rng() * 6 + wildK() * 6); } return; }
  if (tr.ph === 'back') {
    const d = sail(S.home.x, S.home.z);
    if (d < 4 || tr.stk > 14 || tr.T <= 0) {
      if (d >= 4) { S.x = S.home.x; S.z = S.home.z; } S.yaw = S.home.yaw; S.v = 0; shipPlace(S, G.t);
      boxStore().fish += tr.n || 10; tribeNews(`⛵ הספינה חזרה מהדייג עם ${tr.n || 10} דגים`);
      shipTripAbort(S);
    }
  }
}
// ---------- the clock, save and load ----------
function shipsUpdate(dt) {
  for (const b of BLD.list) if (b.t === 'shipyard' && b.done && !SHIPS.list.some(S => S.yard === b)) { const p = shipHome(b), S = shipAdd(p.x, p.z, p.yaw, b); S.home = p; if (!SHIPS.made) { SHIPS.made = 1; UI.big('ספינה!', `הספינה הראשונה ירדה למים ליד ${BTYPES.shipyard.dn}. ${TOUCH ? 'כפתור הזהב' : 'E'} לידה: לעלות ולהפליג`); AUD.play('cheer', 0.6); } }
  for (const S of SHIPS.list.slice()) { if (S.yard && !BLD.list.includes(S.yard)) shipRemove(S); else if (S.yard && (S.hx !== S.yard.x || S.hz !== S.yard.z)) { S.hx = S.yard.x; S.hz = S.yard.z; S.home = shipHome(S.yard); } }
  const t = G.t, cp = camera.position;
  for (const S of SHIPS.list) {
    const d = Math.hypot(cp.x - S.x, cp.z - S.z); S.mesh.visible = d < 420;
    if (S.user || S.trip) continue;
    S.v = 0; S.turn = 0;
    if (S.yard && Math.hypot(S.x - S.home.x, S.z - S.home.z) > 3 && d > 160 && Math.hypot(cp.x - S.home.x, cp.z - S.home.z) > 160) { S.x = S.home.x; S.z = S.home.z; S.yaw = S.home.yaw; }
    if (S.mesh.visible) shipPlace(S, t);
  }
  // people who walk with the hunter step aboard when they reach the ship
  const S = P.ship; if (S && S.v < 1.5) { const used = new Set(clanReal().filter(m => m.inShip === S).map(m => m.seat)); for (const m of clanReal()) { if (used.size >= 6) break; if (!m.escort || m.young || m.inShip || Math.hypot(m.pos.x - S.x, m.pos.z - S.z) > 6) continue; let k = 0; while (used.has(k)) k++; shipBoard(m, S, k); used.add(k); } }
}
function shipsSave() { return { s: SHIPS.list.map(S => [+S.x.toFixed(1), +S.z.toFixed(1), +S.yaw.toFixed(2), S.yard ? BLD.list.indexOf(S.yard) : -1]), t: SHIPS.told, m: SHIPS.made }; }
function shipsReset() { if (P.ship) shipLeave(true); for (const S of SHIPS.list.slice()) { shipTripAbort(S); shipRemove(S); } SHIPS.told = 0; SHIPS.made = 0; }
function shipsLoad(d) {
  shipsReset(); if (!d) return;
  SHIPS.told = d.t || 0; SHIPS.made = d.m || 0;
  for (const [x, z, yaw, yi] of d.s || []) { const b = BLD.list[yi]; if (!b || b.t !== 'shipyard') continue; const S = shipAdd(x, z, yaw, b); S.home = shipHome(b); if (shipFits(x, z, yaw)) { S.x = S.home.x; S.z = S.home.z; S.yaw = S.home.yaw; shipPlace(S, 0); } }
}
