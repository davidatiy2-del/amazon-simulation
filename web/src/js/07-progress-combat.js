// ================= PROGRESS: save & continue, missions, levels & perks, senses =================
const SAVE_KEY = 'amazonia-save-v1';
const MODS0 = { hunger: 1, regen: 1, air: 1, sense: 1, charm: 0, spearsMax: 5, tameT: 4, petsMax: 3 };
const PROG = { xp: 0, lvl: 1, perks: [], done: [], active: [], flags: {}, pending: 0, choosing: false, checkT: 0, saveT: 20, last: '' };
const xpNeed = l => 70 + l * 55;

// ---------- missions ----------
const isLandPred = () => ['jaguar', 'puma', 'ocelot'].includes(P.spId);
const GOALS = [
  { id: 'drink', t: 'לשתות מים', xp: 20, ok: () => !P.fish, c: () => PROG.flags.drink },
  { id: 'eat', t: 'לאכול עד שהבטן מלאה', xp: 25, c: () => P.food >= 96 },
  { id: 'sense', t: 'להשתמש בחושים (כפתור העין או Q)', xp: 15, c: () => PROG.flags.sense },
  { id: 'fly', t: 'להמריא ולעוף מעל הנהר', xp: 25, ok: () => P.bird, c: () => PROG.flags.fly },
  { id: 'perch', t: 'לנחות על צמרת של עץ', xp: 20, ok: () => P.bird, c: () => PROG.flags.perch },
  { id: 'fruit', t: 'לאכול פירות בצמרת', xp: 25, ok: () => P.bird && P.spId !== 'harpy', c: () => PROG.flags.fruit },
  { id: 'breathe', t: 'לעלות לפני המים לנשום', xp: 20, ok: () => P.fish && !!P.sp.air, c: () => PROG.flags.breathe },
  { id: 'graze', t: 'ללחך עשב', xp: 20, ok: () => P.spId === 'capybara', c: () => PROG.flags.graze },
  { id: 'hunt1', t: 'לצוד טרף ראשון', xp: 40, ok: () => P.isPred, c: () => P.kills >= 1 },
  { id: 'throw', t: 'לפגוע בחנית ממרחק', xp: 40, ok: () => P.human, c: () => PROG.flags.throw },
  { id: 'tame1', t: 'לאלף חיה שתלך איתך', xp: 60, ok: () => P.human, c: () => P.a.pets && P.a.pets.some(b => b.alive) },
  { id: 'fish', t: 'לדוג דג מהגדה', xp: 50, ok: () => isLandPred() || P.human, c: () => PROG.flags.fish },
  { id: 'dive', t: 'לצלול במים כדי להיעלם מטורף', xp: 40, ok: () => P.spId === 'capybara', c: () => PROG.flags.dive },
  { id: 'carry', t: 'לשאת טרף בטפרים', xp: 60, ok: () => P.spId === 'harpy', c: () => PROG.flags.carry },
  { id: 'stoop', t: 'לצלול על טרף מהאוויר', xp: 50, ok: () => P.bird && P.spId !== 'macaw', c: () => PROG.flags.stoop },
  { id: 'mob', t: 'לקרוא ללהקה להבריח טורף', xp: 60, ok: () => P.spId === 'macaw', c: () => PROG.flags.mob },
  { id: 'clay', t: 'ללקק חרסית בקיר החרסית', xp: 50, ok: () => P.spId === 'macaw', c: () => PROG.flags.clay },
  { id: 'leap', t: 'לזנק מעל המים', xp: 40, ok: () => P.fish, c: () => PROG.flags.leap },
  { id: 'frenzy', t: 'להוביל את הלהקה לטירוף', xp: 50, ok: () => P.spId === 'piranha', c: () => PROG.flags.frenzy },
  { id: 'shock', t: 'לשתק חיה במכת חשמל', xp: 50, ok: () => P.spId === 'eel', c: () => PROG.flags.shock },
  { id: 'disc6', t: 'לגלות 6 מינים בספר השדה', xp: 40, c: () => P.discovered.size >= 6 },
  { id: 'day2', t: 'לשרוד עד היום השני', xp: 50, c: () => G.day >= 2 },
  { id: 'den', t: 'לבנות מאורה או קן: לנוח 3 שניות במקום מוגן', xp: 60, ok: () => !P.human, c: () => !!DEN.pos },
  { id: 'mate', t: 'למצוא בן או בת זוג', xp: 80, ok: () => !P.human, c: () => !!(P.partner && P.partner.alive) },
  { id: 'harem', t: 'לחיות עם שתי בנות זוג', xp: 100, ok: () => !P.human && P.sex === 'm', c: () => aliveMates().length >= 2 },
  { id: 'climb', t: 'לטפס על עץ', xp: 30, ok: () => !!CLIMBERS[P.spId], c: () => PROG.flags.climb },
  { id: 'ambush', t: 'לזנק מענף על טרף שעובר מתחת', xp: 70, ok: () => !!CLIMBERS[P.spId], c: () => PROG.flags.ambush },
  { id: 'provide', t: 'לסחוב טרף אל בת הזוג או הגורים', xp: 60, ok: () => !!CARRYMAX[P.spId] && !P.human, c: () => PROG.flags.provide },
  { id: 'heir', t: 'להמשיך את השושלת: לשחק בתור צאצא שגדל', xp: 150, ok: () => !P.human, c: () => (PROG.gen || 1) >= 2 },
  { id: 'command', t: 'לתת פקודה למלווים (לחיצה ארוכה על קריאה, או T / Y)', xp: 40, c: () => PROG.flags.command },
  { id: 'hunt5', t: 'לצוד חמישה טרפים', xp: 80, ok: () => P.isPred, c: () => P.kills >= 5 },
  { id: 'young', t: 'להביא צאצאים לעולם', xp: 80, ok: () => !P.human, c: () => P.cubs.length > 0 || P.raised > 0 },
  { id: 'escape', t: 'להשתחרר מאנקונדה או מרשת של צייד', xp: 70, ok: () => !P.fish && !P.bird, c: () => PROG.flags.escape },
  { id: 'big', t: 'לצוד חיה גדולה: טפיר, קיימן או אנקונדה', xp: 120, ok: () => ['jaguar', 'puma', 'caiman', 'hunter'].includes(P.spId), c: () => PROG.flags.big },
  { id: 'tame3', t: 'להחזיק שלוש חיות מאולפות', xp: 120, ok: () => P.human, c: () => P.a.pets && P.a.pets.filter(b => b.alive).length >= 3 },
  { id: 'scare', t: 'להבריח צייד מהג׳ונגל', xp: 90, ok: () => !P.fish && !P.bird && !P.human, c: () => PROG.flags.scare },
  { id: 'disc14', t: 'לגלות 14 מינים בספר השדה', xp: 70, c: () => P.discovered.size >= 14 },
  { id: 'renown3', t: 'להגיע למעמד 3', xp: 90, c: () => P.renown >= 3 },
  { id: 'day5', t: 'לשרוד חמישה ימים', xp: 120, c: () => G.day >= 5 },
  { id: 'raise', t: 'לגדל צאצא עד שיהיה עצמאי', xp: 150, ok: () => !P.human, c: () => P.raised >= 1 },
  { id: 'legend', t: 'להביס אגדה של הג׳ונגל', xp: 250, ok: () => P.isPred || P.human, c: () => !!PROG.flags.legend },
  { id: 'disc22', t: 'לגלות 22 מינים בספר השדה', xp: 120, c: () => P.discovered.size >= 22 },
  { id: 'day10', t: 'לשרוד עשרה ימים', xp: 200, c: () => G.day >= 10 }
];
const GOAL = {}; for (const g of GOALS) GOAL[g.id] = g;
function fillGoals() {
  PROG.active = PROG.active.filter(id => GOAL[id] && !PROG.done.includes(id));
  for (const g of missionList()) {
    if (PROG.active.length >= 3) break;
    if (!PROG.done.includes(g.id) && !PROG.active.includes(g.id) && (!g.ok || g.ok())) PROG.active.push(g.id);
  }
  PROG.last = '';
}
function progReset() {
  Object.assign(PROG, { xp: 0, lvl: 1, perks: [], done: [], active: [], flags: {}, kb: {}, pending: 0, choosing: false, checkT: 1, saveT: 20, last: '' });
  fillGoals();
}
function gainXP(n) {
  if (G.mode !== 'play' || !P.a || !P.a.alive || !n) return;
  PROG.xp += n; PROG.last = '';
  while (PROG.lvl < 20 && PROG.xp >= xpNeed(PROG.lvl)) { PROG.xp -= xpNeed(PROG.lvl); PROG.lvl++; PROG.pending++; }
}
function completeGoal(id) {
  const g = GOAL[id]; if (!g) return;
  PROG.done.push(id); PROG.active = PROG.active.filter(q => q !== id);
  UI.big('משימה הושלמה', `${g.t}  (+${g.xp} ניסיון)`); AUD.play('chime');
  gainXP(g.xp); fillGoals();
}

