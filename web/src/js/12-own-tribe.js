// ================= YOUR OWN TRIBE: classes that really work, food for everyone, a village that keeps growing =================
const CLAN = { t: 0, gh: 0, eatAcc: 0, hungry: 0, residents: 0, water: 0, dayK: -1, resAcc: { meat: 0, cooked: 0, wood: 0, fell: 0, kill: 0 }, msgT: 0, feedT: 0 };
const WORK = ['warrior', 'hunter', 'builder', 'gatherer'];
const MAXREAL = 30;
const clanReal = () => tribeAll().filter(m => m.alive && !m.gone);
const clanAdults = () => clanReal().filter(m => !m.young);
function popCount() { return 1 + clanReal().length + CLAN.residents; }
const bigBuildings = () => BLD.list.reduce((n, b) => n + (b.t === 'torch' || BTYPES[b.t].def ? 0 : 1), 0);
function villageR() { const c = ownCamp(); return c ? 16 + 4 * Math.sqrt(popCount()) + 1.3 * bigBuildings() : 0; }
function housing() { return 6 + (CAMPH.up.tents ? 4 : 0) + BLD.list.reduce((s, b) => s + (b.done ? (BTYPES[b.t].cap || 0) : 0), 0); }
function clsCount(k) { return clanAdults().filter(m => m.cls === k).length; }
function bestCls() { const want = { warrior: 0.2, hunter: 0.3, builder: 0.25, gatherer: 0.25 }, n = clanAdults().length + 1; let best = 'builder', bs = 1e9; for (const k of WORK) { const s = clsCount(k) / n - want[k]; if (s < bs) { bs = s; best = k; } } return best; }
function setCls(m, cls, quiet) {
  if (!m || m.young) return;
  // a knight is a warrior and a merchant is a gatherer: another class ends the role (a knight keeps the armour he paid for)
  if (cls !== 'warrior') m.knight = false; if (cls !== 'gatherer') m.merchant = false;
  caravanAbort(m);
  m.cls = cls; m.job = null; m.state = 'idle'; m.foe = null;
  roleApply(m);
  retemplate(m, memberTpl(m));
  if (!quiet) { say(m, ROLE_SAY[roleOf(m)] || 'בסדר'); UI.notify(`${m.name} ${heb(m, 'הוא', 'היא')} עכשיו ${clsWord(m)}`, 'good'); }
}
// joining your tribe (a woman, a newcomer, a grown child): everyone gets a class and your colors
function tribeJoin(t) {
  for (const c of HUNT.camps) { const i = (c.hunters || []).indexOf(t); if (i >= 0) c.hunters.splice(i, 1); }
  Object.assign(t, { brain: 'tribe', tribe: true, hunter: false, socialExtra: true, camp: null, elite: false, fleeing: false, duel: false, raider: null });
  if (!t.name) t.name = tribeName(t.sex);
  if (!t.uid) t.uid = ++CLAN.uidN;
  if (!t.pets) t.pets = [];
  if (t.young) { t.cls = 'child'; return; }
  if (!WORK.includes(t.cls)) setCls(t, t.isPartner ? 'gatherer' : bestCls(), true);
  else retemplate(t, memberTpl(t));
}
function tribeAdult(c) {
  if (!P.human) return; c.young = false; c.cub = false; c.cls = null; tribeJoin(c);
  if (!TRIBE.adults.includes(c)) TRIBE.adults.push(c);
  if (c.home && ownCamp()) c.home.set(ownCamp().x, 0, ownCamp().z);
}
function tribeSave() {
  return TRIBE.adults.filter(b => b.alive && !b.gone).map(b => {
    const o = { n: b.name, s: b.sex, c: b.young ? 'child' : b.cls || 'builder', e: !!b.escort, u: b.uid };
    if (b.young) { o.y = 1; o.k = +(b.kidAge || 0).toFixed(2); }
    if (b.spouse && b.spouse.alive && !b.spouse.gone) o.sp = b.spouse.uid;
    if (b.clsLock) o.l = 1; if (b.preg > 0) o.pr = +b.preg.toFixed(2); if (b.birthCD > 0) o.bc = +b.birthCD.toFixed(1);
    if (b.momU) o.m = b.momU; if (b.dadU) o.d = b.dadU; if (b.wpn) o.w = b.wpn;
    if (b.knight) o.kn = 1; if (b.merchant) o.me = 1; if (b.knightPaid) o.kp = 1; if (b.oldHome != null) o.cf = b.oldHome;
    return o;
  });
}
function tribeLoad(list) {
  const v = ownCamp(), at = v || P.a.pos, made = [];
  for (const t0 of list || []) {
    const young = !!t0.y, cls = young ? 'child' : WORK.includes(t0.c) ? t0.c : t0.r === 'guard' ? 'warrior' : 'builder';
    const kn = !young && !!t0.kn && cls === 'warrior', me = !young && !!t0.me && cls === 'gatherer';
    const b = new Animal('hunter', at.x + rr(-4, 4), at.z + rr(-4, 4), { sex: t0.s, tpl: young ? vxKidTpl(t0.s) : ensureTribal(kn ? 'knight' : me ? 'merchant' : cls, 'own', t0.s, kn || me || (cls === 'warrior' && t0.w === 'sword') || cls === 'hunter'), young }); b.ground(1, true);
    b.name = t0.n; b.cls = cls; if (t0.u) b.uid = t0.u;
    b.knight = kn; b.merchant = me; b.knightPaid = !!t0.kp; if (t0.cf != null) b.oldHome = t0.cf;
    if (young) { b.kidAge = t0.k || 0; kidScale(b); }
    b.clsLock = !!t0.l; b.preg = t0.pr || 0; b.birthCD = t0.bc || 0; b.momU = t0.m || 0; b.dadU = t0.d || 0; b._spU = t0.sp || 0; if (t0.w) b.wpn = t0.w;
    tribeJoin(b); roleApply(b); b.escort = t0.e ?? (t0.r === 'follow' && !v); TRIBE.adults.push(b); made.push(b);
  }
  for (const b of made) { if (b._spU) { const o = made.find(q => q.uid === b._spU); if (o) b.spouse = o; } b._spU = 0; }
}
function clanReset() { CLAN.tname = ''; CLAN.rmix = null; CLAN.residents = 0; CLAN.eatAcc = 0; CLAN.hungry = 0; CLAN.water = 0; CLAN.dayK = -1; CLAN.pmK = -1; CLAN.resAcc = { meat: 0, cooked: 0, wood: 0, fell: 0, kill: 0 }; CLAN.uidN = 0; CLAN.autoRoles = true; CLAN.autoBuild = true; CLAN.autoClear = true; CLAN.planFail = {}; CLAN.planT = 20; CLAN.roleT = 40; CLAN.wedT = 60; }
function clanSave() { return { tn: CLAN.tname || '', rm: CLAN.rmix || null, res: CLAN.residents, hun: +CLAN.hungry.toFixed(3), w: CLAN.water, day: CLAN.dayK, pm: CLAN.pmK, uid: CLAN.uidN, ar: CLAN.autoRoles ? 1 : 0, ab: CLAN.autoBuild ? 1 : 0, ac: CLAN.autoClear === false ? 0 : 1 }; }
function clanLoad(d) {
  if (d) { CLAN.tname = tribeNameClean(d.tn); CLAN.rmix = rmixClean(d.rm); CLAN.residents = d.res || 0; CLAN.hungry = d.hun || 0; CLAN.water = d.w || 0; CLAN.dayK = d.day ?? G.day; CLAN.pmK = d.pm ?? G.day; CLAN.autoRoles = d.ar !== 0; CLAN.autoBuild = d.ab !== 0; CLAN.autoClear = d.ac !== 0; }
  CLAN.uidN = Math.max((d && d.uid) || 0, CLAN.uidN || 0, ...tribeAll().map(m => m.uid || 0));
  for (const m of tribeAll()) if (!m.young && !WORK.includes(m.cls)) setCls(m, m.isPartner ? 'gatherer' : bestCls(), true);
}
// ---------- the tribe brain ----------
// what the tribe reacts to: anything attacking one of us, and big predators that come close (warriors guard the whole village)
const BIGP = new Set(['jaguar', 'puma', 'caiman', 'anaconda', 'bushdog']);
const ourSide = x => !!x && (x.tribe || x.isPlayer || x.cowCamp || x.tribeHorse || x.isPartner || x.cub);
function clanThreat(a, v) {
  let th = null, bd = 1e9; const war = a.cls === 'warrior' || ordIs(a, 'guard'), hun = a.cls === 'hunter', R = v ? villageR() + 18 : 0;
  shQuery(a.pos.x, a.pos.z, war ? 34 : hun ? 20 : 16, (b, d) => {
    if (!b.alive || b.isPlayer || b.tribe || b.cowCamp || b.tpl.kind === 'fish' || b.young || b.brain === 'captive' || b.duel) return;
    const attacking = (b.state === 'fight' && ourSide(b.foe)) || ((b.state === 'hunt' || b.state === 'stalk') && ourSide(b.target)) || (b.state === 'defend' && ourSide(b.foe)) || (b.windup > 0 && ourSide(b.throwTgt));
    if (b.hunter) { if (!attacking && (!enemyOf(b) || b.brain === 'villager')) return; }
    else if (b.pet || b.tpl.kind === 'bird') { if (!attacking || b.tpl.kind === 'bird') return; }
    else if (!attacking) {
      const big = BIGP.has(b.spId) || !!b.legend;
      if (b.spId === 'caiman' && b.swimming) return;
      if (!war) { if (!big || d > (hun ? 14 : 9)) return; }
      else { if (!big && b.spId !== 'ocelot') return; if (v && Math.hypot(b.pos.x - v.x, b.pos.z - v.z) > R && d > 14) return; }
    }
    if (d < bd) { bd = d; th = b; }
  });
  return th;
}
// walking with a little sense: go around what blocks the way, and if really stuck, slip past out of sight
function jobGo(a, x, z, spd, dt) {
  if (WALLED.length) { const g = gateDetour(a, x, z); if (g) { x = g.x; z = g.z; } }
  if (a.swimming) spd = Math.min(spd, a.sp.swim || 1);
  const dx = x - a.pos.x, dz = z - a.pos.z, d = Math.hypot(dx, dz);
  if (d < 0.05) { a.move(0, 0, 0, dt); return d; }
  let ux = dx / d, uz = dz / d;
  if (a.det && a.det.t > 0) { a.det.t -= dt; const c = Math.cos(a.det.a), s = Math.sin(a.det.a), nx = ux * c - uz * s; uz = ux * s + uz * c; ux = nx; }
  else if ((a.blocked || 0) > 0.6) { a.det = { a: (a.det && a.det.a > 0 ? -1 : 1) * rr(0.9, 1.6), t: rr(1.2, 2.2) }; a.blocked = 0; a.stuckN = (a.stuckN || 0) + 1; }
  if (a.navX !== x || a.navZ !== z) { a.navX = x; a.navZ = z; a.navBest = d; a.stuckN = 0; a.navT = 0; }
  else if (d < a.navBest - 1.5) { a.navBest = d; a.stuckN = 0; a.navT = 0; }
  // pressed against a wall or a house, the way is not getting shorter: step around it
  else if ((a.navT = (a.navT || 0) + dt) > 5 && !(a.det && a.det.t > 0)) { a.navT = 0; a.det = { a: (rng() < 0.5 ? -1 : 1) * rr(1.0, 1.7), t: rr(1.4, 2.6) }; a.stuckN = (a.stuckN || 0) + 1; }
  if ((a.stuckN || 0) >= ((a.dCam || 0) > 30 ? 4 : 10)) {
    for (let t = 0; t < 12; t++) { const px = x + rr(-2.5, 2.5), pz = z + rr(-2.5, 2.5); if (waterDepth(px, pz) === 0) { a.pos.set(px, 0, pz); a.ground(1, true); break; } }
    a.stuckN = 0; a.det = null; a.navBest = 0;
  }
  a.move(ux, uz, spd, dt); a.pose = a.swimming ? 'swim' : a.carry ? 'carry' : 'move';
  return d;
}
function clanFollow(a, dt) {
  const p = P.a; if (!p) return;
  const slot = a.slot ?? (a.slot = (rng() * 8) | 0), ang = p.yaw + Math.PI + (slot % 2 ? 0.8 : -0.8), r = 2.4 + (slot >> 1) * 1.1;
  const x = p.pos.x + Math.sin(ang) * r, z = p.pos.z + Math.cos(ang) * r, d = Math.hypot(x - a.pos.x, z - a.pos.z);
  if (d > 60 && a.dCam > 30) { a.pos.set(x, 0, z); a.ground(1, true); }
  if (d > 1) { a.move((x - a.pos.x) / d, (z - a.pos.z) / d, d > 7 ? a.sp.run : Math.max(a.sp.walk, (p.speed || 0)), dt); a.pose = a.swimming ? 'swim' : 'move'; }
  else { a.move(0, 0, 0, dt); a.pose = P.sleeping ? 'sleep' : 'idle'; }
  a.hidden = false;
}
BRAIN.tribe = function (a, dt) {
  a.spearCD = (a.spearCD || 0) - dt; a.atkCD = (a.atkCD || 0) - dt; a.think = (a.think || 0) - dt;
  if (a.windup > 0) {
    const t = a.throwTgt; a.windup -= dt;
    if (t && t.alive) a.yaw += angDiff(a.yaw, Math.atan2(t.pos.x - a.pos.x, t.pos.z - a.pos.z)) * Math.min(1, dt * 8);
    a.move(0, 0, 0, dt); a.pose = 'aim'; if (a.windup <= 0) hunterLaunch(a); return;
  }
  const v = ownCamp(), p = P.a;
  if (a.state === 'defend') a.state = 'fight';
  if (a.towerB && !a.young && towerJob(a, dt, v)) return;
  if (a.job && a.job.k === 'raid' && raidJob(a, dt)) return;
  if (a.inCart && cartRide(a)) return;
  if (a.job && a.job.k === 'ship') { a.state = 'idle'; a.foe = null; a.hidden = false; shipTrip(a, dt, v); return; }
  if (a.inShip && shipRide(a)) return;
  if (a.job && a.job.k === 'boat') { a.state = 'idle'; a.foe = null; a.hidden = false; if (v) boatTrip(a, dt, v); else { boatTripEnd(a); a.job = null; } return; }
  if (a.job && a.job.k === 'cart') { a.state = 'idle'; a.foe = null; a.hidden = false; if (v) cartTrip(a, dt, v); else { a.job.T = 0; cartTrip(a, dt, a.pos); } return; }
  if (a.state === 'fight' && a.foe && a.foe.alive && dist2(a.foe.pos, a.pos) < 42) { a.hidden = false; tribeFight(a, a.foe, dt); return; }
  if (a.state === 'fight') { a.state = 'idle'; a.foe = null; if (a.job && (a.job.k === 'flee' || a.job.k === 'patrol')) a.job = null; }
  if (a.think <= 0) {
    a.think = 0.5 + rng() * 0.3;
    const th = clanThreat(a, v);
    if (th) {
      a.hidden = false;
      const atk = th.state === 'fight' || th.state === 'hunt' || th.state === 'stalk' || th.state === 'defend' || !!th.raider || th.windup > 0;
      if (a.young || (a.cls === 'gatherer' && !a.escort && !ordIs(a, 'guard')) || (!atk && a.cls !== 'warrior' && a.cls !== 'hunter' && !a.escort && !ordIs(a, 'guard'))) { if (!a.job || a.job.k !== 'flee') { a.prevJob = a.job; a.job = { k: 'flee', t: th, T: 6 }; a.carry = false; if (a.dCam < 30 && rng() < 0.5) say(a, pick(['טורף!', 'זהירות!', 'לברוח!']), 1.8); } }
      else { a.state = 'fight'; a.foe = th; if (G.t - (a.yellT || -99) > 20 && a.dCam < 40) { a.yellT = G.t; say(a, pick(['טורף! כולם אליי!', 'לא תיגע בכפר שלנו!', 'הוא כאן!']), 2.2); } return; }
    }
    if (!a.young && !th && p && P.packT > 0 && P.packTarget && P.packTarget.alive && (a.escort || !v) && dist2(P.packTarget.pos, a.pos) < 30) { a.state = 'fight'; a.foe = P.packTarget; return; }
  }
  if (a.job && a.job.k === 'flee') {
    const t = a.job.t; a.job.T -= dt;
    if (!t || !t.alive || a.job.T <= 0) { a.job = a.prevJob && a.prevJob.k !== 'flee' ? a.prevJob : null; a.prevJob = null; return; }
    const hx = v ? v.x : p.pos.x, hz = v ? v.z : p.pos.z; let fx = hx - a.pos.x, fz = hz - a.pos.z; const ax = a.pos.x - t.pos.x, az = a.pos.z - t.pos.z, ad = Math.hypot(ax, az) || 1, cd = Math.hypot(fx, fz) || 1;
    fx = fx / cd * 0.6 + ax / ad; fz = fz / cd * 0.6 + az / ad; const fl = Math.hypot(fx, fz) || 1;
    a.move(fx / fl, fz / fl, a.sp.run * 0.85, dt); a.pose = 'move'; return;
  }
  if (a.handBack && !a.young && depHandBack(a, dt)) return;
  if (a.job && a.job.k === 'caravan') { caravanJob(a, dt, v); return; }
  if (v && !a.young && (a.ord || (a.job && a.job.k === 'home' && a.cls !== 'gatherer')) && ordJob(a, dt, v)) return;
  if (!v || a.escort || (a.young && P.cubsMode === 'follow')) { clanFollow(a, dt); return; }
  if (a.young) { kidJob(a, dt, v); return; }
  if (DEP.away && a === DEP.cur && !isNight() && depRoutine(a, dt, v)) return;
  if (isNight() && !(a.cls === 'warrior' && a.id % 2 === 0)) { sleepJob(a, dt, v); return; }
  a.hidden = false; if (a.sleepAt) a.sleepAt = null;
  if (a.cls === 'warrior') warriorJob(a, dt, v); else if (a.cls === 'hunter') hunterJob(a, dt, v); else if (a.cls === 'builder') builderJob(a, dt, v); else gathererJob(a, dt, v);
};
function restAtFire(a, dt, v, j) {
  if (!j.x) { const ang = rng() * TAU, r = rr(2.4, 4.2); j.x = v.x + Math.cos(ang) * r; j.z = v.z + Math.sin(ang) * r; }
  const d = jobGo(a, j.x, j.z, a.sp.walk, dt);
  // someone or something on the spot: near enough is fine after a while, or another spot
  if (d < 0.8 || ((j.w = (j.w || 0) + dt) > 12 && d < 4)) { a.move(0, 0, 0, dt); a.yaw += angDiff(a.yaw, Math.atan2(v.x - a.pos.x, v.z - a.pos.z)) * Math.min(1, dt * 3); a.pose = j.talk ? 'talk' : 'sit'; j.t -= dt; }
  else if (j.w > 30) { j.x = null; j.w = 0; }
  return j.t <= 0;
}
// a family sleeps under one roof: husband and wife, and their children with them
function familyKey(a) {
  if (a.young && a.momU) { const m = TRIBE.adults.find(q => q.uid === a.momU && q.alive && !q.gone); if (m) return familyKey(m); }
  if (a.spouse && a.spouse.alive && !a.spouse.gone) return Math.min(a.id, a.spouse.id);
  return a.id;
}
function sleepJob(a, dt, v) {
  if (!a.sleepAt) {
    const houses = BLD.list.filter(b => b.done && BTYPES[b.t].cap), fk = familyKey(a);
    const h = houses.length ? houses[(fk % houses.length)] : null;
    if (h) { const dx = v.x - h.x, dz = v.z - h.z, L = Math.hypot(dx, dz) || 1; a.sleepAt = { x: h.x + dx / L * (BTYPES[h.t].r * 0.6), z: h.z + dz / L * (BTYPES[h.t].r * 0.6), inside: true }; }
    else { const ang = (fk * 2.4) % TAU, r = rr(3, 5) + (fk !== a.id ? 0.6 : 0); a.sleepAt = { x: v.x + Math.cos(ang) * r + (a.id === fk ? 0 : 0.7), z: v.z + Math.sin(ang) * r }; }
  }
  if (a.hidden) { a.move(0, 0, 0, dt); a.pose = 'sleep'; return; }
  const d = jobGo(a, a.sleepAt.x, a.sleepAt.z, a.sp.walk * 1.2, dt);
  if (d < 1) { a.move(0, 0, 0, dt); a.pose = 'sleep'; if (a.sleepAt.inside) a.hidden = true; }
}
function kidJob(a, dt, v) {
  a.hidden = false;
  if (isNight()) { sleepJob(a, dt, v); return; } a.sleepAt = null;
  if (!a.playGoal || dist2(a.pos, a.playGoal) < 1 || (a.playT = (a.playT || 0) - dt) <= 0) {
    const R = Math.max(8, villageR() * 0.55), mate = clanReal().find(o => o !== a && o.young && rng() < 0.4);
    const ang = rng() * TAU, r = rr(3, R); a.playGoal = mate && dist2(mate.pos, v) < R ? { x: mate.pos.x, z: mate.pos.z } : { x: v.x + Math.cos(ang) * r, z: v.z + Math.sin(ang) * r }; a.playT = rr(2, 6);
  }
  a.steerTo(a.playGoal.x, a.playGoal.z, rng() < 0.6 ? 3 : 1.4, dt); a.pose = 'move';
  if (rng() < dt * 0.03 && a.dCam < 22) say(a, pick(['תתפוס אותי!', 'חחח', 'מהר!', 'אני הכי מהיר!']), 1.6);
}
function warriorJob(a, dt, v) {
  const R = villageR(); let j = a.job;
  if (!j || j.k !== 'patrol') { const ang = rng() * TAU, r = R * rr(0.7, 1.05); j = a.job = { k: 'patrol', x: v.x + Math.cos(ang) * r, z: v.z + Math.sin(ang) * r, wait: rr(4, 9), T: 50 }; }
  j.T -= dt;
  const d = jobGo(a, j.x, j.z, a.sp.walk, dt);
  if (d < 1.2 || j.T <= 0 || a.blocked > 1.5) { a.move(0, 0, 0, dt); a.pose = 'idle'; a.look = Math.sin(G.t * 0.6 + a.id) * 0.9; j.wait -= dt; if (j.wait <= 0) a.job = null; }
}
function findClanPrey(v, r, a) {
  let best = null, bs = 1e9;
  shQuery(v.x, v.z, r, (b, d) => {
    if (!b.alive || b.pet || b.young || b.cub || b.cowCamp || b.lured || b.swimming || b.state === 'flee' || !HUNTER_PREY.includes(b.spId)) return;
    const s = d + dist2(b.pos, a.pos) * 0.5 + (b.spId === 'tapir' ? 25 : 0); if (s < bs) { bs = s; best = b; }
  });
  return best;
}
function hunterJob(a, dt, v) {
  let j = a.job || (a.job = { k: 'rest', t: rr(6, 14) });
  switch (j.k) {
    case 'rest': if (restAtFire(a, dt, v, j)) {
      const tt = trapForTribe(a, v); if (tt) { a.job = { k: 'trap', T: tt }; return; }
      const ts = rng() < 0.45 ? trapTribeWant(v) : null; if (ts) { a.job = { k: 'trap', set: ts.k, x: ts.x, z: ts.z }; return; }
      const t = findClanPrey(v, 170, a); a.job = t ? { k: 'hunt', t, T: 130 } : { k: 'scout', T: 45 };
    } return;
    case 'trap': trapJob(a, dt, v); return;
    case 'scout': {
      if (!j.x) { for (let k = 0; k < 10; k++) { const ang = rng() * TAU, r = rr(50, 130), x = v.x + Math.cos(ang) * r, z = v.z + Math.sin(ang) * r; if (inBounds(x, z) && waterDepth(x, z) === 0) { j.x = x; j.z = z; break; } } if (!j.x) { a.job = null; return; } }
      j.T -= dt; const d = jobGo(a, j.x, j.z, a.sp.walk * 1.3, dt);
      if (d < 2 || j.T <= 0 || (a.stuckN || 0) > 3) { const t = findClanPrey(a.pos, 70, a); a.job = t ? { k: 'hunt', t, T: 110 } : { k: 'rest', t: rr(20, 40) }; }
      return;
    }
    case 'hunt': {
      const t = j.t; j.T -= dt;
      if (!t || t.gone || t.pet || j.T <= 0 || t.swimming) { a.crouch = false; a.job = { k: 'rest', t: rr(10, 20) }; return; }
      if (!t.alive) { a.crouch = false; a.job = { k: 'collect', c: t, t: 2.6 }; return; }
      // out of sight, a hunt ends the way hunts usually end
      j.el = (j.el || 0) + dt;
      if (j.el > 40 && a.dCam > 70 && (t.dCam || 0) > 70) { if (rng() < 0.45 + 0.4 * wildK()) { t.hp = 0; kill(t, a); } else { a.crouch = false; a.job = { k: 'rest', t: rr(10, 20) }; } return; }
      const dx = t.pos.x - a.pos.x, dz = t.pos.z - a.pos.z, d = Math.hypot(dx, dz) || 0.01;
      a.crouch = d < 26 && t.state !== 'flee';
      if (d < 22 && a.spearCD <= 0) { a.aimBow = true; hunterThrow(a, t, 'arrow'); a.spearCD = rr(1.7, 2.4); a.yaw = Math.atan2(dx, dz); for (const b of a.pets || []) if (b.alive && b.tribeDog && b.state !== 'fight' && d < 30) { b.state = 'fight'; b.foe = t; } return; }
      if (d > 11) { const run = t.state === 'flee' && d < 30; jobGo(a, t.pos.x, t.pos.z, run ? a.sp.run * 0.9 : a.crouch ? 1.3 : a.sp.walk * 1.6, dt); a.pose = 'move'; } else { a.move(dx / d, dz / d, 0.01, dt); a.pose = 'idle'; }
      return;
    }
    case 'collect': {
      const c = j.c; if (!c || c.gone || c.food <= 0.5) { a.job = { k: 'rest', t: rr(8, 16) }; return; }
      const d = jobGo(a, c.pos.x, c.pos.z, a.sp.walk * 1.4, dt);
      if (d < c.rad + 1.1) { a.move(0, 0, 0, dt); a.pose = 'kneel'; j.t -= dt; if (j.t <= 0) { const n = Math.max(1, Math.round(c.food / 9)); c.food = 0; a.carry = true; a.job = { k: 'bring', n, what: c.sp.he }; PRESS.hunted++; if (a.dCam < 30) say(a, `תפסתי ${c.sp.he}!`); } }
      return;
    }
    case 'bring': {
      if (j.ox == null) j.ox = rr(-0.5, 0.5); // a fixed spot, so a walker stuck on the way is noticed
      const d = jobGo(a, v.x + j.ox, v.z, a.sp.walk * 1.2, dt);
      if (d < 3.2) { a.carry = false; boxStore(); CAMPH.store.meat += j.n; tribeNews(`${a.name} ${heb(a, 'הביא', 'הביאה')} ${j.n} נתחי בשר (${j.what})`); a.job = { k: 'rest', t: rr(25, 45), talk: rng() < 0.4 }; }
      return;
    }
  }
}
// trees in the village are cleared first; when the store runs low, the builders walk farther, even far into the forest
function treeToClear(v) {
  const R = villageR() + 8, want = (CLAN.planWant && BTYPES[CLAN.planWant] ? BTYPES[CLAN.planWant].wood : 0) + (DEF.unpaid ? 30 : 0), free = q => !q.cut && (!q.claim || !q.claim.alive || !q.claim.job || q.claim.job.e !== q);
  if ((CAMPH.store.wood || 0) >= 50 + BLD.sites.length * 20 + want) return treeNearest(v.x, v.z, R, free);
  return treeNearest(v.x, v.z, R, free) || treeNearest(v.x, v.z, R + 45, free) || treeNearest(v.x, v.z, R + 130, free);
}
function builderJob(a, dt, v) {
  let j = a.job;
  if (!j) {
    const s = defPickSite(a);
    if (s) { a.job = { k: 'build', s }; return; }
    const fx = defRepairPick(a); if (fx) { a.job = { k: 'repair', b: fx }; return; }
    // stumps and thick bushes in the village are cleared when there is wood in the store
    const cl = CLAN.autoClear !== false && (CAMPH.store.wood || 0) >= 30 && rng() < 0.6 ? clearJobPick(a, v) : null; if (cl) { a.job = { k: 'clear', f: cl, t: 0 }; return; }
    if (CARTS.list.length && rng() < 0.3 && (CAMPH.store.wood || 0) < 260 && cartTripStart(a, v)) return;
    const e = treeToClear(v); if (e) { e.claim = a; a.job = { k: 'fell', e, t: 0, T: 70 + Math.hypot(e.x - a.pos.x, e.z - a.pos.z) / Math.max(0.6, a.sp.walk * 1.3) }; return; }
    a.job = { k: 'rest', t: rr(12, 24) }; return;
  }
  switch (j.k) {
    case 'rest': if (restAtFire(a, dt, v, j)) a.job = null; return;
    case 'repair': defRepairJob(a, dt, v); return;
    case 'clear': clearJob(a, dt); return;
    case 'build': {
      const s = j.s; if (!s || s.done || !BLD.sites.includes(s)) { a.job = null; return; }
      if (!j.x) {
        if (BTYPES[s.t].span) { const w = bridgeWorkSpot(s, a); j.x = w.x; j.z = w.z; }
        else if (BTYPES[s.t].def && BTYPES[s.t].def.water) { const e = segEnds(s), dry = [[e.ax - e.ux * 1.2, e.az - e.uz * 1.2], [e.bx + e.ux * 1.2, e.bz + e.uz * 1.2]].filter(([x, z]) => waterDepthT(x, z) === 0).sort((p, q) => Math.hypot(p[0] - a.pos.x, p[1] - a.pos.z) - Math.hypot(q[0] - a.pos.x, q[1] - a.pos.z))[0] || [s.x, s.z]; j.x = dry[0]; j.z = dry[1]; }
        else if (BTYPES[s.t].len) { const e = segEnds(s), side = ((v.x - s.x) * -e.uz + (v.z - s.z) * e.ux) >= 0 ? 1 : -1, off = rr(-0.35, 0.35) * e.L; j.x = s.x + e.ux * off - e.uz * side * 1.0; j.z = s.z + e.uz * off + e.ux * side * 1.0; }
        else { const ang = rng() * TAU, r = BTYPES[s.t].r + 0.6; j.x = s.x + Math.cos(ang) * r; j.z = s.z + Math.sin(ang) * r; }
      }
      const d = jobGo(a, j.x, j.z, a.sp.walk * 1.3, dt);
      if (d < 0.8) { a.move(0, 0, 0, dt); a.yaw += angDiff(a.yaw, Math.atan2(s.x - a.pos.x, s.z - a.pos.z)) * Math.min(1, dt * 4); a.pose = 'build'; s.work += dt; if ((j.snd = (j.snd || 0) - dt) <= 0) { j.snd = 0.5; if (a.dCam < 45) AUD.at('hammer', a.pos, 0.7); } }
      return;
    }
    case 'fell': {
      const e = j.e; j.T -= dt;
      if (!e || e.cut || j.T <= 0) { if (e) e.claim = null; a.job = null; return; }
      const r = treeTrunkR(e) + 0.75, ang = Math.atan2(a.pos.x - e.x, a.pos.z - e.z), d = jobGo(a, e.x + Math.sin(ang) * r, e.z + Math.cos(ang) * r, a.sp.walk * 1.3, dt);
      if (d > 0.7) return;
      a.move(0, 0, 0, dt); a.yaw += angDiff(a.yaw, Math.atan2(e.x - a.pos.x, e.z - a.pos.z)) * Math.min(1, dt * 5); a.pose = 'chop';
      j.t += dt; if ((j.snd = (j.snd || 0) - dt) <= 0) { j.snd = 0.75; if (a.dCam < 50) AUD.at('chop', a.pos, 0.8); }
      if (j.t >= TREE_KIND[e.id].hits * 0.9 * clamp(e.sc, 0.8, 1.3)) { const w = treeCut(e, { anim: a.dCam < 160, dir: Math.atan2(e.x - a.pos.x, e.z - a.pos.z) }); e.claim = null; a.carry = true; a.job = { k: 'bring', w }; }
      return;
    }
    case 'bring': {
      if (j.ox == null) { j.ox = rr(-1, 1); j.oz = rr(-1, 1); }
      const d = jobGo(a, v.x + j.ox, v.z + j.oz, a.sp.walk * 1.15, dt);
      if (d < 3.4) { a.carry = false; boxStore(); CAMPH.store.wood += j.w; a.job = { k: 'rest', t: rr(4, 10) }; }
      return;
    }
  }
}
function gathererJob(a, dt, v) {
  let j = a.job;
  if (!j) {
    const r = rng();
    if (SHIPS.list.length && r < 0.08 && !isNight() && shipTripStart(a, v)) return;
    if (r < 0.16 && !isNight() && boatTripStart(a, v)) return;
    if (r < 0.45) { for (let k = 0; k < 8; k++) { const ang = rng() * TAU, rad = rr(14, 36), x = v.x + Math.cos(ang) * rad, z = v.z + Math.sin(ang) * rad; if (waterDepth(x, z) === 0 && getNY(x, z) > 0.8) { a.job = { k: 'food', x, z, t: rr(6, 10) }; return; } } }
    if (r < 0.7) { const w = nearestWater(v.x, v.z); if (w && Math.hypot(w.x - v.x, w.z - v.z) < 90) { const dx = w.x - v.x, dz = w.z - v.z, L = Math.hypot(dx, dz) || 1; a.job = { k: 'water', x: w.x - dx / L * 1.4, z: w.z - dz / L * 1.4, t: rr(3, 5) }; return; } }
    a.job = { k: 'rest', t: rr(15, 30), talk: rng() < 0.5 }; return;
  }
  switch (j.k) {
    case 'rest':
      if ((j.cook = (j.cook || 0) - dt) <= 0) { j.cook = 18; boxStore(); if (CAMPH.store.meat > 0) { CAMPH.store.meat--; CAMPH.store.cooked++; } else if (CAMPH.store.fish > 0) { CAMPH.store.fish--; CAMPH.store.cooked++; } }
      if (restAtFire(a, dt, v, j)) a.job = null; return;
    case 'food': case 'water': {
      if (!j.there) { const d = jobGo(a, j.x, j.z, a.sp.walk, dt); if (d < 1.1 || a.blocked > 1.5) j.there = true; return; }
      a.move(0, 0, 0, dt); a.pose = j.k === 'food' ? 'gather' : 'kneel'; j.t -= dt;
      if (j.t <= 0) { a.carry = true; a.job = { k: 'home', what: j.k }; }
      return;
    }
    case 'home': {
      if (j.ox == null) { j.ox = rr(-1, 1); j.oz = rr(-1, 1); }
      const d = jobGo(a, v.x + j.ox, v.z + j.oz, a.sp.walk, dt);
      if (d < 3.2) { a.carry = false; boxStore(); if (j.what === 'food') CAMPH.store.cooked += 1 + Math.min(3, Math.floor(BLD.list.filter(b => b.done && b.t === 'field').length * 0.5 + rng() * 0.6)); else if (j.what === 'fish') { CAMPH.store.fish += j.n || 2; tribeNews(`${a.name} ${heb(a, 'חזר', 'חזרה')} מהנהר בסירה עם ${j.n || 2} דגים`); } else CLAN.water = Math.min(100, CLAN.water + 12); a.job = { k: 'rest', t: rr(14, 30), talk: rng() < 0.5 }; }
      return;
    }
  }
}
function tribeNews(text) { if (G.t - CLAN.msgT > 25 && P.a && ownCamp() && dist2(P.a.pos, ownCamp()) < 120) { CLAN.msgT = G.t; UI.notify(text, 'good'); } }
// ---------- food, hunger, growth, and the residents who live in the houses ----------
function foodCap() { return 40 + 60 * BLD.list.filter(b => b.done && b.t === 'granary').length; }
function eatFromStore(n) {
  boxStore(); const st = CAMPH.store; let got = 0;
  for (const k of ['cooked', 'meat', 'fish']) { const t = Math.min(n - got, st[k] || 0); st[k] -= t; got += t; if (got >= n) break; }
  return got;
}
function clanUpdate(dt) {
  CLAN.t -= dt; if (CLAN.t > 0) return; const step = 1 - CLAN.t; CLAN.t = 1;
  const v = ownCamp(), gh = step * timeRate(), kids = clanReal().filter(m => m.young); boxStore();
  // the dead are mourned
  for (let i = TRIBE.adults.length - 1; i >= 0; i--) {
    const m = TRIBE.adults[i]; if (m.alive) continue; TRIBE.adults.splice(i, 1);
    if (!m.gone && P.a) { const L = m.lastHit, k = L && L.hunter && L.camp ? ` על ידי ${L.name} מ${L.camp.tribe}` : L && L.sp && !L.tribe ? ` על ידי ${L.sp.he}` : ''; UI.notify(`${m.name} ${heb(m, 'נהרג', 'נהרגה')}${k}. השבט מתאבל`, 'bad'); polEvent(L && L.hunter ? -4 : -2, `${m.name} ${heb(m, 'נהרג', 'נהרגה')}`); if (L && L.hunter && L.camp && typeof warLog === 'function') warLog(`${m.name} ${heb(m, 'נהרג', 'נהרגה')} בידי ${L.camp.tribe}`, 'bad'); }
  }
  // children are fed by whoever has food
  for (const k of kids) {
    if ((k.cubHunger || 0) < 45) continue;
    let got = 0;
    if (v && dist2(k.pos, v) < villageR() + 20) got = eatFromStore(1);
    else if (P.a && dist2(k.pos, P.a.pos) < 25) { for (const s of ['cooked', 'meat', 'fish']) if (!got && (P.inv[s] || 0) > 0) { P.inv[s]--; got = 1; } }
    if (got) k.cubHunger = Math.max(0, k.cubHunger - 50);
  }
  if (!v) return;
  // everyone eats from the village store
  const gran = BLD.list.filter(b => b.done && b.t === 'granary').length, need = (clanAdults().length * 6 + kids.length * 2 + CLAN.residents * 5) / 24 * gh * Math.max(0.6, 1 - gran * 0.1);
  CLAN.eatAcc += need;
  while (CLAN.eatAcc >= 1) { if (eatFromStore(1)) { CLAN.eatAcc--; CLAN.hungry = Math.max(0, CLAN.hungry - 0.02); } else { CLAN.hungry += 0.05; CLAN.eatAcc = 0; break; } }
  if (CLAN.hungry > 1) { CLAN.hungry = 0.5; clanStarve(); }
  CLAN.water = Math.max(0, CLAN.water - gh * 0.8);
  // food beyond what the store can keep goes bad; granaries keep more
  { const st = CAMPH.store, cap = foodCap(), sp = CLAN.spoil || (CLAN.spoil = { cooked: 0, meat: 0, fish: 0 });
    for (const [k, c, r] of [['cooked', cap, 0.25], ['meat', 20, 0.4], ['fish', 20, 0.4]]) { if (st[k] > c) { sp[k] += (st[k] - c) * r * gh / 24; const n = Math.min(Math.floor(sp[k]), st[k] - c); if (n > 0) { st[k] -= n; sp[k] -= n; } } else sp[k] = 0; } }
  residentsWork(gh, v);
  // dawn: newcomers arrive when there is room and food
  // newcomers arrive twice a day: in the morning, and travelers in the afternoon
  const am = G.time > 7 && G.time < 12, pm = G.time > 14 && G.time < 17.5, key = am ? 'dayK' : 'pmK';
  if ((am || pm) && CLAN[key] !== G.day && ((CLAN.dawnT = (CLAN.dawnT || 0) - step) <= 0)) { CLAN.dawnT = 20; if (clanDawn(v, pm) || G.time > (am ? 11 : 17)) CLAN[key] = G.day; }
}
function clanStarve() {
  if (CLAN.residents > 0) { const n = Math.max(1, Math.ceil(CLAN.residents * 0.15)); CLAN.residents = Math.max(0, CLAN.residents - n); UI.notify(`אין אוכל בכפר. ${n} תושבים עזבו`, 'bad'); return; }
  const m = TRIBE.adults.find(b => b.alive && !b.isPartner && !b.young && !(b.spouse && b.spouse.alive) && BLD.list.every(x => !(x.done && x.t === 'totem')));
  if (m) { const i = TRIBE.adults.indexOf(m); TRIBE.adults.splice(i, 1); m.tribe = false; m.brain = 'leaver'; m.job = null; m.escort = false; m.hidden = false; say(m, 'אין כאן אוכל. אני הולך', 3); UI.notify(`${m.name} ${heb(m, 'עזב', 'עזבה')} את השבט, כי לא היה אוכל`, 'bad'); }
  else UI.notify('השבט רעב! צריך להביא בשר, דגים או פירות למחסן', 'bad');
}
function clanDawn(v, pm) {
  const pop = popCount(), room = housing() - pop; boxStore();
  const food = CAMPH.store.cooked + CAMPH.store.meat + CAMPH.store.fish;
  let done = false;
  if (room >= 2 && food >= pop * 1.2) {
    const n = Math.max(1, Math.min(room - 1, Math.round((1 + Math.floor(pop / 6) + (POL.sup > 75 ? 1 : 0)) * (pm ? 0.5 : 1)), 8));
    let real = 0;
    for (let i = 0; i < n; i++) { if (clanReal().length < MAXREAL && spawnNewcomer(v)) real++; else CLAN.residents++; }
    UI.notify(`${n === 1 ? 'אדם חדש הגיע' : `${n} אנשים חדשים הגיעו`} לגור בכפר${real < n ? ` (${n - real} מהם בבתים)` : ''}`, 'good'); AUD.play('cheer', 0.6); done = true;
  } else if (room < 2 && pop >= 6) { vxTell('house' + G.day, 'אין מקום לעוד אנשים בכפר. בונים בתים כדי שהשבט יגדל', 'bad'); done = true; }
  if (done && CLAN.residents > 0 && food > pop * 2 && room > 1) CLAN.residents += Math.min(room - 1, Math.max(1, Math.round(CLAN.residents * 0.05)));
  return done;
}
// cls0 and flags: a resident called out of the houses with a role (a knight, a merchant)
function spawnNewcomer(v, cls0, flags) {
  for (let t = 0; t < 20; t++) {
    const ang = rng() * TAU, r = villageR() + 30, x = v.x + Math.cos(ang) * r, z = v.z + Math.sin(ang) * r;
    if (!inBounds(x, z) || waterDepth(x, z) > 0) continue;
    const sex = rng() < 0.5 ? 'f' : 'm', cls = cls0 || bestCls(), F = flags || {}, look = F.knight ? 'knight' : F.merchant ? 'merchant' : cls;
    const b = new Animal('hunter', x, z, { sex, tpl: ensureTribal(look, 'own', sex, cls === 'hunter' || !!F.knight || !!F.merchant) }); b.ground(1, true);
    b.name = tribeName(sex); b.cls = cls; Object.assign(b, F); tribeJoin(b); TRIBE.adults.push(b); b.job = null;
    return b;
  }
  return null;
}
// residents work too, out of sight: they hunt, gather, build and clear the forest at the edge of the village
// The residents have roles like everyone else: a fifth of them are children, and the grown-ups are warriors, hunters,
// builders and gatherers, in the shares the chief sets (the people screen). Only the numbers are kept: there are too many
// of them to walk around one by one.
const RES_KIDS = 0.2, RMIX0 = { warrior: 20, hunter: 30, builder: 25, gatherer: 25 };
function rmixClean(m) { if (!m || typeof m !== 'object') return null; const o = {}; for (const k of WORK) o[k] = clamp(Math.round(+m[k] || 0), 0, 100); return WORK.some(k => o[k] > 0) ? o : null; }
function resMix() {
  const n = Math.max(0, CLAN.residents | 0), kids = Math.round(n * RES_KIDS), ad = n - kids, w = CLAN.rmix || RMIX0;
  const tot = WORK.reduce((s, k) => s + (w[k] || 0), 0) || 1, out = { child: kids }, fr = WORK.map(k => [k, ad * (w[k] || 0) / tot]);
  let left = ad; for (const [k, x] of fr) { out[k] = Math.floor(x); left -= out[k]; }
  fr.sort((a, b) => (b[1] % 1) - (a[1] % 1)); for (let i = 0; left > 0; i++, left--) out[fr[i % fr.length][0]]++;
  return out;
}
// the share of one role up or down (in fives); the others make room
function resShift(k, d) {
  if (!WORK.includes(k)) return;
  const w = Object.assign({}, CLAN.rmix || RMIX0); w[k] = clamp((w[k] || 0) + d * 5, 0, 100);
  if (!WORK.some(q => w[q] > 0)) return;
  CLAN.rmix = w; saveGame();
}
function residentsWork(gh, v) {
  const n = CLAN.residents; if (n <= 0) return;
  const R = resMix(), A = CLAN.resAcc, h = R.hunter * 1.25, g = R.gatherer * 1.5, b = R.builder * 1.25; boxStore();
  const wk = wildK();
  A.meat += h * 0.5 * gh * (0.35 + 0.65 * wk); A.cooked += g * 0.5 * gh * (1 + BLD.list.filter(x => x.done && x.t === 'field').length * 0.15); A.wood += b * 0.5 * gh; A.fell += b * 0.06 * gh; A.kill += h * 0.04 * gh * wk;
  for (const k of ['meat', 'cooked', 'wood']) { const w = Math.floor(A[k]); if (w > 0) { CAMPH.store[k] += w; A[k] -= w; } }
  while (A.fell >= 1) { A.fell--; const e = treeToClear(v) || treeNearest(v.x, v.z, villageR() + 70); if (!e) break; const w = treeCut(e, { anim: Math.hypot(camera.position.x - e.x, camera.position.z - e.z) < 140 }); CAMPH.store.wood += Math.round(w * 0.5); }
  while (A.kill >= 1) { A.kill--; let prey = null; shQuery(v.x, v.z, 320, b2 => { if (!prey && b2.alive && HUNTER_PREY.includes(b2.spId) && !b2.pet && !b2.cowCamp && (b2.dCam || 0) > 110) prey = b2; }); if (prey) prey.remove(); PRESS.hunted++; }
}
// ---------- join requests and the found-a-camp flow ----------
function joinRequest() {
  const own = ownCamp(); if (!own) return;
  if (popCount() >= housing()) { vxTell('full' + G.day, 'מישהו רצה להצטרף לשבט, אבל אין מקום. צריך עוד בתים', 'bad'); return; }
  const cands = []; for (const c of HUNT.camps) if (!c.own) for (const h of c.hunters || []) if (h.alive && !h.young && h.cls !== 'chief' && h.cls !== 'elder' && !h.fleeing && !h.duel) cands.push([h, c]);
  if (!cands.length) return;
  const [h, c] = pick(cands);
  const el = uiCard('joinov', `<h2>${h.name} רוצה להצטרף</h2><p>${clsWord(h)} מ${c.tribe} ${heb(h, 'מבקש', 'מבקשת')} להצטרף לשבט שלך. זה השבט שלך, וההחלטה שלך.</p><div class="btns"><button class="btn pri" data-a="yes">לקבל לשבט</button><button class="btn" data-a="no">לא עכשיו</button></div>`);
  el.onclick = e => {
    const b = e.target.closest('button'); if (!b) return; closeCard('joinov');
    if (b.dataset.a === 'yes' && h.alive) { const cls = WORK.includes(h.cls) ? h.cls : 'builder'; tribeAdult(h); setCls(h, cls, true); h.escort = false; UI.notify(`${h.name} ${heb(h, 'הצטרף', 'הצטרפה')} לשבט שלך בתור ${clsWord(h)}`, 'good'); }
  };
}
function foundCtx() {
  if (!FOUND.mode || !P.human || ownCamp()) return null; const a = P.a;
  if (a.swimming || waterDepth(a.pos.x, a.pos.z) > 0 || getNY(a.pos.x, a.pos.z) < 0.93) return null;
  if (HUNT.camps.some(c => !c.gone && Math.hypot(c.x - a.pos.x, c.z - a.pos.z) < 60)) return null;
  if (waterDist(a.pos.x, a.pos.z) > 60) { vxTell('foundWater' + Math.floor(G.t / 30), 'כאן אין מים קרובים. מחנה חייב להיות עד 60 מ׳ מנהר, אגם או נחל', 'bad'); return null; }
  return 'found';
}
// ================= BUILDING THE VILLAGE: huts, houses, longhouses, fields, towers, a council hall; always near water =================
const BTYPES = {
  hut: { n: 'בקתה', d: 'בית קטן למשפחה: עוד 4 מקומות מגורים', wood: 12, work: 35, cap: 4, r: 3.1, need: 0, ic: '🛖' },
  house: { n: 'בית', d: 'בית עץ עם גג קש: עוד 6 מקומות', wood: 22, work: 60, cap: 6, r: 3.6, need: 8, ic: '🏠' },
  granary: { n: 'מחסן תבואה', d: 'שומר עוד 60 מנות בלי שיתקלקלו, והשבט אוכל פחות', wood: 16, work: 40, r: 2.4, need: 6, ic: '🧺' },
  field: { n: 'גינה', d: 'האוספים מביאים יותר אוכל. רק קרוב מאוד למים', wood: 8, work: 25, r: 4.1, need: 5, water: 35, ic: '🌱' },
  tower: { n: 'מגדל שמירה', d: 'לוחם עם קשת עומד עליו יום ולילה, יורה בטורפים ובאויבים, ומסמן במפה סכנות מרחוק', wood: 15, work: 40, r: 2.1, need: 10, ic: '🗼' },
  torch: { n: 'לפיד', d: 'מאיר את הכפר בלילה, וטורפים לא מתקרבים אליו', wood: 2, work: 5, r: 0.6, need: 0, water: 999, ic: '🔥' },
  dock: { n: 'מעגן וסירה', d: 'רציף על המים עם קאנו. אפשר לשוט בנהר ובאגם, והאוספים יוצאים לדוג', wood: 16, work: 40, r: 2.4, need: 4, ic: '🛶', shore: 1 },
  kennel: { n: 'מלונת כלבים', d: 'הציידים מאלפים כלבי יער. הכלבים צדים ונלחמים לצד בעליהם', wood: 12, work: 35, r: 2.3, need: 8, ic: '🐕' },
  armory: { n: 'בית נשק', d: 'מגלפים חרבות, חניתות וחצים. הלוחמים מקבלים חרבות, והשבט חזק יותר בקרב', wood: 20, work: 55, r: 2.8, need: 10, ic: '⚔️' },
  aviary: { n: 'כלוב עיטים', d: 'מאלפים עיטים. עיט חג מעל הצייד שלו, מגלה טרף ואויבים וצולל עליהם', wood: 18, work: 50, r: 2.2, need: 14, ic: '🦅' },
  long: { n: 'בית ארוך', d: 'מלוקה גדולה לכמה משפחות: עוד 12 מקומות', wood: 45, work: 120, cap: 12, r: 6.4, need: 16, ic: '🏘️' },
  totem: { n: 'טוטם', d: 'המעמד עולה, ואנשים לא עוזבים גם כשרעבים', wood: 25, work: 55, r: 1.6, need: 20, ic: '🗿' },
  hall: { n: 'בית המועצה', d: 'לב העיר: עוד 20 מקומות. בלעדיו אין עיירה', wood: 90, work: 220, cap: 20, r: 8.6, need: 30, ic: '🏛️' },
  stable: { n: 'אורווה', d: 'הציידים מביאים סוסי בר ומאלפים אותם. אפשר לרכוב על הסוסים של השבט, מהר מכל הליכה', wood: 22, work: 55, r: 3.3, need: 8, ic: '🐎' }
};
const TIERN = ['מחנה', 'כפר', 'כפר גדול', 'עיירה', 'עיר'];
const BGEOX = {};   // geometry of buildings added later (t → (A, G) => void)
const BLD = { list: [], sites: [], mode: null, ghost: null, ring: null, rot: 0, ok: false, why: '', chk: 0, hud: null, tier: 0, gmat: null, rmat: null };
const fract = x => x - Math.floor(x);
class GB {
  constructor() { this.P = []; this.N = []; this.C = []; }
  add(geo, m, color, vary = 0.14) {
    const g = geo.index ? geo.toNonIndexed() : geo; if (m) g.applyMatrix4(m);
    const P0 = g.attributes.position, N0 = g.attributes.normal, c = col(color);
    for (let i = 0; i < P0.count; i++) {
      const x = P0.getX(i), y = P0.getY(i), z = P0.getZ(i), k = 1 - vary + vary * 2 * fract(Math.sin(Math.floor(x * 7) * 12.9898 + Math.floor(y * 7) * 78.233 + Math.floor(z * 7) * 37.719) * 43758.5453);
      this.P.push(x, y, z); this.N.push(N0.getX(i), N0.getY(i), N0.getZ(i)); this.C.push(c.r * k, c.g * k, c.b * k);
    }
    geo.dispose(); if (g !== geo) g.dispose();
  }
  build() { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(this.P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.C, 3)); g.computeBoundingSphere(); return g; }
}
const TH = '#a68c4c', TH2 = '#8e773f', WOOD = '#5c4128', WALL = '#a3825a', SOIL = '#6b4a2e';
function triPrism(w, h, depth, hole) {
  const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.lineTo(-w / 2, 0);
  if (hole) { const p = new THREE.Path(); p.moveTo(-hole[0] / 2, 0.05); p.lineTo(hole[0] / 2, 0.05); p.lineTo(hole[0] / 2, hole[1]); p.lineTo(-hole[0] / 2, hole[1]); p.lineTo(-hole[0] / 2, 0.05); s.holes.push(p); }
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false }); g.translate(0, 0, -depth / 2); return g;
}
function bGeo(t) {
  if (BTYPES[t] && BTYPES[t].def) return defGeo(t);
  const G = new GB(), A = (geo, p, r, s, c, v) => G.add(geo, M(p, r, s), c, v);
  if (t === 'hut') {
    A(new THREE.CylinderGeometry(2.45, 2.6, 0.22, 16), [0, 0.11, 0], null, null, '#7a5a3a');
    A(new THREE.CylinderGeometry(2.12, 2.2, 1.6, 20, 1, true, 0.38, TAU - 0.76), [0, 1.02, 0], null, null, WALL, 0.2);
    for (let i = 0; i < 8; i++) { const a = 0.38 + i / 7 * (TAU - 0.76); A(new THREE.CylinderGeometry(0.07, 0.085, 1.85, 6), [Math.sin(a) * 2.2, 1.0, Math.cos(a) * 2.2], null, null, WOOD); }
    A(new THREE.BoxGeometry(1.6, 0.12, 0.14), [0, 1.75, 2.12], null, null, WOOD);
    A(new THREE.ConeGeometry(3.15, 2.3, 20, 1, true), [0, 2.95, 0], null, null, TH, 0.22);
    A(new THREE.ConeGeometry(2.35, 1.5, 18, 1, true), [0, 3.55, 0], null, null, TH2, 0.22);
    A(new THREE.ConeGeometry(0.28, 0.6, 8), [0, 4.35, 0], null, null, '#5a4a2a');
    A(new THREE.CylinderGeometry(1.3, 1.3, 0.02, 14), [0, 0.23, 0], null, null, '#3a2a1c', 0.05);
  } else if (t === 'house') {
    A(new THREE.BoxGeometry(5.2, 0.24, 4.2), [0, 0.12, 0], null, null, '#7a5a3a');
    A(new THREE.BoxGeometry(5, 1.8, 0.14), [0, 1.14, -1.95], null, null, WALL, 0.2);
    for (const s of [-1, 1]) { A(new THREE.BoxGeometry(0.14, 1.8, 4), [s * 2.43, 1.14, 0], null, null, WALL, 0.2); A(new THREE.BoxGeometry(1.95, 1.8, 0.14), [s * 1.52, 1.14, 1.95], null, null, WALL, 0.2); }
    A(new THREE.BoxGeometry(1.1, 0.4, 0.14), [0, 1.84, 1.95], null, null, WALL, 0.2);
    for (const s of [-1, 1]) for (const q of [-1, 1]) A(new THREE.BoxGeometry(0.16, 2.1, 0.16), [s * 2.5, 1.1, q * 2.02], null, null, WOOD);
    for (const s of [-1, 1]) A(new THREE.BoxGeometry(6, 0.16, 2.95), [0, 2.75, s * 1.18], [s * 0.62, 0, 0], null, TH, 0.22);
    for (const z of [-2.02, 2.02]) A(triPrism(4.3, 1.45, 0.12), [0, 2.03, z], null, null, WALL, 0.2);
    A(new THREE.BoxGeometry(6.3, 0.16, 0.16), [0, 3.52, 0], null, null, WOOD);
  } else if (t === 'long') {
    A(new THREE.BoxGeometry(7.2, 0.2, 11.4), [0, 0.1, 0], null, null, '#7a5a3a');
    for (const s of [-1, 1]) A(new THREE.BoxGeometry(5.5, 0.2, 11.8), [s * 1.95, 2.35, 0], [0, 0, s * -0.95], null, TH, 0.24);
    for (const z of [-5.6, 5.6]) A(triPrism(7.2, 4.5, 0.18, z > 0 ? [1.4, 2.0] : null), [0, 0.2, z], null, null, WALL, 0.2);
    A(new THREE.BoxGeometry(0.2, 0.2, 12.4), [0, 4.62, 0], null, null, WOOD);
    for (const z of [-6.1, 6.1]) { A(new THREE.BoxGeometry(0.14, 1.1, 0.14), [0, 5.0, z], [0, 0, 0.5], null, WOOD); A(new THREE.BoxGeometry(0.14, 1.1, 0.14), [0, 5.0, z], [0, 0, -0.5], null, WOOD); }
    for (let i = 0; i < 6; i++) A(new THREE.BoxGeometry(0.08, 0.5, 0.02), [((i % 3) - 1) * 0.35, 1.5 + Math.floor(i / 3) * 0.6, 5.72], null, null, ['#b3321f', '#e8b83a', '#efe6d2'][i % 3], 0.05);
  } else if (t === 'granary') {
    for (const s of [-1, 1]) for (const q of [-1, 1]) A(new THREE.CylinderGeometry(0.08, 0.1, 1.3, 6), [s * 0.85, 0.65, q * 0.85], null, null, WOOD);
    A(new THREE.BoxGeometry(2.3, 0.14, 2.3), [0, 1.3, 0], null, null, '#6b4a2c');
    A(new THREE.CylinderGeometry(1.0, 1.1, 1.3, 14), [0, 2.0, 0], null, null, '#b08a52', 0.22);
    A(new THREE.ConeGeometry(1.55, 1.25, 14, 1, true), [0, 3.25, 0], null, null, TH, 0.22);
    A(new THREE.BoxGeometry(0.14, 1.4, 0.4), [0, 0.7, 1.35], [0.5, 0, 0], null, WOOD);
  } else if (t === 'field') {
    A(new THREE.BoxGeometry(7.2, 0.08, 5.2), [0, 0.03, 0], null, null, SOIL, 0.12);
    for (let r = 0; r < 5; r++) {
      const z = -2 + r; A(new THREE.BoxGeometry(6.8, 0.12, 0.34), [0, 0.1, z], null, null, '#5a3d24', 0.1);
      for (let k = 0; k < 8; k++) { const x = -3 + k * 0.86; A(new THREE.ConeGeometry(0.14, 0.55, 5), [x, 0.42, z], null, null, '#4f8a34', 0.2); A(new THREE.SphereGeometry(0.22, 6, 4), [x, 0.62, z], null, [1, 0.45, 1], '#5f9a3e', 0.2); }
    }
    for (const s of [-1, 1]) for (const q of [-1, 1]) A(new THREE.CylinderGeometry(0.05, 0.06, 0.9, 5), [s * 3.6, 0.45, q * 2.6], null, null, WOOD);
  } else if (t === 'tower') {
    for (const s of [-1, 1]) for (const q of [-1, 1]) A(new THREE.CylinderGeometry(0.09, 0.12, 5.2, 6), [s * 0.75, 2.6, q * 0.75], null, null, WOOD);
    A(new THREE.BoxGeometry(2.1, 0.14, 2.1), [0, 4.4, 0], null, null, '#7a5a38');
    for (const [x, z, ry] of [[0, -1.0, 0], [0, 1.0, 0], [-1.0, 0, Math.PI / 2], [1.0, 0, Math.PI / 2]]) A(new THREE.BoxGeometry(2.0, 0.5, 0.06), [x, 4.75, z], [0, ry, 0], null, '#6b4a2c');
    A(new THREE.ConeGeometry(1.55, 1.1, 4), [0, 5.8, 0], [0, Math.PI / 4, 0], null, TH, 0.2);
    for (let i = 0; i < 8; i++) A(new THREE.BoxGeometry(0.5, 0.05, 0.1), [0.6, 0.5 + i * 0.5, 0.82], null, null, WOOD);
  } else if (t === 'totem') {
    for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; A(new THREE.SphereGeometry(0.28, 6, 5), [Math.cos(a) * 0.9, 0.12, Math.sin(a) * 0.9], null, [1, 0.6, 1], '#7a7468'); }
    A(new THREE.CylinderGeometry(0.24, 0.3, 4.4, 10), [0, 2.2, 0], null, null, '#6b4a2c');
    [['#b3321f', 1.2], ['#1e1a16', 2.0], ['#e8b83a', 2.8], ['#efe6d2', 3.55]].forEach(([c, y]) => { A(new THREE.BoxGeometry(0.62, 0.5, 0.62), [0, y, 0], [0, 0.3, 0], null, c, 0.1); A(new THREE.BoxGeometry(0.12, 0.08, 0.04), [0.14, y + 0.08, 0.33], [0, 0.3, 0], null, '#111', 0.02); A(new THREE.BoxGeometry(0.12, 0.08, 0.04), [-0.14, y + 0.08, 0.33], [0, 0.3, 0], null, '#111', 0.02); });
    for (const s of [-1, 1]) A(new THREE.BoxGeometry(1.4, 0.36, 0.06), [s * 0.8, 3.9, 0], [0, 0, s * 0.25], null, '#2f6fbf', 0.1);
    A(new THREE.ConeGeometry(0.3, 0.6, 6), [0, 4.7, 0], null, null, '#e8b83a');
  } else if (t === 'torch') {
    A(new THREE.CylinderGeometry(0.07, 0.09, 2.1, 7), [0, 1.05, 0], null, null, WOOD);
    A(new THREE.CylinderGeometry(0.17, 0.09, 0.22, 8, 1, true), [0, 2.16, 0], null, null, '#3a2a1c');
    A(new THREE.CylinderGeometry(0.13, 0.13, 0.12, 8), [0, 2.1, 0], null, null, '#2a1c12');
    for (let i = 0; i < 3; i++) A(new THREE.TorusGeometry(0.085, 0.016, 4, 10), [0, 1.55 + i * 0.12, 0], [Math.PI / 2, 0, 0], null, '#a8834a');
    for (let i = 0; i < 4; i++) { const a = i / 4 * TAU; A(new THREE.SphereGeometry(0.12, 5, 4), [Math.cos(a) * 0.22, 0.06, Math.sin(a) * 0.22], null, [1, 0.6, 1], '#6d6862'); }
  } else if (t === 'dock') {
    for (let i = 0; i < 9; i++) A(new THREE.BoxGeometry(2.3, 0.09, 0.82), [0, 0.42, -1.4 + i * 0.86], [0, (i % 2 ? 0.02 : -0.02), 0], null, i % 2 ? '#7a5a38' : '#6b4a2c', 0.18);
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) A(new THREE.CylinderGeometry(0.1, 0.12, 3.6, 6), [s * 1.12, -1.2, -0.6 + i * 2.1], null, null, '#5a3f28');
    for (const s of [-1, 1]) A(new THREE.BoxGeometry(0.1, 0.1, 7.6), [s * 1.12, 0.62, 2.0], null, null, '#5c4128');
    A(new THREE.CylinderGeometry(0.11, 0.12, 1.2, 6), [1.12, 0.95, 5.6], null, null, '#5a3f28');
    A(new THREE.TorusGeometry(0.14, 0.03, 5, 10), [1.12, 1.25, 5.6], [Math.PI / 2, 0, 0], null, '#c9b07a');
    for (let i = 0; i < 3; i++) A(new THREE.CylinderGeometry(0.03, 0.03, 1.8, 5), [-0.6 + i * 0.25, 0.55, -1.0], [0, 0, Math.PI / 2 - 0.15], null, '#8a6a42');
  } else if (t === 'kennel') {
    A(new THREE.CylinderGeometry(2.2, 2.3, 0.1, 18), [0, 0.05, 0], null, null, '#7a6a48', 0.2);
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; if (i === 4) continue; A(new THREE.CylinderGeometry(0.05, 0.06, 0.95, 5), [Math.cos(a) * 2.15, 0.47, Math.sin(a) * 2.15], null, null, WOOD); }
    A(new THREE.TorusGeometry(2.15, 0.035, 4, 32, TAU * 0.9), [0, 0.85, 0], [Math.PI / 2, 0, 0.35], null, '#6b4a2c');
    A(new THREE.BoxGeometry(1.5, 0.85, 1.2), [-0.6, 0.5, -0.7], null, null, WALL, 0.2);
    for (const s of [-1, 1]) A(new THREE.BoxGeometry(1.7, 0.08, 0.85), [-0.6, 1.1, -0.7 + s * 0.33], [s * 0.6, 0, 0], null, TH, 0.2);
    A(new THREE.BoxGeometry(0.5, 0.5, 0.06), [-0.6, 0.35, -0.08], null, null, '#2a1c12', 0.05);
    A(new THREE.CylinderGeometry(0.28, 0.24, 0.12, 10), [0.9, 0.08, 0.6], null, null, '#8a6a42');
    A(new THREE.BoxGeometry(0.5, 0.08, 0.12), [1.0, 0.05, -0.5], [0, 0.5, 0], null, '#e8e2d0');
  } else if (t === 'armory') {
    A(new THREE.BoxGeometry(5.0, 0.22, 4.0), [0, 0.11, 0], null, null, '#7a5a3a');
    A(new THREE.BoxGeometry(4.8, 2.0, 0.14), [0, 1.2, -1.85], null, null, WALL, 0.2);
    for (const s of [-1, 1]) A(new THREE.BoxGeometry(0.14, 2.0, 3.8), [s * 2.33, 1.2, 0], null, null, WALL, 0.2);
    for (const s of [-1, 1]) for (const q of [-1, 1]) A(new THREE.BoxGeometry(0.18, 2.4, 0.18), [s * 2.4, 1.2, q * 1.95], null, null, WOOD);
    A(new THREE.BoxGeometry(5.6, 0.18, 4.8), [0, 2.55, -0.1], [0.16, 0, 0], null, TH, 0.22);
    for (let i = 0; i < 6; i++) A(new THREE.CylinderGeometry(0.02, 0.022, 1.9, 5), [-1.8 + i * 0.32, 1.15, -1.62], [0.18, 0, 0], null, '#6b4a2c');
    for (let i = 0; i < 6; i++) A(new THREE.ConeGeometry(0.035, 0.16, 5), [-1.8 + i * 0.32, 2.08, -1.45], [0.18, 0, 0], null, '#a7adb3', 0.05);
    for (let i = 0; i < 3; i++) { A(new THREE.BoxGeometry(0.1, 0.95, 0.03), [0.6 + i * 0.45, 1.1, -1.7], null, null, '#3a2a1c'); for (let k = 0; k < 4; k++) A(new THREE.BoxGeometry(0.04, 0.05, 0.035), [0.6 + i * 0.45 + (k % 2 ? 0.06 : -0.06), 0.8 + k * 0.17, -1.69], null, null, '#20262c', 0.05); }
    for (const s of [-1, 1]) { A(new THREE.CylinderGeometry(0.42, 0.42, 0.06, 14), [s * 2.2, 1.35, 0.7], [0, 0, Math.PI / 2], null, s > 0 ? '#2f6fbf' : '#b3321f', 0.1); A(new THREE.SphereGeometry(0.08, 6, 5), [s * 2.26, 1.35, 0.7], null, null, '#efe6d2', 0.05); }
    A(new THREE.BoxGeometry(1.6, 0.7, 0.8), [-0.8, 0.45, 0.6], null, null, '#6b4a2c');
    A(new THREE.CylinderGeometry(0.3, 0.35, 0.5, 8), [1.3, 0.3, 0.9], null, null, '#5a5650');
  } else if (t === 'aviary') {
    A(new THREE.CylinderGeometry(2.0, 2.1, 0.14, 16), [0, 0.07, 0], null, null, '#7a6a48', 0.2);
    for (let i = 0; i < 20; i++) { const a = i / 20 * TAU; A(new THREE.CylinderGeometry(0.03, 0.035, 3.6, 4), [Math.cos(a) * 1.9, 1.8, Math.sin(a) * 1.9], null, null, i % 5 ? '#8a6a42' : WOOD); }
    for (const y of [0.9, 2.1, 3.5]) A(new THREE.TorusGeometry(1.9, 0.035, 4, 30), [0, y, 0], [Math.PI / 2, 0, 0], null, '#6b4a2c');
    A(new THREE.ConeGeometry(2.5, 1.6, 16, 1, true), [0, 4.35, 0], null, null, TH, 0.22);
    A(new THREE.CylinderGeometry(0.06, 0.07, 2.4, 5), [0.3, 1.2, 0.2], null, null, WOOD);
    A(new THREE.CylinderGeometry(0.04, 0.04, 1.6, 5), [0.3, 2.3, 0.2], [0, 0.4, Math.PI / 2], null, WOOD);
    A(new THREE.ConeGeometry(0.3, 0.6, 6), [0, 5.3, 0], null, null, '#e8b83a');
  } else if (t === 'hall') {
    A(new THREE.CylinderGeometry(7.2, 7.4, 0.3, 28), [0, 0.15, 0], null, null, '#7a5a3a');
    A(new THREE.CylinderGeometry(6.6, 6.7, 2.4, 30, 1, true, 0.22, TAU - 0.44), [0, 1.5, 0], null, null, WALL, 0.2);
    for (let i = 0; i < 14; i++) { const a = 0.22 + i / 13 * (TAU - 0.44); A(new THREE.CylinderGeometry(0.12, 0.14, 2.6, 7), [Math.sin(a) * 6.7, 1.45, Math.cos(a) * 6.7], null, null, WOOD); }
    A(new THREE.ConeGeometry(8.7, 6.4, 30, 1, true), [0, 5.9, 0], null, null, TH, 0.24);
    A(new THREE.ConeGeometry(6.0, 3.9, 26, 1, true), [0, 7.35, 0], null, null, TH2, 0.24);
    A(new THREE.CylinderGeometry(0.3, 0.36, 9.6, 10), [0, 4.8, 0], null, null, WOOD);
    A(new THREE.ConeGeometry(0.5, 1.1, 8), [0, 9.6, 0], null, null, '#e8b83a');
    for (const s of [-1, 1]) A(new THREE.BoxGeometry(0.22, 2.6, 0.22), [s * 1.0, 1.4, 7.4], null, null, WOOD);
    A(new THREE.BoxGeometry(2.8, 0.18, 2.0), [0, 2.75, 7.4], [-0.2, 0, 0], null, TH, 0.2);
  } else if (t === 'stable') {
    A(new THREE.BoxGeometry(6.2, 0.12, 4.4), [0, 0.06, 0], null, null, '#8a7448', 0.2);
    for (let i = 0; i < 14; i++) A(new THREE.BoxGeometry(0.9, 0.04, 0.5), [-2.7 + (i % 7) * 0.9, 0.14, -1.4 + Math.floor(i / 7) * 2.6], [0, i * 0.7, 0], null, '#c9a85a', 0.25);
    for (const s of [-1, 1]) for (const q of [-1, 0, 1]) A(new THREE.CylinderGeometry(0.1, 0.12, 2.6, 6), [q * 2.9, 1.3, s * 2.0], null, null, WOOD);
    A(new THREE.BoxGeometry(6.0, 1.7, 0.12), [0, 0.95, -2.0], null, null, WALL, 0.2);
    for (const q of [-1, 1]) A(new THREE.BoxGeometry(0.1, 1.2, 3.6), [q * 1.0, 0.7, -0.2], null, null, '#6b4a2c');
    A(new THREE.BoxGeometry(6.8, 0.16, 5.2), [0, 2.75, 0], [0.22, 0, 0], null, TH, 0.22);
    A(new THREE.BoxGeometry(6.9, 0.16, 0.16), [0, 2.62, 2.05], null, null, WOOD);
    for (const y of [0.55, 1.05]) A(new THREE.BoxGeometry(6.0, 0.08, 0.08), [0, y, 2.05], null, null, '#6b4a2c');
    A(new THREE.BoxGeometry(1.6, 0.35, 0.45), [-2.0, 0.3, 2.45], null, null, '#5a4030');
    A(new THREE.BoxGeometry(1.45, 0.06, 0.32), [-2.0, 0.46, 2.45], null, null, '#4a7aa0', 0.05);
    for (let i = 0; i < 3; i++) A(new THREE.CylinderGeometry(0.38, 0.38, 0.75, 10), [2.2 - i * 0.82, 0.4, -1.4], [Math.PI / 2, 0, 0], null, '#c9a85a', 0.15);
  } else if (BGEOX[t]) BGEOX[t](A, G);
  return G.build();
}
const BGEO = {};
function bMesh(t) {
  const g = BGEO[t] || (BGEO[t] = bGeo(t));
  if (!BLD.mat) BLD.mat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
  const m = new THREE.Mesh(g, BLD.mat); m.castShadow = true; m.receiveShadow = true; return m;
}
function scaffold(r) {
  const G = new GB();
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; G.add(new THREE.CylinderGeometry(0.06, 0.07, 3.4, 5), M([Math.sin(a) * r * 0.85, 1.7, Math.cos(a) * r * 0.85]), '#7a5a34'); }
  G.add(new THREE.TorusGeometry(r * 0.85, 0.05, 4, 20), M([0, 1.6, 0], [Math.PI / 2, 0, 0]), '#7a5a34');
  for (let i = 0; i < 4; i++) G.add(new THREE.CylinderGeometry(0.12, 0.12, 1.6, 6), M([r + 0.6, 0.12 + i * 0.22, -0.6 + (i % 2) * 0.2], [0, 0, Math.PI / 2]), '#6b4a2c');
  const m = new THREE.Mesh(G.build(), BLD.mat); m.castShadow = true; return m;
}
// ---------- rules: unlocked by population, paid in wood, near water, on flat dry ground, inside the village ----------
function buildUnlocked(t) { const T = BTYPES[t]; return popCount() >= T.need && (!T.tier || Math.max(0, villageTier()) >= T.tier); }
function woodHave() { boxStore(); return (P.inv.wood || 0) + (CAMPH.store.wood || 0); }
function payWood(n) { const a = Math.min(P.inv.wood || 0, n); P.inv.wood -= a; n -= a; if (n > 0) CAMPH.store.wood -= n; }
function buildCheck(t, x, z, rot, sx) {
  const v = ownCamp(), T = BTYPES[t], r = T.r; if (!v) return 'קודם צריך מחנה משלך';
  if (T.span) return bridgeCheck(t, x, z, rot, sx);
  if (T.len) return segCheck(t, x, z, rot, sx, false, BLD.moveB);
  if (!BLD.moveB && !buildUnlocked(t)) return T.tier ? `נפתח כשהמחנה הופך ל${TIERN[T.tier]}` : `צריך שבט של ${T.need} אנשים`;
  if (!BLD.moveB && T.needB && !BLD.list.some(q => q.done && q.t === T.needB)) return `צריך קודם ${BTYPES[T.needB].n}`;
  if (!BLD.moveB && woodHave() < T.wood) return `צריך ${T.wood} עצים (יש ${woodHave()})`;
  const dv = Math.hypot(x - v.x, z - v.z), maxR = T.shore ? DOCK_R() : Math.max(45, villageR() + 26);
  if (dv > maxR) return `רחוק מדי מהכפר (${Math.round(dv)} מ׳ מהמדורה, אפשר עד ${Math.round(maxR)})`;
  if (dv < r + (CAMPH.up.walls ? 12 : 6.5)) return 'קרוב מדי למדורה ולמחנה';
  if (T.shore) return T.ship ? shipyardCheck(x, z, rot) : dockCheck(x, z, rot);
  const wd = waterDist(x, z), need = T.water || 80; if (wd > need) return `אין מים קרובים (${Math.round(wd)} מ׳, צריך עד ${need})`;
  let lo = 1e9, hi = -1e9;
  for (let k = 0; k <= 8; k++) { const a = k / 8 * TAU, px = x + (k ? Math.cos(a) * r * 0.85 : 0), pz = z + (k ? Math.sin(a) * r * 0.85 : 0); if (waterDepth(px, pz) > 0) return 'יש כאן מים'; const h = getH(px, pz); lo = Math.min(lo, h); hi = Math.max(hi, h); }
  if (hi - lo > 1.0 + r * 0.12) return 'השטח משופע מדי';
  for (const b of BLD.list) if (b !== BLD.moveB && bldDist(b, x, z) < r + bldR(b) + 0.6) return `צמוד מדי ל${BTYPES[b.t].n}`;
  if (T.def) for (const Tr of TRAPS.list) if (Math.hypot(Tr.x - x, Tr.z - z) < r + TRAPT[Tr.k].r + 0.4) return 'מלכודת בדרך';
  return '';
}
// ---------- placing a building ----------
function buildStart(t) {
  if (!ownCamp()) { UI.notify('קודם צריך מחנה משלך', 'bad'); return; }
  if (!buildUnlocked(t)) { UI.notify(`${BTYPES[t].n}: ${BTYPES[t].tier ? `נפתח כשהמחנה הופך ל${TIERN[BTYPES[t].tier]}` : `צריך שבט של ${BTYPES[t].need} אנשים`}`, 'bad'); return; }
  buildCancel(true);
  BLD.mode = t; BLD.rot = 0; BLD.chk = 0; BLD.chain = 0;
  if (!BLD.gmat) { BLD.gmat = new THREE.MeshBasicMaterial({ color: '#7dff8a', transparent: true, opacity: 0.36, depthWrite: false }); BLD.rmat = new THREE.MeshBasicMaterial({ color: '#7dff8a', transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide }); }
  BLD.ghost = new THREE.Mesh(BGEO[t] || (BGEO[t] = bGeo(t)), BLD.gmat); BLD.ghost.renderOrder = 5; scene.add(BLD.ghost);
  BLD.ring = new THREE.Mesh(new THREE.RingGeometry(BTYPES[t].r - 0.12, BTYPES[t].r, 40), BLD.rmat); BLD.ring.rotation.x = -Math.PI / 2; BLD.ring.renderOrder = 6; BLD.ring.visible = !BTYPES[t].len && !BTYPES[t].span; scene.add(BLD.ring);
  buildHud(true);
}
function buildCancel(silent) {
  const wasMove = !!BLD.moveB; BLD.moveB = null;
  if (BLD.ghost) { scene.remove(BLD.ghost); BLD.ghost = null; } if (BLD.ring) { scene.remove(BLD.ring); BLD.ring.geometry.dispose(); BLD.ring = null; }
  BLD.mode = null; buildHud(false);
  if (wasMove && !silent) manageStart(true);   // back to choosing what to move or take down
}
function buildHud(on) {
  if (!BLD.hud) {
    const el = document.createElement('div'); el.id = 'vxBuild'; el.className = 'pn';
    el.innerHTML = '<b></b><span></span><div class="vbb"><button class="btn pri" data-a="ok">לבנות כאן</button><button class="btn" data-a="rot">לסובב</button><button class="btn" data-a="cancel">ביטול</button></div><small class="vbk">E לבנות כאן · T לסובב · Esc ביטול</small>';
    document.body.appendChild(el); BLD.hud = el;
    for (const ev of ['pointerdown', 'touchstart']) el.addEventListener(ev, e => e.stopPropagation(), { passive: true });
    el.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.a === 'ok') buildConfirm(); else if (b.dataset.a === 'rot') { BLD.rot += Math.PI / 4; BLD.chk = 0; } else buildCancel(); });
  }
  BLD.hud.style.display = on ? 'flex' : 'none';
}
function buildConfirm() {
  if (!BLD.mode || !BLD.ghost) return;
  if (BLD.moveB) return moveConfirm();
  const t = BLD.mode, T = BTYPES[t], x = BLD.ghost.position.x, z = BLD.ghost.position.z, sx = T.len || T.span ? BLD.ghost.scale.x : 1, why = buildCheck(t, x, z, BLD.ghost.rotation.y, sx);
  if (why) { UI.notify(why, 'bad'); return; }
  const cost = T.span ? brCost(T.span * sx) : T.wood;
  payWood(cost);
  const s = addBuilding(t, x, z, BLD.ghost.rotation.y, 0, false, true, sx), zi = zoneTribeAt(x, z);
  if (T.span) s.cost = cost;
  // built in another tribe's land: they come to tear it down
  if (zi >= 0) borderProvoke(zi, { x, z, b: s }, T.n);
  if (T.len) {
    BLD.chain = (BLD.chain || 0) + 1; BLD.chk = 0; AUD.play('hammer', 0.6); PROG.flags.site = 1; PROG.flags.defSite = 1;
    if (BLD.chain === 1) UI.notify(TOUCH ? `${T.n}: הבונים יבנו אותה. ממשיכים: מסתכלים לאן שהקו ימשיך ולוחצים שוב "לבנות כאן". "סיום" כשגומרים` : `${T.n}: הבונים יבנו אותה. ממשיכים: מסתכלים לאן שהקו ימשיך ולוחצים E שוב. Esc כשגומרים`, 'good');
    saveGame(); return s;
  }
  buildCancel(true);
  UI.notify(`התחלתם לבנות ${BTYPES[t].n}. הבונים בונים, ואפשר לעזור: לעמוד ליד ולהחזיק את כפתור הזהב`, 'good'); AUD.play('hammer'); PROG.flags.site = 1;
  if (!clanAdults().some(m => m.cls === 'builder')) UI.notify('אין בשבט בונים. אפשר להפוך מישהו לבונה במסך השבט', 'bad');
  saveGame();
  return s;
}
// walls are solid: people and animals walk around the buildings, not through them
const BOBS = { stable: [[0, -1.6, 0.9], [-2.6, -1.6, 0.6], [2.6, -1.6, 0.6]], hut: [[0, 0, 2.15]], house: [[0, 0, 2.35]], granary: [[0, 0, 1.15]], tower: [[0, 0, 0.95]], totem: [[0, 0, 0.45]], long: [[0, -3.6, 3.3], [0, 0, 3.3], [0, 3.6, 3.3]], hall: [[0, 0, 6.6]], torch: [[0, 0, 0.22]], kennel: [[0.5, -0.6, 0.9]], armory: [[0, -0.4, 2.2]], aviary: [[0, 0, 1.85]] };
function addObstacles(b) {
  b.obs = [];
  for (const [ox, oz, r] of BOBS[b.t] || []) {
    const c = Math.cos(b.rot), s = Math.sin(b.rot), x = b.x + ox * c + oz * s, z = b.z - ox * s + oz * c;
    const k = g10(x, z);
    (TRUNKS.g[k] || (TRUNKS.g[k] = [])).push(x, z, r); b.obs.push([k, x, z]);
  }
}
function removeObstacles(b) {
  for (const [k, x, z] of b.obs || []) { const cell = TRUNKS.g[k]; if (!cell) continue; for (let j = 0; j < cell.length; j += 3) if (cell[j] === x && cell[j + 1] === z) { cell.splice(j, 3); break; } }
  b.obs = [];
}
function addBuilding(t, x, z, rot, work, done, fresh, sx) {
  const T = BTYPES[t], b = { t, x, z, rot, work: work || 0, done: !!done, mesh: null, scaf: null, sx: T.len || T.span ? sx || 1 : 1 };
  if (T.span) return bridgeAdd(b, fresh);
  if (T.def && T.def.water) return wgAdd(b, fresh);
  b.mesh = bMesh(t);
  let y = getH(x, z), tilt = 0;
  if (T.len) { const e = segEnds(b), h1 = getH(e.ax, e.az), h2 = getH(e.bx, e.bz); y = Math.min(y, (h1 + h2) / 2); tilt = Math.atan2(h2 - h1, e.L); }
  addObstacles(b);
  b.mesh.position.set(x, y - 0.05, z); b.mesh.rotation.set(0, rot, tilt, 'YXZ'); scene.add(b.mesh);
  // the ground is cleared: trees in the way are felled, bushes and stones removed
  const R = T.r * (b.sx || 1), trees = []; treeScan(TREES.g, x, z, R + 0.8, e => { trees.push(e); });
  let wood = 0; for (const e of trees) wood += treeCut(e, { anim: fresh === true, dir: Math.atan2(e.x - x, e.z - z) });
  b.cleared = wood;
  if (fresh && wood) { boxStore(); CAMPH.store.wood += wood; if (fresh === true) UI.notify(`פינו את השטח: ${trees.length} עצים נכרתו (+${wood} עצים למחסן)`, 'good'); }
  clearUnder(x, z, R + 1.2);
  if (!b.done) { if (!T.def) { b.scaf = scaffold(T.r); b.scaf.position.set(x, y, z); b.scaf.rotation.y = rot; scene.add(b.scaf); } BLD.sites.push(b); }
  BLD.list.push(b); siteLook(b);
  if (T.def) defDirty();
  return b;
}
// a piece the builders only planned (no wood paid for it yet) is just marked on the ground; it rises once work on it starts
function siteLook(b) {
  if (BTYPES[b.t].span) { bridgeLook(b); return; }
  if (BTYPES[b.t].def && BTYPES[b.t].def.water) { wgLook(b); return; }
  const k = b.done ? 1 : clamp(b.work / BTYPES[b.t].work, 0, 1);
  b.mesh.scale.set(b.sx || 1, b.done ? (b.broken ? 0.3 : 1) : b.unpaid ? 0.1 : 0.18 + 0.82 * k, 1);
}
function buildDone(b, quiet) {
  b.done = true; b.unpaid = false; b.work = BTYPES[b.t].work; siteLook(b);
  if (b.scaf) { scene.remove(b.scaf); b.scaf = null; }
  const i = BLD.sites.indexOf(b); if (i >= 0) BLD.sites.splice(i, 1);
  if (BTYPES[b.t].def) defOnDone(b);
  if (BTYPES[b.t].span) bridgeOn(b);
  if (quiet) return;
  const T = BTYPES[b.t];
  if (T.def) { if (!PROG.flags['built_' + b.t]) { PROG.flags['built_' + b.t] = 1; const in3 = defG(b.t, 'בו', 'בה', 'בהם'); UI.notify(`${T.ic} ${T.n} ${defG(b.t, 'מוכן', 'מוכנה', 'מוכנים')}. ${T.def.gate ? `אנשי השבט עוברים ${in3}, אויבים נעצרים` : T.def.pit ? 'אויב שידרוך עליו ייפול' : T.def.dmg ? `פושטים וטורפים נעצרים ${in3} ונפצעים` : `פושטים וטורפים נעצרים ${in3}`}`, 'good'); AUD.play('chime', 0.5); } PROG.flags.defBuilt = (PROG.flags.defBuilt || 0) + 1; saveGame(); return; }
  PROG.flags['built_' + b.t] = 1; PROG.flags.built = (PROG.flags.built || 0) + 1;
  if (b.t === 'totem') P.renown = (P.renown || 0) + 1;
  UI.big(`${T.n} ${T.g === 'f' ? 'מוכנה' : 'מוכן'}!`, T.cap ? `עכשיו יש מקום ל-${housing()} אנשים בכפר` : T.d); AUD.play('chime');
  for (const m of clanReal()) if (!m.young && dist2(m.pos, b) < 25 && rng() < 0.6) { gesture(m, 'cheer', 2.5); }
  saveGame();
}
function buildReset() { buildCancel(true); for (const b of BLD.list) { scene.remove(b.mesh); if (b.scaf) scene.remove(b.scaf); removeObstacles(b); structClear(b); } BLD.list = []; BLD.sites = []; BLD.tier = 0; defDirty(); bridgesReset(); }
function buildSave() {
  return BLD.list.map(b => {
    const o = { t: b.t, x: +b.x.toFixed(2), z: +b.z.toFixed(2), r: +b.rot.toFixed(3), w: Math.round(b.work), d: b.done ? 1 : 0 };
    if (BTYPES[b.t].span) { o.l = +b.sx.toFixed(3); o.c = b.cost || 0; }
    if (BTYPES[b.t].def) { if (b.sx && b.sx !== 1) o.l = +b.sx.toFixed(3); if (b.hp != null) o.h = Math.round(b.hp); if (b.broken) o.k = 1; if (b.sprung) o.p = 1; if (b.unpaid) o.u = 1; if (b.hold) o.ho = 1; if (b.replaces) o.rp = BLD.list.indexOf(b.replaces); }
    return o;
  });
}
function buildLoad(list) {
  if (!list || !ownCamp()) return;
  const made = [];
  for (const q of list) {
    if (!BTYPES[q.t]) { made.push(null); continue; }
    const b = addBuilding(q.t, q.x, q.z, q.r || 0, q.w || 0, false, false, q.l || 1); made.push(b);
    if (q.u) b.unpaid = true; if (q.p) b.sprung = true; if (q.c) b.cost = q.c; if (q.ho) b.hold = true;
    if (q.d) { buildDone(b, true); if (q.h != null) b.hp = q.h; if (q.k) { b.broken = true; b.hp = 0; } defLook(b); }
  }
  list.forEach((q, i) => { if (q.rp != null && made[i] && made[q.rp]) made[i].replaces = made[q.rp]; });
  BLD.tier = villageTier(); defDirty();
}
// what each stage asks for: people (everyone who lives in the village), houses (huts, houses, longhouses and the hall), the council hall
const TIER_REQ = [null, { pop: 6, houses: 2 }, { pop: 14, houses: 4 }, { pop: 30, houses: 0, hall: 1 }, { pop: 60, houses: 12, hall: 1 }];
function tierHave() {
  let houses = 0, hall = false;
  for (const b of BLD.list) if (b.done) { if (b.t === 'hut' || b.t === 'house' || b.t === 'long' || b.t === 'hall') houses++; if (b.t === 'hall') hall = true; }
  return { pop: popCount(), houses, hall };
}
function tierMet(t, h) { const R = TIER_REQ[t]; return !R || (h.pop >= R.pop && h.houses >= (R.houses || 0) && (!R.hall || h.hall)); }
function villageTier() {
  if (!ownCamp()) return -1;
  const h = tierHave(); for (let t = 4; t >= 1; t--) if (tierMet(t, h)) return t;
  return 0;
}
CTXT.build = ['hammer', 'לבנות', 'להחזיק כדי לעזור בבנייה'];
// a site close by (a bridge is worked on from either bank)
function siteNear() { const a = P.a; return BLD.sites.find(s => { if (s.done) return false; if (BTYPES[s.t].span) { const e = s.br || brEnds(s); return Math.min(Math.hypot(e.ax - a.pos.x, e.az - a.pos.z), Math.hypot(e.bx - a.pos.x, e.bz - a.pos.z)) < 3.6; } return Math.hypot(s.x - a.pos.x, s.z - a.pos.z) < BTYPES[s.t].r + 2.2; }) || null; }
CTXH.build = dt => {
  const s = siteNear(); if (!s) return;
  // a piece the builders only planned is paid when work on it starts, also when the hunter does the work himself
  if (s.unpaid) {
    const T0 = BTYPES[s.t], have = woodHave();
    if (have < T0.wood) { if (G.t - (BLD.payT || -99) > 4) { BLD.payT = G.t; UI.notify(`צריך ${T0.wood} עצים כדי לבנות את ${T0.def ? defDN(s.t) : 'ה' + T0.n} (יש ${have})`, 'bad'); } return; }
    payWood(T0.wood); s.unpaid = false;
  }
  const a = P.a; a.chopT = 0; a.yaw += angDiff(a.yaw, Math.atan2(s.x - a.pos.x, s.z - a.pos.z)) * Math.min(1, dt * 5);
  a.buildT = 0.3; s.work += dt * 2.2; if ((BLD.snd = (BLD.snd || 0) - dt) <= 0) { BLD.snd = 0.45; AUD.play('hammer', 0.7); }
  vxProgress(s.work / BTYPES[s.t].work, `בונים ${BTYPES[s.t].n}...`);
};
function buildUpdate(dt) {
  for (const s of BLD.sites.slice()) { siteLook(s); if (s.work >= BTYPES[s.t].work) buildDone(s); }
  // towers mark predators that come near the village
  if ((BLD.towerT = (BLD.towerT || 0) - dt) <= 0) {
    BLD.towerT = 2;
    for (const b of BLD.list) if (b.done && b.t === 'tower') shQuery(b.x, b.z, 70, x => { if (x.alive && !x.pet && !x.tribe && (x.sp.ai === 'pred' || x.sp.ai === 'pack' || x.sp.ai === 'croc') && G.t - (x.towerT || -99) > 30) { x.towerT = G.t; P.pings.push({ x: x.pos.x, z: x.pos.z, t: 10 }); } });
  }
  const tier = villageTier();
  if (tier > BLD.tier && BLD.tier >= 0) { BLD.tier = tier; PROG.flags['tier' + tier] = 1; polEvent(10, `המחנה הפך ל${TIERN[tier]}`); UI.big(`${TIERN[tier]}!`, `המחנה שלך הפך ל${TIERN[tier]}. ${popCount()} אנשים גרים בו`); AUD.play('cheer'); saveGame(); }
  else if (tier >= 0) BLD.tier = Math.max(BLD.tier, tier);
  if (!BLD.mode || !BLD.ghost) return;
  const a = P.a, T = BTYPES[BLD.mode], d = T.r + 2.4, fx = Math.sin(CAM.yaw), fz = Math.cos(CAM.yaw);
  let x = a.pos.x + fx * d, z = a.pos.z + fz * d, rot = Math.atan2(a.pos.x - x, a.pos.z - z) + BLD.rot;
  // a dock snaps to the waterline in view, and always faces the open water
  if (T.shore) { const s = dockSnap(a.pos.x, a.pos.z, CAM.yaw); if (s) { x = s.x; z = s.z; rot = s.rot; } }
  let y = getH(x, z), tilt = 0, sx = 1;
  if (T.len) { const s = segAim(BLD.mode, a, fx, fz); x = s.x; z = s.z; rot = s.rot; tilt = s.tilt; sx = s.sx; y = Math.min(getH(x, z), s.y); BLD.seg = s; }
  else if (T.span) { const s = bridgeAim(a, fx, fz); x = s.x; z = s.z; rot = s.rot; tilt = s.tilt; sx = s.sx; y = s.y + 0.05; BLD.brg = s; }
  BLD.ghost.position.set(x, y - 0.05, z); BLD.ghost.rotation.set(0, rot, tilt, 'YXZ'); BLD.ghost.scale.x = sx;
  BLD.ring.position.set(x, y + 0.08, z);
  BLD.chk -= dt;
  if (BLD.chk <= 0) {
    BLD.chk = 0.15; BLD.why = buildCheck(BLD.mode, x, z, rot, sx); BLD.ok = !BLD.why; BLD.zone = BLD.ok ? zoneTribeAt(x, z) : -1;
    const c = !BLD.ok ? '#ff6a5a' : BLD.zone >= 0 ? '#ffb13b' : '#7dff8a'; BLD.gmat.color.set(c); BLD.rmat.color.set(c);
    const h = BLD.hud; h.firstChild.textContent = BLD.moveB ? `${T.ic} מזיזים: ${T.n}` : T.span && BLD.brg ? `${T.ic} ${T.n} · ${Math.round(BLD.brg.L)} מ׳ · ${BLD.brg.cost} עצים` : `${T.ic} ${T.n} · ${T.wood} עצים${BLD.chain ? ` · ${BLD.chain} בקו` : ''}`;
    h.querySelector('[data-a="ok"]').textContent = BLD.moveB ? 'להעביר לכאן' : 'לבנות כאן'; h.children[1].textContent = BLD.ok ? (T.shore ? 'אפשר לבנות כאן. המעגן נצמד לגדה ופונה אל המים' : T.span ? 'אפשר לבנות כאן: הגשר נמתח מגדה לגדה, והבונים בונים אותו מהגדה' : T.len ? (BLD.seg && BLD.seg.closes ? 'אפשר לבנות כאן · הקטע סוגר את הקו' : BLD.seg && BLD.seg.snapped ? 'אפשר לבנות כאן · ממשיך את הקו' : 'אפשר לבנות כאן · מתחילים קו חדש') : T.def ? 'אפשר לבנות כאן' : `אפשר לבנות כאן · מים במרחק ${Math.round(waterDist(x, z))} מ׳`) : BLD.why;
    if (BLD.zone >= 0) h.children[1].textContent = `⚠️ זה השטח של ${campName(BLD.zone)}: אם תבנו כאן, הם יתקפו`;
    h.children[1].style.color = BLD.zone >= 0 ? '#e0892a' : '';
    h.querySelector('[data-a="cancel"]').textContent = BLD.chain ? 'סיום' : 'ביטול';
    if (T.shore && !BLD.ok && buildUnlocked(BLD.mode) && woodHave() >= T.wood && !/מדורה|שבט אחר/.test(BLD.why)) {
      // a dock that cannot stand here: point to the nearest good bank
      const hs = dockHint(); h.children[1].textContent = BLD.why + (hs ? ` · מקום טוב: ${whereIs({ pos: hs })}` : '');
      if (hs && (BLD.pingT = (BLD.pingT || 0) - 0.15) <= 0) { BLD.pingT = 2.5; P.pings.push({ x: hs.x, z: hs.z, t: 3 }); }
    }
    h.querySelector('[data-a="ok"]').disabled = !BLD.ok;
    h.querySelector('[data-a="rot"]').hidden = !!T.shore || !!T.span || (T.len && BLD.seg && BLD.seg.snapped); h.querySelector('.vbk').textContent = T.span ? 'עומדים על הגדה ומסתכלים אל הגדה שמעבר למים · E לבנות · Esc ביטול' : T.shore ? 'מסתכלים אל המים: המעגן נצמד לגדה · E לבנות · Esc ביטול' : T.len ? `מסתכלים לאן שהקו ממשיך · E לבנות${BLD.seg && BLD.seg.snapped ? '' : ' · T לסובב'} · Esc ${BLD.chain ? 'סיום' : 'ביטול'}` : 'E לבנות כאן · T לסובב · Esc ביטול';
    if (BLD.moveB) { const k = h.querySelector('.vbk'); k.textContent = k.textContent.replace('E לבנות כאן', 'E להעביר לכאן').replace('E לבנות', 'E להעביר לכאן'); if (BLD.ok && BLD.zone < 0) h.children[1].textContent = h.children[1].textContent.replace('אפשר לבנות כאן', 'אפשר להעביר לכאן'); }
  }
  if (a.swimming || G.mode !== 'play') buildCancel();
}
// keys while placing a building (the mouse is busy turning the camera)
addEventListener('keydown', e => {
  if (!BLD.mode || G.mode !== 'play' || G.paused) return;
  if (e.code === 'KeyE' || e.code === 'Enter') { e.preventDefault(); e.stopImmediatePropagation(); if (!e.repeat) buildConfirm(); }
  else if (e.code === 'KeyT') { e.stopImmediatePropagation(); if (!e.repeat) { BLD.rot += Math.PI / 4; BLD.chk = 0; } }
  else if (e.code === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); buildCancel(); }
}, true);
(function () {
  const st = document.createElement('style');
  st.textContent = `#vxBuild{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 14px);transform:translateX(-50%);z-index:12;display:none;flex-direction:column;align-items:center;gap:4px;padding:10px 14px;border-radius:14px;min-width:min(420px,92vw);text-align:center}
#vxBuild b{font-size:16px}#vxBuild span{font-size:13px;color:var(--dim)}#vxBuild .vbk{font-size:11.5px;color:var(--dim);margin-top:2px}body.touch #vxBuild .vbk{display:none}#vxBuild .vbb{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:4px}#vxBuild .btn[disabled]{opacity:.45}
.ucard .unote{color:var(--ink)!important;font-weight:600}
body.touch #vxBuild{bottom:auto;top:calc(env(safe-area-inset-top,0px) + 58px);min-width:min(360px,70vw);padding:7px 10px}body.touch #vxBuild .btn{padding:6px 12px;font-size:13px}`;
  document.head.appendChild(st);
})();
// ================= THE PRICE OF GROWING: the jungle pushes back, wildlife retreats, animals defend their land =================
const PRESS = { lvl: 0, kills: 0, hunted: 0, t: 0, raidT: 300, agT: 120, day: -1, told: {}, raider: null, raidAt: null, cullT: 30 };
const PRESS_N = ['הג׳ונגל שקט', 'החיות שמות לב', 'החיות עצבניות', 'החיות תוקפות', 'מלחמה עם הג׳ונגל'];
const PRESS_D = ['', 'הכפר גדל, והחיות סביבו מתחילות לשים לב. מי שמתרחק לבד עלול להיתקל בהן',
  'השבט כורת וצד הרבה. חיות מגינות על השטח שלהן ותוקפות בלי סיבה',
  'הג׳ונגל נלחם בחזרה: עדרים וטורפים תוקפים את מי שיוצא מהכפר, וטורפים פושטים עליו',
  'השבט פלש לכל השטח סביבו. החיות שנשארו נלחמות על כל עץ'];
