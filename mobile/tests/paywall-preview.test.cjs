const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function harness() {
  const exports = {}, events = [], customers = [], closed = [];
  const jsx = (type, props) => ({ type, props });
  const mocks = {
    react: { Component: class {}, useRef: current => ({ current }), useState: initial => [initial, () => {}], useEffect: callback => callback() },
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': { View: 'View', Pressable: 'Pressable', Text: 'Text', StyleSheet: { create: value => value } },
    './theme': { color: new Proxy({}, { get: () => '#000' }), font: new Proxy({}, { get: () => 'Font' }), type: new Proxy({}, { get: () => ({}) }) },
    'react-native-purchases-ui': { __esModule: true, default: { Paywall: 'Paywall' } },
    './commerce-events': { subscriptionSnapshot: customer => ({ access: customer.entitlements.active['MenoCompass Pro'] ? 'active' : 'inactive' }) },
    './telemetry.native': { trackTelemetryEvent: (name, attributes) => events.push({ name, attributes }), setTelemetrySubscriptionState: () => {}, reportTelemetryError: () => {} },
  };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../TrackedPaywall.native.tsx'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText, { exports, require: name => { if (name === './analytics-session') return { uuid: require('node:crypto').randomUUID }; if (!(name in mocks)) throw new Error(name); return mocks[name]; } });
  const tree = exports.TrackedPaywall({ offering: { identifier: 'test-offering' }, source: 'subscribe_button', onCustomer: customer => customers.push(customer), onClose: () => closed.push(true), onFailure: () => {} });
  const nodes = [];
  const visit = node => { if (!node || typeof node !== 'object') return; if (Array.isArray(node)) { node.forEach(visit); return; } nodes.push(node); visit(node.props?.children); };
  visit(tree);
  return { events, customers, closed, sdk: nodes.find(node => node.type === 'Paywall').props, back: nodes.find(node => node.type === 'Pressable')?.props };
}

test('putting the sheet down is blocked during StoreKit and works after cancellation without granting access', () => {
  const h = harness();
  h.sdk.onPurchaseStarted({ packageBeingPurchased: { product: { identifier: 'test-monthly' }, packageType: 'MONTHLY' } });
  h.back.onPress(); assert.equal(h.closed.length, 0);
  h.sdk.onPurchaseCancelled(); h.back.onPress(); h.sdk.onDismiss();
  assert.equal(h.closed.length, 1);
  assert.equal(h.customers.length, 0);
  assert.equal(h.events.filter(event => event.name === 'paywall_dismissed').length, 1);
});

test('restore without an entitlement stays gated and successful purchase closes exactly once', () => {
  const h = harness();
  h.sdk.onRestoreStarted(); h.sdk.onRestoreCompleted({ customerInfo: { entitlements: { active: {} } } });
  assert.equal(h.closed.length, 0);
  h.sdk.onPurchaseCompleted({ customerInfo: { entitlements: { active: { 'MenoCompass Pro': {} } } } });
  h.sdk.onDismiss();
  assert.equal(h.closed.length, 1);
  assert.equal(h.events.filter(event => event.name === 'purchase_completed').length, 1);
});

test('the sheet always has a way down, in the wrapper rather than the SDK close button', () => {
  const h = harness();
  assert.ok(h.back, 'the wrapper renders Not now');
  assert.equal(h.back.accessibilityLabel, 'Not now');
  assert.equal(h.sdk.options.displayCloseButton, false);
  assert.equal(h.sdk.options.offering.identifier, 'test-offering');
});
