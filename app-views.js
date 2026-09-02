/* ============================================================
   Views, tools, router
   ============================================================ */

const IC = {
  /* Shared interface icons. Primary-route icons are assigned from PULSE_IC below. */
  today:'<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="3" y="4" width="14" height="13" rx="2"></rect><path d="M3 8h14M7 2v4M13 2v4"></path></svg>',
  trends:'<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 16l4-6 3 3 4-7 3 4"></path></svg>',
  meds:'<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="4" y="2.5" width="12" height="15" rx="6"></rect><path d="M4 10h12"></path></svg>',
  report:'<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 2h6l3 3v13H6z M12 2v4h4"></path></svg>',
  settings:'<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="3"></circle><path d="M10 2v3M10 15v3M2 10h3M15 10h3"></path></svg>',
  learn:'<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 2h6l3 3v13H6z M12 2v4h4"></path></svg>',
  you:'<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="3"></circle><path d="M10 2v3M10 15v3M2 10h3M15 10h3"></path></svg>',
  chev:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"></path></svg>'
};
/* Lucide v1.38.0 (ISC) icons used by the selected Guided Daily Pulse shell.
   The full license is retained in assets/icons/LUCIDE_LICENSE.txt. */
const PULSE_IC = {
  safety:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="m4.93 4.93 4.24 4.24m5.66 0 4.24-4.24m-4.24 9.9 4.24 4.24m-9.9-4.24-4.24 4.24"></path><circle cx="12" cy="12" r="4"></circle></svg>',
  profile:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.925 20.056a6 6 0 0 0-11.851.001"></path><circle cx="12" cy="11" r="4"></circle><circle cx="12" cy="12" r="10"></circle></svg>',
  today:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"></path><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>',
  journey:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 5q2.5 2 5 0t5 0 5 0 5 0M2 12q2.5 2 5 0t5 0 5 0 5 0M2 19q2.5 2 5 0t5 0 5 0 5 0"></path></svg>',
  care:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"></path></svg>',
  guide:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v16"></path><path d="M20.001 19A2 2 0 0 0 22 17V5a2 2 0 0 0-1.999-2L16 3.002A5 5 0 0 0 12 5a5 5 0 0 0-4-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 1.999 2H8a5 5 0 0 1 4 2 5 5 0 0 1 4-2z"></path></svg>',
  check:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="m16 9-5.5 5.5L8 12"></path></svg>',
  recap:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 5h4M20 3v4"></path><path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"></path></svg>',
  task:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 10.01h.01M10 14.01h.01M14 10.01h.01M14 14.01h.01M18 6v12M6 6v12"></path><rect x="2" y="6" width="20" height="12" rx="2"></rect></svg>',
  privacy:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path><path d="m9 12 2 2 4-4"></path></svg>',
  reset:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>',
  trash:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 11v6M14 11v6M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
  backup:'<svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M3 12a9 3 0 0 0 5 2.69M21 9.3V5M3 5v14a9 3 0 0 0 6.47 2.88M12 12v4h4M13 20a5 5 0 0 0 9-3 4.5 4.5 0 0 0-4.5-4.5c-1.33 0-2.54.54-3.41 1.41L12 16"></path></svg>',
  wind:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.8 19.6A2 2 0 1 0 14 16H2M17.5 8a2.5 2.5 0 1 1 2 4H2M9.8 4.4A2 2 0 1 1 11 8H2"></path></svg>',
  moon:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 5h4M20 3v4"></path><path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"></path></svg>',
  brain:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 18V5M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5M17.997 5.125a4 4 0 0 1 2.526 5.77M18 18a4 4 0 0 0 2-7.464M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517M6 18a4 4 0 0 1-2-7.464M6.003 5.125a4 4 0 0 0-2.526 5.77"></path></svg>',
  heartPulse:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5M3.22 13H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"></path></svg>',
  person:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="1"></circle><path d="m9 20 3-6 3 6M6 8l6 2 6-2M12 10v4"></path></svg>',
  flask:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2M6.453 15h11.094M8.5 2h7"></path></svg>',
  ruler:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0ZM14.5 12.5l2-2M11.5 9.5l2-2M8.5 6.5l2-2M17.5 15.5l2-2"></path></svg>',
  calculator:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect width="16" height="20" x="4" y="2" rx="2"></rect><path d="M8 6h8M16 14v4M16 10h.01M12 10h.01M8 10h.01M12 14h.01M8 14h.01M12 18h.01M8 18h.01"></path></svg>',
  grid:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18M3 12h18"></path><rect x="3" y="3" width="18" height="18" rx="2"></rect></svg>'
};
IC.today=PULSE_IC.today;
IC.journey=PULSE_IC.journey;
IC.care=PULSE_IC.care;
IC.guide=PULSE_IC.guide;

const TWILIGHT_IC = {
  /* Legacy key names now point to licensed Lucide assets for visual consistency. */
  flame:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4"></path></svg>',
  moon:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"></path></svg>',
  cloud:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path></svg>',
  bolt:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.914 4a1.5 1.5 0 0 0-2.474-1.561l-9 9A1.5 1.5 0 0 0 5.5 14h4.002a.5.5 0 0 1 .471.666L8.086 20a1.5 1.5 0 0 0 2.475 1.56l9-9A1.5 1.5 0 0 0 18.5 10h-3.997a.5.5 0 0 1-.472-.667z"></path></svg>',
  heart:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"></path></svg>',
  horizon:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2v8M4.93 10.93l1.41 1.41M2 18h2M20 18h2M19.07 10.93l-1.41 1.41M22 22H2M8 6l4-4 4 4M16 18a4 4 0 0 0-8 0"></path></svg>',
  cycle:PULSE_IC.reset,
  pill:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"></path><path d="m8.5 8.5 7 7"></path></svg>',
  lab:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2M6.453 15h11.094M8.5 2h7"></path></svg>',
  calendar:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 2v3M16 2v3"></path><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M3 9h18M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01M16 17h.01"></path></svg>',
  trend:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 7h6v6M22 7l-8.5 8.5-5-5L2 17"></path></svg>',
  document:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2zM14 2v5a1 1 0 0 0 1 1h5M10 9H8M16 13H8M16 17H8"></path></svg>',
  sun:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path></svg>'
};
const SYM_IC = {
  mood:TWILIGHT_IC.heart,
  anx:TWILIGHT_IC.cloud,
  fog:TWILIGHT_IC.cloud,
  joint:TWILIGHT_IC.bolt,
  dry:TWILIGHT_IC.horizon,
  uri:TWILIGHT_IC.cycle,
  energy:TWILIGHT_IC.bolt,
  head:TWILIGHT_IC.cloud,
  palp:TWILIGHT_IC.heart,
  itch:TWILIGHT_IC.sun,
  libido:TWILIGHT_IC.heart
};
const SYM_DISPLAY = {
  mood:'Low mood', anx:'Anxiety', fog:'Brain fog', joint:'Joint pain',
  dry:'Dryness', uri:'Bladder', energy:'Fatigue', head:'Headache',
  palp:'Palpitations', itch:'Skin', libido:'Low libido'
};

const TOOL_CATALOG = [
  {id:'breath', name:'Paced breathing', short:'Breathe', description:'Settle into a slow, steady breathing rhythm.', group:'Quick relief', icon:PULSE_IC.wind},
  {id:'pmr', name:'Progressive muscle relaxation', short:'Release tension', description:'Work through tension one area at a time.', group:'Quick relief', icon:PULSE_IC.person},
  {id:'phq9', name:'PHQ-9 mood check', short:'Mood check', description:'A standard nine-question mood screen.', group:'Check in', icon:PULSE_IC.heartPulse},
  {id:'gad7', name:'GAD-7 anxiety check', short:'Anxiety check', description:'A standard seven-question anxiety screen.', group:'Check in', icon:PULSE_IC.brain},
  {id:'sleepwin', name:'Sleep window calculator', short:'Plan sleep', description:'Estimate a steadier time-in-bed window.', group:'Plan & learn', icon:PULSE_IC.moon},
  {id:'protein', name:'Protein calculator', short:'Protein target', description:'Turn your weight and goal into a daily target.', group:'Plan & learn', icon:PULSE_IC.calculator},
  {id:'trigger', name:'28-day trigger test', short:'Test a trigger', description:'Run one structured personal experiment.', group:'Plan & learn', icon:PULSE_IC.flask},
  {id:'waist', name:'Waist reference', short:'Waist guide', description:'Put a measurement into clinical context.', group:'Plan & learn', icon:PULSE_IC.ruler}
];
const TODAY_TOOL_IDS = ['breath','pmr','phq9'];
const GUIDE_TOOL_IDS = ['breath','pmr','sleepwin','trigger'];

let curDate = todayISO();
let curTab = 'today';
let returnTab = 'today';
let sheetStack = [];
let sheetReturnStack = [];
let lastSheetTrigger = null;
let checkinComplete = false;
let guideQuery = '';
let reportRange = 90;
let treatmentChangeTarget = null;
const APP_VERSION = '1.1.0';

/* ---------- tiny helpers ---------- */
const $ = s => document.querySelector(s);
function h(tag, attrs, inner){
  const a = Object.entries(attrs||{}).map(([k,v])=>v==null?'':' '+k+'="'+esc(v)+'"').join('');
  return '<'+tag+a+'>'+(inner==null?'':inner)+'</'+tag+'>';
}
function toast(msg){
  const old=$('.fab-note'); if(old) old.remove();
  const el=document.createElement('div'); el.className='fab-note'; el.setAttribute('role','status');
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
function getPath(obj, path){
  return path.split('.').reduce((o,k)=> (o==null?undefined:o[k]), obj);
}

/* ---------- scale / chip builders ---------- */
function scaleRow(path, labels, cur, min, groupLabel){
  min = min==null?0:min;
  groupLabel=groupLabel||'Severity';
  let b='';
  for(let i=min;i<labels.length+min;i++){
    const level=i-min;
    b += h('button',{class:'scale-choice','data-act':'set','data-k':path,'data-v':i,
      'aria-pressed':cur===i?'true':'false','aria-label':groupLabel+': '+labels[level]},
      '<span class="scale-dot fill-'+level+(cur===i?' on':'')+'" aria-hidden="true"></span>');
  }
  return '<div class="scale" role="group" aria-label="'+esc(groupLabel)+'">'+b+'</div><div class="scale-legend" aria-hidden="true"><span>'+esc(labels[0])+'</span><span>'+esc(labels[labels.length-1])+'</span></div>';
}
function chip(path, label, on){
  return h('button',{class:'chip','data-act':'toggle','data-k':path,'aria-pressed':on?'true':'false'}, esc(label));
}
function twilightHeader(title, subtitle){
  return '<div class="tw-status"><span>'+new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})+'</span><span>MENOCOMPASS</span></div>'
    +'<div class="tw-heading tw-page-heading"><h1>'+esc(title)+'</h1><p>'+esc(subtitle)+'</p></div>';
}
function proteinChoices(current, target){
  const met=current===true || current===1;
  const missed=current===false || current===0;
  return h('button',{class:'chip','data-act':'set','data-k':'nut.prot','data-v':1,'aria-pressed':met?'true':'false'},
      esc('Met protein target'+(target?' ('+target.grams+'g)':'')))
    + h('button',{class:'chip','data-act':'set','data-k':'nut.prot','data-v':0,'aria-pressed':missed?'true':'false'},
      'Missed target')
    + ((met||missed) ? h('button',{class:'chip','data-act':'set','data-k':'nut.prot','data-v':''},'Clear') : '');
}

/* ============================================================
   TODAY
   ============================================================ */
