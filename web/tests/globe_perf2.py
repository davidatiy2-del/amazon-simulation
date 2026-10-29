import sys, json, time; sys.path.insert(0, __file__.rsplit('/', 1)[0])
from harness import run, OUT
def t(g):
    g.hunter(); g.sim(1)
    g.js("for (let k = 0; k < 4000 && !owMapReady(); k++) owMapStep(50);")
    r = g.js("""(() => { const T = []; let t0 = performance.now(); const lap = n => { const t = performance.now(); T.push([n, Math.round(t - t0)]); t0 = t; };
      const img0 = UI.mapImg || (UI.mapImg = buildMapImg()); lap('mapImg');
      const tw = 2048, th = 683, cv = document.createElement('canvas'); cv.width = tw; cv.height = th;
      const c = cv.getContext('2d', { willReadFrequently: true }); lap('ctx');
      c.fillStyle = '#103460'; c.fillRect(0, 0, tw, th); lap('fill');
      c.drawImage(img0, 500, 0, 683, 683); lap('draw nw');
      c.drawImage(GMAP.img2, 1200, 0, 683, 683); lap('draw ow');
      const D = c.getImageData(0, 0, tw, th).data; lap('get');
      glbSeaBase(160, 54); lap('seabase');
      return T; })()""")
    print(r)
run(t)
