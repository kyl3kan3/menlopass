/* Shared by the native preview and the bundled web app. No health events or SDKs. */
const PeriOnboarding = (() => {
  const version = 2;
  const symptoms = [
    ['sleepq', 'Trouble sleeping'], ['energy', 'Fatigue'], ['hf', 'Hot flashes'],
    ['fog', 'Brain fog'], ['ns', 'Night sweats'], ['mood', 'Low mood'],
    ['anx', 'Anxiety'], ['joint', 'Joint pain'], ['dry', 'Dryness'],
    ['uri', 'Bladder'], ['head', 'Headache'], ['palp', 'Palpitations'],
    ['itch', 'Skin'], ['libido', 'Low libido'], ['bloating', 'Bloating'],
    ['dizzy', 'Dizziness'], ['irritable', 'Irritability'], ['overwhelmed', 'Feeling overwhelmed'],
  ].map(([key, label]) => ({ key, label }));
  const goals = [
    { key: 'understand', label: 'Understand my symptoms', reply: 'Your chosen symptoms will be front and center in each check-in.', benefit: 'Keep a simple record of how things feel, then explore changes as your record grows.' },
    { key: 'treatment', label: 'Keep track of treatment', reply: 'You can keep treatment changes alongside how you feel.', benefit: 'Add a treatment in Care when you’re ready, then follow your own experience over time.' },
    { key: 'appointment', label: 'Prepare for an appointment', reply: 'Let’s make it easier to remember what you want to discuss.', benefit: 'Your check-ins can become a focused summary to bring to your next appointment.' },
    { key: 'record', label: 'Make a little space for myself', reply: 'A small check-in, at your own pace. No perfect streak needed.', benefit: 'Keep a private record you can come back to whenever it helps.' },
  ];
  const defaults = ['sleepq', 'energy', 'hf'];
  const keys = new Set(symptoms.map(item => item.key));
  function normalizeDraft(value) {
    const source = value && typeof value === 'object' ? value : {};
    return {
      step: Number.isInteger(source.step) ? Math.max(0, Math.min(3, source.step)) : 0,
      symptoms: Array.isArray(source.symptoms) ? [...new Set(source.symptoms.filter(key => keys.has(key)))].slice(0, 6) : [],
      intent: goals.some(goal => goal.key === source.intent) ? source.intent : '',
    };
  }
  function draftFromProfile(profile) {
    if (!profile || profile.onboardingVersion !== version) return normalizeDraft({ intent: profile?.intent });
    return normalizeDraft({ step: profile.onboardingStep, symptoms: profile.pinnedSymptoms, intent: profile.intent });
  }
  function goalFor(intent) { return goals.find(goal => goal.key === intent) || goals[0]; }
  function labelsFor(selected) { return selected.map(key => symptoms.find(item => item.key === key)?.label).filter(Boolean); }
  function profilePatch(value, complete = false, skipped = false) {
    const draft = normalizeDraft(value);
    if (complete && !skipped && (!draft.symptoms.length || !draft.intent || draft.step !== 3)) throw new Error('Finish choosing your starting point first.');
    return {
      onboardingVersion: version,
      onboardingStep: complete ? 3 : draft.step,
      pinnedSymptoms: complete && !draft.symptoms.length ? [...defaults] : draft.symptoms,
      intent: complete && !draft.intent ? 'understand' : draft.intent,
      ...(complete ? { onboarded: true, onboardingDeferred: skipped, firstCheckinPending: true } : {}),
    };
  }
  function parseState(serialized) {
    if (!serialized) return { v: 8, profile: {}, entries: {} };
    const value = JSON.parse(serialized);
    if (!value || !Number.isInteger(value.v) || !value.profile || typeof value.profile !== 'object' || Array.isArray(value.profile) || !value.entries || typeof value.entries !== 'object' || Array.isArray(value.entries)) throw new Error('Invalid local record.');
    return value;
  }
  function writeDraft(serialized, draft, complete = false, skipped = false) {
    const state = parseState(serialized);
    // Preview never writes entries, treatments, ratings, or medical context.
    state.profile = { ...state.profile, ...profilePatch(draft, complete, skipped) };
    return JSON.stringify(state);
  }
  function needsPreview(serialized) {
    const profile = parseState(serialized).profile;
    return profile.onboarded !== true || (profile.onboardingVersion === version && profile.firstCheckinPending === true);
  }
  return { version, symptoms, goals, defaults, normalizeDraft, draftFromProfile, goalFor, labelsFor, profilePatch, parseState, writeDraft, needsPreview };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = PeriOnboarding;
