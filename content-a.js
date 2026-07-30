/* ============================================================
   Content module A — symptom library, treatment landscape,
   supplements. All statements traceable to the sources listed
   in the Sources section. Reviewed: July 2026.
   ============================================================ */

const EV = {
  strong:   '<span class="badge strong">Strong evidence</span>',
  moderate: '<span class="badge moderate">Moderate</span>',
  mixed:    '<span class="badge mixed">Mixed / weak</span>',
  none:     '<span class="badge none">No good evidence</span>'
};

const DISCLAIMER_SHORT =
  '<p class="xtiny">Education, not medical advice. Nothing here replaces a conversation with a clinician who knows your history.</p>';

/* ---------------- Symptom library ---------------- */
const SYMPTOMS = [
  {
    id:'vms', name:'Hot flashes & night sweats', tag:'Vasomotor symptoms',
    quick:'Up to 80% of women. Among those with frequent flashes, a median 7.4 years — longer if they start early.',
    body:`
    <p><b>What's happening.</b> Falling and fluctuating oestrogen destabilises the temperature-control centre in the hypothalamus, narrowing the range your body tolerates before it triggers a heat-dumping response — flushing, sweating, then often a chill.</p>
    <h4>Numbers worth knowing</h4>
    <div class="tw"><table><tbody>
      <tr><td>Affected during the transition</td><td><b>up to 80%</b></td></tr>
      <tr><td>Length of one episode</td><td><b>1–5 min</b></td></tr>
      <tr><td>Median total duration (SWAN, women with frequent flashes)</td><td><b>7.4 years</b></td></tr>
      <tr><td>Median duration <i>after</i> the final period</td><td><b>4.5 years</b></td></tr>
      <tr><td>If they start before periods change</td><td><b>&gt;11.8 years</b></td></tr>
      <tr><td>If they start after menopause</td><td><b>3.4 years</b></td></tr>
    </tbody></table></div>
    <p class="tiny muted">All the duration figures above come from the SWAN participants who had frequent symptoms, so they describe the harder end of the range. Duration also differs meaningfully by group in that cohort: African American 10.1 years, Hispanic 8.9, non-Hispanic white 6.5, Chinese 5.4, Japanese 4.8. Most consumer content quotes only the white average.</p>
    <div class="callout info"><span class="ctitle">Peak risk sits around your final period</span>
    Not in the years long before it. In SWAN, about 1 in 4 women had persistently high symptoms, 1 in 4 had persistently minimal ones, and the rest peaked either early or near the final period.</div>
    <h4>What has evidence</h4>
    <ul class="tick">
      <li><b>Hormone therapy</b> — most effective option, roughly 75% reduction. ${EV.strong}</li>
      <li><b>Menopause-specific CBT</b> — 65–78% of women reach clinically meaningful improvement in how much flashes bother and interfere. It changes the impact more than the count. ${EV.strong}</li>
      <li><b>Clinical hypnosis</b> — one trial: 74% vs 17% reduction in frequency; 57% vs 10% on physiologically measured flashes. ${EV.strong}</li>
      <li><b>Non-hormonal prescriptions</b> — SSRIs/SNRIs and gabapentin (Level I), oxybutynin (Level I–II), and the newer neurokinin antagonists fezolinetant and elinzanetant. <b>Fezolinetant carries a boxed warning for liver injury and requires scheduled liver blood tests.</b> See Treatment options. ${EV.strong}</li>
      <li><b>Weight loss</b> — in one trial, losing 7.5 kg vs 2 kg raised the odds of flash improvement; per 5 kg lost, OR 1.32. ${EV.moderate}</li>
    </ul>
    <div class="callout warn"><span class="ctitle">The honest bad news</span>
    <p>The Menopause Society reviewed the trials and does <b>not</b> recommend, <i>for hot flashes specifically</i>: paced breathing, cooling techniques, avoiding triggers, exercise, yoga, mindfulness, relaxation, dietary change, acupuncture, or any dietary supplement.</p>
    <p>That is a narrow claim about one symptom. Exercise, sleep work and mindfulness have strong evidence for mood, sleep, bone, heart health and muscle — just not for stopping flashes.</p></div>
    <p class="tiny"><b>Triggers.</b> Alcohol, caffeine and spicy food are commonly blamed. The evidence is cross-sectional at best, and trigger-avoidance has never been tested as a treatment. Treat it as a personal experiment, not a rule — the app has a 2-week trigger test for exactly this.</p>
    <p class="tiny"><b>Not just discomfort.</b> The American Heart Association notes hot flashes are associated with subclinical atherosclerosis and worse cardiovascular risk factors — a reason to take them seriously rather than endure them.</p>`
  },
  {
    id:'sleep', name:'Sleep problems', tag:'Insomnia, waking, apnea',
    quick:'40–56% in peri/post vs 31% before. The most missed diagnosis here is sleep apnea.',
    body:`
    <p><b>Three different problems get called "menopause insomnia," and they need different fixes.</b></p>
    <div class="tw"><table><tbody>
      <tr><td>Sleep difficulty, premenopause</td><td><b>31%</b></td></tr>
      <tr><td>Peri- / post- / surgical menopause</td><td><b>40–56%</b></td></tr>
      <tr><td>Odds vs premenopause</td><td>peri <b>1.6×</b>, post <b>1.67×</b>, surgical <b>2.17×</b></td></tr>
      <tr><td>Meeting insomnia-disorder criteria</td><td><b>~26%</b></td></tr>
      <tr><td>Moderate/severe sleep apnea in midlife women</td><td><b>20%</b> (vs 4% younger)</td></tr>
    </tbody></table></div>
    <h4>Which one is it?</h4>
    <ul class="tick">
      <li><b>Night sweats wake you soaked</b> → vasomotor-driven fragmentation. Treat the flashes. Cool the room for comfort and sleep — that part is not a flash treatment.</li>
      <li><b>Dry, wide awake, mind racing, can't get back to sleep</b> → insomnia. <b>CBT-I first</b>, not pills.</li>
      <li><b>Snoring, witnessed pauses, morning headache, unrefreshing sleep despite hours in bed, nocturia, blood pressure that won't come down</b> → get screened for <b>obstructive sleep apnea</b>.</li>
    </ul>
    <div class="callout alert"><span class="ctitle">Sleep apnea is badly underdiagnosed in women</span>
    Women present less often with loud snoring and witnessed apneas, and more often with insomnia, fatigue, morning headache and low mood — which get filed under "just menopause." Risk rises with the transition (apnea index up ~4% per year of progression) and independently after surgical menopause (bilateral oophorectomy HR 1.43). If CBT-I doesn't work, that is itself a reason to test.</div>
    <p class="tiny">The sleep module has the full CBT-I protocol — the part that actually works, not a sleep-hygiene checklist. In the best menopause-specific trial, sleep hygiene education alone produced <b>4%</b> remission; CBT-I produced <b>54%</b> at the end of treatment and <b>68%</b> at six months.</p>`
  },
  {
    id:'mood', name:'Mood, anxiety & irritability', tag:'Depression risk window',
    quick:'Perimenopause carries ~40% higher odds of depression. Postmenopause does not.',
    body:`
    <p><b>There is a real window of vulnerability, and it is specifically perimenopause.</b> A 2024 meta-analysis of 9,141 women found ~40% higher odds of depression in perimenopause versus premenopause — with <b>no significant elevation in postmenopause</b>. Separate guideline work puts the risk of a major depressive episode at 2–4× during the transition and early postmenopause.</p>
    <h4>Who is at higher risk</h4>
    <ul class="plain">
      <li>Previous depression — this is the strongest predictor; first-ever depression starting in perimenopause is less common</li>
      <li>Severe sleep disruption and severe hot flashes</li>
      <li>High trait anxiety, current anxiety disorder, past premenstrual mood symptoms, postpartum blues</li>
      <li>Financial strain, stressful life events, adverse childhood experiences</li>
      <li>After hysterectomy — depression risk is elevated by roughly 20–44%, whether or not the ovaries were removed; and primary ovarian insufficiency (54.5% lifetime prevalence)</li>
    </ul>
    <div class="callout info"><span class="ctitle">Important framing from the SWAN study</span>
    Most midlife women do <b>not</b> experience clinically high depressive symptoms. And stressful life events, poor sleep, hot flashes and past adversity often mattered more than hormonal change itself. Menopause is a risk window, not a cause.</div>
    <h4>What has evidence</h4>
    <ul class="tick">
      <li><b>SSRIs/SNRIs</b> — first line for depression in this population; desvenlafaxine 50–200 mg/day has the largest trial base. ${EV.strong}</li>
      <li><b>CBT</b> — effective; typically 16+ sessions; combining with medication may beat medication alone. ${EV.strong}</li>
      <li><b>Exercise for depressive symptoms</b> — pooled SMD −1.04, a large effect, though heterogeneity between trials was very high. Bigger in perimenopause (−1.56) than postmenopause (−0.93); mind-body forms and 60–90 min sessions did best. ${EV.moderate}</li>
      <li><b>Transdermal oestradiol</b> — has antidepressant effects in <i>perimenopausal</i> women with depression, especially alongside hot flashes. It is <b>ineffective</b> for established depression in postmenopausal women, and is not approved for mood. ${EV.moderate}</li>
      <li><b>Mindfulness / MBSR</b> — helps stress and, in the best single trial, anxiety and depression subscales (d = −0.49). Did <b>not</b> touch vasomotor, somatic or urogenital symptoms. ${EV.moderate}</li>
      <li><b>Slow-paced breathing, progressive muscle relaxation</b> — small-to-medium effects on stress, anxiety, low mood. ${EV.moderate}</li>
    </ul>
    <p class="tiny"><b>On rage and irritability:</b> these dominate social media and are widely reported clinically, but the research base is genuinely thin — there is no good prevalence figure for menopausal "rage." What we can identify and treat are the contributors: broken sleep, symptom burden, and pre-existing anxiety. Anyone telling you the numbers on this is making them up.</p>
    <div class="callout alert"><span class="ctitle">Get help promptly</span>
    Thoughts of harming yourself, or low mood that isn't lifting, need proper mental-health care — not a hormone adjustment. Depression meeting diagnostic criteria is treated differently from depressive symptoms around menopause.</div>`
  },
  {
    id:'fog', name:'Brain fog', tag:'Memory & processing speed',
    quick:'Real, measurable — and the perimenopausal dip appears to be temporary.',
    body:`
    <div class="callout ok"><span class="ctitle">The most under-communicated good news in this field</span>
    In the SWAN cohort, women normally improve with practice on memory and processing-speed tests. During perimenopause that practice improvement disappeared — and then <b>"improvement with practice was seen again in early postmenopause."</b> The perimenopausal decrement looks transient.</div>
    <ul class="tick">
      <li><b>Processing speed</b> is the most consistently affected domain.</li>
      <li>Objective <b>verbal memory</b> decline emerged after about <b>age 58</b>; working memory later.</li>
      <li><b>Self-reported</b> hot flashes were not associated with memory decrements; <b>objectively measured</b> ones have been in other work.</li>
      <li><b>Depression, anxiety and poor sleep</b> impaired performance — these are the modifiable levers.</li>
      <li>Cardiovascular risk factors accelerate later processing-speed decline.</li>
    </ul>
    <p><b>So what helps:</b> repair sleep, treat mood, manage blood pressure/lipids/glucose, keep moving. Hormone therapy is <b>not</b> indicated for cognition, and neither is testosterone — the international consensus explicitly lists cognition among the indications testosterone does <i>not</i> support.</p>
    <div class="callout warn"><span class="ctitle">When it isn't brain fog</span>
    Getting lost in familiar places, other people noticing your word-finding, trouble managing money or medications, or steady worsening rather than fluctuation — these warrant a proper evaluation.</div>`
  },
  {
    id:'gsm', name:'Vaginal & bladder changes', tag:'Genitourinary syndrome of menopause',
    quick:'27–84% of postmenopausal women. Unlike hot flashes, this does not resolve on its own.',
    body:`
    <div class="callout warn"><span class="ctitle">The single most important asymmetry to understand</span>
    Hot flashes usually fade. Genitourinary changes are <b>progressive</b> — urogenital atrophy becomes more prevalent the further past menopause you are. Waiting it out is not a strategy here.</div>
    <p><b>What it covers</b> — the 2025 multi-society guideline defines it as the spectrum of symptoms from declining oestrogen <i>and androgen</i> in the genitourinary tract:</p>
    <ul class="plain">
      <li><b>Genital:</b> dryness, burning, irritation, itching, soreness</li>
      <li><b>Urinary:</b> urgency, frequency, painful urination, night-time urination, leaking, <b>recurrent UTIs</b></li>
      <li><b>Sexual:</b> pain with sex, inadequate lubrication, bleeding after sex</li>
    </ul>
    <p>Prevalence estimates range 27–84% (13–87% in the 2025 guideline) — the spread reflects different questionnaires, not uncertainty about whether it's common. One study found it in 84% of women six years past menopause.</p>
    <h4>What works</h4>
    <p>See <b>Intimacy & sexual health</b> for the full options table. Headlines:</p>
    <ul class="tick">
      <li><b>Low-dose vaginal oestrogen</b> — Strong Recommendation. Blood oestradiol stays within the normal postmenopausal range (3–11 pg/mL). No progestogen needed. ${EV.strong}</li>
      <li><b>For recurrent UTIs</b> — vaginal oestrogen reduces recurrence; in one trial from 5.9 to 0.5 episodes/year. This carries the strongest evidence grade in the 2025 guideline. ${EV.strong}</li>
      <li><b>Moisturisers and lubricants</b> — recommended, alone or alongside. ${EV.moderate}</li>
      <li><b>Vaginal DHEA (prasterone)</b> — a recommended option. <b>Ospemifene</b> (oral) is a conditional option that <b>carries a boxed warning for blood clots and stroke</b> — see Intimacy &amp; sexual health for the detail. ${EV.moderate}</li>
      <li><b>Vaginal laser / radiofrequency</b> — the guideline says the evidence does <b>not</b> support these. ${EV.none}</li>
    </ul>`
  },
  {
    id:'joints', name:'Joint & muscle aches', tag:'Musculoskeletal',
    quick:'Very commonly reported. The science is younger than the marketing.',
    body:`
    <p>Aching joints, stiffness, new tendon problems and loss of strength are among the most frequently reported midlife complaints. A 2024 review proposed the term "musculoskeletal syndrome of menopause" to group them.</p>
    <div class="callout warn"><span class="ctitle">Be careful with the numbers you see quoted</span>
    The widely circulated "71% / 80% / 25%" figures come from that single 2024 review, reached through secondary summaries — the primary text is paywalled. The term is <b>not yet adopted</b> by NICE, the Menopause Society or ACOG. Treat joint pain as a common midlife symptom, not a diagnosis with settled epidemiology.</div>
    <p><b>What is on firmer ground:</b> bone loss begins 1–3 years before menopause and continues 5–10 years, averaging <b>10–12% loss</b> at spine and hip. Lean muscle mass declines while fat redistributes. Those are documented and both are trainable.</p>
    <h4>Levers with independent evidence</h4>
    <ul class="tick">
      <li>Progressive strengthening around the painful joint</li>
      <li>Load management — reduce volume during flares, keep frequency</li>
      <li>Reducing excess adiposity</li>
      <li>Sleep repair (pain and poor sleep amplify each other)</li>
      <li>Clinical evaluation to exclude inflammatory arthritis — new symmetrical joint swelling, prolonged morning stiffness, or systemic symptoms are not "just menopause"</li>
    </ul>
    <p class="tiny"><b>Editorial caution:</b> "menopause causes your joint pain, so take hormone therapy" is being over-claimed commercially. Arthralgia is not a Menopause Society indication for hormone therapy. Frozen shoulder is often cited as menopause-related; no guideline establishes that link.</p>`
  },
  {
    id:'weightsym', name:'Weight & body shape change', tag:'Body composition',
    quick:'The scale can stay flat while body composition worsens. That is the real story.',
    body:`
    <div class="callout info"><span class="ctitle">The myth to retire: "menopause tanks your metabolism"</span>
    In 120 women, resting energy expenditure adjusted for body composition declined with <b>age</b> (−3.9 kcal/day/year) but showed <b>no difference by menopausal status</b> (7 kcal/day, p=0.78). Doubly-labelled-water work across the lifespan found energy expenditure most stable from the 20s to about 60, then declining ~0.7%/year. No menopause cliff was found.</div>
    <p><b>What does change:</b> where fat is stored, and how much muscle you keep.</p>
    <ul class="tick">
      <li>Rate of fat gain <b>doubles</b> about 2 years before the final period, with simultaneous lean-mass decline; it flattens ~2 years after.</li>
      <li>Visceral fat rises from roughly <b>5–8%</b> of body fat premenopause to <b>15–20%</b> after — +8.2%/year in the 2 years before the final period. Figures vary between cohorts.</li>
      <li>Trunk fat is about <b>36% higher</b> postmenopause; one 5-year comparison found intra-abdominal fat area up 49%.</li>
      <li>MRI studies found significant visceral fat gains <b>despite no change in weight or waist</b>.</li>
      <li>Total weight rises fairly <b>linearly with age</b> — roughly 1.5 lb/year through the 50s. That part tracks ageing, not menopause.</li>
    </ul>
    <p><b>Why it matters:</b> the American Heart Association notes rising LDL cholesterol and apolipoprotein B plus central fat gain raise cardiovascular risk <b>even in women of normal body weight</b>. Early postmenopausal women had 2.1× the odds of LDL ≥130 mg/dL versus premenopause.</p>
    <p class="tiny">Because resting metabolism tracks lean mass, <b>losing muscle is the mechanism by which crash dieting lowers your metabolism</b>. That is the actual argument against aggressive restriction in midlife — and it's a good one.</p>`
  },
  {
    id:'skinsym', name:'Skin, hair & nails', tag:'Dermatological',
    quick:'Barrier function, collagen and hair density all shift. Four topicals carry real evidence.',
    body:`
    <p><b>What oestrogen decline does to skin.</b> Less fibroblast-driven collagen and glycosaminoglycan synthesis, more matrix-metalloproteinase activity, so the dermis thins. Barrier integrity drops: ceramides in the stratum corneum are fewer and shorter-chained with disrupted organisation, water loss rises — hence dryness, sensitivity and itch. Oestrogen also supports wound healing.</p>
    <div class="callout warn"><span class="ctitle">About the "30% collagen loss in 5 years" figure</span>
    It traces to a 2026 dermatology review, so we will cite it — with the caveat that it is one review's headline number rather than a replicated measurement. The companion claim you'll see everywhere, "2% per year after that," we could not verify from any primary source, so this app does not publish it.</div>
    <ul class="tick">
      <li><b>Female pattern hair loss</b> — common after menopause; one 2026 dermatology review reports it in about half of postmenopausal women, though the underlying prevalence studies were paywalled to us, so treat the exact figure loosely. Mechanism: shortened growth phase, follicle miniaturisation, lower density.</li>
      <li><b>Adult acne</b> — around 15% of women; more truncal and lower-face, milder but on more reactive skin, so more marks and discolouration.</li>
      <li><b>Rosacea</b> often worsens — barrier impairment, more vascular reactivity, microbiome shifts, and flushing that overlaps with hot flashes.</li>
      <li><b>Itch and crawling sensations</b> — partly dryness, partly neuroinflammatory: oestrogen deficiency is associated with increased cutaneous nerve fibre density.</li>
      <li><b>Brittle nails</b> — up to 20% of people, more in women over 50, mostly idiopathic. We found no quality source tying nail change to oestrogen, so we don't claim one.</li>
    </ul>
    <p>See the <b>Skin & hair</b> module for what to actually use — the four ingredients with the best data, and the ones to skip.</p>`
  },
  {
    id:'other', name:'Less-discussed symptoms', tag:'Palpitations, migraine, dry eye, mouth',
    quick:'Some are well documented. Others are widely claimed with almost no evidence.',
    body:`
    <h4>Palpitations ${EV.moderate}</h4>
    <p>A systematic review found prevalence of 20–40% in perimenopause and 15.7–54.1% after — at least one in five. Three of five studies found significantly higher rates in perimenopausal and surgically postmenopausal women.</p>
    <div class="callout alert">Palpitations are common, but "common in menopause" is not the same as "benign in you." New, sustained, or exertional palpitations, or any with chest pain, breathlessness or fainting, need assessment.</div>
    <h4>Migraine ${EV.moderate}</h4>
    <p>Fluctuating oestrogen in perimenopause increases migraine risk; it tends to settle after menopause in women not on hormone therapy. Two high-value corrections from the British Menopause Society:</p>
    <ul class="tick">
      <li><b>Migraine with aura does NOT contraindicate hormone therapy.</b> The aura contraindication applies to combined <i>contraception</i> containing ethinylestradiol — a different drug and dose. This is widely misunderstood, including by clinicians.</li>
      <li>Transdermal oestradiol is preferred (steadier levels), given continuously rather than cyclically.</li>
    </ul>
    <h4>Dry eye ${EV.moderate}</h4>
    <p>A 2025 cross-sectional study of over 3,500 women found dry eye disease in 57.4% of postmenopausal versus 53.2% of premenopausal women. Note how small that gap is — the direction is plausible, the causal claim is not established. The Menopause Society now suggests including dry-eye screening in midlife check-ups.</p>
    <h4>Burning mouth and oral changes ${EV.mixed}</h4>
    <p>Reported in 10–40% of peri/postmenopausal women, up to 7× more than men, peaking ages 50–70. Evidence that oestrogen helps is limited. That prevalence range is very wide — treat it loosely.</p>
    <h4>Tinnitus ${EV.none}</h4>
    <p>Tinnitus affects ~13% of adults aged 45–64, at <b>similar rates in women and men</b>. Oestrogen receptors exist in the auditory system, but a Menopause Society expert states plainly that data on hormone therapy for tinnitus "remain limited and inconclusive." Anyone selling you a menopause tinnitus protocol is ahead of the evidence.</p>`
  }
];

