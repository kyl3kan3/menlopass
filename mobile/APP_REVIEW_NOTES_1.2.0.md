# App Review notes — MenoCompass 1.2.0

This is the versioned source for the App Store Connect **App Review Information** fields for MenoCompass 1.2.0. Replace bracketed build/contact placeholders before submission. Keep credentials out of this file.

## App Store Connect fields

- **Version:** 1.2.0
- **Build:** `[App Store Connect build number]`
- **Sign-in required:** No
- **Demo account:** Not applicable. MenoCompass has no account, login, cloud health database, or social features.
- **Review contact:** `[name, international-format phone number, and email]`

## Paste into the Notes field

MenoCompass is a device-local menopause tracker. It has no account, login, demo account, or cloud health database. Health entries, medications, labs, notes, Apple Health summaries, reports, and backups remain on-device. The native record uses a device-bound encryption key; portable backups are password protected.

On a fresh install, ATT may appear before the subscription paywall. AppsFlyer and Meta wait for that decision. TikTok is not initialized until ATT is resolved, and its native guard rejects `.notDetermined`. Denial removes no feature. Attribution never contains health or free-text values.

An active monthly or annual RevenueCat subscription is required before health content mounts; there is no free tier or trial. App Review may use either plan in Apple's sandbox. Canceling/dismissing purchase leaves the gate in place. **Restore Purchases**, Privacy, and Terms are available on that gate. Restore recovers the reviewer's Apple subscription, not device-local health data.

After purchase, complete onboarding. Primary navigation is **Today** (check-in/tools), **Journey** (confirmed history/patterns), **Care** (treatments, labs, appointments, reports), and **Guide** (evidence library). **Profile** is the top-right person control. On iOS 26 the primary bar uses native Liquid Glass; earlier iOS and Reduce Transparency receive an opaque high-contrast fallback.

In Profile, **Manage Apple subscription** opens Apple's management page. **Account & data > Delete app profile & data** permanently removes the local record after confirmation; subscription cancellation is separate. Reset onboarding preserves health history. Backup/restore, App Lock, reminders, and read-only Apple Health are also in Profile.

Notification permission is requested only after a reminder is enabled; locally scheduled text is generic. Apple Health access is user-initiated, read-only steps/sleep/body weight, and has no background delivery. Widgets and App Shortcuts expose only privacy-safe completion/count or destination information.

Expo Observe receives startup/interactive measurements and safe route/product events. Sentry receives release-tagged crash diagnostics. Sentry tracing, replay, screenshots, view hierarchy, failed requests, default PII, messages, exception values, requests, users, and extras are disabled/removed. Neither service receives health entries, Apple Health values, answers, notes, medication/lab content, report text, or other free-form health data.

MenoCompass provides general health education and self-tracking. It does not diagnose, prescribe, or replace qualified care.

## Submission attachments

Attach evidence where App Store Connect permits it, without including real health information:

- Screenshot of the pre-purchase subscription gate showing Restore Purchases, Privacy, and Terms.
- Screenshot of the RevenueCat paywall showing the localized monthly and annual prices and no trial language.
- Screenshot of Profile showing Manage Apple subscription and Account & data.
- Screenshot of Profile showing the in-context reminder, App Lock, and read-only Apple Health controls.
- Screenshot of both privacy-safe Home Screen widgets and their opened destinations.
- Completed `RELEASE_QA_1.2.0.md` or an exported signed copy.

## Pre-submission verification

- [ ] Replace the build and contact placeholders above.
- [ ] Confirm the selected build is the same build recorded in `RELEASE_QA_1.2.0.md`.
- [ ] Confirm both plans are available in Apple's review sandbox and have no introductory, promotional, or win-back free period.
- [ ] Confirm the public Privacy, Support, and Terms pages match the 1.2.0 navigation and diagnostics described above.
- [ ] Confirm App Store Connect does not declare device-only Apple Health values as collected, while SDK diagnostics, identifiers, attribution, and purchase data are fully declared; keep Apple Health access described in the policy and review notes.
- [ ] Paste the Notes section into App Store Connect and set **Sign-in required** to **No**.
