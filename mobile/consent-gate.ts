export type ConsentGatePhase = 'loading' | 'choice' | 'app';

/** Native shell UI while analytics consent is loading or undecided. */
export function consentGatePhase(
  consentHydrating: boolean,
  privacyChoiceOpen: boolean,
  consentReady: boolean,
): ConsentGatePhase {
  if (consentHydrating) return 'loading';
  if (privacyChoiceOpen || !consentReady) return 'choice';
  return 'app';
}
