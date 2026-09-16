import { PostHog } from 'posthog-react-native';
import { analyticsAllowed, consentEpoch } from './analytics-consent';
import { analyticsPseudonym, sendProductEvent } from './analytics-transport';
import type { TelemetryEvent } from './telemetry-events';
const apiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY?.trim();
const host = process.env.EXPO_PUBLIC_POSTHOG_HOST?.trim();
let client: PostHog | undefined;
let initializing: Promise<void> | undefined;
let replayRoute = false;
let operations = Promise.resolve();
let erased = false;
let identity: string | undefined;
function syncReplay() {
  operations = operations.catch(() => {}).then(async () => {
    if (!client) return;
    const epoch = consentEpoch();
    if (analyticsAllowed() && !erased) {
      if (identity) client.identify(identity);
      await client.optIn();
      if (!analyticsAllowed() || epoch !== consentEpoch() || erased) { await client.optOut(); return; }
      if (replayRoute) await client.startSessionRecording();
      else await client.stopSessionRecording();
    } else { await client.optOut(); await client.stopSessionRecording(); client.reset(); }
  });
  return operations;
}
export function initializeProductAnalytics() {
  if (!analyticsAllowed() || erased) return Promise.resolve();
  if (initializing) return initializing.then(syncReplay);
  initializing = (async () => {
    if (__DEV__ || !process.env.EXPO_PUBLIC_ANALYTICS_API_URL?.startsWith('https://') || !apiKey || !['https://us.i.posthog.com', 'https://eu.i.posthog.com'].includes(host || '')) return;
    const epoch = consentEpoch();
    const id = await analyticsPseudonym();
    if (!id || !analyticsAllowed() || epoch !== consentEpoch()) return;
    identity = id;
    client = new PostHog(apiKey, {
      host, persistence: 'memory', defaultOptIn: false,
      captureAppLifecycleEvents: false, capturePushNotificationOpened: false, capturePushNotificationSubscriptions: false,
      enableSessionReplay: false, personProfiles: 'never', setDefaultPersonProperties: false,
      disableGeoip: true, disableSurveys: true, disableRemoteConfig: true, preloadFeatureFlags: false,
      errorTracking: { autocapture: false, exceptionSteps: { enabled: false } },
      sessionReplayConfig: { maskAllTextInputs: true, maskAllImages: true, maskAllSandboxedViews: true,
        captureLog: false, captureNetworkTelemetry: false, throttleDelayMs: 1000 },
      // The native plugin sends replay; only the API sends product events.
      before_send: () => null,
    });
    await client.ready();
    client.identify(id);
    await syncReplay();
  })().finally(() => { if (!client) initializing = undefined; });
  return initializing;
}
export function setReplayRoute(onboarding: boolean) { replayRoute = onboarding; void syncReplay().catch(() => {}); }
export function stopProductAnalytics(forErasure = false) {
  erased ||= forErasure;
  void client?.optOut().catch(() => {});
  return syncReplay();
}
export function canRestartAnalytics() { return !erased; }
export function getReplaySessionId() { return analyticsAllowed() ? client?.getSessionId() : undefined; }
export function captureProductEvent(event: TelemetryEvent, attributes: Record<string, unknown>) {
  if (!analyticsAllowed() || erased) return;
  void sendProductEvent(event, attributes, client?.getSessionId()).catch(() => {});
}
export async function flushProductAnalytics() { /* API requests are sent at capture time. */ }
