// ================= WHEN THE CHIEF LEAVES THE VILLAGE: someone stays in charge, by the order of the tribe =================
// You can choose a deputy. Otherwise, when you go far from the village, the highest in the tribe's order who is there
// takes charge: your deputy, your wife (or husband), your grown children, then the knights, the warriors, the merchants,
// the hunters, the builders and the gatherers (the longest in the tribe first). The one in charge calls everyone to the
// fight when the village is attacked, keeps the work going, receives the envoys who come while you are away, and when you
// come back tells you what happened. Other chiefs and kings leave their villages too, on a visit, a hunt or a journey
// along the roads; then their deputy stands in their place.
const DEP = { uid: 0, away: false, cur: null, farT: 0, t: 0, since: null, snap: null, mark: null, deeds: [], msgs: [], r: null, told: 0 };
const DEP_RANKS = 9;
function depReset() { Object.assign(DEP, { uid: 0, away: false, cur: null, farT: 0, t: 0, since: null, snap: null, mark: null, deeds: [], msgs: [], r: null }); }
// a place in the order of the tribe: 0 the deputy you chose ... 8 the gatherers
function depRankOf(m) {
  if (m.uid && m.uid === DEP.uid) return 0;
  if (m.isPartner) return 1;
  if (LEGACY.heirs.includes(m)) return 2;
  if (m.knight) return 3;
  if (m.cls === 'warrior') return 4;
  if (m.merchant) return 5;
  return m.cls === 'hunter' ? 6 : m.cls === 'builder' ? 7 : 8;
}
function depRankWord(m, r) {
  return r === 0 ? heb(m, 'הסגן שבחרת', 'הסגנית שבחרת') : r === 1 ? heb(m, 'בעלך', 'אשתך') : r === 2 ? heb(m, 'בנך', 'בתך') : clsWord(m);
}
function depChain() {
  return clanAdults().map(m => ({ m, r: depRankOf(m) })).sort((a, b) => a.r - b.r || (a.m.uid || 1e9) - (b.m.uid || 1e9));
}
// who can stand in your place now: in the village, not walking with you, not out on a raid, a ship, a caravan or an errand far away
function depWhyNot(m, v) {
  if (!m.alive || m.gone || m.young) return 'לא כאן';
  if (m.escort) return '🚶 הולך איתך';
  if (m.job && (m.job.k === 'raid' || m.job.k === 'ship' || m.job.k === 'boat' || m.job.k === 'caravan' || m.job.k === 'cart')) return m.job.k === 'raid' ? '⚔️ בפשיטה' : m.job.k === 'caravan' ? '🐪 בשיירה' : '⛵ בדרך';
  if (m.inShip || m.inCart) return '⛵ בדרך';
  if (v && !m.hidden && Math.hypot(m.pos.x - v.x, m.pos.z - v.z) > villageR() + 140) return '📍 רחוק מהכפר';
  return '';
}
const depFree = (m, v) => !depWhyNot(m, v);
function depPick() { const v = ownCamp(), f = depChain().find(q => depFree(q.m, v)); return f ? f.m : null; }
function depChosen() { return DEP.uid ? clanAdults().find(m => m.uid === DEP.uid) || null : null; }
function depChoose(m) {
  if (!m || m.young) return;
  if (DEP.uid !== m.uid) { depSet(m); return; }
  DEP.uid = 0; UI.notify(`${m.name} כבר לא ${heb(m, 'הסגן', 'הסגנית')}. ${you('כשתצא', 'כשתצאי')}, האחראי ייקבע לפי סדר השבט`, '');
  if (DEP.away) { const n = depPick(), was = depWho(); if (n && n !== was) { DEP.cur = n; DEP.r = null; if (was) depBackToWork(was); depDeed(`${n.name} ${heb(n, 'קיבל', 'קיבלה')} את האחריות על הכפר`); } }
  saveGame();
}
// what is in the village now: to tell you later what changed
function depSnap() {
  const st = boxStore();
  return { food: (st.cooked || 0) + (st.meat || 0) + (st.fish || 0), wood: st.wood || 0, gold: goldHave(), pop: popCount(), bld: BLD.list.filter(b => b.done && !BTYPES[b.t].def && b.t !== 'torch').length, births: FAM.births || 0 };
}
// something the one in charge did, for the report
function depDeed(t) { if (DEP.away && DEP.deeds.length < 12) DEP.deeds.push(t); }
const depWho = () => DEP.cur && DEP.cur.alive ? DEP.cur : null;

