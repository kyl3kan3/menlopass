# MenoCompass App Shortcuts

This local Expo module and config plugin define two real iOS `AppIntent`
actions and publish them through `AppShortcutsProvider`:

- **Log with MenoCompass** opens `menlopass://checkin`.
- **Review MenoCompass patterns** opens `menlopass://insights`.

The intent stores only one of those two allow-listed URLs in the app group's
preferences and asks iOS to foreground MenoCompass. It cannot read, create,
confirm, or disclose any health record. The JavaScript bridge consumes the URL
through the existing quick-entry subscription and routes the WebView after the
app lock and subscription gates.

`widgets/quick-entry.native.ts` integrates the native bridge:

```ts
import { subscribeToMenoCompassAppShortcuts } from './modules/menocompass-shortcuts';

const removeAppShortcuts = subscribeToMenoCompassAppShortcuts(onRoute);
```

`App.native.tsx` already calls `subscribeToMenoCompassQuickEntries`, so it does
not need a second subscription. The Expo module is found by local-module
autolinking. Its config plugin copies `app-target/MenoCompassAppShortcuts.swift`
into the generated main iOS app target, where Xcode's App Intents metadata
extractor can index it; leaving the provider only in the module's static pod is
not sufficient. `app.config.js` must include:

```js
plugins.push('./modules/menocompass-shortcuts/app.plugin.js');
```

A fresh iOS binary is required. Discovery and invocation still need
physical-device testing in Shortcuts and Siri; source, generated-project, and
bundling checks cannot substitute for that validation.
