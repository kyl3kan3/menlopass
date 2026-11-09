# App Review notes — peri 2.0.0

Sign-in required: No. No demo account is needed. Use the existing App Store Connect review contact. Select the 2.0.0 build (build 47) for this submission.

## Paste into the Notes field

peri is a device-local menopause and perimenopause record. It has no account or login and no cloud health database. Entries, medications, labs, notes, Apple Health summaries and the printable brief stay on the device unless the user exports them. The local record is encrypted with a device-bound key; portable backups are password protected.

2.0 is a redesign of the whole app on the same record. The native setup preview from 1.2 is gone: the first page is a one-page letter inside the app, and the main interface opens without a purchase.

Review path on a fresh install:
1. Choose “Continue without analytics” or “Allow optional analytics” on “Help improve peri?”. Both choices give the same features. Apple's ATT prompt is separate; declining it removes nothing.
2. Fill in the letter (what has been hardest, what periods are doing, age, whether an appointment is coming) and tap “Open today’s page”. The letter writes preferences and the staging estimate only; it creates no health entries.
3. The subscription sheet appears once after the letter and can be put down with “Not now”. Today, the ledger (Log), Close the day, the night desk, Right now and the Index are free and work without any purchase.
4. peri Pro (auto-renewable monthly or annual, through RevenueCat and StoreKit) unlocks the Dossier tab and the one-page brief. Opening the Dossier without an entitlement shows an in-app notice with “Unlock peri Pro” and “Already subscribed? Restore”. Purchase in Apple's review sandbox, or use Restore Purchases for an existing subscription. Cancelling the purchase leaves the free surfaces working and the dossier locked. Restore recovers an Apple subscription, not a local health record. Privacy and Terms are linked from the paywall and from You.
5. Primary navigation is Today, Dossier and Index in the bottom bar. You (profile and settings) is the person icon at the top right.

You includes Manage Apple subscription, Delete everything, export and restore, App Lock, reminders, Apple Health, analytics preferences and an analytics deletion request. Deleting local health data and cancelling the subscription are separate actions. Notification permission is requested only when a reminder is turned on. Apple Health access is user-initiated and read-only for steps, sleep and body weight, with no background delivery or writing. Widgets and App Shortcuts carry only whether today has a page and how many of the last seven days are on record.

Optional analytics starts off until the disclosure is accepted. Opt-in permits allowlisted feature-use events to peri's API, filtered product events to PostHog, and performance and sanitized errors to Expo Observe. There is no session recording anywhere in 2.0. Health entries, answers, notes and the brief are never sent. Users can change the choice or request analytics deletion under You; provider deletion is asynchronous.

Only granted ATT permission permits AppsFlyer advertising attribution. There is no direct Meta or TikTok SDK in this runtime. Attribution events exclude health content. Configured production builds send sanitized Sentry crash diagnostics separately from optional analytics; screenshots, view hierarchies, replay, tracing and profiling are disabled.

peri provides general health education and self-tracking. It does not diagnose, prescribe, or replace qualified care.

## Submission attachments

- Screenshots: regenerate from the 2.0 build (`npm run shots` for the web captures, then the store composer) before upload; the 1.2 screenshots show the previous design.
- App Privacy answers are unchanged from 1.2.2 except session replay, which is now "not collected".
- The App Store Connect subscription group and prices are unchanged. Remove any introductory free offer: the app refuses to show a paywall that contains one.
