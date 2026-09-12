import * as Updates from 'expo-updates';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { createUpdateChecker } from './ota-controller';

export function useOtaUpdate() {
  const update = Updates.useUpdates();
  const [deferred, defer] = useState<string>();
  const check = useRef(createUpdateChecker({
    check: Updates.checkForUpdateAsync,
    download: Updates.fetchUpdateAsync,
  })).current;
  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled || update.isStartupProcedureRunning) return;
    const run = () => {
      if (AppState.currentState === 'active' && !update.isUpdatePending) {
        // Offline checks/download failures are retried on a later foreground.
        void check().catch(() => undefined);
      }
    };
    run();
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') run();
    });
    return () => subscription.remove();
  }, [check, update.isStartupProcedureRunning, update.isUpdatePending]);
  return { ...update, deferred, defer };
}

export function OtaUpdateBanner({ update, isSafe, prepareRestart }: {
  update: ReturnType<typeof useOtaUpdate>;
  isSafe: () => boolean;
  prepareRestart: () => Promise<void>;
}) {
  const [safe, setSafe] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [issue, setIssue] = useState(false);
  const restartBusy = useRef(false);
  const latestSafe = useRef(isSafe);
  latestSafe.current = isSafe;
  const key = update.downloadedUpdate
    ? `${update.downloadedUpdate.updateId || 'rollback'}:${update.downloadedUpdate.createdAt}`
    : 'pending';
  useEffect(() => {
    if (!update.isDownloading && !update.isUpdatePending) return;
    const refresh = () => setSafe(latestSafe.current());
    refresh();
    // Native operation guards are refs; observe them without rerendering the WebView.
    const timer = setInterval(refresh, 500);
    return () => clearInterval(timer);
  }, [update.isDownloading, update.isUpdatePending]);
  const restart = async () => {
    if (restartBusy.current || !latestSafe.current()) return;
    restartBusy.current = true;
    setRestarting(true);
    setIssue(false);
    try {
      await prepareRestart();
      if (!latestSafe.current()) throw new Error('Restart is no longer safe');
      await Updates.reloadAsync();
    } catch {
      setIssue(true);
    } finally {
      restartBusy.current = false;
      setRestarting(false);
    }
  };
  if (__DEV__ || !Updates.isEnabled) return null;
  const visible = safe && (update.isDownloading || update.isUpdatePending && update.deferred !== key);
  const percent = typeof update.downloadProgress === 'number'
    ? ` ${Math.round(Math.max(0, Math.min(1, update.downloadProgress)) * 100)}%` : '';
  return <>
    {visible ? <View style={styles.banner} accessibilityLiveRegion="polite">
      <Text style={styles.title}>{update.isUpdatePending ? 'Update ready' : `Downloading update…${percent}`}</Text>
      {issue ? <Text style={styles.message}>Could not restart safely. Please try again.</Text> : null}
      {update.isUpdatePending ? <View style={styles.actions}>
        <Pressable accessibilityRole="button" disabled={restarting} onPress={() => void restart()} style={styles.button}><Text style={styles.primary}>Restart now</Text></Pressable>
        <Pressable accessibilityRole="button" disabled={restarting} onPress={() => update.defer(key)} style={styles.button}><Text style={styles.message}>Later</Text></Pressable>
      </View> : <ActivityIndicator color="#244b43" />}
    </View> : null}
    <Modal visible={restarting} transparent animationType="fade" onRequestClose={() => undefined}>
      <View style={styles.scrim}><View style={styles.banner}><ActivityIndicator color="#244b43" /><Text style={styles.title}>Saving and restarting…</Text></View></View>
    </Modal>
  </>;
}

const styles = StyleSheet.create({
  banner: { padding: 16, gap: 8, backgroundColor: '#e6eee7' },
  title: { color: '#244b43', fontSize: 16, fontWeight: '600' },
  message: { color: '#244b43', fontSize: 14 },
  primary: { color: '#244b43', fontSize: 14, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 24 },
  button: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 },
  scrim: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#0008' },
});
