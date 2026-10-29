// ================= PLAYER =================
const INPUT = { jx: 0, jy: 0, jmag: 0, joy: false, run: false, use: false, restHold: false, up: false, down: false, press: new Set(), lookDX: 0, lookDY: 0, zoom: 0, looking: false };
const pressed = k => { if (INPUT.press.has(k)) { INPUT.press.delete(k); return true; } return false; };
const P = {
  a: null, spId: 'jaguar', sp: null, isPred: true, food: 100, water: 100, stam: 100, air: 100, crouch: false, running: false,
  atkCD: 0, dodgeT: 0, courtCD: 0, callCD: 0, stun: 0, poison: 0, coil: null, qte: 0, coilCD: 0, noise: 1, resting: false, sleeping: false,
  restHeld: 0, eating: false, eatSnd: 0, ctx: null, carcass: null, target: null, targetT: 0, warnFrom: null, pounce: null, dive: false,
  kills: 0, renown: 0, partner: null, cubs: [], raised: 0, bondH: 0, litter: false, discovered: new Set(), poisonedBy: new Set(),
  pings: [], roarT: 0, courtT: 0, deathCause: '', sex: 'm', sleepSafe: false, days: 0
};
const you = (m, f) => P.sex === 'f' ? f : m;
const CAM = { yaw: 0, pitch: 0.3, dist: 6, tgt: new V3(), shake: 0, init: false };
const _ct = new V3();

