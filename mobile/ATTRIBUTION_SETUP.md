# Attribution and app observability setup

The native app now uses:

- Expo Observe for app performance, explicitly defined product events, and
  sanitized JavaScript error reports. A privacy wrapper replaces original
  messages before automatic or explicitly handled errors are reported.
- AppsFlyer for install attribution and deep links.
- Meta App Events for Facebook and Instagram campaign measurement.
- TikTok App Events SDK for TikTok install, launch, and retention measurement.
- Apple's App Tracking Transparency prompt before advertising identifiers are enabled.
- RevenueCat as the source of subscription lifecycle and revenue events. The client does not duplicate purchase revenue events in AppsFlyer, Meta, or TikTok.
- RevenueCat's random anonymous App User ID as the optional AppsFlyer customer ID. MenoCompass has no login identity, and no name, email address, phone number, or health value is used as a customer ID.

On iOS, RevenueCat is configured first so its anonymous App User ID is available to the attribution SDKs. The ATT decision then resolves before AppsFlyer, Meta, or TikTok initializes. After that decision, SDK initialization has an eight-second deadline so an unavailable analytics provider cannot hold the automatic hard paywall indefinitely. Initialization continues in the background. Up to 50 sanitized commerce events are buffered in memory until AppsFlyer starts; they retain the access state at event time. The buffer is not durable across process termination. Product events containing health-feature usage stay in Observe.

Health entries, medications, labs, notes, reports, and other free-form user content must never be added to these events.

## Required build values

Set these values in the EAS `production` environment before creating a production build:

- `EXPO_PUBLIC_APPSFLYER_DEV_KEY`
- `EXPO_PUBLIC_META_APP_ID`
- `EXPO_PUBLIC_META_CLIENT_TOKEN`
- `TIKTOK_APP_SECRET` (an EAS sensitive variable; never commit a real value)
- `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`

The TikTok App ID defaults to Apple app ID `6798018790`, and the TikTok Business App ID defaults to `7679768878880178197`. Override them with `TIKTOK_APP_ID` and `TIKTOK_BUSINESS_APP_ID` only if TikTok issues replacements. Use `mobile/.env.example` for local development. Production configuration intentionally fails early if required attribution or subscription values are absent.

`TIKTOK_APP_SECRET` is a client-SDK credential. EAS protects it in source control and build logs, but the native SDK requires the value in the signed application, where a determined user can recover it. Keep it app-scoped, restrict it in TikTok where supported, and rotate it if it has ever been treated as a server-side secret.

The TikTok SDK is linked through CocoaPods by the local Expo module in `mobile/modules/menocompass-tiktok-business`. Its podspec pins `TikTokBusinessSDK` 1.7.2 and applies `-ObjC` and `-lc++` to the app target. EAS Build runs CocoaPods after Expo prebuild; do not add or maintain a generated `ios/Podfile` in this repository.

TikTokBusinessSDK 1.7.2 also ships an empty collected-data placeholder in its bundled privacy manifest. The local Expo config plugin `plugins/withTikTokPrivacyManifestFix.js` removes only that invalid placeholder during the iOS build, preserves TikTok's declared UserDefaults required-reason API, and fails the build if the upstream manifest shape changes. After every SDK upgrade, inspect the archived app's `TikTokBusinessSDK_Privacy.bundle/PrivacyInfo.xcprivacy` before submission.

The SDK is exposed through an explicit Expo native module and is not an app-delegate subscriber. JavaScript invokes it only after ATT resolves, and the native bridge independently rejects initialization while iOS still reports `.notDetermined`. It auto-logs install, launch, and two-day retention only. TikTok automatic StoreKit purchase tracking and enhanced UIKit data collection are disabled. TikTok SKAdNetwork updates are also disabled because AppsFlyer is the app's single conversion-value writer.

## Dashboard configuration