/* ---------------- Treatment landscape ---------------- */
const TREATMENT_HTML = `
<div class="callout alert"><span class="ctitle">Read this first</span>
This module describes <b>what current guidelines say</b>. It quotes the doses used in the trials so you can follow the evidence, but nothing here is a recommendation for you. Every option here requires a clinician who knows your history. Use the "Questions for your clinician" builder to turn this into a conversation.</div>

<details class="acc"><summary>The 2025 US label change — and why it doesn't mean what headlines said</summary><div>
<p>On <b>10 November 2025</b> the FDA began removing boxed warnings for cardiovascular disease, breast cancer and probable dementia from systemic and topical oestrogen products. The <b>endometrial cancer warning stays</b> on oestrogen-alone products. New labelling embeds initiation within 10 years of menopause or before age 60, and drops the old "lowest dose, shortest duration" instruction.</p>
<div class="callout warn"><span class="ctitle">Three things to hold onto</span>
<p><b>1. Removing a warning label is a regulatory decision, not new trial evidence.</b> The Menopause Society's own response supports removal for low-dose vaginal oestrogen, while stating that systemic oestrogen "still comes with potential risks in certain individuals that should be reviewed in detail" — low for younger women starting near the transition, greater when started older or further out.</p>
<p><b>2. The FDA press release quoted headline reductions in cardiovascular and Alzheimer's risk. Those are not randomised-trial findings</b> — we name them only to explain why this app does not use them. They conflict with the US Preventive Services Task Force, and with NICE, which says coronary heart disease risk <i>does not increase</i> with combined therapy — neutral, not protective.</p><p style="margin-bottom:0"><b>3. And the Task Force position is narrower than it sounds.</b> Its Grade D recommendation (2022) is specifically against using hormone therapy to <i>prevent chronic disease in women who have no symptoms</i>. It states explicitly that it "does not apply to persons who are considering hormone therapy for the management of perimenopausal symptoms, such as hot flashes or vaginal dryness." Misreporting that scope limitation is the single most common error in consumer menopause content.</p></div>
<p class="tiny">This change is <b>US-only</b>. UK product information still reflects the earlier MHRA risk tables.</p>
</div></details>

<details class="acc"><summary>What hormone therapy is good at</summary><div>
<ul class="tick">
  <li><b>Hot flashes and night sweats</b> — the most effective treatment available; roughly <b>75% reduction</b> versus 20–60% for non-hormonal drugs. NICE: "Offer HRT to people with vasomotor symptoms associated with menopause." ${EV.strong}</li>
  <li><b>Bone</b> — prevents bone loss and reduces fractures. In the Women's Health Initiative, standard-dose combined therapy raised spine density 4.5% and hip 3.7% over 5 years and cut combined vertebral, hip and total fractures by <b>34%</b>. ${EV.strong}</li>
  <li><b>Genitourinary symptoms</b> — effective; but if that's the <i>only</i> problem, low-dose <b>vaginal</b> oestrogen is preferred. ${EV.strong}</li>
</ul>
<p class="tiny">On stopping, 3–6% of bone density is lost in the first year and returns to pre-treatment levels within about two years — though no excess fractures appeared after discontinuation in the WHI.</p>
</div></details>

<details class="acc"><summary>The "window of opportunity"</summary><div>
<p>The Menopause Society, verbatim: <i>"The benefits of hormone therapy outweigh the risks for most healthy symptomatic women who are aged younger than 60 years and within 10 years of menopause onset."</i> Risk stratification by age and time since menopause is recommended.</p>
<p>The AHA, the British Menopause Society and the FDA's new labelling all now describe the same window.</p>
<div class="callout info"><span class="ctitle">Continuing is not the same as starting</span>
Hormone therapy "does not need to be routinely discontinued" after 60 or 65 and can continue beyond 65 for persistent symptoms or bone protection. But <b>initiating</b> after 60, or more than 10 years past menopause, is generally not recommended on cardiovascular grounds. The British Menopause Society adds that arbitrary time limits should not be imposed.</div>
</div></details>

<details class="acc"><summary>Risks in absolute numbers — the table worth having</summary><div>
<p class="tiny">Per 1,000 women, current use starting at age 50. Source: MHRA risk tables linked from NICE. Absolute numbers, not relative risk — this is the honest way to read it.</p>
<h4>Combined (oestrogen + progestogen)</h4>
<div class="tw"><table>
<thead><tr><th>Outcome</th><th>Window</th><th>Total /1,000</th><th>Extra cases</th></tr></thead><tbody>
<tr><td>Breast cancer</td><td>5 years</td><td>21</td><td><b>+8</b></td></tr>
<tr><td>Breast cancer</td><td>10 years</td><td>47</td><td><b>+20</b></td></tr>
<tr><td>Blood clot (VTE)</td><td>5 yr, age 50–59</td><td>12</td><td><b>+7</b></td></tr>
<tr><td>Blood clot (VTE)</td><td>5 yr, age 60–69</td><td>18</td><td><b>+10</b></td></tr>
<tr><td>Stroke</td><td>5 yr, age 50–59</td><td>5</td><td><b>+1</b></td></tr>
<tr><td>Ovarian cancer</td><td>10 yr, age 50–59</td><td>5</td><td><b>+1</b></td></tr>
<tr><td>Coronary heart disease</td><td>5 yr, age 50–59</td><td>12</td><td>0</td></tr>
</tbody></table></div>
<h4>Oestrogen-only</h4>
<div class="tw"><table>
<thead><tr><th>Outcome</th><th>Window</th><th>Total /1,000</th><th>Extra cases</th></tr></thead><tbody>
<tr><td>Breast cancer</td><td>5 years</td><td>16</td><td><b>+3</b></td></tr>
<tr><td>Breast cancer</td><td>10 years</td><td>34</td><td><b>+7</b></td></tr>
<tr><td><b>Endometrial cancer, unopposed</b></td><td>5 yr, age 50–59</td><td>6</td><td><b>+4</b></td></tr>
<tr><td><b>Endometrial cancer, unopposed</b></td><td>10 yr, age 60–69</td><td>54</td><td><b>+48</b></td></tr>
<tr><td>Blood clot (VTE)</td><td>5 yr, age 50–59</td><td>7</td><td><b>+2</b></td></tr>
</tbody></table></div>
<h4>Breast cancer risk in context</h4>
<p class="tiny">Extra breast cancers per 1,000 women aged 50–59 over 5 years, from the British Menopause Society's comparison:</p>
<div class="tw"><table><tbody>
<tr><td>Oestrogen-only</td><td><b>−6 to +3</b></td></tr>
<tr><td>Combined therapy</td><td><b>+8 to +10</b></td></tr>
<tr><td>Being overweight vs healthy weight</td><td><b>+4</b></td></tr>
<tr><td>Obesity vs healthy weight</td><td><b>+10</b></td></tr>
<tr><td>Alcohol 4–6 units/day</td><td><b>+8</b></td></tr>
<tr><td>Alcohol 6+ units/day</td><td><b>+11</b></td></tr>
</tbody></table></div>
<p class="tiny">The BMS adds that the overall mortality risk–benefit ratio favours both unopposed and combined therapy in population-risk women, and that combined therapy is not associated with increased breast cancer <i>mortality</i>. The Menopause Society frames the risk as under one additional case per 1,000 women per year.</p>
<p class="xtiny">You may see a much larger figure (+20 per 1,000 over 5 years) in a 2026 family-medicine editorial. We could not reconcile its denominators with the three independent sources that converge on +8 to +10, so we use the latter.</p>
</div></details>

<details class="acc"><summary>Route matters: patch/gel vs tablet</summary><div>
<p>This is one of the few places where US and UK bodies agree completely.</p>
<ul class="tick">
  <li><b>Blood clots:</b> NICE — transdermal <b>not increased</b>; oral <b>increased</b>. The BMS says transdermal shows no increased risk versus non-users.</li>
  <li><b>Stroke:</b> transdermal unlikely to increase risk; oral risk increases — more with higher dose, longer duration, older age at start, and in Black populations.</li>
  <li>NICE: <i>consider transdermal rather than oral for anyone at increased clot risk, including BMI over 30.</i></li>
</ul>
<p><b>BMS reasons to choose transdermal:</b> preference, poor response to tablets, gut absorption problems, previous clot, BMI over 30, migraine, liver enzyme-inducing medication, gallbladder disease. Transdermal is also preferred where libido matters, because it has minimal effect on SHBG so free testosterone is preserved.</p>
</div></details>

<details class="acc"><summary>If you have a uterus: progestogen is not optional</summary><div>
<p>The endometrial cancer numbers above make the stakes concrete: unopposed oestrogen for 10 years at ages 60–69 gives <b>+48 cases per 1,000</b>.</p>
<ul class="tick">
  <li><b>Continuous combined</b> (daily progestogen) <b>decreases</b> endometrial cancer risk. <b>Sequential</b> (12–14 days a month) may slightly increase it, especially with longer use or fewer progestogen days.</li>
  <li>A <b>52 mg levonorgestrel IUD</b> is an accepted way to provide the protection.</li>
  <li><b>No progestogen is needed</b> with low-dose <i>vaginal</i> oestrogen.</li>
  <li>Review at <b>3 months</b> after starting, then annually.</li>
</ul>
<div class="callout warn"><span class="ctitle">A live disagreement, presented as such</span>
The BMS says micronised progesterone and dydrogesterone carry lower breast cancer and clot risk than synthetic progestogens. <b>NICE says the evidence is insufficient to distinguish them</b>, and the BMS has publicly criticised NICE for excluding the French E3N cohort data. This is genuinely unsettled — worth raising with your clinician rather than treating either position as fact.</div>
</div></details>

<details class="acc"><summary>Who should not use systemic hormone therapy</summary><div>
<p>The Menopause Society lists: breast cancer, uterine cancer, <b>unexplained uterine bleeding</b>, liver disease, history of blood clots, cardiovascular disease. A 2026 family-medicine review adds uncontrolled hypertension and oestrogen-sensitive neoplasia.</p>
<p><b>A US/UK difference in tone:</b> NICE routes rather than refuses. For a personal or high-risk breast cancer history, or established heart disease or stroke, NICE says the option should be discussed and offered if appropriate <b>by a clinician with menopause expertise</b> (off-label). The UK is more permissive with specialist oversight.</p>
<p><b>Not a contraindication:</b> migraine with aura. See the migraine note in the symptom library.</p>
</div></details>

<details class="acc"><summary>Vaginal oestrogen — the clearest good news in the field</summary><div>
<p>Systemic absorption is minimal: blood oestradiol with a low-dose ring runs 5–10 pg/mL, and with the 10 µg tablet 3–11 pg/mL — <b>within the normal postmenopausal range</b>.</p>
<ul class="tick">
  <li><b>Strong Recommendation</b> in the 2025 multi-society guideline for vulvovaginal irritation, dryness and painful sex.</li>
  <li>It <b>does not increase</b> the risk of endometrial hyperplasia with atypia or endometrial cancer.</li>
  <li>NICE: offer it, review regularly — "serious adverse effects are very rare." Form (cream, gel, tablet, pessary, ring) is your choice.</li>
  <li>Typical pattern: daily for 2 weeks, then 1–3×/week for creams, 2×/week for tablets; rings replaced every 90 days.</li>
  <li><b>No progestogen needed.</b></li>
  <li><b>After breast cancer:</b> non-hormonal moisturisers and lubricants first; vaginal oestrogen may then be considered within multidisciplinary shared decision-making. The 2025 guideline states clinicians should inform patients of the <i>absence</i> of evidence linking low-dose vaginal oestrogen to breast cancer development.</li>
</ul>
</div></details>

<details class="acc"><summary>Non-hormonal prescription options</summary><div>
<p class="tiny">From the Menopause Society 2023 non-hormone position statement. Level I = strongest evidence tier.</p>
<div class="tw"><table>
<thead><tr><th>Option</th><th>Level</th><th>What the trials showed</th></tr></thead><tbody>
<tr><td><b>Paroxetine 7.5 mg</b></td><td>I</td><td>Improved severity and frequency up to 24 months; no weight gain or libido effect reported. FDA-approved for this use.</td></tr>
<tr><td><b>Escitalopram 10–20 mg</b></td><td>I</td><td>Reductions comparable to oestradiol 0.5 mg in pooled analysis. Off-label.</td></tr>
<tr><td><b>Venlafaxine 75 mg</b></td><td>I</td><td>1.8 fewer hot flashes/day than placebo. Off-label.</td></tr>
<tr><td><b>Desvenlafaxine</b></td><td>I</td><td>25–69% reductions across meta-analyses. Off-label.</td></tr>
<tr><td><b>Gabapentin 900 mg/day</b></td><td>I</td><td>Improved frequency and severity; 2,400 mg compared favourably to conjugated oestrogens. Off-label.</td></tr>
<tr><td><b>Oxybutynin 2.5–15 mg</b></td><td>I–II</td><td>Significantly improved moderate–severe symptoms across multiple trials. Off-label. Note it is an anticholinergic — the same class caution described in the sleep module applies.</td></tr>
<tr><td>Stellate ganglion block</td><td>II–III</td><td>Procedural; 21% reduction on physiologic monitoring in one sham-controlled trial.</td></tr>
</tbody></table></div>
<p><b>Not recommended</b> by the same statement: clonidine, pregabalin, suvorexant.</p>
<div class="callout warn"><span class="ctitle">US and UK differ here</span>
NICE says: <i>do not routinely offer SSRIs, SNRIs or clonidine as first-line treatment for vasomotor symptoms alone.</i> The Menopause Society lists SSRIs/SNRIs as recommended, Level I. Much of this is about positioning — NICE offers hormone therapy first — but the surface guidance genuinely conflicts.</div>

<h4>The newest class: neurokinin antagonists</h4>
<p>Neither is a hormone; both act on the KNDy neuron pathway in the brain's thermoregulatory centre.</p>
<p><b>Fezolinetant</b> (Veozah) — FDA-approved 2023. In SKYLIGHT 2, from a baseline of ~11–12 moderate-to-severe episodes/day, the 45 mg dose gave 2.53 fewer per day than placebo at 12 weeks (−64% from baseline). In the UK, NICE recommended it on the NHS in March 2026 for people for whom hormone therapy is unsuitable.</p>
<div class="callout alert"><span class="ctitle">Fezolinetant carries a boxed warning for liver injury</span>
<p>Required liver blood tests: <b>baseline before starting, monthly for the first 3 months, then at months 6 and 9</b>. It should not be started if ALT, AST or bilirubin is at or above twice the upper limit of normal.</p>
<p><b>Stop it and contact a clinician</b> for: unusual tiredness, nausea, vomiting, unusual itching, light-coloured stools, dark urine, yellowing of the eyes or skin, abdominal swelling, or right-upper abdominal pain.</p></div>
<p><b>Elinzanetant</b> (Lynkuet) — blocks both NK1 and NK3. Approved in the <b>UK first, 10 July 2025</b>, then the US on 24 October 2025. In the OASIS trials, about 3 fewer episodes/day than placebo at weeks 4 and 12, with <b>over 80% achieving at least a 50% reduction by week 26</b>, sustained to 52 weeks. Its differentiator is statistically significant improvement in <b>sleep disturbance</b> and menopause-related quality of life. Common side effects: headache, fatigue, sleepiness.</p>
<p class="xtiny">We could not verify whether elinzanetant carries a liver-monitoring requirement, so we state nothing either way — check the current prescribing information with your clinician.</p>
</div></details>

<details class="acc"><summary>Testosterone — one evidence-based use</summary><div>
<p>From the Global Consensus Position Statement, endorsed by the Endocrine Society, the International Menopause Society and the Menopause Society:</p>
<ul class="tick">
  <li>The <b>only</b> evidence-based indication is <b>hypoactive sexual desire disorder in postmenopausal women</b>, after a full biopsychosocial assessment.</li>
  <li><b>Effect size:</b> on average about <b>one additional satisfying sexual event per month</b> over placebo, plus improvements in desire, arousal, orgasm and sexual distress.</li>
  <li><b>Not supported:</b> cognition or dementia prevention, general wellbeing, mood, bone density, muscle, or use in premenopausal women.</li>
  <li><b>Not recommended:</b> oral formulations (adverse lipid effects), pellets or high-dose injections (supraphysiological levels), compounded "bioidentical" preparations.</li>
  <li><b>Monitoring:</b> baseline level, repeat at 3–6 weeks, then every 6 months. <b>Discontinue if no benefit by 6 months.</b></li>
  <li>At physiological doses: mild acne and some extra facial or body hair. No voice change, hair loss or clitoral enlargement. Safety data don't extend beyond 24 months.</li>
</ul>
<p><b>Access differs sharply.</b> In the US <b>no testosterone product is FDA-approved for women</b> — use is off-label, typically a fraction of a male gel. In the UK, NICE says consider testosterone if hormone therapy alone isn't effective, and the BMS suggests considering it after removal of both ovaries.</p>
</div></details>

<details class="acc"><summary>Compounded "bioidentical" hormones — why three bodies say no</summary><div>
<div class="callout warn"><span class="ctitle">The distinction that gets deliberately blurred</span>
<b>"Bioidentical" is not the same as "compounded."</b> FDA-approved bioidentical products exist — 17β-oestradiol, micronised progesterone — and they are regulated, dose-verified and sterile. The objection is to <b>custom compounding</b>, not to the molecules.</div>
<ul class="tick">
  <li><b>Menopause Society:</b> compounded preparations carry "safety concerns, such as minimal government regulation and monitoring, overdosing and underdosing, presence of impurities and lack of sterility"; they are not safer or more effective than approved products.</li>
  <li><b>National Academies (2020):</b> the range of possible combinations makes bioavailability undeterminable, so "an accurate characterization of the safety and effectiveness of cBHT preparations is not possible." Compounded testosterone pellets produced levels <b>exceeding the normal female range</b>, with a coefficient of variation of about 42%.</li>
  <li><b>Saliva and urine hormone testing</b> for diagnosis or dosing is not recommended — "unnecessary and has not been proven to be accurate nor reliable." There is no established evidence base for using hormone levels to guide dosing of menopausal symptoms.</li>
  <li>"Hormone imbalance" as a marketing rationale has no evidential support.</li>
  <li>An estimated <b>1–2.5 million US women per year</b> use unregulated compounded preparations or pellets.</li>
</ul>
</div></details>
${DISCLAIMER_SHORT}`;

