# Optional Neon cloud backup evaluation

Evaluated September 17, 2026. Scope: architecture and vendor fit; no services provisioned or application behavior changed.

## Decision

Neon Object Storage is a plausible home for optional encrypted backups. Do not select Managed Better Auth for the native app until its session and redirect flow has been demonstrated on a real device. The current roadmap documents web frameworks, omits Expo/React Native, and describes standalone frontend/backend deployments as unsupported. This is an integration uncertainty, not proof that every native integration is impossible.

Keep the existing offline journal, Vercel endpoints, and analytics architecture. Functions and AI Gateway are unnecessary for this feature. Use an authenticated backend for backup authorization, with storage credentials held only on the server.

## Existing implementation

- `mobile/App.native.tsx`: `shareEncryptedBackup` validates/canonicalizes the record and encrypts before sharing. `chooseAndDecryptBackup` bounds input size, decrypts, and validates the result.
- `mobile/modules/menocompass-security/ios/MenoCompassSecurityModule.swift`: portable `MCBACKUP1` format uses AES-GCM, a random 16-byte salt, and PBKDF2-HMAC-SHA256 with 210,000 iterations. This is a source inspection, not an independent cryptographic audit.
- The local `MCSTATE1` record uses a device-bound Keychain key. Uploading that file would not provide recovery onto another phone. Upload the portable backup format instead.
- The README and published privacy copy describe device-local health records. Optional encrypted uploads still constitute off-device storage and require accurate product/privacy copy before release.

## Proposed first version

1. User explicitly enables cloud backup in Settings and signs in. Journaling remains account-free and works offline.
2. User supplies a separate backup passphrase. The app creates a portable encrypted snapshot locally. Neither the passphrase nor plaintext is sent to the backend.
3. Backend validates the session, derives ownership from the verified identity, enforces size/quota limits, and issues an upload permission for one server-selected object key in a private bucket.
4. Upload completes before the backend publishes the snapshot as restorable. Failed or incomplete uploads never replace the last good backup. Store only ownership, opaque object ID, format version, byte length, and creation time as metadata.
5. A replacement phone signs in, downloads its owner's selected backup, and decrypts locally with the passphrase. Validate schema before showing a restore preview; require explicit confirmation before replacing the local record. Preserve a local recovery copy first.
6. Offer deletion of cloud backups and the backup account, with retryable cleanup. Explain provider retention accurately. Keep local export/import available.

Start with manual backup and explicit restore. Automatic backup requires a separate decision about securely retaining a backup secret. Full multi-device synchronization, conflict resolution, and record merging are outside this design.

Account password reset restores access to encrypted files, not the ability to decrypt them. If the backup passphrase and all usable local copies are lost, this design cannot recover the records. Explain this during setup and test a restore before calling backup setup complete.

## Storage and ownership

Use private buckets and short-lived, object-specific permissions. A signed-in user must never choose another user's storage prefix. Enforce ownership on listing, upload, download, and deletion. Do not assume that Neon Auth automatically applies per-user permissions to S3 objects.

Use synthetic records in development. Database/storage branching can carry production backup objects and identity data into child environments; isolation does not mean data minimization. Verify deletion behavior across branches and retained recovery history before promising permanent deletion.

No health-derived filenames, backup contents, passphrases, session tokens, or signed download URLs should enter analytics or diagnostic logs. Reuse the app's existing import size bound as the starting point for an explicit server-side byte limit.

## Verified vendor facts and cost model

The live September 17 announcement confirms GA. Initial search results were stale beta material; direct retrieval of the official pages resolved that uncertainty.

- Free plan: 5 GB object storage per project; Managed Better Auth up to 60,000 monthly active users.
- Paid object storage: $0.023 per GB-month; no per-operation charge. Egress counts toward network allowance. Database compute/storage and any backend hosting are additional.
- Storage regions documented: AWS Ohio and Frankfurt.
- The storage overview contains both a 5 GiB current object limit and older future-billing language about larger objects. This is irrelevant to small journal snapshots, but do not rely on larger-object claims without confirmation.

Illustrative sizing, not measured app usage: 10,000 users × 3 retained snapshots × 1 MB per encrypted snapshot is approximately 30 GB, or $0.69/month for object storage alone on the published paid rate. At 5 MB per snapshot it is 150 GB, or $3.45/month. This excludes database, API hosting, and billable transfer. Measure encrypted snapshots before forecasting actual cost; do not subtract Free-plan allowances from paid-plan usage automatically.

## Required integration evidence before adopting

- Demonstrate supported native login, session persistence, expiry, logout/revocation, and recovery with Managed Better Auth. If unsupported, retain Neon Storage as a candidate and evaluate a native-supported identity provider separately.
- Test upload and restore on two real iOS devices using synthetic records; wrong passphrases, tampering, and invalid schema must leave the existing record intact.
- Prove cross-user access fails on all backup operations; expired upload/download permissions fail; interrupted uploads preserve the last good backup.
- Verify quota enforcement, cleanup retries, account deletion, and branch/retention behavior.
- Verify no network calls occur before opt-in, and backup/account outages do not block offline journaling.

No runtime tests were run for this evaluation because only this document was added. No live account, region, authentication configuration, or storage operation was validated.

## Sources

- [GA announcement](https://neon.com/blog/neon-backend-is-ga)
- [Pricing](https://neon.com/pricing)
- [Storage overview and limits](https://neon.com/docs/storage/overview)
- [Managed Better Auth overview](https://neon.com/docs/auth/overview)
- [Auth framework support and roadmap](https://neon.com/docs/auth/roadmap)
