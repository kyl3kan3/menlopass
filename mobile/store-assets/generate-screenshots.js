const { chromium } = require('playwright');
const fs = require('fs');
const http = require('http');
const path = require('path');
const zlib = require('zlib');

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

const DEMO_DATE = '2026-08-11';
const DEMO_NOW = new Date(`${DEMO_DATE}T14:19:00-05:00`);
const BRICOLAGE_DATA = fs
  .readFileSync(path.join(ROOT, 'assets', 'fonts', 'bricolage-grotesque-latin.woff2'))
  .toString('base64');

function demoData() {
  const entries = {};
  const [year, month, day] = DEMO_DATE.split('-').map(Number);
  const todayUtc = Date.UTC(year, month - 1, day);
  for (let i = 59; i >= 0; i -= 1) {
    const key = new Date(todayUtc - i * 86400000).toISOString().slice(0, 10);
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
    entries[key].confirmedData = JSON.parse(JSON.stringify(entries[key]));
    entries[key].confirmed = true;
    entries[key].draftDirty = false;
  }
  return {
    v: 5,
    profile: {
      name: 'Morgan', birthYear: 1979, region: 'us', units: 'imperial', lastPeriod: '', surgeryDate: '',
      uterus: 'intact', ovaries: 'kept', bone: 'unknown', proteinGpk: 1.2, weightGoal: null,
      waistGoal: null, theme: 'dark', stage: null, onboarded: true, onboardingStep: 3,
      onboardingDeferred: false, intent: 'treatment',
      pinnedSymptoms: ['hf', 'ns', 'fog', 'energy', 'joint', 'anx'],
    },
    entries,
    medications: [
      { id: 'estradiol', name: 'Estradiol 0.05 mg', form: 'patch', days: [1, 4], due: '08:00', notes: '', started: '2026-07-10', changes: [{date:'2026-08-08',label:'Dose increased from 0.025 mg'}] },
      { id: 'progesterone', name: 'Progesterone 100 mg', form: 'tablet', days: [0, 1, 2, 3, 4, 5, 6], due: '22:00', notes: '', started: '2026-07-10', changes: [] },
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
    timezoneId: 'America/Chicago',
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  await page.addInitScript(({ data, now }) => {
    const NativeDate = Date;
    function DemoDate(...args) {
      if (!(this instanceof DemoDate)) return new NativeDate(now).toString();
      return new NativeDate(...(args.length ? args : [now]));
    }
    DemoDate.prototype = NativeDate.prototype;
    Object.setPrototypeOf(DemoDate, NativeDate);
    DemoDate.now = () => now;
    window.Date = DemoDate;
    localStorage.setItem('menocompass.v1', JSON.stringify(data));
    window.__MENO_NATIVE__ = false;
    window.__MENO_PRO_ACTIVE__ = true;
  }, { data: demoData(), now: DEMO_NOW.getTime() });
  await page.goto(`${baseUrl}/index.html`, { waitUntil: 'networkidle' });
  await page.addStyleTag({
    content: '*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}',
  });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  fs.mkdirSync(outputDir, { recursive: true });

  const goRoute = async (route) => {
    await page.evaluate((nextRoute) => {
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      location.hash = `#${nextRoute}`;
    }, route);
    await page.waitForFunction((nextRoute) => {
      const active = document.querySelector(`[data-act="tab"][data-v="${nextRoute}"]`);
      return location.hash === `#${nextRoute}` && active?.getAttribute('aria-current') === 'page';
    }, route);
  };

  const capture = async (name, readySelector) => {
    if (readySelector) await page.waitForSelector(readySelector, { state: 'visible' });
    await page.evaluate(() => {
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      window.scrollTo(0, 0);
    });
    await page.waitForFunction(() => window.scrollY === 0 && document.documentElement.scrollTop === 0);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(outputDir, name), fullPage: false });
  };

  await goRoute('today');
  await capture('01-today.png', '.jc-home .jc-primary');

  await goRoute('journey');
  await capture('02-trends.png', '.jc-journey .jc-timeline');

  await goRoute('care');
  await capture('03-medications.png', '.jc-care .jc-treatment-list');

  await page.click('[data-act="open-report"]');
  if (device.kind === 'iphone') {
    // End the portrait frame on complete report rows; the live report itself remains unchanged.
    await page.evaluate(() => {
      const reportCards = [...document.querySelectorAll('.jc-report-route .report-page > .card')];
      const symptomRows = reportCards[1] ? [...reportCards[1].querySelectorAll('.kv')] : [];
      symptomRows.slice(4).forEach((row) => row.remove());
      reportCards.slice(2).forEach((card) => card.remove());
    });
  }
  await capture('04-clinician-report.png', '.jc-report-route .report-page');
  await page.click('[data-act="go-care"]');

  await goRoute('guide');
  await page.click('[data-act="sheet"][data-s="learn:symptoms"]');
  await page.click('.sheet [data-act="sheet"][data-s="learn:sym-vms"]');
  const evidenceHeading = page.getByRole('heading', { name: 'What has evidence', exact: true });
  await evidenceHeading.scrollIntoViewIfNeeded();
  await page.evaluate(() => {
    const sheet = document.querySelector('.sheet');
    const heading = [...document.querySelectorAll('.sheet h4')].find((node) => node.textContent.trim() === 'What has evidence');
    if (sheet && heading) sheet.scrollTop = Math.max(0, heading.offsetTop - 96);
  });
  if (device.kind === 'iphone') {
    // Frame the evidence and limitation sections on full content boundaries in the portrait asset.
    await page.evaluate(() => {
      const heading = [...document.querySelectorAll('.sheet h4')]
        .find((node) => node.textContent.trim() === 'What has evidence');
      let leading = heading?.previousElementSibling;
      while (leading && !leading.classList.contains('sheet-bar')) {
        const previous = leading.previousElementSibling;
        leading.remove();
        leading = previous;
      }
      const limit = [...document.querySelectorAll('.sheet .callout.warn')]
        .find((node) => node.textContent.includes('The honest bad news'));
      let trailing = limit?.nextElementSibling;
      while (trailing) {
        const next = trailing.nextElementSibling;
        trailing.remove();
        trailing = next;
      }
      if (limit) limit.style.marginBottom = '72px';
      const sheet = document.querySelector('.sheet');
      if (sheet) sheet.scrollTop = 0;
    });
  }
  await capture('05-evidence-guide.png', '.sheet .badge.strong');

  await context.close();
}

