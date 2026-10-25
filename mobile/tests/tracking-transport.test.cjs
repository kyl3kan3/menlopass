const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const crypto = require('node:crypto');
const contract = require('../../shared/tracking-contract');
function load(file, mocks, globals = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, __DEV__: false, console, setTimeout, clearTimeout, AbortController,
    process: { env: { EXPO_PUBLIC_ANALYTICS_API_URL: 'https://peri.example', EXPO_PUBLIC_POSTHOG_API_KEY: 'phc_test', EXPO_PUBLIC_POSTHOG_HOST: 'https://us.i.posthog.com' } },
    require: name => { if (!(name in mocks)) throw new Error(name); return mocks[name]; }, ...globals });
  return exports;
}
const settle = async () => { for (let i = 0; i < 80; i++) await Promise.resolve(); };
function transport(store = new Map(), fetcher = async () => ({ ok: true })) {
  let allowed = false, epoch = 0;
  const requests = [];
  const mocks = {
    'expo-crypto': { CryptoDigestAlgorithm: { SHA256: 'sha256' }, digestStringAsync: async (_a, s) => crypto.createHash('sha256').update(s).digest('hex') },
    'expo-secure-store': { getItemAsync: async key => store.get(key), setItemAsync: async (key, value) => { store.set(key, value); } },
    './analytics-consent': { analyticsAllowed: () => allowed, consentEpoch: () => epoch },
    './analytics-session': { uuid: crypto.randomUUID, sessionContext: () => ({ sessionId: '01994123-abcd-7000-8000-000000000000' }) },
    './telemetry-events': { telemetryAttributes: (event, attrs) => contract.project(event, attrs, ['peri_monthly']) },
  };
  const api = load('analytics-transport.ts', mocks, { fetch: async (url, options) => { requests.push({ url, ...options }); return fetcher(url, options); },
    setTimeout: (fn, delay) => delay < 8000 ? setTimeout(fn, 0) : setTimeout(fn, delay),
  });
  return { ...api, requests, store, consent: value => { allowed = value; epoch++; } };
}
test('no optional request before consent; retries retain UUID and captured properties', async () => {
  let failures = 2;
  const t = transport(undefined, async () => failures-- > 0 ? { ok: false, status: 503 } : { ok: true });
  await t.sendProductEvent('purchase_started', {}); assert.equal(t.requests.length, 0);
  t.consent(true); await t.sendProductEvent('purchase_started', { productId: 'peri_monthly', notes: 'private' });
  assert.equal(t.requests.length, 3);
  assert.equal(new Set(t.requests.map(r => r.body)).size, 1);
  assert.equal(t.requests[0].body.includes('private'), false);
});
test('persisted installation observation keeps its UUID across failed sends and process restart', async () => {
  const store = new Map();
  const first = transport(store, async () => ({ ok: false, status: 503 })); first.consent(true);
  await first.sendInstallObservation();
  const next = transport(store); next.consent(true); await next.sendInstallObservation(); await next.sendInstallObservation();
  assert.equal(next.requests.length, 1);
  assert.equal(JSON.parse(first.requests[0].body).id, JSON.parse(next.requests[0].body).id);
});
test('opt-out aborts in-flight requests and prevents retries', async () => {
  const t = transport(undefined, (_url, options) => new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(new Error('aborted')))));
  t.consent(true); const sending = t.sendProductEvent('paywall_rendered', {}); await settle();
  t.consent(false); t.cancelAnalyticsRequests(); await sending;
  assert.equal(t.requests.length, 1); assert.equal(t.requests[0].signal.aborted, true);
});
test('erasure persists offline, retries without analytics consent and prevents identity reuse', async () => {
  const store = new Map(); let offline = true;
  const t = transport(store, async () => { if (offline) throw new Error('offline'); return { ok: true }; });
  t.consent(true); const before = await t.analyticsPseudonym();
  t.consent(false); assert.equal(await t.eraseAnalytics(), false);
  assert.equal(await t.analyticsPseudonym(), undefined);
  offline = false; assert.equal(await t.retryAnalyticsErasure(), true);
  await t.prepareAnalyticsIdentity(); assert.notEqual(await t.analyticsPseudonym(), before);
  const token = JSON.parse(store.values().next().value).token;
  const hash = input => crypto.createHash('sha256').update(input).digest('hex');
  assert.equal(await t.analyticsPseudonym(), 'peri_' + hash(`peri:analytics:v1:${hash(token)}`));
});
test('replay defaults fully masked, drops SDK product events, and opt-out during readiness prevents recording', async () => {
  let allowed = true, epoch = 0, release, options;
  const calls = [];
  class PostHog {
    constructor(_key, config) { options = config; }
    ready() { return new Promise(resolve => release = resolve); }
    identify(id) { calls.push(['identify', id]); }
    async optIn() { calls.push(['in']); }
    async optOut() { calls.push(['out']); }
    async startSessionRecording() { calls.push(['record']); }
    async stopSessionRecording() { calls.push(['stop']); }
    reset() {}
  }
  const replay = load('posthog.native.ts', { 'posthog-react-native': { PostHog },
    './analytics-consent': { analyticsAllowed: () => allowed, consentEpoch: () => epoch },
    './analytics-transport': { analyticsPseudonym: async () => 'peri_test', sendProductEvent: async () => {} },
  });
  replay.setReplayRoute(true); const init = replay.initializeProductAnalytics(); await settle();
  allowed = false; epoch++; await replay.stopProductAnalytics(); release(); await init;
  assert.equal(calls.some(c => c[0] === 'record'), false);
  assert.equal(options.before_send({ event: 'private' }), null);
  assert.equal(options.sessionReplayConfig.maskAllTextInputs, true);
  assert.equal(options.sessionReplayConfig.captureNetworkTelemetry, false);
  allowed = true; epoch++; await replay.initializeProductAnalytics();
  assert.equal(calls.some(c => c[0] === 'record'), true);
  replay.setReplayRoute(false); await settle(); assert.equal(calls.at(-1)[0], 'stop');
});
test('crash sanitization removes content while retaining safe frame positions and release context', () => {
  let options;
  const api = load('error-reporting.ts', {
    '@sentry/react-native': { init: value => { options = value; }, captureException: () => {} },
    'expo-updates': { updateId: 'embedded', runtimeVersion: 'test', channel: 'preview' },
  }, { Error });
  const error = new Error('private health message'); error.stack = 'Error: private\n    at private (https://private?secret:10:20)';
  const safe = api.safeError(error);
  assert.equal(safe.stack.includes('private'), false); assert.ok(safe.stack.includes('10:20'));
  const result = options.beforeSend({ type: undefined, release: 'peri@1', user: { email: 'private' }, request: { url: 'private' }, extra: { note: 'private' }, breadcrumbs: [{ message: 'private' }], exception: { values: [{ type: 'TypeError', value: 'private', stacktrace: { frames: [{ filename: 'private', function: 'private', vars: { note: 'private' }, lineno: 10, colno: 20 }] } }] } });
  assert.equal(JSON.stringify(result).includes('private'), false);
  assert.equal(result.exception.values[0].stacktrace.frames[0].lineno, 10);
  assert.equal(options.attachScreenshot, false); assert.equal(options.tracesSampleRate, 0);
});
