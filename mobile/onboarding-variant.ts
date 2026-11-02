import type { PurchasesOffering } from 'react-native-purchases';

/** RevenueCat offering metadata key for onboarding A/B (Experiments). */
export const ONBOARDING_VARIANT_METADATA_KEY = 'onboarding_variant';

/** Assign variant treatment when offering metadata equals this value (case-insensitive). */
export const ONBOARDING_VARIANT_V2_VALUE = 'v2';

export type OnboardingVariant = 'control' | 'v2';

export function onboardingVariantFromOffering(
  offering: PurchasesOffering | null | undefined,
): OnboardingVariant {
  const raw = offering?.metadata?.[ONBOARDING_VARIANT_METADATA_KEY];
  if (typeof raw === 'string' && raw.trim().toLowerCase() === ONBOARDING_VARIANT_V2_VALUE) {
    return 'v2';
  }
  return 'control';
}

export function flowVersionForVariant(variant: OnboardingVariant): number {
  return variant === 'v2' ? 3 : 2;
}
