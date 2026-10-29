"""Ten minutes in the Old World: the kingdoms quarrel and raid each other, merchants walk the roads, bandits wait, knights patrol."""
import sys, json, time; sys.path.insert(0, __file__.rsplit('/', 1)[0])
from harness import run
MIN = float(sys.argv[1]) if len(sys.argv) > 1 else 10
def t(g):
    g.hunter(); g.sim(1)
    g.js("P.a.pos.set(4200, 0, -350); P.a.ground(1, true); P.a.maxHp = 1e6; P.a.hp = 1e6;")
    for k in range(40): g.sim(0.2)
    t0 = time.time(); steps = int(MIN * 60 / 20)
    for k in range(steps):
        g.js("P.a.hp = P.a.maxHp; P.food = 100; P.water = 100;")
        g.sim(20)
        if k % 6 == 0:
            r = g.js("""(() => { const ow = HUNT.camps.filter(c => isOldCamp(c)); let nan = 0; for (const a of ANIMALS) if (!isFinite(a.pos.x) || !isFinite(a.pos.z) || !isFinite(a.pos.y)) nan++;
              const wars = []; for (const k in WAR.rel) if (WAR.rel[k].st === 'war') wars.push(k.split('|').map(i => campName(isNaN(+i) ? i : +i)).join(' x '));
              return { day: G.day, t: G.time.toFixed(1), nan, wars: wars.slice(0, 4), parties: WAR.parties.filter(p => !p.done).length, trav: ROADS.trav.length, patrol: HUNT.camps.reduce((s, c) => s + c.hunters.filter(h => h.patrolT).length, 0),
                bandits: HUNT.camps.filter(c => c.bandit).map(c => c.hunters.filter(h => h.alive).length).join(','), owPeople: ow.reduce((s, c) => s + c.hunters.filter(h => h.alive).length, 0), animals: ANIMALS.length, log: WAR.log.slice(0, 2).map(l => l.t) }; })()""")
            print(k * 20, 's', json.dumps(r, ensure_ascii=False))
    print('wall s', round(time.time() - t0), 'errs', g.errors()[:8])
run(t)
