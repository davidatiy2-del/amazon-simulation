import sys, json, time; sys.path.insert(0, __file__.rsplit('/', 1)[0])
from harness import run, OUT
def t(g):
    g.hunter(); g.sim(1)
    g.js("for (let k = 0; k < 4000 && !owMapReady(); k++) owMapStep(50);")
    print('begin ms', g.js("(() => { const t0 = performance.now(); glbTexBegin(); return performance.now() - t0; })()"))
    for k in range(6):
        print('step rows', g.js("GLB.tb.j"), 'ms', g.js("(() => { const t0 = performance.now(); glbTexStep(16); return performance.now() - t0; })()"))
    print('getHT x1e5 ms', g.js("(() => { const t0 = performance.now(); let s = 0; for (let i = 0; i < 1e5; i++) s += getHT(-1400 + i * 0.028, 300); return performance.now() - t0; })()"))
    print('n2 x1e5 ms', g.js("(() => { const t0 = performance.now(); let s = 0; for (let i = 0; i < 1e5; i++) s += Noise.n2(i * 0.01, 3.3); return performance.now() - t0; })()"))
    print('mapColorAt x1e4 ms', g.js("(() => { const t0 = performance.now(); const o = [0,0,0]; for (let i = 0; i < 1e4; i++) mapColorAt(1460, -1000 + i * 0.2, o, true); return performance.now() - t0; })()"))
run(t)
