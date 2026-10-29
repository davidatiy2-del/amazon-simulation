import sys, json, time; sys.path.insert(0, __file__.rsplit('/', 1)[0])
from harness import run, OUT
def t(g):
    g.hunter(); g.sim(1)
    g.js("G.time = 10;")
    spot = g.js("""(() => { for (let r = 60; r < 400; r += 15) for (let a = 0; a < 16; a++) { const x = 200 + Math.cos(a / 16 * TAU) * r, z = 300 + Math.sin(a / 16 * TAU) * r;
      if (waterDepth(x, z) === 0 && getNY(x, z) > 0.9 && HUNT.camps.every(q => Math.hypot(q.x - x, q.z - z) > 120)) return [x, z]; } return null; })()""")
    print('spot', spot)
    g.js(f"""(() => {{ P.a.pos.set({spot[0]}, 0, {spot[1]}); P.a.ground(1, true); const v = foundCampAt({spot[0]}, {spot[1]}, true); CAMPH.camp = v; v.own = true;
      for (const k of ['warrior', 'warrior', 'hunter', 'builder', 'gatherer']) spawnNewcomer(v, k); }})()""")
    g.sim(2)
    print('chain', g.js("depChain().map(q => [q.m.name, q.m.cls, q.r])"))
    b = g.js("clanAdults().find(m => m.cls === 'builder').name")
    g.js("depChoose(clanAdults().find(m => m.cls === 'builder'))")
    print('chosen', b, g.js("depChain()[0].m.name"), 'save dp', g.js("vxSave().dp === DEP.uid && DEP.uid > 0"))
    # walk away
    g.js(f"P.a.pos.set({spot[0]} + 420, 0, {spot[1]}); P.a.ground(1, true);")
    g.sim(7)
    print('away', g.js("[DEP.away, DEP.cur && DEP.cur.name]"))
    print('village line', g.js("(() => { const m = DEP.away ? depWho() : depPick(); return m ? m.name : null; })()"))
    # an abstract raid by a tribe at war
    i = g.js("HUNT.camps.findIndex(c => !c.own && !c.civ && !c.bandit && !isOld(c.x))")
    g.js(f"declareWar({i}, 'בדיקה');")
    pw = g.js("[ownPower(true).toFixed(2), depPower()]")
    print('power with deputy', pw)
    g.js(f"raidStart({i}, 'own')")
    print('deeds', g.js("DEP.deeds"))
    # envoys hold while away
    g.js(f"(() => {{ const j = HUNT.camps.findIndex((c, k) => k !== {i} && !c.own && !c.civ && !c.bandit && !isOld(c.x)); VX.known.add(j); depHold('ally', j); }})()")
    print('msgs', g.js("DEP.msgs.map(q => [q.k, campName(q.i)])"))
    g.sim(3)
    # the deputy's routine and a few hours pass
    g.js("G.time += 4;"); g.sim(10)
    print('deputy doing', g.js("(() => { const m = DEP.cur; return m ? [m.name, DEP.r && DEP.r.k, Math.round(Math.hypot(m.pos.x - ownCamp().x, m.pos.z - ownCamp().z))] : null; })()"))
    # come back
    g.js(f"P.a.pos.set({spot[0]} + 5, 0, {spot[1]} + 5); P.a.ground(1, true);")
    g.sim(3)
    print('back', g.js("[DEP.away, !$('depov') || $('depov').hidden]"))
    if g.js("!!$('depov') && !$('depov').hidden"):
        print('REPORT:', g.js("$('depov').innerText.replace(/\\n+/g, ' | ')"))
        g.shot('deputy_report', clean=False)
        g.js("$('depov').querySelector('[data-a=ok]').click()")
    print('envoy card', g.js("depEnvoys()"), g.js("!!$('warov') && !$('warov').hidden && $('warov').innerText.slice(0, 80)"))
    g.js("closeCard('warov')")
    # the people screen
    g.js("campMenu('people')"); g.shot('deputy_people', clean=False)
    print('people has order', g.js("$('campov').innerText.includes('מי אחראי על הכפר')"))
    g.js("closeCard('campov')")
    print('errs', g.errors()[:6])
run(t)
