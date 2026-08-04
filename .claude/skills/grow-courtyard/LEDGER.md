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

**Keep an entry under 3 KB (≈45 lines).** A worker reads the last **three** entries in
full, every iteration, so entry length is charged to the loop three times over. This
cap was 3.5 KB and advisory at pass #20; the next three entries came in at 4.3–5.7 KB
and three more workers opened OVER budget, so it is now measured by
`rotate-ledger.mjs`, which names any entry over it. If yours does not fit, the excess is
almost always a **law** (true of the next vector → `LAWS.md`) or a **cue**
(→ `state.json`), not a longer entry. Write the *surprise* at full length and compress
everything else; the surprise is the part that cannot be reconstructed from the diff.

```markdown
## Iteration <N> — <one line: what changed> (<date>) [<Domain> × <Kind>]

**Brief:** <id> — <one line of what you were asked to do>
**Did:** <what you actually built, concretely — symbols, not adjectives>
**Gates:** census PASS/FAIL (<the histogram line that moved>) · visual PASS/FAIL ·
motion PASS/FAIL/skipped · perf PASS/skipped
**Verdict:** shipped | reverted | no-ship   ← your view; runlog.mjs decides from the diff
**Surprise:** <what you did not expect — the most valuable line here, or "none">
**Law:** <only if it will be true of the NEXT vector too; the manager promotes it>
**Cue:** <a loose end you noticed and did not chase, or omit>
```

---

## Iteration 18 — the working day goes on the sun (2026-08-04) [Lane & market × Connect]

**Brief:** b17 — #11 moved sunrise and sunset across the year and nothing anybody DOES
followed. Put the working day on the sun, keeping each interval's relation to sunrise
and sunset rather than its number.

**Did:** every hour anybody works is now an offset from `sunUp`/`sunDown`, each chosen so
that at `SEASON_START` it reduces *exactly* to the constant it replaced. `kioskOpen()`
7.50–18.50 → `sunUp+2 .. sunDown-1.5`. `marketActive()` 8–17 → new one-definition
accessors `marketOpen()`/`marketClose()`, because three things read those ends — the
predicate, `marketRaise()`, and the pack-away line in `simStep()`. Sweeper 5.00–6.50 →
`sunUp-0.5 .. sunUp+1`. Wind announcement 7–9 → `sunUp+1.5 .. +3.5`. Two clamps, both
stated in the source: `MK_MIN_SPAN = 7`, because a pure offset hands midwinter a
six-hour market and that is a different feature; and `MK_EARLIEST = 7.2`, see **Surprise**.

**Gates:** census FAIL (attributable) · visual PASS (4 framings + a HEAD-beside-HERE pair
at two pinned instants) · motion PASS · filmstrip PASS · perf skipped ·
`probes/working-day.mjs` **34/34**. The probe is the gate that matters, because the census
cannot see a predicate: across four market days round the year every boundary holds its
offset from the sun at the moment of the flip (kiosk open `sunUp+2.02..2.05`) while the
clock times themselves move 2.2–2.9 h, and at `simT 0` all ten land on the old constant to
1e-9. The census FAIL is the PRNG reshuffle — `probes/census-noise.mjs` shows HEAD's own
9-cell total spans 8% on identical code just by changing seeds.

**Verdict:** shipped

**Surprise:** the sim day's rollover is a hidden tuning constant and it nearly ate the
feature. `hour` runs 6.00 → 6.00 and `day` rolls with it, so everything before 6.00 belongs
to the *previous* day's tail, where `isMarketDay()` is false. Stalls go up at
`marketOpen() - 1.10`; a midsummer opening at 6.50 puts that at 5.40, `marketRaise()`
returns 0 through the whole raise, and three near-finished stalls land in a single frame at
the rollover — exactly the pop `marketRaise()` was built to prevent, reintroduced by a
change that never touched it. The original source had already encoded this and I read past
it: the comment said the raise starts at "6.90", one decimal place from the boundary, and
did not say why that mattered. Second surprise, cheaper: my first neutrality assertion
failed and the code was right — I scanned day 26 rather than evaluating at the anchor
phase, and a day is 1/26 of this world's year, enough drift to fail a tolerance.

