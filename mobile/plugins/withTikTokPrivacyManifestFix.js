const { createRunOncePlugin, withXcodeProject } = require('expo/config-plugins');

const pkg = require('../package.json');

const BUILD_PHASE_NAME = '[MenoCompass] Fix TikTok Privacy Manifest';

const PATCH_SCRIPT = `set -eu

POD_MANIFEST="$PODS_CONFIGURATION_BUILD_DIR/TikTokBusinessSDK_Privacy.bundle/PrivacyInfo.xcprivacy"
APP_MANIFEST="$TARGET_BUILD_DIR/$UNLOCALIZED_RESOURCES_FOLDER_PATH/TikTokBusinessSDK_Privacy.bundle/PrivacyInfo.xcprivacy"
PATCHED_MANIFEST_COUNT=0

patch_manifest() {
  MANIFEST_PATH="$1"
  [ -f "$MANIFEST_PATH" ] || return 0
  PATCHED_MANIFEST_COUNT=$((PATCHED_MANIFEST_COUNT + 1))

  /usr/libexec/PlistBuddy -c "Print :NSPrivacyAccessedAPITypes:0:NSPrivacyAccessedAPIType" "$MANIFEST_PATH" | /usr/bin/grep -qx 'NSPrivacyAccessedAPICategoryUserDefaults'
  /usr/libexec/PlistBuddy -c "Print :NSPrivacyAccessedAPITypes:0:NSPrivacyAccessedAPITypeReasons:0" "$MANIFEST_PATH" | /usr/bin/grep -qx 'CA92.1'

  EMPTY_VALUE_COUNT=$(/usr/bin/grep -c '<string></string>' "$MANIFEST_PATH" || true)
  if [ "$EMPTY_VALUE_COUNT" -eq 2 ]; then
    # TikTokBusinessSDK 1.7.2 ships one placeholder collected-data
    # declaration containing empty type and purpose strings. Those are not
    # Apple-defined values. Remove only that array and retain the required-
    # reason API declaration above.
    /usr/libexec/PlistBuddy -c "Delete :NSPrivacyCollectedDataTypes" "$MANIFEST_PATH"
  elif [ "$EMPTY_VALUE_COUNT" -eq 0 ]; then
    if /usr/libexec/PlistBuddy -c "Print :NSPrivacyCollectedDataTypes" "$MANIFEST_PATH" >/dev/null 2>&1; then
      echo "error: TikTokBusinessSDK privacy declarations changed; review them before updating this patch."
      exit 1
    fi
  else
    echo "error: TikTokBusinessSDK privacy declarations have an unexpected placeholder shape."
    exit 1
  fi

  /usr/bin/plutil -lint "$MANIFEST_PATH"
  if /usr/bin/grep -q '<string></string>' "$MANIFEST_PATH"; then
    echo "error: Empty TikTok privacy-manifest values remain after patching."
    exit 1
  fi
}

# Depending on CocoaPods' generated phase order, patch the built pod resource
# before it is copied, the app copy after it is copied, or both. This keeps the
# result deterministic across clean and incremental builds.
patch_manifest "$POD_MANIFEST"
patch_manifest "$APP_MANIFEST"

if [ "$PATCHED_MANIFEST_COUNT" -eq 0 ]; then
  echo "error: TikTok privacy manifest was not found in the pod or app build products."
  exit 1
fi
`;

function addTikTokPrivacyManifestBuildPhase(currentConfig) {
  const project = currentConfig.modResults;
  const targetName = currentConfig.modRequest.projectName;
  const nativeTargetId = project.findTargetKey(targetName || '');

  if (!nativeTargetId) {
    throw new Error(`Could not find the iOS target "${targetName}" for the TikTok privacy-manifest fix.`);
  }

  const buildPhases = project.pbxNativeTargetSection()[nativeTargetId]?.buildPhases || [];
  if (buildPhases.some(phase => phase.comment === BUILD_PHASE_NAME)) {
    return currentConfig;
  }

  project.addBuildPhase([], 'PBXShellScriptBuildPhase', BUILD_PHASE_NAME, nativeTargetId, {
    shellPath: '/bin/sh',
    shellScript: PATCH_SCRIPT,
  });

  return currentConfig;
}

function withTikTokPrivacyManifestFix(config) {
  return withXcodeProject(config, addTikTokPrivacyManifestBuildPhase);
}

module.exports = createRunOncePlugin(
  withTikTokPrivacyManifestFix,
  'menocompass-tiktok-privacy-manifest-fix',
  pkg.version,
);
module.exports.addTikTokPrivacyManifestBuildPhase = addTikTokPrivacyManifestBuildPhase;
module.exports.BUILD_PHASE_NAME = BUILD_PHASE_NAME;
