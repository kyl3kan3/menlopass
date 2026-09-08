const { spawnSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

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
if (environment !== channel) throw new Error('OTA channel and EAS environment must match.');

const dirty = run('git', ['status', '--porcelain'], repositoryRoot, true);
if (dirty) {
  throw new Error('Refusing to publish a production-grade OTA from a dirty Git worktree.');
}

const shortCommit = run('git', ['rev-parse', '--short=12', 'HEAD'], repositoryRoot, true);
const appConfig = require(path.join(projectRoot, 'app.json')).expo;
const npmCli = process.env.npm_execpath || path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js');
if (!fs.existsSync(npmCli)) throw new Error('Run OTA publishing through npm run ota:preview:ios or ota:production:ios.');
const npm = commandArgs => run(process.execPath, [npmCli, ...commandArgs]);
const eas = (commandArgs, capture = false) => run(process.execPath, [npmCli, 'exec', '--yes', '--package=eas-cli@23.2.0', '--', 'eas', ...commandArgs], projectRoot, capture);

// Only JavaScript SDK values belong in OTA exports. TikTok's native credential
// is already in the compatible signed binary and EAS secret values are not
// downloadable by env:exec. Native builds still validate that credential.
const required = ['EXPO_PUBLIC_APPSFLYER_DEV_KEY', 'EXPO_PUBLIC_META_APP_ID',
  'EXPO_PUBLIC_META_CLIENT_TOKEN', 'EXPO_PUBLIC_REVENUECAT_IOS_API_KEY',
  'EXPO_PUBLIC_POSTHOG_API_KEY', 'EXPO_PUBLIC_POSTHOG_HOST'];
const missing = required.filter(name => !process.env[name]?.trim());
if (missing.length) throw new Error(`Missing OTA SDK configuration: ${missing.join(', ')}`);
delete process.env.EAS_BUILD_PROFILE;
require(path.join(projectRoot, 'app.config.js'))({ config: appConfig });
npm(['run', 'sync:web']);
npm(['run', 'typecheck']);
npm(['--prefix', repositoryRoot, 'test']);
if (run('git', ['status', '--porcelain'], repositoryRoot, true)) {
  throw new Error('Generated assets changed during validation. Commit and push the synchronized build before publishing.');
}
const builds = JSON.parse(eas(['build:list', '--platform', 'ios', '--status', 'finished', '--build-profile', channel, '--runtime-version', appConfig.runtimeVersion, '--limit', '1', '--json', '--non-interactive'], true));
if (!builds.some(build => build.runtimeVersion === appConfig.runtimeVersion)) {
  throw new Error(`No finished ${channel} iOS build supports runtime ${appConfig.runtimeVersion}. Build the native app first.`);
}
const message = option(
  '--message',
  `MenoCompass ${appConfig.version} (${appConfig.runtimeVersion}) ${shortCommit}`,
);
eas([
  'update',
  '--channel', channel,
  '--platform', 'ios',
  '--environment', environment,
  '--message', message,
  '--clear-cache',
  '--non-interactive',
]);