const STOREFRONT = [
  {
    file: '01-today.png',
    number: '01',
    eyebrow: 'PRIVATE MENOPAUSE TRACKING',
    headline: 'Clearer patterns.<br>Better appointments.',
    subhead: 'Log symptoms, medications, and notes in about 30 seconds. Your health entries stay on your device.',
    badge: 'Daily check-in · about 30 sec',
    ipadScale: 1.27,
  },
  {
    file: '02-trends.png',
    number: '02',
    eyebrow: 'YOUR JOURNEY',
    headline: 'See symptoms and<br>treatment together.',
    subhead: 'Follow confirmed days, treatment changes, and weekly patterns in one story.',
    badge: 'Confirmed days · weekly patterns',
    ipadScale: 1.09,
  },
  {
    file: '03-medications.png',
    number: '03',
    eyebrow: 'TREATMENT + LABS',
    headline: 'Keep treatment<br>in context.',
    subhead: 'Track schedules, doses, adherence, and lab results alongside how you feel.',
    badge: 'Medications + labs together',
    ipadScale: 1.27,
  },
  {
    file: '04-clinician-report.png',
    number: '04',
    eyebrow: 'CLINICIAN-READY SUMMARY',
    headline: 'Walk in with<br>a clearer story.',
    subhead: 'Turn your private log into a focused summary for your next appointment.',
    badge: '90-day clinician summary',
    ipadScale: 1.27,
  },
  {
    file: '05-evidence-guide.png',
    number: '05',
    eyebrow: 'EVIDENCE WITHOUT THE HYPE',
    headline: 'Know what helps—<br>and how sure we are.',
    subhead: 'Plain-language guidance with evidence grades, sources, and clear limits.',
    badge: 'Grades · sources · limits',
    ipadScale: 1.02,
  },
];

