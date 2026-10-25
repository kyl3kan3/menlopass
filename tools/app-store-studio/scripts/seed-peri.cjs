// Rebuild only the initial peri deck. Later in-editor edits live in the project
// JSON and should be committed before deliberately re-running this seed script.
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('sharp');
const root = path.resolve(__dirname, '..');
const repo = path.resolve(root, '../..');
const raw = path.join(repo, 'mobile/store-assets/native-capture/raw');
const forest = '#092D25', lime = '#D0F05A', cream = '#F5F5E9';
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const svg = (w, h, content) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${content}</svg>`);
const tr = (x, y, width, height, zIndex = 5) => ({ x, y, width, height, rotation: 0, zIndex });
const text = (id, value, transform, fontSize, color, weight = 500) => ({ id, text: { en: value }, transform, fontSize, fontWeight: weight, color, align: 'left' });
const img = (id, src, transform) => ({ id, src, transform, fit: 'contain' });

const story = [
  { id: 'today', layout: 'hero', label: 'MENOPAUSE TRACKING', headline: 'Your symptoms.\nIn one place.', subline: 'A daily check-in for perimenopause and menopause.' },
  { id: 'journey', layout: 'device-top', label: 'YOUR WEEKLY STORY', headline: 'Your week.\nIn perspective.', subline: 'See your symptom record over time.' },
  { id: 'care', layout: 'device-bottom', label: 'YOUR HRT RECORD', headline: 'Keep HRT\nin view.', subline: 'Doses, schedules and changes. Together.' },
  { id: 'report', layout: 'no-device', label: 'YOUR NEXT VISIT', headline: 'Walk in\nprepared.', subline: 'Bring your tracked history to the conversation.' },
  { id: 'guide', layout: 'device-top', label: 'YOUR MENOPAUSE GUIDE', headline: 'Evidence.\nExplained.', subline: 'Explore options, sources and uncertainty.' },
  { id: 'overview', layout: 'no-device', label: 'BUILT AROUND YOU', headline: 'Your record.\nYour way.', subline: '' },
];

async function main() {
  const assets = [];
  for (const device of ['iphone', 'ipad']) {
    const dest = path.join(root, 'public/screenshots/apple', device, 'en');
    await fs.mkdir(dest, { recursive: true });
    for (const name of ['today', 'journey', 'care', 'report', 'setup', 'guide']) {
      const bytes = await fs.readFile(path.join(raw, device, `${name}.png`));
      await fs.writeFile(path.join(dest, `${name}.png`), bytes);
      assets.push({ output: `screenshots/apple/${device}/en/${name}.png`, source: `mobile/store-assets/native-capture/raw/${device}/${name}.png`, sha256: hash(bytes) });
    }
  }
  const art = path.join(root, 'public/art');
  await fs.mkdir(art, { recursive: true });
  const crops = [
    ['iphone', 'report', { left: 64, top: 1454, width: 1192, height: 1414 }],
    ['ipad', 'report', { left: 240, top: 944, width: 1580, height: 1490 }],
    ['ipad', 'care', { left: 1260, top: 2000, width: 770, height: 565 }],
  ];
  for (const [device, name, rect] of crops) {
    const input = await fs.readFile(path.join(raw, device, `${name}.png`));
    const output = await sharp(input).extract(rect).removeAlpha().png().toBuffer();
    const filename = `${device}-${name}-detail.png`;
    await fs.writeFile(path.join(art, filename), output);
    assets.push({ output: `art/${filename}`, source: `mobile/store-assets/native-capture/raw/${device}/${name}.png`, sourceSha256: hash(input), sha256: hash(output), crop: rect });
  }
  // Code-native geometry, not simulated app UI. Rules remain image elements so
  // their position is editable using the template's existing controls.
  for (const [name, color] of [['forest', forest], ['lime', lime], ['cream', cream]]) {
    await fs.writeFile(path.join(art, `rule-${name}.svg`), svg(1320, 4, `<rect width="1320" height="4" fill="${color}"/>`));
  }
  await fs.writeFile(path.join(art, 'disclosure-band.svg'), svg(1320, 86, `<rect width="1320" height="86" fill="${forest}"/>`));
  const state = { schemaVersion: 2, appName: 'peri', themeId: 'peri-bold', fontId: 'template-default', connectedCanvas: true, locales: ['en'], locale: 'en', device: 'iphone', orientation: 'portrait', appIcon: '/app-icon.png', slidesByDevice: {} };
  for (const device of ['iphone', 'ipad']) {
    const tablet = device === 'ipad', W = tablet ? 2064 : 1320, H = tablet ? 2752 : 2868;
    const X = tablet ? 112 : 72, CW = W - 2 * X;
    state.slidesByDevice[device] = story.map((s, index) => {
      const dark = index % 2 === 0, fg = dark ? cream : forest;
      const bottomCaption = s.layout === 'device-top';
      const capY = bottomCaption ? (tablet ? 1970 : 2210) : (tablet ? 205 : 240);
      const phoneWidth = s.id === 'journey' ? 1120 : 1120;
      const phoneY = bottomCaption ? -175 : 830;
      const deviceTransform = tablet
        ? s.id === 'guide'
          ? tr(192, -260, 1680, 1680 / 0.770, 3)
          : tr(s.id === 'care' ? 120 : 158, bottomCaption ? -340 : 910, 1730, 1730 / 0.770, 3)
        : tr(s.id === 'care' ? 172 : 112, phoneY, phoneWidth, phoneWidth / (1022 / 2082), 3);
      const slide = {
        id: `${device}-${s.id}`, layout: s.layout, label: { en: s.label }, headline: { en: s.headline },
        screenshot: s.id === 'overview' ? '' : `/screenshots/apple/${device}/en/${s.id}.png`,
        inverted: dark,
        typography: { headlineScale: s.id === 'today' ? 0.93 : 1, labelScale: 1 },
        transforms: { caption: tr(X, capY, CW, tablet ? 570 : 420, 6), ...(s.layout === 'no-device' ? {} : { device: deviceTransform }) },
        textElements: [], imageElements: [],
      };
      if (!bottomCaption) {
        slide.textElements.push(text('brand', 'peri', tr(X - 14, 52, 500, 135, 7), tablet ? 108 : 90, fg, 800));
        slide.textElements.push(text('edition', `${String(index + 1).padStart(2, '0')} / 06`, tr(W - X - 225, 86, 220, 65, 7), tablet ? 36 : 29, fg));
      }
      if (s.subline) {
        const sy = bottomCaption ? (tablet ? 2570 : 2670) : (tablet ? 770 : 678);
        slide.textElements.push(text('subline', s.subline, tr(X - 14, sy, CW + 20, tablet ? 104 : 102, 7), tablet ? 48 : 41, fg));
      }
      if (s.id !== 'guide') slide.imageElements.push({ ...img('disclosure-band', '/art/disclosure-band.svg', tr(0, H - 86, W, 86, 9)), fit: 'cover' });
      slide.textElements.push(text('subscription', 'Paid subscription required.', tr(X - 12, H - 84, CW, 64, 10), tablet ? 40 : 36, cream));
      if (s.id === 'report') {
        const rect = tablet ? { w: 1670, h: 1670 * 1490 / 1580 } : { w: 1150, h: 1150 * 1414 / 1192 };
        slide.imageElements.push(img('report-paper', `/art/${device}-report-detail.png`, tr((W - rect.w) / 2, tablet ? 920 : 1030, rect.w, rect.h, 3)));
        // One short document caption is grounded in what the actual report says.
        slide.textElements.push(text('report-note', 'Your history, ready to share.', tr(X - 14, tablet ? 2515 : 2470, CW, 110, 7), tablet ? 47 : 48, forest, 600));
      }
      if (tablet && s.id === 'care') slide.imageElements.push(img('hrt-detail', '/art/ipad-care-detail.png', tr(476, 1430, 1450, 1450 * 565 / 770, 8)));
      if (s.id === 'overview') {
        const rows = ['Check-ins', 'Symptom history', 'HRT log', 'Visit reports', 'Evidence guide', 'Your priorities'];
        const start = tablet ? 1010 : 980, step = tablet ? 237 : 256;
        rows.forEach((row, i) => {
          const y = start + i * step;
          slide.textElements.push(text(`feature-${i}`, row, tr(X + 110, y, CW - 125, 150, 7), tablet ? 104 : 91, forest, 800));
          slide.textElements.push(text(`number-${i}`, String(i + 1).padStart(2, '0'), tr(X - 14, y + 30, 100, 80, 7), tablet ? 37 : 31, forest));
          slide.imageElements.push(img(`rule-${i}`, '/art/rule-forest.svg', tr(X, y + 187, CW, 3, 4)));
        });
      }
      // One non-critical rule connects Guide and Overview. All meaningful copy
      // and all native UI remain on their own slide.
      if (s.id === 'guide') slide.imageElements.push(img('connecting-rule', '/art/rule-cream.svg', tr(W - X - 250, tablet ? 1940 : 2165, 500, 4, 4)));
      return slide;
    });
  }
  for (const device of ['tvos', 'watchos', 'carplay', 'mac', 'android', 'android-7', 'android-10', 'feature-graphic']) state.slidesByDevice[device] = [];
  await fs.writeFile(path.join(root, 'app-store-screenshots.json'), JSON.stringify(state, null, 2) + '\n');
  const provenance = JSON.parse(await fs.readFile(path.join(repo, 'mobile/store-assets/native-capture/capture-provenance.json')));
  await fs.writeFile(path.join(root, 'capture-provenance.json'), JSON.stringify({ generatedAt: new Date().toISOString(), capture: provenance, notes: 'All app content is genuine capture pixels. Detail assets are contiguous crops. Source files are copied unchanged; default template frames perform uniform cover-scaling.', assets }, null, 2) + '\n');
  console.log('Seeded 6 iPhone and 6 iPad slides using verified native sources.');
}
main().catch(e => { console.error(e); process.exitCode = 1; });
