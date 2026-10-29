"""Pack a save taken from the lab (res.json of a command that returned {id, js}) for the player:
  - an account document for data/users/<id>/g-<slot> (the web version downloads it into "המשחקים שלי")
  - a transfer code for the Android app (pasted in "המשחקים שלי" > "לטעון משחק מקוד")
Usage: python3 tests/city_pack.py <res.json> <out dir>"""
import sys, os, json, gzip, base64, time
res = json.load(open(sys.argv[1], encoding='utf-8'))
out = sys.argv[2]; os.makedirs(out, exist_ok=True)
v = res['value']; sid = v['id']; js = v['js']
d = json.loads(js)
assert d['v'] == 1 and d['sp'] == 'hunter' and d['ownCamp'], 'not a village save'
pack = 'z:' + base64.b64encode(gzip.compress(js.encode('utf-8'), 9)).decode('ascii')
assert len(pack) < 200000, 'too big for one document'
head = {'v': 1, 'at': d['at'], 'sp': d['sp'], 'sex': d['sex'], 'day': d['day'], 'lvl': d.get('lvl', 1), 'vn': d.get('vn', ''), 'pop': d.get('pop', 0),
        'n': 1, 'w': 'gift' + str(int(time.time())), 'd': pack}
open(os.path.join(out, 'city_save.json'), 'w', encoding='utf-8').write(js)
json.dump(head, open(os.path.join(out, 'city_head.json'), 'w', encoding='utf-8'), ensure_ascii=False)
open(os.path.join(out, 'warriors-tribe-code.txt'), 'w', encoding='ascii').write(f'AMZ1.{sid}.{pack}\n')
print('slot', sid, 'json', len(js), 'packed', len(pack), 'vn', d.get('vn'), 'pop', d.get('pop'), 'day', d['day'], 'buildings', len(d['vx']['b']), 'tribe', len(d['tribe']))
