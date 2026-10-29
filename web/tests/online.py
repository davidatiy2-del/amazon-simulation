"""The shared world, with a stand-in for the claude.ai runtime: a room with another player in it, and the world's book."""
import sys, json, time; sys.path.insert(0, __file__.rsplit('/', 1)[0])
from harness import run, OUT
MOCK = r"""
(() => {
  const my = {}; const peers = []; const book = { u_yoni: { v: 1, sp: 'hunter', vn: 'כפר הנמרים', x: 1210, z: -610, pop: 30, tier: 2, at: Date.now() - 3 * 3600e3 } };
  const cbs = []; let snapCb = null;
  const snap = () => { if (!snapCb) return; const docs = Object.entries(book).sort((a, b) => b[1].at - a[1].at).map(([id, d]) => ({ id, exists: true, data: () => d, metadata: {} })); snapCb({ docs, size: docs.length, empty: !docs.length, docChanges: () => [], metadata: {} }); };
  const q = { orderBy: () => q, limit: () => q, where: () => q, onSnapshot: (cb) => { snapCb = cb; setTimeout(snap, 20); return () => {}; }, get: async () => ({ docs: [] }) };
  const db = { collection: (p) => q, doc: (p) => ({ set: async (d) => { book[p.split('/')[1]] = d; window.__wrote = (window.__wrote || 0) + 1; snap(); }, get: async () => ({ exists: false }) }) };
  const room = {
    presence: async (patch) => { for (const k in patch) { if (patch[k] === null) delete my[k]; else my[k] = patch[k]; } },
    peers: () => [{ peer: 'me1', by: 'u_me', isMe: true, sameTab: true, kind: 'viewer', guest: false, presence: Object.assign({}, my), updatedAt: Date.now() }].concat(peers),
    onPeers: (fn) => { cbs.push(fn); return () => {}; }, onConnection: (fn) => { setTimeout(() => fn(true), 10); return () => {}; },
    emit: async () => {}, on: () => () => {}, connected: () => true
  };
  const user = { id: async () => 'u_me', me: async () => ({ id: 'u_me', name: 'אני' }), isOwner: async () => true, canEdit: async () => true, can: async () => true,
    profiles: async (ids) => Object.fromEntries((Array.isArray(ids) ? ids : [ids]).map(id => [id, { id, name: ({ u_dana: 'דנה', u_yoni: 'יוני' })[id] || '', avatarUrl: '', color: '#888', email: null, isMe: id === 'u_me', guest: false }])) };
  window.__mock = { my, peers, book };
  window.claude = { use: async (n) => n === 'room' ? room : n === 'user' ? user : n === 'db' ? db : null };
})();
"""
def t(g):
    g.hunter(); g.sim(1)
    time.sleep(1.0)
    print('online', g.js("[ONL.ok, ONL.conn, !!ONL.db, ONL.myId]"))
    print('my presence', g.js("JSON.stringify(__mock.my).slice(0, 200)"))
    print('book', g.js("ONL.book.map(r => [r.id, r.vn, r.x, r.z])"), 'wrote', g.js("window.__wrote || 0"))
    # another player comes near
    g.js("""__mock.peers.push({ peer: 'p2', by: 'u_dana', isMe: false, sameTab: false, kind: 'viewer', guest: false, updatedAt: Date.now(),
      presence: { g: 1, sp: 'hunter', sx: 'f', x: P.a.pos.x + 5, z: P.a.pos.z + 3, y: 0, r: 2.6, s: 0, po: 'idle', vn: 'כפר הדולפינים', pop: 12 } });""")
    time.sleep(0.6); g.sim(1)
    print('pup', g.js("(() => { const e = ONL.pup.get('p2'); return e && e.b ? [onlineName(e), Math.round(e.b.pos.x - P.a.pos.x), Math.round(e.b.pos.z - P.a.pos.z), e.b.mesh.visible, ANIMALS.includes(e.b)] : null; })()"))
    g.js("(() => { const e = ONL.pup.get('p2'); CAM.yaw = Math.atan2(e.b.pos.x - P.a.pos.x, e.b.pos.z - P.a.pos.z); })()"); g.sim(0.5)
    g.shot('online_near', clean=False)
    # she says something, waves, sends a gift
    w0 = g.js("P.inv.wood || 0")
    g.js("(() => { const p = __mock.peers[0]; p.presence = Object.assign({}, p.presence, { ch: { t: Date.now(), m: 'שלום! בואו לבקר אותי בכפר' }, em: { t: Date.now(), k: 'wave', to: 'u_me' }, gf: [{ id: 'g1', to: 'u_me', k: 'wood', n: 12, t: Date.now() }] }); p.updatedAt = Date.now(); })()")
    time.sleep(0.6); g.sim(0.5)
    print('feed', g.js("[...document.querySelectorAll('#feed .pn')].map(e => e.textContent).slice(-4)"))
    print('wood', w0, '->', g.js("P.inv.wood || 0"), 'gift again?', end=' ')
    time.sleep(0.6); g.sim(0.3); print(g.js("P.inv.wood || 0"))
    g.shot('online_chat', clean=False)
    # I write, wave and give
    g.js("P.inv.cooked = 20; onlineSay('היי דנה!'); onlineWave(ONL.pup.get('p2')); onlineGive(ONL.pup.get('p2'), 'food');")
    time.sleep(0.5)
    print('mine', g.js("JSON.stringify({ ch: __mock.my.ch && __mock.my.ch.m, em: __mock.my.em && __mock.my.em.to, gf: __mock.my.gf && __mock.my.gf.map(x => [x.to, x.k, x.n]) })"), 'cooked', g.js("P.inv.cooked"))
    # she walks off
    g.js("(() => { const p = __mock.peers[0]; p.presence = Object.assign({}, p.presence, { x: P.a.pos.x + 25, z: P.a.pos.z - 10, s: 3.2, po: 'move', r: 1.2 }); p.updatedAt = Date.now(); })()")
    time.sleep(0.5); g.sim(1.5)
    print('moved', g.js("(() => { const e = ONL.pup.get('p2'); return [Math.round(e.b.pos.x - P.a.pos.x), Math.round(e.b.pos.z - P.a.pos.z), e.b.pose]; })()"))
    # a name that tries to be HTML
    g.js("(() => { const p = __mock.peers[0]; p.presence = Object.assign({}, p.presence, { vn: '<img src=x onerror=\"window.__xss=1\">' }); p.updatedAt = Date.now(); })()")
    time.sleep(0.5)
    g.js("onlineOpen()"); time.sleep(0.3)
    print('panel', g.js("$('onlov').innerText.replace(/\\n+/g, ' | ').slice(0, 400)"))
    g.shot('online_panel', clean=False)
    g.js("closeCard('onlov')")
    # the globe: her and the world's book
    g.js("UI.open('map')"); time.sleep(0.4); g.js("MAPV.globe = true; MAPV.gz = 1.6; MAPV.gLon = glbLon(P.a.pos.x); MAPV.gLat = 0; GLB.key = ''; bigDraw()")
    print('globe feats', g.js("MAPV.feats.filter(f => f.k === 'online' || f.k === 'book').map(f => [f.k, Math.round(f.x), Math.round(f.y)])"))
    f = g.js("(() => { const f = MAPV.feats.find(f => f.k === 'online'); return f ? [f.x, f.y] : null; })()")
    if f: g.js(f"mapTap({f[0]}, {f[1]}); bigDraw()"); print('info', g.js("$('mapInfo').innerText.replace(/\\n+/g, ' | ')"))
    g.page.screenshot(path=f"{OUT}/online_globe.png")
    g.js("UI.close()")
    print('xss', g.js("window.__xss || 0"))
    # she leaves
    g.js("__mock.peers.length = 0"); time.sleep(0.5); g.sim(0.3)
    print('left', g.js("[ONL.pup.size, document.querySelectorAll('.onlbl').length]"))
    print('errs', g.errors()[:6])
run(t, init=MOCK)
