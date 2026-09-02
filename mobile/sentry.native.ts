import * as Sentry from '@sentry/react-native';
import * as Updates from 'expo-updates';

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim();
const environment = __DEV__ ? 'development' : (Updates.channel ?? 'standalone');
const allowedBreadcrumbCategories = new Set([
  'app.lifecycle',
  'device.event',
  'menocompass.navigation',
  'menocompass.product',
  'sentry.event',
]);

Sentry.init({
  dsn,
  enabled: Boolean(dsn) && !__DEV__,
  environment,
  sendDefaultPii: false,
  enableAutoPerformanceTracing: false,
  tracesSampleRate: 0,
  profilesSampleRate: 0,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
  attachScreenshot: false,
  attachViewHierarchy: false,
  enableCaptureFailedRequests: false,
  enableAutoSessionTracking: true,
  maxBreadcrumbs: 20,
  beforeBreadcrumb(breadcrumb) {
    if (!breadcrumb.category || !allowedBreadcrumbCategories.has(breadcrumb.category)) {
      return null;
    }
    if (breadcrumb.category === 'menocompass.navigation') {
      const route = breadcrumb.data?.route;
      return {
        ...breadcrumb,
        data: typeof route === 'string' ? { route } : undefined,
      };
    }
    return { ...breadcrumb, data: undefined };
  },
  beforeSend(event) {
    // MenoCompass is a health journal. Diagnostics must never carry account,
    // request, screenshot, view-hierarchy, free-form, or health-record data.
    delete event.user;
    delete event.request;
    delete event.extra;
    delete event.message;
    delete event.logentry;
    event.exception?.values?.forEach(exception => {
      delete exception.value;
    });
    return event;
  },
});

const scope = Sentry.getGlobalScope();
scope.setTag('expo-update-id', Updates.updateId ?? 'development');
scope.setTag('expo-runtime-version', Updates.runtimeVersion ?? 'development');
scope.setTag('expo-channel', Updates.channel ?? 'development');
scope.setTag('expo-is-embedded-update', String(Updates.isEmbeddedLaunch));

const manifest = Updates.manifest as Record<string, unknown> | null;
const metadata = manifest?.metadata;
if (metadata && typeof metadata === 'object' && 'updateGroup' in metadata) {
  const updateGroup = (metadata as { updateGroup?: unknown }).updateGroup;
  if (typeof updateGroup === 'string') scope.setTag('expo-update-group-id', updateGroup);
}

export function captureDiagnosticError(error: unknown, source = 'application') {
  const diagnosticError = error instanceof Error
    ? error
    : new Error('A non-Error application failure was reported.');
  Sentry.withScope(localScope => {
    localScope.setTag('diagnostic.source', source);
    Sentry.captureException(diagnosticError);
  });
}

export function recordDiagnosticBreadcrumb(name: string) {
  Sentry.addBreadcrumb({
    category: 'menocompass.product',
    message: name,
    level: 'info',
  });
}

export function setDiagnosticRoute(route: string) {
  Sentry.setTag('app.route', route);
  Sentry.addBreadcrumb({
    category: 'menocompass.navigation',
    message: 'Route changed',
    data: { route },
    level: 'info',
  });
}

export { Sentry };
