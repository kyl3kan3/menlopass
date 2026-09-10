# Native release — September 10, 2026

- App version: `1.2.1`, build number: `34`, runtime: `1.2.0-native-2`.
- Source: `9e9bff3c0908d8b9c5e65ebc3507f6b6f8916c1c`.
- [EAS production iOS build](https://expo.dev/accounts/kyl3kan3/projects/menlopass/builds/83abd0fd-9235-42d0-8833-d39064cad464).
- [Automatic TestFlight submission](https://expo.dev/accounts/kyl3kan3/projects/menlopass/submissions/9851156a-2d77-4696-89ce-6b93e1cd462b).

This full native build includes the current app, widgets, native integrations, and dedicated MenoCompass PostHog configuration from the EAS production environment. It embeds the current application so a new installation does not depend on downloading the tracking OTA first. The existing runtime and production OTA channel remain compatible.

Web assets were rebuilt and synchronized without changes. The full release checks had passed immediately before this build in the [PostHog migration](POSTHOG_MIGRATION_2026-09-10.md); application source did not change afterward.

Build finished successfully at `2026-09-10T09:26:19.095Z`. The automatic submission log confirmed that the new binary was successfully uploaded to App Store Connect and submitted to TestFlight. Apple processing was not awaited by the submission worker; tester availability remains subject to Apple processing. No App Store review submission or physical-device QA is claimed.
