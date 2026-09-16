import * as SecureStore from 'expo-secure-store';

export const DISCLOSURE_VERSION = 1;
const key = 'peri.analytics-consent.v1';
let allowed = false;
let epoch = 0;
export const analyticsAllowed = () => allowed;
export const consentEpoch = () => epoch;
export function changeConsent(accepted: boolean) { allowed = accepted; epoch++; }
export async function readAnalyticsConsent(): Promise<boolean | null> {
  try {
    const value = JSON.parse(await SecureStore.getItemAsync(key) || 'null');
    return value?.version === DISCLOSURE_VERSION && typeof value.allowed === 'boolean' ? value.allowed : null;
  } catch { return null; }
}
let writes = Promise.resolve();
export function persistAnalyticsConsent(accepted: boolean) {
  writes = writes.catch(() => {}).then(() => SecureStore.setItemAsync(key, JSON.stringify({ version: DISCLOSURE_VERSION, allowed: accepted })));
  return writes;
}
