const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const htmlPath = path.join(root, 'dist', 'index.html');
const fontDir = path.join(root, 'assets', 'fonts');
const outputPath = path.join(root, 'mobile', 'assets', 'menlopass.html');

if (!fs.existsSync(htmlPath)) throw new Error('Run the root web build before syncing the Expo asset.');
const source = fs.readFileSync(htmlPath, 'utf8');

// Inline every local webfont the build references so the WebView bundle has no
// relative URLs to resolve (it is loaded from a file:// asset with no base URL).
const fontPattern = /url\(["']?assets\/fonts\/([a-z0-9-]+\.woff2)["']?\)/g;
const referenced = new Set();
const withFonts = source.replace(fontPattern, (match, file) => {
  referenced.add(file);
  const font = fs.readFileSync(path.join(fontDir, file)).toString('base64');
  return `url("data:font/woff2;base64,${font}")`;
});
if (!referenced.size) throw new Error('No local font references were found in the web build.');
if (/assets\/fonts\//.test(withFonts)) throw new Error('A local font reference survived inlining.');

const html = withFonts.replace(
  /if\('serviceWorker' in navigator[\s\S]*?\n  }\n}/,
  '/* Native bundle: service workers are not used inside the WebView. */\n}'
);
if (html === withFonts || html.includes('navigator.serviceWorker.register')) {
  throw new Error('Service-worker registration was not removed from the native WebView bundle.');
}
fs.writeFileSync(outputPath, html, 'utf8');
console.log(`Synced ${path.relative(root, outputPath)} (${referenced.size} fonts inlined)`);
