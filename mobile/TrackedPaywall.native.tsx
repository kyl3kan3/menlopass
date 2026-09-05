import { Component, useEffect, useRef, type ReactNode } from 'react';
import { View } from 'react-native';
import type { CustomerInfo, PurchasesOffering } from 'react-native-purchases';
import RevenueCatUI from 'react-native-purchases-ui';
import { subscriptionSnapshot } from './commerce-events';
import { reportTelemetryError, setTelemetrySubscriptionState, trackTelemetryEvent } from './telemetry.native';

type Props = {
  offering: PurchasesOffering;
  source: 'automatic' | 'subscribe_button' | 'feature';
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

export function TrackedPaywall({ offering, source, onCustomer, onClose, onFailure }: Props) {
  const mounted = useRef(false);
  const finished = useRef(false);
  const selectedProduct = useRef<{ productId: string; packageType: string } | undefined>(undefined);
  const context = { offeringId: offering.identifier, source };
  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    // Native view mount, not a claim that remote paywall content finished loading.
    trackTelemetryEvent('paywall_rendered', context);
  }, []);

  const acceptCustomer = (customerInfo: CustomerInfo, restoring: boolean) => {
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

  return (
    <PaywallBoundary onFailure={onFailure}>
      <View style={{ flex: 1 }}>
        <RevenueCatUI.Paywall
          style={{ flex: 1 }}
          options={{ offering, displayCloseButton: false }}
          onPurchaseStarted={({ packageBeingPurchased }) => {
            selectedProduct.current = {
              productId: packageBeingPurchased.product.identifier,
              packageType: packageBeingPurchased.packageType,
            };
            trackTelemetryEvent('purchase_started', { ...context, ...selectedProduct.current });
          }}
          onPurchaseCancelled={() => {
            trackTelemetryEvent('purchase_cancelled', { ...context, ...selectedProduct.current });
            selectedProduct.current = undefined;
          }}
          onPurchaseError={({ error }) => {
            trackTelemetryEvent('purchase_failed', { ...context, ...selectedProduct.current, errorCode: error.code });
            selectedProduct.current = undefined;
            reportTelemetryError(error);
          }}
          onPurchaseCompleted={({ customerInfo }) => acceptCustomer(customerInfo, false)}
          onRestoreStarted={() => trackTelemetryEvent('subscription_restore_started', { ...context, source: 'paywall' })}
          onRestoreCompleted={({ customerInfo }) => acceptCustomer(customerInfo, true)}
          onRestoreError={({ error }) => {
            trackTelemetryEvent('subscription_restore_failed', { ...context, source: 'paywall', errorCode: error.code });
            reportTelemetryError(error);
          }}
          onDismiss={() => {
            if (finished.current) return;
            finished.current = true;
            trackTelemetryEvent('paywall_dismissed', context);
            onClose();
          }}
        />
      </View>
    </PaywallBoundary>
  );
}
