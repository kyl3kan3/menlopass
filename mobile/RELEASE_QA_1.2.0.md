# MenoCompass 1.2.0 release QA record

Use this as the evidence checklist for the exact production/TestFlight candidate submitted to App Review. A written plan is not a passing result: record the device, build, observed outcome, and evidence location for every required row. No internal signatures or initials are required.

## Candidate identity

| Field | Value |
|---|---|
| Marketing version | 1.2.0 |
| Git commit | `[full immutable commit SHA]` |
| GitHub Actions run | `[URL]` |
| EAS project | `@kyl3kan3/menlopass` |
| EAS build ID/URL | `[ID and URL]` |
| App Store Connect build | `[build number]` |
| TestFlight group | `[group]` |
| Build created (UTC) | `[YYYY-MM-DD HH:MM]` |
| QA started/completed (UTC) | `[timestamps]` |

The Git commit must be clean, pushed, and identical to the EAS build source. Do not sign this record for an uncommitted working tree.

## Result vocabulary

- **PASS:** observed on the recorded build and device, with evidence.
- **FAIL:** observed behavior does not meet the expected result.
- **BLOCKED:** test could not be completed; this is not release approval.
- **N/A:** the capability does not exist by product design and the rationale is recorded below.
- **WAIVED:** a known checklist exception explicitly recorded in the scope-decision section.

## Device matrix

Use physical devices for ATT and purchase testing. Simulator results may supplement, but not replace, the required rows.

| Class | Exact model | OS | Install state / Apple sandbox account | Physical? | Date | Evidence |
|---|---|---|---|---|---|---|
| Small iPhone | `[for example, iPhone SE]` | `[version]` | Fresh install / `[account alias]` | Yes |  |  |
| Pro Max iPhone | `[model]` | `[version]` | Fresh install / `[account alias]` | Yes |  |  |
| iPad (portrait + landscape) | `[model]` | `[version]` | Fresh install / `[account alias]` | Yes |  |  |

## Build and store artifact gates

| Test | Expected result | Result | Device/evidence | Date |
|---|---|---|---|---|
| Clean source provenance | Commit is pushed; GitHub CI passes; EAS build points to that commit and runtime `1.2.0-native-1` (isolated from the 1.1.0 native runtime) |  |  |  |
| Production configuration | Required AppsFlyer, Meta, TikTok, RevenueCat, and Sentry production values are present without logging secrets |  |  |  |
| Final Info.plist and entitlements | Bundle ID is `com.kyl3kan3.menlopass`; ATT, Face ID, and Health read purpose text; HealthKit entitlement; widget extension/app group; and required privacy manifests are present |  |  |  |
| Encryption export compliance | Complete Apple's questionnaire for the exact binary based on its CryptoKit AES-GCM, HMAC-SHA256/PBKDF2 backup protection, Keychain, and HTTPS use; attach any declaration Apple requires before review |  |  |  |
| English bundle declaration | Final archive declares English in `CFBundleLocalizations` |  |  |  |
| App icon | Final archive contains every required opaque iOS icon slot and the icon renders correctly on light/dark/tinted home screens |  |  |  |
| Launch screen | Production build shows the approved branded launch screen without the Expo placeholder |  |  |  |
| Store screenshots | Five iPhone images are 1242×2688 and five iPad images are 2048×2732, with no alpha and no copy contradictions |  |  |  |
| Public legal URLs | Privacy, Support, and Terms return 200 and describe the 1.2.0 Profile/Care/Journey navigation and diagnostics |  |  |  |
| App Review notes | `APP_REVIEW_NOTES_1.2.0.md` placeholders are replaced and its Notes section is in App Store Connect |  |  |  |
| Privacy/age/content-rights answers | App Store Connect answers match the submitted binary and licensed content |  |  |  |

## Install, ATT, and attribution

Repeat the first two paths with separate fresh installs because iOS does not show the ATT prompt again after a decision.

| Test | Expected result | Result | Device/evidence | Date |
|---|---|---|---|---|
| Fresh install — Allow | ATT appears before the automatic paywall; allowing proceeds normally |  |  |  |
| Fresh install — Ask App Not to Track | Denial proceeds normally and does not remove subscription/app features |  |  |  |
| ATT timing | AppsFlyer/Meta do not enable advertising identifiers before the ATT decision; JavaScript does not initialize TikTok until ATT resolves, and native code rejects `.notDetermined` |  |  |  |
| AppsFlyer | Install/session and `af_content_view` arrive without health or free-text values |  |  |  |
| Meta | Activation/content-view events arrive; advertising ID collection follows ATT |  |  |  |
| TikTok | No initialization or event occurs while ATT is `.notDetermined`; after resolution, expected install/launch events arrive in test-events mode without duplicate purchase revenue |  |  |  |
| RevenueCat attribution | AppsFlyer ID is attached; Meta anonymous ID is attached only when authorized |  |  |  |

