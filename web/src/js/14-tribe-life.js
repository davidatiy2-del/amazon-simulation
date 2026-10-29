// ================= WHERE EVERYONE IS: the tribe tab, the maps, the hunter-first menu and the journey's missions =================
// ---------- the info hub: a tribe tab with everyone's place and work ----------
function openInfo(tab) {
  if (G.mode !== 'play' || !P.a) return;
  if (!tab && P.human && !INFO.vx) { INFO.vx = 1; INFO.tab = 'tribe'; }
  if (tab) INFO.tab = tab;
  const T = P.human ? [['tribe', 'שבט'], ['family', 'משפחה'], ['missions', 'משימות'], ['status', 'מצב']] : [['family', 'משפחה'], ['missions', 'משימות'], ['status', 'מצב']];
  if (!T.some(([k]) => k === INFO.tab)) INFO.tab = T[0][0];
  const body = INFO.tab === 'tribe' ? tribeHubHtml() : INFO.tab === 'family' ? famHtml() : INFO.tab === 'missions' ? missionsHtml() : statusHtml();
  const el = uiCard('infohub', `<div class="itabs">${T.map(([k, t]) => `<button data-tab="${k}" class="${INFO.tab === k ? 'on' : ''}">${t}</button>`).join('')}<button class="ix" data-a="close" aria-label="סגירה">✕</button></div><div class="ibody">${body}</div>`);
  el.onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.tab) { openInfo(b.dataset.tab); return; }
    if (b.dataset.trk) { const m = clanReal().find(q => q.id === +b.dataset.trk); closeCard('infohub'); if (m) trackWay(m); return; }
    if (b.dataset.go) { const c = HUNT.camps[+b.dataset.go]; closeCard('infohub'); if (c) setWay(c.x, c.z, true, c.tribe); return; }
    if (b.dataset.leg) { const L = LEGENDS.find(l => l.id === b.dataset.leg), at = L && (L.a && L.a.alive ? L.a.pos : L.lair); closeCard('infohub'); if (at) setWay(at.x, at.z, true, L.name); return; }
    if (b.dataset.preg) { const m = b.dataset.preg === 'self' ? P.a : aliveMates()[+b.dataset.preg]; closeCard('infohub'); startPreg(m); return; }
    if (b.dataset.hud) { HUD.mode = b.dataset.hud; SET.hud = HUD.mode; saveSet(); applyHud(); openInfo('status'); return; }
    const A = b.dataset.a;
    if (A === 'follow' || A === 'den') { P.cubsMode = A; saveGame(); openInfo('family'); return; }
    if (A === 'gohome' && DEN.pos) { closeCard('infohub'); setWay(DEN.pos.x, DEN.pos.z, true, 'הבית'); return; }
    if (A === 'gocamp') { const c = ownCamp() || homeCamp(); closeCard('infohub'); if (c) setWay(c.x, c.z, true, ownCamp() ? 'הכפר' : 'המחנה'); return; }
    if (A === 'village') { closeCard('infohub'); campMenu('home'); return; }
    if (A === 'tribeScr') { closeCard('infohub'); memberScreen(); return; }
    if (A === 'war') { closeCard('infohub'); openWar(); return; }
    if (A === 'found') { FOUND.mode = true; closeCard('infohub'); UI.notify('צריך ללכת למקום שטוח, לפחות 100 מ׳ מכל שבט ועד 60 מ׳ ממים. שם כפתור הזהב יציע "להקים מחנה"', 'good'); return; }
    if (A === 'foundCancel') { FOUND.mode = false; openInfo('tribe'); return; }
    if (A === 'map') { closeCard('infohub'); UI.open('map'); return; }
    if (A === 'close') closeCard('infohub');
  };
}
function memberHubRow(m) {
  const ic = m.young ? '🧒' : (CLS[m.cls] || CLS.builder).ic, role = m.isPartner ? (m.sex === 'f' ? ' · אשתך' : ' · בעלך') : '';
  return `<div class="irow"><div><b>${ic} ${m.name}</b> <small>${m.young ? heb(m, 'ילד', 'ילדה') : clsWord(m)}${role}</small><span>${doingTribe(m)} · ${whereIs(m)}</span></div><span class="vxr">${hpBar(m)}<button class="vxpin" data-trk="${m.id}" aria-label="לסמן במפה">📍</button></span></div>`;
}
function tribeHubHtml() {
  const v = ownCamp(), mc = memberCamp(), out = [], mem = clanReal();
  if (v) out.push(`<div class="vxhero"><b>${vxVillageName()}</b><span>${TIERN[Math.max(0, villageTier())]} · ${popCount()} אנשים · ${PRESS_N[pressStage()]}</span></div><div class="btns" style="flex-wrap:wrap;margin-top:6px"><button class="btn pri" data-a="village">מסך הכפר</button><button class="btn" data-a="war">⚔️ מלחמה ושלום</button><button class="btn" data-a="gocamp">ללכת לכפר</button><button class="btn" data-a="map">מפה</button></div>`);
  else if (mc) out.push(`<div class="vxhero"><b>${mc.tribe}</b><span>${you('אתה', 'את')} ${rankName(VX.rank)} · ראש השבט: ${chiefName(mc)}</span></div><div class="btns" style="flex-wrap:wrap;margin-top:6px"><button class="btn pri" data-a="tribeScr">מסך השבט</button><button class="btn" data-a="war">⚔️ מלחמה ושלום</button><button class="btn" data-a="gocamp">ללכת למחנה</button></div>`);
  else out.push(`<div class="vxhero"><b>${you('לבד בג׳ונגל', 'לבד בג׳ונגל')}</b><span>${VX.known.size ? 'אפשר לגשת לראש של אחד השבטים ולבקש להצטרף' : 'עשן מעל העצים מסמן שבט. כדאי ללכת לכיוונו'}</span></div>`);
  if (VX.quest) { const c = HUNT.camps[VX.quest.c]; if (c) out.push(`<p class="idim">🎯 המשימה של ${c.tribe}: להביא לראש השבט ${VX.quest.need} מנות בשר (${VX.quest.have}/${VX.quest.need})</p>`); }
  if (mem.length) {
    const grp = [['בני הזוג', m => m.isPartner], ...WORK.map(k => [CLS[k].pl, m => !m.isPartner && !m.young && m.cls === k]), ['ילדים', m => m.young]];
    out.push(`<h3>השבט שלך · ${mem.length + 1} אנשים${CLAN.residents ? ` ועוד ${CLAN.residents} תושבים` : ''}</h3>`);
    for (const [n, f] of grp) { const L = mem.filter(f); if (L.length) out.push(`<div class="vxgh">${n}</div>` + L.map(memberHubRow).join('')); }
    out.push('<p class="idim">📍 מסמן את האדם במפה, והחץ למעלה מוביל אליו</p>');
  } else if (!v) out.push('<p class="idim">עוד אין לך שבט משלך.</p>');
  const known = [...VX.known].map(i => HUNT.camps[i]).filter(c => c && !c.own && !c.gone);
  if (known.length) out.push('<h3>השבטים שפגשת</h3>' + known.map(c => {
    const i = campIndex(c), tr = campTrust(i), rel = i === VX.mem ? 'השבט שלך' : atWar(i) ? '⚔️ במלחמה' : tr >= 40 ? 'ידידים' : tr >= 15 ? 'מכירים' : tr < -15 ? 'עוינים' : 'זרים';
    return `<div class="irow"><div><b>${c.tribe}</b> <small>${rel}</small><span>${whereIs({ pos: { x: c.x, z: c.z } })} · ${c.hunters.filter(h => h.alive).length} אנשים · ראש השבט: ${chiefNow(c)}</span></div><button class="btn" data-go="${i}" style="padding:6px 12px;font-size:13px">ללכת לשם</button></div>`;
  }).join(''));
  if (!v) out.push(foundHtml());
  return out.join('');
}
(function () {
  const st = document.createElement('style');
  st.textContent = `.vxr{display:flex!important;align-items:center;gap:8px;margin:0!important}.vxpin{border:1px solid var(--line);background:transparent;border-radius:9px;width:34px;height:30px;font-size:15px;cursor:pointer;padding:0}
.vxgh{font-size:12px;color:var(--gold);margin:8px 0 0;font-weight:600;letter-spacing:.3px}`;
  document.head.appendChild(st);
})();
// a marked member: the waypoint keeps following them
function trackUpdate() {
  const m = VX.track; if (!m) return;
  if (!m.alive || m.gone || !WAY.p) { VX.track = null; return; }
  WAY.p.x = m.pos.x; WAY.p.z = m.pos.z;
  if (P.a && dist2(m.pos, P.a.pos) < 4) { VX.track = null; clearWay(`הגעת אל ${m.name}`); }
}
// ---------- the maps ----------
function vxMiniDots(pt, a) {
  if (!P.human) return;
  for (const b of BLD.list) if (b.t !== 'torch' && !BTYPES[b.t].def) { if (BTYPES[b.t].span) bridgeMiniDots(pt, b); else pt(b.x, b.z, b.done ? 4 : 3, b.done ? '#b8915a' : 'rgba(184,145,90,.6)'); }
  defMiniDots(pt); trapMiniDots(pt);
  for (const m of clanReal()) if (!m.isPartner && !m.cub && !m.hidden) pt(m.pos.x, m.pos.z, 4.5, CLSC[m.cls] || '#ffd34d');
  for (const h of tribeHorses()) if (h.mine && !h.ridden) pt(h.pos.x, h.pos.z, 4.5, '#c98a4a');
  if (PRESS.raider && PRESS.raider.alive) pt(PRESS.raider.pos.x, PRESS.raider.pos.z, 7, '#ff3b30', true, true);
  if (VX.track && VX.track.alive) pt(VX.track.pos.x, VX.track.pos.z, 7, '#5ab4ff', true, true);
  for (const B of BOATS) if (B !== P.boat) { pt(B.x, B.z, 4.5, '#7a5230'); pt(B.x, B.z, 5.5, 'rgba(245,214,150,.9)', true); } // the canoes, so you can find yours
  warMiniDots(pt); mineMiniDots(pt); raid2MiniDots(pt);
}
// the compass: smoke over the trees shows where people live; your own fire is gold
function vxCompass(dot) {
  if (!P.human || !P.a) return;
  for (let i = 0; i < HUNT.camps.length; i++) {
    const c = HUNT.camps[i], d = Math.hypot(c.x - P.a.pos.x, c.z - P.a.pos.z);
    if (c.gone) continue;
    if (c.own) dot(c.x, c.z, '#e8b04b'); else if (i === VX.mem) dot(c.x, c.z, '#f3d48a'); else if (atWar(i) && VX.known.has(i) && d > 30) dot(c.x, c.z, '#ff4a3a'); else if (d < 460 && d > 50) dot(c.x, c.z, '#9a958c');
  }
}
// unknown tribes are not on the big map until you find them (or someone tells you)
function vxPoiShown(p) {
  if (!p.camp || !P.human) return true;
  const c = HUNT.camps.find(k => Math.hypot(k.x - p.x, k.z - p.z) < 3); if (!c) return true;
  if (c.gone) return false;
  if (c.own) { p.n = vxVillageName(); return true; }
  return VX.known.has(campIndex(c));
}
function vxBigMap(c, m) {
  const lg = document.querySelector('#mapov .legend');
  if (lg) { if (!VXM.legend) VXM.legend = lg.innerHTML; const h = P.human ? '<span><i style="background:#ffd34d"></i>אתה</span><span><i style="background:#ff78ab"></i>המשפחה</span><span><i style="background:#86d46f"></i>השבט שלך</span><span><i style="background:#e8e2cf"></i>מקומות ושבטים</span><span><i style="background:#ff3b30"></i>אויבים</span><span><i style="background:#ff78ab"></i>שבויים</span>' : VXM.legend; if (lg.innerHTML !== h) lg.innerHTML = h; }
  if (!P.human) return;
  const S = c.canvas.width, k = S / W.size, v = ownCamp();
  if (v) { const [x, y] = m(v.x, v.z); c.save(); c.strokeStyle = 'rgba(232,176,75,.9)'; c.lineWidth = 3; c.setLineDash([8, 6]); c.beginPath(); c.arc(x, y, Math.max(10, villageR() * k), 0, TAU); c.stroke(); c.restore(); }
  for (const b of BLD.list) {
    if (b.t === 'torch') continue; const T = BTYPES[b.t];
    if (T.span) { bridgeBigMap(c, m, b); continue; }
    if (T.len) { const e = segEnds(b), [x1, y1] = m(e.ax, e.az), [x2, y2] = m(e.bx, e.bz); c.strokeStyle = b.broken ? '#e0483c' : !b.done ? 'rgba(200,170,120,.5)' : T.def.water ? '#5aa8e0' : T.def.gate ? '#f1c45a' : b.t === 'stonewall' ? '#c9c1ae' : '#a07a4a'; c.lineWidth = T.def.gate ? 5 : 3.5; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); continue; }
    const [x, y] = m(b.x, b.z), r = Math.max(3, T.r * k * 1.1); c.fillStyle = b.done ? '#8a6a3e' : 'rgba(138,106,62,.55)'; c.fillRect(x - r, y - r, r * 2, r * 2);
  }
  for (const Tq of TRAPS.list) { const [x, y] = m(Tq.x, Tq.z), full = Tq.caught && Tq.caught.alive; c.fillStyle = full ? '#ffcf4a' : Tq.owner === 'p' ? '#f0d9a0' : '#bba57a'; c.beginPath(); c.arc(x, y, full ? 6 : 4, 0, TAU); c.fill(); c.lineWidth = 1.5; c.strokeStyle = '#2a1c12'; c.stroke(); }
  for (const t of clanReal()) { if (t.hidden) continue; const [x, y] = m(t.pos.x, t.pos.z); c.fillStyle = CLSC[t.young ? 'child' : t.cls] || '#ffd34d'; c.beginPath(); c.arc(x, y, 5.5, 0, TAU); c.fill(); c.lineWidth = 1.5; c.strokeStyle = '#1c1608'; c.stroke(); }
  if (PRESS.raider && PRESS.raider.alive) { const [x, y] = m(PRESS.raider.pos.x, PRESS.raider.pos.z); c.strokeStyle = '#ff3b30'; c.lineWidth = 4; c.beginPath(); c.arc(x, y, 12, 0, TAU); c.stroke(); }
  warBigMap(c, m); mineBigMap(c, m); raid2BigMap(c, m);
  const tr = VX.track; if (tr && tr.alive) { const [x, y] = m(tr.pos.x, tr.pos.z); c.strokeStyle = '#5ab4ff'; c.lineWidth = 3; c.beginPath(); c.arc(x, y, 12, 0, TAU); c.stroke(); c.lineWidth = 5; c.strokeStyle = 'rgba(0,0,0,.65)'; c.strokeText(tr.name, x, y - 18); c.fillStyle = '#d8eeff'; c.fillText(tr.name, x, y - 18); }
}
// the card on the target: who this person is to you
function vxTargetSub(t) {
  if (t.brain === 'captive') return `${clsWord(t)} · ${heb(t, 'שבוי', 'שבויה')}${t.capCamp >= 0 ? ` ב${campName(t.capCamp)}` : ''}`;
  if (t === CHAL.ch) return `האלוף של ${t.camp.tribe}`;
  if (t.raider) return `לוחם פושט מ${t.camp.tribe} · אויב`;
  if (t.tribe) return t.young ? (t.cub ? heb(t, 'הילד שלך', 'הילדה שלך') : kidLine(t) || heb(t, 'ילד בשבט', 'ילדה בשבט')) : `${clsWord(t)} · השבט שלך${married(t) ? ` · ${heb(t, 'נשוי ל', 'נשואה ל')}${t.spouse.name}` : ''}`;
  const c = t.camp, i = c ? campIndex(c) : -1;
  return `${clsWord(t)}${c ? ` · ${c.tribe}` : ''}${i === VX.mem ? ' · השבט שלך' : i >= 0 && atWar(i) ? ' · אויב' : i >= 0 && campTrust(i) >= 40 ? ' · ידידים' : ''}`;
}

