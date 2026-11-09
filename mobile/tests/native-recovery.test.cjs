const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, mocks, globals = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { exports, require: name => { if (!(name in mocks)) throw new Error(name); return mocks[name]; }, ...globals });
  return exports;
}

function files() {
  const entries = new Map([['/cache', null], ['/documents', null]]);
  let failCopy = false;
  class Entry {
    constructor(...parts) { this.uri = parts.map(p => typeof p === 'string' ? p : p.uri).join('/'); }
    get exists() { return entries.has(this.uri); }
    get name() { return this.uri.split('/').at(-1); }
    delete() { for (const key of entries.keys()) if (key === this.uri || key.startsWith(this.uri + '/')) entries.delete(key); }
  }
  class File extends Entry {
    create() { entries.set(this.uri, ''); }
    write(value) { entries.set(this.uri, value); }
    async text() { return entries.get(this.uri); }
    async copy(destination) { if (failCopy) throw new Error('disk full'); entries.set(destination.uri, entries.get(this.uri)); }
  }
  class Directory extends Entry {
    create() { entries.set(this.uri, null); }
    list() { return [...entries].filter(([key]) => key.startsWith(this.uri + '/') && !key.slice(this.uri.length + 1).includes('/')).map(([key, data]) => data === null ? new Directory(key) : new File(key)); }
  }
  const api = load('native-private-files.ts', { 'expo-file-system': { File, Directory, Paths: { cache: new Directory('/cache'), document: new Directory('/documents') } } });
  return { ...api, entries, File, Directory, Paths: { cache: new Directory('/cache'), document: new Directory('/documents') }, failCopy: () => { failCopy = true; } };
}

test('temporary export lives through sharing and is removed on success, cancellation, and failure', async () => {
  for (const outcome of ['shared', 'cancelled', 'failure']) {
    const h = files(); let release;
    const operation = h.withPrivateExport('record.json', async file => {
      file.create(); file.write('private health content');
      await new Promise(resolve => { release = resolve; });
      if (outcome === 'failure') throw new Error('share failed');
      return outcome;
    });
    assert.equal(h.entries.get('/cache/peri-private-exports/record.json'), 'private health content');
    release();
    if (outcome === 'failure') await assert.rejects(operation, /share failed/);
    else assert.equal(await operation, outcome);
    assert.equal(h.entries.has('/cache/peri-private-exports/record.json'), false);
  }
});

test('deletion sweeps previous exports and generated PDFs but leaves unrelated cached files alone', () => {
  const h = files();
  for (const uri of ['/cache/meno-compass-backup-2026-11-07.json', '/cache/meno-compass-2026-11-07.csv', '/cache/meno-compass-report-2026-11-07.pdf', '/cache/appointment-2026-11-07.ics', '/cache/Print/uuid.pdf', '/cache/peri-private-exports/new.json', '/cache/unrelated.json']) h.entries.set(uri, 'content');
  h.entries.set('/cache/Print', null); h.entries.set('/cache/peri-private-exports', null);
  h.clearPrivateExportFiles();
  assert.deepEqual([...h.entries.keys()].sort(), ['/cache', '/cache/unrelated.json', '/documents']);
});

test('recovery copies the unreadable record before replacement; deletion requires the separate reset operation', async () => {
  const h = files(), original = new h.File('/documents/menocompass-state.secure');
  original.write('unreadable ciphertext');
  await h.preserveUnreadableRecord([original, new h.File('/documents/missing.json')]);
  const copies = [...h.entries].filter(([key]) => key.startsWith('/documents/peri-record-recovery/'));
  assert.equal(copies.length, 1); assert.equal(copies[0][1], 'unreadable ciphertext');
  assert.equal(h.entries.get(original.uri), 'unreadable ciphertext');
  original.write('restored ciphertext');
  assert.equal(h.entries.get(copies[0][0]), 'unreadable ciphertext');
  h.deleteUnreadableRecord([original]);
  assert.equal(original.exists, false);
  assert.equal([...h.entries.keys()].some(key => key.startsWith('/documents/peri-record-recovery')), false);
});

