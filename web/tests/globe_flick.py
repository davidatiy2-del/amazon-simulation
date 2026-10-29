import sys, json, time; sys.path.insert(0, __file__.rsplit('/', 1)[0])
from harness import run, OUT
def t(g):
    g.hunter(); g.sim(1)
    g.js("for (let k = 0; k < 4000 && !owMapReady(); k++) owMapStep(50); glbTexReady(true); glbCloudBuild();")
    g.js("UI.open('map')"); time.sleep(0.5); g.js("bigDraw()")
    box = g.js("(() => { const r = $('bigmap').getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; })()")
    cx, cy = box[0] + box[2] / 2, box[1] + box[3] / 2
    m = g.page.mouse
    g.js("window.__ev = []; for (const t of ['pointerdown','pointermove','pointerup']) $('bigmap').addEventListener(t, e => __ev.push([t, Math.round(performance.now()), Math.round(e.clientX)]));")
    m.move(cx, cy); m.down()
    for k in range(1, 6): m.move(cx - k * 40, cy); time.sleep(0.012)
    print('trk before up', g.js("[Math.round(performance.now()), GLB.trk.map(q => [Math.round(q[0]), q[1].toFixed(3)])]"))
    m.up()
    print('vel', g.js("GLB.vel"), g.js("__ev.slice(-8)"))
run(t)
