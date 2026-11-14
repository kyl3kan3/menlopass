/* Shared by the native preview and the bundled web app. No health events or SDKs. */
const PeriOnboarding = (() => {
  const version = 2;
  const versionV2Flow = 3;
  const finalStepFor = flowVersion => (flowVersion === versionV2Flow ? 11 : 3);
  const symptoms = [
    ['sleepq', 'Trouble sleeping'], ['energy', 'Fatigue'], ['hf', 'Hot flashes'],
    ['fog', 'Brain fog'], ['ns', 'Night sweats'], ['mood', 'Low mood'],
    ['anx', 'Anxiety'], ['joint', 'Joint pain'], ['dry', 'Dryness'],
    ['uri', 'Bladder'], ['head', 'Headache'], ['palp', 'Palpitations'],
    ['itch', 'Skin'], ['libido', 'Low libido'], ['bloating', 'Bloating'],
    ['dizzy', 'Dizziness'], ['irritable', 'Irritability'], ['overwhelmed', 'Feeling overwhelmed'],
  ].map(([key, label]) => ({ key, label }));
  const goals = [
    { key: 'understand', label: 'Understand my symptoms', reply: 'Your chosen symptoms will be front and center in each check-in.', benefit: 'Keep a simple record of how things feel, then explore changes as your record grows.', fasterOutcome: 'clarity on your symptoms' },
    { key: 'treatment', label: 'Keep track of treatment', reply: 'You can keep treatment changes alongside how you feel.', benefit: 'Add a treatment in Care when you’re ready, then follow your own experience over time.', fasterOutcome: 'treatment changes in one place' },
    { key: 'appointment', label: 'Prepare for an appointment', reply: 'Let’s make it easier to remember what you want to discuss.', benefit: 'Your check-ins can become a focused summary to bring to your next appointment.', fasterOutcome: 'your next appointment prepared' },
    { key: 'record', label: 'Make a little space for myself', reply: 'A small check-in, at your own pace. No perfect streak needed.', benefit: 'Keep a private record you can come back to whenever it helps.', fasterOutcome: 'space for yourself' },
  ];
  const defaults = ['sleepq', 'energy', 'hf'];
  const keys = new Set(symptoms.map(item => item.key));
  function normalizeDraft(value, flowVersion = version) {
    const source = value && typeof value === 'object' ? value : {};
    const maxStep = finalStepFor(flowVersion);
    return {
      step: Number.isInteger(source.step) ? Math.max(0, Math.min(maxStep, source.step)) : 0,
      symptoms: Array.isArray(source.symptoms) ? [...new Set(source.symptoms.filter(key => keys.has(key)))].slice(0, 6) : [],
      intent: goals.some(goal => goal.key === source.intent) ? source.intent : '',
    };
  }
  function draftFromProfile(profile) {
    if (!profile) return normalizeDraft({});
    if (profile.onboardingVersion === versionV2Flow) {
      return normalizeDraft({ step: profile.onboardingStep, symptoms: profile.pinnedSymptoms, intent: profile.intent }, versionV2Flow);
    }
    if (profile.onboardingVersion !== version) return normalizeDraft({ intent: profile?.intent });
    return normalizeDraft({ step: profile.onboardingStep, symptoms: profile.pinnedSymptoms, intent: profile.intent });
  }
  function goalFor(intent) { return goals.find(goal => goal.key === intent) || goals[0]; }
  function labelsFor(selected) { return selected.map(key => symptoms.find(item => item.key === key)?.label).filter(Boolean); }
  function concernBucket(count) {
    if (count <= 0) return '0';
    if (count === 1) return '1';
    if (count <= 3) return '2_3';
    return '4_6';
  }
  function onboardingAnalyticsProperties(draft, flowVersion = versionV2Flow) {
    const normalized = normalizeDraft(draft, flowVersion);
    const properties = { onboardingConcernBucket: concernBucket(normalized.symptoms.length) };
    if (goals.some(goal => goal.key === normalized.intent)) properties.onboardingIntent = normalized.intent;
    return properties;
  }
  function profilePatch(value, complete = false, skipped = false, flowVersion = version) {
    const draft = normalizeDraft(value, flowVersion);
    const finalStep = finalStepFor(flowVersion);
    if (complete && !skipped && (!draft.symptoms.length || !draft.intent || draft.step !== finalStep)) throw new Error('Finish choosing your starting point first.');
    return {
      onboardingVersion: flowVersion,
      onboardingStep: complete ? finalStep : draft.step,
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
  function writeDraft(serialized, draft, complete = false, skipped = false, flowVersion = version) {
    const state = parseState(serialized);
    // Preview never writes entries, treatments, ratings, or medical context.
    state.profile = { ...state.profile, ...profilePatch(draft, complete, skipped, flowVersion) };
    return JSON.stringify(state);
  }
  function needsPreview(serialized) {
    const profile = parseState(serialized).profile;
    const pendingFirstCheckin = profile.firstCheckinPending === true
      && (profile.onboardingVersion === version || profile.onboardingVersion === versionV2Flow);
    return profile.onboarded !== true || pendingFirstCheckin;
  }
  return { version, versionV2Flow, symptoms, goals, defaults, normalizeDraft, draftFromProfile, goalFor, labelsFor, concernBucket, onboardingAnalyticsProperties, profilePatch, parseState, writeDraft, needsPreview };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = PeriOnboarding;
