import { NativeModule, requireOptionalNativeModule } from 'expo';

declare class MenoCompassSecurityModule extends NativeModule<{}> {
  encryptForDeviceAsync(plaintext: string): Promise<string>;
  decryptForDeviceAsync(payload: string): Promise<string>;
  encryptBackupAsync(plaintext: string, password: string): Promise<string>;
  decryptBackupAsync(payload: string, password: string): Promise<string>;
  usesSandboxAppStoreReceiptAsync(): Promise<boolean>;
}

export default requireOptionalNativeModule<MenoCompassSecurityModule>('MenoCompassSecurity');