## Subscription and restore matrix

Never use a personal production Apple ID for these tests. Record sandbox account aliases, not passwords.

| Test | Expected result | Result | Device/evidence | Date |
|---|---|---|---|---|
| Fresh non-subscriber launch | Health content never mounts before entitlement is active |  |  |  |
| Monthly purchase | Apple sheet shows immediate charge and no trial; success unlocks app immediately |  |  |  |
| Annual purchase | Apple sheet shows immediate charge and no trial; success unlocks app immediately |  |  |  |
| Cancel purchase sheet | Subscription gate remains; no content is exposed |  |  |  |
| Paywall dismissed/interrupted | Subscription gate remains; purchase, restore, Privacy, and Terms remain usable |  |  |  |
| Already subscribed | Existing active subscriber is recognized without a duplicate purchase |  |  |  |
| Restore on fresh install | Restore unlocks the same Apple ID's active subscription |  |  |  |
| Restore as non-subscriber | User remains locked and receives the expected no-purchase message |  |  |  |
| Manage Apple subscription | Profile action opens Apple's subscription-management page; returning to the app preserves state |  |  |  |
| Expiry/refund/revocation | Access returns to the gate without deleting local health data |  |  |  |
| Offline active subscriber | Valid cached active entitlement unlocks |  |  |  |
| Offline/unverifiable non-subscriber | App fails closed at the gate |  |  |  |
| Revenue event deduplication | Exactly one subscription/revenue event reaches each configured destination |  |  |  |

## Core, persistence, and navigation smoke test

Run on at least the small iPhone, Pro Max, and iPad.

| Test | Expected result | Result | Device/evidence | Date |
|---|---|---|---|---|
| Onboarding | Completes without clipped controls, keyboard obstruction, or unsafe-area overlap |  |  |  |
| Today | Confirm a daily check-in and relaunch; confirmed data persists |  |  |  |
| Journey | Confirmed days and treatment changes appear; weekly comparisons use adjacent calendar windows, show n/7 coverage, and remain cautious |  |  |  |
| Care | Add medication/lab; capture treatment targets; complete due 2-/6-week follow-ups; stop, restart, archive, and unarchive without losing history; edit appointment questions and after-visit actions; create 30-, 90-, and 180-day reports |  |  |  |
| Guide | Search and open evidence content and external source links |  |  |  |
| Native report share | Print/save creates a readable PDF of the current report and opens the iOS share sheet with a `.pdf` filename |  |  |  |
| Backup/restore | Password-protected `.menocompass` export/import round trip succeeds; wrong password and malformed/future-schema files fail without replacing current data; JSON/CSV sharing still works and plain exports are disclosed as sensitive |  |  |  |
| Accessibility | Pinch zoom, text selection, VoiceOver labels/states, Dynamic Type behavior, focus order, contrast, and safe areas work on all device classes |  |  |  |
| Delete profile/data | Separate confirmation permanently removes the device-local record and explains that subscription cancellation is separate |  |  |  |
| Review success milestone | Confirmed check-ins 2, 5, and 20 schedule StoreKit only after the success moment; cold launches do not advance the count |  |  |  |
| Review/ATT separation | No rating request is attempted in the session that displayed ATT; TestFlight does not falsely count a system dialog as displayed |  |  |  |
| Relaunch/rotation/backgrounding | iPhone portrait and iPad portrait/landscape recover without clipping, blank screens, or stale state |  |  |  |
| Privacy/Terms links | Links open from the pre-purchase gate and resolve successfully |  |  |  |

## Native Liquid Glass and diagnostics

Run the iOS 26 rows from a build produced with Xcode 26. Repeat the fallback row on an earlier iOS version or with Reduce Transparency enabled. Diagnostics must use synthetic failures and contain no real health or free-text data.

