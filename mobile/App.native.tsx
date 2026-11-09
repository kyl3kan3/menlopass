import { readAnalyticsConsent } from './analytics-consent';
import { consentGatePhase } from './consent-gate';
import { setAnalyticsConsent, deleteTrackingData, cancelPendingTrackingPermission, suspendAdvertising, telemetryBackground, telemetryForeground, setTelemetryReplay } from './telemetry.native';
import { PostHogMaskView } from 'posthog-react-native';
import { Asset } from 'expo-asset';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import { ObserveRoot, useObserve } from 'expo-observe';
import * as Notifications from 'expo-notifications';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, Keyboard, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Purchases, { CustomerInfo, LOG_LEVEL, type PurchasesOffering } from 'react-native-purchases';
import { OtaUpdateBanner, useOtaUpdate } from './OtaUpdate.native';
import { TrackedPaywall } from './TrackedPaywall.native';
import { RecordRecovery, RecoveryBackupValidator } from './RecordRecovery.native';
import { color, font, type } from './theme';
import { clearPrivateExportFiles, deleteUnreadableRecord, preserveUnreadableRecord, withPrivateExport } from './native-private-files';
import { subscriptionSnapshot } from './commerce-events';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import {
  initializeTelemetry,
  flushTelemetry,
  reportTelemetryError,
  setTelemetryRoute,
  setTelemetrySubscriptionState,
  trackTelemetryEvent,
} from './telemetry.native';
import { webViewDiagnosticError, webViewDiagnosticsScript } from './webview-diagnostics';
import {
  NativeTabBar,
  type MenoCompassPrimaryRoute,
} from './NativeTabBar.native';
import {
  registerSuccessfulMoment,
  requestReviewForMilestone,
} from './reviewPrompt.native';
import type { AppReviewProgress } from './reviewPrompt.native';
import {
  connectAndSyncHealthKit,
  getHealthKitRequestStatus,
  isHealthKitAvailable,
} from './modules/menocompass-healthkit';
import {
  authenticateAppUnlockAsync,
  clearNativePrivateDataAsync,
  configureRemindersAsync,
  decryptBackupAsync,
  decryptForDeviceAsync,
  encryptBackupAsync,
  encryptForDeviceAsync,
  getAppLockCapabilityAsync,
  getReminderStatusAsync,
  isDeviceEncryptionAvailable,
  setAppLockEnabledAsync,
} from './privacyFeatures.native';
import {
  injectQuickRoute,
  subscribeToMenoCompassQuickEntries,
} from './widgets/quick-entry.native';
import type { MenoCompassQuickRoute } from './widgets/quick-entry.native';
import { syncMenoCompassWidgets } from './widgets/widget-state.native';

const appAsset = require('./assets/menlopass.html');
const revenueCatIosApiKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || 'appl_SJzoZsrDheugNgeVISkHmDeKoOk';
const proEntitlement = 'MenoCompass Pro';
const maxPersistedStateLength = 5_000_000;
const maxNativeShareContentLength = 5_000_000;
const maxEncryptedBackupLength = 8_000_000;
const encryptedPersistedStateFile = new File(Paths.document, 'menocompass-state.secure');
const legacyPersistedStateFile = new File(Paths.document, 'menocompass-state.json');
const supportedNativeExports = {
  'application/json': { extension: '.json', uti: 'public.json' },
  'text/csv': { extension: '.csv', uti: 'public.comma-separated-values-text' },
  'text/calendar': { extension: '.ics', uti: 'com.apple.ical.ics' },
} as const;

type NativeExportMime = keyof typeof supportedNativeExports;
type NativeShareKind = 'backup' | 'file' | 'report';
type MenoCompassNativeRoute = MenoCompassQuickRoute | 'care';
type MenoCompassWebRoute =
  | MenoCompassPrimaryRoute
  | 'checkin'
  | 'profile'
  | 'appointment-report'
  | 'today-details';

const primaryRoutes = new Set<MenoCompassPrimaryRoute>([
  'today',
  'dossier',
  'index',
]);
/* The web letter is onboarding version 4; the shell reports it as the flow version. */
const letterFlowVersion = 4;
const webRoutes = new Set<MenoCompassWebRoute>([
  ...primaryRoutes,
  'checkin',
  'profile',
  'appointment-report',
  'today-details',
]);

function isPrimaryRoute(route: unknown): route is MenoCompassPrimaryRoute {
  return typeof route === 'string'
    && primaryRoutes.has(route as MenoCompassPrimaryRoute);
}

function isWebRoute(route: unknown): route is MenoCompassWebRoute {
  return typeof route === 'string' && webRoutes.has(route as MenoCompassWebRoute);
}

function notificationRoute(
  response: Notifications.NotificationResponse | null,
): MenoCompassNativeRoute | null {
  const route = response?.notification.request.content.data?.route;
  if (route === 'today' || route === 'checkin') return 'checkin';
  if (route === 'care') return 'care';
  return null;
}

function safeExportName(value: unknown, fallbackStem: string, extension: string) {
  const requested = typeof value === 'string' ? value.trim().split(/[\\/]/).pop() || '' : '';
  const cleaned = requested
    .replace(/[^a-zA-Z0-9._ -]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^\.+/, '')
    .slice(0, 120);
  const stem = cleaned.toLowerCase().endsWith(extension)
    ? cleaned.slice(0, -extension.length)
    : cleaned;
  return `${stem || fallbackStem}${extension}`;
}

async function ensureNativeSharing() {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Native sharing is unavailable on this device.');
  }
}

async function shareTextExport(message: Record<string, unknown>) {
  if (typeof message.contents !== 'string' || !message.contents) {
    throw new Error('This export has no data to share.');
  }
  if (message.contents.length > maxNativeShareContentLength) {
    throw new Error('This export is too large to share.');
  }
  if (
    typeof message.mime !== 'string'
    || !Object.prototype.hasOwnProperty.call(supportedNativeExports, message.mime)
  ) {
    throw new Error('This export format is not supported.');
  }

  const mime = message.mime as NativeExportMime;
  const format = supportedNativeExports[mime];
  const name = safeExportName(message.name, 'meno-compass-export', format.extension);
  await ensureNativeSharing();
  await withPrivateExport(name, async file => {
    file.create({ overwrite: true, intermediates: true });
    file.write(message.contents as string);
    await Sharing.shareAsync(file.uri, {
      dialogTitle: 'Share peri export',
      mimeType: mime,
      UTI: format.uti,
    });
  });
}

async function shareReport(message: Record<string, unknown>) {
  if (typeof message.html !== 'string' || !message.html.trim()) {
    throw new Error('This report has no content to share.');
  }
  if (message.html.length > maxNativeShareContentLength) {
    throw new Error('This report is too large to share.');
  }

  await ensureNativeSharing();
  const generated = await Print.printToFileAsync({
    html: message.html,
    margins: { top: 36, right: 36, bottom: 36, left: 36 },
  });
  const name = safeExportName(
    message.name,
    `meno-compass-report-${new Date().toISOString().slice(0, 10)}`,
    '.pdf',
  );
  const generatedFile = new File(generated.uri);
  try {
    await withPrivateExport(name, async printableFile => {
      await generatedFile.copy(printableFile, { overwrite: true });
      await Sharing.shareAsync(printableFile.uri, {
        dialogTitle: 'Share peri report',
        mimeType: 'application/pdf',
        UTI: 'com.adobe.pdf',
      });
    });
  } finally {
    if (generatedFile.exists) generatedFile.delete();
  }
}