**Laws:** promoted — see the anchor law and the discontinuity law in `LAWS.md`.

**Cue:** the sweeper still starts half an hour before sunrise, where `daylight` is exactly
0. That is deliberate — "before the town wakes" is the point of him — but it is the seam
for anyone who later wants civil twilight as a real quantity rather than a clamped sine.

## Iteration 19 — the year is felt in how busy the town is (2026-08-04) [People & animals × Deepen]

**Brief:** b18 — a 52% swing in mean daylight was coming out as a ~15% swing in people.
Widen the breathing, let the three arrival sources breathe by different amounts, and hold
an absolute floor.

**Did:** *The compression.* `capacity`, `laneCap` and `eastCap` were each `k + span*(f +
(1-f)*d)`. Multiplied out, `k + span*f` is the share the sun never touches — 5 of the
courtyard's 14, 3 of the lane's 9 — and averaged over a day that fixed share is most of the
budget. Peak daylight is also 1.0 in *every* season by design (duration is the seasonal
lever, never midday brightness), so the honest swing available is bounded by the day-length
ratio, 17.5/11.5 = 1.52. So the year went onto the *varying* term as a multiplier and the
fixed term was left exactly alone. `yearBusy(ex)` is read off `daySpan()` rather than off
`warmth` — the same number, honest provenance, since what makes a July evening busy is that
it is still light. `ex` is exposure: `EX_COURT` 0.5 (walled), `EX_LANE` 1.0 (open),
`EX_EAST` 1.25 (you go out to it, across a bridge). `YEAR_SWING` 0.40. `eastCap` keeps
`Math.min(7, …)` because c10 says east agents retrace their inbound route and would queue
above seven, so summer spends its lift on reaching the ceiling *earlier in the day*.
*The rail.* `POP_FLOOR` 8 with `scarcity = 1 + 0.8 * clamp(POP_FLOOR - agents.length, 0,
6)`, multiplying the three arrival rates only — never the caps. Nobody pops into being.

**Gates:** census PASS (people 167→190) · visual PASS (`probes/year-shots.mjs`, five pinned
instants on HEAD and here: summer noon 23→28, winter noon 25→21, winter dusk 27→17; winter
night still legible) · motion: the only kind that moved is `raindrop` — the shower changed
scene under the reshuffle, and HEAD's own baseline records the same distribution;
**`walker`, the kind this iteration actually moved, is 0 jumps / 0 nan / 0 oob / 0 flicker
in all four scenes** · filmstrip clean, median Δ 0.410 · perf skipped · anchor assertion:
`yearBusy` is **exactly 1.0000** for all three exposures at `SEASON_START` and again one
full year on, so day one is provably the town as it was.

**Probe:** `probes/season-year.mjs` extended — 3 seeds × 60 sim days (~2.3 years) folded
onto one year, carrying `inCourtyard`, `onStreet - inEast` and `inEast` separately.
Summer:winter ratio — total 1.09 → **1.56**, courtyard 1.05 → 1.26, lane 1.04 → **1.94**,
east 1.40 → **2.10**. Settled mean 21.65 → 21.48: the year *redistributes* the town rather
than inflating it. Absolute floor across all 3,600 samples: 8 → **8**, equal to HEAD.

**Verdict:** shipped

**Surprise:** holding every night-time cap identical did not hold the night. The first build
left `capacity` and `laneCap` at `daylight` 0 byte-identical to HEAD in every season — and
the worst sample still fell from 8 people to 5. Most of a 03.00 population is not spawned at
03.00; it is daytime walkers still finishing forty-second trips, so an emptier winter
afternoon arrives at midnight as an emptier town, several sim hours later, through a term
nobody edited. That is also why the rail had to lift the *rate* rather than the cap: the
caps at night already permitted 5 + 3 = 8, and what was missing was arrivals to fill them.
The first rail (~1.25× at seven people) was too gentle and only reached 7.

**Laws:** promoted — see the cap/trip-length law and the flat-peak law in `LAWS.md`.

**Cue:** `scarcity` also fires in the first sim minute, when the town is legitimately empty,
so the opening fill is hurried compared with HEAD (day 4 mid-morning: 13 → 18 people).
`maturity()` still bounds it, but the very first minute is now a servo rather than a ramp.

