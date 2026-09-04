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

## Iteration 200 — the lap freezes with its channel (2026-09-04) [River & far bank × Fidelity]

**Brief:** b200 — c286: `ICE_CELLS` is built from `onChannel()` at BUILD time, when the towpath's
first column was still SIDE. #192 widened `onChannel` so a winter lap is river; the list was frozen
already, so the water the flood lies over could never take ice.
**Premise, HEAD** (`probes/lap-ice.mjs`, 3 seeds x 3 warps): **26 lapped cells, 26 of them against
ice over ICE_SET, 0 in ICE_CELLS, 0 carrying any skin.**
**Did.** (1) `buildIceLap()`, once, after `buildBank()`: 35 cells read off BANK_CELLS
(`bankWas === SIDE`), never re-derived. Shelter 1.0, distance transform untouched, so every existing
`iceShel`/`iceTop` is byte-identical: it ADDS cells, it does not re-cut them. (2)
`iceHere(i)`, the one live test — step, `riverSkin()` and census all ask it, so `margin` is what was
walked. (3) `stepBank`'s `if (t === ICE) continue` was the coupling, now the STRAND's guard only: the
level owns a lap cell, skin and all, and water off the path clears `rice[i]` in the same tick.
**Gates:** census PASS, pre-edit baseline — **summer nine byte-identical**; winter ICE +57/WATER
-57, margin +78 · motion PASS incl. `night` (warp 1230), HEAD-pinned · 0 POP · look
**1324-1343 of 1805 lap px on a same-code floor of 0-24** · `lap-year.mjs` **0 violations**, 137/858.
**Verdict:** shipped
**Surprise:** frozen +19/+17/+21 is exactly the lapped cells iced. I expected the new neighbours to
feed `iceNb` and push the old margin's front in; not one channel cell crossed ICE_SET that had not
already. The front was at its ceiling.
**Law:** a build-time list derived from a predicate is a HOSTAGE to it — #192's widened `onChannel`
silently un-completed a set frozen at #181. Grep a widened predicate's READERS, not its callers.

## Iteration 201 — a terrace that is somebody's with nobody on it (2026-09-04) [Our block & the leads × Deepen]

**Brief:** b201 — price how often a tenant is up on the leads, then give the terrace FABRIC.
**Premise** (`probes/terrace-presence.mjs`, new, HEAD, 6 seeds × a year, 10,362 daylight samples):
**0.2102 tenants a sample, 18.57% with anybody up** — four daylight moments in five the frame's
foreground quarter is bare, and the supply is six bays, not the cap.
**Did.** `leadsKit(bay)`, every branch hash(house): pots, a crate stack, a chair, a mat, `tidy`,
`wash`. No two of six alike; 23 pieces. `drawLeadsFabric()` is in the GROUND CACHE before
drawRoofFurn so the cords hang over it, and reads only what that cache already repaints for:
`potLeaf`/`potBloom` closed both sides of seasonPhase, `chairTip()` a SCALAR folding the chair onto
its own seat as the wet and cold come in, litter that GATHERS into a corner. `freeBay(k, want)` pegs
only where a line hangs; a sun stay takes the chair.
**Gates:** census/motion PASS · 0 POP · drawGround **+0.20 ms on 27.1**, no new dirty reason ·
`probes/terrace-mass.mjs` **424/483/343 px at 1600x950, 104/131/77 at 390x844** on a same-code floor
of **0 px every row** · northmost drawn point **85.14** on the 84.93 bound · presence 0.2029 / 18.26%.
**Verdict:** shipped
**Surprise:** the fabric is FREE to the seeded world and it was PROVABLE. `probes/terrace-identity.mjs`
censuses the build with its one behaviour change backed out against HEAD: **6 field diffs over 3 seeds
× 300 s, all the new field and its subtotal.** Every other number in the histogram is
`freeBay`'s filter, one refused spawn.
**Law:** a cached draw is free to the seeded world, so a build with its one BEHAVIOUR change backed
out must census IDENTICALLY to HEAD but for its new fields.
## Iteration 202 — the martins get a second mud source: the river's strand (2026-09-04) [People & animals × Deepen]

