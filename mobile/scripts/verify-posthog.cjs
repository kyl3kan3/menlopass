// A labelled, non-revenue transport probe. This does not simulate a device install
// or establish that a TestFlight binary is dispatching events.
const { randomUUID } = require('node:crypto');
const { expo } = require('../app.json');
const key = process.env.EXPO_PUBLIC_POSTHOG_API_KEY?.trim();
const host = process.env.EXPO_PUBLIC_POSTHOG_HOST?.trim();
if (!key || !['https://us.i.posthog.com', 'https://eu.i.posthog.com'].includes(host)) {
  throw new Error('Set the PostHog project token and Cloud ingestion host first.');
}
const uuid = randomUUID();
fetch(`${host}/batch/`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  signal: AbortSignal.timeout(15000),
  body: JSON.stringify({ api_key: key, batch: [{
    uuid, event: 'menocompass.diagnostic_probe', timestamp: new Date().toISOString(),
    properties: {
      distinct_id: 'menocompass-release-validation', app: 'menocompass', validation: true,
      schemaVersion: 2, buildChannel: 'preview', runtimeVersion: expo.runtimeVersion,
      access: 'unknown', storeEnvironment: 'unknown',
      $geoip_disable: true, $process_person_profile: false,
    },
  }] }),
}).then(async response => {
  if (!response.ok) throw new Error(`PostHog rejected the diagnostic probe: HTTP ${response.status}`);
  const result = await response.json();
  if (result.status !== 1 && result.status !== 'Ok') throw new Error('PostHog did not acknowledge the diagnostic probe.');
  console.log(JSON.stringify({ accepted: true, uuid, event: 'menocompass.diagnostic_probe', runtimeVersion: expo.runtimeVersion }));
}).catch(error => { console.error(error.message); process.exitCode = 1; });
