const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, 'dist');
const TEST_RESULTS = path.join(__dirname, 'test-results');
const MIME = {'.html':'text/html','.js':'application/javascript','.png':'image/png','.webmanifest':'application/manifest+json','.css':'text/css','.woff2':'font/woff2','.txt':'text/plain'};

const server = http.createServer((req,res)=>{
  let pathname;
  try { pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname); }
  catch { res.writeHead(400); res.end('bad request'); return; }
  if(pathname==='/') pathname='/index.html';
  const file=path.resolve(DIST,pathname.replace(/^\/+/,''));
  if(!file.startsWith(DIST+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){
    res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'}); res.end('not found'); return;
  }
  const headers={'Content-Type':MIME[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'};
  if(path.basename(file)==='sw.js') headers['Service-Worker-Allowed']='/';
  res.writeHead(200,headers); res.end(fs.readFileSync(file));
});

const failures=[];
const runtimeErrors=[];
function check(name,condition,extra){
  if(condition) console.log('  PASS  '+name);
  else { console.log('  FAIL  '+name+(extra?' :: '+extra:'')); failures.push(name); }
}
function monitor(page,label,baseUrl){
  page.on('console',msg=>{ if(msg.type()==='error') runtimeErrors.push(`CONSOLE(${label}): ${msg.text()}`); });
  page.on('pageerror',err=>runtimeErrors.push(`PAGEERROR(${label}): ${err.message}`));
  page.on('requestfailed',req=>{ if(req.url().startsWith(baseUrl)) runtimeErrors.push(`REQUESTFAILED(${label}): ${req.url()} :: ${req.failure()?.errorText||'unknown'}`); });
  page.on('response',res=>{ if(res.url().startsWith(baseUrl)&&res.status()>=400) runtimeErrors.push(`HTTP ${res.status()}(${label}): ${res.url()}`); });
}
function isoOffset(offset){
  const d=new Date(); d.setHours(12,0,0,0); d.setDate(d.getDate()+offset);
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
/* The night desk takes over the page between 22:00 and 06:00, so every
   browser context pins its clock to a fixed time of day (same calendar day). */
async function pinClock(context,hour,minute){
  await context.addInitScript(({hour,minute})=>{
    const RealDate=Date; const fixed=new RealDate(); fixed.setHours(hour,minute,0,0);
    const offset=fixed.getTime()-RealDate.now();
    class PinnedDate extends RealDate { constructor(...args){ if(args.length) super(...args); else super(RealDate.now()+offset); } static now(){ return RealDate.now()+offset; } }
    window.Date=PinnedDate;
  },{hour,minute});
}
function profile(overrides={}){
  return Object.assign({name:'Test',birthYear:1974,region:'us',units:'imperial',lastPeriod:'',surgeryDate:'',uterus:'intact',ovaries:'kept',bone:'unknown',proteinGpk:1.2,weightGoal:null,waistGoal:null,theme:'light',stage:null,stageAnswers:null,onboarded:true,onboardingVersion:4,onboardingStep:0,onboardingDeferred:false,intent:'understand',pinnedSymptoms:['hf','ns','fog','energy','joint','anx'],periodStatus:'gaps'},overrides);
}
function confirmed(payload){
  const copy=JSON.parse(JSON.stringify(payload));
  return Object.assign({},payload,{confirmed:true,draftDirty:false,confirmedData:copy});
}
/* Sixteen days with a legible shape: three afternoon flashes on five of
   every seven days, two night wakes between 02:00 and 04:00 on sweat nights. */
function seededState(dayCount=16,options={}){
  const entries={};
  for(let i=dayCount-1;i>=0;i--){
    const flashDay=i%7!==3&&i%7!==6, sweatNight=i%7<5;
    const moments=[];
    if(sweatNight){ moments.push({id:'w'+i+'a',t:'02:40',k:'woke'},{id:'s'+i,t:'02:41',k:'ns'},{id:'w'+i+'b',t:'03:30',k:'woke'}); }
    if(flashDay){ moments.push({id:'h'+i+'a',t:'13:10',k:'hf',s:2},{id:'h'+i+'b',t:'14:30',k:'hf',s:3},{id:'h'+i+'c',t:'15:20',k:'hf',s:1}); }
    else moments.push({id:'h'+i+'m',t:'09:15',k:'hf',s:1});
    const payload={hf:flashDay?3:1,ns:sweatNight?2:0,wakes:sweatNight?2:0,rating:(i%5),sym:{fog:sweatNight?2:0,energy:1+(i%3),joint:1,anx:i%2,sleepq:sweatNight?3:1},act:{res:i%4===0,aero:i%2?20:0},nut:{alc:i%5===0?1:0},sleepH:sweatNight?6:7.5,inBedH:8,notes:i===2?'A useful note.':'',moments};
    if(options.plain){ delete payload.moments; delete payload.wakes; delete payload.rating; }
    entries[isoOffset(-i)]=confirmed(payload);
  }
  return {v:options.plain?8:9,profile:profile(),entries,medications:[{id:'estradiol',name:'Estradiol patch',form:'patch',days:[0,1,2,3,4,5,6],due:'08:00',notes:'',started:isoOffset(-10),ended:'',changes:[{date:isoOffset(-3),label:'Changed from 25 mcg to 50 mcg'}]}],labs:[{id:'lab-1',name:'Estradiol',date:isoOffset(-5),value:'312',unit:'pmol/L'}],screening:{},scores:[],trigger:null,appointments:{questions:[],plans:[],brief:{concerns:[],goal:'',date:isoOffset(12)},evidence:[]},meta:{created:isoOffset(-dayCount),lastOpen:isoOffset(0)}};
}
async function injectState(context,state){
  await context.addInitScript(value=>localStorage.setItem('menocompass.v1',JSON.stringify(value)),state);
}
/* The native shell owns persistence: it re-injects the last persisted state on launch. */
async function nativeReload({context,page}){
  const persisted=await page.evaluate(()=>{ flush(); return window.__nativeMessages.filter(m=>m.type==='persist-state').slice(-1)[0].state; });
  await context.addInitScript(state=>{ window.__MENO_PERSISTED_STATE__=state; },persisted);
  await page.reload();
}
async function newPage(browser,baseUrl,label,{state=null,native=false,pro=true,hour=14,minute=14,viewport={width:390,height:844}}={}){
  const context=await browser.newContext({viewport,deviceScaleFactor:2});
  await pinClock(context,hour,minute);
  if(native) await context.addInitScript(({active,state})=>{
    window.__MENO_NATIVE__=true; window.__MENO_PRO_ACTIVE__=active; window.__nativeMessages=[];
    window.ReactNativeWebView={postMessage:payload=>window.__nativeMessages.push(JSON.parse(payload))};
    if(state) window.__MENO_PERSISTED_STATE__=JSON.stringify(state);
  },{active:pro,state});
  else if(state) await injectState(context,state);
  const page=await context.newPage(); monitor(page,label,baseUrl);
  page.on('dialog',dialog=>dialog.accept());
  return {context,page};
}

(async()=>{
  let browser;
  const contexts=[];
  try {
    check('root index mirror matches dist',fs.readFileSync(path.join(__dirname,'index.html')).equals(fs.readFileSync(path.join(DIST,'index.html'))));
    check('the app bundle has no mascot and no retired fonts',(()=>{ const html=fs.readFileSync(path.join(DIST,'index.html'),'utf8'); return !/__PIP_|pip-guide|Bricolage/.test(html)&&html.includes('fraunces-latin-opsz-normal.woff2')&&html.includes('instrument-sans-latin-wght-normal.woff2'); })());

    console.log('\n== Native and release contracts ==');
    const nativeApp=fs.readFileSync(path.join(__dirname,'mobile','App.native.tsx'),'utf8');
    const nativeTabBar=fs.readFileSync(path.join(__dirname,'mobile','NativeTabBar.native.tsx'),'utf8');
    const nativeTheme=fs.readFileSync(path.join(__dirname,'mobile','theme.ts'),'utf8');
    const review=fs.readFileSync(path.join(__dirname,'mobile','reviewPrompt.native.ts'),'utf8');
    const telemetry=fs.readFileSync(path.join(__dirname,'mobile','telemetry.native.ts'),'utf8');
    const metro=fs.readFileSync(path.join(__dirname,'mobile','metro.config.js'),'utf8');
    const expoApp=JSON.parse(fs.readFileSync(path.join(__dirname,'mobile','app.json'),'utf8')).expo;
    const dynamicAppConfig=fs.readFileSync(path.join(__dirname,'mobile','app.config.js'),'utf8');
    const widgetPrivacyManifest=fs.readFileSync(path.join(__dirname,'mobile','widgets','PrivacyInfo.xcprivacy'),'utf8');
    const eas=JSON.parse(fs.readFileSync(path.join(__dirname,'mobile','eas.json'),'utf8'));
    const mobilePackage=JSON.parse(fs.readFileSync(path.join(__dirname,'mobile','package.json'),'utf8'));
    const tiktokModuleConfig=JSON.parse(fs.readFileSync(path.join(__dirname,'mobile','modules','menocompass-tiktok-business','expo-module.config.json'),'utf8'));
    const reviewNotes=fs.readFileSync(path.join(__dirname,'mobile','APP_REVIEW_NOTES_2.0.0.md'),'utf8');
    const exportCompliance=fs.readFileSync(path.join(__dirname,'mobile','EXPORT_COMPLIANCE_1.2.0.md'),'utf8');
    const reviewNotesPayload=reviewNotes.split('## Paste into the Notes field')[1]?.split('## Submission attachments')[0]?.trim()||'';
    const releaseQa=fs.readFileSync(path.join(__dirname,'mobile','RELEASE_QA_1.2.0.md'),'utf8');
    const store=JSON.parse(fs.readFileSync(path.join(__dirname,'mobile','store.config.json'),'utf8'));
    const storeDescription=store.apple.info['en-US'].description;
    const supportCopy=fs.readFileSync(path.join(__dirname,'support.html'),'utf8');
    const privacyCopy=fs.readFileSync(path.join(__dirname,'privacy.html'),'utf8');
    check('the iOS shell opens the page without a subscription and offers Pro after the first finding',!nativeApp.includes('SubscriptionGate')&&!nativeApp.includes('OnboardingPreview')&&nativeApp.includes('offerProAfterFirstFinding();')&&nativeApp.includes("message?.type === 'open-pro-paywall'")&&nativeApp.includes("message?.type === 'restore-purchases'"));
    check('zero-price App Store offers fail closed',nativeApp.includes('introPrice?.price === 0'));
    check('native persistence refreshes the active snapshot',nativeApp.includes('setPersistedState(canonical)')&&nativeApp.includes('setExperienceReady(persistedStateIsOnboarded(canonical))'));
    check('store copy names what is free and what peri Pro unlocks',storeDescription.includes('The page, the ledger, the night desk, the finding of the day, the index and the first-page letter are free')&&storeDescription.includes('unlocks the dossier, the one-page brief, the treatment check-ins and the rehearsal')&&!storeDescription.includes('no free tier'));
    check('support and privacy describe the page, the dossier and You',supportCopy.includes('<strong>Dossier</strong>')&&supportCopy.includes('Close the day')&&supportCopy.includes('open <strong>You</strong>')&&privacyCopy.includes('From You under <strong>Export or restore</strong>')&&!/Open Profile|from Meds|open Settings/.test(supportCopy));
    check('review prompts follow successful check-ins at milestones 2, 5, and 20',review.includes('appReviewMilestones = [2, 5, 20] as const')&&review.includes('registerSuccessfulMoment')&&!review.includes('registerAppOpening'));
    check('direct marketing SDKs are excluded in favor of ATT-gated AppsFlyer',tiktokModuleConfig.platforms.length===0&&!mobilePackage.dependencies['react-native-fbsdk-next']&&!telemetry.includes('initializeTikTok'));
    check('EAS Update is configured for versioned production releases',!!mobilePackage.dependencies['expo-updates']&&expoApp.version===mobilePackage.version&&expoApp.runtimeVersion===`${expoApp.version}-instrument-1`&&expoApp.updates?.url===`https://u.expo.dev/${expoApp.extra.eas.projectId}`&&eas.build.production.channel==='production'&&eas.build.production.uploadSourceMaps===true&&mobilePackage.scripts['ota:production:ios']?.includes('env:exec production'));
    check('the native tab bar carries the three surfaces in the app’s own type',nativeTabBar.includes("['today', 'dossier', 'index']")&&!nativeTabBar.includes('SymbolView')&&!nativeTabBar.includes('GlassView')&&nativeTabBar.includes('font.sansMedium')&&nativeApp.includes('<NativeTabBar')&&nativeApp.includes("message?.type === 'navigation-state'")&&nativeApp.includes("['today', 'dossier', 'index'].includes(nativeNavigation.route)"));
    check('the native shell wears the web palette and embeds Fraunces and Instrument Sans',nativeTheme.includes("paper: '#fbfbf9'")&&nativeTheme.includes("vermilion: '#d13a16'")&&JSON.stringify(expoApp.plugins).includes('Fraunces72pt-Regular.ttf')&&JSON.stringify(expoApp.plugins).includes('InstrumentSans-Medium.ttf')&&!fs.existsSync(path.join(__dirname,'mobile','assets','fonts','Bricolage-Regular.ttf'))&&expoApp.ios.icon.dark.endsWith('icon-dark.png')&&JSON.stringify(expoApp.plugins).includes('"backgroundColor":"#fbfbf9"'));
    check('Expo Observe remains the performance and product-event layer',!!mobilePackage.dependencies['expo-observe']&&nativeApp.includes('ObserveRoot.wrap')&&nativeApp.includes('markInteractive')&&telemetry.includes('Observe.configure')&&telemetry.includes('Observe.logEvent'));
    check('sanitized Sentry diagnostics and consented Observe have separate gates',!!mobilePackage.dependencies['@sentry/react-native']&&dynamicAppConfig.includes('@sentry/react-native')&&metro.includes('getSentryExpoConfig')&&telemetry.includes('Observe.configure({ dispatchingEnabled: false')&&telemetry.includes('Observe.reportError(safeError(error))'));
    check('diagnostic privacy declarations and copy cover the new tracking runtime',dynamicAppConfig.includes('NSPrivacyCollectedDataTypeCrashData')&&privacyCopy.includes('Sentry')&&privacyCopy.includes('analytics starts off'));
    check('app and widget declare the App Group UserDefaults privacy reason',dynamicAppConfig.includes("APP_GROUP_DEFAULTS_REASON = '1C8F.1'")&&dynamicAppConfig.includes("plugins.push('./widgets/withWidgetPrivacyManifest.js')")&&widgetPrivacyManifest.includes('<string>1C8F.1</string>'));
    check('new custom encryption receives an explicit App Store determination',expoApp.ios?.config?.usesNonExemptEncryption==null&&exportCompliance.includes('AES.GCM')&&exportCompliance.includes('PBKDF2')&&releaseQa.includes('| Encryption export compliance |'));
    check('native exports use validated share and PDF bridges',!!mobilePackage.dependencies['expo-sharing']&&!!mobilePackage.dependencies['expo-print']&&nativeApp.includes("message?.type === 'share-file'")&&nativeApp.includes("message?.type === 'share-report'")&&nativeApp.includes('maxNativeShareContentLength')&&nativeApp.includes('Print.printToFileAsync')&&nativeApp.includes('Sharing.shareAsync'));
    check('native WebView allows zoom and text selection',nativeApp.includes('maximum-scale=5')&&!nativeApp.includes('user-scalable=no')&&nativeApp.includes('textInteractionEnabled'));
    check('versioned App Review notes cover the gated reviewer path and fit the Notes field',Buffer.byteLength(reviewNotesPayload,'utf8')<=4000&&reviewNotesPayload.length>0&&reviewNotes.includes('Restore Purchases')&&reviewNotes.includes('has no account')&&reviewNotes.includes('Manage Apple subscription'));
    const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'manifest.webmanifest'),'utf8'));
    const shortcutUrls=manifest.shortcuts.map(item=>item.url).join(' ');
    check('manifest shortcuts open the log, the dossier, the index and red flags',shortcutUrls.includes('#checkin')&&shortcutUrls.includes('#dossier')&&shortcutUrls.includes('#index')&&shortcutUrls.includes('#redflags')&&manifest.theme_color==='#fbfbf9');
    const serviceWorker=fs.readFileSync(path.join(__dirname,'sw.js'),'utf8');
    check('offline cache version was bumped with the new fonts and icons',serviceWorker.includes("const CACHE_PREFIX = 'meno-compass-'")&&serviceWorker.includes('${CACHE_PREFIX}v23')&&serviceWorker.includes('fraunces-latin-opsz-normal.woff2')&&!serviceWorker.includes('bricolage'));
    check('the native sync inlines every local font',fs.readFileSync(path.join(__dirname,'mobile','scripts','sync-web.cjs'),'utf8').includes('fontPattern'));

    fs.mkdirSync(TEST_RESULTS,{recursive:true});
    await new Promise((resolve,reject)=>{ server.once('error',reject); server.listen(0,'127.0.0.1',resolve); });
    const baseUrl=`http://127.0.0.1:${server.address().port}`;
    browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{})});

    console.log('\n== First run: a letter with blanks ==');
    const first=await newPage(browser,baseUrl,'first-run',{native:true}); contexts.push(first.context);
    const page=first.page;
    await page.goto(baseUrl+'/index.html');
    check('the first page is the letter',await page.getByRole('heading',{name:'Fill in the blanks. That is the whole setup.'}).isVisible()&&await page.locator('.masthead-nav').count()===0);
    check('the page cannot open before a concern is chosen',await page.getByRole('button',{name:'Open today’s page'}).isDisabled());
    for(const key of ['sleepq','hf','fog','ns']) await page.locator('[data-act="fr-symptom"][data-v="'+key+'"]').click();
    await page.getByLabel('Your age').fill('47');
    await page.locator('[data-act="fr-periods"][data-v="stopped"]').click();
    check('a stopped cycle asks how long ago before it stages anything',await page.locator('[data-act="fr-since"]').count()===3&&await page.getByRole('heading',{name:'Fill in the rest and the finding appears.'}).isVisible());
    await page.locator('[data-act="fr-since"][data-v="2to6"]').click();
    check('the elapsed time decides the postmenopause stage',await page.getByRole('heading',{name:'Postmenopause.'}).isVisible());
    await page.locator('[data-act="fr-periods"][data-v="gaps"]').click();
    check('the elapsed-time blank leaves with the stopped cycle',await page.locator('[data-act="fr-since"]').count()===0);
    await page.locator('[data-act="fr-appt"][data-v="yes"]').click();
    await page.getByLabel('Appointment date').fill(isoOffset(12));
    check('the finding appears from age, cycle and concerns',await page.getByRole('heading',{name:'Most likely: late perimenopause.'}).isVisible());
    await nativeReload(first);
    check('letter answers survive a reload without finishing',await page.evaluate(()=>!DB.profile.onboarded&&DB.profile.pinnedSymptoms.join(',')==='sleepq,hf,fog,ns'&&DB.profile.periodStatus==='gaps'&&DB.profile.birthYear===new Date().getFullYear()-47)&&await page.locator('[data-act="fr-symptom"][data-v="hf"][aria-pressed="true"]').count()===1);
    await page.locator('[data-act="fr-appt"][data-v="yes"]').click();
    await page.getByLabel('Appointment date').fill(isoOffset(12));
    await page.getByRole('button',{name:'Open today’s page'}).click();
    await page.waitForSelector('.page-today');
    const afterLetter=await page.evaluate(()=>({onboarded:DB.profile.onboarded,version:DB.profile.onboardingVersion,stage:DB.profile.stage,intent:DB.profile.intent,date:DB.appointments.brief.date,entries:entryDates().length,messages:window.__nativeMessages.filter(m=>m.type!=='persist-state').map(m=>m.type+(m.route?':'+m.route:''))}));
    check('finishing the letter stages, dates the appointment and invents no pages',afterLetter.onboarded&&afterLetter.version===4&&afterLetter.stage==='Late menopausal transition'&&afterLetter.intent==='appointment'&&afterLetter.date===isoOffset(12)&&afterLetter.entries===0,JSON.stringify(afterLetter));
    check('native bridge sees the letter and its completion',afterLetter.messages.includes('onboarding-step')&&afterLetter.messages.includes('onboarding-finished')&&afterLetter.messages.includes('navigation-state:today'),JSON.stringify(afterLetter.messages));
    const tabs=await page.locator('.masthead-nav button').allTextContents();
    check('the masthead has exactly Today, Dossier, Index',JSON.stringify(tabs)===JSON.stringify(['Today','Dossier','Index']),JSON.stringify(tabs));
    check('You is reachable from the masthead',await page.getByRole('button',{name:'You: profile, record and settings'}).isVisible());

    console.log('\n== Today’s page and the ledger ==');
    check('an empty record is said plainly',await page.locator('.finding .label').innerText().then(t=>t==='THE RECORD'||t==='The record')&&await page.getByText('Nothing on record yet. Log the first thing that happens.').isVisible()&&await page.locator('.ledger-row.empty').count()===1);
    check('the appointment countdown is on the page',await page.getByText(/Dossier · appointment in 12 days/).isVisible());
    await page.getByRole('button',{name:'Log',exact:true}).click();
    const logSheet=page.getByRole('dialog');
    check('the log sheet is black and leads with the always-on words',await page.locator('.sheet.night').count()===1&&await logSheet.locator('.bigrow').first().innerText().then(t=>t.startsWith('Hot flash'))&&await logSheet.getByRole('button',{name:'Log Night sweat now'}).isVisible()&&await logSheet.getByRole('button',{name:'Log Woke now'}).isVisible()&&await logSheet.getByRole('button',{name:'Log Brain fog now'}).isVisible());
    await logSheet.getByRole('button',{name:'Log Hot flash now'}).click();
    await logSheet.getByRole('button',{name:'Strong',exact:true}).click();
    await logSheet.getByRole('button',{name:'Log Brain fog now'}).click();
    await logSheet.getByRole('button',{name:/^More…/}).click();
    check('more words reveal the rest of the vocabulary',await logSheet.getByRole('button',{name:'Log Bleeding now'}).isVisible()&&await logSheet.getByRole('button',{name:'Log Palpitations now'}).isVisible());
    await logSheet.locator('.sheet-bar .done').click();
    const ledgerState=await page.evaluate(()=>{ const t=todayISO(), e=confirmedEntry(t); return {count:entryDates().length,hf:e.hf,fog:e.sym.fog,moments:e.moments.map(m=>m.k+':'+(m.s||'')),rows:document.querySelectorAll('.page-today button.ledger-row').length,confirmedEvents:window.__nativeMessages.filter(m=>m.type==='checkin-confirmed').length}; });
    check('one tap files a moment and the day counts at once',ledgerState.count===1&&ledgerState.hf===1&&ledgerState.fog===2&&JSON.stringify(ledgerState.moments)===JSON.stringify(['hf:3','fog:'])&&ledgerState.rows===2&&ledgerState.confirmedEvents===1,JSON.stringify(ledgerState));
    check('the record headline replaces the empty statement',await page.getByText('Day 1 of the record. Findings need about a week of pages.').isVisible());
    await page.locator('.page-today button.ledger-row').first().click();
    const momentSheet=page.getByRole('dialog');
    await momentSheet.getByRole('button',{name:'Mild',exact:true}).click();
    await momentSheet.getByLabel('Time').fill('11:02');
    await momentSheet.locator('.sheet-bar .done').click();
    const edited=await page.evaluate(()=>{ const m=dayMoments(todayISO())[0]; return {k:m.k,s:m.s,t:m.t,text:document.querySelector('.page-today .ledger-row .t').textContent}; });
    check('a ledger row can be re-timed and re-graded',edited.k==='hf'&&edited.s===1&&edited.t==='11:02'&&edited.text==='11:02',JSON.stringify(edited));
    await page.locator('.page-today button.ledger-row').last().click();
    await page.getByRole('dialog').getByRole('button',{name:'Delete this entry'}).click();
    check('deleting the last moment of a kind clears its day field',await page.evaluate(()=>{ const e=confirmedEntry(todayISO()); return e.sym.fog===undefined&&e.hf===1&&dayMoments(todayISO()).length===1; }));
    await page.getByRole('button',{name:'Close the day',exact:true}).click();
    const closeSheet=page.getByRole('dialog');
    check('close the day is one question and four facts',await closeSheet.locator('.words button').count()===5&&await closeSheet.locator('.check').count()===4&&await closeSheet.getByText('1 flash',{exact:false}).isVisible());
    await closeSheet.getByRole('button',{name:'Close the day',exact:true}).click();
    check('closing needs a word for the day',await page.getByRole('dialog').count()===1);
    await closeSheet.getByRole('button',{name:'Fair',exact:true}).click();
    await closeSheet.locator('.check[data-k="alcohol"]').click();
    await closeSheet.getByRole('button',{name:'Close the day',exact:true}).click();
    const closed=await page.evaluate(()=>{ const e=confirmedEntry(todayISO()); return {rating:e.rating,alc:e.nut.alc,res:e.act.res,bleed:e.bleed,button:document.querySelector('.actions .btn:not(.wide)').textContent.trim()}; });
    check('closing files the rating and explicit zeros',closed.rating===2&&closed.alc===1&&closed.res===false&&closed.bleed==='none'&&closed.button==='Closed · Fair',JSON.stringify(closed));
    await nativeReload(first);
    check('the page survives a reload',await page.getByRole('button',{name:'Closed · Fair'}).isVisible()&&await page.evaluate(()=>entryDates().length===1&&confirmedEntry(todayISO()).rating===2));
    await page.getByRole('button',{name:'Earlier pages'}).click();
    await page.getByRole('dialog').locator('[data-act="sheet"][data-s="day:'+isoOffset(-1)+'"]').click();
    await page.getByRole('dialog').locator('#past-kind').selectOption('ns');
    await page.getByRole('dialog').locator('#past-time').fill('02:15');
    await page.getByRole('dialog').getByRole('button',{name:'Add',exact:true}).click();
    const pastDay=await page.evaluate(d=>{ const e=confirmedEntry(d); return {ns:e&&e.ns,moment:e&&e.moments[0].t,today:confirmedEntry(todayISO()).ns}; },isoOffset(-1));
    check('an earlier page takes an entry without touching today',pastDay.ns===2&&pastDay.moment==='02:15'&&pastDay.today===undefined,JSON.stringify(pastDay)+' (an unrated sweat rolls up as moderate on the 0–4 scale)');
    await page.locator('.sheet-bar .done').click();
    await page.locator('.sheet-bar .done').click();
    await page.screenshot({path:path.join(TEST_RESULTS,'today-first-day.png')});

    console.log('\n== Findings and the dossier ==');
    const seeded=await newPage(browser,baseUrl,'seeded',{state:seededState(16),native:true}); contexts.push(seeded.context);
    const seededPage=seeded.page;
    await seededPage.goto(baseUrl+'/index.html');
    const findingIds=await seededPage.evaluate(()=>findings().map(f=>f.id));
    check('the ledger’s shape becomes findings',findingIds.includes('hf-cluster-afternoon')&&findingIds.includes('wake-window')&&findingIds.includes('sweat-wakes')&&findingIds.includes('fog-after-nights'),JSON.stringify(findingIds));
    const headline=await seededPage.locator('.finding h1').innerText();
    check('today’s page leads with a pattern, not a nag',/^Three flashes, all in the afternoon\. Your mornings are clear\.$|^Flashes cluster in the afternoon\.|^You wake between/.test(headline),headline);
    check('the headline says where it was filed',await seededPage.getByText(/Filed to the dossier as finding 0\d\./).isVisible());
    await seededPage.getByRole('button',{name:'Dossier',exact:true}).click();
    const sections=await seededPage.locator('.sec-head h2').allTextContents();
    check('the dossier has its seven numbered sections',JSON.stringify(sections)===JSON.stringify(['Where you are','Findings','Treatments','Questions','Evidence','After the visit','Opening statement']),JSON.stringify(sections));
    const stats=await seededPage.locator('.stats .stat .k').allTextContents();
    check('the stats strip counts down to the appointment',stats[0].includes('days to go')&&stats[1].includes('days recorded')&&await seededPage.locator('.stats .stat .v').first().innerText().then(t=>t.trim()==='12'),JSON.stringify(stats));
    check('findings carry a numeral, a window and a filed date',await seededPage.locator('.fnd').first().locator('.big').isVisible()&&await seededPage.locator('.fnd .note').first().innerText().then(t=>/^Filed /.test(t)));
    check('the dossier names the treatment and the stopped list honestly',await seededPage.locator('.sec').filter({hasText:'Treatments'}).getByText('Estradiol patch').isVisible());
    await seededPage.getByRole('button',{name:'Export the one-page brief'}).click();
    check('the brief is its own route',await seededPage.getByRole('heading',{name:'The brief.'}).isVisible()&&await seededPage.locator('.masthead-nav').count()===0&&await seededPage.getByText('Based on 16 recorded days').isVisible());
    check('the brief carries findings, treatments and a window label',await seededPage.locator('.report-page .rsec').filter({hasText:'Findings'}).isVisible()&&await seededPage.locator('.report-page').getByText('Changed from 25 mcg to 50 mcg').isVisible()&&await seededPage.locator('.report-page').getByText(/Summary · last 30 days/).isVisible());
    await seededPage.getByRole('button',{name:'30 days'}).click();
    check('range controls update the brief',await seededPage.locator('.report-page').getByText('Brief for the appointment · 30 days').isVisible());
    await seededPage.getByRole('button',{name:'Print or save as PDF'}).click();
    const nativeReportShare=await seededPage.evaluate(()=>window.__nativeMessages.filter(message=>message.type==='share-report').slice(-1)[0]);
    check('native report export sends the rendered brief without scripts',nativeReportShare?.name?.endsWith('.pdf')&&nativeReportShare?.html?.includes('Brief for the appointment · 30 days')&&!/<script\b/i.test(nativeReportShare?.html||''));
    const nativeFileShare=await seededPage.evaluate(()=>{ download('bridge-check.json','{"ok":true}','application/json'); return window.__nativeMessages.filter(message=>message.type==='share-file').slice(-1)[0]; });
    check('native data export bypasses WebView downloads with typed contents',nativeFileShare?.name==='bridge-check.json'&&nativeFileShare?.mime==='application/json'&&nativeFileShare?.contents==='{"ok":true}');
    const navState=await seededPage.evaluate(()=>window.__nativeMessages.filter(m=>m.type==='navigation-state').map(m=>m.route+':'+m.primary));
    check('navigation state names the surfaces as the shell knows them',navState.includes('dossier:true')&&navState.includes('appointment-report:false')&&!navState.some(entry=>entry.startsWith('journey')),JSON.stringify(navState));
    await seededPage.getByRole('button',{name:'Dossier',exact:true}).first().click();
    await seededPage.getByRole('button',{name:'Rehearse the opening'}).click();
    check('rehearsal asks for the brief when there is none',await seededPage.getByRole('dialog').getByText('Nothing to rehearse yet.').isVisible());
    await seededPage.locator('.sheet-bar .done').click();
    await seededPage.screenshot({path:path.join(TEST_RESULTS,'dossier.png'),fullPage:true});

    console.log('\n== The index ==');
    await seededPage.getByRole('button',{name:'Index',exact:true}).click();
    check('the index quotes her own ledger before any chapter',await seededPage.locator('.ask-ledger').innerText().then(t=>t.startsWith('In your ledger:')));
    check('chapters are grouped and numbered',await seededPage.locator('.entry').count()===15+9&&await seededPage.locator('.entry .path').first().innerText().then(t=>t==='CHAPTER 1 OF 15'||t==='Chapter 1 of 15'));
    await seededPage.getByRole('searchbox',{name:'Search the index'}).fill('waking at 3 am');
    check('a question finds the sleep chapter first',await seededPage.locator('#index-results .entry .head').first().innerText().then(t=>t==='Sleep'));
    await seededPage.locator('#index-results .entry').first().click();
    const chapter=seededPage.getByRole('dialog');
    check('a chapter opens with its content and a pin',await chapter.getByRole('heading',{name:'Sleep',exact:true}).isVisible()&&await chapter.getByRole('button',{name:'Pin to the dossier'}).isVisible());
    await chapter.getByRole('button',{name:'Pin to the dossier'}).click();
    check('pinning a chapter files evidence',await seededPage.evaluate(()=>DB.appointments.evidence.length===1&&DB.appointments.evidence[0].ref==='learn:sleep')&&await chapter.getByRole('button',{name:'Unpin'}).isVisible());
    await chapter.locator('.sheet-bar .done').click();
    await seededPage.getByRole('button',{name:'Dossier',exact:true}).click();
    check('pinned evidence shows in the dossier',await seededPage.locator('.sec').filter({hasText:'Evidence'}).getByText('Sleep (chapter)').isVisible());

    console.log('\n== Pro gating on iOS ==');
    const locked=await newPage(browser,baseUrl,'pro-locked',{state:seededState(16),native:true,pro:false}); contexts.push(locked.context);
    await locked.page.goto(baseUrl+'/index.html#dossier');
    check('a locked dossier shows the offer, not the record',await locked.page.locator('.lock').isVisible()&&await locked.page.getByRole('button',{name:'Unlock peri Pro'}).isVisible()&&await locked.page.locator('.sec').count()===0);
    await locked.page.getByRole('button',{name:'Unlock peri Pro'}).click();
    const paywall=await locked.page.evaluate(()=>window.__nativeMessages.filter(m=>m.type==='open-pro-paywall').map(m=>m.feature));
    check('unlocking asks the native shell for the paywall by the surface name',paywall.includes('dossier')&&!paywall.includes('journey'),JSON.stringify(paywall));
    const lockMap=await locked.page.evaluate(()=>{ const ios=[nativeProLocked('dossier'),nativeProLocked('appointment-report'),nativeProLocked('today'),nativeProLocked('index')]; window.__MENO_NATIVE_SUBSCRIPTIONS__=false; const android=[nativeProLocked('dossier'),nativeProLocked('appointment-report')]; delete window.__MENO_NATIVE_SUBSCRIPTIONS__; return {ios,android}; });
    check('only the dossier and the brief are gated, and only where subscriptions exist',JSON.stringify(lockMap)===JSON.stringify({ios:[true,true,false,false],android:[false,false]}),JSON.stringify(lockMap));
    check('today, the log sheet and the index stay free',await locked.page.evaluate(()=>{ setRoute('today'); render(); return !!document.querySelector('.page-today'); })&&await locked.page.getByRole('button',{name:'Log',exact:true}).isVisible());

    console.log('\n== The night desk ==');
    const night=await newPage(browser,baseUrl,'night',{state:seededState(16),hour:3,minute:12}); contexts.push(night.context);
    await night.page.goto(baseUrl+'/index.html');
    check('between 22:00 and 06:00 the page is the night desk',await night.page.locator('.page-night').isVisible()&&await night.page.locator('.clock').innerText().then(t=>t==='03:12')&&await night.page.getByRole('button',{name:/^Woke/}).isVisible());
    await night.page.getByRole('button',{name:/^Woke/}).click();
    const nightState=await night.page.evaluate(()=>{ const m=dayMoments(todayISO()).filter(x=>x.k==='woke'); return {wakes:confirmedEntry(todayISO()).wakes,times:m.map(x=>x.t),heading:document.querySelector('.clock-sub').textContent,body:document.querySelector('.page-night .small').textContent}; });
    check('a wake files with the time and the desk counts it',nightState.times.includes('03:12')&&nightState.wakes===3&&nightState.heading==='Awake again.'&&nightState.body.startsWith('Fourth time tonight.'),JSON.stringify(nightState));
    await night.page.getByRole('button',{name:'Open today’s page'}).click();
    check('the page is one tap away at night',await night.page.locator('.page-today').isVisible());
    await night.page.screenshot({path:path.join(TEST_RESULTS,'night-desk.png')});

    console.log('\n== Migration and validation ==');
    const legacy=await newPage(browser,baseUrl,'migration-v4',{state:{v:4,profile:{name:'Legacy',birthYear:1970,region:'us',units:'metric',onboarded:true},entries:{[isoOffset(-2)]:{hf:4,sym:{fog:2},act:{},nut:{}}},medications:[],labs:[],screening:{},scores:[],trigger:null,meta:{created:isoOffset(-3)}}}); contexts.push(legacy.context);
    await legacy.page.goto(baseUrl+'/index.html');
    const migration=await legacy.page.evaluate(()=>({version:DB.v,count:entryDates().length,snapshot:!!confirmedEntry(Object.keys(DB.entries)[0]),pins:DB.profile.pinnedSymptoms.length,onboarded:DB.profile.onboarded,page:!!document.querySelector('.page-today')}));
    check('v4 logs migrate to v9 confirmed days and open the page',migration.version===9&&migration.count===1&&migration.snapshot&&migration.pins===6&&migration.onboarded&&migration.page,JSON.stringify(migration));
    const plain=await newPage(browser,baseUrl,'migration-v8',{state:seededState(16,{plain:true})}); contexts.push(plain.context);
    await plain.page.goto(baseUrl+'/index.html');
    const v8=await plain.page.evaluate(()=>({version:DB.v,count:entryDates().length,moments:dayMoments(todayISO()).length,headline:document.querySelector('.finding h1').textContent}));
    check('v8 records without a ledger still count and still read',v8.version===9&&v8.count===16&&v8.moments===0&&!/Nothing on record/.test(v8.headline),JSON.stringify(v8));
    const validation=await plain.page.evaluate(()=>{
      const raw=JSON.parse(JSON.stringify(DB)), t=todayISO();
      raw.entries[t].confirmedData.moments=[{id:'ok',t:'14:14',k:'hf',s:3},{id:'bad-time',t:'25:99',k:'hf'},{id:'bad-kind',t:'10:00',k:'unicorn'},{id:'bad-sev',t:'10:10',k:'fog',s:9},{id:'note',t:'09:00',k:'note',n:'<b>x</b>'.repeat(200)}];
      raw.entries[t].confirmedData.rating=7; raw.entries[t].confirmedData.wakes=-1;
      raw.appointments.evidence=[{id:'e1',date:t,kind:'chapter',text:'Sleep',ref:'learn:sleep'},{id:'e2',date:'not-a-date',text:'drop'},{text:'no id',date:t,kind:'weird'}];
      raw.findings={'wake-window':t,'BAD ID':t,'future':'2999-01-01'};
      const clean=validateBackup(raw);
      const e=clean.entries[t].confirmedData;
      return {moments:e.moments.map(m=>m.id+(m.s?':'+m.s:'')),noteLength:e.moments.find(m=>m.id==='note').n.length,rating:e.rating,wakes:e.wakes,evidence:clean.appointments.evidence.map(x=>x.id+':'+x.kind),findings:Object.keys(clean.findings)};
    });
    check('backup validation keeps the ledger strict',JSON.stringify(validation.moments)===JSON.stringify(['note','bad-sev','ok:3'])&&validation.noteLength===280&&validation.rating===undefined&&validation.wakes===undefined&&JSON.stringify(validation.evidence)===JSON.stringify(['e1:chapter','evidence-2:note'])&&JSON.stringify(validation.findings)===JSON.stringify(['wake-window']),JSON.stringify(validation));
    const csv=await plain.page.evaluate(()=>{ addMoment(todayISO(),{k:'hf',t:'16:00',s:2,n:'=SUM(1)'}); const text=toCSV(); return {header:text.split('\n')[0],ledger:text.includes('ledger_date,time,kind,severity_1_3,duration_s,hours,note'),escaped:text.includes('"\'=SUM(1)"')}; });
    check('CSV carries the day rating, wakes and a ledger table with formula-safe notes',csv.header.includes('day_rating_0_4')&&csv.header.includes('night_wakes')&&csv.ledger&&csv.escaped,JSON.stringify(csv));

    console.log('\n== Treatments and check-ins ==');
    const followupState=seededState(50);
    followupState.medications[0].started=isoOffset(-60); followupState.medications[0].changes=[];
    const followup=await newPage(browser,baseUrl,'treatment-followup',{state:followupState}); contexts.push(followup.context);
    const followupPage=followup.page;
    await followupPage.goto(baseUrl+'/index.html#care');
    const treatments=followupPage.getByRole('dialog');
    check('the native Care tab opens the treatments sheet over the dossier',await treatments.getByRole('heading',{name:'Treatments'}).isVisible()&&await followupPage.locator('.page-dossier').count()===1);
    await treatments.getByRole('button',{name:'Record a change'}).click();
    await treatments.getByLabel('Date').fill(isoOffset(-42));
    await treatments.getByLabel('What changed').fill('Dose increased to 50 mcg');
    await treatments.getByRole('checkbox',{name:'Hot flashes'}).check();
    await treatments.getByRole('checkbox',{name:'Brain fog'}).check();
    await treatments.getByRole('button',{name:'Save change'}).click();
    check('a treatment change with targets schedules two check-ins',await treatments.getByText(/2-week check · Estradiol patch/).isVisible()&&await treatments.getByText(/6-week check · Estradiol patch/).isVisible());
    await treatments.locator('.kv').filter({hasText:'6-week check'}).getByRole('button',{name:'Complete the check-in'}).click();
    check('the check-in shows matched baseline and outcome windows',await treatments.getByText('Matched 7-day windows.',{exact:true}).isVisible()&&await treatments.getByText(/7\/7.*before.*7\/7.*week 6/).first().isVisible());
    await treatments.getByLabel('Benefit noticed').selectOption('3');
    await treatments.getByLabel('Doses taken').selectOption('most');
    await treatments.getByLabel('Side effects',{exact:true}).selectOption('mild');
    await treatments.getByLabel('Side-effect details (optional)').fill('Brief breast tenderness');
    await treatments.getByLabel('To raise at the next appointment (optional)').fill('Should the dose stay the same?');
    await treatments.getByRole('button',{name:'Save check-in'}).click();
    const storedFollowUp=await followupPage.evaluate(()=>{
      const change=DB.medications[0].changes[0], clean=validateBackup(JSON.parse(JSON.stringify(DB))).medications[0].changes[0];
      const completedItem=treatmentFollowUpItems().find(item=>item.week===6);
      const recordedOutcome=treatmentComparisonData(completedItem).find(row=>row.key==='hf').current.average;
      const todayRecord=DB.entries[todayISO()].confirmedData, originalTodayHotFlashes=todayRecord.hf;
      todayRecord.hf=99;
      const outcomeAfterEdit=treatmentComparisonData(completedItem).find(row=>row.key==='hf').current.average;
      todayRecord.hf=originalTodayHotFlashes;
      const tampered=JSON.parse(JSON.stringify(DB)), tamperedChange=tampered.medications[0].changes[0];
      tamperedChange.baseline.windowStart=addDays(tamperedChange.date,-21); tamperedChange.baseline.windowEnd=addDays(tamperedChange.date,-15);
      tamperedChange.followUps[0].completed=addDays(tamperedChange.date,1);
      const sanitized=validateBackup(tampered).medications[0].changes[0];
      return {version:DB.v,targets:change.targets,baselineStart:change.baseline.windowStart,baselineHotFlashDays:change.baseline.values.hf.n,followUp:clean.followUps[0],outcomeStayedFrozen:recordedOutcome===outcomeAfterEdit,forgedBaselineRemoved:sanitized.baseline===null,prematureFollowUpRemoved:sanitized.followUps.length===0};
    });
    check('baseline and check-in answers survive strict backup validation',storedFollowUp.version===9&&JSON.stringify(storedFollowUp.targets)===JSON.stringify(['hf','fog'])&&storedFollowUp.baselineStart===isoOffset(-49)&&storedFollowUp.baselineHotFlashDays===7&&storedFollowUp.followUp.week===6&&storedFollowUp.followUp.benefit===3&&storedFollowUp.followUp.adherence==='most'&&storedFollowUp.followUp.sideEffectLevel==='mild'&&storedFollowUp.followUp.sideEffects==='Brief breast tenderness'&&storedFollowUp.followUp.outcome.values.hf.n===7&&storedFollowUp.outcomeStayedFrozen&&storedFollowUp.forgedBaselineRemoved&&storedFollowUp.prematureFollowUpRemoved,JSON.stringify(storedFollowUp));
    await treatments.locator('.sheet-bar .done').click();
    await followupPage.getByRole('button',{name:'Export the one-page brief'}).click();
    check('the brief includes the check-in with careful causality language',await followupPage.getByText('Treatment check-ins',{exact:true}).isVisible()&&await followupPage.getByText(/Clear benefit; most scheduled doses; side effects mild \(Brief breast tenderness\)/).isVisible()&&await followupPage.getByText(/Observed associations, not proof of cause/).isVisible());

    console.log('\n== Questions, plans and the treatment lifecycle ==');
    const planning=await newPage(browser,baseUrl,'planning',{state:seededState(16)}); contexts.push(planning.context);
    const planningPage=planning.page;
    await planningPage.goto(baseUrl+'/index.html#dossier');
    await planningPage.getByRole('button',{name:'Add a question'}).click();
    await planningPage.getByLabel('Question for your clinician').fill('Should we change the dose based on my tracked symptoms?');
    await planningPage.locator('.sec').filter({hasText:'Questions'}).getByRole('button',{name:'Add',exact:true}).click();
    check('a question joins the numbered list',await planningPage.locator('.qn .q').filter({hasText:'Should we change the dose based on my tracked symptoms?'}).isVisible());
    await planningPage.locator('.sec').filter({hasText:'After the visit'}).getByRole('button',{name:'Add',exact:true}).click();
    await planningPage.getByLabel('What was decided').fill('Keep the current dose and review after the lab result.');
    await planningPage.getByLabel('Next steps, one per line').fill('Book the lab\nTrack night sweats for two weeks');
    await planningPage.getByRole('button',{name:'Add plan',exact:true}).click();
    await planningPage.getByRole('button',{name:'Book the lab'}).click();
    await planningPage.locator('.sec').filter({hasText:'Treatments'}).getByRole('button',{name:'Manage'}).click();
    const lifecycle=planningPage.getByRole('dialog');
    await lifecycle.getByRole('button',{name:'Stop',exact:true}).click();
    await lifecycle.getByLabel('Reason (optional)').fill('Paused after clinician review');
    await lifecycle.getByRole('button',{name:'Save as stopped'}).click();
    check('stopping a treatment keeps its record and removes it from the day',await lifecycle.getByText(/Stopped .*Paused after clinician review/).isVisible()&&await planningPage.evaluate(()=>scheduledMeds(todayISO()).length===0));
    await lifecycle.getByRole('button',{name:'Archive',exact:true}).click();
    await lifecycle.locator('details.plain summary').filter({hasText:'1 archived'}).click();
    check('stopped treatments can be archived without deletion',await lifecycle.getByRole('button',{name:'Unarchive'}).isVisible());
    await lifecycle.locator('.sheet-bar .done').click();
    const planningState=await planningPage.evaluate(()=>{ const clean=validateBackup(JSON.parse(JSON.stringify(DB))); return {version:clean.v,question:clean.appointments.questions[0].text,plan:clean.appointments.plans[0],med:clean.medications[0].status,reason:clean.medications[0].stopReason}; });
    check('questions, plans and the lifecycle survive strict validation',planningState.version===9&&planningState.question==='Should we change the dose based on my tracked symptoms?'&&planningState.plan.summary==='Keep the current dose and review after the lab result.'&&planningState.plan.actions.length===2&&planningState.plan.actions[0].done===true&&planningState.med==='archived'&&planningState.reason==='Paused after clinician review',JSON.stringify(planningState));
    await planningPage.getByRole('button',{name:'Export the one-page brief'}).click();
    check('the brief carries the question, the plan and the stopped treatment',await planningPage.getByText('Should we change the dose based on my tracked symptoms?',{exact:true}).isVisible()&&await planningPage.getByText('Keep the current dose and review after the lab result.',{exact:true}).isVisible()&&await planningPage.getByText(/stopped .*Paused after clinician review/).isVisible());

    console.log('\n== You, data, reset and deletion ==');
    const you=await newPage(browser,baseUrl,'you',{state:seededState(3),native:true}); contexts.push(you.context);
    const youPage=you.page;
    await youPage.goto(baseUrl+'/index.html#profile');
    await youPage.evaluate(()=>{
      window.dispatchEvent(new CustomEvent('menocompass-native-privacy-result',{detail:{ok:true,deviceEncrypted:true,encryptedBackups:true,appLock:{available:true,enabled:false,label:'Face ID'},reminders:{permission:'not-determined',preferences:{dailyCheckIn:{enabled:false,hour:20,minute:0},treatmentFollowUp:{enabled:false,weekday:2,hour:10,minute:0}}}}}));
      window.dispatchEvent(new CustomEvent('menocompass-healthkit-result',{detail:{ok:true,status:{available:true,requestStatus:'shouldRequest',readOnly:true}}}));
    });
    check('You explains encryption, App Lock and reminders',await youPage.getByText('The record is encrypted at rest with a device-bound key.').isVisible()&&await youPage.getByRole('button',{name:'App Lock'}).isVisible()&&await youPage.getByRole('button',{name:'Save reminders'}).isVisible());
    await youPage.getByRole('button',{name:'App Lock'}).click();
    await youPage.locator('#daily-reminder-enabled').check();
    await youPage.getByLabel('Daily reminder time').fill('19:30');
    await youPage.getByRole('button',{name:'Save reminders'}).click();
    await youPage.getByRole('button',{name:'Connect',exact:true}).click();
    const nativePrivacyMessages=await youPage.evaluate(()=>window.__nativeMessages.filter(message=>['set-app-lock','configure-reminders','healthkit-sync'].includes(message.type)));
    check('privacy and Health controls use explicit native actions',nativePrivacyMessages.some(m=>m.type==='set-app-lock'&&m.enabled===true)&&nativePrivacyMessages.some(m=>m.type==='configure-reminders'&&m.requestPermission===true&&m.preferences.dailyCheckIn.hour===19&&m.preferences.dailyCheckIn.minute===30)&&nativePrivacyMessages.some(m=>m.type==='healthkit-sync'&&m.userInitiated===true));
    await youPage.getByRole('button',{name:/^Export or restore/}).click();
    await youPage.getByLabel('Backup password · at least 10 characters').fill('private-passphrase');
    await youPage.getByLabel('Confirm password').fill('private-passphrase');
    await youPage.getByRole('button',{name:'Save encrypted backup'}).click();
    check('encrypted export passes the canonical v9 record to native code',await youPage.evaluate(()=>window.__nativeMessages.some(m=>m.type==='export-encrypted-backup'&&m.password==='private-passphrase'&&JSON.parse(m.state).v===9)));
    await youPage.locator('.sheet-bar .done').click();
    check('appearance follows the setting: paper by default, night on request',await youPage.evaluate(()=>{ const was=document.documentElement.getAttribute('data-theme'); DB.profile.theme='dark'; applyTheme(); const dark=document.documentElement.getAttribute('data-theme'); const meta=document.querySelector('meta[name="theme-color"]').content; DB.profile.theme='light'; applyTheme(); return was==='light'&&dark==='dark'&&meta==='#000000'; }));
    await youPage.getByRole('button',{name:'Apple subscription'}).click();
    check('You exposes Apple subscription management on native',await youPage.evaluate(()=>window.__nativeMessages.some(m=>m.type==='open-subscription-management')));
    await youPage.getByRole('button',{name:/Redo the first page/}).click();
    await youPage.getByRole('dialog').getByRole('button',{name:'Redo it'}).click();
    const resetState=await youPage.evaluate(()=>({onboarded:DB.profile.onboarded,entries:Object.keys(DB.entries).length,medications:DB.medications.length,labs:DB.labs.length,name:DB.profile.name,letter:!!document.querySelector('.page-firstrun')}));
    check('redoing the first page keeps every record',!resetState.onboarded&&resetState.entries===3&&resetState.medications===1&&resetState.labs===1&&resetState.name==='Test'&&resetState.letter,JSON.stringify(resetState));
    const del=await newPage(browser,baseUrl,'delete',{state:seededState(3)}); contexts.push(del.context);
    await del.page.goto(baseUrl+'/index.html#profile');
    await del.page.getByRole('button',{name:/Delete everything/}).click();
    check('deletion separates Apple subscriptions',await del.page.getByRole('dialog').getByText('Apple subscriptions are separate').isVisible());
    await del.page.getByRole('dialog').getByRole('button',{name:'Cancel'}).click();
    check('cancel leaves the record intact',(await del.page.evaluate(()=>Object.keys(DB.entries).length))===3);
    await del.page.getByRole('button',{name:/Delete everything/}).click();
    await del.page.getByRole('dialog').getByRole('button',{name:'Delete permanently'}).click();
    const deletedState=await del.page.evaluate(()=>({onboarded:DB.profile.onboarded,name:DB.profile.name,entries:Object.keys(DB.entries).length,medications:DB.medications.length,labs:DB.labs.length,letter:!!document.querySelector('.page-firstrun')}));
    check('delete clears the record and returns to the letter',!deletedState.onboarded&&deletedState.name===''&&deletedState.entries===0&&deletedState.medications===0&&deletedState.labs===0&&deletedState.letter,JSON.stringify(deletedState));

    console.log('\n== Desktop and quick routes ==');
    const desktop=await newPage(browser,baseUrl,'desktop',{state:seededState(16),viewport:{width:1280,height:900}}); contexts.push(desktop.context);
    await desktop.page.goto(baseUrl+'/index.html#journey');
    const layout=await desktop.page.locator('#app').evaluate(el=>({width:el.getBoundingClientRect().width,left:el.getBoundingClientRect().left}));
    check('the desktop keeps the page as a centred column',layout.width<=560&&layout.left>300&&await desktop.page.locator('.page-dossier').count()===1&&await desktop.page.locator('.masthead-nav [aria-current="page"]').count()===1,JSON.stringify(layout));
    const quick=await newPage(browser,baseUrl,'quick-route',{state:seededState(16)}); contexts.push(quick.context);
    await quick.page.goto(baseUrl+'/index.html#checkin');
    check('the widget and shortcut route opens the log sheet',await quick.page.locator('.sheet.night').count()===1&&await quick.page.locator('.page-today').count()===1);
    await quick.page.goto(baseUrl+'/index.html#redflags');
    await quick.page.reload();
    check('the red-flags route still opens the sheet',await quick.page.getByRole('dialog').getByRole('heading',{name:'Red flags'}).isVisible());
    await desktop.page.screenshot({path:path.join(TEST_RESULTS,'dossier-desktop.png')});

    await require('./test-companion')({browser,baseUrl,check,monitor,seededState,newPage,nativeReload,isoOffset,testResults:TEST_RESULTS});
    for(const context of contexts) await context.close();
    check('no page, console, request, or HTTP errors',runtimeErrors.length===0,runtimeErrors.join(' | '));
  } catch(error){
    failures.push('unhandled test exception');
    console.error(error&&error.stack||error);
  } finally {
    if(browser) await browser.close().catch(()=>{});
    await new Promise(resolve=>server.close(()=>resolve()));
  }
  if(runtimeErrors.length) runtimeErrors.forEach(error=>console.log('  ERROR '+error));
  console.log(`\n${failures.length?'FAILED: '+failures.length+' check(s)':'ALL CHECKS PASSED'}`);
  if(failures.length) process.exitCode=1;
})();