// ---------- levels & perks ----------
const PERKS = [
  { id: 'jaws', n: 'לסת ברזל', d: 'הנשיכה, המכה או החנית חזקות יותר ב-20%', f: () => { P.sp.dmg = (P.sp.dmg || 8) * 1.2; } },
  { id: 'legs', n: 'גוף קל', d: 'ריצה, שחייה ותעופה מהירות יותר ב-10%', f: () => { for (const k of ['walk', 'run', 'swim', 'fly']) if (P.sp[k]) P.sp[k] *= 1.1; } },
  { id: 'hide', n: 'עור עבה', d: 'עוד 15% בריאות מקסימלית', f: () => { const a = P.a, k = a.hp / a.maxHp; a.maxHp *= 1.15; a.hp = a.maxHp * k; } },
  { id: 'ghost', n: 'צל ביער', d: 'שקט יותר: הטרף מבחין בך מאוחר יותר', f: () => { P.sp.stealth = (P.sp.stealth || 1) * 0.85; } },
  { id: 'gut', n: 'קיבה חזקה', d: 'רעב וצמא עולים לאט יותר ב-20%', f: () => { P.mods.hunger *= 0.8; } },
  { id: 'heal', n: 'החלמה מהירה', d: 'פצעים נרפאים מהר יותר ב-50%', f: () => { P.mods.regen *= 1.5; } },
  { id: 'lungs', n: 'ריאות גדולות', d: 'האוויר והכוח בצלילה ובתעופה נגמרים לאט יותר', ok: () => P.fish || P.bird || ['caiman', 'capybara', 'jaguar'].includes(P.spId), f: () => { P.mods.air *= 0.75; } },
  { id: 'nose', n: 'חושים חדים', d: 'החושים מגיעים רחוק יותר ונטענים מהר יותר', f: () => { P.mods.sense *= 1.35; } },
  { id: 'charm', n: 'קסם', d: 'קל יותר לחזר ולמצוא בן או בת זוג', ok: () => !P.human, f: () => { P.mods.charm += 0.12; } },
  { id: 'quiver', n: 'אשפה מלאה', d: 'אפשר לשאת עוד שתי חניתות', ok: () => P.human, f: () => { P.mods.spearsMax += 2; P.spears += 2; } },
  { id: 'whisper', n: 'לוחש לחיות', d: 'אילוף מהיר יותר, ועוד חיה מאולפת אחת', ok: () => P.human, f: () => { P.mods.tameT *= 0.7; P.mods.petsMax += 1; } }
];
const PERK = {}; for (const p of PERKS) PERK[p.id] = p;
function perkChoices() {
  const n = id => PROG.perks.filter(q => q === id).length;
  const pool = PERKS.filter(p => (!p.ok || p.ok()) && n(p.id) < 2);
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  return pool.slice(0, 3);
}
function offerPerks() {
  const ch = perkChoices();
  if (!ch.length) { PROG.pending = 0; return; }
  PROG.choosing = true; G.paused = true; INPUT.use = false; INPUT.joy = false; INPUT.up = INPUT.down = false;
  if (document.pointerLockElement) document.exitPointerLock();
  $('perkTitle').textContent = `עלית לרמה ${PROG.lvl - PROG.pending + 1}`;
  $('perkGrid').innerHTML = ch.map(p => `<button class="perk" data-id="${p.id}"><b>${p.n}</b><span>${p.d}</span></button>`).join('');
  $('perks').hidden = false; AUD.play('heart');
}
function choosePerk(id) {
  const p = PERK[id]; if (!p || !PROG.choosing) return;
  p.f(); PROG.perks.push(id); PROG.pending = Math.max(0, PROG.pending - 1);
  $('perks').hidden = true; PROG.choosing = false; G.paused = false; PROG.last = '';
  UI.notify(`שדרוג חדש: ${p.n}`, 'good'); AUD.play('ui');
  saveGame();
}
function renderGoals() {
  const el = $('goals'); if (!el) return;
  const key = PROG.active.join('|') + PROG.lvl + ':' + Math.round(PROG.xp);
  if (key === PROG.last) return; PROG.last = key;
  el.hidden = !P.a;
  { const h = el.querySelector('h3 span'); if (h && P.a) h.textContent = missionTitle(); }
  $('goalList').innerHTML = PROG.active.map(id => `<li>${GOAL[id].t}</li>`).join('') || '<li>כל המשימות הושלמו!</li>';
  $('lvlTxt').textContent = `רמה ${PROG.lvl}`;
  $('xpFill').style.width = (clamp(PROG.xp / xpNeed(PROG.lvl), 0, 1) * 100).toFixed(1) + '%';
}
function progUpdate(dt) {
  if (G.mode !== 'play' || !P.a || !P.a.alive) return;
  PROG.checkT -= dt;
  if (PROG.checkT <= 0) {
    PROG.checkT = 1;
    for (const id of PROG.active.slice()) { const g = GOAL[id]; if (g && g.c()) { completeGoal(id); break; } }
  }
  if (PROG.pending > 0 && !PROG.choosing && !G.paused && !UI.overlay) offerPerks();
  PROG.saveT -= dt; if (PROG.saveT <= 0) { PROG.saveT = 20; saveGame(); }
}