**Brief:** b202 — the mud is on wetF() alone and two worlds in six see no rain in the birds' season.
**Priced first** (probes/mart-mud.mjs, 6 seeds x 2 yr): first-season integral 0, 8.1, 55, 64, 214, 222;
year-one peaks 0, 1, 24, 39, 63, 126. Premise holds — 2 of 6 towns open bare.
**Did.** `martStrandF() = MART_STRAND_K * clamp(bankDry / MART_STRAND, 0, 1)`;
`martMudF() = max(rain-mud, strand)`. `bankDry` is stepBank's uncovered river bed — mud by
definition — and riverLev() is a CALENDAR, not weather: the same in every seed, 0 cells until phase 0.40, 43
at midsummer, gone by 0.72, in a window of 0.27..0.70 (probes/mart-strand.mjs, new). So a rainless
colony is founded LATE, at midsummer. K=0.07 off the strand's own season
integral (~760 -> 53), between the two thinnest years that already grew one.
**Gates:** census PASS (reshuffled: nests arrive earlier, so martSpot()'s R() draws move) · motion PASS · 4 shots + a midsummer pair v HEAD · filmstrip 0 POP · mart-mass
130-719 px on a same-code floor of 0 · mart-birds offNest 0/6 · mart-year: year-one peaks -> 20, 24,
45, 56, 61, 108, **6 of 6 colonies**, meanRun 9.0-41.7 v a uniform control's 1.27-2.17, empty in late winter 6/6, all back to 0 by 0.923.
**Verdict:** shipped
**Surprise:** the wettest world got no denser — seed 99's peak 126 -> 125 — while the thin ones
converged UP (42: 39 -> 76, 271: 59 -> 85).
**Law:** where one quantity has two sources take the MAX, not the sum: it lifts the starved tail
without moving the head, which a threshold cannot do. Size the second off the TAIL's own missing
integral, never the mean. A SEASONAL driver is the same in every world — that is what makes it an antidote to a weather coin.

## Iteration 203 — the moon shows on the sky's terms, not the sun's (2026-09-04) [Sky, light & weather × Fidelity]

**Brief:** b203 — the disc is gated on `daylight`, which OVERLAPS nightF. Measure the hole, close it.
**Measured first** (probes/moon-hole.mjs, new, HEAD, 6 seeds x a year): **792 of 6,690** samples with
nightF > 0.5 and the moon up drew NO disc — 11.8%, ~27 h a year, all at DUSK in moonArc's 1.4 h lead on
sunset; and the river carried the glitter column in **810** of them with no moon in the sky.
**Did.** `moonShows() = nightF > MOON_ON && moonAlt() > 0` — ONE predicate for the disc, moonLight(), the
sheen and the river's column; sun and moon stop being exclusive. The fault it turned up: moonCells() cuts
water/wet/snow off a `grid` that MOVES all year — 89 px between bakes, and a bake under ice loses the river
for good; stepBank/stepIce un-bake it now.
**Gates:** census IDENTICAL · motion · perf +0.0% · probes/moon-frames.mjs (new) **DAY 0 px off HEAD**,
NIGHT/LATE 0, hole 792 -> **0**, glitter -> **0** · filmstrip at the crossing: HEAD steps **2.392** on its
0.824 median, the build **0.429**.
**Verdict:** shipped
**Surprise:** the disc is drawn and cannot be SEEN — drawSunMoon paints BEFORE the backdrop blit, so all
through the hole it is behind the distance: its own 377 px move <=4.5 luma, and a full moon forced onto the
instant moves them 4.7. What the hour gains is the LIGHT, 216,782 px over 4 luma at 21:09, because
moonLight() returning 0 was never "no moon" — it was mk = -MOON_REF, the darkest there is, on every dusk.
**Law:** a gate opened on a DRAWN thing is not a thing SEEN — price it on the subject's own pixels at its
strongest phase, or occlusion reads as faintness. A term signed about a measured pivot has no "off": a 0
into it is a claim, and the extreme one.

## Iteration 204 — the fair's gathering is a budget of DRY hours (2026-09-04) [Plaza & quay × Deepen]

**Brief:** b204 — a shower over the 2.6 h at the raise cost the whole fair day. Make the fair survive it.
**Measured** (probes/fair-rain.mjs, new, 6 seeds x a yr, HEAD): 4 of 34 fair days filled 0 slots and **all four were
raining for 100% of the gathering**; two had >2.7 dry hours left. Then the WALK (probes/fair-walk.mjs, new):
gate to slot is **1.2-8.6 h, median 4.4** — #194's comment said 0.8-2.9, the straight line and not the route.
**Did.** `FAIR_GATH_H` 2.6 h of DRY weather, `fairGathSpent` never refunded, so the offer still ENDS. The far end is no
longer a clock: `fairFits(s, plane, speed)` prices the route this walker will walk at the speed they will walk it (the
town's own `pathHours`), and takes a slot only if the arrival lands with FAIR_STAND_MIN of fairF() left.
**Gates:** census PASS (reshuffled) · motion · perf +0.0% · filmstrip 0 POP · 4 shots. v a control RUN on HEAD:
zero-slot fair days **4 -> 1**, the one left winWet 1.00; fill 8.12 -> 8.41; fair-year plaza presence 15.37 -> 16.15,
standers 3.05 -> 3.12. Six FRESH seeds: 0 of 29. FAIR_STAND_MIN is live: standers 2.16 at 0.5
and **2.35** at 1.0; 3.0 puts the zero days back to 4.
**Verdict:** shipped
**Surprise:** the walk is most of the fair. Ten slots fill but only ~3 are ever STANDING — the rest are on their feet
in the corridor for four hours of a six-and-a-half hour day. The fair is mostly a procession.
**Law:** a weather gate on a FIXED window spends the window on weather it cannot use: make the budget the RESOURCE it
needs and the far end becomes the WALK, priced per arrival or the rescue arrives to nothing. A route's cost is not the
distance between its ends — a lead down a corridor and round a ring is twice it.


## Iteration 205 — the winter row gets a floor (2026-09-04) [The sill & the observer × Harness]

**Brief:** b205 — three instrument cues. HARNESS: `courtyard.html` byte-identical to HEAD.
**Did.** (1) **WCORE**, the winter row's own collapse floor off its own baseline, one tolerance per field,
`frozen`/`margin` off the `ice` block, which no scalar sees. Cut from DRIFT, not seed spread
(probes/winter-drift.mjs, new; #189->#204, six builds): worst downward step -0.3% grid, -0.9% frozen,
**-14.2% people, -13.2% planted**. (2)
`STRUCT_CONST`/`STRUCT_LIVE` + `constAudit()`, printed under every structure block, audited each run. (3)
`maxBuffer` on the last **10** unbuffered `git show :courtyard.html` captures — 8 tracked, 2 scratch tree.
**Gates:** census **PASS exit 0** · **the differential**, scratch worktree with #200's `buildIceLap()` call
commented out: HEAD's census exits **0**, this one **1** — `winter/frozen 1064->1014 (-4.7%, floor 3%)`,
`winter/margin 2118->2040 (-3.7%, floor 2%)`; at CORE's 8% that February break still walks · probe-smoke,
389/75 s/7-way: **247 pass, 36 throw, 106 t/out** (#195: 361/230/35/96), all 7 ENOBUFS throws gone.
**Verdict:** shipped
**Surprise:** fixing the ENOBUFS did not raise PASS at the smoke's own settings. All 7 run now — but 6 hit the
75 s wall at `--jobs 7`, and at `--jobs 4` every one **passes in 6.7-61.1 s**: they had never once been
allowed to run, so nobody knew they were long sweeps and not wrecks. And winter `structures` is **2427 of
2427 constant**, 100% against summer's 93%.
**Law:** an aggregate SUMMING two kinds of register is diluted by every constant added: report the constant
share beside the total, or a floor on the sum watches a number 93% frozen. A TIMEOUT is the RUNNER's
concurrency before it is the instrument's.