function discover(id) {
  if (id === P.spId && G.mode === 'play' && !P.discovered.has(id)) { P.discovered.add(id); return; }
  if (P.discovered.has(id) || !SPECIES[id]) return;
  P.discovered.add(id);
  gainXP(8);
  if (G.mode === 'play') { UI.notify(id === 'hunter' ? `פגשת ציידים לראשונה. הם נוספו לספר השדה (${P.discovered.size}/${GUIDE_ORDER.length})` : `גילית מין חדש: ${SPECIES[id].he}. הוא נוסף לספר השדה (${P.discovered.size}/${GUIDE_ORDER.length})`, 'good'); AUD.play('chime'); }
}
function playerSpawnPoint(id) {
  const nearRiver = p => { const r = nearestOnPoly(p.x, p.z, RIVER); return r[0] < 70 && Math.hypot(p.x, p.z) < 330; };
  if (isBirdSp(id)) return birdSpawnPoint(id);
  if (id === 'hunter') { const h = humanSpawnPoint(); if (h) return h; }
  if (isFishSp(id)) return fishSpawnPoint(id, nearRiver);
  const noCamp = p => !nearCamp(p.x, p.z, 100);
  if (id === 'caiman') return habitatPoint('water', p => (Math.hypot(p.x - LAKE.x, p.z - LAKE.z) < 140 || nearRiver(p)) && noCamp(p)) || habitatPoint('water');
  if (id === 'capybara') return habitatPoint('shore', p => nearRiver(p) && noCamp(p)) || habitatPoint('shore', noCamp) || habitatPoint('shore');
  // cats: a flat clearing at the forest edge, facing the river, with nothing right behind the camera
  let best = null, bs = -1e9;
  for (let t = 0; t < 320; t++) {
    const x = rr(-330, 330), z = rr(-330, 330), r = nearestOnPoly(x, z, RIVER), d = r[0];
    if (d < 22 || d > 62 || waterDepth(x, z) > 0) continue;
    const h = getH(x, z), ny = getNY(x, z), fo = gridAt(FOREST, x, z);
    if (h < 1 || h > 35 || ny < 0.9 || fo < 0.1) continue;
    if (trunkPush({ x, z }, 2.2)) continue;
    if (nearCamp(x, z, 100)) continue;
    const i = Math.floor(r[1]), f = r[1] - i, A = RIVER[i], B = RIVER[Math.min(RIVER.length - 1, i + 1)];
    const yaw = Math.atan2(A.x + (B.x - A.x) * f - x, A.z + (B.z - A.z) * f - z);
    let rough = 0, back = 0;
    for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; rough += Math.abs(getH(x + Math.cos(a) * 4, z + Math.sin(a) * 4) - h); }
    for (let s = 1; s <= 7; s++) if (trunkPush({ x: x - Math.sin(yaw) * s, z: z - Math.cos(yaw) * s }, 0.6)) back++;
    const sc = -rough * 0.6 - back * 1.5 - Math.abs(fo - 0.4) * 4 - Math.abs(d - 36) * 0.04 + ny * 2;
    if (sc > bs) { bs = sc; best = { x, z, yaw }; }
  }
  return best || habitatPoint('forest', nearRiver) || habitatPoint('forest');
}
function startGame(sameSpecies, save) {
  if (P.a) { P.a.remove(); }
  for (const a of ANIMALS.slice()) if (a.socialExtra || a.cub) a.remove();
  for (const m of (P.mates || []).concat(P.partner ? [P.partner] : [])) if (m && m.alive) { m.isPartner = false; m.state = 'idle'; }
  if (G.preview) { G.preview.remove(); G.preview = null; }
  const id = SET.sp, base = SPECIES[id]; P.spId = id; P.sp = Object.assign({}, base, (base.pl && base.pl.over) || {}); P.fish = isFishSp(id); P.bird = isBirdSp(id); P.human = id === 'hunter'; P.isPred = base.ai === 'pred' || base.ai === 'pack' || id === 'otter' || id === 'anaconda' || base.ai === 'croc' || P.fish || P.human || id === 'harpy'; P.sex = SET.sex;
  Object.assign(P, { food: 92, water: 88, stam: 100, air: 100, crouch: false, atkCD: 0, dodgeT: 0, courtCD: 0, callCD: 0, stun: 0, poison: 0, coil: null, qte: 0, coilCD: 0,
    resting: false, sleeping: false, restHeld: 0, eating: false, target: null, warnFrom: null, pounce: null, dive: false, kills: 0, renown: 0, partner: null, cubs: [], raised: 0,
    bondH: 0, litter: false, pings: [], roarT: 0, courtT: 0, deathCause: '', sleepSafe: false, frenzy: null, stillT: 0, leapCD: 0, airTold: false, gulped: false, flying: false, perchC: null, carry: null, landTo: null, flySpd: 0, vy: 0, spears: 0, aimT: 0, tameT: 0, tameB: null, mods: Object.assign({}, MODS0), mates: [] });
  progReset(); resetCombat(); PROG.slot = null; socReset(); legacyReset(); climbReset(); homeReset(); growReset(); bugsReset(); tribeReset(); legendReset(); vxReset();
  resetHunters(); INPUT.up = INPUT.down = false; clearDen(); DEN.hinted = false;
  P.poisonedBy = new Set(); if (!sameSpecies) P.discovered = new Set();
  const sp = playerSpawnPoint(id) || { x: 0, z: 0 };
  const a = new Animal(id, sp.x, sp.z, { sex: SET.sex, scale: 1, yaw: sp.yaw, tpl: id === 'hunter' ? (SET.sex === 'f' ? 'hunter3' : 'hunter0') : skinTpl(id) });
  a.isPlayer = true; a.name = you('אתה', 'את'); a.state = 'player'; P.a = a; a.vd = 9999;
  if (P.sp.hp !== base.hp) a.maxHp = a.hp = P.sp.hp * a.baseScale;
  a.onLand = () => {
    if (P.pounce) {
      const t = P.pounce; P.pounce = null;
      if (t.alive && dist2(t.pos, a.pos) < (P.sp.reach || 1.5) * a.scale + t.rad + 1.4) {
        a.anim.atk = 0.45; hurt(t, (P.sp.dmg || 10) * 2.4 * rr(0.9, 1.1), a); CAM.shake = 0.35; AUD.play('bite');
        UI.notify(t.alive ? 'זינוק! הטרף פצוע' : 'זינוק מושלם!', 'good'); partnerAssist(t);
      }
    }
  };
  const tp = a.tpl;
  a.camSize = { jaguar: 1, puma: 1, ocelot: 0.62, capybara: 0.78, caiman: 1.15, piranha: 0.42, arapaima: 1.25, eel: 0.62, hunter: 0.85, macaw: 0.32, toucan: 0.3, harpy: 0.6, bushdog: 0.55, otter: 0.5, anaconda: 0.85, frog: 0.22 }[id] || 1;
  a.camH = P.fish ? a.height * 0.6 + 0.1 : P.bird ? a.height * 0.5 + 0.12 : P.human ? 1.5 * a.scale : (tp.kind === 'quad' ? (tp.by + tp.o.bodyR * 1.6) : 0.4) * a.scale + 0.3;
  if (P.fish) setupFishPlayer(a);
  if (P.bird) birdSetup(a, sp.crown);
  if (P.human) hunterSetup(a); if (id === 'bushdog') spawnPackEscort(a); if (id === 'otter') spawnPackEscort(a, 'otter', 3);
  for (const b of ANIMALS) if (b !== a && b.alive && preys(b, a) && dist2(b.pos, a.pos) < 60 && b.tpl.kind === 'quad') { const ang = rng() * TAU; b.pos.x = clamp(b.pos.x + Math.cos(ang) * 90, -WR, WR); b.pos.z = clamp(b.pos.z + Math.sin(ang) * 90, -WR, WR); b.home.copy(b.pos); b.ground(1, true); b.state = 'idle'; }
  spawnSocial(id);
  CAM.yaw = a.yaw; CAM.pitch = P.fish ? 0.22 : P.bird ? 0.28 : 0.3; CAM.dist = PHONE ? 5.4 : 6; CAM.init = false; CAM.dEff = null;
  G.time = 7.2; G.day = 1; G.rain = 0; G.rainTarget = 0; G.rainT = rr(150, 260); G.timeMul = 1; G.lastDawn = G.time; P.days = 0;
  G.mode = 'play'; G.paused = false;
  discover(id);
  UI.enterGame();
  UI.big(id === 'hunter' ? 'המסע מתחיל' : SPECIES[id].he, START_LINES[id] ? START_LINES[id]() : 'הג׳ונגל מחכה. צריך לאכול, לשתות ולמצוא את מקומך');
  if (save) applySave(save);
}
function spawnSocial(id) {
  const a = P.a, used = new Set();
  if (id === 'hunter') return;
  if (isBirdSp(id)) { spawnBirdSocial(id, a, used); return; }
  if (isFishSp(id)) { spawnFishSocial(id, a, used); return; }
  const mk = (sex, near) => {
    for (let t = 0; t < 40; t++) {
      const ang = rng() * TAU, d = rr(near ? 60 : 110, near ? 140 : 260), x = a.pos.x + Math.cos(ang) * d, z = a.pos.z + Math.sin(ang) * d;
      if (!inBounds(x, z) || getNY(x, z) < 0.78) continue;
      const wd = waterDepth(x, z);
      if (id === 'caiman' ? wd < 1.5 : wd > 0) continue;
      const n = NAMES[sex].find(q => !used.has(q)) || pick(NAMES[sex]); used.add(n);
      const b = new Animal(id, x, z, { sex }); b.name = n; b.social = true; b.socialExtra = true; b.affinity = rr(0, 20);
      if (id === 'caiman') b.state = 'float';
      return b;
    }
  };
  for (let i = 0; i < 3; i++) mk(a.sex === 'm' ? 'f' : 'm', i === 0);
  for (let i = 0; i < 2; i++) mk(a.sex, false);
  for (const b of ANIMALS) if (b.spId === id && !b.isPlayer) { b.social = true; if (!b.name) b.name = pick(NAMES[b.sex]); }
}
function partnerAssist(t) {
  if (P.human && P.a && P.a.pets && t && t.alive && !t.tribe && !t.isPartner && !t.cub && t.pet !== P.a) for (const b of P.a.pets) if (b.alive && !b.gone && b !== t && dist2(b.pos, t.pos) < 45) { b.state = 'fight'; b.foe = t; }
  if (t && t.alive && !t.isPartner && !t.cub) { P.packTarget = t; P.packT = 8; }
  const p = P.partner;
  for (const m of P.mates || []) if (m !== p && m.alive && !m.young && t && t.alive && t !== m && !t.cub && dist2(m.pos, t.pos) < 45) { m.state = 'fight'; m.foe = t; }
  if (P.a && P.a.pets && t && t.alive) for (const b of P.a.pets) if (b.alive && b !== t && dist2(b.pos, t.pos) < 40) { b.state = 'fight'; b.foe = t; }
  if (p && p.alive && !p.young && t && t.alive && t !== p && !t.cub && dist2(p.pos, t.pos) < 45) { p.state = 'fight'; p.foe = t; }
}
function onPlayerKill(t) {
  P.kills++; vxOnKill(t);
  PROG.kb = PROG.kb || {}; PROG.kb[t.spId] = (PROG.kb[t.spId] || 0) + 1;
  if (P.human && t.tpl.kind === 'fish' && P.inv) { const k = (t.sp.food || 5) >= 30 ? 3 : (t.sp.food || 5) >= 10 ? 2 : 1, room = Math.max(0, CARRY.fish - (P.inv.fish || 0)), n = Math.min(k, room); if (n > 0) { P.inv.fish = (P.inv.fish || 0) + n; t.food = 0; UI.notify(`${n === 1 ? 'דג נוסף' : n + ' דגים נוספו'} לארגז (יש לך ${P.inv.fish}). מבשלים ליד אש`, 'good'); } else UI.notify('הארגז מלא בדגים. אפשר לבשל או להפקיד במחנה', 'bad'); }
  gainXP(clamp(Math.round((t.sp.food || 10) * 0.3 + 5), 5, 30)); if ((t.sp.food || 0) >= 60 || t.spId === 'tapir' || t.spId === 'caiman' || t.spId === 'anaconda') PROG.flags.big = 1;
  if (P.fish && (t.tpl.kind === 'fish' || t.spId === 'eel')) { const f = Math.min(t.food, 45); P.food = Math.min(100, P.food + f * 1.6); t.food = 0; for (const c of P.cubs) c.cubHunger = Math.max(0, c.cubHunger - 40); UI.notify(`בלעת ${t.sp.he}!`, 'good'); AUD.play('gulp', 0.7); }
  else if (!t.hunter) UI.notify(t.tpl.kind === 'fish' ? `דגת ${t.sp.he}! אפשר לאכול אותו על הגדה` : `טרפת ${t.sp.he}!`, 'good');
  if (t.spId === 'caiman' || t.spId === 'tapir' || t.spId === 'anaconda') { P.renown++; UI.notify(you('ציד כזה מרשים את כולם. המעמד שלך עלה', 'ציד כזה מרשים את כולם. המעמד שלך עלה'), 'good'); }
  for (const b of ANIMALS) {
    if (!b.alive || b.spId !== P.spId || b.isPlayer || b.young || b.sex === P.a.sex || b.isPartner || b.escort || !b.name || !(t.food > 1)) continue;
    if (dist2(b.pos, t.pos) < 35 && b.affinity > -10 && !b.giftFrom?.has?.(t.id)) {
      b.affinity = Math.min(100, b.affinity + 22); b.state = 'eat'; b.target = t; b.stT = 25;
      UI.notify(heb(b, `${b.name} בא לאכול מהטרף שלך (${Math.round(b.affinity)}%)`, `${b.name} באה לאכול מהטרף שלך (${Math.round(b.affinity)}%)`), 'love');
      FX.spawn('heart', b.pos.x, b.pos.y + b.height, b.pos.z, 3);
      if (b.affinity >= 100) bond(b);
    }
  }
  if (P.partner && P.partner.alive && P.partner.state !== 'fight') { P.partner.state = 'eat'; P.partner.target = t; P.partner.stT = 25; }
}
function bond(t) {
  P.mates = aliveMates(); if (P.mates.includes(t) || P.mates.length >= maxMates()) return;
  P.mates.push(t); if (!P.partner) P.partner = t;
  Object.assign(t, { isPartner: true, affinity: 100, state: 'follow', followTarget: P.a, bondH: 0, litter: false, stolenBy: null });
  if (P.a.sex === 'f') { P.bondH = 0; P.litter = false; }
  const n = P.mates.length;
  UI.big(n === 1 ? you('מצאת בת זוג', 'מצאת בן זוג') : `בת זוג נוספת! עכשיו יש לך ${n}`, heb(t, `${t.name} הולך איתך מעכשיו`, `${t.name} הולכת איתך מעכשיו`));
  AUD.play('heart'); FX.spawn('heart', t.pos.x, t.pos.y + t.height, t.pos.z, 10);
  if (P.human) tribeJoin(t);
  setTimeout(() => askPreg(t), 2800);
}
function rivalSubmit(a) {
  a.defeated = true; a.isRival = false; P.renown += 1;
  PROG.flags.rival = 1;
  const back = returnHarem(a); if (back) UI.notify(back > 1 ? `${back} בנות הזוג שלך חוזרות אליך!` : (P.a.sex === 'm' ? 'בת הזוג שלך חוזרת אליך!' : 'בן הזוג שלך חוזר אלייך!'), 'love');
  const ang = rng() * TAU; a.home.set(clamp(a.pos.x + Math.cos(ang) * 220, -WR, WR), 0, clamp(a.pos.z + Math.sin(ang) * 220, -WR, WR));
  UI.notify(heb(a, `${a.name} נכנע ובורח. המעמד שלך עלה ל-${P.renown}`, `${a.name} נכנעה ובורחת. המעמד שלך עלה ל-${P.renown}`), 'good');
  UI.big('ניצחון', 'השטח הזה עכשיו שלך');
}
function onFamilyDeath(t) {
  if (t === P.partner || (P.mates || []).includes(t)) { P.mates = (P.mates || []).filter(q => q !== t); UI.notify(heb(t, `${t.name} מת. הג׳ונגל לא סולח`, `${t.name} מתה. הג׳ונגל לא סולח`), 'bad'); P.partner = P.mates[0] || null; }
  const i = P.cubs.indexOf(t);
  if (i >= 0) { P.cubs.splice(i, 1); UI.notify(P.human ? `איבדת ילד (${t.name}). שמור עליהם קרוב` : `איבדת גור (${t.name}). שמור עליהם קרוב`, 'bad'); }
}
function birth(m0) {
  const mother = m0 || (P.a.sex === 'f' ? P.a : P.partner); if (!mother) return;
  if (mother !== P.a) mother.litter = true;
  const n = P.human ? 1 : P.bird ? 2 : P.fish ? (P.spId === 'piranha' ? 6 : 4) : P.spId === 'caiman' ? 4 : P.spId === 'capybara' ? 3 : 2 + (rng() < 0.4 ? 1 : 0);
  for (let i = 0; i < n; i++) {
    const csx = rng() < 0.5 ? 'm' : 'f', c = new Animal(P.spId, mother.pos.x + rr(-1.5, 1.5), mother.pos.z + rr(-1.5, 1.5), { young: true, scale: rr(0.95, 1.05), sex: csx, tpl: P.human ? vxKidTpl(csx) : undefined });
    if (P.fish) { c.pos.set(mother.pos.x + rr(-0.6, 0.6), mother.pos.y, mother.pos.z + rr(-0.6, 0.6)); c.ownY = true; }
    if (P.bird) { c.pos.set(mother.pos.x + rr(-0.5, 0.5), mother.pos.y, mother.pos.z + rr(-0.5, 0.5)); c.ownY = true; }
    c.cub = true; c.state = 'follow'; c.followTarget = mother; c.age = 0; c.cubHunger = 15; c.name = P.human ? tribeName(c.sex) : pick(NAMES[c.sex]); c.socialExtra = true; c.mom = mother;
    if (P.human) tribeJoin(c);
    P.cubs.push(c); FX.spawn('heart', c.pos.x, c.pos.y + 0.4, c.pos.z, 3);
  }
  P.litter = true;
  if (P.bird) UI.big(`בקעו ${n} גוזלים`, you('הם עפים אחריך. כל פרי שתאכל מאכיל גם אותם', 'הם עפים אחרייך. כל פרי שתאכלי מאכיל גם אותם')); else UI.big(P.fish ? `בקעו ${n} דגיגים` : `נולדו ${n} ${P.human ? 'ילדים' : 'גורים'}`, P.fish ? you('הם שוחים צמוד אליך ואוכלים כשאתה אוכל. שמור עליהם', 'הם שוחים צמוד אלייך ואוכלים כשאת אוכלת. שמרי עליהם') : P.isPred ? 'הם יאכלו מכל טרף שתצוד. שמור עליהם מטורפים' : 'הם ילחכו עשב לידך. שמור עליהם מטורפים');
  AUD.play('heart');
}
function updateFamily(dt) {
  const gh = dt * (G.timeMul || 1) / HOUR;
  familyTick(gh);
  for (const c of P.cubs.slice()) {
    if (!c.alive) { onFamilyDeath(c); continue; }
    c.age += gh;
    const k = clamp(c.age / 60, 0, 1), s = c.baseScale * lerp(0.45, 1, k);
    if (Math.abs(s - c.scale) > 0.01) { const r = s / c.scale; c.scale = s; c.mesh.scale.setScalar(s); c.rad *= r; c.height *= r; c.swimDepth *= r; c.floatDepth *= r; c.maxHp = c.sp.hp * lerp(0.35, 1, k) * c.baseScale; }
    c.cubHunger = Math.min(100, c.cubHunger + dt * 0.11);
    if (c.cubHunger >= 100) c.hp -= dt * 1.2;
    if (c.hp <= 0) { kill(c, null); continue; }
    c.hp = Math.min(c.maxHp, c.hp + dt * 0.3);
    if (c.age >= 60) {
      c.cub = false; c.young = false; c.state = 'idle'; c.followTarget = null; c.socialExtra = false;
      const ang = rng() * TAU; c.home.set(clamp(c.pos.x + Math.cos(ang) * 200, -WR, WR), 0, clamp(c.pos.z + Math.sin(ang) * 200, -WR, WR));
      P.cubs.splice(P.cubs.indexOf(c), 1); P.raised++; noteHeir(c);
      if (c.mom && c.mom !== P.a && !P.cubs.some(q => q.mom === c.mom)) { c.mom.litter = false; c.mom.bondH = 0; }
      UI.notify(P.human ? heb(c, `${c.name} גדל והצטרף לשבט בתור ${clsWord(c)}`, `${c.name} גדלה והצטרפה לשבט בתור ${clsWord(c)}`) : heb(c, `${c.name} גדל ויצא לחיים עצמאיים`, `${c.name} גדלה ויצאה לחיים עצמאיים`), 'good');
      if (!P.cubs.length) { P.litter = false; P.bondH = 0; }
    }
  }
}
function startCoil(snake) { if (!P.a || !P.a.alive) return; if (P.bird && rng() < 0.75) { birdEvade(P.a, snake); return; } P.coil = snake; P.qte = 0.25; P.resting = false; UI.qte(true); AUD.play('hurt'); }
function endCoil(escaped) {
  const s = P.coil; P.coil = null; UI.qte(false); P.coilCD = 6;
  if (escaped) PROG.flags.escape = 1;
  if (escaped && s) { if (s.alive) { s.state = 'flee'; s.threat = P.a; s.stT = 0; hurt(s, 8, P.a); } UI.notify(you('השתחררת מהאנקונדה!', 'השתחררת מהאנקונדה!'), 'good'); }
}
function playerHurt(dmg, src) {
  const a = P.a;
  if (TOUCH && navigator.vibrate && dmg > 2) try { navigator.vibrate(Math.min(140, 25 + dmg * 3)); } catch (e) { }
  combatOnPlayerHurt(dmg, src);
  UI.hurt(Math.min(1, dmg / 22)); CAM.shake = Math.min(0.6, CAM.shake + dmg / 50);
  if (dmg > 2.5) AUD.play('hurt');
  if (src && src.alive && src !== a) { partnerAssist(src); discover(src.spId); }
  if (P.spId === 'piranha' && src && src.alive && src !== a && !src.escort) P.frenzy = { t: src, time: 6 };
  P.resting = false; if (P.sleeping) wake('התעוררת מכאב!');
  if (a.hp <= 0) {
    let cause = 'הג׳ונגל ניצח הפעם';
    if (src) cause = src.isRival || (src.spId === P.spId && src.name) ? `הפסדת בקרב מול ${src.name}` : `${src.sp.he} ${src.sp.ai === 'school' ? 'קרעו אותך במים' : src.sp.ai === 'eel' ? 'חישמל אותך' : 'טרף אותך'}`;
    if (src && src.hunter) cause = heb(src, 'צייד ניצח אותך בחנית', 'ציידת ניצחה אותך בחנית');
    playerDie(cause);
  }
}
function playerDie(cause) {
  const a = P.a; if (G.mode !== 'play') return;
  a.hp = 0; a.alive = false; a.dead = true; a.pose = 'dead'; a.speed = 0; a.food = 0;
  P.deathCause = cause; G.mode = 'dead'; P.coil = null; UI.qte(false);
  AUD.play('death');
  if (document.pointerLockElement) document.exitPointerLock();
  setTimeout(() => UI.showDeath(), 1800);
}
function wake(msg) { P.sleeping = false; P.resting = false; G.timeMul = 1; P.sleepSafe = false; if (msg) UI.notify(msg, 'bad'); UI.sleepFx(false); }
function threatsNear(r) {
  let n = null; shQuery(P.a.pos.x, P.a.pos.z, r, b => { if (b.alive && (preys(b, P.a) || (b.hunter && !b.fleeing && !P.fish && !P.human))) { n = b; return false; } if (b.state === 'warn' || (b.state === 'fight' && b.foe === P.a)) { n = b; return false; } });
  return n;
}
function contextAction() {
  const a = P.a; P.carcass = null;
  if (P.drag) return 'drop';
  if (P.ride) return 'unride';
  if (P.cart) return 'uncart';
  if (P.ship) { const c = shipCtx(); return c === 'unship' ? c : null; }
  if (P.climb) return climbContext();
  if (P.bird) return birdContext();
  if (P.isPred) {
    let best = null, bd = 1e9;
    shQuery(a.pos.x, a.pos.z, 6, (b, d) => { if (b.dead && !b.gone && b.food > 0.5 && b !== a && d < 1.4 + b.rad + a.rad && d < bd) { bd = d; best = b; } });
    if (best) { P.carcass = best; return P.human ? 'butcher' : 'eat'; }
  }
  if (P.fish) return null;
  { const cc = climbContext(); if (cc) return cc; }
  { const fc = frogCtx(); if (fc) return fc; }
  if (P.human && (P.a.pets || []).length < P.mods.petsMax) { const b = findTameNear(); if (b) { P.tameB = b; return 'tame'; } }
  if (P.human) { const hc = hunterCtx(); if (hc) return hc; }
  const fx = Math.sin(a.yaw), fz = Math.cos(a.yaw), r = a.rad * 0.8 + 0.5;
  if (a.swimming || waterDepth(a.pos.x + fx * r, a.pos.z + fz * r) > 0.03 || waterDepth(a.pos.x, a.pos.z) > 0.05) return 'drink';
  if (!P.isPred && P.spId !== 'frog' && getNY(a.pos.x, a.pos.z) > 0.75 && getH(a.pos.x, a.pos.z) > 0.4) return 'graze';
  return homeContext();
}
function findAttackTarget() {
  const a = P.a; let best = null, bs = -1e9; const fx = Math.sin(a.yaw), fz = Math.cos(a.yaw);
  shQuery(a.pos.x, a.pos.z, 7, (b, d) => {
    if (b === a || !b.alive || b.isPartner || b.cub || b.tribe || b.perched || b.pet === a || (b.pet && b.pet.tribe) || b.brain === 'captive') return;
    if (b.tpl.kind === 'bird' && b.pos.y - a.pos.y > 1.5) return;
    const fishy = b.tpl.kind === 'fish' || b.spId === 'eel', bank = fishy && !a.swimming && !P.fish;
    if (bank && (!P.isPred || b.pos.y < waterAt(b.pos.x, b.pos.z) - 1.15)) return;
    if (d > (P.sp.reach || 1.5) * a.scale + b.rad + 0.35 + (bank ? 1.0 : 0)) return;
    if (P.fish && Math.abs(b.pos.y + b.height * 0.5 - a.pos.y) > 0.8 + b.height * 0.5) return;
    const dot = d > 0.01 ? ((b.pos.x - a.pos.x) * fx + (b.pos.z - a.pos.z) * fz) / d : 1;
    if (dot < 0.2) return;
    const s = dot * 2 - d; if (s > bs) { bs = s; best = b; }
  });
  return best;
}
function doAttack() {
  const a = P.a, sp = P.sp;
  if (P.coil || HUNT.net || COMBAT.roll) { P.qte += 0.085; return; }
  if (P.spId === 'anaconda' && sqzAttack()) return;
  if (ROD.phase) { rodStrike(); return; }
  if (P.spId === 'frog') { frogTongue(); return; }
  if (P.climb) { climbAttack(); return; }
  if (P.drag) dropPrey(true);
  if (P.human) { hunterAttack(); return; }
  if (P.bird) { birdAttack(); return; }
  if (combatIntercept()) return;
  if (P.atkCD > 0 || P.stun > 0 || P.sleeping) return;
  P.atkCD = sp.atkCD || 0.7; a.anim.atk = 0.45; P.resting = false;
  const t = findAttackTarget();
  if (!t) { AUD.play('swipe'); return; }
  if ((t.tpl.kind === 'fish' || t.spId === 'eel') && !a.swimming && !P.fish) { fishSwipe(t); return; }
  a.yaw += angDiff(a.yaw, Math.atan2(t.pos.x - a.pos.x, t.pos.z - a.pos.z)) * 0.7;
  quickStrike(t);
  if (P.spId === 'piranha' && t.alive) { P.frenzy = { t, time: 7 }; PROG.flags.frenzy = 1; }
  partnerAssist(t);
}
function doJump() {
  if (P.boat) { boatJump(); return; }
  const a = P.a, sp = P.sp;
  if (P.coil || HUNT.net || COMBAT.roll) { P.qte += 0.085; return; }
  if (P.stun > 0 || P.sleeping || P.fish || P.bird) return;
  if (P.squeeze) { sqzEnd('release'); return; }
  if (ROD.phase) { rodStop('reel'); return; }
  if (P.climb) { climbDown(); return; }
  if (a.swimming) { if (canDive()) { if (P.human && P.dive) return; P.dive = !P.dive; a.dive = P.dive; if (P.dive) PROG.flags.dive = 1; UI.notify(P.dive ? you('צללת. כמעט אף אחד לא רואה אותך', 'צללת. כמעט אף אחד לא רואה אותך') : 'עלית לנשום'); } return; }
  if (a.airborne) return;
  P.resting = false;
  const th = P.warnFrom && P.warnFrom.alive && P.warnFrom.windup > 0 && (P.warnFrom.ranged || dist2(P.warnFrom.pos, a.pos) < 7) ? P.warnFrom : null;
  if (th) {
    perfectDodge(th);
    P.dodgeT = 0.45; a.yaw = Math.atan2(a.pos.x - th.pos.x, a.pos.z - th.pos.z) + (rng() < 0.5 ? 0.9 : -0.9);
    a.speed = 8; a.airborne = true; a.vy = 3.6; AUD.play('swipe'); return;
  }
  if (P.running && P.isPred && !P.human) {
    let best = null, bd = 1e9; const fx = Math.sin(a.yaw), fz = Math.cos(a.yaw);
    shQuery(a.pos.x + fx * 5, a.pos.z + fz * 5, 6.5, b => {
      if (b === a || !b.alive || b.isPartner || b.cub || b.perched || (b.tpl.kind !== 'quad' && b.tpl.kind !== 'snake')) return;
      const dd = dist2(b.pos, a.pos); if (dd < bd && dd < 10.5) { bd = dd; best = b; }
    });
    if (best) {
      a.yaw = Math.atan2(best.pos.x - a.pos.x, best.pos.z - a.pos.z); a.speed = Math.max(a.speed, Math.min(sp.run * 1.15, bd * 2.2 + 3));
      a.airborne = true; a.vy = 5.2; P.pounce = best; AUD.play('growl'); return;
    }
  }
  a.airborne = true; a.vy = P.spId === 'puma' ? 7.2 : P.spId === 'caiman' ? 3.2 : P.human ? 4.4 : 5.6; a.speed = Math.max(a.speed, 1.5);
  if (P.spId === 'frog') frogJump(a);
}
function doCall() {
  if (P.spId === 'eel') { eelShock(); return; }
  if (P.human) { hunterWhistle(); return; }
  if (P.spId === 'macaw' && P.callCD <= 0 && macawMob()) { P.callCD = 12; return; }
  const a = P.a; if (P.callCD > 0 || P.sleeping) return;
  P.callCD = 7; P.roarT = 1.4; P.resting = false;
  AUD.play(P.sp.call || 'growl');
  shQuery(a.pos.x, a.pos.z, 45, b => { if (b !== a && b.alive && preys(a, b) && b.state !== 'fight' && b.tpl.kind === 'quad') threatReact(b, a); });
  let n = 0;
  for (const b of ANIMALS) {
    if (!b.alive || b.spId !== P.spId || b === a || b.young || b.isPartner) continue;
    const d = dist2(b.pos, a.pos); if (d > 170) continue;
    if (b.sex !== a.sex && b.affinity > -15 && b.state !== 'fight') {
      n++; setTimeout(() => { if (!b.alive || G.mode !== 'play') return; AUD.at(P.sp.call || 'growl', b.pos, 0.9); P.pings.push({ x: b.pos.x, z: b.pos.z, t: 10, love: true }); b.state = 'curious'; b.stT = 35; }, 900 + rng() * 1500);
    } else if (b.sex === a.sex && d < 90 && !b.defeated) {
      setTimeout(() => { if (!b.alive || G.mode !== 'play') return; AUD.at('growl', b.pos, 0.8); P.pings.push({ x: b.pos.x, z: b.pos.z, t: 8, rival: true }); }, 700 + rng() * 1200);
    }
  }
  if (n) UI.notify(you('מישהו עונה לקריאה שלך. עקוב אחרי הסימון במפה', 'מישהו עונה לקריאה שלך. עקבי אחרי הסימון במפה'), 'love');
}
function doCourt() {
  const a = P.a, t = P.target;
  if (!t || !t.alive || t.spId !== P.spId || t.sex === a.sex || t.young || P.courtCD > 0) return;
  if (dist2(t.pos, a.pos) > 7.5) { UI.notify(you('צריך להתקרב קצת', 'צריך להתקרב קצת')); return; }
  if (P.human && t.hunter && !t.consent && chiefOf(t)) { consentAsk(t); return; }
  P.courtCD = 1.8; P.courtT = 1.6;
  if (t.isPartner) { FX.spawn('heart', t.pos.x, t.pos.y + t.height, t.pos.z, 4); AUD.play('purr'); return; }
  if (!t.isPartner && aliveMates().length >= maxMates()) { UI.notify(P.a.sex === 'm' ? `כבר יש לך ${maxMates()} בנות זוג. זה המקסימום` : 'כבר יש לך בן זוג'); return; }
  t.state = 'court'; t.stT = 3;
  const ch = 0.36 + P.mods.charm + t.affinity / 230 + P.renown * 0.05 - (P.food < 35 ? 0.15 : 0) - (a.hp < a.maxHp * 0.5 ? 0.15 : 0);
  if (rng() < ch) {
    t.affinity = Math.min(100, t.affinity + rr(17, 27));
    FX.spawn('heart', t.pos.x, t.pos.y + t.height, t.pos.z, 4); FX.spawn('heart', a.pos.x, a.pos.y + a.height, a.pos.z, 3); AUD.play('heart');
    UI.notify(heb(t, `${t.name} נענה לחיזור (${Math.round(t.affinity)}%)`, `${t.name} נענית לחיזור (${Math.round(t.affinity)}%)`), 'love');
    if (t.affinity >= 100) bond(t);
  } else {
    t.affinity = Math.max(-40, t.affinity - 7); P.courtCD = 4; t.state = 'idle'; t.stT = 2;
    AUD.at('growl', t.pos, 0.7);
    UI.notify(`${t.name} ${heb(t, 'לא מעוניין', 'לא מעוניינת')} כרגע. ${you('נסה', 'נסי')} שוב בעוד רגע, או ${you('הבא', 'הביאי')} טרף`, 'bad');
  }
}
function doChallenge() {
  const a = P.a, t = P.target;
  if (!t || !t.alive || t.young || t.isPartner || t.spId !== P.spId || t.sex !== a.sex) return;
  if (dist2(t.pos, a.pos) > 10) return;
  t.state = 'fight'; t.foe = a; t.isRival = true; P.roarT = 1; AUD.play('growl');
  UI.notify(heb(t, `${t.name} מקבל את האתגר!`, `${t.name} מקבלת את האתגר!`), 'bad');
}
function performUse(dt) {
  const a = P.a; P.eating = true; P.resting = false;
  if (CTXH[P.ctx]) { P.eating = false; CTXH[P.ctx](dt); return; }
  if (P.ctx === 'feed') { P.eating = false; feedDog(); return; }
  if (P.ctx === 'butcher') { P.eating = false; if (!CLB.latch) { CLB.latch = true; butcherNow(); } return; }
  if (P.ctx === 'cook') { P.eating = false; cookTap(); return; }
  if (P.ctx === 'fire') { P.eating = false; lightFire(); return; }
  if (P.ctx === 'meal') { mealStep(dt); return; }
  if (P.ctx === 'found') { P.eating = false; if (!CLB.latch) { CLB.latch = true; foundCamp(); } return; }
  if (P.ctx === 'bugs') { bugsStep(dt); return; }
  if (P.ctx === 'milk') { P.eating = false; if (!CLB.latch) { CLB.latch = true; milkCow(); } return; }
  if (P.ctx === 'rod') { P.eating = false; rodUse(); return; }
  if (P.ctx === 'camp') { P.eating = false; if (!CLB.latch) { CLB.latch = true; openCamp(); } return; }
  if (P.ctx === 'wood') { woodStep(dt); return; }
  if (P.ctx === 'den') { P.eating = false; if (!CLB.latch) { CLB.latch = true; openDenMenu(); } return; }
  if (P.ctx === 'buildden') { P.eating = false; if (!CLB.latch) { CLB.latch = true; buildDenHere(); } return; }
  if (P.ctx === 'climb' || P.ctx === 'descend') { P.eating = false; climbUse(); return; }
  if (P.ctx === 'drop') { P.eating = false; return; }
  if (P.ctx === 'tame' || P.ctx === 'perch' || P.ctx === 'fruit' || P.ctx === 'clay') { useExtra(dt); return; }
  if (P.ctx === 'eat' && P.carcass) {
    const c = P.carcass, bite = dt * 9;
    c.food -= bite; P.food = Math.min(100, P.food + bite * eatRate());
    if (P.fish || P.bird) for (const cb of P.cubs) cb.cubHunger = Math.max(0, cb.cubHunger - bite * 5);
    a.yaw += angDiff(a.yaw, Math.atan2(c.pos.x - a.pos.x, c.pos.z - a.pos.z)) * Math.min(1, dt * 6);
    if (c.sp.poison && !P.poisonedBy.has(c.id)) { P.poisonedBy.add(c.id); P.poison = 32; UI.notify('הצפרדע הייתה רעילה! הבריאות יורדת', 'bad'); discover('frog'); }
    P.eatSnd -= dt; if (P.eatSnd <= 0) { P.eatSnd = 0.55; AUD.play('eat'); }
  } else if (P.ctx === 'drink') { P.water = Math.min(100, P.water + dt * 22); P.eatSnd -= dt; if (P.eatSnd <= 0) { P.eatSnd = 0.4; AUD.play('drink'); } }
  else if (P.ctx === 'graze') { P.food = Math.min(100, P.food + dt * 7.5); P.eatSnd -= dt; if (P.eatSnd <= 0) { P.eatSnd = 0.7; AUD.play('eat', 0.4); } }
}
function updatePlayer(dt) {
  const a = P.a; if (!a || !a.alive) return;
  const sp = P.sp;
  P.atkCD -= dt; P.dodgeT -= dt; P.courtCD -= dt; P.callCD -= dt; P.stun -= dt; P.roarT -= dt; P.courtT -= dt; P.coilCD -= dt;
  for (const p of P.pings) p.t -= dt; P.pings = P.pings.filter(p => p.t > 0);
  P.stillT = a.speed < 0.2 ? (P.stillT || 0) + dt : 0;
  if (P.frenzy) { P.frenzy.time -= dt; if (P.frenzy.time <= 0 || !P.frenzy.t.alive) P.frenzy = null; }
  if (P.human) { if (P.aimT > 0) { P.aimT -= dt; a.windup = Math.max(0, P.aimT); if (P.aimT <= 0) playerThrow(); } spearPickup(dt); }
  if (P.carry && (P.carry.gone || P.carry.food <= 0.5)) { P.carry.carriedBy = null; P.carry = null; }
  // stats
  const slow = P.sleeping ? 0.3 : 1, tm = G.timeMul || 1;
  P.food = Math.max(0, P.food - dt * (100 / 820) * (P.isPred ? 1 : 0.85) * P.mods.hunger * slow * Math.min(tm, 3) * ATMO.cold);
  P.water = P.fish ? 100 : Math.max(0, P.water - dt * (100 / 600) * (a.swimming ? 0.25 : 1) * P.mods.hunger * slow * Math.min(tm, 3) * ATMO.heat);
  if (P.food <= 0 || P.water <= 0) { a.hp -= dt * 1.5; if (a.hp <= 0) { playerDie(P.food <= 0 ? you('מתת מרעב', 'מתת מרעב') : you('מתת מצמא', 'מתת מצמא')); return; } }
  else if (P.poison <= 0) a.hp = Math.min(a.maxHp, a.hp + dt * P.mods.regen * (inDen() ? 1.8 : 1) * (P.sleeping ? 3.5 : P.resting ? 2.2 : 0.45));
  if (P.poison > 0) { P.poison -= dt; a.hp -= dt * 2.1; if (a.hp <= 0) { playerDie('הרעל הכריע אותך'); return; } }
  if (P.fish) { if (!fishAir(dt)) return; }
  else if (P.dive && a.swimming) { P.air -= dt * P.mods.air * 100 / (P.spId === 'caiman' ? 160 : P.spId === 'anaconda' ? 200 : P.human ? 45 : 70); if (P.air <= 0) { a.hp -= dt * 8; if (a.hp <= 0) { playerDie(you('טבעת', 'טבעת')); return; } } }
  else { P.air = Math.min(100, P.air + dt * 30); if (!a.swimming) { P.dive = false; a.dive = false; } }
  // QTE (anaconda)
  if (P.coil) { P.qte = Math.max(0, P.qte - dt * 0.17); if (P.qte >= 1) endCoil(true); else if (!P.coil.alive) endCoil(false); }
  // sleep
  const restKey = KEYS.KeyZ || INPUT.restHold;
  P.restHeld = restKey ? P.restHeld + dt : 0;
  if (P.restHeld > 0.8 && !P.sleeping) {
    P.restHeld = -99;
    if (sleepBlocker(inDen() ? 5 : 10)) UI.notify('יש סכנה ממש קרובה. אי אפשר לישון עכשיו', 'bad');
    else { P.sleeping = true; P.resting = true; G.timeMul = 30; P.sleepSafe = true; UI.sleepFx(true); UI.notify(isNight() ? 'נרדמת. הלילה עובר מהר' : 'נרדמת. הזמן עובר מהר עד הבוקר. נגיעה במנוחה מעירה'); }
  }
  if (P.sleeping) {
    P.sleepCheck = (P.sleepCheck || 0) - dt;
    if (P.sleepCheck <= 0) { P.sleepCheck = 0.5; if (sleepBlocker(inDen() ? 4 : 7)) wake('התעוררת! משהו מתקרב'); }
    if (G.time > 6 && G.time < 7) wake(); 
  }
  // movement input
  let ix = 0, iz = 0;
  if (KEYS.KeyW || KEYS.ArrowUp) iz += 1; if (KEYS.KeyS || KEYS.ArrowDown) iz -= 1;
  if (KEYS.KeyA || KEYS.ArrowLeft) ix -= 1; if (KEYS.KeyD || KEYS.ArrowRight) ix += 1;
  if (INPUT.joy) { ix += INPUT.jx; iz += INPUT.jy; }
  if (WAY.auto && !INPUT.joy && !(KEYS.KeyW || KEYS.KeyA || KEYS.KeyS || KEYS.KeyD || KEYS.ArrowUp || KEYS.ArrowDown || KEYS.ArrowLeft || KEYS.ArrowRight)) iz += 1;
  let mag = Math.min(1, Math.hypot(ix, iz));
  const busy = P.stun > 0 || !!P.coil || !!P.squeeze || P.sleeping || !!HUNT.net || !!COMBAT.roll;
  if (busy) mag = 0;
  if (COMBAT.charging) mag *= 0.35;
  if (mag > 0.15) { P.resting = false; P.eating = false; }
  const cy = CAM.yaw;
  let dx = Math.sin(cy) * iz - Math.cos(cy) * ix, dz = Math.cos(cy) * iz + Math.sin(cy) * ix;
  const dl = Math.hypot(dx, dz) || 1; dx /= dl; dz /= dl;
  const wantRun = ((WAY.auto && WAY.run) || KEYS.ShiftLeft || KEYS.ShiftRight || INPUT.run || (INPUT.joy && INPUT.jmag > 0.94)) && mag > 0.3;
  if (P.fish) fishMove(dt, ix, iz, mag, busy, wantRun);
  else if (P.bird) birdMove(dt, ix, iz, mag, busy, wantRun);
  else if (P.boat) boatStep(dt, dx, dz, mag, wantRun);
  else if (P.ride) rideStep(dt, dx, dz, mag, wantRun);
  else if (P.cart) cartStep(dt, dx, dz, mag, wantRun);
  else if (P.ship) shipStep(dt, dx, dz, mag, wantRun);
  else if (P.climb && climbStep(dt)) { /* the climb drives the body */ }
  else {
  P.running = wantRun && P.stam > 2 && !P.crouch && !a.swimming;
  if (P.running) P.stam = Math.max(0, P.stam - dt * 13);
  else P.stam = Math.min(100, P.stam + dt * (P.resting ? 26 : 13) - (a.swimming && P.spId !== 'caiman' && P.spId !== 'capybara' ? dt * 15 : 0));
  let spd = 0;
  if (mag > 0.05) spd = a.swimming ? sp.swim * (P.dive ? 1.15 : 1) * Math.max(0.5, mag) : P.running ? sp.run : (P.crouch ? sp.walk * 0.65 : sp.walk * 1.4) * Math.max(0.35, mag);
  if (a.airborne) a.move(Math.sin(a.yaw), Math.cos(a.yaw), a.speed, dt);
  else a.move(dx, dz, spd * (P.drag ? 0.62 : 1), dt);
  }
  // actions
  if (!P.fish && !P.bird && a.swimming && canDive() && pressed('crouch')) { if (!P.dive) doJump(); }
  else if (pressed('crouch') && !P.fish && !P.bird) { P.crouch = !P.crouch; if (P.crouch) UI.notify(you('מתגנב. הטרף ישמע אותך רק מקרוב', 'מתגנבת. הטרף ישמע אותך רק מקרוב')); }
  if (pressed('jump')) doJump();
  if (pressed('attack')) doAttack();
  if (pressed('call')) doCall();
  if (pressed('court')) doCourt();
  if (pressed('fight')) doChallenge();
  if (pressed('rest')) { if (P.sleeping) wake(); else { P.resting = !P.resting; P.eating = false; } }
  P.ctx = busy ? null : contextAction();
  if ((KEYS.KeyE || INPUT.use) && P.ctx && !busy) { performUse(dt); PROG.flags[P.ctx] = 1; } else P.eating = false;
  if (P.human && !((KEYS.KeyE || INPUT.use) && P.ctx === 'tame')) P.tameT = Math.max(0, P.tameT - dt * 2);
  // pose
  let pose = 'idle';
  if (P.coil) pose = 'fight';
  else if (a.swimming) pose = 'swim';
  else if (P.sleeping) pose = 'sleep';
  else if (P.resting) pose = 'lie';
  else if (P.eating) pose = P.ctx === 'drink' ? 'drink' : 'eat';
  else if (P.roarT > 0 && a.speed < 0.5) pose = 'roar';
  else if (P.courtT > 0 && a.speed < 0.5) pose = 'court';
  else if (P.crouch) pose = 'crouch';
  else if (a.speed > 0.15) pose = 'move';
  a.pose = pose; a.crouch = P.crouch;
  if (P.climb) a.pose = P.climb.phase === 'perch' ? 'lie' : P.climb.phase === 'drop' ? 'leap' : 'climb';
  if (P.human) a.pose = humanPose(pose);
  else if (P.bird) a.pose = P.flying ? 'fly' : P.perchC ? 'perch' : 'ground';
  if (COMBAT.charging && a.tpl.kind === 'quad') a.pose = 'crouch';
  P.noise = (a.swimming ? (P.dive ? 0.12 : P.spId === 'caiman' ? 0.35 : 0.6) : P.running ? 1.4 : P.crouch ? 0.42 : a.speed > 0.2 ? 0.85 : 0.6) * (sp.stealth || 1) * (P.sleeping ? 0.6 : 1) * (P.crouch && !a.swimming && gridAt(FOREST, a.pos.x, a.pos.z) > 0.55 ? 0.75 : 1);
  if (P.warnFrom && (!P.warnFrom.alive || P.warnFrom.windup <= 0)) P.warnFrom = null;
  // target for UI & social
  P.targetT -= dt;
  if (P.targetT <= 0) {
    P.targetT = 0.15; let best = null, bs = -1e9; const fx = Math.sin(CAM.yaw), fz = Math.cos(CAM.yaw);
    shQuery(a.pos.x, a.pos.z, 18, (b, d) => {
      if (b === a || b.gone || !b.mesh.visible) return;
      const dot = d > 0.01 ? ((b.pos.x - a.pos.x) * fx + (b.pos.z - a.pos.z) * fz) / d : 1;
      if (d > 3.5 && dot < 0.55) return;
      const s = dot * 6 - d + (b.spId === P.spId ? 4 : 0) + (b.alive ? 0 : -3);
      if (s > bs) { bs = s; best = b; }
    });
    P.target = best;
  }
  updateFamily(dt);
}
function updateCamera(dt) {
  const a = P.a; if (!a) return;
  CAM.yaw -= INPUT.lookDX * 0.0028; CAM.pitch = clamp(CAM.pitch + INPUT.lookDY * 0.0028, P.fish || P.bird ? -0.75 : AIMX.on ? -1.1 : -0.25, 1.2); INPUT.lookDX = 0; INPUT.lookDY = 0;
  if (INPUT.zoom) { CAM.dist = clamp(CAM.dist * (1 + INPUT.zoom * 0.0012), 2.2, 16); INPUT.zoom = 0; }
  if (TOUCH && !INPUT.looking && a.speed > 1.2 && !a.airborne && a.alive) CAM.yaw += angDiff(CAM.yaw, a.yaw) * Math.min(1, dt * 0.8);
  _ct.set(a.pos.x, a.pos.y + a.camH, a.pos.z);
  if (!CAM.init) { CAM.tgt.copy(_ct); CAM.init = true; } else CAM.tgt.lerp(_ct, Math.min(1, dt * 12));
  const PE = P.fish && (a.airborne || a.pos.y > waterAt(a.pos.x, a.pos.z) - 0.4) ? Math.max(CAM.pitch, 0.42) : CAM.pitch;
  const want = CAM.dist * a.camSize, hx = -Math.sin(CAM.yaw) * Math.cos(PE), hz = -Math.cos(CAM.yaw) * Math.cos(PE), hl = Math.hypot(hx, hz) * want;
  let allow = want;
  if (hl > 1 && !(P.bird && P.flying)) { // keep tree trunks from hiding the animal
    const ux = hx / Math.hypot(hx, hz), uz = hz / Math.hypot(hx, hz), tp = { x: 0, z: 0 };
    for (let s = 0.7; s <= hl + 0.3; s += 0.4) { tp.x = CAM.tgt.x + ux * s; tp.z = CAM.tgt.z + uz * s; if (trunkPush(tp, 0.32)) { allow = Math.max(1.1, s - 0.55) / hl * want; break; } }
  }
  CAM.dEff = CAM.dEff == null || !isFinite(CAM.dEff) ? allow : allow < CAM.dEff ? allow : CAM.dEff + (allow - CAM.dEff) * Math.min(1, dt * 1.6);
  const dist = CAM.dEff;
  let cx = CAM.tgt.x + hx * dist, cz = CAM.tgt.z + hz * dist;
  let cy = CAM.tgt.y + Math.sin(PE) * dist;
  if (P.fish && !a.airborne && a.pos.y < waterAt(a.pos.x, a.pos.z) - 0.4) { const wc = waterAt(cx, cz); if (wc > -900) cy = Math.min(cy, wc - 0.22); }
  const gh = getH(cx, cz) + (P.fish ? 0.2 : 0.35); if (cy < gh) cy = gh;
  // aiming: an over-the-shoulder camera that looks exactly where the hunter aims, sky included
  CAM.aimK = clamp((CAM.aimK || 0) + (AIMX.on && P.human ? dt * 6 : -dt * 5), 0, 1);
  const ak = CAM.aimK * CAM.aimK * (3 - 2 * CAM.aimK);
  if (ak > 0) {
    const fx = Math.sin(CAM.yaw), fz = Math.cos(CAM.yaw), rx = -Math.cos(CAM.yaw), rz = Math.sin(CAM.yaw);
    const ax = a.pos.x - fx * 1.6 + rx * 0.55, az = a.pos.z - fz * 1.6 + rz * 0.55, ay = Math.max(a.pos.y + a.height * 0.95 + 0.2, getH(ax, az) + 0.45);
    cx = lerp(cx, ax, ak); cy = lerp(cy, ay, ak); cz = lerp(cz, az, ak);
  }
  camera.position.set(cx, cy, cz);
  CAM.shake = Math.max(0, CAM.shake - dt * 1.6);
  const s = CAM.shake * 0.25;
  if (ak > 0) {
    const cp = Math.cos(CAM.pitch), lx = cx + Math.sin(CAM.yaw) * cp * 25, ly = cy - Math.sin(CAM.pitch) * 25, lz = cz + Math.cos(CAM.yaw) * cp * 25;
    camera.lookAt(lerp(CAM.tgt.x, lx, ak), lerp(CAM.tgt.y, ly, ak), lerp(CAM.tgt.z, lz, ak));
  } else camera.lookAt(CAM.tgt.x + (rng() - 0.5) * s, CAM.tgt.y + (rng() - 0.5) * s, CAM.tgt.z + (rng() - 0.5) * s);
}

