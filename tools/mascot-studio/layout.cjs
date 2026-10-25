const fs = require('node:fs');
const path = require('node:path');

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
}

function imageData(file, mime = 'image/png') {
  return `data:${mime};base64,${fs.readFileSync(file).toString('base64')}`;
}

function cardMarkup(config, compact = false) {
  const card = config.card;
  const rows = card.rows.map(row => `<div class="rating-row"><b>${escapeHtml(row.label)}</b>${row.value !== undefined ? `<span class="row-value" style="font-size:${compact ? 25 : 28}px;max-width:60%;text-align:right;line-height:1.2">${escapeHtml(row.value)}</span>` : `<div class="rating" aria-label="Illustrated rating">${Array.from({length:5}, (_, index) => `<i class="${index < row.filled ? 'filled' : ''}"></i>`).join('')}</div>`}</div>`).join('');
  return `<section class="checkin-card${compact?' compact':''}"><div class="card-eyebrow">${escapeHtml(card.eyebrow)}</div><h2>${escapeHtml(card.title)}<svg viewBox="0 0 32 32" aria-hidden="true"><path d="m7 16 6 6 13-14"/></svg></h2>${rows}<div class="note"><span>${escapeHtml(card.noteLabel)}</span><p>${escapeHtml(card.note)}</p></div><div class="example">${escapeHtml(card.caption)}</div></section>`;
}

function baseCss(config, fontData) {
  const p = config.palette;
  return `@font-face{font-family:Bricolage;src:url('${fontData}') format('woff2');font-weight:100 900;font-display:block}
  *{box-sizing:border-box}html,body{padding:0;margin:0;width:${config.width}px;height:${config.height}px;overflow:hidden}body{font-family:Bricolage,Arial,sans-serif;color:${p.forest};-webkit-font-smoothing:antialiased}.artboard{position:relative;isolation:isolate;width:${config.width}px;height:${config.height}px;overflow:hidden;background:${p.sage}}h1,h2,p{margin:0}h1{font-weight:750;letter-spacing:-5.4px;line-height:1.045}.headline{position:absolute;z-index:3;left:78px;right:78px;text-align:center}.headline span{display:block;white-space:nowrap}.wordmark{position:absolute;z-index:5;left:78px;top:76px;font-size:51px;font-weight:700;letter-spacing:-3px;display:flex;align-items:center;gap:15px}.brand-dot{display:inline-block;width:13px;height:13px;border-radius:50%;background:${p.peach}}.brand-rule{position:absolute;left:78px;right:78px;top:155px;height:2px;background:${p.forest}24}.mascot{position:absolute;object-fit:contain;z-index:2}.shadow{position:absolute;background:${p.forest}18;filter:blur(21px);border-radius:50%;z-index:1}.orbit{position:absolute;border:2px solid ${p.forest}12;border-radius:50%;z-index:0}.speck{position:absolute;width:17px;height:17px;border-radius:50%;background:${p.peach};z-index:0}.leaf{position:absolute;width:80px;height:37px;background:${p.peach};border-radius:100% 0 100% 0;transform:rotate(-22deg)}.subscription{position:absolute;bottom:76px;left:78px;right:78px;font-size:21px;letter-spacing:.2px;text-align:center;opacity:.68}.footline{position:absolute;z-index:4;left:70px;right:70px;text-align:center;font-size:33px;font-weight:500;letter-spacing:-.5px}.checkin-card{position:absolute;left:105px;top:487px;width:870px;padding:38px 44px 24px;background:${p.ivory};border:4px solid ${p.forest};border-radius:39px;transform:rotate(-2deg);box-shadow:0 14px 0 ${p.forest}0d;z-index:4}.card-eyebrow{font-size:21px;font-weight:650;letter-spacing:2.4px;color:${p.sageDark}}.checkin-card h2{font-size:49px;letter-spacing:-1.9px;font-weight:700;margin:15px 0 19px;display:flex;align-items:center;justify-content:space-between}.checkin-card h2 svg{height:42px;width:42px;background:${p.sage};border-radius:50%;padding:9px;fill:none;stroke:${p.forest};stroke-width:3.2;stroke-linecap:round;stroke-linejoin:round}.rating-row{height:100px;display:flex;align-items:center;justify-content:space-between;border-top:2px solid ${p.forest}15}.rating-row b{font-size:35px;letter-spacing:-.6px;font-weight:600}.rating{display:flex;gap:13px}.rating i{width:32px;height:32px;border:2.5px solid ${p.sageDark};border-radius:50%;background:transparent}.rating i.filled{background:${p.sageDark};box-shadow:inset 0 0 0 5px ${p.ivory}}.note{border-top:2px solid ${p.forest}15;padding-top:22px}.note span{font-size:22px;color:${p.sageDark}}.note p{font-size:28px;letter-spacing:-.4px;margin-top:9px}.example{margin-top:23px;font-size:17px;opacity:.5;letter-spacing:.3px}.thought{position:absolute;z-index:4;background:${p.ivory};border:3px solid ${p.forest};border-radius:50px;padding:20px 34px;font-size:34px;font-weight:600;box-shadow:0 8px 0 ${p.forest}0a;white-space:nowrap}.thought:after{content:'';position:absolute;width:14px;height:14px;bottom:-28px;left:50%;background:${p.ivory};border:2.5px solid ${p.forest};border-radius:50%}.video-lockup{position:absolute;z-index:5;left:78px;right:78px;bottom:152px;text-align:center}.video-lockup strong{font-size:77px;letter-spacing:-4px;font-weight:700}.video-lockup p{font-size:29px;letter-spacing:-.4px;margin-top:13px}.compact{left:117px;width:846px;top:627px;padding:28px 37px 22px;border-radius:35px;transform:rotate(-1.4deg)}.compact h2{font-size:44px;margin:12px 0 12px}.compact .card-eyebrow{font-size:19px}.compact .rating-row{height:82px}.compact .rating-row b{font-size:31px}.compact .rating i{width:29px;height:29px}.compact .note{padding-top:15px}.compact .note p{font-size:25px}.compact .note span{font-size:20px}.compact .example{margin-top:13px;font-size:16px}`;
}