/* ---------------- Supplements ---------------- */
const SUPPLEMENTS = [
  {n:'Black cohosh', v:'none', s:'Cochrane review of 16 randomised trials: no significant difference from placebo for hot flash frequency. <b>Safety flag:</b> cases of liver damage, some serious, have been reported — rare, and causation is uncertain, partly because some products contained the wrong herb entirely. Possible statin interaction.'},
  {n:'Soy foods & isoflavones', v:'mixed', s:'Meta-analysis of 19 trials (median 54 mg/day): hot flash frequency −20.6%, severity −26.2% versus placebo, with supplements over 18.8 mg genistein more than twice as potent. Trials of 12+ weeks tended positive; short ones negative. <b>But</b> the Menopause Society rates it not recommended, citing inconsistency. Food-first if you want to try: ~50 mg ≈ 1–1.5 cups soy milk plus ½ cup edamame or tofu, given a full 12 weeks.'},
  {n:'Soy after breast cancer', v:'strong', s:'Actively reassuring: moderate <b>soy-food</b> intake is safe for women with a history of breast cancer, and may lower recurrence and mortality risk. High-dose concentrated isoflavone supplements are a separate question — defer to oncology.'},
  {n:'Red clover', v:'mixed', s:'Two US bodies read this differently. The Menopause Society groups it with herbal remedies it does not recommend; NCCIH reports improvement in vaginal dryness and atrophy and possibly fewer hot flashes, especially in women with severe symptoms. Contains phytoestrogens — a consideration in hormone-sensitive conditions.'},
  {n:'Evening primrose oil', v:'none', s:'Named explicitly among supplements the Menopause Society reviewed and does not recommend. No demonstrated benefit for hot flashes.'},
  {n:'Dong quai', v:'none', s:'Named explicitly as not recommended. No evidence of benefit.'},
  {n:'Maca', v:'none', s:'Named explicitly as not recommended. No evidence of benefit.'},
  {n:'Vitamin E', v:'none', s:'Named explicitly as not recommended for hot flashes.'},
  {n:'Omega-3', v:'none', s:'Not recommended <b>for hot flashes</b>. That verdict says nothing about its separate cardiovascular or general-health rationales.'},
  {n:'Wild yam, ginseng, chasteberry, milk thistle', v:'none', s:'All named explicitly among the botanicals the Menopause Society does not recommend.'},
  {n:'Ashwagandha', v:'none', s:'NCCIH: inadequate evidence for menopause specifically. <b>Safety flag:</b> a number of cases link liver injury to ashwagandha supplements. Avoid with autoimmune or thyroid conditions, in pregnancy, and before surgery. Interacts with thyroid medication, diabetes drugs, blood pressure medication, sedatives, immunosuppressants and anticonvulsants.'},
  {n:'St John’s wort', v:'mixed', s:'May help mild-to-moderate depression, comparable to standard antidepressants; possibly hot flashes, but few studies. <b>Serious interaction hazard</b> — it reduces the effectiveness of birth control pills, warfarin, some antidepressants, anticonvulsants, HIV medication, several cancer drugs including tamoxifen and imatinib, cyclosporine, digoxin and simvastatin. Combined with some antidepressants it can raise serotonin dangerously. NICE flags tamoxifen, anticoagulant and anticonvulsant interactions specifically, and cautions especially anyone with a history of, or at high risk of, breast cancer.'},
  {n:'Magnesium', v:'none', s:'No guideline addresses magnesium for menopausal symptoms — not the Menopause Society statement, not NICE. For <b>sleep onset</b> specifically, a meta-analysis of 3 small trials in older adults found falling asleep 17 minutes faster, but total sleep time was unchanged and certainty was rated low to very low. The RDA is 320 mg/day for women 31+. Cheap and low-risk; not a treatment.'},
  {n:'Oral collagen', v:'mixed', s:'A 2025 meta-analysis of 23 trials (n=1,474) found pooled improvements in hydration, elasticity and wrinkles — but <b>the effect disappeared in the high-quality and non-industry-funded subgroups</b>. Not harmful; a poor use of money next to sunscreen and a retinoid. Also worth knowing: oral collagen supplies amino acids, it does not travel to your skin as collagen.'},
  {n:'Melatonin & valerian', v:'none', s:'The American Academy of Sleep Medicine recommends <b>against</b> both for chronic insomnia. Melatonin’s better-supported use is circadian problems — jet lag, shift work — not menopausal insomnia.'},
  {n:'Biotin for nails', v:'mixed', s:'5–10 mg/day for 3–6 months improved nail firmness in several studies, but they were small and poorly controlled. <b>Real safety point:</b> high-dose biotin interferes with laboratory assays, including thyroid tests and troponin — tell any clinician ordering blood tests that you take it.'},
  {n:'Vitamin D', v:'moderate', s:'The 2024 Endocrine Society guideline <b>suggests against</b> empiric supplementation above the recommended intake for adults under 75, and <b>recommends against routine vitamin D blood screening in healthy adults</b> — no outcome-specific target level has ever been established in trials. That contradicts a great deal of "optimise your level to 60–80" content. RDA: 600 IU (women 51–70), 800 IU (71+); upper limit 4,000 IU.'},
  {n:'Calcium supplements', v:'moderate', s:'Food first. The US Preventive Services Task Force recommends <b>against</b> up to 400 IU vitamin D plus up to 1,000 mg calcium for primary fracture prevention in community-dwelling postmenopausal women, and found higher doses inconclusive — supplementation increased kidney stones in the WHI. This does not apply if you have osteoporosis, a prior fragility fracture or documented deficiency. Absorption is best at doses of 500 mg or less, so split them.'},
  {n:'Probiotics for the "estrobolome"', v:'none', s:'Mechanistically interesting, clinically unproven. No randomised trial establishes that a microbiome intervention improves menopausal symptoms.'},
  {n:'Cannabinoids', v:'none', s:'Reviewed and not recommended for vasomotor symptoms.'},
  {n:'Flaxseed', v:'none', s:'Conflicting results — one trial effective, the placebo-controlled trial showed no significant difference. Needs adequate fluid; can cause diarrhoea.'},
  {n:'DHEA — read carefully', v:'mixed', s:'<b>Oral/systemic DHEA</b> is not among recommended therapies for hot flashes. <b>Vaginal DHEA (prasterone) 6.5 mg</b> <i>is</i> a recommended option for vaginal dryness and painful sex. These are routinely confused, and the confusion matters.'}
];

const SUPPLEMENTS_INTRO = `
<div class="callout warn"><span class="ctitle">The Menopause Society is unusually blunt here</span>
Its 2023 position statement places <b>every dietary supplement it reviewed — including all herbal remedies — in the "not recommended" column for hot flashes and night sweats.</b> NICE is softer, acknowledging "some evidence that isoflavones or black cohosh may relieve vasomotor symptoms," while warning that safety, quality and purity of unregulated preparations may be unknown. Where they disagree, this app leads with the trial data.</div>
<p class="tiny">Both bodies share one message: with unregulated products you often don't know what's in the bottle. Tell your clinician and pharmacist everything you take — the interaction risks on this page are real, not hypothetical.</p>`;
