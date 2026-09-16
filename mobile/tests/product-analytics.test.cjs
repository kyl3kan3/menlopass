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
