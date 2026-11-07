# November 7 audit fixes

The release preserves the production onboarding experiment from `06b90b2` and addresses the findings recorded in `APP-AUDIT-2026-11-07.md`. The installed iOS runtime remains `1.2.3-native-tracking-2`; no native dependency, module, or app configuration is changed from that deployed baseline.

| Finding | Change |
|---|---|
| Today actions used a previously selected date | Focused check-in and Care now use today's date; historical dates stay in the detailed log. |
| Back button returned to the same check-in | Detailed logging preserves the original primary destination. |
| Public pages replaced the offline tracker | App and public pages use separate cache entries. Cache v21 retires the previous poisoned shell. |
| Restart erased treatment history | Stop dates/reasons and pause intervals persist across restarts, reloads, reports, and backups. |
| Medication details could not be edited | Edit details updates name/dose, form, days, time, and notes from today while retaining earlier details and schedules. |
| Trouble sleeping omitted from reports | Confirmed sleep-difficulty ratings participate in the symptom summary, separately from sleep hours. |
| Native temporary exports retained health data | Share files are removed after the share sheet settles; deletion and startup also sweep legacy app-owned exports. |
| Android had an unusable Pro gate | The native shell declares whether subscriptions are available; Android core screens follow its existing non-subscription path. The iOS entitlement gate remains active. |
| Unreadable native record stranded the user | Recovery offers retry, strictly validated encrypted backup restore, and explicitly confirmed reset; restore preserves an original copy. Asset failures offer retry only. App Lock protects recovery and replay stays off there. TestFlight onboarding links wait for a loaded record and an unlocked app before changing progress. |
| Expo release check compared an existing runtime with newer patches | CI checks installed dependencies against the locked SDK's bundled compatibility map, then runs the remaining online Expo Doctor checks. Incompatible dependencies still fail validation. |
| Windows Python command failed | A portable launcher locates Python 3.10+ and propagates build failures. |

Medication history is an additive extension to schema v8. Existing backups import without the new fields. New backups preserve pauses and detail revisions. Previously erased stop history cannot be reconstructed automatically.

The SDK check deliberately does not upgrade native libraries for an OTA. Patch upgrades should be evaluated with the next native build and runtime. `npm run check:sdk` in `mobile/` runs the locked SDK compatibility check; CI additionally runs Expo Doctor 1.21.5 with only its duplicate remote-version recommendation check disabled. A fixture verifies that an incompatible React version still fails.

The release target is EAS project `@kyl3kan3/menlopass`, iOS, production channel and production environment. Before these changes, that channel served update group `5dcedbba-469c-43be-a899-6817046bbe9c` from `06b90b2`. The final publication receipt identifies the new update group and exact source commit.

Regression coverage includes date/navigation, medication editing and historical schedules, repeated restarts, backup validation, public-page offline behavior at root and nested paths, native cleanup/recovery behavior, and the Python/OTA/SDK guards. Full browser, mobile layout, native contract, TypeScript, export, and CI checks are required before publication.

Android encryption/billing and cloud sync are not introduced by this iOS OTA. Device-only flows such as purchases, Face ID, HealthKit, widgets, and actual OS share sheets still need physical-device QA; simulated tests establish the new application logic, not those OS integrations.
