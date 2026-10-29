"""Saves in the player's account (web version): a village built on one device goes on on another; the newer copy wins;
transfer codes move a game to a device without the account; a device that keeps nothing still saves to the account;
a part that fails to load does not take the village with it, and the original save is not written over.
The account is a fake of window.claude (db + user) that keeps its documents in the page, copied between pages here."""
import sys, os, json, time; sys.path.insert(0, __file__.rsplit('/', 1)[0])
from playwright.sync_api import sync_playwright
from harness import ARGS, HELPERS, ROOT
NEW = os.environ.get('GAME', os.path.join(ROOT, 'amazonia.html'))

FAKE = r"""(() => {
  const store = window.__FDB_INIT || {}; window.__FDB = store; window.__FDB_W = 0;
  const delay = () => new Promise(r => setTimeout(r, 5));
  const err = (code, m) => { const e = new Error(m || code); e.code = code; return e; };
  const snapOf = (path, id) => ({ id, exists: path in store, data: () => store[path] ? JSON.parse(JSON.stringify(store[path])) : undefined, metadata: { fromCache: false, hasPendingWrites: false } });
  function docRef(path) {
    const id = path.split('/').pop();
    return { id, path,
      async get() { await delay(); return snapOf(path, id); },
      async set(d) { await delay(); if (window.__FDB_DENY) throw err('invalid_argument'); const js = JSON.stringify(d); if (js.length > 262144) throw err('invalid_argument', 'too big'); store[path] = JSON.parse(js); window.__FDB_W++; },
      async update(d) { await delay(); if (!(path in store)) throw err('invalid_argument'); Object.assign(store[path], d); },
      async delete() { await delay(); delete store[path]; },
      collection(p) { return colRef(path + '/' + p); } };
  }
  function query(path, filters) {
    return {
      where(f, op, v) { return query(path, filters.concat([[f, op, v]])); }, orderBy() { return this; }, limit() { return this; },
      async get() { await delay(); const pre = path + '/'; const docs = Object.keys(store).filter(k => k.startsWith(pre) && !k.slice(pre.length).includes('/')).filter(k => filters.every(([f, op, v]) => op === '==' ? store[k][f] === v : true)).sort().map(k => snapOf(k, k.slice(pre.length))); return { docs, size: docs.length, empty: !docs.length, docChanges: () => [], metadata: {} }; },
      onSnapshot(next) { this.get().then(next); return () => { }; }
    };
  }
  function colRef(path) { const q = query(path, []); return Object.assign(q, { path, doc(id) { return docRef(path + '/' + (id || Math.random().toString(36).slice(2))); }, async add(d) { const r = this.doc(); await r.set(d); return r; } }); }
  const db = { doc: docRef, collection: colRef };
  const user = { id: async () => 'u_test1', me: async () => ({ id: 'u_test1' }), isOwner: () => true, canEdit: () => true, can: () => true, profiles: async () => ({}) };
  window.claude = { use: async n => { await new Promise(r => setTimeout(r, 400)); return n === 'db' ? db : n === 'user' ? user : null; } };
})();"""

STATE = """(() => { const v = ownCamp(); return { own: !!v, v: v ? [Math.round(v.x), Math.round(v.z)] : null, b: BLD.list.length,
  people: clanAdults().length, wood: Math.round((CAMPH.store && CAMPH.store.wood) || 0), day: G.day, slot: PROG.slot, loadErr: PROG.loadErr || [] }; })()"""
VILLAGE = """(() => {
  const spot = (() => { for (let r = 0; r < 400; r += 10) for (let a = 0; a < 12; a++) { const x = 260 + Math.cos(a) * r, z = 40 + Math.sin(a) * r; if (waterDepth(x, z) === 0 && getNY(x, z) > 0.9 && HUNT.camps.every(c => Math.hypot(c.x - x, c.z - z) > 110)) return { x, z }; } })();
  P.a.pos.set(spot.x, 0, spot.z); P.a.ground(1, true);
  const v = foundCampAt(spot.x, spot.z);
  for (const k of ['builder', 'builder', 'warrior', 'hunter', 'gatherer']) spawnNewcomer(v, k);
  boxStore(); CAMPH.store.wood = 300;
  let n = 0;
  for (const t of ['hut', 'hut', 'granary']) for (let r = 12, ok = false; r < 40 && !ok; r += 2) for (let a = 0; a < 24 && !ok; a++) {
    const x = v.x + Math.cos(a / 24 * TAU) * r, z = v.z + Math.sin(a / 24 * TAU) * r;
    if (buildCheck(t, x, z, 0, 1)) continue; payWood(BTYPES[t].wood); const b = addBuilding(t, x, z, 0, 0, false, true); buildDone(b, true); ok = true; n++;
  }
  return n;
})()"""


