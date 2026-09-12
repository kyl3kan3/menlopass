# peri logo

The ivory lowercase p with a leaf-shaped counter on botanical green is the shared peri brand mark. `peri-icon-master.png` is the opaque production master; `peri-mark-transparent.png` is its foreground companion for monochrome packaging.

Run `node mobile/scripts/generate-brand-assets.cjs` (or `python make_icons.py`) to package the root PWA icons and native icon assets. The iOS icon is an opaque RGB 1024 × 1024 PNG. Run `npm run mobile:sync`, `npm run screenshots:store`, and `npm run demo:product` after a brand change.

App chrome embeds the packaged 192px icon at build time so it remains available offline in the native WebView. Store screenshots and videos embed the same native icon; they no longer construct independent marks in CSS.

The clinical and navigation symbols are functional icons, not brand marks, and retain their existing meanings.
