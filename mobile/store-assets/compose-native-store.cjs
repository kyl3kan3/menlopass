#!/usr/bin/env node
'use strict';

/**
 * Compose App Store artwork from actual native captures, without reconstructing
 * or cropping the app UI. Requires sharp (available in the Codex Node runtime).
 *
 * NODE_PATH=<bundled node_modules> node mobile/store-assets/compose-native-store.cjs
 *   --raw mobile/store-assets/native-capture/raw
 *   --output mobile/store-assets/current-build
 *   --provenance path/to/capture-manifest.json
 *
 * Required input: {iphone,ipad}/{today,journey,report,care,setup,guide}.png.
 * privacy.png is included only when supplied for both devices.
 * --devices iphone or --devices ipad supports independent capture QA.
 * --copy path/to/creative-copy.json allows reviewable copy changes.
 * The compositor does not infer a build number from filenames. Supply a capture
 * manifest with --provenance to record the source build and capture method.
 */

const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
let sharp;
try { sharp = require('sharp'); }
catch {
  console.error('The compositor requires sharp. Set NODE_PATH to the bundled Codex Node packages, or install sharp in your tooling environment.');
  process.exit(1);
}

const DEVICES = {
  iphone: { width: 1320, height: 2868, directory: 'iphone-6.9', name: 'iPhone · 6.9-inch' },
  ipad: { width: 2064, height: 2752, directory: 'ipad-13', name: 'iPad · 13-inch' },
};
const PALETTE = {
  cream: '#f7f5ef', forest: '#214b43', ink: '#233f33', muted: '#53675b',
  sage: '#e7edde', line: '#ced8c3', frame: '#244a42', white: '#fffefa',
};

const escape = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
}[character]));
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const relative = (base, file) => path.relative(base, file).split(path.sep).join('/');

function parseArgs(argv) {
  const args = {
    raw: path.join(__dirname, 'native-capture', 'raw'),
    output: path.join(__dirname, 'current-build'),
    copy: path.join(__dirname, 'native-capture', 'creative-copy.json'),
    devices: ['iphone', 'ipad'],
  };
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (flag === '--help' || flag === '-h') {
      console.log('Usage: node compose-native-store.cjs [--raw DIR] [--output DIR] [--copy FILE] [--provenance FILE] [--devices iphone,ipad]');
      process.exit(0);
    }
    if (!['--raw', '--output', '--copy', '--provenance', '--devices'].includes(flag)) throw new Error(`Unknown option: ${flag}`);
    const value = argv[++index];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${flag}`);
    args[flag.slice(2)] = flag === '--devices' ? value.split(',') : path.resolve(value);
  }
  if (!args.devices.length || new Set(args.devices).size !== args.devices.length || args.devices.some(device => !DEVICES[device])) {
    throw new Error('--devices must contain iphone, ipad, or iphone,ipad.');
  }
  return args;
}

function svg(width, height, content) {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${content}</svg>`);
}

function text(x, y, value, size, options = {}) {
  const { family = 'Arial', color = PALETTE.ink, anchor = 'start', spacing = 0, weight = 'normal' } = options;
  return `<text x="${x}" y="${y}" font-family="${family}" font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}" letter-spacing="${spacing}">${escape(value)}</text>`;
}

async function fitFont(lines, size, maxWidth, options) {
  // Measure the actual SVG renderer's glyphs, including the installed font.
  // A changed headline can shrink to fit without silently leaving the canvas.
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const measurements = await Promise.all(lines.map(async line => {
      const rendered = await sharp(svg(8192, Math.ceil(size * 4), text(16, size * 2, line, size, options))).trim().png().toBuffer({ resolveWithObject: true });
      return rendered.info.width;
    }));
    const measuredWidth = Math.max(...measurements);
    if (measuredWidth <= maxWidth - 6) return size;
    size = Math.floor(size * (maxWidth - 12) / measuredWidth);
  }
  throw new Error(`Unable to fit creative copy: ${lines.join(' / ')}`);
}

