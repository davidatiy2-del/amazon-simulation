// ================= EVEN MORE ANIMALS OF THE OLD WORLD: more of them, and many more kinds =================
// Hares on the meadows and the steppe, lynxes in the forests, snow leopards in China's mountains, saigas on the steppe,
// musk oxen in the north. Africa gets great herds of wildebeest, warthogs, baboons and Cape buffalo; India its spotted
// chital deer, langur monkeys and sloth bears; China its red pandas. And birds over every land: storks and cranes in the
// fields and marshes, pink flamingos in the shallows, golden eagles and vultures circling high, peacocks in India.
SP('hare', { he: 'ארנבת', lat: 'Lepus europaeus', kind: 'quad', ai: 'herb', hp: 14, dmg: 2, walk: 1.4, run: 13, swim: 1, reach: 0.6, atkCD: 1, sense: 30, safe: 40, food: 12, turn: 10,
  count: 0, group: [1, 1], hab: 'open', size: [0.9, 1.1], danger: 0, diet: 'עשב, עלים ופרחים', tpls: ['hare', 'hare2'],
  guide: 'רצה מהר מאוד בזיגזג, ואוזניה הארוכות שומעות טורף מרחוק. היא לא חופרת מחילה: היא מסתתרת בגומה קטנה בעשב.' });
SP('lynx', { he: 'שונר', lat: 'Lynx lynx', kind: 'quad', ai: 'pred', hp: 80, dmg: 16, walk: 1.6, run: 11, swim: 1.5, reach: 1.4, atkCD: 0.75, sense: 40, food: 35, turn: 8,
  prey: ['hare', 'deer', 'reindeer', 'boar', 'sheep', 'goat', 'redfox'], count: 0, group: [1, 1], hab: 'forest', size: [0.92, 1.06], danger: 1, night: 0.6, diet: 'ארנבות ואיילים קטנים', tpls: ['lynx'],
  guide: 'חתול היער הגדול של אירופה, עם ציציות שחורות על האוזניים וזנב קצר. הוא אורב בשקט וזינוקו מפתיע.' });
SP('snowleopard', { he: 'נמר השלגים', lat: 'Panthera uncia', kind: 'quad', ai: 'pred', hp: 140, dmg: 26, walk: 1.8, run: 12, swim: 1.5, reach: 1.8, atkCD: 0.8, sense: 46, food: 60, turn: 7,
  prey: ['ibex', 'yak', 'goat', 'sheep', 'hare', 'deer', 'saiga'], count: 0, group: [1, 1], hab: 'open', size: [0.92, 1.05], danger: 3, night: 0.4, diet: 'יעלים, כבשי בר ועזים', tpls: ['snowleopard'],
  guide: 'רוח ההרים: אפור בהיר עם כתמים, וזנב עבה וארוך שהוא מתעטף בו בקור. כמעט אף אחד לא רואה אותו.' });
SP('saiga', { he: 'סייגה', lat: 'Saiga tatarica', kind: 'quad', ai: 'herb', hp: 40, dmg: 6, walk: 1.6, run: 12, swim: 1.2, reach: 1, atkCD: 1, sense: 40, safe: 55, food: 30, turn: 7,
  count: 0, group: [1, 1], hab: 'open', size: [0.92, 1.06], danger: 0, herd: true, diet: 'עשב ושיחים', tpls: ['saiga'],
  guide: 'אנטילופה של הערבות עם אף נפוח ומוזר, שמסנן אבק בקיץ ומחמם אוויר בחורף. עדרים ענקיים נודדים על פני הערבה.' });
SP('muskox', { he: 'שור המושק', lat: 'Ovibos moschatus', kind: 'quad', ai: 'herb', hp: 180, dmg: 22, walk: 1.0, run: 7, swim: 1.2, reach: 1.6, atkCD: 1.2, sense: 28, safe: 40, food: 140, turn: 4,
  count: 0, group: [1, 1], hab: 'open', size: [0.95, 1.08], danger: 2, herd: true, fight: 1, diet: 'עשב, טחב ושיחים', tpls: ['muskox'],
  guide: 'חי בקור של הצפון בפרווה ארוכה עד הקרקע. כשזאבים באים, העדר נעמד במעגל, הקרניים החוצה והצעירים באמצע.' });
SP('wildebeest', { he: 'גנו', lat: 'Connochaetes taurinus', kind: 'quad', ai: 'herb', hp: 120, dmg: 14, walk: 1.4, run: 11, swim: 1.6, reach: 1.4, atkCD: 1.1, sense: 32, safe: 50, food: 100, turn: 5,
  count: 0, group: [1, 1], hab: 'open', size: [0.94, 1.06], danger: 1, herd: true, fight: 0.6, diet: 'עשב', tpls: ['wildebeest'],
  guide: 'מיליוני גנו נודדים בכל שנה אחרי הגשם והעשב, וחוצים נהרות מלאי תנינים. ראש גדול, זקן וקרניים מעוקלות.' });
