import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { analyticsAllowed, consentEpoch } from './analytics-consent';
import { sessionContext, uuid } from './analytics-session';
import { telemetryAttributes, type TelemetryEvent } from './telemetry-events';
const key = 'peri.analytics-installation.v1';
const endpoint = process.env.EXPO_PUBLIC_ANALYTICS_API_URL?.replace(/\/$/, '');
type Identity = { token: string; installId: string; installed: boolean; erasePending?: boolean };
let identity: Identity | undefined;
let loading: Promise<Identity> | undefined;
let writes = Promise.resolve();
const requests = new Set<AbortController>();
function save(value: Identity) {
  const serialized = JSON.stringify(value);
  writes = writes.catch(() => {}).then(() => SecureStore.setItemAsync(key, serialized));
  return writes;
}
async function loadIdentity() {
  if (identity) return identity;
  if (!loading) loading = (async () => {
    const stored = await SecureStore.getItemAsync(key);
    identity = stored ? JSON.parse(stored) : { token: uuid().replace(/-/g, '') + uuid().replace(/-/g, ''), installId: uuid(), installed: false };
    if (!identity || !/^[a-f0-9]{64}$/.test(identity.token)) throw new Error('Invalid analytics credential');
    await save(identity);
    return identity;
  })();
  return loading;
}
export function cancelAnalyticsRequests() { requests.forEach(request => request.abort()); }
async function request(method: string, token: string, body?: unknown) {
  if (!endpoint?.startsWith('https://')) return false;
  const controller = new AbortController(); requests.add(controller);
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`${endpoint}/api/analytics`, { method, signal: controller.signal,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    if (response.ok) return true;
    if (response.status < 500 && response.status !== 429) return false;
    throw new Error('Analytics temporarily unavailable');
  } finally { clearTimeout(timer); requests.delete(controller); }
}
export async function analyticsPseudonym() {
  const value = await loadIdentity();
  if (value.erasePending) return undefined;
  const id = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value.token);
  return 'peri_' + await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `peri:analytics:v1:${id}`);
}
export async function sendProductEvent(name: TelemetryEvent, properties: Record<string, unknown>, replaySession?: string, eventId = uuid()) {
  if (!analyticsAllowed() || !endpoint) return false;
  const epoch = consentEpoch();
  const context = { ...sessionContext(), ...(replaySession ? { sessionId: replaySession } : {}) };
  const body = { id: eventId, name, properties: telemetryAttributes(name, properties), context, timestamp: new Date().toISOString() };
  const value = await loadIdentity();
  for (let attempt = 0; attempt < 3; attempt++) {
    if (!analyticsAllowed() || consentEpoch() !== epoch || value.erasePending) return false;
    try { return await request('POST', value.token, body); }
    catch { if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 250 * (attempt + 1))); }
  }
  return false;
}
let installSending: Promise<void> | undefined;
export function sendInstallObservation() {
  if (!installSending) installSending = (async () => {
    if (!analyticsAllowed() || !endpoint) return;
    const value = await loadIdentity();
    if (!value.installed && !value.erasePending && await sendProductEvent('Application Installed', {}, undefined, value.installId)) {
      value.installed = true; await save(value);
    }
  })().finally(() => { installSending = undefined; });
  return installSending;
}
export async function eraseAnalytics() {
  cancelAnalyticsRequests();
  const value = await loadIdentity();
  value.erasePending = true; await save(value);
  return retryAnalyticsErasure();
}
export async function retryAnalyticsErasure() {
  if (!identity && !await SecureStore.getItemAsync(key)) return true;
  const value = await loadIdentity();
  if (!value.erasePending) return true;
  try { return await request('DELETE', value.token); } catch { return false; }
}
export async function prepareAnalyticsIdentity() {
  const value = await loadIdentity();
  if (!value.erasePending) return;
  if (!await retryAnalyticsErasure()) throw new Error('Analytics erasure pending');
  identity = { token: uuid().replace(/-/g, '') + uuid().replace(/-/g, ''), installId: uuid(), installed: false };
  await save(identity);
  loading = undefined;
}
