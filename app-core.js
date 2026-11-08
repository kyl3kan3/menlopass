/* ============================================================
   Core: storage, state, helpers, charts, insights
   ============================================================ */

/* ---------- storage with graceful fallback ---------- */
const Store = (() => {
  const KEY = 'menocompass.v1';
  let mem = null, usingMemory = false;
  function nativeBridge(){
    return window.__MENO_NATIVE__===true && !!(window.ReactNativeWebView&&window.ReactNativeWebView.postMessage);
  }
  function postNative(serialized){
    if(!nativeBridge()) return false;
    try{
      window.ReactNativeWebView.postMessage(JSON.stringify({type:'persist-state',state:serialized}));
      return true;
    }catch(e){ return false; }
  }
  function injectedState(){
    try{
      const serialized=window.__MENO_PERSISTED_STATE__;
      if(typeof serialized!=='string'||!serialized) return null;
      window.__MENO_PERSISTED_STATE__='';
      return JSON.parse(serialized);
    }catch(e){ return null; }
  }
  function probe(){
    try{
      const t='__mc_t__'; localStorage.setItem(t,'1'); localStorage.removeItem(t); return true;
    }catch(e){ return false; }
  }
  const ok = probe();
  if(!ok) usingMemory = true;
  return {
    get key(){ return KEY; },
    get ephemeral(){ return usingMemory&&!nativeBridge(); },
    read(){
      const injected=injectedState();
      if(injected){
        mem=injected;
        if(nativeBridge()) try{ localStorage.removeItem(KEY); }catch(e){}
        return injected;
      }
      if(nativeBridge()){
        try{ localStorage.removeItem(KEY); }catch(e){}
        return mem;
      }
      if(usingMemory) return mem;
      try{ const s = localStorage.getItem(KEY); return s ? JSON.parse(s) : null; }
      catch(e){ usingMemory = true; return mem; }
    },
    write(obj){
      let serialized;
      try{ serialized=JSON.stringify(obj); }
      catch(e){ return false; }
      const nativeSaved=postNative(serialized);
      if(nativeBridge()){
        mem=obj;
        try{ localStorage.removeItem(KEY); }catch(e){}
        return nativeSaved;
      }
      if(usingMemory){ mem = obj; return nativeSaved; }
      try{ localStorage.setItem(KEY, serialized); return true; }
      catch(e){ usingMemory = true; mem = obj; return nativeSaved; }
    },
    clear(){ mem=null; try{ localStorage.removeItem(KEY); }catch(e){} }
  };
})();

function postNativeEvent(type, attributes){
  if(window.__MENO_NATIVE__!==true || !window.ReactNativeWebView) return false;
  try{
    const message=Object.assign({type},attributes&&typeof attributes==='object'?attributes:{});
    window.ReactNativeWebView.postMessage(JSON.stringify(message));
    return true;
  }catch(e){ return false; }
}

/* ---------- defaults & schema ---------- */
const SCHEMA_V = 9;
const PROFILE_INTENTS = ['understand','treatment','appointment','record'];
const ONBOARDING_FEELINGS = {calm:'Calm',hopeful:'Hopeful',mixed:'Up and down',overwhelmed:'Overwhelmed',low:'Low',unsure:'Not sure'};
const PINNABLE_SYMPTOMS = ['hf','ns','sleepq','mood','anx','fog','joint','dry','uri','energy','head','palp','itch','libido','bloating','dizzy','irritable','overwhelmed'];
const DEFAULT_PINNED_SYMPTOMS = ['hf','ns','fog','energy','joint','anx'];
const PERIOD_STATUSES = ['regular','changing','gaps','stopped','na'];
const PERIOD_SINCE = ['lt2','2to6','gt6'];
/* The ledger vocabulary. Symptom kinds share keys with PINNABLE_SYMPTOMS so a
   moment rolls up into the same day fields the insights engine already reads.
   `woke`, `slept`, `bleed`, `med`, `breath` and `note` are ledger-only kinds. */
const MOMENT_KINDS = {
  hf:{n:'Hot flash',sym:false}, ns:{n:'Night sweat',sym:false}, woke:{n:'Woke',sym:false},
  fog:{n:'Brain fog'}, mood:{n:'Low mood'}, anx:{n:'Anxiety'}, joint:{n:'Pain'}, head:{n:'Headache'},
  palp:{n:'Palpitations'}, dizzy:{n:'Dizziness'}, bloating:{n:'Bloating'}, dry:{n:'Dryness'}, uri:{n:'Bladder'},
  energy:{n:'Fatigue'}, itch:{n:'Itch'}, libido:{n:'Low libido'}, irritable:{n:'Irritable'}, overwhelmed:{n:'Overwhelmed'},
  sleepq:{n:'Slept badly'},
  bleed:{n:'Bleeding',sym:false}, slept:{n:'Slept',sym:false}, med:{n:'Medication',sym:false}, breath:{n:'Breathed',sym:false}, note:{n:'Note',sym:false}
};
const MOMENT_SEVERITY = ['','Mild','Moderate','Strong'];
const MAX_MOMENTS_PER_DAY = 80;
function blankDB(){
  return {
    v: SCHEMA_V,
    profile:{
      name:'', birthYear:null, region:'us', units:'imperial',
      lastPeriod:'', uterus:'unknown', ovaries:'unknown', surgeryDate:'', bone:'unknown',
      proteinGpk:1.2, weightGoal:null, waistGoal:null,
      theme:'light', stage:null, stageAnswers:null, onboarded:false,
      onboardingVersion:4, onboardingStep:0, onboardingDeferred:false, firstCheckinPending:false, intent:'', onboardingFeeling:'',
      pinnedSymptoms:[], periodStatus:'', periodSince:''
    },
    entries:{}, medications:[], labs:[], screening:{}, scores:[], trigger:null,
    appointments:{questions:[],plans:[],brief:{concerns:[],goal:'',date:''},evidence:[]}, support:[], healthKit:null,
    findings:{},
    meta:{created:todayISO(), lastOpen:todayISO()}
  };
}
let DB = null;

function load(){
  const raw = Store.read();
  try{ DB = raw && typeof raw==='object' ? migrate(raw) : blankDB(); }
  catch(e){ DB = blankDB(); }
  DB.meta = DB.meta || {}; DB.meta.lastOpen = todayISO();
}
function migrate(d){
  if(!plainRecord(d)) throw new Error('Invalid backup root');
  if(!Number.isInteger(d.v) || d.v<1 || d.v>SCHEMA_V) throw new Error('Unsupported schema version');
  const out=blankDB(), rawProfile=plainRecord(d.profile)?d.profile:{};
  const p=out.profile;

  p.name=safeText(rawProfile.name,80);
  p.birthYear=safeInteger(rawProfile.birthYear,1920,new Date().getFullYear()-18);
  p.region=safeEnum(rawProfile.region,['us','uk','other'],'us');
  p.units=safeEnum(rawProfile.units,['imperial','metric'],'imperial');
  p.lastPeriod=safePastDate(rawProfile.lastPeriod);
  p.surgeryDate=safePastDate(rawProfile.surgeryDate);
  const birthDate=p.birthYear?p.birthYear+'-01-01':'';
  if(birthDate && p.lastPeriod && p.lastPeriod<birthDate) p.lastPeriod='';
  if(birthDate && p.surgeryDate && p.surgeryDate<birthDate) p.surgeryDate='';
  p.uterus=safeEnum(rawProfile.uterus,['unknown','intact','hyst','ablation'],'unknown');
  p.ovaries=safeEnum(rawProfile.ovaries,['unknown','kept','one','both'],'unknown');
  /* Earlier records stored uterus and ovaries in one field. Split only when
     no explicit ovary value exists, then continue through the strict schema. */
  const legacy={
    intact:{uterus:'intact',ovaries:'kept'}, hyst:{uterus:'hyst',ovaries:'unknown'},
    oophor:{uterus:'intact',ovaries:'both'}, both:{uterus:'hyst',ovaries:'both'}
  }[rawProfile.uterus];
  if(legacy && rawProfile.ovaries==null){ p.uterus=legacy.uterus; p.ovaries=legacy.ovaries; }
  p.bone=safeEnum(rawProfile.bone,['unknown','normal','osteopenia','osteoporosis','fracture'],'unknown');
  p.proteinGpk=safeEnum(+rawProfile.proteinGpk,[1,1.2,1.4,1.6],1.2);
  p.weightGoal=safeNumber(rawProfile.weightGoal,20,500);
  p.waistGoal=safeNumber(rawProfile.waistGoal,30,300);
  p.theme=safeEnum(rawProfile.theme,['auto','light','dark'],'auto');
  p.onboarded=rawProfile.onboarded===true;
  p.onboardingVersion=safeEnum(rawProfile.onboardingVersion,[1,2,3,4],1);
  // Native experiment v3 has twelve steps; keep its progress intact through
  // load, backup restore, and the WebView's canonical persistence handshake.
  // v4 is the first-run letter: one screen, so its step is always 0.
  p.onboardingStep=p.onboardingVersion===4?0:(safeInteger(rawProfile.onboardingStep,0,p.onboardingVersion===3?11:3)||0);
  p.periodStatus=safeEnum(rawProfile.periodStatus,PERIOD_STATUSES,'');
  p.periodSince=safeEnum(rawProfile.periodSince,PERIOD_SINCE,'');
  p.onboardingDeferred=rawProfile.onboardingDeferred===true;
  p.firstCheckinPending=rawProfile.firstCheckinPending===true;
  p.intent=safeEnum(rawProfile.intent,PROFILE_INTENTS,'');
  p.onboardingFeeling=safeEnum(rawProfile.onboardingFeeling,Object.keys(ONBOARDING_FEELINGS),'');
  const pinned=Array.isArray(rawProfile.pinnedSymptoms)
    ? [...new Set(rawProfile.pinnedSymptoms.filter(k=>PINNABLE_SYMPTOMS.includes(k)))].slice(0,6)
    : [];
  p.pinnedSymptoms=pinned.length?pinned:(p.onboarded?[...DEFAULT_PINNED_SYMPTOMS]:[]);
  const stageAnswers=safeStageAnswers(rawProfile.stageAnswers);
  if(stageAnswers && typeof completeStageAnswers==='function' && completeStageAnswers(stageAnswers)
      && typeof stageResult==='function'){
    p.stageAnswers=stageAnswers;
    p.stage=safeText(stageResult(stageAnswers).label,160)||null;
  }

  if(plainRecord(d.entries)){
    Object.keys(d.entries).filter(date=>pastOrTodayISO(date)&&(!birthDate||date>=birthDate)).sort().slice(-10000).forEach(date=>{
      const clean=safeEntry(d.entries[date], d.v<5);
      if(clean) out.entries[date]=clean;
    });
  }
  if(plainRecord(d.screening)){
    const ids=typeof SCREENING!=='undefined' ? SCREENING.map(item=>item.id) : Object.keys(SCREENING_RULES);
    ids.forEach(id=>{
      const rec=d.screening[id]; if(!plainRecord(rec)) return;
      const last=safePastDate(rec.last), requested=+rec.intervalYears;
      const rule=SCREENING_RULES[id], cleaned={};
      if(last && (!birthDate||last>=birthDate)) cleaned.last=last;
      if(rule) cleaned.intervalYears=rule.years.includes(requested)?requested:rule.defaultYears;
      if(Object.keys(cleaned).length) out.screening[id]=cleaned;
    });
  }
  if(Array.isArray(d.scores)){
    out.scores=d.scores.map(safeScore).filter(score=>score&&(!birthDate||score.date>=birthDate))
      .sort((a,b)=>a.date.localeCompare(b.date)).slice(-500);
  }
  if(Array.isArray(d.medications)){
    d.medications.slice(0,50).forEach(raw=>{
      const base=safeMedication(raw); if(!base) return;
      let startedFallback='';
      if(d.v<5 && !base.started){
        startedFallback=Object.keys(out.entries).sort().find(date=>{
          const rec=out.entries[date]&&out.entries[date].med&&out.entries[date].med[base.id];
          return rec&&rec.taken===true;
        })||'';
        /* A legacy top-level `taken` flag means the medication was used today.
           Without that or dated adherence, inventing a start date would make
           the treatment timeline look more precise than the source record. */
        if(!startedFallback && plainRecord(raw) && raw.taken===true) startedFallback=todayISO();
      }
      const med=safeMedication(raw,startedFallback); if(!med) return;
      out.medications.push(med);
      if(raw.taken!==true) return;
      const day=out.entries[todayISO()]||(out.entries[todayISO()]={sym:{},act:{},nut:{},confirmed:false,draftDirty:false});
      day.med=day.med||{}; day.med[med.id]={taken:true,at:safeText(raw.takenAt,20)};
    });
  }
  if(Array.isArray(d.labs)){
    out.labs=d.labs.map(safeLab).filter(Boolean).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,200);
  }
  out.appointments=safeAppointments(d.appointments);
  out.support=Array.isArray(d.support)?d.support.slice(-200).filter(item=>plainRecord(item)&&safePastDate(item.date)&&['sleep','overwhelmed','hot','fog'].includes(item.kind)&&['yes','no','unsure'].includes(item.helped)).map(item=>({date:item.date,kind:item.kind,helped:item.helped})):[];
  out.healthKit=safeHealthKitSummary(d.healthKit);
  out.trigger=safeTrigger(d.trigger);
  if(out.trigger && birthDate && out.trigger.start<birthDate) out.trigger=null;
  if(plainRecord(d.findings)){
    Object.keys(d.findings).filter(id=>/^[a-z0-9-]{1,60}$/.test(id)).slice(0,200).forEach(id=>{
      const seen=safePastDate(d.findings[id]); if(seen) out.findings[id]=seen;
    });
  }
  const meta=plainRecord(d.meta)?d.meta:{};
  out.meta.created=safePastDate(meta.created)||todayISO();
  out.meta.lastOpen=todayISO();
  return out;
}

