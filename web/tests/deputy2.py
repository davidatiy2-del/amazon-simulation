"""The chief chooses who is in charge (when leaving, from the list), and on coming back the one in charge hands the village back
and goes back to his own work. Also: an NPC chief's stand-in goes back to his place."""
import sys; sys.path.insert(0, __file__.rsplit('/', 1)[0])
from harness import run
def t(g):
    g.hunter(); g.sim(1)
    g.js("G.time = 10;")
    spot = g.js("""(() => { for (let r = 60; r < 400; r += 15) for (let a = 0; a < 16; a++) { const x = 200 + Math.cos(a / 16 * TAU) * r, z = 300 + Math.sin(a / 16 * TAU) * r;
      if (waterDepth(x, z) === 0 && getNY(x, z) > 0.9 && HUNT.camps.every(q => Math.hypot(q.x - x, q.z - z) > 120)) return [x, z]; } return null; })()""")
    g.js(f"""(() => {{ P.a.pos.set({spot[0]}, 0, {spot[1]}); P.a.ground(1, true); const v = foundCampAt({spot[0]}, {spot[1]}, true); CAMPH.camp = v; v.own = true;
      for (const k of ['warrior', 'warrior', 'hunter', 'builder', 'gatherer']) spawnNewcomer(v, k); }})()""")
    g.sim(2)
    # the list on the people screen has a choose button for each
    g.js("campMenu('people')")
    print('choose buttons', g.js("$('campov').querySelectorAll('[data-a=depset]').length"))
    hb = g.js("(() => { const m = clanAdults().find(q => q.cls === 'hunter'); $('campov').querySelector(`[data-a=depset][data-m=\"${m.id}\"]`).click(); return m.name; })()")
    print('chose from list', hb, 'DEP.uid ok', g.js("DEP.uid === clanAdults().find(q => q.cls === 'hunter').uid"))
    print('auto button', g.js("!!$('campov').querySelector('[data-a=depauto]')"))
    g.js("$('campov').querySelector('[data-a=depauto]').click()")
    print('after auto', g.js("DEP.uid"))
    g.js("closeCard('campov')")
    # leaving: the question at the top of the screen
    g.js(f"P.a.pos.set({spot[0]} + 420, 0, {spot[1]}); P.a.ground(1, true);")
    g.sim(7)
    print('away', g.js("[DEP.away, DEP.cur && DEP.cur.name, DEP.cur && DEP.cur.cls]"))
    print('ask shown', g.js("!!DEPASK.el && !DEPASK.el.hidden"), g.js("DEPASK.el && DEPASK.el.innerText"))
    g.shot('dep2_ask', clean=False)
    g.js("DEPASK.el.querySelector('[data-a=pick]').click()")
    print('card', g.js("!$('depov').hidden"), g.js("$('depov').querySelectorAll('.deppk').length"))
    g.shot('dep2_card', clean=False)
    was = g.js("DEP.cur.name")
    pickb = g.js("(() => { const m = clanAdults().find(q => q.cls === 'builder'); $('depov').querySelector(`[data-u=\"${m.id}\"]`).click(); return m.name; })()")
    print('picked', pickb, 'now in charge', g.js("DEP.cur && DEP.cur.name"), 'was', was, 'uid set', g.js("DEP.uid > 0"))
    print('feed', g.js("[...document.querySelectorAll('#feed div')].map(e => e.textContent).slice(-2)"))
    g.js("$('depov').querySelector('[data-a=ok]').click()")
    g.js("G.time += 3;"); g.sim(10)
    # back home: the report, then the hand-back
    g.js(f"P.a.pos.set({spot[0]} + 6, 0, {spot[1]} + 6); P.a.ground(1, true);")
    g.sim(3)
    print('back', g.js("[DEP.away, !!$('depov') && !$('depov').hidden]"))
    if g.js("!!$('depov') && !$('depov').hidden"):
        print('REPORT:', g.js("$('depov').innerText.replace(/\\n+/g, ' | ')"))
        g.js("$('depov').querySelector('[data-a=ok]').click()")
    print('handBack', g.js("(() => { const m = clanAdults().find(q => q.handBack); return m ? [m.name, Math.round(Math.hypot(m.pos.x - P.a.pos.x, m.pos.z - P.a.pos.z))] : null; })()"))
    for k in range(6):
        g.sim(3)
        r = g.js("(() => { const m = clanAdults().find(q => q.name === '%s'); return [m.handBack ? (m.handBack.said ? 'said' : 'walking') : 'done', Math.round(Math.hypot(m.pos.x - P.a.pos.x, m.pos.z - P.a.pos.z))]; })()" % pickb)
        print(' ', r)
        if r[0] == 'said': g.shot('dep2_handback', clean=False)
        if r[0] == 'done': break
    print('feed', g.js("[...document.querySelectorAll('#feed div')].map(e => e.textContent).slice(-3)"))
    # the person card still toggles the deputy
    print('choose by card', g.js("(() => { const m = clanAdults().find(q => q.cls === 'gatherer'); depChoose(m); const a = DEP.uid === m.uid; depChoose(m); return [a, DEP.uid === 0]; })()"))
    # an NPC chief's trip: the stand-in goes back to his place
    r = g.js("""(() => { const c = HUNT.camps.find(c => !c.own && !c.civ && !c.bandit && !isOld(c.x) && chiefOfCamp(c)); if (!c) return 'no camp';
      VX.known.add(campIndex(c)); P.a.pos.set(c.x + 30, 0, c.z); P.a.ground(1, true);
      const ch = chiefOfCamp(c), o = npcTripPick(c); if (!o) return 'no trip'; npcTripStart(c, ch, o); const dep = c.trip.dep;
      npcTripEnd(c, true); return [ch.name, dep && dep.name, [...document.querySelectorAll('#feed div')].map(e => e.textContent).slice(-1)[0]]; })()""")
    print('npc trip end', r)
    print('errs', g.errors()[:6])
run(t)
