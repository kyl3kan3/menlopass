const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
let browser, server, base;

before(async () => {
  const root = path.join(__dirname, 'dist');
  server = http.createServer((request, response) => {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    const file = path.resolve(root, pathname === '/' ? 'index.html' : pathname.slice(1));
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      response.writeHead(404); response.end(); return;
    }
    response.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'application/javascript', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2', '.png': 'image/png' })[path.extname(file)] || 'application/octet-stream');
    response.end(fs.readFileSync(file));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}) });
});
after(async () => {
  await browser?.close();
  await new Promise(resolve => server ? server.close(resolve) : resolve());
});

async function fixture(t, options = {}) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  t.after(() => context.close());
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('dialog', dialog => dialog.accept());
  t.after(() => assert.deepEqual(errors, [], 'no page runtime errors'));
  await page.goto(base);
  await page.evaluate(options => {
    DB = blankDB();
    DB.profile.onboarded = true;
    DB.profile.pinnedSymptoms = options.symptoms || ['hf'];
    DB.medications = [{
      id: 'audit-med', name: 'Example medicine 10 mg', form: 'tablet',
      days: [0, 1, 2, 3, 4, 5, 6], due: '09:00', notes: 'Original instructions',
      started: options.unknownStart ? '' : addDays(todayISO(), -40), ended: options.stopped ? addDays(todayISO(), -14) : '',
      status: options.stopped ? 'stopped' : 'active', stopReason: options.stopped ? 'Paused after clinician review' : '',
      archivedAt: '', changes: []
    }];
    save(true); setRoute(options.route || 'today'); render();
  }, options);
  return page;
}

test('returning from a historical detailed log keeps Today and Care writes on today', async t => {
  const page = await fixture(t);
  await page.getByRole('button', { name: 'Check in', exact: true }).click();
  await page.getByRole('button', { name: 'Add context', exact: true }).click();
  await page.locator('[data-act="more-details"]').click();
  const yesterday = await page.evaluate(() => addDays(todayISO(), -1));
  await page.locator(`[data-act="day"][data-d="${yesterday}"]`).click();
  await page.getByRole('button', { name: 'One more', exact: true }).click();
  await page.getByRole('button', { name: 'Back to focused check-in', exact: true }).click();
  await page.getByRole('button', { name: 'Step 1: Your symptoms', exact: true }).click();
  await page.getByRole('button', { name: 'One more hot flash', exact: true }).click();
  assert.equal(await page.locator('.jc-count strong').textContent(), '1');
  assert.deepEqual(await page.evaluate(() => [DB.entries[todayISO()].hf, DB.entries[addDays(todayISO(), -1)].hf]), [1, 1]);
  await page.getByRole('button', { name: 'Confirm today’s log', exact: true }).click();
  assert.deepEqual(await page.evaluate(() => entryDates()), [await page.evaluate(() => todayISO())]);
  await page.getByRole('button', { name: 'See my first check-in', exact: true }).click();
  await page.locator('nav [data-v="care"]').click();
  await page.locator('[data-act="med-taken"]').click();
  assert.equal(await page.evaluate(() => DB.entries[todayISO()].med['audit-med'].taken), true);
  assert.equal(await page.evaluate(() => DB.entries[addDays(todayISO(), -1)].med || null), null);
  await page.reload();
  assert.equal(await page.evaluate(() => DB.entries[todayISO()].med['audit-med'].taken), true);
});

