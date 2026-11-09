/* App Store screenshots for peri 2.0, composed from the built web app.

   Captures six surfaces at iPhone 6.9" (1320×2868) and iPad 13" (2064×2752)
   from a seeded, fictional sixteen-day record, then sets each capture on a
   paper canvas under a Fraunces headline: the same system as the app. Native
   chrome (the tab bar) is drawn by the composer so no simulator is needed.

   Usage: python3 build.py && PLAYWRIGHT_CHANNEL=chrome node mobile/store-assets/generate-screenshots.js
   Output: mobile/store-assets/instrument/{iphone-6.9,ipad-13}/NN-name.png */
const { chromium } = require('playwright');
const fs = require('fs');
const http = require('http');
const path = require('path');
const { seeded } = require('../../tools/seed-record.cjs');

const ROOT = path.resolve(__dirname, '..', '..');
const DIST = path.join(ROOT, 'dist');
const OUT = path.join(__dirname, 'instrument');
const FONTS = {
  serif: fs.readFileSync(path.join(ROOT, 'assets/fonts/fraunces-latin-opsz-normal.woff2')).toString('base64'),
  serifItalic: fs.readFileSync(path.join(ROOT, 'assets/fonts/fraunces-latin-opsz-italic.woff2')).toString('base64'),
  sans: fs.readFileSync(path.join(ROOT, 'assets/fonts/instrument-sans-latin-wght-normal.woff2')).toString('base64'),
};

const DEVICES = {
  'iphone-6.9': { width: 1320, height: 2868, viewport: { width: 440, height: 880 }, scale: 3, mobile: true, radius: 150, frame: 1180 },
  'ipad-13': { width: 2064, height: 2752, viewport: { width: 1032, height: 1200 }, scale: 2, mobile: false, radius: 90, frame: 1760 },
};

/* The shell navigates by hash, as the native tab bar does. */
const go = (page, route) => page.evaluate(r => { window.location.hash = r; }, route);

const SCREENS = [
  { file: '01-today', eyebrow: 'The page', head: 'One finding a day, written from your record.', sub: 'A ledger of what happened and when. No form, no streak.', run: async () => {} },
  { file: '02-log', eyebrow: 'The ledger', head: 'One tap files it. The time is already there.', sub: 'Severity after the fact, dictation if you prefer.', run: async page => { await page.locator('[data-act="sheet"][data-s="log"]').first().click(); await page.waitForSelector('.sheet'); } },
  { file: '03-night', eyebrow: 'The night desk', head: 'At three in the morning the page goes dark.', sub: 'Woke, night sweat, can’t sleep. Then back to bed.', hour: 23, minute: 30, night: true, run: async () => {} },
  { file: '04-dossier', eyebrow: 'The dossier', head: 'Seven sections a clinician reads in two minutes.', sub: 'Findings, treatments, questions, evidence, your opening statement.', run: async page => { await go(page, 'dossier'); await page.waitForSelector('.page-dossier'); }, route: 'dossier' },
  { file: '05-brief', eyebrow: 'The brief', head: 'Export the one-page brief as a PDF.', sub: 'Thirty, ninety or a hundred and eighty days, in plain words.', run: async page => { await go(page, 'dossier'); await page.locator('[data-act="open-report"]').first().click(); await page.waitForSelector('.page-report'); }, route: null },
  { file: '06-index', eyebrow: 'The index', head: 'Fifteen reviewed chapters. Your own ledger first.', sub: 'One search box over symptoms, chapters and tools.', run: async page => { await go(page, 'index'); await page.waitForSelector('.page-index'); }, route: 'index' },
];

function serve() {
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.webp': 'image/webp', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0]);
    const file = path.join(DIST, url === '/' ? 'index.html' : url);
    if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    res.end(fs.readFileSync(file));
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve({ server, base: 'http://127.0.0.1:' + server.address().port })));
}

function pinClock(hour, minute) {
  return ([h, m]) => {
    const RealDate = Date; const fixed = new RealDate(); fixed.setHours(h, m, 0, 0); const offset = fixed.getTime() - RealDate.now();
    class PinnedDate extends RealDate { constructor(...a) { if (a.length) super(...a); else super(RealDate.now() + offset); } static now() { return RealDate.now() + offset; } }
    window.Date = PinnedDate;
  };
}

/* The native tab bar, drawn as the shell draws it (NativeTabBar.native.tsx). */
function tabBar(active, night, mobile) {
  if (!mobile) return '';
  const ink = night ? '#f3f2ee' : '#0c0c0d', grey = night ? '#9a9ba1' : '#8a8b91', bg = night ? '#000' : '#fbfbf9', rule = night ? '#2a2a2e' : '#0c0c0d';
  const tab = (route, label) => `<div style="flex:1;display:flex;flex-direction:column;align-items:center;padding-top:6px;gap:6px"><div style="width:18px;height:3px;border-radius:2px;background:${route === active ? '#d13a16' : 'transparent'}"></div><div style="font:${route === active ? 600 : 500} 13px/16px S;letter-spacing:.2px;color:${route === active ? ink : grey}">${label}</div></div>`;
  return `<div style="display:flex;border-top:1.5px solid ${rule};background:${bg};padding:2px 10px 34px">${tab('today', 'Today')}${tab('dossier', 'Dossier')}${tab('index', 'Index')}</div>`;
}

