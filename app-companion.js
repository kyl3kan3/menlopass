/* Private, deterministic support and care preparation. No network or AI service. */
const SUPPORT_OPTIONS = {
  sleep:{label:'Can’t sleep',title:'Make a little room for rest',steps:['Make your space quiet and comfortably cool.','Let your shoulders soften. You do not have to solve tomorrow tonight.','Try the relaxation tool if it feels comfortable.'],tool:'pmr',toolLabel:'Try muscle relaxation',guide:'sleep'},
  overwhelmed:{label:'Feeling overwhelmed',title:'One comfortable breath at a time',steps:['Sit somewhere comfortable, with your feet supported.','Breathe gently, only as deeply as feels comfortable. Do not force it.','Follow the breathing guide if you like. Stop if you feel dizzy or uncomfortable.'],tool:'breath',toolLabel:'Open breathing guide',guide:'mind'},
  hot:{label:'Hot flash',title:'A moment to cool down',steps:['Try a fan or move somewhere cooler.','Loosen or remove a layer if you can.','Take a cool drink if you would like one.'],guide:'symptoms'},
  fog:{label:'Brain fog',title:'Make the next step smaller',steps:['Pause and choose just one thing to do next.','Write yourself a short reminder, so you do not have to hold it all in your head.','Give yourself permission to take a break.'],guide:'mind'}
};
let supportFeedback=null;
let briefDraft=null, briefStep=1, briefQuestionContext='';

