import { uuid } from './analytics-session';
import { Component, useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { CustomerInfo, PurchasesOffering } from 'react-native-purchases';
import RevenueCatUI from 'react-native-purchases-ui';
import { subscriptionSnapshot } from './commerce-events';
import { reportTelemetryError, setTelemetrySubscriptionState, trackTelemetryEvent } from './telemetry.native';
import { color, font, type } from './theme';

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

/* The paywall never blocks the page: the record, the ledger and the finding of
   the day are free, so the sheet can always be put down. The RevenueCat
   paywall itself is configured in the RevenueCat dashboard; this wrapper adds
   the masthead line above it and keeps the store events honest. */
export function TrackedPaywall({ offering, source, onCustomer, onClose, onFailure }: Props) {
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

  return (
    <PaywallBoundary onFailure={onFailure}>
      <View style={styles.screen}>
        <View style={styles.masthead}>
          <View>
            <Text style={styles.eyebrow}>peri Pro</Text>
            <Text style={styles.lead}>The dossier, the brief, the treatment check-ins.</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Not now" accessibilityHint="Closes this sheet. The page, the ledger and the finding of the day stay free." accessibilityState={{ disabled: storeBusy }} disabled={storeBusy} hitSlop={8} onPress={dismiss} style={({ pressed }) => [styles.dismiss, pressed && styles.pressed, storeBusy && styles.disabled]}>
            <Text style={styles.dismissText}>Not now</Text>
          </Pressable>
        </View>
        <RevenueCatUI.Paywall
          style={{ flex: 1 }}
          options={{ offering, displayCloseButton: false }}
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.paper },
  masthead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, paddingHorizontal: 22, paddingTop: 10, paddingBottom: 12, borderBottomWidth: 1.5, borderBottomColor: color.ink, backgroundColor: color.paper },
  eyebrow: { ...type.eyebrow, color: color.vermilionText },
  lead: { fontFamily: font.serif, fontSize: 17, lineHeight: 22, color: color.ink, marginTop: 4, maxWidth: 260 },
  dismiss: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 4 },
  dismissText: { fontFamily: font.sansMedium, fontSize: 15, color: color.ink, textDecorationLine: 'underline' },
  pressed: { opacity: 0.6 },
  disabled: { opacity: 0.4 },
});
