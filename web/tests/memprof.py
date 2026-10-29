import sys, json; sys.path.insert(0, __file__.rsplit('/', 1)[0])
from harness import run
def t(g):
    print(g.js("""(() => {
      const bt = (window.__bt || []).map(b => [b[0], Math.round(b[2] / 1e6)]);
      let tpls = 0, tb = 0; for (const k in TPL) { tpls++; const T = TPL[k]; const geo = T.geo || T.geometry; if (geo && geo.attributes) for (const a in geo.attributes) { const ar = geo.attributes[a].array; if (ar) tb += ar.byteLength; } if (geo && geo.index && geo.index.array) tb += geo.index.array.byteLength; }
      let im = 0, imb = 0; scene.traverse(o => { if (o.isInstancedMesh) { im++; imb += o.instanceMatrix.array.byteLength; } });
      let sk = 0; scene.traverse(o => { if (o.isSkinnedMesh) sk++; });
      let geob = 0, geon = 0; const seen = new Set(); scene.traverse(o => { const g = o.geometry; if (!g || seen.has(g)) return; seen.add(g); geon++; for (const a in g.attributes) { const ar = g.attributes[a].array; if (ar && ar.byteLength) geob += ar.byteLength; } if (g.index && g.index.array) geob += g.index.array.byteLength; });
      return { bt, tpls, tplMB: tb / 1e6, instMeshes: im, instMB: imb / 1e6, skinned: sk, geos: geon, geoMB: geob / 1e6, heap: performance.memory.usedJSHeapSize / 1e6, animals: ANIMALS.length };
    })()"""))
run(t)
