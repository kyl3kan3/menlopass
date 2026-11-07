const { spawnSync } = require('node:child_process');
const path = require('node:path');

function checkSdkDependencies({ spawn = spawnSync, env = process.env, projectRoot = path.resolve(__dirname, '..') } = {}) {
  // OTA must preserve the installed native runtime. Expo's install checker uses
  // the locked SDK's bundledNativeModules.json in offline mode, and still exits
  // nonzero on incompatibility. The startup validator's offline skip is separate.
  // Run the remaining online Doctor checks in CI after this check succeeds.
  const result = spawn(process.execPath, [require.resolve('expo/bin/cli'), 'install', '--check'], {
    cwd: projectRoot,
    env: { ...env, CI: '1', EXPO_NO_DOTENV: '1', EXPO_OFFLINE: '1' },
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  return result.status ?? 1;
}

if (require.main === module) {
  try { process.exitCode = checkSdkDependencies(); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { checkSdkDependencies };
