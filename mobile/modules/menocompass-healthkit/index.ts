export {
  connectAndSyncHealthKit,
  getHealthKitRequestStatus,
  isHealthKitAvailable,
  requestHealthKitAuthorization,
  syncHealthKitSummary,
} from './src/MenoCompassHealthKitModule';

export type {
  HealthKitAuthorizationResult,
  HealthKitRequestStatus,
  HealthKitRequestStatusName,
  HealthKitSummary,
  UserInitiatedHealthKitOptions,
} from './src/MenoCompassHealthKit.types';
