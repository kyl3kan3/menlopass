/* Capture the built app at phone size with a seeded 16-day record, for design review.
   Usage: node tools/shots.cjs [outDir]  (run `python3 build.py` first)
   Set PLAYWRIGHT_CHANNEL=chrome to use an installed Chrome instead of the bundled Chromium. */
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
// Sixteen days with timestamped moments: sweats and 3 am wakes on five nights a week,
// afternoon flashes on five days a week, one treatment change ten days in.
function seeded(dayCount = 16) {
  const entries = {};
  for (let i = dayCount - 1; i >= 0; i--) {
    const flashDay = i % 7 !== 3 && i % 7 !== 6, sweatNight = i % 7 < 5;
    const moments = [];
    if (sweatNight) moments.push({ id: 'w' + i + 'a', t: '02:40', k: 'woke' }, { id: 's' + i, t: '02:41', k: 'ns' }, { id: 'w' + i + 'b', t: '03:30', k: 'woke' });
    if (flashDay) moments.push({ id: 'h' + i + 'a', t: '13:10', k: 'hf', s: 2 }, { id: 'h' + i + 'b', t: '14:30', k: 'hf', s: 3 }, { id: 'h' + i + 'c', t: '15:20', k: 'hf', s: 1 });
    else moments.push({ id: 'h' + i + 'm', t: '09:15', k: 'hf', s: 1 });
    if (i === 0) moments.push({ id: 'n0', t: '07:30', k: 'slept', v: 6.5 }, { id: 'm0', t: '08:05', k: 'med', n: 'Estradiol 0.05 mg' });
    const payload = { hf: flashDay ? 3 : 1, ns: sweatNight ? 2 : 0, wakes: sweatNight ? 2 : 0, rating: i % 5, sym: { fog: sweatNight ? 2 : 0, energy: 1 + (i % 3), joint: 1, anx: i % 2, sleepq: sweatNight ? 3 : 1 }, act: { res: i % 4 === 0, aero: i % 2 ? 20 : 0 }, nut: { alc: i % 5 === 0 ? 1 : 0 }, sleepH: sweatNight ? 6 : 7.5, inBedH: 8, notes: '', moments };
    if (i === 0) { delete payload.rating; payload.med = { estradiol: { taken: true, at: '08:05' } }; }
    entries[isoOffset(-i)] = confirmed(payload);
  }
  return {
    v: 9,
    profile: { name: 'Morgan', birthYear: 1979, region: 'us', units: 'imperial', lastPeriod: isoOffset(-70), uterus: 'intact', ovaries: 'kept', bone: 'unknown', proteinGpk: 1.2, theme: 'light', stage: 'Late menopausal transition', stageAnswers: { age: '45p', uterus: 'intact', ovaries: 'kept', contra: 'no', cycle: 'skip', vms: 'lots' }, onboarded: true, onboardingVersion: 4, intent: 'appointment', pinnedSymptoms: ['sleepq', 'hf', 'fog', 'energy'], periodStatus: 'gaps' },
    entries,
    medications: [
      { id: 'estradiol', name: 'Estradiol 0.05 mg', form: 'patch', days: [1, 4], due: '08:00', notes: '', started: isoOffset(-70), ended: '', changes: [{ date: isoOffset(-3), label: '0.0375 → 0.05 mg', targets: ['hf', 'sleepq'], baseline: { windowStart: isoOffset(-10), windowEnd: isoOffset(-4), values: { hf: { average: 3.2, n: 7 }, sleepq: { average: 2.4, n: 7 } } }, followUps: [] }] },
      { id: 'prog', name: 'Progesterone 100 mg', form: 'tablet', days: [0, 1, 2, 3, 4, 5, 6], due: '22:00', notes: '', started: isoOffset(-70), ended: '', changes: [] }
    ],
    labs: [{ id: 'lab-1', name: 'Vitamin D', date: isoOffset(-40), value: '48', unit: 'nmol/L' }],
    screening: {}, scores: [], trigger: null,
    appointments: { questions: [{ id: 'q1', text: 'Is HRT a reasonable option for me, and which type?', created: isoOffset(-5), asked: false, askedAt: '' }], plans: [], brief: { concerns: [{ key: 'ns', impact: 'woken most nights between two and four' }, { key: 'energy', impact: 'exhausted at work by three' }, { key: 'hf', impact: '' }], goal: 'talk about treatment options, including HRT', date: isoOffset(12) }, evidence: [] },
    findings: {}, meta: { created: isoOffset(-16), lastOpen: isoOffset(0) }
  };
}

