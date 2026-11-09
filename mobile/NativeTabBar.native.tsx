/* The three surfaces of the record, as a flat bar in the layout flow: a rule
   on top, three words, the active one in ink with a short vermilion mark.
   No icons, no glass pill. Sitting in the flow (not floating) means the web
   page's own sticky actions never hide behind it. */
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, font } from './theme';

export type MenoCompassPrimaryRoute = 'today' | 'dossier' | 'index';

export const primaryRouteOrder: MenoCompassPrimaryRoute[] = ['today', 'dossier', 'index'];

const labels: Record<MenoCompassPrimaryRoute, { label: string; hint: string }> = {
  today: { label: 'Today', hint: 'Opens today’s page: the finding of the day and the ledger.' },
  dossier: { label: 'Dossier', hint: 'Opens the dossier: findings, treatments, questions and the brief.' },
  index: { label: 'Index', hint: 'Opens the index of chapters and tools.' },
};

type NativeTabBarProps = {
  activeRoute: MenoCompassPrimaryRoute;
  onSelect: (route: MenoCompassPrimaryRoute) => void;
  night?: boolean;
};

export function NativeTabBar({ activeRoute, onSelect, night = false }: NativeTabBarProps) {
  const insets = useSafeAreaInsets();
  if (Platform.OS !== 'ios') return null;
  const palette = night
    ? { bg: color.night, rule: color.nightRule, ink: color.nightInk, grey: color.nightGrey }
    : { bg: color.paper, rule: color.ink, ink: color.ink, grey: color.grey2 };
  return (
    <View
      accessibilityRole="tablist"
      style={[styles.bar, { backgroundColor: palette.bg, borderTopColor: palette.rule, paddingBottom: Math.max(insets.bottom, 10) }]}
    >
      {primaryRouteOrder.map(route => {
        const selected = activeRoute === route;
        return (
          <Pressable
            accessibilityHint={labels[route].hint}
            accessibilityLabel={labels[route].label}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            hitSlop={6}
            key={route}
            onPress={() => onSelect(route)}
            style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
          >
            <View style={[styles.mark, selected && styles.markOn]} />
            <Text style={[styles.label, { color: selected ? palette.ink : palette.grey }, selected && styles.labelOn]}>
              {labels[route].label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderTopWidth: 1.5,
    paddingTop: 2,
    paddingHorizontal: 10,
  },
  tab: {
    flex: 1,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 6,
    gap: 6,
  },
  pressed: { opacity: 0.6 },
  mark: { width: 18, height: 3, borderRadius: 1.5, backgroundColor: 'transparent' },
  markOn: { backgroundColor: color.vermilion },
  label: { fontFamily: font.sansMedium, fontSize: 13, lineHeight: 16, letterSpacing: 0.2 },
  labelOn: { fontFamily: font.sansSemi },
});
