import sys, json, time; sys.path.insert(0, __file__.rsplit('/', 1)[0])
from harness import run, OUT
def t(g):
    g.hunter(); g.sim(1)
    g.js("G.time = 9.5; HUNT.camps.forEach((c, i) => { if (!c.own) VX.known.add(i); });")
    g.js("P.a.pos.set(3700, 0, -420); P.a.ground(1, true);")
    for k in range(40): g.sim(0.2)
    c = g.js("""(() => { const c = HUNT.camps.find(c => c.tribe === 'טירת האריה'); window.__c = c; window.__ch = chiefOfCamp(c);
      for (let k = 0; k < 20; k++) { const o = npcTripPick(c); if (o && o.kind === 'visit') { window.__o = o; return [o.to.tribe, o.path.length, o.path.slice(0, 4).map(p => [Math.round(p.x), Math.round(p.z)]), o.path.slice(-2).map(p => [Math.round(p.x), Math.round(p.z)]), [Math.round(c.x), Math.round(c.z)], [Math.round(__ch.pos.x), Math.round(__ch.pos.z)], __ch.brain, __ch.state, !!__ch.mount]; } } return null; })()""")
    print('pick', c)
    g.js("P.a.pos.set(__c.x + 20, 0, __c.z + 20); P.a.ground(1, true); npcTripStart(__c, __ch, __o);")
    for k in range(30):
        g.sim(0.5)
        print(k, g.js("(() => { const ch = __ch, X = ch.ctrip; if (!X) return 'ended'; const p = X.path[X.k] || {}; return [X.ph, X.k, Math.round(Math.hypot((p.x||0) - ch.pos.x, (p.z||0) - ch.pos.z)), [Math.round(ch.pos.x), Math.round(ch.pos.z)], ch.state, ch.brain, (ch.blocked||0).toFixed(1), X.stuck.toFixed(1)]; })()"))
run(t)
