// ================= SAVES: on this device, and in the player's account =================
// Each game is written to this device's storage (localStorage). Where the device keeps nothing (a private window, a
// preview, storage that is full or blocked) the game still lives in memory until the page closes, and the player is
// told so. In the web version (published on claude.ai) every game is also written to the player's own private place
// in the artifact's database (data/users/<id>/…, nobody else can read it): at most every 40 seconds while playing, and
// at once when the game is paused, hidden or left. So a game goes on wherever the page is opened with the same
// account, a computer or a phone, and nothing is lost when a browser forgets. The Android app has no account: a
// transfer code moves a game between the app, the web version and other devices.
const STORE = { mem: new Map(), fail: 0, told: 0, okT: 0, lastAt: 0, errs: new Set(), works: null };
const CLOUD = { ok: false, col: null, q: new Map(), busy: false, flush: false, sent: {}, at: {}, n: {}, pulled: false, pulling: null, fail: 0, off: '', got: 0, told: false, okT: 0 };
const CLOUD_GAP = 40000, CLOUD_PART = 200000;
const SAVE_CORE = new Set(['start', 'camp', 'tribe', 'vx.core', 'vx.b', 'vx.clan']);
const IN_APP = location.hostname === 'appassets.androidplatform.net' || /[?&]app=1\b/.test(location.search);   // (?app=1: to try the app's ways in a browser)

function lsGet(k) {
  if (STORE.mem.has(k)) return STORE.mem.get(k);
  try { return localStorage.getItem(k); } catch (e) { return null; }
}
function lsSet(k, v) {
  try { localStorage.setItem(k, v); STORE.mem.delete(k); return true; } catch (e) { STORE.mem.set(k, v); return e || new Error('storage'); }
}
function lsDel(k) { STORE.mem.delete(k); try { localStorage.removeItem(k); } catch (e) { /* nothing was kept */ } }
function lsWorks() {
  if (STORE.works === null) { try { localStorage.setItem('amazonia-t', '1'); STORE.works = localStorage.getItem('amazonia-t') === '1'; localStorage.removeItem('amazonia-t'); } catch (e) { STORE.works = false; } }
  return STORE.works;
}
const isQuota = e => !!e && (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014 || /quota/i.test(String(e.message || '')));
// a part of the game that fails to save or to load does not take the rest with it
function saveErr(k, e) { if (!STORE.errs.has(k)) { STORE.errs.add(k); reportErr(e); } }
function loadPart(k, f) { try { f(); } catch (e) { reportErr(e); (PROG.loadErr || (PROG.loadErr = [])).push(k); } }
// a save that cannot be written whole: the part that breaks it is left out, the rest is kept
function saveJSON(d) {
  try { return JSON.stringify(d); } catch (e) {
    saveErr('json', e);
    if (d.vx) for (const k of Object.keys(d.vx)) { try { JSON.stringify(d.vx[k]); } catch (x) { saveErr('vx.' + k, x); delete d.vx[k]; } }
    for (const k of Object.keys(d)) { if (k === 'vx') continue; try { JSON.stringify(d[k]); } catch (x) { saveErr(k, x); delete d[k]; } }
    return JSON.stringify(d);
  }
}
// what the list of games shows about each one
function saveMetaOf(id, d) {
  return { id, sp: d.sp, sex: d.sex, day: d.day || 1, lvl: d.lvl || 1, at: d.at || Date.now(), vn: d.ownCamp ? (d.vn || 'כפר') : '', pop: d.ownCamp ? (d.pop || 0) : 0 };
}
function indexPut(meta) {
  const idx = saveIndex(), old = idx.find(e => e.id === meta.id);
  const e = Object.assign({}, meta, { cl: Math.max((old && old.cl) || 0, CLOUD.at[meta.id] || 0) });
  writeIndex(idx.filter(q => q.id !== meta.id).concat([e]));
}
function indexEnrich() {
  if (STORE.enriched) return; STORE.enriched = true;
  const idx = saveIndex(); let ch = false;
  for (const e of idx) if (e.vn === undefined) { const d = readSlot(e.id); e.vn = d && d.ownCamp ? (d.vn || 'כפר') : ''; e.pop = d && d.ownCamp ? (d.pop || (d.tribe ? d.tribe.length + 1 : 0)) : 0; ch = true; }
  if (ch) writeIndex(idx);
}
function indexMark(id, at) { const idx = saveIndex(), e = idx.find(q => q.id === id); if (e && !((e.cl || 0) >= at)) { e.cl = at; writeIndex(idx); } }
function saveTold(err) {
  const now = Date.now(); if (now - STORE.told < 180000 || G.mode !== 'play') return; STORE.told = now;
  if (CLOUD.ok) UI.notify('💾 המכשיר הזה לא שומר את המשחק, אבל הוא נשמר בחשבון שלך', '');
  else UI.notify(isQuota(err) ? '⚠️ אין מקום במכשיר, והמשחק לא נשמר. אפשר למחוק משחקים ישנים ב"המשחקים שלי"' : '⚠️ המכשיר הזה לא שומר את המשחק. כדי לא לאבד אותו: בתפריט הראשי, "המשחקים שלי", קוד העברה', 'bad');
}