// ---------- save & continue ----------
// ---------- save slots: several games side by side (kept by 07b-saves: on the device, in memory, in the account) ----------
const SAVE_IDX = 'amazonia-saves-v2', SAVE_PRE = 'amazonia-slot-', MAX_SLOTS = 8;
function saveIndex() { try { const x = JSON.parse(lsGet(SAVE_IDX) || '[]'); return Array.isArray(x) ? x.filter(e => e && typeof e.id === 'string') : []; } catch (e) { return []; } }
function writeIndex(x) { lsSet(SAVE_IDX, JSON.stringify(x)); }
function migrateSaves() {
  try {
    const old = lsGet(SAVE_KEY); if (!old) return;
    const d = JSON.parse(old);
    if (d && d.v === 1 && SPECIES[d.sp]) { const id = 's' + (d.at || Date.now()).toString(36); lsSet(SAVE_PRE + id, old); if (!saveIndex().some(e => e.id === id)) indexPut(saveMetaOf(id, d)); }
    lsDel(SAVE_KEY);
  } catch (e) { /* an old save that cannot be read stays where it is */ }
}
function newSlot() {
  const idx = saveIndex().sort((x, y) => y.at - x.at);
  while (idx.length >= MAX_SLOTS) { const o = idx.pop(); lsDel(SAVE_PRE + o.id); cloudDel(o.id); }
  writeIndex(idx); PROG.slot = 's' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
}
// the whole game as plain data; a part that fails is left out (and reported), the rest is kept
function saveData() {
  const a = P.a, alive = b => b && b.alive && !b.gone, part = (k, f, fb) => { try { return f(); } catch (e) { saveErr(k, e); return fb; } };
  const v = P.human && ownCamp();
  return {
    v: 1, at: Date.now(), sp: P.spId, sex: P.sex, pos: [+a.pos.x.toFixed(2), +a.pos.y.toFixed(2), +a.pos.z.toFixed(2)], yaw: +a.yaw.toFixed(3),
    hp: a.hp / a.maxHp, food: P.food, water: P.water, stam: P.stam, air: P.air, time: G.time, day: G.day,
    kills: P.kills, renown: P.renown, raised: P.raised, disc: [...P.discovered], xp: PROG.xp, lvl: PROG.lvl, perks: PROG.perks, done: PROG.done, flags: PROG.flags, kb: PROG.kb || {},
    bondH: P.bondH, litter: P.litter, spears: P.spears || 0, flying: !!P.flying,
    mates: part('mates', () => (P.mates || []).filter(alive).map(m => ({ n: m.name, s: m.sex, bh: m.bondH || 0, li: !!m.litter, pg: m.preg || 0 })), []),
    cubs: part('cubs', () => P.cubs.filter(alive).map(c => ({ n: c.name, s: c.sex, age: c.age || 0, h: c.cubHunger || 0 })), []),
    pets: part('pets', () => P.human && a.pets ? a.pets.filter(alive).map(b => ({ sp: b.spId, n: b.name, s: b.sex, y: !!b.young, h: Math.round(b.hunger ?? 100) })) : [], []),
    gen: PROG.gen || 1, grow: P.growth || 1, jump: P.jumpSkill || 0, arrows: P.arrows ?? 12, store: CAMPH.store || null,
    ownCamp: CAMPH.camp && CAMPH.camp.own ? [+CAMPH.camp.x.toFixed(1), +CAMPH.camp.z.toFixed(1)] : null, preg: (P.a && P.a.preg) || 0,
    den: DEN.pos && !P.human ? [+DEN.pos.x.toFixed(2), +DEN.pos.y.toFixed(2), +DEN.pos.z.toFixed(2)] : null, cubsMode: P.cubsMode || 'den', inv: P.inv || null, campUp: CAMPH.up || {},
    tribe: P.human ? part('tribe', tribeSave, []) : [], vx: P.human ? part('vx', vxSave, null) : null,
    vn: v ? part('vn', vxVillageName, '') : '', pop: v ? part('pop', popCount, 0) : 0
  };
}
function saveGame() {
  if (G.mode !== 'play' || !P.a || !P.a.alive || PROG.loading) return false;
  // a game that did not load whole never writes over the save it came from: it goes on in a new one
  if (!PROG.slot || PROG.keepSave) { PROG.keepSave = false; newSlot(); }
  let d, js;
  try { d = saveData(); js = saveJSON(d); } catch (e) { saveErr('all', e); saveTold(e); return false; }
  const meta = saveMetaOf(PROG.slot, d), r = lsSet(SAVE_PRE + PROG.slot, js);
  indexPut(meta); STORE.lastAt = d.at;
  if (r === true) { STORE.okT = Date.now(); STORE.fail = 0; } else { STORE.fail++; saveTold(r); }
  cloudQueue(meta, js);
  return r === true || CLOUD.ok;
}
function readSlot(id) { return saveOK(lsGet(SAVE_PRE + id) || 'null'); }
function readSave(id) {
  if (id) return readSlot(id);
  for (const e of saveIndex().sort((x, y) => y.at - x.at)) { const d = readSlot(e.id); if (d) { d._id = e.id; return d; } }
  return null;
}
function deleteSlot(id) { lsDel(SAVE_PRE + id); writeIndex(saveIndex().filter(e => e.id !== id)); cloudDel(id); }
function continueGame(id) {
  if (!id && saveIndex().length > 1) { openSaves(); return; }
  const d = readSave(id); if (!d) { syncContinue(); return; }
  const slot = id || d._id;
  SET.sp = d.sp; SET.sex = d.sex; saveSet();
  if ($('saves')) $('saves').hidden = true;
  PROG.loadErr = [];
  try { startGame(false, d); } catch (e) { reportErr(e); PROG.loadErr.push('start'); }
  PROG.loading = false; PROG.slot = slot;
  const bad = PROG.loadErr.filter(k => SAVE_CORE.has(k));
  if (bad.length && G.mode === 'play') { PROG.keepSave = true; UI.notify('⚠️ חלק מהמשחק לא נטען כמו שצריך. השמירה המקורית נשארת שמורה בצד, והמשחק ממשיך בשמירה חדשה', 'bad'); }
}
function placeNear(b, a, r) {
  for (let t = 0; t < 12; t++) {
    const ang = rng() * TAU, x = a.pos.x + Math.cos(ang) * r, z = a.pos.z + Math.sin(ang) * r;
    if (P.fish ? waterDepth(x, z) > 0.8 : waterDepth(x, z) === 0) { b.pos.x = x; b.pos.z = z; break; }
  }
  if (P.fish) { b.pos.y = a.pos.y; b.ownY = true; } else if (P.bird) { b.pos.y = a.pos.y; b.ownY = true; } else b.ground(1, true);
}
// each part of the game comes back on its own: one that fails (reported in PROG.loadErr) does not stop the others
function applySave(d) {
  const a = P.a;
  PROG.loading = true;
  try {
    loadPart('pos', () => {
      const [x, y, z] = d.pos;
      const okPos = inBounds(x, z) && (P.fish ? waterDepth(x, z) > a.height * 1.2 + 0.2 : P.bird || waterDepth(x, z) < 1.2);
      if (okPos) {
        a.pos.set(x, y, z); a.yaw = d.yaw || 0;
        if (P.fish) { const w = waterAt(x, z); a.pos.y = clamp(y, getH(x, z) + a.height, w - 0.1); }
        else if (P.bird) {
          const c = crownNear(x, y, z, 6, true);
          if (d.flying) { P.flying = true; P.perchC = null; P.flySpd = (P.sp.fly || 10) * 0.6; a.pos.y = Math.max(y, getH(x, z) + 3); }
          else if (c && Math.abs(c.top - y) < 2) perchAt(a, c, false); else birdLand();
        } else a.ground(1, true);
      }
    });
    loadPart('perks', () => { for (const id of d.perks || []) if (PERK[id]) { PERK[id].f(); PROG.perks.push(id); } });
    loadPart('stats', () => {
      a.hp = a.maxHp * clamp(d.hp, 0.25, 1);
      Object.assign(P, { food: d.food, water: d.water, stam: d.stam ?? 100, air: d.air ?? 100, kills: d.kills, renown: d.renown, raised: d.raised, bondH: d.bondH || 0, litter: !!d.litter });
      if (P.human) P.spears = clamp(d.spears ?? 3, 0, P.mods.spearsMax);
      G.time = d.time; G.day = d.day; G.lastDawn = d.time;
      P.discovered = new Set(d.disc || [P.spId]);
    });
    loadPart('misc', () => { if (d.den && !P.human) buildDen(d.den[0], d.den[1], d.den[2], true); P.cubsMode = d.cubsMode || 'den'; P.growth = d.grow || 1; P.jumpSkill = d.jump || 0; if (d.arrows != null) P.arrows = d.arrows; if (d.store) CAMPH.store = Object.assign({}, d.store); if (d.preg) { P.a.preg = d.preg; P.preg = d.preg; } });
    if (d.ownCamp && P.human) loadPart('camp', () => foundCampAt(d.ownCamp[0], d.ownCamp[1], true));
    loadPart('inv', () => { if (d.inv) P.inv = Object.assign({ wood: 0, fish: 0 }, d.inv); CAMPH.up = Object.assign({}, d.campUp || {}); for (const id in CAMPH.up) applyCampUp(id, false); });
    if (d.tribe && P.human) loadPart('tribe', () => tribeLoad(d.tribe));
    loadPart('prog', () => { Object.assign(PROG, { gen: d.gen || 1, xp: d.xp || 0, lvl: d.lvl || 1, done: d.done || [], flags: d.flags || {}, kb: d.kb || {}, active: [], pending: 0 }); fillGoals(); silentDone(); });
    loadPart('mates', () => {
      for (const m0 of d.mates || (d.partner ? [{ n: d.partner.n, s: d.partner.s }] : [])) {
        const t = new Animal(P.spId, a.pos.x, a.pos.z, { sex: m0.s, tpl: P.human ? vxMateTpl(m0.s) : undefined }); placeNear(t, a, 3);
        Object.assign(t, { name: m0.n, social: true, socialExtra: true, affinity: 100, isPartner: true, state: 'follow', followTarget: a, bondH: m0.bh || 0, litter: !!m0.li, preg: m0.pg || 0 });
        P.mates.push(t); if (!P.partner) P.partner = t;
      }
    });
    loadPart('cubs', () => {
      const mother = a.sex === 'f' || !P.partner ? a : P.partner;
      for (const c0 of d.cubs || []) {
        const c = new Animal(P.spId, a.pos.x, a.pos.z, { young: true, sex: c0.s, tpl: P.human ? vxKidTpl(c0.s) : undefined }); placeNear(c, a, 2);
        Object.assign(c, { mom: mother, cub: true, state: 'follow', followTarget: mother, age: c0.age, cubHunger: c0.h, name: c0.n, socialExtra: true });
        P.cubs.push(c);
      }
    });
    if (P.human) loadPart('pets', () => {
      for (const p0 of d.pets || []) {
        if (!SPECIES[p0.sp]) continue;
        const b = new Animal(p0.sp, a.pos.x, a.pos.z, { young: p0.y, sex: p0.s }); placeNear(b, a, 3); b.name = p0.n; b.socialExtra = true; b.hunger = p0.h ?? 100; makePet(a, b);
      }
    });
    if (d.den) loadPart('den', () => buildDen(d.den[0], d.den[1], d.den[2], true));
    if (P.human) vxLoad(d.vx || null, d);   // its parts are guarded one by one
    CAM.yaw = a.yaw; CAM.init = false; CAM.dEff = null;
  } finally { PROG.loading = false; }
  UI.big(`יום ${G.day}`, 'ממשיכים מאיפה שהפסקת');
}

// ---------- senses: see prey, danger, mates and water through the foliage ----------
const SENSE = { t: 0, cd: 0, pool: [], tex: null };
function senseActivate() {
  if (G.mode !== 'play' || !P.a || !P.a.alive || G.paused) return;
  if (SENSE.cd > 0) { UI.notify(`החושים עוד מתאוששים (${Math.ceil(SENSE.cd)} שניות)`); return; }
  SENSE.t = 7; SENSE.cd = 16 / P.mods.sense; PROG.flags.sense = 1; AUD.play('chime', 0.35);
}
function senseSprite(i) {
  if (!SENSE.tex) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 30); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,.95)'); gr.addColorStop(0.55, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); SENSE.tex = new THREE.CanvasTexture(cv);
  }
  while (SENSE.pool.length <= i) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: SENSE.tex, transparent: true, depthTest: false, depthWrite: false, sizeAttenuation: false, fog: false, toneMapped: false }));
    s.renderOrder = 999; s.visible = false; scene.add(s); SENSE.pool.push(s);
  }
  return SENSE.pool[i];
}
function senseColor(b, a) {
  if (!b.alive) return P.isPred && b.food > 1 ? '#e08a3a' : null;
  if (b.isPartner || b.cub || b.pet === a) return '#ffd34d';
  if (preys(b, a) || (b.hunter && !b.fleeing && !P.human && !P.fish && !P.bird)) return '#ff3b30';
  if (b.spId === P.spId && !b.young && !P.human) return b.sex !== a.sex ? '#ff7ab0' : '#ff9a3c';
  if (preys(a, b) || ((P.isPred || P.human) && b.spId === 'pacu' && !P.bird)) return '#7dff6a';
  return null;
}
function senseUpdate(dt) {
  SENSE.cd = Math.max(0, SENSE.cd - dt);
  const on = SENSE.t > 0 && G.mode === 'play' && P.a && P.a.alive;
  if (SENSE.t > 0) SENSE.t -= dt;
  let n = 0;
  if (on) {
    const a = P.a, R = 55 * P.mods.sense * (P.bird && P.flying ? 1.6 : 1), fade = Math.min(1, SENSE.t * 1.5, (7 - SENSE.t) * 4), list = [];
    shQuery(a.pos.x, a.pos.z, R, (b, d) => { if (b !== a && !b.gone && !b.hidden && (b.alive || b.food > 1)) list.push([d, b]); });
    list.sort((p, q) => p[0] - q[0]);
    for (const [d, b] of list) {
      if (n >= 36) break;
      const col = senseColor(b, a); if (!col) continue;
      const s = senseSprite(n++); s.visible = true; s.position.set(b.pos.x, b.pos.y + b.height + 0.45, b.pos.z);
      s.material.color.set(col); s.material.opacity = fade * (0.7 + 0.3 * (1 - d / R)); s.scale.setScalar((0.04 + 0.035 * (1 - d / R)) * (1 + Math.sin(G.t * 6 + b.id) * 0.12));
    }
    if (!P.fish && P.water < 80) {
      const w = nearestWater(a.pos.x, a.pos.z);
      if (w && Math.hypot(w.x - a.pos.x, w.z - a.pos.z) > 4) { const s = senseSprite(n++); s.visible = true; s.position.set(w.x, Math.max(waterAt(w.x, w.z), getH(w.x, w.z)) + 1.2, w.z); s.material.color.set('#4fb3ff'); s.material.opacity = fade; s.scale.setScalar(0.06 * (1 + Math.sin(G.t * 4) * 0.15)); }
    }
  }
  for (let i = n; i < SENSE.pool.length; i++) SENSE.pool[i].visible = false;
}

