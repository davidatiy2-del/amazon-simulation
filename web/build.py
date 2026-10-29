#!/usr/bin/env python3
"""Build the game from its parts (src/).

  src/index.html      the page: menus, the HUD, the cards (with <!--STYLE--> and <!--SCRIPTS--> where the rest goes)
  src/css/*.css       how it looks
  src/js/NN-name.js   the game itself, part by part, in the order of their numbers

Out:
  amazonia.html       one file with everything inside (the web version, published as the artifact)
  dist/www/           the same game as an app folder: the page, the styles, the parts, three.js and the fonts,
                      all local (no internet needed). The parts are loaded by js/start.js and run as one script.
  android/app/src/main/assets/www   a copy of dist/www for the Android app
  build/main.js       the whole script, for checking (node --check, eslint)
"""
import glob, os, re, shutil, json

ROOT = os.path.dirname(os.path.abspath(__file__))
THREE_CDN = '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/0.159.0/three.min.js" onerror="document.getElementById(\'loadText\').textContent=\'לא הצלחנו לטעון את מנוע התלת־ממד. צריך חיבור לאינטרנט, ואז לרענן את הדף.\'"></script>'
FONTS_CDN = re.compile(r'<link rel="preconnect" href="https://fonts\.googleapis\.com">\n<link rel="preconnect" href="https://fonts\.gstatic\.com" crossorigin>\n<link href="https://fonts\.googleapis\.com/css2[^"]*" rel="stylesheet">\n')


def read(p):
    return open(p, encoding='utf-8').read()


def parts():
    L = sorted(glob.glob(os.path.join(ROOT, 'src', 'js', '*.js')))
    return [(os.path.basename(p), read(p)) for p in L]


def main():
    shell = read(os.path.join(ROOT, 'src', 'index.html'))
    css = ''.join(read(p) for p in sorted(glob.glob(os.path.join(ROOT, 'src', 'css', '*.css'))))
    P = parts()
    js = ''.join(f'// ---- part {n} ----\n{t.rstrip()}\n' for n, t in P)
    assert shell.count('<!--STYLE-->') == 1 and shell.count('<!--SCRIPTS-->') == 1
    # 1. one file (the web version)
    one = shell.replace('<!--STYLE-->', '<style>\n' + css + '</style>').replace('<!--SCRIPTS-->', THREE_CDN + '\n<script>\n' + js + '</script>')
    open(os.path.join(ROOT, 'amazonia.html'), 'w', encoding='utf-8').write(one)
    os.makedirs(os.path.join(ROOT, 'build'), exist_ok=True)
    open(os.path.join(ROOT, 'build', 'main.js'), 'w', encoding='utf-8').write(js)
    # 2. the app folder: everything local
    www = os.path.join(ROOT, 'dist', 'www')
    if os.path.isdir(www): shutil.rmtree(www)
    for d in ('css', 'fonts', 'js/game', 'icons'): os.makedirs(os.path.join(www, d), exist_ok=True)
    page = FONTS_CDN.sub('', shell)
    assert page != shell, 'the fonts link was not found'
    page = page.replace('<!--STYLE-->', '<link rel="stylesheet" href="css/fonts.css">\n<link rel="stylesheet" href="css/game.css">\n<link rel="manifest" href="manifest.webmanifest">\n<meta name="theme-color" content="#0f2a1a">\n<link rel="icon" href="icons/icon-192.png">')
    page = page.replace('<!--SCRIPTS-->', '<script src="js/three.min.js" onerror="document.getElementById(\'loadText\').textContent=\'לא הצלחנו לטעון את מנוע התלת־ממד.\'"></script>\n<script src="js/start.js"></script>')
    open(os.path.join(www, 'index.html'), 'w', encoding='utf-8').write(page)
    open(os.path.join(www, 'css', 'game.css'), 'w', encoding='utf-8').write(css)
    shutil.copy(os.path.join(ROOT, 'assets', 'fonts', 'fonts.css'), os.path.join(www, 'css', 'fonts.css'))
    for f in glob.glob(os.path.join(ROOT, 'assets', 'fonts', '*.woff2')): shutil.copy(f, os.path.join(www, 'fonts'))
    shutil.copy(os.path.join(ROOT, 'assets', 'vendor', 'three.min.js'), os.path.join(www, 'js', 'three.min.js'))
    for n, t in P: open(os.path.join(www, 'js', 'game', n), 'w', encoding='utf-8').write(t)
    names = [n for n, _ in P]
    start = read(os.path.join(ROOT, 'src', 'start.js')).replace('/*PARTS*/[]', json.dumps(names))
    open(os.path.join(www, 'js', 'start.js'), 'w', encoding='utf-8').write(start)
    for f in glob.glob(os.path.join(ROOT, 'assets', 'icons', '*.png')): shutil.copy(f, os.path.join(www, 'icons'))
    shutil.copy(os.path.join(ROOT, 'assets', 'manifest.webmanifest'), www)
    # games that come with the app (assets/gifts/*.amz, transfer codes): the app puts them into the list of games once
    gd = os.path.join(ROOT, 'assets', 'gifts')
    if os.path.isdir(gd):
        names = sorted(f for f in os.listdir(gd) if f.endswith('.amz'))
        os.makedirs(os.path.join(www, 'gifts'), exist_ok=True)
        for f in names: shutil.copy(os.path.join(gd, f), os.path.join(www, 'gifts'))
        open(os.path.join(www, 'gifts', 'list.json'), 'w').write(json.dumps(names))
    # 3. into the Android app
    aw = os.path.join(ROOT, 'android', 'app', 'src', 'main', 'assets', 'www')
    if os.path.isdir(os.path.join(ROOT, 'android', 'app', 'src', 'main')):
        if os.path.isdir(aw): shutil.rmtree(aw)
        shutil.copytree(www, aw)
    print(f'built amazonia.html {len(one)} bytes, {len(P)} parts; dist/www ready')


if __name__ == '__main__':
    main()
