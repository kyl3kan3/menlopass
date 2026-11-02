const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function loadTs(relativePath, customRequire) {
  const source = fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
  const mod = {};
  vm.runInNewContext(
    ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
    {
      exports: mod,
      module: { exports: mod },
      require: customRequire || require,
      __DEV__: false,
      URL,
    },
  );
  return mod;
}

const variantMod = loadTs('onboarding-variant.ts');
const mobileRequire = (id) => {
  if (id === './onboarding-variant') return variantMod;
  if (id === './onboarding-model') return require('../onboarding-model');
  return require(path.join(__dirname, '..', id));
};

const routeMod = loadTs('onboarding-tester-route.ts');
const gateMod = loadTs('onboarding-tester-gate.ts', mobileRequire);

test('onboarding tester deep links parse from menlopass URLs', () => {
  const { onboardingTesterRouteFromUrl } = routeMod;
  assert.equal(onboardingTesterRouteFromUrl('menlopass://onboarding-v2'), 'force-v2');
  assert.equal(onboardingTesterRouteFromUrl('menlopass://onboarding-control'), 'clear-override');
  assert.equal(onboardingTesterRouteFromUrl('rc-0fcafb99f0://onboarding-v2'), 'force-v2');
  assert.equal(onboardingTesterRouteFromUrl('https://example.com/onboarding-v2'), null);
  assert.equal(onboardingTesterRouteFromUrl('menlopass://checkin'), null);
});

test('tester override gate blocks App Store production installs', () => {
  const { allowsOnboardingTesterOverride } = gateMod;
  assert.equal(allowsOnboardingTesterOverride({
    isDev: false,
    buildChannel: 'production',
    storeEnvironment: 'production',
    usesSandboxAppStoreReceipt: false,
  }), false);
  assert.equal(allowsOnboardingTesterOverride({
    isDev: false,
    buildChannel: 'production',
    storeEnvironment: 'unknown',
    usesSandboxAppStoreReceipt: false,
  }), false);
});

test('tester override gate allows TestFlight sandbox receipt and StoreKit sandbox', () => {
  const { allowsOnboardingTesterOverride } = gateMod;
  assert.equal(allowsOnboardingTesterOverride({
    isDev: false,
    buildChannel: 'production',
    storeEnvironment: 'unknown',
    usesSandboxAppStoreReceipt: true,
  }), true);
  assert.equal(allowsOnboardingTesterOverride({
    isDev: false,
    buildChannel: 'production',
    storeEnvironment: 'sandbox',
    usesSandboxAppStoreReceipt: false,
  }), true);
  assert.equal(allowsOnboardingTesterOverride({
    isDev: true,
    buildChannel: 'production',
    storeEnvironment: 'production',
    usesSandboxAppStoreReceipt: false,
  }), true);
});

test('persisted tester override wins over offering metadata when honored', () => {
  const { resolveOnboardingVariant } = gateMod;
  assert.equal(resolveOnboardingVariant({ metadata: {} }, 'v2', true), 'v2');
  assert.equal(resolveOnboardingVariant({ metadata: { onboarding_variant: 'v2' } }, null, true), 'v2');
  assert.equal(resolveOnboardingVariant({ metadata: { onboarding_variant: 'v2' } }, 'v2', false), 'v2');
  assert.equal(resolveOnboardingVariant({ metadata: {} }, 'v2', false), 'control');
});

test('reset persisted onboarding clears completion and restarts v2 flow', () => {
  const onboardingModel = require('../onboarding-model');
  const { resetPersistedOnboardingForTester } = gateMod;
  const serialized = JSON.stringify({
    v: 8,
    profile: {
      onboarded: true,
      onboardingVersion: 2,
      onboardingStep: 3,
      pinnedSymptoms: ['sleepq'],
      intent: 'understand',
    },
    entries: {},
  });
  const reset = resetPersistedOnboardingForTester(serialized, 'v2');
  const profile = onboardingModel.parseState(reset).profile;
  assert.equal(profile.onboarded, false);
  assert.equal(profile.onboardingVersion, onboardingModel.versionV2Flow);
  assert.equal(profile.onboardingStep, 0);
  assert.deepEqual(profile.pinnedSymptoms, []);
  assert.equal(profile.intent, '');
});