// ================= DENS & NESTS: a safe home for sleep and for the young =================
const DEN = { pos: null, mesh: null, mat: null, hinted: false };
const denName = () => P.bird ? 'קן' : P.fish ? 'מקום הטלה' : 'מאורה';
function inDen() {
  const a = P.a; if (!a) return false;
  if (P.human) return HUNT.camps.some(c => !c.gone && Math.hypot(c.x - a.pos.x, c.z - a.pos.z) < 8);
  return !!DEN.pos && Math.hypot(DEN.pos.x - a.pos.x, DEN.pos.z - a.pos.z) < (P.bird ? 2.5 : 4) && Math.abs(DEN.pos.y - a.pos.y) < 3;
}
function denSpotOk() {
  const a = P.a; if (!a || !a.alive || P.human) return false;
  if (P.bird) return !P.flying && !!P.perchC;
  if (P.fish) { const wd = waterDepth(a.pos.x, a.pos.z); return wd > 0.8 && wd < 4; }
  if (a.swimming || waterDepth(a.pos.x, a.pos.z) > 0) return false;
  return getNY(a.pos.x, a.pos.z) > 0.85;
}
function clearDen() { if (DEN.mesh) { scene.remove(DEN.mesh); DEN.mesh.geometry.dispose(); } DEN.mesh = null; DEN.pos = null; }
function buildDen(x, y, z, quiet) {
  clearDen();
  const R = new Rig(), s = P.a ? clamp(P.a.camSize || 1, 0.3, 1.3) : 1, add = (geo, p, r, sc, c) => R.add(geo, M(p, r, sc), 0, col(c), 1);
  if (P.bird) {
    add(new THREE.TorusGeometry(0.2 * s + 0.08, 0.07 * s + 0.03, 6, 14), [0, 0.04, 0], [Math.PI / 2, 0, 0], null, '#6b4f30');
    add(new THREE.CylinderGeometry(0.2 * s + 0.08, 0.12 * s + 0.05, 0.06, 12), [0, 0.0, 0], null, null, '#4a3622');
    for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; add(new THREE.CylinderGeometry(0.008, 0.01, 0.34 * s + 0.12, 4), [Math.cos(a) * 0.22 * s, 0.05, Math.sin(a) * 0.22 * s], [Math.PI / 2, a + 0.6, 0.2], null, '#7a5c38'); }
  } else if (P.fish) {
    for (let i = 0; i < 11; i++) { const a = i / 11 * TAU, r = 0.7 + (i % 3) * 0.12; add(new THREE.SphereGeometry(0.09 + (i % 4) * 0.025, 6, 5), [Math.cos(a) * r, 0.03, Math.sin(a) * r], null, [1, 0.6, 1], i % 2 ? '#b8ab8c' : '#9a8f76'); }
    add(new THREE.CylinderGeometry(0.62, 0.62, 0.02, 14), [0, 0.0, 0], null, null, '#6f6650');
  } else {
    const r = 0.75 * s + 0.35;
    add(new THREE.TorusGeometry(r, 0.2 * s + 0.08, 7, 16), [0, 0.08, 0], [Math.PI / 2, 0, 0], [1, 1, 0.75], '#4f3a24');
    add(new THREE.CylinderGeometry(r * 0.95, r * 0.95, 0.05, 16), [0, 0.02, 0], null, null, '#6b5a34');
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.3; add(new THREE.IcosahedronGeometry(0.22 * s + 0.08, 0), [Math.cos(a) * r, 0.18, Math.sin(a) * r], [a, a * 2, 0], [1, 0.6, 1], i % 2 ? '#3e5a26' : '#4f6b2c'); }
    for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; add(new THREE.CylinderGeometry(0.025, 0.035, r * 2.3, 5), [Math.cos(a) * r * 0.3, 0.22, Math.sin(a) * r * 0.3], [Math.PI / 2 - 0.2, a, 0.15], null, '#5a3f28'); }
  }
  if (!DEN.mat) DEN.mat = new THREE.MeshLambertMaterial({ vertexColors: true });
  const mesh = new THREE.Mesh(R.geometry(), DEN.mat); mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; scene.add(mesh);
  DEN.mesh = mesh; DEN.pos = new V3(x, y, z);
  if (!quiet) {
    UI.big(`בנית ${denName()}`, P.bird ? 'שינה בקן בטוחה ומרפאת מהר, והגוזלים יחכו כאן כשתצא לחפש אוכל' : 'שינה כאן בטוחה ומרפאת מהר, והצאצאים יחכו כאן מוסתרים כשתצא לצוד');
    AUD.play('chime'); saveGame();
  }
}
function denUpdate(dt) {
  if (G.mode !== 'play' || !P.a || !P.a.alive || P.human) return;
  const a = P.a, far = !DEN.pos || Math.hypot(DEN.pos.x - a.pos.x, DEN.pos.z - a.pos.z) > 80;
  if ((P.resting || P.sleeping) && far && a.speed < 0.3 && denSpotOk()) {
    P.denT = (P.denT || 0) + dt;
    if (!DEN.hinted && P.denT > 0.6) { DEN.hinted = true; UI.notify(`נחים כאן? עוד רגע ${P.bird ? 'ייבנה כאן קן' : 'תיבנה כאן ' + denName()}`); }
    if (P.denT > 3) {
      P.denT = 0;
      const y = P.bird ? (P.perchC ? P.perchC.top - 0.15 : a.pos.y) : P.fish ? getH(a.pos.x, a.pos.z) + 0.02 : getH(a.pos.x, a.pos.z);
      const moved = !!DEN.pos;
      buildDen(a.pos.x, y, a.pos.z, false);
      if (moved) UI.notify(`העברת את ה${denName()} לכאן`);
    }
  } else P.denT = 0;
}
function denHold(a, dt) {
  if (P.cubsMode === 'follow') { a.atDen = false; return false; }
  const D = DEN.pos, L = a.followTarget; if (!D || !L || !a.cub) { a.atDen = false; return false; }
  const ld = Math.hypot(L.pos.x - D.x, L.pos.z - D.z), cd = Math.hypot(a.pos.x - D.x, a.pos.z - D.z);
  if (a.atDen ? ld < 22 : (ld < 35 || cd > 70)) { a.atDen = false; return false; }
  a.atDen = true;
  const k = a.id * 2.4, rr0 = P.bird ? 0.15 : 0.8, tx = D.x + Math.cos(k) * rr0, tz = D.z + Math.sin(k) * rr0;
  if (P.bird) {
    _tmp.set(tx, D.y + 0.08, tz);
    if (a.pos.distanceTo(_tmp) > 0.3) { flyToward(a, _tmp, 6, dt, 4); a.pose = 'fly'; }
    else { a.pos.lerp(_tmp, Math.min(1, dt * 5)); a.vel.set(0, 0, 0); a.vy = 0; a.bank = 0; a.speed = 0; a.pose = 'perch'; }
    return true;
  }
  if (P.fish) { _tmp.set(tx, D.y + 0.35, tz); swimToward(a, _tmp, 1.2, dt); return true; }
  const dx = tx - a.pos.x, dz = tz - a.pos.z, d = Math.hypot(dx, dz) || 0.01;
  if (d > 0.6) { a.move(dx / d, dz / d, (a.sp.walk || 1.4) * 1.4, dt); a.pose = 'move'; }
  else { a.move(dx / d, dz / d, 0, dt); a.pose = 'lie'; }
  return true;
}

// ================= COMBAT DYNAMICS =================
const COMBAT = { combo: 0, comboT: 0, pend: false, holdT: 0, charging: false, charge: 0, bypass: false, slowT: 0, counterT: 0, bleed: new Set(),
  feudT: 3, roll: null, finTold: -1, hits: 0, holdTold: false, bleedTold: false, el: null, low: null };
const FINISH = { jaguar: 'נשיכת גולגולת!', puma: 'נשיכה בצוואר!', ocelot: 'נשיכה בצוואר!', caiman: 'גלגול מוות!', capybara: 'בעיטה מכרעת!', hunter: 'דקירה אחרונה!' };
(function () {
  const st = document.createElement('style');
  st.textContent = `#ctext{position:absolute;left:50%;top:34%;transform:translate(-50%,-50%);font-family:'Karantina','Rubik',sans-serif;font-size:48px;line-height:1;color:#fff3d6;text-shadow:0 3px 16px rgba(0,0,0,.65);pointer-events:none;opacity:0;white-space:nowrap}
#ctext.go{animation:cpop .95s ease-out forwards}#ctext.crit{color:#ffd34d}#ctext.bad{color:#ff7a66}
@keyframes cpop{0%{opacity:0;transform:translate(-50%,-50%) scale(.55)}14%{opacity:1;transform:translate(-50%,-50%) scale(1.18)}30%{transform:translate(-50%,-50%) scale(1)}72%{opacity:1}100%{opacity:0;transform:translate(-50%,-64%) scale(1)}}
#lowhp{position:fixed;inset:0;pointer-events:none;z-index:9;opacity:0;background:radial-gradient(ellipse at center,rgba(0,0,0,0) 48%,rgba(160,0,0,.6) 100%)}
body.touch #ctext{font-size:38px;top:28%}
#tAtk.fin{box-shadow:0 0 0 3px #ffd34d,0 0 24px #ffd34d}#tAtk.chg{transform:scale(1.1);background:rgba(232,110,50,.8)}`;
  document.head.appendChild(st);
  const i = GOALS.findIndex(g => g.id === 'disc6');
  const gs = [
    { id: 'heavy', t: 'להחזיק את התקיפה למכה חזקה', xp: 30, ok: () => !P.fish && !P.bird && !P.human, c: () => PROG.flags.heavy },
    { id: 'perfect', t: 'להתחמק ברגע האחרון (קפיצה כשמופיע !)', xp: 50, ok: () => !P.fish && !P.bird, c: () => PROG.flags.perfect },
    { id: 'finish', t: 'לסיים קרב במכה מכרעת', xp: 60, ok: () => P.isPred && !P.fish && !P.bird, c: () => PROG.flags.finisher }
  ];
  GOALS.splice(i < 0 ? GOALS.length : i, 0, ...gs); for (const g of gs) GOAL[g.id] = g;
})();

