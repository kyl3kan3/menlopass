import { requireOptionalNativeModule } from 'expo-modules-core';

import type {
  HealthKitAuthorizationResult,
  HealthKitRequestStatus,
  HealthKitSummary,
  UserInitiatedHealthKitOptions,
} from './MenoCompassHealthKit.types';

type MenoCompassHealthKitNativeModule = {
  isAvailable(): boolean;
  getRequestStatusAsync(): Promise<HealthKitRequestStatus>;
  requestAuthorizationAsync(userInitiated: boolean): Promise<HealthKitAuthorizationResult>;
  syncSummaryAsync(lookbackDays: number, userInitiated: boolean): Promise<HealthKitSummary>;
};

const nativeModule = requireOptionalNativeModule<MenoCompassHealthKitNativeModule>(
  'MenoCompassHealthKit',
);

const unavailableStatus: HealthKitRequestStatus = {
  available: false,
  requestStatus: 'unavailable',
  readOnly: true,
};

export function isHealthKitAvailable(): boolean {
  return nativeModule?.isAvailable() ?? false;
}

export async function getHealthKitRequestStatus(): Promise<HealthKitRequestStatus> {
  return nativeModule?.getRequestStatusAsync() ?? unavailableStatus;
}

export async function requestHealthKitAuthorization(
  options: UserInitiatedHealthKitOptions,
): Promise<HealthKitAuthorizationResult> {
  if (!nativeModule) {
    return { ...unavailableStatus, promptCompleted: false };
  }
  return nativeModule.requestAuthorizationAsync(options.userInitiated);
}

export async function syncHealthKitSummary(
  options: UserInitiatedHealthKitOptions,
): Promise<HealthKitSummary> {
  const lookbackDays = Math.min(30, Math.max(1, Math.round(options.lookbackDays ?? 7)));
  if (!nativeModule) {
    return {
      available: false,
      readOnly: true,
      generatedAt: new Date().toISOString(),
      lookbackDays,
      hasAnyData: false,
      steps: { total: null, dailyAverage: null },
      sleep: { totalHours: null, nightlyAverageHours: null, trackedNights: 0 },
      bodyWeight: { latestKilograms: null, recordedAt: null },
      warnings: ['healthKitUnavailable'],
    };
  }
  return nativeModule.syncSummaryAsync(lookbackDays, options.userInitiated);
}

/**
 * Intended for a visible Connect/Sync button. HealthKit may hide which read
 * permissions were denied, so consumers must present missing values as
 * unavailable—not as zero.
 */
export async function connectAndSyncHealthKit(
  options: UserInitiatedHealthKitOptions,
): Promise<{ authorization: HealthKitAuthorizationResult; summary: HealthKitSummary }> {
  const authorization = await requestHealthKitAuthorization(options);
  const summary = await syncHealthKitSummary(options);
  return { authorization, summary };
}