1. In AppsFlyer, create or select the iOS app with bundle ID `com.kyl3kan3.menlopass` and Apple app ID `6798018790`. AppsFlyer displays this as `id6798018790`, but the SDK receives it without the `id` prefix. Copy its developer key into the EAS environment.
2. In Meta for Developers, add the iOS platform to the Meta app, set the same bundle ID, and copy the App ID and client token into EAS.
3. In TikTok Events Manager, select the existing AppsFlyer-connected iOS app and add the TikTok App Events SDK as a hybrid connection. Confirm app ID `6798018790` matches TikTok App ID `7679768878880178197`.
4. In AppsFlyer, keep TikTok enabled as an integrated partner and make AppsFlyer the only SDK that updates SKAdNetwork conversion values.
5. In RevenueCat, enable its AppsFlyer and Meta integrations for server-to-server subscription attribution. Keep automatic Meta and TikTok purchase logging disabled in the app so revenue is not counted twice.
6. Update App Store Connect privacy answers before submitting the new build. The native app now collects limited performance, product-usage, and attribution identifiers; it does not send health-journal content.
7. Publish the revised privacy policy from `privacy.html` before the new build is reviewed.

## Device verification

A development or production build is required because these SDKs contain native code and do not run in Expo Go. Test on a physical iPhone with a fresh install:

1. Verify both Allow and Ask App Not to Track paths.
2. Confirm the app still opens and subscriptions work when permission is denied.
3. Confirm an install/session and `af_content_view` arrive in AppsFlyer.
4. Confirm `fb_mobile_activate_app` and `fb_mobile_content_view` arrive in Meta Events Manager.
5. Confirm `InstallApp` and `LaunchApp` arrive in TikTok Events Manager. Use TikTok's token-based test events mode for pre-release testing.
6. Confirm RevenueCat receives the AppsFlyer identifier and, only after authorization, the Meta anonymous identifier.
7. Complete a sandbox purchase and confirm only one subscription/revenue event reaches each configured destination.
8. Trigger a synthetic handled JavaScript failure. Confirm EAS Observe receives a sanitized error name and stack without the original message, health data, or free text.
9. Confirm EAS Observe receives startup/interactive measurements and privacy-safe route/product events for the exact build. Native crashes are not captured by EAS Observe.

## Commerce measurement, schema 2

The September 5 audit found that AppsFlyer received `af_content_view` but no client purchase-attempt/cancellation/error funnel. The previous `paywall_opened` signal ran before presentation, and `onboarding_started` ran before the subscription gate. Historical installs and active users therefore cannot establish purchases or successful access.

New named events go to AppsFlyer and Observe. `af_content_view` and Meta ViewedContent remain compatibility events at native paywall mount. Do not add them to `mc_paywall_rendered` counts: they represent the same step.

| AppsFlyer event | Meaning |
| --- | --- |
| `mc_app_launched` | One app launch per JS process, after local content and telemetry initialization settle |
| `mc_subscription_status_checked` | First verified access snapshot this process, then changes; active access is not proof of payment |
| `mc_subscription_check_failed` | RevenueCat configuration or customer-info lookup failed |
| `mc_paywall_requested` | App requests plans; source distinguishes automatic, subscribe button, and feature route |
| `mc_paywall_failed` | Missing offering, blocked free offer, offering fetch error, or React render failure |
| `mc_paywall_rendered` | Native paywall view mounted; not confirmation that remote content fully rendered |
| `mc_purchase_started` | RevenueCat invokes purchase-start callback, with product and package type |
| `mc_purchase_cancelled` | Store purchase cancelled; paywall remains available for retry |
| `mc_purchase_failed` | Purchase failed, with SDK numeric error code; no raw message |
| `mc_purchase_completed` | Client store operation completed; includes access/environment, is not authoritative revenue |
| `mc_paywall_dismissed` | Paywall closed without a successful access-unlocking purchase/restore |
| `mc_restore_started/completed/failed` | Restore path; completed with `access=inactive` means nothing was restored |

