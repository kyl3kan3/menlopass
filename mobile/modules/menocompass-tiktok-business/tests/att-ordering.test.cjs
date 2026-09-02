const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const moduleRoot = path.resolve(__dirname, '..');
const mobileRoot = path.resolve(moduleRoot, '..', '..');

test('TikTok is an explicit native module, not an app-delegate subscriber', () => {
  const config = JSON.parse(
    fs.readFileSync(path.join(moduleRoot, 'expo-module.config.json'), 'utf8'),
  );
  assert.deepEqual(config.apple.modules, ['MenoCompassTikTokBusinessModule']);
  assert.equal(config.apple.appDelegateSubscribers, undefined);

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

test('JavaScript records and forwards ATT only after awaiting its result', () => {
  const telemetry = fs.readFileSync(path.join(mobileRoot, 'telemetry.native.ts'), 'utf8');
  const permissionResolution = telemetry.indexOf(
    'const permissionResult = await resolveTrackingPermission();',
  );
  const permissionObservation = telemetry.indexOf(
    "Observe.logEvent('tracking.permission_resolved'",
  );
  const initialization = telemetry.indexOf('initializeTikTok(permission)');

  assert.notEqual(permissionResolution, -1);
  assert.notEqual(permissionObservation, -1);
  assert.notEqual(initialization, -1);
  assert.ok(permissionResolution < permissionObservation);
  assert.ok(permissionObservation < initialization);
  assert.ok(permissionResolution < initialization);
});