// ================= FISH LIFE: playable fish, shoals, fishing =================
const FISHP = { missTold: false, fishTold: false };
const isFishSp = id => { const s = SPECIES[id]; return !!s && (s.kind === 'fish' || s.ai === 'eel'); };
const START_LINES = {
  capybara: () => you('מצא מים, עשב ובני זוג. והיזהר מטורפים ומציידים', 'מצאי מים, עשב ובני זוג. והיזהרי מטורפים ומציידים'),
  caiman: () => you('הנהר הוא הממלכה שלך. חכה בשקט במים', 'הנהר הוא הממלכה שלך. חכי בשקט במים'),
  piranha: () => you('הלהקה שוחה איתך. נשיכה אחת שלך מתחילה טירוף', 'הלהקה שוחה איתך. נשיכה אחת שלך מתחילה טירוף'),
  arapaima: () => you('אתה ענק הנהר. רק אל תשכח לעלות לנשום', 'את ענקית הנהר. רק אל תשכחי לעלות לנשום'),
  eel: () => you('מכת חשמל משתקת כל מה שסביבך. ואל תשכח לעלות לנשום', 'מכת חשמל משתקת כל מה שסביבך. ואל תשכחי לעלות לנשום')
};

// ---------- pacu shoals near the banks ----------
function shoalSpot(okFn, near) {
  for (let t = 0; t < 300; t++) {
    let x, z;
    if (near) { const ang = rng() * TAU, d = rr(0, 45); x = near.x + Math.cos(ang) * d; z = near.z + Math.sin(ang) * d; }
    else { x = rr(-JL + 20, JL - 20); z = rr(-JL + 20, JL - 20); }
    const wd = waterDepth(x, z);
    if (wd < 0.85 || wd > 2.3 || getH(x, z) > -0.6) continue;
    if (okFn && !okFn({ x, z })) continue;
    return { x, z };
  }
  return null;
}
function spawnShoal(id, n, okFar) {
  const c = shoalSpot(okFar); if (!c) return n;
  const s = { kind: 'shoal', members: [], c: new V3(c.x, -0.35, c.z), home: new V3(c.x, 0, c.z), t: 0, scare: 0, sx: 0, sz: 0, think: 0 };
  GROUPS.push(s);
  for (let i = 0; i < n; i++) { const a = new Animal(id, c.x + rr(-1.5, 1.5), c.z + rr(-1.5, 1.5), { group: s }); a.slot = i; a.pos.y = -0.35; s.members.push(a); }
  return n;
}
function updateShoal(s, dt) {
  if (!s.members.length) return;
  s.t -= dt; s.think -= dt;
  if (s.think <= 0) {
    s.think = 0.3;
    let th = null; const m0 = s.members[0], p = P.a;
    shQuery(s.c.x, s.c.z, 9, (b, d) => {
      if (th || !b.alive || b.group === s || b.spId === 'pacu' || b.hunter) return;
      if (b.isPlayer) {
        if (P.fish) { if (d < 6 && preys(b, m0)) th = b; }
        else if (P.noise > 0.5 && d < 2.5 + P.noise * 3 && !(P.crouch && P.stillT > 1.2)) th = b;
        return;
      }
      if (((b.tpl.kind === 'fish' || b.spId === 'eel') && preys(b, m0) && d < 7) || ((b.spId === 'caiman' || b.spId === 'otter' || b.swimming) && d < 4.5)) th = b;
    });
    if (th) { s.scare = 2.4; const dx = s.c.x - th.pos.x, dz = s.c.z - th.pos.z, d = Math.hypot(dx, dz) || 1; s.sx = dx / d; s.sz = dz / d; }
    if (!FISHP.fishTold && p && p.alive && G.mode === 'play' && P.isPred && !P.fish && !p.swimming && Math.hypot(p.pos.x - s.c.x, p.pos.z - s.c.z) < 7) {
      FISHP.fishTold = true; UI.notify(you('יש דגים ליד הגדה. להתגנב, לעמוד בשקט ולתקוף כשהם קרובים', 'יש דגים ליד הגדה. להתגנב, לעמוד בשקט ולתקוף כשהם קרובים'));
    }
  }
  if (s.scare > 0) {
    s.scare -= dt;
    const nx = s.c.x + s.sx * 4.5 * dt, nz = s.c.z + s.sz * 4.5 * dt;
    if (waterDepth(nx, nz) > 0.8 && getH(nx, nz) < -0.5) { s.c.x = nx; s.c.z = nz; }
    else { const k = rng() < 0.5 ? 1.3 : -1.3, cs = Math.cos(k), sn = Math.sin(k), x = s.sx * cs - s.sz * sn; s.sz = s.sx * sn + s.sz * cs; s.sx = x; }
    s.c.y += (-0.95 - s.c.y) * Math.min(1, dt * 2); s.goal = null;
    return;
  }
  if (!s.goal || s.t <= 0 || Math.hypot(s.goal.x - s.c.x, s.goal.z - s.c.z) < 1.5) {
    const g = shoalSpot(null, s.home); s.goal = g ? { x: g.x, z: g.z, y: -rr(0.22, 0.5) } : { x: s.home.x, z: s.home.z, y: -0.4 }; s.t = rr(8, 22);
  }
  _tmp.set(s.goal.x - s.c.x, s.goal.y - s.c.y, s.goal.z - s.c.z); const d = _tmp.length() || 1;
  s.c.addScaledVector(_tmp, Math.min(1.1, d) * dt / d);
}
BRAIN.shoal = function (a, dt) {
  const s = a.group; if (!s) { fishWander(a, dt); return; }
  const i = a.slot || 0, ang = G.t * (0.5 + (i % 4) * 0.07) + i * 2.1, r = 1 + (i % 3) * 0.4;
  _tmp.set(s.c.x + Math.cos(ang) * r, s.c.y + Math.sin(G.t * 0.9 + i) * 0.12, s.c.z + Math.sin(ang) * r);
  swimToward(a, _tmp, s.scare > 0 || a.scared > 0 ? 4.6 : 1.5, dt);
};

