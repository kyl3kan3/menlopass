const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../onboarding-variant.ts'), 'utf8');
const mod = {};
vm.runInNewContext(
  ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
  { exports: mod, module: { exports: mod } },
);
const {
  ONBOARDING_VARIANT_METADATA_KEY,
  ONBOARDING_VARIANT_V2_VALUE,
  flowVersionForVariant,
  onboardingVariantFromOffering,
} = mod;

test('offering metadata selects the v2 onboarding variant', () => {
  assert.equal(ONBOARDING_VARIANT_METADATA_KEY, 'onboarding_variant');
  assert.equal(ONBOARDING_VARIANT_V2_VALUE, 'v2');
  assert.equal(onboardingVariantFromOffering(null), 'control');
  assert.equal(onboardingVariantFromOffering({ metadata: {} }), 'control');
  assert.equal(onboardingVariantFromOffering({ metadata: { onboarding_variant: 'control' } }), 'control');
  assert.equal(onboardingVariantFromOffering({ metadata: { onboarding_variant: 'V2' } }), 'v2');
  assert.equal(flowVersionForVariant('control'), 2);
  assert.equal(flowVersionForVariant('v2'), 3);
});
