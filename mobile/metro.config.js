const { getSentryExpoConfig } = require('@sentry/react-native/metro');

const config = getSentryExpoConfig(__dirname);
config.watchFolders = [...(config.watchFolders || []), require('path').resolve(__dirname, '../shared')];
config.resolver.assetExts.push('html');

// The unsigned simulator capture profile renders the production UI with fictional
// records. Its entry point is never selected by production or OTA builds.
if (process.env.EAS_BUILD_PROFILE === 'store-capture') {
  const profile = require('./eas.json').build['store-capture'];
  if (profile.ios?.simulator !== true || profile.distribution !== 'internal') {
    throw new Error('Store captures must use an internal iOS simulator build.');
  }
  const path = require('path');
  const previousResolve = config.resolver.resolveRequest;
  config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (moduleName === './App.native' && context.originModulePath === path.join(__dirname, 'index.native.ts')) {
      return { type: 'sourceFile', filePath: path.join(__dirname, 'store-assets/native-capture/CaptureApp.tsx') };
    }
    return previousResolve
      ? previousResolve(context, moduleName, platform)
      : context.resolveRequest(context, moduleName, platform);
  };
}

module.exports = config;