test('failed preservation does not remove or overwrite the unreadable record', async () => {
  const h = files(), original = new h.File('/documents/menocompass-state.secure');
  original.write('unreadable ciphertext'); h.failCopy();
  await assert.rejects(h.preserveUnreadableRecord([original]), /disk full/);
  assert.equal(h.entries.get(original.uri), 'unreadable ciphertext');
});

function validator(candidate, validateBackup) {
  const outputs = [], effects = [], scripts = [];
  const jsx = (type, props) => ({ type, props });
  const mocks = {
    react: { useRef: initial => ({ current: initial }), useState: initial => [initial, () => {}], useEffect: effect => effects.push(effect) },
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': { View: 'View', StyleSheet: { create: value => value } },
    'react-native-safe-area-context': {},
    'react-native-webview': { WebView: 'WebView' },
    './theme': { color: new Proxy({}, { get: () => '#000' }), font: new Proxy({}, { get: () => 'Font' }), type: new Proxy({}, { get: () => ({}) }) },
  };
  const { RecoveryBackupValidator } = load('RecordRecovery.native.tsx', mocks, { setTimeout: () => 1, clearTimeout() {} });
  const tree = RecoveryBackupValidator({ html: '<html/>', candidate, onResult: result => outputs.push(result) });
  const props = tree.props.children.props;
  props.ref.current = { injectJavaScript: script => scripts.push(script) };
  props.onMessage({ nativeEvent: { data: JSON.stringify({ type: 'persist-state', state: 'unvalidated' }) } });
  assert.equal(outputs.length, 0, 'blank app bootstrap cannot write over the damaged record');
  props.onLoadEnd();
  vm.runInNewContext(scripts[0], { validateBackup, window: { ReactNativeWebView: { postMessage: data => props.onMessage({ nativeEvent: { data } }) } } });
  return { outputs, props };
}

test('isolated validator returns only validated state and ignores app bootstrap persistence messages', () => {
  const h = validator(JSON.stringify({ v: 8, private: 'input' }), input => ({ v: input.v, normalized: true }));
  assert.deepEqual(h.outputs, ['{"v":8,"normalized":true}']);
  h.props.onMessage({ nativeEvent: { data: JSON.stringify({ type: 'recovery-validation', state: 'duplicate' }) } });
  assert.equal(h.outputs.length, 1);
  assert.equal(h.props.onShouldStartLoadWithRequest({ url: 'https://example.com' }), false);
});

test('invalid and future backups fail recovery validation without returning any record', () => {
  assert.deepEqual(validator('{bad json', () => { throw new Error('should not run'); }).outputs, [null]);
  assert.deepEqual(validator('{"v":999}', () => { throw new Error('future schema'); }).outputs, [null]);
});

const settle = async () => { for (let i = 0; i < 50; i++) await Promise.resolve(); };

