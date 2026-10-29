// ---------- the people of the Old World: names, clothes, rulers ----------
const CIVNAMES = {
  knights: { m: ['ארתור', 'ריצ׳רד', 'ויליאם', 'הנרי', 'אדוארד', 'רולנד', 'לנסלוט', 'גאווין', 'פרסיבל', 'טריסטן', 'הוגו', 'ז׳ופרואה', 'בלדווין', 'אוליבר'], f: ['אלינור', 'מטילדה', 'איזבלה', 'גווינבר', 'בלאנש', 'מרגרט', 'ז׳אן', 'סיביל', 'אגנס', 'אליס'] },
  vikings: { m: ['רגנאר', 'ביורן', 'אולף', 'הרלד', 'לייף', 'אריק', 'סיגורד', 'איוואר', 'טורסטיין', 'גונאר'], f: ['לגרטה', 'אסטריד', 'פרייה', 'סיגריד', 'הלגה', 'אינגריד', 'גודרון', 'תורה'] },
  mongols: { m: ['תמוג׳ין', 'באטו', 'קובלאי', 'אוגדיי', 'מונקה', 'סובוטאי', 'ג׳בה', 'חולגו'], f: ['בורטה', 'חוטולון', 'סורגחתני', 'אולון', 'טורגנה', 'אלאחאי'] },
  china: { m: ['לי', 'ואנג', 'ז׳אנג', 'ליו', 'צ׳ן', 'יאנג', 'הואנג', 'ג׳ואו', 'וו', 'סון'], f: ['מיי', 'לינג', 'שיאו', 'יואה', 'פנג', 'הואה', 'צ׳ון', 'יון'] },
  japan: { m: ['נובונאגה', 'הידיושי', 'טאקדה', 'קנשין', 'מוסאשי', 'יוקימורה', 'מסאמונה', 'הנזו', 'קנג׳י', 'טארו'], f: ['הנה', 'יוקי', 'אאקו', 'סאקורה', 'טומואה', 'קיקו', 'נאמי', 'אמי'] },
  arabs: { m: ['סלאח א-דין', 'הארון', 'סולימאן', 'עומר', 'יוסף', 'חסן', 'עלי', 'כרים', 'זיאד', 'טארק'], f: ['פאטמה', 'ליילה', 'זיינב', 'אמירה', 'נור', 'יסמין', 'שהרזאד', 'סלמה'] },
  egypt: { m: ['רעמסס', 'תחותמס', 'אחמס', 'סתי', 'חופו', 'מנפתח', 'פתחמס', 'נכתנבו'], f: ['נפרטיטי', 'חתשפסות', 'נפרתרי', 'מריתאמון', 'איסת', 'תיא'] },
  mali: { m: ['מוסא', 'סונדיאטה', 'אבו בכר', 'מגהן', 'סקורה', 'וולי', 'סומאורו', 'בכרי'], f: ['נאנה', 'קדיג׳ה', 'ססומה', 'פאטו', 'אמינטה', 'מרים'] },
  india: { m: ['אשוקה', 'אכבר', 'ראג׳ה', 'וירה', 'ארג׳ון', 'ראווי', 'שיווג׳י', 'פרתווי'], f: ['סיטה', 'פריה', 'לקשמי', 'מירה', 'פדמיני', 'אנג׳לי', 'דורגה'] },
  bandit: { m: ['רוקו', 'סקאר', 'הזאב השחור', 'בלאק', 'גרים', 'מוזס', 'טאק', 'וולף'], f: ['רייבן', 'ויקסן', 'שאדו'] }
};
function civName(c, sex) {
  const L = (CIVNAMES[c.bandit ? 'bandit' : c.civ] || CIVNAMES.knights)[sex] || CIVNAMES.knights.m;
  const used = new Set(); for (const h of c.hunters || []) if (h.alive) used.add(h.name);
  const free = L.filter(n => !used.has(n)); return free.length ? pick(free) : pick(L);
}
// the key of a people's clothes (the two kingdoms of Europe wear their own colours)
function civKey(c) { return c.bandit ? 'cv_bandit' : c.civ === 'knights' ? (c.set && c.set.realm === 'ממלכת הנשר' ? 'cv_eagle' : 'cv_lion') : 'cv_' + c.civ; }
function tribeKeyOf(c) { return !c || c.own ? 'own' : c.civ || c.bandit ? civKey(c) : c.key ? c.key : c.deep ? 'forest' : c.tribe === 'שבט הדגים' ? 'fish' : 'river'; }
Object.assign(TRIBEC, { cv_lion: '#c0392b', cv_eagle: '#2f5fb0', cv_vikings: '#4a6a8a', cv_mongols: '#2a6a8a', cv_china: '#c8202a', cv_japan: '#2a2a2a', cv_arabs: '#1f7a4a', cv_egypt: '#2a62b8', cv_mali: '#d8a020', cv_india: '#e07a20', cv_bandit: '#3a3430' });
Object.assign(LAND_MOUNT, { 5: 'horse', 6: 'horse', 7: 'horse', 8: 'horse', 9: 'horse', 10: 'camel', 11: 'horse', 12: 'horse' });
Object.assign(LIVESTOCK, { 10: 'camel' });
const CIVOFKEY = k => k === 'cv_lion' || k === 'cv_eagle' ? 'knights' : k === 'cv_bandit' ? 'bandit' : k.slice(3);
// a word for one of them: the ruler's title, the people's warriors
function vxWord(h) {
  const c = h.camp;
  if (c && (c.civ || c.bandit)) {
    const C = CIVS[c.civ];
    if (h.elite || h.cls === 'chief') return c.bandit ? heb(h, 'ראש השודדים', 'ראשת השודדים') : c.cap ? (C ? C.ruler[h.sex === 'f' ? 1 : 0] : 'שליט') : heb(h, 'ראש הכפר', 'ראשת הכפר');
    if (h.cls === 'warrior') return c.bandit ? heb(h, 'שודד', 'שודדת') : C ? C.war[h.sex === 'f' ? 1 : 0] : clsWord(h);
    const jw = jobWord(h); if (jw) return jw;
  }
  if (h.elite || h.cls === 'chief') return heb(h, 'ראש השבט', 'ראשת השבט'); if (h.cls) return clsWord(h); return heb(h, 'צייד', 'ציידת');
}
const KIND_N = { castle: ['טירה', 'הטירה'], city: ['עיר', 'העיר'], town: ['עיירה', 'העיירה'], village: ['כפר', 'הכפר'], camp: ['מחנה', 'המחנה'], bandits: ['מחנה שודדים', 'מחנה השודדים'] };
const campKindName = c => c && c.kind && KIND_N[c.kind] ? KIND_N[c.kind][0] : LVLN[(c && c.lvl) || 0];
const campKindDef = c => c && c.kind && KIND_N[c.kind] ? KIND_N[c.kind][1] : LVLD[(c && c.lvl) || 0] || 'המחנה';

