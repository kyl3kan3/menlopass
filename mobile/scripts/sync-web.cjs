const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const htmlPath = path.join(root, 'dist', 'index.html');
const fontPath = path.join(root, 'assets', 'fonts', 'bricolage-grotesque-latin.woff2');
const outputPath = path.join(root, 'mobile', 'assets', 'menlopass.html');

if (!fs.existsSync(htmlPath)) throw new Error('Run the root web build before syncing the Expo asset.');
const font = fs.readFileSync(fontPath).toString('base64');
const html = fs.readFileSync(htmlPath, 'utf8')
  .replace(/url\(["']?assets\/fonts\/bricolage-grotesque-latin\.woff2["']?\)/g, `url("data:font/woff2;base64,${font}")`)
  .replace(/if\('serviceWorker' in navigator[\s\S]*?\n  }\n}/, '/* Native bundle: service workers are not used inside the WebView. */\n}');
fs.writeFileSync(outputPath, html, 'utf8');
console.log(`Synced ${path.relative(root, outputPath)}`);
