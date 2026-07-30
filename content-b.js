/* ============================================================
   Content module B — lifestyle modules, staging, screening,
   red flags, clinician prep, sources.
   ============================================================ */

/* ---------------- Staging quiz ----------------
   Uterus and ovaries are asked SEPARATELY, because they are separate
   operations: a hysterectomy can leave both ovaries in place, and ovaries
   can be removed with the uterus left. And because a hysterectomy or
   ablation ends periods, the cycle questions are skipped entirely for
   anyone whose bleeding pattern can no longer be read.
   ------------------------------------------------------------------ */
const STAGE_Q = [
  {id:'age', q:'How old are you?', a:[
    {t:'Under 40', v:'u40'}, {t:'40–44', v:'40s_e'}, {t:'45–54', v:'45p'}, {t:'55 or older', v:'55p'}
  ]},
  {id:'uterus', q:'Has your uterus (womb) been removed, or have you had an endometrial ablation?',
   note:'A hysterectomy removes the uterus. It does not necessarily involve the ovaries — that is a separate operation, and the next question asks about it.',
   a:[
    {t:'No — my uterus is still there', v:'intact'},
    {t:'Yes — I have had a hysterectomy', v:'hyst'},
    {t:'I have had an endometrial ablation', v:'ablation'},
    {t:"I'm not sure what was removed", v:'unsure'}
  ]},
  {id:'ovaries', q:'Have your ovaries been removed?',
   note:'Many women keep both ovaries during a hysterectomy — this is often called a partial hysterectomy, though that phrase is used loosely and can also mean the cervix was left in place. If you are unsure, your surgical notes or your surgeon can tell you.',
   a:[
    {t:'No — both ovaries are still there', v:'kept'},
    {t:'One was removed', v:'one'},
    {t:'Both were removed', v:'both'},
    {t:"I'm not sure", v:'unsure'}
  ]},
  {id:'surgWhen', q:'Roughly how long ago was that surgery?',
   when:a => a.uterus==='hyst' || a.uterus==='ablation' || a.uterus==='unsure'
          || a.ovaries==='both' || a.ovaries==='one',
   a:[
    {t:'Less than 3 months ago', v:'lt3m'},
    {t:'3–12 months ago', v:'lt1y'},
    {t:'1–5 years ago', v:'1to5'},
    {t:'More than 5 years ago', v:'gt5'},
    {t:"I don't remember", v:'unsure'}
  ]},
  {id:'contra', q:'Are you using hormonal contraception, or an IUD, that stops or masks your periods?',
   when:a => a.uterus==='intact' && a.ovaries!=='both',
   a:[
    {t:'No', v:'no'},
    {t:'Yes', v:'yes'}
  ]},
  {id:'cycle', q:'Which best describes your periods over the last year?',
   when:a => a.uterus==='intact' && a.ovaries!=='both' && a.contra==='no',
   a:[
    {t:'Regular and consistent, like they always were', v:'reg'},
    {t:'Still regular but cycles feel shorter', v:'short'},
    {t:'Cycle length varies by a week or more between periods', v:'var7'},
    {t:'I have skipped periods — gaps of 60 days or more', v:'skip'},
    {t:'No period for 12 months or more', v:'none12'}
  ]},
  {id:'since', q:'Roughly how long ago was your last period?',
   when:a => a.uterus==='intact' && a.ovaries!=='both' && a.contra==='no' && a.cycle==='none12',
   a:[
    {t:'Less than 2 years ago', v:'lt2'},
    {t:'2–6 years ago', v:'2to6'},
    {t:'More than 6 years ago', v:'gt6'}
  ]},
  {id:'vms', q:'Are you having hot flashes or night sweats?', a:[
    {t:'No', v:'no'}, {t:'Occasionally', v:'some'}, {t:'Often, and they bother me', v:'lots'}
  ]}
];
/* Which questions apply, given the answers so far. */
function stageQueue(a){ return STAGE_Q.filter(q => !q.when || q.when(a)); }

/* Shared blocks --------------------------------------------------- */
const NO_PERIOD_STAGING = `
<p><b>Why this tool can't stage you from bleeding.</b> Every staging system uses your bleeding pattern as its primary criterion — STRAW+10 says so explicitly, because hormone assays are not standardised well enough to define the stages. With no usable bleeding pattern, that route is closed. Staging then has to rely on hormone markers, and STRAW+10 says not to attempt it until <b>at least 3 months after surgery</b>.</p>
<p><b>What still works.</b> Your symptoms. Hot flashes, night sweats, disrupted sleep, mood change, vaginal dryness and bladder symptoms can all be assessed and treated on their own merits, with or without a stage attached. This is exactly what the tracking in this app is for — take a few weeks of it to your clinician, because a trend is worth more than any single blood test.</p>
<p><b>One place blood tests earn their keep.</b> NICE tells clinicians not to routinely use FSH in women over 45, because it should be diagnosed from cycle change and symptoms. When there is no cycle to read, that reasoning does not apply in the same way, and a clinician may reasonably use hormone markers. Worth asking about rather than assuming either way.</p>`;

const OOPHOR_TESTOSTERONE = `<p>Two things specific to having both ovaries removed. The British Menopause Society suggests <b>considering added testosterone after removal of both ovaries</b>. And surgical menopause independently raises sleep apnea risk — in the Nurses' Health Study, bilateral oophorectomy carried a hazard ratio of <b>1.43</b>, and it roughly doubles the odds of sleep disturbance versus premenopause (OR 2.17). If you are exhausted and sleeping badly, that is worth naming as a possible cause rather than filing under "menopause".</p>`;

