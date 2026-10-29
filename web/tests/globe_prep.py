import sys, json, time; sys.path.insert(0, __file__.rsplit('/', 1)[0])
from harness import run, OUT
def t(g):
    g.hunter()
    t0 = time.time(); g.sim(32); print('sim 32s took', round(time.time() - t0, 1))
    print('prep', g.js("[MAPV.prepN, owMapReady(), !!GLB.tex && GLB.tex.full, !!GLB.cloud, GLB.warm]"))
    g.js("UI.open('map')"); time.sleep(0.2)
    print('first draw ms', round(g.js("(() => { const t0 = performance.now(); bigDraw(); return performance.now() - t0; })()"), 1))
    print('second draw ms', round(g.js("(() => { MAPV.gLon += 0.02; GLB.moveT = 0; const t0 = performance.now(); bigDraw(); return performance.now() - t0; })()"), 1))
    g.js("MAPV.gLat = 0.95; GLB.moveT = 0; bigDraw()"); time.sleep(0.2)
    g.page.screenshot(path=f"{OUT}/globe_pole2.png")
    print('errs', g.errors()[:6])
run(t)