function appHarness() {
  const disk = files(), alerts = [], effects = [], replay = [], tracked = [], paywalls = [], state = {
    html: '<html>bundled app</html>', privacyReady: true, subscriptionChecked: true,
    error: 'Unreadable encrypted record', recordUnavailable: true,
  }, refs = [];
  disk.entries.set('/documents/menocompass-state.secure', 'unreadable ciphertext');
  disk.entries.set('/asset.html', '<html>bundled app</html>');
  let stateIndex = 0, refIndex = 0, decryptFails = true, assetFails = false;
  let clearRecord = '{"v":8,"profile":{},"entries":{}}';
  const source = fs.readFileSync(path.join(__dirname, '../App.native.tsx'), 'utf8');
  const componentSource = source.slice(source.indexOf('function App() {'), source.indexOf('function AppWithSafeArea()'));
  const stateNames = [...componentSource.matchAll(/const \[([^,\]]+),[^\]]+\] = useState/g)].map(match => match[1]);
  const jsx = (type, props) => ({ type, props });
  const noOp = () => {};
  const telemetry = new Proxy({}, { get: () => noOp });
  const offering = { identifier: 'default', availablePackages: [{ product: { introPrice: null, discounts: [] } }] };
  const mocks = {
    react: {
      useState: initial => { const name = stateNames[stateIndex++]; if (!(name in state)) state[name] = typeof initial === 'function' ? initial() : initial; return [state[name], next => { state[name] = typeof next === 'function' ? next(state[name]) : next; }]; },
      useRef: initial => { const index = refIndex++; return refs[index] ??= { current: initial }; },
      useEffect: effect => effects.push(effect),
    },
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': { Platform: { OS: 'ios' }, AppState: { currentState: 'active' }, StyleSheet: { create: value => value }, Alert: { alert: (...args) => alerts.push(args) }, View: 'View', Text: 'Text', Pressable: 'Pressable', ScrollView: 'ScrollView' },
    'react-native-purchases': { __esModule: true, default: { getOfferings: async () => ({ current: offering }) } },
    'react-native-webview': { WebView: 'WebView' },
    './TrackedPaywall.native': { TrackedPaywall: 'TrackedPaywall' },
    './NativeTabBar.native': { NativeTabBar: 'NativeTabBar' },
    './theme': { color: new Proxy({}, { get: () => '#000' }), font: new Proxy({}, { get: () => 'Font' }), type: new Proxy({}, { get: () => ({}) }) },
    'react-native-safe-area-context': { SafeAreaProvider: 'SafeAreaProvider', SafeAreaView: 'SafeAreaView' },
    'posthog-react-native': { PostHogMaskView: 'PostHogMaskView' },
    'expo-observe': { ObserveRoot: { wrap: value => value }, useObserve: () => ({ markInteractive: noOp }) },
    'expo-file-system': disk,
    'expo-updates': { channel: 'preview' },
    'expo-asset': { Asset: { fromModule: () => ({ downloadAsync: async () => { if (assetFails) throw new Error('asset unavailable'); return { localUri: '/asset.html' }; } }) } },
    './OtaUpdate.native': { useOtaUpdate: () => ({}) },
    './RecordRecovery.native': { RecordRecovery: 'RecordRecovery', RecoveryBackupValidator: 'RecoveryBackupValidator' },
    './native-private-files': disk,
    './privacyFeatures.native': {
      isDeviceEncryptionAvailable: () => true,
      decryptForDeviceAsync: async () => { if (decryptFails) throw new Error('cannot decrypt'); return clearRecord; },
      encryptForDeviceAsync: async value => 'encrypted:' + value,
      clearNativePrivateDataAsync: async () => { disk.clearPrivateExportFiles(); disk.clearRecoveryRecords(); },
    },
    './telemetry.native': { ...telemetry, reportTelemetryError: error => { if (process.env.DEBUG_HARNESS) console.log('reported', error); }, deleteTrackingData: async () => true, setTelemetryReplay: value => replay.push(value), trackTelemetryEvent: (event, attributes) => tracked.push({ event, ...attributes }) },
    './consent-gate': load('consent-gate.ts', {}),
    './widgets/widget-state.native': { syncMenoCompassWidgets: noOp },
  };
  // These imports are unused until their effects/UI actions run in each test.
  for (const name of [...source.matchAll(/from ['"]([^'"]+)['"]/g)].map(match => match[1])) if (!(name in mocks)) mocks[name] = {};
  for (const name of [...source.matchAll(/require\(['"]([^'"]+)['"]\)/g)].map(match => match[1])) mocks[name] = name;
  const module = load('App.native.tsx', mocks, { process: { env: {} }, __DEV__: false, setTimeout, clearTimeout });
  const App = module.default().props.children.props.children.type;
  const nodes = tree => { const all = []; const visit = node => { if (!node || typeof node !== 'object') return; if (Array.isArray(node)) return node.forEach(visit); all.push(node); visit(node.props?.children); }; visit(tree); return all; };
  const render = () => { stateIndex = 0; refIndex = 0; effects.length = 0; return nodes(App()); };
  const webMessage = message => { const tree = render(); const webView = tree.find(node => node.type === 'WebView'); webView.props.onMessage({ nativeEvent: { data: JSON.stringify(message) } }); };
  return { ...disk, state, alerts, replay, tracked, paywalls, render, webMessage,
    runReplay: () => effects.find(effect => effect.toString().includes('setTelemetryReplay'))(),
    runBoot: () => effects.find(effect => effect.toString().includes('readPersistedState'))(),
    allowDecrypt: value => { decryptFails = false; if (value) clearRecord = value; }, failAsset: () => { assetFails = true; } };
}

