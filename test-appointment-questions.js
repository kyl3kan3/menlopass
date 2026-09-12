const test=require('node:test');
const assert=require('node:assert/strict');
const {buildAppointmentQuestions:build}=require('./appointment-questions');
const names={hf:'Hot flashes',ns:'Night sweats',sleepq:'Trouble sleeping',fog:'Brain fog',energy:'Fatigue',dry:'Dryness',libido:'Low libido',mood:'Low mood'};
const context={names,medications:[],changes:[],observations:[],profile:{},windowLabel:'August 1–7 compared with August 8–14'};
const brief=(...keys)=>({concerns:keys.map(key=>({key,impact:''})),goal:''});
test('symptom topics suggest distinct overlooked questions rather than a generic repeated stem',()=>{
 const sleep=build(brief('sleepq'),context), intimacy=build(brief('dry','libido'),context);
 assert.match(sleep[0].text,/CBT for insomnia/);assert.match(intimacy.find(x=>x.id==='concern-genitourinary').text,/local vaginal treatment/i);assert.match(intimacy.find(x=>x.id==='concern-intimacy').text,/relationship factors/);
 assert.ok(!intimacy.some(x=>x.text.includes('what options or next steps should we discuss')));
});
test('connections use chosen concerns or sufficiently observed symptoms, never sparse observations',()=>{
 const sparse=build(brief('fog'),{...context,observations:[{key:'ns',ready:false,after:4}]});assert.ok(!sparse.some(x=>x.id==='sleep-daytime'));
 const selected=build(brief('sleepq','fog'),context);assert.match(selected.find(x=>x.id==='sleep-daytime').text,/trouble sleeping.*brain fog/);
 const logged=build(brief('energy'),{...context,observations:[{key:'ns',ready:true,after:3}]});assert.match(logged.find(x=>x.id==='sleep-daytime').text,/night sweats.*fatigue/);
});
test('confirmed worsening questions carry exact units, coverage, and dates',()=>{
 const ctx={...context,observations:[{key:'hf',ready:true,direction:'higher',before:2,after:4,priorCount:4,recentCount:5}]};
 const q=build(brief('hf'),ctx).find(x=>x.id==='observed-increase');assert.match(q.text,/2 per day to 4 per day/);assert.match(q.reason,/August 1–7.*4 and 5 confirmed/);
 ctx.observations[0].ready=false;assert.ok(!build(brief('hf'),ctx).some(x=>x.id==='observed-increase'));
});
test('treatment context includes actual adjustment and follow-up tradeoffs without asserting causation',()=>{
 const ctx={...context,changes:[{medication:'Recorded medicine',date:'2026-08-01',label:'Changed timing',targets:['fog'],followUps:[{week:2,completed:'2026-08-16',benefit:1,sideEffectLevel:'moderate'}]}]};
 const questions=build(brief('fog'),ctx);assert.match(questions.find(x=>x.id==='treatment-review').text,/Recorded medicine.*2026-08-01.*Changed timing/);assert.match(questions[0].text,/benefit 1\/4 and moderate side effects/);assert.match(questions[0].reason,/does not establish/);
 assert.ok(!build(brief('dry'),ctx).some(x=>x.id==='treatment-review'));
});
test('same-topic concerns do not create duplicate questions; the visit goal always gets a follow-through question',()=>{
 const b=brief('hf','ns','fog');b.goal='Sleep through the night';const q=build(b,{...context,profile:{ovaries:'both'},changes:[{medication:'Example',date:'2026-08-01',label:'Adjusted',targets:[],followUps:[]}]});
 assert.equal(q.filter(x=>x.id==='concern-temperature').length,1);assert.ok(q.length<=7);assert.equal(q.at(-1).id,'next-steps');assert.match(q.at(-1).text,/Sleep through the night/);assert.equal(new Set(q.map(x=>x.id)).size,q.length);
});
test('unknown context produces no invented treatment, trend, or medical-history claims',()=>{
 const q=build(brief('energy'),context);assert.ok(!q.some(x=>/treatment-review|observed-increase|surgical-context/.test(x.id)));assert.deepEqual(build(brief(),context),[]);
});
test('suggestions are deterministic and do not mutate the private record',()=>{
 const b=brief('dry','mood'),before=JSON.stringify([b,context]);assert.deepEqual(build(b,context),build(b,context));assert.equal(JSON.stringify([b,context]),before);
});

test('questions include individual impacts, including shared-topic concerns',()=>{
 const b=brief('hf','ns');b.concerns[0].impact='I have to leave meetings';b.concerns[1].impact='I change the sheets twice';
 const q=build(b,context).find(x=>x.id==='concern-temperature');
 assert.match(q.text,/I have to leave meetings/);assert.match(q.text,/I change the sheets twice/);
 assert.ok(!build(brief('hf'),context)[0].text.includes('leave meetings'));
 assert.match(build(brief('dry'),context).at(-1).text,/dryness/i);
});

test('appointment entry uses confirmed symptoms and preserves saved question edits',()=>{
 const fs=require('node:fs'),vm=require('node:vm');
 const source=fs.readFileSync('app-companion.js','utf8');
 let saved={concerns:[],goal:'',date:''};
 let rows=[{key:'hf',recent:[{value:0},{value:0},{value:0},{value:0}],after:0},
   {key:'fog',recent:[{value:4}],after:4},
   {key:'dry',recent:[{value:2},{value:2},{value:2},{value:2}],after:2}];
 const sandbox={savedBrief:()=>saved,weeklyStoryData:()=>({rows}),PINNABLE_SYMPTOMS:[],WEEKLY_MIN_COVERAGE:4};
 vm.createContext(sandbox);vm.runInContext(source.slice(source.indexOf('function appointmentSuggestionBrief()'),source.indexOf('function briefContextKey')),sandbox);
 assert.equal(JSON.stringify(sandbox.appointmentSuggestionBrief().concerns),JSON.stringify([{key:'dry',impact:''}]));
 assert.equal(saved.concerns.length,0);
 rows=[];assert.equal(sandbox.appointmentSuggestionBrief().concerns.length,0);
 saved={concerns:[{key:'fog',impact:'Meetings'}],questions:[{id:'edited',text:'My own question',selected:false}]};
 assert.equal(sandbox.appointmentSuggestionBrief(),saved);
 const view=fs.readFileSync('app-views.js','utf8');
 const body=view.slice(view.indexOf('function clinicianBody()'),view.indexOf('function dataSheet()'));
 assert.ok(body.includes('appointmentSuggestionBrief()'));assert.ok(body.includes('generateBriefQuestions(brief)'));
 assert.ok(!body.includes('CLINICIAN_TOPICS'));
});
