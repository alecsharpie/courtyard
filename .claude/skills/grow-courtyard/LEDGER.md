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

**Keep an entry under 2.5 KB (≈38 lines).** A worker reads the last **three** entries
in full, every iteration, so entry length is charged to the loop three times over. This
cap was 3.5 KB and advisory at pass #20; the next three entries came in at 4.3–5.7 KB
and three more workers opened OVER budget, so it is now measured by
`rotate-ledger.mjs`, which names any entry over it. If yours does not fit, the excess is
almost always a **law** (true of the next vector → `LAWS.md`) or a **cue**
(→ `state.json`), not a longer entry. Write the *surprise* at full length and compress
everything else; the surprise is the part that cannot be reconstructed from the diff.
Once the manager has promoted your `**Law:**` and `**Cue:**` lines they are cut from
the entry — they live in the two files that are read *instead* of this one.

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

## Iteration 26 — the sill names the season (2026-08-04) [Sky, light & weather × Interaction/UX]

**Brief:** b25 — nine systems read `season()` and the sill never said which season it was.
Name it, in the diorama's own register, without a second row.

**Did:** `seasonLabel()` beside `timeLabel()` — same idea one scale up, the hour off the
sun and the quarter off the phase. Eight names on `seasonPhase` (never `warmth`: 0.5 is
both bud burst and the turn), sectors of 1/8 **centred** on their phase rather than
starting at it, so midwinter straddles the wrap as one continuous name and `Spring` lands
exactly on `SEASON_START`. Winter and summer get an early/mid/late apiece because a cosine
dwells at its extremes; spring and autumn are the crossings and get one name each. New
`#season` in the sill, serif, written by `refreshStats()`. `probes/sill-year.mjs`.

**Gates:** census **PASS — every field unchanged in all 9 cells**, which is the real
assertion here: no new `R()` draw, so a DOM-only vector must reshuffle *nothing*, and for
once a `+0` census is a positive result rather than a blind one · visual PASS (wide +
mobile at early summer and at midwinter: "Midwinter · Day 20 · Dusk" over a bare, dark,
24-bloom town against "Early summer · Day 4 · Morning" over 464) · `probes/sill-year.mjs`
**41/41** across six widths · motion skipped — nothing drawn or moving was touched.

**Verdict:** shipped

**Surprise:** the screenshot caught what the probe swore was fine. My first fit gate read
`sill.scrollWidth - clientWidth` and passed at 390px; the mobile PNG showed
"Early summer" printed straight through "Day 4". Every sill item is `white-space:nowrap`
with default `flex-shrink:1`, so a squeezed item reports a **box that fits** while its
glyphs run out over its neighbour — container overflow is exactly 0 and the layout is
broken. `flex:none` on all of them made the number honest (0 → 26px over), and the gate
had to compare *text extents* between row-mates, exempting `#ticker` as the one item that
truncates by design. Second surprise: the fix wanted 80px the narrow row didn't have, and
the answer was not smaller type — `#plate` already has a caption slot that is
`display:none` on a phone, so below 640px the season moves **into** the plate and sits
under the title for zero horizontal cost, which is also the truest museum-label form.
Third: adding a sixth item exposed a band nobody had looked at. At 641px HEAD already gave
`#ticker` 71px of box; the season would have overflowed it outright. `#stats` now yields
below 860px, so that band gains a season *and* a ticker that reads better than before
(100px at 641, 222px at 768, against HEAD's 71 and 193).

**Law:** a flex row of `nowrap` items has two different fit questions and the container
answers only one — see `LAWS.md`.

**Cue:** the sill overflows at 320px on HEAD too (44px, pre-existing); 390 is the tracked
framing so I gated there and left it.

## Iteration 27 — the pointer names what it is over (2026-08-04) [Courtyard & garden × Interaction/UX]

**Brief:** b26 — 64% of the frame answers a click and the cursor says so, but nothing says
*what* you are pointing at. Name it, read off the grid, correct as the season changes.

**Did:** one label in the sill, borrowing the **ticker's** box (upright, no full stop — the
ticker is prose the town says, this is a label for a thing). Everything in it is read, never
inferred: species off `bSp`, stage off `bSt` against `bedCap(x,y)` — lifted out of `caTick`
so the ceiling has one definition now a second reader wants it — allotments named per *plot*
off `plotCrop` at the row's best stage, paving and water off `pavingAt`/a new `WATERS` table
that also feeds the click's three water lines. Trees are hit-tested in **screen** space
against a `crowns[]` the draw pass records: a crown is painted cells north of its own trunk,
and a second derivation of that geometry is exactly what drifts. Manners: one read per
*frame* off the last pointer position, not per mousemove; `NAME_SETTLE` 0.12 s before a name
commits (a sweep crosses fifty 9-px cells), instant to clear; yields to a live ticker line,
never opens under `inviteHold`. A phone has no hover, so the **tap** names and holds 4.5 s.

