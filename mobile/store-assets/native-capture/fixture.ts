/** Fictional capture data only. Never imported by the production entry. */
export const CAPTURE_DATE = '2026-09-26';
export const CAPTURE_NOW = '2026-09-26T14:19:00-05:00';
const day = (ago: number) => new Date(Date.UTC(2026, 8, 26) - ago * 86400000).toISOString().slice(0, 10);

export function captureFixture() {
  const entries: Record<string, unknown> = {};
  for (let i = 59; i >= 0; i -= 1) {
    // Ordinary variation, not an implied treatment-response claim.
    const entry = {
      hf: 2 + i % 5, ns: i % 4 === 0 ? 3 : 1,
      inBedH: 8, sleepH: 6.2 + (i % 3) * 0.35,
      sym: { sleepq: i % 4 === 0 ? 3 : 1, mood: 1, anx: 2, fog: i % 3 === 0 ? 2 : 1,
        joint: 2, dry: 1, uri: 1, energy: 2, head: 0, palp: 0, itch: 1, libido: 2 },
      wt: 74.5, waist: 90,
      act: { res: i % 4 === 0, aero: i % 2 === 0 ? 30 : 0, pf: i % 3 === 0 },
      nut: { prot: i % 3 !== 0, alc: i % 6 === 0 ? 1 : 0, caf: 2, cal: i % 2 === 0 },
      bleed: i === 52 ? 'moderate' : 'none',
      notes: i === 4 ? 'Woke twice, felt foggy before lunch.' : '',
    };
    entries[day(i)] = { ...entry, confirmedData: JSON.parse(JSON.stringify(entry)), confirmed: true, draftDirty: false };
  }
  return {
    v: 8,
    profile: {
      name: 'Morgan', birthYear: 1979, region: 'us', units: 'imperial', lastPeriod: '', surgeryDate: '',
      uterus: 'intact', ovaries: 'kept', bone: 'unknown', proteinGpk: 1.2, weightGoal: null,
      waistGoal: null, theme: 'dark', stage: null, stageAnswers: null,
      onboarded: true, onboardingVersion: 2, onboardingStep: 3, onboardingDeferred: false,
      firstCheckinPending: false, intent: 'treatment', onboardingFeeling: '',
      pinnedSymptoms: ['hf', 'ns', 'fog', 'energy', 'joint', 'anx'],
    },
    entries,
    medications: [
      { id: 'estradiol', name: 'Estradiol 0.05 mg', form: 'patch', days: [1, 4], due: '08:00', notes: '', started: day(45), changes: [{ date: day(12), label: 'Dose changed from 0.025 mg' }] },
      { id: 'progesterone', name: 'Progesterone 100 mg', form: 'tablet', days: [0, 1, 2, 3, 4, 5, 6], due: '22:00', notes: '', started: day(45), changes: [] },
    ],
    labs: [
      { id: 'vitamin-d', name: 'Vitamin D', date: day(14), value: '38', unit: 'ng/mL' },
      { id: 'tsh', name: 'TSH', date: day(14), value: '2.1', unit: 'mIU/L' },
    ],
    screening: {}, scores: [], trigger: null,
    appointments: { questions: [], plans: [], brief: { concerns: [], goal: '', date: '' } },
    support: [], healthKit: null, meta: { created: day(90), lastOpen: CAPTURE_DATE },
  };
}
