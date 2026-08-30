const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, 'dist');
const TEST_RESULTS = path.join(__dirname, 'test-results');
const MIME = {'.html':'text/html','.js':'application/javascript','.png':'image/png','.webmanifest':'application/manifest+json','.css':'text/css','.woff2':'font/woff2','.txt':'text/plain'};

const server = http.createServer((req,res)=>{
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname); }
  catch { res.writeHead(400); res.end('bad request'); return; }
  if(pathname==='/') pathname='/index.html';
  const f = path.resolve(DIST, pathname.replace(/^\/+/, ''));
  const insideDist = f.startsWith(DIST + path.sep);
  if(!insideDist || !fs.existsSync(f) || !fs.statSync(f).isFile()){
    res.writeHead(404, {'Content-Type':'text/plain; charset=utf-8'});
    res.end('not found');
    return;
  }
  const headers = {
    'Content-Type': MIME[path.extname(f)]||'application/octet-stream',
    'Cache-Control': 'no-store'
  };
  if(path.basename(f)==='sw.js') headers['Service-Worker-Allowed']='/';
  res.writeHead(200, headers);
  res.end(fs.readFileSync(f));
});

const errors = [];
const fails = [];
function check(name, cond, extra){
  if(cond) console.log('  PASS  ' + name);
  else { console.log('  FAIL  ' + name + (extra? ' :: '+extra : '')); fails.push(name); }
}

function monitorPage(page, label, baseUrl){
  page.on('console', message=>{
    if(message.type()==='error') errors.push(`CONSOLE(${label}): ${message.text()}`);
  });
  page.on('pageerror', error=>errors.push(`PAGEERROR(${label}): ${error.message}`));
  page.on('requestfailed', request=>{
    if(request.url().startsWith(baseUrl)){
      errors.push(`REQUESTFAILED(${label}): ${request.url()} :: ${request.failure()?.errorText||'unknown'}`);
    }
  });
  page.on('response', response=>{
    if(response.url().startsWith(baseUrl) && response.status()>=400){
      errors.push(`HTTP ${response.status()}(${label}): ${response.url()}`);
    }
  });
}

async function goLearn(page){
  await page.click('[data-act="tab"][data-v="settings"]');
  await page.click('[data-act="tab"][data-v="learn"]');
}
async function goTodayDetails(page){
  await page.click('[data-act="tab"][data-v="settings"]');
  await page.click('[data-act="tab"][data-v="today-details"]');
}

// synthetic 45 days of data
function seed(){
  const entries = {};
  const today = new Date();
  for(let i=44;i>=0;i--){
    const d = new Date(today); d.setDate(d.getDate()-i);
    const key = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    const trend = i/44;
    const alc = (i%5===0)?2:0;
    entries[key] = {
      hf: Math.max(0, Math.round(6*trend + (i%3) + (((i+1)%5===0)?3:0))),
      ns: (i%4===0)?3:1,
      inBedH: 8, sleepH: 6.1 + (i%3)*0.4,
      sym: {sleepq:(i%4===0)?3:1, mood: i>30?3:1, anx:2, fog:1, joint:2, dry: i<20?3:1, uri:1, energy:2, head:0, palp:0, itch:1, libido:2},
      wt: 76 - (44-i)*0.03,
      waist: 92 - (44-i)*0.02,
      act: {res: (i%4===0), aero: (i%2===0)?30:0, pf:(i%3===0)},
      nut: {prot:(i%3!==0), alc: alc, caf:2, cal:(i%2===0)},
      bleed: i===40 ? 'moderate' : 'none',
      notes: i===3 ? 'Bad night, woke twice.' : ''
    };
  }
  return {
    v:4,
    profile:{name:'Test', birthYear:1974, region:'us', units:'imperial', lastPeriod:'', surgeryDate:'', uterus:'intact', ovaries:'kept',
             bone:'unknown', proteinGpk:1.2, weightGoal:null, waistGoal:null, theme:'auto', stage:null, onboarded:true},
    entries,
    medications:[
      {id:'estradot',name:'Estradot 50µg',form:'patch',days:[1,4],due:'08:00',notes:''},
      {id:'utrogestan',name:'Utrogestan 100mg',form:'tablet',days:[0,1,2,3,4,5,6],due:'22:00',notes:''}
    ],
    labs:[{id:'lab-estradiol',name:'Estradiol',date:'2026-07-28',value:'312',unit:'pmol/L'}],
    screening:{}, scores:[{date:'2026-07-20',type:'phq9',score:11,band:'moderate'}], trigger:null,
    meta:{created:'2026-06-01'}
  };
}

