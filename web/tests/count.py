import sys; sys.path.insert(0, __file__.rsplit('/', 1)[0])
from harness import run
def t(g):
    g.hunter(); g.sim(2)
    print(g.js("""(() => { const C = HUNT.camps; let h = 0; for (const c of C) h += c.hunters.length;
      const kinds = {}; for (const a of ANIMALS) { const k = a.spId; kinds[k] = (kinds[k] || 0) + 1; }
      const top = Object.entries(kinds).sort((a, b) => b[1] - a[1]).slice(0, 25);
      return { camps: C.length, hunters: h, animals: ANIMALS.length, groups: GROUPS.length, top, heap: performance.memory.usedJSHeapSize / 1e6,
        tris: renderer.info.render.triangles, calls: renderer.info.render.calls, geos: renderer.info.memory.geometries, tex: renderer.info.memory.textures,
        campInfo: C.map(c => [c.tribe, Math.round(c.x), Math.round(c.z), c.lvl || 0, c.hunters.length, c.own ? 'own' : '', c.key || '']) }; })()"""))
run(t)