// ---------- fish NPC helpers ----------
function fishWander(a, dt) {
  a.wT = (a.wT || 0) - dt;
  if (!a.goal || a.wT <= 0 || Math.hypot(a.goal.x - a.pos.x, a.goal.z - a.pos.z) < 1.5) {
    const g = waterGoal(a, 40, 1.2);
    a.goal = g ? { x: g.x, z: g.z, y: -rr(0.5, Math.min(2.2, waterDepth(g.x, g.z) - 0.4)) } : { x: a.home.x, z: a.home.z, y: -1 };
    a.wT = rr(8, 20);
  }
  _tmp.set(a.goal.x, a.goal.y, a.goal.z); swimToward(a, _tmp, (a.sp.swim || 2) * 0.55, dt);
}
function fishSocial(a, dt) {
  if (a.cub && denHold(a, dt)) return;
  a.stT -= dt;
  const p = P.a, sw = a.sp.swim || 2;
  if ((a.isPartner || a.cub || a.stolenBy) && a.followTarget && a.followTarget.alive) {
    const L = a.followTarget, off = a.cub ? 1.0 + (a.id % 4) * 0.45 : 2.4;
    const ang = (a.id * 2.399) % TAU, back = L.yaw + Math.PI + Math.sin(ang) * 0.9;
    _tmp.set(L.pos.x + Math.sin(back) * off, L.pos.y + Math.cos(ang) * 0.3, L.pos.z + Math.cos(back) * off);
    const d = a.pos.distanceTo(_tmp);
    if (d > 60) a.pos.copy(_tmp);
    swimToward(a, _tmp, d > 6 ? sw * 1.7 : Math.max(sw * 0.8, L.speed * 1.1), dt);
    return;
  }
  if (!p || !p.alive || G.mode !== 'play' || a.young || a.spId !== P.spId) { fishWander(a, dt); return; }
  const d = a.pos.distanceTo(p.pos);
  if (a.sex === p.sex) {
    if (a.defeated) { fishWander(a, dt); return; }
    if (a.state === 'fight') {
      if (a.hp < a.maxHp * 0.3) { rivalSubmit(a); a.state = 'idle'; a.goal = null; fishWander(a, dt); return; }
      if (d > 40) { a.state = 'idle'; fishWander(a, dt); return; }
      _tmp.copy(p.pos); swimToward(a, _tmp, sw * 1.35, dt);
      if (d < a.rad + p.rad + (a.sp.reach || 0.5) + 0.35 && a.atkCD <= 0) {
        a.atkCD = 1.1 + rng() * 0.4; a.anim.atk = 0.3;
        hurt(p, (a.dmgOver || a.sp.dmg || 5) * 0.75 * a.scale, a); AUD.at('bite', a.pos, 0.7);
      }
      return;
    }
    if (d < 11 && P.renown < 4 && !a.warned) {
      a.warned = true; a.state = 'fight'; a.foe = p; a.isRival = true;
      UI.notify(heb(a, `${a.name} תוקף! הוא שומר על המים שלו`, `${a.name} תוקפת! היא שומרת על המים שלה`), 'bad');
      return;
    }
    fishWander(a, dt); return;
  }
  if (a.state === 'court') {
    const ang = G.t * 1.6 + a.id;
    _tmp.set(p.pos.x + Math.cos(ang) * 1.6, p.pos.y + 0.1, p.pos.z + Math.sin(ang) * 1.6); swimToward(a, _tmp, sw, dt);
    if (a.stT <= 0) { a.state = 'curious'; a.stT = 20; }
    return;
  }
  if (a.state === 'curious') {
    _tmp.set(p.pos.x + Math.sin(a.id) * 2.2, p.pos.y, p.pos.z + Math.cos(a.id) * 2.2);
    swimToward(a, _tmp, d > 6 ? sw * 1.2 : sw * 0.6, dt);
    if (a.stT <= 0 || d > 140) a.state = 'idle';
    return;
  }
  if (d < 25 && a.affinity > 5 && rng() < dt * 0.15) { a.state = 'curious'; a.stT = 18; }
  fishWander(a, dt);
}
function fishPredStep(a, dt) {
  a.huntT = (a.huntT ?? rr(15, 60)) - dt;
  let t = a.prey && a.prey.alive && !a.prey.gone ? a.prey : null;
  if (!t && a.huntT <= 0) {
    a.huntT = rr(4, 8); let bd = 1e9;
    shQuery(a.pos.x, a.pos.z, 14, (b, d) => { if (b.alive && b !== a && (b.tpl.kind === 'fish' || b.spId === 'eel') && preys(a, b) && d < bd) { bd = d; t = b; } });
    if (t) { a.prey = t; a.chaseT = 0; if (t.isPlayer) UI.notify(`${a.sp.he} ${heb(a, 'רודף', 'רודפת')} אחריך!`, 'bad'); }
  }
  if (!t) return false;
  a.chaseT = (a.chaseT || 0) + dt;
  const d = a.pos.distanceTo(t.pos);
  if (d > 30 || a.chaseT > 14) { a.prey = null; a.huntT = rr(25, 60); return false; }
  _tmp.copy(t.pos); swimToward(a, _tmp, (a.sp.swim || 2) * 1.7, dt);
  if (d < a.rad + t.rad + 0.8 && a.atkCD <= 0) {
    a.atkCD = 1.3; a.anim.atk = 0.3;
    hurt(t, a.sp.dmg || 10, a); if (a.dCam < 50) AUD.at('bite', a.pos, 0.7);
    if (!t.alive && !t.isPlayer) { t.food = 0; a.prey = null; a.huntT = rr(60, 150); }
  }
  return true;
}

