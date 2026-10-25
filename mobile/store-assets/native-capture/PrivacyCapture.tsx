import { Platform, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// App.native.tsx's consent UI is inline, not an exported component. This is its
// exact presentation at build 40; only the choice callback is capture-local.
export function PrivacyCapture({ onChoose }: { onChoose: () => void }) {
  return <SafeAreaView style={styles.gate}><ScrollView contentContainerStyle={styles.gateContent}>
    <Text accessibilityRole="header" style={styles.gateTitle}>Help improve peri?</Text>
    <Text style={styles.gateBody}>Optional analytics shares feature-use events and performance with peri and PostHog/Expo, plus fully masked recordings of the native onboarding preview. Your health entries, answers, notes, and reports stay private. Sanitized crash diagnostics are separate.</Text>
    <Text style={styles.gateBody}>This choice is separate from Apple's advertising permission. Every feature remains available with analytics off. Change your choice or request analytics deletion in Profile.</Text>
    <Pressable disabled={false} accessibilityRole="button" style={styles.gatePrimary} onPress={onChoose}><Text style={styles.gatePrimaryText}>Continue without analytics</Text></Pressable>
    <Pressable disabled={false} accessibilityRole="button" style={[styles.gatePrimary, { marginTop: 12 }]} onPress={onChoose}><Text style={styles.gatePrimaryText}>Allow optional analytics</Text></Pressable>
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({
  gate: { flex: 1, backgroundColor: '#f7f5ef' },
  gateContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 24 },
  gateTitle: { maxWidth: 420, color: '#263e37', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontSize: 34, lineHeight: 40, fontWeight: '400', textAlign: 'center' },
  gateBody: { maxWidth: 420, marginTop: 14, color: '#68756d', fontSize: 15, lineHeight: 23, textAlign: 'center' },
  gatePrimary: { width: '100%', maxWidth: 420, minHeight: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', backgroundColor: '#244b43' },
  gatePrimaryText: { color: '#fffefa', fontSize: 15, fontWeight: '700' },
});
