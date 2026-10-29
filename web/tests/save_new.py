"""A game saved in the Old World comes back as it was: where the hunter stands, trust with a castle, a beaten gang of bandits."""
import sys, os, json, time; sys.path.insert(0, __file__.rsplit('/', 1)[0])
from playwright.sync_api import sync_playwright
from harness import ARGS, HELPERS, ROOT
from town import SETUP
NEW = os.path.join(ROOT, 'amazonia.html')
def page_for(br):
    ctx = br.new_context(viewport={'width': 1280, 'height': 800})
    p = ctx.new_page(); errs = []
    p.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)))
    p.on('console', lambda m: errs.append('CONSOLE ' + m.text) if m.type == 'error' else None)
    p.goto('file://' + NEW)
    p.wait_for_function("() => typeof G !== 'undefined' && G.mode === 'menu'", timeout=120000)
    p.evaluate(HELPERS)
    return ctx, p, errs
with sync_playwright() as pw:
    br = pw.chromium.launch(args=ARGS)
    ctx, p, errs = page_for(br)
    p.evaluate("__hunter('m')"); p.evaluate("__sim(1)"); p.evaluate(SETUP)
    p.evaluate("(() => { const c = HUNT.camps.find(c => c.set && c.set.id === 'mill'); P.a.pos.set(c.x + 40, 0, c.z); P.a.ground(1, true); })()")
    for k in range(40): p.evaluate("__sim(0.2)")
    before = p.evaluate("""(() => {
      const li = HUNT.camps.findIndex(c => c.set && c.set.id === 'lion'); VX.known.add(li); addTrust(li, 25);
      const b = ROADS.bandits[0].camp; for (const h of b.hunters.slice()) if (h.alive) { h.hp = 1; hurt(h, 50, P.a); }
      __sim(1.5);
      return { ok: saveGame(), li, trust: campTrust(li), bg0: PROG.flags.bg0, pos: [Math.round(P.a.pos.x), Math.round(P.a.pos.z)], gold: goldHave(), owNews: PROG.flags.owNews };
    })()""")
    store = p.evaluate("(() => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k); } return o; })()")
    print('saved', before, 'errors', (errs + p.evaluate('__errs()'))[:4])
    ctx.close()
    ctx, p, errs = page_for(br)
    p.evaluate("s => { localStorage.clear(); for (const k in s) localStorage.setItem(k, s[k]); syncContinue(); }", store)
    p.evaluate("(() => { const id = saveIndex().sort((a, b) => b.at - a.at)[0].id; continueGame(id); window.askPreg = () => {}; })()")
    time.sleep(0.5)
    for k in range(40): p.evaluate("__sim(0.2)")
    p.evaluate("__clean()")
    after = p.evaluate("""(() => { const li = HUNT.camps.findIndex(c => c.set && c.set.id === 'lion'), b = ROADS.bandits[0].camp;
      return { mode: G.mode, li, trust: campTrust(li), bg0: PROG.flags.bg0, cleared: b.clearDay, banditsAlive: b.hunters.filter(h => h.alive).length, pos: [Math.round(P.a.pos.x), Math.round(P.a.pos.z)], gold: goldHave(), dormant: HUNT.camps.filter(c => c.dormant).length, owf: OWF.on }; })()""")
    print('loaded', after, 'errors', (errs + p.evaluate('__errs()'))[:4])
    ok = after['trust'] == before['trust'] and after['banditsAlive'] == 0 and after['pos'] == before['pos'] and after['gold'] == before['gold']
    print('OK' if ok else 'MISMATCH')
    ctx.close(); br.close()
