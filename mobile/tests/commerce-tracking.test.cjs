const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, mocks = {}, globals = {}) {
  const exports = {};
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  vm.runInNewContext(output, {
    exports, console, setTimeout, clearTimeout, __DEV__: false, process: { env: { EXPO_PUBLIC_APPSFLYER_DEV_KEY: 'test-key' } },
    require: name => {
      if (!(name in mocks)) throw new Error(`Unexpected import ${name}`);
      return mocks[name];
    }, ...globals,
  }, { filename: file });
  return exports;
}
const commerce = load('commerce-events.ts');
const customer = (active = false, sandbox = false, period = 'NORMAL') => ({ entitlements: { active: active ? {
  'MenoCompass Pro': { isActive: true, isSandbox: sandbox, periodType: period, ownershipType: 'PURCHASED' },
} : {} } });

test('access snapshots distinguish sandbox, trial, inactive, and family access without calling them paid', () => {
  assert.equal(commerce.subscriptionSnapshot(customer()).storeEnvironment, 'unknown');
  assert.equal(commerce.subscriptionSnapshot(customer(true, true)).storeEnvironment, 'sandbox');
  assert.equal(commerce.subscriptionSnapshot(customer(true, false, 'TRIAL')).periodType, 'TRIAL');
  const family = customer(true);
  family.entitlements.active['MenoCompass Pro'].ownershipType = 'FAMILY_SHARED';
  assert.equal(commerce.subscriptionSnapshot(family).ownershipType, 'FAMILY_SHARED');
  assert.equal(Object.values(commerce.commerceEvents).some(name => name === 'af_purchase'), false);
});

test('commerce payload drops health values, IDs, receipts, messages and arbitrary enum values', () => {
  const output = commerce.commerceAttributes({
    access: 'active', storeEnvironment: 'sandbox', errorCode: '10', offeringId: 'default',
    notes: 'private', receipt: 'private', customerId: 'private', af_revenue: 20,
    reason: 'private error', productId: 'email@example.com', step: 4,
  });
  assert.deepEqual(JSON.parse(JSON.stringify(output)), {
    schemaVersion: 2, access: 'active', storeEnvironment: 'sandbox', offeringId: 'default', errorCode: '10',
  });
});

function paywallHarness() {
  const events = [];
  let closed = 0;
  const effects = [];
  const { TrackedPaywall } = load('TrackedPaywall.native.tsx', {
    react: { Component: class {}, useRef: value => ({ current: value }), useEffect: effect => effects.push(effect) },
    'react/jsx-runtime': { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) },
    'react-native': { View: 'View' },
    'react-native-purchases-ui': { default: { Paywall: 'Paywall' } },
    './commerce-events': commerce,
    './telemetry.native': {
      trackTelemetryEvent: (event, attributes) => events.push({ event, attributes }),
      setTelemetrySubscriptionState: () => {}, reportTelemetryError: () => {},
    },
  });
  const tree = TrackedPaywall({ offering: { identifier: 'default' }, source: 'automatic',
    onCustomer: () => {}, onClose: () => closed++, onFailure: () => closed++ });
  effects.forEach(effect => effect());
  effects.forEach(effect => effect()); // React StrictMode effect replay
  return { callbacks: tree.props.children.props.children.props, events, closed: () => closed };
}
const packageBeingPurchased = { product: { identifier: 'mc_monthly' }, packageType: 'MONTHLY' };

test('opening paywall does not count checkout; cancel and retry remain separate from dismissal', () => {
  const { callbacks, events, closed } = paywallHarness();
  assert.deepEqual(events.map(e => e.event), ['paywall_rendered']);
  assert.equal(callbacks.options.displayCloseButton, false);
  callbacks.onPurchaseStarted({ packageBeingPurchased });
  callbacks.onPurchaseCancelled();
  callbacks.onPurchaseStarted({ packageBeingPurchased });
  callbacks.onPurchaseError({ error: { code: '10', message: 'private' } });
  assert.equal(closed(), 0);
  assert.equal(events.at(-1).attributes.errorCode, '10');
  assert.equal('message' in events.at(-1).attributes, false);
  callbacks.onDismiss();
  callbacks.onDismiss();
  assert.equal(closed(), 1);
  assert.equal(events.filter(e => e.event === 'paywall_dismissed').length, 1);
});

test('sandbox purchase closes only with access, is not revenue and is not a dismissal', () => {
  const { callbacks, events, closed } = paywallHarness();
  callbacks.onPurchaseStarted({ packageBeingPurchased });
  callbacks.onPurchaseCompleted({ customerInfo: customer(true, true) });
  callbacks.onPurchaseCompleted({ customerInfo: customer(true, true) });
  callbacks.onDismiss();
  assert.equal(closed(), 1);
  assert.equal(events.filter(e => e.event === 'purchase_completed').length, 1);
  assert.equal(events.at(-1).attributes.storeEnvironment, 'sandbox');
  assert.equal(events.some(e => e.event === 'paywall_dismissed'), false);
});

