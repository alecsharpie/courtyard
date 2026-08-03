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

## Iteration 3 — the sky now tells you rain is coming (2026-08-03) [Sky, light & weather × Deepen]

**Brief:** b2 — `grep -i cloud` returned nothing. Give the sky cover as one slow value
on the same footing as `isWindy()`, and have both `skyCols()` and the rain roll read it.
**Did:** New `cloudCover()` over `cloud`/`cloudTgt`/`frontLeft`, stepped by `stepClouds(sdt)`
in `simStep`. A front picks a target (heavy 0.76–1.0 with p≈0.3+0.24·richness, else
`R()*R()*0.5`) and holds it 24–60 s; `cloud` eases toward it rate-capped at +0.02/−0.026 per
second, so it can never step. The rain roll is now gated `cloudCover() > 0.66` with a rate
that scales with how far above; rain pins the target to 0.92 and, on stopping, sets it to
0.1–0.38 so cover visibly breaks up behind the shower. Readers: `skyCols()` mixes both stops
toward grey *after* the dusk term (cloud mutes a sunset, it doesn't sit under one);
`drawClouds()` is a new per-frame pass of 11 hash-seeded banks that fade in one at a time as
cover thickens, drifting on `simT` and wind, drawn over the sun and under the hills;
`drawSunMoon` gets a `veil` factor; `drawBackdrop` puts the stars out; `drawRoofRow` flattens
its key light; `ambientLine()` gained two overcast tiers. Cover rides the existing
`lightBucket` (already ~1.75 rebuilds/s) rather than its own key, so it costs no extra
backdrop or ground rebuilds.
**Gates:** census PASS (raindrops +110 — a sampled cell now rains where it didn't; rest is
PRNG churn) · visual PASS (clear → building 0.44 → heavy 0.89 → raining, plus wide/courtyard/
east/lane and the 390×844 framing; the diagonal pale streak in every shot is the pre-existing
glass-glare overlay, confirmed against HEAD) · motion PASS (zero jumps/nan/oob/flicker) ·
filmstrip PASS (no POP; cover visibly breaks across 12 frames) · perf PASS (interleaved vs
HEAD, both at the 16.7 ms vsync cap) · probe `probes/cloud-cover.mjs`: over 4 seeds × 14 days,
lowest cover while raining **0.771**, largest change per 0.5 s **0.0130** (= the rate cap, so
no step changes anywhere), median lead from cover-0.5 to first drop **27 s** — half a day.
**Verdict:** shipped   ← my view; runlog.mjs decides from the diff
**Surprise:** The probe was nondeterministic and I nearly believed it. Three runs of
*unchanged* code gave 9, 11 and 16 rain starts, which I first misread as my draw-only cloud-
height tweak changing the simulation. The cause is that `R() < dt * k` evaluates `R()` before
comparing, so a paused frame still burns PRNG draws even though `dt` is 0 — and how many rAF
frames arrive between load and the first `__warp()` is machine-dependent. A controlled test
(identical `idle=0` runs giving cloud 0.883 vs 0.009, identical `idle=120` runs matching
exactly) pinned it. `census.mjs` and `motion.mjs` both already call `__reseed()` first and are
fine; my probe didn't. Adding it made three consecutive runs byte-identical. The near-miss is
the point: an unreseeded probe doesn't error, it just quietly reports a different plausible
number every run, which is exactly the shape of evidence that survives review.
**Law:** Any `?pause` + `__warp()` measurement must call `__reseed()` before it starts. A
paused frame still consumes PRNG draws, and the frame count before the first warp is
machine-dependent — without the rewind a probe reports a different plausible number each run.
**Law:** Rate-cap a slow world scalar instead of easing it. A cap makes "it never steps" a
single measurable number (max delta per sample = the cap), so continuity is proved by the
probe rather than argued from a screenshot.
**Cue:** `drawSunMoon`'s `veil` hides the disc, but the shadow direction and the fixed shadow
alphas at `SUN[0]/SUN[2]` call sites are unchanged — the town still casts hard sun shadows
under full overcast. Softening them is a wider diff across ~6 call sites.
**Cue:** Rain now only starts while `daylight > 0.15`, so a heavy front that peaks overnight
builds full cover, never rains, and breaks up by morning. It reads fine, but it means overcast
nights are more common than rain.

## Iteration 4 — people now notice each other (2026-08-03) [People & animals × Connect]

**Brief:** b3 — no agent-to-agent code existed anywhere. Give agents the barest social
awareness: two who pass close should occasionally stop and acknowledge each other.
**Did:** New `greetPass()` on a 0.5 s accumulator in `simStep()`, after the agent loop so
positions are current. It walks a filtered `free` list (`chatty()`: walking, not small, not
listening/greeting/cooling, not `sweeper` — working — and not `picnic`, who arrive as a pair
and would chatter the whole way in), axis-rejects on dx/dy before any hypot, and pairs on an
*annulus* `GREET_MIN 0.9 .. GREET_R 1.6` at `GREET_P 0.17`. Pairing sets `a.greet = b.greet =
2.2–5 s` (×0.45 in rain), opposite `faceL`, and `chatCool = greet + 16–26 s` on both.
`stepAgent()` returns early while `a.greet > 0`, clamped at 0, right beside the existing
`a.listen` branch — a countdown and nothing more, so `done` stays reachable and no table can
strand. `drawPerson()` gained `chatting`: legs go to the standing pose instead of freezing
mid-stride, and the head turns toward the other one and nods (`Math.sin(a.greet*4.4)`).
Factored the dog-follow out to `stepDog()` and called it from the greet *and* listen branches,
so a stopped owner no longer leaves a frozen dog beside them.
**Gates:** census PASS (`people` +10 — capacity-bound drift plus PRNG churn, not new spawns) ·
visual PASS (wide/courtyard/lane at night and morning, no draw-order regression) · motion PASS
(walker 0 jumps / 0 nan / 0 oob / 0 flicker in all four scenes) · filmstrip day PASS (Δ 0.28–0.64,
no POP, no FROZEN) · probe `probes/passing-word.mjs`: ~19 conversations per 10 seeded days,
2.4% of walker-ticks chatting, 10 different kinds involved, maxGreet 4.87 < 5, `stuck` empty ·
perf skipped (the pass is 0.5 s-throttled over a ≤20-item list)
**Verdict:** shipped   ← my view; runlog.mjs decides from the diff
**Surprise:** The motion gate failed on `day/butterfly: jumps 0 -> 1` — a system I never
touched. The tempting reads were "PRNG churn, ignore it" and "re-pin the baseline". Both were
wrong. `probes/butterfly-step.mjs` replayed the gate's own sampling over 12 seeds on HEAD and
found butterflies *already* taking 3.4–4.4-cell steps against a 0.55 median: `(b.tx-b.x)*dt*0.5`
flies a freshly-targeted butterfly across the courtyard faster than a person runs, and 4.4 sits
exactly on `ABS_JUMP 2.5 AND 8×median`. So the gate was a coin-flip on the random stream for
*every* iteration, not just mine. Clamped the approach to 3 cells/s; largest step over 12 seeds
is now 1.31 and the knife-edge is retired.
Second, smaller: at first the pair stopped wherever they happened to be, often 0.8 cells apart,
and a zoomed crop showed them rendering as a single blob. Hence `GREET_MIN`. Rate and
legibility turned out to be the same dial.
**Law:** When a gate fails on a kind you did not touch, measure that kind's own distribution on
HEAD before you either blame yourself or re-pin the baseline. Any change that consumes `R()`
shifts the whole stream, so a threshold that a system was already sitting on will flip at
random — the fix is to move the system off the threshold, not to move the threshold.
**Law:** Two figures nearer than ~0.9 cells render as one shape at this scale. Anything that
puts two people in the same spot (a queue, a bench, a haggle) has to hold them apart to read.
**Cue:** `chatCool` is decremented only inside `greetPass()`, so it is wall-clock-correct only
while that pass runs every 0.5 s. Fine today; a future early-out in the pass would freeze it.

## Iteration 5 — the far side gets its own arrivals (2026-08-03) [Plaza & quay × Deepen]

**Brief:** b4 — the east was not missing itineraries, it was missing budget: the plaza,
quay, towpath and church green all hung off two narrow roll bands of one `laneCap`.
**Did:** New `spawnEastAgent()` with its own `eastCap` (`1 + round(maturity*6*daylight)`)
and `eastRate`, and `laneCount` now subtracts `eastCount` so the lane's budget is
untouched. East agents carry `a.east` and enter by one of three gates already in the
town's geometry, each picked to be *near* what it serves: the alley cut through the
terrace (plaza), the north end of the quay (quay), the park gate arch (towpath, church
green). Route is `gate → lead → stop → reverse(lead) → gate`, so they leave the way they
came and despawn off-map or inside a passage. One predicate `eastOpen()` (`daylight >
0.16`) has three readers — no new arrivals, anyone still sitting gets up, and the walk
home runs at 1.55×. Census gains `inEast`, a geographic partition of the existing
`onStreet`, not a new axis. No new destinations: everything visited already existed.
**Gates:** census PASS (`people` +33, `inEast` +24 from zero; rest is PRNG churn) · visual
PASS (wide/courtyard/east/lane, plus controlled midday and night pairs and both new gates
caught with someone in them) · motion PASS (0 jumps / 0 nan / 0 oob / 0 flicker in all
four scenes; walker spawns +24) · filmstrip day POP at frame 7 — **explained, not mine**
(see Surprise) · night filmstrip clean · perf PASS (interleaved vs HEAD, both at the
16.7 ms vsync cap) · probe `probes/east-arrivals.mjs` over 4 seeds × 21 days: at midday
the quay went 0.10 → 1.75 mean walkers and the church green 0.62 → 2.24, quay-and-green
occupied *together* in 5% → 76% of samples, while the lane held at 5.36 → 5.30.
**Verdict:** shipped   ← my view; runlog.mjs decides from the diff
**Surprise:** The first build worked and was still wrong, for a reason no gate reports:
the round trips outlived the day. A day is 55 s and daylight is ~33 s of it, but a walk
from the north end of the quay to a plaza bench and back is ~92 cells ≈ 50 s. So the east
population was a rolling average that never cleared — 5.17 at midday and 4.21 at
midnight, a town where nobody goes home. `eastCap` going to zero at dusk does nothing
about it, because a cap only blocks arrivals. What fixed it was geometry, not tuning:
move the plaza's gate to the alley (9 cells out instead of 46) and the far bank's to the
arch instead of the lane's east edge. Midnight went 4.21 → 1.37 and 04h → 0.38.
Second: the day filmstrip showed a Δ 11.15 POP that HEAD does not have. It was not mine.
`probes/pop-where.mjs` showed the change was uniform across *every* region including the
courtyard, which my east-side change cannot touch; a per-frame dump of the ticker and
`clock.raining` showed a shower ending on exactly that frame. My change shifts the seeded
PRNG stream, so seed 42 now rains at t=175 where HEAD does not. Three wrong causes were
plausible first (cloud-cover rounding, a light-bucket step, a layout reflow) and I
measured each rather than picking one.
**Law:** A round trip must be short against the *day*, not merely plausible on the map.
This town crosses 138 cells at ~1.8/s while a day lasts 55 s, so anything whose journey
exceeds ~40 s is permanently present regardless of the cap that spawned it. Caps set the
inflow; trip length sets the standing population and its phase.
**Law:** When a global gate fires on something you did not touch, dump the *page's own
state* per frame — ticker text, `__census().clock` — before theorising. The pixel-diff
says a frame changed; the clock says what changed. (Generalises the iteration-4 law from
one kind's distribution to any whole-frame event.)
**Cue:** East agents retrace their inbound route exactly, so two who arrive together walk
the same line single-file. It reads fine at current density but would queue if `eastCap`
ever rose much above 7.
**Cue:** Nobody ever crosses the bridge on foot between the plaza side and the far bank —
lane walkers do, east agents never do, because their gates are on one side or the other.
The bridge is the town's only link across the river and no itinerary uses it as a link.

## Iteration 6 — the town gets ready before the sky opens (2026-08-03) [Sky, light & weather × Connect]

**Brief:** b5 — `cloudCover()` had one reader (the rain roll). Everything else read
`raining`, a boolean that flips in one frame. Give the town a state for "weather is
coming" and make two or three readers transitions rather than pops.
**Did:** One predicate, `weatherComing()` — 0 while fair, 1 by the cover at which the
rain roll goes live, damped by daylight because the roll is itself gated on
`daylight > 0.15`. Three readers, each with its own trigger point on the same scalar,
which is the whole benefit of a ramp over a boolean: **washing** — the rope stays
strung and the garments come in one at a time on their own thresholds (0.16..0.82) and
their own ~1.6 s fades, driven by `max(weatherComing(), a local dusk ramp on daylight)`;
**street sitters** — new sits refused above 0.42, existing sitters released over
0.55..0.88 off a per-person `wary`, the gap guaranteeing nobody sits and stands right
up; **umbrellas** — up over 0.62..1.17 (so ~30% never open one and get caught out),
put away below 0.42 and cleared when the rain stops. The rain-start `R()<0.5` umbrella
sweep is gone: whoever was going to put one up already has.
**Gates:** census PASS (`people` 138→135, within PRNG churn) · visual PASS (wide,
courtyard, east, lane at the pinned moment, plus a controlled overcast afternoon at
seed 9 and a six-frame retreat strip at seed 1) · motion PASS (0 jumps / 0 nan / 0 oob
/ 0 flicker in all four scenes) · filmstrip day and night both clean, no POP, no FROZEN
· perf PASS (interleaved vs HEAD, both at the 16.7 ms vsync cap) · probes
`probes/weather-lead.mjs` and `probes/wash-pop.mjs`. Over 20 seeds × 440 s: median lead
from first umbrella to first drop **0.5 s → 16.0 s** (n=21, every shower), last sitter
leaving **25.5 s → 37.5 s**. Street sitting by cloud band, HEAD → work: 0.40→0.44 under
a clear sky (unchanged), 0.57→0.31, 0.67→0.05, 0.61→0.00 — monotone in the cover, and
daylit population is flat at 12.30→12.49. Washing: HEAD loses all 10 garments in a
single frame 41 times per sweep; the largest single-garment change per frame is now
**0.116** with zero frames above 0.25.
**Verdict:** shipped   ← my view; runlog.mjs decides from the diff
**Surprise:** Three defects, and the gates that caught them were not the gates I
expected. (1) The census called a `people` COLLAPSE of −12.3%, and it was noise — one
of the nine cells had shifted into rain. The probe that split population by cloud band
showed every band flat or up. Had I tuned to satisfy the census I would have weakened a
working feature to chase a coincidence. (2) The *screenshot* caught what every number
missed: a night full of open umbrellas. Overcast nights are common and can never rain,
so an undamped predicate had the whole town waiting for weather that was not coming.
(3) Worst of all, `a.phase` looked like a stable per-agent trait and is the walk cycle,
advanced every frame — so `a.phase % 1` cycled through the entire threshold band several
times a second and my "stagger" staggered nothing. It showed up as 14/14 walkers holding
umbrellas where the arithmetic predicted 69%; I only found it because I checked the
arithmetic against the count instead of accepting a plausible picture.
**Law:** A per-agent trait must be one that is never written after spawn. `a.phase` is
the walk cycle and `a.timer`, `a.greet`, `a.chatCool` all count down; reading any of
them as a stable personal threshold produces a value that cycles the whole band every
few frames, which looks like a stagger and is a flicker. Give the trait its own field at
spawn (`a.wary`), and sanity-check it by predicting the fraction that should react and
counting the fraction that did.
**Law:** A crossfade window must be no wider than the smallest threshold it fades in
from, or the first item sits permanently translucent. My garment fade was 0.14 wide
against a band starting at 0.10, so the lowest-hashed garment hung at 71% alpha in
perfect weather for four gate runs before a probe printed 9.49 where 10 was expected.
**Law:** A `?pause` + `__warp()` probe must do all of its stepping inside ONE
`page.evaluate`. The page keeps running its entity loop between host round-trips, so
frames — and the PRNG draws and spawns they consume — land between your steps; a probe
split across evaluates is not reproducible across runs, and `__reseed()` does not fix it
because it rewinds the stream and not the agents those frames already created. For a
filmstrip this does not matter (one session, consecutive frames is all it needs); for a
measurement it matters completely.
**Cue:** `weatherComing()` is damped by daylight, so a front that peaks overnight still
builds full cover and still cannot rain — cue c8 is untouched. The town now *visibly*
does nothing about those nights, which is correct but makes c8 more conspicuous.
**Cue:** Courtyard sitters (`picnic`, `sitter`) deliberately do not read the sky — only
`a.street` agents do — because their sit is assigned at a waypoint with no route left,
so refusing it would despawn them mid-lawn. Giving them a `routeToExit` on refusal would
extend the effect into the courtyard.

## Iteration 7 — the allotments are picked, rested and re-sown (2026-08-03) [Cross street & allotments × New CA rule]

**Brief:** b6 — mature veg sat at `bSt` 3 until random dieback took it. Nothing was ever
picked. Add harvest as a real term, and let a cleared row re-seed.
**Did:** The cycle is addressed by **plot**, not by cell — `buildGrid` lays the block out as
3×2 beds on a 5×7 lattice, so `plotOrigin()`/`plotCrop()` make that the unit. `harvestPlot(a)`
fires from the existing kneel branch in `stepAgent` (`a.kind==='allot' && a.plot`): if any cell
of the plot is at `bSt` 3 the whole bed is lifted, `harvested` counts the ripe cells, `a.crop`
is set, and every cell gets `bAge = FALLOW + R()*8` (12–20 s ≈ 0.3 of a day). Nothing ripe →
it falls through to the existing hand-planting, so one kneel does both halves. `caTick`'s empty
branch now reads `bAge` on an unplanted bed as a **fallow clock** (dieback zeroes `bAge` so
that reading is unambiguous), and splits: the allotment is *sown*, not self-seeded — the first
drill goes in at 0.055 and the other five follow at 0.30 **under `plotCrop()`**, so a row comes
up as a row and under one crop. `drawPerson` gives `a.crop` a basket with the crop's `col2`
heaped in it. Census gains one field, `planting.harvested`.
**Gates:** census PASS (`blooming` +110, `planted` +159, `people` +10; species churn is
per-plot monoculture sampled at three instants, see Surprise) · visual PASS (wide/courtyard/
east/lane clean, plus two pinned dsf-6 captures: the block showing four distinct crops with one
bed bare and turned, and a gardener walking out with the basket) · motion PASS (0 jumps / 0 nan
/ 0 oob / 0 flicker in day, night and market) · filmstrip day clean, no POP, no FROZEN · perf
PASS (interleaved vs HEAD, both at the 16.7 ms vsync cap) · probes
`probes/allot-turnover.mjs` and `probes/allot-rate.mjs`, 4 seeds × 1000 s (18 days):
harvested cells **0–22 → 97–114**, cycles per plot **0.00–0.24 → 0.88–1.29**, longest a plot
stays bare **12.5 s → 20–22.5 s**, and all four vegetables present in every seed where three of
four seeds had lost pumpkins entirely.
**Verdict:** shipped   ← my view; runlog.mjs decides from the diff
**Surprise:** Three, and two of them changed the shape of the work.
(1) **The harvest was never the bottleneck — the gardeners were.** The first build passed every
gate and did nothing: 22 cells picked in 18 days against a 17-plot block that sat 98/102 full
the whole time. `probes/allot-rate.mjs` printed the reason in one run — **0.06–0.22 `allot`
gardeners per day**, one every 5–15 days, because they live in a 0.36–0.42 slice of
`spawnLaneAgent`'s roll chain behind `sun && day>=1`. The brief called them "the gardener who
already walks in through the gate", and so did I, until I counted. The fix is that the
allotments now arrive on their **own** budget like the far bank does — `spawnAllotAgent()` at
`allotRate = 0.01 + 0.16 * ripePlots()/17`, so the crop calls its own picker and a bare block
draws nobody. That took it to 1.1/day and ~1 plot cleared per day. `state.json` had already
written this down at pass #0 ("an empty-looking place is a budget question before it is a
content question... the allotment gardeners exist — ask how often it fires") and I re-derived
it from zero.
(2) **Row coherence quietly ate two of the four crops.** Making a plot come back under
`plotCrop()` is what makes a row read as a row, but it also makes the crop *sticky*: the block
is sown on day 0 when only carrots and cabbages exist, and after that a plot only re-picks if
it goes completely empty. Beans −153, pumpkins −124 to zero. Harvesting only the ripe cells
left the unripe ones holding the crop, so the fix is that a harvest lifts the **whole** bed —
which is also the more honest gesture, and gives rotation for free.
(3) I spent three attempts re-deriving a zoomed screenshot framing that
`probes/east-shots.mjs` already had, including its note that `shoot.mjs`'s `?fast` + 2600 ms
wait advances the sim ~20 s (which is why the "day 3 midday" shot comes back at dusk).
**Law:** A feature that "already exists" may exist at a rate of zero. Before building on top of
an existing agent kind, mechanism or route, **count how often it fires** — the spawn bands in
`spawnLaneAgent` are a single shared budget and a branch three-quarters down the chain can fire
once a fortnight. Rate is a design parameter, not an implementation detail.
**Law:** Read `probes/` before writing a probe. It is part of the seam and it is not in the
worker's read budget, so every iteration is one `ls` away from re-solving a solved measurement.
**Law:** When a CA cell's state is inherited from its neighbourhood, check what the inheritance
does to *variety* over many cycles, not just to the one cycle you are looking at. A rule that
makes a region coherent makes it monotonous unless something resets it.
**Cue:** The block is 17 plots, not the 21 the brief and the inventory both say — `buildGrid`
excludes `x>=84 && y>=42` for the pond corner. Cosmetic, but two documents are wrong.
**Cue:** `ripePlots()` rescans 102 cells once a second to set the arrival rate. It is free at
this size, but it is the first place in the town where a *spawn rate* reads the CA, and if
anything else wants that pattern it should be cached on the CA tick rather than recomputed.

## Iteration 8 — the market is put up and packed away (2026-08-03) [Lane & market × Deepen]

**Brief:** b7 — `marketActive()` gated the whole stall list, so three finished stalls
appeared between two frames at hour 8 and vanished the same way at 17. Give market day
a beginning and an end.
**Did:** A stall is no longer a boolean. `marketRaise(i)` is a 0..1 progress with a
per-stall stagger (`MK_RAISE` 0.62 h, `MK_STAGGER` 0.24 h), so the three go up one at a
time over 6.90→8.00 and come down over 17.00→18.10. The draw list pushes per stall on
`p > 0` and carries `p`; `drawMarketStall` stages it as four clamps on that one number —
the trader fades up crouched over the pitch (`arrive`), the trestle unfolds up to its
board and out to its full width (`table`), the frame rises on lengthening poles
(`pole`), the canvas rolls out from the left pole toward the right (`can`, a lerp of the
two right-hand corners; the stripes are anchored in screen x so they stand still and get
*revealed*), and the six goods come out one at a time over p 0.80..1.00. The trader
stands up as the canvas starts. Because every stage is a clamp on the same p, running p
backwards packs the stall down in exactly the reverse order — no second code path.
`marketActive()` is untouched, so `laneRate`'s ×1.7 and the browser roll still see the
same 8–17. The ticker now brackets the day: the opening line moved onto the first
trestle (6.92) and a new `marketClosed` flag fires at 17.00, on the first stall coming
down rather than after the last, which also keeps it an hour clear of the six o'clock
strike.
**Gates:** census PASS (**unchanged in every group** — the point: draw-only, and it
confirms no new `R()` draw) · visual PASS (wide/courtyard/east/lane at the pinned moment,
plus zoomed dsf-4 crops of the pitch across both windows: at 7.66 stall 0 is finished,
stall 1's canvas is half out and stall 2 is a bare frame) · motion PASS (0 jumps / 0 nan
/ 0 oob / 0 flicker in day, night, market) · filmstrip day clean, no POP, no FROZEN ·
perf skipped (no new per-frame pass; the stall loop is ≤ the old one) · probe
`probes/market-raise.mjs`, 4 seeds, crop of the market pitch stepped at 0.05 s: largest
single-step change **6.66 → 1.83** opening and **7.42 → 1.81** closing — and the 1.8s
are not mine, they are byte-identical in the HEAD control. A separate check confirms the
fully-open stall is **pixel-identical to HEAD** (weighted pixel sum 18852789 both), so
the raise adds no drift to the finished state.
**Verdict:** shipped   ← my view; runlog.mjs decides from the diff
**Surprise:** Two.
(1) **The filmstrip could not see the bug it was pointed at.** Run across the opening
window at 0.28 s gaps, HEAD and the work give the same frame deltas to two decimal
places (median 2.643 vs 2.654) and neither shows a POP. The market pitch is 148×72 px of
a 1152×667 canvas — 1.4% — so HEAD's 6.66 mean-channel spike inside it dilutes to 0.10
across the whole frame and drowns under a dawn sky that is repainting every frame
anyway. The gate is a whole-frame mean; anything smaller than a couple of percent of the
canvas is invisible to it however violently it pops. Cropping to the feature was not a
refinement of the filmstrip, it was the only way to measure this at all.
(2) My first probe reported the closing line firing at hour 6.00 and the opening line
never firing — a real-looking bug in code that was fine. `__setTime()` rewinds `simT` but
not the announce flags, and an earlier `grab()` in the same page had already set
`marketAnnounced = 2`. `__reseed()` was not enough. The fix was a fresh page per
measurement. This is the same shape as #3's unreseeded probe: the harness rewinds *some*
of the world, and the part it does not rewind is exactly where a false reading hides.
**Law:** `filmstrip.mjs`'s Δ is a whole-frame mean, so it is blind to anything under
~2% of the canvas. Before trusting a clean strip, ask what fraction of the frame your
change occupies; if it is small, crop to it (see `probes/market-raise.mjs`).
**Law:** `__reseed()` rewinds the PRNG and `__setTime()` rewinds the clock, but neither
rewinds module-level latches (`marketAnnounced`, `windAnnounced`, `bellSeen`, `lastStruck`).
Reuse a page for two measurements and the second one starts with the first one's flags
already tripped. One page per measurement, or the probe invents a bug.
**Law:** Stage an appearance as N clamps on one 0..1 progress rather than as timed
steps. Reversing the progress then packs the thing away in the reverse order for free,
and there is only one code path to get right.
**Cue:** The probe's crop goes flat — exactly 0.00 for ~0.9 s after hour 8.03, and again
before 16.84 — in **both** HEAD and the work. Nothing moves in that box: the ground is a
cached layer, a standing stall is static, and no walker is inside it. Worth knowing that
the busiest-looking part of the lane is genuinely still for a second at a time.
**Cue:** `marketRaise()` is the town's third staged-appearance ramp after the washing and
the umbrellas, and all three hand-roll their own clamp chain. If a fourth arrives, that
is the moment for a shared helper.

## Iteration 9 — the boat is watched, and the bridge is stood on (2026-08-03) [River & far bank × Deepen]

**Brief:** b8 — closes c5 and c11. `updateBoat()` runs a boat past a quay nobody looks
up from, and no waypoint in the town ever stops anyone on the bridge the lane carries
across the river.
**Did:** Two halves.
(1) `boatWatch()`, called from `updateBoat()` while a boat exists. Every agent whose
`boat.y` draws level (±2.4 cells) *and* who can actually see the water — `byTheWater()`:
the quay and its rail, the bridge deck, the towpath — rolls once (72%) for
`a.watch = 1.0 + R()*0.8`. One glance per person per boat, gated on `a.sawBoat === boat.id`,
because the boat sits level with a quay bench for several seconds. `a.watch` ticks down at
the *top* of `stepAgent`, above every state branch, so a sitter on a bench runs it out the
same as a walker; unlike `a.listen` it never returns early, so a watch cannot hold anybody
anywhere. `drawPerson()` reads the live `boat` and offsets the head by
`clamp((boat.x - a.x)/5, ±1) * 2.2` with a `min(1, watch*3)` ease-out, so the head genuinely
*follows* rather than snapping to a stored angle. Standers also turn their body (`a.faceL`);
walkers keep their line. Two or more heads turning fires one ticker line per boat.
(2) A `parapet` stop: `PARAPET_Y = LN_WALK_N + 0.45`, x anywhere in the middle of the span.
Added to both `spawnLaneAgent` (roll 0.58–0.62) and `spawnEastAgent` (roll 0.72–0.85). And
`PARAPET_Z`: the upstream parapet stood at 1.5, measurably a head taller than anybody
crossing, so a person on the bridge read as standing at a wall. At 1.0 the head clears the
coping by 4.0 px against a 9.3 px person.
**Gates:** census PASS (no collapse; the histogram diff is PRNG churn) · visual PASS
(wide/courtyard/east/lane at seed 42 and seed 13 midday, plus 10× zooms on the parapet and
on three heads turning as the boat goes under) · motion PASS (zero jumps/nan/oob/flicker) ·
filmstrip: one POP at frame 7, **not mine** — see Surprise · probe
`probes/parapet-and-boat.mjs` over 4 seeds × 12 days: parapet occupied **12.0%** of daylight,
**2.1 glances per boat**, longest single watch **1.75 s** · perf skipped (one O(agents) pass
per sim step while a boat exists; three arithmetic terms per person per frame)
**Verdict:** shipped   ← my view; runlog.mjs decides from the diff
**Surprise:** Three.
(1) The first build put the parapet stop only in `spawnLaneAgent`, at 4% of the roll. The
probe measured **one** person on the bridge in twelve days. A role census over the same span
showed why: `spawnLaneAgent` fires ~3.3 times a day, so every late roll band is starved —
cyclist 1, lanesitter 1, browser 2 over twelve days, against quay 27 and green 23 from the
*east* spawner. That is the exact trap the east quarter was built to escape, re-entered from
the other side: I had reasoned about band width and never about the budget the band is a
share of. Moving the stop to `spawnEastAgent` took occupancy from 1.1% to 12%.
(2) The filmstrip POP at frame 7 (Δ10.99 against a 0.48 median) is not a draw-order fault
and not mine. HEAD has no POP in that window, which is exactly the misleading shape: my new
`R()` draws moved the shower, so the rain now *ends* inside the twelve frames, and 110
raindrops plus the wet-ground sheen go in one frame. A 3×3 region diff showed the jump is
global (7–15 in every cell), and a clock trace showed `raining true → false` between 6 and 7.
Reproducing the filmstrip's exact world mattered: it does `?t=0` then `__warp(175)`, and my
first probe used `?t=175`, which is a different world and showed nothing at all.
(3) Getting a figure to read as *looking over* the parapet rather than standing at it was a
2-px problem I could not settle by eye across three zoom levels. Four lines of arithmetic in
the page — coping screen-y against head-top screen-y — settled it in one run: 0.4 px of
clearance at the old height, 4.0 px at 1.0. My first attempt, drawn forearms up onto the
coping, was worse than nothing at 10× zoom: they merged with the head into a raised-arms
blob. Dropped.
**Law:** A roll band is a share of a budget, not a rate. Before widening or adding one, count
what its *spawner* actually fires per day — `spawnLaneAgent` runs ~3.3×/day, so a 4% band is
one person per twelve days. The town already has three arrival sources with separate budgets;
put a destination on the one whose front door it is.
**Law:** When a filmstrip POPs, reproduce its exact world before diagnosing — it seeds with
`?t=0` then `__warp(t)`, which is not the same world as `?t=<t>`. Then localise before you
theorise: a region-wise diff separates a global light or weather step from a draw-order fault
in one run.
**Cue:** Rain ends in a single frame — `raining = false` drops all ~110 raindrops and the wet
sheen at once, while the cover behind it eases away over half a day. The arrival is ramped and
the departure is a cut.
**Cue:** `byTheWater()` names the three places a person can see the river. Nothing else uses
it yet, but it is the predicate any future river event (a swan taking off, ice, a barge) would
want, and it should stay the only definition of that.

## Iteration 10 — the ticker holds its line, and the church finally answers (2026-08-03) [People & animals × Polish]

**Brief:** b9 — `announce()` overwrote `tickerEl.textContent` outright, so two events in one
frame showed only the second; fix that, then un-nest the unreachable church-answer branch.
**Did:** `announce()` is now a shallow ordered queue. `showLine()` owns the surface;
`TICK_DWELL = 2.5` real seconds is guaranteed to every line before the next may take it;
`tickTicker()` runs from the existing half-second stat bucket (no new per-frame work) and
ages, expires and drains the queue. The queue is capped at `TICK_QMAX = 2` and entries die at
`TICK_STALE = 6` s — a line that cannot be shown while it is still true is dropped, oldest
first, never shown late. In `strikeClock()` the `(hInt === 9 || hInt === 18)` branch is now
*inside* `hInt % 3 === 0` rather than an else-if against it, and `bellUntil` is one write
(`simT + (answered ? 2.6 : 2.2)`) so an answered strike is one longer flush, not two.
**Gates:** census PASS (unchanged, all 9 cells — no new `R()` draw, and the ticker is not
town state) · visual PASS · motion PASS (identical to baseline) · perf skipped (2 Hz, no new
per-frame pass) · probe `probes/ticker-queue.mjs` PASS on seeds 42/7/99/3
**Verdict:** shipped
**Surprise:** Two things the first cut got wrong, both invisible to a screenshot. (1) The
dwell was quantised to the 0.5 s stat bucket, so a line that went up mid-bucket was credited
with the whole of it and could be cut at 2.0 s; `tickerAge = -statAcc` at show time makes the
age equal real seconds on screen exactly. (2) Worse — at 18:00 a gardener line arrived in the
same window and shifted the *strike* out of the queue while its *answer* survived, so the
ticker read "The church bell answers…" with nothing to answer. Fixed by making the answer a
follow-on (`announce(txt, then)`) enqueued only when the strike is actually **displayed**, and
unshifted to the front. A dropped strike now takes its answer with it.
**Law:** A queued line that depends on another line is not an independent entry. Bind it as a
follow-on enqueued at *display* time of its antecedent, or the drop policy will eventually
show the reply without the remark. More generally: any drop-oldest queue will, given enough
traffic, break exactly the pairs you added it to protect.
**Cue:** iteration 9 left `probes/parapet-and-boat.mjs` at the repo root, matched by the
*unanchored* `parapet-and-boat.mjs` line in `.gitignore` — so it is cited in the ledger and
absent from the repo, which is the precise failure the anchored `/probe-*.mjs` comment above
it warns about. Either move it into `.claude/skills/grow-courtyard/probes/` and drop that
gitignore line, or delete it.

## Iteration 11 — the loop can finally see what an iteration costs (2026-08-03) [Sky, light & weather × Polish]

**Brief:** b10 — every worker row reads `secs=0 costUsd=0 turns=0 tokens=null`, so the one
metric this harness exists to catch cannot be read. Make the runner's call win; fix the
two-blob numstat; fall back to a HEAD~1 blob when `--pre-blob` is empty; deal with the stray
probe. Explicitly: do not touch `courtyard.html`.

**Did:** Four things, all in the harness.
(1) `runlog.mjs`'s "already recorded — nothing to append" guard is now a **merge**. An
iteration is legitimately recorded twice — the worker knows the ledger and the census, the
runner knows wall time, cost, turns and the true pre-blob — and neither call sees the whole
thing. The second call takes the more informative value field by field (`Math.max` for
secs/cost/turns/srcLines, OR for the monotone evidence booleans `srcChanged`/`committed`/
`logged`/`reverted`, keep-known-over-unknown for tokens/model/census), rewrites the row **in
place** by line index, and stamps `updated` + `merges`. It never appends a second line for the
same `iter`+`kind`. The verdict is no longer computed inline: `verdictOf(row)` is a pure
function of the *merged* evidence, so `rc` and `reverted` moved into `evidence` to be
mergeable at all. Lines the parser can't read are carried through the rewrite untouched.
(2) Dropped the `-- courtyard.html` pathspec from the blob-to-blob numstat. `git diff <blob>
<blob> -- <path>` is a **usage error, exit 129**, not a filtered diff — `git()` swallowed it,
so that branch returned `''` on every run since it was written.
(3) `--pre-blob` now falls back to the newest commit that is *not* part of this iteration
(`^Iter <N>`), not literally `HEAD~1` — which keeps it right when an iteration commits its
source and its runlog row separately, as every iteration here does. Worker only: for a manager
pass `HEAD~1` is the *previous worker's* commit, and the fallback would credit the manager
with the worker's diff.
(4) `probes/parapet-and-boat.mjs` → `.claude/skills/grow-courtyard/probes/`, path fixed to
`../../../../courtyard.html`. **No `.gitignore` change** — see Surprise.

**Gates:** census PASS (all five sections `unchanged`, which is the *correct* reading: the
artifact is byte-identical, blob `eeb2a879` before and after) · visual **n/a** and motion
**n/a**, not skipped-for-convenience — zero bytes of `courtyard.html` changed, so a screenshot
gate would be photographing HEAD · probe `probes/runlog-merge.mjs` **24/24 PASS**, run against
a scratch copy of the skill dir so the real `RUNLOG.jsonl` is never written: it asserts the
merge lands the metrics, produces no duplicate, keeps `when` as first-sighting, preserves
ledger evidence, recomputes the verdict, counts 68L from the two blobs where `HEAD~1` gives 0,
survives an unparseable line, and — case 5 — does not let a *bare* second call zero metrics a
first call already recorded · relocated `parapet-and-boat.mjs` re-run end to end and reproduces
#9's published figures exactly (12.0% occupancy, 2.1 glances/boat, longest watch 1.75 s), which
is both a move-didn't-break-it check and the first time that ledger citation has been backed by
a file in the right place.

**Verdict:** no-ship ← and that is the right answer, not a miss. The brief forbade touching
`courtyard.html` and I did not; `runlog.mjs` will score this row `no-ship` from the blob, the
two will agree, and nothing was done to the source to make the number look better.

**Surprise:** Two, and both are the same shape — a stale premise that had already been
promoted into memory as fact.
The brief (inheriting #10's cue) said an *unanchored* `.gitignore` line had swallowed the
parapet probe, so it was "cited in the ledger and absent from the repo". It was never absent.
`git log -p --all -- .gitignore | grep parapet` returns **zero occurrences ever**, `.gitignore`
has not been touched since `cc497f6`, and the file has been tracked since `f23c893`. What #9
actually did was create a **second `probes/` directory at the repo root** and commit the probe
into it. Nothing was ignored; it was in the wrong one of two identically-named directories, and
everyone downstream diagnosed the ignore rule that the `.gitignore` comment had already warned
them about. Deleting that anchored line — which the brief offered as an option — would have
removed a working guard to fix a bug it was not causing.
The second: the pathspec bug was invisible because the fallback masked it *perfectly*. Every
iteration commits its source in one commit and calls `runlog.mjs` before writing its second
commit, so at that instant `HEAD~1..HEAD` is exactly the right diff — nine rows of plausible,
correct line counts produced entirely by a fallback the comment above it calls unreliable, from
a primary path that had never once executed. A wrong mechanism and a right answer, agreeing for
nine iterations. That is why the probe asserts on the *number* the two blobs give and against
what `HEAD~1` gives in the same breath (68 vs 0 today): the two only diverge once HEAD has
moved on, which is precisely when nobody is looking.

**Law:** A guard that refuses a duplicate throws away whichever call is second — so if the two
callers know *different* things, the refusal silently discards one of them forever. Merge
field-by-field on an identity key instead, treating the empty value (0, null, '') as "not
measured" rather than as a measurement. Ten iterations reported $0.00.
**Law:** Before removing a guard a ledger cue blames, check the guard ever fired. `git log -p
-- <file> | grep <thing>` costs one command; the cue that sent you may have been written by
someone who also only read the comment. A promoted law inherits its evidence *and its
mistakes*, and is then read forever.
**Law:** `git diff <blob> <blob> -- <path>` is a usage error, not a filtered diff. Any git
call wrapped in a `try/catch { return '' }` needs its exit status checked at least once by
hand, or a permanently-failing command reads as a permanently-empty result.

**Cue:** `stall.mjs:110` and `build-stats.mjs` average `secs`/`costUsd` over *all* rows
including the nine zero-metric ones, so "last 10: avg 2m $0.48/iter" is a real total divided by
ten. Rows 2–10 stay zero on purpose (honest records of a broken instrument, per the brief), so
the means stay wrong for ten more iterations unless the aggregates skip rows with `secs === 0`.
Worth one line each; I left it because it is the manager's dashboard, not the worker's.
**Cue:** `~/Library/Logs/courtyard-grow.log` does hold real wall times for iterations 2–10
("landed in 1143s", etc.), so `secs` *could* be back-filled. Cost, turns and tokens cannot be —
they only ever existed in the discarded `--raw` stream. A half-back-fill would read as "20
real minutes for $0.00", which is worse than a visible zero. Left alone deliberately.
**Cue:** `LAWS.md`'s probe law states its reason as the unanchored `.gitignore` line. The
advice (probes live in the skill's `probes/`) is right; the stated cause is not. Manager may
want to reword it to "there is exactly one `probes/` directory" before it is re-derived again.