function marketingMarkup(asset, device, sourceData) {
  const isPhone = device.kind === 'iphone';
  const imageScale = isPhone ? (asset.phoneScale || 1) : (asset.ipadScale || 1);
  const dimensions = isPhone
    ? {
        edge: 86, brandTop: 76, contentTop: 196, nightTop: 612,
        deviceTop: 664, deviceWidth: 950, headlineSize: 94, subheadSize: 32,
        eyebrowSize: 23, copyWidth: 1070, frameRadius: 102, framePadding: 18,
        badgeSize: 25, numberSize: 270,
      }
    : {
        edge: 118, brandTop: 82, contentTop: 212, nightTop: 604,
        deviceTop: 652, deviceWidth: 1660, headlineSize: 98, subheadSize: 35,
        eyebrowSize: 24, copyWidth: 1620, frameRadius: 92, framePadding: 21,
        badgeSize: 28, numberSize: 330,
      };
  return `<!doctype html>
  <html><head><meta charset="utf-8"><style>
    @font-face {
      font-family: "Bricolage";
      src: url("data:font/woff2;base64,${BRICOLAGE_DATA}") format("woff2");
      font-style: normal;
      font-weight: 200 800;
      font-display: block;
    }
    * { box-sizing: border-box; }
    html, body { margin: 0; width: 100%; height: 100%; overflow: hidden; }
    body {
      color: #0e1618;
      font-family: "Bricolage", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background:
        radial-gradient(circle at 88% 4%, #e8a5522b 0, transparent 24%),
        linear-gradient(145deg, #faf6f0 0%, #f2ece3 58%, #ece3d7 100%);
    }
    .canvas { position: relative; width: 100%; height: 100%; isolation: isolate; }
    .grain {
      position: absolute; inset: 0; opacity: .055; pointer-events: none; z-index: 8;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.82' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.18'/%3E%3C/svg%3E");
    }
    .night {
      position: absolute; z-index: -1; left: -8%; right: -8%; top: ${dimensions.nightTop}px; bottom: -12%;
      overflow: hidden; border-radius: 50% 50% 0 0 / ${isPhone ? 5 : 7}% ${isPhone ? 5 : 7}% 0 0;
      background:
        radial-gradient(circle at 78% 18%, #6fb79a22 0, transparent 27%),
        radial-gradient(circle at 12% 48%, #e8a55219 0, transparent 31%),
        linear-gradient(155deg, #142326 0%, #0b1416 55%, #080d0e 100%);
      box-shadow: 0 -2px 0 #26383e, 0 -24px 70px #0e16181c;
    }
    .night::after {
      content: ""; position: absolute; inset: 0; opacity: .18;
      background-image:
        linear-gradient(#ffffff08 1px, transparent 1px),
        linear-gradient(90deg, #ffffff08 1px, transparent 1px);
      background-size: ${isPhone ? 86 : 112}px ${isPhone ? 86 : 112}px;
      mask-image: linear-gradient(to bottom, #0008, transparent 72%);
    }
    .rings {
      position: absolute; z-index: -1; width: ${isPhone ? 610 : 760}px; height: ${isPhone ? 610 : 760}px;
      right: ${isPhone ? -226 : -180}px; top: ${isPhone ? 106 : 88}px; border-radius: 50%;
      border: 2px solid #17313520; box-shadow: inset 0 0 0 ${isPhone ? 64 : 82}px #ffffff00;
    }
    .rings::before, .rings::after { content: ""; position: absolute; border-radius: 50%; border: 2px solid #17313517; }
    .rings::before { inset: ${isPhone ? 76 : 94}px; }
    .rings::after { inset: ${isPhone ? 154 : 190}px; border-color: #e8a55240; }
    .rings i {
      position: absolute; width: ${isPhone ? 18 : 22}px; height: ${isPhone ? 18 : 22}px;
      left: 50%; top: 50%; transform: translate(-50%, -50%); border-radius: 50%;
      background: #e8a552; box-shadow: 0 0 0 12px #e8a5521e;
    }
    .ghost {
      position: absolute; z-index: -1; right: ${isPhone ? 34 : 84}px; top: ${isPhone ? 105 : 92}px;
      color: #102629; opacity: .045; font-size: ${dimensions.numberSize}px; line-height: .8;
      font-weight: 780; letter-spacing: -.09em;
    }
    .brand {
      position: absolute; z-index: 3; top: ${dimensions.brandTop}px; left: ${dimensions.edge}px;
      display: inline-flex; align-items: center; gap: ${isPhone ? 15 : 17}px; white-space: nowrap;
      color: #132b2e; font-size: ${isPhone ? 28 : 30}px; font-weight: 720; letter-spacing: -.02em;
    }
    .subscription {
      position: absolute; z-index: 4; top: ${dimensions.brandTop + (isPhone ? 4 : 2)}px; right: ${dimensions.edge}px;
      padding: ${isPhone ? '11px 16px 10px' : '12px 18px 11px'};
      color: #744712; background: #fff8edeb; border: 1px solid #b8742888;
      border-radius: 999px; box-shadow: 0 9px 24px #10242616;
      font-size: ${isPhone ? 17 : 19}px; line-height: 1; font-weight: 790; letter-spacing: .075em;
    }
    .mark {
      position: relative; width: ${isPhone ? 54 : 58}px; height: ${isPhone ? 54 : 58}px; border-radius: 17px;
      display: grid; place-items: center; background: #132b2e; box-shadow: 0 10px 28px #10242624;
    }
    .mark::before, .mark::after { content: ""; position: absolute; left: 50%; top: 50%; transform-origin: 50% 50%; }
    .mark::before {
      width: ${isPhone ? 22 : 24}px; height: ${isPhone ? 22 : 24}px; transform: translate(-50%, -50%) rotate(45deg);
      border: 2px solid #f6f0e8; border-radius: 5px;
    }
    .mark::after {
      width: 8px; height: ${isPhone ? 28 : 30}px; transform: translate(-50%, -50%) rotate(32deg);
      border-radius: 999px 999px 3px 3px; background: linear-gradient(to bottom, #e8a552 0 48%, #f6f0e8 48% 100%);
    }
    .copy {
      position: absolute; z-index: 2; top: ${dimensions.contentTop}px; left: ${dimensions.edge}px;
      width: ${dimensions.copyWidth}px; text-align: left;
    }
    .eyebrow {
      color: #955d18; font-family: "Bricolage", sans-serif;
      font-size: ${dimensions.eyebrowSize}px; font-weight: 800; letter-spacing: .14em;
    }
    h1 {
      margin: ${isPhone ? 17 : 16}px 0 ${isPhone ? 16 : 14}px; color: #102426;
      font-size: ${dimensions.headlineSize}px; line-height: .91; letter-spacing: -.06em; font-weight: 760;
    }
    .subhead {
      margin: 0; max-width: ${isPhone ? 1030 : 1490}px; color: #48595b;
      font-size: ${dimensions.subheadSize}px; line-height: 1.28; letter-spacing: -.022em; font-weight: 450;
    }
    .device {
      position: absolute; top: ${dimensions.deviceTop}px; left: 50%; transform: translateX(-50%);
      width: ${dimensions.deviceWidth}px; padding: ${dimensions.framePadding}px;
      border-radius: ${dimensions.frameRadius}px;
      background: linear-gradient(142deg, #48575a 0%, #172124 20%, #040708 69%, #344144 100%);
      box-shadow: 0 56px 120px #000a, 0 0 0 2px #ffffff24, 0 0 0 8px #08101266, inset 0 0 0 2px #ffffff16;
    }
    .screen {
      position: relative; width: 100%; aspect-ratio: ${device.sourceWidth} / ${device.sourceHeight};
      overflow: hidden; border-radius: ${dimensions.frameRadius - dimensions.framePadding - 7}px;
      background: #080d0e;
    }
    .screen img {
      display: block; width: 100%; height: 100%; object-fit: cover;
      transform: scale(${imageScale}); transform-origin: 50% 0;
    }
    .speaker {
      position: absolute; z-index: 3; top: ${isPhone ? 34 : 31}px; left: 50%; transform: translateX(-50%);
      width: ${isPhone ? 158 : 16}px; height: ${isPhone ? 34 : 16}px; border-radius: 999px;
      background: #020405; box-shadow: 0 1px 0 #ffffff12;
    }
    .badge {
      position: absolute; right: ${isPhone ? 72 : 122}px; top: ${dimensions.deviceTop - (isPhone ? 39 : 43)}px;
      z-index: 4; display: flex; align-items: center; gap: ${isPhone ? 14 : 16}px;
      padding: ${isPhone ? '13px 20px 13px 13px' : '15px 23px 15px 15px'};
      color: #f8f3eb; background: #122729f2; border: 1px solid #e8a5527d;
      border-radius: 999px; font-size: ${dimensions.badgeSize}px; font-weight: 630; letter-spacing: -.015em;
      box-shadow: 0 16px 38px #0007;
    }
    .badge b {
      display: grid; place-items: center; min-width: ${isPhone ? 45 : 50}px; height: ${isPhone ? 45 : 50}px;
      padding: 0 8px; border-radius: 999px; color: #102426; background: #e8a552;
      font-family: "Bricolage", sans-serif; font-size: ${isPhone ? 18 : 20}px; letter-spacing: .03em;
    }
  </style></head><body><main class="canvas">
    <div class="grain"></div><div class="night"></div><div class="rings"><i></i></div><div class="ghost">${asset.number}</div>
    <div class="brand"><span class="mark"></span><span>MenoCompass</span></div>
    <div class="subscription">SUBSCRIPTION REQUIRED</div>
    <section class="copy"><div class="eyebrow">${asset.eyebrow}</div><h1>${asset.headline}</h1><p class="subhead">${asset.subhead}</p></section>
    <div class="device"><div class="speaker"></div><div class="screen"><img src="data:image/png;base64,${sourceData}" alt=""></div></div>
    <div class="badge"><b>${asset.number}</b><span>${asset.badge}</span></div>
  </main></body></html>`;
}

