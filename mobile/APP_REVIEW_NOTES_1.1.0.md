# App Review notes — MenoCompass 1.1.0

This is the versioned source for the App Store Connect **App Review Information** fields for MenoCompass 1.1.0. Replace bracketed build/contact placeholders before submission. Keep credentials out of this file.

## App Store Connect fields

- **Version:** 1.1.0
- **Build:** `[App Store Connect build number]`
- **Sign-in required:** No
- **Demo account:** Not applicable. MenoCompass has no account, login, cloud health database, or social features.
- **Review contact:** `[name, international-format phone number, and email]`

## Paste into the Notes field

MenoCompass is a local-only menopause symptom, treatment, and medication tracker. It has no login or demo account. Health entries, medications, labs, notes, questionnaire answers, reports, and backups remain on the device and are not sent to the developer or the attribution/analytics providers.

On a fresh iOS install, the Apple App Tracking Transparency dialog may appear before the subscription paywall. AppsFlyer and Meta initialization waits for the ATT decision. TikTok is not initialized until the app has resolved the ATT decision, and its native guard rejects initialization while iOS still reports the status as not determined. Denying tracking does not remove any app or subscription feature. Attribution events never contain health-entry or free-text values.

The app uses a hard RevenueCat paywall. An active monthly or annual MenoCompass subscription is required before health features are mounted. There is no free tier or free trial. App Review can select either plan using Apple's review sandbox. Dismissing the Apple purchase sheet or the RevenueCat paywall leaves the subscription gate in place.

Restore Purchases is visible on the subscription gate before purchase. It restores an active subscription associated with the reviewer's Apple ID; it does not restore device-local health entries. Privacy and Terms links are also available from this gate.

After access is active, **Profile > Manage Apple subscription** opens Apple's subscription-management page. Deleting the local app profile does not cancel the Apple subscription.

After purchase, complete the short onboarding flow. The main navigation is:

- **Today:** focused daily check-in and quick tools.
- **Journey:** confirmed symptom days, treatment changes, and observed patterns.
- **Care:** medications, lab results, and 30-, 90-, or 180-day clinician reports.
- **Guide:** searchable evidence-graded educational content.
- **Profile** (top-right person control): Manage Apple subscription, backup/restore, reset onboarding, and **Account & data > Delete app profile & data**.

Deleting the app profile permanently removes the device-local health record after confirmation. It does not cancel an Apple subscription. The app does not request notification permission in version 1.1.0.

The optional StoreKit rating request is tied to successful confirmed-check-in milestones 2, 5, and 20, not app launches. It is requested only after the success moment, while access and onboarding are active, and never in the same session that displayed ATT. StoreKit controls whether the system prompt appears; the prompt is not displayed in TestFlight.

MenoCompass provides general health education and self-tracking. It is not a medical device and does not diagnose, prescribe, or replace care from a qualified clinician.

## Submission attachments

Attach evidence where App Store Connect permits it, without including real health information:

- Screenshot of the pre-purchase subscription gate showing Restore Purchases, Privacy, and Terms.
- Screenshot of the RevenueCat paywall showing the localized monthly and annual prices and no trial language.
- Screenshot of Profile showing Manage Apple subscription and Account & data.
- Completed `RELEASE_QA_1.1.0.md` or an exported signed copy.

## Pre-submission verification

- [ ] Replace the build and contact placeholders above.
- [ ] Confirm the selected build is the same build recorded in `RELEASE_QA_1.1.0.md`.
- [ ] Confirm both plans are available in Apple's review sandbox and have no introductory, promotional, or win-back free period.
- [ ] Confirm the public Privacy, Support, and Terms pages match the 1.1.0 navigation described above.
- [ ] Paste the Notes section into App Store Connect and set **Sign-in required** to **No**.