(async () => {
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0]);
    let file = path.join(DIST, url === '/' ? 'index.html' : url);
    if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.webp': 'image/webp', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    res.end(fs.readFileSync(file));
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {});
  const shots = [];
  // The clock is pinned so the night desk does not take over Today, except where asked for.
  async function capture(name, state, run, { hour = 14, minute = 14 } = {}) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await context.addInitScript(([h, m]) => {
      const RealDate = Date; const fixed = new RealDate(); fixed.setHours(h, m, 0, 0); const offset = fixed.getTime() - RealDate.now();
      class PinnedDate extends RealDate { constructor(...a) { if (a.length) super(...a); else super(RealDate.now() + offset); } static now() { return RealDate.now() + offset; } }
      window.Date = PinnedDate;
    }, [hour, minute]);
    if (state) await context.addInitScript(v => localStorage.setItem('menocompass.v1', JSON.stringify(v)), state);
    else await context.addInitScript(() => localStorage.clear());
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(base + '/index.html');
    await page.waitForTimeout(300);
    if (run) await run(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(350);
    await page.screenshot({ path: path.join(OUT, name + '.png'), fullPage: false });
    await page.screenshot({ path: path.join(OUT, name + '.full.png'), fullPage: true });
    shots.push(name);
    if (errors.length) console.log('  errors on', name, errors);
    console.log('captured', name);
    await context.close();
  }
  const full = seeded(16);
  await capture('01-letter', null);
  await capture('02-today', full);
  await capture('03-log-sheet', full, async page => { await page.locator('[data-act="sheet"][data-s="log"]').first().click(); await page.waitForSelector('.sheet'); });
  await capture('04-dossier', full, async page => { await page.locator('.masthead-nav [data-v="dossier"]').click(); await page.waitForSelector('.page-dossier'); });
  await capture('05-treatments', full, async page => { await page.locator('.masthead-nav [data-v="dossier"]').click(); await page.locator('[data-act="sheet"][data-s="treatments"]').first().click(); await page.waitForSelector('.sheet'); });
  await capture('06-rehearse', full, async page => { await page.locator('.masthead-nav [data-v="dossier"]').click(); await page.locator('[data-act="sheet"][data-s="rehearse"]').first().click(); await page.waitForSelector('.sheet'); });
  await capture('07-brief', full, async page => { await page.locator('.masthead-nav [data-v="dossier"]').click(); await page.locator('[data-act="open-report"]').first().click(); await page.waitForSelector('.page-report'); });
  await capture('08-index', full, async page => { await page.locator('.masthead-nav [data-v="index"]').click(); await page.waitForSelector('.page-index'); });
  await capture('09-chapter', full, async page => { await page.locator('.masthead-nav [data-v="index"]').click(); await page.locator('#index-results .entry').first().click(); await page.waitForSelector('.sheet'); });
  await capture('10-right-now', full, async page => { await page.locator('[data-act="sheet"][data-s="support"]').first().click(); await page.waitForSelector('.sheet'); });
  await capture('11-close-the-day', full, async page => { await page.locator('[data-act="sheet"][data-s="close"]').first().click(); await page.waitForSelector('.words'); });
  await capture('12-earlier-pages', full, async page => { await page.locator('[data-act="sheet"][data-s="pages"]').first().click(); await page.waitForSelector('.sheet'); });
  await capture('13-night-desk', full, null, { hour: 23, minute: 30 });
  await capture('14-you', full, async page => { await page.locator('[data-act="open-profile"]').first().click(); await page.waitForSelector('.page-you'); });
  await capture('15-dossier-desktop', full, async page => { await page.setViewportSize({ width: 1280, height: 900 }); await page.locator('.masthead-nav [data-v="dossier"]').click(); await page.waitForSelector('.page-dossier'); });
  await browser.close();
  server.close();
  fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(shots));
})().catch(e => { console.error(e); process.exit(1); });