function stageResult(a){
  const out = {stage:'', label:'', body:'', flags:[]};
  const noUterus  = a.uterus==='hyst';
  const ablation  = a.uterus==='ablation';
  const bothGone  = a.ovaries==='both';
  const young     = a.age==='u40';
  const earlyAge  = a.age==='40s_e';
  const fresh     = a.surgWhen==='lt3m';

  /* ---- 1. Both ovaries removed: surgical menopause, regardless of uterus ---- */
  if (bothGone){
    out.label = 'Surgical menopause';
    out.body = `<p>Removing both ovaries causes menopause immediately. The hormone drop is abrupt and steep rather than gradual, which is why symptoms are often more intense than after natural menopause${noUterus?', and why nothing about your periods can tell you where you are':''}.</p>
    ${fresh?`<div class="callout warn"><span class="ctitle">You are less than 3 months post-op</span>
    Symptoms are often at their most intense in these first weeks, and this is also the window in which staging and hormone testing are least reliable — STRAW+10 says not to attempt staging until at least 3 months after surgery. If you are struggling now, that is a reason to contact the team who operated rather than to wait it out.</div>`:''}
    <p><b>This is managed differently from natural menopause, and the difference matters.</b> The Menopause Society recommends hormone therapy for premature or early menopause <b>at least until the average age of natural menopause, around 52</b>, absent contraindications — earlier initiation reduces fracture risk and likely cardiovascular mortality. ESHRE agrees and prefers hormone therapy over the combined pill for this purpose.</p>
    ${OOPHOR_TESTOSTERONE}
    ${noUterus
      ? `<div class="callout ok"><span class="ctitle">One thing that is simpler for you</span>
         With no uterus, there is nothing to protect from oestrogen — so <b>oestrogen-only therapy is used, and a progestogen is not needed</b>. That also means you avoid the progestogen component that carries most of the extra breast cancer signal in the risk tables: for oestrogen-only use at ages 50–59 over five years, estimates run from <b>6 fewer</b> to <b>3 extra</b> cases per 1,000 women, against <b>+8 to +10</b> for combined therapy.</div>`
      : `<div class="callout info"><span class="ctitle">You still have your uterus</span>
         So if you take systemic oestrogen you also need a progestogen to protect the lining. That is not optional — unopposed oestrogen for 10 years at ages 60–69 gives about <b>48 extra endometrial cancers per 1,000 women</b>. A levonorgestrel IUD is one accepted way to provide it.</div>`}
    ${(young||earlyAge)?`<p><b>Because this happened before the usual age,</b> the long-term picture deserves attention now rather than later. A 2026 pooled analysis across six US cohorts found menopause before 40 carried about <b>40% higher lifetime coronary heart disease risk</b>. Bone, heart and — if it applies to you — fertility counselling are all part of proper follow-up.</p>`:''}`;
    out.flags.push('Ask a menopause-experienced clinician about hormone therapy at least until around age 52, and about bone and cardiovascular follow-up.');
    if(noUterus) out.flags.push('Any vaginal bleeding after a hysterectomy is unexpected. It is usually something minor, but it should always be reported rather than watched.');
    return out;
  }

  /* ---- 2. Under 40 with ovaries in place: needs assessment, not a stage ---- */
  if (young){
    out.label = 'Possible premature menopause — this needs assessment';
    out.body = `<p>Menopause before 40 is called premature menopause or primary ovarian insufficiency. ESHRE revised its prevalence estimate upward in 2024 to roughly <b>4 in 100 women</b> — higher than the 1 in 100 still quoted in most consumer content.</p>
    <p>Diagnosis requires at least 4 months of irregular or absent periods <b>plus</b> a raised FSH, repeated after 4–6 weeks. This is one of the few situations where blood tests genuinely matter, and it warrants specialist evaluation and psychological support.</p>
    ${(noUterus||ablation)?`<p><b>In your case there is an extra wrinkle:</b> without a readable bleeding pattern, the "4 months of irregular or absent periods" half of that definition is unavailable, so the assessment will lean on hormone markers and symptoms. Say that plainly when you book — it changes what tests are useful.</p>`:''}
    <p>Hormone therapy is recommended until the usual age of menopause to reduce long-term risks to bone, heart and brain. A 2026 pooled analysis across six US cohorts found menopause before 40 carried about <b>40% higher lifetime coronary heart disease risk</b>; premature menopause was three times more common in Black women (15.5% vs 4.8%).</p>`;
    out.flags.push('See a clinician. This needs a proper diagnosis, not a self-assessment — and it is one of the situations where FSH testing is appropriate.');
    return out;
  }

  /* ---- 3. Uterus removed, ovaries kept: NOT menopause ---- */
  if (noUterus){
    out.label = a.ovaries==='one'
      ? 'Ovaries still working — one remaining'
      : 'Ovaries still working, periods gone';
    out.body = `<div class="callout ok"><span class="ctitle">The most important thing to know: this is not menopause</span>
    A hysterectomy removes the uterus. ${a.ovaries==='one'
      ? 'You kept one ovary, and a single ovary generally carries on producing hormones and releasing eggs.'
      : a.ovaries==='unsure'
        ? "If your ovaries were left in place — and they often are — they carry on producing hormones and releasing eggs."
        : 'Your ovaries were left in place, so they carry on producing hormones and releasing eggs.'}
    What has ended is your bleeding, not your ovarian function. You may have years to go before menopause.</div>
    ${a.ovaries==='unsure'?`<div class="callout warn"><span class="ctitle">Worth finding out exactly what was removed</span>
    This genuinely changes the answer. If both ovaries were removed you are postmenopausal now, and guidelines recommend hormone therapy at least until around age 52. If they were left, you are not. Your surgical notes, your GP record, or the surgeon who operated can tell you — and it is a reasonable thing to ask for.</div>`:''}
    ${NO_PERIOD_STAGING}
    ${fresh?`<p><b>You are less than 3 months post-op.</b> Some women get a temporary dip in ovarian function after a hysterectomy that recovers. Symptoms now do not necessarily mean menopause has started — but they are still worth reporting to the team who operated.</p>`:''}
    <div class="callout info"><span class="ctitle">Two things that are simpler for you, and two that need care</span>
    <p><b>Simpler:</b> if you ever take systemic oestrogen, <b>you will not need a progestogen</b> — there is no lining to protect. That matters, because the progestogen component carries most of the extra breast cancer signal: oestrogen-only use at ages 50–59 over five years runs from <b>6 fewer</b> to <b>3 extra</b> cases per 1,000, against <b>+8 to +10</b> for combined therapy. And you can never be uncertain about whether bleeding is a period.</p>
    <p><b>Needs care:</b> cervical screening. Guidance to stop screening applies to women who <i>have no cervix</i> and no history of high-grade changes. If your cervix was left in place — which happens, and is one of the things "partial hysterectomy" can mean — <b>you still need cervical screening</b>. Check which you had. And after a hysterectomy, depression risk is elevated by roughly <b>20–44%</b>, so low mood here deserves attention rather than dismissal.</p></div>`;
    out.flags.push('Find out whether your cervix was left in place — it determines whether you still need cervical screening.');
    out.flags.push('Any vaginal bleeding after a hysterectomy is unexpected. Usually minor, but always worth reporting.');
    return out;
  }

  /* ---- 4. Ablation: uterus present, bleeding unreliable ---- */
  if (ablation){
    out.label = 'Bleeding pattern no longer readable';
    out.body = `<p>An endometrial ablation thins or destroys the lining of the uterus, so periods usually stop or become very light. Your ovaries are unaffected and carry on as before — <b>an ablation does not cause menopause</b>. What it removes is the signal this tool needs.</p>
    ${NO_PERIOD_STAGING}
    <div class="callout warn"><span class="ctitle">Two things specific to still having your uterus</span>
    <p>If you take systemic oestrogen you <b>still need a progestogen</b> to protect the lining, even after an ablation — ablation is not a substitute for endometrial protection. Unopposed oestrogen for 10 years at ages 60–69 gives about 48 extra endometrial cancers per 1,000 women.</p>
    <p style="margin-bottom:0">And bleeding still matters. Because your normal pattern is now light or absent, <b>new or unexpected bleeding is harder to dismiss, not easier</b> — report it rather than assuming the ablation explains it.</p></div>`;
    out.flags.push('Report any new or unexpected bleeding — your baseline pattern no longer tells you what is normal.');
    return out;
  }

  /* ---- 5. Unsure what was removed ---- */
  if (a.uterus==='unsure'){
    out.label = 'Worth finding out what was removed';
    out.body = `<div class="callout warn"><span class="ctitle">This is the one question you should get answered</span>
    Whether your uterus was removed, and separately whether your ovaries were, changes almost everything downstream: whether you are postmenopausal now, whether you need a progestogen alongside oestrogen, whether you still need cervical screening, and how any bleeding should be interpreted. Your surgical notes, your GP or specialist record, or the surgeon who operated can tell you — and asking is entirely reasonable.</div>
    <p>The three combinations, in plain terms:</p>
    <ul class="tick">
      <li><b>Uterus removed, ovaries kept</b> — not menopause. Hormones carry on; you just have no periods to read.</li>
      <li><b>Both ovaries removed</b> — menopause happened at the operation, whatever else was taken. Guidelines recommend hormone therapy at least until around age 52.</li>
      <li><b>Uterus kept, ovaries kept</b> — ordinary staging applies, using your cycle pattern.</li>
    </ul>
    ${NO_PERIOD_STAGING}`;
    out.flags.push('Ask for your surgical record. Everything else follows from it.');
    return out;
  }

  /* ---- 6. Periods masked by contraception ---- */
  if (a.contra==='yes'){
    out.label = 'Periods masked by contraception';
    out.body = `<p>Hormonal contraception and hormone-releasing IUDs suppress or mask bleeding, so your pattern is not telling you about your ovaries. The formal definition of menopause specifically excludes women on hormonal contraception for exactly this reason.</p>
    ${NO_PERIOD_STAGING}
    <p>Two practical notes. Contraception is still doing its job, so this is not a reason to stop it — talk to your clinician about when and how, because it depends on your age and method. And a levonorgestrel IUD can double as the endometrial protection you would need alongside oestrogen, which some women find convenient.</p>`;
    return out;
  }

  /* ---- 7. Ordinary staging from the cycle pattern ---- */
  const oneOvary = a.ovaries==='one'
    ? `<p class="tiny"><b>One thing specific to you:</b> you have one ovary. A single ovary usually maintains normal function and cycles, so ordinary staging still applies — but if you notice symptoms earlier than you expected, that is worth mentioning rather than dismissing.</p>`
    : '';

  if (a.cycle==='none12'){
    if (a.since==='gt6'){
      out.stage='+2'; out.label='Late postmenopause';
      out.body = `<p>You're more than about 6 years past your final period. Hormone levels are stable now and there's little further endocrine change.</p>
      <p><b>What tends to improve:</b> hot flashes, for most women — though they persist into the 60s for a substantial minority. <b>What tends to get worse if untreated:</b> vaginal and urinary symptoms, which become increasingly prevalent in late postmenopause. That asymmetry is the single most useful thing to know at this stage.</p>
      <p><b>Where your attention is best spent now:</b> bone density, cardiovascular risk factors, muscle mass, and treating genitourinary symptoms properly rather than enduring them.</p>${oneOvary}`;
    } else if (a.since==='2to6'){
      out.stage='+1c'; out.label='Postmenopause, roughly years 3–6';
      out.body = `<p>Hormones have settled — they typically stabilise around two years after the final period. Hot flashes often continue into this stage; among women with frequent symptoms the median total duration is 7.4 years, and 4.5 years after the final period.</p>
      <p>Bone loss continues for 5–10 years around the transition, averaging 10–12% at spine and hip. This is a good window for a serious look at resistance training, protein, and whether bone density screening is warranted.</p>${oneOvary}`;
    } else {
      out.stage='+1a/b'; out.label='Early postmenopause — the first two years';
      out.body = `<p>These are the 12+ months that retrospectively define menopause. FSH is still rising and oestradiol falling fast; levels stabilise around two years out.</p>
      <p><b>This is the peak symptom period</b> — hot flashes are most likely in the year or two after the final period, not in the years long before it. If you're struggling, this is when treatment tends to have the most to offer, and it sits squarely inside the window where guidelines say benefits outweigh risks for most healthy women.</p>${oneOvary}`;
    }
    out.flags.push('Any vaginal bleeding from now on needs prompt evaluation — see Red flags.');
    return out;
  }
  if (a.cycle==='skip'){
    out.stage='−1'; out.label='Late menopausal transition';
    out.body = `<p>Gaps of 60 days or more between periods put you in the late transition, which typically lasts <b>1–3 years</b>. FSH is high and fluctuating wildly.</p>
    <p><b>Hot flashes are most likely to start or intensify here.</b> Peak vasomotor risk straddles the final period — this stage and the two years after it.</p>
    <p>Pregnancy is still possible during the transition. Ask your clinician how long you need contraception — the answer depends on your age and what you are using.</p>${oneOvary}`;
    return out;
  }
  if (a.cycle==='var7'){
    out.stage='−2'; out.label='Early menopausal transition';
    out.body = `<p>A persistent difference of 7 days or more between consecutive cycle lengths is the defining marker of the early transition. FSH is raised and variable.</p>
    <p>Symptoms are genuinely variable at this stage — some women have none, others have significant hot flashes, sleep disruption and mood change. <b>Perimenopause is also the specific window where depression risk is elevated</b> (~40% higher odds than premenopause), so mood changes here deserve attention rather than dismissal.</p>${oneOvary}`;
    return out;
  }
  if (a.cycle==='short'){
    out.stage='−3a'; out.label='Late reproductive stage';
    out.body = `<p>Subtly shorter cycles with day 2–5 FSH beginning to rise. Periods are still regular, so this often gets missed — but you may already notice changes in sleep, mood, PMS intensity or energy.</p>
    <p>Symptoms starting <i>this</i> early tend to last longer overall: among women with frequent symptoms, when hot flashes begin before periods change the median total duration exceeds <b>11.8 years</b>, versus 3.4 years if they start after menopause. That's an argument for taking early symptoms seriously.</p>${oneOvary}`;
    return out;
  }
  out.stage='−3b'; out.label='Late reproductive stage (early)';
  out.body = `<p>Cycles are still regular and consistent. Egg reserve markers (AMH, follicle count) may already be low, but that doesn't predict symptoms and isn't worth testing without a specific reason.</p>
  <p>${a.vms==='lots' ? 'You reported bothersome hot flashes despite regular cycles. That combination is worth discussing with a clinician — both because early-onset symptoms tend to last longer, and because other causes (thyroid, medication, anxiety) deserve consideration.' : 'Nothing here needs managing yet. The most useful thing you can do at this stage is bank muscle and bone: resistance training twice a week and adequate protein are far easier to build now than to recover later.'}</p>${oneOvary}`;
  return out;
}

const STAGE_CAVEAT = `
<div class="callout info"><span class="ctitle">How menopause is actually diagnosed</span>
<p><b>If you are 45 or over:</b> NICE says diagnose from your symptoms and cycle changes — <b>and do not routinely use FSH testing.</b> Also not recommended: AMH, inhibin, oestradiol, antral follicle count, ovarian volume.</p>
<p><b>Why:</b> in the late transition FSH swings wildly from cycle to cycle. A "normal" FSH does not rule out perimenopause, and a high FSH in a woman over 45 doesn't change what happens next.</p>
<p><b>Blood tests do matter</b> if you're under 40, or 40–45 with symptoms and cycle change.</p>
<p><b>Saliva and urine hormone testing</b> for diagnosis or dosing is not recommended by any major body — "unnecessary and has not been proven to be accurate nor reliable."</p></div>
<p class="xtiny">This tool is based on the STRAW+10 international staging system, which anchors everything on the final menstrual period. STRAW+10 itself does not apply cleanly after a hysterectomy or ablation, or with PCOS, primary ovarian insufficiency, or during cancer treatment — so rather than forcing a stage, this tool asks about your uterus and your ovaries separately and tells you what can and cannot be concluded in your situation.</p>`;

