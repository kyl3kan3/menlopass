import { Observe, type ObserveAttributes } from 'expo-observe';
import {
  getTrackingPermissionsAsync,
  requestTrackingPermissionsAsync,
} from 'expo-tracking-transparency';
import { Platform } from 'react-native';
import {
  AFInAppEventType,
  AppsFlyer,
  ConversionData,
  DeepLinkData,
} from 'react-native-appsflyer';
import { AppEventsLogger, Settings } from 'react-native-fbsdk-next';
import Purchases from 'react-native-purchases';
import type { CustomerInfo } from 'react-native-purchases';
import * as Updates from 'expo-updates';
import { commerceAttributes, commerceEvents, subscriptionSnapshot } from './commerce-events';
import {
  initializeTikTokBusiness,
  type TrackingPermission,
} from './modules/menocompass-tiktok-business';

const appleAppId = process.env.EXPO_PUBLIC_APPLE_APP_ID?.trim() || '6798018790';
const appsFlyerDevKey = process.env.EXPO_PUBLIC_APPSFLYER_DEV_KEY?.trim();
const metaAppId = process.env.EXPO_PUBLIC_META_APP_ID?.trim();
const metaClientToken = process.env.EXPO_PUBLIC_META_CLIENT_TOKEN?.trim();

export type TelemetryInitializationResult = {
  trackingPermission: TrackingPermission;
  promptedForTracking: boolean;
};
type TelemetryEvent = keyof typeof commerceEvents
  | 'onboarding_started'
  | 'onboarding_step_viewed'
  | 'onboarding_completed'
  | 'checkin_confirmed'
  | 'report_opened'
  | 'subscription_management_opened';

const eventDefinitions: Record<
  TelemetryEvent,
  { observe: string; appsFlyer?: string; meta?: string }
> = {
  ...Object.fromEntries(Object.keys(commerceEvents).map(event => [event, { observe: event.replace('_', '.') }])) as Record<keyof typeof commerceEvents, { observe: string }>,
  onboarding_started: { observe: 'onboarding.started' },
  onboarding_step_viewed: { observe: 'onboarding.step_viewed' },
  onboarding_completed: { observe: 'onboarding.completed' },
  checkin_confirmed: { observe: 'checkin.confirmed' },
  report_opened: { observe: 'report.opened' },
  paywall_rendered: {
    observe: 'paywall.rendered',
    appsFlyer: AFInAppEventType.CONTENT_VIEW,
    meta: AppEventsLogger.AppEvents.ViewedContent,
  },
  subscription_management_opened: { observe: 'subscription.management_opened' },
};

let appsFlyerReady = false;
let metaReady = false;
let initialization: Promise<TelemetryInitializationResult> | undefined;
let subscriptionContext = { access: 'unknown', storeEnvironment: 'unknown', periodType: 'unknown', ownershipType: 'unknown' };
const buildContext = commerceAttributes({
  buildChannel: __DEV__ ? 'development'
    : ['development', 'preview', 'production'].includes(Updates.channel || '') ? Updates.channel : 'unknown',
  runtimeVersion: Updates.runtimeVersion || 'unknown',
  updateId: Updates.updateId || 'embedded',
});
const pendingCommerce: { eventName: string; eventValues: Record<string, string | number> }[] = [];

function sendCommerce(eventName: string, eventValues: Record<string, string | number>) {
  try {
    void AppsFlyer.logEvent({ eventName, eventValues }).catch(error => recordInitializationFailure('appsflyer', error));
  } catch (error) {
    recordInitializationFailure('appsflyer', error);
  }
}

function recordInitializationFailure(
  service: 'appsflyer' | 'meta' | 'permissions' | 'revenuecat' | 'tiktok',
  error: unknown,
) {
  try { Observe.logEvent('telemetry.initialization_failed', {
    severity: 'warn',
    attributes: {
      service,
      errorType: error instanceof Error ? error.name : 'UnknownError',
    },
  }); } catch { /* Diagnostics cannot interrupt purchases. */ }
  if (__DEV__) console.warn(`${service} telemetry setup failed`, error);
}

function sanitizedDiagnosticError(error: unknown) {
  const name = error instanceof Error && error.name
    ? error.name
    : 'ApplicationError';
  const diagnostic = new Error('A MenoCompass operation failed.');
  diagnostic.name = name;
  if (error instanceof Error && error.stack) {
    const stackLines = error.stack.split('\n');
    diagnostic.stack = [`${name}: A MenoCompass operation failed.`, ...stackLines.slice(1)].join('\n');
  }
  return diagnostic;
}

