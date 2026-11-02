export type OnboardingTesterRoute = 'force-v2' | 'clear-override';

const onboardingTesterRoutes: Record<string, OnboardingTesterRoute> = {
  'onboarding-v2': 'force-v2',
  'onboarding-control': 'clear-override',
};

const allowedSchemes = new Set(['menlopass:', 'rc-0fcafb99f0:']);

/** Parses custom-scheme links that force or clear the TestFlight onboarding override. */
export function onboardingTesterRouteFromUrl(
  url: string | null | undefined,
): OnboardingTesterRoute | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (!allowedSchemes.has(parsed.protocol.toLowerCase())) return null;
    if (parsed.username || parsed.password || parsed.port) return null;
    const candidate = `${parsed.hostname}${parsed.pathname}`
      .replace(/^\/+|\/+$/g, '')
      .toLowerCase();
    return onboardingTesterRoutes[candidate] ?? null;
  } catch {
    return null;
  }
}
