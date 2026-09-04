# The Courtyard — growth ledger

One entry per iteration, newest at the bottom. Kept to the last **8** entries by
`rotate-ledger.mjs`; older entries move to `LEDGER-archive.md`, which **only the
manager** reads.

This file is prose, deliberately. The numbers live in `RUNLOG.jsonl` and the state
lives in `state.json`; what belongs here is the part a schema cannot hold — what
you tried, what surprised you, and what you would tell the next iteration.

Pre-loop history (hand-driven iterations 1–31: the courtyard, the lane, the cross
street and allotments, the plaza and quay, the river and far bank) is in
`../../../CHANGELOG.md`.

## Template

**Keep an entry under 1.8 KB (≈26 lines).** A worker reads the last **three** entries in
full, every iteration, so entry length is charged to the loop three times over — three
2.5 KB entries were 18% of the whole read budget, which is why the cap tightened at pass
#120 (it was 3.5 KB and advisory at #20, 2.5 KB and measured at #99). `rotate-ledger.mjs`
names any entry over it. If yours does not fit, the excess is almost always a **law**
(true of the next vector → `LAWS.md`) or a **cue** (→ `state.json`), not a longer entry.
Write the *surprise* at full length and compress everything else; the surprise is the part
that cannot be reconstructed from the diff, and the gate numbers already live in
`RUNLOG.jsonl` and in your probe's own output. Once the manager has promoted your
`**Law:**` and `**Cue:**` lines they are cut from the entry — they live in the two files
that are read *instead* of this one.

```markdown
## Iteration <N> — <one line: what changed> (<date>) [<Domain> × <Kind>]

**Brief:** <id> — <one line of what you were asked to do>
**Did:** <what you actually built, concretely — symbols, not adjectives>
**Gates:** census PASS/FAIL (<the histogram line that moved>) · visual PASS/FAIL ·
motion PASS/FAIL/skipped · perf PASS/skipped
**Verdict:** shipped | reverted | no-ship   ← your view; runlog.mjs decides from the diff
**Surprise:** <what you did not expect — the most valuable line here, or "none">
**Cue:** <a loose end you noticed and did not chase, or omit>
```

---

## Iteration 188 — the sky is given something to say, and the balloon a day (2026-09-04) [Sky, light & weather × Interaction]

**Brief:** b188 — make the sky answer the pointer; land c265's balloon.
**Did.** (1) `skyAt(p)`, asked **LAST** because the sun and moon are drawn **FIRST**; `balloonAt`
asked first, being drawn after every ground light. `skyHz()` is now ONE horizon for draw and hit
test. (2) The moon has a month, on the CALENDAR, so it is one moon in every seed. Its bite is no
longer OVERLAID — the disc is clipped and filled even-odd MINUS the shadow, so the unlit limb is
never painted and the halo behind survives. (3) `balloonDown()` fires BAL_FALL's own width **in arc**
early, so the descent FINISHES at the arc where the light falls back through the light
`balloonOut()` set out in. Drift 0.9 -> 3.4 cells/s + wind.
**HEAD -> cand, 6 seeds x a year** (probes/balloon-day.mjs, run on both): aloft **3.11 -> 0.35 days**
(max 3.12 -> 0.54); night samples carrying one **28.1% -> 0.00%**; flights meeting any dark
**61 of 61 -> 0 of 138**; ended by coming DOWN 0/61 -> 138/138; one every 10.2 -> 4.5 days.
Coverage (probes/sky-name.mjs, 648 px above the horizon x 4 hours): **1/648 -> 648/648**.
**Gates:** census PASS (reshuffle, no collapse) · motion PASS, and it now SEES the balloon, 0 jumps ·
filmstrip day+night 0 POP · 8 framings, a flight, a month of moons.
**Verdict:** shipped
**Surprise:** the band above the horizon is not sky. project() lifts z northward, so the spire stands
**19 cellH above hz** and the clock tower's cap 14: a fall-through with no exception would have
called the two tallest drawn things in the town "the sky".
**Law:** a fall-through answering for a screen REGION is bounded by what rises THROUGH it: ask the
solids first, off geometry that already describes them.

## Iteration 189 — the eaves are given a colony (2026-09-04) [People & animals × New CA]

