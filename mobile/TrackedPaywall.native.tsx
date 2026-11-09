import { uuid } from './analytics-session';
import { Component, useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useFonts } from 'expo-font';
import type { CustomerInfo, PurchasesOffering } from 'react-native-purchases';
import RevenueCatUI from 'react-native-purchases-ui';
import { subscriptionSnapshot } from './commerce-events';
import { reportTelemetryError, setTelemetrySubscriptionState, trackTelemetryEvent } from './telemetry.native';

const BRICOLAGE = {
  'Bricolage-Regular': require('./assets/fonts/Bricolage-Regular.ttf'),
  'Bricolage-SemiBold': require('./assets/fonts/Bricolage-SemiBold.ttf'),
  'Bricolage-Bold': require('./assets/fonts/Bricolage-Bold.ttf'),
  'Bricolage-ExtraBold': require('./assets/fonts/Bricolage-ExtraBold.ttf'),
};
const PAPER = '#f8f4ed', INK = '#244b43', MUTED = '#5f6f66', SAGE = '#e4ecda', LEAF = '#a3c28e';

type Props = {
  offering: PurchasesOffering;
  source: 'automatic' | 'subscribe_button' | 'feature';
  allowDismiss?: boolean;
  /** Shown above RevenueCat paywall when onboarding supplied symptom focus (A/B variant). */
  personalizedSymptoms?: string[];
  onCustomer: (customerInfo: CustomerInfo) => void;
  onClose: () => void;
  onFailure: () => void;
};

class PaywallBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error) {
    trackTelemetryEvent('paywall_failed', { reason: 'render_error' });
    reportTelemetryError(error);
    this.props.onFailure();
  }
  render() { return this.state.failed ? null : this.props.children; }
}

export function TrackedPaywall({ offering, source, allowDismiss = false, personalizedSymptoms, onCustomer, onClose, onFailure }: Props) {
  const [fontsReady] = useFonts(BRICOLAGE);
  // Keep the purchase view available while fonts load; use the same static faces as setup.
  const font = (family: keyof typeof BRICOLAGE) => fontsReady ? { fontFamily: family, fontWeight: 'normal' as const } : null;
  const mounted = useRef(false);
  const finished = useRef(false);
  const [storeBusy, setStoreBusy] = useState(false);
  const storeBusyRef = useRef(false);
  const setStoreOperationBusy = (busy: boolean) => { storeBusyRef.current = busy; setStoreBusy(busy); };
  const selectedProduct = useRef<{ productId: string; packageType: string; price: number; currency: string } | undefined>(undefined);
  const attempt = useRef<{ attemptId: string; started: number } | undefined>(undefined);
  const attemptFields = () => attempt.current ? { attemptId: attempt.current.attemptId, durationMs: Math.max(0, Date.now() - attempt.current.started) } : {};
  const context = { offeringId: offering.identifier, source };
  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    // Native view mount, not a claim that remote paywall content finished loading.
    trackTelemetryEvent('paywall_rendered', context);
  }, []);

  const acceptCustomer = (customerInfo: CustomerInfo, restoring: boolean) => {
    setStoreOperationBusy(false);
    if (finished.current) return;
    setTelemetrySubscriptionState(customerInfo);
    trackTelemetryEvent(restoring ? 'subscription_restore_completed' : 'purchase_completed', {
      ...context,
      ...(!restoring ? { ...selectedProduct.current, ...attemptFields() } : {}),
      ...subscriptionSnapshot(customerInfo),
      source: 'paywall',
    });
    onCustomer(customerInfo);
    // A completed store operation without the entitlement must remain gated.
    if (customerInfo.entitlements.active['MenoCompass Pro']) {
      if (!restoring) trackTelemetryEvent('purchase_access_confirmed', { ...context, ...selectedProduct.current, ...attemptFields() });
      finished.current = true;
      onClose();
    }
  };

  const dismiss = () => {
    if (finished.current || storeBusyRef.current) return;
    finished.current = true;
    trackTelemetryEvent('paywall_dismissed', context);
    onClose();
  };

  const focusLabels = personalizedSymptoms?.filter(Boolean).slice(0, 3) ?? [];

  return (
    <PaywallBoundary onFailure={onFailure}>
      <View style={{ flex: 1, backgroundColor: PAPER }}>
        {allowDismiss && <Pressable accessibilityRole="button" accessibilityLabel="Back to my preview" accessibilityState={{ disabled: storeBusy }} disabled={storeBusy} onPress={dismiss} style={{ minHeight: 48, justifyContent: 'center', paddingHorizontal: 24, backgroundColor: PAPER }}><Text style={[{ fontSize: 15, color: INK }, font('Bricolage-Regular')]}>Back to my preview</Text></Pressable>}
        {focusLabels.length > 0 && (
          <View style={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 16, backgroundColor: PAPER, borderBottomWidth: 1, borderBottomColor: '#e6e0d5' }}>
            <Text style={[{ fontSize: 11, letterSpacing: 1.2, color: MUTED, fontWeight: '700', marginBottom: 6 }, font('Bricolage-Bold')]}>YOUR PLAN FOCUS</Text>
            <Text accessibilityRole="header" style={[{ fontSize: 22, lineHeight: 26, color: INK, fontWeight: '800', marginBottom: 8 }, font('Bricolage-ExtraBold')]}>Built around what you shared</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {focusLabels.map(label => (
                <View key={label} style={{ backgroundColor: SAGE, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1, borderColor: LEAF }}>
                  <Text style={[{ fontSize: 14, color: INK, fontWeight: '600' }, font('Bricolage-SemiBold')]}>{label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        <RevenueCatUI.Paywall
          style={{ flex: 1 }}
          options={{ offering, displayCloseButton: allowDismiss }}
          onPurchaseStarted={({ packageBeingPurchased }) => {
            setStoreOperationBusy(true);
            attempt.current = { attemptId: uuid(), started: Date.now() };
            selectedProduct.current = {
              productId: packageBeingPurchased.product.identifier,
              packageType: packageBeingPurchased.packageType,
              price: packageBeingPurchased.product.price,
              currency: packageBeingPurchased.product.currencyCode,
            };
            trackTelemetryEvent('purchase_started', { ...context, ...selectedProduct.current, ...attemptFields() });
          }}
          onPurchaseCancelled={() => {
            setStoreOperationBusy(false);
            trackTelemetryEvent('purchase_cancelled', { ...context, ...selectedProduct.current, ...attemptFields() });
            selectedProduct.current = undefined;
          }}
          onPurchaseError={({ error }) => {
            setStoreOperationBusy(false);
            trackTelemetryEvent('purchase_failed', { ...context, ...selectedProduct.current, ...attemptFields(), errorCode: error.code });
            selectedProduct.current = undefined;
            reportTelemetryError(error);
          }}
          onPurchaseCompleted={({ customerInfo }) => acceptCustomer(customerInfo, false)}
          onRestoreStarted={() => { setStoreOperationBusy(true); trackTelemetryEvent('subscription_restore_started', { ...context, source: 'paywall' }); }}
          onRestoreCompleted={({ customerInfo }) => acceptCustomer(customerInfo, true)}
          onRestoreError={({ error }) => {
            setStoreOperationBusy(false);
            trackTelemetryEvent('subscription_restore_failed', { ...context, source: 'paywall', errorCode: error.code });
            reportTelemetryError(error);
          }}
          onDismiss={dismiss}
        />
      </View>
    </PaywallBoundary>
  );
}
