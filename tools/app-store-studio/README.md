# Peri App Store screenshot studio

A local, editable screenshot project for peri 1.2.2. It contains six English slides for both iPhone and iPad: Today, Journey, HRT/Care, Visit report, Evidence guide, and a feature overview. The connected canvas uses the custom `peri-bold` forest/lime/cream palette, Inter Tight 800 headlines, JetBrains Mono labels, and the template's existing device frames and PNG exporter.

## Run locally

From this studio folder (`tools/app-store-studio`):

```powershell
pnpm install
pnpm dev --hostname 127.0.0.1 --port 3010
```

Open [the Peri screenshot editor](http://127.0.0.1:3010). Use Node.js 20.9 or newer. The first compilation needs network access to fetch the bundled Google fonts through `next/font`; the exporter embeds the loaded fonts. To validate a production build, run `pnpm build` from the same folder.

## Edit and save

The canonical project is [app-store-screenshots.json](app-store-screenshots.json). The editor autosaves changes to this file after about 600 ms and mirrors them to browser storage. Commit the JSON together with its referenced files in `public/screenshots`, `public/art`, the app icon, and [capture-provenance.json](capture-provenance.json), so another checkout can reproduce the deck. Existing copied source assets are sufficient for ordinary editing and export; the original raw capture folder is only needed to regenerate the seed.

Use the device selector to switch between the six iPhone and six iPad slides. Edit copy inline or in the inspector, and drag/resize devices and overlays. Connected mode permits intentional elements to cross slide boundaries; the export clips the shared canvas into individual images. Keep meaningful text, native UI, and the paid-subscription disclosure within each slide. The Peri theme's `inverted: true` variant is forest with cream text and lime accents; its other variant is lime with forest text. An explicit final headline line receives the accent color in both preview and export.

## Export the two bundles

Choose English and **iPhone**, then click **Export bundle**. Repeat with **iPad**. Export uses a fixed snapshot of the current project and downloads a ZIP for the selected device; it does not save directly to the repository's final output folders.

| Device | Bundle contents for six English slides | Final size to retain |
| --- | --- | --- |
| iPhone | 24 PNGs: six slides at each of four sizes | 1320 × 2868 |
| iPad | 12 PNGs: six slides at each of two sizes | 2064 × 2752 |

Extract `ios/iphone/1320x2868/en/` from the iPhone ZIP to `mobile/store-assets/skill-studio/iphone-6.9/` at the repository root. Extract `ios/ipad/2064x2752/en/` from the iPad ZIP to `mobile/store-assets/skill-studio/ipad-13/`. Rename the layout-based filenames to the topic names referenced by `mobile/store.config.json`:

| Export filename | Retained filename |
| --- | --- |
| `01-hero.png` | `01-today.png` |
| `02-device-top.png` | `02-journey.png` |
| `03-device-bottom.png` | `03-care.png` |
| `04-no-device.png` | `04-report.png` |
| `05-device-top.png` | `05-guide.png` |
| `06-no-device.png` | `06-overview.png` |

Preserve the numbered slide order. Other bundle sizes are optional derivatives.

The exporter creates opaque 8-bit-per-channel RGB PNGs. Inspect all twelve retained images for complete device screens, legible copy and disclosures, and intentional connected-canvas edges before using them. This studio only creates local assets; it does not upload screenshots or change App Store Connect.

## Capture provenance

App UI comes from genuine native simulator captures with fictional Morgan records: 60 days ending September 26, 2026, with no real patient or customer data. The production reference is peri 1.2.2 build 40, source `5bb2dae4e4acefa8491a9e0b48225443d4adb560`, runtime `1.2.2-native-tracking-2`.

The captures were made with a separate simulator-only harness at source `072915d81f9789ea24d23da28b3e906d5d715366`, capture build `cdea1163-1927-4972-908f-f37415e80e96`. It uses the production HTML and shared native UI with fictional state and inert service callbacks. These are source-faithful simulator captures, not captures of the signed App Store Connect binary and not purchase-flow validation.

Source screenshots are copied unchanged. Detail images are contiguous crops of those captures; native UI is not reconstructed or rewritten. Marketing copy, backgrounds, device framing, and deliberate cropping are applied around those pixels. The original iPad layout, including its production gutter, remains in the source captures. See the local [asset provenance](capture-provenance.json) for source/output hashes and crop rectangles, and the [native capture documentation](../../mobile/store-assets/native-capture/README.md) for the harness distinctions.

## Regenerating the initial seed

[scripts/seed-peri.cjs](scripts/seed-peri.cjs) rebuilds the initial project, copies source screenshots, generates crop/art assets, and rewrites the project JSON and provenance. It requires `sharp` to be resolvable by Node (for example through the workspace runtime's `NODE_PATH`) and the ignored, currently local-only raw PNGs in `mobile/store-assets/native-capture/raw/{iphone,ipad}/`, plus the native capture provenance file. A fresh clone does not include those raw captures.

**Do not rerun the seed over an edited project.** Commit or separately preserve your JSON and assets first, and stop the editor before an intentional regeneration so autosave cannot overwrite either version. When deliberately resetting to the starter deck, run from this folder:

```powershell
node scripts/seed-peri.cjs
```

The seed is an initial layout, not a replay of subsequent manual edits. Normal iteration should use the existing editor and its canonical JSON.

## Credit

Scaffolded from the repository's [app-store-screenshots skill and editor template](../../.agents/skills/app-store-screenshots/SKILL.md). Peri customization retains the template's editor, device frames, connected-canvas behavior, autosave, and export pipeline.
