const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const moduleRoot = path.resolve(__dirname, '..');
const mobileRoot = path.resolve(moduleRoot, '..', '..');

test('legacy TikTok module is excluded from native autolinking', () => {
  const config = JSON.parse(
    fs.readFileSync(path.join(moduleRoot, 'expo-module.config.json'), 'utf8'),
  );
  assert.deepEqual(config.platforms, []);

  const swift = fs.readFileSync(
    path.join(moduleRoot, 'ios', 'MenoCompassTikTokBusinessModule.swift'),
    'utf8',
  );
  assert.doesNotMatch(swift, /ExpoAppDelegateSubscriber|didFinishLaunchingWithOptions/);
});

test('native initialization is guarded by resolved ATT state', () => {
  const swift = fs.readFileSync(
    path.join(moduleRoot, 'ios', 'MenoCompassTikTokBusinessModule.swift'),
    'utf8',
  );
  const attGuard = swift.indexOf('ATTrackingManager.trackingAuthorizationStatus != .notDetermined');
  const initialization = swift.indexOf('TikTokBusiness.initializeSdk(config)');

  assert.notEqual(attGuard, -1);
  assert.notEqual(initialization, -1);
  assert.ok(attGuard < initialization);
  assert.doesNotMatch(swift, /setDelayForATTUserAuthorizationInSeconds/);
});

test('active telemetry and native configuration contain no direct TikTok initialization or credentials', () => {
  const telemetry = fs.readFileSync(path.join(mobileRoot, 'telemetry.native.ts'), 'utf8');
  const config = fs.readFileSync(path.join(mobileRoot, 'app.config.js'), 'utf8');
  assert.doesNotMatch(telemetry, /initializeTikTok|trackTikTokCommerceEvent/);
  assert.doesNotMatch(config, /MenoCompassTikTokAppSecret|TIKTOK_APP_SECRET/);
});
