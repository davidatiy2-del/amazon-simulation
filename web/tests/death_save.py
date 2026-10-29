"""When the chief dies, the death screen puts the saved game first ("continue from the last save") and says the village
is kept; it brings the village back. "A new journey" starts from nothing and the village stays in the list of games."""
import sys, time; sys.path.insert(0, __file__.rsplit('/', 1)[0])
from harness import run
STATE = "(() => { const v = ownCamp(); return { mode: G.mode, own: !!v, b: BLD.list.length, people: clanAdults().length, slot: PROG.slot }; })()"
def t(g):
    g.hunter(); g.sim(1)
    g.js("""(() => {
      const spot = (() => { for (let r = 0; r < 400; r += 10) for (let a = 0; a < 12; a++) { const x = 260 + Math.cos(a) * r, z = 40 + Math.sin(a) * r; if (waterDepth(x, z) === 0 && getNY(x, z) > 0.9 && HUNT.camps.every(c => Math.hypot(c.x - x, c.z - z) > 110)) return { x, z }; } })();
      P.a.pos.set(spot.x, 0, spot.z); P.a.ground(1, true);
      const v = foundCampAt(spot.x, spot.z);
      for (const k of ['builder', 'warrior', 'hunter', 'gatherer']) spawnNewcomer(v, k);
      boxStore(); CAMPH.store.wood = 100;
      for (let r = 12, ok = false; r < 40 && !ok; r += 2) for (let a = 0; a < 24 && !ok; a++) { const x = v.x + Math.cos(a / 24 * TAU) * r, z = v.z + Math.sin(a / 24 * TAU) * r; if (buildCheck('hut', x, z, 0, 1)) continue; payWood(12); const b = addBuilding('hut', x, z, 0, 0, false, true); buildDone(b, true); ok = true; }
    })()""")
    g.sim(22)
    g.js("saveGame()"); before = g.js(STATE); print('before', before)   # (what the last save holds)
    g.js("playerDie('נפלת בקרב על הכפר')")
    time.sleep(2.4); g.sim(0.2)
    print('death', g.js("[!$('death').hidden, [...$('death').querySelectorAll('.btns button')].filter(b => !b.hidden).map(b => (b.classList.contains('pri') ? '*' : '') + b.textContent), $('deathSave').hidden ? null : $('deathSave').textContent]"))
    g.shot('death_save', clean=False)
    g.js("$('loadBtn').click()"); g.js("window.askPreg = () => {}"); time.sleep(0.4); g.js("__clean()"); g.sim(3)
    after = g.js(STATE); print('after load', after, 'OK' if after['own'] and after['b'] == before['b'] and after['slot'] == before['slot'] else 'MISMATCH')
    # a new journey after death: the village stays in the list
    g.js("playerDie('test')"); time.sleep(2.4); g.sim(0.2)
    g.js("$('againBtn').click()"); g.js("window.askPreg = () => {}"); time.sleep(0.4); g.js("__clean()"); g.sim(1)
    print('new journey', g.js(STATE), 'saves', g.js("saveIndex().map(e => [e.id === '%s', e.vn])" % before['slot']))
    print('errs', g.errors()[:5])
run(t)