/* ---------------- Diet ---------------- */
const DIET_HTML = `
<div class="callout ok"><span class="ctitle">Start here: the two levers with the best return</span>
<b>Enough protein</b> and <b>enough calcium and vitamin D from food</b>. Everything else on this page is refinement.</div>

<details class="acc" open><summary>Protein — the number that matters most</summary><div>
<p>The RDA of 0.8 g/kg/day (about 46 g) is a floor for preventing deficiency, not a target for preserving muscle. Guidelines for healthy older adults use <b>1.0–1.2 g/kg/day</b>; the resistance-training and body-composition literature uses <b>1.2–1.6 g/kg/day</b>; during intentional weight loss, <b>1.2–1.5 g/kg/day</b>.</p>
<p><b>Per-meal threshold.</b> After about 60 the muscle-building response becomes blunted — "anabolic resistance." Reaching it takes roughly <b>30 g of protein and 2.8 g of leucine in one sitting</b>, where a woman in her twenties responds to any amount. Spreading intake evenly (30/30/30 g) produced more 24-hour muscle protein synthesis than skewing it (10/20/60 g), and during weight loss, even distribution meant <b>26% versus 34% of the weight lost came from lean tissue</b>.</p>
<p>Use the calculator in <b>Tools</b> to get your grams — it uses your body weight, which is the only way this number means anything.</p>
<p><b>With resistance training</b>, protein supplementation in older adults with sarcopenia improved muscle mass (SMD 0.95) and grip strength (SMD 0.32); gait speed didn't move.</p>
<p class="tiny"><b>The "protein leaches calcium from bone" claim is not supported.</b> Higher protein intake is associated with 11% fewer hip fractures.</p>
</div></details>

<details class="acc"><summary>Calcium & vitamin D — food first</summary><div>
<div class="tw"><table>
<thead><tr><th></th><th>Women 51–70</th><th>Women 71+</th><th>Upper limit</th></tr></thead><tbody>
<tr><td>Calcium</td><td><b>1,200 mg/day</b></td><td><b>1,200 mg/day</b></td><td>2,000 mg</td></tr>
<tr><td>Vitamin D</td><td><b>600 IU</b></td><td><b>800 IU</b></td><td>4,000 IU</td></tr>
</tbody></table></div>
<p class="xtiny">US figures (Institute of Medicine). UK targets differ — the British Menopause Society uses 700 mg calcium with normal bone density, 1,200 mg with osteopenia or osteoporosis, and 400 IU vitamin D. Don't mix the two sets.</p>
<p><b>Absorption is dose-dependent</b> — about 36% of a 300 mg dose versus 28% of a 1,000 mg dose. Split calcium into portions of 500 mg or less.</p>
<h4>Calcium per serving</h4>
<div class="tw"><table><tbody>
<tr><td>Plain yogurt, 8 oz</td><td><b>415 mg</b></td></tr>
<tr><td>Frozen collard greens, 8 oz</td><td><b>360 mg</b></td></tr>
<tr><td>Sardines with bones, 3 oz</td><td><b>325 mg</b></td></tr>
<tr><td>Low-fat yogurt, 6 oz</td><td><b>310 mg</b></td></tr>
<tr><td>Milk, or fortified soy/almond milk, 8 oz</td><td><b>~300 mg</b></td></tr>
<tr><td>Cooked kale, 1 cup</td><td>94 mg</td></tr>
</tbody></table></div>
<div class="callout warn"><span class="ctitle">Supplements are not a shortcut to fewer fractures</span>
The US Preventive Services Task Force recommends <b>against</b> up to 400 IU vitamin D with up to 1,000 mg calcium for primary fracture prevention in community-dwelling postmenopausal women — the WHI found no fracture benefit and more kidney stones. Higher doses: inconclusive. This does <b>not</b> apply if you have osteoporosis, a previous fragility fracture, or documented deficiency.
<p>Separately, the 2024 Endocrine Society guideline <b>recommends against routine vitamin D blood testing in healthy adults</b> and suggests against dosing above the recommended intake under age 75. No target blood level has been validated against outcomes.</p></div>
</div></details>

<details class="acc"><summary>Dietary patterns — what each one is actually good for</summary><div>
<ul class="tick">
  <li><b>Mediterranean</b> — in menopausal women specifically, benefits for weight, blood pressure, triglycerides, total and LDL cholesterol. ${EV.strong} for cardiometabolic outcomes. <b>Do not expect it to reduce hot flashes</b> — dietary modification for vasomotor symptoms is rated not recommended.</li>
  <li><b>DASH-style, lower sodium</b> — endorsed by the American Heart Association for this life stage alongside 150+ min/week of activity, targeting low central adiposity and preserved muscle. ${EV.strong} for blood pressure.</li>
  <li><b>Low-fat plant-based plus soy</b> — one trial (WAVS, 84 women, 12 weeks) with a low-fat vegan diet plus half a cup of cooked soybeans daily: moderate-to-severe hot flashes fell <b>88% versus 34%</b> in controls, weight −3.6 kg versus −0.2 kg. ${EV.moderate}
    <div class="callout warn">This is the strongest dietary signal for hot flashes that exists, and it is still <b>one small unblinded trial</b> in participants recruited expecting a soy benefit — and the presumed mechanism didn't correlate with improvement. Effect sizes rivalling oestrogen warrant scepticism until replicated blind. Worth trying; not established.</div></li>
</ul>
<h4>Fibre</h4>
<p>Adequate intake is <b>21 g/day for women 51+</b> (25 g for 31–50), or 14 g per 1,000 calories. Average US intake is about 17 g — roughly half of some targets. Increase gradually; going fast causes bloating. Some menopause reviews suggest 30–45 g, but that's narrative-review advice rather than a formal recommendation.</p>
<p class="tiny"><b>Ultra-processed food:</b> in adults over 50, the highest versus lowest intake quintile was associated with 1.5× the odds of osteopenia or osteoporosis. Observational — diet quality tracks with bone outcomes, which isn't the same as causing them.</p>
<p class="tiny"><b>The "estrobolome":</b> mechanistically interesting, and there is no randomised trial showing a microbiome intervention improves menopausal symptoms. Be sceptical of probiotics marketed on this basis.</p>
</div></details>

<details class="acc"><summary>Alcohol — the real reason to cut back</summary><div>
<div class="callout alert"><span class="ctitle">Breast cancer, not hot flashes</span>
<p>There is no safe threshold; risk begins at the first drink. Pooled relative risk: <b>1.05 at half a drink a day, 1.10 at one, 1.18 at two, 1.22 at three.</b> The 2025 National Academies review concluded that up to one drink a day in women is associated with about <b>10% higher</b> breast cancer risk. The Million Women Study found ~12% higher risk per additional daily drink. Alcohol is a Group 1 carcinogen.</p>
<p>US dietary guidance published in January 2026 moved away from advising people to drink in moderation and toward advising them to <b>drink less</b>.</p></div>
<p>For context from the hormone-therapy risk table: alcohol at 4–6 units/day adds about <b>8</b> extra breast cancers per 1,000 women aged 50–59 over five years — the same order as combined hormone therapy, which women agonise over far more.</p>
<p><b>On alcohol, caffeine and spicy food as hot flash triggers:</b> the Menopause Society states there are <i>no clinical trials</i> assessing whether avoiding triggers relieves symptoms. The most-cited caffeine finding is cross-sectional, and its own authors said they couldn't advise patients without further study. Cut alcohol for breast cancer risk, sleep quality and calories — those are solid. Treat trigger-hunting as a personal experiment, and use the 2-week trigger test in Tools to do it properly.</p>
</div></details>

<details class="acc"><summary>Energy needs, and why crash dieting backfires</summary><div>
<p>See <b>Weight & body composition</b> for the full picture. The short version: adjusted resting energy expenditure declines with <b>age</b>, not menopausal status (7 kcal/day difference, p=0.78). Because resting metabolism tracks lean mass, <b>losing muscle is the actual mechanism by which restriction lowers your metabolism</b>.</p>
<p><b>Defensible approach:</b> a modest deficit of roughly 300–500 kcal/day, protein at 1.2 g/kg or above, resistance training 2–3×/week, aiming for <b>0.5–1 kg (1–2 lb) per week</b>. A 5% loss already improves blood pressure, lipids and glucose, and slower loss predicts better maintenance.</p>
<p class="tiny">We deliberately publish no menopause-specific calorie number. No guideline supports one, and "1,200 calories" is a number from nowhere.</p>
</div></details>

<details class="acc"><summary>Iron, B12, sodium — small things worth getting right</summary><div>
<ul class="tick">
  <li><b>Iron:</b> the RDA drops from 18 mg/day (ages 19–50) to <b>8 mg/day at 51+</b>. Older adults are more likely to be in chronic positive iron balance than deficient. <b>Don't take routine iron once periods stop</b> — and iron deficiency after menopause should be investigated medically, not supplemented away, because it can signal gastrointestinal bleeding.</li>
  <li><b>B12:</b> 2.4 µg/day. Status is impaired by atrophic gastritis, metformin, acid-reducing medication and fully plant-based diets — worth asking about if any apply.</li>
  <li><b>Magnesium:</b> RDA 320 mg/day. Claims that it fixes hot flashes, anxiety or cramps in menopause are weak at best.</li>
  <li><b>Sodium:</b> the lever with real blood-pressure evidence is a DASH-style, reduced-sodium pattern.</li>
</ul>
</div></details>`;

