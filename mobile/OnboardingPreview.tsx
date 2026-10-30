import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Animated, AppState, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { defaults, goalFor, goals, labelsFor, normalizeDraft, symptoms, type OnboardingDraft } from './onboarding-model';

/* Pip paper design system, native edition. The same Bricolage Grotesque the web
   bundle uses, shipped as four static instances so each weight is an explicit
   family (one variable file would render at its default weight on iOS). Until
   the fonts load, text falls back to the system font in the same sizes. */
const BRICOLAGE = {
  'Bricolage-Regular': require('./assets/fonts/Bricolage-Regular.ttf'),
  'Bricolage-SemiBold': require('./assets/fonts/Bricolage-SemiBold.ttf'),
  'Bricolage-Bold': require('./assets/fonts/Bricolage-Bold.ttf'),
  'Bricolage-ExtraBold': require('./assets/fonts/Bricolage-ExtraBold.ttf'),
};
const INK = '#244b43', INK_2 = '#5f6f66', PAPER = '#f8f4ed', NOTE = '#fffefa', LINE = '#e6e0d5', SAGE = '#dce7d1', SAGE_2 = '#e4ecda', LEAF = '#a3c28e', PEACH = '#f2b5a0', MINT = '#3c6857';

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
  const [fontsReady] = useFonts(BRICOLAGE);
  // Each instance is its own family, so the weight lives in the family name and fontWeight is reset to avoid iOS face matching.
  const font = (family: keyof typeof BRICOLAGE) => (fontsReady ? { fontFamily: family, fontWeight: 'normal' as const } : null);
  const display = font('Bricolage-ExtraBold'), bold = font('Bricolage-Bold'), semibold = font('Bricolage-SemiBold'), regular = font('Bricolage-Regular');

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
      <Text style={[styles.choiceLabel, semibold]}>{label}</Text><Text accessible={false} style={[styles.check, bold]}>{selected ? '✓' : ''}</Text>
    </Pressable>
  );

  return <SafeAreaView style={styles.screen}>
    <StatusBar style="dark" />
    <View style={styles.header}><View accessible accessibilityLabel="peri" style={styles.brand}><Text style={[styles.wordmark, display]}>peri</Text><View style={styles.brandDot} /></View><Text accessibilityLabel={`Step ${draft.step + 1} of 4`} style={[styles.progressText, semibold]}>{draft.step + 1} / 4</Text></View>
    <View style={styles.progress}><View style={[styles.progressFill, { width: `${(draft.step + 1) * 25}%` }]} /></View>
    <ScrollView ref={scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {draft.step > 0 && <Pressable accessibilityRole="button" disabled={busy} onPress={() => change({ step: draft.step - 1 })} style={styles.back}><Text style={[styles.linkText, semibold]}>Back</Text></Pressable>}
      {draft.step === 0 && <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.scene}>
        <View style={styles.sceneRing} />
        <View style={[styles.petal, { left: 34, top: 120 }]} /><View style={[styles.petal, styles.petalLeaf, { right: 42, top: 96, transform: [{ rotate: '20deg' }] }]} /><View style={[styles.petal, { right: 30, top: 210, transform: [{ rotate: '-60deg' }] }]} />
        <Image source={require('./assets/pip-guide.webp')} style={styles.pip} resizeMode="contain" />
        <View style={styles.bubble}><Text style={[styles.bubbleText, semibold]}>Hi, I’m Pip. I’ll keep the notes.</Text><View style={styles.bubbleTail} /></View>
      </View>}
      <Animated.View style={{ opacity: fade }}>
        <Text accessibilityRole="header" style={[styles.title, display]}>{titles[draft.step]}</Text>
        {draft.step === 0 && <>
          <Text style={[styles.body, regular]}>A few small choices. A check-in that feels like yours.</Text>
          <View style={[styles.preview, styles.previewNote]}><Text style={[styles.eyebrow, bold]}>A LITTLE SPACE, JUST FOR YOU</Text><Text style={[styles.previewTitle, display]}>Notice how you feel.<Text style={styles.soft}> One day at a time.</Text></Text><Text style={[styles.body, regular]}>Choose what to follow. Build a record you can return to, or bring to an appointment.</Text></View>
          <Text style={[styles.trust, semibold]}>Your health entries stay on this device. No account to create.</Text>
          <Text style={[styles.small, regular]}>Explore your setup first. A paid subscription is required to save check-ins and use the app.</Text>
        </>}
        {draft.step === 1 && <>
          <Text style={[styles.body, regular]}>Start with 1–3 concerns. You can follow up to six and change them later.</Text>
          <View style={styles.gridChoices}>{(showMore ? symptoms : symptoms.slice(0, 6)).map(item => choice(item.key, item.label, draft.symptoms.includes(item.key), () => select(item.key)))}</View>
          <Pressable accessibilityRole="button" accessibilityState={{ expanded: showMore }} disabled={busy} onPress={() => setShowMore(!showMore)} style={styles.back}><Text style={[styles.linkText, semibold]}>{showMore ? 'Show fewer concerns' : 'See all concerns'}</Text></Pressable>
          <Text accessibilityLiveRegion="polite" style={[styles.response, semibold]}>{selectedLabels.length ? `${selectedLabels.join(', ')} — we’ll put these front and center.` : 'Choose what feels relevant to you.'}</Text>
        </>}
        {draft.step === 2 && <>
          <Text style={[styles.body, regular]}>There’s no right answer. Start with what matters to you today.</Text>
          <View accessibilityRole="radiogroup" accessibilityLabel="Your main goal" style={styles.choices}>{goals.map(item => choice(item.key, item.label, draft.intent === item.key, () => change({ intent: item.key }), true))}</View>
          <Text accessibilityLiveRegion="polite" style={[styles.response, semibold]}>{draft.intent ? goal.reply : 'Your choice will shape your starting point.'}</Text>
        </>}
        {draft.step === 3 && <>
          <Text style={[styles.body, regular]}>A small starting point, shaped by what matters to you.</Text>
          <View style={styles.preview}><Text style={[styles.eyebrow, bold]}>YOUR STARTING FOCUS</Text>{selectedLabels.map(label => <View key={label} style={styles.previewRow}><Text style={[styles.choiceLabel, semibold]}>{label}</Text><Text accessible={false} style={[styles.check, bold]}>✓</Text></View>)}<Text style={[styles.small, regular]}>Your selection, ready for your first check-in. Nothing has been rated or logged yet.</Text></View>
          <Text accessibilityRole="header" style={[styles.subheading, display]}>{goal.label}</Text><Text style={[styles.body, regular]}>{goal.benefit}</Text>
          <Text style={[styles.small, regular]}>After subscribing, we’ll help you save your first check-in. Profile details and reminders can wait.</Text>
        </>}
      </Animated.View>
      {(message || props.issue) && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.error, semibold]}>{message || props.issue}</Text>}
    </ScrollView>
    <View style={styles.footer}>
      {draft.step === 1 && <Text style={[styles.small, regular]}>{draft.symptoms.length} selected</Text>}
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy || (draft.step === 1 && !draft.symptoms.length) || (draft.step === 2 && !draft.intent), busy }} disabled={busy || (draft.step === 1 && !draft.symptoms.length) || (draft.step === 2 && !draft.intent)} onPress={() => draft.step === 3 ? void finish() : change({ step: draft.step + 1 })} style={({ pressed }) => [styles.primary, pressed && styles.pressed, (busy || (draft.step === 1 && !draft.symptoms.length) || (draft.step === 2 && !draft.intent)) && styles.disabled]}>
        {busy ? <ActivityIndicator color={NOTE} /> : <Text style={[styles.primaryText, semibold]}>{['Find my starting point', 'These matter to me', 'See my check-in', 'View subscription plans'][draft.step]}</Text>}
      </Pressable>
      {draft.step < 3 && <Pressable accessibilityRole="button" disabled={busy} onPress={() => change({ step: 3, symptoms: draft.symptoms.length ? draft.symptoms : defaults, intent: draft.intent || 'understand' })} style={styles.secondary}><Text style={[styles.linkText, semibold]}>Use a starter check-in</Text></Pressable>}
      <View style={styles.links}><Pressable accessibilityRole="button" disabled={busy || !props.restoreReady} onPress={props.onRestore} style={styles.legal}><Text style={[styles.legalText, regular]}>Restore purchases</Text></Pressable><Pressable accessibilityRole="link" onPress={() => void Linking.openURL('https://menlopass.vercel.app/privacy.html')} style={styles.legal}><Text style={[styles.legalText, regular]}>Privacy</Text></Pressable><Pressable accessibilityRole="link" onPress={() => void Linking.openURL('https://menlopass.vercel.app/terms.html')} style={styles.legal}><Text style={[styles.legalText, regular]}>Terms</Text></Pressable></View>
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: PAPER },
  header: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 5 }, wordmark: { fontSize: 23, lineHeight: 28, letterSpacing: -0.7, color: INK, fontWeight: '800' }, brandDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: PEACH, marginTop: 2 },
  progressText: { fontSize: 12, color: INK_2, fontWeight: '600' }, progress: { height: 4, borderRadius: 2, backgroundColor: '#e3ddd2', marginHorizontal: 22, overflow: 'hidden' }, progressFill: { height: 4, borderRadius: 2, backgroundColor: INK },
  content: { padding: 22, paddingBottom: 30, width: '100%', maxWidth: 650, alignSelf: 'center' }, back: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start', paddingRight: 18, marginBottom: 6 },
  scene: { height: 270, borderRadius: 24, backgroundColor: SAGE, overflow: 'hidden', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 20 },
  sceneRing: { position: 'absolute', top: 40, width: 360, height: 360, borderRadius: 180, backgroundColor: 'rgba(255,254,250,0.35)' },
  petal: { position: 'absolute', width: 16, height: 9, borderRadius: 8, backgroundColor: PEACH, opacity: 0.75, transform: [{ rotate: '-30deg' }] }, petalLeaf: { backgroundColor: LEAF },
  pip: { width: 156, height: 236 },
  bubble: { position: 'absolute', left: 18, top: 18, maxWidth: 170, backgroundColor: NOTE, borderWidth: 1.5, borderColor: INK, borderRadius: 18, paddingVertical: 11, paddingHorizontal: 14 },
  bubbleText: { fontSize: 14, lineHeight: 18, color: INK, fontWeight: '600' },
  bubbleTail: { position: 'absolute', right: -7, bottom: 12, width: 12, height: 12, backgroundColor: NOTE, borderRightWidth: 1.5, borderTopWidth: 1.5, borderColor: INK, transform: [{ rotate: '45deg' }] },
  title: { fontSize: 38, lineHeight: 41, letterSpacing: -1.4, color: INK, marginBottom: 12, fontWeight: '800' },
  body: { fontSize: 16, lineHeight: 24, color: INK_2, marginBottom: 18 }, small: { fontSize: 13, lineHeight: 19, color: INK_2, marginTop: 8 }, trust: { fontSize: 15, lineHeight: 22, color: INK, marginTop: 18, marginBottom: 6, fontWeight: '600' },
  preview: { backgroundColor: SAGE_2, borderRadius: 24, paddingVertical: 20, paddingHorizontal: 22, marginTop: 8, marginBottom: 18 }, previewNote: { backgroundColor: NOTE, borderWidth: 1, borderColor: LINE },
  eyebrow: { fontSize: 10.5, lineHeight: 15, letterSpacing: 1.4, color: MINT, marginBottom: 8, fontWeight: '700' }, previewTitle: { fontSize: 25, lineHeight: 28, letterSpacing: -0.8, color: INK, marginBottom: 10, fontWeight: '800' }, soft: { color: '#5c7a57' },
  choices: { gap: 10 }, gridChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, concernChoice: { width: '48%', minHeight: 62, paddingHorizontal: 14 }, choice: { minHeight: 62, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 18, borderWidth: 1.5, borderColor: LINE, backgroundColor: NOTE, flexDirection: 'row', alignItems: 'center', gap: 10 }, chosen: { backgroundColor: SAGE_2, borderColor: LEAF }, choiceLabel: { fontSize: 15, color: INK, flex: 1, lineHeight: 21, fontWeight: '600' }, check: { color: INK, fontSize: 18, minWidth: 20, fontWeight: '700' },
  response: { fontSize: 15, lineHeight: 22, color: MINT, marginTop: 16, fontWeight: '600' }, subheading: { fontSize: 24, lineHeight: 27, letterSpacing: -0.7, color: INK, marginBottom: 8, fontWeight: '800' }, previewRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderColor: '#d3dcc9', paddingVertical: 12 },
  footer: { paddingHorizontal: 22, paddingTop: 10, paddingBottom: 4, width: '100%', maxWidth: 650, alignSelf: 'center', backgroundColor: PAPER }, primary: { minHeight: 54, borderRadius: 999, alignItems: 'center', justifyContent: 'center', padding: 14, backgroundColor: INK, marginTop: 6 }, primaryText: { fontSize: 16, fontWeight: '600', color: NOTE, textAlign: 'center' }, secondary: { minHeight: 44, alignItems: 'center', justifyContent: 'center', padding: 8 }, linkText: { fontSize: 14, color: INK, lineHeight: 18, fontWeight: '600' }, legalText: { fontSize: 13, color: INK_2, lineHeight: 18 }, links: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 8 }, legal: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 6 }, pressed: { opacity: 0.8 }, disabled: { opacity: 0.45 }, error: { color: '#ae493c', fontSize: 15, lineHeight: 22, marginTop: 12 },
});