function nativeShareErrorMessage(reason: unknown) {
  if (reason instanceof Error && [
    'Native sharing is unavailable on this device.',
    'No peri record was provided.',
    'The peri record is invalid.',
    'Use a backup password with at least 10 characters.',
    'This export has no data to share.',
    'This export is too large to share.',
    'This export format is not supported.',
    'This report has no content to share.',
    'This report is too large to share.',
  ].includes(reason.message)) {
    return reason.message;
  }
  return 'peri could not prepare that export. Please try again.';
}

function nativeBackupImportErrorMessage(reason: unknown) {
  if (!(reason instanceof Error)) return 'peri could not open that backup.';
  if (reason.message.includes('password') || reason.message.includes('unlock')) {
    return 'That password could not unlock this peri backup.';
  }
  if (reason.message.includes('too large')) return 'That backup is too large to import.';
  if (reason.message.includes('valid peri') || reason.message.includes('invalid or damaged')) {
    return 'That file is not a valid peri backup.';
  }
  return 'peri could not open that backup.';
}

function canonicalPersistedState(serialized: string) {
  if (!serialized || serialized.length > maxPersistedStateLength) return null;
  try {
    const parsed = JSON.parse(serialized);
    if (!parsed || typeof parsed !== 'object' || !Number.isInteger(parsed.v)) return null;
    if (!parsed.profile || typeof parsed.profile !== 'object' || Array.isArray(parsed.profile)) return null;
    if (!parsed.entries || typeof parsed.entries !== 'object' || Array.isArray(parsed.entries)) return null;
    return JSON.stringify(parsed);
  } catch {
    return null;
  }
}

async function readPersistedState() {
  if (encryptedPersistedStateFile.exists) {
    const encrypted = await encryptedPersistedStateFile.text();
    const cleartext = await decryptForDeviceAsync(encrypted);
    const canonical = canonicalPersistedState(cleartext);
    if (!canonical) throw new Error('The encrypted peri record is invalid.');
    return canonical;
  }

  if (!legacyPersistedStateFile.exists) return null;
  const canonical = canonicalPersistedState(await legacyPersistedStateFile.text());
  if (!canonical) return null;

  // Seamlessly migrate existing iOS installs from the legacy plaintext file.
  if (isDeviceEncryptionAvailable()) {
    const encrypted = await encryptForDeviceAsync(canonical);
    encryptedPersistedStateFile.create({ overwrite: true, intermediates: true });
    encryptedPersistedStateFile.write(encrypted);
    legacyPersistedStateFile.delete();
  }
  return canonical;
}

let persistedStateWriteQueue: Promise<void> = Promise.resolve();

function writePersistedState(serialized: string) {
  const canonical = canonicalPersistedState(serialized);
  if (!canonical) return Promise.resolve<string | null>(null);

  const write = persistedStateWriteQueue.then(async () => {
    if (isDeviceEncryptionAvailable()) {
      const encrypted = await encryptForDeviceAsync(canonical);
      if (!encryptedPersistedStateFile.exists) {
        encryptedPersistedStateFile.create({ intermediates: true });
      }
      encryptedPersistedStateFile.write(encrypted);
      if (legacyPersistedStateFile.exists) legacyPersistedStateFile.delete();
      return;
    }

    if (!legacyPersistedStateFile.exists) legacyPersistedStateFile.create({ intermediates: true });
    legacyPersistedStateFile.write(canonical);
  });
  persistedStateWriteQueue = write.catch(() => undefined);
  return write.then(() => canonical);
}

async function shareEncryptedBackup(message: Record<string, unknown>) {
  if (typeof message.state !== 'string') throw new Error('No peri record was provided.');
  const canonical = canonicalPersistedState(message.state);
  if (!canonical) throw new Error('The peri record is invalid.');
  if (typeof message.password !== 'string' || message.password.length < 10) {
    throw new Error('Use a backup password with at least 10 characters.');
  }

  const encrypted = await encryptBackupAsync(canonical, message.password);
  await ensureNativeSharing();
  const name = safeExportName(
    message.name,
    `meno-compass-backup-${new Date().toISOString().slice(0, 10)}`,
    '.menocompass',
  );
  await withPrivateExport(name, async file => {
    file.create({ overwrite: true, intermediates: true });
    file.write(encrypted);
    await Sharing.shareAsync(file.uri, {
      dialogTitle: 'Save encrypted peri backup',
      mimeType: 'application/octet-stream',
      UTI: 'public.data',
    });
  });
}

