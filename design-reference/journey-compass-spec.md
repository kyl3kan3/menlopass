# Journey Compass implementation inventory

Reference: `design-reference/journey-compass-selected.png` (selected concept #2).

## Product flow

1. Onboarding establishes local-only storage, optional profile basics, and stage context.
2. Today answers one question: what needs attention now? The dominant action is **Log today**.
3. Check-in is a focused confirmation flow. Suggested values are visibly unconfirmed until the user finishes.
4. Journey turns confirmed days and treatment changes into one chronological story.
5. Care holds medications, labs, appointment preparation, reports, and screening.
6. Guide holds evidence modules and self-guided tools.
7. Safety and Profile remain globally reachable from the product header.

## Visual system

- Canvas: near-black teal `#071416`; no gradients, glow, glass, or decorative illustration.
- Primary text: warm white `#F1F4EF`; secondary text: muted teal `#92A9A6`.
- Signal mint: `#8CCCB5` for confirmed status, sufficiency, and selected navigation.
- Action amber: `#FFB44D` for the single primary action on a screen.
- Dividers: dark teal `#284046`; surfaces appear only when grouping is essential.
- Display type: local Bricolage Grotesque; body and controls: system sans.
- Shape language: restrained 12–16 px radii, circular global actions, open timeline nodes.
- Motion: short opacity/position transitions only; respect reduced-motion preference.

## Shell and navigation

- Wordmark at upper left: mint `MENO`, white `COMPASS`.
- Upper-right circular actions: Safety and Profile, both text-labelled for assistive technology.
- Four persistent destinations: Today, Journey, Care, Guide.
- The selected tab uses mint icon/text and a small mint indicator.
- Nested screens replace the page heading with a visible Back action; the bottom navigation stays coherent.

## Screen hierarchy and exact anchor copy

### Today

- Date eyebrow, contextual greeting, one-sentence orientation.
- Full-width amber **Log today** / **Update today’s log** action.
- Confirmation state for the current day.
- One useful “Since your last log” narrative derived from real confirmed data.
- Today’s scheduled treatment actions.
- Progress toward meaningful comparisons.

### Journey

- Heading: **Your journey**
- Subtitle: **Symptoms and treatment changes, in one story.**
- Full-width amber **Log today** action.
- Open vertical timeline beginning with today’s confirmed or unconfirmed state.
- Real treatment events and confirmed log summaries; never synthetic events.
- Clinical qualifier: **Early signal — not proof.**
- Mint sufficiency panel: **N confirmed days** and either **Comparisons unlock after 14.** or readiness copy.

### Care

- Appointment preparation and clinician report are the first care actions.
- Medications and labs share one chronological treatment context.
- Preventive screening and clinician-question guidance remain accessible.
- Treatment changes carry dates so Journey can explain what changed when.

### Guide

- Evidence library first, organized by user intent rather than content type.
- Self-guided tools second.
- Every clinical module keeps evidence dates, regional caveats, and urgent-care boundaries.

### Check-in

- Back action, date, and explicit “not confirmed” state.
- Six high-frequency symptom controls use the existing four-level scale.
- Optional note and treatment adherence remain in the same flow.
- **Confirm today’s log** is the final action; editing alone never creates a confirmed day.
- **Add more detail** opens the full existing daily log.

### Profile

- Stage/profile, preferences, local data controls, and app/legal information.
- Export, restore, and permanent erase remain explicit and locally scoped.

## Core states

- Empty: invite the first confirmation and explain the 14-day comparison threshold.
- Suggested: yesterday’s confirmed values may prefill, but the day remains unconfirmed.
- Confirmed: visible mint status with the confirmation date.
- Sparse: show descriptive recaps, not trend claims.
- Ready: show cautious observed patterns with correlation-not-causation language.
- Error/invalid: keep inline validation and preserve entered values.
- Offline/storage fallback: keep existing local-only and ephemeral-storage warnings.

## Existing icon mapping

- Today → existing calendar icon.
- Journey → existing trend icon.
- Care → existing medication icon.
- Guide → existing document icon.
- Safety → existing urgent guidance action.
- Profile → existing settings/profile icon.

No additional illustrative icon assets are required.
