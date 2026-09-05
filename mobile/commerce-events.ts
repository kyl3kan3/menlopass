import type { CustomerInfo } from 'react-native-purchases';

// These events measure client behavior, never revenue or paying customers.
export const commerceEvents = {
  app_launched: 'mc_app_launched',
  subscription_status_checked: 'mc_subscription_status_checked',
  subscription_check_failed: 'mc_subscription_check_failed',
  paywall_requested: 'mc_paywall_requested',
  paywall_rendered: 'mc_paywall_rendered',
  paywall_failed: 'mc_paywall_failed',
  paywall_dismissed: 'mc_paywall_dismissed',
  purchase_started: 'mc_purchase_started',
  purchase_cancelled: 'mc_purchase_cancelled',
  purchase_failed: 'mc_purchase_failed',
  purchase_completed: 'mc_purchase_completed',
  subscription_restore_started: 'mc_restore_started',
  subscription_restore_completed: 'mc_restore_completed',
  subscription_restore_failed: 'mc_restore_failed',
} as const;

export function subscriptionSnapshot(customerInfo: CustomerInfo) {
  const entitlement = customerInfo.entitlements.active['MenoCompass Pro'];
  return {
    access: entitlement ? 'active' : 'inactive',
    // A production build may run in TestFlight. Build channel is not store environment.
    storeEnvironment: !entitlement ? 'unknown' : entitlement.isSandbox ? 'sandbox' : 'production',
    periodType: entitlement?.periodType || 'unknown',
    ownershipType: entitlement?.ownershipType || 'unknown',
  };
}

const enumFields: Record<string, readonly string[]> = {
  access: ['unknown', 'active', 'inactive'],
  storeEnvironment: ['unknown', 'sandbox', 'production'],
  periodType: ['unknown', 'NORMAL', 'INTRO', 'TRIAL', 'PREPAID'],
  ownershipType: ['unknown', 'PURCHASED', 'FAMILY_SHARED', 'UNKNOWN'],
  source: ['automatic', 'subscribe_button', 'feature', 'gate', 'paywall'],
  reason: ['no_offering', 'free_offer', 'offerings_error', 'render_error', 'sdk_error'],
  buildChannel: ['development', 'preview', 'production', 'unknown'],
};

// Explicit projection prevents receipts, customer IDs, errors, health data, or
// arbitrary WebView fields from leaking into marketing destinations.
export function commerceAttributes(input: Record<string, unknown> = {}) {
  const output: Record<string, string | number> = { schemaVersion: 2 };
  for (const [key, values] of Object.entries(enumFields)) {
    if (typeof input[key] === 'string' && values.includes(input[key])) output[key] = input[key];
  }
  for (const key of ['offeringId', 'productId', 'packageType', 'runtimeVersion', 'updateId']) {
    const value = input[key];
    if (typeof value === 'string' && /^[\w.$:-]{1,100}$/.test(value)) output[key] = value;
  }
  const errorCode = String(input.errorCode ?? '');
  if (/^\d{1,3}$/.test(errorCode)) output.errorCode = errorCode;
  return output;
}
