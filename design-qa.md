# Design QA — Twilight redesign

**Source visual truth**

- Claude artifact: `https://claude.ai/code/artifact/d9032098-cccc-4ebf-b80a-f1d4063d2d68`
- Normalized Today phone crop: `C:\Users\kylep\Documents\MenoCompass\design-qa-artifacts\source-phone-today.png`
- Captured source board: `C:\Users\kylep\Documents\MenoCompass\design-reference\source-desktop-main.png`

**Implementation evidence**

- Final dark Today capture: `C:\Users\kylep\Documents\MenoCompass\design-qa-artifacts\implementation-phone-today-v3.png`
- Light Today capture: `C:\Users\kylep\Documents\MenoCompass\design-qa-artifacts\implementation-phone-today-light.png`
- Other rendered views: `implementation-trends.png`, `implementation-learn.png`, `implementation-you.png`, and `implementation-report.png` in `design-qa-artifacts`
- Responsive captures: `implementation-320x568.png` and `implementation-430x932.png` in `design-qa-artifacts`

**Normalization and state**

- Source pixels: 384 × 772.
- Implementation pixels: 384 × 772.
- CSS comparison size: 384 × 772 at device scale factor 1.
- Source and implementation were compared in dark mode on the Today/check-in state, with recorded hot flashes and representative non-zero symptom severities.
- The Codex in-app browser requested a 399 × 802 outer viewport to produce a browser-content capture of exactly 384 × 772. No density resampling was used.
- The reference includes a decorative phone bezel and fake status bar. The production PWA intentionally omits both; comparison was judged on app-owned content.

**Full-view comparison evidence**

- `C:\Users\kylep\Documents\MenoCompass\design-qa-artifacts\comparison-today-v2.png`
- The final comparison shows the same dark teal paper/card hierarchy, amber signal ramp, 10px card radii, hairline borders, Bricolage display voice, two-column check-in rhythm, rounded line icons, and bottom navigation treatment.

**Focused-region comparison evidence**

- `C:\Users\kylep\Documents\MenoCompass\design-qa-artifacts\comparison-today-focus.png`
- The focused header/check-in comparison was required because typography, icon alignment, dot sizing, selected glows, and compact card spacing were too small to judge confidently in the full two-phone view.

**Findings**

- No actionable P0, P1, or P2 differences remain.
- Expected product differences: MenoCompass keeps its existing Today, Trends, Learn, and You destinations instead of adding the reference's mock Meds and Report routes; the clinician report remains a working sheet. It also keeps the 14-day picker and five-value 0–4 health-data model. These are intentional behavior/data constraints rather than visual drift.
- The reference's mock medication data, dose-change claims, prefilled-yesterday claim, phone bezel, and status bar were not copied because the production app does not implement those semantics.

**Required fidelity surfaces**

- Fonts and typography: passed. Bricolage Grotesque is bundled locally as a Latin variable WOFF2 and verified by `document.fonts`; display size, 200–800 weight range, compact uppercase labels, line height, wrapping, and monospace dates/metrics were inspected.
- Spacing and layout rhythm: passed. The implementation uses 20px phone gutters, 10px card/grid gaps, 10px radii, flat hairline surfaces, 40px-or-larger interactive targets, a fixed bottom tab bar, and safe one-column collapse below 360px.
- Colors and visual tokens: passed. Dark paper/card/hair/ink/amber/sage/coral tokens map to the source values. Light mode maps to the source paper/card/ink set, with slightly darker small-text tokens retained for contrast.
- Image quality and asset fidelity: passed. The source has no raster imagery. Its supplied 20px line-icon paths are reused with the same rounded 1.75px treatment; no placeholder illustrations or generated image substitutes are present.
- Copy and content: passed. Standalone copy remains truthful to the implemented tracker. Unsupported mock medication and prefill claims were excluded.
- Interactions and states: passed. Hot-flash stepping, severity selections, day switching, all four tabs, trend ranges, sheets, report opening/closing, dark/light switching, form inputs, export/import, print styling, and offline behavior were exercised.
- Accessibility and responsiveness: passed. Labels, focus management, `aria-current`, decorative icon semantics, reduced motion, 40px tap targets, keyboard-reachable controls, contrast-adjusted tertiary text, and 320/390/430px layouts were checked.

**Comparison history**

1. Initial implementation (`implementation-phone-today-v1.png`) — blocked by a P1 typography mismatch: the header inherited an 18px legacy rule instead of the 29px source display size. It also had P2 above-the-fold hierarchy drift because full-width hot-flash and sleep cards hid the reference's two-column check-in language, and visible scrollbars added P2 polish drift.
2. Fixes — set the header to the source display scale, made the selected date the truthful primary heading, split hot flashes/night sweats into a two-column check-in, moved sleep details below the symptom grid, shortened tile display labels without changing accessible names, and hid browser/sheet scrollbars.
3. Final implementation (`implementation-phone-today-v3.png`) — post-fix full and focused comparisons found no actionable P0/P1/P2 differences. The 320px and 430px checks found no overlap, clipped controls, or horizontal page overflow.

**Verification**

- `npm test`: passed with 0 failures.
- Browser console/page/network errors: 0.
- Local Bricolage font, PWA cache v4, manifest/icons, offline reload, storage fallback, migrations, sanitization, and core clinical-content paths: passed.

**Follow-up polish**

- P3: the 14-day picker intentionally reveals a sliver of the previous day at some widths to signal horizontal history. It may be changed to strict seven-day paging later if product preference favors a cleaner edge over the scroll cue.

final result: passed
