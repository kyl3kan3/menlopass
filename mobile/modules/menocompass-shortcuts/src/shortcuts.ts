import MenoCompassShortcutsModule from './MenoCompassShortcutsModule';
import type {
  MenoCompassAppShortcutRoute,
  MenoCompassShortcutEvent,
} from './MenoCompassShortcuts.types';

export function appShortcutRouteFromUrl(
  url: string | null | undefined,
): MenoCompassAppShortcutRoute | null {
  if (url === 'menlopass://checkin') return 'checkin';
  if (url === 'menlopass://insights') return 'journey';
  return null;
}

/**
 * Receives both cold-start and in-process App Shortcut invocations. The native
 * intent only chooses an allow-listed screen; it never reads or mutates health
 * records and never confirms a check-in on the user's behalf.
 */
export function subscribeToMenoCompassAppShortcuts(
  onRoute: (route: MenoCompassAppShortcutRoute) => void,
) {
  const deliver = (url: string | null | undefined) => {
    const route = appShortcutRouteFromUrl(url);
    if (route) onRoute(route);
  };

  const subscription = MenoCompassShortcutsModule.addListener(
    'onShortcutInvoked',
    (event: MenoCompassShortcutEvent) => {
      const pendingUrl = MenoCompassShortcutsModule.consumePendingUrl();
      deliver(pendingUrl ?? event.url);
    },
  );

  deliver(MenoCompassShortcutsModule.consumePendingUrl());
  return () => subscription.remove();
}
