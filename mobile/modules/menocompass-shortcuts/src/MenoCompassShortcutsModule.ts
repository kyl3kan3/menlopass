import { NativeModule, requireNativeModule } from 'expo';

import type { MenoCompassShortcutsModuleEvents } from './MenoCompassShortcuts.types';

declare class MenoCompassShortcutsModule extends NativeModule<MenoCompassShortcutsModuleEvents> {
  consumePendingUrl(): string | null;
}

export default requireNativeModule<MenoCompassShortcutsModule>('MenoCompassShortcuts');
