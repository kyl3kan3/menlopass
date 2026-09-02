export type HealthKitRequestStatusName =
  | 'shouldRequest'
  | 'unnecessary'
  | 'unknown'
  | 'unavailable';

export type HealthKitRequestStatus = {
  available: boolean;
  requestStatus: HealthKitRequestStatusName;
  readOnly: true;
};

export type HealthKitAuthorizationResult = HealthKitRequestStatus & {
  promptCompleted: boolean;
};

export type HealthKitSummary = {
  available: boolean;
  readOnly: true;
  generatedAt: string;
  lookbackDays: number;
  hasAnyData: boolean;
  steps: {
    total: number | null;
    dailyAverage: number | null;
  };
  sleep: {
    totalHours: number | null;
    nightlyAverageHours: number | null;
    trackedNights: number;
  };
  bodyWeight: {
    latestKilograms: number | null;
    recordedAt: string | null;
  };
  warnings: string[];
};

export type UserInitiatedHealthKitOptions = {
  /** Deliberately literal so background code cannot accidentally request health access. */
  userInitiated: true;
  /** Aggregate step and sleep window. Native code clamps this to 1–30 days. */
  lookbackDays?: number;
};
