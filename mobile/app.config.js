const metaAppId = process.env.EXPO_PUBLIC_META_APP_ID?.trim();
const metaClientToken = process.env.EXPO_PUBLIC_META_CLIENT_TOKEN?.trim();
const tiktokAppId = process.env.TIKTOK_APP_ID?.trim() || '6798018790';
const tiktokBusinessAppId =
  process.env.TIKTOK_BUSINESS_APP_ID?.trim() || '7679768878880178197';
const tiktokAppSecret = process.env.TIKTOK_APP_SECRET?.trim();

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
      !tiktokAppSecret && 'TIKTOK_APP_SECRET',
      !process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY?.trim() && 'EXPO_PUBLIC_REVENUECAT_IOS_API_KEY',
    ].filter(Boolean);
    if (missing.length) {
      throw new Error(`Missing production mobile configuration: ${missing.join(', ')}`);
    }
  }

  let plugins = config.plugins || [];
  plugins = withoutPlugin(plugins, 'expo-tracking-transparency');
  plugins = withoutPlugin(plugins, 'react-native-appsflyer');
  plugins = withoutPlugin(plugins, 'react-native-fbsdk-next');
  plugins = withoutPlugin(plugins, './plugins/withTikTokPrivacyManifestFix');

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

  plugins.push('./plugins/withTikTokPrivacyManifestFix');

  return {
    ...config,
    ios: {
      ...config.ios,
      infoPlist: {
        ...config.ios?.infoPlist,
        // The current binary is English-only. This declaration does not add an
        // i18n layer or translated resources; add locales only when those exist.
        CFBundleLocalizations: ['en'],
        MenoCompassTikTokAppID: tiktokAppId,
        MenoCompassTikTokBusinessAppID: tiktokBusinessAppId,
        ...(tiktokAppSecret
          ? { MenoCompassTikTokAppSecret: tiktokAppSecret }
          : {}),
      },
    },
    plugins,
  };
};