function viewToday(){
  const e = DB.entries[curDate] || {sym:{},act:{},nut:{}};
  const sym = e.sym||{}, act=e.act||{}, nut=e.nut||{};
  const t = todayISO();
  let days='';
  for(let i=13;i>=0;i--){
    const d=addDays(t,-i), dd=parseISO(d);
    days += h('button',{'data-act':'day','data-d':d,'aria-pressed':d===curDate?'true':'false',
      class: hasData(d)?'has':'', 'aria-label':fmtLong(d)},
      '<span>'+DOW[dd.getDay()]+'</span><b>'+dd.getDate()+'</b>');
  }
  const pt = proteinTarget();
  const b = burden(e);

  return `
  <div class="view jc-screen jc-details today-view">
    ${jcChrome('Check-in')}${jcHeading('More detail','Sleep, body, movement, and lifestyle stay in today’s draft.',fmtLong(curDate))}
    <div class="dayscroll" role="group" aria-label="Choose a day">${days}</div>
    <p class="tiny muted" style="margin:6px 0 14px">${curDate===t?'Tap only what changed.':esc(fmtLong(curDate))+' · editing a past day'}</p>

    <div class="section-label day-label">Daily check-in</div>
    <div class="checkin-grid">
    <div class="card flash-card${e.hf>0?' sel':e.hf===0?' logged':''}">
      <div class="card-head"><h3><span class="title-with-icon">${TWILIGHT_IC.flame}<span>Hot flashes</span></span></h3></div>
      <div class="stepper">
        <button data-act="hf" data-n="-1" aria-label="One fewer">–</button>
        <span class="val">${e.hf==null?'–':e.hf}</span>
        <button data-act="hf" data-n="1" aria-label="One more">+</button>
      </div>
      <div class="btn-row" style="margin-top:10px;justify-content:center">
        <button class="btn ghost sm" data-act="set" data-k="hf" data-v="0">None today</button>
        <button class="btn ghost sm" data-act="set" data-k="hf" data-v="">Clear</button>
      </div>
    </div>
    <div class="card night-card${e.ns>0?' sel':e.ns===0?' logged':''}">
      <label class="fl"><span class="title-with-icon">${TWILIGHT_IC.moon}<span>Night sweats</span></span></label>
      ${scaleRow('ns', SCALE4, e.ns, 0, 'Night sweats last night')}
    </div>
    </div>

    <div class="section-label">Symptoms · 0 none → 4 very severe</div>
    <div class="symptom-grid">
      ${SYMS.filter(s=>s.k!=='sleepq').map(s=>`
        <div class="card symptom-tile${sym[s.k]>0?' sel':sym[s.k]===0?' logged':''}">
          <label class="fl symptom-name"><span class="symptom-title">${SYM_IC[s.k]||TWILIGHT_IC.cycle}<span>${esc(SYM_DISPLAY[s.k]||s.n)}</span></span></label>
          ${scaleRow('sym.'+s.k, SCALE4, sym[s.k], 0, s.n)}
        </div>`).join('')}
    </div>
    ${b!=null?`<div class="callout info burden-card"><span class="ctitle">Today's burden score: ${b} of 44</span>
      Built on the same 0–4 per-symptom structure as the Menopause Rating Scale — a way to watch direction over weeks and to show a clinician. Single days bounce around, and we deliberately don't label it mild or severe: there is no validated cut-off for this set of symptoms.</div>`:''}

    <div class="section-label">How you slept</div>
    <div class="card sleep-card">
      <div class="grid2">
        <div class="field"><label class="fl" for="inbed">Hours in bed</label>
          <input id="inbed" type="number" step="0.25" min="0" max="16" inputmode="decimal" data-act="num" data-k="inBedH" value="${e.inBedH??''}"></div>
        <div class="field"><label class="fl" for="slept">Hours asleep</label>
          <input id="slept" type="number" step="0.25" min="0" max="16" inputmode="decimal" data-act="num" data-k="sleepH" value="${e.sleepH??''}"></div>
      </div>
      <label class="fl">Sleep quality (0 = fine, 4 = terrible)</label>
      ${scaleRow('sym.sleepq', ['Fine','Slightly off','Poor','Bad','Awful'], sym.sleepq, 0, 'Sleep quality')}
      ${e.inBedH!=null&&e.inBedH>0&&e.sleepH!=null?`<p class="tiny muted" style="margin-top:10px">Sleep efficiency <b>${Math.round(e.sleepH/e.inBedH*100)}%</b>. CBT-I extends your sleep window once this passes about 85–90%.</p>`:''}
    </div>

    <div class="section-label">Body</div>
    <div class="card">
      <div class="grid2">
        <div class="field"><label class="fl" for="wt">Weight (${U.wLabel()})</label>
          <input id="wt" type="number" step="0.1" min="${U.imp?44:20}" max="${U.imp?1100:500}" inputmode="decimal" data-act="num" data-k="wt" data-conv="w" value="${e.wt!=null?r1(U.wOut(e.wt)):''}"></div>
        <div class="field"><label class="fl" for="wa">Waist (${U.lLabel()})</label>
          <input id="wa" type="number" step="0.1" min="${U.imp?12:30}" max="${U.imp?118:300}" inputmode="decimal" data-act="num" data-k="waist" data-conv="l" value="${e.waist!=null?r1(U.lOut(e.waist)):''}"></div>
      </div>
      <p class="xtiny">Waist: same landmark every time, bare skin, end of a normal exhale. Self-measurement usually reads 1–3 cm low — fine, because you are tracking change.</p>
      <hr class="sep">
      <label class="fl">${periodsPossible()?'Bleeding':'Any vaginal bleeding or spotting'}</label>
      <div class="chips">
        ${['none','spotting','light','moderate','heavy'].map(v=>h('button',{class:'chip','data-act':'set','data-k':'bleed','data-v':v,'aria-pressed':e.bleed===v?'true':'false'}, v[0].toUpperCase()+v.slice(1))).join('')}
      </div>
      ${!periodsPossible()?`<p class="xtiny">${!hasUterus()
        ? 'After a hysterectomy any bleeding is unexpected. It is usually something minor and treatable, but log it and mention it to a clinician rather than watching it.'
        : 'Your usual pattern is light or absent now, so anything new is worth logging and reporting rather than explaining away.'}</p>`:''}
    </div>

    <div class="section-label">Movement</div>
    <div class="card">
      <div class="chips" style="margin-bottom:14px">
        ${chip('act.res','Strength session', act.res)}
        ${chip('act.bal','Balance work', act.bal)}
        ${chip('act.pf','Pelvic floor', act.pf)}
      </div>
      <div class="field" style="margin-bottom:0"><label class="fl" for="aero">Aerobic minutes</label>
        <input id="aero" type="number" step="5" min="0" max="1440" inputmode="numeric" data-act="num" data-k="act.aero" value="${act.aero??''}"></div>
    </div>

    <div class="section-label">Food & drink</div>
    <div class="card">
      <div class="chips" style="margin-bottom:14px">
        ${proteinChoices(nut.prot, pt)}
        ${chip('nut.cal','2+ calcium servings', nut.cal)}
        ${chip('nut.fib','Good fibre day', nut.fib)}
      </div>
      <div class="grid2">
        <div class="field"><label class="fl" for="alc">Alcohol (drinks)</label>
          <input id="alc" type="number" step="1" min="0" max="50" inputmode="numeric" data-act="num" data-k="nut.alc" value="${nut.alc??''}"></div>
        <div class="field"><label class="fl" for="caf">Caffeine (cups)</label>
          <input id="caf" type="number" step="1" min="0" max="50" inputmode="numeric" data-act="num" data-k="nut.caf" value="${nut.caf??''}"></div>
      </div>
    </div>

    <div class="card">
      <label class="fl" for="notes">Notes</label>
      <textarea id="notes" maxlength="4000" data-act="num" data-k="notes" placeholder="Anything worth remembering — what helped, what set it off, questions for your next appointment.">${esc(e.notes||'')}</textarea>
    </div>

    ${DB.trigger&&DB.trigger.active?triggerBanner():''}

    <div class="btn-row split" style="margin-bottom:10px">
      <button class="btn ghost" data-act="sheet" data-s="redflags">Red flags</button>
      <button class="btn ghost" data-act="sheet" data-s="tools">Tools</button>
    </div>
    <button class="jc-primary" data-act="confirm-log">Confirm this log</button>
    <button class="jc-text-action" data-act="back-checkin">Back to focused check-in</button>
    <p class="xtiny center">Drafts save on this device. Only confirmation updates your patterns.</p>
  </div>`;
}

/* ============================================================
   TRENDS
   ============================================================ */
let trendRange = 30;
function viewTrends(){
  const days = rangeDates(trendRange);
  const dates = entryDates();
  if(!dates.length){
    return `<div class="view tw-screen tw-secondary">${twilightHeader('Trends','Your patterns will appear here as you log.')}
      <div class="empty tw-empty-state">
      ${IC.trends}
      <h3>Nothing to chart yet</h3>
      <p class="tiny">Fill in a check-in on the Today tab. Most patterns need about two weeks before they mean anything.</p>
      <button class="btn primary" data-act="tab" data-v="today">Start today's check-in</button>
    </div></div>`;
  }
  const hf = series(days, e=>e.hf);
  const bd = series(days, burden);
  const sq = series(days, e=>e.sym&&e.sym.sleepq!=null?4-e.sym.sleepq:null);
  const md = series(days, e=>e.sym&&e.sym.mood!=null?e.sym.mood:null);
  const wt = series(days, e=>e.wt!=null?U.wOut(e.wt):null);
  const wa = series(days, e=>e.waist!=null?U.lOut(e.waist):null);

  const hfAvg = avg(hf.map(p=>p.v));
  const hfTot = sum(hf.map(p=>p.v));
  const slAvg = avg(series(days,e=>e.sleepH).map(p=>p.v));
  const res = days.filter(d=>{const e=confirmedRecord(d);return e&&e.act&&e.act.res;}).length;
  const aero = sum(days.map(d=>{const e=confirmedRecord(d);return e&&e.act?e.act.aero:null;}));
  const logged = days.filter(hasData).length;

  const ins = insights();

  return `<div class="view tw-screen tw-secondary">${twilightHeader('Trends','Patterns from your daily check-ins — direction matters more than one day.')}
    <div class="seg" role="group" aria-label="Time range">
      ${[7,30,90].map(n=>h('button',{'data-act':'range','data-v':n,'aria-pressed':trendRange===n?'true':'false'}, n+' days')).join('')}
    </div>

    <div class="tiles" style="margin-bottom:16px">
      <div class="tile"><div class="k">Flashes/day</div><div class="v">${hfAvg!=null?r1(hfAvg):'–'}</div><div class="d">${hfTot} total</div></div>
      <div class="tile"><div class="k">Sleep</div><div class="v">${slAvg!=null?r1(slAvg):'–'}<small> h</small></div><div class="d">average</div></div>
      <div class="tile"><div class="k">Strength</div><div class="v">${res}</div><div class="d">sessions</div></div>
      <div class="tile"><div class="k">Aerobic</div><div class="v">${aero}<small> min</small></div><div class="d">${trendRange} days</div></div>
      <div class="tile"><div class="k">Days logged</div><div class="v">${logged}</div><div class="d">of ${trendRange}</div></div>
    </div>

    <div class="section-label">What stands out</div>
    ${ins.map(i=>`<div class="callout ${i.t==='alert'?'alert':i.t==='warn'?'warn':i.t==='ok'?'ok':'info'}">
      <span class="ctitle">${esc(i.h)}</span>${i.b}
      ${i.cta?`<div style="margin-top:9px"><button class="btn sm ghost" data-act="go" data-v="${esc(i.cta.go)}">${esc(i.cta.l)}</button></div>`:''}
    </div>`).join('')}

    <div class="section-label">Hot flashes per day</div>
    <div class="card">${barChart(hf,{label:'Hot flashes per day', min1:true})}
      <p class="xtiny">Counts bounce around. Read the shape of the month, not any one bar.</p></div>

    <div class="section-label">Symptom burden</div>
    <div class="card">${lineChart(bd,{label:'Symptom burden score', area:true, ma:7, min:0, max:44})}
      <div class="chart-legend"><span><i></i> daily</span><span><i class="b"></i> 7-day average</span></div>
      <p class="xtiny">0–44, on the same 0–4 per-symptom structure the Menopause Rating Scale uses. Needs at least 8 of the 11 symptoms filled in for a day to score. No severity bands: this is not the MRS item set, and no validated cut-off exists for it — read the direction, not the number.</p></div>

    <div class="section-label">Sleep quality & mood</div>
    <div class="card">${lineChart(sq,{label:'Sleep quality', min:0, max:4, ma:7})}
      <p class="xtiny" style="margin-bottom:12px">Higher is better sleep.</p>
      ${lineChart(md,{label:'Low mood', min:0, max:4, ma:7})}
      <p class="xtiny">Higher means lower mood. Two weeks of moderate-or-worse is worth a conversation, not a wait.</p></div>

    ${wt.some(p=>p.v!=null)?`<div class="section-label">Weight</div>
    <div class="card">${lineChart(wt,{label:'Weight', ma:7, area:true})}
      <div class="chart-legend"><span><i></i> daily</span><span><i class="b"></i> 7-day average</span></div>
      <p class="xtiny">Weigh at the same time of day. Follow the dashed average — daily swings are mostly water and food.</p></div>`:''}

    ${wa.some(p=>p.v!=null)?`<div class="section-label">Waist</div>
    <div class="card">${lineChart(wa,{label:'Waist circumference'})}
      <p class="xtiny">Arguably the more useful number: with waist and BMI modelled together, waist stays predictive of mortality while BMI does not.</p></div>`:''}

    <div class="btn-row split">
      <button class="btn ghost" data-act="sheet" data-s="report">Clinician report</button>
      <button class="btn ghost" data-act="sheet" data-s="data">Export data</button>
    </div>
  </div>`;
}

/* ============================================================
   LEARN
   ============================================================ */
const LEARN_MODULES = [
  {id:'stage',      i:TWILIGHT_IC.cycle, n:'Where am I?',              s:'Staging, and how menopause is actually diagnosed'},
  {id:'symptoms',   i:TWILIGHT_IC.cloud, n:'Symptom library',           s:'What is happening, how long it lasts, what helps'},
  {id:'treatment',  i:TWILIGHT_IC.pill, n:'Treatment options',         s:'Hormone therapy, non-hormonal options, absolute risks'},
  {id:'supplements',i:TWILIGHT_IC.lab, n:'Supplements & remedies',    s:'What the trials actually show — mostly not much'},
  {id:'diet',       i:TWILIGHT_IC.horizon, n:'Eating for this stage',     s:'Protein, calcium, patterns, alcohol, energy myths'},
  {id:'exercise',   i:TWILIGHT_IC.bolt, n:'Movement & strength',       s:'Resistance, bone loading, balance, pelvic floor'},
  {id:'weight',     i:TWILIGHT_IC.horizon, n:'Weight & body composition', s:'What really changes, and what works'},
  {id:'skin',       i:TWILIGHT_IC.sun, n:'Skin, hair & nails',        s:'Four things with evidence; the rest is optional'},
  {id:'sleep',      i:TWILIGHT_IC.moon, n:'Sleep',                     s:'Triage, then real CBT-I — not a hygiene checklist'},
  {id:'mind',       i:TWILIGHT_IC.heart, n:'Mood, anxiety & mind',      s:'The risk window, brain fog, techniques that work'},
  {id:'sex',        i:TWILIGHT_IC.heart, n:'Intimacy & sexual health',  s:'Options table, lubricant criteria, pain pathway'},
  {id:'screening',  i:TWILIGHT_IC.calendar, n:'Preventive care checklist', s:'Scans and screens for this decade — track them'},
  {id:'clinician',  i:TWILIGHT_IC.document, n:'Prepare for an appointment', s:'Build a question list from your own data'},
  {id:'redflags',   i:TWILIGHT_IC.flame, n:'Red flags',                  s:'Ten things that need care promptly'},
  {id:'sources',    i:TWILIGHT_IC.document, n:'Sources & what we left out', s:'Where all of this comes from'}
];
function viewLearn(){
  return `<div class="view tw-screen tw-secondary">${twilightHeader('Evidence guide','Straight answers, clear evidence, and no wellness hype.')}
    <div class="callout info"><span class="ctitle">How to read this library</span>
      Claims are tagged by evidence quality where a badge helps, and where major bodies disagree we say so rather than picking a side quietly. Reviewed July 2026.</div>
    <div class="rows">
      ${LEARN_MODULES.map(m=>h('button',{class:'row','data-act':'sheet','data-s':'learn:'+m.id},
        '<span class="ico">'+m.i+'</span><span class="txt"><b>'+esc(m.n)+'</b><span>'+esc(m.s)+'</span></span><span class="chev">'+IC.chev+'</span>')).join('')}
    </div>
    <p class="xtiny center">Education, not medical advice. Nothing here replaces a clinician who knows your history.</p>
  </div>`;
}

/* ============================================================
   YOU
   ============================================================ */
function viewYou(){
  const p = DB.profile;
  const age = p.birthYear? (new Date().getFullYear()-p.birthYear) : null;
  const pt = proteinTarget();
  const dates = entryDates();
  return `<div class="view jc-screen jc-profile">${jcChrome('Back')}${jcHeading('Profile','Your context, tracking preferences, and private data.')}
    <div class="section-label">Account &amp; data</div>
    <div class="card jc-account-card">
      <p class="tiny">${dates.length} ${dates.length===1?'day':'days'} recorded${dates.length?', from '+fmtDay(dates[0]):''}. ${Store.ephemeral?'<b>This preview cannot save to disk</b> — your entries will disappear when you close the page. Installed as an app, it saves normally.':'Stored on this device only.'}</p>
      <div class="jc-account-actions">
        <button class="btn ghost" data-act="sheet" data-s="data">${PULSE_IC.backup}<span>Export or restore data</span></button>
        ${window.__MENO_NATIVE__===true?`<button class="btn ghost" data-act="manage-subscription">${PULSE_IC.calendar}<span>Manage Apple subscription</span></button>`:''}
        <button class="btn ghost" data-act="reset-onboarding">${PULSE_IC.reset}<span>Reset onboarding</span></button>
        <button class="btn danger" data-act="delete-local-data">${PULSE_IC.trash}<span>Delete app profile &amp; data</span></button>
      </div>
      <p class="xtiny">MenoCompass does not create an online account. Reset onboarding keeps your logs and treatments. Delete permanently erases this app profile and all health data stored on this device. An Apple subscription, if active, is managed separately in App Store settings.</p>
    </div>

    <div class="card">
      <div class="card-head"><h3>${p.name?esc(p.name):'Your profile'}</h3>
        ${age?'<span class="badge">'+age+'</span>':''}</div>
      <div class="grid2">
        <div class="field"><label class="fl" for="pn">Name</label>
          <input id="pn" type="text" maxlength="80" autocomplete="given-name" data-act="prof" data-k="name" value="${esc(p.name||'')}"></div>
        <div class="field"><label class="fl" for="by">Birth year</label>
          <input id="by" type="number" min="1920" max="${new Date().getFullYear()-18}" inputmode="numeric" data-act="prof" data-k="birthYear" value="${p.birthYear||''}"></div>
      </div>
      <div class="field"><label class="fl" for="ut">Uterus (womb)</label>
        <select id="ut" data-act="prof" data-k="uterus">
          ${[['unknown','Prefer not to say'],['intact','Still there'],['hyst','Removed (hysterectomy)'],['ablation','Endometrial ablation']]
            .map(([v,l])=>`<option value="${v}"${p.uterus===v?' selected':''}>${l}</option>`).join('')}
        </select></div>
      <div class="field"><label class="fl" for="ov">Ovaries</label>
        <select id="ov" data-act="prof" data-k="ovaries">
          ${[['unknown','Prefer not to say / not sure'],['kept','Both still there'],['one','One removed'],['both','Both removed']]
            .map(([v,l])=>`<option value="${v}"${p.ovaries===v?' selected':''}>${l}</option>`).join('')}
        </select>
        <p class="xtiny">Asked separately on purpose: a hysterectomy often leaves both ovaries in place, and ovaries are sometimes removed with the uterus left. The two have completely different consequences.</p></div>
      ${periodsPossible()
        ? `<div class="field"><label class="fl" for="lp">Date of your last period</label>
           <input id="lp" type="date" min="${p.birthYear?p.birthYear+'-01-01':'1900-01-01'}" max="${todayISO()}" data-act="prof" data-k="lastPeriod" value="${p.lastPeriod||''}">
           <p class="xtiny">Used to count months without a period and to flag bleeding that needs checking.</p></div>`
        : `<div class="field"><label class="fl" for="sd">Date of your surgery, if you know it</label>
           <input id="sd" type="date" min="${p.birthYear?p.birthYear+'-01-01':'1900-01-01'}" max="${todayISO()}" data-act="prof" data-k="surgeryDate" value="${p.surgeryDate||''}">
           <p class="xtiny">${p.ovaries==='both'
              ? 'Both ovaries removed means menopause dates from this operation, so this app uses the surgery date rather than a last period.'
              : 'With no readable bleeding pattern, a last-period date would not mean anything — so this app asks for the surgery date instead. Staging should not be attempted until at least 3 months after surgery.'}</p></div>`}
      <div class="field" style="margin-bottom:0"><label class="fl" for="bn">Bone status</label>
        <select id="bn" data-act="prof" data-k="bone">
          ${[['unknown',"Don't know"],['normal','Normal density'],['osteopenia','Osteopenia'],['osteoporosis','Osteoporosis'],['fracture','Previous fragility fracture']]
            .map(([v,l])=>`<option value="${v}"${p.bone===v?' selected':''}>${l}</option>`).join('')}
        </select>
        <p class="xtiny">This gates the bone-loading advice in the movement module. Heavy impact work is not for everyone.</p></div>
    </div>

    ${p.stage?`<div class="card flat">
      <div class="card-head"><h4 style="margin:0">Your stage</h4>
        <button class="btn sm ghost" data-act="sheet" data-s="learn:stage">Redo</button></div>
      <p class="tiny" style="margin-bottom:0"><b>${esc(p.stage)}</b></p></div>`:
     `<button class="btn block primary" data-act="sheet" data-s="learn:stage" style="margin-bottom:14px">Find out where you are in the transition</button>`}

    <div class="section-label">Targets</div>
    <div class="card">
      <div class="field"><label class="fl" for="pg">Protein target (g per kg body weight)</label>
        <select id="pg" data-act="prof" data-k="proteinGpk">
          ${[[1.0,'1.0 — general older-adult floor'],[1.2,'1.2 — recommended baseline'],[1.4,'1.4 — active or losing weight'],[1.6,'1.6 — upper training range']]
            .map(([v,l])=>`<option value="${v}"${+p.proteinGpk===v?' selected':''}>${l}</option>`).join('')}
        </select>
        ${pt?`<p class="xtiny">At your latest weight that is about <b>${pt.grams} g/day</b>, roughly <b>${pt.perMeal} g</b> per meal across three meals.</p>`
             :'<p class="xtiny">Log a weight on the Today tab to see your grams.</p>'}</div>
      <div class="grid2" style="margin-bottom:0">
        <div class="field" style="margin-bottom:0"><label class="fl" for="wg">Weight goal (${U.wLabel()})</label>
          <input id="wg" type="number" step="0.1" min="${U.imp?44:20}" max="${U.imp?1100:500}" inputmode="decimal" data-act="prof" data-k="weightGoal" data-conv="w" value="${p.weightGoal!=null?r1(U.wOut(p.weightGoal)):''}"></div>
        <div class="field" style="margin-bottom:0"><label class="fl" for="wag">Waist goal (${U.lLabel()})</label>
          <input id="wag" type="number" step="0.1" min="${U.imp?12:30}" max="${U.imp?118:300}" inputmode="decimal" data-act="prof" data-k="waistGoal" data-conv="l" value="${p.waistGoal!=null?r1(U.lOut(p.waistGoal)):''}"></div>
      </div>
    </div>

    <div class="section-label">Tracking preferences</div>
    <div class="card jc-profile-tracking">
      <div class="field"><label class="fl" for="profile-intent">What would help most?</label><select id="profile-intent" data-act="prof" data-k="intent">${[['understand','Understand symptoms'],['treatment','See whether treatment helps'],['appointment','Prepare for an appointment'],['record','Keep a private record']].map(([v,l])=>`<option value="${v}"${p.intent===v?' selected':''}>${l}</option>`).join('')}</select></div>
      <p class="tiny">Focused check-in symptoms · choose 3–6</p>
      <div class="jc-pin-grid compact">${[['hf','Hot flashes'],['ns','Night sweats'],...SYMS.filter(s=>s.k!=='sleepq').map(s=>[s.k,SYM_DISPLAY[s.k]||s.n])].map(([k,label])=>`<button data-act="profile-symptom" data-v="${k}" aria-pressed="${(p.pinnedSymptoms||[]).includes(k)?'true':'false'}">${symptomIcon(k)}<span>${esc(label)}</span></button>`).join('')}</div>
    </div>

    <div class="section-label">Settings</div>
    <div class="card">
      <div class="field"><label class="fl" for="un">Units</label>
        <select id="un" data-act="prof" data-k="units">
          <option value="imperial"${p.units==='imperial'?' selected':''}>Pounds and inches</option>
          <option value="metric"${p.units==='metric'?' selected':''}>Kilograms and centimetres</option>
        </select></div>
      <div class="field"><label class="fl" for="rg">Where you are</label>
        <select id="rg" data-act="prof" data-k="region">
          <option value="us"${p.region==='us'?' selected':''}>United States</option>
          <option value="uk"${p.region==='uk'?' selected':''}>United Kingdom</option>
          <option value="other"${p.region==='other'?' selected':''}>Elsewhere</option>
        </select>
        <p class="xtiny">Guidance genuinely differs — on drug labelling, SSRIs for hot flashes, testosterone access, and calcium and vitamin D targets.</p></div>
      <div class="jc-setting-note" style="margin-bottom:0"><span class="fl">Appearance</span><strong>Guided daily pulse</strong><p class="xtiny">A calm, high-contrast theme built around one clear next step.</p></div>
    </div>

    <div class="card flat">
      <h4>Privacy, plainly</h4>
      <p class="tiny">Your health entries stay in this browser's storage on this device. The app has no account, health-data API, or sync service and does not transmit what you log. The native app sends limited performance and advertising-attribution data—never symptoms, medications, labs, notes, profile answers, or reports—to Expo, AppsFlyer, Meta, TikTok, and RevenueCat as described in the Privacy Policy. External source links contact those sites only when you open them. Browser storage is not encrypted by this app, so someone with access to this browser profile may be able to open it. <b>Clearing site data deletes your entries</b>, and they do not sync between devices. Export a backup now and then.</p>
      <h4 style="margin-top:14px">Medical disclaimer</h4>
      <p class="tiny">This app provides general health education compiled from published clinical guidelines. It does not diagnose, treat or prescribe, is not a substitute for professional medical advice, and is <b>not a medical device or regulator-reviewed clinical tool</b>. Guideline content was reviewed in <b>July 2026</b> and this field moves quickly. Always talk to a qualified clinician about your own situation, and seek care promptly for anything on the red-flag list.</p>
    </div>
    <p class="xtiny center" style="margin-bottom:20px">MenoCompass ${APP_VERSION} · content reviewed July 2026</p>
  </div>`;
}

/* ============================================================
   SHEETS
   ============================================================ */
function setBackgroundInert(on){
  ['#app','#topbar','#tabs'].forEach(selector=>{
    const el=$(selector); if(!el) return;
    if(on){ el.setAttribute('inert',''); el.setAttribute('aria-hidden','true'); }
    else { el.removeAttribute('inert'); el.removeAttribute('aria-hidden'); }
  });
}
function focusDescriptor(el){
  return el ? {node:el,tag:el.tagName.toLowerCase(),data:Object.assign({},el.dataset)} : null;
}
function findFocusTarget(desc,root){
  if(!desc) return null;
  if(desc.node&&desc.node.isConnected) return desc.node;
  return [...(root||document).querySelectorAll(desc.tag)].find(el=>
    Object.entries(desc.data).every(([key,value])=>el.dataset[key]===value)
  )||null;
}
function openSheet(id){
  if(id==='report'){
    if(requestNativePro('appointment-report')) return;
    returnTab=curTab; setRoute('appointment-report'); sheetStack=[]; renderSheet(); render(); return;
  }
  if(requestNativePro(id)) return;
  if(id==='learn:stage' && !DB.profile.stage && !stageEditing) resetStageDraft();
  if(!sheetStack.length) lastSheetTrigger=focusDescriptor(document.activeElement);
  else {
    const parentSheet=$('.sheet');
    sheetReturnStack.push({
      trigger:focusDescriptor(document.activeElement),
      scrollTop:parentSheet?parentSheet.scrollTop:0,
      parentTitle:($('#sheet-title')&&$('#sheet-title').textContent)||'previous screen'
    });
  }
  sheetStack.push(id); renderSheet(true);
}
function closeSheet(){
  const returnState=sheetStack.length>1?sheetReturnStack.pop():null;
  const closing=sheetStack.pop();
  if(closing==='learn:stage'){
    stageAns={}; stageStep=0; stageEditing=false;
    render(true);
    if(DB.profile.onboarded) postNativeEvent('onboarding-finished');
  }
  runSheetHooks(sheetStack[sheetStack.length-1]||'');
  renderSheet(true,returnState);
}
function renderSheet(moveFocus,returnState){
  const host = $('#sheet-host');
  if(!sheetStack.length){
    runSheetHooks(''); sheetReturnStack=[];
    host.innerHTML=''; document.body.style.overflow=''; setBackgroundInert(false);
    const target=lastSheetTrigger; lastSheetTrigger=null;
    setTimeout(()=>{
      const candidate=findFocusTarget(target,document);
      const restored=(candidate&&candidate!==document.body?candidate:null)
        ||document.querySelector('#app button,#app input,#app select,#tabs button');
      if(restored) restored.focus();
    },0);
    return;
  }
  const previous=host.contains(document.activeElement) ? focusDescriptor(document.activeElement) : null;
  const id = sheetStack[sheetStack.length-1];
  const {title, body} = sheetContent(id);
  const parentState=sheetReturnStack[sheetReturnStack.length-1];
  const nested=sheetStack.length>1;
  const dismissLabel=nested?'Back to '+(parentState&&parentState.parentTitle||'previous screen'):'Close '+title;
  setBackgroundInert(true);
  host.innerHTML = `<div class="sheet-bg" data-act="bg">
    <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" tabindex="-1">
      <div class="sheet-bar"><h2 id="sheet-title">${esc(title)}</h2><button class="close-btn" data-act="close" aria-label="${esc(dismissLabel)}">${nested?'Back':'Close'}</button></div>
      ${body}
    </div></div>`;
  document.body.style.overflow='hidden';
  const s = host.querySelector('.sheet'); if(s) s.scrollTop=returnState?returnState.scrollTop:0;
  runSheetHooks(id);
  if(s) setTimeout(()=>{
    let target=null;
    if(returnState){
      target=findFocusTarget(returnState.trigger,s);
    } else if(id==='learn:stage'){
      target=s.querySelector('.stage-focus-target');
    } else if(!moveFocus && previous){
      target=findFocusTarget(previous,s);
      if(!target) target=s.querySelector('[data-act]:not(.xbtn)');
    }
    if(moveFocus&&!target) target=s.querySelector('.xbtn,button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled])');
    (target||s).focus();
  },0);
}

function keepFocusInSheet(ev){
  if(!sheetStack.length) return;
  if(ev.key==='Escape'){ ev.preventDefault(); closeSheet(); return; }
  if(ev.key!=='Tab') return;
  const sheet=$('.sheet'); if(!sheet) return;
  const focusable=[...sheet.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')]
    .filter(el=>el.getClientRects().length && getComputedStyle(el).visibility!=='hidden');
  if(!focusable.length){ ev.preventDefault(); sheet.focus(); return; }
  const first=focusable[0], last=focusable[focusable.length-1];
  if(document.activeElement===sheet){ ev.preventDefault(); (ev.shiftKey?last:first).focus(); }
  else if(ev.shiftKey && document.activeElement===first){ ev.preventDefault(); last.focus(); }
  else if(!ev.shiftKey && document.activeElement===last){ ev.preventDefault(); first.focus(); }
  else if(!sheet.contains(document.activeElement)){ ev.preventDefault(); first.focus(); }
}

function toolInfo(id){ return TOOL_CATALOG.find(tool=>tool.id===id); }
function quickToolsMarkup(surface){
  const toolCount=TOOL_CATALOG.length;
  const tools=(surface==='guide'?GUIDE_TOOL_IDS:TODAY_TOOL_IDS).map(toolInfo).filter(Boolean);
  if(surface==='guide'){
    return `<section class="jc-toolkit" aria-labelledby="guide-toolkit-title">
      <div class="jc-toolkit-head"><div><h2 id="guide-toolkit-title">Tools for right now</h2><p>Focused tools for relief, check-ins, and planning.</p></div><button data-act="sheet" data-s="tools" aria-label="See all ${toolCount} tools">See all ${toolCount}</button></div>
      <div class="jc-toolkit-grid">${tools.map(tool=>`<button class="jc-tool-card" data-act="sheet" data-s="tool:${tool.id}" aria-label="${esc(tool.short)} — open ${esc(tool.name)}"><span class="jc-tool-card-icon">${tool.icon}</span><span><b>${esc(tool.short)}</b><small>${esc(tool.description)}</small></span></button>`).join('')}</div>
    </section>`;
  }
  return `<section class="dc-tools" aria-labelledby="today-tools-title">
    <div class="dc-tools-head"><h2 id="today-tools-title">Quick tools</h2><button data-act="sheet" data-s="tools" aria-label="See all ${toolCount} tools">See all ${toolCount}</button></div>
    <div class="dc-tool-grid">${tools.map(tool=>`<button class="dc-tool" data-act="sheet" data-s="tool:${tool.id}" aria-label="${esc(tool.short)} — open ${esc(tool.name)}"><span>${tool.icon}</span><b>${esc(tool.short)}</b></button>`).join('')}</div>
  </section>`;
}
function toolsLibraryBody(){
  const groups=['Quick relief','Check in','Plan & learn'];
  return `<div class="jc-tools-intro"><strong>Use what helps right now.</strong><p>${TOOL_CATALOG.length} focused tools for relief, self-checks, and planning. Results stay on this device.</p></div>
    <div class="jc-tools-library">${groups.map(group=>`<section><h3>${esc(group)}</h3>${TOOL_CATALOG.filter(tool=>tool.group===group).map(tool=>`<button class="jc-tool-row" data-act="sheet" data-s="tool:${tool.id}"><span class="jc-tool-row-icon">${tool.icon}</span><span><b>${esc(tool.name)}</b><small>${esc(tool.description)}</small></span><span class="chev">${IC.chev}</span></button>`).join('')}</section>`).join('')}</div>`;
}

function sheetContent(id){
  if(id.startsWith('learn:')) return learnSheet(id.slice(6));
  if(id.startsWith('tool:'))  return toolSheet(id.slice(5));
  if(id==='redflags') return learnSheet('redflags');
  if(id==='screening') return learnSheet('screening');
  if(id==='tools') return {title:'Tools', body:toolsLibraryBody()};
  if(id==='data') return dataSheet();
  if(id==='reset-onboarding-confirm') return resetOnboardingSheet();
  if(id==='delete-local-data-confirm') return deleteLocalDataSheet();
  if(id==='report') return reportSheet();
  return {title:'', body:''};
}

function learnSheet(k){
  const m = LEARN_MODULES.find(x=>x.id===k) || {n:''};
  let body='';
  switch(k){
    case 'stage': body = stageSheetBody(); break;
    case 'symptoms':
      body = `<p class="tiny muted">Tap a symptom. Each card gives the prevalence and duration data, what has evidence, and what is being over-claimed.</p>
      <div class="rows">${SYMPTOMS.map(s=>h('button',{class:'row','data-act':'sheet','data-s':'learn:sym-'+s.id},
        '<span class="txt"><b>'+esc(s.name)+'</b><span>'+esc(s.quick)+'</span></span><span class="chev">'+IC.chev+'</span>')).join('')}</div>`;
      break;
    case 'treatment':   body = regionNote() + uterusNote() + TREATMENT_HTML; break;
    case 'supplements':
      body = regionNote() + SUPPLEMENTS_INTRO + SUPPLEMENTS.map(s=>`<details class="acc"><summary>
        <span style="flex:1">${esc(s.n)}</span> <span class="badge ${s.v}">${s.v==='strong'?'Good evidence':s.v==='moderate'?'Moderate':s.v==='mixed'?'Mixed':'No evidence'}</span></summary>
        <div><p style="margin-bottom:0">${s.s}</p></div></details>`).join('');
      break;
    case 'diet':      body = regionNote() + DIET_HTML; break;
    case 'exercise':  body = boneGate() + EXERCISE_HTML; break;
    case 'weight':    body = WEIGHT_HTML; break;
    case 'skin':      body = SKIN_HTML; break;
    case 'sleep':     body = SLEEP_HTML; break;
    case 'mind':      body = MIND_HTML; break;
    case 'sex':       body = SEX_HTML; break;
    case 'screening': body = screeningBody(); break;
    case 'clinician': body = clinicianBody(); break;
    case 'redflags':  body = redflagBody(); break;
    case 'sources':   body = SOURCES_HTML; break;
    default:
      if(k.startsWith('sym-')){
        const s = SYMPTOMS.find(x=>x.id===k.slice(4));
        if(s) return {title:s.name, body:'<p class="pill-note">'+esc(s.tag)+'</p>'+s.body};
      }
  }
  return {title:m.n||'', body};
}

/* Personalised note on endometrial protection, driven by the profile.
   This is the one place where "do you have a uterus" changes the answer
   rather than just the framing. */
function uterusNote(){
  const u = DB.profile.uterus;
  if(u==='hyst') return `<div class="callout ok"><span class="ctitle">You have told us your uterus was removed</span>
  So the progestogen section below does not apply to you. With no lining to protect, <b>oestrogen-only therapy is what is used</b> — and that avoids the component carrying most of the extra breast cancer signal. Over five years at ages 50–59, oestrogen-only estimates run from <b>6 fewer</b> to <b>3 extra</b> cases per 1,000 women, against <b>+8 to +10</b> for combined therapy. The endometrial cancer numbers in the risk table are also irrelevant to you.</div>`;
  if(u==='ablation') return `<div class="callout warn"><span class="ctitle">You have told us you had an endometrial ablation</span>
  You still have your uterus, so <b>you still need a progestogen alongside systemic oestrogen</b>. An ablation is not a substitute for endometrial protection — the lining can regenerate in patches. Read the progestogen section below as applying to you.</div>`;
  if(u==='intact') return `<div class="callout info"><span class="ctitle">You have your uterus</span>
  So the progestogen section below applies to you: anyone with a uterus taking systemic oestrogen needs endometrial protection. It is worth reading properly — the choice between continuous and sequential, and between progestogen types, is one of the genuinely unsettled areas.</div>`;
  return '';
}

/* Region-specific heads-up, driven by the profile setting. */
function regionNote(){
  const r = DB.profile.region;
  if(r==='uk') return `<div class="callout warn"><span class="ctitle">You have set your region to the UK</span>
  Three things differ for you. <b>Drug labelling:</b> the November 2025 US boxed-warning removal has no verified UK equivalent — UK product information still reflects the earlier MHRA risk tables. <b>Non-hormonal options:</b> NICE says do <i>not</i> routinely offer SSRIs or SNRIs as first-line for hot flashes alone, where the US Menopause Society lists them as recommended. <b>Nutrient targets:</b> the British Menopause Society uses 700 mg calcium with normal bone density (1,200 mg with osteopenia or osteoporosis) and 400 IU vitamin D — not the US figures on these pages.</div>`;
  if(r==='other') return `<div class="callout warn"><span class="ctitle">You are outside the US and UK</span>
  This library is built on US and UK guidance, and drug approvals, labelling, nutrient targets and screening programmes vary by country. Treat the evidence as transferable and the specifics as local — worth confirming with a clinician where you are.</div>`;
  return '';
}
function boneGate(){
  const b = DB.profile.bone;
  if(b==='osteoporosis'||b==='fracture'){
    return `<div class="callout alert"><span class="ctitle">Tailored to what you told us</span>
    You recorded ${b==='fracture'?'a previous fragility fracture':'osteoporosis'}. <b>Skip the high-impact and heavy-loading advice below</b> and read the "Too Fit To Fracture" rules instead: moderate loads, form over intensity, no jumping or running, and no loaded spinal bending or twisting. Ask for a physiotherapy referral — that is the standard recommendation for your situation, not a hedge.</div>`;
  }
  if(b==='unknown'){
    return `<div class="callout warn"><span class="ctitle">You have not recorded your bone status</span>
    Until you know it, treat the heavy-loading and impact sections below with caution. Bone loss averages 10–12% at spine and hip across the transition, and the safe programme differs a lot depending on where you are. Set it in your profile once you know.</div>`;
  }
  return '';
}

/* ---------- staging ---------- */
let stageAns = {};
let stageStep = 0;
let stageEditing = false;

function resetStageDraft(){
  stageAns={};
  stageStep=0;
  stageEditing=true;
  const age=ageStageAnswer(DB.profile.birthYear);
  if(age){
    stageAns.age=age;
    stageStep=1;
  }
}

function stageAnswerAllowed(q, value){
  return q && q.a.some(a=>a.v===value);
}
function completeStageAnswers(ans){
  if(!ans || typeof ans!=='object') return false;
  const qs=stageQueue(ans);
  return qs.length>0 && qs.every(q=>stageAnswerAllowed(q,ans[q.id]));
}
function ageStageAnswer(birthYear){
  if(birthYear==null || birthYear==='' || !Number.isInteger(+birthYear)) return null;
  const age=new Date().getFullYear()-(+birthYear);
  return age<40?'u40':age<45?'40s_e':age<55?'45p':'55p';
}
function surgeryStageAnswer(date){
  if(!pastOrTodayISO(date)) return 'unsure';
  const days=daysBetween(date,todayISO());
  return days<92?'lt3m':days<365?'lt1y':days<=Math.round(5*365.25)?'1to5':'gt5';
}
function storeStageAssessment(ans){
  const p=DB.profile;
  const clean={};
  STAGE_Q.forEach(q=>{ if(stageAnswerAllowed(q,ans[q.id])) clean[q.id]=ans[q.id]; });
  p.uterus=clean.uterus==='unsure'?'unknown':clean.uterus;
  p.ovaries=clean.ovaries==='unsure'?'unknown':clean.ovaries;
  const res=stageResult(clean);
  p.stage=res.label;
  p.stageAnswers=clean;
  p.onboardingDeferred=false;
  /* Older versions persisted rendered HTML here. Results are now derived
     from the structured answers so updated guidance renders immediately. */
  delete p.stageResult;
  return res;
}
function invalidateStage(){
  DB.profile.stage=null;
  DB.profile.stageAnswers=null;
  delete DB.profile.stageResult;
}
function refreshStageForProfile(key){
  const p=DB.profile;
  delete p.stageResult;
  if(!p.stage || !p.stageAnswers) return;
  const ans=Object.assign({},p.stageAnswers);
  if(key==='uterus') ans.uterus=p.uterus==='unknown'?'unsure':p.uterus;
  else if(key==='ovaries') ans.ovaries=p.ovaries==='unknown'?'unsure':p.ovaries;
  else if(key==='birthYear'){
    const age=ageStageAnswer(p.birthYear);
    if(!age){ invalidateStage(); return; }
    ans.age=age;
  } else if(key==='surgeryDate'){
    ans.surgWhen=surgeryStageAnswer(p.surgeryDate);
  } else if(key==='lastPeriod'){
    /* A date alone cannot tell regularity, variability, or skipped-cycle
       history. Re-asking is safer than retaining a contradictory label. */
    invalidateStage(); return;
  } else return;

  if(!completeStageAnswers(ans)){ invalidateStage(); return; }
  const res=stageResult(ans);
  p.stage=res.label;
  p.stageAnswers=ans;
}
function stageResultView(res,justCompleted){
  const firstParagraph=res.body.match(/<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/i);
  const intro=firstParagraph
    ? '<p>'+firstParagraph[1]+'</p>'
    : '<p>Your answers point to this result. Open the detailed explanation for more context.</p>';
  const actions=justCompleted
    ? '<div class="btn-row split stage-result-actions"><button class="btn ghost" data-act="stage-restart">Start again</button><button class="btn primary" data-act="close">Done</button></div>'
    : '<button class="btn block ghost stage-result-actions" data-act="stage-restart">Answer the questions again</button>';
  return `<div class="callout ok stage-result-summary"><h3 class="ctitle stage-focus-target" tabindex="-1">${esc(res.label)}</h3>${intro}</div>
  ${res.flags.map(f=>'<div class="callout warn">'+f+'</div>').join('')}
  ${actions}
  <details class="acc"><summary>Read your full result</summary><div>${res.body}</div></details>
  <details class="acc"><summary>How menopause is diagnosed</summary><div>${STAGE_CAVEAT}</div></details>`;
}
function stageSheetBody(){
  const p = DB.profile;
  if(Object.prototype.hasOwnProperty.call(p,'stageResult')){
    delete p.stageResult;
    save();
  }
  if(p.stage && !completeStageAnswers(p.stageAnswers)){
    invalidateStage();
    save();
  }
  if(p.stage && !stageEditing){
    const res = stageResult(p.stageAnswers);
    return stageResultView(res,false);
  }
  if(!stageEditing) resetStageDraft();
  const qs = stageQueue(stageAns);
  if(stageStep>=qs.length){
    const res = storeStageAssessment(stageAns);
    save();
    return stageResultView(res,true);
  }
  const q = qs[stageStep];
  return `<p class="xtiny stage-step" aria-live="polite">Question ${stageStep+1} · tailored to your history</p>
  <h3 class="stage-focus-target" tabindex="-1">${esc(q.q)}</h3>
  ${q.note?`<p class="tiny muted">${esc(q.note)}</p>`:''}
  <div class="rows" style="margin-top:14px">
    ${q.a.map(a=>h('button',{class:'row','data-act':'stage-a','data-k':q.id,'data-v':a.v},
      '<span class="txt"><b>'+esc(a.t)+'</b></span><span class="chev">'+IC.chev+'</span>')).join('')}
  </div>
  ${stageStep>0?'<button class="btn ghost sm" data-act="stage-back">Back</button>':''}
  <p class="xtiny" style="margin-top:14px">Based on the STRAW+10 international staging system. This is orientation, not a diagnosis.</p>`;
}

/* ---------- screening ---------- */
function screeningIntervalLabel(id, years){
  if(id==='cervical') return years===3?'3 years — cytology':'5 years — HPV testing / co-test';
  if(id==='colon') return years===1?'1 year — FIT / annual review'
    : years===3?'3 years — stool DNA-FIT'
    : years===5?'5 years — CT colonography / sigmoidoscopy'
    : '10 years — colonoscopy';
  return years+' years';
}
function screeningBody(){
  const age = DB.profile.birthYear ? new Date().getFullYear()-DB.profile.birthYear : null;
  const nonUS = DB.profile.region && DB.profile.region!=='us';
  return `<div class="callout info"><span class="ctitle">US intervals, and one honest gap</span>
  These are current US Preventive Services Task Force and society recommendations${age?', relevant to you at '+age:''}. We have deliberately not published a blood-pressure or lipid interval, because we could not verify the current one — ask your clinician rather than trusting a number we guessed.</div>
  ${nonUS?`<div class="callout warn"><span class="ctitle">You are outside the US — these intervals will not match your programme</span>
  Screening ages, intervals and invitation systems differ substantially outside the US, and many countries run national invitation programmes instead. Use this page as a prompt to ask what <i>your</i> programme covers, and record the dates you were actually seen.</div>`:''}
  ${SCREENING.map(s=>{
    const rec = DB.screening[s.id]||{};
    const rule=SCREENING_RULES[s.id];
    const status=rule?screeningStatus(s.id,age):{due:false};
    const validLast=pastOrTodayISO(rec.last);
    const intervals=rule?screeningIntervals(rule,age):[];
    const selected=intervals.includes(+rec.intervalYears) ? +rec.intervalYears : (rule?rule.defaultYears:null);
    const badge=status.due
      ? '<span class="badge warn">due to check</span>'
      : validLast?'<span class="badge strong">'+fmtDay(rec.last)+'</span>':'';
    return `<details class="acc"><summary><span style="flex:1">${esc(s.n)}</span>${badge}</summary>
    <div>
      <p class="tiny"><b>${esc(s.w)}</b></p>
      <p class="tiny">${s.d}</p>
      <label class="fl" for="sc-${s.id}">Date you last had this</label>
      <input id="sc-${s.id}" type="date" min="${DB.profile.birthYear?DB.profile.birthYear+'-01-01':'1900-01-01'}" max="${todayISO()}" data-act="screen" data-k="${s.id}" value="${validLast?rec.last:''}">
      ${intervals.length>1?`<label class="fl" for="sci-${s.id}" style="margin-top:10px">Reminder interval for the test you had</label>
        <select id="sci-${s.id}" data-act="screen-int" data-k="${s.id}">
          ${intervals.map(y=>`<option value="${y}"${selected===y?' selected':''}>${esc(screeningIntervalLabel(s.id,y))}</option>`).join('')}
        </select>`:''}
    </div></details>`;
  }).join('')}
  <p class="xtiny">Recording dates here is just for your own reference — it does not book anything, and nothing is sent anywhere. Reminder intervals are prompts, not a substitute for the schedule your clinician gives you.</p>`;
}

/* ---------- red flags ---------- */
function redflagBody(){
  return `<div class="callout alert"><span class="ctitle">Some symptoms need emergency help now</span>
  Call your local emergency number now for chest pressure or pain, sudden severe trouble breathing, signs of a stroke, fainting with severe symptoms, or immediate danger. Use <b>911</b> in the US or Canada, <b>999</b> in the UK, or <b>112</b> in the EU. Do not drive yourself. The other items below need prompt clinical advice even when they are not emergencies.</div>
  ${REDFLAGS.map(r=>`<details class="acc"><summary><span style="flex:1">${esc(r.n)}</span></summary><div><p style="margin-bottom:0">${r.why}</p></div></details>`).join('')}
  <div class="callout warn"><span class="ctitle">If you are thinking about harming yourself</span>
  If you may act on these thoughts, have a plan, or cannot stay safe, call emergency services or go to the nearest emergency department now, and do not stay alone. In the US, call or text <a href="https://988lifeline.org/" target="_blank" rel="noopener noreferrer">988</a>. In the UK or Republic of Ireland, call <a href="https://www.samaritans.org/how-we-can-help/contact-samaritan/" target="_blank" rel="noopener noreferrer">Samaritans on 116 123</a>. Elsewhere, use <a href="https://findahelpline.com/" target="_blank" rel="noopener noreferrer">Find A Helpline</a>. You do not have to explain yourself perfectly.</div>`;
}

/* ---------- clinician prep ---------- */
function clinicianBody(){
  const dates = entryDates();
  const d30 = rangeDates(30);
  const hfAvg = avg(series(d30,e=>e.hf).map(p=>p.v));
  const bdAvg = avg(series(d30,burden).map(p=>p.v));
  const last = DB.scores.slice(-4).reverse();
  return `<p class="tiny muted">Pick the topics that apply. The questions are phrased to get you specific answers rather than reassurance — and they signal that you have read the guidelines, which changes the conversation.</p>
  <div class="callout ok"><span class="ctitle">Bring your numbers</span>
  <ul class="plain tiny" style="margin-bottom:0">
    <li>${dates.length} days logged${dates.length?', from '+fmtDay(dates[0]):''}</li>
    ${hfAvg!=null?'<li>Hot flashes averaging <b>'+r1(hfAvg)+'/day</b> over the last month</li>':''}
    ${bdAvg!=null?'<li>Symptom burden averaging <b>'+r1(bdAvg)+' of 44</b> across 11 tracked symptoms</li>':''}
    ${last.length?'<li>Recent scores: '+last.map(s=>s.type.toUpperCase()+' '+s.score+' ('+fmtDay(s.date)+')').join(', ')+'</li>':''}
  </ul>
  <div style="margin-top:9px"><button class="btn sm ghost" data-act="sheet" data-s="report">Open the full report</button></div></div>
  ${CLINICIAN_TOPICS.map(t=>`<details class="acc"><summary>${esc(t.l)}</summary><div>
    <ul class="tick">${t.q.map(q=>'<li>'+esc(q)+'</li>').join('')}</ul></div></details>`).join('')}
  <div class="callout info"><span class="ctitle">Two things worth saying out loud</span>
  <p>"Can we talk in absolute risk rather than relative risk?" — a 62% relative increase sounds terrifying, and means 8 extra cases per 1,000 women over five years.</p>
  <p style="margin-bottom:0">"If hormone therapy is not suitable for me, what else is there?" — there is a real list, and it is longer than most appointments cover.</p></div>`;
}

/* ---------- data sheet ---------- */
function dataSheet(){
  return {title:'Export & import', body:`
  <div class="callout ${Store.ephemeral?'warn':'info'}"><span class="ctitle">${Store.ephemeral?'This preview is not saving to disk':'Where your data lives'}</span>
  ${Store.ephemeral
    ? 'Browser storage is unavailable in this preview, so entries are held in memory only and will be lost when you close the page. Install the app (or open the deployed version) and it will save normally.'
    : "In this browser's local storage, on this device only. Clearing browser data deletes it, and it does not sync between devices — so take a backup occasionally."}</div>
  <div class="section-label">Back up</div>
  <div class="btn-row split">
    <button class="btn primary" data-act="export-json">Download JSON</button>
    <button class="btn ghost" data-act="export-csv">Download CSV</button>
  </div>
  <p class="xtiny"><b>These downloads are plain, unencrypted files containing sensitive health information.</b> Save them only somewhere private. JSON restores everything including settings. CSV is one row per day for a spreadsheet or to share with a clinician.</p>
  <div class="section-label">Copy instead</div>
  <p class="tiny">If downloads are blocked, copy this and paste it into a file:</p>
  <textarea id="dump" readonly style="min-height:130px;font-family:ui-monospace,monospace;font-size:.72rem">${esc(JSON.stringify(DB))}</textarea>
  <div class="btn-row"><button class="btn ghost sm" data-act="copy-dump">Copy to clipboard</button></div>
  <div class="section-label">Restore</div>
  <p class="tiny">Paste a previously exported JSON backup. <b>This replaces everything currently stored.</b></p>
  <textarea id="restore" maxlength="5000000" aria-describedby="restore-help" placeholder='{"v":2,"profile":...}'></textarea>
  <p class="xtiny" id="restore-help">Restore accepts a Meno Compass JSON file up to 5 MB. Unknown fields and invalid values are discarded.</p>
  <button class="btn block" data-act="import-json" style="margin-top:8px">Restore from this backup</button>
  <div class="section-label">Account &amp; data controls</div>
  <button class="btn block ghost" data-act="reset-onboarding">Reset onboarding</button>
  <button class="btn block danger" data-act="delete-local-data" style="margin-top:8px">Delete app profile &amp; data</button>
  <p class="xtiny">Reset keeps your health history. Delete is permanent, so export first if you may want a backup.</p>`};
}

function resetOnboardingSheet(){
  const count=entryDates().length;
  return {title:'Reset onboarding?', body:`
    <div class="jc-confirm-sheet">
      <span class="jc-confirm-icon">${PULSE_IC.reset}</span>
      <h3>Start the setup walkthrough again</h3>
      <p>Your ${count} confirmed ${count===1?'day':'days'}, drafts, treatments, labs, reports, and profile answers will stay on this device. Only onboarding progress is reset.</p>
      <button class="btn block primary" data-act="confirm-reset-onboarding">Reset onboarding</button>
      <button class="btn block ghost" data-act="close">Keep current setup</button>
    </div>`};
}

function deleteLocalDataSheet(){
  return {title:'Delete app profile & data?', body:`
    <div class="jc-confirm-sheet danger">
      <span class="jc-confirm-icon">${PULSE_IC.trash}</span>
      <h3>This permanently erases this app’s data on this device</h3>
      <p>MenoCompass has no online account. This deletes your local profile, symptom logs, treatment history, labs, reports, and settings. It cannot be undone unless you exported a backup.</p>
      <div class="callout warn"><span class="ctitle">Apple subscriptions are separate</span>Deleting app data does not cancel an Apple subscription. Manage subscriptions in your App Store settings.</div>
      <button class="btn block danger" data-act="confirm-delete-local-data">Delete everything permanently</button>
      <button class="btn block ghost" data-act="close">Cancel</button>
    </div>`};
}

/* ---------- clinician report ---------- */
function reportSheet(days){
  days=[30,90,180].includes(+days)?+days:90;
  const summaryDays=Math.min(30,days), activityDays=Math.min(28,days);
  const d = rangeDates(days).filter(hasData);
  const p = DB.profile;
  const age = p.birthYear? new Date().getFullYear()-p.birthYear : null;
  const hf = series(rangeDates(summaryDays), e=>e.hf), bd = series(rangeDates(summaryDays), burden);
  const wt = series(rangeDates(days), e=>e.wt).filter(x=>x.v!=null);
  const wa = series(rangeDates(days), e=>e.waist).filter(x=>x.v!=null);
  const topSym = SYMS.filter(s=>s.k!=='sleepq').map(s=>({
    n:s.n, v:avg(rangeDates(summaryDays).map(dd=>{const e=confirmedRecord(dd);return e&&e.sym?e.sym[s.k]:null;}))
  })).filter(x=>x.v!=null).sort((a,b)=>b.v-a.v).slice(0,6);
  const questionnaires = DB.scores.slice(-6).reverse();
  const medications = Array.isArray(DB.medications)?DB.medications:[];
  const labs = Array.isArray(DB.labs)?DB.labs.slice(0,8):[];
  const bleeds = entryDates().filter(x=>{const e=confirmedRecord(x);return e&&e.bleed&&e.bleed!=='none';});
  const hfValues=hf.map(x=>x.v).filter(v=>v!=null);
  const nsValues=rangeDates(summaryDays).map(x=>{const e=confirmedRecord(x);return e&&e.ns;}).filter(v=>v!=null);
  const moderateNights=nsValues.filter(v=>v>=2).length;
  const strengthValues=rangeDates(activityDays).map(x=>{const e=confirmedRecord(x);return e&&e.act?e.act.res:null;}).filter(v=>typeof v==='boolean');
  const strengthCount=strengthValues.filter(Boolean).length;
  const alcoholValues=rangeDates(activityDays).map(x=>{const e=confirmedRecord(x);return e&&e.nut?e.nut.alc:null;}).filter(v=>v!=null);
  const strengthSummary=!strengthValues.length?'not tracked'
    : strengthValues.length===activityDays?r1(strengthCount/(activityDays/7))+' / week'
    : strengthCount+' session'+(strengthCount===1?'':'s')+' across '+strengthValues.length+' logged activity day'+(strengthValues.length===1?'':'s');
  const alcoholSummary=!alcoholValues.length?'not tracked'
    : alcoholValues.length===activityDays?r1(sum(alcoholValues)/(activityDays/7))+' drinks / week'
    : sum(alcoholValues)+' drinks across '+alcoholValues.length+' logged day'+(alcoholValues.length===1?'':'s');
  return {title:'Report for your clinician', body:`
  <p class="tiny muted">A one-page summary of what you have tracked. Print it, or read from it.</p>
  <div class="report-page">
  <div class="report-brand"><b>MenoCompass</b><span>Appointment report · ${days} days</span></div>
  <div class="card">
    <h3 style="margin-bottom:2px">What changed · symptom summary</h3>
    <p class="xtiny">${p.name?esc(p.name)+' · ':''}${age?age+' years · ':''}Prepared ${fmtLong(todayISO())}</p>
    <hr class="sep">
    <div class="kv"><span>Confirmed days (last ${days})</span><b>${d.length}</b></div>
    ${p.stage?`<div class="kv"><span>Self-assessed stage</span><b>${esc(p.stage)}</b></div>`:''}
    ${periodsPossible()&&pastOrTodayISO(p.lastPeriod)?`<div class="kv"><span>Last period</span><b>${fmtDay(p.lastPeriod)} (${Math.floor(daysBetween(p.lastPeriod,todayISO())/30)} months)</b></div>`:''}
    ${!periodsPossible()&&pastOrTodayISO(p.surgeryDate)?`<div class="kv"><span>${surgicalMenopause()?'Surgical menopause date':'Surgery date'}</span><b>${fmtDay(p.surgeryDate)} (${Math.floor(daysBetween(p.surgeryDate,todayISO())/30)} months)</b></div>`:''}
    <div class="kv"><span>Hot flashes / day (${summaryDays} d)</span><b>${hfValues.length?r1(avg(hfValues)):'not tracked'}</b></div>
    <div class="kv"><span>Worst single day</span><b>${hfValues.length?Math.max(...hfValues):'not tracked'}</b></div>
    <div class="kv"><span>Night sweats, moderate+ (${summaryDays} d)</span><b>${nsValues.length?moderateNights+' '+(moderateNights===1?'night':'nights'):'not tracked'}</b></div>
    <div class="kv"><span>Sleep (${summaryDays} d average)</span><b>${avg(series(rangeDates(summaryDays),e=>e.sleepH).map(x=>x.v))!=null?r1(avg(series(rangeDates(summaryDays),e=>e.sleepH).map(x=>x.v)))+' h':'not tracked'}</b></div>
    <div class="kv"><span>Symptom burden (${summaryDays} d avg)</span><b>${avg(bd.map(x=>x.v))!=null?r1(avg(bd.map(x=>x.v)))+' / 44':'not tracked'}</b></div>
    ${wt.length?`<div class="kv"><span>Weight</span><b>${r1(U.wOut(wt[wt.length-1].v))} ${U.wLabel()} (${wt.length>1?(wt[wt.length-1].v>wt[0].v?'+':'')+r1(U.wOut(wt[wt.length-1].v-wt[0].v))+' over '+daysBetween(wt[0].d,wt[wt.length-1].d)+' d':'single reading'})</b></div>`:''}
    ${wa.length?`<div class="kv"><span>Waist</span><b>${r1(U.lOut(wa[wa.length-1].v))} ${U.lLabel()}${wa.length>1?' ('+(wa[wa.length-1].v>wa[0].v?'+':'')+r1(U.lOut(wa[wa.length-1].v-wa[0].v))+')':''}</b></div>`:''}
    <div class="kv"><span>Strength sessions (28 d)</span><b>${strengthSummary}</b></div>
    <div class="kv"><span>Alcohol (28 d)</span><b>${alcoholSummary}</b></div>
  </div>
  ${topSym.length?`<div class="card"><h4>Worth discussing · prominent symptoms (${summaryDays}-day average, 0–4)</h4>
    ${topSym.map(s=>`<div class="kv"><span>${esc(s.n)}</span><b>${r1(s.v)}</b></div>`).join('')}</div>`:''}
  ${medications.length?`<div class="card"><h4>Treatment timeline</h4>${medications.map(m=>`<div class="kv"><span>${esc(m.name)}</span><b>${esc(medicationDetail(m))}${m.started?' · started '+esc(fmtDay(m.started)):''}${m.due?' · '+esc(m.due):''}</b></div>`).join('')}</div>`:''}
  ${labs.length?`<div class="card"><h4>Recent lab results</h4>${labs.map(x=>`<div class="kv"><span>${esc(x.name)} · ${fmtDay(x.date)}</span><b>${esc(x.value+(x.unit?' '+x.unit:''))}</b></div>`).join('')}</div>`:''}
  ${questionnaires.length?`<div class="card"><h4>Questionnaire scores</h4>
    ${questionnaires.map(s=>`<div class="kv"><span>${s.type.toUpperCase()} · ${fmtDay(s.date)}</span><b>${s.score}${s.band?' — '+esc(s.band):''}</b></div>`).join('')}
    <p class="xtiny">Note: several menopause symptoms — broken sleep, fatigue, poor concentration, low libido — also score points on depression scales, which can inflate totals.</p></div>`:''}
  ${bleeds.length?`<div class="card"><h4>Bleeding logged</h4>
    ${bleeds.slice(-8).reverse().map(x=>`<div class="kv"><span>${fmtDay(x)}</span><b>${esc(confirmedRecord(x).bleed)}</b></div>`).join('')}</div>`:''}
  ${notesDigest()}
  </div>
  <div class="btn-row split">
    <button class="btn primary" data-act="print">Print / save as PDF</button>
    <button class="btn ghost" data-act="sheet" data-s="learn:clinician">Question list</button>
  </div>
  <p class="xtiny">Self-reported data from a consumer tracking app. Not a clinical record. The burden score is an unvalidated 0–44 sum of 11 self-rated symptoms on the 0–4 structure used by the Menopause Rating Scale; it has no established cut-off and is included only to show change over time.</p>`};
}
function notesDigest(){
  const ns = entryDates().filter(d=>{const e=confirmedRecord(d);return e&&e.notes;}).slice(-6).reverse();
  if(!ns.length) return '';
  return `<div class="card"><h4>Recent notes</h4>${ns.map(d=>`<p class="tiny"><b>${fmtDay(d)}:</b> ${esc(confirmedRecord(d).notes)}</p>`).join('')}</div>`;
}

/* ============================================================
   TOOLS
   ============================================================ */
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

const PHQ9 = ['Little interest or pleasure in doing things','Feeling down, depressed, or hopeless','Trouble falling or staying asleep, or sleeping too much','Feeling tired or having little energy','Poor appetite or overeating','Feeling bad about yourself, or that you are a failure, or have let yourself or your family down','Trouble concentrating on things, such as reading the newspaper or watching television','Moving or speaking so slowly that other people could have noticed, or the opposite — being fidgety or restless','Thoughts that you would be better off dead, or of hurting yourself in some way'];
const GAD7 = ['Feeling nervous, anxious or on edge','Not being able to stop or control worrying','Worrying too much about different things','Trouble relaxing','Being so restless that it is hard to sit still','Becoming easily annoyed or irritable','Feeling afraid as if something awful might happen'];
const FREQ = ['Not at all','Several days','More than half the days','Nearly every day'];
const qDrafts = {phq9:{}, gad7:{}};

function toolSheet(t){
  switch(t){
    case 'protein': return {title:'Protein calculator', body:proteinTool()};
    case 'phq9':    return {title:'PHQ-9 mood check', body:questionTool('phq9')};
    case 'gad7':    return {title:'GAD-7 anxiety check', body:questionTool('gad7')};
    case 'sleepwin':return {title:'Sleep window calculator', body:sleepWinTool()};
    case 'breath':  return {title:'Paced breathing', body:breathTool()};
    case 'pmr':     return {title:'Progressive muscle relaxation', body:pmrTool()};
    case 'trigger': return {title:'28-day trigger test', body:triggerTool()};
    case 'waist':   return {title:'Waist reference', body:waistTool()};
  }
  return {title:'', body:''};
}

function proteinTool(){
  const pt = proteinTarget();
  const gpk = +DB.profile.proteinGpk||1.2;
  return `<p class="tiny">The RDA of 0.8 g/kg is a floor for avoiding deficiency, not a target for keeping muscle. Guidelines for healthy older adults use 1.0–1.2 g/kg; the training and body-composition literature uses 1.2–1.6; during intentional weight loss, 1.2–1.5.</p>
  <div class="field"><label class="fl" for="ptw">Your weight (${U.wLabel()})</label>
    <input id="ptw" type="number" step="0.1" min="${U.imp?44:20}" max="${U.imp?1100:500}" inputmode="decimal" value="${pt?r1(U.wOut(pt.kg)):''}" data-act="prot-calc"></div>
  <div class="field"><label class="fl" for="ptg">Target</label>
    <select id="ptg" data-act="prot-calc">
      ${[1.0,1.2,1.4,1.6].map(v=>`<option value="${v}"${gpk===v?' selected':''}>${v.toFixed(1)} g/kg</option>`).join('')}
    </select></div>
  <div id="prot-out" aria-live="polite">${proteinOut(pt?pt.kg:null, gpk)}</div>
  <div class="callout info"><span class="ctitle">The per-meal threshold</span>
  After about 60 the muscle-building response is blunted — reaching it takes roughly <b>30 g of protein and 2.8 g of leucine in one sitting</b>, where a younger woman responds to any amount. Spreading intake evenly (30/30/30) produced more 24-hour muscle protein synthesis than skewing it (10/20/60). During weight loss, even distribution meant 26% versus 34% of loss coming from lean tissue.</div>
  <h4>Roughly 30 g of protein looks like</h4>
  <div class="tw"><table><tbody>
  <tr><td>Chicken or turkey breast</td><td>100–110 g cooked</td></tr>
  <tr><td>Salmon or tuna</td><td>130 g cooked</td></tr>
  <tr><td>Greek yogurt (plain, 0–2%)</td><td>280–300 g</td></tr>
  <tr><td>Cottage cheese</td><td>250 g</td></tr>
  <tr><td>Eggs</td><td>4–5 large</td></tr>
  <tr><td>Firm tofu</td><td>200 g</td></tr>
  <tr><td>Cooked lentils</td><td>330 g (about 1.7 cups)</td></tr>
  <tr><td>Whey or soy protein powder</td><td>1 scoop (~30 g powder)</td></tr>
  </tbody></table></div>
  <p class="xtiny">Breakfast is nearly always the meal that falls short. For BMI 30+, guidelines generally apply g/kg to an adjusted rather than actual body weight — we are not publishing a formula for that because we could not verify a menopause-specific one. Ask a dietitian. Anyone with kidney disease should get a target from their clinician, not an app.</p>`;
}
function proteinOut(kg, gpk){
  if(kg==null || !Number.isFinite(kg) || kg<=0 || !Number.isFinite(gpk)) return '<p class="tiny muted">Enter a valid weight to see your numbers.</p>';
  const g = Math.round(kg*gpk);
  return `<div class="tiles" style="margin-bottom:12px">
    <div class="tile"><div class="k">Per day</div><div class="v">${g}<small> g</small></div></div>
    <div class="tile"><div class="k">Per meal ×3</div><div class="v">${Math.round(g/3)}<small> g</small></div></div>
    <div class="tile"><div class="k">Leucine aim</div><div class="v">~7.5<small> g</small></div><div class="d">per day</div></div>
  </div>`;
}

function questionTool(kind){
  const items = kind==='phq9'?PHQ9:GAD7;
  const answers=qDrafts[kind];
  const done = items.every((_,i)=>answers[i]!=null);
  const score = done? items.reduce((total,_,i)=>total+answers[i],0) : null;
  let band='', note='';
  if(done){
    if(kind==='phq9'){
      band = score<5?'minimal':score<10?'mild':score<15?'moderate':score<20?'moderately severe':'severe';
    } else {
      band = score<5?'minimal':score<10?'mild':score<15?'moderate':'severe';
    }
  }
  const risk = kind==='phq9' && answers[8]>0;
  const past = DB.scores.filter(s=>s.type===kind).slice(-6);
  return `<p class="tiny">Over the <b>last two weeks</b>, how often have you been bothered by the following?</p>
  <div class="callout warn"><span class="ctitle">Read the score carefully</span>
  Several menopause symptoms — broken sleep, fatigue, poor concentration, low libido — <b>also score points on this questionnaire</b>. The perimenopausal depression guideline says so explicitly. A raised total is a reason to talk to someone, not a diagnosis.</div>
  ${items.map((q,i)=>`<div style="margin-bottom:15px"><p class="fl" id="q-${kind}-${i}">${i+1}. ${esc(q)}</p>
    <div class="scale" role="group" aria-labelledby="q-${kind}-${i}">${FREQ.map((f,v)=>h('button',{'data-act':'q-a','data-k':kind,'data-i':i,'data-v':v,'aria-pressed':answers[i]===v?'true':'false','aria-label':(i+1)+'. '+q+': '+f}, v)).join('')}</div>
    <div class="scale-legend" aria-hidden="true"><span>Not at all</span><span>Nearly every day</span></div></div>`).join('')}
  ${done?`<div class="callout ${score>=15?'alert':score>=10?'warn':'ok'}"><span class="ctitle">Score: ${score} of ${items.length*3} — ${band}</span>
    ${kind==='phq9'
      ? 'For context: elevated depressive symptoms are found in 45–68% of perimenopausal women versus 28–31% before. Women are 2–4× more likely to have a major depressive episode during the transition and early postmenopause. Prior depression is the strongest predictor.'
      : 'GAD-7 is the standard anxiety measure. The bands shown are its usual published ones, but we could not find validation specific to menopausal women — so read your trend over time rather than the label.'}
    ${score>=10?'<p style="margin:8px 0 0"><b>A score in this range warrants a conversation with a clinician.</b> Take these numbers with you.</p>':''}</div>`:''}
  ${risk?`<div class="callout alert" role="alert"><span class="ctitle">Please reach out today</span>
    You answered yes to thoughts of being better off dead or of hurting yourself. If you may act on these thoughts, have a plan, or cannot stay safe, call emergency services or go to the nearest emergency department now, and do not stay alone. In the US, call or text <a href="https://988lifeline.org/" target="_blank" rel="noopener noreferrer"><b>988</b></a>. In the UK or Republic of Ireland, call <a href="https://www.samaritans.org/how-we-can-help/contact-samaritan/" target="_blank" rel="noopener noreferrer"><b>116 123</b></a>. Elsewhere, use <a href="https://findahelpline.com/" target="_blank" rel="noopener noreferrer">Find A Helpline</a>. You do not have to explain yourself perfectly.</div>`:''}
  <div class="btn-row split">
    <button class="btn ghost" data-act="q-reset" data-k="${kind}">Clear</button>
    <button class="btn primary" data-act="q-save" data-k="${kind}" ${done?'':'disabled style="opacity:.5"'}>Save ${done?'score of '+score:'score'}</button>
  </div>
  ${past.length?`<div class="section-label">Your history</div>
    ${past.slice().reverse().map(s=>`<div class="kv"><span>${fmtDay(s.date)}</span><b>${s.score}${s.band?' · '+esc(s.band):''}</b></div>`).join('')}`:''}`;
}

function sleepWinTool(){
  const ds = rangeDates(14);
  const sleeps = ds.map(d=>{const e=confirmedRecord(d);return e&&e.sleepH!=null?e.sleepH:null;}).filter(v=>v!=null);
  const beds = ds.map(d=>{const e=confirmedRecord(d);return e&&e.inBedH!=null?e.inBedH:null;}).filter(v=>v!=null);
  const paired=ds.map(confirmedRecord).filter(e=>
    e && e.sleepH!=null && e.inBedH!=null && e.inBedH>0 && e.sleepH<=e.inBedH
  );
  const aSleep = avg(sleeps), aBed = avg(beds);
  const eff = paired.length ? avg(paired.map(e=>e.sleepH/e.inBedH*100)) : null;
  const win = aSleep!=null&&aSleep>0 ? Math.max(5, Math.round(aSleep*4)/4) : null;
  return `<div class="callout info"><span class="ctitle">Why this is the effective part</span>
  In 150 postmenopausal women with chronic insomnia: sleep hygiene education alone produced <b>4%</b> remission. CBT-I produced <b>54%</b> at the end of treatment and <b>68% at six months</b>, with 40–43 more minutes of sleep a night. Sleep restriction is the engine.</div>
  ${sleeps.length<5||win==null
    ? (sleeps.length>=5&&aSleep===0
        ? '<div class="callout alert"><span class="ctitle">Zero sleep is not a basis for sleep restriction</span>You recorded no sleep across these nights. Do not shorten your time in bed from this calculator; contact a clinician promptly for help and check that the entries are accurate.</div>'
        : '<div class="callout warn"><span class="ctitle">Log a few more nights first</span>You have '+sleeps.length+' night'+(sleeps.length===1?'':'s')+' of sleep data in the last two weeks. This needs about a week of honest logging — hours in bed and hours actually asleep — before it gives you a sensible window.</div>')
    : `<div class="tiles" style="margin-bottom:14px">
        <div class="tile"><div class="k">Actual sleep</div><div class="v">${r1(aSleep)}<small> h</small></div><div class="d">14-day average</div></div>
        ${aBed!=null?`<div class="tile"><div class="k">Time in bed</div><div class="v">${r1(aBed)}<small> h</small></div></div>`:''}
        ${eff!=null?`<div class="tile"><div class="k">Efficiency</div><div class="v">${Math.round(eff)}<small>%</small></div><div class="d">${eff>=85?'extend the window':'hold the window'}</div></div>`:''}
      </div>
      <div class="card">
        <h4>Your starting window: ${r1(win)} hours</h4>
        <div class="field"><label class="fl" for="swk">Wake time you will keep every single day</label>
          <input id="swk" type="time" value="06:30" data-act="sw-calc" style="width:auto"></div>
        <div id="sw-out" aria-live="polite">${swOut('06:30', win)}</div>
      </div>`}
  <h4>The rules while you do this</h4>
  <ul class="tick">
    <li><b>Fixed wake time</b>, seven days a week, regardless of how the night went. This is the anchor.</li>
    <li>Do not go to bed before your window opens, even if you are exhausted.</li>
    <li>If you are awake and frustrated, <b>get out of bed</b>. Somewhere dim and dull. Return when sleepy — not when it feels like you should be.</li>
    <li><b>No clock-watching.</b> Turn it away.</li>
    <li>Bed for sleep and sex only.</li>
    <li>Once efficiency passes about <b>85–90%</b>, extend the window by 15–30 minutes.</li>
    <li>Expect to feel <b>worse in week one or two</b>. That is the mechanism, not failure.</li>
  </ul>
  <div class="callout alert"><span class="ctitle">Do not do this unsupervised if you have</span>
  Bipolar disorder · a seizure disorder · untreated sleep apnea. Sleep deprivation is a trigger in all three — work with a clinician instead. And if you snore, wake unrefreshed, get morning headaches, or CBT-I does not work, ask to be tested for sleep apnea: it affects <b>20% of midlife women</b> and is routinely missed.</div>
  <p class="xtiny">This calculator implements the sleep-restriction component of CBT-I. It is not therapy, and clinician- or programme-delivered CBT-I is better. Telephone-delivered CBT-I worked well in peri- and postmenopausal women, so ask about remote options.</p>`;
}
function swOut(wake, win){
  if(win==null || win<=0) return '';
  const [hh,mm] = wake.split(':').map(Number);
  let t = hh*60+mm - Math.round(win*60);
  while(t<0) t+=1440;
  const bh = String(Math.floor(t/60)).padStart(2,'0'), bm = String(t%60).padStart(2,'0');
  return `<div class="callout ok" style="margin-bottom:0"><span class="ctitle">Earliest bedtime: ${bh}:${bm}</span>
  Do not get into bed before this, and get up at ${wake} every day. When you are sleeping through most of that window, move the bedtime 15–30 minutes earlier.</div>`;
}

function breathTool(){
  return `<div class="callout alert"><span class="ctitle">What this is and is not for</span>
  <p>Slow-paced breathing has meta-analytic support for <b>stress (g = −0.35), anxiety (−0.32) and low mood (−0.40)</b> — small-to-medium effects. Ten of twelve trials used <i>slow</i> pacing and worked; the two using fast pacing did not.</p>
  <p style="margin-bottom:0"><b>It is rated Level I NOT recommended for hot flashes.</b> Larger trials found paced respiration no better than shallow breathing or usual care. Use it for anxiety, where it earns its place. Do not let anyone tell you it stops flashes.</p></div>
  <div class="card center">
    <div id="breath-ring" style="width:170px;height:170px;margin:8px auto 14px;border-radius:50%;border:3px solid var(--accent);display:grid;place-items:center;transition:transform 4s ease-in-out;background:var(--accent-soft)">
      <div><div id="breath-word" aria-live="polite" style="font-size:1.15rem;font-weight:700">Ready</div>
      <div id="breath-count" class="tiny muted">6 breaths per minute</div></div>
    </div>
    <div class="btn-row split"><button class="btn primary" data-act="breath-start">Start</button>
      <button class="btn ghost" data-act="breath-stop">Stop</button></div>
    <p class="xtiny" style="margin-top:10px">About five seconds in, five out — roughly six breaths a minute. The mechanistic study used six seconds each way; anywhere in that range is the point. Through the nose if comfortable. Two to five minutes is plenty.</p>
  </div>
  <p class="tiny">The authors of the meta-analysis explicitly warned against "miscalibration between hype and evidence" — this is a useful, cheap, low-risk tool with a modest effect, not a cure for anything.</p>`;
}

const PMR_STEPS = [
  ['Settle','Sit or lie somewhere you will not be interrupted. Let your breathing slow. Nothing to achieve here.'],
  ['Hands and forearms','Clench both fists. Hold — feel the tension. Now release completely, and notice the difference for a few breaths.'],
  ['Upper arms','Bend your elbows and tense your biceps. Hold. Release, and let your arms be heavy.'],
  ['Shoulders','Lift your shoulders towards your ears. Hold. Drop them, and let them keep dropping.'],
  ['Face','Scrunch your whole face — brow, eyes, jaw. Hold. Release, and let your jaw hang slightly open.'],
  ['Neck','Press your head gently back against the surface behind you. Hold. Release.'],
  ['Chest and back','Take a breath in and hold it, tensing your chest. Release with a long exhale.'],
  ['Stomach','Tighten your abdominal muscles. Hold. Release, and let your belly soften completely.'],
  ['Thighs','Press your legs together and tense your thighs. Hold. Release.'],
  ['Calves','Point your toes towards your face to tense your calves. Hold. Release.'],
  ['Feet','Curl your toes downwards. Hold. Release.'],
  ['Whole body','Scan from your feet upwards. Anywhere still holding on, invite it to let go. Stay here as long as you like.']
];
function pmrTool(){
  return `<p class="tiny">Systematic review of 46 publications across 16 countries and over 3,400 adults: supportive results for stress (24 studies), anxiety (21) and low mood (11), effect sizes small to very large. Sessions of <b>5–28 minutes</b> worked, and <b>length did not significantly affect outcomes</b> — so a short one counts.</p>
  <div class="card">
    <div id="pmr-progress" class="progress" role="progressbar" aria-label="Relaxation progress" aria-valuemin="0" aria-valuemax="${PMR_STEPS.length}" aria-valuenow="0"><i id="pmr-bar" style="width:0%"></i></div>
    <div aria-live="polite" aria-atomic="true"><h3 id="pmr-title" style="margin:12px 0 4px">Ready when you are</h3>
    <p id="pmr-text" class="tiny">Tense each muscle group for about 5 seconds, then release for about 15 and pay attention to the contrast. That contrast is the active ingredient.</p></div>
    <div class="btn-row split"><button class="btn primary" data-act="pmr-start">Start</button>
      <button class="btn ghost" data-act="pmr-stop">Stop</button></div>
  </div>
  <p class="xtiny">If you have an injury or pain anywhere, skip that group or tense only very gently. Effects improve when combined with music, mindfulness or slow breathing.</p>`;
}

function refreshTriggerStatus(){
  const t=DB.trigger;
  if(!t || !t.active) return;
  if(!pastOrTodayISO(t.start)){
    t.active=false; t.status='stopped'; t.ended=todayISO();
    save();
    return;
  }
  if(daysBetween(t.start,todayISO())>=28){
    t.active=false; t.status='completed'; t.ended=addDays(t.start,27);
    save();
  }
}
function triggerTool(){
  refreshTriggerStatus();
  const t = DB.trigger;
  if(t && t.active){
    const day = Math.max(1,daysBetween(t.start, todayISO())+1);
    const phase = day<=14 ? 'removal' : 'reintroduction';
    const dayIn = day<=14 ? day : day-14;
    const before=triggerStats(t,'base'), remove=triggerStats(t,'remove'), reintro=triggerStats(t,'reintro');
    return `<div class="callout ok"><span class="ctitle">Test running: ${esc(t.item)}</span>
    Day ${day} — <b>${phase} phase</b>, day ${dayIn} of 14. Keep logging as normal; the comparison happens automatically.</div>
    <div class="progress" role="progressbar" aria-label="Trigger test progress" aria-valuemin="0" aria-valuemax="28" aria-valuenow="${Math.min(28,day)}"><i style="width:${Math.min(100, Math.round(day/28*100))}%"></i></div>
    ${triggerPhaseTiles(before,remove,reintro)}
    ${day>=15?triggerComparison(remove,reintro,false):`<div class="callout info"><span class="ctitle">Reintroduction starts on day 15</span>
      A change during removal is only a clue. Bringing ${esc(t.item)} back for the second two weeks tests whether the pattern reverses.</div>`}
    <button class="btn block ghost" data-act="trig-stop">End this test</button>
    <p class="xtiny">Honest caveat: this is a single-person, unblinded experiment with no control for everything else changing in your life. It is the fairest version available to you, which is not the same as proof.</p>`;
  }
  if(t){
    const before=triggerStats(t,'base'), remove=triggerStats(t,'remove'), reintro=triggerStats(t,'reintro');
    const complete=t.status==='completed';
    return `<div class="callout ${complete?'ok':'warn'}"><span class="ctitle">${complete?'Test complete':'Test ended early'}: ${esc(t.item)}</span>
      ${complete?'You completed both 14-day phases.':'The available numbers are shown, but an incomplete phase is much harder to interpret.'}</div>
      ${triggerPhaseTiles(before,remove,reintro)}
      ${triggerComparison(remove,reintro,complete)}
      <button class="btn block primary" data-act="trig-reset">Start another test</button>
      <p class="xtiny">These are personal observations, not proof of cause. Illness, weather, stress, treatment changes and ordinary symptom variation can all move the numbers.</p>`;
  }
  return `<div class="callout warn"><span class="ctitle">Start here: trigger-avoidance is not a proven treatment</span>
  The Menopause Society states plainly that <b>there are no clinical trials assessing whether avoiding triggers relieves vasomotor symptoms</b>, and rates it not recommended. The most-quoted caffeine study was cross-sectional, and its own authors said they could not advise patients without further research.</div>
  <p class="tiny">So why offer this? Because individual responses vary, and a structured two-week removal followed by reintroduction is far more informative than the usual approach of vaguely avoiding six things at once and never knowing which mattered.</p>
  <div class="field"><label class="fl" for="trig">What do you want to test?</label>
    <select id="trig">${['Alcohol','Caffeine','Spicy food','Sugar','Late meals','Hot drinks','Something else'].map(v=>`<option>${v}</option>`).join('')}</select></div>
  <button class="btn block primary" data-act="trig-start">Start the 28-day test</button>
  <h4 style="margin-top:18px">How it works</h4>
  <ul class="tick">
    <li><b>Days 1–14:</b> remove it completely. Change nothing else. Keep logging.</li>
    <li><b>Days 15–28:</b> bring it back at your usual amount. Keep logging.</li>
    <li>The app compares your hot flash counts and sleep across the phases.</li>
    <li>A difference under about one flash a day is noise. Be willing to conclude nothing happened — that is a genuinely useful answer.</li>
  </ul>
  <p class="xtiny">One separate note: if alcohol is the thing you are testing, cutting it back is worth doing regardless of what this shows. The evidence for that sits with breast cancer risk and sleep quality, not hot flashes.</p>`;
}
function triggerStats(t, which){
  const offsets=which==='base' ? [-14,-1] : which==='remove' ? [0,13] : [14,27];
  const ds=[];
  for(let i=offsets[0];i<=offsets[1];i++){
    const d=addDays(t.start,i);
    if(d<=todayISO()) ds.push(d);
  }
  const hf=ds.map(d=>{const e=confirmedRecord(d);return e&&e.hf;}).filter(v=>v!=null);
  const sleep=ds.map(d=>{const e=confirmedRecord(d);return e&&e.sleepH;}).filter(v=>v!=null);
  return {hf:avg(hf), sleep:avg(sleep), hfN:hf.length, sleepN:sleep.length};
}
function triggerPhaseTiles(before,remove,reintro){
  const tile=(label,s)=>`<div class="tile"><div class="k">${label}</div>
    <div class="v">${s.hf!=null?r1(s.hf):'–'}<small> flashes</small></div>
    <div class="d">${s.sleep!=null?r1(s.sleep)+' h sleep':'sleep not logged'} · ${s.hfN} day${s.hfN===1?'':'s'}</div></div>`;
  return `<div class="tiles" style="margin:14px 0">${tile('Before',before)}${tile('Removal',remove)}${tile('Reintroduction',reintro)}</div>`;
}
function triggerComparison(remove,reintro,complete){
  if(remove.hf==null || reintro.hf==null){
    return `<div class="callout warn"><span class="ctitle">Not enough paired phase data yet</span>
      Log hot-flash counts during both removal and reintroduction. Sleep averages appear when hours asleep are logged.</div>`;
  }
  const delta=reintro.hf-remove.hf;
  const small=Math.abs(delta)<0.8;
  const title=small?'No clear hot-flash difference'
    : delta>0?'Hot flashes were lower during removal':'Hot flashes were higher during removal';
  const sleepNote=remove.sleep!=null&&reintro.sleep!=null
    ? ' Average sleep was '+r1(remove.sleep)+' hours during removal and '+r1(reintro.sleep)+' after reintroduction.'
    : '';
  return `<div class="callout info"><span class="ctitle">${complete?'Final result':'Result so far'}: ${title}</span>
    Removal averaged ${r1(remove.hf)} flashes/day; reintroduction averaged ${r1(reintro.hf)}.${sleepNote}
    ${small?'A difference under about one flash a day is best treated as ordinary noise.':'A reversal after reintroduction is more suggestive than removal alone, but this still cannot establish cause.'}</div>`;
}
function triggerBanner(){
  refreshTriggerStatus();
  const t=DB.trigger;
  if(!t || !t.active){ return ''; }
  const day=daysBetween(t.start,todayISO())+1;
  if(day<1 || day>28){ return ''; }
  return `<div class="callout info"><span class="ctitle">Trigger test day ${day}: ${esc(t.item)}</span>
  ${day<=14?'Removal phase — keep it out and keep logging.':'Reintroduction phase — back to your usual amount.'}
  <div style="margin-top:8px"><button class="btn sm ghost" data-act="sheet" data-s="tool:trigger">View results</button></div></div>`;
}

function waistTool(){
  const wa = entryDates().slice().reverse().map(d=>{const e=confirmedRecord(d);return e&&e.waist;}).find(v=>v!=null);
  return `<p class="tiny">The International Atherosclerosis Society consensus argues waist should be treated as a <b>vital sign</b>. Modelled together with BMI, waist stays predictive of mortality while BMI becomes unrelated or even inversely related. A 10% larger waist meant 1.48× higher mortality after BMI adjustment; in coronary artery disease, 2.05×.</p>
  ${wa!=null?`<div class="tiles" style="margin-bottom:14px"><div class="tile"><div class="k">Your latest</div><div class="v">${r1(U.lOut(wa))}<small> ${U.lLabel()}</small></div>
    <div class="d">${wa>=105?'class I threshold':wa>=90?'above 90 cm':wa>=80?'above 80 cm':'below 80 cm'}</div></div></div>`:''}
  <h4>Thresholds for women</h4>
  <div class="tw"><table><tbody>
  <tr><td>At normal weight</td><td><b>80 cm / 31.5 in</b></td></tr>
  <tr><td>At overweight</td><td><b>90 cm / 35.4 in</b></td></tr>
  <tr><td>Class I obesity</td><td>105 cm / 41.3 in</td></tr>
  </tbody></table></div>
  <p class="xtiny">Ethnicity-specific single cut-points for women include 80 cm for Chinese and Asian Indian women, 85 cm for Korean and Tunisian women, 90 cm for Japanese women.</p>
  <h4>How to measure it the same way every time</h4>
  <ul class="tick">
    <li>Top of the hip bone, <b>or</b> midway between lowest rib and hip bone. These differ by about 2 cm in women — <b>pick one and never change</b>.</li>
    <li>Bare skin, standing relaxed, tape snug but not compressing.</li>
    <li>At the end of a normal exhale. Do not suck in.</li>
    <li>Same time of day, ideally morning before eating.</li>
  </ul>
  <div class="callout ok"><span class="ctitle">The encouraging part</span>
  Diet and exercise reduce waist <b>with or without weight loss</b> — one large trial found about 5 cm of reduction versus control. Aerobic work moved it most (−2.30 cm across 101 trials in postmenopausal women).</div>
  <p class="xtiny">Self-measurement correlates well with clinical measurement (r = 0.8–0.9) but typically underestimates by 1–3 cm. Irrelevant when you are tracking your own change.</p>`;
}

/* ---------- animated tool hooks ---------- */
let breathTimer=null, pmrTimer=null;
function runSheetHooks(id){
  if(id!=='tool:breath' && breathTimer){ clearInterval(breathTimer); breathTimer=null; }
  if(id!=='tool:pmr' && pmrTimer){ clearInterval(pmrTimer); pmrTimer=null; }
}
function breathStart(){
  const ring=document.getElementById('breath-ring'), word=document.getElementById('breath-word'), cnt=document.getElementById('breath-count');
  if(!ring) return;
  if(breathTimer) clearInterval(breathTimer);
  let phase=0, n=0;
  const tick=()=>{
    if(phase%2===0){ ring.style.transitionDuration='5s'; ring.style.transform='scale(1.22)'; word.textContent='Breathe in'; }
    else { ring.style.transitionDuration='5s'; ring.style.transform='scale(0.86)'; word.textContent='Breathe out'; n++; cnt.textContent=n+' breath'+(n===1?'':'s'); }
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
    if(i>=PMR_STEPS.length){ t.textContent='Done'; x.textContent='Notice how your body feels now compared with when you started. That comparison is worth a moment.'; b.style.width='100%'; b.classList.add('ok'); if(p) p.setAttribute('aria-valuenow',PMR_STEPS.length); clearInterval(pmrTimer); pmrTimer=null; return; }
    t.textContent=PMR_STEPS[i][0]; x.textContent=PMR_STEPS[i][1];
    b.style.width=Math.round((i+1)/PMR_STEPS.length*100)+'%';
    if(p) p.setAttribute('aria-valuenow',i+1);
    i++;
  };
  show(); pmrTimer=setInterval(show, 45000);
}
function pmrStop(){ if(pmrTimer) clearInterval(pmrTimer); pmrTimer=null;
  const t=document.getElementById('pmr-title'); if(t) t.textContent='Stopped'; }

/* ============================================================
   ONBOARDING
   ============================================================ */
function viewOnboard(){
  const p=DB.profile;
  const step=Math.max(0,Math.min(3,+p.onboardingStep||0));
  const shell=(title,subtitle,body)=>`<div class="view tw-screen tw-onboard jc-onboard">
    <div class="jc-onboard-top"><div class="jc-wordmark"><span>MENO</span>COMPASS</div><span>${step+1} / 4</span></div>
    <div class="jc-onboard-progress" aria-label="Setup step ${step+1} of 4"><i style="width:${(step+1)*25}%"></i></div>
    ${step?'<button class="jc-back" data-act="ob-back">'+IC.chev+' Back</button>':''}
    <div class="jc-page-head"><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div>
    ${body}
  </div>`;
  if(step===0){
    return shell('Make sense of what’s changing.','Track symptoms and treatment changes, see patterns, and prepare for better appointments — privately on this device.',`
      <div class="jc-trust-line">${TWILIGHT_IC.cycle}<span><b>Your health entries stay on this device.</b><small>No account or health-data server.</small></span></div>
      <div class="jc-onboard-list"><p>Confirm a quick daily check-in.</p><p>See symptoms and treatment changes in one story.</p><p>Bring a focused summary to appointments.</p></div>
      <button class="jc-primary" data-act="ob-next">Set up my compass</button>
      <button class="jc-text-action" data-act="ob-skip">Set up later</button>
      <details class="jc-disclosure"><summary>Privacy, evidence, and medical limits</summary><div><p>Your health entries remain in this browser on this device. MenoCompass provides education, not diagnosis or treatment, and does not replace a clinician who knows your history.</p><p>Content reviewed July 2026.</p></div></details>`);
  }
  if(step===1){
    const intents=[
      ['understand','Understand symptoms'],['treatment','See whether treatment helps'],
      ['appointment','Prepare for an appointment'],['record','Keep a private record']
    ];
    return shell('What would help most?','This sets the emphasis of your Today and Guide screens.',`
      <div class="jc-choice-list">${intents.map(([v,label])=>`<button data-act="ob-intent" data-v="${v}" aria-pressed="${p.intent===v?'true':'false'}"><span>${esc(label)}</span>${p.intent===v?PULSE_IC.check:IC.chev}</button>`).join('')}</div>
      <button class="jc-primary" data-act="ob-next">Continue</button>
      <p class="jc-footnote">You can change this later in Profile.</p>`);
  }
  if(step===2){
    return shell('A few details change what guidance applies.','Everything is optional and can be changed later in Profile.',`
      <div class="jc-form-stack">
        <div class="field"><label class="fl" for="ob-n">First name (optional)</label><input id="ob-n" type="text" maxlength="80" autocomplete="given-name" placeholder="Optional" data-act="prof" data-k="name" value="${esc(p.name||'')}"></div>
        <div class="grid2"><div class="field"><label class="fl" for="ob-y">Birth year</label><input id="ob-y" type="number" min="1920" max="${new Date().getFullYear()-18}" inputmode="numeric" placeholder="e.g. 1975" data-act="prof" data-k="birthYear" value="${p.birthYear||''}"></div>
        <div class="field"><label class="fl" for="ob-r">Region</label><select id="ob-r" data-act="prof" data-k="region"><option value="us"${p.region==='us'?' selected':''}>United States</option><option value="uk"${p.region==='uk'?' selected':''}>United Kingdom</option><option value="other"${p.region==='other'?' selected':''}>Elsewhere</option></select></div></div>
        <div class="field"><label class="fl" for="ob-ut">Uterus (womb)</label><select id="ob-ut" data-act="prof" data-k="uterus">${[['unknown','Prefer not to say'],['intact','Still there'],['hyst','Removed (hysterectomy)'],['ablation','Endometrial ablation']].map(([v,l])=>`<option value="${v}"${p.uterus===v?' selected':''}>${l}</option>`).join('')}</select></div>
        <div class="field"><label class="fl" for="ob-ov">Ovaries</label><select id="ob-ov" data-act="prof" data-k="ovaries">${[['unknown','Prefer not to say / not sure'],['kept','Both still there'],['one','One removed'],['both','Both removed']].map(([v,l])=>`<option value="${v}"${p.ovaries===v?' selected':''}>${l}</option>`).join('')}</select><p class="jc-footnote">Asked separately because surgery can affect the uterus and ovaries differently.</p></div>
      </div>
      <button class="jc-primary" data-act="ob-next">Continue</button>`);
  }
  const pins=Array.isArray(p.pinnedSymptoms)&&p.pinnedSymptoms.length?p.pinnedSymptoms:['hf','ns','fog','energy','joint','anx'];
  const choices=[['hf','Hot flashes'],['ns','Night sweats'],...SYMS.filter(s=>s.k!=='sleepq').map(s=>[s.k,SYM_DISPLAY[s.k]||s.n])];
  return shell('What should we watch?','Choose 3–6 symptoms for your focused check-in.',`
    <div class="jc-pin-grid">${choices.map(([k,label])=>`<button data-act="ob-symptom" data-v="${k}" aria-pressed="${pins.includes(k)?'true':'false'}">${SYM_IC[k]||(k==='hf'?TWILIGHT_IC.flame:k==='ns'?TWILIGHT_IC.moon:TWILIGHT_IC.cycle)}<span>${esc(label)}</span></button>`).join('')}</div>
    <p class="jc-footnote"><span id="ob-pin-count">${pins.length}</span> selected · treatments can be added in Care.</p>
    <button class="jc-primary" data-act="ob-done">Start my journey</button>`);
}

/* ============================================================
   TWILIGHT PRIMARY SCREENS
   These are deliberately shaped to the supplied 384 x 772 reference.
   ============================================================ */
let notesOpen=false, medFormOpen=false, labFormOpen=false;
let medDaysDraft=[0,1,2,3,4,5,6];
const DAY_SHORT=['S','M','T','W','T','F','S'];
const TWILIGHT_LEVELS=['None','Mild','Moderate','Severe'];
function twilightTile(path,value,label,icon,levels){
  const choices=levels||TWILIGHT_LEVELS;
  const logged=value!=null&&Number.isFinite(Number(value));
  const v=logged?Math.max(0,Math.min(3,Number(value))):null;
  const current=logged?choices[v]:'Choose level';
  return '<div class="tw-tile'+(logged?' logged':'')+(v>0?' sel':'')+'" role="group" aria-label="'+esc(label)+'">'
    +'<div class="tw-tile-top">'+icon+'<span>'+esc(label)+'</span><b class="tw-level">'+esc(current)+'</b></div>'
    +'<div class="tw-level-grid">'+choices.map((choice,i)=>'<button class="tw-level-choice" data-act="set" data-k="'+esc(path)+'" data-v="'+i+'" aria-label="'+esc(label)+': '+esc(choice)+'" aria-pressed="'+(v===i?'true':'false')+'"><i class="tw-dot f'+i+'" aria-hidden="true"></i><span>'+esc(choice)+'</span></button>').join('')+'</div></div>';
}
function medicationDetail(m){
  const days=m.days||[0,1,2,3,4,5,6];
  const schedule=days.length===7?'daily':days.map(d=>['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join(' & ');
  return (m.form||'medication')+' · '+schedule;
}
function medicationIcon(m){ return PULSE_IC.task; }
function scheduledMeds(date){
  const dow=parseISO(date).getDay();
  return (Array.isArray(DB.medications)?DB.medications:[]).filter(m=>(m.days||[0,1,2,3,4,5,6]).includes(dow));
}
function todayMedicationRows(onlyScheduled){
  const all=Array.isArray(DB.medications)?DB.medications:[], meds=onlyScheduled?scheduledMeds(curDate):all, day=DB.entries[curDate]||{}, adherence=day.med||{};
  if(!all.length) return '<button class="tw-empty-med" data-act="tab" data-v="care">Add your treatments</button>';
  if(!meds.length) return '<div class="tw-empty-med quiet">Nothing scheduled today.</div>';
  return meds.map(m=>{const rec=adherence[m.id]||{};return '<button class="tw-medrow" data-act="med-taken" data-id="'+esc(m.id)+'">'
    +medicationIcon(m)
    +'<span class="tw-grow"><b>'+esc(m.name)+'</b><small>'+esc(medicationDetail(m))+'</small></span>'
    +'<span class="tw-due'+(rec.taken?' ok':'')+'">'+(rec.taken?'✓ '+esc(rec.at||'taken'):esc(m.due||'Due'))+'</span></button>';}).join('');
}
function viewTodayCompact(){
  const e=DB.entries[curDate]||{sym:{},act:{},nut:{}}, sym=e.sym||{};
  const selected=parseISO(curDate).toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'});
  return `<div class="view tw-screen tw-today">
    ${twilightHeader(selected,curDate===todayISO()?(e.prefilledFrom?'Yesterday was copied forward. Choose the level that fits today.':'Choose a level for each symptom. Tap None when it did not happen.'):'Editing '+fmtLong(curDate)+'. Choose the level that fit that day.')}
    ${DB.profile.onboardingDeferred?`<button class="tw-setup-reminder" data-act="finish-setup">${TWILIGHT_IC.cycle}<span><b>Finish your setup</b><small>Add your basics and find where you are in the transition.</small></span><span class="chev">${IC.chev}</span></button>`:''}
    <div class="tw-grid">
      ${twilightTile('hf',e.hf,'Hot flashes',TWILIGHT_IC.flame,['None','1 flash','2 flashes','3+ flashes'])}
      ${twilightTile('ns',e.ns,'Night sweats',TWILIGHT_IC.moon)}
      ${twilightTile('sym.fog',sym.fog,'Brain fog',TWILIGHT_IC.cloud)}
      ${twilightTile('sym.energy',sym.energy,'Fatigue',TWILIGHT_IC.bolt)}
      ${twilightTile('sym.joint',sym.joint,'Joint pain',TWILIGHT_IC.heart)}
      ${twilightTile('sym.anx',sym.anx,'Anxiety',TWILIGHT_IC.horizon)}
    </div>
    <section class="tw-meds"><div class="tw-label">Today's meds</div><div class="tw-medcard">${todayMedicationRows()}</div></section>
    ${notesOpen?'<textarea class="tw-notes" maxlength="4000" data-act="num" data-k="notes" placeholder="Anything worth remembering…">'+esc(e.notes||'')+'</textarea>':''}
    <button class="tw-quiet" data-act="notes-toggle">${notesOpen?'Done':'Add a note about today'}</button>
  </div>`;
}
function adherenceDots(m){
  return '<div class="wk" aria-label="Last seven scheduled doses">'+rangeDates(7).map(d=>{
    if(!(m.days||[]).includes(parseISO(d).getDay())) return '<i></i>';
    const rec=DB.entries[d]&&DB.entries[d].med&&DB.entries[d].med[m.id];
    return '<i class="'+(rec&&rec.taken?'t':'s')+'"></i>';
  }).join('')+'</div>';
}
function medicationForm(){
  return `<div class="tw-form-card" aria-label="Add medication">
    <label class="fl" for="med-name">Medication and dose</label><input id="med-name" type="text" maxlength="80" placeholder="Estradot 50µg">
    <div class="grid2"><div><label class="fl" for="med-form">Form</label><select id="med-form"><option>patch</option><option>tablet</option><option>capsule</option><option>gel</option><option>spray</option><option>cream</option><option>other</option></select></div><div><label class="fl" for="med-due">Usual time</label><input id="med-due" type="time"></div></div>
    <label class="fl">Scheduled days</label><div class="tw-day-picks">${DAY_SHORT.map((d,i)=>h('button',{class:'chip','data-act':'med-day','data-v':i,'aria-pressed':medDaysDraft.includes(i)?'true':'false','aria-label':['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][i]},d)).join('')}</div>
    <div class="grid2"><div><label class="fl" for="med-started">Started or changed</label><input id="med-started" type="date" max="${todayISO()}" value="${todayISO()}"></div><div><label class="fl" for="med-change-label">What changed (optional)</label><input id="med-change-label" type="text" maxlength="120" placeholder="Dose, form, or timing"></div></div>
    <label class="fl" for="med-notes">Notes (optional)</label><input id="med-notes" type="text" maxlength="120" placeholder="Prescriber instructions">
    <div class="btn-row split"><button class="btn primary" data-act="med-save">Save medication</button><button class="btn ghost" data-act="med-cancel">Cancel</button></div>
  </div>`;
}
function labForm(){
  return `<div class="tw-form-card" aria-label="Add lab result"><div class="grid2"><div><label class="fl" for="lab-name">Test</label><input id="lab-name" type="text" maxlength="80" placeholder="Estradiol"></div><div><label class="fl" for="lab-date">Date</label><input id="lab-date" type="date" max="${todayISO()}" value="${todayISO()}"></div></div><div class="grid2"><div><label class="fl" for="lab-value">Result</label><input id="lab-value" type="text" maxlength="40" placeholder="312"></div><div><label class="fl" for="lab-unit">Unit</label><input id="lab-unit" type="text" maxlength="30" placeholder="pmol/L"></div></div><div class="btn-row split"><button class="btn primary" data-act="lab-save">Save result</button><button class="btn ghost" data-act="lab-cancel">Cancel</button></div></div>`;
}
function viewMeds(){
  const meds=Array.isArray(DB.medications)?DB.medications:[], labs=Array.isArray(DB.labs)?DB.labs:[];
  return `<div class="view tw-screen tw-secondary">${twilightHeader('Medications','Schedules, daily doses and lab context in one place.')}
    <div class="tw-med-list">${meds.length?meds.map((m,i)=>'<div class="tw-med-card"><div class="tw-medrow static">'+medicationIcon(m)+'<span class="tw-grow"><b>'+esc(m.name)+'</b><small>'+esc(medicationDetail(m))+(m.due?' · '+esc(m.due):'')+'</small></span><button class="tw-remove" data-act="med-remove" data-i="'+i+'" aria-label="Remove '+esc(m.name)+'">×</button></div>'+adherenceDots(m)+'</div>').join(''):'<div class="tw-med-card tw-empty"><b>No medications yet</b><span>Add only what you actually take.</span></div>'}</div>
    ${medFormOpen?medicationForm():'<button class="btn ghost block" data-act="med-add">Add a medication</button>'}
    <div class="tw-label tw-labs-label">Labs</div><div class="tw-medcard">${labs.length?labs.slice(0,6).map((x,i)=>'<div class="tw-medrow static">'+TWILIGHT_IC.lab+'<span class="tw-grow"><b>'+esc(x.name)+'</b><small>'+esc(fmtDay(x.date))+'</small></span><span class="tw-due">'+esc(x.value+(x.unit?' '+x.unit:''))+'</span><button class="tw-remove" data-act="lab-remove" data-i="'+i+'" aria-label="Remove '+esc(x.name)+'">×</button></div>').join(''):'<div class="tw-empty-med">No lab results yet</div>'}</div>
    ${labFormOpen?labForm():'<button class="tw-quiet" data-act="lab-add">Add result</button>'}
  </div>`;
}
function viewReport(){
  const dates=entryDates(), logged=dates.length, end=todayISO(), start=addDays(end,-89);
  return `<div class="view tw-screen tw-secondary">${twilightHeader('Doctor report','Turn your private log into a focused appointment summary.')}
    <div class="tw-chips"><span>30d</span><span class="on">90d</span><span>180d</span></div>
    <div class="tw-pagewrap"><div class="tw-doc"><h2>Symptom &amp; treatment summary</h2><p>${esc(fmtDay(start))} – ${esc(fmtDay(end))} · ${logged} days logged · prepared with MenoCompass</p><div class="tw-doc-rule"></div><b>Current overview</b><p>Your private log is ready to turn into a clinician-friendly summary. Generated reports include symptoms, treatment context and safety notes.</p></div></div>
    <div class="tw-observed"><span>Observed</span><p>Patterns become more useful as you log consistently and mark treatment changes.</p><small>Correlation is not causation — bring the report to your clinician.</small></div>
    <button class="btn primary block" data-act="sheet" data-s="report">Generate report</button>
  </div>`;
}

/* ============================================================
   JOURNEY COMPASS — SELECTED PRODUCT FLOW
   ============================================================ */
function jcChrome(backLabel){
  return `<div class="jc-chrome">
    <div class="jc-chrome-main">
      <div class="jc-wordmark" aria-label="MenoCompass"><span>MENO</span>COMPASS</div>
      <div class="jc-global-actions">
        <button data-act="sheet" data-s="tools" aria-label="Open tools">${PULSE_IC.grid}</button>
        <button data-act="sheet" data-s="redflags" aria-label="Safety guidance">${PULSE_IC.safety}</button>
        <button data-act="open-profile" aria-label="Open Profile">${PULSE_IC.profile}</button>
      </div>
    </div>
    ${backLabel?`<button class="jc-back" data-act="go-back">${IC.chev}<span>${esc(backLabel)}</span></button>`:''}
  </div>`;
}
function jcHeading(title,subtitle,eyebrow){
  return `<div class="jc-page-head">${eyebrow?`<span class="jc-eyebrow">${esc(eyebrow)}</span>`:''}<h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div>`;
}
function confirmedRecord(date){
  if(typeof confirmedEntry==='function') return confirmedEntry(date);
  const raw=DB.entries[date];
  return raw&&raw.confirmed===true?raw:null;
}
function draftHasContent(raw){
  return typeof hasEntryContent==='function'?hasEntryContent(raw):!!raw;
}
function dayState(date){
  const raw=DB.entries[date], confirmed=confirmedRecord(date);
  if(confirmed && raw&&raw.draftDirty) return {key:'draft',label:'Draft saved — confirmed version stays in patterns',confirmed};
  if(confirmed) return {key:'confirmed',label:(date===todayISO()?'Today':'Day')+' · confirmed',confirmed};
  if(raw&&draftHasContent(raw)) return {key:'draft',label:'Draft saved — not included in patterns',confirmed:null};
  return {key:'empty',label:(date===todayISO()?'Today':'Day')+' · not logged yet',confirmed:null};
}
function focusedKeys(){
  const pins=DB.profile&&Array.isArray(DB.profile.pinnedSymptoms)?DB.profile.pinnedSymptoms:[];
  return pins.length>=3?pins.slice(0,6):['hf','ns','fog','energy','joint','anx'];
}
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
function symptomIcon(key){
  return key==='hf'?TWILIGHT_IC.flame:key==='ns'?TWILIGHT_IC.moon:(SYM_IC[key]||TWILIGHT_IC.cycle);
}
function recordSummary(record){
  if(!record) return 'No confirmed entries yet.';
  const ranked=focusedKeys().map(k=>({k,v:symptomValue(record,k)})).filter(x=>x.v!=null&&x.v>0).sort((a,b)=>b.v-a.v);
  if(!ranked.length) return 'Tracked symptoms were quiet on this confirmed day.';
  const first=ranked[0], suffix=first.k==='hf'?(first.v+' '+(first.v===1?'flash':'flashes')):(['none','mild','moderate','severe','very severe'][Math.min(4,first.v)]||first.v);
  const lead=first.k==='hf'?'Hot flashes: '+suffix:symptomName(first.k)+' was '+suffix;
  return lead+(ranked[1]?' · '+symptomName(ranked[1].k)+' was also present.':'.');
}
function weeklyPatternText(){
  const dates=entryDates();
  if(dates.length<14) return null;
  const recent=dates.slice(-7), prior=dates.slice(-14,-7);
  const candidates=focusedKeys().map(k=>{
    const a=avg(recent.map(d=>symptomValue(confirmedRecord(d),k)));
    const b=avg(prior.map(d=>symptomValue(confirmedRecord(d),k)));
    return {k,a,b,delta:a!=null&&b!=null?a-b:null};
  }).filter(x=>x.delta!=null).sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta));
  if(!candidates.length) return 'Your confirmed days do not yet share enough of the same symptom fields for a weekly comparison.';
  const top=candidates[0];
  if(Math.abs(top.delta)<0.35) return 'Your most recent confirmed week looks broadly steady compared with the prior logged week.';
  return symptomName(top.k)+' has been '+(top.delta<0?'lower':'higher')+' than in the prior confirmed week.';
}
function treatmentEvents(){
  const out=[];
  (Array.isArray(DB.medications)?DB.medications:[]).forEach(m=>{
    if(pastOrTodayISO(m.started)) out.push({date:m.started,order:0,title:m.name+' started',body:m.notes||medicationDetail(m)});
    (Array.isArray(m.changes)?m.changes:[]).forEach(change=>{
      if(change&&pastOrTodayISO(change.date)) out.push({date:change.date,order:1,title:m.name+' changed',body:change.label||'Treatment details updated.'});
    });
    if(pastOrTodayISO(m.ended)) out.push({date:m.ended,order:2,title:m.name+' ended',body:'Marked as no longer active.'});
  });
  return out.sort((a,b)=>b.date.localeCompare(a.date)||(b.order||0)-(a.order||0));
}
function comparisonPanel(count){
  const ready=count>=14;
  return `<div class="jc-sufficiency"><div><strong>${count} confirmed ${count===1?'day':'days'}</strong><span>${ready?'Comparisons are ready — keep confirming changes.':'Comparisons unlock after 14.'}</span></div><div class="jc-progress" aria-label="${Math.min(count,14)} of 14 confirmed days"><i style="width:${Math.min(100,count/14*100)}%"></i></div></div>`;
}
function dcWeekStrip(anchor){
  const days=Array.from({length:7},(_,i)=>addDays(anchor,i-6));
  return `<div class="dc-week" aria-label="Seven-day calendar">${days.map(date=>{
    const d=parseISO(date), active=date===anchor;
    return `<time class="dc-week-day${active?' active':''}" datetime="${date}" aria-current="${active?'date':'false'}"><span>${d.toLocaleDateString(undefined,{weekday:'short'}).toUpperCase()}</span><strong>${d.getDate()}</strong>${active?'<i aria-hidden="true"></i>':''}</time>`;
  }).join('')}</div>`;
}
function dcProgress(count){
  const shown=Math.min(count,14), ready=count>=14;
  const copy=ready?'patterns are ready to explore.':shown?'patterns are starting to form.':'Log 14 confirmed days to start finding patterns.';
  return `<div class="dc-progress"><div role="progressbar" aria-label="Confirmed days toward pattern insights" aria-valuemin="0" aria-valuemax="14" aria-valuenow="${shown}"><i style="width:${Math.min(100,count/14*100)}%"></i></div><p>${shown?`<strong>${shown} of 14 days</strong> — `:''}${copy}</p></div>`;
}
function dcTodayTask(date){
  const due=scheduledMeds(date), all=Array.isArray(DB.medications)?DB.medications:[];
  if(due.length){
    const m=due[0], rec=DB.entries[date]&&DB.entries[date].med&&DB.entries[date].med[m.id];
    return `<section class="dc-feature dc-task"><div class="dc-orb amber">${PULSE_IC.task}</div><div class="dc-feature-copy"><span>Today’s task</span><h2>${esc(m.name)} · ${rec&&rec.taken?'complete':'due today'}</h2><p>${rec&&rec.taken?'Recorded for today. Tap again if you need to undo it.':'Keeps your treatment record on track.'}</p><button class="dc-outline-action" data-act="med-taken" data-id="${esc(m.id)}">${PULSE_IC.check}<span>${rec&&rec.taken?'Done today':'Mark as done'}</span></button></div></section>`;
  }
  return `<section class="dc-feature dc-task"><div class="dc-orb amber">${PULSE_IC.task}</div><div class="dc-feature-copy"><span>Today’s task</span><h2>${all.length?'Nothing is due today':'Add your treatment plan'}</h2><p>${all.length?'Your next scheduled treatment will appear here.':'Keep treatment changes on track.'}</p><button class="dc-text-link" data-act="tab" data-v="care">${all.length?'Open Care':'Add treatment'} ${IC.chev}</button></div></section>`;
}
function jcTimelineEvent(kind,meta,title,body,extra){
  const icon={treatment:PULSE_IC.task,pattern:PULSE_IC.journey,confirmed:PULSE_IC.today,draft:PULSE_IC.check,waiting:PULSE_IC.recap}[kind]||PULSE_IC.check;
  return `<article class="jc-timeline-event ${esc(kind)}"><div class="jc-node" aria-hidden="true">${icon}</div><div class="jc-event-copy"><span class="jc-event-meta">${esc(meta)}</span><h2>${esc(title)}</h2><p>${esc(body)}</p>${extra||''}</div></article>`;
}
function viewHome(){
  const t=todayISO(), state=dayState(t), count=entryDates().length;
  const dates=entryDates(), latestDate=dates.length?dates[dates.length-1]:null, latest=latestDate?confirmedRecord(latestDate):null;
  const cta=state.key==='confirmed'?'Review today':state.key==='draft'?'Finish check-in':'Check in';
  const pattern=weeklyPatternText();
  const recapTitle=pattern||recordSummary(latest);
  const recapBody=pattern?'Compared with your prior confirmed week.':latestDate?'From your latest confirmed day, '+fmtDay(latestDate)+'.':'Confirm a few quick check-ins and your first recap will appear here.';
  const longDate=parseISO(t).toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric',year:'numeric'}).toUpperCase();
  return `<div class="view jc-screen jc-home">
    ${jcChrome()}
    <p class="dc-date">${esc(longDate)}</p>
    ${dcWeekStrip(t)}
    <div class="dc-hero"><h1>How are you today?</h1><p>A 30-second check-in helps you understand what changed and what to do next.</p></div>
    <button class="jc-primary dc-checkin" data-act="start-checkin">${PULSE_IC.check}<span>${esc(cta)}</span></button>
    ${dcProgress(count)}
    ${quickToolsMarkup('today')}
    ${DB.trigger&&DB.trigger.active?triggerBanner():''}
    ${DB.profile.onboardingDeferred?`<button class="jc-open-row jc-setup" data-act="finish-setup"><span>${TWILIGHT_IC.cycle}</span><span><b>Finish your context</b><small>Personalize guidance and the symptoms you watch.</small></span>${IC.chev}</button>`:''}
    <section class="dc-feature dc-recap"><div class="dc-orb">${PULSE_IC.recap}</div><div class="dc-feature-copy"><span>Today’s recap</span><h2>${esc(recapTitle)}</h2><p>${esc(recapBody)}</p><button class="dc-text-link" data-act="tab" data-v="journey">See why ${IC.chev}</button></div></section>
    ${dcTodayTask(t)}
    <div class="dc-privacy">${PULSE_IC.privacy}<p><strong>Your data stays on this device.</strong><span>Private, local, and for your care.</span></p></div>
  </div>`;
}
function viewJourney(){
  const t=todayISO(), state=dayState(t), dates=entryDates(), count=dates.length, events=treatmentEvents();
  const todayBody=state.key==='confirmed'?recordSummary(state.confirmed):state.key==='draft'?('Your draft is saved locally. The last confirmed version stays in patterns'+(state.confirmed?' — '+recordSummary(state.confirmed):'.')):'No confirmed entry yet. Log to keep your story complete.';
  let timeline=jcTimelineEvent(state.key,'Today',state.label,todayBody);
  if(events.length){
    const event=events[0];
    timeline+=jcTimelineEvent('treatment',fmtDay(event.date),event.title,event.body,'<span class="jc-proof">Early signal — not proof.</span>');
  } else if(DB.medications.length){
    timeline+=jcTimelineEvent('treatment','Treatment plan','Add a change date',DB.medications.length+' active treatment '+(DB.medications.length===1?'item is':'items are')+' on file. Record when something changes to place it in your story.');
  }
  const pattern=weeklyPatternText();
  if(pattern){
    timeline+=jcTimelineEvent('pattern','Recent confirmed weeks','Weekly pattern',pattern,'<button class="jc-inline-action" data-act="sheet" data-s="learn:symptoms">What this means '+IC.chev+'</button>');
  } else if(dates.length&&dates[dates.length-1]!==t){
    const last=dates[dates.length-1], record=confirmedRecord(last);
    timeline+=jcTimelineEvent('confirmed',fmtDay(last),'Latest confirmed day',recordSummary(record));
  } else {
    timeline+=jcTimelineEvent('waiting','Weekly pattern','Waiting for confirmed days','Comparisons need 14 confirmed days. Drafts and treatment-only entries do not count.');
  }
  return `<div class="view jc-screen jc-journey">
    ${jcChrome()}
    ${jcHeading('Your journey','Symptoms and treatment changes, in one story.')}
    <button class="jc-primary" data-act="start-checkin">${PULSE_IC.check}<span>${state.key==='confirmed'?'Edit today':state.key==='draft'?'Finish check-in':'Log today'}</span></button>
    <div class="jc-timeline">${timeline}</div>
    ${comparisonPanel(count)}
  </div>`;
}
function treatmentChangeForm(m){
  return `<div class="tw-form-card jc-inline-form"><h3>Record a change to ${esc(m.name)}</h3><label class="fl" for="change-date">Change date</label><input id="change-date" type="date" max="${todayISO()}" value="${todayISO()}"><label class="fl" for="change-label">What changed?</label><input id="change-label" type="text" maxlength="120" placeholder="Dose, form, timing, or reason"><div class="btn-row split"><button class="btn primary" data-act="med-change-save" data-id="${esc(m.id)}">Save change</button><button class="btn ghost" data-act="med-change-cancel">Cancel</button></div></div>`;
}
function viewCare(){
  const meds=Array.isArray(DB.medications)?DB.medications:[], labs=Array.isArray(DB.labs)?DB.labs:[], due=scheduledMeds(todayISO()), count=entryDates().length;
  const changeMed=treatmentChangeTarget?meds.find(m=>m.id===treatmentChangeTarget):null;
  return `<div class="view jc-screen jc-care">
    ${jcChrome()}
    ${jcHeading('Care','Treatments, appointments, and follow-ups in one place.')}
    ${!medFormOpen&&!changeMed?'<button class="jc-primary" data-act="med-add">Add treatment or change</button>':''}
    ${medFormOpen?medicationForm():''}${changeMed?treatmentChangeForm(changeMed):''}
    <section class="jc-section"><div class="jc-section-head"><span>Today’s care</span></div><div class="jc-open-list">${due.length?todayMedicationRows(true):`<p class="jc-empty-line">${meds.length?'Nothing scheduled today.':'No treatments added yet. Add what you take so changes can appear in your journey.'}</p>`}</div></section>
    <section class="jc-context jc-appointment"><span>Appointments</span><h2>${count<7?'Early summary':'Your report is taking shape'}</h2><p>Based on ${count} confirmed ${count===1?'day':'days'}. Self-reported; not a clinical record.</p><button class="jc-secondary" data-act="open-report">Prepare appointment report</button><button class="jc-inline-action" data-act="sheet" data-s="learn:clinician">Build a question list ${IC.chev}</button></section>
    <section class="jc-section"><div class="jc-section-head"><span>Your treatment plan</span>${meds.length?'<button data-act="med-add">Add</button>':''}</div>
      <div class="jc-treatment-list">${meds.length?meds.map((m,i)=>`<article class="jc-treatment"><div>${medicationIcon(m)}<span><b>${esc(m.name)}</b><small>${esc(medicationDetail(m))}${m.started?' · since '+esc(fmtDay(m.started)):''}</small></span></div><div class="jc-treatment-actions"><button data-act="med-change" data-id="${esc(m.id)}">Record change</button><button data-act="med-remove" data-i="${i}" aria-label="Remove ${esc(m.name)}">Remove</button></div></article>`).join(''):'<p class="jc-empty-line">No treatments added yet.</p>'}</div>
    </section>
    <section class="jc-section"><div class="jc-section-head"><span>Labs</span><button data-act="lab-add">Add result</button></div>${labFormOpen?labForm():`<div class="jc-data-list">${labs.length?labs.slice(0,6).map((x,i)=>`<div><span><b>${esc(x.name)}</b><small>${esc(fmtDay(x.date))}</small></span><strong>${esc(x.value+(x.unit?' '+x.unit:''))}</strong><button data-act="lab-remove" data-i="${i}" aria-label="Remove ${esc(x.name)} result">×</button></div>`).join(''):'<p class="jc-empty-line">No lab results yet.</p>'}</div>`}</section>
    <button class="jc-open-row" data-act="sheet" data-s="learn:screening"><span>${TWILIGHT_IC.calendar}</span><span><b>Preventive care</b><small>Keep screening dates and regional guidance together.</small></span>${IC.chev}</button>
  </div>`;
}
function guideRows(ids){
  return ids.map(id=>LEARN_MODULES.find(m=>m.id===id)).filter(Boolean).map(m=>h('button',{class:'jc-guide-row','data-act':'sheet','data-s':'learn:'+m.id,'data-guide-text':(m.n+' '+m.s).toLowerCase()},'<span class="ico">'+m.i+'</span><span class="txt"><b>'+esc(m.n)+'</b><span>'+esc(m.s)+'</span></span><span class="chev">'+IC.chev+'</span>')).join('');
}
function guideGroup(title,ids){ return `<section class="jc-guide-group" data-guide-group><h2>${esc(title)}</h2>${guideRows(ids)}</section>`; }
function viewGuide(){
  const intent=DB.profile.intent||'understand';
  const rec={understand:'stage',treatment:'treatment',appointment:'clinician',record:'symptoms'}[intent]||'stage';
  const recommendation=LEARN_MODULES.find(m=>m.id===rec)||LEARN_MODULES[0];
  return `<div class="view jc-screen jc-guide">
    ${jcChrome()}
    ${jcHeading('Guide','Evidence without the hype, matched to where you are.')}
    <label class="jc-search"><span class="sr-only">Search Guide</span><input type="search" data-act="guide-search" value="${esc(guideQuery)}" placeholder="Search symptoms, treatments, and questions"></label>
    ${quickToolsMarkup('guide')}
    <section class="jc-context jc-for-you"><span>For you</span><h2>${esc(recommendation.n)}</h2><p>${esc(recommendation.s)}</p><button class="jc-inline-action" data-act="sheet" data-s="learn:${esc(recommendation.id)}">Open guide ${IC.chev}</button></section>
    <div id="guide-results">
      ${guideGroup('Understand',['stage','symptoms'])}
      ${guideGroup('Treat',['treatment','supplements'])}
      ${guideGroup('Feel better',['sleep','mind','exercise','sex','diet','weight','skin'])}
      ${guideGroup('Prepare',['clinician','screening','sources'])}
      <p class="jc-no-results" hidden>No matching guidance. Try a symptom or treatment name.</p>
    </div>
    <p class="jc-footnote">Education, not medical advice. Content reviewed July 2026.</p>
  </div>`;
}
function filterGuideResults(){
  const root=document.getElementById('guide-results'); if(!root) return;
  const q=guideQuery.trim().toLowerCase(), rows=[...root.querySelectorAll('[data-guide-text]')];
  rows.forEach(row=>{ row.hidden=!!q&&!row.dataset.guideText.includes(q); });
  root.querySelectorAll('[data-guide-group]').forEach(group=>{ group.hidden=![...group.querySelectorAll('[data-guide-text]')].some(row=>!row.hidden); });
  const empty=root.querySelector('.jc-no-results'); if(empty) empty.hidden=rows.some(row=>!row.hidden);
}
function jcSeverityControl(key,value){
  const labels=['None','Mild','Moderate','Severe','Very severe'];
  return `<div class="jc-check-row"><div class="jc-check-label">${symptomIcon(key)}<span><b>${esc(symptomName(key))}</b><small>${value==null?'Choose 0–4':labels[Math.min(4,value)]}</small></span></div><div class="jc-scale" role="group" aria-label="${esc(symptomName(key))}">${labels.map((label,i)=>`<button data-act="set" data-k="${esc(symptomPath(key))}" data-v="${i}" aria-label="${esc(symptomName(key)+': '+label)}" aria-pressed="${value===i?'true':'false'}"><i></i><span>${i}</span></button>`).join('')}</div></div>`;
}
function viewCheckin(){
  const t=todayISO(), raw=entry(t), count=entryDates().length, backLabel=returnTab==='journey'?'Journey':'Today';
  if(checkinComplete){
    return `<div class="view jc-screen jc-checkin jc-complete">${jcChrome(backLabel)}${jcHeading('Today is confirmed.','Your Journey and appointment report now use this version.',fmtLong(t))}${comparisonPanel(count)}<button class="jc-primary" data-act="back-journey">Back to Journey</button><button class="jc-secondary" data-act="checkin-add-treatment">Add treatment change</button></div>`;
  }
  const state=dayState(t), keys=focusedKeys();
  return `<div class="view jc-screen jc-checkin">
    ${jcChrome(backLabel)}
    ${jcHeading('Today’s check-in','Nothing counts in your patterns until you confirm.',fmtLong(t))}
    <div class="jc-draft-badge ${state.key}">${state.key==='confirmed'?'Confirmed version on file':state.label}</div>
    <section class="jc-check-list">
      ${keys.map(key=>key==='hf'?`<div class="jc-check-row"><div class="jc-check-label">${TWILIGHT_IC.flame}<span><b>Hot flashes</b><small>Actual count today</small></span></div><div class="jc-count"><button data-act="hf" data-n="-1" aria-label="One fewer hot flash">−</button><strong>${raw.hf==null?'—':raw.hf}</strong><button data-act="hf" data-n="1" aria-label="One more hot flash">+</button><button data-act="set" data-k="hf" data-v="0">None</button></div></div>`:jcSeverityControl(key,symptomValue(raw,key))).join('')}
    </section>
    <button class="jc-inline-action jc-add-symptom" data-act="open-tracking">Add another symptom ${IC.chev}</button>
    <section class="jc-section"><div class="jc-section-head"><span>Today’s treatment</span></div><div class="jc-open-list">${todayMedicationRows(true)}</div></section>
    <label class="jc-note"><span>Anything worth remembering?</span><textarea maxlength="4000" data-act="num" data-k="notes" placeholder="What helped, what changed, or a question for your clinician…">${esc(raw.notes||'')}</textarea></label>
    <button class="jc-secondary" data-act="more-details">Add more detail</button>
    <button class="jc-primary jc-confirm" data-act="confirm-log">Confirm today’s log</button>
  </div>`;
}
function viewAppointmentReport(){
  const count=entryDates().length, report=reportSheet(reportRange);
  return `<div class="view jc-screen jc-report-route">${jcChrome('Care')}${jcHeading('Appointment report',count<7?'Early summary — facts only until more days are confirmed.':'A focused summary for a more useful conversation.')}
    <div class="jc-range" role="group" aria-label="Report range">${[30,90,180].map(n=>`<button data-act="report-range" data-v="${n}" aria-pressed="${reportRange===n?'true':'false'}">${n} days</button>`).join('')}</div>
    <p class="jc-report-provenance">Based on ${count} confirmed ${count===1?'day':'days'}. Self-reported; not a clinical record.</p>
    ${report.body}
    <button class="jc-secondary" data-act="go-care">Back to Care</button>
  </div>`;
}

/* ============================================================
   RENDER + EVENTS
   ============================================================ */
function applyTheme(){
  document.documentElement.setAttribute('data-theme','dark');
  const meta=document.querySelector('meta[name="theme-color"]');
  if(meta) meta.setAttribute('content','#071416');
}
const TAB_TITLES = {today:['Today','What matters now'], journey:['Journey','Symptoms and changes'], care:['Care','Treatment and appointments'], guide:['Guide','Evidence and tools']};
const ROUTE_ALIASES = {trends:'journey',meds:'care',report:'appointment-report',settings:'profile',you:'profile',learn:'guide'};
function normalizeRoute(route){ return ROUTE_ALIASES[route]||route; }
function setRoute(route,replace){
  route=normalizeRoute(route);
  curTab=route;
  if(location.protocol!=='file:'){
    const hash='#'+route;
    if(location.hash!==hash) history[replace?'replaceState':'pushState'](null,'',hash);
  }
}
function topbarContent(){
  const name=safeText(DB.profile.name,80).trim();
  const hour=new Date().getHours();
  const greeting=hour<12?'Good morning':hour<18?'Good afternoon':'Good evening';
  if(curTab==='today'){
    const selected=parseISO(curDate).toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'});
    return '<div class="top-copy"><h1>'+esc(selected)+'</h1>'
      +'<span class="sub">'+esc((greeting+(name?', '+name:'')).toUpperCase())+'</span></div>';
  }
  const copy={
    trends:['Patterns are taking shape','WHAT YOUR LOGS SHOW'],
    meds:['Medications','TREATMENT & ADHERENCE'],
    report:['Doctor report','YOUR CLINICIAN SUMMARY'],
    settings:['Your compass','PROFILE, TOOLS & DATA'],
    you:['Your compass','PROFILE, TOOLS & DATA'],
    learn:['Know what helps','EVIDENCE WITHOUT THE HYPE'],
    'today-details':['Detailed daily log','SLEEP, BODY & LIFESTYLE']
  }[curTab];
  return '<div class="top-copy"><h1>'+esc(copy[0])+'</h1><span class="sub">'+esc(copy[1])+'</span></div>';
}
function render(preserveScroll){
  const scrollY=preserveScroll ? window.scrollY : 0;
  refreshTriggerStatus();
  applyTheme();
  if(!DB.profile.onboarded){
    $('#app').innerHTML = viewOnboard();
    $('#tabs').style.display='none';
    $('#topbar').style.display='none';
    return;
  }
  const primary=Object.prototype.hasOwnProperty.call(TAB_TITLES,curTab);
  $('#tabs').style.display=primary?'':'none';
  $('#topbar').style.display='none';
  const map = {today:viewHome, journey:viewJourney, care:viewCare, guide:viewGuide, checkin:viewCheckin, profile:viewYou, 'appointment-report':viewAppointmentReport, 'today-details':viewToday};
  const view=map[curTab]||viewHome;
  $('#app').innerHTML = view();
  if(curTab==='guide'&&guideQuery) filterGuideResults();
  const strip = document.querySelector('.dayscroll');
  if(strip){
    const sel = strip.querySelector('[aria-pressed="true"]');
    if(sel) strip.scrollLeft = Math.max(0, sel.offsetLeft - strip.clientWidth/2 + sel.offsetWidth/2);
  }
  document.querySelectorAll('nav.tabs button').forEach(b=>{
    b.setAttribute('aria-current', b.dataset.v===curTab?'page':'false');
    const locked = nativeProLocked(b.dataset.v);
    b.classList.toggle('pro-locked', locked);
    if(locked) b.setAttribute('aria-label', (TAB_TITLES[b.dataset.v]||[b.dataset.v])[0]+' — MenoCompass Pro');
    else b.removeAttribute('aria-label');
  });
  window.scrollTo(0,preserveScroll?scrollY:0);
}

function nativeProLocked(area){
  return window.__MENO_NATIVE__===true
    && window.__MENO_PRO_ACTIVE__!==true
    && (normalizeRoute(area)==='journey'||normalizeRoute(area)==='appointment-report');
}
function requestNativePro(area){
  if(!nativeProLocked(area)) return false;
  try{
    if(window.ReactNativeWebView){
      const route=normalizeRoute(area), feature=route;
      window.ReactNativeWebView.postMessage(JSON.stringify({type:'open-pro-paywall',feature}));
    }
  }catch(e){}
  toast('MenoCompass Pro unlocks Journey patterns and appointment reports');
  return true;
}
window.addEventListener('menocompass-pro-changed',()=>{
  if(nativeProLocked(curTab)) setRoute('today',true);
  render(true);
});

function handleAction(el, ev){
  const a = el.dataset.act;
  const e = () => entry(curDate);
  switch(a){
    case 'tab': {
      const target=normalizeRoute(el.dataset.v);
      if(requestNativePro(target)) return;
      setRoute(target); sheetStack=[]; renderSheet(); render(); return;
    }
    case 'start-checkin':
      returnTab=Object.prototype.hasOwnProperty.call(TAB_TITLES,curTab)?curTab:'today';
      curDate=todayISO(); checkinComplete=false; setRoute('checkin'); render(); return;
    case 'open-profile':
      if(curTab!=='profile') returnTab=Object.prototype.hasOwnProperty.call(TAB_TITLES,curTab)?curTab:(returnTab||'today');
      setRoute('profile'); render(); return;
    case 'go-back': {
      const target=curTab==='checkin'?(returnTab||'today'):curTab==='today-details'?'checkin':curTab==='appointment-report'?'care':(returnTab||'today');
      setRoute(target); checkinComplete=false; render(); return;
    }
    case 'back-checkin': setRoute('checkin'); render(); return;
    case 'more-details': returnTab='checkin'; setRoute('today-details'); render(); return;
    case 'confirm-log': {
      const ok=typeof confirmEntry==='function'?confirmEntry(curDate):draftHasContent(e());
      if(!ok){ toast('Choose at least one symptom or add a note before confirming'); return; }
      if(typeof confirmEntry!=='function'){ e().confirmed=true; e().draftDirty=false; }
      save(true);
      postNativeEvent('checkin-confirmed',{date:curDate});
      if(curDate===todayISO()){ checkinComplete=true; setRoute('checkin',true); render(); }
      else { setRoute('journey'); render(); toast('Confirmed day updated'); }
      return;
    }
    case 'back-journey': checkinComplete=false; setRoute('journey'); render(); return;
    case 'checkin-add-treatment': checkinComplete=false; medFormOpen=true; setRoute('care'); render(); return;
    case 'open-tracking': returnTab='checkin'; setRoute('profile'); render(); return;
    case 'open-report':
      if(requestNativePro('appointment-report')) return;
      postNativeEvent('report-opened',{rangeDays:reportRange});
      returnTab='care'; setRoute('appointment-report'); render(); return;
    case 'go-care': setRoute('care'); render(); return;
    case 'report-range': reportRange=+el.dataset.v; render(true); return;
    case 'finish-setup':
      returnTab='today'; setRoute('profile'); render();
      setTimeout(()=>document.querySelector('#pn,[data-act="sheet"][data-s="learn:stage"]')?.focus(),0);
      return;
    case 'manage-subscription':
      postNativeEvent('open-subscription-management'); return;
    case 'reset-onboarding':
      openSheet('reset-onboarding-confirm'); return;
    case 'confirm-reset-onboarding':
      DB.profile.onboarded=false;
      DB.profile.onboardingStep=0;
      DB.profile.onboardingDeferred=false;
      setRoute('today',true);
      sheetStack=[]; renderSheet(); save(true); render();
      toast('Onboarding reset — your health history is still here');
      return;
    case 'delete-local-data':
      openSheet('delete-local-data-confirm'); return;
    case 'confirm-delete-local-data':
      Store.clear();
      DB=blankDB();
      setRoute('today',true);
      sheetStack=[]; renderSheet(); save(true); render();
      toast('App profile and data deleted');
      return;
    case 'notes-toggle': notesOpen=!notesOpen; render(true); return;
    case 'med-taken': {
      const m=DB.medications.find(x=>x.id===el.dataset.id); if(!m) return;
      const day=e(), records=day.med||(day.med={}), current=records[m.id];
      if(current&&current.taken) delete records[m.id];
      else records[m.id]={taken:true,at:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})};
      save(true); render(true); return;
    }
    case 'med-add': medFormOpen=true; treatmentChangeTarget=null; medDaysDraft=[0,1,2,3,4,5,6]; render(true); return;
    case 'med-cancel': medFormOpen=false; render(true); return;
    case 'med-day': {
      const d=+el.dataset.v; medDaysDraft=medDaysDraft.includes(d)?medDaysDraft.filter(x=>x!==d):[...medDaysDraft,d].sort(); render(true); return;
    }
    case 'med-save': {
      const name=document.getElementById('med-name'), form=document.getElementById('med-form'), due=document.getElementById('med-due'), notes=document.getElementById('med-notes'), started=document.getElementById('med-started'), changeLabel=document.getElementById('med-change-label');
      if(!name||!name.value.trim()){ toast('Enter the medication and dose'); name&&name.focus(); return; }
      if(!medDaysDraft.length){ toast('Choose at least one scheduled day'); return; }
      let id='med-'+Date.now().toString(36); while(DB.medications.some(m=>m.id===id)) id+='x';
      const med={id,name:name.value.trim(),form:form.value,days:[...medDaysDraft],due:due.value,notes:notes.value.trim(),started:started&&pastOrTodayISO(started.value)?started.value:'',changes:[]};
      if(changeLabel&&changeLabel.value.trim()&&med.started) med.changes.push({date:med.started,label:changeLabel.value.trim()});
      DB.medications.push(med);
      medFormOpen=false; save(true); render(); toast('Medication added'); return;
    }
    case 'med-change': treatmentChangeTarget=el.dataset.id; medFormOpen=false; render(true); return;
    case 'med-change-cancel': treatmentChangeTarget=null; render(true); return;
    case 'med-change-save': {
      const med=DB.medications.find(m=>m.id===el.dataset.id), date=document.getElementById('change-date'), label=document.getElementById('change-label');
      if(!med||!date||!pastOrTodayISO(date.value)||!label||!label.value.trim()){ toast('Add a valid date and describe what changed'); return; }
      med.changes=Array.isArray(med.changes)?med.changes:[];
      med.changes.push({date:date.value,label:label.value.trim()});
      treatmentChangeTarget=null; save(true); render(); toast('Treatment change added to Journey'); return;
    }
    case 'med-remove': {
      const i=+el.dataset.i; if(!DB.medications[i]) return;
      if(confirm('Remove '+DB.medications[i].name+'?')){ DB.medications.splice(i,1); save(true); render(); }
      return;
    }
    case 'lab-add': labFormOpen=true; render(true); return;
    case 'lab-cancel': labFormOpen=false; render(true); return;
    case 'lab-save': {
      const name=document.getElementById('lab-name'), date=document.getElementById('lab-date'), value=document.getElementById('lab-value'), unit=document.getElementById('lab-unit');
      if(!name.value.trim()||!value.value.trim()||!pastOrTodayISO(date.value)){ toast('Enter a test, date, and result'); return; }
      DB.labs.unshift({id:'lab-'+Date.now().toString(36),name:name.value.trim(),date:date.value,value:value.value.trim(),unit:unit.value.trim()});
      labFormOpen=false; save(true); render(); toast('Lab result added'); return;
    }
    case 'lab-remove': {
      const i=+el.dataset.i; if(DB.labs[i]&&confirm('Remove '+DB.labs[i].name+' result?')){ DB.labs.splice(i,1); save(true); render(); }
      return;
    }
    case 'day': curDate = el.dataset.d; render(); return;
    case 'range': trendRange = +el.dataset.v; render(); return;
    case 'hf': {
      const cur = e().hf==null?0:e().hf;
      const nv = Math.max(0, cur + (+el.dataset.n));
      e().hf = nv; if(typeof markEntryDraft==='function') markEntryDraft(curDate); save(); render(true); return;
    }
    case 'set': {
      const v = el.dataset.v;
      setPath(e(), el.dataset.k, v===''?null:(isNaN(v)?v:+v));
      if(typeof markEntryDraft==='function') markEntryDraft(curDate); save(); render(true); return;
    }
    case 'toggle': {
      const cur = getPath(e(), el.dataset.k);
      setPath(e(), el.dataset.k, cur?null:true);
      if(typeof markEntryDraft==='function') markEntryDraft(curDate); save(); render(true); return;
    }
    case 'theme': DB.profile.theme = el.value; save(true); render(true); return;
    case 'sheet':
      if(el.dataset.s==='report'){ if(requestNativePro('appointment-report')) return; returnTab=curTab; setRoute('appointment-report'); render(); return; }
      openSheet(el.dataset.s); return;
    case 'close': closeSheet(); return;
    case 'bg': if(ev.target===el) closeSheet(); return;
    case 'go': {
      const g = el.dataset.v;
      if(requestNativePro(g)) return;
      if(g.startsWith('learn:')||g.startsWith('tool:')) openSheet(g);
      else openSheet(g);
      return;
    }
    case 'stage-a': stageEditing=true; stageAns[el.dataset.k]=el.dataset.v; stageStep++; renderSheet(); return;
    case 'stage-back': {
      stageStep = Math.max(0, stageStep-1);
      const q = stageQueue(stageAns)[stageStep];
      if(q) delete stageAns[q.id];
      renderSheet(); return;
    }
    case 'stage-restart': resetStageDraft(); renderSheet(); return;
    case 'q-a': {
      const kind=el.dataset.k;
      if(qDrafts[kind]) qDrafts[kind][+el.dataset.i]=+el.dataset.v;
      renderSheet(); return;
    }
    case 'q-reset': if(qDrafts[el.dataset.k]) qDrafts[el.dataset.k]={}; renderSheet(); return;
    case 'q-save': {
      const kind = el.dataset.k;
      const items = kind==='phq9'?PHQ9:GAD7;
      const answers=qDrafts[kind];
      if(!answers || !items.every((_,i)=>answers[i]!=null)){ toast('Answer every question first'); return; }
      const score = items.reduce((total,_,i)=>total+answers[i],0);
      const band = kind==='phq9' ? (score<5?'minimal':score<10?'mild':score<15?'moderate':score<20?'moderately severe':'severe')
                                 : (score<5?'minimal':score<10?'mild':score<15?'moderate':'severe');
      DB.scores.push({date:todayISO(), type:kind, score, band});
      save(true); qDrafts[kind]={}; toast('Score saved'); renderSheet(); return;
    }
    case 'breath-start': breathStart(); return;
    case 'breath-stop': breathStop(); return;
    case 'pmr-start': pmrStart(); return;
    case 'pmr-stop': pmrStop(); return;
    case 'trig-start': {
      const sel=document.getElementById('trig');
      DB.trigger = {active:true, status:'running', item: sel?sel.value:'Alcohol', start: todayISO()};
      save(true); toast('Trigger test started'); renderSheet(); return;
    }
    case 'trig-stop':
      if(DB.trigger){ DB.trigger.active=false; DB.trigger.status='stopped'; DB.trigger.ended=todayISO(); }
      save(true); renderSheet(); return;
    case 'trig-reset': DB.trigger=null; save(true); renderSheet(); return;
    case 'export-json': download('meno-compass-backup-'+todayISO()+'.json', JSON.stringify(DB,null,2), 'application/json'); return;
    case 'export-csv': download('meno-compass-'+todayISO()+'.csv', toCSV(), 'text/csv'); return;
    case 'copy-dump': {
      const ta=document.getElementById('dump');
      if(ta){ ta.select(); try{ document.execCommand('copy'); toast('Copied'); }catch(x){ toast('Select and copy manually'); } }
      return;
    }
    case 'import-json': {
      const ta=document.getElementById('restore');
      if(!ta||!ta.value.trim()){ toast('Paste a backup first'); return; }
      if(ta.value.length>5000000){ toast('That backup is larger than the 5 MB limit'); return; }
      try{
        const obj=JSON.parse(ta.value);
        DB = validateBackup(obj); save(true); sheetStack=[]; renderSheet(); render(); toast('Backup restored and checked');
      }catch(x){ toast('That does not look like a valid backup'); }
      return;
    }
    case 'wipe': openSheet('delete-local-data-confirm'); return;
    case 'print': window.print(); return;
    case 'ob-next': {
      const step=+DB.profile.onboardingStep||0;
      if(step===1&&!DB.profile.intent){ toast('Choose what would help most'); return; }
      DB.profile.onboardingStep=Math.min(3,step+1); save(true); render();
      postNativeEvent('onboarding-step',{step:DB.profile.onboardingStep});
      setTimeout(()=>document.querySelector('#app input,#app select,#app [aria-pressed]')?.focus(),0);
      return;
    }
    case 'ob-back':
      DB.profile.onboardingStep=Math.max(0,(+DB.profile.onboardingStep||0)-1); save(true); render();
      setTimeout(()=>document.querySelector('#app button,#app input')?.focus(),0);
      return;
    case 'ob-intent': DB.profile.intent=el.dataset.v; save(true); render(); return;
    case 'ob-symptom': {
      const key=el.dataset.v, current=Array.isArray(DB.profile.pinnedSymptoms)?[...DB.profile.pinnedSymptoms]:['hf','ns','fog','energy','joint','anx'];
      if(current.includes(key)) DB.profile.pinnedSymptoms=current.filter(k=>k!==key);
      else if(current.length<6) DB.profile.pinnedSymptoms=[...current,key];
      else { toast('Choose up to six symptoms'); return; }
      save(true); render(); return;
    }
    case 'profile-symptom': {
      const key=el.dataset.v, current=Array.isArray(DB.profile.pinnedSymptoms)?[...DB.profile.pinnedSymptoms]:focusedKeys();
      if(current.includes(key)){
        if(current.length<=3){ toast('Keep at least three focused symptoms'); return; }
        DB.profile.pinnedSymptoms=current.filter(k=>k!==key);
      } else {
        if(current.length>=6){ toast('Choose up to six symptoms'); return; }
        DB.profile.pinnedSymptoms=[...current,key];
      }
      save(true); render(true); return;
    }
    case 'ob-done': {
      const pins=Array.isArray(DB.profile.pinnedSymptoms)?DB.profile.pinnedSymptoms:[];
      if(pins.length<3){ toast('Choose at least three symptoms'); return; }
      DB.profile.onboardingStep=3;
      DB.profile.onboarded=true;
      DB.profile.onboardingDeferred=false;
      setRoute('today',true); save(true); render();
      postNativeEvent('onboarding-finished',{skipped:false});
      return;
    }
    case 'ob-skip':
      DB.profile.onboarded=true;
      DB.profile.onboardingDeferred=true;
      save(true); render();
      postNativeEvent('onboarding-finished',{skipped:true});
      setTimeout(()=>document.querySelector('#app button,#tabs button')?.focus(),0);
      return;
  }
}

function setFieldError(el, message){
  el.setCustomValidity(message||'');
  if(message){ el.setAttribute('aria-invalid','true'); el.title=message; }
  else { el.removeAttribute('aria-invalid'); el.removeAttribute('title'); }
  return !message;
}
function readNumberInput(el){
  setFieldError(el,'');
  if(el.validity && el.validity.badInput){
    setFieldError(el,'Enter a number.'); return {ok:false,value:null};
  }
  if(el.value==='') return {ok:true,value:null};
  const value=Number(el.value);
  if(!Number.isFinite(value)){
    setFieldError(el,'Enter a finite number.'); return {ok:false,value:null};
  }
  const min=el.min!==''?Number(el.min):null, max=el.max!==''?Number(el.max):null;
  if((min!=null&&value<min)||(max!=null&&value>max)){
    const range=min!=null&&max!=null?' from '+min+' to '+max:min!=null?' of at least '+min:' no more than '+max;
    setFieldError(el,'Enter a value'+range+'.'); return {ok:false,value:null};
  }
  return {ok:true,value};
}
function readDateInput(el){
  setFieldError(el,'');
  if(el.value==='') return {ok:true,value:null};
  if(!pastOrTodayISO(el.value)){
    setFieldError(el,'Choose a valid date that is not in the future.');
    return {ok:false,value:null};
  }
  if(el.min && el.value<el.min){
    setFieldError(el,'Choose a date on or after '+el.min+'.');
    return {ok:false,value:null};
  }
  return {ok:true,value:el.value};
}

function handleInput(el){
  const a = el.dataset.act;
  if(a==='guide-search'){
    guideQuery=el.value||''; filterGuideResults(); return;
  }
  if(a==='num'){
    const k = el.dataset.k, conv = el.dataset.conv;
    const parsed=el.type==='number'?readNumberInput(el):{ok:true,value:el.value.trim()||null};
    if(!parsed.ok) return;
    let v=parsed.value;
    const day=entry(curDate);
    if(v!=null && k==='sleepH' && day.inBedH!=null && v>day.inBedH){
      setFieldError(el,'Hours asleep cannot be greater than hours in bed.'); return;
    }
    if(v!=null && k==='inBedH' && day.sleepH!=null && day.sleepH>v){
      setFieldError(el,'Hours in bed cannot be less than hours asleep.'); return;
    }
    if(v!=null && conv==='w') v = U.wIn(v);
    if(v!=null && conv==='l') v = U.lIn(v);
    setPath(day, k, v);
    if(typeof markEntryDraft==='function') markEntryDraft(curDate);
    save(); return;
  }
  if(a==='prof'){
    const k=el.dataset.k, conv=el.dataset.conv;
    let parsed;
    if(el.type==='number') parsed=readNumberInput(el);
    else if(el.type==='date') parsed=readDateInput(el);
    else parsed={ok:true,value:k==='name'?safeText(el.value,80):el.value};
    if(!parsed.ok) return;
    let v=parsed.value;
    if(k==='birthYear'&&v!=null&&!Number.isInteger(v)){
      setFieldError(el,'Enter a whole birth year.'); return;
    }
    if(el.tagName==='SELECT' && !isNaN(v) && k==='proteinGpk') v=+v;
    if(v!=null && v!=='' && conv==='w') v=U.wIn(v);
    if(v!=null && v!=='' && conv==='l') v=U.lIn(v);
    DB.profile[k] = (v===''?null:v);
    refreshStageForProfile(k);
    save();
    if(k==='units'||k==='proteinGpk'||k==='uterus'||k==='ovaries') render(true);
    return;
  }
  if(a==='screen'){
    const parsed=readDateInput(el);
    if(!parsed.ok) return;
    const rec=DB.screening[el.dataset.k]||{};
    rec.last=parsed.value;
    DB.screening[el.dataset.k]=rec;
    save(); return;
  }
  if(a==='screen-int'){
    const id=el.dataset.k, rule=SCREENING_RULES[id], years=+el.value;
    const age=DB.profile.birthYear ? new Date().getFullYear()-DB.profile.birthYear : null;
    if(!rule || !screeningIntervals(rule,age).includes(years)) return;
    const rec=DB.screening[id]||{};
    rec.intervalYears=years; DB.screening[id]=rec; save(); return;
  }
  if(a==='prot-calc'){
    const w=document.getElementById('ptw'), g=document.getElementById('ptg');
    const parsed=readNumberInput(w);
    const kg = parsed.ok&&parsed.value!=null ? U.wIn(parsed.value) : null;
    document.getElementById('prot-out').innerHTML = proteinOut(kg, +g.value);
    return;
  }
  if(a==='sw-calc'){
    const ds=rangeDates(14);
    const sleeps=ds.map(d=>{const x=confirmedRecord(d);return x&&x.sleepH!=null?x.sleepH:null;}).filter(v=>v!=null);
    const aSleep=avg(sleeps); const win = aSleep!=null&&aSleep>0?Math.max(5,Math.round(aSleep*4)/4):null;
    document.getElementById('sw-out').innerHTML = swOut(el.value, win);
    return;
  }
}

/* ---------- export ---------- */
function csvText(value){
  let text=String(value==null?'':value);
  /* Spreadsheet apps may execute cells beginning with formula characters,
     even when the CSV field is quoted. Prefix user-authored text defensively. */
  if(/^[=+\-@\t\r]/.test(text)) text="'"+text;
  return '"'+text.replace(/"/g,'""')+'"';
}
function toCSV(){
  const cols = ['date','hot_flashes','night_sweats_0_4','hours_in_bed','hours_asleep','sleep_efficiency_pct',
    ...SYMS.map(s=>s.k), 'burden_score_0_44_unvalidated','weight_kg','waist_cm','bleeding','strength_session','balance','pelvic_floor',
    'aerobic_min','protein_target_met','calcium_2plus','fibre_ok','alcohol_drinks','caffeine_cups','notes'];
  const rows = [cols.join(',')];
  entryDates().forEach(d=>{
    const e=confirmedRecord(d), s=e.sym||{}, ac=e.act||{}, nu=e.nut||{};
    const eff = (e.sleepH!=null&&e.inBedH!=null&&e.inBedH>0)?Math.round(e.sleepH/e.inBedH*100):'';
    const r = [d, e.hf??'', e.ns??'', e.inBedH??'', e.sleepH??'', eff,
      ...SYMS.map(x=>s[x.k]??''), burden(e)??'',
      e.wt!=null?r1(e.wt):'', e.waist!=null?r1(e.waist):'', e.bleed||'',
      ac.res?1:'', ac.bal?1:'', ac.pf?1:'', ac.aero??'',
      nu.prot==null?'':(nu.prot?1:0), nu.cal?1:'', nu.fib?1:'', nu.alc??'', nu.caf??'',
      csvText(e.notes||'')];
    rows.push(r.join(','));
  });
  if(DB.scores.length){
    rows.push('');
    rows.push('questionnaire_date,type,score,band');
    DB.scores.forEach(s=>rows.push([s.date,s.type,s.score,s.band||''].join(',')));
  }
  return rows.join('\n');
}
function download(name, text, mime){
  try{
    const blob = new Blob([text], {type:mime});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href=url; a.download=name; document.body.appendChild(a); a.click();
    setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 500);
    toast('Downloaded '+name);
  }catch(x){ toast('Download blocked — use the copy box instead'); }
}

/* ---------- boot ---------- */
function boot(){
  load();
  const prefilled=prefillTodayFromYesterday();
  if(prefilled||window.__MENO_NATIVE__===true) save(true);
  document.body.insertAdjacentHTML('afterbegin',
    '<header class="topbar" id="topbar"></header><main id="app"></main>'
    + '<nav class="tabs" id="tabs" aria-label="Primary"><div class="inner">'
    + Object.entries(TAB_TITLES).map(([k,v])=>h('button',{'data-act':'tab','data-v':k},IC[k]+'<span>'+v[0]+'</span>')).join('')
    + '</div></nav><div id="sheet-host"></div>');
  document.addEventListener('click', ev=>{
    const el = ev.target.closest('[data-act]');
    if(!el) return;
    /* The sheet backdrop carries data-act="bg" and wraps everything inside the
       sheet, so never preventDefault for it — that would block native
       <details> toggling, text selection and link taps within the sheet. */
    if(el.dataset.act==='bg'){
      if(ev.target===el){ ev.preventDefault(); closeSheet(); }
      return;
    }
    if(el.tagName!=='BUTTON' && el.tagName!=='A') return;
    ev.preventDefault();
    handleAction(el, ev);
  });
  document.addEventListener('input', ev=>{
    const el = ev.target.closest('[data-act]');
    if(el && (el.tagName==='INPUT'||el.tagName==='TEXTAREA')) handleInput(el);
  });
  document.addEventListener('change', ev=>{
    const el = ev.target.closest('[data-act]');
    if(el && el.tagName==='SELECT') { if(el.dataset.act==='theme'){ handleAction(el, ev); } else handleInput(el); }
    if(el && el.type==='date') handleInput(el);
    if(el && el.type==='time') handleInput(el);
  });
  document.addEventListener('keydown', keepFocusInSheet);
  if(window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', applyTheme);
  window.addEventListener('beforeunload', flush);
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='hidden') flush(); });
  window.addEventListener('storage', ev=>{
    if(ev.key!==Store.key || dirty) return;
    try{
      DB=ev.newValue ? migrate(JSON.parse(ev.newValue)) : blankDB();
      render(true); if(sheetStack.length) renderSheet();
      toast(ev.newValue?'Updated from another tab':'Data was cleared in another tab');
    }catch(e){ /* Ignore malformed writes from another script on the origin. */ }
  });
  const validRoutes=['today','journey','care','guide','checkin','profile','appointment-report','today-details'];
  const rawHash=(location.hash||'').replace('#',''), hash=normalizeRoute(rawHash);
  if(validRoutes.includes(hash)) curTab = hash;
  render();
  if(hash==='redflags') openSheet('redflags');
  window.addEventListener('hashchange', ()=>{
    const hh=normalizeRoute((location.hash||'').replace('#',''));
    if(validRoutes.includes(hh)){ curTab=hh; sheetStack=[]; renderSheet(); render(); }
    else if(hh==='redflags') openSheet('redflags');
  });
  window.addEventListener('popstate',()=>{
    const route=normalizeRoute((location.hash||'#today').replace('#',''));
    if(validRoutes.includes(route)){ curTab=route; sheetStack=[]; renderSheet(); render(); }
  });
  if('serviceWorker' in navigator && location.protocol.startsWith('http')){
    navigator.serviceWorker.register('sw.js').catch(()=>{});
  }
}
document.addEventListener('DOMContentLoaded', boot);
