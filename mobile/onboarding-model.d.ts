export interface OnboardingDraft { step: number; symptoms: string[]; intent: string }
export const version: number;
export const versionV2Flow: number;
export const symptoms: { key: string; label: string }[];
export const goals: { key: string; label: string; reply: string; benefit: string }[];
export const defaults: string[];
export function normalizeDraft(value: unknown, flowVersion?: number): OnboardingDraft;
export function draftFromProfile(profile: Record<string, unknown>): OnboardingDraft;
export function goalFor(intent: string): typeof goals[number];
export function labelsFor(selected: string[]): string[];
export function profilePatch(value: OnboardingDraft, complete?: boolean, skipped?: boolean, flowVersion?: number): Record<string, unknown>;
export function parseState(serialized: string | null): { v: number; profile: Record<string, unknown>; entries: Record<string, unknown> };
export function writeDraft(serialized: string | null, draft: OnboardingDraft, complete?: boolean, skipped?: boolean, flowVersion?: number): string;
export function needsPreview(serialized: string | null): boolean;