async function chooseAndDecryptBackup(password: string) {
  if (!password) throw new Error('Enter the password used to protect this backup.');
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/octet-stream', 'public.data', '*/*'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset || (typeof asset.size === 'number' && asset.size > maxEncryptedBackupLength)) {
    throw new Error('That backup is too large to import.');
  }
  const payload = await new File(asset.uri).text();
  if (!payload || payload.length > maxEncryptedBackupLength) {
    throw new Error('That backup is too large to import.');
  }
  const decrypted = await decryptBackupAsync(payload, password);
  const canonical = canonicalPersistedState(decrypted);
  if (!canonical) throw new Error('That file is not a valid peri backup.');
  return canonical;
}

function persistedStateIsOnboarded(serialized: string | null) {
  if (!serialized) return false;
  try {
    return JSON.parse(serialized)?.profile?.onboarded === true;
  } catch {
    return false;
  }
}

function hasProAccess(customerInfo: CustomerInfo) {
  return Boolean(customerInfo.entitlements.active[proEntitlement]);
}

/* The analytics choice, asked once before the first page. Exported so the
   store-capture build renders the same screen. */
export function ConsentChoice({ saving, onChoose }: { saving: boolean; onChoose: (allowed: boolean) => void }) {
  return (
    <SafeAreaView style={styles.gate}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.gateContent}>
        <Text style={type.wordmark}>peri</Text>
        <View style={styles.gateRule} />
        <Text style={styles.gateEyebrow}>Before the first page</Text>
        <Text accessibilityRole="header" style={styles.gateTitle}>Help improve peri?</Text>
        <Text style={styles.gateBody}>Optional analytics shares feature-use events and performance with peri and PostHog/Expo. Your entries, answers, notes and brief stay on this device. Sanitized crash diagnostics are separate.</Text>
        <Text style={styles.gateBody}>This is separate from Apple’s advertising permission. Everything works with analytics off. Change your choice, or ask for your analytics to be deleted, under You.</Text>
        <View style={styles.gateActions}>
          <Pressable disabled={saving} accessibilityRole="button" accessibilityState={{ disabled: saving }} style={({ pressed }) => [styles.gatePrimary, pressed && styles.gateButtonPressed, saving && styles.gateButtonDisabled]} onPress={() => onChoose(false)}><Text style={styles.gatePrimaryText}>Continue without analytics</Text></Pressable>
          <Pressable disabled={saving} accessibilityRole="button" accessibilityState={{ disabled: saving }} style={({ pressed }) => [styles.gateSecondary, pressed && styles.gateButtonPressed, saving && styles.gateButtonDisabled]} onPress={() => onChoose(true)}><Text style={styles.gateSecondaryText}>Allow optional analytics</Text></Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* The opening screen: the wordmark, a rule, one line. No mascot. */
function Waiting({ label }: { label: string }) {
  return (
    <View style={styles.waiting}>
      <Text accessibilityRole="header" style={type.wordmark}>peri</Text>
      <View style={styles.waitingRule} />
      <Text style={styles.waitingText}>{label}</Text>
    </View>
  );
}

function App() {
  const otaUpdate = useOtaUpdate();
  const restartRequest = useRef<{ id: string; resolve: () => void; reject: (error: Error) => void } | null>(null);
  const webViewRef = useRef<WebView>(null);
  const { markInteractive } = useObserve();
  const [html, setHtml] = useState<string>();
  const [persistedState, setPersistedState] = useState<string | null>(null);
  const [error, setError] = useState<string>();
  const [recordReady, setRecordReady] = useState(false);
  const [recordUnavailable, setRecordUnavailable] = useState(false);
  const [bootAttempt, setBootAttempt] = useState(0);
  const [recoveryBusy, setRecoveryBusy] = useState(false);
  const [recoveryIssue, setRecoveryIssue] = useState<string>();
  const [recoveryCandidate, setRecoveryCandidate] = useState<string | null>(null);
  const recoveryInFlight = useRef(false);
  const [revenueCatReady, setRevenueCatReady] = useState(false);
  const [subscriptionChecked, setSubscriptionChecked] = useState(Platform.OS !== 'ios');
  const [subscriptionIssue, setSubscriptionIssue] = useState<string>();
  const [proActive, setProActive] = useState(false);
  const [purchaseBusy, setPurchaseBusy] = useState(false);
  const [paywall, setPaywall] = useState<{
    offering: PurchasesOffering;
    source: 'automatic' | 'subscribe_button' | 'feature';
  } | null>(null);
  const persistedStateRef = useRef<string | null>(null);
  const [experienceReady, setExperienceReady] = useState(false);
  const [webContentReady, setWebContentReady] = useState(false);
  const [pendingReviewMilestone, setPendingReviewMilestone] = useState<
    AppReviewProgress['dueMilestone']
  >(null);
  const [consentHydrating, setConsentHydrating] = useState(true);
  const [consentReady, setConsentReady] = useState(false);
  const [privacyChoiceOpen, setPrivacyChoiceOpen] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [consentSaving, setConsentSaving] = useState(false);
  const chooseAnalytics = async (allowed: boolean) => {
    if (consentSaving) return;
    setConsentSaving(true);
    try {
      await setAnalyticsConsent(allowed);
      setAnalyticsEnabled(allowed); setPrivacyChoiceOpen(false); setConsentReady(true);
    } catch {
      await setAnalyticsConsent(false, false);
      setAnalyticsEnabled(false); setPrivacyChoiceOpen(false); setConsentReady(true);
      Alert.alert('Analytics stayed off', 'Your choice could not be saved. You can continue using peri.');
    } finally { setConsentSaving(false); }
  };
  const openAnalyticsReview = () => {
    setAnalyticsEnabled(false);
    void setAnalyticsConsent(false, false).finally(() => setPrivacyChoiceOpen(true));
  };
  useEffect(() => { let active = true;
    void readAnalyticsConsent().then(async choice => {
      if (!active) return;
      if (choice === null) {
        setPrivacyChoiceOpen(true);
        setConsentHydrating(false);
        return;
      }
      await setAnalyticsConsent(choice, false);
      if (active) {
        setAnalyticsEnabled(choice);
        setConsentReady(true);
        setConsentHydrating(false);
      }
    }).catch(() => {
      if (!active) return;
      setPrivacyChoiceOpen(true);
      setConsentHydrating(false);
    });
    return () => { active = false; };
  }, []);
  const [telemetrySettled, setTelemetrySettled] = useState(false);
  const [trackingPromptedThisSession, setTrackingPromptedThisSession] = useState(false);
  const [privacyReady, setPrivacyReady] = useState(Platform.OS !== 'ios');
  const [appLockEnabled, setAppLockEnabled] = useState(false);
  const [appLocked, setAppLocked] = useState(false);
  const [unlockBusy, setUnlockBusy] = useState(false);
  const [unlockIssue, setUnlockIssue] = useState<string>();
  const [appIsActive, setAppIsActive] = useState(AppState.currentState === 'active');
  const [pendingNativeRoute, setPendingNativeRoute] = useState<MenoCompassNativeRoute | null>(null);
  const [nativeNavigation, setNativeNavigation] = useState<{
    route: MenoCompassWebRoute;
    onboarded: boolean;
    sheetOpen: boolean;
    night: boolean;
  }>({ route: 'today', onboarded: false, sheetOpen: false, night: false });
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  /* The paywall opens once, after the first finding (the letter), and after
     that only when a Pro surface asks for it. It never blocks the page. */
  const firstFindingPaywallRef = useRef(false);
  const appLaunchTrackedRef = useRef(false);
  const interactiveMarkedRef = useRef(false);
  const onboardingStartedRef = useRef(false);
  const onboardingCompletedRef = useRef(false);
  const paywallLoadingRef = useRef(false);
  const reviewRequestInFlightRef = useRef(false);
  const nativeShareInFlightRef = useRef(false);
  const nativeBackupImportInFlightRef = useRef(false);
  const privacyChangeInFlightRef = useRef(false);
  const unlockInFlightRef = useRef(false);
  const automaticUnlockAttemptedRef = useRef(false);
  const healthKitInFlightRef = useRef(false);

  const otaRestartIsSafe = () => AppState.currentState === 'active'
    && webContentReady && experienceReady && !appLocked && !keyboardVisible
    && nativeNavigation.onboarded && !nativeNavigation.sheetOpen
    && ['today', 'dossier', 'index'].includes(nativeNavigation.route)
    && !privacyChoiceOpen && consentReady && !purchaseBusy && !paywall && !paywallLoadingRef.current
    && !reviewRequestInFlightRef.current && !nativeShareInFlightRef.current
    && !nativeBackupImportInFlightRef.current && !privacyChangeInFlightRef.current
    && !unlockInFlightRef.current && !healthKitInFlightRef.current;

  const prepareOtaRestart = () => new Promise<void>((resolve, reject) => {
    const id = `${Date.now()}-${Math.random()}`;
    const timer = setTimeout(() => {
      if (restartRequest.current?.id !== id) return;
      restartRequest.current = null;
      reject(new Error('Timed out saving before update'));
    }, 10_000);
    restartRequest.current = {
      id,
      resolve: () => { clearTimeout(timer); restartRequest.current = null; resolve(); },
      reject: error => { clearTimeout(timer); restartRequest.current = null; reject(error); },
    };
    webViewRef.current?.injectJavaScript(`
      window.dispatchEvent(new CustomEvent('menocompass-prepare-update', { detail: ${JSON.stringify({ id })} }));
      true;
    `);
  });

  const syncProStatusToWeb = (active: boolean) => {
    webViewRef.current?.injectJavaScript(`
      window.__MENO_PRO_ACTIVE__ = ${active ? 'true' : 'false'};
      window.dispatchEvent(new Event('menocompass-pro-changed'));
      true;
    `);
  };

  const openNativePrimaryRoute = (route: MenoCompassPrimaryRoute) => {
    setNativeNavigation(current => ({ ...current, route, sheetOpen: false }));
    setTelemetryRoute(route);
    webViewRef.current?.injectJavaScript(`
      (function openMenoCompassPrimaryRoute() {
        var route = ${JSON.stringify(route)};
        var hash = '#' + route;
        if (window.location.hash === hash) window.scrollTo(0, 0);
        else window.location.hash = route;
      })();
      true;
    `);
  };

  const notifyWebShareResult = (kind: NativeShareKind, ok: boolean, message?: string) => {
    const detail = JSON.stringify({ kind, ok, ...(message ? { message } : {}) });
    webViewRef.current?.injectJavaScript(`
      window.dispatchEvent(new CustomEvent('menocompass-native-share-result', { detail: ${detail} }));
      true;
    `);
  };

  const notifyWebPrivacyResult = (detail: Record<string, unknown>) => {
    const serialized = JSON.stringify(detail);
    webViewRef.current?.injectJavaScript(`
      window.dispatchEvent(new CustomEvent('menocompass-native-privacy-result', { detail: ${serialized} }));
      true;
    `);
  };

  const notifyWebHealthKitResult = (detail: Record<string, unknown>) => {
    const serialized = JSON.stringify(detail);
    webViewRef.current?.injectJavaScript(`
      window.dispatchEvent(new CustomEvent('menocompass-healthkit-result', { detail: ${serialized} }));
      true;
    `);
  };

  const refreshNativePrivacyStatus = () => {
    void Promise.all([getAppLockCapabilityAsync(), getReminderStatusAsync()])
      .then(([appLock, reminders]) => {
        setAppLockEnabled(appLock.enabled);
        notifyWebPrivacyResult({
          ok: true,
          appLock,
          reminders,
          deviceEncrypted: isDeviceEncryptionAvailable(),
          analyticsEnabled,
          encryptedBackups: Platform.OS === 'ios',
          healthKitAvailable: isHealthKitAvailable(),
        });
      })
      .catch(reason => {
        reportTelemetryError(reason);
        notifyWebPrivacyResult({ ok: false, message: 'Privacy settings could not be loaded.' });
      });
  };

  const unlockApp = () => {
    if (unlockInFlightRef.current) return;
    unlockInFlightRef.current = true;
    setUnlockBusy(true);
    setUnlockIssue(undefined);
    void authenticateAppUnlockAsync()
      .then(unlocked => {
        if (unlocked) {
          setAppLocked(false);
          setUnlockIssue(undefined);
        } else {
          setUnlockIssue('peri remains locked. Try Face ID or your device passcode again.');
        }
      })
      .catch(reason => {
        reportTelemetryError(reason);
        setUnlockIssue('peri remains locked. Try Face ID or your device passcode again.');
      })
      .finally(() => {
        unlockInFlightRef.current = false;
        setUnlockBusy(false);
      });
  };

  const importEncryptedBackup = (password: string) => {
    if (nativeBackupImportInFlightRef.current) return;
    nativeBackupImportInFlightRef.current = true;
    void chooseAndDecryptBackup(password)
      .then(canonical => {
        if (!canonical) {
          notifyWebPrivacyResult({ action: 'backup-import', ok: false, cancelled: true });
          return;
        }
        const serialized = JSON.stringify({ ok: true, state: canonical });
        webViewRef.current?.injectJavaScript(`
          window.dispatchEvent(new CustomEvent('menocompass-native-backup-import', { detail: ${serialized} }));
          true;
        `);
        notifyWebPrivacyResult({ action: 'backup-import', ok: true });
      })
      .catch(reason => {
        reportTelemetryError(reason);
        const message = nativeBackupImportErrorMessage(reason);
        notifyWebPrivacyResult({ action: 'backup-import', ok: false, message });
        Alert.alert('Could not restore backup', message);
      })
      .finally(() => {
        nativeBackupImportInFlightRef.current = false;
      });
  };

  const runNativeShare = (kind: NativeShareKind, task: () => Promise<void>) => {
    if (nativeShareInFlightRef.current) {
      const message = 'Another export is still being prepared.';
      notifyWebShareResult(kind, false, message);
      Alert.alert('Share already open', message);
      return;
    }

    nativeShareInFlightRef.current = true;
    void task()
      .then(() => notifyWebShareResult(kind, true))
      .catch(reason => {
        reportTelemetryError(reason);
        const message = nativeShareErrorMessage(reason);
        notifyWebShareResult(kind, false, message);
        Alert.alert(kind === 'report' ? 'Could not share report' : 'Could not share export', message);
      })
      .finally(() => {
        nativeShareInFlightRef.current = false;
      });
  };

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    let active = true;
    getAppLockCapabilityAsync()
      .then(capability => {
        if (!active) return;
        setAppLockEnabled(capability.enabled);
        setAppLocked(capability.enabled);
      })
      .catch(error => {
        reportTelemetryError(error);
        if (active) setUnlockIssue('App Lock settings could not be loaded.');
      })
      .finally(() => { if (active) setPrivacyReady(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    const subscription = AppState.addEventListener('change', nextState => {
      setAppIsActive(nextState === 'active');
      if (
        appLockEnabled
        && !unlockInFlightRef.current
        && nextState !== 'active'
      ) {
        automaticUnlockAttemptedRef.current = false;
        setAppLocked(true);
      }
    });
    return () => subscription.remove();
  }, [appLockEnabled]);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    const showSubscription = Keyboard.addListener('keyboardWillShow', () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener('keyboardWillHide', () => {
      setKeyboardVisible(false);
    });
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!appIsActive || !privacyReady || !appLocked || automaticUnlockAttemptedRef.current) return;
    automaticUnlockAttemptedRef.current = true;
    const timer = setTimeout(unlockApp, 250);
    return () => clearTimeout(timer);
  }, [appIsActive, appLocked, privacyReady]);

  useEffect(() => {
    return subscribeToMenoCompassQuickEntries(setPendingNativeRoute);
  }, []);

  useEffect(() => {
    persistedStateRef.current = persistedState;
  }, [persistedState]);

  useEffect(() => {
    let active = true;
    const acceptResponse = (response: Notifications.NotificationResponse | null) => {
      const route = notificationRoute(response);
      if (!active || !route) return;
      setPendingNativeRoute(route);
      Notifications.clearLastNotificationResponse();
    };
    void Notifications.getLastNotificationResponseAsync()
      .then(acceptResponse)
      .catch(reportTelemetryError);
    const subscription = Notifications.addNotificationResponseReceivedListener(acceptResponse);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!pendingNativeRoute || !webContentReady || appLocked) return;
    if (pendingNativeRoute === 'care') {
      webViewRef.current?.injectJavaScript(`
        if (window.location.hash !== '#care') window.location.hash = 'care';
        true;
      `);
    } else {
      injectQuickRoute(
        script => webViewRef.current?.injectJavaScript(script),
        pendingNativeRoute,
      );
    }
    setPendingNativeRoute(null);
  }, [appLocked, pendingNativeRoute, webContentReady]);

  useEffect(() => {
    let active = true;
    setError(undefined);
    setRecordReady(false);
    setRecordUnavailable(false);
    Promise.all([
      Asset.fromModule(appAsset).downloadAsync()
        .then(asset => new File(asset.localUri || asset.uri).text())
        .then(source => { if (active) setHtml(source); return source; }),
      // A missing record resolves to null. Authentication/decryption failures
      // must surface instead of booting a blank database that could overwrite
      // the still-recoverable encrypted file.
      readPersistedState().catch(reason => { if (active) setRecordUnavailable(true); throw reason; }),
    ])
      .then(([source, savedState]) => {
        if (!active) return;
        setPersistedState(savedState);
        setExperienceReady(persistedStateIsOnboarded(savedState));
        setHtml(source);
        setRecordReady(true);
        try { clearPrivateExportFiles(); } catch (reason) { reportTelemetryError(reason); }
        try {
          syncMenoCompassWidgets(savedState);
        } catch (error) {
          reportTelemetryError(error);
        }
      })
      .catch(reason => { if (active) setError(reason instanceof Error ? reason.message : String(reason)); });
    return () => { active = false; };
  }, [bootAttempt]);

  useEffect(() => {
    if (interactiveMarkedRef.current || !html || !privacyReady || !subscriptionChecked || !appIsActive) return;
    const routeName = appLocked ? 'lock'
      : webContentReady ? (experienceReady ? 'main' : 'letter') : undefined;
    if (routeName) { markInteractive({ routeName }); interactiveMarkedRef.current = true; }
  }, [html, privacyReady, subscriptionChecked, appIsActive, appLocked, experienceReady, webContentReady, markInteractive]);

  useEffect(() => {
    const listener = AppState.addEventListener('change', state => { if (state !== 'active') { telemetryBackground(); flushTelemetry(); } else telemetryForeground(); });
    return () => listener.remove();
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;

    let active = true;
    const updateCustomer = (customerInfo: CustomerInfo) => {
      if (!active) return;
      const nextProActive = hasProAccess(customerInfo);
      setProActive(nextProActive);
      setSubscriptionChecked(true);
      setSubscriptionIssue(undefined);
      setTelemetrySubscriptionState(customerInfo);
      syncProStatusToWeb(nextProActive);
    };

    try {
      Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN);
      Purchases.configure({
        apiKey: revenueCatIosApiKey,
        automaticDeviceIdentifierCollectionEnabled: false,
      });
      Purchases.addCustomerInfoUpdateListener(updateCustomer);
      setRevenueCatReady(true);
      Purchases.getCustomerInfo().then(updateCustomer).catch(error => {
        if (!active) return;
        reportTelemetryError(error);
        trackTelemetryEvent('subscription_check_failed', { reason: 'sdk_error' });
        setSubscriptionChecked(true);
        setSubscriptionIssue('peri could not verify your subscription. Check your connection and try again.');
      });
    } catch (error) {
      reportTelemetryError(error);
      trackTelemetryEvent('subscription_check_failed', { reason: 'sdk_error' });
      setSubscriptionChecked(true);
      setSubscriptionIssue('Subscriptions are temporarily unavailable. Please reopen peri and try again.');
      setRevenueCatReady(false);
    }

    return () => {
      active = false;
      Purchases.removeCustomerInfoUpdateListener(updateCustomer);
    };
  }, []);

  useEffect(() => {
    if (!consentReady || privacyChoiceOpen || !privacyReady || appLocked || !appIsActive || paywall || purchaseBusy || nativeNavigation.sheetOpen || keyboardVisible) {
      if (!appIsActive || appLocked) suspendAdvertising();
      return;
    }
    telemetryForeground();
    let active = true;
    const timer = setTimeout(() => {
      void initializeTelemetry().then(result => {
        if (!active) return;
        setTrackingPromptedThisSession(result.promptedForTracking);
        setTelemetrySettled(true);
      }).catch(() => { if (active) setTelemetrySettled(true); });
    }, 300);
    return () => { active = false; clearTimeout(timer); cancelPendingTrackingPermission(); };
  }, [consentReady, privacyChoiceOpen, privacyReady, appLocked, appIsActive, paywall, purchaseBusy, nativeNavigation.sheetOpen, keyboardVisible]);

  useEffect(() => {
    // Session replay recorded the native onboarding preview; the letter lives
    // in the WebView, which is never recorded. Replay stays off everywhere.
    setTelemetryReplay(false);
    return () => setTelemetryReplay(false);
  }, []);

  useEffect(() => {
    if (!html || !telemetrySettled || appLaunchTrackedRef.current) return;
    appLaunchTrackedRef.current = true;
    trackTelemetryEvent('app_launched');
  }, [experienceReady, html, telemetrySettled]);

  useEffect(() => {
    if (!webContentReady || !telemetrySettled || experienceReady || onboardingStartedRef.current) return;
    onboardingStartedRef.current = true;
    trackTelemetryEvent('onboarding_started', { flowVersion: letterFlowVersion, surface: 'web' });
  }, [webContentReady, telemetrySettled, experienceReady]);

  useEffect(() => {
    if (
      Platform.OS !== 'ios'
      || !experienceReady
      || !webContentReady
      || !telemetrySettled
      || trackingPromptedThisSession
      || pendingReviewMilestone === null
      || reviewRequestInFlightRef.current
    ) return;

    let active = true;
    const timer = setTimeout(() => {
      reviewRequestInFlightRef.current = true;
      requestReviewForMilestone(pendingReviewMilestone)
        .then(requested => {
          if (active && requested) setPendingReviewMilestone(null);
        })
        .catch(reportTelemetryError)
        .finally(() => { reviewRequestInFlightRef.current = false; });
    }, 1_800);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [
    experienceReady,
    pendingReviewMilestone,
    telemetrySettled,
    trackingPromptedThisSession,
    webContentReady,
  ]);

  const openPaywall = async (source: 'automatic' | 'subscribe_button' | 'feature') => {
    if (!revenueCatReady || purchaseBusy || paywall || paywallLoadingRef.current) return;
    paywallLoadingRef.current = true;
    setPurchaseBusy(true);
    trackTelemetryEvent('paywall_requested', { source });
    try {
      const offerings = await Purchases.getOfferings();
      if (!offerings.current || offerings.current.availablePackages.length === 0) {
        trackTelemetryEvent('paywall_failed', { source, reason: 'no_offering' });
        setSubscriptionIssue('Subscription plans are temporarily unavailable. Please try again later.');
        return;
      }

      const hasFreeTrial = offerings.current.availablePackages.some(
        availablePackage =>
          availablePackage.product.introPrice?.price === 0
          || availablePackage.product.discounts?.some(discount => discount.price === 0),
      );
      if (hasFreeTrial) {
        trackTelemetryEvent('paywall_failed', { source, reason: 'free_offer' });
        setSubscriptionIssue('Subscription plans are temporarily unavailable. Please try again later.');
        if (__DEV__) console.error('Remove the free introductory offer from every peri product in App Store Connect.');
        return;
      }

      setSubscriptionIssue(undefined);
      setPaywall({ offering: offerings.current, source });
    } catch (reason) {
      trackTelemetryEvent('paywall_failed', { source, reason: 'offerings_error' });
      reportTelemetryError(reason);
      setSubscriptionIssue('peri could not reach the App Store. Check your connection and try again.');
    } finally {
      paywallLoadingRef.current = false;
      setPurchaseBusy(false);
    }
  };

  const requestPaywall = (source: 'subscribe_button' | 'feature' = 'subscribe_button') => {
    if (purchaseBusy || proActive) return;
    if (!revenueCatReady) {
      setSubscriptionIssue('Subscriptions are temporarily unavailable. Please reopen peri and try again.');
      return;
    }
    void openPaywall(source);
  };

  /* After the letter: the first finding is on the page behind this sheet.
     Shown once per install session, dismissible, and only on iOS. */
  const offerProAfterFirstFinding = () => {
    if (Platform.OS !== 'ios' || proActive || firstFindingPaywallRef.current) return;
    firstFindingPaywallRef.current = true;
    if (!revenueCatReady) return;
    void openPaywall('automatic');
  };

  const openExternalLink = (url: unknown) => {
    if (typeof url !== 'string') return;
    try {
      const parsed = new URL(url);
      if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password) return;
    } catch { return; }
    void Linking.openURL(url).catch(() => {
      Alert.alert('Could not open this link', 'Please check your connection and try again. Your appointment brief is still here.');
    });
  };

  const handleWebMessage = (event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      if (message.type === 'open-external-link') {
        openExternalLink(message.url);
        return;
      }
      if (message?.type === 'webview-error') {
        reportTelemetryError(webViewDiagnosticError(message));
        return;
      }
      if (message?.type === 'webview-ready') {
        setWebContentReady(true);
        trackTelemetryEvent('webview_ready');
        return;
      }
      if (message?.type === 'navigation-state' && isWebRoute(message.route)) {
        setNativeNavigation({
          route: message.route,
          onboarded: message.onboarded === true,
          sheetOpen: message.sheetOpen === true,
          night: message.night === true,
        });
        setTelemetryRoute(message.route);
        return;
      }
      if (message?.type === 'ota-restart-state') {
        const request = restartRequest.current;
        if (!request || message.id !== request.id) return;
        if (message.safe !== true || typeof message.state !== 'string' || !otaRestartIsSafe()) {
          request.reject(new Error('Finish your current activity before restarting'));
          return;
        }
        void writePersistedState(message.state).then(canonical => {
          if (restartRequest.current !== request) return;
          if (!canonical) throw new Error('Invalid record');
          request.resolve();
        }).catch(reason => {
          if (restartRequest.current === request) request.reject(reason);
        });
        return;
      }
      if (message?.type === 'persist-state' && typeof message.state === 'string') {
        void writePersistedState(message.state)
          .then(canonical => {
            if (!canonical) return;
            setPersistedState(canonical);
            setExperienceReady(persistedStateIsOnboarded(canonical));
            try {
              syncMenoCompassWidgets(canonical);
            } catch (error) {
              reportTelemetryError(error);
            }
          })
          .catch(reason => {
            reportTelemetryError(reason);
            notifyWebPrivacyResult({
              action: 'state-save',
              ok: false,
              message: 'Your latest changes could not be saved securely.',
            });
          });
        return;
      }
      if (message?.type === 'onboarding-finished') {
        if (onboardingStartedRef.current && !onboardingCompletedRef.current) {
          onboardingCompletedRef.current = true;
          trackTelemetryEvent('onboarding_completed', { skipped: message.skipped === true, flowVersion: letterFlowVersion, surface: 'web' });
        }
        setExperienceReady(true);
        offerProAfterFirstFinding();
        return;
      }
      if (message?.type === 'onboarding-step' && Number.isInteger(message.step)) {
        if (!onboardingStartedRef.current) {
          onboardingStartedRef.current = true;
          trackTelemetryEvent('onboarding_started', { flowVersion: letterFlowVersion, surface: 'web' });
        }
        trackTelemetryEvent('onboarding_step_viewed', { step: message.step, flowVersion: letterFlowVersion, surface: 'web' });
        return;
      }
      if (message?.type === 'onboarding-step-left') {
        trackTelemetryEvent('onboarding_step_left', { step: message.step, durationMs: message.durationMs, flowVersion: letterFlowVersion, surface: 'web' });
        return;
      }
      if (message?.type === 'onboarding-selection-limit') {
        trackTelemetryEvent('onboarding_selection_limit', { step: 1, flowVersion: letterFlowVersion, surface: 'web' });
        return;
      }
      if (message?.type === 'checkin-confirmed') {
        trackTelemetryEvent('checkin_confirmed');
        registerSuccessfulMoment()
          .then(({ dueMilestone }) => setPendingReviewMilestone(dueMilestone))
          .catch(reportTelemetryError);
        return;
      }
      if (message?.type === 'report-opened') {
        const rangeDays = [30, 90, 180].includes(Number(message.rangeDays))
          ? Number(message.rangeDays)
          : 90;
        trackTelemetryEvent('report_opened', { rangeDays });
        return;
      }
      if (message?.type === 'share-file') {
        runNativeShare('file', () => shareTextExport(message));
        return;
      }
      if (message?.type === 'share-report') {
        runNativeShare('report', () => shareReport(message));
        return;
      }
      if (message?.type === 'export-encrypted-backup') {
        runNativeShare('backup', () => shareEncryptedBackup(message));
        return;
      }
      if (message?.type === 'import-encrypted-backup' && typeof message.password === 'string') {
        importEncryptedBackup(message.password);
        return;
      }
      if (message?.type === 'analytics-settings') { openAnalyticsReview(); return; }
      if (message?.type === 'advertising-settings') { void Linking.openSettings(); return; }
      if (message?.type === 'erase-analytics') {
        void deleteTrackingData().then(accepted => {
          setAnalyticsEnabled(false);
          Alert.alert('Analytics turned off', accepted ? 'Your analytics deletion request was accepted. Provider erasure runs asynchronously. Restart peri before enabling analytics again.' : 'Deletion is saved on this device and will retry when you reopen peri online.');
        }).catch(() => Alert.alert('Deletion could not be saved', 'Analytics is off. Please try deleting again.'));
        return;
      }
      if (message?.type === 'get-native-privacy-status') {
        refreshNativePrivacyStatus();
        return;
      }
      if (message?.type === 'clear-native-private-data') {
        if (privacyChangeInFlightRef.current) return;
        privacyChangeInFlightRef.current = true;
        void deleteTrackingData().catch(() => false);
        setAnalyticsEnabled(false);
        void clearNativePrivateDataAsync()
          .then(({ appLock, reminders }) => {
            setAppLockEnabled(false);
            setAppLocked(false);
            notifyWebPrivacyResult({
              action: 'private-data-cleared',
              ok: true,
              appLock,
              reminders,
            });
          })
          .catch(reason => {
            reportTelemetryError(reason);
            notifyWebPrivacyResult({
              action: 'private-data-cleared',
              ok: false,
              message: 'Native privacy settings could not be fully cleared.',
            });
          })
          .finally(() => { privacyChangeInFlightRef.current = false; });
        return;
      }
      if (message?.type === 'healthkit-status') {
        void getHealthKitRequestStatus()
          .then(status => notifyWebHealthKitResult({ action: 'status', ok: true, status }))
          .catch(reason => {
            reportTelemetryError(reason);
            notifyWebHealthKitResult({
              action: 'status',
              ok: false,
              message: 'Apple Health status could not be loaded.',
            });
          });
        return;
      }
      if (message?.type === 'healthkit-sync') {
        if (message.userInitiated !== true || healthKitInFlightRef.current) return;
        healthKitInFlightRef.current = true;
        const lookbackDays = Number.isFinite(Number(message.lookbackDays))
          ? Number(message.lookbackDays)
          : 7;
        void connectAndSyncHealthKit({ userInitiated: true, lookbackDays })
          .then(result => notifyWebHealthKitResult({ action: 'sync', ok: true, ...result }))
          .catch(reason => {
            reportTelemetryError(reason);
            notifyWebHealthKitResult({
              action: 'sync',
              ok: false,
              message: 'Apple Health could not be synced. No peri data was changed.',
            });
          })
          .finally(() => { healthKitInFlightRef.current = false; });
        return;
      }
      if (message?.type === 'configure-reminders') {
        if (privacyChangeInFlightRef.current) return;
        privacyChangeInFlightRef.current = true;
        void configureRemindersAsync(message.preferences, message.requestPermission === true)
          .then(reminders => notifyWebPrivacyResult({ action: 'reminders', ok: true, reminders }))
          .catch(reason => {
            reportTelemetryError(reason);
            const text = reason instanceof Error ? reason.message : 'Reminders could not be updated.';
            notifyWebPrivacyResult({ action: 'reminders', ok: false, message: text });
            Alert.alert('Reminders not changed', text);
          })
          .finally(() => { privacyChangeInFlightRef.current = false; });
        return;
      }
      if (message?.type === 'set-app-lock' && typeof message.enabled === 'boolean') {
        if (privacyChangeInFlightRef.current) return;
        privacyChangeInFlightRef.current = true;
        void setAppLockEnabledAsync(message.enabled)
          .then(appLock => {
            setAppLockEnabled(appLock.enabled);
            if (!appLock.enabled) setAppLocked(false);
            notifyWebPrivacyResult({ action: 'app-lock', ok: true, appLock });
          })
          .catch(reason => {
            reportTelemetryError(reason);
            const text = reason instanceof Error ? reason.message : 'App Lock could not be changed.';
            notifyWebPrivacyResult({ action: 'app-lock', ok: false, message: text });
            Alert.alert('App Lock not changed', text);
          })
          .finally(() => { privacyChangeInFlightRef.current = false; });
        return;
      }
      if (message?.type === 'open-subscription-management') {
        trackTelemetryEvent('subscription_management_opened');
        Linking.openURL('https://apps.apple.com/account/subscriptions').catch(reportTelemetryError);
        return;
      }
      if (message?.type === 'open-pro-paywall') { requestPaywall('feature'); return; }
      if (message?.type === 'restore-purchases') { void restorePurchases(); return; }
    } catch {
      // Ignore non-peri messages from the embedded document.
    }
  };

  const restorePurchases = async () => {
    if (!revenueCatReady || purchaseBusy) return;
    setPurchaseBusy(true);
    trackTelemetryEvent('subscription_restore_started', { source: 'gate' });
    try {
      const customerInfo = await Purchases.restorePurchases();
      const restored = hasProAccess(customerInfo);
      setProActive(restored);
      setSubscriptionChecked(true);
      setSubscriptionIssue(restored ? undefined : 'No active peri subscription was found for this Apple ID.');
      setTelemetrySubscriptionState(customerInfo);
      trackTelemetryEvent('subscription_restore_completed', { source: 'gate', ...subscriptionSnapshot(customerInfo) });
      Alert.alert(restored ? 'Purchase restored' : 'Nothing to restore', restored ? 'peri Pro is active.' : 'No peri Pro purchase was found for this Apple ID.');
    } catch (reason) {
      trackTelemetryEvent('subscription_restore_failed', { source: 'gate' });
      reportTelemetryError(reason);
      Alert.alert('Restore unavailable', 'peri could not restore purchases. Please try again later.');
    } finally {
      setPurchaseBusy(false);
    }
  };

  const restoreRecordFromBackup = async (password: string) => {
    if (recoveryInFlight.current || !html) return;
    recoveryInFlight.current = true;
    setRecoveryBusy(true);
    setRecoveryIssue(undefined);
    try {
      const candidate = await chooseAndDecryptBackup(password);
      if (candidate) {
        setRecoveryCandidate(candidate);
        return; // Remain busy until strict WebView validation has finished.
      }
    } catch (reason) {
      setRecoveryIssue(nativeBackupImportErrorMessage(reason));
    }
    recoveryInFlight.current = false;
    setRecoveryBusy(false);
  };

  const acceptRecoveryBackup = async (validated: string | null) => {
    setRecoveryCandidate(null);
    try {
      if (!validated || !canonicalPersistedState(validated)) {
        throw new Error('That backup is invalid or uses a newer app version. Your existing record was kept.');
      }
      await persistedStateWriteQueue;
      await preserveUnreadableRecord([encryptedPersistedStateFile, legacyPersistedStateFile]);
      const canonical = await writePersistedState(validated);
      if (!canonical) throw new Error('The backup could not be saved. Your existing record was kept.');
      setPersistedState(canonical);
      setExperienceReady(persistedStateIsOnboarded(canonical));
      setRecordReady(true);
      setError(undefined);
      try { syncMenoCompassWidgets(canonical); } catch (reason) { reportTelemetryError(reason); }
      Alert.alert('Backup restored', 'Your backup was checked and restored. A copy of the unreadable record has been kept on this device.');
    } catch (reason) {
      setRecoveryIssue(reason instanceof Error ? reason.message : 'Your backup could not be restored. Please try again.');
    } finally {
      recoveryInFlight.current = false;
      setRecoveryBusy(false);
    }
  };

  const confirmRecoveryReset = () => Alert.alert(
    'Delete the unreadable record?',
    'This permanently deletes your device-local record and any recovery copies. Only a backup you saved separately can restore it. Your subscription will not be cancelled.',
    [
      { text: 'Keep my record', style: 'cancel' },
      { text: 'Delete and start again', style: 'destructive', onPress: () => {
        if (recoveryInFlight.current) return;
        recoveryInFlight.current = true;
        setRecoveryBusy(true);
        setRecoveryIssue(undefined);
        void (async () => {
          await persistedStateWriteQueue;
          await clearNativePrivateDataAsync();
          deleteUnreadableRecord([encryptedPersistedStateFile, legacyPersistedStateFile]);
          setAppLockEnabled(false);
          setAppLocked(false);
          setAnalyticsEnabled(false);
          void deleteTrackingData().catch(() => false);
          try { syncMenoCompassWidgets(null); } catch (reason) { reportTelemetryError(reason); }
          setBootAttempt(attempt => attempt + 1);
        })().catch(() => setRecoveryIssue('Your record could not be deleted completely. Please try again.'))
          .finally(() => { recoveryInFlight.current = false; setRecoveryBusy(false); });
      } },
    ],
  );

  if ((!recordReady && !error) || !privacyReady || (Platform.OS === 'ios' && !subscriptionChecked)) {
    return <SafeAreaView accessibilityLiveRegion="polite" style={styles.loading}><StatusBar style="dark" /><Waiting label={error ? 'The record could not be opened.' : 'Opening the record.'} />{error ? <Text accessibilityRole="alert" selectable style={styles.error}>{error}</Text> : null}</SafeAreaView>;
  }

  if (Platform.OS === 'ios' && appLocked) {
    return (
      <SafeAreaView style={styles.locked}>
        <StatusBar style="dark" />
        <Text style={type.wordmark}>peri</Text>
        <View style={styles.lockedRule} />
        <Text style={styles.lockedEyebrow}>The record</Text>
        <Text accessibilityRole="header" style={styles.lockedTitle}>Locked.</Text>
        <Text selectable style={styles.lockedBody}>
          Face ID, Touch ID or your passcode opens it.
        </Text>
        {unlockIssue ? <Text accessibilityRole="alert" style={styles.lockedIssue}>{unlockIssue}</Text> : null}
        <Pressable
          accessibilityHint="Opens the secure iOS authentication prompt."
          accessibilityLabel="Unlock peri"
          accessibilityRole="button"
          accessibilityState={{ busy: unlockBusy, disabled: unlockBusy }}
          disabled={unlockBusy}
          onPress={unlockApp}
          style={({ pressed }) => [
            styles.lockedButton,
            pressed && styles.gateButtonPressed,
            unlockBusy && styles.gateButtonDisabled,
          ]}
        >
          {unlockBusy
            ? <ActivityIndicator color={color.paper} />
            : <Text style={styles.lockedButtonText}>Unlock</Text>}
        </Pressable>
      </SafeAreaView>
    );
  }

  if (error) {
    return <View style={styles.container}>
      <StatusBar style="dark" />
      <RecordRecovery busy={recoveryBusy} issue={recoveryIssue}
        recordUnavailable={recordUnavailable} canRestore={recordUnavailable && !!html && isDeviceEncryptionAvailable()}
        onRetry={() => { setRecoveryIssue(undefined); setBootAttempt(attempt => attempt + 1); }}
        onRestore={password => { void restoreRecordFromBackup(password); }} onReset={confirmRecoveryReset} />
      {html && recoveryCandidate && <RecoveryBackupValidator html={html} candidate={recoveryCandidate} onResult={state => { void acceptRecoveryBackup(state); }} />}
    </View>;
  }
  if (!html) {
    return <SafeAreaView style={styles.loading}><Waiting label="Opening the record." /></SafeAreaView>;
  }

  const consentGate = consentGatePhase(consentHydrating, privacyChoiceOpen, consentReady);
  if (consentGate === 'loading') {
    return <SafeAreaView accessibilityLiveRegion="polite" style={styles.loading}><StatusBar style="dark" /><Waiting label="Reading your privacy settings." /></SafeAreaView>;
  }
  if (consentGate === 'choice') {
    return <ConsentChoice saving={consentSaving} onChoose={allowed => void chooseAnalytics(allowed)} />;
  }

  if (Platform.OS === 'ios' && paywall) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <TrackedPaywall
          offering={paywall.offering}
          source={paywall.source}
          onCustomer={customerInfo => {
            const active = hasProAccess(customerInfo);
            setProActive(active);
            setSubscriptionChecked(true);
            setSubscriptionIssue(active ? undefined : 'No active peri subscription was found for this Apple ID.');
            syncProStatusToWeb(active);
          }}
          onClose={() => setPaywall(null)}
          onFailure={() => {
            setPaywall(null);
            setSubscriptionIssue('The subscription screen could not load. Please try again.');
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, nativeNavigation.night && styles.containerNight]}>
      <StatusBar style={nativeNavigation.night ? 'light' : 'dark'} />
      <OtaUpdateBanner update={otaUpdate} isSafe={otaRestartIsSafe} prepareRestart={prepareOtaRestart} />
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html }}
        injectedJavaScriptBeforeContentLoaded={`
          ${webViewDiagnosticsScript}
          window.__MENO_NATIVE__ = true;
          window.__MENO_NATIVE_SUBSCRIPTIONS__ = ${Platform.OS === 'ios' ? 'true' : 'false'};
          window.__MENO_NATIVE_TABS__ = ${Platform.OS === 'ios' ? 'true' : 'false'};
          window.__MENO_PRO_ACTIVE__ = ${proActive ? 'true' : 'false'};
          window.__MENO_PERSISTED_STATE__ = ${JSON.stringify(persistedState || '')};
          (function prepareNativeViewport() {
            var apply = function () {
              if (!document.head) return;
              var viewport = document.querySelector('meta[name="viewport"]');
              if (!viewport) {
                viewport = document.createElement('meta');
                viewport.name = 'viewport';
                document.head.appendChild(viewport);
              }
              viewport.content = 'width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover';
              document.documentElement.classList.add('native-app');
              if (window.__MENO_NATIVE_TABS__ === true) {
                document.documentElement.classList.add('native-ios-tabs');
              }
            };
            apply();
            document.addEventListener('DOMContentLoaded', apply, { once: true });
          })();
          true;
        `}
        javaScriptEnabled
        domStorageEnabled
        textInteractionEnabled
        directionalLockEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        allowFileAccess
        allowUniversalAccessFromFileURLs={false}
        mixedContentMode="never"
        setSupportMultipleWindows={false}
        onLoadStart={() => setWebContentReady(false)}
        onError={() => { setWebContentReady(false); reportTelemetryError(new Error('Embedded content failed to load.')); }}
        onContentProcessDidTerminate={() => { setWebContentReady(false); reportTelemetryError(new Error('Embedded content process terminated.')); webViewRef.current?.reload(); }}
        onLoadEnd={() => {
          syncProStatusToWeb(proActive);
          refreshNativePrivacyStatus();
          webViewRef.current?.injectJavaScript(`
            window.dispatchEvent(new Event('menocompass-native-navigation-request'));
            true;
          `);
        }}
        onMessage={handleWebMessage}
        onOpenWindow={({ nativeEvent }) => openExternalLink(nativeEvent.targetUrl)}
        onShouldStartLoadWithRequest={({ url }) => {
          if (url === 'about:blank' || url.startsWith('data:') || url.startsWith('file:')) return true;
          if (/^https?:/i.test(url)) { openExternalLink(url); return false; }
          return false;
        }}
        style={[styles.webview, nativeNavigation.night && styles.containerNight]}
      />
      {Platform.OS === 'ios'
        && webContentReady
        && experienceReady
        && nativeNavigation.onboarded
        && !nativeNavigation.sheetOpen
        && !keyboardVisible
        && isPrimaryRoute(nativeNavigation.route)
        ? (
          <NativeTabBar
            activeRoute={nativeNavigation.route}
            night={nativeNavigation.night}
            onSelect={openNativePrimaryRoute}
          />
        )
        : null}
    </SafeAreaView>
  );
}

