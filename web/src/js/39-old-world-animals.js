// ================= THE OLD WORLD'S ANIMALS =================
// Red deer and wild boar in the forests of Europe, China and Japan; tigers in India and China; reindeer, moose, wolves and
// bears in the north; wild horses on the steppe; camels and oryx in Arabia; lions, elephants, giraffes and zebras in Africa.
// They are born when the hunter first comes near the Old World (nobody there needs them before that), each in its own
// land, and the land keeps its numbers up while the hunter is there.
SP('deer', { he: 'אייל אדום', lat: 'Cervus elaphus', kind: 'quad', ai: 'herb', hp: 110, dmg: 14, walk: 1.6, run: 12, swim: 2, reach: 1.4, atkCD: 1, sense: 46, safe: 60, food: 85, turn: 5,
  count: 0, group: [3, 6], hab: 'forest', size: [0.92, 1.08], danger: 0, herd: true, fight: 0.25, diet: 'עשב, עלים ובלוטים', land: 5, tpls: ['deer', 'hind', 'hind'],
  guide: 'הצבי הגדול של יערות אירופה ואסיה. בסתיו הזכרים נועים בקול רם ונאבקים בקרניים על הנקבות, וכל אביב הקרניים נושרות וצומחות מחדש.' });
SP('boar', { he: 'חזיר בר', lat: 'Sus scrofa', kind: 'quad', ai: 'herb', hp: 95, dmg: 16, walk: 1.6, run: 9.5, swim: 1.8, reach: 1.2, atkCD: 0.8, sense: 30, safe: 45, food: 70, turn: 6,
  count: 0, group: [3, 6], hab: 'forest', size: [0.9, 1.1], danger: 2, fight: 0.85, herd: true, diet: 'כל-אוכל',
  land: 5, guide: 'אבי החזיר של החווה. הוא חופר באדמה בחוטם לשורשים ולבלוטים, והזכר עם הניבים מסתער בלי פחד על מי שמתקרב לגורים.' });
SP('tiger', { he: 'טיגריס', lat: 'Panthera tigris', kind: 'quad', ai: 'pred', hp: 240, dmg: 38, walk: 2.1, run: 12.8, swim: 3.2, reach: 2.4, atkCD: 0.8, sense: 48, food: 110, turn: 5.5,
  prey: ['deer', 'boar', 'gazelle', 'cow', 'horse'], count: 0, group: [1, 1], hab: 'forest', size: [0.95, 1.08], danger: 3, night: 0.6, call: 'jaguar', diet: 'טורף על', land: 12,
  guide: 'החתול הגדול בעולם. הפסים מסתירים אותו בין הצמחים, הוא צד לבד ובלילה, ובניגוד לרוב החתולים הוא אוהב מים ושוחה מצוין.' });
