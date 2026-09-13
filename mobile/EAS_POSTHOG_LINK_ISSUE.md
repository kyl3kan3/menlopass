# EAS PostHog project mapping issue

## Resolution: supported manual setup

Expo support (Sarah) confirmed that `connect` provisions a project and cannot select an existing project. An EAS-side link to project 602769 is unsupported, rather than a prerequisite for analytics. Stop retrying `connect`. Use https://us.posthog.com/project/602769 directly; `integrations:posthog:dashboard` requires the optional EAS-side link.

Applied the support instructions: explicitly set the MenoCompass project token and `https://us.i.posthog.com` in EAS production, preview, and development, and in ignored `mobile/.env.local`. Production and preview were already configured for this destination; development is now covered too. Source-map uploads use Expo Observe, not PostHog, so the conditional `POSTHOG_CLI_*` setup is not applicable.

The local configuration transport test was accepted by PostHog, probe UUID `ecd09d45-1000-46a2-9b2f-2f75bd6e648b`. This is a labeled diagnostic, not evidence of physical-device adoption. No application changes or new release were required to apply this configuration.

Reference: https://docs.expo.dev/guides/using-posthog/#manual-setup

## Historical investigation

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

No tokens or credentials are included in this report.

Submitted September 12, 2026 through https://expo.dev/contact under Expo SDK / CLI, with reply email kyl3kan3@gmail.com. The form confirmed: "Message received" and "We got your message. We'll get back to you as soon as we can." No ticket number was displayed. The submitted message also asks for a supported resolution if linking an existing project is unsupported.