// ---------- leaving and coming back ----------
function depUpdate(dt) {
  if (DEPASK.t > 0 && ((DEPASK.t -= dt) <= 0 || G.mode !== 'play')) depAskHide();
  const v = ownCamp(), a = P.a;
  if (!P.human || !v || !a || !a.alive || G.mode !== 'play') { if (DEP.away && G.mode === 'play' && !v) depBack(true); return; }
  if ((DEP.t -= dt) > 0) return; DEP.t = 1;
  const d = Math.hypot(ringDX(v.x, a.pos.x), a.pos.z - v.z), R = villageR();
  if (!DEP.away) { DEP.farT = d > R + 110 ? DEP.farT + 1 : 0; if (DEP.farT >= 4) depLeave(v); return; }
  if (d < R + 45) { depBack(); return; }
  // the one in charge fell, or was called away: the next in the order takes over
  const m = DEP.cur;
  if (!m || !depFree(m, v)) {
    const n = depPick();
    if (n !== m) {
      DEP.cur = n;
      if (n) { const why = m && !m.alive ? `${m.name} ${heb(m, 'נפל', 'נפלה')}` : m ? `${m.name} ${heb(m, 'יצא', 'יצאה')} מהכפר` : ''; UI.notify(`🏠 ${why ? why + '. ' : ''}${n.name} (${depRankWord(n, depRankOf(n))}) ${heb(n, 'אחראי', 'אחראית')} עכשיו על הכפר`, ''); depDeed(`${n.name} ${heb(n, 'קיבל', 'קיבלה')} את האחריות על הכפר${why ? ` (${why})` : ''}`); }
    }
  }
  depGuard(v);
}
function depLeave(v) {
  DEP.away = true; DEP.since = { d: G.day, t: G.time }; DEP.snap = depSnap(); DEP.mark = WAR.log[0] || null; DEP.deeds = []; DEP.cur = depPick(); DEP.r = null;
  const m = DEP.cur;
  if (m) {
    UI.notify(`🏠 יצאת מהכפר. ${m.name} (${depRankWord(m, depRankOf(m))}) ${heb(m, 'אחראי', 'אחראית')} על הכפר עד שתחזור`, 'good');
    if (m.dCam < 60) say(m, you('לך בשלום. אני אשמור על הכפר', 'לכי בשלום. אני אשמור על הכפר'), 3);
    depAsk(m);
  } else UI.notify('🏠 יצאת מהכפר, ואין בו אף אחד שיכול להיות אחראי עליו', 'bad');
}
function depBack(silent) {
  const m = DEP.cur, s0 = DEP.snap, since = DEP.since;
  DEP.away = false; DEP.farT = 0; DEP.cur = null; DEP.r = null; depAskHide();
  if (!silent && m && m.alive && !m.gone) depHandStart(m);
  if (silent || !s0 || !since) return;
  const hrs = Math.max(0, (G.day - since.d) * 24 + (G.time - since.t));
  if (hrs >= 1.5 || DEP.deeds.length) depReport(m, s0, hrs);
  else if (DEP.msgs.length) UI.notify('📜 שליחים חיכו לך בכפר', '');
}
// the report: how long you were away, what changed, and what happened
function depReport(m, s0, hrs) {
  const s1 = depSnap(), L = [], diff = (a, b) => b - a > 0 ? `+${b - a}` : `${b - a}`;
  const days = Math.floor(hrs / 24), h = Math.round(hrs - days * 24);
  L.push(`⏳ לא היית בכפר ${days ? `${days === 1 ? 'יום' : `${days} ימים`}${h ? ` ו-${h} שעות` : ''}` : `${Math.max(1, h)} שעות`}`);
  L.push(`🍖 אוכל במחסן: ${s1.food} (${diff(s0.food, s1.food)}) · 🪵 עצים: ${s1.wood} (${diff(s0.wood, s1.wood)})${s1.gold !== s0.gold ? ` · 🪙 זהב: ${s1.gold} (${diff(s0.gold, s1.gold)})` : ''}`);
  if (s1.bld > s0.bld) L.push(`🏗️ נבנו ${s1.bld - s0.bld === 1 ? 'מבנה חדש' : `${s1.bld - s0.bld} מבנים חדשים`}`);
  if (s1.births > s0.births) L.push(`👶 ${s1.births - s0.births === 1 ? 'נולד תינוק' : `נולדו ${s1.births - s0.births} תינוקות`}`);
  if (s1.pop !== s0.pop) L.push(`👥 בכפר ${s1.pop} אנשים (${diff(s0.pop, s1.pop)})`);
  // what was written in the tribe's chronicle since you left
  const news = []; for (const e of WAR.log) { if (e === DEP.mark) break; news.push(e); }
  for (const e of news.slice(0, 6).reverse()) L.push(`${e.k === 'bad' ? '⚠️' : e.k === 'good' ? '✅' : '•'} ${e.t}`);
  for (const t of DEP.deeds.slice(-5)) L.push(`⭐ ${t}`);
  if (m && m.alive) L.push(`👑 ${m.name} ${heb(m, 'מחזיר', 'מחזירה')} לך את הפיקוד על הכפר ${heb(m, 'וחוזר', 'וחוזרת')} להיות ${depRoleWord(m)}`);
  if (DEP.msgs.length) L.push(`📜 ${DEP.msgs.length === 1 ? 'שליח מחכה' : `${DEP.msgs.length} שליחים מחכים`} לך: ${DEP.msgs.map(q => campName(q.i)).join(', ')}`);
  const who = m && m.alive ? m : null, say1 = !who ? 'אנשי הכפר מספרים' : `${who.name}, ${depRankWord(who, depRankOf(who))}, ${heb(who, 'מספר', 'מספרת')}`;
  const quiet = news.length === 0 && DEP.deeds.length === 0;
  const el = uiCard('depov', `<div class="vxwho"><span class="vxic">📜</span><div><h2>${who ? `הדוח של ${who.name}` : 'בזמן שלא היית'}</h2><p class="idim">${say1}</p></div></div>` +
    `<p class="vxsay">"${quiet ? 'היה שקט. כולם עבדו, ושמרנו על הכפר עד שחזרת.' : 'טוב שחזרת. הנה מה שקרה בזמן שלא היית.'}"</p><div class="deprep">${L.map(t => `<div>${t}</div>`).join('')}</div>` +
    '<div class="btns vxbtns"><button class="btn pri" data-a="ok">תודה</button></div>');
  if (who && who.dCam < 40) say(who, 'ברוך שובך!', 2.5);
  el.onclick = e => { const b = e.target.closest('button'); if (!b) return; closeCard('depov'); };
  DEP.deeds = [];
}

