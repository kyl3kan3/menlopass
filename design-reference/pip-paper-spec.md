# peri × Pip — paper design system

The app and the Pip social content now share one voice. Source mockups for this pass live in the
design conversation of 2026-10-29; the implementation is `redesign.css` plus targeted view changes
in `app-views.js` and `app-companion.js`.

## Visual system

- Paper `#f8f4ed` background, note `#fffefa` cards, forest ink `#244b43` for text, outlines and
  primary actions, mint `#3c6857` for eyebrows and positive states.
- Scene colors say what kind of moment it is: sand `#f0e5d5` today, night `#e0e6ed` sleep,
  sage `#dce7d1` growth and care, blush `#f2d7c7` comfort. Leaf `#a3c28e` is Pip's green and the
  selected state; peach `#f2b5a0` is the brand dot and Pip's cheeks.
- Bricolage Grotesque everywhere (variable, 200–800). Display 800 at −0.035em tracking; titles 700;
  body 400 at 15 px; eyebrows 700 at 10.5 px, 0.13em, uppercase. Georgia headings retired.
- Shape: 22–24 px cards, 18 px rows, 14 px inputs, pill buttons and chips. One ink-outlined "note"
  card per screen (the social card), hairlines not boxes inside cards.
- Navigation: floating pill tab bar with a sage pill for the active tab on phones; 228 px left rail
  at 1000 px and up. Native iOS keeps its own tabs.
- Ratings read as dots (0–4) in summaries and as 44 px tappable circles in the check-in; values
  below the selected one fill sage, the selected one fills ink, only the selected label and the
  end labels are shown.

## Pip

- `pip(pose,size)` renders the still pose; `pipSays(pose,size,text)` adds a one-line speech bubble.
- Phone pose = waiting (Today before confirmation, check-in). Guide pose = with you (Today after
  confirmation, weekly story, care, support, welcome, check-in confirmation).
- One Pip per screen, full body and leaf tuft always visible, uniform scale. Sizes: 236 welcome,
  150–158 Today hero, 128 Guide feature, 116 support sheet, 84–112 speech rows.
- Motion is CSS: 4.4 s breathing, 5.2 s leaf sway on the guide pose, 260 ms bubble pop. The
  check-in clip plays once on the confirmation screen (web only until an HEVC render ships).
  `prefers-reduced-motion` disables all of it.

## Screen notes

- Today: greeting with the date eyebrow, state-aware hero (sand while waiting, sage once saved),
  the day's note card with dots after confirmation, week strip, blush support row, recap and task,
  resources, privacy line.
- Check-in: Pip bubble, dot scale, dashed note affordance; confirmation shows Pip and the record.
- Journey: weekly story as chip-headed groups (Lower / Higher / Steady) with before → after rows,
  three stat tiles, timeline.
- Care: the appointment brief as an ink-outlined note with concern → impact rows and the date chip,
  Pip line, report card, treatment rows with pill actions.
- Guide: search pill, night-blue matched article with Pip, four quick tools, library rows.
- Support sheet: Pip with "I'm here.", four paths with icons and their step titles.

## Verification

`npm test` passes; three hierarchy assertions in `test.js` were updated to the new copy and the
new Guide order (matched article, then tools, then library). `npm run shots` writes seeded phone
captures to `test-results/shots/` for review.