function installPrivacySafeObserveErrorHandler() {
  type ErrorHandler = (error: Error, isFatal?: boolean) => void;
  type ErrorUtilsShape = {
    getGlobalHandler: () => ErrorHandler | undefined;
    setGlobalHandler: (handler: ErrorHandler) => void;
  };
  const runtime = globalThis as typeof globalThis & {
    ErrorUtils?: ErrorUtilsShape;
    __MENO_OBSERVE_ERROR_SANITIZED__?: boolean;
  };
  if (runtime.__MENO_OBSERVE_ERROR_SANITIZED__ || !runtime.ErrorUtils) return;
  const observeHandler = runtime.ErrorUtils.getGlobalHandler();
  if (!observeHandler) return;
  runtime.ErrorUtils.setGlobalHandler((error, isFatal) => {
    observeHandler(sanitizedDiagnosticError(error), isFatal);
  });
  runtime.__MENO_OBSERVE_ERROR_SANITIZED__ = true;
}

installPrivacySafeObserveErrorHandler();

async function withRevenueCat(action: () => Promise<void>) {
  if (await Purchases.isConfigured()) await action();
}

async function getRevenueCatCustomerId() {
  if (!(await Purchases.isConfigured())) return undefined;
  return Purchases.getAppUserID();
}

async function resolveTrackingPermission(): Promise<TelemetryInitializationResult> {
  if (Platform.OS !== 'ios') {
    return { trackingPermission: 'granted', promptedForTracking: false };
  }

  try {
    const current = await getTrackingPermissionsAsync();
    if (current.status !== 'undetermined') {
      return { trackingPermission: current.status, promptedForTracking: false };
    }
    return {
      trackingPermission: (await requestTrackingPermissionsAsync()).status,
      promptedForTracking: true,
    };
  } catch (error) {
    recordInitializationFailure('permissions', error);
    return { trackingPermission: 'unavailable', promptedForTracking: false };
  }
}

async function initializeTikTok(trackingPermission: TrackingPermission) {
  if (Platform.OS !== 'ios') return;
  await initializeTikTokBusiness(trackingPermission);
}

function sendAppsFlyerConversionDataToRevenueCat(data: ConversionData) {
  void withRevenueCat(() => Purchases.setAppsFlyerConversionData({ status: 'success', data })).catch(error => {
    recordInitializationFailure('revenuecat', error);
  });
}

async function initializeAppsFlyer() {
  if (!appsFlyerDevKey) return;

  const revenueCatCustomerId = await getRevenueCatCustomerId().catch(error => {
    recordInitializationFailure('revenuecat', error);
    return undefined;
  });

  await AppsFlyer.registerDeepLinkListener({
    onDeepLinking: (data: DeepLinkData) => {
      Observe.logEvent('attribution.deep_link_resolved', {
        attributes: { status: data.status },
      });
    },
  });

  const initialized = AppsFlyer.init({ devKey: appsFlyerDevKey, appId: appleAppId });
  const started = new Promise<void>((resolve, reject) => {
    const registration = AppsFlyer.registerSessionReadyListener(() => {
      void (async () => {
        if (revenueCatCustomerId) {
          try {
            await AppsFlyer.setCustomerUserId({ customerId: revenueCatCustomerId });
          } catch (error) {
            recordInitializationFailure('appsflyer', error);
          }
        }
        await AppsFlyer.start({ awaitResponse: true });
      })().then(resolve, reject);
    });
    void registration.catch(reject);
  });
  const conversionListener = AppsFlyer.registerConversionListener({
    onConversionDataSuccess: sendAppsFlyerConversionDataToRevenueCat,
    onConversionDataFail: error => recordInitializationFailure('appsflyer', error),
  });

  await Promise.all([initialized, conversionListener]);
  await started;
  appsFlyerReady = true;
  for (const event of pendingCommerce.splice(0)) sendCommerce(event.eventName, event.eventValues);

  const appsFlyerId = await AppsFlyer.getAppsFlyerUID();
  if (appsFlyerId) await withRevenueCat(() => Purchases.setAppsflyerID(appsFlyerId));
}

async function initializeMeta(trackingAuthorized: boolean) {
  if (!metaAppId || !metaClientToken) return;

  Settings.setAppID(metaAppId);
  Settings.setClientToken(metaClientToken);
  Settings.setAppName('MenoCompass');
  Settings.setAutoLogAppEventsEnabled(false);
  Settings.setAdvertiserIDCollectionEnabled(trackingAuthorized);
  Settings.initializeSDK();

  if (Platform.OS === 'ios') {
    await Settings.setAdvertiserTrackingEnabled(trackingAuthorized);
  }

  metaReady = true;
  AppEventsLogger.logEvent('fb_mobile_activate_app');

  if (trackingAuthorized) {
    const anonymousId = await AppEventsLogger.getAnonymousID();
    if (anonymousId) await withRevenueCat(() => Purchases.setFBAnonymousID(anonymousId));
  }
}

