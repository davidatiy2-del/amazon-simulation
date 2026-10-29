// ================= MORE ANIMALS OF THE OLD WORLD: the towns' livestock and the wild animals of every land =================
// Sheep, goats, pigs, donkeys, water buffalo and yaks live by the towns of the peoples who keep them; pandas in China's
// bamboo, snow monkeys in Japan, red foxes and bison in Europe, ibex on the rocks, hippos and crocodiles in Africa's and
// Egypt's rivers, leopards and cheetahs on the savanna. Wild animals keep away from the towns.
SP('sheep', { he: 'כבשה', lat: 'Ovis aries', kind: 'quad', ai: 'herb', hp: 40, dmg: 4, walk: 1.2, run: 6.5, swim: 1, reach: 1, atkCD: 1, sense: 24, safe: 40, food: 45, turn: 5,
  count: 0, group: [1, 1], hab: 'open', size: [0.92, 1.08], danger: 0, herd: true, diet: 'עשב', tpls: ['sheep', 'sheep', 'sheep2'],
  guide: 'מהבהמות הראשונות שהאדם ביית. הצמר שלה נגזז פעם בשנה ונטווה לבגדים חמים, והעדר הולך תמיד אחרי הכבשה שלפניו.' });
SP('goat', { he: 'עז', lat: 'Capra hircus', kind: 'quad', ai: 'herb', hp: 38, dmg: 6, walk: 1.3, run: 7, swim: 1, reach: 1, atkCD: 1, sense: 26, safe: 40, food: 40, turn: 7,
  count: 0, group: [1, 1], hab: 'open', size: [0.92, 1.08], danger: 0, herd: true, fight: 0.5, diet: 'עשב, עלים וקוצים', tpls: ['goat', 'goat2', 'goat3'],
  guide: 'אוכלת כמעט כל צמח, מטפסת על סלעים ואפילו על עצים. נותנת חלב, גבינה ושיער לאריגת אוהלים.' });
SP('pig', { he: 'חזיר בית', lat: 'Sus domesticus', kind: 'quad', ai: 'herb', hp: 60, dmg: 6, walk: 1.1, run: 6, swim: 1.2, reach: 1, atkCD: 1, sense: 22, safe: 35, food: 70, turn: 5,
  count: 0, group: [1, 1], hab: 'open', size: [0.9, 1.1], danger: 0, herd: true, diet: 'כל-אוכל', tpls: ['pig', 'pig2'],
  guide: 'בן הבית של חזיר הבר. חכם מאוד, מחפש אוכל בחוטם ומתפלש בבוץ כדי להתקרר.' });
SP('donkey', { he: 'חמור', lat: 'Equus asinus', kind: 'quad', ai: 'herb', hp: 80, dmg: 9, walk: 1.3, run: 8, swim: 1, reach: 1.3, atkCD: 1.1, sense: 26, safe: 45, food: 70, turn: 5,
  count: 0, group: [1, 1], hab: 'open', size: [0.92, 1.06], danger: 0, herd: true, fight: 0.7, diet: 'עשב וקש', tpls: ['donkey', 'donkey2'],
  guide: 'סבלן שנושא משאות כבדים בדרכים ההרריות והמדבריות. כשמשהו לא מוצא חן בעיניו הוא נעצר ולא זז, ואת הנעירה שלו שומעים מרחוק.' });
SP('buffalo', { he: 'תאו מים', lat: 'Bubalus bubalis', kind: 'quad', ai: 'herb', hp: 150, dmg: 16, walk: 1.1, run: 6, swim: 2.2, reach: 1.5, atkCD: 1.2, sense: 24, safe: 40, food: 120, turn: 4,
  count: 0, group: [1, 1], hab: 'open', size: [0.95, 1.08], danger: 1, herd: true, fight: 0.9, diet: 'עשב וצמחי מים', tpls: ['buffalo'],
  guide: 'אוהב לשכב במים ובבוץ. בשדות האורז של סין והודו הוא מושך את המחרשה, ובלעדיו לא היה אורז.' });
