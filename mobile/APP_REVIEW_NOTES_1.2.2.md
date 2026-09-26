# App Review notes — peri 1.2.2

Sign-in required: No. No demo account is needed. Use the existing App Store Connect review contact. Select the new 1.2.2 build for this submission.

## Paste into the Notes field

peri is a device-local menopause and perimenopause tracker. No account or login is required, and there is no cloud health database. Health entries, medications, labs, notes, Apple Health summaries, and reports remain on-device unless the user exports them. The local record is encrypted with a device-bound key; portable backups are password protected.

This release includes a startup reliability correction, optional analytics controls, and a native setup preview before purchase.

Review path on a fresh install:
1. Choose either “Continue without analytics” or “Allow optional analytics” on “Help improve peri?”. Both choices retain the same subscription and app features. Apple's ATT prompt is separate; declining it also removes no feature.
2. Complete the four-step setup preview, or choose “Use a starter check-in”, then “View subscription plans”. Setup saves preferences only; it creates no symptom ratings or confirmed check-ins.
3. Choose a monthly or annual plan using Apple's review sandbox, or use “Restore purchases” for an existing subscription. An active RevenueCat entitlement is required before the health-record interface opens. There is no free tier or free trial. Canceling purchase or returning to the preview does not unlock health features. Restore recovers an Apple subscription, not a local health record. Privacy and Terms are available before purchase.
4. After subscribing, save a first check-in. Primary navigation is Today, Journey, Care, and Guide. Profile is the person control at the top right.

Profile includes Manage Apple subscription, local data deletion, backup/restore, App Lock, reminders, Apple Health, analytics preferences, and an analytics deletion request. Local health-data deletion and subscription cancellation are separate actions. Notification permission is requested only when a reminder is enabled. Apple Health access is user-initiated and read-only for steps, sleep, and body weight, with no background delivery or writing. Widgets and App Shortcuts contain only limited completion/count or destination information.

Optional analytics starts off until the current disclosure is accepted. Opt-in permits allowlisted feature-use events to peri's API/database, filtered product events to PostHog, performance and sanitized errors to Expo Observe, and masked recordings only while the native setup preview is visible. Text, images, inputs, and root content are masked; console and network recording are disabled. Health-record screens and the paywall are outside the recording gate. Health entries, answers, notes, and reports are excluded. Users can change the choice or request analytics deletion in Profile; provider deletion is asynchronous.

Only granted ATT permission permits AppsFlyer advertising attribution. There is no direct Meta or TikTok SDK in this runtime. Attribution events exclude health content. Configured production builds send sanitized Sentry crash diagnostics separately from optional analytics; screenshots, view hierarchies, replay, tracing, and profiling are disabled.

peri provides general health education and self-tracking. It does not diagnose, prescribe, or replace qualified care.
