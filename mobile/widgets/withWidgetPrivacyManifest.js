const fs = require('node:fs');
const path = require('node:path');
const {
  createRunOncePlugin,
  IOSConfig,
  withDangerousMod,
  withXcodeProject,
} = require('expo/config-plugins');

const pkg = require('../package.json');

const TARGET_NAME = 'ExpoWidgetsTarget';
const MANIFEST_NAME = 'PrivacyInfo.xcprivacy';
const manifestSource = path.join(__dirname, MANIFEST_NAME);

function withWidgetPrivacyManifest(config) {
  config = withDangerousMod(config, [
    'ios',
    currentConfig => {
      const targetDirectory = path.join(
        currentConfig.modRequest.platformProjectRoot,
        TARGET_NAME,
      );
      fs.mkdirSync(targetDirectory, { recursive: true });
      fs.copyFileSync(manifestSource, path.join(targetDirectory, MANIFEST_NAME));
      return currentConfig;
    },
  ]);

  return withXcodeProject(config, currentConfig => {
    const project = currentConfig.modResults;
    const targetUuid = project.findTargetKey(TARGET_NAME);
    if (!targetUuid) {
      throw new Error(
        `Could not find ${TARGET_NAME}; register the widget privacy plugin before expo-widgets.`,
      );
    }

    const resourcesSection = project.hash.project.objects.PBXResourcesBuildPhase || {};
    const nativeTarget = project.pbxNativeTargetSection()[targetUuid];
    const hasResourcesPhase = nativeTarget.buildPhases.some(
      phase => resourcesSection[phase.value],
    );
    if (!hasResourcesPhase) {
      project.addBuildPhase(
        [],
        'PBXResourcesBuildPhase',
        'Resources',
        targetUuid,
      );
    }

    const relativePath = `${TARGET_NAME}/${MANIFEST_NAME}`;
    if (!project.hasFile(relativePath)) {
      currentConfig.modResults = IOSConfig.XcodeUtils.addResourceFileToGroup({
        filepath: relativePath,
        groupName: TARGET_NAME,
        isBuildFile: true,
        project,
        targetUuid,
      });
    }
    return currentConfig;
  });
}

module.exports = createRunOncePlugin(
  withWidgetPrivacyManifest,
  'menocompass-widget-privacy-manifest',
  pkg.version,
);
module.exports.withWidgetPrivacyManifest = withWidgetPrivacyManifest;
module.exports.MANIFEST_NAME = MANIFEST_NAME;
module.exports.TARGET_NAME = TARGET_NAME;
module.exports.manifestSource = manifestSource;
