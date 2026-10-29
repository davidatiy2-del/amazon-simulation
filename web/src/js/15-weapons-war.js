// ================= WEAPONS: a spear, a sword and a bow. One button switches; the attack button uses what is in the hand =================
const WPN = { btn: null, bar: null, fan: null, fanOn: false, fanT: 0, key: '', fkey: '', akey: '', vkey: '' };
const WPN_L = ['spear', 'sword', 'bow'];
const WPN_N = { spear: 'חנית', sword: 'חרב', bow: 'קשת' };
const WPN_K = { spear: '1', sword: '2', bow: '3' };
function wpnHave(k) { return k === 'spear' || (k === 'sword' && !!P.hasSword) || (k === 'bow' && !!P.hasBow); }
function wpnReset() { P.weapon = 'spear'; P.hasSword = false; P.ironSpear = false; P.ironArrow = false; P.ironSword = false; WPN.key = ''; WPN.vkey = ''; WPN.fkey = ''; WPN.akey = ''; wpnOpen(false); }
function wpnSave() { return { w: P.weapon || 'spear', s: P.hasSword ? 1 : 0, fe: (P.ironSpear ? 1 : 0) + (P.ironArrow ? 2 : 0) + (P.ironSword ? 4 : 0) }; }
function wpnLoad(d) { P.hasSword = !!(d && d.s); P.weapon = d && wpnHave(d.w) ? d.w : 'spear'; WPN.vkey = ''; const fe = (d && d.fe) || 0; P.ironSpear = !!(fe & 1); P.ironArrow = !!(fe & 2); P.ironSword = !!(fe & 4); }
// what each weapon throws or shoots, and how to get the ones you do not have
function wpnAmmo(k) { return k === 'spear' ? { n: P.spears || 0, max: P.mods.spearsMax, w: 'חניתות' } : k === 'bow' ? { n: P.arrows || 0, max: CARRY.arrows, w: 'חצים' } : null; }
const wpnHow = k => k === 'sword' ? 'מגלפים חרב ליד אש (5 עצים), או לוקחים מבית הנשק בכפר' : k === 'bow' ? 'מגלפים קשת ליד אש (4 עצים), או מקבלים כשמצטרפים לשבט' : '';
function wpnSet(k, quiet) {
  if (!P.human || !P.a) return;
  if (!wpnHave(k)) { if (!quiet) UI.notify(`אין לך ${WPN_N[k]} עדיין. ${wpnHow(k)}`, 'bad'); return; }
  if (P.weapon === k) return;
  if (AIMX.on) aimEnd();
  P.weapon = k; WPN.vkey = ''; wpnVisual(); UI.setControls(); WPN.akey = '';
  if (!quiet) { const am = wpnAmmo(k); combatText(`${WPN_N[k]} ביד${am ? ` (${am.n} ${am.w})` : ''}`, am && !am.n ? 'bad' : 'good'); AUD.play('swipe', 0.3); }
  if (!PROG.flags.wpnTold && !quiet) { PROG.flags.wpnTold = 1; UI.notify(TOUCH ? 'הכפתור "נשק" פותח את הארסנל: חנית נזרקת, חרב מכה מקרוב בכמה אויבים, וקשת יורה רחוק' : '1 חנית · 2 חרב · 3 קשת · R מחליף · G הארסנל. חנית נזרקת, חרב מכה מקרוב בכמה אויבים, וקשת יורה רחוק', 'good'); }
}
function wpnCycle() {
  const L = WPN_L.filter(wpnHave);
  if (L.length < 2) { UI.notify(`יש לך רק חנית. ${wpnHow('sword')}. ${wpnHow('bow')}`, 'bad'); return; }
  wpnSet(L[(L.indexOf(P.weapon || 'spear') + 1) % L.length]);
}
// the hunter's body: the spear in the hand only when it is the weapon, a sword or a bow otherwise, a paddle in the canoe
function noSpearTpl(k) { const n = k + '_ns'; if (!TPL[n] && TPL[k] && TPL[k].o) TPL[n] = buildHuman(Object.assign({}, TPL[k].o, { noSpear: true })); return TPL[n] ? n : k; }
function wpnVisual() {
  const a = P.a; if (!a || !P.human || !a.alive) return;
  const w = P.weapon || 'spear', boat = !!P.boat, base = (a.tplKey || '').replace(/_ns$/, '');
  const key = boat || !(w === 'spear' && P.spears > 0) ? noSpearTpl(base) : base;
  if (key && TPL[key] && a.tplKey !== key) retemplate(a, key);
  setProp(a, 'sword', w === 'sword' && !boat, 'Rha');
  if (a.props && a.props.sword) a.props.sword.rotation.x = 2.1;
  setProp(a, 'bow', w === 'bow' && !boat, 'Lha');
  setProp(a, 'paddle', boat, 'Rha');
}
function wpnUpdate() {
  if (!P.human || !P.a || G.mode !== 'play') { if (WPN.btn) WPN.btn.hidden = true; if (WPN.bar) WPN.bar.style.display = 'none'; if (WPN.fanOn) wpnOpen(false); return; }
  if (!wpnHave(P.weapon || 'spear')) P.weapon = 'spear';
  const vk = `${P.weapon}|${P.spears > 0}|${!!P.boat}|${P.a.tplKey}`;
  if (vk !== WPN.vkey) { WPN.vkey = vk; wpnVisual(); }
  wpnUi(false);
}
// ---------- the arsenal on screen: three weapons in a bar on desktop; on touch a weapon button opens a fan ----------
function wpnTile(k, touch) {
  const have = wpnHave(k), am = wpnAmmo(k), on = (P.weapon || 'spear') === k;
  const cnt = !have ? `<em class="wl">${ICON.lock}</em>` : am ? `<em class="${am.n ? '' : 'w0'}">${k === 'spear' ? `${am.n}/${am.max}` : am.n}</em>` : '';
  const tip = have ? `${WPN_N[k]}${am ? ` · ${am.n} ${am.w}` : ''}${touch ? '' : ` (מקש ${WPN_K[k]})`}` : `${WPN_N[k]}: ${wpnHow(k)}`;
  return `<button type="button" data-w="${k}" class="wt${on ? ' on' : ''}${have ? '' : ' off'}" title="${tip}" aria-label="${tip}" aria-pressed="${on}">${touch ? '' : `<kbd>${WPN_K[k]}</kbd>`}${ICON[k]}<span>${WPN_N[k]}</span>${cnt}</button>`;
}
const wpnArsTile = touch => `<button type="button" data-a="ars" class="wt ars" title="הארסנל: לגלף נשק ותחמושת, לקחת מהמחסן${touch ? '' : ' (מקש G)'}" aria-label="הארסנל">${touch ? '' : '<kbd>G</kbd>'}${ICON.forge}<span>ארסנל</span></button>`;
function wpnPick(e) {
  const b = e.target.closest('button'); if (!b) return;
  e.preventDefault(); e.stopPropagation();
  if (b.dataset.a === 'ars') { openArsenal(); return; }
  const k = b.dataset.w; if (!k) return;
  if (!wpnHave(k)) { openArsenal(k); return; }
  wpnSet(k); WPN.key = ''; WPN.fkey = '';
  if (TOUCH) wpnOpen(false);
}
// the fan opens from the weapon button; a pick, a tap elsewhere or a few seconds close it
function wpnOpen(on) {
  WPN.fanOn = !!on; WPN.fanT = on ? performance.now() + 6000 : 0; WPN.fkey = '';
  if (WPN.fan) WPN.fan.hidden = !on;
  if (WPN.btn) WPN.btn.classList.toggle('open', !!on);
  document.body.classList.toggle('wfan', !!on); // the notifications step aside while the fan is open
  if (on) wpnUi(true);
}
// the attack button shows how many spears or arrows are left
function wpnAtkBadge() {
  const t = document.getElementById('tAtk'); if (!t) return;
  const w = P.boat ? (P.spears > 0 ? 'spear' : 'bow') : P.weapon || 'spear', am = wpnAmmo(w), txt = am ? String(am.n) : '', key = `${w}|${txt}`;
  let b = t.querySelector('.wbadge');
  if (b && key === WPN.akey) return;
  WPN.akey = key;
  if (!txt) { if (b) b.remove(); return; }
  if (!b) { b = document.createElement('i'); b.className = 'wbadge'; t.appendChild(b); }
  b.textContent = txt; b.classList.toggle('w0', !am.n);
}
function wpnUi(force) {
  if (TOUCH) {
    const box = document.getElementById('tbtns'); if (!box) return;
    if (!WPN.btn) {
      const b = document.createElement('button'); b.id = 'tWpn'; b.className = 'tb'; b.hidden = true; b.innerHTML = ICON.war + '<small>נשק</small>'; b.setAttribute('aria-label', 'נשק: חנית, חרב או קשת'); box.appendChild(b); WPN.btn = b;
      b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); wpnOpen(!WPN.fanOn); });
      const f = document.createElement('div'); f.id = 'wpnFan'; f.hidden = true; f.setAttribute('role', 'toolbar'); f.setAttribute('aria-label', 'ארסנל'); box.appendChild(f); WPN.fan = f;
      f.addEventListener('pointerdown', wpnPick);
      addEventListener('pointerdown', e => { if (WPN.fanOn && !(e.target.closest && e.target.closest('#wpnFan,#tWpn'))) wpnOpen(false); }, true);
    }
    const show = !P.boat && !BLD.mode && !G.paused;
    if (WPN.btn.hidden === show) WPN.btn.hidden = !show;
    if (WPN.fanOn && (!show || performance.now() > WPN.fanT)) wpnOpen(false);
    if (WPN.fanOn) {
      const key = `${P.weapon}|${P.spears}|${P.arrows}|${P.hasSword}|${P.hasBow}|${P.mods.spearsMax}`;
      if (force || key !== WPN.fkey) { WPN.fkey = key; WPN.fan.innerHTML = WPN_L.map(k => wpnTile(k, true)).join('') + wpnArsTile(true); }
    }
    wpnAtkBadge();
    return;
  }
  if (!WPN.bar) {
    const el = document.createElement('div'); el.id = 'wpnBar'; el.setAttribute('role', 'toolbar'); el.setAttribute('aria-label', 'ארסנל'); document.body.appendChild(el); WPN.bar = el;
    el.addEventListener('pointerdown', wpnPick);
  }
  const show = !document.getElementById('hud').hidden && !BLD.mode && !P.boat;
  WPN.bar.style.display = show ? 'flex' : 'none'; if (!show) return;
  const key = `${P.weapon}|${P.spears}|${P.arrows}|${P.hasSword}|${P.hasBow}|${P.mods.spearsMax}`;
  if (!force && key === WPN.key) return; WPN.key = key;
  WPN.bar.innerHTML = WPN_L.map(k => wpnTile(k)).join('') + '<i class="wsep"></i>' + wpnArsTile();
}
addEventListener('keydown', e => {
  if (G.mode !== 'play' || !P.human || e.repeat) return;
  if (e.code === 'KeyG') { const el = document.getElementById('arsov'); if (el && !el.hidden) closeCard('arsov'); else if (!G.paused) openArsenal(); return; }
  if (G.paused) return;
  if (e.code === 'KeyR') { if (!P.boat && !BLD.mode) wpnCycle(); return; }
  const i = { Digit1: 'spear', Digit2: 'sword', Digit3: 'bow', Numpad1: 'spear', Numpad2: 'sword', Numpad3: 'bow' }[e.code];
  if (i) wpnSet(i);
});
// ---------- the arsenal: every weapon, its ammunition, carving it by a fire, taking it from the village store ----------
function takeStore(k) {
  const st = boxStore();
  if (k === 'spears') { const n = Math.min(st.spears || 0, Math.max(0, P.mods.spearsMax - (P.spears || 0))); st.spears -= n; P.spears += n; return n; }
  if (k === 'arrows') { const n = Math.min(st.arrows || 0, Math.max(0, CARRY.arrows - (P.arrows || 0))); st.arrows -= n; P.arrows = (P.arrows || 0) + n; return n; }
  if (k === 'sword') { if (P.hasSword || !((st.swords || 0) > 0)) return 0; st.swords--; P.hasSword = true; PROG.flags.gotSword = 1; return 1; }
  return 0;
}
const WPN_D = {
  spear: 'נזרקת עד כ-34 מ׳, ואפשר להרים אותה שוב מהקרקע. מקרוב: דקירה. חזקה גם מתוך הסירה',
  sword: 'מכה מקרוב בעד שלושה אויבים בבת אחת. הנשק החזק ביותר בקרב צמוד, ולא נגמר אף פעם',
  bow: 'יורה חצים עד כ-50 מ׳, הכי מהיר ומדויק. פוגע גם בציפורים באוויר. מקרוב: סכין'
};
function openArsenal(focus) {
  if (G.mode !== 'play' || !P.human || !P.a) return;
  wpnOpen(false);
  const st = boxStore(), camp = inCamp(12), fire = inCamp(10) || nearFire(4.2), wood = resHave('wood'), cur = P.weapon || 'spear';
  const why = (n, extra) => !fire ? 'צריך להיות ליד אש' : wood < n ? `צריך ${n} עצים` : extra || '';
  const cost = n => `<i class="arsCost">${n} 🪵</i>`;
  const btn = (a, label, dis, cls) => `<button class="btn${cls ? ' ' + cls : ''}" data-a="${a}"${dis ? ` disabled title="${dis}"` : ''}>${label}</button>`;
  const meter = am => `<div class="arsAm"><small>${am.w}</small><b class="${am.n ? '' : 'w0'}">${am.n}/${am.max}</b><span class="arsBar"><i style="width:${Math.round(100 * Math.min(1, am.n / Math.max(1, am.max)))}%"></i></span></div>`;
  const row = k => {
    const have = wpnHave(k), am = wpnAmmo(k), on = cur === k, acts = [];
    if (have && !on) acts.push(btn('eq', 'לאחוז ביד', '', 'pri'));
    if (k === 'spear') { acts.push(btn('cs', `לגלף חנית${cost(2)}`, why(2))); if (camp && (st.spears || 0) > 0) acts.push(btn('tks', `🏕️ מהמחסן (${st.spears})`, P.spears >= P.mods.spearsMax ? 'אין מקום לעוד חנית' : '')); }
    if (k === 'sword' && !have) { if (camp && (st.swords || 0) > 0) acts.push(btn('tsw', `⚔️ לקחת חרב מבית הנשק (${st.swords})`, '', 'pri')); else acts.push(btn('csw', `לגלף חרב${cost(5)}`, why(5), 'pri')); }
    if (k === 'bow') {
      if (!have) acts.push(btn('cb', `לגלף קשת${cost(4)}`, why(4), 'pri'));
      else { acts.push(btn('ca', `לגלף 4 חצים${cost(1)}`, why(1))); if (camp && (st.arrows || 0) > 0) acts.push(btn('tka', `🏕️ מהמחסן (${st.arrows})`, (P.arrows || 0) >= CARRY.arrows ? 'האשפה מלאה' : '')); }
    }
    const state = on ? '<span class="arsSt on">ביד</span>' : have ? '<span class="arsSt">יש לך</span>' : `<span class="arsSt off">${ICON.lock}אין עדיין</span>`;
    return `<div class="arsW${on ? ' on' : ''}${have ? '' : ' off'}${focus === k ? ' focus' : ''}" data-w="${k}"><div class="arsIc">${ICON[k]}</div><div class="arsMain"><div class="arsH"><b>${WPN_N[k]}</b>${TOUCH ? '' : `<kbd>${WPN_K[k]}</kbd>`}${state}</div><p>${have ? WPN_D[k] : `${WPN_D[k]}.<br><span class="arsHow">${wpnHow(k)}</span>`}</p>${have && am ? meter(am) : ''}<div class="arsAct">${acts.join('')}</div></div></div>`;
  };
  const chips = `<div class="arsChips"><span class="cchip">🪵 ${wood} עצים${camp && (st.wood || 0) > 0 ? ' (עם המחסן)' : ''}</span><span class="cchip ${fire ? 'ok' : 'no'}">🔥 ${fire ? 'ליד אש: אפשר לגלף' : 'רחוק מאש'}</span>${camp ? `<span class="cchip">🏕️ במחסן: 🗡️ ${st.spears || 0} · 🏹 ${st.arrows || 0} · ⚔️ ${st.swords || 0}</span>` : ''}</div>`;
  const tip = fire ? '' : '<p class="idim arsTip">מגלפים ליד אש: מדורת הכפר, או מדורה שמדליקים בכל מקום עם 2 עצים.</p>';
  const keys = TOUCH ? '<p class="idim arsTip">הכפתור "נשק" פותח את הבחירה. בסירה זורקים חניתות, וכשנגמרות יורים חצים.</p>' : '<p class="idim arsTip">מקשים: 1 חנית · 2 חרב · 3 קשת · R להחליף · G לפתוח ולסגור את הארסנל</p>';
  const el = uiCard('arsov', `<div class="itabs"><b style="flex:1;font-size:18px">${ICON.forge} הארסנל</b><button class="ix" data-a="close" aria-label="סגירה">✕</button></div>${chips}${tip}<div class="arsL">${WPN_L.map(row).join('')}</div>${ironHtml(fire)}${keys}`);
  el.querySelector('.card').classList.add('vxcard', 'arscard');
  const fo = focus && el.querySelector('.arsW.focus'); if (fo) fo.scrollIntoView({ block: 'nearest' });
  el.onclick = e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    const rw = b.closest('.arsW'), A = b.dataset.a, k = rw ? rw.dataset.w : null;
    if (A === 'close') { closeCard('arsov'); return; }
    if (A === 'eq' && k) { closeCard('arsov'); wpnSet(k); return; }
    let ok = false;
    if (A === 'cs') ok = craft('spear'); else if (A === 'ca') ok = craft('arrow'); else if (A === 'cb') ok = craft('bow');
    else if (A === 'csw') ok = craftSword();
    else if (A && A.startsWith('iron_')) ok = ironCraft(A.slice(5));
    else if (A === 'tks') { const n = takeStore('spears'); ok = n > 0; if (ok) UI.notify(`לקחת ${n} חניתות מהמחסן (${P.spears} איתך)`, 'good'); }
    else if (A === 'tka') { const n = takeStore('arrows'); ok = n > 0; if (ok) UI.notify(`לקחת ${n} חצים מהמחסן (${P.arrows} איתך)`, 'good'); }
    else if (A === 'tsw') { ok = takeStore('sword') > 0; if (ok) { UI.notify('לקחת חרב מבית הנשק. היא חזקה מקרוב ופוגעת בכמה אויבים', 'good'); wpnSet('sword', true); } }
    if (ok) { AUD.play('ui'); WPN.key = ''; WPN.fkey = ''; WPN.akey = ''; saveGame(); }
    openArsenal(k || focus);
  };
}
function controlLabels() {
  if (P.fish) return { tJump: [ICON.up, 'עלייה'], tCrouch: [ICON.down, 'צלילה'], tRun: [ICON.run, 'האצה'], tCall: P.spId === 'eel' ? [ICON.bolt, 'חשמל'] : [ICON.call, 'קריאה'], tAtk: [ICON.claw, 'נשיכה'] };
  if (P.bird) return { tJump: [ICON.up, 'עלייה'], tCrouch: [ICON.down, 'צלילה'], tRun: [ICON.run, 'האצה'], tCall: [ICON.call, 'קריאה'], tAtk: [ICON.claw, P.spId === 'harpy' ? 'טפרים' : 'ניקור'] };
  if (P.human) { const w = P.weapon || 'spear'; return { tJump: [ICON.jump, 'קפיצה'], tCrouch: [ICON.sneak, 'התגנבות'], tRun: [ICON.run, 'ריצה'], tCall: [ICON.call, 'שריקה'], tAtk: [ICON[w] || ICON.spear, WPN_N[w]] }; }
  return { tJump: [ICON.jump, 'קפיצה'], tCrouch: [ICON.sneak, 'התגנבות'], tRun: [ICON.run, 'ריצה'], tCall: [ICON.call, 'קריאה'], tAtk: [ICON.claw, 'תקיפה'] };
}
function extraPrompts(pr) {
  climbPrompts(pr);
  if (P.bird) { pr.push(P.flying ? ['רווח / C', 'לעלות / לצלול'] : ['רווח', 'להמריא']); if (P.carry) pr.push(['קליק', 'לשחרר את הטרף']); }
  if (P.human) {
    const w = P.weapon || 'spear';
    pr.push(['קליק', P.boat ? (P.spears > 0 ? 'לזרוק חנית מהסירה' : 'לירות') : w === 'sword' ? 'מכת חרב' : w === 'bow' ? (P.hasBow && (P.arrows || 0) > 0 ? `לירות חץ (${P.arrows})` : 'אין חצים') : P.spears > 0 ? `לזרוק חנית (${P.spears})` : 'אין חניתות']);
    if (P.boat) pr.push(['רווח', 'לקפוץ מהסירה']);
    if ((ownCamp() || VX.known.size) && !P.boat) pr.push(['K', 'מלחמה ושלום']);
  }
}
// ---------- the attack: a sword strikes everything in front, a bow aims, a spear is thrown ----------
function hostileToMe(b) {
  if (!b || !b.alive) return false;
  if (b.duel || (CHAL.ch === b)) return true;
  if (enemyOf(b) && b.brain !== 'villager') return true;
  return (b.state === 'defend' || b.state === 'fight') && (b.foe === P.a || ourSide(b.foe));
}
function swordOk(b) {
  if (b.tribe || b.isPartner || b.cub || b.pet === P.a || (b.pet && b.pet.tribe) || b.brain === 'captive') return false;
  if (b.hunter) return hostileToMe(b) || P.target === b;
  return true;
}
function swordAttack() {
  const a = P.a, fx = Math.sin(a.yaw), fz = Math.cos(a.yaw), hits = [];
  P.atkCD = 0.55; a.anim.atk = 0.42; AUD.play('swipe', 0.75); P.resting = false;
  let face = null, fd = 1e9;
  shQuery(a.pos.x, a.pos.z, 3.6, (b, d) => {
    if (b === a || !b.alive || b.perched || b.tpl.kind === 'fish' || b.spId === 'eel' || (b.tpl.kind === 'bird' && b.pos.y - a.pos.y > 1.6) || !swordOk(b)) return;
    if (d > 2.5 + b.rad) return;
    const dot = d > 0.01 ? ((b.pos.x - a.pos.x) * fx + (b.pos.z - a.pos.z) * fz) / d : 1;
    if (dot > 0.3) hits.push(b); else if (dot > -0.2 && d < fd) { fd = d; face = b; }
  });
  if (!hits.length && face) hits.push(face);
  hits.sort((p, q) => dist2(p.pos, a.pos) - dist2(q.pos, a.pos));
  for (const b of hits.slice(0, 3)) {
    a.yaw += angDiff(a.yaw, Math.atan2(b.pos.x - a.pos.x, b.pos.z - a.pos.z)) * 0.5;
    hurt(b, 24 * (P.workshopOn ? 1.2 : 1) * ironK('sword') * rr(0.9, 1.15) * (b.state !== 'flee' && b.state !== 'fight' && b.state !== 'defend' ? 1.25 : 1) * (P.crouch ? 1.15 : 1), a);
    if (b.dCam < 40) FX.spawn('blood', b.pos.x, b.pos.y + b.height * 0.6, b.pos.z, 4);
    partnerAssist(b);
  }
  if (hits.length) { AUD.play('bite', 0.55); CAM.shake = Math.max(CAM.shake, 0.12); PROG.flags.sword = 1; if (hits.length > 1) combatText(`פגעת ב-${Math.min(3, hits.length)}!`, 'crit'); }
}
function hunterAttack() {
  const a = P.a, sp = P.sp, w = P.boat ? (P.spears > 0 ? 'spear' : 'bow') : P.weapon || 'spear';
  if (P.dive && a.swimming) { if (P.atkCD <= 0) diveStab(); return; }
  if (P.atkCD > 0 || P.stun > 0 || P.sleeping || P.aimT > 0 || AIMX.on) return;
  P.resting = false;
  if (w === 'sword') { swordAttack(); return; }
  const t = findAttackTarget();
  if (t && !(t.hunter && !swordOk(t) && w === 'bow')) {
    if ((t.tpl.kind === 'fish' || t.spId === 'eel') && !a.swimming) { P.atkCD = 0.9; a.anim.atk = 0.45; fishSwipe(t); return; }
    if (dist2(t.pos, a.pos) < 1.9 + t.rad || w === 'bow') { knifeAttack(t); return; }
    P.atkCD = 0.85; a.anim.atk = 0.45;
    a.yaw += angDiff(a.yaw, Math.atan2(t.pos.x - a.pos.x, t.pos.z - a.pos.z)) * 0.7;
    hurt(t, (sp.dmg || 16) * rr(0.85, 1.15) * (t.state !== 'flee' && t.state !== 'fight' ? 1.3 : 1) * (P.crouch ? 1.2 : 1), a);
    AUD.play('bite', 0.7); CAM.shake = Math.max(CAM.shake, 0.1); partnerAssist(t);
    return;
  }
  if (w === 'bow') {
    if (!P.hasBow) { wpnSet('spear', true); UI.notify('אין לך קשת', 'bad'); return; }
    if ((P.arrows || 0) <= 0) {
      // out of arrows: the hand goes to the next weapon by itself
      const nx = P.boat ? null : P.spears > 0 ? 'spear' : P.hasSword ? 'sword' : null;
      if (nx) { wpnSet(nx, true); combatText(`אין חצים: ${WPN_N[nx]} ביד`, 'bad'); if (nx === 'sword') swordAttack(); else aimStart(); return; }
      UI.notify('אין לך חצים. מגלפים 4 חצים מעץ אחד ליד אש, או לוקחים מהמחסן (הארסנל)', 'bad'); P.atkCD = 0.6; return;
    }
    aimStart(); return;
  }
  if (P.spears <= 0 && (P.arrows || 0) <= 0) {
    if (P.hasSword && !P.boat) { wpnSet('sword', true); combatText('אין חניתות: חרב ביד', 'bad'); swordAttack(); return; }
    UI.notify('אין לך חניתות או חצים. אפשר לאסוף חניתות מהקרקע או לגלף חדשות ליד אש (הארסנל)', 'bad'); P.atkCD = 0.6; return;
  }
  aimStart();
}
// release: the bow shoots, the spear flies; birds in the air always get an arrow when there is one
function aimRelease(t) {
  const bow = P.hasBow && (P.arrows || 0) > 0, w = P.boat ? (P.spears > 0 ? 'spear' : 'bow') : P.weapon || 'spear';
  if (bow && (w === 'bow' || (t && flyingBird(t)) || (P.spears || 0) <= 0)) { shootArrow(t); if (t) partnerAssist(t); return; }
  if ((P.spears || 0) > 0) { P.aimTgt = t || null; if (t) partnerAssist(t); P.atkCD = 0.9; playerThrow(); return; }
  shootArrow(t);
}
// the crosshair locks on animals, and on people only when they are enemies
function aimPick2() {
  const a = P.a, o = camera.position, d = camRay(); let best = null, bs = -1e9;
  const cur = AIMX.tgt && AIMX.tgt.alive ? AIMX.tgt : null, bowM = (P.weapon === 'bow' && !P.boat) || !(P.spears > 0), arrows = !!P.hasBow && (P.arrows || 0) > 0, spears = (P.spears || 0) > 0;
  shQuery(a.pos.x, a.pos.z, 52, b => {
    if (!b.alive || b === a || b.pet === a || b.tribe || b.isPartner || b.cub || b.escort || (b.pet && b.pet.tribe) || b.brain === 'captive') return;
    if (b.hunter && !hostileToMe(b)) return;
    const fly = flyingBird(b); if (fly ? !arrows : !(spears || arrows)) return;
    const v = _t2.set(b.pos.x - o.x, b.pos.y + b.height * 0.5 - o.y, b.pos.z - o.z), L = v.length(); if (L < 2 || L > (fly || (bowM && arrows) ? 50 : 34)) return;
    const c = v.dot(d) / L; if (c < 0.93) return;
    const s = c * 12 - L * 0.03 + (b === cur ? 0.35 : 0) + (b.hunter ? 0.2 : 0);
    if (s > bs) { bs = s; best = b; }
  });
  return best;
}
// ---------- the tribe fights with what it has: swords for warriors, bows for hunters, dogs at their side ----------
function tribeFight(a, t, dt) {
  const dx = t.pos.x - a.pos.x, dz = t.pos.z - a.pos.z, d = Math.hypot(dx, dz) || 0.01;
  if (a.young) { a.move(-dx / d, -dz / d, a.sp.run * 0.8, dt); a.pose = 'move'; return; }
  for (const b of a.pets || []) if (b.alive && !b.gone && b.tribeDog && b.state !== 'fight' && d < 30 && !t.swimming) { b.state = 'fight'; b.foe = t; }
  const sword = a.wpn === 'sword' && a.cls === 'warrior', archer = a.cls === 'hunter', k = (BLD.list.some(b => b.done && b.t === 'armory') ? 1.15 : 1) * a.scale;
  const face = () => { a.yaw += angDiff(a.yaw, Math.atan2(dx, dz)) * Math.min(1, dt * 7); };
  if (archer) {
    if (d > 4.5 && d < 26 && (a.spearCD || 0) <= 0) { a.aimBow = true; hunterThrow(a, t, 'arrow'); a.spearCD = rr(1.5, 2.3); return; }
    if (d < 1.7 + t.rad) { a.move(0, 0, 0, dt); face(); a.pose = 'idle'; if ((a.atkCD || 0) <= 0) { a.atkCD = 1; a.anim.atk = 0.45; hurt(t, 10 * k, a); } return; }
    if (d < 6) { a.move(-dx / d, -dz / d, a.sp.walk * 1.6, dt); face(); a.pose = 'move'; return; }
    if (d >= 24) { jobGo(a, t.pos.x, t.pos.z, a.sp.run * 0.8, dt); return; }
    a.circ = a.circ || (a.id % 2 ? 1 : -1); a.move(-dz / d * a.circ, dx / d * a.circ, a.sp.walk, dt); face(); a.pose = 'move'; return;
  }
  if (!sword && d > 5 && d < 24 && (a.spearCD || 0) <= 0) { a.aimBow = false; hunterThrow(a, t, 'spear'); a.spearCD = rr(2.6, 3.8); return; }
  if (d > 1.5 + t.rad) { jobGo(a, t.pos.x, t.pos.z, a.sp.run * (sword ? 0.95 : 0.9), dt); return; }
  a.move(0, 0, 0, dt); face(); a.pose = 'idle';
  if ((a.atkCD || 0) <= 0) { a.atkCD = sword ? 0.75 : 1; a.anim.atk = 0.45; hurt(t, (sword ? 21 : 12) * (a.knight ? 1.3 : 1) * k * rr(0.85, 1.15), a); if (a.dCam < 40) AUD.at(sword ? 'swipe' : 'bite', a.pos, 0.6); }
}
// ---------- crafting a sword ----------
function craftSword() {
  if (P.hasSword) { UI.notify('כבר יש לך חרב'); return false; }
  const st = boxStore();
  if ((st.swords || 0) > 0 && inCamp(12)) { st.swords--; P.hasSword = true; }
  else if (!inCamp(10) && !nearFire(4.2)) { UI.notify('מגלפים חרב ליד אש: מדורת מחנה, או מדורה שמדליקים עם 2 עצים'); return false; }
  else if (!takeRes('wood', 5)) { UI.notify('צריך 5 עצים לחרב'); return false; }
  else P.hasSword = true;
  PROG.flags.gotSword = 1; AUD.play('chime', 0.5);
  UI.notify(`יש לך חרב! מקרוב היא חזקה מחנית ופוגעת בכמה אויבים. ${TOUCH ? 'מחליפים נשק בכפתור "נשק"' : 'מחליפים נשק במקשים 1 2 3 או R'}`, 'good');
  wpnSet('sword', true); return true;
}
(function () {
  const st = document.createElement('style');
  st.textContent = `#tWpn{right:24px;bottom:232px;width:46px;height:46px;background:rgba(60,46,24,.62);border-color:rgba(255,220,150,.55)}#tWpn small{font-size:9.5px;font-weight:600}#tWpn svg{width:19px;height:19px}
#tWpn.open{background:rgba(232,176,75,.88);border-color:#ffe2a3;color:#1c1608}#tWpn.open small{text-shadow:none}
.wt{position:relative;display:grid;place-items:center;align-content:center;gap:2px;cursor:pointer;font-family:Rubik,sans-serif;transition:transform .1s,background .15s,border-color .15s,box-shadow .15s}
.wt svg{pointer-events:none}.wt span{pointer-events:none;line-height:1}
.wt em{position:absolute;top:-7px;right:-6px;min-width:20px;padding:1px 6px;border-radius:999px;font:700 10.5px/1.45 Rubik,sans-serif;font-style:normal;background:#2c3a26;color:#f4efe1;border:1px solid rgba(244,239,225,.35);box-shadow:0 2px 6px rgba(0,0,0,.3);white-space:nowrap;pointer-events:none}
.wt em.wl{display:grid;place-items:center;width:19px;height:19px;padding:0;min-width:0;background:rgba(44,58,38,.82)}.wt em.wl svg{width:10px;height:10px}
.wt.off svg,.wt.off span{opacity:.45}
.wt.on{background:linear-gradient(180deg,#f5cf7c,#dc9c2e);border-color:#ffe6ad;color:#1c1608;box-shadow:0 0 0 2px rgba(245,207,124,.35),0 6px 18px rgba(0,0,0,.28)}
.wt.on em{background:#1c1608;border-color:rgba(28,22,8,.4)}
.wt em.w0,.wt.on em.w0{background:#b8342a;border-color:#ffb0a6;color:#fff}
#wpnFan{position:absolute;right:78px;bottom:228px;display:flex;flex-direction:row;direction:rtl;gap:7px;padding:7px;border-radius:18px;background:rgba(8,18,11,.62);border:1px solid rgba(244,239,225,.22);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);box-shadow:0 8px 24px rgba(0,0,0,.35);animation:wfan .14s ease-out}
#wpnFan[hidden]{display:none}
body.wfan #feed{opacity:0;transition:opacity .15s}
@keyframes wfan{from{opacity:0;transform:translateX(10px) scale(.96)}to{opacity:1;transform:none}}
#wpnFan .wt{width:54px;height:54px;padding:0;border-radius:15px;border:1.5px solid rgba(244,239,225,.38);background:rgba(10,22,14,.55);color:#f4efe1;touch-action:none}
#wpnFan .wt svg{width:22px;height:22px}#wpnFan .wt span{font-size:10px;font-weight:600}
#wpnFan .wt.ars{border-style:dashed}
#wpnFan .wt.on{background:linear-gradient(180deg,#f5cf7c,#dc9c2e);color:#1c1608;border:1.5px solid #ffe6ad}
#tAtk .wbadge{position:absolute;top:2px;left:2px;min-width:22px;padding:2px 6px;border-radius:999px;font:700 11.5px/1.3 Rubik,sans-serif;font-style:normal;background:rgba(10,22,14,.82);color:#f4efe1;border:1px solid rgba(244,239,225,.5);pointer-events:none}
#tAtk .wbadge.w0{background:#b8342a;border-color:#ffb0a6}
#wpnBar{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 62px);transform:translateX(-50%);z-index:5;display:none;align-items:flex-end;gap:7px;padding:8px 9px 7px;border-radius:18px;background:var(--panel2);border:1px solid var(--line);-webkit-backdrop-filter:var(--glass);backdrop-filter:var(--glass);box-shadow:0 6px 20px rgba(0,0,0,.18);direction:ltr;pointer-events:auto}
#wpnBar .wt{width:66px;height:58px;padding:7px 0 3px;border-radius:13px;border:1px solid var(--line);background:var(--panel);color:var(--ink)}
#wpnBar .wt svg{width:21px;height:21px}#wpnBar .wt span{font-size:12px;font-weight:600}
#wpnBar .wt:hover{transform:translateY(-2px);border-color:var(--gold)}
#wpnBar .wt.on{background:linear-gradient(180deg,#f5cf7c,#dc9c2e);border-color:#ffe6ad;color:#1c1608;transform:translateY(-3px)}
#wpnBar .wt.ars{width:58px;border-style:dashed}
#wpnBar kbd{position:absolute;top:4px;left:6px;font:700 10px/1 Rubik,sans-serif;opacity:.5;pointer-events:none}
#wpnBar .wt.on kbd{opacity:.7}
#wpnBar .wsep{width:1px;align-self:stretch;margin:4px 2px;background:var(--line)}
.arscard .itabs b{display:flex;align-items:center;gap:8px}.arscard .itabs b svg{width:22px;height:22px;color:var(--gold)}
.arsChips{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 6px}.arsChips .cchip.ok{background:rgba(92,170,80,.18);border-color:rgba(92,170,80,.5)}.arsChips .cchip.no{background:rgba(195,53,44,.12);border-color:rgba(195,53,44,.4)}
.arsTip{margin:6px 0}
.arsL{display:flex;flex-direction:column;gap:9px;margin:8px 0}
.arsW{display:flex;gap:12px;align-items:flex-start;padding:11px 12px;border-radius:14px;border:1px solid var(--line);background:rgba(232,176,75,.05)}
.arsW.on{border-color:var(--gold);background:rgba(232,176,75,.14);box-shadow:inset 0 0 0 1px rgba(232,176,75,.35)}
.arsW.focus{animation:arsF 1.2s ease-out 1}
@keyframes arsF{0%{box-shadow:0 0 0 0 rgba(232,176,75,.8)}100%{box-shadow:0 0 0 12px rgba(232,176,75,0)}}
.arsIc{flex:0 0 50px;height:50px;display:grid;place-items:center;border-radius:13px;background:var(--track);color:var(--ink)}.arsIc svg{width:28px;height:28px}
.arsW.on .arsIc{background:linear-gradient(180deg,#f5cf7c,#dc9c2e);color:#1c1608}
.arsW.off .arsIc svg{opacity:.45}
.arsMain{flex:1;min-width:0}
.arsH{display:flex;align-items:center;gap:8px}.arsH b{font-size:16px}
.arsH kbd{font:700 11px Rubik,sans-serif;padding:1px 6px;border-radius:5px;border:1px solid var(--line);color:var(--dim)}
.arsSt{margin-inline-start:auto;font-size:11.5px;font-weight:700;padding:2px 9px;border-radius:999px;border:1px solid var(--line);color:var(--dim);display:inline-flex;align-items:center;gap:4px}
.arsSt.on{background:var(--gold);border-color:var(--gold);color:#1c1608}.arsSt svg{width:12px;height:12px}
.arsMain p{margin:4px 0 6px;font-size:13px;line-height:1.45;color:var(--ink)}
.arsHow{color:var(--dim);font-size:12.5px}
.arsAm{display:flex;align-items:center;gap:8px;margin:2px 0 7px}.arsAm small{color:var(--dim);font-size:12px}.arsAm b{font-size:13px;min-width:38px}.arsAm b.w0{color:var(--red)}
.arsBar{flex:0 1 160px;height:7px;border-radius:99px;background:var(--track);overflow:hidden}.arsBar i{display:block;height:100%;border-radius:99px;background:var(--gold)}
.arsAct{display:flex;flex-wrap:wrap;gap:6px}.arsCost{font-style:normal;font-size:11.5px;font-weight:700;margin-inline-start:7px;padding:1px 7px;border-radius:999px;background:rgba(0,0,0,.1)}.arsAct .btn{padding:6px 12px;font-size:13px}.arsAct .btn[disabled]{opacity:.42;cursor:not-allowed}
body.touch .arscard .arsMain p{font-size:12.5px}`;
  document.head.appendChild(st);
})();
// ================= WAR AND PEACE: tribes fight over food, people and land. Raids, captives, champions, and the way back to peace =================
const WAR = { rel: {}, tr: {}, men: {}, food: {}, terr: {}, stolen: {}, parties: [], log: [], caps: [], loot: [], t: 0, dayK: -1, seq: 0, dipT: 0, ownTerr: 0, vas: {}, gone: {} };
const CHAL = { ch: null, stake: null, i: -1, ring: null, at: null, mine: false, t: 0, champ: '' };
const npcIdx = () => HUNT.camps.map((c, i) => i).filter(i => !HUNT.camps[i].own && !HUNT.camps[i].gone && !HUNT.camps[i].dormant && !HUNT.camps[i].bandit);
// a camp on the same side of the ocean as your village (raids and caravans do not cross the sea)
const sameLandOwn = i => { const v = ownCamp(), c = HUNT.camps[i]; return !v || !c || isOld(v.x) === isOld(c.x); };
// two camps on the same continent (across the ocean they do not quarrel, marry or ally)
const sameLand = (i, j) => { const a = HUNT.camps[i], b = HUNT.camps[j]; return !!a && !!b && isOld(a.x) === isOld(b.x); };
const ourKey = () => ownCamp() ? 'own' : VX.mem >= 0 ? VX.mem : null;
const pk = (a, b) => [String(a), String(b)].sort().join('|');
function relGet(a, b) { const k = pk(a, b); return WAR.rel[k] || (WAR.rel[k] = { st: 'peace', since: G.day, truce: -1, sc: {}, days: 0 }); }
const atWarK = (a, b) => a != null && b != null && a !== b && (WAR.rel[pk(a, b)] || {}).st === 'war';
function atWar(i) { const o = ourKey(); return o !== null && o !== i && atWarK(o, i); }
const warActive = () => npcIdx().some(i => atWar(i));
const campName = i => i === 'own' ? 'השבט שלך' : (HUNT.camps[i] && HUNT.camps[i].tribe) || 'שבט';
const chiefOfCamp = c => c && (c.hunters || []).find(h => h.alive && h.cls === 'chief') || null;
function npcTrust(a, b) { if (a === 'own' || b === 'own') return campTrust(a === 'own' ? b : a); return WAR.tr[pk(a, b)] || 0; }
function npcTrustAdd(a, b, n) { if (a === 'own' || b === 'own') { addTrust(a === 'own' ? b : a, n); return; } const k = pk(a, b); WAR.tr[k] = clamp((WAR.tr[k] || 0) + n, -100, 100); }
function warLog(text, kind) { WAR.log.unshift({ d: G.day, t: text, k: kind || '' }); if (WAR.log.length > 40) WAR.log.length = 40; }
function warEnsure() {
  for (const i of npcIdx()) { const c = HUNT.camps[i]; if (WAR.men[i] == null) WAR.men[i] = c.deep ? 8 : 6; if (WAR.food[i] == null) WAR.food[i] = Math.round(rr(18, 30)); if (WAR.terr[i] == null) WAR.terr[i] = c.deep ? 130 : 110; if (!WAR.stolen[i]) WAR.stolen[i] = { food: 0, back: 0 }; }
}
// who is an enemy: the people of a tribe you are at war with, and raiders that come for your village
function enemyOf(b) {
  if (!b || !b.alive || !b.hunter || !b.camp || b.camp.own || b.brain === 'captive') return false;
  if (b.camp.bandit) return true;
  if (b.raider) return b.raider.to === ourKey();
  return atWar(campIndex(b.camp));
}
const ourPeople = b => !!b && (b.isPlayer || b.tribe || (b.pet && (b.pet === P.a || b.pet.tribe)));
function warHit(from, b) {
  if (!from || !b || !b.hunter) return false;
  if (b.duel) return !!from.isPlayer && CHAL.ch === b;
  if (ourPeople(from)) return enemyOf(b);
  if (from.hunter && from.camp && b.camp && from.camp !== b.camp && (from.camp.bandit || b.camp.bandit)) return true;
  if ((from.allyHelp && b.raider && b.raider.to === from.allyHelp) || (b.allyHelp && from.raider && from.raider.to === b.allyHelp)) return true;
  if (from.hunter && from.camp && b.camp && from.camp !== b.camp) return atWarK(campIndex(from.camp), campIndex(b.camp)) || (!!from.raider && from.raider.to === campIndex(b.camp)) || (!!b.raider && b.raider.to === campIndex(from.camp));
  return false;
}
const warKillOk = (t, src) => !!t.raider || warHit(src, t);
// ---------- NPC people fight the enemies of their tribe ----------
function hunterThreat(h) {
  if (h.duel) return P.a && P.a.alive ? P.a : null;
  if (h.lastHit && h.lastHit.alive && !h.lastHit.pet && G.t - h.lastHitT < 25 && dist2(h.lastHit.pos, h.pos) < 45 && !(h.lastHit.hunter && h.lastHit.camp === h.camp)) return h.lastHit;
  if (h.ambush && h.ambush.alive && G.t < h.ambushT && dist2(h.ambush.pos, h.pos) < 40) return h.ambush;
  const bandit = !!(h.camp && h.camp.bandit), i = h.camp ? campIndex(h.camp) : -1, war = i >= 0 && (bandit ? P.human && !(h.camp.paidT > G.t) : atWar(i));
  let best = null, bd = 1e9;
  shQuery(h.pos.x, h.pos.z, 32, (b, d) => {
    if (!b.alive || b === h || b.lured || b.brain === 'captive' || b.duel || b.hidden) return;
    let range = 0;
    if (war && ourPeople(b)) { if (b.young || b.cub || b.isPartner || b.cls === 'gatherer' || (b.isPlayer && P.boat && d > 14)) return; range = b.isPlayer ? 28 : 26; }
    else if (b.hunter && b.camp && b.camp !== h.camp) { if (warHit(h, b)) range = b.raider ? 30 : 24; else return; }
    else {
      if (b.pet || b.hunter || b.tribe || b.isPartner || b.cub || b.tpl.kind === 'bird') return;
      if (b.isPlayer) {
        if (P.fish || P.human) return;
        if (HUNT.angry > 0) range = 30;
        else if ((b.sp.danger || 0) >= 3 || (P.isPred && b.scale * b.rad > 0.35)) range = 13 * clamp(P.noise, 0.45, 1.3);
      } else if (b.tpl.kind === 'fish') return;
      else if ((b.sp.danger || 0) >= 3 && !b.young) range = 13;
      if ((b.state === 'fight' && b.foe && (b.foe === h || b.foe.pet === h)) || (b.state === 'hunt' && b.target && b.target.pet === h)) range = 30;
    }
    if (d < range && d < bd) { bd = d; best = b; }
  });
  if (best && best.isPlayer && G.t - (h.toldP || -99) > 50) {
    h.toldP = G.t; P.pings.push({ x: h.pos.x, z: h.pos.z, t: 6 });
    UI.notify(bandit ? `🗡️ ${h.name} מ${h.camp.tribe} ${heb(h, 'מסתער', 'מסתערת')} עליך!` : war ? `${clsWord(h)} מ${h.camp.tribe} ${heb(h, 'מסתער', 'מסתערת')} עליך: אתם במלחמה!` : `${hunterWord(h)} ${heb(h, 'הבחין', 'הבחינה')} בך ${heb(h, 'ומכוון', 'ומכוונת')} חנית!`, 'bad');
  }
  return best;
}
function rallyHunters(h, f) {
  let n = 0;
  for (const o of (h.camp ? h.camp.hunters : [])) {
    if (o === h || !o.alive || o.fleeing || o.gone || o.state === 'defend' || o.young || dist2(o.pos, h.pos) > 70) continue;
    o.foe = f; o.state = 'defend'; o.think = 1; n++;
  }
  if (n && f.isPlayer && G.mode === 'play' && G.t - (HUNT.rallyT || -99) > 40) { HUNT.rallyT = G.t; AUD.at('whistle', h.pos, 1); UI.notify(`${hunterWord(h)} ${heb(h, 'שורק', 'שורקת')} לשאר בני ${h.camp ? h.camp.tribe : 'השבט'}. הם מתאספים נגדך!`, 'bad'); }
}
function hunterKilled(t, src) {
  if (t.camp && t.camp.bandit) banditBounty(t, src);
  for (const c of HUNT.camps) { const k = (c.hunters || []).indexOf(t); if (k >= 0) c.hunters.splice(k, 1); }
  const i = t.camp ? campIndex(t.camp) : -1;
  if (i >= 0) WAR.men[i] = Math.max(0, (WAR.men[i] || 0) - 1);
  if (t.cls === 'chief' && i >= 0 && !t.raider) polChiefDied(i, t, src);
  if (t.raider) raiderDrop(t);
  if (!P.a || dist2(t.pos, P.a.pos) > 90) return;
  if (t.raider && src && ourPeople(src) && t.raider.to !== 'own' && t.raider.to !== ourKey() && HUNT.camps[t.raider.to]) { addTrust(t.raider.to, 10); t.raider.helpK = (t.raider.helpK || 0) + 1; combatText(`${campName(t.raider.to)} אסירי תודה`, 'good'); }
  if (src && ourPeople(src)) { const who = src.isPlayer ? 'אתה' : src.name || ''; combatText(`${t.name} מ${t.camp ? t.camp.tribe : 'האויבים'} נפל${t.sex === 'f' ? 'ה' : ''}`, 'good'); if (i >= 0 && t.raider) warLog(`${t.name} מ${campName(i)} נפל בפשיטה${who ? ` (${who})` : ''}`, 'good'); }
  else if (t.raider && src && src.hunter && src.camp) UI.notify(`${t.name}, ${heb(t, 'פושט', 'פושטת')} מ${campName(t.raider.from)}, ${heb(t, 'נפל', 'נפלה')} בקרב מול ${src.camp.tribe}`, '');
  else UI.notify(`${t.name || 'צייד'} ${heb(t, 'נהרג', 'נהרגה')} על ידי ${src && src.hunter && src.camp ? `אנשי ${src.camp.tribe}` : src && src.sp ? src.sp.he : 'אויב'}`, P.human ? 'bad' : '');
}
function hunterStartFlee(h, src) {
  if (h.fleeing) return;
  h.fleeing = true; h.fleeT = 0; h.fleeFrom = src; h.windup = 0; h.state = 'flee';
  if (h.lured) h.lured = null;
  const had = (h.pets || []).length;
  freePets(h);
  if (HUNT.net && HUNT.net.h === h) endNet(true);
  if (h.raider) { raiderDrop(h); if (src && ourPeople(src) && h.dCam < 60) combatText(`${h.name} בורח!`, 'good'); return; }
  if (h === CHAL.ch) return;
  if (src && src.isPlayer && G.mode === 'play') {
    if (h.camp && atWar(campIndex(h.camp))) { combatText(`${h.name} ${heb(h, 'נסוג', 'נסוגה')}!`, 'good'); return; }
    PROG.flags.scare = 1; P.renown += 1;
    UI.notify(`${hunterWord(h)} ${heb(h, 'נבהל ובורח', 'נבהלה ובורחת')} מהג׳ונגל!${had ? ' החיות שלו חופשיות' : ''}`, 'good');
    UI.big(heb(h, 'הצייד ברח', 'הציידת ברחה'), 'המעמד שלך עלה');
  }
}
// ---------- strength, food and land ----------
function ownPower(home) {
  const v = ownCamp(); let p = 0;
  for (const m of clanAdults()) {
    if (home && (m.escort || (m.job && (m.job.k === 'raid' || m.job.k === 'caravan')))) continue;
    p += m.cls === 'warrior' || m.cls === 'hunter' ? fightPow(m) : 0.35;
  }
  const R = resMix(); p += tribeDogs().length * 0.5 + tribeEagles().length * 0.4 + R.warrior * 0.9 + R.hunter * 0.3 + (R.builder + R.gatherer) * 0.12;
  if (v && home) { p += BLD.list.filter(b => b.done && (b.t === 'tower' || b.t === 'gatehouse' || b.t === 'walltower') && !b.broken).length * 1.4 + (CAMPH.up.walls ? 3 : CAMPH.up.fence ? 1 : 0) + defPower(); if (P.a && P.a.alive && dist2(P.a.pos, v) < villageR() + 40) p += 2.2; else p += depPower(); }
  for (const k in WAR.vas) if (WAR.vas[k].lord === 'own') p += npcPowerBase(+k) * 0.35;
  for (const i of polAllies('own')) if (i !== 'own' && !atWar(i)) p += npcPowerBase(i) * 0.25;
  return p * (BLD.list.some(b => b.done && b.t === 'armory') ? 1.15 : 1);
}
function npcPowerBase(i) {
  const c = HUNT.camps[i]; if (!c || c.gone) return 0;
  let p = 0; for (const h of c.hunters) if (h.alive && !h.young && !h.fleeing && !h.ctrip && !h.lead) p += h.cls === 'chief' ? 2 : h.cls === 'warrior' ? 1.4 : h.cls === 'hunter' ? 1 : 0.2;
  // stone walls make a castle or a walled city much harder to take
  return (p + (WAR.men[i] || 0) * 0.5) * (c.gate ? 1.3 : 1);
}
function npcPower(i) { let p = npcPowerBase(i); for (const k in WAR.vas) if (WAR.vas[k].lord === i) p += npcPowerBase(+k) * 0.35; return p; }
const ownTerrR = () => ownCamp() ? villageR() + 70 + (WAR.ownTerr || 0) : 0;
function terrOverlap(i) { const v = ownCamp(), c = HUNT.camps[i]; if (!v || !c) return 0; return Math.max(0, ownTerrR() + (WAR.terr[i] || 110) - Math.hypot(v.x - c.x, v.z - c.z)); }
// ---------- the clock of war: every few seconds, and once a day ----------
function warUpdate(dt) {
  warEnsure(); warHud();
  partiesUpdate(dt);
  chalUpdate(dt);
  lootUpdate(dt);
  WAR.t -= dt; if (WAR.t > 0) return; const step = 1 - WAR.t; WAR.t = 1;
  const gh = step * timeRate();
  for (const i of npcIdx()) { const c = HUNT.camps[i]; WAR.food[i] = clamp((WAR.food[i] || 0) + gh * (0.35 * (WAR.terr[i] || 110) / 110 - 0.012 * c.hunters.length), 0, 80); }
  vassalWars();
  if (WAR.dayK !== G.day && G.time > 6.5) { WAR.dayK = G.day; warDaily(); vassalDaily(); }
  if (G.mode === 'play' && !G.paused) { WAR.dipT -= step; if (WAR.dipT <= 0) { WAR.dipT = 30; warDiplomacy(); } }
  warRaids(step);
}
function warDaily() {
  const v = ownCamp(), ids = npcIdx();
  for (const i of ids) {
    WAR.men[i] = Math.min(14, (WAR.men[i] || 0) + (G.day % 2 ? 1 : 0));
    if (!v) continue;
    const r = relGet('own', i), ov = terrOverlap(i);
    if (isVassal(i, 'own')) continue;
    if (r.st === 'war') r.days++;
    else if (ov > 0) { addTrust(i, -(2 + ov / 25)); if (VX.known.has(i) && ov > 25 && G.day % 3 === 0) warLog(`${campName(i)} כועסים: השטח של הכפר נכנס לאזור הציד שלהם`, 'bad'); }
    else if (campTrust(i) < 0) addTrust(i, POL.trait[i] === 'wise' || POL.trait[i] === 'peace' ? 2 : 1);
    if (r.st === 'truce' && G.day >= r.truce) r.st = 'peace';
  }
  // the tribes of the jungle quarrel among themselves too
  for (let a = 0; a < ids.length; a++) for (let b = a + 1; b < ids.length; b++) {
    const i = ids[a], j = ids[b]; if (!sameLand(i, j)) continue;
    const r = relGet(i, j), ci = HUNT.camps[i], cj = HUNT.camps[j];
    const ov = Math.max(0, (WAR.terr[i] || 110) + (WAR.terr[j] || 110) - Math.hypot(ci.x - cj.x, ci.z - cj.z));
    if (isVassal(i, j) || isVassal(j, i)) continue;
    if (r.st === 'war') { r.days++; if (r.days >= 2 && rng() < 0.18 * r.days) { r.st = 'peace'; r.truce = G.day + 3; r.days = 0; npcTrustAdd(i, j, 30); warLog(`${campName(i)} ו${campName(j)} עשו שלום`, ''); } continue; }
    if (r.truce > G.day) continue;
    const allied = polAllied(i, j);
    npcTrustAdd(i, j, allied ? (ov > 0 ? -0.5 : 2) : ov > 0 ? -(4 + ov / 20) : 1.5);
    if (allied) continue;
    if (npcTrust(i, j) < -15 && rng() < 0.25) {
      const win = rng() < npcPower(i) / (npcPower(i) + npcPower(j) + 0.01) ? i : j, los = win === i ? j : i, what = pick(['food', 'land']);
      if (what === 'food') { const f = Math.round(Math.min(WAR.food[los] || 0, 6)); WAR.food[los] -= f; WAR.food[win] += f; } else { WAR.terr[win] = Math.min(170, (WAR.terr[win] || 110) + 8); WAR.terr[los] = Math.max(60, (WAR.terr[los] || 110) - 8); }
      npcTrustAdd(i, j, 6);
      if (VX.known.has(i) || VX.known.has(j)) warLog(`האלוף של ${campName(win)} ניצח את האלוף של ${campName(los)} בקרב על ${what === 'food' ? 'אוכל' : 'שטחי ציד'}`, '');
    }
    const hungry = WAR.food[i] < 10 || WAR.food[j] < 10;
    if (npcTrust(i, j) < -35 && rng() < (hungry ? 0.6 : 0.3) * Math.max(polTr(i).npcWar, polTr(j).npcWar)) { r.st = 'war'; r.since = G.day; r.days = 0; r.sc = {}; polWarStarted(i, j); warLog(`${campName(i)} ו${campName(j)} נלחמים על ${hungry ? 'אוכל' : 'שטחי ציד'}`, 'bad'); if (VX.known.has(i) || VX.known.has(j)) UI.notify(`⚔️ מלחמה ${LANDS[campLand(HUNT.camps[i])].in}: ${campName(i)} ו${campName(j)} נלחמים על ${hungry ? 'אוכל' : 'שטחי ציד'}`, 'bad'); }
  }
}
// ---------- raids: who attacks whom, and when ----------
function warRaids(step) {
  const o = ourKey(), ids = npcIdx();
  for (const i of ids) {
    const r = WAR.rel[pk(i, 'own')];
    if (o === 'own' && r && r.st === 'war' && sameLandOwn(i)) {
      r.raidT = (r.raidT ?? rr(90, 160)) - step * (isNight() ? 1.6 : 1);
      if (r.raidT <= 0) { r.raidT = rr(480, 760); if (!WAR.parties.some(p => p.from === i && !p.done) && (WAR.men[i] || 0) + HUNT.camps[i].hunters.filter(h => h.alive && !h.young).length >= 4) raidStart(i, 'own'); }
    }
  }
  // NPC tribes at war raid each other; it is heard about, and sometimes seen
  for (let a = 0; a < ids.length; a++) for (let b = a + 1; b < ids.length; b++) {
    const i = ids[a], j = ids[b], r = WAR.rel[pk(i, j)]; if (!r || r.st !== 'war') continue;
    r.raidT = (r.raidT ?? rr(200, 400)) - step; if (r.raidT > 0) continue; r.raidT = rr(500, 800);
    const [at, df] = rng() < npcPower(i) / (npcPower(i) + npcPower(j) + 0.01) ? [i, j] : [j, i];
    raidStart(at, df);
  }
}
function npcRaid(at, df) {
  const A = npcPower(at) * rr(0.7, 1.3), D = npcPower(df) * rr(0.7, 1.3), win = A > D * 1.05, r = relGet(at, df);
  const ca = HUNT.camps[at], cd = HUNT.camps[df], far = c => !P.a || Math.hypot(P.a.pos.x - c.x, P.a.pos.z - c.z) > 160;
  let txt = '';
  if (win) {
    const f = Math.round(Math.min(WAR.food[df], 4 + A)); WAR.food[df] -= f; WAR.food[at] += f; r.sc[at] = (r.sc[at] || 0) + 1;
    WAR.terr[at] = Math.min(170, (WAR.terr[at] || 110) + 5); WAR.terr[df] = Math.max(60, (WAR.terr[df] || 110) - 5);
    WAR.men[df] = Math.max(0, WAR.men[df] - 1);
    txt = `${campName(at)} פשטו על ${campName(df)} ולקחו ${f} מנות אוכל`;
  } else { WAR.men[at] = Math.max(0, WAR.men[at] - 1); r.sc[df] = (r.sc[df] || 0) + 1; txt = `${campName(df)} הדפו פשיטה של ${campName(at)}`; }
  if (VX.known.has(at) || VX.known.has(df)) warLog(txt, '');
  if (ourKey() === at || ourKey() === df) UI.notify(`⚔️ ${txt}`, (ourKey() === at) === win ? 'good' : 'bad');
}
// ---------- a war party on its way ----------
function raidTarget(p) { return p.site ? p.site : p.to === 'own' ? ownCamp() : HUNT.camps[p.to] || null; }
// site: { x, z, b, what } a war party that comes for something built in their land
function raidStart(from, to, site) {
  const c = HUNT.camps[from], tc = site || (to === 'own' ? ownCamp() : HUNT.camps[to]); if (!c || !tc) return null;
  const n = clamp(Math.round(npcPower(from) * 0.42), 3, 8), p = { id: ++WAR.seq, from, to, men: [], phase: 'gather', t: 0, n0: n, got: { food: 0, caps: [] }, lost: 0, done: false, mine: false, site: site || null };
  WAR.parties.push(p);
  const near = P.a && (Math.hypot(P.a.pos.x - tc.x, P.a.pos.z - tc.z) < 330 || Math.hypot(camera.position.x - tc.x, camera.position.z - tc.z) < 330);
  if (!near) { raidAbstract(p); return p; }
  const R = site ? -15 : to === 'own' ? villageR() : 12, base = Math.atan2(c.x - tc.x, c.z - tc.z);
  let sx = 0, sz = 0;
  for (let k = 0; k < 16; k++) { const ang = base + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 0.22, d = R + 55; sx = tc.x + Math.sin(ang) * d; sz = tc.z + Math.cos(ang) * d; if (inBounds(sx, sz) && waterDepth(sx, sz) === 0 && getNY(sx, sz) > 0.8) break; }
  p.sx = sx; p.sz = sz; p.ax = tc.x; p.az = tc.z;
  const tk = tribeKeyOf(c), tasks = site ? ['wreck', 'fight', 'wreck', 'fight', 'fight', 'wreck', 'fight', 'fight'] : to === 'own' ? ['loot', 'burn', 'fight', 'loot', 'fight', 'burn', 'loot', 'fight'] : ['fight', 'loot', 'fight', 'loot', 'fight', 'fight', 'fight', 'fight'];
  for (let k = 0; k < n; k++) {
    const ang = Math.atan2(sx - tc.x, sz - tc.z) + rr(-0.5, 0.5), d = 22 + rr(0, 10);
    let x = sx + Math.sin(ang) * d, z = sz + Math.cos(ang) * d; if (!inBounds(x, z) || waterDepth(x, z) > 0) { x = sx + rr(-3, 3); z = sz + rr(-3, 3); }
    const role = k % 3 === 1 ? 'hunter' : 'warrior', sd = lookSeed(), h = new Animal('hunter', x, z, { sex: 'm', tpl: ensureTribal(role, tk, 'm', role === 'hunter' || k % 2 === 0, sd % 3), scale: rr(0.97, 1.06) }); h.ground(1, true);
    Object.assign(h, { hunter: true, camp: c, raider: p, cls: role, name: npcName(c, 'm'), pets: [], brain: 'raider', socialExtra: true, state: 'idle', spearCD: rr(0, 2), netCD: 99, vd: 260, rtask: tasks[k] || 'fight', rwpn: role === 'hunter' ? 'bow' : k % 2 === 0 ? 'sword' : 'spear' });
    h.maxHp *= 1.1; h.hp = h.maxHp; h.home.set(c.x, 0, c.z); civLook(h, c, sd);
    p.men.push(h);
  }
  mountRaiders(p);
  return p;
}
// far from the eye, a raid is decided by strength, and you hear about it afterwards
function raidAbstract(p) {
  p.done = true; p.abstract = true;
  const i = p.from, A = p.n0 * 1.25 * rr(0.7, 1.3);
  if (p.site) { siteRaidAbstract(p, A); return; }
  if (p.to !== 'own') { npcRaid(i, p.to); return; }
  const v = ownCamp(); if (!v) return;
  const D = ownPower(true) * rr(0.75, 1.25), st = boxStore(), r = relGet('own', i);
  const lines = [];
  if (D >= A) {
    const k = Math.min(p.n0, Math.max(1, Math.round((D - A) / 3) + 1)); WAR.men[i] = Math.max(0, WAR.men[i] - k); r.sc.own = (r.sc.own || 0) + 1;
    lines.push(`לוחמי ${campName(i)} ניסו לפשוט על הכפר, והלוחמים שלך הדפו אותם (${k} מהם נפלו)`); PROG.flags.raidWonTribe = 1;
    if (DEP.away && depWho()) depDeed(`${heb(depWho(), 'הוביל', 'הובילה')} את הלוחמים והדפו את ${campName(i)}`);
    if (rng() < 0.25) warCasualty(lines);
    warLog(`הכפר הדף פשיטה של ${campName(i)}`, 'good'); polEvent(4, `הדפתם את ${campName(i)}`);
  } else {
    const food = Math.min(st.cooked + st.meat + st.fish, Math.round(5 + A * 1.5)); takeFood(food); WAR.food[i] += food; WAR.stolen[i].food += food; r.sc[i] = (r.sc[i] || 0) + 1;
    lines.push(`${campName(i)} פשטו על הכפר${P.a && dist2(P.a.pos, v) > 200 ? ' בזמן שהיית רחוק' : ''}: לקחו ${food} מנות אוכל`);
    if (rng() < 0.55) warCasualty(lines);
    if (rng() < 0.5) { const b = pick(BLD.list.filter(q => q.done && q.t !== 'torch' && !BTYPES[q.t].def) || []); if (b) { buildingBurn(b, null); lines.push(`הציתו את ${BTYPES[b.t].n}`); } }
    warLog(lines.join('. '), 'bad'); polEvent(-6, `${campName(i)} פשטו על הכפר`);
  }
  UI.notify(`⚔️ ${lines.join('. ')}`, D >= A ? 'good' : 'bad'); P.pings.push({ x: v.x, z: v.z, t: 12 });
  saveGame();
}
function warCasualty(lines) {
  const L = clanAdults().filter(m => !m.escort && !m.isPartner && (m.cls === 'warrior' || m.cls === 'hunter') && !(m.job && m.job.k === 'raid'));
  const m = L.length > 2 ? pick(L) : null; if (!m) return;
  if (rng() < 0.4) { m.hp = 0; kill(m, null); lines.push(`${m.name} ${heb(m, 'נפל', 'נפלה')} בקרב`); }
  else { m.hp = Math.max(1, m.hp * 0.35); lines.push(`${m.name} ${heb(m, 'נפצע', 'נפצעה')}`); }
}
function takeFood(n) { const st = boxStore(); let got = 0; for (const k of ['cooked', 'meat', 'fish']) { const t = Math.min(n - got, st[k] || 0); st[k] -= t; got += t; if (got >= n) break; } return got; }
// ---------- raiders at work ----------
BRAIN.raider = function (h, dt) {
  h.stT -= dt; h.think -= dt; h.spearCD -= dt; h.netCD = 99;
  const p = h.raider;
  if (!p || p.done) { if (h.captive) captiveFree(h.captive, 'drop'); if (h.rust) raid2Release(h, false); h.brain = 'leaver'; h.raider = null; h.leaveTo = { x: h.camp.x, z: h.camp.z }; return; }
  if (h.aboard) { raid2Aboard(h, dt); return; }
  if (h.fleeing) { hunterFlee(h, dt); if (h.gone) raiderGone(h, false); return; }
  if (h.windup > 0) {
    const t = h.throwTgt; h.windup -= dt;
    if (h.mark) { const q = predictAim(h); if (q) placeMarker(h.mark, q.x, q.z, 1 - Math.max(0, h.windup) / (h.windup0 || 0.7)); }
    if (t && t.alive) h.yaw += angDiff(h.yaw, Math.atan2(t.pos.x - h.pos.x, t.pos.z - h.pos.z)) * Math.min(1, dt * 8);
    h.move(0, 0, 0, dt); h.pose = 'aim'; if (h.windup <= 0) hunterLaunch(h); return;
  }
  if (h.hp < h.maxHp * 0.3 && !h.rret) { h.rret = true; raiderDrop(h); if (h.dCam < 50) say(h, pick(['נסיגה!', 'אני פצוע!', 'חוזרים!']), 1.8); }
  if (h.rret || p.phase === 'retreat') { raiderHome(h, p, dt); return; }
  if (p.phase === 'gather') { const d = jobGo(h, p.sx + Math.sin(h.id) * 3, p.sz + Math.cos(h.id) * 3, h.sp.walk * 1.8, dt); if (d < 1.5) { h.move(0, 0, 0, dt); h.pose = 'idle'; h.look = Math.sin(G.t + h.id); } return; }
  if (h.think <= 0) { h.think = 0.45; h.foe = raiderFoe(h, p); }
  if (h.foe && h.foe.alive) { raiderFight(h, h.foe, dt); return; }
  raiderTask(h, p, dt);
};
function raiderFoe(h, p) {
  let best = null, bd = 1e9; const tc = raidTarget(p); if (!tc) return null;
  // thieves and fire-raisers keep to their task, and fight only what blocks them or hits them
  const busy = h.rtask === 'loot' || h.rtask === 'burn' || (h.rtask === 'rustle' && !h.rust);
  if (busy) return h.lastHit && h.lastHit.alive && !h.lastHit.hunter && G.t - (h.lastHitT || -99) < 4 && dist2(h.lastHit.pos, h.pos) < 12 && rng() < 0.6 ? h.lastHit : null;
  shQuery(h.pos.x, h.pos.z, 24, (b, d) => {
    if (!b.alive || b.hidden || b.young || b.cub || b.brain === 'captive' || b === h.captive) return;
    let ok = false;
    if (p.to === 'own') ok = (b.isPlayer && !P.boat) || (b.tribe && !b.onTower) || (b.pet && (b.pet === P.a || b.pet.tribe) && b.tpl.kind !== 'bird') || (b.allyHelp === 'own' && b.allyP === p);
    else ok = (b.hunter && b.camp === tc && b.brain !== 'villager') || (b.isPlayer && !P.boat && atWar(p.from));
    if (!ok) return;
    const s = d - (b.lastHit === h || (b.foe === h) ? 8 : 0) - (b.isPlayer ? 3 : 0);
    if (s < bd) { bd = s; best = b; }
  });
  return best;
}
function raiderFight(h, t, dt) {
  const dx = t.pos.x - h.pos.x, dz = t.pos.z - h.pos.z, d = Math.hypot(dx, dz) || 0.01;
  const face = () => { h.yaw += angDiff(h.yaw, Math.atan2(dx, dz)) * Math.min(1, dt * 7); };
  if (h.rwpn === 'bow' && d > 4.5 && d < 25 && h.spearCD <= 0) { h.aimBow = true; hunterThrow(h, t, 'arrow'); h.spearCD = rr(1.8, 2.7); return; }
  if (h.rwpn === 'spear' && d > 5 && d < 22 && h.spearCD <= 0) { h.aimBow = false; hunterThrow(h, t, 'spear'); h.spearCD = rr(2.6, 3.8); return; }
  if (h.rwpn === 'bow' && d < 7 && d > 2) { h.move(-dx / d, -dz / d, h.sp.walk * 1.5, dt); face(); h.pose = 'move'; return; }
  if (d > 1.6 + t.rad) { jobGo(h, t.pos.x, t.pos.z, h.sp.run * 0.85, dt); return; }
  h.move(0, 0, 0, dt); face(); h.pose = 'idle';
  if (h.atkCD <= 0) { h.atkCD = h.rwpn === 'sword' ? 0.85 : 1.15; h.anim.atk = 0.45; if (t.isPlayer && P.dodgeT > 0) return; hurt(t, (h.rwpn === 'sword' ? 17 : 12) * rr(0.85, 1.15), h); if (h.dCam < 40) AUD.at('swipe', h.pos, 0.6); }
}
function raiderTask(h, p, dt) {
  const tc = raidTarget(p); if (!tc) { h.rret = true; return; }
  if (h.rtask === 'rustle') { if (rustleTask(h, p, dt)) return; h.rtask = 'fight'; }
  const v = p.to === 'own' ? tc : null;
  if (h.rtask === 'burn' && v) {
    let b = h.rb && h.rb.done && BLD.list.includes(h.rb) ? h.rb : null;
    if (!b) { const L = BLD.list.filter(q => q.done && q.t !== 'torch' && q.t !== 'dock' && !BTYPES[q.t].def); b = h.rb = L.length ? L.sort((x, y) => dist2(x, h.pos) - dist2(y, h.pos))[0] : null; if (!b) { h.rtask = 'fight'; return; } }
    const ang = Math.atan2(h.pos.x - b.x, h.pos.z - b.z), r = BTYPES[b.t].r + 0.9, d = jobGo(h, b.x + Math.sin(ang) * r, b.z + Math.cos(ang) * r, h.sp.run * 0.8, dt);
    if (d < 1) { h.move(0, 0, 0, dt); h.pose = 'kneel'; h.burnT = (h.burnT || 0) + dt; if (h.burnT > 3.2) { buildingBurn(b, h); h.burnT = 0; h.rtask = 'fight'; } }
    return;
  }
  if (h.rtask === 'wreck' && p.site) { raiderWreck(h, p, dt); return; }
  if (h.rtask === 'loot' && v) {
    const st = boxStore(), food = st.cooked + st.meat + st.fish;
    if (food <= 0) { h.rtask = 'fight'; return; }
    const d = jobGo(h, v.x + Math.sin(h.id) * 1.6, v.z + Math.cos(h.id) * 1.6, h.sp.run * 0.85, dt);
    if (d < 1.4) { h.move(0, 0, 0, dt); h.pose = 'kneel'; h.lootT = (h.lootT || 0) + dt; if (h.lootT > 3) { const n = takeFood(Math.min(food, Math.round(rr(4, 8)))); h.loot = n; h.carry = true; p.got.food += n; h.rret = true; if (n) UI.notify(`⚔️ ${h.name} גונב ${n} מנות אוכל מהמחסן!`, 'bad'); } }
    return;
  }
  // nothing to do here: walk the village looking for someone to fight
  const tx = tc.x + Math.sin(G.t * 0.1 + h.id) * 6, tz = tc.z + Math.cos(G.t * 0.1 + h.id) * 6;
  const d = jobGo(h, tx, tz, h.sp.walk * 1.6, dt); if (d < 1.5) { h.move(0, 0, 0, dt); h.pose = 'idle'; }
}
function raiderHome(h, p, dt) {
  if (p.ship && !p.ship.gone) { raid2ShipHome(h, p, dt); return; }
  const c = h.camp, d = jobGo(h, c.x, c.z, h.sp.run * (h.captive ? 0.62 : 0.85), dt), tc = raidTarget(p);
  const away = !tc || Math.hypot(h.pos.x - tc.x, h.pos.z - tc.z) > (p.to === 'own' ? villageR() : 12) + 110;
  if ((away && (h.dCam || 0) > 80) || d < 12) raiderGone(h, true);
}
// a raider is gone: home with the loot, dead, or fled
function raiderGone(h, home, keep) {
  if (h.mount) mountOff(h);
  const p = h.raider; if (!p) return;
  if (h.rust) raid2Release(h, home);
  if (home) {
    if (h.loot) { WAR.food[p.from] = (WAR.food[p.from] || 0) + h.loot; if (p.to === 'own' && WAR.stolen[p.from]) WAR.stolen[p.from].food += h.loot; }
    if (h.captive) captiveToCamp(h.captive, p.from);
    if (!h.gone && !keep) h.remove();
  } else p.lost++;
  h.loot = 0; h.captive = null;
  const k = p.men.indexOf(h); if (k >= 0) p.men.splice(k, 1);
}
// a wounded or fleeing raider drops what he carries: the food and the captive stay behind
function raiderDrop(h) {
  if (h.rust) raid2Release(h, false);
  if (h.loot > 0) { lootDrop(h.pos.x, h.pos.z, h.loot, h.raider ? h.raider.from : -1); if (h.raider) h.raider.got.food -= h.loot; h.loot = 0; h.carry = false; }
  if (h.captive) { const c = h.captive; captiveFree(c, 'drop'); if (h.raider) h.raider.got.caps = h.raider.got.caps.filter(n => n !== c.name); }
}
function partiesUpdate(dt) {
  for (let k = WAR.parties.length - 1; k >= 0; k--) {
    const p = WAR.parties[k]; if (p.done) { if (G.t - (p.doneT || (p.doneT = G.t)) > 120) WAR.parties.splice(k, 1); continue; }
    if (p.mine) { ourRaidUpdate(p, dt); continue; }
    p.t += dt;
    for (const h of p.men.slice()) if (!h.alive || h.gone) { if (!h.alive) raiderGone(h, false); else { const i = p.men.indexOf(h); if (i >= 0) p.men.splice(i, 1); } }
    if (p.phase === 'gather') {
      const at = p.men.filter(h => Math.hypot(h.pos.x - p.sx, h.pos.z - p.sz) < 7).length;
      if (p.t > 26 || at >= Math.ceil(p.men.length * 0.7)) { p.phase = 'attack'; p.t = 0; raidAnnounce(p); }
    } else if (p.phase === 'attack') {
      const half = p.lost >= Math.ceil(p.n0 / 2);
      if (p.t > 95 || half || p.men.filter(h => !h.rret).length <= Math.floor(p.n0 * 0.3) || (p.site && siteDone(p) && p.t > 20)) { p.phase = 'retreat'; if (p.to === 'own' && p.men.length) UI.notify(half ? `לוחמי ${campName(p.from)} נסוגים: חצי מהם נפלו!` : `לוחמי ${campName(p.from)} נסוגים!`, 'good'); }
    }
    if (!p.men.length) raidEnd(p);
  }
}
function raidAnnounce(p) {
  const tc = raidTarget(p); if (!tc) return;
  P.pings.push({ x: p.sx, z: p.sz, t: 15 });
  AUD.play('growl', 0.7);
  if (p.site) { UI.big('הם באים!', `${p.men.length} לוחמים של ${campName(p.from)} באים להרוס את ${p.site.what ? `ה${p.site.what}` : 'מה'} שבניתם בשטח שלהם. אם חצי מהם ייפלו, הם ייסוגו`); for (const m of clanAdults()) if (m.cls === 'warrior' && !m.escort && !m.towerB && dist2(m.pos, p.site) < 160) { m.hidden = false; const e = p.men[0]; if (e) { m.state = 'fight'; m.foe = e; } } return; }
  if (p.to === 'own') {
    const tower = BLD.list.some(b => b.done && b.t === 'tower' && b.guard); polAllyHelp(p);
    UI.big('פשיטה!', `${p.men.length} לוחמים של ${campName(p.from)} תוקפים את הכפר${tower ? '. השומרים במגדלים יורים בהם' : ''}`);
    for (const m of clanAdults()) if (m.cls === 'warrior' && !m.escort && !m.towerB) { m.hidden = false; const e = p.men[0]; if (e) { m.state = 'fight'; m.foe = e; } }
  } else if (!p.kind2 || p.ship) UI.notify(`⚔️ ${p.ship ? 'הוויקינגים קפצו לחוף ותוקפים' : `לוחמי ${campName(p.from)} תוקפים`} את ${campName(p.to)}!`, 'bad');
}
function raidEnd(p) {
  p.done = true; p.doneT = G.t;
  const i = p.from, r = relGet(i, p.to), f = Math.max(0, p.got.food), caps = p.got.caps;
  if (p.site) { siteRaidEnd(p); return; }
  if (p.to !== 'own') {
    const win = p.lost < Math.ceil(p.n0 / 2);
    if (win) { const g = Math.round(Math.min(WAR.food[p.to] || 0, p.kind2 ? Math.max(p.got.food || 0, 4 + (p.n0 - p.lost) * 2) : 3 + p.men.length * 2)); WAR.food[p.to] -= g; WAR.food[i] = (WAR.food[i] || 0) + g; if (p.kind2) p.got.food = g; r.sc[i] = (r.sc[i] || 0) + 1; } else r.sc[p.to] = (r.sc[p.to] || 0) + 1;
    const t = p.kind2 ? raid2Words(p, win) : win ? `${campName(i)} פשטו על ${campName(p.to)}` : `${campName(p.to)} הדפו פשיטה של ${campName(i)}`;
    const heard = !p.kind2 || VX.known.has(p.to) || VX.known.has(i) || (P.a && Math.hypot(P.a.pos.x - HUNT.camps[p.to].x, P.a.pos.z - HUNT.camps[p.to].z) < 900);
    if (heard) { warLog(t, ''); UI.notify(p.kind2 ? t : `⚔️ ${t}`, ''); }
    if (p.kind2) raid2After(p, win);
    return;
  }
  const lost = p.lost, bs = p.got.beasts || 0, ok = f > 0 || caps.length || bs > 0;
  if (!ok || lost >= Math.ceil(p.n0 / 2)) { r.sc.own = (r.sc.own || 0) + 2; PROG.flags.raidWonTribe = 1; }
  else r.sc[i] = (r.sc[i] || 0) + 1;
  const txt = ok ? `הפשיטה של ${p.kind2 ? raid2Who(p) : campName(i)} נגמרה: ${[f || bs ? `לקחו ${[f ? `${f} מנות אוכל` : '', bs ? (bs === 1 ? 'בהמה אחת' : `${bs} בהמות`) : ''].filter(Boolean).join(f && bs ? (bs === 1 ? ' ו' : ' ו-') : '')}` : '', caps.length ? `ולקחו בשבי את ${caps.join(' ו')}` : ''].filter(Boolean).join(' ')}${lost ? `. ${lost} מהלוחמים שלהם נפלו` : ''}` : `הכפר הדף את הפשיטה של ${campName(i)}!${lost ? ` ${lost} מהלוחמים שלהם נפלו` : ''}`;
  warLog(txt, ok ? 'bad' : 'good'); polEvent(ok ? -6 : 5, ok ? `${campName(i)} פשטו על הכפר` : 'הדפתם פשיטה'); UI.notify(ok ? `⚔️ ${txt}. אפשר להילחם בחזרה ולקחת את זה בחזרה` : `🛡️ ${txt}`, ok ? 'bad' : 'good');
  if (!ok) { AUD.play('cheer', 0.5); for (const m of clanAdults()) if (m.cls === 'warrior' && !m.hidden && m.dCam < 50) gesture(m, 'cheer', 2.5); }
  saveGame();
}
// ---------- buildings set on fire ----------
function buildingBurn(b, h) {
  if (!b.done) return;
  b.done = false; b.work = BTYPES[b.t].work * 0.45; siteLook(b);
  if (!BLD.sites.includes(b)) BLD.sites.push(b);
  b.scaf = scaffold(BTYPES[b.t].r); b.scaf.position.set(b.x, getH(b.x, b.z), b.z); b.scaf.rotation.y = b.rot; scene.add(b.scaf);
  if (b.fl) { for (const m of b.fl.fl) scene.remove(m); scene.remove(b.fl.g); b.fl = null; }
  if (b.guard) { towerLeave(b.guard); b.guard = null; }
  b.burnT = 18;
  if (h) { UI.notify(`🔥 ${h.name} הצית את ה${BTYPES[b.t].n}! הבונים יצטרכו לתקן`, 'bad'); P.pings.push({ x: b.x, z: b.z, t: 10 }); }
  warLog(`${BTYPES[b.t].n} נשרף${b.t === 'hut' || b.t === 'granary' ? 'ה' : ''} בפשיטה`, 'bad');
}
// ---------- loot dropped on the ground goes back to the store ----------
function lootDrop(x, z, food, from) {
  if (!food) return;
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 6), new THREE.MeshLambertMaterial({ color: '#8a6a42' })); mesh.scale.set(1, 0.75, 1); mesh.position.set(x, getH(x, z) + 0.22, z); scene.add(mesh);
  WAR.loot.push({ x, z, food, from, mesh, t: 0 });
  if (P.a && dist2(P.a.pos, { x, z }) < 60) combatText(`השלל נפל: ${food} מנות אוכל`, 'good');
}
function lootUpdate(dt) {
  const v = ownCamp();
  for (let k = WAR.loot.length - 1; k >= 0; k--) {
    const L = WAR.loot[k]; L.t += dt; L.mesh.rotation.y += dt;
    let by = null;
    if (P.a && P.a.alive && Math.hypot(P.a.pos.x - L.x, P.a.pos.z - L.z) < 2.4) by = P.a;
    else if (L.t > 20 && v && Math.hypot(L.x - v.x, L.z - v.z) < villageR() + 60 && !WAR.parties.some(p => !p.done && !p.mine && p.men.some(h => dist2(h.pos, L) < 25))) by = clanAdults()[0] || null;
    if (!by && L.t > 300) by = 'lost';
    if (!by) continue;
    scene.remove(L.mesh); WAR.loot.splice(k, 1);
    if (by === 'lost') continue;
    const st = boxStore(); st.cooked += L.food; if (L.from >= 0 && WAR.stolen[L.from]) WAR.stolen[L.from].back += L.food;
    UI.notify(`החזרתם ${L.food} מנות אוכל שנגנבו`, 'good'); PROG.flags.reclaim = 1;
  }
}
// ---------- captives: taken in a raid, held at the enemy camp, and brought back ----------
function captiveTake(w, raider, i) {
  const k = TRIBE.adults.indexOf(w); if (k >= 0) TRIBE.adults.splice(k, 1);
  if (w.spouse) w.spouseU = w.spouse.uid;
  if (w.towerB) towerLeave(w);
  Object.assign(w, { tribe: false, brain: 'captive', captor: raider, capCamp: i, job: null, escort: false, state: 'idle', foe: null, hidden: false, carry: false, preg: 0 });
  if (raider) raider.captive = w; else captiveToCamp(w, i);
  if (!WAR.caps.includes(w)) WAR.caps.push(w);
  warLog(`${w.name} ${heb(w, 'נלקח', 'נלקחה')} בשבי אל ${campName(i)}`, 'bad');
}
function captiveToCamp(w, i) {
  const c = HUNT.camps[i]; if (!c) return;
  w.captor = null; w.capCamp = i;
  for (let t = 0; t < 12; t++) { const ang = rng() * TAU, x = c.x + Math.cos(ang) * rr(3, 5), z = c.z + Math.sin(ang) * rr(3, 5); if (waterDepth(x, z) === 0) { w.pos.set(x, 0, z); w.ground(1, true); break; } }
  if (!WAR.caps.includes(w)) WAR.caps.push(w);
}
BRAIN.captive = function (a, dt) {
  const k = a.captor;
  if (k) {
    if (!k.alive || k.gone || k.fleeing) { captiveFree(a, 'drop'); return; }
    const dx = k.pos.x - Math.sin(k.yaw) * 1.4 - a.pos.x, dz = k.pos.z - Math.cos(k.yaw) * 1.4 - a.pos.z, d = Math.hypot(dx, dz);
    if (d > 0.4) { a.move(dx / d, dz / d, Math.min(a.sp.run, Math.max(k.speed, d * 2)), dt); a.pose = 'move'; } else { a.move(0, 0, 0, dt); a.pose = 'idle'; }
    if (a.dCam < 30 && rng() < dt * 0.25) say(a, pick(['עזרה!', 'הצילו!', 'תעזבו אותי!']), 1.6);
    return;
  }
  const c = HUNT.camps[a.capCamp]; if (!c) { captiveFree(a, 'drop'); return; }
  const dx = c.x - a.pos.x, dz = c.z - a.pos.z, d = Math.hypot(dx, dz);
  if (d > 7) { a.move(dx / d, dz / d, a.sp.walk, dt); a.pose = 'move'; return; }
  a.move(0, 0, 0, dt); a.pose = 'sit'; a.yaw += angDiff(a.yaw, Math.atan2(dx, dz)) * Math.min(1, dt * 2);
  if (P.a && a.dCam < 14 && rng() < dt * 0.15) say(a, pick([you('באת לקחת אותי הביתה?', 'באת לקחת אותי הביתה?'), 'תשחרר אותי, בבקשה', 'אני רוצה לחזור לכפר']), 2.2);
};
// freed: back to the tribe, home or with the hunter
function captiveFree(a, how) {
  const k = WAR.caps.indexOf(a); if (k >= 0) WAR.caps.splice(k, 1);
  if (!a.alive || a.gone) return;
  if (a.captor && a.captor.captive === a) a.captor.captive = null;
  a.captor = null; a.capCamp = -1; a.brain = 'tribe'; a.tribe = true; a.socialExtra = true;
  if (!ownCamp() && VX.mem < 0 && !aliveMates().length) { a.brain = 'leaver'; a.tribe = false; return; }
  tribeJoin(a); if (!TRIBE.adults.includes(a)) TRIBE.adults.push(a);
  if (a.spouseU) { const s = famByUid(a.spouseU); if (s) { a.spouse = s; s.spouse = a; } a.spouseU = 0; }
  a.escort = how === 'player'; a.job = null; a.state = 'idle';
  PROG.flags.reclaim = 1;
  if (how === 'player') { say(a, pick(['תודה! ידעתי שתבוא', 'בוא נחזור הביתה', 'אתה הגיבור שלי']), 3); UI.notify(`שחררת את ${a.name}! ${heb(a, 'הוא הולך', 'היא הולכת')} איתך הביתה`, 'love'); }
  else if (how === 'drop') UI.notify(`${a.name} ${heb(a, 'השתחרר', 'השתחררה')} וחוזר${a.sex === 'f' ? 'ת' : ''} לכפר`, 'good');
  else UI.notify(`${a.name} ${heb(a, 'חוזר', 'חוזרת')} הביתה`, 'good');
  warLog(`${a.name} ${heb(a, 'חזר', 'חזרה')} לשבט`, 'good');
}
CTXT.free = ['heart', 'לשחרר', 'לשחרר את השבוי'];
function captiveNear() { const a = P.a; let best = null, bd = 2.6; for (const c of WAR.caps) { if (!c.alive || c.captor) continue; const d = dist2(c.pos, a.pos); if (d < bd) { bd = d; best = c; } } return best; }
CTXH.free = () => { if (CLB.latch) return; CLB.latch = true; const c = captiveNear(); if (c) captiveFree(c, 'player'); };
// ---------- your own war party ----------
function ourRaidStart(i, members, lead) {
  for (const m of members) { m.loot = null; m.lootT = 0; m.rret = false; m.lt = null; m.gold = 0; m.spl = 0; m.arl = 0; }
  const c = HUNT.camps[i], v = ownCamp(); if (!c || !v || !members.length) return null;
  const p = { id: ++WAR.seq, from: 'own', to: i, men: members.slice(), phase: 'march', t: 0, n0: members.length, got: { food: 0, caps: [], gold: 0, horses: 0, cows: 0, spears: 0, arrows: 0 }, lost: 0, done: false, mine: true, lead: !!lead, won: false, clearT: 0, want: Object.assign({}, PLUNDER.want) };
  const ang = Math.atan2(v.x - c.x, v.z - c.z); p.sx = c.x + Math.sin(ang) * 34; p.sz = c.z + Math.cos(ang) * 34;
  for (const m of members) { if (m.towerB) towerLeave(m); m.job = { k: 'raid', p }; m.escort = false; m.hidden = false; m.state = 'idle'; m.foe = null; }
  WAR.parties.push(p);
  warLog(`${members.length} לוחמים יצאו לפשוט על ${campName(i)}`, '');
  UI.notify(lead ? `⚔️ ${members.length} לוחמים הולכים איתך אל ${campName(i)}. כשמגיעים קרוב, הם תוקפים. אחרי הניצחון לוקחים ${lootPlanWord(p)}` : `⚔️ ${members.length} לוחמים יצאו לפשוט על ${campName(i)} ולקחת ${lootPlanWord(p)}. אפשר לעקוב אחריהם במפה`, 'good');
  PROG.flags.ourRaid = 1; const rode = mountOurs(p); if (rode) UI.notify(`🐎 ${rode > 1 ? `${rode} מהלוחמים רוכבים` : 'אחד הלוחמים רוכב'} על סוסי השבט`, 'good'); saveGame();
  return p;
}
function raidJob(a, dt) {
  const p = a.job.p;
  if (!p || p.done || !WAR.parties.includes(p)) { a.job = null; return false; }
  const c = HUNT.camps[p.to], v = ownCamp(); if (!c || !v) { a.job = null; return false; }
  a.hidden = false; a.sleepAt = null;
  if (a.hp < a.maxHp * 0.3 && !a.rret) { a.rret = true; if (a.dCam < 40) say(a, 'אני פצוע, חוזר לכפר', 2); }
  if (a.rret || p.phase === 'home') {
    if (a.hoX == null) { a.hoX = rr(-1, 1); a.hoZ = rr(-1, 1); }
    const d = jobGo(a, v.x + a.hoX, v.z + a.hoZ, a.sp.run * 0.7, dt);
    if (d < 4) { lootHome(a); a.rret = false; a.job = null; const k = p.men.indexOf(a); if (k >= 0) p.men.splice(k, 1); }
    return true;
  }
  if (a.state === 'fight' && a.foe && a.foe.alive && dist2(a.foe.pos, a.pos) < 30) { tribeFight(a, a.foe, dt); return true; }
  if (p.phase === 'march') {
    if (p.lead && P.a && P.a.alive) { clanFollow(a, dt); return true; }
    const d = jobGo(a, p.sx + Math.sin(a.id) * 2.5, p.sz + Math.cos(a.id) * 2.5, a.sp.run * 0.62, dt);
    if (d < 1.5) { a.move(0, 0, 0, dt); a.pose = 'idle'; }
    return true;
  }
  if (p.phase === 'attack') {
    if ((a.think2 = (a.think2 || 0) - dt) <= 0) { a.think2 = 0.5; a.foe = raidFoeAt(a, c); a.state = a.foe ? 'fight' : 'idle'; }
    if (a.foe) { tribeFight(a, a.foe, dt); return true; }
    const d = jobGo(a, c.x + Math.sin(a.id * 2) * 4, c.z + Math.cos(a.id * 2) * 4, a.sp.run * 0.7, dt); if (d < 1.5) { a.move(0, 0, 0, dt); a.pose = 'idle'; }
    return true;
  }
  if (p.phase === 'loot') { lootJob(a, dt, p, c); return true; }
  return false;
}
function raidFoeAt(a, c) {
  let best = null, bd = 1e9;
  shQuery(a.pos.x, a.pos.z, 30, (b, d) => { if (!b.alive || !b.hunter || b.camp !== c || b.young || b.fleeing || b.brain === 'captive' || b.brain === 'villager' || b.duel) return; if (d < bd) { bd = d; best = b; } });
  // nobody close: go after whoever still holds the place (so a defender at the far side does not hold the raid up)
  if (!best) for (const h of defendersAt(c)) { const d = Math.hypot(h.pos.x - a.pos.x, h.pos.z - a.pos.z); if (d < bd) { bd = d; best = h; } }
  return best;
}
const defendersAt = c => c.hunters.filter(h => h.alive && !h.young && !h.fleeing && h.cls !== 'elder' && h.brain !== 'villager' && Math.hypot(h.pos.x - c.x, h.pos.z - c.z) < 36);
function ourRaidUpdate(p, dt) {
  const c = HUNT.camps[p.to]; p.t += dt;
  for (const m of p.men.slice()) if (!m.alive || m.gone) { p.lost++; p.men.splice(p.men.indexOf(m), 1); }
  if (!c) { p.done = true; return; }
  const fighting = p.men.filter(m => !m.rret);
  const seen = (P.a && Math.hypot(P.a.pos.x - c.x, P.a.pos.z - c.z) < 170) || p.men.some(m => (m.dCam || 999) < 150);
  if (p.phase === 'march') {
    const near = p.lead ? P.a && Math.hypot(P.a.pos.x - c.x, P.a.pos.z - c.z) < 48 : fighting.filter(m => Math.hypot(m.pos.x - p.sx, m.pos.z - p.sz) < 9).length >= Math.ceil(fighting.length * 0.6);
    if ((near && (!p.night || isNight() || p.lead)) || p.t > (p.night ? 1500 : 600)) { p.phase = 'attack'; p.t = 0; if (seen) { UI.notify(`⚔️ הלוחמים שלך תוקפים את ${campName(p.to)}!`, 'good'); AUD.play('growl', 0.6); } if (p.night && isNight()) { const sl = raid2Night(c); if (sl && seen) UI.notify(`🌙 ${sl === 1 ? 'אחד מהם ישן' : `${sl} מהם ישנים`}: הם מתעוררים לאט`, 'good'); } for (const h of c.hunters) if (h.alive && !h.young && h.brain !== 'villager') { const m = pick(fighting); if (m) { h.foe = m; h.state = 'defend'; } } }
    else if (!seen && !p.lead && (!p.night || isNight()) && p.t > Math.hypot(c.x - ownCamp().x, c.z - ownCamp().z) / 3 + 10) { ourRaidAbstract(p); }
    return;
  }
  if (p.phase === 'attack') {
    if (!seen && p.t > 8) { ourRaidAbstract(p); return; }
    if (!fighting.length || p.lost >= Math.ceil(p.n0 / 2) || fighting.length <= Math.floor(p.n0 * 0.3)) { raidHome(p, false); return; }
    const def = defendersAt(c).length;
    p.clearT = def ? 0 : p.clearT + dt;
    if (p.clearT > 5) { p.phase = 'loot'; p.t = 0; p.won = true; lootPlan(p); raidVictory(p); }
    if (p.t > 150) raidHome(p, false);
    return;
  }
  if (p.phase === 'loot' && (p.t > 25 || lootReady(p))) raidHome(p, true);
  if (p.phase === 'home' && !p.men.length) { p.done = true; p.doneT = G.t; }
}
function raidVictory(p) {
  const i = p.to, r = relGet('own', i);
  r.sc.own = (r.sc.own || 0) + 3; WAR.men[i] = Math.max(0, WAR.men[i] - 2);
  WAR.terr[i] = Math.max(60, (WAR.terr[i] || 110) - 12); WAR.ownTerr = Math.min(90, (WAR.ownTerr || 0) + 10);
  const freed = WAR.caps.filter(w => w.alive && w.capCamp === i && !w.captor);
  for (const w of freed) { captiveFree(w, 'raid'); w.escort = false; p.got.caps.push(w.name); }
  UI.big('ניצחון!', `הלוחמים שלך כבשו את ${campKindDef(HUNT.camps[i])} של ${campName(i)}${freed.length ? `. ${freed.map(w => w.name).join(' ו')} ${freed.length > 1 ? 'משוחררים' : 'משוחרר' + (freed[0].sex === 'f' ? 'ת' : '')}` : ''}. לוקחים ${lootPlanWord(p)}, וחוזרים הביתה`);
  AUD.play('cheer', 0.7); PROG.flags.raidVictory = 1; polEvent(8, `ניצחון על ${campName(i)}`);
  (WAR.pend || (WAR.pend = [])).push({ i, lord: 'own', at: G.t + 3.5 });   // a moment later they give in
  warLog(`הלוחמים שלך ניצחו את ${campName(i)}${freed.length ? ` ושחררו את ${freed.map(w => w.name).join(' ו')}` : ''}`, 'good');
}
function raidHome(p, won) {
  if (won && p.phase === 'loot') lootFinish(p);   // what was not carried yet is shared out (also when peace ends the raid early)
  p.phase = 'home';
  for (const m of p.men) m.rret = true;
  const i = p.to;
  if (!won) { polEvent(-6, `הפשיטה על ${campName(i)} נכשלה`); relGet('own', i).sc[i] = (relGet('own', i).sc[i] || 0) + 2; warLog(`הפשיטה על ${campName(i)} נכשלה. הלוחמים חוזרים`, 'bad'); UI.notify(`הפשיטה על ${campName(i)} נכשלה. הלוחמים חוזרים הביתה`, 'bad'); }
  else { const f = p.got.food, L = lootWords(p); if (f && WAR.stolen[i]) WAR.stolen[i].back += f; if (p.got.caps.length) L.push(p.got.caps.join(' ו')); UI.notify(`⚔️ הלוחמים חוזרים מ${campName(i)}${L.length ? ` עם ${L.join(', ')}` : ''}`, 'good'); if (L.length) warLog(`שלל מ${campName(i)}: ${L.join(', ')}`, 'good'); }
  saveGame();
}
// out of sight, our raid is decided by numbers too
function ourRaidAbstract(p) {
  const i = p.to, c = HUNT.camps[i]; if (!c) { p.done = true; return; }
  const A = p.men.reduce((s, m) => s + fightPow(m) * (m.hp / m.maxHp), 0) * (BLD.list.some(b => b.done && b.t === 'armory') ? 1.15 : 1) + p.men.reduce((s, m) => s + (m.pets || []).filter(q => q.alive).length * 0.5, 0);
  const D = npcPower(i) * rr(0.75, 1.25) * 0.85 * (p.night && isNight() ? 0.72 : 1), win = A * rr(0.8, 1.2) > D;
  for (const m of p.men) { if (rng() < (win ? 0.08 : 0.22)) { m.hp = 0; kill(m, null); p.lost++; } else if (rng() < 0.5) m.hp = Math.max(m.maxHp * 0.3, m.hp * rr(0.4, 0.8)); }
  p.men = p.men.filter(m => m.alive);
  if (win) {
    for (const h of c.hunters.slice()) if (h.alive && !h.young && h.cls !== 'chief' && h.brain !== 'villager' && (h.dCam || 999) > 120 && rng() < 0.3) { const k = c.hunters.indexOf(h); c.hunters.splice(k, 1); h.remove(); }
    lootAbstract(p, A);
    p.won = true; raidVictory(p); raidHome(p, true);
  } else raidHome(p, false);
}
// ---------- champions: one fighter against one, for food, land or a person ----------
const STAKE_N = { food: 'עשר מנות אוכל', land: 'שטחי הציד שבין הכפרים', cap: 'השבוי', gold: 'עשרים זהב' };
function chalStart(i, stake, mine, capName) {
  const c = HUNT.camps[i], a = P.a; if (!c || !a || CHAL.ch) return;
  let x = 0, z = 0;
  for (let t = 0; t < 16; t++) { const ang = a.yaw + rr(-0.8, 0.8), d = rr(9, 13); x = a.pos.x + Math.sin(ang) * d; z = a.pos.z + Math.cos(ang) * d; if (waterDepth(x, z) === 0 && getNY(x, z) > 0.8) break; }
  const h = new Animal('hunter', x, z, { sex: 'm', tpl: ensureTribal('warrior', tribeKeyOf(c), 'm', true), scale: 1.06 }); h.ground(1, true);
  Object.assign(h, { hunter: true, camp: c, name: npcName(c, 'm'), cls: 'warrior', pets: [], duel: true, elite: false, champ: true, socialExtra: true, state: 'defend', foe: a, spearCD: 2, netCD: 999, vd: 260 });
  h.maxHp *= 1.6; h.hp = h.maxHp; h.home.set(c.x, 0, c.z); civLook(h, c);
  setProp(h, 'sword', true, 'Rha'); h.brain = 'champion';
  CHAL.ch = h; CHAL.stake = stake; CHAL.i = i; CHAL.mine = !!mine; CHAL.t = 0; CHAL.cap = capName || ''; CHAL.at = { x: (x + a.pos.x) / 2, z: (z + a.pos.z) / 2 };
  if (!CHAL.ring) { CHAL.ring = new THREE.Mesh(new THREE.RingGeometry(13.6, 14, 64), new THREE.MeshBasicMaterial({ color: '#e8b04b', transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide })); CHAL.ring.rotation.x = -Math.PI / 2; }
  CHAL.ring.position.set(CHAL.at.x, getH(CHAL.at.x, CHAL.at.z) + 0.12, CHAL.at.z); scene.add(CHAL.ring);
  if (P.weapon !== 'sword' && P.hasSword) wpnSet('sword', true);
  UI.big('קרב אלופים!', `${h.name}, האלוף של ${c.tribe}, נלחם בך על ${stake === 'cap' ? capName : STAKE_N[stake]}. מי שנחלש ראשון נכנע. לא לצאת מהמעגל`);
  AUD.play('growl', 0.7); PROG.flags.champion = 1;
}
function chalUpdate(dt) {
  const h = CHAL.ch; if (!h) return;
  const a = P.a; CHAL.t += dt;
  if (CHAL.ring) CHAL.ring.material.opacity = 0.4 + Math.sin(G.t * 4) * 0.15;
  if (!h.alive || !a || !a.alive || G.mode !== 'play') { chalEnd(null); return; }
  if (h.state !== 'defend' || h.foe !== a) { h.state = 'defend'; h.foe = a; }
  if (h.hp < h.maxHp * 0.3) { chalEnd(true); return; }
  if (a.hp < a.maxHp * 0.25) { chalEnd(false); return; }
  if (Math.hypot(a.pos.x - CHAL.at.x, a.pos.z - CHAL.at.z) > 26) { UI.notify('יצאת מהמעגל. זה נחשב כניעה', 'bad'); chalEnd(false); }
}
function chalEnd(win) {
  const h = CHAL.ch, i = CHAL.i, stake = CHAL.stake; CHAL.ch = null; if (CHAL.ring) scene.remove(CHAL.ring);
  if (h) { h.duel = false; h.state = 'idle'; h.foe = null; h.brain = 'leaver'; h.leaveTo = { x: h.camp.x, z: h.camp.z }; if (h.alive) h.hp = Math.max(h.hp, h.maxHp * 0.3); }
  if (win === null) return;
  chalResult(i, stake, win, h ? h.name : 'האלוף', CHAL.cap);
}
function chalResult(i, stake, win, champ, capName) {
  const r = relGet('own', i), name = campName(i);
  if (win) {
    P.renown = (P.renown || 0) + 1; r.sc.own = (r.sc.own || 0) + 1; PROG.flags.champWin = 1;
    let got = '';
    if (stake === 'food') { const n = Math.min(10, WAR.food[i] | 0); WAR.food[i] -= n; boxStore().cooked += n; got = `${n} מנות אוכל למחסן`; }
    else if (stake === 'land') { WAR.terr[i] = Math.max(60, (WAR.terr[i] || 110) - 15); WAR.ownTerr = Math.min(90, (WAR.ownTerr || 0) + 15); got = 'שטחי הציד עברו אליכם'; }
    else if (stake === 'cap') { const w = WAR.caps.find(q => q.name === capName && q.capCamp === i); if (w) { captiveFree(w, 'raid'); got = `${capName} חוזר${w.sex === 'f' ? 'ת' : ''} הביתה`; } }
    else if (stake === 'gold') { const n = Math.min(20, campGold(i)); TRADE.gold[i] = campGold(i) - n; goldAdd(n); got = `${n} זהב למחסן`; }
    addTrust(i, POL.trait[i] === 'proud' ? 14 : 6); polEvent(3, 'ניצחון בקרב אלופים');
    UI.big('ניצחת!', `${champ} נכנע. ${got}`); AUD.play('cheer', 0.7);
    warLog(`ניצחת את האלוף של ${name}: ${got}`, 'good');
  } else {
    let lost = '';
    if (stake === 'food') { const n = takeFood(10); WAR.food[i] += n; WAR.stolen[i].food += n; lost = `${name} לקחו ${n} מנות אוכל`; }
    else if (stake === 'land') { WAR.terr[i] = Math.min(170, (WAR.terr[i] || 110) + 15); WAR.ownTerr = Math.max(-40, (WAR.ownTerr || 0) - 15); lost = 'שטחי הציד עברו אליהם'; }
    else if (stake === 'gold') { const n = Math.min(20, goldHave()); goldPay(n); TRADE.gold[i] = campGold(i) + n; lost = `${name} קיבלו ${n} זהב`; }
    else lost = 'השבוי נשאר אצלם';
    r.sc[i] = (r.sc[i] || 0) + 1;
    UI.big('הפסדת בקרב', `${lost}. אפשר לנסות שוב, או לקחת בחזרה במלחמה`);
    warLog(`הפסדת בקרב אלופים מול ${name}: ${lost}`, 'bad');
  }
  saveGame();
}
// a warrior of yours fights the champion instead of you
function chalByWarrior(i, stake, m) {
  const k = (m.wpn === 'sword' ? 0.15 : 0) + (BLD.list.some(b => b.done && b.t === 'armory') ? 0.05 : 0) + (m.hp / m.maxHp - 0.6) * 0.3;
  const win = rng() < 0.45 + k;
  if (!win) { if (rng() < 0.15) { m.hp = 0; kill(m, null); } else m.hp = Math.max(1, m.maxHp * 0.3); }
  else m.hp = Math.max(1, m.hp * 0.7);
  UI.notify(`${m.name} ${heb(m, 'נלחם', 'נלחמה')} באלוף של ${campName(i)} ו${win ? heb(m, 'ניצח', 'ניצחה') : heb(m, 'הפסיד', 'הפסידה')}${!m.alive ? `. ${heb(m, 'הוא נפל', 'היא נפלה')} בקרב` : ''}`, win ? 'good' : 'bad');
  chalResult(i, stake, win, 'האלוף', '');
}
// ---------- declaring war, making peace, gifts and demands ----------
function declareWar(i, why) {
  const r = relGet('own', i); if (r.st === 'war') return;
  if (polAllied('own', i)) { polUnally('own', i, why ? true : 'בגידה'); if (!why) { for (const j of npcIdx()) if (j !== i && VX.known.has(j)) addTrust(j, -8); polEvent(-8, `בגידה בבני הברית, ${campName(i)}`); } }
  if (VX.mem === i) leaveTribe(true);
  r.st = 'war'; r.since = G.day; r.days = 0; r.sc = {}; r.raidT = rr(60, 140);
  addTrust(i, -Math.max(0, campTrust(i) + 60));
  for (const j of npcIdx()) if (j !== i && npcTrust(i, j) > 30) addTrust(j, -6);
  warLog(why || `הכרזת מלחמה על ${campName(i)}`, 'bad'); PROG.flags.declared = 1;
  UI.big('מלחמה!', `${campName(i)} ${why ? 'הכריזו מלחמה על השבט שלך' : 'הם עכשיו אויבים'}. הלוחמים שלהם יתקפו את הכפר ואת מי שיצא ממנו. אפשר לצאת לפשיטה או להציע שלום`);
  AUD.play('growl', 0.8); polEvent(-2, `מלחמה עם ${campName(i)}`); polWarStarted(why ? i : 'own', why ? 'own' : i); saveGame();
}
function makePeace(i, terms) {
  const r = relGet('own', i); r.st = 'truce'; r.truce = G.day + 3; r.days = 0; r.raidT = null;
  addTrust(i, Math.max(0, -campTrust(i) - 15) + 10);
  for (const p of WAR.parties) if (!p.done && ((p.from === i && p.to === 'own') || (p.mine && p.to === i))) { if (p.mine) raidHome(p, p.won); else p.phase = 'retreat'; }
  const back = [];
  if (terms && terms.back) {
    for (const w of WAR.caps.filter(q => q.capCamp === i && !q.captor)) { captiveFree(w, 'peace'); back.push(w.name); }
    const f = Math.min(WAR.food[i] | 0, Math.max(0, WAR.stolen[i].food - WAR.stolen[i].back)); if (f > 0) { WAR.food[i] -= f; boxStore().cooked += f; WAR.stolen[i].back += f; back.push(`${f} מנות אוכל`); }
  }
  PROG.flags.peace = 1; polEvent(4, `שלום עם ${campName(i)}`);
  warLog(`שלום עם ${campName(i)}${back.length ? `: החזירו את ${back.join(' ו')}` : ''}`, 'good');
  UI.big('שלום', `${campName(i)} ${back.length ? `החזירו את ${back.join(' ו')}. ` : ''}שלושה ימים של הפסקת אש, והלוחמים חוזרים הביתה`); AUD.play('chime');
  saveGame();
}
function peaceChance(i, gift, back) {
  const r = relGet('own', i), my = r.sc.own || 0, th = r.sc[i] || 0, adv = (my - th) * 0.07 + (ownPower(true) - npcPower(i)) * 0.02;
  return clamp(0.22 + polTr(i).peace + adv + r.days * 0.06 + (gift ? 0.3 : 0) - (back ? 0.25 - Math.max(0, my - th) * 0.06 : 0) + (campTrust(i) + 100) / 600, 0.05, 0.95);
}
function giftTribe(i, n) {
  const have = foodHave() + (ownCamp() ? (boxStore().cooked + boxStore().meat + boxStore().fish) : 0); if (have < n) return false;
  let left = n; const inv = Math.min(foodHave(), left); payFood(inv); left -= inv; if (left > 0) takeFood(left);
  WAR.food[i] = (WAR.food[i] || 0) + n; addTrust(i, (3 + n * 1.6) * polTr(i).gift); relGet('own', i).giftDay = G.day;
  warLog(`שלחת מתנה ל${campName(i)}: ${n} מנות אוכל`, 'good'); return true;
}
// ---------- the tribes speak to you: threats, challenges, offers of peace ----------
function warDiplomacy() {
  const v = ownCamp(); if (!v || !P.a || !P.a.alive || P.sleeping || CHAL.ch || BLD.mode || AIMX.on || WAR.parties.some(p => !p.done && !p.mine && p.to === 'own') || WAR.dipAny === G.day) return;
  if (G.time < 7 || G.time > 18.5) return;
  for (const i of npcIdx()) {
    if (!VX.known.has(i) && terrOverlap(i) <= 0) continue;
    if (isVassal(i) || polAllied('own', i)) continue;
    const r = relGet('own', i), tr = campTrust(i), today = r.dipDay === G.day; if (today) continue;
    if (r.st === 'war') {
      const my = r.sc.own || 0, th = r.sc[i] || 0;
      if ((my - th >= 3 || (r.days >= 3 && npcPower(i) < ownPower(true))) && rng() < 0.5) { r.dipDay = WAR.dipAny = G.day; offerPeaceCard(i, my - th >= 5); return; }
      continue;
    }
    if (r.st === 'truce' || r.truce > G.day) continue;
    if (tr < polTr(i).warAt) { r.dipDay = WAR.dipAny = G.day; declareWar(i, `${campName(i)} הכריזו מלחמה על השבט שלך`); return; }
    if (tr < polTr(i).ultAt && rng() < 0.4) { r.dipDay = WAR.dipAny = G.day; ultimatumCard(i); return; }
    if ((terrOverlap(i) > 25 || tr < -20) && rng() < 0.04 && G.day >= 2) { r.dipDay = WAR.dipAny = G.day; challengeCard(i, pick(['food', 'land', 'land', 'gold'])); return; }
  }
}
const whyAngry = i => terrOverlap(i) > 0 ? 'הכפר שלך נכנס לשטחי הציד שלהם' : TREES.cut > 60 ? 'השבט שלך כורת את היער' : 'הם לא סומכים על השבט שלך';

