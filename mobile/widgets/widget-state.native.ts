import { Platform } from 'react-native';

import {
  MenoCompassCheckInWidget,
  MenoCompassInsightsWidget,
} from './menocompass-widgets';
import { widgetProgressForDate } from './widget-progress';

const scheduledDays = 8;
let lastWidgetSyncKey = '';

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addLocalDays(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

/**
 * Publishes only check-in completion and a 0-7 coverage count. Symptom names,
 * severity, notes, treatments, medications, and identifying profile data never
 * leave the app for the shared widget container.
 */
export function syncMenoCompassWidgets(
  serializedState: string | null,
  now: Date = new Date(),
) {
  if (Platform.OS !== 'ios') return;

  const today = startOfLocalDay(now);
  const timeline = Array.from({ length: scheduledDays }, (_, offset) => {
    const date = offset === 0 ? now : addLocalDays(today, offset);
    return {
      date,
      props: widgetProgressForDate(serializedState, date),
    };
  });
  const syncKey = JSON.stringify([
    today.getTime(),
    ...timeline.map(({ props }) => [props.completedToday, props.confirmedDays]),
  ]);
  if (syncKey === lastWidgetSyncKey) return;

  MenoCompassCheckInWidget.updateTimeline(timeline);
  MenoCompassInsightsWidget.updateTimeline(timeline);
  lastWidgetSyncKey = syncKey;
}
