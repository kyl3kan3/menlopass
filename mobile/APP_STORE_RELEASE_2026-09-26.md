# peri 1.2.2 App Store release — September 26, 2026

The release embeds the AppsFlyer startup initialization correction, so a new installation does not need an OTA download to obtain it. It also includes the current consent controls and setup preview.

## Candidate

- Version/build: **1.2.2 (40)**.
- Source: `5bb2dae4e4acefa8491a9e0b48225443d4adb560` on `codex/consented-tracking`.
- Runtime: `1.2.2-native-tracking-2`. SDK 57 native patch updates require this separate OTA compatibility boundary; older binaries retain their existing update stream.
- [EAS build](https://expo.dev/accounts/kyl3kan3/projects/menlopass/builds/e003ae8e-2994-484f-9890-7e201946bdf0).
- [Apple upload](https://expo.dev/accounts/kyl3kan3/projects/menlopass/submissions/0ef93e6d-614e-4db0-8fe6-7d2f0e775a0d).

Build number 39 was reserved by an upload stopped before a cloud build was created, after Expo Doctor identified required SDK patch updates. EAS confirmed no build 39 job was created. Build 40 is the intended candidate.

## Validation

- Full `npm test` passed, including startup initialization/cancellation regression tests, analytics contracts, subscription gating, security, widgets, and responsive UI checks.
- Mobile TypeScript, web export, embedded web synchronization, and public Expo config resolution passed.
- Expo Doctor: **21/21 checks passed** after compatible SDK 57 patch updates.
- [GitHub CI for the exact source](https://github.com/kyl3kan3/menlopass/actions/runs/36233251590) passed.
- Public privacy, support, and terms URLs returned HTTP 200.
- Inspected the signed IPA: app and widget are both 1.2.2 (40), with production channel and runtime `1.2.2-native-tracking-2`. Hermes bytecode confirms AppsFlyer initialization completes before the session listener is registered. Diagnostic privacy flags match the release configuration.
- IPA SHA-256: `71b40cbe50c679f0ad85f77cfcd762216782cbec1b281d3353815ece74f8ac27`.
- No physical iPhone/iPad launch, StoreKit purchase, permission, or replay-mask test was performed in this Windows session. Automated tests and archive inspection do not establish those device results.

## App Store metadata

Created version 1.2.2, saved the release notes and [current reviewer instructions](APP_REVIEW_NOTES_1.2.2.md), retained the existing review contact and no-login setting, and verified five inherited screenshots for each iPhone and iPad. Automatic release after approval and immediate availability to all users remain selected.

Published the corrected [privacy declarations](PRIVACY_DISCLOSURES_1.2.2.md) and verified the resulting eight data categories in App Store Connect. The native diagnostic privacy manifest now marks performance and other diagnostic data as linked, while sanitized crash data remains unlinked.

## Apple release status

**Submitted and Waiting for Review**, verified in App Store Connect on September 26, 2026 at 04:53 CDT (09:53 UTC).

- Apple finished processing build 40 and it was attached to version 1.2.2.
- Apple build ID: `bd87bdef-b202-4797-a63d-df830a715a7c`.
- Submission ID: `01368c84-8411-42e6-84e9-c18b0f7aa103`.
- [App Review submission](https://appstoreconnect.apple.com/apps/6798018790/distribution/reviewsubmissions/details/01368c84-8411-42e6-84e9-c18b0f7aa103) confirms one item, **1.2.2 (40)**, Waiting for Review.
- Local confirmation screenshot: `test-results/release-1.2.2-build40/app-review-submitted.png` (ignored verification artifact).

Automatic release after approval remains enabled. The public App Store release is still 1.2.1 until Apple's review and release processing complete.