SP('warthog', { he: 'חזיר יבלות', lat: 'Phacochoerus africanus', kind: 'quad', ai: 'herb', hp: 70, dmg: 14, walk: 1.3, run: 9, swim: 1, reach: 1, atkCD: 1, sense: 26, safe: 40, food: 55, turn: 6,
  count: 0, group: [1, 1], hab: 'open', size: [0.92, 1.06], danger: 1, herd: true, fight: 0.6, diet: 'עשב ושורשים', tpls: ['warthog'],
  guide: 'כורע על ברכי הרגליים הקדמיות כדי לאכול עשב קצר. כשהוא בורח, הזנב שלו זקוף כמו אנטנה.' });
SP('baboon', { he: 'בבון', lat: 'Papio anubis', kind: 'quad', ai: 'herb', hp: 60, dmg: 14, walk: 1.4, run: 8.5, swim: 1, reach: 1, atkCD: 0.7, sense: 34, safe: 40, food: 25, turn: 8,
  count: 0, group: [1, 1], hab: 'open', size: [0.9, 1.1], danger: 1, herd: true, fight: 0.8, diet: 'כל-אוכל: פירות, זרעים, חרקים', tpls: ['baboon'],
  guide: 'קוף שחי על הקרקע בלהקות גדולות ורועשות. לזכרים ניבים ארוכים, והם מגינים על הלהקה גם מנמרים.' });
SP('capebuffalo', { he: 'תאו אפריקני', lat: 'Syncerus caffer', kind: 'quad', ai: 'herb', hp: 260, dmg: 34, walk: 1.1, run: 9, swim: 1.6, reach: 1.7, atkCD: 1.2, sense: 30, safe: 45, food: 180, turn: 4,
  count: 0, group: [1, 1], hab: 'open', size: [0.95, 1.08], danger: 3, herd: true, fight: 1, diet: 'עשב', tpls: ['capebuffalo'],
  guide: 'אחת החיות המסוכנות באפריקה: עדר שלם יוצא להציל אחד מהם, ואפילו אריות נזהרים. הקרניים שלו מתאחדות למגן על המצח.' });
SP('chital', { he: 'צבי מנוקד', lat: 'Axis axis', kind: 'quad', ai: 'herb', hp: 60, dmg: 8, walk: 1.5, run: 11, swim: 1.5, reach: 1.1, atkCD: 1, sense: 36, safe: 50, food: 45, turn: 7,
  count: 0, group: [1, 1], hab: 'forest', size: [0.92, 1.06], danger: 0, herd: true, diet: 'עשב, עלים ופירות', tpls: ['chital', 'chital2'],
  guide: 'איילה של הודו בפרווה זהובה עם כתמים לבנים כל חייה. היא מסתובבת ליד להקות של קופי לנגור שמזהירים אותה מטיגריסים.' });
SP('langur', { he: 'לנגור', lat: 'Semnopithecus entellus', kind: 'quad', ai: 'herb', hp: 30, dmg: 6, walk: 1.5, run: 8, swim: 1, reach: 0.9, atkCD: 0.7, sense: 36, safe: 40, food: 12, turn: 9,
  count: 0, group: [1, 1], hab: 'forest', size: [0.9, 1.1], danger: 0, herd: true, fight: 0.4, diet: 'עלים, פירות ופרחים', tpls: ['langur'],
  guide: 'קוף אפור עם פנים שחורות וזנב ארוך מאוד. בהודו הוא קדוש, וחי גם ליד מקדשים וכפרים.' });
SP('slothbear', { he: 'דוב שפתני', lat: 'Melursus ursinus', kind: 'quad', ai: 'herb', hp: 150, dmg: 26, walk: 1.0, run: 7.5, swim: 1.4, reach: 1.4, atkCD: 1, sense: 26, safe: 30, food: 90, turn: 5,
  count: 0, group: [1, 1], hab: 'forest', size: [0.92, 1.05], danger: 2, fight: 1, diet: 'טרמיטים, נמלים ופירות', tpls: ['slothbear'],
  guide: 'דוב שחור ופרוע עם V לבן על החזה. הוא שואב טרמיטים מהקן בשפתיים הארוכות שלו, ברעש שנשמע מרחוק.' });
SP('redpanda', { he: 'פנדה אדומה', lat: 'Ailurus fulgens', kind: 'quad', ai: 'herb', hp: 22, dmg: 5, walk: 1.0, run: 6, swim: 1, reach: 0.7, atkCD: 0.8, sense: 28, safe: 35, food: 10, turn: 8,
  count: 0, group: [1, 1], hab: 'forest', size: [0.9, 1.1], danger: 0, diet: 'במבוק, פירות וביצים', tpls: ['redpanda'],
  guide: 'למרות השם, היא לא קרובה לפנדה הענקית. פרווה אדומה, פנים לבנות וזנב עבה עם טבעות, ורוב היום היא ישנה על עץ.' });
// birds of the Old World: they stand in the fields and the shallows, fly off when you come near, and land a little farther
const OWBIRD = { stork: { fly: 9, alt: 18, wade: true }, crane: { fly: 9, alt: 20, wade: true }, flamingo: { fly: 10, alt: 14, wade: true, shy: 26 }, peacock: { fly: 6, alt: 7, short: true, shy: 12 },
  eagle: { soar: true, alt: 55, R: 60, fly: 9 }, griffon: { soar: true, alt: 70, R: 75, fly: 9 } };