test('More detail preserves the check-in return destination and historical confirmation', async t => {
  const page = await fixture(t);
  await page.locator('nav [data-v="journey"]').click();
  await page.getByRole('button', { name: 'Log today', exact: true }).click();
  await page.getByRole('button', { name: 'Add context', exact: true }).click();
  await page.locator('[data-act="more-details"]').click();
  await page.getByRole('button', { name: 'Back to focused check-in', exact: true }).click();
  await page.locator('[data-act="go-back"]').click();
  assert.equal(await page.getByRole('heading', { name: 'Your journey', exact: true }).isVisible(), true);
  await page.getByRole('button', { name: 'Log today', exact: true }).click();
  await page.getByRole('button', { name: 'Add context', exact: true }).click();
  await page.locator('[data-act="more-details"]').click();
  const yesterday = await page.evaluate(() => addDays(todayISO(), -1));
  await page.locator(`[data-act="day"][data-d="${yesterday}"]`).click();
  await page.getByRole('button', { name: 'One more', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm this log', exact: true }).click();
  assert.deepEqual(await page.evaluate(() => entryDates()), [yesterday]);
  assert.equal(await page.getByRole('heading', { name: 'Your journey', exact: true }).isVisible(), true);
});

test('restarting treatments preserves pauses and reasons across reloads and backup restore', async t => {
  const page = await fixture(t, { route: 'care', stopped: true });
  await page.getByRole('button', { name: 'Restart', exact: true }).click();
  let state = await page.evaluate(() => ({
    duringPause: medicationActiveOn(DB.medications[0], addDays(todayISO(), -7)),
    beforePause: medicationActiveOn(DB.medications[0], addDays(todayISO(), -20)),
    today: medicationActiveOn(DB.medications[0], todayISO()),
    events: treatmentEvents(), pauses: DB.medications[0].pauses,
    report: reportSheet(30).body
  }));
  assert.deepEqual([state.duringPause, state.beforePause, state.today], [false, true, true]);
  assert.ok(state.events.some(event => event.title.endsWith(' stopped') && event.body === 'Paused after clinician review'));
  assert.match(state.report, /Paused after clinician review/);
  await page.getByRole('button', { name: 'Stop', exact: true }).click();
  assert.equal(await page.locator('#stop-date').getAttribute('min'), await page.evaluate(() => todayISO()));
  await page.locator('#stop-reason').fill('Second pause');
  await page.getByRole('button', { name: 'Save as stopped', exact: true }).click();
  await page.getByRole('button', { name: 'Restart', exact: true }).click();
  await page.reload();
  state = await page.evaluate(() => {
    const backup = JSON.stringify(DB), restored = validateBackup(JSON.parse(backup));
    return { stored: DB.medications[0].pauses, restored: restored.medications[0].pauses, report: reportSheet(90).body };
  });
  assert.equal(state.stored.length, 2);
  assert.deepEqual(state.restored, state.stored);
  assert.match(state.report, /Paused after clinician review/);
  assert.match(state.report, /Second pause/);
});

test('unknown treatment starts and malformed imported pauses retain valid history', async t => {
  const page = await fixture(t, { route: 'care', stopped: true, unknownStart: true });
  await page.getByRole('button', { name: 'Restart', exact: true }).click();
  await page.reload();
  const state = await page.evaluate(() => {
    const m=DB.medications[0], preserved={started:m.started,pauses:m.pauses.length,duringPause:medicationActiveOn(m,addDays(todayISO(),-7))};
    const backup=JSON.parse(JSON.stringify(DB));
    backup.medications[0].pauses=[
      {stopped:addDays(todayISO(),-30),resumed:addDays(todayISO(),-20),reason:'valid'},
      {stopped:addDays(todayISO(),-29),resumed:addDays(todayISO(),-28),reason:'overlap one'},
      {stopped:addDays(todayISO(),-27),resumed:addDays(todayISO(),-26),reason:'overlap two'},
      {stopped:addDays(todayISO(),-19),resumed:addDays(todayISO(),-15),reason:'valid later'},
      {stopped:'not a date',resumed:todayISO(),reason:'invalid'},
      {stopped:todayISO(),resumed:addDays(todayISO(),-1),reason:'backward'}
    ];
    backup.medications[0].revisions=[{date:todayISO(),before:{name:'Original',days:[9,2,2],untrusted:'drop'},after:{name:'Current',days:[1],untrusted:'drop'}}];
    const clean=validateBackup(backup).medications[0];
    return {preserved,reasons:clean.pauses.map(p=>p.reason),revision:clean.revisions[0]};
  });
  assert.deepEqual(state.preserved,{started:'',pauses:1,duringPause:false});
  assert.deepEqual(state.reasons,['valid','valid later']);
  assert.deepEqual(state.revision.before.days,[2]);
  assert.equal(Object.hasOwn(state.revision.before,'untrusted'),false);
});

test('editing medication details preserves prior schedules, names and instructions', async t => {
  const page = await fixture(t, { route: 'care' });
  await page.getByRole('button', { name: 'Edit details', exact: true }).click();
  assert.equal(await page.getByLabel('Medication and dose', { exact: true }).inputValue(), 'Example medicine 10 mg');
  await page.getByLabel('Medication and dose', { exact: true }).fill('Example medicine 20 mg');
  await page.getByLabel('Form', { exact: true }).selectOption('patch');
  await page.getByLabel('Usual time', { exact: true }).fill('18:30');
  await page.getByLabel('Notes (optional)', { exact: true }).fill('Updated instructions');
  const yesterdayDow = await page.evaluate(() => parseISO(addDays(todayISO(), -1)).getDay());
  await page.getByRole('button', { name: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][yesterdayDow], exact: true }).click();
  assert.equal(await page.getByLabel('Medication and dose', { exact: true }).inputValue(), 'Example medicine 20 mg');
  await page.getByRole('button', { name: 'Save medication', exact: true }).click();
  await page.reload();
  const state = await page.evaluate(() => {
    const m = DB.medications[0], yesterday = addDays(todayISO(), -1), restored = validateBackup(JSON.parse(JSON.stringify(DB))).medications[0];
    return { current: { name: m.name, form: m.form, due: m.due, notes: m.notes, days: m.days },
      previous: medicationDetailsOn(m, yesterday), scheduledYesterday: scheduledMeds(yesterday).map(m => m.id),
      history: m.revisions, restoredHistory: restored.revisions, events: treatmentEvents(), report: reportSheet(90).body };
  });
  assert.deepEqual({ ...state.current, days: undefined }, { name: 'Example medicine 20 mg', form: 'patch', due: '18:30', notes: 'Updated instructions', days: undefined });
  assert.equal(state.current.days.includes(yesterdayDow), false);
  assert.equal(state.previous.name, 'Example medicine 10 mg');
  assert.equal(state.previous.notes, 'Original instructions');
  assert.deepEqual(state.scheduledYesterday, ['audit-med']);
  assert.deepEqual(state.restoredHistory, state.history);
  assert.ok(state.events.some(event => event.title === 'Example medicine 10 mg started'));
  assert.match(state.report, /Original instructions/);
  assert.match(state.report, /Updated instructions/);
  await page.getByRole('button', { name: 'Edit details', exact: true }).click();
  await page.getByLabel('Medication and dose', { exact: true }).fill('Example medicine 25 mg');
  await page.getByRole('button', { name: 'Save medication', exact: true }).click();
  assert.equal(await page.evaluate(() => medicationDetailsOn(DB.medications[0], addDays(todayISO(), -1)).name), 'Example medicine 10 mg');
  assert.equal(await page.evaluate(() => medicationDetailsOn(DB.medications[0], todayISO()).name), 'Example medicine 25 mg');
});

test('sleep difficulty ratings reach the appointment report without inventing sleep hours', async t => {
  const page = await fixture(t, { symptoms: ['sleepq'] });
  await page.getByRole('button', { name: 'Check in', exact: true }).click();
  await page.getByRole('button', { name: 'Trouble sleeping: Moderate', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm today’s log', exact: true }).click();
  await page.getByRole('button', { name: 'See my first check-in', exact: true }).click();
  await page.locator('nav [data-v="care"]').click();
  await page.getByRole('button', { name: 'Prepare appointment report', exact: true }).click();
  const sleepRating = page.locator('.report-page .kv').filter({ hasText: 'Trouble sleeping' });
  assert.equal(await sleepRating.locator('b').textContent(), '2');
  assert.equal(await page.locator('.report-page .kv').filter({ hasText: 'Sleep (30 d average)' }).locator('b').textContent(), 'not tracked');
});

test('Android without subscriptions can open Journey and reports while iOS still gates', async t => {
  const page = await fixture(t);
  const locks = await page.evaluate(() => {
    window.__MENO_NATIVE__ = true; window.__MENO_PRO_ACTIVE__ = false;
    window.__MENO_NATIVE_SUBSCRIPTIONS__ = false;
    const android = [nativeProLocked('journey'), nativeProLocked('appointment-report')];
    window.__MENO_NATIVE_SUBSCRIPTIONS__ = true;
    const ios = [nativeProLocked('journey'), nativeProLocked('appointment-report')];
    delete window.__MENO_NATIVE_SUBSCRIPTIONS__;
    return { android, ios, legacyIos: nativeProLocked('journey') };
  });
  assert.deepEqual(locks, { android: [false, false], ios: [true, true], legacyIos: true });
});

test('native v3 onboarding metadata survives backup validation and reload', async t => {
  const page = await fixture(t);
  await page.evaluate(() => {
    const completed=PeriOnboarding.writeDraft(JSON.stringify(DB),{step:11,symptoms:['sleepq','fog'],intent:'appointment'},true,false,PeriOnboarding.versionV2Flow);
    DB=validateBackup(JSON.parse(completed)); save(true); setRoute('today'); render();
  });
  await page.reload();
  const state=await page.evaluate(() => {
    const restored=validateBackup(JSON.parse(JSON.stringify(DB)));
    const metadata=profile=>({version:profile.onboardingVersion,step:profile.onboardingStep,pending:profile.firstCheckinPending,symptoms:profile.pinnedSymptoms,intent:profile.intent});
    const invalid=JSON.parse(JSON.stringify(DB)); invalid.profile.onboardingVersion=2; invalid.profile.onboardingStep=11;
    const v2InvalidStep=validateBackup(invalid).profile.onboardingStep;
    invalid.profile.onboardingVersion=3; invalid.profile.onboardingStep=12;
    const v3InvalidStep=validateBackup(invalid).profile.onboardingStep;
    return {loaded:metadata(DB.profile),restored:metadata(restored.profile),v2InvalidStep,v3InvalidStep,entries:entryDates()};
  });
  assert.deepEqual(state.loaded,{version:3,step:11,pending:true,symptoms:['sleepq','fog'],intent:'appointment'});
  assert.deepEqual(state.restored,state.loaded);
  assert.deepEqual([state.v2InvalidStep,state.v3InvalidStep],[0,0]);
  assert.deepEqual(state.entries,[]);
  assert.equal(await page.getByRole('heading',{name:'Your first check-in',exact:true}).isVisible(),true);
});

test('incomplete native v3 progress opens a usable four-step web flow without rewriting progress', async t => {
  const page=await fixture(t);
  await page.evaluate(() => {
    Object.assign(DB.profile,{onboarded:false,onboardingVersion:3,onboardingStep:8,pinnedSymptoms:['sleepq'],intent:'',firstCheckinPending:false});
    save(true); setRoute('today'); render();
  });
  await page.reload();
  assert.equal(await page.getByRole('heading',{name:'What would help you most?',exact:true}).isVisible(),true);
  assert.equal(await page.getByRole('progressbar',{name:'Setup progress'}).getAttribute('aria-valuemax'),'4');
  assert.deepEqual(await page.evaluate(()=>[DB.profile.onboardingVersion,DB.profile.onboardingStep]),[3,8]);
  await page.getByRole('radio',{name:'Prepare for an appointment',exact:true}).click();
  await page.getByRole('button',{name:'See my check-in',exact:true}).click();
  assert.equal(await page.getByRole('heading',{name:'Your check-in, made for you.',exact:true}).isVisible(),true);
  await page.getByRole('button',{name:'Start my first check-in',exact:true}).click();
  assert.deepEqual(await page.evaluate(()=>({version:DB.profile.onboardingVersion,step:DB.profile.onboardingStep,onboarded:DB.profile.onboarded,entries:entryDates()})),{version:2,step:3,onboarded:true,entries:[]});
});
