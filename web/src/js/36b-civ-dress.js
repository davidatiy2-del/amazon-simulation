// ================= THE PEOPLES' LOOKS: faces and hair of every land, and clothes by role =================
// Each people has its range of skin, hair and eyes, everyday and fine colours. A template (a shape) is built for each
// role, sex and one of three variations (hair style, beard, headwear); then each person wears their own colours over it
// (personTint), so no two people of a town look the same.
const LOOK = {
  knights: { skin: ['#f3d6c0', '#ecc9ac', '#e3b998', '#f7dfcf', '#dcae8a', '#e8bf9f'], hair: ['#e3c88e', '#cfa766', '#9a6c3e', '#6a4428', '#3a2416', '#a8562e', '#2a1a10', '#b88a52'], eye: ['#4a6e92', '#5c7c5a', '#6a4a2a', '#7a8c9c', '#3e5e80'],
    cloth: ['#7a5a3a', '#5a6a3a', '#6a4a5a', '#8a7a5a', '#4a5a7a', '#7a3a2a', '#3a5a3a', '#a08a5a', '#8a2a2a', '#2a4a7a', '#a8783a', '#6a3a6a', '#3a6a5a', '#9a8a6a', '#b85a3a', '#4a6a8a'], fine: ['#8a1e22', '#1e3a7a', '#2a5a2a', '#6a1e5a', '#b8902a'], light: ['#efe8da', '#e6dcc4', '#f2efe6', '#dcd2bc'] },
  vikings: { skin: ['#f6dccb', '#f0d0b8', '#e8c4a8', '#f9e4d6'], hair: ['#e8d09a', '#d8b878', '#c09050', '#a0602e', '#8a4a22', '#6a4a2a', '#d0c0a0'], eye: ['#5a82a8', '#6a8aa0', '#4a6a5a', '#7a9ab0'],
    cloth: ['#5a6a7a', '#7a5a3a', '#6a7a5a', '#8a3a2a', '#4a5a4a', '#9a8a6a', '#3a4a6a', '#6a5a4a', '#2a4a7a', '#8a6a2a', '#5a3a5a', '#3a6a5a'], fine: ['#8a2a22', '#2a4a7a', '#2a6a4a', '#6a2a6a'], light: ['#e6dcc4', '#d8ccb0', '#efe8da'] },
  mongols: { skin: ['#e2bb92', '#d6ad84', '#c99c72', '#dcb48a'], hair: ['#1a1410', '#221a14', '#2a2018'], eye: ['#2a1a10', '#3a2618'],
    cloth: ['#2a5a8a', '#8a2a2a', '#3a6a4a', '#6a3a7a', '#a86a2a', '#2a4a6a', '#7a5a2a', '#4a7a8a'], fine: ['#d8a020', '#2a5aa8', '#a82a2a'], light: ['#e8dcc0', '#d8c8a0'] },
  china: { skin: ['#f0d4b2', '#e8c8a2', '#dcbc94', '#f2dcc0'], hair: ['#141010', '#1c1612', '#221a14'], eye: ['#2a1a10', '#3a2416'],
    cloth: ['#2a4a7a', '#5a6a7a', '#3a5a4a', '#4a3a5a', '#7a6a5a', '#2a3a4a', '#6a2a2a', '#8a8a7a'], fine: ['#c8202a', '#e8b830', '#2a6a8a', '#6a2a6a'], light: ['#e8e0d0', '#d8d0c0'] },
  japan: { skin: ['#f2d8bc', '#ead0b0', '#e0c4a2', '#f4e0c8'], hair: ['#141010', '#1c1612'], eye: ['#2a1a10', '#3a2416'],
    cloth: ['#3a3a5a', '#5a3a3a', '#3a4a3a', '#2a3a5a', '#6a5a4a', '#4a4a4a', '#5a4a6a'], fine: ['#c84a6a', '#4a6aa8', '#e0a040', '#a82a2a', '#2a6a5a', '#d8a8c0'], light: ['#efe8da', '#e8e0d0'] },
  arabs: { skin: ['#d4a67c', '#c8986e', '#bc8a62', '#ae7c56', '#dcb08a'], hair: ['#1a1210', '#241812', '#2e2016'], eye: ['#2a1a10', '#3a2618', '#4a3a20'],
    cloth: ['#efe8da', '#e8e0c8', '#d8cbb0', '#f2efe6', '#c8b898'], dark: ['#2a3a6a', '#6a2a3a', '#3a3a3a', '#1e2a3a', '#4a2a4a', '#2a4a4a'], fine: ['#1f7a4a', '#c8302a', '#2a4a8a', '#d8a020'], light: ['#f2efe6', '#efe8da'] },
  egypt: { skin: ['#b8865e', '#a87850', '#c0906a', '#9a6a44', '#c89c74'], hair: ['#141010', '#1a1210'], eye: ['#2a1a10'],
    cloth: ['#f2efe6', '#efe8d8', '#e8e0cc'], fine: ['#2a62b8', '#d8a020', '#c8302a', '#2a8a6a'], light: ['#f2efe6', '#efe8d8'] },
  mali: { skin: ['#5a3a26', '#4e3220', '#664430', '#3e2818', '#704a32'], hair: ['#141010', '#1a1410'], eye: ['#1a1008'],
    cloth: ['#2a3a8a', '#d8a020', '#a8302a', '#2a7a5a', '#efe8da', '#6a3a7a', '#e07a20', '#1e2a5a'], fine: ['#e8b830', '#2a3a8a', '#efe8da'], light: ['#efe8da', '#f2efe6'] },
  india: { skin: ['#a8784e', '#9a6c44', '#b48456', '#8a5a3a', '#c09060'], hair: ['#141010', '#1a1410', '#221812'], eye: ['#2a1a10', '#3a2416'],
    cloth: ['#efe8da', '#e8b830', '#c8302a', '#2a8a8a', '#e0407a', '#e8a020', '#6a2a8a', '#2a6a3a'], fine: ['#e8a020', '#c8302a', '#e0407a', '#2a8a8a'], light: ['#efe8da', '#f2efe6'] },
  bandit: { skin: ['#e8c4a8', '#c8986e', '#d4a67c', '#b8865e', '#ecc9ac'], hair: ['#2a1a10', '#3a2a1a', '#1a1410', '#5a3a22', '#6a4428'], eye: ['#3a2a1a', '#4a5a6a'],
    cloth: ['#3a3430', '#4a3a2a', '#2e3236', '#3a3a2a', '#4a2a22', '#3a4030'], fine: ['#3a1a14', '#2a2a2a'], light: ['#8a7a62'] }
};
const GRAYH = ['#b8b4ae', '#d8d4ce', '#9a9690', '#e6e2dc'];
// which of the three shapes a newcomer takes, and their own colours (a jungle tribe's people differ in their skin)
const civOf = c => c && (c.civ || (c.bandit ? 'bandit' : null));
function lookSeed() { return Math.floor(rng() * 2147483646) + 1; }
function civLook(h, c, seed) {
  const civ = civOf(c); seed = seed || lookSeed();
  if (civ) h.pal = civPal(civ, h.cls, h.sex === 'f', seed, TRIBEC[tribeKeyOf(c)]);
  else if (c && !c.own) { const R = mulberry32(seed); h.pal = { 1: col(SKIN[Math.floor(R() * SKIN.length)]) }; }
  h._tint = null;
}
const npcName = (c, sex) => civOf(c) ? civName(c, sex) : tribeName(sex);
// a person's own colours: 1 skin, 2 hair, 3 the shirt, 4 the legs or skirt, 5 the headwear, 6 the robe or cloak
function civPal(civ, cls, f, seed, acc) {
  const L = LOOK[civ] || LOOK.knights, R = mulberry32(seed | 0), P = a => a[Math.floor(R() * a.length)], c = col;
  const old = cls === 'elder' || (cls === 'chief' && R() < 0.35), ruler = cls === 'chief', war = cls === 'warrior';
  const pal = { 1: c(P(L.skin)), 2: c(old && R() < 0.85 ? P(GRAYH) : P(L.hair)) };
  const cloth = P(L.cloth), cloth2 = P(L.cloth), fine = P(L.fine), light = P(L.light);
  pal[3] = c(ruler ? fine : cloth); pal[4] = c(cloth2); pal[5] = c(ruler ? fine : P(L.cloth.concat(L.light))); pal[6] = c(ruler ? fine : cloth);
  // each people's habits
  if (civ === 'knights' || civ === 'vikings') { pal[4] = c(P(['#4a3a2a', '#5a4a3a', '#3a3a3a', '#4a4a3a', '#5a5040', cloth2])); if (f) pal[5] = c(R() < 0.7 ? light : cloth2); }
  if (civ === 'mongols') { pal[3] = pal[6]; pal[4] = c(P(['#3a3228', '#4a3a2a', '#2a2a2a'])); }
  if (civ === 'china' || civ === 'japan') { pal[4] = c(P(['#2a2a30', '#3a3a40', '#4a4a4a', cloth2])); if (f) pal[6] = c(P(L.fine.concat(L.cloth))); }
  if (civ === 'arabs') { pal[6] = c(f ? P(L.dark) : P(L.cloth)); pal[3] = pal[6]; pal[5] = c(f ? P(L.dark.concat(L.fine)) : P(['#f2efe6', '#efe8da', '#e8d8a8', '#c8302a', '#2a2a2a'])); }
  if (civ === 'egypt') { pal[4] = c(light); pal[6] = c(light); pal[5] = c(P(['#efe8d8', '#2a62b8', '#e8d8b0'])); }
  if (civ === 'mali') { pal[5] = c(P(L.cloth.concat(L.fine))); }
  if (civ === 'india') { pal[4] = c(f ? P(L.cloth) : light); pal[5] = c(P(['#e8a020', '#c8302a', '#efe8da', '#e0407a', '#2a8a8a'])); if (f) pal[6] = c(P(['#e0407a', '#e8a020', '#2a8a8a', '#c8302a', '#6a2a8a', '#e8b830'])); }
  // the soldiers wear their lord's colours
  if (war && acc) { pal[6] = c(acc); if (civ === 'knights') pal[3] = c('#8d959c'); }
  if (ruler && acc && R() < 0.5) pal[6] = c(acc);
  if (civ === 'japan' && (war || ruler) && !f) pal[3] = c(P(['#2a2a3a', '#3a2a2a', '#2a3a2a']));
  return pal;
}
// ---------- clothes: each people its own, by role, in three variations ----------
const DRESS = { job: null };
function civDress(o, cls, tk, f, h, v) {
  // a trade of the town is dressed as the people it comes from, then gets its own gear (jobGear)
  const J = TOWNJOBS.includes(cls) ? cls : null;
  if (J) cls = J === 'priest' ? 'elder' : J === 'fisher' || J === 'herder' ? 'hunter' : J === 'water' || (J === 'vendor' && f) ? 'gatherer' : 'builder';
  const civ = CIVOFKEY(tk), C = o.c, acc = TRIBEC[tk] || '#c0392b', kid = cls === 'child', L = LOOK[civ] || LOOK.knights, V = v || 0;
  const W = (...a) => a[V % a.length];
  Object.assign(o, { quiver: false, bracers: false, vest: false, scarf: false, hat: 'none', noRope: true, noKnife: true, noPouch: true, bandolier: false, pack: false, net: false, knees: false, sleeves: 'long', beard: 'none', sandals: false });
  // the shape's own colours: middle tones, each person's palette moves them
  Object.assign(C, { skin: L.skin[1], hair: L.hair.length > 3 ? '#7a5a3a' : L.hair[0], shirt: '#8a7a62', pants: '#5a4a3a', boot: '#3a2a1c', belt: '#4a3524', hat: '#8a7a62', robe: '#7a6a5a' });
  o.eye = L.eye[(h + V) % L.eye.length];
  const ex = [], X = fn => ex.push(fn), old = cls === 'elder';
  if (!(cls === 'warrior' || cls === 'hunter') || civ === 'knights' || civ === 'japan' || civ === 'china' || civ === 'arabs') o.noSpear = o.noSpear || cls !== 'warrior';
  if (civ === 'knights') {
    o.hair = f ? W('long', 'braids', 'bun') : W('short', 'short', 'mane'); o.beard = f || kid ? 'none' : old ? 'long' : ['full', 'none', 'stubble', 'goatee'][(h + V) % 4];
    if (cls === 'warrior') { roleDress(o, 'knight', tk, f, V); return; }
    if (cls === 'chief') { o.noSpear = true; X((R, Cc, MK) => { dGown(R, MK, Cc.robe, { top: 1.42, f: f ? 0.93 : 1, flare: 0.3 }); dFurCollar(R, MK, '#f2efe6'); civCrown(R, MK, '#e8b830'); if (!f) dScabbard(R, MK, '#5a3a22'); dScepter(R, MK); }); o.beard = f ? 'none' : W('full', 'long', 'full'); }
    else if (cls === 'hunter') X((R, Cc, MK) => { civHood(R, MK, Cc.hat); dTunic(R, MK, Cc.shirt, 0.66); dBelt(R, MK, '#4a3524'); dHorn(R, MK); });
    else if (cls === 'builder') X((R, Cc, MK) => { dTunic(R, MK, Cc.shirt, 0.7); dApron(R, MK, '#6a4a2c', 0.6); dCoif(R, MK, Cc.hat); dTool(R, MK, 'hammer'); });
    else if (cls === 'gatherer' || (old && f)) X((R, Cc, MK) => { dGown(R, MK, Cc.robe, { top: 1.4, f: 0.93 }); dApron(R, MK, '#efe8da', 0.72); if (V < 2) civHeadcloth(R, MK, Cc.hat); dBasket(R, MK, V === 1 ? 'head' : 'hand'); });
    else if (old) X((R, Cc, MK) => { dGown(R, MK, Cc.robe, { top: 1.44, flare: 0.28 }); dBelt(R, MK, '#c8b07a', true); dStaff(R, MK); });
    else if (kid) X((R, Cc, MK) => { if (f) dGown(R, MK, Cc.robe, { top: 1.4, f: 0.93, bot: 0.4, flare: 0.22 }); else dTunic(R, MK, Cc.shirt, 0.72); });
    if (old && !f) o.hair = 'bald';
  } else if (civ === 'vikings') {
    o.hair = f ? W('braids', 'long', 'ponytail') : W('mane', 'short', 'long'); o.beard = f || kid ? 'none' : old ? 'long' : W('braided', 'full', 'long');
    if (cls === 'warrior' || cls === 'chief') X((R, Cc, MK) => { dTunic(R, MK, Cc.shirt, 0.64); dBelt(R, MK, '#3a2a1c'); dLegWraps(R, MK, '#8a7a62'); if (cls === 'chief' || V === 0) { civCape(R, MK, Cc.robe, true); } if (cls === 'chief' ? V === 1 : V < 2) dVikingHelm(R, MK, V === 0 && cls !== 'chief'); dRoundShield(R, MK, cls === 'chief' ? '#a8302a' : ['#a8302a', '#2a5a8a', '#d8a020'][h % 3], '#efe8da', 'back'); });
    else if (f && !kid) X((R, Cc, MK) => { dGown(R, MK, Cc.shirt, { top: 1.42, f: 0.93 }); dGown(R, MK, Cc.robe, { top: 1.36, f: 0.93, bot: 0.3, flare: 0.25, over: 0.012 }); dBrooches(R, MK); if (V === 1) civHeadcloth(R, MK, Cc.hat); if (cls === 'gatherer') dBasket(R, MK, 'hand'); });
    else X((R, Cc, MK) => { dTunic(R, MK, Cc.shirt, kid ? 0.72 : 0.64); dBelt(R, MK, '#3a2a1c'); if (!kid) dLegWraps(R, MK, '#8a7a62'); if (cls === 'hunter') civFurHat(R, MK, Cc.hat); if (cls === 'builder') dTool(R, MK, 'axe'); if (old) { civCape(R, MK, Cc.robe, true); dStaff(R, MK); } });
  } else if (civ === 'mongols') {
    o.hair = f ? W('braids', 'braids', 'long') : W('short', 'braids', 'short'); o.beard = f || kid ? 'none' : W('droop', 'none', 'mustache'); C.boot = '#6a3a24';
    X((R, Cc, MK) => {
      dGown(R, MK, Cc.robe, { top: 1.42, f: f ? 0.93 : 1, bot: kid ? 0.45 : 0.4, flare: 0.25 }); dBelt(R, MK, cls === 'chief' ? '#e8b830' : '#d8a020', true);
      if (cls === 'warrior') { civArmor(R, MK, '#6a4a2a', '#3a2a1c'); dSpikeHelm(R, MK, '#8a8a8a'); dQuiver(R, MK); }
      else if (cls === 'chief' && f) dTallHat(R, MK, '#a82a2a');
      else if (!kid) civFurHat(R, MK, cls === 'chief' ? '#d8a020' : Cc.hat);
      if (cls === 'hunter') dQuiver(R, MK);
    });
  } else if (civ === 'china') {
    o.hair = f ? W('bun', 'bun', 'long') : W('bun', 'bun', 'short'); o.beard = f || kid ? 'none' : old ? 'long' : W('none', 'goatee', 'mustache'); C.boot = '#2a2a2a';
    if (cls === 'chief') X((R, Cc, MK) => { dGown(R, MK, '#e8b830', { top: 1.44, f: f ? 0.93 : 1, flare: 0.3 }); dBelt(R, MK, '#c8202a', true); dWideSleeves(R, MK, '#e8b830'); if (f) dHairPins(R, MK, '#e8b830'); else civFlatHat(R, MK, '#1a1a1a'); });
    else if (cls === 'warrior') X((R, Cc, MK) => { dTunic(R, MK, Cc.robe, 0.62); civArmor(R, MK, '#8a2a22', '#3a3a3a'); civHelmet(R, MK, '#5a5a5a', false, '#c8202a'); dScabbard(R, MK, '#3a2a1c'); });
    else if (f && !kid) X((R, Cc, MK) => { dGown(R, MK, Cc.robe, { top: 1.42, f: 0.93 }); dBelt(R, MK, Cc.pants, true, 0.08); dWideSleeves(R, MK, Cc.robe); if (V < 2) dHairPins(R, MK, '#d8a020'); else civConeHat(R, MK, '#d8c07a'); if (cls === 'gatherer') dBasket(R, MK, 'hand'); });
    else if (old) X((R, Cc, MK) => { dGown(R, MK, Cc.robe, { top: 1.44, flare: 0.28 }); dBelt(R, MK, '#2a2a2a', true); dWideSleeves(R, MK, Cc.robe); dFutou(R, MK); dStaff(R, MK); });
    else X((R, Cc, MK) => { dTunic(R, MK, Cc.shirt, 0.7); dBelt(R, MK, '#2a2a2a'); if (!kid) { if (V < 2) civConeHat(R, MK, '#d8c07a'); else dCoif(R, MK, '#2a2a2a'); } if (cls === 'builder') dTool(R, MK, 'hoe'); });
  } else if (civ === 'japan') {
    o.hair = f ? W('bun', 'bun', 'long') : kid ? 'short' : W('topknot', 'topknot', 'short'); o.beard = f || kid ? 'none' : old ? 'goatee' : W('none', 'none', 'goatee'); o.sandals = true; C.boot = '#efe8da';
    if (cls === 'warrior' || cls === 'chief') {
      if (f && cls === 'chief') X((R, Cc, MK) => { dGown(R, MK, Cc.robe, { top: 1.42, f: 0.93, kimono: true }); dObi(R, MK, '#e8b830'); dWideSleeves(R, MK, Cc.robe); dHairPins(R, MK, '#e8b830'); });
      else X((R, Cc, MK) => { dTunic(R, MK, Cc.shirt, 0.62); civArmor(R, MK, cls === 'chief' ? '#202020' : Cc.robe, '#202020'); if (cls === 'chief' || V < 2) civKabuto(R, MK, cls === 'chief' ? '#d8a020' : '#2a2a2a'); else dHeadband(R, MK, '#efe8da'); dKatana(R, MK); });
    } else if (f && !kid) X((R, Cc, MK) => { dGown(R, MK, Cc.robe, { top: 1.42, f: 0.93, kimono: true }); dObi(R, MK, Cc.pants); dWideSleeves(R, MK, Cc.robe); if (V < 2) dHairPins(R, MK, '#c8302a'); else civConeHat(R, MK, '#c8b070'); if (cls === 'gatherer') dBasket(R, MK, 'hand'); });
    else X((R, Cc, MK) => { dGown(R, MK, Cc.robe, { top: 1.42, bot: kid ? 0.5 : 0.56, flare: 0.22, kimono: true }); dObi(R, MK, '#2a2a2a', 0.06); if (!kid) { if (V < 2) civConeHat(R, MK, '#c8b070'); else dHeadband(R, MK, '#efe8da'); } if (old) dStaff(R, MK); if (cls === 'builder') dTool(R, MK, 'hammer'); });
  } else if (civ === 'arabs') {
    o.hair = f ? 'long' : 'short'; o.beard = f || kid ? 'none' : old ? 'long' : W('full', 'full', 'goatee'); o.sandals = true; C.boot = '#8a6a3a';
    if (f && !kid) X((R, Cc, MK) => { dGown(R, MK, Cc.robe, { top: 1.44, f: 0.93, flare: 0.28 }); civHeadcloth(R, MK, Cc.hat, true); if (cls === 'gatherer') dJar(R, MK, V === 2 ? 'head' : 'hand'); });
    else X((R, Cc, MK) => {
      dGown(R, MK, Cc.robe, { top: 1.44, bot: kid ? 0.3 : 0.08, flare: 0.27 });
      if (cls === 'warrior') { dMail(R, MK); dTurbanHelm(R, MK); civShield(R, MK, '#8a6a3a', true); dScabbard(R, MK, '#5a3a22', true); }
      else if (cls === 'chief') { dBisht(R, MK, '#2a2420', '#d8a020'); civTurban(R, MK, '#f2efe6', true); dScabbard(R, MK, '#7a5a2a', true); }
      else if (!kid) { if (V === 1) dKeffiyeh(R, MK, Cc.hat); else civTurban(R, MK, Cc.hat, false); if (old) { dBisht(R, MK, '#3a2a20', '#8a6a3a'); dStaff(R, MK); } }
    });
  } else if (civ === 'egypt') {
    o.hair = f ? W('bob', 'long', 'bob') : W('shaved', 'bob', 'shaved'); o.beard = 'none'; o.sandals = true; o.kohl = true; C.boot = '#8a6a3a'; C.hair = '#141010';
    if (f && !kid) { C.shirt = C.skin; o.sleeves = false; X((R, Cc, MK) => { dGown(R, MK, Cc.robe, { top: 1.38, f: 0.93, flare: 0.2 }); civCollar(R, MK, cls === 'chief' ? '#e8b830' : '#2a62b8'); dWideCollar(R, MK); if (cls === 'chief') civCrown(R, MK, '#e8b830'); else dHeadband(R, MK, '#2a62b8'); if (cls === 'gatherer') dJar(R, MK, V === 0 ? 'head' : 'hand'); }); }
    else { C.shirt = C.skin; C.pants = C.skin; o.sleeves = false; X((R, Cc, MK) => { dKilt(R, MK, Cc.robe); if (!kid) dWideCollar(R, MK); if (cls === 'chief') { civNemes(R, MK); dFalseBeard(R, MK); dCrook(R, MK); } else if (cls === 'warrior') { civHeadcloth(R, MK, '#e8d8b0'); dHideShield(R, MK); } else if (!kid && V === 0) civHeadcloth(R, MK, Cc.hat); if (old) dStaff(R, MK); }); }
  } else if (civ === 'mali') {
    o.hair = f ? W('braids', 'curly', 'braids') : W('curly', 'shaved', 'curly'); o.beard = f || kid ? 'none' : old ? 'full' : W('none', 'goatee', 'stubble'); o.sandals = true; C.boot = '#6a4a2a'; C.hair = '#141010';
    if (f && !kid) { o.sleeves = true; X((R, Cc, MK) => { dGown(R, MK, Cc.pants, { top: 1.02, f: 0.93, flare: 0.22 }); if (V !== 1) dGele(R, MK, Cc.hat); dEarrings(R, MK, '#e8b830'); if (cls === 'gatherer') dBasket(R, MK, 'head'); else if (cls === 'chief') civCrown(R, MK, '#e8b830'); }); }
    else X((R, Cc, MK) => {
      if (cls === 'warrior') { dTunic(R, MK, Cc.shirt, 0.66); dBelt(R, MK, '#5a3a22'); dHeadwrap(R, MK, Cc.hat); civShield(R, MK, '#7a5a3a', false); }
      else { dGown(R, MK, cls === 'chief' ? '#e8b830' : Cc.robe, { top: 1.44, bot: kid ? 0.35 : 0.08, flare: 0.33 }); if (cls === 'chief') { civCrown(R, MK, '#e8b830'); dStaff(R, MK, '#e8b830'); } else if (!kid) { if (V === 0) dKufi(R, MK, Cc.hat); else if (V === 2) dHeadwrap(R, MK, Cc.hat); } if (old) dStaff(R, MK); }
    });
  } else if (civ === 'india') {
    o.hair = f ? W('ponytail', 'bun', 'ponytail') : W('short', 'short', 'short'); o.beard = f || kid ? 'none' : old ? 'long' : W('mustache', 'full', 'mustache'); o.sandals = true; C.boot = '#6a4a2a';
    if (f && !kid) { o.sleeves = true; X((R, Cc, MK) => { dGown(R, MK, Cc.robe, { top: 1.02, f: 0.93, flare: 0.24 }); dSariDrape(R, MK, Cc.robe); dBindi(R, MK); dEarrings(R, MK, '#e8b830'); if (cls === 'chief') civCrown(R, MK, '#e8b830'); else if (cls === 'gatherer') dJar(R, MK, V === 2 ? 'head' : 'hand'); }); }
    else X((R, Cc, MK) => {
      if (cls === 'chief') { dGown(R, MK, Cc.robe, { top: 1.44, bot: 0.4, flare: 0.25 }); dBelt(R, MK, '#c8302a', true); dPearls(R, MK); civTurban(R, MK, '#e8a020', true); dScabbard(R, MK, '#7a5a2a', true); }
      else if (cls === 'warrior') { dTunic(R, MK, Cc.shirt, 0.64); civArmor(R, MK, '#7a5a3a', '#3a2a1c'); civTurban(R, MK, Cc.hat, false); civShield(R, MK, '#8a5a2a', true); }
      else { dTunic(R, MK, Cc.shirt, kid ? 0.72 : 0.62); dDhoti(R, MK, Cc.pants); if (!kid && V < 2) civTurban(R, MK, Cc.hat, false); if (old) { dShawl(R, MK, '#e8e0d0'); dStaff(R, MK); } if (cls === 'builder') dTool(R, MK, 'hoe'); }
    });
  } else if (civ === 'bandit') {
    o.hair = W('short', 'mane', 'short'); o.beard = W('stubble', 'full', 'none'); o.noKnife = false;
    X((R, Cc, MK) => { dTunic(R, MK, Cc.shirt, 0.66); dBelt(R, MK, '#2a2018'); if (V < 2) civHood(R, MK, Cc.hat); if (V !== 1) civMask(R, MK, '#3a1a14'); civCape(R, MK, Cc.robe, false); dScabbard(R, MK, '#2a2018'); });
  }
  if (kid) o.beard = 'none';
  if (J) { o.noSpear = true; if (J === 'smith') o.sleeves = false; if (J === 'priest' && (civ === 'china' || civ === 'japan' || civ === 'egypt' || civ === 'india')) { o.hair = 'shaved'; o.beard = 'none'; } X((R, Cc, MK) => jobGear(R, Cc, MK, J, civ, f, V)); }
  if (ex.length) { const prev = o.extra; o.extra = (R, Cc, MK) => { const pj = DRESS.job; DRESS.job = J; try { if (prev) prev(R, Cc, MK); for (const e of ex) e(R, Cc, MK); } finally { DRESS.job = pj; } }; }
}
// ---------- the pieces of clothing (on the human rig: head about 1.67 m, chest about 1.3 m, waist 1.0 m) ----------
const _hb = (R, n) => R.map[n];
const cc = x => x && x.isColor ? x : col(x);
function torsoR(y, f) {
  const t = clamp((y - 0.95) / 0.58, 0, 1);
  const rx = t < 0.35 ? lerp(0.152, 0.142, t / 0.35) : t < 0.78 ? lerp(0.142, 0.18 * f, (t - 0.35) / 0.43) : lerp(0.18 * f, 0.1, Math.pow((t - 0.78) / 0.22, 1.4));
  const rz = t < 0.35 ? lerp(0.105, 0.094, t / 0.35) : t < 0.78 ? lerp(0.094, 0.12, (t - 0.35) / 0.43) : lerp(0.12, 0.07, Math.pow((t - 0.78) / 0.22, 1.4));
  return [rx, rz];
}
// long clothes follow the body above the hips and are pushed by the thigh on their side below them
function dressSkin(R) {
  const m = R.map;
  return (x, y) => y > 1.14 ? [m.spine, m.chest, clamp((y - 1.14) / 0.2, 0, 1)] : y > 0.98 ? [m.root, m.spine, clamp((y - 0.98) / 0.16, 0, 1)] : [m.root, x >= 0 ? m.Lth : m.Rth, 0.45 * smooth(0.95, 0.3, y) * smooth(0.0, 0.1, Math.abs(x))];
}
// a dress, a robe, a gown or a long coat: from `top` (1.0 the waist, 1.42 under the arms) down to `bot`, flaring to `flare`
function dGown(R, MK, color, o) {
  o = o || {}; const top = o.top ?? 1.42, bot = o.bot ?? 0.09, f = o.f ?? 1, fl = o.flare ?? 0.26, gap = 0.014 + (o.over || 0), N = 16, pts = [];
  for (let i = 0; i <= N; i++) pts.push(new V3(0, lerp(bot, top, i / N), 0));
  const prof = t => {
    const y = lerp(bot, top, t);
    if (y >= 1.0) { const [rx, rz] = torsoR(y, f); return [rx + gap, rz + gap + (f < 1 && y > 1.24 && y < 1.4 ? 0.02 : 0)]; }
    if (y >= 0.9) return [0.172 + gap, 0.126 + gap];
    const k = Math.pow((0.9 - y) / Math.max(0.05, 0.9 - bot), 0.85);
    return [lerp(0.172 + gap, fl, k), lerp(0.126 + gap, fl * 0.82, k)];
  };
  R.add(loft(pts, prof, 22), null, dressSkin(R), cc(color), MK);
  // a kimono's crossed collar
  if (o.kimono) for (const s of [-1, 1]) R.add(new THREE.BoxGeometry(0.035, 0.26, 0.012), M([s * 0.035, 1.36, 0.128], [0.25, 0, s * 0.45]), _hb(R, 'chest'), col('#efe8da'), 0);
}
// a tunic over the belt, down to the middle of the thigh
function dTunic(R, MK, color, bot) { dGown(R, MK, color, { top: 1.02, bot: bot ?? 0.66, flare: 0.2 }); }
function dBelt(R, MK, color, wide, h) {
  R.add(new THREE.CylinderGeometry(0.168, 0.17, h || (wide ? 0.07 : 0.035), 22, 1, true), M([0, 1.0, 0], null, [1, 1, 0.76]), _hb(R, 'root'), cc(color), 0);
  if (!wide) R.add(new THREE.BoxGeometry(0.04, 0.035, 0.012), M([0, 1.0, 0.131]), _hb(R, 'root'), col('#c8a850'), 0);
}
function dObi(R, MK, color, h) { dBelt(R, MK, color, true, h || 0.13); R.add(new THREE.BoxGeometry(0.16, 0.1, 0.05), M([0, 1.02, -0.15]), _hb(R, 'root'), cc(color), 0); }
function dApron(R, MK, color, bot) {
  const L = 1.0 - (bot ?? 0.6);
  R.add(new THREE.BoxGeometry(0.26, L, 0.012, 1, 3, 1), M([0, 1.0 - L / 2, 0.16 + L * 0.08], [-0.12, 0, 0]), dressSkin(R), cc(color), MK);
  R.add(new THREE.TorusGeometry(0.17, 0.008, 4, 20), M([0, 1.0, 0], [Math.PI / 2, 0, 0], [1, 0.78, 1]), _hb(R, 'root'), cc(color), 0);
}
function dLegWraps(R, MK, color) { for (const n of ['L', 'R']) { const K = R.wp[_hb(R, n + 'sh')]; for (let k = 0; k < 4; k++) R.add(new THREE.CylinderGeometry(0.06, 0.062, 0.03, 10, 1, true), M([K.x, K.y - 0.07 - k * 0.045, K.z], [0.18 * (k % 2 ? 1 : -1), 0, 0]), _hb(R, n + 'sh'), cc(color), MK); } }
function dDhoti(R, MK, color) { dGown(R, MK, color, { top: 1.0, bot: 0.3, flare: 0.21 }); R.add(new THREE.BoxGeometry(0.06, 0.55, 0.012), M([0, 0.72, 0.15], [-0.08, 0, 0]), dressSkin(R), cc(color), MK); }
function dKilt(R, MK, color) { dGown(R, MK, color, { top: 1.0, bot: 0.66, flare: 0.21 }); R.add(new THREE.BoxGeometry(0.1, 0.3, 0.01), M([0.03, 0.83, 0.165], [-0.1, 0, 0.12]), dressSkin(R), cc(color), MK); dBelt(R, MK, '#d8a020', true, 0.04); }
function dWideSleeves(R, MK, color) { for (const n of ['L', 'R']) { const E = R.wp[_hb(R, n + 'la')]; R.add(new THREE.CylinderGeometry(0.05, 0.085, 0.2, 12, 1, true), M([E.x, E.y - 0.16, E.z + 0.01]), _hb(R, n + 'la'), cc(color), MK); } }
function dFurCollar(R, MK, color) { R.add(new THREE.TorusGeometry(0.15, 0.045, 8, 20), M([0, 1.46, -0.005], [Math.PI / 2, 0, 0], [1.12, 0.85, 1]), _hb(R, 'chest'), cc(color), MK); }
function dBrooches(R, MK) {
  const bz = col('#b8903a');
  for (const s of [-1, 1]) R.add(new THREE.SphereGeometry(1, 10, 8, 0, TAU, 0, Math.PI / 2), M([s * 0.075, 1.36, 0.14], [Math.PI / 2 - 0.15, 0, 0], [0.032, 0.02, 0.042]), _hb(R, 'chest'), bz, 0);
  for (let i = 0; i < 9; i++) { const t = i / 8, x = lerp(-0.075, 0.075, t); R.add(new THREE.SphereGeometry(0.009, 6, 4), M([x, 1.335 - Math.sin(t * Math.PI) * 0.05, 0.142]), _hb(R, 'chest'), col(['#c8302a', '#e8b830', '#2a6a8a'][i % 3]), 0); }
}
function dWideCollar(R, MK) { [['#2a62b8', 0.17, 1.455], ['#d8a020', 0.155, 1.468], ['#c8302a', 0.14, 1.48], ['#2a8a6a', 0.122, 1.49]].forEach(([c, r, y]) => R.add(new THREE.CylinderGeometry(r, r, 0.016, 22), M([0, y, 0.012], [0.08, 0, 0], [1, 1, 0.92]), _hb(R, 'chest'), col(c), 0)); }
function dPearls(R, MK) { for (let i = 0; i < 15; i++) { const a = -1.3 + i * (2.6 / 14); R.add(new THREE.SphereGeometry(0.011, 6, 4), M([Math.sin(a) * 0.1, 1.41 - Math.cos(a) * 0.05, 0.05 + Math.cos(a) * 0.08]), _hb(R, 'chest'), col('#f2efe6'), 0); } }
function dSariDrape(R, MK, color) {
  // from the right hip over the left shoulder, and down the back
  const ch = _hb(R, 'chest');
  R.add(new THREE.BoxGeometry(0.13, 0.62, 0.014), M([0.02, 1.2, 0.145], [0.05, 0, 0.6]), ch, cc(color), MK);
  R.add(new THREE.BoxGeometry(0.14, 0.5, 0.014), M([0.1, 1.22, -0.14], [-0.05, 0, -0.15]), ch, cc(color), MK);
  R.add(new THREE.SphereGeometry(1, 10, 6), M([0.15, 1.46, 0], null, [0.06, 0.03, 0.09]), ch, cc(color), MK);
}
function dShawl(R, MK, color) { R.add(new THREE.TorusGeometry(0.15, 0.04, 6, 18), M([0, 1.44, 0], [Math.PI / 2 + 0.1, 0, 0], [1.1, 0.85, 1]), _hb(R, 'chest'), cc(color), MK); }
function dBisht(R, MK, color, trim) {
  // an open cloak over the robe, a gold band along its edges
  const ch = _hb(R, 'chest'), c = cc(color);
  R.add(new THREE.CylinderGeometry(0.2, 0.3, 1.25, 16, 4, true, Math.PI * 0.18, Math.PI * 1.64), M([0, 0.84, 0], null, [1, 1, 0.8]), dressSkin(R), c, MK);
  for (const s of [-1, 1]) R.add(new THREE.BoxGeometry(0.02, 1.2, 0.012), M([s * 0.1, 0.86, 0.19], [-0.04, 0, s * 0.07]), dressSkin(R), col(trim), 0);
  R.add(new THREE.TorusGeometry(0.15, 0.03, 6, 18), M([0, 1.45, -0.01], [Math.PI / 2, 0, 0], [1.1, 0.85, 1]), ch, c, MK);
}
function dMail(R, MK) { dGown(R, MK, '#8d959c', { top: 1.44, bot: 0.62, flare: 0.24, over: 0.014 }); }
function dRoundShield(R, MK, c1, c2, where) {
  const ch = _hb(R, 'chest');
  if (where === 'back') {
    R.add(new THREE.CylinderGeometry(0.27, 0.27, 0.025, 22), M([0, 1.18, -0.17], [Math.PI / 2, 0, 0]), ch, col(c1), MK);
    R.add(new THREE.CylinderGeometry(0.27, 0.27, 0.026, 22, 1, false, 0, Math.PI / 2), M([0, 1.18, -0.172], [Math.PI / 2, 0, 0]), ch, col(c2), 0);
    R.add(new THREE.CylinderGeometry(0.27, 0.27, 0.026, 22, 1, false, Math.PI, Math.PI / 2), M([0, 1.18, -0.172], [Math.PI / 2, 0, 0]), ch, col(c2), 0);
    R.add(new THREE.SphereGeometry(0.05, 10, 8), M([0, 1.18, -0.19]), ch, col('#9aa0a8'), 0);
    R.add(new THREE.TorusGeometry(0.27, 0.012, 4, 24), M([0, 1.18, -0.172]), ch, col('#6a5a4a'), 0);
  } else civShield(R, MK, c1, true);
}
function dHideShield(R, MK) { const E = R.wp[_hb(R, 'Lla')], b = _hb(R, 'Lla'); R.add(new THREE.CylinderGeometry(0.17, 0.17, 0.03, 16, 1, false, -Math.PI / 2, Math.PI), M([E.x + 0.075, E.y - 0.02, E.z + 0.03], [0, 0, Math.PI / 2]), b, col('#e8dcc4'), MK); R.add(new THREE.BoxGeometry(0.03, 0.3, 0.34), M([E.x + 0.075, E.y - 0.17, E.z + 0.03]), b, col('#e8dcc4'), MK); for (let k = 0; k < 4; k++) R.add(new THREE.SphereGeometry(0.03, 6, 5), M([E.x + 0.09, E.y - 0.1 - (k % 2) * 0.12, E.z + 0.03 + (k < 2 ? -0.08 : 0.08)], null, [0.5, 1, 1.3]), b, col('#3a2a1c'), 0); }
// headwear
function dCoif(R, MK, color) { R.add(new THREE.SphereGeometry(1, 16, 10, 0, TAU, 0, Math.PI * 0.55), M([0, 1.712, -0.02], [-0.3, 0, 0], [0.11, 0.1, 0.12]), _hb(R, 'head'), cc(color), MK); }
function dKufi(R, MK, color) { R.add(new THREE.CylinderGeometry(0.098, 0.104, 0.075, 18), M([0, 1.765, -0.015]), _hb(R, 'head'), cc(color), MK); R.add(new THREE.CylinderGeometry(0.105, 0.105, 0.012, 18), M([0, 1.74, -0.015]), _hb(R, 'head'), col('#e8b830'), 0); }
function dHeadband(R, MK, color) { R.add(new THREE.CylinderGeometry(0.104, 0.104, 0.028, 18, 1, true), M([0, 1.735, -0.01]), _hb(R, 'head'), cc(color), 0); }
function dHeadwrap(R, MK, color) { for (let k = 0; k < 2; k++) R.add(new THREE.TorusGeometry(0.096 - k * 0.012, 0.028, 8, 18), M([0, 1.735 + k * 0.03, -0.012], [Math.PI / 2 + 0.12, 0, 0]), _hb(R, 'head'), cc(color), MK); R.add(new THREE.SphereGeometry(1, 12, 8, 0, TAU, 0, Math.PI / 2), M([0, 1.76, -0.012], null, [0.09, 0.05, 0.095]), _hb(R, 'head'), cc(color), MK); }
function dGele(R, MK, color) {
  // a tall, wide headwrap knotted at the back
  const h = _hb(R, 'head'), c = cc(color);
  R.add(new THREE.SphereGeometry(1, 16, 10), M([0, 1.79, -0.03], [-0.25, 0, 0], [0.13, 0.085, 0.12]), h, c, MK);
  R.add(new THREE.TorusGeometry(0.1, 0.03, 8, 18), M([0, 1.74, -0.012], [Math.PI / 2 + 0.12, 0, 0]), h, c, MK);
  for (const s of [-1, 1]) R.add(new THREE.SphereGeometry(1, 10, 8), M([s * 0.07, 1.86, -0.08], [0, 0, s * 0.6], [0.06, 0.035, 0.05]), h, c, MK);
}
function dKeffiyeh(R, MK, color) { civHeadcloth(R, MK, color, true); R.add(new THREE.TorusGeometry(0.1, 0.012, 6, 20), M([0, 1.765, -0.02], [Math.PI / 2 + 0.15, 0, 0]), _hb(R, 'head'), col('#1a1a1a'), 0); }
function dTurbanHelm(R, MK) { civHelmet(R, MK, '#9aa0a8', false); R.add(new THREE.ConeGeometry(0.06, 0.14, 10), M([0, 1.83, 0]), _hb(R, 'head'), col('#9aa0a8'), 0); R.add(new THREE.TorusGeometry(0.115, 0.025, 6, 20), M([0, 1.71, 0], [Math.PI / 2, 0, 0]), _hb(R, 'head'), col('#efe8da'), MK); }
function dSpikeHelm(R, MK, metal) { civHelmet(R, MK, metal, false); R.add(new THREE.ConeGeometry(0.03, 0.16, 8), M([0, 1.85, 0]), _hb(R, 'head'), col(metal), 0); R.add(new THREE.CylinderGeometry(0.13, 0.15, 0.08, 16, 1, true, Math.PI * 0.7, Math.PI * 1.6), M([0, 1.64, -0.01]), _hb(R, 'head'), col('#6a4a2a'), MK); }
function dVikingHelm(R, MK, specs) {
  const h = _hb(R, 'head'), m = col('#8a9098'), d = col('#5a5e64');
  R.add(new THREE.SphereGeometry(1, 16, 10, 0, TAU, 0, Math.PI * 0.55), M([0, 1.686, 0.0], null, [0.118, 0.13, 0.124]), h, m, 0);
  R.add(new THREE.TorusGeometry(0.117, 0.01, 5, 22), M([0, 1.7, 0.0], [Math.PI / 2, 0, 0], [1, 1.06, 1]), h, d, 0);
  for (const a of [0, Math.PI / 2]) R.add(new THREE.TorusGeometry(0.124, 0.008, 4, 20, Math.PI), M([0, 1.7, 0], [0, a, 0], [1, 0.98, 1.02]), h, d, 0);
  if (specs) for (const s of [-1, 1]) R.add(new THREE.TorusGeometry(0.018, 0.005, 4, 10), M([s * 0.034, 1.69, 0.118]), h, d, 0);
  R.add(new THREE.BoxGeometry(0.018, 0.06, 0.012), M([0, 1.665, 0.121], [-0.1, 0, 0]), h, d, 0);
}
function dTallHat(R, MK, color) { const h = _hb(R, 'head'); R.add(new THREE.CylinderGeometry(0.06, 0.09, 0.34, 12), M([0, 1.94, -0.02]), h, cc(color), MK); R.add(new THREE.CylinderGeometry(0.11, 0.11, 0.06, 16), M([0, 1.77, -0.012]), h, col('#6a5038'), MK); R.add(new THREE.ConeGeometry(0.03, 0.2, 6), M([0, 2.2, -0.02], [-0.2, 0, 0]), h, col('#efe8da'), 0); }
function dFutou(R, MK) { const h = _hb(R, 'head'), k = col('#1a1a1a'); R.add(new THREE.SphereGeometry(1, 14, 8, 0, TAU, 0, Math.PI / 2), M([0, 1.74, -0.015], null, [0.105, 0.09, 0.112]), h, k, 0); for (const s of [-1, 1]) R.add(new THREE.BoxGeometry(0.2, 0.012, 0.035), M([s * 0.17, 1.77, -0.05]), h, k, 0); }
function dHairPins(R, MK, color) { const h = _hb(R, 'head'); for (const s of [-1, 1]) R.add(new THREE.CylinderGeometry(0.004, 0.004, 0.16, 5), M([s * 0.03, 1.74, -0.11], [0.2, 0, s * 1.2]), h, col(color), 0); R.add(new THREE.SphereGeometry(0.014, 8, 6), M([0.08, 1.76, -0.1]), h, col('#c8302a'), 0); }
function dBindi(R, MK) { R.add(new THREE.SphereGeometry(0.0055, 8, 6), M([0, 1.712, 0.093]), _hb(R, 'head'), col('#c8202a'), 0); }
function dEarrings(R, MK, color) { for (const s of [-1, 1]) R.add(new THREE.TorusGeometry(0.009, 0.0025, 4, 10), M([s * 0.095, 1.635, 0.0], [0, Math.PI / 2, 0]), _hb(R, 'head'), col(color), 0); }
function dFalseBeard(R, MK) { R.add(new THREE.CylinderGeometry(0.012, 0.016, 0.07, 8), M([0, 1.555, 0.088], [0.15, 0, 0]), _hb(R, 'head'), col('#2a62b8'), 0); }
// gear in the hands and on the belt
function dScabbard(R, MK, color, curved) {
  const r = _hb(R, 'root'), steel = col('#b8bec4'), gold = col('#c8a850');
  R.add(new THREE.BoxGeometry(0.035, 0.7, 0.05), M([0.19, 0.66, -0.06], [curved ? 0.42 : 0.3, 0, 0.12]), r, cc(color), MK);
  R.add(new THREE.BoxGeometry(0.03, 0.02, 0.12), M([0.17, 1.02, 0.07], [0.3, 0, 0.12]), r, gold, 0);
  R.add(new THREE.CylinderGeometry(0.012, 0.012, 0.1, 6), M([0.165, 1.06, 0.1], [0.3, 0, 0.12]), r, col('#3a2a1c'), MK);
  R.add(new THREE.SphereGeometry(0.016, 6, 5), M([0.16, 1.11, 0.115]), r, steel, 0);
}
function dKatana(R, MK) { for (const [dy, l] of [[0, 0.72], [-0.05, 0.5]]) { R.add(new THREE.BoxGeometry(0.03, l, 0.035), M([0.17, 0.98 + dy - l * 0.3, -0.12], [1.05, 0, 0.1]), _hb(R, 'root'), col('#2a1a14'), 0); R.add(new THREE.CylinderGeometry(0.013, 0.013, 0.18, 6), M([0.15, 1.02 + dy, 0.13], [1.05, 0, 0.1]), _hb(R, 'root'), col('#efe8da'), 0); } }
function dScepter(R, MK) { const H = R.wp[_hb(R, 'Rha')], b = _hb(R, 'Rha'), g = col('#e8b830'); R.add(new THREE.CylinderGeometry(0.01, 0.012, 0.52, 7), M([H.x, H.y - 0.02, H.z + 0.06], [0.5, 0, 0]), b, g, 0); R.add(new THREE.SphereGeometry(0.03, 10, 8), M([H.x, H.y + 0.2, H.z + 0.19]), b, g, 0); }
function dCrook(R, MK) { const H = R.wp[_hb(R, 'Rha')], b = _hb(R, 'Rha'); R.add(new THREE.CylinderGeometry(0.01, 0.01, 0.5, 6), M([H.x, H.y + 0.08, H.z + 0.08], [0.35, 0, 0]), b, col('#2a62b8'), 0); R.add(new THREE.TorusGeometry(0.04, 0.01, 5, 10, Math.PI * 1.3), M([H.x, H.y + 0.34, H.z + 0.15], [0, Math.PI / 2, 0]), b, col('#e8b830'), 0); }
function dStaff(R, MK, color) { const H = R.wp[_hb(R, 'Rha')], b = _hb(R, 'Rha'); R.add(new THREE.CylinderGeometry(0.015, 0.019, 1.45, 6), M([H.x, H.y - 0.22, H.z + 0.06]), b, col(color || '#6b4a2c'), MK); if (color) R.add(new THREE.SphereGeometry(0.035, 8, 6), M([H.x, H.y + 0.52, H.z + 0.06]), b, col(color), 0); }
function dHorn(R, MK) { R.add(new THREE.ConeGeometry(0.03, 0.2, 8), M([-0.17, 0.98, 0.05], [0, 0, 1.3]), _hb(R, 'root'), col('#e8dcc0'), 0); }
function dQuiver(R, MK) { const ch = _hb(R, 'chest'); R.add(new THREE.CylinderGeometry(0.045, 0.04, 0.5, 10), M([0.07, 1.22, -0.18], [0.12, 0, -0.42]), ch, col('#6a4a2a'), MK); for (let i = 0; i < 3; i++) R.add(new THREE.ConeGeometry(0.018, 0.08, 4), M([0.17 + i * 0.02, 1.5 + i * 0.01, -0.21], [0.12, 0, -0.42]), ch, col('#efe8da'), 0); }
function dTool(R, MK, kind, force) {
  if (DRESS.job && !force) return;
  const H = R.wp[_hb(R, 'Rha')], b = _hb(R, 'Rha'), wood = col('#6b4a2c'), iron = col('#7d8288');
  if (kind === 'hammer') { R.add(new THREE.CylinderGeometry(0.014, 0.016, 0.4, 6), M([H.x, H.y - 0.06, H.z + 0.04]), b, wood, MK); R.add(new THREE.BoxGeometry(0.05, 0.05, 0.13), M([H.x, H.y - 0.27, H.z + 0.06]), b, iron, 0); }
  else if (kind === 'axe') { R.add(new THREE.CylinderGeometry(0.015, 0.018, 0.62, 6), M([H.x, H.y - 0.16, H.z + 0.04]), b, wood, MK); R.add(new THREE.BoxGeometry(0.02, 0.12, 0.15), M([H.x, H.y - 0.42, H.z + 0.11]), b, iron, 0); }
  else if (kind === 'fork') { R.add(new THREE.CylinderGeometry(0.014, 0.017, 1.4, 6), M([H.x, H.y + 0.12, H.z + 0.05]), b, wood, MK); for (let k = -1; k <= 1; k++) R.add(new THREE.CylinderGeometry(0.006, 0.006, 0.26, 4), M([H.x + k * 0.04, H.y + 0.9, H.z + 0.05]), b, iron, 0); R.add(new THREE.BoxGeometry(0.1, 0.015, 0.015), M([H.x, H.y + 0.78, H.z + 0.05]), b, iron, 0); }
  else if (kind === 'hoe') { R.add(new THREE.CylinderGeometry(0.014, 0.017, 1.3, 6), M([H.x, H.y + 0.1, H.z + 0.05]), b, wood, MK); R.add(new THREE.BoxGeometry(0.02, 0.1, 0.14), M([H.x, H.y + 0.72, H.z + 0.12], [0.4, 0, 0]), b, iron, 0); }
}
function dBasket(R, MK, where, force) {
  if (DRESS.job && !force) return;
  const c = col('#b08a4a'), d = col('#7a5a2a');
  if (where === 'head') { const h = _hb(R, 'head'); R.add(new THREE.CylinderGeometry(0.17, 0.11, 0.12, 14), M([0, 1.86, -0.01]), h, c, MK); R.add(new THREE.TorusGeometry(0.17, 0.012, 5, 18), M([0, 1.92, -0.01], [Math.PI / 2, 0, 0]), h, d, 0); for (let k = 0; k < 5; k++) R.add(new THREE.SphereGeometry(0.04, 7, 5), M([Math.sin(k * 1.3) * 0.08, 1.93, Math.cos(k * 1.3) * 0.08 - 0.01]), h, col(['#c8302a', '#e8a020', '#5a8a2a'][k % 3]), 0); return; }
  const H = R.wp[_hb(R, 'Lha')], b = _hb(R, 'Lha');
  R.add(new THREE.CylinderGeometry(0.13, 0.1, 0.16, 14), M([H.x + 0.04, H.y - 0.2, H.z + 0.02]), b, c, MK);
  R.add(new THREE.TorusGeometry(0.1, 0.01, 4, 14, Math.PI), M([H.x + 0.04, H.y - 0.13, H.z + 0.02], [0, Math.PI / 2, 0]), b, d, 0);
}
function dJar(R, MK, where, force) {
  if (DRESS.job && !force) return;
  const c = col('#b0603a');
  if (where === 'head') { const h = _hb(R, 'head'); R.add(new THREE.SphereGeometry(1, 12, 9), M([0, 1.92, -0.01], null, [0.12, 0.13, 0.12]), h, c, MK); R.add(new THREE.CylinderGeometry(0.05, 0.06, 0.08, 10), M([0, 2.06, -0.01]), h, c, MK); R.add(new THREE.TorusGeometry(0.07, 0.02, 6, 14), M([0, 1.8, -0.01], [Math.PI / 2, 0, 0]), h, col('#efe8da'), MK); return; }
  const H = R.wp[_hb(R, 'Lha')], b = _hb(R, 'Lha');
  R.add(new THREE.SphereGeometry(1, 12, 9), M([H.x + 0.05, H.y - 0.16, H.z + 0.02], null, [0.1, 0.12, 0.1]), b, c, MK);
  R.add(new THREE.CylinderGeometry(0.04, 0.05, 0.07, 10), M([H.x + 0.05, H.y - 0.02, H.z + 0.02]), b, c, MK);
}
// ---------- older pieces, kept: robes, crowns, helmets, armour, shields, capes, hoods, hats ----------
function civRobe(R, MK, color, trim) {
  dGown(R, MK, color, { top: 1.0, bot: 0.12, flare: 0.27 });
  if (trim) R.add(new THREE.TorusGeometry(0.19, 0.018, 6, 22), M([0, 1.44, 0.01], [Math.PI / 2, 0, 0], [1, 0.75, 1]), _hb(R, 'chest'), col(trim), 0);
}
function civSkirt(R, MK, color) { dGown(R, MK, color, { top: 1.0, bot: 0.3, flare: 0.26, f: 0.93 }); }
function civCrown(R, MK, gold) {
  const g = col(gold), h = _hb(R, 'head');
  R.add(new THREE.CylinderGeometry(0.11, 0.106, 0.05, 18, 1, true), M([0, 1.775, -0.014]), h, g, 0);
  for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; R.add(new THREE.ConeGeometry(0.018, 0.06, 4), M([Math.sin(a) * 0.106, 1.825, Math.cos(a) * 0.106 - 0.014]), h, g, 0); }
  R.add(new THREE.SphereGeometry(0.016, 8, 6), M([0, 1.78, 0.095]), h, col('#c8202a'), 0);
}
function civHelmet(R, MK, metal, nose, plume) {
  const m = col(metal), h = _hb(R, 'head');
  R.add(new THREE.SphereGeometry(1, 16, 10, 0, TAU, 0, Math.PI * 0.55), M([0, 1.686, 0.0], null, [0.118, 0.13, 0.124]), h, m, 0);
  if (nose) R.add(new THREE.BoxGeometry(0.02, 0.07, 0.014), M([0, 1.665, 0.121], [-0.1, 0, 0]), h, m, 0);
  if (plume) R.add(new THREE.ConeGeometry(0.025, 0.14, 6), M([0, 1.85, 0]), h, col(plume), 0);
}
function civKabuto(R, MK, crest) {
  const h = _hb(R, 'head'), d = col('#2a2a2a');
  R.add(new THREE.SphereGeometry(1, 16, 10, 0, TAU, 0, Math.PI * 0.52), M([0, 1.7, 0], null, [0.124, 0.12, 0.13]), h, d, 0);
  R.add(new THREE.CylinderGeometry(0.2, 0.22, 0.02, 18, 1, true), M([0, 1.67, -0.02], [0.25, 0, 0]), h, d, 0);
  for (const s of [-1, 1]) R.add(new THREE.BoxGeometry(0.018, 0.16, 0.012), M([s * 0.05, 1.83, 0.1], [0.2, 0, s * 0.45]), h, col(crest), 0);
}
function civArmor(R, MK, color, lace) {
  const c = cc(color), l = col(lace), ch = _hb(R, 'chest');
  for (let k = 0; k < 4; k++) R.add(new THREE.CylinderGeometry(0.19 - k * 0.004, 0.2 - k * 0.004, 0.09, 16, 1, true), M([0, 1.06 + k * 0.1, 0], null, [1, 1, 0.78]), ch, k % 2 ? l : c, 0);
  for (const s of [-1, 1]) R.add(new THREE.BoxGeometry(0.12, 0.03, 0.16), M([s * 0.22, 1.47, 0], [0, 0, s * 0.35]), ch, c, 0);
}
function civShield(R, MK, color, round) {
  const E = R.wp[_hb(R, 'Lla')], b = _hb(R, 'Lla'), c = col(color);
  if (round) { R.add(new THREE.CylinderGeometry(0.24, 0.24, 0.03, 18), M([E.x + 0.08, E.y - 0.12, E.z + 0.03], [0, 0, Math.PI / 2]), b, c, MK); R.add(new THREE.SphereGeometry(0.045, 8, 6), M([E.x + 0.1, E.y - 0.12, E.z + 0.03]), b, col('#9aa0a8'), 0); }
  else R.add(new THREE.BoxGeometry(0.03, 0.46, 0.3), M([E.x + 0.075, E.y - 0.13, E.z + 0.03]), b, c, MK);
}
function civCape(R, MK, color, fur) {
  const ch = _hb(R, 'chest'), c = cc(color);
  R.add(new THREE.CylinderGeometry(0.2, 0.3, 0.95, 14, 3, true, Math.PI * 0.55, Math.PI * 0.9), M([0, 1.0, -0.01], [-0.06, 0, 0], [1, 1, 0.8]), ch, c, MK);
  if (fur) R.add(new THREE.TorusGeometry(0.15, 0.04, 6, 16), M([0, 1.45, -0.02], [Math.PI / 2, 0, 0], [1.1, 0.8, 1]), ch, col('#8a7a6a'), MK);
}
function civHood(R, MK, color) { const c = cc(color); R.add(new THREE.SphereGeometry(1, 16, 10, 0, TAU, 0, Math.PI * 0.6), M([0, 1.69, -0.02], [-0.6, 0, 0], [0.128, 0.138, 0.134]), _hb(R, 'head'), c, MK); R.add(new THREE.TorusGeometry(0.13, 0.035, 6, 18), M([0, 1.46, -0.01], [Math.PI / 2, 0, 0], [1.1, 0.85, 1]), _hb(R, 'chest'), c, MK); }
function civMask(R, MK, color) { R.add(new THREE.CylinderGeometry(0.098, 0.09, 0.07, 14, 1, true, -1.2, 2.4), M([0, 1.615, 0.012]), _hb(R, 'head'), col(color), MK); }
function civSash(R, MK, color) { dBelt(R, MK, color, true); }
function civFurHat(R, MK, top) { const h = _hb(R, 'head'); R.add(new THREE.CylinderGeometry(0.122, 0.132, 0.07, 16), M([0, 1.75, -0.012]), h, col('#6a5038'), MK); R.add(new THREE.ConeGeometry(0.105, 0.15, 14), M([0, 1.855, -0.012]), h, cc(top), MK); }
function civConeHat(R, MK, color) { R.add(new THREE.ConeGeometry(0.26, 0.15, 18), M([0, 1.82, -0.01]), _hb(R, 'head'), col(color), MK); }
function civFlatHat(R, MK, color) { const h = _hb(R, 'head'); R.add(new THREE.CylinderGeometry(0.1, 0.1, 0.08, 12), M([0, 1.77, -0.012]), h, col(color), 0); R.add(new THREE.BoxGeometry(0.26, 0.016, 0.16), M([0, 1.82, -0.012]), h, col(color), 0); for (const z of [-0.08, 0.06]) for (let k = 0; k < 5; k++) R.add(new THREE.CylinderGeometry(0.003, 0.003, 0.07, 3), M([-0.08 + k * 0.04, 1.78, z]), h, col('#e8b830'), 0); }
function civTurban(R, MK, color, jewel) {
  const h = _hb(R, 'head'), c = cc(color);
  for (let k = 0; k < 3; k++) R.add(new THREE.TorusGeometry(0.102 - k * 0.012, 0.036, 8, 18), M([0, 1.74 + k * 0.034, -0.012], [Math.PI / 2 + 0.08, 0, 0]), h, c, MK);
  R.add(new THREE.SphereGeometry(1, 12, 8, 0, TAU, 0, Math.PI / 2), M([0, 1.8, -0.012], null, [0.085, 0.05, 0.09]), h, c, MK);
  if (jewel) { R.add(new THREE.SphereGeometry(0.02, 8, 6), M([0, 1.775, 0.11]), h, col('#2a8a5a'), 0); R.add(new THREE.ConeGeometry(0.012, 0.12, 5), M([0, 1.85, 0.1], [-0.3, 0, 0]), h, col('#efe8da'), 0); }
}
function civHeadcloth(R, MK, color, long) {
  const h = _hb(R, 'head'), c = cc(color);
  R.add(new THREE.SphereGeometry(1, 16, 10, 0, TAU, 0, Math.PI * 0.62), M([0, 1.69, -0.025], [-0.5, 0, 0], [0.122, 0.138, 0.134]), h, c, MK);
  if (long) R.add(new THREE.CylinderGeometry(0.12, 0.17, 0.26, 16, 1, true, Math.PI * 0.25, Math.PI * 1.5), M([0, 1.53, -0.02]), h, c, MK);
}
function civNemes(R, MK) {
  const h = _hb(R, 'head'), b = col('#2a62b8'), g = col('#e8b830');
  R.add(new THREE.SphereGeometry(1, 14, 10, 0, TAU, 0, Math.PI * 0.6), M([0, 1.7, -0.012], null, [0.124, 0.14, 0.13]), h, g, 0);
  for (let k = 0; k < 4; k++) R.add(new THREE.TorusGeometry(0.122, 0.006, 4, 18), M([0, 1.71 + k * 0.03, -0.012], [Math.PI / 2, 0, 0]), h, b, 0);
  for (const s of [-1, 1]) R.add(new THREE.BoxGeometry(0.05, 0.2, 0.03), M([s * 0.1, 1.56, 0.04]), h, g, 0);
  R.add(new THREE.ConeGeometry(0.014, 0.05, 5), M([0, 1.79, 0.12], [0.6, 0, 0]), h, g, 0);
}
function civCollar(R, MK, color) { R.add(new THREE.CylinderGeometry(0.18, 0.18, 0.016, 22), M([0, 1.45, 0.012]), _hb(R, 'chest'), col(color), 0); }

