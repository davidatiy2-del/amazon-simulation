"""The app icon: a little globe with the jungle's leaves around it, on a deep green ground."""
import os, math, random
from PIL import Image, ImageDraw, ImageFilter
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
S = 2048


def radial(size, c0, c1, cx=0.5, cy=0.45, r=0.75):
    img = Image.new('RGB', (size, size), c1)
    px = img.load()
    for y in range(0, size, 4):
        for x in range(0, size, 4):
            d = min(1, math.hypot(x / size - cx, y / size - cy) / r)
            col = tuple(int(c0[i] + (c1[i] - c0[i]) * d) for i in range(3))
            for yy in range(y, min(size, y + 4)):
                for xx in range(x, min(size, x + 4)):
                    px[xx, yy] = col
    return img.filter(ImageFilter.GaussianBlur(6))


def leaf(draw, cx, cy, length, width, ang, fill, vein):
    # a leaf: a pointed oval along the angle, with a vein down the middle and a few side veins
    pts = []
    for k in range(0, 41):
        t = k / 40
        x = t * length; y = math.sin(math.pi * t) ** 0.8 * width * (1 - 0.35 * t)
        pts.append((x, y))
    for k in range(40, -1, -1):
        t = k / 40
        x = t * length; y = -math.sin(math.pi * t) ** 0.8 * width * (1 - 0.35 * t)
        pts.append((x, y))
    ca, sa = math.cos(ang), math.sin(ang)
    P = [(cx + x * ca - y * sa, cy + x * sa + y * ca) for x, y in pts]
    draw.polygon(P, fill=fill)
    draw.line([(cx, cy), (cx + length * ca, cy + length * sa)], fill=vein, width=int(width * 0.08))
    for k in range(1, 6):
        t = k / 6.5; bx, by = cx + length * t * ca, cy + length * t * sa
        for s in (-1, 1):
            ex = bx + (length * 0.16) * ca - s * width * 0.55 * (1 - t * 0.5) * sa
            ey = by + (length * 0.16) * sa + s * width * 0.55 * (1 - t * 0.5) * ca
            draw.line([(bx, by), (ex, ey)], fill=vein, width=int(width * 0.04))