// ---------- the player as a fish ----------
function fishSpawnPoint(id, nearRiver) {
  const ok = p => !nearCamp(p.x, p.z, 110);
  if (id === 'arapaima' && LAKE) { const c = habitatPoint('deep', p => ok(p) && Math.hypot(p.x - LAKE.x, p.z - LAKE.z) < LAKE.r + 25); if (c) return c; }
  return habitatPoint('deep', p => ok(p) && nearRiver(p)) || habitatPoint('deep');
}
function spawnEscort(a) {
  const s = { kind: 'school', members: [], c: a.pos.clone(), home: a.pos.clone(), t: 0, playerLed: true }; GROUPS.push(s);
  for (let i = 0; i < 7; i++) {
    const b = new Animal('piranha', a.pos.x + rr(-2, 2), a.pos.z + rr(-2, 2), { group: s, scale: rr(0.9, 1.1) });
    b.slot = i; b.pos.y = a.pos.y; b.socialExtra = true; b.escort = true; s.members.push(b);
  }
}
function escortSwim(a, s, dt) {
  const p = P.a;
  if (!p || !p.alive) { _tmp.copy(s.c); swimToward(a, _tmp, 1.5, dt); return; }
  const fr = P.frenzy && P.frenzy.time > 0 && P.frenzy.t && P.frenzy.t.alive ? P.frenzy.t : null, i = a.slot || 0;
  if (fr) {
    const ang = G.t * 3 + i * 0.9, rr2 = fr.rad * 0.8;
    _tmp.set(fr.pos.x + Math.cos(ang) * rr2, fr.pos.y + fr.height * 0.4, fr.pos.z + Math.sin(ang) * rr2);
    swimToward(a, _tmp, 6.5, dt);
    if (a.pos.distanceTo(_tmp) < 0.9 + fr.rad && a.atkCD <= 0) { a.atkCD = 0.6 + rng() * 0.5; hurt(fr, 2.2, a); if (fr.dCam < 40) FX.spawn('blood', a.pos.x, a.pos.y, a.pos.z, 2); }
    return;
  }
  const ang = i / 7 * TAU + G.t * 0.25, r = 1.4 + (i % 3) * 0.5, back = p.yaw + Math.PI;
  _tmp.set(p.pos.x + Math.sin(back) * 1.6 + Math.cos(ang) * r, p.pos.y + Math.sin(ang * 1.3) * 0.4, p.pos.z + Math.cos(back) * 1.6 + Math.sin(ang) * r);
  const d = a.pos.distanceTo(_tmp);
  if (d > 40) a.pos.copy(_tmp);
  swimToward(a, _tmp, Math.max(2.5, p.speed * 1.25 + d * 0.6), dt);
}
function clearFishThreats(a) {
  for (const b of ANIMALS) if (b !== a && b.alive && b.tpl.kind === 'fish' && preys(b, a) && dist2(b.pos, a.pos) < 50) {
    const c = habitatPoint('deep', p => Math.hypot(p.x - a.pos.x, p.z - a.pos.z) > 120);
    if (c) { b.pos.set(c.x, -1.2, c.z); b.home.copy(b.pos); b.prey = null; b.goal = null; }
  }
}
function setupFishPlayer(a) {
  a.ownY = true; a.swimming = true; a.vel.set(0, 0, 0); a.airborne = false;
  const w = waterAt(a.pos.x, a.pos.z), g = getH(a.pos.x, a.pos.z);
  a.pos.y = clamp(w - 0.9, g + a.height + 0.1, w - 0.2);
  if (a.spId === 'piranha') spawnEscort(a);
  clearFishThreats(a);
}
function spawnFishSocial(id, a, used) {
  const mk = (sex, near) => {
    const c = habitatPoint('deep', p => { const d = Math.hypot(p.x - a.pos.x, p.z - a.pos.z); return near ? d > 22 && d < 110 : d > 50 && d < 230; });
    if (!c) return null;
    const n = NAMES[sex].find(q => !used.has(q)) || pick(NAMES[sex]); used.add(n);
    const b = new Animal(id, c.x, c.z, { sex }); b.pos.y = -rr(0.6, 1.4); b.ownY = true;
    b.name = n; b.social = true; b.socialExtra = true; b.affinity = rr(0, 20);
    b.maxHp = b.hp = (P.sp.hp || b.sp.hp) * b.baseScale * 0.85; b.dmgOver = P.sp.dmg;
    return b;
  };
  for (let i = 0; i < 3; i++) mk(a.sex === 'm' ? 'f' : 'm', i < 2);
  for (let i = 0; i < 2; i++) mk(a.sex, false);
  for (const b of ANIMALS) if (b.spId === id && !b.isPlayer && !b.group && !b.escort) { b.social = true; if (!b.name) b.name = pick(NAMES[b.sex]); }
}
function fishMove(dt, ix, iz, mag, busy, wantRun) {
  const a = P.a, sp = P.sp;
  const up = !busy && !!(KEYS.Space || INPUT.up), dn = !busy && !!(KEYS.KeyC || KEYS.ControlLeft || KEYS.ControlRight || INPUT.down);
  P.running = !busy && wantRun && P.stam > 2 && mag > 0.3;
  if (P.running) P.stam = Math.max(0, P.stam - dt * 15); else P.stam = Math.min(100, P.stam + dt * (P.resting ? 24 : 12));
  const cy = CAM.yaw;
  let dx = Math.sin(cy) * iz - Math.cos(cy) * ix, dz = Math.cos(cy) * iz + Math.sin(cy) * ix;
  const dl = Math.hypot(dx, dz) || 1; dx /= dl; dz /= dl;
  let vI = (up ? 1 : 0) - (dn ? 1 : 0);
  if (!up && !dn && iz > 0.25) vI = clamp(-(CAM.pitch - 0.22) * 2.4, -1, 1) * Math.min(1, iz);
  const spd = mag > 0.05 && !busy ? (P.running ? sp.run : sp.swim) * Math.max(0.35, mag) : 0;
  P.leapCD -= dt;
  if (a.airborne) {
    a.vel.y -= 16 * dt; a.pos.addScaledVector(a.vel, dt);
    const w = waterAt(a.pos.x, a.pos.z), g = getH(a.pos.x, a.pos.z);
    if (w > -900 && w > g + 0.3) {
      if (a.pos.y < w - 0.05 && a.vel.y < 0) { a.airborne = false; a.vel.y *= 0.3; FX.spawn('splash', a.pos.x, w, a.pos.z, 18); AUD.play('splash', 0.8); }
    } else if (a.pos.y < g + 0.1) {
      a.pos.y = g + 0.1; const nw = nearestWater(a.pos.x, a.pos.z);
      if (nw) { const ddx = nw.x - a.pos.x, ddz = nw.z - a.pos.z, dd = Math.hypot(ddx, ddz) || 1; a.vel.set(ddx / dd * 3, 3.5, ddz / dd * 3); } else a.airborne = false;
    }
  } else {
    const vs = spd > 0 ? Math.max(spd, sp.swim * 0.6) : sp.swim * 0.6;
    _t2.set(dx * spd, vI * vs * 0.75, dz * spd);
    a.vel.lerp(_t2, Math.min(1, dt * (P.running ? 3.2 : 2.4)));
    let nx = a.pos.x + a.vel.x * dt, nz = a.pos.z + a.vel.z * dt;
    const minD = a.height * 1.3 + 0.15, ok = (x, z) => inBounds(x, z) && waterDepth(x, z) >= minD;
    if (!ok(nx, nz)) {
      if (ok(nx, a.pos.z)) nz = a.pos.z; else if (ok(a.pos.x, nz)) nx = a.pos.x;
      else { nx = a.pos.x; nz = a.pos.z; a.vel.x *= -0.2; a.vel.z *= -0.2; }
    }
    a.pos.x = nx; a.pos.z = nz;
    const w = waterAt(a.pos.x, a.pos.z), g = getH(a.pos.x, a.pos.z), top = w - 0.07, bot = g + a.height * 0.6 + 0.06;
    a.pos.y += a.vel.y * dt;
    if (a.pos.y > top) {
      const fx = Math.sin(a.yaw), fz = Math.cos(a.yaw);
      if (up && P.running && P.leapCD <= 0 && waterDepth(a.pos.x + fx * 3, a.pos.z + fz * 3) > 0.7 && waterDepth(a.pos.x + fx * 5, a.pos.z + fz * 5) > 0.5) {
        a.airborne = true; a.vel.y = P.spId === 'arapaima' ? 6.2 : P.spId === 'piranha' ? 4.2 : 3.6; P.leapCD = 2.2; PROG.flags.leap = 1;
        FX.spawn('splash', a.pos.x, w, a.pos.z, 16); AUD.play('splash', 0.7);
      } else { a.pos.y = top; if (a.vel.y > 0) a.vel.y = 0; }
    }
    if (a.pos.y < bot) { a.pos.y = Math.min(top, bot); if (a.vel.y < 0) a.vel.y = 0; }
  }
  const hs = Math.hypot(a.vel.x, a.vel.z);
  if (hs > 0.15) { const oy = a.yaw; a.yaw += angDiff(a.yaw, Math.atan2(a.vel.x, a.vel.z)) * Math.min(1, dt * 5); a.bank = clamp(angDiff(oy, a.yaw) / Math.max(dt, 1e-3) * 0.3, -0.6, 0.6); }
  else if (mag > 0.05 && !busy) a.yaw += angDiff(a.yaw, Math.atan2(dx, dz)) * Math.min(1, dt * 3);
  a.vy = a.vel.y; a.speed = a.vel.length(); a.swimming = !a.airborne;
}
function fishAir(dt) {
  const a = P.a, sp = P.sp;
  if (!sp.air) { P.air = 100; return true; }
  const w = waterAt(a.pos.x, a.pos.z), surf = a.airborne || a.pos.y > w - 0.45;
  if (surf) {
    if (P.air < 60 && !P.gulped) { P.gulped = true; PROG.flags.breathe = 1; AUD.play('gulp', 0.8); FX.spawn('splash', a.pos.x, w, a.pos.z, 6); }
    P.air = Math.min(100, P.air + dt * 50); if (P.air > 95) P.airTold = false;
  } else { P.gulped = false; P.air -= dt * P.mods.air * 100 / sp.air; }
  if (P.air < 30 && !P.airTold) { P.airTold = true; UI.notify(you('האוויר נגמר! לעלות לפני המים לנשום', 'האוויר נגמר! לעלות לפני המים לנשום'), 'bad'); }
  if (P.air <= 0) {
    P.air = 0; a.hp -= dt * 6;
    if (a.hp <= 0) { playerDie(you('נחנקת מתחת למים. צריך לעלות לנשום', 'נחנקת מתחת למים. צריך לעלות לנשום')); return false; }
  }
  return true;
}
function eelShock() {
  const a = P.a; if (P.callCD > 0 || P.sleeping || !a) return;
  if (P.stam < 30) { UI.notify('אין מספיק כוח למכת חשמל. צריך לנוח רגע', 'bad'); return; }
  P.callCD = 5; P.stam -= 30; P.roarT = 0.6;
  FX.spawn('spark', a.pos.x, a.pos.y + 0.2, a.pos.z, 30); AUD.play('shock'); CAM.shake = Math.max(CAM.shake, 0.25);
  let n = 0;
  shQuery(a.pos.x, a.pos.z, 6.5, b => {
    if (b === a || !b.alive || b.isPartner || b.cub) return;
    const d = b.pos.distanceTo(a.pos); if (d > 6.5) return;
    const wet = b.swimming || b.tpl.kind === 'fish' || b.spId === 'eel' || (waterDepth(b.pos.x, b.pos.z) > 0.2 && b.pos.y < waterAt(b.pos.x, b.pos.z) + 0.3);
    if (!wet) return;
    hurt(b, 26 * (1 - d / 8) + 4, a); if (b.alive) PROG.flags.shock = 1; b.stunT = 2.4; n++;
  });
  UI.notify(n ? (n > 1 ? `מכת חשמל! ${n} חיות המומות` : 'מכת חשמל! פגעת') : 'מכת חשמל. אף אחד לא היה מספיק קרוב', n ? 'good' : '');
}

