# App Store review prompt

MenoCompass asks iOS StoreKit for an in-app review prompt after successful confirmed-check-in milestones 2, 5, and 20. A cold launch alone never advances the review schedule. The successful-moment count and completed StoreKit request attempts are stored in `menocompass-review-state.json`, separately from health data and independently of web storage.

State written by the former launch-count implementation is migrated without repeating milestones that already requested StoreKit. Historical launch counts do not become successful moments.

An attempt waits until all of the following are true:

- the customer has an active MenoCompass Pro entitlement;
- onboarding has been completed or explicitly deferred;
- the main app has loaded; and
- the ATT permission dialog was not shown during the same app session.

The request is delayed briefly after the confirmed check-in so it follows the completed success moment rather than interrupting data entry. Apple does not report whether the customer rated, dismissed, or declined the prompt. The app therefore schedules StoreKit requests at all three milestones; StoreKit decides whether to display them and suppresses inappropriate or over-quota requests. This also means a request being recorded does not prove that the system dialog appeared.

The review dialog does not appear in TestFlight. Validate the surrounding timing and UI in a release-candidate build, then use an App Store-distributed build to validate the system-controlled dialog. The configured App Store URL is `https://apps.apple.com/app/id6798018790`.

## Apple subscription management

Active customers can open Profile and select **Manage Apple subscription**. The native shell opens Apple's subscription-management page at `https://apps.apple.com/account/subscriptions`; the app does not attempt to cancel or alter the subscription itself. The delete-data confirmation separately explains that deleting local app data does not cancel an Apple subscription.