**Brief:** b189 — the life domain's first new-CA: a colony of martins over the eave line.
**Did.** `roofBirdSpot` and `nestF` are a PERCH and a rate; nothing here was fabric a bird MADE.
`MART_CELLS` is the eave line read off drawFaceRow's own test (solid, south neighbour open, less
church and mill) — 217 cells, two of them terraces: rows 2 and 64. stepIce's three terms in
`caTick`: a FOUNDER (`hash(house)` gating `hash(cell)`, salted per world), a CREEP off the
neighbours ALONG the line, a CEILING off the eave. MUD is the weather — `wetF()` gates the build, so
a dry fortnight stops the colony where it stands. `martHere()` p 0.27..0.70, and unrepaired it is 0 by 0.88. Zero R() in the
CA. `drawNest` rides in drawFaceRow; `birds[]` carries the martins on their own cap and roll.
**Measured**, 6 seeds x 2 years (probes/mart-{year,mud,mass,birds}.mjs). CURVE 0 -> plateau 33..94
-> 0, empty in autumn and in late winter 6 of 6. CLUSTERED: mean run **9.7..16.3** v a uniform
control at the same count on the same line, **1.26..1.78**. DRAWN: FULL minus FULL-with-`mart`-zeroed
is 371..776 px at 1600x950 on a same-code floor of **0**, 0 px empty. **0 of 682 clinging birds off
a nest.**
**Gates:** census PASS (`martinNests` 158, `eaveLine` 1953, winter 0) · motion PASS · perf +0.0% ·
filmstrip 0 POP · 6 framings.
**Verdict:** shipped
**Surprise:** the mud gate can starve a whole year. Two seeds of six saw **0 wet ticks of 1685**
between the birds arriving and leaving — no rain at all in season — and those eaves stayed bare for
the town's whole first year.
**Law:** the census's three ages equalise WARMTH, a cosine, so they sit at TWO phases: a season not
symmetric about midsummer reads on ONE cell of three.

## Iteration 190 — a visit at a window is offered inside the lamp's own hours (2026-09-04) [Roofs & skyline × Connect]

**Brief:** b190 — c275: a lamp goes out under a figure at s = 0.4
**MEASURED** (`probes/pane-truncation.mjs`, new: a RUN is a maximal stretch where `paneFigure` != null,
each sample also asked `windowLit`). Of **807 visits a year**: 158 CLEAN, **68 CUT SHORT** (half of
themselves, worst 97%), 55 LATE, **527 UNSEEN** (dark room all evening). **80% thrown away.**
**Did.** `lampBurn(sa,sb)`: windowLit's own body lifted out — this pane's evening burn `[on,off)`,
HOMES and all, written onto `windowHours()`'s fresh object so no other caller sees it. windowLit reads it
(lit/night **10.61 -> 10.61**: the lamp did not move). `paneFigure` reads it too and solves the
LENGTH before the hour, the last set-out being the one that finishes:
`t0 ∈ [max(FIG_T0,on), min(FIG_T1, span-0.8, off) - dur]`. After: **0 CUT, 0 LATE, 0 UNSEEN**.
**Re-priced.** Every accepted coin is now a WHOLE visit: density 0.91 -> **1.64**. `FIG_SHARE` 0.32 ->
**0.16** holds #182's hand-tuned look: **0.98 of 10.61** v HEAD's 0.91 of 10.61, 59/17/9% at 0/1/2 v
57/18/12. (The brief's 1.17 of 13.05 is #182's own, pre-drift.)
**Gates:** census PASS (unchanged: render state) · motion PASS · filmstrip 0 POP · 5 framings · look
probe 122 px on a 0 px same-code floor (HEAD 77) · perf skipped
**Verdict:** shipped
**Surprise:** the bug the brief named was the small half — 68 truncations against 527 visits offered
into dark rooms. The two clocks did not merely disagree at the END; they barely overlapped.
**Law:** two clocks over one subject: the one owning its EXISTENCE bounds the other. And a hand-tuned
SHARE prices the YIELD — a fix making each accepted coin pay must re-price the coin.

## Iteration 191 — the ledge reads the year and the weather (2026-09-04) [The sill & the observer × New element]