## Iteration 20 — the paving learns which paving it is (2026-08-04) [Plaza & quay × Polish]

**Brief:** b19 — the click handler's `SIDE || ROAD` branch answers "You scatter crumbs onto
the lane" for the paving of five different quarters, and clamps its birds into
`LN_WALK_N..LN_WALK_S` so they land in the lane however far east you clicked.

**Did:** one table, `PAVING`, with six entries — `lane`, `bridge`, `cross`, `plaza`, `quay`,
`towpath` — each carrying its line *and* the box its crumbs' birds may land in, plus the
spread along each axis. `pavingAt(x, y)` is the single predicate that places a cell; it is
called only on a cell `answersTouch()` has already called SIDE or ROAD. The bridge deck is a
sixth place the brief did not name, found by walking the grid. No seventh KIND: still one
branch, still crumbs, still `birds.length < 4` and `daylight > 0.2`, still 3 birds and the
same two `R()` draws each. Bird placement moved out to `crumbSpot(p, x, y, k)`.

**Gates:** census PASS (scalars/tiles/life/structure/species all *unchanged* — a click
handler moves nothing the census watches, which is the point) · visual PASS (`east` and
`lane` byte-identical to pre-edit; `wide` differs but is **not reproducible run-to-run on
unmodified HEAD either**, so that diff is the harness) · motion PASS · perf skipped ·
**probe PASS** `probes/paving-places.mjs`.

**Verdict:** shipped

**Surprise:** the probe found two defects the brief did not contain, and I would have
shipped both. (1) The cross street and the quay run from **y = 0**, not y = 3 as I had
guessed from the towpath's `y < 3 ? WALL : SIDE`; 6+ cells were being named for a box they
sat outside. (2) Sampling three birds independently inside one small box put two of them
within 0.9 cells — the "renders as one shape" law — in **4 of 8** click cases, *including
the old lane behaviour*. So the pre-existing code had a second bug hiding under the one I
was sent to fix, and only a numeric check saw it. Staggering the three at fixed thirds of
the long axis with a ±s/12 jitter floors the gap at s/3.

**Law:** promoted — see the scatter law in `LAWS.md`.

