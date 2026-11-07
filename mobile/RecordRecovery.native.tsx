import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

type Props = {
  busy: boolean;
  issue?: string;
  canRestore: boolean;
  recordUnavailable: boolean;
  onRetry: () => void;
  onRestore: (password: string) => void;
  onReset: () => void;
};

export function RecordRecovery({ busy, issue, canRestore, recordUnavailable, onRetry, onRestore, onReset }: Props) {
  const [password, setPassword] = useState('');
  return <SafeAreaView style={styles.screen}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <Text accessibilityRole="header" style={styles.title}>{recordUnavailable ? 'Your record could not be opened.' : 'peri could not finish opening.'}</Text>
    <Text style={styles.body}>{recordUnavailable ? 'Your existing record has been kept. Try again first. If you have a password-protected peri backup, you can restore it here.' : 'Your record has not been changed. Try opening the app again.'}</Text>
    {issue && <Text accessibilityRole="alert" style={styles.issue}>{issue}</Text>}
    <Pressable accessibilityRole="button" disabled={busy} onPress={onRetry} style={styles.primary}><Text style={styles.primaryText}>Try again</Text></Pressable>
    {canRestore && <>
      <Text style={styles.label}>Backup password</Text>
      <TextInput accessibilityLabel="Backup password" secureTextEntry autoCapitalize="none" autoCorrect={false} textContentType="none" editable={!busy} value={password} onChangeText={setPassword} style={styles.input} />
      <Pressable accessibilityRole="button" disabled={busy || !password} onPress={() => { const value = password; setPassword(''); onRestore(value); }} style={styles.primary}><Text style={styles.primaryText}>Choose encrypted backup</Text></Pressable>
      <Text style={styles.body}>The backup is checked before replacement. A copy of the unreadable record stays on this device until you explicitly delete app profile and data.</Text>
    </>}
    {busy && <ActivityIndicator accessibilityLabel="Recovering your record" color="#244b43" />}
    {recordUnavailable && <><Pressable accessibilityRole="button" disabled={busy} onPress={onReset} style={styles.secondary}><Text style={styles.danger}>Delete unreadable record and start again</Text></Pressable>
    <Text style={styles.body}>Starting again requires confirmation. It does not cancel your subscription.</Text></>}
  </ScrollView></SafeAreaView>;
}

/** Use the same strict schema/migration as regular backup imports. This isolated
 * WebView never receives the device record and cannot persist or navigate. */
export function RecoveryBackupValidator({ html, candidate, onResult }: {
  html: string;
  candidate: string;
  onResult: (state: string | null) => void;
}) {
  const view = useRef<WebView>(null);
  const finished = useRef(false);
  const finish = (state: string | null) => {
    if (finished.current) return;
    finished.current = true;
    onResult(state);
  };
  useEffect(() => {
    const timer = setTimeout(() => finish(null), 15_000);
    return () => clearTimeout(timer);
  }, []);
  return <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none" style={styles.validator}>
    <WebView ref={view} source={{ html }} originWhitelist={['*']} javaScriptEnabled
      injectedJavaScriptBeforeContentLoaded="window.__MENO_NATIVE__=true;window.__MENO_PERSISTED_STATE__='';true;"
      onShouldStartLoadWithRequest={({ url }) => url === 'about:blank' || url.startsWith('data:')}
      onLoadEnd={() => view.current?.injectJavaScript(`(function(){try{var state=JSON.stringify(validateBackup(JSON.parse(${JSON.stringify(candidate)})));window.ReactNativeWebView.postMessage(JSON.stringify({type:'recovery-validation',state:state}));}catch(e){window.ReactNativeWebView.postMessage(JSON.stringify({type:'recovery-validation',state:null}));}})();true;`)}
      onError={() => finish(null)}
      onMessage={event => { try { const data = JSON.parse(event.nativeEvent.data); if (data.type === 'recovery-validation') finish(typeof data.state === 'string' ? data.state : null); } catch {} }}
    />
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8f4ed' },
  content: { padding: 24, gap: 16, width: '100%', maxWidth: 620, alignSelf: 'center' },
  title: { fontSize: 30, lineHeight: 36, color: '#244b43', fontWeight: '700' },
  body: { fontSize: 16, lineHeight: 24, color: '#5f6f66' },
  issue: { color: '#ae493c', fontSize: 16, lineHeight: 24 },
  label: { fontSize: 16, fontWeight: '600', color: '#244b43' },
  input: { minHeight: 48, padding: 12, borderWidth: 1, borderColor: '#5f6f66', borderRadius: 12, fontSize: 18, color: '#244b43', backgroundColor: '#fffefa' },
  primary: { minHeight: 52, padding: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#244b43', borderRadius: 26 },
  primaryText: { fontSize: 16, color: '#fffefa', fontWeight: '600' },
  secondary: { minHeight: 52, justifyContent: 'center' },
  danger: { fontSize: 16, color: '#ae493c', textAlign: 'center' },
  validator: { position: 'absolute', width: 1, height: 1, opacity: 0, overflow: 'hidden' },
});