function combatText(txt, kind) {
  if (!COMBAT.el) { COMBAT.el = document.createElement('div'); COMBAT.el.id = 'ctext'; $('hud').appendChild(COMBAT.el); }
  const e = COMBAT.el; e.textContent = txt; e.className = ''; void e.offsetWidth; e.className = 'go ' + (kind || '');
}
// per-animal hit flash and wounds (shared material, uniforms set right before each draw)
function charUniforms(a, m) {
  if (!m || !m.isMeshPhongMaterial) return;
  if (a.pal && a.mesh.material === a.tpl.mat) a.mesh.material = personalMat(a.tpl);
  const h = a.alive && a.anim && a.anim.hurt > 0 ? Math.min(1, a.anim.hurt * 3.2) : 0;
  const w = a.maxHp && a.tpl.kind !== 'fish' ? clamp((0.78 - Math.max(0, a.hp) / a.maxHp) / 0.78, 0, 1) * 0.9 : 0;
  CHAR_U.uHit.value = h; CHAR_U.uWound.value = w; CHAR_U.uTint.value = a.pal ? personTint(a) : TINT1; m.uniformsNeedUpdate = true;
}
// a person's own colours on a shared shape: for each slot, how much each of red, green and blue is turned up or down
function personTint(a) {
  const pal = a.pal, tpl = a.tpl, base = tpl && tpl.base; if (!pal || !base) return TINT1;
  if (a._tint && a._tintTpl === tpl) return a._tint;
  const t = a._tint || (a._tint = new Float32Array(21)); t.fill(1);
  for (let s = 1; s <= 6; s++) {
    const want = pal[s], b = base[s]; if (!want || !b) continue;
    t[s * 3] = want.r / Math.max(0.02, b.r); t[s * 3 + 1] = want.g / Math.max(0.02, b.g); t[s * 3 + 2] = want.b / Math.max(0.02, b.b);
  }
  a._tintTpl = tpl; return t;
}
const canHeavy = () => !!(P.a && P.a.alive && P.a.tpl.kind === 'quad' && !P.human && !P.bird && !P.fish);
function combatIntercept() {
  if (COMBAT.bypass) { COMBAT.bypass = false; return false; }
  // the quick attack always happens right away; holding the button afterwards charges a heavy one
  if (canHeavy() && INPUT.atkHeld && !COMBAT.charging && !(P.stun > 0) && !P.sleeping) { COMBAT.pend = true; COMBAT.holdT = 0; }
  return false;
}
function behind(t, a) { const dx = a.pos.x - t.pos.x, dz = a.pos.z - t.pos.z, d = Math.hypot(dx, dz) || 1; return (dx * Math.sin(t.yaw) + dz * Math.cos(t.yaw)) / d < -0.35; }
function canFinish(t) {
  const a = P.a;
  if (!a || !t || !t.alive || t.isPlayer || P.fish || P.bird || t.tpl.kind === 'fish' || t.tpl.kind === 'bird' || t.spId === 'eel' || t.hunter || t.pet === a) return false;
  if (dist2(t.pos, a.pos) > (P.sp.reach || 1.5) * a.scale + t.rad + 0.7) return false;
  const weak = t.hp < t.maxHp * 0.22 || ((t.stunT || 0) > 0.05 && t.hp < t.maxHp * 0.5);
  return weak && (t.maxHp <= a.maxHp * 2.4 || t.hp < t.maxHp * 0.12);
}
function stagger(t, dur, src, push) {
  if (!t || !t.alive || !src) return;
  if (t.isPlayer) P.stun = Math.max(P.stun, dur);
  else { t.stunT = Math.max(t.stunT || 0, dur); t.windup = 0; t.feint = false; if (P.warnFrom === t) P.warnFrom = null; }
  t.anim.hurt = Math.max(t.anim.hurt || 0, 0.3);
  const k = clamp((src.maxHp || 60) / Math.max(15, t.maxHp), 0.25, 1.6) * push, kd = t.tpl.kind;
  if (k > 0.05 && (kd === 'quad' || kd === 'human' || kd === 'snake') && !t.carriedBy) {
    const dx = t.pos.x - src.pos.x, dz = t.pos.z - src.pos.z, d = Math.hypot(dx, dz) || 1, oy = t.yaw;
    t.move(dx / d, dz / d, 5.5 * k, 0.14); t.yaw = oy;
  }
}
function strike(t, mult, heavy) {
  const a = P.a, sp = P.sp;
  if (canFinish(t)) { finisher(t); return; }
  let dmg = (sp.dmg || 8) * rr(0.85, 1.15) * a.scale * mult, crit = false;
  if (t.state !== 'flee' && t.state !== 'fight' && t.state !== 'warn' && t.state !== 'hunt') dmg *= 1.35;
  if (P.crouch) dmg *= 1.15;
  if (COMBAT.counterT > 0) { dmg *= 2; crit = true; COMBAT.counterT = 0; combatText('מתקפת נגד!', 'crit'); }
  else if (behind(t, a)) { dmg *= 1.3; crit = true; if (heavy) combatText('מכה מהגב!', 'good'); }
  if (P.stam < 8) dmg *= 0.6;
  if (t.spId === P.spId && t.sex === a.sex && !t.young) t.isRival = true;
  hurt(t, dmg, a);
  AUD.play('bite'); CAM.shake = Math.max(CAM.shake, heavy ? 0.3 : 0.12);
  if (t.alive && (heavy || crit)) stagger(t, heavy ? 0.85 : 0.4, a, heavy ? 1.1 : 0.45);
  if (heavy && !t.alive) COMBAT.slowT = Math.max(COMBAT.slowT, 0.3);
}
function quickStrike(t) {
  COMBAT.combo = COMBAT.comboT > 0 ? COMBAT.combo + 1 : 1; COMBAT.comboT = 1.1; COMBAT.hits++;
  P.stam = Math.max(0, P.stam - 4);
  const third = COMBAT.combo >= 3;
  if (third) { COMBAT.combo = 0; combatText('קומבו ×3', 'good'); }
  strike(t, third ? 1.5 : COMBAT.combo === 2 ? 1.12 : 1, false);
  if (third && t.alive) stagger(t, 0.45, P.a, 0.6);
  if (!COMBAT.holdTold && COMBAT.hits === 3 && canHeavy()) { COMBAT.holdTold = true; UI.notify(TOUCH ? 'טיפ: להחזיק את כפתור התקיפה כדי לטעון מכה חזקה' : 'טיפ: להחזיק את הקליק כדי לטעון מכה חזקה', 'good'); }
}
function lungeTarget(r) {
  const a = P.a, fx = Math.sin(a.yaw), fz = Math.cos(a.yaw); let best = null, bs = -1e9;
  shQuery(a.pos.x, a.pos.z, r + 2, (b, d) => {
    if (b === a || !b.alive || b.isPartner || b.cub || b.perched || b.pet === a || b.escort) return;
    if (b.tpl.kind === 'bird' && b.pos.y - a.pos.y > 1.5) return;
    if (d > r + b.rad) return;
    const dot = d > 0.01 ? ((b.pos.x - a.pos.x) * fx + (b.pos.z - a.pos.z) * fz) / d : 1; if (dot < 0.35) return;
    const s = dot * 3 - d + (b === P.target ? 2 : 0); if (s > bs) { bs = s; best = b; }
  });
  return best;
}
function heavyAttack(k) {
  const a = P.a, sp = P.sp;
  if (P.stun > 0 || !a.alive) return;
  if (P.stam < 12) { combatText('אין כוח למכה חזקה', 'bad'); return; }
  P.stam -= 16 + k * 10; P.atkCD = 0.95; a.anim.atk = 0.55; P.resting = false; PROG.flags.heavy = 1;
  const t = lungeTarget(2.4 + k * 2.2);
  if (t) a.yaw = Math.atan2(t.pos.x - a.pos.x, t.pos.z - a.pos.z);
  a.move(Math.sin(a.yaw), Math.cos(a.yaw), 6 + k * 7, 0.16);
  AUD.play(sp.call || 'growl', 0.7); CAM.shake = Math.max(CAM.shake, 0.22);
  if (!t || dist2(t.pos, a.pos) > (sp.reach || 1.5) * a.scale + t.rad + 0.8) { AUD.play('swipe'); return; }
  if ((t.tpl.kind === 'fish' || t.spId === 'eel') && !a.swimming) { fishSwipe(t); return; }
  if (k > 0.85) combatText('מכה טעונה!', 'good');
  strike(t, 1.55 + k * 0.85, true);
  partnerAssist(t);
}
function finisher(t) {
  const a = P.a;
  if (t.isRival && t.spId === P.spId) { t.hp = Math.min(t.hp, t.maxHp * 0.2); if (!t.defeated) rivalSubmit(t); combatText('הכנעה!', 'crit'); return; }
  COMBAT.slowT = 0.6; CAM.shake = 0.45; a.anim.atk = 0.55;
  combatText(FINISH[P.spId] || 'מכה מכרעת!', 'crit'); AUD.play('bite'); AUD.play(P.sp.call || 'growl', 0.6);
  FX.spawn('blood', t.pos.x, t.pos.y + t.height * 0.6, t.pos.z, 16);
  PROG.flags.finisher = 1;
  hurt(t, t.hp + 1, a); cineStart(t, 1.5);
}
function perfectDodge(th) {
  if (th.windup < 0.3) { COMBAT.slowT = 0.75; COMBAT.counterT = 1.8; combatText('התחמקות מושלמת!', 'crit'); AUD.play('chime', 0.5); PROG.flags.perfect = 1; }
  else combatText('התחמקות', 'good');
}
function combatOnPlayerHurt(dmg, src) {
  const a = P.a; if (!a || !src || !src.alive || !src.tpl) return;
  const kd = src.tpl.kind;
  if (dmg > a.maxHp * 0.12 && (kd === 'quad' || kd === 'snake' || kd === 'human')) stagger(a, 0.32, src, 0.8);
}
// ---------- bleeding ----------
function startBleed(t, dmg) {
  if (!t || !t.alive || t.hunter || t.tpl.kind === 'fish' || t.spId === 'eel' || dmg < t.maxHp * 0.12) return;
  t.bleedT = Math.max(t.bleedT || 0, 5 + Math.min(6, dmg / t.maxHp * 20)); t.bleedR = clamp(dmg * 0.05, 0.5, 2.6) * (t.isPlayer ? 0.8 : 1);
  COMBAT.bleed.add(t);
  if (t.isPlayer && !COMBAT.bleedTold) { COMBAT.bleedTold = true; UI.notify(you('אתה מדמם! מנוחה עוצרת את הדימום מהר יותר', 'את מדממת! מנוחה עוצרת את הדימום מהר יותר'), 'bad'); }
}
function updateBleeds(dt) {
  for (const t of COMBAT.bleed) {
    if (!t.alive || t.gone || t.bleedT <= 0) { COMBAT.bleed.delete(t); continue; }
    t.bleedT -= dt * (t.isPlayer && (P.resting || P.sleeping) ? 3 : 1);
    t.hp -= dt * t.bleedR;
    t.dripT = (t.dripT || 0) - dt;
    if (t.dripT <= 0 && t.dCam < 45) { t.dripT = 0.35; FX.spawn('blood', t.pos.x, t.pos.y + t.height * 0.4, t.pos.z, 2); }
    if (t.hp <= 0) {
      COMBAT.bleed.delete(t);
      if (t.isPlayer) { if (G.mode === 'play') { t.hp = 0; playerDie(you('דיממת למוות', 'דיממת למוות')); } }
      else kill(t, t.lastHit && t.lastHit.alive ? t.lastHit : null);
    }
  }
}
// ---------- caiman death roll ----------
function startRoll(c) {
  if (!P.a || !P.a.alive || P.coil || HUNT.net || COMBAT.roll || G.mode !== 'play') return;
  COMBAT.roll = { c, t: 0 }; P.qte = 0.3; P.resting = false; P.sleeping = false;
  UI.qte(true, 'roll'); AUD.play('splash'); CAM.shake = 0.5; combatText('גלגול מוות!', 'bad');
}
function endRoll(escaped) {
  const r = COMBAT.roll; COMBAT.roll = null; UI.qte(false); if (!r) return;
  if (escaped && r.c.alive) { stagger(r.c, 1.6, P.a, 1); r.c.state = 'float'; r.c.stT = 6; combatText('השתחררת!', 'good'); PROG.flags.escape = 1; P.stun = 0; }
}
function updateRoll(dt) {
  const r = COMBAT.roll; if (!r) return;
  const a = P.a, c = r.c;
  if (!a || !a.alive || G.mode !== 'play') { endRoll(false); return; }
  if (!c.alive) { endRoll(true); return; }
  r.t += dt; P.qte = Math.max(0, P.qte - dt * 0.16);
  c.stunT = 0.15; c.pos.x += (a.pos.x - c.pos.x) * Math.min(1, dt * 6); c.pos.z += (a.pos.z - c.pos.z) * Math.min(1, dt * 6);
  a.hp -= dt * 7; CAM.yaw += dt * 4.5; a.anim.hurt = 0.15;
  r.fx = (r.fx || 0) - dt; if (r.fx <= 0) { r.fx = 0.45; const w = waterAt(a.pos.x, a.pos.z); FX.spawn('splash', a.pos.x, w > -900 ? w : a.pos.y, a.pos.z, 10); }
  if (a.hp <= 0) { endRoll(false); playerDie(you('הקיימן גרר אותך לגלגול מוות', 'הקיימן גרר אותך לגלגול מוות')); return; }
  if (P.qte >= 1) endRoll(true);
}
// ---------- NPC fighting: circling, feints, follow-up strikes ----------
// sideways step that keeps the fighter facing its foe (move() would turn it toward the travel direction)
function strafeMove(a, mx, mz, spd, dt) {
  const nx = a.pos.x + mx * spd * dt, nz = a.pos.z + mz * spd * dt;
  if (!inBounds(nx, nz) || (!a.swimming && waterDepth(nx, nz) > (a.swimDepth || 0.5))) { a.circ = -(a.circ || 1); return; }
  if (Math.abs(getH(nx, nz) - getH(a.pos.x, a.pos.z)) > spd * dt * 1.8) { a.circ = -(a.circ || 1); return; }
  const tp = { x: nx, z: nz }; trunkPush(tp, a.rad * 0.55); if (DEF.n) defPush(tp, a.rad * 0.55, a, dt);
  a.pos.x = tp.x; a.pos.z = tp.z; a.speed = spd;
}
function fightClose(a, f, dx, dz, d, reach, dt) {
  if (a.atkCD > 0 && a.tpl.kind === 'quad' && !a.swimming) {
    a.circ = a.circ || (a.id % 2 ? 1 : -1); if (rng() < dt * 0.35) a.circ = -a.circ;
    const back = d < reach * 0.55 ? -0.7 : d > reach * 0.85 ? 0.4 : 0;
    const mx = -dz / d * a.circ + dx / d * back, mz = dx / d * a.circ + dz / d * back, ml = Math.hypot(mx, mz) || 1;
    strafeMove(a, mx / ml, mz / ml, (a.sp.walk || 1.5) * 1.35, dt);
    a.yaw += angDiff(a.yaw, Math.atan2(dx, dz)) * Math.min(1, dt * 8); a.pose = 'move';
  } else { a.move(dx / d, dz / d, 0.01, dt); a.pose = a.swimming ? 'swim' : 'fight'; }
  if (a.atkCD <= 0) {
    a.windup = f.isPlayer ? 0.6 : 0.3;
    if (f.isPlayer) { P.warnFrom = a; a.feint = a.sp.ai === 'pred' && !a.young && rng() < 0.14; }
  }
}
// predators clash over carcasses, and rival males of the same kind fight over territory
function predatorFeuds() {
  for (const a of ANIMALS) {
    if (!a.alive || a.isPlayer || a.pet || a.isPartner || a.young || a.social || (a.sp.ai !== 'pred' && a.sp.ai !== 'croc')) continue;
    const eating = a.state === 'eat' && a.target, idle = a.state === 'idle' || a.state === 'wander';
    if (!eating && !idle) continue;
    let rival = null;
    shQuery(a.pos.x, a.pos.z, eating ? 14 : 16, b => {
      if (rival || b === a || !b.alive || b.isPlayer || b.pet || b.isPartner || b.young || b.cub || b.social || (b.sp.ai !== 'pred' && b.sp.ai !== 'croc')) return;
      if (b.state === 'fight' || b.state === 'flee') return;
      if (eating ? (b.spId === a.spId && b.sex !== a.sex) : !(b.spId === a.spId && b.sex === 'm' && a.sex === 'm')) return;
      rival = b;
    });
    if (rival && rng() < (eating ? 0.5 : 0.08)) {
      a.state = 'fight'; a.foe = rival; rival.state = 'fight'; rival.foe = a;
      if (Math.min(a.dCam, rival.dCam) < 50 && G.mode === 'play') UI.notify(eating ? `${rival.sp.he} ו${a.sp.he} נלחמים על טרף!` : `שני ${a.sp.he} זכרים נאבקים על שטח!`, 'bad');
      return;
    }
  }
}
function combatUpdate(dt) {
  if (!COMBAT.helped) combatHelp();
  if (COMBAT.comboT > 0) COMBAT.comboT -= dt; else COMBAT.combo = 0;
  if (COMBAT.counterT > 0) COMBAT.counterT -= dt;
  updateBleeds(dt); updateRoll(dt);
  COMBAT.feudT -= dt; if (COMBAT.feudT <= 0) { COMBAT.feudT = 2; predatorFeuds(); }
  const a = P.a;
  if (!COMBAT.low) { COMBAT.low = document.createElement('div'); COMBAT.low.id = 'lowhp'; document.body.appendChild(COMBAT.low); }
  const lowK = G.mode === 'play' && a && a.alive ? clamp((0.32 - a.hp / a.maxHp) / 0.32, 0, 1) : 0;
  COMBAT.low.style.opacity = lowK ? (lowK * (0.55 + 0.45 * Math.sin(G.t * 6))).toFixed(2) : '0';
  if (G.mode !== 'play' || !a || !a.alive) { COMBAT.pend = COMBAT.charging = false; return; }
  if (COMBAT.pend || COMBAT.charging) {
    COMBAT.holdT += dt;
    if (COMBAT.pend && !INPUT.atkHeld) COMBAT.pend = false;
    else if (COMBAT.pend && COMBAT.holdT >= 0.3) { COMBAT.pend = false; COMBAT.charging = true; AUD.play('growl', 0.35); }
    if (COMBAT.charging) {
      COMBAT.charge = clamp((COMBAT.holdT - 0.3) / 0.6, 0, 1);
      if (!INPUT.atkHeld || COMBAT.holdT > 1.6 || P.stun > 0 || P.sleeping) { COMBAT.charging = false; heavyAttack(COMBAT.charge); }
    }
  }
  const t = P.target, fin = !!(t && t.alive && canFinish(t));
  if (fin && COMBAT.finTold !== t.id) { COMBAT.finTold = t.id; combatText(TOUCH ? 'אפשר לסיים! תקיפה' : 'אפשר לסיים! קליק', 'good'); }
  if (TOUCH) { const b = $('tAtk'); b.classList.toggle('fin', fin); b.classList.toggle('chg', COMBAT.charging); }
}
function resetCombat() {
  if (COMBAT.roll) endRoll(false);
  COMBAT.bleed.clear(); INPUT.atkHeld = false;
  Object.assign(COMBAT, { combo: 0, comboT: 0, pend: false, charging: false, slowT: 0, counterT: 0, finTold: -1 });
}
function combatHelp() {
  const k = $('help') && $('help').querySelector('.keys'); if (!k || COMBAT.helped) return; COMBAT.helped = true;
  const rows = TOUCH ? [['תקיפה ארוכה', 'להחזיק את התקיפה: מכה חזקה שמפילה את היריב. שלוש מכות מהירות ברצף: קומבו'], ['! וקפיצה', 'קפיצה ברגע האחרון מאטה את הזמן ומאפשרת מתקפת נגד כפולה']]
    : [['להחזיק קליק', 'מכה חזקה שמפילה את היריב. שלוש מכות מהירות ברצף: קומבו'], ['רווח כשמופיע !', 'התחמקות. ברגע האחרון היא מאטה את הזמן ומאפשרת מתקפת נגד כפולה']];
  k.insertAdjacentHTML('afterbegin', rows.map(([a, b]) => `<kbd>${a}</kbd><span>${b}</span>`).join(''));
}

