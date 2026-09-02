import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { quickRouteFromUrl } from './quick-entry-route.ts';
import { widgetProgressForDate } from './widget-progress.ts';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const plist = require('@expo/plist').default;
const resolveAppConfig = require('../app.config.js');
const staticAppConfig = require('../app.json').expo;
const { menocompassWidgetsPlugin } = require('./app-config.js');
const widgetPrivacyPluginSource = fs.readFileSync(
  path.join(__dirname, 'withWidgetPrivacyManifest.js'),
  'utf8',
);
const widgetPrivacyManifest = plist.parse(
  fs.readFileSync(path.join(__dirname, 'PrivacyInfo.xcprivacy'), 'utf8'),
);

test('widget config matches both registered widget kinds and excludes lock-screen families', () => {
  assert.equal(menocompassWidgetsPlugin[0], 'expo-widgets');
  assert.deepEqual(
    menocompassWidgetsPlugin[1].widgets.map(widget => widget.name),
    ['MenoCompassCheckIn', 'MenoCompassInsights'],
  );
  assert.equal(
    menocompassWidgetsPlugin[1].widgets.some(widget =>
      widget.supportedFamilies.some(family => family.startsWith('accessory')),
    ),
    false,
  );
  assert.equal(menocompassWidgetsPlugin[1].enablePushNotifications, false);
});

test('app and widget extension declare the App Group UserDefaults privacy reason', () => {
  const config = resolveAppConfig({ config: staticAppConfig });
  const appUserDefaults = config.ios.privacyManifests.NSPrivacyAccessedAPITypes.find(
    entry => entry.NSPrivacyAccessedAPIType === 'NSPrivacyAccessedAPICategoryUserDefaults',
  );
  const widgetUserDefaults = widgetPrivacyManifest.NSPrivacyAccessedAPITypes.find(
    entry => entry.NSPrivacyAccessedAPIType === 'NSPrivacyAccessedAPICategoryUserDefaults',
  );
  const pluginNames = config.plugins.map(plugin =>
    Array.isArray(plugin) ? plugin[0] : plugin,
  );

  assert.ok(appUserDefaults.NSPrivacyAccessedAPITypeReasons.includes('1C8F.1'));
  assert.ok(widgetUserDefaults.NSPrivacyAccessedAPITypeReasons.includes('1C8F.1'));
  assert.ok(pluginNames.includes('./widgets/withWidgetPrivacyManifest.js'));
  assert.ok(
    pluginNames.indexOf('./widgets/withWidgetPrivacyManifest.js') <
      pluginNames.indexOf('expo-widgets'),
  );
  assert.match(widgetPrivacyPluginSource, /PBXResourcesBuildPhase/);
  assert.match(widgetPrivacyPluginSource, /targetUuid/);
  assert.match(widgetPrivacyPluginSource, /addResourceFileToGroup/);
});

test('quick entry links accept only allow-listed MenoCompass routes', () => {
  assert.equal(quickRouteFromUrl('menlopass://checkin?source=widget'), 'checkin');
  assert.equal(quickRouteFromUrl('menlopass:/check-in'), 'checkin');
  assert.equal(quickRouteFromUrl('menlopass://insights'), 'journey');
  assert.equal(quickRouteFromUrl('menlopass://journey'), 'journey');
  assert.equal(quickRouteFromUrl('menlopass://trends'), null);
  assert.equal(quickRouteFromUrl('https://menlopass.vercel.app/#journey'), null);
  assert.equal(quickRouteFromUrl('menlopass://profile'), null);
  assert.equal(quickRouteFromUrl('menlopass://someone@checkin'), null);
  assert.equal(quickRouteFromUrl('not a URL'), null);
});

test('widget progress shares only daily completion and seven-day coverage', () => {
  const state = JSON.stringify({
    profile: { name: 'Private name' },
    entries: {
      '2026-09-02': { confirmed: true, symptoms: { hotFlushes: 5 }, notes: 'Private' },
      '2026-09-01': { confirmed: true },
      '2026-08-31': { confirmed: false },
      '2026-08-30': { confirmed: true },
      '2026-08-25': { confirmed: true },
    },
  });

  assert.deepEqual(
    widgetProgressForDate(state, new Date(2026, 8, 2, 18, 30)),
    { completedToday: true, confirmedDays: 3 },
  );
  assert.deepEqual(
    Object.keys(widgetProgressForDate(state, new Date(2026, 8, 2))).sort(),
    ['completedToday', 'confirmedDays'],
  );
});

test('widget progress fails closed for missing or malformed state', () => {
  assert.deepEqual(
    widgetProgressForDate(null, new Date(2026, 8, 2)),
    { completedToday: false, confirmedDays: 0 },
  );
  assert.deepEqual(
    widgetProgressForDate('{bad json', new Date(2026, 8, 2)),
    { completedToday: false, confirmedDays: 0 },
  );
});