function decorativeMarkup(kind) {
  if (kind === 'hook' || kind === 'video-hook') return `<div class="orbit" style="left:-242px;top:723px;width:1570px;height:1570px"></div><div class="orbit" style="left:-171px;top:798px;width:1430px;height:1430px"></div><i class="speck" style="left:122px;top:682px"></i><i class="speck" style="right:103px;top:941px;width:11px;height:11px"></i><i class="leaf" style="right:76px;top:647px"></i>`;
  return `<div class="orbit" style="left:-145px;top:820px;width:1390px;height:1390px"></div><i class="speck" style="left:96px;top:1163px"></i><i class="speck" style="right:97px;top:1471px;width:12px;height:12px"></i><i class="leaf" style="left:98px;top:1416px;transform:rotate(36deg);width:59px;height:29px"></i>`;
}

function documentHtml(root, config, kind, options = {}) {
  const font = imageData(path.join(root, 'assets/fonts/bricolage-grotesque-latin.woff2'), 'font/woff2');
  const brand = `<div class="wordmark">${escapeHtml(config.brand)}<i class="brand-dot"></i></div><div class="brand-rule"></div>`;
  const subscription = `<div class="subscription">${escapeHtml(config.subscriptionNote)}</div>`;
  const mascot = (file, style) => options.plate ? '' : `<img class="mascot" style="${style}" src="${imageData(path.join(root, 'assets/mascot/pip', file))}" alt="Pip, the peri sprout companion">`;
  const headline = (lines, style) => `<h1 class="headline" style="${style}">${lines.map(line => `<span>${escapeHtml(line)}</span>`).join('')}</h1>`;
  let content;
  let custom = '';
  if (kind === 'hook') {
    const slide = config.slides[0];
    content = `${brand}${headline(slide.headline,'top:243px;font-size:112px')}${decorativeMarkup(kind)}<div class="shadow" style="left:298px;top:1578px;width:484px;height:63px"></div>${mascot(slide.asset,'left:111px;top:801px;width:858px;height:858px')}<p class="footline" style="top:1694px;font-size:31px">${escapeHtml(slide.footer)}</p>${subscription}`;
  } else if (kind === 'check-in') {
    const slide = config.slides[1];
    custom = `.artboard{background:${config.palette.peachLight}}.brand-dot{background:${config.palette.sageDark}}`;
    content = `${brand}${headline(slide.headline,'top:230px;font-size:104px')}${decorativeMarkup(kind)}${cardMarkup(config)}<p class="footline" style="top:1160px">${escapeHtml(slide.footer)}</p><div class="shadow" style="left:348px;top:1726px;width:385px;height:45px"></div>${mascot(slide.asset,'left:248px;top:1199px;width:584px;height:584px')}${subscription}`;
  } else if (kind === 'video-hook') {
    content = `${brand}${headline(config.video.hook,'top:258px;font-size:88px;letter-spacing:-4px')}${decorativeMarkup(kind)}<div class="thought" style="left:103px;top:626px;transform:rotate(-9deg)">${escapeHtml(config.video.thoughts[0])}</div><div class="thought" style="right:109px;top:720px;transform:rotate(7deg)">${escapeHtml(config.video.thoughts[1])}</div><div class="thought" style="left:240px;top:891px;transform:rotate(-4deg)">${escapeHtml(config.video.thoughts[2])}</div><div class="shadow" style="left:295px;top:1650px;width:490px;height:56px"></div>${mascot('phone.png','left:140px;top:949px;width:800px;height:800px')}${subscription}`;
  } else if (kind === 'video-payoff') {
    custom = `.artboard{background:${config.palette.peachLight}}.brand-dot{background:${config.palette.sageDark}}`;
    content = `${brand}${headline(config.video.payoff,'top:239px;font-size:90px;letter-spacing:-4px')}${decorativeMarkup(kind)}${cardMarkup(config,true)}<div class="shadow" style="left:368px;top:1581px;width:347px;height:40px"></div>${mascot('guide.png','left:320px;top:1175px;width:440px;height:440px')}<div class="video-lockup"><strong>${escapeHtml(config.brand)}</strong><p>${escapeHtml(config.video.close)}</p></div>${subscription}`;
  } else throw new Error(`Unknown artwork kind: ${kind}`);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${escapeHtml(config.brand)} — ${escapeHtml(kind)}</title><style>${baseCss(config,font)}${custom}</style></head><body><main class="artboard">${content}</main></body></html>`;
}

module.exports = { documentHtml, escapeHtml };