/* ---------------- Exercise ---------------- */
const EXERCISE_HTML = `
<div class="callout ok"><span class="ctitle">The weekly target</span>
<b>150–300 min</b> moderate aerobic activity (or 75–150 vigorous), <b>plus strength training on 2+ days</b> covering all major muscle groups, plus <b>balance work</b>. That's the US Physical Activity Guidelines figure, and UK guidance matches it. The menopause-specific emphasis is on resistance, impact, balance and pelvic floor.</div>
<p class="xtiny">There is no menopause-specific ACSM position stand — anyone citing one is inventing it. What follows is the general adult guideline plus the menopause-relevant evidence.</p>

<details class="acc" open><summary>Strength training — the non-negotiable one</summary><div>
<p>From 101 randomised trials in 5,697 postmenopausal women:</p>
<div class="tw"><table>
<thead><tr><th>Outcome</th><th>Aerobic</th><th>Resistance</th><th>Both</th></tr></thead><tbody>
<tr><td>Body fat %</td><td>−1.68</td><td>−1.20</td><td><b>−2.24</b></td></tr>
<tr><td>Lean mass (kg)</td><td>—</td><td><b>+0.90</b></td><td>+0.68</td></tr>
<tr><td>Waist (cm)</td><td><b>−2.30</b></td><td>—</td><td>−1.66</td></tr>
</tbody></table></div>
<p>The authors' summary: aerobic training works on fat loss, resistance training works on muscle gain. <b>Do both.</b></p>
<p><b>Dose:</b> 3 sessions a week beat 2 for grip strength (+3.18 kg vs +1.42 kg) in older adults with sarcopenia. Higher loads beat moderate and low loads for strength.</p>
<h4>A starter programme</h4>
<ul class="tick">
  <li><b>2–3 sessions/week</b>, 48 hours between sessions for the same muscles</li>
  <li><b>6–8 compound movements:</b> a squat pattern, a hip hinge, a push, a pull, a carry, hip abduction, calf raise</li>
  <li><b>2–3 sets of 8–12 reps</b></li>
  <li><b>Load:</b> heavy enough that the last 1–2 reps are genuinely hard</li>
  <li><b>Progress</b> load or reps weekly — progressive overload is the entire mechanism</li>
</ul>
<p class="tiny">During a symptom flare — bad sleep, heavy night sweats — keep the <i>frequency</i> and cut volume or load. If time or energy is short, do the resistance session and skip the cardio: muscle is the asset most at risk. (Sensible practice; not from a trial.)</p>
</div></details>

<details class="acc"><summary>Bone loading — and when NOT to do it</summary><div>
<p>Best evidence for bone density, from a network meta-analysis of 49 trials in 3,360 postmenopausal women: <b>aerobic plus resistance combined</b> ranked first for both lumbar spine and femoral neck, ahead of either alone.</p>
<p><b>The LIFTMOR trial</b> is the famous one: postmenopausal women with low bone density did 8 months of twice-weekly, 30-minute sessions of deadlift, overhead press and back squat at <b>5 sets of 5 reps above 80–85% of maximum</b>, plus jumping chin-ups with drop landings — gaining about <b>4% spine and 2% femoral neck</b> density versus controls.</p>
<div class="callout alert"><span class="ctitle">Two caveats that get left out</span>
<p><b>1. It was fully supervised</b> by exercise scientists and physiotherapists, maximum 8 participants per instructor, with a first month of bodyweight familiarisation.</p>
<p><b>2. Participants were heavily screened.</b> Of about 568 applicants, 101 enrolled — 305 of 406 screened were excluded for contraindications. <b>This is not a self-guided home programme.</b> We could not obtain the trial's official adverse-event table, and secondary sources report injuries in people attempting it unsupervised.</p></div>
<h4>Gate the intensity by your bone status</h4>
<div class="tw"><table>
<thead><tr><th>Situation</th><th>Approach</th></tr></thead><tbody>
<tr><td>Normal or low-ish density, no fracture history</td><td>Progressive heavy loading and impact are the highest-yield bone stimuli. Get coached on form first.</td></tr>
<tr><td><b>Osteoporosis, prior vertebral fracture, or you don't know your status</b></td><td>Moderate loads, <b>no high-impact activity</b>, and no loaded spinal flexion. Ask for a physiotherapy referral.</td></tr>
</tbody></table></div>
<h4>If you have osteoporosis or a past fracture — the "Too Fit To Fracture" rules</h4>
<ul class="tick">
  <li>Resistance training <b>2+ days/week, 8–12 reps, 1–3 sets</b> — prioritise <b>form and alignment over intensity</b></li>
  <li>Balance training <b>daily, 15–20 minutes</b> (about 2 hours a week cumulatively)</li>
  <li>Aerobic 150 min/week <b>moderate</b>; avoid jumping, jogging, running</li>
  <li><b>Avoid rapid, repetitive, weighted or end-range spinal twisting and bending.</b> Hip-hinge instead of rounding the spine; step to turn instead of twisting the trunk; <b>don't lift from the floor — lift from knee height or above</b></li>
  <li>Get a physiotherapy referral for pain, multiple fractures or a rounded upper back</li>
</ul>
<p class="tiny">The UK "Strong, Steady and Straight" consensus deliberately counterbalances fear-based messaging: physical activity is not associated with significant harm including vertebral fracture, and people with osteoporosis should be encouraged to do <i>more</i> rather than less. Both things are true — the specifics are what keep you safe.</p>
</div></details>

<details class="acc"><summary>Balance & fall prevention</summary><div>
<p>The US Preventive Services Task Force gives exercise interventions a <b>Grade B</b> for preventing falls in community-dwelling adults 65+ at increased risk. Across 29 trials, falls fell about <b>15%</b> (incidence rate ratio 0.85).</p>
<p><b>What the effective programmes contained:</b> gait, balance and functional training (30 of 37 trials), strength work (25 of 37), some three-dimensional movement like tai chi or dance. The commonest dose was <b>2–3 supervised group sessions a week for a year</b>.</p>
<p><b>To do at home:</b> progress from static holds (feet together, semi-tandem, single-leg — hold a counter, then a fingertip, then nothing) to dynamic work (tandem walking, heel-to-toe, head turns while walking, tai chi). Little and often beats one long session.</p>
</div></details>

<details class="acc"><summary>Pelvic floor training — the best-evidenced thing on this page</summary><div>
<p>Cochrane review, 31 trials, 1,817 women across 14 countries:</p>
<div class="tw"><table>
<thead><tr><th></th><th>Trained</th><th>Control</th></tr></thead><tbody>
<tr><td><b>Stress incontinence — cured</b></td><td><b>56%</b></td><td>6%</td></tr>
<tr><td>Stress incontinence — cured or improved</td><td><b>74%</b></td><td>11%</td></tr>
<tr><td>Any incontinence — cured</td><td><b>35%</b></td><td>6%</td></tr>
<tr><td>Any incontinence — cured or improved</td><td><b>67%</b></td><td>29%</td></tr>
</tbody></table></div>
<p>Roughly one fewer leak per 24 hours, higher satisfaction, and adverse events rare and minor.</p>
<h4>Technique — this is where it goes wrong</h4>
<p>A correct contraction is a <b>lift and squeeze</b> of the pelvic floor: <b>no breath-holding</b>, no clenching your buttocks, inner thighs or abdominals, and <b>full relaxation between contractions</b>. Many women contract incorrectly on the first attempt — which is the main argument for being taught rather than guessing.</p>
<p class="xtiny">The Cochrane review didn't standardise one protocol, so we won't invent a sets-and-reps prescription and attribute it to them. Ask a pelvic floor physiotherapist for yours.</p>
<div class="callout info"><span class="ctitle">See a pelvic floor physiotherapist if</span>
No improvement after about 3 months of self-directed training · you can't identify the contraction · prolapse symptoms (heaviness, bulging) · pelvic pain or pain with sex · urgency or mixed incontinence.</div>
</div></details>

<details class="acc"><summary>What exercise does — and doesn't do — for symptoms</summary><div>
<div class="tw"><table>
<thead><tr><th>Outcome</th><th>Verdict</th></tr></thead><tbody>
<tr><td><b>Depressive symptoms</b></td><td><b>Large benefit</b> — SMD −1.04. Mind-body forms (yoga, tai chi) −1.28 beat aerobic −0.88; individual −1.43 beat group −0.91; 60–90 min sessions −1.70; bigger in perimenopause (−1.56) than postmenopause (−0.93). Heterogeneity across the 16 trials was very high (I²=93%), so read the direction rather than the exact number. ${EV.moderate}</td></tr>
<tr><td><b>Insomnia severity</b></td><td><b>Yes</b> — SMD −0.91, concentrated in women who actually have a sleep problem. ${EV.strong}</td></tr>
<tr><td>General sleep quality</td><td>No significant effect overall (17 trials). ${EV.none}</td></tr>
<tr><td><b>Hot flashes</b></td><td><b>Do not expect benefit.</b> Cochrane reviews found insufficient or poor evidence; pooled improvements were smaller than other interventions. Yoga: limited benefit versus exercise, none versus no treatment. ${EV.none}</td></tr>
<tr><td>Brain fog</td><td>Not established as exercise-responsive. The indirect case is that cardiovascular risk factors accelerate processing-speed decline. ${EV.mixed}</td></tr>
<tr><td>Bone, muscle, waist, heart, blood pressure, lipids, glucose, fall risk</td><td><b>Well established.</b> ${EV.strong}</td></tr>
</tbody></table></div>
<p>Read that table carefully. "Exercise doesn't stop hot flashes" is not "exercise doesn't matter" — it's the single most valuable and most distorted finding in this space.</p>
</div></details>`;

/* ---------------- Weight ---------------- */
const WEIGHT_HTML = `
<div class="callout info"><span class="ctitle">The one sentence that reframes this</span>
<b>The scale can stay flat while your body composition gets worse.</b> MRI studies found significant visceral fat gain despite no change in weight or waist circumference. That's why this app tracks waist as well as weight.</div>

<details class="acc" open><summary>What actually happens</summary><div>
<ul class="tick">
  <li>Total weight rises fairly linearly with age — about <b>1.5 lb/year</b> through the 50s, roughly 12 lb over the 8 years around menopause, independent of starting size or ethnicity.</li>
  <li><b>Fat gain doubles in rate</b> starting ~2 years before the final period, with simultaneous lean-mass decline, flattening ~2 years after.</li>
  <li>Visceral fat rises from <b>5–8% to 15–20%</b> of body fat: +8.2%/year in the 2 years before the final period, +5.8%/year after. (Figures vary between cohorts and between the way bodies report them — some quote a share of body weight rather than of body fat.)</li>
  <li>Trunk fat +36%, subcutaneous abdominal fat +22% postmenopause versus premenopause.</li>
</ul>
<p><b>Ageing or hormones?</b> Honestly, both — but split by outcome. <b>Total weight gain</b> looks largely age- and lifestyle-driven; hormone therapy users gained comparably in prospective studies, and adjusted resting metabolism tracks age not menopausal status. <b>Fat distribution</b> shows a menopause-specific signal beyond ageing, and metabolic syndrome clustering increases beyond what chronological ageing explains.</p>
</div></details>

<details class="acc"><summary>What works</summary><div>
<ul class="tick">
  <li><b>Resistance training for lean mass, aerobic for fat and waist, both for both.</b> Resistance training: +0.90 kg lean mass across 101 trials.</li>
  <li><b>Protein at 1.2 g/kg or more, evenly distributed</b> — especially in a deficit, where it meant 26% versus 34% of loss coming from lean tissue.</li>
  <li><b>Modest deficit, 0.5–1 kg per week.</b> A 5% loss already improves blood pressure, lipids and glucose; slower loss predicts better maintenance.</li>
  <li><b>Cutting alcohol</b> — for breast cancer risk, sleep and calories.</li>
  <li><b>Fixing sleep</b> — poor sleep and untreated apnea are on the causal path to weight gain and visceral fat accumulation.</li>
  <li><b>Bonus:</b> behavioural weight loss also improved hot flashes. In a trial of 338 women, an intensive programme lost 7.5 kg versus 2.0 kg, with 2.25× greater odds of hot flash improvement; per 5 kg lost, OR 1.32; per 5 cm of waist, OR 1.32. Notably, changes in activity and calories alone were <i>not</i> associated with flush improvement — the weight loss was.</li>
</ul>
<p class="tiny"><b>Hormone therapy and body composition:</b> users show fat profiles closer to premenopausal women and less visceral fat in cohort data — but it did <b>not</b> prevent weight gain in prospective studies, and no society endorses it for weight management. It may modestly favour where fat sits. It is not a weight-loss treatment.</p>
</div></details>

<details class="acc"><summary>Why waist matters more than BMI</summary><div>
<p>The International Atherosclerosis Society consensus argues waist circumference should be treated as a <b>vital sign</b>. When waist and BMI are modelled together, <b>waist stays predictive while BMI becomes unrelated or even inversely related</b> to mortality. A 10% larger waist meant 1.48× higher mortality after adjusting for BMI; in coronary artery disease, 2.05×.</p>
<p>And diet and exercise reduce waist <b>with or without weight loss</b> — one large trial found about 5 cm of reduction versus control across intervention arms.</p>
<h4>Thresholds for women</h4>
<div class="tw"><table><tbody>
<tr><td>At normal weight</td><td>≥ <b>80 cm</b> (31.5 in)</td></tr>
<tr><td>At overweight</td><td>≥ <b>90 cm</b> (35.4 in)</td></tr>
<tr><td>Class I obesity</td><td>≥ 105 cm (41.3 in)</td></tr>
</tbody></table></div>
<p class="xtiny">Ethnicity-specific single cut-points for women include ≥80 cm for Chinese and Asian Indian women, ≥85 cm Korean and Tunisian, ≥90 cm Japanese.</p>
<h4>How to measure it consistently</h4>
<ul class="tick">
  <li>At the top of the hip bone, <b>or</b> midway between your lowest rib and hip bone — the two differ by about 2 cm in women, so <b>pick one and always use it</b></li>
  <li>Bare skin, tape snug but not compressing, at the end of a normal exhale, standing relaxed</li>
  <li>Self-measurement correlates well (r = 0.8–0.9) but typically <b>underestimates by 1–3 cm</b> — that's fine, because you're tracking change, not competing with a clinic</li>
</ul>
</div></details>

<details class="acc"><summary>GLP-1 medications — factual notes only</summary><div>
<p>These are physician-managed prescription treatments. This app has no view on whether you should take one, and no dosing information.</p>
<ul class="tick">
  <li>Weight loss in older adults: about <b>10–15%</b> with semaglutide in women 65+, sustained over two years; <b>15–21%</b> with tirzepatide in older adults.</li>
  <li><b>Lean mass:</b> roughly <b>25–40% of the weight lost is lean tissue</b> — which matters more if you already carry menopause- and age-related sarcopenia risk. In one study lean mass fell about 3 kg then stabilised, while sarcopenic obesity prevalence actually <i>fell</i> from 49% to 33% at 12 months. So the net effect can be favourable even with absolute lean loss.</li>
  <li><b>The mitigation is exactly what this app pushes anyway:</b> resistance exercise 150 min/week across 2–3 sessions with progressive overload, and protein 1.2–1.5 g/kg/day evenly distributed and leucine-rich.</li>
  <li>There is <b>no menopause-specific trial</b> of these drugs, and no evidence they treat menopausal symptoms. Don't let anyone imply otherwise.</li>
</ul>
</div></details>`;

