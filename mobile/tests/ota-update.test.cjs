const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../ota-controller.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports: exportsObject });
const { createUpdateChecker } = exportsObject;

test('deduplicates overlapping checks and throttles foreground transitions', async () => {
  let time = 0, checks = 0, downloads = 0, release;
  const check = createUpdateChecker({
    check: () => { checks++; return new Promise(resolve => { release = resolve; }); },
    download: async () => { downloads++; },
  }, () => time);
  const first = check();
  time = 120000;
  await check();
  assert.equal(checks, 1);
  release({ isAvailable: true }); await first;
  assert.equal(downloads, 1);
  const second = check(); release({ isAvailable: false }); await second;
  await check();
  assert.equal(checks, 2);
  assert.equal(downloads, 1);
});

test('failed checks and failed downloads can retry after cooldown', async () => {
  let time = 0, checks = 0, downloads = 0;
  const check = createUpdateChecker({
    check: async () => { if (++checks === 1) throw new Error('offline'); return { isAvailable: true }; },
    download: async () => { if (++downloads === 1) throw new Error('interrupted'); },
  }, () => time);
  await assert.rejects(check(), /offline/);
  await check(); assert.equal(checks, 1);
  time += 60000; await assert.rejects(check(), /interrupted/);
  time += 60000; await check();
  assert.equal(downloads, 2);
});

test('downloads rollback directives as well as new bundles', async () => {
  let downloads = 0;
  await createUpdateChecker({ check: async () => ({ isAvailable: false, isRollBackToEmbedded: true }), download: async () => { downloads++; } })();
  assert.equal(downloads, 1);
});

const webSource = fs.readFileSync(path.join(__dirname, '../../app-views.js'), 'utf8');
const bridge = webSource.slice(webSource.indexOf("  window.addEventListener('menocompass-prepare-update'"), webSource.indexOf("  window.addEventListener('beforeunload', flush);"));
function prepare({ route = 'today', sheet = false, focused = false, onboarded = true } = {}) {
  let handler, flushed = false, message;
  vm.runInNewContext(bridge, {
    window: { addEventListener: (_event, fn) => { handler = fn; } },
    document: { activeElement: { matches: () => focused } },
    DB: { profile: { onboarded }, entries: {} }, sheetStack: sheet ? [{}] : [], curTab: route,
    flush: () => { flushed = true; },
    postNativeEvent: (type, payload) => { message = { type, ...payload }; },
  });
  handler({ detail: { id: 'request-1' } });
  return { flushed, message };
}
test('restart handshake flushes current record and echoes request ID', () => {
  const { flushed, message } = prepare();
  assert.equal(flushed, true);
  assert.equal(message.id, 'request-1');
  assert.equal(message.type, 'ota-restart-state');
  assert.equal(JSON.parse(message.state).profile.onboarded, true);
});
test('restart handshake refuses editors, sheets, focused inputs and onboarding', () => {
  for (const input of [{ route: 'checkin' }, { route: 'profile' }, { route: 'care' }, { sheet: true }, { focused: true }, { onboarded: false }]) {
    const { flushed, message } = prepare(input);
    assert.equal(flushed, false);
    assert.equal(message.safe, false);
    assert.equal(message.state, undefined);
  }
});

function bannerHarness(prepareRestart) {
  const state = [], refs = [];
  let slot = 0, refSlot = 0, safe = true, reloads = 0;
  const output = {};
  const jsx = (type, props) => ({ type, props });
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../OtaUpdate.native.tsx'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, {
    exports: output, __DEV__: false, setInterval: () => 1, clearInterval() {},
    require: name => ({
      'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'fragment' },
      'react': {
        useState: initial => { const i = slot++; if (!(i in state)) state[i] = initial; return [state[i], value => { state[i] = value; }]; },
        useRef: initial => refs[refSlot++] ||= { current: initial },
        useEffect: fn => fn(),
      },
      'expo-updates': { isEnabled: true, reloadAsync: async () => { reloads++; } },
      'react-native': { View: 'View', Text: 'Text', Modal: 'Modal', Pressable: 'Pressable', ActivityIndicator: 'Spinner', StyleSheet: { create: value => value } },
      './ota-controller': { createUpdateChecker },
    })[name],
  });
  const update = { isUpdatePending: true, defer: key => { update.deferred = key; } };
  const render = () => {
    slot = 0; refSlot = 0;
    return output.OtaUpdateBanner({ update, isSafe: () => safe, prepareRestart });
  };
  function find(node, label) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'Pressable' && node.props.children?.props.children === label) return node;
    for (const child of [node.props?.children].flat()) { const result = find(child, label); if (result) return result; }
  }
  render();
  return { button: label => find(render(), label), setSafe: value => { safe = value; }, reloads: () => reloads };
}
const settle = () => new Promise(resolve => setImmediate(resolve));
test('Restart waits for save acknowledgement and prevents duplicate presses', async () => {
  let release, saves = 0;
  const h = bannerHarness(() => { saves++; return new Promise(resolve => { release = resolve; }); });
  const button = h.button('Restart now');
  button.props.onPress(); button.props.onPress();
  assert.equal(saves, 1); assert.equal(h.reloads(), 0);
  release(); await settle(); assert.equal(h.reloads(), 1);
});
test('failed save or newly unsafe activity prevents reload; Later hides ready prompt', async () => {
  const failed = bannerHarness(async () => { throw new Error('disk full'); });
  failed.button('Restart now').props.onPress(); await settle(); assert.equal(failed.reloads(), 0);
  let release;
  const h = bannerHarness(() => new Promise(resolve => { release = resolve; }));
  h.button('Restart now').props.onPress(); h.setSafe(false); release();
  await settle(); assert.equal(h.reloads(), 0);
  const later = bannerHarness(async () => {});
  later.button('Later').props.onPress();
  assert.equal(later.button('Restart now'), undefined);
  assert.equal(later.reloads(), 0);
});