// ---------- the menu: the hunter's journey first, the animals one tap away ----------
const VXM = { init: false };
const vxHunterMode = () => SET.sp === 'hunter';
const JOURNEY_HTML = `<h2>המסע של הצייד</h2><ol class="vxjourney">
<li><b>לשרוד לבד</b><span>ציד בחנית, חיתוך בשר, מדורה ובישול, ומים מהנהר.</span></li>
<li><b>למצוא שבט</b><span>עשן מעל העצים מסמן מחנה. ראש השבט מחליט אם לקבל אותך.</span></li>
<li><b>לעלות בדרגה</b><span>בשר לשבט והגנה מטורפים: ממצטרף, לצייד, ללוחם ועד יד ימינו של ראש השבט.</span></li>
<li><b>למצוא אישה</b><span>בהסכמת ראש השבט: לבקש, להביא מתנה, או לנצח אותו בדו-קרב.</span></li>
<li><b>שבט משלך</b><span>ליד מים: בקתות, בתים, גינות, מגדלים ובית מועצה. ממחנה לכפר, לעיירה ולעיר.</span></li>
<li><b>השבט חי</b><span>זוגות מתחתנים ומביאים ילדים, הבונים מתכננים ובונים לבד, והשבט מאלף כלבים ועיטים ושט בסירות.</span></li>
<li><b>מלחמה ושלום</b><span>שבטים נלחמים על אוכל, זהב ושטח. חנית, חרב וקשת, פשיטות, קרבות אלופים, שבויים שמחזירים והסכמי שלום.</span></li>
<li><b>פוליטיקה</b><span>לכל ראש שבט אופי משלו. בריתות, סחר וחתונות בין השבטים, ובני ברית שנלחמים זה לצד זה.</span></li>
<li><b>סוסים, כרכרות וספינות</b><span>לאלף סוס בר ולרכוב, לנהוג בכרכרה עם אנשים מאחור, ובעיר לבנות ספינה גדולה.</span></li>
<li><b>העולם שמעבר להרים</b><span>מעברים בהרים מובילים לצפון המושלג, לסוואנה, למדבר ולחוף הים. בכל ארץ חיות משלה ושני שבטים עם בגדים, בתים ועדרים משלהם.</span></li>
<li><b>המחיר</b><span>כל עץ שנכרת וכל חיה שניצודה מרחיקים את הטבע, והחיות סביב הכפר מתחילות לתקוף.</span></li></ol>`;
function vxHelp() {
  const k = document.querySelector('#help .keys'); if (!k) return;
  const T = !!TOUCH, rows = [
    ['המסע של הצייד', 'הולכים לכיוון העשן (נקודה אפורה במצפן), מדברים עם ראש השבט, מביאים בשר ומתקבלים. בשבט עולים בדרגה, מוצאים אישה ומקימים שבט משלך ליד מים'],
    [T ? 'כפתור הזהב ליד אדם' : 'E ליד אדם', 'לדבר: לבקש להצטרף, לתת מתנה, לבקש אישה, לשאול איפה יש ציד. ליד בני השבט שלך: לתת תפקיד או לקחת אותם איתך'],
    [T ? 'כפתור הזהב במדורה' : 'E במדורה', 'מסך הכפר: הכפר, האנשים והתפקידים, בנייה ומחסן'],
    [T ? '🔨 למעלה' : 'N', 'מסך הבנייה, מכל מקום: מבנים חדשים, גדרות וחומות, ו"לבחור מבנה" כדי להזיז או להרוס. לא צריך לחזור למדורה'],
    ['בנייה', T ? 'בוחרים מבנה, הולכים ומסובבים את המצלמה עד שהוא ירוק, ואז "לבנות כאן". הבונים בונים, ואפשר לעזור עם כפתור הזהב' : 'בוחרים מבנה, הולכים ומסובבים את המצלמה עד שהוא ירוק. E לבנות, T לסובב, Esc ביטול'],
    [T ? 'ⓘ ← שבט' : 'I', 'כל בני השבט: מה כל אחד עושה ואיפה. 📍 מסמן אותו במפה והחץ מוביל אליו'],
    ['המחיר', 'כריתה, ציד והתרחבות מרגיזים את החיות סביב הכפר. לוחמים ומגדלי שמירה מגינים, ובלי מים אי אפשר לבנות'],
    [T ? 'הכפתור "נשק"' : '1 / 2 / 3 · R', 'להחליף נשק: חנית נזרקת, חרב מכה מקרוב בכמה אויבים, קשת יורה רחוק. המספר על כפתור התקיפה: כמה חניתות או חצים נשארו'],
    [T ? 'נשק ← ארסנל' : 'G', 'הארסנל: כל הנשק והתחמושת, לגלף חניתות, חצים, קשת וחרב ליד אש, ולקחת מהמחסן ומבית הנשק'],
    [T ? '⚔️ למעלה' : 'K', 'מלחמה ושלום: היחסים עם כל שבט, מתנות, מס, קרב אלופים, הכרזת מלחמה, פשיטות והסכמי שלום'],
    ['השבט חי לבד', 'זוגות מתחתנים ומביאים ילדים, הילדים גדלים ומקבלים תפקיד, הבונים מתכננים ובונים לבד, והשבט מחלק תפקידים לפי מה שחסר'],
    ['מלכודות', 'בארגז הכלים: מלכודת חבל לטרף קטן, בור ציד לגדול, וכלוב שתופס חיה בחיים. כלב יער מהכלוב מתאלף לך או למלונה של השבט. פיתיון מושך חיות מרחוק, ומלכודת שתפסה מסומנת במפה. כפתור הזהב ליד מלכודת: לשחוט, לאלף, לדרוך מחדש'],
    ['שלבי הכפר', 'מחנה ← כפר (6 אנשים, 2 בתים) ← כפר גדול (14 אנשים, 4 בתים) ← עיירה (30 אנשים ובית המועצה) ← עיר (60 אנשים, 12 בתים ובית המועצה). בתים: בקתה, בית, בית ארוך ובית המועצה. במסך הכפר רואים כמה חסר'],
    ['הג׳ונגל מתחדש', 'עץ שנכרת מחוץ לכפר צומח מחדש: אחרי יום יוצא שתיל, ואחרי יומיים יש שוב עץ. חיות ממליטות כשהן מעטות, והצעירים גדלים תוך יום'],
    ['גדרות ומכשולים', 'במסך הכפר ← בנייה. גדר בונים בקו, קטע אחרי קטע. אנשי השבט עוברים בשערים, ופושטים וטורפים נעצרים, פורצים או נפצעים מיתדות וקוצים. ככל שהכפר גדל נפתחים חומת יתדות, בור יתדות, חומת אבן, שער מבוצר ובעיר גם מגדלי חומה עם שומרים. אפשר גם לבקש מהבונים לגדר את כל הכפר, להשלים ולשדרג'],
    ['סירה', 'מעגן: עומדים על שפת המים ומסתכלים אל המים, והמעגן נצמד לגדה. אם המים רדודים, מסומן מקום טוב במפה. או מגלפים קאנו (8 עצים) בארגז הכלים. ליד הסירה: כפתור הזהב לעלות, ומשיטים כמו בהליכה'],
    [T ? 'כפתור האנשים למעלה' : 'O', 'פקודות לשבט: לשלוח כמה אנשים לצוד, להביא עצים, ללקט אוכל, לדוג, לעזור לבונים או לשמור על הכפר. שולחים ליד הכפר, למקום שאתה עומד בו או ליעד שסימנת במפה, והם חוזרים לעבודה הרגילה כשהמשימה גמורה. משם גם "לבוא איתי" ופשיטה על שבט'],
    ['גשר', 'במסך הבנייה: עומדים על הגדה ומסתכלים אל הגדה שמעבר למים, והגשר נמתח מגדה לגדה (עד 46 מ׳). המחיר לפי האורך. הבונים בונים אותו מהגדה, הולכים עליו בלי לשחות, וסירות עוברות מתחתיו'],
    ['שער מים', 'מהכפר הגדול: סורג של יתדות בתוך נהר או ערוץ, בין שתי חומות. עולה לבד כשסירה שלכם או מישהו מהשבט שוחה אליו, ויורד אחריהם. תנינים, אויבים ומי שבא בשחייה נעצרים. כפתור הזהב על הגדה לידו: להשאיר אותו למעלה או להחזיר אותו לפעול לבד'],
    ['להזיז ולהרוס', `${T ? '🔨 למעלה' : 'N'} ← "לבחור מבנה": הולכים למבנה ומסתכלים עליו, והוא מסומן בכתום. להזיז: בלי לשלם שוב. להרוס: כל העצים שבמבנה חוזרים ישר למחסן, גם אם עוד לא גמרו לבנות אותו. גדר וחומה: קטע אחד או כל הקו${T ? '' : '. E להזיז, X להרוס, Esc סיום'}`],
    ['ניקוי שיחים וגדמים', 'עומדים ליד גדם או שיח ומחזיקים את כפתור הזהב. גדם שנעקר נותן קצת עצים, ועץ כבר לא יצמח שם. הבונים מנקים את הכפר לבד כשאין להם מה לבנות'],
    ['לאלף סוס', `סוסי בר רועים בעדרים בערבות. ניגשים לסוס בשקט ומחזיקים את כפתור הזהב כדי להרגיע אותו, ואז הוא מנסה להפיל אותך: ${T ? 'הג׳ויסטיק' : 'WASD'} מכוון אותו כל הזמן לאותו כיוון, עד שהוא נכנע. סוס מאולף שייך לשבט, ואם אין שבט, מחכה לך איפה שירדת (נקודה חומה במפה), ושריקה קוראת לו. אפשר גם לשלוח אנשים לאלף סוסים במסך הפקודות. גם השבטים האחרים מאלפים סוסים, והפושטים שלהם באים רכובים, וכשיש סוסים באורווה גם הלוחמים שלך יוצאים לפשיטה רכובים`],
    ['כרכרה', `סדנת כרכרות (בכפר שיש בו אורווה) בונה כרכרה. ${T ? 'כפתור הזהב' : 'E'} ליד הכרכרה רותם סוס של השבט, ונוהגים כמו ברכיבה. מי שהולך איתך יושב מאחור. כשהכרכרה פנויה, הבונים מביאים בה עצים מהיער`],
    ['ספינה', `רק עיר בונה מספנה, על גדה של מים עמוקים ורחבים: אגם או הנהר הגדול. הספינה יורדת למים לידה. ${T ? 'כפתור הזהב' : 'E'} לידה: לעלות ולהפליג. מי שהולך איתך עולה לסיפון. שער מים סגור עוצר אותה, והיא גבוהה מדי לעבור מתחת לגשר. כשהיא פנויה, הדייגים יוצאים בה ומביאים הרבה דגים`],
    ['סוסים ופרות', `אורווה (נפתחת בשבט של 8 אנשים) מביאה סוסים לשבט. ליד סוס של השבט: כפתור הזהב כדי לעלות, ורוכבים כמו בהליכה${T ? '' : ' (Shift לדהור)'}. גם בג׳ונגל יש עדרי סוסי בר. הפרות נותנות חלב למחסן ומביאות עגלים, וככל שהכפר גדל יש מקום ליותר פרות`],
    ['שטח של שבט', 'סביב כל מחנה יש שטח שגדל עם השבט. מותר לבנות גם שם, אבל כשהמבנה מסומן בכתום השבט יתקוף כדי להרוס אותו. אם מחצית מהלוחמים שלהם נופלים, הם נסוגים'],
    ['פוליטיקה', `${T ? '⚔️ למעלה' : 'K'} ← פוליטיקה: לכל ראש שבט יש אופי (תוקפני, שוחר שלום, חמדן, גאה או נבון). אפשר לכרות ברית עם שבט ידידותי: בני ברית לא תוקפים, שולחים לוחמים כשפושטים על הכפר ומצטרפים למלחמות, וגם מבקשים עזרה. סחר מביא אוכל או עצים כל בוקר, וחתונה בין השבטים מביאה אדם חדש לכפר. מי שתוקף שבט עם בני ברית נלחם גם בהם`],
    ['האמון בך', 'האנשים בשבט שלך שופטים אותך: אוכל במחסן, ניצחונות, שלום, בני ברית וחתונות מחזקים את האמון, ורעב, פשיטות שנכשלו ומלחמות ארוכות מחלישים אותו. מי שאיבד את האמון עוזב, וכשהאמון גבוה מגיעים יותר אנשים'],
    ['שבט חסות', 'שבט שמפסיד במלחמה נכנע: שולח מס של אוכל כל בוקר ונלחם באויבים שלך, ואחרי כמה ימים מצטרף לשבט שלך עם האנשים והפרות שלו. גם השבטים האחרים כובשים זה את זה. במסך המלחמה אפשר לדרוש כניעה או לשחרר'],
    ['העולם', 'הג׳ונגל במרכז, ומסביבו ארבע ארצות: הצפון הקפוא (אורנים, אגם קפוא, איילים, זאבים ודובים), הסוואנה (אריות, פילים, ג׳ירפות וזברות), המדבר (דיונות, נווה מדבר וגמלים) וחוף הים (איים, צבי ים, דולפינים וכרישים). למעברים בהרים יש שמות במפה'],
    ['אקלים', 'בצפון הרחוק קר: מי שרחוק ממדורה רעב מהר יותר, ויורד שלג. במדבר חם: בצהריים הצמא בא מהר, ובמקום גשם יש סופות חול. בים הפתוח שוחים כרישים'],
    ['המפה', `${T ? 'נגיעה במפה הקטנה' : 'M או קליק על המפה הקטנה'} פותחים את המפה הגדולה. היא נפתחת כגלובוס: כל העולם על כדור, ${T ? 'מסובבים אותו באצבע' : 'מסובבים אותו בגרירה'}, וכשמתקרבים הכדור נפתח למפה הרגילה (מתרחקים ממנה, והיא נסגרת בחזרה לכדור). הכפתור "גלובוס" עובר בין השניים, ושתי נגיעות מהירות מקרבות. ${T ? 'במפה גוררים כדי לזוז וצובטים כדי להתקרב' : 'במפה גוררים כדי לזוז, והגלגלת מקרבת'}. נגיעה בשבט, במקום או בכל נקודה מראה מה יש שם, ואפשר ללכת לשם לבד או לשלוח אנשים. במקרא יש הסבר לכל סימן, ושם בוחרים אם המפה הקטנה מסתובבת איתך או שהצפון תמיד למעלה`],
    ['משחק משותף', 'בגרסה של המשחק שבאתר claude.ai, כל מי שהמשחק שותף איתו בהזמנה (בשמו, לא בקישור ציבורי) ופתח אותו נמצא באותו עולם: רואים אותו בכחול על הגלובוס, במפה ובמפה הקטנה, ובעולם עצמו עם השם מעל הראש. הכפתור 🌍 למעלה פותח את העולם המשותף: לכתוב לכולם, לנפנף, לשלוח מתנה (אוכל, עצים או זהב) או לסמן מישהו כיעד וללכת אליו. הכפרים של כל השחקנים נכתבים בספר העולם ומופיעים על הגלובוס גם כשהם לא מחוברים (צריך הרשאת "תורם" ומעלה כדי שהכפר שלך ייכתב). באפליקציית האנדרואיד המשחק לשחקן אחד'],
    ['מי אחראי כשאתה יוצא', 'כשיוצאים רחוק מהכפר, מישהו נשאר אחראי לפי סדר השבט: הסגן שבחרת, בן או בת הזוג, הילדים הבוגרים, ואז האבירים, הלוחמים, הסוחרים, הציידים, הבונים והאוספים (הוותיק קודם). האחראי מוביל את ההגנה כשתוקפים את הכפר, ממשיך את העבודה ומקבל את השליחים שבאים, וכשחוזרים הוא מספר מה קרה: אוכל, בנייה, לידות, פשיטות ושליחים שמחכים. בוחרים סגן בכרטיס של כל אחד (📣 ← ⭐). גם ראשי שבטים, מלכים וחאנים אחרים יוצאים לפעמים לביקור, לציד או לדרך עם שומרים, ואז ממלא המקום שלהם אחראי. אם ראש שבט נופל בדרך, ממלא המקום הופך לראש השבט'],
    ['תפקיד ופקודה לכל אחד', 'במסך האנשים, 📣 ליד השם: לתת תפקיד (גם אביר וסוחר), פקודה רק לו (לצוד, להביא עצים, לדוג, לשמור), לבוא איתך, או לחזור לגור בבתים. תושב מהבתים אפשר לקרוא החוצה עם תפקיד'],
    ['אבירים', 'אביר הוא לוחם בשריון, קסדה ומגן, עם חרב: חזק כמעט פי שניים מלוחם וקשה להפיל. צריך אורווה בכפר ו־30 זהב. בפשיטה האבירים רוכבים ראשונים'],
    ['מסחר וזהב', 'במחסן ← "מסחר עם השבטים", או בשיחה עם אנשי שבט אחר: קונים ומוכרים אוכל, עצים, נשק, סוסים ובקר תמורת זהב 🪙. ליד המחנה שלהם סוחרים מיד, ומרחוק סוחר מהשבט לוקח שיירה ומביא את מה שנקנה. ידידים מוכרים בזול, וכל סוחר בשבט משפר את המחיר'],
    ['פשיטה ושלל', 'בחדר המלחמה ← 🏹 פשיטה (על שבט בשלום, זו הכרזת מלחמה). בוחרים מי יוצא ומה לוקחים: אוכל, רכוש (זהב וכלי נשק) או בעלי חיים (סוסים ובקר). אחרי הניצחון כל לוחם לוקח דבר אחד ומביא אותו הביתה, והבקר מובל אחריהם'],
    ['השבטים גדלים', 'כל שבט גדל עם הזמן: ממחנה לכפר, לכפר גדול ולעיירה, ובונה עוד בקתות. שבט גדול מדי שולח חלק מאנשיו להקים שבט חדש. בעולם יש עכשיו יותר שבטים, גם באזורים החדשים'],
    ['העולם עגול', 'הים מקיף את העולם: מי שמפליג כל הזמן מזרחה חוזר מהמערב. מעבר לאוקיינוס יש יבשת שנייה, העולם הישן. במפה, 🌍 מראה את כדור הארץ ואפשר לסובב אותו'],
    ['העולם הישן', 'ממלכות אירופה עם טירות, אבירים ומלך, ארצות הצפון של הוויקינגים, הערבה של המונגולים, סין, יפן, ערב ומצרים, אפריקה של מאלי, והודו. בכל ארץ יש חיות משלה: איילים, חזירי בר, טיגריסים, סוסי בר ועוד'],
    ['הספינה לעולם הישן', 'שבט הים ושבט האלמוגים, על חוף הים בדרום, מפליגים לעולם הישן: מדברים עם אחד מהם ← 🚢. ההפלגה הראשונה חינם, ואחריה 8 זהב. המשפחה, החיות ומי שהולך איתך מפליגים איתך. חוזרים מעיירת הטחנות או מנמל הפיורד'],
    ['דרכים ושודדים', 'בין הערים של העולם הישן עוברות דרכים, ולצדן אורבים שודדים. כשהם חוסמים את הדרך: לשלם או להילחם. שודד שנופל משאיר זהב, ובמחנה שלהם יש שלל. האבירים יוצאים לסיורים בדרכים'],
    ['טירות וממלכות', 'לכל עם יש שליט: מלך, יארל, חאן, קיסר, שוגון, סולטן, פרעה, מנסה או מהרג׳ה. אפשר לדבר איתם, לסחור, לכרות ברית או לפשוט. טירה או עיר עם חומות קשות יותר לכיבוש. פשיטה ושיירה לא חוצות את האוקיינוס'],
    ['לבחור מי אחראי', `כשיוצאים מהכפר מופיעה למעלה שאלה קטנה: מי אחראי עד שתחזור. "⭐ לבחור מישהו אחר" פותח את הרשימה. אפשר לבחור גם במסך האנשים (⭐ לבחור ליד כל שם). כשחוזרים, האחראי בא אליך, מחזיר לך את הפיקוד וחוזר לתפקיד שלו`],
    ['כרייה', `על גבעות וסלעים יש מרבצים: זהב צהוב, ברזל חלוד, נחושת ירוקה, מלח לבן, אבני חן וורודות ואבן. עומדים ליד הסלעים ומחזיקים ${T ? 'את כפתור הזהב' : 'E'}. זהב נכנס לארנק, והשאר לתיק (עד 40) ולמחסן. מרבץ שהתרוקן מתמלא אחרי כמה ימים. מרבצים שמצאת מסומנים במפה ביהלום צבעוני`],
    ['כורים מהשבט', 'פקודות ← ⛏️ לכרות במרבץ: אנשים הולכים למרבץ הקרוב (או לזה שסימנת במפה) ומביאים מחצבים למחסן'],
    ['ברזל ומחצבים', `${T ? 'נשק ← ארסנל' : 'G'}: מברזל עושים ראשי חנית, ראשי חץ ולהב לחרב, חזקים יותר. את כל המחצבים מוכרים בשוק: מלח יקר באפריקה, אבני חן יקרות בכל מקום חוץ מהודו`],
    ['פשיטות בעולם הישן', 'הוויקינגים מפליגים בספינות ארוכות לפשוט על ערים בחוף, הרוכבים המונגולים דוהרים לגנוב עדרים, ושודדים יוצאים בלילה. לידך זה קורה מול העיניים. מי שעוזר לעיר להדוף את הפושטים מקבל ממנה זהב. גם הכפר שלך יכול להיות מטרה'],
    ['פשיטת לילה', 'במסך הפשיטה: 🌙 לתקוף בלילה. הלוחמים מחכים ליד המחנה שלהם עד שיחשיך, ורבים שם ישנים ומתעוררים לאט'],
    ['עוד חיות', 'בעולם הישן יש עכשיו ארנבות, שונרים, נמרי שלגים, סייגות ושוורי מושק, עדרי גנו ותאואים, חזירי יבלות ובבונים באפריקה, צבאים מנוקדים, לנגורים ודובים בהודו, ופנדות אדומות בסין. ובשמיים: חסידות, עגורים, להקות פלמינגו, טווסים, עיטים ונשרים'],
    ['שמירה', 'המשחק נשמר לבד כל כמה שניות, וגם כשעוצרים או יוצאים. כשמשחקים כאן בקלוד הוא נשמר גם בחשבון שלך, ולכן נפתח בכל מחשב או טלפון. באפליקציה לאנדרואיד השמירות נפרדות: בתפריט הראשי, "המשחקים שלי", 📤 קוד העברה מעביר משחק ממקום למקום'],
  ];
  k.insertAdjacentHTML('beforeend', rows.map(([a, b]) => `<kbd>${a}</kbd><span>${b}</span>`).join(''));
}
function vxMenuInit() {
  if (VXM.init) return; VXM.init = true; vxHelp();
  const side = document.querySelector('#menu .menu-side'); if (!side) return;
  const home = document.createElement('div'); home.id = 'vxHome';
  home.innerHTML = '<p class="vxsub">המסע של הצייד</p><p class="vxtag">נזרקת לבד ללב הג׳ונגל, עם סכין, גרזן וחנית אחת. מוצאים שבט ומרוויחים בו מקום, מוצאים אישה, ובונים שבט משלך שגדל וחי מעצמו: ממדורה אחת ועד עיר שלמה. השבטים האחרים לא תמיד ישמחו, ולכל עץ שנכרת יש מחיר.</p><div class="vxsteps"><span>🔥 לשרוד לבד</span><span>🛖 להצטרף לשבט</span><span>💍 למצוא אישה</span><span>🏘️ לבנות כפר</span><span>⚔️ מלחמה ושלום</span><span>🤝 בריתות</span><span>🐎 סוסים וכרכרות</span><span>🏛️ ועד עיר</span></div>';
  side.querySelector('.title').insertAdjacentElement('afterend', home);
  const back = document.createElement('button'); back.id = 'vxBack'; back.className = 'vxlink'; back.textContent = '‹ חזרה למסע הצייד';
  side.querySelector('.ask').insertAdjacentElement('beforebegin', back);
  const link = document.createElement('button'); link.id = 'vxAnimals'; link.className = 'vxlink'; link.innerHTML = 'לשחק כחיה בג׳ונגל <span>יגואר, קיימן, עיט, דגים ועוד ›</span>';
  side.querySelector('.ctarow').insertAdjacentElement('afterend', link);
  back.addEventListener('click', () => { SET.sp = 'hunter'; saveSet(); UI.syncMenu(); menuPreview(); AUD.play('ui'); });
  link.addEventListener('click', () => { SET.sp = VXM.lastAnimal || 'jaguar'; saveSet(); UI.syncMenu(); menuPreview(); AUD.play('ui'); });
  const hb = $('spList').querySelector('button[data-sp="hunter"]'); if (hb) hb.parentElement.style.display = 'none';
  if (SET.sp !== 'hunter') { VXM.lastAnimal = SET.sp; SET.sp = 'hunter'; saveSet(); }
  const st = document.createElement('style');
  st.textContent = `body.vxhm #menu .tag,body.vxhm #menu .ask,body.vxhm #spList,body.vxhm #spMini,body.vxhm #spRole,body.vxhm #vxBack{display:none!important}
body:not(.vxhm) #vxHome,body:not(.vxhm) #vxAnimals{display:none!important}
#vxHome .vxsub{font:700 21px Rubik,sans-serif;color:#e8b04b;margin:4px 0 6px;letter-spacing:.3px}
#vxHome .vxtag{margin:0 0 12px;font-size:15.5px;line-height:1.55;color:#dcd8c6;max-width:36ch}
.vxsteps{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 16px}.vxsteps span{font-size:12.5px;padding:4px 10px;border-radius:999px;background:rgba(232,176,75,.16);border:1px solid rgba(232,176,75,.42);color:#f3ead1}
.vxlink{align-self:flex-start;background:none;border:0;color:#e9e4d2;font:500 14.5px Rubik,sans-serif;cursor:pointer;padding:10px 0 4px;text-align:right;opacity:.92}.vxlink span{color:#a9a893;font-size:12.5px;margin-right:6px}.vxlink:hover{color:#e8b04b}
#vxBack{padding:2px 0 6px}
.vxjourney{margin:0;padding:0 18px 0 0;display:flex;flex-direction:column;gap:7px}.vxjourney li{font-size:13.5px;line-height:1.45;color:#d9d6c5}.vxjourney b{color:#f4efe1;margin-left:6px}.vxjourney li::marker{color:#e8b04b;font-weight:700}
@media (max-height:520px){#vxHome .vxtag{display:none}#vxHome .vxsub{font-size:16px;margin:2px 0 6px}.vxsteps{margin-bottom:8px}.vxsteps span{font-size:11px;padding:2px 8px}.vxlink{padding:6px 0 0;font-size:13px}}`;
  document.head.appendChild(st);
}
function vxSyncMenu() {
  if (!VXM.init) return;
  const hm = vxHunterMode(); document.body.classList.toggle('vxhm', hm);
  if (!hm) VXM.lastAnimal = SET.sp;
  const sx = $('sexSeg');
  if (sx) { const bs = sx.querySelectorAll('button'); if (bs.length === 2) { bs[0].textContent = hm ? 'גבר' : 'זכר'; bs[1].textContent = hm ? 'אישה' : 'נקבה'; } const lab = sx.parentElement.querySelector('span'); if (lab) lab.textContent = hm ? 'הצייד' : 'מין'; }
  if (hm) $('spInfo').innerHTML = JOURNEY_HTML;
}
function syncContinue() {
  migrateSaves(); indexEnrich();
  const c = $('contBtn'), s = $('startBtn'); if (!c) return;
  const sv = readSave(), n = saveIndex().length, hm = vxHunterMode();
  c.hidden = !sv;
  if (sv) c.textContent = n > 1 ? `המשחקים שלי (${n})` : sv.sp === 'hunter' ? `להמשיך את המסע · יום ${sv.day}${sv.ownCamp ? ' · 🏘️' : ''}` : `להמשיך: ${SPECIES[sv.sp].he}, יום ${sv.day}, רמה ${sv.lvl || 1}`;
  s.textContent = hm ? (sv ? 'מסע חדש' : 'להתחיל את המסע') : (sv ? 'משחק חדש' : 'להיכנס לג׳ונגל'); s.classList.toggle('alt', !!sv);
  saveLineSync();
}

