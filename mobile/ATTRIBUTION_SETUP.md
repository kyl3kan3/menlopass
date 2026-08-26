# Attribution and app observability setup

The native app now uses:

- Expo Observe for app performance and explicitly defined product events.
- AppsFlyer for install attribution and deep links.
- Meta App Events for Facebook and Instagram campaign measurement.
- Apple's App Tracking Transparency prompt before advertising identifiers are enabled.
- RevenueCat as the source of subscription lifecycle and revenue events. The client does not duplicate purchase revenue events in AppsFlyer or Meta.
- RevenueCat's random anonymous App User ID as the optional AppsFlyer customer ID. MenoCompass has no login identity, and no name, email address, phone number, or health value is used as a customer ID.

Health entries, medications, labs, notes, reports, and other free-form user content must never be added to these events.

## Required build values

Set these values in the EAS `production` environment before creating a production build:

- `EXPO_PUBLIC_APPSFLYER_DEV_KEY`
- `EXPO_PUBLIC_META_APP_ID`
- `EXPO_PUBLIC_META_CLIENT_TOKEN`
- `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`

Use `mobile/.env.example` for local development. Production configuration intentionally fails early if the AppsFlyer or Meta values are absent.

## Dashboard configuration

1. In AppsFlyer, create or select the iOS app with bundle ID `com.kyl3kan3.menlopass` and Apple app ID `6798018790`. AppsFlyer displays this as `id6798018790`, but the SDK receives it without the `id` prefix. Copy its developer key into the EAS environment.
2. In Meta for Developers, add the iOS platform to the Meta app, set the same bundle ID, and copy the App ID and client token into EAS.
3. In RevenueCat, enable its AppsFlyer and Meta integrations for server-to-server subscription attribution. Keep automatic Meta purchase logging disabled in the app so revenue is not counted twice.
4. Update App Store Connect privacy answers before submitting the new build. The native app now collects limited performance, product-usage, and attribution identifiers; it does not send health-journal content.
5. Publish the revised privacy policy from `privacy.html` before the new build is reviewed.

## Device verification

A development or production build is required because these SDKs contain native code and do not run in Expo Go. Test on a physical iPhone with a fresh install:

1. Verify both Allow and Ask App Not to Track paths.
2. Confirm the app still opens and subscriptions work when permission is denied.
3. Confirm an install/session and `af_content_view` arrive in AppsFlyer.
4. Confirm `fb_mobile_activate_app` and `fb_mobile_content_view` arrive in Meta Events Manager.
5. Confirm RevenueCat receives the AppsFlyer identifier and, only after authorization, the Meta anonymous identifier.
6. Complete a sandbox purchase and confirm RevenueCat forwards one subscription/revenue event to each configured destination.
