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
function profile(overrides={}){
  return Object.assign({name:'Test',birthYear:1974,region:'us',units:'imperial',lastPeriod:'',surgeryDate:'',uterus:'intact',ovaries:'kept',bone:'unknown',proteinGpk:1.2,weightGoal:null,waistGoal:null,theme:'dark',stage:null,stageAnswers:null,onboarded:true,onboardingStep:3,onboardingDeferred:false,intent:'understand',pinnedSymptoms:['hf','ns','fog','energy','joint','anx']},overrides);
}
function confirmed(payload){
  const copy=JSON.parse(JSON.stringify(payload));
  return Object.assign({},payload,{confirmed:true,draftDirty:false,confirmedData:copy});
}
function seededState(dayCount=16){
  const entries={};
  for(let i=dayCount-1;i>=0;i--){
    const payload={hf:1+(i%4),ns:i%3,sym:{fog:i%2,energy:1+(i%3),joint:1,anx:i%2},act:{res:i%4===0,aero:i%2?20:0},nut:{alc:i%5===0?1:0},sleepH:6.5+(i%2)*.5,inBedH:8,notes:i===2?'A useful note.':''};
    entries[isoOffset(-i)]=confirmed(payload);
  }
  return {v:5,profile:profile(),entries,medications:[{id:'estradiol',name:'Estradiol patch',form:'patch',days:[0,1,2,3,4,5,6],due:'08:00',notes:'',started:isoOffset(-10),ended:'',changes:[{date:isoOffset(-3),label:'Changed from 25 mcg to 50 mcg'}]}],labs:[{id:'lab-1',name:'Estradiol',date:isoOffset(-5),value:'312',unit:'pmol/L'}],screening:{},scores:[],trigger:null,meta:{created:isoOffset(-dayCount),lastOpen:isoOffset(0)}};
}
async function injectState(context,state){
  await context.addInitScript(value=>localStorage.setItem('menocompass.v1',JSON.stringify(value)),state);
}

