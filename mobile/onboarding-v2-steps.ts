/** Last step index for the v2 native onboarding flow (inclusive). */
export const ONBOARDING_V2_FINAL_STEP = 11;

/** Progress label denominator (steps 0…11). */
export const ONBOARDING_V2_STEP_COUNT = 12;

export const onboardingV2StepTitles = [
  'How today feels',
  'See your week unfold',
  'See your week unfold',
  'Capture what matters',
  'Track care alongside symptoms',
  'Prepare for your visit',
  'Explore trusted guidance',
  'What has been hardest lately?',
  'What would help you most?',
  'Your starting focus',
  'Building your plan',
  'Gentle reminders',
] as const;