function whyAttack(src, t) {
  if (src.camp && src.camp.bandit) return 'שודדי דרכים: הזהב או החיים';
  if (src.raider) return `פשיטה של ${src.camp ? src.camp.tribe : 'שבט אויב'}`;
  if (src === CHAL.ch) return 'קרב אלופים';
  if (src.hunter && src.camp && atWar(campIndex(src.camp))) return 'אתם במלחמה';
  if (src.hunter) {
    if (src.duel) return 'דו-קרב על אישה';
    if (HUNT.angry > 0) return HUNT.angryWhy || 'הציידים כועסים עליך';
    if (src.lastHit && playerSide(src.lastHit)) return src.lastHit.isPlayer ? 'כי פגעת בו' : `כי ${src.lastHit.name || 'מישהו מהמשפחה שלך'} פגע בו`;
    return 'כי ראה בך איום';
  }
  if (src.legend) return 'אגדה ששומרת על השטח שלה';
  if (src.isRival || src.raider) return 'זכר מתחרה';
  if (src.invader) return 'כי השבט שלך פולש לטריטוריה שלו';
  if ((src.provokedT || 0) > G.t) return 'כי תקפו אותו';
  if (src.state === 'hunt' && src.target === t) return 'כי הוא צד אותך';
  if (typeof TERRR !== 'undefined' && TERRR[src.spId]) return 'כי נכנסת לטריטוריה שלו';
  return 'כי הרגיש מאוים';
}
function attackNote(t, src) {
  if (!src || src === t || !src.sp || playerSide(src) || G.mode !== 'play') return;
  if (src.raider || src === CHAL.ch || src.brain === 'captive' || (src.hunter && src.camp && atWar(campIndex(src.camp)) && !t.isPlayer)) return;
  const k = src.id + ':' + (t.isPlayer ? 'p' : t.id); if (G.t - (WHY.last.get(k) || -99) < 12) return; WHY.last.set(k, G.t);
  if (t.isPlayer) UI.notify(`${whoIs(src)} תקף אותך: ${whyAttack(src, t)}`, 'bad');
  else { UI.notify(`${whoIs(src)} תוקף את ${t.name || t.sp.he}! ${whyAttack(src, t)}`, 'bad'); P.pings.push({ x: t.pos.x, z: t.pos.z, t: 8 }); }
}

