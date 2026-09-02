import type { MenoCompassWidgetProps } from './menocompass-widgets';

type StoredEntry = {
  confirmed?: unknown;
};

type StoredState = {
  entries?: Record<string, StoredEntry>;
};

function localIsoDay(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addLocalDays(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

function safeEntries(serializedState: string | null): Record<string, StoredEntry> {
  if (!serializedState) return {};
  try {
    const parsed = JSON.parse(serializedState) as StoredState;
    if (!parsed?.entries || typeof parsed.entries !== 'object' || Array.isArray(parsed.entries)) {
      return {};
    }
    return parsed.entries;
  } catch {
    return {};
  }
}

export function widgetProgressForDate(
  serializedState: string | null,
  date: Date = new Date(),
): MenoCompassWidgetProps {
  const entries = safeEntries(serializedState);
  const confirmedDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  let confirmedDays = 0;

  for (let offset = 0; offset < 7; offset += 1) {
    if (entries[localIsoDay(addLocalDays(confirmedDay, -offset))]?.confirmed === true) {
      confirmedDays += 1;
    }
  }

  return {
    completedToday: entries[localIsoDay(confirmedDay)]?.confirmed === true,
    confirmedDays,
  };
}