SPECIES.wolf.prey = [...new Set([...(SPECIES.wolf.prey || []), 'deer', 'boar', 'gazelle', 'horse'])];
SPECIES.brownbear.prey = [...new Set([...(SPECIES.brownbear.prey || []), 'deer', 'boar'])];
for (const id of ['deer', 'boar']) if (!HUNTER_PREY.includes(id)) HUNTER_PREY.push(id);
PACKN.deer = 'עדרי איילים אדומים'; PACKN.boar = 'להקות חזירי בר';
// how they look: a deer (stags with antlers, hinds without), a boar with tusks, a striped tiger
function owFaunaTpls() {
  if (TPL.deer) return;
  buildLandTpls();
  const R0 = TPL.reindeer.o, rump = (c, x, y, z, nx, ny, nz, C, by) => (z < -0.42 && y > by - 0.1 && ny > -0.3) ? col('#e6d6b8') : c;
  const dc = { fur: '#8a5a34', belly: '#d2bd98', nose: '#2a2018', eye: '#120e0c', legs: '#6a4a2c' };
  TPL.deer = buildQuad(Object.assign({}, R0, { L: 1.0, legLen: 0.82, neckLen: 0.46, c: dc, colorFn: rump }));
  TPL.hind = buildQuad(Object.assign({}, R0, { L: 0.92, legLen: 0.76, neckLen: 0.42, headR: 0.09, c: Object.assign({}, dc, { fur: '#9a6a40' }), colorFn: rump, extra: null }));
  const P0 = TPL.peccary.o, ivory = col('#ece2c8');
  TPL.boar = buildQuad(Object.assign({}, P0, { L: 0.66, chestR: 0.26, hipR: 0.21, legLen: 0.34, legR: 0.038, pawR: 0.042, neckR: 0.16, headR: 0.125, snoutLen: 0.22, snoutR: 0.07,
    c: { fur: '#4e3e30', belly: '#5a4a3a', nose: '#3a2a22', eye: '#140e0c', jaw: '#6a5a4a' },
    extra: k => { P0.extra(k); for (const s of [-1, 1]) { const a = V(k.sc[0] + s * k.sr * 0.75, k.sc[1] - k.sr * 0.35, k.sc[2] + k.sl * 0.3), b = a.clone().add(V(s * 0.035, 0.07, 0.03)); hornSeg(k, a, b, 0.014, 0.004, k.head, ivory); } } }));
  const J = TPL.jaguar.o;
  TPL.tiger = buildQuad(Object.assign({}, J, { L: 1.12, chestR: 0.3, hipR: 0.28, legLen: 0.52, legR: 0.075, pawR: 0.095, neckR: 0.135, headR: 0.165, headSpots: false, tailLen: 0.85,
    c: { fur: '#d98a32', belly: '#f2e8d8', nose: '#6e4434', eye: '#c9a040', jaw: '#f2e8d8', snout: '#f0e2cc' }, pat: 8, patCol: '#18100a', patScale: 7.5, ring: 0.6 }));
}
// which animals live in which land: [species, groups, [smallest group, biggest group]]
const OW_FAUNA = {
  5: [['deer', 5, [3, 5]], ['boar', 4, [3, 5]], ['wolf', 2, [3, 5]], ['brownbear', 2, [1, 1]]],
  6: [['reindeer', 4, [5, 8]], ['moose', 2, [1, 2]], ['wolf', 2, [3, 5]], ['brownbear', 1, [1, 1]], ['arcticfox', 2, [1, 2]], ['polarbear', 1, [1, 1]]],
  7: [['horse', 3, [4, 7]], ['gazelle', 3, [4, 7]], ['camel', 2, [2, 4]], ['wolf', 2, [3, 5]]],
  8: [['deer', 3, [2, 4]], ['boar', 3, [3, 5]], ['tiger', 1, [1, 1]], ['brownbear', 1, [1, 1]]],
  9: [['deer', 3, [2, 4]], ['boar', 2, [2, 4]], ['brownbear', 1, [1, 1]]],
  10: [['camel', 3, [3, 5]], ['oryx', 3, [3, 5]], ['gazelle', 2, [3, 5]], ['fennec', 2, [1, 2]], ['hyena', 2, [3, 4]], ['hviper', 3, [1, 1]]],
  11: [['lion', 3, [2, 4]], ['elephant', 2, [3, 5]], ['giraffe', 2, [2, 4]], ['zebra', 3, [5, 8]], ['gazelle', 3, [4, 7]], ['rhino', 2, [1, 2]], ['hyena', 2, [3, 5]]],
  12: [['tiger', 2, [1, 1]], ['elephant', 2, [3, 5]], ['deer', 2, [3, 5]], ['boar', 2, [3, 4]], ['viper', 3, [1, 1]]]
};
const OWF = { on: false, t: 20, lb: null };
const OW_MORE = 1.3;   // every land a third fuller than its list says
// the box around each land, for throwing animals into it
function owLandBoxes() {
  const lb = {};
  for (let iz = 0; iz < OW.V; iz += 2) for (let ix = 0; ix < OW.V; ix += 2) {
    const i = iz * OW.V + ix, L = RG2[i]; if (L < 5 || L > 12 || HM2[i] < 0.5) continue;
    const x = owX(ix), z = owZ(iz), b = lb[L] || (lb[L] = [x, x, z, z]);
    if (x < b[0]) b[0] = x; if (x > b[1]) b[1] = x; if (z < b[2]) b[2] = z; if (z > b[3]) b[3] = z;
  }
  OWF.lb = lb;
}
function owFaunaWake() {
  if (OWF.on) return; OWF.on = true;
  owFaunaTpls(); buildHorseTpls(); owFarmTpls(); owWildTpls(); owLandBoxes();
  owFaunaFill(true);
}
// keep each land's animals near their numbers (the hunter does not see them being born: they come at a distance)
function owFaunaFill(first) {
  const f = QUAL[SET.q].fauna * faunaK(), have = {};
  for (const a of ANIMALS) if (a.owf && a.alive) have[a.owf] = (have[a.owf] || 0) + 1;
  // every kind in every land gets its turn, a group at a time (so no land is left empty when the count runs out)
  const L0 = [];
  for (const Ls in OW_FAUNA) for (const [id, groups, g] of OW_FAUNA[Ls]) {
    if (!SPECIES[id]) continue;
    const key = Ls + ':' + id, target = Math.max(1, Math.round(groups * (g[0] + g[1]) / 2 * clamp(f, 0.4, 1.2) * OW_MORE));
    L0.push({ id, L: +Ls, g, target, n: have[key] || 0, fail: 0 });
  }
  let made = 0;
  const cap = first ? 900 : 16;
  for (let round = 0; round < 14 && made < cap; round++) {
    let any = false;
    for (const e of L0) {
      if (made >= cap || e.fail > 1 || e.n >= e.target * (first ? 1 : 0.6)) continue;
      const k = owSpawn(e.id, e.L, Math.max(1, Math.min(e.target - e.n, Math.round(rr(e.g[0], e.g[1])))), !first);
      if (!k) { e.fail++; continue; }
      e.n += k; made += k; any = true;
      if (!first && made >= cap) break;
    }
    if (!any) break;
  }
  return made;
}
function owSpawn(id, L, n, far) {
  const sp = SPECIES[id], B = OWF.lb && OWF.lb[L]; if (!sp || !B) return 0;
  if (sp.ai === 'owbird') return owBirdSpawn(id, L, n, far);
  const hab = sp.hab === 'water' ? 'water' : sp.hab === 'snow' ? 'snow' : sp.ai === 'viper' || sp.ai === 'snake' ? 'any' : sp.hab === 'forest' ? 'forest' : 'open';
  const byWater = id === 'hippo';
  let c = null;
  for (let t = 0; t < 320 && !c; t++) {
    const x = rr(B[0], B[1]), z = rr(B[2], B[3]);
    if (owLandAt(x, z) !== L || (far && P.a && Math.hypot(x - P.a.pos.x, z - P.a.pos.z) < 170)) continue;
    // crocodiles in rivers and lakes (not the open sea), hippos on their banks
    if (hab === 'water') { const wd = waterDepth(x, z); if (wd < 1.0 || wd > 7 || owH(x, z) < -12 || HUNT.camps.some(q => !q.gone && Math.abs(q.x - x) < 70 && Math.abs(q.z - z) < 70)) continue; c = { x, z }; break; }
    const h = getH(x, z); if (h < 0.6 || h > 85 || waterDepth(x, z) > 0 || getNY(x, z) < 0.82 || roadFine(x, z)) continue;
    if (byWater && t < 300) { const w = nearestWaterOW(x, z, 40); if (!w) continue; }
    if (HUNT.camps.some(q => !q.gone && Math.abs(q.x - x) < 90 && Math.abs(q.z - z) < 90)) continue;
    const fo = gridAt(FOREST, x, z);
    if (t < 220 && ((hab === 'forest' && fo < 0.25) || (hab === 'open' && fo > 0.45) || (hab === 'snow' && z > -1150))) continue;
    c = { x, z };
  }
  if (!c) return 0;
  const ai = sp.ai;
  let grp = null;
  if (ai === 'pack') { grp = { kind: 'pack', members: [], state: 'roam', t: 0, think: rr(0, 3), hunger: rr(20, 70), sp: id }; GROUPS.push(grp); }
  else if (n > 1) { grp = { kind: 'herd', members: [], leader: null }; GROUPS.push(grp); }
  for (let i = 0; i < n; i++) {
    let x = c.x + rr(-6, 6), z = c.z + rr(-6, 6); if (waterDepth(x, z) > 0) { x = c.x; z = c.z; }
    const a = new Animal(id, x, z, { group: grp, young: id === 'horse' && i >= 3 && rng() < 0.3 }); a.ground(1, true); a.owf = L + ':' + id;
    if (grp) { grp.members.push(a); if (grp.kind === 'pack') a.slot = i; else if (!grp.leader) grp.leader = a; }
    if (ai === 'viper' || ai === 'snake') { a.state = 'rest'; a.stT = rr(5, 40); }
  }
  return n;
}
function owFaunaUpdate(dt) {
  if (!OWF.on || (OWF.t -= dt) > 0) return; OWF.t = 25;
  if (P.a && isOld(P.a.pos.x)) owFaunaFill(false);
}

