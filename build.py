#!/usr/bin/env python3
"""Assemble the Meno Compass PWA.

Produces dist/index.html with all CSS and JS inlined (so the single file also
works standalone, e.g. opened from disk or previewed in a sandbox), plus the
manifest, service worker and icons alongside it for a real PWA deploy.
"""
import base64
import os
import shutil
import re

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, 'src')
DIST = os.path.join(ROOT, 'dist')

JS_ORDER = ['content-a.js', 'content-b.js', 'app-core.js', 'app-views.js']


def read(p):
    with open(os.path.join(SRC, p), encoding='utf-8') as f:
        return f.read()


os.makedirs(DIST, exist_ok=True)

css = read('styles.css')
js = '\n\n'.join('/* ==== ' + n + ' ==== */\n' + read(n) for n in JS_ORDER)

# favicon inlined so the standalone file needs nothing external
fav_path = os.path.join(DIST, 'icons', 'favicon-64.png')
fav = ''
if os.path.exists(fav_path):
    with open(fav_path, 'rb') as f:
        fav = 'data:image/png;base64,' + base64.b64encode(f.read()).decode()

HTML = f"""<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=5">
<title>Meno Compass — menopause tracker &amp; guide</title>
<meta name="description" content="A private daily tracker and evidence-based reference for perimenopause and menopause: symptoms, sleep, weight, movement, diet, skin, mood and sexual health. No account, no server.">
<meta name="theme-color" content="#fbf9fa">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Meno Compass">
<meta name="color-scheme" content="light dark">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<link rel="icon" href="{fav}">
<style>
{css}
</style>
</head>
<body>
<noscript><div style="padding:24px;font-family:system-ui">Meno Compass needs JavaScript. Everything runs locally in your browser — there is no server involved.</div></noscript>
<script>
{js}
</script>
</body>
</html>
"""

with open(os.path.join(DIST, 'index.html'), 'w', encoding='utf-8') as f:
    f.write(HTML)

for n in ('manifest.webmanifest', 'sw.js'):
    shutil.copy(os.path.join(SRC, n), os.path.join(DIST, n))

kb = len(HTML.encode('utf-8')) / 1024
print(f'dist/index.html  {kb:.0f} KB')
print('dist/manifest.webmanifest, dist/sw.js copied')
