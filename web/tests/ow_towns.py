import sys, json; sys.path.insert(0, __file__.rsplit('/', 1)[0])
from harness import run
WHICH = sys.argv[1:] or None
def t(g):
    print('boot s', round(g.boot_s, 1), g.js("({ow: Math.round(OWR.ms), veg: OWR.veg, heap: Math.round(performance.memory.usedJSHeapSize / 1e6)})"))
    g.hunter(); g.sim(1)
    camps = g.js("HUNT.camps.map((c, i) => c.civ ? [i, c.set.id, c.tribe, Math.round(c.x), Math.round(c.z)] : null).filter(Boolean)")
    # wake the Old World: stand in it
    g.js("P.a.pos.set(4500, 0, 0); P.a.ground(1, true);")
    for k in range(25): g.sim(0.2)
    print('awake', g.js("HUNT.camps.filter(c => c.civ && !c.dormant).length"), 'people', g.js("HUNT.camps.filter(c => c.civ).reduce((s, c) => s + c.hunters.length, 0)"), 'heap', g.js("Math.round(performance.memory.usedJSHeapSize / 1e6)"))
    for i, sid, name, x, z in camps:
        if WHICH and sid not in WHICH: continue
        g.js(f"(() => {{ const c = HUNT.camps[{i}], a = P.a, d = c.kind === 'village' ? 34 : 48, ang = Math.atan2(c.rx - c.x, c.rz - c.z) + 0.5; a.pos.set(c.x + Math.sin(ang) * d, 0, c.z + Math.cos(ang) * d); a.ground(1, true); a.yaw = ang + Math.PI; CAM.yaw = a.yaw; CAM.init = false; CAM.pitch = 0.42; CAM.dist = 14; G.time = 10; }})()")
        g.sim(1.2)
        g.shot('town_' + sid)
        print(sid, name, g.js(f"HUNT.camps[{i}].hunters.map(h => h.name + '/' + h.cls).slice(0, 4).join(', ')"))
    print('errs', g.errors()[:6])
run(t)
