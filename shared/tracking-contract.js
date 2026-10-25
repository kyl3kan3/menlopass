// Shared by the mobile transport and the API. No answers, health data, free text,
// customer identities or arbitrary error messages are part of this contract.
const events = [
  'Application Installed', 'analytics_enabled', 'session_started', 'app_launched',
  'onboarding_started', 'onboarding_step_viewed', 'onboarding_step_left', 'onboarding_completed',
  'onboarding_selection_limit', 'checkin_confirmed', 'report_opened', 'subscription_management_opened',
  'screen_viewed', 'webview_ready', 'diagnostic_probe', 'subscription_status_checked',
  'subscription_check_failed', 'paywall_requested', 'paywall_rendered', 'paywall_failed', 'paywall_dismissed',
  'purchase_started', 'purchase_cancelled', 'purchase_failed', 'purchase_completed', 'purchase_access_confirmed',
  'subscription_restore_started', 'subscription_restore_completed', 'subscription_restore_failed',
];
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[47][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const enums = {
  access: ['unknown', 'active', 'inactive'], storeEnvironment: ['unknown', 'sandbox', 'production'],
  periodType: ['unknown', 'NORMAL', 'INTRO', 'TRIAL', 'PREPAID'],
  ownershipType: ['unknown', 'PURCHASED', 'FAMILY_SHARED', 'UNKNOWN'],
  source: ['automatic', 'subscribe_button', 'feature', 'gate', 'paywall'],
  reason: ['no_offering', 'free_offer', 'offerings_error', 'render_error', 'sdk_error'],
  packageType: ['MONTHLY', 'ANNUAL', 'UNKNOWN', 'CUSTOM'],
  route: ['today', 'journey', 'care', 'guide', 'profile', 'checkin', 'appointment-report', 'today-details'],
};
const common = ['access', 'storeEnvironment', 'periodType', 'ownershipType'];
function project(event, input = {}, productIds = []) {
  if (!events.includes(event)) return null;
  const out = { schemaVersion: 3 };
  let keys = [...common];
  if (/^(purchase_|paywall_|subscription_)/.test(event)) keys.push('source', 'reason', 'packageType', 'productId', 'errorCode');
  if (event.startsWith('purchase_')) keys.push('attemptId', 'durationMs', 'price', 'currency');
  if (event.startsWith('onboarding_')) keys.push('step', 'flowVersion', 'surface');
  if (event === 'onboarding_step_left') keys.push('durationMs');
  if (event === 'onboarding_completed') keys.push('skipped');
  if (event === 'screen_viewed') keys.push('route');
  for (const key of keys) {
    const value = input[key];
    if (enums[key]?.includes(value)) out[key] = value;
    if (key === 'productId' && productIds.includes(value)) out[key] = value;
    if (key === 'attemptId' && typeof value === 'string' && uuid.test(value)) out[key] = value;
    if (key === 'errorCode' && /^\d{1,3}$/.test(String(value))) out[key] = String(value);
    if (key === 'durationMs' && Number.isInteger(value) && value >= 0 && value <= 3600000) out[key] = value;
    if (key === 'step' && Number.isInteger(value) && value >= 0 && value <= 3) out[key] = value;
    if (key === 'flowVersion' && value === 2) out[key] = value;
    if (key === 'surface' && ['native_preview', 'web'].includes(value)) out[key] = value;
    if (key === 'skipped' && typeof value === 'boolean') out[key] = value;
    if (key === 'price' && typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100000) out[key] = value;
    if (key === 'currency' && typeof value === 'string' && /^[A-Z]{3}$/.test(value)) out[key] = value;
  }
  return out;
}
const contextKeys = ['sessionId', 'appVersion', 'buildNumber', 'platform', 'osVersion', 'runtimeVersion', 'updateId', 'buildChannel', 'embedded'];
function validContext(c) {
  return c && Object.keys(c).length === contextKeys.length && contextKeys.every(k => Object.hasOwn(c, k))
    && typeof c.sessionId === 'string' && uuid.test(c.sessionId) && ['ios', 'android'].includes(c.platform) && typeof c.embedded === 'boolean'
    && contextKeys.filter(k => !['sessionId', 'embedded', 'platform'].includes(k)).every(k => typeof c[k] === 'string' && /^[\w.:-]{1,100}$/.test(c[k]));
}
function validateEnvelope(body, productIds, now = Date.now()) {
  if (!body || Object.keys(body).sort().join(',') !== 'context,id,name,properties,timestamp' || typeof body.id !== 'string' || !uuid.test(body.id)) return false;
  if (typeof body.timestamp !== 'string' || !Number.isFinite(Date.parse(body.timestamp)) || Math.abs(now - Date.parse(body.timestamp)) > 7 * 86400000) return false;
  if (!body.properties || typeof body.properties !== 'object' || Array.isArray(body.properties)) return false;
  const safe = project(body.name, body.properties, productIds);
  return safe && validContext(body.context) && Object.keys(body.properties).length === Object.keys(safe).length
    && Object.keys(body.properties).every(k => body.properties[k] === safe[k]);
}
function providerProperties(body) {
  const properties = { ...body.properties, ...body.context, $geoip_disable: true, $process_person_profile: false };
  for (const key of ['surface', 'flowVersion', 'durationMs', 'skipped', 'ownershipType']) delete properties[key];
  const id = body.context.sessionId;
  const time = parseInt(id.replace(/-/g, '').slice(0, 12), 16);
  if (id[14] === '7' && time <= Date.now() && Date.now() - time < 86400000) properties.$session_id = id;
  return properties;
}
const providerEligible = body => !['checkin_confirmed', 'report_opened', 'diagnostic_probe', 'webview_ready'].includes(body.name)
  && !(body.name === 'screen_viewed' && ['checkin', 'appointment-report', 'today-details'].includes(body.properties.route));
module.exports = { events, uuid, project, validateEnvelope, providerProperties, providerEligible };
