const { getSentryExpoConfig } = require('@sentry/react-native/metro');

const config = getSentryExpoConfig(__dirname);
config.watchFolders = [...(config.watchFolders || []), require('path').resolve(__dirname, '../shared')];
config.resolver.assetExts.push('html');

module.exports = config;
