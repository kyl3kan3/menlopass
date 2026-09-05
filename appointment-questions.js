/* Conversation prompts, not diagnoses or treatment instructions.
   Discussion framework: NICE NG197; menopause options: NICE NG23 and NHS.
   This function uses only the supplied local record and never requests a service. */
function buildAppointmentQuestions(brief, context) {
  const concerns = brief.concerns || [];
  if(!concerns.length) return [];
  const keys = new Set(concerns.map(item => item.key));
  const names = context.names || {};
  const name = key => names[key] || key;
  const candidates = [];
  const add = (id, priority, text, reason) => {
    if (!candidates.some(item => item.id === id)) candidates.push({id, priority, text, reason, selected:true});
  };
  const observations = context.observations || [];
  const meaningful = key => keys.has(key) || observations.some(row => row.key === key && row.ready && row.after >= 2);
  const selectedNames = concerns.map(item => name(item.key)).join(', ');
  const templates = {
    hf:['temperature','Which hormonal and non-hormonal options could reduce my hot flashes, and how would we compare their benefits, risks, and fit with my medical history?'],
    ns:['temperature','Could we compare hormonal and non-hormonal options for night sweats, including their effects on sleep and the risks relevant to me?'],
    sleepq:['sleep','How can we tell whether my sleep problem is related to night sweats, insomnia, medication, or another sleep issue? Would a sleep-focused treatment such as CBT for insomnia be worth discussing?'],
    fog:['concentration','What would you check before attributing my concentration or memory difficulties to menopause? How might sleep, mood, or medicines affect the assessment?'],
    energy:['fatigue','What would help distinguish menopause-related fatigue from sleep problems, medication effects, or another cause? Would an examination or targeted tests change the plan?'],
    mood:['emotional','How would you distinguish mood changes around menopause from depression or another concern that needs its own treatment? What support could fit alongside menopause care?'],
    anx:['emotional','Could we assess my anxiety separately as well as in the context of menopause? What would help us choose between talking therapy, menopause treatment, or other support?'],
    irritable:['emotional','Could sleep disruption, stress, or treatment effects be contributing to my irritability? How could we work out which support to try first?'],
    overwhelmed:['emotional','How can we separate the effects of symptoms, poor sleep, and emotional strain when I feel overwhelmed? What practical support or referral could help?'],
    dry:['genitourinary','Could local vaginal treatment or non-hormonal options help my dryness or discomfort, even if I already use menopause treatment? Is there anything else you would want to examine or rule out?'],
    uri:['genitourinary','How would you distinguish menopause-related urinary symptoms from an infection or pelvic-floor problem? Which symptoms would change the assessment or treatment options?'],
    libido:['intimacy','Could discomfort, sleep, mood, medicines, or relationship factors be contributing to low libido? Which should we address first, and when would specialist input help?'],
    joint:['movement','How would you assess whether my joint or muscle pain needs a separate evaluation? What pattern, examination findings, or limits on movement would change the plan?'],
    head:['headache','What should I record about my headaches to help identify their type, and could that affect which menopause treatment options are suitable for me?'],
    palp:['heart-symptoms','What details about my palpitations would help you decide whether I need further assessment? Which accompanying symptoms should prompt urgent medical help?'],
    itch:['skin','How would you distinguish menopause-related dryness from a skin condition or a reaction to a product or medicine? What would make an examination useful?'],
    bloating:['bloating','What pattern or persistence of bloating would make you investigate it rather than assume it is hormonal? Which accompanying changes should I report promptly?'],
    dizzy:['dizziness','What would you want to know about when my dizziness happens, including medicines and other symptoms, to decide what assessment is needed? When should I seek urgent help?']
  };
  concerns.forEach((item,index) => {
    const template=templates[item.key];
    if(template) add('concern-'+template[0],110-index,template[1],'You chose '+name(item.key)+' as a priority'+(item.impact?': “'+item.impact+'”':'.'));
  });
  if ((meaningful('sleepq') || meaningful('ns')) && (keys.has('fog') || keys.has('energy'))) {
    const sleep=meaningful('sleepq')?'trouble sleeping':'night sweats';
    const daytime=keys.has('fog')?'brain fog':'fatigue';
    add('sleep-daytime',135,'Could '+sleep+' be contributing to my '+daytime+'? How would we assess them together and decide what to address first?',
      'Your selected concerns or sufficiently logged recent symptoms include '+sleep+' alongside '+daytime+'. This suggests a connection to ask about, not a proven cause.');
  }
  const change=(context.changes||[]).filter(item=>!item.targets?.length||item.targets.some(key=>keys.has(key)))[0];
  if(change){
    add('treatment-review',140,'I recorded a change to '+change.medication+' on '+change.date+' (“'+change.label+'”). What improvement should we look for, how long is a fair trial, and when should we review whether the plan needs changing?',
      'A recorded treatment adjustment may be useful context for '+selectedNames+'. Timing alone cannot show whether it caused a symptom change.');
    const followUp=(change.followUps||[]).filter(item=>item.completed).sort((a,b)=>b.completed.localeCompare(a.completed))[0];
    if(followUp && (followUp.benefit<=1 || ['moderate','severe'].includes(followUp.sideEffectLevel))){
      add('treatment-tradeoff',150,'At my '+followUp.week+'-week follow-up for '+change.medication+', I recorded benefit '+followUp.benefit+'/4 and '+followUp.sideEffectLevel+' side effects. How should we weigh benefit against side effects, and what alternatives could we discuss?',
        'Your completed follow-up on '+followUp.completed+' raises a specific treatment-review question. It does not establish that the medicine caused the effects.');
    }
  }
  const worsening=observations.filter(row=>keys.has(row.key)&&row.ready&&row.direction==='higher').sort((a,b)=>(b.after-b.before)-(a.after-a.before))[0];
  if(worsening){
    const value=n=>Math.round(n*10)/10;
    const unit=worsening.key==='hf'?' per day':'/4';
    add('observed-increase',130,'My '+name(worsening.key).toLowerCase()+' average increased from '+value(worsening.before)+unit+' to '+value(worsening.after)+unit+'. What could explain this, and what would you check before deciding whether to change the plan?',
      context.windowLabel+'; '+worsening.priorCount+' and '+worsening.recentCount+' confirmed answers. This is a descriptive comparison, not a clinical threshold.');
  }
  const meds=context.medications||[];
  if(meds.length && !change){
    add('medicine-review',100,'Could we review '+meds.slice(0,2).map(item=>item.name).join(' and ')+' alongside any other medicines or supplements I take? Could their effects or timing matter for '+selectedNames.toLowerCase()+'?',
      'These medications are marked active in your Care record. The app has not checked drug interactions or confirmed their purpose.');
  }
  if(context.profile?.ovaries==='both'){
    add('surgical-context',95,'Does having both ovaries removed change which symptom treatments and longer-term bone or cardiovascular follow-up we should discuss?',
      'Your Profile records removal of both ovaries. Your clinician can check the timing and wider medical history.');
  }
  if(context.profile?.uterus==='intact' && keys.has('hf') && !meds.length){
    add('treatment-fit',90,'If we consider HRT, how would having a uterus affect the treatment combination, and how would we choose a route that fits my risks and preferences?',
      'You selected hot flashes and recorded an intact uterus. This is a question about treatment suitability, not a recommendation to start HRT.');
  }
  if(!meds.length && !keys.has('hf') && !keys.has('ns')){
    add('compare-options',80,'For '+selectedNames.toLowerCase()+', which treatment and non-medicine options are reasonable to compare? What are the likely benefits, downsides, and consequences of waiting?',
      'No active medications are recorded. Your clinician can confirm what you actually take and help compare options.');
  }
  add('next-steps',70,brief.goal
    ?'To work toward “'+brief.goal+'”, what is the first step we can agree today, how will we judge whether it helps, and what should I do if it does not?'
    :'Before I leave, can we agree which concern to tackle first, what improvement to look for, when to follow up, and who to contact if things worsen?',
    brief.goal?'This turns your stated goal into an agreed action and review plan.':'A clear action, review date, and contact plan can make the appointment easier to follow through.');
  return [...candidates.filter(item=>item.id!=='next-steps').sort((a,b)=>b.priority-a.priority).slice(0,6),candidates.find(item=>item.id==='next-steps')].map(({priority,...item})=>item);
}
if(typeof module!=='undefined' && module.exports) module.exports={buildAppointmentQuestions};
