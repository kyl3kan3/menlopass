export const events: readonly string[];
export const uuid: RegExp;
export function project(event: string, input?: Record<string, unknown>, productIds?: string[]): Record<string, string | number | boolean> | null;