| Test | Expected result | Result | Device/evidence | Date |
|---|---|---|---|---|
| Liquid Glass primary navigation | On iOS 26, Today, Journey, Care, and Guide render in the native floating glass bar; selection follows WebView navigation and every tab reaches the correct route |  |  |  |
| Glass accessibility fallback | Earlier iOS versions and Reduce Transparency use an opaque, high-contrast native fallback with the same labels, symbols, states, and 44-point-or-larger targets |  |  |  |
| Navigation visibility | Native tabs are hidden during onboarding, subscription/App Lock gates, secondary routes, open sheets, and keyboard entry; content and home indicator remain unobstructed on iPhone and iPad |  |  |  |
| Sentry handled JavaScript error | A synthetic production/TestFlight failure appears in Sentry with release/update tags and symbolicated frames; message, exception value, request, user, extras, screenshots, view hierarchy, performance traces, and health/free-text values are absent |  |  |  |
| Sentry native crash | A synthetic native crash appears for the exact build with correct release/source maps and contains no health or free-text data |  |  |  |
| Sentry server-side privacy | Sentry data scrubbing and IP-address storage settings are enabled and verified for the production project |  |  |  |
| Expo Observe startup | The exact TestFlight build appears in EAS Observe with startup/interactive measurements and safe route/product events; payloads contain no health values or free text |  |  |  |
| OTA source maps | A preview OTA for runtime `1.2.0-native-1` uploads matching Sentry source maps and reports the correct update ID/group tags |  |  |  |

## Native privacy and iOS integrations

Use test-only records. Verify that no notification, widget, shortcut, diagnostic, or attribution payload contains health values or free text.

| Test | Expected result | Result | Device/evidence | Date |
|---|---|---|---|---|
| Encrypted persistence migration | A legacy plaintext native record migrates to the encrypted device-bound file, relaunches intact, and the plaintext file/WebView local-storage copy is removed |  |  |  |
| App Lock | Enabling requires enrolled Face ID/Touch ID and authentication; backgrounding hides the record; successful biometric or passcode unlock restores it; cancel/failure keeps it hidden |  |  |  |
| Daily reminder | Permission is requested only after enabling and saving; the generic notification arrives at the chosen time and a tap opens Check-in |  |  |  |
| Weekly treatment reminder | Generic notification arrives on the selected weekday/time and a tap opens Care; disabling cancels the scheduled notification |  |  |  |
| Notification denial | Denial leaves every non-reminder feature working and Profile explains how to re-enable permission |  |  |  |
| Apple Health authorization | Connect is user initiated and requests read-only steps, sleep analysis, and body weight with no write types or background delivery |  |  |  |
| Apple Health values | Aggregate values render correctly; partial/denied and no-data cases say unavailable rather than zero; removing the summary does not change Apple Health |  |  |  |
| Widgets | Small/medium widgets show only today-complete and 7-day count, update after a saved check-in, and open Check-in/Journey from cold and foreground states |  |  |  |
| App Shortcuts | Both published MenoCompass App Shortcuts appear in Shortcuts/Search and open the correct Check-in/Journey route from cold and foreground states |  |  |  |

## Explicit 1.2.0 scope decisions

These entries record features intentionally absent from this release. Set the status when the release scope is finalized; no signature is required.

### Additional languages — proposed WAIVED

Version 1.2.0 is intentionally an English-only binary and English-only App Store listing. Non-English translations and localized screenshot sets are deferred. This does **not** waive declaring English in the final `CFBundleLocalizations`, removing unsupported localization claims, or keeping all English copy consistent.

- Final status: `[WAIVED or NOT APPROVED]`

### Authentication QA — N/A by design

MenoCompass has no account, login, logout, sync, or remote health database. Account-authentication tests and a demo account are not applicable. Local data deletion, subscription restoration, and device backup/restore tests above remain required.

- Status: `[CONFIRMED N/A or NOT CONFIRMED]`

## OTA smoke test

If EAS Update/OTA is enabled for this binary, record the runtime version, channel, update ID, pre-update behavior, post-update behavior, rollback behavior, and evidence here. If OTA is not enabled, mark **N/A** and link the release-scope decision; do not record an untested OTA path as PASS.

| Runtime/channel/update | Pre-update | Post-update | Rollback | Result/evidence | Date |
|---|---|---|---|---|---|
|  |  |  |  |  |  |

The production OTA published on 2026-09-02 (update `01a06467-aac9-775f-b87d-9dd58bc844b4`, group `42dd2664-0976-48bf-9631-4fbb39e5ab23`) proves the 1.1.0/build-25 pipeline only. It does not satisfy the 1.2.0 runtime row above.

## Final release decision

- Outstanding FAIL/BLOCKED rows: `[none or list]`
- Recorded scope exceptions: `[list]`
- [ ] App Store Connect privacy answers rechecked
- [ ] App Store Connect IAP/paywall configuration rechecked
- [ ] App Review notes pasted
- [ ] Sentry and EAS Observe production dashboards rechecked
- [ ] Apple export-compliance questionnaire completed in App Store Connect
- [ ] Automatic public release acknowledged (`store.config.json` currently sets `automaticRelease: true`)
- Release decision: `[APPROVE / REJECT]`