// ---------- the people of a settlement ----------
const CIV_PLAN = {
  castle: ['chief', 'warrior', 'warrior', 'warrior', 'warrior', 'hunter', 'hunter', 'builder', 'gatherer', 'gatherer', 'gatherer', 'child', 'child', 'elder'],
  city: ['chief', 'warrior', 'warrior', 'warrior', 'hunter', 'hunter', 'builder', 'builder', 'gatherer', 'gatherer', 'gatherer', 'gatherer', 'child', 'child', 'elder'],
  town: ['chief', 'warrior', 'warrior', 'warrior', 'hunter', 'builder', 'gatherer', 'gatherer', 'gatherer', 'child', 'child'],
  village: ['chief', 'warrior', 'warrior', 'hunter', 'builder', 'gatherer', 'gatherer', 'child', 'elder'],
  camp: ['chief', 'warrior', 'warrior', 'warrior', 'hunter', 'hunter', 'gatherer', 'gatherer', 'child', 'child'],
  bandits: ['chief', 'warrior', 'warrior', 'warrior', 'hunter', 'hunter']
};
function civPopulate(c, i) {
  if (c.dormant) return;
  // a gang that was beaten not long ago (in the saved game): the camp stays empty for a few days
  if (c.bandit) { const d0 = PROG.flags['bg' + c.bk]; if (d0 != null && G.day - d0 < 3) { c.clearDay = d0; c.looted = !!PROG.flags['bl' + c.bk]; return; } }
  let wk = 0; const slots = {};
  for (const e of (CIV_PLAN[c.kind] || CIV_PLAN.village).concat(c.bandit ? [] : CIV_JOBS[c.kind] || [])) {
    const [cls, job] = e.split(':');
    const sex = job ? jobSex(job) : cls === 'gatherer' ? 'f' : cls === 'child' ? (rng() < 0.5 ? 'm' : 'f') : cls === 'chief' && rng() < (c.bandit ? 0.15 : 0.2) ? 'f' : (cls === 'hunter' || cls === 'warrior') && !c.bandit && rng() < 0.12 ? 'f' : 'm';
    const h = spawnVillager(c, cls, sex, false, job); if (!h) continue;
    if (job) h.slotK = slots[job] = (slots[job] ?? -1) + 1;
    if (cls === 'chief') civRuler(c, h);
    if (cls === 'warrior' && !c.bandit) { h.job = wk < 2 ? 'guard' : 'patrol'; h.slotK = wk++; }
    if (cls === 'warrior' && (c.civ === 'knights' || c.civ === 'japan' || c.civ === 'china' || c.civ === 'arabs')) h.wpn = 'sword';
  }
  // the horsemen's horses (and camels in the desert)
  if (c.civ === 'knights' && c.kind === 'castle') campHorseSpawn(c, 4);
  else if (c.civ === 'mongols') campHorseSpawn(c, 5);
  else if (c.civ === 'arabs' && c.cap) campHorseSpawn(c, 3);
}
// the ruler: a title before the name, stronger, and stays near the heart of the place
function civRuler(c, h) {
  const C = CIVS[c.civ];
  // no two rulers of one people share a name
  if (!c.bandit) {
    const taken = new Set(); for (const q of HUNT.camps) if (q !== c && q.civ === c.civ) for (const o of q.hunters) if (o.alive && o.ruler && o.baseName) taken.add(o.baseName);
    const L = (CIVNAMES[c.civ] || CIVNAMES.knights)[h.sex] || [], free = L.filter(n => !taken.has(n) && !c.hunters.some(o => o !== h && o.alive && o.name === n));
    if (taken.has(h.name) && free.length) h.name = pick(free);
    h.baseName = h.name;
  }
  if (c.bandit) h.name = 'ראש השודדים ' + h.name;
  else if (c.cap && C) { const T = C.ruler[h.sex === 'f' ? 1 : 0]; h.name = `${T === 'פרעה' || T === 'מנסה' ? '' : 'ה'}${T} ${h.name}`; }
  h.maxHp *= c.cap ? 1.35 : 1.1; h.hp = h.maxHp; h.ruler = true;
}
// ---------- the Old World wakes when the hunter comes close (until then nobody there needs to move) ----------
function owWakeStep() {
  const i = HUNT.camps.findIndex(c => c.dormant);
  if (i < 0) { OWS.dormant = false; owFaunaWake(); return; }
  const c = HUNT.camps[i]; c.dormant = false; tribePopulate(c, i); if (!c.bandit) campCattle(c);
  warEnsure(); if (WAR.food[i] == null) WAR.food[i] = 30 + (c.lvl || 0) * 15;
}
