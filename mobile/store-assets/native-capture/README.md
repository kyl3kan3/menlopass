# Native App Store capture harness

Production reference: peri 2.0.0 build 47, runtime `2.0.0-instrument-1`. (The 1.2.2 reference was build 40, source `5bb2dae4e4acefa8491a9e0b48225443d4adb560`.)

`CaptureApp.tsx` exports the root component. Only the separate `store-capture` Metro configuration may alias `./App.native` imported by `mobile/index.native.ts` to this file. Production must continue resolving the original entry. This harness contains no RevenueCat, AppsFlyer, PostHog, Observe, OTA or telemetry import and does not make purchases or call native health/privacy services. It must never be shipped as the production entry.

Use the simulator-only application with the registered `peri-capture` scheme:

| Link | Actual screen |
| --- | --- |
| `peri-capture://today` | Today's page with the fictional ledger and finding |
| `peri-capture://dossier` | The dossier |
| `peri-capture://report` | The one-page brief |
| `peri-capture://index` | The index; open real chapters using the UI |
| `peri-capture://setup` | The letter (first page) with the fixture's blanks pre-filled |
| `peri-capture://privacy` | Optional analytics consent screen (the production component) |

Opening a link again resets that view and its temporary fictional state. There is no screenshot toolbar. The native tab bar and HTML interactions work. Native persistence/analytics/purchase/share/HealthKit/notification messages are intentionally ignored; do not use this harness to validate subscription flows.

## Fidelity and distinctions

- The exact bundled `mobile/assets/menlopass.html` is loaded through Expo Asset/File and passed to a native WebView, as in production. Do not modify that HTML for capture.
- Safe-area edges, WebView presentation flags and native viewport setup match production. The shared `NativeTabBar` supplies the real native chrome on both iPhone and iPad; sheets/detail routes hide it according to the app's real navigation messages.
- The consent screen is the production `ConsentChoice` component exported from `App.native.tsx`; only its callback is inert/local. The letter is the real web first page with the fixture's profile set to not-yet-onboarded.
- Subscription access is injected exclusively in this harness. No entitlement or SDK state is altered. The displayed health UI is the real subscribed renderer, not a simulated paywall or store purchase.
- Fictional Morgan data is embedded: 60 days (schema v8, migrated to v9 on load), sample treatments/labs, no real patient data. Its ordinary variation is not a claim of treatment effectiveness. WebView time is fixed at September 26, 2026, 14:19 Chicago time for consistent dates. Native status-bar time remains the simulator's own setting.
- No inner content is hidden, deleted, rewritten, scaled or truncated. Capture whole native screenshots; any marketing framing happens afterward. No app security, encryption, telemetry or billing behavior is being tested by this harness.
- No active update banner is shown, matching the normal up-to-date state. No diagnostic SDK wrappers are mounted.

## Artwork sequence (same on iPhone and iPad)

1. **One finding a day, written from your record.** Today's page, tab bar visible.
2. **One tap files it. The time is already there.** The log sheet.
3. **At three in the morning the page goes dark.** The night desk (set the simulator clock after 22:00 or use the browser composer).
4. **Seven sections a clinician reads in two minutes.** The dossier.
5. **Export the one-page brief as a PDF.** The brief.
6. **Fifteen reviewed chapters. Your own ledger first.** The index.
7. **Help improve peri?** Optional analytics consent screen (supplementary).

The browser composer (`npm run screenshots:store`) produces the same sequence from the built web app with the tab bar drawn by the composer; use this harness when App Store Connect needs true device captures. Name what is free and what peri Pro unlocks in the marketing frame.

## Reproduce

From `mobile`, build the unsigned simulator profile with `npx eas-cli@latest build --platform ios --profile store-capture`. Wait for the artifact before starting a bounded EAS simulator session. Use a real iPhone 17 Pro Max and iPad Pro 13-inch simulator and inspect each screen before capturing. `agent-device screenshot` currently defaults to logical pixels; explicitly request `--pixel-density 3` on iPhone and `--pixel-density 2` on iPad, plus `--normalize-status-bar`.

Save whole PNGs under the ignored `native-capture/raw/iphone` and `native-capture/raw/ipad` folders with the route names above. Update `capture-provenance.json` with the completed build/device/capture details. From the repository root, run:

```sh
node mobile/store-assets/compose-native-store.cjs --provenance mobile/store-assets/native-capture/capture-provenance.json
```

The compositor needs `sharp`; in this workspace it is available through the bundled Codex runtime's `NODE_PATH`. It creates 1320×2868 iPhone and 2064×2752 iPad RGB PNGs, a contact sheet, a local HTML preview, and a manifest with input/output hashes. Those dimensions follow [Apple's screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/). Inspect the outputs before uploading. Creating this pack does not change the screenshots on a pending App Review submission.
