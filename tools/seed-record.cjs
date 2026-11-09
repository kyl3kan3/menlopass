/* A seeded sixteen-day record for screenshots and design review. Fictional,
   deterministic, shared by tools/shots.cjs and the store screenshot composer. */
function isoOffset(offset) {
  const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + offset);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function confirmed(payload) {
  const copy = JSON.parse(JSON.stringify(payload));
  return Object.assign({}, payload, { confirmed: true, draftDirty: false, confirmedData: copy });
}
// Sixteen days with timestamped moments: sweats and 3 am wakes on five nights a week,
// afternoon flashes on five days a week, one treatment change ten days in.
function seeded(dayCount = 16) {
  const entries = {};
  for (let i = dayCount - 1; i >= 0; i--) {
    const flashDay = i % 7 !== 3 && i % 7 !== 6, sweatNight = i % 7 < 5;
    const moments = [];
    if (sweatNight) moments.push({ id: 'w' + i + 'a', t: '02:40', k: 'woke' }, { id: 's' + i, t: '02:41', k: 'ns' }, { id: 'w' + i + 'b', t: '03:30', k: 'woke' });
    if (flashDay) moments.push({ id: 'h' + i + 'a', t: '13:10', k: 'hf', s: 2 }, { id: 'h' + i + 'b', t: '14:30', k: 'hf', s: 3 }, { id: 'h' + i + 'c', t: '15:20', k: 'hf', s: 1 });
    else moments.push({ id: 'h' + i + 'm', t: '09:15', k: 'hf', s: 1 });
    if (i === 0) moments.push({ id: 'n0', t: '07:30', k: 'slept', v: 6.5 }, { id: 'm0', t: '08:05', k: 'med', n: 'Estradiol 0.05 mg' });
    const payload = { hf: flashDay ? 3 : 1, ns: sweatNight ? 2 : 0, wakes: sweatNight ? 2 : 0, rating: i % 5, sym: { fog: sweatNight ? 2 : 0, energy: 1 + (i % 3), joint: 1, anx: i % 2, sleepq: sweatNight ? 3 : 1 }, act: { res: i % 4 === 0, aero: i % 2 ? 20 : 0 }, nut: { alc: i % 5 === 0 ? 1 : 0 }, sleepH: sweatNight ? 6 : 7.5, inBedH: 8, notes: '', moments };
    if (i === 0) { delete payload.rating; payload.med = { estradiol: { taken: true, at: '08:05' } }; }
    entries[isoOffset(-i)] = confirmed(payload);
  }
  return {
    v: 9,
    profile: { name: 'Morgan', birthYear: 1979, region: 'us', units: 'imperial', lastPeriod: isoOffset(-70), uterus: 'intact', ovaries: 'kept', bone: 'unknown', proteinGpk: 1.2, theme: 'light', stage: 'Late menopausal transition', stageAnswers: { age: '45p', uterus: 'intact', ovaries: 'kept', contra: 'no', cycle: 'skip', vms: 'lots' }, onboarded: true, onboardingVersion: 4, intent: 'appointment', pinnedSymptoms: ['sleepq', 'hf', 'fog', 'energy'], periodStatus: 'gaps' },
    entries,
    medications: [
      { id: 'estradiol', name: 'Estradiol 0.05 mg', form: 'patch', days: [1, 4], due: '08:00', notes: '', started: isoOffset(-70), ended: '', changes: [{ date: isoOffset(-3), label: '0.0375 → 0.05 mg', targets: ['hf', 'sleepq'], baseline: { windowStart: isoOffset(-10), windowEnd: isoOffset(-4), values: { hf: { average: 3.2, n: 7 }, sleepq: { average: 2.4, n: 7 } } }, followUps: [] }] },
      { id: 'prog', name: 'Progesterone 100 mg', form: 'tablet', days: [0, 1, 2, 3, 4, 5, 6], due: '22:00', notes: '', started: isoOffset(-70), ended: '', changes: [] }
    ],
    labs: [{ id: 'lab-1', name: 'Vitamin D', date: isoOffset(-40), value: '48', unit: 'nmol/L' }],
    screening: {}, scores: [], trigger: null,
    appointments: { questions: [{ id: 'q1', text: 'Is HRT a reasonable option for me, and which type?', created: isoOffset(-5), asked: false, askedAt: '' }], plans: [], brief: { concerns: [{ key: 'ns', impact: 'woken most nights between two and four' }, { key: 'energy', impact: 'exhausted at work by three' }, { key: 'hf', impact: '' }], goal: 'talk about treatment options, including HRT', date: isoOffset(12) }, evidence: [] },
    findings: {}, meta: { created: isoOffset(-16), lastOpen: isoOffset(0) }
  };
}

module.exports = { isoOffset, confirmed, seeded };
