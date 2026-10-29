import sys, json; sys.path.insert(0, __file__.rsplit('/', 1)[0])
from harness import run
from town import SETUP
def t(g):
    g.hunter(); g.sim(1); g.js(SETUP)
    i = g.js("npcIdx()[0]")
    # the raid screen, the people screen and one person's card
    print(g.js(f"(() => {{ VX.known.add({i}); warRoom && warRoom(); return !!document.querySelector('#warov, #campov'); }})()") if g.js("typeof warRoom") == 'function' else 'no warRoom')
    g.js("closeCard && (closeCard('warov'), closeCard('campov'))")
    print(g.js("typeof raidCard"), g.js("typeof ourRaidCard"))
    g.js("campMenu('people')"); g.shot('people', clean=False)
    g.js("personCard(clanAdults()[0])"); g.shot('person', clean=False)
    print('loot chips', g.js("lootChipsHtml().length"))
    g.js("tradeList()"); g.shot('trade', clean=False)
run(t)
