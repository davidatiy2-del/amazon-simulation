import sys, json; sys.path.insert(0, __file__.rsplit('/', 1)[0])
from harness import run
from town import SETUP
def t(g):
    g.hunter(); g.sim(1); g.js(SETUP)
    i = g.js("npcIdx()[0]")
    g.js(f"VX.known.add({i}); raidPlanner({i})"); g.shot('raid_planner', clean=False)
    g.js("document.querySelector('[data-lw=beasts]').click()"); g.shot('raid_planner2', clean=False)
    print(json.dumps(g.js("PLUNDER.want")))
run(t)
