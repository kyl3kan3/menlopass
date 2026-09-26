# Native App Store capture harness

Production reference: peri 1.2.2 build 40, source `5bb2dae4e4acefa8491a9e0b48225443d4adb560`, runtime `1.2.2-native-tracking-2`.

`CaptureApp.tsx` exports the root component. Only the separate `store-capture` Metro configuration may alias `./App.native` imported by `mobile/index.native.ts` to this file. Production must continue resolving the original entry. This harness contains no RevenueCat, AppsFlyer, PostHog, Observe, OTA or telemetry import and does not make purchases or call native health/privacy services. It must never be shipped as the production entry.

Use the simulator-only application with the registered `peri-capture` scheme:

| Link | Actual screen |
| --- | --- |
| `peri-capture://today` | Today dashboard with fictional history |
| `peri-capture://journey` | Journey timeline |
| `peri-capture://care` | Treatment and appointment records |
| `peri-capture://report` | Appointment report route |
| `peri-capture://guide` | Guide landing page; open real topic sheets using the UI |
| `peri-capture://setup` | Shared native onboarding summary, step 4 |
| `peri-capture://setup?step=1` | Shared native concern picker, step 2 (steps 0–3 supported) |
| `peri-capture://privacy` | Optional analytics consent screen |

Opening a link again resets that view and its temporary fictional state. There is no screenshot toolbar. Normal native tabs and HTML interactions work. Native persistence/analytics/purchase/share/HealthKit/notification messages are intentionally ignored. The setup purchase and restore callbacks are inert; do not use this harness to validate subscription flows. The real setup component's Privacy/Terms links remain its normal external links.

## Fidelity and distinctions

- The exact bundled `mobile/assets/menlopass.html` is loaded through Expo Asset/File and passed to a native WebView, as in production. Do not modify that HTML for capture.
- Safe-area edges, WebView presentation flags and native viewport setup match production. Shared `NativeGlassTabs` supplies real native chrome on both iPhone and iPad; sheets/detail routes hide it according to the app's real navigation messages.
- `OnboardingPreview` is imported directly, unmodified. Production analytics consent is inline in `App.native.tsx`, so `PrivacyCapture.tsx` mirrors its exact build-40 JSX/styles; only its callbacks are inert/local.
- Subscription access is injected exclusively in this harness. No entitlement or SDK state is altered. The displayed health UI is the real subscribed renderer, not a simulated paywall or store purchase.
- Fictional Morgan data is embedded: 60 days, sample treatments/labs, no real patient data. Its ordinary variation is not a claim of treatment effectiveness. WebView time is fixed at September 26, 2026, 14:19 Chicago time for consistent dates. Native status-bar time remains the simulator's own setting.
- No inner content is hidden, deleted, rewritten, scaled or truncated. Capture whole native screenshots; any marketing framing happens afterward. No app security, encryption, telemetry or billing behavior is being tested by this harness.
- No active update banner is shown, matching the normal up-to-date state. No diagnostic SDK wrappers are mounted.

## Artwork sequence (same on iPhone and iPad)

1. **Your symptoms. One clear record.** Today dashboard, native tabs visible.
2. **See symptoms and treatment together.** Journey timeline.
3. **Your next visit. Your story, ready.** Appointment report with real report headings and sample history.
4. **Track HRT. Keep the context.** Scroll Care to the real treatment list and fictional medication entries.
5. **A starting point that feels like you.** Shared native setup summary (`setup`), three concerns selected.
6. **Evidence, with room for questions.** Guide: open Symptoms → Hot flashes & night sweats, then scroll the genuine sheet to its evidence section without deleting surrounding content.
7. **Your health. Your choices.** Optional analytics consent screen.

Retain a legible “Subscription required” caption in the marketing frame. Use device-specific native screenshots, not a stretched phone screen or browser-generated tablet sidebar. Privacy consent is an optional supplementary screenshot, not a replacement for a core feature unless the creative plan changes.

## Reproduce

From `mobile`, build the unsigned simulator profile with `npx eas-cli@latest build --platform ios --profile store-capture`. Wait for the artifact before starting a bounded EAS simulator session. Use a real iPhone 17 Pro Max and iPad Pro 13-inch simulator and inspect each screen before capturing. `agent-device screenshot` currently defaults to logical pixels; explicitly request `--pixel-density 3` on iPhone and `--pixel-density 2` on iPad, plus `--normalize-status-bar`.

Save whole PNGs under the ignored `native-capture/raw/iphone` and `native-capture/raw/ipad` folders with the route names above. Update `capture-provenance.json` with the completed build/device/capture details. From the repository root, run:

```sh
node mobile/store-assets/compose-native-store.cjs --provenance mobile/store-assets/native-capture/capture-provenance.json
```

The compositor needs `sharp`; in this workspace it is available through the bundled Codex runtime's `NODE_PATH`. It creates 1320×2868 iPhone and 2064×2752 iPad RGB PNGs, a contact sheet, a local HTML preview, and a manifest with input/output hashes. Those dimensions follow [Apple's screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/). Inspect the outputs before uploading. Creating this pack does not change the screenshots on a pending App Review submission.
