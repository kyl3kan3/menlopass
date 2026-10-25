#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { escapeHtml: esc } = require('./layout.cjs');
const ROOT = path.resolve(__dirname, '../..');
const HUB = path.join(ROOT, 'marketing/pip-content');
const base = JSON.parse(fs.readFileSync(path.join(ROOT, 'marketing/pip-social/creative.json'), 'utf8'));

const posts = [
  {
    id: 'pip-night-notes', title: 'The 3 a.m. brain',
    hook: ['me at 3 a.m.', 'remembering', 'everything'],
    hookFooter: 'Except how I slept yesterday.',
    reveal: ['leave future-you', 'a little note'],
    revealFooter: 'Track sleep and add context in peri.',
    videoHook: ['my brain at 3 a.m.:', 'let’s review everything'],
    thoughts: ['that email', '2009', 'tomorrow’s list'],
    payoff: ['how did you sleep?', 'save the details', 'in peri.'],
    colors: {sage:'#E0E6ED', peachLight:'#EEE4DC'},
    card: {eyebrow:'A NOTE FOR LATER', title:'My sleep check-in', rows:[{label:'Sleep',filled:4},{label:'Fatigue',filled:3},{label:'Mood',filled:2}], noteLabel:'What I noticed', note:'Awake again. Tired by lunchtime.', caption:'Illustrated example'},
    caption: 'My brain at 3 a.m.: suddenly available for every meeting. 🌙\n\nA small note can save the details for later. Track sleep, mood and how the day felt in peri.\n\nLeave future-you a little context.\n\nPaid subscription required.\n\n#Perimenopause #Menopause #SleepJournal #PeriApp',
    alt: ['Pip looks puzzled at a phone on a soft blue background. Text reads: me at 3 a.m. remembering everything. Except how I slept yesterday.', 'Pip presents an illustrated sleep check-in with sleep, fatigue and mood ratings and a note about waking in the night. Text reads: leave future-you a little note.'],
  },
  {
    id: 'pip-appointment-notes', title: 'The “I’m fine” appointment',
    hook: ['me at my', 'appointment:', '“I’m fine.”'],
    hookFooter: 'The things I meant to say: loading…',
    reveal: ['bring the version', 'with details'],
    revealFooter: 'Prepare your appointment brief in peri.',
    videoHook: ['me when someone asks', 'what brought me in'],
    thoughts: ['sleep', 'energy', 'where do I start?'],
    payoff: ['your appointment.', 'your questions.', 'your notes.'],
    colors: {sage:'#DCE7D1', peachLight:'#F2D7C7'},
    card: {eyebrow:'HELP ME EXPLAIN THIS', title:'My appointment notes', rows:[{label:'Sleep',value:'Waking in the night'},{label:'Daily life',value:'Losing my place at work'},{label:'My goal',value:'Talk through my options'}], noteLabel:'What I want to say', note:'This affects my everyday life.', caption:'Illustrated example'},
    caption: 'Everything I wanted to say: a whole novel.\nWhat came out: “I’m fine.” 🫠\n\nWrite down your concerns, how they affect your day, and what you want to discuss. peri helps you prepare an appointment brief you can bring with you.\n\nYour appointment. Your questions. Your notes.\n\nPaid subscription required.\n\n#Perimenopause #Menopause #AppointmentPrep #PeriApp',
    alt: ['Pip holds a phone with a puzzled expression. Text reads: me at my appointment: I’m fine. The things I meant to say: loading.', 'An illustrated appointment card lists sleep concerns, impact on daily life and a discussion goal. Pip smiles beneath it. Text reads: bring the version with details.'],
  },
  {
    id: 'pip-room-for-you', title: 'The to-do list with a to-do list',
    hook: ['my to-do list', 'has a', 'to-do list'],
    hookFooter: 'Somewhere on it: check in with me.',
    reveal: ['put yourself on', 'the list, too'],
    revealFooter: 'Start with a small check-in in peri.',
    videoHook: ['me remembering everyone', 'except myself'],
    thoughts: ['reply to that', 'book the thing', 'and me?'],
    payoff: ['a little room', 'for how', 'you feel.'],
    colors: {sage:'#F0E5D5', peachLight:'#E2ECD8'},
    card: {eyebrow:'A LITTLE SPACE FOR YOU', title:'Today, in a few words', rows:[{label:'Mood',filled:2},{label:'Fatigue',filled:4},{label:'Brain fog',filled:3}], noteLabel:'One thing to remember', note:'A lot going on. One thing at a time.', caption:'Illustrated example'},
    caption: 'The list has a list. The list’s list has a reminder. 🙃\n\nA little space for how you feel belongs on it, too. Check in with your symptoms and add a note in peri.\n\nStart with today.\n\nPaid subscription required.\n\n#Perimenopause #Menopause #MentalLoad #PeriApp',
    alt: ['Pip holds a phone on a warm cream background. Text reads: my to-do list has a to-do list. Somewhere on it: check in with me.', 'Pip smiles below an illustrated daily check-in with mood, fatigue and brain fog ratings. Text reads: put yourself on the list, too.'],
  },
];

