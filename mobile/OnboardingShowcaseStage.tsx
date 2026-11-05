import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

type Props = {
  index: number;
  reduceMotion: boolean;
  semibold: { fontFamily: string; fontWeight: 'normal' } | null;
  regular: { fontFamily: string; fontWeight: 'normal' } | null;
  bold: { fontFamily: string; fontWeight: 'normal' } | null;
  previewCheckIn?: { label: string; severity: 'mild' | 'moderate' | 'strong' } | null;
};

const severityChipIndex = (severity: 'mild' | 'moderate' | 'strong') => (
  severity === 'mild' ? 0 : severity === 'moderate' ? 1 : 2
);

const weekBarHeight = (severity: 'mild' | 'moderate' | 'strong') => (
  severity === 'mild' ? 0.42 : severity === 'moderate' ? 0.68 : 0.88
);

export function OnboardingShowcaseStage({
  index,
  reduceMotion,
  semibold,
  regular,
  bold,
  previewCheckIn = null,
}: Props) {
  const progress = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) {
      progress.setValue(1);
      return;
    }
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [index, reduceMotion, progress]);

  const barWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['8%', '100%'] });
  const fadeIn = progress.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0, 0.4, 1] });
  const slideUp = progress.interpolate({ inputRange: [0, 1], outputRange: [18, 0] });

  const phone = (
    <View style={styles.phone}>
      <View style={styles.phoneNotch} />
      <Animated.View style={[styles.phoneBody, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
        {index === 0 && (
          <>
            <Text style={[styles.mockLabel, semibold]}>{previewCheckIn ? 'Logged' : 'Today'}</Text>
            {previewCheckIn ? (
              <>
                <Text style={[styles.mockHint, regular, { marginTop: 0, marginBottom: 12 }]}>{previewCheckIn.label}</Text>
                <View style={styles.chipRow}>
                  {['Mild', 'Moderate', 'Strong'].map((label, chipIndex) => (
                    <View
                      key={label}
                      style={[
                        styles.chip,
                        chipIndex === severityChipIndex(previewCheckIn.severity) && styles.chipActive,
                      ]}
                    >
                      <Text style={[styles.chipText, semibold]}>{label}</Text>
                    </View>
                  ))}
                </View>
                <Text style={[styles.mockHint, regular]}>Saved for today’s preview</Text>
              </>
            ) : (
              <>
                <View style={styles.chipRow}>
                  {['Mild', 'Moderate', 'Strong'].map((label, chipIndex) => (
                    <Animated.View
                      key={label}
                      style={[
                        styles.chip,
                        chipIndex === 1 && styles.chipActive,
                        {
                          opacity: progress.interpolate({
                            inputRange: [0, 0.2 + chipIndex * 0.15, 0.45 + chipIndex * 0.15],
                            outputRange: [0.3, 0.3, 1],
                            extrapolate: 'clamp',
                          }),
                        },
                      ]}
                    >
                      <Text style={[styles.chipText, semibold]}>{label}</Text>
                    </Animated.View>
                  ))}
                </View>
                <Text style={[styles.mockHint, regular]}>Hot flashes · tap to log</Text>
              </>
            )}
          </>
        )}
        {index === 1 && (
          <>
            <Text style={[styles.mockLabel, semibold]}>Your week</Text>
            <View style={styles.barChart}>
              {[0.35, 0.55, 0.4, 0.7, 0.5, 0.65, previewCheckIn ? weekBarHeight(previewCheckIn.severity) : 0.45].map((height, barIndex) => (
                <Animated.View
                  key={barIndex}
                  style={[
                    styles.bar,
                    previewCheckIn && barIndex === 6 && styles.barToday,
                    {
                      height: `${Math.round(height * 100)}%`,
                      opacity: progress.interpolate({
                        inputRange: [0, 0.15 + barIndex * 0.08, 0.35 + barIndex * 0.08],
                        outputRange: [0.2, 0.2, 1],
                        extrapolate: 'clamp',
                      }),
                    },
                  ]}
                />
              ))}
            </View>
          </>
        )}
        {index === 2 && (
          <>
            <Text style={[styles.mockLabel, semibold]}>Notes</Text>
            <View style={styles.noteField}>
              <Animated.Text style={[styles.noteText, regular, { opacity: fadeIn }]}>
                Woke up twice — kept the window cracked.
              </Animated.Text>
              <Animated.View style={[styles.cursor, { opacity: progress.interpolate({ inputRange: [0.5, 0.55, 0.6, 0.65], outputRange: [0, 1, 0, 1] }) }]} />
            </View>
          </>
        )}
        {index === 3 && (
          <>
            <Text style={[styles.mockLabel, semibold]}>Care</Text>
            <View style={styles.careRow}>
              <View style={styles.pill}><Text style={[styles.pillText, bold]}>HRT patch</Text></View>
              <Animated.View style={[styles.symptomTag, { opacity: fadeIn }]}>
                <Text style={[styles.symptomTagText, semibold]}>Sleep · improving</Text>
              </Animated.View>
            </View>
          </>
        )}
        {index === 4 && (
          <>
            <Text style={[styles.mockLabel, semibold]}>Visit summary</Text>
            {['Sleep disruption', 'Night sweats', 'Questions for clinician'].map((line, lineIndex) => (
              <Animated.View
                key={line}
                style={[
                  styles.reportLine,
                  {
                    opacity: progress.interpolate({
                      inputRange: [0, 0.25 + lineIndex * 0.2, 0.45 + lineIndex * 0.2],
                      outputRange: [0, 0, 1],
                      extrapolate: 'clamp',
                    }),
                  },
                ]}
              >
                <Text style={[styles.reportText, regular]}>{line}</Text>
              </Animated.View>
            ))}
          </>
        )}
        {index === 5 && (
          <>
            <Text style={[styles.mockLabel, semibold]}>Guide</Text>
            <Animated.View style={[styles.guideCard, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
              <Text style={[styles.guideEyebrow, bold]}>EVIDENCE</Text>
              <Text style={[styles.guideTitle, semibold]}>Sleep &amp; temperature</Text>
              <Text style={[styles.guideBody, regular]}>Plain-language summaries when you want them.</Text>
            </Animated.View>
          </>
        )}
      </Animated.View>
      <Animated.View style={[styles.actionPulse, { width: barWidth }]} />
    </View>
  );

  return (
    <View
      accessible
      accessibilityLabel={`Demonstration ${index + 1} of 6. ${[
        'Rate how today feels with a single tap.',
        'Your check-ins become a gentle week view.',
        'Add context in your own words.',
        'See treatment changes next to symptoms.',
        'Export a focused summary for appointments.',
        'Browse trusted guidance on your terms.',
      ][index]}`}
      style={styles.wrap}
    >
      {phone}
    </View>
  );
}

const INK = '#3d2f4a';
const LAVENDER = '#ddd0eb';
const LAVENDER_2 = '#ece4f3';
const BLUSH = '#e8c4c0';
const ACCENT = '#8b6fa8';
const NOTE = '#fffcff';
const LINE = '#e2d8ea';

const styles = StyleSheet.create({
  wrap: { marginBottom: 8, alignItems: 'center' },
  phone: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 28,
    backgroundColor: LAVENDER_2,
    borderWidth: 1.5,
    borderColor: LINE,
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 16,
    overflow: 'hidden',
  },
  phoneNotch: { alignSelf: 'center', width: 64, height: 5, borderRadius: 3, backgroundColor: LINE, marginBottom: 12 },
  phoneBody: { minHeight: 168, justifyContent: 'flex-start' },
  actionPulse: { height: 4, borderRadius: 2, backgroundColor: ACCENT, marginTop: 14, alignSelf: 'flex-start' },
  mockLabel: { fontSize: 13, letterSpacing: 0.6, color: ACCENT, marginBottom: 12, fontWeight: '600', textTransform: 'uppercase' },
  mockHint: { marginTop: 14, fontSize: 14, color: INK, opacity: 0.75 },
  chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 999, backgroundColor: NOTE, borderWidth: 1, borderColor: LINE },
  chipActive: { backgroundColor: BLUSH, borderColor: ACCENT },
  chipText: { fontSize: 14, color: INK, fontWeight: '600' },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 100 },
  bar: { flex: 1, borderRadius: 6, backgroundColor: BLUSH, minHeight: 8 },
  barToday: { backgroundColor: ACCENT },
  noteField: {
    backgroundColor: NOTE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: LINE,
    padding: 14,
    minHeight: 88,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
  },
  noteText: { fontSize: 15, lineHeight: 22, color: INK, flex: 1 },
  cursor: { width: 2, height: 18, backgroundColor: ACCENT, marginLeft: 2, marginBottom: 2 },
  careRow: { gap: 10 },
  pill: { alignSelf: 'flex-start', backgroundColor: NOTE, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14, borderWidth: 1, borderColor: LINE },
  pillText: { fontSize: 14, color: INK, fontWeight: '700' },
  symptomTag: { marginTop: 4, backgroundColor: LAVENDER, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 14 },
  symptomTagText: { fontSize: 14, color: INK, fontWeight: '600' },
  reportLine: { borderBottomWidth: 1, borderColor: LINE, paddingVertical: 10 },
  reportText: { fontSize: 15, color: INK },
  guideCard: { backgroundColor: NOTE, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: LINE },
  guideEyebrow: { fontSize: 10, letterSpacing: 1.2, color: ACCENT, marginBottom: 6, fontWeight: '700' },
  guideTitle: { fontSize: 17, color: INK, marginBottom: 6, fontWeight: '600' },
  guideBody: { fontSize: 14, lineHeight: 20, color: INK, opacity: 0.8 },
});
