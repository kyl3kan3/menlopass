import { PostHog } from 'posthog-react-native';
import { File, Paths } from 'expo-file-system';
import { decryptForDeviceAsync, encryptForDeviceAsync } from './privacyFeatures.native';
import { telemetryAttributes, telemetryEvents, type TelemetryEvent } from './telemetry-events';

const apiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY?.trim();
const host = process.env.EXPO_PUBLIC_POSTHOG_HOST?.trim();
let client: PostHog | undefined;
let initializing: Promise<void> | undefined;
const pending: { event: TelemetryEvent; attributes: Record<string, string | number | boolean>; timestamp: Date }[] = [];
let writes = Promise.resolve();

// Anonymous identity and the bounded offline queue stay encrypted on the device.
const storage = {
  async getItem(key: string) {
    await writes;
    const file = new File(Paths.document, `mc-analytics-${key.replace(/[^a-z0-9.-]/gi, '_')}.secure`);
    try { return file.exists ? await decryptForDeviceAsync(await file.text()) : null; }
    catch { return null; }
  },
  setItem(key: string, value: string) {
    const operation = writes.then(async () => {
      const file = new File(Paths.document, `mc-analytics-${key.replace(/[^a-z0-9.-]/gi, '_')}.secure`);
      file.write(await encryptForDeviceAsync(value));
    });
    writes = operation.catch(() => {});
    return writes;
  },
};

export function initializeProductAnalytics() {
  if (initializing) return initializing;
  initializing = (async () => {
    if (__DEV__ || !apiKey || !host) return;
    const next = new PostHog(apiKey, {
      host,
      customStorage: storage,
      customAppProperties: { $app_name: 'peri', $app_namespace: 'com.kyl3kan3.menlopass' },
      captureAppLifecycleEvents: false,
      capturePushNotificationOpened: false,
      capturePushNotificationSubscriptions: false,
      enableSessionReplay: false,
      errorTracking: { autocapture: false, exceptionSteps: { enabled: false } },
      personProfiles: 'never',
      setDefaultPersonProperties: false,
      disableGeoip: true,
      disableSurveys: true,
      disableRemoteConfig: true,
      preloadFeatureFlags: false,
      flushAt: 10,
      flushInterval: 15_000,
      maxQueueSize: 250,
      before_send: payload => {
        if (!payload) return null;
        const event = payload.event.replace(/^menocompass\./, '');
        if (!payload.event.startsWith('menocompass.') || !telemetryEvents.has(event)) return null;
        const properties = payload.properties || {};
        return { event: payload.event, uuid: payload.uuid, timestamp: payload.timestamp, properties: {
          ...telemetryAttributes(event as TelemetryEvent, properties),
          app: 'menocompass',
          $app_namespace: 'com.kyl3kan3.menlopass',
          distinct_id: properties.distinct_id,
          $session_id: properties.$session_id,
          $lib: properties.$lib,
          $lib_version: properties.$lib_version,
          $geoip_disable: true,
          $process_person_profile: false,
          $is_identified: false,
        } };
      },
    });
    await next.ready();
    client = next;
    for (const item of pending.splice(0)) next.capture(`menocompass.${item.event}`, item.attributes, { timestamp: item.timestamp });
  })();
  return initializing;
}

export function captureProductEvent(event: TelemetryEvent, attributes: Record<string, unknown>) {
  if (__DEV__ || !apiKey || !host) return;
  const safe = telemetryAttributes(event, attributes);
  if (client) client.capture(`menocompass.${event}`, safe);
  else if (pending.length < 50) pending.push({ event, attributes: safe, timestamp: new Date() });
}

export async function flushProductAnalytics() {
  await client?.flush();
}

export function getProductAnalyticsId() {
  return client?.getDistinctId();
}
