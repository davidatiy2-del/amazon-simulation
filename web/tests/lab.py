"""Send one command to the lab page (tests/lab_server.py) and print what comes back.
    python3 tests/lab.py '{"fn": ["src/js/05-hunters.js:buildHuman"], "js": "1+1", "shot": "x"}'
    python3 tests/lab.py file.json"""
import os, sys, json, time
LAB = os.environ.get('LAB', '/tmp/claude-0/-home-claude/5561d8a0-86cf-5385-954f-fc805c61f8a0/scratchpad/lab')
a = sys.argv[1]
cmd = json.load(open(a)) if os.path.exists(a) else json.loads(a)
cmd['id'] = time.time()
rp = os.path.join(LAB, 'res.json')
if os.path.exists(rp): os.remove(rp)
json.dump(cmd, open(os.path.join(LAB, 'cmd.tmp'), 'w')); os.replace(os.path.join(LAB, 'cmd.tmp'), os.path.join(LAB, 'cmd.json'))
t0 = time.time(); lim = float(os.environ.get('LIM', 600))
while time.time() - t0 < lim:
    if os.path.exists(rp):
        try: r = json.load(open(rp))
        except Exception: time.sleep(0.2); continue
        if r.get('id') == cmd['id']:
            print(json.dumps(r, ensure_ascii=False)[:6000]); sys.exit(0)
    time.sleep(0.3)
print('timeout'); sys.exit(1)