// ================= MATES, RIVALS, BIRD HUNTING & SAVE SLOTS =================
const SOC = { raidT: 200, watchT: 0, mob: null };
const maxMates = () => P.a && P.a.sex === 'm' ? (P.human ? 8 : 3) : 1;
const aliveMates = () => (P.mates || []).filter(m => m && m.alive && !m.gone && m.isPartner);
function socReset() { SOC.raidT = rr(170, 260); SOC.watchT = 0; SOC.mob = null; BH.cand = null; BH.stoop = null; bhHide('mark'); bhHide('warn'); }

// ---------- families with several mates ----------
function familyTick(gh) {
  P.mates = aliveMates();
  if (P.partner && (!P.partner.alive || !P.partner.isPartner)) P.partner = null;
  if (P.partner && !P.mates.includes(P.partner)) P.mates.unshift(P.partner);
  if (!P.partner && P.mates.length) P.partner = P.mates[0];
  pregTick(gh);
}
function famRows() {
  let h = '';
  for (const m of aliveMates()) h += `<div class="row"><span class="heart">♥ ${m.name}</span><span>${Math.round(m.hp / m.maxHp * 100)}%</span></div>`;
  return h;
}
function famPending() {
  if (P.a.sex === 'f') return P.a.preg ? 14 * (1 - P.a.preg / gestOf()) : -1;
  const w = aliveMates().filter(m => m.preg).map(m => 14 * (1 - m.preg / gestOf()));
  return w.length ? Math.max(...w) : -1;
}

