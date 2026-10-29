// ================= ONLINE: one world for everyone who plays =================
// In the web version (published on claude.ai) everyone who has the game open is in one room. You see the others where
// they are: on the globe, on the maps and in the world itself, with their names over their heads. You can wave to them,
// write to everyone and send a gift of food, wood or gold. The villages of everyone who has played are written in the
// world's book, so the globe shows them even when their chief is not playing. Where there is no room (the Android app,
// or a copy of the page kept on a computer) none of this runs and the world is yours alone.
const ONL = { room: null, user: null, db: null, ok: false, conn: false, myId: null, myPeer: null, keys: [], sent: '', sendT: 0,
  pup: new Map(), seenCh: {}, seenEm: {}, chat: null, em: null, gifts: [], got: new Set(), book: [], bookOK: true, wrote: '', wroteT: 0, pos0: null,
  names: {}, nameT: 0, chip: null, tb: null, nOn: 0 };
const ONL_POSES = new Set(['idle', 'move', 'swim', 'ride', 'sit', 'sleep', 'talk', 'aim', 'spear', 'chop', 'gather', 'carry', 'paddle', 'fish', 'climb', 'crouch', 'kneel', 'build', 'eat', 'drink', 'rest', 'lie']);
const ONL_COL = '#4fd2ff';
async function onlineInit() {
  const C = window.claude; if (!C || typeof C.use !== 'function') return;
  let room = null; try { room = await C.use('room'); } catch (e) { room = null; }
  if (!room) return;
  ONL.room = room; ONL.ok = true;
  try { ONL.user = await C.use('user'); } catch (e) { ONL.user = null; }
  if (ONL.user) { try { ONL.myId = await ONL.user.id(); } catch (e) { ONL.myId = null; } }
  try { ONL.got = new Set(JSON.parse(localStorage.getItem('amazonia-gifts') || '[]')); } catch (e) { ONL.got = new Set(); }
  room.onConnection(c => { ONL.conn = c; onlineChip(); }, () => { ONL.conn = false; onlineChip(); });
  room.onPeers(() => { ONL.dirty = true; }, () => { });
  setInterval(() => { try { onlineTick(); } catch (e) { reportErr(e); } }, 200);
  // the world's book: everyone's village, kept
  try { ONL.db = await C.use('db'); } catch (e) { ONL.db = null; }
  if (ONL.db) {
    try {
      ONL.db.collection('world').orderBy('at', 'desc').limit(150).onSnapshot(s => {
        ONL.book = s.docs.filter(d => d.exists && d.id !== ONL.myId).map(d => onlineRec(d.id, d.data())).filter(Boolean);
      }, () => { ONL.book = []; });
    } catch (e) { ONL.db = null; }
  }
}
// what another page wrote is untrusted: only plain numbers and short strings are taken from it
// text from other players goes into HTML only escaped
const escH = s => String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const onlNum = (v, lo, hi) => typeof v === 'number' && Number.isFinite(v) ? clamp(v, lo, hi) : null;
const onlStr = (v, n) => typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f​-‏‪-‮⁦-⁩]/g, '').slice(0, n) : '';
function onlineRec(id, d) {
  if (!d) return null;
  const x = onlNum(d.x, -1e5, 1e5), z = onlNum(d.z, -W.half, W.half); if (x === null || z === null) return null;
  return { id, x, z, vn: onlStr(d.vn, 40), pop: onlNum(d.pop, 0, 9999) || 0, tier: onlNum(d.tier, -1, 9) ?? -1, sp: onlStr(d.sp, 20), at: onlNum(d.at, 0, 1e14) || 0 };
}
// you, for everyone else: where you are, how you move, your village; a word, a wave or a gift while it lasts
function onlinePresence() {
  const a = P.a;
  if (G.mode !== 'play' || !a || !a.alive) return { g: 0 };
  const v = P.human && ownCamp(), r1 = n => Math.round(n * 10) / 10;
  const o = { g: 1, sp: P.spId, tp: a.tplKey, sx: a.sex, x: r1(a.pos.x), z: r1(a.pos.z), y: Math.round(a.pos.y * 100) / 100, r: Math.round(a.yaw * 100) / 100, s: r1(a.speed || 0), po: a.pose || 'idle' };
  if (a.mount && a.mount.alive) { o.mt = a.mount.spId; o.mtp = a.mount.tplKey; }
  if (P.boat || P.ship) o.bt = P.ship ? 2 : 1;
  if (v) { o.vn = vxVillageName(); o.vx = Math.round(v.x); o.vz = Math.round(v.z); o.pop = popCount(); o.tier = Math.max(0, villageTier()); }
  if (ONL.chat) o.ch = ONL.chat; if (ONL.em) o.em = ONL.em; if (ONL.gifts.length) o.gf = ONL.gifts;
  return o;
}
function onlineTick() {
  if (!ONL.ok) return;
  const now = Date.now(), R = ONL.room;
  ONL.gifts = ONL.gifts.filter(g => now - g.t < 90000);
  if (ONL.chat && now - ONL.chat.t > 120000) ONL.chat = null;
  if (ONL.em && now - ONL.em.t > 6000) ONL.em = null;
  // send only what changed, the whole of it (a field no longer there is cleared)
  const pr = onlinePresence(), js = JSON.stringify(pr);
  if (js !== ONL.sent) {
    const patch = Object.assign({}, pr); for (const k of ONL.keys) if (!(k in pr)) patch[k] = null;
    ONL.keys = Object.keys(pr); ONL.sent = js; ONL.sendT = now;
    R.presence(patch).catch(() => { ONL.sent = ''; });
  }
  // the others
  const seen = new Set(); let n = 0;
  for (const p of R.peers()) {
    if (p.isMe) { if (p.sameTab) ONL.myPeer = p.peer; continue; }
    if (p.kind !== 'viewer') continue;
    seen.add(p.peer); onlinePeer(p, now); if (p.presence && p.presence.g === 1) n++;
  }
  for (const [k, e] of ONL.pup) if (!seen.has(k)) { if (e.told && e.pr && e.pr.g === 1) UI.notify(`🌍 ${onlineName(e)} ${e.pr.sx === 'f' ? 'יצאה' : 'יצא'} מהעולם`, ''); onlineDrop(e); if (e.lbl) e.lbl.remove(); ONL.pup.delete(k); }
  // who came in: told once their name is known (or after a moment without one)
  for (const e of ONL.pup.values()) if (!e.told && e.pr && e.pr.g === 1 && (ONL.names[e.by] || now - e.t0 > 2500)) { e.told = true; UI.notify(`🌍 ${onlineName(e)} ${e.pr.sx === 'f' ? 'נכנסה' : 'נכנס'} לעולם`, ''); }
  ONL.nOn = n;
  // their names, now and then (names are resolved here, never sent)
  if (ONL.user && now - ONL.nameT > 3000) { ONL.nameT = now; onlineNames([...ONL.pup.values()].map(e => e.by).concat(ONL.book.map(b => b.id))); }
  onlineBook(now); onlineChip();
}
function onlineNames(ids) {
  ids = [...new Set(ids.filter(Boolean))]; if (!ids.length || !ONL.user) return;
  ONL.user.profiles(ids).then(ps => { for (const id of ids) if (ps[id] && ps[id].name) ONL.names[id] = ps[id].name; }).catch(() => { });
}
const onlineNameOf = (id, fb) => (id && ONL.names[id]) || fb || 'שחקן';
const onlineName = e => onlineNameOf(e.by, e.pr && e.pr.vn ? `ראש ${e.pr.vn}` : e.pr && e.pr.sp && e.pr.sp !== 'hunter' && SPECIES[e.pr.sp] ? SPECIES[e.pr.sp].he : 'צייד');
function onlinePeer(p, now) {
  const pr = p.presence || {};
  let e = ONL.pup.get(p.peer);
  const first = !e;
  if (!e) { e = { peer: p.peer, by: p.by, pr: null, b: null, m: null, lbl: null, t0: now, told: false }; ONL.pup.set(p.peer, e); if (p.by) onlineNames([p.by]); }
  e.pr = pr; e.by = p.by; e.guest = p.guest;
  // a word to everyone (what was said before you came in is not repeated)
  const ch = pr.ch && typeof pr.ch === 'object' ? pr.ch : null, cht = ch ? onlNum(ch.t, 0, 1e14) : null;
  if (cht !== null && cht !== ONL.seenCh[p.peer]) {
    if (!first && ONL.seenCh[p.peer] !== undefined || (first && now - (p.updatedAt || now) < 15000 && now - cht < 20000)) {
      const m = onlStr(ch.m, 140); if (m) { UI.notify(`💬 ${onlineName(e)}: ${m}`, ''); if (e.b) say(e.b, m, 5); }
    }
    ONL.seenCh[p.peer] = cht;
  } else if (cht === null && ONL.seenCh[p.peer] === undefined) ONL.seenCh[p.peer] = 0;
  // a wave
  const em = pr.em && typeof pr.em === 'object' ? pr.em : null, emt = em ? onlNum(em.t, 0, 1e14) : null;
  if (emt !== null && emt !== ONL.seenEm[p.peer]) {
    if (!first) { if (e.b) gesture(e.b, em.k === 'cheer' ? 'cheer' : 'wave', 2); if (em.to && (em.to === ONL.myId || em.to === ONL.myPeer)) UI.notify(`👋 ${onlineName(e)} ${pr.sx === 'f' ? 'מנפנפת' : 'מנפנף'} לך`, 'good'); }
    ONL.seenEm[p.peer] = emt;
  }
  // gifts to you: each one taken once
  if (Array.isArray(pr.gf)) for (const g of pr.gf.slice(0, 4)) {
    if (!g || typeof g !== 'object' || typeof g.id !== 'string' || ONL.got.has(g.id)) continue;
    if (!(g.to && (g.to === ONL.myId || g.to === ONL.myPeer))) continue;
    const k = g.k === 'wood' || g.k === 'gold' ? g.k : 'food', n = Math.round(onlNum(g.n, 0, 50) || 0); if (!n) continue;
    ONL.got.add(g.id); try { localStorage.setItem('amazonia-gifts', JSON.stringify([...ONL.got].slice(-200))); } catch (err) { /* once is enough */ }
    onlineReceive(k, n, e);
  }
}
// ---------- the others in your world: a body that moves where they move, their name over their head ----------
function onlineBody(e) {
  const pr = e.pr, sp = typeof pr.sp === 'string' && SPECIES[pr.sp] && PLAYABLE.includes(pr.sp) ? pr.sp : 'hunter';
  let tp = typeof pr.tp === 'string' && TPL[pr.tp] && TPL[pr.tp].kind === (SPECIES[sp].tpls ? TPL[SPECIES[sp].tpls[0]] : TPL[sp] || {}).kind ? pr.tp : undefined;
  if (sp === 'hunter' && !tp) tp = pr.sx === 'f' ? 'hunter3' : 'hunter0';
  try {
    const b = new Animal(sp, pr.x, pr.z, { sex: pr.sx === 'f' ? 'f' : 'm', tpl: tp, scale: 1, yaw: onlNum(pr.r, -50, 50) || 0 });
    const i = ANIMALS.indexOf(b); if (i >= 0) ANIMALS.splice(i, 1);   // out of the living world: nobody hunts it, it hunts nobody
    Object.assign(b, { online: e.peer, brain: 'mount', socialExtra: true, frozen: true, name: onlineName(e) });
    e.b = b;
  } catch (err) { e.bad = true; }
}
function onlineMount(e) {
  const pr = e.pr, id = pr.mt === 'camel' ? 'camel' : 'horse';
  try { const m = mountAnimal(id, e.b.pos.x, e.b.pos.z, {}); const i = ANIMALS.indexOf(m); if (i >= 0) ANIMALS.splice(i, 1); Object.assign(m, { online: e.peer, brain: 'mount', socialExtra: true, frozen: true }); e.m = m; e.mid = id; } catch (err) { e.m = null; }
}
function onlineDrop(e) {
  if (e.b) { e.b.gone = true; scene.remove(e.b.mesh); if (e.b.mesh.skeleton) e.b.mesh.skeleton.dispose(); e.b = null; }
  if (e.m) { e.m.gone = true; scene.remove(e.m.mesh); if (e.m.mesh.skeleton) e.m.mesh.skeleton.dispose(); e.m = null; }
  if (e.lbl) e.lbl.style.display = 'none';
}
// every frame of the game: they glide to where they are, walk, ride, wave
function onlineFrame(dt) {
  if (!ONL.ok || !ONL.pup.size) return;
  const play = G.mode === 'play' && !G.paused, cam = camera.position;
  for (const e of ONL.pup.values()) {
    const pr = e.pr, x0 = pr ? onlNum(pr.x, -1e5, 1e5) : null, z0 = pr ? onlNum(pr.z, -W.half, W.half) : null;
    if (G.mode !== 'play' || !pr || pr.g !== 1 || x0 === null || z0 === null || e.bad) { onlineDrop(e); continue; }
    const tx = cam.x + ringDX(cam.x, x0), tz = z0, d = Math.hypot(tx - cam.x, tz - cam.z);
    if (d > 420) { onlineDrop(e); continue; }
    if (!e.b) { onlineBody(e); if (!e.b) continue; e.b.pos.set(tx, 0, tz); e.b.ground(1, true); }
    if (!play) continue;
    const b = e.b, dx = tx - b.pos.x, dz = tz - b.pos.z, dd = Math.hypot(dx, dz);
    if (dd > 35) { b.pos.x = tx; b.pos.z = tz; } else { const k = Math.min(1, dt * 7); b.pos.x += dx * k; b.pos.z += dz * k; }
    b.yaw += angDiff(b.yaw, onlNum(pr.r, -50, 50) || 0) * Math.min(1, dt * 8);
    b.speed = onlNum(pr.s, 0, 40) || 0;
    b.pose = typeof pr.po === 'string' && ONL_POSES.has(pr.po) ? pr.po : b.speed > 0.3 ? 'move' : 'idle';
    const riding = typeof pr.mt === 'string' && (pr.mt === 'horse' || pr.mt === 'camel');
    if (riding && (!e.m || e.mid !== (pr.mt === 'camel' ? 'camel' : 'horse'))) { if (e.m) { scene.remove(e.m.mesh); e.m = null; } onlineMount(e); }
    if (!riding && e.m) { scene.remove(e.m.mesh); e.m = null; }
    if (e.m) {
      const m = e.m, back = m.tpl.L * 0.08 * m.scale;
      m.pos.x = b.pos.x + Math.sin(b.yaw) * back; m.pos.z = b.pos.z + Math.cos(b.yaw) * back; m.yaw = b.yaw; m.speed = b.speed; m.pose = b.speed > 0.2 ? 'move' : 'idle'; m.ground(dt);
      b.pos.y = m.pos.y + seatY(m); b.pose = 'ride';
      m.mesh.position.copy(m.pos); m.mesh.rotation.y = m.yaw; m.mesh.visible = d < 260; if (d < 150) animate(m, dt);
    } else if (pr.bt) { const y = onlNum(pr.y, -50, 400); if (y !== null) b.pos.y += (y - b.pos.y) * Math.min(1, dt * 6); }
    else b.ground(dt);
    b.mesh.position.copy(b.pos); b.mesh.rotation.y = b.yaw;
    const vis = d < 260; b.mesh.visible = vis; b.mesh.matrixWorldAutoUpdate = vis;
    if (b.gestT > 0) { b.gestT -= dt; if (b.gestT <= 0) b.gest = null; }
    if (vis && d < 150) animate(b, dt);
    onlineLabel(e, d);
  }
}
function onlineLabel(e, d) {
  if (!e.lbl) { const el = document.createElement('div'); el.className = 'onlbl'; document.body.appendChild(el); e.lbl = el; }
  const el = e.lbl, b = e.b;
  if (!b || d > 75 || !b.mesh.visible || G.paused || G.mode !== 'play') { el.style.display = 'none'; return; }
  _tmp.set(b.pos.x, b.pos.y + (b.height || 1.7) * b.scale + 0.5, b.pos.z); _tmp.project(camera);
  if (_tmp.z > 1 || Math.abs(_tmp.x) > 1.2 || Math.abs(_tmp.y) > 1.2) { el.style.display = 'none'; return; }
  el.style.display = 'block'; el.style.left = `${(_tmp.x * 0.5 + 0.5) * innerWidth}px`; el.style.top = `${(-_tmp.y * 0.5 + 0.5) * innerHeight}px`;
  const t = `🌍 ${onlineName(e)}`; if (el.textContent !== t) el.textContent = t;
  if (b.name !== onlineName(e)) b.name = onlineName(e);
}
// ---------- the world's book: your village is written in it when it changes ----------
function onlineBook(now) {
  if (!ONL.db || !ONL.myId || !ONL.bookOK || G.mode !== 'play' || !P.a || !P.a.alive) return;
  const v = P.human && ownCamp(), at = v ? { x: v.x, z: v.z } : (ONL.pos0 || (ONL.pos0 = { x: P.a.pos.x, z: P.a.pos.z }));
  const rec = { v: 1, sp: P.spId, vn: v ? vxVillageName() : '', x: Math.round(wrapX(at.x)), z: Math.round(at.z), pop: v ? popCount() : 1, tier: v ? Math.max(0, villageTier()) : -1 };
  const key = JSON.stringify(rec); if (key === ONL.wrote || now - ONL.wroteT < 45000) return;
  ONL.wrote = key; ONL.wroteT = now;
  ONL.db.doc('world/' + ONL.myId).set(Object.assign(rec, { at: now })).catch(err => { if (!err || err.code !== 'unavailable') ONL.bookOK = false; });
}
// ---------- waves, words and gifts ----------
function onlineWave(e) {
  ONL.em = { t: Date.now(), k: 'wave', to: e ? (e.by || e.peer) : '' };
  if (P.a && P.human) gesture(P.a, 'wave', 1.8);
  if (e) UI.notify(`👋 נפנפת ל${onlineName(e)}`, 'good');
}
function onlineSay(text) {
  const m = onlStr(text, 140).trim(); if (!m) return false;
  if (ONL.chat && Date.now() - ONL.chat.t < 1500) { UI.notify('רגע, לאט יותר', 'bad'); return false; }
  ONL.chat = { t: Date.now(), m }; UI.notify(`💬 ${you('אתה', 'את')}: ${m}`, 'good'); if (P.a) say(P.a, m, 4);
  return true;
}
const ONL_GIFT = { food: [8, '🍖', 'מנות אוכל'], wood: [12, '🪵', 'עצים'], gold: [6, '🪙', 'זהב'] };
function onlineCanGive(k) {
  const n = ONL_GIFT[k][0], st = boxStore();
  if (k === 'gold') return goldHave() >= n;
  if (k === 'wood') return woodHave() >= n;
  return (P.inv.cooked || 0) + (P.inv.meat || 0) + (P.inv.fish || 0) + (st.cooked || 0) + (st.meat || 0) + (st.fish || 0) >= n;
}
function onlineGive(e, k) {
  if (!e || !ONL_GIFT[k] || !onlineCanGive(k)) return false;
  const [n, ic, w] = ONL_GIFT[k], st = boxStore();
  if (k === 'gold') goldPay(n);
  else if (k === 'wood') { let r = n; const a = Math.min(r, P.inv.wood || 0); P.inv.wood -= a; r -= a; st.wood = Math.max(0, (st.wood || 0) - r); }
  else { let r = n; for (const src of [P.inv, st]) for (const f of ['cooked', 'meat', 'fish']) { const a = Math.min(r, src[f] || 0); src[f] = (src[f] || 0) - a; r -= a; } }
  ONL.gifts = ONL.gifts.concat({ id: (ONL.myPeer || 'p') + '-' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36), to: e.by || e.peer, k, n, t: Date.now() }).slice(-3);
  UI.notify(`🎁 שלחת ל${onlineName(e)} ${n} ${w}`, 'good'); AUD.play('chime', 0.4); saveGame();
  return true;
}
function onlineReceive(k, n, e) {
  const [, ic, w] = ONL_GIFT[k], st = boxStore(), v = P.human && ownCamp();
  if (k === 'gold') goldAdd(n);
  else if (k === 'wood') { if (v) st.wood = (st.wood || 0) + n; else P.inv.wood = (P.inv.wood || 0) + n; }
  else if (v) st.cooked = (st.cooked || 0) + n; else P.inv.cooked = (P.inv.cooked || 0) + n;
  UI.notify(`🎁 ${onlineName(e)} ${e.pr && e.pr.sx === 'f' ? 'שלחה' : 'שלח'} לך ${n} ${w} ${ic}`, 'good'); AUD.play('chime', 0.6); saveGame();
}
// ---------- on the screen: how many are here, and the window of the shared world ----------
function onlineChip() {
  if (!ONL.chip) {
    const hud = document.getElementById('hud'); if (!hud) return;
    const c = document.createElement('button'); c.id = 'onlChip'; c.className = 'pn'; c.hidden = true; c.addEventListener('click', () => onlineOpen()); hud.appendChild(c); ONL.chip = c;
    const tt = document.getElementById('ttop');
    if (tt) { const b = document.createElement('button'); b.id = 'tOnl'; b.className = 'tb'; b.hidden = true; b.setAttribute('aria-label', 'השחקנים בעולם'); b.addEventListener('click', () => onlineOpen()); tt.appendChild(b); ONL.tb = b; }
  }
  const on = ONL.ok && ONL.conn && G.mode === 'play', n = ONL.nOn, t = n ? `🌍 ${n === 1 ? 'עוד שחקן אחד בעולם' : `עוד ${n} שחקנים בעולם`}` : '🌍 העולם המשותף';
  ONL.chip.hidden = !on || TOUCH; if (ONL.chip.textContent !== t) ONL.chip.textContent = t;
  if (ONL.tb) { ONL.tb.hidden = !on || !TOUCH; const s = `🌍${n ? `<b>${n}</b>` : ''}`; if (ONL.tb.innerHTML !== s) ONL.tb.innerHTML = s; }
}
const onlWhere = (x, z) => { const a = P.a; if (!a) return ''; const d = Math.hypot(ringDX(a.pos.x, x), z - a.pos.z); return `${LANDS[landAt(x, z)] ? LANDS[landAt(x, z)].n : ''} · ${d < 1000 ? `${Math.round(d)} מ׳` : `${(d / 1000).toFixed(1)} ק״מ`}`; };
function onlineAgo(t) { const m = Math.round((Date.now() - t) / 60000); return m < 2 ? 'עכשיו' : m < 60 ? `לפני ${m} דקות` : m < 48 * 60 ? `לפני ${Math.round(m / 60)} שעות` : `לפני ${Math.round(m / 1440)} ימים`; }
function onlineOpen() {
  if (G.mode !== 'play') return;
  const L = [...ONL.pup.values()].filter(e => e.pr && e.pr.g === 1), H = P.human;
  const rows = L.map((e, k) => {
    const pr = e.pr, sp = SPECIES[pr.sp] && pr.sp !== 'hunter' ? SPECIES[pr.sp].he : pr.sx === 'f' ? 'ציידת' : 'צייד', gift = H && pr.sp === 'hunter';
    return `<div class="onrow"><div><b>${''}</b><span>${sp}${pr.vn ? ` · ${escH(onlStr(pr.vn, 40))}${onlNum(pr.pop, 0, 9999) ? ` (${Math.round(pr.pop)} אנשים)` : ''}` : ''} · ${onlWhere(+pr.x, +pr.z)}</span></div><div class="onbt"><button class="btn" data-k="${k}" data-a="go">📍</button><button class="btn" data-k="${k}" data-a="wave">👋</button>${gift ? `<button class="btn" data-k="${k}" data-a="gift">🎁</button>` : ''}</div></div>`;
  }).join('');
  const book = ONL.book.filter(r => !L.some(e => e.by && e.by === r.id)).slice(0, 30);
  const brows = book.map((r, k) => `<div class="onrow"><div><b>${''}</b><span>${r.vn ? `${escH(r.vn)}${r.pop ? ` · ${Math.round(r.pop)} אנשים` : ''}` : 'בלי כפר'} · ${onlWhere(r.x, r.z)} · ${onlineAgo(r.at)}</span></div><div class="onbt"><button class="btn" data-b="${k}" data-a="mark">📍</button></div></div>`).join('');
  const el = uiCard('onlov', `<div class="vxwho"><span class="vxic">🌍</span><div><h2>העולם המשותף</h2><p class="idim">${ONL.conn ? (L.length ? `${L.length === 1 ? 'עוד שחקן אחד משחק' : `עוד ${L.length} שחקנים משחקים`} עכשיו באותו עולם` : 'עכשיו אין עוד שחקנים בעולם') : 'אין חיבור כרגע'}</p></div></div>` +
    (L.length ? `<div class="onl" id="onlPeers">${rows}</div>` : '<p class="idim">כשחברים ששיתפת איתם את המשחק נכנסים, הם מופיעים כאן, על הגלובוס ובעולם עצמו.</p>') +
    `<div class="onsay"><input id="onlTxt" maxlength="140" placeholder="לכתוב לכל מי שבעולם…" autocomplete="off"><button class="btn pri" data-a="say">💬 לשלוח</button><button class="btn" data-a="wave">👋 לנפנף לכולם</button></div>` +
    (brows ? `<h3>📖 ספר העולם: הכפרים של כל השחקנים</h3><div class="onl" id="onlBook">${brows}</div>` : '') +
    `<p class="idim">השחקנים שמחוברים מופיעים בכחול על הגלובוס, במפה ובמפה הקטנה. ${ONL.db ? 'הכפר שלך נכתב בספר העולם, ושחקנים אחרים רואים אותו על הגלובוס.' : ''}</p>` +
    '<div class="btns vxbtns"><button class="btn" data-a="close">סגירה</button></div>');
  el.querySelector('.card').classList.add('vxcard');
  // the names are other people's own text: written as text, never as HTML
  const pb = el.querySelector('#onlPeers'), bb = el.querySelector('#onlBook');
  if (pb) L.forEach((e, k) => { const b = pb.children[k] && pb.children[k].querySelector('b'); if (b) b.textContent = onlineName(e) + (e.guest ? ' · אורח' : ''); });
  if (bb) book.forEach((r, k) => { const b = bb.children[k] && bb.children[k].querySelector('b'); if (b) b.textContent = onlineNameOf(r.id, 'שחקן'); });
  const inp = el.querySelector('#onlTxt');
  for (const t of ['keydown', 'keyup', 'keypress']) inp.addEventListener(t, ev => { ev.stopPropagation(); if (t === 'keydown' && ev.key === 'Enter' && onlineSay(inp.value)) inp.value = ''; });
  el.onclick = ev => {
    const b = ev.target.closest('button'); if (!b) return;
    const A = b.dataset.a, e = b.dataset.k != null ? L[+b.dataset.k] : null, r = b.dataset.b != null ? book[+b.dataset.b] : null;
    if (A === 'close') { closeCard('onlov'); return; }
    if (A === 'say') { if (onlineSay(inp.value)) inp.value = ''; return; }
    if (A === 'wave') { onlineWave(e); if (!e) UI.notify('👋 נפנפת לכל מי שבעולם', 'good'); return; }
    if (A === 'go' && e) { setWay(+e.pr.x, +e.pr.z, false, onlineName(e)); closeCard('onlov'); return; }
    if (A === 'mark' && r) { setWay(r.x, r.z, false, r.vn || onlineNameOf(r.id)); closeCard('onlov'); return; }
    if (A === 'gift' && e) { onlineGiftCard(e); return; }
  };
}
function onlineGiftCard(e) {
  const btn = k => { const [n, ic, w] = ONL_GIFT[k], ok = onlineCanGive(k); return `<button class="btn${ok ? ' pri' : ''}" data-g="${k}"${ok ? '' : ' disabled'}>${ic} ${n} ${w}</button>`; };
  const el = uiCard('onlov', `<div class="vxwho"><span class="vxic">🎁</span><div><h2>מתנה ל<span id="onlTo"></span></h2><p class="idim">היא מגיעה אליו מיד, אם הוא מחובר</p></div></div><div class="btns vxbtns">${btn('food')}${btn('wood')}${btn('gold')}<button class="btn" data-a="back">חזרה</button></div>`);
  el.querySelector('#onlTo').textContent = onlineName(e);
  el.onclick = ev => { const b = ev.target.closest('button'); if (!b || b.disabled) return; if (b.dataset.g) { onlineGive(e, b.dataset.g); onlineOpen(); return; } onlineOpen(); };
}
// ---------- on the maps: the others (blue) and the villages of the world's book ----------
function onlineMapMarks(c, proj, L, F, big) {
  if (!ONL.ok) return;
  for (const r of ONL.book) {
    if ([...ONL.pup.values()].some(e => e.by === r.id && e.pr && e.pr.g === 1) || r.tier < 0) continue;
    const q = proj(r.x, r.z); if (!q) continue;
    icHouse(c, q[0], q[1], big ? 8 : 5, '#7fd8ff');
    if (big) { L.push({ t: `🌍 ${r.vn || onlineNameOf(r.id)}`, x: q[0], y: q[1] - 18, p: 66, f: `700 12px ${MAPFONT}`, col: '#bfeaff' }); F.push({ x: q[0], y: q[1], r: 12, k: 'book', o: r }); }
  }
  for (const e of ONL.pup.values()) {
    const pr = e.pr; if (!pr || pr.g !== 1) continue;
    const x = onlNum(pr.x, -1e5, 1e5), z = onlNum(pr.z, -W.half, W.half); if (x === null || z === null) continue;
    const q = proj(x, z); if (!q) continue;
    icArrow(c, q[0], q[1], Math.PI - (onlNum(pr.r, -50, 50) || 0), big ? 9 : 6, ONL_COL);
    if (big) { L.push({ t: onlineName(e), x: q[0], y: q[1] + 17, p: 95, f: `800 12.5px ${MAPFONT}`, col: '#c8f0ff', force: true }); F.push({ x: q[0], y: q[1], r: 14, k: 'online', o: e }); }
  }
}
(function () {
  const st = document.createElement('style');
  st.textContent = `.onlbl{position:fixed;z-index:8;transform:translate(-50%,-100%);padding:2px 9px;border-radius:999px;background:rgba(10,40,64,.78);color:#dff4ff;font:700 12.5px/1.4 Rubik,sans-serif;direction:rtl;white-space:nowrap;pointer-events:none;border:1px solid rgba(79,210,255,.6);display:none}
#onlChip{position:absolute;top:calc(env(safe-area-inset-top,0px) + 80px);left:50%;transform:translateX(-50%);pointer-events:auto;cursor:pointer;font:600 12.5px Rubik,sans-serif;padding:4px 12px;border-radius:999px;border:1px solid rgba(79,210,255,.55);color:inherit}
#tOnl b{position:absolute;top:-3px;left:-3px;min-width:16px;height:16px;border-radius:8px;background:#4fd2ff;color:#04202e;font:800 11px/16px Rubik,sans-serif}
#tOnl{position:relative;font-size:17px}
.onl{display:flex;flex-direction:column;gap:5px;margin:6px 0 10px}.onrow{display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:11px;border:1px solid var(--line)}
.onrow>div:first-child{display:flex;flex-direction:column;min-width:0;flex:1}.onrow b{font-size:14.5px}.onrow span{font-size:12.5px;color:var(--dim)}
.onbt{display:flex;gap:4px}.onbt .btn{padding:6px 9px;font-size:15px;min-width:36px}
.onsay{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0}.onsay input{flex:1 1 180px;min-width:0;padding:9px 12px;border-radius:11px;border:1px solid var(--line);background:var(--panel2);color:var(--ink);font:500 14px Rubik,sans-serif;direction:rtl}`;
  document.head.appendChild(st);
})();
setTimeout(() => { onlineInit().catch(e => reportErr(e)); }, 0);