// ---------- the gear of the town's trades ----------
const TOWNJOBS = ['vendor', 'farmer', 'smith', 'fisher', 'priest', 'water', 'herder'];
function jobGear(R, Cc, MK, job, civ, f, V) {
  const hot = civ === 'arabs' || civ === 'egypt' || civ === 'mali' || civ === 'india', east = civ === 'china' || civ === 'japan';
  const strawHat = () => { const h = _hb(R, 'head'); R.add(new THREE.CylinderGeometry(0.2, 0.22, 0.02, 20), M([0, 1.765, -0.008]), h, col('#d8c070'), MK); R.add(new THREE.CylinderGeometry(0.095, 0.11, 0.11, 14), M([0, 1.82, -0.008]), h, col('#d0b860'), MK); R.add(new THREE.CylinderGeometry(0.112, 0.112, 0.025, 14), M([0, 1.785, -0.008]), h, col('#8a3a2a'), 0); };
  if (job === 'vendor') {
    dApron(R, MK, f ? '#efe8da' : ['#efe8da', '#8a6a4a', '#c8b898'][V % 3], 0.6);
    R.add(new THREE.SphereGeometry(1, 8, 6), M([0.17, 0.93, 0.05], null, [0.05, 0.065, 0.04]), _hb(R, 'root'), col('#7a5634'), MK);
  } else if (job === 'farmer') {
    if (east) civConeHat(R, MK, '#d8c070'); else if (!hot) strawHat();
    dTool(R, MK, V === 1 ? 'fork' : 'hoe', true);
  } else if (job === 'smith') {
    dGown(R, MK, '#4a3020', { top: 1.38, bot: 0.5, flare: 0.21, over: 0.02 });
    dTool(R, MK, 'hammer', true);
    if (east || hot) dHeadband(R, MK, '#efe8da');
  } else if (job === 'fisher') {
    if (east) civConeHat(R, MK, '#c8b070'); else if (!hot) { const h = _hb(R, 'head'); R.add(new THREE.SphereGeometry(1, 14, 8, 0, TAU, 0, Math.PI / 2), M([0, 1.742, -0.012], null, [0.108, 0.07, 0.114]), h, col('#4a5a6a'), MK); }
    R.add(new THREE.CylinderGeometry(0.09, 0.07, 0.18, 10), M([-0.19, 0.9, 0.0]), _hb(R, 'root'), col('#a8834a'), MK);
  } else if (job === 'priest') {
    const robe = { knights: '#4a3a2a', vikings: '#3a4a5a', mongols: '#6a3a2a', china: '#c87a2a', japan: '#2a2a2a', arabs: '#f2efe6', egypt: '#f2efe6', mali: '#f2efe6', india: '#e0801a' }[civ] || '#4a3a2a';
    dGown(R, MK, robe, { top: 1.44, flare: 0.28, over: 0.02 });
    if (civ === 'knights') { civHood(R, MK, robe); dBelt(R, MK, '#c8b07a'); }
    else if (civ === 'japan') { R.add(new THREE.BoxGeometry(0.1, 0.62, 0.014), M([0.02, 1.2, 0.15], [0.05, 0, 0.55]), _hb(R, 'chest'), col('#c87a2a'), MK); }
    else if (civ === 'arabs' || civ === 'mali') { civTurban(R, MK, '#f2efe6', false); R.add(new THREE.BoxGeometry(0.16, 0.2, 0.04), M([0.16, 0.95, 0.12], [0, 0.3, 0]), _hb(R, 'Lla'), col('#6a2a1a'), 0); }
    else if (civ === 'egypt') { R.add(new THREE.BoxGeometry(0.34, 0.6, 0.014), M([0.02, 1.15, 0.15], [0.05, 0, 0.5]), _hb(R, 'chest'), col('#d8a040'), MK); }
    else if (civ === 'india') { R.add(new THREE.BoxGeometry(0.006, 0.03, 0.004), M([0, 1.722, 0.095]), _hb(R, 'head'), col('#c8202a'), 0); }
    else if (civ === 'mongols') { const h = _hb(R, 'head'); R.add(new THREE.CylinderGeometry(0.11, 0.12, 0.08, 14), M([0, 1.76, -0.01]), h, col('#3a2a1c'), MK); for (let k = 0; k < 10; k++) { const a = k / 10 * TAU; R.add(new THREE.BoxGeometry(0.012, 0.12, 0.004), M([Math.sin(a) * 0.12, 1.69, Math.cos(a) * 0.12 - 0.01], [0, a, 0]), h, col(k % 2 ? '#c8302a' : '#e8d8a0'), 0); } const E = R.wp[_hb(R, 'Lla')]; R.add(new THREE.CylinderGeometry(0.17, 0.17, 0.05, 16), M([E.x + 0.07, E.y - 0.15, E.z + 0.05], [0, 0, Math.PI / 2]), _hb(R, 'Lla'), col('#d8c8a0'), MK); }
    else if (civ === 'vikings') civCape(R, MK, '#3a3a4a', true);
  } else if (job === 'water') {
    if (civ === 'knights' || civ === 'vikings' || civ === 'mongols') dBasket(R, MK, 'hand', true); else dJar(R, MK, 'head', true);
  } else if (job === 'herder') {
    const H = R.wp[_hb(R, 'Rha')], b = _hb(R, 'Rha');
    R.add(new THREE.CylinderGeometry(0.014, 0.018, 1.5, 6), M([H.x, H.y + 0.1, H.z + 0.06]), b, col('#6b4a2c'), MK);
    R.add(new THREE.TorusGeometry(0.06, 0.012, 5, 10, Math.PI * 1.2), M([H.x, H.y + 0.87, H.z + 0.11], [0, Math.PI / 2, 0]), b, col('#6b4a2c'), MK);
  }
}
