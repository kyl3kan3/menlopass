# peri logo correction — September 12, 2026

The initial rename retained the legacy graphic marks. This correction replaces them with the ivory peri p/leaf monogram on deep green.

Updated surfaces: iOS app icon, Android icon assets, web/PWA icons, splash asset, native purchase and lock screens, onboarding, app header, desktop navigation, download page, all ten App Store screenshots, and both generated product-demo videos. Functional navigation and clinical symbols retain their existing meanings.

The source masters live in `assets/brand/`. `mobile/scripts/generate-brand-assets.cjs` packages native and web sizes, replacing the old compass generator. The iOS icon is an opaque RGB 1024 × 1024 PNG. The web build embeds the same icon for offline/native chrome. Screenshot and video generators embed the native asset instead of constructing separate marks.

Validation: full `npm test`, mobile TypeScript checking, screenshot generation and PNG dimension validation passed. The first iPhone store screenshot was visually inspected with the new mark in both the store frame and embedded application. Product demo media was regenerated.

## Release

- Source: `6ccde22e54c50a8aff0d2b6572b23d07a7ff2ee1`.
- Version `1.2.1`, build `36`; bundle ID and existing subscriptions unchanged.
- Build 35 review submission `c0d729b3-a1a0-44a9-8e14-b01246529a93` was withdrawn. Apple returned the version to `DEVELOPER_REJECTED`, allowing its replacement.
- All ten corrected screenshots and updated release notes were uploaded successfully. Apple reports each image as `COMPLETE`; every source checksum matches the new-logo file in the repository.
- [Build 36](https://expo.dev/accounts/kyl3kan3/projects/menlopass/builds/7ef197ff-de31-4e42-beac-f914fe761201).
- [Automatic binary upload](https://expo.dev/accounts/kyl3kan3/projects/menlopass/submissions/545f9061-25be-49de-9a44-081c421b282a).

Build 36 finished successfully at `2026-09-12T23:18:03.702Z`. Its automatic upload completed, and Apple marked build `1d482ccd-eac6-4b9d-a6c4-9d98639eabe5` as `VALID`.

The build was attached to version 1.2.1 and submitted for App Review at `2026-09-12T23:25:04.052Z`. Read-back confirmed review submission `e24cb52e-34f2-47ab-b89e-0021e2fc389d` is **WAITING_FOR_REVIEW**. Automatic release remains enabled. The replacement is submitted, not yet approved or live.
