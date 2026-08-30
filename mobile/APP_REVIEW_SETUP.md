# App Store review prompt

MenoCompass asks iOS StoreKit for an in-app review prompt after cold app openings 2, 5, and 20. The launch count and completed attempts are stored in `menocompass-review-state.json`, separately from health data and independently of web storage.

An attempt waits until all of the following are true:

- the customer has an active MenoCompass Pro entitlement;
- onboarding has been completed or explicitly deferred;
- the main app has loaded; and
- the ATT permission dialog was not shown during the same app session.

Apple does not report whether the customer rated, dismissed, or declined the prompt. The app therefore schedules StoreKit requests at all three milestones; StoreKit decides whether to display them and suppresses inappropriate or over-quota requests. This also means a request being recorded does not prove that the system dialog appeared.

The review dialog does not appear in TestFlight. Validate the surrounding timing and UI in a release-candidate build, then use an App Store-distributed build to validate the system-controlled dialog. The configured App Store URL is `https://apps.apple.com/app/id6798018790`.
