#!/usr/bin/env python3
"""Build the source-flat Meno Compass repository into ``dist/``.

The editable CSS, JavaScript, PWA files, and icons live at the repository root.
This script recreates ``dist/`` on every run, inlines the CSS and JavaScript in
their required order, refreshes the tracked root ``index.html`` mirror, and
copies the install assets into their deployed paths.
"""

from __future__ import annotations

import base64
from pathlib import Path
import shutil


ROOT = Path(__file__).resolve().parent
DIST = ROOT / "dist"
JS_ORDER = ("content-a.js", "content-b.js", "app-core.js", "app-views.js")
PWA_FILES = ("manifest.webmanifest", "sw.js")
PUBLIC_PAGES = ("get-app.html", "privacy.html", "support.html", "terms.html")
ICONS = (
    "apple-touch-icon.png",
    "favicon-64.png",
    "icon-192.png",
    "icon-512.png",
    "maskable-512.png",
)
FONT_FILES = (
    "assets/fonts/bricolage-grotesque-latin.woff2",
    "assets/fonts/OFL.txt",
)
NOTICE_FILES = ("assets/icons/LUCIDE_LICENSE.txt",)
SOURCE_FILES = ("styles.css", *JS_ORDER, *PWA_FILES, *PUBLIC_PAGES, *ICONS, *FONT_FILES, *NOTICE_FILES)


def source_text(name: str) -> str:
    return (ROOT / name).read_text(encoding="utf-8")


def validate_sources() -> None:
    missing = [name for name in SOURCE_FILES if not (ROOT / name).is_file()]
    if missing:
        raise SystemExit("Missing build input(s): " + ", ".join(missing))


def reset_dist() -> None:
    # Keep the only recursive deletion pinned to the repository's direct
    # ``dist`` child; never follow a computed or user-provided path.
    if DIST.parent != ROOT or DIST.name != "dist":
        raise RuntimeError(f"Refusing to clean unexpected output path: {DIST}")
    if DIST.exists():
        shutil.rmtree(DIST)
    (DIST / "icons").mkdir(parents=True)
    (DIST / "assets" / "fonts").mkdir(parents=True)


def build_html() -> str:
    css = source_text("styles.css")
    icon_license = source_text("assets/icons/LUCIDE_LICENSE.txt")
    javascript = "\n\n".join(
        f"/* ==== {name} ==== */\n{source_text(name)}" for name in JS_ORDER
    )
    favicon = base64.b64encode((ROOT / "favicon-64.png").read_bytes()).decode("ascii")

    return f"""<!DOCTYPE html>
<!-- Third-party icon notice:
{icon_license}
-->
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=5">
<title>Meno Compass — menopause tracker &amp; guide</title>
<meta name="description" content="A private daily tracker and evidence-based reference for perimenopause and menopause: symptoms, sleep, weight, movement, diet, skin, mood and sexual health. No account, no server.">
<meta name="theme-color" content="#071416">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="MenoCompass">
<meta name="color-scheme" content="light dark">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<link rel="icon" href="data:image/png;base64,{favicon}">
<style>
{css}
</style>
</head>
<body>
<noscript><div style="padding:24px;font-family:system-ui">Meno Compass needs JavaScript. Everything runs locally in your browser — there is no server involved.</div></noscript>
<script>
{javascript}
</script>
</body>
</html>
"""


def main() -> None:
    validate_sources()
    reset_dist()

    html = build_html()
    # Keep the convenient standalone mirror and the deploy artifact byte-for-byte
    # identical. Source changes should never be patched into either HTML file.
    (ROOT / "index.html").write_text(html, encoding="utf-8", newline="\n")
    (DIST / "index.html").write_text(html, encoding="utf-8", newline="\n")

    for name in PWA_FILES:
        shutil.copyfile(ROOT / name, DIST / name)
    for name in PUBLIC_PAGES:
        shutil.copyfile(ROOT / name, DIST / name)
    for name in ICONS:
        shutil.copyfile(ROOT / name, DIST / "icons" / name)
    for name in FONT_FILES:
        shutil.copyfile(ROOT / name, DIST / name)

    size_kib = len(html.encode("utf-8")) / 1024
    print(f"Built index.html and dist/index.html ({size_kib:.0f} KiB each)")
    print(f"Copied {len(PWA_FILES)} PWA files and {len(ICONS)} icons")
    print(f"Copied {len(PUBLIC_PAGES)} public policy/support pages")
    print(f"Copied {len(FONT_FILES)} local font files")


if __name__ == "__main__":
    main()
