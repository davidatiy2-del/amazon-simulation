import sys, json, time; sys.path.insert(0, __file__.rsplit('/', 1)[0])
from harness import run, OUT
def t(g):
    print(g.js("HUNT.camps.filter(c => inMain(c.x, c.z)).map(c => [c.tribe, Math.round(c.x), Math.round(c.z), c.set ? c.set.id : '', landAt(c.x, c.z)])"))
    print(g.js("POI.filter(p => inMain(p.x, p.z) && (Math.abs(p.x) > 950 || Math.abs(p.z) > 950)).map(p => [p.n, Math.round(p.x), Math.round(p.z)])"))
    print(g.js("[KILI, OUTW.oasis, OUTW.passes.map(p => [Math.round(p.x), Math.round(p.z)]), NEWW.lakes && NEWW.lakes.map(l => [Math.round(l.x), Math.round(l.z), Math.round(l.r || 0)])]"))
    print(g.js("Object.keys(localStorage)"))
run(t)
