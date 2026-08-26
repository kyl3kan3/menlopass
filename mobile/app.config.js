const metaAppId = process.env.EXPO_PUBLIC_META_APP_ID?.trim();
const metaClientToken = process.env.EXPO_PUBLIC_META_CLIENT_TOKEN?.trim();

function withoutPlugin(plugins, pluginName) {
  return plugins.filter(plugin => {
    const name = Array.isArray(plugin) ? plugin[0] : plugin;
    return name !== pluginName;
  });
}

module.exports = ({ config }) => {
  const hasMetaConfig = Boolean(metaAppId && metaClientToken);
  if (Boolean(metaAppId) !== Boolean(metaClientToken)) {
    throw new Error('Set both EXPO_PUBLIC_META_APP_ID and EXPO_PUBLIC_META_CLIENT_TOKEN.');
  }

  if (process.env.EAS_BUILD_PROFILE === 'production') {
    const missing = [
      !process.env.EXPO_PUBLIC_APPSFLYER_DEV_KEY?.trim() && 'EXPO_PUBLIC_APPSFLYER_DEV_KEY',
      !metaAppId && 'EXPO_PUBLIC_META_APP_ID',
      !metaClientToken && 'EXPO_PUBLIC_META_CLIENT_TOKEN',
    ].filter(Boolean);
    if (missing.length) {
      throw new Error(`Missing production attribution configuration: ${missing.join(', ')}`);
    }
  }

  let plugins = config.plugins || [];
  plugins = withoutPlugin(plugins, 'expo-tracking-transparency');
  plugins = withoutPlugin(plugins, 'react-native-appsflyer');
  plugins = withoutPlugin(plugins, 'react-native-fbsdk-next');

  plugins.push([
    'expo-tracking-transparency',
    {
      userTrackingPermission:
        'Allow MenoCompass to measure which ads lead to installs and subscriptions. Your symptoms, medications, labs, notes, and reports are never shared.',
    },
  ]);
  plugins.push([
    'react-native-appsflyer',
    {
      shouldUsePurchaseConnector: false,
      preferAppsFlyerBackupRules: false,
    },
  ]);

  if (hasMetaConfig) {
    plugins.push([
      'react-native-fbsdk-next',
      {
        appID: metaAppId,
        clientToken: metaClientToken,
        displayName: 'MenoCompass',
        scheme: `fb${metaAppId}`,
        advertiserIDCollectionEnabled: false,
        autoLogAppEventsEnabled: false,
        isAutoInitEnabled: false,
        iosUserTrackingPermission: false,
      },
    ]);
  }

  return {
    ...config,
    plugins,
  };
};
