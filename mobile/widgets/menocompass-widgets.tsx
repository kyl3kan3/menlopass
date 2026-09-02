import { HStack, Image, ProgressView, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  accessibilityHint,
  accessibilityLabel,
  accessibilityValue,
  containerBackground,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  tint,
  widgetURL,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

export const MENO_CHECK_IN_WIDGET_NAME = 'MenoCompassCheckIn';
export const MENO_INSIGHTS_WIDGET_NAME = 'MenoCompassInsights';
export const MENO_CHECK_IN_DEEP_LINK = 'menlopass://checkin?source=widget';
export const MENO_INSIGHTS_DEEP_LINK = 'menlopass://insights?source=widget';

export type MenoCompassWidgetProps = {
  completedToday: boolean;
  confirmedDays: number;
};

const MenoCompassCheckInWidgetView = (
  props: MenoCompassWidgetProps,
  environment: WidgetEnvironment,
) => {
  'widget';

  const completedToday = props.completedToday === true;
  const confirmedDays = Math.max(0, Math.min(7, Number(props.confirmedDays) || 0));
  const isMedium = environment.widgetFamily === 'systemMedium';

  return (
    <VStack
      alignment="leading"
      spacing={isMedium ? 10 : 7}
      modifiers={[
        frame({ maxWidth: 1000, maxHeight: 1000, alignment: 'topLeading' }),
        containerBackground('#0E1618', 'widget'),
        widgetURL('menlopass://checkin?source=widget'),
        accessibilityLabel(
          completedToday
            ? `MenoCompass daily check-in complete. ${confirmedDays} of the last 7 days logged.`
            : `MenoCompass daily check-in ready. ${confirmedDays} of the last 7 days logged.`,
        ),
        accessibilityHint('Opens the private daily check-in in MenoCompass.'),
      ]}
    >
      <HStack spacing={7} alignment="center">
        <Image
          systemName={completedToday ? 'checkmark.circle.fill' : 'sparkles'}
          color="#E8A552"
          size={18}
        />
        <Text modifiers={[font({ textStyle: 'caption', weight: 'bold' }), foregroundStyle('#E8A552')]}>MENOCOMPASS</Text>
      </HStack>
      <Spacer />
      <Text
        modifiers={[
          font({ textStyle: isMedium ? 'title2' : 'headline', weight: 'bold' }),
          foregroundStyle('#F4F7F6'),
          lineLimit(2),
        ]}
      >
        {completedToday ? 'Check-in complete' : 'How are you today?'}
      </Text>
      {isMedium ? (
        <Text
          modifiers={[
            font({ textStyle: 'subheadline', weight: 'medium' }),
            foregroundStyle('#B8C8C5'),
            lineLimit(2),
          ]}
        >
          {completedToday ? 'Your private record is up to date.' : 'Open a quick, private daily check-in.'}
        </Text>
      ) : null}
      <ProgressView
        value={confirmedDays / 7}
        modifiers={[
          tint('#E8A552'),
          accessibilityLabel('Confirmed-day progress'),
          accessibilityValue(`${confirmedDays} of 7 days`),
        ]}
      />
      <Text modifiers={[font({ textStyle: 'caption2', weight: 'medium' }), foregroundStyle('#93A8A8')]}>{confirmedDays}/7 recent days logged</Text>
    </VStack>
  );
};

const MenoCompassInsightsWidgetView = (
  props: MenoCompassWidgetProps,
  environment: WidgetEnvironment,
) => {
  'widget';

  const confirmedDays = Math.max(0, Math.min(7, Number(props.confirmedDays) || 0));
  const ready = confirmedDays >= 4;
  const isMedium = environment.widgetFamily === 'systemMedium';

  return (
    <VStack
      alignment="leading"
      spacing={isMedium ? 10 : 7}
      modifiers={[
        frame({ maxWidth: 1000, maxHeight: 1000, alignment: 'topLeading' }),
        containerBackground('#132426', 'widget'),
        widgetURL('menlopass://insights?source=widget'),
        accessibilityLabel(
          ready
            ? `MenoCompass patterns are ready to review. ${confirmedDays} of the last 7 days logged.`
            : `MenoCompass pattern progress. ${confirmedDays} of the last 7 days logged.`,
        ),
        accessibilityHint('Opens private pattern insights in MenoCompass.'),
      ]}
    >
      <HStack spacing={7} alignment="center">
        <Image systemName="chart.xyaxis.line" color="#7FC6B7" size={18} />
        <Text modifiers={[font({ textStyle: 'caption', weight: 'bold' }), foregroundStyle('#7FC6B7')]}>YOUR PATTERNS</Text>
      </HStack>
      <Spacer />
      <Text
        modifiers={[
          font({ textStyle: isMedium ? 'title2' : 'headline', weight: 'bold' }),
          foregroundStyle('#F4F7F6'),
          lineLimit(2),
        ]}
      >
        {ready ? 'See what is changing' : 'Keep building your picture'}
      </Text>
      {isMedium ? (
        <Text
          modifiers={[
            font({ textStyle: 'subheadline', weight: 'medium' }),
            foregroundStyle('#B8C8C5'),
            lineLimit(2),
          ]}
        >
          {ready ? 'Review your latest private seven-day patterns.' : 'A few consistent check-ins make patterns clearer.'}
        </Text>
      ) : null}
      <ProgressView
        value={confirmedDays / 7}
        modifiers={[
          tint('#7FC6B7'),
          accessibilityLabel('Pattern coverage'),
          accessibilityValue(`${confirmedDays} of 7 days`),
        ]}
      />
      <Text modifiers={[font({ textStyle: 'caption2', weight: 'medium' }), foregroundStyle('#93A8A8')]}>{confirmedDays}/7 recent days logged</Text>
    </VStack>
  );
};

export const MenoCompassCheckInWidget = createWidget<MenoCompassWidgetProps>(
  MENO_CHECK_IN_WIDGET_NAME,
  MenoCompassCheckInWidgetView,
);

export const MenoCompassInsightsWidget = createWidget<MenoCompassWidgetProps>(
  MENO_INSIGHTS_WIDGET_NAME,
  MenoCompassInsightsWidgetView,
);
