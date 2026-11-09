/* Render the peri wordmark masters (assets/brand/*.png) with the real Fraunces through Chrome.
   Usage: PLAYWRIGHT_CHANNEL=chrome node tools/render-brand-masters.cjs */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const fontItalic = fs.readFileSync(path.join(ROOT, 'assets/fonts/fraunces-latin-opsz-italic.woff2')).toString('base64');
function page(bg, ink, dot, transparent) {
  return `<!doctype html><html><head><style>
  @font-face{font-family:F;src:url(data:font/woff2;base64,${fontItalic}) format('woff2');font-style:italic;font-weight:100 900;font-display:block}
  html,body{margin:0;width:1024px;height:1024px;background:${transparent ? 'transparent' : bg}}
  .m{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}
  .w{font-family:F;font-style:italic;font-weight:560;font-size:430px;line-height:1;letter-spacing:-0.035em;color:${ink};font-variation-settings:"opsz" 144,"SOFT" 30,"WONK" 1;transform:translate(-22px,-46px);white-space:nowrap}
  .w i{font-style:italic;color:${dot}}
  </style></head><body><div class="m"><div class="w">peri<i>.</i></div></div></body></html>`;
}
(async () => {
  const browser = await chromium.launch(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {});
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 1024 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  const out = path.join(ROOT, 'assets/brand');
  const shots = [
    ['peri-icon-master.png', page('#fbfbf9', '#0c0c0d', '#d13a16', false), false],
    ['peri-icon-dark.png', page('#000000', '#f3f2ee', '#d13a16', false), false],
    ['peri-icon-tinted.png', page('#000000', '#ffffff', '#ffffff', false), false],
    ['peri-mark-transparent.png', page('#fbfbf9', '#0c0c0d', '#d13a16', true), true],
    ['peri-mark-paper.png', page('#000000', '#f3f2ee', '#d13a16', true), true],
    ['peri-mark-mono.png', page('#000000', '#ffffff', '#ffffff', true), true],
  ];
  for (const [name, html, transparent] of shots) {
    await p.setContent(html, { waitUntil: 'load' });
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: path.join(out, name), omitBackground: transparent, type: 'png' });
    console.log('wrote', name);
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
