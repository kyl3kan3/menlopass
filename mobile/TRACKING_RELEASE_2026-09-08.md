# Tracking release — September 8, 2026

Native runtime: `1.2.0-native-2`. A new binary is required for the TikTok commerce bridge. Do not publish this JavaScript to `1.2.0-native-1` or either 1.1.0 runtime.

## Implementation

- PostHog React Native 4.68.0 sends `menocompass.*` events in connected US project `319688`. The account permits one project, so MenoCompass uses its own event namespace and `app=menocompass` property within the existing project. No unrelated project settings were changed.
- Product events and properties are explicitly allowlisted. Automatic lifecycle/touch/screen/exception capture, replay, remote configuration, surveys, push collection and geographic enrichment are disabled. The client creates no person profiles and never identifies by name, email, health content or advertising ID.
- An encrypted, bounded PostHog queue preserves anonymous identity and retries queued events. RevenueCat receives that random ID as `$posthogUserId` to connect server subscription events. Server events use `menocompass.subscription.*`; they are authoritative revenue, while client purchase completion only records a store operation.
- Meta and TikTok receive the same allowlisted `mc_*` commerce events as AppsFlyer, including early-event buffering. No client sends purchase revenue. Automatic Meta/TikTok purchases stay disabled. Do not forward duplicate `mc_*` events from AppsFlyer into these destinations; only the authoritative revenue path should be mapped there.
- Observe records sanitized native-shell errors and a new WebView error/rejection bridge. The bridge sends only a fixed error type and numeric line/column. Startup interactive timing waits for the usable gate/lock screen or the embedded app's post-render ready message.
- OTA publishing now checks matching channel/environment, required configuration, fresh web assets, type checking, regression tests, a clean tree and a finished compatible native build.

## Verified remote configuration

- EAS production already had all AppsFlyer, Meta, TikTok and RevenueCat variables. PostHog token/host added for production and preview.
- RevenueCat project `50953eca` already had active AppsFlyer and Meta integrations. Added US PostHog forwarding with namespaced subscription event names. Subscriber-to-person properties remain disabled; the sandbox API key is blank so sandbox revenue is not routed to this production destination.
- The transport-only PostHog probe is `menocompass.diagnostic_probe`, `validation=true`, `buildChannel=preview`, anonymous ID `menocompass-release-validation`. Never count it as an install, paying user, or device verification. Probe UUID: `0eb936df-ffa4-4ee2-8659-8212b17788dc`.

## Release evidence

Physical iPhone ATT choices, SDK receipt, real startup timing, sandbox purchase/restore, and OTA adoption/rollback must be observed on the exact binary. Automated checks or an accepted transport request do not establish those results. Record build/update IDs and actual results below when available.

## References

- [PostHog React Native SDK](https://posthog.com/docs/libraries/react-native)
- [RevenueCat PostHog identity and forwarding](https://www.revenuecat.com/docs/integrations/third-party-integrations/posthog)
- [Expo Observe](https://docs.expo.dev/versions/latest/sdk/observe/)
- [TikTok SDK 1.7.2 source](https://github.com/tiktok/tiktok-business-ios-sdk/tree/1.7.2)
