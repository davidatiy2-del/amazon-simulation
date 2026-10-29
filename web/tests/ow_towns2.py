import sys, json; sys.path.insert(0, __file__.rsplit('/', 1)[0])
from harness import run
WHICH = sys.argv[1:] or None
def t(g):
    g.hunter(); g.sim(1)
    camps = g.js("HUNT.camps.map((c, i) => c.civ ? [i, c.set.id] : null).filter(Boolean)")
    g.js("P.a.pos.set(4500, 0, 0); P.a.ground(1, true);")
    for k in range(25): g.sim(0.2)
    for i, sid in camps:
        if WHICH and sid not in WHICH: continue
        g.js(f"(() => {{ const c = HUNT.camps[{i}], a = P.a, ang = Math.atan2(c.rx - c.x, c.rz - c.z) + 0.6; a.pos.set(c.x + Math.sin(ang) * 30, 0, c.z + Math.cos(ang) * 30); a.ground(1, true); G.time = 10; }})()")
        g.sim(1.0)
        g.js(f"(() => {{ const c = HUNT.camps[{i}], ang = Math.atan2(c.rx - c.x, c.rz - c.z) + 0.6, d = c.kind === 'village' ? 52 : 70; camera.position.set(c.x + Math.sin(ang) * d, c.y + d * 0.62, c.z + Math.cos(ang) * d); camera.lookAt(c.x, c.y + 3, c.z); updateVeg(true); renderFrame(); }})()")
        g.page.evaluate("document.getElementById('hud').style.visibility = 'hidden'")
        g.page.screenshot(path=f"/tmp/claude-0/-home-claude/5561d8a0-86cf-5385-954f-fc805c61f8a0/scratchpad/shots/air_{sid}.png")
        g.page.evaluate("document.getElementById('hud').style.visibility = ''")
    print('errs', g.errors()[:6])
run(t)
