# Hard-paywall subscription setup

The iOS app requires the RevenueCat entitlement `MenoCompass Pro` before it mounts or displays any app content. A user who dismisses the paywall, has an expired entitlement, or cannot be verified remains on the subscription gate with access only to purchase, restore, Privacy, and Terms actions.

## RevenueCat

1. Keep `MenoCompass Pro` as the entitlement identifier; this value is case-sensitive.
2. Attach both the monthly and annual App Store products to that entitlement.
3. Put those packages in the current offering and attach the production paywall.
4. Include localized price, billing period, automatic-renewal disclosure, restore purchases, Privacy, and Terms in the RevenueCat paywall.
5. Do not configure a close button as an escape route. The app also invokes the paywall with `displayCloseButton: false` and keeps its own gate in place if the sheet is dismissed by the system.
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

1. A new install opens the paywall automatically and cannot reach onboarding or any health feature without purchasing.
2. The Apple confirmation sheet shows an immediate charge and no trial language for both monthly and annual plans.
3. Dismissing the purchase sheet or paywall leaves the subscription gate visible.
4. A successful purchase unlocks the complete app immediately.
5. Restore purchases unlocks an existing subscriber and leaves a non-subscriber locked.
6. Expiration, refund, or entitlement revocation returns the user to the gate without deleting device-local health data.
7. Offline launch unlocks only when RevenueCat can return a valid cached active entitlement; an unverifiable non-subscriber remains locked.
