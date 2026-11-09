import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { color, font, type } from './theme';

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
    <Text style={type.wordmark}>peri</Text>
    <View style={styles.rule} />
    <Text style={styles.eyebrow}>The record</Text>
    <Text accessibilityRole="header" style={styles.title}>{recordUnavailable ? 'It could not be opened.' : 'peri could not finish opening.'}</Text>
    <Text style={styles.body}>{recordUnavailable ? 'Your record has been kept as it is. Try again first. If you saved a password-protected backup, it can be restored here.' : 'Your record has not been changed. Try opening the app again.'}</Text>
    {issue && <Text accessibilityRole="alert" style={styles.issue}>{issue}</Text>}
    <Pressable accessibilityRole="button" disabled={busy} onPress={onRetry} style={styles.primary}><Text style={styles.primaryText}>Try again</Text></Pressable>
    {canRestore && <>
      <Text style={styles.label}>Backup password</Text>
      <TextInput accessibilityLabel="Backup password" secureTextEntry autoCapitalize="none" autoCorrect={false} textContentType="none" editable={!busy} value={password} onChangeText={setPassword} style={styles.input} />
      <Pressable accessibilityRole="button" disabled={busy || !password} onPress={() => { const value = password; setPassword(''); onRestore(value); }} style={styles.outline}><Text style={styles.outlineText}>Choose an encrypted backup</Text></Pressable>
      <Text style={styles.small}>The backup is checked before anything is replaced. A copy of the unreadable record stays on this device until you delete everything yourself.</Text>
    </>}
    {busy && <ActivityIndicator accessibilityLabel="Recovering your record" color={color.ink} />}
    {recordUnavailable && <><Pressable accessibilityRole="button" disabled={busy} onPress={onReset} style={styles.secondary}><Text style={styles.danger}>Delete the unreadable record and start again</Text></Pressable>
    <Text style={styles.small}>Starting again asks for confirmation. It does not cancel a subscription.</Text></>}
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
  screen: { flex: 1, backgroundColor: color.paper },
  content: { paddingHorizontal: 24, paddingVertical: 28, gap: 14, width: '100%', maxWidth: 560, alignSelf: 'center' },
  rule: { height: 2, backgroundColor: color.ink, marginBottom: 12 },
  eyebrow: { ...type.eyebrow },
  title: { ...type.display },
  body: { ...type.body, color: color.grey },
  small: { ...type.small },
  issue: { ...type.body, color: color.vermilionText },
  label: { ...type.label, marginTop: 10 },
  input: { minHeight: 50, paddingHorizontal: 12, borderWidth: 1.5, borderColor: color.ink, borderRadius: 6, fontFamily: font.sans, fontSize: 17, color: color.ink, backgroundColor: color.paper },
  primary: { minHeight: 54, alignItems: 'center', justifyContent: 'center', backgroundColor: color.ink, borderRadius: 6, marginTop: 6 },
  primaryText: { ...type.button },
  outline: { minHeight: 54, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: color.ink, borderRadius: 6 },
  outlineText: { ...type.button, color: color.ink },
  secondary: { minHeight: 52, justifyContent: 'center', marginTop: 10 },
  danger: { fontFamily: font.sansMedium, fontSize: 15, color: color.vermilionText, textDecorationLine: 'underline' },
  validator: { position: 'absolute', width: 1, height: 1, opacity: 0, overflow: 'hidden' },
});