export function initializeTelemetry() {
  if (initialization) return initialization;

  initialization = (async () => {
    installPrivacySafeObserveErrorHandler();
    Observe.configure({
      environment: String(buildContext.buildChannel),
      dispatchInDebug: false,
      sampleRate: 1,
    });

    const permissionResult = await resolveTrackingPermission();
    const permission = permissionResult.trackingPermission;
    Observe.logEvent('tracking.permission_resolved', {
      attributes: {
        status: permission,
        prompted: permissionResult.promptedForTracking,
      },
    });
    const trackingAuthorized = permission === 'granted';
    Observe.setGlobalAttributes({
      trackingPermission: permission,
      ...buildContext,
      ...subscriptionContext,
    });

    const tasks = [
      initializeAppsFlyer().catch(error => recordInitializationFailure('appsflyer', error)),
      initializeMeta(trackingAuthorized).catch(error => recordInitializationFailure('meta', error)),
      initializeTikTok(permission).catch(error => recordInitializationFailure('tiktok', error)),
    ];

    if (trackingAuthorized) {
      tasks.push(
        withRevenueCat(() => Purchases.collectDeviceIdentifiers()).catch(error => {
          recordInitializationFailure('revenuecat', error);
        }),
      );
    }

    // Analytics must not indefinitely hold the automatic subscription screen.
    // SDK initialization continues in the background and flushes queued events
    // if it recovers. ATT itself is resolved before starting this deadline.
    let deadline: ReturnType<typeof setTimeout> | undefined;
    await Promise.race([
      Promise.all(tasks),
      new Promise<void>(resolve => {
        deadline = setTimeout(() => {
          try { Observe.logEvent('telemetry.initialization_timed_out'); } catch { /* Best effort. */ }
          resolve();
        }, 8_000);
      }),
    ]).finally(() => { if (deadline) clearTimeout(deadline); });
    return permissionResult;
  })();

  return initialization;
}

export function setTelemetrySubscriptionState(customerInfo: CustomerInfo) {
  const next = subscriptionSnapshot(customerInfo);
  const changed = JSON.stringify(next) !== JSON.stringify(subscriptionContext);
  subscriptionContext = next;
  try { Observe.setGlobalAttributes({
    ...subscriptionContext,
  }); } catch { /* Access checks must survive unavailable diagnostics. */ }
  if (changed) trackTelemetryEvent('subscription_status_checked');
}

export function trackTelemetryEvent(event: TelemetryEvent, attributes?: ObserveAttributes) {
  const definition = eventDefinitions[event];
  const commerceName = commerceEvents[event as keyof typeof commerceEvents];
  const safeAttributes = commerceName
    ? commerceAttributes({ ...buildContext, ...subscriptionContext, ...attributes })
    : attributes;
  try { Observe.logEvent(definition.observe, safeAttributes ? { attributes: safeAttributes } : undefined); } catch { /* Best effort. */ }

  if (commerceName && !__DEV__) {
    if (appsFlyerReady) sendCommerce(commerceName, safeAttributes as Record<string, string | number>);
    else if (appsFlyerDevKey && pendingCommerce.length < 50) {
      pendingCommerce.push({ eventName: commerceName, eventValues: safeAttributes as Record<string, string | number> });
    }
  }

  if (appsFlyerReady && definition.appsFlyer) {
    try { void AppsFlyer.logEvent({
      eventName: definition.appsFlyer,
      eventValues: {
        af_content_id: 'menocompass_pro',
        af_content_type: 'subscription_paywall',
      },
    }).catch(error => recordInitializationFailure('appsflyer', error));
    } catch (error) { recordInitializationFailure('appsflyer', error); }
  }

  if (metaReady && definition.meta) {
    try { AppEventsLogger.logEvent(definition.meta, {
      fb_content_id: 'menocompass_pro',
      fb_content_type: 'subscription_paywall',
    }); } catch (error) { recordInitializationFailure('meta', error); }
  }
}

export function reportTelemetryError(error: unknown) {
  try { Observe.reportError(sanitizedDiagnosticError(error)); } catch { /* Best effort. */ }
}

export function setTelemetryRoute(route: string) {
  Observe.setGlobalAttributes({ route });
}
