# MenoCompass — warm journal redesign

The product helps people notice menopause symptoms, understand change over time, and prepare
for care. The experience should feel personal and calm while keeping the meaning of the record clear.

## Visual direction

- Paper background `#f7f5ef`, near-white panels `#fffefa`, deep teal actions `#244b43`.
- Sage `#e6eee7` for selected states, soft sand for immediate support, restrained secondary accents.
- Georgia for editorial headings; bundled Bricolage Grotesque for navigation, controls and body copy.
- Desktop navigation becomes a 228px left rail at 1000px. Smaller screens retain four bottom tabs.
- Native chrome, app lock, subscription gate and splash colors use the same palette.
- All fonts and app resources remain available offline.

## Flow

**Today:** personal welcome → primary check-in → actual seven-day check-in coverage → latest recap
and scheduled care → immediate support → a small set of relevant tools. Counts use saved confirmed
entries; empty states do not imply sample observations.

**Check-in:** symptom ratings can be confirmed immediately. An optional second step offers a review,
notes, treatments and the existing detailed daily log. The expanded rating explanation is available
on demand. Draft values never replace the confirmed snapshot until confirmation.

**Journey:** weekly story first, supported by confirmed record counts. Waiting symptoms are grouped
without repeated empty paragraphs. Evidence and per-symptom coverage remain available in disclosures.
Recent activity combines dated confirmed check-ins and treatment events.

**Care:** appointment brief and report first, followed by questions/plans, daily care, treatments,
follow-ups and labs. Empty/infrequent sections use disclosures. Opening a form scrolls to it and
focuses its first field.

**Guide:** search and practical tools, a recommendation matched to the saved intent, then an indexed
library organized around understanding, treatment, everyday wellbeing and preparation.

## Implementation and verification

`redesign.css` is intentionally loaded after the established component stylesheet so detailed tools,
reports and specialized forms retain their structure. Root source files generate the PWA bundle;
the mobile sync command embeds the same bundle and font into the native WebView.

Regression coverage includes onboarding, the two-step check-in, draft resumption, atomic confirmation,
treatment history and follow-ups, questions/plans, native bridges, exports, offline caching, migration,
keyboard focus and mobile layouts. Native styling is typechecked; final device rendering still needs
an iOS/Android build.