// ---------- while you are away: the one in charge keeps the village ----------
// the alarm: when the village is attacked, everyone who can fight is called, and the children and the weak go inside
function depRally(v, foes, why) {
  const m = depWho(), R = villageR();
  let n = 0;
  for (const a of clanAdults()) {
    if (a.escort || !depFree(a, v) || a.state === 'fight') continue;
    if (!(a.cls === 'warrior' || a.cls === 'hunter' || a === m)) continue;
    let best = null, bd = 1e9; for (const f of foes) { if (!f.alive) continue; const d = dist2(f.pos, a.pos); if (d < bd) { bd = d; best = f; } }
    if (!best || bd > R + 160) continue;
    a.hidden = false; a.job = null; a.state = 'fight'; a.foe = best; n++;
  }
  if (m && n) {
    if (m.dCam < 50) say(m, pick(['כולם אליי! להגן על הכפר!', 'לוחמים, אחריי!', 'הילדים לבתים! הלוחמים איתי!']), 2.6);
    UI.notify(`🛡️ ${m.name}: "${why}! כולם להגן על הכפר!" (${n} יצאו להילחם)`, 'bad');
    depDeed(`${heb(m, 'הוביל', 'הובילה')} את ההגנה: ${why}`);
  }
  return n;
}
function depGuard(v) {
  // a war party at the gates
  for (const p of WAR.parties) {
    if (p.done || p.mine || p.to !== 'own' || p.depRally) continue;
    const men = p.men.filter(h => h.alive && !h.gone); if (!men.some(h => dist2(h.pos, v) < villageR() + 70)) continue;
    p.depRally = true; depRally(v, men, `${campName(p.from)} תוקפים`);
  }
}
// in the day the one in charge goes round: sits by the fire to hear everyone, walks round the village; then back to work
function depRoutine(a, dt, v) {
  const R = DEP.r || (DEP.r = { k: 'work', t: rr(8, 20), i: 0, x: 0, z: 0 });
  R.t -= dt;
  if (R.t <= 0) {
    const q = rng(); R.k = a.job && a.job.k !== 'idle' ? 'work' : q < 0.4 ? 'fire' : q < 0.65 ? 'round' : 'work'; R.t = R.k === 'work' ? rr(45, 80) : rr(22, 40); R.i = 0;
    const ang = rng() * TAU, r = rr(3, 4.5); R.x = v.x + Math.cos(ang) * r; R.z = v.z + Math.sin(ang) * r;
    if (R.k !== 'work' && a.dCam < 40) say(a, pick(R.k === 'fire' ? ['מה שלום כולם? למישהו חסר משהו?', 'עד שראש השבט יחזור, אני כאן', 'מחר יוצאים לצוד מוקדם'] : ['עוברים לראות שהכל בסדר', 'השומרים ערים?', 'צריך לתקן את הגדר הזאת']), 2.6);
  }
  if (R.k === 'work') return false;
  a.hidden = false;
  if (R.k === 'fire') {
    const d = jobGo(a, R.x, R.z, a.sp.walk, dt);
    if (d < 1) { a.move(0, 0, 0, dt); a.yaw += angDiff(a.yaw, Math.atan2(a.pos.x - v.x, a.pos.z - v.z)) * Math.min(1, dt * 3); a.pose = 'talk'; }
    return true;
  }
  // round the village: four points on its edge
  const rr0 = Math.max(8, villageR() * 0.8), ang = (R.i % 4) / 4 * TAU + a.id, x = v.x + Math.cos(ang) * rr0, z = v.z + Math.sin(ang) * rr0;
  if (jobGo(a, x, z, a.sp.walk * 1.05, dt) < 2) { R.i++; if (R.i >= 5) R.t = 0; }
  return true;
}
// how the one in charge adds to the village's strength: a fighter leads the defence
function depPower() { const m = DEP.away ? depWho() : null; return !m ? 0 : m.knight ? 1.2 : m.cls === 'warrior' ? 0.9 : 0.4; }
// envoys who came while you were away wait for you
function depHold(k, i) {
  if (DEP.msgs.some(q => q.k === k && q.i === i)) return;
  DEP.msgs.push({ k, i, day: G.day });
  const m = depWho(), c = HUNT.camps[i];
  const what = k === 'ally' ? 'להציע ברית' : k === 'trade' ? 'להציע עסקה' : 'לבקש עזרה במלחמה';
  depDeed(`שליח מ${c ? c.tribe : 'שבט אחר'} בא ${what}. ${m ? `${m.name} ${heb(m, 'ביקש', 'ביקשה')} שיחכה` : 'הוא מחכה'} לך`);
  if (m) UI.notify(`📜 שליח מ${c ? c.tribe : 'שבט אחר'} הגיע לכפר ${what}. ${m.name} ${heb(m, 'ביקש', 'ביקשה')} שיחכה עד שתחזור`, '');
}
// back in the village: the envoys, one by one
function depEnvoys() {
  while (DEP.msgs.length) {
    const q = DEP.msgs.shift(), c = HUNT.camps[q.i];
    if (!c || c.gone || atWar(q.i)) continue;
    if (q.k === 'ally' && !polAllied('own', q.i) && !polAllyWhyNot(q.i)) { polAllyOffer(q.i); return true; }
    if (q.k === 'trade' && POL.trade[q.i] == null) { polTradeOffer(q.i); return true; }
  }
  return false;
}

