#!/usr/bin/env node
'use strict';

// Editable marketing composition. App pixels always come from genuine native
// captures. AI artwork is used only for the abstract, text-free background.
// Run with sharp available through NODE_PATH. --only today supports layout QA.
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('sharp');
const root = path.join(__dirname, 'bold-modern');
const raw = path.join(__dirname, 'native-capture', 'raw');
const devices = {
  iphone: { width: 1320, height: 2868, directory: 'iphone-6.9', name: 'iPhone · 6.9-inch' },
  ipad: { width: 2064, height: 2752, directory: 'ipad-13', name: 'iPad · 13-inch' },
};
const ink = '#092f29';
const lime = '#d6f27b';
const cream = '#fffdf3';
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const svg = (w, h, body) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`);
const txt = (x, y, value, size, color, extra = '') => `<text x="${x}" y="${y}" font-family="Arial" font-size="${size}" fill="${color}" ${extra}>${esc(value)}</text>`;
const rounded = (w, h, r, fill = '#fff') => svg(w, h, `<rect width="${w}" height="${h}" rx="${r}" fill="${fill}"/>`);

async function fit(lines, size, maxWidth, attrs = '') {
  for (let attempt = 0; attempt < 5; attempt++) {
    const widths = await Promise.all(lines.map(async line => {
      const { info } = await sharp(svg(8192, size * 3, txt(20, size * 2, line, size, '#fff', attrs))).trim().png().toBuffer({ resolveWithObject: true });
      return info.width;
    }));
    const widest = Math.max(...widths);
    if (widest <= maxWidth) return size;
    size = Math.floor(size * (maxWidth - 5) / widest);
  }
  throw new Error(`Cannot fit headline: ${lines}`);
}

async function deviceLayer(source, width, angle, tablet) {
  const meta = await sharp(source).metadata();
  const height = Math.round(width * meta.height / meta.width);
  const bezel = tablet ? 24 : 20;
  const radius = tablet ? 60 : 116;
  const padding = 66;
  const outerWidth = width + 2 * bezel;
  const outerHeight = height + 2 * bezel;
  const w = outerWidth + 2 * padding;
  const h = outerHeight + 2 * padding;
  const frame = svg(w, h, `<defs>
    <linearGradient id="metal" x1="0" x2="1" y1="0" y2=".45"><stop stop-color="#c3c8c3"/><stop offset=".09" stop-color="#303733"/><stop offset=".46" stop-color="#111815"/><stop offset=".88" stop-color="#8c938d"/><stop offset="1" stop-color="#333b36"/></linearGradient>
    </defs>
    <rect x="${padding}" y="${padding}" width="${outerWidth}" height="${outerHeight}" rx="${radius + bezel}" fill="url(#metal)" stroke="#929a94" stroke-width="3"/>
    <rect x="${padding + 7}" y="${padding + 7}" width="${outerWidth - 14}" height="${outerHeight - 14}" rx="${radius + bezel - 5}" fill="#0a100d" stroke="#3d4540" stroke-width="2"/>
    ${tablet ? '' : `<rect x="${padding - 5}" y="${padding + 275}" width="7" height="78" rx="3" fill="#7b827d"/><rect x="${padding - 5}" y="${padding + 390}" width="7" height="128" rx="3" fill="#7b827d"/>`}`);
  const screen = await sharp(source).resize(width, height).ensureAlpha().composite([{ input: rounded(width, height, radius), blend: 'dest-in' }]).png().toBuffer();
  const body = await sharp(frame).composite([{ input: screen, left: padding + bezel, top: padding + bezel }]).png().toBuffer();
  const shadow = await sharp(svg(w, h, `<rect x="${padding}" y="${padding + 22}" width="${outerWidth}" height="${outerHeight}" rx="${radius + bezel}" fill="#000" opacity=".4"/>`)).blur(25).png().toBuffer();
  const framed = await sharp(shadow).composite([{ input: body }]).png().toBuffer();
  return sharp(framed).rotate(angle, { background: '#00000000' }).png().toBuffer();
}

// Sharp requires every composited layer to fit the target. Off-canvas device
// placements are clipped as whole objects, without altering the app's layout.
async function place(layers, input, left, top, width, height) {
  left = Math.round(left); top = Math.round(top);
  const meta = await sharp(input).metadata();
  const l = Math.max(0, left), t = Math.max(0, top);
  const r = Math.min(width, left + meta.width), b = Math.min(height, top + meta.height);
  if (r <= l || b <= t) return;
  if (l !== left || t !== top || r !== left + meta.width || b !== top + meta.height) {
    input = await sharp(input).extract({ left: l - left, top: t - top, width: r - l, height: b - t }).png().toBuffer();
  }
  layers.push({ input, left: l, top: t });
}

async function detailLayer(source, rect, width) {
  const height = Math.round(width * rect.height / rect.width);
  const pad = 40, border = 10;
  const w = width + 2 * pad, h = height + 2 * pad;
  const content = await sharp(source).extract(rect).resize(width, height).ensureAlpha().composite([{ input: rounded(width, height, 25), blend: 'dest-in' }]).png().toBuffer();
  const shadow = await sharp(svg(w, h, `<rect x="${pad}" y="${pad + 13}" width="${width}" height="${height}" rx="32" fill="#000" opacity=".38"/>`)).blur(18).png().toBuffer();
  return sharp(shadow).composite([
    { input: svg(w, h, `<rect x="${pad - border}" y="${pad - border}" width="${width + border * 2}" height="${height + border * 2}" rx="35" fill="${cream}"/>`) },
    { input: content, left: pad, top: pad },
  ]).png().toBuffer();
}

const phoneLayout = {
  today: { width: 1110, x: 22, y: 790, angle: 5 },
  journey: { width: 940, x: 78, y: 810, angle: -4 },
  care: { width: 1080, x: 20, y: 825, angle: 3 },
  report: { width: 1100, x: 8, y: 810, angle: -3 },
  setup: { width: 1030, x: 68, y: 815, angle: 3 },
  guide: { width: 850, x: 170, y: 805, angle: -2 },
};
const tabletDetails = {
  today: { rect: { left: 515, top: 700, width: 790, height: 640 }, width: 1340, x: 505, y: 1500 },
  journey: { rect: { left: 560, top: 1640, width: 815, height: 280 }, width: 1660, x: 90, y: 1990 },
  care: { rect: { left: 1260, top: 2000, width: 770, height: 565 }, width: 1460, x: 375, y: 1460 },
  report: { rect: { left: 240, top: 944, width: 1580, height: 1490 }, width: 1640, x: 155, y: 940 },
  setup: { rect: { left: 430, top: 562, width: 1205, height: 498 }, width: 1680, x: 135, y: 1650 },
  guide: { rect: { left: 312, top: 1535, width: 1440, height: 875 }, width: 1700, x: 115, y: 1510 },
};

async function compose(key, screen, copy) {
  const device = devices[key], tablet = key === 'ipad';
  const { width, height } = device;
  const sourcePath = path.join(raw, key, `${screen.id}.png`);
  const source = await fs.readFile(sourcePath);
  const dark = screen.theme === 'forest';
  const main = dark ? cream : ink;
  const accent = dark ? lime : ink;
  const x = tablet ? 120 : 76;
  const maxWidth = width - 2 * x;
  const headAttrs = 'font-weight="700" letter-spacing="-7"';
  const headlineSize = await fit(screen.headline, tablet ? 242 : 184, maxWidth, headAttrs);
  const descriptionSize = await fit([screen.description], tablet ? 53 : 43, maxWidth);
  const layers = [];
  const bgFile = path.join(root, 'source-art', `${screen.theme}.png`);
  const bg = await sharp(bgFile).resize(width, height, { fit: 'cover' }).png().toBuffer();
  // Type stays crisp and editable, separate from the generated background art.
  layers.push({ input: svg(width, height, `
    <text x="${x}" y="${tablet ? 165 : 173}" font-family="Georgia" font-size="${tablet ? 129 : 123}" fill="${main}" letter-spacing="-7">peri</text>
    ${txt(x + 4, tablet ? 266 : 267, screen.label, tablet ? 30 : 26, main, 'font-weight="700" letter-spacing="5"')}
    ${screen.headline.map((line, i) => txt(x - 4, (tablet ? 493 : 470) + i * (tablet ? 237 : 180), line, headlineSize, i ? accent : main, headAttrs)).join('')}
    ${txt(x + 2, tablet ? 865 : 750, screen.description, descriptionSize, main)}
  `) });
  const layout = tablet ? { width: 1600, x: 0, y: 865, angle: screen.id === 'setup' ? 3 : -3 } : phoneLayout[screen.id];
  let detail = null;
  if (tablet && screen.id === 'report') {
    // The report is an actual contiguous document extract, shown as a paper
    // detail instead of manufacturing a tablet viewport that does not exist.
    detail = tabletDetails.report;
    await place(layers, await detailLayer(source, detail.rect, detail.width), detail.x, detail.y, width, height);
  } else {
    const phone = await deviceLayer(source, layout.width, layout.angle, tablet);
    await place(layers, phone, layout.x, layout.y, width, height);
    if (tablet) {
      detail = tabletDetails[screen.id];
      await place(layers, await detailLayer(source, detail.rect, detail.width), detail.x, detail.y, width, height);
    }
  }
  // High-contrast subscription disclosure always rests on an opaque pill and
  // remains readable regardless of whether a device bleeds off the canvas.
  layers.push({ input: svg(width, height, `<rect x="${x}" y="${height - 100}" width="${tablet ? 630 : 498}" height="65" rx="32" fill="${ink}"/>
    ${txt(x + 24, height - 56, copy.subscriptionNote, tablet ? 40 : 32, cream)}
  `) });
  const result = await sharp(bg).composite(layers).flatten({ background: ink }).removeAlpha().toColourspace('srgb').png({ compressionLevel: 9 }).toBuffer();
  const meta = await sharp(result).metadata();
  if (meta.width !== width || meta.height !== height || meta.channels !== 3 || meta.hasAlpha || meta.depth !== 'uchar') throw new Error(`Invalid output: ${key}/${screen.id}`);
  return { result, source: { file: `../native-capture/raw/${key}/${screen.id}.png`, sha256: sha(source) }, layout: tablet && screen.id === 'report' ? null : layout, detail, headlineSize, descriptionSize };
}

async function previews(manifest) {
  const thumbWidth = 264, gap = 18, margin = 36;
  const width = margin * 2 + manifest.screens.length * (thumbWidth + gap) - gap;
  let top = 0;
  const layers = [];
  for (const [key, device] of Object.entries(devices)) {
    const thumbHeight = Math.round(thumbWidth * device.height / device.width);
    layers.push({ input: svg(width, 65, txt(margin, 44, device.name, 26, cream)), left: 0, top });
    for (const [i, item] of manifest.artwork.filter(item => item.device === key).entries()) {
      const thumb = await sharp(path.join(root, item.output)).resize(thumbWidth).png().toBuffer();
      layers.push({ input: thumb, left: margin + i * (thumbWidth + gap), top: top + 65 });
    }
    top += thumbHeight + 95;
  }
  await sharp({ create: { width, height: top, channels: 3, background: ink } }).composite(layers).png().toFile(path.join(root, 'contact-sheet.png'));
  const heroLayers = await Promise.all(manifest.artwork.filter(item => item.device === 'iphone').slice(0, 3).map(async (item, i) => ({ input: await sharp(path.join(root, item.output)).resize(440).png().toBuffer(), left: i * 458, top: 0 })));
  await sharp({ create: { width: 1356, height: 956, channels: 3, background: ink } }).composite(heroLayers).png().toFile(path.join(root, 'first-three.png'));
  const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>peri — Bold modern App Store set</title><style>*{box-sizing:border-box}body{margin:0;background:${ink};color:${cream};font:16px/1.5 Arial,sans-serif;padding:36px}header,section,footer{max-width:1800px;margin:0 auto 56px}h1{font-size:clamp(40px,6vw,88px);line-height:1;letter-spacing:-3px;margin:24px 0}h1 span,a{color:${lime}}h2{font-size:24px}p{max-width:920px}nav{display:flex;gap:24px;flex-wrap:wrap}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:28px}figure{margin:0}img{width:100%;display:block}figcaption{font-size:13px;margin-top:10px;opacity:.75}.meta{color:${lime}}@media(max-width:800px){body{padding:20px}.grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}}@media(max-width:480px){.grid{grid-template-columns:1fr}}</style><header><div class="meta">peri · 1.2.2 / build 40</div><h1>Meet your<br><span>next chapter.</span></h1><p>Bold typography. Forest and lime. Genuine current-build app captures, with dedicated iPhone and iPad compositions.</p><nav><a href="#iphone">iPhone</a><a href="#ipad">iPad</a><a href="contact-sheet.png">All 12 images</a><a href="manifest.json">Capture provenance</a></nav></header>${Object.entries(devices).map(([key,d]) => `<section id="${key}"><h2>${d.name} · ${d.width} × ${d.height}</h2><div class="grid">${manifest.artwork.filter(item => item.device === key).map(item => `<figure><a href="${item.output}"><img src="${item.output}" alt="${esc(item.headline.join(' '))}" loading="lazy"></a><figcaption>${item.output}</figcaption></figure>`).join('')}</div></section>`).join('')}<footer>Prepared for review. Not uploaded to App Store Connect. Fictional demonstration records. Device and detail crops retain the original app layout; generated artwork is limited to the abstract backgrounds.</footer></html>`;
  await fs.writeFile(path.join(root, 'preview.html'), html);
}