BRAIN.champion = function (h, dt) {
  h.stT -= dt; h.spearCD -= dt;
  const f = h.foe; if (!f || !f.alive) { h.move(0, 0, 0, dt); h.pose = 'idle'; return; }
  const dx = f.pos.x - h.pos.x, dz = f.pos.z - h.pos.z, d = Math.hypot(dx, dz) || 0.01;
  const face = () => { h.yaw += angDiff(h.yaw, Math.atan2(dx, dz)) * Math.min(1, dt * 8); };
  if (h.windup > 0) { h.windup -= dt; h.move(0, 0, 0, dt); face(); h.pose = 'aim'; if (h.windup <= 0) hunterLaunch(h); return; }
  if (h.swing > 0) {
    h.swing -= dt; h.move(0, 0, 0, dt); face(); h.pose = 'idle';
    if (h.swing <= 0) { h.anim.atk = 0.45; h.atkCD = rr(0.8, 1.2); if (d < 2.6 + f.rad && !(f.isPlayer && P.dodgeT > 0)) { hurt(f, 15 * rr(0.85, 1.15), h); if (h.dCam < 40) AUD.at('bite', h.pos, 0.7); } else if (h.dCam < 40) AUD.at('swipe', h.pos, 0.6); }
    return;
  }
  if (d > 10 && h.spearCD <= 0) { h.aimBow = false; hunterThrow(h, f, 'spear'); h.spearCD = rr(4, 6); return; }
  h.circ = h.circ || (h.id % 2 ? 1 : -1); if (rng() < dt * 0.5) h.circ = -h.circ;
  if (d > 2.1 + f.rad) { const k = d < 5 ? 0.45 : 0.15; h.move(dx / d - dz / d * h.circ * k, dz / d + dx / d * h.circ * k, (h.sp.run || 5) * (d > 6 ? 0.8 : 0.5), dt); h.pose = 'move'; return; }
  if (h.atkCD <= 0) { h.swing = 0.38; if (f.isPlayer) P.warnFrom = h; return; }
  h.move(-dz / d * h.circ, dx / d * h.circ, (h.sp.walk || 1.5) * 1.3, dt); face(); h.pose = 'move';
};
// ================= THE WAR ROOM: every tribe, its mood and its strength; raids, peace, challenges, and the story of the wars =================
const WUI = { tab: 'tribes', btn: null, pill: null, key: '' };
const relWord = (i, tr) => atWar(i) ? 'במלחמה' : tr >= 40 ? 'ידידים' : tr >= 15 ? 'מכירים' : tr >= -15 ? 'ניטרליים' : tr >= -45 ? 'מתוחים' : 'עוינים';
const relCls = (i, tr) => atWar(i) ? 'wbad' : tr >= 15 ? 'wgood' : tr >= -15 ? '' : 'wwarn';
const isChief = () => !!ownCamp();
const pctTxt = k => `${Math.round(k * 100)}%`;
function warSave() {
  const fix = o => { const r = {}; for (const k in o) r[k] = Math.round(o[k] * 10) / 10; return r; };
  return {
    rel: WAR.rel, tr: fix(WAR.tr), men: fix(WAR.men), food: fix(WAR.food), terr: WAR.terr, stolen: WAR.stolen, log: WAR.log.slice(0, 30), ot: WAR.ownTerr || 0, day: WAR.dayK, vas: WAR.vas, gone: WAR.gone,
    caps: WAR.caps.filter(c => c.alive && !c.gone).map(c => ({ n: c.name, s: c.sex, c: c.cls || 'gatherer', u: c.uid || 0, i: c.captor ? c.captor.raider ? c.captor.raider.from : c.capCamp : c.capCamp, sp: c.spouseU || (c.spouse && c.spouse.uid) || 0 }))
  };
}
function warReset() {
  for (const p of WAR.parties) for (const h of p.men || []) if (!p.mine && h.alive && !h.gone) h.remove();
  for (const c of WAR.caps) if (!c.gone) c.remove();
  for (const L of WAR.loot) scene.remove(L.mesh);
  if (CHAL.ch) { if (!CHAL.ch.gone) CHAL.ch.remove(); CHAL.ch = null; } if (CHAL.ring) scene.remove(CHAL.ring);
  for (const c of HUNT.camps) if (c.banner) { scene.remove(c.banner); c.banner = null; }
  raid2Reset();
  Object.assign(WAR, { rel: {}, tr: {}, men: {}, food: {}, terr: {}, stolen: {}, parties: [], log: [], caps: [], loot: [], t: 0, dayK: -1, dipT: 45, ownTerr: 0, dipAny: -1, vas: {}, gone: {} });
  document.body.style.removeProperty('--feedL'); document.body.style.removeProperty('--feedW');
}
function warLoad(d) {
  warReset(); if (!d) { warEnsure(); return; }
  Object.assign(WAR, { rel: d.rel || {}, tr: d.tr || {}, men: d.men || {}, food: d.food || {}, terr: d.terr || {}, stolen: d.stolen || {}, log: d.log || [], ownTerr: d.ot || 0, dayK: d.day ?? -1, vas: d.vas || {}, gone: d.gone || {} });
  for (const k in WAR.gone) { const c = HUNT.camps[+k]; if (c && !c.own && !c.gone) campGone(c); }
  for (const k in WAR.vas) { const c = HUNT.camps[+k]; if (c && !c.gone) vassalBanner(c); else delete WAR.vas[k]; }
  for (const k in WAR.rel) WAR.rel[k].raidT = null;
  for (const q of d.caps || []) {
    const c = HUNT.camps[q.i]; if (!c) continue;
    const a = new Animal('hunter', c.x + rr(-4, 4), c.z + rr(-4, 4), { sex: q.s, tpl: ensureTribal(WORK.includes(q.c) ? q.c : 'gatherer', 'own', q.s) }); a.ground(1, true);
    Object.assign(a, { name: q.n, cls: WORK.includes(q.c) ? q.c : 'gatherer', uid: q.u, socialExtra: true, brain: 'captive', capCamp: q.i, spouseU: q.sp, pets: [] });
    WAR.caps.push(a);
  }
  warEnsure();
}
// ---------- the war room ----------
function openWar(tab, focus) {
  if (G.mode !== 'play' || !P.human || !P.a) return;
  warEnsure(); if (tab) WUI.tab = tab; if (focus != null) WUI.focus = focus;
  const T = [['tribes', 'שבטים'], ['politics', 'פוליטיקה'], ['army', 'הכוח'], ['log', 'קורות']];
  const body = WUI.tab === 'politics' ? polHtml() : WUI.tab === 'army' ? armyHtml() : WUI.tab === 'log' ? logHtml() : tribesWarHtml();
  const el = uiCard('warov', `<div class="itabs">${T.map(([k, n]) => `<button data-tab="${k}" class="${WUI.tab === k ? 'on' : ''}">${n}</button>`).join('')}<button class="ix" data-a="close" aria-label="סגירה">✕</button></div><div class="ibody">${body}</div>`);
  el.querySelector('.card').classList.add('vxcard', 'warcard');
  if (WUI.focus != null) { const f = el.querySelector(`[data-tribe="${WUI.focus}"]`); if (f) setTimeout(() => f.scrollIntoView({ block: 'center' }), 30); WUI.focus = null; }
  el.onclick = e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    if (b.dataset.tab) { openWar(b.dataset.tab); return; }
    const A = b.dataset.a, i = b.dataset.i != null ? +b.dataset.i : -1;
    if (A === 'close') { closeCard('warov'); return; }
    if (A === 'gift') { if (giftTribe(i, 5)) { UI.notify(`${campName(i)} קיבלו את המתנה. היחסים השתפרו`, 'good'); AUD.play('chime', 0.4); } else UI.notify('אין מספיק אוכל למתנה (צריך 5)', 'bad'); openWar(); return; }
    if (A === 'war') { declareConfirm(i); return; }
    if (A === 'free') { freeVassal(i); openWar(); return; }
    if (A === 'surr') { demandSurrender(i); openWar(); return; }
    if (A === 'raid') { raidPlanner(i); return; }
    if (A === 'peace') { peaceCard(i); return; }
    if (A === 'chal') { challengePick(i); return; }
    if (A === 'tax') { demandTribute(i); return; }
    if (A === 'map') { const c = HUNT.camps[i]; closeCard('warov'); if (c) setWay(c.x, c.z, true, c.tribe); return; }
    if (A === 'eagle') { if (takeEagle()) { closeCard('warov'); } else openWar(); return; }
    if (A === 'raidPick') { raidTargetPick(); return; }
    if (A === 'mapAll') { closeCard('warov'); UI.open('map'); return; }
    if (A === 'ally') { polProposeAlly(i); openWar(); return; }
    if (A === 'unally') { polBreakAlly(i); openWar(); return; }
    if (A === 'trade') { polTradeCard(i); return; }
    if (A === 'market') { tradeCard(i, () => { closeCard('campov'); openWar('tribes', i); }); closeCard('warov'); return; }
    if (A === 'untrade') { delete POL.trade[i]; addTrust(i, -6); UI.notify(`✂️ הסחר עם ${campName(i)} בוטל`, 'bad'); saveGame(); openWar(); return; }
    if (A === 'wed') { polWedCard(i, false); return; }
  };
}
function tribeCardHtml(i) {
  const c = HUNT.camps[i], tr = Math.round(campTrust(i)), r = relGet('own', i), war = atWar(i), own = !!ownCamp(), st = WAR.stolen[i] || { food: 0, back: 0 };
  const caps = WAR.caps.filter(w => w.alive && (w.capCamp === i || (w.captor && w.captor.raider && w.captor.raider.from === i)));
  const vas = vasOf(i), mineV = !!vas && vas.lord === 'own';
  const chip = polChip(i) + (mineV ? `<span class="wchip wgood">🏳️ שבט חסות שלך · ${Math.round(Math.min(100, vas.loy))}% נאמנות</span>` : vas ? `<span class="wchip">🏳️ נתינים של ${campName(vas.lord)}</span>` : war ? `<span class="wchip wbad">⚔️ מלחמה · יום ${r.days + 1}</span>` : r.st === 'truce' || r.truce > G.day ? `<span class="wchip wgood">🕊️ הפסקת אש · עוד ${Math.max(1, r.truce - G.day)} ימים</span>` : `<span class="wchip">🕊️ שלום</span>`);
  const ov = terrOverlap(i), myP = ownPower(true), thP = npcPower(i), ch = chiefOfCamp(c);
  const bar = `<div class="wrel"><i><b style="${tr >= 0 ? `left:50%;width:${tr / 2}%` : `right:50%;width:${-tr / 2}%`};background:${tr >= 15 ? '#6dbe6a' : tr >= -15 ? '#c9b07a' : '#d8473a'}"></b></i><span class="${relCls(i, tr)}">${relWord(i, tr)} (${tr > 0 ? '+' : ''}${tr})</span></div>`;
  const facts = `<div class="wfacts"><span>⚔️ כוח ${thP.toFixed(0)}${own ? ` <small>(שלנו ${myP.toFixed(0)})</small>` : ''}</span><span>🍖 ${Math.round(WAR.food[i] || 0)} אוכל</span><span>🗺️ שטח ${Math.round(WAR.terr[i] || 110)} מ׳</span>${polFacts(i)}<span>🏘️ ${campKindName(c)} · ${c.hunters.filter(h => h.alive).length} אנשים</span><span>📍 ${whereIs({ pos: { x: c.x, z: c.z } })}</span></div>`;
  const warns = [];
  if (mineV) warns.push(`כל בוקר הם שולחים מס של אוכל למחסן, ולוחמיהם נלחמים באויבים שלך. כשהנאמנות תגיע ל־100% הם יעברו לגור בכפר שלך`);
  else if (vas) warns.push(`הם הפסידו במלחמה ל${campName(vas.lord)}: משלמים להם מס ונלחמים לצידם, ועם הזמן יהפכו לחלק מהם`);
  if (own && ov > 0) warns.push(`השטח של הכפר שלך נכנס לשטחי הציד שלהם (${Math.round(ov)} מ׳). זה מרגיז אותם`);
  if (st.food > st.back) warns.push(`לקחו מכם ${Math.round(st.food)} מנות אוכל${st.back ? ` (החזרתם ${Math.round(st.back)})` : ''}`);
  if (caps.length) warns.push(`שבויים אצלם: ${caps.map(w => w.name).join(', ')}. אפשר לשחרר בפשיטה, בקרב אלופים, בהסכם שלום, או להתגנב למחנה שלהם`);
  for (const j of npcIdx()) if (j !== i && atWarK(i, j)) warns.push(`נלחמים עכשיו ב${campName(j)}`);
  const acts = [];
  if (own && mineV) acts.push(`<button class="btn" data-a="gift" data-i="${i}"${r.giftDay === G.day ? ' disabled' : ''}>🎁 מתנה: 5 מנות אוכל</button>`, `<button class="btn" data-a="free" data-i="${i}">🔓 לשחרר אותם</button>`);
  else if (own) {
    if (war) { acts.push(`<button class="btn pri" data-a="raid" data-i="${i}">🏹 לצאת לפשיטה</button>`, `<button class="btn" data-a="surr" data-i="${i}"${r.surDay === G.day ? ' disabled' : ''}>🏳️ ${r.surDay === G.day ? 'דרשתם כניעה היום' : `לדרוש שייכנעו (${pctTxt(surrenderChance(i))})`}</button>`, `<button class="btn" data-a="peace" data-i="${i}"${r.peaceDay === G.day ? ' disabled' : ''}>🕊️ ${r.peaceDay === G.day ? 'הציעו שלום היום' : 'להציע שלום'}</button>`); }
    else { acts.push(`<button class="btn" data-a="gift" data-i="${i}"${r.giftDay === G.day ? ' disabled' : ''}>🎁 ${r.giftDay === G.day ? 'כבר נשלחה מתנה היום' : 'מתנה: 5 מנות אוכל'}</button>`); if (myP > thP * 1.4 && r.taxDay !== G.day) acts.push(`<button class="btn" data-a="tax" data-i="${i}">📜 לדרוש מס</button>`); }
    acts.push(`<button class="btn" data-a="chal" data-i="${i}"${r.chalDay === G.day || CHAL.ch ? ' disabled' : ''}>🤺 ${r.chalDay === G.day ? 'כבר אותגרו היום' : 'קרב אלופים'}</button>`);
    if (!war) acts.push(`<button class="btn" data-a="market" data-i="${i}">🪙 לקנות ולמכור</button>`);
    acts.push(...polActs(i));
    if (!war && !vas) acts.push(`<button class="btn wdanger" data-a="raid" data-i="${i}">🏹 פשיטה</button>`, `<button class="btn wdanger" data-a="war" data-i="${i}">🔥 להכריז מלחמה</button>`);
  } else { acts.push(`<button class="btn" data-a="gift" data-i="${i}"${r.giftDay === G.day ? ' disabled' : ''}>🎁 מתנה: 5 מנות אוכל</button>`); if (!war) acts.push(`<button class="btn" data-a="market" data-i="${i}">🪙 לקנות ולמכור</button>`); }
  acts.push(`<button class="btn" data-a="map" data-i="${i}">📍 ללכת לשם</button>`);
  return `<div class="wtribe${war ? ' atwar' : ''}" data-tribe="${i}"><div class="wth"><i style="background:${TRIBEC[tribeKeyOf(c)]}"></i><b>${c.tribe}</b>${chip}</div>${bar}${facts}${warns.map(w => `<p class="wwarnp">${w}</p>`).join('')}<div class="btns wbtns">${acts.join('')}</div></div>`;
}
function tribesWarHtml() {
  const own = ownCamp(), known = npcIdx().filter(i => VX.known.has(i)), wars = known.filter(atWar);
  const inc = WAR.parties.filter(p => !p.done && !p.mine && p.to === ourKey()), out = WAR.parties.filter(p => !p.done && p.mine);
  const vsl = npcIdx().filter(i => isVassal(i, 'own'));
  let h = `<div class="vxhero"><b>מלחמה ושלום</b><span>${wars.length ? `במלחמה עם ${wars.map(campName).join(' ו')}` : known.length ? 'שלום עם כל השבטים שאתם מכירים' : 'עוד לא פגשתם שבטים אחרים'}${vsl.length ? ` · שבטי חסות: ${vsl.map(campName).join(', ')}` : ''}</span></div>`;
  for (const p of inc) h += `<p class="vxalert">⚔️ פשיטה עכשיו: ${p.men.length} לוחמים של ${campName(p.from)} ${p.phase === 'gather' ? 'מתאספים ליד הכפר' : p.phase === 'retreat' ? 'נסוגים' : 'תוקפים את הכפר'}${p.got.food ? `. לקחו ${p.got.food} מנות אוכל` : ''}${p.got.caps.length ? ` ואת ${p.got.caps.join(', ')}` : ''}</p>`;
  for (const p of out) h += `<p class="wok">🏹 הלוחמים שלך ${{ march: 'בדרך אל', attack: 'נלחמים ב', loot: 'אוספים שלל אצל', home: 'חוזרים מ' }[p.phase] || 'אצל'}${campName(p.to)} · ${p.men.length} לוחמים${p.got.food ? ` · ${p.got.food} מנות שלל` : ''}</p>`;
  if (!own) h += `<p class="idim">${VX.mem >= 0 ? `${you('אתה', 'את')} ${rankName(VX.rank)} ב${campName(VX.mem)}. האויבים של השבט שלך הם גם האויבים שלך. ` : ''}רק ראש שבט מכריז מלחמה, יוצא לפשיטה ועושה שלום. כשתקים שבט משלך, תחליט בעצמך.</p>`;
  else h += `<p class="idim">כל שבט רוצה אוכל, שטחי ציד ואנשים. כשהכפר שלך גדל לתוך השטח שלהם, הם כועסים. אפשר לשלוח מתנות, לדרוש מס, לאתגר לקרב אלופים, או להכריז מלחמה.</p>`;
  h += known.length ? known.map(tribeCardHtml).join('') : '<p class="idim">עשן מעל העצים מסמן שבט. כשתמצא שבטים, הם יופיעו כאן.</p>';
  const npcW = []; for (const i of npcIdx()) for (const j of npcIdx()) if (i < j && atWarK(i, j) && (VX.known.has(i) || VX.known.has(j))) npcW.push(`${campName(i)} ו${campName(j)}`);
  if (npcW.length) h += `<h3>מלחמות בין שבטים</h3><p class="idim">${npcW.join(' · ')} נלחמים זה בזה על אוכל ושטח.</p>`;
  return h;
}
function armyHtml() {
  const ad = clanAdults(), w = ad.filter(m => m.cls === 'warrior'), sw = w.filter(m => m.wpn === 'sword' && !m.knight).length, kn = w.filter(m => m.knight).length, hu = ad.filter(m => m.cls === 'hunter'), st = boxStore();
  const towers = BLD.list.filter(b => b.done && !b.broken && GUARDP[b.t]), manned = towers.filter(b => b.guard).length, dogs = tribeDogs().length, eagles = tribeEagles().filter(e => !e.pet || !e.pet.isPlayer).length;
  const has = t => BLD.list.some(b => b.done && b.t === t);
  if (!ownCamp()) return '<div class="vxhero"><b>הכוח שלנו</b><span>עוד אין לך שבט משלך</span></div><p class="idim">כשתקים שבט, כאן יופיעו הלוחמים, הציידים, המגדלים, הכלבים והעיטים שלו.</p>';
  let h = `<div class="vxhero"><b>הכוח של ${vxVillageName()}</b><span>כוח ${ownPower(true).toFixed(0)} · ${ad.length} מבוגרים · ${CLAN.residents} תושבים${CLAN.residents ? `, מהם ${resMix().warrior} לוחמים` : ''}</span></div>`;
  h += `<div class="istat"><div><span>🛡️ לוחמים</span><b>${w.length}${kn || sw ? ` (${[kn ? `${kn} אבירים` : '', sw ? `${sw} עם חרב` : ''].filter(Boolean).join(', ')})` : ''}</b></div><div><span>🏹 ציידים עם קשת</span><b>${hu.length}</b></div><div><span>🗼 מגדלים</span><b>${towers.length ? `${manned}/${towers.length} עם שומר` : 'אין'}</b></div><div><span>🐕 כלבים</span><b>${dogs || (has('kennel') ? 'עוד מעט' : 'צריך מלונה')}</b></div><div><span>🦅 עיטים</span><b>${eagles || (has('aviary') ? 'עוד מעט' : 'צריך כלוב')}</b></div><div><span>⚔️ במחסן</span><b>${st.swords || 0} חרבות · ${st.spears} חניתות · ${st.arrows} חצים</b></div><div><span>🧱 הגנה</span><b>${(() => { const S = defStats(); return S.seg + S.gates ? `${S.seg} קטעי גדר · ${S.gates} שערים${S.broken ? ` · ${S.broken} פרוצים` : ''}` : CAMPH.up.walls ? 'חומה סביב המדורה' : CAMPH.up.fence ? 'גדר סביב המדורה' : 'אין גדר'; })()}</b></div><div><span>🔥 לפידים</span><b>${BLD.list.filter(b => b.done && b.t === 'torch').length}</b></div></div>`;
  const out = WAR.parties.filter(p => !p.done && p.mine);
  h += `<h3>פשיטות</h3>${out.length ? out.map(p => `<p class="wok">🏹 ${p.men.length} לוחמים · ${campName(p.to)} · ${{ march: 'בדרך', attack: 'נלחמים', loot: 'אוספים שלל', home: 'חוזרים' }[p.phase] || ''}</p>`).join('') : '<p class="idim">אין לוחמים בדרך. בזמן מלחמה אפשר לצאת לפשיטה על מחנה האויב: לקחת אוכל, לשחרר שבויים ולכבוש שטח.</p>'}`;
  if (npcIdx().some(atWar)) h += '<div class="btns"><button class="btn pri" data-a="raidPick">🏹 לצאת לפשיטה</button></div>';
  const tips = [];
  if (!has('armory')) tips.push('בית נשק נותן ללוחמים חרבות, וממלא את המחסן בחניתות ובחצים');
  if (!towers.length) tips.push('מגדל שמירה מקבל לוחם עם קשת שיורה באויבים ובטורפים');
  if (!has('kennel')) tips.push('מלונה: הציידים והלוחמים מקבלים כלבי יער שנלחמים לצידם');
  if (!has('aviary')) tips.push('כלוב עיטים: עיט חג מעל הצייד וצולל על אויבים');
  if (w.length < 2) tips.push('צריך עוד לוחמים: במסך האנשים אפשר לתת תפקיד, והשבט גם מחליט לבד כשיש סכנה');
  if (!kn) tips.push('אביר (עם אורווה ו־30 זהב) לובש שריון ומגן, חזק פי שניים מלוחם ורוכב ראשון לפשיטה. נותנים את התפקיד במסך האנשים: 📣 ליד השם');
  if (tips.length) h += `<h3>איך מתחזקים</h3>${tips.map(t => `<p class="idim">• ${t}</p>`).join('')}`;
  const free = tribeEagles().find(e => !e.pet || !e.pet.isPlayer), mine = P.a.pets.some(q => q.alive && q.brain === 'falcon');
  if (free && !mine) h += '<div class="btns"><button class="btn" data-a="eagle">🦅 לקחת עיט שילווה אותי</button></div>';
  return h;
}
function logHtml() {
  if (!WAR.log.length) return '<div class="vxhero"><b>קורות המלחמות</b><span>עוד לא קרה כלום</span></div><p class="idim">כאן נרשם כל מה שקורה בין השבטים: חתונות ולידות בכפר, פשיטות, קרבות, שבויים ושלום.</p>';
  return `<div class="vxhero"><b>קורות המלחמות</b><span>${WAR.log.length} אירועים</span></div>` + WAR.log.map(e => `<div class="wlog ${e.k === 'good' ? 'wgood' : e.k === 'bad' ? 'wbad' : ''}"><small>יום ${e.d}</small><span>${e.t}</span></div>`).join('');
}
// ---------- actions with their own small screens ----------
function declareConfirm(i) {
  const c = HUNT.camps[i], myP = ownPower(true), thP = npcPower(i);
  const el = uiCard('warov', `<h2>להכריז מלחמה על ${c.tribe}?</h2><p>הלוחמים שלהם יפשטו על הכפר: יגנבו אוכל, ישרפו בתים ויחטפו אנשים. גם מחוץ לכפר הם יתקפו אותך ואת האנשים שלך.</p><p class="idim">הכוח שלכם ${myP.toFixed(0)} · הכוח שלהם ${thP.toFixed(0)}. ${myP > thP * 1.3 ? 'אתם חזקים מהם.' : myP < thP * 0.8 ? 'הם חזקים מכם. כדאי להתחזק קודם.' : 'הכוחות שקולים.'}</p>${(() => { const w = polWarPreview(i); return (w.theirs.length ? `<p class="vxalert">🤝 בני הברית שלהם, ${w.theirs.map(campName).join(' ו')}, יצטרפו למלחמה נגדכם</p>` : '') + (w.ours.length ? `<p class="wok">🤝 בני הברית שלכם, ${w.ours.map(campName).join(' ו')}, יתבקשו להצטרף</p>` : '') + (polAllied('own', i) ? '<p class="vxalert">הם בני הברית שלכם! מלחמה בהם היא בגידה, וכל השבטים יזכרו את זה</p>' : '') + (POL.sup < 35 ? '<p class="vxalert">👥 האנשים בשבט כבר ממורמרים. מלחמה נוספת תחליש עוד את האמון בך</p>' : ''); })()}${VX.mem === i ? '<p class="vxalert">זה השבט שלך! הכרזת מלחמה תוציא אותך ממנו</p>' : ''}<div class="btns"><button class="btn wdanger" data-a="yes">🔥 להכריז מלחמה</button><button class="btn" data-a="no">ביטול</button></div>`);
  el.onclick = e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.a === 'yes') { closeCard('warov'); declareWar(i); } else openWar(); };
}
function demandTribute(i) {
  const r = relGet('own', i); r.taxDay = G.day;
  const k = clamp((ownPower(true) / Math.max(1, npcPower(i)) - 1) * 0.5, 0.1, 0.85) * (POL.trait[i] === 'proud' ? 0.7 : POL.trait[i] === 'greed' ? 0.85 : 1);
  if (rng() < k && (WAR.food[i] || 0) >= 6) { const n = Math.min(10, Math.round(WAR.food[i] * 0.4)); WAR.food[i] -= n; boxStore().cooked += n; addTrust(i, -8); warLog(`${campName(i)} שילמו מס: ${n} מנות אוכל`, 'good'); UI.notify(`${campName(i)} פחדו ושילמו ${n} מנות אוכל. אבל הם זוכרים`, 'good'); PROG.flags.tax = 1; }
  else { addTrust(i, POL.trait[i] === 'proud' ? -26 : -18); UI.notify(`${campName(i)} סירבו לשלם, והם כועסים מאוד`, 'bad'); if (campTrust(i) < -60 && rng() < 0.5) declareWar(i, `${campName(i)} הכריזו מלחמה על השבט שלך`); }
  openWar();
}
function raidTargetPick() {
  const L = npcIdx().filter(atWar).filter(sameLandOwn);
  if (!L.length) { UI.notify('האויבים שלכם גרים מעבר לים. הלוחמים לא יכולים ללכת לשם ברגל', 'bad'); openWar(); return; }
  if (L.length === 1) { raidPlanner(L[0]); return; }
  const el = uiCard('warov', `<h2>על מי לפשוט?</h2><div class="btns vxbtns">${L.map(i => `<button class="btn pri" data-i="${i}">${campName(i)}</button>`).join('')}<button class="btn" data-a="no">ביטול</button></div>`);
  el.onclick = e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.i) raidPlanner(+b.dataset.i); else openWar(); };
}
function raidPlanner(i) {
  const c = HUNT.camps[i], v = ownCamp(); if (!c || !v) return;
  if (WAR.parties.some(p => p.mine && !p.done)) { UI.notify('הלוחמים כבר בדרך. מחכים שיחזרו', 'bad'); openWar(); return; }
  const cand = clanAdults().filter(m => !m.isPartner || !m.young).filter(m => !(m.job && ['raid', 'caravan', 'ship', 'boat'].includes(m.job.k)) && !m.inCart && !m.inShip && m.brain === 'tribe'), war = atWar(i);
  const sel = WUI.sel || (WUI.sel = new Set(cand.filter(m => (m.cls === 'warrior' || m.cls === 'hunter') && m.hp > m.maxHp * 0.5).map(m => m.id)));
  if (WUI.lead == null) WUI.lead = P.a && dist2(P.a.pos, v) < villageR() + 60;
  const draw = () => {
    const men = cand.filter(m => sel.has(m.id)), A = men.reduce((s, m) => s + fightPow(m) * (m.hp / m.maxHp), 0) + (WUI.lead ? 2.2 : 0), D = npcPower(i) * (WUI.night ? 0.75 : 1);
    const k = A / Math.max(0.5, D), word = k > 1.4 ? ['סיכוי טוב', 'wgood'] : k > 0.9 ? ['קרב שקול', ''] : ['מסוכן', 'wbad'];
    const rows = cand.map(m => `<label class="wsel${sel.has(m.id) ? ' on' : ''}"><input type="checkbox" data-m="${m.id}"${sel.has(m.id) ? ' checked' : ''}><span>${(CLS[roleOf(m)] || CLS.builder).ic}</span><b>${m.name}</b><small>${clsWord(m)}${m.wpn === 'sword' && m.cls === 'warrior' && !m.knight ? ' · חרב' : ''}${(m.pets || []).some(q => q.alive && q.tribeDog) ? ' · 🐕' : ''}${(m.pets || []).some(q => q.alive && q.brain === 'falcon') ? ' · 🦅' : ''}</small><i class="ihp"><b style="width:${Math.round(m.hp / m.maxHp * 100)}%"></b></i></label>`).join('');
    const el = uiCard('warov', `<h2>פשיטה על ${c.tribe}</h2><p class="idim" style="margin-top:-4px">${campKindName(c)} · ${c.hunters.filter(h => h.alive && !h.young).length} מבוגרים · ${whereIs({ pos: { x: c.x, z: c.z } })}</p>${war ? '' : `<p class="vxalert">הם לא במלחמה איתכם: פשיטה היא הכרזת מלחמה${polAllied('own', i) ? ', ובגידה בבני הברית' : ''}. כל השבטים ישמעו על זה</p>`}<p class="idim">בוחרים מי יוצא ומה לוקחים. אבירים ולוחמים עם חרבות חזקים מקרוב, ציידים יורים מרחוק, והכלבים והעיטים הולכים עם הבעלים. ניצחון גם משחרר שבויים ומרחיב את השטח.</p>` + lootChipsHtml() +
      `<div class="wodds"><span>הכוח שיוצא: <b>${A.toFixed(1)}</b></span><span>הם: <b>${D.toFixed(1)}</b></span><span class="${word[1]}">${word[0]}</span></div>` +
      `<label class="wsel lead${WUI.lead ? ' on' : ''}"><input type="checkbox" data-lead="1"${WUI.lead ? ' checked' : ''}><span>🚶</span><b>${you('אני מוביל את הלוחמים', 'אני מובילה את הלוחמים')}</b><small>הם הולכים אחריך ותוקפים כשמגיעים קרוב</small></label>` +
      `<label class="wsel lead${WUI.night ? ' on' : ''}"><input type="checkbox" data-night="1"${WUI.night ? ' checked' : ''}><span>🌙</span><b>לתקוף בלילה</b><small>הלוחמים מחכים ליד המחנה שלהם עד שיחשיך. רבים שם ישנים ומתעוררים לאט</small></label>` +
      `<div class="wselL">${rows || '<p class="idim">אין מי שיצא. צריך לוחמים או ציידים.</p>'}</div><div class="btns"><button class="btn pri" data-a="go"${men.length ? '' : ' disabled'}>⚔️ לצאת לדרך (${men.length})</button><button class="btn" data-a="no">ביטול</button></div>`);
    el.querySelector('.card').classList.add('vxcard', 'warcard');
    el.onchange = e => { const t = e.target; if (t.dataset.night) WUI.night = t.checked; else if (t.dataset.lead) WUI.lead = t.checked; else if (t.dataset.m) { const id = +t.dataset.m; if (t.checked) sel.add(id); else sel.delete(id); } draw(); };
    el.onclick = e => {
      const b = e.target.closest('button'); if (!b || b.disabled) return;
      if (b.dataset.lw) { lootToggle(b.dataset.lw); draw(); return; }
      if (b.dataset.a === 'go') { closeCard('warov'); if (!atWar(i)) declareWar(i); const rp = ourRaidStart(i, cand.filter(m => sel.has(m.id)), WUI.lead); if (rp && WUI.night) { rp.night = true; rp.sx = c.x + (rp.sx - c.x) * 2.1; rp.sz = c.z + (rp.sz - c.z) * 2.1; if (!isNight()) UI.notify(`🌙 הלוחמים יחכו ליד ${campKindDef(c)} של ${c.tribe} עד שיחשיך, ואז יתקפו`, ''); } WUI.sel = null; if (WUI.lead) setWay(c.x, c.z, true, c.tribe); return; }
      WUI.sel = null; openWar();
    };
  };
  draw();
}
function peaceCard(i) {
  const c = HUNT.camps[i], r = relGet('own', i), st = WAR.stolen[i] || { food: 0, back: 0 }, caps = WAR.caps.filter(w => w.capCamp === i && !w.captor && w.alive);
  const food = foodHave() + (ownCamp() ? boxStore().cooked + boxStore().meat + boxStore().fish : 0), back = caps.length || st.food > st.back;
  const p0 = peaceChance(i, false, false), p1 = peaceChance(i, true, false), p2 = peaceChance(i, false, true);
  const el = uiCard('warov', `<h2>שלום עם ${c.tribe}</h2><p>ראש השבט יחליט לפי המצב במלחמה: מי מנצח, כמה זמן היא נמשכת, ומה מציעים לו.</p>` +
    `<div class="btns vxbtns"><button class="btn" data-o="0">🕊️ שלום בלי תנאים (${pctTxt(p0)})</button><button class="btn" data-o="1"${food >= 10 ? '' : ' disabled'}>🎁 שלום ועשר מנות אוכל (${pctTxt(p1)})</button>` +
    (back ? `<button class="btn pri" data-o="2">📜 שלום, ושיחזירו את מה שלקחו (${pctTxt(p2)})</button>` : '') + '<button class="btn" data-o="x">ביטול</button></div>' +
    (back ? `<p class="idim">הם מחזיקים ${[caps.length ? caps.map(w => w.name).join(', ') : '', st.food > st.back ? `${Math.round(st.food - st.back)} מנות אוכל` : ''].filter(Boolean).join(' ו')}.</p>` : ''));
  el.onclick = e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    const o = b.dataset.o; if (o === 'x') { openWar(); return; }
    r.peaceDay = G.day; closeCard('warov');
    const k = o === '1' ? p1 : o === '2' ? p2 : p0;
    if (o === '1') { let left = 10; const inv = Math.min(foodHave(), left); payFood(inv); left -= inv; if (left > 0) takeFood(left); WAR.food[i] += 10; }
    if (rng() < k) makePeace(i, { back: o === '2' });
    else { addTrust(i, -3); UI.notify(`${chiefOfCamp(c) ? chiefOfCamp(c).name : 'ראש השבט'} מסרב. המלחמה נמשכת`, 'bad'); warLog(`${campName(i)} סירבו להצעת השלום`, 'bad'); }
  };
}
function bestWarrior() { return clanAdults().filter(m => (m.cls === 'warrior' || m.cls === 'hunter') && !m.escort && !(m.job && m.job.k === 'raid') && m.hp > m.maxHp * 0.6).sort((p, q) => (q.cls === 'warrior') - (p.cls === 'warrior') || (q.wpn === 'sword') - (p.wpn === 'sword') || q.hp - p.hp)[0] || null; }
function challengePick(i) {
  const c = HUNT.camps[i], caps = WAR.caps.filter(w => w.capCamp === i && !w.captor && w.alive), m = bestWarrior();
  const stakes = [['food', '🍖 על עשר מנות אוכל'], ['land', '🗺️ על שטחי הציד שבין הכפרים'], ...caps.map(w => [`cap:${w.name}`, `⛓️ שישחררו את ${w.name}`])];
  let stake = WUI.stake && stakes.some(s => s[0] === WUI.stake) ? WUI.stake : stakes[caps.length ? stakes.length - 1 : 0][0];
  const draw = () => {
    const el = uiCard('warov', `<h2>קרב אלופים מול ${c.tribe}</h2><p>אלוף נגד אלוף, עד שאחד נכנע. מי שמנצח לוקח את מה שעליו נלחמו. מפסידים? משלמים.</p><div class="wstakes">${stakes.map(([k, n]) => `<button class="${stake === k ? 'on' : ''}" data-s="${k}">${n}</button>`).join('')}</div>` +
      `<div class="btns vxbtns"><button class="btn pri" data-a="me">🤺 ${you('אני אלחם', 'אני אלחם')}</button>${m ? `<button class="btn" data-a="send">🛡️ לשלוח את ${m.name} (${clsWord(m)}${m.wpn === 'sword' ? ', חרב' : ''})</button>` : ''}<button class="btn" data-a="no">ביטול</button></div>`);
    el.onclick = e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.s) { stake = WUI.stake = b.dataset.s; draw(); return; }
      if (b.dataset.a === 'no') { openWar(); return; }
      relGet('own', i).chalDay = G.day; closeCard('warov');
      const [sk, cap] = stake.startsWith('cap:') ? ['cap', stake.slice(4)] : [stake, ''];
      if (b.dataset.a === 'me') chalStart(i, sk, true, cap); else if (m) chalByWarrior(i, sk, m);
    };
  };
  draw();
}
// ---------- the other tribes come to you ----------
function ultimatumCard(i) {
  const c = HUNT.camps[i], ch = chiefOfCamp(c), n = 8 + Math.round(clamp(-campTrust(i) - 40, 0, 40) / 8);
  const food = foodHave() + boxStore().cooked + boxStore().meat + boxStore().fish;
  const el = uiCard('warov', `<div class="vxwho"><span class="vxic">📯</span><div><h2>שליח מ${c.tribe}</h2><p class="idim">${ch ? ch.name : 'ראש השבט'} כועס</p></div></div><p class="vxsay">"${whyAngry(i)}. ${ch ? ch.name : 'ראש השבט'} דורש ${n} מנות אוכל. אם לא, תהיה מלחמה."</p>` +
    `<div class="btns vxbtns"><button class="btn" data-a="pay"${food >= n ? '' : ' disabled'}>🍖 לשלם ${n} מנות אוכל</button><button class="btn" data-a="chal">🤺 לאתגר לקרב אלופים במקום</button><button class="btn wdanger" data-a="no">🔥 לסרב</button></div>`);
  el.onclick = e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return; closeCard('warov');
    if (b.dataset.a === 'pay') { giftTribe(i, n); addTrust(i, 20); UI.notify(`שילמת. ${campName(i)} נרגעו, לבינתיים`, 'good'); warLog(`שילמתם ל${campName(i)} ${n} מנות אוכל כדי למנוע מלחמה`, ''); return; }
    if (b.dataset.a === 'chal') { challengePick(i); return; }
    declareWar(i, `${campName(i)} הכריזו מלחמה על השבט שלך`);
  };
}
function challengeCard(i, stake) {
  const c = HUNT.camps[i], ch = chiefOfCamp(c), m = bestWarrior(), lose = stake === 'food' ? 'לתת להם עשר מנות אוכל' : stake === 'land' ? 'לוותר על שטחי הציד' : 'לתת להם עשרים זהב';
  const el = uiCard('warov', `<div class="vxwho"><span class="vxic">🤺</span><div><h2>אתגר מ${c.tribe}</h2><p class="idim">${ch ? ch.name : 'ראש השבט'} שולח את האלוף שלו</p></div></div><p class="vxsay">"האלוף שלנו ייאבק באלוף שלכם על ${STAKE_N[stake]}. מי שנכנע, משלם."</p>` +
    `<div class="btns vxbtns"><button class="btn pri" data-a="me">🤺 ${you('אני אלחם', 'אני אלחם')}</button>${m ? `<button class="btn" data-a="send">🛡️ לשלוח את ${m.name}</button>` : ''}<button class="btn" data-a="give">🏳️ לוותר: ${lose}</button><button class="btn wdanger" data-a="no">לסרב</button></div>`);
  el.onclick = e => {
    const b = e.target.closest('button'); if (!b) return; closeCard('warov');
    const A = b.dataset.a;
    if (A === 'me') chalStart(i, stake, false);
    else if (A === 'send' && m) chalByWarrior(i, stake, m);
    else if (A === 'give') { chalResult(i, stake, false, '', ''); addTrust(i, 10); }
    else { addTrust(i, -15); UI.notify(`סירבת לאתגר של ${campName(i)}. הם רואים בזה עלבון`, 'bad'); if (campTrust(i) < -45 && rng() < 0.4) declareWar(i, `${campName(i)} הכריזו מלחמה על השבט שלך`); }
  };
}
function offerPeaceCard(i, back) {
  const c = HUNT.camps[i], ch = chiefOfCamp(c), caps = WAR.caps.filter(w => w.capCamp === i && !w.captor && w.alive);
  const el = uiCard('warov', `<div class="vxwho"><span class="vxic">🕊️</span><div><h2>שליח מ${c.tribe}</h2><p class="idim">${ch ? ch.name : 'ראש השבט'} עייף מהמלחמה</p></div></div><p class="vxsay">"${ch ? ch.name : 'ראש השבט'} מציע שלום${back && (caps.length || WAR.stolen[i].food > WAR.stolen[i].back) ? `, ומחזיר את מה שלקחנו${caps.length ? `: ${caps.map(w => w.name).join(', ')}` : ''}` : ''}."</p>` +
    '<div class="btns vxbtns"><button class="btn pri" data-a="yes">🕊️ לקבל את השלום</button><button class="btn wdanger" data-a="no">⚔️ להמשיך במלחמה</button></div>');
  el.onclick = e => { const b = e.target.closest('button'); if (!b) return; closeCard('warov'); if (b.dataset.a === 'yes') makePeace(i, { back }); else { warLog(`דחית את הצעת השלום של ${campName(i)}`, ''); UI.notify('המלחמה נמשכת', 'bad'); } };
}
// ---------- on the screen: a war button, an alarm when a raid comes, the map ----------
function warHud() {
  feedAvoid();
  if (!P.human) { if (WUI.btn) WUI.btn.hidden = true; if (WUI.pill && WUI.key) { WUI.key = ''; WUI.pill.style.display = 'none'; } return; }
  const show = G.mode === 'play' && P.human && !!P.a && (!!ownCamp() || VX.known.size > 0);
  const inc = WAR.parties.find(p => !p.done && !p.mine && p.to === ourKey() && p.phase !== 'gather'), out = WAR.parties.find(p => !p.done && p.mine), war = npcIdx().some(atWar);
  if (TOUCH) {
    if (!WUI.btn) { const top = document.getElementById('ttop'); if (top) { const b = document.createElement('button'); b.id = 'tWar'; b.className = 'tb'; b.innerHTML = ICON.war; b.setAttribute('aria-label', 'מלחמה ושלום'); b.hidden = true; top.insertBefore(b, top.firstChild); b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); openWar(); }); WUI.btn = b; } }
    if (WUI.btn) { if (WUI.btn.hidden === show) WUI.btn.hidden = !show; WUI.btn.classList.toggle('wwar', war); WUI.btn.classList.toggle('walarm', !!inc); }
  }
  if (!WUI.pill) { const el = document.createElement('div'); el.id = 'warPill'; el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); openWar(); }); document.body.appendChild(el); WUI.pill = el; }
  const txt = !show ? '' : inc ? `⚔️ פשיטה על ${inc.to === 'own' ? 'הכפר' : campName(inc.to)}! ${inc.men.length} לוחמים של ${campName(inc.from)}` : CHAL.ch ? `🤺 קרב אלופים מול ${CHAL.ch.name}` : out ? `🏹 הלוחמים ${{ march: 'בדרך אל', attack: 'נלחמים ב', loot: 'אוספים שלל אצל', home: 'חוזרים מ' }[out.phase] || ''}${campName(out.to)}` : '';
  if (txt !== WUI.key) { WUI.key = txt; WUI.pill.textContent = txt; WUI.pill.style.display = txt ? 'block' : 'none'; WUI.pill.classList.toggle('alarm', !!inc); }
}
// on a crowded short screen the notifications sit beside the missions column, not on top of it
function feedAvoid() {
  if (!TOUCH || (WUI.faT = (WUI.faT || 0) - 1) > 0) return; WUI.faT = 4;
  const b = document.body, st = b.style, lc = document.getElementById('lcol'), fd = document.getElementById('feed');
  let on = false;
  if (P.human && b.classList.contains('hstack') && lc && fd) {
    const r = lc.getBoundingClientRect(), f = fd.getBoundingClientRect();
    on = r.width > 1 && r.height > 4 && r.bottom > f.bottom - 70 && r.right > innerWidth / 2 - 230;
  }
  if (on) { const r = lc.getBoundingClientRect(), L = r.right + 8, R = innerWidth - 96, w = Math.max(160, Math.min(440, R - L)); st.setProperty('--feedL', `${Math.round(L + w / 2)}px`); st.setProperty('--feedW', `${Math.round(w)}px`); }
  else if (st.getPropertyValue('--feedL')) { st.removeProperty('--feedL'); st.removeProperty('--feedW'); }
}
function warMiniDots(pt) {
  for (const p of WAR.parties) if (!p.done) for (const h of p.men) if (h.alive && !h.gone) pt(h.pos.x, h.pos.z, p.mine ? 4.5 : 5, p.mine ? '#ffd34d' : '#ff3b30');
  for (const c of WAR.caps) if (c.alive && !c.captor) pt(c.pos.x, c.pos.z, 5, '#ff78ab');
  if (CHAL.ch && CHAL.ch.alive) pt(CHAL.ch.pos.x, CHAL.ch.pos.z, 6, '#ff3b30', true, true);
}
function warBigMap(c, m) {
  const S = c.canvas.width, k = S / W.size;
  c.save(); c.setLineDash([10, 7]); c.lineWidth = 2.5;
  for (const i of npcIdx()) {
    if (!VX.known.has(i)) continue; const cp = HUNT.camps[i], [x, y] = m(cp.x, cp.z);
    c.strokeStyle = atWar(i) ? 'rgba(255,70,50,.9)' : isVassal(i, 'own') ? 'rgba(232,176,75,.85)' : TRIBEC[tribeKeyOf(cp)] + 'cc'; c.beginPath(); c.arc(x, y, (WAR.terr[i] || 110) * k, 0, TAU); c.stroke();
    if (atWar(i)) { c.font = `bold ${Math.round(16 * k * 2)}px Rubik,sans-serif`; c.textAlign = 'center'; c.fillStyle = '#ff5a48'; c.fillText('⚔', x, y - 14); }
  }
  const v = ownCamp(); if (v) { const [x, y] = m(v.x, v.z); c.strokeStyle = 'rgba(232,176,75,.6)'; c.beginPath(); c.arc(x, y, ownTerrR() * k, 0, TAU); c.stroke(); }
  c.restore();
  for (const p of WAR.parties) if (!p.done) for (const h of p.men) if (h.alive && !h.gone) { const [x, y] = m(h.pos.x, h.pos.z); c.fillStyle = p.mine ? '#ffd34d' : '#ff3b30'; c.beginPath(); c.arc(x, y, 5, 0, TAU); c.fill(); c.lineWidth = 1.5; c.strokeStyle = '#1c1608'; c.stroke(); }
  for (const w of WAR.caps) if (w.alive) { const [x, y] = m(w.pos.x, w.pos.z); c.fillStyle = '#ff78ab'; c.beginPath(); c.arc(x, y, 6, 0, TAU); c.fill(); c.strokeStyle = '#3a0a1a'; c.lineWidth = 2; c.stroke(); }
  for (const B of BOATS) { const [x, y] = m(B.x, B.z); c.fillStyle = '#c99a5a'; c.fillRect(x - 3, y - 3, 6, 6); }
}
addEventListener('keydown', e => { if (e.code === 'KeyK' && !e.repeat && G.mode === 'play' && P.human && !G.paused) openWar(); });
// ---------- the journey continues: missions for the tribe's life and its wars ----------
{
  const at = Math.max(0, MISSIONS.hunter.findIndex(m => m.id === 'hunter.raid') + 1);
  MISSIONS.hunter.splice(at, 0,
    MS('hunter.wedding', 'חתונה בשבט: זוג ראשון מתחתן', 80, FL('wedding')),
    MS('hunter.baby', 'תינוק נולד לזוג בשבט', 100, FL('tribeBirth')),
    MS('hunter.boat', 'לשוט בקאנו בנהר או באגם', 60, FL('boat')),
    MS('hunter.sword', 'להכות בחרב', 50, FL('sword')),
    MS('hunter.dogs', 'כלב יער ראשון לשבט: לבנות מלונה', 90, FL('tribeDog')),
    MS('hunter.eagle', 'עיט ראשון לשבט: לבנות כלוב עיטים', 120, FL('tribeEagle')),
    MS('hunter.defendTribe', 'להדוף פשיטה של שבט אויב', 180, FL('raidWonTribe')),
    MS('hunter.raidWin', 'לנצח בפשיטה על מחנה של אויבים', 220, FL('raidVictory')),
    MS('hunter.reclaim', 'להחזיר שבוי או אוכל שנלקח', 150, FL('reclaim')),
    MS('hunter.champ', 'לנצח בקרב אלופים', 150, FL('champWin')),
    MS('hunter.peace', 'לעשות שלום עם שבט', 120, FL('peace')));
  for (const m of MISSIONS.hunter) GOAL[m.id] = m;
}
(function () {
  const st = document.createElement('style');
  st.textContent = `.warcard .wtribe{border:1px solid var(--line);border-radius:14px;padding:10px 12px;margin:9px 0;background:rgba(127,127,127,.05)}.warcard .wtribe.atwar{border-color:rgba(216,71,58,.6);background:rgba(216,71,58,.07)}
.wth{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.wth i{width:12px;height:12px;border-radius:50%;flex:0 0 12px}.wth b{font-size:16.5px;flex:1}
.wchip{font-size:12px;padding:2px 9px;border-radius:999px;background:rgba(127,127,127,.16);border:1px solid var(--line);white-space:nowrap}.wchip.wbad{background:rgba(216,71,58,.18);border-color:rgba(216,71,58,.55)}.wchip.wgood{background:rgba(109,190,106,.16);border-color:rgba(109,190,106,.5)}
.wrel{display:flex;align-items:center;gap:8px;margin:7px 0 4px;font-size:12.5px}.wrel i{flex:1;height:8px;border-radius:4px;background:rgba(127,127,127,.22);position:relative;overflow:hidden}.wrel i::after{content:"";position:absolute;left:50%;top:0;bottom:0;width:1px;background:rgba(255,255,255,.5)}.wrel i b{position:absolute;top:0;bottom:0;border-radius:4px}
.wgood{color:#6dbe6a}.wbad{color:#ef6a55}.wwarn{color:#e3ae63}
.wfacts{display:flex;flex-wrap:wrap;gap:4px 12px;font-size:12.5px;color:var(--dim);margin:2px 0 4px}.wfacts small{opacity:.8}
.wwarnp{margin:4px 0;font-size:12.5px;padding:5px 9px;border-radius:9px;background:rgba(232,176,75,.12);border-right:3px solid #e8b04b}
.wbtns{flex-wrap:wrap;justify-content:flex-start!important;gap:6px!important;margin-top:6px}.wbtns .btn{padding:6px 11px;font-size:13px}
.btn.wdanger{background:rgba(190,52,38,.85);border-color:#ff9a86;color:#fff}
.wok{margin:6px 0;padding:7px 10px;border-radius:10px;background:rgba(109,190,106,.12);border:1px solid rgba(109,190,106,.4);font-size:13.5px}
.wlog{display:flex;gap:10px;align-items:baseline;padding:6px 0;border-bottom:1px solid var(--line);font-size:13.5px}.wlog small{flex:0 0 46px;color:var(--dim)}
.wodds{display:flex;gap:14px;flex-wrap:wrap;align-items:center;margin:8px 0;padding:8px 10px;border-radius:10px;background:rgba(127,127,127,.1);font-size:14px}.wodds span:last-child{font-weight:700;margin-inline-start:auto}
.wselL{max-height:42vh;overflow:auto;margin:6px 0}.wsel{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:10px;border:1px solid var(--line);margin:4px 0;cursor:pointer;font-size:14px}.wsel.on{border-color:rgba(232,176,75,.7);background:rgba(232,176,75,.1)}
.wsel input{width:18px;height:18px;accent-color:#e8b04b}.wsel small{color:var(--dim);font-size:12px;flex:1}.wsel .ihp{flex:0 0 60px}.wsel.lead{margin:8px 0}
.wstakes{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}.wstakes button{border:1px solid var(--line);background:transparent;color:var(--ink);border-radius:10px;padding:7px 11px;font:500 13.5px Rubik,sans-serif;cursor:pointer}.wstakes button.on{background:var(--gold);color:#1c1608;border-color:var(--gold)}
#warPill{position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 140px);transform:translateX(-50%);z-index:7;display:none;padding:6px 14px;border-radius:999px;background:rgba(24,28,18,.82);border:1px solid rgba(232,176,75,.6);color:#f4efe1;font:600 13.5px Rubik,sans-serif;cursor:pointer;pointer-events:auto;white-space:nowrap;max-width:92vw;overflow:hidden;text-overflow:ellipsis}
#warPill.alarm{background:rgba(160,30,20,.88);border-color:#ff9a86;animation:wpulse 1.1s ease-in-out infinite}@keyframes wpulse{50%{box-shadow:0 0 0 4px rgba(255,80,60,.45)}}
body.touch #warPill{display:none!important}
body.touch.hstack.hud-compact #feed,body.touch.hstack.hud-min #feed{left:var(--feedL,50%)!important;width:var(--feedW,min(92vw,440px))!important}
#tWar.wwar{border-color:#ff9a86;color:#ffb3a3}#tWar.walarm{background:rgba(160,30,20,.85);animation:wpulse 1.1s ease-in-out infinite}`;
  document.head.appendChild(st);
})();
