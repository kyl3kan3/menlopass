const { test } = require('node:test');
const assert = require('node:assert/strict');
const model = require('../onboarding-model');

test('a fresh preview is empty and a single concern survives secure-state round trips', () => {
  assert.equal(model.needsPreview(null), true);
  assert.deepEqual(model.draftFromProfile({}), { step: 0, symptoms: [], intent: '' });
  const draft = { step: 1, symptoms: ['sleepq'], intent: '' };
  const saved = model.writeDraft(null, draft);
  assert.deepEqual(model.draftFromProfile(JSON.parse(saved).profile), draft);
  assert.deepEqual(JSON.parse(saved).entries, {});
  assert.equal(JSON.parse(saved).profile.onboarded, undefined);
});

test('purchase cancellation and restart retain the completed preview but never create health entries', () => {
  const draft = { step: 3, symptoms: ['fog'], intent: 'appointment' };
  const saved = model.writeDraft(null, draft, true);
  assert.equal(model.needsPreview(saved), true);
  assert.equal(JSON.parse(saved).profile.onboarded, true);
  assert.equal(JSON.parse(saved).profile.firstCheckinPending, true);
  assert.deepEqual(model.draftFromProfile(JSON.parse(saved).profile), draft);
  assert.deepEqual(JSON.parse(saved).entries, {});
});

test('returning subscribers and unfinished legacy setups keep existing records and clinical context', () => {
  const record = { v: 8, profile: { name: 'Example', uterus: 'hyst', ovaries: 'kept', onboarded: true }, entries: { '2026-09-01': { confirmedData: { hf: 2 }, notes: 'local only' } }, medications: [{ id: 'existing' }], appointments: { questions: [{ text: 'local question' }] } };
  const original = JSON.stringify(record);
  assert.equal(model.needsPreview(original), false);
  const next = JSON.parse(model.writeDraft(original, { step: 2, symptoms: ['joint'], intent: 'treatment' }));
  assert.deepEqual(next.entries, record.entries);
  assert.deepEqual(next.medications, record.medications);
  assert.deepEqual(next.appointments, record.appointments);
  assert.equal(next.profile.uterus, 'hyst');
  assert.equal(next.profile.ovaries, 'kept');
  assert.equal(next.profile.name, 'Example');
  assert.deepEqual(model.draftFromProfile({ onboardingStep: 2, onboardingVersion: 1, intent: 'treatment' }), { step: 0, symptoms: [], intent: 'treatment' });
});

test('preview inputs are allowlisted, bounded and cannot complete a partial setup', () => {
  const result = model.normalizeDraft({ step: 90, symptoms: ['private', 'hf', 'hf', 'fog', 'sleepq', 'ns', 'energy', 'mood', 'anx'], intent: 'private', entries: { private: true } });
  assert.equal(result.step, 3);
  assert.deepEqual(result.symptoms, ['hf', 'fog', 'sleepq', 'ns', 'energy', 'mood']);
  assert.equal(result.intent, '');
  assert.throws(() => model.writeDraft(null, { step: 1, symptoms: ['hf'], intent: 'understand' }, true));
  assert.throws(() => model.writeDraft('{broken', result));
  assert.throws(() => model.writeDraft('{"v":8,"profile":[],"entries":{}}', result));
  const skipped = JSON.parse(model.writeDraft(null, { step: 0, symptoms: [], intent: '' }, true, true));
  assert.deepEqual(skipped.profile.pinnedSymptoms, model.defaults);
  assert.equal(skipped.profile.onboardingDeferred, true);
  assert.deepEqual(skipped.entries, {});
});

test('after the first confirmed check-in, an expired entitlement should lead to the subscription gate', () => {
  const state = JSON.parse(model.writeDraft(null, { step: 3, symptoms: ['energy'], intent: 'understand' }, true));
  state.profile.firstCheckinPending = false;
  assert.equal(model.needsPreview(JSON.stringify(state)), false);
});
