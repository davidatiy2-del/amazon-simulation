import sys; sys.path.insert(0, __file__.rsplit('/', 1)[0])
from harness import run
def t(g):
    print('boot s', round(g.boot_s, 1))
    print('hunter', g.hunter())
    g.sim(10)
    print(g.js("({pos: [P.a.pos.x, P.a.pos.z], day: G.day, time: G.time, n: ANIMALS.length})"))
    g.shot('smoke')
run(t)
