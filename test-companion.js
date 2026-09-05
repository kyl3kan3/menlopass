const path = require('path');
const fs = require('fs');

module.exports = async function testCompanion({browser,baseUrl,check,monitor,seededState,testResults}) {
  console.log('\n== Weekly story, immediate support, appointment companion ==');
  const context=await browser.newContext({viewport:{width:390,height:844}});
  await context.addInitScript(state=>{
    if(!localStorage.getItem('menocompass.v1'))localStorage.setItem('menocompass.v1',JSON.stringify(state));
  },seededState(16));
  const page=await context.newPage();monitor(page,'companion',baseUrl);
  try {
    await page.goto(baseUrl+'/index.html');
    await page.getByRole('button',{name:'I’m struggling right now',exact:true}).click();
    check('immediate support offers all four experiences',await page.locator('.mc-support-grid button').count()===4);
    for(const [kind,label] of [['sleep','Can’t sleep'],['overwhelmed','Feeling overwhelmed'],['hot','Hot flash'],['fog','Brain fog']]){
      await page.locator('.mc-support-grid').getByRole('button',{name:label,exact:true}).click();
      check(kind+' support has three short steps',await page.locator('.mc-steps li').count()===3);
      if(kind==='overwhelmed'){
        await page.getByRole('button',{name:'Open breathing guide',exact:true}).click();
        await page.getByRole('button',{name:'Start',exact:true}).click();
        await page.getByRole('button',{name:'Back to Feeling overwhelmed',exact:true}).click();
        check('returning from breathing stops its timer and restores feedback',await page.evaluate(()=>breathTimer===null)&&await page.getByRole('heading',{name:'Did this help?',exact:true}).isVisible());
      }
      await page.getByRole('button',{name:'Yes',exact:true}).click();
      await page.getByRole('button',{name:'Not sure',exact:true}).click();
      await page.getByRole('button',{name:'Yes',exact:true}).click();
      check('changing '+kind+' feedback updates one response',await page.evaluate(key=>DB.support.filter(x=>x.kind===key).length===1,kind));
      await page.getByRole('button',{name:'Back to Support for right now',exact:true}).click();
    }
    check('support menu remembers helpful experiences',await page.locator('.mc-helpful').count()===4);
    await page.getByRole('button',{name:'Close Support for right now',exact:true}).click();
    await page.reload();
    check('support feedback survives a page reload',await page.evaluate(()=>DB.support.length===4));
    await page.goto(baseUrl+'/index.html#journey');
    check('weekly story includes treatment overlap',await page.locator('.mc-weekly').getByText('Treatment changes in these weeks',{exact:true}).isVisible());
    await page.getByText('See supporting logs',{exact:true}).click();
    check('weekly evidence exposes dated confirmed observations',await page.locator('.mc-evidence li').count()>=28);
    await page.getByText('See supporting logs',{exact:true}).click();
    await page.getByRole('button',{name:'Save recap for my appointment',exact:true}).click();
    await page.getByRole('button',{name:'Save recap for my appointment',exact:true}).click();
    check('saving the same weekly recap is idempotent',await page.evaluate(()=>DB.appointments.questions.filter(q=>q.id.startsWith('weekly-')).length===1));
    await page.screenshot({path:path.join(testResults,'companion-weekly.png'),fullPage:true});

    await page.goto(baseUrl+'/index.html#care');
    await page.getByRole('button',{name:'Prepare my appointment brief',exact:true}).click();
    check('appointment preparation requires at least one concern',await page.getByRole('button',{name:'Next: everyday impact',exact:true}).isDisabled());
    for(const key of ['hf','fog','energy','joint'])await page.locator('[data-act="brief-toggle"][data-key="'+key+'"]').click();
    check('appointment preparation limits selection to three concerns',await page.locator('.mc-concerns [aria-pressed="true"]').count()===3);
    await page.getByRole('button',{name:'Next: everyday impact',exact:true}).click();
    await page.locator('#brief-impact-fog').fill('I lose my place in meetings. <script>bad()</script>');
    await page.getByLabel('What would make this visit useful?',{exact:true}).fill('Agree on a plan I can follow.');
    const date=await page.evaluate(()=>addDays(todayISO(),14));
    await page.getByLabel('Appointment date (optional)',{exact:true}).fill(date);
    await page.getByRole('button',{name:'Preview my brief',exact:true}).click();
    check('brief preview includes impact, goal, observations and questions',await page.locator('.mc-opening').innerText().then(t=>t.includes('I lose my place in meetings.')&&t.includes('Agree on a plan'))&&await page.getByRole('heading',{name:'Relevant observations',exact:true}).isVisible());
    check('brief suggests specific questions with reasons',await page.locator('.mc-question-card').count()>=4&&await page.locator('.mc-question-card').first().innerText().then(t=>t.includes('Why this may help:')));
    const editedQuestion='How should we compare the benefits and side effects for my work day?';
    await page.locator('.mc-question-card textarea').first().fill(editedQuestion);
    await page.locator('.mc-question-card input[type=checkbox]').last().uncheck();
    check('user text in the brief is escaped',await page.locator('.mc-brief script').count()===0);
    await page.setViewportSize({width:320,height:700});
    check('question editor fits narrow phones',await page.evaluate(()=>document.querySelector('.sheet').scrollWidth<=document.querySelector('.sheet').clientWidth));
    await page.setViewportSize({width:390,height:844});
    await page.screenshot({path:path.join(testResults,'companion-brief.png'),animations:'disabled'});
    await page.getByRole('button',{name:'Save appointment brief',exact:true}).click();
    await page.reload();
    await page.getByText('Read my saved brief',{exact:true}).click();
    check('edited questions and omitted suggestions survive reload',await page.evaluate(text=>DB.appointments.brief.questions[0].text===text&&DB.appointments.brief.questions.at(-1).selected===false,editedQuestion)&&await page.locator('.mc-saved-questions').innerText().then(text=>text.includes(editedQuestion)));
    await page.getByRole('button',{name:'Edit my appointment brief',exact:true}).click();
    await page.getByRole('button',{name:'Next: everyday impact',exact:true}).click();
    await page.getByRole('button',{name:'Preview my brief',exact:true}).click();
    check('reopening the brief preserves edits until explicitly refreshed',await page.locator('.mc-question-card textarea').first().inputValue()===editedQuestion);
    await page.getByRole('button',{name:'Save appointment brief',exact:true}).click();
    await page.getByText('Read my saved brief',{exact:true}).click();
    check('appointment brief survives reload',await page.locator('.mc-opening').innerText().then(t=>t.includes('I lose my place in meetings.')));
    const [download]=await Promise.all([page.waitForEvent('download'),page.locator('.mc-appointment [data-act="appointment-calendar"]').click()]);
    const calendar=fs.readFileSync(await download.path(),'utf8');
    check('calendar reminder has an alarm and no symptoms or impact',calendar.includes('SUMMARY:Appointment\r\n')&&calendar.includes('TRIGGER:-P1D')&&calendar.includes(date.replace(/-/g,'')+'T090000')&&!calendar.includes('fog')&&!calendar.includes('meetings'));
    await page.getByRole('button',{name:'Prepare appointment report',exact:true}).click();
    check('appointment brief is included in the printable report',await page.getByRole('heading',{name:'My appointment brief',exact:true}).isVisible()&&await page.locator('.report-page .mc-opening').count()===1);
    check('selected question edits appear in the appointment report',await page.locator('.report-page .mc-saved-questions').innerText().then(text=>text.includes(editedQuestion)));
    const validation=await page.evaluate(()=>{
      const raw=JSON.parse(JSON.stringify(DB));
      const clean=validateBackup(raw);
      raw.support.push({date:todayISO(),kind:'injected',helped:'yes'},{date:addDays(todayISO(),1),kind:'hot',helped:'yes'});
      raw.appointments.brief.concerns.push({key:'bogus',impact:'invalid'},raw.appointments.brief.concerns[0]);
      raw.appointments.brief.date='2026-02-30';
      raw.appointments.brief.questions.push({id:'<bad>',text:'bad'},raw.appointments.brief.questions[0]);
      const bad=validateBackup(raw);
      if(bad.appointments.brief.questions.length!==clean.appointments.brief.questions.length) throw Error('Invalid brief questions were not filtered');
      return {v:clean.v,count:clean.support.length,impact:clean.appointments.brief.concerns[1].impact,filtered:bad.support.length,concerns:bad.appointments.brief.concerns.length,date:bad.appointments.brief.date};
    });
    check('strict backup round-trip preserves companion data and rejects malformed additions',validation.v===8&&validation.count===4&&validation.filtered===4&&validation.concerns===3&&validation.date===''&&validation.impact.includes('meetings'),JSON.stringify(validation));
    const sparse=await page.evaluate(()=>{
      DB.entries={};
      for(let i=0;i<14;i++){
        const date=addDays(todayISO(),-i);
        DB.entries[date]={confirmed:true,sym:{fog:4},confirmedData:{sym:{fog:i<7?1:3}},draftDirty:true};
      }
      const row=weeklyStoryData(['fog']).rows[0];
      delete DB.entries[addDays(todayISO(),-1)];delete DB.entries[addDays(todayISO(),-2)];delete DB.entries[addDays(todayISO(),-3)];delete DB.entries[addDays(todayISO(),-4)];
      const waiting=weeklyStoryData(['fog']).rows[0];
      return {before:row.before,after:row.after,direction:row.direction,ready:waiting.ready,directionSparse:waiting.direction};
    });
    check('weekly story uses confirmed snapshots and withholds sparse comparisons',sparse.before===3&&sparse.after===1&&sparse.direction==='lower'&&!sparse.ready&&sparse.directionSparse==='waiting',JSON.stringify(sparse));
    await page.goto(baseUrl+'/index.html#today');
    await page.getByRole('button',{name:'I’m struggling right now',exact:true}).click();
    await page.getByRole('button',{name:'Clear support feedback',exact:true}).click();
    check('support history can be cleared',await page.locator('.mc-helpful').count()===0&&await page.evaluate(()=>DB.support.length===0));
    await page.getByRole('button',{name:'Hot flash',exact:true}).click();
    await page.screenshot({path:path.join(testResults,'companion-support.png'),animations:'disabled'});
    await page.setViewportSize({width:320,height:700});
    check('support sheet fits a narrow mobile screen',await page.evaluate(()=>document.querySelector('.sheet').scrollWidth<=document.querySelector('.sheet').clientWidth));
    await page.getByRole('button',{name:'Back to Support for right now',exact:true}).click();
    await page.getByRole('button',{name:'Close Support for right now',exact:true}).click();
    await page.evaluate(()=>{const p=DB.profile;DB=blankDB();DB.profile=p;save(true);});
    await page.reload();
    await page.getByRole('button',{name:'I’m struggling right now',exact:true}).click();
    await page.getByRole('button',{name:'Can’t sleep',exact:true}).click();
    check('support works before a first check-in',await page.locator('.mc-steps li').count()===3&&await page.evaluate(()=>entryDates().length===0));
    await page.getByRole('button',{name:'Not this time',exact:true}).click();
    await page.getByRole('button',{name:'Back to Support for right now',exact:true}).click();
    check('feedback can be cleared even when nothing helped',await page.getByRole('button',{name:'Clear support feedback',exact:true}).isVisible());
    await page.getByRole('button',{name:'Close Support for right now',exact:true}).click();
    await page.goto(baseUrl+'/index.html#care');
    await page.getByRole('button',{name:'Add plan',exact:true}).click();
    await page.getByLabel('Next appointment (optional)',{exact:true}).fill(date);
    await page.locator('[data-act="after-visit-save"]').click();
    check('after-visit follow-up dates offer calendar reminders',await page.getByRole('heading',{name:'Upcoming follow-ups',exact:true}).isVisible());
    await page.evaluate(()=>{window.__MENO_NATIVE__=true;window.__nativeExports=[];window.ReactNativeWebView={postMessage:value=>window.__nativeExports.push(JSON.parse(value))};});
    await page.locator('[data-act="appointment-calendar"]').click();
    check('native calendar export uses the typed local sharing bridge',await page.evaluate(()=>window.__nativeExports.some(x=>x.type==='share-file'&&x.mime==='text/calendar'&&x.name.endsWith('.ics'))));
  } finally {await context.close();}
};
