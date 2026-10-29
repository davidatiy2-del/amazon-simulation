"""A village founded in this build is kept: it is saved, and after the page is opened again "continue" brings it back
with its buildings, its people and its store. Also measures how big a save is, and whether saving ever fails."""
import sys, os, json, time; sys.path.insert(0, __file__.rsplit('/', 1)[0])
from playwright.sync_api import sync_playwright
from harness import ARGS, HELPERS, ROOT
NEW = os.environ.get('GAME', os.path.join(ROOT, 'amazonia.html'))
LONG = float(os.environ.get('LONG', 0))


def page_for(br, path):
    ctx = br.new_context(viewport={'width': 1280, 'height': 800})
    p = ctx.new_page(); p.set_default_timeout(300000); errs = []
    p.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)))
    p.on('console', lambda m: errs.append('CONSOLE ' + m.text) if m.type == 'error' else None)
    p.goto('file://' + path)
    p.wait_for_function("() => typeof G !== 'undefined' && G.mode === 'menu'", timeout=200000)
    p.evaluate(HELPERS)
    return ctx, p, errs


STATE = """(() => { const v = ownCamp(); return { own: !!v, v: v ? [Math.round(v.x), Math.round(v.z)] : null, tier: villageTier(), b: BLD.list.length, done: BLD.list.filter(b => b.done).length,
  people: clanAdults().length, pop: v ? popCount() : 0, wood: Math.round((CAMPH.store && CAMPH.store.wood) || 0), gold: goldHave(), day: G.day,
  pos: [Math.round(P.a.pos.x), Math.round(P.a.pos.z)] }; })()"""

with sync_playwright() as pw:
    br = pw.chromium.launch(args=ARGS)
    ctx, p, errs = page_for(br, NEW)
    p.evaluate("__hunter('m')"); p.evaluate("__sim(1)")
    made = p.evaluate("""(() => {
      const spot = (() => { for (let r = 0; r < 400; r += 10) for (let a = 0; a < 12; a++) { const x = 260 + Math.cos(a) * r, z = 40 + Math.sin(a) * r; if (waterDepth(x, z) === 0 && getNY(x, z) > 0.9 && HUNT.camps.every(c => Math.hypot(c.x - x, c.z - z) > 110)) return { x, z }; } })();
      P.a.pos.set(spot.x, 0, spot.z); P.a.ground(1, true);
      const v = foundCampAt(spot.x, spot.z);      // as the button does it
      for (const k of ['builder', 'builder', 'warrior', 'warrior', 'hunter', 'gatherer', 'gatherer']) spawnNewcomer(v, k);
      boxStore(); CAMPH.store.wood = 400; goldAdd(33);
      const put = [];
      for (const t of ['hut', 'hut', 'granary', 'totem', 'hut']) {
        let ok = false;
        for (let r = 12; r < 40 && !ok; r += 2) for (let a = 0; a < 24 && !ok; a++) {
          const x = v.x + Math.cos(a / 24 * TAU) * r, z = v.z + Math.sin(a / 24 * TAU) * r;
          if (buildCheck(t, x, z, 0, 1)) continue;
          payWood(BTYPES[t].wood); const b = addBuilding(t, x, z, 0, 0, false, true); buildDone(b, true); put.push(t); ok = true;
        }
      }
      return { put, v: [Math.round(v.x), Math.round(v.z)] };
    })()""")
    print('made', made)
    p.evaluate("__sim(3)")
    if LONG:
        # a long game: days go by, the village lives, raids come; save on the way and see it never fails
        fails = 0; t0 = time.time(); sizes = []
        for k in range(int(LONG)):
            p.evaluate("__sim(20)")
            r = p.evaluate("(() => { let ok = false, err = ''; try { ok = saveGame(); } catch (e) { err = String(e); } const s = localStorage.getItem('amazonia-slot-' + PROG.slot) || ''; return { ok, err, len: s.length, day: G.day, pop: popCount() }; })()")
            sizes.append(r['len'])
            if not r['ok']: fails += 1; print('SAVE FAILED', r)
        print('long run', round(time.time() - t0), 's, fails', fails, 'sizes', sizes[0], '->', sizes[-1])
    p.evaluate("__sim(22)")   # the game saves by itself every 20 seconds
    before = p.evaluate(STATE)
    ok = p.evaluate("(() => { try { return saveGame(); } catch (e) { return String(e); } })()")
    info = p.evaluate("""(() => { const s = localStorage.getItem('amazonia-slot-' + PROG.slot) || '', d = JSON.parse(s || 'null');
      let all = 0; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); all += k.length + (localStorage.getItem(k) || '').length; }
      const part = {}; if (d && d.vx) for (const k in d.vx) part[k] = JSON.stringify(d.vx[k] ?? null).length;
      const top = Object.entries(part).sort((a, b) => b[1] - a[1]).slice(0, 8);
      return { slot: PROG.slot, len: s.length, all, ownCamp: d && d.ownCamp, b: d && d.vx && d.vx.b && d.vx.b.length, tribe: d && d.tribe && d.tribe.length, top, tribeLen: JSON.stringify(d.tribe).length }; })()""")
    print('before', before, 'save ok', ok)
    print('save', info)
    store = p.evaluate("(() => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k); } return o; })()")
    print('errors', (errs + p.evaluate('__errs()'))[:6])
    ctx.close()

    ctx, p, errs = page_for(br, NEW)
    p.evaluate("s => { localStorage.clear(); for (const k in s) localStorage.setItem(k, s[k]); syncContinue(); }", store)
    print('menu', p.evaluate("[!$('contBtn').hidden, $('contBtn').textContent, $('startBtn').textContent]"))
    p.evaluate("(() => { const id = saveIndex().sort((a, b) => b.at - a.at)[0].id; continueGame(id); window.askPreg = () => {}; })()")
    time.sleep(0.5)
    p.evaluate("__clean()"); p.evaluate("__sim(6)"); p.evaluate("__clean()")
    after = p.evaluate(STATE)
    print('after ', after)
    good = after['own'] and after['v'] == before['v'] and after['b'] == before['b'] and after['people'] >= before['people'] - 1 and abs(after['wood'] - before['wood']) < 40
    print('OK' if good else 'MISMATCH', 'errors', (errs + p.evaluate('__errs()'))[:6])
    ctx.close(); br.close()
