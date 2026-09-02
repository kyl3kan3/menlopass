# MenoCompass widgets

The iOS widgets intentionally receive only two values: whether today's entry is
confirmed and how many of the last seven calendar days are confirmed. They do
not receive symptom names, severity, notes, treatments, medications, labs, or
profile information.

## Native integration

Install the SDK-matched package:

```sh
npx expo install expo-widgets @expo/ui
```

Import the checked-in config descriptor and push it from the existing dynamic
`app.config.js` (deduplicate `expo-widgets` first):

```js
const { menocompassWidgetsPlugin } = require('./widgets/app-config');

plugins = withoutPlugin(plugins, 'expo-widgets');
plugins.push('./widgets/withWidgetPrivacyManifest.js');
plugins.push(menocompassWidgetsPlugin);
```

The local plugin puts a valid `PrivacyInfo.xcprivacy` with Apple's `1C8F.1`
App Group `UserDefaults` reason in the separate widget-extension bundle. The
main app declares the same required reason through `ios.privacyManifests` for
its App Shortcut route handoff.

In `App.native.tsx`, import `syncMenoCompassWidgets`,
`subscribeToMenoCompassQuickEntries`, and `injectQuickRoute`.

- Sync after reading initial persisted state and after each successful
  `persist-state` write.
- Subscribe once at app mount. Keep a pending route until the WebView is ready,
  then call `injectQuickRoute(script => webViewRef.current?.injectJavaScript(script), route)`.
- Re-apply a pending route in `onLoadEnd` after the embedded document has booted.

The existing `menlopass` URL scheme already covers both entry points:
`menlopass://checkin` and `menlopass://insights`.

Widgets require a fresh native build and must be verified on a physical iPhone;
Expo Go cannot load the widget extension. The SDK 57 plugin currently defaults
the widget extension deployment target to iOS 16.4.