SP('stork', { he: 'חסידה לבנה', lat: 'Ciconia ciconia', kind: 'bird', ai: 'owbird', hp: 14, fly: 9, food: 8, count: 0, group: [1, 1], hab: 'air', size: [0.95, 1.05], danger: 0, sense: 30, diet: 'צפרדעים, חרקים ודגים',
  guide: 'עוף גדול ולבן עם כנפיים שחורות ומקור אדום. החסידות בונות קנים ענקיים על גגות, ובכל סתיו נודדות מאירופה לאפריקה.' });
SP('crane', { he: 'עגור', lat: 'Grus japonensis', kind: 'bird', ai: 'owbird', hp: 16, fly: 9, food: 9, count: 0, group: [1, 1], hab: 'air', size: [0.95, 1.05], danger: 0, sense: 32, diet: 'דגים, צפרדעים וזרעים',
  guide: 'סמל של מזל ושל חיים ארוכים ביפן ובסין. זוגות העגורים רוקדים זה לזה בחורף: קופצים, פורשים כנפיים וקוראים.' });
SP('flamingo', { he: 'פלמינגו', lat: 'Phoenicopterus roseus', kind: 'bird', ai: 'owbird', hp: 12, fly: 10, food: 8, count: 0, group: [1, 1], hab: 'air', size: [0.95, 1.05], danger: 0, sense: 34, diet: 'סרטנים קטנים ואצות',
  guide: 'הצבע הוורוד בא מהאוכל: סרטנים זעירים ואצות שהוא מסנן מהמים במקור הפוך. הוא עומד שעות על רגל אחת.' });
SP('peacock', { he: 'טווס', lat: 'Pavo cristatus', kind: 'bird', ai: 'owbird', hp: 16, fly: 6, food: 10, count: 0, group: [1, 1], hab: 'air', size: [0.95, 1.05], danger: 0, sense: 26, diet: 'זרעים, חרקים ונחשים קטנים',
  guide: 'הציפור הלאומית של הודו. הזכר פורש מניפה ענקית של נוצות עם עיניים כחולות-ירוקות, וצעקתו נשמעת בכל היער.' });
SP('eagle', { he: 'עיט זהוב', lat: 'Aquila chrysaetos', kind: 'bird', ai: 'owbird', hp: 40, fly: 12, food: 16, count: 0, group: [1, 1], hab: 'air', size: [0.95, 1.05], danger: 0, sense: 90, diet: 'ארנבות, מרמיטות ושועלים',
  guide: 'דואה במעגלים גבוה מעל הערבות וההרים ורואה ארנבת מקילומטר. אצל המונגולים מאלפים עיטים לציד.' });
SP('griffon', { he: 'נשר מקראי', lat: 'Gyps fulvus', kind: 'bird', ai: 'owbird', hp: 34, fly: 10, food: 14, count: 0, group: [1, 1], hab: 'air', size: [0.95, 1.05], danger: 0, sense: 90, diet: 'נבלות',
  guide: 'עוף ענק שדואה שעות על זרמי אוויר חם בלי להניף כנף. כשאחד רואה פגר ויורד, כל הנשרים באזור באים אחריו.' });
Object.assign(PACKN, { saiga: 'עדרי סייגות', muskox: 'עדרי שוורי מושק', wildebeest: 'עדרי גנו', warthog: 'משפחות חזירי יבלות', baboon: 'להקות בבונים', capebuffalo: 'עדרי תאואים', chital: 'עדרי צבאים מנוקדים', langur: 'להקות לנגורים' });
for (const id of ['hare', 'saiga', 'chital', 'warthog', 'wildebeest']) if (!HUNTER_PREY.includes(id)) HUNTER_PREY.push(id);
for (const [p, list] of [['wolf', ['hare', 'saiga', 'muskox']], ['lion', ['wildebeest', 'warthog', 'capebuffalo', 'baboon']], ['hyena', ['wildebeest', 'warthog']], ['leopard', ['baboon', 'warthog', 'chital', 'langur']],
  ['cheetah', ['hare', 'warthog']], ['tiger', ['chital', 'langur', 'warthog']], ['redfox', ['hare']], ['brownbear', ['hare']], ['crocodile', ['wildebeest', 'warthog', 'baboon']]])
  if (SPECIES[p]) SPECIES[p].prey = [...new Set([...(SPECIES[p].prey || []), ...list])];
