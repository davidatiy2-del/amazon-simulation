"""Things the offline app carries with it: three.js r159 and the two fonts (Hebrew and Latin)."""
import os, re, io, tarfile, urllib.request, json
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'
def get(url, ua=False):
    req = urllib.request.Request(url, headers={'User-Agent': UA} if ua else {})
    return urllib.request.urlopen(req, timeout=60).read()
# three.js r159 from the npm registry (the same build the web version loads from the CDN)
meta = json.loads(get('https://registry.npmjs.org/three/0.159.0'))
tgz = get(meta['dist']['tarball'])
with tarfile.open(fileobj=io.BytesIO(tgz), mode='r:gz') as t:
    data = t.extractfile('package/build/three.min.js').read()
open(os.path.join(ROOT, 'assets', 'vendor', 'three.min.js'), 'wb').write(data)
print('three.min.js', len(data))
# the fonts: only the Hebrew and Latin subsets
css = get('https://fonts.googleapis.com/css2?family=Karantina:wght@400;700&family=Rubik:wght@400;500;700&display=swap', ua=True).decode()
out, n = [], 0
for block in re.findall(r'/\* ([\w-]+) \*/\s*(@font-face \{.*?\})', css, re.S):
    subset, face = block
    if subset not in ('hebrew', 'latin'): continue
    url = re.search(r'url\((https://[^)]+)\)', face).group(1)
    fam = re.search(r"font-family: '([^']+)'", face).group(1).lower(); w = re.search(r'font-weight: (\d+)', face).group(1)
    name = f'{fam}-{w}-{subset}.woff2'
    path = os.path.join(ROOT, 'assets', 'fonts', name)
    if not os.path.exists(path): open(path, 'wb').write(get(url, ua=True)); n += 1
    out.append(face.replace(url, '../fonts/' + name))
open(os.path.join(ROOT, 'assets', 'fonts', 'fonts.css'), 'w').write('\n'.join(out) + '\n')
print('font faces', len(out), 'new files', n)
