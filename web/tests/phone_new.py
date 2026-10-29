"""On a phone: the question when leaving the village, and the mining button by a vein."""
import sys; sys.path.insert(0, __file__.rsplit('/', 1)[0])
from harness import run
def t(g):
    g.hunter(); g.sim(1)
    g.js("G.time = 10;")
    spot = g.js("""(() => { for (let r = 60; r < 400; r += 15) for (let a = 0; a < 16; a++) { const x = 200 + Math.cos(a / 16 * TAU) * r, z = 300 + Math.sin(a / 16 * TAU) * r;
      if (waterDepth(x, z) === 0 && getNY(x, z) > 0.9 && HUNT.camps.every(q => Math.hypot(q.x - x, q.z - z) > 120)) return [x, z]; } return null; })()""")
    g.js(f"""(() => {{ P.a.pos.set({spot[0]}, 0, {spot[1]}); P.a.ground(1, true); const v = foundCampAt({spot[0]}, {spot[1]}, true); CAMPH.camp = v; v.own = true;
      for (const k of ['warrior', 'hunter', 'builder', 'gatherer']) spawnNewcomer(v, k); }})()""")
    g.sim(2)
    g.js(f"P.a.pos.set({spot[0]} + 420, 0, {spot[1]}); P.a.ground(1, true);")
    g.sim(7)
    print('ask', g.js("!!DEPASK.el && !DEPASK.el.hidden"), g.js("(() => { const r = DEPASK.el.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height), innerWidth]; })()"))
    g.shot('phone_depask', clean=False)
    g.js("DEPASK.el.querySelector('[data-a=pick]').click()")
    g.shot('phone_depcard', clean=False)
    g.js("closeCard('depov')")
    # a gold vein in the jungle's lands
    r = g.js("""(() => { mineGen(); const d = MINES.list.filter(d => d.k === 'gold' && !isOld(d.x)).sort((a, b) => Math.hypot(a.x - P.a.pos.x, a.z - P.a.pos.z) - Math.hypot(b.x - P.a.pos.x, b.z - P.a.pos.z))[0];
      P.a.pos.set(d.x + d.r + 1.1, 0, d.z); P.a.ground(1, true); P.a.yaw = -Math.PI / 2; CAM.yaw = -Math.PI / 2 + Math.PI; return [d.k, Math.round(d.x), Math.round(d.z)]; })()""")
    g.sim(1.5)
    print('vein', r, 'ctx', g.js("P.ctx"), g.js("$('tAtk') ? 1 : 0"))
    g.shot('phone_mine', clean=False)
    print('errs', g.errors()[:6])
run(t, touch=True, w=844, h=390, mobile=True)