/* ---------------- Skin ---------------- */
const SKIN_HTML = `
<div class="callout ok"><span class="ctitle">If you do only four things</span>
<b>Sunscreen. A retinoid. A well-formulated vitamin C. A barrier-repair moisturiser.</b> Those four carry the best data. Add an AHA for texture and pigment. Everything else is optional.</div>

<details class="acc" open><summary>The evidence tiers</summary><div>
<h4>Tier 1 — real randomised evidence ${EV.strong}</h4>
<div class="tw"><table>
<thead><tr><th>Ingredient</th><th>What the trials show</th></tr></thead><tbody>
<tr><td><b>Tretinoin</b> (prescription)</td><td>Meta-analysis of 8 trials, 1,361 people, 16 weeks to 2 years: significant improvement in both fine and coarse wrinkles.</td></tr>
<tr><td><b>Retinol</b> (over the counter)</td><td>0.3% for 12 weeks significantly reduced wrinkle depth, with less irritation than tretinoin. <b>Retinoids of any kind are not for use in pregnancy or while trying to conceive.</b></td></tr>
<tr><td><b>Sunscreen</b></td><td>The only primary-prevention trial: 903 adults, 4.5 years, daily broad-spectrum SPF 15+ versus discretionary use → <b>24% less photoaging</b> by objective measurement. It slows accumulation; it doesn't reverse damage.</td></tr>
<tr><td><b>Vitamin C</b></td><td>L-ascorbic acid at <b>10–15%, pH below 3.5</b>. Combined with vitamin E and ferulic acid has the best stability and photoprotection data. 5% daily for 6 months significantly reduced deep wrinkles.</td></tr>
<tr><td><b>AHAs</b></td><td>10% glycolic acid for 12 weeks significantly improved roughness, dark spots and fine lines. Needs sun protection alongside.</td></tr>
<tr><td><b>Ceramide moisturiser</b></td><td>Targets the documented menopausal defect directly: stratum corneum ceramides are fewer and shorter-chained, water loss is up.</td></tr>
</tbody></table></div>
<h4>Tier 2 — moderate or limited ${EV.moderate}</h4>
<ul class="tick">
  <li><b>Bakuchiol</b> — 0.5% twice daily versus retinol 0.5% once daily over 12 weeks (44 people): both reduced wrinkle area and pigmentation with <b>no statistical difference</b>, and retinol caused more scaling and stinging. One small trial — promising and better tolerated, not proven equivalent.</li>
  <li><b>Niacinamide</b> — reasonable evidence for barrier support and pigmentation, modest for wrinkles.</li>
  <li><b>Peptides</b> — supportive but modest; copper tripeptide-1 improved wrinkle depth and elasticity in small, short studies.</li>
  <li><b>Coenzyme Q10</b> — trials exist but most were under 50 people and industry-sponsored.</li>
</ul>
<h4>Tier 3 — skip, or at least don't pay a premium ${EV.mixed}</h4>
<ul class="tick">
  <li><b>Topical growth factors</b> — not listed among evidence-based actives in general reviews; treat as unproven.</li>
  <li><b>Exosomes</b> — largely experimental: no standardised products, no long-term safety, no robust clinical evidence.</li>
  <li><b>Botanical polyphenols</b> (EGCG, resveratrol, curcumin) — predominantly preclinical.</li>
  <li><b>Topical phytoestrogens</b> — clinical evidence limited and heterogeneous.</li>
  <li><b>Oral collagen</b> — see Supplements. The benefit vanishes in high-quality, non-industry-funded trials.</li>
</ul>
<p class="xtiny">Useful context: the FDA does not recognise "cosmeceutical" as a category. A product making genuine therapeutic claims would be regulated as a drug — which is precisely why anti-ageing marketing language is so carefully hedged.</p>
</div></details>

<details class="acc"><summary>A routine you can actually keep</summary><div>
<h4>Morning</h4>
<ul class="tick">
  <li>Gentle cleanse — or just water if skin is dry</li>
  <li><b>Vitamin C</b> serum (optional but well-evidenced)</li>
  <li>Moisturiser with ceramides</li>
  <li><b>Broad-spectrum SPF 30+, every day</b>, reapplied if you're outside (the prevention trial used SPF 15+; 30+ is the common practical floor)</li>
</ul>
<h4>Evening</h4>
<ul class="tick">
  <li>Cleanse</li>
  <li><b>Retinoid</b> — start twice a week, build to nightly over 8–12 weeks. Pea-sized amount for the whole face. Buffer with moisturiser if it stings. <b>Not if you are pregnant or trying to conceive.</b></li>
  <li>Moisturiser (apply over the retinoid on nights it's irritating)</li>
  <li>An AHA on 1–2 nights instead of the retinoid, if texture or pigment is your concern</li>
</ul>
<div class="callout info"><span class="ctitle">Two expectations to set</span>
Give a retinoid about <b>12 weeks</b> before you judge it — the trials ran 12 weeks and longer — and expect purging and flaking first. Sunscreen prevents rather than repairs — its payoff is the photo you don't take in ten years.</div>
</div></details>

<details class="acc"><summary>Specific conditions</summary><div>
<h4>Adult acne</h4>
<p>Affects around 15% of women, driven by relative androgen excess plus falling oestrogen; more truncal and lower-face, milder but on more reactive skin, so more lingering redness and marks.</p>
<p><b>Spironolactone has good trial evidence</b> — the SAFA trial (50 mg/day rising to 100 mg, 342 women): participant-reported improvement <b>82% versus 63%</b> at 24 weeks, with headache more common (20% vs 12%) and no serious adverse events. Note the mean age in that trial was 29 — extrapolating to your 50s is mechanistically reasonable but not directly tested. Prescription only, and <b>not for use in pregnancy or while trying to conceive</b>.</p>
<h4>Melasma</h4>
<p>Sun protection is foundational and non-negotiable. Tranexamic acid (oral, topical or intradermal) has meta-analytic support, and combination regimens consistently reduce severity. We're not publishing concentrations or doses — this one really needs a dermatologist.</p>
<h4>Rosacea</h4>
<p>Often worsens through menopause: impaired barrier, more vascular reactivity, microbiome shifts including more <i>Demodex</i>, and UV damage — producing more persistent redness, flushing and visible vessels, particularly overlapping with hot flashes.</p>
<h4>Itch and crawling sensations</h4>
<p>Partly mechanical (dryness), partly neuroinflammatory — oestrogen deficiency is associated with increased skin nerve fibre density and upregulated type-2 cytokine pathways, which heightens itch sensitivity. Vulvar itching and soreness reflect epithelial thinning, less lubrication and more fragile blood vessels — and respond to the treatments in the Intimacy module.</p>
<p class="xtiny">On formication (the crawling-skin sensation): widely reported, and we found no quality source. We won't quantify it.</p>
<h4>Facial hair</h4>
<p>Laser, electrolysis, topical eflornithine and anti-androgens all exist and are clinician-directed. <b>Rapid-onset hair growth or deepening voice needs prompt evaluation</b> — that pattern can signal an androgen-producing tumour.</p>
</div></details>

<details class="acc"><summary>Hair thinning</summary><div>
<p>Female pattern hair loss is common after menopause — one 2026 dermatology review puts it at around half of postmenopausal women, though we could not reach the underlying prevalence studies, so hold that figure loosely. The growth phase shortens, follicles miniaturise, density drops. Risk factors: genetics, age, time since menopause, higher BMI, more scalp oil.</p>
<h4>What works — from a 2026 clinical review</h4>
<ul class="tick">
  <li><b>Topical minoxidil, first line:</b> 2% solution twice daily <b>or</b> 5% foam once daily. Mean benefit 42 out of 100 on a visual analogue scale. <b>Takes 6–12 months.</b> Expect transient shedding at the start; it is a documented early effect rather than a sign it is not working.</li>
  <li><b>Oral spironolactone:</b> increased hair density in 43% of users in a systematic review. Prescription.</li>
  <li><b>Second line:</b> oral minoxidil, finasteride, low-level laser, PRP, oral contraceptives; combinations may add benefit.</li>
  <li><b>Low-level laser devices:</b> meta-analysis of 7 double-blind trials (n=607) found real benefit versus sham (SMD 1.27; in women 1.36). Protocols ran 16–26 weeks, mostly 3–4×/week. Comb and helmet forms performed similarly.</li>
  <li><b>Most of these are contraindicated in pregnancy</b> — which matters if you are still perimenopausal and could conceive.</li>
  <li><b>Screen for anxiety and depression</b> — the psychological impact of hair loss is well established and worth naming.</li>
</ul>
<div class="callout warn"><span class="ctitle">You are probably being over-tested</span>
The clinical review says investigations like ferritin and thyroid function should be <b>reserved for when an alternative diagnosis is suspected</b>, and that androgen levels are usually normal and unhelpful. It does not support routine vitamin D testing. The popular "always check ferritin, TSH, vitamin D and zinc" panel is broader than the evidence supports. What <i>does</i> warrant a workup: sudden diffuse shedding, scalp symptoms, scarring, or systemic features.</div>
<p class="tiny"><b>No oral hair supplement</b> emerged as supported in that review. Save your money.</p>
</div></details>

<details class="acc"><summary>Facial oestrogen — proceed carefully</summary><div>
<p>Topical oestrogen does increase type I and III procollagen synthesis, and studies of methyl estradiol propanoate showed improvements in hydration, laxity and dullness. Systemic hormone therapy increases skin collagen, elasticity, thickness and hydration — but it is <b>not indicated for skin alone</b>.</p>
<div class="callout warn">There is <b>no FDA-approved topical oestrogen for facial skin ageing</b>. The limiting concern is systemic absorption and its consequences. This is a fast-growing, largely compounded, off-label market, and two 2025 systematic reviews on it were paywalled to us — so we are being deliberately conservative. Discuss with a dermatologist rather than ordering a compounded cream online.</div>
</div></details>

<details class="acc"><summary>Nails</summary><div>
<p>Brittle nails affect up to 20% of people, more commonly women over 50, fingernails more than toenails. Most cases are idiopathic.</p>
<p><b>Rule out:</b> psoriasis, lichen planus, alopecia areata, fungal infection, systemic disease, nutritional deficiency, and repeated wet–dry cycling from work or cleaning.</p>
<p><b>Biotin 5–10 mg/day for 3–6 months</b> improved nail firmness in several studies — but they were small and poorly controlled. <b>Important:</b> high-dose biotin interferes with laboratory assays including thyroid tests and troponin, so tell any clinician ordering blood work.</p>
<p>Moisturisers combining occlusives with humectants (urea helps water binding) are recommended. Well-designed trials of topical nail products remain lacking.</p>
<p class="xtiny">We found no quality source linking nail changes to oestrogen decline specifically, so we don't assert one.</p>
</div></details>`;

