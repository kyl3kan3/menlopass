import { Asset } from 'expo-asset';
import { File, Paths } from 'expo-file-system';
import { ObserveRoot, useObserve } from 'expo-observe';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Platform, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import Purchases, { CustomerInfo, LOG_LEVEL } from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import {
  initializeTelemetry,
  reportTelemetryError,
  setTelemetrySubscriptionState,
  trackTelemetryEvent,
} from './telemetry.native';

const appAsset = require('./assets/menlopass.html');
const revenueCatIosApiKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || 'appl_SJzoZsrDheugNgeVISkHmDeKoOk';
const proEntitlement = 'MenoCompass Pro';
const maxPersistedStateLength = 5_000_000;
const persistedStateFile = new File(Paths.document, 'menocompass-state.json');

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
  if (!canonical) return;
  if (!persistedStateFile.exists) persistedStateFile.create({ intermediates: true });
  persistedStateFile.write(canonical);
}

function hasProAccess(customerInfo: CustomerInfo) {
  return Boolean(customerInfo.entitlements.active[proEntitlement]);
}

function App() {
  const webViewRef = useRef<WebView>(null);
  const { markInteractive } = useObserve();
  const [html, setHtml] = useState<string>();
  const [persistedState, setPersistedState] = useState<string | null>(null);
  const [error, setError] = useState<string>();
  const [revenueCatReady, setRevenueCatReady] = useState(false);
  const [revenueCatUnavailable, setRevenueCatUnavailable] = useState(false);
  const [proActive, setProActive] = useState(false);
  const [purchaseBusy, setPurchaseBusy] = useState(false);
  const pendingPaywallRef = useRef(false);

  const syncProStatusToWeb = (active: boolean) => {
    webViewRef.current?.injectJavaScript(`
      window.__MENO_PRO_ACTIVE__ = ${active ? 'true' : 'false'};
      window.dispatchEvent(new Event('menocompass-pro-changed'));
      true;
    `);
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
        setHtml(source);
      })
      .catch(reason => { if (active) setError(reason instanceof Error ? reason.message : String(reason)); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (html) markInteractive({ routeName: 'main' });
  }, [html, markInteractive]);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;

    let active = true;
    const updateCustomer = (customerInfo: CustomerInfo) => {
      if (!active) return;
      const nextProActive = hasProAccess(customerInfo);
      setProActive(nextProActive);
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
      setRevenueCatUnavailable(false);
      setRevenueCatReady(true);
      Purchases.getCustomerInfo().then(updateCustomer).catch(() => undefined);
      void initializeTelemetry();
    } catch {
      pendingPaywallRef.current = false;
      setRevenueCatUnavailable(true);
      setRevenueCatReady(false);
    }

    return () => {
      active = false;
      Purchases.removeCustomerInfoUpdateListener(updateCustomer);
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'ios') void initializeTelemetry();
  }, []);

  const openPaywall = async () => {
    if (!revenueCatReady || purchaseBusy) return;
    setPurchaseBusy(true);
    try {
      const offerings = await Purchases.getOfferings();
      if (!offerings.current || offerings.current.availablePackages.length === 0) {
        Alert.alert('MenoCompass Pro', 'Subscriptions are temporarily unavailable. Please try again later.');
        return;
      }
      trackTelemetryEvent('paywall_opened');
      const result = await RevenueCatUI.presentPaywall({ offering: offerings.current, displayCloseButton: true });
      const active = hasProAccess(await Purchases.getCustomerInfo());
      setProActive(active);
      setTelemetrySubscriptionState(active);
      if (result === PAYWALL_RESULT.PURCHASED) trackTelemetryEvent('subscription_activated');
    } catch (reason) {
      reportTelemetryError(reason);
      Alert.alert('Subscriptions unavailable', 'MenoCompass could not reach the App Store. Please try again later.');
    } finally {
      setPurchaseBusy(false);
    }
  };

  const requestPaywall = () => {
    if (purchaseBusy || proActive) return;
    if (revenueCatUnavailable) {
      Alert.alert('Subscriptions unavailable', 'MenoCompass could not connect to the App Store. Please try again after reopening the app.');
      return;
    }
    if (!revenueCatReady) {
      pendingPaywallRef.current = true;
      return;
    }
    void openPaywall();
  };

  useEffect(() => {
    if (!revenueCatReady || purchaseBusy || !pendingPaywallRef.current) return;
    pendingPaywallRef.current = false;
    void openPaywall();
  }, [revenueCatReady, purchaseBusy]);

  const handleWebMessage = (event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      if (message?.type === 'persist-state' && typeof message.state === 'string') {
        writePersistedState(message.state);
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

  if (!html) {
    return <SafeAreaView style={styles.loading}><StatusBar style="light" /><ActivityIndicator color="#E8A552" /><Text style={styles.loadingText}>{error ? 'Could not open MenoCompass.' : 'Opening MenoCompass…'}</Text>{error ? <Text style={styles.error}>{error}</Text> : null}</SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      {Platform.OS === 'ios' ? <View style={styles.subscriptionBar}>
        <Text style={styles.subscriptionTitle}>MenoCompass</Text>
        <View style={styles.subscriptionActions}>
          <Pressable accessibilityRole="button" disabled={!revenueCatReady || purchaseBusy} onPress={restorePurchases} style={styles.restoreButton}>
            <Text style={styles.restoreText}>Restore</Text>
          </Pressable>
          <Pressable accessibilityRole="button" disabled={purchaseBusy || proActive} onPress={requestPaywall} style={[styles.proButton, proActive && styles.proButtonActive]}>
            <Text style={styles.proButtonText}>{proActive ? 'Pro active' : purchaseBusy ? 'Opening…' : 'Explore Pro'}</Text>
          </Pressable>
        </View>
      </View> : null}
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html }}
        injectedJavaScriptBeforeContentLoaded={`
          window.__MENO_NATIVE__ = true;
          window.__MENO_PRO_ACTIVE__ = ${proActive ? 'true' : 'false'};
          window.__MENO_PERSISTED_STATE__ = ${JSON.stringify(persistedState || '')};
          (function lockNativeViewport() {
            var apply = function () {
              if (!document.head) return;
              var viewport = document.querySelector('meta[name="viewport"]');
              if (!viewport) {
                viewport = document.createElement('meta');
                viewport.name = 'viewport';
                document.head.appendChild(viewport);
              }
              viewport.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover';
              document.documentElement.classList.add('native-app');
            };
            apply();
            document.addEventListener('DOMContentLoaded', apply, { once: true });
          })();
          true;
        `}
        javaScriptEnabled
        domStorageEnabled
        allowFileAccess
        allowUniversalAccessFromFileURLs={false}
        mixedContentMode="never"
        setSupportMultipleWindows={false}
        onLoadEnd={() => syncProStatusToWeb(proActive)}
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

export default ObserveRoot.wrap(App);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0E1618' },
  webview: { flex: 1, backgroundColor: '#0E1618' },
  subscriptionBar: { minHeight: 46, paddingHorizontal: 12, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#2B3B3D', backgroundColor: '#0E1618' },
  subscriptionTitle: { color: '#E9F1EE', fontSize: 14, fontWeight: '700' },
  subscriptionActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  restoreButton: { paddingHorizontal: 8, paddingVertical: 7 },
  restoreText: { color: '#93A8A8', fontSize: 12, fontWeight: '600' },
  proButton: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: '#E8A552' },
  proButtonActive: { backgroundColor: '#3B735F' },
  proButtonText: { color: '#0E1618', fontSize: 12, fontWeight: '800' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, backgroundColor: '#0E1618' },
  loadingText: { color: '#E9F1EE', fontSize: 16 },
  error: { color: '#E0755F', textAlign: 'center', fontSize: 12 },
});
