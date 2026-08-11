const { chromium } = require('playwright');
const fs = require('fs');
const http = require('http');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const DIST = path.join(ROOT, 'dist');
const OUTPUT = __dirname;
const RAW_OUTPUT = path.join(OUTPUT, 'raw');
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

const STOREFRONT = [
  {
    file: '01-today.png',
    eyebrow: 'YOUR DAILY COMPASS',
    headline: 'See the whole pattern',
    subhead: 'Symptoms, sleep, movement, and treatment context—together in one private daily view.',
    accent: '#49d6bd',
    accentSoft: '#173f48',
    badge: 'Private by design',
  },
  {
    file: '02-trends.png',
    eyebrow: '30- & 90-DAY TRENDS',
    headline: 'Make trends useful',
    subhead: 'Compare how symptoms, sleep, and treatment context change over time.',
    accent: '#70c9ff',
    accentSoft: '#193c58',
    badge: 'Context, not conclusions',
  },
  {
    file: '03-medications.png',
    eyebrow: 'TREATMENT TRACKING',
    headline: 'Keep treatment in context',
    subhead: 'Track schedules, doses, and adherence alongside how you feel.',
    accent: '#f0b96a',
    accentSoft: '#4c382a',
    badge: 'Built for daily use',
  },
  {
    file: '04-clinician-report.png',
    eyebrow: 'CLINICIAN-READY REPORTS',
    headline: 'Walk in prepared',
    subhead: 'Create a clear summary to bring to your next appointment.',
    accent: '#c7a7ff',
    accentSoft: '#392f59',
    badge: 'Your data, clearly summarized',
  },
  {
    file: '05-evidence-guide.png',
    eyebrow: 'EVIDENCE GUIDE',
    headline: 'Know what the evidence says',
    subhead: 'Evidence-graded guidance in plain language, with clear limits.',
    accent: '#79ddb1',
    accentSoft: '#264b42',
    badge: 'Sources and certainty included',
  },
];

