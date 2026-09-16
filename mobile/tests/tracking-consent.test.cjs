const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const crypto = require('node:crypto');
function load(file, mocks, globals = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, __DEV__: false, console, setTimeout, clearTimeout,
    process: { env: { EXPO_PUBLIC_APPSFLYER_DEV_KEY: 'test' } },
    require: name => { if (!(name in mocks)) throw new Error(name); return mocks[name]; }, ...globals });
  return exports;
}
const settle = async () => { for (let i = 0; i < 80; i++) await Promise.resolve(); };
function harness(permission = 'denied', platform = 'ios') {
  const calls = [], events = [], observe = [], bridges = [];
  let allowed = false, ready, pendingPermission, pendingStart;
  const appState = { currentState: 'active' };
  const contract = require('../../shared/tracking-contract');
  const commerce = load('commerce-events.ts', {});
  const eventContract = load('telemetry-events.ts', { './commerce-events': commerce, '../shared/tracking-contract': contract });
  const api = load('telemetry.native.ts', {
    'expo-observe': { Observe: { configure: v => observe.push(v), dispatchEvents: async () => observe.push({ discarded: true }), logEvent: (name, data) => events.push({ name, data }), reportError: () => {} } },
    'expo-tracking-transparency': { getTrackingPermissionsAsync: async () => pendingPermission ? await pendingPermission : ({ status: permission }), requestTrackingPermissionsAsync: async () => ({ status: permission }) },
    'react-native': { Platform: { OS: platform }, AppState: appState },
    'react-native-appsflyer': { AppsFlyer: {
      registerSessionReadyListener: async callback => { ready = callback; },
      init: async () => calls.push('init'), isSessionReady: async () => true,
      start: async () => { calls.push('start'); if (pendingStart) await pendingStart; }, stop: async p => calls.push(p.shouldStop ? 'stop' : 'resume'),
      setDisableIDFVCollection: async () => calls.push('disableIDFV'), anonymizeUser: async () => {},
      getAppsFlyerUID: async () => 'af-generated', logEvent: async e => calls.push(e),
    } },
    'react-native-purchases': { __esModule: true, default: { isConfigured: async () => true, setAppsflyerID: async id => bridges.push(id), setAttributes: async () => {} } },
    './commerce-events': commerce, './telemetry-events': eventContract,
    './posthog.native': { initializeProductAnalytics: async () => {}, stopProductAnalytics: async () => {}, setReplayRoute: () => {}, getReplaySessionId: () => undefined, canRestartAnalytics: () => true, captureProductEvent: (name, data) => events.push({ name, data, product: true }) },
    './analytics-consent': { analyticsAllowed: () => allowed, changeConsent: value => { allowed = value; }, persistAnalyticsConsent: async () => {} },
    './analytics-transport': { cancelAnalyticsRequests: () => {}, eraseAnalytics: async () => true, retryAnalyticsErasure: async () => true, sendInstallObservation: async () => {}, prepareAnalyticsIdentity: async () => {} },
    './analytics-session': { resetAnalyticsSession: () => {}, sessionContext: () => ({ sessionId: crypto.randomUUID() }) },
    './error-reporting': { reportCrash: () => {}, safeError: () => new Error('safe') },
  });
  return { ...api, calls, events, observe, bridges, appState, ready: () => ready?.(), deferStart: () => { let resolve; pendingStart = new Promise(r => resolve = r); return resolve; }, deferPermission: () => { let resolve; pendingPermission = new Promise(r => resolve = r); return resolve; } };
}
for (const permission of ['denied', 'undetermined', 'restricted', 'unavailable']) {
  test(`ATT ${permission} never initializes advertising, even with analytics on`, async () => {
    const h = harness(permission); await h.setAnalyticsConsent(true); await h.initializeTelemetry(false);
    h.trackTelemetryEvent('paywall_rendered'); await settle();
    assert.equal(h.calls.includes('init'), false);
    assert.ok(h.events.some(e => e.product));
  });
}
test('analytics and advertising are independent, queue is bounded to approved events without health data or revenue', async () => {
  const h = harness('granted');
  h.trackTelemetryEvent('paywall_rendered'); assert.equal(h.events.length, 0);
  await h.initializeTelemetry(); await settle();
  h.trackTelemetryEvent('paywall_rendered', { notes: 'secret', productId: 'secret' });
  h.trackTelemetryEvent('checkin_confirmed'); h.trackTelemetryEvent('purchase_completed');
  h.ready(); await settle();
  assert.equal(h.events.length, 0);
  assert.deepEqual(h.calls.filter(x => typeof x === 'object').map(x => x.eventName), ['af_content_view']);
  assert.equal(JSON.stringify(h.calls).includes('secret'), false);
  assert.ok(h.bridges.includes('af-generated'));
  await h.setAnalyticsConsent(true); h.trackTelemetryEvent('checkin_confirmed');
  assert.ok(h.events.some(e => e.product && e.name === 'checkin_confirmed'));
  await h.setAnalyticsConsent(false); const before = h.events.length;
  h.trackTelemetryEvent('paywall_rendered'); assert.equal(h.events.length, before);
  assert.equal(h.calls.filter(x => x.eventName === 'af_content_view').length, 2);
});
test('background cancellation defeats both a late permission result and SDK-ready callback', async () => {
  const h = harness('granted'); const resolve = h.deferPermission();
  const initialization = h.initializeTelemetry(); h.appState.currentState = 'background'; h.suspendAdvertising();
  resolve({ status: 'granted' }); await initialization; await settle(); assert.equal(h.calls.includes('init'), false);
  const h2 = harness('granted'); await h2.initializeTelemetry(); await settle();
  h2.trackTelemetryEvent('paywall_rendered'); h2.suspendAdvertising(); h2.ready(); await settle();
  assert.equal(h2.calls.includes('start'), false); assert.equal(h2.calls.some(x => x.eventName), false);
  assert.equal(h2.bridges.at(-1), null);
});
test('Android advertising remains disabled even with granted permission', async () => {
  const h = harness('granted', 'android'); await h.initializeTelemetry(); await settle();
  assert.equal(h.calls.includes('init'), false);
});
test('background stop does not wait behind an unresolved AppsFlyer start response', async () => {
  const h = harness('granted'), resolve = h.deferStart();
  await h.initializeTelemetry(); await settle(); h.ready(); await settle();
  assert.ok(h.calls.includes('start')); h.suspendAdvertising(); await settle();
  assert.ok(h.calls.includes('stop')); assert.equal(h.bridges.at(-1), null);
  resolve(); await settle(); h.trackTelemetryEvent('paywall_rendered');
  assert.equal(h.calls.some(x => x.eventName), false);
});
test('consent migration is off until current disclosure is explicitly saved', async () => {
  let value = JSON.stringify({ version: 0, allowed: true });
  const consent = load('analytics-consent.ts', { 'expo-secure-store': { getItemAsync: async () => value, setItemAsync: async (_k, v) => { value = v; } } });
  assert.equal(consent.analyticsAllowed(), false); assert.equal(await consent.readAnalyticsConsent(), null);
  await consent.persistAnalyticsConsent(false); assert.equal(await consent.readAnalyticsConsent(), false);
});
test('fallback sessions rotate on idle, maximum age and clock rollback', () => {
  const session = load('analytics-session.ts', { 'expo-crypto': { randomUUID: crypto.randomUUID }, 'expo-application': {}, 'expo-updates': {}, 'react-native': { Platform: { OS: 'ios', Version: 18 } } });
  const now = Date.now(); const first = session.sessionContext(now).sessionId;
  assert.equal(first[14], '7'); assert.equal(session.sessionContext(now + 1000).sessionId, first);
  assert.notEqual(session.sessionContext(now + 1801000).sessionId, first);
  const next = session.sessionContext(now + 1802000).sessionId;
  assert.notEqual(session.sessionContext(now).sessionId, next);
});
test('native startup plugin resets Observe before app initialization and is idempotent', () => {
  const exports = {}, module = { exports };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../plugins/withObserveConsentDefault.js'), 'utf8'), {
    module, require: () => ({
      withAppDelegate: (config, run) => { config.ios = run({ modResults: { contents: config.ios } }).modResults.contents; return config; },
      withMainApplication: (config, run) => { config.android = run({ modResults: { contents: config.android } }).modResults.contents; return config; },
    }),
  });
  const input = { ios: 'func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {\n  return super.application(application, didFinishLaunchingWithOptions: launchOptions)\n}', android: 'override fun onCreate() {\n super.onCreate()\n}' };
  const configured = module.exports(input);
  assert.ok(configured.ios.indexOf('dispatchingEnabled') < configured.ios.indexOf('super.application'));
  assert.ok(configured.android.indexOf('dispatchingEnabled') < configured.android.indexOf('super.onCreate'));
  assert.ok(configured.ios.includes('Data("{\\"dispatchingEnabled\\":false}".utf8)'));
  const before = JSON.stringify(configured); module.exports(configured); assert.equal(JSON.stringify(configured), before);
});
