"""The app folder (dist/www) runs on its own: local three.js, local fonts, the parts loaded by start.js."""
import sys, os, json, time, subprocess, socket; sys.path.insert(0, __file__.rsplit('/', 1)[0])
from playwright.sync_api import sync_playwright
from harness import ARGS, HELPERS, ROOT, OUT
port = 8765
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(port), '--directory', os.path.join(ROOT, 'dist', 'www')], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
try:
    with sync_playwright() as pw:
        br = pw.chromium.launch(args=ARGS)
        ctx = br.new_context(viewport={'width': 1280, 'height': 720})
        p = ctx.new_page(); p.set_default_timeout(150000); errs = []; reqs = []
        p.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)))
        p.on('console', lambda m: errs.append('CONSOLE ' + m.text) if m.type == 'error' else None)
        p.on('request', lambda r: reqs.append(r.url) if not r.url.startswith(f'http://localhost:{port}') else None)
        t0 = time.time()
        p.goto(f'http://localhost:{port}/index.html')
        p.wait_for_function("() => typeof G !== 'undefined' && G.mode === 'menu'", timeout=150000)
        print('boot s', round(time.time() - t0, 1))
        p.evaluate(HELPERS)
        print('fonts', p.evaluate("[document.fonts.check('16px Rubik'), document.fonts.check('16px Karantina')]"), 'appBack', p.evaluate("typeof window.appBack"))
        p.evaluate("__hunter('m')"); p.evaluate("window.__freeze = true"); p.evaluate("__sim(5)")
        print('play', p.evaluate("({ mode: G.mode, n: ANIMALS.length, roads: ROADS.list.length })"))
        # back: the map opens and back closes it; back again pauses, and once more resumes
        p.evaluate("UI.toggle('map')")
        r1 = p.evaluate("[window.appBack(), $('mapov').hidden]")
        r2 = p.evaluate("[window.appBack(), G.paused]")
        r3 = p.evaluate("[window.appBack(), G.paused]")
        print('back map', r1, 'pause', r2, 'resume', r3)
        p.evaluate("window.appPause()"); print('appPause paused', p.evaluate("G.paused"), 'saved', p.evaluate("saveIndex().length"))
        p.screenshot(path=os.path.join(OUT, 'www.png'))
        print('outside requests', reqs[:5])
        print('errs', errs[:5])
        br.close()
finally:
    srv.terminate()