// ---------- the chief chooses who is in charge, and gets the village back on coming home ----------
// the work someone goes back to: their class, and the order they were on
function depRoleWord(m) { const o = m.ord && !m.ord.done ? ORDT[m.ord.k] : null; return clsWord(m) + (o ? ` (${o.ic} ${o.n})` : ''); }
function npcRoleWord(c, h) { return vxWord(h); }
// someone stops being in charge (another was chosen): back to the usual work
function depBackToWork(m) { if (!m || !m.alive) return; if (DEP.r) DEP.r = null; m.hidden = false; if (m.dCam < 40) say(m, pick(['בסדר. חוזר לעבודה', 'כמו שראש השבט אומר', 'אני חוזר לעבודה שלי']), 2.2); }
// the chief's choice: this one is in charge (and will be every time the chief leaves)
function depSet(m) {
  if (!m || m.young || !m.alive || m.gone) return;
  if (!m.uid) m.uid = ++CLAN.uidN;
  const was = DEP.away ? depWho() : null;
  DEP.uid = m.uid; PROG.flags.deputy = 1;
  if (DEP.away) {
    const why = depWhyNot(m, ownCamp());
    if (why) UI.notify(`⭐ ${m.name} ${heb(m, 'יהיה הסגן', 'תהיה הסגנית')} שלך, אבל ${heb(m, 'הוא', 'היא')} לא בכפר עכשיו (${why}). ${was ? `בינתיים ${was.name} ${heb(was, 'ממשיך', 'ממשיכה')}` : ''}`, '');
    else if (was !== m) {
      DEP.cur = m; DEP.r = null; if (was) depBackToWork(was);
      depDeed(`${m.name} ${heb(m, 'קיבל', 'קיבלה')} את האחריות על הכפר, בפקודה שלך`);
      UI.notify(`📜 שלחת הודעה לכפר: מעכשיו ${m.name} ${heb(m, 'אחראי', 'אחראית')} על הכפר${was ? `, ו${was.name} ${heb(was, 'חוזר', 'חוזרת')} להיות ${depRoleWord(was)}` : ''}`, 'good');
    }
  } else {
    UI.notify(`⭐ ${m.name} ${heb(m, 'הוא הסגן שלך', 'היא הסגנית שלך')}: ${you('כשתצא', 'כשתצאי')} מהכפר, ${heb(m, 'הוא', 'היא')} ${heb(m, 'יהיה אחראי', 'תהיה אחראית')}, ${you('וכשתחזור', 'וכשתחזרי')} ${heb(m, 'יחזור', 'תחזור')} להיות ${depRoleWord(m)}`, 'good');
    if (m.dCam < 40) say(m, you('כשתצא, אשמור על הכפר כאילו היה שלי', 'כשתצאי, אשמור על הכפר כאילו היה שלי'), 3);
  }
  saveGame();
}
// no chosen deputy: the order of the tribe decides
function depAutoSet() {
  DEP.uid = 0;
  if (DEP.away) { const n = depPick(), was = depWho(); if (n && n !== was) { DEP.cur = n; DEP.r = null; if (was) depBackToWork(was); UI.notify(`📜 ${n.name} (${depRankWord(n, depRankOf(n))}) ${heb(n, 'אחראי', 'אחראית')} עכשיו על הכפר`, ''); } }
  else UI.notify(`⭐ אין סגן קבוע: ${you('כשתצא', 'כשתצאי')}, האחראי ייקבע לפי סדר השבט`, '');
  saveGame();
}
// the choosing card: everyone in the order, who can and who cannot now
function depPickCard() {
  const v = ownCamp(); if (!v) return;
  const L = depChain(), cur = DEP.away ? depWho() : depPick();
  const rows = L.slice(0, 12).map(q => {
    const m = q.m, why = depWhyNot(m, v), on = m === cur;
    return `<button class="deppk${on ? ' on' : ''}" data-u="${m.id}"><b>${m.name}</b><small>${depRankWord(m, q.r)}${m.ord && !m.ord.done ? ` · ${ORDT[m.ord.k].ic}` : ''}</small><i>${on ? (DEP.away ? heb(m, '⭐ אחראי עכשיו', '⭐ אחראית עכשיו') : '⭐') : why || ''}</i></button>`;
  }).join('');
  const el = uiCard('depov', `<div class="vxwho"><span class="vxic">⭐</span><div><h2>מי אחראי על הכפר?</h2><p class="idim">${DEP.away ? 'שליח ייקח את ההודעה לכפר. ' : ''}האחראי מוביל את ההגנה, ממשיך את העבודה ומקבל את השליחים. ${you('כשתחזור', 'כשתחזרי')}, ${heb(cur || { sex: 'm' }, 'הוא יחזיר', 'היא תחזיר')} לך את הפיקוד ${heb(cur || { sex: 'm' }, 'ויחזור', 'ותחזור')} לתפקיד ${heb(cur || { sex: 'm' }, 'שלו', 'שלה')}.</p></div></div>` +
    `<div class="deppl">${rows}</div><div class="btns vxbtns"><button class="btn" data-a="auto">${DEP.uid ? '' : '✓ '}לפי סדר השבט</button><button class="btn pri" data-a="ok">סגירה</button></div>`);
  el.onclick = e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    if (b.dataset.u) { const m = clanAdults().find(q => q.id === +b.dataset.u); if (m) { if (depWhyNot(m, v) && !DEP.away) UI.notify(`${m.name} ${heb(m, 'יהיה', 'תהיה')} ${heb(m, 'אחראי', 'אחראית')} כש${heb(m, 'יחזור', 'תחזור')} לכפר`, ''); depSet(m); } depPickCard(); return; }
    if (b.dataset.a === 'auto') { depAutoSet(); depPickCard(); return; }
    closeCard('depov');
  };
}
// leaving the village: a small question at the top of the screen (no pause): keep this one, or choose
const DEPASK = { el: null, t: 0 };
function depAsk(m) {
  const v = ownCamp(); if (!m || depChain().filter(q => depFree(q.m, v)).length < 2) return;
  let el = DEPASK.el;
  if (!el) {
    el = DEPASK.el = document.createElement('div'); el.id = 'depAsk'; el.hidden = true; document.body.appendChild(el);
    el.onclick = e => { const b = e.target.closest('button'); if (!b) return; depAskHide(); if (b.dataset.a === 'pick') depPickCard(); };
  }
  el.innerHTML = `<span>🏠 <b>${m.name}</b> ${heb(m, 'אחראי', 'אחראית')} על הכפר עד ש${you('תחזור', 'תחזרי')}</span><div><button data-a="pick">⭐ לבחור מישהו אחר</button><button data-a="ok">✓ בסדר</button></div>`;
  el.hidden = false; DEPASK.t = 14;
}
function depAskHide() { if (DEPASK.el) DEPASK.el.hidden = true; DEPASK.t = 0; }
// back home: the one who was in charge comes to the chief, hands the village back, and goes back to the usual work
function depHandStart(m) { m.handBack = { t: 25, said: false }; }
function depHandWords(a) {
  say(a, you('ברוך שובך! הכפר שוב בידיים שלך', 'ברוכה השבה! הכפר שוב בידיים שלך'), 3);
  UI.notify(`👑 ${a.name} ${heb(a, 'החזיר', 'החזירה')} לך את הפיקוד על הכפר ${heb(a, 'וחזר', 'וחזרה')} להיות ${depRoleWord(a)}`, 'good');
}
function depHandBack(a, dt) {
  const H = a.handBack, p = P.a;
  if (!H || !p || !p.alive || DEP.away || (H.t -= dt) <= 0) { a.handBack = null; if (H && !H.said && !DEP.away) depHandWords(a); return false; }
  const d = Math.hypot(p.pos.x - a.pos.x, p.pos.z - a.pos.z);
  if (d > 75 || a.state === 'fight') { a.handBack = null; if (!H.said) depHandWords(a); return false; }
  a.hidden = false; if (a.sleepAt) a.sleepAt = null;
  if (d > 2.4 && !H.said) { jobGo(a, p.pos.x, p.pos.z, d > 10 ? a.sp.run * 0.6 : a.sp.walk * 1.2, dt); return true; }
  a.move(0, 0, 0, dt); a.yaw += angDiff(a.yaw, Math.atan2(p.pos.x - a.pos.x, p.pos.z - a.pos.z)) * Math.min(1, dt * 5); a.pose = 'talk';
  if (!H.said) { H.said = true; H.t = 2.8; depHandWords(a); }
  return true;
}
(function () {
  const st = document.createElement('style');
  st.textContent = `#depAsk{position:fixed;z-index:9;top:calc(env(safe-area-inset-top,0px) + 64px);left:50%;transform:translateX(-50%);display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:8px 12px;max-width:min(560px,calc(100vw - 32px));padding:9px 12px;border-radius:14px;background:rgba(24,20,14,.88);border:1px solid var(--gold);color:#f6eedc;font:500 14px/1.35 Rubik,sans-serif;direction:rtl;box-shadow:0 6px 22px rgba(0,0,0,.35)}
body.touch #depAsk{top:calc(env(safe-area-inset-top,0px) + 110px);font-size:13px;padding:7px 10px}body.touch #depAsk button{padding:8px 10px}
#depAsk[hidden]{display:none}#depAsk div{display:flex;gap:6px}#depAsk button{font:600 13px Rubik,sans-serif;padding:7px 11px;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:inherit;cursor:pointer}#depAsk button[data-a="pick"]{border-color:var(--gold);color:var(--gold)}
.deppl{display:flex;flex-direction:column;gap:5px;margin:8px 0}.deppk{display:flex;align-items:center;gap:8px;padding:9px 11px;border-radius:11px;border:1px solid var(--line);background:rgba(255,255,255,.03);color:inherit;font:inherit;text-align:start;cursor:pointer}
.deppk.on{border-color:var(--gold);background:rgba(232,176,75,.14)}.deppk small{color:var(--dim)}.deppk i{margin-inline-start:auto;font-style:normal;font-size:12.5px;color:var(--dim)}.deppk.on i{color:var(--gold)}
.depset{margin-inline-start:6px;font:600 12px Rubik,sans-serif;padding:3px 8px;border-radius:8px;border:1px solid var(--line);background:transparent;color:var(--gold);cursor:pointer}`;
  document.head.appendChild(st);
})();

