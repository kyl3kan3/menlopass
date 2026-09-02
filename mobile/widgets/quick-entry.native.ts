import { Linking } from 'react-native';

import { subscribeToMenoCompassAppShortcuts } from '../modules/menocompass-shortcuts';
import { quickRouteFromUrl, type MenoCompassQuickRoute } from './quick-entry-route';

export { quickRouteFromUrl, type MenoCompassQuickRoute } from './quick-entry-route';

export function injectQuickRoute(
  injectJavaScript: (script: string) => void,
  route: MenoCompassQuickRoute,
) {
  injectJavaScript(`
    (function openMenoCompassQuickRoute() {
      var route = ${JSON.stringify(route)};
      if (window.location.hash !== '#' + route) window.location.hash = route;
    })();
    true;
  `);
}


/** Listens for cold-start and foreground custom-scheme links and App Shortcuts. */
export function subscribeToMenoCompassQuickEntries(
  onRoute: (route: MenoCompassQuickRoute) => void,
) {
  let active = true;
  void Linking.getInitialURL().then(url => {
    const route = quickRouteFromUrl(url);
    if (active && route) onRoute(route);
  });

  const subscription = Linking.addEventListener('url', ({ url }) => {
    const route = quickRouteFromUrl(url);
    if (route) onRoute(route);
  });
  const removeAppShortcuts = subscribeToMenoCompassAppShortcuts(onRoute);

  return () => {
    active = false;
    subscription.remove();
    removeAppShortcuts();
  };
}