// ---------- packing: a game as short text (for the account and for transfer codes) ----------
function b64e(u8) { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); }
function b64d(s) { const b = atob(s), u8 = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u8[i] = b.charCodeAt(i); return u8; }
// z: squeezed (gzip) · b: not squeezed, where the browser cannot. Both are plain letters, safe to copy and paste.
async function packSave(js) {
  if (typeof CompressionStream === 'function') {
    try { const st = new Blob([js]).stream().pipeThrough(new CompressionStream('gzip')); return 'z:' + b64e(new Uint8Array(await new Response(st).arrayBuffer())); } catch (e) { /* not squeezed, then */ }
  }
  return 'b:' + b64e(new TextEncoder().encode(js));
}
async function unpackSave(s) {
  if (s.startsWith('b:')) return new TextDecoder().decode(b64d(s.slice(2)));
  if (s.startsWith('z:') && typeof DecompressionStream === 'function') { const st = new Blob([b64d(s.slice(2))]).stream().pipeThrough(new DecompressionStream('gzip')); return await new Response(st).text(); }
  throw new Error('this save cannot be read here');
}
function saveOK(js) { try { const d = JSON.parse(js); return d && d.v === 1 && SPECIES[d.sp] && PLAYABLE.includes(d.sp) ? d : null; } catch (e) { return null; } }

