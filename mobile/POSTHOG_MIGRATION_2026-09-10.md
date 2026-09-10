# Dedicated PostHog project migration — September 10, 2026

MenoCompass now uses [PostHog project 602769](https://us.posthog.com/project/602769/activity/explore) in Decent4. Historical events remain in Default project 319688; they were not copied or deleted.

## Configuration

- Updated `EXPO_PUBLIC_POSTHOG_API_KEY` in the EAS production and preview environments for `@kyl3kan3/menlopass`. The US ingestion host remains `https://us.i.posthog.com`.
- Updated the existing RevenueCat PostHog integration in project `50953eca` to the new project token. The saved form retained US region, namespaced subscription event names, blank sandbox token, and disabled subscriber person properties.
- Existing privacy allowlists, anonymous identity, encrypted queue, and disabled autocapture/session replay remain in place. No new events or health properties were added.

## Published release

- [Production iOS OTA](https://expo.dev/accounts/kyl3kan3/projects/menlopass/updates/43af969d-e6fc-4ff9-9c55-b93418e5addf)
- Update group: `43af969d-e6fc-4ff9-9c55-b93418e5addf`
- iOS update: `01a08a99-4589-7ed1-9351-414af8f84d4c`
- Runtime: `1.2.0-native-2`; app version: `1.2.1`
- Source commit: `c57ace7c417f21373dfcfb7d66ed5bf5eff2e332`; this is an environment configuration migration with unchanged application source.

## Verification

- Release helper passed TypeScript, full browser regression tests, responsive tests at 320/390/430/768 pixels, 34 mobile contract tests, and three TikTok tests. A finished compatible production native build was confirmed before publishing.
- Exported Hermes bundle contains the new project token and US host, and does not contain the former project token.
- Production update endpoint returned HTTP 200 with the exact new update for `1.2.0-native-2`; `1.2.0-native-1` returned HTTP 204.
- The new project's Activity page visibly received `menocompass.diagnostic_probe`, UUID `5998e410-22c9-49c3-bb38-6046983bab0d`, anonymous ID `menocompass-release-validation`. This probe is labeled `validation=true` and `buildChannel=preview`; exclude it from product and revenue metrics.
- The connector's project context changed during verification (a trends response linked to another project), so that query was not treated as evidence. Receipt was verified in the browser at the exact project URL above.

Device adoption is not established by the transport probe or update endpoint. Existing installations continue using their bundled destination until they adopt the new compatible OTA. Older incompatible binaries require a compatible native release. RevenueCat configuration was saved, but no real purchase or subscription delivery was generated for testing. Preview configuration was updated; only production OTA was published.
