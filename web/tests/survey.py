"""Close-up pictures of the Old World: its people, its towns and its animals, in contact sheets."""
import sys, json, time, os; sys.path.insert(0, __file__.rsplit('/', 1)[0])
from harness import run, OUT
from PIL import Image
SV = os.environ.get('SV', '/tmp/claude-0/-home-claude/5561d8a0-86cf-5385-954f-fc805c61f8a0/scratchpad/survey')
os.makedirs(SV, exist_ok=True)
WHICH = sys.argv[1] if len(sys.argv) > 1 else 'people'
SIGN = float(os.environ.get('SIGN', '1'))
SETS = sys.argv[2].split(',') if len(sys.argv) > 2 else ['lion', 'fjord', 'khan', 'forbidden', 'shogun', 'domes', 'nile', 'timbuktu', 'palace']
shots = []
def snap(g, name):
    p = os.path.join(SV, name + '.png'); g.page.screenshot(path=p); shots.append(p); return p
def cam(g, x, y, z, tx, ty, tz):
    g.js(f"camera.position.set({x}, {y}, {z}); camera.lookAt({tx}, {ty}, {tz}); camera.updateMatrixWorld(); renderFrame();")
def sheet(name, files, cols=2):
    if not files: return
    ims = [Image.open(f).convert('RGB') for f in files]
    w, h = ims[0].size; tw, th = w // 2, h // 2
    rows = (len(ims) + cols - 1) // cols
    S = Image.new('RGB', (tw * cols, th * rows), (20, 20, 20))
    for k, im in enumerate(ims): S.paste(im.resize((tw, th)), ((k % cols) * tw, (k // cols) * th))
    S.save(os.path.join(SV, name + '.jpg'), quality=82)
def go(g, x, z):
    g.js(f"P.a.pos.set({x}, 0, {z}); P.a.ground(1, true);")
    for k in range(30): g.sim(0.2)
def t(g):
    g.hunter(); g.sim(1)
    g.js("G.time = 10.5; $('hud').hidden = true; const st = document.createElement('style'); st.textContent = '#lockhint,.vxbub,#feed,#big,.onlbl{display:none!important}'; document.head.appendChild(st);")
    g.js("P.a.pos.set(3700, 0, -420); P.a.ground(1, true);")
    for k in range(60): g.sim(0.2)
    g.js("while (OWS.dormant) owWakeStep();")
    if WHICH == 'people':
        for sid in SETS:
            info = g.js(f"(() => {{ const c = HUNT.camps.find(c => c.set && c.set.id === '{sid}'); if (!c) return null; window.__c = c; return [c.x, c.z, c.tribe, c.kind]; }})()")
            if not info: print('no', sid); continue
            go(g, info[0] + 30, info[1] + 30)
            files = []
            for cls in ['chief', 'warrior', 'gatherer', 'builder']:
                h = g.js(f"(() => {{ const h = __c.hunters.find(h => h.alive && !h.young && h.cls === '{cls}' && !h.mount); if (!h) return null; return [h.pos.x, h.pos.y, h.pos.z, h.yaw, h.name]; }})()")
                if not h: continue
                x, y, z, yaw = h[0], h[1], h[2], h[3]
                import math
                d = 2.6 * SIGN; cx, cz = x + math.sin(yaw) * d, z + math.cos(yaw) * d
                g.js("P.a.mesh.visible = false;")
                cam(g, cx, y + 1.45, cz, x, y + 1.05, z)
                files.append(snap(g, f'p_{sid}_{cls}'))
            # the town from above
            cam(g, info[0] + 70, 55, info[1] + 70, info[0], 0, info[1])
            files.append(snap(g, f't_{sid}_top'))
            cam(g, info[0] + 34, 9, info[1] + 26, info[0], 3, info[1])
            files.append(snap(g, f't_{sid}_low'))
            sheet(f'sheet_{sid}', files, 3)
            print(sid, info[2], info[3], len(files))
    elif WHICH == 'animals':
        ids = g.js("Object.keys(SPECIES).filter(k => SPECIES[k].land >= 5 || SPECIES[k].ow)")
        print('species', ids)
        go(g, 3900, -200)
        files = []
        for sid in ids:
            r = g.js(f"""(() => {{ const x = P.a.pos.x + 12, z = P.a.pos.z; let b = null; try {{ buildLandTpls(); b = new Animal('{sid}', x, z, {{}}); b.ground(1, true); b.state = 'idle'; b.brain = 'mount'; }} catch (e) {{ return String(e); }} window.__b = b; return [b.pos.x, b.pos.y, b.pos.z, b.tpl.L || 1, b.scale]; }})()""")
            if not isinstance(r, list): print(sid, r); continue
            g.sim(0.3)
            x, y, z, L, sc = r
            d = max(2.5, L * sc * 2.2)
            cam(g, x + d * 0.8, y + d * 0.45, z + d * 0.6, x, y + L * sc * 0.25, z)
            files.append(snap(g, f'a_{sid}'))
            g.js("__b.remove()")
        for k in range(0, len(files), 6): sheet(f'animals_{k // 6}', files[k:k + 6], 3)
    print('errs', g.errors()[:5])
run(t)
