import { File, Paths } from 'expo-file-system';
import * as StoreReview from 'expo-store-review';

export const appReviewMilestones = [2, 5, 20] as const;

type AppReviewMilestone = (typeof appReviewMilestones)[number];

type AppReviewState = {
  version: 1;
  launchCount: number;
  requestedAtLaunches: AppReviewMilestone[];
};

export type AppOpeningReviewState = {
  launchCount: number;
  dueMilestone: AppReviewMilestone | null;
};

const reviewStateFile = new File(Paths.document, 'menocompass-review-state.json');

function emptyReviewState(): AppReviewState {
  return { version: 1, launchCount: 0, requestedAtLaunches: [] };
}

function parseReviewState(serialized: string): AppReviewState {
  try {
    const parsed = JSON.parse(serialized);
    if (!parsed || parsed.version !== 1 || !Number.isInteger(parsed.launchCount)) {
      return emptyReviewState();
    }

    const requestedAtLaunches = Array.isArray(parsed.requestedAtLaunches)
      ? appReviewMilestones.filter(milestone => parsed.requestedAtLaunches.includes(milestone))
      : [];

    return {
      version: 1,
      launchCount: Math.max(0, Math.min(parsed.launchCount, Number.MAX_SAFE_INTEGER - 1)),
      requestedAtLaunches,
    };
  } catch {
    return emptyReviewState();
  }
}

function readReviewState() {
  if (!reviewStateFile.exists) return emptyReviewState();
  return parseReviewState(reviewStateFile.textSync());
}

function writeReviewState(state: AppReviewState) {
  if (!reviewStateFile.exists) reviewStateFile.create({ intermediates: true });
  reviewStateFile.write(JSON.stringify(state));
}

function dueMilestone(state: AppReviewState) {
  return appReviewMilestones.find(
    milestone => state.launchCount >= milestone && !state.requestedAtLaunches.includes(milestone),
  ) || null;
}

export async function registerAppOpening(): Promise<AppOpeningReviewState> {
  const state = readReviewState();
  state.launchCount += 1;
  writeReviewState(state);
  return { launchCount: state.launchCount, dueMilestone: dueMilestone(state) };
}

export async function requestReviewForMilestone(milestone: AppReviewMilestone) {
  const state = readReviewState();
  if (
    !appReviewMilestones.includes(milestone)
    || state.launchCount < milestone
    || state.requestedAtLaunches.includes(milestone)
  ) return false;

  if (!(await StoreReview.isAvailableAsync())) return false;

  await StoreReview.requestReview();
  state.requestedAtLaunches.push(milestone);
  writeReviewState(state);
  return true;
}
