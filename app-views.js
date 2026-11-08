/* ============================================================
   peri — views, sheets, router
   An instrument, not a companion. Today's page carries the finding of the
   day and the ledger of what happened; the log sheet files a moment with
   one tap; the dossier is what she brings to the appointment; the index is
   the reference, found by question.
   ============================================================ */
const PERI_BRAND_ICON = '<img src="__PERI_ICON_DATA__" alt="" width="36" height="36">';
const IC = {
  chev:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>',
  back:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>',
  arrow:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  plus:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  mic:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3"/></svg>',
  keyboard:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h.01M11 10h.01M15 10h.01M7 14h10"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  close:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  person:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
  moon:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"/></svg>',
  sun:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>'
};

const TOOL_CATALOG = [
  {id:'ride', name:'Ride it out', short:'60 seconds', description:'A hot flash passes in about a minute. Count it down; the time goes on record.', group:'Right now', q:'hot flash flush cool heat'},
  {id:'breath', name:'Paced breathing', short:'2 minutes', description:'Six breaths a minute. Evidence for anxiety and low mood; none for flashes.', group:'Right now', q:'breathe anxiety panic calm stress'},
  {id:'pmr', name:'Wind-down', short:'Muscle relaxation', description:'Tense and release, head to foot. Twelve steps, nine minutes.', group:'Right now', q:'sleep relax tension wind down night'},
  {id:'phq9', name:'PHQ-9 mood check', short:'Mood', description:'The standard nine-question depression screen, with the menopause caveat.', group:'Check', q:'mood depression low sad phq'},
  {id:'gad7', name:'GAD-7 anxiety check', short:'Anxiety', description:'The standard seven-question anxiety screen.', group:'Check', q:'anxiety anxious worry gad'},
  {id:'sleepwin', name:'Sleep window', short:'CBT-I restriction', description:'Your starting time-in-bed window from two weeks of logged sleep.', group:'Plan', q:'sleep insomnia window cbt bed'},
  {id:'protein', name:'Protein target', short:'Grams a day', description:'Weight and goal into a daily and per-meal number.', group:'Plan', q:'protein diet food muscle grams'},
  {id:'trigger', name:'28-day trigger test', short:'Remove, then reintroduce', description:'One structured experiment instead of avoiding six things at once.', group:'Plan', q:'trigger alcohol caffeine spicy test experiment'},
  {id:'waist', name:'Waist reference', short:'Thresholds', description:'Put a measurement into clinical context, and measure it the same way every time.', group:'Plan', q:'waist measure cm inches weight'}
];
const LEARN_MODULES = [
  {id:'stage', n:'Where am I?', s:'Staging, and how menopause is actually diagnosed', g:'Understand', q:'stage perimenopause postmenopause periods straw diagnosis where am i'},
  {id:'symptoms', n:'Symptom library', s:'What is happening, how long it lasts, what helps', g:'Understand', q:'symptom hot flash night sweat fog mood joint dryness bladder palpitations headache itch libido'},
  {id:'treatment', n:'Treatment options', s:'Hormone therapy, non-hormonal options, absolute risks', g:'Treat', q:'treatment hrt hormone estrogen oestrogen progesterone fezolinetant ssri patch risk breast cancer'},
  {id:'supplements', n:'Supplements & remedies', s:'What the trials show, which is mostly not much', g:'Treat', q:'supplement black cohosh soy isoflavone magnesium vitamin remedy herbal'},
  {id:'sleep', n:'Sleep', s:'Triage first, then real CBT-I, not a hygiene checklist', g:'Feel better', q:'sleep insomnia waking 3am night awake cbt-i apnea snoring tired'},
  {id:'mind', n:'Mood, anxiety & mind', s:'The risk window, brain fog, techniques that work', g:'Feel better', q:'mood anxiety depression brain fog memory concentration irritable overwhelmed'},
  {id:'exercise', n:'Movement & strength', s:'Resistance, bone loading, balance, pelvic floor', g:'Feel better', q:'exercise strength resistance bone pelvic floor balance walking weights'},
  {id:'sex', n:'Intimacy & sexual health', s:'Options table, lubricant criteria, pain pathway', g:'Feel better', q:'sex libido dryness vaginal pain intimacy lubricant estrogen cream'},
  {id:'diet', n:'Eating for this stage', s:'Protein, calcium, patterns, alcohol, energy myths', g:'Feel better', q:'diet food protein calcium alcohol eating weight sugar'},
  {id:'weight', n:'Weight & body composition', s:'What really changes, and what works', g:'Feel better', q:'weight gain belly fat waist composition metabolism'},
  {id:'skin', n:'Skin, hair & nails', s:'Four things with evidence; the rest is optional', g:'Feel better', q:'skin hair nails dry itch collagen retinoid'},
  {id:'clinician', n:'Prepare for an appointment', s:'Build a question list from your own record', g:'Prepare', q:'appointment doctor clinician questions prepare visit gp'},
  {id:'screening', n:'Preventive care checklist', s:'Scans and screens for this decade, with the dates you were seen', g:'Prepare', q:'screening mammogram cervical smear colon bone density dxa'},
  {id:'redflags', n:'Red flags', s:'Ten things that need care promptly', g:'Prepare', q:'red flag bleeding emergency urgent chest pain danger'},
  {id:'sources', n:'Sources & what we left out', s:'Where all of this comes from', g:'Prepare', q:'sources references evidence guideline nice menopause society'}
];
const LOG_ALWAYS = ['hf','ns','woke'];
const LOG_SYNONYMS = {
  hf:['hot flash','hot flush','flash','flush','flushing','overheating','boiling'],
  ns:['night sweat','sweat','sweating','soaked','drenched'],
  woke:['woke','awake','wake','woken','up again','can\'t sleep','cannot sleep','couldn\'t sleep'],
  fog:['fog','foggy','forgetful','forgot','concentrat','focus','memory'],
  mood:['low','down','sad','flat','tearful','cried','crying','depress'],
  anx:['anxious','anxiety','panic','on edge','worried','worry','nervous'],
  joint:['pain','ache','aching','sore','stiff','joint','knee','hip','back','shoulder'],
  head:['headache','migraine','head hurts'],
  palp:['palpitation','heart racing','racing heart','pounding'],
  dizzy:['dizzy','dizziness','lightheaded','faint'],
  bloating:['bloat','bloated','bloating'],
  dry:['dryness','dry','discomfort down there','burning'],
  uri:['bladder','urgency','urine','peeing','uti'],
  energy:['tired','exhausted','fatigue','wiped','no energy','drained'],
  itch:['itch','itchy','itching','crawling skin'],
  libido:['libido','no desire','sex drive'],
  irritable:['irritable','irritated','snappy','short tempered','angry'],
  overwhelmed:['overwhelmed','overwhelm','too much','can\'t cope','stressed'],
  bleed:['bleed','bleeding','spotting','period']
};
const SEVERITY_WORDS = [['strong',3],['severe',3],['bad',3],['awful',3],['terrible',3],['moderate',2],['medium',2],['mild',1],['slight',1],['small',1],['little',1]];

let curDate = todayISO();
let curTab = 'today';
let returnTab = 'today';
let sheetStack = [];
let sheetReturnStack = [];
let lastSheetTrigger = null;
let reportRange = 90;
let indexQuery = '';
let logMore = false;
let logNight = false;
let lastLogged = null;
let nightDeskDismissed = false;
let closeDraft = null;
let dictationOpen = false;
let momentEditId = null;
let treatmentChangeTarget = null;
let treatmentFollowUpTarget = null;
let treatmentStopTarget = null;
let medicationEditTarget = null;
let medFormOpen=false, labFormOpen=false;
let medDaysDraft=[0,1,2,3,4,5,6];
let appointmentQuestionEditId = null;
let afterVisitPlanEditId = null;
let firstRun = {appointment:null, date:'', more:false};
let nativePrivacyState = {loaded:false,appLock:null,reminders:null,deviceEncrypted:false,encryptedBackups:false};
let nativeHealthState = {loaded:false,status:null,busy:false};
const APP_VERSION = '2.0.0';
const CONTENT_REVIEWED = 'July 2026';

/* ---------- tiny helpers ---------- */
const $ = s => document.querySelector(s);
function h(tag, attrs, inner){
  const a = Object.entries(attrs||{}).map(([k,v])=>v==null?'':' '+k+'="'+esc(v)+'"').join('');
  return '<'+tag+a+'>'+(inner==null?'':inner)+'</'+tag+'>';
}
function toast(msg){
  const old=$('.toast'); if(old) old.remove();
  const el=document.createElement('div'); el.className='toast'; el.setAttribute('role','status');
  el.setAttribute('aria-live','polite'); el.textContent=msg;
  document.body.appendChild(el); setTimeout(()=>el.remove(), 2600);
}
function setPath(obj, path, val){
  const parts=path.split('.');
  let o=obj;
  for(let i=0;i<parts.length-1;i++){ o[parts[i]] = o[parts[i]]||{}; o=o[parts[i]]; }
  if(val===null || val===undefined || val==='') delete o[parts[parts.length-1]];
  else o[parts[parts.length-1]] = val;
}
function getPath(obj, path){ return path.split('.').reduce((o,k)=> (o==null?undefined:o[k]), obj); }
function dayLabel(d){ return parseISO(d).toLocaleDateString(undefined,{weekday:'short',day:'numeric',month:'short'}); }
function shortDate(d){ return parseISO(d).toLocaleDateString(undefined,{day:'numeric',month:'short'}); }
function dayNumber(){ const dates=entryDates(); const first=dates[0]||DB.meta.created||todayISO(); return Math.max(1,daysBetween(first,todayISO())+1); }
function refresh(){ render(true); if(sheetStack.length) renderSheet(false); }

/* ---------- scale / chip builders ---------- */
function scaleRow(path, labels, cur, min, groupLabel){
  min = min==null?0:min;
  groupLabel=groupLabel||'Severity';
  let b='';
  for(let i=min;i<labels.length+min;i++){
    b += h('button',{'data-act':'set','data-k':path,'data-v':i,'aria-pressed':cur===i?'true':'false','aria-label':groupLabel+': '+labels[i-min]}, String(i));
  }
  return '<div class="scale" role="group" aria-label="'+esc(groupLabel)+'">'+b+'</div><div class="scale-legend" aria-hidden="true"><span>'+esc(labels[0])+'</span><span>'+esc(labels[labels.length-1])+'</span></div>';
}
function chip(path, label, on){
  return h('button',{class:'chip','data-act':'toggle','data-k':path,'aria-pressed':on?'true':'false'}, esc(label));
}
function nativeReminderTime(value,fallback){
  const hour=value&&Number.isInteger(+value.hour)?+value.hour:+fallback.split(':')[0];
  const minute=value&&Number.isInteger(+value.minute)?+value.minute:+fallback.split(':')[1];
  return String(hour).padStart(2,'0')+':'+String(minute).padStart(2,'0');
}
function handleNativePrivacyResult(event){
  const detail=event&&event.detail;
  if(!detail||typeof detail!=='object') return;
  if(typeof detail.analyticsEnabled==='boolean') nativePrivacyState.analyticsEnabled=detail.analyticsEnabled;
  if(detail.appLock) nativePrivacyState.appLock=detail.appLock;
  if(detail.reminders) nativePrivacyState.reminders=detail.reminders;
  if(typeof detail.deviceEncrypted==='boolean') nativePrivacyState.deviceEncrypted=detail.deviceEncrypted;
  if(typeof detail.encryptedBackups==='boolean') nativePrivacyState.encryptedBackups=detail.encryptedBackups;
  nativePrivacyState.loaded=true;
  if(detail.ok===false&&!detail.cancelled&&detail.message) toast(detail.message);
  else if(detail.action==='app-lock'&&detail.ok) toast(detail.appLock&&detail.appLock.enabled?'App Lock on':'App Lock off');
  else if(detail.action==='reminders'&&detail.ok) toast('Reminders saved');
  if(curTab==='profile') render(true);
}
function handleNativeBackupImport(event){
  const detail=event&&event.detail;
  if(!detail||detail.ok!==true||typeof detail.state!=='string') return;
  try{
    DB=validateBackup(JSON.parse(detail.state));
    save(true); sheetStack=[]; renderSheet(); render();
    toast('Encrypted backup restored and checked');
  }catch(e){ toast('That backup could not be restored safely'); }
}
function handleNativeShareResult(event){
  const detail=event&&event.detail;
  if(!detail||detail.kind!=='backup') return;
  if(detail.ok) toast('Encrypted backup is ready to save');
  else if(detail.message) toast(detail.message);
}
function handleHealthKitResult(event){
  const detail=event&&event.detail;
  if(!detail||typeof detail!=='object') return;
  nativeHealthState.loaded=true; nativeHealthState.busy=false;
  nativeHealthState.status=detail.status||detail.authorization||detail.result&&detail.result.authorization||nativeHealthState.status;
  const summary=detail.summary||detail.result&&detail.result.summary;
  if(summary){
    const clean=safeHealthKitSummary(summary);
    if(clean){ DB.healthKit=clean; save(true); }
  }
  if(detail.ok===false&&detail.message) toast(detail.message);
  else if(summary) toast(summary.hasAnyData?'Apple Health summary updated':'Apple Health connected; no matching data');
  if(curTab==='profile') render(true);
}

/* ---------- record helpers ---------- */
function confirmedRecord(date){ return confirmedEntry(date); }
function focusedKeys(){
  const pins=DB.profile&&Array.isArray(DB.profile.pinnedSymptoms)?DB.profile.pinnedSymptoms:[];
  return pins.length?pins.slice(0,6):[...PeriOnboarding.defaults];
}
const SYM_DISPLAY = {sleepq:'Trouble sleeping', mood:'Low mood', anx:'Anxiety', fog:'Brain fog', joint:'Joint pain', dry:'Dryness', uri:'Bladder', energy:'Fatigue', head:'Headache', palp:'Palpitations', itch:'Skin', libido:'Low libido', bloating:'Bloating', dizzy:'Dizziness', irritable:'Irritability', overwhelmed:'Overwhelmed'};
function symptomName(key){
  if(key==='hf') return 'Hot flashes';
  if(key==='ns') return 'Night sweats';
  const found=SYMS.find(s=>s.k===key);
  return SYM_DISPLAY[key]||(found&&found.n)||key;
}
function symptomValue(record,key){
  if(!record) return null;
  if(key==='hf'||key==='ns') return record[key]==null?null:+record[key];
  return record.sym&&record.sym[key]!=null?+record.sym[key]:null;
}
function symptomPath(key){ return key==='hf'||key==='ns'?key:'sym.'+key; }
function appointmentData(){
  if(!DB.appointments||typeof DB.appointments!=='object') DB.appointments={questions:[],plans:[],brief:{concerns:[],goal:'',date:''},evidence:[]};
  if(!Array.isArray(DB.appointments.questions)) DB.appointments.questions=[];
  if(!Array.isArray(DB.appointments.plans)) DB.appointments.plans=[];
  if(!Array.isArray(DB.appointments.evidence)) DB.appointments.evidence=[];
  return DB.appointments;
}
function appointmentDate(){
  const brief=appointmentData().brief||{}, next=(appointmentData().plans||[]).map(p=>p.nextVisit).filter(d=>d&&d>=todayISO()).sort()[0];
  const candidates=[brief.date,next].filter(d=>d&&validISODate(d)&&d>=todayISO()).sort();
  return candidates[0]||'';
}