All commerce events carry `schemaVersion=2`, release channel/runtime/update metadata, and known access state. An active entitlement supplies `storeEnvironment=sandbox/production`, period type, and ownership type; without one, environment is **unknown**, never assumed production. TestFlight can use the production EAS channel. No client attribute alone establishes payment or reliably identifies an unpaid tester. Debug builds suppress these custom AppsFlyer events; existing SDK install/session auto-events are separate. Register test devices in AppsFlyer and exclude them when evaluating acquisition. Use preview builds for routine QA; exclude `buildChannel=preview/development` and known sandbox events when querying custom-event data.

Only explicit commerce fields pass the marketing payload allowlist. Do not add health entries, profile answers, onboarding answers, route names, customer IDs, receipts, or free-text error messages. Generic onboarding/check-in/report events remain Observe-only. Onboarding starts after content is available behind the entitlement gate, and reopening the stage sheet no longer counts as another completion.

### Reports to configure after deployment

Use **Activity** event dates, identical UTC date ranges, and unique users rather than event totals for conversion. Attempts can repeat; funnel counts must use ordered events for the same anonymous user, not ratios of unrelated totals. AppsFlyer aggregation and plan limitations may require an event export for the ordered funnel.

1. Acquisition: installs and active users, explicitly labelled as app activity.
2. Paywall: unique requested → rendered → purchase started, then cancelled/failed/completed; break down failures by reason/code and release. A killed process produces no dismissal event; never infer a cancellation solely from a missing completion.
3. Paid customers and revenue: RevenueCat **production** active subscriptions and initial paid purchases. Exclude sandbox, trial, complimentary/promotional access, and distinguish family-shared access. Restores and `mc_purchase_completed` are not new paying customers.
4. Connect RevenueCat's AppsFlyer server integration for initial purchases, renewals, refunds, expirations, and billing issues. Verify production delivery logs and the linked AppsFlyer ID. Keep sandbox delivery disabled for the production destination or route it separately. Do not also emit `af_purchase`/`af_revenue` from this client. On September 5, 2026, the MenoCompass integrations page showed AppsFlyer and Meta Ads **Active**. That confirms configured integrations, not successful event delivery; production delivery and sandbox routing still require verification.

Observed production baseline on September 5, 2026: RevenueCat project `50953eca`, sandbox switch off, **0 active subscriptions, $0 MRR, $0 revenue (last 28 days), no live transactions**. Its 33 active customer records in that period are not paying subscribers. AppsFlyer's 12 active users for August 6–September 4 use a different date range and definition and must not be equated with either RevenueCat customer records or subscribers.

Validate on a physical iPhone before release: both ATT choices; slow/offline analytics; no offering; purchase cancel then retry; store error; sandbox purchase; empty restore; existing-subscriber restore; entitlement revocation; app lock. Each completed operation should have one matching client result and, when configured, one authoritative RevenueCat server event. Never make a real purchase merely to test tracking. Confirm the exact runtime/update in AppsFlyer and Observe after publishing. These changes require shipping the mobile bundle; committing them does not change live measurements or backfill missing history.

Reference: [RevenueCat AppsFlyer integration](https://www.revenuecat.com/docs/integrations/attribution/appsflyer) and [RevenueCat event environments](https://www.revenuecat.com/docs/integrations/webhooks/event-types-and-fields).

### Implementation validation, September 5, 2026

- TypeScript check passed; 29 mobile contract tests (including 8 commerce behavior tests) and 3 TikTok tests passed.
- Commerce tests exercise payload privacy, sandbox and family/trial classification, cancellation/retry, purchase and restore access gating, duplicate callbacks, queued pre-initialization events, SDK timeouts/recovery, and synchronous analytics failures.
- The full browser suite stalled with bundled Chromium. Retrying using installed Chrome passed onboarding, tool access, check-in, and reconfirmation, then timed out at `Save medication` in `test.js:317`. The full browser suite is not recorded as passing.
- Native StoreKit/RevenueCat UI callbacks and live destination receipt still require physical-device verification and a mobile release. No mobile OTA or App Store release was published as part of this change.