// ---------- fishing from the bank (land predators) ----------
function fishSwipe(t) {
  const a = P.a, w = waterAt(t.pos.x, t.pos.z);
  a.yaw += angDiff(a.yaw, Math.atan2(t.pos.x - a.pos.x, t.pos.z - a.pos.z)) * 0.8;
  FX.spawn('splash', t.pos.x, w, t.pos.z, 12); AUD.play('splash', 0.8);
  const base = { jaguar: 0.5, ocelot: 0.58, puma: 0.36, hunter: 0.62 }[P.spId] ?? 0.42;
  const spooked = t.scared > 0 || (t.group && t.group.scare > 0);
  const ch = clamp(base + (P.crouch ? 0.14 : 0) + (P.stillT > 1.5 ? 0.16 : 0) - (spooked ? 0.3 : 0), 0.08, 0.9);
  if (rng() < ch) {
    kill(t, a); PROG.flags.fish = 1;
    const fx = Math.sin(a.yaw), fz = Math.cos(a.yaw);
    let px = a.pos.x + fz * 0.6, pz = a.pos.z - fx * 0.6;
    if (waterDepth(px, pz) > 0.05) { px = a.pos.x - fx * 0.5; pz = a.pos.z - fz * 0.5; }
    if (waterDepth(px, pz) > 0.05) { px = a.pos.x; pz = a.pos.z; }
    t.landed = true; t.vel.set(0, 0, 0); t.pos.set(px, getH(px, pz) + 0.06, pz);
  } else {
    t.scared = 3;
    if (t.group && t.group.kind === 'shoal') { const g = t.group, dx = g.c.x - a.pos.x, dz = g.c.z - a.pos.z, d = Math.hypot(dx, dz) || 1; g.scare = 2.4; g.sx = dx / d; g.sz = dz / d; }
    if (!FISHP.missTold) { FISHP.missTold = true; UI.notify(you('החטאת. דגים בורחים מתנועה. כדאי להתגנב, לעמוד בשקט ולחכות שיתקרבו', 'החטאת. דגים בורחים מתנועה. כדאי להתגנב, לעמוד בשקט ולחכות שיתקרבו')); }
    else UI.notify('החטאת', 'bad');
  }
}

// ================= PLAYABLE BIRDS & THE PLAYER HUNTER =================
const isBirdSp = id => { const s = SPECIES[id]; return !!s && s.kind === 'bird'; };
const AIRP = { foodTold: false, perchTold: false };
const STATL = () => ['כוח', 'מהירות', 'התגנבות', isBirdSp(SET.sp) ? 'תעופה' : 'שחייה'];
Object.assign(START_LINES, {
  hunter: () => you('המחנה שלך ליד הנהר. חנית ביד, ואפשר לאלף חיות שילכו איתך', 'המחנה שלך ליד הנהר. חנית ביד, ואפשר לאלף חיות שילכו איתך'),
  macaw: () => you('השמיים שלך. פירות בצמרות, חרסית בבוקר, והיזהר מהעיט', 'השמיים שלך. פירות בצמרות, חרסית בבוקר, והיזהרי מהעיט'),
  toucan: () => you('המקור שלך מגיע לכל פרי. רק אל תנחת ליד טורפים', 'המקור שלך מגיע לכל פרי. רק אל תנחתי ליד טורפים'),
  harpy: () => you('מלך הצמרות. לצלול על קופים ועצלנים ולשאת אותם בטפרים', 'מלכת הצמרות. לצלול על קופים ועצלנים ולשאת אותם בטפרים')
});

// ---------- shared UI helpers (used by the UI module) ----------
function controlLabels() {
  if (P.fish) return { tJump: [ICON.up, 'עלייה'], tCrouch: [ICON.down, 'צלילה'], tRun: [ICON.run, 'האצה'], tCall: P.spId === 'eel' ? [ICON.bolt, 'חשמל'] : [ICON.call, 'קריאה'], tAtk: [ICON.claw, 'נשיכה'] };
  if (P.bird) return { tJump: [ICON.up, 'עלייה'], tCrouch: [ICON.down, 'צלילה'], tRun: [ICON.run, 'האצה'], tCall: [ICON.call, 'קריאה'], tAtk: [ICON.claw, P.spId === 'harpy' ? 'טפרים' : 'ניקור'] };
  if (P.human) return { tJump: [ICON.jump, 'קפיצה'], tCrouch: [ICON.sneak, 'התגנבות'], tRun: [ICON.run, 'ריצה'], tCall: [ICON.call, 'שריקה'], tAtk: [ICON.spear, 'חנית'] };
  return { tJump: [ICON.jump, 'קפיצה'], tCrouch: [ICON.sneak, 'התגנבות'], tRun: [ICON.run, 'ריצה'], tCall: [ICON.call, 'קריאה'], tAtk: [ICON.claw, 'תקיפה'] };
}
const CTXT = { drink: ['drop', 'לשתות', 'לשתות'], graze: ['leaf', 'ללחך', 'ללחך עשב'], eat: ['meat', 'לאכול', 'לאכול'], tame: ['heart', 'לאלף', 'להחזיק כדי לאלף'],
  perch: ['down', 'לנחות', 'לנחות על העץ'], fruit: ['leaf', 'פירות', 'לאכול פירות'], clay: ['drop', 'חרסית', 'ללקק חרסית'] };
function ctxButton(k) { const m = CTXT[k] || CTXT.eat; return ICON[m[0]] + `<small>${m[1]}</small>`; }
function ctxText(k) { return (CTXT[k] || CTXT.eat)[2]; }
function extraPrompts(pr) {
  climbPrompts(pr);
  if (P.bird) { pr.push(P.flying ? ['רווח / C', 'לעלות / לצלול'] : ['רווח', 'להמריא']); if (P.carry) pr.push(['קליק', 'לשחרר את הטרף']); }
  if (P.human) pr.push(['קליק', P.spears > 0 ? `לזרוק חנית (${P.spears})` : 'אין חניתות'], ['R', 'לשרוק לחיות שלך']);
}
function extraStatus(st) {
  const a = P.a; if (!a || !a.alive || P.sleeping || P.coil || HUNT.net || P.stun > 0) return '';
  if (P.bird) return P.carry ? 'נושא טרף' : P.flying ? (P.landTo ? 'נוחת' : a.glide ? 'דואה' : 'עף') : P.perchC ? 'על ענף' : 'על הקרקע';
  if (P.human) return [st, `חניתות ${P.spears}`, `חצים ${P.arrows || 0}`, P.inv && P.inv.cooked ? `מנות ${P.inv.cooked}` : ''].filter(Boolean).join(' · ');
  return '';
}
function extraHelp() {
  const k = $('help').querySelector('.keys');
  const rows = TOUCH ? [['צייד: חכה ומחנה', 'כפתור הזהב ליד המים: חכה (כשהמצוף צולל, תקיפה). ליד גזע: עצים. במחנה: שדרוגים כמו גדר, מדורה ומחסה'], ['הבית', 'עם בן זוג או צאצאים: כפתור הזהב בונה בית. בבית: לקחת את הצאצאים איתך, להשאיר אותם, או להרוס ולבנות במקום אחר'], ['טיפוס', 'חתולים: כפתור הזהב ליד גזע עץ. מהענף, תקיפה מזנקת על טרף שעובר מתחת, וקפיצה מורידה'], ['סחיבת טרף', 'הקשה קצרה על כפתור הזהב ליד טרף סוחבת אותו. ליד המשפחה, הקשה נוספת משחררת והם אוכלים'], ['כפתור השכבות', 'מחליף תצוגה: מצומצמת (משימות ומשפחה מופיעות רק כשמשהו משתנה), נקייה או מלאה'], ['לחיצה ארוכה על קריאה', 'פקודה למלווים: לתקוף את המטרה, או לחכות במקום'], ['מאורה', 'לנוח 3 שניות במקום מוגן בונה מאורה, או קן כשנחים על ענף. שינה בה בטוחה ומרפאת, והצאצאים מחכים בה'], ['עין', 'חושים: מסמנים טרף (ירוק), סכנה (אדום), בני זוג (ורוד), משפחה (צהוב) ומים (כחול)'], ['ציפורים', 'עלייה וצלילה כמו בדג. בלי נגיעה הציפור דואה. כפתור הזהב ליד עץ: נחיתה, ועל ענף: פירות'], ['צייד', 'תקיפה זורקת חנית לכיוון שמסתכלים. כפתור הזהב ליד חיה צעירה: אילוף. שריקה קוראת לחיות']]
    : [['מאורה', 'לנוח 3 שניות במקום מוגן בונה מאורה, או קן כשנחים על ענף. שינה בה בטוחה ומרפאת, והצאצאים מחכים בה'], ['E ליד עץ', 'טיפוס (חתולים). מהענף: קליק מזנק על טרף, רווח מוריד'], ['E הקשה קצרה', 'לסחוב טרף למשפחה, ושוב כדי לשחרר'], ['E (צייד)', 'ליד המים: חכה. ליד גזע: עצים. במחנה: שדרוגים'], ['E בבית', 'לנהל את הבית: צאצאים איתך או בבית, להרוס ולבנות מחדש'], ['I', 'מחליף תצוגה: מצומצמת, נקייה או מלאה'], ['T / Y', 'פקודות למלווים: T לתקוף את המטרה, Y לחכות או לבוא אחריך'], ['Q', 'חושים: מסמנים טרף (ירוק), סכנה (אדום), בני זוג (ורוד), משפחה (צהוב) ומים (כחול)'], ['ציפורים', 'רווח עולה, C צולל, בלי מקשים הציפור דואה. E ליד עץ: נחיתה. Shift: האצה'], ['צייד', 'קליק זורק חנית לכיוון שמסתכלים. E ליד חיה צעירה: אילוף. R: שריקה']];
  k.insertAdjacentHTML('beforeend', rows.map(([a, b]) => `<kbd>${a}</kbd><span>${b}</span>`).join(''));
}