SP('yak', { he: 'יאק', lat: 'Bos grunniens', kind: 'quad', ai: 'herb', hp: 140, dmg: 14, walk: 1.1, run: 6.5, swim: 1.2, reach: 1.5, atkCD: 1.2, sense: 26, safe: 45, food: 120, turn: 4,
  count: 0, group: [1, 1], hab: 'open', size: [0.95, 1.08], danger: 1, herd: true, fight: 0.9, diet: 'עשב', tpls: ['yak', 'yak2'],
  guide: 'פר ההרים, מכוסה שיער ארוך שמגן מקור עז. נותן חלב, צמר ובשר, ונושא משאות בגבהים.' });
SP('panda', { he: 'פנדה ענקית', lat: 'Ailuropoda melanoleuca', kind: 'quad', ai: 'herb', hp: 120, dmg: 18, walk: 0.9, run: 5, swim: 1.5, reach: 1.4, atkCD: 1.1, sense: 24, safe: 35, food: 90, turn: 4,
  count: 0, group: [1, 1], hab: 'forest', size: [0.9, 1.05], danger: 1, fight: 0.8, diet: 'במבוק, כמעט רק במבוק', land: 8,
  guide: 'דוב שבחר להיות צמחוני. היא אוכלת במבוק כחצי יום, כי יש בו מעט מאוד מזון, ויש לה אצבע נוספת שעוזרת לאחוז בגבעולים.' });
SP('macaque', { he: 'מקוק', lat: 'Macaca fuscata', kind: 'quad', ai: 'herb', hp: 26, dmg: 6, walk: 1.5, run: 7.5, swim: 1.6, reach: 0.9, atkCD: 0.6, sense: 30, safe: 40, food: 10, turn: 9,
  count: 0, group: [1, 1], hab: 'forest', size: [0.9, 1.1], danger: 0, herd: true, fight: 0.6, diet: 'פירות, עלים, זרעים וחרקים', land: 9, tpls: ['macaque'],
  guide: 'קוף השלג של יפן: חי צפונה יותר מכל קוף אחר, ובחורף מתחמם במעיינות חמים. להקות המקוק לומדות זו מזו, למשל לשטוף אוכל במים.' });
SP('redfox', { he: 'שועל אדום', lat: 'Vulpes vulpes', kind: 'quad', ai: 'pred', hp: 40, dmg: 8, walk: 1.5, run: 11, swim: 1.5, reach: 1, atkCD: 0.7, sense: 34, food: 25, turn: 8,
  prey: ['macaque'], count: 0, group: [1, 1], hab: 'forest', size: [0.92, 1.08], danger: 0, night: 0.5, diet: 'מכרסמים, ציפורים, פירות', land: 5,
  guide: 'הטורף הנפוץ בעולם, מאירופה ועד יפן. הוא שומע עכבר מתחת לשלג, קופץ גבוה ונוחת עליו בדיוק.' });
SP('ibex', { he: 'יעל', lat: 'Capra ibex', kind: 'quad', ai: 'herb', hp: 70, dmg: 12, walk: 1.4, run: 9, swim: 1, reach: 1.2, atkCD: 1, sense: 40, safe: 55, food: 55, turn: 7,
  count: 0, group: [1, 1], hab: 'open', size: [0.92, 1.08], danger: 0, herd: true, fight: 0.5, diet: 'עשב ועלים', land: 10, tpls: ['ibex'],
  guide: 'מטפס מופלא על צוקים תלולים. לזכרים קרניים ארוכות ומעוקלות, והם נאבקים בהן על הנקבות בסתיו.' });
SP('bison', { he: 'ביזון אירופי', lat: 'Bison bonasus', kind: 'quad', ai: 'herb', hp: 200, dmg: 22, walk: 1.2, run: 8, swim: 1.5, reach: 1.6, atkCD: 1.2, sense: 30, safe: 50, food: 160, turn: 4,
  count: 0, group: [1, 1], hab: 'forest', size: [0.95, 1.08], danger: 2, herd: true, fight: 0.9, diet: 'עשב, עלים וקליפות', land: 5, tpls: ['bison'],
  guide: 'היונק הכבד ביותר באירופה. עדרים קטנים של ביזונים חיים ביערות העתיקים, ובחורף הם מקלפים קליפות עצים.' });
