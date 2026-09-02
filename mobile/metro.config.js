const { getSentryExpoConfig } = require('@sentry/react-native/metro');

const config = getSentryExpoConfig(__dirname, {
  annotateReactComponents: false,
  includeWebReplay: false,
});
config.resolver.assetExts.push('html');

module.exports = config;
