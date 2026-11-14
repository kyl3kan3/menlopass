import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  AppState,
  Easing,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  defaults,
  concernBucket,
  goalFor,
  goals,
  labelsFor,
  normalizeDraft,
  onboardingAnalyticsProperties,
  symptoms,
  versionV2Flow,
  type OnboardingDraft,
} from './onboarding-model';
import { configureRemindersAsync } from './privacyFeatures.native';
import { OnboardingShowcaseStage } from './OnboardingShowcaseStage';
import {
  ONBOARDING_V2_FINAL_STEP,
  ONBOARDING_V2_STEP_COUNT,
  onboardingV2StepTitles,
} from './onboarding-v2-steps';
import type { PreviewEvent } from './OnboardingPreview';

const BRICOLAGE = {
  'Bricolage-Regular': require('./assets/fonts/Bricolage-Regular.ttf'),
  'Bricolage-SemiBold': require('./assets/fonts/Bricolage-SemiBold.ttf'),
  'Bricolage-Bold': require('./assets/fonts/Bricolage-Bold.ttf'),
  'Bricolage-ExtraBold': require('./assets/fonts/Bricolage-ExtraBold.ttf'),
};

const INK = '#3d2f4a';
const INK_2 = '#6b5f78';
const PAPER = '#f7f3f8';
const NOTE = '#fffcff';
const LINE = '#e2d8ea';
const LAVENDER = '#ddd0eb';
const LAVENDER_2 = '#ece4f3';
const BLUSH = '#e8c4c0';
const ACCENT = '#8b6fa8';
const SAGE = '#6a8f7b';

const SHOWCASE_START = 1;
const SHOWCASE_END = 6;
const SYMPTOMS_STEP = 7;
const GOAL_STEP = 8;
const SUMMARY_STEP = 9;
const BUILDING_STEP = 10;
const NOTIFICATIONS_STEP = 11;

type PreviewSeverity = 'mild' | 'moderate' | 'strong';

const severityLabels: Record<PreviewSeverity, string> = {
  mild: 'Mild',
  moderate: 'Moderate',
  strong: 'Strong',
};

const checkInSymptoms = symptoms.slice(0, 6);

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

function BuildingPlanMoment({ reduceMotion, display, regular }: {
  reduceMotion: boolean;
  display: { fontFamily: string; fontWeight: 'normal' } | null;
  regular: { fontFamily: string; fontWeight: 'normal' } | null;
}) {
  const progress = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const [labelIndex, setLabelIndex] = useState(0);
  const labels = ['Listening to what you shared…', 'Shaping your check-in…', 'Almost ready…'];

  useEffect(() => {
    if (reduceMotion) {
      progress.setValue(1);
      setLabelIndex(labels.length - 1);
      return;
    }
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 2800,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start();
    const timers = labels.map((_, index) => setTimeout(() => setLabelIndex(index), index * 900));
    return () => {
      animation.stop();
      timers.forEach(clearTimeout);
    };
  }, [reduceMotion, progress]);

  const width = progress.interpolate({ inputRange: [0, 1], outputRange: ['6%', '100%'] });

  return (
    <View style={styles.buildingWrap} accessibilityLiveRegion="polite">
      <Text accessibilityRole="header" style={[styles.title, display]}>Building your plan</Text>
      <Text style={[styles.body, regular]}>{labels[labelIndex]}</Text>
      <View style={styles.buildingTrack}>
        <Animated.View style={[styles.buildingFill, { width }]} />
      </View>
    </View>
  );
}

function SampleReminderCard({ title, body, time }: { title: string; body: string; time: string }) {
  return (
    <View style={styles.reminderCard} accessibilityLabel={`Sample reminder: ${title}. ${body}`}>
      <View style={styles.reminderIcon}><Text style={styles.reminderIconText}>p</Text></View>
      <View style={styles.reminderCopy}>
        <View style={styles.reminderTop}>
          <Text style={styles.reminderTitle}>{title}</Text>
          <Text style={styles.reminderTime}>{time}</Text>
        </View>
        <Text style={styles.reminderBody}>{body}</Text>
      </View>
    </View>
  );
}

