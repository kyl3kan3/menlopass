// One network request at a time; foreground transitions from system dialogs
// should not repeatedly contact the update service.
export function createUpdateChecker(api: {
  check: () => Promise<{ isAvailable: boolean; isRollBackToEmbedded?: boolean }>;
  download: () => Promise<unknown>;
}, now = Date.now) {
  let busy = false;
  let lastAttempt: number | undefined;
  return async () => {
    if (busy || (lastAttempt !== undefined && now() - lastAttempt < 60_000)) return;
    busy = true;
    lastAttempt = now();
    try {
      const result = await api.check();
      if (result.isAvailable || result.isRollBackToEmbedded) await api.download();
    } finally {
      busy = false;
    }
  };
}
