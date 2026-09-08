# Tracking verification — MenoCompass 1.2.1

Candidate: build 33, EAS build `b233df60-c526-4b14-8e1e-058f5f10529d`, native runtime `1.2.0-native-2`. Record the installed build and update ID before testing. The current public 1.2.0/build 30 is a different binary.

Automated results and destination configuration are in [the release evidence](TRACKING_RELEASE_2026-09-08.md). The device checks below have **not** been performed from this Windows workspace.

| Check | Expected evidence | Device result |
|---|---|---|
| Fresh install, ATT Allow | One permission resolution; AppsFlyer session; Meta activation; TikTok launch. RevenueCat receives permitted attribution identifiers. | Not run |
| Fresh install, ATT Ask App Not to Track | App remains usable; no pre-decision marketing initialization or IDFA use. RevenueCat's direct Meta forwarding remains gated. | Not run |
| App ready | Observe first-render/interactive timing corresponds to the usable gate/lock screen or rendered content, rather than an early WebView load callback. | Not run |
| Product flow | PostHog `menocompass.screen_viewed`, onboarding, confirmed check-in and report events contain only allowed properties. Raw health values, notes, names and report contents are absent. | Not run |
| Paywall and cancel/retry | Each destination receives one matching `mc_*` result per completed operation. Client completion is not counted as paid subscription revenue. | Not run |
| Offline launch and reconnect | App access is not held indefinitely by analytics. PostHog's encrypted queue survives restart and drains on reconnection; no duplicate replay. Marketing pre-initialization buffers are memory-only. | Not run |
| Sandbox purchase and restore | RevenueCat entitlement updates correctly. Restore does not create a new purchase. Production server destinations have blank sandbox credentials and must not receive sandbox revenue. | Not run |
| Sanitized WebView error | Observe receives a fixed error type and bounded line/column, without the original message, stack, URL or private content. | Not run |
| OTA adoption | Build 33 downloads the production update, adopts it on a subsequent launch, and reports the exact update ID. Existing native-1 builds do not receive it. | Not run |
| OTA recovery | On a dedicated test device/channel, a known-good compatible update can be restored. Do not publish an intentionally broken production update to test this. | Not run |

After a genuine production subscription occurs, inspect RevenueCat's delivery logs and confirm one authoritative server event per lifecycle event: PostHog directly, Meta directly through CAPI, AppsFlyer directly, and TikTok through AppsFlyer. Do not make a real purchase solely to produce tracking evidence. Trials, restores, family sharing and sandbox access are not new paid customers.

PostHog transport probes use `validation=true` and anonymous ID `menocompass-release-validation`; exclude them from acquisition and revenue reporting. No automated probe simulates a purchase or install.