async function composeStorefront(browser, device, rawDir, outputDir) {
  fs.mkdirSync(outputDir, { recursive: true });
  const context = await browser.newContext({ viewport: device.output, deviceScaleFactor: 1 });
  for (const asset of STOREFRONT) {
    const page = await context.newPage();
    const sourceData = fs.readFileSync(path.join(rawDir, asset.file)).toString('base64');
    await page.setContent(marketingMarkup(asset, device, sourceData), { waitUntil: 'load' });
    await page.evaluate(async () => {
      await document.fonts.load('800 96px "Bricolage"');
      await document.fonts.ready;
      if (!document.fonts.check('800 96px "Bricolage"')) {
        throw new Error('Storefront font failed to load.');
      }
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    const sourceImage = await page.$eval('.screen img', async (img) => {
      await img.decode();
      return { complete: img.complete, width: img.naturalWidth, height: img.naturalHeight };
    });
    if (!sourceImage.complete || sourceImage.width !== device.sourceWidth || sourceImage.height !== device.sourceHeight) {
      throw new Error(`Raw source failed to decode for ${asset.file}: ${sourceImage.width}x${sourceImage.height}.`);
    }
    const brandVisible = await page.$eval('.brand', (element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    });
    if (!brandVisible) throw new Error(`Storefront brand lockup is not visible for ${asset.file}.`);
    const subscriptionVisible = await page.$eval('.subscription', (element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && rect.right <= innerWidth && rect.bottom <= innerHeight &&
        style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    });
    if (!subscriptionVisible) throw new Error(`Subscription disclosure is not visible for ${asset.file}.`);
    await page.screenshot({ path: path.join(outputDir, asset.file), fullPage: false });
    await page.close();
  }
  await context.close();
}

const CRC_TABLE = Array.from({ length: 256 }, (_, value) => {
  let crc = value;
  for (let bit = 0; bit < 8; bit += 1) crc = (crc & 1) ? (0xedb88320 ^ (crc >>> 1)) : (crc >>> 1);
  return crc >>> 0;
});

function crc32(data) {
  let crc = 0xffffffff;
  for (const byte of data) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function pngMetadata(file) {
  const data = fs.readFileSync(file);
  if (data.length < 33 || data.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
    throw new Error(`${file} is not a valid PNG.`);
  }
  if (data.subarray(12, 16).toString('ascii') !== 'IHDR') {
    throw new Error(`${file} has no PNG IHDR chunk.`);
  }
  let hasTransparencyChunk = false;
  let hasImageData = false;
  let hasEnd = false;
  let headerCount = 0;
  let imageDataEnded = false;
  const imageDataChunks = [];
  let offset = 8;
  let chunkIndex = 0;
  while (offset + 12 <= data.length) {
    const length = data.readUInt32BE(offset);
    const type = data.subarray(offset + 4, offset + 8).toString('ascii');
    if (!/^[A-Za-z]{4}$/.test(type)) throw new Error(`${file} has an invalid PNG chunk type.`);
    if (offset + 12 + length > data.length) throw new Error(`${file} has a malformed PNG chunk.`);
    if (chunkIndex === 0 && (type !== 'IHDR' || length !== 13)) throw new Error(`${file} has an invalid first PNG chunk.`);
    const chunkEnd = offset + 8 + length;
    const expectedCrc = data.readUInt32BE(chunkEnd);
    const actualCrc = crc32(data.subarray(offset + 4, chunkEnd));
    if (actualCrc !== expectedCrc) throw new Error(`${file} has a corrupt ${type} PNG chunk.`);
    if (type === 'IHDR') headerCount += 1;
    if (type === 'IDAT') {
      if (imageDataEnded) throw new Error(`${file} has non-contiguous PNG image data.`);
      hasImageData = true;
      imageDataChunks.push(data.subarray(offset + 8, chunkEnd));
    } else if (hasImageData) {
      imageDataEnded = true;
    }
    if (type === 'tRNS') hasTransparencyChunk = true;
    if ((type.charCodeAt(0) & 0x20) === 0 && !['IHDR', 'PLTE', 'IDAT', 'IEND'].includes(type)) {
      throw new Error(`${file} contains unsupported critical PNG chunk ${type}.`);
    }
    offset += length + 12;
    chunkIndex += 1;
    if (type === 'IEND') {
      if (length !== 0 || offset !== data.length) throw new Error(`${file} has an invalid PNG ending.`);
      hasEnd = true;
      break;
    }
  }
  if (headerCount !== 1 || !hasImageData || !hasEnd) throw new Error(`${file} is an incomplete PNG.`);
  const width = data.readUInt32BE(16);
  const height = data.readUInt32BE(20);
  const decodedLength = height * (1 + width * 3);
  let decoded;
  try {
    decoded = zlib.inflateSync(Buffer.concat(imageDataChunks), { maxOutputLength: decodedLength });
  } catch (error) {
    throw new Error(`${file} has invalid compressed PNG image data.`, { cause: error });
  }
  if (decoded.length !== decodedLength) throw new Error(`${file} has incomplete PNG scanlines.`);
  const scanlineLength = 1 + width * 3;
  for (let row = 0; row < height; row += 1) {
    if (decoded[row * scanlineLength] > 4) throw new Error(`${file} has an invalid PNG scanline filter.`);
  }
  return {
    data,
    width,
    height,
    bitDepth: data[24],
    colorType: data[25],
    compressionMethod: data[26],
    filterMethod: data[27],
    interlaceMethod: data[28],
    hasTransparencyChunk,
  };
}

function validatePngSet(directory, device, rawDir = null) {
  const expected = STOREFRONT.map((asset) => asset.file).sort();
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const actual = entries.map((entry) => entry.name).sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${directory} must contain exactly: ${expected.join(', ')}`);
  }
  if (entries.some((entry) => !entry.isFile() || entry.isSymbolicLink())) {
    throw new Error(`${directory} must contain regular PNG files only.`);
  }
  for (const file of expected) {
    const target = path.join(directory, file);
    const png = pngMetadata(target);
    if (png.width !== device.output.width || png.height !== device.output.height) {
      throw new Error(`${target} is ${png.width}x${png.height}; expected ${device.output.width}x${device.output.height}.`);
    }
    if (
      png.bitDepth !== 8 || png.colorType !== 2 || png.compressionMethod !== 0
      || png.filterMethod !== 0 || png.interlaceMethod !== 0 || png.hasTransparencyChunk
    ) {
      throw new Error(`${target} must be an 8-bit RGB PNG without transparency.`);
    }
    if (rawDir && png.data.equals(fs.readFileSync(path.join(rawDir, file)))) {
      throw new Error(`${target} is identical to its raw capture; storefront composition is missing.`);
    }
  }
}

function renameWithRetry(source, destination) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      fs.renameSync(source, destination);
      return;
    } catch (error) {
      const retryable = ['EBUSY', 'EACCES', 'EPERM', 'UNKNOWN'].includes(error.code);
      if (!retryable || attempt === 5) throw error;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, attempt * 150);
    }
  }
}

function promoteDirectoryTransaction(transactionRoot, planSpecs, verify) {
  const plans = planSpecs.map((plan) => ({
    ...plan,
    backup: path.join(transactionRoot, 'backup', plan.id),
    rejected: path.join(transactionRoot, 'rejected', plan.id),
    backedUp: false,
    installed: false,
  }));
  try {
    for (const plan of plans) {
      if (fs.existsSync(plan.target)) {
        renameWithRetry(plan.target, plan.backup);
        plan.backedUp = true;
      }
      renameWithRetry(plan.staged, plan.target);
      plan.installed = true;
    }
    verify();
  } catch (originalError) {
    const rollbackErrors = [];
    for (const plan of [...plans].reverse()) {
      if (plan.installed && fs.existsSync(plan.target)) {
        try {
          renameWithRetry(plan.target, plan.rejected);
        } catch (error) {
          rollbackErrors.push(error);
        }
      }
      if (plan.backedUp && fs.existsSync(plan.backup)) {
        try {
          renameWithRetry(plan.backup, plan.target);
        } catch (error) {
          rollbackErrors.push(error);
        }
      }
    }
    if (rollbackErrors.length) {
      const aggregate = new AggregateError(
        [originalError, ...rollbackErrors],
        `Screenshot promotion and rollback failed; recovery data is preserved at ${transactionRoot}.`,
      );
      aggregate.preserveTransactionRoot = true;
      throw aggregate;
    }
    throw originalError;
  }
}

function removeTransactionRoot(transactionRoot) {
  const resolved = path.resolve(transactionRoot);
  if (
    path.dirname(resolved) !== path.resolve(OUTPUT)
    || !path.basename(resolved).startsWith('.store-transaction-')
  ) {
    throw new Error(`Refusing to remove unexpected transaction path: ${resolved}`);
  }
  fs.rmSync(resolved, { recursive: true, force: true, maxRetries: 5, retryDelay: 150 });
}

const composeOnly = process.argv.includes('--compose-only');

(async () => {
  if (!composeOnly && !fs.existsSync(path.join(DIST, 'index.html'))) {
    throw new Error('Run npm run build before generating screenshots.');
  }
  let server = null;
  let browser = null;
  let transactionRoot = null;
  let preserveTransactionRoot = false;
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
    const finalIphone = path.join(OUTPUT, 'iphone-6.5');
    const finalIpad = path.join(OUTPUT, 'ipad-12.9');
    transactionRoot = fs.mkdtempSync(path.join(OUTPUT, '.store-transaction-'));
    const stagedIphoneRaw = path.join(transactionRoot, 'staged', 'raw', 'iphone-6.5');
    const stagedIpadRaw = path.join(transactionRoot, 'staged', 'raw', 'ipad-12.9');
    const stagedIphone = path.join(transactionRoot, 'staged', 'final', 'iphone-6.5');
    const stagedIpad = path.join(transactionRoot, 'staged', 'final', 'ipad-12.9');
    let sourceIphoneRaw = iphoneRaw;
    let sourceIpadRaw = ipadRaw;

    if (!composeOnly) {
      server = createServer();
      await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
      const address = server.address();
      const baseUrl = `http://127.0.0.1:${address.port}`;
      browser = await chromium.launch({ headless: true });
      await openDemoPage(browser, baseUrl, iphone, stagedIphoneRaw);
      await openDemoPage(browser, baseUrl, ipad, stagedIpadRaw);
      validatePngSet(stagedIphoneRaw, iphone);
      validatePngSet(stagedIpadRaw, ipad);
      sourceIphoneRaw = stagedIphoneRaw;
      sourceIpadRaw = stagedIpadRaw;
    } else {
      browser = await chromium.launch({ headless: true });
      validatePngSet(iphoneRaw, iphone);
      validatePngSet(ipadRaw, ipad);
    }
    await composeStorefront(browser, iphone, sourceIphoneRaw, stagedIphone);
    await composeStorefront(browser, ipad, sourceIpadRaw, stagedIpad);
    validatePngSet(stagedIphone, iphone, sourceIphoneRaw);
    validatePngSet(stagedIpad, ipad, sourceIpadRaw);

    await browser.close();
    browser = null;
    if (server) {
      await new Promise((resolve) => server.close(resolve));
      server = null;
    }

    const plans = [
      ...(composeOnly ? [] : [
        { id: 'raw-iphone-6.5', staged: stagedIphoneRaw, target: iphoneRaw },
        { id: 'raw-ipad-12.9', staged: stagedIpadRaw, target: ipadRaw },
      ]),
      { id: 'final-iphone-6.5', staged: stagedIphone, target: finalIphone },
      { id: 'final-ipad-12.9', staged: stagedIpad, target: finalIpad },
    ];
    promoteDirectoryTransaction(transactionRoot, plans, () => {
      validatePngSet(iphoneRaw, iphone);
      validatePngSet(ipadRaw, ipad);
      validatePngSet(finalIphone, iphone, iphoneRaw);
      validatePngSet(finalIpad, ipad, ipadRaw);
    });
  } catch (error) {
    preserveTransactionRoot = Boolean(error.preserveTransactionRoot);
    throw error;
  } finally {
    if (browser) await browser.close();
    if (server) await new Promise((resolve) => server.close(resolve));
    if (transactionRoot && !preserveTransactionRoot) removeTransactionRoot(transactionRoot);
  }
  console.log(`${composeOnly ? 'Composed' : 'Generated'} validated App Store creatives in mobile/store-assets.`);
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
