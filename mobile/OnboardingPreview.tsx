import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Animated, AppState, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { defaults, goalFor, goals, labelsFor, normalizeDraft, symptoms, type OnboardingDraft } from './onboarding-model';

export type PreviewEvent = 'onboarding_started' | 'onboarding_step_viewed' | 'onboarding_step_left' | 'onboarding_selection_limit';
type Props = {
  initialDraft: OnboardingDraft;
  busy: boolean;
  issue?: string;
  restoreReady: boolean;
  onChange: (draft: OnboardingDraft) => void;
  onFinish: (draft: OnboardingDraft) => Promise<void>;
  onRestore: () => void;
  onEvent: (event: PreviewEvent, attributes?: Record<string, string | number>) => void;
};

export function OnboardingPreview(props: Props) {
  const [draft, setDraft] = useState(() => normalizeDraft(props.initialDraft));
  const [showMore, setShowMore] = useState(draft.symptoms.some(key => !symptoms.slice(0, 6).some(item => item.key === key)));
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(true);
  const fade = useRef(new Animated.Value(1)).current;
  const scroll = useRef<ScrollView>(null);
  const event = useRef(props.onEvent);
  event.current = props.onEvent;
  const busy = props.busy || saving;
  const goal = goalFor(draft.intent);
  const selectedLabels = labelsFor(draft.symptoms);
  const titles = ['Let’s make room for you.', 'What’s been bothering you most?', 'What would help you most?', 'Your check-in, made for you.'];

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then(value => { if (active) setReduceMotion(value); });
    const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    event.current('onboarding_started');
    return () => { active = false; listener.remove(); };
  }, []);

  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
    AccessibilityInfo.announceForAccessibility(`Step ${draft.step + 1} of 4. ${titles[draft.step]}`);
    let started: number | null = null;
    const enter = () => {
      if (started !== null) return;
      started = Date.now();
      event.current('onboarding_step_viewed', { step: draft.step, surface: 'native_preview', flowVersion: 2 });
    };
    const leave = () => {
      if (started === null) return;
      event.current('onboarding_step_left', { step: draft.step, durationMs: Math.min(3_600_000, Date.now() - started), surface: 'native_preview', flowVersion: 2 });
      started = null;
    };
    if (AppState.currentState === 'active') enter();
    const listener = AppState.addEventListener('change', state => state === 'active' ? enter() : leave());
    return () => { leave(); listener.remove(); };
  }, [draft.step]);

  useEffect(() => {
    if (reduceMotion) { fade.setValue(1); return; }
    fade.setValue(0);
    const animation = Animated.timing(fade, { toValue: 1, duration: 180, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [draft.step, reduceMotion, fade]);

  const change = (patch: Partial<OnboardingDraft>) => {
    const next = normalizeDraft({ ...draft, ...patch });
    setDraft(next); setMessage(''); props.onChange(next);
  };
  const select = (key: string) => {
    if (draft.symptoms.includes(key)) change({ symptoms: draft.symptoms.filter(value => value !== key) });
    else if (draft.symptoms.length < 6) change({ symptoms: [...draft.symptoms, key] });
    else {
      setMessage('You can follow up to six. Remove one to make room for another.');
      event.current('onboarding_selection_limit', { step: 1, surface: 'native_preview', flowVersion: 2 });
    }
  };
  const finish = async () => {
    if (busy) return;
    setSaving(true); setMessage('');
    try { await props.onFinish(draft); }
    catch { setMessage('Your setup could not be saved securely. Please try again.'); }
    finally { setSaving(false); }
  };
  const choice = (key: string, label: string, selected: boolean, onPress: () => void, radio = false) => (
    <Pressable key={key} accessibilityRole={radio ? 'radio' : 'checkbox'} accessibilityState={{ checked: selected, disabled: busy }} accessibilityLabel={label} disabled={busy} onPress={onPress} style={({ pressed }) => [styles.choice, !radio && styles.concernChoice, selected && styles.chosen, pressed && styles.pressed]}>
      <Text style={styles.choiceLabel}>{label}</Text><Text accessible={false} style={styles.check}>{selected ? '✓' : ''}</Text>
    </Pressable>
  );

  return <SafeAreaView style={styles.screen}>
    <StatusBar style="dark" />
    <View style={styles.header}><View style={styles.brand}><Image source={require('./assets/icon.png')} style={styles.icon} /><Text style={styles.wordmark}>peri</Text></View><Text accessibilityLabel={`Step ${draft.step + 1} of 4`} style={styles.progressText}>{draft.step + 1} / 4</Text></View>
    <View style={styles.progress}><View style={[styles.progressFill, { width: `${(draft.step + 1) * 25}%` }]} /></View>
    <ScrollView ref={scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {draft.step > 0 && <Pressable accessibilityRole="button" disabled={busy} onPress={() => change({ step: draft.step - 1 })} style={styles.back}><Text style={styles.linkText}>Back</Text></Pressable>}
      <Animated.View style={{ opacity: fade }}>
        <Text accessibilityRole="header" style={styles.title}>{titles[draft.step]}</Text>
        {draft.step === 0 && <>
          <Text style={styles.body}>A few small choices. A check-in that feels like yours.</Text>
          <View style={styles.preview}><Text style={styles.eyebrow}>A LITTLE SPACE, JUST FOR YOU</Text><Text style={styles.previewTitle}>Notice how you feel.<Text style={styles.soft}> One day at a time.</Text></Text><Text style={styles.body}>Choose what to follow. Build a record you can return to, or bring to an appointment.</Text></View>
          <Text style={styles.trust}>Your health entries stay on this device. No account to create.</Text>
          <Text style={styles.small}>Explore your setup first. A paid subscription is required to save check-ins and use the app.</Text>
        </>}
        {draft.step === 1 && <>
          <Text style={styles.body}>Start with 1–3 concerns. You can follow up to six and change them later.</Text>
          <View style={styles.gridChoices}>{(showMore ? symptoms : symptoms.slice(0, 6)).map(item => choice(item.key, item.label, draft.symptoms.includes(item.key), () => select(item.key)))}</View>
          <Pressable accessibilityRole="button" accessibilityState={{ expanded: showMore }} disabled={busy} onPress={() => setShowMore(!showMore)} style={styles.back}><Text style={styles.linkText}>{showMore ? 'Show fewer concerns' : 'See all concerns'}</Text></Pressable>
          <Text accessibilityLiveRegion="polite" style={styles.response}>{selectedLabels.length ? `${selectedLabels.join(', ')} — we’ll put these front and center.` : 'Choose what feels relevant to you.'}</Text>
        </>}
        {draft.step === 2 && <>
          <Text style={styles.body}>There’s no right answer. Start with what matters to you today.</Text>
          <View accessibilityRole="radiogroup" accessibilityLabel="Your main goal" style={styles.choices}>{goals.map(item => choice(item.key, item.label, draft.intent === item.key, () => change({ intent: item.key }), true))}</View>
          <Text accessibilityLiveRegion="polite" style={styles.response}>{draft.intent ? goal.reply : 'Your choice will shape your starting point.'}</Text>
        </>}
        {draft.step === 3 && <>
          <Text style={styles.body}>A small starting point, shaped by what matters to you.</Text>
          <View style={styles.preview}><Text style={styles.eyebrow}>YOUR STARTING FOCUS</Text>{selectedLabels.map(label => <View key={label} style={styles.previewRow}><Text style={styles.choiceLabel}>{label}</Text><Text accessible={false} style={styles.check}>✓</Text></View>)}<Text style={styles.small}>Your selection, ready for your first check-in. Nothing has been rated or logged yet.</Text></View>
          <Text accessibilityRole="header" style={styles.subheading}>{goal.label}</Text><Text style={styles.body}>{goal.benefit}</Text>
          <Text style={styles.small}>After subscribing, we’ll help you save your first check-in. Profile details and reminders can wait.</Text>
        </>}
      </Animated.View>
      {(message || props.issue) && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{message || props.issue}</Text>}
    </ScrollView>
    <View style={styles.footer}>
      {draft.step === 1 && <Text style={styles.small}>{draft.symptoms.length} selected</Text>}
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy || (draft.step === 1 && !draft.symptoms.length) || (draft.step === 2 && !draft.intent), busy }} disabled={busy || (draft.step === 1 && !draft.symptoms.length) || (draft.step === 2 && !draft.intent)} onPress={() => draft.step === 3 ? void finish() : change({ step: draft.step + 1 })} style={({ pressed }) => [styles.primary, pressed && styles.pressed, (busy || (draft.step === 1 && !draft.symptoms.length) || (draft.step === 2 && !draft.intent)) && styles.disabled]}>
        {busy ? <ActivityIndicator color="#fffefa" /> : <Text style={styles.primaryText}>{['Find my starting point', 'These matter to me', 'See my check-in', 'View subscription plans'][draft.step]}</Text>}
      </Pressable>
      {draft.step < 3 && <Pressable accessibilityRole="button" disabled={busy} onPress={() => change({ step: 3, symptoms: draft.symptoms.length ? draft.symptoms : defaults, intent: draft.intent || 'understand' })} style={styles.secondary}><Text style={styles.linkText}>Use a starter check-in</Text></Pressable>}
      <View style={styles.links}><Pressable accessibilityRole="button" disabled={busy || !props.restoreReady} onPress={props.onRestore} style={styles.legal}><Text style={styles.linkText}>Restore purchases</Text></Pressable><Pressable accessibilityRole="link" onPress={() => void Linking.openURL('https://menlopass.vercel.app/privacy.html')} style={styles.legal}><Text style={styles.linkText}>Privacy</Text></Pressable><Pressable accessibilityRole="link" onPress={() => void Linking.openURL('https://menlopass.vercel.app/terms.html')} style={styles.legal}><Text style={styles.linkText}>Terms</Text></Pressable></View>
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f7f5ef' },
  header: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 7 }, icon: { width: 30, height: 30, borderRadius: 8 }, wordmark: { fontFamily: 'Georgia', fontSize: 27, color: '#214b43' },
  progressText: { fontSize: 12, color: '#506455' }, progress: { height: 3, backgroundColor: '#dfe4d8', marginHorizontal: 24 }, progressFill: { height: 3, backgroundColor: '#80966e' },
  content: { padding: 24, paddingBottom: 30, width: '100%', maxWidth: 650, alignSelf: 'center' }, back: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start', paddingRight: 18, marginBottom: 8 },
  title: { fontFamily: 'Georgia', fontSize: 36, lineHeight: 42, letterSpacing: -1, color: '#233f33', marginBottom: 16 },
  body: { fontSize: 16, lineHeight: 24, color: '#526151', marginBottom: 20 }, small: { fontSize: 13, lineHeight: 19, color: '#53614f', marginTop: 8 }, trust: { fontSize: 15, lineHeight: 22, color: '#214b43', marginTop: 24, marginBottom: 8 },
  preview: { backgroundColor: '#e7edde', borderRadius: 18, padding: 22, marginTop: 8, marginBottom: 22 }, eyebrow: { fontSize: 11, letterSpacing: 1, color: '#405b49', marginBottom: 15 }, previewTitle: { fontFamily: 'Georgia', fontSize: 29, lineHeight: 35, color: '#233f33', marginBottom: 18 }, soft: { color: '#536b45', fontStyle: 'italic' },
  choices: { gap: 10 }, gridChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, concernChoice: { width: '48%', minHeight: 72, paddingHorizontal: 12 }, choice: { minHeight: 58, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#d8ded1', backgroundColor: '#fffefa', flexDirection: 'row', alignItems: 'center', gap: 10 }, chosen: { backgroundColor: '#e7edde', borderColor: '#7e956d' }, choiceLabel: { fontSize: 16, color: '#294437', flex: 1, lineHeight: 23 }, check: { color: '#244b43', fontSize: 20, minWidth: 20 },
  response: { fontSize: 15, lineHeight: 22, color: '#315840', marginTop: 22 }, subheading: { fontFamily: 'Georgia', fontSize: 25, color: '#233f33', marginBottom: 12 }, previewRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderColor: '#ced8c3', paddingVertical: 12 },
  footer: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 4, borderTopWidth: 1, borderColor: '#dfe4d8', width: '100%', maxWidth: 650, alignSelf: 'center' }, primary: { minHeight: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', padding: 14, backgroundColor: '#214b43', marginTop: 8 }, primaryText: { fontSize: 16, fontWeight: '600', color: '#fffefa', textAlign: 'center' }, secondary: { minHeight: 44, alignItems: 'center', justifyContent: 'center', padding: 8 }, linkText: { fontSize: 13, color: '#214b43', lineHeight: 18 }, links: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 8 }, legal: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 6 }, pressed: { opacity: 0.8 }, disabled: { opacity: 0.45 }, error: { color: '#853f2c', fontSize: 15, lineHeight: 22, marginTop: 12 },
});