/* ---------------- Sleep ---------------- */
const SLEEP_HTML = `
<div class="callout info"><span class="ctitle">Why this module leads with CBT-I and not a checklist</span>
In the best menopause-specific trial (150 postmenopausal women with chronic insomnia), <b>sleep hygiene education alone produced 4% remission.</b> CBT-I produced <b>54%</b> at the end of treatment and <b>68% at six months</b>, with 40–43 more minutes of sleep a night. Sleep hygiene is not a treatment. This is.</div>

<details class="acc" open><summary>Step 1: work out which problem you have</summary><div>
<div class="tw"><table>
<thead><tr><th>What it looks like</th><th>What it probably is</th><th>First move</th></tr></thead><tbody>
<tr><td>Night sweats wake you, soaked</td><td>Vasomotor fragmentation</td><td>Treat the flashes (clinician). Cool the room for comfort — not as a flash treatment</td></tr>
<tr><td>Dry, wide awake, mind racing, can't get back to sleep</td><td>Insomnia disorder</td><td><b>CBT-I</b> — below</td></tr>
<tr><td>Snoring, pauses, morning headache, unrefreshing sleep, night-time urination, blood pressure that won't budge, or CBT-I doesn't work</td><td><b>Possible sleep apnea</b></td><td>Ask to be tested</td></tr>
</tbody></table></div>
<div class="callout alert"><span class="ctitle">Don't skip the apnea question</span>
Moderate-to-severe sleep-disordered breathing affects <b>20%</b> of midlife women versus 4% of younger women, rising about 4% per additional year of menopausal progression. It is badly underdiagnosed in women, because women present with insomnia, fatigue, morning headache and low mood rather than the classic snoring picture — and it all gets attributed to menopause. Surgical menopause raises risk independently (bilateral oophorectomy HR 1.43).</div>
</div></details>

<details class="acc"><summary>CBT-I: the two components that do the work</summary><div>
<p>The American Academy of Sleep Medicine is unambiguous: CBT-I should be the <b>initial</b> intervention for chronic insomnia, and medication considered mainly for those who can't do CBT-I, still have symptoms after it, or need a temporary adjunct.</p>
<h4>1. Sleep restriction — the effective and counterintuitive part</h4>
<ul class="tick">
  <li>Track your <b>actual</b> sleep for a week (this app's sleep log does it)</li>
  <li>Set your time in bed to roughly your <b>average actual sleep time</b>, with a floor of about 5–5.5 hours</li>
  <li><b>Fix your wake time</b> and don't move it, regardless of how the night went</li>
  <li>When sleep efficiency exceeds about 85–90%, extend time in bed by 15–30 minutes</li>
  <li>Expect to feel <b>worse for the first week or two</b> — that's the mechanism, not a failure</li>
</ul>
<div class="callout alert"><span class="ctitle">Do not do sleep restriction unsupervised if</span>
You have bipolar disorder, a seizure disorder, or untreated sleep apnea. Sleep deprivation is a trigger in all three. Work with a clinician instead.</div>
<h4>2. Stimulus control — rebuilding "bed means sleep"</h4>
<ul class="tick">
  <li>Bed is for sleep and sex only. No phone, no work, no TV.</li>
  <li>If you're awake and frustrated, <b>get out of bed</b>. Go somewhere dim and dull. Return when sleepy — not when it feels like you should.</li>
  <li><b>No clock-watching.</b> Turn it away from you.</li>
  <li>Same wake time every day, including weekends.</li>
</ul>
<h4>Plus</h4>
<p>Challenging catastrophic sleep thoughts ("if I don't sleep, tomorrow is ruined" — usually untrue and always unhelpful), a genuine wind-down routine, and a sleep diary.</p>
<p><b>Remote delivery works.</b> Telephone-delivered CBT-I over 8 weeks in peri- and postmenopausal women beat menopause education, and the gains held at six months. Ask about digital CBT-I programmes if in-person access is hard.</p>
<p>Use the <b>Sleep window calculator</b> in Tools to set your starting schedule from your own logged data.</p>
</div></details>

<details class="acc"><summary>Temperature and night sweats</summary><div>
<p>Recommended bedroom temperature is <b>65–68°F (18.3–20°C)</b>. The physiology: core temperature starts dropping about two hours before sleep, the body dumps heat through the hands and feet, higher core temperature reduces deep sleep — and thermoregulation largely stops during REM, which is exactly when a warm room hurts most.</p>
<ul class="tick">
  <li>Blinds closed during the day; fan or air conditioning; cross-ventilation</li>
  <li>Layered bedding so you can shed one layer without waking fully; a separate lighter blanket if you share a bed</li>
  <li>Moisture-wicking sleepwear; water and a spare top within reach</li>
  <li>A <b>warm bath 1–2 hours before bed</b> — it sounds backwards but promotes cooling through vasodilation</li>
</ul>
<div class="callout warn">Framed honestly: this is <b>sleep-environment optimisation and comfort</b>. Cooling techniques are rated not recommended as a <i>treatment</i> for hot flashes — a larger trial found no objective change in the number or duration of night-time episodes. Make the room better because you'll sleep better in it, not because it will stop the flashes.</div>
</div></details>

<details class="acc"><summary>Sleep aids — what the guideline actually says</summary><div>
<p>From the American Academy of Sleep Medicine's clinical practice guideline. Note that <b>every</b> recommendation in it, including the positive ones, is graded "weak."</p>
<p><b>Recommended against</b> for insomnia: <b>melatonin, valerian, diphenhydramine</b> (the antihistamine in "PM" products), trazodone, L-tryptophan.</p>
<ul class="tick">
  <li><b>Melatonin's</b> better-supported use is circadian problems — jet lag, shift work — not menopausal insomnia.</li>
  <li><b>Antihistamines</b> are also anticholinergic: next-day cognitive dulling, dry mouth and eyes, urinary retention, constipation. Anticholinergic burden is associated with cognitive risk in older adults. Worth naming clearly for women in their 50s to 70s.</li>
  <li><b>Z-drugs</b> (zolpidem, eszopiclone, zaleplon) are only weakly suggested, prescription-only, and carry an FDA boxed warning for complex sleep behaviours. Short-term, clinician-managed adjuncts to CBT-I at most.</li>
  <li><b>Magnesium:</b> three small trials in older adults found falling asleep about <b>17 minutes faster</b>, with no significant change in total sleep time — certainty rated low to very low, all trials at moderate-to-high risk of bias. Cheap, low-risk, caution in kidney impairment. Not a substitute for CBT-I.</li>
</ul>
<p class="xtiny">Suvorexant appears in the AASM list for insomnia but is rated <i>not recommended</i> by the Menopause Society for hot flashes — different question, different answer.</p>
</div></details>`;

/* ---------------- Mind ---------------- */
const MIND_HTML = `
<div class="callout info"><span class="ctitle">The measurement caveat that matters</span>
Several symptoms of the menopause transition — broken sleep, fatigue, low libido, poor concentration — <b>also score points on depression questionnaires.</b> The perimenopausal depression guideline says so explicitly. A raised score here is a reason to talk to someone, not a diagnosis.</div>

<details class="acc" open><summary>The depression risk window</summary><div>
<p>Women are <b>2–4× more likely</b> to have a major depressive episode during the transition and early postmenopause. Elevated depressive symptoms were found in <b>45–68% of perimenopausal</b> versus 28–31% of premenopausal women. Early perimenopause carried 1.74× the odds — 2.45× in Hispanic women. A separate 2024 meta-analysis found ~40% higher odds in perimenopause and <b>no significant elevation postmenopause</b>.</p>
<p><b>Crucially:</b> most affected women have a prior history of depression. First-ever depression starting in perimenopause is less common.</p>
<h4>Highest risk</h4>
<p class="tiny">Prior depression · severe sleep disruption · severe hot flashes · high trait anxiety or a current anxiety disorder · past premenstrual mood symptoms or postpartum blues · financial difficulty · stressful life events · adverse childhood experiences · after hysterectomy (20–44% elevated risk) · primary ovarian insufficiency (54.5% lifetime prevalence) · Black race · younger age.</p>
<h4>Treatment, briefly</h4>
<ul class="tick">
  <li><b>SSRIs/SNRIs</b> first line; desvenlafaxine 50–200 mg/day has the largest trial base in this population</li>
  <li><b>CBT</b> effective, typically 16+ sessions, individual or group; <b>combined with medication may beat medication alone</b></li>
  <li><b>Transdermal oestradiol</b> has antidepressant effects in <i>perimenopausal</i> women with depression, and may prevent onset of depressive symptoms in perimenopausal women who aren't depressed — but it is <b>ineffective for established depression in postmenopausal women</b>, isn't approved for mood, and is best used when hot flashes coexist</li>
  <li><b>Oestrogen alone for postmenopausal depression: not recommended.</b> <b>Botanicals for depression: not recommended.</b></li>
</ul>
<p>Use the <b>PHQ-9</b> and <b>GAD-7</b> in Tools to track change over time and to bring numbers to an appointment.</p>
</div></details>

<details class="acc"><summary>Anxiety, irritability, rage</summary><div>
<p>Here is the honest position: these are among the most commonly described experiences of perimenopause and they dominate social media, but <b>the research base is much thinner than for depression.</b> We could not find a quality source quantifying incident anxiety-disorder risk, irritability or "menopause rage" attributable to the transition. Any specific percentage you see is likely invented.</p>
<p>What is documented: high trait anxiety and current anxiety disorders are risk factors for perimenopausal depression, and anxiety symptoms measurably impair cognitive performance during the transition.</p>
<p><b>What that means practically:</b> the contributors we can actually identify and treat are <b>broken sleep, symptom burden, and pre-existing anxiety</b>. Those are worth attacking directly rather than waiting for the feeling to pass.</p>
</div></details>

<details class="acc"><summary>Brain fog — and why it's reassuring</summary><div>
<p>See the symptom library for the full detail. The headline: in SWAN, women lost their usual practice-related improvement on memory and processing-speed tasks during perimenopause — and <b>regained it in early postmenopause</b>. The perimenopausal dip appears temporary.</p>
<p>Objective verbal memory decline emerged only after about <b>age 58</b>. Processing speed is the domain most affected, and it declines faster in women with cardiovascular risk factors.</p>
<p><b>Modifiable levers:</b> sleep, mood, blood pressure, lipids, glucose, activity. <b>Not</b> hormone therapy or testosterone, neither of which is indicated for cognition.</p>
<div class="callout warn"><span class="ctitle">Worth an evaluation</span>
Getting lost in familiar places · other people noticing your word-finding · trouble managing money or medication · steady worsening rather than fluctuation.</div>
</div></details>

<details class="acc"><summary>Techniques with actual evidence</summary><div>
<h4>Slow-paced breathing ${EV.moderate}</h4>
<p>Meta-analysis of randomised trials: <b>stress g = −0.35, anxiety g = −0.32, depression g = −0.40</b> — small-to-medium effects. Ten of twelve studies used <b>slow</b>-paced breathing and were significant; the two using fast-paced breathing were not. Worked individually, in groups, remotely and in person. No serious adverse events. The authors explicitly warn against "miscalibration between hype and evidence."</p>
<p>The mechanistic target is about <b>6 breaths per minute</b> — roughly 5 seconds in, 5 seconds out. There's a timer in Tools.</p>
<div class="callout alert"><span class="ctitle">The distinction most apps get wrong</span>
<b>Paced breathing is rated Level I NOT recommended for hot flashes</b> — larger trials found it no better than shallow breathing or usual care. So: breathe slowly for anxiety and stress, where it has evidence. Don't be told it stops hot flashes.</div>
<h4>Progressive muscle relaxation ${EV.moderate}</h4>
<p>Systematic review of 46 publications across 16 countries, over 3,400 adults: supportive results for stress (24 studies), anxiety (21) and low mood (11), with effect sizes ranging from small to very large. Sessions of <b>5–28 minutes</b> worked, and <b>session length didn't significantly affect outcomes</b> — so a short one counts. Effects improved when combined with music, mindfulness or deep breathing. There's a guided 10-minute sequence in Tools.</p>
<h4>Mindfulness / MBSR ${EV.moderate}</h4>
<p>Read the split carefully. Meta-analysis of 13 trials in 1,138 menopausal women: <b>stress significantly reduced (SMD −0.84)</b>; anxiety and depression not significant. A better-designed single trial (197 women, 8 weeks × 2.5 h, versus an active education control) found a real benefit on total symptom score (d = −0.49) <b>driven by the anxiety and depression subscales</b> — and <b>no effect on vasomotor, somatic or urogenital symptoms</b>.</p>
<p>So: mindfulness for stress and psychological symptoms, yes, honestly hedged. Mindfulness for hot flashes, no.</p>
<h4>Behavioural activation</h4>
<p>Doing valued things <i>before</i> you feel like it, rather than waiting for motivation. It's a core component of the CBT protocols the perimenopausal depression guideline endorses — which is how we frame it, rather than quoting a standalone effect size we couldn't verify.</p>
</div></details>

<details class="acc"><summary>Cortisol: what's real and what's being sold to you</summary><div>
<div class="callout alert"><span class="ctitle">"Adrenal fatigue" does not exist</span>
A systematic review screened 3,470 articles and included 58 studies using cortisol awakening response, salivary rhythms, dexamethasone suppression and ACTH testing. Findings were "almost systematically conflicting." The authors' conclusion is quotable: <b>"adrenal fatigue does not exist"</b> — there is "no substantiation that 'adrenal fatigue' is an actual medical condition." No endocrinology society recognises it.</div>
<p><b>Also not supported:</b> "cortisol face," cortisol detoxes, adaptogen stacks marketed on cortisol, and at-home salivary cortisol panels. Genuine cortisol excess — Cushing syndrome — is a rare, properly diagnosed endocrine disease with a specific constellation of findings. It is not something you assess from a selfie.</p>
<p><b>The useful position:</b> chronic stress is real and worth managing. Manage it with things that have trial evidence — CBT, exercise, slow breathing, progressive muscle relaxation, sleep repair — rather than testing or supplementing a hormone.</p>
</div></details>`;

