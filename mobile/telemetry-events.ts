import { project } from '../shared/tracking-contract';
import { commerceAttributes, commerceEvents } from './commerce-events';

export const productEvents = [
  'onboarding_started', 'onboarding_step_viewed', 'onboarding_completed',
  'onboarding_step_left', 'onboarding_selection_limit',
  'checkin_confirmed', 'report_opened', 'subscription_management_opened',
  'screen_viewed', 'webview_ready', 'diagnostic_probe', 'Application Installed', 'analytics_enabled', 'session_started', 'purchase_access_confirmed',
] as const;
export type TelemetryEvent = keyof typeof commerceEvents | typeof productEvents[number];
export const telemetryEvents = new Set<string>([...Object.keys(commerceEvents), ...productEvents]);
export const telemetryRoutes = new Set(['today', 'journey', 'care', 'guide', 'checkin', 'profile', 'appointment-report', 'today-details']);

// The API uses this same contract and rejects unknown fields instead of dropping them.
export function telemetryAttributes(event: TelemetryEvent, input: Record<string, unknown> = {}) {
  return project(event, input, (process.env.EXPO_PUBLIC_ANALYTICS_PRODUCT_IDS || '').split(',').filter(Boolean)) || {};
}
