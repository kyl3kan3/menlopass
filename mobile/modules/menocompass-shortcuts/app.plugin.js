const fs = require('node:fs');
const path = require('node:path');
const { createRunOncePlugin, IOSConfig } = require('expo/config-plugins');

const pkg = require('./package.json');

const APP_TARGET_FILE = 'MenoCompassAppShortcuts.swift';
const sourcePath = path.join(__dirname, 'app-target', APP_TARGET_FILE);

function withMenoCompassAppShortcuts(config) {
  return IOSConfig.XcodeProjectFile.withBuildSourceFile(config, {
    filePath: APP_TARGET_FILE,
    contents: fs.readFileSync(sourcePath, 'utf8'),
    overwrite: true,
  });
}

module.exports = createRunOncePlugin(
  withMenoCompassAppShortcuts,
  'menocompass-app-shortcuts',
  pkg.version,
);
module.exports.withMenoCompassAppShortcuts = withMenoCompassAppShortcuts;
module.exports.APP_TARGET_FILE = APP_TARGET_FILE;
module.exports.sourcePath = sourcePath;