/* ---------------- Sexual health ---------------- */
const SEX_HTML = `
<div class="callout warn"><span class="ctitle">The thing to know before anything else</span>
Genitourinary symptoms are <b>progressive</b>. They do not resolve the way hot flashes do — they become more prevalent the further past menopause you are. And they are highly treatable. Waiting is the only strategy that reliably fails.</div>

<details class="acc" open><summary>Options, and what the 2025 guideline says about each</summary><div>
<p class="tiny">From the first comprehensive multi-society guideline on genitourinary syndrome of menopause (urology, urogynaecology and female pelvic medicine societies, 2025).</p>
<div class="tw"><table>
<thead><tr><th>Option</th><th>Position</th></tr></thead><tbody>
<tr><td><b>Low-dose vaginal oestrogen</b></td><td><b>Strong Recommendation</b> for irritation, dryness and painful sex. <b>Moderate, Grade B</b> — the strongest evidence grade in the guideline — for reducing <b>recurrent UTIs</b>. No progestogen needed. Does not increase endometrial cancer risk.</td></tr>
<tr><td><b>Moisturisers and lubricants</b></td><td><b>Moderate Recommendation</b> — should be recommended, alone or alongside other treatment.</td></tr>
<tr><td><b>Vaginal DHEA (prasterone) 6.5 mg</b></td><td><b>Moderate Recommendation</b> for dryness and painful sex. More side effects than placebo (discharge in about 6%).</td></tr>
<tr><td><b>Ospemifene 60 mg oral</b></td><td><b>Conditional Recommendation</b> — the only oral option approved for dryness and moderate-to-severe painful sex. Carries a boxed warning for clots and stroke; hot flashes in 7.2% vs 2%.</td></tr>
<tr><td><b>Pelvic floor physiotherapy</b></td><td>Refer for pelvic floor dysfunction.</td></tr>
<tr><td><b>Vaginal laser, Er:YAG, radiofrequency</b></td><td><b>The evidence does NOT support these.</b> Experimental outside a trial. NICE: do not offer vaginal laser except within a randomised trial. May be considered only if approved treatments can't be tolerated, via shared decision-making.</td></tr>
<tr><td>Systemic testosterone for these symptoms</td><td>Evidence does not demonstrate efficacy for any genitourinary symptom.</td></tr>
<tr><td>"Alternative supplements"</td><td>Counsel patients that evidence does not support them. Also: avoid vulvovaginal irritants and cleansers.</td></tr>
</tbody></table></div>
<div class="callout alert"><span class="ctitle">On energy-based devices</span>
The FDA's safety communication states the safety and effectiveness of energy-based devices for vaginal "rejuvenation," menopause symptoms, incontinence and sexual function <b>has not been established</b>, and that they may be associated with serious adverse events. These procedures are expensive and unproven. Exhaust the proven options first.</div>
</div></details>

<details class="acc"><summary>Moisturiser vs lubricant — and how to choose one</summary><div>
<ul class="tick">
  <li><b>Moisturiser:</b> used <b>1–3× weekly</b>, adheres to the vaginal wall, improves hydration, tissue integrity and elasticity. It's ongoing tissue treatment.</li>
  <li><b>Lubricant:</b> immediate and temporary, for sex. Not a tissue treatment. You may want both.</li>
</ul>
<h4>The two numbers that matter</h4>
<p>WHO advisory parameters: <b>osmolality of 380 mOsm/kg or below is desirable</b> (up to 1,200 provisionally tolerable), and <b>pH 3.5–4.5</b>, the normal vaginal range. Hyperosmolar products pull water <i>out</i> of the epithelium and can make irritation worse — which is why some products sting.</p>
<ul class="tick">
  <li><b>Hyaluronic acid</b> moisturisers produced improvements in dryness and pH similar to local oestrogen in one study. Single study, so moderate confidence — but a reasonable non-hormonal option.</li>
  <li>Water-soluble lubricants had fewer genital side effects than silicone in one review.</li>
  <li><b>Oil-based products degrade latex condoms.</b></li>
</ul>
<p class="xtiny">We're not publishing an ingredient blacklist — the sourced, actionable criteria are osmolality and pH. Ask the manufacturer; reputable ones publish both.</p>
</div></details>

<details class="acc"><summary>Desire — what to address first</summary><div>
<p><b>Before hormones, work through this list</b> — every item is more common and more fixable than a testosterone deficiency:</p>
<ul class="tick">
  <li><b>Pain.</b> Pain suppresses desire. Untreated genitourinary symptoms are the single most common reversible cause. Treat the tissue first.</li>
  <li>Sleep deprivation</li>
  <li>Depression — and antidepressant side effects</li>
  <li>Relationship context, and a partner's sexual function</li>
  <li>Body image, stress, other medications, alcohol</li>
</ul>
<p><b>Testosterone:</b> the international consensus supports it for <b>hypoactive sexual desire disorder in postmenopausal women only</b>, after a full biopsychosocial assessment, with an average effect of about <b>one additional satisfying sexual event per month</b>. See Treatment options for monitoring requirements and the sharp US/UK access difference.</p>
<p><b>Psychosexual therapy</b> is a first-line, guideline-implied step — the consensus <i>requires</i> biopsychosocial assessment before testosterone, and in related conditions combined psychological plus physical approaches outperform either alone.</p>
</div></details>

<details class="acc"><summary>Pain with sex, tightness, dilators</summary><div>
<p>From a 2025 meta-analysis of 18 studies (863 women), success rates were: <b>combined psychosexual approaches 86%</b>, botulinum toxin 85%, <b>pelvic floor physiotherapy 85%</b>, CBT 82%, <b>dilator therapy 78%</b>. The conclusion: integrative, multidisciplinary approaches work best, especially combining psychological and physical therapies.</p>
<h4>The order that makes sense</h4>
<ol style="padding-left:20px;font-size:.88rem">
  <li><b>Treat the tissue first.</b> Untreated dryness causes pain, pain causes protective pelvic floor guarding, guarding causes more pain. Vaginal oestrogen or DHEA plus a low-osmolality moisturiser addresses the substrate.</li>
  <li><b>Add pelvic floor physiotherapy</b> — 85% success, and guideline-supported for referral.</li>
  <li><b>Dilators are an adjunct, not a standalone</b> (78%). Graded sizes, generous lubricant, <b>never push through pain</b>. Supervised programmes do better.</li>
</ol>
<div class="callout info"><span class="ctitle">See a specialist if</span>
Pain persists after 8–12 weeks of vaginal oestrogen plus lubricant · you can't tolerate penetration or a speculum · new or worsening pelvic pain · any bleeding · suspected vulvodynia or lichen sclerosus · symptoms of prolapse.
<p class="tiny" style="margin-top:6px">Ask for a menopause-certified clinician, a urogynaecologist, or a pelvic floor physiotherapist.</p></div>
</div></details>`;

/* ---------------- Screening ---------------- */
const SCREENING = [
  {id:'dxa', n:'Bone density (DEXA) scan', w:'Age 65+, or earlier if at increased fracture risk',
   d:'US Preventive Services Task Force (Jan 2025): screen all women 65+, and postmenopausal women under 65 who are at increased fracture risk, using risk tools like FRAX to decide who needs the scan. The Menopause Society adds: screen any woman with a fracture since menopause (excluding skull, face, ankle, fingers, toes), or any medical cause of bone loss. Consider before 65 if you weigh under 127 lb or have BMI under 21, a parent who fractured a hip, currently smoke, or are stopping oestrogen with other risk factors. Repeat interval: 5+ years if untreated and low-risk, sooner if within 5 years of menopause with a T-score below −1.5. US treatment thresholds: 10-year major fracture risk 20%+, or hip fracture risk 3%+.'},
  {id:'mammo', n:'Mammogram', w:'Every 2 years, ages 40–74',
   d:'US Preventive Services Task Force (April 2024), Grade B: biennial screening mammography for women 40–74. This changed from the 2016 version, which left ages 40–49 to individual decision. For women 75+ the evidence is insufficient. For dense breasts, evidence on supplemental ultrasound or MRI is also insufficient — worth discussing your options with your clinician. Note: screening intervals apply to women without symptoms. A new lump or skin or nipple change needs assessment regardless of when you were last screened.'},
  {id:'cervical', n:'Cervical screening', w:'Ages 30–65: every 3 or 5 years depending on test',
   d:'US Preventive Services Task Force: ages 30–65 — cytology every 3 years, OR high-risk HPV testing alone every 5 years, OR HPV plus cytology co-testing every 5 years. Over 65 with adequate prior screening: no further screening. After hysterectomy: the recommendation to stop applies only if you have <b>no cervix</b> and no history of high-grade changes. Some hysterectomies leave the cervix in place — sometimes called a subtotal or partial hysterectomy, though that phrase is used loosely — and if yours did, <b>you still need cervical screening</b>. Worth confirming which you had. Note this recommendation is currently under update, and the American Cancer Society updated its own guideline in 2025 to include self-collection, which the Task Force recommendation does not yet address. Confirm the current interval with your clinician.'},
  {id:'colon', n:'Colorectal cancer screening', w:'Start at 45',
   d:'US Preventive Services Task Force (2021): screen from age 45 (Grade B) through 75 (Grade A); ages 76–85 selectively. Options include annual stool FIT, stool DNA-FIT every 1–3 years, CT colonography every 5 years, flexible sigmoidoscopy every 5 years, or colonoscopy every 10 years.'},
  {id:'diabetes', n:'Prediabetes & type 2 diabetes', w:'Ages 35–70 with BMI 25+, every 3 years',
   d:'US Preventive Services Task Force (2021): screen adults 35–70 who are overweight (BMI 25+) or have obesity; consider from BMI 23+ in Asian Americans. Every 3 years if normal. The starting age was lowered from 40 to 35 in this update. Anyone with prediabetes should be offered or referred to preventive interventions.'},
  {id:'bp', n:'Blood pressure & lipids', w:'Ask your clinician for your interval',
   d:'The menopause transition is itself the inflection point for cardiovascular risk. The American Heart Association documents rising LDL cholesterol and apolipoprotein B, plus rising central and visceral fat with falling muscle mass — which raises risk even in women of normal body weight. Early postmenopausal women had 2.1× the odds of LDL at or above 130 mg/dL versus premenopause. Hot flashes are themselves associated with subclinical atherosclerosis and worse risk factors. Uncontrolled hypertension is a contraindication to hormone therapy. We are deliberately not publishing a screening interval here because we could not verify the current one directly — ask your clinician, and treat this transition as the window for prevention rather than a later problem.'},
  {id:'thyroid', n:'Thyroid — symptom-driven only', w:'Not a routine screen',
   d:'The US Preventive Services Task Force does not support screening asymptomatic adults for thyroid dysfunction. That said, thyroid disease is a legitimate differential for menopause-like symptoms — fatigue, weight change, mood change, hair loss, temperature intolerance. That is symptom-driven testing, which is different from screening. Worth raising if your picture does not fit.'},
  {id:'eye', n:'Dry eye & vision', w:'Mention it at your midlife check',
   d:'The Menopause Society recommended in October 2025 that clinicians incorporate dry-eye screening into routine midlife assessment, following a study of over 3,500 women that found dry eye disease in 57.4% of postmenopausal versus 53.2% of premenopausal women. Note the gap is small — the direction is plausible, causation is not established. There is no population screening recommendation for vision in this age group that we could verify.'}
];