def page_for(br, fdb=None, store=None, fake=True, init_extra=''):
    ctx = br.new_context(viewport={'width': 1280, 'height': 800})
    if fake: ctx.add_init_script('window.__FDB_INIT = ' + json.dumps(fdb or {}) + ';\n' + FAKE)
    if store is not None: ctx.add_init_script('(() => { const s = ' + json.dumps(store) + '; try { localStorage.clear(); for (const k in s) localStorage.setItem(k, s[k]); } catch (e) { } })();')
    if init_extra: ctx.add_init_script(init_extra)
    p = ctx.new_page(); p.set_default_timeout(300000); errs = []
    p.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)))
    p.on('console', lambda m: errs.append('CONSOLE ' + m.text) if m.type == 'error' else None)
    p.goto('file://' + NEW)
    p.wait_for_function("() => typeof G !== 'undefined' && G.mode === 'menu'", timeout=200000)
    p.evaluate(HELPERS)
    return ctx, p, errs


def ls(p): return p.evaluate("(() => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k); } return o; })()")
def wait(p, cond, t=20):
    t0 = time.time()
    while time.time() - t0 < t:
        if p.evaluate(cond): return True
        time.sleep(0.2)
    return False
def errs_of(p, errs): return (errs + p.evaluate('__errs()'))[:6]