function weeklyStoryData(keys){
  const w=weeklyPatternWindows();
  const rows=(keys||focusedKeys()).map(key=>{
    const observations=dates=>dates.map(date=>({date,value:symptomValue(confirmedRecord(date),key)})).filter(x=>x.value!=null&&Number.isFinite(x.value));
    const prior=observations(w.prior), recent=observations(w.recent);
    const ready=prior.length>=WEEKLY_MIN_COVERAGE&&recent.length>=WEEKLY_MIN_COVERAGE;
    const before=prior.length?avg(prior.map(x=>x.value)):null, after=recent.length?avg(recent.map(x=>x.value)):null;
    const delta=ready?after-before:0, score=ready?Math.abs(delta)/Math.max(Math.abs(before),Math.abs(after),1):0;
    return {key,prior,recent,ready,before,after,direction:!ready?'waiting':score>=0.2&&Math.abs(delta)>=0.35?(delta<0?'lower':'higher'):'steady'};
  });
  return {windows:w,rows,events:treatmentEvents().filter(e=>e.date>=w.prior[0]&&e.date<=w.recent[6])};
}
function storySentence(row){
  const name=symptomName(row.key);
  if(!row.ready) return name+': not enough matching answers yet ('+row.prior.length+'/7 previous, '+row.recent.length+'/7 recent).';
  const unit=row.key==='hf'?' per day':' / 4';
  return name+' was '+(row.direction==='steady'?'broadly steady':row.direction)+': '+r1(row.before)+unit+' → '+r1(row.after)+unit+' ('+row.prior.length+' previous and '+row.recent.length+' recent answers).';
}
function weeklyStoryMarkup(){
  const story=weeklyStoryData();
  const group=(direction,title)=>{
    const rows=story.rows.filter(r=>r.direction===direction);
    return rows.length?`<div class="mc-story-group"><h3>${title}</h3>${rows.map(r=>`<p>${esc(storySentence(r))}</p>`).join('')}</div>`:'';
  };
  return `<section class="mc-card mc-weekly" aria-labelledby="weekly-story-title"><span class="mc-eyebrow">Your weekly story</span><h2 id="weekly-story-title">Here’s what’s changing</h2>
    <p class="mc-muted">${esc(fmtDay(story.windows.prior[0]))}–${esc(fmtDay(story.windows.prior[6]))} compared with ${esc(fmtDay(story.windows.recent[0]))}–${esc(fmtDay(story.windows.recent[6]))}</p>
    ${group('lower','Lower this week')}${group('higher','Higher this week')}${group('steady','Holding steady')}${group('waiting','Still taking shape')}
    <p class="mc-muted">Each symptom needs at least four confirmed answers in each week. Small changes are described as steady; these are descriptive comparisons, not clinical thresholds.</p>
    ${story.events.length?`<div class="mc-story-group"><h3>Treatment changes in these weeks</h3>${story.events.slice(0,5).map(e=>`<p><b>${esc(fmtDay(e.date))}</b> · ${esc(e.title)}. ${esc(e.body)}</p>`).join('')}<p class="mc-muted">Timing can be useful to discuss, but does not show what caused a change.</p></div>`:'<p class="mc-muted">No treatment changes recorded in these two weeks.</p>'}
    <details class="mc-evidence"><summary>See supporting logs</summary><p>Previous week → recent week. Missing answers are left out; drafts never replace confirmed answers.</p>${story.rows.map(r=>`<div><h3>${esc(symptomName(r.key))}</h3>${r.prior.concat(r.recent).length?`<ul>${r.prior.concat(r.recent).map(x=>`<li>${esc(fmtDay(x.date))}: ${x.value}${r.key==='hf'?' per day':' / 4'}</li>`).join('')}</ul>`:'<p>No confirmed answers in these weeks.</p>'}</div>`).join('')}</details>
    <button class="jc-secondary" data-act="save-weekly-question">Save recap for my appointment</button></section>`;
}
function supportHomeCard(){
  return `<section class="mc-support-entry"><button class="jc-secondary" data-act="sheet" data-s="support">I’m struggling right now</button><p>A little support, with no check-in required.</p></section>`;
}
function supportSheet(kind){
  const option=SUPPORT_OPTIONS[kind];
  if(!option){
    const history=Array.isArray(DB.support)?DB.support:[];
    const helpful=Object.entries(SUPPORT_OPTIONS).map(([key,item])=>({key,item,count:history.filter(x=>x.kind===key&&x.helped==='yes').length})).filter(x=>x.count>0);
    return {title:'Support for right now',body:`<div class="mc-support"><p class="mc-intro">What feels hardest right now?</p><div class="mc-support-grid">${Object.entries(SUPPORT_OPTIONS).map(([key,item])=>`<button class="jc-secondary" data-act="support-open" data-kind="${key}">${item.label}</button>`).join('')}</div>
      ${history.length?`<section class="mc-card"><h3>What has helped you</h3><p class="mc-muted">Based on your feedback, not a prediction.</p>${helpful.length?helpful.map(x=>`<button class="mc-helpful" data-act="support-open" data-kind="${x.key}"><b>${esc(x.item.title)}</b><span>Helpful ${x.count} ${x.count===1?'time':'times'}</span></button>`).join(''):'<p>Nothing marked helpful yet. It is okay to try something else.</p>'}<button class="jc-inline-action" data-act="support-clear">Clear support feedback</button></section>`:''}
      <button class="jc-inline-action" data-act="sheet" data-s="redflags">When to get medical help</button><p class="mc-muted">If symptoms are new, severe, or worrying, seek medical advice. These tools offer comfort and practical support.</p></div>`};
  }
  const response=supportFeedback&&supportFeedback.kind===kind?supportFeedback.helped:null;
  const source=kind==='overwhelmed'?'https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/breathing-exercises-for-stress/':'https://www.nhs.uk/conditions/menopause-and-perimenopause/things-you-can-do/';
  return {title:option.label,body:`<div class="mc-support"><span class="mc-eyebrow">Take this at your pace</span><h3 class="mc-support-title">${option.title}</h3><ol class="mc-steps">${option.steps.map(step=>`<li>${step}</li>`).join('')}</ol>
    ${option.tool?`<button class="jc-primary" data-act="sheet" data-s="tool:${option.tool}">${option.toolLabel}</button><p class="mc-muted">Come back here afterward to record how it felt.</p>`:''}
    <section class="mc-feedback" aria-label="Support feedback"><h3>Did this help?</h3><p>Optional. Only saved on this device.</p><div class="mc-feedback-buttons">${[['yes','Yes'],['no','Not this time'],['unsure','Not sure']].map(([value,label])=>`<button class="btn ghost" data-act="support-feedback" data-kind="${kind}" data-value="${value}" aria-pressed="${response===value}">${label}</button>`).join('')}</div>${response?'<p role="status">Saved. You can change your answer.</p>':''}</section>
    <button class="jc-inline-action" data-act="sheet" data-s="learn:${option.guide}">Explore related guidance</button><p class="mc-muted">${kind==='fog'?'Practical organization prompts. For broader self-care, see':'Self-care guidance adapted from'} <a href="${source}" target="_blank" rel="noopener noreferrer">NHS guidance</a>. Comfort measures do not replace treatment. If symptoms persist or disrupt your life, discuss them with your clinician.</p><button class="jc-inline-action" data-act="sheet" data-s="redflags">When to get medical help</button></div>`};
}
function savedBrief(){ return appointmentData().brief||{concerns:[],goal:'',date:''}; }
function briefContextKey(brief){ return JSON.stringify([brief.concerns,brief.goal]); }
function beginBrief(){ briefDraft=JSON.parse(JSON.stringify(savedBrief())); briefQuestionContext=briefContextKey(briefDraft); briefStep=1; openSheet('appointment-brief'); }
function captureBriefFields(){
  if(!briefDraft) return;
  briefDraft.concerns.forEach(c=>{const input=document.getElementById('brief-impact-'+c.key); if(input) c.impact=input.value.slice(0,500).trim();});
  const goal=document.getElementById('brief-goal'), date=document.getElementById('brief-date');
  if(goal) briefDraft.goal=goal.value.slice(0,500).trim();
  if(date) briefDraft.date=date.value;
  (briefDraft.questions||[]).forEach(question=>{
    const text=document.getElementById('brief-question-'+question.id), include=document.getElementById('brief-include-'+question.id);
    if(text) question.text=text.value.slice(0,1000).trim();
    if(include) question.selected=include.checked;
  });
}
function briefOpening(brief){
  if(!brief.concerns.length) return '';
  const concerns=brief.concerns.map(c=>symptomName(c.key)+(c.impact?' — '+c.impact:'')).join('; ');
  return 'I would like to talk about '+concerns+'.'+(brief.goal?' What I hope to get from this visit: '+brief.goal:'');
}
function generateBriefQuestions(brief){
  const story=weeklyStoryData(PINNABLE_SYMPTOMS), date=todayISO();
  const changes=(DB.medications||[]).flatMap(med=>(med.changes||[]).filter(change=>change.date>=addDays(date,-90)&&change.date<=date).map(change=>({medication:med.name,...change}))).sort((a,b)=>b.date.localeCompare(a.date));
  return buildAppointmentQuestions(brief,{
    profile:DB.profile,
    names:Object.fromEntries(PINNABLE_SYMPTOMS.map(key=>[key,symptomName(key)])),
    medications:(DB.medications||[]).filter(med=>medicationStatus(med)==='active'),
    changes,
    observations:story.rows.map(row=>({key:row.key,ready:row.ready,direction:row.direction,before:row.before,after:row.after,priorCount:row.prior.length,recentCount:row.recent.length})),
    windowLabel:fmtDay(story.windows.prior[0])+'–'+fmtDay(story.windows.prior[6])+' compared with '+fmtDay(story.windows.recent[0])+'–'+fmtDay(story.windows.recent[6])
  });
}
function refreshBriefQuestions(){
  briefDraft.questions=generateBriefQuestions(briefDraft); briefDraft.generatedAt=todayISO(); briefQuestionContext=briefContextKey(briefDraft);
}
function briefQuestionSources(){
  return '<details class="mc-evidence"><summary>About these suggestions</summary><p>Questions connect your concerns, confirmed logs, and recorded treatment history with topics worth discussing. They cannot diagnose the cause or decide which treatment is right for you. Review and edit anything that does not fit.</p><p>Discussion framework: <a href="https://www.nice.org.uk/guidance/ng197/chapter/recommendations" target="_blank" rel="noopener noreferrer">NICE shared decision making</a>. Menopause context: <a href="https://www.nice.org.uk/guidance/ng23/chapter/Recommendations" target="_blank" rel="noopener noreferrer">NICE menopause guidance</a> and <a href="https://www.nhs.uk/conditions/menopause-and-perimenopause/treatment/" target="_blank" rel="noopener noreferrer">NHS treatment overview</a>.</p></details>';
}
function briefQuestionsEditor(brief){
  return '<section class="mc-question-editor"><h3>Questions you might not think to ask</h3><p>Use the suggestions that fit. Edit the wording, or untick a question to leave it out of your saved brief.</p>'+(brief.questions||[]).map((question,index)=>'<article class="mc-question-card"><label class="mc-question-include" for="brief-include-'+esc(question.id)+'"><input type="checkbox" id="brief-include-'+esc(question.id)+'"'+(question.selected!==false?' checked':'')+'>Include question '+(index+1)+'</label><label class="sr-only" for="brief-question-'+esc(question.id)+'">Question '+(index+1)+'</label><textarea id="brief-question-'+esc(question.id)+'" maxlength="1000">'+esc(question.text)+'</textarea><p><b>Why this may help:</b> '+esc(question.reason)+'</p></article>').join('')+'<button class="jc-inline-action" data-act="brief-refresh">Refresh suggestions from my latest record</button><p class="mc-muted">Refreshing replaces question edits. Your answers and suggestions stay on this device.</p>'+briefQuestionSources()+'<button class="jc-inline-action" data-act="sheet" data-s="redflags">When to seek medical help</button></section>';
}
function briefSummaryMarkup(brief,editing){
  const story=weeklyStoryData(brief.concerns.map(c=>c.key));
  const questions=(Array.isArray(brief.questions)?brief.questions:generateBriefQuestions(brief)).filter(question=>question.selected!==false&&question.text);
  const questionMarkup=editing?'':'<h3>Questions to bring</h3>'+(questions.length?'<ol class="mc-saved-questions">'+questions.map(question=>'<li><b>'+esc(question.text)+'</b><p>'+esc(question.reason)+'</p></li>').join('')+'</ol>':'<p>No questions selected.</p>');
  return '<div class="mc-brief-summary">'+questionMarkup+'<h3>How I’d like to start</h3><p class="mc-opening">'+esc(briefOpening(brief))+'</p>'+(brief.date?'<p>Appointment: '+esc(fmtDay(brief.date))+'</p>':'')+'<h3>Relevant observations</h3>'+story.rows.map(r=>'<p>'+esc(storySentence(r))+'</p>').join('')+'<p class="mc-muted">Previous week '+esc(fmtDay(story.windows.prior[0]))+'–'+esc(fmtDay(story.windows.prior[6]))+'; recent week '+esc(fmtDay(story.windows.recent[0]))+'–'+esc(fmtDay(story.windows.recent[6]))+'. Confirmed self-reports; these comparisons do not establish a cause.</p></div>';
}
function briefSheet(){
  if(!briefDraft) briefDraft=JSON.parse(JSON.stringify(savedBrief()));
  const brief=briefDraft;
  let body='';
  if(briefStep===1) body=`<h3>Choose up to three concerns</h3><p>Start with what matters most to you. Your selection order sets the order in your brief.</p><div class="mc-concerns">${PINNABLE_SYMPTOMS.map(key=>`<button class="btn ghost" data-act="brief-toggle" data-key="${key}" aria-pressed="${brief.concerns.some(c=>c.key===key)}">${esc(symptomName(key))}</button>`).join('')}</div><button class="jc-primary" data-act="brief-next"${brief.concerns.length?'':' disabled'}>Next: everyday impact</button>`;
  if(briefStep===2) body=`<h3>Help your clinician understand the impact</h3><p>A concrete example is enough. These fields are optional.</p>${brief.concerns.map(c=>`<label class="fl" for="brief-impact-${c.key}">${esc(symptomName(c.key))} — how does it affect your day?</label><textarea id="brief-impact-${c.key}" maxlength="500" placeholder="For example: I lose my place during meetings.">${esc(c.impact)}</textarea>`).join('')}<label class="fl" for="brief-goal">What would make this visit useful?</label><textarea id="brief-goal" maxlength="500" placeholder="For example: agree on a plan for sleep.">${esc(brief.goal)}</textarea><label class="fl" for="brief-date">Appointment date (optional)</label><input type="date" id="brief-date" value="${esc(brief.date)}"><div class="btn-row split"><button class="btn ghost" data-act="brief-back">Back</button><button class="btn primary" data-act="brief-next">Preview my brief</button></div>`;
  if(briefStep===3) body=`${briefQuestionsEditor(brief)}${briefSummaryMarkup(brief,true)}<p class="mc-muted">Review your wording before saving. The brief will be included in your appointment report.</p><div class="btn-row split"><button class="btn ghost" data-act="brief-back">Edit impact</button><button class="btn primary" data-act="brief-save">Save appointment brief</button></div>`;
  return {title:'Help me explain this',body:`<div class="mc-brief"><p class="mc-eyebrow">Step ${briefStep} of 3 · ${['Your concerns','Your everyday life','Your brief'][briefStep-1]}</p>${body}</div>`};
}
function appointmentCompanionCard(){
  const brief=savedBrief();
  return `<section class="mc-card mc-appointment"><span class="mc-eyebrow">Your appointment companion</span><h2>Help me explain this</h2><p>${brief.concerns.length?esc(brief.concerns.map(c=>symptomName(c.key)).join(' · ')):'Find useful questions to ask, connect symptoms with your treatment history, and leave with a clearer plan.'}</p><button class="jc-secondary" data-act="brief-start">${brief.concerns.length?'Edit my appointment brief':'Prepare my appointment brief'}</button>${brief.concerns.length?`<details class="mc-evidence"><summary>Read my saved brief</summary>${briefSummaryMarkup(brief)}</details><button class="jc-inline-action" data-act="brief-clear">Clear appointment brief</button>`:''}${brief.date?calendarButton(brief.date):''}<p class="mc-muted">After your visit, use After-visit plans below to record agreed actions and check them off.</p></section>`;
}
function calendarButton(date){
  return `<button class="jc-inline-action" data-act="appointment-calendar" data-date="${esc(date)}">Add ${esc(fmtDay(date))} to calendar</button><p class="mc-muted">Exports a generic “Appointment” calendar event at 9 am with a reminder one day before. Adjust the time and confirm it in your calendar. No health details are included.</p>`;
}
function visitReminderMarkup(){
  const dates=[...new Set(appointmentData().plans.map(p=>p.nextVisit).filter(d=>d&&d>=todayISO()))].sort();
  return dates.length?`<section class="mc-card"><h3>Upcoming follow-ups</h3>${dates.map(calendarButton).join('')}</section>`:'';
}
function appointmentCalendar(date){
  if(!validISODate(date)) return null;
  const stamp=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z'), day=date.replace(/-/g,'');
  return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//MenoCompass//Private appointment//EN','CALSCALE:GREGORIAN','BEGIN:VEVENT','UID:appointment-'+day+'@menocompass.local','DTSTAMP:'+stamp,'DTSTART:'+day+'T090000','DTEND:'+day+'T093000','SUMMARY:Appointment','DESCRIPTION:Review your saved appointment plan.','BEGIN:VALARM','TRIGGER:-P1D','ACTION:DISPLAY','DESCRIPTION:Appointment tomorrow','END:VALARM','END:VEVENT','END:VCALENDAR',''].join('\r\n');
}
function companionAction(el){
  const act=el.dataset.act;
  if(act==='support-open'){ supportFeedback=null; openSheet('support:'+el.dataset.kind); return true; }
  if(act==='support-feedback'){
    const kind=el.dataset.kind, helped=el.dataset.value;
    if(!SUPPORT_OPTIONS[kind]||!['yes','no','unsure'].includes(helped)) return true;
    DB.support=Array.isArray(DB.support)?DB.support:[];
    if(supportFeedback&&supportFeedback.kind===kind&&DB.support.includes(supportFeedback)) supportFeedback.helped=helped;
    else {supportFeedback={date:todayISO(),kind,helped}; DB.support.push(supportFeedback); DB.support=DB.support.slice(-200);}
    save(true); renderSheet(false); return true;
  }
  if(act==='support-clear'){DB.support=[]; supportFeedback=null; save(true); renderSheet(false); toast('Support feedback cleared'); return true;}
  if(act==='save-weekly-question'){
    const story=weeklyStoryData(), ready=story.rows.filter(r=>r.ready);
    if(!ready.length){toast('Keep checking in — there is not enough data for a recap yet');return true;}
    const recap='Weekly recap ending '+fmtDay(story.windows.recent[6])+', previous → recent: '+ready.map(r=>symptomName(r.key)+' '+r1(r.before)+' → '+r1(r.after)+(r.key==='hf'?' per day':' / 4')+' (n='+r.prior.length+'/'+r.recent.length+')').join('; ')+'.';
    const overlap=story.events.length?' Overlap: '+fmtDay(story.events[0].date)+' '+story.events[0].title+'. Timing does not prove cause.':'';
    const text=safeText(recap+overlap,470)+' What should we discuss?';
    const data=appointmentData();
    if(data.questions.some(q=>q.text===text)){toast('This recap is already in your appointment questions');return true;}
    if(data.questions.length>=100){toast('Your question list is full. Remove an old question first.');return true;}
    data.questions.push({id:'weekly-'+Date.now().toString(36),text,created:todayISO(),asked:false,askedAt:''});save(true);toast('Recap saved in Care → Appointment questions');return true;
  }
  if(act==='brief-start'){beginBrief();return true;}
  if(act==='brief-toggle'){
    const key=el.dataset.key;if(!briefDraft||!PINNABLE_SYMPTOMS.includes(key))return true;
    const index=briefDraft.concerns.findIndex(c=>c.key===key);
    if(index>=0)briefDraft.concerns.splice(index,1);
    else if(briefDraft.concerns.length<3)briefDraft.concerns.push({key,impact:''});
    else {toast('Choose up to three concerns');return true;}
    renderSheet(false);return true;
  }
  if(act==='brief-next'||act==='brief-back'){
    captureBriefFields();if(!briefDraft||!briefDraft.concerns.length)return true;
    if(act==='brief-next'&&briefStep===2&&(!Array.isArray(briefDraft.questions)||briefQuestionContext!==briefContextKey(briefDraft)))refreshBriefQuestions();
    briefStep=Math.max(1,Math.min(3,briefStep+(act==='brief-next'?1:-1)));renderSheet(true);return true;
  }
  if(act==='brief-refresh'){captureBriefFields();refreshBriefQuestions();renderSheet(false);return true;}
  if(act==='brief-save'){
    captureBriefFields();
    if(!briefDraft||!briefDraft.concerns.length)return true;
    appointmentData().brief=safeAppointments({brief:briefDraft}).brief;save(true);closeSheet();render(true);toast('Appointment brief saved');return true;
  }
  if(act==='brief-clear'){appointmentData().brief={concerns:[],goal:'',date:''};briefDraft=null;save(true);render(true);toast('Appointment brief cleared');return true;}
  if(act==='appointment-calendar'){const text=appointmentCalendar(el.dataset.date);if(text)download('appointment-'+el.dataset.date+'.ics',text,'text/calendar');return true;}
  return false;
}
