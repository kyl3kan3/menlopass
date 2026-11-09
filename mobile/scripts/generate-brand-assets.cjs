/* Package the peri wordmark into every icon the web app and the iOS/Android
   shells need. The masters in assets/brand/ are rendered from the real
   Fraunces (see assets/brand/README.md); this script only resizes and
   composes them, so the mark is identical everywhere.

   Usage: node mobile/scripts/generate-brand-assets.cjs */
const fs = require('fs');
const path = require('path');
const Jimp = require('jimp-compact');
const { generateImageAsync } = require('@expo/image-utils');

const root = path.resolve(__dirname, '../..');
const brand = name => path.join(root, 'assets/brand', name);
const PAPER = '#fbfbf9';

async function resized(src, size, { transparent = false, background = PAPER } = {}) {
  const { source } = await generateImageAsync({ projectRoot: root }, {
    src, width: size, height: size, resizeMode: 'contain',
    removeTransparency: !transparent,
    backgroundColor: transparent ? 'transparent' : background,
  });
  if (transparent) return source;
  // App Store Connect rejects a marketing icon with an alpha channel; flatten.
  const flat = await Jimp.read(source);
  flat.rgba(false).background(Jimp.cssColorToHex(background));
  return flat.getBufferAsync(Jimp.MIME_PNG);
}

async function write(file, png) {
  const target = path.join(root, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, png);
  console.log('wrote', file);
}

/* A transparent mark set into the middle of a larger transparent canvas, for
   Android adaptive icons (the safe zone is the inner 66 percent) and splash. */
async function inset(src, canvas, scale) {
  const mark = await Jimp.read(src);
  const target = Math.round(canvas * scale);
  mark.contain(target, target);
  const out = await new Jimp(canvas, canvas, 0x00000000);
  out.composite(mark, Math.round((canvas - target) / 2), Math.round((canvas - target) / 2));
  return out.getBufferAsync(Jimp.MIME_PNG);
}

(async () => {
  const light = brand('peri-icon-master.png');
  const dark = brand('peri-icon-dark.png');
  const tinted = brand('peri-icon-tinted.png');
  const markInk = brand('peri-mark-transparent.png');
  const markPaper = brand('peri-mark-paper.png');
  const markMono = brand('peri-mark-mono.png');

  // Web app (PWA manifest, favicon, home-screen icon).
  for (const [file, size] of Object.entries({ 'icon-192.png': 192, 'icon-512.png': 512, 'maskable-512.png': 512, 'favicon-64.png': 64, 'apple-touch-icon.png': 180 })) {
    await write(file, await resized(light, size));
  }
  // iOS: light, dark (transparent, the system supplies the dark backdrop) and
  // tinted (opaque grayscale; the system colours it by luminance).
  await write('mobile/assets/icon.png', await resized(light, 1024));
  await write('mobile/assets/icon-dark.png', await inset(markPaper, 1024, 1));
  await write('mobile/assets/icon-tinted.png', await resized(tinted, 1024, { background: '#000000' }));
  await write('mobile/assets/favicon.png', await resized(light, 64));
  // Android adaptive icon: paper background, the mark inside the safe zone,
  // and a white monochrome layer for themed icons.
  await write('mobile/assets/android-icon-background.png', await (await new Jimp(1024, 1024, PAPER)).getBufferAsync(Jimp.MIME_PNG));
  await write('mobile/assets/adaptive-icon.png', await inset(markInk, 1024, 0.62));
  await write('mobile/assets/android-icon-foreground.png', await inset(markInk, 1024, 0.62));
  await write('mobile/assets/android-icon-monochrome.png', await inset(markMono, 1024, 0.62));
  // Splash: the wordmark alone; the background colour comes from app.json.
  await write('mobile/assets/splash-icon.png', await inset(markInk, 1024, 0.9));
  await write('mobile/assets/splash-icon-dark.png', await inset(markPaper, 1024, 0.9));
  console.log('Packaged the peri wordmark for the web app, iOS and Android.');
})().catch(error => { console.error(error); process.exitCode = 1; });
