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
  // Pin the clock to midday so the night desk never takes over the page.
  await context.addInitScript(() => { const RealDate = Date; const fixed = new RealDate(); fixed.setHours(14, 14, 0, 0); const offset = fixed.getTime() - RealDate.now(); class PinnedDate extends RealDate { constructor(...a) { if (a.length) super(...a); else super(RealDate.now() + offset); } static now() { return RealDate.now() + offset; } } window.Date = PinnedDate; });
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

test('an earlier page takes entries without touching today, and today’s medication tick stays on today', async t => {
  const page = await fixture(t);
  const yesterday = await page.evaluate(() => addDays(todayISO(), -1));
  await page.getByRole('button', { name: 'Earlier pages', exact: true }).click();
  await page.locator(`[data-act="sheet"][data-s="day:${yesterday}"]`).click();
  await page.locator('#past-kind').selectOption('hf');
  await page.locator('#past-time').fill('15:40');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  assert.deepEqual(await page.evaluate(() => [DB.entries[addDays(todayISO(), -1)].hf, DB.entries[todayISO()] || null]), [1, null]);
  await page.locator('.sheet-bar .done').click();
  await page.locator('.sheet-bar .done').click();
  await page.getByRole('button', { name: 'Log', exact: true }).click();
  await page.locator('.sheet [data-act="log"][data-k="hf"]').click();
  await page.locator('.sheet-bar .done').click();
  assert.deepEqual(await page.evaluate(() => [DB.entries[todayISO()].hf, DB.entries[addDays(todayISO(), -1)].hf, entryDates()]), [1, 1, [yesterday, await page.evaluate(() => todayISO())]]);
  await page.locator('[data-act="med-taken"]').click();
  assert.equal(await page.evaluate(() => DB.entries[todayISO()].med['audit-med'].taken), true);
  assert.equal(await page.evaluate(() => dayMoments(todayISO()).some(m => m.k === 'med' && m.n === 'Example medicine 10 mg')), true, 'the dose lands on the ledger');
  assert.equal(await page.evaluate(() => DB.entries[addDays(todayISO(), -1)].med || null), null);
  await page.reload();
  assert.equal(await page.evaluate(() => DB.entries[todayISO()].med['audit-med'].taken), true);
  await page.locator('[data-act="med-taken"]').click();
  assert.equal(await page.evaluate(() => (DB.entries[todayISO()].med || {})['audit-med'] || null), null);
  assert.equal(await page.evaluate(() => dayMoments(todayISO()).some(m => m.k === 'med')), false, 'untaking removes the ledger row too');
});

