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

const { seeded } = require('./seed-record.cjs');

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