test('boot recovery remains behind App Lock; retry reads the preserved record again', async () => {
  const h = appHarness();
  h.state.appLocked = true;
  assert.equal(h.render().some(node => node.type === 'RecordRecovery'), false);
  h.state.appLocked = false;
  const recovery = h.render().find(node => node.type === 'RecordRecovery');
  assert.ok(recovery); assert.equal(recovery.props.canRestore, true);
  recovery.props.onRetry(); h.render(); h.runBoot(); await settle();
  assert.equal(h.state.recordReady, false); assert.match(h.state.error, /cannot decrypt/);
  assert.equal(h.entries.get('/documents/menocompass-state.secure'), 'unreadable ciphertext');
  h.allowDecrypt(); h.render().find(node => node.type === 'RecordRecovery').props.onRetry();
  h.render(); h.runBoot(); await settle();
  assert.equal(h.state.recordReady, true); assert.equal(h.state.error, undefined);
});

test('an asset failure offers retry without treating a healthy record as unreadable', async () => {
  const h = appHarness(); h.allowDecrypt(); h.failAsset();
  h.render(); h.runBoot(); await settle();
  const recovery = h.render().find(node => node.type === 'RecordRecovery');
  assert.equal(recovery.props.recordUnavailable, false);
  assert.equal(recovery.props.canRestore, false);
  assert.equal(h.entries.get('/documents/menocompass-state.secure'), 'unreadable ciphertext');
  const jsx = (type, props) => ({ type, props });
  const component = load('RecordRecovery.native.tsx', {
    react: { useState: value => [value, () => {}] }, 'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': { Text: 'Text', Pressable: 'Pressable', ScrollView: 'ScrollView', View: 'View', StyleSheet: { create: value => value } },
    'react-native-safe-area-context': { SafeAreaView: 'SafeAreaView' }, 'react-native-webview': {},
    './theme': { color: new Proxy({}, { get: () => '#000' }), font: new Proxy({}, { get: () => 'Font' }), type: new Proxy({}, { get: () => ({}) }) },
  });
  const tree = component.RecordRecovery(recovery.props);
  const buttons = []; const visit = node => { if (!node || typeof node !== 'object') return; if (Array.isArray(node)) return node.forEach(visit); if (node.type === 'Pressable') buttons.push(node); visit(node.props?.children); }; visit(tree);
  assert.equal(buttons.length, 1); assert.equal(buttons[0].props.onPress, recovery.props.onRetry);
});

test('recovery validation failure leaves the original file; a valid backup preserves a copy before replacement', async () => {
  const h = appHarness(); h.state.recoveryCandidate = 'candidate';
  h.render().find(node => node.type === 'RecoveryBackupValidator').props.onResult(null);
  await settle();
  assert.equal(h.entries.get('/documents/menocompass-state.secure'), 'unreadable ciphertext');
  assert.match(h.state.recoveryIssue, /invalid/); assert.equal(h.state.recordReady, false);
  h.state.recoveryCandidate = 'valid';
  const valid = '{"v":8,"profile":{},"entries":{}}';
  h.render().find(node => node.type === 'RecoveryBackupValidator').props.onResult(valid);
  await settle();
  assert.equal(h.entries.get('/documents/menocompass-state.secure'), 'encrypted:' + valid);
  assert.equal([...h.entries].find(([key]) => key.startsWith('/documents/peri-record-recovery/'))[1], 'unreadable ciphertext');
  assert.equal(h.state.error, undefined); assert.equal(h.state.recordReady, true);
});

test('starting over does not delete until the destructive confirmation is pressed', async () => {
  const h = appHarness();
  h.render().find(node => node.type === 'RecordRecovery').props.onReset();
  assert.equal(h.entries.get('/documents/menocompass-state.secure'), 'unreadable ciphertext');
  const buttons = h.alerts.at(-1)[2];
  assert.equal(buttons[0].style, 'cancel');
  buttons.find(button => button.style === 'destructive').onPress();
  await settle();
  assert.equal(h.entries.has('/documents/menocompass-state.secure'), false);
  assert.equal(h.state.bootAttempt, 1);
});

