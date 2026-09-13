const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, mocks = {}, globals = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, console, __DEV__: false, process: { env: { EXPO_PUBLIC_POSTHOG_API_KEY: 'phc_test', EXPO_PUBLIC_POSTHOG_HOST: 'https://us.i.posthog.com' } }, require: name => { if (!(name in mocks)) throw new Error(`Unexpected import ${name}`); return mocks[name]; }, ...globals });
  return exports;
}
const commerce = load('commerce-events.ts');
const events = load('telemetry-events.ts', { './commerce-events': commerce });

test('onboarding analytics retain step timing while dropping concern choices and other health answers', () => {
  const result = events.telemetryAttributes('onboarding_step_left', { step: 1, durationMs: 12000, flowVersion: 2, surface: 'native_preview', symptoms: ['sleepq'], intent: 'treatment', notes: 'private', name: 'private' });
  assert.deepEqual(JSON.parse(JSON.stringify(result)), { schemaVersion: 2, step: 1, durationMs: 12000, flowVersion: 2, surface: 'native_preview' });
  const invalid = events.telemetryAttributes('onboarding_step_left', { step: 30, durationMs: Infinity, surface: 'private', flowVersion: 'private' });
  assert.deepEqual(JSON.parse(JSON.stringify(invalid)), { schemaVersion: 2 });
});

test('PostHog keeps anonymous identity, filters all outgoing properties, and preserves queued event-time state', async () => {
  let options, releaseReady;
  const captured = [];
  class PostHog {
    constructor(_key, input) { options = input; }
    ready() { return new Promise(resolve => { releaseReady = resolve; }); }
    capture(event, properties, captureOptions) { captured.push({ event, properties, captureOptions }); }
  }
  const api = load('posthog.native.ts', {
    'posthog-react-native': { PostHog }, 'expo-file-system': {},
    './privacyFeatures.native': {}, './telemetry-events': events,
  });
  const attributes = { access: 'inactive', notes: 'private' };
  api.captureProductEvent('paywall_requested', attributes);
  attributes.access = 'active';
  const ready = api.initializeProductAnalytics(); releaseReady(); await ready;
  assert.equal(captured.length, 1);
  assert.equal(captured[0].properties.access, 'inactive');
  assert.equal(captured[0].event, 'menocompass.paywall_requested');
  assert.ok(captured[0].captureOptions.timestamp);
  const result = options.before_send({ event: 'menocompass.checkin_confirmed', $set: { name: 'private' }, $set_once: { email: 'private' }, properties: { distinct_id: 'anonymous', $session_id: 'session', notes: 'private', $set: { name: 'private' }, $device_manufacturer: 'private' } });
  assert.equal(JSON.stringify(result).includes('private'), false);
  assert.equal(result.properties.distinct_id, 'anonymous');
  assert.equal(result.properties.app, 'menocompass');
  assert.equal(options.before_send({ event: '$autocapture', properties: {} }), null);
  assert.equal(options.personProfiles, 'never');
  assert.equal(options.captureAppLifecycleEvents, false);
  assert.equal(options.enableSessionReplay, false);
  assert.equal(options.disableGeoip, true);
  assert.equal(options.disableRemoteConfig, true);
  assert.equal(options.errorTracking.autocapture, false);
});

test('embedded errors and promise rejections never transmit messages, URLs, stacks or health content', () => {
  const diagnostics = load('webview-diagnostics.ts');
  const listeners = {}, sent = [];
  const window = { addEventListener: (name, cb) => { listeners[name] = cb; }, ReactNativeWebView: { postMessage: text => sent.push(JSON.parse(text)) } };
  vm.runInNewContext(diagnostics.webViewDiagnosticsScript, { window });
  listeners.error({ error: { name: 'TypeError', message: 'private symptoms', stack: 'private' }, filename: 'https://private', lineno: 10, colno: 4 });
  listeners.unhandledrejection({ reason: { name: 'private', message: 'private' } });
  assert.equal(sent[0].errorType, 'TypeError');
  assert.equal(sent[0].line, 10);
  assert.equal(JSON.stringify(sent).includes('private'), false);
  const error = diagnostics.webViewDiagnosticError({ ...sent[0], message: 'private', stack: 'private', line: 'private' });
  assert.match(error.stack, /menlopass.html:0:4/);
  assert.equal(error.stack.includes('private'), false);
  for (let i = 0; i < 20; i++) listeners.error({});
  assert.equal(sent.length, 10);
});
