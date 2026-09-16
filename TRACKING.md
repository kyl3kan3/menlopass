# peri tracking: implementation and release acceptance

This supersedes the earlier mobile tracking notes for runtime
`1.2.1-native-tracking-1`. Older binaries retain their earlier SDK behavior.
The blueprint was adapted to an offline app: there are no accounts or health API.
Analytics uses a random installation credential stored in SecureStore. The server
stores its SHA-256 digest, and PostHog uses `peri_` + SHA-256 of
`peri:analytics:v1:<credential digest>`. RevenueCat IDs are never this identity.
SecureStore can survive iOS reinstalls; installation observation is not a download count.

## Consent and data paths

- Disclosure version 1 starts off; missing/older choices require review. One choice
  gates API events, PostHog product events/replay, and Expo Observe. Profile exposes
  the choice, iOS Settings, and analytics erasure. Every subscription/app feature
  remains available with both tracking choices off.
- Apple ATT is independent. Only iOS `granted` starts AppsFlyer. Backgrounding stops
  it and clears the RevenueCat bridge; foreground rechecks permission. Late
  permission results and session-ready callbacks cannot authorize a cancelled run.
  Android advertising stays disabled.
- AppsFlyer is the only mobile marketing SDK. Direct Meta SDK and Expo Insights were
  removed; the legacy TikTok module is excluded from autolinking. AppsFlyer IDFV
  collection is disabled, event buffering is capped at 50, and startup is manual.
- Events are typed by name and projected through `shared/tracking-contract.js` on
  mobile. The API rejects unknown names/properties and unapproved product IDs.
  First-party events can record check-in/report usage but not content. PostHog
  excludes those events and sensitive screen names. Marketing gets only approved
  funnel events, numeric step position, plan type, and paywall content type.
- Purchase attempts have UUID correlation and duration. Successful checkout and
  confirmed entitlement are separate product events. No client `af_purchase` is
  emitted. RevenueCat remains the paid-revenue authority. RevenueCatUI owns the
  StoreKit operation; tracking does not block its callbacks or checkout. Attribution
  synchronization is best effort before/during the paywall; no purchase is delayed
  to guarantee provider identity delivery.
- Each API event has a UUID and capture-time release/session context. Fallback
  UUIDv7 sessions rotate on idle, maximum age, clock rollback, or consent changes.
  Once PostHog is ready, API events prefer its session ID. Server promotion to
  `$session_id` requires a recent, nonfuture UUIDv7. Legacy UUIDv4 remains custom context.
- Replay runs only while the native onboarding preview is visible, foregrounded,
  unlocked, and consented. The entire root hierarchy is masked, including all
  text/images/inputs. The health WebView, paywall, privacy choice and other surfaces
  are outside the recording gate. Console/network capture and automatic SDK
  product events, profiles, flags, surveys, and error autocapture are disabled.
- Sentry production diagnostics use their own configured DSN, independently of
  optional analytics. Error messages, users, requests, breadcrumbs, extra/context
  data and source content are omitted. Frame line/column positions and safe error
  types remain. Screenshots, view hierarchies, tracing, profiling and Sentry replay
  are off. Observe errors are sanitized and follow analytics consent. Existing
  wrapper `markInteractive` measures the displayed native experience.
- Observe dispatch is reset before native startup by the config plugin and at JS
  import, then follows the current disclosure choice. A new native build is essential.

## Server deployment

The API is a Vercel Node function alongside the existing static site. PostgreSQL
(including Neon) stores analytics only. Nothing adds health sync or login.

1. Provision a dedicated PostgreSQL database and set `DATABASE_URL` in the API
   environment. Run `npm run analytics:migrate` with that environment loaded.
2. Set server-only `POSTHOG_API_KEY`, `POSTHOG_HOST`, `POSTHOG_PROJECT_ID`,
   `POSTHOG_PERSONAL_API_KEY` (person read/delete permission), `CRON_SECRET`, and
   `ANALYTICS_RATE_SECRET`. See `server/.env.example`. Never put private keys into
   `EXPO_PUBLIC_*` variables.
3. Configure the matching peri project token/host on mobile, plus
   `EXPO_PUBLIC_ANALYTICS_API_URL`. Set exact, comma-separated App Store IDs in both
   `ANALYTICS_PRODUCT_IDS` and `EXPO_PUBLIC_ANALYTICS_PRODUCT_IDS`. No SuppAI IDs or
   guessed product IDs are supplied. Empty lists reject/drop all product IDs.
