import sys, json, time; sys.path.insert(0, __file__.rsplit('/', 1)[0])
from harness import run, OUT
def t(g):
    g.hunter(); g.sim(1)
    g.js("for (let k = 0; k < 4000 && !owMapReady(); k++) owMapStep(50);")
    g.js("glbTexReady(true)")
    g.js("UI.open('map')"); time.sleep(0.5); g.js("bigDraw()")
    print('cloud ms', g.js("(() => { const t0 = performance.now(); glbCloudBuild(); return performance.now() - t0; })()"))
    for k in range(4):
        print('render full', g.js("(() => { MAPV.gLon += 0.01; const R = glbR0(), t0 = performance.now(); const d = glbRender(MAPV.cw / 2, MAPV.ch / 2, R, MAPV.cw, MAPV.ch, 1, 0.5); return [performance.now() - t0, GLB.cv.width * GLB.cv.height]; })()"))
    for k in range(3):
        print('render no clouds', g.js("(() => { MAPV.gLon += 0.01; const R = glbR0(), t0 = performance.now(); const d = glbRender(MAPV.cw / 2, MAPV.ch / 2, R, MAPV.cw, MAPV.ch, 1, 0); return [performance.now() - t0, GLB.cv.width * GLB.cv.height]; })()"))
    for k in range(3):
        print('bigDraw', g.js("(() => { MAPV.gLon += 0.01; const t0 = performance.now(); bigDraw(); return performance.now() - t0; })()"))
    for k in range(3):
        print('bigDraw cached', g.js("(() => { const t0 = performance.now(); bigDraw(); return performance.now() - t0; })()"))
run(t)
