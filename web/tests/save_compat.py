"""Saves from the published versions load in the new build: the village, its people, its gold, the day."""
import sys, os, json, time; sys.path.insert(0, __file__.rsplit('/', 1)[0])
from playwright.sync_api import sync_playwright
from harness import ARGS, HELPERS, ROOT
from town import SETUP
OLD = sys.argv[1:] or ['v47_1.html', 'v47_published.html']
NEW = os.path.join(ROOT, 'amazonia.html')
def page_for(br, path):
    ctx = br.new_context(viewport={'width': 1280, 'height': 800})
    p = ctx.new_page(); errs = []
    p.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)))
    p.on('console', lambda m: errs.append('CONSOLE ' + m.text) if m.type == 'error' else None)
    p.goto('file://' + path)
    p.wait_for_function("() => typeof G !== 'undefined' && G.mode === 'menu'", timeout=120000)
    p.evaluate(HELPERS)
    return ctx, p, errs
with sync_playwright() as pw:
    br = pw.chromium.launch(args=ARGS)
    for old in OLD:
        ctx, p, errs = page_for(br, os.path.join(ROOT, old))
        p.evaluate("__hunter('m')"); p.evaluate("__sim(1)")
        p.evaluate(SETUP)
        p.evaluate("(() => { goldAdd(57); const st = boxStore(); st.wood = (st.wood || 0) + 40; st.cooked = (st.cooked || 0) + 12; })()")
        # a tribe that split into two (the daughter takes a new number), and trust with it
        split = p.evaluate("(() => { const i = npcIdx().find(i => HUNT.camps[i].hunters.length > 4); const c = HUNT.camps[i]; c.lvl = 3; c.gp = 6; const n0 = HUNT.camps.length; const ok = typeof tribeSplit === 'function' && tribeSplit(c, i); const d = HUNT.camps.findIndex(q => q.dau); if (d >= 0) { VX.known.add(d); addTrust(d, 33); } return { ok: !!ok, n0, n1: HUNT.camps.length, d, name: d >= 0 ? HUNT.camps[d].tribe : null }; })()")
        p.evaluate("__sim(4)")
        before = p.evaluate("({ ok: saveGame(), day: G.day, gold: goldHave(), people: clanAdults().length, v: ownCamp() ? [Math.round(ownCamp().x), Math.round(ownCamp().z)] : null, pos: [Math.round(P.a.pos.x), Math.round(P.a.pos.z)], dau: HUNT.camps.filter(q => q.dau).map(q => [HUNT.camps.indexOf(q), q.tribe, campTrust(HUNT.camps.indexOf(q))]) })")
        print('split', split)
        store = p.evaluate("(() => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k); } return o; })()")
        ctx.close()
        print(old, 'saved', before, 'keys', len(store), 'errors', errs[:3])
        ctx, p, errs = page_for(br, NEW)
        p.evaluate("s => { localStorage.clear(); for (const k in s) localStorage.setItem(k, s[k]); syncContinue(); }", store)
        p.evaluate("(() => { const id = saveIndex().sort((a, b) => b.at - a.at)[0].id; continueGame(id); })()")
        p.evaluate("window.askPreg = () => {}")
        time.sleep(0.5)
        p.evaluate("__clean()"); p.evaluate("__sim(10)"); p.evaluate("__clean()")
        after = p.evaluate("({ mode: G.mode, day: G.day, gold: goldHave(), people: clanAdults().length, v: ownCamp() ? [Math.round(ownCamp().x), Math.round(ownCamp().z)] : null, pos: [Math.round(P.a.pos.x), Math.round(P.a.pos.z)], camps: HUNT.camps.length, roads: ROADS.list.length, dau: HUNT.camps.filter(q => q.dau).map(q => [HUNT.camps.indexOf(q), q.tribe, campTrust(HUNT.camps.indexOf(q))]), lion: HUNT.camps.findIndex(q => q.set && q.set.id === 'lion') })")
        ok = after['mode'] == 'play' and after['v'] == before['v'] and after['gold'] == before['gold'] and after['people'] >= before['people'] - 1 and after['dau'] == before['dau']
        print(old, '-> new', after, 'OK' if ok else 'MISMATCH', 'errors', (errs + p.evaluate('__errs()'))[:5])
        p.evaluate('renderFrame()')
        ctx.close()
    br.close()
