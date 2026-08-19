const { chromium } = require('playwright');
const ffmpegPath = require('ffmpeg-static');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const RAW = path.join(ROOT, 'raw', 'iphone-6.5');
const OUTPUT = path.join(ROOT, 'product-demo');
const TEMP = path.join(OUTPUT, '.tmp');
const DURATION_SECONDS = 29;
const CAPTURE_SECONDS = 30;
const WIDTH = 886;
const HEIGHT = 1920;

const SCENES = [
  {
    start: 0,
    end: 5.8,
    file: '01-today.png',
    eyebrow: 'YOUR DAILY COMPASS',
    headline: 'See the whole pattern',
    subhead: 'Track symptoms, sleep, movement, and treatment context together.',
    accent: '#49d6bd',
  },
  {
    start: 5.8,
    end: 11.6,
    file: '02-trends.png',
    eyebrow: '30- & 90-DAY TRENDS',
    headline: 'Make trends useful',
    subhead: 'Review changes over time without mistaking correlation for cause.',
    accent: '#70c9ff',
  },
  {
    start: 11.6,
    end: 17.2,
    file: '03-medications.png',
    eyebrow: 'TREATMENT TRACKING',
    headline: 'Keep treatment in context',
    subhead: 'Track schedules, doses, adherence, and lab results alongside how you feel.',
    accent: '#f0b96a',
  },
  {
    start: 17.2,
    end: 23,
    file: '04-clinician-report.png',
    eyebrow: 'CLINICIAN-READY REPORTS',
    headline: 'Walk in prepared',
    subhead: 'Create a clear summary to bring to your next appointment.',
    accent: '#c7a7ff',
  },
  {
    start: 23,
    end: 27.2,
    file: '05-evidence-guide.png',
    eyebrow: 'EVIDENCE GUIDE',
    headline: 'Know what the evidence says',
    subhead: 'Read evidence-graded guidance in plain language, with clear limits.',
    accent: '#79ddb1',
  },
];

function imageData(file) {
  const source = path.join(RAW, file);
  if (!fs.existsSync(source)) {
    throw new Error(`Missing ${source}. Run npm run screenshots:store first.`);
  }
  return fs.readFileSync(source).toString('base64');
}