function layout(device, source) {
  const { width, height } = device;
  const tablet = width > 1500;
  const margin = tablet ? 126 : 94;
  const top = tablet ? 630 : 625;
  const bottom = height - (tablet ? 140 : 146);
  const availableWidth = width - (tablet ? 230 : 170);
  const availableHeight = bottom - top;
  const scale = Math.min(availableWidth / source.width, availableHeight / source.height);
  const imageWidth = Math.round(source.width * scale);
  const imageHeight = Math.round(source.height * scale);
  return {
    tablet, margin, imageWidth, imageHeight,
    imageX: Math.round((width - imageWidth) / 2),
    imageY: Math.round(top + (availableHeight - imageHeight) / 2),
    frame: tablet ? 14 : 12,
    radius: tablet ? 39 : 33,
  };
}

function background(device, frame, screen, index, copy) {
  const { width, height } = device;
  const { tablet, margin, imageX, imageY, imageWidth, imageHeight, radius } = frame;
  const headingSize = frame.headingFont;
  const headingTop = tablet ? 300 : 310;
  const lineHeight = tablet ? 140 : 126;
  const descriptionY = tablet ? 506 : 516;
  const brandSize = tablet ? 88 : 73;
  const labelSize = frame.labelFont;
  const outline = frame.frame;
  const padding = tablet ? 68 : 56;
  const label = `${String(index + 1).padStart(2, '0')}  /  ${screen.label}`;
  const panelX = Math.max(28, imageX - padding);
  const panelY = imageY - padding;
  const panelWidth = Math.min(width - 56, imageWidth + padding * 2);
  return svg(width, height, `
    <rect width="${width}" height="${height}" fill="${PALETTE.cream}"/>
    ${text(margin, tablet ? 146 : 143, label, labelSize, { color: PALETTE.muted, spacing: 2.4 })}
    ${text(width - margin, tablet ? 156 : 153, copy.brand, brandSize, { family: 'Georgia', anchor: 'end', color: PALETTE.forest, spacing: -3 })}
    <line x1="${margin}" y1="${tablet ? 190 : 184}" x2="${width - margin}" y2="${tablet ? 190 : 184}" stroke="${PALETTE.line}" stroke-width="2"/>
    ${screen.headline.map((line, lineIndex) => text(margin, headingTop + lineIndex * lineHeight, line, headingSize, { family: 'Georgia', spacing: -3, color: lineIndex ? PALETTE.forest : PALETTE.ink })).join('')}
    ${text(margin + 2, descriptionY, screen.description, frame.descriptionFont, { color: PALETTE.muted })}
    <rect x="${panelX}" y="${panelY}" width="${panelWidth}" height="${imageHeight + padding * 2}" rx="${radius + 44}" fill="${PALETTE.sage}"/>
    <rect x="${imageX - outline - 10}" y="${imageY - outline + 22}" width="${imageWidth + outline * 2 + 20}" height="${imageHeight + outline * 2 + 10}" rx="${radius + 12}" fill="${PALETTE.forest}" opacity="0.06"/>
    <rect x="${imageX - outline}" y="${imageY - outline}" width="${imageWidth + outline * 2}" height="${imageHeight + outline * 2}" rx="${radius}" fill="${PALETTE.frame}"/>
    ${text(width / 2, height - 47, copy.subscriptionNote, tablet ? 28 : 26, { color: PALETTE.muted, anchor: 'middle', spacing: 0.2 })}
  `);
}

async function exists(file) {
  try { await fs.access(file); return true; } catch { return false; }
}

async function inspectInputs(args, copy) {
  if (!copy.brand || !copy.subscriptionNote || !Array.isArray(copy.screens) || !copy.screens.length) throw new Error('Copy must include brand, subscriptionNote and screens.');
  const ids = new Set();
  const screens = [];
  for (const screen of copy.screens) {
    if (!/^[a-z][a-z0-9-]*$/.test(screen.id) || ids.has(screen.id)) throw new Error(`Invalid or duplicate screen id: ${screen.id}`);
    ids.add(screen.id);
    if (!Array.isArray(screen.headline) || screen.headline.length !== 2 || !screen.description || !screen.label) throw new Error(`Screen ${screen.id} needs a two-line headline, description and label.`);
    const availability = await Promise.all(args.devices.map(device => exists(path.join(args.raw, device, `${screen.id}.png`))));
    if (screen.optional && availability.every(present => !present)) continue;
    if (availability.some(present => !present)) {
      throw new Error(`Missing ${screen.id}.png for ${args.devices.filter((_, index) => !availability[index]).join(', ')}. Supply all selected devices or remove optional partial captures.`);
    }
    screens.push(screen);
  }
  const inputs = [];
  for (const deviceKey of args.devices) {
    for (const [index, screen] of screens.entries()) {
      const file = path.join(args.raw, deviceKey, `${screen.id}.png`);
      const bytes = await fs.readFile(file);
      const metadata = await sharp(bytes).metadata();
      if (metadata.format !== 'png' || !metadata.width || !metadata.height || metadata.width >= metadata.height) throw new Error(`Expected a portrait native PNG: ${file}`);
      if (metadata.width < 900 || metadata.height < 1800) throw new Error(`Capture resolution is too small for App Store artwork: ${file} (${metadata.width} × ${metadata.height}).`);
      inputs.push({ deviceKey, screen, index, file, bytes, metadata });
    }
  }
  return { screens, inputs };
}

