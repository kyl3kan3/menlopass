# peri · Pip social studio

An original mascot social pack inspired by the reference’s simple hook → character → product payoff structure. The artwork, copy, app card and composition are original. None of the supplied reference image or video pixels are reused.

## Exports

- `01-hook.png` and `02-check-in.png`: the two-image post, 1080 × 1920 PNG.
- `pip-check-in-social.mp4`: 10.5-second vertical mascot video, 1080 × 1920, H.264, 30 fps.
- `pip-two-slide-slideshow.mp4`: 8-second slideshow of the two exported PNGs, with gentle zoom and crossfade.
- `video-hook-poster.png` and `video-payoff-poster.png`: static scene previews.
- `preview.html`: responsive local gallery; all references use relative paths.
- `manifest.json`: source hashes, transparency, layout bounds, dimensions, durations and decode validation.

Videos are silent. No third-party music, artwork or added dependency is used.

## Sources

Pip’s canonical transparent assets are generated with Masko and live at:

```
assets/mascot/pip/phone.png
assets/mascot/pip/guide.png
assets/mascot/pip/check-in.webm     # optional alpha animation
```

The sprout is pear-shaped sage with a cream face/belly, forest outlines, two unequal leaves and peach cheeks. The renderer uniformly scales complete source assets with contain fitting; it never crops or edits the mascot PNG pixels. When present, the Masko WebM is decoded with the appropriate libvpx decoder so its alpha survives composition. Missing WebM uses the phone PNG with a subtle bob.

The Bricolage Grotesque font comes from `assets/fonts/bricolage-grotesque-latin.woff2`; its license is `assets/fonts/OFL.txt`.

The symptom card is explicitly labeled **Illustrated example**. Focused ratings and optional context are existing peri features (`app-views.js`, `viewCheckin` and `viewHome`). The artwork invents no notification, treatment effect or medical result. Subscription disclosure is retained in each frame.

## Edit and reproduce

From the repository root, with the existing dependencies installed:

```powershell
node --check tools/mascot-studio/layout.cjs
node --check tools/mascot-studio/render.cjs
node tools/mascot-studio/render.cjs --check
node tools/mascot-studio/render.cjs
```

To render only the images and plates:

```powershell
node tools/mascot-studio/render.cjs --stills-only
```

`creative.json` controls the copy, colors, illustrated ratings and timing. Geometry and typography live in `tools/mascot-studio/layout.cjs`; Playwright capture and ffmpeg composition live in `tools/mascot-studio/render.cjs`. Temporary plates and scene MP4s are written to `.render/`; they are reproducible intermediates.

The capture checks that the local font is loaded, headline text fits, and full asset/card/caption bounds stay within the canvas. Actual alpha pixels and visible mascot bounds are recorded for the PNG sources. The animation’s decoded first-frame alpha extrema are checked. Each final video is inspected for size/duration and completely decoded to check for media errors. Review the exported images and videos visually before posting.
