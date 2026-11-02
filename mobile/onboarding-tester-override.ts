import * as SecureStore from 'expo-secure-store';

import type { OnboardingVariant } from './onboarding-variant';

export {
  allowsOnboardingTesterOverride,
  resetPersistedOnboardingForTester,
  resolveOnboardingVariant,
  type OnboardingTesterGateInput,
  type StoreEnvironment,
} from './onboarding-tester-gate';

export const ONBOARDING_TESTER_OVERRIDE_KEY = 'menocompass.onboarding_tester_override';

export async function readOnboardingTesterOverride(): Promise<OnboardingVariant | null> {
  const value = await SecureStore.getItemAsync(ONBOARDING_TESTER_OVERRIDE_KEY);
  return value === 'v2' ? 'v2' : null;
}

export async function writeOnboardingTesterOverride(
  variant: OnboardingVariant | null,
): Promise<void> {
  if (variant === 'v2') {
    await SecureStore.setItemAsync(ONBOARDING_TESTER_OVERRIDE_KEY, 'v2');
    return;
  }
  await SecureStore.deleteItemAsync(ONBOARDING_TESTER_OVERRIDE_KEY);
}
