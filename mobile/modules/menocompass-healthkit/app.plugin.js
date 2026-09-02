const {
  createRunOncePlugin,
  withEntitlementsPlist,
  withInfoPlist,
} = require('expo/config-plugins');

const packageName = 'menocompass-healthkit';
const packageVersion = '1.0.0';
const defaultShareUsageDescription =
  'MenoCompass reads your steps, sleep, and body weight only when you choose to sync, so you can view those summaries alongside your menopause records. MenoCompass never writes to Apple Health.';
const defaultUpdateUsageDescription =
  'MenoCompass requests Apple Health access only to read steps, sleep, and body weight when you choose to sync. MenoCompass never writes or updates Apple Health data.';

function withMenoCompassHealthKit(config, options = {}) {
  config = withInfoPlist(config, nextConfig => {
    nextConfig.modResults.NSHealthShareUsageDescription =
      options.healthSharePermission || defaultShareUsageDescription;
    // App Store validation requires this key whenever the HealthKit
    // entitlement is present, even when the app requests no write types.
    nextConfig.modResults.NSHealthUpdateUsageDescription =
      options.healthUpdatePermission || defaultUpdateUsageDescription;
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
