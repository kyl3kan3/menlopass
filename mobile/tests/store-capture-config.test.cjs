const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const mobile = path.resolve(__dirname, '..');
const profiles = JSON.parse(fs.readFileSync(path.join(mobile, 'eas.json'), 'utf8'));
function loadMetro(profile, captureProfile = profiles.build['store-capture']) {
  const module = { exports: {} };
  const fallback = (_context, name) => ({ type: 'sourceFile', filePath: `real:${name}` });
  vm.runInNewContext(fs.readFileSync(path.join(mobile, 'metro.config.js'), 'utf8'), {
    module, __dirname: mobile, process: { env: { EAS_BUILD_PROFILE: profile } },
    require(name) {
      if (name === '@sentry/react-native/metro') return { getSentryExpoConfig: () => ({ resolver: { assetExts: [], resolveRequest: fallback } }) };
      if (name === './eas.json') return { build: { 'store-capture': captureProfile } };
      return require(name);
    },
  });
  return module.exports;
}

test('production, preview, and ordinary OTA bundling keep the real entry point', () => {
  for (const profile of ['production', 'preview', 'development', undefined]) {
    const config = loadMetro(profile);
    const result = config.resolver.resolveRequest({ originModulePath: path.join(mobile, 'index.native.ts') }, './App.native', 'ios');
    assert.equal(result.filePath, 'real:./App.native');
  }
});

test('capture alias is restricted to the native root of an unsigned simulator profile', () => {
  const config = loadMetro('store-capture');
  assert.equal(config.resolver.resolveRequest({ originModulePath: path.join(mobile, 'index.native.ts') }, './App.native', 'ios').filePath,
    path.join(mobile, 'store-assets/native-capture/CaptureApp.tsx'));
  assert.equal(config.resolver.resolveRequest({ originModulePath: path.join(mobile, 'other.ts') }, './App.native', 'ios').filePath, 'real:./App.native');
  assert.throws(() => loadMetro('store-capture', { ios: { simulator: false }, distribution: 'internal' }), /simulator/);
  assert.throws(() => loadMetro('store-capture', { ios: { simulator: true }, distribution: 'store' }), /simulator/);
  assert.equal(profiles.build['store-capture'].autoIncrement, false);
  assert.notEqual(profiles.build['store-capture'].channel, 'production');
});
