# peri 1.2.2 privacy disclosures

Release declaration rationale based on the current implementation and configured RevenueCat-to-AppsFlyer attribution. This records intended App Store Connect answers, not confirmation that they were published or that physical-device payload checks passed.

| Data type | Purposes | Linked | Tracking |
|---|---|---|---|
| Device ID | App Functionality; Analytics; Developer's Advertising or Marketing; retain existing Third-Party Advertising | Yes | Yes |
| User ID | App Functionality; Analytics; Developer's Advertising or Marketing | Yes | Yes |
| Purchase History | App Functionality; Analytics; Developer's Advertising or Marketing | Yes | Yes |
| Product Interaction | Analytics; Developer's Advertising or Marketing | Yes | Yes |
| Crash Data | App Functionality | No | No |
| Performance Data | App Functionality; Analytics | Yes | No |
| Other Diagnostic Data | App Functionality; Analytics | Yes | No |
| Other Data Types | Analytics | Yes | No |

Keep any additional existing advertising purposes required by older distributed builds or partner processing until superseded and verified. The table separates linkage from advertising tracking; a persistent identifier can link analytics without being used for advertising.

## Implementation evidence

- `analytics-transport.ts` stores an installation credential in SecureStore and derives a persistent `peri_...` pseudonym. `posthog.native.ts` passes that value to `identify`; replay and API events share session IDs. Masking removes screen content, not this association.
- `telemetry.native.ts` sends permitted onboarding, paywall, and checkout interactions to AppsFlyer only after ATT is granted. RevenueCat receives the AppsFlyer identifier for advertising purchase attribution. RevenueCat's documented delivery includes both `customer_user_id` and `appsflyer_id`, so an anonymous customer label does not establish that the attributed purchases are unlinked.
- Observe logs include the same analytics/replay session context. The installed Observe SDK associates logs and performance metrics with its native session ID, allowing metrics and diagnostic logs to join to pseudonymous analytics. Performance and Other Diagnostic Data therefore cannot be described as unlinked. Their native manifest linkage flags are true.
- Sentry's configured crash filtering removes user, request, breadcrumb, and arbitrary context fields, and automatic session tracking is disabled. Crash Data retains its current unlinked classification; no advertising use is shown. This is source/configuration evidence, not a claim that raw native crash payloads were verified on the release device.
- Masked taps, scrolling, and interface activity fit Product Interaction. Keep the existing Other Data Types category for replay/context and legacy coverage pending a complete category audit; do not characterize that pseudonym-associated data as unlinked. Masked replay alone does not establish collection of the user's Photos/Videos, health answers, or other user content.

## Definition sources

Apple includes assigned user/customer identifiers within User ID, distinguishes device/account linkage from advertising tracking, and requires ongoing opt-in collection to be disclosed. Its Developer's Advertising or Marketing purpose includes sharing data with entities displaying the developer's ads. See [App privacy details](https://developer.apple.com/app-store/app-privacy-details/) and [privacy definitions](https://apps.apple.com/us/story/id1539235847).

The identifier and purchase-delivery evidence is documented in [RevenueCat's AppsFlyer delivery reference](https://www.revenuecat.com/docs/integrations/attribution/reference/appsflyer). RevenueCat's generic anonymous-ID guidance is conditional; the cross-provider advertising linkage here must be considered separately.
