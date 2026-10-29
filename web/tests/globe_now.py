import sys, json, time; sys.path.insert(0, __file__.rsplit('/', 1)[0])
from harness import run, OUT
def t(g):
    g.hunter(); g.sim(1)
    g.js("HUNT.camps.forEach((c, i) => { if (!c.own) VX.known.add(i); });")
    g.js("$('mapov').hidden = false; bigMapDraw(); MAPV.dirty = true;")
    time.sleep(1.5)
    # let the Old World's picture finish
    for k in range(60):
        if g.js("owMapReady()"): break
        g.js("owMapStep(200)")
    g.js("mapTool('world'); MAPV.dirty = true;"); time.sleep(1.2)
    g.page.screenshot(path=f"{OUT}/now_world.png")
    g.js("mapTool('globe'); MAPV.dirty = true;"); time.sleep(1.5)
    g.page.screenshot(path=f"{OUT}/now_globe.png")
    g.js("MAPV.gLon += 2.2; MAPV.dirty = true;"); time.sleep(1.2)
    g.page.screenshot(path=f"{OUT}/now_globe2.png")
    print('errs', g.errors()[:6])
run(t)