/* ---------- medications ---------- */
function medicationDetail(m){
  const days=m.days||[0,1,2,3,4,5,6];
  const schedule=days.length===7?'daily':days.map(d=>['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join(' & ');
  return (m.form||'medication')+' · '+schedule;
}
function medicationStatus(m){
  return m&&['active','stopped','archived'].includes(m.status)?m.status:(m&&m.archivedAt?'archived':m&&m.ended?'stopped':'active');
}
function medicationActiveOn(m,date){
  if(!m||!validISODate(date)) return false;
  if(m.started&&date<m.started) return false;
  if(m.ended&&date>m.ended) return false;
  if((m.pauses||[]).some(pause=>date>pause.stopped&&date<pause.resumed)) return false;
  if(date===todayISO()&&medicationStatus(m)!=='active') return false;
  return true;
}
function medicationDetailsOn(m,date){
  let details=m;
  const revisions=Array.isArray(m.revisions)?m.revisions:[];
  for(let i=revisions.length-1;i>=0;i--){ if(revisions[i].date>date) details=revisions[i].before; }
  return details;
}
function medicationCurrentStart(m){
  const pauses=Array.isArray(m.pauses)?m.pauses:[];
  return pauses.length?pauses[pauses.length-1].resumed:m.started;
}
function medicationRevisionSummary(revision){
  const before=revision.before, after=revision.after, changes=[];
  if(before.name!==after.name) changes.push('Name / dose: '+before.name+' → '+after.name);
  if(before.form!==after.form||JSON.stringify(before.days)!==JSON.stringify(after.days)) changes.push('Schedule: '+medicationDetail(before)+' → '+medicationDetail(after));
  if(before.due!==after.due) changes.push('Usual time: '+(before.due||'not set')+' → '+(after.due||'not set'));
  if(before.notes!==after.notes) changes.push('Notes: '+(before.notes||'none')+' → '+(after.notes||'none'));
  return changes.join('; ');
}
function medicationHistoryMarkup(m){
  const rows=[
    ...(m.pauses||[]).map(pause=>({date:pause.stopped,text:pause.name+' stopped '+fmtDay(pause.stopped)+(pause.reason?' · '+pause.reason:'')+'; restarted '+fmtDay(pause.resumed)})),
    ...(m.revisions||[]).map(revision=>({date:revision.date,text:fmtDay(revision.date)+' · '+medicationRevisionSummary(revision)}))
  ].sort((a,b)=>a.date.localeCompare(b.date));
  return rows.length?'<ul class="plain tiny">'+rows.map(row=>'<li>'+esc(row.text)+'</li>').join('')+'</ul>':'';
}
function scheduledMeds(date){
  const dow=parseISO(date).getDay();
  return (Array.isArray(DB.medications)?DB.medications:[]).filter(m=>medicationActiveOn(m,date)&&(medicationDetailsOn(m,date).days||[0,1,2,3,4,5,6]).includes(dow));
}
function medsTakenMarkup(date){
  const meds=scheduledMeds(date), day=DB.entries[date]||{}, adherence=day.med||{};
  if(!meds.length) return '';
  return meds.map(m=>{const rec=adherence[m.id]||{}, details=medicationDetailsOn(m,date);
    return `<button class="check sm" data-act="med-taken" data-id="${esc(m.id)}" data-d="${date}" aria-pressed="${rec.taken?'true':'false'}"><span class="box">${IC.check}</span><span>${esc(details.name)}</span><span class="s">${rec.taken?esc(rec.at||'taken'):esc(details.due||'due')}</span></button>`;}).join('');
}
function treatmentTargetField(prefix,selected){
  const chosen=Array.isArray(selected)?selected:[];
  const ordered=[...new Set([...focusedKeys(),...PINNABLE_SYMPTOMS])];
  return `<div class="field"><span class="fl">${prefix==='med'?'What is it for? Up to six symptoms to watch.':'Which symptoms should this change move? Up to six.'}</span>
    <p class="hint">Two- and six-week check-ins compare the week before with the week after, from your own pages.</p>
    <div class="chips" style="margin-top:8px">${ordered.map(key=>`<label class="chip sm" style="cursor:pointer;gap:8px"><input type="checkbox" name="${prefix}-target" value="${esc(key)}"${chosen.includes(key)?' checked':''} style="width:16px;height:16px">${esc(symptomName(key))}</label>`).join('')}</div></div>`;
}
function selectedTreatmentTargets(prefix){
  return [...document.querySelectorAll(`input[name="${prefix}-target"]:checked`)].map(input=>input.value).filter(key=>PINNABLE_SYMPTOMS.includes(key));
}
function treatmentWindowSnapshot(changeDate,startOffset,endOffset,targets){
  const windowStart=addDays(changeDate,startOffset), windowEnd=addDays(changeDate,endOffset), values={};
  (Array.isArray(targets)?targets:[]).forEach(key=>{
    const observations=[];
    for(let offset=startOffset;offset<=endOffset;offset++){
      const value=symptomValue(confirmedRecord(addDays(changeDate,offset)),key);
      if(value!=null&&!isNaN(value)) observations.push(value);
    }
    if(observations.length) values[key]={average:avg(observations),n:observations.length};
  });
  return {windowStart,windowEnd,values};
}
function newTreatmentChange(date,label,targets){
  const cleanTargets=[...new Set((targets||[]).filter(key=>PINNABLE_SYMPTOMS.includes(key)))].slice(0,6);
  return {date,label,targets:cleanTargets,baseline:treatmentWindowSnapshot(date,-7,-1,cleanTargets),followUps:[]};
}
function treatmentFollowUpItems(){
  const out=[];
  (Array.isArray(DB.medications)?DB.medications:[]).forEach((med,medIndex)=>{
    (Array.isArray(med.changes)?med.changes:[]).forEach((change,changeIndex)=>{
      if(!change||!pastOrTodayISO(change.date)||!Array.isArray(change.targets)||!change.targets.length) return;
      [2,6].forEach(week=>{
        const followUp=(Array.isArray(change.followUps)?change.followUps:[]).find(item=>item&&item.week===week)||null;
        const dueDate=addDays(change.date,week*7);
        if(!followUp&&med.ended&&dueDate>med.ended) return;
        out.push({med,medIndex,change,changeIndex,week,dueDate,followUp});
      });
    });
  });
  const rank=item=>item.followUp?2:(item.dueDate<=todayISO()?0:1);
  return out.sort((a,b)=>rank(a)-rank(b)||(rank(a)===2?(b.followUp.completed||'').localeCompare(a.followUp.completed||''):a.dueDate.localeCompare(b.dueDate)));
}
function findTreatmentFollowUp(target){
  if(!target) return null;
  return treatmentFollowUpItems().find(item=>item.med.id===target.medId&&item.changeIndex===target.changeIndex&&item.week===target.week)||null;
}
function treatmentBenefitLabel(value){ return ['No benefit noticed','Slight benefit','Some benefit','Clear benefit','Major benefit'][+value]||'Not recorded'; }
function treatmentAdherenceLabel(value){ return {all:'All scheduled doses',most:'Most scheduled doses',some:'About half of scheduled doses',few:'A few scheduled doses',none:'No scheduled doses'}[value]||'Not recorded'; }
function treatmentSideEffectLabel(value){ return {none:'None noticed',mild:'Mild',moderate:'Moderate',severe:'Severe'}[value]||'Not recorded'; }
function treatmentComparisonData(item){
  const baseline=item.change.baseline&&item.change.baseline.values?item.change.baseline.values:{};
  const after=item.followUp?(item.followUp.outcome||{values:{}}):treatmentWindowSnapshot(item.change.date,item.week*7-6,item.week*7,item.change.targets);
  return item.change.targets.map(key=>{
    const before=baseline[key]||null, current=after.values[key]||null;
    return {key,before,current,ready:!!before&&!!current&&before.n>=3&&current.n>=3};
  });
}
function treatmentComparisonMarkup(item){
  const rows=treatmentComparisonData(item);
  return `<div class="compare"><p class="xtiny"><b>Matched 7-day windows.</b> The week before the change against the week ending at week ${item.week}.</p>
    ${rows.map(row=>{
      const beforeN=row.before?row.before.n:0, currentN=row.current?row.current.n:0;
      if(!row.ready) return `<div class="kv stack"><b>${esc(symptomName(row.key))}</b><span class="r">Not enough pages yet (${beforeN}/7 before, ${currentN}/7 at week ${item.week}; at least 3 in each window needed).</span></div>`;
      const before=row.before.average, current=row.current.average, delta=current-before;
      const unit=row.key==='hf'?' / day':' / 4';
      const direction=Math.abs(delta)<0.05?'about the same':Math.abs(delta).toFixed(1)+' '+(delta<0?'lower':'higher');
      return `<div class="kv stack"><b>${esc(symptomName(row.key))}</b><span class="r">${r1(before)}${unit} before (${row.before.n}/7) · ${r1(current)}${unit} at week ${item.week} (${row.current.n}/7) · ${direction}.</span></div>`;
    }).join('')}
  </div>`;
}
function treatmentFollowUpForm(item){
  return `<div class="form" aria-label="${item.week}-week check-in for ${esc(item.med.name)}">
    <div class="label accent">${item.week}-week check-in</div><h3>${esc(item.med.name)}</h3>
    <p class="small muted">Change recorded ${esc(fmtDay(item.change.date))}: ${esc(item.change.label)}. Judge the target symptoms overall; the matched comparison below comes from your pages.</p>
    <div class="grid2"><div class="field"><label class="fl" for="followup-benefit">Benefit noticed</label><select id="followup-benefit"><option value="">Choose</option>${[0,1,2,3,4].map(value=>`<option value="${value}">${esc(treatmentBenefitLabel(value))}</option>`).join('')}</select></div>
      <div class="field"><label class="fl" for="followup-adherence">Doses taken</label><select id="followup-adherence"><option value="">Choose</option>${['all','most','some','few','none'].map(value=>`<option value="${value}">${esc(treatmentAdherenceLabel(value))}</option>`).join('')}</select></div></div>
    <div class="field"><label class="fl" for="followup-side-effect-level">Side effects</label><select id="followup-side-effect-level"><option value="">Choose</option>${['none','mild','moderate','severe'].map(value=>`<option value="${value}">${esc(treatmentSideEffectLabel(value))}</option>`).join('')}</select></div>
    <div class="field"><label class="fl" for="followup-side-effects">Side-effect details (optional)</label><textarea id="followup-side-effects" maxlength="500" placeholder="What happened, when, whether it settled"></textarea></div>
    <div class="field"><label class="fl" for="followup-notes">To raise at the next appointment (optional)</label><textarea id="followup-notes" maxlength="500"></textarea></div>
    ${treatmentComparisonMarkup(item)}
    <p class="xtiny">An observed association, not proof the treatment caused the change.</p>
    <div class="btn-row split"><button class="btn ink" data-act="treatment-followup-save" data-med-id="${esc(item.med.id)}" data-change-index="${item.changeIndex}" data-week="${item.week}">Save check-in</button><button class="btn outline" data-act="treatment-followup-cancel">Cancel</button></div>
  </div>`;
}
function treatmentFollowUpRows(items){
  if(!items.length) return '<p class="small muted">No check-ins scheduled. Choose target symptoms when you record a treatment change and the 2- and 6-week check-ins appear here.</p>';
  return items.slice(0,8).map(item=>{
    const daysUntil=daysBetween(todayISO(),item.dueDate), complete=item.followUp;
    const status=complete?'Done '+fmtDay(complete.completed):daysUntil<=0?'Due now':daysUntil===1?'Due tomorrow':'Due in '+daysUntil+' days';
    return `<div class="kv stack"><b>${item.week}-week check · ${esc(item.med.name)} <span class="muted" style="font-weight:400">· ${esc(status)}</span></b><span class="r">${esc(item.change.targets.map(symptomName).join(', '))}${complete?' · '+esc(treatmentBenefitLabel(complete.benefit))+' · side effects '+esc(treatmentSideEffectLabel(complete.sideEffectLevel)).toLowerCase():''}</span>${!complete&&daysUntil<=0?`<button class="textbtn" data-act="treatment-followup-open" data-med-id="${esc(item.med.id)}" data-change-index="${item.changeIndex}" data-week="${item.week}">Complete the check-in</button>`:''}</div>`;
  }).join('');
}
function treatmentFollowUpReport(days){
  const rangeStart=addDays(todayISO(),-(days-1));
  const items=treatmentFollowUpItems().filter(item=>item.followUp&&item.followUp.completed>=rangeStart).slice(0,8);
  if(!items.length) return '';
  return reportSection('Treatment check-ins',items.map(item=>{
    const followUp=item.followUp;
    return `<div class="kv stack"><b>${esc(item.med.name)} · ${item.week}-week check</b><span class="r">${esc(item.change.label)} · completed ${esc(fmtDay(followUp.completed))}. ${esc(treatmentBenefitLabel(followUp.benefit))}; ${esc(treatmentAdherenceLabel(followUp.adherence)).toLowerCase()}; side effects ${esc(treatmentSideEffectLabel(followUp.sideEffectLevel)).toLowerCase()}${followUp.sideEffects?' ('+esc(followUp.sideEffects)+')':''}.${followUp.notes?' Note: '+esc(followUp.notes):''}</span></div>${treatmentComparisonMarkup(item)}`;
  }).join('')+'<p class="xtiny">Observed associations, not proof of cause. Comparisons use equal seven-day windows and only recorded days.</p>');
}
const WEEKLY_WINDOW_DAYS=7, WEEKLY_MIN_COVERAGE=4;
function weeklyPatternWindows(anchor){
  const end=anchor||todayISO();
  const recent=Array.from({length:WEEKLY_WINDOW_DAYS},(_,i)=>addDays(end,i-(WEEKLY_WINDOW_DAYS-1)));
  const prior=Array.from({length:WEEKLY_WINDOW_DAYS},(_,i)=>addDays(end,i-(WEEKLY_WINDOW_DAYS*2-1)));
  return {recent,prior,recentCount:recent.filter(d=>!!confirmedRecord(d)).length,priorCount:prior.filter(d=>!!confirmedRecord(d)).length};
}
function treatmentEvents(){
  const out=[];
  (Array.isArray(DB.medications)?DB.medications:[]).forEach(m=>{
    const original=medicationDetailsOn(m,m.started||'0000-01-01');
    if(pastOrTodayISO(m.started)) out.push({date:m.started,order:0,title:original.name+' started',body:original.notes||medicationDetail(original)});
    (m.pauses||[]).forEach(pause=>out.push({date:pause.stopped,order:2,title:pause.name+' stopped',body:pause.reason||'Marked as no longer active.'}));
    (m.revisions||[]).forEach(revision=>out.push({date:revision.date,order:1,title:revision.before.name+' updated',body:medicationRevisionSummary(revision)}));
    (Array.isArray(m.changes)?m.changes:[]).forEach(change=>{
      if(change&&pastOrTodayISO(change.date)){
        const targets=Array.isArray(change.targets)&&change.targets.length?' · Watching '+change.targets.map(symptomName).join(', ')+'.':'';
        out.push({date:change.date,order:1,title:medicationDetailsOn(m,change.date).name+' changed',body:(change.label||'Treatment details updated.')+targets});
      }
    });
    if(pastOrTodayISO(m.ended)) out.push({date:m.ended,order:2,title:medicationDetailsOn(m,m.ended).name+' stopped',body:m.stopReason||'Marked as no longer active.'});
  });
  return out.sort((a,b)=>b.date.localeCompare(a.date)||(b.order||0)-(a.order||0));
}
function proteinTarget(){
  const wt = latestWeight();
  if(wt==null) return null;
  const g = Math.round(wt * (+DB.profile.proteinGpk||1.2));
  return {grams:g, perMeal:Math.round(g/3), kg:wt};
}
function latestWeight(){
  const ds = entryDates().slice().reverse();
  for(const d of ds){ const e=confirmedRecord(d); if(e&&e.wt!=null) return e.wt; }
  return null;
}

/* ============================================================
   CHROME
   ============================================================ */
const TAB_TITLES = {today:['Today','The page'], dossier:['Dossier','For the appointment'], index:['Index','The reference']};
function masthead(active,right){
  return `<header class="masthead"><div class="masthead-top"><button class="wordmark" data-act="tab" data-v="today" aria-label="peri, today’s page">peri</button><div style="display:flex;align-items:flex-end;gap:10px"><span class="masthead-meta">${right||''}</span><button class="iconbtn" data-act="open-profile" aria-label="You: profile, record and settings">${IC.person}</button></div></div><div class="rule thick"></div>
    <nav class="masthead-nav" aria-label="Primary">${Object.entries(TAB_TITLES).map(([k,v])=>`<button data-act="tab" data-v="${k}" aria-current="${k===active?'page':'false'}"${nativeProLocked(k)?' aria-label="'+esc(v[0])+', peri Pro"':''}>${esc(v[0])}</button>`).join('')}</nav></header>`;
}
function topbar(backLabel,backAct,meta){
  return `<div class="topbar"><button class="back" data-act="${esc(backAct||'go-back')}">${IC.back}<span>${esc(backLabel||'Today')}</span></button><span class="meta">${meta||''}</span></div><div class="rule thick"></div>`;
}
function ledgerRow(m,date,opts){
  const detail=momentDetail(m), accent=(m.k==='hf'&&m.s===3)||m.k==='bleed';
  const inner=`<span class="t">${esc(m.t)}</span><span class="e${accent?' accent':''}">${esc(momentName(m))}${m.k==='note'&&m.n?': <span class="small" style="font-family:var(--sans);font-weight:400;color:var(--text-2)">'+esc(m.n.length>60?m.n.slice(0,57)+'…':m.n)+'</span>':''}</span>${detail?`<span class="d">${esc(detail)}</span>`:''}`;
  if(!m.id||(opts&&opts.readOnly)) return `<div class="ledger-row">${inner}</div>`;
  return `<button class="ledger-row" data-act="moment" data-id="${esc(m.id)}" data-d="${date}" aria-label="Edit ${esc(momentName(m))} at ${esc(m.t)}">${inner}</button>`;
}
function ledgerMarkup(date,opts){
  const ms=dayMoments(date);
  if(!ms.length) return `<div class="ledger-row empty"><span class="e">${date===todayISO()?'Nothing yet today.':'Nothing logged this day.'}</span><span class="d">${date===todayISO()?'Log the first thing that happens.':''}</span></div>`;
  return ms.map(m=>ledgerRow(m,date,opts)).join('');
}
function ledgerSummary(date){
  const e=DB.entries[date]||{}, ms=dayMoments(date), parts=[];
  const n=k=>ms.filter(m=>m.k===k).length;
  const hf=e.hf!=null?e.hf:n('hf'); if(hf) parts.push(hf+' '+plural(hf,'flash','flashes'));
  const wakes=e.wakes!=null?e.wakes:n('woke'), sweats=n('ns')||e.ns||0;
  if(wakes||sweats) parts.push([wakes?wakes+' '+plural(wakes,'wake'):'',sweats?sweats+' '+plural(sweats,'sweat'):''].filter(Boolean).join(', '));
  if(e.sleepH!=null) parts.push(r1(e.sleepH)+' h sleep');
  const symKinds=ms.filter(m=>MOMENT_KINDS[m.k]&&MOMENT_KINDS[m.k].sym!==false).map(m=>m.k);
  [...new Set(symKinds)].slice(0,3).forEach(k=>parts.push(MOMENT_KINDS[k].n.toLowerCase()));
  const meds=scheduledMeds(date); if(meds.length&&meds.some(m=>e.med&&e.med[m.id]&&e.med[m.id].taken)) parts.push(meds.length===1?medicationDetailsOn(meds[0],date).form+' day':'medication taken');
  return parts.join(' · ');
}
function dossierReadiness(){
  const brief=savedBrief(), n=entryDates().length;
  let score=0;
  if(brief.concerns.length) score+=35;
  if(brief.concerns.some(c=>c.impact)) score+=15;
  if(brief.goal) score+=10;
  if(Array.isArray(brief.questions)&&brief.questions.length) score+=10;
  score+=Math.min(30,Math.round(n/14*30));
  return Math.min(100,score);
}
function stageSummary(){
  const label=DB.profile.stage||'';
  const map={
    'Late menopausal transition':['Late perimenopause, most likely.','Periods 60 or more days apart, with the symptoms you log, is that pattern. It usually runs one to three years. Reassessed as the record grows. Not a diagnosis.'],
    'Early menopausal transition':['Early perimenopause, most likely.','Cycles varying by a week or more is the first readable sign. Symptoms can run years ahead of the last period. Not a diagnosis.'],
    'Late reproductive stage':['Not yet, from the cycle alone.','Regular cycles that feel shorter are the earliest signal. The record will show more than any single test can.'],
    'Late reproductive stage (early)':['Not perimenopause yet, by the cycle.','Regular periods put you before the transition. Symptoms still count; log them.'],
    'Early postmenopause — the first two years':['Early postmenopause.','Twelve months without a period confirms menopause in hindsight. Flashes often peak here, then ease. Any bleeding from now on needs checking.'],
    'Postmenopause, roughly years 3–6':['Postmenopause.','Years three to six after the last period. Vaginal and urinary symptoms are the ones that worsen if left; they are also the most treatable.'],
    'Late postmenopause':['Late postmenopause.','More than six years on. Bone, heart and genitourinary health are the long game now.'],
    'Surgical menopause':['Surgical menopause.','Both ovaries removed means the hormone drop was abrupt. Managed differently from natural menopause; hormone therapy until around 52 is the usual advice absent contraindications.'],
    'Possible premature menopause — this needs assessment':['Needs assessment.','Menopause before 40 is a diagnosis to make with a clinician and blood tests, not an app. Bring the record.'],
    'Bleeding pattern no longer readable':['Cannot be staged from bleeding.','After a hysterectomy or ablation there is no cycle to read. Symptom trends are the evidence; that is what the pages are for.'],
    'Periods masked by contraception':['Masked by contraception.','Hormonal contraception hides the cycle signal. Staging leans on symptoms and age instead.']
  };
  if(map[label]) return {head:map[label][0],body:map[label][1],label};
  if(label) return {head:label+'.',body:'From your staging answers. Reassess in the Index if anything changes. Not a diagnosis.',label};
  return {head:'Not staged yet.',body:'Four questions in the Index place you on the STRAW+10 map. The dossier reads better with it.',label:''};
}

/* ============================================================
   TODAY'S PAGE
   ============================================================ */
function viewToday(){
  const t=todayISO();
  if(isNightHour()&&!nightDeskDismissed) return viewNight();
  const fs=findings(), top=fs[0], dossierList=dossierFindings();
  const topIndex=dossierList.findIndex(f=>f.id===top.id);
  const closed=dayClosed(t), rating=closed?confirmedEntry(t).rating:null;
  const appt=appointmentDate(), n=entryDates().length;
  const right=`${esc(dayLabel(t))}<br>Day ${dayNumber()}`;
  const dossierLine=appt
    ?`<b>Dossier</b> <span class="muted">· appointment in ${daysBetween(t,appt)} ${plural(daysBetween(t,appt),'day')} · ${dossierReadiness()}% ready</span>`
    :`<b>Dossier</b> <span class="muted">· ${n} ${plural(n,'day')} recorded · ${dossierList.length} ${plural(dossierList.length,'finding')}</span>`;
  const quiet=top.kind==='record';
  return `<div class="view page-today">
    ${masthead('today',right)}
    <section class="finding" aria-labelledby="finding-label">
      <div class="label" id="finding-label">${top.kind==='alert'?'Needs attention':quiet?'The record':'Today’s finding'}</div>
      <h1 class="head${quiet?' quiet':''}">${top.head}</h1>
      <p>${quiet||top.kind==='alert'?top.body:(top.sub?esc(top.sub.charAt(0).toUpperCase()+top.sub.slice(1))+'. ':'')+(topIndex>=0?'Filed to the dossier as finding '+String(topIndex+1).padStart(2,'0')+'.':'')}</p>
      ${top.cta?`<button class="filed" data-act="go" data-v="${esc(top.cta.go)}">${esc(top.cta.l)} ${IC.arrow}</button>`:topIndex>=0?`<button class="filed" data-act="tab" data-v="dossier">Open the dossier ${IC.arrow}</button>`:''}
    </section>
    <div class="rule strong"></div>
    <section class="ledger" aria-labelledby="ledger-label">
      <div style="display:flex;align-items:baseline;justify-content:space-between"><div class="label" id="ledger-label">The ledger</div><button class="textbtn muted" data-act="sheet" data-s="pages" style="padding:0;min-height:0;font-size:12px">Earlier pages</button></div>
      ${ledgerMarkup(t)}
      ${medsTakenMarkup(t)}
    </section>
    <div class="spacer"></div>
    <button class="linkrow" data-act="sheet" data-s="support"><span><b>Right now</b> <span class="muted">· can’t sleep, overwhelmed, hot flash, fog</span></span>${IC.arrow}</button>
    <button class="linkrow" data-act="tab" data-v="dossier"><span>${dossierLine}</span>${IC.arrow}</button>
    <div class="actions">
      <button class="btn accent wide" data-act="sheet" data-s="log">${IC.plus}Log</button>
      ${closed?`<button class="btn quiet" data-act="sheet" data-s="close">Closed · ${DAY_RATINGS[rating]}</button>`:`<button class="btn outline" data-act="sheet" data-s="close">Close the day</button>`}
    </div>
  </div>`;
}
function viewNight(){
  const t=todayISO(), now=nowHM();
  const tonight=dayMoments(t).filter(m=>windowOf(m.t).id==='night'&&hmMinutes(m.t)<6*60);
  const yesterdayLate=dayMoments(addDays(t,-1)).filter(m=>hmMinutes(m.t)>=22*60);
  const wakes=tonight.filter(m=>m.k==='woke').length;
  const trail=[...yesterdayLate,...tonight].filter(m=>['woke','ns','slept','note'].includes(m.k)).map(m=>momentName(m).toLowerCase()+' '+m.t);
  const ordinal=['','Second','Third','Fourth','Fifth','Sixth'][wakes]||(wakes+1)+'th';
  return `<div class="view night page-night">
    <div class="topbar"><span class="wordmark" style="font-size:22px">peri</span><span class="meta">Night desk · dimmed</span></div><div class="rule thick"></div>
    <div style="padding:26px 0 8px"><div class="clock" aria-label="Current time">${esc(now)}</div><h1 class="clock-sub">${wakes?'Awake again.':'Still up.'}</h1></div>
    <p class="small muted">${wakes?ordinal+' time tonight. ':''}Tap what it is and go back to bed. The page will be written by seven.</p>
    <div class="rule" style="margin-top:22px"></div>
    <div class="biglist">
      <button class="bigrow" data-act="log" data-k="woke" data-night="1"><span>Woke</span><span class="s">logs ${esc(now)}</span></button>
      <button class="bigrow" data-act="log" data-k="ns" data-night="1"><span>Night sweat</span><span class="s">logs ${esc(now)}</span></button>
      <button class="bigrow" data-act="sheet" data-s="tool:pmr"><span>Can’t sleep</span><span class="s">wind-down</span></button>
    </div>
    <div class="spacer"></div>
    <button class="btn accent" data-act="sheet" data-s="tool:breath">Breathe · 2 min</button>
    <p class="footnote">${trail.length?esc(trail.join(' · '))+' · now.':'Nothing logged tonight.'} <button class="textbtn muted" data-act="night-dismiss" style="padding:0 0 0 6px;min-height:0;font-size:12px">Open today’s page</button></p>
  </div>`;
}

/* ============================================================
   DOSSIER
   ============================================================ */
function sec(num,title,inner,action){
  return `<section class="sec" aria-labelledby="sec-${num}"><div class="sec-head"><span class="n">${num}</span><h2 id="sec-${num}">${esc(title)}</h2>${action||''}</div>${inner}</section>`;
}
function findingRow(f,i){
  return `<div class="fnd"><span class="n">${i+1}</span><div class="body"><h3 class="head">${f.head}</h3>${f.num?`<div class="figure"><span class="big">${f.num}</span>${f.sub?`<span class="sub">${esc(f.sub)}</span>`:''}</div>`:''}<p class="note">${f.kind==='insight'||f.kind==='alert'?f.body:'Filed '+esc(shortDate(f.filed))+'. '+f.body}${f.cta?` <button class="textbtn" data-act="go" data-v="${esc(f.cta.go)}" style="padding:0;min-height:0;display:inline">${esc(f.cta.l)}</button>`:''}</p></div></div>`;
}
function medsSection(){
  const meds=Array.isArray(DB.medications)?DB.medications:[], active=meds.filter(m=>medicationStatus(m)==='active'), stopped=meds.filter(m=>medicationStatus(m)!=='active');
  const followUps=treatmentFollowUpItems(), due=followUps.filter(item=>!item.followUp&&daysBetween(todayISO(),item.dueDate)<=0);
  const row=m=>{const adherence=rangeDates(7).filter(d=>scheduledMeds(d).includes(m)), taken=adherence.filter(d=>DB.entries[d]&&DB.entries[d].med&&DB.entries[d].med[m.id]&&DB.entries[d].med[m.id].taken).length;
    const change=(m.changes||[]).slice(-1)[0];
    return `<div class="kv"><span><b>${esc(m.name)}</b>${change&&change.label&&change.label!=='Treatment started'?' <span class="muted">· '+esc(change.label)+'</span>':''}</span><span class="r">${esc(medicationDetail(m).replace(/^[a-z]+ · /,''))}${m.started?' · from '+esc(shortDate(m.started)):''}${adherence.length?' · '+taken+' of '+adherence.length:''}</span></div>`;};
  const body=(active.length?active.map(row).join(''):'<p class="small muted">No treatments recorded. If you take something for this, it belongs here with its start date; the check-ins and the report both read from it.</p>')
    +(stopped.length?`<p class="xtiny" style="margin-top:8px">Stopped or archived: ${stopped.map(m=>esc(m.name)+(m.ended?' ('+esc(shortDate(m.ended))+')':'')).join(', ')}.</p>`:'')
    +(due.length?`<p class="small" style="margin-top:10px"><b>${due.length} check-in${due.length===1?'':'s'} due.</b> <button class="textbtn" data-act="sheet" data-s="treatments" style="padding:0;min-height:0;display:inline">Complete</button></p>`:'');
  return sec('03','Treatments',body,`<button class="textbtn" data-act="sheet" data-s="treatments">${meds.length?'Manage':'Add'}</button>`);
}
function questionsSection(){
  const brief=appointmentSuggestionBrief(), saved=savedBrief().concerns.length>0;
  const generated=saved?(Array.isArray(brief.questions)?brief.questions:generateBriefQuestions(brief)).filter(q=>q.selected!==false&&q.text):[];
  const personal=appointmentData().questions.filter(q=>!q.asked);
  const all=[...generated.map(q=>({text:q.text,why:q.reason})),...personal.map(q=>({text:q.text,why:'Your own question.',id:q.id}))];
  const body=all.length?all.slice(0,8).map((q,i)=>`<div class="qn"><span class="n">${i+1}</span><div style="flex:1 1 auto;min-width:0"><div class="q">${esc(q.text)}</div><div class="why">${esc(q.why)}${q.id?` <button class="textbtn muted" data-act="appointment-question-remove" data-id="${esc(q.id)}" style="padding:0;min-height:0;display:inline;font-size:12px">Remove</button>`:''}</div></div></div>`).join('')
    :'<p class="small muted">Set your three concerns and the questions write themselves from your record. Add your own below.</p>';
  return sec('04','Questions',body+(appointmentQuestionEditId!=null?appointmentQuestionForm():`<div style="display:flex;gap:18px;flex-wrap:wrap;margin-top:6px"><button class="textbtn" data-act="brief-start">${saved?'Edit the brief':'Build the brief'}</button><button class="textbtn ink" data-act="appointment-question-add">Add a question</button></div>`));
}
function appointmentQuestionForm(){
  const data=appointmentData(), question=appointmentQuestionEditId&&appointmentQuestionEditId!=='new'?data.questions.find(item=>item.id===appointmentQuestionEditId):null;
  return `<div class="form" style="margin-top:12px"><div class="field"><label class="fl" for="appointment-question">Question for your clinician</label><textarea id="appointment-question" maxlength="500" placeholder="Could the dose be adjusted on what I have logged?">${esc(question&&question.text||'')}</textarea></div><div class="btn-row split"><button class="btn ink sm" data-act="appointment-question-save" data-id="${esc(question&&question.id||'')}">${question?'Save':'Add'}</button><button class="btn outline sm" data-act="appointment-question-cancel">Cancel</button></div></div>`;
}
function afterVisitPlanForm(){
  const data=appointmentData(), plan=afterVisitPlanEditId&&afterVisitPlanEditId!=='new'?data.plans.find(item=>item.id===afterVisitPlanEditId):null;
  const actionText=plan?(plan.actions||[]).map(item=>item.text).join('\n'):'';
  return `<div class="form" style="margin-top:12px" aria-label="${plan?'Edit':'Add'} after-visit plan">
    <div class="field"><label class="fl" for="visit-date">Visit date</label><input id="visit-date" type="date" max="${todayISO()}" value="${esc(plan&&plan.date||todayISO())}"></div>
    <div class="field"><label class="fl" for="visit-summary">What was decided</label><textarea id="visit-summary" maxlength="2000" placeholder="Decision, dose change, tests ordered, advice">${esc(plan&&plan.summary||'')}</textarea></div>
    <div class="field"><label class="fl" for="visit-actions">Next steps, one per line</label><textarea id="visit-actions" maxlength="8000" placeholder="Collect prescription&#10;Book blood test&#10;Review in six weeks">${esc(actionText)}</textarea></div>
    <div class="field"><label class="fl" for="visit-next">Next appointment (optional)</label><input id="visit-next" type="date" value="${esc(plan&&plan.nextVisit||'')}"></div>
    <div class="btn-row split"><button class="btn ink sm" data-act="after-visit-save" data-id="${esc(plan&&plan.id||'')}">${plan?'Save plan':'Add plan'}</button><button class="btn outline sm" data-act="after-visit-cancel">Cancel</button></div>
  </div>`;
}
function afterVisitSection(){
  const plans=appointmentData().plans||[];
  const body=plans.length?plans.slice(0,6).map(plan=>`<div class="kv stack"><b>${esc(fmtDay(plan.date))}${plan.nextVisit?' <span class="muted" style="font-weight:400">· next '+esc(fmtDay(plan.nextVisit))+'</span>':''}</b>${plan.summary?`<span class="r">${esc(plan.summary)}</span>`:''}${(plan.actions||[]).map(action=>`<button class="check sm" data-act="after-visit-action-toggle" data-plan-id="${esc(plan.id)}" data-action-id="${esc(action.id)}" aria-pressed="${action.done?'true':'false'}"><span class="box">${IC.check}</span><span>${esc(action.text)}</span></button>`).join('')}<div style="display:flex;gap:14px"><button class="textbtn muted" data-act="after-visit-edit" data-id="${esc(plan.id)}" style="font-size:12px;min-height:36px">Edit</button><button class="textbtn muted" data-act="after-visit-remove" data-id="${esc(plan.id)}" style="font-size:12px;min-height:36px">Remove</button></div></div>`).join('')
    :'<p class="small muted">After the visit, write down what was decided while it is fresh. Next steps become a checklist; a next date goes on the page.</p>';
  return sec('06','After the visit',body+(afterVisitPlanEditId!=null?afterVisitPlanForm():'')+visitReminderMarkup(),afterVisitPlanEditId==null?'<button class="textbtn" data-act="after-visit-add">Add</button>':'');
}
function evidenceSection(){
  const data=appointmentData(), labs=Array.isArray(DB.labs)?DB.labs:[], scores=DB.scores.slice(-4).reverse();
  const evidence=data.evidence.slice().sort((a,b)=>b.date.localeCompare(a.date));
  const rows=[
    ...evidence.map(item=>`<div class="kv"><span>${item.kind==='chapter'?'<span class="muted">Chapter · </span>':''}${esc(item.text)}</span><span class="r">${esc(shortDate(item.date))} <button class="textbtn muted" data-act="evidence-remove" data-id="${esc(item.id)}" aria-label="Remove ${esc(item.text)}" style="padding:0 0 0 6px;min-height:0;display:inline;font-size:12px">×</button></span></div>`),
    ...labs.slice(0,6).map((x,i)=>`<div class="kv"><span><b>${esc(x.name)}</b> ${esc(x.value+(x.unit?' '+x.unit:''))}</span><span class="r">${esc(shortDate(x.date))} <button class="textbtn muted" data-act="lab-remove" data-i="${i}" aria-label="Remove ${esc(x.name)}" style="padding:0 0 0 6px;min-height:0;display:inline;font-size:12px">×</button></span></div>`),
    ...scores.map(s=>`<div class="kv"><span><b>${esc(s.type.toUpperCase())}</b> ${s.score}${s.band?' · '+esc(s.band):''}</span><span class="r">${esc(shortDate(s.date))}</span></div>`)
  ];
  const body=(rows.length?rows.join(''):'<p class="small muted">Lab results, questionnaire scores and any chapter you pin from the Index. The clinician report carries all of it.</p>')
    +(labFormOpen?labForm():'')
    +`<div style="display:flex;gap:18px;flex-wrap:wrap;margin-top:6px">${labFormOpen?'':'<button class="textbtn" data-act="lab-add">Add a lab result</button>'}<button class="textbtn ink" data-act="sheet" data-s="learn:screening">Screening dates</button></div>`;
  return sec('05','Evidence',body);
}
function labForm(){
  return `<div class="form" style="margin-top:12px" aria-label="Add lab result"><div class="grid2"><div class="field"><label class="fl" for="lab-name">Test</label><input id="lab-name" type="text" maxlength="80" placeholder="Estradiol"></div><div class="field"><label class="fl" for="lab-date">Date</label><input id="lab-date" type="date" max="${todayISO()}" value="${todayISO()}"></div></div><div class="grid2"><div class="field"><label class="fl" for="lab-value">Result</label><input id="lab-value" type="text" maxlength="40" placeholder="312"></div><div class="field"><label class="fl" for="lab-unit">Unit</label><input id="lab-unit" type="text" maxlength="30" placeholder="pmol/L"></div></div><div class="btn-row split"><button class="btn ink sm" data-act="lab-save">Save result</button><button class="btn outline sm" data-act="lab-cancel">Cancel</button></div></div>`;
}
function viewDossier(){
  const t=todayISO(), appt=appointmentDate(), n=entryDates().length, list=dossierFindings(), stage=stageSummary(), brief=savedBrief();
  const right=appt?`For the appointment<br>${esc(dayLabel(appt))}`:`For the appointment<br>No date set`;
  if(nativeProLocked('dossier')){
    return `<div class="view page-dossier">${masthead('dossier',right)}
      <div style="padding:22px 0 18px"><h1 style="font-size:clamp(44px,14vw,56px);line-height:.95;letter-spacing:-.035em;margin:0">Dossier</h1><p class="small muted" style="margin-top:10px">Everything they need in the ten minutes you get. Self-reported, recorded daily, dated.</p></div>
      <div class="lock"><div class="label accent" style="margin-bottom:10px">peri Pro</div><p class="lead">The dossier, the one-page brief, the treatment check-ins and the rehearsal.</p><p class="small muted">The page, the ledger, the night desk, the index and the finding of the day stay free. Your ${n} ${plural(n,'day')} on record are already here, waiting.</p><button class="btn accent" data-act="unlock-pro">Unlock peri Pro</button><button class="textbtn" data-act="manage-subscription">Already subscribed? Restore</button></div>
      <div class="spacer"></div><p class="footnote">Nothing here has left the phone.</p></div>`;
  }
  const opening=briefOpening(brief);
  return `<div class="view page-dossier">
    ${masthead('dossier',right)}
    <div style="padding:22px 0 18px"><h1 style="font-size:clamp(44px,14vw,56px);line-height:.95;letter-spacing:-.035em;margin:0">Dossier</h1><p class="small muted" style="margin-top:10px">Everything they need in the ten minutes you get. Self-reported, recorded daily, dated.</p></div>
    <div class="stats" aria-label="Dossier summary">
      ${appt?`<div class="stat"><div class="v accent num">${daysBetween(t,appt)}</div><div class="k">${plural(daysBetween(t,appt),'day')} to go</div></div>`:`<div class="stat"><div class="v num">${dayNumber()}</div><div class="k">day of record</div></div>`}
      <div class="stat"><div class="v num">${n}</div><div class="k">${plural(n,'day')} recorded</div></div>
      <div class="stat"><div class="v num">${list.length}</div><div class="k">${plural(list.length,'finding')}</div></div>
      <div class="stat"><div class="v num">${dossierReadiness()}<small>%</small></div><div class="k">brief ready</div></div>
    </div>
    <div style="padding:16px 0 4px"><button class="btn accent" data-act="open-report">Export the one-page brief</button></div>
    <div style="padding:8px 0 6px;display:flex;gap:8px"><button class="btn outline sm" data-act="sheet" data-s="rehearse">Rehearse the opening</button><button class="btn outline sm" data-act="sheet" data-s="appointment-date">${appt?'Change the date':'Set the date'}</button></div>
    ${sec('01','Where you are',`<p class="sec-lead">${esc(stage.head)}</p><p>${esc(stage.body)}</p>`,`<button class="textbtn" data-act="sheet" data-s="learn:stage">${stage.label?'Reassess':'Answer'}</button>`)}
    ${sec('02','Findings',list.length?list.slice(0,8).map(findingRow).join(''):'<p class="small muted">Nothing filed yet. Findings need about a week of pages; the first usually arrives around day seven.</p>')}
    ${medsSection()}
    ${questionsSection()}
    ${evidenceSection()}
    ${afterVisitSection()}
    ${sec('07','Opening statement',`<p class="quote${opening?'':' empty'}">${opening?'“'+esc(opening)+'”':'Set your three concerns and the opening writes itself.'}</p>`,`<button class="textbtn" data-act="${opening?'sheet':'brief-start'}"${opening?' data-s="rehearse"':''}>${opening?'Rehearse':'Write it'}</button>`)}
    <p class="xtiny" style="padding-top:16px;line-height:1.45">Self-reported. Associations are your own record, not evidence of cause. Not a clinical record. Nothing here has left the phone.</p>
  </div>`;
}

/* ============================================================
   INDEX
   ============================================================ */
function indexEntries(query){
  const q=(query||'').trim().toLowerCase();
  const chapters=LEARN_MODULES.map((m,i)=>({kind:'chapter',id:'learn:'+m.id,group:m.g,path:(q?m.g+' · ':'Chapter ')+(i+1)+' of '+LEARN_MODULES.length,head:m.n,body:m.s,q:(m.n+' '+m.s+' '+m.q).toLowerCase()}));
  const tools=TOOL_CATALOG.map((t,i)=>({kind:'tool',id:'tool:'+t.id,path:'Tool · '+t.group,head:t.name,body:t.description,q:(t.name+' '+t.description+' '+t.q).toLowerCase()}));
  const symptoms=(typeof SYMPTOMS!=='undefined'?SYMPTOMS:[]).map(s=>({kind:'symptom',id:'learn:sym-'+s.id,path:'Symptom library',head:s.name,body:s.quick,q:(s.name+' '+s.quick+' '+(s.tag||'')).toLowerCase()}));
  if(!q) return chapters;
  const words=q.split(/\s+/).filter(w=>w.length>1&&!['the','and','why','am','is','my','at','do','what','how','i','a','to','of'].includes(w));
  const score=item=>words.reduce((n,w)=>n+(item.q.includes(w)?1:0),0)+(item.q.includes(q)?3:0);
  return [...chapters,...symptoms,...tools].map(item=>({item,s:score(item)})).filter(x=>x.s>0).sort((a,b)=>b.s-a.s).map(x=>x.item);
}
function viewIndex(){
  const entries=indexEntries(indexQuery), all=findings(), pattern=all.find(f=>f.kind==='pattern'&&!f.id.startsWith('today-'))||all.find(f=>f.kind==='pattern');
  const groups=indexQuery.trim()?null:['Understand','Treat','Feel better','Prepare'];
  const entry=e=>`<button class="entry" data-act="sheet" data-s="${esc(e.id)}"><div class="path">${esc(e.path)}</div><div class="head">${esc(e.head)}</div><p>${esc(e.body)}</p></button>`;
  return `<div class="view page-index">
    ${masthead('index',`${LEARN_MODULES.length} chapters · ${TOOL_CATALOG.length} tools<br>reviewed ${CONTENT_REVIEWED}`)}
    <label class="ask"><span class="sr-only">Search the index</span><input type="search" data-act="index-search" value="${esc(indexQuery)}" placeholder="Why am I waking at 3 am?" autocomplete="off" enterkeyhint="search"><span class="iconbtn" aria-hidden="true">${IC.mic}</span></label>
    ${pattern&&!indexQuery?`<p class="ask-ledger">In your ledger: ${pattern.head.replace(/\.$/,'').replace(/^(\w)/,c=>c.toLowerCase())}${pattern.sub?' ('+esc(pattern.sub)+')':''}.</p>`:''}
    <div id="index-results">${groups?groups.map(g=>`<div class="label" style="margin:20px 0 2px">${esc(g)}</div>`+entries.filter(e=>e.group===g).map(entry).join('')).join('')+`<div class="label" style="margin:20px 0 2px">Tools</div>`+TOOL_CATALOG.map(t=>`<button class="entry" data-act="sheet" data-s="tool:${t.id}"><div class="path">Tool · ${esc(t.group)}</div><div class="head">${esc(t.name)}</div><p>${esc(t.description)}</p></button>`).join('')
      :entries.length?entries.map(entry).join(''):`<p class="empty">Nothing in the index matches that. Try a symptom, a treatment or a tool.</p>`}</div>
    <div class="spacer"></div>
    <div style="display:flex;justify-content:space-between;gap:12px;padding-top:18px" class="xtiny"><span>Education, not medical advice.</span><span>Any chapter can be pinned to the dossier.</span></div>
  </div>`;
}

/* ============================================================
   YOU
   ============================================================ */
function nativePrivacyBlock(){
  if(window.__MENO_NATIVE__!==true) return '';
  if(!nativePrivacyState.loaded) return `<div class="label" style="margin:22px 0 8px">Privacy and reminders</div><p class="small muted">Loading iPhone settings…</p>`;
  const lock=nativePrivacyState.appLock||{available:false,enabled:false,label:'biometric unlock'};
  const reminders=nativePrivacyState.reminders||{permission:'not-determined',preferences:{dailyCheckIn:{enabled:false,hour:20,minute:0},treatmentFollowUp:{enabled:false,weekday:1,hour:10,minute:0}}};
  const daily=reminders.preferences&&reminders.preferences.dailyCheckIn||{}, follow=reminders.preferences&&reminders.preferences.treatmentFollowUp||{};
  const weekdays=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  return `<div class="label" style="margin:22px 0 8px">Privacy and reminders</div>
    <div class="toggle-row"><div><b>App Lock</b><span class="hint">${lock.available?`${esc(lock.label)} or the passcode when peri comes back from the background.`:'Set up Face ID or Touch ID in iOS Settings to make this available.'}</span></div><button class="switch" data-act="app-lock-toggle" data-enabled="${lock.enabled?'false':'true'}" aria-pressed="${lock.enabled?'true':'false'}" aria-label="App Lock"${lock.available?'':' disabled'}></button></div>
    <div class="toggle-row"><div><b>Optional analytics</b><span class="hint">Feature use and performance. Never health entries.</span></div><button class="btn xs outline" data-act="analytics-settings">Review</button></div>
    <div class="toggle-row"><div><b>Apple tracking</b><span class="hint">System permission, separate from analytics.</span></div><button class="btn xs outline" data-act="advertising-settings">Settings</button></div>
    <div class="toggle-row"><div><b>Analytics data</b><span class="hint">Delete this installation’s analytics events.</span></div><button class="btn xs outline" data-act="erase-analytics">Delete</button></div>
    <p class="xtiny" style="margin-top:8px">${nativePrivacyState.deviceEncrypted?'The record is encrypted at rest with a device-bound key.':'Secure native storage is unavailable on this build.'}</p>
    <div class="label" style="margin:22px 0 8px">Reminders</div>
    <p class="small muted">Generic wording only; a reminder never contains symptoms or treatments. Permission is asked for when you save an enabled reminder.</p>
    <div class="optrow"><input id="daily-reminder-enabled" type="checkbox"${daily.enabled?' checked':''}><label for="daily-reminder-enabled">Close the day</label><input id="daily-reminder-time" type="time" value="${nativeReminderTime(daily,'20:00')}" aria-label="Daily reminder time" style="width:auto;min-height:40px"></div>
    <div class="optrow"><input id="treatment-reminder-enabled" type="checkbox"${follow.enabled?' checked':''}><label for="treatment-reminder-enabled">Weekly treatment review</label><select id="treatment-reminder-day" aria-label="Weekday" style="width:auto;min-height:40px">${weekdays.map((label,index)=>`<option value="${index+1}"${+(follow.weekday||1)===index+1?' selected':''}>${label.slice(0,3)}</option>`).join('')}</select><input id="treatment-reminder-time" type="time" value="${nativeReminderTime(follow,'10:00')}" aria-label="Weekly review time" style="width:auto;min-height:40px"></div>
    <button class="btn outline sm" data-act="save-native-reminders" style="margin-top:10px">Save reminders</button>
    <p class="xtiny">Notification permission: ${esc(String(reminders.permission||'not-determined').replace('-', ' '))}.</p>`;
}
function healthKitBlock(){
  if(window.__MENO_NATIVE__!==true) return '';
  const summary=DB.healthKit, status=nativeHealthState.status||{};
  const unavailable=nativeHealthState.loaded&&status.available===false;
  const value=(v,suffix)=>v==null?'unavailable':r1(v)+suffix;
  return `<div class="label" style="margin:22px 0 8px">Apple Health</div>
    <p class="small muted">Read-only. peri reads aggregate steps, sleep and your latest weight when you tap the button, and never writes to Apple Health.</p>
    ${summary?`<div class="kv"><span>Steps</span><span class="r">${value(summary.steps.dailyAverage,' / day')}</span></div><div class="kv"><span>Sleep</span><span class="r">${value(summary.sleep.nightlyAverageHours,' h / night')}</span></div><div class="kv"><span>Latest weight</span><span class="r">${summary.bodyWeight.latestKilograms==null?'unavailable':r1(U.wOut(summary.bodyWeight.latestKilograms))+' '+U.wLabel()}</span></div><p class="xtiny">${summary.lookbackDays}-day aggregate, synced ${esc(new Date(summary.generatedAt).toLocaleString())}. A missing value can mean no data or access not shared; Apple does not say which.</p>`:'<p class="small muted">No summary saved yet.</p>'}
    <div class="btn-row split" style="margin-top:8px"><button class="btn outline sm" data-act="healthkit-sync"${unavailable||nativeHealthState.busy?' disabled':''}>${summary?'Sync':'Connect'}</button>${summary?'<button class="btn outline sm" data-act="healthkit-clear">Remove summary</button>':''}</div>
    ${unavailable?'<p class="xtiny">Apple Health is unavailable on this device or build.</p>':''}`;
}
function viewYou(){
  const p=DB.profile, age=p.birthYear?(new Date().getFullYear()-p.birthYear):null, dates=entryDates(), pt=proteinTarget();
  const sel=(id,k,options,hint)=>`<div class="field"><label class="fl" for="${id}">${options.label}</label><select id="${id}" data-act="prof" data-k="${k}">${options.items.map(([v,l])=>`<option value="${v}"${String(p[k])===String(v)?' selected':''}>${esc(l)}</option>`).join('')}</select>${hint?`<p class="hint">${hint}</p>`:''}</div>`;
  return `<div class="view page-you">
    ${topbar(TAB_TITLES[returnTab]?TAB_TITLES[returnTab][0]:'Today','go-back',`You · ${esc(p.name||'the record')}`)}
    <div style="padding:22px 0 14px"><h1 style="font-size:clamp(36px,11vw,44px);line-height:1;letter-spacing:-.03em;margin:0">${p.name?esc(p.name):'You'}</h1><p class="small muted" style="margin-top:10px">${dates.length} ${plural(dates.length,'day')} on record${dates.length?', since '+esc(shortDate(dates[0])):''}. ${Store.ephemeral?'<b>This preview cannot save</b>; entries disappear when the page closes.':window.__MENO_NATIVE__===true?'Stored in an encrypted file on this device.':'Stored in this browser, on this device only.'}</p></div>
    <div class="rule strong"></div>
    <div class="label" style="margin:22px 0 8px">The record</div>
    <button class="linkrow" data-act="sheet" data-s="data" style="border-top:0"><span><b>Export or restore</b> <span class="muted">· JSON, CSV${window.__MENO_NATIVE__===true?', encrypted backup':''}</span></span>${IC.arrow}</button>
    <button class="linkrow" data-act="open-report"><span><b>Clinician report</b> <span class="muted">· print or save as PDF</span></span>${IC.arrow}</button>
    ${window.__MENO_NATIVE__===true?`<button class="linkrow" data-act="manage-subscription"><span><b>Apple subscription</b></span>${IC.arrow}</button>`:''}
    <button class="linkrow" data-act="reset-onboarding"><span><b>Redo the first page</b> <span class="muted">· keeps every record</span></span>${IC.arrow}</button>
    <button class="linkrow" data-act="delete-local-data"><span><b style="color:var(--accent-text)">Delete everything</b> <span class="muted">· permanent</span></span>${IC.arrow}</button>
    ${nativePrivacyBlock()}
    ${healthKitBlock()}
    <div class="label" style="margin:22px 0 10px">Profile</div>
    <div class="grid2"><div class="field"><label class="fl" for="pn">Name</label><input id="pn" type="text" maxlength="80" autocomplete="given-name" data-act="prof" data-k="name" value="${esc(p.name||'')}"></div><div class="field"><label class="fl" for="by">Birth year</label><input id="by" type="number" min="1920" max="${new Date().getFullYear()-18}" inputmode="numeric" data-act="prof" data-k="birthYear" value="${p.birthYear||''}"></div></div>
    ${sel('ps','periodStatus',{label:'Periods',items:[['','Not said'],['regular','Still regular'],['changing','Changing'],['gaps','60+ days apart'],['stopped','Gone a year or more'],['na','Not applicable']]})}
    ${sel('ut','uterus',{label:'Uterus',items:[['unknown','Prefer not to say'],['intact','Still there'],['hyst','Removed (hysterectomy)'],['ablation','Endometrial ablation']]})}
    ${sel('ov','ovaries',{label:'Ovaries',items:[['unknown','Prefer not to say or not sure'],['kept','Both still there'],['one','One removed'],['both','Both removed']]},'Asked separately: a hysterectomy often leaves both ovaries, and ovaries are sometimes removed with the uterus left. The consequences differ completely.')}
    ${periodsPossible()
      ?`<div class="field"><label class="fl" for="lp">Last period</label><input id="lp" type="date" min="${p.birthYear?p.birthYear+'-01-01':'1900-01-01'}" max="${todayISO()}" data-act="prof" data-k="lastPeriod" value="${p.lastPeriod||''}"><p class="hint">Counts the months without a period and flags bleeding that needs checking.</p></div>`
      :`<div class="field"><label class="fl" for="sd">Surgery date, if known</label><input id="sd" type="date" min="${p.birthYear?p.birthYear+'-01-01':'1900-01-01'}" max="${todayISO()}" data-act="prof" data-k="surgeryDate" value="${p.surgeryDate||''}"><p class="hint">${p.ovaries==='both'?'Both ovaries removed means menopause dates from the operation.':'With no readable bleeding pattern, the surgery date stands in for the last period.'}</p></div>`}
    ${sel('bn','bone',{label:'Bone status',items:[['unknown',"Don't know"],['normal','Normal density'],['osteopenia','Osteopenia'],['osteoporosis','Osteoporosis'],['fracture','Previous fragility fracture']]},'Gates the bone-loading advice in the movement chapter.')}
    <div class="kv"><span>Stage</span><span class="r">${esc(stageSummary().head)} <button class="textbtn" data-act="sheet" data-s="learn:stage" style="padding:0 0 0 6px;min-height:0;display:inline">${p.stage?'Reassess':'Answer'}</button></span></div>
    <div class="label" style="margin:22px 0 10px">The log sheet</div>
    <p class="small muted">Hot flash, night sweat and woke are always on it. Choose up to six more words.</p>
    <div class="chips">${Object.keys(MOMENT_KINDS).filter(k=>MOMENT_KINDS[k].sym!==false).map(k=>`<button class="chip sm" data-act="profile-symptom" data-v="${k}" aria-pressed="${(p.pinnedSymptoms||[]).includes(k)?'true':'false'}">${esc(MOMENT_KINDS[k].n)}</button>`).join('')}</div>
    <div class="label" style="margin:22px 0 10px">Targets</div>
    ${sel('pg','proteinGpk',{label:'Protein target (g per kg)',items:[[1,'1.0 · general floor'],[1.2,'1.2 · baseline'],[1.4,'1.4 · active or losing weight'],[1.6,'1.6 · training range']]},pt?`About <b>${pt.grams} g a day</b> at your latest weight, roughly ${pt.perMeal} g per meal.`:'Log a weight in the day’s details to see the grams.')}
    <div class="grid2"><div class="field"><label class="fl" for="wg">Weight goal (${U.wLabel()})</label><input id="wg" type="number" step="0.1" min="${U.imp?44:20}" max="${U.imp?1100:500}" inputmode="decimal" data-act="prof" data-k="weightGoal" data-conv="w" value="${p.weightGoal!=null?r1(U.wOut(p.weightGoal)):''}"></div><div class="field"><label class="fl" for="wag">Waist goal (${U.lLabel()})</label><input id="wag" type="number" step="0.1" min="${U.imp?12:30}" max="${U.imp?118:300}" inputmode="decimal" data-act="prof" data-k="waistGoal" data-conv="l" value="${p.waistGoal!=null?r1(U.lOut(p.waistGoal)):''}"></div></div>
    <div class="label" style="margin:22px 0 10px">Settings</div>
    ${sel('un','units',{label:'Units',items:[['imperial','Pounds and inches'],['metric','Kilograms and centimetres']]})}
    ${sel('rg','region',{label:'Where you are',items:[['us','United States'],['uk','United Kingdom'],['other','Elsewhere']]},'Guidance differs on drug labelling, SSRIs for hot flashes, testosterone access and calcium and vitamin D targets.')}
    ${sel('th','theme',{label:'Appearance',items:[['auto','Follow the device'],['light','Paper'],['dark','Night']]})}
    <div class="label" style="margin:22px 0 8px">Privacy, plainly</div>
    <p class="small muted">${window.__MENO_NATIVE__===true
      ?'The record stays on this device in an encrypted file protected by a device-bound key. Optional encrypted backups use a password you choose. Apple Health access is read-only and happens only when you tap the button. Widgets receive only whether today has a page and a seven-day count. Reminders carry no health details. There is no account and no sync.'
      :'The record stays in this browser’s storage on this device. There is no account, no health-data API and no sync. Browser storage is not encrypted by this app, so anyone with access to this browser profile could open it. Clearing site data deletes the record. Export a backup now and then.'} External source links contact those sites only when you open them.</p>
    <div class="label" style="margin:22px 0 8px">Medical disclaimer</div>
    <p class="small muted">General health education compiled from published clinical guidelines. It does not diagnose, treat or prescribe, is not a substitute for professional medical advice, and is not a medical device. Content reviewed ${CONTENT_REVIEWED}; this field moves quickly. Seek care promptly for anything on the red-flag list.</p>
    <p class="xtiny center" style="margin:24px 0 8px">peri ${APP_VERSION}</p>
  </div>`;
}

/* ============================================================
   FIRST RUN: a letter with blanks
   ============================================================ */
const LETTER_SYMPTOMS=[['sleepq','trouble sleeping'],['hf','hot flashes'],['fog','brain fog'],['energy','fatigue'],['mood','low mood'],['anx','anxiety'],['ns','night sweats'],['joint','joint pain']];
const LETTER_MORE=[['head','headaches'],['palp','palpitations'],['dizzy','dizziness'],['bloating','bloating'],['dry','dryness'],['uri','bladder trouble'],['itch','itchy skin'],['libido','low libido'],['irritable','irritability'],['overwhelmed','feeling overwhelmed']];
const LETTER_PERIODS=[['regular','still regular'],['changing','changing'],['gaps','60+ days apart'],['stopped','gone a year or more'],['na','not applicable']];
function firstRunAnswers(){
  const p=DB.profile, age=p.birthYear?new Date().getFullYear()-p.birthYear:null;
  if(!p.periodStatus||p.periodStatus==='na'||age==null) return null;
  const pins=p.pinnedSymptoms||[];
  const ans={age:age<40?'u40':age<45?'40s_e':age<55?'45p':'55p',uterus:'intact',ovaries:'kept',contra:'no',
    cycle:{regular:'reg',changing:'var7',gaps:'skip',stopped:'none12'}[p.periodStatus],
    vms:pins.includes('hf')||pins.includes('ns')?'lots':'no'};
  if(ans.cycle==='none12') ans.since='lt2';
  return ans;
}
function firstRunFinding(){
  const p=DB.profile, pins=p.pinnedSymptoms||[], ans=firstRunAnswers();
  if(!pins.length) return null;
  const named=pins.slice(0,3).map(k=>MOMENT_KINDS[k]?MOMENT_KINDS[k].n.toLowerCase():symptomName(k).toLowerCase());
  const list=named.length>1?named.slice(0,-1).join(', ')+' and '+named.slice(-1):named[0];
  if(!ans){
    if(p.periodStatus==='na') return {head:'Your pattern will come from the pages.',body:'With no cycle to read, staging leans on symptoms and age. Four questions in the Index place you properly. '+list.charAt(0).toUpperCase()+list.slice(1)+' get watched from tonight.'};
    return {head:'Fill in the rest and the finding appears.',body:'Age and cycle together are what staging runs on.'};
  }
  const res=stageResult(ans), s={
    'Late menopausal transition':['Most likely: late perimenopause.','Periods 60+ days apart, with '+list+' together, is that pattern. It usually runs one to three years. It is very treatable. You are not imagining it.'],
    'Early menopausal transition':['Most likely: early perimenopause.','Cycles varying by a week or more, with '+list+', is the first readable stage. Symptoms can run years ahead of the last period. Treatable now, not later.'],
    'Late reproductive stage':['Probably before the transition, by the cycle.','Regular cycles, even shorter ones, put you ahead of perimenopause on paper. '+list.charAt(0).toUpperCase()+list.slice(1)+' still count, and the pages will show whether they move.'],
    'Late reproductive stage (early)':['Not perimenopause yet, by the cycle.','Regular periods place you before the transition. '+list.charAt(0).toUpperCase()+list.slice(1)+' are worth recording anyway; the record is what will show a change.'],
    'Early postmenopause — the first two years':['Postmenopause, the first two years.','A year without a period confirms it in hindsight. Flashes often peak here, then ease. Any bleeding from now on needs checking, not watching.'],
    'Postmenopause, roughly years 3–6':['Postmenopause.','Years three to six after the last period. Dryness and bladder symptoms are the ones that worsen if left, and the most treatable.'],
    'Late postmenopause':['Late postmenopause.','More than six years on. Bone, heart and genitourinary health are the long game now.'],
    'Possible premature menopause — this needs assessment':['This needs a clinician, not an app.','Under 40 with these changes is a diagnosis to make properly, with blood tests. Bring the record; it shortens the conversation.']
  }[res.label]||[res.label+'.','From your age and cycle. Reassess any time in the Index.'];
  return {head:s[0],body:s[1],label:res.label,answers:ans};
}
function viewFirstRun(){
  const p=DB.profile, pins=p.pinnedSymptoms||[], age=p.birthYear?new Date().getFullYear()-p.birthYear:'';
  const blank=(act,v,label,on)=>`<button class="blank" data-act="${act}" data-v="${esc(v)}" aria-pressed="${on?'true':'false'}">${esc(label)}</button>`;
  const finding=firstRunFinding();
  const watched=[
    pins.some(k=>['ns','sleepq','woke'].includes(k))?['Nights','Wakes, sweats','and what follows']:null,
    pins.includes('hf')?['Days','Flash clusters','by hour']:null,
    pins.includes('fog')||pins.includes('energy')?['Fog','After bad nights','to show the link']:null,
    pins.some(k=>['mood','anx','irritable','overwhelmed'].includes(k))?['Mood','Two-week runs','not single days']:null,
    ['Flags','Red flags','e.g. bleeding after a year']
  ].filter(Boolean);
  return `<div class="view page-firstrun">
    <div class="masthead"><div class="masthead-top"><span class="wordmark" style="font-size:30px">peri</span><span class="masthead-meta">Two minutes · no account</span></div><div class="rule thick"></div></div>
    <h1 style="font-size:clamp(28px,8.2vw,32px);line-height:1.05;margin:24px 0 8px">Fill in the blanks. That is the whole setup.</h1>
    <p class="letter">Lately the hardest things have been ${LETTER_SYMPTOMS.map(([k,l])=>blank('fr-symptom',k,l,pins.includes(k))).join(' ')}${firstRun.more?' '+LETTER_MORE.map(([k,l])=>blank('fr-symptom',k,l,pins.includes(k))).join(' '):' <button class="blank" data-act="fr-more" aria-expanded="false" style="border-style:dashed;color:var(--text-2)">more…</button>'}.</p>
    <p class="letter">My periods are ${LETTER_PERIODS.map(([v,l])=>blank('fr-periods',v,l,p.periodStatus===v)).join(' ')}.</p>
    <p class="letter">I am <span class="blank input"><label class="sr-only" for="fr-age">Your age</label><input id="fr-age" type="number" min="18" max="90" inputmode="numeric" placeholder="47" data-act="fr-age" value="${age||''}"></span> and I ${blank('fr-appt','yes','have an appointment coming',firstRun.appointment==='yes')} ${blank('fr-appt','no','don’t, yet',firstRun.appointment==='no')}.${firstRun.appointment==='yes'?` <span class="blank input"><label class="sr-only" for="fr-date">Appointment date</label><input id="fr-date" type="date" data-act="fr-date" value="${esc(firstRun.date)}" min="${todayISO()}" style="width:auto;padding:2px 8px;font-size:.8em"></span>`:''}</p>
    <div class="rule" style="margin-top:14px"></div>
    ${finding?`<section class="finding" aria-live="polite"><div class="label accent">The finding</div><h2 class="head" style="font-size:clamp(30px,9vw,36px);line-height:1">${esc(finding.head)}</h2><p style="font-size:15.5px;color:var(--text-2)">${esc(finding.body)}</p></section>`:`<section class="finding"><div class="label">The finding</div><h2 class="head quiet">Appears once the blanks are filled.</h2></section>`}
    <div style="padding:4px 0 20px"><div class="label" style="margin-bottom:4px">What gets watched</div>${watched.map(([a,b,c],i)=>`<div class="ledger-row"><span class="t">${esc(a)}</span><span class="e">${esc(b)}</span><span class="d">${esc(c)}</span></div>`).join('')}</div>
    <button class="btn accent" data-act="fr-done"${pins.length?'':' disabled'}>Open today’s page</button>
    <p class="footnote">Based on your age, cycle and concerns. Not a diagnosis. Nothing leaves this phone.</p>
    <details class="plain"><summary>Privacy, evidence and medical limits</summary><p>Your entries stay on this device. There is no account. peri is education and a record, not diagnosis or treatment, and does not replace a clinician who knows your history. Content reviewed ${CONTENT_REVIEWED}.</p></details>
  </div>`;
}
function finishFirstRun(){
  const p=DB.profile;
  if(!(p.pinnedSymptoms||[]).length) return;
  const finding=firstRunFinding();
  if(finding&&finding.answers&&completeStageAnswers(finding.answers)){ p.stageAnswers=finding.answers; p.stage=finding.label; }
  p.onboarded=true; p.onboardingVersion=4; p.onboardingStep=0; p.onboardingDeferred=false; p.firstCheckinPending=false;
  p.intent=firstRun.appointment==='yes'?'appointment':'understand';
  if(firstRun.appointment==='yes'&&validISODate(firstRun.date)) appointmentData().brief.date=firstRun.date;
  save(true);
  nightDeskDismissed=true;
  setRoute('today',true); render();
  postNativeEvent('onboarding-finished',{skipped:false});
}

/* ============================================================
   THE CLINICIAN REPORT (one-page brief)
   ============================================================ */
function reportSection(title,inner){ return `<section class="rsec"><div class="label" style="margin-bottom:6px">${esc(title)}</div>${inner}</section>`; }
function kvRow(k,v){ return `<div class="kv"><span>${k}</span><span class="r">${v}</span></div>`; }
function reportBody(days){
  days=[30,90,180].includes(+days)?+days:90;
  const summaryDays=Math.min(30,days), activityDays=Math.min(28,days);
  const d=rangeDates(days).filter(hasData), p=DB.profile, age=p.birthYear?new Date().getFullYear()-p.birthYear:null;
  const hf=series(rangeDates(summaryDays),e=>e.hf), bd=series(rangeDates(summaryDays),burden);
  const wt=series(rangeDates(days),e=>e.wt).filter(x=>x.v!=null), wa=series(rangeDates(days),e=>e.waist).filter(x=>x.v!=null);
  const topSym=SYMS.map(s=>({n:symptomName(s.k),v:avg(rangeDates(summaryDays).map(dd=>{const e=confirmedRecord(dd);return e&&e.sym?e.sym[s.k]:null;}))})).filter(x=>x.v!=null).sort((a,b)=>b.v-a.v).slice(0,6);
  const questionnaires=DB.scores.slice(-6).reverse(), medications=Array.isArray(DB.medications)?DB.medications:[], labs=Array.isArray(DB.labs)?DB.labs.slice(0,8):[];
  const bleeds=entryDates().filter(x=>{const e=confirmedRecord(x);return e&&e.bleed&&e.bleed!=='none';});
  const hfValues=hf.map(x=>x.v).filter(v=>v!=null);
  const nsValues=rangeDates(summaryDays).map(x=>{const e=confirmedRecord(x);return e&&e.ns;}).filter(v=>v!=null);
  const wakes=rangeDates(summaryDays).map(x=>{const e=confirmedRecord(x);return e&&e.wakes;}).filter(v=>v!=null);
  const ratings=rangeDates(summaryDays).map(x=>{const e=confirmedRecord(x);return e&&e.rating;}).filter(v=>v!=null);
  const moderateNights=nsValues.filter(v=>v>=2).length;
  const strengthValues=rangeDates(activityDays).map(x=>{const e=confirmedRecord(x);return e&&e.act?e.act.res:null;}).filter(v=>typeof v==='boolean');
  const strengthCount=strengthValues.filter(Boolean).length;
  const alcoholValues=rangeDates(activityDays).map(x=>{const e=confirmedRecord(x);return e&&e.nut?e.nut.alc:null;}).filter(v=>v!=null);
  const sleepAvg=avg(series(rangeDates(summaryDays),e=>e.sleepH).map(x=>x.v));
  const strengthSummary=!strengthValues.length?'not tracked':strengthValues.length===activityDays?r1(strengthCount/(activityDays/7))+' / week':strengthCount+' '+plural(strengthCount,'session')+' across '+strengthValues.length+' logged '+plural(strengthValues.length,'day');
  const alcoholSummary=!alcoholValues.length?'not tracked':alcoholValues.length===activityDays?r1(sum(alcoholValues)/(activityDays/7))+' drinks / week':sum(alcoholValues)+' drinks across '+alcoholValues.length+' logged '+plural(alcoholValues.length,'day');
  const brief=savedBrief(), list=dossierFindings().slice(0,6), stage=stageSummary();
  const notes=entryDates().filter(x=>{const e=confirmedRecord(x);return e&&e.notes;}).slice(-6).reverse();
  return `<div class="report-page">
  <div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px;padding-bottom:10px;border-bottom:2px solid var(--border-strong)"><span class="wordmark" style="font-size:22px">peri</span><span class="label">Brief for the appointment · ${days} days</span></div>
  <p class="small muted" style="margin:10px 0 0">${p.name?esc(p.name)+' · ':''}${age?age+' · ':''}prepared ${esc(fmtLong(todayISO()))} · ${d.length} ${plural(d.length,'day')} recorded in the last ${days}.</p>
  ${brief.concerns.length?reportSection('Opening statement',`<p class="quote" style="font-size:19px">“${esc(briefOpening(brief))}”</p>`):''}
  ${reportSection('Where she is',`<p class="sec-lead" style="font-size:19px">${esc(stage.head)}</p><p class="small muted">${esc(stage.body)}</p>`)}
  ${reportSection('Summary · last '+summaryDays+' days',
    kvRow('Hot flashes a day',hfValues.length?r1(avg(hfValues))+' <span class="muted">· worst day '+Math.max(...hfValues)+'</span>':'not tracked')
    +kvRow('Night sweats, moderate or worse',nsValues.length?moderateNights+' '+plural(moderateNights,'night'):'not tracked')
    +kvRow('Night wakes',wakes.length?r1(avg(wakes))+' a night':'not tracked')
    +kvRow('Sleep',sleepAvg!=null?r1(sleepAvg)+' h':'not tracked')
    +kvRow('Day rating (0 rough to 4 great)',ratings.length?r1(avg(ratings))+' over '+ratings.length+' '+plural(ratings.length,'day'):'not tracked')
    +kvRow('Symptom burden (0–44, unvalidated)',avg(bd.map(x=>x.v))!=null?r1(avg(bd.map(x=>x.v))):'not tracked')
    +(periodsPossible()&&pastOrTodayISO(p.lastPeriod)?kvRow('Last period',fmtDay(p.lastPeriod)+' ('+Math.floor(daysBetween(p.lastPeriod,todayISO())/30)+' months)'):'')
    +(!periodsPossible()&&pastOrTodayISO(p.surgeryDate)?kvRow(surgicalMenopause()?'Surgical menopause':'Surgery',fmtDay(p.surgeryDate)):'')
    +(wt.length?kvRow('Weight',r1(U.wOut(wt[wt.length-1].v))+' '+U.wLabel()+(wt.length>1?' ('+(wt[wt.length-1].v>wt[0].v?'+':'')+r1(U.wOut(wt[wt.length-1].v-wt[0].v))+' over '+daysBetween(wt[0].d,wt[wt.length-1].d)+' d)':'')):'')
    +(wa.length?kvRow('Waist',r1(U.lOut(wa[wa.length-1].v))+' '+U.lLabel()+(wa.length>1?' ('+(wa[wa.length-1].v>wa[0].v?'+':'')+r1(U.lOut(wa[wa.length-1].v-wa[0].v))+')':'')):'')
    +kvRow('Strength sessions (28 d)',strengthSummary)+kvRow('Alcohol (28 d)',alcoholSummary))}
  ${list.length?reportSection('Findings',list.map((f,i)=>`<div class="fnd" style="padding:10px 0"><span class="n">${i+1}</span><div class="body"><div class="head" style="font-size:17px">${f.head}</div>${f.num?`<div class="figure" style="margin-top:4px"><span class="big" style="font-size:26px">${f.num}</span>${f.sub?`<span class="sub">${esc(f.sub)}</span>`:''}</div>`:''}<p class="note">${f.kind==='pattern'||f.kind==='treatment'?'Filed '+esc(shortDate(f.filed))+'. ':''}${f.body}</p></div></div>`).join('')):''}
  ${topSym.length?reportSection('Prominent symptoms · '+summaryDays+'-day average, 0–4',topSym.map(s=>kvRow(esc(s.n),r1(s.v))).join('')):''}
  ${medications.length?reportSection('Treatments',medications.map(m=>kvRow('<b>'+esc(m.name)+'</b>',esc(medicationDetail(m))+(m.started?' · from '+esc(fmtDay(m.started)):'')+(m.ended?' · stopped '+esc(fmtDay(m.ended)):'')+(medicationStatus(m)==='archived'?' · archived':'')+(m.stopReason?' · '+esc(m.stopReason):''))+((m.changes||[]).filter(c=>c.label&&c.label!=='Treatment started').length?'<ul class="plain tiny">'+(m.changes||[]).filter(c=>c.label&&c.label!=='Treatment started').map(c=>'<li>'+esc(fmtDay(c.date))+' · '+esc(c.label)+(c.targets&&c.targets.length?' · watching '+esc(c.targets.map(symptomName).join(', ')):'')+'</li>').join('')+'</ul>':'')+medicationHistoryMarkup(m)).join('')):''}
  ${treatmentFollowUpReport(days)}
  ${brief.concerns.length?reportSection('Questions',briefSummaryMarkup(brief).replace(/<div class="label"[^>]*>Opening statement<\/div><p class="quote">[^<]*<\/p>/,'')):appointmentData().questions.filter(q=>!q.asked).length?reportSection('Questions',appointmentData().questions.filter(q=>!q.asked).map((q,i)=>`<div class="qn"><span class="n">${i+1}</span><div class="q">${esc(q.text)}</div></div>`).join('')):''}
  ${appointmentData().evidence.length?reportSection('Pinned from the index',appointmentData().evidence.map(item=>kvRow(esc(item.text),esc(shortDate(item.date)))).join('')):''}
  ${healthKitReportSection()}
  ${labs.length?reportSection('Lab results',labs.map(x=>kvRow(esc(x.name)+' · '+esc(fmtDay(x.date)),esc(x.value+(x.unit?' '+x.unit:'')))).join('')):''}
  ${questionnaires.length?reportSection('Questionnaire scores',questionnaires.map(s=>kvRow(s.type.toUpperCase()+' · '+fmtDay(s.date),s.score+(s.band?' · '+esc(s.band):''))).join('')+'<p class="xtiny">Broken sleep, fatigue, poor concentration and low libido also score on depression scales, which can inflate totals.</p>'):''}
  ${bleeds.length?reportSection('Bleeding logged',bleeds.slice(-8).reverse().map(x=>kvRow(fmtDay(x),esc(confirmedRecord(x).bleed))).join('')):''}
  ${(appointmentData().plans||[]).length?reportSection('After previous visits',appointmentData().plans.slice(0,3).map(plan=>`<div class="kv stack"><b>${esc(fmtDay(plan.date))}${plan.nextVisit?' · next '+esc(fmtDay(plan.nextVisit)):''}</b>${plan.summary?`<span class="r">${esc(plan.summary)}</span>`:''}${plan.actions&&plan.actions.length?`<span class="r">${plan.actions.map(a=>(a.done?'✓ ':'○ ')+esc(a.text)).join(' · ')}</span>`:''}</div>`).join('')):''}
  ${notes.length?reportSection('Recent notes',notes.map(dd=>`<p class="small"><b>${fmtDay(dd)}:</b> ${esc(confirmedRecord(dd).notes)}</p>`).join('')):''}
  <p class="xtiny" style="padding-top:12px">Self-reported data from a consumer app. Not a clinical record. The burden score is an unvalidated 0–44 sum of 11 self-rated symptoms on the 0–4 structure used by the Menopause Rating Scale; it shows change over time only.</p>
  </div>`;
}
function healthKitReportSection(){
  const summary=DB.healthKit;
  if(!summary) return '';
  const shown=(value,suffix)=>value==null?'unavailable':r1(value)+suffix;
  return reportSection('Apple Health summary · user-synced',kvRow('Steps ('+summary.lookbackDays+' d)',shown(summary.steps.dailyAverage,' / day'))+kvRow('Sleep ('+summary.lookbackDays+' d)',shown(summary.sleep.nightlyAverageHours,' h / tracked night')+(summary.sleep.trackedNights?' · '+summary.sleep.trackedNights+' nights':''))+kvRow('Latest body weight',summary.bodyWeight.latestKilograms==null?'unavailable':r1(U.wOut(summary.bodyWeight.latestKilograms))+' '+U.wLabel())+'<p class="xtiny">Read-only aggregate synced '+esc(new Date(summary.generatedAt).toLocaleString())+'. Missing values are never treated as zero.</p>');
}
function viewReport(){
  const count=entryDates().length;
  return `<div class="view page-report">${topbar('Dossier','go-dossier','One-page brief')}
    <div style="padding:20px 0 12px"><h1 style="font-size:clamp(30px,9vw,36px);line-height:1;margin:0">The brief.</h1><p class="small muted" style="margin-top:8px">${count<7?'Early: facts only until more days are recorded.':'Print it, save it as a PDF, or read from it in the room.'} Based on ${count} recorded ${plural(count,'day')}.</p></div>
    <div class="range no-print" role="group" aria-label="Range">${[30,90,180].map(n=>`<button data-act="report-range" data-v="${n}" aria-pressed="${reportRange===n?'true':'false'}">${n} days</button>`).join('')}</div>
    ${reportBody(reportRange)}
    <div class="actions no-print" style="margin-top:16px"><button class="btn accent wide" data-act="print">Print or save as PDF</button><button class="btn outline" data-act="sheet" data-s="data">Export data</button></div>
  </div>`;
}

/* ============================================================
   SHEETS
   ============================================================ */
function setBackgroundInert(on){
  const el=$('#app'); if(!el) return;
  if(on){ el.setAttribute('inert',''); el.setAttribute('aria-hidden','true'); }
  else { el.removeAttribute('inert'); el.removeAttribute('aria-hidden'); }
}
function focusDescriptor(el){ return el ? {node:el,tag:el.tagName.toLowerCase(),data:Object.assign({},el.dataset)} : null; }
function findFocusTarget(desc,root){
  if(!desc) return null;
  if(desc.node&&desc.node.isConnected) return desc.node;
  return [...(root||document).querySelectorAll(desc.tag)].find(el=>Object.entries(desc.data).every(([key,value])=>el.dataset[key]===value))||null;
}
function sheetDate(id){ const m=/^(?:day|close|details|moment):(\d{4}-\d\d-\d\d)/.exec(id||''); return m&&validISODate(m[1])&&m[1]<=todayISO()?m[1]:todayISO(); }
function openSheet(id){
  if(id==='report'){ if(requestNativePro('appointment-report')) return; returnTab=curTab; setRoute('appointment-report'); sheetStack=[]; renderSheet(); render(); return; }
  if(id==='treatments'&&requestNativePro('dossier')) return;
  if(id==='learn:stage' && !DB.profile.stage && !stageEditing) resetStageDraft();
  if(id==='log'||id==='log:night'){ lastLogged=null; logMore=false; dictationOpen=false; logNight=id==='log:night'||isNightHour(); }
  if(id.startsWith('close')){ const e=DB.entries[sheetDate(id)]||{}; closeDraft={rating:e.rating==null?null:e.rating,alcohol:e.nut&&e.nut.alc!=null?e.nut.alc>0:false,strength:!!(e.act&&e.act.res),period:!!(e.bleed&&e.bleed!=='none'),stress:!!(e.sym&&e.sym.overwhelmed>=2)}; }
  if(!sheetStack.length) lastSheetTrigger=focusDescriptor(document.activeElement);
  else {
    const parentSheet=$('.sheet');
    sheetReturnStack.push({trigger:focusDescriptor(document.activeElement),scrollTop:parentSheet?parentSheet.scrollTop:0,parentTitle:($('#sheet-title')&&$('#sheet-title').textContent)||'previous'});
  }
  sheetStack.push(id); renderSheet(true);
}
function closeSheet(){
  const returnState=sheetStack.length>1?sheetReturnStack.pop():null;
  const closing=sheetStack.pop();
  if(closing==='learn:stage'){ stageAns={}; stageStep=0; stageEditing=false; render(true); }
  if(closing==='log'||closing==='log:night'||(closing||'').startsWith('close')||(closing||'').startsWith('moment')) render(true);
  runSheetHooks(sheetStack[sheetStack.length-1]||'');
  renderSheet(true,returnState);
}
function renderSheet(moveFocus,returnState){
  const host=$('#sheet-host');
  if(!sheetStack.length){
    runSheetHooks(''); sheetReturnStack=[];
    host.innerHTML=''; document.body.style.overflow=''; setBackgroundInert(false);
    const target=lastSheetTrigger; lastSheetTrigger=null;
    if(moveFocus) setTimeout(()=>{
      const candidate=findFocusTarget(target,document);
      const restored=(candidate&&candidate!==document.body?candidate:null)||document.querySelector('#app button,#app input,#app select');
      if(restored) restored.focus();
    },0);
    syncNativeNavigationState();
    return;
  }
  const previous=host.contains(document.activeElement)?focusDescriptor(document.activeElement):null;
  const id=sheetStack[sheetStack.length-1];
  const content=sheetContent(id), title=content.title, body=content.body;
  const parentState=sheetReturnStack[sheetReturnStack.length-1], nested=sheetStack.length>1;
  const dismissLabel=nested?'Back to '+(parentState&&parentState.parentTitle||'previous'):'Close '+title;
  setBackgroundInert(true);
  host.innerHTML=`<div class="sheet-bg" data-act="bg"><div class="sheet${content.night?' night':''}${content.full?' full':''}" role="dialog" aria-modal="true" aria-labelledby="sheet-title" tabindex="-1">
      <div class="sheet-bar${content.night?' night-bar':''}"><h2 id="sheet-title">${esc(title)}</h2><button class="done" data-act="close" aria-label="${esc(dismissLabel)}">${nested?'Back':'Done'}</button></div>
      ${body}
    </div></div>`;
  document.body.style.overflow='hidden';
  syncNativeNavigationState();
  const s=host.querySelector('.sheet'); if(s) s.scrollTop=returnState?returnState.scrollTop:0;
  runSheetHooks(id);
  if(s) setTimeout(()=>{
    let target=null;
    if(returnState) target=findFocusTarget(returnState.trigger,s);
    else if(id==='learn:stage') target=s.querySelector('.stage-focus-target');
    else if(!moveFocus&&previous){ target=findFocusTarget(previous,s); if(!target) target=s.querySelector('[data-act]:not(.done)'); }
    if(moveFocus&&!target) target=s.querySelector('.sheet-focus,button:not([disabled]):not(.done),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled])')||s.querySelector('.done');
    (target||s).focus();
  },0);
}
function keepFocusInSheet(ev){
  if(!sheetStack.length) return;
  if(ev.key==='Escape'){ ev.preventDefault(); closeSheet(); return; }
  if(ev.key!=='Tab') return;
  const sheet=$('.sheet'); if(!sheet) return;
  const focusable=[...sheet.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(el=>el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden');
  if(!focusable.length){ ev.preventDefault(); sheet.focus(); return; }
  const first=focusable[0], last=focusable[focusable.length-1];
  if(document.activeElement===sheet){ ev.preventDefault(); (ev.shiftKey?last:first).focus(); }
  else if(ev.shiftKey&&document.activeElement===first){ ev.preventDefault(); last.focus(); }
  else if(!ev.shiftKey&&document.activeElement===last){ ev.preventDefault(); first.focus(); }
  else if(!sheet.contains(document.activeElement)){ ev.preventDefault(); first.focus(); }
}
function toolInfo(id){ return TOOL_CATALOG.find(tool=>tool.id===id); }
function sheetContent(id){
  if(id==='log'||id==='log:night') return logSheet();
  if(id.startsWith('close')) return closeSheet_(sheetDate(id));
  if(id==='pages') return pagesSheet();
  if(id.startsWith('day:')) return daySheet(sheetDate(id));
  if(id.startsWith('details')) return detailsSheet(sheetDate(id));
  if(id.startsWith('moment:')) return momentSheet(id);
  if(id==='treatments') return treatmentsSheet();
  if(id==='appointment-date') return appointmentDateSheet();
  if(id==='rehearse') return rehearseSheet();
  if(id==='support'||id.startsWith('support:')) return supportSheet(id.split(':')[1]);
  if(id==='appointment-brief') return briefSheet();
  if(id.startsWith('learn:')) return learnSheet(id.slice(6));
  if(id.startsWith('tool:')) return toolSheet(id.slice(5));
  if(id==='redflags') return learnSheet('redflags');
  if(id==='screening') return learnSheet('screening');
  if(id==='tools') return {title:'Tools',body:TOOL_CATALOG.map(t=>`<button class="entry" data-act="sheet" data-s="tool:${t.id}"><div class="path">${esc(t.group)}</div><div class="head">${esc(t.name)}</div><p>${esc(t.description)}</p></button>`).join('')};
  if(id==='data') return dataSheet();
  if(id==='reset-onboarding-confirm') return resetOnboardingSheet();
  if(id==='delete-local-data-confirm') return deleteLocalDataSheet();
  return {title:'',body:''};
}

/* ---------- the log sheet ---------- */
function logKinds(){
  const pinned=focusedKeys().filter(k=>!LOG_ALWAYS.includes(k)&&MOMENT_KINDS[k]&&MOMENT_KINDS[k].sym!==false);
  return [...LOG_ALWAYS,...pinned];
}
function logSheet(){
  const t=todayISO(), now=nowHM(), ms=dayMoments(t), kinds=logKinds();
  const more=Object.keys(MOMENT_KINDS).filter(k=>!kinds.includes(k)&&!['slept','med','breath'].includes(k));
  const last=lastLogged?ms.find(m=>m.id===lastLogged):null;
  const row=k=>{
    const mine=ms.filter(m=>m.k===k), pressed=last&&last.k===k, latest=mine[mine.length-1];
    const sub=pressed?'logged'+(last.s?' · '+MOMENT_SEVERITY[last.s].toLowerCase():' · '+last.t):latest?(mine.length>1?mine.length+'× · ':'')+'last '+latest.t:'';
    return `<button class="bigrow" data-act="log" data-k="${k}" aria-pressed="${pressed?'true':'false'}" aria-label="Log ${esc(MOMENT_KINDS[k].n)} now"><span>${esc(MOMENT_KINDS[k].n)}</span><span class="s">${esc(sub)}</span></button>`;
  };
  const sevApplies=last&&last.k!=='note'&&last.k!=='woke'&&last.k!=='slept';
  const speech=typeof window!=='undefined'&&(window.SpeechRecognition||window.webkitSpeechRecognition);
  return {title:'Log · '+now,night:true,full:true,body:`
    <div class="biglist">${kinds.map(row).join('')}${logMore?more.map(row).join(''):`<button class="bigrow sm" data-act="log-more" aria-expanded="false" style="color:var(--text-2)"><span>More…</span><span class="s">${more.length} words</span></button>`}</div>
    <div class="sheet-foot" style="border-top:0">
      ${sevApplies?`<div class="seg" role="group" aria-label="How strong">${[1,2,3].map(s=>`<button data-act="log-severity" data-v="${s}" aria-pressed="${last.s===s?'true':'false'}">${MOMENT_SEVERITY[s]}</button>`).join('')}</div>`:'<div class="seg" aria-hidden="true" style="visibility:hidden"><button tabindex="-1">Mild</button></div>'}
      ${dictationOpen?`<form class="dictate" data-act="dictate-form" style="display:flex;gap:8px"><label class="sr-only" for="dictate-text">Say what happened</label><input id="dictate-text" type="text" maxlength="280" placeholder="hot flash, strong, 20 minutes ago" autocomplete="off" class="sheet-focus" style="flex:1 1 auto;border-color:var(--border-strong)"><button type="submit" class="btn outline auto" style="min-height:48px">Add</button></form>`
        :`<div style="display:flex;gap:8px"><button class="btn ink" style="flex:1 1 auto" data-act="sheet" data-s="tool:ride">Ride it out · 60 s</button><button class="btn outline auto" data-act="dictate" aria-label="${speech?'Say it instead':'Type it instead'}" style="width:54px;padding:0">${speech?IC.mic:IC.keyboard}</button></div>`}
      <p class="footnote">${last?'Filed '+esc(momentName(last))+' at '+esc(last.t)+'. Tap again for another; edit any row from the page.':'One tap files it with the time. Nothing else to fill in.'}</p>
    </div>`};
}
/* Free text against the vocabulary. Unmatched words become a dated note. */
function parseUtterance(text){
  const raw=String(text||'').trim(); if(!raw) return [];
  const lower=raw.toLowerCase(), out=[];
  let s=null; SEVERITY_WORDS.forEach(([w,v])=>{ if(lower.includes(w)&&s==null) s=v; });
  let t=nowHM();
  const ago=/(\d{1,3})\s*(min|minutes?|hours?|hrs?|h)\b\s*ago/.exec(lower);
  if(ago){ const n=+ago[1]*(ago[2].startsWith('h')?60:1); const d=new Date(Date.now()-n*60000); if(iso(d)===todayISO()) t=nowHM(d); }
  const at=/\b(?:at|around)\s*(\d{1,2})(?::(\d\d))?\s*(am|pm)?/.exec(lower);
  if(at){ let hh=+at[1]; const mm=at[2]?+at[2]:0; if(at[3]==='pm'&&hh<12) hh+=12; if(at[3]==='am'&&hh===12) hh=0; if(hh<24) t=String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0'); }
  Object.entries(LOG_SYNONYMS).forEach(([k,words])=>{ if(words.some(w=>lower.includes(w))&&!out.some(m=>m.k===k)) out.push({k,t,s:s==null?undefined:s}); });
  if(out.some(m=>m.k==='ns')&&out.some(m=>m.k==='hf')&&!/flash|flush/.test(lower)) out.splice(out.findIndex(m=>m.k==='hf'),1);
  if(out.some(m=>m.k==='joint')&&/head/.test(lower)&&!/joint|knee|hip|back|shoulder|ache/.test(lower)) out.splice(out.findIndex(m=>m.k==='joint'),1);
  if(!out.length) out.push({k:'note',t,n:raw.slice(0,280)});
  return out;
}

/* ---------- close the day ---------- */
function closeSheet_(date){
  const d=closeDraft||{}, e=DB.entries[date]||{};
  const check=(key,label,hint)=>`<button class="check" data-act="close-toggle" data-k="${key}" aria-pressed="${d[key]?'true':'false'}"><span class="box">${IC.check}</span><span>${label}</span>${hint?`<span class="s">${esc(hint)}</span>`:''}</button>`;
  const summary=ledgerSummary(date);
  return {title:(date===todayISO()?'Today':dayLabel(date))+' · '+nowHM(),body:`
    <p class="lead">${date===todayISO()?'Close the day.':'Close '+esc(dayLabel(date))+'.'}</p><p class="small muted">One question. The ledger did the rest.</p>
    <div class="label" style="margin:18px 0 10px">Overall</div>
    <div class="words" role="group" aria-label="How was the day">${DAY_RATINGS.map((w,i)=>`<button data-act="close-rate" data-v="${i}" aria-pressed="${d.rating===i?'true':'false'}">${w}</button>`).join('')}</div>
    <div class="label" style="margin:22px 0 2px">Anything to add</div>
    ${check('alcohol','Alcohol',e.nut&&e.nut.alc>1?e.nut.alc+' drinks':'')}${check('strength','Strength session')}${check('period','Period',e.bleed&&e.bleed!=='none'?e.bleed:'')}${check('stress','Stressful day')}
    <div class="label" style="margin:18px 0 8px">From the ledger</div>
    <p class="summary-line">${summary?esc(summary):'<span class="muted">Nothing logged. Closing still counts the day.</span>'}</p>
    <button class="textbtn" data-act="sheet" data-s="details:${date}">Sleep, body, food and notes</button>
    <div class="sheet-foot"><button class="btn ink" data-act="close-save" data-d="${date}">Close the day</button><p class="footnote">Counts in the dossier now. Edit any time.</p></div>`};
}

/* ---------- earlier pages ---------- */
function pagesSheet(){
  const days=rangeDates(21).reverse();
  return {title:'Earlier pages',body:`<p class="lead">The last three weeks.</p>${days.map(d=>{const e=confirmedEntry(d), sum=ledgerSummary(d);
    return `<button class="kv" data-act="sheet" data-s="day:${d}" style="width:100%;background:none;border-left:0;border-right:0;border-bottom:0;text-align:left;color:var(--text)"><span><b>${esc(fmtDay(d))}</b>${sum?' <span class="muted">· '+esc(sum)+'</span>':e?'':' <span class="muted">· no page</span>'}</span><span class="r">${e&&e.rating!=null?esc(DAY_RATINGS[e.rating]):e?'open':''}</span></button>`;}).join('')}`};
}
function daySheet(date){
  const e=confirmedEntry(date), closed=e&&e.rating!=null;
  return {title:fmtDay(date),body:`<p class="lead">${esc(fmtLong(date))}</p>${closed?`<p class="small muted">Closed · ${esc(DAY_RATINGS[e.rating])}.</p>`:''}
    <div class="label" style="margin:14px 0 4px">The ledger</div>${ledgerMarkup(date)}
    <div class="label" style="margin:18px 0 8px">Add to this day</div>
    <div style="display:flex;gap:8px;align-items:stretch"><label class="sr-only" for="past-kind">What happened</label><select id="past-kind" style="flex:1 1 auto">${Object.keys(MOMENT_KINDS).filter(k=>!['med','breath','slept'].includes(k)).map(k=>`<option value="${k}">${esc(MOMENT_KINDS[k].n)}</option>`).join('')}</select><label class="sr-only" for="past-time">At what time</label><input id="past-time" type="time" value="12:00" style="width:auto"><button class="btn outline auto" data-act="day-add" data-d="${date}" style="min-height:48px">Add</button></div>
    <div class="sheet-foot"><div class="btn-row split"><button class="btn ${closed?'outline':'ink'} sm" data-act="sheet" data-s="close:${date}">${closed?'Edit the close':'Close this day'}</button><button class="btn outline sm" data-act="sheet" data-s="details:${date}">Details</button></div></div>`};
}
function momentSheet(id){
  const parts=id.split(':'), date=sheetDate(id), mid=parts.slice(2).join(':'), m=dayMoments(date).find(x=>x.id===mid);
  if(!m) return {title:'Moment',body:'<p class="small muted">This entry is gone.</p>'};
  const sevApplies=!['note','woke','slept','med','breath'].includes(m.k);
  return {title:momentName(m)+' · '+esc(fmtDay(date)),body:`<p class="lead">${esc(momentName(m))}</p>
    <div class="field"><label class="fl" for="moment-time">Time</label><input id="moment-time" type="time" data-act="moment-time" data-d="${date}" data-id="${esc(m.id)}" value="${esc(m.t)}" style="width:auto"></div>
    ${sevApplies?`<div class="field"><span class="fl">How strong</span><div class="seg ink" role="group" aria-label="How strong">${[1,2,3].map(s=>`<button data-act="moment-severity" data-d="${date}" data-id="${esc(m.id)}" data-v="${s}" aria-pressed="${m.s===s?'true':'false'}">${MOMENT_SEVERITY[s]}</button>`).join('')}</div></div>`:''}
    ${m.k==='slept'?`<div class="field"><label class="fl" for="moment-hours">Hours asleep</label><input id="moment-hours" type="number" step="0.25" min="0" max="16" inputmode="decimal" data-act="moment-hours" data-d="${date}" data-id="${esc(m.id)}" value="${m.v!=null?m.v:''}"></div>`:''}
    <div class="field"><label class="fl" for="moment-note">${m.k==='note'?'Note':'Note (optional)'}</label><textarea id="moment-note" maxlength="280" data-act="moment-note" data-d="${date}" data-id="${esc(m.id)}" placeholder="What was happening">${esc(m.n||'')}</textarea></div>
    <div class="sheet-foot"><button class="btn outline" data-act="moment-delete" data-d="${date}" data-id="${esc(m.id)}" style="color:var(--accent-text);border-color:var(--accent-text)">Delete this entry</button></div>`};
}

/* ---------- the day's details ---------- */
function detailsSheet(date){
  const e=DB.entries[date]||{sym:{},act:{},nut:{}}, sym=e.sym||{}, act=e.act||{}, nut=e.nut||{}, ms=dayMoments(date);
  const hasHF=ms.some(m=>m.k==='hf'), hasNS=ms.some(m=>m.k==='ns'), pt=proteinTarget(), b=burden(e);
  return {title:'Details · '+fmtDay(date),body:`
    <p class="lead">The rest of the page.</p><p class="small muted">Anything here counts the moment you type it. The ledger stays the record of events.</p>
    <div class="label" style="margin:18px 0 10px">Counts</div>
    <div class="grid2">
      <div class="field"><span class="fl">Hot flashes</span>${hasHF?`<p class="small">${e.hf} from the ledger.</p>`:`<div class="stepper"><button data-act="hf" data-n="-1" data-d="${date}" aria-label="One fewer">−</button><span class="val">${e.hf==null?'–':e.hf}</span><button data-act="hf" data-n="1" data-d="${date}" aria-label="One more">+</button></div>`}</div>
      <div class="field"><span class="fl">Night sweats (0–4)</span>${hasNS?`<p class="small">${e.ns} from the ledger.</p>`:scaleRow('ns',SCALE4,e.ns,0,'Night sweats')}</div>
    </div>
    <div class="label" style="margin:18px 0 10px">Symptoms · 0 none to 4 very severe</div>
    ${SYMS.filter(s=>s.k!=='sleepq').map(s=>`<div class="field" style="margin-bottom:12px"><span class="fl">${esc(SYM_DISPLAY[s.k]||s.n)}</span>${scaleRow('sym.'+s.k,SCALE4,sym[s.k],0,s.n)}</div>`).join('')}
    ${b!=null?`<p class="xtiny">Burden today: ${b} of 44. Direction over weeks, not a label.</p>`:''}
    <div class="label" style="margin:18px 0 10px">Sleep</div>
    <div class="grid2"><div class="field"><label class="fl" for="inbed">Hours in bed</label><input id="inbed" type="number" step="0.25" min="0" max="16" inputmode="decimal" data-act="num" data-d="${date}" data-k="inBedH" value="${e.inBedH??''}"></div><div class="field"><label class="fl" for="slept">Hours asleep</label><input id="slept" type="number" step="0.25" min="0" max="16" inputmode="decimal" data-act="num" data-d="${date}" data-k="sleepH" value="${e.sleepH??''}"></div></div>
    <div class="field"><span class="fl">Sleep quality · 0 fine to 4 awful</span>${scaleRow('sym.sleepq',['Fine','Off','Poor','Bad','Awful'],sym.sleepq,0,'Sleep quality')}</div>
    ${e.inBedH!=null&&e.inBedH>0&&e.sleepH!=null?`<p class="xtiny">Sleep efficiency ${Math.round(e.sleepH/e.inBedH*100)}%. CBT-I extends the window once this passes about 85 to 90%.</p>`:''}
    <div class="label" style="margin:18px 0 10px">Body</div>
    <div class="grid2"><div class="field"><label class="fl" for="wt">Weight (${U.wLabel()})</label><input id="wt" type="number" step="0.1" min="${U.imp?44:20}" max="${U.imp?1100:500}" inputmode="decimal" data-act="num" data-d="${date}" data-k="wt" data-conv="w" value="${e.wt!=null?r1(U.wOut(e.wt)):''}"></div><div class="field"><label class="fl" for="wa">Waist (${U.lLabel()})</label><input id="wa" type="number" step="0.1" min="${U.imp?12:30}" max="${U.imp?118:300}" inputmode="decimal" data-act="num" data-d="${date}" data-k="waist" data-conv="l" value="${e.waist!=null?r1(U.lOut(e.waist)):''}"></div></div>
    <div class="field"><span class="fl">${periodsPossible()?'Bleeding':'Any bleeding or spotting'}</span><div class="chips">${['none','spotting','light','moderate','heavy'].map(v=>h('button',{class:'chip sm','data-act':'set','data-d':date,'data-k':'bleed','data-v':v,'aria-pressed':e.bleed===v?'true':'false'},v[0].toUpperCase()+v.slice(1))).join('')}</div>${!periodsPossible()?`<p class="hint">${!hasUterus()?'After a hysterectomy any bleeding is unexpected. Usually minor, always worth reporting.':'Anything new is worth logging and reporting rather than explaining away.'}</p>`:''}</div>
    <div class="label" style="margin:18px 0 10px">Movement</div>
    <div class="chips" style="margin-bottom:12px">${chip('act.res','Strength session',act.res).replace('data-act','data-d="'+date+'" data-act')}${chip('act.bal','Balance work',act.bal).replace('data-act','data-d="'+date+'" data-act')}${chip('act.pf','Pelvic floor',act.pf).replace('data-act','data-d="'+date+'" data-act')}</div>
    <div class="field"><label class="fl" for="aero">Aerobic minutes</label><input id="aero" type="number" step="5" min="0" max="1440" inputmode="numeric" data-act="num" data-d="${date}" data-k="act.aero" value="${act.aero??''}"></div>
    <div class="label" style="margin:18px 0 10px">Food and drink</div>
    <div class="chips" style="margin-bottom:12px">
      ${h('button',{class:'chip sm','data-act':'set','data-d':date,'data-k':'nut.prot','data-v':1,'aria-pressed':nut.prot===true||nut.prot===1?'true':'false'},esc('Protein target met'+(pt?' ('+pt.grams+' g)':'')))}
      ${h('button',{class:'chip sm','data-act':'set','data-d':date,'data-k':'nut.prot','data-v':0,'aria-pressed':nut.prot===false||nut.prot===0?'true':'false'},'Missed')}
      ${chip('nut.cal','2+ calcium servings',nut.cal).replace('data-act','data-d="'+date+'" data-act')}${chip('nut.fib','Good fibre day',nut.fib).replace('data-act','data-d="'+date+'" data-act')}
    </div>
    <div class="grid2"><div class="field"><label class="fl" for="alc">Alcohol (drinks)</label><input id="alc" type="number" step="1" min="0" max="50" inputmode="numeric" data-act="num" data-d="${date}" data-k="nut.alc" value="${nut.alc??''}"></div><div class="field"><label class="fl" for="caf">Caffeine (cups)</label><input id="caf" type="number" step="1" min="0" max="50" inputmode="numeric" data-act="num" data-d="${date}" data-k="nut.caf" value="${nut.caf??''}"></div></div>
    <div class="field"><label class="fl" for="notes">Notes</label><textarea id="notes" maxlength="4000" data-act="num" data-d="${date}" data-k="notes" placeholder="What helped, what set it off, a question for the appointment.">${esc(e.notes||'')}</textarea></div>
    ${medsTakenMarkup(date)}
    ${DB.trigger&&DB.trigger.active?triggerBanner():''}`};
}

/* ---------- treatments ---------- */
function medicationForm(m){
  return `<div class="form" aria-label="${m?'Edit':'Add'} medication"><h3>${m?'Edit '+esc(m.name):'Add a medication'}</h3><p class="small muted">${m?'Changes apply from today; earlier details stay in the history. Use Record a change for dose or schedule changes you want compared.':'What you actually take, with the start date if you know it.'}</p>
    <div class="field"><label class="fl" for="med-name">Medication and dose</label><input id="med-name" type="text" maxlength="80" placeholder="Estradiol patch 0.05 mg" value="${esc(m&&m.name||'')}"></div>
    <div class="grid2"><div class="field"><label class="fl" for="med-form">Form</label><select id="med-form">${['patch','tablet','capsule','gel','spray','cream','injection','other'].map(form=>`<option${m&&m.form===form?' selected':''}>${form}</option>`).join('')}</select></div><div class="field"><label class="fl" for="med-due">Usual time</label><input id="med-due" type="time" value="${esc(m&&m.due||'')}"></div></div>
    <div class="field"><span class="fl">Days</span><div class="chips">${['S','M','T','W','T','F','S'].map((d,i)=>h('button',{class:'chip sm','data-act':'med-day','data-v':i,'aria-pressed':medDaysDraft.includes(i)?'true':'false','aria-label':['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][i]},d)).join('')}</div></div>
    ${m?'':`<div class="grid2"><div class="field"><label class="fl" for="med-started">Start date (optional)</label><input id="med-started" type="date" max="${todayISO()}"></div><div class="field"><label class="fl" for="med-change-label">Starting note (optional)</label><input id="med-change-label" type="text" maxlength="120" placeholder="Started after the appointment"></div></div>${treatmentTargetField('med')}`}
    <div class="field"><label class="fl" for="med-notes">Notes (optional)</label><input id="med-notes" type="text" maxlength="120" placeholder="Prescriber instructions" value="${esc(m&&m.notes||'')}"></div>
    <div class="btn-row split"><button class="btn ink sm" data-act="${m?'med-edit-save':'med-save'}"${m?` data-id="${esc(m.id)}"`:''}>Save</button><button class="btn outline sm" data-act="med-cancel">Cancel</button></div></div>`;
}
function treatmentChangeForm(m){
  return `<div class="form"><h3>Record a change to ${esc(m.name)}</h3><p class="small muted">A dated note about a dose, form or schedule change. The pages before and after get compared; the saved name and schedule do not change.</p><div class="grid2"><div class="field"><label class="fl" for="change-date">Date</label><input id="change-date" type="date" max="${todayISO()}" value="${todayISO()}"></div><div class="field"><label class="fl" for="change-label">What changed</label><input id="change-label" type="text" maxlength="120" placeholder="0.0375 → 0.05 mg"></div></div>${treatmentTargetField('change')}<div class="btn-row split"><button class="btn ink sm" data-act="med-change-save" data-id="${esc(m.id)}">Save change</button><button class="btn outline sm" data-act="med-change-cancel">Cancel</button></div></div>`;
}
function treatmentStopForm(m){
  return `<div class="form" aria-label="Stop ${esc(m.name)}"><h3>Stop ${esc(m.name)}</h3><p class="small muted">Keeps the history in the dossier and the report; removes it from the day.</p><div class="field"><label class="fl" for="stop-date">Last day taken</label><input id="stop-date" type="date" min="${esc(medicationCurrentStart(m)||'1900-01-01')}" max="${todayISO()}" value="${todayISO()}"></div><div class="field"><label class="fl" for="stop-reason">Reason (optional)</label><textarea id="stop-reason" maxlength="500" placeholder="Why it stopped, side effects, what happens next"></textarea></div><div class="btn-row split"><button class="btn ink sm" data-act="med-stop-save" data-id="${esc(m.id)}">Save as stopped</button><button class="btn outline sm" data-act="med-stop-cancel">Cancel</button></div></div>`;
}
function treatmentRow(m){
  const status=medicationStatus(m);
  const actions=status==='active'?`<button class="textbtn" data-act="med-change" data-id="${esc(m.id)}">Record a change</button><button class="textbtn muted" data-act="med-stop" data-id="${esc(m.id)}">Stop</button>`
    :status==='stopped'?`<button class="textbtn" data-act="med-restart" data-id="${esc(m.id)}">Restart</button><button class="textbtn muted" data-act="med-archive" data-id="${esc(m.id)}">Archive</button>`
    :`<button class="textbtn" data-act="med-unarchive" data-id="${esc(m.id)}">Unarchive</button><button class="textbtn muted" data-act="med-remove" data-id="${esc(m.id)}">Delete</button>`;
  return `<div class="kv stack"><b>${esc(m.name)} <span class="muted" style="font-weight:400">· ${esc(medicationDetail(m))}${m.started?' · from '+esc(shortDate(m.started)):''}</span></b>${status!=='active'&&m.ended?`<span class="r">Stopped ${esc(fmtDay(m.ended))}${m.stopReason?' · '+esc(m.stopReason):''}</span>`:''}${(m.changes||[]).filter(c=>c.label&&c.label!=='Treatment started').slice(-2).map(c=>`<span class="r">${esc(shortDate(c.date))} · ${esc(c.label)}</span>`).join('')}<div style="display:flex;gap:16px;flex-wrap:wrap"><button class="textbtn muted" data-act="med-edit" data-id="${esc(m.id)}">Edit</button>${actions}</div></div>`;
}
function treatmentsSheet(){
  const meds=Array.isArray(DB.medications)?DB.medications:[];
  const changeMed=treatmentChangeTarget?meds.find(m=>m.id===treatmentChangeTarget):null, stopMed=treatmentStopTarget?meds.find(m=>m.id===treatmentStopTarget):null, editMed=medicationEditTarget?meds.find(m=>m.id===medicationEditTarget):null;
  const followUps=treatmentFollowUpItems(), activeFollowUp=findTreatmentFollowUp(treatmentFollowUpTarget);
  const active=meds.filter(m=>medicationStatus(m)==='active'), stopped=meds.filter(m=>medicationStatus(m)==='stopped'), archived=meds.filter(m=>medicationStatus(m)==='archived');
  const formOpen=medFormOpen||changeMed||stopMed||activeFollowUp;
  return {title:'Treatments',body:`<p class="lead">What you take, when it changed, whether it helped.</p>
    ${medFormOpen?medicationForm(editMed):''}${changeMed?treatmentChangeForm(changeMed):''}${stopMed?treatmentStopForm(stopMed):''}${activeFollowUp?treatmentFollowUpForm(activeFollowUp):''}
    ${formOpen?'':'<button class="btn outline sm" data-act="med-add" style="margin:6px 0 14px">Add a medication</button>'}
    <div class="label" style="margin:14px 0 4px">Active</div>${active.length?active.map(treatmentRow).join(''):'<p class="small muted">None recorded.</p>'}
    ${stopped.length?`<div class="label" style="margin:18px 0 4px">Stopped</div>${stopped.map(treatmentRow).join('')}`:''}
    ${archived.length?`<details class="plain"><summary>${archived.length} archived</summary>${archived.map(treatmentRow).join('')}</details>`:''}
    <div class="label" style="margin:22px 0 4px">Check-ins</div>${treatmentFollowUpRows(followUps)}
    <p class="xtiny" style="margin-top:14px">Adherence is marked from the day’s page. Associations between a change and a symptom are your own record, not proof of cause.</p>`};
}
function appointmentDateSheet(){
  const brief=savedBrief();
  return {title:'Appointment',body:`<p class="lead">When is it?</p><p class="small muted">Sets the countdown on the page and the dossier. No health details go to the calendar.</p>
    <div class="field"><label class="fl" for="appt-date">Date</label><input id="appt-date" type="date" value="${esc(brief.date||'')}" min="${todayISO()}"></div>
    <div class="btn-row split"><button class="btn ink sm" data-act="appointment-date-save">Save</button>${brief.date?'<button class="btn outline sm" data-act="appointment-date-clear">Clear</button>':''}</div>
    ${brief.date?'<div style="margin-top:14px">'+calendarButton(brief.date)+'</div>':''}`};
}
function rehearseSheet(){
  const brief=savedBrief(), opening=briefOpening(brief);
  const questions=brief.concerns.length?(Array.isArray(brief.questions)?brief.questions:generateBriefQuestions(brief)).filter(q=>q.selected!==false&&q.text).slice(0,3):[];
  if(!opening) return {title:'Rehearse',body:`<p class="lead">Nothing to rehearse yet.</p><p class="small muted">Set your three concerns and what you want from the visit; the opening statement writes itself.</p><button class="btn ink" data-act="brief-start">Build the brief</button>`};
  return {title:'Rehearse',body:`<div class="label accent" style="margin-bottom:12px">Say it out loud. Twice.</div><p class="quote" style="font-size:clamp(22px,6.5vw,26px)">“${esc(opening)}”</p>
    <p class="small muted" style="margin-top:14px">Under thirty seconds. Concerns first, impact second, what you want third. Then stop talking and let them ask.</p>
    ${questions.length?`<div class="label" style="margin:22px 0 6px">Then the questions</div>${questions.map((q,i)=>`<div class="qn"><span class="n">${i+1}</span><div class="q">${esc(q.text)}</div></div>`).join('')}`:''}
    <div class="sheet-foot"><div class="btn-row split"><button class="btn outline sm" data-act="brief-start">Edit the brief</button><button class="btn ink sm" data-act="open-report">The one-page brief</button></div></div>`};
}

/* ---------- the index chapters ---------- */
function pinButton(ref,text){
  const pinned=appointmentData().evidence.some(item=>item.ref===ref);
  return `<div class="no-print" style="margin-top:18px;padding-top:12px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;gap:12px"><span class="xtiny">${pinned?'Pinned to the dossier.':'Worth raising at the appointment?'}</span><button class="textbtn${pinned?' muted':''}" data-act="${pinned?'evidence-unpin':'evidence-pin'}" data-ref="${esc(ref)}" data-text="${esc(text)}">${pinned?'Unpin':'Pin to the dossier'}</button></div>`;
}
function learnSheet(k){
  const m=LEARN_MODULES.find(x=>x.id===k)||{n:''};
  let body='';
  switch(k){
    case 'stage': body=stageSheetBody(); break;
    case 'symptoms':
      body=`<p class="small muted">Each entry gives prevalence and duration, what has evidence, and what is over-claimed.</p>
      <div class="rows">${SYMPTOMS.map(s=>h('button',{class:'row','data-act':'sheet','data-s':'learn:sym-'+s.id},'<span class="txt"><b>'+esc(s.name)+'</b><span>'+esc(s.quick)+'</span></span><span class="chev">'+IC.chev+'</span>')).join('')}</div>`;
      break;
    case 'treatment': body=regionNote()+uterusNote()+TREATMENT_HTML; break;
    case 'supplements':
      body=regionNote()+SUPPLEMENTS_INTRO+SUPPLEMENTS.map(s=>`<details class="acc"><summary><span style="flex:1">${esc(s.n)}</span> <span class="badge ${s.v}">${s.v==='strong'?'Good evidence':s.v==='moderate'?'Moderate':s.v==='mixed'?'Mixed':'No evidence'}</span></summary><div><p style="margin-bottom:0">${s.s}</p></div></details>`).join('');
      break;
    case 'diet': body=regionNote()+DIET_HTML; break;
    case 'exercise': body=boneGate()+EXERCISE_HTML; break;
    case 'weight': body=WEIGHT_HTML; break;
    case 'skin': body=SKIN_HTML; break;
    case 'sleep': body=SLEEP_HTML; break;
    case 'mind': body=MIND_HTML; break;
    case 'sex': body=SEX_HTML; break;
    case 'screening': body=screeningBody(); break;
    case 'clinician': body=clinicianBody(); break;
    case 'redflags': body=redflagBody(); break;
    case 'sources': body=SOURCES_HTML; break;
    default:
      if(k.startsWith('sym-')){
        const s=SYMPTOMS.find(x=>x.id===k.slice(4));
        if(s) return {title:s.name,body:'<p class="label" style="margin-bottom:12px">'+esc(s.tag)+'</p>'+s.body+pinButton('learn:'+k,s.name+' (symptom library)')};
      }
  }
  const pin=['stage','screening','clinician','sources','redflags'].includes(k)?'':pinButton('learn:'+k,m.n+' (chapter)');
  return {title:m.n||'',body:body+pin};
}
function uterusNote(){
  const u=DB.profile.uterus;
  if(u==='hyst') return `<div class="callout ok"><span class="ctitle">You have told us your uterus was removed</span>So the progestogen section below does not apply to you. With no lining to protect, <b>oestrogen-only therapy is what is used</b>, and that avoids the component carrying most of the extra breast cancer signal. Over five years at ages 50–59, oestrogen-only estimates run from <b>6 fewer</b> to <b>3 extra</b> cases per 1,000 women, against <b>+8 to +10</b> for combined therapy. The endometrial cancer numbers in the risk table are also irrelevant to you.</div>`;
  if(u==='ablation') return `<div class="callout warn"><span class="ctitle">You have told us you had an endometrial ablation</span>You still have your uterus, so <b>you still need a progestogen alongside systemic oestrogen</b>. An ablation is not a substitute for endometrial protection; the lining can regenerate in patches. Read the progestogen section below as applying to you.</div>`;
  if(u==='intact') return `<div class="callout info"><span class="ctitle">You have your uterus</span>So the progestogen section below applies to you: anyone with a uterus taking systemic oestrogen needs endometrial protection. The choice between continuous and sequential, and between progestogen types, is one of the genuinely unsettled areas.</div>`;
  return '';
}
function regionNote(){
  const r=DB.profile.region;
  if(r==='uk') return `<div class="callout warn"><span class="ctitle">You have set your region to the UK</span>Three things differ for you. <b>Drug labelling:</b> the November 2025 US boxed-warning removal has no verified UK equivalent; UK product information still reflects the earlier MHRA risk tables. <b>Non-hormonal options:</b> NICE says do <i>not</i> routinely offer SSRIs or SNRIs as first-line for hot flashes alone, where the US Menopause Society lists them as recommended. <b>Nutrient targets:</b> the British Menopause Society uses 700 mg calcium with normal bone density (1,200 mg with osteopenia or osteoporosis) and 400 IU vitamin D, not the US figures on these pages.</div>`;
  if(r==='other') return `<div class="callout warn"><span class="ctitle">You are outside the US and UK</span>This library is built on US and UK guidance, and drug approvals, labelling, nutrient targets and screening programmes vary by country. Treat the evidence as transferable and the specifics as local; confirm them with a clinician where you are.</div>`;
  return '';
}
function boneGate(){
  const b=DB.profile.bone;
  if(b==='osteoporosis'||b==='fracture') return `<div class="callout alert"><span class="ctitle">Tailored to what you told us</span>You recorded ${b==='fracture'?'a previous fragility fracture':'osteoporosis'}. <b>Skip the high-impact and heavy-loading advice below</b> and read the “Too Fit To Fracture” rules instead: moderate loads, form over intensity, no jumping or running, and no loaded spinal bending or twisting. Ask for a physiotherapy referral; that is the standard recommendation for your situation.</div>`;
  if(b==='unknown') return `<div class="callout warn"><span class="ctitle">You have not recorded your bone status</span>Until you know it, treat the heavy-loading and impact sections below with caution. Bone loss averages 10–12% at spine and hip across the transition, and the safe programme depends on where you are. Set it under You once you know.</div>`;
  return '';
}

/* ---------- staging ---------- */
let stageAns={}, stageStep=0, stageEditing=false;
function resetStageDraft(){
  stageAns={}; stageStep=0; stageEditing=true;
  const age=ageStageAnswer(DB.profile.birthYear);
  if(age){ stageAns.age=age; stageStep=1; }
}
function stageAnswerAllowed(q,value){ return q&&q.a.some(a=>a.v===value); }
function completeStageAnswers(ans){
  if(!ans||typeof ans!=='object') return false;
  const qs=stageQueue(ans);
  return qs.length>0&&qs.every(q=>stageAnswerAllowed(q,ans[q.id]));
}
function ageStageAnswer(birthYear){
  if(birthYear==null||birthYear===''||!Number.isInteger(+birthYear)) return null;
  const age=new Date().getFullYear()-(+birthYear);
  return age<40?'u40':age<45?'40s_e':age<55?'45p':'55p';
}
function surgeryStageAnswer(date){
  if(!pastOrTodayISO(date)) return 'unsure';
  const days=daysBetween(date,todayISO());
  return days<92?'lt3m':days<365?'lt1y':days<=Math.round(5*365.25)?'1to5':'gt5';
}
function storeStageAssessment(ans){
  const p=DB.profile, clean={};
  STAGE_Q.forEach(q=>{ if(stageAnswerAllowed(q,ans[q.id])) clean[q.id]=ans[q.id]; });
  p.uterus=clean.uterus==='unsure'?'unknown':clean.uterus;
  p.ovaries=clean.ovaries==='unsure'?'unknown':clean.ovaries;
  const res=stageResult(clean);
  p.stage=res.label; p.stageAnswers=clean; p.onboardingDeferred=false;
  delete p.stageResult;
  return res;
}
function invalidateStage(){ DB.profile.stage=null; DB.profile.stageAnswers=null; delete DB.profile.stageResult; }
function refreshStageForProfile(key){
  const p=DB.profile;
  delete p.stageResult;
  if(!p.stage||!p.stageAnswers) return;
  const ans=Object.assign({},p.stageAnswers);
  if(key==='uterus') ans.uterus=p.uterus==='unknown'?'unsure':p.uterus;
  else if(key==='ovaries') ans.ovaries=p.ovaries==='unknown'?'unsure':p.ovaries;
  else if(key==='birthYear'){ const age=ageStageAnswer(p.birthYear); if(!age){ invalidateStage(); return; } ans.age=age; }
  else if(key==='surgeryDate'){ ans.surgWhen=surgeryStageAnswer(p.surgeryDate); }
  else if(key==='lastPeriod'||key==='periodStatus'){ invalidateStage(); return; }
  else return;
  if(!completeStageAnswers(ans)){ invalidateStage(); return; }
  const res=stageResult(ans); p.stage=res.label; p.stageAnswers=ans;
}
function stageResultView(res,justCompleted){
  const firstParagraph=res.body.match(/<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/i);
  const intro=firstParagraph?'<p>'+firstParagraph[1]+'</p>':'<p>Your answers point to this result. Open the full explanation for more.</p>';
  const actions=justCompleted?'<div class="btn-row split" style="margin:14px 0"><button class="btn outline sm" data-act="stage-restart">Start again</button><button class="btn ink sm" data-act="close">Done</button></div>':'<button class="textbtn" data-act="stage-restart">Answer the questions again</button>';
  return `<div class="label accent" style="margin-bottom:8px">Your stage</div><h3 class="lead stage-focus-target" tabindex="-1" style="margin:0 0 10px">${esc(res.label)}</h3>${intro}
  ${res.flags.map(f=>'<div class="callout warn">'+f+'</div>').join('')}
  ${actions}
  <details class="acc"><summary>Read your full result</summary><div>${res.body}</div></details>
  <details class="acc"><summary>How menopause is diagnosed</summary><div>${STAGE_CAVEAT}</div></details>`;
}
function stageSheetBody(){
  const p=DB.profile;
  if(Object.prototype.hasOwnProperty.call(p,'stageResult')){ delete p.stageResult; save(); }
  if(p.stage&&!completeStageAnswers(p.stageAnswers)){ invalidateStage(); save(); }
  if(p.stage&&!stageEditing){ return stageResultView(stageResult(p.stageAnswers),false); }
  if(!stageEditing) resetStageDraft();
  const qs=stageQueue(stageAns);
  if(stageStep>=qs.length){ const res=storeStageAssessment(stageAns); save(); return stageResultView(res,true); }
  const q=qs[stageStep];
  return `<p class="label stage-step" aria-live="polite" style="margin-bottom:10px">Question ${stageStep+1}</p>
  <h3 class="lead stage-focus-target" tabindex="-1">${esc(q.q)}</h3>
  ${q.note?`<p class="small muted">${esc(q.note)}</p>`:''}
  <div class="rows" style="margin-top:14px">${q.a.map(a=>h('button',{class:'row','data-act':'stage-a','data-k':q.id,'data-v':a.v},'<span class="txt"><b>'+esc(a.t)+'</b></span><span class="chev">'+IC.chev+'</span>')).join('')}</div>
  ${stageStep>0?'<button class="textbtn" data-act="stage-back">Back</button>':''}
  <p class="xtiny" style="margin-top:14px">Based on the STRAW+10 international staging system. Orientation, not a diagnosis.</p>`;
}

/* ---------- screening, red flags, clinician prep ---------- */
function screeningIntervalLabel(id,years){
  if(id==='cervical') return years===3?'3 years · cytology':'5 years · HPV testing / co-test';
  if(id==='colon') return years===1?'1 year · FIT / annual review':years===3?'3 years · stool DNA-FIT':years===5?'5 years · CT colonography / sigmoidoscopy':'10 years · colonoscopy';
  return years+' years';
}
function screeningBody(){
  const age=DB.profile.birthYear?new Date().getFullYear()-DB.profile.birthYear:null, nonUS=DB.profile.region&&DB.profile.region!=='us';
  return `<div class="callout info"><span class="ctitle">US intervals, and one honest gap</span>Current US Preventive Services Task Force and society recommendations${age?', relevant to you at '+age:''}. No blood-pressure or lipid interval is published here because the current one could not be verified; ask your clinician rather than trust a guessed number.</div>
  ${nonUS?`<div class="callout warn"><span class="ctitle">You are outside the US; these intervals will not match your programme</span>Screening ages, intervals and invitation systems differ substantially, and many countries run national invitation programmes. Use this page to ask what <i>your</i> programme covers, and record the dates you were actually seen.</div>`:''}
  ${SCREENING.map(s=>{
    const rec=DB.screening[s.id]||{}, rule=SCREENING_RULES[s.id], status=rule?screeningStatus(s.id,age):{due:false};
    const validLast=pastOrTodayISO(rec.last), intervals=rule?screeningIntervals(rule,age):[];
    const selected=intervals.includes(+rec.intervalYears)?+rec.intervalYears:(rule?rule.defaultYears:null);
    const badge=status.due?'<span class="badge accent">due to check</span>':validLast?'<span class="badge">'+fmtDay(rec.last)+'</span>':'';
    return `<details class="acc"><summary><span style="flex:1">${esc(s.n)}</span>${badge}</summary><div>
      <p class="small"><b>${esc(s.w)}</b></p><p class="small">${s.d}</p>
      <div class="field"><label class="fl" for="sc-${s.id}">Date you last had this</label><input id="sc-${s.id}" type="date" min="${DB.profile.birthYear?DB.profile.birthYear+'-01-01':'1900-01-01'}" max="${todayISO()}" data-act="screen" data-k="${s.id}" value="${validLast?rec.last:''}"></div>
      ${intervals.length>1?`<div class="field"><label class="fl" for="sci-${s.id}">Reminder interval for the test you had</label><select id="sci-${s.id}" data-act="screen-int" data-k="${s.id}">${intervals.map(y=>`<option value="${y}"${selected===y?' selected':''}>${esc(screeningIntervalLabel(s.id,y))}</option>`).join('')}</select></div>`:''}
    </div></details>`;
  }).join('')}
  <p class="xtiny">Dates here are for your own reference. Nothing is booked and nothing is sent anywhere. Reminder intervals are prompts, not the schedule your clinician gives you.</p>`;
}
function redflagBody(){
  return `<div class="callout alert"><span class="ctitle">Some symptoms need emergency help now</span>Call your local emergency number now for chest pressure or pain, sudden severe trouble breathing, signs of a stroke, fainting with severe symptoms, or immediate danger. Use <b>911</b> in the US or Canada, <b>999</b> in the UK, or <b>112</b> in the EU. Do not drive yourself. The items below need prompt clinical advice even when they are not emergencies.</div>
  ${REDFLAGS.map(r=>`<details class="acc"><summary><span style="flex:1">${esc(r.n)}</span></summary><div><p style="margin-bottom:0">${r.why}</p></div></details>`).join('')}
  <div class="callout warn"><span class="ctitle">If you are thinking about harming yourself</span>If you may act on these thoughts, have a plan, or cannot stay safe, call emergency services or go to the nearest emergency department now, and do not stay alone. In the US, call or text <a href="https://988lifeline.org/" target="_blank" rel="noopener noreferrer">988</a>. In the UK or Republic of Ireland, call <a href="https://www.samaritans.org/how-we-can-help/contact-samaritan/" target="_blank" rel="noopener noreferrer">Samaritans on 116 123</a>. Elsewhere, use <a href="https://findahelpline.com/" target="_blank" rel="noopener noreferrer">Find A Helpline</a>.</div>`;
}
function clinicianBody(){
  const dates=entryDates(), d30=rangeDates(30), hfAvg=avg(series(d30,e=>e.hf).map(p=>p.v)), bdAvg=avg(series(d30,burden).map(p=>p.v)), last=DB.scores.slice(-4).reverse();
  const brief=appointmentSuggestionBrief(), questions=(Array.isArray(brief.questions)?brief.questions:generateBriefQuestions(brief)).filter(q=>q.selected!==false&&q.text);
  return `<p class="small muted">The dossier does most of this for you. The brief turns three concerns into an opening statement and a question list; the one-page export carries the numbers.</p>
  <button class="btn ink" data-act="brief-start">${brief.concerns.length?'Edit the brief':'Build the brief'}</button>
  ${questions.length?`<div class="label" style="margin:18px 0 6px">Questions for the appointment</div>${questions.map((q,i)=>`<div class="qn"><span class="n">${i+1}</span><div><div class="q">${esc(q.text)}</div><div class="why">${esc(q.reason)}</div></div></div>`).join('')}`:'<p class="small muted" style="margin-top:14px">Not enough recorded days to suggest concerns yet; choose them yourself in the brief.</p>'}
  <div class="label" style="margin:18px 0 6px">Bring the numbers</div>
  <ul class="plain small" style="margin-bottom:0"><li>${dates.length} days logged${dates.length?', from '+fmtDay(dates[0]):''}</li>${hfAvg!=null?'<li>Hot flashes averaging <b>'+r1(hfAvg)+' a day</b> over the last month</li>':''}${bdAvg!=null?'<li>Symptom burden averaging <b>'+r1(bdAvg)+' of 44</b> across 11 tracked symptoms</li>':''}${last.length?'<li>Recent scores: '+last.map(s=>s.type.toUpperCase()+' '+s.score+' ('+fmtDay(s.date)+')').join(', ')+'</li>':''}</ul>
  <button class="textbtn" data-act="open-report">Open the one-page brief</button>
  ${briefQuestionSources()}`;
}

/* ---------- data ---------- */
function dataSheet(){
  return {title:'Export and restore',body:`
  <div class="callout ${Store.ephemeral?'warn':'info'}"><span class="ctitle">${Store.ephemeral?'This preview is not saving':'Where the record lives'}</span>
  ${Store.ephemeral?'Browser storage is unavailable here, so entries are held in memory and lost when the page closes. Installed, or on the deployed site, it saves normally.'
    :window.__MENO_NATIVE__===true?'In an encrypted file on this iPhone or iPad, protected by a key that stays on the device. It does not sync between devices, so save an encrypted backup now and then.'
    :"In this browser's local storage, on this device only. Clearing browser data deletes it, and it does not sync, so take a backup now and then."}</div>
  ${window.__MENO_NATIVE__===true&&nativePrivacyState.encryptedBackups?`<div class="label" style="margin:18px 0 8px">Encrypted backup</div>
  <p class="small">A portable, password-protected <b>.menocompass</b> file. The password is never stored.</p>
  <div class="field"><label class="fl" for="encrypted-backup-password">Backup password · at least 10 characters</label><input id="encrypted-backup-password" type="password" minlength="10" maxlength="200" autocomplete="new-password"></div>
  <div class="field"><label class="fl" for="encrypted-backup-confirm">Confirm password</label><input id="encrypted-backup-confirm" type="password" minlength="10" maxlength="200" autocomplete="new-password"></div>
  <button class="btn ink sm" data-act="export-encrypted-backup">Save encrypted backup</button>
  <p class="small" style="margin-top:18px">To restore, choose a <b>.menocompass</b> file and enter its password. Restoring replaces the current record.</p>
  <div class="field"><label class="fl" for="encrypted-restore-password">Backup password</label><input id="encrypted-restore-password" type="password" maxlength="200" autocomplete="current-password"></div>
  <button class="btn outline sm" data-act="import-encrypted-backup">Choose encrypted backup</button>`:''}
  <div class="label" style="margin:18px 0 8px">${window.__MENO_NATIVE__===true?'Plain exports':'Back up'}</div>
  <div class="btn-row split"><button class="btn ink sm" data-act="export-json">Download JSON</button><button class="btn outline sm" data-act="export-csv">Download CSV</button></div>
  <p class="xtiny"><b>Plain, unencrypted files containing health information.</b> Keep them somewhere private. JSON restores everything; CSV is one row per day plus one row per ledger entry.</p>
  <div class="label" style="margin:18px 0 8px">Copy instead</div>
  <textarea id="dump" readonly style="min-height:110px;font-family:var(--mono);font-size:.72rem">${esc(JSON.stringify(DB))}</textarea>
  <button class="textbtn" data-act="copy-dump">Copy to clipboard</button>
  <div class="label" style="margin:18px 0 8px">Restore</div>
  <p class="small">Paste a peri JSON backup. <b>This replaces everything currently stored.</b></p>
  <textarea id="restore" maxlength="5000000" aria-describedby="restore-help" placeholder='{"v":9,"profile":...}'></textarea>
  <p class="xtiny" id="restore-help">Up to 5 MB. Unknown fields and invalid values are discarded.</p>
  <button class="btn outline sm" data-act="import-json" style="margin-top:8px">Restore from this backup</button>`};
}
function resetOnboardingSheet(){
  const count=entryDates().length;
  return {title:'Redo the first page?',body:`<p class="lead">Start the letter again.</p><p class="small muted">Your ${count} recorded ${plural(count,'day')}, treatments, labs and brief stay. Only the first-page answers are asked again.</p><div class="btn-row split"><button class="btn ink sm" data-act="confirm-reset-onboarding">Redo it</button><button class="btn outline sm" data-act="close">Keep it</button></div>`};
}
function deleteLocalDataSheet(){
  return {title:'Delete everything?',body:`<p class="lead">This erases the record on this device.</p><p class="small muted">peri has no account. Profile, ledger, treatments, labs, dossier and settings go, and cannot come back unless you exported a backup.</p><div class="callout warn"><span class="ctitle">Apple subscriptions are separate</span>Deleting the record does not cancel a subscription. Manage that in App Store settings.</div><div class="btn-row split"><button class="btn sm" style="background:var(--accent);border-color:var(--accent);color:#fff" data-act="confirm-delete-local-data">Delete permanently</button><button class="btn outline sm" data-act="close">Cancel</button></div>`};
}

/* ============================================================
   TOOLS
   ============================================================ */
const PHQ9 = ['Little interest or pleasure in doing things','Feeling down, depressed, or hopeless','Trouble falling or staying asleep, or sleeping too much','Feeling tired or having little energy','Poor appetite or overeating','Feeling bad about yourself, or that you are a failure, or have let yourself or your family down','Trouble concentrating on things, such as reading the newspaper or watching television','Moving or speaking so slowly that other people could have noticed, or the opposite: being fidgety or restless','Thoughts that you would be better off dead, or of hurting yourself in some way'];
const GAD7 = ['Feeling nervous, anxious or on edge','Not being able to stop or control worrying','Worrying too much about different things','Trouble relaxing','Being so restless that it is hard to sit still','Becoming easily annoyed or irritable','Feeling afraid as if something awful might happen'];
const FREQ = ['Not at all','Several days','More than half the days','Nearly every day'];
const qDrafts = {phq9:{}, gad7:{}};
function toolSheet(t){
  const info=toolInfo(t);
  const map={ride:rideTool,protein:proteinTool,phq9:()=>questionTool('phq9'),gad7:()=>questionTool('gad7'),sleepwin:sleepWinTool,breath:breathTool,pmr:pmrTool,trigger:triggerTool,waist:waistTool};
  if(!map[t]) return {title:'',body:''};
  return {title:info?info.name:t,body:map[t]()};
}
function statTiles(items){
  return `<div class="stats" style="margin:14px 0">${items.map(([v,k,d])=>`<div class="stat"><div class="v num" style="font-size:clamp(28px,8vw,36px)">${v}</div><div class="k">${esc(k)}${d?'<br><span style="text-transform:none;letter-spacing:0;font-weight:400">'+esc(d)+'</span>':''}</div></div>`).join('')}</div>`;
}
function rideTool(){
  return `<p class="lead">Sixty seconds. It passes.</p>
  <div class="center" style="padding:14px 0 6px"><div id="ride-clock" class="clock" aria-live="polite" style="font-size:clamp(64px,22vw,88px)">60</div><p id="ride-word" class="small muted" style="margin-top:6px">Cooler air. Lose a layer. Breathe out slowly.</p></div>
  <div class="btn-row split"><button class="btn ink" data-act="ride-start">Start</button><button class="btn outline" data-act="ride-stop">Stop</button></div>
  <p class="xtiny" style="margin-top:12px">Most flashes last one to five minutes. When the count ends, the time goes on today’s ledger against the flash you logged, or as a new one. Paced breathing does not stop flashes; the minute is for riding it out, not fighting it.</p>`;
}
function proteinTool(){
  const pt=proteinTarget(), gpk=+DB.profile.proteinGpk||1.2;
  return `<p class="small">The RDA of 0.8 g/kg is a floor for avoiding deficiency, not a target for keeping muscle. Guidelines for healthy older adults use 1.0–1.2 g/kg; the training and body-composition literature uses 1.2–1.6; during intentional weight loss, 1.2–1.5.</p>
  <div class="grid2"><div class="field"><label class="fl" for="ptw">Your weight (${U.wLabel()})</label><input id="ptw" type="number" step="0.1" min="${U.imp?44:20}" max="${U.imp?1100:500}" inputmode="decimal" value="${pt?r1(U.wOut(pt.kg)):''}" data-act="prot-calc"></div>
  <div class="field"><label class="fl" for="ptg">Target</label><select id="ptg" data-act="prot-calc">${[1.0,1.2,1.4,1.6].map(v=>`<option value="${v}"${gpk===v?' selected':''}>${v.toFixed(1)} g/kg</option>`).join('')}</select></div></div>
  <div id="prot-out" aria-live="polite">${proteinOut(pt?pt.kg:null,gpk)}</div>
  <div class="callout info"><span class="ctitle">The per-meal threshold</span>After about 60 the muscle-building response is blunted; reaching it takes roughly <b>30 g of protein and 2.8 g of leucine in one sitting</b>, where a younger woman responds to any amount. Spreading intake evenly (30/30/30) produced more 24-hour muscle protein synthesis than skewing it (10/20/60). During weight loss, even distribution meant 26% versus 34% of loss coming from lean tissue.</div>
  <h4>Roughly 30 g of protein</h4>
  <div class="tw"><table><tbody><tr><td>Chicken or turkey breast</td><td>100–110 g cooked</td></tr><tr><td>Salmon or tuna</td><td>130 g cooked</td></tr><tr><td>Greek yogurt (plain, 0–2%)</td><td>280–300 g</td></tr><tr><td>Cottage cheese</td><td>250 g</td></tr><tr><td>Eggs</td><td>4–5 large</td></tr><tr><td>Firm tofu</td><td>200 g</td></tr><tr><td>Cooked lentils</td><td>330 g (about 1.7 cups)</td></tr><tr><td>Whey or soy protein powder</td><td>1 scoop (~30 g powder)</td></tr></tbody></table></div>
  <p class="xtiny">Breakfast is nearly always the meal that falls short. For BMI 30+, guidelines generally apply g/kg to an adjusted rather than actual body weight; no menopause-specific formula could be verified, so ask a dietitian. Anyone with kidney disease should get a target from their clinician, not an app.</p>`;
}
function proteinOut(kg,gpk){
  if(kg==null||!Number.isFinite(kg)||kg<=0||!Number.isFinite(gpk)) return '<p class="small muted">Enter a valid weight to see the numbers.</p>';
  const g=Math.round(kg*gpk);
  return statTiles([[g+'<small> g</small>','per day'],[Math.round(g/3)+'<small> g</small>','per meal ×3'],['~7.5<small> g</small>','leucine','per day']]);
}
function questionTool(kind){
  const items=kind==='phq9'?PHQ9:GAD7, answers=qDrafts[kind], done=items.every((_,i)=>answers[i]!=null);
  const score=done?items.reduce((total,_,i)=>total+answers[i],0):null;
  let band='';
  if(done) band=kind==='phq9'?(score<5?'minimal':score<10?'mild':score<15?'moderate':score<20?'moderately severe':'severe'):(score<5?'minimal':score<10?'mild':score<15?'moderate':'severe');
  const risk=kind==='phq9'&&answers[8]>0, past=DB.scores.filter(s=>s.type===kind).slice(-6);
  return `<p class="small">Over the <b>last two weeks</b>, how often have you been bothered by the following?</p>
  <div class="callout warn"><span class="ctitle">Read the score carefully</span>Several menopause symptoms (broken sleep, fatigue, poor concentration, low libido) <b>also score points here</b>. The perimenopausal depression guideline says so explicitly. A raised total is a reason to talk to someone, not a diagnosis.</div>
  ${items.map((q,i)=>`<div class="field"><p class="fl" id="q-${kind}-${i}" style="font-weight:500;font-size:14.5px">${i+1}. ${esc(q)}</p><div class="scale" role="group" aria-labelledby="q-${kind}-${i}">${FREQ.map((f,v)=>h('button',{'data-act':'q-a','data-k':kind,'data-i':i,'data-v':v,'aria-pressed':answers[i]===v?'true':'false','aria-label':(i+1)+'. '+q+': '+f},v)).join('')}</div><div class="scale-legend" aria-hidden="true"><span>Not at all</span><span>Nearly every day</span></div></div>`).join('')}
  ${done?`<div class="callout ${score>=15?'alert':score>=10?'warn':'ok'}"><span class="ctitle">Score: ${score} of ${items.length*3}, ${band}</span>${kind==='phq9'?'For context: elevated depressive symptoms are found in 45–68% of perimenopausal women versus 28–31% before. Women are 2–4× more likely to have a major depressive episode during the transition and early postmenopause. Prior depression is the strongest predictor.':'GAD-7 is the standard anxiety measure. The bands are its usual published ones; no validation specific to menopausal women could be found, so read your trend over time rather than the label.'}${score>=10?'<p style="margin:8px 0 0"><b>A score in this range warrants a conversation with a clinician.</b> Take the number with you.</p>':''}</div>`:''}
  ${risk?`<div class="callout alert" role="alert"><span class="ctitle">Please reach out today</span>You answered yes to thoughts of being better off dead or of hurting yourself. If you may act on these thoughts, have a plan, or cannot stay safe, call emergency services or go to the nearest emergency department now, and do not stay alone. In the US, call or text <a href="https://988lifeline.org/" target="_blank" rel="noopener noreferrer"><b>988</b></a>. In the UK or Republic of Ireland, call <a href="https://www.samaritans.org/how-we-can-help/contact-samaritan/" target="_blank" rel="noopener noreferrer"><b>116 123</b></a>. Elsewhere, use <a href="https://findahelpline.com/" target="_blank" rel="noopener noreferrer">Find A Helpline</a>.</div>`:''}
  <div class="btn-row split"><button class="btn outline sm" data-act="q-reset" data-k="${kind}">Clear</button><button class="btn ink sm" data-act="q-save" data-k="${kind}" ${done?'':'disabled'}>Save ${done?'score of '+score:'score'}</button></div>
  ${past.length?`<div class="label" style="margin:18px 0 6px">History</div>${past.slice().reverse().map(s=>kvRow(fmtDay(s.date),s.score+(s.band?' · '+esc(s.band):''))).join('')}`:''}`;
}
function sleepWinTool(){
  const ds=rangeDates(14);
  const sleeps=ds.map(d=>{const e=confirmedRecord(d);return e&&e.sleepH!=null?e.sleepH:null;}).filter(v=>v!=null);
  const beds=ds.map(d=>{const e=confirmedRecord(d);return e&&e.inBedH!=null?e.inBedH:null;}).filter(v=>v!=null);
  const paired=ds.map(confirmedRecord).filter(e=>e&&e.sleepH!=null&&e.inBedH!=null&&e.inBedH>0&&e.sleepH<=e.inBedH);
  const aSleep=avg(sleeps), aBed=avg(beds), eff=paired.length?avg(paired.map(e=>e.sleepH/e.inBedH*100)):null;
  const win=aSleep!=null&&aSleep>0?Math.max(5,Math.round(aSleep*4)/4):null;
  return `<div class="callout info"><span class="ctitle">Why this is the effective part</span>In 150 postmenopausal women with chronic insomnia: sleep hygiene education alone produced <b>4%</b> remission. CBT-I produced <b>54%</b> at the end of treatment and <b>68% at six months</b>, with 40–43 more minutes of sleep a night. Sleep restriction is the engine.</div>
  ${sleeps.length<5||win==null
    ?(sleeps.length>=5&&aSleep===0?'<div class="callout alert"><span class="ctitle">Zero sleep is not a basis for sleep restriction</span>You recorded no sleep across these nights. Do not shorten your time in bed from this calculator; contact a clinician promptly and check the entries.</div>'
      :'<div class="callout warn"><span class="ctitle">Log a few more nights first</span>You have '+sleeps.length+' '+plural(sleeps.length,'night')+' of sleep data in the last two weeks. About a week of honest logging (hours in bed and hours asleep, in the day’s details) is needed before this gives a sensible window.</div>')
    :statTiles([[r1(aSleep)+'<small> h</small>','asleep','14-day average'],...(aBed!=null?[[r1(aBed)+'<small> h</small>','in bed']]:[]),...(eff!=null?[[Math.round(eff)+'<small>%</small>','efficiency',eff>=85?'extend the window':'hold the window']]:[])])
      +`<h4>Your starting window: ${r1(win)} hours</h4><div class="field"><label class="fl" for="swk">Wake time you will keep every day</label><input id="swk" type="time" value="06:30" data-act="sw-calc" style="width:auto"></div><div id="sw-out" aria-live="polite">${swOut('06:30',win)}</div>`}
  <h4>The rules while you do this</h4>
  <ul class="tick"><li><b>Fixed wake time</b>, seven days a week, regardless of the night. This is the anchor.</li><li>Do not go to bed before the window opens, even exhausted.</li><li>Awake and frustrated: <b>get out of bed</b>. Somewhere dim and dull. Return when sleepy, not when it feels like you should.</li><li><b>No clock-watching.</b> Turn it away.</li><li>Bed for sleep and sex only.</li><li>Once efficiency passes about <b>85–90%</b>, extend the window by 15–30 minutes.</li><li>Expect to feel <b>worse in week one or two</b>. That is the mechanism, not failure.</li></ul>
  <div class="callout alert"><span class="ctitle">Do not do this unsupervised if you have</span>Bipolar disorder · a seizure disorder · untreated sleep apnea. Sleep deprivation is a trigger in all three; work with a clinician instead. If you snore, wake unrefreshed, get morning headaches, or CBT-I does not work, ask to be tested for sleep apnea: it affects <b>20% of midlife women</b> and is routinely missed.</div>
  <p class="xtiny">This implements the sleep-restriction component of CBT-I. It is not therapy; clinician- or programme-delivered CBT-I is better, and telephone-delivered CBT-I worked well in peri- and postmenopausal women.</p>`;
}
function swOut(wake,win){
  if(win==null||win<=0) return '';
  const [hh,mm]=wake.split(':').map(Number);
  let t=hh*60+mm-Math.round(win*60); while(t<0) t+=1440;
  return `<div class="callout ok" style="margin-bottom:0"><span class="ctitle">Earliest bedtime: ${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}</span>Not into bed before this, and up at ${wake} every day. When you are sleeping through most of the window, move the bedtime 15–30 minutes earlier.</div>`;
}
function breathTool(){
  return `<div class="callout alert"><span class="ctitle">What this is and is not for</span><p>Slow-paced breathing has meta-analytic support for <b>stress (g = −0.35), anxiety (−0.32) and low mood (−0.40)</b>: small-to-medium effects. Ten of twelve trials used <i>slow</i> pacing and worked; the two using fast pacing did not.</p><p style="margin-bottom:0"><b>Rated Level I NOT recommended for hot flashes.</b> Larger trials found paced respiration no better than shallow breathing or usual care. Use it for anxiety, where it earns its place.</p></div>
  <div class="center" style="padding:10px 0">
    <div id="breath-ring" style="width:170px;height:170px;margin:8px auto 14px;border-radius:50%;border:1.5px solid var(--text);display:grid;place-items:center;transition:transform 4s ease-in-out">
      <div><div id="breath-word" aria-live="polite" class="serif" style="font-size:1.3rem">Ready</div><div id="breath-count" class="xtiny">6 breaths a minute</div></div>
    </div>
    <div class="btn-row split"><button class="btn ink" data-act="breath-start">Start</button><button class="btn outline" data-act="breath-stop">Stop</button></div>
    <p class="xtiny" style="margin-top:10px">About five seconds in, five out. Through the nose if comfortable. Two to five minutes is plenty.</p>
  </div>
  <p class="small muted">The meta-analysis authors warned against “miscalibration between hype and evidence”. A cheap, low-risk tool with a modest effect, not a cure for anything.</p>`;
}
const PMR_STEPS = [
  ['Settle','Sit or lie somewhere you will not be interrupted. Let your breathing slow. Nothing to achieve here.'],
  ['Hands and forearms','Clench both fists. Hold; feel the tension. Now release completely, and notice the difference for a few breaths.'],
  ['Upper arms','Bend your elbows and tense your biceps. Hold. Release, and let your arms be heavy.'],
  ['Shoulders','Lift your shoulders towards your ears. Hold. Drop them, and let them keep dropping.'],
  ['Face','Scrunch your whole face: brow, eyes, jaw. Hold. Release, and let your jaw hang slightly open.'],
  ['Neck','Press your head gently back against the surface behind you. Hold. Release.'],
  ['Chest and back','Take a breath in and hold it, tensing your chest. Release with a long exhale.'],
  ['Stomach','Tighten your abdominal muscles. Hold. Release, and let your belly soften completely.'],
  ['Thighs','Press your legs together and tense your thighs. Hold. Release.'],
  ['Calves','Point your toes towards your face to tense your calves. Hold. Release.'],
  ['Feet','Curl your toes downwards. Hold. Release.'],
  ['Whole body','Scan from your feet upwards. Anywhere still holding on, invite it to let go. Stay here as long as you like.']
];
function pmrTool(){
  return `<p class="small">Systematic review of 46 publications across 16 countries and over 3,400 adults: supportive results for stress (24 studies), anxiety (21) and low mood (11), effect sizes small to very large. Sessions of <b>5–28 minutes</b> worked, and <b>length did not significantly affect outcomes</b>, so a short one counts.</p>
  <div id="pmr-progress" class="progress" role="progressbar" aria-label="Relaxation progress" aria-valuemin="0" aria-valuemax="${PMR_STEPS.length}" aria-valuenow="0"><i id="pmr-bar" style="width:0%"></i></div>
  <div aria-live="polite" aria-atomic="true"><h3 id="pmr-title" style="margin:12px 0 4px">Ready when you are</h3><p id="pmr-text" class="small">Tense each muscle group for about 5 seconds, then release for about 15 and pay attention to the contrast. The contrast is the active ingredient.</p></div>
  <div class="btn-row split"><button class="btn ink" data-act="pmr-start">Start</button><button class="btn outline" data-act="pmr-stop">Stop</button></div>
  <p class="xtiny" style="margin-top:12px">If you have an injury or pain anywhere, skip that group or tense only very gently.</p>`;
}
function refreshTriggerStatus(){
  const t=DB.trigger;
  if(!t||!t.active) return;
  if(!pastOrTodayISO(t.start)){ t.active=false; t.status='stopped'; t.ended=todayISO(); save(); return; }
  if(daysBetween(t.start,todayISO())>=28){ t.active=false; t.status='completed'; t.ended=addDays(t.start,27); save(); }
}
function triggerTool(){
  refreshTriggerStatus();
  const t=DB.trigger;
  if(t&&t.active){
    const day=Math.max(1,daysBetween(t.start,todayISO())+1), phase=day<=14?'removal':'reintroduction', dayIn=day<=14?day:day-14;
    const before=triggerStats(t,'base'), remove=triggerStats(t,'remove'), reintro=triggerStats(t,'reintro');
    return `<div class="callout ok"><span class="ctitle">Test running: ${esc(t.item)}</span>Day ${day}, <b>${phase} phase</b>, day ${dayIn} of 14. Keep logging as normal; the comparison happens on its own.</div>
    <div class="progress" role="progressbar" aria-label="Trigger test progress" aria-valuemin="0" aria-valuemax="28" aria-valuenow="${Math.min(28,day)}"><i style="width:${Math.min(100,Math.round(day/28*100))}%"></i></div>
    ${triggerPhaseTiles(before,remove,reintro)}
    ${day>=15?triggerComparison(remove,reintro,false):`<div class="callout info"><span class="ctitle">Reintroduction starts on day 15</span>A change during removal is only a clue. Bringing ${esc(t.item)} back for the second two weeks tests whether the pattern reverses.</div>`}
    <button class="btn outline sm" data-act="trig-stop">End this test</button>
    <p class="xtiny" style="margin-top:12px">A single-person, unblinded experiment with no control for everything else changing in your life. The fairest version available to you, which is not the same as proof.</p>`;
  }
  if(t){
    const before=triggerStats(t,'base'), remove=triggerStats(t,'remove'), reintro=triggerStats(t,'reintro'), complete=t.status==='completed';
    return `<div class="callout ${complete?'ok':'warn'}"><span class="ctitle">${complete?'Test complete':'Test ended early'}: ${esc(t.item)}</span>${complete?'Both 14-day phases done.':'The available numbers are shown, but an incomplete phase is much harder to interpret.'}</div>
      ${triggerPhaseTiles(before,remove,reintro)}${triggerComparison(remove,reintro,complete)}
      <button class="btn ink sm" data-act="trig-reset">Start another test</button>
      <p class="xtiny" style="margin-top:12px">Personal observations, not proof of cause. Illness, weather, stress, treatment changes and ordinary variation all move the numbers.</p>`;
  }
  return `<div class="callout warn"><span class="ctitle">Trigger-avoidance is not a proven treatment</span>The Menopause Society states plainly that <b>there are no clinical trials assessing whether avoiding triggers relieves vasomotor symptoms</b>, and rates it not recommended. The most-quoted caffeine study was cross-sectional, and its own authors said they could not advise patients without further research.</div>
  <p class="small">So why offer this? Because individual responses vary, and a structured two-week removal followed by reintroduction is far more informative than vaguely avoiding six things at once and never knowing which mattered.</p>
  <div class="field"><label class="fl" for="trig">What do you want to test?</label><select id="trig">${['Alcohol','Caffeine','Spicy food','Sugar','Late meals','Hot drinks','Something else'].map(v=>`<option>${v}</option>`).join('')}</select></div>
  <button class="btn ink" data-act="trig-start">Start the 28-day test</button>
  <h4 style="margin-top:18px">How it works</h4>
  <ul class="tick"><li><b>Days 1–14:</b> remove it completely. Change nothing else. Keep logging.</li><li><b>Days 15–28:</b> bring it back at your usual amount. Keep logging.</li><li>Hot flash counts and sleep are compared across the phases.</li><li>A difference under about one flash a day is noise. Be willing to conclude nothing happened; that is a useful answer.</li></ul>
  <p class="xtiny">If alcohol is the thing you are testing, cutting it back is worth doing regardless. The evidence for that sits with breast cancer risk and sleep quality, not hot flashes.</p>`;
}
function triggerStats(t,which){
  const offsets=which==='base'?[-14,-1]:which==='remove'?[0,13]:[14,27], ds=[];
  for(let i=offsets[0];i<=offsets[1];i++){ const d=addDays(t.start,i); if(d<=todayISO()) ds.push(d); }
  const hf=ds.map(d=>{const e=confirmedRecord(d);return e&&e.hf;}).filter(v=>v!=null), sleep=ds.map(d=>{const e=confirmedRecord(d);return e&&e.sleepH;}).filter(v=>v!=null);
  return {hf:avg(hf),sleep:avg(sleep),hfN:hf.length,sleepN:sleep.length};
}
function triggerPhaseTiles(before,remove,reintro){
  const tile=(label,s)=>[(s.hf!=null?r1(s.hf):'–')+'<small> fl.</small>',label,(s.sleep!=null?r1(s.sleep)+' h sleep':'no sleep logged')+' · '+s.hfN+' '+plural(s.hfN,'day')];
  return statTiles([tile('Before',before),tile('Removal',remove),tile('Reintro',reintro)]);
}
function triggerComparison(remove,reintro,complete){
  if(remove.hf==null||reintro.hf==null) return `<div class="callout warn"><span class="ctitle">Not enough paired phase data yet</span>Log hot flashes during both removal and reintroduction. Sleep averages appear when hours asleep are logged.</div>`;
  const delta=reintro.hf-remove.hf, small=Math.abs(delta)<0.8;
  const title=small?'No clear hot-flash difference':delta>0?'Hot flashes were lower during removal':'Hot flashes were higher during removal';
  const sleepNote=remove.sleep!=null&&reintro.sleep!=null?' Average sleep was '+r1(remove.sleep)+' hours during removal and '+r1(reintro.sleep)+' after reintroduction.':'';
  return `<div class="callout info"><span class="ctitle">${complete?'Final result':'Result so far'}: ${title}</span>Removal averaged ${r1(remove.hf)} flashes a day; reintroduction averaged ${r1(reintro.hf)}.${sleepNote} ${small?'A difference under about one flash a day is best treated as noise.':'A reversal after reintroduction is more suggestive than removal alone, but still cannot establish cause.'}</div>`;
}
function triggerBanner(){
  refreshTriggerStatus();
  const t=DB.trigger;
  if(!t||!t.active) return '';
  const day=daysBetween(t.start,todayISO())+1;
  if(day<1||day>28) return '';
  return `<div class="callout info"><span class="ctitle">Trigger test day ${day}: ${esc(t.item)}</span>${day<=14?'Removal phase. Keep it out and keep logging.':'Reintroduction phase. Back to your usual amount.'} <button class="textbtn" data-act="sheet" data-s="tool:trigger" style="padding:0;min-height:0;display:inline">Results</button></div>`;
}
function waistTool(){
  const wa=entryDates().slice().reverse().map(d=>{const e=confirmedRecord(d);return e&&e.waist;}).find(v=>v!=null);
  return `<p class="small">The International Atherosclerosis Society consensus argues waist should be treated as a <b>vital sign</b>. Modelled together with BMI, waist stays predictive of mortality while BMI becomes unrelated or even inversely related. A 10% larger waist meant 1.48× higher mortality after BMI adjustment; in coronary artery disease, 2.05×.</p>
  ${wa!=null?statTiles([[r1(U.lOut(wa))+'<small> '+U.lLabel()+'</small>','your latest',wa>=105?'class I threshold':wa>=90?'above 90 cm':wa>=80?'above 80 cm':'below 80 cm']]):''}
  <h4>Thresholds for women</h4>
  <div class="tw"><table><tbody><tr><td>At normal weight</td><td><b>80 cm / 31.5 in</b></td></tr><tr><td>At overweight</td><td><b>90 cm / 35.4 in</b></td></tr><tr><td>Class I obesity</td><td>105 cm / 41.3 in</td></tr></tbody></table></div>
  <p class="xtiny">Ethnicity-specific single cut-points for women include 80 cm for Chinese and Asian Indian women, 85 cm for Korean and Tunisian women, 90 cm for Japanese women.</p>
  <h4>Measure it the same way every time</h4>
  <ul class="tick"><li>Top of the hip bone, <b>or</b> midway between lowest rib and hip bone. These differ by about 2 cm in women: <b>pick one and never change</b>.</li><li>Bare skin, standing relaxed, tape snug but not compressing.</li><li>At the end of a normal exhale. Do not suck in.</li><li>Same time of day, ideally morning before eating.</li></ul>
  <div class="callout ok"><span class="ctitle">The encouraging part</span>Diet and exercise reduce waist <b>with or without weight loss</b>; one large trial found about 5 cm of reduction versus control. Aerobic work moved it most (−2.30 cm across 101 trials in postmenopausal women).</div>
  <p class="xtiny">Self-measurement correlates well with clinical measurement (r = 0.8–0.9) but typically underestimates by 1–3 cm. Irrelevant when you are tracking your own change.</p>`;
}

/* ---------- animated tool hooks ---------- */
let breathTimer=null, pmrTimer=null, rideTimer=null, rideLeft=60;
function runSheetHooks(id){
  if(id==='appointment-brief') document.querySelectorAll('.qedit textarea').forEach(input=>{ const fit=()=>{input.style.height='auto';input.style.height=(input.scrollHeight+2)+'px';}; fit(); input.addEventListener('input',fit); });
  if(id!=='tool:breath'&&breathTimer){ clearInterval(breathTimer); breathTimer=null; }
  if(id!=='tool:pmr'&&pmrTimer){ clearInterval(pmrTimer); pmrTimer=null; }
  if(id!=='tool:ride'&&rideTimer){ clearInterval(rideTimer); rideTimer=null; }
}
function breathStart(){
  const ring=document.getElementById('breath-ring'), word=document.getElementById('breath-word'), cnt=document.getElementById('breath-count');
  if(!ring) return;
  if(breathTimer) clearInterval(breathTimer);
  let phase=0, n=0;
  const tick=()=>{
    if(phase%2===0){ ring.style.transitionDuration='5s'; ring.style.transform='scale(1.22)'; word.textContent='Breathe in'; }
    else { ring.style.transitionDuration='5s'; ring.style.transform='scale(0.86)'; word.textContent='Breathe out'; n++; cnt.textContent=n+' '+plural(n,'breath','breaths'); }
    phase++;
  };
  tick(); breathTimer=setInterval(tick,5000);
}
function breathStop(){
  if(breathTimer) clearInterval(breathTimer); breathTimer=null;
  const ring=document.getElementById('breath-ring'), word=document.getElementById('breath-word');
  if(ring){ ring.style.transform='scale(1)'; word.textContent='Stopped'; }
}
function pmrStart(){
  if(pmrTimer) clearInterval(pmrTimer);
  let i=0;
  const show=()=>{
    const t=document.getElementById('pmr-title'), x=document.getElementById('pmr-text'), b=document.getElementById('pmr-bar'), p=document.getElementById('pmr-progress');
    if(!t){ clearInterval(pmrTimer); return; }
    if(i>=PMR_STEPS.length){ t.textContent='Done'; x.textContent='Notice how your body feels now compared with when you started.'; b.style.width='100%'; if(p) p.setAttribute('aria-valuenow',PMR_STEPS.length); clearInterval(pmrTimer); pmrTimer=null; return; }
    t.textContent=PMR_STEPS[i][0]; x.textContent=PMR_STEPS[i][1]; b.style.width=Math.round((i+1)/PMR_STEPS.length*100)+'%'; if(p) p.setAttribute('aria-valuenow',i+1); i++;
  };
  show(); pmrTimer=setInterval(show,45000);
}
function pmrStop(){ if(pmrTimer) clearInterval(pmrTimer); pmrTimer=null; const t=document.getElementById('pmr-title'); if(t) t.textContent='Stopped'; }
function rideStart(){
  const clock=document.getElementById('ride-clock'), word=document.getElementById('ride-word');
  if(!clock) return;
  if(rideTimer) clearInterval(rideTimer);
  rideLeft=60; clock.textContent='60'; word.textContent='Cooler air. Lose a layer. Breathe out slowly.';
  rideTimer=setInterval(()=>{
    rideLeft--; const c=document.getElementById('ride-clock'), w=document.getElementById('ride-word'); if(!c){ clearInterval(rideTimer); rideTimer=null; return; }
    c.textContent=String(Math.max(0,rideLeft));
    if(rideLeft===40) w.textContent='Shoulders down. Let the heat move through.';
    if(rideLeft===20) w.textContent='Nearly there. It is already fading.';
    if(rideLeft<=0){ clearInterval(rideTimer); rideTimer=null; w.textContent='Done. Filed to the ledger.'; rideRecord(); }
  },1000);
}
function rideRecord(){
  const t=todayISO(), recent=dayMoments(t).filter(m=>m.k==='hf'&&!m.d&&hmMinutes(nowHM())-hmMinutes(m.t)<=30).pop();
  if(recent) updateMoment(t,recent.id,{d:60});
  else addMoment(t,{k:'hf',d:60});
  save(true); render(true);
}
function rideStop(){ if(rideTimer) clearInterval(rideTimer); rideTimer=null; const w=document.getElementById('ride-word'); if(w) w.textContent='Stopped.'; }

/* ============================================================
   RENDER + ROUTES
   ============================================================ */
const ROUTE_ALIASES={journey:'dossier',care:'dossier',trends:'dossier',meds:'dossier',guide:'index',learn:'index',report:'appointment-report',settings:'profile',you:'profile',checkin:'today','today-details':'today'};
const NATIVE_ROUTE={today:'today',dossier:'journey',index:'guide',profile:'profile','appointment-report':'appointment-report'};
const VALID_ROUTES=['today','dossier','index','profile','appointment-report'];
let lastNativeNavigationState='';
function normalizeRoute(route){ return ROUTE_ALIASES[route]||route; }
function applyTheme(){
  const pref=DB&&DB.profile?DB.profile.theme:'auto';
  const dark=pref==='dark'||(pref!=='light'&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.setAttribute('data-theme',dark?'dark':'light');
  const nightPage=!!document.querySelector('#app .view.night');
  document.documentElement.classList.toggle('night-page',nightPage);
  const meta=document.querySelector('meta[name="theme-color"]');
  if(meta) meta.setAttribute('content',dark||nightPage?'#000000':'#fbfbf9');
}
function syncNativeNavigationState(){
  if(window.__MENO_NATIVE__!==true) return;
  const state={route:NATIVE_ROUTE[curTab]||'today',primary:Object.prototype.hasOwnProperty.call(TAB_TITLES,curTab),sheetOpen:sheetStack.length>0,onboarded:DB.profile.onboarded===true};
  const serialized=JSON.stringify(state);
  if(serialized===lastNativeNavigationState) return;
  if(postNativeEvent('navigation-state',state)) lastNativeNavigationState=serialized;
}
function setRoute(route,replace){
  route=normalizeRoute(route);
  if(!VALID_ROUTES.includes(route)) route='today';
  curTab=route; curDate=todayISO();
  if(location.protocol!=='file:'){
    const hash='#'+route;
    if(location.hash!==hash) history[replace?'replaceState':'pushState'](null,'',hash);
  }
}
let firstRunObserved=false;
function render(preserveScroll){
  curDate=todayISO();
  const scrollY=preserveScroll?window.scrollY:0;
  refreshTriggerStatus();
  document.body.classList.toggle('onboarding',!DB.profile.onboarded);
  if(!DB.profile.onboarded){
    $('#app').innerHTML=viewFirstRun();
    if(!firstRunObserved){ firstRunObserved=true; postNativeEvent('onboarding-step',{step:0}); }
    applyTheme(); syncNativeNavigationState(); window.scrollTo(0,preserveScroll?scrollY:0);
    return;
  }
  const map={today:viewToday,dossier:viewDossier,index:viewIndex,profile:viewYou,'appointment-report':viewReport};
  $('#app').innerHTML=(map[curTab]||viewToday)();
  applyTheme();
  window.scrollTo(0,preserveScroll?scrollY:0);
  if(!preserveScroll&&!sheetStack.length){
    const heading=document.querySelector('#app h1');
    if(heading){ heading.setAttribute('tabindex','-1'); heading.focus({preventScroll:true}); }
  }
  syncNativeNavigationState();
}
function renderIndexResults(){
  if(curTab!=='index') return;
  const root=document.getElementById('index-results'); if(!root) return;
  const fresh=document.createElement('div'); fresh.innerHTML=viewIndex();
  const next=fresh.querySelector('#index-results'); if(next) root.innerHTML=next.innerHTML;
  const ledger=document.querySelector('.ask-ledger'), nextLedger=fresh.querySelector('.ask-ledger');
  if(ledger&&!nextLedger) ledger.remove();
  else if(!ledger&&nextLedger) document.querySelector('.ask').insertAdjacentElement('afterend',nextLedger);
}
function nativeProLocked(area){
  return window.__MENO_NATIVE__===true && window.__MENO_NATIVE_SUBSCRIPTIONS__!==false && window.__MENO_PRO_ACTIVE__!==true
    && (normalizeRoute(area)==='dossier'||normalizeRoute(area)==='appointment-report');
}
function requestNativePro(area){
  if(!nativeProLocked(area)) return false;
  try{ if(window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify({type:'open-pro-paywall',feature:NATIVE_ROUTE[normalizeRoute(area)]||normalizeRoute(area)})); }catch(e){}
  toast('The dossier and the brief are part of peri Pro');
  return true;
}
window.addEventListener('menocompass-pro-changed',()=>{ if(nativeProLocked(curTab)) setRoute('today',true); render(true); });

function revealForm(fieldId){
  const field=document.getElementById(fieldId); if(!field) return;
  const form=field.closest('.form')||field;
  form.scrollIntoView({block:'start',behavior:'auto'});
  field.focus({preventScroll:true});
}
function actionDate(el){
  if(el&&el.dataset.d&&validISODate(el.dataset.d)&&el.dataset.d<=todayISO()) return el.dataset.d;
  return sheetDate(sheetStack[sheetStack.length-1]||'');
}
function commitDay(date){
  const e=DB.entries[date]; if(!e) return;
  if(hasEntryContent(safeEntryPayload(e))) confirmEntry(date); else unconfirmEntry(date);
}
function fileMoment(date,moment,source){
  const wasEmpty=!isConfirmedEntry(date);
  const added=addMoment(date,moment);
  if(!added){ toast('That day’s ledger is full'); return null; }
  save(true);
  if(wasEmpty) postNativeEvent('checkin-confirmed',{date});
  if(source!=='silent') toast('Filed '+momentName(added)+' at '+added.t);
  return added;
}
function startDictation(){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){ dictationOpen=true; renderSheet(true); return; }
  try{
    const rec=new SR(); rec.lang=navigator.language||'en-US'; rec.interimResults=false; rec.maxAlternatives=1;
    rec.onresult=ev=>{ const text=ev.results&&ev.results[0]&&ev.results[0][0]?ev.results[0][0].transcript:''; if(text) fileUtterance(text); };
    rec.onerror=()=>{ dictationOpen=true; renderSheet(true); };
    rec.start(); toast('Listening');
  }catch(e){ dictationOpen=true; renderSheet(true); }
}
function fileUtterance(text){
  const t=todayISO(), items=parseUtterance(text);
  if(!items.length) return;
  let last=null;
  items.forEach(m=>{ const added=fileMoment(t,m,'silent'); if(added) last=added; });
  if(last) lastLogged=last.id;
  dictationOpen=false;
  toast(items.length===1?'Filed '+momentName(items[0])+' at '+items[0].t:'Filed '+items.map(momentName).join(', '));
  if(sheetStack.length) renderSheet(false); else render(true);
}

/* ============================================================
   ACTIONS
   ============================================================ */
function handleAction(el, ev){
  const a=el.dataset.act;
  if(companionAction(el)) return;
  const date=actionDate(el);
  const e=()=>entry(date);
  switch(a){
    case 'tab': {
      const target=normalizeRoute(el.dataset.v);
      if(requestNativePro(target)) return;
      if(target==='today') nightDeskDismissed=true;
      setRoute(target); sheetStack=[]; renderSheet(); render(); return;
    }
    case 'open-profile':
      if(curTab!=='profile') returnTab=Object.prototype.hasOwnProperty.call(TAB_TITLES,curTab)?curTab:(returnTab||'today');
      setRoute('profile'); render(); return;
    case 'go-back': setRoute(Object.prototype.hasOwnProperty.call(TAB_TITLES,returnTab)?returnTab:'today'); render(); return;
    case 'go-dossier': setRoute(nativeProLocked('dossier')?'today':'dossier'); render(); return;
    case 'open-report':
      if(requestNativePro('appointment-report')) return;
      postNativeEvent('report-opened',{rangeDays:reportRange});
      returnTab='dossier'; sheetStack=[]; renderSheet(); setRoute('appointment-report'); render(); return;
    case 'report-range': reportRange=+el.dataset.v; render(true); return;
    case 'night-dismiss': nightDeskDismissed=true; render(); return;
    case 'unlock-pro': requestNativePro('dossier'); return;
    /* the ledger */
    case 'log': {
      const k=el.dataset.k; if(!MOMENT_KINDS[k]) return;
      const added=fileMoment(todayISO(),{k},el.dataset.night?'night':'silent');
      if(!added) return;
      if(sheetStack.length){ lastLogged=added.id; renderSheet(false); }
      else render(true);
      return;
    }
    case 'log-more': logMore=true; renderSheet(false); return;
    case 'log-severity': {
      const m=lastLogged&&updateMoment(todayISO(),lastLogged,{s:+el.dataset.v});
      if(m){ save(true); renderSheet(false); }
      return;
    }
    case 'dictate': startDictation(); return;
    case 'moment': openSheet('moment:'+(el.dataset.d||todayISO())+':'+el.dataset.id); return;
    case 'moment-severity': {
      const m=updateMoment(date,el.dataset.id,{s:+el.dataset.v});
      if(m){ save(true); renderSheet(false); }
      return;
    }
    case 'moment-delete':
      if(removeMoment(date,el.dataset.id)){ save(true); closeSheet(); toast('Deleted'); refresh(); }
      return;
    case 'day-add': {
      const kind=document.getElementById('past-kind'), time=document.getElementById('past-time');
      if(!kind||!MOMENT_KINDS[kind.value]) return;
      const t=time&&/^\d\d:\d\d$/.test(time.value)?time.value:'12:00';
      if(fileMoment(date,{k:kind.value,t},'sheet')) renderSheet(false);
      return;
    }
    /* close the day */
    case 'close-rate': closeDraft=closeDraft||{}; closeDraft.rating=+el.dataset.v; renderSheet(false); return;
    case 'close-toggle': closeDraft=closeDraft||{}; closeDraft[el.dataset.k]=!closeDraft[el.dataset.k]; renderSheet(false); return;
    case 'close-save': {
      const draft=closeDraft||{};
      if(draft.rating==null){ toast('Pick a word for the day first'); return; }
      const wasClosed=dayClosed(date);
      if(!closeDay(date,draft)){ toast('Nothing to close yet'); return; }
      save(true);
      if(!wasClosed) postNativeEvent('checkin-confirmed',{date});
      sheetStack=[]; renderSheet(); render(); toast('Closed · '+DAY_RATINGS[draft.rating]);
      return;
    }
    /* the day's fields */
    case 'hf': {
      const d=e(); if(dayMoments(date).some(m=>m.k==='hf')) return;
      d.hf=Math.max(0,(d.hf==null?0:d.hf)+(+el.dataset.n)); commitDay(date); save(); refresh(); return;
    }
    case 'set': { const v=el.dataset.v; setPath(e(),el.dataset.k,v===''?null:(isNaN(v)?v:+v)); commitDay(date); save(); refresh(); return; }
    case 'toggle': { const cur=getPath(e(),el.dataset.k); setPath(e(),el.dataset.k,cur?null:true); commitDay(date); save(); refresh(); return; }
    case 'med-taken': {
      const m=DB.medications.find(x=>x.id===el.dataset.id); if(!m) return;
      const day=e(), records=day.med||(day.med={}), current=records[m.id], name=medicationDetailsOn(m,date).name;
      if(current&&current.taken){ delete records[m.id]; const mm=dayMoments(date).find(x=>x.k==='med'&&x.n===name); if(mm) removeMoment(date,mm.id); }
      else { const at=date===todayISO()?nowHM():(medicationDetailsOn(m,date).due||'09:00'); records[m.id]={taken:true,at}; addMoment(date,{k:'med',n:name,t:at}); }
      commitDay(date); save(true); refresh(); return;
    }
    /* first run */
    case 'fr-symptom': {
      const key=el.dataset.v, current=Array.isArray(DB.profile.pinnedSymptoms)?[...DB.profile.pinnedSymptoms]:[];
      if(!MOMENT_KINDS[key]) return;
      if(current.includes(key)) DB.profile.pinnedSymptoms=current.filter(k=>k!==key);
      else if(current.length>=6){ toast('Six is the limit. Swap one out.'); return; }
      else DB.profile.pinnedSymptoms=[...current,key];
      save(); render(true); document.querySelector('[data-act="fr-symptom"][data-v="'+key+'"]')?.focus({preventScroll:true}); return;
    }
    case 'fr-more': firstRun.more=true; render(true); return;
    case 'fr-periods': DB.profile.periodStatus=safeEnum(el.dataset.v,PERIOD_STATUSES,''); save(); render(true); document.querySelector('[data-act="fr-periods"][data-v="'+el.dataset.v+'"]')?.focus({preventScroll:true}); return;
    case 'fr-appt': firstRun.appointment=el.dataset.v; render(true); document.querySelector(firstRun.appointment==='yes'?'#fr-date':'[data-act="fr-appt"][data-v="no"]')?.focus({preventScroll:true}); return;
    case 'fr-done': finishFirstRun(); return;
    case 'profile-symptom': {
      const key=el.dataset.v, current=Array.isArray(DB.profile.pinnedSymptoms)?[...DB.profile.pinnedSymptoms]:focusedKeys();
      if(current.includes(key)) DB.profile.pinnedSymptoms=current.filter(k=>k!==key);
      else if(current.filter(k=>!LOG_ALWAYS.includes(k)).length>=6){ toast('Six words at most'); return; }
      else DB.profile.pinnedSymptoms=[...current,key];
      save(true); render(true); return;
    }
    /* dossier */
    case 'appointment-date-save': {
      const field=document.getElementById('appt-date');
      if(!field||!validISODate(field.value)){ toast('Choose a date'); return; }
      appointmentData().brief.date=field.value; save(true); closeSheet(); render(true); toast('Appointment '+fmtDay(field.value)); return;
    }
    case 'appointment-date-clear': appointmentData().brief.date=''; save(true); closeSheet(); render(true); return;
    case 'evidence-pin': {
      const data=appointmentData(); if(data.evidence.length>=100){ toast('The evidence list is full'); return; }
      data.evidence.push({id:'evidence-'+Date.now().toString(36),date:todayISO(),kind:'chapter',text:safeText(el.dataset.text,500),source:'index',ref:safeText(el.dataset.ref,60)});
      save(true); refresh(); toast('Pinned to the dossier'); return;
    }
    case 'evidence-unpin': { const data=appointmentData(); data.evidence=data.evidence.filter(item=>item.ref!==el.dataset.ref); save(true); refresh(); return; }
    case 'evidence-remove': { const data=appointmentData(); data.evidence=data.evidence.filter(item=>item.id!==el.dataset.id); save(true); refresh(); return; }
    /* native shell */
    case 'manage-subscription': postNativeEvent('open-subscription-management'); return;
    case 'analytics-settings': postNativeEvent('analytics-settings'); return;
    case 'advertising-settings': postNativeEvent('advertising-settings'); return;
    case 'erase-analytics': if(confirm('Turn off analytics and request deletion of this installation’s analytics events? Your record is unaffected.')) postNativeEvent('erase-analytics'); return;
    case 'app-lock-toggle': postNativeEvent('set-app-lock',{enabled:el.dataset.enabled==='true'}); return;
    case 'save-native-reminders': {
      const dailyEnabled=document.getElementById('daily-reminder-enabled'), dailyTime=document.getElementById('daily-reminder-time');
      const treatmentEnabled=document.getElementById('treatment-reminder-enabled'), treatmentDay=document.getElementById('treatment-reminder-day'), treatmentTime=document.getElementById('treatment-reminder-time');
      const timeParts=(field,fallback)=>((field&&/^\d\d:\d\d$/.test(field.value)?field.value:fallback).split(':').map(Number));
      const [dailyHour,dailyMinute]=timeParts(dailyTime,'20:00'), [treatmentHour,treatmentMinute]=timeParts(treatmentTime,'10:00');
      postNativeEvent('configure-reminders',{requestPermission:true,preferences:{
        dailyCheckIn:{enabled:!!(dailyEnabled&&dailyEnabled.checked),hour:dailyHour,minute:dailyMinute},
        treatmentFollowUp:{enabled:!!(treatmentEnabled&&treatmentEnabled.checked),weekday:+(treatmentDay&&treatmentDay.value||1),hour:treatmentHour,minute:treatmentMinute}
      }}); return;
    }
    case 'healthkit-sync':
      nativeHealthState.busy=true; render(true);
      if(!postNativeEvent('healthkit-sync',{userInitiated:true,lookbackDays:7})){ nativeHealthState.busy=false; render(true); toast('Apple Health is available only in the iPhone app'); }
      return;
    case 'healthkit-clear': if(confirm('Remove the saved Apple Health summary from peri? Apple Health itself is not changed.')){ DB.healthKit=null; save(true); render(true); } return;
    case 'reset-onboarding': openSheet('reset-onboarding-confirm'); return;
    case 'confirm-reset-onboarding':
      DB.profile.onboarded=false; DB.profile.onboardingStep=0; DB.profile.onboardingDeferred=false; firstRun={appointment:null,date:'',more:false};
      setRoute('today',true); sheetStack=[]; renderSheet(); save(true); render(); return;
    case 'delete-local-data': openSheet('delete-local-data-confirm'); return;
    case 'confirm-delete-local-data':
      postNativeEvent('clear-native-private-data'); Store.clear(); DB=blankDB(); firstRun={appointment:null,date:'',more:false};
      setRoute('today',true); sheetStack=[]; renderSheet(); save(true); render(); toast('Deleted'); return;
    /* treatments */
    case 'med-add': medFormOpen=true; medicationEditTarget=null; treatmentChangeTarget=null; treatmentStopTarget=null; treatmentFollowUpTarget=null; medDaysDraft=[0,1,2,3,4,5,6]; refresh(); revealForm('med-name'); return;
    case 'med-edit': { const med=DB.medications.find(item=>item.id===el.dataset.id); if(!med) return; medicationEditTarget=med.id; medFormOpen=true; treatmentChangeTarget=null; treatmentStopTarget=null; treatmentFollowUpTarget=null; medDaysDraft=[...med.days]; refresh(); revealForm('med-name'); return; }
    case 'med-cancel': medFormOpen=false; medicationEditTarget=null; refresh(); return;
    case 'med-day': { const d=+el.dataset.v; medDaysDraft=medDaysDraft.includes(d)?medDaysDraft.filter(x=>x!==d):[...medDaysDraft,d].sort(); el.setAttribute('aria-pressed',medDaysDraft.includes(d)?'true':'false'); return; }
    case 'med-edit-save': {
      const med=DB.medications.find(item=>item.id===el.dataset.id), name=document.getElementById('med-name');
      if(!med||!name) return;
      if(!name.value.trim()){ toast('Enter the medication and dose'); name.focus(); return; }
      if(!medDaysDraft.length){ toast('Choose at least one day'); return; }
      const before=safeMedicationDetails(med), after=safeMedicationDetails({name:name.value.trim(),form:document.getElementById('med-form').value,days:medDaysDraft,due:document.getElementById('med-due').value,notes:document.getElementById('med-notes').value.trim()});
      if(JSON.stringify(before)!==JSON.stringify(after)){
        med.revisions=Array.isArray(med.revisions)?med.revisions:[];
        if(med.revisions.length>=MAX_MEDICATION_HISTORY){ toast('This treatment’s history is full. Save a backup and start a new entry.'); return; }
        med.revisions.push({date:todayISO(),before,after}); Object.assign(med,after);
      }
      medFormOpen=false; medicationEditTarget=null; save(true); refresh(); toast('Saved'); return;
    }
    case 'med-save': {
      const name=document.getElementById('med-name'), form=document.getElementById('med-form'), due=document.getElementById('med-due'), notes=document.getElementById('med-notes'), started=document.getElementById('med-started'), changeLabel=document.getElementById('med-change-label');
      if(!name||!name.value.trim()){ toast('Enter the medication and dose'); name&&name.focus(); return; }
      if(!medDaysDraft.length){ toast('Choose at least one day'); return; }
      let id='med-'+Date.now().toString(36); while(DB.medications.some(m=>m.id===id)) id+='x';
      const targets=selectedTreatmentTargets('med');
      if(targets.length>6){ toast('Six target symptoms at most'); return; }
      if(started&&started.value&&!pastOrTodayISO(started.value)){ toast('The start date cannot be in the future'); started.focus(); return; }
      if((targets.length||(changeLabel&&changeLabel.value.trim()))&&!(started&&started.value)){ toast('Add a start date for the note or the check-ins'); started&&started.focus(); return; }
      const med={id,name:name.value.trim(),form:form.value,days:[...medDaysDraft],due:due.value,notes:notes.value.trim(),started:started&&pastOrTodayISO(started.value)?started.value:'',ended:'',status:'active',stopReason:'',archivedAt:'',changes:[]};
      if(med.started&&(changeLabel&&changeLabel.value.trim()||targets.length)) med.changes.push(newTreatmentChange(med.started,changeLabel&&changeLabel.value.trim()||'Treatment started',targets));
      DB.medications.push(med); medFormOpen=false; save(true); refresh(); toast('Added'); return;
    }
    case 'med-change': treatmentChangeTarget=el.dataset.id; treatmentStopTarget=null; treatmentFollowUpTarget=null; medFormOpen=false; refresh(); revealForm('change-date'); return;
    case 'med-change-cancel': treatmentChangeTarget=null; refresh(); return;
    case 'med-change-save': {
      const med=DB.medications.find(m=>m.id===el.dataset.id), d=document.getElementById('change-date'), label=document.getElementById('change-label');
      if(!med||!d||!pastOrTodayISO(d.value)||!label||!label.value.trim()){ toast('Add a valid date and say what changed'); return; }
      const targets=selectedTreatmentTargets('change'); if(targets.length>6){ toast('Six target symptoms at most'); return; }
      med.changes=Array.isArray(med.changes)?med.changes:[]; med.changes.push(newTreatmentChange(d.value,label.value.trim(),targets));
      treatmentChangeTarget=null; save(true); refresh(); toast('Change recorded'); return;
    }
    case 'med-stop': treatmentStopTarget=el.dataset.id; treatmentChangeTarget=null; treatmentFollowUpTarget=null; medFormOpen=false; refresh(); revealForm('stop-date'); return;
    case 'med-stop-cancel': treatmentStopTarget=null; refresh(); return;
    case 'med-stop-save': {
      const med=DB.medications.find(item=>item.id===el.dataset.id), d=document.getElementById('stop-date'), reason=document.getElementById('stop-reason');
      if(!med||!d||!pastOrTodayISO(d.value)||(medicationCurrentStart(med)&&d.value<medicationCurrentStart(med))){ toast('Choose a valid last day on or after the latest start'); return; }
      med.ended=d.value; med.status='stopped'; med.stopReason=reason?reason.value.trim():''; med.archivedAt='';
      treatmentStopTarget=null; save(true); refresh(); toast('Stopped'); return;
    }
    case 'med-restart': {
      const med=DB.medications.find(item=>item.id===el.dataset.id); if(!med) return;
      if(!confirm('Restart '+med.name+' from today?')) return;
      if(med.ended){
        med.pauses=Array.isArray(med.pauses)?med.pauses:[];
        if(med.pauses.length>=MAX_MEDICATION_HISTORY){ toast('This treatment’s history is full. Save a backup and start a new entry.'); return; }
        med.pauses.push({stopped:med.ended,resumed:todayISO(),reason:med.stopReason||'',name:medicationDetailsOn(med,med.ended).name});
      }
      med.status='active'; med.ended=''; med.archivedAt=''; med.stopReason='';
      med.changes=Array.isArray(med.changes)?med.changes:[]; med.changes.push(newTreatmentChange(todayISO(),'Treatment restarted',[]));
      save(true); refresh(); toast('Active again'); return;
    }
    case 'med-archive': { const med=DB.medications.find(item=>item.id===el.dataset.id); if(!med) return; if(!confirm('Archive '+med.name+'? Its history stays in the dossier and the report.')) return; med.status='archived'; med.ended=med.ended||todayISO(); med.archivedAt=todayISO(); save(true); refresh(); return; }
    case 'med-unarchive': { const med=DB.medications.find(item=>item.id===el.dataset.id); if(!med) return; med.status='stopped'; med.archivedAt=''; med.ended=med.ended||todayISO(); save(true); refresh(); return; }
    case 'treatment-followup-open': {
      const target={medId:el.dataset.medId,changeIndex:+el.dataset.changeIndex,week:+el.dataset.week}, item=findTreatmentFollowUp(target);
      if(!item||item.followUp) return;
      if(item.dueDate>todayISO()){ toast('Not due yet'); return; }
      treatmentFollowUpTarget=target; treatmentChangeTarget=null; treatmentStopTarget=null; medFormOpen=false;
      if(!sheetStack.includes('treatments')) openSheet('treatments'); else refresh();
      revealForm('followup-benefit'); return;
    }
    case 'treatment-followup-cancel': treatmentFollowUpTarget=null; refresh(); return;
    case 'treatment-followup-save': {
      const target={medId:el.dataset.medId,changeIndex:+el.dataset.changeIndex,week:+el.dataset.week}, item=findTreatmentFollowUp(target);
      const benefit=document.getElementById('followup-benefit'), adherence=document.getElementById('followup-adherence'), sideEffectLevel=document.getElementById('followup-side-effect-level');
      const sideEffects=document.getElementById('followup-side-effects'), notes=document.getElementById('followup-notes');
      if(!item||item.followUp) return;
      if(!benefit||benefit.value===''||!adherence||!adherence.value||!sideEffectLevel||!sideEffectLevel.value){ toast('Choose benefit, doses taken and side effects'); return; }
      item.change.followUps=Array.isArray(item.change.followUps)?item.change.followUps.filter(record=>record&&record.week!==item.week):[];
      item.change.followUps.push({week:item.week,completed:todayISO(),benefit:+benefit.value,adherence:adherence.value,sideEffectLevel:sideEffectLevel.value,sideEffects:sideEffects?sideEffects.value.trim():'',notes:notes?notes.value.trim():'',outcome:treatmentWindowSnapshot(item.change.date,item.week*7-6,item.week*7,item.change.targets)});
      treatmentFollowUpTarget=null; save(true); refresh(); toast(item.week+'-week check-in saved'); return;
    }
    case 'med-remove': { const i=DB.medications.findIndex(item=>item.id===el.dataset.id); if(i<0) return; if(confirm('Permanently delete '+DB.medications[i].name+' and its history?')){ DB.medications.splice(i,1); save(true); refresh(); } return; }
    /* questions and plans */
    case 'appointment-question-add': appointmentQuestionEditId='new'; render(true); revealForm('appointment-question'); return;
    case 'appointment-question-edit': appointmentQuestionEditId=el.dataset.id; render(true); revealForm('appointment-question'); return;
    case 'appointment-question-cancel': appointmentQuestionEditId=null; render(true); return;
    case 'appointment-question-save': {
      const field=document.getElementById('appointment-question'), data=appointmentData();
      if(!field||!field.value.trim()){ toast('Write the question first'); field&&field.focus(); return; }
      const existing=el.dataset.id?data.questions.find(item=>item.id===el.dataset.id):null;
      if(existing) existing.text=field.value.trim();
      else { let id='question-'+Date.now().toString(36); while(data.questions.some(item=>item.id===id)) id+='x'; data.questions.push({id,text:field.value.trim(),created:todayISO(),asked:false,askedAt:''}); }
      appointmentQuestionEditId=null; save(true); render(true); return;
    }
    case 'appointment-question-toggle': { const item=appointmentData().questions.find(q=>q.id===el.dataset.id); if(!item) return; item.asked=!item.asked; item.askedAt=item.asked?todayISO():''; save(true); render(true); return; }
    case 'appointment-question-remove': { const data=appointmentData(), index=data.questions.findIndex(item=>item.id===el.dataset.id); if(index<0) return; data.questions.splice(index,1); if(appointmentQuestionEditId===el.dataset.id) appointmentQuestionEditId=null; save(true); render(true); return; }
    case 'after-visit-add': afterVisitPlanEditId='new'; render(true); revealForm('visit-date'); return;
    case 'after-visit-edit': afterVisitPlanEditId=el.dataset.id; render(true); revealForm('visit-date'); return;
    case 'after-visit-cancel': afterVisitPlanEditId=null; render(true); return;
    case 'after-visit-save': {
      const d=document.getElementById('visit-date'), summary=document.getElementById('visit-summary'), actionField=document.getElementById('visit-actions'), next=document.getElementById('visit-next'), data=appointmentData();
      if(!d||!pastOrTodayISO(d.value)){ toast('Choose a valid visit date'); return; }
      const summaryText=summary?summary.value.trim():'', lines=(actionField?actionField.value:'').split(/\r?\n/).map(value=>value.trim()).filter(Boolean).slice(0,30);
      const nextVisit=next&&next.value&&validISODate(next.value)?next.value:'';
      if(!summaryText&&!lines.length&&!nextVisit){ toast('Add a decision, a next step or a date'); return; }
      const existing=el.dataset.id?data.plans.find(item=>item.id===el.dataset.id):null;
      let id=existing?existing.id:'visit-'+Date.now().toString(36); while(!existing&&data.plans.some(item=>item.id===id)) id+='x';
      const prior=existing&&Array.isArray(existing.actions)?existing.actions:[];
      const actions=lines.map((text,index)=>{ const match=prior.find(item=>item.text===text); return match?{id:match.id,text,done:match.done===true}:{id:id+'-action-'+index+'-'+Date.now().toString(36),text,done:false}; });
      const plan={id,date:d.value,summary:summaryText,actions,nextVisit};
      if(existing) data.plans[data.plans.indexOf(existing)]=plan; else data.plans.push(plan);
      data.plans.sort((a,b)=>b.date.localeCompare(a.date));
      afterVisitPlanEditId=null; save(true); render(true); return;
    }
    case 'after-visit-action-toggle': { const plan=appointmentData().plans.find(item=>item.id===el.dataset.planId), action=plan&&plan.actions.find(item=>item.id===el.dataset.actionId); if(!action) return; action.done=!action.done; save(true); render(true); return; }
    case 'after-visit-remove': { const data=appointmentData(), index=data.plans.findIndex(item=>item.id===el.dataset.id); if(index<0) return; if(confirm('Remove this plan?')){ data.plans.splice(index,1); if(afterVisitPlanEditId===el.dataset.id) afterVisitPlanEditId=null; save(true); render(true); } return; }
    case 'lab-add': labFormOpen=true; render(true); revealForm('lab-name'); return;
    case 'lab-cancel': labFormOpen=false; render(true); return;
    case 'lab-save': {
      const name=document.getElementById('lab-name'), d=document.getElementById('lab-date'), value=document.getElementById('lab-value'), unit=document.getElementById('lab-unit');
      if(!name.value.trim()||!value.value.trim()||!pastOrTodayISO(d.value)){ toast('Enter a test, a date and a result'); return; }
      DB.labs.unshift({id:'lab-'+Date.now().toString(36),name:name.value.trim(),date:d.value,value:value.value.trim(),unit:unit.value.trim()});
      labFormOpen=false; save(true); render(true); return;
    }
    case 'lab-remove': { const i=+el.dataset.i; if(DB.labs[i]&&confirm('Remove '+DB.labs[i].name+'?')){ DB.labs.splice(i,1); save(true); refresh(); } return; }
    /* sheets */
    case 'sheet':
      if(el.dataset.s==='report'){ if(requestNativePro('appointment-report')) return; returnTab=curTab; setRoute('appointment-report'); render(); return; }
      openSheet(el.dataset.s); return;
    case 'close': closeSheet(); return;
    case 'bg': if(ev.target===el) closeSheet(); return;
    case 'go': { const g=el.dataset.v; if(g==='screening'||g==='redflags'||g.startsWith('learn:')||g.startsWith('tool:')) openSheet(g); return; }
    case 'stage-a': stageEditing=true; stageAns[el.dataset.k]=el.dataset.v; stageStep++; renderSheet(); return;
    case 'stage-back': { stageStep=Math.max(0,stageStep-1); const q=stageQueue(stageAns)[stageStep]; if(q) delete stageAns[q.id]; renderSheet(); return; }
    case 'stage-restart': resetStageDraft(); renderSheet(); return;
    case 'q-a': { const kind=el.dataset.k; if(qDrafts[kind]) qDrafts[kind][+el.dataset.i]=+el.dataset.v; renderSheet(); return; }
    case 'q-reset': if(qDrafts[el.dataset.k]) qDrafts[el.dataset.k]={}; renderSheet(); return;
    case 'q-save': {
      const kind=el.dataset.k, items=kind==='phq9'?PHQ9:GAD7, answers=qDrafts[kind];
      if(!answers||!items.every((_,i)=>answers[i]!=null)){ toast('Answer every question first'); return; }
      const score=items.reduce((total,_,i)=>total+answers[i],0);
      const band=kind==='phq9'?(score<5?'minimal':score<10?'mild':score<15?'moderate':score<20?'moderately severe':'severe'):(score<5?'minimal':score<10?'mild':score<15?'moderate':'severe');
      DB.scores.push({date:todayISO(),type:kind,score,band}); save(true); qDrafts[kind]={}; toast('Score saved'); renderSheet(); return;
    }
    case 'breath-start': breathStart(); return;
    case 'breath-stop': breathStop(); return;
    case 'pmr-start': pmrStart(); return;
    case 'pmr-stop': pmrStop(); return;
    case 'ride-start': rideStart(); return;
    case 'ride-stop': rideStop(); return;
    case 'trig-start': { const sel=document.getElementById('trig'); DB.trigger={active:true,status:'running',item:sel?sel.value:'Alcohol',start:todayISO()}; save(true); toast('Trigger test started'); renderSheet(); return; }
    case 'trig-stop': if(DB.trigger){ DB.trigger.active=false; DB.trigger.status='stopped'; DB.trigger.ended=todayISO(); } save(true); renderSheet(); return;
    case 'trig-reset': DB.trigger=null; save(true); renderSheet(); return;
    case 'export-encrypted-backup': {
      const password=document.getElementById('encrypted-backup-password'), confirmation=document.getElementById('encrypted-backup-confirm');
      if(!password||password.value.length<10){ toast('Use at least 10 characters'); password&&password.focus(); return; }
      if(!confirmation||confirmation.value!==password.value){ toast('The passwords do not match'); confirmation&&confirmation.focus(); return; }
      if(postNativeEvent('export-encrypted-backup',{state:JSON.stringify(DB),password:password.value,name:'peri-backup-'+todayISO()+'.menocompass'})){ password.value=''; confirmation.value=''; toast('Encrypting'); }
      return;
    }
    case 'import-encrypted-backup': { const password=document.getElementById('encrypted-restore-password'); if(!password||!password.value){ toast('Enter the backup password'); password&&password.focus(); return; } if(postNativeEvent('import-encrypted-backup',{password:password.value})){ password.value=''; toast('Choose the backup file'); } return; }
    case 'export-json': download('peri-backup-'+todayISO()+'.json',JSON.stringify(DB,null,2),'application/json'); return;
    case 'export-csv': download('peri-'+todayISO()+'.csv',toCSV(),'text/csv'); return;
    case 'copy-dump': { const ta=document.getElementById('dump'); if(ta){ ta.select(); try{ document.execCommand('copy'); toast('Copied'); }catch(x){ toast('Select and copy manually'); } } return; }
    case 'import-json': {
      const ta=document.getElementById('restore');
      if(!ta||!ta.value.trim()){ toast('Paste a backup first'); return; }
      if(ta.value.length>5000000){ toast('Larger than the 5 MB limit'); return; }
      try{ DB=validateBackup(JSON.parse(ta.value)); save(true); sheetStack=[]; renderSheet(); render(); toast('Restored and checked'); }
      catch(x){ toast('That is not a valid backup'); }
      return;
    }
    case 'print': {
      const name='peri-brief-'+todayISO()+'.pdf';
      if(postNativeEvent('share-report',{name,html:printableReportHtml()})){ toast('Preparing the brief'); return; }
      window.print(); return;
    }
  }
}

function setFieldError(el,message){
  el.setCustomValidity(message||'');
  if(message){ el.setAttribute('aria-invalid','true'); el.title=message; } else { el.removeAttribute('aria-invalid'); el.removeAttribute('title'); }
  return !message;
}
function readNumberInput(el){
  setFieldError(el,'');
  if(el.validity&&el.validity.badInput){ setFieldError(el,'Enter a number.'); return {ok:false,value:null}; }
  if(el.value==='') return {ok:true,value:null};
  const value=Number(el.value);
  if(!Number.isFinite(value)){ setFieldError(el,'Enter a finite number.'); return {ok:false,value:null}; }
  const min=el.min!==''?Number(el.min):null, max=el.max!==''?Number(el.max):null;
  if((min!=null&&value<min)||(max!=null&&value>max)){ const range=min!=null&&max!=null?' from '+min+' to '+max:min!=null?' of at least '+min:' no more than '+max; setFieldError(el,'Enter a value'+range+'.'); return {ok:false,value:null}; }
  return {ok:true,value};
}
function readDateInput(el){
  setFieldError(el,'');
  if(el.value==='') return {ok:true,value:null};
  if(!pastOrTodayISO(el.value)){ setFieldError(el,'Choose a valid date that is not in the future.'); return {ok:false,value:null}; }
  if(el.min&&el.value<el.min){ setFieldError(el,'Choose a date on or after '+el.min+'.'); return {ok:false,value:null}; }
  return {ok:true,value:el.value};
}
function handleInput(el){
  const a=el.dataset.act, date=actionDate(el);
  if(a==='index-search'){ indexQuery=el.value||''; renderIndexResults(); return; }
  if(a==='fr-age'){
    const parsed=readNumberInput(el); if(!parsed.ok) return;
    DB.profile.birthYear=parsed.value==null?null:new Date().getFullYear()-Math.round(parsed.value);
    save(); const finding=document.querySelector('.page-firstrun .finding'); if(finding){ const fresh=document.createElement('div'); fresh.innerHTML=viewFirstRun(); finding.outerHTML=fresh.querySelector('.finding').outerHTML; }
    return;
  }
  if(a==='fr-date'){ firstRun.date=validISODate(el.value)?el.value:''; return; }
  if(a==='moment-time'||a==='moment-note'||a==='moment-hours'){
    const patch=a==='moment-time'?{t:el.value}:a==='moment-note'?{n:el.value}:{v:el.value===''?null:+el.value};
    if(a==='moment-time'&&!/^\d\d:\d\d$/.test(el.value)) return;
    if(updateMoment(date,el.dataset.id,patch)) save();
    return;
  }
  if(a==='num'){
    const k=el.dataset.k, conv=el.dataset.conv;
    const parsed=el.type==='number'?readNumberInput(el):{ok:true,value:el.value.trim()||null};
    if(!parsed.ok) return;
    let v=parsed.value;
    const day=entry(date);
    if(v!=null&&k==='sleepH'&&day.inBedH!=null&&v>day.inBedH){ setFieldError(el,'Hours asleep cannot exceed hours in bed.'); return; }
    if(v!=null&&k==='inBedH'&&day.sleepH!=null&&day.sleepH>v){ setFieldError(el,'Hours in bed cannot be less than hours asleep.'); return; }
    if(v!=null&&conv==='w') v=U.wIn(v);
    if(v!=null&&conv==='l') v=U.lIn(v);
    setPath(day,k,v); commitDay(date); save(); return;
  }
  if(a==='prof'){
    const k=el.dataset.k, conv=el.dataset.conv;
    let parsed;
    if(el.type==='number') parsed=readNumberInput(el);
    else if(el.type==='date') parsed=readDateInput(el);
    else parsed={ok:true,value:k==='name'?safeText(el.value,80):el.value};
    if(!parsed.ok) return;
    let v=parsed.value;
    if(k==='birthYear'&&v!=null&&!Number.isInteger(v)){ setFieldError(el,'Enter a whole birth year.'); return; }
    if(el.tagName==='SELECT'&&!isNaN(v)&&k==='proteinGpk') v=+v;
    if(v!=null&&v!==''&&conv==='w') v=U.wIn(v);
    if(v!=null&&v!==''&&conv==='l') v=U.lIn(v);
    DB.profile[k]=(v===''?null:v);
    if(k==='periodStatus') DB.profile.periodStatus=safeEnum(v||'',PERIOD_STATUSES,'');
    refreshStageForProfile(k);
    save();
    if(k==='theme') applyTheme();
    if(k==='units'||k==='proteinGpk'||k==='uterus'||k==='ovaries'||k==='periodStatus') render(true);
    return;
  }
  if(a==='screen'){ const parsed=readDateInput(el); if(!parsed.ok) return; const rec=DB.screening[el.dataset.k]||{}; rec.last=parsed.value; DB.screening[el.dataset.k]=rec; save(); return; }
  if(a==='screen-int'){
    const id=el.dataset.k, rule=SCREENING_RULES[id], years=+el.value, age=DB.profile.birthYear?new Date().getFullYear()-DB.profile.birthYear:null;
    if(!rule||!screeningIntervals(rule,age).includes(years)) return;
    const rec=DB.screening[id]||{}; rec.intervalYears=years; DB.screening[id]=rec; save(); return;
  }
  if(a==='prot-calc'){ const w=document.getElementById('ptw'), g=document.getElementById('ptg'); const parsed=readNumberInput(w); const kg=parsed.ok&&parsed.value!=null?U.wIn(parsed.value):null; document.getElementById('prot-out').innerHTML=proteinOut(kg,+g.value); return; }
  if(a==='sw-calc'){
    const ds=rangeDates(14), sleeps=ds.map(d=>{const x=confirmedRecord(d);return x&&x.sleepH!=null?x.sleepH:null;}).filter(v=>v!=null);
    const aSleep=avg(sleeps), win=aSleep!=null&&aSleep>0?Math.max(5,Math.round(aSleep*4)/4):null;
    document.getElementById('sw-out').innerHTML=swOut(el.value,win); return;
  }
}

/* ---------- export ---------- */
function csvText(value){
  let text=String(value==null?'':value);
  if(/^[=+\-@\t\r]/.test(text)) text="'"+text;
  return '"'+text.replace(/"/g,'""')+'"';
}
function toCSV(){
  const cols=['date','day_rating_0_4','hot_flashes','night_sweats_0_4','night_wakes','hours_in_bed','hours_asleep','sleep_efficiency_pct',
    ...SYMS.map(s=>s.k),'burden_score_0_44_unvalidated','weight_kg','waist_cm','bleeding','strength_session','balance','pelvic_floor',
    'aerobic_min','protein_target_met','calcium_2plus','fibre_ok','alcohol_drinks','caffeine_cups','ledger_entries','notes'];
  const rows=[cols.join(',')];
  entryDates().forEach(d=>{
    const e=confirmedRecord(d), s=e.sym||{}, ac=e.act||{}, nu=e.nut||{};
    const eff=(e.sleepH!=null&&e.inBedH!=null&&e.inBedH>0)?Math.round(e.sleepH/e.inBedH*100):'';
    rows.push([d,e.rating??'',e.hf??'',e.ns??'',e.wakes??'',e.inBedH??'',e.sleepH??'',eff,...SYMS.map(x=>s[x.k]??''),burden(e)??'',
      e.wt!=null?r1(e.wt):'',e.waist!=null?r1(e.waist):'',e.bleed||'',ac.res?1:'',ac.bal?1:'',ac.pf?1:'',ac.aero??'',
      nu.prot==null?'':(nu.prot?1:0),nu.cal?1:'',nu.fib?1:'',nu.alc??'',nu.caf??'',(e.moments||[]).length,csvText(e.notes||'')].join(','));
  });
  const moments=entryDates().flatMap(d=>(confirmedRecord(d).moments||[]).map(m=>[d,m.t,m.k,m.s??'',m.d??'',m.v??'',csvText(m.n||'')].join(',')));
  if(moments.length){ rows.push(''); rows.push('ledger_date,time,kind,severity_1_3,duration_s,hours,note'); rows.push(...moments); }
  if(DB.scores.length){ rows.push(''); rows.push('questionnaire_date,type,score,band'); DB.scores.forEach(s=>rows.push([s.date,s.type,s.score,s.band||''].join(','))); }
  return rows.join('\n');
}
function download(name,text,mime){
  if(postNativeEvent('share-file',{name,contents:text,mime})){ toast('Preparing '+name); return; }
  try{
    const blob=new Blob([text],{type:mime}), url=URL.createObjectURL(blob), a=document.createElement('a');
    a.href=url; a.download=name; document.body.appendChild(a); a.click();
    setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); },500);
    toast('Downloaded '+name);
  }catch(x){ toast('Download blocked; use the copy box instead'); }
}
function printableReportHtml(){
  const clone=document.documentElement.cloneNode(true);
  clone.querySelectorAll('script').forEach(node=>node.remove());
  clone.querySelector('title').textContent='peri brief';
  return '<!doctype html>'+clone.outerHTML;
}

/* ---------- boot ---------- */
function boot(){
  load();
  window.addEventListener('menocompass-native-privacy-result',handleNativePrivacyResult);
  window.addEventListener('menocompass-native-backup-import',handleNativeBackupImport);
  window.addEventListener('menocompass-native-share-result',handleNativeShareResult);
  window.addEventListener('menocompass-healthkit-result',handleHealthKitResult);
  window.addEventListener('menocompass-native-navigation-request',()=>{ lastNativeNavigationState=''; syncNativeNavigationState(); });
  if(window.__MENO_NATIVE__===true) save(true);
  document.body.insertAdjacentHTML('afterbegin','<main id="app"></main><div id="sheet-host"></div>');
  document.addEventListener('click',ev=>{
    const externalLink=ev.target.closest('a[href]');
    if(externalLink&&window.__MENO_NATIVE__===true&&window.ReactNativeWebView&&/^https?:\/\//i.test(externalLink.href)){
      ev.preventDefault(); window.ReactNativeWebView.postMessage(JSON.stringify({type:'open-external-link',url:externalLink.href})); return;
    }
    const el=ev.target.closest('[data-act]');
    if(!el) return;
    if(el.dataset.act==='bg'){ if(ev.target===el){ ev.preventDefault(); closeSheet(); } return; }
    if(el.tagName!=='BUTTON'&&el.tagName!=='A') return;
    ev.preventDefault();
    handleAction(el,ev);
  });
  document.addEventListener('submit',ev=>{
    const form=ev.target.closest('form[data-act="dictate-form"]'); if(!form) return;
    ev.preventDefault();
    const input=form.querySelector('input'); if(input&&input.value.trim()) fileUtterance(input.value.trim());
  });
  document.addEventListener('input',ev=>{ const el=ev.target.closest('[data-act]'); if(el&&(el.tagName==='INPUT'||el.tagName==='TEXTAREA')) handleInput(el); });
  document.addEventListener('change',ev=>{
    const el=ev.target.closest('[data-act]'); if(!el) return;
    if(el.tagName==='SELECT'||el.type==='date'||el.type==='time') handleInput(el);
  });
  document.addEventListener('keydown',keepFocusInSheet);
  if(window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change',applyTheme);
  window.addEventListener('menocompass-prepare-update',ev=>{
    const focused=document.activeElement;
    const safe=DB.profile.onboarded===true&&sheetStack.length===0&&['today','dossier','index'].includes(curTab)&&!(focused&&focused.matches('input,textarea,select,[contenteditable="true"]'));
    if(safe) flush();
    postNativeEvent('ota-restart-state',{id:ev.detail?.id,safe,...(safe?{state:JSON.stringify(DB)}:{})});
  });
  window.addEventListener('beforeunload', flush);
  window.addEventListener('pagehide',flush);
  document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='hidden') flush(); else if(DB.profile.onboarded&&curTab==='today'&&!sheetStack.length) render(true); });
  window.addEventListener('storage',ev=>{
    if(ev.key!==Store.key||dirty) return;
    try{ DB=ev.newValue?migrate(JSON.parse(ev.newValue)):blankDB(); render(true); if(sheetStack.length) renderSheet(); toast(ev.newValue?'Updated from another tab':'Cleared in another tab'); }
    catch(e){ /* Ignore malformed writes from another script on the origin. */ }
  });
  const applyHash=(initial)=>{
    const raw=(location.hash||'').replace('#',''), route=normalizeRoute(raw);
    if(raw==='redflags'){ if(!sheetStack.includes('redflags')) openSheet('redflags'); return; }
    if(VALID_ROUTES.includes(route)){ curTab=route; if(route==='today') nightDeskDismissed=nightDeskDismissed||raw==='checkin'; if(!initial){ sheetStack=[]; renderSheet(); render(); } }
    if(raw==='checkin'&&DB.profile.onboarded){ if(initial) render(); openSheet('log'); }
    if(raw==='care'&&DB.profile.onboarded&&!nativeProLocked('dossier')){ if(initial) render(); openSheet('treatments'); }
  };
  const rawHash=(location.hash||'').replace('#',''), hash=normalizeRoute(rawHash);
  if(VALID_ROUTES.includes(hash)) curTab=hash;
  render();
  if(window.__MENO_NATIVE__===true) setTimeout(()=>{ requestAnimationFrame(()=>postNativeEvent('webview-ready')); postNativeEvent('get-native-privacy-status'); postNativeEvent('healthkit-status'); },0);
  if(rawHash==='redflags'||rawHash==='checkin'||rawHash==='care') applyHash(true);
  window.addEventListener('hashchange',()=>applyHash(false));
  window.addEventListener('popstate',()=>{ const route=normalizeRoute((location.hash||'#today').replace('#','')); if(VALID_ROUTES.includes(route)&&route!==curTab){ curTab=route; sheetStack=[]; renderSheet(); render(); } });
  if('serviceWorker' in navigator && location.protocol.startsWith('http')){
    navigator.serviceWorker.register('sw.js').catch(()=>{});
  }
}
document.addEventListener('DOMContentLoaded', boot);
