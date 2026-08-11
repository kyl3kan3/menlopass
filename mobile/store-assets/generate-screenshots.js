const { chromium } = require('playwright');
const fs = require('fs');
const http = require('http');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const DIST = path.join(ROOT, 'dist');
const OUTPUT = __dirname;
const MIME = {
  '.css': 'text/css',
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json',
  '.woff2': 'font/woff2',
};

function demoData() {
  const entries = {};
  const today = new Date();
  for (let i = 59; i >= 0; i -= 1) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const key = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
    const improving = i / 59;
    entries[key] = {
      hf: Math.max(0, Math.round(5 * improving + (i % 3))),
      ns: i % 4 === 0 ? 3 : 1,
      inBedH: 8,
      sleepH: 6.2 + (i % 3) * 0.35,
      sym: {
        sleepq: i % 4 === 0 ? 3 : 1,
        mood: i > 35 ? 3 : 1,
        anx: 2,
        fog: i % 3 === 0 ? 2 : 1,
        joint: 2,
        dry: i < 24 ? 2 : 1,
        uri: 1,
        energy: 2,
        head: 0,
        palp: 0,
        itch: 1,
        libido: 2,
      },
      wt: 75 - (59 - i) * 0.025,
      waist: 91 - (59 - i) * 0.02,
      act: { res: i % 4 === 0, aero: i % 2 === 0 ? 30 : 0, pf: i % 3 === 0 },
      nut: { prot: i % 3 !== 0, alc: i % 6 === 0 ? 1 : 0, caf: 2, cal: i % 2 === 0 },
      bleed: i === 52 ? 'moderate' : 'none',
      notes: i === 4 ? 'Woke twice, felt foggy before lunch.' : '',
    };
  }
  return {
    v: 4,
    profile: {
      name: 'Morgan', birthYear: 1979, region: 'us', units: 'imperial', lastPeriod: '', surgeryDate: '',
      uterus: 'intact', ovaries: 'kept', bone: 'unknown', proteinGpk: 1.2, weightGoal: null,
      waistGoal: null, theme: 'dark', stage: null, onboarded: true,
    },
    entries,
    medications: [
      { id: 'estradiol', name: 'Estradiol 0.05 mg', form: 'patch', days: [1, 4], due: '08:00', notes: '' },
      { id: 'progesterone', name: 'Progesterone 100 mg', form: 'tablet', days: [0, 1, 2, 3, 4, 5, 6], due: '22:00', notes: '' },
    ],
    labs: [
      { id: 'vitamin-d', name: 'Vitamin D', date: '2026-07-28', value: '38', unit: 'ng/mL' },
      { id: 'tsh', name: 'TSH', date: '2026-07-28', value: '2.1', unit: 'mIU/L' },
    ],
    screening: {},
    scores: [{ date: '2026-07-20', type: 'phq9', score: 7, band: 'mild' }],
    trigger: null,
    meta: { created: '2026-06-01' },
  };
}

function createServer() {
  return http.createServer((request, response) => {
    let pathname = '/index.html';
    try { pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname); } catch {}
    if (pathname === '/') pathname = '/index.html';
    const file = path.resolve(DIST, pathname.replace(/^\/+/, ''));
    if (!file.startsWith(DIST + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('not found');
      return;
    }
    response.writeHead(200, {
      'Content-Type': MIME[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    response.end(fs.readFileSync(file));
  });
}

async function openDemoPage(browser, baseUrl, device, outputDir) {
  const context = await browser.newContext({
    viewport: device.viewport,
    deviceScaleFactor: device.deviceScaleFactor,
    colorScheme: 'dark',
    locale: 'en-US',
  });
  const page = await context.newPage();
  await page.addInitScript((data) => {
    localStorage.setItem('menocompass.v1', JSON.stringify(data));
    window.__MENO_NATIVE__ = false;
    window.__MENO_PRO_ACTIVE__ = true;
  }, demoData());
  await page.goto(`${baseUrl}/index.html`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  fs.mkdirSync(outputDir, { recursive: true });

  const capture = async (name) => {
    await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(outputDir, name), fullPage: false });
  };

  await page.click('[data-act="tab"][data-v="today"]');
  await capture('01-today.png');

  await page.click('[data-act="tab"][data-v="trends"]');
  await page.click('[data-act="range"][data-v="30"]');
  await capture('02-trends.png');

  await page.click('[data-act="tab"][data-v="meds"]');
  await capture('03-medications.png');

  await page.click('[data-act="tab"][data-v="report"]');
  await capture('04-clinician-report.png');

  await page.click('[data-act="tab"][data-v="settings"]');
  await page.click('[data-act="tab"][data-v="learn"]');
  await capture('05-evidence-guide.png');

  await context.close();
}

(async () => {
  if (!fs.existsSync(path.join(DIST, 'index.html'))) throw new Error('Run npm run build before generating screenshots.');
  const server = createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const browser = await chromium.launch({ headless: true });
  try {
    await openDemoPage(browser, baseUrl, { viewport: { width: 414, height: 896 }, deviceScaleFactor: 3 }, path.join(OUTPUT, 'iphone-6.5'));
    await openDemoPage(browser, baseUrl, { viewport: { width: 1024, height: 1366 }, deviceScaleFactor: 2 }, path.join(OUTPUT, 'ipad-12.9'));
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
  console.log('Generated App Store screenshots in mobile/store-assets.');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
