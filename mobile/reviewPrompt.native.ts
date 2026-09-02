import { File, Paths } from 'expo-file-system';
import * as StoreReview from 'expo-store-review';

export const appReviewMilestones = [2, 5, 20] as const;

type AppReviewMilestone = (typeof appReviewMilestones)[number];

type AppReviewState = {
  version: 2;
  successfulMomentCount: number;
  requestedAtMilestones: AppReviewMilestone[];
};

export type AppReviewProgress = {
  successfulMomentCount: number;
  dueMilestone: AppReviewMilestone | null;
};

const reviewStateFile = new File(Paths.document, 'menocompass-review-state.json');

function emptyReviewState(): AppReviewState {
  return { version: 2, successfulMomentCount: 0, requestedAtMilestones: [] };
}

function parseReviewState(serialized: string): AppReviewState {
  try {
    const parsed = JSON.parse(serialized);
    if (!parsed || typeof parsed !== 'object') {
      return emptyReviewState();
    }

    if (parsed.version === 1) {
      const requestedAtMilestones = Array.isArray(parsed.requestedAtLaunches)
        ? appReviewMilestones.filter(milestone => parsed.requestedAtLaunches.includes(milestone))
        : [];
      return { version: 2, successfulMomentCount: 0, requestedAtMilestones };
    }

    if (parsed.version !== 2 || !Number.isInteger(parsed.successfulMomentCount)) {
      return emptyReviewState();
    }

    const requestedAtMilestones = Array.isArray(parsed.requestedAtMilestones)
      ? appReviewMilestones.filter(milestone => parsed.requestedAtMilestones.includes(milestone))
      : [];

    return {
      version: 2,
      successfulMomentCount: Math.max(
        0,
        Math.min(parsed.successfulMomentCount, Number.MAX_SAFE_INTEGER - 1),
      ),
      requestedAtMilestones,
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
    milestone =>
      state.successfulMomentCount >= milestone
      && !state.requestedAtMilestones.includes(milestone),
  ) || null;
}

export async function registerSuccessfulMoment(): Promise<AppReviewProgress> {
  const state = readReviewState();
  state.successfulMomentCount += 1;
  writeReviewState(state);
  return {
    successfulMomentCount: state.successfulMomentCount,
    dueMilestone: dueMilestone(state),
  };
}

export async function requestReviewForMilestone(milestone: AppReviewMilestone) {
  const state = readReviewState();
  if (
    !appReviewMilestones.includes(milestone)
    || state.successfulMomentCount < milestone
    || state.requestedAtMilestones.includes(milestone)
  ) return false;

  if (!(await StoreReview.isAvailableAsync())) return false;

  await StoreReview.requestReview();
  state.requestedAtMilestones.push(milestone);
  writeReviewState(state);
  return true;
}
