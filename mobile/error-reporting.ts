import * as Sentry from '@sentry/react-native';
import * as Updates from 'expo-updates';
const kinds = new Set(['Error', 'TypeError', 'RangeError', 'ReferenceError', 'SyntaxError']);
export function safeError(error: unknown) {
  const result = new Error('A peri operation failed');
  result.name = error instanceof Error && kinds.has(error.name) ? error.name : 'Error';
  if (error instanceof Error && error.stack) {
    const frames = error.stack.split('\n').slice(1, 41).flatMap(line => {
      const match = /:(\d{1,8}):(\d{1,8})\)?$/.exec(line);
      return match ? [`    at app.bundle:${match[1]}:${match[2]}`] : [];
    });
    result.stack = [`${result.name}: A peri operation failed`, ...frames].join('\n');
  }
  return result;
}
Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enabled: !__DEV__ && !!process.env.EXPO_PUBLIC_SENTRY_DSN,
  sendDefaultPii: false, enableAutoSessionTracking: false,
  attachScreenshot: false, attachViewHierarchy: false,
  tracesSampleRate: 0, profilesSampleRate: 0,
  replaysSessionSampleRate: 0, replaysOnErrorSampleRate: 0,
  enableLogs: false,
  beforeBreadcrumb: () => null,
  beforeSend(event) {
    // Reconstruct instead of trying to blacklist every SDK enrichment field.
    return {
      type: event.type, event_id: event.event_id, timestamp: event.timestamp, platform: event.platform,
      release: event.release, dist: event.dist, environment: event.environment,
      tags: { update_id: Updates.updateId || 'embedded', runtime_version: Updates.runtimeVersion || 'unknown', channel: Updates.channel || 'unknown' },
      level: event.level, fingerprint: ['peri', event.exception?.values?.[0]?.type && kinds.has(event.exception.values[0].type) ? event.exception.values[0].type : 'Error'],
      exception: { values: event.exception?.values?.map(value => ({
        type: value.type && kinds.has(value.type) ? value.type : 'Error', value: 'A peri operation failed',
        stacktrace: { frames: value.stacktrace?.frames?.map(frame => ({
          // No URL queries, local paths, source context, locals or arbitrary function names.
          filename: frame.filename?.endsWith('.bundle') ? 'app.bundle' : 'app',
          lineno: frame.lineno, colno: frame.colno, in_app: frame.in_app,
        })) },
      })) },
    };
  },
});
export function reportCrash(error: unknown) { Sentry.captureException(safeError(error)); }
