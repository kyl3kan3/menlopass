import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Platform, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import Purchases, { CustomerInfo, LOG_LEVEL } from 'react-native-purchases';
import RevenueCatUI from 'react-native-purchases-ui';
import { WebView } from 'react-native-webview';

const appAsset = require('./assets/menlopass.html');
const revenueCatIosApiKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || 'appl_SJzoZsrDheugNgeVISkHmDeKoOk';
const proEntitlement = 'MenoCompass Pro';

function hasProAccess(customerInfo: CustomerInfo) {
  return Boolean(customerInfo.entitlements.active[proEntitlement]);
}

export default function App() {
  const [html, setHtml] = useState<string>();
  const [error, setError] = useState<string>();
  const [revenueCatReady, setRevenueCatReady] = useState(false);
  const [proActive, setProActive] = useState(false);
  const [purchaseBusy, setPurchaseBusy] = useState(false);

  useEffect(() => {
    let active = true;
    Asset.fromModule(appAsset).downloadAsync()
      .then(asset => new File(asset.localUri || asset.uri).text())
      .then(source => { if (active) setHtml(source); })
      .catch(reason => { if (active) setError(reason instanceof Error ? reason.message : String(reason)); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;

    let active = true;
    const updateCustomer = (customerInfo: CustomerInfo) => {
      if (active) setProActive(hasProAccess(customerInfo));
    };

    try {
      Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN);
      Purchases.configure({ apiKey: revenueCatIosApiKey });
      Purchases.addCustomerInfoUpdateListener(updateCustomer);
      setRevenueCatReady(true);
      Purchases.getCustomerInfo().then(updateCustomer).catch(() => undefined);
    } catch {
      setRevenueCatReady(false);
    }

    return () => {
      active = false;
      Purchases.removeCustomerInfoUpdateListener(updateCustomer);
    };
  }, []);

  const openPaywall = async () => {
    if (!revenueCatReady || purchaseBusy) return;
    setPurchaseBusy(true);
    try {
      const offerings = await Purchases.getOfferings();
      if (!offerings.current || offerings.current.availablePackages.length === 0) {
        Alert.alert('MenoCompass Pro', 'Subscriptions are being prepared for TestFlight. No purchase was made.');
        return;
      }
      await RevenueCatUI.presentPaywall({ offering: offerings.current, displayCloseButton: true });
      setProActive(hasProAccess(await Purchases.getCustomerInfo()));
    } catch {
      Alert.alert('Subscriptions unavailable', 'MenoCompass could not reach the App Store. Please try again later.');
    } finally {
      setPurchaseBusy(false);
    }
  };

  const restorePurchases = async () => {
    if (!revenueCatReady || purchaseBusy) return;
    setPurchaseBusy(true);
    try {
      const customerInfo = await Purchases.restorePurchases();
      const restored = hasProAccess(customerInfo);
      setProActive(restored);
      Alert.alert(restored ? 'Purchase restored' : 'Nothing to restore', restored ? 'MenoCompass Pro is active.' : 'No MenoCompass Pro purchase was found for this Apple ID.');
    } catch {
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
          <Pressable accessibilityRole="button" disabled={!revenueCatReady || purchaseBusy || proActive} onPress={openPaywall} style={[styles.proButton, proActive && styles.proButtonActive]}>
            <Text style={styles.proButtonText}>{proActive ? 'Pro active' : purchaseBusy ? 'Opening…' : 'Explore Pro'}</Text>
          </Pressable>
        </View>
      </View> : null}
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        javaScriptEnabled
        domStorageEnabled
        allowFileAccess
        allowUniversalAccessFromFileURLs={false}
        mixedContentMode="never"
        setSupportMultipleWindows={false}
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
