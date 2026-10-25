const { withAppDelegate, withMainApplication } = require('expo/config-plugins');
// Observe persists its dispatch switch. Reset it before native startup so an old
// consent version or a crash before JS loads cannot dispatch a previous queue.
module.exports = config => {
  config = withAppDelegate(config, mod => {
    const marker = '// peri: analytics disabled until current consent is loaded';
    if (!mod.modResults.contents.includes(marker)) {
      const pattern = /(didFinishLaunchingWithOptions[^]*?\)\s*->\s*Bool\s*\{)/;
      if (!pattern.test(mod.modResults.contents)) throw new Error('Cannot install Observe consent default in AppDelegate');
      mod.modResults.contents = mod.modResults.contents.replace(pattern, `$1\n    ${marker}\n    UserDefaults(suiteName: "dev.expo.observe")?.set(Data("{\\"dispatchingEnabled\\":false}".utf8), forKey: "config")`);
    }
    return mod;
  });
  return withMainApplication(config, mod => {
    const marker = '// peri: analytics disabled until current consent is loaded';
    if (!mod.modResults.contents.includes(marker)) {
      const pattern = /(override fun onCreate\(\)\s*\{)/;
      if (!pattern.test(mod.modResults.contents)) throw new Error('Cannot install Observe consent default in MainApplication');
      mod.modResults.contents = mod.modResults.contents.replace(pattern, `$1\n    ${marker}\n    getSharedPreferences("dev.expo.observe", 0).edit().putString("config", "{\\"dispatchingEnabled\\":false}").commit()`);
    }
    return mod;
  });
};