async function makeContactSheet(args, manifest) {
  const thumbWidth = 310;
  const gap = 20;
  const margin = 28;
  const columns = manifest.screens.length;
  const width = margin * 2 + columns * thumbWidth + Math.max(0, columns - 1) * gap;
  let cursor = 0;
  const layers = [];
  const rowHeights = [];
  for (const key of args.devices) {
    const device = DEVICES[key];
    const thumbHeight = Math.round(thumbWidth * device.height / device.width);
    const rowHeight = thumbHeight + 105;
    rowHeights.push(rowHeight);
    layers.push({ input: svg(width, 72, text(margin, 49, device.name, 27, { color: PALETTE.forest })), left: 0, top: cursor });
    for (const [index, item] of manifest.artwork.filter(entry => entry.device === key).entries()) {
      const preview = await sharp(path.join(args.output, item.output)).resize(thumbWidth, thumbHeight).png().toBuffer();
      layers.push({ input: preview, left: margin + index * (thumbWidth + gap), top: cursor + 72 });
    }
    cursor += rowHeight;
  }
  const output = path.join(args.output, 'contact-sheet.png');
  await sharp({ create: { width, height: rowHeights.reduce((total, item) => total + item, 0), channels: 3, background: PALETTE.cream } }).composite(layers).removeAlpha().toColourspace('srgb').png().toFile(output);
}