function canvas(device, screen, shotDataUrl) {
  const d = DEVICES[device];
  const night = !!screen.night;
  const frameW = d.frame, frameH = Math.round(frameW * (d.viewport.height / d.viewport.width));
  const top = Math.round(d.height * 0.085);
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  @font-face{font-family:F;src:url(data:font/woff2;base64,${FONTS.serif}) format('woff2');font-weight:100 900}
  @font-face{font-family:FI;src:url(data:font/woff2;base64,${FONTS.serifItalic}) format('woff2');font-weight:100 900}
  @font-face{font-family:S;src:url(data:font/woff2;base64,${FONTS.sans}) format('woff2');font-weight:100 900}
  html,body{margin:0;width:${d.width}px;height:${d.height}px;background:${night ? '#000' : '#fbfbf9'};color:${night ? '#f3f2ee' : '#0c0c0d'};overflow:hidden}
  .copy{position:absolute;left:${Math.round(d.width * 0.075)}px;right:${Math.round(d.width * 0.075)}px;top:${top}px}
  .mark{font:italic 500 ${Math.round(d.width * 0.034)}px/1 FI;letter-spacing:-.02em;display:flex;justify-content:space-between;align-items:baseline;padding-bottom:${Math.round(d.width * 0.016)}px;border-bottom:${Math.round(d.width * 0.0035)}px solid currentColor}
  .mark span{font:500 ${Math.round(d.width * 0.019)}px/1 S;letter-spacing:.14em;text-transform:uppercase;color:${night ? '#9a9ba1' : '#5f6066'}}
  h1{font:400 ${Math.round(d.width * (d.mobile ? 0.079 : 0.058))}px/1.04 F;letter-spacing:-.025em;font-variation-settings:"opsz" 144;margin:${Math.round(d.width * 0.045)}px 0 0;max-width:${d.mobile ? '100%' : '72%'}}
  p{font:400 ${Math.round(d.width * (d.mobile ? 0.03 : 0.022))}px/1.35 S;color:${night ? '#9a9ba1' : '#5f6066'};margin:${Math.round(d.width * 0.028)}px 0 0;max-width:${d.mobile ? '92%' : '60%'}}
  .frame{position:absolute;left:50%;transform:translateX(-50%);bottom:-${Math.round(frameH * 0.22)}px;width:${frameW}px;height:${frameH}px;border:${Math.round(d.width * 0.0075)}px solid ${night ? '#2a2a2e' : '#0c0c0d'};border-radius:${d.radius}px;overflow:hidden;background:${night ? '#000' : '#fbfbf9'};box-shadow:0 ${Math.round(d.width * 0.03)}px ${Math.round(d.width * 0.08)}px rgba(0,0,0,${night ? 0.6 : 0.14})}
  .frame img{display:block;width:100%;height:auto}
  .frame .bar{position:absolute;left:0;right:0;bottom:0;zoom:${(frameW / d.viewport.width).toFixed(4)}}
  </style></head><body>
  <div class="copy"><div class="mark">peri<span>${screen.eyebrow}</span></div><h1>${screen.head}</h1><p>${screen.sub}</p></div>
  <div class="frame"><img src="${shotDataUrl}" alt=""><div class="bar">${tabBar(screen.route === undefined ? 'today' : screen.route, night, d.mobile)}</div></div>
  </body></html>`;
}

(async () => {
  const { server, base } = await serve();
  const browser = await chromium.launch(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {});
  const record = seeded(16);
  for (const [device, d] of Object.entries(DEVICES)) {
    fs.mkdirSync(path.join(OUT, device), { recursive: true });
    for (const screen of SCREENS) {
      const context = await browser.newContext({ viewport: d.viewport, deviceScaleFactor: d.scale, isMobile: d.mobile, hasTouch: d.mobile });
      await context.addInitScript(pinClock(), [screen.hour ?? 14, screen.minute ?? 14]);
      await context.addInitScript(v => localStorage.setItem('menocompass.v1', JSON.stringify(v)), record);
      // The shell hides the web nav behind its own tab bar; the composer draws that bar.
      if (d.mobile) await context.addInitScript(() => { document.addEventListener('DOMContentLoaded', () => document.documentElement.classList.add('native-app', 'native-ios-tabs')); });
      const page = await context.newPage();
      await page.goto(base + '/index.html');
      await page.waitForTimeout(300);
      await screen.run(page);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(350);
      const shot = await page.screenshot({ fullPage: false });
      await context.close();
      const composer = await browser.newPage({ viewport: { width: d.width, height: d.height }, deviceScaleFactor: 1 });
      await composer.setContent(canvas(device, screen, 'data:image/png;base64,' + shot.toString('base64')), { waitUntil: 'load' });
      await composer.evaluate(() => document.fonts.ready);
      const file = path.join(OUT, device, screen.file + '.png');
      await composer.screenshot({ path: file, fullPage: false });
      await composer.close();
      console.log('wrote', path.relative(ROOT, file));
    }
  }
  await browser.close();
  server.close();
})().catch(error => { console.error(error); process.exit(1); });
