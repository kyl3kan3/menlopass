# peri — bold App Store artwork from the screenshot skill

Six English images per device, created using the installed `app-store-screenshots` skill's editable studio and built-in **Export bundle** flow. The story covers check-ins, symptom history, HRT tracking, visit reports, evidence, and the full feature set. Forest/lime contrast, large headlines, alternate device placement, a report close-up, and a typography-led closer follow the selected bold modern direction.

The editable source is [the screenshot studio](../../../tools/app-store-studio/README.md). The canonical JSON and all referenced input assets are committed there. The PNGs here are unchanged primary exports, renamed by topic. [manifest.json](manifest.json) records dimensions, color format and SHA-256 hashes. [contact-sheet.png](contact-sheet.png) shows both decks; [first-three.png](first-three.png) previews the leading iPhone images.

| Folder | Images | Size | Local store configuration slot |
| --- | --- | --- | --- |
| `iphone-6.9` | 6 | 1320 × 2868 | `APP_IPHONE_67` |
| `ipad-13` | 6 | 2064 × 2752 | `APP_IPAD_PRO_3GEN_129` |

All images are opaque 8-bit-per-channel RGB PNGs. All twelve were visually reviewed at full size and as 220px thumbnails; title/subline overlaps and a clipped iPad Guide title found in the first pass were corrected and re-exported. The full Guide qualifications and liver warning remain visible. Report and HRT detail panels are contiguous crops of the authentic capture pixels. The paid-subscription note is present on every slide.

The UI comes from a native simulator harness using peri 1.2.2 build 40's production source and shared native UI, with fictional Morgan records. These are source-faithful simulator captures, not screenshots of the signed App Store Connect binary. See [capture provenance](../../../tools/app-store-studio/capture-provenance.json) for source commits, simulator build, hashes and crop rectangles.

Validation: studio production build and TypeScript passed; both final browser exports completed without missing-image warnings; primary PNG dimensions/channels and all twelve store-config file references passed; EAS metadata schema returned no errors. The local store configuration selects this set. No App Store Connect upload or release-state change was performed.

The local delivery ZIP is `test-results/peri-app-store-skill-studio-build-40.zip`. It includes these twelve primary images plus all 36 images from the two original export bundles and capture provenance. The ZIP is a local convenience artifact; regenerate future exports in the studio after editing.
