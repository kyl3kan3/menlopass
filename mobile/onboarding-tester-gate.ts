import type { PurchasesOffering } from 'react-native-purchases';

import {
  onboardingVariantFromOffering,
  type OnboardingVariant,
} from './onboarding-variant';
import { parseState, versionV2Flow } from './onboarding-model';

export type StoreEnvironment = 'unknown' | 'sandbox' | 'production';

export type OnboardingTesterGateInput = {
  isDev: boolean;
  buildChannel: string | null | undefined;
  storeEnvironment: StoreEnvironment;
  usesSandboxAppStoreReceipt: boolean;
};

/** TestFlight, sandbox StoreKit, dev clients, and non-production EAS channels only. */
export function allowsOnboardingTesterOverride(input: OnboardingTesterGateInput): boolean {
  if (input.isDev) return true;
  if (input.storeEnvironment === 'sandbox') return true;
  if (input.usesSandboxAppStoreReceipt) return true;
  const channel = String(input.buildChannel || '').toLowerCase();
  if (channel === 'development' || channel === 'preview') return true;
  return false;
}

export function resolveOnboardingVariant(
  offering: PurchasesOffering | null | undefined,
  testerOverride: OnboardingVariant | null,
  honorTesterOverride: boolean,
): OnboardingVariant {
  if (honorTesterOverride && testerOverride === 'v2') return 'v2';
  return onboardingVariantFromOffering(offering);
}

export function resetPersistedOnboardingForTester(
  serialized: string | null,
  variant: OnboardingVariant,
): string {
  const state = parseState(serialized);
  const flowVersion = variant === 'v2' ? versionV2Flow : 2;
  const {
    onboarded: _onboarded,
    onboardingDeferred: _deferred,
    firstCheckinPending: _pending,
    onboardingVersion: _version,
    onboardingStep: _step,
    pinnedSymptoms: _symptoms,
    intent: _intent,
    ...rest
  } = state.profile;
  state.profile = {
    ...rest,
    onboarded: false,
    onboardingVersion: flowVersion,
    onboardingStep: 0,
    pinnedSymptoms: [],
    intent: '',
  };
  return JSON.stringify(state);
}