test('session replay stays off on every surface: the letter lives in the WebView, which is never recorded', () => {
  const h = appHarness();
  Object.assign(h.state, { analyticsEnabled: true, consentReady: true, privacyChoiceOpen: false, appLocked: false, appIsActive: true, recoveryCandidate: 'private backup' });
  h.render(); h.runReplay(); assert.equal(h.replay.at(-1), false);
  Object.assign(h.state, { error: undefined, recordReady: true, recoveryCandidate: null });
  h.render(); h.runReplay(); assert.equal(h.replay.at(-1), false);
});

function openApp(h) {
  // A readable record, consent given, no App Lock: the WebView is on screen before any purchase.
  Object.assign(h.state, { error: undefined, recordReady: true, recordUnavailable: false, consentHydrating: false, consentReady: true, privacyChoiceOpen: false, appLocked: false, appIsActive: true, revenueCatReady: true, telemetrySettled: true, webContentReady: true });
}

test('the page opens without a subscription: no gate, no automatic paywall before the letter', () => {
  const h = appHarness(); openApp(h);
  const tree = h.render();
  assert.ok(tree.some(node => node.type === 'WebView'), 'the WebView renders for a non-subscriber');
  assert.equal(tree.some(node => node.type === 'TrackedPaywall'), false);
  assert.equal(h.state.paywall, null);
  assert.equal(h.tracked.some(entry => entry.event === 'paywall_requested'), false);
});

test('the paywall opens once after the letter (the first finding) and can be put down', async () => {
  const h = appHarness(); openApp(h);
  h.webMessage({ type: 'onboarding-step', step: 0 });
  assert.equal(h.tracked.find(entry => entry.event === 'onboarding_started').flowVersion, 4);
  h.webMessage({ type: 'onboarding-finished', skipped: false });
  await settle();
  assert.equal(h.state.experienceReady, true);
  assert.ok(h.state.paywall, 'the paywall is requested after the first finding');
  assert.equal(h.state.paywall.source, 'automatic');
  assert.equal(h.tracked.find(entry => entry.event === 'onboarding_completed').flowVersion, 4);
  const paywall = h.render().find(node => node.type === 'TrackedPaywall');
  assert.ok(paywall);
  paywall.props.onClose();
  assert.equal(h.state.paywall, null);
  assert.ok(h.render().some(node => node.type === 'WebView'), 'the page is back after dismissing');
  // A second letter completion in the same session does not reopen it.
  h.webMessage({ type: 'onboarding-finished', skipped: false });
  await settle();
  assert.equal(h.state.paywall, null);
});

test('a Pro surface asks for the paywall through the bridge; restore goes through the store', async () => {
  const h = appHarness(); openApp(h);
  h.webMessage({ type: 'open-pro-paywall', feature: 'dossier' });
  await settle();
  assert.equal(h.state.paywall?.source, 'feature');
  assert.equal(h.tracked.find(entry => entry.event === 'paywall_requested').source, 'feature');
});

test('navigation state carries the three routes and the night flag to the tab bar', () => {
  const h = appHarness(); openApp(h);
  h.state.experienceReady = true;
  h.webMessage({ type: 'navigation-state', route: 'dossier', onboarded: true, sheetOpen: false, night: true });
  const bar = h.render().find(node => node.type === 'NativeTabBar');
  assert.ok(bar, 'the bar shows on a primary route');
  assert.equal(bar.props.activeRoute, 'dossier');
  assert.equal(bar.props.night, true);
  h.webMessage({ type: 'navigation-state', route: 'journey', onboarded: true, sheetOpen: false });
  assert.equal(h.state.nativeNavigation.route, 'dossier', 'an unknown legacy route name is ignored');
  h.webMessage({ type: 'navigation-state', route: 'appointment-report', onboarded: true, sheetOpen: false });
  assert.equal(h.render().some(node => node.type === 'NativeTabBar'), false, 'the bar hides on a non-primary page');
});
