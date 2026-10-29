"""One-time: split base.html + mods/ into src/ (the game in parts)."""
import os, re, shutil, glob
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = open(os.path.join(ROOT, 'base.html'), encoding='utf-8').read()
lines = src.split('\n')
# the shell, the style, the script
i_style0 = next(i for i, l in enumerate(lines) if l.strip() == '<style>')
i_style1 = next(i for i, l in enumerate(lines) if l.strip() == '</style>')
i_three = next(i for i, l in enumerate(lines) if l.startswith('<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js'))
i_s0 = i_three + 1
assert lines[i_s0] == '<script>'
i_s1 = max(i for i, l in enumerate(lines) if l == '</script>')
css = '\n'.join(lines[i_style0 + 1:i_style1]) + '\n'
shell = '\n'.join(lines[:i_style0] + ['<!--STYLE-->'] + lines[i_style1 + 1:i_three] + ['<!--SCRIPTS-->'] + lines[i_s1 + 1:]) + '\n'
js = lines[i_s0 + 1:i_s1]
# where each part begins: the first section header of each group
GROUPS = [
    ('00-core', None), ('01-world', 'WORLD ='), ('02-vegetation', 'VEGETATION'), ('03-animal-models', 'RIGS & ANIMAL MODELS'),
    ('04-animals-ai', 'ANIMALS & AI'), ('05-hunters', 'HUNTERS & TAMING'), ('06-player', 'PLAYER ='), ('07-progress-combat', 'PROGRESS: save'),
    ('08-living-world', 'NEXT LEVEL'), ('09-home-camp', 'HOME, CAMP & NIGHT'), ('10-hunter-skills', 'FAMILIES BY CHOICE'), ('11-tribes', "THE HUNTER'S JOURNEY"),
    ('12-own-tribe', 'YOUR OWN TRIBE'), ('13-people', 'PEOPLE: tribal looks'), ('14-tribe-life', 'WHERE EVERYONE IS'), ('15-weapons-war', 'WEAPONS: a spear'),
    ('16-traps-fences', 'TRAPS: snares'), ('17-bigger-world', 'A LARGER JUNGLE'), ('18-horses-building', 'HORSES AND CATTLE'), ('19-orders-politics', 'ORDERS: the chief'),
    ('20-riders-ships', 'TAMING AND RIDERS'), ('21-whole-world', 'THE WHOLE WORLD'), ('22-maps', 'THE MAPS:'), ('23-roles-trade-raids', 'ROLES AND ORDERS'),
    ('40-fx-audio', 'FX ='), ('41-ui', 'UI ='), ('42-main', 'MAIN =')
]
starts = []
for name, key in GROUPS:
    if key is None: starts.append(0); continue
    idx = next(i for i, l in enumerate(js) if l.startswith('// ================= ' + key))
    starts.append(idx)
assert starts == sorted(starts), starts
os.makedirs(os.path.join(ROOT, 'src', 'js'), exist_ok=True); os.makedirs(os.path.join(ROOT, 'src', 'css'), exist_ok=True)
for k, (name, key) in enumerate(GROUPS):
    a = starts[k]; b = starts[k + 1] if k + 1 < len(starts) else len(js)
    open(os.path.join(ROOT, 'src', 'js', name + '.js'), 'w', encoding='utf-8').write('\n'.join(js[a:b]).rstrip('\n') + '\n')
# the newer parts (the round world, the Old World...) sit between the raids and the effects
MODMAP = {'b1_globe.js': '30-globe', 'b2_oldworld.js': '31-old-world', 'b2b_owveg.js': '32-old-world-plants', 'b3_civs.js': '33-civilizations', 'b3b_build.js': '34-town-builder',
          'b3c_towns.js': '35-towns', 'b3d_people.js': '36-civ-people', 'b4_roads.js': '37-roads-bandits', 'b5_globemap.js': '38-globe-map', 'b6_owfauna.js': '39-old-world-animals', 'b7_ferry.js': '39b-ferry'}
for f in sorted(glob.glob(os.path.join(ROOT, 'mods', '*.js'))):
    b = os.path.basename(f); assert b in MODMAP, b
    shutil.copy(f, os.path.join(ROOT, 'src', 'js', MODMAP[b] + '.js'))
open(os.path.join(ROOT, 'src', 'css', 'game.css'), 'w', encoding='utf-8').write(css)
open(os.path.join(ROOT, 'src', 'index.html'), 'w', encoding='utf-8').write(shell)
print('parts', len(GROUPS) + len(MODMAP), 'css', len(css), 'shell', len(shell))
