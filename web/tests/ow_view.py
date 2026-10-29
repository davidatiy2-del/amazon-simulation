import sys, json; sys.path.insert(0, __file__.rsplit('/', 1)[0])
from harness import run
SPOTS = [('europe', -0.62, -0.25), ('nordic', -0.42, -0.66), ('steppe', 0.05, -0.40), ('china', 0.56, -0.05), ('japan', 0.885, -0.20), ('arabia', 0.07, 0.18), ('egypt', -0.18, 0.30), ('africa', -0.50, 0.50), ('india', 0.36, 0.48), ('alps', -0.47, -0.05), ('atlantic', -1.25, 0.2)]
def t(g):
    print('boot s', round(g.boot_s, 1))
    print(g.js("({ow: OWR.ms, veg: OWR.veg, camps: HUNT.camps.length, civ: HUNT.camps.filter(c => c.civ).map(c => [c.tribe, Math.round(c.x), Math.round(c.z), Math.round(c.y)]), heap: performance.memory.usedJSHeapSize / 1e6, bt: (window.__bt || []).map(b => [b[0], Math.round(b[1])])})"))
    g.hunter(); g.sim(1)
    for name, u, v in SPOTS:
        x = 4500 + u * 1500; z = v * 1500
        g.js(f"(() => {{ P.a.pos.set({x}, 0, {z}); P.a.ground(1, true); CAM.init = false; CAM.pitch = 0.32; CAM.dist = 9; G.time = 10; }})()")
        g.sim(1.5)
        info = g.js(f"({{ land: landAt({x}, {z}), h: getH({x}, {z}).toFixed(1), wd: waterDepth({x}, {z}).toFixed(1) }})")
        print(name, info)
        g.shot('ow_' + name)
    print('errs', g.errors()[:5])
run(t)
