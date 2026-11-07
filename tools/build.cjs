const { spawnSync } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function build({ spawn = spawnSync, platform = process.platform, env = process.env } = {}) {
  // Windows commonly has `py` or `python`, while `python3` can be a Store alias.
  // Probe first; a failing build must never be retried with another interpreter.
  const candidates = env.PYTHON
    ? [[env.PYTHON, []]]
    : platform === 'win32'
      ? [['py', ['-3']], ['python', []], ['python3', []]]
      : [['python3', []], ['python', []]];
  const probe = 'import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)';
  for (const [command, prefix] of candidates) {
    const checked = spawn(command, [...prefix, '-c', probe], {
      cwd: root, env, encoding: 'utf8', stdio: 'pipe', timeout: 10000,
    });
    if (checked.error || checked.status !== 0) continue;
    const result = spawn(command, [...prefix, path.join(root, 'build.py')], {
      cwd: root, env, stdio: 'inherit',
    });
    if (result.error) throw result.error;
    return result.status ?? 1;
  }
  throw new Error('Python 3.10 or newer is required. Install Python or set PYTHON to its executable path.');
}

if (require.main === module) {
  try { process.exitCode = build(); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { build };