**Cue:** the plaza's actual paving is `PATH`, and `answersTouch()` does not answer PATH — so
the plaza roundel around the fountain, and the whole courtyard path ring, are dead to the
cursor and to the click. `PAVING.plaza` only ever fires on the plaza's 6×4-cell **mouth**
onto the lane (24 cells of the world's 2903 paved ones).

## Iteration 21 — the sky joins the year, and rain may start in the dark (2026-08-04) [Sky, light & weather × Deepen]

**Brief:** b20 — `stepClouds()` and the rain roll both scaled on `richness()`, a ramp pinned since
day 16. Put the fronts on the year; fold in c8 (rain gated on daylight) and c35 (the motion gate
cannot see a raindrop). Do not raise the total rain.

**Did:** One scalar, `greyF() = 1 - 2*warmth` (+1 midwinter, 0 at SEASON_START, -1 midsummer), and
six terms on it. `FRONT_HEAVY 0.54 +/- 0.24` sets how often the next front is a grey one,
`FRONT_DEEP 0.06` lowers the lid it settles at, and `spellLen()` — ONE definition, read by the
front moving in *and* by the clearance behind a shower — makes a spell outstay itself in the
season that favours it (`FRONT_SLOW 0.30`). Rain then moves the OTHER way: `showerRate() =
1.6 - 0.9*greyF()` per second of full-cover sky, `showerLen()` +12% in winter, `showerHard()`
+/-25% on the drop count. Winter is a lid that does not rain much; summer breaks rarely and hard.
That opposition is what holds the annual total still while making the seasons unmistakable. Every
constant is the value `richness()` had already *reached* and stepClouds takes the same number of
`R()` draws as before, so greyF 0 is the old sky exactly. c8: the `daylight > 0.15` gate is gone,
replaced by `nightDamp()` — exactly 1 at any lit hour, `NIGHT_RAIN 0.12` in the dark;
`weatherComing()` keeps its own daylight damping and its comment now says why that is a different
question. c35: one line adds `raindrops` to `__entities()`, and `motion.mjs` gained a `SCREEN` kind
set (canvas bounds, px jump threshold, a recycle kept out of the drop's own step series) with the
old population row renamed `shower`.

**Gates:** census **PASS** (people 181->196, blooming +3, tiles/structure unchanged — reshuffle, no
collapse) · visual **PASS** (four framings; 16 pinned Jan/Jul afternoons) · motion **PASS**, new
`raindrop` row 0/0/0/0 on jumps, nan, oob, flicker in both scenes that rain · filmstrip night
**POP at frame 11**, diagnosed with the new `probes/pop-what-moved.mjs`: cover pinned at 1.000 the
whole strip and `nightF` lifting off zero — a winter sunset, and `daylight` does not read weather,
so that frame is HEAD's · perf **skipped**, no new per-frame pass · probe
`probes/weather-year.mjs`, 8 seeds x 3 years folded into season quarters, HEAD -> here: overcast
winter **33.3 -> 54.5%**, summer **30.4 -> 13.5%**, spring/autumn **29.8/27.5 -> 30.9/27.4** (the
anchor seasons land on HEAD — neutrality measured, not asserted); summer 37 showers at 119 drops
against winter's 70 at 78; **annual rain 9.48% -> 9.85%**; dark starts **1/208 -> 40/217**.

**Verdict:** shipped   ← my view; runlog.mjs decides from the diff

**Surprise:** The first build came out **+38% rain** and I had reasoned it would go *down*. Two
mistakes, and the second is the interesting one. (1) Cover is slew-limited (0.02/s rising) against
~42 s fronts, so a grey spell only just reaches its target before the next arrives — lengthening
winter's greys buys *more* overcast time than shortening summer's gives back. (2) At `FRONT_SLOW
0.35` the probe reported spring 13.4% wet against autumn 8.3% — a 60% split between two phases
where every term I had written is *identical* by construction. It is hysteresis: a slow scalar
carries the season it came from across the boundary, so spring inherits winter's lid and autumn
summer's blue. At 0.30 it fell back to HEAD's own 30.9/27.4. I nearly went hunting for an
asymmetry bug in symmetric code.

**Law:** A slow scalar's season is not the season it is in. A rate-capped variable carries the
previous quarter across the boundary, so the phases either side of an anchor come out *unequal*
even when every term reading the phase is symmetric by construction — hysteresis, not an algebra
bug. Measure the shoulder seasons: they are the neutrality claim, and if they land on HEAD the
anchor is proven by the same run that measures the range.

**Law:** Extending how long a state lasts is not the inverse of making it rarer. Anything that
slews toward a target reaches further the longer it holds, so a symmetric +/-x% on duration is a
net *increase* in time spent at the extreme. Budget the effect on the total before tuning the
contrast, against a folded multi-year probe — one year of a stochastic system is a sample.

**Cue:** Two recorded in `state.json` rather than here, since the entry was over budget without
them: winter's new share of umbrella-band time, and cover saturating at 1.000 in deep winter.

## Iteration 22 — the ground is told about the lid (2026-08-04) [Sky, light & weather × Polish]

**Brief:** b21 — `cloudCover()` veiled the sun's disc and nothing on the ground was ever told, so
under a grey lid the lane still had crisp midday shadows. Fade AND soften every cast shadow off
ONE term, neutral at low cover. Only the cast shadows; leave the lit-side shading alone.

**Did:** One scalar, `shadowF()` — how hard the sun's edge is — and two derivations of it, so the
three things cover does to a shadow cannot drift apart: what fades also WIDENS (`shSpread()`) and
PULLS IN (`shOffset()`). `SH_KNEE 0.32` is fair weather and changes nothing; `SH_FULL 0.94` is a
sun with no edge left; `SH_FLOOR 0.20` is the trace that survives, because even a lid is brighter
overhead than sideways. Eight sites read it: the tile shadow off every wall and eave
(`drawShadows`), the courtyard linden, the lane/orchard trees, the bandstand, the shed, the
balloon, the bridge on the water, and the person patch. Two of the eight take only part of it and
say why in a comment — a person's patch and the water under a deck are occlusion, not sun, and
fading them the whole way makes everybody float on a grey day. The tile shadow is the one that
softens for *real* rather than swelling: it is a grid of quads with no radius to grow, but it
lives on the CACHED ground layer, whose rebuild bucket already rides cover, so a
`ctx.filter = 'blur()'` there costs nothing per frame (feature-detected once as `CAN_BLUR`; older
Safari degrades to fade-and-retract). Every expression is `x * f()` or `x - k*(1 - f())`, so below
the knee the multipliers are exactly 1.

**Gates:** census **PASS** (unchanged in every section — a draw-only vector, as expected) ·
visual **PASS** (five framings incl. mobile; plus wide/courtyard/east at cover 0.10 / 0.60 / 0.95
against the same instant on HEAD) · motion **PASS**, nothing new · filmstrip day **no POP**; night
**POP at frame 11**, which is #21's known winter sunset — `pop-what-moved.mjs` on *HEAD* shows
cover pinned 1.000 and `nightF` lifting there, and since cover is constant across that strip my
term is constant too and can only *shrink* its frame-to-frame Δ · perf **PASS** (16.70/16.70,
vsync-capped, so the real number is the probe's) · probes: new `shadow-cover.mjs` — ground layer
**byte-identical to HEAD at cover 0.10, 0.25, 0.32** and all three multipliers exactly 1.000 there,
then gradual and monotone: 0.45 → 0.95 lifts 2.5–3.1% of sampled pixels by a mean of **+5.5 → +16.1
luma** (main canvas +3.0 → +10.3, against a measured real-time noise floor of 0.03%) · new
`ground-relight.mjs` — rebuild jumps **max 0.325 vs HEAD's 0.363**, and a lidded relight is
**11.0 ms vs HEAD's 11.7**.

**Verdict:** shipped   ← my view; runlog.mjs decides from the diff

**Surprise:** The blurred, lidded relight is *faster* than HEAD's unblurred one. I had budgeted for
the blur and instead the pass got cheaper, because `shOffset()` is upstream of a `continue`: as the
throw retracts, more and more shadow cells land back on their own solid cell and are skipped
entirely, so the path being filled shrinks faster than the filter costs. A term I added for how the
frame *looks* turned out to be a term that decides how much geometry there *is*. The cheap version
of this mistake is the opposite one — I could as easily have put the retraction on the far side of
that test and quietly doubled the path.

**Law:** Neutrality is cheapest to guarantee in the *algebra*, not in the tuning. Write every
seasoned or veiled term as `x * f()` or `x - k*(1 - f())` and the anchor is exact in floating point;
write it as `x * (a + b*f())` and `a + b` is 0.32000000000000006, so the identity you meant to
claim is a tolerance you have to defend. Then prove it as an identity — the multipliers read out of
the page as exactly 1, and a cached layer byte-identical to the ref — never as a small diff.

**Law:** Diff against the ref, not against the frame. When a vector rides a scalar that already
recolours everything (cover, season, daylight), no statistic of the frame is attributable: it moves
for reasons that are not yours. Render the same pinned instant in both builds at the same value of
that scalar and difference the pixels — every difference is then yours by construction. Measure the
live canvas's real-time noise floor the same way (ref against itself, two loads) or you will read
water streaks as a finding.

**Cue:** Context budget was **OVER (46.1 KB / 46 KB)** at the start of this iteration.

## Iteration 23 — the river joins the year (2026-08-04) [River & far bank × Deepen]

**Brief:** b22 — the river had one iteration in twelve and was the quarter most identical in
February and August. Give it a year, name the flow, anchor at `SEASON_START`.

**Did:** One term, `riverRun() = 1 + RIVER_SWING * greyF()` — how full and fast the channel
runs. ×1.45 in January, ×0.55 in July, exactly 1 at the anchor. The flow got a NAME:
`drawRiverFlow(t)` was twelve anonymous streaks inline in the frame loop, and now reads
riverRun() for drift speed, streak count (7–17), streak length and a colour written as an
offset from the two constants already there. Fifth reader is the water itself — `riverCol()`
leans toward `RIVER_COLD`/`RIVER_GREEN` and `clamp(mid * riverRun())` pushes the deep
mid-channel out to both banks in winter, back to a thread in summer. No `R()` consumed.
The boat moves the other way: `boatRate()` thins as the water rises (`BOAT_SWING 0.75`,
`BOAT_FLOOR 0.0065` binding all winter so `boatWatch()` never dies), `boatSpeed()` takes
`BOAT_DRIFT 0.24` of the current.

**Gates:** census PASS (reshuffle — the boat's spawn times move) · visual PASS · motion FAIL,
attributed (`market/shower`, a population row; `probes/shower-jump-spread.mjs` over 10 seeds:
HEAD 0..2, here 0..3) · filmstrip night POP = #21's known winter sunset · perf PASS · new
`river-year.mjs`: ANCHOR IDENTICAL to HEAD (ground layer sha1 both `48728a5366b8`). 8 seeds ×
3 years, boats/day and share of time a boat is on the water, HEAD → here: winter
0.314/52.2% → 0.230/32.4%, summer 0.314/51.1% → 0.320/72.2%, YEAR 0.290/49.3% → 0.279/50.5% ·
new `river-shots.mjs`: channel was `rgb(63,90,104)` in both seasons, now `rgb(80,111,109)`
July against `rgb(64,92,109)` January.

**Verdict:** shipped

**Surprise:** The brief asked for a summer:winter ratio in **boats per day** and that is the one
number I could not move — 0.320 against 0.230. The river holds exactly one boat, so arrivals are
occupancy-bound: summer saturates however high the rate goes, and the floor that keeps January
from going boatless eats the range from the other side. The year landed in **presence** instead —
72% of summer has a boat on the water against 32% of winter, where HEAD was flat at ~50% all
year. Count and presence are the same throughput seen twice and only one was free to move.
The second one I nearly filed as a bug: spring 44.3% against autumn 53.3%, an 18-point split
between phases where every term I wrote is symmetric. It is #21's hysteresis arriving through a
different door — the slow variable is not a scalar, it is the boat, whose trip is ~2 days of a
26-day year. The pair averages to 48.8% against HEAD's 49.3%, which is the neutrality claim.

**Laws:** three promoted (presence vs rate on a one-object channel; a long-lived object is
itself a slow variable; two seeds is not a sample). See `LAWS.md`. Full entry in the archive.

## Iteration 24 — the courtyard and the plaza answer a touch (2026-08-04) [Plaza & quay × Interaction/UX]

**Brief:** b23 — `answersTouch()` answered six tiles and not PATH, so the plaza's roundel and
the whole courtyard were dead to the cursor and the click. Extend it, and give those cells their
entries in `PAVING`/`pavingAt`.

**Did:** `answersTouch()` takes PATH, and so does the click handler's paving branch. `PAVING`
gains `court` (1,896 cells) and `plaza` (730 — the square; the old 24-cell `plaza` entry was
the mouth onto the lane, now `mouth`). The two share one `PLAZA_WORDS`: a place is one set of
WORDS but needs one box per piece of GROUND, because the four rows between square and mouth are
the terrace's end wall and a single bbox lands birds on a roof. `pavingAt()` branches on the
tile first — PATH is only ever courtyard or plaza and they are half a world apart.
`crumbSpot()` gains an optional `keep` rectangle: the fountain is the first obstacle in the
MIDDLE of a place rather than at its edge, so the scatter's CENTRE is pushed clear of it, never
the individual birds. **Frame answering the cursor 46.1% → 64.1%**; paving cells 2,903 → 5,529.

**Gates:** census PASS — *identical* on all 9 cells, which is the point: `crumbSpot` runs on
click, so no `R()` draw was added · visual PASS · motion PASS · perf skipped ·
`paving-places.mjs` PASS with a new exhaustive section: `crumbSpot` over all 5,529 paving
cells, 6 draws each (~99k placements) — 0 outside their box, 0 pairs under 0.9 cells, 0 in
water · `touch-hint.mjs` PASS, 345 points, 0 cursor/handler disagreements.

**Verdict:** shipped

**Surprise:** The brief warned the courtyard path ring is "narrow and curved — exactly the case
the 0.9-cell law bites on". It is neither: 1,896 cells, 8–20 thick, the **largest single place
in the town**, bigger than the lane's 1,731. The risk was real but it was in the other half of
the brief, and it was floating point. I derived the basin's footprint from the same ellipse
`buildGrid()` cuts it with and got the boundary row wrong — `(28.5-30)*1.2` is
`1.7999999999999998` — so my careful rectangle was *worse than the crude circle it replaced*
(22 birds in the basin against 1), and it took an exhaustive probe to see at all, because 22 in
99k never shows in a screenshot. Reading WATER back off the grid took it to 0. Also: a throwaway
patch-sampling probe claimed a bird north of the fountain was hidden behind it. It was lying — a
patch centred on a bird's ground anchor misses a sprite drawn above it. Leave-one-out says 3/3
visible on all four sides; promoted as `probes/crumb-birds-seen.mjs`.

**Laws:** two promoted (read a footprint off the grid, never re-derive it; a gate that fails on
unmodified HEAD is not a gate). See `LAWS.md`. Full entry in the archive.

## Iteration 25 — one vegetable stands the winter (2026-08-04) [Cross street & allotments × Deepen]

**Brief:** b24 — the allotments inherit `bloomCap()` through `caTick`, so nothing ripens in
deep winter. MEASURE IT FIRST and change only if the numbers warrant it.

**Did:** Measured first, with two new probes, and three of the brief's premises came back wrong.
Then one change, four lines.
*What the numbers said.* `probes/allot-year.mjs`, 4 seeds × 3 years folded onto one: winter is
**not a fifth of the year — `ripePlots()` is 0 for 48.3% of it**, one unbroken 11.2-day stretch.
The gardeners do **not** damp away: `allotRate`'s 0.01 floor plus a ~2.2-day round trip holds one
in the block 44.9% of midwinter. And it is **not seventeen plots of bare earth** — bare plots are
0.0 all winter, every plot sown and stalled at mean stage 1.1. Resting, not dead.
*What was actually wrong.* The winter variance #14 bought is **per-CELL** (`hash(x,y+41)` holds
a seventh of cells at the full ceiling) and the allotments are addressed **per-PLOT**:
`ripePlots()` wants five of six cells up, so a seventh per cell is 2e-4 per plot. 10 hardy
cells in midwinter buy exactly 0 ripe plots.
*The change.* `hardy:1` on cabbages, `plotStands(x,y)` off `plotCrop()`, and `caTick`'s
ceiling grain-matched to the region: `cap===3 ? 3 : inAllotment ? (plotStands?3:cap) :
(hash>0.86?3:cap)`. No `R()` — the crop is already in the ground. And because a lifted plot
comes back under whatever is sown next, **which** plots stand rotates by itself.

**Gates:** census PASS (blooming −92/5066, species reshuffled ±50) · visual PASS · motion FAIL,
attributed — the `shower` population row #23 already priced · filmstrip/perf skipped, no draw
code · `allot-year.mjs` HEAD→here: ripe==0 share of the year **48.3% → 13.1%**, longest ripe-0
stretch **11.2d → 0.9d**, winter ripe **0.00 → 1.18/17** against summer's 15.68, winter ≥1
gardener 44.9% → 52.2%, **summer unchanged** (15.74 → 15.68).

**Verdict:** shipped

**Surprise:** **The census cannot see this change at all, and I can prove it.** Its three warps
(90/625/1520 s) all land at phase 0.313 or 0.687 — *the same warmth, 0.693*, both at
`bloomCap` 3, where the new expression is algebraically the old one. Dumping ripe cells at
those instants: HEAD and here are **bit-identical at t=90 and t=625**, diverging only at t=1520,
after the first moment `bloomCap` leaves 3 and the two `R()` streams can part. So the entire
census diff is reshuffle, definitionally. Second: the winter tail came out shaped without being
asked — folded ripeness decays 2.45 → 1.91 → 1.37 → 1.12 → 0.95 → 0.68 at midwinter and climbs
back, the standing crops picked off one by one through the cold, each replacement only 1-in-4
hardy. I wrote a ceiling rule, not a decay; the harvest cycle supplied the curve.

**Laws:** two promoted (match the grain of a variance term to the grain the region is addressed
by; the census ladder samples ONE warmth). See `LAWS.md`. Full entry in the archive.
