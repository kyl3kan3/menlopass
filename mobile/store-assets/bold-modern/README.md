# peri — bold modern App Store artwork

Redesigned September 27, 2026 for **peri 1.2.2, build 40**. This is the selected replacement for the earlier cream-framed `current-build` set.

## Upload files

- `iphone-6.9/`: six 1320 × 2868 PNGs, numbered in carousel order.
- `ipad-13/`: six 2064 × 2752 PNGs, numbered in carousel order.
- Each upload file is 8-bit sRGB, three channels, with no transparency.
- The sequence is Today → Journey → Care → Report → Setup → Guide.

Only the twelve files inside those two device folders belong in the screenshot carousel. `first-three.png` and `contact-sheet.png` are review images. `preview.html` is the local gallery.

Dimensions checked against [Apple's screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/) on September 27, 2026. The existing EAS/Apple display-type keys remain `APP_IPHONE_67` and `APP_IPAD_PRO_3GEN_129`.

`mobile/store.config.json` selects this set. **These images have not been uploaded to App Store Connect.** The existing review submission was not changed.

## Visual direction

Deep forest and luminous lime, large bold typography, oversized device views, and short feature-focused copy. The first three images introduce the product, weekly symptom patterns, and HRT tracking. The final three cover appointment preparation, personal setup, and evidence.

The iPad version has dedicated compositions. Contiguous magnified UI details sit in distinct foreground panels; Report uses the actual report document. The original tablet layout, including its current left gutter, is preserved in device views.

## Source fidelity

App pixels come from the native simulator captures documented in `manifest.json`. The capture build uses the production HTML and shared native navigation/setup components from the build-40 app, populated with fictional demonstration records. This is not a capture of the signed App Store binary.

App captures are uniformly scaled and rotated. Device views may extend off-canvas. Each iPad detail crop is recorded as an exact source rectangle. Text, values, controls and columns inside the app are not reconstructed or AI-generated. The Guide evidence and qualification box are both visible. Paid-subscription disclosure appears on every image.

The two abstract backgrounds in `source-art/` were generated with the built-in image-generation tool. Final typography, frames, cropping, placement and export are deterministic code-native graphics. Generation briefs are in `source-art/art-direction.md`. The earlier AI hero concept was an art-direction experiment and is not included in the upload set.

SHA-256 hashes for input captures and final artwork, exact output sizes, copy sizes, device transforms and source rectangles are in `manifest.json`.

## Reproduce

Install or expose `sharp` to Node, then run from the repository root:

```powershell
$env:NODE_PATH = 'C:/Users/kylep/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules'
node mobile/store-assets/compose-bold-store.cjs
```

Copy is editable in `creative-copy.json`; geometry is in `../compose-bold-store.cjs`. Raw captures remain locally in the ignored `../native-capture/raw/` directory. Regeneration requires those originals. `--only today` renders one screen for both devices without replacing the full-set manifest or gallery.
