from PIL import Image, ImageDraw
import os, math

OUT = os.path.join(os.path.dirname(__file__), 'dist', 'icons')
os.makedirs(OUT, exist_ok=True)

PLUM = (116, 61, 97)
PLUM_D = (90, 46, 75)
CREAM = (251, 249, 250)
ROSE = (217, 163, 196)
SAGE = (123, 165, 140)


def draw_icon(size, maskable=False):
    S = size * 4  # supersample
    img = Image.new('RGB', (S, S), PLUM)
    d = ImageDraw.Draw(img)

    # soft radial-ish background: concentric rings from dark to plum
    for i in range(24):
        f = i / 24
        c = (
            int(PLUM_D[0] + (PLUM[0] - PLUM_D[0]) * f),
            int(PLUM_D[1] + (PLUM[1] - PLUM_D[1]) * f),
            int(PLUM_D[2] + (PLUM[2] - PLUM_D[2]) * f),
        )
        pad = int(S * 0.5 * (1 - f))
        d.ellipse([pad - S * 0.15, pad - S * 0.15, S - pad + S * 0.15, S - pad + S * 0.15], fill=c)

    cx = cy = S / 2
    # scale content in for maskable safe zone (80% -> content within 60% radius)
    k = 0.62 if maskable else 0.78
    R = S * 0.5 * k

    # outer ring
    lw = max(2, int(S * 0.028))
    d.ellipse([cx - R, cy - R, cx + R, cy + R], outline=CREAM, width=lw)

    # crescent: cream disc minus offset plum disc
    r2 = R * 0.66
    disc = Image.new('L', (S, S), 0)
    dd = ImageDraw.Draw(disc)
    dd.ellipse([cx - r2, cy - r2, cx + r2, cy + r2], fill=255)
    off = r2 * 0.52
    dd.ellipse([cx - r2 + off, cy - r2 - off * 0.15, cx + r2 + off, cy + r2 - off * 0.15], fill=0)
    crescent = Image.new('RGB', (S, S), CREAM)
    img.paste(crescent, (0, 0), disc)

    # compass needle: a small rose-coloured pointer, north-east
    ang = math.radians(-38)
    L = R * 0.80
    tipx, tipy = cx + L * math.cos(ang), cy + L * math.sin(ang)
    wdt = R * 0.13
    px, py = -math.sin(ang) * wdt, math.cos(ang) * wdt
    bx, by = cx - L * 0.30 * math.cos(ang), cy - L * 0.30 * math.sin(ang)
    d.polygon([(tipx, tipy), (bx + px, by + py), (bx - px, by - py)], fill=ROSE)

    # centre pivot
    pr = R * 0.10
    d.ellipse([cx - pr, cy - pr, cx + pr, cy + pr], fill=SAGE)

    return img.resize((size, size), Image.LANCZOS)


for s in (192, 512):
    draw_icon(s).save(os.path.join(OUT, f'icon-{s}.png'), optimize=True)
draw_icon(512, maskable=True).save(os.path.join(OUT, 'maskable-512.png'), optimize=True)

# favicon
draw_icon(64).save(os.path.join(OUT, 'favicon-64.png'), optimize=True)
draw_icon(180).save(os.path.join(OUT, 'apple-touch-icon.png'), optimize=True)
print('icons written to', OUT)
