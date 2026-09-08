import { requireOptionalNativeModule } from 'expo-modules-core';
import { commerceAttributes, commerceEvents } from '../../commerce-events';

export type TrackingPermission = 'granted' | 'denied' | 'undetermined' | 'unavailable';

type MenoCompassTikTokBusinessNativeModule = {
  initializeAsync(trackingPermission: TrackingPermission): Promise<boolean>;
  trackCommerceEventAsync(eventName: string, properties: Record<string, string | number>): Promise<void>;
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

export async function trackTikTokCommerceEvent(eventName: string, properties: Record<string, unknown>) {
  if (!Object.values(commerceEvents).includes(eventName as typeof commerceEvents[keyof typeof commerceEvents])) return;
  if (!nativeModule?.trackCommerceEventAsync) throw new Error('TikTok commerce tracking requires the current native runtime.');
  await nativeModule.trackCommerceEventAsync(eventName, commerceAttributes(properties));
}