def art(size, scale=1.0, bg=True):
    s = size
    img = radial(s, (38, 104, 58), (12, 38, 24)) if bg else Image.new('RGBA', (s, s), (0, 0, 0, 0))
    img = img.convert('RGBA')
    d = ImageDraw.Draw(img)
    cx, cy, R = s * 0.5, s * 0.47, s * 0.30 * scale
    # the glow of the air around the globe
    glow = Image.new('RGBA', (s, s), (0, 0, 0, 0)); g = ImageDraw.Draw(glow)
    g.ellipse([cx - R * 1.16, cy - R * 1.16, cx + R * 1.16, cy + R * 1.16], fill=(120, 220, 255, 110))
    img = Image.alpha_composite(img, glow.filter(ImageFilter.GaussianBlur(s * 0.025)))
    # the sea
    globe = Image.new('RGBA', (s, s), (0, 0, 0, 0)); gd = ImageDraw.Draw(globe)
    for k in range(60, 0, -1):
        t = k / 60; rr = R * t
        col = (int(24 + 40 * (1 - t)), int(90 + 70 * (1 - t)), int(140 + 70 * (1 - t)), 255)
        gd.ellipse([cx - R * 0.12 * (1 - t) - rr, cy - R * 0.18 * (1 - t) - rr, cx - R * 0.12 * (1 - t) + rr, cy - R * 0.18 * (1 - t) + rr], fill=col)
    # the lands: smooth continents from a soft noise field (the New World on the left, the Old World on the right)
    rnd = random.Random(5)
    n = 9
    grid = Image.new('L', (n, n))
    gp = grid.load()
    for y in range(n):
        for x in range(n):
            v = rnd.random() * 0.55 + 0.25
            if x in (n // 2,): v *= 0.45          # the ocean between the two worlds
            if y in (0, n - 1): v *= 0.6
            gp[x, y] = int(v * 255)
    field = grid.resize((int(R * 2), int(R * 2)), Image.BICUBIC).filter(ImageFilter.GaussianBlur(R * 0.06))
    land = field.point(lambda v: 255 if v > 132 else 0).filter(ImageFilter.GaussianBlur(R * 0.012)).point(lambda v: 255 if v > 128 else 0)
    dry = field.point(lambda v: 255 if v > 185 else 0).filter(ImageFilter.GaussianBlur(R * 0.03))
    green = Image.new('RGBA', land.size, (78, 158, 70, 255)); tan = Image.new('RGBA', land.size, (206, 182, 118, 255))
    lay = Image.composite(tan, green, dry)
    lay.putalpha(land)
    globe.alpha_composite(lay, (int(cx - R), int(cy - R)))
    # the ice at the top and the bottom
    gd.ellipse([cx - R * 0.6, cy - R * 1.05, cx + R * 0.6, cy - R * 0.82], fill=(236, 244, 250, 255))
    gd.ellipse([cx - R * 0.55, cy + R * 0.86, cx + R * 0.55, cy + R * 1.05], fill=(236, 244, 250, 255))
    mask = Image.new('L', (s, s), 0); ImageDraw.Draw(mask).ellipse([cx - R, cy - R, cx + R, cy + R], fill=255)
    globe.putalpha(Image.composite(globe.split()[3], Image.new('L', (s, s), 0), mask))
    # light from the top left, shade to the bottom right
    shade = Image.new('RGBA', (s, s), (0, 0, 0, 0)); sd = ImageDraw.Draw(shade)
    for k in range(40):
        t = k / 40
        sd.ellipse([cx - R + R * 0.9 * t, cy - R + R * 0.9 * t, cx + R + R * 0.25 * t, cy + R + R * 0.25 * t], outline=(0, 20, 40, int(5 + 4 * t)), width=int(R * 0.05))
    shade.putalpha(Image.composite(shade.split()[3], Image.new('L', (s, s), 0), mask))
    img = Image.alpha_composite(img, globe); img = Image.alpha_composite(img, shade)
    hl = Image.new('RGBA', (s, s), (0, 0, 0, 0)); ImageDraw.Draw(hl).ellipse([cx - R * 0.62, cy - R * 0.72, cx - R * 0.05, cy - R * 0.25], fill=(255, 255, 255, 70))
    img = Image.alpha_composite(img, hl.filter(ImageFilter.GaussianBlur(R * 0.08)))
    # a golden ring
    d = ImageDraw.Draw(img)
    d.ellipse([cx - R * 1.05, cy - R * 1.05, cx + R * 1.05, cy + R * 1.05], outline=(242, 184, 75, 255), width=int(R * 0.05))
    # the jungle's leaves at the bottom
    lv = Image.new('RGBA', (s, s), (0, 0, 0, 0)); ld = ImageDraw.Draw(lv)
    base_y = cy + R * 1.0
    for ang, L, W, x0, col in [(-2.6, 0.8, 0.22, -0.05, (46, 128, 60, 255)), (-0.55, 0.8, 0.22, 0.05, (52, 140, 66, 255)), (-2.15, 0.62, 0.18, -0.1, (70, 160, 76, 255)), (-1.0, 0.62, 0.18, 0.1, (64, 152, 70, 255))]:
        leaf(ld, cx + x0 * R, base_y + R * 0.42, L * R, W * R, ang, col, (24, 70, 34, 255))
    img = Image.alpha_composite(img, lv)
    return img


def save(img, size, path):
    img.resize((size, size), Image.LANCZOS).save(path)


os.makedirs(os.path.join(ROOT, 'assets', 'icons'), exist_ok=True)
full = art(S)
save(full, 512, os.path.join(ROOT, 'assets', 'icons', 'icon-512.png'))
save(full, 192, os.path.join(ROOT, 'assets', 'icons', 'icon-192.png'))
mask = art(S, 0.78)
save(mask, 512, os.path.join(ROOT, 'assets', 'icons', 'icon-maskable-512.png'))
# Android: the launcher icons (legacy, every density) and the adaptive icon's foreground (art inside the safe circle)
res = os.path.join(ROOT, 'android', 'app', 'src', 'main', 'res')
for dens, px in [('mdpi', 48), ('hdpi', 72), ('xhdpi', 96), ('xxhdpi', 144), ('xxxhdpi', 192)]:
    os.makedirs(os.path.join(res, 'mipmap-' + dens), exist_ok=True)
    save(full, px, os.path.join(res, 'mipmap-' + dens, 'ic_launcher.png'))
    save(full, px, os.path.join(res, 'mipmap-' + dens, 'ic_launcher_round.png'))
fg = art(S, 0.62, bg=False)
bgimg = radial(S, (38, 104, 58), (12, 38, 24)).convert('RGBA')
for dens, px in [('mdpi', 108), ('hdpi', 162), ('xhdpi', 216), ('xxhdpi', 324), ('xxxhdpi', 432)]:
    save(fg, px, os.path.join(res, 'mipmap-' + dens, 'ic_launcher_foreground.png'))
    save(bgimg, px, os.path.join(res, 'mipmap-' + dens, 'ic_launcher_background.png'))
full.resize((512, 512), Image.LANCZOS).save(os.path.join(ROOT, 'assets', 'icons', 'preview.png'))
print('icons done')