// ---------- rivals who take your mates ----------
const takeText = (r, n) => P.a.sex === 'm' ? (n > 1 ? `את ${n} בנות הזוג שלך` : 'את בת הזוג שלך') : 'את בן הזוג שלך';
function stealMates(r) {
  const taken = aliveMates(); if (!taken.length) return 0;
  r.harem = r.harem || [];
  for (const m of taken) {
    m.isPartner = false; m.stolenBy = r; m.state = 'follow'; m.followTarget = r; m.affinity = Math.min(m.affinity || 0, 40); r.harem.push(m);
    for (const c of P.cubs) if (c.followTarget === m) c.followTarget = P.a;
  }
  P.mates = []; P.partner = null;
  return taken.length;
}
function returnHarem(r) {
  const back = (r.harem || []).filter(m => m.alive && !m.gone && m.stolenBy === r); r.harem = [];
  let n = 0;
  for (const m of back) {
    m.stolenBy = null;
    if (aliveMates().length < maxMates()) { Object.assign(m, { isPartner: true, state: 'follow', followTarget: P.a, affinity: 100 }); P.mates.push(m); if (!P.partner) P.partner = m; n++; FX.spawn('heart', m.pos.x, m.pos.y + m.height, m.pos.z, 6); }
    else { m.state = 'idle'; m.followTarget = null; }
  }
  return n;
}
function rivalWins(r) {
  const n = stealMates(r);
  r.state = 'idle'; r.foe = null; r.windup = 0; r.isRival = false; r.victor = true; if (P.warnFrom === r) P.warnFrom = null;
  const ang = rng() * TAU; r.home.set(clamp(r.pos.x + Math.cos(ang) * 150, -WR, WR), 0, clamp(r.pos.z + Math.sin(ang) * 150, -WR, WR));
  P.renown = Math.max(0, P.renown - 1);
  if (n) {
    UI.big('הפסדת בקרב', `${r.name} ${heb(r, 'לקח', 'לקחה')} ${takeText(r, n)}. ${you('נצח', 'נצחי')} ${heb(r, 'אותו', 'אותה')} כדי להחזיר`);
    P.pings.push({ x: r.pos.x, z: r.pos.z, t: 25, rival: true }); AUD.play('hurt', 0.7);
  } else UI.notify(`${r.name} ${heb(r, 'ניצח', 'ניצחה')} ${heb(r, 'ומשאיר', 'ומשאירה')} אותך לנפשך. המעמד שלך ירד`, 'bad');
}
function raidSpot(a) {
  const back = CAM.yaw + Math.PI;
  for (let t = 0; t < 24; t++) {
    const ang = back + rr(-1.2, 1.2), d = rr(26, 38), x = a.pos.x + Math.sin(ang) * d, z = a.pos.z + Math.cos(ang) * d;
    if (!inBounds(x, z)) continue;
    if (P.fish ? waterDepth(x, z) > 1.2 : P.bird || waterDepth(x, z) < 0.3) return { x, z };
  }
  return null;
}
function startRaid() {
  const a = P.a; if (!a || !a.alive || !aliveMates().length || P.coil || HUNT.net || COMBAT.roll) return;
  let r = ANIMALS.find(b => b.alive && !b.isPlayer && b.spId === P.spId && b.sex === a.sex && !b.young && !b.defeated && b.social && !b.isPartner && b.state !== 'fight' && dist2(b.pos, a.pos) < 35);
  if (!r) {
    const s = raidSpot(a); if (!s) return;
    r = new Animal(P.spId, s.x, s.z, { sex: a.sex, scale: rr(1.0, 1.12) });
    Object.assign(r, { name: pick(NAMES[a.sex]), social: true, socialExtra: true, affinity: -30, raider: true });
    if (P.fish) { r.pos.y = a.pos.y; r.ownY = true; } else if (P.bird) { r.pos.y = a.pos.y + 3; r.ownY = true; } else r.ground(1, true);
  }
  r.state = 'fight'; r.foe = a; r.isRival = true; r.home.set(a.pos.x, 0, a.pos.z);
  UI.big(heb(r, 'זכר מתחרה תוקף!', 'נקבה מתחרה תוקפת!'), `${r.name} ${heb(r, 'בא לקחת', 'באה לקחת')} ${takeText(r, aliveMates().length)}. ${you('הבס', 'הביסי')} ${heb(r, 'אותו', 'אותה')}!`);
  AUD.play(P.sp.call || 'growl', 0.8); P.pings.push({ x: r.pos.x, z: r.pos.z, t: 12, rival: true });
}
function socUpdate(dt) {
  bhUpdate(dt); mobUpdate(dt);
  const a = P.a;
  if (G.mode !== 'play' || !a || !a.alive || P.human) return;
  SOC.watchT -= dt;
  if (SOC.watchT <= 0) {
    SOC.watchT = 0.35;
    for (const r of ANIMALS) {
      if (!r.alive || r.isPlayer || r.spId !== P.spId || r.sex !== a.sex || r.young || r.defeated || r.state !== 'fight' || r.foe !== a) continue;
      // dominance fights end at defeat: badly hurt, or running away from the fight
      const d = dist2(r.pos, a.pos); if (d < 8) r.engaged = true;
      if (a.hp < a.maxHp * 0.28 || (r.engaged && d > 40)) { rivalWins(r); break; }
    }
  }
  if (aliveMates().length && !P.sleeping) { SOC.raidT -= dt; if (SOC.raidT <= 0) { SOC.raidT = rr(210, 340); startRaid(); } }
}