function marketingMarkup(asset, device, sourceData) {
  const isPhone = device.kind === 'iphone';
  const dimensions = isPhone
    ? {
        brandTop: 112, contentTop: 278, deviceTop: 670, deviceWidth: 906,
        headlineSize: 92, subheadSize: 37, eyebrowSize: 27, copyWidth: 1040,
        frameRadius: 112, framePadding: 22, badgeSize: 28,
      }
    : {
        brandTop: 104, contentTop: 254, deviceTop: 642, deviceWidth: 1560,
        headlineSize: 96, subheadSize: 38, eyebrowSize: 28, copyWidth: 1580,
        frameRadius: 92, framePadding: 24, badgeSize: 29,
      };
  return `<!doctype html>
  <html><head><meta charset="utf-8"><style>
    * { box-sizing: border-box; }
    html, body { margin: 0; width: 100%; height: 100%; overflow: hidden; }
    body {
      color: #f7fbff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background:
        radial-gradient(circle at 85% 10%, ${asset.accent}36 0, transparent 31%),
        radial-gradient(circle at 8% 72%, ${asset.accentSoft}b8 0, transparent 38%),
        linear-gradient(154deg, #122537 0%, #09131f 55%, #07101a 100%);
    }
    .canvas { position: relative; width: 100%; height: 100%; isolation: isolate; }
    .grain {
      position: absolute; inset: 0; opacity: .12; pointer-events: none; z-index: -1;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.82' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.18'/%3E%3C/svg%3E");
    }
    .orb { position: absolute; border-radius: 999px; filter: blur(1px); z-index: -1; }
    .orb.one { width: 390px; height: 390px; right: -118px; top: 470px; background: ${asset.accent}13; border: 1px solid ${asset.accent}26; }
    .orb.two { width: 220px; height: 220px; left: -96px; top: 128px; background: ${asset.accentSoft}70; }
    .brand {
      position: absolute; top: ${dimensions.brandTop}px; left: 50%; transform: translateX(-50%);
      display: inline-flex; align-items: center; gap: 17px; white-space: nowrap;
      font-size: ${isPhone ? 29 : 30}px; font-weight: 750; letter-spacing: .01em;
    }
    .mark {
      width: ${isPhone ? 56 : 58}px; height: ${isPhone ? 56 : 58}px; border-radius: 17px;
      display: grid; place-items: center; color: #08151f; font-weight: 900; font-size: 32px;
      background: linear-gradient(145deg, ${asset.accent}, #dffcf7);
      box-shadow: 0 13px 36px ${asset.accent}35;
    }
    .copy {
      position: absolute; top: ${dimensions.contentTop}px; left: 50%; transform: translateX(-50%);
      width: ${dimensions.copyWidth}px; text-align: center;
    }
    .eyebrow { color: ${asset.accent}; font-size: ${dimensions.eyebrowSize}px; font-weight: 800; letter-spacing: .17em; }
    h1 {
      margin: ${isPhone ? 20 : 18}px 0 ${isPhone ? 18 : 16}px; font-size: ${dimensions.headlineSize}px;
      line-height: .98; letter-spacing: -.055em; font-weight: 780;
    }
    .subhead {
      margin: 0 auto; max-width: ${isPhone ? 1010 : 1470}px; color: #c9d4df;
      font-size: ${dimensions.subheadSize}px; line-height: 1.34; letter-spacing: -.018em;
    }
    .device {
      position: absolute; top: ${dimensions.deviceTop}px; left: 50%; transform: translateX(-50%);
      width: ${dimensions.deviceWidth}px; padding: ${dimensions.framePadding}px;
      border-radius: ${dimensions.frameRadius}px;
      background: linear-gradient(145deg, #3b4a56 0%, #111a22 34%, #05090d 70%, #37434c 100%);
      box-shadow: 0 55px 120px #0009, 0 0 0 2px #ffffff22, inset 0 0 0 2px #ffffff1c;
    }
    .screen {
      position: relative; width: 100%; aspect-ratio: ${device.sourceWidth} / ${device.sourceHeight};
      overflow: hidden; border-radius: ${dimensions.frameRadius - dimensions.framePadding - 7}px;
      background: #08111b;
    }
    .screen img { display: block; width: 100%; height: 100%; object-fit: cover; }
    .speaker {
      position: absolute; z-index: 3; top: ${isPhone ? 36 : 33}px; left: 50%; transform: translateX(-50%);
      width: ${isPhone ? 164 : 124}px; height: ${isPhone ? 35 : 12}px; border-radius: 999px;
      background: #020406; box-shadow: 0 1px 0 #ffffff12;
    }
    .badge {
      position: absolute; right: ${isPhone ? 76 : 112}px; top: ${dimensions.deviceTop + (isPhone ? 94 : 84)}px;
      z-index: 4; display: flex; align-items: center; gap: 12px; padding: ${isPhone ? '15px 21px' : '17px 24px'};
      color: #effffb; background: #07121de8; border: 1px solid ${asset.accent}7a;
      border-radius: 999px; font-size: ${dimensions.badgeSize}px; font-weight: 650;
      box-shadow: 0 16px 36px #0007; backdrop-filter: blur(14px);
    }
    .badge i { width: 11px; height: 11px; border-radius: 50%; background: ${asset.accent}; box-shadow: 0 0 0 6px ${asset.accent}22; }
  </style></head><body><main class="canvas">
    <div class="grain"></div><div class="orb one"></div><div class="orb two"></div>
    <div class="brand"><span class="mark">M</span><span>MenoCompass</span></div>
    <section class="copy"><div class="eyebrow">${asset.eyebrow}</div><h1>${asset.headline}</h1><p class="subhead">${asset.subhead}</p></section>
    <div class="device"><div class="speaker"></div><div class="screen"><img src="data:image/png;base64,${sourceData}" alt=""></div></div>
    <div class="badge"><i></i>${asset.badge}</div>
  </main></body></html>`;
}

async function composeStorefront(browser, device, rawDir, outputDir) {
  fs.mkdirSync(outputDir, { recursive: true });
  const context = await browser.newContext({ viewport: device.output, deviceScaleFactor: 1 });
  const page = await context.newPage();
  for (const asset of STOREFRONT) {
    const sourceData = fs.readFileSync(path.join(rawDir, asset.file)).toString('base64');
    await page.setContent(marketingMarkup(asset, device, sourceData), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(outputDir, asset.file), fullPage: false });
  }
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
    const iphone = {
      kind: 'iphone', viewport: { width: 414, height: 896 }, deviceScaleFactor: 3,
      output: { width: 1242, height: 2688 }, sourceWidth: 1242, sourceHeight: 2688,
    };
    const ipad = {
      kind: 'ipad', viewport: { width: 1024, height: 1366 }, deviceScaleFactor: 2,
      output: { width: 2048, height: 2732 }, sourceWidth: 2048, sourceHeight: 2732,
    };
    const iphoneRaw = path.join(RAW_OUTPUT, 'iphone-6.5');
    const ipadRaw = path.join(RAW_OUTPUT, 'ipad-12.9');
    await openDemoPage(browser, baseUrl, iphone, iphoneRaw);
    await openDemoPage(browser, baseUrl, ipad, ipadRaw);
    await composeStorefront(browser, iphone, iphoneRaw, path.join(OUTPUT, 'iphone-6.5'));
    await composeStorefront(browser, ipad, ipadRaw, path.join(OUTPUT, 'ipad-12.9'));
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
  console.log('Generated polished App Store creatives in mobile/store-assets.');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
