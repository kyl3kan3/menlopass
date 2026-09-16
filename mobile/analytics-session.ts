import * as Crypto from 'expo-crypto';
import * as Application from 'expo-application';
import * as Updates from 'expo-updates';
import { Platform } from 'react-native';
let session = '';
let started = 0;
let last = 0;
export const uuid = () => Crypto.randomUUID();
export function resetAnalyticsSession() { session = ''; }
export function sessionContext(now = Date.now()) {
  if (!session || now < last || now - last >= 30 * 60_000 || now - started >= 24 * 60 * 60_000) {
    // UUIDv7 keeps the capture time available for provider session validation.
    const random = uuid().replace(/-/g, '');
    const time = now.toString(16).padStart(12, '0');
    session = `${time.slice(0, 8)}-${time.slice(8)}-7${random.slice(13, 16)}-${random.slice(16, 20)}-${random.slice(20)}`;
    started = now;
  }
  last = now;
  return {
    sessionId: session, appVersion: Application.nativeApplicationVersion || 'unknown',
    buildNumber: Application.nativeBuildVersion || 'unknown', platform: Platform.OS,
    osVersion: String(Platform.Version), runtimeVersion: Updates.runtimeVersion || 'unknown',
    updateId: Updates.updateId || 'embedded', buildChannel: Updates.channel || 'unknown',
    embedded: Updates.isEmbeddedLaunch,
  };
}
