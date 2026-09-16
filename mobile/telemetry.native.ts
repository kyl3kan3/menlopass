import { Observe, type ObserveAttributes } from 'expo-observe';
import { getTrackingPermissionsAsync, requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import { AppState, Platform } from 'react-native';
import { AppsFlyer } from 'react-native-appsflyer';
import Purchases from 'react-native-purchases';
import type { CustomerInfo } from 'react-native-purchases';
import { subscriptionSnapshot } from './commerce-events';
import { telemetryAttributes, telemetryEvents, telemetryRoutes, type TelemetryEvent } from './telemetry-events';
import { captureProductEvent, initializeProductAnalytics, stopProductAnalytics, setReplayRoute, canRestartAnalytics, getReplaySessionId } from './posthog.native';
import { analyticsAllowed, changeConsent, persistAnalyticsConsent } from './analytics-consent';
import { cancelAnalyticsRequests, eraseAnalytics, retryAnalyticsErasure, sendInstallObservation, prepareAnalyticsIdentity } from './analytics-transport';
import { resetAnalyticsSession, sessionContext } from './analytics-session';
import { reportCrash, safeError } from './error-reporting';

Observe.configure({ dispatchingEnabled: false, dispatchInDebug: false });
// Observe's automatic JS handler must see the same sanitized error as Sentry.
const runtime = globalThis as typeof globalThis & { ErrorUtils?: { getGlobalHandler: () => ((error: Error, fatal?: boolean) => void); setGlobalHandler: (handler: (error: Error, fatal?: boolean) => void) => void } };
if (runtime.ErrorUtils) {
  const original = runtime.ErrorUtils.getGlobalHandler();
  runtime.ErrorUtils.setGlobalHandler((error, fatal) => original(safeError(error), fatal));
}
export type TelemetryInitializationResult = { trackingPermission: string; promptedForTracking: boolean };
let lastRoute: string | undefined;
let lastSession: string | undefined;
let backgroundAt: number | undefined;
let subscriptionContext = { access: 'unknown', storeEnvironment: 'unknown', periodType: 'unknown', ownershipType: 'unknown' };
let advertisingEpoch = 0;
let authorized = false;
let ready = false;
let initialized = false;
let adOperations = Promise.resolve();
let bridgeOperations = Promise.resolve();
const pending: { eventName: string; eventValues: Record<string, string | number> }[] = [];
const adNames: Partial<Record<TelemetryEvent, string>> = {
  app_launched: 'af_app_opened', onboarding_started: 'onboarding_started',
  onboarding_step_viewed: 'onboarding_step_viewed', onboarding_completed: 'af_complete_registration',
  paywall_rendered: 'af_content_view', purchase_started: 'af_initiated_checkout',
  purchase_cancelled: 'purchase_cancelled', purchase_failed: 'purchase_failed',
};
const swallow = () => {};
function bridge(id: string | null, epoch: number) {
  bridgeOperations = bridgeOperations.catch(swallow).then(async () => {
    if (!await Purchases.isConfigured()) return;
    if (id && (!authorized || epoch !== advertisingEpoch)) return;
    await Purchases.setAppsflyerID(id);
  });
  return bridgeOperations;
}
export function cancelPendingTrackingPermission() { if (!authorized) advertisingEpoch++; }
export function suspendAdvertising() {
  authorized = false; ready = false; advertisingEpoch++; pending.length = 0;
  void bridge(null, advertisingEpoch).catch(swallow);
  if (initialized) {
    // Do not wait behind a pending start response to stop native collection.
    try { void AppsFlyer.stop({ shouldStop: true }).catch(swallow); } catch { /* Best effort. */ }
    try { void AppsFlyer.anonymizeUser({ shouldAnonymize: true }).catch(swallow); } catch { /* Best effort. */ }
    adOperations = adOperations.catch(swallow).then(async () => {
      await AppsFlyer.stop({ shouldStop: true });
      await AppsFlyer.anonymizeUser({ shouldAnonymize: true });
    });
    void adOperations.catch(swallow);
  }
}
function startAdvertising(epoch: number) {
  const current = () => authorized && epoch === advertisingEpoch && AppState.currentState === 'active';
  adOperations = adOperations.catch(swallow).then(async () => {
    if (!current()) return;
    await AppsFlyer.setDisableIDFVCollection({ disable: true });
    if (!current()) return;
    await AppsFlyer.anonymizeUser({ shouldAnonymize: false });
    if (!current()) return;
    await AppsFlyer.stop({ shouldStop: false });
    if (!current()) return;
    await AppsFlyer.start({ awaitResponse: true });
    if (!current()) { await AppsFlyer.stop({ shouldStop: true }); return; }
    ready = true;
    for (const event of pending.splice(0)) {
      if (!current()) break;
      await AppsFlyer.logEvent(event);
    }
    const id = await AppsFlyer.getAppsFlyerUID();
    if (id && current()) await bridge(id, epoch);
  });
  void adOperations.catch(() => { ready = false; pending.length = 0; });
}
export async function initializeTelemetry(prompt = true): Promise<TelemetryInitializationResult> {
  const epoch = ++advertisingEpoch;
  authorized = false; ready = false;
  if (Platform.OS !== 'ios' || AppState.currentState !== 'active') {
    suspendAdvertising(); return { trackingPermission: 'unavailable', promptedForTracking: false };
  }
  let prompted = false;
  try {
    let permission = await getTrackingPermissionsAsync();
    if (epoch !== advertisingEpoch || AppState.currentState !== 'active') return { trackingPermission: 'unavailable', promptedForTracking: false };
    if (permission.status === 'undetermined' && prompt) {
      prompted = true;
      permission = await requestTrackingPermissionsAsync();
    }
    if (epoch !== advertisingEpoch || AppState.currentState !== 'active') return { trackingPermission: 'unavailable', promptedForTracking: prompted };
    if (permission.status !== 'granted') { suspendAdvertising(); return { trackingPermission: permission.status, promptedForTracking: prompted }; }
    authorized = true;
    const devKey = process.env.EXPO_PUBLIC_APPSFLYER_DEV_KEY;
    if (!__DEV__ && devKey) {
      // SDK 7 uses manual start from the session-ready listener.
      void (async () => {
        await AppsFlyer.registerSessionReadyListener(() => startAdvertising(advertisingEpoch));
        if (epoch !== advertisingEpoch || !authorized) return;
        if (!initialized) {
          initialized = true;
          await AppsFlyer.setDisableIDFVCollection({ disable: true });
          if (epoch !== advertisingEpoch || !authorized) return;
          await AppsFlyer.init({ devKey, appId: process.env.EXPO_PUBLIC_APPLE_APP_ID || '6798018790' });
        } else if (await AppsFlyer.isSessionReady()) startAdvertising(epoch);
      })().catch(() => { initialized = false; ready = false; pending.length = 0; });
    }
    return { trackingPermission: permission.status, promptedForTracking: prompted };
  } catch { suspendAdvertising(); return { trackingPermission: 'unavailable', promptedForTracking: prompted }; }
}
let consentTransition = 0;
export async function setAnalyticsConsent(allowed: boolean, persist = true) {
  const transition = ++consentTransition;
  if (!allowed) {
    changeConsent(false); resetAnalyticsSession(); lastRoute = undefined; lastSession = undefined;
    Observe.configure({ dispatchingEnabled: false, dispatchInDebug: false });
    cancelAnalyticsRequests(); void stopProductAnalytics().catch(swallow);
    if (persist) await persistAnalyticsConsent(false);
    return;
  }
  if (!canRestartAnalytics()) throw new Error('Restart required after analytics deletion');
  await prepareAnalyticsIdentity();
  if (transition !== consentTransition) return;
  if (persist) await persistAnalyticsConsent(true);
  if (transition !== consentTransition) return;
  // With dispatch disabled this advances Observe's cursors without uploading.
  // Pre-consent native launch/error metrics must never be replayed after opt-in.
  await Observe.dispatchEvents();
  if (transition !== consentTransition) return;
  changeConsent(true); resetAnalyticsSession(); lastRoute = undefined;
  Observe.configure({ dispatchingEnabled: true, dispatchInDebug: false });
  void initializeProductAnalytics().catch(swallow);
  void sendInstallObservation().catch(swallow);
  trackTelemetryEvent('analytics_enabled');
}
export async function deleteTrackingData() {
  await setAnalyticsConsent(false);
  await stopProductAnalytics(true);
  return eraseAnalytics();
}
export function telemetryBackground() {
  backgroundAt ??= Date.now(); suspendAdvertising(); setReplayRoute(false);
}
export function telemetryForeground() {
  void retryAnalyticsErasure().catch(swallow);
  if (backgroundAt !== undefined && Date.now() - backgroundAt >= 30000) trackTelemetryEvent('app_launched');
  backgroundAt = undefined;
}
export function setTelemetryReplay(onboarding: boolean) { setReplayRoute(onboarding && analyticsAllowed()); }
export function setTelemetrySubscriptionState(customerInfo: CustomerInfo) {
  // Remove bridges used by older releases; dashboard integrations must also be disabled.
  try { void Purchases.setAttributes({ '$posthogUserId': '', '$fbAnonId': '', '$idfa': '', '$idfv': '' }).catch(swallow); } catch { /* Subscription access remains available. */ }
  if (!authorized) void bridge(null, advertisingEpoch).catch(swallow);
  const next = subscriptionSnapshot(customerInfo);
  const changed = JSON.stringify(next) !== JSON.stringify(subscriptionContext);
  subscriptionContext = next;
  if (changed) trackTelemetryEvent('subscription_status_checked');
}
export function trackTelemetryEvent(event: TelemetryEvent, attributes?: Record<string, unknown>) {
  if (!telemetryEvents.has(event)) return;
  const safe = telemetryAttributes(event, { ...subscriptionContext, ...attributes });
  if (analyticsAllowed()) {
    const fallback = sessionContext();
    const context = { ...fallback, sessionId: getReplaySessionId() || fallback.sessionId };
    if (lastSession !== context.sessionId) {
      lastSession = context.sessionId;
      if (event !== 'session_started') {
        try { captureProductEvent('session_started', {}); Observe.logEvent('session.started', { attributes: context }); } catch { /* Best effort. */ }
      }
    }
    try { Observe.logEvent(event.replace('_', '.'), { attributes: { ...safe, ...context } }); } catch { /* Best effort. */ }
    try { captureProductEvent(event, safe); } catch { /* Checkout must remain available. */ }
  }
  const eventName = adNames[event];
  if (!eventName || !authorized || __DEV__ || AppState.currentState !== 'active') return;
  const eventValues: Record<string, string | number> = {};
  if (typeof safe.step === 'number') eventValues.step_index = safe.step;
  if (safe.packageType === 'MONTHLY' || safe.packageType === 'ANNUAL') eventValues.plan = safe.packageType;
  if (event === 'paywall_rendered') eventValues.af_content_type = 'paywall';
  if (ready) { try { void AppsFlyer.logEvent({ eventName, eventValues }).catch(swallow); } catch { /* Best effort. */ } }
  else if (pending.length < 50) pending.push({ eventName, eventValues });
}
export function flushTelemetry() { /* API has no process-dependent flush queue. */ }
export function reportTelemetryError(error: unknown) {
  try { reportCrash(error); } catch { /* Best effort. */ }
  if (analyticsAllowed()) { try { Observe.reportError(safeError(error)); } catch { /* Best effort. */ } }
}
export function setTelemetryRoute(route: string) {
  if (!telemetryRoutes.has(route) || route === lastRoute) return;
  lastRoute = route;
  trackTelemetryEvent('screen_viewed', { route });
}
