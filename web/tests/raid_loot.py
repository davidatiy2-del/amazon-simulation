import sys, json; sys.path.insert(0, __file__.rsplit('/', 1)[0])
from harness import run
from town import SETUP
def t(g):
    g.hunter(); g.sim(1)
    print(g.js(SETUP))
    # the nearest other camp
    i = g.js("(() => { const v = ownCamp(); let b = -1, bd = 1e9; for (const i of npcIdx()) { const c = HUNT.camps[i], d = Math.hypot(c.x - v.x, c.z - v.z); if (d < bd && campLand(c) === 0) { bd = d; b = i; } } return b; })()")
    print('target', i, g.js(f"HUNT.camps[{i}].tribe"))
    g.js("PLUNDER.want = { food: true, goods: true, beasts: true }")
    print(g.js(f"(() => {{ const men = clanAdults().filter(m => m.cls === 'warrior'); const p = ourRaidStart({i}, men, false); window.__p = p; return {{ men: men.length, plan: lootPlanWord(p) }}; }})()"))
    # stay with the warriors so the raid is fought in view
    for k in range(40):
        g.js("(() => { const p = __p, m = p.men.find(m => m.alive) ; if (m) { P.a.pos.set(m.pos.x + 6, 0, m.pos.z + 6); P.a.ground(1, true); } })()")
        g.sim(5)
        ph = g.js("__p.phase")
        if k % 4 == 0: print(k, ph, json.dumps(g.js("__p.got"), ensure_ascii=False), g.js("__p.men.length"))
        if ph == 'home' and k > 2: break
    g.shot('raid_loot')
    for k in range(30):
        g.sim(5)
        if g.js("__p.done || !__p.men.length"): break
    print('store', json.dumps(g.js("Object.assign({}, boxStore(), { gold: goldHave() })"), ensure_ascii=False))
    print('words', g.js("lootWords(__p)"))
    print('cows', g.js("ownCows().length"), 'horses', g.js("tribeHorses().length"))
run(t)
