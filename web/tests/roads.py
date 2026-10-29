import sys, json; sys.path.insert(0, __file__.rsplit('/', 1)[0])
from harness import run, OUT
SHOTS = '--shots' in sys.argv
def t(g):
    print('boot', round(g.boot_s, 1))
    g.hunter(); g.sim(1)
    st = g.js("""({ roads: ROADS.list.map(R => [R.a, R.b, Math.round(R.len), !!R.ford]), ms: Math.round(ROADS.ms), ow: Math.round(OWR.ms),
      bandits: ROADS.bandits.map(b => [Math.round(b.x), Math.round(b.z), b.land, b.camp ? HUNT.camps.indexOf(b.camp) : -1]),
      missing: ROAD_LINKS.filter(([a, b]) => !ROADS.list.some(R => R.a === a && R.b === b)), mesh: ROADS.mesh ? ROADS.mesh.geometry.attributes.position.count : 0 })""")
    print(json.dumps(st, ensure_ascii=False))
    # to the Old World: everyone wakes up
    g.js("P.a.pos.set(4500, 0, 0); P.a.ground(1, true);")
    for k in range(40): g.sim(0.2)
    w = g.js("({ dormant: HUNT.camps.filter(c => c.dormant).length, bandits: HUNT.camps.filter(c => c.bandit).map(c => [c.tribe, c.hunters.filter(h => h.alive).length, c.hunters.map(h => h.cls).join(',')]) })")
    print(json.dumps(w, ensure_ascii=False))
    if SHOTS:
        for k, R in enumerate(st['roads'][:18]):
            g.js(f"""(() => {{ const R = ROADS.list[{k}], p = R.P[Math.floor(R.P.length * 0.5)], q = R.P[Math.floor(R.P.length * 0.5) + 6] || p;
              P.a.pos.set(p.x, 0, p.z); P.a.ground(1, true); G.time = 10; }})()""")
            g.sim(0.5)
            g.js(f"""(() => {{ const R = ROADS.list[{k}], p = R.P[Math.floor(R.P.length * 0.5)], q = R.P[Math.floor(R.P.length * 0.5) + 6] || p, ang = Math.atan2(q.x - p.x, q.z - p.z);
              camera.position.set(p.x - Math.sin(ang) * 40, getH(p.x, p.z) + 22, p.z - Math.cos(ang) * 40); camera.lookAt(p.x + Math.sin(ang) * 20, getH(p.x, p.z), p.z + Math.cos(ang) * 20); updateVeg(true); renderFrame(); }})()""")
            g.page.evaluate("document.getElementById('hud').style.visibility = 'hidden'")
            g.page.screenshot(path=f"{OUT}/road_{k}_{R[0]}_{R[1]}.png")
            g.page.evaluate("document.getElementById('hud').style.visibility = ''")
        for k in range(min(3, len(st['bandits']))):
            g.js(f"""(() => {{ const b = ROADS.bandits[{k}]; P.a.pos.set(b.ambush.x, 0, b.ambush.z); P.a.ground(1, true); G.time = 10; }})()""")
            g.sim(0.5)
            g.js(f"""(() => {{ const b = ROADS.bandits[{k}], c = b.camp; camera.position.set(c.x + 30, c.y + 26, c.z + 30); camera.lookAt(c.x, c.y, c.z); updateVeg(true); renderFrame(); }})()""")
            g.page.evaluate("document.getElementById('hud').style.visibility = 'hidden'")
            g.page.screenshot(path=f"{OUT}/bandit_{k}.png")
            g.page.evaluate("document.getElementById('hud').style.visibility = ''")
    # an ambush: with gold, pay them
    if st['bandits']:
        r = g.js("""(() => { const b = ROADS.bandits[0], c = b.camp; c.ambushCD = 0; goldAdd(60); const g0 = goldHave();
          const p = b.ambush; P.a.pos.set(p.x + 60, 0, p.z); P.a.ground(1, true);
          return { g0, men: c.hunters.filter(h => h.alive).length, d: Math.round(Math.hypot(c.x - p.x, c.z - p.z)) }; })()""")
        print('before ambush', r)
        g.sim(2)
        g.js("(() => { const p = ROADS.bandits[0].ambush; P.a.pos.set(p.x, 0, p.z); P.a.ground(1, true); })()")
        for k in range(8):
            g.sim(0.5)
            if g.js("!!document.getElementById('warov') && !document.getElementById('warov').hidden"): break
        card = g.js("(() => { const e = document.getElementById('warov'); return e && !e.hidden ? e.innerText.slice(0, 200) : null; })()")
        print('card:', card)
        g.page.screenshot(path=f"{OUT}/ambush_card.png")
        if card:
            g.js("document.querySelector('#warov [data-a=pay]').click()")
            g.sim(6)
            r = g.js("""(() => { const c = ROADS.bandits[0].camp; return { gold: goldHave(), hp: Math.round(P.a.hp), states: c.hunters.filter(h => h.alive).map(h => h.state + (h.foe === P.a ? '*' : '')).join(','), paid: c.paidT > G.t }; })()""")
            print('after pay', r)
        # a second gang: no gold, so they fight
        if len(st['bandits']) > 1:
            g.js("(() => { const st = boxStore(); st.gold = 0; const b = ROADS.bandits[1]; b.camp.ambushCD = 0; P.a.pos.set(b.ambush.x, 0, b.ambush.z); P.a.ground(1, true); P.a.hp = P.a.maxHp; })()")
            for k in range(12): g.sim(1)
            r = g.js("""(() => { const c = ROADS.bandits[1].camp; return { hp: Math.round(P.a.hp), max: Math.round(P.a.maxHp), dead: !P.a.alive,
              men: c.hunters.filter(h => h.alive).map(h => [h.state, Math.round(Math.hypot(h.pos.x - P.a.pos.x, h.pos.z - P.a.pos.z)), h.foe === P.a]) }; })()""")
            print('fight', json.dumps(r, ensure_ascii=False))
            # the player wins: kill them, then walk into their camp for the loot
            r = g.js("""(() => { const c = ROADS.bandits[1].camp, g0 = goldHave(); P.a.hp = P.a.maxHp;
              for (const h of c.hunters.slice()) if (h.alive) { h.hp = 1; hurt(h, 50, P.a); }
              return { g0, gold: goldHave(), left: c.hunters.filter(h => h.alive).length }; })()""")
            print('killed', r)
            g.sim(1.5)
            g.js("(() => { const c = ROADS.bandits[1].camp; P.a.pos.set(c.x + 2, 0, c.z + 2); P.a.ground(1, true); })()")
            g.sim(1.5)
            r = g.js("(() => { const c = ROADS.bandits[1].camp; return { looted: !!c.looted, gold: goldHave(), clear: c.clearDay, flag: PROG.flags['bg' + c.bk] }; })()")
            print('loot', r)
        # travellers and patrols run for a while
        g.js("ROADS.travT = 0; ROADS.patT = 0; P.a.pos.set(4500, 0, 0); P.a.ground(1, true);")
        for k in range(6): g.sim(5)
        r = g.js("({ trav: ROADS.trav.map(h => [h.name, h.camp.tribe, h.trav && h.trav.ph, h.trav && h.trav.k]), patrols: HUNT.camps.flatMap(c => c.hunters.filter(h => h.patrolT).map(h => [h.name, c.tribe, h.state])) })")
        print('roads life', json.dumps(r, ensure_ascii=False))
    print('errs', g.errors()[:8])
run(t)
