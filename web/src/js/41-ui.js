// ================= UI =================
const $ = id => document.getElementById(id);
const SVG = (p, fill) => `<svg viewBox="0 0 24 24" ${fill ? 'fill="currentColor"' : 'fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"'} aria-hidden="true">${p}</svg>`;
const ICON = {
  claw: SVG('<path d="M6 3c2 5 1 11-2 17M11 3c2 6 1 12-2 18M16 3c2 5 1 11-2 17"/>'),
  jump: SVG('<path d="M4 20c3-8 13-8 16 0"/><path d="M12 14V4M8 8l4-4 4 4"/>'),
  run: SVG('<path d="M6 13l6-6 6 6M6 19l6-6 6 6"/>'),
  sneak: SVG('<path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12z"/><path d="M4 20L20 4"/>'),
  call: SVG('<path d="M4 10v4h4l5 4V6L8 10z"/><path d="M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12"/>'),
  moon: SVG('<path d="M20 15A8 8 0 1 1 9 4a6.5 6.5 0 0 0 11 11z"/>'),
  heart: SVG('<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>', true),
  fight: SVG('<path d="M5 5l14 14M19 5L5 19M3 9l6-6M15 3l6 6"/>'),
  pause: SVG('<path d="M8 5v14M16 5v14"/>'),
  book: SVG('<path d="M4 5h6a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H4zM20 5h-6a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h6z"/>'),
  drop: SVG('<path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/>', true),
  leaf: SVG('<path d="M5 19C5 9 11 4 20 4c0 9-5 15-15 15zM5 19l8-8"/>'),
  meat: SVG('<path d="M15 3a6 6 0 0 1 6 6c0 4.5-4.5 7.5-8.5 7.5L9 20l-2-1-1-2 3.5-3.5C9.5 9.5 10.5 3 15 3z"/>'),
  up: SVG('<path d="M12 19V5M6 11l6-6 6 6"/>'),
  down: SVG('<path d="M12 5v14M6 13l6 6 6-6"/>'),
  bolt: SVG('<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>', true)
};
ICON.layers = SVG('<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>');
ICON.eye = SVG('<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>');
ICON.spear = SVG('<path d="M5 19L17 7"/><path d="M13 5h6v6"/>');
ICON.axe = SVG('<path d="M4 20l9.5-9.5"/><path d="M12 4.5c3.2-.6 6.3 1.3 7.5 4.5L15 13.5 10.5 9z" fill="currentColor"/>');
ICON.hammer = SVG('<path d="M13.5 3.5l7 7-3 3-7-7z" fill="currentColor"/><path d="M11 11l-7 9"/>');
ICON.talk = SVG('<path d="M4 5h16v10H10l-5 4v-4H4z"/><path d="M8 9h8M8 12h5"/>');
ICON.boat = SVG('<path d="M2.5 13.5c3.5 4 15.5 4 19 0z" fill="currentColor"/><path d="M16 3.5l-4.5 11"/><path d="M10.4 17.2l1.1-2.7"/>');
ICON.sword = SVG('<path d="M19.5 3.5l-1 4.5L8.5 18l-3.5-3.5L15 4.5z"/><path d="M4.5 13.5l6 6"/><path d="M3.5 20.5l3-3"/>');
ICON.bow = SVG('<path d="M5 3.5C13.5 4.5 19.5 10.5 20.5 19"/><path d="M5 3.5L20.5 19" stroke-width="1.1"/><path d="M3.8 20.2L17.2 6.8"/><path d="M17.2 6.8h-4.2M17.2 6.8V11"/>');
ICON.spear = SVG('<path d="M3.5 20.5L14 10"/><path d="M14 10l.9-4.6L20.5 3.5l-1.9 5.6z" fill="currentColor"/><path d="M11.4 10l2.6 2.6"/>');
ICON.war = SVG('<path d="M4 4l10 10M11.5 16.5l5-5M14 14l3.2 3.2"/><path d="M20 4L10 14M12.5 16.5l-5-5M10 14l-3.2 3.2"/><circle cx="18.4" cy="18.4" r="1.4"/><circle cx="5.6" cy="18.4" r="1.4"/>');
ICON.forge = SVG('<path d="M2.5 10h12.5c0 2.3-1.7 3.8-3.8 3.8h-.7l.9 4.2H6.4l.9-4.2h-.4C4.3 13.8 2.5 12.3 2.5 10z"/><path d="M5 21h9"/><path d="M13.6 8.6l4-4"/><path d="M21.6 5.7l-1.7 1.7-4.3-4.3 1.7-1.7z" fill="currentColor"/>');
ICON.trap = SVG('<path d="M5 21c2-6 2-12 1-17"/><path d="M6 4c4 1 8 3 12 7"/><path d="M18 11v4"/><ellipse cx="18" cy="17.6" rx="3" ry="2.4"/>');
ICON.fence = SVG('<path d="M5 21V6l2-2.5L9 6v15M11 21V6l2-2.5L15 6v15M17 21V6l2-2.5L21 6v15"/><path d="M3 10h20M3 16h20"/>');
ICON.lock = SVG('<rect x="5" y="11" width="14" height="9.5" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>');
const TC = { joyId: null, jx0: 0, jy0: 0, pts: new Map(), pinch: null, restT: 0, drag: null };
const UI = {
  t: 0, openT: 0, hudT: 0, miniT: 0, hurtV: 0, bigT: null, mapImg: null, lockFail: false, overlay: null,
  init() {
    const ul = $('spList');
    ul.innerHTML = PLAYABLE.map(id => `<li><button data-sp="${id}"><span class="nm">${SPECIES[id].he}</span><span class="lat">${SPECIES[id].lat}</span></button></li>`).join('');
    ul.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; SET.sp = b.dataset.sp; saveSet(); this.syncMenu(); menuPreview(); AUD.play('ui'); });
    const seg = (id, key, fn) => $(id).addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; SET[key] = b.dataset.v; saveSet(); this.syncMenu(); fn && fn(); });
    seg('sexSeg', 'sex', () => menuPreview()); seg('qSeg', 'q', applyQuality); seg('faSeg', 'fa', () => faunaCull()); seg('qSeg2', 'q', applyQuality); seg('fxSeg', 'fx', () => { POST.fail = false; }); seg('musSeg', 'mus', null);
    $('photoBtn').addEventListener('click', () => photoEnter());
    $('startBtn').addEventListener('click', () => { AUD.init(); if (TOUCH) tryFullscreen(); startGame(false); });
    $('contBtn').addEventListener('click', async () => {
      AUD.init(); if (TOUCH) tryFullscreen();
      // the account is still being read: wait a moment, so the newest copy of the game is the one that opens
      if (CLOUD.pulling) { const c = $('contBtn'); c.disabled = true; c.textContent = '☁️ רגע, בודקים בחשבון…'; await cloudWait(6000); c.disabled = false; syncContinue(); }
      if (G.mode === 'menu') continueGame();
    });
    $('savesImport').addEventListener('click', () => { AUD.play('ui'); xferOpen(null); });
    $('loadBtn').addEventListener('click', () => { $('death').hidden = true; if (PROG.slot) continueGame(PROG.slot); else UI.toMenu(); });
    $('saveList').addEventListener('click', savesClick); $('savesClose').addEventListener('click', () => { $('saves').hidden = true; });
    $('perkGrid').addEventListener('click', e => { const b = e.target.closest('button'); if (b) choosePerk(b.dataset.id); });
    $('resumeBtn').addEventListener('click', () => this.pause(false));
    $('helpBtn').addEventListener('click', () => { $('pause').hidden = true; this.open('help'); });
    $('menuBtn').addEventListener('click', () => this.toMenu());
    $('helpClose').addEventListener('click', () => this.close());
    $('guideClose').addEventListener('click', () => this.close());
    $('mapClose').addEventListener('click', () => this.close());
    for (const id of ['help', 'guide', 'mapov']) $(id).addEventListener('click', e => { if (e.target === e.currentTarget && performance.now() - this.openT > 450) this.close(); });
    $('againBtn').addEventListener('click', () => { $('death').hidden = true; startGame(true); });
    $('otherBtn').addEventListener('click', () => { $('death').hidden = true; this.toMenu(); });
    $('rotOk').addEventListener('click', () => { this.rotOk = true; this.checkRotate(); });
    if (TOUCH) {
      document.querySelector('#menu .fine').textContent = 'שולטים בנגיעה: ג׳ויסטיק בצד שמאל, כפתורים בצד ימין. מומלץ להחזיק את המכשיר לרוחב.';
      $('help').querySelector('.keys').innerHTML = [
        ['ג׳ויסטיק', 'גוררים אצבע בצד שמאל של המסך. עד הקצה ומעבר לו: ריצה'], ['גרירה מימין', 'סיבוב המצלמה. שתי אצבעות: זום'],
        ['תקיפה', 'נשיכה או מכה'], ['קפיצה', 'בריצה ליד טרף: זינוק קטלני. כשמישהו מתכונן לתקוף: התחמקות. במים: צלילה'],
        ['כפתור זהב', 'מופיע כשיש מה לאכול, לשתות או ללחך. מחזיקים אותו לחוץ'], ['חיזור / אתגר', 'מופיעים ליד חיה מהמין שלך'],
        ['עלייה / צלילה', 'כשמשחקים בדג: להחזיק כדי לעלות או לצלול. בהאצה ליד פני המים: זינוק'], ['חשמל', 'בצלופח: מכת חשמל שמשתקת את כל מי שסביבו'],
        ['ריצה', 'מפעיל ומכבה ריצה קבועה'], ['התגנבות', 'איטי ושקט, הטרף מזהה אותך מאוחר יותר'], ['קריאה', 'מבריחה טרף ומושכת בני זוג'],
        ['מנוחה', 'לחיצה: לנוח ולהחלים. לחיצה ארוכה בלילה: שינה עד הבוקר'], ['המפה הקטנה', 'נגיעה בה פותחת מפה גדולה']
      ].map(([k, v]) => `<kbd>${k}</kbd><span>${v}</span>`).join('');
      setupTouch();
    } else $('help').querySelector('.keys').insertAdjacentHTML('beforeend', '<kbd>רווח / C</kbd><span>כשמשחקים בדג: עלייה וצלילה. Shift ורווח ליד פני המים: זינוק</span><kbd>R</kbd><span>בצלופח: מכת חשמל</span>');
    this.setupKeys();
    extraHelp(); hudInit(); vxMenuInit();
    this.syncMenu();
  },
  syncMenu() {
    for (const b of $('spList').querySelectorAll('button')) b.setAttribute('aria-pressed', String(b.dataset.sp === SET.sp));
    for (const [id, v] of [['sexSeg', SET.sex], ['qSeg', SET.q], ['qSeg2', SET.q], ['faSeg', String(SET.fa || '1')]]) for (const b of $(id).querySelectorAll('button')) b.setAttribute('aria-pressed', String(b.dataset.v === v));
    const s = SPECIES[SET.sp];
    $('spInfo').innerHTML = `<h2>${s.he}</h2><p>${s.pl.desc}</p>${roleHtml(s)}` + STATL().map((n, i) => `<div class="stat"><span>${n}</span><div class="ticks">${[0, 1, 2, 3, 4].map(k => `<i class="${k < s.pl.stats[i] ? 'on' : ''}"></i>`).join('')}</div></div>`).join('') + `<p class="risk">${s.pl.risk}</p>`;
    $('spMini').innerHTML = STATL().map((n, i) => `<span>${n}<b class="ticks">${[0, 1, 2, 3, 4].map(k => `<i class="${k < s.pl.stats[i] ? 'on' : ''}"></i>`).join('')}</b></span>`).join('');
    syncRoleMini(s);
    syncContinue(); syncExtraSegs(); syncSkins();
    document.querySelector('#menu .ask').textContent = 'במי לשחק?'; vxSyncMenu();
  },
  enterGame() {
    $('menu').hidden = true; $('hud').hidden = false; $('death').hidden = true; this.close(true);
    if (TOUCH) { $('touch').hidden = false; this.setControls(); }
    $('feed').innerHTML = ''; this.hurtV = 0;
    if (!this.mapImg) this.mapImg = buildMapImg();
    this.checkRotate();
    if (!TOUCH) $('c').focus();
  },
  setControls() {
    if (!TOUCH) return;
    const L = controlLabels();
    for (const id in L) { $(id).innerHTML = L[id][0] + `<small>${L[id][1]}</small>`; $(id).setAttribute('aria-label', L[id][1]); }
  },
  toMenu() {
    saveGame(); cloudTick(true);
    this.close(true); $('pause').hidden = true; $('hud').hidden = true; $('touch').hidden = true; $('rotate').hidden = true;
    if (P.a) { P.a.remove(); P.a = null; }
    for (const a of ANIMALS.slice()) if (a.socialExtra || a.cub) a.remove();
    if (P.partner) { P.partner.isPartner = false; P.partner.followTarget = null; P.partner.state = 'idle'; }
    P.partner = null; P.cubs = []; resetHunters();
    G.mode = 'menu'; G.paused = false; G.timeMul = 1; UI.sleepFx(false); wpnUpdate();   // (the weapons bar leaves with the game)
    if (document.pointerLockElement) document.exitPointerLock();
    $('menu').hidden = false; syncContinue(); menuPreview();
  },
  pause(on) {
    if (G.mode !== 'play') return;
    if (!on && this.overlay) { this.close(); return; }
    if (on) { saveGame(); cloudTick(true); fillPauseInfo(); }
    G.paused = on; $('pause').hidden = !on;
    if (on && document.pointerLockElement) document.exitPointerLock();
    INPUT.use = false; INPUT.joy = false;
  },
  open(name) {
    if (G.mode !== 'play') return;
    this.close(true); this.overlay = name; G.paused = true; this.openT = performance.now();
    if (name === 'guide') this.renderGuide();
    if (name === 'map') this.drawBigMap();
    $(name === 'map' ? 'mapov' : name).hidden = false;
    if (document.pointerLockElement) document.exitPointerLock();
    INPUT.use = false; INPUT.joy = false;
  },
  close(silent) {
    for (const id of ['help', 'guide', 'mapov']) $(id).hidden = true;
    const was = this.overlay; this.overlay = null;
    if (!silent && G.mode === 'play' && was) G.paused = !$('pause').hidden;
  },
  toggle(name) { if (this.overlay === name) this.close(); else this.open(name); },
  notify(text, kind = '') {
    const f = $('feed'), last = f.lastElementChild;
    if (last && last.textContent === text) return;
    const d = document.createElement('div'); d.className = 'pn ' + kind; d.textContent = text; d.dataset.t = this.t; f.appendChild(d);
    const max = TOUCH ? (innerHeight < 520 ? 2 : 3) : 5; while (f.children.length > max) f.firstElementChild.remove();
  },
  big(title, sub) {
    const b = $('big'); b.innerHTML = ''; const t = document.createElement('b'); t.textContent = title; const s = document.createElement('span'); s.textContent = sub || ''; b.append(t, s);
    b.style.opacity = 1; clearTimeout(this.bigT); this.bigT = setTimeout(() => b.style.opacity = 0, HUD.mode === 'full' ? 3400 : 2400);
  },
  hurt(k) { this.hurtV = Math.min(1, Math.max(this.hurtV, k + 0.25)); },
  qte(on, kind) { $('qte').hidden = !on; $('qteText').textContent = kind === 'roll' ? (TOUCH ? 'גלגול מוות! להקיש מהר על תקיפה כדי להשתחרר' : 'גלגול מוות! ללחוץ מהר על רווח או קליק') : kind === 'net' ? (TOUCH ? 'רשת! להקיש מהר על תקיפה כדי לקרוע אותה' : 'רשת! ללחוץ מהר על רווח או קליק כדי לקרוע אותה') : TOUCH ? 'אנקונדה נכרכת סביבך! להקיש מהר על תקיפה או קפיצה' : 'אנקונדה נכרכת סביבך! ללחוץ מהר על רווח'; },
  sleepFx(on) { this.sleeping = on; },
  showDeath() {
    $('deathCause').textContent = P.deathCause;
    const st = [[G.day, 'ימים בג׳ונגל'], [P.kills, 'טרף שצדת'], [P.raised, P.human ? 'ילדים שגדלו' : 'גורים שגדלו'], [`${P.discovered.size}/${GUIDE_ORDER.length}`, 'מינים בספר השדה']];
    $('deathStats').innerHTML = st.map(([v, l]) => `<div><b>${v}</b><span>${l}</span></div>`).join('');
    // the saved game comes first: "try again" starts a new journey from nothing (the saved one stays in the list of games)
    const sv = PROG.slot ? readSlot(PROG.slot) : null, lb = $('loadBtn'), ab = $('againBtn'), ds = $('deathSave');
    lb.hidden = !sv; lb.classList.toggle('pri', !!sv); ab.classList.toggle('pri', !sv);
    ab.textContent = sv ? (P.human ? 'מסע חדש מההתחלה' : 'להתחיל מההתחלה') : 'לנסות שוב'; $('otherBtn').textContent = P.human ? 'לתפריט הראשי' : 'לבחור חיה אחרת';
    ds.hidden = !(sv && sv.ownCamp);
    if (sv && sv.ownCamp) {
      const vn = sv.vn || 'הכפר שלך', own = VNAME.includes(vn), f = /^ה?עיר/.test(vn), rest = own ? 'ה' + vn.replace(/^ה| שלך$/g, '') : vn;
      ds.textContent = `🏘️ ${vn} ${f ? 'שמורה' : 'שמור'}: "להמשיך מהשמירה האחרונה" מחזיר אותך ${f ? 'אליה' : 'אליו'}, כמו ${f ? 'שהייתה' : 'שהיה'} רגע לפני. מסע חדש מתחיל בלי כפר, ו${rest} ${f ? 'נשארת' : 'נשאר'} ב"המשחקים שלי"`;
    }
    $('death').hidden = false; $('touch').hidden = true; heirButton();
  },
  checkRotate() { this.rotating = TOUCH && !this.rotOk && G.mode === 'play' && innerHeight > innerWidth * 1.05 && Math.min(innerWidth, innerHeight) < 700; $('rotate').hidden = !this.rotating; },
  update(dt) {
    this.t += dt;
    this.hurtV *= Math.exp(-dt * 2.2); $('hurt').style.opacity = this.hurtV.toFixed(3);
    const tint = $('tint');
    if (G.mode === 'play' || G.mode === 'dead') {
      if (this.sleeping) { tint.style.background = 'rgba(4,8,22,.62)'; tint.style.opacity = 1; }
      else if (SENSE.t > 0) { tint.style.background = 'radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(48,26,0,.5) 100%)'; tint.style.opacity = Math.min(1, SENSE.t * 2).toFixed(2); }
      else if (SKY.under) { tint.style.background = 'rgba(24,86,76,.14)'; tint.style.opacity = 1; }
      else if (P.poison > 0) { tint.style.background = 'rgba(80,150,30,.2)'; tint.style.opacity = 0.6 + Math.sin(this.t * 3) * 0.3; }
      else tint.style.opacity = 0;
      this.hudT -= dt; if (this.hudT <= 0) { this.hudT = 0.1; this.hud(); }
      this.miniT -= dt; if (this.miniT <= 0) { this.miniT = TOUCH ? 0.15 : 0.1; this.drawMini(); this.drawCompass(); }
      this.markUpdate();
      if (!$('qte').hidden) $('qteFill').style.width = (P.qte * 100).toFixed(1) + '%';
    } else tint.style.opacity = 0;
    for (const d of $('feed').children) { const age = this.t - d.dataset.t; if (age > 5.2) { d.style.opacity = 0; d.style.transform = 'translateY(-6px)'; } if (age > 6) d.remove(); }
    if (!TOUCH) $('lockhint').hidden = !(G.mode === 'play' && !G.paused && !this.overlay && !document.pointerLockElement && !this.lockFail);
  },
  hud() {
    const a = P.a; if (!a) return;
    const bar = (id, v) => { const e = $(id); e.querySelector('b').style.width = (clamp(v, 0, 1) * 100).toFixed(1) + '%'; e.classList.toggle('low', v < 0.25); };
    bar('bHp', a.hp / a.maxHp); bar('bFood', P.food / 100); bar('bWater', P.water / 100); bar('bStam', P.stam / 100); bar('bAir', P.air / 100);
    $('bAir').hidden = P.fish ? !P.sp.air : !(a.swimming && (P.dive || P.air < 99)); $('bWater').hidden = !!P.fish;
    $('vName').textContent = (P.sp.he) + (PROG.gen > 1 ? ` · דור ${PROG.gen}` : '');
    const st = !a.alive ? you('מת', 'מתה') : P.sleeping ? you('ישן', 'ישנה') : (P.coil || HUNT.net || COMBAT.roll) ? you('לכוד!', 'לכודה!') : P.stun > 0 ? you('המום', 'המומה') : P.fish ? (a.airborne ? you('מזנק', 'מזנקת') : a.pos.y > waterAt(a.pos.x, a.pos.z) - 0.45 ? 'בפני המים' : 'שוחה') : a.swimming ? (P.dive ? you('צולל', 'צוללת') : 'שוחה') : P.eating ? (P.ctx === 'drink' ? 'שותה' : P.ctx === 'graze' ? you('מלחך', 'מלחכת') : you('אוכל', 'אוכלת')) : P.resting ? you('נח', 'נחה') : P.running ? you('רץ', 'רצה') : P.crouch ? you('מתגנב', 'מתגנבת') : P.poison > 0 ? you('מורעל', 'מורעלת') : '';
    $('vStatus').textContent = [P.sex === 'f' ? 'נקבה' : 'זכר', extraStatus(st) || st, P.a && P.a.bleedT > 0 ? you('מדמם', 'מדממת') : ''].filter(Boolean).join(', ');
    const hh = Math.floor(G.time), mm = Math.floor((G.time - hh) * 60);
    $('clock').textContent = `יום ${G.day}, ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}${G.rain > 0.3 ? ', גשם' : ''}${P.renown ? `, מעמד ${P.renown}` : ''}`;
    const fam = $('family');
    const pets = P.human && P.a.pets ? P.a.pets.filter(b => b.alive && !b.gone) : [];
    if (pets.length) { fam.hidden = false; fam.innerHTML = '<h3>החיות שלך</h3>' + pets.map(b => `<div class="row"><span>${b.name || ''} (${b.sp.he})</span><span>${Math.round(b.hp / b.maxHp * 100)}%</span></div>`).join(''); }
    else if (P.partner || P.cubs.length) {
      fam.hidden = false;
      let h = '<h3>המשפחה</h3>';
      if (P.partner) h += famRows();
      else if (P.cubs.length) h += `<div class="row"><span>${you('מגדל', 'מגדלת')} לבד</span></div>`;
      for (const c of P.cubs) h += `<div class="row"><span>${c.name}</span><span>${c.cubHunger > 60 ? '<b style="color:var(--red)">רעב</b>' : c.cubHunger > 35 ? 'קצת רעב' : 'שבע'}, ${Math.round(clamp(c.age / 60, 0, 1) * 100)}%</span></div>`;
      { const pend = famPending(); if (pend >= 0) h += `<div class="row" style="color:var(--dim)"><span>${P.human ? 'הריון' : 'גורים בדרך'}: ${Math.round(clamp(pend / 14, 0, 1) * 100)}%</span></div>`; }
      fam.innerHTML = h;
    } else fam.hidden = true;
    const t = P.target, tg = $('target');
    if (t && !t.gone && (t.alive || t.food > 0.5)) {
      tg.hidden = false;
      let sub = '', aff = '';
      if (P.human && t === P.tameB && P.tameT > 0) sub = `מתאלף... ${Math.round(P.tameT / P.mods.tameT * 100)}%`;
      else if (P.human && t.pet === a) sub = heb(t, 'מאולף, הולך איתך', 'מאולפת, הולכת איתך');
      else if (P.human && (t.hunter || t.tribe)) sub = vxTargetSub(t);
      else if (!t.alive) sub = P.isPred ? 'פגר. אפשר לאכול' : 'פגר';
      else if (t.isPartner) sub = heb(t, 'בן הזוג שלך', 'בת הזוג שלך');
      else if (t.cub) sub = P.human ? heb(t, 'הילד שלך', 'הילדה שלך') : 'הגור שלך';
      else if (t.hunter) sub = t.fleeing ? heb(t, 'בורח', 'בורחת') : t.pets.length ? (t.pets.length === 1 ? heb(t, 'חיה מאולפת הולכת אחריו', 'חיה מאולפת הולכת אחריה') : `${t.pets.length} חיות מאולפות הולכות ${heb(t, 'אחריו', 'אחריה')}`) : 'עדיף להתרחק';
      else if (t.pet) sub = `${heb(t, 'מאולף', 'מאולפת')} בידי ${t.pet.name}`;
      else if (t.spId === P.spId && !t.young && t.sex !== a.sex) { sub = heb(t, 'בן זוג אפשרי', 'בת זוג אפשרית'); aff = `קרבה ${Math.max(0, Math.round(t.affinity))}%`; }
      else if (t.spId === P.spId && !t.young) sub = t.defeated ? heb(t, 'יריב שהובס', 'יריבה שהובסה') : heb(t, 'יריב', 'יריבה');
      else if (preys(t, a)) sub = 'מסוכן לך!';
      else if (preys(a, t)) sub = 'טרף';
      else if (t.sp.danger >= 2) sub = 'עדיף להתרחק';
      const nm = t.hunter ? (t.ruler ? t.name : `${hunterWord(t)} ${t.name}`) : t.name && t.spId === P.spId ? `${t.name}` : t.sp.he;
      tg.innerHTML = `<div class="tn"></div><div class="ts"></div>${t.alive && (t.hp < t.maxHp * 0.99 || t.state === 'fight') ? `<div class="th"><b style="width:${(t.hp / t.maxHp * 100).toFixed(0)}%"></b></div>` : ''}${aff ? `<div class="aff">${aff}</div>` : ''}`;
      tg.querySelector('.tn').textContent = nm; tg.querySelector('.ts').textContent = sub;
    } else tg.hidden = true;
    const can = this.socialCan(t);
    if (TOUCH) {
      const u = $('tUse');
      if (P.ctx && a.alive) { u.hidden = false; const k = P.ctx; if (u.dataset.k !== k) { u.dataset.k = k; u.innerHTML = ctxButton(k); } }
      else { u.hidden = true; INPUT.use = false; u.classList.remove('down'); }
      $('tLove').hidden = !can.love; $('tFight').hidden = !can.fight;
      $('tCrouch').classList.toggle('on', P.crouch); $('tRest').classList.toggle('on', P.resting);
      $('tRun').classList.toggle('on', INPUT.run);
      const ts = $('tSense'); ts.classList.toggle('on', SENSE.t > 0); ts.style.opacity = SENSE.cd > 0 && SENSE.t <= 0 ? '0.45' : '';
    } else {
      const pr = [];
      if (P.coil || HUNT.net) pr.push(['רווח', 'להשתחרר!']);
      if (P.ctx) pr.push(['E', ctxText(P.ctx)]);
      extraPrompts(pr);
      if (P.fish) { pr.push(['רווח / C', 'לעלות / לצלול']); if (P.spId === 'eel') pr.push(['R', 'מכת חשמל']); if (P.sp.air && P.air < 50) pr.push(['רווח', 'לעלות לנשום!']); }
      if (can.love) pr.push(['F', t.isPartner ? 'ליטוף' : 'לחזר']);
      if (can.fight) pr.push(['G', 'לאתגר']);
      if (a.swimming && canDive()) pr.push(['רווח', P.dive ? 'לעלות' : 'לצלול']);
      if (isNight() && !P.sleeping && a.alive) pr.push(['Z', 'להחזיק לשינה']);
      const html = pr.map(([k, v]) => `<div class="pn"><kbd>${k}</kbd> ${v}</div>`).join('');
      if (html !== this.lastPr) { $('prompts').innerHTML = html; this.lastPr = html; }
    }
    renderGoals();
    if (isNight() && !this.nightTold && G.mode === 'play') { this.nightTold = true; this.notify(TOUCH ? 'ירד הלילה. לחיצה ארוכה על מנוחה כדי לישון' : 'ירד הלילה. להחזיק Z כדי לישון', ''); }
    if (!isNight()) this.nightTold = false;
  },
  socialCan(t) {
    const a = P.a, r = { love: false, fight: false };
    if (P.human) { if (t && t.alive && t.spId === 'hunter' && !t.young && !t.elite && !t.tribe && t.cls !== 'elder' && t.sex !== a.sex && dist2(t.pos, a.pos) < 8 && aliveMates().length < maxMates()) r.love = true; return r; }
    if (!t || !a || !t.alive || t.young || t.spId !== P.spId || !a.alive) return r;
    const d = dist2(t.pos, a.pos);
    if (t.sex !== a.sex && d < 8 && (t.isPartner || aliveMates().length < maxMates())) r.love = true;
    if (t.sex === a.sex && d < 10 && !t.isPartner) r.fight = true;
    return r;
  },
  markUpdate() {
    const w = P.warnFrom, m = $('mark');
    if (!w || !w.alive || w.windup <= 0) { m.hidden = true; return; }
    _tmp.set(w.pos.x, w.pos.y + w.height + 0.5, w.pos.z).project(camera);
    if (_tmp.z > 1) { m.hidden = true; return; }
    m.hidden = false; m.style.left = ((_tmp.x * 0.5 + 0.5) * innerWidth).toFixed(0) + 'px'; m.style.top = ((-_tmp.y * 0.5 + 0.5) * innerHeight).toFixed(0) + 'px';
  },
  drawCompass() {
    const cv = $('cmpC'), c = cv.getContext('2d'), W = cv.width, H = cv.height, ppr = W / 2.4;
    c.clearRect(0, 0, W, H);
    const dark = matchMedia('(prefers-color-scheme: dark)').matches;
    const ink = dark ? '#efe9d7' : '#22261a';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    const mark = (h, label, color, size) => { const r = angDiff(CAM.yaw, h), x = W / 2 - r * ppr; if (x < -20 || x > W + 20) return; c.fillStyle = color; c.font = `${size}px Rubik, sans-serif`; c.fillText(label, x, H / 2 + 1); };
    for (let i = 0; i < 24; i++) { const h = i / 24 * TAU, r = angDiff(CAM.yaw, h), x = W / 2 - r * ppr; c.fillStyle = ink; c.globalAlpha = 0.35; c.fillRect(x - 0.5, H - 7, 1, 5); c.globalAlpha = 1; }
    mark(Math.PI, 'צפון', '#e8b04b', 15); mark(Math.PI / 2, 'מזרח', ink, 13); mark(0, 'דרום', ink, 13); mark(-Math.PI / 2, 'מערב', ink, 13);
    const a = P.a; if (!a) return;
    const dot = (x, z, color) => { const h = Math.atan2(x - a.pos.x, z - a.pos.z), r = angDiff(CAM.yaw, h), px = W / 2 - r * ppr; if (px < 6 || px > W - 6) return; c.fillStyle = color; c.beginPath(); c.arc(px, 6, 3.5, 0, TAU); c.fill(); };
    if (P.partner && P.partner.alive) dot(P.partner.pos.x, P.partner.pos.z, '#ff78ab');
    for (const p of P.pings) dot(p.x, p.z, p.love ? '#ff78ab' : '#ee5348');
    vxCompass(dot);
    c.fillStyle = '#e8b04b'; c.fillRect(W / 2 - 1, 0, 2, 5);
  },
  drawMini() {
    if (miniDraw()) return;
    const cv = $('mini'), c = cv.getContext('2d'), S = cv.width, a = P.a; if (!a || !this.mapImg) return;
    const R = S / 2, span = 140, k = S / span, mk = this.mapImg.width / W.size;
    c.save(); c.clearRect(0, 0, S, S); c.beginPath(); c.arc(R, R, R - 1, 0, TAU); c.clip();
    c.translate(R, R); c.rotate(CAM.yaw - Math.PI);
    c.save(); c.scale(k / mk, k / mk); c.drawImage(this.mapImg, -(a.pos.x + W.half) * mk, -(a.pos.z + W.half) * mk); c.restore();
    const pt = (x, z, r, color, ring, edge) => { let dx = (x - a.pos.x) * k, dz = (z - a.pos.z) * k; const dd = Math.hypot(dx, dz); if (dd > R - 6) { if (!edge) return; dx *= (R - 9) / dd; dz *= (R - 9) / dd; } c.beginPath(); c.arc(dx, dz, r, 0, TAU); if (ring) { c.strokeStyle = color; c.lineWidth = 3; c.stroke(); } else { c.fillStyle = color; c.fill(); } };
    shQuery(a.pos.x, a.pos.z, span * 0.55, b => {
      if (b === a) return;
      if (b.hunter) { pt(b.pos.x, b.pos.z, 6, '#f4efe1'); pt(b.pos.x, b.pos.z, 8, 'rgba(20,20,20,.85)', true); }
      else if (b.pet) pt(b.pos.x, b.pos.z, 4, '#9fd3ff');
      else if (b.dead && b.food > 1 && b.tpl.kind === 'quad') pt(b.pos.x, b.pos.z, 5, '#7a1c14');
      else if (b.alive && preys(b, a) && dist2(b.pos, a.pos) < 45 && (b.tpl.kind !== 'fish' || P.fish)) pt(b.pos.x, b.pos.z, 6, '#ee3b2f');
      else if (b.alive && b.spId === P.spId && !b.isPartner && !b.cub && !b.young) pt(b.pos.x, b.pos.z, 5, b.sex === a.sex ? '#f08a3c' : '#f7b6cf');
    });
    for (const c of HUNT.camps) if (!c.gone) pt(c.x, c.z, c.own ? 7 : 6, c.own ? '#e8b04b' : '#c9a46a'); vxMiniDots(pt, a);
    if (DEN.pos && !P.human) pt(DEN.pos.x, DEN.pos.z, 7, '#ffd34d', true, true);
    if (WAY.p) pt(WAY.p.x, WAY.p.z, 6, '#5ab4ff', true, true);
    for (const p of P.pings) pt(p.x, p.z, 8 + (1 - (p.t % 1)) * 8, p.love ? 'rgba(255,120,171,.9)' : 'rgba(238,83,72,.9)', true, true);
    if (DEN.pos) pt(DEN.pos.x, DEN.pos.z, 6, '#ffd34d');
    for (const cb of P.cubs) pt(cb.pos.x, cb.pos.z, 5, '#ffc1d8');
    if (P.human) for (const s of HUNT.spears) if (s.from === a && s.stuck > 0) pt(s.pos.x, s.pos.z, 4, '#ffd34d', false, true);
    if (P.partner && P.partner.alive) pt(P.partner.pos.x, P.partner.pos.z, 7, '#ff78ab', false, true);
    c.restore();
    c.save(); c.translate(R, R); c.rotate(-(a.yaw - CAM.yaw));
    c.fillStyle = '#ffd34d'; c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -13); c.lineTo(9, 10); c.lineTo(0, 5); c.lineTo(-9, 10); c.closePath(); c.stroke(); c.fill();
    c.restore();
    c.beginPath(); c.arc(R, R, R - 2, 0, TAU); c.strokeStyle = 'rgba(232,176,75,.6)'; c.lineWidth = 3; c.stroke();
    const th = CAM.yaw - Math.PI, nx = R + (R - 17) * Math.sin(th), ny = R - (R - 17) * Math.cos(th);
    c.fillStyle = 'rgba(12,22,14,.78)'; c.beginPath(); c.arc(nx, ny, 15, 0, TAU); c.fill();
    c.fillStyle = '#e8b04b'; c.font = '700 19px Rubik, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('צ', nx, ny + 1);
  },
  drawBigMap() {
    if (!this.mapImg) this.mapImg = buildMapImg();
    if (bigMapDraw()) return;
    const cv = $('bigmap'), c = cv.getContext('2d'), S = cv.width, a = P.a; if (!this.mapImg) this.mapImg = buildMapImg();
    c.drawImage(this.mapImg, 0, 0, S, S);
    const m = (x, z) => [(x + W.half) / W.size * S, (z + W.half) / W.size * S];
    c.textAlign = 'center'; c.font = '600 22px Rubik, sans-serif';
    for (const p of POI) { if (!vxPoiShown(p)) continue; const [x, y] = m(p.x, p.z); c.fillStyle = '#e8e2cf'; c.beginPath(); c.arc(x, y, 6, 0, TAU); c.fill(); c.lineWidth = 5; c.strokeStyle = 'rgba(0,0,0,.65)'; c.strokeText(p.n, x, y - 14); c.fillStyle = '#f4efe1'; c.fillText(p.n, x, y - 14); }
    homeOnBigMap(c, m); wayOnBigMap(c, m); vxBigMap(c, m);
    for (const p of P.pings) { const [x, y] = m(p.x, p.z); c.strokeStyle = p.love ? '#ff78ab' : '#ee5348'; c.lineWidth = 4; c.beginPath(); c.arc(x, y, 14, 0, TAU); c.stroke(); }
    if (DEN.pos) { const [x, y] = m(DEN.pos.x, DEN.pos.z); c.fillStyle = '#ffd34d'; c.beginPath(); c.arc(x, y, 9, 0, TAU); c.fill(); c.strokeStyle = '#1c1608'; c.lineWidth = 2; c.stroke(); }
    for (const cb of P.cubs) { const [x, y] = m(cb.pos.x, cb.pos.z); c.fillStyle = '#ffc1d8'; c.beginPath(); c.arc(x, y, 6, 0, TAU); c.fill(); }
    if (P.partner && P.partner.alive) { const [x, y] = m(P.partner.pos.x, P.partner.pos.z); c.fillStyle = '#ff78ab'; c.beginPath(); c.arc(x, y, 9, 0, TAU); c.fill(); }
    if (a) { const [x, y] = m(a.pos.x, a.pos.z); c.save(); c.translate(x, y); c.rotate(Math.atan2(Math.cos(a.yaw), Math.sin(a.yaw)) + Math.PI / 2); c.fillStyle = '#ffd34d'; c.strokeStyle = '#000'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, -20); c.lineTo(13, 14); c.lineTo(0, 7); c.lineTo(-13, 14); c.closePath(); c.stroke(); c.fill(); c.restore(); }
  },
  renderGuide() {
    $('gCount').textContent = `${P.discovered.size} מתוך ${GUIDE_ORDER.length} מינים`;
    const dz = ['לא מסוכן', 'סכנה נמוכה', 'סכנה בינונית', 'סכנה גבוהה'];
    $('gGrid').innerHTML = GUIDE_ORDER.map(id => {
      const s = SPECIES[id];
      if (!P.discovered.has(id)) return `<div class="gi unk"><h4>? ? ?</h4><p>${you('עוד לא ראית', 'עוד לא ראית')} את המין הזה. ${s.land ? `הוא חי ${LANDS[s.land].in}.` : s.hab === 'water' || s.kind === 'fish' ? 'אולי במים?' : s.kind === 'bird' ? 'כדאי להסתכל למעלה.' : 'צריך להמשיך לחפש.'}</p></div>`;
      return `<div class="gi"><h4>${s.he}</h4><div class="gl">${s.lat}</div><p>${s.guide}</p><div class="gm">${s.diet}, ${dz[s.danger || 0]}</div></div>`;
    }).join('');
  },
  setupKeys() {
    const map = { Space: 'jump', KeyF: 'court', KeyG: 'fight', KeyR: 'call', KeyC: 'crouch', KeyZ: 'rest' };
    addEventListener('keydown', e => {
      if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
      KEYS[e.code] = true;
      if (G.mode !== 'play') return;
      if (PROG.choosing) return;
      if (e.code === 'Escape') { if (this.overlay) this.close(); else this.pause(!G.paused); return; }
      if (e.code === 'KeyQ' && !G.paused) { senseActivate(); return; }
      if (e.code === 'KeyM') { this.toggle('map'); return; } if (e.code === 'KeyB') { this.toggle('guide'); return; } if (e.code === 'KeyH') { this.toggle('help'); return; }
      if (G.paused) return;
      if (map[e.code] && !e.repeat) INPUT.press.add(map[e.code]);
    });
    addEventListener('keyup', e => { KEYS[e.code] = false; });
    addEventListener('blur', () => { for (const k in KEYS) KEYS[k] = false; INPUT.use = false; INPUT.joy = false; INPUT.up = INPUT.down = false; });
    const cv = $('c');
    cv.addEventListener('mousedown', e => {
      if (G.mode !== 'play' || G.paused || TC.touchNow) return;
      if (document.pointerLockElement === cv) { if (e.button === 0) { INPUT.press.add('attack'); INPUT.atkHeld = true; } return; }
      TC.drag = { x: e.clientX, y: e.clientY, moved: false };
      if (!this.lockFail && cv.requestPointerLock) { try { const r = cv.requestPointerLock(); if (r && r.catch) r.catch(() => { this.lockFail = true; }); } catch (err) { this.lockFail = true; } TC.drag.lockTry = true; }
    });
    addEventListener('mousemove', e => {
      if (document.pointerLockElement === cv) { INPUT.lookDX += e.movementX; INPUT.lookDY += e.movementY; return; }
      if (TC.drag) { const dx = e.clientX - TC.drag.x, dy = e.clientY - TC.drag.y; if (Math.abs(dx) + Math.abs(dy) > 3) TC.drag.moved = true; INPUT.lookDX += dx * 1.4; INPUT.lookDY += dy * 1.4; TC.drag.x = e.clientX; TC.drag.y = e.clientY; }
    });
    addEventListener('mouseup', e => { if (e.button === 0) INPUT.atkHeld = false; if (TC.drag && !TC.drag.moved && !TC.drag.lockTry && G.mode === 'play' && !G.paused) INPUT.press.add('attack'); TC.drag = null; });
    document.addEventListener('pointerlockerror', () => { this.lockFail = true; this.notify('אפשר לסובב את המצלמה בגרירה עם העכבר. קליק קצר תוקף'); });
    document.addEventListener('pointerlockchange', () => { if (!document.pointerLockElement && G.mode === 'play' && !G.paused && !this.overlay && !TOUCH) this.pause(true); });
    cv.addEventListener('wheel', e => { e.preventDefault(); INPUT.zoom += e.deltaY; }, { passive: false });
    cv.addEventListener('contextmenu', e => e.preventDefault());
    addEventListener('resize', () => this.checkRotate());
    document.addEventListener('visibilitychange', () => { if (document.hidden && G.mode === 'play' && !G.paused) this.pause(true); });
  }
};
function setupTouch() {
  document.body.classList.add('touch');
  const tb = $('touch');
  const lc = document.createElement('div'); lc.id = 'lcol'; $('hud').appendChild(lc); lc.append($('goals'), $('family'), $('feed'));
  const lab = { tAtk: [ICON.claw, 'תקיפה'], tJump: [ICON.jump, 'קפיצה'], tLove: [ICON.heart, 'חיזור'], tFight: [ICON.fight, 'אתגר'], tRun: [ICON.run, 'ריצה'], tCrouch: [ICON.sneak, 'התגנבות'], tCall: [ICON.call, 'קריאה'], tRest: [ICON.moon, 'מנוחה'], tPause: [ICON.pause, ''], tGuide: [ICON.book, ''] };
  for (const id in lab) { $(id).innerHTML = lab[id][0] + (lab[id][1] ? `<small>${lab[id][1]}</small>` : ''); $(id).setAttribute('aria-label', lab[id][1] || (id === 'tPause' ? 'השהיה' : 'ספר השדה')); }
  const jz = $('joyZone'), lz = $('lookZone'), joy = $('joy'), knob = joy.firstElementChild, R = 52;
  const busy = () => G.mode !== 'play' || G.paused;
  jz.addEventListener('pointerdown', e => {
    e.preventDefault(); TC.touchNow = true; if (busy() || TC.joyId !== null) return;
    TC.joyId = e.pointerId; try { jz.setPointerCapture(e.pointerId); } catch (err) { }
    TC.jx0 = e.clientX; TC.jy0 = e.clientY; joy.style.left = e.clientX + 'px'; joy.style.top = e.clientY + 'px'; joy.classList.add('on');
    INPUT.joy = true; INPUT.jx = INPUT.jy = INPUT.jmag = 0; knob.style.transform = ''; AUD.resume();
  });
  jz.addEventListener('pointermove', e => {
    if (e.pointerId !== TC.joyId) return;
    let dx = e.clientX - TC.jx0, dy = e.clientY - TC.jy0; const d = Math.hypot(dx, dy);
    if (d > R) { dx *= R / d; dy *= R / d; }
    if (d > R * 1.9) { const k = (d - R * 1.9) / d; TC.jx0 += (e.clientX - TC.jx0) * k; TC.jy0 += (e.clientY - TC.jy0) * k; joy.style.left = TC.jx0 + 'px'; joy.style.top = TC.jy0 + 'px'; }
    knob.style.transform = `translate(${dx.toFixed(1)}px,${dy.toFixed(1)}px)`;
    INPUT.jx = dx / R; INPUT.jy = -dy / R; INPUT.jmag = d > R * 1.3 ? 1 : Math.min(0.9, d / R);
    joy.classList.toggle('run', INPUT.jmag > 0.94);
  });
  const jend = e => { if (e.pointerId !== TC.joyId) return; TC.joyId = null; INPUT.joy = false; INPUT.jx = INPUT.jy = INPUT.jmag = 0; joy.classList.remove('on', 'run'); knob.style.transform = ''; joy.style.left = ''; joy.style.top = ''; };
  jz.addEventListener('pointerup', jend); jz.addEventListener('pointercancel', jend); jz.addEventListener('lostpointercapture', jend);
  lz.addEventListener('pointerdown', e => {
    e.preventDefault(); TC.touchNow = true; if (busy()) return;
    TC.pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); try { lz.setPointerCapture(e.pointerId); } catch (err) { }
    if (TC.pts.size === 2) { const [p, q] = [...TC.pts.values()]; TC.pinch = Math.hypot(p.x - q.x, p.y - q.y); }
    INPUT.looking = true; if (P.coil) INPUT.press.add('jump'); AUD.resume();
  });
  lz.addEventListener('pointermove', e => {
    const p = TC.pts.get(e.pointerId); if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
    if (TC.pts.size >= 2) { const [p1, p2] = [...TC.pts.values()]; const d = Math.hypot(p1.x - p2.x, p1.y - p2.y); if (TC.pinch) INPUT.zoom += (TC.pinch - d) * 3; TC.pinch = d; }
    else { INPUT.lookDX += dx * 1.6; INPUT.lookDY += dy * 1.3; }
  });
  const lend = e => { TC.pts.delete(e.pointerId); if (TC.pts.size < 2) TC.pinch = null; if (!TC.pts.size) INPUT.looking = false; };
  lz.addEventListener('pointerup', lend); lz.addEventListener('pointercancel', lend); lz.addEventListener('lostpointercapture', lend);
  const btn = (id, down, up) => {
    const b = $(id);
    b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); TC.touchNow = true; try { b.setPointerCapture(e.pointerId); } catch (err) { } b.classList.add('down'); AUD.resume(); if (G.mode === 'play' && (!G.paused || id === 'tPause')) down && down(); });
    const u = () => { if (!b.classList.contains('down')) return; b.classList.remove('down'); up && up(); };
    b.addEventListener('pointerup', u); b.addEventListener('pointercancel', u); b.addEventListener('lostpointercapture', u);
    b.addEventListener('contextmenu', e => e.preventDefault());
  };
  btn('tAtk', () => { INPUT.press.add('attack'); INPUT.atkHeld = true; }, () => { INPUT.atkHeld = false; }); btn('tJump', () => { if (P.fish || P.bird || (P.human && P.dive)) INPUT.up = true; else INPUT.press.add('jump'); }, () => { INPUT.up = false; });
  btn('tUse', () => { INPUT.use = true; }, () => { INPUT.use = false; });
  btn('tLove', () => INPUT.press.add('court')); btn('tFight', () => INPUT.press.add('fight'));
  btn('tRun', () => { INPUT.run = !INPUT.run; }); btn('tCrouch', () => { if (P.fish || P.bird || (P.human && P.dive)) INPUT.down = true; else INPUT.press.add('crouch'); }, () => { INPUT.down = false; }); btn('tCall', () => { TC.callDown = performance.now(); }, () => { if (performance.now() - (TC.callDown || 0) > 450) companionCmd(); else INPUT.press.add('call'); });
  btn('tRest', () => { INPUT.restHold = true; TC.restT = performance.now(); }, () => { INPUT.restHold = false; if (performance.now() - TC.restT < 650) INPUT.press.add('rest'); });
  btn('tPause', () => UI.pause(true)); btn('tGuide', () => UI.open('guide'));
  $('tSense').innerHTML = ICON.eye; $('tSense').setAttribute('aria-label', 'חושים'); btn('tSense', () => senseActivate());
  $('tHud').innerHTML = INFO_ICON; $('tHud').setAttribute('aria-label', 'מידע'); btn('tHud', () => openInfo());
  $('mini').addEventListener('click', () => { if (G.mode === 'play' && !G.paused && !UI.overlay) UI.open('map'); });
  tb.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('gesturestart', e => e.preventDefault());
}
function tryFullscreen() {
  const el = document.documentElement;
  try {
    const r = el.requestFullscreen ? el.requestFullscreen({ navigationUI: 'hide' }) : el.webkitRequestFullscreen ? el.webkitRequestFullscreen() : null;
    if (r && r.then) r.then(() => { try { const o = screen.orientation; if (o && o.lock) o.lock('landscape').catch(() => { }); } catch (e) { } }).catch(() => { });
  } catch (e) { }
}
function buildMapImg() {
  const S = PHONE ? 768 : 1024, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const c = cv.getContext('2d'), img = c.createImageData(S, S), d = img.data;
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
    const x = (i + 0.5) / S * W.size - W.half, z = (j + 0.5) / S * W.size - W.half, q = mapColorAt(x, z, _mco);
    const k = (j * S + i) * 4; d[k] = q[0]; d[k + 1] = q[1]; d[k + 2] = q[2]; d[k + 3] = 255;
  }
  c.putImageData(img, 0, 0);
  cv.px = d;   // the pixels kept (the globe's picture is made from them: reading a canvas back can be very slow)
  return cv;
}
