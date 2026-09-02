import * as LocalAuthentication from 'expo-local-authentication';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import MenoCompassSecurityModule from './modules/menocompass-security';

const APP_LOCK_KEY = 'menocompass.app-lock.enabled.v1';
const REMINDERS_KEY = 'menocompass.reminders.v1';
const secureStoreOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export type DailyReminder = {
  enabled: boolean;
  hour: number;
  minute: number;
};

export type WeeklyReminder = DailyReminder & {
  weekday: number;
};

export type ReminderPreferences = {
  dailyCheckIn: DailyReminder;
  treatmentFollowUp: WeeklyReminder;
};

type StoredReminders = {
  preferences: ReminderPreferences;
  notificationIds: string[];
};

export type ReminderStatus = {
  permission: 'not-determined' | 'granted' | 'denied';
  preferences: ReminderPreferences;
};

export type AppLockCapability = {
  available: boolean;
  enabled: boolean;
  label: 'Face ID' | 'Touch ID' | 'biometric unlock';
};

const defaultReminderPreferences: ReminderPreferences = {
  dailyCheckIn: { enabled: false, hour: 20, minute: 0 },
  treatmentFollowUp: { enabled: false, weekday: 1, hour: 10, minute: 0 },
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function boundedInteger(value: unknown, minimum: number, maximum: number, fallback: number) {
  const numeric = Number(value);
  return Number.isInteger(numeric) && numeric >= minimum && numeric <= maximum
    ? numeric
    : fallback;
}

export function normalizeReminderPreferences(value: unknown): ReminderPreferences {
  const candidate = value && typeof value === 'object'
    ? value as Partial<ReminderPreferences>
    : {};
  const daily = candidate.dailyCheckIn && typeof candidate.dailyCheckIn === 'object'
    ? candidate.dailyCheckIn
    : defaultReminderPreferences.dailyCheckIn;
  const treatment = candidate.treatmentFollowUp && typeof candidate.treatmentFollowUp === 'object'
    ? candidate.treatmentFollowUp
    : defaultReminderPreferences.treatmentFollowUp;

  return {
    dailyCheckIn: {
      enabled: daily.enabled === true,
      hour: boundedInteger(daily.hour, 0, 23, defaultReminderPreferences.dailyCheckIn.hour),
      minute: boundedInteger(daily.minute, 0, 59, defaultReminderPreferences.dailyCheckIn.minute),
    },
    treatmentFollowUp: {
      enabled: treatment.enabled === true,
      weekday: boundedInteger(
        treatment.weekday,
        1,
        7,
        defaultReminderPreferences.treatmentFollowUp.weekday,
      ),
      hour: boundedInteger(
        treatment.hour,
        0,
        23,
        defaultReminderPreferences.treatmentFollowUp.hour,
      ),
      minute: boundedInteger(
        treatment.minute,
        0,
        59,
        defaultReminderPreferences.treatmentFollowUp.minute,
      ),
    },
  };
}

function permissionLabel(status: Notifications.NotificationPermissionsStatus): ReminderStatus['permission'] {
  if (
    status.granted
    || status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
    || status.ios?.status === Notifications.IosAuthorizationStatus.EPHEMERAL
  ) return 'granted';
  if (
    status.canAskAgain === false
    || status.ios?.status === Notifications.IosAuthorizationStatus.DENIED
  ) return 'denied';
  return 'not-determined';
}

async function readStoredReminders(): Promise<StoredReminders> {
  const stored = await SecureStore.getItemAsync(REMINDERS_KEY, secureStoreOptions);
  if (!stored) {
    return { preferences: defaultReminderPreferences, notificationIds: [] };
  }
  try {
    const parsed = JSON.parse(stored) as Partial<StoredReminders>;
    return {
      preferences: normalizeReminderPreferences(parsed.preferences),
      notificationIds: Array.isArray(parsed.notificationIds)
        ? parsed.notificationIds.filter((id): id is string => typeof id === 'string' && id.length > 0)
        : [],
    };
  } catch {
    return { preferences: defaultReminderPreferences, notificationIds: [] };
  }
}

async function cancelNotifications(ids: string[]) {
  await Promise.allSettled(ids.map(id => Notifications.cancelScheduledNotificationAsync(id)));
}

export async function getReminderStatusAsync(): Promise<ReminderStatus> {
  const [permissions, stored] = await Promise.all([
    Notifications.getPermissionsAsync(),
    readStoredReminders(),
  ]);
  return {
    permission: permissionLabel(permissions),
    preferences: stored.preferences,
  };
}

export async function configureRemindersAsync(
  value: unknown,
  requestPermission: boolean,
): Promise<ReminderStatus> {
  const preferences = normalizeReminderPreferences(value);
  const previous = await readStoredReminders();
  const needsPermission = preferences.dailyCheckIn.enabled || preferences.treatmentFollowUp.enabled;
  let permissions = await Notifications.getPermissionsAsync();

  if (needsPermission && permissionLabel(permissions) === 'not-determined' && requestPermission) {
    permissions = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: false,
        allowSound: false,
      },
    });
  }

  if (needsPermission && permissionLabel(permissions) !== 'granted') {
    throw new Error(
      permissionLabel(permissions) === 'denied'
        ? 'Notifications are off for MenoCompass. Enable them in Settings to use reminders.'
        : 'Turn on notifications to schedule reminders.',
    );
  }

  const newNotificationIds: string[] = [];
  try {
    if (preferences.dailyCheckIn.enabled) {
      newNotificationIds.push(await Notifications.scheduleNotificationAsync({
        content: {
          title: 'MenoCompass check-in',
          body: 'Take a moment for your daily check-in.',
          data: { route: 'today', reminder: 'daily-check-in' },
          sound: false,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: preferences.dailyCheckIn.hour,
          minute: preferences.dailyCheckIn.minute,
        },
      }));
    }

    if (preferences.treatmentFollowUp.enabled) {
      newNotificationIds.push(await Notifications.scheduleNotificationAsync({
        content: {
          title: 'MenoCompass weekly check-in',
          body: 'Take a moment to review your week.',
          data: { route: 'care', reminder: 'treatment-follow-up' },
          sound: false,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: preferences.treatmentFollowUp.weekday,
          hour: preferences.treatmentFollowUp.hour,
          minute: preferences.treatmentFollowUp.minute,
        },
      }));
    }

    await SecureStore.setItemAsync(
      REMINDERS_KEY,
      JSON.stringify({ preferences, notificationIds: newNotificationIds }),
      secureStoreOptions,
    );
    await cancelNotifications(previous.notificationIds);
  } catch (error) {
    await cancelNotifications(newNotificationIds);
    throw error;
  }

  return { permission: permissionLabel(permissions), preferences };
}

