"""Every way of playing still starts and runs: a jaguar, a capybara, a macaw, a fish, and the hunter (woman)."""
import sys, json; sys.path.insert(0, __file__.rsplit('/', 1)[0])
from harness import run
SP = sys.argv[1:] or ['jaguar', 'capybara', 'macaw', 'arapaima', 'hunter_f']
def t(g):
    for sp in SP:
        if sp == 'hunter_f': g.js("__hunter('f')")
        else: g.js(f"(() => {{ SET.sp = '{sp}'; SET.sex = 'm'; saveSet(); startGame(false); window.askPreg = () => {{}}; }})()")
        g.js('window.__freeze = true')
        g.sim(8)
        r = g.js("({ mode: G.mode, sp: P.spId, alive: P.a && P.a.alive, x: Math.round(P.a.pos.x), z: Math.round(P.a.pos.z), n: ANIMALS.length })")
        print(sp, r, 'errs', g.errors()[:3])
        # a walk across the sea to the Old World would be a swim: just teleport to see it runs there too
        if sp in ('jaguar', 'hunter_f'):
            g.js("P.a.pos.set(4500, 0, -300); P.a.ground(1, true);")
            for k in range(30): g.sim(0.25)
            print(sp, 'in the Old World', g.js("({ land: landAt(P.a.pos.x, P.a.pos.z), dormant: HUNT.camps.filter(c => c.dormant).length, owf: OWF.on })"), 'errs', g.errors()[:3])
        g.js("G.mode = 'menu'")
run(t)
