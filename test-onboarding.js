const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
let browser, server, url;
before(async () => {
  const root = path.join(__dirname, 'dist');
  server = http.createServer((request, response) => {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    const file = path.resolve(root, pathname === '/' ? 'index.html' : pathname.slice(1));
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { response.writeHead(404); response.end(); return; }
    response.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'application/javascript', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2', '.png': 'image/png' })[path.extname(file)] || 'text/plain');
    response.end(fs.readFileSync(file));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  url = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}) });
});
after(async () => { await browser?.close(); await new Promise(resolve => server ? server.close(resolve) : resolve()); });

async function fixture(t, { native = false } = {}) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  t.after(() => context.close());
  await context.addInitScript(() => { const RealDate = Date; const fixed = new RealDate(); fixed.setHours(14, 14, 0, 0); const offset = fixed.getTime() - RealDate.now(); class PinnedDate extends RealDate { constructor(...a) { if (a.length) super(...a); else super(RealDate.now() + offset); } static now() { return RealDate.now() + offset; } } window.Date = PinnedDate; });
  if (native) await context.addInitScript(() => { window.__MENO_NATIVE__ = true; window.__MENO_PRO_ACTIVE__ = true; window.__nativeMessages = []; window.ReactNativeWebView = { postMessage: payload => window.__nativeMessages.push(JSON.parse(payload)) }; });
  const page = await context.newPage();
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  t.after(() => assert.deepEqual(errors, []));
  await page.goto(url);
  return page;
}
const isoOffset = offset => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + offset); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

test('one blank persists through reload, the finding follows the answers, and finishing invents no page', async t => {
  const page = await fixture(t);
  assert.equal(await page.getByRole('button', { name: 'Open today’s page' }).isDisabled(), true);
  await page.locator('[data-act="fr-symptom"][data-v="sleepq"]').click();
  await page.reload();
  assert.deepEqual(await page.evaluate(() => DB.profile.pinnedSymptoms), ['sleepq']);
  assert.equal(await page.locator('[data-act="fr-symptom"][data-v="sleepq"]').getAttribute('aria-pressed'), 'true');
  assert.equal(await page.getByRole('heading', { name: 'Fill in the rest and the finding appears.' }).isVisible(), true);
  await page.locator('[data-act="fr-periods"][data-v="changing"]').click();
  await page.getByLabel('Your age').fill('44');
  assert.equal(await page.getByRole('heading', { name: 'Most likely: early perimenopause.' }).isVisible(), true);
  await page.locator('[data-act="fr-periods"][data-v="na"]').click();
  assert.equal(await page.getByRole('heading', { name: 'Your pattern will come from the pages.' }).isVisible(), true);
  await page.locator('[data-act="fr-periods"][data-v="stopped"]').click();
  assert.equal(await page.getByRole('heading', { name: 'Postmenopause, the first two years.' }).isVisible(), true);
  await page.locator('[data-act="fr-appt"][data-v="no"]').click();
  await page.getByRole('button', { name: 'Open today’s page' }).click();
  const state = await page.evaluate(() => ({ onboarded: DB.profile.onboarded, stage: DB.profile.stage, answers: DB.profile.stageAnswers, intent: DB.profile.intent, date: DB.appointments.brief.date, entries: entryDates(), page: !!document.querySelector('.page-today') }));
  assert.deepEqual(state, { onboarded: true, stage: 'Early postmenopause — the first two years', answers: { age: '40s_e', uterus: 'intact', ovaries: 'kept', contra: 'no', cycle: 'none12', since: 'lt2', vms: 'no' }, intent: 'understand', date: '', entries: [], page: true });
  await page.reload();
  assert.equal(await page.locator('.page-today').count(), 1, 'a finished letter never comes back');
});

test('the letter limits the watch list to six and keeps hot flash, night sweat and woke on the log sheet regardless', async t => {
  const page = await fixture(t);
  await page.locator('[data-act="fr-more"]').click();
  for (const key of ['fog', 'energy', 'mood', 'anx', 'joint', 'head']) await page.locator('[data-act="fr-symptom"][data-v="' + key + '"]').click();
  await page.locator('[data-act="fr-symptom"][data-v="palp"]').click();
  assert.deepEqual(await page.evaluate(() => DB.profile.pinnedSymptoms), ['fog', 'energy', 'mood', 'anx', 'joint', 'head']);
  await page.locator('[data-act="fr-periods"][data-v="regular"]').click();
  await page.getByLabel('Your age').fill('51');
  await page.locator('[data-act="fr-appt"][data-v="no"]').click();
  await page.getByRole('button', { name: 'Open today’s page' }).click();
  assert.deepEqual(await page.evaluate(() => logKinds()), ['hf', 'ns', 'woke', 'fog', 'energy', 'mood', 'anx', 'joint', 'head']);
  assert.equal(await page.evaluate(() => DB.profile.stage), 'Late reproductive stage (early)');
});

test('an appointment date from the letter drives the countdown, and analytics see only steps', async t => {
  const page = await fixture(t, { native: true });
  await page.locator('[data-act="fr-symptom"][data-v="hf"]').click();
  await page.locator('[data-act="fr-periods"][data-v="gaps"]').click();
  await page.getByLabel('Your age').fill('48');
  await page.locator('[data-act="fr-appt"][data-v="yes"]').click();
  await page.getByLabel('Appointment date').fill(isoOffset(9));
  await page.getByRole('button', { name: 'Open today’s page' }).click();
  assert.equal(await page.getByText(/Dossier · appointment in 9 days/).isVisible(), true);
  const messages = await page.evaluate(() => window.__nativeMessages.filter(m => m.type !== 'persist-state'));
  assert.ok(messages.some(m => m.type === 'onboarding-step' && m.step === 0));
  assert.ok(messages.some(m => m.type === 'onboarding-finished' && m.skipped === false));
  assert.equal(JSON.stringify(messages).includes('gaps'), false, 'answers never travel through analytics events');
  assert.equal(JSON.stringify(messages).includes('"hf"'), false);
});