fs.mkdirSync(HUB, {recursive:true});
for (const post of posts) {
  const directory = path.join(ROOT, 'marketing', post.id);
  fs.mkdirSync(directory, {recursive:true});
  const config = structuredClone(base);
  Object.assign(config.palette, post.colors);
  config.slides[0].headline = post.hook;
  config.slides[0].footer = post.hookFooter;
  config.slides[1].headline = post.reveal;
  config.slides[1].footer = post.revealFooter;
  config.video.hook = post.videoHook;
  config.video.thoughts = post.thoughts;
  config.video.payoff = post.payoff;
  config.card = post.card;
  fs.writeFileSync(path.join(directory, 'creative.json'), JSON.stringify(config,null,2)+'\n');
  fs.writeFileSync(path.join(directory, '.gitignore'), '.render/\n');
  fs.writeFileSync(path.join(directory, 'caption.txt'), post.caption+'\n');
  fs.writeFileSync(path.join(directory, 'alt-text.txt'), post.alt.map((text,index)=>`Slide ${index+1}: ${text}`).join('\n\n')+'\n');
  console.log(`Rendering ${post.title}`);
  const run = spawnSync(process.execPath, [path.join(__dirname,'render.cjs'),'--output',path.relative(ROOT,directory)], {cwd:ROOT,stdio:'inherit',windowsHide:true});
  if (run.status !== 0) process.exit(run.status || 1);
  // Each standalone pack has its own contextual gallery and instructions.
  const previewFile = path.join(directory,'preview.html');
  let preview = fs.readFileSync(previewFile,'utf8');
  preview = preview.replace('Pip · mascot social studio',`Pip · ${esc(post.title)}`)
    .replace('The check-in card is an illustration of the app’s existing symptom journaling flow.','The product card illustrates existing peri features.')
    .replace('A tiny check-in for a very full brain, with Pip holding a phone',esc(post.alt[0]))
    .replace('Save how today feels in peri, with an illustrated check-in card and Pip',esc(post.alt[1]));
  fs.writeFileSync(previewFile,preview);
  fs.writeFileSync(path.join(directory,'README.md'),`# ${post.title}\n\nTwo-slide post, 10.5-second mascot video, and 8-second slideshow using the crisp Pip assets. Images and videos are 1080 × 1920; videos are silent.\n\nUse caption.txt for the post copy and alt-text.txt for accessible image descriptions. The product card is illustrated.\n\nEdit creative.json and run node tools/mascot-studio/render.cjs --output marketing/${post.id} from the repository root.\n`);
  const delivery=path.join(HUB,'ready-to-post',post.id);
  fs.mkdirSync(delivery,{recursive:true});
  for(const [from,to] of [['01-hook.png','01-hook.png'],['02-check-in.png','02-payoff.png'],['pip-check-in-social.mp4','mascot-video.mp4'],['pip-two-slide-slideshow.mp4','slideshow.mp4'],['caption.txt','caption.txt'],['alt-text.txt','alt-text.txt']])fs.copyFileSync(path.join(directory,from),path.join(delivery,to));
}

