# Hard-paywall subscription setup

The iOS app offers a native, four-step setup preview before purchase: welcome, concerns, goal, and personal starting focus. It stores only setup preferences in the existing encrypted device-local record; it does not create ratings or confirmed check-ins. The RevenueCat entitlement `MenoCompass Pro` is still required before the health-record WebView mounts.

New users can return from the paywall to their saved preview. Existing users who have finished their first check-in return to the subscription gate when their entitlement expires or cannot be verified. Neither dismissing a paywall nor completing a preview unlocks health features. Restore, Privacy, and Terms are available during setup.

## RevenueCat

1. Keep `MenoCompass Pro` as the entitlement identifier; this value is case-sensitive.
2. Attach both the monthly and annual App Store products to that entitlement.
3. Put those packages in the current offering and attach the production paywall.
4. Include localized price, billing period, automatic-renewal disclosure, restore purchases, Privacy, and Terms in the RevenueCat paywall.
5. The app enables paywall dismissal for the onboarding preview and includes its own **Back to my preview** control, since RevenueCat V2 ignores `displayCloseButton`. Dismissal returns to setup preferences, never health content. Returning customers without an active subscription remain gated. The embedded view supplies separate purchase-start, cancellation, error, completion, and restore callbacks for measurement.
6. Disable RevenueCat exit offers and other discount paths so dismissing the main paywall cannot present a free or discounted alternative.

## App Store Connect: no trial or free offer

Apple applies an eligible introductory offer automatically during purchase, so client code cannot convert a trial-bearing product into an immediate-charge purchase. For every monthly and annual product:

1. Open the subscription's pricing page and delete every introductory offer, including scheduled offers.
2. Remove any zero-price promotional, win-back, or offer-code configuration if the product must never provide free access.
3. Confirm the base subscription price is active in every intended storefront.
4. Wait for App Store propagation, then refresh the RevenueCat products and paywall.

The app fails closed if RevenueCat reports a zero-price introductory or promotional offer, but the dashboard configuration must still be corrected before release.

## Release verification

Test on physical devices with fresh sandbox accounts:

1. A new install opens the native setup preview. Selecting one concern works, progress survives relaunch, and **View subscription plans** opens the offering only after the setup is saved securely. No health entry is created by the preview.
2. The Apple confirmation sheet shows an immediate charge and no trial language for both monthly and annual plans.
3. Canceling the purchase sheet leaves the offer available; **Back to my preview** returns to the saved summary. Relaunching also preserves that summary. Neither path unlocks health features. A failed secure save must prevent moving into purchase.
4. A successful purchase opens the first real check-in with the chosen concerns and no prefilled ratings. Confirming it displays the saved starting summary; optional profile details remain in Profile. Existing subscribers keep their records and regular entry routes.
5. Restore purchases unlocks an existing subscriber and leaves a non-subscriber locked.
6. Expiration, refund, or entitlement revocation returns the user to the gate without deleting device-local health data.
7. Offline launch unlocks only when RevenueCat can return a valid cached active entitlement; an unverifiable non-subscriber remains locked.
8. Verify VoiceOver, Dynamic Type, reduced motion, small iPhone and iPad layouts, unavailable offerings, repeated purchase taps, restore without an entitlement, and revocation during a session on physical devices before publishing.

## Funnel measurement

Flow version 2 emits `onboarding_started`, actual `onboarding_step_viewed` entries (including Back and resume), `onboarding_step_left` with bounded `durationMs`, and `onboarding_completed`. Completion now precedes the first offer for new iOS users; use `flowVersion: 2` and `surface: native_preview` to distinguish it from historical post-purchase onboarding. Returning to a saved preview is a new session entry, not a new acquisition. Web onboarding emits `surface: web`. The explicit property allowlist excludes selected concerns, goals, names and health answers.

Compare first-time users through preview → paywall → purchase → `checkin_confirmed`, and distinguish `skipped` completions on the web. The implementation supplies instrumentation, not a randomized experiment or evidence of conversion lift. There are no new SDKs, permissions, introductory offers, product-price changes or remote RevenueCat configuration changes in this implementation.
