import { StatusBar } from 'expo-status-bar';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

const webUrl = process.env.EXPO_PUBLIC_WEB_URL || 'https://menlopass.vercel.app';

export default function App() {
  return <View style={styles.container}><StatusBar style="dark" />
    <View style={styles.sheet}>
      <Text style={styles.wordmark}>peri</Text>
      <View style={styles.rule} />
      <Text style={styles.copy}>The record runs in the web release and in the iOS app.</Text>
      <Pressable accessibilityRole="link" onPress={() => Linking.openURL(webUrl)} style={styles.button}><Text style={styles.buttonText}>Open peri</Text></Pressable>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#fbfbf9' },
  sheet: { width: '100%', maxWidth: 420, gap: 14 },
  wordmark: { fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 34, color: '#0c0c0d' },
  rule: { height: 2, backgroundColor: '#0c0c0d' },
  copy: { color: '#5f6066', fontSize: 16, lineHeight: 24 },
  button: { minHeight: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 6, backgroundColor: '#0c0c0d', marginTop: 8 },
  buttonText: { fontWeight: '600', color: '#fbfbf9', fontSize: 15 },
});
