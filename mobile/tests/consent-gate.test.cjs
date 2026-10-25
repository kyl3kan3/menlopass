const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const gateExports = {};
vm.runInNewContext(ts.transpileModule(
  fs.readFileSync(path.join(__dirname, '../consent-gate.ts'), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText, { exports: gateExports });
const { consentGatePhase } = gateExports;

test('saved consent hydrates with a loading gate, not the choice UI', () => {
  assert.equal(consentGatePhase(true, false, false), 'loading');
  assert.equal(consentGatePhase(false, false, true), 'app');
  assert.equal(consentGatePhase(false, false, false), 'choice');
});

test('first launch and profile review use the choice gate', () => {
  assert.equal(consentGatePhase(false, true, false), 'choice');
  assert.equal(consentGatePhase(false, true, true), 'choice');
});
