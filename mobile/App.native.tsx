import { Asset } from 'expo-asset';
import { File, Paths } from 'expo-file-system';
import { ObserveRoot, useObserve } from 'expo-observe';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Purchases, { CustomerInfo, LOG_LEVEL } from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import {
  initializeTelemetry,
  reportTelemetryError,
  setTelemetrySubscriptionState,
  trackTelemetryEvent,
} from './telemetry.native';
import {
  registerSuccessfulMoment,
  requestReviewForMilestone,
} from './reviewPrompt.native';
import type { AppReviewProgress } from './reviewPrompt.native';

const appAsset = require('./assets/menlopass.html');
const revenueCatIosApiKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || 'appl_SJzoZsrDheugNgeVISkHmDeKoOk';
const proEntitlement = 'MenoCompass Pro';
const maxPersistedStateLength = 5_000_000;
const maxNativeShareContentLength = 5_000_000;
const persistedStateFile = new File(Paths.document, 'menocompass-state.json');
const supportedNativeExports = {
  'application/json': { extension: '.json', uti: 'public.json' },
  'text/csv': { extension: '.csv', uti: 'public.comma-separated-values-text' },
} as const;

type NativeExportMime = keyof typeof supportedNativeExports;
type NativeShareKind = 'file' | 'report';

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
  const file = new File(Paths.cache, name);
  file.create({ overwrite: true, intermediates: true });
  file.write(message.contents);

  await Sharing.shareAsync(file.uri, {
    dialogTitle: 'Share MenoCompass export',
    mimeType: mime,
    UTI: format.uti,
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
  const printableFile = new File(Paths.cache, name);
  let shareUri = generated.uri;

  try {
    const generatedFile = new File(generated.uri);
    await generatedFile.copy(printableFile, { overwrite: true });
    shareUri = printableFile.uri;
    generatedFile.delete();
  } catch {
    // The generated PDF is still shareable if assigning a friendly name fails.
  }

  await Sharing.shareAsync(shareUri, {
    dialogTitle: 'Share MenoCompass report',
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
  });
}

function nativeShareErrorMessage(reason: unknown) {
  if (reason instanceof Error && [
    'Native sharing is unavailable on this device.',
    'This export has no data to share.',
    'This export is too large to share.',
    'This export format is not supported.',
    'This report has no content to share.',
    'This report is too large to share.',
  ].includes(reason.message)) {
    return reason.message;
  }
  return 'MenoCompass could not prepare that export. Please try again.';
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
  if (!persistedStateFile.exists) return null;
  return canonicalPersistedState(await persistedStateFile.text());
}

function writePersistedState(serialized: string) {
  const canonical = canonicalPersistedState(serialized);
  if (!canonical) return null;
  if (!persistedStateFile.exists) persistedStateFile.create({ intermediates: true });
  persistedStateFile.write(canonical);
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

type SubscriptionGateProps = {
  issue?: string;
  purchaseBusy: boolean;
  revenueCatReady: boolean;
  onRestore: () => void;
  onSubscribe: () => void;
};

function SubscriptionGate({
  issue,
  purchaseBusy,
  revenueCatReady,
  onRestore,
  onSubscribe,
}: SubscriptionGateProps) {
  return (
    <SafeAreaView style={styles.gate}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.gateContent}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <View accessible={false} importantForAccessibility="no" style={styles.gateMark}>
          <Text style={styles.gateMarkText}>M</Text>
        </View>
        <Text style={styles.gateEyebrow}>MENOCOMPASS</Text>
        <Text style={styles.gateTitle}>Your menopause record, all in one place.</Text>
        <Text selectable style={styles.gateBody}>
          An active monthly or annual subscription is required to use MenoCompass. There is no free tier or free trial.
        </Text>
        <View style={styles.gateFeatures}>
          <Text selectable style={styles.gateFeature}>•  Daily symptoms, sleep, medications, and labs</Text>
          <Text selectable style={styles.gateFeature}>•  Personal trends and pattern summaries</Text>
          <Text selectable style={styles.gateFeature}>•  Clinician-ready reports and evidence guide</Text>
        </View>
        {issue ? <Text accessibilityRole="alert" selectable style={styles.gateIssue}>{issue}</Text> : null}
        <Pressable
          accessibilityHint="Shows the monthly and annual subscription options from the App Store."
          accessibilityLabel="View subscription plans"
          accessibilityRole="button"
          accessibilityState={{ disabled: !revenueCatReady || purchaseBusy, busy: purchaseBusy }}
          disabled={!revenueCatReady || purchaseBusy}
          onPress={onSubscribe}
          style={({ pressed }) => [
            styles.gatePrimary,
            pressed && styles.gateButtonPressed,
            (!revenueCatReady || purchaseBusy) && styles.gateButtonDisabled,
          ]}
        >
          {purchaseBusy ? <ActivityIndicator color="#0E1618" /> : <Text style={styles.gatePrimaryText}>View subscription plans</Text>}
        </Pressable>
        <Pressable
          accessibilityHint="Checks this Apple ID for a previous MenoCompass purchase."
          accessibilityLabel="Restore purchases"
          accessibilityRole="button"
          accessibilityState={{ disabled: !revenueCatReady || purchaseBusy, busy: purchaseBusy }}
          disabled={!revenueCatReady || purchaseBusy}
          onPress={onRestore}
          style={({ pressed }) => [styles.gateSecondary, pressed && styles.gateButtonPressed]}
        >
          <Text style={styles.gateSecondaryText}>Restore purchases</Text>
        </Pressable>
        <Text selectable style={styles.gateTerms}>
          The exact price and billing period are shown before purchase. Payment is charged immediately after confirmation and renews automatically unless canceled.
        </Text>
        <View style={styles.gateLinks}>
          <Pressable
            accessibilityHint="Opens the MenoCompass privacy policy in your browser."
            accessibilityRole="link"
            onPress={() => void Linking.openURL('https://menlopass.vercel.app/privacy.html')}
          >
            <Text style={styles.gateLink}>Privacy</Text>
          </Pressable>
          <Text accessible={false} style={styles.gateLinkDivider}>·</Text>
          <Pressable
            accessibilityHint="Opens the MenoCompass terms in your browser."
            accessibilityRole="link"
            onPress={() => void Linking.openURL('https://menlopass.vercel.app/terms.html')}
          >
            <Text style={styles.gateLink}>Terms</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function App() {
  const webViewRef = useRef<WebView>(null);
  const { markInteractive } = useObserve();
  const [html, setHtml] = useState<string>();
  const [persistedState, setPersistedState] = useState<string | null>(null);
  const [error, setError] = useState<string>();
  const [revenueCatReady, setRevenueCatReady] = useState(false);
  const [subscriptionChecked, setSubscriptionChecked] = useState(Platform.OS !== 'ios');
  const [subscriptionIssue, setSubscriptionIssue] = useState<string>();
  const [proActive, setProActive] = useState(false);
  const [purchaseBusy, setPurchaseBusy] = useState(false);
  const [experienceReady, setExperienceReady] = useState(false);
  const [webContentReady, setWebContentReady] = useState(false);
  const [pendingReviewMilestone, setPendingReviewMilestone] = useState<
    AppReviewProgress['dueMilestone']
  >(null);
  const [telemetrySettled, setTelemetrySettled] = useState(false);
  const [trackingPromptedThisSession, setTrackingPromptedThisSession] = useState(false);
  const autoPaywallAttemptedRef = useRef(false);
  const appLaunchTrackedRef = useRef(false);
  const reviewRequestInFlightRef = useRef(false);
  const nativeShareInFlightRef = useRef(false);

  const syncProStatusToWeb = (active: boolean) => {
    webViewRef.current?.injectJavaScript(`
      window.__MENO_PRO_ACTIVE__ = ${active ? 'true' : 'false'};
      window.dispatchEvent(new Event('menocompass-pro-changed'));
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
    let active = true;
    Promise.all([
      Asset.fromModule(appAsset).downloadAsync().then(asset => new File(asset.localUri || asset.uri).text()),
      readPersistedState().catch(() => null),
    ])
      .then(([source, savedState]) => {
        if (!active) return;
        setPersistedState(savedState);
        setExperienceReady(persistedStateIsOnboarded(savedState));
        setHtml(source);
      })
      .catch(reason => { if (active) setError(reason instanceof Error ? reason.message : String(reason)); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!html) return;
    if (Platform.OS === 'ios') {
      if (!subscriptionChecked) return;
      markInteractive({ routeName: proActive ? 'main' : 'subscription' });
      return;
    }
    markInteractive({ routeName: 'main' });
  }, [html, markInteractive, proActive, subscriptionChecked]);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;

    let active = true;
    const updateCustomer = (customerInfo: CustomerInfo) => {
      if (!active) return;
      const nextProActive = hasProAccess(customerInfo);
      setProActive(nextProActive);
      setSubscriptionChecked(true);
      setSubscriptionIssue(undefined);
      setTelemetrySubscriptionState(nextProActive);
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
        setSubscriptionChecked(true);
        setSubscriptionIssue('MenoCompass could not verify your subscription. Check your connection and try again.');
      });
    } catch (error) {
      reportTelemetryError(error);
      setSubscriptionChecked(true);
      setSubscriptionIssue('Subscriptions are temporarily unavailable. Please reopen MenoCompass and try again.');
      setRevenueCatReady(false);
    }

    return () => {
      active = false;
      Purchases.removeCustomerInfoUpdateListener(updateCustomer);
    };
  }, []);

  useEffect(() => {
    if (Platform.OS === 'ios') return;
    initializeTelemetry()
      .then(result => {
        setTrackingPromptedThisSession(result.promptedForTracking);
        setTelemetrySettled(true);
      })
      .catch(error => {
        reportTelemetryError(error);
        setTelemetrySettled(true);
      });
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'ios' || !revenueCatReady || !subscriptionChecked) return;

    let active = true;
    const timer = setTimeout(() => {
      initializeTelemetry()
        .then(result => {
          if (!active) return;
          setTelemetrySubscriptionState(proActive);
          setTrackingPromptedThisSession(result.promptedForTracking);
          setTelemetrySettled(true);
        })
        .catch(error => {
          reportTelemetryError(error);
          if (active) {
            setTelemetrySubscriptionState(proActive);
            setTelemetrySettled(true);
          }
        });
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [proActive, revenueCatReady, subscriptionChecked]);

  useEffect(() => {
    if (!html || !telemetrySettled || appLaunchTrackedRef.current) return;
    appLaunchTrackedRef.current = true;
    trackTelemetryEvent('app_launched');
    if (!experienceReady) trackTelemetryEvent('onboarding_started');
  }, [experienceReady, html, telemetrySettled]);

  useEffect(() => {
    if (
      Platform.OS !== 'ios'
      || !proActive
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
    proActive,
    telemetrySettled,
    trackingPromptedThisSession,
    webContentReady,
  ]);

  const openPaywall = async () => {
    if (!revenueCatReady || purchaseBusy) return;
    setPurchaseBusy(true);
    try {
      const offerings = await Purchases.getOfferings();
      if (!offerings.current || offerings.current.availablePackages.length === 0) {
        setSubscriptionIssue('Subscription plans are temporarily unavailable. Please try again later.');
        return;
      }

      const hasFreeTrial = offerings.current.availablePackages.some(
        availablePackage =>
          availablePackage.product.introPrice?.price === 0
          || availablePackage.product.discounts?.some(discount => discount.price === 0),
      );
      if (hasFreeTrial) {
        setSubscriptionIssue('Subscription plans are temporarily unavailable. Please try again later.');
        if (__DEV__) console.error('Remove the free introductory offer from every MenoCompass product in App Store Connect.');
        return;
      }

      setSubscriptionIssue(undefined);
      trackTelemetryEvent('paywall_opened');
      const result = await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: proEntitlement,
        offering: offerings.current,
        displayCloseButton: false,
      });
      const active = hasProAccess(await Purchases.getCustomerInfo());
      setProActive(active);
      setSubscriptionChecked(true);
      setTelemetrySubscriptionState(active);
      if (result === PAYWALL_RESULT.PURCHASED) trackTelemetryEvent('subscription_activated');
      if (result === PAYWALL_RESULT.CANCELLED) trackTelemetryEvent('paywall_dismissed');
    } catch (reason) {
      reportTelemetryError(reason);
      setSubscriptionIssue('MenoCompass could not reach the App Store. Check your connection and try again.');
    } finally {
      setPurchaseBusy(false);
    }
  };

  const requestPaywall = () => {
    if (purchaseBusy || proActive) return;
    if (!revenueCatReady) {
      setSubscriptionIssue('Subscriptions are temporarily unavailable. Please reopen MenoCompass and try again.');
      return;
    }
    void openPaywall();
  };

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    if (proActive) {
      autoPaywallAttemptedRef.current = false;
      return;
    }
    if (
      !subscriptionChecked
      || !revenueCatReady
      || !telemetrySettled
      || purchaseBusy
      || autoPaywallAttemptedRef.current
    ) return;

    autoPaywallAttemptedRef.current = true;
    void openPaywall();
  }, [subscriptionChecked, proActive, revenueCatReady, telemetrySettled, purchaseBusy]);

  const handleWebMessage = (event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      if (message?.type === 'persist-state' && typeof message.state === 'string') {
        const canonical = writePersistedState(message.state);
        if (canonical) {
          setPersistedState(canonical);
          setExperienceReady(persistedStateIsOnboarded(canonical));
        }
        return;
      }
      if (message?.type === 'onboarding-finished') {
        setExperienceReady(true);
        trackTelemetryEvent('onboarding_completed', { skipped: message.skipped === true });
        return;
      }
      if (message?.type === 'onboarding-step' && Number.isInteger(message.step)) {
        trackTelemetryEvent('onboarding_step_viewed', { step: message.step });
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
      if (message?.type === 'open-subscription-management') {
        trackTelemetryEvent('subscription_management_opened');
        Linking.openURL('https://apps.apple.com/account/subscriptions').catch(reportTelemetryError);
        return;
      }
      if (message?.type === 'open-pro-paywall') requestPaywall();
    } catch {
      // Ignore non-MenoCompass messages from the embedded document.
    }
  };

  const restorePurchases = async () => {
    if (!revenueCatReady || purchaseBusy) return;
    setPurchaseBusy(true);
    trackTelemetryEvent('subscription_restore_started');
    try {
      const customerInfo = await Purchases.restorePurchases();
      const restored = hasProAccess(customerInfo);
      setProActive(restored);
      setSubscriptionChecked(true);
      setSubscriptionIssue(restored ? undefined : 'No active MenoCompass subscription was found for this Apple ID.');
      setTelemetrySubscriptionState(restored);
      trackTelemetryEvent('subscription_restore_completed');
      Alert.alert(restored ? 'Purchase restored' : 'Nothing to restore', restored ? 'MenoCompass Pro is active.' : 'No MenoCompass Pro purchase was found for this Apple ID.');
    } catch (reason) {
      trackTelemetryEvent('subscription_restore_failed');
      reportTelemetryError(reason);
      Alert.alert('Restore unavailable', 'MenoCompass could not restore purchases. Please try again later.');
    } finally {
      setPurchaseBusy(false);
    }
  };

  if (!html || (Platform.OS === 'ios' && !subscriptionChecked)) {
    return <SafeAreaView accessibilityLiveRegion="polite" style={styles.loading}><StatusBar style="light" /><ActivityIndicator color="#E8A552" /><Text style={styles.loadingText}>{error ? 'Could not open MenoCompass.' : 'Opening MenoCompass…'}</Text>{error ? <Text accessibilityRole="alert" selectable style={styles.error}>{error}</Text> : null}</SafeAreaView>;
  }

  if (Platform.OS === 'ios' && !proActive) {
    return (
      <SubscriptionGate
        issue={subscriptionIssue}
        purchaseBusy={purchaseBusy}
        revenueCatReady={revenueCatReady}
        onRestore={() => void restorePurchases()}
        onSubscribe={requestPaywall}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html }}
        injectedJavaScriptBeforeContentLoaded={`
          window.__MENO_NATIVE__ = true;
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
            };
            apply();
            document.addEventListener('DOMContentLoaded', apply, { once: true });
          })();
          true;
        `}
        javaScriptEnabled
        domStorageEnabled
        textInteractionEnabled
        allowFileAccess
        allowUniversalAccessFromFileURLs={false}
        mixedContentMode="never"
        setSupportMultipleWindows={false}
        onLoadEnd={() => {
          setWebContentReady(true);
          syncProStatusToWeb(proActive);
        }}
        onMessage={handleWebMessage}
        onShouldStartLoadWithRequest={({ url }) => {
          if (url === 'about:blank' || url.startsWith('data:') || url.startsWith('file:')) return true;
          if (/^https?:/i.test(url)) { Linking.openURL(url); return false; }
          return false;
        }}
        style={styles.webview}
      />
    </SafeAreaView>
  );
}

function AppWithSafeArea() {
  return <SafeAreaProvider><App /></SafeAreaProvider>;
}

export default ObserveRoot.wrap(AppWithSafeArea);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0E1618' },
  webview: { flex: 1, backgroundColor: '#0E1618' },
  gate: { flex: 1, backgroundColor: '#0E1618' },
  gateContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 24 },
  gateMark: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 18, backgroundColor: '#E8A552' },
  gateMarkText: { color: '#0E1618', fontSize: 27, fontWeight: '900' },
  gateEyebrow: { color: '#E8A552', fontSize: 11, fontWeight: '800', letterSpacing: 2.2, marginBottom: 10 },
  gateTitle: { maxWidth: 420, color: '#E9F1EE', fontSize: 30, lineHeight: 36, fontWeight: '800', textAlign: 'center' },
  gateBody: { maxWidth: 420, marginTop: 14, color: '#B8C8C5', fontSize: 15, lineHeight: 22, textAlign: 'center' },
  gateFeatures: { width: '100%', maxWidth: 420, gap: 10, marginTop: 24, marginBottom: 24 },
  gateFeature: { color: '#E9F1EE', fontSize: 14, lineHeight: 20, paddingLeft: 18 },
  gateIssue: { maxWidth: 420, marginBottom: 14, color: '#E8A552', fontSize: 12, lineHeight: 17, textAlign: 'center' },
  gatePrimary: { width: '100%', maxWidth: 420, minHeight: 52, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E8A552' },
  gatePrimaryText: { color: '#0E1618', fontSize: 15, fontWeight: '900' },
  gateSecondary: { minHeight: 44, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  gateSecondaryText: { color: '#E9F1EE', fontSize: 13, fontWeight: '700' },
  gateButtonPressed: { opacity: 0.72 },
  gateButtonDisabled: { opacity: 0.45 },
  gateTerms: { maxWidth: 420, marginTop: 8, color: '#718685', fontSize: 11, lineHeight: 16, textAlign: 'center' },
  gateLinks: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  gateLink: { color: '#93A8A8', fontSize: 12, textDecorationLine: 'underline' },
  gateLinkDivider: { color: '#526768', fontSize: 12 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, backgroundColor: '#0E1618' },
  loadingText: { color: '#E9F1EE', fontSize: 16 },
  error: { color: '#E0755F', textAlign: 'center', fontSize: 12 },
});
