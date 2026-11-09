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
export const MENO_INSIGHTS_DEEP_LINK = 'menlopass://dossier?source=widget';

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
        containerBackground('#FBFBF9', 'widget'),
        widgetURL('menlopass://checkin?source=widget'),
        accessibilityLabel(
          completedToday
            ? `peri. Today has a page. ${confirmedDays} of the last 7 days on record.`
            : `peri. Today’s page is blank. ${confirmedDays} of the last 7 days on record.`,
        ),
        accessibilityHint('Opens the log sheet on today’s page in peri.'),
      ]}
    >
      <HStack spacing={7} alignment="center">
        <Text modifiers={[font({ textStyle: 'caption', weight: 'semibold' }), foregroundStyle('#5F6066')]}>PERI · TODAY</Text>
        <Spacer />
        <Image systemName={completedToday ? 'checkmark' : 'plus'} color="#D13A16" size={14} />
      </HStack>
      <Spacer />
      <Text
        modifiers={[
          font({ textStyle: isMedium ? 'title2' : 'headline', weight: 'regular', design: 'serif' }),
          foregroundStyle('#0C0C0D'),
          lineLimit(2),
        ]}
      >
        {completedToday ? 'Today has a page.' : 'Today’s page is blank.'}
      </Text>
      {isMedium ? (
        <Text
          modifiers={[
            font({ textStyle: 'subheadline', weight: 'regular' }),
            foregroundStyle('#5F6066'),
            lineLimit(2),
          ]}
        >
          {completedToday ? 'Add a moment, or close the day.' : 'One tap files a moment with the time.'}
        </Text>
      ) : null}
      <ProgressView
        value={confirmedDays / 7}
        modifiers={[
          tint('#0C0C0D'),
          accessibilityLabel('Days on record'),
          accessibilityValue(`${confirmedDays} of 7 days`),
        ]}
      />
      <Text modifiers={[font({ textStyle: 'caption2', weight: 'medium' }), foregroundStyle('#8A8B91')]}>{confirmedDays} of 7 days on record</Text>
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
        containerBackground('#0C0C0D', 'widget'),
        widgetURL('menlopass://dossier?source=widget'),
        accessibilityLabel(
          ready
            ? `peri dossier. Findings are ready to read. ${confirmedDays} of the last 7 days on record.`
            : `peri dossier. ${confirmedDays} of the last 7 days on record.`,
        ),
        accessibilityHint('Opens the dossier in peri.'),
      ]}
    >
      <HStack spacing={7} alignment="center">
        <Text modifiers={[font({ textStyle: 'caption', weight: 'semibold' }), foregroundStyle('#9A9BA1')]}>PERI · DOSSIER</Text>
        <Spacer />
        <Image systemName="arrow.right" color="#D13A16" size={14} />
      </HStack>
      <Spacer />
      <Text
        modifiers={[
          font({ textStyle: isMedium ? 'title2' : 'headline', weight: 'regular', design: 'serif' }),
          foregroundStyle('#F3F2EE'),
          lineLimit(2),
        ]}
      >
        {ready ? 'The findings are ready.' : 'A week makes a finding.'}
      </Text>
      {isMedium ? (
        <Text
          modifiers={[
            font({ textStyle: 'subheadline', weight: 'regular' }),
            foregroundStyle('#9A9BA1'),
            lineLimit(2),
          ]}
        >
          {ready ? 'Patterns, treatments and the brief for the visit.' : 'Four days on record and the dossier starts counting.'}
        </Text>
      ) : null}
      <ProgressView
        value={confirmedDays / 7}
        modifiers={[
          tint('#F3F2EE'),
          accessibilityLabel('Days on record'),
          accessibilityValue(`${confirmedDays} of 7 days`),
        ]}
      />
      <Text modifiers={[font({ textStyle: 'caption2', weight: 'medium' }), foregroundStyle('#9A9BA1')]}>{confirmedDays} of 7 days on record</Text>
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
