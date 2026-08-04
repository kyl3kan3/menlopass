# Meno Compass

A private, offline-capable PWA and Expo app for women in perimenopause and beyond. Tracker first,
with an evidence-graded reference library behind it.

- **No account, backend, database, analytics, or third-party runtime requests.** Data lives in
  the browser's local storage on the user's device.
- **Works offline** once installed, via a service worker that caches the app shell.
- **Single-file application bundle.** The build emits one self-contained `dist/index.html` plus
  the manifest, service worker, and local install icons. There are no runtime npm dependencies.

---

## What's in the box

The editable sources are intentionally flat at the repository root:

```text
styles.css                 design system (light + dark)
assets/fonts/              local Bricolage Grotesque webfont + OFL license
content-a.js               symptom library, treatment landscape, supplements
content-b.js               staging, diet, exercise, weight, skin, sleep, mind,
                           sexual health, screening, red flags, sources
app-core.js                storage, data model, charts, insights engine
app-views.js               views, tools, router
manifest.webmanifest       PWA metadata
sw.js                      offline shell cache
*.png                      source icons
index.html                 generated standalone mirror; do not edit directly

build.py                   recreates the deployable dist/ directory
test.js                    Playwright end-to-end suite
package.json               pinned tooling and repeatable commands
vercel.json                Vercel build/output and security headers
mobile/                    Expo SDK 57 package for Android, iOS, and web export

dist/                      generated; deploy this directory, do not edit it
  index.html               CSS and JavaScript inlined in dependency order
  manifest.webmanifest
  sw.js
  assets/fonts/
  icons/
```

## Running it

Install the pinned development dependency, install its Chromium build once, then build and test:

```bash
npm ci
npm run test:install
npm test
npm run mobile:sync
npm run mobile:typecheck
npm run mobile:export:web
```

`npm test` rebuilds `dist/` before running the full browser suite. Test screenshots go to the
ignored `test-results/` directory.

The same command runs on every push and pull request through `.github/workflows/ci.yml` using
the pinned Playwright version and Chromium. Failed runs retain browser screenshots as a short-lived
CI artifact.

The Expo SDK 57 package bundles the generated app and local font into the native binary. It uses
an offline WebView, so symptom, medication, lab, and report data remain on the device and do not
depend on the hosted site. Run `npm --prefix mobile start` for local Expo development. EAS
configuration lives in `mobile/eas.json`; the linked project is `@kyl3kan3/menlopass`.

**Locally, no server:** after `npm run build`, open the generated root `index.html` (or the
identical `dist/index.html`) in a browser. Everything except service-worker registration and
installation works from a file URL.

**Locally, with a server** (needed to test install/offline):

```bash
npm run build
cd dist
python -m http.server 8080
# open http://localhost:8080
```

## Deploying

Any static host works. It must use **HTTPS** for service-worker and install support.

### Vercel (recommended)

Import the Git repository into Vercel. The committed `vercel.json` runs `npm run build`, publishes
`dist/`, prevents stale HTML/service-worker caching, and applies baseline static security headers.
No Vercel environment variables, Functions, or database are required for the current app.

Vercel's Git integration creates preview deployments for branches and production deployments from
the configured production branch. Run `npm test` locally or in CI before promotion. Do not commit
the generated `.vercel/` directory or tokens.

The current privacy model is deliberately device-local. If account sync or multi-device backup is
added later, put database access behind authenticated Vercel Functions and keep Neon credentials in
Vercel environment variables—never in browser JavaScript. That would be a separate privacy,
security, migration, and consent project; Neon is not needed for this static release.

### Other static hosts

Run `npm run build`, then publish the contents of `dist/`.

**Any web host** — upload the contents of `dist/` to a folder. App paths are relative, so it
works from a subdirectory (`example.com/meno/`) as well as a root domain.

### Installing it as an app

On the deployed URL: iPhone/iPad — Share → *Add to Home Screen*. Android — the browser offers
*Install app*, or use the ⋮ menu. Desktop Chrome/Edge — the install icon in the address bar.
After installing, it opens full-screen with no browser chrome and works with no connection.

## Rebuilding after edits

```bash
npm run build         # root sources → dist/
npm run test:e2e      # test an already-built dist/
npm test              # rebuild, then test
```

`build.py` inlines `styles.css` and the four JS files, in this order:
`content-a.js`, `content-b.js`, `app-core.js`, `app-views.js`. They share globals, so the order
matters. It writes identical HTML to the tracked root `index.html` convenience mirror and to
`dist/index.html`; neither generated file should be edited manually.

**Important:** never edit `dist/` directly. When changing a file listed in the service-worker
shell, bump `CACHE` in the root `sw.js`, then rebuild. The activation handler removes only older
`meno-compass-*` caches, leaving unrelated caches on the same origin alone.

## Data model

Everything lives under the single localStorage key `menocompass.v1`:

```js
{
  v: 4,
  profile:  { name, birthYear, region, units,
              uterus:   'intact'|'hyst'|'ablation'|'unknown',
              ovaries:  'kept'|'one'|'both'|'unknown',
              lastPeriod, surgeryDate, bone,
              proteinGpk, weightGoal, waistGoal, theme, stage, onboarded },
  entries:  { "2026-07-29": { hf, ns, inBedH, sleepH, sym:{…}, wt, waist,
                              bleed, act:{res,bal,pf,aero}, nut:{prot,cal,fib,alc,caf},
                              med:{ medicationId:{taken,at} }, notes, prefilledFrom? } },
  medications:[ {id,name,form,days,due,notes} ],
  labs:      [ {id,name,date,value,unit} ],
  screening:{ dxa:{last}, mammo:{last,intervalYears}, … },
  scores:   [ {date, type:'phq9'|'gad7', score, band} ],
  trigger:  { active, status:'running'|'stopped'|'completed', item, start, ended? } | null
}
```

`uterus` and `ovaries` are **separate fields on purpose.** A hysterectomy can leave both ovaries
in place, and ovaries are sometimes removed with the uterus left — the two have completely
different consequences, and collapsing them into one field produces wrong advice. Three helpers
in `app-core.js` derive everything downstream from them: `hasUterus()`, `periodsPossible()` and
`surgicalMenopause()`. They gate the staging questions, the last-period vs. surgery-date field,
the bleeding copy on Today, the endometrial-protection note in the treatment module, and two
insight rules. Records written by an earlier single-field version are migrated automatically.

Weight is always stored in **kg** and waist in **cm**, regardless of the display unit — so
switching units never mutates stored data. If localStorage is blocked (private mode, sandboxed
iframe), the app falls back to in-memory storage and tells the user their entries won't survive
a reload.

Export/import is plain JSON round-trip; CSV export is one row per day plus a questionnaire block.
Both export formats are unencrypted and may contain sensitive health information. Restore accepts
up to 5 MB and passes every field through a strict allowlist, type/range checks, and date validation;
unknown fields and invalid values are discarded. Schemas v1–v3 are read from the existing
`menocompass.v1` storage key so earlier device-local records migrate in place.

## Editorial rules the content follows

These are deliberate and worth preserving if you edit the copy:

1. **Match each intervention to the outcome it actually has evidence for.** The Menopause
   Society does not recommend exercise, yoga, mindfulness, paced breathing, cooling or trigger
   avoidance *for hot flashes specifically*. The app scopes that finding narrowly every time it
   appears, and never implies those things are useless generally — they have strong evidence for
   mood, sleep, bone, heart health and muscle.
2. **Every drug mention carries its safety line.** Fezolinetant without its liver-monitoring
   schedule is unsafe content.
3. **Absolute risk, not relative risk.** "80% higher" is meaningless; "+8 per 1,000 over five
   years" is not.
4. **Say what we couldn't verify.** The *Sources* module lists what was deliberately left out
   and why. Several widely circulated figures are on that list.
5. **Flag US/UK divergence** rather than silently picking a side. The region setting drives
   region-specific callouts in the treatment, diet, supplements and screening modules.
6. **Report racial and ethnic differences where the data exist.** Symptom duration, premature
   menopause prevalence, endometrial cancer incidence and ultrasound false-negative rates all
   differ, and omitting them produces content that is least accurate for the women at highest
   risk.
7. **No unvalidated cut-offs.** The symptom burden score is presented as a direction-over-time
   measure with no severity bands, because none has been validated for that item set.
8. **Never assume a bleeding pattern exists.** After a hysterectomy or ablation, or on
   period-suppressing contraception, the criterion every staging system depends on is
   unavailable. The app says so and routes to what still works, rather than asking about periods
   that aren't there or forcing a stage it can't support.

## Content currency

Guideline content was compiled and reviewed in **July 2026** against primary sources: The
Menopause Society, NICE NG23, ACOG, AUA/SUFU/AUGS, USPSTF, British Menopause Society, MHRA, FDA,
AHA, ESHRE, the Global Consensus on testosterone, AASM, NCCIH and the SWAN cohort. The full list
and the deliberate omissions are in the app's *Sources* module.

This field moved substantially in **November 2025** (FDA labelling), **March 2026** (NICE
fezolinetant appraisal) and **April 2026** (ACOG bleeding guidance). **Set a review cadence of no
more than six months.** When you review, the highest-value checks are: the FDA/MHRA labelling
position, the neurokinin antagonist approvals and monitoring requirements, the USPSTF screening
intervals, and the IMS 2025/2026 recommendations (which were paywalled during compilation and
never cited).

## Accessibility

Semantic buttons with `aria-pressed` / `aria-current`, every form control labelled, minimum 40 px
tap targets, visible focus rings, `prefers-reduced-motion` honoured, `prefers-color-scheme` for
theme with a manual override, and a print stylesheet for the clinician report.

## Not medical advice

The app provides general health education compiled from published clinical guidelines. It does
not diagnose, treat or prescribe. It is not a medical device and has not been reviewed by any
regulator. If you plan to distribute it publicly, get the disclaimer and privacy language
reviewed for your jurisdiction.