// ---------- how they look ----------
function owWildTpls() {
  if (TPL.hare) return;
  owFaunaTpls(); owFarmTpls();
  // the hare: long hind legs, long ears tipped black
  const hare = c => Q({ L: 0.34, chestR: 0.1, hipR: 0.13, wid: 0.82, legLen: 0.2, legR: 0.022, pawR: 0.026, frontLen: 0.85, neckLen: 0.07, neckR: 0.07, neckUp: 0.5, headR: 0.07, snoutLen: 0.05, snoutR: 0.04,
    ear: 'none', tailLen: 0.06, tailR: 0.035, tailN: 1, eyeR: 0.17, c,
    extra: k => { const ec = col(c.fur), et = col('#1a1612'); for (const s of [-1, 1]) { const e = onEll(k.cc, k.cr, [s * 0.3, 0.9, -0.3]); k.R.add(new THREE.SphereGeometry(1, 10, 8), M([e[0] + s * 0.012, e[1] + 0.07, e[2] - 0.02], [-0.45, 0, -s * 0.12], [0.026, 0.085, 0.012]), k.head, (x, y) => y > e[1] + 0.13 ? et : ec, 1); } } });
  TPL.hare = hare({ fur: '#9a7a54', belly: '#e8dcc6', nose: '#2a2018', eye: '#2a1a0c', tail: '#f2ece0' });
  TPL.hare2 = hare({ fur: '#a8865c', belly: '#ece2ce', nose: '#2a2018', eye: '#2a1a0c', tail: '#f2ece0' });
  // the lynx: a short tail, long legs, tufted ears, faint spots
  const Pu = TPL.puma.o;
  TPL.lynx = buildQuad(Object.assign({}, Pu, { L: 0.78, chestR: 0.21, hipR: 0.21, legLen: 0.5, headR: 0.11, tailLen: 0.16, tailR: 0.04, tailN: 2, tailTip: 1, pat: 5, patCol: '#6e5236', patScale: 15,
    c: { fur: '#b8956a', belly: '#ece0cc', nose: '#7a4a3a', eye: '#c9a040', jaw: '#f0e8da', snout: '#e8dccb', tailTip: '#1a1410' },
    extra: k => { const bl = col('#1a1410'); for (const s of [-1, 1]) { const e = onEll(k.cc, k.cr, [s * 0.62, 0.72, -0.28]); k.R.add(new THREE.ConeGeometry(0.012, 0.07, 5), M([e[0] + s * 0.005, e[1] + 0.085, e[2]], [0, 0, -s * 0.1]), k.head, bl, 0); }
      for (const s of [-1, 1]) k.R.add(new THREE.ConeGeometry(0.035, 0.09, 6), M([k.cc[0] + s * k.hr * 0.75, k.cc[1] - k.hr * 0.35, k.cc[2] - k.hr * 0.1], [0, 0, s * 2.4]), k.head, col('#e8dccb'), 1); } }));
  // the snow leopard: smoky grey with rosettes, a long thick tail
  const J = TPL.jaguar.o;
  TPL.snowleopard = buildQuad(Object.assign({}, J, { L: 0.92, chestR: 0.23, hipR: 0.22, legLen: 0.44, headR: 0.125, tailLen: 0.95, tailR: 0.07, tailTip: 0.95, patScale: 6.5, patCol: '#4a4644',
    c: Object.assign({}, J.c, { fur: '#cfcac0', belly: '#eeebe4', snout: '#e6e2da', jaw: '#eeebe4', eye: '#9ab0a0' }) }));
  // the saiga: a pale antelope with a big soft nose; the males with amber horns
  const G0 = TPL.gazelle.o;
  TPL.saiga = buildQuad(Object.assign({}, G0, { L: 0.62, chestR: 0.19, hipR: 0.19, legLen: 0.46, headR: 0.08, snoutLen: 0.1, snoutR: 0.06,
    c: { fur: '#c8ac7a', belly: '#f0e6d2', nose: '#7a6a58', eye: '#120e0c', snout: '#b89c6c', legs: '#c0a474' },
    extra: k => { k.R.add(new THREE.SphereGeometry(1, 10, 8), M([k.sc[0], k.sc[1] + k.sr * 0.15, k.sc[2] + k.sl * 0.55], null, [k.sr * 1.15, k.sr * 1.05, k.sl * 0.55]), k.head, col('#b89c6c'), 1);
      const hc = col('#d8c090'); for (const s of [-1, 1]) { const a = V(k.cc[0] + s * k.hr * 0.3, k.cc[1] + k.cr[1] * 0.8, k.cc[2] - k.hr * 0.05), b = a.clone().add(V(s * 0.01, 0.15, -0.02)); hornSeg(k, a, b, 0.012, 0.006, k.head, hc); } } }));
  // the musk ox: a heap of dark brown hair to the ground, horns that sweep down and up
  TPL.muskox = Q(Object.assign({}, TPL.yak.o, { L: 0.95, chestR: 0.42, hipR: 0.36, legLen: 0.36, htF: 1.15, c: { fur: '#3a2a1e', belly: '#34261a', nose: '#1a1410', eye: '#120e0c', ear: '#34261a', legs: '#c8b89a', head: '#4a3828' },
    extra: k => {
      k.R.add(new THREE.CylinderGeometry(0.4, 0.48, 0.42, 14, 1, true), M([0, k.by - 0.24, 0], [Math.PI / 2, 0, 0], [0.84, 1.85, 0.78]), (x, y, z) => [k.hips, k.chest, clamp((z + k.L / 2) / k.L, 0, 1)], k.C.fur, 1);
      const hc = col('#d8ccb4'); k.R.add(new THREE.SphereGeometry(1, 10, 6), M([k.cc[0], k.cc[1] + k.cr[1] * 0.75, k.cc[2] - k.hr * 0.05], null, [k.hr * 0.95, k.hr * 0.22, k.hr * 0.5]), k.head, hc, 0);
      for (const s of [-1, 1]) { let p = V(k.cc[0] + s * k.hr * 0.8, k.cc[1] + k.cr[1] * 0.6, k.cc[2]); for (const d of [[0.08, -0.1, 0.02], [0.03, -0.1, 0.05], [0.02, 0.06, 0.06]]) { const q = p.clone().add(V(d[0] * s, d[1], d[2])); hornSeg(k, p, q, 0.035, 0.022, k.head, hc); p = q; } }
    } }));
  // Africa: the wildebeest (a dark grey cow-antelope with a beard and a mane), the warthog, the baboon, the Cape buffalo
  const C0 = TPL.cow.o;
  TPL.wildebeest = Q(Object.assign({}, C0, { L: 0.95, chestR: 0.3, hipR: 0.24, legLen: 0.6, legR: 0.045, htF: 1.25, htB: 0.88, neckLen: 0.34, neckR: 0.11, headR: 0.12, snoutLen: 0.2, snoutR: 0.075,
    c: { fur: '#5a5654', belly: '#4a4644', nose: '#1a1816', eye: '#120e0c', ear: '#3a3634', legs: '#4a4644', tail: '#1a1816', head: '#2e2c2a' },
    colorFn: (q, x, y, z, nx, ny) => (ny < 0.4 && Math.abs(x) < 0.18 && z > 0.05 && z < 0.4) ? col('#4a4644') : q,
    extra: k => {
      const bk = col('#1a1816'), J2 = k.R.wp[k.jaw]; k.R.add(new THREE.ConeGeometry(0.05, 0.22, 7), M([J2.x, J2.y - 0.12, J2.z - 0.04], [Math.PI, 0, 0]), k.head, bk, 1);
      { const N0 = k.R.wp[k.neck], H0 = k.R.wp[k.head], [mm, mL] = limbM(new V3(0, N0.y + 0.1, N0.z - 0.12), new V3(0, H0.y + 0.06, H0.z - 0.06)); k.R.add(new THREE.BoxGeometry(0.035, mL, 0.1), mm, k.neck, bk, 1); }
      const hc = col('#2a2624'); for (const s of [-1, 1]) { const a = V(k.cc[0] + s * k.hr * 0.6, k.cc[1] + k.cr[1] * 0.55, k.cc[2]), b = a.clone().add(V(s * 0.12, -0.02, 0)), d = b.clone().add(V(s * 0.02, 0.1, 0.03)); hornSeg(k, a, b, 0.024, 0.02, k.head, hc); hornSeg(k, b, d, 0.02, 0.006, k.head, hc); }
    } }));
  TPL.warthog = Q(Object.assign({}, TPL.boar.o, { L: 0.62, legLen: 0.36, headR: 0.14, snoutLen: 0.2, c: { fur: '#5e5450', belly: '#5a504c', nose: '#3a302c', eye: '#140e0c', jaw: '#6a605a', ear: '#4a403c' },
    extra: k => { const iv = col('#ece2c8'); for (const s of [-1, 1]) { const a = V(k.sc[0] + s * k.sr * 0.8, k.sc[1] - k.sr * 0.25, k.sc[2] + k.sl * 0.25), b = a.clone().add(V(s * 0.05, 0.1, 0.02)), d = b.clone().add(V(s * 0.0, 0.04, -0.05)); hornSeg(k, a, b, 0.018, 0.014, k.head, iv); hornSeg(k, b, d, 0.014, 0.005, k.head, iv); }
      for (const s of [-1, 1]) k.R.add(new THREE.SphereGeometry(0.03, 6, 5), M([k.cc[0] + s * k.hr * 0.75, k.cc[1] - k.hr * 0.2, k.cc[2] + k.hr * 0.5]), k.head, col('#5e5450'), 1);
      { const N0 = k.R.wp[k.neck], H0 = k.R.wp[k.head], [mm, mL] = limbM(new V3(0, N0.y + 0.1, N0.z - 0.25), new V3(0, H0.y + 0.08, H0.z - 0.1)); k.R.add(new THREE.BoxGeometry(0.03, mL, 0.07), mm, k.neck, col('#3a302c'), 1); } } }));
  const Mq = TPL.macaque.o;
  TPL.baboon = buildQuad(Object.assign({}, Mq, { L: 0.58, chestR: 0.2, hipR: 0.17, legLen: 0.42, headR: 0.11, snoutLen: 0.12, snoutR: 0.05, tailLen: 0.38, tailN: 3,
    c: Object.assign({}, Mq.c, { fur: '#7c7050', belly: '#8a7e5e', head: '#7c7050', snout: '#3a3430', nose: '#2a2420', tail: '#6a5e40' }) }));
  TPL.capebuffalo = Q(Object.assign({}, TPL.buffalo.o, { L: 1.15, chestR: 0.42, hipR: 0.36, legLen: 0.55, c: { fur: '#2a2624', belly: '#262220', nose: '#151312', eye: '#120e0c', ear: '#2a2624', legs: '#22201e' },
    extra: k => { const hc = col('#3a3632'); k.R.add(new THREE.SphereGeometry(1, 10, 6), M([k.cc[0], k.cc[1] + k.cr[1] * 0.78, k.cc[2] - k.hr * 0.1], null, [k.hr * 1.1, k.hr * 0.2, k.hr * 0.45]), k.head, hc, 0);
      for (const s of [-1, 1]) { let p = V(k.cc[0] + s * k.hr * 0.9, k.cc[1] + k.cr[1] * 0.6, k.cc[2] - k.hr * 0.05); for (const d of [[0.12, -0.08, 0], [0.08, -0.04, 0.03], [0.02, 0.1, 0.05]]) { const q = p.clone().add(V(d[0] * s, d[1], d[2])); hornSeg(k, p, q, 0.04, 0.026, k.head, hc); p = q; } } } }));
  // India: the chital with white spots, the grey langur with a black face, the shaggy sloth bear
  const chital = fur => buildQuad(Object.assign({}, TPL.hind.o, { L: 0.82, legLen: 0.66, pat: 5, patCol: '#f2ece0', patScale: 12, c: { fur, belly: '#f2ece0', nose: '#2a2018', eye: '#120e0c', legs: '#a8743c' }, colorFn: null }));
  TPL.chital = chital('#b8743a'); TPL.chital2 = chital('#c4824a');
  { const ex = TPL.chital.o; TPL.chital = buildQuad(Object.assign({}, ex, { extra: k => { const ac = col('#6a5440'); for (const s of [-1, 1]) { let p = V(k.cc[0] + s * k.hr * 0.4, k.cc[1] + k.cr[1] * 0.8, k.cc[2] - k.hr * 0.1); for (const d of [[0.05, 0.16, -0.06], [0.03, 0.14, 0.02]]) { const q = p.clone().add(V(d[0] * s, d[1], d[2])); hornSeg(k, p, q, 0.014, 0.01, k.head, ac); p = q; } const t = p.clone().add(V(s * 0.04, 0.05, 0.06)); hornSeg(k, V(p.x, p.y - 0.12, p.z), t, 0.01, 0.005, k.head, ac); } } })); }
  TPL.langur = buildQuad(Object.assign({}, TPL.howler.o, { L: 0.44, chestR: 0.14, hipR: 0.13, headR: 0.09, tailLen: 0.85, tailN: 6,
    c: Object.assign({}, TPL.howler.o.c, { fur: '#a8a49c', belly: '#d8d4cc', head: '#d8d4cc', snout: '#141210', nose: '#141210', tail: '#9a968e' }) }));
  TPL.slothbear = Q(Object.assign({}, TPL.brownbear.o, { L: 0.9, headR: 0.14, snoutLen: 0.16, c: { fur: '#141210', belly: '#141210', nose: '#c8b8a0', eye: '#151010', snout: '#c8b8a0', paw: '#2a2420' },
    colorFn: (q, x, y, z, nx, ny, nz, C, by) => (z > 0.32 && z < 0.48 && ny < 0.2 && Math.abs(Math.abs(x) - (0.48 - z) * 0.8) < 0.04) ? col('#efe8da') : q, extra: null }));
  TPL.redpanda = buildQuad(Object.assign({}, TPL.coati.o, { L: 0.46, chestR: 0.13, hipR: 0.14, legLen: 0.18, headR: 0.08, snoutLen: 0.05, snoutR: 0.04, tailLen: 0.42, tailR: 0.05, ring: 9, patCol: '#6a2a12',
    c: { fur: '#b8481e', belly: '#2a1a14', nose: '#141010', eye: '#0e0a08', snout: '#f2ece2', head: '#c8582a', legs: '#2a1a14', ear: '#f2ece2' } }));
  // the birds
  const B = o => buildBird(o);
  TPL.stork = B({ r: 0.13, len: 0.62, headR: 0.06, neckLen: 0.2, legLen: 0.5, span: 1.9, chord: 0.36, tailLen: 0.2, tailW: 0.18, tailTaper: 0.3, beak: 'needle', beakLen: 0.22,
    c: { body: '#f4f2ec', head: '#f4f2ec', wing: '#f4f2ec', wingMid: '#1a1816', wingTip: '#141210', tail: '#f4f2ec', beak: '#d8402a', legs: '#d8402a' } });
  TPL.crane = B({ r: 0.13, len: 0.66, headR: 0.06, neckLen: 0.3, legLen: 0.6, span: 2.0, chord: 0.36, tailLen: 0.2, tailW: 0.2, tailTaper: 0.3, beak: 'needle', beakLen: 0.16, crest: true,
    c: { body: '#f6f4ee', head: '#f6f4ee', face: '#141210', throat: '#141210', neck: '#1a1816', crest: '#d8302a', wing: '#f6f4ee', wingMid: '#f6f4ee', wingTip: '#141210', tail: '#141210', beak: '#8a8a6a', legs: '#2a2a2a' } });
  TPL.flamingo = B({ r: 0.11, len: 0.5, headR: 0.055, neckLen: 0.42, legLen: 0.72, span: 1.4, chord: 0.28, tailLen: 0.14, tailW: 0.14, tailTaper: 0.3, beak: 'hook', beakLen: 0.09,
    c: { body: '#f2a0a8', head: '#f4b0b4', wing: '#f08890', wingMid: '#e86878', wingTip: '#141210', tail: '#f2a0a8', beak: '#f0d8d0', beak2: '#141210', legs: '#e87a88' } });
  TPL.peacock = B({ r: 0.14, len: 0.5, headR: 0.055, neckLen: 0.12, legLen: 0.3, span: 1.1, chord: 0.3, tailLen: 1.0, tailW: 0.34, tailTaper: -0.4, beak: 'hook', beakLen: 0.04, crest: true,
    c: { body: '#1a4fb0', head: '#1a5ac0', face: '#f2f2f2', wing: '#a88a5a', wingMid: '#8a6a3a', wingTip: '#6a4a2a', tail: '#2a7a3a', tailTip: '#1a5aa8', crest: '#1a5ac0', beak: '#8a7a6a', legs: '#6a6a6a' } });
  TPL.eagle = B({ r: 0.17, len: 0.78, headR: 0.075, span: 2.1, chord: 0.5, tailLen: 0.3, tailW: 0.28, tailTaper: 0.2, beak: 'hook', beakLen: 0.07,
    c: { body: '#5a3a22', head: '#c89048', wing: '#4a3020', wingMid: '#3a2618', wingTip: '#1e140c', tail: '#3a2618', beak: '#2a2420', beak2: '#e8c040', legs: '#e8c040' } });
  TPL.griffon = B({ r: 0.19, len: 0.82, headR: 0.07, span: 2.5, chord: 0.62, tailLen: 0.22, tailW: 0.3, tailTaper: 0.2, beak: 'hook', beakLen: 0.08,
    c: { body: '#b89a72', head: '#ece6da', throat: '#ece6da', wing: '#a88a62', wingMid: '#4a3a2a', wingTip: '#1e1812', tail: '#2a2018', beak: '#d8c8a8', legs: '#8a8a8a' } });
}
for (const id of ['stork', 'crane', 'flamingo', 'peacock', 'eagle', 'griffon']) SPECIES[id].tpls = [id];
// which land keeps which (added to OW_FAUNA): [species, groups, [smallest, biggest]]
const OW_FAUNA3 = {
  5: [['hare', 4, [1, 2]], ['lynx', 1, [1, 1]], ['stork', 3, [3, 6]], ['eagle', 1, [1, 1]]],
  6: [['muskox', 2, [5, 8]], ['lynx', 1, [1, 1]], ['hare', 2, [1, 1]], ['eagle', 1, [1, 1]]],
  7: [['saiga', 3, [6, 10]], ['hare', 3, [1, 2]], ['eagle', 2, [1, 1]], ['snowleopard', 1, [1, 1]], ['crane', 1, [3, 5]]],
  8: [['redpanda', 2, [1, 2]], ['snowleopard', 1, [1, 1]], ['crane', 2, [3, 5]]],
  9: [['crane', 3, [2, 4]], ['hare', 2, [1, 1]], ['eagle', 1, [1, 1]]],
  10: [['flamingo', 2, [8, 12]], ['griffon', 2, [2, 4]], ['stork', 1, [4, 6]], ['hare', 2, [1, 1]], ['baboon', 1, [5, 8]]],
  11: [['wildebeest', 4, [8, 14]], ['warthog', 3, [3, 5]], ['baboon', 2, [6, 9]], ['capebuffalo', 2, [5, 8]], ['flamingo', 2, [10, 16]], ['griffon', 2, [3, 5]]],
  12: [['chital', 4, [5, 9]], ['langur', 3, [6, 9]], ['slothbear', 2, [1, 1]], ['peacock', 3, [2, 4]], ['flamingo', 1, [6, 10]]]
};
for (const L in OW_FAUNA3) OW_FAUNA[L] = (OW_FAUNA[L] || []).concat(OW_FAUNA3[L]);
// ---------- the birds: a flock with a place of its own ----------
function owBirdSpawn(id, L, n, far) {
  const B = OWF.lb && OWF.lb[L], ob = OWBIRD[id]; if (!B || !ob) return 0;
  let c = null;
  for (let t = 0; t < 260 && !c; t++) {
    const x = rr(B[0], B[1]), z = rr(B[2], B[3]);
    if (owLandAt(x, z) !== L || (far && P.a && Math.hypot(x - P.a.pos.x, z - P.a.pos.z) < 170)) continue;
    const h = getH(x, z); if (h < (ob.wade ? -0.5 : 0.6) || h > 60 || getNY(x, z) < 0.86) continue;
    if (ob.wade && t < 200 && !nearestWaterOW(x, z, 50)) continue;
    if (HUNT.camps.some(q => !q.gone && Math.abs(q.x - x) < 80 && Math.abs(q.z - z) < 80)) continue;
    c = { x, z };
  }
  if (!c) return 0;
  const f = { kind: 'skyflock', sp: id, members: [], home: c, pos: new V3(c.x, getH(c.x, c.z), c.z), tgt: new V3(c.x, 0, c.z), state: ob.soar ? 'soar' : 'ground', t: rr(20, 80), offs: [], ang: rng() * TAU, ob };
  for (let i = 0; i < n; i++) f.offs.push(new V3(rr(-1, 1) * (1.2 + n * 0.35), rr(-1, 1), rr(-1, 1) * (1.2 + n * 0.35)));
  if (ob.soar) f.pos.y = Math.max(getH(c.x, c.z), 0) + ob.alt;
  GROUPS.push(f);
  for (let i = 0; i < n; i++) {
    const o = f.offs[i], a = new Animal(id, c.x + o.x, c.z + o.z, { group: f }); a.slot = i; a.owf = L + ':' + id; a.ownY = true;
    a.pos.set(c.x + o.x, ob.soar ? f.pos.y + o.y * 4 : owBirdGround(c.x + o.x, c.z + o.z) + (a.tpl.footY || 0.1) * a.scale, c.z + o.z);
    f.members.push(a);
  }
  return n;
}
const owBirdGround = (x, z) => { const h = getH(x, z); return h < 0 ? -0.18 : h; };
// where a flock lands next: dry ground or shallows near its home, not too steep, not in a town
function owBirdSpot(f) {
  const ob = f.ob, R = ob.short ? 40 : 160;
  for (let t = 0; t < 14; t++) {
    const x = f.home.x + rr(-R, R), z = f.home.z + rr(-R, R), h = getH(x, z);
    if (h < (ob.wade ? -0.5 : 0.4) || getNY(x, z) < 0.85 || HUNT.camps.some(q => !q.gone && Math.abs(q.x - x) < 60 && Math.abs(q.z - z) < 60)) continue;
    return { x, z };
  }
  return { x: f.home.x, z: f.home.z };
}
function owBirdsUpdate(dt) {
  const p = P.a;
  for (const f of GROUPS) {
    if (f.kind !== 'skyflock') continue;
    f.members = f.members.filter(m => m.alive && !m.gone); if (!f.members.length) { f.dead = true; continue; }
    const ob = f.ob; f.t -= dt;
    if (f.state === 'soar') {
      // round and round on the warm air, the circle drifting slowly
      f.ang += dt * (ob.fly / ob.R) * 0.6;
      if (f.t <= 0) { f.t = rr(40, 90); const s = owBirdSpot(f); f.tgt.set(s.x, 0, s.z); }
      f.home2 = f.home2 || { x: f.home.x, z: f.home.z }; f.home2.x += (f.tgt.x - f.home2.x) * Math.min(1, dt * 0.02); f.home2.z += (f.tgt.z - f.home2.z) * Math.min(1, dt * 0.02);
      f.pos.set(f.home2.x + Math.cos(f.ang) * ob.R, Math.max(getH(f.home2.x, f.home2.z), 0) + ob.alt + Math.sin(f.ang * 0.7) * 6, f.home2.z + Math.sin(f.ang) * ob.R);
      continue;
    }
    if (f.state === 'ground') {
      const d = p && p.alive ? Math.hypot(p.pos.x - f.pos.x, p.pos.z - f.pos.z) : 1e9, shy = ob.shy || 18;
      if ((d < shy && !(P.crouch && d > shy * 0.55)) || f.t <= 0 || f.scared) {
        f.scared = false; f.state = 'fly'; f.t = rr(40, 110); const s = owBirdSpot(f); f.tgt.set(s.x, owBirdGround(s.x, s.z), s.z);
        if (d < 60 && f.members[0]) AUD.at('flap', f.members[0].pos, 0.6);
      }
      continue;
    }
    // in the air: up, across, and down again
    const dx = f.tgt.x - f.pos.x, dz = f.tgt.z - f.pos.z, dh = Math.hypot(dx, dz) || 0.01;
    const cruise = dh > 25 ? Math.max(getH(f.pos.x, f.pos.z), 0) + ob.alt : f.tgt.y + 0.5;
    f.pos.x += dx / dh * Math.min(ob.fly, dh * 1.2 + 0.5) * dt; f.pos.z += dz / dh * Math.min(ob.fly, dh * 1.2 + 0.5) * dt;
    f.pos.y += clamp((cruise - f.pos.y) * 0.9, -5, 5) * dt;
    if (dh < 1.5 && Math.abs(f.pos.y - f.tgt.y) < 1.2) { f.state = 'ground'; f.t = rr(35, 100); f.pos.y = f.tgt.y; }
  }
  for (let i = GROUPS.length - 1; i >= 0; i--) if (GROUPS[i].dead) GROUPS.splice(i, 1);
}
BRAIN.owbird = function (a, dt) {
  const f = a.group; if (!f || f.kind !== 'skyflock') { a.pose = 'ground'; return; }
  const o = f.offs[a.slot % f.offs.length];
  if (f.state === 'ground') {
    const gx = f.pos.x + o.x, gz = f.pos.z + o.z; _tmp.set(gx, owBirdGround(gx, gz) + (a.tpl.footY || 0.1) * a.scale, gz);
    if (a.pos.distanceTo(_tmp) > 0.5) { flyToward(a, _tmp, 6, dt, 4); a.pose = 'fly'; }
    else { a.pos.lerp(_tmp, Math.min(1, dt * 4)); a.vel.set(0, 0, 0); a.vy = 0; a.bank = 0; a.speed = 0; a.pose = 'ground'; a.yaw += Math.sin(G.t * 0.3 + a.id) * dt * 0.4; }
  } else {
    const k = f.state === 'soar' ? 5 : 1.4;
    _tmp.set(f.pos.x + o.x * k + Math.sin(G.t * 0.6 + a.slot) * 1.2, f.pos.y + o.y * (f.state === 'soar' ? 4 : 0.8), f.pos.z + o.z * k + Math.cos(G.t * 0.5 + a.slot) * 1.2);
    flyToward(a, _tmp, (f.ob.fly || 9) * 1.3, dt, 2.5); a.pose = 'fly'; a.glide = f.state === 'soar' || f.ob.soar ? 1 : 0.3;
  }
  if (a.scared > 0) { a.scared -= dt; if (f.state === 'ground') f.scared = true; }
  if (a.hp < a.maxHp * 0.98 && f.state === 'ground' && G.t - (a.lastHitT || -99) < 2) f.scared = true;
};
