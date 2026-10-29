import sys, json, time; sys.path.insert(0, __file__.rsplit('/', 1)[0])
from harness import run, OUT
def t(g):
    g.hunter(); g.sim(1)
    g.js("for (let k = 0; k < 4000 && !owMapReady(); k++) owMapStep(50); glbTexReady(true); glbCloudBuild();")
    g.js("UI.open('map')"); time.sleep(0.5); g.js("bigDraw()")
    box = g.js("(() => { const r = $('bigmap').getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; })()")
    cx, cy = box[0] + box[2] / 2, box[1] + box[3] / 2
    m = g.page.mouse
    lon0 = g.js("MAPV.gLon")
    # a slow drag: the ball turns under the mouse, no spin after
    m.move(cx, cy); m.down()
    for k in range(1, 11): m.move(cx + k * 20, cy + k * 3); time.sleep(0.03)
    time.sleep(0.25); m.up(); time.sleep(0.1)
    print('drag', g.js(f"[(MAPV.gLon - {lon0}).toFixed(3), MAPV.gLat.toFixed(3), !!GLB.vel, MAPV.globe]"), 'expected about', round(-200 / g.js("glbR0() * MAPV.gz"), 3))
    # a flick: it keeps spinning
    m.move(cx, cy); m.down()
    for k in range(1, 6): m.move(cx - k * 40, cy); time.sleep(0.012)
    m.up(); time.sleep(0.05)
    print('flick vel', g.js("GLB.vel && [GLB.vel.lon.toFixed(2), GLB.vel.lat.toFixed(2)]"))
    time.sleep(1.5); print('after spin', g.js("[!!GLB.vel, MAPV.gLon.toFixed(3)]"))
    # tap: info
    g.js("MAPV.gLon = glbLon(OW.cx - 600); MAPV.gLat = 0.2; MAPV.gz = 1.4; MAPV.dirty = true;"); time.sleep(0.4); g.js("bigDraw()")
    f = g.js("(() => { const f = MAPV.feats.find(f => f.k === 'tribe'); return f ? [f.x, f.y, f.o.tribe] : null; })()")
    print('feat', f)
    if f:
        m.click(box[0] + f[0], box[1] + f[1]); time.sleep(0.5)
        print('info shown', g.js("!$('mapInfo').hidden"), g.js("$('mapInfo').querySelector('b') && $('mapInfo').querySelector('b').textContent"))
        time.sleep(0.4)
    # the wheel: in, in, into the flat map
    m.move(cx, cy)
    for k in range(8):
        m.wheel(0, -120); time.sleep(0.12)
    print('wheel in', g.js("[MAPV.globe, MAPV.gz.toFixed(2), (MAPV.s || 0).toFixed(3)]"))
    for k in range(10):
        m.wheel(0, 120); time.sleep(0.12)
    print('wheel out', g.js("[MAPV.globe, MAPV.gz.toFixed(2)]"))
    # double click on the ball: closer, there
    gz0 = g.js("MAPV.gz")
    m.dblclick(cx + 40, cy - 30); time.sleep(1.4)
    print('dbl', g.js(f"[MAPV.globe, (MAPV.gz / {gz0}).toFixed(2), !!GLB.anim]"))
    time.sleep(0.3); g.page.screenshot(path=f"{OUT}/globe_input.png")
    # the buttons
    g.js("document.querySelector('#mapov [data-m=globe]').click()"); time.sleep(0.5)
    print('btn', g.js("[MAPV.globe, document.querySelector('#mapov [data-m=globe]').classList.contains('on')]"))
    g.js("document.querySelector('#mapov [data-m=out]').click()"); time.sleep(0.2)
    g.js("document.querySelector('#mapov [data-m=out]').click()"); time.sleep(0.2)
    print('out x2', g.js("[MAPV.globe, MAPV.globe ? MAPV.gz.toFixed(2) : MAPV.s.toFixed(3)]"))
    # back button of the phone: closes the map
    print('appBack', g.js("appBack()"), g.js("$('mapov').hidden"))
    print('errs', g.errors()[:6])
run(t)