// ---------- the account ----------
async function cloudInit() {
  const C = window.claude; if (!C || typeof C.use !== 'function') return;
  let db = null, user = null, uid = null;
  try { db = await C.use('db'); } catch (e) { db = null; }
  if (!db) return;
  try { user = await C.use('user'); } catch (e) { user = null; }
  if (user) { try { uid = await user.id(); } catch (e) { uid = null; } }
  if (!uid) return;
  try { CLOUD.col = db.collection('data/users/' + uid); } catch (e) { return; }
  CLOUD.ok = true; saveLineSync();
  try { await cloudPull(); } catch (e) { reportErr(e); CLOUD.pulled = true; setTimeout(() => { if (CLOUD.ok) cloudPull().catch(reportErr); }, 15000); }
  setInterval(() => { try { cloudTick(false); } catch (e) { reportErr(e); } }, 4000);
  addEventListener('pagehide', () => { try { if (G.mode === 'play') saveGame(); cloudTick(true); } catch (e) { reportErr(e); } });
}
// the games in the account come to this device (when they are newer), and this device's games go up to the account
async function cloudPull() {
  const snap = await CLOUD.col.where('v', '==', 1).get(), heads = [];   // the heads of the games (their parts have no v)
  for (const s of snap.docs) { if (!s.exists || !s.id.startsWith('g-')) continue; const m = s.data(); if (m && typeof m.at === 'number' && SPECIES[m.sp]) heads.push([s.id.slice(2), m]); }
  heads.sort((a, b) => b[1].at - a[1].at);
  let got = 0;
  const newer = (id, m) => { const loc = saveIndex().find(e => e.id === id); return !(loc && loc.at >= m.at) && !(G.mode === 'play' && PROG.slot === id); };   // the game being played right now wins
  for (const [id, m] of heads.slice(0, MAX_SLOTS)) {
    CLOUD.at[id] = m.at; CLOUD.n[id] = m.n || 1;
    if (!newer(id, m)) continue;
    const js = await cloudRead(id, m); if (!js || !newer(id, m)) continue;
    lsSet(SAVE_PRE + id, js);
    indexPut({ id, sp: m.sp, sex: m.sex, day: m.day || 1, lvl: m.lvl || 1, at: m.at, vn: m.vn || '', pop: m.pop || 0 }); got++;
  }
  const idx = saveIndex(); let ch = false;
  for (const e of idx) { const at = CLOUD.at[e.id] || 0; if (at >= e.at && !((e.cl || 0) >= e.at)) { e.cl = at; ch = true; } }
  if (ch) writeIndex(idx);
  CLOUD.pulled = true; CLOUD.got = got;
  if (G.mode === 'menu') { syncContinue(); if ($('saves') && !$('saves').hidden) openSaves(); }
  for (const e of idx) if (!((CLOUD.at[e.id] || 0) >= e.at)) { const js = lsGet(SAVE_PRE + e.id); if (js && saveOK(js)) cloudQueue(e, js); }
  cloudTick(true);
}
async function cloudRead(id, m) {
  let s = typeof m.d === 'string' ? m.d : '';
  for (let i = 1; i < (m.n || 1); i++) {
    const p = await CLOUD.col.doc(`p-${id}-${i}`).get(), pd = p.exists ? p.data() : null;
    if (!pd || pd.w !== m.w || typeof pd.d !== 'string') return null;   // a game half written: the copy on this device stays
    s += pd.d;
  }
  try { const js = await unpackSave(s); return saveOK(js) ? js : null; } catch (e) { return null; }
}
function cloudQueue(meta, js) { if (CLOUD.ok) CLOUD.q.set(meta.id, { meta: Object.assign({}, meta), js }); }
function cloudTick(force) {
  if (!CLOUD.ok || !CLOUD.q.size) return;
  if (CLOUD.busy) { if (force) CLOUD.flush = true; return; }   // one write at a time; the newest goes right after
  const now = Date.now();
  for (const [id, it] of CLOUD.q) {
    if (now - (CLOUD.sent[id] || 0) < (force ? 0 : CLOUD_GAP)) continue;
    CLOUD.q.delete(id); CLOUD.busy = true; CLOUD.sent[id] = now;
    cloudWrite(id, it).then(ok => { CLOUD.busy = false; const more = force || CLOUD.flush; CLOUD.flush = false; if (ok && more) cloudTick(true); });
    return;
  }
}
async function cloudWrite(id, it) {
  try {
    const pack = await packSave(it.js), size = CLOUD_PART, parts = [];
    for (let i = 0; i < pack.length; i += size) parts.push(pack.slice(i, i + size));
    const m = it.meta, w = Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
    // the parts first, the head last: a game is never read from parts of two different saves
    for (let i = 1; i < parts.length; i++) await CLOUD.col.doc(`p-${id}-${i}`).set({ w, d: parts[i] });
    await CLOUD.col.doc('g-' + id).set({ v: 1, at: m.at, sp: m.sp, sex: m.sex, day: m.day || 1, lvl: m.lvl || 1, vn: m.vn || '', pop: m.pop || 0, n: parts.length || 1, w, d: parts[0] || '' });
    const was = CLOUD.n[id] || 1; CLOUD.n[id] = parts.length || 1; CLOUD.at[id] = Math.max(CLOUD.at[id] || 0, m.at); CLOUD.fail = 0; CLOUD.okT = Date.now();
    for (let i = parts.length; i < was; i++) CLOUD.col.doc(`p-${id}-${i}`).delete().catch(() => { });
    indexMark(id, m.at);
    if (G.mode === 'play' && id === PROG.slot) {
      if (!CLOUD.told) { CLOUD.told = true; UI.notify('☁️ המשחק נשמר בחשבון שלך: אפשר להמשיך אותו מכל מחשב או טלפון', 'good'); }
      if ($('pause') && !$('pause').hidden) fillPauseInfo();
    }
    if (G.mode === 'menu' && $('saves') && !$('saves').hidden) openSaves();
    return true;
  } catch (e) {
    const code = e && e.code;
    if (['invalid_argument', 'quota_exceeded', 'revoked', 'not_granted', 'capability_disabled', 'capability_removed', 'transform_error'].includes(code)) {
      CLOUD.ok = false; CLOUD.off = code; CLOUD.q.clear(); saveLineSync();
      if (code === 'quota_exceeded' && G.mode === 'play') UI.notify('⚠️ המקום בחשבון נגמר, והמשחק נשמר רק במכשיר הזה', 'bad');
    } else { CLOUD.fail++; if (!CLOUD.q.has(id)) CLOUD.q.set(id, it); CLOUD.sent[id] = Date.now() + Math.min(300000, 15000 * CLOUD.fail); }
    return false;
  }
}
function cloudDel(id) {
  CLOUD.q.delete(id);
  if (!CLOUD.ok) return;
  const n = CLOUD.n[id] || 1; delete CLOUD.at[id]; delete CLOUD.n[id];
  CLOUD.col.doc('g-' + id).delete().catch(() => { });
  for (let i = 1; i < n; i++) CLOUD.col.doc(`p-${id}-${i}`).delete().catch(() => { });
}
// "continue" waits a moment for the account, so the newest copy of the game is the one that opens
function cloudWait(ms) { return CLOUD.pulling ? Promise.race([CLOUD.pulling, new Promise(r => setTimeout(r, ms))]) : Promise.resolve(); }

