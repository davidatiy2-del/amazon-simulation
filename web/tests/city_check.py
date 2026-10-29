"""The ready-made city (שבט הלוחמים) comes back whole: from the save on the device, from a transfer code on a device
without the save, and in the app from the games that come with it (dist/www served locally, ?app=1).
Usage: python3 tests/city_check.py <city_save.json> <code.txt>"""
import sys, os, json, time, threading, functools, http.server, socketserver
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.sync_api import sync_playwright
from harness import ARGS, HELPERS, ROOT, OUT
NEW = os.path.join(ROOT, 'amazonia.html')
SAVE = open(sys.argv[1], encoding='utf-8').read()
CODE = open(sys.argv[2], encoding='ascii').read().strip()
D = json.loads(SAVE)
want = {}
for b in D['vx']['b']: want[b['t']] = want.get(b['t'], 0) + 1

STATE = """(() => { const v = ownCamp(), by = {}; for (const b of BLD.list) by[b.t] = (by[b.t] || 0) + 1;
  const ad = clanAdults();
  return { mode: G.mode, own: !!v, name: vxVillageName(), tier: villageTier(), pop: popCount(), bodies: clanReal().length, res: CLAN.residents,
    couples: ad.filter(m => m.sex === 'f' && m.spouse && m.spouse.alive).length, kids: clanReal().filter(m => m.young).length,
    knights: ad.filter(m => m.knight).length, merchants: ad.filter(m => m.merchant).length, swords: ad.filter(m => m.cls === 'warrior' && m.wpn === 'sword').length,
    horses: tribeHorses().length, dogs: tribeDogs().length, eagles: tribeEagles().length, cows: v && v.cowGroup ? v.cowGroup.members.filter(c => c.alive).length : 0,
    carts: CARTS.list.length, ships: SHIPS.list.length, by, wife: aliveMates().map(m => m.name), cubs: P.cubs.filter(c => c.alive).map(c => c.name),
    gold: goldHave(), food: (() => { const s = boxStore(); return s.cooked + s.meat + s.fish; })(), wood: boxStore().wood, loadErr: PROG.loadErr || [], errs: [...ERRS].slice(0, 5) }; })()"""


def page_for(br, url, store=None, w=1280, h=800, touch=False):
    ctx = br.new_context(viewport={'width': w, 'height': h}, has_touch=touch, is_mobile=touch)
    if store is not None: ctx.add_init_script('(() => { const s = ' + json.dumps(store) + '; try { localStorage.clear(); for (const k in s) localStorage.setItem(k, s[k]); } catch (e) { } })();')
    p = ctx.new_page(); p.set_default_timeout(600000); errs = []
    p.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)))
    p.on('console', lambda m: errs.append('CONSOLE ' + m.text) if m.type == 'error' else None)
    p.goto(url)
    p.wait_for_function("() => typeof G !== 'undefined' && G.mode === 'menu'", timeout=300000)
    p.evaluate(HELPERS)
    return ctx, p, errs


def check(tag, s):
    by_ok = all(s['by'].get(t, 0) >= n for t, n in want.items() if t not in ('torch',))
    ok = (s['mode'] == 'play' and s['own'] and s['name'] == 'שבט הלוחמים' and s['tier'] == 4 and 290 <= s['pop'] <= 310 and s['bodies'] >= 65
          and s['couples'] >= 15 and s['knights'] >= 6 and s['horses'] >= 6 and s['dogs'] >= 4 and by_ok and not s['loadErr'] and not s['errs'])
    print(tag, 'OK' if ok else 'MISMATCH', {k: s[k] for k in s if k != 'by'})
    if not by_ok: print('  buildings want', want, 'have', s['by'])
    return ok


def load(p):
    p.evaluate("window.askPreg = () => {}"); time.sleep(0.5)
    p.evaluate("__clean()"); p.evaluate("__sim(4)"); p.evaluate("__clean()")


