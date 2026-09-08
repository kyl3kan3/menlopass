import { commerceAttributes, commerceEvents } from './commerce-events';

export const productEvents = [
  'onboarding_started', 'onboarding_step_viewed', 'onboarding_completed',
  'checkin_confirmed', 'report_opened', 'subscription_management_opened',
  'screen_viewed', 'webview_ready', 'diagnostic_probe',
] as const;
export type TelemetryEvent = keyof typeof commerceEvents | typeof productEvents[number];
export const telemetryEvents = new Set<string>([...Object.keys(commerceEvents), ...productEvents]);
export const telemetryRoutes = new Set(['today', 'journey', 'care', 'guide', 'checkin', 'profile', 'appointment-report', 'today-details']);

// Every destination gets an explicit projection, including first-party analytics.
// Never forward a WebView message, profile, exception message, or health record.
export function telemetryAttributes(event: TelemetryEvent, input: Record<string, unknown> = {}) {
  const output: Record<string, string | number | boolean> = commerceAttributes(input);
  if (event === 'onboarding_step_viewed' && Number.isInteger(input.step) && Number(input.step) >= 0 && Number(input.step) <= 10) output.step = Number(input.step);
  if (event === 'onboarding_completed' && typeof input.skipped === 'boolean') output.skipped = input.skipped;
  if (event === 'report_opened' && [30, 90, 180].includes(Number(input.rangeDays))) output.rangeDays = Number(input.rangeDays);
  if (event === 'screen_viewed' && typeof input.route === 'string' && telemetryRoutes.has(input.route)) output.route = input.route;
  if (event === 'diagnostic_probe') output.validation = true;
  return output;
}