export async function clearNativePrivateDataAsync() {
  await Promise.allSettled([
    Notifications.cancelAllScheduledNotificationsAsync(),
    Notifications.dismissAllNotificationsAsync(),
  ]);
  await Promise.all([
    SecureStore.deleteItemAsync(APP_LOCK_KEY, secureStoreOptions),
    SecureStore.deleteItemAsync(REMINDERS_KEY, secureStoreOptions),
  ]);
  const permissions = await Notifications.getPermissionsAsync();
  return {
    appLock: {
      ...(await getAppLockCapabilityAsync()),
      enabled: false,
    },
    reminders: {
      permission: permissionLabel(permissions),
      preferences: defaultReminderPreferences,
    } satisfies ReminderStatus,
  };
}

async function biometricLabel(): Promise<AppLockCapability['label']> {
  const supported = await LocalAuthentication.supportedAuthenticationTypesAsync();
  if (supported.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return 'Face ID';
  if (supported.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return 'Touch ID';
  return 'biometric unlock';
}

export async function getAppLockCapabilityAsync(): Promise<AppLockCapability> {
  const [hasHardware, enrolled, enabled, label] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
    SecureStore.getItemAsync(APP_LOCK_KEY, secureStoreOptions),
    biometricLabel(),
  ]);
  return { available: hasHardware && enrolled, enabled: enabled === 'true', label };
}

export async function authenticateAppUnlockAsync(reason = 'Unlock your private MenoCompass record') {
  const capability = await getAppLockCapabilityAsync();
  if (!capability.enabled) return true;
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: reason,
    cancelLabel: 'Not now',
    fallbackLabel: 'Use Passcode',
    disableDeviceFallback: false,
  });
  return result.success;
}

export async function setAppLockEnabledAsync(enabled: boolean): Promise<AppLockCapability> {
  const current = await getAppLockCapabilityAsync();
  if (enabled && !current.available) {
    throw new Error('Set up Face ID or Touch ID in iOS Settings before turning on App Lock.');
  }
  if (enabled !== current.enabled) {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: enabled ? 'Turn on MenoCompass App Lock' : 'Turn off MenoCompass App Lock',
      cancelLabel: 'Cancel',
      fallbackLabel: 'Use Passcode',
      disableDeviceFallback: false,
    });
    if (!result.success) throw new Error('MenoCompass App Lock was not changed.');
  }
  await SecureStore.setItemAsync(APP_LOCK_KEY, enabled ? 'true' : 'false', secureStoreOptions);
  return { ...current, enabled };
}

function requireSecurityModule() {
  if (!MenoCompassSecurityModule || Platform.OS !== 'ios') {
    throw new Error('Secure MenoCompass backups require the iOS app.');
  }
  return MenoCompassSecurityModule;
}

export function isDeviceEncryptionAvailable() {
  return Platform.OS === 'ios' && MenoCompassSecurityModule !== null;
}

export async function encryptForDeviceAsync(plaintext: string) {
  return requireSecurityModule().encryptForDeviceAsync(plaintext);
}

export async function decryptForDeviceAsync(payload: string) {
  return requireSecurityModule().decryptForDeviceAsync(payload);
}

export async function encryptBackupAsync(plaintext: string, password: string) {
  if (password.length < 10) throw new Error('Use a backup password with at least 10 characters.');
  return requireSecurityModule().encryptBackupAsync(plaintext, password);
}

export async function decryptBackupAsync(payload: string, password: string) {
  if (!password) throw new Error('Enter the password used to protect this backup.');
  return requireSecurityModule().decryptBackupAsync(payload, password);
}
