import sys, json; sys.path.insert(0, __file__.rsplit('/', 1)[0])
from harness import run
TARGET = sys.argv[1] if len(sys.argv) > 1 else 'vines'
def t2(g):
    g.hunter(); g.sim(1)
    g.js("P.a.pos.set(4500, 0, 0); P.a.ground(1, true);")
    for k in range(40): g.sim(0.2)
    vi = g.js(f"HUNT.camps.findIndex(c => c.set && c.set.id === '{TARGET}')")
    spot = g.js(f"""(() => {{ const c = HUNT.camps[{vi}]; for (let r = 130; r < 400; r += 15) for (let a = 0; a < 16; a++) {{ const x = c.x + Math.cos(a / 16 * TAU) * r, z = c.z + Math.sin(a / 16 * TAU) * r;
      if (waterDepth(x, z) === 0 && getNY(x, z) > 0.9 && !roadFine(x, z) && HUNT.camps.every(q => Math.hypot(q.x - x, q.z - z) > 110)) return [x, z]; }} return null; }})()""")
    g.js(f"(() => {{ P.a.pos.set({spot[0]}, 0, {spot[1]}); P.a.ground(1, true); const v = foundCampAt({spot[0]}, {spot[1]}, true); CAMPH.camp = v; v.own = true; for (let k = 0; k < 8; k++) spawnNewcomer(v, 'warrior'); declareWar({vi}, 'בדיקה'); }})()")
    g.js("PLUNDER.want = { food: true, goods: true, beasts: true }")
    print(g.js(f"(() => {{ const men = clanAdults().filter(m => m.cls === 'warrior'); const p = ourRaidStart({vi}, men, false); window.__p = p; return {{ men: men.length }}; }})()"))
    for k in range(40):
        g.js("(() => { const p = __p, m = p.men.find(m => m.alive); if (m) { P.a.pos.set(m.pos.x + 6, 0, m.pos.z + 6); P.a.ground(1, true); } })()")
        g.sim(5)
        ph = g.js("__p.phase")
        if ph == 'attack' and k % 3 == 0:
            r = g.js(f"""(() => {{ const c = HUNT.camps[{vi}], p = __p;
              const D = defendersAt(c).map(h => [h.name, h.cls, h.brain || '-', h.state, Math.round(Math.hypot(h.pos.x - c.x, h.pos.z - c.z)), Math.round(h.hp), h.foe ? (h.foe.name || '?') : '']);
              const M = p.men.map(m => [m.name, m.state, m.foe ? m.foe.name : '', Math.round(Math.hypot(m.pos.x - c.x, m.pos.z - c.z)), Math.round(m.hp), m.rret ? 'ret' : '']);
              return {{ t: Math.round(p.t), clearT: p.clearT, D, M }}; }})()""")
            print(k, json.dumps(r, ensure_ascii=False))
        if ph in ('home', 'loot') or g.js("__p.done"): print('phase', ph, json.dumps(g.js("__p.got"), ensure_ascii=False)); break
    print('errs', g.errors()[:5])
run(t2)