test('restarting treatments preserves pauses and reasons across reloads and backup restore', async t => {
  const page = await fixture(t, { route: 'dossier', stopped: true });
  await page.locator('.sec').filter({ hasText: 'Treatments' }).getByRole('button', { name: 'Manage' }).click();
  await page.getByRole('button', { name: 'Restart', exact: true }).click();
  let state = await page.evaluate(() => ({
    duringPause: medicationActiveOn(DB.medications[0], addDays(todayISO(), -7)),
    beforePause: medicationActiveOn(DB.medications[0], addDays(todayISO(), -20)),
    today: medicationActiveOn(DB.medications[0], todayISO()),
    events: treatmentEvents(), pauses: DB.medications[0].pauses,
    report: reportBody(30)
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
    return { stored: DB.medications[0].pauses, restored: restored.medications[0].pauses, report: reportBody(90) };
  });
  assert.equal(state.stored.length, 2);
  assert.deepEqual(state.restored, state.stored);
  assert.match(state.report, /Paused after clinician review/);
  assert.match(state.report, /Second pause/);
});

test('unknown treatment starts and malformed imported pauses retain valid history', async t => {
  const page = await fixture(t, { route: 'dossier', stopped: true, unknownStart: true });
  await page.locator('.sec').filter({ hasText: 'Treatments' }).getByRole('button', { name: 'Manage' }).click();
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
  const page = await fixture(t, { route: 'dossier' });
  await page.locator('.sec').filter({ hasText: 'Treatments' }).getByRole('button', { name: 'Manage' }).click();
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  assert.equal(await page.getByLabel('Medication and dose', { exact: true }).inputValue(), 'Example medicine 10 mg');
  await page.getByLabel('Medication and dose', { exact: true }).fill('Example medicine 20 mg');
  await page.getByLabel('Form', { exact: true }).selectOption('patch');
  await page.getByLabel('Usual time', { exact: true }).fill('18:30');
  await page.getByLabel('Notes (optional)', { exact: true }).fill('Updated instructions');
  const yesterdayDow = await page.evaluate(() => parseISO(addDays(todayISO(), -1)).getDay());
  await page.getByRole('button', { name: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][yesterdayDow], exact: true }).click();
  assert.equal(await page.getByLabel('Medication and dose', { exact: true }).inputValue(), 'Example medicine 20 mg');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.reload();
  const state = await page.evaluate(() => {
    const m = DB.medications[0], yesterday = addDays(todayISO(), -1), restored = validateBackup(JSON.parse(JSON.stringify(DB))).medications[0];
    return { current: { name: m.name, form: m.form, due: m.due, notes: m.notes, days: m.days },
      previous: medicationDetailsOn(m, yesterday), scheduledYesterday: scheduledMeds(yesterday).map(m => m.id),
      history: m.revisions, restoredHistory: restored.revisions, events: treatmentEvents(), report: reportBody(90) };
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
  await page.locator('.sec').filter({ hasText: 'Treatments' }).getByRole('button', { name: 'Manage' }).click();
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByLabel('Medication and dose', { exact: true }).fill('Example medicine 25 mg');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  assert.equal(await page.evaluate(() => medicationDetailsOn(DB.medications[0], addDays(todayISO(), -1)).name), 'Example medicine 10 mg');
  assert.equal(await page.evaluate(() => medicationDetailsOn(DB.medications[0], todayISO()).name), 'Example medicine 25 mg');
});

test('a bad night on the ledger reaches the brief without inventing sleep hours', async t => {
  const page = await fixture(t, { symptoms: ['sleepq'] });
  await page.getByRole('button', { name: 'Log', exact: true }).click();
  await page.locator('.sheet [data-act="log"][data-k="sleepq"]').click();
  await page.locator('.sheet [data-act="log-severity"][data-v="2"]').click();
  await page.locator('.sheet-bar .done').click();
  await page.locator('.masthead-nav [data-v="dossier"]').click();
  await page.getByRole('button', { name: 'Export the one-page brief', exact: true }).click();
  const sleepRating = page.locator('.report-page .kv').filter({ hasText: 'Trouble sleeping' });
  assert.equal(await sleepRating.locator('.r').textContent(), '2');
  assert.equal(await page.locator('.report-page .kv').filter({ hasText: /^Sleep/ }).locator('.r').textContent(), 'not tracked');
});

test('the ledger rolls up into the day fields the engine reads, and removal clears them', async t => {
  const page = await fixture(t, { symptoms: ['hf', 'fog'] });
  const state = await page.evaluate(() => {
    const t = todayISO();
    addMoment(t, { k: 'hf', t: '13:10', s: 2 }); addMoment(t, { k: 'hf', t: '14:30', s: 3 }); addMoment(t, { k: 'ns', t: '02:40' }); addMoment(t, { k: 'woke', t: '02:41' }); addMoment(t, { k: 'fog', t: '10:00', s: 1 }); addMoment(t, { k: 'bleed', t: '08:00', s: 3 }); addMoment(t, { k: 'note', t: '09:00', n: 'Skipped lunch' });
    const e = confirmedEntry(t), after = { hf: e.hf, ns: e.ns, wakes: e.wakes, fog: e.sym.fog, bleed: e.bleed, notes: e.notes, order: dayMoments(t).map(m => m.t) };
    const fogId = dayMoments(t).find(m => m.k === 'fog').id; removeMoment(t, fogId);
    const hfIds = dayMoments(t).filter(m => m.k === 'hf').map(m => m.id); removeMoment(t, hfIds[0]);
    const e2 = confirmedEntry(t);
    const closed = closeDay(t, { rating: 1, alcohol: false, strength: true, period: false, stress: true });
    const e3 = confirmedEntry(t);
    return { after, removed: { hf: e2.hf, fog: e2.sym.fog }, closed, final: { rating: e3.rating, alc: e3.nut.alc, res: e3.act.res, bleed: e3.bleed, overwhelmed: e3.sym.overwhelmed } };
  });
  assert.deepEqual(state.after, { hf: 2, ns: 2, wakes: 1, fog: 1, bleed: 'heavy', notes: '09:00 Skipped lunch', order: ['02:40', '02:41', '08:00', '09:00', '10:00', '13:10', '14:30'] }, 'an unrated sweat is moderate on the 0–4 scale the insights read');
  assert.deepEqual(state.removed, { hf: 1, fog: undefined });
  assert.equal(state.closed, true);
  assert.deepEqual(state.final, { rating: 1, alc: 0, res: true, bleed: 'heavy', overwhelmed: 2 }, 'a logged bleed is not overwritten by the period checkbox');
});

test('free text files against the vocabulary and keeps the rest as a note', async t => {
  const page = await fixture(t);
  const parsed = await page.evaluate(() => [
    parseUtterance('hot flash, strong, 20 minutes ago').map(m => [m.k, m.s, m.t !== nowHM()]),
    parseUtterance('night sweat and woke up at 3am').map(m => [m.k, m.t]),
    parseUtterance('felt foggy and anxious after lunch').map(m => m.k),
    parseUtterance('cancelled the dentist').map(m => [m.k, m.n])
  ]);
  assert.deepEqual(parsed[0], [['hf', 3, true]]);
  assert.deepEqual(parsed[1], [['ns', '03:00'], ['woke', '03:00']]);
  assert.deepEqual(parsed[2], ['fog', 'anx']);
  assert.deepEqual(parsed[3], [['note', 'cancelled the dentist']]);
});

test('Android without subscriptions can open the dossier while iOS still gates', async t => {
  const page = await fixture(t);
  const locks = await page.evaluate(() => {
    window.__MENO_NATIVE__ = true; window.__MENO_PRO_ACTIVE__ = false;
    window.__MENO_NATIVE_SUBSCRIPTIONS__ = false;
    const android = [nativeProLocked('dossier'), nativeProLocked('appointment-report'), nativeProLocked('journey')];
    window.__MENO_NATIVE_SUBSCRIPTIONS__ = true;
    const ios = [nativeProLocked('dossier'), nativeProLocked('appointment-report'), nativeProLocked('journey'), nativeProLocked('today'), nativeProLocked('index')];
    delete window.__MENO_NATIVE_SUBSCRIPTIONS__;
    return { android, ios, legacyIos: nativeProLocked('journey') };
  });
  assert.deepEqual(locks, { android: [false, false, false], ios: [true, true, true, false, false], legacyIos: true });
});

test('native v3 onboarding metadata survives backup validation and opens the letter with its answers', async t => {
  const page = await fixture(t);
  await page.evaluate(() => {
    const completed=PeriOnboarding.writeDraft(JSON.stringify(DB),{step:11,symptoms:['sleepq','fog'],intent:'appointment'},true,false,PeriOnboarding.versionV2Flow);
    DB=validateBackup(JSON.parse(completed)); save(true); setRoute('today'); render();
  });
  await page.reload();
  const state=await page.evaluate(() => {
    const restored=validateBackup(JSON.parse(JSON.stringify(DB)));
    const metadata=profile=>({version:profile.onboardingVersion,step:profile.onboardingStep,symptoms:profile.pinnedSymptoms,intent:profile.intent});
    const invalid=JSON.parse(JSON.stringify(DB)); invalid.profile.onboardingVersion=2; invalid.profile.onboardingStep=11;
    const v2InvalidStep=validateBackup(invalid).profile.onboardingStep;
    invalid.profile.onboardingVersion=4; invalid.profile.onboardingStep=7;
    const v4Step=validateBackup(invalid).profile.onboardingStep;
    return {loaded:metadata(DB.profile),restored:metadata(restored.profile),v2InvalidStep,v4Step,entries:entryDates(),page:!!document.querySelector('.page-today')};
  });
  assert.deepEqual(state.loaded,{version:3,step:11,symptoms:['sleepq','fog'],intent:'appointment'});
  assert.deepEqual(state.restored,state.loaded);
  assert.deepEqual([state.v2InvalidStep,state.v4Step],[0,0]);
  assert.deepEqual(state.entries,[]);
  assert.equal(state.page,true,'a completed native onboarding opens the page, never a second setup');
  await page.evaluate(() => {
    Object.assign(DB.profile,{onboarded:false,onboardingVersion:3,onboardingStep:8,pinnedSymptoms:['sleepq'],intent:''});
    save(true); setRoute('today'); render();
  });
  await page.reload();
  assert.equal(await page.getByRole('heading',{name:'Fill in the blanks. That is the whole setup.'}).isVisible(),true);
  assert.equal(await page.locator('[data-act="fr-symptom"][data-v="sleepq"]').getAttribute('aria-pressed'),'true','partial native progress is carried into the letter');
  await page.getByRole('button',{name:'Open today’s page'}).click();
  assert.deepEqual(await page.evaluate(()=>({version:DB.profile.onboardingVersion,step:DB.profile.onboardingStep,onboarded:DB.profile.onboarded,entries:entryDates()})),{version:4,step:0,onboarded:true,entries:[]});
});

test('night-sweat severity, typed counts and severity edits survive the ledger rollup', async t => {
  const page = await fixture(t, { symptoms: ['hf', 'ns'] });
  const state = await page.evaluate(() => {
    const t = todayISO(), out = {};
    addMoment(t, { k: 'ns', t: '02:10', s: 3 }); out.oneStrong = confirmedEntry(t).ns;
    removeMoment(t, dayMoments(t)[0].id);
    addMoment(t, { k: 'ns', t: '02:10', s: 1 }); addMoment(t, { k: 'ns', t: '03:40', s: 1 }); out.twoMild = confirmedEntry(t).ns;
    dayMoments(t).slice().forEach(m => removeMoment(t, m.id));
    // a flash count typed in Details, then flashes logged one by one
    const e = entry(t); e.hf = 5; confirmEntry(t);
    addMoment(t, { k: 'hf', t: '13:00' }); out.afterFirstLog = confirmedEntry(t).hf;
    removeMoment(t, dayMoments(t).find(m => m.k === 'hf').id); out.afterUndo = confirmedEntry(t).hf;
    for (const time of ['13:00', '14:00', '15:00', '16:00', '17:00', '18:00']) addMoment(t, { k: 'hf', t: time });
    out.ledgerPassesTyped = confirmedEntry(t).hf;
    // a severity edited downwards follows the edit
    addMoment(t, { k: 'fog', t: '10:00', s: 3 }); const fog = dayMoments(t).find(m => m.k === 'fog');
    updateMoment(t, fog.id, { s: 1 }); out.fogAfterEdit = confirmedEntry(t).sym.fog;
    return out;
  });
  assert.deepEqual(state, { oneStrong: 3, twoMild: 1, afterFirstLog: 5, afterUndo: 5, ledgerPassesTyped: 6, fogAfterEdit: 1 });
});

test('nights belong to the morning they end on, and unobserved nights never make a baseline', async t => {
  const page = await fixture(t, { symptoms: ['sleepq', 'fog'] });
  const state = await page.evaluate(() => {
    const t = todayISO(), out = {};
    // Wakes after 22:00 on alternate evenings, with fog at 10:00 on those same dates: the fog came first.
    for (const i of [2, 4, 6, 8]) { const d = addDays(t, -i); addMoment(d, { k: 'fog', t: '10:00', s: 2 }); addMoment(d, { k: 'woke', t: '23:00' }); addMoment(d, { k: 'woke', t: '23:30' }); }
    for (const i of [1, 3, 5, 7, 9, 10, 11]) { const d = addDays(t, -i); addMoment(d, { k: 'hf', t: '15:00' }); closeDay(d, { rating: 2 }); }
    out.fogSameDate = findings().some(f => f.id === 'fog-after-nights');
    out.brokenNightOf = { evening: nightRecord(addDays(t, -2)).wakes, morningAfter: nightRecord(addDays(t, -1)).wakes };
    // Fog the morning after those evenings is the real pattern.
    for (const i of [1, 3, 5, 7]) addMoment(addDays(t, -i), { k: 'fog', t: '10:00', s: 2 });
    out.fogMorningAfter = findings().some(f => f.id === 'fog-after-nights');
    // Sweat nights with two wakes each, and note-only days that say nothing about the night.
    DB = blankDB(); DB.profile.onboarded = true; DB.profile.pinnedSymptoms = ['sleepq'];
    for (let i = 1; i <= 3; i++) { const d = addDays(t, -i); addMoment(d, { k: 'ns', t: '02:30' }); addMoment(d, { k: 'woke', t: '02:31' }); addMoment(d, { k: 'woke', t: '04:10' }); }
    for (let i = 4; i <= 6; i++) addMoment(addDays(t, -i), { k: 'note', t: '12:00', n: 'busy day' });
    out.sweatWakesUnobserved = findings().some(f => f.id === 'sweat-wakes');
    for (let i = 4; i <= 6; i++) closeDay(addDays(t, -i), { rating: 3 });
    out.sweatWakesClosed = findings().some(f => f.id === 'sweat-wakes');
    return out;
  });
  assert.equal(state.fogSameDate, false, 'late-evening wakes are the next night, not the one before that morning’s fog');
  assert.equal(state.fogMorningAfter, true, 'fog the next morning is the pattern the finding is for');
  assert.deepEqual(state.brokenNightOf, { evening: null, morningAfter: 2 });
  assert.equal(state.sweatWakesUnobserved, false, 'days that say nothing about the night are not dry nights');
  assert.equal(state.sweatWakesClosed, true, 'closing a day with no wakes logged is the statement that there were none');
});

test('a medication name cannot smuggle markup into a finding', async t => {
  const page = await fixture(t);
  const state = await page.evaluate(() => {
    const t = todayISO(), med = DB.medications[0];
    med.name = '<img src=x onerror="window.compromised=true">';
    med.changes = [{ date: addDays(t, -5), label: 'Dose up', targets: ['hf'], baseline: { windowStart: addDays(t, -12), windowEnd: addDays(t, -6), values: { hf: { average: 3, n: 5 } } }, followUps: [] }];
    for (let i = 1; i <= 4; i++) addMoment(addDays(t, -i), { k: 'hf', t: '14:00' });
    save(true); setRoute('dossier'); render();
    const f = findings().find(x => x.kind === 'treatment');
    return { head: f && f.head, img: document.querySelectorAll('.page-dossier img[src="x"]').length, compromised: window.compromised === true, shown: document.querySelector('.page-dossier .fnd .head') ? document.querySelector('.page-dossier .fnd .head').textContent : '' };
  });
  assert.ok(state.head && state.head.includes('&lt;img'), 'the headline escapes the name');
  assert.equal(state.img, 0);
  assert.equal(state.compromised, false);
});

test('deleting a medication’s ledger row clears its tick, and moving it moves the time', async t => {
  const page = await fixture(t);
  await page.locator('.page-today [data-act="med-taken"]').first().click();
  const taken = await page.evaluate(() => ({ tick: !!(DB.entries[todayISO()].med && DB.entries[todayISO()].med['audit-med'] && DB.entries[todayISO()].med['audit-med'].taken), rows: dayMoments(todayISO()).filter(m => m.k === 'med').length }));
  assert.deepEqual(taken, { tick: true, rows: 1 });
  await page.evaluate(() => addMoment(todayISO(), { k: 'hf', t: '13:00' }));
  await page.locator('.page-today .ledger-row[data-act="moment"]').filter({ hasText: 'Medication' }).click();
  await page.locator('#moment-time').fill('07:45');
  await page.locator('#moment-time').dispatchEvent('change');
  const moved = await page.evaluate(() => DB.entries[todayISO()].med['audit-med'].at);
  assert.equal(moved, '07:45');
  await page.getByRole('dialog').getByRole('button', { name: 'Delete this entry' }).click();
  const after = await page.evaluate(() => ({ tick: !!(DB.entries[todayISO()].med && DB.entries[todayISO()].med['audit-med']), rows: dayMoments(todayISO()).filter(m => m.k === 'med').length, stillConfirmed: !!confirmedEntry(todayISO()) }));
  assert.deepEqual(after, { tick: false, rows: 0, stillConfirmed: true });
  assert.equal(await page.locator('.page-today [data-act="med-taken"][aria-pressed="true"]').count(), 0, 'the tick on the page follows the ledger');
});

test('details edited from inside Close the day are kept when the day closes', async t => {
  const page = await fixture(t);
  await page.evaluate(() => addMoment(todayISO(), { k: 'hf', t: '13:00' }));
  await page.getByRole('button', { name: 'Close the day', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Good', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Sleep, body, food and notes' }).click();
  await page.evaluate(() => { const e = entry(todayISO()); e.nut.alc = 3; e.act.res = true; e.bleed = 'heavy'; commitDay(todayISO()); save(true); });
  await page.locator('.sheet-bar .done').click();
  assert.equal(await page.getByRole('dialog').locator('[data-act="close-toggle"][data-k="alcohol"]').getAttribute('aria-pressed'), 'true', 'the sheet reads the edited details back');
  assert.equal(await page.getByRole('dialog').locator('[data-act="close-toggle"][data-k="period"]').getAttribute('aria-pressed'), 'true');
  await page.getByRole('dialog').locator('[data-act="close-toggle"][data-k="stress"]').click();
  await page.getByRole('dialog').getByRole('button', { name: 'Close the day', exact: true }).click();
  const closed = await page.evaluate(() => { const e = confirmedEntry(todayISO()); return { rating: e.rating, alc: e.nut.alc, res: e.act.res, bleed: e.bleed, overwhelmed: e.sym.overwhelmed }; });
  assert.deepEqual(closed, { rating: 3, alc: 3, res: true, bleed: 'heavy', overwhelmed: 2 });
});

test('the one-page brief keeps her own questions next to the generated ones', async t => {
  const page = await fixture(t, { symptoms: ['sleepq', 'hf'] });
  await page.evaluate(() => {
    appointmentData().questions.push({ id: 'own-1', text: 'Can I keep taking my migraine tablets with this?', created: todayISO(), asked: false, askedAt: '' });
    appointmentData().brief = { concerns: [{ key: 'sleepq', impact: 'awake from three' }], goal: 'options', date: addDays(todayISO(), 10) };
    save(true); setRoute('appointment-report'); render();
  });
  const questions = await page.locator('.report-page .qn .q').allTextContents();
  assert.ok(questions.includes('Can I keep taking my migraine tablets with this?'), JSON.stringify(questions));
  assert.ok(questions.length >= 2, 'generated questions are still there');
});

test('the letter needs the elapsed time before it stages a stopped cycle', async t => {
  const page = await fixture(t);
  const state = await page.evaluate(() => {
    DB.profile.onboarded = false; DB.profile.birthYear = new Date().getFullYear() - 58; DB.profile.pinnedSymptoms = ['dry']; DB.profile.periodStatus = 'stopped'; DB.profile.periodSince = '';
    const pending = firstRunFinding();
    DB.profile.periodSince = 'gt6';
    const staged = firstRunFinding();
    finishFirstRun();
    return { pending: pending && pending.head, staged: staged && staged.label, stage: DB.profile.stage, since: DB.profile.stageAnswers && DB.profile.stageAnswers.since, restored: validateBackup(JSON.parse(JSON.stringify(DB))).profile.periodSince };
  });
  assert.deepEqual(state, { pending: 'Fill in the rest and the finding appears.', staged: 'Late postmenopause', stage: 'Late postmenopause', since: 'gt6', restored: 'gt6' });
});
