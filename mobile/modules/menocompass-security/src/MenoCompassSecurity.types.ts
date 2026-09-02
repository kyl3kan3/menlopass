export type MenoCompassSecurityModuleApi = {
  encryptForDeviceAsync(plaintext: string): Promise<string>;
  decryptForDeviceAsync(payload: string): Promise<string>;
  encryptBackupAsync(plaintext: string, password: string): Promise<string>;
  decryptBackupAsync(payload: string, password: string): Promise<string>;
};
