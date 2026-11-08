/* Right-now help and appointment preparation. Deterministic, on-device, no
   network or model. The appointment brief (concerns, impact, goal, generated
   questions) feeds the dossier's Questions and Opening statement sections. */
const SUPPORT_OPTIONS = {
  sleep:{label:'Can’t sleep',title:'Two minutes, then back to bed.',steps:['Keep the room cool and the light low.','Do not solve tomorrow tonight. It will still be there.','Run the wind-down below if you want something to do with the time.'],tool:'pmr',toolLabel:'Wind down · 2 min',guide:'sleep'},
  overwhelmed:{label:'Overwhelmed',title:'One slow breath at a time.',steps:['Sit down. Feet on the floor.','Breathe out longer than you breathe in. Nothing forced.','Follow the pacer if you like. Stop if you feel dizzy.'],tool:'breath',toolLabel:'Breathe · 2 min',guide:'mind'},
  hot:{label:'Hot flash',title:'Ride it out. It passes.',steps:['Cooler air if you can get it. A fan, a window, a step outside.','Lose a layer.','A cold drink. Then log it, so the timing goes on record.'],tool:'ride',toolLabel:'Ride it out · 60 s',guide:'symptoms'},
  fog:{label:'Brain fog',title:'Make the next step smaller.',steps:['Pick one thing. Only one.','Write it down so your head does not have to hold it.','Take the break you were going to skip.'],guide:'mind'}
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

/* ---------- right now ---------- */
function supportSheet(kind){
  const option=SUPPORT_OPTIONS[kind];
  if(!option){
    const history=Array.isArray(DB.support)?DB.support:[];
    const helpful=Object.entries(SUPPORT_OPTIONS).map(([key,item])=>({key,item,count:history.filter(x=>x.kind===key&&x.helped==='yes').length})).filter(x=>x.count>0);
    return {title:'Right now',body:`<p class="lead">What is it?</p>
      <div class="biglist">${Object.entries(SUPPORT_OPTIONS).map(([key,item])=>`<button class="bigrow sm" data-act="support-open" data-kind="${key}"><span>${esc(item.label)}</span><span class="s">${helpful.find(x=>x.key===key)?'helped '+helpful.find(x=>x.key===key).count+'×':''}</span></button>`).join('')}</div>
      ${history.length?`<button class="textbtn muted" data-act="support-clear">Clear what-helped history</button>`:''}
      <p class="footnote left">New, severe or worrying symptoms need medical advice, not a breathing exercise. <button class="textbtn" data-act="sheet" data-s="redflags">When to get help</button></p>`};
  }
  const response=supportFeedback&&supportFeedback.kind===kind?supportFeedback.helped:null;
  const source=kind==='overwhelmed'?'https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/breathing-exercises-for-stress/':'https://www.nhs.uk/conditions/menopause-and-perimenopause/things-you-can-do/';
  return {title:option.label,body:`<p class="lead">${esc(option.title)}</p><ol class="steps">${option.steps.map(step=>`<li>${esc(step)}</li>`).join('')}</ol>
    ${option.tool?`<button class="btn accent" data-act="sheet" data-s="tool:${option.tool}">${esc(option.toolLabel)}</button>`:''}
    <div class="label" style="margin:22px 0 6px">Did it help</div>
    <div class="seg ink" role="group" aria-label="Did this help">${[['yes','Yes'],['no','No'],['unsure','Unsure']].map(([value,label])=>`<button data-act="support-feedback" data-kind="${kind}" data-value="${value}" aria-pressed="${response===value}">${label}</button>`).join('')}</div>
    ${response?'<p class="xtiny" role="status">Saved. Change it any time.</p>':'<p class="xtiny">Optional. Saved on this device only.</p>'}
    <p class="footnote left">${kind==='fog'?'Practical prompts, not treatment.':'Comfort measures adapted from'} <a href="${source}" target="_blank" rel="noopener noreferrer">NHS self-care guidance</a>. If this keeps happening, it belongs in the dossier and in the room with your clinician. <button class="textbtn" data-act="sheet" data-s="learn:${option.guide}">Read the chapter</button></p>`};
}

/* ---------- appointment brief ---------- */
function savedBrief(){ return appointmentData().brief||{concerns:[],goal:'',date:''}; }
function appointmentSuggestionBrief(){
  const saved=savedBrief();
  if(saved.concerns.length) return saved;
  const rows=weeklyStoryData(PINNABLE_SYMPTOMS).rows;
  const concerns=rows.filter(row=>row.recent.length>=WEEKLY_MIN_COVERAGE&&row.after>0)
    .sort((a,b)=>b.recent.filter(x=>x.value>0).length/b.recent.length-a.recent.filter(x=>x.value>0).length/a.recent.length)
    .slice(0,3).map(row=>({key:row.key,impact:''}));
  return {...saved,concerns,questions:undefined};
}
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
  const concerns=brief.concerns.map(c=>symptomName(c.key).toLowerCase()+(c.impact?' ('+c.impact+')':'')).join('; ');
  return 'I would like to talk about '+concerns+'.'+(brief.goal?' What I want from this visit: '+brief.goal:'');
}
function generateBriefQuestions(brief){
  const story=weeklyStoryData(PINNABLE_SYMPTOMS), date=todayISO();
  const changes=(DB.medications||[]).flatMap(med=>(med.changes||[]).filter(change=>change.date>=addDays(date,-90)&&change.date<=date).map(change=>({medication:med.name,...change}))).sort((a,b)=>b.date.localeCompare(a.date)).map(change=>({...change,date:fmtDay(change.date)}));
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
  return '<details class="plain"><summary>Where these questions come from</summary><p>They connect your concerns, your logged days and your recorded treatment history with topics worth raising. They cannot diagnose a cause or choose a treatment. Edit anything that does not fit.</p><p>Discussion framework: <a href="https://www.nice.org.uk/guidance/ng197/chapter/recommendations" target="_blank" rel="noopener noreferrer">NICE shared decision making</a>. Menopause context: <a href="https://www.nice.org.uk/guidance/ng23/chapter/Recommendations" target="_blank" rel="noopener noreferrer">NICE menopause guidance</a> and <a href="https://www.nhs.uk/conditions/menopause-and-perimenopause/treatment/" target="_blank" rel="noopener noreferrer">NHS treatment overview</a>.</p></details>';
}
function briefQuestionsEditor(brief){
  return '<div class="label" style="margin:22px 0 10px">Questions you might not think to ask</div><p class="small muted">Keep the ones that fit. Edit the wording, or untick a question to leave it out.</p>'+(brief.questions||[]).map((question,index)=>'<div class="qedit"><label class="check sm" for="brief-include-'+esc(question.id)+'" style="border-bottom:0;padding-bottom:4px"><input type="checkbox" id="brief-include-'+esc(question.id)+'"'+(question.selected!==false?' checked':'')+'><span>Question '+(index+1)+'</span></label><label class="sr-only" for="brief-question-'+esc(question.id)+'">Question '+(index+1)+'</label><textarea id="brief-question-'+esc(question.id)+'" maxlength="1000">'+esc(question.text)+'</textarea><p class="xtiny"><b>Why:</b> '+esc(question.reason)+'</p></div>').join('')+'<button class="textbtn" data-act="brief-refresh">Regenerate from the latest record</button><p class="xtiny">Regenerating replaces your edits.</p>'+briefQuestionSources();
}
function briefSummaryMarkup(brief,editing){
  const story=weeklyStoryData(brief.concerns.map(c=>c.key));
  const questions=(Array.isArray(brief.questions)?brief.questions:generateBriefQuestions(brief)).filter(question=>question.selected!==false&&question.text);
  const questionMarkup=editing?'':'<div class="label" style="margin:18px 0 6px">Questions to bring</div>'+(questions.length?questions.map((question,i)=>'<div class="qn"><span class="n">'+(i+1)+'</span><div><div class="q">'+esc(question.text)+'</div><div class="why">'+esc(question.reason)+'</div></div></div>').join(''):'<p class="small muted">No questions selected.</p>');
  return '<div class="brief-summary">'+questionMarkup+'<div class="label" style="margin:18px 0 8px">Opening statement</div><p class="quote">“'+esc(briefOpening(brief))+'”</p>'+(brief.date?'<p class="small muted">Appointment '+esc(fmtDay(brief.date))+'.</p>':'')+'<div class="label" style="margin:18px 0 6px">Observations</div>'+story.rows.map(r=>'<p class="small">'+esc(storySentence(r))+'</p>').join('')+'<p class="xtiny">Previous week '+esc(fmtDay(story.windows.prior[0]))+'–'+esc(fmtDay(story.windows.prior[6]))+'; recent week '+esc(fmtDay(story.windows.recent[0]))+'–'+esc(fmtDay(story.windows.recent[6]))+'. Self-reported; comparisons do not establish cause.</p></div>';
}
function briefSheet(){
  if(!briefDraft) briefDraft=JSON.parse(JSON.stringify(savedBrief()));
  const brief=briefDraft;
  let body='';
  if(briefStep===1) body=`<p class="lead">What are the three things?</p><p class="small muted">The order you pick is the order in the brief.</p><div class="chips" style="margin:12px 0 22px">${PINNABLE_SYMPTOMS.map(key=>`<button class="chip" data-act="brief-toggle" data-key="${key}" aria-pressed="${brief.concerns.some(c=>c.key===key)}">${esc(symptomName(key))}</button>`).join('')}</div><button class="btn ink" data-act="brief-next"${brief.concerns.length?'':' disabled'}>Next: what it costs you</button>`;
  if(briefStep===2) body=`<p class="lead">What does each one cost you?</p><p class="small muted">One concrete example each. Optional, but it is what makes a clinician listen.</p>${brief.concerns.map(c=>`<div class="field"><label class="fl" for="brief-impact-${c.key}">${esc(symptomName(c.key))}</label><textarea id="brief-impact-${c.key}" maxlength="500" placeholder="For example: I lose my place in meetings.">${esc(c.impact)}</textarea></div>`).join('')}<div class="field"><label class="fl" for="brief-goal">What would make the visit worth it?</label><textarea id="brief-goal" maxlength="500" placeholder="For example: a plan for sleep.">${esc(brief.goal)}</textarea></div><div class="field"><label class="fl" for="brief-date">Appointment date</label><input type="date" id="brief-date" value="${esc(brief.date)}"></div><div class="btn-row split"><button class="btn outline" data-act="brief-back">Back</button><button class="btn ink" data-act="brief-next">Preview the brief</button></div>`;
  if(briefStep===3) body=`${briefQuestionsEditor(brief)}${briefSummaryMarkup(brief,true)}<div class="btn-row split" style="margin-top:18px"><button class="btn outline" data-act="brief-back">Back</button><button class="btn ink" data-act="brief-save">Save to the dossier</button></div>`;
  return {title:'Brief · '+briefStep+' of 3',body};
}
function calendarButton(date){
  return `<button class="textbtn" data-act="appointment-calendar" data-date="${esc(date)}">Add ${esc(fmtDay(date))} to calendar</button><p class="xtiny">A generic “Appointment” event at 9 am with a reminder the day before. No health details are included.</p>`;
}
function visitReminderMarkup(){
  const dates=[...new Set(appointmentData().plans.map(p=>p.nextVisit).filter(d=>d&&d>=todayISO()))].sort();
  return dates.length?`<div class="label" style="margin:18px 0 6px">Follow-ups booked</div>${dates.map(calendarButton).join('')}`:'';
}
function appointmentCalendar(date){
  if(!validISODate(date)) return null;
  const stamp=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z'), day=date.replace(/-/g,'');
  return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//peri//Private appointment//EN','CALSCALE:GREGORIAN','BEGIN:VEVENT','UID:appointment-'+day+'@menocompass.local','DTSTAMP:'+stamp,'DTSTART:'+day+'T090000','DTEND:'+day+'T093000','SUMMARY:Appointment','DESCRIPTION:Review your saved appointment plan.','BEGIN:VALARM','TRIGGER:-P1D','ACTION:DISPLAY','DESCRIPTION:Appointment tomorrow','END:VALARM','END:VEVENT','END:VCALENDAR',''].join('\r\n');
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
  if(act==='support-clear'){DB.support=[]; supportFeedback=null; save(true); renderSheet(false); toast('Cleared'); return true;}
  if(act==='brief-start'){beginBrief();return true;}
  if(act==='brief-toggle'){
    const key=el.dataset.key;if(!briefDraft||!PINNABLE_SYMPTOMS.includes(key))return true;
    const index=briefDraft.concerns.findIndex(c=>c.key===key);
    if(index>=0)briefDraft.concerns.splice(index,1);
    else if(briefDraft.concerns.length<3)briefDraft.concerns.push({key,impact:''});
    else {toast('Three concerns at most');return true;}
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
    appointmentData().brief=safeAppointments({brief:briefDraft}).brief;save(true);closeSheet();render(true);toast('Brief saved to the dossier');return true;
  }
  if(act==='brief-clear'){appointmentData().brief={concerns:[],goal:'',date:''};briefDraft=null;save(true);render(true);toast('Brief cleared');return true;}
  if(act==='appointment-calendar'){const text=appointmentCalendar(el.dataset.date);if(text)download('appointment-'+el.dataset.date+'.ics',text,'text/calendar');return true;}
  return false;
}
