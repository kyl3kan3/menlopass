const metaAppId = process.env.EXPO_PUBLIC_META_APP_ID?.trim();
const metaClientToken = process.env.EXPO_PUBLIC_META_CLIENT_TOKEN?.trim();
const tiktokAppId = process.env.TIKTOK_APP_ID?.trim() || '6798018790';
const tiktokBusinessAppId =
  process.env.TIKTOK_BUSINESS_APP_ID?.trim() || '7679768878880178197';
const tiktokAppSecret = process.env.TIKTOK_APP_SECRET?.trim();
const { menocompassWidgetsPlugin } = require('./widgets/app-config');

const APP_GROUP_DEFAULTS_API = 'NSPrivacyAccessedAPICategoryUserDefaults';
const APP_GROUP_DEFAULTS_REASON = '1C8F.1';

function withoutPlugin(plugins, pluginName) {
  return plugins.filter(plugin => {
    const name = Array.isArray(plugin) ? plugin[0] : plugin;
    return name !== pluginName;
  });
}

function withAppGroupDefaultsPrivacyReason(privacyManifests = {}) {
  const accessedApiTypes = Array.isArray(privacyManifests.NSPrivacyAccessedAPITypes)
    ? privacyManifests.NSPrivacyAccessedAPITypes
    : [];
  const existing = accessedApiTypes.find(
    entry => entry.NSPrivacyAccessedAPIType === APP_GROUP_DEFAULTS_API,
  );
  const reasons = Array.isArray(existing?.NSPrivacyAccessedAPITypeReasons)
    ? existing.NSPrivacyAccessedAPITypeReasons
    : [];

  return {
    ...privacyManifests,
    NSPrivacyAccessedAPITypes: [
      ...accessedApiTypes.filter(
        entry => entry.NSPrivacyAccessedAPIType !== APP_GROUP_DEFAULTS_API,
      ),
      {
        NSPrivacyAccessedAPIType: APP_GROUP_DEFAULTS_API,
        NSPrivacyAccessedAPITypeReasons: [
          ...new Set([...reasons, APP_GROUP_DEFAULTS_REASON]),
        ],
      },
    ],
  };
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
  plugins = withoutPlugin(plugins, 'expo-sharing');
  plugins = withoutPlugin(plugins, 'expo-notifications');
  plugins = withoutPlugin(plugins, 'expo-local-authentication');
  plugins = withoutPlugin(plugins, 'expo-secure-store');
  plugins = withoutPlugin(plugins, 'expo-widgets');
  plugins = withoutPlugin(plugins, './modules/menocompass-healthkit/app.plugin.js');
  plugins = withoutPlugin(plugins, './modules/menocompass-shortcuts/app.plugin.js');
  plugins = withoutPlugin(plugins, './widgets/withWidgetPrivacyManifest.js');
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
  plugins.push('expo-sharing');
  plugins.push('expo-notifications');
  plugins.push([
    'expo-local-authentication',
    {
      faceIDPermission: 'Use Face ID to unlock your private MenoCompass record.',
    },
  ]);
  plugins.push([
    'expo-secure-store',
    {
      configureAndroidBackup: true,
      faceIDPermission: 'Use Face ID to unlock your private MenoCompass record.',
    },
  ]);
  plugins.push([
    './modules/menocompass-healthkit/app.plugin.js',
    {
      healthSharePermission:
        'MenoCompass reads your steps, sleep, and body weight only when you choose to sync, so you can view those summaries alongside your menopause records. MenoCompass never writes to Apple Health.',
    },
  ]);
  plugins.push('./modules/menocompass-shortcuts/app.plugin.js');
  plugins.push('./widgets/withWidgetPrivacyManifest.js');
  plugins.push(menocompassWidgetsPlugin);
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
      privacyManifests: withAppGroupDefaultsPrivacyReason(
        config.ios?.privacyManifests,
      ),
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