const captionDoc=posts.map((p,i)=>`## ${i+1}. ${p.title}\n\n${p.caption}\n\nSlide 1: ${p.hook.join(' / ')}\n\nSlide 2: ${p.reveal.join(' / ')}\n`).join('\n');
fs.writeFileSync(path.join(HUB,'captions.md'),'# Pip content batch\n\n'+captionDoc);
fs.writeFileSync(path.join(HUB,'README.md'),'# Pip content batch\n\nThree concepts, each with a two-image post, a 10.5-second mascot video, an 8-second slideshow, caption and alt text. All media are 1080 × 1920. Videos are silent so you can choose platform audio.\n\nOpen index.html to review. ready-to-post.zip contains the media and text, grouped by concept. Nothing has been published.\n\nRecreate with node tools/mascot-studio/create-content.cjs from the repository root. The existing Masko animation and crisp mascot poses are reused; no new generation credits are needed.\n');
fs.writeFileSync(path.join(HUB,'batch.json'),JSON.stringify({createdAt:new Date().toISOString(),brand:'peri',mascotRevision:'crisp-v2',concepts:posts.map(p=>({id:p.id,title:p.title,directory:`../${p.id}`,caption:p.caption,alt:p.alt})),dimensions:[1080,1920],audio:'silent',published:false},null,2)+'\n');
const sections=posts.map((p,i)=>`<section><div class="section-head"><div class="number">0${i+1}</div><div><h2>${esc(p.title)}</h2><p>Two-slide carousel · mascot video · slideshow</p></div><a href="../${p.id}/preview.html">Open set ↗</a></div><div class="media"><figure><img src="../${p.id}/01-hook.png" alt="${esc(p.alt[0])}"><figcaption>01 / Hook <a download href="../${p.id}/01-hook.png">PNG ↓</a></figcaption></figure><figure><img src="../${p.id}/02-check-in.png" alt="${esc(p.alt[1])}"><figcaption>02 / Payoff <a download href="../${p.id}/02-check-in.png">PNG ↓</a></figcaption></figure><figure><video controls playsinline preload="metadata" poster="../${p.id}/video-hook-poster.png" src="../${p.id}/pip-check-in-social.mp4"></video><figcaption>10.5s / Mascot video <a download href="../${p.id}/pip-check-in-social.mp4">MP4 ↓</a></figcaption></figure></div><div class="caption"><div><h3>Caption</h3><p>${esc(p.caption).replaceAll('\n','<br>')}</p></div><div class="actions"><a download href="../${p.id}/caption.txt">Download caption ↓</a><a download href="../${p.id}/pip-two-slide-slideshow.mp4">8s slideshow ↓</a><a download href="../${p.id}/alt-text.txt">Image alt text ↓</a></div></div></section>`).join('');
fs.writeFileSync(path.join(HUB,'index.html'),`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>peri · Pip content collection</title><style>@font-face{font-family:Bricolage;src:url('../../assets/fonts/bricolage-grotesque-latin.woff2');font-weight:100 900}*{box-sizing:border-box}body{margin:0;background:#f7f5ef;color:#244b43;font-family:Bricolage,Arial,sans-serif}main{max-width:1320px;margin:auto;padding:60px 40px}header{padding-bottom:42px;border-bottom:1px solid #ccd8cc;display:flex;gap:50px;justify-content:space-between;align-items:center}h1{font-size:clamp(44px,6vw,76px);line-height:1;letter-spacing:-3px;margin:14px 0 20px}header p{font-size:19px;line-height:1.6;max-width:650px;margin:0}.eyebrow{font-size:14px;letter-spacing:2px;text-transform:uppercase}.download{display:inline-block;margin-top:25px;padding:17px 24px;border-radius:30px;background:#244b43;color:#fffefa;text-decoration:none;font-weight:650}.hero-pip{width:220px;height:250px;object-fit:contain}section{padding:42px 0;border-bottom:1px solid #ccd8cc}.section-head{display:flex;align-items:center;gap:18px;margin-bottom:25px}.section-head>a{margin-left:auto}.number{background:#dce7d1;padding:15px;border-radius:50%;font-size:19px}h2{font-size:30px;margin:0;letter-spacing:-.7px}.section-head p{margin:6px 0 0;color:#647168}.media{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}figure{margin:0;min-width:0}figure img,video{width:100%;display:block;border-radius:18px;box-shadow:0 8px 24px #244b4310}figcaption{font-size:14px;display:flex;justify-content:space-between;margin-top:12px;gap:10px}a{color:inherit;text-underline-offset:4px}.caption{display:grid;grid-template-columns:2fr 1fr;gap:25px;padding:26px;background:#eeeee5;border-radius:18px;margin-top:26px}h3{margin:0 0 12px;font-size:18px}.caption p{font-size:15px;line-height:1.6;margin:0}.actions{display:flex;align-items:flex-start;flex-direction:column;gap:18px;font-size:15px}footer{padding-top:30px;color:#647168;font-size:14px;line-height:1.7}@media(max-width:720px){main{padding:32px 18px}header{gap:15px}.hero-pip{width:100px;height:150px}h1{font-size:43px}header p{font-size:16px}.media{grid-template-columns:repeat(2,1fr);gap:14px}.media>figure:last-child{grid-column:1/-1;width:50%;margin:auto}.section-head{flex-wrap:wrap}.section-head>a{margin-left:64px}.caption{grid-template-columns:1fr}h2{font-size:24px}figcaption{font-size:12px;flex-wrap:wrap}}</style></head><body><main><header><div><span class="eyebrow">peri / content collection 01</span><h1>A little Pip.<br>A lot of relatable.</h1><p>Three finished content sets with the crisp mascot: six images, three mascot videos, three slideshows, and captions.</p><a class="download" download href="ready-to-post.zip">Download the complete pack ↓</a></div><img class="hero-pip" src="../../assets/mascot/pip/guide.png" alt="Pip, peri’s sprout companion"></header>${sections}<footer>1080 × 1920 · 30 fps video · Silent, ready for your choice of audio.<br>Original Masko mascot. Product cards are illustrated examples. Nothing has been posted.</footer></main></body></html>`);
console.log(`Content ready: ${path.join(HUB,'index.html')}`);
