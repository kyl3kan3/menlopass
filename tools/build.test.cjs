const { test } = require('node:test');
const assert = require('node:assert/strict');
const { build } = require('./build.cjs');

test('Windows build falls back from unavailable py to Python without a shell', () => {
  const calls = [];
  const status = build({ platform: 'win32', env: {}, spawn: (command, args, options) => {
    calls.push({ command, args, options });
    return command === 'py' ? { error: new Error('ENOENT'), status: null } : { status: 0 };
  } });
  assert.equal(status, 0);
  assert.deepEqual(calls.map(call => call.command), ['py', 'python', 'python']);
  assert.ok(calls[2].args[0].endsWith('build.py'));
  assert.equal(calls[2].options.shell, undefined);
});

test('an actual build failure propagates without rebuilding through another interpreter', () => {
  let calls = 0;
  const status = build({ platform: 'linux', env: {}, spawn: () => ({ status: ++calls === 1 ? 0 : 7 }) });
  assert.equal(status, 7);
  assert.equal(calls, 2);
});

test('missing/old Python gives an actionable error and never starts the build', () => {
  const args = [];
  assert.throws(() => build({ platform: 'win32', env: {}, spawn: (_command, argv) => {
    args.push(argv); return { status: 1 };
  } }), /Python 3.10 or newer/);
  assert.ok(args.every(argv => argv.includes('-c')));
});

test('an explicit Python path containing spaces is passed as one executable', () => {
  const command = 'C:\\Program Files\\Python312\\python.exe';
  const commands = [];
  build({ env: { PYTHON: command }, spawn: name => { commands.push(name); return { status: 0 }; } });
  assert.deepEqual(commands, [command, command]);
});