function AppWithSafeArea() {
  return <SafeAreaProvider><PostHogMaskView style={{ flex: 1 }}><App /></PostHogMaskView></SafeAreaProvider>;
}

export default ObserveRoot.wrap(AppWithSafeArea);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.paper },
  containerNight: { backgroundColor: color.night },
  webview: { flex: 1, backgroundColor: color.paper },
  waiting: { alignItems: 'flex-start', gap: 14, width: '100%', maxWidth: 420 },
  waitingRule: { width: '100%', height: 2, backgroundColor: color.ink },
  waitingText: { ...type.bodyMuted },
  gate: { flex: 1, backgroundColor: color.paper },
  gateContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 28, width: '100%', maxWidth: 560, alignSelf: 'center' },
  gateRule: { height: 2, backgroundColor: color.ink, marginTop: 10, marginBottom: 26 },
  gateEyebrow: { ...type.eyebrow, marginBottom: 10 },
  gateTitle: { ...type.display },
  gateBody: { ...type.body, color: color.grey, marginTop: 14 },
  gateActions: { marginTop: 28, gap: 10 },
  gatePrimary: { minHeight: 54, borderRadius: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: color.ink },
  gatePrimaryText: { ...type.button },
  gateSecondary: { minHeight: 54, borderRadius: 6, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: color.ink },
  gateSecondaryText: { ...type.button, color: color.ink },
  gateButtonPressed: { opacity: 0.72 },
  gateButtonDisabled: { opacity: 0.45 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 24, backgroundColor: color.paper },
  error: { ...type.small, color: color.vermilionText, textAlign: 'left', maxWidth: 420, width: '100%' },
  locked: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, backgroundColor: color.paper },
  lockedRule: { height: 2, backgroundColor: color.ink, marginTop: 10, marginBottom: 26 },
  lockedEyebrow: { ...type.eyebrow, marginBottom: 10 },
  lockedTitle: { ...type.display },
  lockedBody: { ...type.body, color: color.grey, marginTop: 14, maxWidth: 420 },
  lockedIssue: { ...type.small, color: color.vermilionText, marginTop: 14, maxWidth: 420 },
  lockedButton: { width: '100%', maxWidth: 420, minHeight: 54, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginTop: 28, backgroundColor: color.ink },
  lockedButtonText: { ...type.button },
});
