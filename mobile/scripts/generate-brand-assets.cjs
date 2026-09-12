const fs = require('fs');
const path = require('path');
const { generateImageAsync } = require('@expo/image-utils');

const root = path.resolve(__dirname, '../..');
const source = path.join(root, 'assets/brand/peri-icon-master.png');
const foreground = path.join(root, 'assets/brand/peri-mark-transparent.png');

async function writeAsset(file, size, transparent = false) {
  const { source: png } = await generateImageAsync({ projectRoot: root }, {
    src: transparent ? foreground : source,
    width: size, height: size, resizeMode: 'contain',
    removeTransparency: !transparent,
    backgroundColor: transparent ? 'transparent' : '#244b43',
  });
  fs.writeFileSync(path.join(root, file), png);
}

(async () => {
  for (const [file, size] of Object.entries({
    'icon-192.png': 192, 'icon-512.png': 512, 'maskable-512.png': 512,
    'favicon-64.png': 64, 'apple-touch-icon.png': 180,
    'mobile/assets/icon.png': 1024, 'mobile/assets/favicon.png': 64,
    'mobile/assets/android-icon-background.png': 1024,
  })) await writeAsset(file, size);
  for (const file of ['adaptive-icon.png', 'android-icon-foreground.png', 'android-icon-monochrome.png', 'splash-icon.png']) {
    await writeAsset(`mobile/assets/${file}`, 1024, file === 'android-icon-monochrome.png');
  }
  console.log('Packaged peri app, web, splash, and adaptive icons from the shared master assets.');
})().catch(error => { console.error(error); process.exitCode = 1; });