// ---------- the air of each land of the Old World: its haze, its heat, its snow ----------
// the Old World's lands borrow the New World's weather: Europe, China, Japan and India like the jungle's, the north
// like the frozen north, the steppe and Africa like the savanna, Arabia like the desert, the open sea like the coast
const OW_ATMO = { 5: 0, 6: 1, 7: 2, 8: 0, 9: 0, 10: 3, 11: 2, 12: 0 };
const _aw = [1, 0, 0, 0, 0];
function atmoW(x, z) {
  if (inMain(x, z)) return landW(x, z);
  _aw.fill(0);
  if (!inOld(x, z)) { _aw[4] = 1; return _aw; }
  const k = owLandK(owU(x), owV(z)), W0 = owLandW(owU(x), owV(z)), land = smooth(-0.04, 0.06, k);
  for (let L = 5; L <= 12; L++) if (W0[L] > 0) _aw[OW_ATMO[L]] += W0[L] * land;
  _aw[4] += 1 - land;
  return _aw;
}
Object.assign(LAND_TELL, {
  5: 'ממלכות של אבירים: טירות מאבן, עיירות עם טחנות רוח וכפרים של כרמים. ביערות יש איילים אדומים, חזירי בר, זאבים ודובים, ובדרכים בין הערים אורבים שודדים',
  6: 'ארץ הוויקינגים: פיורדים, יערות אורן ושלג. איילי צפון, מוסים, זאבים ודובים. בצפון הרחוק קר מאוד, ומדורה שומרת עליך חם',
  7: 'ערבה של עשב בלי סוף: המונגולים רוכבים כאן על סוסים וגרים באוהלים עגולים. עדרים של סוסי בר וצבאים, וזאבים שצדים אותם',
  8: 'האימפריה הסינית: העיר האסורה, פגודות ושדות אורז ליד הנהרות. ביערות ההרים יש טיגריסים, איילים וחזירי בר',
  9: 'איי יפן: טירת השוגון, עצי דובדבן פורחים והר פוג׳י. הסמוראים שומרים על הטירה',
  10: 'מדבר חם ויבש: הצמא בא מהר בצהריים, והמים נמצאים בנילוס. ערים של כיפות וצריחים, פירמידות, גמלים וראמים',
  11: 'הסוואנה של אפריקה: ממלכת מאלי וטימבוקטו. אריות, פילים, ג׳ירפות, זברות וקרנפים',
  12: 'ממלכת המהרג׳ה: ארמונות של כיפות, יער עבות ונהר הגנגס. טיגריסים ופילים, ונחשים בשבילים'
});
