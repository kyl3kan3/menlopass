const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const moduleRoot = path.resolve(__dirname, '..');
const bridgeSwift = fs.readFileSync(
  path.join(moduleRoot, 'ios', 'MenoCompassShortcutsModule.swift'),
  'utf8',
);
const appTargetSwift = fs.readFileSync(
  path.join(moduleRoot, 'app-target', 'MenoCompassAppShortcuts.swift'),
  'utf8',
);
const configPlugin = fs.readFileSync(
  path.join(moduleRoot, 'app.plugin.js'),
  'utf8',
);
const appConfig = fs.readFileSync(
  path.resolve(moduleRoot, '..', '..', 'app.config.js'),
  'utf8',
);
const moduleConfig = JSON.parse(
  fs.readFileSync(path.join(moduleRoot, 'expo-module.config.json'), 'utf8'),
);
const packageJson = JSON.parse(
  fs.readFileSync(path.join(moduleRoot, 'package.json'), 'utf8'),
);
const quickEntry = fs.readFileSync(
  path.resolve(moduleRoot, '..', '..', 'widgets', 'quick-entry.native.ts'),
  'utf8',
);
const shortcutBridge = fs.readFileSync(
  path.join(moduleRoot, 'src', 'shortcuts.ts'),
  'utf8',
);

test('defines two discoverable App Intents and an AppShortcutsProvider', () => {
  assert.match(appTargetSwift, /struct LogWithMenoCompassIntent:\s*AppIntent/);
  assert.match(appTargetSwift, /struct ReviewMenoCompassPatternsIntent:\s*AppIntent/);
  assert.match(appTargetSwift, /struct MenoCompassAppShortcuts:\s*AppShortcutsProvider/);
  assert.match(appTargetSwift, /@AppShortcutsBuilder/);
  assert.equal((appTargetSwift.match(/\bAppShortcut\(/g) || []).length, 2);
  assert.match(appTargetSwift, /Log with \\\(.applicationName\)/);
  assert.match(appTargetSwift, /Review \\\(.applicationName\) patterns/);
});

test('intents foreground the app and publish only allow-listed route URLs', () => {
  assert.equal((appTargetSwift.match(/openAppWhenRun:\s*Bool\s*=\s*true/g) || []).length, 2);
  assert.match(appTargetSwift, /case checkin = "menlopass:\/\/checkin"/);
  assert.match(appTargetSwift, /case insights = "menlopass:\/\/insights"/);
  assert.doesNotMatch(
    appTargetSwift,
    /\b(?:symptom|medication|treatment|lab|profile)\b/i,
  );
});

test('App Intent source is injected into the main app target, not left in the pod', () => {
  assert.match(configPlugin, /IOSConfig\.XcodeProjectFile\.withBuildSourceFile/);
  assert.match(configPlugin, /filePath:\s*APP_TARGET_FILE/);
  assert.match(
    appConfig,
    /plugins\.push\('\.\/modules\/menocompass-shortcuts\/app\.plugin\.js'\)/,
  );
  assert.doesNotMatch(bridgeSwift, /AppIntent|AppShortcutsProvider/);
});

test('native invocation bridge is autolinked and consumable from JavaScript', () => {
  assert.equal(packageJson.name, 'menocompass-shortcuts');
  assert.equal(packageJson.main, 'index.ts');
  assert.deepEqual(moduleConfig.platforms, ['ios']);
  assert.deepEqual(moduleConfig.apple.modules, ['MenoCompassShortcutsModule']);
  assert.match(bridgeSwift, /Events\("onShortcutInvoked"\)/);
  assert.match(bridgeSwift, /Function\("consumePendingUrl"\)/);
});

test('the existing quick-entry listener consumes cold and live App Shortcut routes', () => {
  assert.match(
    quickEntry,
    /import \{ subscribeToMenoCompassAppShortcuts \} from '\.\.\/modules\/menocompass-shortcuts';/,
  );
  assert.match(
    quickEntry,
    /subscribeToMenoCompassAppShortcuts\(onRoute\)/,
  );
  assert.match(quickEntry, /removeAppShortcuts\(\)/);
  assert.match(
    shortcutBridge,
    /deliver\(MenoCompassShortcutsModule\.consumePendingUrl\(\)\);/,
  );
  assert.match(
    shortcutBridge,
    /const pendingUrl = MenoCompassShortcutsModule\.consumePendingUrl\(\);/,
  );
});
