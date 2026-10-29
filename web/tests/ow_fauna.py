import sys, json; sys.path.insert(0, __file__.rsplit('/', 1)[0])
from harness import run, OUT
def t(g):
    g.hunter(); g.sim(1)
    n0 = g.js("ANIMALS.length")
    heap0 = g.js("performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : -1")
    g.js("P.a.pos.set(4500, 0, 0); P.a.ground(1, true);")
    for k in range(50): g.sim(0.2)
    r = g.js("""(() => { const by = {}; for (const a of ANIMALS) if (a.owf && a.alive) by[a.owf] = (by[a.owf] || 0) + 1;
      return { on: OWF.on, total: ANIMALS.length, ow: Object.values(by).reduce((s, n) => s + n, 0), by, lb: Object.keys(OWF.lb || {}) }; })()""")
    print('animals before', n0, 'after', json.dumps(r, ensure_ascii=False))
    heap1 = g.js("performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : -1")
    print('heap MB', heap0, '->', heap1)
    # look at a few of them up close
    for sid in ['deer', 'boar', 'tiger', 'reindeer', 'lion', 'camel', 'horse']:
        ok = g.js(f"""(() => {{ const a = ANIMALS.find(b => b.alive && b.owf && b.spId === '{sid}'); if (!a) return null;
          P.a.pos.set(a.pos.x + 8, 0, a.pos.z + 8); P.a.ground(1, true); G.time = 11; a.frozen = true; return [Math.round(a.pos.x), Math.round(a.pos.z), a.tplKey]; }})()""")
        if not ok: print('none of', sid); continue
        g.sim(0.4)
        g.js(f"""(() => {{ const a = ANIMALS.find(b => b.alive && b.owf && b.spId === '{sid}' && b.frozen); const p = a.pos, s = Math.max(2.5, a.height * 2.6);
          camera.position.set(p.x + s, p.y + s * 0.55, p.z + s); camera.lookAt(p.x, p.y + a.height * 0.5, p.z); updateVeg(true); renderFrame(); a.frozen = false; }})()""")
        g.page.evaluate("document.getElementById('hud').style.visibility = 'hidden'")
        g.page.screenshot(path=f"{OUT}/owf_{sid}.png")
        g.page.evaluate("document.getElementById('hud').style.visibility = ''")
        print('shot', sid, ok)
    # a minute of the Old World, and the land names as the hunter walks through them
    t0 = g.js("performance.now()"); g.sim(30); t1 = g.js("performance.now()")
    print('30s sim ms', round(t1 - t0))
    r = g.js("({ told: Object.keys(ATMO.told), w: ATMO.w.map(v => +v.toFixed(2)), land: ATMO.land })")
    print('atmo', r)
    for L, (x, z) in {'africa': (4500 - 0.42 * 1500, 0.6 * 1500), 'north': (4500 - 0.4 * 1500, -0.8 * 1500), 'arabia': (4500 + 0.02 * 1500, 0.32 * 1500)}.items():
        g.js(f"P.a.pos.set({x}, 0, {z}); P.a.ground(1, true); camera.position.set({x}, 30, {z} + 20);")
        g.sim(4)
        print(L, g.js("({ land: ATMO.land, w: ATMO.w.map(v => +v.toFixed(2)), heat: +ATMO.heat.toFixed(2), cold: +ATMO.cold.toFixed(2) })"))
    print('errs', g.errors()[:8])
run(t)
