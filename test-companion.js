const path = require('path');

/* Right-now support and the appointment brief, inside the dossier. */
module.exports = async function testCompanion({browser,baseUrl,check,seededState,newPage,nativeReload,isoOffset,testResults}) {
  console.log('\n== Right now, the brief, the opening statement ==');
  const {context,page}=await newPage(browser,baseUrl,'companion',{state:seededState(16),native:true});
  try {
    await page.goto(baseUrl+'/index.html');
    await page.getByRole('button',{name:/^Right now/}).click();
    const support=page.getByRole('dialog');
    check('right now offers the four situations',await support.locator('.bigrow').count()===4);
    for(const [kind,label] of [['sleep','Can’t sleep'],['overwhelmed','Overwhelmed'],['hot','Hot flash'],['fog','Brain fog']]){
      await support.getByRole('button',{name:label,exact:true}).click();
      check(kind+' has three short steps',await page.getByRole('dialog').locator('ol.steps li').count()===3);
      if(kind==='overwhelmed'){
        await page.getByRole('dialog').getByRole('button',{name:'Breathe · 2 min',exact:true}).click();
        await page.getByRole('dialog').getByRole('button',{name:'Start',exact:true}).click();
        await page.getByRole('dialog').getByRole('button',{name:'Back to Overwhelmed',exact:true}).click();
        check('returning from breathing stops its timer and keeps the feedback row',await page.evaluate(()=>breathTimer===null)&&await page.getByRole('dialog').getByRole('button',{name:'Yes',exact:true}).isVisible());
      }
      await page.getByRole('dialog').getByRole('button',{name:'Yes',exact:true}).click();
      await page.getByRole('dialog').getByRole('button',{name:'Unsure',exact:true}).click();
      await page.getByRole('dialog').getByRole('button',{name:'Yes',exact:true}).click();
      check('changing '+kind+' feedback updates one response',await page.evaluate(key=>DB.support.filter(x=>x.kind===key).length===1,kind));
      await page.getByRole('dialog').getByRole('button',{name:'Back to Right now',exact:true}).click();
    }
    check('the menu remembers what helped',await page.getByRole('dialog').locator('.bigrow .s').filter({hasText:'helped 1×'}).count()===4);
    await page.locator('.sheet-bar .done').click();
    await nativeReload({context,page});
    check('support feedback survives a reload',await page.evaluate(()=>DB.support.length===4));

    await page.goto(baseUrl+'/index.html#dossier');
    check('without a brief the opening statement says what to do',await page.getByText('Set your three concerns and the opening writes itself.').first().isVisible());
    await page.locator('.sec').filter({hasText:'Questions'}).getByRole('button',{name:'Build the brief'}).click();
    const brief=page.getByRole('dialog');
    check('the brief needs at least one concern',await brief.getByRole('button',{name:'Next: what it costs you'}).isDisabled());
    for(const key of ['hf','fog','energy','joint']) await brief.locator('[data-act="brief-toggle"][data-key="'+key+'"]').click();
    check('the brief stops at three concerns',await brief.locator('.chip[aria-pressed="true"]').count()===3);
    await brief.getByRole('button',{name:'Next: what it costs you'}).click();
    await brief.locator('#brief-impact-fog').fill('I lose my place in meetings. <script>bad()</script>');
    await brief.getByLabel('What would make the visit worth it?').fill('Agree on a plan I can follow.');
    await brief.getByLabel('Appointment date').fill(isoOffset(14));
    await brief.getByRole('button',{name:'Preview the brief'}).click();
    check('the preview writes the opening statement from the answers',await brief.locator('.quote').innerText().then(t=>t.includes('I lose my place in meetings.')&&t.includes('Agree on a plan')));
    check('the brief suggests questions with reasons',await brief.locator('.qedit').count()>=4&&await brief.locator('.qedit p').first().innerText().then(t=>t.startsWith('Why:')));
    const editedQuestion='How should we compare the benefits and side effects for my work day?';
    await brief.locator('.qedit textarea').first().fill(editedQuestion);
    await brief.locator('.qedit input[type=checkbox]').last().uncheck();
    check('user text in the brief is escaped',await brief.locator('script').count()===0);
    await brief.getByRole('button',{name:'Save to the dossier'}).click();
    const saved=await page.evaluate(()=>({concerns:DB.appointments.brief.concerns.map(c=>c.key),impact:DB.appointments.brief.concerns[1].impact,selected:DB.appointments.brief.questions.filter(q=>q.selected!==false).length,total:DB.appointments.brief.questions.length,first:DB.appointments.brief.questions[0].text,date:DB.appointments.brief.date}));
    check('the saved brief keeps the edit, the untick and the date',JSON.stringify(saved.concerns)===JSON.stringify(['hf','fog','energy'])&&saved.impact.includes('I lose my place in meetings.')&&saved.selected===saved.total-1&&saved.first===editedQuestion&&saved.date===isoOffset(14),JSON.stringify(saved));
    check('the dossier now carries the questions and the opening statement',await page.locator('.sec').filter({hasText:'Questions'}).locator('.qn .q').first().innerText().then(t=>t===editedQuestion)&&await page.locator('.sec').filter({hasText:'Opening statement'}).locator('.quote').innerText().then(t=>t.includes('I would like to talk about')));
    check('the countdown follows the brief date',await page.locator('.stats .stat .v').first().innerText().then(t=>t.trim()==='14'));
    await page.locator('.sec').filter({hasText:'Opening statement'}).getByRole('button',{name:'Rehearse'}).click();
    check('rehearsal shows the statement and the first questions',await page.getByRole('dialog').getByText('Say it out loud. Twice.').isVisible()&&await page.getByRole('dialog').locator('.qn').count()===3);
    await page.locator('.sheet-bar .done').click();
    await page.getByRole('button',{name:'Change the date'}).click();
    await page.getByRole('dialog').getByRole('button',{name:/Add .* to calendar/}).click();
    const ics=await page.evaluate(()=>window.__nativeMessages.filter(m=>m.type==='share-file').slice(-1)[0]);
    check('the calendar export carries no health detail',ics&&ics.mime==='text/calendar'&&ics.contents.includes('SUMMARY:Appointment')&&!/flash|fog|meeting/i.test(ics.contents));
    await page.locator('.sheet-bar .done').click();
    await page.getByRole('button',{name:'Export the one-page brief'}).click();
    check('the one-page brief opens with the statement and the questions',await page.locator('.report-page .quote').innerText().then(t=>t.includes('I would like to talk about'))&&await page.locator('.report-page .qn .q').filter({hasText:editedQuestion}).isVisible());
    await page.screenshot({path:path.join(testResults,'brief.png'),fullPage:true});
  } finally { await context.close(); }
};