// ---------- birds: lock onto prey below and dive ----------
const BH = { cand: null, stoop: null, scanT: 0, mark: null, warn: null, told: false, warnT: -99 };
function bhMarker(key, colr) {
  if (!BH[key]) { BH[key] = makeMarker(); scene.add(BH[key]); }
  const m = BH[key]; for (const c of m.children) c.material.color.set(colr); m.visible = true; return m;
}
function bhHide(key) { if (BH[key]) BH[key].visible = false; }
function bhPlace(m, t, s) {
  const up = t.perched || t.hanging || t.tpl.kind === 'bird' || (t.isPlayer && P.bird);
  const w = waterAt(t.pos.x, t.pos.z), g = Math.max(getH(t.pos.x, t.pos.z), w > -900 ? w : -99);
  m.position.set(t.pos.x, up ? t.pos.y - 0.05 : g + 0.06, t.pos.z); m.scale.setScalar(s); m.rotation.y += 0.03;
  const pulse = 0.75 + 0.25 * Math.sin(G.t * 9);
  m.children.forEach((c, i) => { c.material.opacity = (c.userData.op ?? 0.8) * (i === 1 ? pulse : 1); });
}
function birdPrey(b) { return (P.sp.prey || []).includes(b.spId) || (P.spId === 'harpy' && b.young && b.spId !== 'harpy'); }
function bhScan() {
  const a = P.a, fx = Math.sin(a.yaw), fz = Math.cos(a.yaw); let best = null, bs = -1e9;
  shQuery(a.pos.x, a.pos.z, 50, b => {
    if (!b.alive || b === a || b.isPartner || b.cub || b.pet === a || b.escort || b.carriedBy || !birdPrey(b)) return;
    const dy = a.pos.y - b.pos.y; if (dy < 1.2 || dy > 70) return;
    const h = Math.hypot(b.pos.x - a.pos.x, b.pos.z - a.pos.z); if (h > 46) return;
    const dot = h > 1 ? ((b.pos.x - a.pos.x) * fx + (b.pos.z - a.pos.z) * fz) / h : 1; if (dot < 0.15) return;
    const s = dot * 20 - Math.hypot(h, dy) - (b.maxHp > a.maxHp * 1.5 ? 20 : 0);
    if (s > bs) { bs = s; best = b; }
  });
  return best;
}
function startStoop(t) {
  BH.stoop = { t, time: 0 }; P.atkCD = 0.3; P.landTo = null;
  combatText(P.spId === 'harpy' ? 'צלילה!' : 'צלילה על הטרף', 'good'); AUD.play(P.spId === 'harpy' ? 'screech' : 'flap', 0.7);
}
function stoopMove(dt) {
  const a = P.a, s = BH.stoop, t = s && s.t;
  if (!s) return false;
  s.time += dt;
  if (!t || !t.alive || t.gone || t.carriedBy || s.time > 5) { BH.stoop = null; if (s.time > 5) combatText('הטרף ברח', 'bad'); return false; }
  const vx = t.vel && t.tpl.kind === 'bird' ? t.vel.x : Math.sin(t.yaw) * t.speed, vz = t.vel && t.tpl.kind === 'bird' ? t.vel.z : Math.cos(t.yaw) * t.speed;
  const tx = t.pos.x + vx * 0.25, ty = t.pos.y + t.height * 0.5, tz = t.pos.z + vz * 0.25;
  const dx = tx - a.pos.x, dy = ty - a.pos.y, dz = tz - a.pos.z, d = Math.hypot(dx, dy, dz) || 0.01;
  const spd = Math.min(34, (P.sp.fly || 12) * 1.7 + s.time * 7), st = Math.min(d, spd * dt);
  a.pos.x += dx / d * st; a.pos.y += dy / d * st; a.pos.z += dz / d * st;
  const fl = Math.max(getH(a.pos.x, a.pos.z), waterAt(a.pos.x, a.pos.z)) + 0.3; if (a.pos.y < fl) a.pos.y = fl;
  a.yaw += angDiff(a.yaw, Math.atan2(dx, dz)) * Math.min(1, dt * 9); a.vy = dy / d * spd; a.speed = spd; a.glide = 1; a.bank *= 0.85;
  P.flySpd = Math.max(P.flySpd, P.sp.fly || 12); P.vy = Math.min(0, a.vy);
  if (d < (P.sp.reach || 0.6) + t.rad + 0.7) stoopStrike(t);
  return true;
}
function stoopStrike(t) {
  const a = P.a, harpy = P.spId === 'harpy'; BH.stoop = null;
  hurt(t, (P.sp.dmg || 4) * (harpy ? 2.2 : 2.6) * rr(0.9, 1.1), a);
  a.anim.atk = 0.45; CAM.shake = Math.max(CAM.shake, harpy ? 0.35 : 0.1); AUD.play(harpy ? 'screech' : 'bite', 0.8);
  combatText(harpy ? 'צלילת טפרים!' : 'פגיעה מהאוויר!', 'crit'); PROG.flags.stoop = 1;
  if (!t.alive && (t.sp.food || 10) <= (harpy ? 60 : 8) && t.tpl.kind !== 'fish') { t.carriedBy = a; P.carry = t; PROG.flags.carry = 1; UI.notify(`תפסת ${t.sp.he} בטפרים! לנחות כדי לאכול`, 'good'); }
  else if (t.alive) stagger(t, 0.8, a, 0.5);
  P.vy = 3.5; P.flySpd = (P.sp.fly || 12) * 0.6;
  partnerAssist(t);
}
function bhUpdate(dt) {
  const a = P.a, live = G.mode === 'play' && a && a.alive;
  const can = live && P.bird && P.flying && !P.carry && ((P.sp.prey || []).length > 0);
  if (BH.stoop && BH.stoop.t && BH.stoop.t.alive) { bhPlace(bhMarker('mark', '#ff3b30'), BH.stoop.t, 1.1 + BH.stoop.t.rad); BH.cand = null; }
  else if (can) {
    BH.scanT -= dt; if (BH.scanT <= 0) { BH.scanT = 0.2; BH.cand = bhScan(); }
    if (BH.cand && BH.cand.alive) {
      bhPlace(bhMarker('mark', '#6dff6a'), BH.cand, 0.9 + BH.cand.rad);
      if (!BH.told) { BH.told = true; UI.notify(TOUCH ? 'טרף מסומן בירוק! לחיצה על תקיפה = צלילה עליו' : 'טרף מסומן בירוק! קליק = צלילה עליו', 'good'); }
    } else bhHide('mark');
  } else { BH.cand = null; bhHide('mark'); }
  let diver = null;
  if (live) for (const r of ANIMALS) if (r.alive && r.state === 'dive' && r.target === a) { diver = r; break; }
  if (diver) { bhPlace(bhMarker('warn', '#ff3b30'), a, 0.9 + a.rad * 1.5); if (G.t - BH.warnT > 15) { BH.warnT = G.t; combatText('עיט צולל עליך!', 'bad'); } }
  else bhHide('warn');
}
// ---------- macaws: call the flock to mob a predator ----------
function macawMob() {
  const a = P.a; let th = null, td = 45;
  shQuery(a.pos.x, a.pos.z, 45, (b, d) => { if (b.alive && b !== a && (b.spId === 'harpy' || preys(b, a) || b.sp.ai === 'pred') && d < td) { td = d; th = b; } });
  if (!th) return false;
  let fl = null, fd = 170;
  for (const g of GROUPS) if (g.kind === 'flock' && g.members.length && g.members[0].spId === 'macaw') { const d = Math.hypot(g.pos.x - a.pos.x, g.pos.z - a.pos.z); if (d < fd) { fd = d; fl = g; } }
  if (!fl) return false;
  SOC.mob = { f: fl, th, t: 9 };
  UI.notify(`הלהקה עונה לקריאה ומתנפלת על ה${th.sp.he}!`, 'good'); AUD.play('macaw'); PROG.flags.mob = 1;
  return true;
}
function mobUpdate(dt) {
  const m = SOC.mob; if (!m) return;
  m.t -= dt;
  const th = m.th;
  if (m.t <= 0 || !th.alive || !m.f.members.length || G.mode !== 'play') { SOC.mob = null; return; }
  m.f.members.forEach((b, i) => {
    b.stunT = 0.2;
    const ang = G.t * 2.2 + i * 0.9, r = 2.2 + (i % 3) * 0.8;
    _tmp.set(th.pos.x + Math.cos(ang) * r, th.pos.y + th.height + 1 + Math.sin(G.t * 3 + i) * 0.6, th.pos.z + Math.sin(ang) * r);
    flyToward(b, _tmp, 15, dt, 5); b.pose = 'fly';
  });
  m.f.pos.copy(th.pos);
  if (m.t < 6.5 && !m.fled) {
    m.fled = true;
    if (th.spId === 'harpy') { raptorSoar(th); th.hunger = 0; } else if (th.tpl.kind === 'quad') threatReact(th, P.a, true);
    if (rng() < 0.8) AUD.at('macaw', th.pos, 1);
    UI.notify(`ה${th.sp.he} ${th.sp.he.endsWith('ה') ? 'מוותרת ומסתלקת' : 'מוותר ומסתלק'}!`, 'good');
  }
}

// ---------- the list of saved games ----------
function ago(ts) {
  const m = Math.max(1, Math.round((Date.now() - ts) / 60000));
  return m < 60 ? `לפני ${m} דק׳` : m < 1440 ? `לפני ${Math.round(m / 60)} שע׳` : `לפני ${Math.round(m / 1440)} ימים`;
}
function openSaves() {
  const idx = saveIndex().sort((x, y) => y.at - x.at), el = $('saveList');
  const note = CLOUD.ok ? '☁️ המשחקים נשמרים במכשיר הזה וגם בחשבון שלך, ולכן נפתחים בכל מחשב או טלפון שבו פותחים את המשחק כאן. לאפליקציה לאנדרואיד יש שמירות נפרדות: מעבירים אליה משחק בקוד העברה (📤).'
    : !lsWorks() ? '⚠️ המכשיר הזה לא שומר משחקים, והם נשארים רק עד שסוגרים את הדף. כדי לא לאבד משחק: קוד העברה (📤).'
      : `💾 המשחקים נשמרים רק ${IN_APP ? 'באפליקציה הזו' : 'במכשיר ובדפדפן האלה'}. כדי להמשיך משחק במקום אחר: קוד העברה (📤), ושם "לטעון משחק מקוד".`;
  el.innerHTML = `<p class="svnote">${note}</p>` + (idx.map(e => `<div class="srow"><div><b>${SPECIES[e.sp] ? SPECIES[e.sp].he : e.sp}</b> ${e.sp === 'hunter' ? (e.sex === 'f' ? 'אישה' : 'גבר') : e.sex === 'f' ? 'נקבה' : 'זכר'}${e.vn ? `<span class="vn" style="display:inline">🏘️ ${e.vn}${e.pop ? ` · ${e.pop} אנשים` : ''}</span>` : ''}<span>יום ${e.day} · רמה ${e.lvl || 1} · ${ago(e.at)}${CLOUD.ok && (e.cl || 0) >= e.at ? ' · ☁️ בחשבון' : ''}</span></div>` +
    `<div class="sbtns"><button class="btn pri" data-go="${e.id}">להמשיך</button><button class="btn" data-x="${e.id}" title="קוד העברה" aria-label="קוד העברה">📤</button><button class="btn" data-del="${e.id}">למחוק</button></div></div>`).join('') || '<p>אין משחקים שמורים</p>');
  $('saves').hidden = false;
}
function savesClick(e) {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.go) { AUD.init(); if (TOUCH) tryFullscreen(); continueGame(b.dataset.go); return; }
  if (b.dataset.x) { AUD.play('ui'); xferOpen(b.dataset.x); return; }
  if (b.dataset.del) {
    if (!b.dataset.sure) { b.dataset.sure = '1'; b.textContent = 'בטוח?'; b.classList.add('pri'); return; }
    deleteSlot(b.dataset.del); syncContinue(); openSaves();
  }
}