// ================= OTHER CHIEFS LEAVE THEIR VILLAGES TOO =================
// Now and then a chief (or a king, a khan, a shogun) goes out with one or two of the guard: to visit a friendly tribe or the
// town at the other end of the road, to hunt, or to visit you. Until the chief comes back, the next in their order is in
// charge (in towns and castles the strongest of the guard, in the tribes the elder), and that is who you meet there.
const NTRIP = { t: 10, list: [] };
function npcChain(c) {
  const civ = !!c.civ, rk = h => h.cls === 'elder' ? (civ ? 1 : 0) : h.cls === 'warrior' ? (civ ? 0 : 1) : h.cls === 'hunter' ? 2 : h.cls === 'builder' ? 3 : 4;
  return (c.hunters || []).filter(h => h.alive && !h.gone && !h.young && h.cls !== 'chief' && !h.raider && !h.trav && !h.lead && !h.fleeing && h.brain !== 'captive').sort((a, b) => rk(a) - rk(b) || b.maxHp - a.maxHp);
}
// the words for the one standing in the chief's place
function npcDepWord(c, h) {
  const C = c.civ && CIVS[c.civ], ch = C && c.cap ? C.ruler[0] : null;
  return ch ? `${heb(h, 'ממלא', 'ממלאת')} מקום ה${ch}` : heb(h, 'ממלא מקום ראש השבט', 'ממלאת מקום ראש השבט');
}
// where the chief went, in words
function tripWords(T) { return T.kind === 'hunt' ? 'לצוד' : T.kind === 'you' ? `לבקר ב${vxVillageName().replace(/^ה/, '')}` : `לבקר ב${T.to.tribe}`; }
// a way on foot: points along a straight line, all on dry and walkable ground (null if there is water or a cliff on the way)
function npcLinePath(a, b, stopShort) {
  const dx = ringDX(a.x, b.x), dz = b.z - a.z, L = Math.hypot(dx, dz), n = Math.max(2, Math.ceil(L / 16)), out = [];
  for (let k = 1; k <= n; k++) {
    const t = k / n * (L - (stopShort || 0)) / L, x = a.x + dx * t, z = a.z + dz * t;
    if (waterDepth(x, z) > 0 || getNY(x, z) < 0.72 || getH(x, z) < 0.25) return null;
    if (k % 2 === 0 || k === n) out.push({ x, z });
  }
  return out;
}
function npcTripPick(c) {
  const i = campIndex(c), opts = [];
  // the town at the other end of a road (the Old World)
  if (c.civ && c.set) for (const R of ROADS.list) {
    const other = R.a === c.set.id ? R.b : R.b === c.set.id ? R.a : null; if (!other) continue;
    const o = HUNT.camps.find(q => q.set && q.set.id === other && !q.gone && !q.dormant && !q.bandit); if (!o) continue;
    const j = campIndex(o); if (atWarK(i, j)) continue;
    const P0 = R.a === c.set.id ? R.P : R.P.slice().reverse(), path = []; for (let k = 0; k < P0.length; k += 3) path.push({ x: P0[k].x, z: P0[k].z }); path.push({ x: P0[P0.length - 1].x, z: P0[P0.length - 1].z });
    // into the town to its heart (through the gate)
    const ang = rng() * TAU; path.push({ x: o.x + Math.sin(ang) * 6, z: o.z + Math.cos(ang) * 6 });
    opts.push({ kind: 'visit', to: o, path, w: 2 });
  }
  // a friendly tribe nearby, or your village
  if (!c.civ) for (const o of HUNT.camps) {
    if (o === c || o.gone || o.bandit || o.dormant || o.civ) continue;
    const d = Math.hypot(ringDX(c.x, o.x), o.z - c.z); if (d < 160 || d > 720) continue;
    const j = campIndex(o);
    if (o.own ? (campTrust(i) < 30 || atWar(i) || !P.human) : (atWarK(i, j) || npcTrust(i, j) < 0)) continue;
    const path = npcLinePath(c, o, o.own ? villageR() + 6 : 14); if (path) opts.push({ kind: o.own ? 'you' : 'visit', to: o, path, w: o.own ? 1.6 : 1 });
  }
  // a hunt in their own land
  for (let t = 0; t < 8; t++) { const a = rng() * TAU, d = rr(110, 210), to = { x: c.x + Math.sin(a) * d, z: c.z + Math.cos(a) * d }, path = npcLinePath(c, to, 0); if (path) { opts.push({ kind: 'hunt', to, path, w: c.civ ? 0.5 : 1 }); break; } }
  if (!opts.length) return null;
  let s = rng() * opts.reduce((q, o) => q + o.w, 0); for (const o of opts) { s -= o.w; if (s <= 0) return o; }
  return opts[opts.length - 1];
}
function npcTripsUpdate(dt) {
  if ((NTRIP.t -= dt) > 0) return; NTRIP.t = 6;
  for (const c of NTRIP.list.slice()) { const T = c.trip; if (!T || c.gone || !T.ch.alive || T.ch.gone || G.t - T.t0 > T.max) npcTripEnd(c, false); }
  NTRIP.list = NTRIP.list.filter(c => c.trip);
  const a = P.a; if (!a || G.mode !== 'play' || NTRIP.list.length >= 1 || G.time < 7.5 || G.time > 16) return;
  const L = HUNT.camps.filter(c => { if (c.own || c.gone || c.bandit || c.dormant || c.trip || (c.tripCD || 0) > G.t) return false; const d = Math.hypot(ringDX(a.pos.x, c.x), a.pos.z - c.z); return d < 650 && d > 90; });
  if (!L.length) return;
  const c = pick(L); c.tripCD = G.t + rr(600, 1200);
  if (rng() > 0.4) return;
  const i = campIndex(c), ch = chiefOfCamp(c);
  if (!ch || ch.state === 'defend' || ch.fleeing || ch.mount || ch.duel || atWar(i) || WAR.parties.some(p => !p.done && (p.to === i || p.from === i))) return;
  const o = npcTripPick(c); if (o) npcTripStart(c, ch, o);
}
function npcTripStart(c, ch, o) {
  const dep = npcChain(c)[0] || null, i = campIndex(c);
  let len = 0; for (let k = 1; k < o.path.length; k++) len += Math.hypot(o.path[k].x - o.path[k - 1].x, o.path[k].z - o.path[k - 1].z);
  c.trip = { kind: o.kind, to: o.to, t0: G.t, ch, dep, guards: [], max: 240 + len * 1.6 };
  ch.ctrip = { c, path: o.path, k: 0, ph: 'go', wait: 0, b0: ch.brain || null, stuck: 0, best: 1e9 };
  ch.brain = 'chiefTrip'; ch.state = 'idle'; ch.foe = null;
  // one or two of the guard go with the chief
  const g = c.hunters.filter(h => h.alive && !h.young && h !== dep && (h.cls === 'warrior' || h.cls === 'hunter') && !h.brain && !h.patrolT && !h.trav && h.state !== 'defend').slice(0, c.cap ? 2 : 1 + (rng() < 0.5 ? 1 : 0));
  g.forEach((h, k) => { h.brain = 'retinue'; h.lead = ch; h.retSide = k ? 1 : -1; c.trip.guards.push(h); });
  // where the town keeps horses (or camels), the journey is on horseback
  if (o.kind !== 'hunt' && campHorses(c).length) for (const r of [ch, ...g]) {
    if (r.mount) continue;
    const m = mountAnimal(mountOf(c) || 'horse', r.pos.x, r.pos.z, { scale: rr(0.98, 1.04) }); m.ground(1, true);
    Object.assign(m, { socialExtra: true, tripHorse: true, campHorse: null }); if (!mountUp(r, m)) m.remove();
  }
  if (dep) dep.actHead = c;
  NTRIP.list.push(c);
  if (npcTripSeen(c)) UI.notify(`👑 ${ch.name} ${heb(ch, 'יצא', 'יצאה')} ${tripWords(c.trip)}${dep ? `. בינתיים ${dep.name} ${heb(dep, 'אחראי', 'אחראית')} על ${c.tribe}` : ''}`, '');
  if (ch.dCam < 40) say(ch, o.kind === 'hunt' ? 'אנחנו יוצאים לצוד. נחזור עד הערב' : 'אנחנו יוצאים לדרך. שמרו על הבית', 2.6);
  if (dep && dep.dCam < 40) setTimeout(() => say(dep, 'אני אשמור על הכפר עד שתחזרו', 2.4), 1600);
  void i;
}
const npcTripSeen = c => VX.known.has(campIndex(c)) && P.a && Math.hypot(ringDX(P.a.pos.x, c.x), P.a.pos.z - c.z) < 420;
// the chief's visit: greetings, and friendship between the two
function npcTripArrive(h, T) {
  const c = T.c, t = c.trip, i = campIndex(c); if (!t) return;
  if (t.kind === 'you') {
    const v = ownCamp(), here = v && P.a && Math.hypot(P.a.pos.x - v.x, P.a.pos.z - v.z) < villageR() + 60;
    addTrust(i, here ? 5 : 3);
    if (here) { UI.notify(`👑 ${h.name}, ${chiefWord(c, h)} של ${c.tribe}, בא${h.sex === 'f' ? 'ה' : ''} לבקר אותך`, 'good'); say(h, pick(['באנו לראות איך חיים אצלכם', 'שלום לכם, שכנים!', 'הכפר שלכם גדל יפה']), 3); }
    else { const m = depWho(); depDeed(`${h.name}, ראש ${c.tribe}, בא${h.sex === 'f' ? 'ה' : ''} לבקר${m ? `, ו${m.name} ${heb(m, 'קיבל', 'קיבלה')} אותו בכבוד` : ''}`); }
  } else if (t.kind === 'visit') {
    const j = campIndex(t.to), host = chiefOfCamp(t.to);
    if (j >= 0 && !t.to.own) npcTrustAdd(i, j, 4);
    if (host && host.dCam < 40) say(host, `ברוכים הבאים, ${h.name}!`, 2.6);
    if (h.dCam < 40) setTimeout(() => say(h, 'באנו בשלום, עם מתנות', 2.4), 1500);
  } else if (h.dCam < 40) say(h, 'כאן נחכה לחיות', 2.2);
}
const chiefWord = (c, h) => { const C = c.civ && CIVS[c.civ]; return C && c.cap ? C.ruler[h.sex === 'f' ? 1 : 0] : heb(h, 'ראש השבט', 'ראשת השבט'); };
function npcTripEnd(c, home) {
  const T = c.trip; if (!T) return; c.trip = null;
  const ch = T.ch, unhorse = r => { if (r && r.mount && r.mount.tripHorse) { const m = r.mount; mountOff(r); m.remove(); } };
  if (ch && ch.ctrip) { ch.brain = ch.ctrip.b0; ch.ctrip = null; ch.state = 'idle'; ch.stT = 3; if (ch.alive && !home) hGoto(ch, c.x, c.z, null); }
  unhorse(ch);
  for (const g of T.guards) { if (g.lead) { g.brain = null; g.lead = null; if (g.alive) hGoto(g, c.x, c.z, null); } unhorse(g); }
  const dp = T.dep && T.dep.alive && !T.dep.gone ? T.dep : null;
  if (T.dep) T.dep.actHead = null;
  if (home && ch && ch.alive && npcTripSeen(c)) {
    UI.notify(`👑 ${ch.name} ${heb(ch, 'חזר', 'חזרה')} ל${c.tribe}${dp ? `, ו${dp.name} ${heb(dp, 'חזר', 'חזרה')} להיות ${npcRoleWord(c, dp)}` : ''}`, '');
    if (dp && dp.dCam < 40) say(dp, pick(['ברוך שובך! הכל בסדר כאן', 'שמרנו על הבית. הוא שוב שלך', 'טוב שחזרת']), 2.6);
  }
}
BRAIN.chiefTrip = function (h, dt) {
  const T = h.ctrip; if (!T || !T.c.trip) { if (T) { h.brain = T.b0; h.ctrip = null; } return; }
  if (h.fleeing || h.state === 'defend' || h.windup > 0 || h.stun > 0) { BRAIN.hunter(h, dt); return; }
  if ((h.think -= dt) <= 0) { h.think = 0.5; const th = hunterThreat(h); if (th) { h.foe = th; h.state = 'defend'; for (const g of T.c.trip.guards) if (g.alive && g.lead === h) { g.foe = th; g.state = 'defend'; } return; } }
  if (T.ph === 'stay') {
    T.wait -= dt; h.move(0, 0, 0, dt); h.pose = T.c.trip.kind === 'hunt' ? 'idle' : 'talk';
    if (T.wait <= 0) { T.ph = 'back'; T.k = T.path.length - 2; T.best = 1e9; T.stuck = 0; }
    return;
  }
  const home = { x: T.c.x, z: T.c.z }, p = T.k < 0 ? home : T.path[T.k] || home;
  // (steerTo answers with the distance to the gate when a wall is in the way: the real distance decides)
  h.steerTo(p.x, p.z, (h.sp.walk || 1.5) * 1.15, dt); h.pose = 'move';
  const d = Math.hypot(ringDX(h.pos.x, p.x), p.z - h.pos.z);
  // no way forward for a long while: out of sight, step on to the next point
  if (d < T.best - 1) { T.best = d; T.stuck = 0; } else if ((T.stuck += dt) > 14) { T.stuck = 0; T.best = 1e9; if ((h.dCam || 0) > 50) { h.pos.set(p.x, 0, p.z); h.ground(1, true); } else T.k += T.ph === 'go' ? 1 : -1; }
  if (d < 3.5) {
    T.best = 1e9; T.stuck = 0;
    if (T.ph === 'go') { T.k++; if (T.k >= T.path.length) { T.ph = 'stay'; T.wait = rr(35, 65); npcTripArrive(h, T); } }
    else { T.k--; if (T.k < -1) npcTripEnd(T.c, true); }
  }
};
// the guard walk behind the chief, and fight for the chief
BRAIN.retinue = function (h, dt) {
  const L = h.lead; if (!L || !L.alive || L.gone || !L.ctrip) { h.lead = null; h.brain = null; if (h.camp) hGoto(h, h.camp.x, h.camp.z, null); return; }
  if (h.fleeing || h.state === 'defend' || h.windup > 0 || h.stun > 0) { BRAIN.hunter(h, dt); return; }
  if ((h.think -= dt) <= 0) { h.think = 0.4; const th = hunterThreat(h) || (L.state === 'defend' && L.foe && L.foe.alive ? L.foe : null); if (th) { h.foe = th; h.state = 'defend'; return; } }
  const ang = L.yaw + Math.PI + (h.retSide || 1) * 0.75, x = L.pos.x + Math.sin(ang) * 2.8, z = L.pos.z + Math.cos(ang) * 2.8, d = Math.hypot(x - h.pos.x, z - h.pos.z);
  if (d > 60 && (h.dCam || 0) > 50) { h.pos.set(x, 0, z); h.ground(1, true); return; }
  if (d > 1.3) { h.steerTo(x, z, d > 7 ? (h.sp.run || 5) * 0.6 : (h.sp.walk || 1.5) * 1.2, dt); h.pose = 'move'; }
  else { h.move(0, 0, 0, dt); h.pose = 'idle'; h.yaw += angDiff(h.yaw, L.yaw) * Math.min(1, dt * 2); }
};
// the chief's name, with where the chief is now
function chiefNow(c) {
  const ch = chiefOfCamp(c); if (!ch) return 'אין';
  const T = c.trip; if (!T || T.ch !== ch) return ch.name;
  return `${ch.name} (${heb(ch, 'יצא', 'יצאה')} ${tripWords(T)})${T.dep && T.dep.alive ? ` · ${heb(T.dep, 'אחראי', 'אחראית')}: ${T.dep.name}` : ''}`;
}

