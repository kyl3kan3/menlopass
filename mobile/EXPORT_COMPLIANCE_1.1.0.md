# Encryption export-compliance inventory — MenoCompass 1.1.0

Use this factual inventory when the Account Holder, Admin, or App Manager completes Apple’s export-compliance questionnaire for the exact production build. It is not a legal classification.

## Encryption used by the binary

- Apple CryptoKit `AES.GCM` encrypts and authenticates the device-local MenoCompass record and password-protected portable backups.
- Apple CryptoKit `HMAC<SHA256>` is used in a standard PBKDF2 construction (210,000 iterations, random 16-byte salt) to derive each portable-backup key.
- Apple Security framework Keychain APIs store the random device-only state key with `kSecAttrAccessibleWhenUnlockedThisDeviceOnly`.
- Apple platform networking and linked SDKs use HTTPS/TLS.
- MenoCompass does not implement a proprietary or unpublished cipher, messaging protocol, VPN, or end-to-end communications service.

## Submission handling

`ITSAppUsesNonExemptEncryption` is intentionally not hard-coded for this release. Complete Apple’s current questionnaire after build processing, retain the resulting determination or documentation with the release evidence, and only then select the build for review. If Apple provides an export-compliance code, add it to the next binary as directed.
