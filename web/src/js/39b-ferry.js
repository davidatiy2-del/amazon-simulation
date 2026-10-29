// ================= THE FERRY: a ship that sails between the two worlds =================
// The tribes of the New World's south coast keep a ship that crosses the ocean; in the Old World it docks at the town
// of the mills in Europe and at the Vikings' harbour. Talk to anyone there: the first voyage is free (they are glad of
// a guide), after that it costs a little gold. Your family, your animals and those who walk with you sail along.
const FERRY = { cost: 8, near: {} };
const FERRY_OLD = ['mill', 'fjord'];
const ferryPort = c => !!c && !c.gone && !c.bandit && !c.own && (c.set && FERRY_OLD.includes(c.set.id) ? 'old' : !isOld(c.x) && campLand(c) === 4 ? 'new' : '');
// where the ship lets you off: dry ground by the place, on the side of its water (outside the walls)
function ferrySpot(c) {
  const ax = c.gate ? c.gate.x : c.x, az = c.gate ? c.gate.z : c.z, wa = Math.atan2((c.rx ?? c.x) - c.x, (c.rz ?? c.z) - c.z);
  for (const r of [c.gate ? 8 : 30, 40, 55, 70]) for (let k = 0; k < 16; k++) {
    const a = wa + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 0.35, x = ax + Math.sin(a) * r, z = az + Math.cos(a) * r;
    if (waterDepth(x, z) === 0 && getNY(x, z) > 0.8 && getH(x, z) > 0.3 && !(WALLED.length && WALLED.some(W => Math.hypot(W.x - x, W.z - z) < W.half + 2))) return { x, z, face: a + Math.PI };
  }
  return { x: c.x + 12, z: c.z + 12, face: 0 };
}
// the voyages this port offers
function ferryDests(c) {
  const kind = ferryPort(c); if (!kind) return [];
  const L = kind === 'new' ? HUNT.camps.filter(d => ferryPort(d) === 'old') : HUNT.camps.filter(d => ferryPort(d) === 'new');
  return L.map(d => ({ c: d, i: campIndex(d), n: d.tribe, land: LANDS[campLand(d)] ? LANDS[campLand(d)].n : '' }));
}
function ferryButton(c) {
  if (!P.human || !ferryPort(c) || atWar(campIndex(c))) return '';
  return `<button class="btn" data-a="ferry">🚢 ${ferryPort(c) === 'new' ? 'להפליג לעולם הישן' : 'להפליג חזרה לעולם החדש'}</button>`;
}
function ferryCard(c, back) {
  const free = !PROG.flags.ferry, cost = free ? 0 : FERRY.cost, D = ferryDests(c), g = goldHave();
  const el = uiCard('ferryov', `<div class="vxwho"><span class="vxic">🚢</span><div><h2>הספינה של ${c.tribe}</h2><p class="idim">${ferryPort(c) === 'new' ? 'מעבר לאוקיינוס, במזרח, יש יבשת אחרת: העולם הישן' : 'הדרך חזרה אל הג׳ונגל, מעבר לאוקיינוס במערב'}</p></div></div>` +
    `<p class="vxsay">"${free ? 'ההפלגה הראשונה עלינו. בתמורה תספר לכולם על הנמל שלנו' : `הפלגה עולה ${cost} זהב. יש לך ${g}`}"</p>` +
    `<p class="idim">המשפחה, החיות ומי שהולך איתך מפליגים איתך. אפשר גם לשוט לבד בסירה: ${ferryPort(c) === 'new' ? 'ממשיכים מזרחה עד שמגיעים' : 'ממשיכים מערבה, או מזרחה מסביב לעולם, כי העולם עגול'}</p>` +
    `<div class="btns vxbtns">${D.map((d, k) => `<button class="btn pri" data-k="${k}"${g >= cost ? '' : ' disabled'}>${d.n} · ${d.land}</button>`).join('')}<button class="btn" data-a="back">חזרה</button></div>`);
  el.onclick = e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return; closeCard('ferryov');
    if (b.dataset.a === 'back') { if (back) back(); return; }
    const d = D[+b.dataset.k]; if (!d) return;
    if (P.boat || P.ship) { UI.notify('קודם יורדים מהסירה', 'bad'); return; }
    if (cost) goldPay(cost);
    ferrySail(c, d.c);
  };
}
function ferrySail(from, to) {
  const a = P.a; if (!a || !a.alive) return;
  if (P.ride) rideEnd(true);
  PROG.flags.ferry = (PROG.flags.ferry || 0) + 1;
  UI.sleepFx(true); G.paused = true;
  setTimeout(() => {
    const s = ferrySpot(to), x0 = a.pos.x, z0 = a.pos.z, moved = new Set([a]);
    const go = (b, k) => { if (!b || moved.has(b) || !b.alive || b.gone) return; moved.add(b); const ang = s.face + Math.PI + (k % 5 - 2) * 0.45, r = 2.5 + (k / 5 | 0) * 1.5; b.pos.set(s.x + Math.sin(ang) * r, 0, s.z + Math.cos(ang) * r); if (waterDepth(b.pos.x, b.pos.z) > 0) b.pos.set(s.x, 0, s.z); b.ground(1, true); if (b.mesh) b.mesh.position.copy(b.pos); };
    a.pos.set(s.x, 0, s.z); a.ground(1, true); a.yaw = s.face; if (a.mesh) a.mesh.position.copy(a.pos);
    let k = 0;
    for (const m of aliveMates()) go(m, k++);
    for (const c of P.cubs || []) go(c, k++);
    for (const p of a.pets || []) go(p, k++);
    for (const m of clanReal()) if (m.escort || (m.followTarget === a && Math.hypot(m.pos.x - x0, m.pos.z - z0) < 60)) go(m, k++);
    CAM.yaw = a.yaw; CAM.init = false; CAM.dEff = null;
    G.paused = false; UI.sleepFx(false);
    const i = campIndex(to); if (i >= 0 && !VX.known.has(i)) VX.known.add(i);
    const old = isOld(to.x);
    UI.big(old ? 'העולם הישן' : 'חזרה לעולם החדש', old ? `אחרי ימים בים הספינה עוגנת ליד ${to.tribe}. טירות, ערים ודרכים: כדאי להיזהר משודדים בצידי הדרך` : `הספינה עוגנת ליד ${to.tribe}. הג׳ונגל מחכה`);
    AUD.play('chime', 0.7); gainXP(old && PROG.flags.ferry === 1 ? 80 : 10); saveGame();
  }, 1300);
}
// a word the first time the hunter comes near a port
function ferryHints() {
  if (!P.human || !P.a || G.mode !== 'play') return;
  for (const c of HUNT.camps) {
    const k = ferryPort(c); if (!k || FERRY.near[c.key]) continue;
    if (Math.hypot(c.x - P.a.pos.x, c.z - P.a.pos.z) < 70) { FERRY.near[c.key] = 1; UI.notify(k === 'new' ? `🚢 ל${c.tribe} יש ספינה שמפליגה לעולם הישן. מדברים עם אחד מהם` : `🚢 מ${c.tribe} יוצאת ספינה חזרה לעולם החדש`, 'good'); }
  }
}