// ---------- the order of command, on the people screen and in each person's card ----------
function depHtml() {
  const v = ownCamp(), L = depChain(); if (!L.length) return '';
  const now = DEP.away ? depWho() : depPick();
  const rows = L.slice(0, 6).map((q, n) => {
    const m = q.m, why = depWhyNot(m, v), cur = m === now;
    return `<div class="deprow${cur ? ' on' : ''}"><span class="depn">${n + 1}</span><b>${m.name}</b><small>${depRankWord(m, q.r)}</small><i>${cur ? (DEP.away ? heb(m, '⭐ אחראי עכשיו', '⭐ אחראית עכשיו') : heb(m, '⭐ יהיה אחראי', '⭐ תהיה אחראית')) : why}</i>${m.uid && m.uid === DEP.uid ? '' : `<button class="depset" data-m="${m.id}" data-a="depset" title="לבחור">⭐ לבחור</button>`}</div>`;
  }).join('');
  return `<h3>⭐ מי אחראי על הכפר כש${you('אתה יוצא', 'את יוצאת')}</h3><p class="idim">לפי סדר השבט: ${DEP.uid ? 'הסגן שבחרת' : 'סגן שתבחר'}, בן או בת הזוג, הילדים הבוגרים, ואז האבירים, הלוחמים, הסוחרים, הציידים, הבונים והאוספים (הוותיק קודם). האחראי מוביל את ההגנה, ממשיך את העבודה ומקבל את השליחים, וכש${you('תחזור', 'תחזרי')} ${heb(now || { sex: 'm' }, 'יספר', 'תספר')} מה קרה, ${heb(now || { sex: 'm' }, 'יחזיר', 'תחזיר')} לך את הפיקוד ${heb(now || { sex: 'm' }, 'ויחזור', 'ותחזור')} לתפקיד ${heb(now || { sex: 'm' }, 'שלו', 'שלה')}.</p><div class="depl">${rows}</div>${DEP.uid ? '<div class="btns"><button class="btn" data-a="depauto">↩️ בלי סגן קבוע: לפי סדר השבט</button></div>' : ''}`;
}
(function () {
  const st = document.createElement('style');
  st.textContent = `.depl{display:flex;flex-direction:column;gap:4px;margin:4px 0 8px}.deprow{display:flex;align-items:center;gap:8px;padding:6px 9px;border-radius:10px;border:1px solid var(--line);font-size:13.5px}
.deprow.on{border-color:var(--gold);background:rgba(232,176,75,.12)}.deprow b{font-weight:700}.deprow small{color:var(--dim)}.deprow i{margin-inline-start:auto;font-style:normal;font-size:12.5px;color:var(--dim);white-space:nowrap}.deprow.on i{color:var(--gold)}
.depn{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:var(--panel2);font-size:11.5px;font-weight:700;flex:0 0 auto}
.deprep{display:flex;flex-direction:column;gap:5px;margin:8px 0 4px;font-size:14px;line-height:1.45}.deprep div{padding:5px 9px;border-radius:9px;background:rgba(255,255,255,.04)}`;
  document.head.appendChild(st);
})();