function plainRecord(v){ return !!v && typeof v==='object' && !Array.isArray(v); }
function safeText(v,max){ return typeof v==='string' ? v.slice(0,max) : ''; }
function safeEnum(v,values,fallback){ return values.includes(v)?v:fallback; }
function safeNumber(v,min,max){
  if(v===null || v==='' || typeof v==='boolean') return null;
  const n=Number(v); return Number.isFinite(n)&&n>=min&&n<=max?n:null;
}
function safeInteger(v,min,max){
  const n=safeNumber(v,min,max); return n!=null&&Number.isInteger(n)?n:null;
}
function safePastDate(v){ return typeof v==='string'&&pastOrTodayISO(v)?v:''; }
function safeStageAnswers(raw){
  if(!plainRecord(raw) || typeof STAGE_Q==='undefined') return null;
  const out={};
  STAGE_Q.forEach(q=>{
    const value=raw[q.id];
    if(q.a.some(a=>a.v===value)) out[q.id]=value;
  });
  return Object.keys(out).length?out:null;
}
function safeEntryPayload(raw){
  if(!plainRecord(raw)) return null;
  const out={sym:{},act:{},nut:{}};
  const integer=(k,min,max)=>{ const n=safeInteger(raw[k],min,max); if(n!=null) out[k]=n; };
  const number=(k,min,max)=>{ const n=safeNumber(raw[k],min,max); if(n!=null) out[k]=n; };
  integer('hf',0,500); integer('ns',0,4); number('inBedH',0,16); number('sleepH',0,16);
  if(out.sleepH!=null&&out.inBedH!=null&&out.sleepH>out.inBedH) delete out.sleepH;
  if(plainRecord(raw.sym)){
    PINNABLE_SYMPTOMS.filter(k=>k!=='hf'&&k!=='ns').forEach(k=>{
      const n=safeInteger(raw.sym[k],0,4); if(n!=null) out.sym[k]=n;
    });
  }
  number('wt',20,500); number('waist',30,300);
  const bleed=safeEnum(raw.bleed,['none','spotting','light','moderate','heavy'],null);
  if(bleed) out.bleed=bleed;
  if(plainRecord(raw.act)){
    ['res','bal','pf'].forEach(k=>{ if(typeof raw.act[k]==='boolean') out.act[k]=raw.act[k]; });
    const aero=safeInteger(raw.act.aero,0,1440); if(aero!=null) out.act.aero=aero;
  }
  if(plainRecord(raw.nut)){
    if(raw.nut.prot===true||raw.nut.prot===1) out.nut.prot=true;
    if(raw.nut.prot===false||raw.nut.prot===0) out.nut.prot=false;
    ['cal','fib'].forEach(k=>{ if(typeof raw.nut[k]==='boolean') out.nut[k]=raw.nut[k]; });
    ['alc','caf'].forEach(k=>{ const n=safeInteger(raw.nut[k],0,50); if(n!=null) out.nut[k]=n; });
  }
  const notes=safeText(raw.notes,4000); if(notes) out.notes=notes;
  integer('rating',0,4); integer('wakes',0,30);
  if(Array.isArray(raw.moments)){
    const moments=raw.moments.slice(0,MAX_MOMENTS_PER_DAY).map(safeMoment).filter(Boolean).sort((a,b)=>a.t.localeCompare(b.t));
    if(moments.length) out.moments=moments;
  }
  return out;
}
function safeMoment(raw){
  if(!plainRecord(raw)) return null;
  const t=typeof raw.t==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(raw.t)?raw.t:'';
  if(!t||!MOMENT_KINDS[raw.k]) return null;
  const out={t,k:raw.k};
  const s=safeInteger(raw.s,1,3); if(s!=null) out.s=s;
  const n=safeText(raw.n,280).trim(); if(n) out.n=n;
  const v=safeNumber(raw.v,0,16); if(v!=null&&raw.k==='slept') out.v=v;
  const d=safeInteger(raw.d,1,3600); if(d!=null) out.d=d;
  const id=safeText(raw.id,40); if(/^[A-Za-z0-9_-]{1,40}$/.test(id)) out.id=id;
  return out;
}
function safeEntry(raw,legacyConfirmed){
  const out=safeEntryPayload(raw);
  if(!out) return null;
  const prefilled=safePastDate(raw.prefilledFrom); if(prefilled) out.prefilledFrom=prefilled;
  if(plainRecord(raw.med)){
    out.med={};
    Object.keys(raw.med).slice(0,50).forEach(id=>{
      if(!/^[A-Za-z0-9_-]{1,40}$/.test(id) || !plainRecord(raw.med[id])) return;
      const rec=raw.med[id], taken=rec.taken===true, at=safeText(rec.at,20);
      if(taken) out.med[id]={taken:true,at};
    });
    if(!Object.keys(out.med).length) delete out.med;
  }
  let snapshot=safeEntryPayload(raw.confirmedData);
  if(!hasEntryContent(snapshot)) snapshot=null;
  /* v1-v4 had no explicit completion state. Preserve meaningful historical
     logs as an atomic snapshot while keeping medication-only records out of
     health trends. `raw.confirmed` supports early schema-v5 drafts that used
     the boolean before confirmed snapshots were introduced. */
  if(!snapshot&&(legacyConfirmed===true||raw.confirmed===true)&&hasEntryContent(out)){
    snapshot=safeEntryPayload(out);
  }
  if(snapshot) out.confirmedData=snapshot;
  out.confirmed=!!snapshot;
  out.draftDirty=!!snapshot&&raw.draftDirty===true;
  return out;
}
function safeTreatmentTargets(raw){
  if(!Array.isArray(raw)) return [];
  return [...new Set(raw.filter(key=>PINNABLE_SYMPTOMS.includes(key)))].slice(0,6);
}
function safeTreatmentWindow(raw,targets,expectedStart,expectedEnd){
  if(!plainRecord(raw)) return null;
  const windowStart=safePastDate(raw.windowStart), windowEnd=safePastDate(raw.windowEnd);
  if(!windowStart||!windowEnd||windowStart!==expectedStart||windowEnd!==expectedEnd) return null;
  const values={};
  if(plainRecord(raw.values)) targets.forEach(key=>{
    const rec=raw.values[key]; if(!plainRecord(rec)) return;
    const average=safeNumber(rec.average,0,key==='hf'?500:4), n=safeInteger(rec.n,1,7);
    if(average!=null&&n!=null) values[key]={average,n};
  });
  return {windowStart,windowEnd,values};
}
function safeTreatmentBaseline(raw,targets,changeDate){
  return safeTreatmentWindow(raw,targets,addDays(changeDate,-7),addDays(changeDate,-1));
}
function safeTreatmentFollowUp(raw,changeDate,targets){
  if(!plainRecord(raw)) return null;
  const week=safeEnum(+raw.week,[2,6],null), completed=safePastDate(raw.completed);
  const benefit=safeInteger(raw.benefit,0,4);
  const adherence=safeEnum(raw.adherence,['all','most','some','few','none'],null);
  const sideEffectLevel=safeEnum(raw.sideEffectLevel,['none','mild','moderate','severe'],null);
  if(!week||!completed||completed<addDays(changeDate,week*7)||benefit==null||!adherence||!sideEffectLevel) return null;
  const outcome=safeTreatmentWindow(raw.outcome,targets,addDays(changeDate,week*7-6),addDays(changeDate,week*7));
  return {
    week,completed,benefit,adherence,sideEffectLevel,
    sideEffects:safeText(raw.sideEffects,500).trim(),
    notes:safeText(raw.notes,500).trim(),outcome
  };
}
const MAX_MEDICATION_HISTORY = 1000;
function safeMedicationDetails(raw){
  if(!plainRecord(raw)) return null;
  const name=safeText(raw.name,80).trim();
  if(!name) return null;
  const days=Array.isArray(raw.days)?[...new Set(raw.days.map(Number).filter(n=>Number.isInteger(n)&&n>=0&&n<=6))].sort():[];
  return {
    name,
    form:safeEnum(raw.form,['patch','tablet','capsule','gel','spray','cream','injection','other'],raw.icon==='patch'?'patch':'tablet'),
    days:days.length?days:[0,1,2,3,4,5,6],
    due:safeText(raw.due,20),
    notes:safeText(raw.notes||raw.detail,120)
  };
}
function safeMedication(raw,startedFallback){
  if(!plainRecord(raw)) return null;
  const name=safeText(raw.name,80).trim();
  if(!name) return null;
  const rawId=safeText(raw.id,40), id=/^[A-Za-z0-9_-]{1,40}$/.test(rawId)?rawId:'med-'+name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,30);
  const days=Array.isArray(raw.days)?[...new Set(raw.days.map(Number).filter(n=>Number.isInteger(n)&&n>=0&&n<=6))].sort():[];
  const started=safePastDate(raw.started)||safePastDate(startedFallback);
  let ended=safePastDate(raw.ended);
  if(started&&ended&&ended<started) ended='';
  const changes=(Array.isArray(raw.changes)?raw.changes:[]).map(change=>{
    if(!plainRecord(change)) return null;
    const date=safePastDate(change.date), label=safeText(change.label,120).trim();
    if(!date||!label) return null;
    const targets=safeTreatmentTargets(change.targets);
    const baseline=safeTreatmentBaseline(change.baseline,targets,date);
    const followUps=[];
    [2,6].forEach(week=>{
      const candidates=(Array.isArray(change.followUps)?change.followUps:[])
        .map(item=>safeTreatmentFollowUp(item,date,targets)).filter(item=>item&&item.week===week);
      if(candidates.length) followUps.push(candidates[candidates.length-1]);
    });
    return {date,label,targets,baseline,followUps};
  }).filter(Boolean).sort((a,b)=>a.date.localeCompare(b.date)).slice(-100);
  const archivedAt=safePastDate(raw.archivedAt);
  const requestedStatus=safeEnum(raw.status,['active','stopped','archived'],archivedAt||raw.archived===true?'archived':ended?'stopped':'active');
  /* A stop date is authoritative. Do not let a malformed or older backup
     reactivate a treatment simply by pairing `status: active` with `ended`. */
  const status=requestedStatus==='archived'?'archived':ended?'stopped':'active';
  // Additive v8 history: older backups have no pauses or detail revisions.
  // A pause excludes only days after the last dose and before the restart.
  const pauses=[];
  (Array.isArray(raw.pauses)?raw.pauses:[]).slice(-MAX_MEDICATION_HISTORY).forEach(item=>{
    if(!plainRecord(item)) return;
    const stopped=safePastDate(item.stopped), resumed=safePastDate(item.resumed);
    if(!stopped||!resumed||resumed<stopped||(started&&stopped<started)||(ended&&resumed>ended)) return;
    pauses.push({stopped,resumed,reason:safeText(item.reason,500).trim(),name:safeText(item.name,80).trim()||name});
  });
  pauses.sort((a,b)=>a.stopped.localeCompare(b.stopped)||a.resumed.localeCompare(b.resumed));
  const orderedPauses=[];
  pauses.forEach(item=>{
    const previous=orderedPauses[orderedPauses.length-1];
    if(!previous||item.stopped>=previous.resumed) orderedPauses.push(item);
  });
  const revisions=(Array.isArray(raw.revisions)?raw.revisions:[]).slice(-MAX_MEDICATION_HISTORY).map(item=>{
    if(!plainRecord(item)) return null;
    const date=safePastDate(item.date), before=safeMedicationDetails(item.before), after=safeMedicationDetails(item.after);
    return date&&before&&after?{date,before,after}:null;
  }).filter(Boolean).sort((a,b)=>a.date.localeCompare(b.date));
  return {
    id,
    name,
    form:safeEnum(raw.form,['patch','tablet','capsule','gel','spray','cream','injection','other'],raw.icon==='patch'?'patch':'tablet'),
    days:days.length?days:[0,1,2,3,4,5,6],
    due:safeText(raw.due,20),
    notes:safeText(raw.notes||raw.detail,120),
    started,
    ended,
    status,
    stopReason:safeText(raw.stopReason,500).trim(),
    archivedAt:status==='archived'?archivedAt:'',
    changes,
    pauses:orderedPauses,
    revisions
  };
}
function safeLab(raw){
  if(!plainRecord(raw)) return null;
  const name=safeText(raw.name,80).trim(), value=safeText(raw.value,40).trim(), date=safePastDate(raw.date);
  if(!name||!value||!date) return null;
  return {id:safeText(raw.id,40)||'lab-'+date+'-'+name.toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,20),name,value,date,unit:safeText(raw.unit,30)};
}
function safeAppointments(raw){
  const out={questions:[],plans:[],brief:{concerns:[],goal:'',date:''},evidence:[]};
  if(!plainRecord(raw)) return out;
  if(Array.isArray(raw.evidence)){
    const seen=new Set();
    raw.evidence.slice(0,100).forEach((item,index)=>{
      if(!plainRecord(item)) return;
      const text=safeText(item.text,500).trim(), date=safePastDate(item.date);
      if(!text||!date) return;
      const rawId=safeText(item.id,60), id=/^[A-Za-z0-9_-]{1,60}$/.test(rawId)?rawId:'evidence-'+index;
      if(seen.has(id)) return; seen.add(id);
      out.evidence.push({id,date,kind:safeEnum(item.kind,['chapter','finding','note'],'note'),text,source:safeText(item.source,120).trim(),ref:safeText(item.ref,60).trim()});
    });
  }
  if(plainRecord(raw.brief)){
    const seen=new Set();
    out.brief.concerns=(Array.isArray(raw.brief.concerns)?raw.brief.concerns:[]).filter(item=>{
      if(!plainRecord(item)||!PINNABLE_SYMPTOMS.includes(item.key)||seen.has(item.key)) return false;
      seen.add(item.key); return true;
    }).slice(0,3).map(item=>({key:item.key,impact:safeText(item.impact,500).trim()}));
    if(Array.isArray(raw.brief.questions)){
      const questionIds=new Set();
      out.brief.questions=raw.brief.questions.slice(0,10).filter(item=>{
        if(!plainRecord(item)||!/^[a-z0-9-]{1,60}$/.test(item.id)||questionIds.has(item.id)||!safeText(item.text,1000).trim()) return false;
        questionIds.add(item.id); return true;
      }).map(item=>({id:item.id,text:safeText(item.text,1000).trim(),reason:safeText(item.reason,1000).trim(),selected:item.selected!==false}));
      out.brief.generatedAt=safePastDate(raw.brief.generatedAt);
    }
    out.brief.goal=safeText(raw.brief.goal,500).trim();
    out.brief.date=typeof raw.brief.date==='string'&&validISODate(raw.brief.date)?raw.brief.date:'';
  }
  if(Array.isArray(raw.questions)){
    raw.questions.slice(0,100).forEach((item,index)=>{
      if(!plainRecord(item)) return;
      const text=safeText(item.text,500).trim();
      if(!text) return;
      const rawId=safeText(item.id,50);
      const id=/^[A-Za-z0-9_-]{1,50}$/.test(rawId)?rawId:'question-'+index;
      const created=safePastDate(item.created);
      const askedAt=safePastDate(item.askedAt);
      out.questions.push({id,text,created,asked:item.asked===true,askedAt:item.asked===true?askedAt:''});
    });
  }
  if(Array.isArray(raw.plans)){
    raw.plans.slice(0,100).forEach((item,index)=>{
      if(!plainRecord(item)) return;
      const date=safePastDate(item.date);
      if(!date) return;
      const rawId=safeText(item.id,50);
      const id=/^[A-Za-z0-9_-]{1,50}$/.test(rawId)?rawId:'visit-'+index;
      const actions=[];
      if(Array.isArray(item.actions)) item.actions.slice(0,30).forEach((action,actionIndex)=>{
        if(!plainRecord(action)) return;
        const text=safeText(action.text,500).trim();
        if(!text) return;
        const actionRawId=safeText(action.id,50);
        const actionId=/^[A-Za-z0-9_-]{1,50}$/.test(actionRawId)?actionRawId:id+'-action-'+actionIndex;
        actions.push({id:actionId,text,done:action.done===true});
      });
      const summary=safeText(item.summary,2000).trim();
      const nextVisit=typeof item.nextVisit==='string'&&validISODate(item.nextVisit)?item.nextVisit:'';
      if(!summary&&!actions.length&&!nextVisit) return;
      out.plans.push({id,date,summary,actions,nextVisit});
    });
    out.plans.sort((a,b)=>b.date.localeCompare(a.date));
  }
  return out;
}
function safeHealthKitSummary(raw){
  if(!plainRecord(raw)||raw.available!==true||raw.readOnly!==true) return null;
  const generatedAt=typeof raw.generatedAt==='string'&&Number.isFinite(Date.parse(raw.generatedAt))?raw.generatedAt:'';
  const lookbackDays=safeInteger(raw.lookbackDays,1,30);
  if(!generatedAt||lookbackDays==null) return null;
  const steps=plainRecord(raw.steps)?raw.steps:{}, sleep=plainRecord(raw.sleep)?raw.sleep:{}, bodyWeight=plainRecord(raw.bodyWeight)?raw.bodyWeight:{};
  const totalSteps=safeNumber(steps.total,0,10000000), dailySteps=safeNumber(steps.dailyAverage,0,1000000);
  const totalSleep=safeNumber(sleep.totalHours,0,720), nightlySleep=safeNumber(sleep.nightlyAverageHours,0,24), trackedNights=safeInteger(sleep.trackedNights,0,31)||0;
  const latestKilograms=safeNumber(bodyWeight.latestKilograms,20,500);
  const recordedAt=typeof bodyWeight.recordedAt==='string'&&Number.isFinite(Date.parse(bodyWeight.recordedAt))?bodyWeight.recordedAt:null;
  const warnings=Array.isArray(raw.warnings)?raw.warnings.map(item=>safeText(item,80)).filter(Boolean).slice(0,10):[];
  return {
    available:true,readOnly:true,generatedAt,lookbackDays,
    hasAnyData:raw.hasAnyData===true,
    steps:{total:totalSteps,dailyAverage:dailySteps},
    sleep:{totalHours:totalSleep,nightlyAverageHours:nightlySleep,trackedNights},
    bodyWeight:{latestKilograms,recordedAt},warnings
  };
}
function safeScore(raw){
  if(!plainRecord(raw)) return null;
  const type=safeEnum(raw.type,['phq9','gad7'],null), date=safePastDate(raw.date);
  const max=type==='phq9'?27:type==='gad7'?21:null;
  const score=max==null?null:safeInteger(raw.score,0,max);
  if(!type || !date || score==null) return null;
  const band=type==='phq9'
    ? (score<5?'minimal':score<10?'mild':score<15?'moderate':score<20?'moderately severe':'severe')
    : (score<5?'minimal':score<10?'mild':score<15?'moderate':'severe');
  return {date,type,score,band};
}
function safeTrigger(raw){
  if(!plainRecord(raw)) return null;
  const start=safePastDate(raw.start); if(!start) return null;
  const item=safeEnum(raw.item,['Alcohol','Caffeine','Spicy food','Sugar','Late meals','Hot drinks','Something else'],null);
  if(!item) return null;
  const status=safeEnum(raw.status,['running','stopped','completed'],raw.active===true?'running':'stopped');
  const ended=safePastDate(raw.ended);
  const validEnded=ended&&ended>=start?ended:'';
  const finalStatus=validEnded ? (status==='completed'?'completed':'stopped') : status;
  const out={active:finalStatus==='running'&&raw.active===true&&!validEnded,status:finalStatus,item,start};
  if(validEnded) out.ended=validEnded;
  return out;
}
function validateBackup(raw){
  if(!plainRecord(raw) || !Number.isInteger(raw.v) || raw.v<1 || raw.v>SCHEMA_V
      || !plainRecord(raw.profile) || !plainRecord(raw.entries)){
    throw new Error('Invalid backup');
  }
  return migrate(raw);
}
let saveTimer=null, dirty=false;
function save(now){
  if(now){ clearTimeout(saveTimer); dirty=false; Store.write(DB); return; }
  dirty = true;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(()=>{ dirty=false; Store.write(DB); }, 250);
}
/* Flush only a pending debounced write. Deliberately does NOT write
   unconditionally on unload — that would let a stale tab overwrite
   changes made in another tab. */
