# Attribution and app observability setup

The native app now uses:

- Expo Observe for app performance and explicitly defined product events.
- AppsFlyer for install attribution and deep links.
- Meta App Events for Facebook and Instagram campaign measurement.
- TikTok App Events SDK for TikTok install, launch, and retention measurement.
- Apple's App Tracking Transparency prompt before advertising identifiers are enabled.
- RevenueCat as the source of subscription lifecycle and revenue events. The client does not duplicate purchase revenue events in AppsFlyer, Meta, or TikTok.
- RevenueCat's random anonymous App User ID as the optional AppsFlyer customer ID. MenoCompass has no login identity, and no name, email address, phone number, or health value is used as a customer ID.

On iOS, RevenueCat is configured first so its anonymous App User ID is available to the attribution SDKs. AppsFlyer and Meta then initialize, the ATT decision resolves, and only after that may the automatic hard paywall open. This ordering ensures first-time install, activation, and paywall-view signals are available without sending health-journal content or duplicating subscription revenue events.

Health entries, medications, labs, notes, reports, and other free-form user content must never be added to these events.

## Required build values

Set these values in the EAS `production` environment before creating a production build:

- `EXPO_PUBLIC_APPSFLYER_DEV_KEY`
- `EXPO_PUBLIC_META_APP_ID`
- `EXPO_PUBLIC_META_CLIENT_TOKEN`
- `TIKTOK_APP_SECRET` (an EAS secret; never use an `EXPO_PUBLIC_` name)
- `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`

The TikTok App ID defaults to Apple app ID `6798018790`, and the TikTok Business App ID defaults to `7679768878880178197`. Override them with `TIKTOK_APP_ID` and `TIKTOK_BUSINESS_APP_ID` only if TikTok issues replacements. Use `mobile/.env.example` for local development. Production configuration intentionally fails early if the AppsFlyer, Meta, or TikTok secret values are absent.

The TikTok SDK is linked through CocoaPods by the local Expo module in `mobile/modules/menocompass-tiktok-business`. Its podspec pins `TikTokBusinessSDK` 1.7.2 and applies `-ObjC` and `-lc++` to the app target. EAS Build runs CocoaPods after Expo prebuild; do not add or maintain a generated `ios/Podfile` in this repository.

The SDK delays its first flush for 60 seconds so the existing ATT prompt can resolve. It auto-logs install, launch, and two-day retention only. TikTok automatic StoreKit purchase tracking and enhanced UIKit data collection are disabled. TikTok SKAdNetwork updates are also disabled because AppsFlyer is the app's single conversion-value writer.

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
