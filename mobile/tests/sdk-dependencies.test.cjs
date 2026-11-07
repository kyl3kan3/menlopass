const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { checkSdkDependencies } = require('../scripts/check-sdk-dependencies.cjs');

test('SDK validation runs the installed CLI check and preserves incompatible-version failures', () => {
  let invoked;
  const status = checkSdkDependencies({ env: {}, spawn: (command, args, options) => {
    invoked = { command, args, options }; return { status: 1 };
  } });
  assert.equal(status, 1);
  assert.deepEqual(invoked.args.slice(1), ['install', '--check']);
  assert.equal(invoked.options.env.EXPO_OFFLINE, '1');
  assert.equal(invoked.options.env.CI, '1');
  assert.equal(invoked.options.env.EXPO_NO_DEPENDENCY_VALIDATION, undefined);
  assert.equal(invoked.options.shell, undefined);
});

test('SDK validation cannot silently succeed when its process fails to start', () => {
  assert.throws(() => checkSdkDependencies({ spawn: () => ({ error: new Error('spawn failed') }) }), /spawn failed/);
});

test('the real offline Expo checker rejects an incompatible installed React', t => {
  const temporaryRoot = fs.realpathSync(os.tmpdir());
  const fixture = fs.mkdtempSync(path.join(temporaryRoot, 'peri-sdk-check-'));
  t.after(() => {
    // Remove only this test's verified direct child, including its junction.
    assert.equal(path.dirname(fixture), temporaryRoot);
    assert.ok(path.basename(fixture).startsWith('peri-sdk-check-'));
    fs.rmSync(fixture, { recursive: true, force: true });
  });
  fs.writeFileSync(path.join(fixture, 'package.json'), JSON.stringify({
    name: 'sdk-compatibility-fixture', version: '1.0.0',
    dependencies: { expo: require('expo/package.json').version, react: '18.2.0' },
  }));
  fs.writeFileSync(path.join(fixture, 'app.json'), JSON.stringify({ expo: { name: 'fixture', slug: 'fixture' } }));
  fs.mkdirSync(path.join(fixture, 'node_modules/react'), { recursive: true });
  fs.writeFileSync(path.join(fixture, 'node_modules/react/package.json'), JSON.stringify({ name: 'react', version: '18.2.0' }));
  fs.symlinkSync(path.dirname(require.resolve('expo/package.json')), path.join(fixture, 'node_modules/expo'), 'junction');
  let output = '';
  const status = checkSdkDependencies({ projectRoot: fixture, spawn: (command, args, options) => {
    const result = spawnSync(command, args, { ...options, encoding: 'utf8', stdio: 'pipe' });
    output = `${result.stdout}${result.stderr}`;
    return result;
  } });
  assert.equal(status, 1, output);
  assert.match(output, /react@18\.2\.0/);
  assert.match(output, /expected version: 19\.2\.3/);
});
