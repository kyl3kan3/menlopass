# Subscription setup (peri 2.0)

The iOS app has no hard paywall. The page, the ledger, the night desk, Right now, the index and
the first-page letter work without a purchase. **peri Pro** (the RevenueCat entitlement
`MenoCompass Pro`) unlocks the Dossier tab, the one-page brief, the treatment check-ins and the
rehearsal. The web app locks those surfaces when `__MENO_PRO_ACTIVE__` is not `true` and posts
`open-pro-paywall`; the shell opens the RevenueCat paywall in response.

When the paywall appears:

1. Once, after the letter is finished (`onboarding-finished`), while the first finding is on the
   page behind it. Source `automatic`. "Not now" puts it down; nothing else happens that session.
2. Whenever the dossier or the brief asks for it (`open-pro-paywall`, source `feature`).
3. Never on launch, never before the letter, never as a gate in front of the WebView.

"Already subscribed? Restore" on the lock panel posts `restore-purchases`; the shell calls
`Purchases.restorePurchases()` and reports the result in an alert. Restore recovers an Apple
subscription, not a local record.

## RevenueCat

1. Keep `MenoCompass Pro` as the entitlement identifier; this value is case-sensitive.
2. Attach both the monthly and annual App Store products to that entitlement.
3. Put those packages in the current offering and attach the production paywall.
4. Include localized price, billing period, automatic-renewal disclosure, restore purchases,
   Privacy and Terms in the RevenueCat paywall. Design it in the dashboard to the app's system:
   paper `#fbfbf9`, ink `#0c0c0d`, vermilion `#d13a16` for the one button, a serif headline, no
   illustration. The shell draws the masthead ("peri Pro · The dossier, the brief, the treatment
   check-ins" and "Not now") above the RevenueCat view and hides the SDK's own close button.
5. Disable exit offers and other discount paths so dismissing the paywall cannot present a free or
   discounted alternative.

## App Store Connect: no trial or free offer

Apple applies an eligible introductory offer automatically during purchase, so client code cannot
convert a trial-bearing product into an immediate-charge purchase. For every monthly and annual
product:

1. Delete every introductory offer, including scheduled offers.
2. Remove any zero-price promotional, win-back or offer-code configuration.
3. Confirm the base subscription price is active in every intended storefront.
4. Wait for App Store propagation, then refresh the RevenueCat products and paywall.

The app fails closed if RevenueCat reports a zero-price introductory or promotional offer (the
paywall is not shown and an issue is recorded), but the dashboard must still be corrected.

## Release verification

Test on physical devices with fresh sandbox accounts:

1. A new install opens the consent choice, then the letter. Filling the blanks and tapping "Open
   today's page" shows Today with the stage finding; the paywall appears over it and "Not now"
   returns to the page. No health entry is created by the letter.
2. Log, Close the day, the night desk (set the clock after 22:00), Right now and the Index all work
   without a purchase.
3. Opening the Dossier shows the lock panel. "Unlock peri Pro" opens the paywall; the Apple sheet
   shows an immediate charge and no trial language for both plans. Cancelling returns to the lock
   panel with the free surfaces intact.
4. A successful purchase unlocks the Dossier and the brief in place (no reload). "Export the
   one-page brief" shares a PDF.
5. Restore purchases unlocks an existing subscriber and leaves a non-subscriber locked, with the
   alert saying which.
6. Expiration, refund or entitlement revocation locks the Dossier again without deleting any
   device-local data; the page and the ledger keep working.
7. Offline launch: the page works; the Dossier unlocks only when RevenueCat returns a valid cached
   active entitlement.
8. Verify VoiceOver, Dynamic Type, small iPhone and iPad layouts, unavailable offerings, repeated
   purchase taps and revocation during a session before publishing.

## Funnel measurement

The letter emits `onboarding_started`, `onboarding_step_viewed`, `onboarding_step_left` and
`onboarding_completed` with `flowVersion: 4` and `surface: web`. The paywall emits
`paywall_requested` / `paywall_rendered` / `paywall_dismissed` with `source: automatic` (after the
letter) or `feature` (from the dossier or the brief), then the purchase and restore events. Compare
new installs through letter → first finding → first `checkin_confirmed` → dossier opened → purchase.
No new SDKs, permissions, introductory offers or product-price changes are part of 2.0.