(async()=>{
  let browser;
  try {
  if(!fs.existsSync(path.join(DIST, 'index.html'))){
    throw new Error('dist/index.html is missing. Run "npm run build" first.');
  }
  check(
    'root index mirror matches dist',
    fs.readFileSync(path.join(__dirname, 'index.html')).equals(fs.readFileSync(path.join(DIST, 'index.html')))
  );

  console.log('\n== 0. Native hard-paywall contract ==');
  const nativeAppSource = fs.readFileSync(path.join(__dirname, 'mobile', 'App.native.tsx'), 'utf8');
  const reviewSource = fs.readFileSync(path.join(__dirname, 'mobile', 'reviewPrompt.native.ts'), 'utf8');
  const storeDescription = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'mobile', 'store.config.json'), 'utf8')
  ).apple.info['en-US'].description;
  const gateReturnIndex = nativeAppSource.indexOf("if (Platform.OS === 'ios' && !proActive)");
  const webViewIndex = nativeAppSource.lastIndexOf('<WebView');
  check('inactive iOS entitlement is gated before WebView content', gateReturnIndex >= 0 && gateReturnIndex < webViewIndex);
  check('RevenueCat paywall cannot show a close button', nativeAppSource.includes('displayCloseButton: false'));
  check('zero-price App Store offers fail closed', nativeAppSource.includes('introPrice?.price === 0'));
  check('App Store copy discloses no free tier or trial', storeDescription.includes('There is no free tier or free trial.') && !storeDescription.includes('FREE FEATURES'));
  check('review milestones are exactly openings 2, 5, and 20', reviewSource.includes('appReviewMilestones = [2, 5, 20] as const'));
  check('review attempts persist separately from health data', reviewSource.includes("menocompass-review-state.json") && reviewSource.includes('requestedAtLaunches'));
  check('reviews wait for entitlement, onboarding, main content, and ATT',
    /!proActive[\s\S]*!experienceReady[\s\S]*!webContentReady[\s\S]*!telemetrySettled[\s\S]*trackingPromptedThisSession/.test(nativeAppSource));

  fs.mkdirSync(TEST_RESULTS, {recursive:true});
  await new Promise((resolve,reject)=>{
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  browser = await chromium.launch({headless:true});
  const ctx = await browser.newContext({viewport:{width:390,height:844}, deviceScaleFactor:2});
  const page = await ctx.newPage();
  monitorPage(page, 'main', baseUrl);

  console.log('\n== 1. First run / onboarding ==');
  await page.goto(`${baseUrl}/index.html`);
  await page.waitForTimeout(400);
  check('onboarding shown', await page.getByText('Welcome to MenoCompass').isVisible());
  check('tabs hidden on onboarding', !(await page.locator('nav.tabs').isVisible()));
  check('first onboarding action is visible without scrolling', await page.locator('[data-act="ob-next"]').evaluate(el=>{
    const r=el.getBoundingClientRect(); return r.top>=0 && r.bottom<=window.innerHeight;
  }));
  await page.screenshot({path:path.join(TEST_RESULTS, 'shot-onboarding-step1.png'), fullPage:true});
  await page.click('[data-act="ob-next"]');
  await page.waitForTimeout(250);
  check('onboarding advances to optional basics', await page.getByText('Make it yours').isVisible());
  await page.screenshot({path:path.join(TEST_RESULTS, 'shot-onboarding-step2.png'), fullPage:true});
  await page.fill('#ob-n','Tia');
  await page.fill('#ob-y','1974');
  await page.selectOption('#ob-u','imperial');
  await page.waitForTimeout(400);
  await page.reload(); await page.waitForTimeout(400);
  check('unfinished onboarding name survives a reload', (await page.inputValue('#ob-n'))==='Tia');
  check('unfinished onboarding birth year survives a reload', (await page.inputValue('#ob-y'))==='1974');
  check('onboarding explains that progress saves automatically', /progress saves as you go/i.test(await page.locator('#app').innerText()));
  await page.click('[data-act="ob-done"]');
  await page.waitForTimeout(600);
  check('staging quiz auto-opens', await page.locator('.sheet').isVisible());
  check('birth year prevents duplicate age question', /uterus|hysterectomy/i.test(await page.locator('.stage-focus-target').innerText()));
  check('adaptive staging avoids a shifting total', !/Question \d+ of \d+/.test(await page.locator('.sheet').innerText()));
  check('staging focus lands on the active question', await page.evaluate(()=>document.activeElement?.classList.contains('stage-focus-target')));
  await page.locator('.sheet .row').first().click(); await page.waitForTimeout(250);
  check('focus follows each staging answer', await page.evaluate(()=>document.activeElement?.classList.contains('stage-focus-target')));

  console.log('\n== 2. Staging quiz — surgical combinations ==');

  async function runQuiz(answers){
    // close anything already open, then reopen the quiz from the You tab
    while(await page.locator('.sheet').count()){
      await page.locator('[data-act="close"]').first().click();
      await page.waitForTimeout(180);
    }
    await page.evaluate(()=>{ stageAns={}; stageStep=0; stageEditing=false; DB.profile.stage=null; DB.profile.birthYear=null; save(true); });
    await page.click('[data-act="tab"][data-v="settings"]'); await page.waitForTimeout(250);
    await page.click('[data-act="sheet"][data-s="learn:stage"]'); await page.waitForTimeout(300);
    const restart = page.locator('[data-act="stage-restart"]');
    if(await restart.count()){ await restart.first().click(); await page.waitForTimeout(250); }
    for(const a of answers){
      const row = page.locator('.sheet .row', {hasText:a});
      if(!(await row.count())) return {error:'no option matching: '+a, seen:await page.locator('.sheet').innerText()};
      await row.first().click();
      await page.waitForTimeout(140);
    }
    const resultDetails = page.locator('.sheet details');
    for(let i=0;i<await resultDetails.count();i++){
      await resultDetails.nth(i).locator('summary').click();
    }
    if(await resultDetails.count()) await page.waitForTimeout(100);
    const txt = await page.locator('.sheet').innerText();
    const label = (await page.locator('.sheet .callout .ctitle').first().innerText().catch(()=>''));
    return {txt, label};
  }
  async function closeQuiz(){
    const c = page.locator('[data-act="close"]');
    if(await c.count()) { await c.first().click(); await page.waitForTimeout(200); }
  }

  // --- A. hysterectomy, both ovaries kept: must NOT be called menopause,
  //        and must not ask about periods ---
  let r = await runQuiz(['45–54','Yes — I have had a hysterectomy','No — both ovaries are still there','1–5 years ago','Occasionally']);
  check('A: hysterectomy+ovaries-kept path completes', !r.error, r.error||'');
  check('A: completion actions appear before optional detail', await page.evaluate(()=>{
    const done=document.querySelector('.stage-result-actions'), detail=document.querySelector('.sheet details');
    return !!done && !!detail && Boolean(done.compareDocumentPosition(detail)&Node.DOCUMENT_POSITION_FOLLOWING);
  }));
  check('A: explicitly says this is not menopause', /this is not menopause/i.test(r.txt||''));
  check('A: never asked about period pattern', !/describes your periods/i.test(r.txt||''));
  check('A: explains ovaries carry on working', /carry on producing hormones/i.test(r.txt||''));
  check('A: flags the cervix / cervical screening question', /cervical screening/i.test(r.txt||''));
  check('A: says no progestogen needed', /not need a progestogen/i.test(r.txt||''));
  check('A: flags unexpected bleeding after hysterectomy', /bleeding after a hysterectomy is unexpected/i.test(r.txt||''));
  check('A: cites the 3-month staging rule', /3 months after surgery/i.test(r.txt||''));
  await closeQuiz();

  // --- B. hysterectomy AND both ovaries removed: surgical menopause,
  //        oestrogen-only, still no period questions ---
  r = await runQuiz(['45–54','Yes — I have had a hysterectomy','Both were removed','1–5 years ago','Often, and they bother me']);
  check('B: both-removed path completes', !r.error, r.error||'');
  check('B: identified as surgical menopause', /surgical menopause/i.test(r.txt||''));
  check('B: never asked about period pattern', !/describes your periods/i.test(r.txt||''));
  check('B: recommends therapy until ~52', /around 52/.test(r.txt||''));
  check('B: oestrogen-only, no progestogen', /progestogen is not needed/i.test(r.txt||''));
  check('B: testosterone-after-oophorectomy note', /testosterone/i.test(r.txt||''));
  await closeQuiz();

  // --- C. ovaries removed but uterus KEPT: surgical menopause that still
  //        needs endometrial protection ---
  r = await runQuiz(['45–54','No — my uterus is still there','Both were removed','1–5 years ago','No']);
  check('C: ovaries-removed-uterus-kept completes', !r.error, r.error||'');
  check('C: identified as surgical menopause', /surgical menopause/i.test(r.txt||''));
  check('C: says a progestogen IS needed', /you also need a progestogen/i.test(r.txt||''));
  check('C: cites the endometrial cancer figure', /48 extra endometrial/i.test(r.txt||''));
  check('C: skipped the contraception and cycle questions', !/describes your periods/i.test(r.txt||''));
  await closeQuiz();

  // --- D. fresh surgery: 3-month warning ---
  r = await runQuiz(['45–54','Yes — I have had a hysterectomy','Both were removed','Less than 3 months ago','Often, and they bother me']);
  check('D: post-op window warning fires', /less than 3 months post-op/i.test(r.txt||''));
  await closeQuiz();

  // --- E. ablation: uterus present, bleeding unreadable ---
  r = await runQuiz(['45–54','I have had an endometrial ablation','No — both ovaries are still there','1–5 years ago','Occasionally']);
  check('E: ablation path completes', !r.error, r.error||'');
  check('E: says ablation does not cause menopause', /does not cause menopause/i.test(r.txt||''));
  check('E: still needs a progestogen', /still need a progestogen/i.test(r.txt||''));
  check('E: never asked about period pattern', !/describes your periods/i.test(r.txt||''));
  await closeQuiz();

  // --- F. unsure what was removed ---
  r = await runQuiz(['45–54',"I'm not sure what was removed","I'm not sure",'1–5 years ago','Occasionally']);
  check('F: unsure path completes', !r.error, r.error||'');
  check('F: routes to getting the surgical record', /surgical record|surgical notes/i.test(r.txt||''));
  check('F: lays out the three combinations', /Uterus removed, ovaries kept/i.test(r.txt||''));
  await closeQuiz();

  // --- G. contraception masking periods ---
  r = await runQuiz(['45–54','No — my uterus is still there','No — both ovaries are still there','Yes','Occasionally']);
  check('G: contraception path completes', !r.error, r.error||'');
  check('G: identified as masked by contraception', /masked by contraception/i.test(r.txt||''));
  check('G: never asked about period pattern', !/describes your periods/i.test(r.txt||''));
  await closeQuiz();

  // --- H. one ovary removed, uterus intact: ordinary staging still applies ---
  r = await runQuiz(['45–54','No — my uterus is still there','One was removed','1–5 years ago','No','Cycle length varies by a week or more between periods','Occasionally']);
  check('H: one-ovary path completes', !r.error, r.error||'');
  check('H: still stages normally', /Early menopausal transition/i.test(r.txt||''));
  check('H: adds the single-ovary note', /one ovary/i.test(r.txt||''));
  await closeQuiz();

  // --- I. under 40 with a hysterectomy: POI path with the missing-criterion note ---
  r = await runQuiz(['Under 40','Yes — I have had a hysterectomy','No — both ovaries are still there','1–5 years ago','Often, and they bother me']);
  check('I: under-40 routes to assessment', /premature menopause/i.test(r.txt||''));
  check('I: notes the missing bleeding criterion', /extra wrinkle/i.test(r.txt||''));
  await closeQuiz();

  // --- J. ordinary path, and the back button re-routes on a changed answer ---
  r = await runQuiz(['45–54','No — my uterus is still there','No — both ovaries are still there','No','I have skipped periods — gaps of 60 days or more','Often, and they bother me']);
  check('J: ordinary staging completes', /Late menopausal transition/i.test(r.txt||''), r.label||'');
  check('J: FSH caveat shown', /not routinely use FSH/i.test(r.txt||''));
  await closeQuiz();

  console.log('\n== 2b. Profile reflects the split fields ==');
  await page.click('[data-act="tab"][data-v="settings"]'); await page.waitForTimeout(300);
  check('profile has a separate uterus field', (await page.locator('#ut').count())===1);
  check('profile has a separate ovaries field', (await page.locator('#ov').count())===1);
  await page.selectOption('#ut','intact'); await page.waitForTimeout(200);
  await page.selectOption('#ov','kept'); await page.waitForTimeout(300);
  check('last-period field shown when periods are possible', (await page.locator('#lp').count())===1);
  await page.selectOption('#ut','hyst'); await page.waitForTimeout(350);
  check('last-period field replaced by surgery date after hysterectomy', (await page.locator('#lp').count())===0 && (await page.locator('#sd').count())===1);
  await goTodayDetails(page); await page.waitForTimeout(300);
  check('Today relabels the bleeding row after hysterectomy', /Any vaginal bleeding or spotting/.test(await page.locator('#app').innerText()));
  check('Today explains why bleeding matters after hysterectomy', /unexpected/i.test(await page.locator('#app').innerText()));

  console.log('\n== 2c. Treatment module personalises endometrial protection ==');
  await goLearn(page); await page.waitForTimeout(250);
  await page.locator('.row', {hasText:'Treatment options'}).click(); await page.waitForTimeout(350);
  check('no-uterus: progestogen section marked not applicable', /does not apply to you/i.test(await page.locator('.sheet').innerText()));
  await page.click('[data-act="close"]'); await page.waitForTimeout(200);
  await page.click('[data-act="tab"][data-v="settings"]'); await page.waitForTimeout(250);
  await page.selectOption('#ut','ablation'); await page.waitForTimeout(300);
  await goLearn(page); await page.waitForTimeout(250);
  await page.locator('.row', {hasText:'Treatment options'}).click(); await page.waitForTimeout(350);
  check('ablation: progestogen still required', /still need a progestogen/i.test(await page.locator('.sheet').innerText()));
  await page.click('[data-act="close"]'); await page.waitForTimeout(200);

  console.log('\n== 2d. Insights respect surgical history ==');
  await page.click('[data-act="tab"][data-v="settings"]'); await page.waitForTimeout(250);
  await page.selectOption('#ut','hyst'); await page.waitForTimeout(200);
  await page.selectOption('#ov','both'); await page.waitForTimeout(300);
  await page.evaluate(()=>{
    const iso = d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    const t=new Date();
    for(let i=0;i<12;i++){ const d=new Date(t); d.setDate(d.getDate()-i);
      const k=iso(d); DB.entries[k]=DB.entries[k]||{sym:{},act:{},nut:{}}; DB.entries[k].hf=3; }
    DB.profile.lastPeriod = (()=>{const d=new Date(t); d.setDate(d.getDate()-900); return iso(d);})();
    save(true); render();
  });
  await page.click('[data-act="tab"][data-v="trends"]'); await page.waitForTimeout(500);
  let ins = await page.locator('#app').innerText();
  check('surgical menopause: no months-since-period counter', !/months since your last logged period/i.test(ins));
  check('surgical menopause: explains why that count does not apply', /does not apply/i.test(ins));
  await page.click('[data-act="tab"][data-v="settings"]'); await page.waitForTimeout(250);
  await page.selectOption('#ov','kept'); await page.waitForTimeout(300);
  await page.evaluate(()=>{
    const iso = d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    const k = iso(new Date());
    DB.entries[k].bleed='light'; save(true); render();
  });
  await page.click('[data-act="tab"][data-v="trends"]'); await page.waitForTimeout(500);
  ins = await page.locator('#app').innerText();
  check('post-hysterectomy bleeding gets its own alert', /you have had a hysterectomy/i.test(ins));
  check('post-hysterectomy alert does not use the 12-month framing', !/Bleeding after 12\+ months/i.test(ins));
  // restore an ordinary profile for the rest of the suite
  await page.click('[data-act="tab"][data-v="settings"]'); await page.waitForTimeout(250);
  await page.selectOption('#ut','intact'); await page.waitForTimeout(200);
  await page.selectOption('#ov','kept'); await page.waitForTimeout(300);
  await page.evaluate(()=>{ DB.profile.lastPeriod=''; DB.entries={}; save(true); render(); });

  const prefill = await page.evaluate(()=>{
    const yesterday=addDays(todayISO(),-1);
    DB.entries={}; DB.entries[yesterday]={hf:2,ns:1,sym:{fog:3,energy:1,joint:0,anx:2},act:{},nut:{}};
    const copied=prefillTodayFromYesterday(), today=DB.entries[todayISO()];
    DB.entries={}; save(true); render();
    return {copied,source:today&&today.prefilledFrom,hf:today&&today.hf,fog:today&&today.sym.fog};
  });
  check('Today truthfully prefills the compact check-in from yesterday', prefill.copied && prefill.source && prefill.hf===2 && prefill.fog===3, JSON.stringify(prefill));

  console.log('\n== 3. Today check-in interactions ==');
  await page.evaluate(()=>{
    curTab='today'; curDate=todayISO();
    DB.entries[curDate]={sym:{},act:{},nut:{}};
    save(true); render();
  });
  check('unanswered Today tile prompts for a level', /Choose level/.test(await page.locator('.tw-tile').filter({hasText:'Brain fog'}).innerText()));
  await page.locator('[data-act="set"][data-k="hf"][data-v="2"]').click();
  await page.waitForTimeout(150);
  const compactTap = await page.evaluate(()=>({
    value:DB.entries[todayISO()].hf,
    pressed:document.querySelector('[data-act="set"][data-k="hf"][data-v="2"]')?.getAttribute('aria-pressed'),
    text:document.querySelector('.tw-tile')?.textContent
  }));
  check('Today offers direct, non-cycling choices', compactTap.value===2 && compactTap.pressed==='true', JSON.stringify(compactTap));
  check('Today shows the selected choice in plain language', /2 flashes/.test(compactTap.text||''), JSON.stringify(compactTap));
  await page.evaluate(()=>{ DB.entries[todayISO()].hf=0; save(true); render(); });
  await goTodayDetails(page); await page.waitForTimeout(300);
  check('detailed daily log opens', (await page.locator('.today-view').count())===1);
  await page.click('[data-act="hf"][data-n="1"]');
  await page.click('[data-act="hf"][data-n="1"]');
  await page.click('[data-act="hf"][data-n="1"]');
  await page.waitForTimeout(200);
  check('hot flash stepper increments', (await page.locator('.stepper .val').innerText())==='3');
  await page.click('[data-act="hf"][data-n="-1"]');
  await page.waitForTimeout(150);
  check('stepper decrements', (await page.locator('.stepper .val').innerText())==='2');
  await page.locator('[data-act="set"][data-k="ns"][data-v="2"]').click();
  await page.waitForTimeout(200);
  check('night sweat scale sets', (await page.locator('[data-act="set"][data-k="ns"][data-v="2"]').getAttribute('aria-pressed'))==='true');
  await page.fill('#inbed','8');
  await page.fill('#slept','6');
  await page.waitForTimeout(250);
  await page.click('[data-act="tab"][data-v="settings"]'); await page.waitForTimeout(150);
  await goTodayDetails(page); await page.waitForTimeout(250);
  check('sleep efficiency computed & persisted', (await page.locator('#app').innerText()).includes('75%'));
  await page.locator('[data-act="set"][data-k="sym.mood"][data-v="3"]').click();
  await page.locator('[data-act="set"][data-k="sym.anx"][data-v="2"]').click();
  await page.locator('[data-act="set"][data-k="sym.fog"][data-v="2"]').click();
  await page.locator('[data-act="set"][data-k="sym.joint"][data-v="1"]').click();
  await page.waitForTimeout(200);
  check('burden score withheld on a partial day', !(await page.locator('#app').innerText()).includes("burden score"));
  for(const k of ['dry','uri','energy','head']){
    await page.locator(`[data-act="set"][data-k="sym.${k}"][data-v="1"]`).click();
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(200);
  check('burden score appears once 8 symptoms filled', (await page.locator('#app').innerText()).includes("burden score"));
  check('burden score published without a severity band', !/mild range|moderate range|severe range/.test(await page.locator('#app').innerText()));
  await page.fill('#wt','168');
  await page.fill('#wa','36');
  await page.waitForTimeout(200);
  await page.locator('[data-act="toggle"][data-k="act.res"]').click();
  await page.fill('#aero','35');
  await page.fill('#alc','1');
  await page.fill('#notes','test note');
  await page.waitForTimeout(300);
  // reload to confirm persistence
  await page.reload(); await page.waitForTimeout(500);
  await goTodayDetails(page); await page.waitForTimeout(250);
  const todayTxt = await page.locator('#app').innerText();
  check('data persisted across reload (weight)', (await page.inputValue('#wt'))==='168');
  check('data persisted across reload (notes)', (await page.inputValue('#notes'))==='test note');
  check('strength chip persisted', (await page.locator('[data-act="toggle"][data-k="act.res"]').getAttribute('aria-pressed'))==='true');

  console.log('\n== 4. Past-day editing ==');
  const dayBtns = page.locator('.dayscroll button');
  await dayBtns.nth(10).click(); await page.waitForTimeout(250);
  check('editing-past-day notice', (await page.locator('#app').innerText()).includes('editing a past day'));
  await page.click('[data-act="hf"][data-n="1"]'); await page.waitForTimeout(150);
  await dayBtns.nth(13).click(); await page.waitForTimeout(250);
  check('back to today', !(await page.locator('#app').innerText()).includes('editing a past day'));

  console.log('\n== 5. Seeded 45 days -> trends & insights ==');
  await page.addInitScript(d=>{ try{ localStorage.setItem('menocompass.v1', JSON.stringify(d)); }catch(e){} }, seed());
  await page.goto(`${baseUrl}/index.html`); await page.waitForTimeout(500);
  await page.click('[data-act="tab"][data-v="trends"]'); await page.waitForTimeout(500);
  const tr = await page.locator('#app').innerText();
  check('tiles render', /flashes\/day/i.test(tr));
  check('charts render', (await page.locator('svg.chart').count())>=4, 'count='+(await page.locator('svg.chart').count()));
  check('insights render', (await page.locator('.callout').count())>=3);
  check('strength insight present', /Strength training/.test(tr));
  check('alcohol pattern insight honest wording', /not proof of cause/.test(tr) || /personal pattern/.test(tr));
  check('vaginal symptom insight fires', /progressive/.test(tr));
  for(const n of [7,30,90]){
    await page.locator(`[data-act="range"][data-v="${n}"]`).click(); await page.waitForTimeout(300);
    check('range '+n+' renders', (await page.locator('svg.chart').count())>=1);
  }
  await page.locator('[data-act="range"][data-v="30"]').click(); await page.waitForTimeout(250);
  await page.screenshot({path:path.join(TEST_RESULTS, 'shot-trends.png'), fullPage:false});

  console.log('\n== 5b. Native Pro access ==');
  await page.evaluate(()=>{
    window.__MENO_NATIVE__=true;
    window.__MENO_PRO_ACTIVE__=false;
    window.__nativeMessages=[];
    window.ReactNativeWebView={postMessage:message=>window.__nativeMessages.push(JSON.parse(message))};
    curTab='today'; render();
  });
  const nativePersist = await page.evaluate(()=>{
    DB.profile.name='Native persistence check';
    save(true);
    const message=window.__nativeMessages.find(item=>item.type==='persist-state');
    const state=message&&JSON.parse(message.state);
    DB.profile.name='Test'; save(true);
    return {message,stateName:state&&state.profile&&state.profile.name};
  });
  check('native bridge receives the complete saved app state', nativePersist.message&&nativePersist.stateName==='Native persistence check', JSON.stringify(nativePersist));
  await page.click('[data-act="tab"][data-v="trends"]'); await page.waitForTimeout(150);
  const lockedPro = await page.evaluate(()=>({tab:curTab,messages:window.__nativeMessages,locked:document.querySelector('[data-v="trends"]').classList.contains('pro-locked')}));
  check('native trends are marked as Pro', lockedPro.locked);
  check('locked native trends stay on Today', lockedPro.tab==='today', JSON.stringify(lockedPro));
  check('locked native trends request the paywall', lockedPro.messages.some(x=>x.type==='open-pro-paywall'&&x.feature==='trends'), JSON.stringify(lockedPro));
  await page.evaluate(()=>openSheet('report')); await page.waitForTimeout(100);
  const lockedReport = await page.evaluate(()=>({messages:window.__nativeMessages,sheets:[...sheetStack]}));
  check('direct locked report requests the paywall', lockedReport.messages.some(x=>x.type==='open-pro-paywall'&&x.feature==='report'), JSON.stringify(lockedReport));
  check('direct locked report does not open behind the paywall', !lockedReport.sheets.includes('report'), JSON.stringify(lockedReport));
  await page.evaluate(()=>{ window.__MENO_PRO_ACTIVE__=true; window.dispatchEvent(new Event('menocompass-pro-changed')); });
  await page.click('[data-act="tab"][data-v="trends"]'); await page.waitForTimeout(150);
  check('active Pro customer can open trends', await page.evaluate(()=>curTab==='trends'));
  await page.evaluate(()=>{ window.__MENO_NATIVE__=false; window.__MENO_PRO_ACTIVE__=false; delete window.ReactNativeWebView; curTab='trends'; render(); });

  console.log('\n== 5c. Home visual language across primary screens ==');
  for(const [tab,title] of [['trends','Trends'],['meds','Medications'],['report','Doctor report'],['settings','Settings']]){
    await page.click(`[data-act="tab"][data-v="${tab}"]`); await page.waitForTimeout(120);
    check(tab+' uses the Home page header system', (await page.locator('.tw-screen .tw-heading h1').first().innerText())===title);
  }
  await goLearn(page); await page.waitForTimeout(150);
  check('evidence guide uses the Home page header system', (await page.locator('.tw-screen .tw-heading h1').first().innerText())==='Evidence guide');
  await goTodayDetails(page); await page.waitForTimeout(150);
  check('detailed daily log uses the Home page header system', (await page.locator('.tw-screen .tw-heading h1').first().innerText())==='Detailed daily log');

  console.log('\n== 6. Learn library: every module opens ==');
  await goLearn(page); await page.waitForTimeout(300);
  const modules = await page.locator('.rows .row').count();
  check('all 15 modules listed', modules===15, 'got '+modules);
  for(let i=0;i<modules;i++){
    await page.locator('.rows .row').nth(i).click();
    await page.waitForTimeout(220);
    const vis = await page.locator('.sheet').isVisible();
    const len = (await page.locator('.sheet').innerText()).length;
    check('module '+i+' opens with content', vis && len>120, 'len='+len);
    // open first two accordions if present
    const accs = page.locator('.sheet details.acc');
    const na = await accs.count();
    for(let j=0;j<Math.min(na,3);j++){ await accs.nth(j).locator('summary').click(); await page.waitForTimeout(60); }
    await page.click('[data-act="close"]'); await page.waitForTimeout(150);
  }

  console.log('\n== 7. Symptom library sub-sheets ==');
  await page.locator('.rows .row', {hasText:'Symptom library'}).click(); await page.waitForTimeout(250);
  const symCount = await page.locator('.sheet .rows .row').count();
  check('9 symptom cards', symCount===9, 'got '+symCount);
  for(let i=0;i<symCount;i++){
    await page.locator('.sheet .rows .row').nth(i).click(); await page.waitForTimeout(180);
    check('symptom '+i+' content', (await page.locator('.sheet').innerText()).length>300);
    await page.click('[data-act="close"]'); await page.waitForTimeout(120);
  }
  await page.click('[data-act="close"]'); await page.waitForTimeout(200);

  console.log('\n== 8. Tools ==');
  await page.click('[data-act="tab"][data-v="settings"]'); await page.waitForTimeout(300);
  const toolNames = ['Protein calculator','PHQ-9 mood check','GAD-7 anxiety check','Sleep window calculator','Paced breathing','Progressive muscle relaxation','28-day trigger test','Waist reference'];
  for(const t of toolNames){
    await page.locator('.row', {hasText:t}).first().click(); await page.waitForTimeout(250);
    check('tool opens: '+t, (await page.locator('.sheet').innerText()).length>150);
    await page.click('[data-act="close"]'); await page.waitForTimeout(120);
  }

  console.log('\n== 9. Protein calculator math ==');
  await page.locator('.row', {hasText:'Protein calculator'}).first().click(); await page.waitForTimeout(250);
  await page.fill('#ptw','150');
  await page.waitForTimeout(200);
  const pOut = await page.locator('#prot-out').innerText();
  // 150 lb = 68.04 kg * 1.2 = 81.6 -> 82
  check('protein grams correct for 150lb @1.2', /82/.test(pOut), pOut.replace(/\n/g,' '));
  await page.selectOption('#ptg','1.6'); await page.waitForTimeout(250);
  const pOut2 = await page.locator('#prot-out').innerText();
  check('protein grams correct @1.6', /109/.test(pOut2), pOut2.replace(/\n/g,' '));
  await page.click('[data-act="close"]'); await page.waitForTimeout(150);

  console.log('\n== 10. PHQ-9 scoring + safety branch ==');
  await page.locator('.row', {hasText:'PHQ-9'}).first().click(); await page.waitForTimeout(250);
  for(let i=0;i<9;i++){
    await page.locator(`[data-act="q-a"][data-i="${i}"][data-v="2"]`).click();
    await page.waitForTimeout(70);
  }
  await page.waitForTimeout(200);
  const phq = await page.locator('.sheet').innerText();
  check('PHQ-9 total = 18', /Score: 18 of 27/.test(phq), (phq.match(/Score: \d+ of \d+/)||[''])[0]);
  check('PHQ-9 band severe range label', /moderately severe/.test(phq));
  check('item 9 safety callout fires', /988/.test(phq));
  check('measurement caveat present', /also score points/.test(phq));
  await page.click('[data-act="q-save"]'); await page.waitForTimeout(300);
  check('score saved to history', /your history/i.test(await page.locator('.sheet').innerText()));
  await page.click('[data-act="close"]'); await page.waitForTimeout(150);

  console.log('\n== 11. Sleep window calculator ==');
  await page.locator('.row', {hasText:'Sleep window'}).first().click(); await page.waitForTimeout(300);
  const sw = await page.locator('.sheet').innerText();
  check('uses logged sleep average', /actual sleep/i.test(sw), sw.slice(0,240).replace(/\n/g,' '));
  check('bedtime computed', /Earliest bedtime/.test(sw));
  await page.fill('#swk','05:30'); await page.waitForTimeout(250);
  check('bedtime recomputes on wake change', /Earliest bedtime: 2[0-3]:/.test(await page.locator('#sw-out').innerText()), await page.locator('#sw-out').innerText());
  check('contraindication warning', /bipolar/i.test(await page.locator('.sheet').innerText()));
  await page.click('[data-act="close"]'); await page.waitForTimeout(150);

  console.log('\n== 12. Breathing + PMR animations ==');
  await page.locator('.row', {hasText:'Paced breathing'}).first().click(); await page.waitForTimeout(250);
  check('breathing warns it is not for hot flashes', /NOT recommended for hot flashes/.test(await page.locator('.sheet').innerText()));
  await page.click('[data-act="breath-start"]'); await page.waitForTimeout(700);
  check('breath cycle starts', /Breathe/.test(await page.locator('#breath-word').innerText()));
  await page.click('[data-act="breath-stop"]'); await page.waitForTimeout(200);
  await page.click('[data-act="close"]'); await page.waitForTimeout(150);
  await page.locator('.row', {hasText:'Progressive muscle'}).first().click(); await page.waitForTimeout(250);
  await page.click('[data-act="pmr-start"]'); await page.waitForTimeout(400);
  check('PMR first step shows', (await page.locator('#pmr-title').innerText())==='Settle');
  await page.click('[data-act="pmr-stop"]'); await page.waitForTimeout(150);
  await page.click('[data-act="close"]'); await page.waitForTimeout(150);

  console.log('\n== 13. Trigger test lifecycle ==');
  await page.locator('.row', {hasText:'28-day trigger'}).first().click(); await page.waitForTimeout(250);
  check('trigger tool leads with the honest caveat', /no clinical trials/.test(await page.locator('.sheet').innerText()));
  await page.selectOption('#trig','Alcohol');
  await page.click('[data-act="trig-start"]'); await page.waitForTimeout(300);
  const tg = await page.locator('.sheet').innerText();
  check('trigger test running', /Test running/.test(tg));
  check('baseline computed from prior 14 days', /before/i.test(tg));
  await page.click('[data-act="close"]'); await page.waitForTimeout(200);
  await goTodayDetails(page); await page.waitForTimeout(300);
  check('trigger banner on Today', /Trigger test day/.test(await page.locator('#app').innerText()));
  await page.click('[data-act="tab"][data-v="settings"]'); await page.waitForTimeout(200);
  await page.locator('.row', {hasText:'28-day trigger'}).first().click(); await page.waitForTimeout(250);
  await page.click('[data-act="trig-stop"]'); await page.waitForTimeout(250);
  check('trigger test can end early', /Test ended early/.test(await page.locator('.sheet').innerText()));
  await page.evaluate(()=>{
    DB.trigger={active:true, status:'running', item:'Alcohol', start:addDays(todayISO(),-28)};
    save(true);
    renderSheet();
  });
  await page.waitForTimeout(250);
  const completedTrigger = await page.evaluate(()=>DB.trigger);
  check('28-day trigger test auto-completes',
    completedTrigger.active===false && completedTrigger.status==='completed');
  check('completed trigger result is retained',
    /Test complete/.test(await page.locator('.sheet').innerText()));
  await page.click('[data-act="close"]'); await page.waitForTimeout(150);

  console.log('\n== 13b. Medication and lab workflow ==');
  await page.evaluate(()=>{ medFormOpen=false; labFormOpen=false; curTab='meds'; sheetStack=[]; renderSheet(); render(); }); await page.waitForTimeout(250);
  await page.click('[data-act="med-add"]');
  await page.fill('#med-name','Test gel 1mg'); await page.selectOption('#med-form','gel'); await page.fill('#med-due','09:30');
  await page.click('[data-act="med-save"]'); await page.waitForTimeout(250);
  check('medication form saves a scheduled medication', /Test gel 1mg/.test(await page.locator('#app').innerText()));
  await page.click('[data-act="lab-add"]'); await page.fill('#lab-name','FSH'); await page.fill('#lab-value','42'); await page.fill('#lab-unit','IU/L');
  await page.click('[data-act="lab-save"]'); await page.waitForTimeout(250);
  check('lab form saves a dated result', /FSH/.test(await page.locator('#app').innerText()) && /42 IU\/L/.test(await page.locator('#app').innerText()));
  await page.click('[data-act="tab"][data-v="today"]'); await page.waitForTimeout(200);
  const medicationButton=page.locator('[data-act="med-taken"]').last(); await medicationButton.click(); await page.waitForTimeout(200);
  check('medication adherence is stored on the selected date', await page.evaluate(()=>Object.values((DB.entries[todayISO()]&&DB.entries[todayISO()].med)||{}).some(x=>x.taken===true)));

  console.log('\n== 14. Screening tracker ==');
  const screeningRules = await page.evaluate(()=>{
    const originalProfile=Object.assign({},DB.profile);
    DB.profile.region='us';
    const cervical25=screeningStatus('cervical',25);
    const cervical25Intervals=screeningIntervals(SCREENING_RULES.cervical,25);
    DB.profile.region='uk';
    const uk45={mammo:screeningStatus('mammo',45),colon:screeningStatus('colon',45)};
    DB.profile=originalProfile;
    return {cervical25,cervical25Intervals,uk45};
  });
  check('US cervical reminders start at age 21', screeningRules.cervical25.eligible&&screeningRules.cervical25.due,
    JSON.stringify(screeningRules));
  check('ages 21–29 only receive the 3-year cervical interval',
    JSON.stringify(screeningRules.cervical25Intervals)==='[3]',JSON.stringify(screeningRules));
  check('US-timed reminders are suppressed outside the US',
    !screeningRules.uk45.mammo.due&&!screeningRules.uk45.colon.due,JSON.stringify(screeningRules));
  await goLearn(page); await page.waitForTimeout(250);
  await page.locator('.row', {hasText:'Preventive care'}).click(); await page.waitForTimeout(250);
  await page.locator('.sheet details.acc summary').first().click(); await page.waitForTimeout(150);
  await page.fill('#sc-dxa','2025-03-14'); await page.waitForTimeout(250);
  await page.click('[data-act="close"]'); await page.waitForTimeout(150);
  await page.locator('.row', {hasText:'Preventive care'}).click(); await page.waitForTimeout(250);
  check('screening date persisted', /mar/i.test(await page.locator('.sheet').innerText()));
  await page.click('[data-act="close"]'); await page.waitForTimeout(150);

  console.log('\n== 15. Clinician report ==');
  await page.click('[data-act="tab"][data-v="trends"]'); await page.waitForTimeout(300);
  await page.click('[data-act="sheet"][data-s="report"]'); await page.waitForTimeout(400);
  const rep = await page.locator('.sheet').innerText();
  check('report has symptom summary', /symptom summary/i.test(rep));
  check('report shows flashes per day', /hot flashes \/ day/i.test(rep));
  check('report shows burden', /symptom burden/i.test(rep));
  check('report lists bleeding events', /bleeding logged/i.test(rep));
  check('report includes notes digest', /recent notes/i.test(rep));
  check('report includes questionnaire scores', /questionnaire scores/i.test(rep));
  await page.screenshot({path:path.join(TEST_RESULTS, 'shot-report.png')});
  await page.click('[data-act="close"]'); await page.waitForTimeout(150);

  console.log('\n== 16. Export / import round trip ==');
  await page.click('[data-act="sheet"][data-s="data"]'); await page.waitForTimeout(300);
  const csv = await page.evaluate(()=>toCSV());
  check('CSV has header', csv.split('\n')[0].includes('hot_flashes'));
  check('CSV has ~45 data rows', csv.split('\n').filter(l=>/^\d{4}-/.test(l)).length>=44, csv.split('\n').filter(l=>/^\d{4}-/.test(l)).length);
  check('CSV includes questionnaire block', /questionnaire_date/.test(csv));
  const backup = await page.evaluate(()=>JSON.stringify(DB));
  await page.click('[data-act="close"]'); await page.waitForTimeout(200);
  await page.evaluate(()=>{ DB.entries={}; save(true); render(); });
  await page.waitForTimeout(300);
  await page.click('[data-act="tab"][data-v="settings"]'); await page.waitForTimeout(250);
  await page.click('[data-act="sheet"][data-s="data"]'); await page.waitForTimeout(300);
  await page.fill('#restore', backup);
  await page.click('[data-act="import-json"]'); await page.waitForTimeout(500);
  const restored = await page.evaluate(()=>Object.keys(DB.entries).length);
  check('import restored entries', restored>=45, 'got '+restored);
  // bad import
  await page.click('[data-act="sheet"][data-s="data"]'); await page.waitForTimeout(300);
  await page.fill('#restore','not json');
  await page.click('[data-act="import-json"]'); await page.waitForTimeout(350);
  check('bad import rejected gracefully', /not look like a valid backup/.test(await page.locator('body').innerText()));
  await page.click('[data-act="close"]'); await page.waitForTimeout(200);

  console.log('\n== 17. Units switch ==');
  await page.selectOption('#un','metric'); await page.waitForTimeout(400);
  check('metric labels appear', /kg/.test(await page.locator('#app').innerText()));
  await goTodayDetails(page); await page.waitForTimeout(300);
  const wtMetric = await page.inputValue('#wt');
  check('weight converted to kg', Math.abs(parseFloat(wtMetric)-76)<2.5, wtMetric);
  await page.click('[data-act="tab"][data-v="settings"]'); await page.waitForTimeout(200);
  await page.selectOption('#un','imperial'); await page.waitForTimeout(400);
  await goTodayDetails(page); await page.waitForTimeout(300);
  const wtImp = await page.inputValue('#wt');
  check('weight round-trips to lb', Math.abs(parseFloat(wtImp) - parseFloat(wtMetric)*2.20462) < 0.6, wtImp+' vs '+wtMetric);

  console.log('\n== 18. Bone-status gating ==');
  await page.click('[data-act="tab"][data-v="settings"]'); await page.waitForTimeout(250);
  await page.selectOption('#bn','osteoporosis'); await page.waitForTimeout(300);
  await goLearn(page); await page.waitForTimeout(250);
  await page.locator('.row', {hasText:'Movement & strength'}).click(); await page.waitForTimeout(300);
  check('osteoporosis warning gates impact advice', /Skip the high-impact/.test(await page.locator('.sheet').innerText()));
  await page.click('[data-act="close"]'); await page.waitForTimeout(150);
  await page.click('[data-act="tab"][data-v="settings"]'); await page.waitForTimeout(200);
  await page.selectOption('#bn','unknown'); await page.waitForTimeout(300);
  await goLearn(page); await page.waitForTimeout(200);
  await page.locator('.row', {hasText:'Movement & strength'}).click(); await page.waitForTimeout(300);
  check('unknown bone status warning', /have not recorded your bone status/.test(await page.locator('.sheet').innerText()));
  await page.click('[data-act="close"]'); await page.waitForTimeout(150);

  console.log('\n== 19. Postmenopausal bleeding red flag ==');
  await page.evaluate(()=>{
    const iso = d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    const t=new Date();
    DB.profile.lastPeriod = (()=>{const d=new Date(t); d.setDate(d.getDate()-500); return iso(d);})();
    const k = iso(t);
    DB.entries[k] = DB.entries[k]||{sym:{},act:{},nut:{}};
    DB.entries[k].bleed='light';
    save(true);
  });
  await page.evaluate(()=>render());
  await page.click('[data-act="tab"][data-v="trends"]'); await page.waitForTimeout(500);
  const rf = await page.locator('#app').innerText();
  check('bleeding red flag insight fires', /Bleeding after 12\+ months/.test(rf));
  check('red flag cites the 90% figure', /90%/.test(rf));
  await page.locator('.callout.alert button').first().click(); await page.waitForTimeout(400);
  check('red flag sheet opens from insight', /need care promptly|Red flags/i.test(await page.locator('.sheet').innerText()));
  await page.click('[data-act="close"]'); await page.waitForTimeout(150);

  console.log('\n== 20. Theme, dark mode, a11y basics ==');
  await page.click('[data-act="tab"][data-v="settings"]'); await page.waitForTimeout(250);
  await page.selectOption('#th','dark'); await page.waitForTimeout(400);
  check('dark theme applied', (await page.getAttribute('html','data-theme'))==='dark');
  await page.screenshot({path:path.join(TEST_RESULTS, 'shot-dark.png')});
  await page.selectOption('#th','light'); await page.waitForTimeout(300);
  check('light theme applied', (await page.getAttribute('html','data-theme'))==='light');
  const noLabel = await page.evaluate(()=>{
    const bad=[];
    document.querySelectorAll('input,select,textarea').forEach(el=>{
      const id=el.id;
      if(!id || !document.querySelector('label[for="'+id+'"]')) bad.push(el.outerHTML.slice(0,60));
    });
    return bad;
  });
  check('all form controls have labels', noLabel.length===0, JSON.stringify(noLabel).slice(0,300));
  const fontLoaded = await page.evaluate(async()=>{
    await document.fonts.ready;
    return document.fonts.check('700 29px "Bricolage Grotesque"');
  });
  check('Bricolage Grotesque loads locally', fontLoaded);
  check('primary navigation is labelled', (await page.locator('nav[aria-label="Primary"]').count())===1);
  check('navigation icons are decorative', await page.locator('nav.tabs svg:not([aria-hidden="true"])').count()===0);
  const tapTargets = await page.evaluate(()=>{
    let small=0;
    document.querySelectorAll('button').forEach(b=>{ const r=b.getBoundingClientRect(); if(r.width>0 && (r.height<40)) small++; });
    return small;
  });
  check('no undersized tap targets', tapTargets===0, 'small='+tapTargets);

  console.log('\n== 21. PWA plumbing ==');
  const shellAssets = [
    '/',
    '/index.html',
    '/manifest.webmanifest',
    '/sw.js',
    '/privacy.html',
    '/support.html',
    '/terms.html',
    '/assets/fonts/bricolage-grotesque-latin.woff2',
    '/icons/apple-touch-icon.png',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/icons/maskable-512.png'
  ];
  for(const asset of shellAssets){
    const response = await ctx.request.get(baseUrl+asset);
    check(`asset ${asset} returns 200`, response.status()===200, `status=${response.status()}`);
  }
  const manifestResponse = await ctx.request.get(`${baseUrl}/manifest.webmanifest`);
  const man = await manifestResponse.json();
  check('manifest name', !!man.name);
  check('manifest standalone', man.display==='standalone');
  check('manifest has 3 icons', man.icons.length===3);
  check('manifest maskable icon', man.icons.some(i=>i.purpose==='maskable'));
  for(const icon of man.icons){
    const iconUrl = new URL(icon.src, `${baseUrl}/manifest.webmanifest`).href;
    const response = await ctx.request.get(iconUrl);
    check(`manifest icon ${icon.src} loads`, response.status()===200, `status=${response.status()}`);
  }
  const swReg = await page.evaluate(async()=>{
    const r = await navigator.serviceWorker.getRegistration();
    return !!r;
  });
  check('service worker registered', swReg);
  const offline = await page.evaluate(async()=>{
    const names = await caches.keys();
    const cache = await caches.open('meno-compass-v5');
    const keys = await cache.keys();
    return {names, paths:keys.map(request=>new URL(request.url).pathname)};
  });
  check('v5 shell cache exists', offline.names.includes('meno-compass-v5'), JSON.stringify(offline.names));
  check('stale v4 shell cache removed', !offline.names.includes('meno-compass-v4'), JSON.stringify(offline.names));
  check('stale v3 shell cache removed', !offline.names.includes('meno-compass-v3'), JSON.stringify(offline.names));
  check('stale v2 shell cache removed', !offline.names.includes('meno-compass-v2'), JSON.stringify(offline.names));
  check('stale v1 shell cache removed', !offline.names.includes('meno-compass-v1'), JSON.stringify(offline.names));
  const expectedCached = [
    '/', '/index.html', '/manifest.webmanifest', '/assets/fonts/bricolage-grotesque-latin.woff2', '/icons/apple-touch-icon.png',
    '/icons/icon-192.png', '/icons/icon-512.png', '/icons/maskable-512.png'
  ];
  check('all shell assets precached', expectedCached.every(asset=>offline.paths.includes(asset)), JSON.stringify(offline.paths));
  // offline reload
  await ctx.setOffline(true);
  await page.reload({waitUntil:'domcontentloaded'}).catch(()=>{});
  await page.waitForTimeout(600);
  check('app loads offline', (await page.locator('nav.tabs').count())>0);
  await ctx.setOffline(false);

  console.log('\n== 22. Storage-blocked fallback ==');
  const ctx2 = await browser.newContext({viewport:{width:390,height:844}});
  const p2 = await ctx2.newPage();
  monitorPage(p2, 'nostorage', baseUrl);
  await p2.addInitScript(()=>{
    Object.defineProperty(window,'localStorage',{get(){ throw new Error('blocked'); }});
  });
  await p2.goto(`${baseUrl}/index.html`);
  await p2.waitForTimeout(500);
  check('app still boots with storage blocked', await p2.getByText('Welcome to MenoCompass').isVisible());
  await p2.click('[data-act="ob-skip"]'); await p2.waitForTimeout(400);
  check('deferred setup remains visible on Today', await p2.getByText('Finish your setup').isVisible());
  await p2.click('[data-act="finish-setup"]'); await p2.waitForTimeout(300);
  check('setup reminder returns to editable profile', (await p2.locator('#pn').count())===1 && await p2.evaluate(()=>document.activeElement?.id==='pn'));
  await p2.click('[data-act="tab"][data-v="today"]'); await p2.waitForTimeout(250);
  await p2.locator('[data-act="set"][data-k="hf"][data-v="1"]').click(); await p2.waitForTimeout(250);
  check('in-memory logging works', await p2.evaluate(()=>DB.entries[todayISO()]?.hf===1));
  await p2.click('[data-act="tab"][data-v="settings"]'); await p2.waitForTimeout(300);
  check('ephemeral warning shown to user', /cannot save to disk/.test(await p2.locator('#app').innerText()));
  await ctx2.close();

  console.log('\n== 23. Empty-state trends ==');
  const ctx3 = await browser.newContext({viewport:{width:390,height:844}});
  const p3 = await ctx3.newPage();
  monitorPage(p3, 'empty', baseUrl);
  await p3.goto(`${baseUrl}/index.html`); await p3.waitForTimeout(400);
  await p3.click('[data-act="ob-skip"]'); await p3.waitForTimeout(400);
  await p3.click('[data-act="tab"][data-v="trends"]'); await p3.waitForTimeout(300);
  check('empty trends state', /Nothing to chart yet/.test(await p3.locator('#app').innerText()));
  await goLearn(p3); await p3.waitForTimeout(250);
  check('learn works with no data', (await p3.locator('.rows .row').count())===15);
  await p3.click('[data-act="tab"][data-v="settings"]'); await p3.waitForTimeout(200);
  await p3.click('[data-act="sheet"][data-s="report"]'); await p3.waitForTimeout(200);
  check('modal moves focus inside and makes background inert', await p3.evaluate(()=>
    !!document.activeElement.closest('.sheet') && document.getElementById('app').hasAttribute('inert')
  ));
  check('empty report does not turn missing night sweats into zero',
    (await p3.locator('.kv',{hasText:'Night sweats'}).locator('b').innerText())==='not tracked');
  check('empty report does not turn missing strength into zero',
    (await p3.locator('.kv',{hasText:'Strength sessions'}).locator('b').innerText())==='not tracked');
  check('empty report does not turn missing alcohol into zero',
    (await p3.locator('.kv',{hasText:'Alcohol (28 d)'}).locator('b').innerText())==='not tracked');
  await p3.click('[data-act="close"]'); await p3.waitForTimeout(150);
  check('closing modal restores its trigger and background access', await p3.evaluate(()=>
    document.activeElement?.dataset?.s==='report' && !document.getElementById('app').hasAttribute('inert')
  ));
  await ctx3.close();

  console.log('\n== 23b. Migration of v1 single-field surgical history ==');
  const ctx4 = await browser.newContext({viewport:{width:390,height:844}});
  const p4 = await ctx4.newPage();
  monitorPage(p4, 'migrate', baseUrl);
  await p4.addInitScript(()=>{
    localStorage.setItem('menocompass.v1', JSON.stringify({
      v:1, profile:{name:'Legacy', birthYear:1970, units:'metric', region:'us', uterus:'oophor', onboarded:true},
      entries:{}, screening:{}, scores:[]
    }));
  });
  await p4.goto(`${baseUrl}/index.html`); await p4.waitForTimeout(500);
  const mig = await p4.evaluate(()=>({u:DB.profile.uterus, o:DB.profile.ovaries, surg:surgicalMenopause(), per:periodsPossible()}));
  check('legacy "oophor" maps to uterus intact + both ovaries removed', mig.u==='intact' && mig.o==='both', JSON.stringify(mig));
  check('legacy record recognised as surgical menopause', mig.surg===true);
  check('legacy record knows periods are not possible', mig.per===false);
  const mig2 = await p4.evaluate(()=>{
    localStorage.setItem('menocompass.v1', JSON.stringify({v:1, profile:{uterus:'both', onboarded:true}, entries:{}, screening:{}, scores:[]}));
    load(); return {u:DB.profile.uterus, o:DB.profile.ovaries};
  });
  check('legacy "both" maps to hysterectomy + both ovaries removed', mig2.u==='hyst' && mig2.o==='both', JSON.stringify(mig2));

  console.log('\n== 23c. Backup sanitisation and CSV formula defence ==');
  const sanitised = await p4.evaluate(()=>{
    const date=todayISO();
    let unsupportedRejected=false;
    try{ validateBackup({v:999,profile:{},entries:{}}); }catch(e){ unsupportedRejected=true; }
    const cross=validateBackup({
      v:2,profile:{birthYear:1970,onboarded:true,lastPeriod:'1960-01-01',surgeryDate:'1960-01-01'},
      entries:{'1960-01-01':{hf:2}},screening:{},scores:[],
      trigger:{active:true,status:'running',item:'Alcohol',start:date,ended:date}
    });
    DB=validateBackup({
      v:2,
      profile:{name:'"><img id="xss-probe" src=x onerror="window.pwned=1">',birthYear:'not-a-year',region:'bad',onboarded:true},
      entries:{[date]:{hf:9999,notes:'=1+1',sym:{mood:99},unknown:'drop me'}},
      screening:{notARealScreen:{last:date}},
      scores:[{date,type:'phq9',score:27,band:'minimal'}],
      unknownRoot:{secret:true}
    });
    curTab='you'; render();
    const csv=toCSV();
    return {
      schema:DB.v,
      unsupportedRejected,
      preBirthDatesCleared:!cross.profile.lastPeriod&&!cross.profile.surgeryDate&&!cross.entries['1960-01-01'],
      endedTriggerCanonical:cross.trigger&&!cross.trigger.active&&cross.trigger.status==='stopped'&&cross.trigger.ended===date,
      probe:!!document.querySelector('#xss-probe'),
      pwned:!!window.pwned,
      shown:document.querySelector('#app').textContent.includes('<img id="xss-probe"'),
      birthYear:DB.profile.birthYear,
      region:DB.profile.region,
      hf:DB.entries[date].hf,
      mood:DB.entries[date].sym.mood,
      unknownEntry:Object.prototype.hasOwnProperty.call(DB.entries[date],'unknown'),
      unknownRoot:Object.prototype.hasOwnProperty.call(DB,'unknownRoot'),
      unknownScreen:Object.prototype.hasOwnProperty.call(DB.screening,'notARealScreen'),
      scoreBand:DB.scores[0].band,
      csvFormulaNeutralised:csv.includes('"\'=1+1"')
    };
  });
  check('restored data migrates to schema v4', sanitised.schema===4, JSON.stringify(sanitised));
  check('unsupported backup schema is rejected', sanitised.unsupportedRejected, JSON.stringify(sanitised));
  check('dates before birth are discarded', sanitised.preBirthDatesCleared, JSON.stringify(sanitised));
  check('ended running trigger is canonicalised inactive', sanitised.endedTriggerCanonical, JSON.stringify(sanitised));
  check('backup HTML is rendered only as text', sanitised.shown && !sanitised.probe && !sanitised.pwned, JSON.stringify(sanitised));
  check('invalid profile values use safe defaults', sanitised.birthYear===null && sanitised.region==='us', JSON.stringify(sanitised));
  check('invalid and unknown entry fields are discarded', sanitised.hf==null && sanitised.mood==null && !sanitised.unknownEntry, JSON.stringify(sanitised));
  check('unknown root and screening fields are discarded', !sanitised.unknownRoot && !sanitised.unknownScreen, JSON.stringify(sanitised));
  check('questionnaire band is derived from its score', sanitised.scoreBand==='severe', JSON.stringify(sanitised));
  check('CSV user text cannot become a spreadsheet formula', sanitised.csvFormulaNeutralised, JSON.stringify(sanitised));
  await ctx4.close();

  console.log('\n== 24. Screenshots ==');
  await page.click('[data-act="tab"][data-v="today"]'); await page.waitForTimeout(400);
  await page.screenshot({path:path.join(TEST_RESULTS, 'shot-today.png')});
  await goLearn(page); await page.waitForTimeout(300);
  await page.screenshot({path:path.join(TEST_RESULTS, 'shot-learn.png')});
  await page.locator('.row',{hasText:'Treatment options'}).click(); await page.waitForTimeout(400);
  await page.locator('.sheet details.acc').nth(3).locator('summary').click(); await page.waitForTimeout(300);
  await page.screenshot({path:path.join(TEST_RESULTS, 'shot-treatment.png')});

  console.log('\n===== SUMMARY =====');
  console.log('failures: ' + fails.length);
  if(fails.length) fails.forEach(f=>console.log('  - '+f));
  console.log('console/page/network errors: ' + errors.length);
  errors.slice(0,12).forEach(e=>console.log('  ! '+e));
  process.exitCode = fails.length || errors.length ? 1 : 0;
  } catch(error) {
    console.error('\nFATAL: '+(error && error.stack ? error.stack : error));
    console.error('If Chromium is missing, run "npm run test:install" once.');
    process.exitCode = 1;
  } finally {
    if(browser) await browser.close().catch(()=>{});
    if(server.listening) await new Promise(resolve=>server.close(resolve));
  }
})();