**Brief:** b191 — drawSill's one world input is `daylight`; make Feb and July two pictures.
**Did.** Six readers off `seasonPhase`, closed both sides: `gerLeaf` (stubs at 0.10
through the cold, never 0), `gerBloom`, `gerDrop`, `sillFrost`, `sillWet` (wetBucket x windF: the
wet is the town's, the REACH the wind's), `sillSnow`, `sillCup` (a salted per-day hash, likelier in
the cold, a whole day at a time so nothing can pop mid-afternoon). Stems, leaves and umbels
inside sillBoxes' unchanged box; rime, a snow lip and beads on the OUTER edge; what it drops lies
on it. `sillAt`/`gerName` name pots, cup and ledge FIRST in `lookAt` (c282). All of it stays in the
ground cache, reading only what it repaints for.
**Measured** (`probes/sill-calendar.mjs`, new), seed 7, hour 17.0. Feb v Jul in the band at
1600x950: **NEW 50200 px v HEAD 39964**, same-code control **0**. NEW v HEAD at ONE
instant **@Feb 9859, @Jul 638**; ABOVE the band **0 px, every size**.
**Gates:** census PASS (unchanged) · motion · filmstrip 0 POP day and night · 6 shots · rebuilds
**76.03 -> 76.03/day, 0.0%**, causes identical.
**Verdict:** shipped
**Surprise:** the isolation is **15:1 winter to summer** — HEAD's nine-leaf pot already WAS the
summer plant, and the sill lacked every other month. And my cleanest control failed by
design: pin `daylight` and HEAD's strip STILL moves 10638 px from February to July, because the band
is composited under `applyLight`, whose sun colour is seasonal. The function read one input; the
picture never did.
**Law:** a cached layer's inputs are not its PICTURE's inputs — what is composited over it after
the blit is an input too. Price a "reads nothing" premise on PIXELS, not the function body.

## Iteration 192 — the waterline moves with the year (2026-09-04) [River & far bank × New CA]

