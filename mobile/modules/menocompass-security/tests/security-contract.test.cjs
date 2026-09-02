const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const moduleRoot = path.resolve(__dirname, '..');
const mobileRoot = path.resolve(moduleRoot, '..', '..');
const swift = fs.readFileSync(
  path.join(moduleRoot, 'ios', 'MenoCompassSecurityModule.swift'),
  'utf8',
);
const app = fs.readFileSync(path.join(mobileRoot, 'App.native.tsx'), 'utf8');
const privacy = fs.readFileSync(path.join(mobileRoot, 'privacyFeatures.native.ts'), 'utf8');

test('device state uses authenticated encryption and a non-migrating Keychain key', () => {
  assert.match(swift, /AES\.GCM\.seal/);
  assert.match(swift, /AES\.GCM\.open/);
  assert.match(swift, /MenoCompassStateV1/);
  assert.match(swift, /kSecAttrAccessibleWhenUnlockedThisDeviceOnly/);
  assert.match(swift, /MCSTATE1\./);
});

test('portable backups use a salted, iterated password key and authenticated envelope', () => {
  assert.match(swift, /backupIterations = 210_000/);
  assert.match(swift, /PBKDF2-HMAC-SHA256/);
  assert.match(swift, /randomData\(count: 16\)/);
  assert.match(swift, /MenoCompassBackupV1/);
  assert.match(swift, /MCBACKUP1/);
  assert.match(app, /\.menocompass/);
  assert.match(swift, /components\.count == 4/);
  assert.match(swift, /components\[0\] == Substring\(Self\.backupPrefix\)/);
});

test('legacy plaintext state is migrated and normal iOS writes target the encrypted file', () => {
  assert.match(app, /menocompass-state\.secure/);
  assert.match(app, /encryptForDeviceAsync\(canonical\)/);
  assert.match(app, /legacyPersistedStateFile\.delete\(\)/);
  assert.doesNotMatch(app, /readPersistedState\(\)\.catch\(\(\) => null\)/);
});

test('notifications stay off by default and permission is requested only by explicit configuration', () => {
  assert.match(privacy, /dailyCheckIn: \{ enabled: false/);
  assert.match(privacy, /treatmentFollowUp: \{ enabled: false/);
  assert.match(privacy, /requestPermission\) \{/);
  assert.match(privacy, /Notifications\.requestPermissionsAsync/);
  assert.doesNotMatch(privacy, /getExpoPushToken/);
});

test('app lock is opt-in and supports system passcode fallback', () => {
  assert.match(privacy, /enabled: enabled === 'true'/);
  assert.match(privacy, /disableDeviceFallback: false/);
  assert.match(privacy, /WHEN_UNLOCKED_THIS_DEVICE_ONLY/);
});

test('an imported backup reaches strict web validation before native persistence', () => {
  const chooser = app.match(/async function chooseAndDecryptBackup[\s\S]*?\n}\n\nfunction persistedStateIsOnboarded/);
  assert.ok(chooser, 'backup chooser should be present');
  assert.doesNotMatch(chooser[0], /writePersistedState/);
  assert.match(app, /menocompass-native-backup-import/);
});

test('notification taps route daily and treatment reminders without bypassing app lock', () => {
  assert.match(privacy, /data: \{ route: 'care', reminder: 'treatment-follow-up' \}/);
  assert.match(app, /addNotificationResponseReceivedListener/);
  assert.match(app, /getLastNotificationResponseAsync/);
  assert.match(app, /if \(!pendingNativeRoute \|\| !webContentReady \|\| appLocked\) return/);
});

test('deleting private data cancels reminders and removes lock settings', () => {
  assert.match(privacy, /cancelAllScheduledNotificationsAsync/);
  assert.match(privacy, /deleteItemAsync\(APP_LOCK_KEY/);
  assert.match(privacy, /deleteItemAsync\(REMINDERS_KEY/);
  assert.match(app, /message\?\.type === 'clear-native-private-data'/);
});