function pressureCalc() {
  const v = ownCamp(); if (!v) return 0;
  return clamp((popCount() - 4) / 12 + TREES.cut / 120 + bigBuildings() / 14 + PRESS.hunted / 200 + (PRESS.kills || 0) / 40, 0, 10);
}
const spFem = sp => /ה$/.test(sp.he || '');
const pressStage = (l = PRESS.lvl) => l < 1 ? 0 : l < 2.5 ? 1 : l < 4.5 ? 2 : l < 7 ? 3 : 4;
// how much wildlife the jungle still holds: forest cover and hunting both count
function wildK() { return clamp(Math.pow(forestK(), 1.4) * (1 - Math.min(0.75, PRESS.hunted / 500)), 0.1, 1); }
function pressureReset() { Object.assign(PRESS, { lvl: 0, kills: 0, hunted: 0, t: 0, raidT: 300, agT: 120, day: -1, told: {}, raider: null, raidAt: null, cullT: 30 }); }
function pressureSave() { return { k: PRESS.kills || 0, h: Math.round(PRESS.hunted), t: PRESS.told }; }
function pressureLoad(d) { if (!d) return; PRESS.kills = d.k || 0; PRESS.hunted = d.h || 0; PRESS.told = d.t || {}; PRESS.lvl = pressureCalc(); }
function pressureUpdate(dt) {
  const v = ownCamp(); if (!v) { PRESS.lvl = 0; return; }
  PRESS.t -= dt;
  if (PRESS.t <= 0) {
    PRESS.t = 2; const before = pressStage(), l = pressureCalc(), st = pressStage(l); PRESS.lvl = l;
    if (st > before && st > 0 && !PRESS.told[st]) { PRESS.told[st] = 1; UI.big(PRESS_N[st], PRESS_D[st]); AUD.play('growl', 0.5); saveGame(); }
  }
  // the hunted land slowly recovers when the hunting stops
  if (PRESS.day !== G.day) { if (PRESS.day >= 0) PRESS.hunted = Math.max(0, PRESS.hunted * 0.88 - 3); PRESS.day = G.day; }
  raidWatch();
  PRESS.cullT -= dt; if (PRESS.cullT <= 0) { PRESS.cullT = 45; wildCull(); }
  const st = pressStage(); if (st < 1 || !P.a || P.sleeping) return;
  PRESS.agT -= dt * (isNight() ? 1.4 : 1);
  if (PRESS.agT <= 0) { PRESS.agT = lerp(420, 55, clamp(PRESS.lvl / 9, 0, 1)) * rr(0.7, 1.3); territoryAttack(v); }
  if (st >= 2) {
    PRESS.raidT -= dt * (isNight() ? 1.6 : 1);
    if (PRESS.raidT <= 0) { PRESS.raidT = lerp(720, 150, clamp(PRESS.lvl / 9, 0, 1)) * rr(0.8, 1.2); villageRaid(v, false); }
  }
}
// animals that defend their land: big cats, bush dogs, caimans, anacondas, peccary herds and tapirs
const TERR_SP = new Set(['jaguar', 'puma', 'bushdog', 'caiman', 'anaconda', 'peccary', 'tapir']);
function invaderOk(b) {
  return b.alive && !b.isPlayer && !b.pet && !b.tribe && !b.hunter && !b.young && !b.cub && !b.legend && !b.cowCamp && !b.isPartner && TERR_SP.has(b.spId) && b.state !== 'fight' && b.state !== 'held' && !(b.stunT > 0);
}
function territoryAttack(v) {
  const R = villageR(), out = [], p = P.a;
  if (p && p.alive && !p.swimming && Math.hypot(p.pos.x - v.x, p.pos.z - v.z) < R + 170 && !(CAMPH.up.walls && Math.hypot(p.pos.x - v.x, p.pos.z - v.z) < 11)) out.push(p, p);
  for (const m of clanReal()) if (!m.hidden && m.alive && Math.hypot(m.pos.x - v.x, m.pos.z - v.z) > R * 0.55) out.push(m);
  if (!out.length) return;
  const tgt = pick(out);
  let best = null, bd = 1e9;
  shQuery(tgt.pos.x, tgt.pos.z, 75, (b, d) => { if (invaderOk(b) && (b.spId !== 'caiman' || d < 25) && (d < 40 || b.sp.ai === 'pred' || b.sp.ai === 'pack') && d < bd) { bd = d; best = b; } });
  if (!best) return;
  // close ones charge; far predators stalk their way in
  const cast = b => { const far = dist2(b.pos, tgt.pos) > 38; b.invader = true; b.provokedT = G.t + 60; b.terrWarn = 0; if (far) { b.state = 'hunt'; b.target = tgt; b.stT = 60; } else { b.state = 'fight'; b.foe = tgt; b.stT = 0; } };
  cast(best);
  let n = 1;
  if (best.group) for (const m of best.group.members) if (n < 4 && m !== best && invaderOk(m) && dist2(m.pos, best.pos) < 25) { cast(m); n++; }
  const near = P.a && dist2(tgt.pos, P.a.pos) < 140;
  if (near) {
    P.pings.push({ x: best.pos.x, z: best.pos.z, t: 10 });
    const herd = n > 1, who = herd ? `עדר ${best.sp.he}` : best.sp.he, f = !herd && spFem(best.sp);
    UI.notify(tgt.isPlayer ? `${who} ${f ? 'יוצאת להגן על השטח שלה' : 'יוצא להגן על השטח שלו'}. השבט פלש לטריטוריה ${f ? 'שלה' : 'שלו'}!` : `${who} ${f ? 'תוקפת' : 'תוקף'} את ${tgt.name}: השבט פלש לטריטוריה ${f ? 'שלה' : 'שלו'}`, 'bad');
    if (!PROG.flags.pressTold) { PROG.flags.pressTold = 1; setTimeout(() => UI.notify('ככל שהשבט גדל, כורת וצד, החיות סביב הכפר הופכות עוינות. לוחמים ומגדלי שמירה עוזרים', 'bad'), 3500); }
  }
}
// a predator (or a pack) raids the village; the warriors and the towers are what stop it
function villageRaid(v, small) {
  if (rng() > wildK() + 0.3) return;
  const R = villageR();
  let pred = null, bd = 1e9;
  shQuery(v.x, v.z, 260, (b, d) => { if (invaderOk(b) && (b.spId === 'jaguar' || b.spId === 'puma' || b.spId === 'bushdog') && d > R && d < bd) { bd = d; pred = b; } });
  if (!pred && !small && pressStage() >= 3) {
    for (let t = 0; t < 20 && !pred; t++) {
      const ang = rng() * TAU, d = R + rr(110, 170), x = v.x + Math.cos(ang) * d, z = v.z + Math.sin(ang) * d;
      if (!inBounds(x, z) || waterDepth(x, z) > 0 || getNY(x, z) < 0.8) continue;
      pred = new Animal(rng() < 0.6 ? 'jaguar' : 'puma', x, z, {});
    }
  }
  if (!pred) return;
  const kids = clanReal().filter(m => m.young && !m.hidden), weak = clanReal().filter(m => !m.hidden && (m.cls === 'gatherer' || m.young));
  const cows = v.cowGroup ? v.cowGroup.members.filter(m => m.alive) : [];
  const pool = [...weak, ...weak, ...cows, ...kids];
  const victim = pool.length ? pick(pool) : clanReal().find(m => !m.hidden) || null;
  if (!victim) return;
  const pack = pred.group && pred.spId === 'bushdog' ? pred.group.members.filter(m => invaderOk(m)).slice(0, 4) : [pred];
  for (const b of pack) { b.state = 'hunt'; b.target = victim; b.stT = 80; b.invader = true; b.provokedT = G.t + 60; }
  PRESS.raider = pred; PRESS.raidAt = { x: v.x, z: v.z };
  const tower = BLD.list.some(b => b.done && b.t === 'tower') || CAMPH.up.tower;
  P.pings.push({ x: pred.pos.x, z: pred.pos.z, t: 15 });
  const away = !P.a || dist2(P.a.pos, v) > R + 40;
  const many = pack.length > 1, f = many || spFem(pred.sp), who = many ? (pred.spId === 'bushdog' ? 'להקת כלבי יער' : `להקת ${pred.sp.he}`) : pred.sp.he;
  if (tower) UI.notify(`המגדל: ${who} ${f ? 'מתקרבת' : 'מתקרב'} לכפר! הלוחמים יוצאים`, 'bad');
  else UI.notify(`${who} ${f ? 'פושטת' : 'פושט'} על הכפר!${away ? ' והצייד רחוק' : ''}`, 'bad');
  const ws = clanAdults().filter(m => m.cls === 'warrior' && !m.escort);
  for (const w of ws.slice(0, 3)) { w.hidden = false; w.state = 'fight'; w.foe = pred; }
  if (away && DEP.away && depWho()) depRally(v, pack, `${who} ${f ? 'תוקפת' : 'תוקף'}`);
}
function raidWatch() {
  const r = PRESS.raider; if (!r) return;
  if (!r.alive || r.gone || r.state === 'flee' || (r.target && !r.target.alive && r.state !== 'hunt')) {
    const won = !r.alive || r.state === 'flee';
    PRESS.raider = null;
    if (won && PRESS.raidAt && dist2(r.pos, PRESS.raidAt) < villageR() + 80) { PROG.flags.raidWon = 1; UI.notify('הכפר הדף את הפשיטה!', 'good'); for (const m of clanAdults()) if (m.cls === 'warrior' && dist2(m.pos, r.pos) < 30) gesture(m, 'cheer', 2); }
    return;
  }
  if (r.state !== 'hunt' && r.state !== 'fight') PRESS.raider = null;
}
// an unguarded camp still attracts raiders while you are away
function campRaidUpdate(dt) {
  if (!P.human || G.mode !== 'play' || !P.a || !P.a.alive) return;
  const c = ownCamp(); if (!c || CAMPH.up.fence || CAMPH.up.walls) return;
  if (Math.hypot(P.a.pos.x - c.x, P.a.pos.z - c.z) < 60) return;
  RAID.t -= dt * (isNight() ? 1.5 : 1); if (RAID.t > 0) return; RAID.t = rr(220, 340);
  villageRaid(c, true);
}
// ---------- wildlife follows the forest: fewer trees and more hunting mean fewer animals ----------
function faunaTarget(sp) { return Math.max(1, Math.round(sp.count * QUAL[SET.q].fauna * faunaK() * (P.human ? wildK() : 1))); }
let faunaT2 = 8;
function manageFauna(dt) {
  faunaT2 -= dt; if (faunaT2 > 0) return; faunaT2 = 8;
  const counts = {};
  for (const a of ANIMALS) if (a.alive && !a.cub && !a.isPlayer && !a.socialExtra && !a.owf) counts[a.spId] = (counts[a.spId] || 0) + 1;
  for (const id of GUIDE_ORDER) {
    const sp = SPECIES[id]; if (!sp.ai || !sp.count) continue;
    const target = faunaTarget(sp), c = counts[id] || 0;
    if (c < target * 0.7) spawnGroup(id, Math.min(target - c, Math.max(1, sp.group[1])), true);
  }
  for (let i = GROUPS.length - 1; i >= 0; i--) if (!GROUPS[i].members.length) GROUPS.splice(i, 1);
}
// when the jungle shrinks, the animals far from you quietly disappear
function wildCull() {
  if (!P.human || !ownCamp() || wildK() > 0.95) return;
  const have = {};
  for (const a of ANIMALS) if (a.alive && !a.isPlayer && !a.socialExtra && !a.legend && !a.pet && !a.hunter && !a.tribe && !a.cowCamp && !a.isPartner && !a.owf) have[a.spId] = (have[a.spId] || 0) + 1;
  let removed = 0;
  for (const id in have) {
    const sp = SPECIES[id]; if (!sp || !sp.count) continue;
    let extra = have[id] - Math.ceil(faunaTarget(sp) * 1.15); if (extra <= 0) continue;
    for (const a of ANIMALS.slice()) { if (extra <= 0 || removed > 12) break; if (a.spId === id && a.alive && !a.isPlayer && !a.socialExtra && !a.legend && !a.pet && !a.hunter && !a.tribe && !a.cowCamp && !a.isPartner && (a.dCam || 999) > 150) { a.remove(); extra--; removed++; } }
  }
}
// new animals are not born inside the village, nor in land that has been cleared of trees
function habitatPoint(hab, okFn) {
  const v = P.human ? ownCamp() : null, R = v ? villageR() + 90 : 0;
  const B = LANDBOX[SPAWN_LAND];
  for (let t = 0; t < 400; t++) {
    const x = rr(B[0], B[1]), z = rr(B[2], B[3]);
    if (SPAWN_LAND && landAt(x, z) !== SPAWN_LAND) continue;
    if (v && Math.hypot(x - v.x, z - v.z) < R) continue;
    if (okFn && !okFn({ x, z })) continue;
    const wd = waterDepth(x, z), h = getH(x, z), ny = getNY(x, z);
    if (hab === 'forest' && wd === 0 && h > 0.6 && h < 70 && ny > 0.8 && gridAt(FOREST, x, z) > 0.2) { if (TREES.cut > 30 && !treeNearest(x, z, 18)) continue; return { x, z }; }
    if (hab === 'open' && wd === 0 && h > 0.6 && h < 60 && ny > 0.8) return { x, z };
    if (hab === 'shore' && wd === 0 && h > 0.3 && h < 6 && ny > 0.78) { const w = nearestWater(x, z); if (w && Math.hypot(w.x - x, w.z - z) < 16) return { x, z }; }
    if ((hab === 'water' || hab === 'deep') && h < -1.7 && wd > 1.6) return { x, z };
    if (hab === 'stream' && wd === 0 && gridAt(STREAMD, x, z) < 9 && h > 0.5 && ny > 0.75) return { x, z };
    if (hab === 'beach' && wd === 0 && h > 0.2 && h < 2.6 && ny > 0.8 && z > coastZ(x) - 260) { const w = nearestWater(x, z); if (w && Math.hypot(w.x - x, w.z - z) < 24) return { x, z }; }
    if (hab === 'snow' && wd === 0 && h > 0.3 && h < 90 && ny > 0.8 && z < -980) return { x, z };
  }
  return null;
}
// ---------- those who leave the tribe walk away into the forest ----------
BRAIN.leaver = function (a, dt) {
  const v = ownCamp() || a.pos;
  if (!a.leaveTo) { const ang = Math.atan2(a.pos.x - v.x, a.pos.z - v.z) + rr(-0.6, 0.6); a.leaveTo = { x: clamp(v.x + Math.sin(ang) * 300, -LIMIT + 15, LIMIT - 15), z: clamp(v.z + Math.cos(ang) * 300, -LIMIT + 15, LIMIT - 15) }; }
  const d = a.steerTo(a.leaveTo.x, a.leaveTo.z, (a.sp.walk || 1.5) * 1.2, dt); a.pose = a.swimming ? 'swim' : a.speed > 0.2 ? 'move' : 'idle';
  if ((d < 3 || a.blocked > 3) && (a.dCam || 0) > 60) a.remove();
};