(async()=>{
  let browser;
  try {
    check('root index mirror matches dist',fs.readFileSync(path.join(__dirname,'index.html')).equals(fs.readFileSync(path.join(DIST,'index.html'))));
    check('selected design reference is present',fs.existsSync(path.join(__dirname,'design-reference','daily-compass-selected.png')));

    console.log('\n== Native and release contracts ==');
    const nativeApp=fs.readFileSync(path.join(__dirname,'mobile','App.native.tsx'),'utf8');
    const review=fs.readFileSync(path.join(__dirname,'mobile','reviewPrompt.native.ts'),'utf8');
    const telemetry=fs.readFileSync(path.join(__dirname,'mobile','telemetry.native.ts'),'utf8');
    const expoApp=JSON.parse(fs.readFileSync(path.join(__dirname,'mobile','app.json'),'utf8')).expo;
    const dynamicAppConfig=fs.readFileSync(path.join(__dirname,'mobile','app.config.js'),'utf8');
    const widgetPrivacyManifest=fs.readFileSync(path.join(__dirname,'mobile','widgets','PrivacyInfo.xcprivacy'),'utf8');
    const eas=JSON.parse(fs.readFileSync(path.join(__dirname,'mobile','eas.json'),'utf8'));
    const mobilePackage=JSON.parse(fs.readFileSync(path.join(__dirname,'mobile','package.json'),'utf8'));
    const tiktokModuleConfig=JSON.parse(fs.readFileSync(path.join(__dirname,'mobile','modules','menocompass-tiktok-business','expo-module.config.json'),'utf8'));
    const tiktokSwift=fs.readFileSync(path.join(__dirname,'mobile','modules','menocompass-tiktok-business','ios','MenoCompassTikTokBusinessModule.swift'),'utf8');
    const reviewNotes=fs.readFileSync(path.join(__dirname,'mobile','APP_REVIEW_NOTES_1.1.0.md'),'utf8');
    const exportCompliance=fs.readFileSync(path.join(__dirname,'mobile','EXPORT_COMPLIANCE_1.1.0.md'),'utf8');
    const reviewNotesPayload=reviewNotes.split('## Paste into the Notes field')[1]?.split('## Submission attachments')[0]?.trim()||'';
    const releaseQa=fs.readFileSync(path.join(__dirname,'mobile','RELEASE_QA_1.1.0.md'),'utf8');
    const screenshotGenerator=fs.readFileSync(path.join(__dirname,'mobile','store-assets','generate-screenshots.js'),'utf8');
    const store=JSON.parse(fs.readFileSync(path.join(__dirname,'mobile','store.config.json'),'utf8'));
    const storeDescription=store.apple.info['en-US'].description;
    const supportCopy=fs.readFileSync(path.join(__dirname,'support.html'),'utf8');
    const privacyCopy=fs.readFileSync(path.join(__dirname,'privacy.html'),'utf8');
    check('inactive iOS entitlement is gated before WebView',nativeApp.indexOf("if (Platform.OS === 'ios' && !proActive)")>=0&&nativeApp.indexOf("if (Platform.OS === 'ios' && !proActive)")<nativeApp.lastIndexOf('<WebView'));
    check('RevenueCat paywall cannot show a close button',nativeApp.includes('displayCloseButton: false'));
    check('zero-price App Store offers fail closed',nativeApp.includes('introPrice?.price === 0'));
    check('native persistence refreshes the active snapshot',nativeApp.includes('setPersistedState(canonical)')&&nativeApp.includes('setExperienceReady(persistedStateIsOnboarded(canonical))'));
    check('store copy discloses no free tier or trial',storeDescription.includes('There is no free tier or free trial.'));
    check('store copy matches Journey and report ranges',storeDescription.includes('ONE COHERENT JOURNEY')&&storeDescription.includes('30-, 90-, or 180-day report')&&!storeDescription.includes('7, 30, and 90 days'));
    check('support and privacy use the new navigation',supportCopy.includes('In Care, add treatments and lab results')&&supportCopy.includes('open Profile')&&privacyCopy.includes('From Profile under <strong>Account &amp; data</strong>')&&!supportCopy.includes('from Meds')&&!supportCopy.includes('open Settings'));
    check('review prompts follow successful check-ins at milestones 2, 5, and 20',review.includes('appReviewMilestones = [2, 5, 20] as const')&&review.includes('registerSuccessfulMoment')&&!review.includes('registerAppOpening'));
    check('TikTok is initialized only through the ATT-gated native bridge',
      tiktokModuleConfig.apple.modules?.includes('MenoCompassTikTokBusinessModule')
      &&!tiktokModuleConfig.apple.appDelegateSubscribers
      &&tiktokSwift.includes('ATTrackingManager.trackingAuthorizationStatus != .notDetermined')
      &&telemetry.indexOf('await resolveTrackingPermission()')<telemetry.indexOf('initializeTikTok(permission)'));
    check('EAS Update is configured for versioned production releases',
      !!mobilePackage.dependencies['expo-updates']
      &&expoApp.runtimeVersion==='1.1.0-native-2'
      &&expoApp.updates?.url===`https://u.expo.dev/${expoApp.extra.eas.projectId}`
      &&eas.build.production.channel==='production'
      &&eas.build.production.uploadSourceMaps===true);
    const splashPlugin=expoApp.plugins.find(plugin=>Array.isArray(plugin)&&plugin[0]==='expo-splash-screen');
    check('branded native launch screen is explicitly configured',
      !!mobilePackage.dependencies['expo-splash-screen']
      &&splashPlugin?.[1]?.image==='./assets/icon.png'
      &&splashPlugin?.[1]?.backgroundColor==='#743D61');
    check('app and widget declare the App Group UserDefaults privacy reason',
      dynamicAppConfig.includes("APP_GROUP_DEFAULTS_REASON = '1C8F.1'")
      &&dynamicAppConfig.includes("plugins.push('./widgets/withWidgetPrivacyManifest.js')")
      &&widgetPrivacyManifest.includes('<string>1C8F.1</string>'));
    check('new custom encryption receives an explicit App Store determination',
      expoApp.ios?.config?.usesNonExemptEncryption==null
      &&exportCompliance.includes('AES.GCM')
      &&exportCompliance.includes('PBKDF2')
      &&releaseQa.includes('| Encryption export compliance |'));
    check('native exports use validated share and PDF bridges',
      !!mobilePackage.dependencies['expo-sharing']
      &&!!mobilePackage.dependencies['expo-print']
      &&nativeApp.includes("message?.type === 'share-file'")
      &&nativeApp.includes("message?.type === 'share-report'")
      &&nativeApp.includes('maxNativeShareContentLength')
      &&nativeApp.includes('Print.printToFileAsync')
      &&nativeApp.includes('Sharing.shareAsync'));
    check('native WebView allows zoom and text selection',
      nativeApp.includes('maximum-scale=5')
      &&!nativeApp.includes('user-scalable=no')
      &&nativeApp.includes('textInteractionEnabled'));
    check('versioned App Review notes cover the gated reviewer path and fit the Notes field',
      Buffer.byteLength(reviewNotesPayload,'utf8')<=4000
      &&reviewNotesPayload.length>0
      &&reviewNotes.includes('Restore Purchases')
      &&reviewNotes.includes('has no account')
      &&reviewNotes.includes('Manage Apple subscription')
      &&reviewNotes.includes('TikTok is not initialized until'));
    check('release QA record covers native devices, ATT, purchases, restore, and OTA',
      releaseQa.includes('Small iPhone')
      &&releaseQa.includes('Pro Max iPhone')
      &&releaseQa.includes('iPad (portrait + landscape)')
      &&releaseQa.includes('Restore on fresh install')
      &&releaseQa.includes('OTA smoke test'));
    check('store screenshot timing matches the 30-second in-app promise',screenshotGenerator.includes('about 30 seconds')&&!screenshotGenerator.includes('about 20 seconds'));
    const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'manifest.webmanifest'),'utf8'));
    const shortcutUrls=manifest.shortcuts.map(item=>item.url).join(' ');
    check('manifest uses the new Journey route',shortcutUrls.includes('#journey')&&!shortcutUrls.includes('#trends'));
    const serviceWorker=fs.readFileSync(path.join(__dirname,'sw.js'),'utf8');
    check('offline cache version was bumped',serviceWorker.includes("const CACHE_PREFIX = 'meno-compass-'")&&serviceWorker.includes('${CACHE_PREFIX}v10'));

    fs.mkdirSync(TEST_RESULTS,{recursive:true});
    await new Promise((resolve,reject)=>{ server.once('error',reject); server.listen(0,'127.0.0.1',resolve); });
    const baseUrl=`http://127.0.0.1:${server.address().port}`;
    browser=await chromium.launch({headless:true});

    console.log('\n== Onboarding and four-part shell ==');
    const onboardingContext=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});
    await onboardingContext.addInitScript(()=>{
      window.__MENO_NATIVE__=true;
      window.__MENO_PRO_ACTIVE__=true;
      window.__nativeMessages=[];
      window.ReactNativeWebView={postMessage:payload=>window.__nativeMessages.push(JSON.parse(payload))};
    });
    const page=await onboardingContext.newPage(); monitor(page,'onboarding',baseUrl);
    await page.goto(baseUrl+'/index.html');
    check('onboarding opens with the new promise',await page.getByRole('heading',{name:'Make sense of what’s changing.'}).isVisible());
    check('onboarding keeps health entries local',await page.getByText('Your health entries stay on this device.').isVisible());
    check('bottom navigation is hidden during setup',!(await page.locator('nav.tabs').isVisible()));
    await page.getByRole('button',{name:'Set up my compass'}).click();
    check('intent step is shown',await page.getByRole('heading',{name:'What would help most?'}).isVisible());
    await page.getByRole('button',{name:'See whether treatment helps'}).click();
    await page.getByRole('button',{name:'Continue'}).click();
    check('clinical context step is shown',await page.getByRole('heading',{name:'A few details change what guidance applies.'}).isVisible());
    await page.getByLabel('First name (optional)').fill('Maya');
    await page.getByLabel('Birth year').fill('1976');
    await page.getByLabel('Region').selectOption('us');
    await page.getByRole('button',{name:'Continue'}).click();
    check('focused symptom step is shown',await page.getByRole('heading',{name:'What should we watch?'}).isVisible());
    check('six focused symptoms are selected by default',await page.locator('.jc-pin-grid [aria-pressed="true"]').count()===6);
    await page.getByRole('button',{name:'Start my journey'}).click();
    check('setup finishes on the option #1 Today prompt',await page.getByRole('heading',{name:'How are you today?'}).isVisible());
    const onboardingEvents=await page.evaluate(()=>window.__nativeMessages.filter(message=>message.type!=='persist-state'));
    check('native bridge records onboarding steps and completion',
      onboardingEvents.some(message=>message.type==='onboarding-step'&&message.step===1)
      &&onboardingEvents.some(message=>message.type==='onboarding-finished'&&message.skipped===false),
      JSON.stringify(onboardingEvents));
    const tabs=await page.locator('nav.tabs button').allTextContents();
    check('shell has exactly Today, Journey, Care, Guide',JSON.stringify(tabs)===JSON.stringify(['Today','Journey','Care','Guide']),JSON.stringify(tabs));
    check('Tools, Safety, and Profile are global actions',await page.getByRole('button',{name:'Open tools'}).isVisible()&&await page.getByRole('button',{name:'Safety guidance'}).isVisible()&&await page.getByRole('button',{name:'Open Profile'}).isVisible());

    console.log('\n== Prominent tool access ==');
    const todayTools=page.getByRole('region',{name:'Quick tools'});
    const todayToolLabels=await todayTools.locator('.dc-tool b').allTextContents();
    check('Today surfaces Quick tools with three direct actions and the full library',
      await todayTools.isVisible()
      &&await todayTools.locator('.dc-tool').count()===3
      &&JSON.stringify(todayToolLabels)===JSON.stringify(['Breathe','Release tension','Mood check'])
      &&await todayTools.getByRole('button',{name:'Breathe — open Paced breathing'}).isVisible()
      &&await todayTools.getByRole('button',{name:'Release tension — open Progressive muscle relaxation'}).isVisible()
      &&await todayTools.getByRole('button',{name:'Mood check — open PHQ-9 mood check'}).isVisible()
      &&await todayTools.getByRole('button',{name:'See all 8 tools',exact:true}).isVisible(),
      JSON.stringify(todayToolLabels));
    const todayUrl=page.url();
    const breatheTrigger=todayTools.getByRole('button',{name:'Breathe — open Paced breathing'});
    await breatheTrigger.click();
    check('Today opens Paced breathing directly',
      await page.getByRole('dialog').getByRole('heading',{name:'Paced breathing',exact:true}).isVisible()
      &&await page.getByRole('dialog').getByText('6 breaths per minute',{exact:true}).isVisible());
    await page.getByRole('button',{name:'Close Paced breathing'}).click();
    await page.waitForFunction(()=>document.activeElement?.getAttribute('aria-label')==='Breathe — open Paced breathing');
    check('closing a direct tool preserves Today and restores its trigger',
      page.url()===todayUrl
      &&await page.getByRole('dialog').count()===0
      &&await breatheTrigger.evaluate(el=>document.activeElement===el)
      &&await page.evaluate(()=>breathTimer===null));
    await todayTools.getByRole('button',{name:'See all 8 tools',exact:true}).click();
    const toolsDialog=page.getByRole('dialog');
    const toolGroupShape=await toolsDialog.locator('.jc-tools-library > section').evaluateAll(groups=>groups.map(group=>({
      name:group.querySelector('h3')?.textContent?.trim()||'',
      count:group.querySelectorAll('.jc-tool-row').length
    })));
    check('All tools shows exactly eight tools in three useful groups',
      await toolsDialog.getByRole('heading',{name:'Tools',exact:true}).isVisible()
      &&await toolsDialog.locator('.jc-tool-row').count()===8
      &&JSON.stringify(toolGroupShape)===JSON.stringify([
        {name:'Quick relief',count:2},
        {name:'Check in',count:2},
        {name:'Plan & learn',count:4}
      ]),
      JSON.stringify(toolGroupShape));
    const waistRow=toolsDialog.getByRole('button',{name:/Waist reference/});
    await waistRow.scrollIntoViewIfNeeded();
    const libraryScrollTop=await toolsDialog.evaluate(el=>el.scrollTop);
    await waistRow.click();
    check('a nested tool clearly returns to the library',
      await page.getByRole('dialog').getByRole('heading',{name:'Waist reference',exact:true}).isVisible()
      &&await page.getByRole('button',{name:'Back to Tools'}).isVisible());
    await page.getByRole('button',{name:'Back to Tools'}).click();
    await page.waitForFunction(()=>document.activeElement?.dataset?.s==='tool:waist');
    check('returning from a nested tool restores library position and focus',
      await toolsDialog.evaluate((el,prior)=>el.scrollTop>=prior-2,libraryScrollTop)
      &&await toolsDialog.getByRole('button',{name:/Waist reference/}).evaluate(el=>document.activeElement===el));
    await toolsDialog.getByRole('button',{name:'Close Tools'}).click();
    await page.screenshot({path:path.join(TEST_RESULTS,'journey-shell-today.png')});

    console.log('\n== Draft, confirmation, and atomic update ==');
    check('Today starts with one clear Check in action',await page.locator('.dc-checkin').count()===1&&await page.getByRole('button',{name:/Check in/}).isVisible()&&await page.getByText('Log 14 confirmed days to start finding patterns.').isVisible()&&await page.getByRole('progressbar').getAttribute('aria-valuenow')==='0');
    await page.getByRole('button',{name:/Check in/}).click();
    check('check-in is focused and hides bottom navigation',await page.getByRole('heading',{name:'Today’s check-in'}).isVisible()&&!(await page.locator('nav.tabs').isVisible()));
    check('check-in explains the confirmation boundary',await page.getByText('Nothing counts in your patterns until you confirm.').isVisible());
    check('focused check-in has six symptom controls',await page.locator('.jc-check-row').count()===6);
    await page.getByRole('button',{name:'One more hot flash'}).click();
    await page.getByRole('button',{name:'One more hot flash'}).click();
    await page.getByRole('button',{name:'Night sweats: Moderate'}).click();
    await page.locator('.jc-back').click();
    check('unfinished work returns as a draft',await page.getByRole('button',{name:'Finish check-in'}).isVisible()&&await page.getByText('Log 14 confirmed days to start finding patterns.').isVisible()&&await page.getByRole('progressbar').getAttribute('aria-valuenow')==='0');
    await page.getByRole('button',{name:'Journey',exact:true}).click();
    check('drafts do not count as confirmed',await page.getByText('0 confirmed days').isVisible()&&await page.getByText('Weekly comparisons need at least 4 confirmed days in each window.').isVisible());
    await page.getByRole('button',{name:'Finish check-in'}).click();
    await page.getByRole('button',{name:'Confirm today’s log'}).click();
    check('confirming a check-in emits a native success moment',await page.evaluate(()=>window.__nativeMessages.some(message=>message.type==='checkin-confirmed')));
    check('confirmation has an explicit completion state',await page.getByRole('heading',{name:'Today is confirmed.'}).isVisible()&&await page.getByText('1 confirmed day').isVisible());
    await page.getByRole('button',{name:'Back to Journey'}).click();
    check('Journey uses the confirmed snapshot',await page.getByText(/Hot flashes: 2 flashes/).isVisible());
    await page.getByRole('button',{name:'Edit today'}).click();
    await page.getByRole('button',{name:'One more hot flash'}).click();
    await page.locator('.jc-back').click();
    const journeyDraftText=await page.locator('#app').innerText();
    check('editing preserves the prior confirmed snapshot',journeyDraftText.includes('Draft saved — confirmed version stays in patterns')&&journeyDraftText.includes('Hot flashes: 2 flashes')&&journeyDraftText.includes('1 confirmed day'));
    await page.getByRole('button',{name:'Finish check-in'}).click();
    await page.getByRole('button',{name:'Confirm today’s log'}).click();
    await page.getByRole('button',{name:'Back to Journey'}).click();
    const journeyUpdatedText=await page.locator('#app').innerText();
    check('reconfirmation updates in place without adding a day',journeyUpdatedText.includes('Hot flashes: 3 flashes')&&journeyUpdatedText.includes('1 confirmed day'));

    console.log('\n== Care, treatment events, report, Guide, and Profile ==');
    await page.getByRole('button',{name:'Care',exact:true}).click();
    check('Care uses the selected hierarchy',await page.getByRole('heading',{name:'Care'}).isVisible()&&await page.getByText('Today’s care').isVisible()&&await page.getByText('Appointments',{exact:true}).isVisible());
    await page.getByRole('button',{name:'Add treatment or change'}).click();
    await page.getByLabel('Medication and dose').fill('Estradiol patch');
    await page.getByLabel('What changed (optional)').fill('Started 25 mcg');
    await page.getByRole('button',{name:'Save medication'}).click();
    check('a dated treatment can be added',await page.locator('.jc-treatment').filter({hasText:'Estradiol patch'}).isVisible());
    await page.getByRole('button',{name:'Record change'}).click();
    await page.getByLabel('What changed?').fill('Changed from 25 mcg to 50 mcg');
    await page.getByRole('button',{name:'Save change'}).click();
    await page.getByRole('button',{name:'Journey',exact:true}).click();
    check('real treatment changes appear in Journey',await page.getByRole('heading',{name:'Estradiol patch changed'}).isVisible()&&await page.getByText('Observed association—not proof of cause and effect.').isVisible());
    await page.getByRole('button',{name:'Care',exact:true}).click();
    await page.getByRole('button',{name:'Prepare appointment report'}).click();
    check('report is a dedicated route',await page.getByRole('heading',{name:'Appointment report'}).isVisible()&&!(await page.locator('nav.tabs').isVisible()));
    check('report states confirmed provenance',await page.getByText(/Based on 1 confirmed day/).isVisible());
    await page.getByRole('button',{name:'30 days'}).click();
    check('range controls materially update the report',await page.getByText('Appointment report · 30 days').isVisible());
    await page.getByRole('button',{name:'Print / save as PDF'}).click();
    const nativeReportShare=await page.evaluate(()=>window.__nativeMessages.filter(message=>message.type==='share-report').slice(-1)[0]);
    check('native report export sends current rendered HTML without executable scripts',
      nativeReportShare?.name?.endsWith('.pdf')
      &&nativeReportShare?.html?.includes('Appointment report · 30 days')
      &&!/<script\b/i.test(nativeReportShare?.html||''));
    const nativeFileShare=await page.evaluate(()=>{
      download('bridge-check.json','{"ok":true}','application/json');
      return window.__nativeMessages.filter(message=>message.type==='share-file').slice(-1)[0];
    });
    check('native data export bypasses WebView downloads with typed contents',
      nativeFileShare?.name==='bridge-check.json'
      &&nativeFileShare?.mime==='application/json'
      &&nativeFileShare?.contents==='{"ok":true}');
    await page.getByRole('button',{name:'Back to Care'}).click();
    await page.getByRole('button',{name:'Guide',exact:true}).click();
    check('Guide starts with search and a recommendation',await page.getByRole('searchbox',{name:'Search Guide'}).isVisible()&&await page.getByText('For you').isVisible());
    const guideToolkit=page.getByRole('region',{name:'Tools for right now'});
    const guideToolLabels=await guideToolkit.locator('.jc-tool-card b').allTextContents();
    const guideToolkitPlacement=await guideToolkit.evaluate(el=>{
      const recommendation=document.querySelector('.jc-for-you');
      const results=document.querySelector('#guide-results');
      const before=node=>!!node&&!!(el.compareDocumentPosition(node)&Node.DOCUMENT_POSITION_FOLLOWING);
      return {top:el.getBoundingClientRect().top,viewport:window.innerHeight,beforeRecommendation:before(recommendation),beforeResults:before(results)};
    });
    check('Guide places four direct tools high on the page before education groups',
      await guideToolkit.isVisible()
      &&await guideToolkit.locator('.jc-tool-card').count()===4
      &&JSON.stringify(guideToolLabels)===JSON.stringify(['Breathe','Release tension','Plan sleep','Test a trigger'])
      &&await guideToolkit.getByRole('button',{name:'Breathe — open Paced breathing'}).isVisible()
      &&await guideToolkit.getByRole('button',{name:'Release tension — open Progressive muscle relaxation'}).isVisible()
      &&await guideToolkit.getByRole('button',{name:'Plan sleep — open Sleep window calculator'}).isVisible()
      &&await guideToolkit.getByRole('button',{name:'Test a trigger — open 28-day trigger test'}).isVisible()
      &&await guideToolkit.getByRole('button',{name:'See all 8 tools',exact:true}).isVisible()
      &&guideToolkitPlacement.top<guideToolkitPlacement.viewport
      &&guideToolkitPlacement.beforeRecommendation
      &&guideToolkitPlacement.beforeResults,
      JSON.stringify({labels:guideToolLabels,placement:guideToolkitPlacement}));
    const guideSleepTrigger=guideToolkit.getByRole('button',{name:'Plan sleep — open Sleep window calculator'});
    await guideSleepTrigger.click();
    check('Guide opens a featured tool directly',
      await page.getByRole('dialog').getByRole('heading',{name:'Sleep window calculator',exact:true}).isVisible());
    await page.getByRole('button',{name:'Close Sleep window calculator'}).click();
    await page.getByRole('searchbox',{name:'Search Guide'}).fill('sleep');
    check('Guide search filters visible modules',await page.getByRole('button',{name:/^Sleep /}).isVisible()&&!(await page.getByRole('button',{name:/^Treatment options /}).isVisible()));
    await page.getByRole('button',{name:'Open Profile'}).click();
    check('Profile is global, not a fifth tab',await page.getByRole('heading',{name:'Profile'}).isVisible()&&!(await page.locator('nav.tabs').isVisible()));
    await page.evaluate(()=>{
      window.dispatchEvent(new CustomEvent('menocompass-native-privacy-result',{detail:{ok:true,deviceEncrypted:true,encryptedBackups:true,appLock:{available:true,enabled:false,label:'Face ID'},reminders:{permission:'not-determined',preferences:{dailyCheckIn:{enabled:false,hour:20,minute:0},treatmentFollowUp:{enabled:false,weekday:2,hour:10,minute:0}}}}}));
      window.dispatchEvent(new CustomEvent('menocompass-healthkit-result',{detail:{ok:true,status:{available:true,requestStatus:'shouldRequest',readOnly:true}}}));
    });
    check('native privacy controls explain encryption, Face ID, and in-context reminders',
      await page.getByText('Your native MenoCompass record is encrypted at rest with a device-bound key.').isVisible()
      &&await page.getByRole('button',{name:'Turn on'}).isVisible()
      &&await page.getByRole('button',{name:'Save reminder settings'}).isVisible());
    await page.getByRole('button',{name:'Turn on'}).click();
    await page.locator('#daily-reminder-enabled').check();
    await page.getByLabel('Daily check-in reminder time').fill('19:30');
    await page.getByRole('button',{name:'Save reminder settings'}).click();
    await page.getByRole('button',{name:'Connect Apple Health'}).click();
    const nativePrivacyMessages=await page.evaluate(()=>window.__nativeMessages.filter(message=>['set-app-lock','configure-reminders','healthkit-sync'].includes(message.type)));
    check('privacy and Health controls use explicit native actions',
      nativePrivacyMessages.some(message=>message.type==='set-app-lock'&&message.enabled===true)
      &&nativePrivacyMessages.some(message=>message.type==='configure-reminders'&&message.requestPermission===true&&message.preferences.dailyCheckIn.hour===19&&message.preferences.dailyCheckIn.minute===30)
      &&nativePrivacyMessages.some(message=>message.type==='healthkit-sync'&&message.userInitiated===true));
    await page.getByRole('button',{name:'Export or restore data'}).click();
    check('native data tools offer a portable encrypted backup',await page.getByRole('button',{name:'Save encrypted backup'}).isVisible()&&await page.getByRole('button',{name:'Choose encrypted backup'}).isVisible());
    await page.getByLabel('Backup password · at least 10 characters').fill('private-passphrase');
    await page.getByLabel('Confirm password').fill('private-passphrase');
    await page.getByRole('button',{name:'Save encrypted backup'}).click();
    check('encrypted export passes the current canonical record to native code',await page.evaluate(()=>window.__nativeMessages.some(message=>message.type==='export-encrypted-backup'&&message.password==='private-passphrase'&&JSON.parse(message.state).v===7)));
    await page.getByRole('button',{name:'Close Export & import'}).click();
    check('selected daily pulse appearance is coherent',await page.getByText('Guided daily pulse',{exact:true}).isVisible()&&await page.evaluate(()=>{DB.profile.theme='light';applyTheme();return document.documentElement.getAttribute('data-theme')==='dark'&&document.querySelector('meta[name="theme-color"]').content==='#071416';}));
    check('Profile exposes reset and deletion controls',await page.getByRole('button',{name:'Reset onboarding'}).isVisible()&&await page.getByRole('button',{name:'Delete app profile & data'}).isVisible());
    await page.getByRole('button',{name:'Manage Apple subscription'}).click();
    check('native Profile exposes Apple subscription management',await page.evaluate(()=>window.__nativeMessages.some(message=>message.type==='open-subscription-management')));
    await page.getByRole('button',{name:'Safety guidance'}).click();
    check('Safety remains globally reachable',await page.getByRole('dialog').isVisible()&&await page.getByRole('heading',{name:'Red flags'}).isVisible());
    await page.getByRole('button',{name:/Close Red flags/}).click();

    console.log('\n== Reset onboarding and local-data deletion ==');
    const resetContext=await browser.newContext({viewport:{width:390,height:844}}); await injectState(resetContext,seededState(3));
    const resetPage=await resetContext.newPage(); monitor(resetPage,'reset-controls',baseUrl); await resetPage.goto(baseUrl+'/index.html#profile');
    await resetPage.getByRole('button',{name:'Reset onboarding'}).click();
    check('reset explains that health history is preserved',await resetPage.getByRole('dialog').getByText(/Only onboarding progress is reset/).isVisible());
    await resetPage.getByRole('dialog').getByRole('button',{name:'Reset onboarding',exact:true}).click();
    const resetState=await resetPage.evaluate(()=>({onboarded:DB.profile.onboarded,step:DB.profile.onboardingStep,entries:Object.keys(DB.entries).length,medications:DB.medications.length,labs:DB.labs.length,name:DB.profile.name}));
    check('reset restarts setup without erasing personal history',!resetState.onboarded&&resetState.step===0&&resetState.entries===3&&resetState.medications===1&&resetState.labs===1&&resetState.name==='Test',JSON.stringify(resetState));
    check('reset returns to the first onboarding screen',await resetPage.getByRole('heading',{name:'Make sense of what’s changing.'}).isVisible());

    const deleteContext=await browser.newContext({viewport:{width:390,height:844}}); await injectState(deleteContext,seededState(3));
    const deletePage=await deleteContext.newPage(); monitor(deletePage,'delete-controls',baseUrl); await deletePage.goto(baseUrl+'/index.html#profile');
    await deletePage.getByRole('button',{name:'Delete app profile & data'}).click();
    check('delete confirmation separates Apple subscriptions',await deletePage.getByRole('dialog').getByText('Apple subscriptions are separate').isVisible());
    await deletePage.getByRole('dialog').getByRole('button',{name:'Cancel'}).click();
    check('cancel leaves local data intact',(await deletePage.evaluate(()=>Object.keys(DB.entries).length))===3);
    await deletePage.getByRole('button',{name:'Delete app profile & data'}).click();
    await deletePage.getByRole('dialog').getByRole('button',{name:'Delete everything permanently'}).click();
    const deletedState=await deletePage.evaluate(()=>({onboarded:DB.profile.onboarded,name:DB.profile.name,entries:Object.keys(DB.entries).length,medications:DB.medications.length,labs:DB.labs.length}));
    check('delete clears the complete local profile and returns to setup',!deletedState.onboarded&&deletedState.name===''&&deletedState.entries===0&&deletedState.medications===0&&deletedState.labs===0&&await deletePage.getByRole('heading',{name:'Make sense of what’s changing.'}).isVisible(),JSON.stringify(deletedState));

    console.log('\n== Confirmed-data core contracts ==');
    const seededContext=await browser.newContext({viewport:{width:390,height:844}}); await injectState(seededContext,seededState(16));
    const seededPage=await seededContext.newPage(); monitor(seededPage,'seeded',baseUrl); await seededPage.goto(baseUrl+'/index.html#journey');
    check('calendar coverage unlocks weekly pattern language',await seededPage.getByText('16 confirmed days').isVisible()&&await seededPage.getByText('Calendar coverage: 7/7 recent days · 7/7 prior days.').isVisible()&&await seededPage.getByText('Comparisons are ready — keep confirming changes.').isVisible());
    check('seeded dated treatment change is on the timeline',await seededPage.getByRole('heading',{name:'Estradiol patch changed'}).isVisible());
    const atomic=await seededPage.evaluate(()=>{
      const t=todayISO(),before=confirmedEntry(t).hf,day=entry(t); day.hf=99; markEntryDraft(t); save(true);
      const report=reportSheet(30).body;
      return {before,confirmed:confirmedEntry(t).hf,draft:day.hf,count:entryDates().length,reportHas99:report.includes('>99<')};
    });
    check('poison drafts stay out of snapshots and reports',atomic.before===atomic.confirmed&&atomic.draft===99&&atomic.count===16&&!atomic.reportHas99,JSON.stringify(atomic));

    console.log('\n== Structured treatment follow-ups ==');
    const followupState=seededState(50);
    followupState.medications[0].started=isoOffset(-60);
    followupState.medications[0].changes=[];
    const followupContext=await browser.newContext({viewport:{width:390,height:844}}); await injectState(followupContext,followupState);
    const followupPage=await followupContext.newPage(); monitor(followupPage,'treatment-followup',baseUrl); await followupPage.goto(baseUrl+'/index.html#care');
    await followupPage.getByRole('button',{name:'Record change'}).click();
    await followupPage.getByLabel('Change date').fill(isoOffset(-42));
    await followupPage.getByLabel('What changed?').fill('Dose increased to 50 mcg');
    await followupPage.getByRole('checkbox',{name:'Hot flashes'}).check();
    await followupPage.getByRole('checkbox',{name:'Brain fog'}).check();
    await followupPage.getByRole('button',{name:'Save change'}).click();
    check('a treatment change captures targets and schedules two follow-ups',
      await followupPage.getByRole('heading',{name:'2-week check · Estradiol patch'}).isVisible()
      &&await followupPage.getByRole('heading',{name:'6-week check · Estradiol patch'}).isVisible());
    const sixWeekCard=followupPage.locator('.jc-followup-card').filter({has:followupPage.getByRole('heading',{name:'6-week check · Estradiol patch'})});
    await sixWeekCard.getByRole('button',{name:'Complete follow-up'}).click();
    check('follow-up shows matched baseline and outcome windows',
      await followupPage.getByText('Matched 7-day windows',{exact:true}).isVisible()
      &&await followupPage.getByText(/7\/7.*before.*7\/7.*week 6/).first().isVisible());
    await followupPage.screenshot({path:path.join(TEST_RESULTS,'treatment-followup.png'),fullPage:true});
    await followupPage.getByLabel('Benefit noticed').selectOption('3');
    await followupPage.getByLabel('Doses taken').selectOption('most');
    await followupPage.getByLabel('Side effects',{exact:true}).selectOption('mild');
    await followupPage.getByLabel('Side-effect details (optional)').fill('Brief breast tenderness');
    await followupPage.getByLabel('Anything to ask at your next appointment? (optional)').fill('Should the dose stay the same?');
    await followupPage.getByRole('button',{name:'Save follow-up'}).click();
    const storedFollowUp=await followupPage.evaluate(()=>{
      const change=DB.medications[0].changes[0], clean=validateBackup(JSON.parse(JSON.stringify(DB))).medications[0].changes[0];
      const completedItem=treatmentFollowUpItems().find(item=>item.week===6);
      const recordedOutcome=treatmentComparisonData(completedItem).find(row=>row.key==='hf').current.average;
      const todayRecord=DB.entries[todayISO()].confirmedData, originalTodayHotFlashes=todayRecord.hf;
      todayRecord.hf=99;
      const outcomeAfterEdit=treatmentComparisonData(completedItem).find(row=>row.key==='hf').current.average;
      todayRecord.hf=originalTodayHotFlashes;
      const tampered=JSON.parse(JSON.stringify(DB)), tamperedChange=tampered.medications[0].changes[0];
      tamperedChange.baseline.windowStart=addDays(tamperedChange.date,-21);
      tamperedChange.baseline.windowEnd=addDays(tamperedChange.date,-15);
      tamperedChange.followUps[0].completed=addDays(tamperedChange.date,1);
      const sanitized=validateBackup(tampered).medications[0].changes[0];
      return {
        version:DB.v,targets:change.targets,baselineStart:change.baseline.windowStart,
        baselineHotFlashDays:change.baseline.values.hf.n,followUp:clean.followUps[0],
        outcomeStayedFrozen:recordedOutcome===outcomeAfterEdit,
        forgedBaselineRemoved:sanitized.baseline===null,prematureFollowUpRemoved:sanitized.followUps.length===0
      };
    });
    check('baseline and follow-up answers survive strict backup validation',
      storedFollowUp.version===7
      &&JSON.stringify(storedFollowUp.targets)===JSON.stringify(['hf','fog'])
      &&storedFollowUp.baselineStart===isoOffset(-49)
      &&storedFollowUp.baselineHotFlashDays===7
      &&storedFollowUp.followUp.week===6
      &&storedFollowUp.followUp.benefit===3
      &&storedFollowUp.followUp.adherence==='most'
      &&storedFollowUp.followUp.sideEffectLevel==='mild'
      &&storedFollowUp.followUp.sideEffects==='Brief breast tenderness'
      &&storedFollowUp.followUp.outcome.values.hf.n===7
      &&storedFollowUp.outcomeStayedFrozen
      &&storedFollowUp.forgedBaselineRemoved
      &&storedFollowUp.prematureFollowUpRemoved,JSON.stringify(storedFollowUp));
    await followupPage.getByRole('button',{name:'Prepare appointment report'}).click();
    check('clinician report includes structured follow-up and careful causality language',
      await followupPage.getByText('Treatment follow-ups',{exact:true}).isVisible()
      &&await followupPage.getByText('Clear benefit',{exact:true}).isVisible()
      &&await followupPage.getByText('Most scheduled doses',{exact:true}).isVisible()
      &&await followupPage.getByText(/Mild · Brief breast tenderness/).isVisible()
      &&await followupPage.getByText('Observed association—not proof that the treatment caused the change.',{exact:true}).isVisible());

    console.log('\n== Appointment planning and treatment lifecycle ==');
    const planningContext=await browser.newContext({viewport:{width:390,height:844}}); await injectState(planningContext,seededState(16));
    const planningPage=await planningContext.newPage(); monitor(planningPage,'appointment-planning',baseUrl); await planningPage.goto(baseUrl+'/index.html#care');
    await planningPage.getByRole('button',{name:'Add question'}).click();
    await planningPage.getByLabel('Question for your clinician').fill('Should we change the dose before my next visit?');
    await planningPage.getByRole('button',{name:'Add question',exact:true}).click();
    await planningPage.getByRole('button',{name:'Edit',exact:true}).first().click();
    await planningPage.getByLabel('Question for your clinician').fill('Should we change the dose based on my tracked symptoms?');
    await planningPage.getByRole('button',{name:'Save question'}).click();
    check('appointment questions can be added and edited',await planningPage.getByText('Should we change the dose based on my tracked symptoms?',{exact:true}).isVisible());
    await planningPage.getByRole('button',{name:'Add plan'}).click();
    await planningPage.getByLabel('What you and your clinician decided').fill('Keep the current dose and review after the lab result.');
    await planningPage.getByLabel('Next steps · one per line').fill('Book the lab\nTrack night sweats for two weeks');
    await planningPage.getByRole('button',{name:'Add plan',exact:true}).click();
    await planningPage.getByRole('button',{name:'Book the lab'}).click();
    const treatmentRow=planningPage.locator('.jc-treatment.active').filter({hasText:'Estradiol patch'});
    await treatmentRow.getByRole('button',{name:'Stop',exact:true}).click();
    await planningPage.getByLabel('Reason or clinician instruction (optional)').fill('Paused after clinician review');
    await planningPage.getByRole('button',{name:'Save as stopped'}).click();
    check('stopping a treatment removes it from today while preserving its record',
      await planningPage.locator('.jc-treatment.stopped').filter({hasText:'Paused after clinician review'}).isVisible()
      &&!(await planningPage.locator('.jc-open-list').getByText('Estradiol patch',{exact:true}).isVisible()));
    planningPage.once('dialog',dialog=>dialog.accept());
    await planningPage.getByRole('button',{name:'Archive',exact:true}).click();
    await planningPage.getByText('1 archived treatment').click();
    check('stopped treatments can be archived without deletion',await planningPage.locator('.jc-treatment.archived').filter({hasText:'Estradiol patch'}).isVisible());
    await planningPage.screenshot({path:path.join(TEST_RESULTS,'appointment-planning-and-archive.png'),fullPage:true});
    const planningState=await planningPage.evaluate(()=>{
      const raw=JSON.parse(JSON.stringify(DB)), clean=validateBackup(raw);
      return {version:clean.v,question:clean.appointments.questions[0],plan:clean.appointments.plans[0],med:clean.medications[0],scheduled:scheduledMeds(todayISO()).length};
    });
    check('appointment plans and lifecycle survive strict backup validation',
      planningState.version===7
      &&planningState.question.text==='Should we change the dose based on my tracked symptoms?'
      &&planningState.plan.summary==='Keep the current dose and review after the lab result.'
      &&planningState.plan.actions.length===2&&planningState.plan.actions[0].done===true
      &&planningState.med.status==='archived'&&planningState.med.stopReason==='Paused after clinician review'
      &&planningState.scheduled===0,JSON.stringify(planningState));
    await planningPage.getByRole('button',{name:'Prepare appointment report'}).click();
    check('appointment report includes editable questions, plans, and stopped-treatment context',
      await planningPage.getByText('Appointment questions & after-visit plans',{exact:true}).isVisible()
      &&await planningPage.getByText('Should we change the dose based on my tracked symptoms?',{exact:true}).isVisible()
      &&await planningPage.getByText('Keep the current dose and review after the lab result.',{exact:true}).isVisible()
      &&await planningPage.getByText(/stopped .*Paused after clinician review/).isVisible());

    const normalizedEntries={};
    for(let i=13;i>=0;i--){
      const recent=i<=6;
      normalizedEntries[isoOffset(-i)]=confirmed({hf:recent?12:10,ns:0,sym:{fog:recent?2:1,joint:1},act:{},nut:{}});
    }
    const normalizedContext=await browser.newContext({viewport:{width:390,height:844}});
    await injectState(normalizedContext,{v:5,profile:profile({pinnedSymptoms:['hf','fog','joint']}),entries:normalizedEntries,medications:[],labs:[],screening:{},scores:[],trigger:null,meta:{created:isoOffset(-13)}});
    const normalizedPage=await normalizedContext.newPage(); monitor(normalizedPage,'normalized-weekly-pattern',baseUrl); await normalizedPage.goto(baseUrl+'/index.html#journey');
    const normalizedPattern=await normalizedPage.evaluate(()=>weeklyPattern());
    check('weekly ranking compares proportional change across unlike symptom units',normalizedPattern.text.startsWith('Brain fog has been higher')&&normalizedPattern.recentCount===7&&normalizedPattern.priorCount===7,JSON.stringify(normalizedPattern));
    check('weekly insight shows the observation coverage',await normalizedPage.getByText('Coverage: 7/7 recent days · 7/7 prior days.',{exact:true}).isVisible());

    const sparseEntries={};
    [-1,-2,-3,-8,-9,-10,-30,-31,-32,-33,-34,-35,-36,-37].forEach((offset,i)=>{
      sparseEntries[isoOffset(offset)]=confirmed({hf:i+1,ns:1,sym:{fog:2,joint:1},act:{},nut:{}});
    });
    const sparseContext=await browser.newContext({viewport:{width:390,height:844}});
    await injectState(sparseContext,{v:5,profile:profile({pinnedSymptoms:['hf','fog','joint']}),entries:sparseEntries,medications:[],labs:[],screening:{},scores:[],trigger:null,meta:{created:isoOffset(-37)}});
    const sparsePage=await sparseContext.newPage(); monitor(sparsePage,'sparse-weekly-pattern',baseUrl); await sparsePage.goto(baseUrl+'/index.html#journey');
    const sparsePattern=await sparsePage.evaluate(()=>({text:weeklyPatternText(),windows:weeklyPatternWindows()}));
    check('four-of-seven coverage is required in both calendar windows despite old logs',sparsePattern.text===null&&sparsePattern.windows.recentCount===3&&sparsePattern.windows.priorCount===3,JSON.stringify(sparsePattern));
    check('insufficient calendar coverage is visible',await sparsePage.getByText('Calendar coverage: 3/7 recent days · 3/7 prior days.').isVisible()&&await sparsePage.getByText('Weekly comparisons need at least 4 confirmed days in each window.').isVisible());

    const prefillContext=await browser.newContext();
    const yesterday=isoOffset(-1);
    await injectState(prefillContext,{v:5,profile:profile(),entries:{[yesterday]:confirmed({hf:7,ns:2,sym:{fog:3,energy:2,joint:1,anx:2},act:{},nut:{}})},medications:[],labs:[],screening:{},scores:[],trigger:null,meta:{created:yesterday}});
    const prefillPage=await prefillContext.newPage(); monitor(prefillPage,'prefill',baseUrl); await prefillPage.goto(baseUrl+'/index.html');
    const prefill=await prefillPage.evaluate(()=>{const t=todayISO(),e=DB.entries[t];return {hf:e&&e.hf,prefilled:e&&e.prefilledFrom,confirmed:!!confirmedEntry(t),count:entryDates().length};});
    check('prefill preserves actual counts but remains unconfirmed',prefill.hf===7&&!!prefill.prefilled&&!prefill.confirmed&&prefill.count===1,JSON.stringify(prefill));

    const migrationContext=await browser.newContext();
    await injectState(migrationContext,{v:4,profile:{name:'Legacy',birthYear:1970,region:'us',units:'metric',onboarded:true},entries:{[isoOffset(-2)]:{hf:4,sym:{fog:2},act:{},nut:{}}},medications:[],labs:[],screening:{},scores:[],trigger:null,meta:{created:isoOffset(-3)}});
    const migrationPage=await migrationContext.newPage(); monitor(migrationPage,'migration',baseUrl); await migrationPage.goto(baseUrl+'/index.html');
    const migration=await migrationPage.evaluate(()=>({version:DB.v,count:entryDates().length,snapshot:!!confirmedEntry(Object.keys(DB.entries)[0]),pins:DB.profile.pinnedSymptoms.length}));
    check('v4 logs migrate to v7 confirmed snapshots',migration.version===7&&migration.count===1&&migration.snapshot&&migration.pins===6,JSON.stringify(migration));

    console.log('\n== Responsive and runtime quality ==');
    const desktopContext=await browser.newContext({viewport:{width:1280,height:900}}); await injectState(desktopContext,seededState(16));
    const desktopPage=await desktopContext.newPage(); monitor(desktopPage,'desktop',baseUrl); await desktopPage.goto(baseUrl+'/index.html#journey');
    const desktopLayout=await desktopPage.locator('#app').evaluate(el=>({width:el.getBoundingClientRect().width,left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right}));
    check('desktop layout remains a centered app surface',desktopLayout.width<=442&&Math.abs(desktopLayout.left-(1280-desktopLayout.right))<2,JSON.stringify(desktopLayout));
    check('one primary destination is current',await desktopPage.locator('nav.tabs [aria-current="page"]').count()===1);
    await seededPage.screenshot({path:path.join(TEST_RESULTS,'journey-selected-flow.png')});
    await desktopPage.screenshot({path:path.join(TEST_RESULTS,'journey-desktop.png')});

    await onboardingContext.close(); await resetContext.close(); await deleteContext.close(); await seededContext.close(); await followupContext.close(); await planningContext.close(); await normalizedContext.close(); await sparseContext.close(); await prefillContext.close(); await migrationContext.close(); await desktopContext.close();
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