SP('hippo', { he: 'היפופוטם', lat: 'Hippopotamus amphibius', kind: 'quad', ai: 'herb', hp: 300, dmg: 40, walk: 1.0, run: 7.5, swim: 3.5, reach: 2.0, atkCD: 1.4, sense: 26, safe: 30, food: 200, turn: 3,
  count: 0, group: [1, 1], hab: 'open', size: [0.95, 1.08], danger: 3, herd: true, fight: 1, diet: 'עשב, בלילה', land: 11, tpls: ['hippo'],
  guide: 'מבלה את היום במים ויוצא לרעות בלילה. נראה רגוע, אבל הוא מהחיות המסוכנות באפריקה: הוא מגן בחירוף נפש על המים שלו.' });
SP('crocodile', { he: 'תנין היאור', lat: 'Crocodylus niloticus', kind: 'quad', ai: 'croc', hp: 260, dmg: 45, walk: 1.2, run: 5, swim: 7, reach: 2.6, atkCD: 1.2, sense: 28, food: 120, turn: 3,
  prey: ['gazelle', 'zebra', 'goat', 'sheep', 'donkey', 'deer', 'boar', 'cow', 'camel', 'ibex'], count: 0, group: [1, 1], hab: 'water', size: [1.0, 1.15], danger: 3, diet: 'דגים וכל מי שבא לשתות', land: 11, tpls: ['crocodile'],
  guide: 'הזוחל הגדול של הנילוס. הוא מחכה בלי לזוז ליד מקום השתייה, ומזנק מהמים במהירות מדהימה.' });
SP('leopard', { he: 'נמר', lat: 'Panthera pardus', kind: 'quad', ai: 'pred', hp: 150, dmg: 28, walk: 2, run: 12.5, swim: 2.5, reach: 2, atkCD: 0.75, sense: 44, food: 70, turn: 6,
  prey: ['gazelle', 'deer', 'boar', 'macaque', 'goat', 'sheep', 'ibex'], count: 0, group: [1, 1], hab: 'forest', size: [0.92, 1.05], danger: 3, night: 0.7, call: 'jaguar', diet: 'טורף', land: 11, tpls: ['leopard'],
  guide: 'החתול הגדול החזק ביחס לגודלו: הוא גורר טרף כבד ממנו אל ראש עץ, הרחק מאריות וצבועים.' });
SP('cheetah', { he: 'ברדלס', lat: 'Acinonyx jubatus', kind: 'quad', ai: 'pred', hp: 100, dmg: 20, walk: 2, run: 17, swim: 1.5, reach: 1.8, atkCD: 0.7, sense: 50, food: 50, turn: 7,
  prey: ['gazelle', 'oryx'], count: 0, group: [1, 2], hab: 'open', size: [0.94, 1.04], danger: 1, diet: 'צבאים', land: 11, tpls: ['cheetah'],
  guide: 'החיה המהירה ביבשה, יותר מ־100 קמ״ש בזינוק קצר. אחרי הריצה היא חייבת לנוח, ואז אריות וצבועים גונבים לה את הטרף.' });
for (const id of ['sheep', 'goat', 'pig', 'donkey', 'buffalo', 'yak']) SPECIES[id].home = true;
Object.assign(PACKN, { sheep: 'עדרי כבשים', goat: 'עדרי עזים', macaque: 'להקות מקוקים', ibex: 'עדרי יעלים', bison: 'עדרי ביזונים', hippo: 'להקות היפופוטמים' });
for (const [p, list] of [['wolf', ['sheep', 'goat', 'ibex']], ['brownbear', ['sheep', 'goat', 'pig']], ['tiger', ['buffalo', 'macaque', 'goat']], ['lion', ['buffalo', 'donkey', 'goat']], ['hyena', ['goat', 'sheep', 'donkey']]])
  if (SPECIES[p]) SPECIES[p].prey = [...new Set([...(SPECIES[p].prey || []), ...list])];
