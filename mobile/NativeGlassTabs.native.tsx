import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from 'expo-glass-effect';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type MenoCompassPrimaryRoute = 'today' | 'journey' | 'care' | 'guide';

type NativeGlassTabsProps = {
  activeRoute: MenoCompassPrimaryRoute;
  onSelect: (route: MenoCompassPrimaryRoute) => void;
};

type TabDefinition = {
  route: MenoCompassPrimaryRoute;
  label: string;
  icon: SFSymbol;
  selectedIcon: SFSymbol;
};

const tabs: TabDefinition[] = [
  { route: 'today', label: 'Today', icon: 'sun.max', selectedIcon: 'sun.max.fill' },
  {
    route: 'journey',
    label: 'Journey',
    icon: 'chart.line.uptrend.xyaxis',
    selectedIcon: 'chart.line.uptrend.xyaxis',
  },
  { route: 'care', label: 'Care', icon: 'cross.case', selectedIcon: 'cross.case.fill' },
  { route: 'guide', label: 'Guide', icon: 'book.closed', selectedIcon: 'book.closed.fill' },
];

function TabItems({ activeRoute, onSelect }: NativeGlassTabsProps) {
  return (
    <View accessibilityRole="tablist" style={styles.row}>
      {tabs.map(tab => {
        const selected = activeRoute === tab.route;
        return (
          <Pressable
            accessibilityHint={`Opens the ${tab.label} section.`}
            accessibilityLabel={tab.label}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            hitSlop={4}
            key={tab.route}
            onPress={() => onSelect(tab.route)}
            style={({ pressed }) => [
              styles.tab,
              selected && styles.selectedTab,
              pressed && styles.pressedTab,
            ]}
          >
            <SymbolView
              name={selected ? tab.selectedIcon : tab.icon}
              size={21}
              tintColor={selected ? '#FFB44D' : '#A6B7B5'}
              weight={selected ? 'semibold' : 'regular'}
            />
            <Text style={[styles.label, selected && styles.selectedLabel]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function NativeGlassTabs({ activeRoute, onSelect }: NativeGlassTabsProps) {
  const insets = useSafeAreaInsets();
  const [reduceTransparency, setReduceTransparency] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    let active = true;
    void AccessibilityInfo.isReduceTransparencyEnabled().then(enabled => {
      if (active) setReduceTransparency(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener(
      'reduceTransparencyChanged',
      setReduceTransparency,
    );
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  if (Platform.OS !== 'ios') return null;

  const glassAvailable = !reduceTransparency
    && isLiquidGlassAvailable()
    && isGlassEffectAPIAvailable();
  const positionStyle = { bottom: Math.max(insets.bottom, 10) };

  return (
    <View pointerEvents="box-none" style={[styles.positioner, positionStyle]}>
      {glassAvailable ? (
        <GlassView
          colorScheme="dark"
          glassEffectStyle="regular"
          isInteractive
          style={styles.surface}
          tintColor="#17363A"
        >
          <TabItems activeRoute={activeRoute} onSelect={onSelect} />
        </GlassView>
      ) : (
        <View style={[styles.surface, styles.fallbackSurface]}>
          <TabItems activeRoute={activeRoute} onSelect={onSelect} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  positioner: {
    position: 'absolute',
    right: 0,
    left: 0,
    zIndex: 100,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  surface: {
    width: '100%',
    maxWidth: 440,
    height: 70,
    overflow: 'hidden',
    borderRadius: 35,
  },
  fallbackSurface: {
    backgroundColor: '#102124',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#3D5558',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.34,
    shadowRadius: 20,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  tab: {
    flex: 1,
    minWidth: 58,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    borderRadius: 28,
  },
  selectedTab: {
    backgroundColor: 'rgba(255, 180, 77, 0.14)',
  },
  pressedTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
  },
  label: {
    color: '#A6B7B5',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '600',
  },
  selectedLabel: {
    color: '#FFB44D',
    fontWeight: '800',
  },
});
