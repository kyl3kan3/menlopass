# Guided Daily Pulse implementation inventory

Reference: `design-reference/daily-compass-selected.png` (selected option #1).

## Product flow

1. Onboarding explains the local-only model and establishes the user’s focus.
2. Today opens with a trailing seven-day strip and one dominant **Check in** action.
3. Confirmed check-ins power a concise daily recap and the Journey story.
4. Today’s treatment task sits beside the recap so the next useful action is visible.
5. Journey, Care, Guide, check-in, reports, and Profile use the same open, divider-led hierarchy.
6. Safety and Profile remain globally reachable.
7. Profile exposes onboarding reset and permanent local-profile deletion without hiding either inside export.

## Visual system

- Canvas: flat near-black teal `#071416`; no gradients, glow, glass, or decorative texture.
- Primary text: warm white `#F4F5F1`; secondary text: muted blue-teal `#94A2A4`.
- Signal mint: `#8DC8B4` for labels, recaps, privacy, and progress.
- Action amber: `#FFB347` for the primary action, active day, task actions, and selected navigation.
- Dividers: `#2B3C40`; ordinary sections are open rather than boxed.
- Type: local Bricolage Grotesque with compact uppercase mono-style labels.
- Shape language: circular feature icons, circular global controls, a 60 px primary CTA, and restrained 9–12 px control radii.

## Today anchors

- Uppercase full date.
- Seven trailing days with today in an amber circle and a small amber dot.
- Heading: **How are you today?**
- Supporting copy: **A 30-second check-in helps you understand what changed and what to do next.**
- Dynamic primary action: **Check in**, **Finish check-in**, or **Review today**.
- Inline progress: **N of 14 days — patterns are starting to form.**
- **Today’s recap**, derived only from confirmed records.
- **Today’s task**, derived from the real treatment schedule.
- Local-data privacy row immediately above the four-part navigation.

## Account and data controls

- MenoCompass creates no cloud account.
- **Reset onboarding** resets only onboarding progress and preserves profile answers, logs, treatments, labs, and reports.
- **Delete app profile & data** permanently clears the local profile and all local health data after an explicit confirmation.
- Deletion copy states that an Apple subscription is managed separately in App Store settings.
