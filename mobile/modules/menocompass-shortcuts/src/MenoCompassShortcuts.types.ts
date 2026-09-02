export type MenoCompassShortcutsModuleEvents = {
  onShortcutInvoked: (event: MenoCompassShortcutEvent) => void;
};

export type MenoCompassShortcutEvent = {
  url: string;
};

export type MenoCompassAppShortcutRoute = 'checkin' | 'journey';
