# peri App Store images — 1.2.2 (40)

Created September 26, 2026 from native iPhone and iPad simulator captures of the build-40 app screens, using fictional sample records. The full screenshots are uniformly scaled inside the peri artwork; app content has not been cropped or retouched.

## Upload files

- `iphone-6.9/`: seven 1320 × 2868 PNGs, in numbered order.
- `ipad-13/`: seven 2064 × 2752 PNGs, in numbered order.
- All upload images are 8-bit sRGB with three channels and no transparency.
- `07-privacy.png` is an optional supplementary image. The first six cover the core app and setup.

Upload the device-specific PNGs only. `contact-sheet.png` is an overview; `preview.html` is a local gallery. Neither belongs in the store screenshot carousel.

The images have **not been uploaded to App Store Connect**. The pending App Review submission remains unchanged.

This initial creative direction was superseded by `../bold-modern/` on September 27, 2026. `mobile/store.config.json` selects that replacement set. These older exports are retained for comparison.

## Source and fidelity

Production reference: version 1.2.2, build 40, source `5bb2dae4e4acefa8491a9e0b48225443d4adb560`.

The separate simulator-only capture build uses the production HTML and shared native navigation/setup components. Its capture root supplies a fictional Morgan record and disables service callbacks. The inline analytics-consent presentation is mirrored from build 40. It is not the signed App Store binary and does not test billing or security behavior. Full provenance, device sizes and SHA-256 hashes are in `manifest.json`.

The current iPad left gutter is preserved. The simulator status bar is normalized to 9:41, while the sample app clock is fixed to the afternoon. Care is scrolled to treatment records on iPhone and shown from the top on iPad. Guide uses its genuine topic sheet, including the evidence and limitations.

Reproduction instructions are in `../native-capture/README.md`. Raw native PNGs are retained locally under the ignored `../native-capture/raw/` directory.