// ---------- how they look ----------
function owFarmTpls() {
  if (TPL.sheep) return;
  buildLandTpls(); buildHerdTpls(); buildHorseTpls();
  const A = TPL.alpaca.o, T = TPL.tapir.o, H = TPL.horse.o;
  // sheep: a round woolly body, a dark face and legs
  const sheep = (wool, face) => Q(Object.assign({}, A, { L: 0.58, chestR: 0.24, hipR: 0.24, wid: 0.92, legLen: 0.4, legR: 0.03, pawR: 0.035, neckLen: 0.16, neckR: 0.1, neckUp: 0.45, headR: 0.085, headWid: 0.8, snoutLen: 0.1, snoutR: 0.05,
    ear: 'round', earR: 0.04, earX: 0.9, earUp: 0.3, earZ: -0.1, tailLen: 0.08, tailR: 0.04, tailN: 1, eyeR: 0.14, c: { fur: wool, belly: wool, nose: '#2a2420', eye: '#120e0c', head: face, snout: face, legs: face, ear: face, jaw: face },
    extra: k => { for (let i = 0; i < 10; i++) { const a = i * 2.39, h = (i % 3) * 0.06; k.R.add(new THREE.SphereGeometry(0.1, 7, 5), M([Math.sin(a) * 0.14, k.by + 0.1 + h, Math.cos(a) * 0.22], null, [1, 0.85, 1]), (x, y, z) => [k.hips, k.chest, clamp((z + k.L / 2) / k.L, 0, 1)], k.C.fur, 1); } } }));
  TPL.sheep = sheep('#ece6d6', '#2a2420'); TPL.sheep2 = sheep('#4a3e36', '#1e1a18');
  // goats: horns curving back, a little beard
  const goat = (c, h2) => Q(Object.assign({}, A, { L: 0.6, chestR: 0.19, hipR: 0.18, wid: 0.78, legLen: 0.46, legR: 0.03, pawR: 0.035, neckLen: 0.28, neckR: 0.08, neckUp: 0.75, headR: 0.08, headWid: 0.8, snoutLen: 0.13, snoutR: 0.045,
    ear: 'point', earR: 0.04, earUp: 0.4, tailLen: 0.1, tailR: 0.025, tailN: 1, eyeR: 0.15, c,
    extra: k => {
      const hc = col(h2 || '#6a5a4a');
      for (const s of [-1, 1]) { const a = V(k.cc[0] + s * k.hr * 0.3, k.cc[1] + k.cr[1] * 0.75, k.cc[2] - k.hr * 0.1), b = a.clone().add(V(s * 0.02, 0.1, -0.08)), d = b.clone().add(V(s * 0.03, 0.04, -0.1)); hornSeg(k, a, b, 0.018, 0.014, k.head, hc); hornSeg(k, b, d, 0.014, 0.006, k.head, hc); }
      const J = k.R.wp[k.jaw]; k.R.add(new THREE.ConeGeometry(0.025, 0.09, 6), M([J.x, J.y - 0.06, J.z + 0.06], [Math.PI, 0, 0]), k.head, k.C.fur, 1);
    } }));
  TPL.goat = goat({ fur: '#f0ece2', belly: '#e8e2d6', nose: '#3a3028', eye: '#a08020', ear: '#e0d8c8' });
  TPL.goat2 = goat({ fur: '#7a5434', belly: '#6a4a2e', nose: '#2a2018', eye: '#a08020', ear: '#6a4a2e' }, '#3a2e24');
  TPL.goat3 = goat({ fur: '#2a2624', belly: '#e8e2d6', nose: '#1a1614', eye: '#a08020', ear: '#2a2624', legs: '#e8e2d6' }, '#4a4038');
  // pigs: a pink (or spotted) round body, a flat snout, a curl of tail
  const pig = (c) => Q(Object.assign({}, TPL.peccary.o, { L: 0.66, chestR: 0.27, hipR: 0.27, wid: 0.88, legLen: 0.3, legR: 0.04, pawR: 0.04, neckR: 0.18, headR: 0.13, snoutLen: 0.16, snoutR: 0.075, ear: 'point', earR: 0.05, earUp: 0.6, tailLen: 0.12, tailR: 0.015, tailN: 2, c, extra: null }));
  TPL.pig = pig({ fur: '#e8b0a0', belly: '#e0a494', nose: '#d08a80', eye: '#1a120c', jaw: '#e0a494', ear: '#d89a8a', snout: '#e0a090' });
  TPL.pig2 = pig({ fur: '#e8c0b0', belly: '#e0b4a4', nose: '#d08a80', eye: '#1a120c', jaw: '#e0b4a4', ear: '#3a3030', snout: '#e0a090' });
  // donkeys: small horses, grey, long ears, a pale muzzle and belly
  const donkey = (c) => Q(Object.assign({}, H, { L: 0.95, chestR: 0.3, hipR: 0.3, legLen: 0.7, neckLen: 0.5, neckR: 0.145, neckUp: 0.85, headR: 0.135, snoutLen: 0.36, snoutR: 0.098, ear: 'none', tailLen: 0.5, tailR: 0.022, tailBush: false, tailTip: 1.9, c,
    colorFn: (q, x, y, z, nx, ny, nz, C, by) => (Math.abs(x) < 0.028 && ny > 0.8 && Math.abs(z) < 0.42) ? col(c.stripe || '#3a3430') : q,
    extra: k => { const ec = col(c.ear), ei = col(c.earIn || '#d8d0c4'); for (const s of [-1, 1]) { const e = onEll(k.cc, k.cr, [s * 0.42, 0.85, -0.2]); k.R.add(new THREE.SphereGeometry(1, 10, 8), M([e[0] + s * 0.03, e[1] + 0.1, e[2] - 0.02], [-0.25, 0, -s * 0.3], [0.04, 0.12, 0.022]), k.head, ec, 1); k.R.add(new THREE.SphereGeometry(1, 8, 6), M([e[0] + s * 0.03, e[1] + 0.1, e[2] - 0.006], [-0.25, 0, -s * 0.3], [0.026, 0.09, 0.012]), k.head, ei, 0); } } }));
  TPL.donkey = donkey({ fur: '#8a8480', belly: '#d8d4ce', nose: '#2a2624', snout: '#a8a29a', eye: '#120e0c', ear: '#7a7470', tail: '#7a7470', tailTip: '#1a1816', legs: '#7a7470', paw: '#2a2624', mane: '#3a3634' });
  TPL.donkey2 = donkey({ fur: '#6a5444', belly: '#c8bca8', nose: '#2a2018', snout: '#9a8c78', eye: '#120e0c', ear: '#5a4434', tail: '#6a5444', tailTip: '#1a1410', paw: '#2a2018', mane: '#2a2018', stripe: '#2a2018' });
  // the water buffalo: dark and heavy, wide horns sweeping back
  const C0 = TPL.cow.o;
  TPL.buffalo = Q(Object.assign({}, C0, { L: 1.15, chestR: 0.4, hipR: 0.36, legLen: 0.55, c: { fur: '#3a3836', belly: '#34322f', nose: '#1a1816', eye: '#120e0c', ear: '#34322f', legs: '#2e2c2a' },
    extra: k => { const hc = col('#4a4640'); for (const s of [-1, 1]) { const a = V(k.cc[0] + s * k.hr * 0.6, k.cc[1] + k.cr[1] * 0.5, k.cc[2] - k.hr * 0.1); let p = a; for (const d of [[0.18, 0.02, -0.06], [0.14, 0.06, -0.14], [0.02, 0.06, -0.14]]) { const q = p.clone().add(V(d[0] * s, d[1], d[2])); hornSeg(k, p, q, 0.04, 0.03, k.head, hc); p = q; } } } }));
  // the yak: long dark hair hanging to the knees, a hump, horns
  const yak = (c) => Q(Object.assign({}, C0, { L: 1.05, chestR: 0.42, hipR: 0.34, legLen: 0.48, htF: 1.2, c,
    extra: k => {
      k.R.add(new THREE.CylinderGeometry(0.4, 0.46, 0.4, 14, 1, true), M([0, k.by - 0.28, 0], [Math.PI / 2, 0, 0], [0.82, 1.8, 0.75]), (x, y, z) => [k.hips, k.chest, clamp((z + k.L / 2) / k.L, 0, 1)], k.C.fur, 1);
      const hc = col('#d8d0c0'); for (const s of [-1, 1]) { const a = V(k.cc[0] + s * k.hr * 0.6, k.cc[1] + k.cr[1] * 0.6, k.cc[2] - k.hr * 0.1), b = a.clone().add(V(s * 0.16, 0.06, 0.02)), d = b.clone().add(V(s * 0.03, 0.14, 0.05)); hornSeg(k, a, b, 0.035, 0.026, k.head, hc); hornSeg(k, b, d, 0.026, 0.008, k.head, hc); }
    } }));
  TPL.yak = yak({ fur: '#2e2620', belly: '#2a221c', nose: '#1a1612', eye: '#120e0c', ear: '#2a221c' });
  TPL.yak2 = yak({ fur: '#2e2620', belly: '#2a221c', nose: '#1a1612', eye: '#120e0c', ear: '#efece6', head: '#efece6' });
  // the panda: a bear in white with black legs, shoulders, ears and patches round the eyes
  const BB = TPL.brownbear.o;
  TPL.panda = Q(Object.assign({}, BB, { L: 1.0, headR: 0.18, headWid: 1.12, snoutLen: 0.1, c: { fur: '#f2efe8', belly: '#f2efe8', nose: '#151010', eye: '#151010', snout: '#f2efe8', paw: '#141212', legs: '#141212', ear: '#141212' },
    colorFn: (c, x, y, z, nx, ny, nz, C, by) => (y < by - 0.12 || (Math.abs(z - 0.32) < 0.14 && y > by - 0.2)) ? col('#141212') : c,
    extra: k => { for (const s of [-1, 1]) { const e = onEll(k.cc, k.cr, [s * 0.5, 0.25, 0.8]); k.R.add(new THREE.SphereGeometry(1, 10, 8), M([e[0], e[1], e[2] - 0.005], [0, 0, s * 0.5], [0.05, 0.035, 0.02]), k.head, col('#141212'), 1); } } }));
  // the snow monkey: grey-brown fur, a red face
  const Hw = TPL.howler.o;
  TPL.macaque = buildQuad(Object.assign({}, Hw, { L: 0.42, chestR: 0.16, hipR: 0.15, legLen: 0.34, headR: 0.1, tailLen: 0.1, tailN: 2, c: Object.assign({}, Hw.c, { fur: '#9a8a76', belly: '#b8a892', head: '#9a8a76', snout: '#d88a80', nose: '#c87a70', tail: '#9a8a76' }) }));
  // the red fox; the ibex with its great horns; the bison with its hump; the hippo; the crocodile
  TPL.redfox = Q(Object.assign({}, TPL.fennec.o, { L: 0.5, legLen: 0.28, headR: 0.075, earR: 0.04, tailLen: 0.42, c: { fur: '#c8642a', belly: '#f2e8d8', nose: '#151010', eye: '#c9a040', snout: '#f2e8d8', legs: '#2a1e18', tailTip: '#f6f2ea' } }));
  TPL.ibex = goat({ fur: '#8a7458', belly: '#d8ccb4', nose: '#2a2018', eye: '#a08020', ear: '#7a6448', legs: '#6a5440' }, '#3a3228');
  { const ib = TPL.ibex.o; TPL.ibex = Q(Object.assign({}, ib, { L: 0.75, chestR: 0.24, hipR: 0.22, legLen: 0.55, extra: k => { const hc = col('#4a4034'); for (const s of [-1, 1]) { let p = V(k.cc[0] + s * k.hr * 0.3, k.cc[1] + k.cr[1] * 0.75, k.cc[2] - k.hr * 0.1); for (let i = 0; i < 5; i++) { const t = i / 4, q = p.clone().add(V(s * 0.012, 0.1 - t * 0.06, -0.06 - t * 0.06)); hornSeg(k, p, q, 0.03 - t * 0.016, 0.026 - t * 0.016, k.head, hc); for (let r = 0; r < 2; r++) k.R.add(new THREE.TorusGeometry(0.03 - t * 0.014, 0.004, 3, 8), M([lerp(p.x, q.x, r * 0.5), lerp(p.y, q.y, r * 0.5), lerp(p.z, q.z, r * 0.5)], [Math.PI / 2 + 0.5, 0, 0]), k.head, hc, 0); p = q; } } } })); }
  TPL.bison = Q(Object.assign({}, C0, { L: 1.2, chestR: 0.46, hipR: 0.33, legLen: 0.56, htF: 1.35, htB: 0.9, headR: 0.17, c: { fur: '#4a3426', belly: '#3e2c20', nose: '#1a1410', eye: '#120e0c', ear: '#2e2018', head: '#2a1e16', legs: '#2e2018' },
    colorFn: (c, x, y, z, nx, ny, nz, C, by) => z > 0.1 ? col('#3a2a1e') : c,
    extra: k => { const hc = col('#2a2420'); for (const s of [-1, 1]) { const a = V(k.cc[0] + s * k.hr * 0.6, k.cc[1] + k.cr[1] * 0.4, k.cc[2]), b = a.clone().add(V(s * 0.1, 0.08, 0.02)); hornSeg(k, a, b, 0.03, 0.01, k.head, hc); } const J = k.R.wp[k.jaw]; k.R.add(new THREE.ConeGeometry(0.06, 0.18, 7), M([J.x, J.y - 0.1, J.z], [Math.PI, 0, 0]), k.head, col('#2a1e16'), 1); } }));
  TPL.hippo = Q({ L: 1.5, chestR: 0.56, hipR: 0.55, wid: 1.0, ht: 0.86, legLen: 0.6, legR: 0.13, pawR: 0.15, shoulderK: 1.2, thighK: 1.3, neckLen: 0.14, neckR: 0.44, neckUp: 0.12, headR: 0.32, headWid: 1.2, headSquash: 0.8, snoutLen: 0.46, snoutR: 0.42, snoutSquash: 0.58,
    ear: 'round', earR: 0.05, earUp: 0.95, tailLen: 0.2, tailR: 0.04, tailN: 1, eyeR: 0.1, eyeDir: [0.45, 0.8, 0.4], htF: 1.05, teeth: true,
    c: { fur: '#7a6a66', belly: '#c89a8a', nose: '#5a4a46', eye: '#120e0c', jaw: '#c89a8a', snout: '#8a7470' },
    extra: k => { for (const s of [-1, 1]) k.R.add(new THREE.SphereGeometry(0.06, 8, 6), M([k.sc[0] + s * 0.14, k.sc[1] + k.sr * 0.55, k.sc[2] + k.sl * 0.3]), k.head, col('#5a4a46'), 1); } });
  if (TPL.caiman) { const Cm = TPL.caiman.o; TPL.crocodile = buildQuad(Object.assign({}, Cm, { L: (Cm.L || 1) * 1.25, c: Object.assign({}, Cm.c, { fur: '#5a6038', belly: '#c8c098', head: '#4e5432' }) })); }
  // the leopard: rosettes on gold; the cheetah: slender, long-legged, solid spots
  const J = TPL.jaguar.o;
  TPL.leopard = buildQuad(Object.assign({}, J, { L: 0.95, chestR: 0.24, hipR: 0.22, legLen: 0.46, headR: 0.13, c: Object.assign({}, J.c, { fur: '#d8b060', belly: '#f2ead8' }), patScale: (J.patScale || 6) * 1.25 }));
  TPL.cheetah = buildQuad(Object.assign({}, J, { L: 0.95, chestR: 0.21, hipR: 0.18, waist: 0.05, legLen: 0.62, legR: 0.04, pawR: 0.05, headR: 0.11, tailLen: 0.75, pat: 5, patCol: '#1a1410', patScale: 11, c: Object.assign({}, J.c, { fur: '#e0b86a', belly: '#f6eedc' }),
    extra: k => { for (const s of [-1, 1]) { const e = onEll(k.cc, k.cr, [s * 0.4, 0.1, 0.9]); k.R.add(new THREE.BoxGeometry(0.012, 0.09, 0.012), M([e[0], e[1] - 0.05, e[2]], [0.3, 0, s * -0.2]), k.head, col('#1a1410'), 0); } } }));
}
// which land keeps which new animals (added to OW_FAUNA): [species, groups, [smallest group, biggest group]]
const OW_FAUNA2 = {
  5: [['redfox', 3, [1, 1]], ['bison', 1, [3, 5]]],
  6: [['redfox', 1, [1, 1]]],
  7: [['redfox', 1, [1, 1]]],
  8: [['panda', 2, [1, 1]], ['macaque', 2, [4, 6]]],
  9: [['macaque', 3, [4, 7]], ['redfox', 1, [1, 1]]],
  10: [['crocodile', 3, [1, 1]], ['ibex', 2, [3, 5]]],
  11: [['hippo', 2, [2, 4]], ['crocodile', 2, [1, 1]], ['leopard', 1, [1, 1]], ['cheetah', 2, [1, 2]]],
  12: [['leopard', 1, [1, 1]], ['macaque', 3, [4, 6]], ['crocodile', 1, [1, 1]]]
};
for (const L in OW_FAUNA2) OW_FAUNA[L] = (OW_FAUNA[L] || []).concat(OW_FAUNA2[L]);
// ---------- the towns' livestock: each people keeps its own animals ----------
const CIV_STOCK = { knights: ['cow', 'sheep', 'sheep', 'pig', 'goat', 'sheep', 'cow'], vikings: ['sheep', 'sheep', 'cow', 'goat', 'pig', 'sheep'], mongols: ['sheep', 'sheep', 'goat', 'yak', 'yak', 'sheep'],
  china: ['pig', 'buffalo', 'pig', 'buffalo', 'goat'], japan: ['buffalo', 'pig', 'goat', 'buffalo'], arabs: ['goat', 'sheep', 'goat', 'donkey', 'camel', 'sheep'], egypt: ['goat', 'cow', 'donkey', 'goat', 'donkey'],
  mali: ['cow', 'goat', 'goat', 'donkey', 'sheep', 'cow'], india: ['cow', 'buffalo', 'goat', 'cow', 'goat'], bandit: ['donkey'] };
function stockOf(camp, grp) {
  const L = CIV_STOCK[camp.bandit ? 'bandit' : camp.civ]; if (!L) return null;
  const n = grp ? grp.members.length : 0; return L[n % L.length];
}
// ---------- wild animals keep out of the towns (the people chase them off) ----------
function owKeepOut(dt) {
  const T = owKeepOut; T.t = (T.t || 0) - dt; if (T.t > 0) return; T.t = 0.5;
  if (!OWF.on) return;
  for (const c of HUNT.camps) {
    if (!c.civ || c.gone || c.dormant || Math.hypot(c.x - camera.position.x, c.z - camera.position.z) > 220) continue;
    const R = (SET_R[c.kind] || 25) + 4;
    shQuery(c.x, c.z, R, (a, d) => {
      if (!a.alive || !a.owf || a.pet || a.tribe || a.hunter || a.mount || a.rider) return;
      const ux = (a.pos.x - c.x) / (d || 1), uz = (a.pos.z - c.z) / (d || 1), tx = c.x + ux * (R + 18), tz = c.z + uz * (R + 18);
      if (a.state === 'fight' || a.state === 'hunt') return;
      a.state = 'goto'; a.goal = { x: tx, z: tz }; a.stT = 12;
    });
  }
}
