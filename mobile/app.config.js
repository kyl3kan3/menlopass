const { menocompassWidgetsPlugin } = require('./widgets/app-config');

const APP_GROUP_DEFAULTS_API = 'NSPrivacyAccessedAPICategoryUserDefaults';
const APP_GROUP_DEFAULTS_REASON = '1C8F.1';
const DIAGNOSTIC_API_REASONS = {
  NSPrivacyAccessedAPICategoryUserDefaults: ['CA92.1'],
  NSPrivacyAccessedAPICategorySystemBootTime: ['35F9.1'],
  NSPrivacyAccessedAPICategoryFileTimestamp: ['C617.1'],
};
const DIAGNOSTIC_DATA_TYPES = [
  'NSPrivacyCollectedDataTypeCrashData',
  'NSPrivacyCollectedDataTypePerformanceData',
  'NSPrivacyCollectedDataTypeOtherDiagnosticData',
];

function withoutPlugin(plugins, pluginName) {
  return plugins.filter(plugin => {
    const name = Array.isArray(plugin) ? plugin[0] : plugin;
    return name !== pluginName;
  });
}

function withAppPrivacyDeclarations(privacyManifests = {}) {
  const accessedApiTypes = Array.isArray(privacyManifests.NSPrivacyAccessedAPITypes)
    ? privacyManifests.NSPrivacyAccessedAPITypes
    : [];
  const collectedDataTypes = Array.isArray(privacyManifests.NSPrivacyCollectedDataTypes)
    ? privacyManifests.NSPrivacyCollectedDataTypes
    : [];
  const requiredApiReasons = {
    ...DIAGNOSTIC_API_REASONS,
    [APP_GROUP_DEFAULTS_API]: [
      ...DIAGNOSTIC_API_REASONS[APP_GROUP_DEFAULTS_API],
      APP_GROUP_DEFAULTS_REASON,
    ],
  };
  const requiredApiNames = new Set(Object.keys(requiredApiReasons));
  const requiredDataNames = new Set(DIAGNOSTIC_DATA_TYPES);

  return {
    ...privacyManifests,
    NSPrivacyAccessedAPITypes: [
      ...accessedApiTypes.filter(entry => !requiredApiNames.has(entry.NSPrivacyAccessedAPIType)),
      ...Object.entries(requiredApiReasons).map(([apiType, requiredReasons]) => {
        const existing = accessedApiTypes.find(
          entry => entry.NSPrivacyAccessedAPIType === apiType,
        );
        const reasons = Array.isArray(existing?.NSPrivacyAccessedAPITypeReasons)
          ? existing.NSPrivacyAccessedAPITypeReasons
          : [];
        return {
          NSPrivacyAccessedAPIType: apiType,
          NSPrivacyAccessedAPITypeReasons: [...new Set([...reasons, ...requiredReasons])],
        };
      }),
    ],
    NSPrivacyCollectedDataTypes: [
      ...collectedDataTypes.filter(
        entry => !requiredDataNames.has(entry.NSPrivacyCollectedDataType),
      ),
      ...DIAGNOSTIC_DATA_TYPES.map(dataType => ({
        NSPrivacyCollectedDataType: dataType,
        NSPrivacyCollectedDataTypeLinked: false,
        NSPrivacyCollectedDataTypeTracking: false,
        NSPrivacyCollectedDataTypePurposes: [
          'NSPrivacyCollectedDataTypePurposeAppFunctionality',
        ],
      })),
    ],
  };
}

module.exports = ({ config }) => {
  const posthogHost = process.env.EXPO_PUBLIC_POSTHOG_HOST?.trim();
  if (posthogHost && !['https://us.i.posthog.com', 'https://eu.i.posthog.com'].includes(posthogHost)) {
    throw new Error('EXPO_PUBLIC_POSTHOG_HOST must be a PostHog Cloud ingestion URL.');
  }
  if (process.env.EAS_BUILD_PROFILE === 'production') {
    const missing = [
      !process.env.EXPO_PUBLIC_APPSFLYER_DEV_KEY?.trim() && 'EXPO_PUBLIC_APPSFLYER_DEV_KEY',
      !process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY?.trim() && 'EXPO_PUBLIC_REVENUECAT_IOS_API_KEY',
      !process.env.EXPO_PUBLIC_POSTHOG_API_KEY?.trim() && 'EXPO_PUBLIC_POSTHOG_API_KEY',
      !process.env.EXPO_PUBLIC_POSTHOG_HOST?.trim() && 'EXPO_PUBLIC_POSTHOG_HOST',
      !process.env.EXPO_PUBLIC_ANALYTICS_API_URL?.trim() && 'EXPO_PUBLIC_ANALYTICS_API_URL',
      !process.env.EXPO_PUBLIC_ANALYTICS_PRODUCT_IDS?.trim() && 'EXPO_PUBLIC_ANALYTICS_PRODUCT_IDS',
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
        'Allow peri to measure which ads lead to installs and subscriptions. Your symptoms, medications, labs, notes, and reports are never shared.',
    },
  ]);
  plugins.push('expo-sharing');
  plugins.push('expo-notifications');
  plugins.push([
    'expo-local-authentication',
    {
      faceIDPermission: 'Use Face ID to unlock your private peri record.',
    },
  ]);
  plugins.push([
    'expo-secure-store',
    {
      configureAndroidBackup: true,
      faceIDPermission: 'Use Face ID to unlock your private peri record.',
    },
  ]);
  plugins.push([
    './modules/menocompass-healthkit/app.plugin.js',
    {
      healthSharePermission:
        'peri reads your steps, sleep, and body weight only when you choose to sync, so you can view those summaries alongside your menopause records. peri never writes to Apple Health.',
      healthUpdatePermission:
        'peri requests Apple Health access only to read steps, sleep, and body weight when you choose to sync. peri never writes or updates Apple Health data.',
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

  plugins.push('./plugins/withObserveConsentDefault');
  plugins.push(['@sentry/react-native/expo', { organization: process.env.SENTRY_ORG, project: process.env.SENTRY_PROJECT }]);

  plugins = plugins.map(plugin => {
    if (!Array.isArray(plugin) || plugin[0] !== 'expo-splash-screen') return plugin;
    const options = plugin[1] || {};
    return [plugin[0], {
      ...options,
      backgroundColor: '#244b43',
      dark: { ...options.dark, backgroundColor: '#244b43' },
    }];
  });

  return {
    ...config,
    backgroundColor: '#f7f5ef',
    userInterfaceStyle: 'light',
    android: {
      ...config.android,
      adaptiveIcon: {
        ...config.android?.adaptiveIcon,
        backgroundColor: '#244b43',
      },
    },
    ios: {
      ...config.ios,
      privacyManifests: withAppPrivacyDeclarations(
        config.ios?.privacyManifests,
      ),
      infoPlist: {
        ...config.ios?.infoPlist,
        // peri uses only standard/exempt encryption provided by Apple
        // frameworks (for example HTTPS, Keychain, AES-GCM, and HMAC-SHA256).
        ITSAppUsesNonExemptEncryption: false,
        NSAdvertisingAttributionReportEndpoint: 'https://appsflyer-skadnetwork.com/',
        // The current binary is English-only. This declaration does not add an
        // i18n layer or translated resources; add locales only when those exist.
        CFBundleLocalizations: ['en'],

      },
    },
    plugins,
  };
};