function makePreview(args, manifest) {
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>peri · App Store artwork</title>
  <style>*{box-sizing:border-box}body{margin:0;padding:36px;background:${PALETTE.cream};color:${PALETTE.ink};font:15px/1.5 system-ui,sans-serif}header{max-width:1100px;margin:0 auto 34px}h1{font:50px Georgia,serif;margin:0 0 12px;color:${PALETTE.forest}}p{margin:7px 0;color:${PALETTE.muted}}section{margin:40px auto;max-width:1500px}h2{font-size:20px;font-weight:500}nav{display:flex;gap:18px;flex-wrap:wrap}a{color:${PALETTE.forest}}.gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:24px}.gallery.tablet{grid-template-columns:repeat(auto-fit,minmax(310px,1fr))}figure{margin:0}img{display:block;width:100%;height:auto;box-shadow:0 7px 24px #214b4314;border:1px solid ${PALETTE.line}}figcaption{padding-top:10px;color:${PALETTE.muted};font-size:13px}code{font:12px ui-monospace,monospace}.meta{padding:16px 20px;background:${PALETTE.sage};border-radius:12px;margin:20px 0}footer{margin:38px auto;max-width:1500px;color:${PALETTE.muted};font-size:13px}</style>
  <header><h1>peri</h1><p>App Store artwork from native app captures.</p><div class="meta"><p>Every app screenshot is shown in full, with uniform scaling and no reconstruction or UI cropping.</p><p>Portrait RGB PNG · iPhone 1320 × 2868 · iPad 2064 × 2752</p></div><nav>${args.devices.map(key => `<a href="#${key}">${DEVICES[key].name}</a>`).join('')}<a href="contact-sheet.png">Contact sheet</a><a href="manifest.json">Source manifest</a></nav></header>
  ${args.devices.map(key => `<section id="${key}"><h2>${DEVICES[key].name}</h2><div class="gallery ${key === 'ipad' ? 'tablet' : ''}">${manifest.artwork.filter(item => item.device === key).map(item => `<figure><a href="${escape(item.output)}"><img src="${escape(item.output)}" loading="lazy" alt="${escape(item.headline.join(' '))}"></a><figcaption>${escape(item.screen)} · ${item.width} × ${item.height}<br><code>${escape(item.output)}</code></figcaption></figure>`).join('')}</div></section>`).join('')}
  <footer>Capture provenance and SHA-256 hashes are recorded in manifest.json. Verify the raw capture manifest before publishing. Marketing composition does not establish release-binary identity.</footer></html>`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const copyBytes = await fs.readFile(args.copy);
  const copy = JSON.parse(copyBytes);
  const provenance = args.provenance ? JSON.parse(await fs.readFile(args.provenance, 'utf8')) : null;
  const { screens, inputs } = await inspectInputs(args, copy);
  const manifest = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    compositor: 'compose-native-store.cjs',
    composition: 'Complete native screenshot, uniformly resized inside marketing artwork. No screenshot clipping, reconstruction, retouching or simulated app UI.',
    color: '8-bit sRGB, three channels, no alpha',
    copy: { file: relative(args.output, args.copy), sha256: hash(copyBytes) },
    captureProvenance: provenance,
    captureProvenanceFile: args.provenance ? relative(args.output, args.provenance) : null,
    screens: screens.map(screen => screen.id),
    artwork: [],
  };
  await fs.mkdir(args.output, { recursive: true });
  for (const input of inputs) {
    const device = DEVICES[input.deviceKey];
    const frame = layout(device, input.metadata);
    const usableWidth = device.width - frame.margin * 2;
    frame.headingFont = await fitFont(input.screen.headline, frame.tablet ? 128 : 108, usableWidth, { family: 'Georgia', spacing: -3 });
    frame.descriptionFont = await fitFont([input.screen.description], frame.tablet ? 39 : 35, usableWidth, { family: 'Arial' });
    frame.labelFont = await fitFont([`${String(input.index + 1).padStart(2, '0')}  /  ${input.screen.label}`], frame.tablet ? 30 : 27, usableWidth - (frame.tablet ? 240 : 200), { family: 'Arial', spacing: 2.4 });
    const screenshot = await sharp(input.bytes).rotate().resize(frame.imageWidth, frame.imageHeight, { fit: 'fill', kernel: 'lanczos3' }).flatten({ background: PALETTE.white }).removeAlpha().toColourspace('srgb').png().toBuffer();
    const composed = await sharp(background(device, frame, input.screen, input.index, copy)).composite([{ input: screenshot, left: frame.imageX, top: frame.imageY }]).flatten({ background: PALETTE.cream }).removeAlpha().toColourspace('srgb').png({ compressionLevel: 9, palette: false }).toBuffer();
    const finalMetadata = await sharp(composed).metadata();
    if (finalMetadata.width !== device.width || finalMetadata.height !== device.height || finalMetadata.hasAlpha || finalMetadata.channels !== 3) throw new Error(`Output format validation failed for ${input.deviceKey}/${input.screen.id}.`);
    const output = `${device.directory}/${String(input.index + 1).padStart(2, '0')}-${input.screen.id}.png`;
    await fs.mkdir(path.dirname(path.join(args.output, output)), { recursive: true });
    await fs.writeFile(path.join(args.output, output), composed);
    manifest.artwork.push({
      device: input.deviceKey, screen: input.screen.id, headline: input.screen.headline,
      output, width: device.width, height: device.height, channels: finalMetadata.channels,
      hasAlpha: finalMetadata.hasAlpha, sha256: hash(composed),
      source: { file: relative(args.output, input.file), width: input.metadata.width, height: input.metadata.height, sha256: hash(input.bytes) },
      screenshotBounds: { x: frame.imageX, y: frame.imageY, width: frame.imageWidth, height: frame.imageHeight },
      typography: { headlinePx: frame.headingFont, descriptionPx: frame.descriptionFont, labelPx: frame.labelFont, headlineFamily: 'Georgia', supportingFamily: 'Arial' },
    });
    console.log(`Composed ${output} from ${input.metadata.width} × ${input.metadata.height} native capture.`);
  }
  await makeContactSheet(args, manifest);
  await fs.writeFile(path.join(args.output, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  await fs.writeFile(path.join(args.output, 'preview.html'), makePreview(args, manifest));
  console.log(`Created ${manifest.artwork.length} RGB PNGs, contact-sheet.png, preview.html and manifest.json in ${args.output}`);
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
