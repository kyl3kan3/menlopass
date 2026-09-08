const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../scripts/publish-update.cjs'), 'utf8');
function publish({ args = [], dirty = ['', ''], builds = [{ runtime: { version: '1.2.0-native-2' } }], missingKey = false } = {}) {
  const calls = [];
  let statusReads = 0;
  const env = Object.fromEntries(['APPSFLYER_DEV_KEY', 'META_APP_ID', 'META_CLIENT_TOKEN', 'REVENUECAT_IOS_API_KEY', 'POSTHOG_API_KEY', 'POSTHOG_HOST'].map(name => [`EXPO_PUBLIC_${name}`, 'configured']));
  if (missingKey) delete env.EXPO_PUBLIC_POSTHOG_API_KEY;
  env.npm_execpath = '/npm-cli.js';
  const run = () => vm.runInNewContext(source, {
    __dirname: path.join(__dirname, '../scripts'),
    process: { argv: ['node', 'publish-update.cjs', ...args], env, execPath: '/node', exit: status => { throw new Error(`Exit ${status}`); } },
    require: name => {
      if (name === 'node:path') return path;
      if (name === 'node:fs') return { existsSync: () => true };
      if (name.endsWith('app.json')) return { expo: { version: '1.2.0', runtimeVersion: '1.2.0-native-2' } };
      if (name.endsWith('app.config.js')) return () => { assert.notEqual(env.EAS_BUILD_PROFILE, 'production'); };
      if (name === 'node:child_process') return { spawnSync: (command, argv) => {
        calls.push({ command, argv: Array.from(argv) });
        const stdout = argv.includes('--porcelain') ? dirty[statusReads++] || ''
          : argv.includes('rev-parse') ? 'abc123'
          : argv.includes('build:list') ? JSON.stringify(builds) : '';
        return { status: 0, stdout };
      } };
      throw new Error(`Unexpected import ${name}`);
    },
  });
  return { calls, run };
}

test('OTA refuses mismatched environments, missing JS credentials and dirty generated assets', () => {
  for (const options of [{ args: ['--channel', 'production', '--environment', 'preview'] }, { missingKey: true }, { dirty: ['modified', ''] }, { dirty: ['', 'generated changed'] }]) {
    const h = publish(options);
    assert.throws(h.run);
    assert.equal(h.calls.some(call => call.argv.includes('update')), false);
  }
});

test('OTA blocks unsupported runtimes, but does not require downloading native EAS secrets', () => {
  const missing = publish({ builds: [] });
  assert.throws(missing.run, /No finished preview iOS build/);
  assert.equal(missing.calls.some(call => call.argv.includes('update')), false);
  const compatible = publish();
  compatible.run();
  const lookup = compatible.calls.find(call => call.argv.includes('build:list'));
  assert.equal(lookup.argv[lookup.argv.indexOf('--runtime-version') + 1], '1.2.0-native-2');
  assert.ok(compatible.calls.find(call => call.argv.includes('sync:web')));
  assert.ok(compatible.calls.find(call => call.argv.includes('typecheck')));
  assert.ok(compatible.calls.find(call => call.argv.includes('test')));
  assert.equal(compatible.calls.filter(call => call.argv.includes('update')).length, 1);
});
