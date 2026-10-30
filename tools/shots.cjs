/* Capture the built app at phone size with seeded data, for design review.
   Usage: node tools/shots.cjs [outDir]  (run `python3 build.py` first) */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const http = require('http');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const OUT = path.resolve(process.argv[2] || path.join(ROOT, 'test-results', 'shots'));
fs.mkdirSync(OUT, { recursive: true });

function isoOffset(offset) {
  const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + offset);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function confirmed(payload) {
  const copy = JSON.parse(JSON.stringify(payload));
  return Object.assign({}, payload, { confirmed: true, draftDirty: false, confirmedData: copy });
}
function profile(overrides = {}) {
  return Object.assign({ name: 'Morgan', birthYear: 1979, region: 'us', units: 'imperial', lastPeriod: '', surgeryDate: '', uterus: 'intact', ovaries: 'kept', bone: 'unknown', proteinGpk: 1.2, weightGoal: null, waistGoal: null, theme: 'light', stage: null, stageAnswers: null, onboarded: true, onboardingStep: 3, onboardingDeferred: false, intent: 'understand', pinnedSymptoms: ['sleepq', 'energy', 'hf', 'fog'] }, overrides);
}
function seeded(dayCount, { todayConfirmed = false } = {}) {
  const entries = {};
  for (let i = dayCount - 1; i >= (todayConfirmed ? 0 : 1); i--) {
    if (i === 2) continue; // one missed day so the week strip shows a gap
    const payload = { hf: 2 + (i % 3), ns: i % 3, sym: { sleepq: 2 + (i % 2), fog: i % 2, energy: 1 + (i % 3), anx: i % 2 }, act: { res: i % 4 === 0, aero: i % 2 ? 20 : 0 }, nut: { alc: 0 }, sleepH: 6.5 + (i % 2) * .5, inBedH: 8, notes: i === 0 ? 'Awake again at 3. Tired by lunchtime.' : '' };
    entries[isoOffset(-i)] = confirmed(payload);
  }
  const meds = [
    { id: 'estradiol', name: 'Estradiol 0.05 mg', form: 'patch', days: [1, 4], due: '08:00', notes: '', started: isoOffset(-70), ended: '', changes: [{ date: isoOffset(-3), label: 'Changed from 0.0375 mg to 0.05 mg' }] },
    { id: 'progesterone', name: 'Progesterone 100 mg', form: 'tablet', days: [0, 1, 2, 3, 4, 5, 6], due: '22:00', notes: '', started: isoOffset(-70), ended: '', changes: [] }
  ];
  const appointments = { questions: [], plans: [], brief: { concerns: [{ key: 'sleepq', impact: 'Waking in the night, most nights' }, { key: 'fog', impact: 'Losing my place at work' }], goal: 'Talk through my options', date: isoOffset(6) } };
  return { v: 8, profile: profile(), entries, medications: meds, labs: [{ id: 'lab-1', name: 'Vitamin D', date: isoOffset(-40), value: 48, unit: 'nmol/L' }], appointments, support: [], trigger: null };
}

(async () => {
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0]);
    let file = path.join(DIST, url === '/' ? 'index.html' : url);
    if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.webm': 'video/webm', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    res.end(fs.readFileSync(file));
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch();
  const shots = [];
  async function capture(name, state, run) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    if (state) await context.addInitScript(v => localStorage.setItem('menocompass.v1', JSON.stringify(v)), state);
    else await context.addInitScript(() => localStorage.clear());
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(base + '/index.html');
    await page.waitForTimeout(250);
    if (run) await run(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(350);
    const file = path.join(OUT, name + '.png');
    await page.screenshot({ path: file, fullPage: false });
    const full = path.join(OUT, name + '.full.png');
    await page.screenshot({ path: full, fullPage: true });
    shots.push(name);
    if (errors.length) console.log('  errors on', name, errors);
    console.log('captured', name);
    await context.close();
  }
  const full = seeded(16);
  await capture('01-welcome', null);
  await capture('02-today-before', full);
  await capture('03-today-after', seeded(16, { todayConfirmed: true }));
  await capture('04-checkin', full, async page => { await page.locator('.dc-checkin').click(); await page.waitForTimeout(200); await page.getByRole('button', { name: 'Trouble sleeping: Severe', exact: true }).click(); await page.getByRole('button', { name: 'Fatigue: Moderate', exact: true }).click(); });
  await capture('05-journey', full, async page => { await page.locator('nav.tabs [data-v="journey"]').click(); });
  await capture('06-care', full, async page => { await page.locator('nav.tabs [data-v="care"]').click(); });
  await capture('07-guide', full, async page => { await page.locator('nav.tabs [data-v="guide"]').click(); });
  await capture('08-support', full, async page => { await page.getByRole('button', { name: 'I’m struggling right now', exact: true }).click(); });
  await capture('09-checkin-complete', full, async page => { await page.locator('.dc-checkin').click(); await page.waitForTimeout(200); await page.getByRole('button', { name: 'Trouble sleeping: Severe', exact: true }).click(); await page.getByRole('button', { name: 'Confirm today’s log' }).click(); await page.waitForTimeout(600); });
  await capture('10-profile', full, async page => { await page.getByRole('button', { name: 'Open Profile' }).click(); });
  await capture('11-report', full, async page => { await page.locator('nav.tabs [data-v="care"]').click(); await page.getByRole('button', { name: 'Prepare appointment report' }).click(); });
  await capture('12-support-path', full, async page => { await page.getByRole('button', { name: 'I’m struggling right now', exact: true }).click(); await page.locator('.mc-support-grid').getByRole('button', { name: 'Can’t sleep', exact: true }).click(); });
  await capture('13-onboarding-step2', null, async page => { await page.getByRole('button', { name: 'Find my starting point' }).click(); });
  await browser.close();
  server.close();
  fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(shots));
})();
