const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

let browser, server, origin;
before(async () => {
  const root = path.join(__dirname, 'dist');
  server = http.createServer((request, response) => {
    const pathname = new URL(request.url, 'http://localhost').pathname.replace(/^\/nested\//, '/');
    const file = path.resolve(root, pathname === '/' ? 'index.html' : pathname.slice(1));
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      response.writeHead(404); response.end('Not found'); return;
    }
    response.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'application/javascript', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2', '.png': 'image/png' })[path.extname(file)] || 'application/octet-stream');
    response.end(fs.readFileSync(file));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}) });
});
after(async () => { await browser?.close(); await new Promise(resolve => server ? server.close(resolve) : resolve()); });

for (const prefix of ['/', '/nested/']) {
  test(`public pages cannot replace the offline tracker at ${prefix}`, async () => {
    const context = await browser.newContext();
    try {
      const page = await context.newPage();
      await page.goto(origin + prefix);
      await page.waitForFunction(() => !!navigator.serviceWorker.controller);
      for (const [filename, title] of [
        ['privacy.html', 'peri Privacy Policy'], ['support.html', 'peri Support'],
        ['terms.html', 'peri Terms of Use'], ['get-app.html', 'peri — Private Menopause Tracker for iPhone'],
      ]) {
        await context.setOffline(false);
        await page.goto(origin + prefix + filename);
        assert.equal(await page.title(), title);
        await context.setOffline(true);
        await page.reload();
        assert.equal(await page.title(), title, 'public pages have their own offline copy');
        for (const route of ['', 'index.html?source=offline-test']) {
          await page.goto(origin + prefix + route);
          assert.equal(await page.locator('#app').count(), 1, `${filename} must not replace ${route || '/'}`);
          assert.equal(await page.title(), 'peri — menopause tracker & guide');
        }
      }
      const missing = await page.goto(origin + prefix + 'missing.html');
      assert.equal(missing.status(), 503);
      assert.equal(await page.locator('#app').count(), 0, 'unknown pages must not masquerade as the tracker');
      await context.setOffline(false);
      const notFound = await page.goto(origin + prefix + 'missing.html');
      assert.equal(notFound.status(), 404, 'online errors must preserve their actual status');
    } finally { await context.close(); }
  });
}