test('empty restore and purchase without entitlement leave gate in place; successful restore is not a purchase', () => {
  const { callbacks, events, closed } = paywallHarness();
  callbacks.onRestoreStarted();
  callbacks.onRestoreCompleted({ customerInfo: customer() });
  assert.equal(closed(), 0);
  assert.equal(events.at(-1).attributes.access, 'inactive');
  callbacks.onPurchaseCompleted({ customerInfo: customer() });
  assert.equal(closed(), 0);
  callbacks.onRestoreCompleted({ customerInfo: customer(true) });
  assert.equal(closed(), 1);
  assert.equal(events.at(-1).event, 'subscription_restore_completed');
});

function telemetryHarness() {
  const sent = [];
  let sessionReady;
  let deadline;
  let failing = false;
  const failIfRequested = () => { if (failing) throw new Error('SDK unavailable'); };
  const api = load('telemetry.native.ts', {
    'expo-observe': { Observe: { configure() {}, logEvent: failIfRequested, setGlobalAttributes: failIfRequested, reportError: failIfRequested } },
    'expo-tracking-transparency': { getTrackingPermissionsAsync: async () => ({ status: 'denied' }) },
    'react-native': { Platform: { OS: 'ios' } },
    'expo-updates': { channel: 'production', runtimeVersion: 'test-runtime', updateId: 'test-update' },
    'react-native-appsflyer': { AFInAppEventType: { CONTENT_VIEW: 'af_content_view' }, AppsFlyer: {
      registerDeepLinkListener: async () => {}, init: async () => {},
      registerSessionReadyListener: async callback => { sessionReady = callback; },
      registerConversionListener: async () => {}, start: async () => {},
      getAppsFlyerUID: async () => 'test-uid', logEvent: event => { failIfRequested(); sent.push(event); return Promise.resolve(); },
    } },
    'react-native-fbsdk-next': { AppEventsLogger: { AppEvents: { ViewedContent: 'view' } }, Settings: {} },
    'react-native-purchases': { default: { isConfigured: async () => false } },
    './modules/menocompass-tiktok-business': { initializeTikTokBusiness: async () => {} },
    './commerce-events': commerce,
  }, { setTimeout: callback => { deadline = callback; return 1; }, clearTimeout: () => {} });
  return { ...api, sent, sessionReady: () => sessionReady, deadline: () => deadline, fail: () => { failing = true; } };
}

test('early events flush once after SDK readiness with original state and release metadata', async () => {
  const { initializeTelemetry, trackTelemetryEvent, setTelemetrySubscriptionState, sent, sessionReady } = telemetryHarness();
  setTelemetrySubscriptionState(customer());
  trackTelemetryEvent('paywall_requested', { source: 'automatic', notes: 'private' });
  setTelemetrySubscriptionState(customer(true, true));
  setTelemetrySubscriptionState(customer(true, true));
  assert.equal(sent.length, 0);
  const init = initializeTelemetry();
  for (let i = 0; i < 30 && !sessionReady(); i++) await Promise.resolve();
  assert.ok(sessionReady());
  sessionReady()();
  await init;
  assert.equal(sent.length, 3);
  assert.equal(sent[1].eventValues.access, 'inactive');
  assert.equal(sent[2].eventValues.storeEnvironment, 'sandbox');
  assert.equal(sent[1].eventValues.buildChannel, 'production');
  assert.equal(sent[1].eventValues.runtimeVersion, 'test-runtime');
  assert.equal(JSON.stringify(sent).includes('private'), false);
  await initializeTelemetry();
  assert.equal(sent.length, 3);
});

test('analytics timeout releases initialization and late SDK recovery still delivers buffered events', async () => {
  const harness = telemetryHarness();
  harness.trackTelemetryEvent('paywall_requested', { source: 'automatic' });
  const init = harness.initializeTelemetry();
  for (let i = 0; i < 30 && !harness.deadline(); i++) await Promise.resolve();
  assert.ok(harness.deadline());
  harness.deadline()();
  const result = await init;
  assert.equal(result.trackingPermission, 'denied');
  assert.equal(harness.sent.length, 0);
  harness.sessionReady()();
  for (let i = 0; i < 30 && !harness.sent.length; i++) await Promise.resolve();
  assert.equal(harness.sent.length, 1);
});

test('synchronous analytics SDK failures cannot throw into purchase or access callbacks', async () => {
  const harness = telemetryHarness();
  const init = harness.initializeTelemetry();
  for (let i = 0; i < 30 && !harness.sessionReady(); i++) await Promise.resolve();
  harness.sessionReady()();
  await init;
  harness.fail();
  assert.doesNotThrow(() => harness.trackTelemetryEvent('paywall_rendered'));
  assert.doesNotThrow(() => harness.setTelemetrySubscriptionState(customer(true, true)));
  assert.doesNotThrow(() => harness.reportTelemetryError(new Error('private')));
});
