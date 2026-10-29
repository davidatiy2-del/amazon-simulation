import sys, json, time; sys.path.insert(0, __file__.rsplit('/', 1)[0])
from harness import run, OUT
def follow(g, label, n=24, dt=8):
    for k in range(n):
        g.js("(() => { const c = window.__c, T = c.trip; if (T && T.ch.alive) { P.a.pos.set(T.ch.pos.x + 14, 0, T.ch.pos.z + 14); P.a.ground(1, true); } })()")
        g.sim(dt)
        r = g.js("""(() => { const c = window.__c, T = c.trip, ch = window.__ch, X = ch.ctrip;
          return { t: T ? Math.round(G.t - T.t0) : null, ph: X ? X.ph : 'ended', k: X ? X.k : null, n: X ? X.path.length : null, d: Math.round(Math.hypot(ch.pos.x - c.x, ch.pos.z - c.z)),
            g: T ? T.guards.map(h => Math.round(Math.hypot(h.pos.x - ch.pos.x, h.pos.z - ch.pos.z))) : [], st: ch.state, br: ch.brain }; })()""")
        print(label, k, json.dumps(r, ensure_ascii=False))
        if r['ph'] == 'ended': break
def t(g):
    g.hunter(); g.sim(1)
    g.js("G.time = 9.5; HUNT.camps.forEach((c, i) => { if (!c.own) VX.known.add(i); });")
    # A. a tribe of the New World
    g.js("window.__c = HUNT.camps.find(c => c.tribe === 'שבט הנהר'); window.__ch = chiefOfCamp(__c); P.a.pos.set(__c.x + 30, 0, __c.z + 30); P.a.ground(1, true);")
    g.sim(2)
    i = g.js("campIndex(__c)")
    p0 = g.js(f"npcPowerBase({i})")
    o = g.js("(() => { for (let k = 0; k < 20; k++) { const o = npcTripPick(__c); if (o) { window.__o = o; return [o.kind, o.to.tribe || '', o.path.length]; } } return null; })()")
    print('pick', o)
    g.js("npcTripStart(__c, __ch, __o)")
    print('now', g.js("chiefNow(__c)"), 'power', p0, '->', g.js(f"npcPowerBase({i})"))
    print('facts', g.js(f"polFacts({i}).replace(/<[^>]+>/g, ' ')"))
    follow(g, 'NW')
    print('after', g.js("[!!__c.trip, chiefNow(__c), window.__ch.brain]"))
    # B. a castle or a town of the Old World, along a road
    g.js("P.a.pos.set(3700, 0, -420); P.a.ground(1, true);")
    for k in range(40): g.sim(0.2)
    c = g.js("""(() => { const L = HUNT.camps.filter(c => c.civ && c.set && !c.bandit && !c.gone && chiefOfCamp(c) && ROADS.list.some(R => R.a === c.set.id || R.b === c.set.id));
      for (const c of L) { for (let k = 0; k < 10; k++) { const o = npcTripPick(c); if (o && o.kind === 'visit') { window.__c = c; window.__ch = chiefOfCamp(c); window.__o = o; return [c.tribe, o.to.tribe, o.path.length]; } } } return null; })()""")
    print('OW pick', c)
    if c:
        g.js("P.a.pos.set(__c.x + 20, 0, __c.z + 20); P.a.ground(1, true); npcTripStart(__c, __ch, __o);")
        print('OW now', g.js("chiefNow(__c)"))
        follow(g, 'OW', n=60, dt=8)
    # C. a chief who falls on the road: the one in charge takes the place
    g.js("""(() => { const c = HUNT.camps.find(c => !c.own && !c.civ && !c.bandit && !c.trip && chiefOfCamp(c) && npcChain(c).length); window.__c = c; window.__ch = chiefOfCamp(c);
      P.a.pos.set(c.x + 25, 0, c.z + 25); P.a.ground(1, true); for (let k = 0; k < 30; k++) { const o = npcTripPick(c); if (o) { npcTripStart(c, __ch, o); break; } } })()""")
    print('C trip', g.js("!!__c.trip && [__ch.name, __c.trip.dep && __c.trip.dep.name]"))
    g.sim(4)
    g.js("(() => { const ch = __ch; kill(ch, null); hunterKilled(ch, null); })()")
    g.sim(2)
    print('C after', g.js("[!!__c.trip, chiefOfCamp(__c) && chiefOfCamp(__c).name]"))
    print('errs', g.errors()[:6])
run(t)