**Gates:** census **PASS — every field unchanged in all 9 cells** (no new `R()` draw, so a
read-only vector must reshuffle nothing; `bedCap` is the old inline expression moved, and
the census proves it exactly) · motion **PASS** vs a HEAD baseline · visual PASS
(`probes/naming-shots.mjs`) · perf **PASS** (+0.0% day and night, 3 interleaved reps) ·
**probe PASS** `probes/naming.mjs` 24/24: 13 crowns each naming their own tree, **0 cells**
where `nameAt` and `answersTouch` disagree (9581 = 9581), 733 beds named with 0 wrong,
4 linden labels round the year, blossom *and* fruit found.

**Verdict:** shipped

**Surprise:** a feature that reads a screen *position* found a bug that #24 shipped and
nobody could see. The sill **borrows** space — one line where the plate was two — and that
changes the canvas's box with no `resize` event at all: measured **+16 px at 390 px**, a 2%
vertical stretch that is invisible in the picture and puts `unproject()` **two cells out at
the bottom of the frame**, because it is still working in the old geometry. The invitation
has resized the sill this way since #24; nothing read a position back then. A
`ResizeObserver` on the frame fixes it (0 px at 1400 — a phone-only shift). Second: the
naming waits for the ticker's line to be *read*, and `tickerAge` is bucketed off the sim's
`dt` — so on a **paused** page it waits forever. Reading is a real-time act, so `lineAt` is
stamped off `performance.now()`, as `TICK_DWELL` is documented to be.

**Law:** read a screen coordinate → observe the **frame**, not the window; a UI element that
borrows space resizes the picture silently. A timer a *person* races runs on the real clock.

**Cue:** c53 — the naming names places and plants, not people.

## Iteration 28 — the season is a button, and the year runs on (2026-08-04) [Sky, light & weather × Scale/World]

**Brief:** b27 — fourteen iterations of seasonal work addressed to a viewer who would have to
sit here 24 real minutes to see any of it. Reach another season without popping six hysteretic
systems. The batch bet.

**Did:** `#season` becomes a `<button>`; clicking it runs the town on to the next quarter as a
**fast-forward, not a jump**. Nothing writes `seasonPhase`, `cloud`, `bSt` or a position —
`stepSkip()` only hands `frame()` more sim seconds and `simSub()` splits them so no step exceeds
`SKIP_SUB` 0.25 s. That is the whole safety argument: every rate cap here is per SIM second, so a
sub-stepped advance is indistinguishable from having waited; what is compressed is REAL time. It
lands on a **whole number of sim days** nearest a quarter-turn, so the hour survives — 7+6+7+6 =
26 = `SEASON_LEN`, and four clicks return the identical phase *and* hour. Rate is a flat-topped
trapezoid advanced off the profile's **exact integral**. `announce()` is deaf throughout;
`land()` says one line. `RM` gets an honest cut behind a `#veil`. Full entry in the archive.

**Gates:** census **PASS — every field unchanged in all 9 cells** (no new `R()`) · motion PASS vs
a stashed-HEAD baseline · perf PASS +0.0% · visual PASS · `probes/season-skip.mjs` 33/33 ·
`probes/skip-strip.mjs` against a `__warp` control at the same sim gaps: max frame-Δ 32.64 vs
32.86, with **fewer** out-of-line frames than the control · `probes/skip-shots.mjs`: **midwinter
19.6 real seconds** after the first click, 684 blooms → 26. Budget opened **OVER** (47.1 / 46 KB).

**Verdict:** shipped

**Surprise:** both hard bugs were invisible to the thing that should have caught them. (1) The
lapse overshot by exactly its own duration — `dt * speed` kept riding on top of the profile,
0.095 of a day per click, which no eye can see and which compounds into a year that no longer
closes; only the four-click round trip could see it. (2) I closed the CSS comment above `#season`
one line early, so five lines of prose parsed as a selector and **swallowed the whole rule** — it
shipped as a grey chip. The probe passed: tag `BUTTON`, right text, handler fired. A screenshot
caught it. (Both promoted to LAWS.md.)

## Iteration 29 — the stalls sell what the plots grew (2026-08-04) [Lane & market × Connect]

**Brief:** b28 — the market is the last flat system in the town. Connect it to the
allotments, which ripen and are picked across a full year fifty feet away.

