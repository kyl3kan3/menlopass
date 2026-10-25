#!/usr/bin/env node
/* Deterministic artwork and video composition; no generation APIs or dependencies added. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const { chromium } = require('playwright');
const ffmpeg = require('ffmpeg-static');
const { documentHtml, escapeHtml } = require('./layout.cjs');

const ROOT = path.resolve(__dirname, '../..');
const outputFlag = process.argv.indexOf('--output');
const OUT = path.resolve(ROOT, outputFlag >= 0 ? process.argv[outputFlag + 1] : 'marketing/pip-social');
if (!OUT.startsWith(ROOT + path.sep)) throw new Error('Output must be inside the project.');
const TEMP = path.join(OUT, '.render');
const ASSETS = path.join(ROOT, 'assets/mascot/pip');
const config = JSON.parse(fs.readFileSync(path.join(OUT, 'creative.json'), 'utf8'));
const args = new Set(process.argv.slice(2));

function hash(file) { return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'); }
function execute(command, commandArgs, allowFailure = false) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, { cwd: ROOT, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    child.stdout.on('data', data => { output = (output + data.toString()).slice(-32000); });
    child.stderr.on('data', data => { output = (output + data.toString()).slice(-32000); });
    child.on('error', reject);
    child.on('close', code => code === 0 || allowFailure ? resolve({code, output}) : reject(new Error(`${path.basename(command)} exited ${code}\n${output}`)));
  });
}

async function inspectMedia(file, alpha = false) {
  const result = await execute(ffmpeg, ['-hide_banner', '-i', file], true);
  const duration = /Duration:\s*(\d+):(\d+):([\d.]+)/.exec(result.output);
  const dimensions = /Video:.*?\b(\d{2,5})x(\d{2,5})\b/.exec(result.output);
  const codec = /Video:\s*([^\s,(]+)/.exec(result.output)?.[1];
  const decoder = codec === 'vp9' ? 'libvpx-vp9' : codec === 'vp8' ? 'libvpx' : null;
  const metadata = {
    path: path.relative(ROOT, file).replaceAll('\\', '/'),
    sha256: hash(file),
    bytes: fs.statSync(file).size,
    codec,
    width: dimensions ? Number(dimensions[1]) : null,
    height: dimensions ? Number(dimensions[2]) : null,
    durationSeconds: duration ? Number(duration[1])*3600+Number(duration[2])*60+Number(duration[3]) : null,
  };
  if (alpha) {
    const alphaArgs = ['-hide_banner', ...(decoder ? ['-c:v',decoder] : []), '-i', file, '-vf', 'format=rgba,alphaextract,signalstats,metadata=print', '-frames:v', '1', '-f', 'null', '-'];
    const check = await execute(ffmpeg, alphaArgs, true);
    metadata.alphaMinimum = Number(/lavfi\.signalstats\.YMIN=(\d+)/.exec(check.output)?.[1] ?? 255);
    metadata.alphaMaximum = Number(/lavfi\.signalstats\.YMAX=(\d+)/.exec(check.output)?.[1] ?? 255);
    metadata.hasTransparentPixels = check.code === 0 && metadata.alphaMinimum < metadata.alphaMaximum && metadata.alphaMinimum < 255;
    metadata.decoder = decoder;
  }
  return metadata;
}

function validateConfig() {
  if (config.width !== 1080 || config.height !== 1920 || config.fps !== 30) throw new Error('Artwork must be 1080×1920 at 30 fps.');
  if (config.slides.length !== 2) throw new Error('Exactly two slides are required.');
  for (const row of config.card.rows) if (row.value === undefined && (!Number.isInteger(row.filled) || row.filled < 0 || row.filled > 5)) throw new Error('Card rating must be an integer from zero through five.');
  for (const [key, paletteValue] of Object.entries(config.palette)) if (!/^#[0-9a-f]{6}$/i.test(paletteValue)) throw new Error(`Invalid palette color: ${key}`);
  const sourceChecks = {
    size: {width: config.width, height: config.height, fps: config.fps},
    files: ['phone.png','guide.png'].map(file => ({file:`assets/mascot/pip/${file}`, present:fs.existsSync(path.join(ASSETS,file))})),
    fontPresent: fs.existsSync(path.join(ROOT,'assets/fonts/bricolage-grotesque-latin.woff2')),
    ffmpegPresent: fs.existsSync(ffmpeg),
    animationPresent: fs.existsSync(path.join(ASSETS,config.video.animationAsset)),
  };
  if (!sourceChecks.fontPresent || !sourceChecks.ffmpegPresent) throw new Error('Local font or ffmpeg runtime is missing.');
  return sourceChecks;
}

async function inspectPng(page, file) {
  const buffer = fs.readFileSync(file);
  const data = 'data:image/png;base64,'+buffer.toString('base64');
  const pixels = await page.evaluate(async imageUrl => {
    const picture = new Image(); picture.src = imageUrl; await picture.decode();
    const canvas = document.createElement('canvas'); canvas.width = picture.width; canvas.height = picture.height;
    const context = canvas.getContext('2d'); context.drawImage(picture,0,0);
    const rgba = context.getImageData(0,0,picture.width,picture.height).data;
    let transparent = 0, opaque = 0, xmin = picture.width, ymin = picture.height, xmax = -1, ymax = -1;
    for (let index=3; index<rgba.length; index+=4) {
      const a = rgba[index]; if(a===0) transparent++; if(a===255) opaque++;
      if(a>8) { const pixel=(index-3)/4, x=pixel%picture.width, y=Math.floor(pixel/picture.width); xmin=Math.min(xmin,x);ymin=Math.min(ymin,y);xmax=Math.max(xmax,x);ymax=Math.max(ymax,y); }
    }
    return {width:picture.width,height:picture.height,transparentPixels:transparent,opaquePixels:opaque,visibleBounds:{x:xmin,y:ymin,width:xmax-xmin+1,height:ymax-ymin+1}};
  }, data);
  return {path:path.relative(ROOT,file).replaceAll('\\','/'),sha256:hash(file),bytes:buffer.length,pngColorType:buffer[25],...pixels};
}

async function capture(page, kind, file, plate = false) {
  await page.setContent(documentHtml(ROOT,config,kind,{plate}),{waitUntil:'load'});
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(picture => picture.decode())); });
  await page.evaluate(() => {
    for (const headline of document.querySelectorAll('.headline')) {
      let size = parseFloat(getComputedStyle(headline).fontSize);
      while ([...headline.children].some(line => line.scrollWidth > line.clientWidth + 1) && size > 58) {
        headline.style.fontSize = `${--size}px`;
      }
    }
  });
  const layout = await page.evaluate(() => {
    const width=1080,height=1920;
    const nodes=[...document.querySelectorAll('.headline span,.mascot,.checkin-card,.subscription,.footline,.video-lockup')].map(node=>{
      const rect=node.getBoundingClientRect(); return {selector:node.className||node.tagName,text:node.tagName==='IMG'?'Pip':node.textContent.trim(),x:rect.x,y:rect.y,width:rect.width,height:rect.height,inBounds:rect.left>=0&&rect.top>=0&&rect.right<=width&&rect.bottom<=height,textFits:node.scrollWidth<=node.clientWidth+1};
    });
    return {fontLoaded:document.fonts.check('700 40px Bricolage'),nodes};
  });
  if (!layout.fontLoaded || layout.nodes.some(node=>!node.inBounds||!node.textFits)) throw new Error(`Layout overflow in ${kind}: ${JSON.stringify(layout)}`);
  await page.screenshot({path:file,type:'png',animations:'disabled'});
  return layout;
}

const outputOptions = ['-c:v','libx264','-preset','veryfast','-crf','18','-pix_fmt','yuv420p','-r',String(config.fps),'-threads','4','-movflags','+faststart','-an'];

async function renderScene(plate, asset, output, duration, geometry, animationMetadata) {
  const isAnimation=Boolean(animationMetadata);
  const assetInput=isAnimation ? ['-stream_loop','-1',...(animationMetadata.decoder?['-c:v',animationMetadata.decoder]:[]),'-i',asset] : ['-loop','1','-framerate',String(config.fps),'-i',asset];
  const [x,y,size]=geometry;
  const graph=`[0:v]fps=${config.fps},setpts=PTS-STARTPTS,format=rgba[bg];[1:v]fps=${config.fps},setpts=PTS-STARTPTS,scale=${size}:${size}:force_original_aspect_ratio=decrease:flags=lanczos,pad=${size}:${size}:(ow-iw)/2:(oh-ih)/2:color=0x00000000,format=rgba[actor];[bg][actor]overlay=x=${x}:y='${y}+7*sin(2*PI*t/2.8)':shortest=1:format=auto,format=yuv420p[out]`;
  await execute(ffmpeg,['-y','-hide_banner','-loglevel','error','-filter_complex_threads','1','-loop','1','-framerate',String(config.fps),'-i',plate,...assetInput,'-filter_complex',graph,'-map','[out]','-t',String(duration),...outputOptions,output]);
}

async function crossfade(first, second, output, duration, offset, fade) {
  const graph=`[0:v]settb=AVTB,setpts=PTS-STARTPTS,format=yuv420p[a];[1:v]settb=AVTB,setpts=PTS-STARTPTS,format=yuv420p[b];[a][b]xfade=transition=fade:duration=${fade}:offset=${offset},format=yuv420p[out]`;
  await execute(ffmpeg,['-y','-hide_banner','-loglevel','error','-filter_complex_threads','1','-i',first,'-i',second,'-filter_complex',graph,'-map','[out]','-frames:v',String(Math.round(duration*config.fps)),...outputOptions,output]);
}

async function slideshowScene(file, output, duration) {
  // Maximum 1.2% enlargement keeps every element inside its generous safe margins.
  const graph=`zoompan=z='1+0.012*on/${Math.round(duration*config.fps)}':x='(iw-iw/zoom)/2':y='(ih-ih/zoom)/2':d=${Math.ceil(duration*config.fps)}:s=${config.width}x${config.height}:fps=${config.fps},format=yuv420p`;
  await execute(ffmpeg,['-y','-hide_banner','-loglevel','error','-filter_threads','1','-i',file,'-vf',graph,'-t',String(duration),...outputOptions,output]);
}

function writePreview() {
  const title=escapeHtml(config.brand);
  const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} · Pip social studio</title><style>
  @font-face{font-family:Bricolage;src:url('../../assets/fonts/bricolage-grotesque-latin.woff2') format('woff2');font-weight:100 900}*{box-sizing:border-box}body{margin:0;background:#f7f5ef;color:#244b43;font-family:Bricolage,Arial,sans-serif}main{max-width:1200px;margin:auto;padding:48px 28px 70px}header{display:flex;justify-content:space-between;gap:30px;align-items:start;border-bottom:1px solid #cdd8ca;padding-bottom:28px;margin-bottom:34px}h1{font-size:clamp(38px,6vw,72px);letter-spacing:-3px;margin:0;line-height:1}h1 small{font-size:20px;display:block;letter-spacing:0;margin-top:16px;font-weight:450}header p{max-width:420px;margin:6px 0;line-height:1.6;font-size:16px}h2{font-size:26px;letter-spacing:-.7px;margin:36px 0 16px}.mascots{display:flex;gap:18px}.mascot-card{display:flex;gap:12px;align-items:center;background:#e4ecde;padding:12px 20px;border-radius:20px;flex:1}.mascot-card img{width:100px;height:100px;object-fit:contain}.mascot-card strong{display:block;font-size:20px}.mascot-card span{display:block;margin-top:7px;font-size:14px;color:#647168}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px}figure{margin:0;min-width:0}figure img,video{display:block;width:100%;border-radius:22px;box-shadow:0 14px 30px #244b4315}figcaption{font-size:15px;margin-top:14px;line-height:1.5}figcaption strong{display:block;font-size:18px;margin-bottom:4px}a{color:inherit;text-underline-offset:4px}footer{border-top:1px solid #cdd8ca;margin-top:40px;padding-top:24px;font-size:14px;line-height:1.7}.animation{margin-top:22px;display:flex;align-items:center;gap:24px}.animation video{width:180px;height:180px;object-fit:contain;background-color:#fff;background-image:linear-gradient(45deg,#dce7d1 25%,transparent 25%),linear-gradient(-45deg,#dce7d1 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#dce7d1 75%),linear-gradient(-45deg,transparent 75%,#dce7d1 75%);background-size:24px 24px;background-position:0 0,0 12px,12px -12px,-12px 0;box-shadow:none}@media(max-width:640px){main{padding:30px 18px}header{display:block}header p{margin-top:22px}.grid{gap:16px}.mascots{flex-direction:column}.mascot-card img{width:80px;height:80px}figure img,video{border-radius:15px}figcaption{font-size:12px}figcaption strong{font-size:16px}}
  </style></head><body><main><header><h1>${title}<small>Pip · mascot social studio</small></h1><p>Original sprout character, a two-image social post, and two vertical videos. Exported at 1080 × 1920. The check-in card is an illustration of the app’s existing symptom journaling flow.</p></header><section><h2>The mascot</h2><div class="mascots"><div class="mascot-card"><img src="../../assets/mascot/pip/phone.png" alt="Pip holding a phone"><div><strong>Pip · phone pose</strong><span>A tiny check-in companion.</span></div></div><div class="mascot-card"><img src="../../assets/mascot/pip/guide.png" alt="Pip warmly presenting"><div><strong>Pip · guide pose</strong><span>Your symptoms. Your pace.</span></div></div></div>${fs.existsSync(path.join(ASSETS,config.video.animationAsset))?'<div class="animation"><video src="../../assets/mascot/pip/check-in.webm" autoplay muted loop playsinline controls></video><p>Masko animation source<br><small>Checkerboard shows the transparent background.</small></p></div>':''}</section><section><h2>The two-slide post</h2><div class="grid"><figure><a href="01-hook.png"><img src="01-hook.png" alt="A tiny check-in for a very full brain, with Pip holding a phone"></a><figcaption><strong>01 · The hook</strong><a href="01-hook.png" download>Download PNG</a></figcaption></figure><figure><a href="02-check-in.png"><img src="02-check-in.png" alt="Save how today feels in peri, with an illustrated check-in card and Pip"></a><figcaption><strong>02 · The product payoff</strong><a href="02-check-in.png" download>Download PNG</a></figcaption></figure></div></section><section><h2>The videos</h2><div class="grid"><figure><video src="pip-check-in-social.mp4" poster="video-hook-poster.png" controls playsinline preload="metadata"></video><figcaption><strong>Mascot social video · 10.5 seconds</strong><a href="pip-check-in-social.mp4" download>Download MP4</a> · Silent · 30 fps</figcaption></figure><figure><video src="pip-two-slide-slideshow.mp4" poster="01-hook.png" controls playsinline preload="metadata"></video><figcaption><strong>Two-slide slideshow · 8 seconds</strong><a href="pip-two-slide-slideshow.mp4" download>Download MP4</a> · Gentle zoom and crossfade</figcaption></figure></div></section><footer>Copy and color are editable in <a href="creative.json">creative.json</a>. Render instructions and source details: <a href="README.md">README.md</a>. Dimensions, source transparency and output durations: <a href="manifest.json">manifest.json</a>.<br>Paid subscription required. The sample card is illustrated and does not represent a diagnosis or treatment result.</footer></main></body></html>`;
  fs.writeFileSync(path.join(OUT,'preview.html'),html);
}

async function main() {
  const sources=validateConfig();
  if(args.has('--check')) { console.log(JSON.stringify({sourceCheck:'passed',...sources},null,2));return; }
  const missing=sources.files.filter(file=>!file.present);
  if(missing.length) throw new Error(`Waiting for mascot assets: ${missing.map(file=>file.file).join(', ')}. Run --check to validate the renderer without the assets.`);
  fs.mkdirSync(TEMP,{recursive:true});
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:config.width,height:config.height},deviceScaleFactor:1});
  const manifest={createdAt:new Date().toISOString(),brand:config.brand,mascot:config.mascot,width:config.width,height:config.height,fps:config.fps,creativeSourceSha256:hash(path.join(OUT,'creative.json')),font:{path:'assets/fonts/bricolage-grotesque-latin.woff2',sha256:hash(path.join(ROOT,'assets/fonts/bricolage-grotesque-latin.woff2'))},inputAssets:[],layoutChecks:{},outputs:[],audio:'silent',sourceArtworkReused:false,illustratedCard:true,assetTransforms:'Uniform contain scaling and translation; source pixels are not edited.'};
  try {
    for(const file of ['phone.png','guide.png']) {
      const asset=await inspectPng(page,path.join(ASSETS,file));
      if(!asset.transparentPixels) throw new Error(`${file} must have an actually transparent background.`);
      manifest.inputAssets.push(asset);
    }
    for(const [kind,file] of [['hook','01-hook.png'],['check-in','02-check-in.png'],['video-hook','video-hook-poster.png'],['video-payoff','video-payoff-poster.png']]) {
      console.log(`Rendering ${file}`);
      manifest.layoutChecks[kind]=await capture(page,kind,path.join(OUT,file));
      manifest.outputs.push(await inspectPng(page,path.join(OUT,file)));
    }
    for(const [kind,file] of [['video-hook','hook-plate.png'],['video-payoff','payoff-plate.png']]) await capture(page,kind,path.join(TEMP,file),true);
  } finally { await browser.close(); }
  if(!args.has('--stills-only')) {
    const animationFile=path.join(ASSETS,config.video.animationAsset);
    let animationMetadata=null;
    if(fs.existsSync(animationFile)) {
      animationMetadata=await inspectMedia(animationFile,true);
      if(!animationMetadata.hasTransparentPixels) throw new Error('The Masko animation needs genuine alpha transparency before it can be overlaid.');
      manifest.inputAssets.push(animationMetadata);
    }
    manifest.animationMode=animationMetadata?'Masko alpha animation':'Static phone pose with subtle bob';
    console.log(`Rendering social video (${manifest.animationMode})`);
    const hookFile=path.join(TEMP,'hook.mp4'),payoffFile=path.join(TEMP,'payoff.mp4');
    await renderScene(path.join(TEMP,'hook-plate.png'),animationMetadata?animationFile:path.join(ASSETS,'phone.png'),hookFile,config.video.hookSeconds,[140,949,800],animationMetadata);
    await renderScene(path.join(TEMP,'payoff-plate.png'),path.join(ASSETS,'guide.png'),payoffFile,config.video.payoffSeconds,[320,1175,440]);
    const socialFile=path.join(OUT,'pip-check-in-social.mp4');
    await crossfade(hookFile,payoffFile,socialFile,config.video.durationSeconds,config.video.hookSeconds-config.video.crossfadeSeconds,config.video.crossfadeSeconds);
    console.log('Rendering two-slide slideshow');
    const first=path.join(TEMP,'slide-01.mp4'),second=path.join(TEMP,'slide-02.mp4');
    await slideshowScene(path.join(OUT,'01-hook.png'),first,config.slideshow.slideSeconds);
    await slideshowScene(path.join(OUT,'02-check-in.png'),second,config.slideshow.slideSeconds);
    const slideshowFile=path.join(OUT,'pip-two-slide-slideshow.mp4');
    await crossfade(first,second,slideshowFile,config.slideshow.durationSeconds,config.slideshow.slideSeconds-config.slideshow.crossfadeSeconds,config.slideshow.crossfadeSeconds);
    for(const [file,expected] of [[socialFile,config.video.durationSeconds],[slideshowFile,config.slideshow.durationSeconds]]) {
      const media=await inspectMedia(file);
      if(media.width!==config.width||media.height!==config.height||Math.abs(media.durationSeconds-expected)>.04) throw new Error(`Output dimensions or duration did not pass: ${JSON.stringify(media)}`);
      await execute(ffmpeg,['-hide_banner','-loglevel','error','-i',file,'-f','null','-']);
      media.expectedDurationSeconds=expected;media.decodedWithoutErrors=true;manifest.outputs.push(media);
    }
  }
  fs.writeFileSync(path.join(OUT,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  writePreview();
  console.log(`Ready: ${path.join(OUT,'preview.html')}`);
}

main().catch(error=>{console.error(error.message);process.exitCode=1;});