// ---------- what the player sees: a line in the menu, the list of games, transfer codes ----------
function saveLineSync() {
  const el = document.getElementById('saveLine'); if (!el) return;   // (runs before the $ helper exists, too)
  const t = CLOUD.ok && !CLOUD.pulled ? '☁️ בודקים את המשחקים בחשבון שלך…'
    : CLOUD.ok ? '☁️ המשחקים נשמרים גם בחשבון שלך'
      : !lsWorks() ? '⚠️ המכשיר הזה לא שומר משחקים'
        : IN_APP ? '💾 המשחקים נשמרים באפליקציה' : '💾 המשחקים נשמרים במכשיר הזה';
  el.innerHTML = `${t} <span>העברת משחק ›</span>`;
}
function saveStatusHtml() {
  if (!PROG.slot) return '';
  const ago2 = t => { const s = Math.round((Date.now() - t) / 1000); return s < 10 ? 'עכשיו' : s < 90 ? `לפני ${s} שניות` : `לפני ${Math.round(s / 60)} דקות`; };
  const loc = STORE.okT && !STORE.fail ? `💾 נשמר ${ago2(STORE.okT)}` : '⚠️ המכשיר לא שומר';
  const cl = CLOUD.ok ? ((CLOUD.at[PROG.slot] || 0) >= STORE.lastAt ? ' · ☁️ וגם בחשבון שלך' : ' · ☁️ נשלח לחשבון…') : '';
  return `<p class="svst">${loc}${cl}</p>`;
}
function xferCard(html) {
  let el = $('xferov');
  if (!el) {
    el = document.createElement('section'); el.id = 'xferov'; el.className = 'ov'; el.hidden = true; document.body.appendChild(el);
    el.addEventListener('click', e => { const b = e.target.closest('button'); if (b) xferClick(b); });
  }
  el.innerHTML = `<div class="card">${html}</div>`; el.hidden = false;
  return el;
}
async function xferOpen(id) {
  if (!id) {
    xferCard('<h2>📥 לטעון משחק מקוד</h2><p>מדביקים כאן קוד העברה שהעתקת במכשיר אחר או באפליקציה. המשחק נכנס לרשימת המשחקים.</p>' +
      '<textarea id="xferTa" rows="5" dir="ltr" spellcheck="false" autocomplete="off" placeholder="AMZ1…"></textarea><p class="xmsg"></p>' +
      '<div class="btns"><button class="btn pri" data-a="load">לטעון</button><button class="btn" data-a="close">סגירה</button></div>');
    return;
  }
  const js = lsGet(SAVE_PRE + id); if (!js) return;
  const el = xferCard('<h2>📤 קוד העברה</h2><p>הקוד הזה הוא המשחק כולו. מעתיקים אותו, ובמכשיר השני (או באפליקציה) פותחים את "המשחקים שלי", לוחצים "לטעון משחק מקוד" ומדביקים.</p>' +
    '<textarea id="xferTa" rows="5" dir="ltr" readonly spellcheck="false">…</textarea><p class="xmsg"></p>' +
    '<div class="btns"><button class="btn pri" data-a="copy">להעתיק</button><button class="btn" data-a="close">סגירה</button></div>');
  el.querySelector('#xferTa').value = `AMZ1.${id}.${await packSave(js)}`;
}
async function xferClick(b) {
  const el = $('xferov'), ta = el.querySelector('#xferTa'), msg = el.querySelector('.xmsg');
  if (b.dataset.a === 'close') { el.hidden = true; return; }
  if (b.dataset.a === 'copy') {
    let ok = false;
    try { await navigator.clipboard.writeText(ta.value); ok = true; } catch (e) { /* the old way */ }
    if (!ok) { try { ta.focus(); ta.select(); ta.setSelectionRange(0, ta.value.length); ok = document.execCommand('copy'); } catch (e) { ok = false; } }
    msg.textContent = ok ? '✅ הועתק. עכשיו מדביקים אותו במכשיר השני' : 'לא הצלחנו להעתיק לבד: מסמנים את כל הקוד ומעתיקים';
    return;
  }
  if (b.dataset.a === 'load') {
    const why = await xferImport(ta.value);
    if (why) { msg.textContent = why; return; }
    el.hidden = true; syncContinue(); openSaves();
  }
}
async function xferImport(code) {
  code = String(code || '').replace(/\s+/g, '');
  const m = /^AMZ1\.([A-Za-z0-9]{2,40})\.([bz]:[A-Za-z0-9+/=]+)$/.exec(code);
  if (!m) return code ? 'זה לא נראה כמו קוד של משחק. צריך להעתיק את כולו, מההתחלה ועד הסוף' : 'קודם מדביקים כאן את הקוד';
  let js; try { js = await unpackSave(m[2]); } catch (e) { return 'הקוד לא שלם. צריך להעתיק אותו שוב, את כולו'; }
  const d = saveOK(js); if (!d) return 'הקוד לא שלם. צריך להעתיק אותו שוב, את כולו';
  const id = m[1], loc = saveIndex().find(e => e.id === id);
  if (loc && loc.at > d.at) return 'המשחק הזה כבר כאן, ובגרסה חדשה יותר מזו שבקוד';
  if (lsSet(SAVE_PRE + id, js) !== true && !STORE.mem.has(SAVE_PRE + id)) return 'אין מקום במכשיר';
  const meta = saveMetaOf(id, d); indexPut(meta); cloudQueue(meta, js); cloudTick(true);
  return '';
}
// ---------- games that come with the app (a ready-made city): put into the list of games once ----------
async function appGifts() {
  if (!IN_APP) return;
  let names = []; try { const r = await fetch('gifts/list.json'); if (r.ok) names = await r.json(); } catch (e) { return; }
  let done = []; try { done = JSON.parse(localStorage.getItem('amazonia-gifts-in') || '[]'); } catch (e) { done = []; }
  let got = 0;
  for (const n of Array.isArray(names) ? names : []) {
    if (typeof n !== 'string' || done.includes(n)) continue;
    try { const code = await (await fetch('gifts/' + n)).text(); if (!(await xferImport(code))) got++; } catch (e) { continue; }
    done.push(n);
  }
  try { localStorage.setItem('amazonia-gifts-in', JSON.stringify(done)); } catch (e) { /* it is tried again next time */ }
  if (got && G.mode === 'menu') syncContinue();
}
(function () {
  const st = document.createElement('style');
  st.textContent = `#saveLine{align-self:flex-start;background:none;border:0;color:#cfcab6;font:500 13px Rubik,sans-serif;cursor:pointer;padding:6px 0 2px;text-align:right}#saveLine span{color:#e8b04b;margin-right:4px}#saveLine:hover{color:#f4efe1}
.svnote{font-size:13px;line-height:1.5;color:var(--dim);margin:0 0 6px}.svst{font-size:12.5px;color:var(--dim);margin:6px 0 0}
#xferTa{width:100%;box-sizing:border-box;min-height:96px;max-height:30vh;resize:vertical;padding:9px 11px;border-radius:11px;border:1px solid var(--line);background:var(--panel2,#1d2a22);color:var(--ink,#eee);font:12px/1.35 ui-monospace,Menlo,Consolas,monospace;word-break:break-all}
#xferov .xmsg{min-height:18px;font-size:13px;color:var(--gold,#e8b04b);margin:6px 0 0}
.srow .vn{color:#3f6f2c;font-size:13px;font-weight:600;margin-right:6px}
#deathSave{color:#3f6f2c;font-weight:600;font-size:14px;line-height:1.55;margin:10px 0 0}
@media (max-height:520px){#menu .fine{display:none}#saveLine{padding:3px 0 0;font-size:12px}}`;
  document.head.appendChild(st);
  const row = document.querySelector('#menu .ctarow');
  if (row) { const b = document.createElement('button'); b.id = 'saveLine'; b.type = 'button'; row.insertAdjacentElement('afterend', b); b.addEventListener('click', () => { AUD.play('ui'); openSaves(); }); saveLineSync(); }
})();
CLOUD.pulling = cloudInit().catch(e => reportErr(e)).finally(() => { CLOUD.pulling = null; saveLineSync(); });
appGifts().catch(e => reportErr(e));
