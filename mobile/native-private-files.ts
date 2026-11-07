import { Directory, File, Paths } from 'expo-file-system';

const exportsDirectory = new Directory(Paths.cache, 'peri-private-exports');
const recoveryDirectory = new Directory(Paths.document, 'peri-record-recovery');
const legacyExportName = /^(?:meno-compass-(?:backup-|report-)?\d{4}-\d{2}-\d{2}\.(?:json|csv|pdf|menocompass)|appointment-\d{4}-\d{2}-\d{2}\.ics|meno-compass-export\.(?:json|csv|ics))$/;

/** Keep share files until the OS share operation settles, including cancellation. */
export async function withPrivateExport<T>(name: string, share: (file: File) => Promise<T>): Promise<T> {
  exportsDirectory.create({ intermediates: true, idempotent: true });
  const file = new File(exportsDirectory, name);
  try {
    return await share(file);
  } finally {
    if (file.exists) file.delete();
  }
}

/** Fixed app-owned paths only; never remove a user's chosen destination. */
export function clearPrivateExportFiles() {
  if (exportsDirectory.exists) exportsDirectory.delete();
  const printDirectory = new Directory(Paths.cache, 'Print');
  if (printDirectory.exists) printDirectory.delete();
  if (Paths.cache.exists) {
    for (const item of Paths.cache.list()) {
      if (item instanceof File && legacyExportName.test(item.name)) item.delete();
    }
  }
}

/** Copy before replacement. A failed copy leaves the original record untouched. */
export async function preserveUnreadableRecord(files: File[]) {
  const existing = files.filter(file => file.exists);
  if (!existing.length) return;
  recoveryDirectory.create({ intermediates: true, idempotent: true });
  const attempt = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  for (const file of existing) {
    await file.copy(new File(recoveryDirectory, `${attempt}-${file.name}`));
  }
}

/** Called only after the user confirms deletion of their private record. */
export function clearRecoveryRecords() {
  if (recoveryDirectory.exists) recoveryDirectory.delete();
}

export function deleteUnreadableRecord(files: File[]) {
  for (const file of files) if (file.exists) file.delete();
  clearRecoveryRecords();
}