async function main() {
  const copyBytes = await fs.readFile(path.join(root, 'creative-copy.json'));
  const copy = JSON.parse(copyBytes);
  const onlyIndex = process.argv.indexOf('--only');
  const selected = onlyIndex < 0 ? copy.screens : copy.screens.filter(s => s.id === process.argv[onlyIndex + 1]);
  if (!selected.length) throw new Error('No selected screens');
  const provenance = JSON.parse(await fs.readFile(path.join(__dirname, 'native-capture', 'capture-provenance.json')));
  const manifest = {
    schemaVersion: 1, generatedAt: new Date().toISOString(), compositor: 'compose-bold-store.cjs',
    composition: 'Generated abstract backgrounds with editable SVG typography and native capture pixels. Device views are uniformly scaled, rotated and cropped off-canvas. iPad detail panels use contiguous, recorded source rectangles. No reconstructed or AI-generated app UI.',
    color: '8-bit sRGB, three channels, no alpha', captureProvenance: provenance,
    copySha256: sha(copyBytes), screens: selected.map(s => s.id), artwork: [],
    storeUploadStatus: 'Not uploaded; existing review submission unchanged.',
    backgroundArt: await Promise.all(['forest', 'lime'].map(async theme => ({ file: `source-art/${theme}.png`, sha256: sha(await fs.readFile(path.join(root, 'source-art', `${theme}.png`))) }))),
  };
  for (const [key, device] of Object.entries(devices)) {
    await fs.mkdir(path.join(root, device.directory), { recursive: true });
    for (const screen of selected) {
      const index = copy.screens.indexOf(screen);
      const { result, ...record } = await compose(key, screen, copy);
      const output = `${device.directory}/${String(index + 1).padStart(2, '0')}-${screen.id}.png`;
      await fs.writeFile(path.join(root, output), result);
      manifest.artwork.push({ device: key, screen: screen.id, headline: screen.headline, output, width: device.width, height: device.height, sha256: sha(result), ...record });
      console.log(`${output}: ${device.width}×${device.height}, RGB, ${Math.round(result.length / 1024)} KB`);
    }
  }
  if (onlyIndex < 0) {
    await fs.writeFile(path.join(root, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
    await previews(manifest);
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