// ---------- birds: spawning, flight, perching ----------
function birdSpawnPoint(id) {
  for (let t = 0; t < 80; t++) {
    const c = pickCrownNear(rr(-320, 320), rr(-320, 320), 140, id === 'harpy');
    if (c && !nearCamp(c.x, c.z, 100) && nearestOnPoly(c.x, c.z, RIVER)[0] < 90) return { x: c.x, z: c.z, crown: c };
  }
  const c = CROWNS.length ? CROWNS[Math.floor(rng() * CROWNS.length)] : null;
  return c ? { x: c.x, z: c.z, crown: c } : { x: 0, z: 0 };
}
function crownNear(x, y, z, r, below) {
  let best = null, bd = 1e9;
  for (const c of crownsNear(x, z, r)) {
    if (below && (c.top > y + 2.5 || c.top < y - 30)) continue;
    const d = Math.hypot(c.x - x, c.z - z) + Math.abs(c.top - y) * 0.3;
    if (d < bd) { bd = d; best = c; }
  }
  return best;
}
function perchAt(a, c, snap) {
  PROG.flags.perch = 1;
  P.flying = false; P.perchC = c; P.landTo = null; P.flySpd = 0; P.vy = 0; a.vel.set(0, 0, 0); a.bank = 0; a.vy = 0; a.glide = 0;
  const dx = a.pos.x - c.x, dz = a.pos.z - c.z, d = Math.hypot(dx, dz), lim = c.r * 0.35;
  if (snap) { a.pos.x = c.x + dx * 0.1; a.pos.z = c.z + dz * 0.1; } else if (d > lim) { a.pos.x = c.x + dx / d * lim; a.pos.z = c.z + dz / d * lim; }
  a.pos.y = c.top - 0.1;
  if (!AIRP.perchTold && G.mode === 'play' && P.spId !== 'harpy') { AIRP.perchTold = true; UI.notify(you('נחת על ענף. אפשר לאכול כאן פירות', 'נחתת על ענף. אפשר לאכול כאן פירות'), 'good'); }
}
function birdSetup(a, crown) {
  Object.assign(P, { flying: false, perchC: null, flySpd: 0, vy: 0, carry: null, landTo: null, perchCand: null });
  a.vel.set(0, 0, 0); a.ownY = true;
  if (crown) perchAt(a, crown, true);
  else { P.flying = true; a.pos.y = getH(a.pos.x, a.pos.z) + 25; P.flySpd = (P.sp.fly || 10) * 0.6; }
}
function birdTakeOff(dx, dz, mag) {
  const a = P.a; P.flying = true; P.perchC = null; P.landTo = null; P.resting = false; P.eating = false;
  P.flySpd = (P.sp.fly || 10) * 0.45; P.vy = 4.2; a.pos.y += 0.25;
  if (mag > 0.1) a.yaw = Math.atan2(dx, dz);
  P.stam = Math.max(0, P.stam - 6); AUD.play('flap', 0.6);
}
function birdLand() {
  const a = P.a; P.flying = false; P.perchC = null; P.landTo = null; P.flySpd = 0; P.vy = 0;
  a.vel.set(0, 0, 0); a.pos.y = getH(a.pos.x, a.pos.z); a.bank = 0; a.vy = 0; a.glide = 0;
}
function birdMove(dt, ix, iz, mag, busy, wantRun) {
  const a = P.a, sp = P.sp, fly = sp.fly || 10;
  const up = !busy && !!(KEYS.Space || INPUT.up), dn = !busy && !!(KEYS.KeyC || KEYS.ControlLeft || KEYS.ControlRight || INPUT.down);
  const cy = CAM.yaw;
  let dx = Math.sin(cy) * iz - Math.cos(cy) * ix, dz = Math.cos(cy) * iz + Math.sin(cy) * ix;
  const dl = Math.hypot(dx, dz) || 1; dx /= dl; dz /= dl;
  if (!P.flying) {
    P.running = false; a.bank = 0; a.vy = 0; a.glide = 0;
    P.stam = Math.min(100, P.stam + dt * (P.resting || P.sleeping ? 24 : 14));
    if (!busy && P.stam > 6 && (up || (P.perchC && mag > 0.4))) { birdTakeOff(dx, dz, mag); return; }
    if (P.perchC) {
      a.pos.y += (P.perchC.top - 0.1 - a.pos.y) * Math.min(1, dt * 8); a.speed = 0;
      if (mag > 0.05 && !busy) a.yaw += angDiff(a.yaw, Math.atan2(dx, dz)) * Math.min(1, dt * 4);
      return;
    }
    const spd = mag > 0.05 && !busy ? (sp.walk || 0.7) * Math.max(0.4, mag) : 0;
    if (spd > 0) {
      const nx = a.pos.x + dx * spd * dt, nz = a.pos.z + dz * spd * dt;
      if (inBounds(nx, nz) && waterDepth(nx, nz) < 0.08) { a.pos.x = nx; a.pos.z = nz; }
      a.yaw += angDiff(a.yaw, Math.atan2(dx, dz)) * Math.min(1, dt * 8);
    }
    a.speed = spd; a.pos.y = getH(a.pos.x, a.pos.z);
    return;
  }
  // ---- in the air ----
  if (BH.stoop && stoopMove(dt)) return;
  let vI;
  if (P.landTo) {
    const c = P.landTo, tx = c.x - a.pos.x, tz = c.z - a.pos.z, th = Math.hypot(tx, tz) || 0.01, ty = c.top - 0.1 - a.pos.y;
    dx = tx / th; dz = tz / th; mag = 1; vI = clamp(ty * 0.5, -1, 1);
    if (th < Math.max(1.2, c.r * 0.35) && Math.abs(ty) < 1) { perchAt(a, c); AUD.play('flap', 0.4); return; }
  } else {
    vI = (up ? 1 : 0) - (dn ? 1 : 0);
    if (!up && !dn) vI = iz > 0.25 ? clamp(-(CAM.pitch - 0.25) * 2.2, -1, 1) * Math.min(1, iz) : mag < 0.1 ? -0.22 : 0;
  }
  const boost = wantRun && P.stam > 3 && !busy, carryK = P.carry ? 0.75 : 1;
  const tgtSpd = (boost ? fly * 1.15 : mag > 0.1 ? fly * 0.75 : fly * 0.55) * carryK;
  P.flySpd += (tgtSpd - P.flySpd) * Math.min(1, dt * 1.2);
  if (vI > 0.05) P.stam -= dt * 7 * vI * (P.carry ? 1.5 : 1) * P.mods.air; else P.stam = Math.min(100, P.stam + dt * 6);
  if (boost) P.stam -= dt * 9;
  if (P.stam <= 0) { P.stam = 0; vI = Math.min(vI, -0.35); }
  P.running = boost;
  if (mag > 0.05 && !busy) { const oy = a.yaw; a.yaw += angDiff(a.yaw, Math.atan2(dx, dz)) * Math.min(1, dt * 2.4); a.bank += (clamp(angDiff(oy, a.yaw) / Math.max(dt, 1e-3) * 0.35, -0.9, 0.9) - a.bank) * Math.min(1, dt * 4); }
  else a.bank *= Math.max(0, 1 - dt * 3);
  P.vy += (vI * (vI > 0 ? 5.5 : 7) - P.vy) * Math.min(1, dt * 2.5);
  let nx = a.pos.x + Math.sin(a.yaw) * P.flySpd * dt, nz = a.pos.z + Math.cos(a.yaw) * P.flySpd * dt;
  if (!inBounds(nx, nz)) { a.yaw += angDiff(a.yaw, Math.atan2(-a.pos.x, -a.pos.z)) * Math.min(1, dt * 3); nx = clamp(nx, -LIMIT, LIMIT); nz = clamp(nz, -LIMIT, LIMIT); }
  a.pos.x = nx; a.pos.z = nz; a.pos.y += P.vy * dt;
  const gh = getH(a.pos.x, a.pos.z), w = waterAt(a.pos.x, a.pos.z), wet = w > -900 && w > gh, floor = wet ? w : gh;
  if (wet) PROG.flags.fly = 1;
  if (a.pos.y > floor + 150) { a.pos.y = floor + 150; P.vy = Math.min(P.vy, 0); }
  if (a.pos.y < floor + 0.35) {
    if (!wet && P.vy <= 0.5 && (dn || mag < 0.1 || P.stam <= 0)) { birdLand(); return; }
    a.pos.y = floor + 0.35; if (P.vy < 0) P.vy = wet ? 1.5 : 0;
  }
  if (P.vy < 0.3 && !P.landTo) {
    const c = crownNear(a.pos.x, a.pos.y, a.pos.z, 6, true);
    if (c && Math.hypot(c.x - a.pos.x, c.z - a.pos.z) < c.r * 0.5 && a.pos.y < c.top + 0.3 && a.pos.y > c.top - 1.5 && (dn || mag < 0.1)) { perchAt(a, c); return; }
  }
  a.vy = P.vy; a.speed = P.flySpd; a.glide = vI < -0.1 && !boost ? 1 : 0;
}
function birdContext() {
  const a = P.a;
  if (P.carry && !P.flying) { P.carcass = P.carry; return 'eat'; }
  if (P.flying) { const c = crownNear(a.pos.x, a.pos.y, a.pos.z, 14, true); P.perchCand = c; return c ? 'perch' : null; }
  if (P.perchC) return P.spId === 'harpy' ? null : 'fruit';
  if (P.isPred) {
    let best = null, bd = 1e9;
    shQuery(a.pos.x, a.pos.z, 4, (b, d) => { if (b.dead && !b.gone && b.food > 0.5 && d < 1.2 + b.rad && d < bd) { bd = d; best = b; } });
    if (best) { P.carcass = best; return 'eat'; }
  }
  if (P.spId !== 'harpy' && CLAY && Math.hypot(a.pos.x - CLAY.x, a.pos.z - CLAY.z) < 10) return 'clay';
  const fx = Math.sin(a.yaw), fz = Math.cos(a.yaw);
  if (waterDepth(a.pos.x + fx * 0.5, a.pos.z + fz * 0.5) > 0.02 || waterDepth(a.pos.x, a.pos.z) > 0.02) return 'drink';
  return null;
}
function birdAttack() {
  const a = P.a, sp = P.sp;
  if (P.atkCD > 0 || P.stun > 0 || P.sleeping) return;
  P.atkCD = sp.atkCD || 0.7; a.anim.atk = 0.4; P.resting = false;
  if (P.carry) { dropCarry(); UI.notify('שחררת את הטרף'); return; }
  if (P.flying && BH.cand && BH.cand.alive && !BH.stoop) { startStoop(BH.cand); return; }
  const harpy = P.spId === 'harpy', reach = (sp.reach || 0.6) + (harpy && P.flying ? 1.8 : 0.4), fx = Math.sin(a.yaw), fz = Math.cos(a.yaw);
  let best = null, bs = -1e9;
  shQuery(a.pos.x, a.pos.z, reach + 4, b => {
    if (b === a || !b.alive || b.isPartner || b.cub || b.pet === a) return;
    const dx = b.pos.x - a.pos.x, dy = b.pos.y + b.height * 0.5 - a.pos.y, dz = b.pos.z - a.pos.z, d = Math.hypot(dx, dy, dz), h = Math.hypot(dx, dz);
    if (d > reach + b.rad) return;
    const dot = h > 0.3 ? (dx * fx + dz * fz) / h : 1; if (dot < -0.2) return;
    const s = dot * 2 - d; if (s > bs) { bs = s; best = b; }
  });
  if (!best) { AUD.play('swipe', 0.5); return; }
  const t = best, fast = P.flying && P.flySpd > (sp.fly || 10) * 0.8;
  if (t.spId === P.spId && t.sex === a.sex && !t.young) t.isRival = true;
  hurt(t, (sp.dmg || 4) * rr(0.85, 1.15) * (fast ? 1.5 : 1), a);
  AUD.play(harpy ? 'screech' : 'bite', harpy ? 0.6 : 0.8); CAM.shake = Math.max(CAM.shake, harpy ? 0.2 : 0.06);
  if (harpy && !t.alive && P.flying && (t.sp.food || 10) <= 60 && t.tpl.kind !== 'fish') {
    t.carriedBy = a; P.carry = t; PROG.flags.carry = 1;
    UI.notify(`תפסת ${t.sp.he} בטפרים! לנחות על עץ או על הקרקע כדי לאכול`, 'good');
  }
  partnerAssist(t);
}
function dropCarry() {
  const c = P.carry; if (!c) return; c.carriedBy = null; P.carry = null;
  if (c.tpl.kind === 'quad' || c.tpl.kind === 'snake') c.ground(1, true);
}
function birdFeed(dt) {
  const a = P.a;
  if (P.ctx === 'fruit') { P.food = Math.min(100, P.food + dt * 6.5); P.water = Math.min(100, P.water + dt * 1.2); }
  else { P.food = Math.min(100, P.food + dt * 2.5); if (P.poison > 0) { P.poison = 0; UI.notify('החרסית ניטרלה את הרעל', 'good'); } a.hp = Math.min(a.maxHp, a.hp + dt * 2); }
  for (const cb of P.cubs) cb.cubHunger = Math.max(0, cb.cubHunger - dt * 8);
  P.eatSnd -= dt; if (P.eatSnd <= 0) { P.eatSnd = 0.6; AUD.play('eat', 0.4); }
}
// ---------- social birds: mates, rivals, partners and chicks ----------
function spawnBirdSocial(id, a, used) {
  const mk = (sex, near) => {
    for (let t = 0; t < 30; t++) {
      const ang = rng() * TAU, d = rr(near ? 30 : 80, near ? 110 : 220);
      const c = pickCrownNear(a.pos.x + Math.cos(ang) * d, a.pos.z + Math.sin(ang) * d, 40, id === 'harpy');
      if (!c || Math.hypot(c.x - a.pos.x, c.z - a.pos.z) < 20) continue;
      const n = NAMES[sex].find(q => !used.has(q)) || pick(NAMES[sex]); used.add(n);
      const b = new Animal(id, c.x, c.z, { sex }); b.pos.set(c.x, c.top - 0.1, c.z); b.home.set(c.x, 0, c.z); b.crownS = c; b.offX = 0; b.offZ = 0; b.stT = rr(20, 40);
      b.name = n; b.social = true; b.socialExtra = true; b.affinity = rr(0, 20); b.perched = false;
      return b;
    }
  };
  for (let i = 0; i < 3; i++) mk(a.sex === 'm' ? 'f' : 'm', i === 0);
  for (let i = 0; i < 2; i++) mk(a.sex, false);
}
function settleNear(a, tgt, onPerch, dt) {
  if (a.pos.distanceTo(tgt) > 0.45) { flyToward(a, tgt, (a.sp.fly || 10) * 0.6, dt, 4); a.pose = 'fly'; return false; }
  a.pos.lerp(tgt, Math.min(1, dt * 5)); a.vel.set(0, 0, 0); a.vy = 0; a.bank = 0; a.speed = 0; a.pose = onPerch ? 'perch' : 'ground';
  return true;
}
function birdSocial(a, dt) {
  if (a.cub && denHold(a, dt)) return;
  const p = P.a, fly = a.sp.fly || 10, k = a.id * 2.399;
  if ((a.isPartner || a.cub || a.stolenBy) && a.followTarget && a.followTarget.alive) {
    const L = a.followTarget, off = a.cub ? 0.9 + (a.id % 3) * 0.5 : 1.6;
    if (L === p && !P.flying) {
      _tmp.set(L.pos.x + Math.cos(k) * off, P.perchC ? P.perchC.top - 0.1 : getH(L.pos.x + Math.cos(k) * off, L.pos.z + Math.sin(k) * off), L.pos.z + Math.sin(k) * off);
      if (settleNear(a, _tmp, !!P.perchC, dt)) a.yaw += angDiff(a.yaw, L.yaw) * Math.min(1, dt * 3);
      return;
    }
    const back = L.yaw + Math.PI + Math.sin(k) * 0.9;
    _tmp.set(L.pos.x + Math.sin(back) * off * 1.6, L.pos.y + Math.cos(k) * 0.6, L.pos.z + Math.cos(back) * off * 1.6);
    if (a.pos.distanceTo(_tmp) > 90) a.pos.copy(_tmp);
    flyToward(a, _tmp, Math.max(fly, (L.speed || 0) * 1.25), dt, 3); a.pose = 'fly';
    return;
  }
  a.stT -= dt;
  const live = p && p.alive && G.mode === 'play' && P.spId === a.spId && !a.young, d = live ? a.pos.distanceTo(p.pos) : 999;
  if (live && a.sex === p.sex && !a.defeated) {
    if (a.state === 'fight') {
      if (a.hp < a.maxHp * 0.3) { rivalSubmit(a); a.state = 'idle'; a.crownS = null; return; }
      if (d > 60) { a.state = 'idle'; return; }
      _tmp.copy(p.pos); _tmp.y += 0.1; flyToward(a, _tmp, fly, dt, 4); a.pose = 'fly';
      if (d < a.rad + p.rad + 0.7 && a.atkCD <= 0) { a.atkCD = 1.2; a.anim.atk = 0.4; hurt(p, (a.sp.dmg || 3) * 0.8, a); AUD.at('bite', a.pos, 0.5); }
      return;
    }
    if (d < 9 && P.renown < 4 && rng() < dt * 0.2) { a.state = 'fight'; a.foe = p; a.isRival = true; UI.notify(heb(a, `${a.name} תוקף! זה העץ שלו`, `${a.name} תוקפת! זה העץ שלה`), 'bad'); return; }
  } else if (live && a.sex !== p.sex) {
    if (a.state === 'court' || a.state === 'curious') {
      if (P.flying) { const back = p.yaw + Math.PI + 0.6; _tmp.set(p.pos.x + Math.sin(back) * 3, p.pos.y + 0.5, p.pos.z + Math.cos(back) * 3); flyToward(a, _tmp, Math.max(fly, p.speed * 1.2), dt, 3); a.pose = 'fly'; }
      else {
        const x = p.pos.x + Math.cos(k) * 1.3, z = p.pos.z + Math.sin(k) * 1.3;
        _tmp.set(x, P.perchC ? P.perchC.top - 0.1 : getH(x, z), z);
        if (settleNear(a, _tmp, !!P.perchC, dt)) { a.yaw += angDiff(a.yaw, Math.atan2(p.pos.x - a.pos.x, p.pos.z - a.pos.z)) * Math.min(1, dt * 4); if (a.state === 'court') a.pos.y += Math.abs(Math.sin(G.t * 6)) * 0.06; }
      }
      if (a.stT <= 0 || d > 160) a.state = 'idle';
      return;
    }
    if (d < 25 && a.affinity > 5 && rng() < dt * 0.15) { a.state = 'curious'; a.stT = 18; return; }
  }
  if (!a.crownS || a.stT <= 0) { a.crownS = pickCrownNear(a.home.x, a.home.z, 60, a.spId === 'harpy'); a.stT = rr(15, 40); a.offX = rr(-1, 1); a.offZ = rr(-1, 1); }
  const c = a.crownS; if (!c) return;
  _tmp.set(c.x + a.offX, c.top - 0.1, c.z + a.offZ); settleNear(a, _tmp, true, dt);
}

