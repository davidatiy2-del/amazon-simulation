"""Playwright harness for the game. Usage:
    from harness import run
    def t(g): g.hunter(); g.sim(5); g.shot('x')
    run(t)
Env: GAME (html path), OUT (screenshot dir)."""
import os, sys, json, time, math
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GAME = os.environ.get('GAME', os.path.join(ROOT, 'amazonia.html'))
OUT = os.environ.get('OUT', '/tmp/claude-0/-home-claude/5561d8a0-86cf-5385-954f-fc805c61f8a0/scratchpad/shots')
ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--js-flags=--expose-gc', '--enable-precise-memory-info']

HELPERS = r"""
window.__hunter = (sex) => { SET.sp = 'hunter'; SET.sex = sex || 'm'; saveSet(); startGame(false); window.askPreg = () => {}; return !!P.a; };
window.__clean = () => {
  for (const id of ['pregov', 'perks', 'talkov', 'campov', 'infohub', 'mapov', 'help', 'guide', 'saves']) { const e = document.getElementById(id); if (e && !e.hidden) { if (id === 'pregov') { const b = [...e.querySelectorAll('button')].find(b => /לא/.test(b.textContent)); if (b) b.click(); } e.hidden = true; } }
  G.paused = false; return true;
};
window.__sim = (sec, dt) => { dt = dt || 0.05; const n = Math.round(sec / dt); for (let i = 0; i < n; i++) { try { step(dt); } catch (e) { reportErr(e); } INPUT.press.clear(); } renderFrame(); return n; };
window.__errs = () => [...ERRS];
"""

class Game:
    def __init__(self, page):
        self.page = page; self.errs = []
    def js(self, code, arg=None):
        if arg is None: return self.page.evaluate(code)
        return self.page.evaluate(code, arg)
    def hunter(self, sex='m'):
        r = self.js(f"__hunter('{sex}')"); self.js('window.__freeze = true'); return r
    def sim(self, sec, dt=0.05):
        # in chunks so a long run does not hit the evaluate timeout
        left = sec
        while left > 0:
            c = min(left, 20); self.js(f'__sim({c}, {dt})'); left -= c
    def shot(self, name, clean=True):
        if clean: self.js('__clean()')
        self.js('renderFrame()')
        os.makedirs(OUT, exist_ok=True)
        p = os.path.join(OUT, name + '.png'); self.page.screenshot(path=p); return p
    def errors(self):
        return self.errs + self.js('__errs()')

def run(test, touch=False, w=1280, h=800, mobile=False, keep=False, wait_menu=90, init=None):
    with sync_playwright() as pw:
        br = pw.chromium.launch(args=ARGS)
        ctx = br.new_context(viewport={'width': w, 'height': h}, has_touch=touch, is_mobile=mobile, device_scale_factor=1)
        if init: ctx.add_init_script(init)
        page = ctx.new_page(); page.set_default_timeout(150000)
        g = Game(page)
        page.on('pageerror', lambda e: g.errs.append('PAGEERR ' + str(e)))
        page.on('console', lambda m: g.errs.append('CONSOLE ' + m.text) if m.type == 'error' else None)
        t0 = time.time()
        page.goto('file://' + GAME)
        page.wait_for_function("() => typeof G !== 'undefined' && G.mode === 'menu'", timeout=wait_menu * 1000)
        g.boot_s = time.time() - t0
        page.evaluate(HELPERS)
        try:
            test(g)
        finally:
            e = g.errors()
            if e: print('ERRORS:', json.dumps(e[:20], ensure_ascii=False))
            br.close()
        return g
