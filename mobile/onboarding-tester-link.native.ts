import { Linking } from 'react-native';

import {
  onboardingTesterRouteFromUrl,
  type OnboardingTesterRoute,
} from './onboarding-tester-route';

export { onboardingTesterRouteFromUrl, type OnboardingTesterRoute } from './onboarding-tester-route';

/** Listens for cold-start and foreground onboarding tester deep links. */
export function subscribeToOnboardingTesterLinks(
  onRoute: (route: OnboardingTesterRoute) => void,
) {
  let active = true;
  void Linking.getInitialURL().then(url => {
    const route = onboardingTesterRouteFromUrl(url);
    if (active && route) onRoute(route);
  });

  const subscription = Linking.addEventListener('url', ({ url }) => {
    const route = onboardingTesterRouteFromUrl(url);
    if (route) onRoute(route);
  });

  return () => {
    active = false;
    subscription.remove();
  };
}
