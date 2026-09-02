# MenoCompass 1.1.0 release QA record

Use this as the signed evidence record for the exact production/TestFlight candidate submitted to App Review. A written plan is not a passing result: record the device, build, observed outcome, evidence location, and tester initials for every required row.

## Candidate identity

| Field | Value |
|---|---|
| Marketing version | 1.1.0 |
| Git commit | `[full immutable commit SHA]` |
| GitHub Actions run | `[URL]` |
| EAS project | `@kyl3kan3/menlopass` |
| EAS build ID/URL | `[ID and URL]` |
| App Store Connect build | `[build number]` |
| TestFlight group | `[group]` |
| Build created (UTC) | `[YYYY-MM-DD HH:MM]` |
| QA started/completed (UTC) | `[timestamps]` |
| Release owner | `[name]` |

The Git commit must be clean, pushed, and identical to the EAS build source. Do not sign this record for an uncommitted working tree.

## Result vocabulary

- **PASS:** observed on the recorded build and device, with evidence.
- **FAIL:** observed behavior does not meet the expected result.
- **BLOCKED:** test could not be completed; this is not release approval.
- **N/A:** the capability does not exist by product design and the rationale is signed below.
- **WAIVED:** a known checklist exception accepted by both Product and Release owners below. A blank signature is not a waiver.

## Device matrix

Use physical devices for ATT and purchase testing. Simulator results may supplement, but not replace, the required rows.

| Class | Exact model | OS | Install state / Apple sandbox account | Physical? | Tester/date | Evidence |
|---|---|---|---|---|---|---|
| Small iPhone | `[for example, iPhone SE]` | `[version]` | Fresh install / `[account alias]` | Yes |  |  |
| Pro Max iPhone | `[model]` | `[version]` | Fresh install / `[account alias]` | Yes |  |  |
| iPad | `[model]` | `[version]` | Fresh install / `[account alias]` | Yes |  |  |

## Build and store artifact gates

| Test | Expected result | Result | Device/evidence | Initials/date |
|---|---|---|---|---|
| Clean source provenance | Commit is pushed; GitHub CI passes; EAS build points to that commit |  |  |  |
| Production configuration | Required AppsFlyer, Meta, TikTok, and RevenueCat production values are present without logging secrets |  |  |  |
| Final Info.plist | Bundle ID is `com.kyl3kan3.menlopass`; ATT purpose text and required privacy manifests are present |  |  |  |
| English bundle declaration | Final archive declares English in `CFBundleLocalizations` |  |  |  |
| App icon | Final archive contains every required opaque iOS icon slot and the icon renders correctly on light/dark/tinted home screens |  |  |  |
| Launch screen | Production build shows the approved branded launch screen without the Expo placeholder |  |  |  |
| Store screenshots | Five iPhone images are 1242×2688 and five iPad images are 2048×2732, with no alpha and no copy contradictions |  |  |  |
| Public legal URLs | Privacy, Support, and Terms return 200 and describe the 1.1.0 Profile/Care/Journey navigation |  |  |  |
| App Review notes | `APP_REVIEW_NOTES_1.1.0.md` placeholders are replaced and its Notes section is in App Store Connect |  |  |  |
| Privacy/age/content-rights answers | App Store Connect answers match the submitted binary and licensed content |  |  |  |

## Install, ATT, and attribution

Repeat the first two paths with separate fresh installs because iOS does not show the ATT prompt again after a decision.

| Test | Expected result | Result | Device/evidence | Initials/date |
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

| Test | Expected result | Result | Device/evidence | Initials/date |
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

| Test | Expected result | Result | Device/evidence | Initials/date |
|---|---|---|---|---|
| Onboarding | Completes without clipped controls, keyboard obstruction, or unsafe-area overlap |  |  |  |
| Today | Confirm a daily check-in and relaunch; confirmed data persists |  |  |  |
| Journey | Confirmed days and treatment changes appear; pattern language remains cautious |  |  |  |
| Care | Add/edit medication and lab; create 30-, 90-, and 180-day reports |  |  |  |
| Guide | Search and open evidence content and external source links |  |  |  |
| Backup/restore | JSON round trip succeeds on a test-only record; exported health files are clearly disclosed as sensitive |  |  |  |
| Delete profile/data | Separate confirmation permanently removes the device-local record and explains that subscription cancellation is separate |  |  |  |
| Review success milestone | Confirmed check-ins 2, 5, and 20 schedule StoreKit only after the success moment; cold launches do not advance the count |  |  |  |
| Review/ATT separation | No rating request is attempted in the session that displayed ATT; TestFlight does not falsely count a system dialog as displayed |  |  |  |
| Relaunch/rotation/backgrounding | Supported portrait layouts recover without blank or stale state |  |  |  |
| Privacy/Terms links | Links open from the pre-purchase gate and resolve successfully |  |  |  |

## Explicit 1.1.0 scope waivers

These proposed waivers document features intentionally absent from this release. They become valid only after both signatures are present.

### Notifications — proposed WAIVED

Version 1.1.0 does not implement local or push notifications, does not request notification permission, and makes no notification claim in the listing. Therefore permission, receipt, and notification deep-link tests are outside this version's product scope.

- Product owner approval: `[name / signature / UTC date]`
- Release owner approval: `[name / signature / UTC date]`
- Final status: `[WAIVED or NOT APPROVED]`

### Native Liquid Glass navigation — proposed WAIVED

Version 1.1.0 uses the existing branded WebView navigation rather than a native Liquid Glass navigation component. This release does not claim native Liquid Glass behavior. Safe-area, contrast, tap-target, reduced-motion, and iPad/Pro layouts remain required and are not waived.

- Product owner approval: `[name / signature / UTC date]`
- Release owner approval: `[name / signature / UTC date]`
- Final status: `[WAIVED or NOT APPROVED]`

### Additional languages — proposed WAIVED

Version 1.1.0 is intentionally an English-only binary and English-only App Store listing. Non-English translations and localized screenshot sets are deferred. This does **not** waive declaring English in the final `CFBundleLocalizations`, removing unsupported localization claims, or keeping all English copy consistent.

- Product owner approval: `[name / signature / UTC date]`
- Release owner approval: `[name / signature / UTC date]`
- Final status: `[WAIVED or NOT APPROVED]`

### Authentication QA — N/A by design

MenoCompass has no account, login, logout, sync, or remote health database. Account-authentication tests and a demo account are not applicable. Local data deletion, subscription restoration, and device backup/restore tests above remain required.

- Product owner confirmation: `[name / signature / UTC date]`
- Release owner confirmation: `[name / signature / UTC date]`

## OTA smoke test

If EAS Update/OTA is enabled for this binary, record the runtime version, channel, update ID, pre-update behavior, post-update behavior, rollback behavior, and tester evidence here. If OTA is not enabled, mark **N/A** and link the approved release-scope decision; do not record an untested OTA path as PASS.

| Runtime/channel/update | Pre-update | Post-update | Rollback | Result/evidence | Initials/date |
|---|---|---|---|---|---|
|  |  |  |  |  |  |

## Final release decision

- Outstanding FAIL/BLOCKED rows: `[none or list]`
- Approved waivers: `[list]`
- App Store Connect privacy answers rechecked by: `[name/date]`
- App Store Connect IAP/paywall configuration rechecked by: `[name/date]`
- App Review notes pasted by: `[name/date]`
- Release owner decision: `[APPROVE / REJECT]`
- Release owner signature and UTC date: `[signature/date]`
- Product owner signature and UTC date: `[signature/date]`