function flush(){
  if(dirty){ clearTimeout(saveTimer); dirty=false; Store.write(DB); }
}

/* ---------- date helpers ---------- */
function todayISO(){ const d=new Date(); return iso(d); }
function iso(d){
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
function parseISO(s){ const [y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d); }
function addDays(s,n){ const d=parseISO(s); d.setDate(d.getDate()+n); return iso(d); }
function daysBetween(a,b){ return Math.round((parseISO(b)-parseISO(a))/86400000); }
function validISODate(s){
  if(typeof s!=='string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d=parseISO(s);
  return !isNaN(d.getTime()) && iso(d)===s;
}
function pastOrTodayISO(s){ return validISODate(s) && s<=todayISO(); }
function fmtDay(s){
  const d=parseISO(s), t=todayISO();
  if(s===t) return 'Today';
  if(s===addDays(t,-1)) return 'Yesterday';
  return d.toLocaleDateString(undefined,{weekday:'short', month:'short', day:'numeric'});
}
function fmtLong(s){ return parseISO(s).toLocaleDateString(undefined,{weekday:'long', month:'long', day:'numeric', year:'numeric'}); }
const DOW=['S','M','T','W','T','F','S'];

/* ---------- units ---------- */
const U = {
  get imp(){ return DB.profile.units==='imperial'; },
  wLabel(){ return this.imp?'lb':'kg'; },
  lLabel(){ return this.imp?'in':'cm'; },
  wOut(kg){ if(kg==null) return null; return this.imp ? kg*2.20462 : kg; },
  wIn(v){ if(v==null||v==='') return null; return this.imp ? v/2.20462 : +v; },
  lOut(cm){ if(cm==null) return null; return this.imp ? cm/2.54 : cm; },
  lIn(v){ if(v==null||v==='') return null; return this.imp ? v*2.54 : +v; }
};
const r1 = v => v==null?null:Math.round(v*10)/10;

/* ---------- what the profile implies ----------
   Uterus and ovaries are independent: a hysterectomy can leave both ovaries,
   and both ovaries can be removed with the uterus left in place. */
function hasUterus(){ return DB.profile.uterus!=='hyst'; }
function periodsPossible(){
  return DB.profile.uterus!=='hyst' && DB.profile.uterus!=='ablation'
      && DB.profile.ovaries!=='both';
}
function surgicalMenopause(){ return DB.profile.ovaries==='both'; }
const esc = s => String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* Screening records can carry the interval that matches the test a person
   actually used. That matters most for cervical and colorectal screening,
   where a date alone cannot tell us whether the next check is due in one,
   three, five or ten years. Defaults use the shortest standard interval so a
   recorded date never suppresses reminders indefinitely. */
const SCREENING_RULES = {
  mammo:    {label:'mammogram', minAge:40, maxAge:74, years:[2], defaultYears:2},
  cervical: {label:'cervical screening', minAge:21, maxAge:65, years:[3,5], defaultYears:3,
             yearsForAge:age=>age<30?[3]:[3,5]},
  colon:    {label:'colorectal screening', minAge:45, maxAge:75, years:[1,3,5,10], defaultYears:1},
  dxa:      {label:'bone density scan', minAge:65, maxAge:null, years:[5], defaultYears:5}
};
function screeningIntervals(rule, age){
  return rule&&rule.yearsForAge&&age!=null ? rule.yearsForAge(age) : (rule?rule.years:[]);
}
function screeningStatus(id, age){
  const rule=SCREENING_RULES[id];
  /* Automated due dates encode US guidance. Other regions keep the checklist
     for recording dates, but do not receive misleading US-timed reminders. */
  if(DB.profile.region!=='us' || !rule || age==null || age<rule.minAge || (rule.maxAge!=null && age>rule.maxAge)){
    return {eligible:false, due:false};
  }
  const rec=DB.screening[id]||{};
  const validLast=pastOrTodayISO(rec.last);
  const requested=+rec.intervalYears;
  const allowed=screeningIntervals(rule,age);
  const intervalYears=allowed.includes(requested) ? requested : rule.defaultYears;
  if(!validLast){
    return {eligible:true, due:true, never:true, invalid:!!rec.last, intervalYears, rule};
  }
  const elapsed=daysBetween(rec.last,todayISO());
  return {
    eligible:true,
    due:elapsed>=Math.round(intervalYears*365.25),
    never:false,
    last:rec.last,
    elapsed,
    intervalYears,
    rule
  };
}

/* ---------- entries ---------- */
const SYMS = [
  {k:'sleepq', n:'Sleep quality', inv:true},
  {k:'mood',   n:'Low mood'},
  {k:'anx',    n:'Anxiety / irritability'},
  {k:'fog',    n:'Brain fog'},
  {k:'joint',  n:'Joint or muscle ache'},
  {k:'dry',    n:'Vaginal dryness / discomfort'},
  {k:'uri',    n:'Bladder symptoms'},
  {k:'energy', n:'Fatigue'},
  {k:'head',   n:'Headache'},
  {k:'palp',   n:'Palpitations'},
  {k:'itch',   n:'Skin dryness / itch'},
  {k:'libido', n:'Low libido'},
  {k:'bloating', n:'Bloating'},
  {k:'dizzy', n:'Dizziness'},
  {k:'irritable', n:'Irritability'},
  {k:'overwhelmed', n:'Feeling overwhelmed'}
];
const SCALE4 = ['None','Mild','Moderate','Severe','Very severe'];

function entry(d){
  if(!DB.entries[d]) DB.entries[d] = {sym:{}, act:{}, nut:{}, confirmed:false, draftDirty:false};
  const e = DB.entries[d];
  e.sym = e.sym||{}; e.act = e.act||{}; e.nut = e.nut||{};
  const hasSnapshot=plainRecord(e.confirmedData)&&hasEntryContent(e.confirmedData);
  e.confirmed=!!hasSnapshot;
  e.draftDirty=!!hasSnapshot&&e.draftDirty===true;
  return e;
}
function hasEntryContent(e){
  if(!plainRecord(e)) return false;
  if(e.hf!=null||e.ns!=null||e.wt!=null||e.waist!=null||e.bleed||e.notes) return true;
  if(e.rating!=null||e.wakes!=null||(Array.isArray(e.moments)&&e.moments.length)) return true;
  if(Object.keys(e.sym||{}).length) return true;
  if(e.sleepH!=null||e.inBedH!=null) return true;
  if(Object.keys(e.act||{}).length||Object.keys(e.nut||{}).length) return true;
  return false;
}
function isConfirmedEntry(d){
  const e=DB.entries[d];
  return !!(e&&plainRecord(e.confirmedData)&&hasEntryContent(e.confirmedData));
}
function confirmedEntry(d){ return isConfirmedEntry(d)?DB.entries[d].confirmedData:null; }
function markEntryDraft(d){
  const e=DB.entries[d];
  if(!e||!isConfirmedEntry(d)) return false;
  e.confirmed=true;
  e.draftDirty=true;
  return true;
}
function confirmEntry(d){
  const e=entry(d);
  const snapshot=safeEntryPayload(e);
  if(!hasEntryContent(snapshot)) return false;
  /* Build and validate the complete snapshot before swapping it in, so a
     failed confirmation cannot partly overwrite the last trusted record. */
  e.confirmedData=snapshot;
  e.confirmed=true;
  e.draftDirty=false;
  delete e.prefilledFrom;
  return true;
}
function hasData(d){ return isConfirmedEntry(d); }
function confirmedEntryDates(){ return Object.keys(DB.entries).filter(isConfirmedEntry).sort(); }
function entryDates(){ return confirmedEntryDates(); }
function rangeDates(n){
  const out=[]; const t=todayISO();
  for(let i=n-1;i>=0;i--) out.push(addDays(t,-i));
  return out;
}
function series(days, fn){
  return days.map(d=>{ const e=confirmedEntry(d); return {d, v:e?fn(e):null}; });
}
function movingAvg(arr, w){
  return arr.map((p,i)=>{
    const s=arr.slice(Math.max(0,i-w+1), i+1).filter(x=>x.v!=null).map(x=>x.v);
    return {d:p.d, v: s.length? s.reduce((a,b)=>a+b,0)/s.length : null};
  });
}
function avg(nums){ const a=nums.filter(v=>v!=null && !isNaN(v)); return a.length? a.reduce((x,y)=>x+y,0)/a.length : null; }
function sum(nums){ return nums.filter(v=>v!=null).reduce((x,y)=>x+y,0); }

/* ---------- symptom burden score ----------
   11 tracked items on the same 0-4 per-symptom structure the Menopause
   Rating Scale uses, scaled to 0-44. Deliberately NOT banded into
   severity categories: this is not the MRS item set (it excludes hot
   flashes and sleep, and adds brain fog, headache and itch), and no
   validated cut-off exists for it. It is a direction-over-time measure.
   Requires most items answered so a partial day can't read as severe. */
const BURDEN_KEYS = ['mood','anx','fog','joint','dry','uri','energy','head','palp','itch','libido'];
const BURDEN_MIN_ITEMS = 8;
function burden(e){
  if(!e||!e.sym) return null;
  const vals = BURDEN_KEYS.map(k=>e.sym[k]).filter(v=>v!=null);
  if(vals.length < BURDEN_MIN_ITEMS) return null;
  const scaled = sum(vals) / vals.length * BURDEN_KEYS.length;
  return Math.round(scaled*10)/10;
}

/* ---------- SVG charts (no dependencies) ---------- */
function lineChart(points, opt){
  opt = opt||{};
  const W=320, H=opt.h||120, PL=30, PR=6, PT=8, PB=18;
  const vals = points.filter(p=>p.v!=null).map(p=>p.v);
  if(vals.length<1) return emptyChart(opt.empty||'No data yet');
  let min = opt.min!=null?opt.min:Math.min(...vals);
  let max = opt.max!=null?opt.max:Math.max(...vals);
  if(min===max){ min-=1; max+=1; }
  const pad=(max-min)*0.12; min-=pad; max+=pad;
  if(opt.min0 && min>0) min=0;
  const x = i => PL + (W-PL-PR) * (points.length<2?0.5:i/(points.length-1));
  const y = v => PT + (H-PT-PB) * (1-(v-min)/(max-min));
  let path='', area='', started=false, lastX=null;
  points.forEach((p,i)=>{
    if(p.v==null) return;
    const cmd = started?'L':'M';
    path += cmd + x(i).toFixed(1) + ' ' + y(p.v).toFixed(1) + ' ';
    if(!started){ area += 'M' + x(i).toFixed(1) + ' ' + y(p.v).toFixed(1) + ' '; started=true; }
    else area += 'L' + x(i).toFixed(1) + ' ' + y(p.v).toFixed(1) + ' ';
    lastX = x(i);
  });
  if(started && opt.area) area += 'L'+lastX.toFixed(1)+' '+(H-PB)+' L'+x(points.findIndex(p=>p.v!=null)).toFixed(1)+' '+(H-PB)+' Z';
  const ticks = [max, (max+min)/2, min];
  let g='';
  ticks.forEach(t=>{ g += '<line class="grid" x1="'+PL+'" x2="'+(W-PR)+'" y1="'+y(t).toFixed(1)+'" y2="'+y(t).toFixed(1)+'"/>'
    + '<text class="axis" x="'+(PL-4)+'" y="'+(y(t)+3).toFixed(1)+'" text-anchor="end">'+(Math.round(t*10)/10)+'</text>'; });
  let ml='';
  if(opt.ma){
    const ma = movingAvg(points, opt.ma);
    let p2='', st=false;
    ma.forEach((p,i)=>{ if(p.v==null) return; p2 += (st?'L':'M')+x(i).toFixed(1)+' '+y(p.v).toFixed(1)+' '; st=true; });
    if(st) ml = '<path class="ln2" d="'+p2+'"/>';
  }
  const lastIdx = points.map(p=>p.v).reduce((acc,v,i)=>v!=null?i:acc,-1);
  const dot = lastIdx>=0 ? '<circle class="dot" cx="'+x(lastIdx).toFixed(1)+'" cy="'+y(points[lastIdx].v).toFixed(1)+'" r="3.4"/>' : '';
  const labels = '<text class="axis" x="'+PL+'" y="'+(H-4)+'">'+shortD(points[0].d)+'</text>'
    + '<text class="axis" x="'+(W-PR)+'" y="'+(H-4)+'" text-anchor="end">'+shortD(points[points.length-1].d)+'</text>';
  return '<svg class="chart" viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none" role="img" aria-label="'+esc(opt.label||'trend chart')+'">'
    + g + (opt.area?'<path class="ar" d="'+area+'"/>':'') + '<path class="ln" d="'+path+'"/>' + ml + dot + labels + '</svg>';
}
function barChart(points, opt){
  opt=opt||{};
  const W=320, H=opt.h||110, PL=26, PR=6, PT=8, PB=18;
  const vals = points.filter(p=>p.v!=null).map(p=>p.v);
  if(!vals.length) return emptyChart(opt.empty||'No data yet');
  const max = Math.max(opt.min1?1:0, ...vals) * 1.15 || 1;
  const bw = (W-PL-PR)/points.length;
  const y = v => PT + (H-PT-PB)*(1-v/max);
  let bars='';
  points.forEach((p,i)=>{
    if(p.v==null || p.v===0){ return; }
    const h = (H-PB) - y(p.v);
    bars += '<rect class="bar" x="'+(PL+i*bw+bw*0.15).toFixed(1)+'" y="'+y(p.v).toFixed(1)+'" width="'+(bw*0.7).toFixed(1)+'" height="'+Math.max(1,h).toFixed(1)+'" rx="1.5"/>';
  });
  let g='';
  [max, max/2].forEach(t=>{ g += '<line class="grid" x1="'+PL+'" x2="'+(W-PR)+'" y1="'+y(t).toFixed(1)+'" y2="'+y(t).toFixed(1)+'"/>'
    + '<text class="axis" x="'+(PL-4)+'" y="'+(y(t)+3).toFixed(1)+'" text-anchor="end">'+Math.round(t)+'</text>'; });
  const labels = '<text class="axis" x="'+PL+'" y="'+(H-4)+'">'+shortD(points[0].d)+'</text>'
    + '<text class="axis" x="'+(W-PR)+'" y="'+(H-4)+'" text-anchor="end">'+shortD(points[points.length-1].d)+'</text>';
  return '<svg class="chart" viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none" role="img" aria-label="'+esc(opt.label||'bar chart')+'">'+g+bars+labels+'</svg>';
}
function emptyChart(msg){
  return '<div class="empty tiny" style="padding:26px 10px">'+esc(msg)+'</div>';
}
function shortD(s){ const d=parseISO(s); return (d.getMonth()+1)+'/'+d.getDate(); }

/* ---------- insights engine ---------- */
function insights(){
  const out = [];
  const d30 = rangeDates(30), d14 = rangeDates(14), d7 = rangeDates(7);
  const dates = entryDates();
  const nLogged = dates.length;

  /* --- red flag: postmenopausal bleeding --- */
  const bleeds = dates.filter(d=>{ const e=confirmedEntry(d), b=e&&e.bleed; return b && b!=='none'; });
  /* Check EVERY logged bleed against the gap before it, not just the most
     recent one — an event that followed 12+ months of amenorrhoea still needs
     evaluation even if there has been bleeding since. */
  if(bleeds.length){
    let flagged = null;
    for(let i=0;i<bleeds.length;i++){
      const prevRef = i>0 ? bleeds[i-1] : (DB.profile.lastPeriod || null);
      if(!prevRef) continue;
      const gap = daysBetween(prevRef, bleeds[i]);
      if(gap>=365) flagged = {d:bleeds[i], gap};
    }
    if(!hasUterus() && bleeds.length){
      const last = bleeds[bleeds.length-1];
      out.push({t:'alert', h:'You logged bleeding, and you have had a hysterectomy',
        b:'Bleeding on '+fmtDay(last)+'. After the uterus has been removed, vaginal bleeding is unexpected — it is usually something minor such as fragile vaginal tissue, which is common after menopause and very treatable, but it should be looked at rather than watched. Please mention it to a clinician.',
        cta:{l:'Red flags', go:'redflags'}});
      flagged = null;
    }
    /* There is no "resolved" state in the app. Keep this visible until the
       underlying bleeding entry is removed so an unevaluated event cannot
       disappear merely because time passed. */
    if(flagged){
      const since = daysBetween(flagged.d, todayISO());
      out.push({t:'alert', h:'Bleeding after 12+ months without a period',
        b:'You logged bleeding on '+fmtDay(flagged.d)+' — about '+Math.floor(flagged.gap/30)+' months after the previous one. Any bleeding 12 months or more after your last period needs prompt evaluation: around <b>90% of women with endometrial cancer present with postmenopausal bleeding</b>.'
          + (since>30 ? ' That was '+Math.floor(since/30)+' months ago — if it has not been looked at, please book an appointment.' : ' Please book an appointment.')
          + ' ACOG narrowed its guidance in April 2026: most patients should now have both an ultrasound <i>and</i> endometrial tissue sampling, because thickness alone misses higher-grade cancers.',
        cta:{l:'Read why', go:'redflags'}});
    }
  }
  /* --- amenorrhea counter --- */
  /* Counting months of amenorrhoea only means something if a period was
     possible in the first place. */
  if(surgicalMenopause()){
    const surgeryDate=pastOrTodayISO(DB.profile.surgeryDate) ? DB.profile.surgeryDate : null;
    const surgeryWhen=surgeryDate
      ? ' on '+fmtDay(surgeryDate)+' ('+Math.max(0,Math.floor(daysBetween(surgeryDate,todayISO())/30))+' months ago)'
      : '';
    out.push({t:'info', h:'You are postmenopausal — the count of months since a period does not apply',
      b:'Both ovaries removed means menopause happened at the operation'+surgeryWhen+', so this app will not try to date it from bleeding. What is worth attention instead: hormone therapy at least until around age 52 unless there is a reason not to, bone protection, and cardiovascular risk factors. Vaginal and urinary symptoms are the ones that get worse rather than better if left alone.',
      cta:{l:'Your stage', go:'learn:stage'}});
  } else if(!periodsPossible()){
    out.push({t:'info', h:'Your bleeding pattern cannot stage you — that is expected',
      b:(DB.profile.uterus==='hyst'
          ? 'After a hysterectomy there is no bleeding pattern to read, but if your ovaries were left they carry on working — so this may well not be menopause yet.'
          : 'After an endometrial ablation, periods stop or become very light, so the bleeding criterion is unavailable. Your ovaries are unaffected.')
        + ' Symptom trends are your best evidence, which is what the tracking here is for.',
      cta:{l:'What this means', go:'learn:stage'}});
  }
  const lastBleed = (bleeds.length ? bleeds[bleeds.length-1] : (DB.profile.lastPeriod||null));
  if(lastBleed && periodsPossible()){
    const g = daysBetween(lastBleed, todayISO());
    if(g>=60 && g<365){
      out.push({t:'info', h:Math.floor(g/30)+' months since your last logged period',
        b:'Gaps of 60 days or more put you in the late menopausal transition, which typically runs 1–3 years. This is also when hot flashes are most likely to start or intensify. At 12 months without a period, menopause is confirmed retrospectively — and from that point any bleeding needs checking.'});
    } else if(g>=365){
      out.push({t:'ok', h:'Menopause confirmed: '+Math.floor(g/365)+'+ '+(g>=730?'years':'year')+' since your last period',
        b:'From here, hot flashes tend to ease for most women. Vaginal and urinary symptoms are the ones that get worse if left alone — they are also very treatable.'});
    }
  }

  /* --- mood streak --- */
  const moodVals = series(d14,e=>e.sym?e.sym.mood:null).map(p=>p.v).filter(v=>v!=null);
  if(moodVals.length>=7){
    const high = moodVals.filter(v=>v>=3).length;
    if(high >= Math.ceil(moodVals.length*0.6)){
      out.push({t:'alert', h:'Low mood on most of the last two weeks',
        b:'You have logged moderate or worse low mood on '+high+' of '+moodVals.length+' recorded days. Perimenopause carries about 40% higher odds of depression than premenopause. This is worth raising with a clinician rather than waiting out — the PHQ-9 in Tools will give you a number to bring.',
        cta:{l:'Take the PHQ-9', go:'tool:phq9'}});
    }
  }

  /* --- VMS trend --- */
  const hf30 = series(d30, e=>e.hf);
  const hfLogged = hf30.filter(p=>p.v!=null);
  if(hfLogged.length>=8){
    const half = Math.floor(hfLogged.length/2);
    const a = avg(hfLogged.slice(0,half).map(p=>p.v)), b = avg(hfLogged.slice(half).map(p=>p.v));
    const delta = b-a;
    if(Math.abs(delta) >= Math.max(1, a*0.2)){
      out.push({t: delta<0?'ok':'info', h:'Hot flashes are '+(delta<0?'down':'up')+' about '+Math.abs(Math.round(delta*10)/10)+' a day',
        b:'Comparing the first and second half of your logged days this month: '+r1(a)+' per day → '+r1(b)+' per day. Day-to-day counts are noisy, so read the direction rather than any single day.'});
    }
  }

  /* --- alcohol association (personal pattern, honestly labelled) --- */
  const pairs = [];
  d30.forEach(d=>{
    const e=confirmedEntry(d), nx=confirmedEntry(addDays(d,1));
    if(e && nx && e.nut && e.nut.alc!=null && nx.hf!=null) pairs.push({alc:e.nut.alc, hf:nx.hf, sq: nx.sym?nx.sym.sleepq:null});
  });
  if(pairs.length>=10){
    const withA = pairs.filter(p=>p.alc>0), without = pairs.filter(p=>p.alc===0);
    if(withA.length>=4 && without.length>=4){
      const a=avg(withA.map(p=>p.hf)), b=avg(without.map(p=>p.hf));
      if(a!=null && b!=null && Math.abs(a-b) >= 1){
        out.push({t:'info', h:'A personal pattern worth testing properly',
          b:'On days after you logged alcohol, you recorded '+r1(a)+' hot flashes on average, versus '+r1(b)+' after alcohol-free days ('+withA.length+' vs '+without.length+' days). <b>This is your own pattern, not proof of cause</b> — trigger-avoidance has never been shown to work as a treatment in trials, and plenty of other things differ between those days. The 28-day removal-and-reintroduction test is a fairer way to check it.',
          cta:{l:'Run a trigger test', go:'tool:trigger'}});
      }
    }
  }

  /* --- sleep vs night sweats --- */
  const nsPairs = d30.map(confirmedEntry).filter(e=>e&&e.ns!=null&&e.sym&&e.sym.sleepq!=null);
  if(nsPairs.length>=10){
    const hi = nsPairs.filter(e=>e.ns>=2), lo = nsPairs.filter(e=>e.ns<=1);
    if(hi.length>=4 && lo.length>=4){
      const a=avg(hi.map(e=>e.sym.sleepq)), b=avg(lo.map(e=>e.sym.sleepq));
      if(a!=null&&b!=null&&(a-b)>=0.7){
        out.push({t:'info', h:'Your worst sleep tracks with night sweats',
          b:'Sleep quality averaged '+r1(a)+'/4 on nights with moderate-or-worse sweats versus '+r1(b)+'/4 without. That pattern points to treating the vasomotor symptoms rather than the insomnia — a different first move than if you were lying awake dry and wired.',
          cta:{l:'Sleep triage', go:'learn:sleep'}});
      }
    }
  }

  /* --- resistance training --- */
  const res7 = d7.filter(d=>{ const e=confirmedEntry(d); return e&&e.act&&e.act.res; }).length;
  const res28 = rangeDates(28).filter(d=>{ const e=confirmedEntry(d); return e&&e.act&&e.act.res; }).length;
  if(nLogged>=7){
    if(res28===0){
      out.push({t:'warn', h:'No strength sessions logged in four weeks',
        b:'This is the highest-leverage gap in the whole app. Resistance training is the intervention that most reliably adds lean mass in postmenopausal women (+0.90 kg across 101 trials; combined training +0.68 kg), and lean mass is what holds up your metabolism, your bone and your independence. Two sessions a week is the target; even one is not nothing.',
        cta:{l:'Starter programme', go:'learn:exercise'}});
    } else {
      const perWk = res28/4;
      out.push({t: perWk>=2?'ok':'info', h:'Strength training: '+r1(perWk)+' sessions a week',
        b: perWk>=2 ? 'You are at or above the guideline of two sessions a week covering all major muscle groups. Three beat two for grip strength in trials of older adults with sarcopenia — worth a look if you want more.'
                    : 'The target is two a week, covering all major muscle groups. You are averaging '+r1(perWk)+'. Adding one session is a smaller change than it sounds.'});
    }
  }
  /* --- aerobic minutes --- */
  const aero7 = sum(d7.map(d=>{const e=confirmedEntry(d); return e&&e.act?e.act.aero:null;}));
  if(nLogged>=5 && aero7!=null){
    out.push({t: aero7>=150?'ok':'info', h:aero7+' minutes of aerobic activity this week',
      b: aero7>=150 ? 'At or above the 150-minute guideline. Aerobic work is what moved waist circumference most in the trials (−2.30 cm), while resistance work moved lean mass.'
                    : 'The guideline is 150–300 minutes a week of moderate activity. You are at '+aero7+'. Walking counts.'});
  }

  /* --- weight trend --- */
  const wt = series(rangeDates(56), e=>e.wt).filter(p=>p.v!=null);
  if(wt.length>=6){
    const first = avg(wt.slice(0,3).map(p=>p.v)), last = avg(wt.slice(-3).map(p=>p.v));
    const span = daysBetween(wt[0].d, wt[wt.length-1].d) || 1;
    const perWk = (last-first)/span*7;
    const dir = perWk>0.05?'up':(perWk<-0.05?'down':'steady');
    const disp = v => r1(U.wOut(Math.abs(v)))+' '+U.wLabel();
    if(dir==='steady'){
      out.push({t:'info', h:'Weight is steady — check your waist too',
        b:'The scale can stay flat while body composition shifts. MRI studies found significant visceral fat gain <b>despite no change in weight or waist</b>. Waist circumference is the better single number here, and it responds to diet and exercise with or without weight loss.'});
    } else {
      const fast = Math.abs(perWk) > 1;
      out.push({t: dir==='down'&&!fast?'ok':'info', h:'Weight trending '+dir+' about '+disp(perWk)+' a week',
        b: dir==='down'
          ? (fast ? 'That is faster than the 0.5–1 kg (1–2 lb) a week that predicts better maintenance. In midlife the specific risk of fast loss is lean tissue: even protein distribution at 1.2 g/kg or more went with a lower lean share of the loss — about 26% rather than 34%. Keep the protein and the strength sessions.'
                  : 'That sits in the range associated with better long-term maintenance. A 5% total loss already improves blood pressure, lipids and glucose.')
          : 'Midlife weight gain averages about 1.5 lb a year and tracks ageing more than menopause. What tracks menopause is where the fat goes — which is why waist matters.'});
    }
  }
  /* --- waist --- */
  const wa = series(rangeDates(120), e=>e.waist).filter(p=>p.v!=null);
  if(wa.length>=2){
    const d = wa[wa.length-1].v - wa[0].v;
    if(Math.abs(d)>=1.5){
      out.push({t: d<0?'ok':'warn', h:'Waist '+(d<0?'down':'up')+' '+r1(Math.abs(U.lOut(d)))+' '+U.lLabel()+' since you started logging',
        b:'Waist circumference is arguably the single most useful measurement here — when waist and BMI are modelled together, waist stays predictive of mortality while BMI becomes unrelated. Measure at the same landmark each time; self-measurement typically underestimates by 1–3 cm, which is fine when you are tracking change.'});
    }
    const cur = wa[wa.length-1].v;
    if(cur>=90){
      out.push({t:'info', h:'Waist is above the 90 cm mark',
        b:'For women, thresholds are 80 cm at normal weight and 90 cm at overweight (ethnicity-specific cut-points differ — 80 cm for Chinese and Asian Indian women, 90 cm for Japanese women). Above these, waist reduction is worth targeting directly. Aerobic work moved it most in trials.'});
    }
  }

  /* --- protein --- */
  const prot28 = rangeDates(28).map(confirmedEntry).filter(e=>e&&e.nut&&e.nut.prot!=null);
  if(prot28.length>=7){
    const met = prot28.filter(e=>e.nut.prot).length;
    const pct = Math.round(met/prot28.length*100);
    out.push({t: pct>=70?'ok':'info', h:'Protein target met on '+pct+'% of logged days',
      b: pct>=70 ? 'Good. The per-meal amount matters too after about 60 — roughly 30 g per sitting, spread evenly rather than loaded into dinner.'
                 : 'Spreading protein evenly (roughly 30/30/30 g) produced more muscle protein synthesis over 24 hours than skewing it (10/20/60 g). Breakfast is usually the meal that is short.',
      cta:{l:'Protein calculator', go:'tool:protein'}});
  }
  /* --- alcohol --- */
  const alc28 = rangeDates(28).map(confirmedEntry).filter(e=>e&&e.nut&&e.nut.alc!=null);
  if(alc28.length>=10){
    const total = sum(alc28.map(e=>e.nut.alc));
    const perDay = total/alc28.length;
    if(perDay>=1){
      out.push({t:'warn', h:'Averaging '+r1(perDay)+' drinks a day on logged days',
        b:'The honest reason to cut back is breast cancer risk, not hot flashes. Pooled relative risk runs 1.10 at one drink a day and 1.18 at two, with no safe threshold. For scale: 4–6 units a day adds about 8 extra breast cancers per 1,000 women aged 50–59 over five years — the same order as combined hormone therapy. US dietary guidance published in January 2026 moved from advising moderation to advising people to drink less.'});
    }
  }
  /* --- pelvic floor --- */
  const dryDays = rangeDates(28).map(confirmedEntry).filter(e=>e&&e.sym&&(e.sym.dry>=2||e.sym.uri>=2));
  if(dryDays.length>=5){
    out.push({t:'warn', h:'Vaginal or bladder symptoms are showing up regularly',
      b:'Logged at moderate or worse on '+dryDays.length+' days in the last four weeks. Unlike hot flashes, these are <b>progressive</b> — they get worse rather than better if left alone, and they respond well to treatment. Low-dose vaginal oestrogen is a Strong Recommendation in the 2025 guideline, needs no progestogen, and does not raise endometrial cancer risk.',
      cta:{l:'Read the options', go:'learn:sex'}});
  }
  const pf28 = rangeDates(28).filter(d=>{ const e=confirmedEntry(d); return e&&e.act&&e.act.pf; }).length;
  if(dryDays.length>=3 && pf28<8){
    out.push({t:'info', h:'Pelvic floor training is the best-evidenced thing you can do yourself',
      b:'Cochrane review of 31 trials: stress incontinence cured in 56% versus 6% of controls; cured or improved in 74% versus 11%. The catch is technique — many women contract incorrectly on the first attempt, which is why being taught beats guessing.',
      cta:{l:'How to do it', go:'learn:exercise'}});
  }
  /* --- OSA screen prompt --- */
  const sleepObs = rangeDates(21).map(confirmedEntry).filter(e=>
    e && e.sym && e.sym.sleepq!=null && e.ns!=null
  );
  const badSleep = sleepObs.filter(e=>e.sym.sleepq>=3);
  const badSleepLowNS = badSleep.filter(e=>e.ns<=1);
  if(badSleep.length>=8 && badSleepLowNS.length>=Math.ceil(badSleep.length*0.6)){
    out.push({t:'warn', h:'Bad sleep, but not much night sweating',
      b:'You are logging poor sleep frequently without heavy night sweats. That pattern points away from vasomotor fragmentation and toward insomnia — or sleep apnea, which affects <b>20% of midlife women</b> versus 4% of younger women and is badly underdiagnosed, because women present with insomnia and fatigue rather than loud snoring. CBT-I is first line for insomnia; if it does not work, that is itself a reason to be tested.',
      cta:{l:'Sleep module', go:'learn:sleep'}});
  }
  /* --- burden trend --- */
  const bd = series(d30, burden).filter(p=>p.v!=null);
  if(bd.length>=8){
    const half=Math.floor(bd.length/2);
    const a=avg(bd.slice(0,half).map(p=>p.v)), b=avg(bd.slice(half).map(p=>p.v));
    if(Math.abs(b-a)>=2){
      out.push({t:b<a?'ok':'info', h:'Overall symptom burden is '+(b<a?'easing':'building'),
        b:'Your tracked burden score moved from '+r1(a)+' to '+r1(b)+' out of 44 across this month. It uses the same 0–4 per-symptom structure as the Menopause Rating Scale, but it is a direction-over-time measure for you and your clinician — there is no validated cut-off for this item set, so we do not label it mild or severe.'});
    }
  }
  /* --- screening due --- */
  const age = DB.profile.birthYear ? (new Date().getFullYear() - DB.profile.birthYear) : null;
  if(age){
    const due=Object.keys(SCREENING_RULES).map(id=>screeningStatus(id,age)).filter(s=>s.due);
    if(due.length){
      const labels=due.map(s=>s.rule.label);
      const overdue=due.filter(s=>!s.never);
      out.push({t:'info', h:'Worth checking: '+labels.join(', '),
        b:(overdue.length
            ? 'Your recorded date has reached the reminder interval for '+overdue.map(s=>s.rule.label).join(' and ')+'. '
            : 'You have not recorded these yet. ')
          +'At '+age+', US guidance covers '+labels.join(' and ')+'. Record the date and the interval that matches the test you had in the preventive care checklist.',
        cta:{l:'Preventive care', go:'screening'}});
    }
  }
  /* --- consistency --- */
  if(nLogged>0 && nLogged<5){
    out.push({t:'info', h:'Keep logging — patterns need about two weeks',
      b:'You have '+nLogged+' '+(nLogged===1?'day':'days')+' recorded. Most of the useful comparisons in here need 10–14 days before they mean anything. A 20-second check-in is enough; you do not need to fill in every field.'});
  }
  if(!out.length){
    out.push({t:'info', h:'Nothing to flag yet',
      b:'Once you have a couple of weeks of check-ins, this page will show your trends, personal patterns, and anything worth raising with a clinician.'});
  }
  return out;
}

/* ---------- the ledger ----------
   A moment is one dated, timed event: {t:'HH:MM', k:kind, s?:1-3, n?:note,
   v?:hours, d?:seconds}. Moments are the input; the per-day fields the
   insights engine reads (hf, ns, sym.*, bleed, sleepH, wakes) are rolled up
   from them, so every finding and the clinician report keep working. A day
   with any moment is a confirmed day: the ledger has no drafts. */
function nowHM(date){ const d=date||new Date(); return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'); }
function hmMinutes(t){ const [h,m]=String(t||'00:00').split(':').map(Number); return (h||0)*60+(m||0); }
function fmtHM(t){
  const [h,m]=String(t).split(':').map(Number), d=new Date(2000,0,1,h,m);
  return d.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}).replace(/\s?([ap])\.?m\.?/i,(x,ap)=>' '+ap.toLowerCase()+'m').replace(/^0/,'');
}
function momentName(m){ return m&&MOMENT_KINDS[m.k]?MOMENT_KINDS[m.k].n:(m&&m.k)||''; }
function momentDetail(m){
  if(!m) return '';
  const parts=[];
  if(m.k==='slept'&&m.v!=null) return r1(m.v)+' h';
  if(m.s) parts.push(MOMENT_SEVERITY[m.s].toLowerCase());
  if(m.d) parts.push('rode it out, '+(m.d>=60?Math.round(m.d/60)+' min':m.d+' s'));
  if(m.n&&m.k!=='note') parts.push(m.n);
  return parts.join(' · ');
}
function dayMoments(date){ const e=DB.entries[date]; return e&&Array.isArray(e.moments)?e.moments:[]; }
function newMomentId(){ return 'm-'+Date.now().toString(36)+Math.random().toString(36).slice(2,6); }
function ledgerDerived(ms){
  const out={sym:{}}, ofKind=k=>ms.filter(m=>m.k===k);
  const hf=ofKind('hf'), ns=ofKind('ns'), woke=ofKind('woke'), bleeds=ofKind('bleed');
  if(hf.length) out.hf=hf.length;
  /* ns is the 0–4 night-sweat severity the insights read (>=2 is moderate or
     worse), so the ledger rolls up the worst sweat of the night, not how many
     there were; the count stays in the ledger and the night findings use it. */
  if(ns.length) out.ns=Math.min(4,Math.max(...ns.map(m=>m.s||2)));
  if(woke.length) out.wakes=Math.min(30,woke.length);
  Object.keys(MOMENT_KINDS).filter(k=>MOMENT_KINDS[k].sym!==false).forEach(k=>{ const sev=ofKind(k).map(m=>m.s||2); if(sev.length) out.sym[k]=Math.max(...sev); });
  if(bleeds.length){ const s=Math.max(...bleeds.map(m=>m.s||2)); out.bleed=s>=3?'heavy':s===2?'light':'spotting'; }
  const slept=ofKind('slept').filter(m=>m.v!=null).pop();
  if(slept) out.sleepH=slept.v;
  return out;
}
/* Write the ledger's view into the day fields without trampling a value she
   typed herself (a flash count from Details, a migrated day): a field is
   overwritten when it still holds what the ledger last wrote, or nothing, or
   less than the ledger now shows; a larger manual value is kept until the
   ledger reaches it. `before` is the ledger's view before this change. */
function rollupMoments(e,before){
  const ms=Array.isArray(e.moments)?e.moments:[], after=ledgerDerived(ms), prev=before||ledgerDerived(ms);
  const settle=(obj,key,next,was)=>{
    const cur=obj[key];
    if(next==null){ if(cur!=null&&cur===was) delete obj[key]; return; }
    if(cur==null||cur===was||(typeof cur==='number'&&typeof next==='number'&&cur<next)) obj[key]=next;
  };
  settle(e,'hf',after.hf,prev.hf); settle(e,'ns',after.ns,prev.ns); settle(e,'wakes',after.wakes,prev.wakes);
  e.sym=e.sym||{};
  Object.keys(MOMENT_KINDS).filter(k=>MOMENT_KINDS[k].sym!==false).forEach(k=>settle(e.sym,k,after.sym[k],prev.sym[k]));
  settle(e,'bleed',after.bleed,prev.bleed);
  if(after.sleepH!=null){ e.sleepH=after.sleepH; if(e.inBedH!=null&&e.inBedH<e.sleepH) e.inBedH=e.sleepH; }
  else if(prev.sleepH!=null&&e.sleepH===prev.sleepH) delete e.sleepH;
  /* Notes: her own lines stay; the ledger's timestamped lines are rewritten. */
  const lines=(e.notes||'').split('\n').filter(line=>line.trim()), manual=lines.filter(line=>!/^\d\d:\d\d /.test(line));
  const noted=ms.filter(m=>m.k==='note'&&m.n).map(m=>m.t+' '+m.n);
  if(noted.length||manual.length!==lines.length){
    const notes=[...manual,...noted].join('\n').slice(0,4000);
    if(notes) e.notes=notes; else delete e.notes;
  }
}
function unconfirmEntry(date){
  const e=DB.entries[date]; if(!e) return;
  delete e.confirmedData; e.confirmed=false; e.draftDirty=false;
  if(!hasEntryContent(e)) delete DB.entries[date];
}
function addMoment(date,moment){
  if(!pastOrTodayISO(date)) return null;
  const e=entry(date);
  e.moments=Array.isArray(e.moments)?e.moments:[];
  if(e.moments.length>=MAX_MOMENTS_PER_DAY) return null;
  const clean=safeMoment(Object.assign({},moment,{t:moment.t||nowHM(),id:moment.id||newMomentId()}));
  if(!clean) return null;
  const before=ledgerDerived(e.moments);
  e.moments.push(clean); e.moments.sort((a,b)=>a.t.localeCompare(b.t));
  rollupMoments(e,before); confirmEntry(date);
  return clean;
}
function updateMoment(date,id,patch){
  const e=DB.entries[date]; const m=e&&Array.isArray(e.moments)?e.moments.find(x=>x.id===id):null;
  if(!m) return null;
  const clean=safeMoment(Object.assign({},m,patch,{id:m.id,k:m.k}));
  if(!clean) return null;
  const before=ledgerDerived(e.moments);
  Object.keys(m).forEach(key=>delete m[key]); Object.assign(m,clean);
  e.moments.sort((a,b)=>a.t.localeCompare(b.t));
  rollupMoments(e,before); confirmEntry(date);
  return m;
}
function removeMoment(date,id){
  const e=DB.entries[date]; if(!e||!Array.isArray(e.moments)) return false;
  const i=e.moments.findIndex(m=>m.id===id); if(i<0) return false;
  const before=ledgerDerived(e.moments);
  e.moments.splice(i,1);
  if(!e.moments.length) delete e.moments;
  rollupMoments(e,before);
  if(hasEntryContent(safeEntryPayload(e))) confirmEntry(date); else unconfirmEntry(date);
  return true;
}
function latestMoment(date,kind){
  const ms=dayMoments(date).filter(m=>!kind||m.k===kind);
  return ms.length?ms[ms.length-1]:null;
}
function lastMomentLogged(date){
  const ms=dayMoments(date).filter(m=>m.id).slice();
  return ms.sort((a,b)=>(b.id||'').localeCompare(a.id||''))[0]||null;
}
/* Close the day: one rating plus four facts. Unticked boxes are explicit
   zeros, because "no alcohol" is information the pairing insights need. */
function closeDay(date,answers){
  if(!pastOrTodayISO(date)) return false;
  const e=entry(date), a=answers||{};
  const rating=safeInteger(a.rating,0,4); if(rating!=null) e.rating=rating;
  e.nut=e.nut||{}; e.act=e.act||{}; e.sym=e.sym||{};
  if(typeof a.alcohol==='boolean') e.nut.alc=a.alcohol?Math.max(1,e.nut.alc||0):0;
  if(typeof a.strength==='boolean') e.act.res=a.strength;
  if(typeof a.period==='boolean'&&!dayMoments(date).some(m=>m.k==='bleed')) e.bleed=a.period?'light':'none';
  if(typeof a.stress==='boolean'){ if(a.stress) e.sym.overwhelmed=Math.max(2,e.sym.overwhelmed||0); else if(!dayMoments(date).some(m=>m.k==='overwhelmed')) e.sym.overwhelmed=0; }
  rollupMoments(e);
  return confirmEntry(date);
}
function dayClosed(date){ const e=confirmedEntry(date); return !!(e&&e.rating!=null); }
const DAY_RATINGS=['Rough','Hard','Fair','Good','Great'];
function isNightHour(hour){ const h=hour==null?new Date().getHours():hour; return h>=22||h<6; }

/* ---------- findings ----------
   The finding of the day is one sentence with a number behind it, chosen
   from the ledger's shape over the last week and from the insights engine.
   Nothing here is a diagnosis: every item is a description of her own record. */
const DAY_WINDOWS=[
  {id:'morning',l:'in the morning',range:'06:00–12:00',s:6*60,e:12*60},
  {id:'afternoon',l:'in the afternoon',range:'12:00–17:00',s:12*60,e:17*60},
  {id:'evening',l:'in the evening',range:'17:00–22:00',s:17*60,e:22*60},
  {id:'night',l:'overnight',range:'22:00–06:00',s:22*60,e:6*60}
];
function windowOf(t){
  const x=hmMinutes(t);
  return DAY_WINDOWS.find(w=>w.s<=w.e?(x>=w.s&&x<w.e):(x>=w.s||x<w.e))||DAY_WINDOWS[3];
}
const NUMBER_WORDS=['No','One','Two','Three','Four','Five','Six','Seven','Eight','Nine'];
function numberWord(n){ return n<NUMBER_WORDS.length?NUMBER_WORDS[n]:String(n); }
function plural(n,one,many){ return n===1?one:(many||one+'s'); }
function slugify(text){ return String(text).toLowerCase().replace(/<[^>]+>/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,50); }
const GENERIC_INSIGHTS=/^(Nothing to flag yet|Keep logging)/;
function hourLabel(min){ const h=Math.floor(((min%1440)+1440)%1440/60); return String(h).padStart(2,'0')+':00'; }
/* A night belongs to the morning it ends on: what was logged after 22:00 the
   evening before and before noon that day. A night counts as observed only
   when something was said about it (a wake, a sweat, a typed count, or the
   day was closed); nothing logged on an unclosed day is a gap, not a calm
   night, so comparisons never invent a zero-wake baseline. */
function nightMoments(d){
  return [...dayMoments(addDays(d,-1)).filter(m=>hmMinutes(m.t)>=22*60),...dayMoments(d).filter(m=>hmMinutes(m.t)<12*60)];
}
function nightRecord(d){
  const e=confirmedEntry(d), ms=nightMoments(d), woke=ms.filter(m=>m.k==='woke'&&windowOf(m.t).id==='night'), sweats=ms.filter(m=>m.k==='ns');
  const typedWakes=e&&e.wakes!=null&&!dayMoments(d).some(m=>m.k==='woke')?e.wakes:null;
  const typedSweat=e&&e.ns!=null&&!dayMoments(d).some(m=>m.k==='ns')?e.ns:null;
  const closed=!!(e&&e.rating!=null);
  const observed=!!(woke.length||sweats.length||typedWakes!=null||typedSweat!=null||closed);
  const wakes=woke.length?woke.length:typedWakes!=null?typedWakes:closed?0:null;
  const sweat=sweats.length?Math.max(...sweats.map(m=>m.s||2)):typedSweat!=null?typedSweat:closed?0:null;
  return {d,woke,sweats:sweats.length,wakes,sweat,observed};
}
function findings(){
  const out=[], t=todayISO(), week=rangeDates(7), fortnight=rangeDates(14);
  const push=f=>{ if(!out.some(x=>x.id===f.id)) out.push(f); };
  const ins=insights().filter(i=>!GENERIC_INSIGHTS.test(i.h));
  ins.filter(i=>i.t==='alert').forEach(i=>push({id:'alert-'+slugify(i.h),p:100,kind:'alert',head:i.h,body:i.b,cta:i.cta}));

  /* today's flashes, by time of day */
  const todayHF=dayMoments(t).filter(m=>m.k==='hf');
  if(todayHF.length>=2){
    const w=windowOf(todayHF[0].t);
    if(todayHF.every(m=>windowOf(m.t)===w)){
      const quiet=DAY_WINDOWS.filter(x=>x!==w&&x.id!=='night'&&hmMinutes(nowHM())>=x.e).map(x=>x.id);
      push({id:'today-hf-'+w.id,p:90,kind:'pattern',
        head:numberWord(todayHF.length)+' flashes, all '+w.l+'.'+(quiet.length?' Your '+quiet[0]+'s are clear.':''),
        num:w.range,sub:'today, at '+todayHF.map(m=>m.t).join(', '),
        body:'One day is a note; a week of the same shape is a finding. The dossier keeps count.'});
    }
  }
  /* the week's flashes cluster */
  const weekHF=week.flatMap(d=>dayMoments(d).filter(m=>m.k==='hf').map(m=>({d,t:m.t})));
  if(weekHF.length>=4){
    const byWin={}; weekHF.forEach(m=>{ const w=windowOf(m.t); byWin[w.id]=byWin[w.id]||{w,n:0,days:new Set()}; byWin[w.id].n++; byWin[w.id].days.add(m.d); });
    const top=Object.values(byWin).sort((a,b)=>b.n-a.n)[0];
    const share=top.n/weekHF.length;
    if(share>=0.6&&top.days.size>=3){
      const others=DAY_WINDOWS.filter(x=>x!==top.w&&!(byWin[x.id]&&byWin[x.id].n)&&x.id!=='night');
      push({id:'hf-cluster-'+top.w.id,p:85,kind:'pattern',
        head:'Flashes cluster '+top.w.l+'.',num:top.w.range,
        sub:'on '+top.days.size+' of the last 7 days; '+Math.round(share*100)+'% of '+weekHF.length+' flashes'+(others.length?'; '+others[0].id+'s clear':''),
        body:'Timing is the first thing a clinician will ask about. Afternoon and evening clusters often follow caffeine, heat or a skipped lunch; overnight clusters are the sleep problem in disguise.'});
    }
  }
  /* night waking window */
  const nights=week.map(nightRecord);
  const wakeNights=nights.filter(n=>n.woke.length);
  if(wakeNights.length>=3){
    const buckets={};
    wakeNights.forEach(n=>n.woke.forEach(m=>{ const x=hmMinutes(m.t), start=Math.floor(x/60)*60; [start-60,start].forEach(b=>{ const key=((b%1440)+1440)%1440; buckets[key]=buckets[key]||new Set(); buckets[key].add(n.d); }); }));
    const best=Object.entries(buckets).map(([k,set])=>({start:+k,n:set.size})).sort((a,b)=>b.n-a.n||a.start-b.start)[0];
    if(best&&best.n>=3){
      push({id:'wake-window',p:80,kind:'pattern',head:'You wake between '+hourLabel(best.start).replace(':00','')+' and '+hourLabel(best.start+120).replace(':00','')+'.',
        num:best.n+' of 7',sub:'nights with a wake in that window',
        body:'The second half of the night is where falling oestrogen shows: a sweat wakes you, and the hour after is the hard one. If the sweats go, the sleep usually follows; if not, the sleep needs treating on its own.'});
    }
  }
  /* sweat nights cost wakes */
  const observed=nights.filter(n=>n.observed&&n.wakes!=null), sweatNights=observed.filter(n=>n.sweat>0), dryNights=observed.filter(n=>!n.sweat);
  if(sweatNights.length>=3&&dryNights.length>=2){
    const a=avg(sweatNights.map(n=>n.wakes)), b=avg(dryNights.map(n=>n.wakes));
    if(a!=null&&b!=null&&a-b>=1){
      push({id:'sweat-wakes',p:75,kind:'pattern',head:'Sweat nights cost you '+r1(a-b)+' more '+plural(Math.round(a-b),'wake')+'.',
        num:r1(a)+' <i>vs</i> '+r1(b),sub:'wakes a night, sweat nights vs dry ('+sweatNights.length+' vs '+dryNights.length+')',
        body:'Points at the sweats, not at insomnia. That changes the first thing worth treating.'});
    }
  }
  /* fog after broken nights */
  const fogDays=fortnight.filter(d=>{ const e=confirmedEntry(d); return e&&((e.sym&&e.sym.fog>=1)||dayMoments(d).some(m=>m.k==='fog')); });
  const fortnightNights=fortnight.map(nightRecord).filter(n=>n.observed);
  const brokenNights=fortnightNights.filter(n=>(n.wakes||0)>=2||(n.sweat||0)>=2).map(n=>n.d);
  const calmNights=fortnightNights.filter(n=>!brokenNights.includes(n.d)).map(n=>n.d);
  if(brokenNights.length>=4&&calmNights.length>=3){
    const after=brokenNights.filter(d=>fogDays.includes(d)).length, calm=calmNights.filter(d=>fogDays.includes(d)).length;
    const ra=after/brokenNights.length, rc=calm/calmNights.length;
    if(ra>=0.6&&ra-rc>=0.3){
      push({id:'fog-after-nights',p:70,kind:'pattern',head:'Fog follows broken nights.',
        num:after+' of '+brokenNights.length,sub:'broken nights were followed by fog, vs '+calm+' of '+calmNights.length+' calm ones',
        body:'Concentration trouble that tracks sleep is a sleep problem first. Worth saying in exactly those words at the appointment.'});
    }
  }
  /* treatment watch: the most recent change inside 14 days */
  (Array.isArray(DB.medications)?DB.medications:[]).forEach(med=>{
    (Array.isArray(med.changes)?med.changes:[]).forEach(change=>{
      if(!pastOrTodayISO(change.date)) return;
      const since=daysBetween(change.date,t);
      if(since<2||since>21) return;
      const target=(change.targets||[]).includes('hf')?'hf':(change.targets||[])[0];
      if(!target) return;
      const before=change.baseline&&change.baseline.values&&change.baseline.values[target];
      const afterVals=[]; for(let i=1;i<=since;i++){ const e=confirmedEntry(addDays(change.date,i)); const v=e?(target==='hf'||target==='ns'?e[target]:(e.sym||{})[target]):null; if(v!=null) afterVals.push(v); }
      if(!before||before.n<3||afterVals.length<2) return;
      const after=avg(afterVals), unit=target==='hf'?' flashes a day':' / 4';
      const name=target==='hf'?'flashes a day':(MOMENT_KINDS[target]?MOMENT_KINDS[target].n.toLowerCase():target)+' / 4';
      push({id:'treatment-'+slugify(med.name)+'-'+change.date,p:65,kind:'treatment',
        head:'Since '+esc(med.name)+' changed on '+fmtDay(change.date)+'.',
        num:r1(before.average)+' → '+r1(after),sub:name+', '+since+' days in',
        body:since<14?'Too early to call. The two-week check-in is on '+fmtDay(addDays(change.date,14))+'. Her pattern, not proof.':'Compared with the week before the change. An association in one person; worth discussing, not proof of cause.'});
    });
  });
  /* engine insights that carry a pattern */
  ins.filter(i=>i.t!=='alert').forEach(i=>{
    const screening=/^Worth checking/.test(i.h);
    const p=screening?30:i.t==='warn'?55:i.t==='ok'?50:48;
    push({id:'insight-'+slugify(i.h),p,kind:'insight',head:i.h.replace(/ — /g,': '),body:i.b,cta:i.cta});
  });
  /* the record itself: the headline until there are pages to read */
  const n=entryDates().length, thin=n<3||!out.some(f=>f.kind!=='alert'&&f.kind!=='insight'&&f.p>=60);
  if(n&&thin) push({id:'record-days',p:n<3?95:40,kind:'record',head:n<7?'Day '+n+' of the record. Findings need about a week of pages.':n+' days on record. The dossier is building.',num:String(n),sub:plural(n,'day')+' recorded',body:'Most comparisons need 10 to 14 days before they mean anything. Log what happens; the page does the rest.'});
  if(!n) push({id:'record-empty',p:95,kind:'record',head:'Nothing on record yet. Log the first thing that happens.',body:'One tap files it with the time. The finding of the day appears once there is a day to read.'});
  out.sort((a,b)=>b.p-a.p);
  const seen=DB.findings||(DB.findings={});
  let changed=false;
  out.forEach(f=>{ if(!seen[f.id]&&f.kind!=='record'){ seen[f.id]=t; changed=true; } f.filed=seen[f.id]||t; });
  if(changed){ Object.keys(seen).sort((a,b)=>seen[a].localeCompare(seen[b])).slice(0,Math.max(0,Object.keys(seen).length-200)).forEach(k=>delete seen[k]); save(); }
  return out;
}
function dossierFindings(){ return findings().filter(f=>f.kind==='pattern'||f.kind==='treatment'||f.kind==='insight'||f.kind==='alert'); }
