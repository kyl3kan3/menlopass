import { requireOptionalNativeModule } from 'expo-modules-core';

export type TrackingPermission = 'granted' | 'denied' | 'undetermined' | 'unavailable';

type MenoCompassTikTokBusinessNativeModule = {
  initializeAsync(trackingPermission: TrackingPermission): Promise<boolean>;
};

const nativeModule = requireOptionalNativeModule<MenoCompassTikTokBusinessNativeModule>(
  'MenoCompassTikTokBusiness',
);

export async function initializeTikTokBusiness(
  trackingPermission: TrackingPermission,
): Promise<void> {
  if (!nativeModule) {
    throw new Error('MenoCompassTikTokBusiness native module is unavailable. Rebuild the native app.');
  }
  await nativeModule.initializeAsync(trackingPermission);
}
