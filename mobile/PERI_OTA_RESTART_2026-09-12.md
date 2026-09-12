# peri OTA update flow

Checks on launch after Expo startup finishes and on foreground. Concurrent requests are deduplicated and foreground checks have a one-minute cooldown. Downloads run automatically; failures retry on a later foreground. Expo native download progress appears in a nonmodal banner.

A downloaded update offers Restart now and Later. Later hides that update for the current JavaScript session. A normal future cold launch can still apply Expo's cached update. Restart is never automatic during the running session.

The prompt is gated on unlocked, onboarded, loaded content on Today, Journey or Guide, with no sheet, keyboard, purchase/paywall, review prompt, share, import, privacy, authentication or HealthKit operation. Sheets include breathing and other guided activities; this app currently has no audio-recording flow. A future recorder must join the same safety guard.

Restart requests a fresh WebView snapshot with a unique request ID. The web app checks route, sheets, focused fields and onboarding again, flushes the debounced state, and returns its canonical record. Native code validates and saves it through the encrypted persistence queue before reloading. Interaction is blocked during this handshake. Invalid state, timeout, save failure or newly unsafe activity cancels the restart.

Validation: mobile TypeScript check, full application/mobile layout/contract suite, plus seven OTA tests covering deduplication, offline/download retry, rollback directives, unsafe editing, save-before-reload ordering, duplicate taps, save failure, safety changes, and Later. Actual Expo download/reload on a signed iOS device still needs device verification; Windows has no iOS simulator.

No new native dependency or runtime change. Runtime remains `1.2.0-native-2`. App Store build 36 is already submitted and does not embed this change; it receives it through the existing OTA startup mechanism. Future native builds embed this flow.

Production iOS OTA published and verified with EAS on 2026-09-12 at 23:54:37 UTC. Source commit `5ed53af2bbbaafd9ed45f94d7c37c3736940489d`; group `e388b33b-40e6-4866-bc7a-94967aadb248`; iOS update `01a0980b-6190-7830-b805-641ac60e1418`. Production branch and runtime `1.2.0-native-2` confirmed by `eas update:view`.

[Published OTA](https://expo.dev/accounts/kyl3kan3/projects/menlopass/updates/e388b33b-40e6-4866-bc7a-94967aadb248)
