# EAS PostHog project mapping issue

Verified September 12, 2026. The EAS dashboard link remains unresolved; application tracking was configured separately and was not changed during this investigation.

## Support report

Expo account: `kyl3kan3`
Expo project: `@kyl3kan3/menlopass` (display name MenoCompass)
Expo app ID: `e7a9bddc-4193-41a0-81f6-b7c74b59aece`
PostHog organization: Decent4, US, `019c8096-8517-0000-8f69-d9cfcd2aa72a`
Expected existing PostHog project: MenoCompass, `602769`
Actual returned project identifier: `599432` (previously verified as MenoSupp)

Running the following command repeatedly reports that it created MenoCompass, but returns `https://us.posthog.com/project/599432`:

```sh
eas integrations:posthog:connect --region US --no-session-replay --no-error-tracking --non-interactive
```

Disconnecting the Expo-side project link and reconnecting produces the same incorrect ID. Existing EAS and local environment variables are retained without `--overwrite`. Incorrect links have been removed with `eas integrations:posthog:disconnect --yes --non-interactive`; no PostHog projects were deleted.

The live Expo GraphQL schema was inspected on September 12. `SetupPostHogProjectInput` contains only `appId` and `posthogOrganizationConnectionId`. `PostHogProjectMutation` exposes only `setupPostHogProject` and `deletePostHogProject`. There is no exposed existing-project selector or mapping-update mutation.

Please investigate the provisioning mapping for this Expo app and link it to existing PostHog project `602769`, without changing project `599432`, deleting either project, or replacing the working analytics token with the wrong destination.

No tokens or credentials are included in this report. This report has not been submitted to support.