**Did:** one store, `produce[]`, written by exactly one line — `harvestPlot()` pays in the
cells it lifted, so the basket (`a.crop`) that walked out of the block for four iterations
now goes somewhere. `stockMarket()` latches that store ONCE per market day at the first
trestle, empties it, and lays it out as `mkShelf` (species order, so a stall sells one or
two things). `marketRaise(i)` gates on `mkTrades(i)`: `MK_NEED [0,4,13]` units, so the
second and third traders only set up if the plots sent enough — stall 0 always comes, but
it can stand behind an empty board. Each pitch is a vegetable the stall was actually
stocked with, in its own colour and size. Half of what the market cannot carry (`MK_CAP`
18) keeps to the next one. `mkLine()` says which crop, and browsers walk to a stall that
came out.

**Gates:** census **PASS** (small reshuffle churn, no collapse; new field `planting.produce`)
· motion **PASS** · visual PASS · filmstrip day PASS, no POP · `probes/market-year.mjs` over
**120 markets / 5 seeds / 104 days**: midwinter **6.0 units, 1.67 stalls** vs midsummer
**35.7, 2.96**; one stall on 24% of markets, three on 58% · `probes/market-shots.mjs`
midsummer 3 stalls 6/6/6 vs midwinter 2 stalls 6/5/0, naming the plots the difference came
from · `probes/market-raise.mjs` unchanged vs HEAD (seed 42's spike is pre-existing,
stashed and confirmed). Budget opened **OVER** (48.4 / 46 KB).

**Verdict:** shipped

**Surprise:** two. (1) The store made the year's trough MOVE. Without carry-over winter was
bare and spring recovering; with it, autumn's glut arrives late and **spring** becomes the
thinnest quarter (3.8 units vs winter's 6.0) — two lags composing into a hungry gap nobody
wrote. (2) My first probe reported a different midwinter market every run — 2.1 units, 13.6,
22.1, 5.4 — same seed, same code, same pinned instant. **Drawing consumes `R()`**, so any
host round-trip walks the seeded stream even with the sim stopped. One page per quarter
fixed it. (Both promoted to LAWS.md.)

## Iteration 30 — the courtyard reads the sky too (2026-08-04) [People & animals × Connect]

**Brief:** b29 — the street refuses and vacates a seat under a building front; the
courtyard sat through it, because both gates read `a.street`. Close c11.

**Did:** two predicates, one definition each — `SIT_REFUSE` 0.42 (take a seat) and
`skyLifts(a)` (give one up, 0.55..0.88 off `a.wary`). The gate is no longer `a.street` but
**what you are doing**: on the street everyone not lying down; in the courtyard the people
*sitting*, so the napper sleeps on and the gardener finishes their row. c11 sat open 24
iterations because `picnic`/`sitter` are `STAYING` and reach their seat with an empty
waypoint list, so a refusal meant `a.done` on the lawn — `routeToExit()` is the walk out
they never had. A pair is linked both ways (`a.mate`) and judges the sky **once**. The
blanket line moved from spawn to when the blanket is spread: a refusable seat makes an
announcement at spawn a promise the town may break.

**Gates:** census PASS (reshuffle churn, no collapse; `people` 186→182 is the feature) ·
motion **FAIL→analysed**: only `shower` fired, untouched, and `probes/shower-jump-spread.mjs`
puts it at 0..2 on both builds · visual PASS · filmstrip day PASS · perf skipped ·
**`probes/seats-out.mjs`**, 8 seeds × 12 sim days, HEAD vs here: refusals **0 → 15**; under
`cover>0.60` the courtyard sits **0.269 → 0.074** while the street holds 0.020/0.019 — it
empties *to where the cafe already was*; under `cover<0.30` 0.439 → 0.461, a blue afternoon
untouched; **0 vanished, 0 pair splits** · `probes/seats-shots.mjs`: blanket on the grass,
then an empty lawn and umbrellas walking out.

**Verdict:** shipped

**Surprise:** the vanish test nearly shipped as a tautology. I first wrote it as "despawned
while `act === 'sit'`" — the bug's exact *inverse*: a naive refusal sets `done` in the
**walk** branch, so the agent disappears mid-lawn still labelled `walk` and the test reads a
clean 0 forever. Re-anchoring on *position* made it real; the min observed despawn radius,
**32.7** against a threshold of 16, is what turns the 0 into evidence. Second: `__warp(0.25)`
is 7–8 sub-steps and a probe sees only the boundary, so sampling reported 3 phantom refusals
**on HEAD**, which has no refusal path. Wrapping the one function both paths go through gave
0. (Promoted to LAWS.md.) Context budget opened **OVER** (49.8 / 46 KB).

