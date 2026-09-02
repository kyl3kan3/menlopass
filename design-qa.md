# Design QA — Guided Daily Pulse

Reference: `design-reference/daily-compass-selected.png` (selected concept #1, 853 × 1844)

Implementation evidence: `design-qa-captures/guided-daily-pulse-matched-390x844.png` (390 × 843). The reference was proportionally normalized to the same width for direct comparison. The implementation state uses ten confirmed historical check-ins, an unlogged current day, and a due medication task so all major reference regions are represented.

## Fidelity ledger

| Design point | Selected source | Implemented app | Result |
| --- | --- | --- | --- |
| Product shell | Compact MenoCompass wordmark, Safety and Profile utilities, four-item bottom navigation | Same hierarchy and accessible global utilities across Today, Journey, Care, and Guide | Passed |
| Palette | Near-black teal canvas, warm white type, mint support states, amber primary action | Runtime tokens use `#071416`, `#f2f4ef`, `#8dcdb6`, and `#ffb44d` without gradients | Passed |
| Today hierarchy | Date, trailing seven-day strip, check-in prompt, large amber action, progress, recap, task, privacy | Same order and visual weight, with live health data and state-dependent labels | Passed |
| Navigation | Home, Journey, Care, Guide with circular line icons and a mint active dot | Official Lucide assets provide the same semantic icon treatment and active indicator | Passed |
| Secondary destinations | Open, divider-led editorial sections rather than stacked dashboards | Journey, Care, Guide, Profile, and Safety use the selected concept's typography, spacing, and flat surfaces | Passed |
| Account controls | Not shown in source | Profile adds visible Reset onboarding and Delete app profile & data controls using the same system | Passed |
| Responsive behavior | Portrait-first mobile composition | Mobile fills the viewport; desktop uses a centered 440 px app surface without horizontal overflow | Passed |

## Comparison history

1. Initial 390 × 844 comparison showed lower Today content extending under the navigation and several text-style placeholder icons. The vertical rhythm was compacted and all shell/action icons were replaced with licensed Lucide assets.
2. A populated medication-due state then placed the privacy row 11 px behind the navigation. The navigation height and content spacing were corrected; final measurements are privacy bottom `y=773` and navigation top `y=774`.
3. The final normalized full-frame and focused hero/lower comparisons showed no actionable P0, P1, or P2 visual mismatches.
4. A final independent audit moved Account & data directly below the Profile heading, tightened destructive wording, added a true zero-progress state, and replaced remaining legacy drawings with licensed Lucide assets.

## Accepted dynamic differences

- The live calendar uses the current date instead of the reference's static date.
- Recap and medication text are generated from the user's real state, so wording differs while hierarchy and density remain aligned.
- The reference has a subtle raster texture; the implementation deliberately uses flat color to honor the no-gradient runtime system and keep text crisp.

## Functionality evidence

- Reset onboarding requires confirmation, returns to the first setup step, and preserves symptom history, profile data, medications, and labs.
- Delete app profile & data requires a destructive confirmation, clears the complete local database, and returns to setup.
- Delete copy explicitly states that an Apple subscription is managed separately and is not cancelled by deleting local app data.
- Account & data is visible in the first Profile viewport; reset and deletion are not buried below health settings.
- The seven-day strip uses semantic dates and the 14-day meter exposes progressbar values to assistive technology.
- The native wrapper immediately adopts the canonical persisted state after reset or deletion, preventing cleared data from returning on an in-session reload.
- Automated coverage includes onboarding, check-in, migration, reset, deletion, Care, Guide, native persistence, PWA generation, and support/privacy copy.

## Visual evidence

- Source: `design-reference/daily-compass-selected.png`
- Final implementation: `design-qa-captures/guided-daily-pulse-matched-390x844.png`
- Full comparison: `design-qa-captures/option1-full-comparison.png`
- Focused comparisons: `design-qa-captures/option1-hero-comparison.png`, `design-qa-captures/option1-lower-comparison.png`
- Profile controls: `design-qa-captures/guided-daily-pulse-profile-controls-390x844.png`
- Destructive confirmation: `design-qa-captures/guided-daily-pulse-delete-confirmation-390x844.png`

final result: passed