// ---------- the journey, step by step ----------
const FLX = (...fs) => () => fs.some(f => !!PROG.flags[f]);
MISSIONS.hunter = [
  MS('hunter.drink', 'לשתות מים מהנהר', 15, FL('drink')),
  MS('hunter.throw', 'לפגוע בחנית ממרחק', 30, FL('throw')),
  MS('hunter.fell', 'לכרות עץ בגרזן', 25, () => (PROG.flags.fell || 0) >= 1),
  MS('hunter.butcher', 'לחתוך בשר מטרף', 30, FL('butcher')),
  MS('hunter.cook', 'להדליק מדורה ולבשל בשר', 40, FL('cook')),
  MS('hunter.smoke', 'למצוא שבט: ללכת לכיוון העשן', 60, FL('foundTribe')),
  MS('hunter.chief', 'לדבר עם ראש השבט', 30, FLX('talkChief', 'joined', 'found')),
  MS('hunter.join', 'להתקבל לשבט', 120, FLX('joined', 'found')),
  MS('hunter.rank1', 'להגיע לדרגת צייד השבט', 80, FLX('rank1', 'found')),
  MS('hunter.bow', 'לקבל קשת ולירות חץ', 40, FLX('arrow')),
  MS('hunter.tame1', 'לאלף כלב יער בבשר', 60, () => !!(P.a.pets && P.a.pets.some(b => b.alive)) || !!PROG.flags.tamedDog),
  MS('hunter.rank2', 'להגיע לדרגת לוחם השבט', 120, FLX('rank2', 'found')),
  MS('hunter.wife1', 'למצוא אישה בהסכמת ראש השבט שלה', 120, () => aliveMates().length >= 1 || !!PROG.flags.found),
  MS('hunter.found', 'להקים שבט משלך, ליד מים', 200, FL('found')),
  MS('hunter.hut', 'לבנות בקתה ראשונה', 80, FL('built_hut')),
  MS('hunter.cls', 'לתת תפקיד לבן השבט', 40, FL('setcls')),
  MS('hunter.tier1', 'להפוך את המחנה לכפר', 150, FL('tier1')),
  MS('hunter.field', 'לבנות גינה ליד המים', 80, FL('built_field')),
  MS('hunter.tower', 'לבנות מגדל שמירה', 80, FL('built_tower')),
  MS('hunter.raid', 'להדוף פשיטה של טורפים על הכפר', 150, FL('raidWon')),
  MS('hunter.tier2', 'לגדול לכפר גדול: 14 אנשים וארבעה בתים', 200, FL('tier2')),
  MS('hunter.long', 'לבנות בית ארוך', 120, FL('built_long')),
  MS('hunter.totem', 'להקים טוטם לשבט', 120, FL('built_totem')),
  MS('hunter.hall', 'לבנות את בית המועצה', 250, FL('built_hall')),
  MS('hunter.tier3', 'להפוך את הכפר לעיירה', 300, FL('tier3')),
  MS('hunter.tier4', 'להפוך את העיירה לעיר', 500, FL('tier4')),
  MS('hunter.day20', 'לשרוד עשרים ימים', 300, () => G.day >= 20)
];
for (const m of MISSIONS.hunter) GOAL[m.id] = m;
// a few words at the start, when the hunter is alone
function vxHints(dt) {
  if (!P.human || !P.a || G.paused) return;
  if (VX.introT > 0) { VX.introT -= dt; if (VX.introT <= 0 && !ownCamp() && VX.mem < 0) UI.notify('כדי לשרוד: לשתות מהנהר, לצוד בחנית, לחתוך בשר ולבשל על מדורה. עצים כורתים בגרזן ליד גזע', 'good'); }
  if (P.a.pets && P.a.pets.some(b => b.alive && b.spId === 'bushdog')) PROG.flags.tamedDog = 1;
}
// ================= THE TRIBE LIVES ON ITS OWN: couples and weddings, babies, children who grow up, roles and building by themselves =================
const KID_H = 30;      // game hours until a child of the tribe is grown (about a day)
const PREG_H = 6;      // game hours of waiting for a baby
const BIRTH_CD = 16;   // game hours between babies of one couple
const FAM = { t: 0, wedTold: 0 };
CLAN.uidN = 0; CLAN.autoRoles = true; CLAN.autoBuild = true; CLAN.planFail = {}; CLAN.planT = 20; CLAN.roleT = 40; CLAN.wedT = 60;
const famAdults = () => TRIBE.adults.filter(m => m.alive && !m.gone && !m.young && m.brain === 'tribe');
const famByUid = u => u ? TRIBE.adults.find(q => q.uid === u && q.alive && !q.gone) || null : null;
const married = m => !!(m.spouse && m.spouse.alive && !m.spouse.gone);
const singles = sex => famAdults().filter(m => !m.isPartner && m.sex === sex && !married(m) && !m.escort && !m.towerB && !(m.job && (m.job.k === 'raid' || m.job.k === 'boat' || m.job.k === 'caravan')));
function famUpdate(dt) {
  FAM.t -= dt; if (FAM.t > 0) return; const step = 1 - FAM.t; FAM.t = 1;
  const gh = step * timeRate(), v = ownCamp();
  for (const m of TRIBE.adults) if (m.spouse && (!m.spouse.alive || m.spouse.gone)) { m.spouse = null; m.preg = 0; }
  famKids(gh);
  if (!v) return;
  famBirths(gh, v);
  if ((CLAN.wedT -= step) <= 0) { CLAN.wedT = rr(25, 45); famWeddings(v); }
  if ((CLAN.roleT -= step) <= 0) { CLAN.roleT = 45; famRoles(); }
  famPlan(step, v);
}
// ---------- weddings: two single people of the tribe become a couple ----------
function famWeddings(v) {
  if (CLAN.hungry > 0.3) return;
  const M = singles('m'), F = singles('f'); if (!M.length || !F.length || rng() > 0.55) return;
  const f = pick(F); let m = null, bd = 1e9;
  for (const q of M) { const d = dist2(q.pos, f.pos) + rng() * 30; if (d < bd) { bd = d; m = q; } }
  if (!m) return;
  m.spouse = f; f.spouse = m; f.birthCD = rr(1, 4);
  PROG.flags.wedding = 1;
  const near = P.a && dist2(P.a.pos, v) < villageR() + 50;
  if (near) {
    for (const q of [m, f]) if (q.dCam < 60 && !q.hidden) { gesture(q, 'cheer', 3); FX.spawn('heart', q.pos.x, q.pos.y + q.height, q.pos.z, 6); }
    say(f, pick(['זה היום הכי שמח שלי', `${m.name}, אני שלך`, 'כל השבט חוגג!']), 3.2); say(m, pick(['נבנה בית משלנו', `${f.name} היא אשתי`, 'נגדל ילדים חזקים']), 3.2);
    for (const q of clanReal()) if (q !== m && q !== f && !q.young && !q.hidden && dist2(q.pos, v) < 30 && rng() < 0.6) gesture(q, 'cheer', 2.5);
    AUD.play('cheer', 0.55);
  }
  if (!FAM.wedTold) { FAM.wedTold = 1; UI.big('חתונה בכפר!', `${m.name} ו${f.name} התחתנו. זוגות בשבט מביאים ילדים כשיש מקום בבתים ואוכל במחסן`); }
  else UI.notify(`💍 חתונה בכפר: ${m.name} ו${f.name} התחתנו`, 'love');
  warLog(`${m.name} ו${f.name} התחתנו`, 'good'); polEvent(1, 'חתונה בכפר');
}
// ---------- babies: a couple has a child when there is room and food ----------
const pregCount = () => TRIBE.adults.filter(m => m.alive && m.preg > 0).length;
function famBirths(gh, v) {
  const room = housing() - popCount(), st = boxStore(), food = st.cooked + st.meat + st.fish, pop = popCount();
  for (const f of TRIBE.adults.slice()) {
    if (!f.alive || f.gone || f.young || f.sex !== 'f' || !married(f) || f.brain !== 'tribe') continue;
    if (f.preg > 0) { f.preg -= gh; if (f.preg <= 0) { f.preg = 0; famBirth(f, f.spouse, v); } continue; }
    f.birthCD = (f.birthCD || 0) - gh; if (f.birthCD > 0) continue;
    if (room - pregCount() < 2 || food < pop * 1.5 || CLAN.hungry > 0.15) continue;
    if (rng() < gh * 0.5) { f.preg = PREG_H; f.birthCD = BIRTH_CD; tribeNews(`${f.name} ו${f.spouse.name} מחכים לתינוק`); }
  }
}
function famBirth(mom, dad, v) {
  const sex = rng() < 0.5 ? 'm' : 'f', name = tribeName(sex);
  PROG.flags.tribeBirth = 1; FAM.births = (FAM.births || 0) + 1; polEvent(1, 'תינוק נולד');
  if (clanReal().length >= MAXREAL) { CLAN.residents++; UI.notify(`👶 נולד ${heb({ sex }, 'בן', 'בת')} ל${mom.name} ו${dad ? dad.name : ''} באחד הבתים`, 'love'); return null; }
  const at = mom.hidden || dist2(mom.pos, v) > villageR() + 30 ? { x: v.x + rr(-3, 3), z: v.z + rr(-3, 3) } : { x: mom.pos.x + rr(-1, 1), z: mom.pos.z + rr(-1, 1) };
  const c = new Animal('hunter', at.x, at.z, { sex, tpl: vxKidTpl(sex), young: true, scale: rr(0.95, 1.05) }); c.ground(1, true);
  c.name = name; c.kidAge = 0; c.momU = mom.uid; c.dadU = dad ? dad.uid : 0; c.cubHunger = 0;
  tribeJoin(c); TRIBE.adults.push(c); kidScale(c);
  if (c.dCam < 40) FX.spawn('heart', c.pos.x, c.pos.y + 0.6, c.pos.z, 6);
  UI.notify(`👶 ${heb(c, 'נולד בן', 'נולדה בת')} ל${mom.name}${dad ? ` ו${dad.name}` : ''}: ${heb(c, 'קוראים לו', 'קוראים לה')} ${name}`, 'love');
  warLog(`${heb(c, 'נולד', 'נולדה')} ${name}, ${heb(c, 'בנם', 'בתם')} של ${mom.name}${dad ? ` ו${dad.name}` : ''}`, 'good');
  return c;
}
// ---------- children grow up and take a place in the tribe ----------
function kidScale(c) {
  const k = clamp((c.kidAge || 0) / KID_H, 0, 1), s = c.baseScale * lerp(0.45, 1, k);
  if (Math.abs(s - c.scale) < 0.004) return;
  const r = s / c.scale; c.scale = s; c.mesh.scale.setScalar(s); c.rad *= r; c.height *= r; c.swimDepth *= r; c.floatDepth *= r;
  c.maxHp = c.sp.hp * lerp(0.35, 1, k) * c.baseScale; c.hp = Math.min(c.hp, c.maxHp);
}
function famKids(gh) {
  for (const c of TRIBE.adults.slice()) {
    if (!c.alive || c.gone || !c.young || c.brain !== 'tribe') continue;
    c.kidAge = (c.kidAge || 0) + gh; kidScale(c); c.hp = Math.min(c.maxHp, c.hp + gh * 3);
    if (c.kidAge >= KID_H) famGrow(c);
  }
}
function famGrow(c) {
  c.kidAge = KID_H; kidScale(c); c.young = false; c.cub = false; c.cls = null; c.job = null; c.sleepAt = null;
  tribeJoin(c);
  PROG.flags.kidGrown = 1; P.raised = (P.raised || 0) + 1;
  UI.notify(`${c.name} ${heb(c, 'גדל והפך ל', 'גדלה והפכה ל')}${clsWord(c)} בשבט`, 'good');
  warLog(`${c.name} ${heb(c, 'גדל', 'גדלה')} ${heb(c, 'והפך', 'והפכה')} ל${clsWord(c)}`, 'good');
}
function kidLine(c) {
  const mom = famByUid(c.momU), dad = famByUid(c.dadU);
  return mom || dad ? `${heb(c, 'הבן', 'הבת')} של ${[mom && mom.name, dad && dad.name].filter(Boolean).join(' ו')}` : '';
}
function famLine(m) {
  if (m.young) return kidLine(m);
  const out = [];
  if (married(m)) out.push(`${heb(m, 'נשוי ל', 'נשואה ל')}${m.spouse.name}`);
  if (m.preg > 0) out.push('מחכים לתינוק');
  const kids = TRIBE.adults.filter(k => k.alive && k.young && (k.momU === m.uid || k.dadU === m.uid)).length;
  if (kids) out.push(kids === 1 ? 'ילד אחד' : `${kids} ילדים`);
  return out.join(' · ');
}
// ---------- the tribe divides the work by itself, by what the village needs ----------
function roleWants() {
  const st = boxStore(), pop = popCount(), food = st.cooked + st.meat + st.fish, days = food / Math.max(6, pop * 4.5);
  const w = { warrior: 0.18, hunter: 0.28, builder: 0.24, gatherer: 0.3 };
  if (days < 1) { w.hunter += 0.1; w.gatherer += 0.08; w.builder -= 0.08; w.warrior -= 0.04; }
  else if (days > 4) { w.hunter -= 0.08; w.builder += 0.06; }
  const threat = pressStage() + (warActive() ? 2 : 0) + (WAR.parties.some(p => p.to === 'own') ? 2 : 0);
  w.warrior += threat * 0.05;
  if (BLD.sites.length > 1 || (st.wood || 0) < 20) w.builder += 0.06;
  let s = 0; for (const k of WORK) { w[k] = Math.max(0.05, w[k]); s += w[k]; } for (const k of WORK) w[k] /= s;
  return w;
}
function famRoles() {
  if (!CLAN.autoRoles || !ownCamp()) return;
  const all = clanAdults().filter(m => WORK.includes(m.cls)), n = all.length; if (n < 3) return;
  const free = all.filter(m => !m.isPartner && !m.clsLock && !m.escort && !m.towerB && m.state !== 'fight' && !(m.job && (m.job.k === 'raid' || m.job.k === 'bring' || m.job.k === 'collect' || m.job.k === 'home' || (m.job.k === 'fell' && m.job.t > 0))));
  if (!free.length) return;
  const w = roleWants(), cnt = k => all.filter(m => m.cls === k).length;
  let need = null, nd = 0.75, over = null, od = 0.75;
  for (const k of WORK) { const d = w[k] * n - cnt(k); if (d > nd) { nd = d; need = k; } if (-d > od && free.some(m => m.cls === k)) { od = -d; over = k; } }
  if (!need) return;
  const pool = free.filter(m => m.cls === (over || m.cls) && m.cls !== need);
  const m = pool.sort((p, q) => (p.job && p.job.k === 'rest' ? -1 : 0) - (q.job && q.job.k === 'rest' ? -1 : 0))[0]; if (!m) return;
  setCls(m, need, true); m.clsLock = false;
  tribeNews(`השבט החליט: ${m.name} ${heb(m, 'יהיה', 'תהיה')} עכשיו ${clsWord(m)}`);
}
// ---------- the builders plan the village and build on their own ----------
const bCount = t => BLD.list.filter(b => b.t === t).length;
function planList() {
  const pop = popCount(), room = housing() - pop, st = boxStore(), food = st.cooked + st.meat + st.fish, war = warActive(), L = [];
  const house = () => pop >= 30 && !bCount('hall') ? 'hall' : pop >= 16 && bCount('long') < 1 + Math.floor(pop / 25) ? 'long' : pop >= 8 ? 'house' : 'hut';
  // what the next stage of the village still lacks comes first: the council hall, or more houses
  const R = TIER_REQ[villageTier() + 1];
  if (R) {
    const h = tierHave(), planned = BLD.list.filter(b => !b.done && (b.t === 'hut' || b.t === 'house' || b.t === 'long' || b.t === 'hall')).length;
    if (R.hall && !h.hall && pop >= BTYPES.hall.need && !bCount('hall')) L.push('hall');
    else if (R.houses && h.houses + planned < R.houses && pop >= R.pop * 0.7) L.push(pop >= 8 ? 'house' : 'hut');
  }
  if (room < 4) L.push(house());
  if ((war || pressStage() >= 1 || pop >= 12) && bCount('tower') < Math.min(6, 1 + Math.floor(pop / 14))) L.push('tower');
  if (bCount('torch') < Math.min(14, 3 + Math.floor(pop / 4))) L.push('torch');
  if (food < pop * 3 && bCount('field') < 1 + Math.floor(pop / 8)) L.push('field');
  if (bCount('granary') < Math.floor(pop / 10)) L.push('granary');
  if (!bCount('dock')) L.push('dock');
  if (bCount('kennel') < 1 + Math.floor(pop / 25)) L.push('kennel');
  if (bCount('stable') < (pop >= 30 ? 2 : 1)) L.push('stable');
  if (!bCount('armory')) L.push('armory');
  if (!bCount('aviary')) L.push('aviary');
  if (!bCount('totem')) L.push('totem');
  if (!bCount('cartshop') && BLD.list.some(b => b.done && b.t === 'stable')) L.push('cartshop');
  if (!bCount('shipyard') && villageTier() >= 4) L.push('shipyard');
  if (room < 8) L.push(house());
  return L;
}
function famPlan(step, v) {
  if (!CLAN.autoBuild || BLD.mode) return;
  if ((CLAN.planT -= step) > 0) return; CLAN.planT = 25;
  const builders = clanAdults().filter(m => m.cls === 'builder' && !m.escort).length; if (!builders) return;
  famDefend();   // fences and walls have their own track: their pieces are paid only from spare wood
  if (BLD.sites.filter(q => !BTYPES[q.t].def).length >= Math.min(3, 1 + Math.floor(builders / 3))) return;
  boxStore(); const wood = CAMPH.store.wood || 0;
  for (const t of planList()) {
    const T = BTYPES[t]; if (!T || !buildUnlocked(t) || G.t - (CLAN.planFail[t] || -999) < 300) continue;
    if (wood < T.wood) { CLAN.planWant = t; if (T.cap) return; continue; }
    const s = autoSpot(t, v); if (!s) { CLAN.planFail[t] = G.t; continue; }
    CAMPH.store.wood -= T.wood; CLAN.planWant = null;
    addBuilding(t, s.x, s.z, s.rot, 0, false, true);
    UI.notify(`🔨 הבונים התחילו לבנות ${T.n}${t === 'torch' ? ' בשולי הכפר' : ''}`, 'good'); PROG.flags.autoBuild = 1;
    return;
  }
  famUpgrade();
}
// the camp itself is improved too, when there is wood to spare
function famUpgrade() {
  const st = boxStore();
  for (const id of ['fire', 'fence', 'tents', 'shelter', 'rack', 'dry', 'pen', 'tower', 'workshop', 'walls']) {
    const u = UPG.find(q => q.id === id); if (!u || CAMPH.up[id]) continue;
    if ((st.wood || 0) < (u.cost.wood || 0) + 25 || (st.fish || 0) < (u.cost.fish || 0)) return;
    st.wood -= u.cost.wood || 0; st.fish -= u.cost.fish || 0; CAMPH.up[id] = 1; applyCampUp(id, true);
    UI.notify(`🔨 השבט בנה: ${u.n}`, 'good'); return;
  }
}
// a good place for a new building: inside the village, near the others, never blocking the fire
function autoSpot(t, v) {
  const T = BTYPES[t], R = villageR(), out = [];
  if (t === 'dock') return dockSpot(v);
  if (t === 'shipyard') return shipyardSpot(v);
  for (let ring = 0; ring < 9; ring++) {
    const rad = T.r + 8 + ring * 4.5; if (rad > R + 24) break;
    const n = Math.max(8, Math.round(rad * 0.9));
    for (let k = 0; k < n; k++) {
      const ang = (k + (ring % 2) * 0.5) / n * TAU + rr(-0.05, 0.05), x = v.x + Math.cos(ang) * rad, z = v.z + Math.sin(ang) * rad;
      if (buildCheck(t, x, z) || zoneTribeAt(x, z) >= 0) continue;   // the builders keep out of other tribes' land
      if (keepAt(x, z, T.r + 1)) continue;   // and off a spot the hunter has just cleared or moved something from
      let sc = -rad * 0.4 + rng();
      if (t === 'torch') { sc = -Math.abs(rad - R * 0.9) * 0.6; for (const b of BLD.list) if (b.t === 'torch' && Math.hypot(b.x - x, b.z - z) < 10) sc -= 30; }
      if (t === 'tower') { sc = -Math.abs(rad - R) * 0.5; for (const b of BLD.list) if (b.t === 'tower' && Math.hypot(b.x - x, b.z - z) < 30) sc -= 40; }
      if (t === 'field') sc = -waterDist(x, z) * 0.6 - rad * 0.1;
      if (t === 'totem' || t === 'hall') sc = -rad;
      for (const b of BLD.list) if (b.t !== 'torch' && bldDist(b, x, z) < T.r + bldR(b) + 2.4) sc -= 3;
      out.push({ x, z, sc, rot: Math.atan2(v.x - x, v.z - z) });
    }
    if (out.length > 14 && t !== 'torch' && t !== 'tower') break;
  }
  if (!out.length) return null;
  out.sort((p, q) => q.sc - p.sc); return out[0];
}
// the families of the tribe, for the people screen
function famTribeHtml() {
  const couples = famAdults().filter(m => m.sex === 'f' && married(m)), sing = famAdults().filter(m => !m.isPartner && !married(m)).length;
  const kids = TRIBE.adults.filter(m => m.alive && m.young), preg = TRIBE.adults.filter(m => m.alive && m.preg > 0);
  const rows = couples.map(f => `<div class="irow"><div><b>💍 ${f.spouse.name} ו${f.name}</b><span>${famLine(f)}${f.preg > 0 ? ` · התינוק בעוד ${Math.max(1, Math.round(f.preg))} שעות` : ''}</span></div></div>`).join('');
  return `<h3>משפחות בשבט</h3><div class="cstock"><span class="cchip">💍 ${couples.length} זוגות</span><span class="cchip">🧒 ${kids.length} ילדים</span><span class="cchip">🤰 ${preg.length} מחכים לתינוק</span><span class="cchip">🙂 ${sing} רווקים</span></div>` +
    (rows || '<p class="idim">עוד אין זוגות בשבט. כשיש בכפר גברים ונשים פנויים, הם מתחתנים.</p>') +
    '<p class="idim">זוג מביא ילד כשיש מקום בבתים ואוכל במחסן. ילד גדל בערך ביום וחצי, ואז מקבל תפקיד שהשבט צריך.</p>';
}
// ================= THE VILLAGE AT WORK: torches at night, guarded towers, dogs and eagles, the armory, docks and canoes =================
const STRUCT = { t: 0, dogAcc: 0, eagleAcc: 0, armAcc: 0, lights: null, fireT: 0, told: {} };
const BOATS = [];
const FIREP = { x: 0, y: 0, z: 0 };
const FIRE_THREAT = { pos: FIREP, alive: true, fire: true, rad: 0.3, height: 1, sp: { he: 'אש' } };
const DOGN = { m: ['ברק', 'זאב', 'טורו', 'קאי', 'רעם', 'שאגי', 'טופי', 'צל'], f: ['לונה', 'ניקה', 'סופה', 'טאיה', 'אש', 'צללית', 'מיה', 'רוחה'] };
const EAGLEN = ['רוח', 'סער', 'נוצה', 'ברק', 'חץ', 'עננה', 'טפר', 'שמש'];
function structUpdate(dt) {
  STRUCT.t -= dt;
  if (STRUCT.t <= 0) {
    const step = 1 - STRUCT.t; STRUCT.t = 1; const gh = step * timeRate();
    structSync();
    if (ownCamp()) { towerAssign(); kennelTick(gh); aviaryTick(gh); armoryTick(gh); }
    if (isNight()) torchRepel();
  }
  torchVisuals(dt); boatVisuals(dt); propsUpdate(dt);
}
// ---------- torches: a flame on every torch post, light near the camera, and predators keep away ----------
function structSync() {
  for (const b of BLD.list) {
    if (b.t === 'torch' && b.done && !b.fl) torchFlame(b);
    if (b.t === 'dock' && b.done && !BOATS.some(q => q.dock === b)) dockBoat(b);
  }
}
const nightK = () => clamp(SKY.night || 0, 0, 1);
function torchFlame(b) {
  const y = getH(b.x, b.z) + 2.28, fl = [];
  for (const [r, h, color] of [[0.13, 0.5, '#ff8a2a'], [0.07, 0.34, '#ffe08a']]) {
    const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 7, 1, true), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.88, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    m.position.set(b.x, y + h / 2, b.z); m.userData.h = h; scene.add(m); fl.push(m);
  }
  const g = new THREE.Sprite(new THREE.SpriteMaterial({ map: HUNT.glowTex, color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  g.position.set(b.x, y + 0.3, b.z); g.scale.setScalar(3.4); scene.add(g);
  b.fl = { fl, g, y };
}
function structClear(b) {
  if (b.fl) { for (const m of b.fl.fl) scene.remove(m); scene.remove(b.fl.g); b.fl = null; }
  for (let i = BOATS.length - 1; i >= 0; i--) if (BOATS[i].dock === b) { if (P.boat === BOATS[i]) boatLeave(true); boatRemove(BOATS[i]); }
  if (b.guard) { towerLeave(b.guard); b.guard = null; }
}
function torchVisuals(dt) {
  const n = nightK(), cp = camera.position, on = n > 0.05;
  const src = [];
  for (const b of BLD.list) {
    if (!b.fl) continue;
    const d = Math.hypot(cp.x - b.x, cp.z - b.z), vis = on && d < 240;
    for (const m of b.fl.fl) { m.visible = vis; if (vis) { const k = 0.85 + Math.sin(G.t * 13 + b.x + m.userData.h * 9) * 0.12 + Math.sin(G.t * 7.3 + b.z) * 0.08; m.scale.set(1, k, 1); m.position.y = b.fl.y + m.userData.h * k / 2; } }
    b.fl.g.visible = vis; if (vis) { b.fl.g.material.opacity = n * (0.7 + Math.sin(G.t * 9 + b.x) * 0.08); b.fl.g.scale.setScalar(2.6 + n * 1.8); }
    if (vis && d < 70) src.push([d, b.x, b.fl.y + 0.4, b.z]);
  }
  for (const a of PROPS.carry) if (a.alive && !a.gone && a.props && a.props.torch && a.props.torch.visible) { const d = Math.hypot(cp.x - a.pos.x, cp.z - a.pos.z); if (d < 60) src.push([d + 6, a.pos.x, a.pos.y + 1.9, a.pos.z]); }
  if (!src.length && !STRUCT.lights) return;
  if (!STRUCT.lights) { STRUCT.lights = [0, 1].map(() => { const l = new THREE.PointLight(0xffa64a, 0, 20, 1.5); scene.add(l); return l; }); }
  src.sort((p, q) => p[0] - q[0]);
  STRUCT.lights.forEach((l, i) => { const s = src[i]; const want = s && on ? 2.3 * n + Math.sin(G.t * 11 + i) * 0.2 : 0; l.intensity += (want - l.intensity) * Math.min(1, dt * 5); if (s) l.position.set(s[1], s[2], s[3]); });
}
function torchRepel() {
  for (const b of BLD.list) {
    if (!b.fl) continue;
    shQuery(b.x, b.z, 9, x => {
      if (!x.alive || x.isPlayer || x.pet || x.legend || x.tribe || x.hunter || x.tpl.kind !== 'quad' || !(x.sp.ai === 'pred' || x.sp.ai === 'pack') || x.state === 'flee') return;
      if (x.state === 'fight' && x.foe && dist2(x.foe.pos, x.pos) < 4) return;
      FIREP.x = b.x; FIREP.y = getH(b.x, b.z); FIREP.z = b.z; threatReact(x, FIRE_THREAT, true);
      if (!STRUCT.told.fire && P.a && dist2(P.a.pos, b) < 40) { STRUCT.told.fire = 1; UI.notify(`${x.sp.he} נבהל מהלפיד ובורח`, 'good'); }
    });
  }
}
// the hunter plants a torch wherever he stands
function plantTorch() {
  const a = P.a, x = a.pos.x + Math.sin(a.yaw) * 1.2, z = a.pos.z + Math.cos(a.yaw) * 1.2;
  if (waterDepth(x, z) > 0 || getNY(x, z) < 0.75) { UI.notify('נועצים לפיד באדמה יבשה ושטוחה', 'bad'); return false; }
  if (!takeRes('wood', 1)) { UI.notify('צריך עץ אחד ללפיד', 'bad'); return false; }
  const b = addBuilding('torch', x, z, 0, 0, false, false); buildDone(b, true); b.planted = true; structSync();
  UI.notify('נעצת לפיד. בלילה הוא מאיר, וטורפים לא מתקרבים אליו', 'good'); PROG.flags.plantTorch = 1; AUD.play('swipe', 0.4);
  return true;
}
// ---------- towers: a guard with a bow stands on every finished tower ----------
const GUARDP = { tower: { lx: 0.6, lz: 1.6, top: 4.47 }, gatehouse: { lx: 1.2, lz: 1.1, top: 3.15 }, walltower: { lx: 1.3, lz: 1.85, top: 4.72, inner: 1 } };
// the ladder; on a wall tower it stands on the village side of the wall
const towerLadder = b => {
  const g = GUARDP[b.t] || GUARDP.tower, c = Math.cos(b.rot), s = Math.sin(b.rot);
  if (g.inner && b.inS == null) { const v = ownCamp(); b.inS = v && (v.x - b.x) * s + (v.z - b.z) * c < 0 ? -1 : 1; }
  const lz = g.lz * (g.inner ? b.inS : 1);
  return { x: b.x + g.lx * c + lz * s, z: b.z - g.lx * s + lz * c };
};
function towerAssign() {
  for (const b of BLD.list) {
    if (!GUARDP[b.t] || !b.done || b.broken) continue;
    const g = b.guard;
    if (g && g.alive && !g.gone && g.towerB === b && !g.escort && !g.ord && (g.cls === 'warrior' || g.cls === 'hunter') && !(g.job && g.job.k === 'raid')) continue;
    if (g && g.towerB === b) towerLeave(g);
    b.guard = null;
    const pool = clanAdults().filter(m => !m.towerB && !m.escort && !m.ord && !m.isPartner && !(m.job && m.job.k === 'raid') && m.brain === 'tribe');
    const near = L => L.sort((p, q) => dist2(p.pos, b) - dist2(q.pos, b))[0];
    const W = pool.filter(m => m.cls === 'warrior'), H = pool.filter(m => m.cls === 'hunter');
    const manned = BLD.list.filter(q => GUARDP[q.t] && q.guard).length;
    const pickG = W.length > 1 ? near(W) : H.length > 1 ? near(H) : !manned ? (W[0] || H[0] || null) : null;
    if (pickG) { pickG.towerB = b; b.guard = pickG; pickG.job = null; pickG.state = 'idle'; pickG.foe = null; }
  }
}
function towerLeave(a) {
  if (!a) return;
  if (a.onTower) { a.onTower = false; a.ownY = false; const b = a.towerB, p = b ? towerLadder(b) : a.pos; a.pos.set(p.x, 0, p.z); a.ground(1, true); }
  if (a.towerB && a.towerB.guard === a) a.towerB.guard = null;
  a.towerB = null; a.climbT = 0;
}
function towerTarget(a, b) {
  const v = ownCamp(), R = v ? villageR() + 22 : 30; let best = null, bd = 1e9;
  shQuery(b.x, b.z, 44, (x, d) => {
    if (!x.alive || x.isPlayer || x.tribe || x.cowCamp || x.young || x.duel || x.brain === 'captive' || x.tpl.kind === 'fish' || x.tpl.kind === 'bird') return;
    const attacking = (x.state === 'fight' && ourSide(x.foe)) || ((x.state === 'hunt' || x.state === 'stalk') && ourSide(x.target)) || (x.state === 'defend' && ourSide(x.foe));
    if (x.hunter) { if (!attacking && (!enemyOf(x) || x.brain === 'villager')) return; }
    else if (x.pet) { if (!attacking) return; }
    else if (!attacking && !((BIGP.has(x.spId) || x.legend) && v && Math.hypot(x.pos.x - v.x, x.pos.z - v.z) < R && !(x.spId === 'caiman' && x.swimming))) return;
    if (d < bd) { bd = d; best = x; }
  });
  return best;
}
function towerJob(a, dt, v) {
  const b = a.towerB;
  if (!b || !b.done || b.broken || !BLD.list.includes(b) || a.escort || !v || (a.cls !== 'warrior' && a.cls !== 'hunter')) { towerLeave(a); return false; }
  const top = getH(b.x, b.z) + (GUARDP[b.t] || GUARDP.tower).top;
  a.hidden = false; a.sleepAt = null;
  if (!a.onTower) {
    if (a.state === 'fight' && a.foe && a.foe.alive && dist2(a.foe.pos, a.pos) < 10) return false;
    const L = towerLadder(b), d = jobGo(a, L.x, L.z, a.sp.walk * 1.6, dt);
    if (d < 0.9) { a.onTower = true; a.ownY = true; a.climbT = 1.4; a.state = 'idle'; a.foe = null; a.climbY = a.pos.y; }
    return true;
  }
  if (a.climbT > 0) {
    a.climbT -= dt; const k = 1 - clamp(a.climbT / 1.4, 0, 1), L = towerLadder(b);
    a.pos.set(lerp(L.x, b.x, smooth(0.7, 1, k)), lerp(a.climbY, top, k), lerp(L.z, b.z, smooth(0.7, 1, k))); a.speed = 0; a.pose = 'climb';
    a.yaw = Math.atan2(b.x - L.x, b.z - L.z); return true;
  }
  a.pos.set(b.x, top, b.z); a.swimming = false; a.speed = 0; a.state = 'idle';
  if ((a.watchT = (a.watchT || 0) - dt) <= 0) { a.watchT = 0.6; a.watchTgt = towerTarget(a, b); }
  const t = a.watchTgt && a.watchTgt.alive ? a.watchTgt : null;
  if (t) {
    a.yaw += angDiff(a.yaw, Math.atan2(t.pos.x - a.pos.x, t.pos.z - a.pos.z)) * Math.min(1, dt * 6);
    if (a.spearCD <= 0 && dist2(t.pos, a.pos) < 44) { a.aimBow = true; hunterThrow(a, t, 'arrow'); a.spearCD = rr(1.5, 2.3); if (a.dCam < 50 && G.t - (a.yellT || -99) > 15) { a.yellT = G.t; say(a, pick(['אויב מתקרב!', 'אני רואה אותו!', 'יורה!']), 1.8); } }
    a.pose = 'idle';
  } else { a.look = Math.sin(G.t * 0.5 + a.id) * 1.1; a.yaw += dt * 0.25; a.pose = 'idle'; }
  if (G.t - (b.pingT || -99) > 12 && t && P.a && dist2(P.a.pos, b) > 25) { b.pingT = G.t; P.pings.push({ x: t.pos.x, z: t.pos.z, t: 8 }); }
  return true;
}
// ---------- the kennel: the tribe's hunters and warriors get dogs ----------
const tribeDogs = () => ANIMALS.filter(d => d.alive && !d.gone && d.tribeDog);
function makeTribeDog(owner, x, z, name, sex) {
  const d = new Animal('bushdog', x, z, { sex: sex || (rng() < 0.5 ? 'm' : 'f') }); d.ground(1, true);
  d.name = name || pick(DOGN[d.sex]); d.socialExtra = true; d.tribeDog = true; d.hunger = 100;
  if (owner) { if (!owner.pets) owner.pets = []; makePet(owner, d); }
  return d;
}
function kennelTick(gh) {
  const ks = BLD.list.filter(b => b.done && b.t === 'kennel');
  const dogs = tribeDogs();
  for (const d of dogs) if (!d.pet || !d.pet.alive || d.pet.gone || !d.pet.tribe) {
    const o = clanAdults().find(m => (m.cls === 'hunter' || m.cls === 'warrior') && !(m.pets || []).some(q => q.alive && q.tribeDog));
    if (d.pet && d.pet.pets) d.pet.pets = d.pet.pets.filter(q => q !== d);
    if (o) makePet(o, d); else { d.pet = null; d.followTarget = null; d.state = 'idle'; }
  }
  if (!ks.length) return;
  const cap = Math.min(8, ks.length * 3); if (dogs.length >= cap) return;
  STRUCT.dogAcc += gh / 5 * ks.length; if (STRUCT.dogAcc < 1) return; STRUCT.dogAcc = 0;
  const o = clanAdults().filter(m => (m.cls === 'hunter' || m.cls === 'warrior') && !m.isPartner && !(m.pets || []).some(q => q.alive && q.tribeDog)).sort((p, q) => (p.cls === 'hunter' ? 0 : 1) - (q.cls === 'hunter' ? 0 : 1))[0];
  if (!o) return;
  const k = pick(ks), d = makeTribeDog(o, k.x + rr(-1.5, 1.5), k.z + rr(-1.5, 1.5));
  PROG.flags.tribeDog = 1;
  UI.notify(`🐕 ${o.name} ${heb(o, 'אילף', 'אילפה')} כלב יער: ${d.name}. הוא ${heb(d, 'הולך', 'הולכת')} ${heb(o, 'איתו', 'איתה')} לציד ולקרב`, 'good');
}
// ---------- the aviary: eagles that circle over their hunter ----------
const tribeEagles = () => ANIMALS.filter(e => e.alive && !e.gone && e.brain === 'falcon');
function makeEagle(owner, x, z, name) {
  const e = new Animal('harpy', x, z, {}); e.pos.y = Math.max(getH(x, z), waterAt(x, z)) + 6;
  e.brain = 'falcon'; e.name = name || pick(EAGLEN); e.socialExtra = true; e.state = 'follow'; e.circA = rng() * TAU;
  if (owner) { if (!owner.pets) owner.pets = []; makePet(owner, e); e.state = 'follow'; }
  return e;
}
function aviaryTick(gh) {
  const av = BLD.list.filter(b => b.done && b.t === 'aviary'); if (!av.length) return;
  const es = tribeEagles();
  for (const e of es) if (e.pet && !e.pet.isPlayer && (!e.pet.alive || e.pet.gone || !e.pet.tribe)) {
    const o = clanAdults().find(m => m.cls === 'hunter' && !(m.pets || []).some(q => q.alive && q.brain === 'falcon'));
    if (e.pet.pets) e.pet.pets = e.pet.pets.filter(q => q !== e);
    if (o) makePet(o, e); else e.pet = null;
    e.state = 'follow';
  }
  if (es.filter(e => !e.pet || !e.pet.isPlayer).length >= Math.min(4, av.length * 2)) return;
  STRUCT.eagleAcc += gh / 8 * av.length; if (STRUCT.eagleAcc < 1) return; STRUCT.eagleAcc = 0;
  const o = clanAdults().filter(m => (m.cls === 'hunter' || m.cls === 'warrior') && !m.isPartner && !(m.pets || []).some(q => q.alive && q.brain === 'falcon')).sort((p, q) => (p.cls === 'hunter' ? 0 : 1) - (q.cls === 'hunter' ? 0 : 1))[0];
  const b = pick(av), e = makeEagle(o || null, b.x, b.z);
  PROG.flags.tribeEagle = 1;
  UI.notify(o ? `🦅 ${o.name} ${heb(o, 'אילף', 'אילפה')} עיט: ${e.name}. הוא חג מעל ${heb(o, 'הצייד', 'הציידת')} וצולל על טרף ועל אויבים` : `🦅 עיט חדש בכלוב: ${e.name}`, 'good');
}
function aviaryOf(e) { let best = null, bd = 1e9; for (const b of BLD.list) if (b.done && b.t === 'aviary') { const d = dist2(b, e.pos); if (d < bd) { bd = d; best = b; } } return best; }
function falconTarget(e, o) {
  let t = null;
  if (o.isPlayer) { t = AIMX.on && AIMX.tgt ? AIMX.tgt : P.packT > 0 ? P.packTarget : null; }
  else if (o.state === 'fight' && o.foe) t = o.foe;
  else if (o.job && o.job.k === 'hunt' && o.job.t && !o.job.t.swimming && dist2(o.job.t.pos, o.pos) < 45) t = o.job.t;
  else if (o.onTower && o.watchTgt) t = o.watchTgt;
  if (!t || !t.alive || t.gone || t.isPlayer || t.tribe || t.pet === P.a || (t.pet && t.pet.tribe) || t.isPartner || t.cub || t.swimming || t.tpl.kind === 'fish' || dist2(t.pos, o.pos) > 55) return null;
  return t;
}
BRAIN.falcon = function (a, dt) {
  const o = a.pet;
  if (!o || !o.alive || o.gone) { a.brain = null; a.pet = null; a.socialExtra = false; a.state = 'soar'; raptorSoar(a); return; }
  a.stT -= dt; a.think -= dt;
  if (a.think <= 0) { a.think = 0.4; a.target = falconTarget(a, o); }
  const t = a.target && a.target.alive ? a.target : null;
  if (a.state === 'climb') {
    if ((a.stT -= dt) <= 0) a.state = 'follow';
    _tmp.set(a.pos.x + Math.sin(a.yaw) * 6, Math.max(getH(a.pos.x, a.pos.z), 0) + 14, a.pos.z + Math.cos(a.yaw) * 6); flyToward(a, _tmp, 13, dt, 3); a.pose = 'fly'; return;
  }
  if (t) {
    _tmp.set(t.pos.x, t.pos.y + t.height * 0.6, t.pos.z);
    const d = flyToward(a, _tmp, 18, dt, 5); a.pose = 'fly';
    if (d < 1.4 + t.rad && a.atkCD <= 0) {
      a.anim.atk = 0.4; a.atkCD = 2.4; hurt(t, a.sp.dmg * 0.85, a); if (a.dCam < 60) AUD.at('screech', a.pos, 0.7);
      a.state = 'climb'; a.stT = 1.8;
      if (o.isPlayer && !PROG.flags.eagleHit) { PROG.flags.eagleHit = 1; UI.notify(`${a.name} צלל על ${t.sp.he}!`, 'good'); }
    }
    return;
  }
  const home = (isNight() && !o.isPlayer) || (o.hidden && !o.isPlayer) ? aviaryOf(a) : null;
  if (home) {
    _tmp.set(home.x, getH(home.x, home.z) + 2.6, home.z);
    const d = flyToward(a, _tmp, 9, dt, 3);
    if (d < 0.6) { a.pos.copy(_tmp); a.vel.set(0, 0, 0); a.pose = 'perch'; a.bank = 0; } else a.pose = 'fly';
    return;
  }
  a.circA = (a.circA || 0) + dt * 0.45;
  const gy = Math.max(getH(o.pos.x, o.pos.z), waterAt(o.pos.x, o.pos.z), o.pos.y), R = 8 + (a.id % 3) * 2;
  _tmp.set(o.pos.x + Math.cos(a.circA) * R, gy + 12 + Math.sin(a.circA * 2) * 1.5, o.pos.z + Math.sin(a.circA) * R);
  if (dist2(a.pos, o.pos) > 140) { a.pos.set(_tmp.x, _tmp.y, _tmp.z); a.vel.set(0, 0, 0); }
  flyToward(a, _tmp, dist2(a.pos, _tmp) > 30 ? 16 : 10, dt, 2); a.pose = 'fly';
};
function takeEagle() {
  const e = tribeEagles().find(q => !q.pet || !q.pet.isPlayer); if (!e) { UI.notify('אין עכשיו עיט פנוי בכלוב', 'bad'); return false; }
  if (P.a.pets.some(q => q.alive && q.brain === 'falcon')) { UI.notify('כבר יש לך עיט', 'bad'); return false; }
  if (e.pet && e.pet.pets) e.pet.pets = e.pet.pets.filter(q => q !== e);
  makePet(P.a, e); e.state = 'follow'; e.brain = 'falcon'; PROG.flags.myEagle = 1;
  UI.big(`${e.name} שלך`, 'העיט חג מעליך. כשמכוונים או תוקפים, הוא צולל על המטרה'); AUD.play('chime');
  return true;
}
// ---------- the armory: spears, arrows and swords for the tribe ----------
function armoryTick(gh) {
  const n = BLD.list.filter(b => b.done && b.t === 'armory').length; if (!n) return;
  const st = boxStore(); st.swords = st.swords || 0;
  STRUCT.armAcc += gh / 3 * n; if (STRUCT.armAcc < 1) return; STRUCT.armAcc = 0;
  if ((st.wood || 0) < 3) return;
  const warriors = clanAdults().filter(m => m.cls === 'warrior'), armed = warriors.filter(m => m.wpn === 'sword').length;
  if (armed < warriors.length && st.swords < 2) { st.swords++; st.wood -= 3; }
  else if (st.spears < 6) { st.spears++; st.wood -= 2; }
  else if (st.arrows < 40) { st.arrows += 4; st.wood -= 1; }
  for (const m of warriors) if (m.wpn !== 'sword' && st.swords > 0) { st.swords--; m.wpn = 'sword'; retemplate(m, memberTpl(m)); if (!STRUCT.told.sword) { STRUCT.told.sword = 1; UI.notify(`⚔️ בית הנשק גילף חרבות. ${m.name} ${heb(m, 'קיבל', 'קיבלה')} חרב, והלוחמים חזקים יותר`, 'good'); } }
}
// ---------- canoes: built at a dock or by the hunter at the water ----------
let BOATGEO = null;
function boatGeo() {
  if (BOATGEO) return BOATGEO;
  const G2 = new GB(), A = (geo, p, r, s, c, v) => G2.add(geo, M(p, r, s), c, v);
  A(new THREE.SphereGeometry(1, 16, 8, 0, TAU, Math.PI / 2, Math.PI / 2), [0, 0.28, 0], null, [0.46, 0.34, 2.15], '#6b4a2c', 0.16);
  A(new THREE.SphereGeometry(1, 16, 6, 0, TAU, Math.PI / 2, Math.PI / 2), [0, 0.3, 0], null, [0.4, 0.27, 2.05], '#3e2a1a', 0.1);
  A(new THREE.TorusGeometry(1, 0.035, 4, 24), [0, 0.29, 0], [Math.PI / 2, 0, 0], [0.46, 2.15, 1], '#8a6a42');
  for (const z of [-0.75, 0.6]) A(new THREE.BoxGeometry(0.78, 0.04, 0.2), [0, 0.22, z], null, null, '#8a6a42');
  A(new THREE.ConeGeometry(0.08, 0.3, 5), [0, 0.36, 2.15], [Math.PI / 2, 0, 0], null, '#b3321f');
  A(new THREE.CylinderGeometry(0.022, 0.022, 1.5, 5), [0.2, 0.17, -0.2], [Math.PI / 2, 0, 0.05], null, '#7a5a34');
  A(new THREE.BoxGeometry(0.14, 0.02, 0.36), [0.21, 0.17, -1.0], null, null, '#7a5a34');
  BOATGEO = G2.build(); return BOATGEO;
}
function boatAdd(x, z, yaw, dock) {
  if (!BLD.mat) BLD.mat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(boatGeo(), BLD.mat); mesh.castShadow = true; scene.add(mesh);
  const B = { x, z, yaw, mesh, dock: dock || null, user: null, v: 0 }; BOATS.push(B); boatPlace(B, 0); return B;
}
function boatRemove(B) { scene.remove(B.mesh); const i = BOATS.indexOf(B); if (i >= 0) BOATS.splice(i, 1); }
function boatPlace(B, t) {
  const w = waterAtT(B.x, B.z), y = (w > -900 ? w : getH(B.x, B.z)) - 0.04 + Math.sin(t * 1.7 + B.x) * 0.03;
  B.mesh.position.set(B.x, y, B.z); B.mesh.rotation.set(Math.sin(t * 1.3 + B.z) * 0.03 + (B.user ? Math.sin(t * 3) * 0.02 : 0), B.yaw, Math.sin(t * 1.1 + B.x) * 0.04, 'YXZ');
}
// the dock's canoe is tied alongside the pier, where the water is deep enough to float it, and comes back there
function dockBoat(b) { const p = dockBoatSpot(b), B = boatAdd(p.x, p.z, b.rot, b); B.home = { x: p.x, z: p.z, yaw: b.rot }; return B; }
function dockBoatSpot(b) {
  const c = Math.cos(b.rot), s = Math.sin(b.rot), fx = Math.sin(b.rot), fz = Math.cos(b.rot);
  let best = null, bs = -1e9;
  for (const side of [1.85, -1.85]) for (let k = 2; k <= 8; k += 0.5) {
    const x = b.x + side * c + k * fx, z = b.z - side * s + k * fz, d = waterDepthT(x, z);
    if (d < 0.4) continue;
    const sc = Math.min(d, 1.2) * 2 - Math.abs(k - 4) * 0.3 + (side > 0 ? 0.1 : 0); if (sc > bs) { bs = sc; best = { x, z }; }
  }
  for (let r = 2; r <= 10 && !best; r++) for (let q = 0; q < 24; q++) { const a = b.rot + (q % 2 ? 1 : -1) * Math.ceil(q / 2) / 24 * TAU, x = b.x + Math.sin(a) * r, z = b.z + Math.cos(a) * r; if (waterDepthT(x, z) >= 0.4) { best = { x, z }; break; } }
  if (!best) { const w = nearestWater(b.x, b.z); best = w || { x: b.x + fx * 5, z: b.z + fz * 5 }; }
  return best;
}
function boatHome(B, dt) {
  const h = B.home, dx = h.x - B.x, dz = h.z - B.z, d = Math.hypot(dx, dz); if (d < 0.05) return;
  const seen = Math.hypot(camera.position.x - B.x, camera.position.z - B.z) < 90 || Math.hypot(camera.position.x - h.x, camera.position.z - h.z) < 90;
  if (!seen || d > 45) { B.x = h.x; B.z = h.z; B.yaw = h.yaw; return; }
  if ((B.idleT = (B.idleT || 0) + dt) < 6) return; // it waits a little where it was left
  const st = Math.min(d, 1.3 * dt), nx = B.x + dx / d * st, nz = B.z + dz / d * st;
  if (waterDepthT(nx, nz) > BOAT_DRAFT && !(DEF.wg.length && wgClosedNear(nx, nz, 1.1))) { B.x = nx; B.z = nz; B.yaw += angDiff(B.yaw, d > 3 ? Math.atan2(dx, dz) : h.yaw) * Math.min(1, dt * 1.2); } else if (!seen) { B.x = h.x; B.z = h.z; }
}
// a canoe is held only by someone still on a canoe trip with it; anyone else lets go (and steps onto the bank)
function boatCheckUser(B) {
  const u = B.user; if (!u) return;
  if (!u.alive || u.gone) { B.user = null; if (u === P.a) P.boat = null; return; }
  if (u.isPlayer) { if (P.boat !== B) B.user = null; return; }
  const j = u.job; if (j && j.k === 'boat' && j.B === B) return;
  B.user = null;
  if (u.ownY && !u.onTower && !u.towerB) { const L = landNear(B.x, B.z, 8); if (L) u.pos.set(L.x, 0, L.z); u.ownY = false; u.ground(1, true); }
}
function boatVisuals(dt) {
  const t = G.t;
  for (const B of BOATS) {
    boatCheckUser(B);
    if (!B.user && B.home && dt) boatHome(B, dt);
    const u = B.user;
    if (u && !u.isPlayer && u.job.ph !== 'walk') { B.x = u.pos.x; B.z = u.pos.z; B.yaw = u.yaw; }
    const d = Math.hypot(camera.position.x - B.x, camera.position.z - B.z); B.mesh.visible = d < 260;
    if (B.mesh.visible) boatPlace(B, t);
  }
}
const BOAT_DRAFT = 0.3; // a dugout canoe floats in very little water
const boatNear = (x, z, r) => { let best = null, bd = r; for (const B of BOATS) { const d = Math.hypot(B.x - x, B.z - z); if (!B.user && d < bd) { bd = d; best = B; } } return best; };
// the hunter in a canoe: the stick steers, the canoe glides, and the gold button lands on the bank
CTXT.boat = ['boat', 'לשוט', 'לעלות לסירה'];
CTXT.unboat = ['boat', 'לחוף', 'לרדת מהסירה לחוף'];
function landNear(x, z, r) {
  let best = null, bd = 1e9;
  for (let k = 0; k < 16; k++) { const ang = k / 16 * TAU; for (let s = 1.2; s <= r; s += 0.5) { const px = x + Math.sin(ang) * s, pz = z + Math.cos(ang) * s; if (waterDepth(px, pz) === 0 && getNY(px, pz) > 0.7 && !trunkPush({ x: px, z: pz }, 0.4)) { if (s < bd) { bd = s; best = { x: px, z: pz }; } break; } } }
  return best;
}
function boatEnter(B) {
  const a = P.a; if (!B || B.user || !a) return;
  B.user = a; P.boat = B; B.idleT = 0; a.ownY = true; a.swimming = false; P.dive = false; a.dive = false; P.crouch = false; P.resting = false; B.v = 0;
  a.pos.set(B.x, waterAtT(B.x, B.z) - 0.15, B.z); a.yaw = B.yaw; CAM.yaw = B.yaw;
  PROG.flags.boat = 1; AUD.play('splash', 0.5);
  if (!STRUCT.told.boat) { STRUCT.told.boat = 1; UI.notify(TOUCH ? 'בסירה: הג׳ויסטיק משיט, ריצה משיטה מהר. כפתור הזהב ליד החוף: לרדת. כשהסירה עומדת אפשר לדוג בחכה' : 'בסירה: WASD משיטים, Shift מהר. E ליד החוף: לרדת. כשהסירה עומדת, E דג בחכה', 'good'); }
}
function boatLeave(silent, wet) {
  const a = P.a, B = P.boat; if (!B) return;
  B.user = null; P.boat = null; B.v = 0; B.idleT = 0;
  if (!a) return;
  a.ownY = false;
  if (!wet) { const L = landNear(B.x, B.z, 4.5); if (L) a.pos.set(L.x, 0, L.z); }
  a.ground(1, true);
  if (!silent) AUD.play('splash', 0.4);
}
CTXH.boat = () => { if (CLB.latch) return; CLB.latch = true; const B = boatNear(P.a.pos.x, P.a.pos.z, 4.6); if (B) boatEnter(B); };
CTXH.unboat = () => { if (CLB.latch) return; CLB.latch = true; boatLeave(false); };
function boatStep(dt, dx, dz, mag, wantRun) {
  const a = P.a, B = P.boat;
  if (!B || B.user !== a) { P.boat = null; a.ownY = false; return; }
  const want = Math.atan2(dx, dz), fwd = mag > 0.08 ? Math.max(0, Math.cos(angDiff(B.yaw, want))) * mag : 0;
  if (mag > 0.08) B.yaw += angDiff(B.yaw, want) * Math.min(1, dt * 1.6);
  const fast = wantRun && P.stam > 4 && fwd > 0.2, top = fast ? 5.4 : 3.3;
  B.v += (fwd * top - B.v) * Math.min(1, dt * (fwd > 0 ? 0.9 : 0.55));
  if (fast) P.stam = Math.max(0, P.stam - dt * 8); else P.stam = Math.min(100, P.stam + dt * 9);
  P.running = fast;
  const nx = B.x + Math.sin(B.yaw) * B.v * dt, nz = B.z + Math.cos(B.yaw) * B.v * dt;
  if (inWorld(nx, nz) && waterDepthT(nx, nz) > BOAT_DRAFT && !(DEF.wg.length && wgClosedNear(nx, nz, 1.1))) { B.x = nx; B.z = nz; seaWind(B, dt, BOAT_DRAFT); } else if (Math.abs(B.v) > 0.4) { B.v *= -0.25; if (G.t - (STRUCT.bumpT || -9) > 1.2) { STRUCT.bumpT = G.t; AUD.play('splash', 0.25); } } else B.v = 0;
  a.pos.set(B.x, waterAtT(B.x, B.z) - 0.15, B.z); a.yaw = B.yaw; a.speed = Math.abs(B.v); a.swimming = false; a.airborne = false; a.vy = 0;
  if (B.v > 1.2 && rng() < dt * 2 && B.mesh.visible) FX.spawn('splash', B.x - Math.sin(B.yaw) * 1.6, waterAtT(B.x, B.z), B.z - Math.cos(B.yaw) * 1.6, 2);
}
function boatJump() {
  const B = P.boat; if (!B) return;
  const L = landNear(B.x, B.z, 4.5);
  if (L) { boatLeave(false); return; }
  boatLeave(false, true); UI.notify('קפצת למים. הסירה מחכה כאן');
}
function boatCtx() {
  const a = P.a;
  if (P.boat) {
    if (landNear(P.boat.x, P.boat.z, 3.6)) return 'unboat';
    if (P.boat.v < 0.5) return P.water < 85 ? 'drink' : 'rod';
    return null;
  }
  if (a.swimming || P.climb) { const B = a.swimming ? boatNear(a.pos.x, a.pos.z, 2.6) : null; return B ? 'boat' : null; }
  return boatNear(a.pos.x, a.pos.z, 4.6) ? 'boat' : null;
}
// a canoe carved by the hunter: wood and a place by the water
function craftCanoe() {
  const a = P.a; let spot = null;
  for (let k = 0; k < 24 && !spot; k++) { const ang = k / 24 * TAU; for (let s = 2; s <= 9; s += 0.5) { const x = a.pos.x + Math.sin(ang) * s, z = a.pos.z + Math.cos(ang) * s; if (waterDepthT(x, z) > 0.45) { spot = { x, z, yaw: ang }; break; } } }
  if (!spot) { UI.notify('בונים סירה על שפת המים: צריך מים עמוקים קרוב', 'bad'); return false; }
  if (!takeRes('wood', 8)) { UI.notify('צריך 8 עצים לקאנו', 'bad'); return false; }
  boatAdd(spot.x, spot.z, spot.yaw, null); PROG.flags.canoe = 1;
  UI.notify('גילפת קאנו מגזע עץ! כפתור הזהב ליד הסירה: לעלות ולשוט', 'good'); AUD.play('chime', 0.5); saveGame();
  return true;
}
// ---------- the dock: its foot on the dry bank, the pier over open water ----------
// the water grid is coarse (8 m cells), so the bank is read here finely, with rays
function shoreProbe(x, z, R, yaw, fov) {
  let bd = R + 1, ba = 0;
  for (let k = 0; k < 32; k++) {
    const a = k / 32 * TAU, sx = Math.sin(a), sz = Math.cos(a);
    if (fov && Math.abs(angDiff(yaw, a)) > fov) continue;
    for (let s = 0.3; s < bd; s += 0.3) if (waterDepthT(x + sx * s, z + sz * s) > 0.04) { bd = s; ba = a; break; }
  }
  return bd <= R ? { d: bd, a: ba } : null;
}
// which way the open water lies: the sum of the water around (a straight bank gives its normal)
function waterFace(x, z, R = 9) {
  let sx = 0, sz = 0;
  for (let k = 0; k < 32; k++) { const a = k / 32 * TAU, dx = Math.sin(a), dz = Math.cos(a); let w = 0; for (let s = 1; s <= R; s++) w += Math.min(1.2, waterDepthT(x + dx * s, z + dz * s)); sx += dx * w; sz += dz * w; }
  return Math.hypot(sx, sz) > 0.05 ? Math.atan2(sx, sz) : null;
}
function dockFace(x, z) { const f = waterFace(x, z); if (f != null) return f; const w = nearestWater(x, z); return w ? Math.atan2(w.x - x, w.z - z) : 0; }
// a wet point → the foot of the pier on the dry bank just behind it
function bankFrom(wx, wz, yaw) {
  const f = waterFace(wx, wz) ?? yaw ?? 0, nx = Math.sin(f), nz = Math.cos(f);
  let x = wx, z = wz;
  for (let k = 0; k < 30 && waterDepthT(x, z) > 0; k++) { x -= nx * 0.3; z -= nz * 0.3; }
  x -= nx * 0.6; z -= nz * 0.6;
  return { x, z, rot: dockFace(x, z) };
}
// the dock being placed snaps to the waterline the hunter looks at (or the nearest one around)
function dockSnap(ax, az, yaw) {
  const fx = Math.sin(yaw), fz = Math.cos(yaw);
  for (let s = 0.5; s <= 18; s += 0.3) { const x = ax + fx * s, z = az + fz * s; if (waterDepthT(x, z) > 0.04) return bankFrom(x, z, yaw); }
  const p = shoreProbe(ax, az, 10, yaw, 1.75); return p ? bankFrom(ax + Math.sin(p.a) * p.d, az + Math.cos(p.a) * p.d, p.a) : null;
}
function dockCheck(x, z, rot) {
  if (waterDepthT(x, z) > 0.25) return 'המעגן נבנה על שפת המים, לא בתוך המים';
  const p = shoreProbe(x, z, 8); if (!p) return 'צריך לעמוד ליד המים ולהסתכל אל המים';
  if (p.d > 3.5) return `קרוב יותר לשפת המים (${Math.round(p.d)} מ׳)`;
  const f = rot != null ? rot : dockFace(x, z), fx = Math.sin(f), fz = Math.cos(f);
  let deep = 0; for (let s = 1.5; s <= 8; s += 0.5) if (waterDepthT(x + fx * s, z + fz * s) >= 0.38) deep++;
  if (deep < 3) return 'המים כאן רדודים מדי לסירה. צריך נהר, אגם או נחל עמוק יותר';
  const wy = waterAtT(x + fx * 4, z + fz * 4); if (wy > -900 && getH(x, z) - wy > 1.8) return 'הגדה כאן גבוהה מדי מעל המים';
  for (const b of BLD.list) if (b !== BLD.moveB && bldDist(b, x, z) < BTYPES.dock.r + bldR(b) + 0.6) return `צמוד מדי ל${BTYPES[b.t].n}`;
  return '';
}
const DOCK_R = () => Math.max(45, villageR() + 26) + 50;
// the nearest good place for a dock (kept for a while: the search reads a lot of water)
function dockHint(fresh) {
  const v = ownCamp(); if (!v) return null;
  const C = STRUCT.dockHint; if (!fresh && C && G.t - C.t < 12 && C.v === v) return C.s;
  const s = dockSpot(v); STRUCT.dockHint = { t: G.t, s, v }; return s;
}
// how much open water a dock looks onto: a wide river or a lake beats a narrow stream
function dockWater(s) {
  let q = 0;
  for (let k = -3; k <= 3; k++) { const a = s.rot + k * 0.25, dx = Math.sin(a), dz = Math.cos(a); for (let d = 2; d <= 14; d += 2) q += Math.min(1.2, waterDepthT(s.x + dx * d, s.z + dz * d)); }
  return q;
}
function dockSpot(v) {
  let best = null, bs = -1e9; const R = DOCK_R() - 4;
  for (let ring = 8; ring <= R; ring += 3) {
    const n = Math.max(12, Math.round(ring * 0.8));
    for (let k = 0; k < n; k++) {
      const ang = k / n * TAU, x = v.x + Math.cos(ang) * ring, z = v.z + Math.sin(ang) * ring;
      if (waterDepthT(x, z) > 0 || waterDist(x, z) > 16) continue;
      const p = shoreProbe(x, z, 5); if (!p) continue;
      const s = bankFrom(x + Math.sin(p.a) * p.d, z + Math.cos(p.a) * p.d, p.a);
      if (buildCheck('dock', s.x, s.z, s.rot) || zoneTribeAt(s.x, s.z) >= 0) continue;
      const sc = Math.min(30, dockWater(s)) - Math.hypot(s.x - v.x, s.z - v.z) * 0.15 + rng() * 0.5; if (sc > bs) { bs = sc; best = s; }
    }
    if (best && bs > 22 && ring > 12) break; // open water close by: no need to look farther
  }
  return best;
}
// gatherers take the dock's canoe out to fish
function boatTripStart(a, v) {
  const B = BOATS.find(q => q.dock && !q.user && q.dock.done && Math.hypot(q.x - v.x, q.z - v.z) < villageR() + 60 && landNear(q.x, q.z, 7)); if (!B) return false;
  let goal = null;
  for (let k = 0; k < 40 && !goal; k++) {
    const ang = rng() * TAU, r = rr(10, 55), x = B.x + Math.cos(ang) * r, z = B.z + Math.sin(ang) * r;
    if (waterDepthT(x, z) < 0.45) continue;
    let ok = true; for (let s = 0.05; s < 1; s += 0.05) if (waterDepthT(lerp(B.x, x, s), lerp(B.z, z, s)) < BOAT_DRAFT + 0.04) { ok = false; break; }
    if (ok) goal = { x, z };
  }
  if (!goal) return false;
  a.job = { k: 'boat', B, goal, ph: 'walk', t: rr(18, 32), hx: B.x, hz: B.z }; B.user = a; B.idleT = 0; return true;
}
function boatTrip(a, dt, v) {
  const j = a.job, B = j.B;
  if (!B || !BOATS.includes(B) || (B.user && B.user !== a)) { boatTripEnd(a); a.job = null; return; }
  const land = (j.land || (j.land = landNear(j.hx, j.hz, 7) || { x: v.x, z: v.z }));
  if (j.ph === 'walk') { const d = jobGo(a, land.x, land.z, a.sp.walk * 1.2, dt); if (d < 1.2) { j.ph = 'out'; a.ownY = true; a.pos.set(B.x, waterAtT(B.x, B.z) - 0.15, B.z); } return; }
  const go = (x, z, spd) => { const dx = x - a.pos.x, dz = z - a.pos.z, d = Math.hypot(dx, dz) || 0.01; a.yaw += angDiff(a.yaw, Math.atan2(dx, dz)) * Math.min(1, dt * 1.5); const nx = a.pos.x + Math.sin(a.yaw) * spd * dt, nz = a.pos.z + Math.cos(a.yaw) * spd * dt; if (waterDepthT(nx, nz) > BOAT_DRAFT && !(DEF.wg.length && wgClosedNear(nx, nz, 1.1))) { a.pos.x = nx; a.pos.z = nz; } a.pos.y = waterAtT(a.pos.x, a.pos.z) - 0.15; a.speed = spd; a.swimming = false; a.pose = 'paddle'; return d; };
  const prog = d => { if (d < (j.best ?? 1e9) - 0.5) { j.best = d; j.stk = 0; } else j.stk = (j.stk || 0) + dt; return j.stk > 4; };
  if (j.ph === 'out') { const d = go(j.goal.x, j.goal.z, 2.6); if (d < 2 || prog(d)) { j.ph = 'fish'; j.best = null; j.stk = 0; } return; }
  if (j.ph === 'fish') { a.speed = 0; a.pose = 'fish'; a.pos.y = waterAtT(a.pos.x, a.pos.z) - 0.15; j.t -= dt; if (j.t <= 0) { j.ph = 'back'; j.best = null; j.stk = 0; j.n = 1 + Math.round(rng() * 2 + wildK()); } return; }
  if (j.ph === 'back') { const d = go(j.hx, j.hz, 2.6); if (d < 1.5 || prog(d)) { a.pos.set(land.x, 0, land.z); a.ownY = false; a.ground(1, true); B.x = j.hx; B.z = j.hz; if (B.home) B.yaw = B.home.yaw; boatTripEnd(a); a.carry = true; a.job = { k: 'home', what: 'fish', n: j.n }; } }
}
function boatTripEnd(a) { const j = a.job; if (j && j.B && j.B.user === a) j.B.user = null; if (a.ownY && !a.onTower) { a.ownY = false; a.ground(1, true); } }
// ---------- small things people carry: a torch at night, a sword, a bow, a paddle ----------
const PROPS = { carry: [], geo: null };
function propMeshes() {
  if (PROPS.geo) return PROPS.geo;
  const wood = new THREE.MeshLambertMaterial({ color: '#6b4a2c' }), steel = new THREE.MeshLambertMaterial({ color: '#c9ccd2' }), dark = new THREE.MeshLambertMaterial({ color: '#2a2018' });
  const flameM = new THREE.MeshBasicMaterial({ color: '#ffb24a', transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
  PROPS.geo = { wood, steel, dark, flameM, stick: new THREE.CylinderGeometry(0.022, 0.028, 0.7, 6), flame: new THREE.ConeGeometry(0.075, 0.28, 6, 1, true), blade: new THREE.BoxGeometry(0.05, 0.62, 0.012), guard: new THREE.BoxGeometry(0.16, 0.025, 0.03), grip: new THREE.CylinderGeometry(0.018, 0.02, 0.16, 6), bow: new THREE.TorusGeometry(0.42, 0.016, 5, 16, Math.PI * 0.9), str: new THREE.CylinderGeometry(0.003, 0.003, 0.8, 3), shaft: new THREE.CylinderGeometry(0.02, 0.02, 1.5, 5), paddle: new THREE.BoxGeometry(0.15, 0.36, 0.02) };
  return PROPS.geo;
}
function makeProp(kind) {
  const P2 = propMeshes(), g = new THREE.Group();
  if (kind === 'torch') { const s = new THREE.Mesh(P2.stick, P2.wood); s.position.y = 0.1; g.add(s); const f = new THREE.Mesh(P2.flame, P2.flameM); f.position.y = 0.55; g.add(f); g.userData.flame = f; }
  else if (kind === 'sword') { const h = new THREE.Mesh(P2.grip, P2.wood); g.add(h); const gd = new THREE.Mesh(P2.guard, P2.dark); gd.position.y = 0.09; g.add(gd); const b = new THREE.Mesh(P2.blade, P2.steel); b.position.y = 0.41; g.add(b); }
  else if (kind === 'bow') { const arc = new THREE.Mesh(P2.bow, P2.wood); arc.rotation.z = Math.PI / 2 - Math.PI * 0.45; g.add(arc); g.add(new THREE.Mesh(P2.str, new THREE.MeshBasicMaterial({ color: '#e8e2d0' }))); }
  else if (kind === 'paddle') { const s = new THREE.Mesh(P2.shaft, P2.wood); g.add(s); const p = new THREE.Mesh(P2.paddle, P2.wood); p.position.y = -0.82; g.add(p); }
  else if (kind === 'rod') { const s = new THREE.Mesh(P2.stick, P2.wood); s.scale.set(0.6, 3.2, 0.6); s.position.set(0, 0.2, 0.95); s.rotation.x = 1.15; g.add(s); const l = new THREE.Mesh(P2.stick, new THREE.MeshBasicMaterial({ color: '#e8e2d0' })); l.scale.set(0.08, 2.0, 0.08); l.position.set(0, 0.25, 1.95); g.add(l); }
  g.userData.kind = kind; return g;
}
// attach (or detach) a prop to a hand bone; props follow the bone and hide with the body
function setProp(a, kind, on, hand) {
  a.props = a.props || {};
  let m = a.props[kind];
  if (!on) { if (m) m.visible = false; return; }
  const bone = a.B && a.B[hand || (kind === 'bow' ? 'Lha' : 'Rha')]; if (!bone) return;
  if (!m) { m = a.props[kind] = makeProp(kind); }
  if (m.parent !== bone) { if (m.parent) m.parent.remove(m); bone.add(m); m.position.set(0, -0.05, 0.03); m.rotation.set(kind === 'torch' ? 0.25 : kind === 'paddle' ? 0.3 : kind === 'sword' ? 2.1 : 0, 0, 0); }
  m.visible = true;
  if (!PROPS.carry.includes(a)) PROPS.carry.push(a);
}
function propsUpdate() {
  const night = nightK() > 0.25, raiders = [];
  for (const p of WAR.parties) if (!p.done && !p.mine) for (const h of p.men) raiders.push(h);
  if (CHAL.ch) raiders.push(CHAL.ch);
  for (const a of [...clanReal(), ...raiders]) {
    if (a.young || !a.B || !a.alive) continue;
    const near = (a.dCam || 999) < 70, sw = a.rwpn === 'sword' || a.champ || (a.wpn === 'sword' && a.cls === 'warrior');
    const torch = near && night && !a.hidden && (a.onTower || (a.cls === 'warrior' && a.job && a.job.k === 'patrol') || (a.job && a.job.k === 'raid') || (!!a.raider && a.rtask === 'burn'));
    if (torch || (a.props && a.props.torch)) setProp(a, 'torch', torch, sw ? 'Lha' : 'Rha');
    const sword = near && sw;
    if (sword || (a.props && a.props.sword)) setProp(a, 'sword', sword && !torch, 'Rha');
    const bow = near && (a.windup > 0 && a.aimBow);
    if (bow || (a.props && a.props.bow)) setProp(a, 'bow', bow, 'Lha');
    const paddle = near && a.job && a.job.k === 'boat' && a.ownY && a.job.ph !== 'walk' && a.job.ph !== 'fish';
    if (paddle || (a.props && a.props.paddle)) setProp(a, 'paddle', paddle, 'Rha');
    if (a.props && a.props.torch && a.props.torch.visible) { const f = a.props.torch.userData.flame; f.scale.set(1, 0.85 + Math.sin(G.t * 15 + a.id) * 0.15, 1); }
  }
  for (let i = PROPS.carry.length - 1; i >= 0; i--) { const a = PROPS.carry[i]; if (!a.alive || a.gone) PROPS.carry.splice(i, 1); }
}
// ---------- save and load ----------
function structSave() {
  return {
    boats: BOATS.map(B => [+B.x.toFixed(2), +B.z.toFixed(2), +B.yaw.toFixed(2), B.dock ? BLD.list.indexOf(B.dock) : -1]), inBoat: P.boat ? BOATS.indexOf(P.boat) : -1,
    dogs: tribeDogs().filter(d => d.pet && d.pet.tribe).map(d => [d.pet.uid, d.name, d.sex]),
    eagles: tribeEagles().filter(e => !e.pet || !e.pet.isPlayer).map(e => [e.pet ? e.pet.uid : 0, e.name]),
    acc: [+STRUCT.dogAcc.toFixed(2), +STRUCT.eagleAcc.toFixed(2), +STRUCT.armAcc.toFixed(2)], told: STRUCT.told
  };
}
function structReset() {
  if (P.boat) boatLeave(true);
  for (const B of BOATS.slice()) boatRemove(B);
  for (const d of tribeDogs()) d.remove();
  for (const e of tribeEagles()) if (!e.pet || !e.pet.isPlayer) e.remove();
  STRUCT.dogAcc = 0; STRUCT.eagleAcc = 0; STRUCT.armAcc = 0; STRUCT.told = {}; P.boat = null;
}
function structLoad(d) {
  const a = P.a;
  for (const e of a && a.pets ? a.pets : []) if (e.spId === 'harpy' && e.alive) { e.brain = 'falcon'; e.state = 'follow'; e.pos.y = Math.max(getH(e.pos.x, e.pos.z), 0) + 10; e.circA = rng() * TAU; }
  if (!d) return;
  STRUCT.told = d.told || {};
  [STRUCT.dogAcc, STRUCT.eagleAcc, STRUCT.armAcc] = d.acc || [0, 0, 0];
  for (const q of d.boats || []) { const dock = q[3] >= 0 ? BLD.list[q[3]] : null, dk = dock && dock.t === 'dock' ? dock : null; if (waterDepth(q[0], q[1]) > 0.25) { const B = boatAdd(q[0], q[1], q[2], dk); if (dk) { const p = dockBoatSpot(dk); B.home = { x: p.x, z: p.z, yaw: dk.rot }; } } }
  const byU = u => TRIBE.adults.find(m => m.uid === u && m.alive);
  for (const [u, n, s] of d.dogs || []) { const o = byU(u); if (o) makeTribeDog(o, o.pos.x + rr(-2, 2), o.pos.z + rr(-2, 2), n, s); }
  for (const [u, n] of d.eagles || []) { const o = byU(u), at = o ? o.pos : ownCamp() || a.pos; makeEagle(o || null, at.x, at.z, n); }
  if (d.inBoat >= 0 && BOATS[d.inBoat]) boatEnter(BOATS[d.inBoat]);
}