**Brief:** b192 — give the channel a LEVEL. Attempt 1 left 174 lines uncommitted; that design is
its own. I audited it and fixed two defects.
**Did.** `riverLev()` = greyF()'s cosine run `RIVER_LAG` 0.075 of a yr late, cashed by `stepBank()`
against `bankBed[]`, a hashed bank height per cell — negative in the channel, positive on the bank.
`BANK_CELLS` is #181's margin re-read as HEIGHT. New tile `SHOAL`, in neither `water` nor `green`;
`onChannel` widened so a lap is river to the cache.
**Defects.** (1) A REED cell flipping to SHOAL lost its rushes from the item loop — while REED_RUNS,
static since the sow, cast their image into the water still — and froze its stage (`blooming` +3);
`reedHere(i)`. (2) The BARGE ran aground: reedKeepOut clears the length she LIES alongside, not the
column she RUNS; lane cleared, 103 -> 90.
**Measured** (`probes/river-level.mjs`, new; 6 seeds x 26 d). A CURVE: shoal 0·0·0·0·6·25·40·50·**53**·
50·41·29·8·0…, lap peaking 26 at day 21; most cells crossing in ONE tick **3** (#181's 13). Uncovered
**9 of 27 days, exactly 0 on 18**; 0 entities on mud.
**Gates:** census PASS (summer `water` -72, `green`/`developed` UNCHANGED; winter SIDE -78 -> WATER
+78) · motion · 0 POP · frame-diff **0 of 1,054,852 px at the anchor** · look 2049/1417 px on a 0 px
floor · repaints +3.7%
**Verdict:** shipped
**Surprise:** the brief said the census could not see the low end and told me to say so in my own
words. It can: the three ages sit at two phases symmetric about midsummer, but riverLev is LAGGED,
so those two are no longer one number and the strand reads on one cell of three.
**Law:** #189's, backwards — a symmetric ladder CAN see a term whose extreme is off midsummer.

## Iteration 193 — the market's size tracks the year (2026-09-04) [Lane & market × Deepen]

**Brief:** b193 — re-measure the supply MK_NEED is set against; set the rungs on it.
**Measured** (`probes/market-need.mjs`, new; 6 seeds x 4 yrs = 156 markets, AT THE LATCH). Supply **0**, p25 20.0, MED **51.5**, p90 100 — #184's are stale both ways: 3 stalls on 82% not 86%,
and mkTotal **0 IS reachable** (8 of 156 under 2 units).
**Did.** `MK_NEED = [0, 2*MK_GOODS, 2*MK_CAP]` — two board-loads for a second trader, two market-loads
for a third. 4 and 13 were #30's quartile and median, and #172's crew has since doubled the store, so
both sat under today's p25. Mean pitches open, midwinter -> late autumn: 2.79 1.92 2.13 3 3 3 3 3
-> **1.88 1.25 1.58 2.92 3 3 3 2.75**; three-stall markets 82% -> 62%. Then the couplings a live rung
woke: capacity was the three pitches that EXIST and is off mkOpenCount() now (a control differing in
only that strands **5.2 units a 2-stall market**, candidate 0.02); and `tapCallers`, which stood the
evening trader down with stall 2, takes the last that traded.
**Gates:** census PASS (reshuffled — that trader walks every market now) · motion · 0 POP day and
night · lane, day 22, one seed: HEAD's three thin boards [5,5,5] -> two full [6,6,0], pavement bare.
**Verdict:** shipped
**Surprise:** the crate-spot guard for the same coupling measures **exactly 0** — 1343 footway cells
with and without: a market thin enough to close a pitch carries 3 crates at most, and the first 3
spots belong to the first 2 pitches.
**Law:** making a DEAD constant live wakes every coupling keyed to what it gated — capacity, a spawn
and a draw site all assumed the full set. Re-price them all, and spell a rung in the system's OWN
units, never as a quantile of a distribution that moves out from under it.
## Iteration 194 — the plaza gets a day of its own (2026-09-04) [Plaza & quay × New element]

**Brief:** b194 — a market, a concert, a bonfire and a cart on the calendar; the plaza none.
**Did.** `isFairDay()` = `hash(day, 907 + WIND_SALT) < 0.2`, ~5 days a 26-day year, salted.
`fairF()` is the concert's shape (up 1.6 h, hold, down 1.5 h) on hours off the sun and drives
all of it: `fairDress()` garlands the fountain rim and hangs two bunting swags between the
plaza trees; the CROWD is the concert's model — 10 claimed `FAIR_SLOTS` on an ellipse north and
south of the basin (13 cells of x: a full ring has nowhere to stand), own tick, own rate, own
budget, and nothing out of `PLAZA_PLACES` — a band in that ladder is a share, not a source.
In by the alley, priced like the families.
**Gates:** census PASS (the diff is the new `R()`'s reshuffle) · motion PASS · 4 shots + Plaza
camera + mobile · filmstrip 0 POP · dressing 2042/850 px on a same-code floor of **0 px**. `probes/fair-year.mjs`, 6 seeds × a year, 34 fair
days v 122: plaza presence in the window **15.51 v 9.81**, standers **3.00 v 1.35**; the pinned
ref `8682828`, on the SAME days, reads ×1.07 / ×1.43.
**Verdict:** shipped
**Surprise:** over 2 seeds × 8 days the fair "pulled" +40% into the LANE and the COURTYARD —
clean and wrong. Its days fell late in that run and this town RAMPS (maturity, `day >= N`), so
the comparison read the ramp. Over a year both go flat. Not noisy — biased.
**Law:** a per-day event judged against "the other days" of a short run reads the town's own
RAMP as its effect — pool a YEAR, and label the days from PRIMITIVES so a pinned ref labels the
same ones.
**Cue:** 4 of 34 fair days filled 0 slots — `fairGathering()` refuses on `raining` and that is
the only window, so a shower at the raise costs the whole day.
## Iteration 195 — how much of the shelf still runs (2026-09-04) [The sill & the observer × Harness]

**Brief:** b195 — smoke-run every probe; the NUMBER is the deliverable.
**Did.** `probe-smoke.mjs`: every `.mjs`/`.sh`/`.py` probe spawned with a timeout, N-way
→ PASS / THROW / TIMEOUT, timeouts split `partial`/`silent`. Manager cadence, not a gate.
**The number** (75 s, 7-way): **361 instruments — 230 pass, 35 throw, 96 time out**, 58 of
the 96 partial. skill 283 · root 56 · scratch 23.
**THREE trees, not two.** The third is a *tracked* `probes/` at the repo root: 56 files, 36
iterations, **#191/#192/#193 landed there**, named by no doc. SKILL.md's "`git mv` it into
`probes/`" is correct for the WRONG tree from the repo root; it now spells the path out.
**One cause owns 9 of the 32 .mjs throws:** `spawnSync git ENOBUFS`. courtyard.html crossed Node's
1 MiB default `maxBuffer` at **#181**, so every probe shelling `git show HEAD:courtyard.html`
without raising it has thrown for 13 iterations — the *control* pattern LAWS.md mandates, dead
across the shelf. Fixed the 2 where `maxBuffer` sat as a 3rd arg `execSync` never reads.
**Gates:** census PASS · visual PASS. HARNESS — courtyard.html is byte-identical to HEAD, so
`srcChanged:false` is expected.
**Verdict:** shipped
**Surprise:** `probes/README.md` closed this bug at **#11** — "There is one `probes/`, and this is
it." It held 102 iterations, reopened at #113, and has sat in the winning tree denying the loser
since. `bonfire-year.mjs`, the brief's motivating corpse, **passes**: #185 fixed it.
**Law:** an instrument is a build artifact too — nothing runs the shelf, so a probe breaks silently
and stays broken, and the cause is usually not the probe but the ARTIFACT crossing a limit it never
named. Smoke a control before you trust it.

## Iteration 196 — a moon to see by (2026-09-04) [Sky, light & weather × Connect]

**Brief:** b196 — #188 put a month on the calendar; no light in the town could see it.
**Did.** `moonLight()` = moonLit × ALTITUDE × (1 − cloudCover), RAMPED off nightF and gated on the
DISC's own `daylight`. INSIDE applyLight's night multiply, signed about MOON_REF so both ends open.
Then `drawMoonSheen()` in the screen pass — water, ice, snow, wet paving, the near slates — off the
GRID via cellRuns().
**Pivot MEASURED** (moon-light.mjs, 6 seeds × a lunation): mean **0.162**.
**HEAD → cand, same instants** (moon-night.mjs, 3 seeds × a lunation, 1,062 frames): mean **47.94 → 48.30 (+0.75%)**, RANGE **75.7 → 79.0**, **715
darker, 340 brighter**; new under cloud 49.71 → **45.23**, full and clear 38.43 → **57.44** (sd
20.9 → **29.2**). CONTROL, one instant, only MOON_START moved: **33.3 → 51.5, ×1.55**. The DAY frame
is **0 of 778,752 px** off HEAD; that test at night, 21.4%.
**Gates:** census PASS (unchanged — zero R()) · motion PASS · filmstrip 0 POP · 8 framings · not
in `lightNow()`: 98 ground rebuilds/day on BOTH builds.
**Verdict:** shipped
**Surprise:** the slate pass cost **2.641 ms of a 5.8 ms night frame — 47%** — and perf.mjs read
+0.0% straight through it, vsync-locked at 16.70. Not the arithmetic: baking every corner height
into a Float32Array changed **nothing**. It was 5,475 canvas path calls. The camera is still
on **599 of 600 frames** of play, so a Path2D keyed on project()'s own seven terms: **0.001 ms**.
**Law:** a lift taken out of a multiply's ALPHA moves every channel toward the un-multiplied
source, so it WARMS — only the COLOUR lifts and cools at once (50% off alpha: blue/red 1.27 v
HEAD's 1.90). A per-cell overlay's cost is the PATH BUILD, not the fill.

## Iteration 197 — the allotments are allowed to go over (2026-09-04) [Cross street & allotments × New CA]

**Brief:** b197 — a weed CA on the beds, founded on a cell fallow past some age.
**Premise half wrong** (allot-neglect/allot-age.mjs, 6 seeds x a year). bAge on an EMPTY bed
— the clock the brief named — counts DOWN: over 437,580 cell-samples its **max is 19.98 s**,
and it stands on 2.48% of them. Nothing is ever fallow *past* an age. Its OTHER branch, on a
PLANTED cell at its ceiling, counts UP unbounded and is cleared only by plotAct's weeding
rung — **max 232.8 s**. Right array, wrong half.
**Did.** `rank[]` in caTick beside the moss: FOUND on weedAge(i) (42..120 s, hashed, salted),
CREEP 0.5 along the drill / 0.22 across, SHADE off bSt, WORK off a climbing crop, COLD off
warmth. **Zero R().** The hoe rung goes FIRST in plotAct: the rung beside it fires **5x in 6
seed-years** — `up.length` takes almost every visit. Drawn in the GROUND CACHE with the moss.
**Gates:** census PASS (rankBeds 287, winter 0) · motion PASS on a HEAD-pinned baseline ·
filmstrip 0 POP · 6 framings · rebuilds and drawGround flat, interleaved. MASS **1,658-2,894
px at 1600x950**, same-code floor **0 of 18 rows**. SPREAD, peak quarter: **77.9%** of frames
hold 3+ clean plots AND 3+ gone right over.
**Verdict:** shipped
**Surprise:** WEED_WORK is the whole build. Without it the block goes **uniformly rank** — 66%
of plots pegged at the top, the middle bands empty — as dead a picture as uniformly tidy, just
inverted. What makes it read is that the HARVEST CYCLE holds weeds back: a plot being lifted
and re-sown is ground being worked, and one nobody reaches is not.
**Law:** a "nothing shows X" premise names a STATE, usually on the OTHER BRANCH of the array
named. Price both halves before calling a system absent.

## Iteration 198 — the rain stops shutting the gate (2026-09-04) [Courtyard & garden × Connect]

**Brief:** b198 — c279: the garden's inflow should read the weather.
**Neither named bound was the bound** (lawn-weather.mjs, 6x26, every sun-up tick classed
fair/coming/RAIN): rain is **11.7%** of the sun's window, `lawnOpen()` true on **0.0%** of
it, **0 of 1,221 set-outs**. Not the cap, not the rate — `!raining`, carried since #95,
when nothing in the garden had a roof.
**Did.** (1) `lawnAdmits(k)` = `lawnRoofed(k) || !raining`, asked at the CHOICE in
spawnLawnAgent; `lawnOpen()` keeps only the sun, so in rain the kind list is the arcade
alone. (2) `LAWN_WET 0.35` on `lawnRate()` — the SLACK bound: a wet tick is at LAWN_CAP
**10.8%** v a fair one's **27.0%**. Swept on the AXIS, six settings, in the source.
**Ref -> cand:** under the walk **0.404 -> 0.763 people per rain tick** (arcade.mjs); four
there at once in rain, **day 139 -> day 13**. #186's stroll-weight control 0.20/0.12/0.07:
**474/480/479 -> 514/490/501** (#186: 495/491/488) — new inflow, not off the benches. Fine
days untouched *exactly* (lawn-dry.mjs): rain held off, **6/6 seeds byte-identical over 12
days**, census too; rain left in, **0/3**.
**Gates:** census PASS · motion PASS (HEAD-pinned) · filmstrip 0 POP · 4 framings + the
arcade in rain · #168 lawn-dark flat per visit.
**Verdict:** shipped
**Surprise:** the gate was not it — the VISIT was. An arcade stay is released by the
weather (`a.arc`), not a timer, so at an unchanged rate a wet courtyard came out **fuller
than a fine one, 4.25 v 4.15.** A roof does not only admit people, it holds them.
**Law:** a place whose stay ends on a CONDITION turns inflow into presence at a different
rate from its timed neighbours — price presence as rate x visit before choosing the rate.

## Iteration 199 — somebody in the room before dawn (2026-09-04) [Roofs & skyline × Deepen]

**Brief:** b199 — c283: #190 fixed the EVENING burn; windowLit's sunrise branch was never
offered a paneFigure, so first light was lit panes with nobody in them.
**Premise** (`probes/pane-morning.mjs`, new, on HEAD): **4.55 lit panes** per pre-dawn sample,
**0 visits a year** — a third of the evening's lit population, not the two I guessed.
**Did.** (1) `lampBurn` gains `[rOn, rOff)` — the early-riser test lifted out, in the night's
units: `t = span - D + s`, `D = dawnEdge() - sunUp`, which `rOff` cancels exactly.
windowLit reads it: **0 disagreements over 2,595,892 pane-samples** (9.8% lit: not vacuous).
(2) One visit is offered over that burn — no band to intersect, the burn IS the offer, so only
the LENGTH is solved before the hour; `paneWalk()` factored out, told apart by `k = FIG_SLOTS`,
so the evening's coin is untouched. (3) A 9.4 h midsummer night leaves the evening band open at
that pane's `rOn`, so `mLo = max(rOn, hi)`: the morning starts no earlier than an evening visit
must END by, disjoint by construction.
**A year:** MORNING 0.006 -> **0.641** figures/sample of 4.55 lit, **0 -> 182** visits, nights
with one **0 -> 87/104**. EVENING identical: 1.152 of 11.95, 886 visits.
**Gates:** census PASS (render state) · motion PASS · filmstrip 0 POP · continuity 0 swaps both
sides · look 199 px on 0 px
**Verdict:** shipped
**Surprise:** the continuity gate reported **754 swaps/yr on HEAD** before I priced its
threshold. u moves 1.08 in 0.24*dur on the exit leg — 7.5 u/h — so 0.4 per 0.1 h flagged the
walk's own fastest phase. The instrument, not the build.
**Law:** a jump threshold is priced off the subject's FASTEST phase, not its mean; a swap only
SHOWS if both ends are inside the aperture.
