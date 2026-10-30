# Pip, the peri sprout companion

Original character created in Masko on October 2, 2026 for peri, the app in the MenoCompass repository. The current crisp-v2 artwork has cleaner, more consistent outlines, simplified color fills and reduced texture. Original files are preserved in `archive-v1/`.

Pip is a sage pear-shaped sprout with a cream face and belly, two unequal leaves, forest outlines, and peach cheeks. The personality is warm, lightly humorous, and reassuring.

## Reusable assets

- `reference.png`: original canonical artwork, with an ivory background.
- `phone.png`: 1024 × 1024 transparent phone reaction pose.
- `guide.png`: 1024 × 1024 transparent welcoming pose.
- `check-in.webm`: 720 × 720 transparent five-second Masko animation; puzzled glance, phone tap, then smile.
- `generation.json`: stable project, collection, job and asset IDs, prompts, and generation cost.

Reuse collection `64acb896-bc5f-4409-8b7b-ae24c970f5b1` for future poses so Pip stays consistent. Use the cleaned guide image `737e4689-0fb9-404a-bf24-53ffae709794` as the production style reference. The exact cleanup requests and job IDs are in `crisp-v2/`. Animation source IDs must refer to the original image, rather than its transparent derivative. CDN publishing is disabled.

Keep Pip’s full leaf tuft and feet visible. Scale uniformly. Preserve the forest outline, asymmetrical leaves, sage body, cream patch and peach cheeks.

The social pack is in `marketing/pip-social/preview.html`. Its copy is editable in `marketing/pip-social/creative.json`; reproduce it with `node tools/mascot-studio/render.cjs` from the repository root.

## In the app

`app/` holds the production cuts: `pip-phone.webp` (waiting pose), and the guide pose split at the stem into `pip-guide-leaves.webp` and `pip-guide-body.webp` so the leaves can sway in CSS. `build.py` inlines all three as data URIs (about 110 KB) and `app-views.js` places them through `pip()` and `pipSays()`. Rules: one Pip per screen, full body always, phone pose while a check-in is waiting, guide pose once it is saved and on stories, care, support and welcome; never on the printable report, detailed log, settings or legal pages. Motion (breathing, leaf sway, bubble pop) is CSS only and respects reduced motion.

`check-in.webm` plays once on the check-in confirmation screen in the web build. WebKit does not play VP9 transparency, so Safari and the native WebView keep the still pose until `crisp-v2/check-in.mov` (the HEVC-with-alpha render from the same Masko job, asset `hevc_720`) is added; `build.py` picks it up automatically and the native bundle would additionally need the file inlined or served from a base URL.