export function OnboardingPreviewV2(props: Props) {
  const [draft, setDraft] = useState(() => normalizeDraft(props.initialDraft, versionV2Flow));
  const [showMore, setShowMore] = useState(draft.symptoms.some(key => !symptoms.slice(0, 6).some(item => item.key === key)));
  const [checkInSymptom, setCheckInSymptom] = useState<string | null>(null);
  const [checkInSeverity, setCheckInSeverity] = useState<PreviewSeverity | null>(null);
  const [previewCheckIn, setPreviewCheckIn] = useState<{ symptomKey: string; label: string; severity: PreviewSeverity } | null>(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(true);
  const [buildingDone, setBuildingDone] = useState(false);
  const [reminderBusy, setReminderBusy] = useState(false);
  const fade = useRef(new Animated.Value(1)).current;
  const scroll = useRef<ScrollView>(null);
  const event = useRef(props.onEvent);
  event.current = props.onEvent;
  const busy = props.busy || saving || reminderBusy;
  const goal = goalFor(draft.intent);
  const selectedLabels = labelsFor(draft.symptoms);
  const [fontsReady, fontError] = useFonts(BRICOLAGE);
  const font = (family: keyof typeof BRICOLAGE) => (fontsReady ? { fontFamily: family, fontWeight: 'normal' as const } : null);
  const display = font('Bricolage-ExtraBold');
  const bold = font('Bricolage-Bold');
  const semibold = font('Bricolage-SemiBold');
  const regular = font('Bricolage-Regular');
  const flowVersion = 3;

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then(value => { if (active) setReduceMotion(value); });
    const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    event.current('onboarding_started');
    return () => { active = false; listener.remove(); };
  }, []);

  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
    const title = onboardingV2StepTitles[draft.step] || 'Setup';
    AccessibilityInfo.announceForAccessibility(`Step ${draft.step + 1} of ${ONBOARDING_V2_STEP_COUNT}. ${title}`);
    let started: number | null = null;
    const enter = () => {
      if (started !== null) return;
      started = Date.now();
      event.current('onboarding_step_viewed', { step: draft.step, surface: 'native_preview', flowVersion });
    };
    const leave = () => {
      if (started === null) return;
      const analytics = draft.step === GOAL_STEP
        ? onboardingAnalyticsProperties(draft, versionV2Flow)
        : draft.step === SYMPTOMS_STEP
          ? { onboardingConcernBucket: concernBucket(draft.symptoms.length) }
          : {};
      event.current('onboarding_step_left', {
        step: draft.step,
        durationMs: Math.min(3_600_000, Date.now() - started),
        surface: 'native_preview',
        flowVersion,
        ...analytics,
      });
      started = null;
    };
    if (AppState.currentState === 'active') enter();
    const listener = AppState.addEventListener('change', state => state === 'active' ? enter() : leave());
    return () => { leave(); listener.remove(); };
  }, [draft.step]);

  useEffect(() => {
    if (reduceMotion) { fade.setValue(1); return; }
    fade.setValue(0);
    const animation = Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [draft.step, reduceMotion, fade]);

  useEffect(() => {
    if (draft.step !== BUILDING_STEP) {
      setBuildingDone(false);
      return;
    }
    if (reduceMotion) {
      setBuildingDone(true);
      return;
    }
    const timer = setTimeout(() => setBuildingDone(true), 2900);
    return () => clearTimeout(timer);
  }, [draft.step, reduceMotion]);

  const change = (patch: Partial<OnboardingDraft>) => {
    const next = normalizeDraft({ ...draft, ...patch }, versionV2Flow);
    setDraft(next);
    setMessage('');
    props.onChange(next);
  };

  const select = (key: string) => {
    if (draft.symptoms.includes(key)) change({ symptoms: draft.symptoms.filter(value => value !== key) });
    else if (draft.symptoms.length < 6) change({ symptoms: [...draft.symptoms, key] });
    else {
      setMessage('You can follow up to six. Remove one to make room for another.');
      event.current('onboarding_selection_limit', { step: SYMPTOMS_STEP, surface: 'native_preview', flowVersion });
    }
  };

  const finish = async (nextDraft = draft) => {
    if (busy) return;
    setSaving(true);
    setMessage('');
    try { await props.onFinish(nextDraft); }
    catch { setMessage('Your setup could not be saved securely. Please try again.'); }
    finally { setSaving(false); }
  };

  const completedDraft = () => normalizeDraft({ ...draft, step: ONBOARDING_V2_FINAL_STEP }, versionV2Flow);

  const enableReminders = async () => {
    if (busy) return;
    setReminderBusy(true);
    setMessage('');
    try {
      await configureRemindersAsync({
        dailyCheckIn: { enabled: true, hour: 20, minute: 0 },
        treatmentFollowUp: { enabled: false, weekday: 1, hour: 10, minute: 0 },
      }, true);
      const next = completedDraft();
      setDraft(next);
      props.onChange(next);
      await finish(next);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Reminders could not be updated.');
    } finally {
      setReminderBusy(false);
    }
  };

  const skipReminders = async () => {
    if (busy) return;
    const next = completedDraft();
    setDraft(next);
    props.onChange(next);
    await finish(next);
  };

  const choice = (key: string, label: string, selected: boolean, onPress: () => void, radio = false) => (
    <Pressable key={key} accessibilityRole={radio ? 'radio' : 'checkbox'} accessibilityState={{ checked: selected, disabled: busy }} accessibilityLabel={label} disabled={busy} onPress={onPress} style={({ pressed }) => [styles.choice, !radio && styles.concernChoice, selected && styles.chosen, pressed && styles.pressed]}>
      <Text style={[styles.choiceLabel, semibold]}>{label}</Text><Text accessible={false} style={[styles.check, bold]}>{selected ? '✓' : ''}</Text>
    </Pressable>
  );

  const pickCheckInSymptom = (key: string) => {
    setCheckInSymptom(key);
    setMessage('');
  };

  const pickCheckInSeverity = (severity: PreviewSeverity) => {
    if (!checkInSymptom) {
      setMessage('Choose a symptom first, then how strong it feels.');
      return;
    }
    setCheckInSeverity(severity);
    setMessage('');
  };

  const severityChip = (severity: PreviewSeverity, label: string) => (
    <Pressable
      key={severity}
      accessibilityRole="radio"
      accessibilityState={{ checked: checkInSeverity === severity, disabled: busy || !checkInSymptom }}
      accessibilityLabel={`${label} intensity`}
      disabled={busy || !checkInSymptom}
      onPress={() => pickCheckInSeverity(severity)}
      style={({ pressed }) => [
        styles.severityChip,
        checkInSeverity === severity && styles.severityChipActive,
        !checkInSymptom && styles.severityChipDisabled,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.severityChipText, semibold]}>{label}</Text>
    </Pressable>
  );

  const checkInLabel = previewCheckIn?.label
    || (checkInSymptom ? symptoms.find(item => item.key === checkInSymptom)?.label : null);

  const primaryDisabled = busy
    || (draft.step === 0 && (!checkInSymptom || !checkInSeverity))
    || (draft.step === SYMPTOMS_STEP && !draft.symptoms.length)
    || (draft.step === GOAL_STEP && !draft.intent)
    || (draft.step === BUILDING_STEP && !buildingDone);

  const primaryLabel = (() => {
    if (draft.step === 0) return 'Log how today feels';
    if (draft.step >= SHOWCASE_START && draft.step <= SHOWCASE_END) return draft.step === SHOWCASE_END ? 'Personalize my plan' : 'Next';
    if (draft.step === SYMPTOMS_STEP) return 'These matter to me';
    if (draft.step === GOAL_STEP) return 'Continue';
    if (draft.step === SUMMARY_STEP) return 'Build my plan';
    if (draft.step === BUILDING_STEP) return buildingDone ? 'Continue' : 'Preparing…';
    if (draft.step === NOTIFICATIONS_STEP) return 'View subscription plans';
    return 'Continue';
  })();

  const onPrimary = () => {
    if (draft.step === 0) {
      if (!checkInSymptom || !checkInSeverity) return;
      const label = symptoms.find(item => item.key === checkInSymptom)?.label || 'Symptom';
      setPreviewCheckIn({ symptomKey: checkInSymptom, label, severity: checkInSeverity });
      const nextSymptoms = draft.symptoms.includes(checkInSymptom)
        ? draft.symptoms
        : [checkInSymptom, ...draft.symptoms].slice(0, 6);
      change({ step: 1, symptoms: nextSymptoms });
      return;
    }
    if (draft.step === NOTIFICATIONS_STEP) return void finish(completedDraft());
    if (draft.step === BUILDING_STEP) {
      if (!buildingDone) return;
      change({ step: NOTIFICATIONS_STEP });
      return;
    }
    if (draft.step === SUMMARY_STEP) {
      change({ step: BUILDING_STEP });
      return;
    }
    if (draft.step >= SHOWCASE_START && draft.step < SHOWCASE_END) {
      change({ step: draft.step + 1 });
      return;
    }
    if (draft.step === SHOWCASE_END) {
      change({ step: SYMPTOMS_STEP });
      return;
    }
    change({ step: draft.step + 1 });
  };

  if (!fontsReady && !fontError) return <SafeAreaView style={styles.screen}><StatusBar style="dark" /></SafeAreaView>;

  const showcaseIndex = draft.step - SHOWCASE_START;
  const showcaseTitles = [
    previewCheckIn ? 'You just checked in' : 'Tap how today feels',
    'Watch your week take shape',
    'Capture what matters',
    'Track care alongside symptoms',
    'Bring a calm summary to visits',
    'Explore evidence on your terms',
  ];
  const showcaseBodies = [
    previewCheckIn && checkInLabel
      ? `${checkInLabel} · ${severityLabels[previewCheckIn.severity]}. This preview holds it until you subscribe.`
      : 'One tap per symptom — no spreadsheets, no streak guilt.',
    previewCheckIn
      ? 'Today’s check-in shows up on your week view — the same timeline you’ll use in peri.'
      : 'Your check-ins become a gentle timeline you can actually read.',
    'Add context in your own words whenever it helps.',
    'See care changes next to how you feel over time.',
    'Export focused talking points before an appointment.',
    'Plain-language guides when you want deeper context.',
  ];

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View accessible accessibilityLabel="peri" style={styles.brand}>
          <Text style={[styles.wordmark, display]}>peri</Text>
          <View style={styles.brandDot} />
        </View>
        <Text accessibilityLabel={`Step ${draft.step + 1} of ${ONBOARDING_V2_STEP_COUNT}`} style={[styles.progressText, semibold]}>
          {draft.step + 1} / {ONBOARDING_V2_STEP_COUNT}
        </Text>
      </View>
      <View style={styles.progress}>
        <View style={[styles.progressFill, { width: `${((draft.step + 1) / ONBOARDING_V2_STEP_COUNT) * 100}%` }]} />
      </View>
      <ScrollView ref={scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {draft.step > 0 && draft.step !== BUILDING_STEP && (
          <Pressable accessibilityRole="button" disabled={busy} onPress={() => change({ step: draft.step - 1 })} style={styles.back}>
            <Text style={[styles.linkText, semibold]}>Back</Text>
          </Pressable>
        )}
        <Animated.View style={{ opacity: fade }}>
          {draft.step === 0 && (
            <>
              <Text accessibilityRole="header" style={[styles.title, display]}>How is today feeling?</Text>
              <Text style={[styles.body, regular]}>Choose what’s strongest right now, then tap how much it’s affecting you.</Text>
              <Text style={[styles.eyebrow, bold, { marginBottom: 10 }]}>SYMPTOM</Text>
              <View accessibilityRole="radiogroup" accessibilityLabel="Symptom for today" style={styles.gridChoices}>
                {checkInSymptoms.map(item => choice(
                  item.key,
                  item.label,
                  checkInSymptom === item.key,
                  () => pickCheckInSymptom(item.key),
                  true,
                ))}
              </View>
              <Text style={[styles.eyebrow, bold, { marginTop: 18, marginBottom: 10 }]}>HOW STRONG</Text>
              <View accessibilityRole="radiogroup" accessibilityLabel="How strong it feels" style={styles.severityRow}>
                {severityChip('mild', 'Mild')}
                {severityChip('moderate', 'Moderate')}
                {severityChip('strong', 'Strong')}
              </View>
              <Text accessibilityLiveRegion="polite" style={[styles.response, semibold]}>
                {checkInSymptom && checkInSeverity && checkInLabel
                  ? `${checkInLabel} · ${severityLabels[checkInSeverity]} — ready to log.`
                  : checkInSymptom
                    ? `${checkInLabel} — now choose how strong it feels.`
                    : 'Pick one symptom to start your check-in.'}
              </Text>
              <Text style={[styles.small, regular]}>Your health entries stay on this device. A subscription unlocks saving check-ins after setup.</Text>
            </>
          )}
          {draft.step >= SHOWCASE_START && draft.step <= SHOWCASE_END && (
            <>
              <Text accessibilityRole="header" style={[styles.title, display]}>{showcaseTitles[showcaseIndex]}</Text>
              <Text style={[styles.body, regular]}>{showcaseBodies[showcaseIndex]}</Text>
              <OnboardingShowcaseStage
                index={showcaseIndex}
                reduceMotion={reduceMotion}
                semibold={semibold}
                regular={regular}
                bold={bold}
                previewCheckIn={previewCheckIn ? { label: previewCheckIn.label, severity: previewCheckIn.severity } : null}
              />
            </>
          )}
          {draft.step === SYMPTOMS_STEP && (
            <>
              <Text accessibilityRole="header" style={[styles.title, display]}>What has been hardest lately?</Text>
              <Text style={[styles.body, regular]}>Choose 1–3 to start. You can follow up to six and change them later.</Text>
              <View style={styles.gridChoices}>{(showMore ? symptoms : symptoms.slice(0, 6)).map(item => choice(item.key, item.label, draft.symptoms.includes(item.key), () => select(item.key)))}</View>
              <Pressable accessibilityRole="button" accessibilityState={{ expanded: showMore }} disabled={busy} onPress={() => setShowMore(!showMore)} style={styles.back}>
                <Text style={[styles.linkText, semibold]}>{showMore ? 'Show fewer concerns' : 'See all concerns'}</Text>
              </Pressable>
              <Text accessibilityLiveRegion="polite" style={[styles.response, semibold]}>{selectedLabels.length ? `${selectedLabels.join(', ')} — we’ll put these front and center.` : 'Choose what feels relevant to you.'}</Text>
            </>
          )}
          {draft.step === GOAL_STEP && (
            <>
              <Text accessibilityRole="header" style={[styles.title, display]}>What would help you most?</Text>
              <Text style={[styles.body, regular]}>There’s no right answer. Start with what matters to you today.</Text>
              <View accessibilityRole="radiogroup" accessibilityLabel="Your main goal" style={styles.choices}>{goals.map(item => choice(item.key, item.label, draft.intent === item.key, () => change({ intent: item.key }), true))}</View>
              <Text accessibilityLiveRegion="polite" style={[styles.response, semibold]}>{draft.intent ? goal.reply : 'Your choice will shape your starting point.'}</Text>
            </>
          )}
          {draft.step === SUMMARY_STEP && (
            <>
              <Text accessibilityRole="header" style={[styles.title, display]}>Your starting focus</Text>
              <Text style={[styles.body, regular]}>Here’s the check-in we’ll open first — shaped by what you shared.</Text>
              <View style={styles.summaryCard}>
                {selectedLabels.map((label, index) => (
                  <View key={label} style={styles.summaryRow}>
                    <View style={styles.summaryBadge}><Text style={[styles.summaryBadgeText, bold]}>{index + 1}</Text></View>
                    <Text style={[styles.choiceLabel, semibold]}>{label}</Text>
                  </View>
                ))}
              </View>
              <Text accessibilityRole="header" style={[styles.subheading, display]}>{goal.label}</Text>
              <Text style={[styles.body, regular]}>{goal.benefit}</Text>
            </>
          )}
          {draft.step === BUILDING_STEP && (
            <BuildingPlanMoment reduceMotion={reduceMotion} display={display} regular={regular} />
          )}
          {draft.step === NOTIFICATIONS_STEP && (
            <>
              <Text accessibilityRole="header" style={[styles.title, display]}>Gentle reminders, if you want them</Text>
              <Text style={[styles.body, regular]}>These are examples of what peri can send — only after you choose.</Text>
              <SampleReminderCard title="peri check-in" body="Take a moment for your daily check-in." time="8:00 PM" />
              <SampleReminderCard title="peri weekly check-in" body="Take a moment to review your week." time="Mon · 10:00 AM" />
              <Text style={[styles.small, regular]}>You can change times later in Profile. Nothing is scheduled until you turn reminders on.</Text>
            </>
          )}
        </Animated.View>
        {(message || props.issue) && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.error, semibold]}>{message || props.issue}</Text>}
      </ScrollView>
      <View style={styles.footer}>
        {draft.step === SYMPTOMS_STEP && <Text style={[styles.small, regular]}>{draft.symptoms.length} selected</Text>}
        {draft.step === NOTIFICATIONS_STEP ? (
          <>
            <Pressable accessibilityRole="button" disabled={busy} onPress={() => void enableReminders()} style={({ pressed }) => [styles.primary, pressed && styles.pressed, busy && styles.disabled]}>
              {busy ? <ActivityIndicator color={NOTE} /> : <Text style={[styles.primaryText, semibold]}>Turn on reminders</Text>}
            </Pressable>
            <Pressable accessibilityRole="button" disabled={busy} onPress={() => void skipReminders()} style={styles.secondary}>
              <Text style={[styles.linkText, semibold]}>Not now</Text>
            </Pressable>
            <Pressable accessibilityRole="button" disabled={busy} onPress={() => void finish(completedDraft())} style={styles.secondary}>
              <Text style={[styles.linkText, semibold]}>{primaryLabel}</Text>
            </Pressable>
          </>
        ) : (
          <Pressable accessibilityRole="button" accessibilityState={{ disabled: primaryDisabled, busy }} disabled={primaryDisabled} onPress={onPrimary} style={({ pressed }) => [styles.primary, pressed && styles.pressed, primaryDisabled && styles.disabled]}>
            {busy ? <ActivityIndicator color={NOTE} /> : <Text style={[styles.primaryText, semibold]}>{primaryLabel}</Text>}
          </Pressable>
        )}
        {draft.step < SUMMARY_STEP && draft.step !== 0 && (
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => {
              event.current('onboarding_step_skipped', {
                step: draft.step,
                skipTarget: SUMMARY_STEP,
                surface: 'native_preview',
                flowVersion,
              });
              change({ step: SUMMARY_STEP, symptoms: draft.symptoms.length ? draft.symptoms : defaults, intent: draft.intent || 'understand' });
            }}
            style={styles.secondary}
          >
            <Text style={[styles.linkText, semibold]}>Use a starter check-in</Text>
          </Pressable>
        )}
        <View style={styles.links}>
          <Pressable accessibilityRole="button" disabled={busy || !props.restoreReady} onPress={props.onRestore} style={styles.legal}><Text style={[styles.legalText, regular]}>Restore purchases</Text></Pressable>
          <Pressable accessibilityRole="link" onPress={() => void Linking.openURL('https://menlopass.vercel.app/privacy.html')} style={styles.legal}><Text style={[styles.legalText, regular]}>Privacy</Text></Pressable>
          <Pressable accessibilityRole="link" onPress={() => void Linking.openURL('https://menlopass.vercel.app/terms.html')} style={styles.legal}><Text style={[styles.legalText, regular]}>Terms</Text></Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: PAPER },
  header: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  wordmark: { fontSize: 23, lineHeight: 28, letterSpacing: -0.7, color: INK, fontWeight: '800' },
  brandDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: BLUSH, marginTop: 2 },
  progressText: { fontSize: 12, color: INK_2, fontWeight: '600' },
  progress: { height: 4, borderRadius: 2, backgroundColor: LINE, marginHorizontal: 22, overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 2, backgroundColor: ACCENT },
  content: { padding: 22, paddingBottom: 30, width: '100%', maxWidth: 650, alignSelf: 'center' },
  back: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start', paddingRight: 18, marginBottom: 6 },
  welcomeOrb: { position: 'absolute', right: 0, top: -20, width: 140, height: 140, borderRadius: 70, backgroundColor: LAVENDER, opacity: 0.55 },
  title: { fontSize: 34, lineHeight: 38, letterSpacing: -1.2, color: INK, marginBottom: 12, fontWeight: '800' },
  body: { fontSize: 16, lineHeight: 24, color: INK_2, marginBottom: 18 },
  small: { fontSize: 13, lineHeight: 19, color: INK_2, marginTop: 8 },
  trust: { fontSize: 15, lineHeight: 22, color: INK, marginTop: 18, marginBottom: 6, fontWeight: '600' },
  preview: { backgroundColor: LAVENDER_2, borderRadius: 24, paddingVertical: 20, paddingHorizontal: 22, marginTop: 8, marginBottom: 18, borderWidth: 1, borderColor: LINE },
  eyebrow: { fontSize: 10.5, lineHeight: 15, letterSpacing: 1.4, color: ACCENT, marginBottom: 8, fontWeight: '700' },
  previewTitle: { fontSize: 24, lineHeight: 28, letterSpacing: -0.8, color: INK, marginBottom: 10, fontWeight: '800' },
  choices: { gap: 10 },
  gridChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  concernChoice: { width: '48%', minHeight: 62, paddingHorizontal: 14 },
  choice: { minHeight: 62, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 18, borderWidth: 1.5, borderColor: LINE, backgroundColor: NOTE, flexDirection: 'row', alignItems: 'center', gap: 10 },
  chosen: { backgroundColor: LAVENDER_2, borderColor: ACCENT },
  choiceLabel: { fontSize: 15, color: INK, flex: 1, lineHeight: 21, fontWeight: '600' },
  check: { color: INK, fontSize: 18, minWidth: 20, fontWeight: '700' },
  response: { fontSize: 15, lineHeight: 22, color: SAGE, marginTop: 16, fontWeight: '600' },
  subheading: { fontSize: 24, lineHeight: 27, letterSpacing: -0.7, color: INK, marginBottom: 8, fontWeight: '800' },
  summaryCard: { backgroundColor: NOTE, borderRadius: 22, borderWidth: 1, borderColor: LINE, padding: 16, gap: 12, marginBottom: 16 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  summaryBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: BLUSH, alignItems: 'center', justifyContent: 'center' },
  summaryBadgeText: { color: INK, fontSize: 14, fontWeight: '700' },
  buildingWrap: { paddingVertical: 24 },
  buildingTrack: { height: 8, borderRadius: 4, backgroundColor: LINE, marginTop: 20, overflow: 'hidden' },
  buildingFill: { height: 8, borderRadius: 4, backgroundColor: ACCENT },
  reminderCard: { flexDirection: 'row', gap: 12, backgroundColor: NOTE, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: LINE, marginBottom: 12 },
  reminderIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' },
  reminderIconText: { color: NOTE, fontSize: 16, fontWeight: '700' },
  reminderCopy: { flex: 1 },
  reminderTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  reminderTitle: { fontSize: 14, fontWeight: '600', color: INK },
  reminderTime: { fontSize: 12, color: INK_2 },
  reminderBody: { fontSize: 14, lineHeight: 20, color: INK_2 },
  severityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  severityChip: {
    minHeight: 48,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: LINE,
    backgroundColor: NOTE,
  },
  severityChipActive: { backgroundColor: LAVENDER_2, borderColor: ACCENT },
  severityChipDisabled: { opacity: 0.45 },
  severityChipText: { fontSize: 15, color: INK, fontWeight: '600' },
  footer: { paddingHorizontal: 22, paddingTop: 10, paddingBottom: 4, width: '100%', maxWidth: 650, alignSelf: 'center', backgroundColor: PAPER },
  primary: { minHeight: 54, borderRadius: 999, alignItems: 'center', justifyContent: 'center', padding: 14, backgroundColor: INK, marginTop: 6 },
  primaryText: { fontSize: 16, fontWeight: '600', color: NOTE, textAlign: 'center' },
  secondary: { minHeight: 44, alignItems: 'center', justifyContent: 'center', padding: 8 },
  linkText: { fontSize: 14, color: INK, lineHeight: 18, fontWeight: '600' },
  legalText: { fontSize: 13, color: INK_2, lineHeight: 18 },
  links: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 8 },
  legal: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 6 },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.45 },
  error: { color: '#ae493c', fontSize: 15, lineHeight: 22, marginTop: 12 },
});