/* ---------------- Red flags ---------------- */
const REDFLAGS = [
  {n:'Any vaginal bleeding 12+ months after your last period', why:'About <b>90% of women with endometrial cancer present with postmenopausal bleeding</b>. Incidence is rising 1–2% a year overall, and about 3% a year in Black women versus 0.7% in white women; mortality in Black women is roughly twice as high. This is the single most important item on this list. <br><br>ACOG revised its guidance in April 2026: the old "ultrasound alone if the lining is 4 mm or less" rule has been narrowed, because endometrial thickness is an insensitive predictor for higher-grade cancers — a 4 mm measurement carries about a 10% false-negative probability in Black women, and roughly a quarter of aggressive serous cancers may be missed by ultrasound alone in Black women. Most patients should now have <b>both</b> ultrasound and endometrial tissue sampling. If you are offered ultrasound only, it is reasonable to ask why.'},
  {n:'Unscheduled bleeding while on hormone therapy', why:'Bleeding is common in the early months of hormone therapy and is often benign — but it is not to be ignored. NICE is reported to have amended its guidance in April 2026 to strengthen safety-netting advice on unscheduled bleeding during systemic hormone therapy. Either way: report it.'},
  {n:'A new breast lump, or skin or nipple change', why:'Not attributable to menopause, and not something to hold until your next scheduled mammogram. Screening intervals apply to women without symptoms.'},
  {n:'Chest pain, or breathlessness on exertion', why:'Cardiovascular risk rises across the transition. Palpitations are reported by at least one in five peri- and postmenopausal women, but "common in menopause" is not "benign in you." Coronary artery disease is also a contraindication to hormone therapy.'},
  {n:'Swelling or pain in one calf, or sudden breathlessness', why:'Possible blood clot. Oral hormone therapy roughly doubles clot risk (about 7 extra cases per 1,000 over 5 years at ages 50–59); transdermal does not. Previous clot is a contraindication. This is an urgent-care symptom, not a next-appointment symptom.'},
  {n:'Sudden, severe, or new-pattern headache', why:'A new or changed headache in midlife needs evaluation rather than being assumed hormonal.'},
  {n:'Thoughts of harming yourself, or low mood that is not lifting', why:'Perimenopause carries about 40% higher odds of depression. Depression meeting diagnostic criteria needs proper mental-health care — NICE distinguishes this clearly from depressive symptoms around menopause, where hormone therapy may be considered. Please reach out to a clinician or a crisis line today rather than waiting.'},
  {n:'Unexplained weight loss', why:'Not a menopausal symptom. Menopause is associated with weight gain and fat redistribution, not loss.'},
  {n:'Pelvic pain outside the usual pattern', why:'Genitourinary syndrome means dryness, burning, irritation, urinary symptoms and pain with sex. Pain outside that pattern needs evaluation.'},
  {n:'If you take fezolinetant: jaundice, dark urine, pale stools, itching, right-upper abdominal pain, unusual tiredness or nausea', why:'<b>Boxed warning for rare but serious liver injury. Stop the medication and contact your clinician.</b> Required monitoring is liver blood tests at baseline, monthly for 3 months, then at months 6 and 9.'}
];

/* ---------------- Clinician prep ---------------- */
const CLINICIAN_TOPICS = [
  {id:'vms', l:'Hot flashes and night sweats', q:[
    'Given my age and how long it has been since my last period, am I inside the window where guidelines say benefits of hormone therapy outweigh risks for most healthy women?',
    'If hormone therapy is an option for me, would transdermal (patch or gel) be preferable to a tablet given my personal risk factors?',
    'If hormone therapy is not suitable, which non-hormonal option would you suggest first, and why that one?',
    'Is menopause-specific CBT available to me, either alongside treatment or instead of it?'
  ]},
  {id:'ht', l:'Hormone therapy — risks and specifics', q:[
    'Can we go through my absolute risk numbers rather than relative risk — my extra risk per 1,000 women over five years?',
    'Given my history, are there any absolute contraindications in my record?',
    'If I have a uterus, what form of endometrial protection are you recommending, and why that one?',
    'When should I come back for review, and what would make us change course?'
  ]},
  {id:'gsm', l:'Vaginal, bladder and sexual symptoms', q:[
    'Would low-dose vaginal oestrogen be appropriate for me? I understand it does not need a progestogen and does not raise endometrial cancer risk.',
    'I have recurrent UTIs — is vaginal oestrogen worth trying for prevention?',
    'Can you refer me to a pelvic floor physiotherapist?',
    'What is the correct way to use this, and how long before I judge whether it is working?'
  ]},
  {id:'sleep', l:'Sleep', q:[
    'Given my symptoms, could this be sleep apnea rather than insomnia? Can I be tested?',
    'Can you refer me to CBT-I, or recommend a digital programme? I understand it is first-line rather than medication.',
    'Are any of my current medications or supplements affecting my sleep?'
  ]},
  {id:'mood', l:'Mood and anxiety', q:[
    'Here are my PHQ-9 and GAD-7 scores over the last few weeks. What do you make of the trend?',
    'I understand some menopause symptoms inflate depression scores. Does that change how you read mine?',
    'If treatment is warranted, would you start with therapy, medication, or both?'
  ]},
  {id:'bone', l:'Bone and heart health', q:[
    'Should I have a DEXA scan, and does my fracture risk score support it?',
    'What are my current blood pressure, LDL cholesterol and glucose numbers, and how have they moved?',
    'Is high-impact exercise or heavy lifting safe for me, given my bone status?'
  ]},
  {id:'weight', l:'Weight and body composition', q:[
    'My weight is stable but my waist has changed — does that change your assessment?',
    'What protein target would you suggest for me, given my weight and any kidney considerations?'
  ]},
  {id:'surg', l:'After a hysterectomy or ovary removal', q:[
    'Can you confirm from my records exactly what was removed — uterus, cervix, one ovary or both?',
    'Was my cervix left in place? I want to know whether I still need cervical screening.',
    'If my ovaries were left, how will we tell when I am approaching menopause, with no bleeding pattern to go on?',
    'I understand oestrogen-only therapy is used when there is no uterus — does that apply to me?',
    'If both ovaries were removed, should I be on hormone therapy at least until around the average age of menopause?'
  ]},
  {id:'meds', l:'Reviewing what I already take', q:[
    'Here is everything I take, including supplements. Are there interactions I should know about?',
    'Is anything I take affecting my sleep, mood, libido or bone health?'
  ]}
];

/* ---------------- Sources ---------------- */
const SOURCES_HTML = `
<p class="tiny">Content compiled and reviewed <b>July 2026</b>. This field moved substantially in November 2025 (FDA labelling), March 2026 (NICE fezolinetant appraisal) and April 2026 (ACOG bleeding guidance, NICE amendment). Anything you read here should be re-checked if it is more than about six months old.</p>
<h4>Primary guidance</h4>
<ul class="plain srcs">
<li>The Menopause Society — 2023 non-hormone therapy position statement; 2022 hormone therapy position statement; 2021 osteoporosis position statement; 2020 genitourinary syndrome position statement; patient education materials</li>
<li>NICE NG23, <i>Menopause: identification and management</i> (2024 update; a 2026 amendment is reported but we could not verify it against the primary); NICE Table 1; NICE TA1143 (fezolinetant)</li>
<li>American Urological Association / SUFU / AUGS — 2025 genitourinary syndrome of menopause guideline</li>
<li>US Preventive Services Task Force — osteoporosis (2025), breast cancer (2024), falls prevention (2024), cervical cancer (2018), colorectal (2021), diabetes (2021), thyroid, vitamin D and calcium supplementation, hormone therapy for primary prevention (2022)</li>
<li>British Menopause Society — HRT Guide (Feb 2026), Migraine and HRT (Apr 2026), Fast Facts on breast cancer risk (2025), BMS/WHC consensus, nutrition tool</li>
<li>MHRA absolute and relative risk tables for HRT</li>
<li>ACOG — postmenopausal bleeding guidance (April 2026); compounded bioidentical hormone consensus (2023)</li>
<li>FDA — hormone therapy labelling change (Nov 2025); fezolinetant drug safety communication; energy-based device safety communication</li>
<li>STRAW+10 staging (ASRM); ESHRE 2024 primary ovarian insufficiency guideline</li>
<li>Global Consensus Position Statement on testosterone therapy for women (endorsed by the Endocrine Society, IMS and Menopause Society)</li>
<li>American Heart Association 2020 scientific statement on the menopause transition and cardiovascular risk</li>
<li>NAMS/NNDC guidelines for the evaluation and treatment of perimenopausal depression</li>
<li>American Academy of Sleep Medicine — pharmacologic treatment of chronic insomnia</li>
<li>Physical Activity Guidelines for Americans, 2nd edition; "Too Fit To Fracture" consensus; NIH Office of Dietary Supplements; Bone Health &amp; Osteoporosis Foundation; NCCIH; National Academies (2020) on compounded hormone therapy; Endocrine Society vitamin D guideline (2024)</li>
</ul>
<h4>Key cohorts and trials cited</h4>
<p class="tiny srcs">SWAN (symptom duration, body composition, cognition, depression) · Women's Health Initiative · Cochrane reviews on pelvic floor training and black cohosh · SKYLIGHT 2 (fezolinetant) · OASIS 1/2/3 (elinzanetant) · LIFTMOR (bone loading) · Drake 2019 (CBT-I in postmenopausal women) · WAVS (plant-based diet) · SAFA (spironolactone) · Nurses' Health Study (sleep apnea after surgical menopause) · IAS/ICCR consensus on waist circumference.</p>
<h4>What we deliberately left out</h4>
<div class="callout warn">
<p>Being explicit about this matters more than looking comprehensive:</p>
<ul class="plain tiny" style="margin-bottom:0">
<li>The FDA press release's headline cardiovascular and Alzheimer's percentages — we describe them in the treatment module only to explain why we do not use them: they are not randomised-trial findings, and they conflict with USPSTF and NICE.</li>
<li>The "2% collagen loss per year" figure — we could not verify it from a primary source, so it appears nowhere.</li>
<li>Prevalence percentages for "musculoskeletal syndrome of menopause" as though they were guideline-level — we quote them once, in the symptom card, purely to explain why they should not be trusted yet.</li>
<li>Any prevalence figure for menopausal "rage" or irritability — none exists that we could verify.</li>
<li>A menopause-specific calorie target, a pelvic floor sets-and-reps prescription attributed to Cochrane, and a severity cut-off for the symptom burden score — none is supported.</li>
<li>Screening intervals for blood pressure and lipids — we could not verify the current ones directly, so we tell you to ask instead of guessing.</li>
<li>Whether elinzanetant requires liver monitoring — unverified, so we say nothing either way.</li>
</ul></div>
<h4>A note on whose data this is</h4>
<p class="tiny">Where racial and ethnic differences are documented, this app reports them — symptom duration (10.1 years in African American women versus 4.8 in Japanese women), premature menopause prevalence (15.5% versus 4.8%), endometrial cancer incidence and mortality, and ultrasound false-negative rates. Omitting these produces content that is least accurate for the women at highest risk.</p>
<h4>US and UK guidance differ</h4>
<p class="tiny">On boxed warnings, SSRIs for hot flashes, testosterone access, supplement wording, micronised progesterone, and calcium and vitamin D targets. Where they conflict, this app flags both positions inline rather than picking a side silently, and where a whole section is US-specific — the preventive care checklist — setting your region in Settings adds a warning.</p>`;
