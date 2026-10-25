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
      if (name === '../shared/tracking-contract') return require('../../shared/tracking-contract');
      if (name === './analytics-session') return { uuid: require('node:crypto').randomUUID };
      if (!(name in mocks)) throw new Error(`Unexpected import ${name}`);
      return mocks[name];
    }, ...globals,
  }, { filename: file });
  return exports;
}
const commerce = load('commerce-events.ts');
const telemetryEvents = load('telemetry-events.ts', { './commerce-events': commerce });
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
    react: { Component: class {}, useRef: value => ({ current: value }), useState: value => [value, () => {}], useEffect: effect => effects.push(effect) },
    'react/jsx-runtime': { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) },
    'react-native': { View: 'View', Pressable: 'Pressable', Text: 'Text' },
    'react-native-purchases-ui': { __esModule: true, default: { Paywall: 'Paywall' } },
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
  const children = [tree.props.children.props.children].flat().filter(Boolean);
  return { callbacks: children.find(child => child.type === 'Paywall').props, events, closed: () => closed };
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
  assert.equal(events.find(e => e.event === 'purchase_completed').attributes.storeEnvironment, 'sandbox');
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
