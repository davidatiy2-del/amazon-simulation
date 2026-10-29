import sys, json, time; sys.path.insert(0, __file__.rsplit('/', 1)[0])
from harness import run, OUT
def t(g):
    g.hunter(); g.sim(1)
    port = g.js("HUNT.camps.findIndex(c => ferryPort(c) === 'new')")
    g.js(f"(() => {{ const c = HUNT.camps[{port}]; P.a.pos.set(c.x + 6, 0, c.z + 6); P.a.ground(1, true); const t = c.hunters.find(h => h.alive && !h.young); talkNpc(t); }})()")
    g.shot('phone_talk', clean=False)
    g.js("document.querySelector('#talkov [data-a=ferry]').click()")
    g.shot('phone_ferry', clean=False)
    g.js("document.querySelector('#ferryov [data-k=\"0\"]').click()")
    time.sleep(1.8); g.sim(1)
    for k in range(30): g.sim(0.25)
    g.shot('phone_arrive')
    # bandits on the road
    g.js("(() => { goldAdd(40); const b = ROADS.bandits[1]; b.camp.ambushCD = 0; P.a.pos.set(b.ambush.x, 0, b.ambush.z); P.a.ground(1, true); })()")
    for k in range(8):
        g.sim(0.5)
        if g.js("!!document.getElementById('warov') && !document.getElementById('warov').hidden"): break
    g.shot('phone_bandits', clean=False)
    g.js("closeCard('warov')")
    g.js("$('mapov').hidden = false; bigMapDraw(); MAPV.cx = 4500; MAPV.cz = 0; MAPV.s = 0.15; MAPV.fit = false; MAPV.dirty = true;")
    time.sleep(3)
    g.page.screenshot(path=f"{OUT}/phone_map.png")
    print('errs', g.errors()[:5])
run(t, touch=True, w=844, h=390, mobile=True)
