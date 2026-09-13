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

test('one concern persists through reload, keyboard goal choice, preview, and the first confirmed check-in', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.getByRole('button', { name: 'Find my starting point', exact: true }).click();
  assert.equal(await page.getByRole('button', { name: 'These matter to me' }).isDisabled(), true);
  await page.getByRole('button', { name: 'Trouble sleeping', exact: true }).click();
  await page.reload();
  assert.deepEqual(await page.evaluate(() => DB.profile.pinnedSymptoms), ['sleepq']);
  assert.equal(await page.getByRole('button', { name: 'Trouble sleeping', exact: true }).getAttribute('aria-pressed'), 'true');
  await page.getByRole('button', { name: 'These matter to me' }).click();
  await page.getByRole('radio', { name: 'Understand my symptoms' }).focus();
  await page.keyboard.press('ArrowDown');
  assert.equal(await page.getByRole('radio', { name: 'Keep track of treatment' }).getAttribute('aria-checked'), 'true');
  await page.getByRole('button', { name: 'See my check-in', exact: true }).click();
  assert.equal(await page.locator('.ob-preview li').count(), 1);
  assert.deepEqual(await page.evaluate(() => entryDates()), []);
  assert.equal(await page.locator('input, select').count(), 0);
  await page.getByRole('button', { name: 'Start my first check-in', exact: true }).click();
  assert.equal(await page.locator('.jc-check-row').count(), 1);
  await page.getByRole('button', { name: 'Trouble sleeping: Moderate', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm today’s log', exact: true }).click();
  assert.equal(await page.getByRole('heading', { name: 'Your first check-in is saved.', exact: true }).isVisible(), true);
  assert.equal(await page.evaluate(() => confirmedEntry(todayISO()).sym.sleepq), 2);
  assert.equal(await page.evaluate(() => DB.profile.firstCheckinPending), false);
  await page.reload();
  assert.deepEqual(await page.evaluate(() => DB.profile.pinnedSymptoms), ['sleepq']);
  assert.equal(await page.evaluate(() => entryDates().length), 1);
  assert.deepEqual(errors, []);
  await context.close();
});

test('a starter preview creates preferences, not health ratings, and allows exploring first', async () => {
  const context = await browser.newContext({ viewport: { width: 320, height: 844 } });
  const page = await context.newPage(); await page.goto(url);
  await page.getByRole('button', { name: 'Use a starter check-in', exact: true }).click();
  assert.equal(await page.locator('.ob-preview li').count(), 3);
  await page.getByRole('button', { name: 'Explore first', exact: true }).click();
  assert.equal(await page.getByRole('heading', { name: 'Your check-in is ready.' }).isVisible(), true);
  assert.equal(await page.evaluate(() => DB.profile.onboardingDeferred), true);
  assert.deepEqual(await page.evaluate(() => entryDates()), []);
  await context.close();
});

test('the first saved summary accurately describes added symptoms and notes-only entries', async () => {
  for (const notesOnly of [false, true]) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage(); await page.goto(url);
    await page.getByRole('button', { name: 'Use a starter check-in', exact: true }).click();
    await page.getByRole('button', { name: 'Start my first check-in', exact: true }).click();
    if (notesOnly) {
      await page.getByRole('button', { name: 'Add context', exact: true }).click();
      await page.getByRole('textbox', { name: 'Anything worth remembering?' }).fill('A little space to reflect.');
    } else {
      await page.locator('.jc-add-symptom summary').click();
      await page.getByRole('button', { name: 'Brain fog', exact: true }).click();
      await page.getByRole('button', { name: 'Brain fog: Severe', exact: true }).click();
    }
    await page.getByRole('button', { name: 'Confirm today’s log', exact: true }).click();
    assert.equal(await page.getByRole('heading', { name: 'Your first check-in is saved.', exact: true }).isVisible(), true);
    assert.match(await page.locator('.ob-preview').innerText(), notesOnly ? /No symptoms were rated on this day/ : /Brain fog.*severe/);
    await context.close();
  }
});

test('analytics capture initial, backward and resumed screen entry without transmitting answers', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.addInitScript(() => {
    window.__MENO_NATIVE__ = true; window.__MENO_PRO_ACTIVE__ = true;
    window.__messages = []; window.ReactNativeWebView = { postMessage: payload => window.__messages.push(JSON.parse(payload)) };
  });
  const page = await context.newPage(); await page.goto(url);
  await page.getByRole('button', { name: 'Find my starting point' }).click();
  for (const label of ['Trouble sleeping', 'Fatigue', 'Hot flashes', 'Brain fog', 'Night sweats', 'Low mood']) await page.getByRole('button', { name: label, exact: true }).click();
  await page.getByRole('button', { name: 'See all concerns' }).click();
  await page.getByRole('button', { name: 'Anxiety', exact: true }).click();
  assert.equal(await page.getByRole('button', { name: 'Anxiety', exact: true }).getAttribute('aria-pressed'), 'false');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.getByRole('button', { name: 'These matter to me' }).click();
  assert.equal(await page.evaluate(() => window.scrollY), 0);
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  const messages = await page.evaluate(() => window.__messages.filter(message => message.type.startsWith('onboarding-')));
  assert.deepEqual(messages.filter(message => message.type === 'onboarding-step').map(message => message.step), [0, 1, 2, 1]);
  assert.equal(messages.some(message => message.type === 'onboarding-selection-limit'), true);
  assert.ok(messages.some(message => message.type === 'onboarding-step-left' && Number.isInteger(message.durationMs)));
  assert.ok(messages.every(message => !('symptoms' in message) && !('intent' in message) && !('profile' in message)));
  const saved = await page.evaluate(() => window.__messages.filter(message => message.type === 'persist-state').at(-1).state);
  const resumed = await browser.newContext();
  await resumed.addInitScript(state => {
    window.__MENO_NATIVE__ = true; window.__MENO_PRO_ACTIVE__ = true; window.__MENO_PERSISTED_STATE__ = state;
    window.__messages = []; window.ReactNativeWebView = { postMessage: payload => window.__messages.push(JSON.parse(payload)) };
  }, saved);
  const resumedPage = await resumed.newPage(); await resumedPage.goto(url);
  assert.deepEqual(await resumedPage.evaluate(() => window.__messages.filter(message => message.type === 'onboarding-step').map(message => message.step)), [1]);
  await resumed.close(); await context.close();
});
