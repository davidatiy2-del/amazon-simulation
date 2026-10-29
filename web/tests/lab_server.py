"""A long-lived game page for quick looks: boots the game once, then runs commands from a file.

  python3 tests/lab_server.py &          (waits for LAB/cmd.json)
  python3 tests/lab.py '{"fn": ["src/js/05-hunters.js:buildHuman"], "js": "...", "shot": "x"}'

Each command may: swap in new versions of named functions from the source parts ("fn": "file:name" — the function's
text is read from the file and evaluated in the page, so the rest of the game uses it from then on), run some
JavaScript ("js", its value comes back), and take a screenshot ("shot": a name, saved in LAB/<name>.png).
"""
import os, sys, json, time, re, traceback
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import ARGS, GAME, HELPERS
from playwright.sync_api import sync_playwright

LAB = os.environ.get('LAB', '/tmp/claude-0/-home-claude/5561d8a0-86cf-5385-954f-fc805c61f8a0/scratchpad/lab')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.makedirs(LAB, exist_ok=True)


def extract(src, name):
    """The text of `function name(...) {...}` (or `name = function`/async) at the top level of a part."""
    m = re.search(r'^(async\s+)?function\s+' + re.escape(name) + r'\s*\(', src, re.M)
    if not m: raise KeyError(name)
    # the parameters may hold braces (defaults): find the body's opening brace after the closing parenthesis
    depth, j = 0, m.end() - 1
    while True:
        ch = src[j]
        if ch == '(': depth += 1
        elif ch == ')':
            depth -= 1
            if depth == 0: break
        j += 1
    i = src.index('{', j)
    k, depth, n = i, 0, len(src)
    while k < n:
        ch = src[k]
        if ch in '\'"`':
            q = ch; k += 1
            while k < n and src[k] != q:
                if src[k] == '\\': k += 1
                elif q == '`' and src[k] == '$' and k + 1 < n and src[k + 1] == '{':
                    # a template's ${...}: skip to its closing brace
                    d2 = 0
                    while k < n:
                        if src[k] == '{': d2 += 1
                        elif src[k] == '}':
                            d2 -= 1
                            if d2 == 0: break
                        k += 1
                k += 1
        elif ch == '/' and src[k + 1] == '/':
            k = src.index('\n', k)
        elif ch == '/' and src[k + 1] == '*':
            k = src.index('*/', k) + 1
        elif ch == '{': depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0: return src[m.start():k + 1]
        k += 1
    raise ValueError('unbalanced ' + name)


def main():
    with sync_playwright() as pw:
        br = pw.chromium.launch(args=ARGS)
        ctx = br.new_context(viewport={'width': int(os.environ.get('W', 1280)), 'height': int(os.environ.get('H', 800))}, device_scale_factor=1)
        page = ctx.new_page(); page.set_default_timeout(1800000)
        errs = []
        page.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)))
        page.on('console', lambda m: errs.append('CONSOLE ' + m.text) if m.type == 'error' else None)
        page.goto('file://' + GAME)
        page.wait_for_function("() => typeof G !== 'undefined' && G.mode === 'menu'", timeout=200000)
        page.evaluate(HELPERS)
        open(os.path.join(LAB, 'ready'), 'w').write(str(time.time()))
        print('ready', flush=True)
        cmdp = os.path.join(LAB, 'cmd.json')
        while True:
            if not os.path.exists(cmdp): time.sleep(0.25); continue
            try: cmd = json.load(open(cmdp))
            except Exception: time.sleep(0.2); continue
            os.remove(cmdp)
            if cmd.get('quit'): break
            res = {'id': cmd.get('id')}
            del errs[:]
            try:
                for spec in cmd.get('fn', []):
                    f, name = spec.rsplit(':', 1)
                    src = open(os.path.join(ROOT, f), encoding='utf-8').read()
                    code = extract(src, name)
                    page.evaluate('(s) => { (0, eval)(s); }', code)
                if cmd.get('js'): res['value'] = page.evaluate(cmd['js'])
                if cmd.get('shot'):
                    p = os.path.join(LAB, cmd['shot'] + '.png'); page.screenshot(path=p); res['shot'] = p
            except Exception as e:
                res['error'] = str(e)[:2000]
            res['errs'] = errs[:12]
            json.dump(res, open(os.path.join(LAB, 'res.tmp'), 'w'), ensure_ascii=False)
            os.replace(os.path.join(LAB, 'res.tmp'), os.path.join(LAB, 'res.json'))
        br.close()


if __name__ == '__main__':
    main()
