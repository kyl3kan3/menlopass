const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const moduleRoot = path.resolve(__dirname, '..');
const swiftSource = fs.readFileSync(
  path.join(moduleRoot, 'ios', 'MenoCompassHealthKitModule.swift'),
  'utf8',
);
const pluginSource = fs.readFileSync(path.join(moduleRoot, 'app.plugin.js'), 'utf8');

test('HealthKit module requests read access only', () => {
  assert.match(swiftSource, /toShare: Set<HKSampleType>\(\)/);
  assert.doesNotMatch(swiftSource, /healthStore\.save|deleteObjects|HKWorkoutBuilder/);
});

test('HealthKit reads are explicitly user initiated and aggregate-only', () => {
  assert.match(swiftSource, /guard userInitiated else/);
  assert.match(swiftSource, /HKStatisticsQuery/);
  assert.match(swiftSource, /syncSummaryAsync/);
  assert.doesNotMatch(swiftSource, /sourceRevision|device|metadata/);
});

test('HealthKit plugin adds read usage copy and entitlement without write usage copy', () => {
  assert.match(pluginSource, /NSHealthShareUsageDescription/);
  assert.match(pluginSource, /com\.apple\.developer\.healthkit/);
  assert.doesNotMatch(pluginSource, /NSHealthUpdateUsageDescription/);
});