4. Deploy API/schema before enabling the mobile build. Verify the protected daily
   `/api/internal/analytics-flush` cron at 06:00 UTC and configure provider-job
   monitoring for old `due_at`, high `attempts`, and unfinished erasure stages.
   Configure hosting WAF limits for public API abuse as part of deployment.
5. Configure the peri Sentry DSN, organization/project and secret source-map upload
   token in EAS. Supply RevenueCat and AppsFlyer public app-specific keys.
6. Build and install the new runtime. OTA publishing refuses a runtime without a
   finished matching native build. Do not target the old runtime.

Requests use a random 64-hex-character bearer capability, never a user-supplied account ID.
The endpoint validates an 8 KiB body limit, 300 unique events per installation/day,
and a daily HMAC IP bucket limit. IP bucket rows expire after two days; raw IPs are
not stored in this schema (hosting/provider network logs are separate).

The client retries transient failures three times with an eight-second timeout,
stable UUID and capture context. Opt-out cancels in-flight fetches and prevents
retries. Ordinary events have no durable device queue. Installation observation
persists a separate UUID until accepted. Accepted events and eligible outbox jobs
are written atomically. Flushes use transaction-scoped row locks with SKIP LOCKED
as leases, retry backoff, a time budget, and a maximum of 100 jobs. Provider calls
stay inside the request/transaction lifetime. A crash releases the lease; provider
UUIDs make retry deduplication possible. Already-received traffic cannot be recalled.

## Erasure and migration limits

Profile deletion first opts out and stops replay. The device saves a pending
deletion credential for offline retries. Server deletion takes the same
installation lock as provider delivery, removes events/capture jobs, and retains
a hashed tombstone that rejects later sends. A durable erasure job creates a
temporary empty PostHog person, waits for ingestion, then requests event and
recording deletion. `done` means the provider accepted the request, not that a
receiving-side deletion audit has completed. Credentials/configuration failures
stay retryable; the UI never claims instantaneous provider erasure.

After requesting erasure, restart before opting in again. A new identity is issued
only after the old server deletion was accepted and the user explicitly opts in.
This covers the new installation namespace, not historical anonymous PostHog IDs
from older binaries, exported data, Sentry, Expo, Apple or every advertising partner.
Historical/provider-specific erasure needs a separate operational process.

Disable the previous RevenueCat-to-PostHog integration and any direct Meta/TikTok
revenue integrations before rollout; old SDK subscriber attributes may exist.
The new app clears legacy PostHog/Meta/device attributes. Configure only the
intended RevenueCat-to-AppsFlyer integration for paid events (`af_purchase`) and
the selected partner mappings. Dashboard activation, credentials, campaign links,
old-binary behavior and receiving-side revenue deduplication are not proven by source.
The public download page remains pixel-free; no website pixel was added.

## Validation record

Code tests cover consent migration and independence; denied/unavailable/Android
advertising; cancellation during permission and replay startup; payload filtering;
retry UUID stability; offline erasure; install deduplication; fallback session
rotation; checkout/access separation; and shared server validation. Embedded
PostgreSQL tests execute the migration, atomic insert/dedup, provider failure retry,
quotas, first-party deletion and tombstone rejection. PGlite uses single-connection
advisory-lock shims, so hosted PostgreSQL concurrency is **not** verified by that test.

The full `npm test` suite, mobile TypeScript check, iOS JavaScript bundle export, and web export passed. iOS native prebuild cannot run on this Windows host and was not verified.

No physical device or receiving provider was verified in this implementation run.
Before release, record evidence for:

- All analytics on/off × ATT granted/denied/unavailable combinations, upgrade
  review, Settings revocation, background/foreground, and opt-out during startup.
- A real recording with every sensitive view masked, stopped outside preview, and
  matching event pseudonym/session ID. Check installed app/build/OTA metadata.
- Provider outage/recovery, duplicate requests, concurrent delivery/deletion on
  hosted PostgreSQL, and actual PostHog event/recording disappearance.
- Real RevenueCat lifecycle → AppsFlyer → intended partner receipts with exactly
  one paid-revenue event, plus checkout/access with all tracking disabled.
- Sentry/Observe raw payload inspection and native startup consent defaults on
  both supported platforms. Update App Store privacy declarations from this evidence.

References: [Observe dispatch gating](https://docs.expo.dev/versions/latest/sdk/observe/),
[PostHog person/event/recording deletion](https://posthog.com/docs/data/persons).
