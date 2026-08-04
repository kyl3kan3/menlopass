# Design QA — Twilight reference copy

## Visual contract

- Source: `design-qa-artifacts/source-phone-today.png`
- Source size: 384 × 772
- New implementation capture: `test-results/render-today-384x772.png`
- Capture size: 384 × 772 CSS pixels at 2× device scale

## Corrections made

- Replaced the light dashboard/date-strip treatment with the supplied dark teal instrument shell.
- Rebuilt Today as the same six compact two-column symptom tiles with four amber severity weights.
- Reproduced the supplied typography, 20px gutters, 10px grid rhythm, card borders/radii, selected glow, medication rows, quiet note action, and five-tab navigation.
- Added functional Meds and Report routes. Medication data is user-owned; the sample capture is seeded only for visual comparison.
- Kept the original sleep, body, lifestyle, bleeding-safety, and clinical tools in Settings → Detailed daily log.

## Comparison findings

- P0/P1: none.
- P2: none in the Today hierarchy, navigation, spacing, palette, icon treatment, or medication layout.
- P3: the real app displays the current date/time rather than the static March 4 / 9:41 values in the design board. Production data is not fabricated when no medication has been entered.

## Interaction and responsive checks

- Four-dot symptom selection updates and persists.
- Medication add/remove and taken state update and persist.
- Today, Trends, Meds, Report, and Settings routes work.
- The detailed legacy log and evidence library remain reachable from Settings.
- 384 × 772 render checked with no overlap or horizontal overflow.
- Full Playwright regression run: all checks pass; browser console/page/network errors: 0.
- Release captures for Today, Trends, Meds, Report, and Settings were inspected at 384 × 772.
- Trends and Settings now carry the same compact status/header hierarchy as the supplied board;
  the report document keeps dark ink on its white clinician-paper surface.

final result: passed
