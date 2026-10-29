import sys, json, time; sys.path.insert(0, __file__.rsplit('/', 1)[0])
from harness import run, OUT
def t(g):
    g.hunter(); g.sim(1)
    g.js("P.a.pos.set(3700, 0, -420); P.a.ground(1, true);")
    for k in range(40): g.sim(0.2)
    g.js("HUNT.camps.forEach((c, i) => { if (!c.own) VX.known.add(i); });")
    for name, cx, cz, s in [('eu', 3750, -500, 0.9), ('ow', 4500, 0, 0.3), ('af', 4300, 500, 0.6)]:
        g.js(f"$('mapov').hidden = false; bigMapDraw(); MAPV.globe = false; MAPV.cx = {cx}; MAPV.cz = {cz}; MAPV.s = {s}; MAPV.fit = false; MAPV.dirty = true; bigDraw();")
        for k in range(30):
            time.sleep(0.25)
            if g.js("!MAPV.tq || !MAPV.tq.length"): break
        time.sleep(0.6)
        g.page.screenshot(path=f"{OUT}/map_{name}.png")
        g.js("$('mapov').hidden = true;")
        time.sleep(0.2)
    print('errs', g.errors()[:6])
run(t)