with sync_playwright() as pw:
    br = pw.chromium.launch(args=ARGS)
    # ---- A: the save on this device ----
    idx = [{'id': 'warriorcity', 'sp': D['sp'], 'sex': D['sex'], 'day': D['day'], 'lvl': D.get('lvl', 1), 'at': D['at'], 'vn': D.get('vn', ''), 'pop': D.get('pop', 0)}]
    ctx, p, errs = page_for(br, 'file://' + NEW, store={'amazonia-saves-v2': json.dumps(idx), 'amazonia-slot-warriorcity': SAVE})
    print('menu', p.evaluate("[$('contBtn').textContent, $('saveLine').textContent]"))
    p.evaluate("openSaves()"); time.sleep(0.3); p.screenshot(path=OUT + '/city_list.png'); p.evaluate("$('saves').hidden = true")
    t0 = time.time(); p.evaluate("continueGame('warriorcity')"); load(p); print('load s', round(time.time() - t0, 1))
    s = p.evaluate(STATE); check('A save', s)
    st = p.evaluate("(() => { let t = 0, worst = 0; for (let i = 0; i < 120; i++) { const a = performance.now(); try { step(0.05); } catch (e) { reportErr(e); } INPUT.press.clear(); const d = performance.now() - a; t += d; worst = Math.max(worst, d); } return [+(t / 120).toFixed(1), Math.round(worst)]; })()")
    print('step ms', st)
    p.evaluate("(() => { const v = ownCamp(); P.a.pos.set(v.x + 3.5, 0, v.z + 3.5); P.a.ground(1, true); CAM.yaw = Math.atan2(-3.5, -3.5) + Math.PI; CAM.pitch = 0.32; CAM.init = false; __sim(1); })()")
    p.evaluate("__clean()"); p.evaluate("renderFrame()"); p.screenshot(path=OUT + '/city_fire.png')
    gate = p.evaluate("(() => { const v = ownCamp(), g = BLD.list.filter(b => b.t === 'gatehouse').sort((a, b) => (b.z - v.z) - (a.z - v.z))[0]; const dx = g.x - v.x, dz = g.z - v.z, d = Math.hypot(dx, dz); P.a.pos.set(g.x - dx / d * 14, 0, g.z - dz / d * 14); P.a.ground(1, true); CAM.yaw = Math.atan2(g.x - P.a.pos.x, g.z - P.a.pos.z) + Math.PI; CAM.pitch = 0.18; CAM.init = false; __sim(1); return [Math.round(g.x), Math.round(g.z)]; })()")
    p.evaluate("__clean()"); p.evaluate("renderFrame()"); p.screenshot(path=OUT + '/city_gate.png')
    p.evaluate("(() => { const v = ownCamp(); camera.position.set(v.x + 40, 150, v.z + 120); camera.lookAt(v.x, 0, v.z - 5); if (scene.fog) scene.fog.density = 0.0004; window.__freeze = true; $('hud').hidden = true; renderFrame(); })()")
    p.screenshot(path=OUT + '/city_air.png')
    ctx.close()
    # ---- B: a device without the save: the transfer code ----
    ctx, p, errs = page_for(br, 'file://' + NEW)
    print('import', repr(p.evaluate("c => xferImport(c)", CODE)))
    p.evaluate("syncContinue(); continueGame('warriorcity')"); load(p)
    check('B code', p.evaluate(STATE))
    ctx.close()
    # ---- C: the app with the game that comes with it ----
    www = os.path.join(ROOT, 'dist', 'www')
    Handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=www)
    Handler.log_message = lambda *a: None
    srv = socketserver.TCPServer(('127.0.0.1', 0), Handler); port = srv.server_address[1]
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    ctx, p, errs = page_for(br, f'http://127.0.0.1:{port}/index.html?app=1', w=844, h=390, touch=True)
    for k in range(40):
        if p.evaluate("saveIndex().some(e => e.id === 'warriorcity')"): break
        time.sleep(0.5)
    print('app menu', p.evaluate("[$('contBtn').hidden, $('contBtn').textContent, $('saveLine').textContent, localStorage.getItem('amazonia-gifts-in')]"))
    p.screenshot(path=OUT + '/city_app_menu.png')
    p.evaluate("continueGame('warriorcity')"); load(p)
    check('C app', p.evaluate(STATE))
    p.evaluate("renderFrame()"); p.screenshot(path=OUT + '/city_app_play.png')
    # a second start of the app does not bring it again after it was deleted
    p.evaluate("UI.toMenu(); deleteSlot('warriorcity'); syncContinue()")
    p.reload(); p.wait_for_function("() => typeof G !== 'undefined' && G.mode === 'menu'", timeout=300000); time.sleep(3)
    print('after delete + restart', p.evaluate("saveIndex().map(e => e.id)"))
    ctx.close(); srv.shutdown()
    print('errors', errs[:5])
    br.close()
