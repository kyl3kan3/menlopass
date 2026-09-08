# Tracking release — September 8, 2026

App version: `1.2.1`. Native runtime: `1.2.0-native-2`. A new binary is required for the TikTok commerce bridge. Do not publish this JavaScript to `1.2.0-native-1` or either 1.1.0 runtime. The explicit runtime is independent of the marketing version.

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
- Meta revenue has one delivery path: RevenueCat Conversions API to dataset `1087634710465680`. AppsFlyer's Meta in-app postbacks were disabled after finding duplicate initial-purchase and renewal forwarding. Meta install attribution remains active. RevenueCat's option to send without ATT authorization stays unchecked; sandbox destinations are blank.
- TikTok's AppsFlyer partner remains active for app `7679768878880178197`. Added `rc_trial_started_event` → `StartTrial` without values/revenue and `rc_trial_converted_event` → `Subscribe` with values/revenue. Existing initial purchase and renewal → `Subscribe` mappings remain. All five mappings, including `af_content_view` → `ViewContent` without values/revenue, use all media sources. There are no duplicate `mc_*` partner postbacks.
- The transport-only PostHog probe is `menocompass.diagnostic_probe`, `validation=true`, `buildChannel=preview`, anonymous ID `menocompass-release-validation`. Never count it as an install, paying user, or device verification. Probe UUID: `0eb936df-ffa4-4ee2-8659-8212b17788dc`.

## Release evidence

- The PostHog probe was confirmed in the project's live Activity event list, not only accepted by the ingestion endpoint.
- Web app and updated privacy page deployed to https://menlopass.vercel.app. Deployment `dpl_51ApHkbMyWaUYrAcpimRKLXGFtEU`; root and privacy page returned HTTP 200 with the new content. The web app does not initialize native analytics SDKs.
- Full browser/product regression suite, TypeScript checks and Expo Doctor (21/21) passed. Mobile contract suite now has 34 passing tests plus three TikTok ATT checks. iOS Metro export passed.
- Build 31 (`4dc801f0-e7d2-4dee-a3fe-18b330649a5b`) failed Swift strict concurrency checking. Fixed the bridge by projecting the untyped properties to a Sendable string dictionary before the main-actor hop; privacy allowlisting remains on the native side.
- Build 32 (`3ee4861e-4df3-4738-8a8f-90954a8e9836`) was cancelled while queued after App Store Connect confirmed 1.2.0/build 30 is already `READY_FOR_DISTRIBUTION`. The replacement uses marketing version 1.2.1 so it can upload as a new version. Native runtime stays `1.2.0-native-2`.
- Production candidate: [1.2.1 build 33](https://expo.dev/accounts/kyl3kan3/projects/menlopass/builds/b233df60-c526-4b14-8e1e-058f5f10529d), source commit `c5565ec5c60495c137e6b96aacb51d935545a284`. Build **FINISHED** September 8 at 11:19:11 UTC; Xcode archive succeeded and Observe source-map upload was logged. [TestFlight submission](https://expo.dev/accounts/kyl3kan3/projects/menlopass/submissions/f74aaa6a-a025-484f-ad6d-8520c5b8a168) also **FINISHED** successfully.
- [Production OTA](https://expo.dev/accounts/kyl3kan3/projects/menlopass/updates/10f8c99a-7419-4d8d-b3e6-43922cf2c944) published after all release checks passed: group `10f8c99a-7419-4d8d-b3e6-43922cf2c944`, iOS update `01a080c1-806b-7cb1-aff4-352223ce11f3`, source `b6313bd05301c6a59fb940700d3579168a4c38ce`, runtime `1.2.0-native-2`.
- Direct production update protocol checks passed: native-2 received the exact new update (HTTP 200); `1.2.0-native-1` received no update (HTTP 204); `1.1.0-native-2` received its older compatible response, never the new update. This verifies server runtime isolation, not physical-device adoption. Python's default HTTP request was filtered with 403; the Expo Updates request succeeded.
- Observe's iOS event summary contains existing app activity over the last seven days (including 16 app launches and 15 ATT resolutions). This confirms the existing destination receives events, not delivery from the new binary. Its sole initialization failure in that window was AppsFlyer on old 1.1.0/build 14.
- Native build source-map upload is enabled for Observe. Expo currently documents that OTA error stacks are not symbolicated and native crashes are not captured; these are service limitations, not verified coverage. See [Observe error reporting](https://docs.expo.dev/eas/observe/errors/).

Physical iPhone ATT choices, SDK receipt, real startup timing, sandbox purchase/restore, and OTA adoption/rollback must be observed on the exact binary. Automated checks or transport probes do not establish those results. No App Store review submission or physical-device QA is claimed.

## References

- [PostHog React Native SDK](https://posthog.com/docs/libraries/react-native)
- [RevenueCat PostHog identity and forwarding](https://www.revenuecat.com/docs/integrations/third-party-integrations/posthog)
- [RevenueCat Meta delivery and duplicate-event guidance](https://www.revenuecat.com/docs/integrations/attribution/meta-ads)
- [Expo Observe](https://docs.expo.dev/versions/latest/sdk/observe/)
- [TikTok SDK 1.7.2 source](https://github.com/tiktok/tiktok-business-ios-sdk/tree/1.7.2)
