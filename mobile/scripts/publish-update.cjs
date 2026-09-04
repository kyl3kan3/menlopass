const { spawnSync } = require('node:child_process');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const repositoryRoot = path.resolve(projectRoot, '..');
const args = process.argv.slice(2);

function option(name, fallback) {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

function run(command, commandArgs, cwd = projectRoot, capture = false) {
  const result = spawnSync(command, commandArgs, {
    cwd,
    encoding: 'utf8',
    env: process.env,
    stdio: capture ? ['ignore', 'pipe', 'inherit'] : 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
  return capture ? result.stdout.trim() : '';
}

const channel = option('--channel', 'preview');
const environment = option('--environment', channel);
if (!['preview', 'production'].includes(channel)) {
  throw new Error('OTA channel must be preview or production.');
}
if (!['preview', 'production'].includes(environment)) {
  throw new Error('EAS environment must be preview or production.');
}

const dirty = run('git', ['status', '--porcelain'], repositoryRoot, true);
if (dirty) {
  throw new Error('Refusing to publish a production-grade OTA from a dirty Git worktree.');
}

const shortCommit = run('git', ['rev-parse', '--short=12', 'HEAD'], repositoryRoot, true);
const appConfig = require(path.join(projectRoot, 'app.json')).expo;
const message = option(
  '--message',
  `MenoCompass ${appConfig.version} (${appConfig.runtimeVersion}) ${shortCommit}`,
);
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

run(npx, [
  'eas-cli@latest',
  'update',
  '--channel', channel,
  '--platform', 'ios',
  '--environment', environment,
  '--message', message,
  '--clear-cache',
  '--non-interactive',
]);
