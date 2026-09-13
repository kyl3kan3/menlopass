import { Component, useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { CustomerInfo, PurchasesOffering } from 'react-native-purchases';
import RevenueCatUI from 'react-native-purchases-ui';
import { subscriptionSnapshot } from './commerce-events';
import { reportTelemetryError, setTelemetrySubscriptionState, trackTelemetryEvent } from './telemetry.native';

type Props = {
  offering: PurchasesOffering;
  source: 'automatic' | 'subscribe_button' | 'feature';
  allowDismiss?: boolean;
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

export function TrackedPaywall({ offering, source, allowDismiss = false, onCustomer, onClose, onFailure }: Props) {
  const mounted = useRef(false);
  const finished = useRef(false);
  const [storeBusy, setStoreBusy] = useState(false);
  const storeBusyRef = useRef(false);
  const setStoreOperationBusy = (busy: boolean) => { storeBusyRef.current = busy; setStoreBusy(busy); };
  const selectedProduct = useRef<{ productId: string; packageType: string } | undefined>(undefined);
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
      ...(!restoring ? selectedProduct.current : {}),
      ...subscriptionSnapshot(customerInfo),
      source: 'paywall',
    });
    onCustomer(customerInfo);
    // A completed store operation without the entitlement must remain gated.
    if (customerInfo.entitlements.active['MenoCompass Pro']) {
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

  return (
    <PaywallBoundary onFailure={onFailure}>
      <View style={{ flex: 1 }}>
        {allowDismiss && <Pressable accessibilityRole="button" accessibilityLabel="Back to my preview" accessibilityState={{ disabled: storeBusy }} disabled={storeBusy} onPress={dismiss} style={{ minHeight: 48, justifyContent: 'center', paddingHorizontal: 24, backgroundColor: '#f7f5ef' }}><Text style={{ fontSize: 15, color: '#244b43' }}>Back to my preview</Text></Pressable>}
        <RevenueCatUI.Paywall
          style={{ flex: 1 }}
          options={{ offering, displayCloseButton: allowDismiss }}
          onPurchaseStarted={({ packageBeingPurchased }) => {
            setStoreOperationBusy(true);
            selectedProduct.current = {
              productId: packageBeingPurchased.product.identifier,
              packageType: packageBeingPurchased.packageType,
            };
            trackTelemetryEvent('purchase_started', { ...context, ...selectedProduct.current });
          }}
          onPurchaseCancelled={() => {
            setStoreOperationBusy(false);
            trackTelemetryEvent('purchase_cancelled', { ...context, ...selectedProduct.current });
            selectedProduct.current = undefined;
          }}
          onPurchaseError={({ error }) => {
            setStoreOperationBusy(false);
            trackTelemetryEvent('purchase_failed', { ...context, ...selectedProduct.current, errorCode: error.code });
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
