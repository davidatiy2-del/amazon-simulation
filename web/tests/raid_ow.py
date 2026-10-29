"""A village in the Old World raids a castle of the knights; a village in the New World cannot send a raid across the ocean."""
import sys, json; sys.path.insert(0, __file__.rsplit('/', 1)[0])
from harness import run
def t(g):
    g.hunter(); g.sim(1)
    # first, from the New World: no raid over the sea
    g.js("""(() => { const spot = { x: 260, z: 40 }; P.a.pos.set(spot.x, 0, spot.z); P.a.ground(1, true); const v = foundCampAt(spot.x, spot.z, true); CAMPH.camp = v; v.own = true; for (let k = 0; k < 6; k++) spawnNewcomer(v, 'warrior'); })()""")
    li = g.js("HUNT.camps.findIndex(c => c.set && c.set.id === 'vines')")
    g.js(f"(() => {{ owWakeStep && HUNT.camps.forEach(() => OWS.dormant && owWakeStep()); declareWar({li}, 'בדיקה'); }})()")
    print('war with vines', g.js(f"atWar({li})"), 'same land', g.js(f"sameLandOwn({li})"))
    g.js("raidTargetPick()")
    print('notify', g.js("(() => { const n = document.querySelectorAll('.note, .notif, #notes > *'); return [...n].slice(-2).map(e => e.textContent).join(' | '); })()"))
    g.js("closeCard('warov'); closeCard('campov');")
    # a caravan cannot cross either
    print('caravan', g.js(f"(() => {{ TRADE.basket = [{{ i: {li}, k: 'food', dir: 'sell' }}]; return caravanSend({li}); }})()"))
    print('errs so far', g.errors()[:4])
run(t)
def t2(g):
    g.hunter(); g.sim(1)
    g.js("P.a.pos.set(4500, 0, 0); P.a.ground(1, true);")
    for k in range(40): g.sim(0.2)
    vi = g.js("HUNT.camps.findIndex(c => c.set && c.set.id === 'vines')")
    spot = g.js(f"""(() => {{ const c = HUNT.camps[{vi}]; for (let r = 130; r < 400; r += 15) for (let a = 0; a < 16; a++) {{ const x = c.x + Math.cos(a / 16 * TAU) * r, z = c.z + Math.sin(a / 16 * TAU) * r;
      if (waterDepth(x, z) === 0 && getNY(x, z) > 0.9 && !roadFine(x, z) && HUNT.camps.every(q => Math.hypot(q.x - x, q.z - z) > 110)) return [x, z]; }} return null; }})()""")
    print('village spot', spot)
    g.js(f"(() => {{ P.a.pos.set({spot[0]}, 0, {spot[1]}); P.a.ground(1, true); const v = foundCampAt({spot[0]}, {spot[1]}, true); CAMPH.camp = v; v.own = true; for (let k = 0; k < 8; k++) spawnNewcomer(v, 'warrior'); declareWar({vi}, 'בדיקה'); }})()")
    print('same land', g.js(f"sameLandOwn({vi})"), 'power', g.js(f"npcPower({vi}).toFixed(1)"), 'lion power (walls)', g.js("npcPower(HUNT.camps.findIndex(c => c.set && c.set.id === 'lion')).toFixed(1)"))
    g.js("PLUNDER.want = { food: true, goods: true, beasts: true }")
    print(g.js(f"(() => {{ const men = clanAdults().filter(m => m.cls === 'warrior'); const p = ourRaidStart({vi}, men, false); window.__p = p; return {{ men: men.length, plan: lootPlanWord(p) }}; }})()"))
    for k in range(40):
        g.js("(() => { const p = __p, m = p.men.find(m => m.alive); if (m) { P.a.pos.set(m.pos.x + 6, 0, m.pos.z + 6); P.a.ground(1, true); } })()")
        g.sim(5)
        ph = g.js("__p.phase")
        if k % 4 == 0: print(k, ph, json.dumps(g.js("__p.got"), ensure_ascii=False), g.js("__p.men.length"))
        if ph == 'home' and k > 2: break
    g.shot('raid_ow')
    for k in range(30):
        g.sim(5)
        if g.js("__p.done || !__p.men.length"): break
    print('words', g.js("lootWords(__p)"))
    print('errs', g.errors()[:5])
run(t2)