// ---------- the player hunter ----------
function humanSpawnPoint() {
  const c = HUNT.camps.length ? pick(HUNT.camps) : null;
  if (c) for (let t = 0; t < 40; t++) {
    const ang = rng() * TAU, d = rr(5, 9), x = c.x + Math.cos(ang) * d, z = c.z + Math.sin(ang) * d;
    if (waterDepth(x, z) === 0 && !trunkPush({ x, z }, 1)) return { x, z, yaw: Math.atan2(c.rx - x, c.rz - z) };
  }
  return null;
}
function hunterSetup(a) { a.pets = []; Object.assign(P, { spears: 3, aimT: 0, aimTgt: null, tameT: 0, tameB: null, spearT: 0 }); }
function findTameNear() {
  const a = P.a; let best = null, bd = 1e9;
  shQuery(a.pos.x, a.pos.z, 6, (b, d) => {
    if (!b.alive || b.isPlayer || b.pet || b.hunter || b.tpl.kind !== 'quad' || !TAME_OK.includes(b.spId) || b.lured || b.trapped) return;
    if (!(b.young || TAME_ADULT.includes(b.spId)) || b.state === 'flee' || b.state === 'fight') return;
    if (d < 4.2 + b.rad && d < bd) { bd = d; best = b; }
  });
  return best;
}
function tameStep(dt) {
  const a = P.a, b = P.tameB;
  P.eating = false;
  if (!b || !b.alive || b.pet) { P.tameT = 0; return; }
  if (P.human ? !((P.inv.meat || 0) + (P.inv.cooked || 0) + (P.inv.fish || 0)) : P.food < 12) { if (!AIRP.foodTold) { AIRP.foodTold = true; UI.notify(P.human ? 'כדי לאלף כלב צריך בשר: לחתוך בשר מטרף, או דג' : you('אין לך מספיק אוכל להציע. קודם צריך לאכול', 'אין לך מספיק אוכל להציע. קודם צריך לאכול'), 'bad'); } return; }
  P.tameT += dt; b.stunT = 0.25;
  const dx = a.pos.x - b.pos.x, dz = a.pos.z - b.pos.z, d = Math.hypot(dx, dz) || 0.01;
  b.move(dx / d, dz / d, d > b.rad + 1.0 ? (b.sp.walk || 1.4) * 0.5 : 0.01, dt);
  b.pose = d < b.rad + 1.3 ? 'eat' : 'move'; b.look = clamp(angDiff(b.yaw, Math.atan2(dx, dz)), -1, 1);
  a.yaw += angDiff(a.yaw, Math.atan2(-dx, -dz)) * Math.min(1, dt * 5);
  if (P.tameT > P.mods.tameT) {
    P.tameT = 0; P.food -= 10; b.stunT = 0;
    b.name = b.name || pick(NAMES[b.sex]); b.social = false; b.isRival = false;
    makePet(a, b);
    if (P.human) { if ((P.inv.meat || 0) > 0) P.inv.meat--; else if ((P.inv.cooked || 0) > 0) P.inv.cooked--; else if ((P.inv.fish || 0) > 0) P.inv.fish--; }
    if (b.group && b.spId === 'bushdog') { const g = b.group, i = g.members.indexOf(b); if (i >= 0) g.members.splice(i, 1); b.group = null; b.brain = null; }
    UI.notify(heb(b, `אילפת את ${b.name} (${b.sp.he}). הוא הולך איתך ונלחם לצידך`, `אילפת את ${b.name} (${b.sp.he}). היא הולכת איתך ונלחמת לצידך`), 'love');
    FX.spawn('heart', b.pos.x, b.pos.y + b.height, b.pos.z, 6); AUD.play('heart'); discover(b.spId);
  }
}
function aimTarget(range) {
  const a = P.a, fx = Math.sin(CAM.yaw), fz = Math.cos(CAM.yaw); let best = null, bs = -1e9;
  shQuery(a.pos.x, a.pos.z, range, (b, d) => {
    if (b === a || !b.alive || b.pet === a || b.hunter || b.isPartner || d < 1) return;
    if (b.tpl.kind === 'fish' || b.spId === 'eel' || (b.perched && b.pos.y - a.pos.y > 12)) return;
    const dot = ((b.pos.x - a.pos.x) * fx + (b.pos.z - a.pos.z) * fz) / d; if (dot < 0.88) return;
    const s = dot * 30 - d + (b === P.target ? 8 : 0) + (preys(a, b) ? 4 : 0) + (preys(b, a) ? 6 : 0);
    if (s > bs) { bs = s; best = b; }
  });
  return best;
}
function hunterAttack() {
  const a = P.a, sp = P.sp;
  if (P.dive && a.swimming) { if (P.atkCD <= 0) diveStab(); return; }
  if (P.atkCD > 0 || P.stun > 0 || P.sleeping || P.aimT > 0 || AIMX.on) return;
  P.resting = false;
  const t = findAttackTarget();
  if (t) {
    if ((t.tpl.kind === 'fish' || t.spId === 'eel') && !a.swimming) { P.atkCD = 0.9; a.anim.atk = 0.45; fishSwipe(t); return; }
    if (dist2(t.pos, a.pos) < 1.9 + t.rad) { knifeAttack(t); return; }
    P.atkCD = 0.85; a.anim.atk = 0.45;
    a.yaw += angDiff(a.yaw, Math.atan2(t.pos.x - a.pos.x, t.pos.z - a.pos.z)) * 0.7;
    hurt(t, (sp.dmg || 16) * rr(0.85, 1.15) * (t.state !== 'flee' && t.state !== 'fight' ? 1.3 : 1) * (P.crouch ? 1.2 : 1), a);
    AUD.play('bite', 0.7); CAM.shake = Math.max(CAM.shake, 0.1); partnerAssist(t);
    return;
  }
  if (P.spears <= 0 && (P.arrows || 0) <= 0) { UI.notify('אין לך חניתות או חצים. אפשר לאסוף חניתות מהקרקע או לגלף חדשים במחנה', 'bad'); P.atkCD = 0.6; return; }
  aimStart();
}
function playerThrow() {
  const a = P.a, t = P.aimTgt && P.aimTgt.alive ? P.aimTgt : null;
  P.spears--; a.anim.atk = 0.45; a.windup = 0; P.aimTgt = null;
  if (t) a.yaw = Math.atan2(t.pos.x - a.pos.x, t.pos.z - a.pos.z); else a.yaw = CAM.yaw;
  const sx = a.pos.x - Math.cos(a.yaw) * 0.25, sz = a.pos.z + Math.sin(a.yaw) * 0.25, sy = a.pos.y + 1.65 * a.scale, V = 22;
  let tx, ty, tz;
  if (t) {
    tx = t.pos.x; tz = t.pos.z; ty = t.pos.y + t.height * 0.55;
    const T0 = Math.hypot(tx - sx, tz - sz) / V, sv = t.vel && t.tpl.kind === 'bird' ? t.vel : null;
    if (sv) { tx += sv.x * T0; tz += sv.z * T0; ty += sv.y * T0; } else { tx += Math.sin(t.yaw) * t.speed * T0; tz += Math.cos(t.yaw) * t.speed * T0; }
    const e = 0.12 + Math.hypot(tx - sx, tz - sz) * 0.012; tx += rr(-e, e); tz += rr(-e, e);
  } else {
    const fx = Math.sin(CAM.yaw), fz = Math.cos(CAM.yaw); tx = sx + fx * 22; tz = sz + fz * 22; ty = sy + 1.2 - Math.sin(CAM.pitch - 0.3) * 14;
  }
  const d = Math.hypot(tx - sx, tz - sz), TT = Math.max(0.12, d / V);
  const vx = (tx - sx) / TT, vy = (ty - sy) / TT + 4.9 * TT, vz = (tz - sz) / TT, s = addProjectile(a, 'spear', sx, sy, sz, vx, vy, vz);
  const land = t ? { x: tx, z: tz } : predictLanding(sx, sy, sz, vx, vy, vz);
  if (!a.mark) a.mark = aimMarker(a, 'mine');
  if (a.mark) { placeMarker(a.mark, land.x, land.z, 1); a.mark.userData.proj = s; a.mark = null; }
  AUD.play('spear');
}
function spearPickup(dt) {
  const a = P.a;
  for (let i = HUNT.spears.length - 1; i >= 0; i--) {
    const s = HUNT.spears[i];
    if (s.from !== a || s.stuck <= 0) continue;
    if (Math.hypot(s.pos.x - a.pos.x, s.pos.z - a.pos.z) < 1.7) { scene.remove(s.g); HUNT.spears.splice(i, 1); P.spears = Math.min(P.mods.spearsMax, P.spears + 1); PROG.flags.pickup = 1; UI.notify(`אספת חנית (${P.spears})`); AUD.play('ui'); }
  }
  if (P.spears < 2) { P.spearT += dt; if (P.spearT > 40) { P.spearT = 0; P.spears++; UI.notify(you('גילפת חנית חדשה', 'גילפת חנית חדשה'), 'good'); } } else P.spearT = 0;
}
function hunterWhistle() {
  const a = P.a; if (P.callCD > 0 || P.sleeping) return;
  P.callCD = 4; P.roarT = 0.8; AUD.play('whistle'); PROG.flags.whistle = 1;
  let n = 0;
  for (const b of a.pets) if (b.alive && !b.gone) {
    n++; b.state = 'follow'; b.foe = null; b.followTarget = a;
    if (dist2(b.pos, a.pos) > 60) { b.pos.set(a.pos.x + rr(-3, 3), 0, a.pos.z + rr(-3, 3)); b.ground(1, true); }
  }
  shQuery(a.pos.x, a.pos.z, 30, b => { if (b !== a && b.alive && preys(a, b) && b.tpl.kind === 'quad' && b.state !== 'fight' && !b.pet) threatReact(b, a); });
  const hc = horseCall(a);
  UI.notify(hc ? `שרקת. ${hc}${n ? ', וגם החיות שלך חוזרות' : ''}` : n ? (n === 1 ? 'שרקת. החיה שלך חוזרת אליך' : `שרקת. ${n} החיות שלך חוזרות אליך`) : 'שרקת. עוד אין לך חיות מאולפות');
}
function humanPose(pose) {
  if (P.aimT > 0) return 'aim';
  if (pose === 'eat' || pose === 'drink' || P.tameT > 0) return 'kneel';
  if (pose === 'lie') return 'sit';
  if (pose === 'sleep' || pose === 'swim' || pose === 'move' || pose === 'idle') return pose;
  return P.a.speed > 0.15 ? 'move' : 'idle';
}
function useExtra(dt) {
  if (P.ctx === 'tame') tameStep(dt);
  else if (P.ctx === 'perch') { P.landTo = P.perchCand; P.eating = false; }
  else birdFeed(dt);
}