with sync_playwright() as pw:
    br = pw.chromium.launch(args=ARGS)
    # ---- device A: a village; the account gets it ----
    ctx, p, errs = page_for(br)
    print('A cloud', wait(p, "CLOUD.ok && CLOUD.pulled"), p.evaluate("$('saveLine').textContent"))
    p.evaluate("__hunter('m')"); p.evaluate("__sim(1)")
    print('A built', p.evaluate(VILLAGE))
    p.evaluate("__sim(22)")
    wait(p, "!CLOUD.busy && !CLOUD.q.size", 10)
    p.evaluate("UI.pause(true)"); wait(p, "!CLOUD.busy && !CLOUD.q.size", 10)
    a_state = p.evaluate(STATE)
    fdb = p.evaluate("window.__FDB"); a_ls = ls(p)
    heads = {k: {kk: (vv if kk != 'd' else len(vv)) for kk, vv in v.items()} for k, v in fdb.items() if '/g-' in k}
    print('A state', a_state)
    print('A account', heads, 'writes', p.evaluate("window.__FDB_W"))
    print('A pause line', p.evaluate("$('pauseInfo').querySelector('.svst') && $('pauseInfo').querySelector('.svst').textContent"))
    print('A errors', errs_of(p, errs))
    ctx.close()

    # ---- device B: nothing on the device; the account brings the village ----
    ctx, p, errs = page_for(br, fdb)
    print('B line before', p.evaluate("$('saveLine').textContent"), 'cont hidden', p.evaluate("$('contBtn').hidden"))
    print('B pulled', wait(p, "CLOUD.pulled"), p.evaluate("[$('contBtn').hidden, $('contBtn').textContent, $('saveLine').textContent]"))
    p.evaluate("$('contBtn').click()"); wait(p, "G.mode === 'play'", 20)
    p.evaluate("window.askPreg = () => {}"); time.sleep(0.3); p.evaluate("__clean()"); p.evaluate("__sim(4)")
    b_state = p.evaluate(STATE)
    ok = b_state['own'] and b_state['v'] == a_state['v'] and b_state['b'] == a_state['b'] and b_state['people'] >= a_state['people'] - 1
    print('B state', b_state, 'OK' if ok else 'MISMATCH')
    # B plays on: day 2 comes, and B's copy goes up
    p.evaluate("G.time = 23.9;"); p.evaluate("__sim(8)"); p.evaluate("saveGame(); cloudTick(true)"); wait(p, "!CLOUD.busy && !CLOUD.q.size", 10)
    b2 = p.evaluate(STATE); fdb2 = p.evaluate("window.__FDB")
    print('B later', b2['day'], 'account at', [v['at'] for k, v in fdb2.items() if '/g-' in k], 'errors', errs_of(p, errs))
    # the transfer code of this game
    code = p.evaluate("(async () => { UI.toMenu(); openSaves(); const id = PROG.slot || saveIndex()[0].id; await xferOpen(saveIndex()[0].id); return $('xferTa').value; })()")
    print('code', code[:30], len(code))
    p.evaluate("$('xferov').hidden = false");
    ctx.close()

    # ---- device A again: its own older copy, and a newer one in the account ----
    ctx, p, errs = page_for(br, fdb2, store=a_ls)
    wait(p, "CLOUD.pulled")
    print('A2 index', p.evaluate("saveIndex().map(e => [e.id, e.day, e.at, e.cl])"))
    p.evaluate("$('contBtn').click()"); wait(p, "G.mode === 'play'", 20)
    p.evaluate("window.askPreg = () => {}"); time.sleep(0.3); p.evaluate("__clean()")
    a2 = p.evaluate(STATE)
    print('A2 state (newer from the account)', a2, 'OK' if a2['day'] == b2['day'] and a2['own'] else 'MISMATCH', 'errors', errs_of(p, errs))
    ctx.close()

    # ---- device C: the Android app (no account): the transfer code ----
    ctx, p, errs = page_for(br, fake=False)
    print('C line', p.evaluate("$('saveLine').textContent"), 'cont hidden', p.evaluate("$('contBtn').hidden"))
    r = p.evaluate("code => xferImport(code)", code)
    print('C import', repr(r), p.evaluate("[$('contBtn').hidden, $('contBtn').textContent]"))
    bad = p.evaluate("xferImport('AMZ1.abc.z:AAAA')"); print('C bad code', bad)
    p.evaluate("continueGame()"); p.evaluate("window.askPreg = () => {}"); time.sleep(0.3); p.evaluate("__clean()"); p.evaluate("__sim(3)")
    c_state = p.evaluate(STATE)
    print('C state', c_state, 'OK' if c_state['own'] and c_state['b'] == a_state['b'] else 'MISMATCH', 'errors', errs_of(p, errs))
    ctx.close()

    # ---- device D: storage throws (a preview); the account still keeps the game ----
    deny = "(() => { const f = () => { const e = new Error('QuotaExceededError'); e.name = 'QuotaExceededError'; throw e; }; Storage.prototype.setItem = f; })();"
    ctx, p, errs = page_for(br, {}, init_extra=deny)
    wait(p, "CLOUD.pulled")
    print('D line', p.evaluate("$('saveLine').textContent"), 'works', p.evaluate("lsWorks()"))
    p.evaluate("__hunter('m')"); p.evaluate("__sim(1)"); p.evaluate(VILLAGE); p.evaluate("__sim(22)"); wait(p, "!CLOUD.busy && !CLOUD.q.size", 10)
    print('D saved to account', [k for k in p.evaluate("Object.keys(window.__FDB)")], 'feed', p.evaluate("[...document.querySelectorAll('#feed div')].map(e => e.textContent).filter(t => /שומר|חשבון/.test(t))"))
    p.evaluate("UI.toMenu()"); print('D menu', p.evaluate("[$('contBtn').hidden, $('contBtn').textContent]"))
    p.evaluate("continueGame()"); p.evaluate("window.askPreg = () => {}"); time.sleep(0.3); p.evaluate("__clean()")
    print('D state', p.evaluate(STATE), 'errors', errs_of(p, errs))
    ctx.close()

    # ---- a part that fails to load: the village still comes back, and the original save is kept aside ----
    ctx, p, errs = page_for(br, fake=False, store=a_ls)
    p.evaluate("(() => { window.warLoad = () => { throw new Error('test: war part broken'); }; })()")
    p.evaluate("continueGame()"); p.evaluate("window.askPreg = () => {}"); time.sleep(0.3); p.evaluate("__clean()")
    e_state = p.evaluate(STATE)
    print('E state', e_state, 'keepSave', p.evaluate("PROG.keepSave"))
    p.evaluate("(() => { window.buildLoad = () => { throw new Error('test: buildings broken'); }; })()")
    p.evaluate("UI.toMenu()"); p.evaluate("continueGame()"); p.evaluate("window.askPreg = () => {}"); time.sleep(0.3); p.evaluate("__clean()")
    e2 = p.evaluate(STATE); slot0 = e2['slot']
    print('E2 (buildings broken)', e2, 'keepSave', p.evaluate("PROG.keepSave"), 'feed', p.evaluate("[...document.querySelectorAll('#feed div')].map(e => e.textContent).slice(-2)"))
    p.evaluate("saveGame()")
    print('E2 after save: new slot', p.evaluate("PROG.slot") != slot0, 'index', p.evaluate("saveIndex().map(e => [e.id, e.vn, e.pop])"))
    ctx.close()
    br.close()
