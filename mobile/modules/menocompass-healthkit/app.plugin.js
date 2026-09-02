const {
  createRunOncePlugin,
  withEntitlementsPlist,
  withInfoPlist,
} = require('expo/config-plugins');

const packageName = 'menocompass-healthkit';
const packageVersion = '1.0.0';
const defaultShareUsageDescription =
  'MenoCompass reads your steps, sleep, and body weight only when you choose to sync, so you can view those summaries alongside your menopause records. MenoCompass never writes to Apple Health.';

function withMenoCompassHealthKit(config, options = {}) {
  config = withInfoPlist(config, nextConfig => {
    nextConfig.modResults.NSHealthShareUsageDescription =
      options.healthSharePermission || defaultShareUsageDescription;
    return nextConfig;
  });

  config = withEntitlementsPlist(config, nextConfig => {
    nextConfig.modResults['com.apple.developer.healthkit'] = true;
    return nextConfig;
  });

  return config;
}

module.exports = createRunOncePlugin(
  withMenoCompassHealthKit,
  packageName,
  packageVersion,
);