function demoHtml() {
  const sceneMarkup = SCENES.map((scene, index) => `
    <section class="scene" data-scene="${index}" style="--accent:${scene.accent}">
      <div class="copy">
        <div class="eyebrow">${scene.eyebrow}</div>
        <h1>${scene.headline}</h1>
        <p>${scene.subhead}</p>
      </div>
      <div class="device">
        <div class="speaker"></div>
        <img src="data:image/png;base64,${imageData(scene.file)}" alt="">
      </div>
      <div class="privacy"><i></i>${index === 0 ? 'Private by design' : 'Your data stays on device'}</div>
    </section>`).join('');

  return `<!doctype html>
  <html><head><meta charset="utf-8"><style>
    * { box-sizing: border-box; }
    html, body { margin: 0; width: 100%; height: 100%; overflow: hidden; }
    body {
      color: #f7fbff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #07121d;
    }
    .canvas {
      position: relative; width: 886px; height: 1920px; overflow: hidden; isolation: isolate;
      background:
        radial-gradient(circle at 88% 10%, #49d6bd30 0, transparent 30%),
        radial-gradient(circle at 5% 72%, #173f4890 0, transparent 38%),
        linear-gradient(154deg, #122537 0%, #09131f 55%, #07101a 100%);
    }
    .grain {
      position: absolute; inset: 0; z-index: -1; opacity: .11;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.82' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.18'/%3E%3C/svg%3E");
    }
    .brand {
      position: absolute; top: 54px; left: 50%; transform: translateX(-50%); z-index: 20;
      display: flex; align-items: center; gap: 14px; white-space: nowrap;
      font-size: 25px; font-weight: 760;
    }
    .mark {
      width: 48px; height: 48px; border-radius: 15px; display: grid; place-items: center;
      color: #07141e; background: linear-gradient(145deg, #49d6bd, #e4fff9);
      font-weight: 900; font-size: 28px; box-shadow: 0 12px 34px #49d6bd38;
    }
    .scene { position: absolute; inset: 0; opacity: 0; transform: translateY(34px) scale(.985); }
    .copy { position: absolute; top: 162px; left: 50%; width: 790px; transform: translateX(-50%); text-align: center; }
    .eyebrow { color: var(--accent); font-size: 20px; font-weight: 850; letter-spacing: .17em; }
    h1 { margin: 15px 0 13px; font-size: 64px; line-height: 1; letter-spacing: -.055em; font-weight: 790; }
    .copy p { margin: 0 auto; max-width: 760px; color: #c9d4df; font-size: 28px; line-height: 1.3; letter-spacing: -.02em; }
    .device {
      position: absolute; top: 425px; left: 50%; width: 676px; height: 1466px;
      transform: translateX(-50%); padding: 18px; border-radius: 84px; overflow: hidden;
      background: linear-gradient(145deg, #42515d 0%, #111a22 35%, #05090d 72%, #3c4852 100%);
      box-shadow: 0 42px 100px #000a, 0 0 0 2px #ffffff1e, inset 0 0 0 2px #ffffff18;
    }
    .device img { display: block; width: 100%; height: 100%; object-fit: cover; border-radius: 66px; }
    .speaker {
      position: absolute; z-index: 3; top: 29px; left: 50%; transform: translateX(-50%);
      width: 130px; height: 28px; border-radius: 999px; background: #020406;
    }
    .privacy {
      position: absolute; z-index: 5; top: 506px; right: 43px; display: flex; align-items: center; gap: 10px;
      padding: 12px 17px; color: #effffb; background: #07121dec; border: 1px solid color-mix(in srgb, var(--accent) 55%, transparent);
      border-radius: 999px; font-size: 20px; font-weight: 680; box-shadow: 0 14px 34px #0008;
    }
    .privacy i { width: 9px; height: 9px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 0 5px color-mix(in srgb, var(--accent) 15%, transparent); }
    .outro {
      position: absolute; inset: 0; z-index: 15; display: grid; place-items: center; text-align: center;
      opacity: 0; transform: scale(.96);
      background: radial-gradient(circle at 50% 42%, #1d5b5c 0, #0c2130 34%, #07121d 72%);
    }
    .outro .mark { width: 92px; height: 92px; margin: 0 auto 32px; border-radius: 27px; font-size: 53px; }
    .outro h2 { margin: 0; font-size: 74px; letter-spacing: -.055em; }
    .outro p { margin: 18px auto 0; color: #c9d4df; font-size: 31px; line-height: 1.35; }
    .outro .pill { display: inline-flex; margin-top: 34px; padding: 15px 23px; border: 1px solid #49d6bd70; border-radius: 999px; color: #aaf5e5; font-size: 22px; font-weight: 700; }
    .progress { position: absolute; z-index: 30; bottom: 30px; left: 42px; right: 42px; height: 4px; border-radius: 999px; background: #ffffff18; overflow: hidden; }
    .progress span { display: block; height: 100%; width: 0; background: linear-gradient(90deg, #49d6bd, #70c9ff); }
  </style></head><body><main class="canvas">
    <div class="grain"></div>
    <div class="brand"><span class="mark">M</span><span>MenoCompass</span></div>
    ${sceneMarkup}
    <section class="outro"><div><span class="mark">M</span><h2>MenoCompass</h2><p>Private menopause tracking.<br>Clearer patterns. Better appointments.</p><div class="pill">Private by design</div></div></section>
    <div class="progress"><span></span></div>
  </main><script>
    const scenes = ${JSON.stringify(SCENES.map(({ start, end }) => ({ start, end })))};
    const sceneEls = [...document.querySelectorAll('.scene')];
    const outro = document.querySelector('.outro');
    const progress = document.querySelector('.progress span');
    const fade = 0.42;
    const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
    window.renderAt = (seconds) => {
      sceneEls.forEach((el, index) => {
        const scene = scenes[index];
        const fadeIn = clamp((seconds - scene.start) / fade);
        const fadeOut = clamp((scene.end - seconds) / fade);
        const opacity = Math.min(fadeIn, fadeOut);
        el.style.opacity = opacity;
        el.style.transform = 'translateY(' + ((1 - opacity) * 34) + 'px) scale(' + (0.985 + opacity * 0.015) + ')';
        el.style.zIndex = opacity > 0 ? String(2 + index) : '1';
      });
      const outroOpacity = clamp((seconds - 27.05) / 0.5);
      outro.style.opacity = outroOpacity;
      outro.style.transform = 'scale(' + (0.96 + outroOpacity * 0.04) + ')';
      progress.style.width = (clamp(seconds / ${DURATION_SECONDS}) * 100) + '%';
    };
    window.playDemo = (durationSeconds) => new Promise((resolve) => {
      const started = performance.now();
      const tick = (now) => {
        const elapsed = (now - started) / 1000;
        window.renderAt(elapsed);
        if (elapsed < durationSeconds) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });
    window.renderAt(0.01);
  </script></body></html>`;
}

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath, ['-y', ...args], { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with ${code}\n${stderr.slice(-4000)}`));
    });
  });
}

async function renderSourceVideo(browser, html) {
  fs.mkdirSync(TEMP, { recursive: true });
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
    recordVideo: { dir: TEMP, size: { width: WIDTH, height: HEIGHT } },
  });
  const page = await context.newPage();
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const video = page.video();
  await page.evaluate((seconds) => window.playDemo(seconds), CAPTURE_SECONDS);
  await context.close();
  return video.path();
}

async function renderPoster(browser, html) {
  const context = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => window.renderAt(5));
  await page.screenshot({ path: path.join(OUTPUT, 'menocompass-preview-poster.png') });
  await context.close();
}

(async () => {
  fs.mkdirSync(OUTPUT, { recursive: true });
  fs.rmSync(TEMP, { recursive: true, force: true });
  const browser = await chromium.launch({ headless: true });
  const html = demoHtml();
  try {
    await renderPoster(browser, html);
    const source = await renderSourceVideo(browser, html);
    const appPreview = path.join(OUTPUT, 'menocompass-app-preview-iphone.mp4');
    const socialDemo = path.join(OUTPUT, 'menocompass-product-demo-vertical.mp4');
    const contactSheet = path.join(OUTPUT, 'menocompass-demo-contact-sheet.jpg');

    await runFfmpeg([
      '-sseof', `-${DURATION_SECONDS}`, '-i', source,
      '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000',
      '-t', String(DURATION_SECONDS), '-r', '30',
      '-vf', `fps=30,scale=${WIDTH}:${HEIGHT}:flags=lanczos,format=yuv420p`,
      '-c:v', 'libx264', '-profile:v', 'high', '-level:v', '4.0',
      '-b:v', '11M', '-minrate', '11M', '-maxrate', '11M', '-bufsize', '22M',
      '-x264-params', 'nal-hrd=cbr:force-cfr=1:filler=1',
      '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-ac', '2',
      '-shortest', '-movflags', '+faststart', appPreview,
    ]);

    await runFfmpeg([
      '-i', appPreview,
      '-vf', 'pad=1080:1920:(ow-iw)/2:0:color=0x07121d,format=yuv420p',
      '-c:v', 'libx264', '-profile:v', 'high', '-crf', '18', '-preset', 'medium',
      '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', socialDemo,
    ]);

    await runFfmpeg([
      '-i', appPreview,
      '-vf', 'fps=1/5,scale=443:960:flags=lanczos,tile=3x2',
      '-frames:v', '1', '-update', '1', contactSheet,
    ]);
  } finally {
    await browser.close();
    fs.rmSync(TEMP, { recursive: true, force: true });
  }
  console.log('Generated product demo assets in mobile/store-assets/product-demo.');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
