# MenoCompass HealthKit module

This local Expo module provides a deliberately read-only HealthKit boundary for
the iOS app. It requests access only after a visible user action and returns:

- aggregate steps for a 1–30 day window;
- merged sleep duration plus the number of tracked nights for that window; and
- the most recent body-weight value and date.

It never requests write types, writes HealthKit data, returns raw samples, reads
source/device metadata, schedules background delivery, or sends health data to
telemetry.

## App integration

Add the config plugin to `plugins` in `app.config.js`:

```js
plugins.push([
  './modules/menocompass-healthkit/app.plugin.js',
  {
    healthSharePermission:
      'MenoCompass reads your steps, sleep, and body weight only when you choose to sync, so you can view those summaries alongside your menopause records. MenoCompass never writes to Apple Health.',
  },
]);
```

Then call the module only from an explicit Connect or Sync action:

```ts
import { connectAndSyncHealthKit } from './modules/menocompass-healthkit';

const result = await connectAndSyncHealthKit({
  userInitiated: true,
  lookbackDays: 7,
});
```

Apple intentionally prevents apps from determining whether a user denied an
individual read type. A completed authorization request is therefore not proof
that every type was granted; `null` summary values must be presented as
“unavailable,” never as zero.

## Required release validation

The config plugin adds `NSHealthShareUsageDescription` and the HealthKit
entitlement. A fresh native build is required. On a physical iPhone, verify the
permission sheet, partial/denied permission behavior, values with and without
Health data, and the unavailable path. Simulator/type checks do not replace
that device validation.
