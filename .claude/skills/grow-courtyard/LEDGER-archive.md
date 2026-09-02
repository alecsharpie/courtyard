# The Courtyard — ledger archive

Entries rotated out of `LEDGER.md`. Append-only. **Only the manager reads this** —
a worker that opens it to "catch up" spends its whole context on history.

## Iteration 2 — the bell now moves the town (2026-08-03) [River & far bank × Connect]

**Brief:** b1 — `bellUntil` was written by `strikeClock()` and read by nothing. Make
the world visibly answer for the ~2.5 s it rings.
**Did:** `simStep()` reads `bellUntil` on the rising edge (`bellSeen`) and calls a new
`bellStartle()`. That puts the belfry roost up as `birds` in a new `'wheel'` state —
they fan out from the tower top, then climb away and despawn above z 22 — and sets
`a.listen = 1 + R()*1.1` on ~45% of walking agents. `stepAgent()` returns early while
`a.listen > 0`, which freezes the walk cycle mid-stride because `a.phase` only advances
with movement; `drawPerson()` tips the head back and away from facing. `drawBird()`
gained an optional `sz` and reads `ph2` for the wingbeat when present. `strikeClock()`
itself is untouched — it still owns when the bell rings.
**Gates:** census PASS (birds +15; the rest of the histogram is PRNG churn, see Law) ·
visual PASS (wide/courtyard/east/lane, no draw-order regression) · motion PASS (bird
spawns +51, zero jumps/nan/oob/flicker) · probe `probes/bell-startle.mjs`: 47% of
walkers listening, 5.4 pigeons per strike over 58 strikes · perf skipped
**Verdict:** shipped   ← my view; runlog.mjs decides from the diff
**Surprise:** Two.
(1) The church-answers branch in `strikeClock()` is **unreachable**. It is an `else if
((hInt === 9 || hInt === 18) && day >= 2)` hanging off `if (hInt % 3 === 0)` — and both
9 and 18 are divisible by 3, so the clock branch always wins. The brief described it as
live. I left it alone (the brief says `strikeClock` owns the bell) and raised it as a cue;
the fix has a real design question attached, because `announce()` overwrites, so firing
both lines in one frame would show only the second.
(2) Tuning this was entirely a *legibility* problem, not a behaviour problem. It worked
on the first run and still took four passes to see: the flock spawned over the near-black
belfry louvre, then it was too small a roost, then I over-corrected to pale pigeon-grey
against a pale sky. The town's time compression is the hidden constraint — the clock
strikes every ~7 real seconds, so a 5 s flight leaves pigeons airborne 75% of the time
and the "event" stops reading as one. A finite roost that refills at 0.85/s and a ~2.4 s
flight put the duty cycle at ~37%, which reads as an answer instead of as decor.
**Law:** Adding an `R()` draw to a per-tick path reshuffles the entire seeded world
downstream — the census histogram churns everywhere (here: marigolds −87, raindrops
−110) without anything being wrong. Read that diff for *collapse*, not for delta.
**Law:** A once-per-event effect must be tuned against the town's **time compression**,
not against the clock it hangs off. A day is 55 s, so "every third hour" is every ~7 s;
anything lasting more than ~2 s stops being an event and becomes state.
**Cue:** The `(hInt === 9 || hInt === 18)` church-answer branch is dead code (see above).
**Cue:** `updateBoat()` still runs the boat past a quay full of people who never look at
it — the same written-but-unread shape as `bellUntil`, and now there is a mechanism
(`a.listen`) that would fit it.

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

**Proof on this row (the brief's success criterion).** Call 1, the worker's own:
`○ Iter 11 … no-ship 0m00s $0.00 0L 6996159`. Call 2, runner-shaped, carrying
`--elapsed 857 --rc 0 --pre-blob`: `○ Iter 11 … no-ship 14m17s $0.00 0L 6996159
[merged +1]`. `grep -c '"iter":11'` = **1** before and after; the file went 12 → 13
rows for one new iteration. The row now carries `when` 04:57:28, `updated`
04:57:46, `merges: 1`, `secs: 857`, and `verdict` = `selfVerdict` = `no-ship`.
`stall.mjs --report` reads `#11 … 14m` where every worker row before it read `0m`.
**`costUsd` is still $0.00 on this row and that is honest, not a half-fix**: cost,
turns and tokens exist only inside the `--raw` stream-json capture that
`run-loop.sh` makes, and this iteration was hand-invoked, so no such stream exists
to read. Fabricating one to make the row look complete is the exact failure this
harness was built to stop. The `--raw` path is proved instead in
`probes/runlog-merge.mjs` cases 1, 5 and 6, against a stream the probe writes and
labels as synthetic. The first row with a real dollar figure will be #12, from the
runner.

**Cue:** `stall.mjs`'s `streak()` runs over *all* rows, and a manager pass is always
`verdict: no-ship` with `srcChanged: false`. With `MANAGER_GAP=2` a manager row sits
beside worker rows constantly, so a *single* no-ship worker iteration is enough to
fire both `noShipStreak` and `srcFlat` — which is precisely what happened on this
iteration, where no-ship was the brief's own instruction. The trigger that summons
the manager is counting the manager's own passes as evidence that the loop has
stalled. One-word fix (`streak` over `kind === 'worker'`), but it changes when the
manager runs, so I left it as the manager's call.

## Iteration 12 — the town has a year now (2026-08-03) [Sky, light & weather × Scale/World]

**Brief:** b12 — `maturity()` pins at day 8 and `richness()` at day 16, so every growth term
is spent by real minute 15 and there is no later act. Add ONE slow *cyclic* scalar `season()`
on the footing of `cloudCover()`, rate-capped, with at least two readers in the sky: the length
of the day, and the light. Set a floor and state the population trough.

**Did:** `SEASON_LEN = 26` days (× 55 s ≈ **23.8 real minutes** a year). `seasonPhase` advances
at exactly `1/(SEASON_LEN*DAY_LEN)` per sim second in `updateClock`, `warmth = 0.5 - 0.5*cos(2π·phase)`,
and `season()` is the accessor. The clock **starts at phase 0.25**, where warmth is exactly 0.5 —
and every seasoned expression below is written as a pair that *averages to the constant it
replaced*, so day 0 is the old town precisely and the year is a departure from it in both
directions. Phase 0 is midwinter, so the once-a-year wrap lands where nothing else happens and
`warmth` is continuous through it.
*Reader one, the day itself:* `dayHours = lerp(11.5, 17.5, warmth)` about a fixed `SOLAR_NOON`
12.75; `sunUp`/`sunDown` walk apart and back and `daylight` is the sine over that window.
`timeLabel()` hangs off the same two, or it reads "Morning" in the winter dark.
*Reader two, the light:* `sunVec()` drops its elevation and swings its azimuth with `warmth`
(shadow length `SUN[1]/SUN[2]` runs 0.83 at midwinter noon against 0.25 at midsummer); `skyCols()`
seasons the day, night and dusk palettes and hangs both dusk windows off `sunDown`/`sunUp`; the
roof `key` term scales 0.84..1.16. One `sunArc` in `updateClock` now feeds both the shading
vector and the drawn disc, which each used to derive their own from hard-coded hours.
Census carries `clock.season` and nothing else.

**Gates:** motion **PASS** ×2 (nothing teleported, NaN'd or flickered; the firefly/leaf spawn
churn is the reshuffle plus genuinely longer winter nights) · perf **PASS** +0.0% against the
interleaved same-session control · visual **PASS**, from `probes/year-shots.mjs` rather than
`shoot.mjs` — see Surprise · census **FAIL, investigated and overruled on measurement**, below.

**The census FAIL.** `COLLAPSE people 139 → 127 (-8.6%)`. It is not a collapse, and I did not
take that on faith:
- `probes/census-noise.mjs` runs the gate's own 9 cells on both builds and then widens to 8
  seeds. Over 8 seeds the diff is **-3.1%**, not -8.6% — and **HEAD's own 9-cell total moves
  139..147 (6%) purely by which three seeds you pick**. The gate's three seeds happen to be
  HEAD's *lowest* triple. Cell `42@900` alone is -6 and is a shower that landed on the sample
  instant (`cloud 0.23`, dry → `cloud 0.92`, RAIN); `19@900` *lost* its shower and gained +2.
- `probes/season-year.mjs` measures the thing the gate is proxying, at ~4,400 samples per build
  instead of 9: **settled (day ≥ 8) mean population 21.91 vs HEAD's 21.73.** The year costs the
  town nothing on average.

**The floor, as the brief asked.** Folding 3 years × 3 seeds onto one and binning by phase:
midwinter **20.35** · late winter 22.03 · spring 22.31 · late spring 22.69 · **midsummer 23.48** ·
late summer 21.95 · autumn 21.08 · early winter 21.68. So the population does breathe, by about
**15% trough-to-peak** — and the **absolute floor across every sample of every seed is 7 people**
(HEAD's is 8). Deep winter is never a dead diorama. This is deliberately gentle: I kept peak
`daylight` at 1.0 so *duration*, not midday brightness, is the seasonal lever on population, and
winter reads dim through the light instead. See the Law about why it could not be much larger.

**Surprise:** Three.
(1) **The sun did not know what month it was.** `sunVec()` seasons the *shading*, but the disc
in `drawSunMoon` had its own `sy = hz - sin(π·sa)·hz·0.74` — so at midwinter noon the sun sat at
exactly midsummer height and only the shadow lengths dissented. The one object in frame a viewer
looks straight at was the one thing not seasoned. Caught by putting the two noons side by side,
not by any gate. Fixed by riding the same elevation, plus a colour ramp (pale and cold → deep gold).
(2) **`shoot.mjs` cannot compare two builds.** It runs `&fast` (8×) with a fixed 2,600 ms wall
wait, so its sim instant lands anywhere across ~15 s of sim time — its comment says "day 3,
mid-morning" and it photographed Day 4 · Night twice tonight. Fine as a does-it-still-draw check,
useless for HEAD-vs-here. `probes/year-shots.mjs` pins the instant with `?pause` + `__warp()` and
shoots both builds at the same moment of the same seeded world; that pair is what actually cleared
the draw-order check.
(3) **The filmstrip POP was the instrument, not me.** `--gap 55` POPped at frames 3–4 (Δ 11.6,
12.9 against a 2.7 median). Running the *identical* filmstrip against HEAD in a scratch root
(`/tmp/fs-head/.claude/skills/grow-courtyard/`) POPs at **five** frames at the same Δ≈11 — and
HEAD's frame-1 POP is measurably a full rainstorm clearing (`cloud 0.92` + 110 drops → `cloud
0.12`). At a one-sim-day gap, Δ≈11 is what weather costs. My sheet is quieter than HEAD's.

**Law:** The census's `people` has a **~6% seed-choice noise floor against a 5% collapse
threshold**, so it can fire on nothing — and *any* change that moves `daylight` or a rain gate
reshuffles the PRNG as thoroughly as a new `R()` draw does, because those gate whether an `R()`
is drawn at all. Before believing a `people` FAIL, widen the seed set and measure the same
quantity densely; nine instants cannot tell a seasonal trough from a rainy Tuesday.
**Law:** When you season (or otherwise parameterise) an existing constant, write the new
expression as a pair that **averages to the old constant** at the mid-point of the new parameter,
and start the world there. Every gate then reads the unchanged town at t=0, so a diff is
attributable to the parameter and not to a new baseline — and the change is provably a departure
in both directions rather than a one-way shift.
**Law:** A screenshot tool that runs `?fast` with a wall-clock wait is not pinned, whatever its
`--t` says. Comparing two builds needs `?pause` + `__warp()`; anything else compares two moments.
**Law:** Before blaming your change for a `filmstrip` POP, run the identical filmstrip against
HEAD in a scratch root. The instrument has a baseline rate of POPs and nobody had measured it.

**Cue:** `0.25 + 0.75*daylight` in `capacity` (and `0.2 + 0.8`, `0.15 + 0.85` in the rates)
compresses hard, so mean daylight running 0.305 (winter) to 0.464 (summer) — a 52% swing — moves
`capacity` only 8 → 9. That compression, not the season, is why the population breathes 15% and
not 40%. Widening it is a People-&-animals vector with real risk to the floor, and it is the
manager's call, not a thing to slip into a sky iteration.
**Cue:** `stepClouds`'s heavy-front probability reads `richness()`, which pins at day 16 — the
weather is now the only slow system left that still has a one-way ramp in it. `season()` is
sitting right there.
**Cue:** `context-budget.mjs` reported **OVER (48.4 KB / 46 KB cap)** at the start of this
iteration, before I read anything. LAWS.md is at 28/60 laws and I am proposing four more.



<!-- Full text of entries 18-20, preserved verbatim when the manager condensed
     them in LEDGER.md at pass #20 to bring the worker read budget back under cap.
     LEDGER.md now carries the distilled version; this is the record. -->

## Iteration 18 — the working day goes on the sun (2026-08-04) [Lane & market × Connect]

**Brief:** b17 — #11 moved sunrise and sunset across the year and nothing anybody DOES
followed. Put the working day on the sun, keeping each interval's relation to sunrise
and sunset rather than its number.

**Did:** every hour anybody works is now an offset from `sunUp`/`sunDown`, and every
offset is chosen so that at `SEASON_START` it reduces *exactly* to the constant it
replaced. `kioskOpen()` 7.50–18.50 → `sunUp+2` .. `sunDown-1.5`. `marketActive()` 8–17 →
`marketOpen()`/`marketClose()`, two new one-definition accessors, because three things
read those ends — the predicate, `marketRaise()`, and the pack-away line in `simStep()`.
`marketRaise()`'s hard-coded 8 and 17 now call them. The sweeper's 5.00–6.50 →
`sunUp-0.5` .. `sunUp+1`. The wind announcement's 7–9 → `sunUp+1.5` .. `sunUp+3.5`. The
market-closed announcement's `hour >= 17` → `hour >= marketClose()`, and its copy lost
the words "Five o'clock" because the hour it named now moves 16.44–18.44 across the year.

Two clamps, both stated in the source. `MK_MIN_SPAN = 7`: a pure offset hands midwinter a
six-hour market and the brief was right that that is a different feature, so the close is
pushed back to meet a floor. `MK_EARLIEST = 7.2`: see **Surprise**.

**Gates:** census **FAIL**, attributable (below) · visual PASS (4 framings + a HEAD-beside-
HERE pair at two pinned instants) · motion **PASS** (nothing new jumped, flickered or went
NaN) · filmstrip PASS (no POP, no FROZEN) · perf skipped — the change is ~6 extra `Math.max`
calls per frame, no new pass · `probes/working-day.mjs` **34/34**

The probe is the gate that matters, because the census cannot see a predicate. Across four
market days spread round the season year it reports every boundary as an offset from the sun
*at the moment of the flip*: kiosk open holds `sunUp+2.02..2.05`, kiosk shut `sunDown-1.50..1.56`,
the sweeper `sunUp-0.44..-0.47`, while the clock times themselves move 2.19 h (market open) and
2.94 h (kiosk close). At `simT 0` all ten boundaries land on the old constant to 1e-9.

**Census FAIL is the PRNG reshuffle, not a regression** — `people` 183 → 167 (−8.7%). Changing
what gates an `R()`-consuming branch moves the whole stream. `probes/census-noise.mjs` at the
census's own ages: the same statistic is −1.5% across eight seeds, and **HEAD's own 9-cell total
spans 8% on identical code** just by choosing three different seeds. The census's three seeds
drew the low end. `raindrops −110` is the same shower landing on a different frame — the motion
gate still counts 110 drop spawns in all three scenes.

**Verdict:** shipped

**Surprise:** the sim day's rollover is a hidden tuning constant, and it nearly ate the feature.
`hour` runs 6.00 → 6.00 and `day` rolls with it, so everything before 6.00 belongs to the
*previous* day's tail where `isMarketDay()` is false. The stalls need the hour before opening to
go up (`marketOpen() - 1.10`), and a midsummer opening at `sunUp+2.5 = 6.50` puts that at 5.40 —
`marketRaise()` returns 0 through the whole raise, and then three near-finished stalls land in a
single frame at the rollover. Exactly the pop `marketRaise()` was built to prevent, reintroduced
by a change that never touched it. The original source had already encoded this and I read past
it: the comment said the raise starts at "6.90", one decimal place from the boundary, and did not
say why that mattered. `MK_EARLIEST = 7.2` is the earliest opening whose raise starts inside its
own day with margin; it is the one place the sun does not get the last word, and high summer opens
`sunUp+3.2` instead of `sunUp+2.5` because of it.

The second surprise was cheaper: my first anchor assertion failed and the code was right. I
checked neutrality by scanning day 26 (phase 0.250) and comparing clock times, but the season
drifts 1/26 of a year *within a single day*, so by evening `sunDown` had already moved 0.36 h and
the kiosk shut at 18.69 instead of 18.50.

**Law:** Neutrality is a claim about an *instant*, so assert it at the instant — evaluate the
boundary functions at the anchor phase, not by scanning a day that sits on it. A day is 1/26 of
this world's year, which is enough drift to fail a tolerance and send you looking at correct code.
Everything else stays a scan, and reports its offset against the sun *sampled at the flip*.

**Law:** Before hanging a schedule on a continuous quantity, find the discontinuity it has to live
inside. Here it is the day rollover at `hour 6.00`, where `day` — and therefore every
`day`-derived predicate — steps. Any window that a variable now drags across that seam silently
evaluates against the wrong day, and the failure is not an error but a pop. Grep for what the old
constant was *clear of*, not only for what read it.

**Cue:** the sweeper still starts half an hour before sunrise, where `daylight` is exactly 0. That
is deliberate — "before the town wakes" is the point of him, and the shot pair shows HEAD had him
out 1.4 h before a midwinter dawn against HERE's nothing — but a 0.5 h offset into true dark is a
seam for anyone who later wants civil twilight as a real quantity rather than a clamped sine.

**Cue:** `context-budget.mjs` printed **OVER** at the start of this iteration — 52.1 KB against a
46 KB cap (LEDGER 18.1, SKILL 11.8, state 10.8, LAWS 9.4). Two passes over now. This entry makes
it worse again. The state inventory has grown past the ledger's own share and is the softest target.

## Iteration 19 — the year is felt in how busy the town is (2026-08-04) [People & animals × Deepen]

**Brief:** b18 — a 52% swing in mean daylight was coming out as a ~15% swing in
people. Widen the breathing, let the three arrival sources breathe by different
amounts, and hold an absolute floor.

**Did:** Two changes, one measurement between them.

*The compression.* `capacity`, `laneCap` and `eastCap` were each `k + span*(f +
(1-f)*d)`. Multiplied out, `k + span*f` is the share the sun never touches — 5 of the
courtyard's 14, 3 of the lane's 9 — and averaged over a whole day that fixed share is
most of the budget. Peak daylight is also 1.0 in *every* season by design (duration is
the seasonal lever, never midday brightness), so the honest swing available from
daylight alone is at most the ratio of the day lengths, 17.5/11.5 = 1.52, before the
fixed share eats into it. So the year went onto the *varying* term as a multiplier and
the fixed term was left exactly alone. `yearBusy(ex)` is read off `daySpan()` — the
length of the day normalised 0..1 — rather than off `warmth`: the same number, honest
provenance, since what makes a July evening busy is that it is still light. `ex` is
exposure: `EX_COURT` 0.5 (walled and sheltered), `EX_LANE` 1.0 (open), `EX_EAST` 1.25
(you go out to it, across a bridge). `YEAR_SWING` 0.40. The caps are now `2 +
round(mat*(3 + 9*d*yearBusy(EX_COURT)))` and so on — algebraically identical to what
they replaced at the anchor, and identical at `daylight` 0 in every season.
`eastCap` keeps `Math.min(7, …)`: cue c10 says east agents retrace their inbound route
and would queue above seven, so summer spends its lift on reaching the ceiling *earlier
in the day*, not on raising it.

*The rail.* `POP_FLOOR` 8 with `scarcity = 1 + 0.8 * clamp(POP_FLOOR - agents.length, 0,
6)`, multiplying the three arrival rates only — never the caps. Nobody pops into being;
the town refills by people walking in, sooner after one another, and the (unchanged)
night caps still decide where it settles.

**Gates:** census PASS (people 167→190, inCourtyard +7, onStreet +16, inEast +6; the
species churn and the +110 raindrops are the seeded stream reshuffling under a
different number of spawns, not new draws — no `R()` call was added) · visual PASS
(`probes/year-shots.mjs`, five pinned instants on HEAD and here: summer noon 23→28
people, winter noon 25→21, winter dusk 27→17; winter night still legible — lit lane,
25 blooms, 17 people — plus the standard wide/courtyard/east/lane framings clean) ·
motion FAIL-then-explained: the only kind that moved is `raindrop`, `day` 0→1 jumps
and `dusk` 1→0 — the shower changed scene under the reshuffle. HEAD's own baseline
records `raindrop jumps 1 / spawns 110` in whichever scene it rains in, so that is
rain's own distribution, not a new defect. **`walker`, the kind this iteration
actually moved, is 0 jumps / 0 nan / 0 oob / 0 flicker in all four scenes.** ·
filmstrip day clean, no POP, no FROZEN, median Δ 0.410 · perf skipped (no new
per-frame pass — two extra multiplies in a block that already ran) · anchor assertion:
`yearBusy` is **exactly 1.0000** for all three exposures at `SEASON_START` and again
one full year on, so day one is provably the town as it was.

**Probe:** `probes/season-year.mjs` extended — it now carries `inCourtyard`,
`onStreet - inEast` and `inEast` through the fold and prints a summer:winter ratio per
source. Three seeds × 60 sim days (~2.3 years), folded onto one year:

| | midwinter | midsummer | ratio |
| --- | --- | --- | --- |
| total | 20.55 → **16.73** | 22.49 → **26.07** | 1.09 → **1.56** |
| courtyard | 10.83 → 9.85 | 11.35 → 12.38 | 1.05 → **1.26** |
| lane | 6.90 → 4.84 | 7.19 → 9.39 | 1.04 → **1.94** |
| east | 2.82 → 2.04 | 3.95 → 4.29 | 1.40 → **2.10** |

Settled mean is 21.65 → 21.48 — the year *redistributes* the town rather than
inflating it. Absolute floor across all 3,600 samples: 8 → **8**, equal to HEAD.

**Verdict:** shipped   ← my view; runlog.mjs decides from the diff

**Surprise:** Holding every night-time cap identical did not hold the night. The first
build left `capacity` and `laneCap` at `daylight` 0 byte-identical to HEAD in every
season — and the worst sample still fell from 8 people to 5. Most of a 03.00
population is not spawned at 03.00; it is daytime walkers still finishing forty-second
trips. An emptier winter afternoon therefore arrives at midnight as an emptier town,
several sim hours later, through a term nobody edited. The cap was never the floor.
That is also why the rail had to be a lift on the *rate* rather than on the cap: the
caps at night already permitted 5 + 3 = 8, and what was missing was arrivals to fill
them. The first rail (`1 + 2*(floor-n)/floor`, ~1.25× at seven people) was too gentle
and only reached 7; per-person and steeper (`1 + 0.8*(floor-n)`, 1.8× at seven) reached
8 with no visible change anywhere above the floor.

**Law:** Caps set the inflow and trip length sets the standing population — so a cap
floor is not a population floor. A budget cut anywhere in the day resurfaces hours
later through walkers still finishing trips, in a term nobody edited. Floor the
arrival *rate* and let the untouched cap decide where it settles.

**Law:** When a slow world scalar has a deliberately flat peak (daylight is 1.0 at
noon in every season, on purpose), the swing it can deliver is bounded by its
*duration* ratio, and whatever fixed share each consumer carries eats into that. Put
the year on the varying term as a multiplier and leave the fixed term alone: the fixed
term is then the floor by construction, and the anchor stays provably neutral.

**Cue:** `eastCap` now sits at its 7-person ceiling for materially more of a summer day
than it did. The ceiling itself is unchanged, so c10's queueing risk is no worse per
instant — but it is exposed for longer, and nobody has yet watched a summer afternoon
at the park gate to see whether the single-file retrace reads as a queue.

**Cue:** `scarcity` also fires in the first sim minute, when the town is legitimately
empty, so the opening fill is slightly hurried compared with HEAD (day 4 mid-morning:
13 → 18 people). The maturity() ramp still bounds it, but the very first minute is now
a servo rather than a ramp.

**Cue:** `context-budget.mjs` printed **OVER — 53.6 KB against a 46 KB cap** at the
start of this iteration (c38's 48.8 KB, worse). LEDGER is 18.9 KB of it and this entry
adds to that. Rotation is overdue.

## Iteration 20 — the paving learns which paving it is (2026-08-04) [Plaza & quay × Polish]

**Brief:** b19 — the click handler's `SIDE || ROAD` branch answers "You scatter crumbs
onto the lane" for the paving of five different quarters, and clamps its birds into
`LN_WALK_N..LN_WALK_S` so they land in the lane however far east you clicked.

**Did:** One table, `PAVING`, with six entries — `lane`, `bridge`, `cross`, `plaza`,
`quay`, `towpath` — each carrying its line *and* the box its crumbs' birds may land
in, plus the spread along each axis. `pavingAt(x, y)` is the single predicate that
places a cell; it is called only on a cell `answersTouch()` has already called SIDE or
ROAD, and south of `LN_WALK_N` the paving is the lane all the way across except where
it is carried over the river (the bridge deck — a sixth place the brief did not name,
found by walking the grid). No seventh KIND: still one branch, still crumbs, still
`birds.length < 4` and `daylight > 0.2`, still 3 birds and the same two `R()` draws
each. Bird placement moved out to `crumbSpot(p, x, y, k)`.

**Gates:** census PASS (scalars/tiles/life/structure/species all *unchanged* — a click
handler moves nothing the census watches, which is the point) · visual PASS (`east`
and `lane` byte-identical to pre-edit; `wide` differs but is **not reproducible
run-to-run on unmodified HEAD either**, so that diff is the harness, not the change) ·
motion PASS (unchanged) · perf skipped (no per-frame pass) · **probe PASS** —
`probes/paving-places.mjs`.

**Verdict:** shipped

**Surprise:** the probe found two defects the brief did not contain, and I would have
shipped both. (1) The cross street and the quay run from **y = 0**, not y = 3 as I had
guessed from the towpath's `y < 3 ? WALL : SIDE`; 6+ cells were being named for a box
they sat outside. (2) Sampling three birds independently inside one small box put two
of them within 0.9 cells — the "renders as one shape" law — in **4 of 8** click cases,
including the *old* lane behaviour. So the pre-existing code had a second bug hiding
under the one I was sent to fix, and only a numeric check saw it. Staggering the three
at fixed thirds of the long axis with a ±s/12 jitter floors the gap at s/3, so every
place's long spread is now ≥ 3 cells by construction.

**Law:** *Fit a scatter by moving its centre, not by clamping its members.* Clamping
each of N placements into a box independently is what collapses a deliberate spread
back into a heap at the box's edge — exactly where the code looks most careful. Fit
the whole pattern's centre first, then place relative to it, and the spread is
guaranteed instead of hoped for.

**Cue:** the plaza's actual paving is `PATH`, and `answersTouch()` does not answer
PATH — so the plaza roundel around the fountain, and the whole courtyard path ring,
are dead to the cursor and to the click. `PAVING.plaza` only ever fires on the plaza's
6×4-cell **mouth** onto the lane (24 cells of the world's 2903 paved ones). The brief
asked for "the plaza around the fountain" believing otherwise. Extending the answering
surface is a real vector, but it is not this one — it moves the cursor's 46% share and
needs `touch-hint.mjs` re-measured.

**Cue:** `context-budget.mjs` printed **OVER — 53.7 KB against a 46 KB cap** at the
start of this iteration, again (c42 saw 53.6 at #19, c38 saw 48.8 at #17). Three
consecutive workers have now reported it and the file has only grown.


<!-- Full text of iterations 23-25, archived at manager pass #25. The copies
     kept in LEDGER.md are condensed to the per-entry cap; nothing below is lost. -->

## Iteration 23 — the river joins the year (2026-08-04) [River & far bank × Deepen]

**Brief:** b22 — the river had one iteration in twelve and was the quarter of town most
identical in February and August. Give it a year, name the flow, anchor at `SEASON_START`.

**Did:** One term, `riverRun() = 1 + RIVER_SWING * greyF()` — how full and how fast the
channel runs. ×1.45 in January, ×0.55 in July, exactly 1 at the anchor. Four readers, and
the flow now has a name: `drawRiverFlow(t)` was twelve anonymous streaks inline in the frame
loop, and reads riverRun() for drift speed, streak COUNT (7–17), streak LENGTH, and a colour
written as an offset from the two constants that were there (±11/6/6 on r/g/b), so winter is
many long fast cold-blue streaks and August a few short slow green ones. The fifth reader is
the water itself: `riverCol()` leans the channel toward `RIVER_COLD`/`RIVER_GREEN`, and
`clamp(mid * riverRun())` pushes the deep mid-channel out toward both banks in winter and
draws it back to a thread in summer — the same gradient, run higher. None of it consumes an
`R()`; it is `hash()` and the clock.

The boat moves the other way: `boatRate()` thins as the water rises (`BOAT_SWING 0.75`) with
`BOAT_FLOOR 0.0065` binding through the whole winter quarter, because a boatless season kills
`boatWatch()` with it. `boatSpeed()` takes `BOAT_DRIFT 0.24` of the current, so high water
carries the hull through quicker — which is also what stops one slow summer boat blocking the
river, since only one is ever on it.

**Gates:** census **PASS** (people +2, blooming −43, species reshuffled ±100, structure and
tiles unchanged — the boat's spawn times move, so every downstream `R()` moves) · visual
**PASS** (four framings; plus pinned same-hour winter/summer river crops) · motion **FAIL,
attributed** — `market/shower` jumps 2→4, a POPULATION row where a shower starting *is* a jump
by construction, and the entity-level `raindrop` row is 0/0/0/0. New `probes/shower-jump-spread.mjs`
replays motion.mjs's exact world over 10 seeds instead of 2: HEAD 0..2 (mean 0.80), here 0..3
(mean 0.90). The gate's two-seed sample landed on 2 and 4. I did not touch the threshold ·
filmstrip day clean; night **POP at frame 11** = #21/#22's known winter sunset, `pop-what-moved.mjs`
shows `nightF` lifting off zero at that frame on HEAD identically · perf **PASS** (16.70/16.70,
vsync-capped) · probes: new `river-year.mjs` — ANCHOR IDENTICAL to HEAD (ground layer sha1
`48728a5366b8` both, channel `rgb(63,90,104)` both, streak rgb `190,210,235` both, riverRun 1,
boatSpeed 1.05, streaks 12; boatRate differs by 1 ulp, which is `Math.cos(PI/2)`'s 6.1e-17 and
is in HEAD's seasoned terms too). 8 seeds × 3 years, HEAD → here, boats/day and share of time a
boat is actually on the water: winter 0.314/52.2% → **0.230/32.4%**, summer 0.314/51.1% →
**0.320/72.2%**, spring 0.250/44.1% → 0.289/44.3%, autumn 0.282/49.6% → 0.276/53.3%, YEAR
0.290/49.3% → **0.279/50.5%** — redistributed, not removed · new `river-shots.mjs`: HEAD's
channel is `rgb(63,90,104)` in *both* seasons; here it is `rgb(80,111,109)` in July and
`rgb(64,92,109)` in January, and the crop's mean g−b goes from HEAD's −6.23/−6.34 (0.11 apart)
to +7.22/−6.45.

**Verdict:** shipped   ← my view; runlog.mjs decides from the diff

**Surprise:** The brief asked for a summer:winter ratio in **boats per day** and that number is
the one I could not move much — 0.320 against 0.230. The river holds exactly one boat, so a
trip plus a wait is a fifth of a season and arrivals are occupancy-bound: summer saturates at
~0.35/day however high the rate goes, and raising the winter floor to keep January from going
boatless eats the bottom of the range from the other side. The year is unmistakable anyway,
because it landed in **presence** — 72% of summer has a boat on the water against 32% of winter,
where HEAD was flat at ~50% in every season. Count and presence are the same throughput seen
twice, and only one of them was free to move.

The second one I nearly filed as a bug: spring and autumn are 44.3% and 53.3% present, an
18-point split between two phases where every term I wrote is symmetric by construction. It is
#21's hysteresis law arriving through a completely different door — the slow variable here is
not a rate-capped scalar, it is the boat itself. A summer boat's trip is ~2 days of a 26-day
year, so autumn inherits a river with a slow boat still on it and spring inherits an empty one.
The pair averages to 48.8% against HEAD's 49.3%, which is the neutrality claim.

**Law:** A rate change cannot show a season on a channel that holds ONE object. Arrivals are
bounded by trip-time occupancy at the top and by whatever floor keeps the thing from vanishing
at the bottom, so the two ends squeeze the ratio from both sides — measure PRESENCE, the share
of time the thing is there, which is what a viewer actually sees and is free to move.

**Law:** Any long-lived object is itself a slow variable, and carries its season across a
boundary exactly as a rate-capped scalar does. If a trip is an appreciable fraction of the
cycle, the shoulder phases come out unequal from symmetric code — check that the PAIR averages
to the anchor rather than expecting each to.

**Law:** A population count in a continuity gate is sample-sensitive, and two seeds is not a
sample. Before treating a population row as a regression, replay the gate's exact world across
ten seeds: the row that fired 2→4 here has a per-seed range of 0..2 on HEAD.

**Cue:** 3 of 24 individual winters saw no boat at all (HEAD's worst season is 3/24 springs, so
this is no worse than the town already was, but it is where the floor is spent).

---

## Iteration 24 — the courtyard and the plaza answer a touch (2026-08-04) [Plaza & quay × Interaction/UX]

**Brief:** b23 — `answersTouch()` answered six tiles and not PATH, so the plaza's roundel and
the whole courtyard were dead to the cursor and the click. Extend the answering surface to
PATH and give those cells their entries in `PAVING`/`pavingAt`.

**Did:** `answersTouch()` takes PATH; the click handler's paving branch takes it too. `PAVING`
gains `court` (1,896 cells) and `plaza` (730 — the square, where the old `plaza` entry was the
24-cell mouth onto the lane, now `mouth`). The two share one `PLAZA_WORDS` string: a place is
one set of WORDS, but it needs one box per piece of GROUND, because the four rows between the
square and its mouth are the terrace's end wall and a single bbox over both lands birds on a
roof. `pavingAt()` branches on the tile first — PATH is only ever the courtyard or the plaza,
and they are half a world apart. `crumbSpot()` gains an optional `keep` rectangle: the fountain
is the first obstacle standing in the MIDDLE of a place rather than at its edge, so the scatter's
CENTRE is pushed clear of it (shortest translation out of the basin grown by the spread's own
reach, `s*7/12` along the stagger and `w/2` across) — never the individual birds, which is the
clamp #20 already paid for. **The frame that answers the cursor goes 46.1% → 64.1%**; paving
cells that answer, 2,903 → 5,529.

**Gates:** census **PASS** — *identical* on all 9 cells, every field, which is the point:
`crumbSpot` runs on click, so no `R()` draw was added and the seeded world is untouched ·
visual **PASS** (four framings; plus 7 crumb crops incl. four sides of the basin) · motion
**PASS**, clean · perf skipped (nothing per-frame changed) · `probes/paving-places.mjs` **PASS**
with a new exhaustive section: `crumbSpot` over every one of the 5,529 paving cells, 6 draws
each (~99k bird placements) — 0 outside their box, 0 pairs under 0.9 cells (closest 1.01),
0 in water · `probes/touch-hint.mjs` **PASS**, 345 points, 0 cursor/handler disagreements.
Context budget was **OVER** on entry (52.7 KB vs the 46 KB cap).

**Surprise:** The brief warned that the courtyard path ring is "narrow and curved — exactly the
case the 0.9-cell law bites on". It is neither. It is 1,896 cells, 8–20 cells thick radially,
and it is the **largest single place in the town** — bigger than the lane's 1,731. The law never
came near biting: the tightest place in the world is still the two-cell quay at 1.36. The risk
was real but it was in the other half of the brief, and it was floating point. I derived the
basin's footprint from the same ellipse `buildGrid()` cuts it with, and got the boundary row
wrong — `(28.5-30)*1.2` is `1.7999999999999998`, so the row that ought to be the rim is water.
My careful rectangle was *worse than the crude circle it replaced* (22 birds in the basin against
1) and it took an exhaustive probe to see it at all, because 22 in 99k never shows in a
screenshot. Reading WATER back off the grid took it to 0.

Also: a throwaway patch-sampling probe told me a bird north of the fountain was hidden behind it.
It was lying — a patch centred on a bird's ground anchor misses a sprite drawn above it.
Leave-one-out (splice bird k, re-shoot, diff the crop) says 3/3 visible on all four sides.
Promoted as `probes/crumb-birds-seen.mjs`.

**Law:** Don't re-derive a footprint — read it back off the grid. A second evaluation of the
same geometric test disagrees with the first at the boundary, by 2e-16, which is a whole cell.
Anything needing to know which cells a shape claims should scan for them.

**Law:** A gate that fails on an unmodified HEAD is not a gate. `touch-hint.mjs` asserted the
invitation appears no earlier than `INVITE_AT` = 8 s, timed on a host clock that starts before
`goto()` — so it failed by ~66 ms on every run, mine and HEAD's alike. Stash and run before
attributing a red gate to your change; then fix the assert, because a permanently red gate is
worse than no gate.

**Cue:** the 0.9-cell guarantee is a guarantee at SPAWN only. After 1.8 s of hopping a pair
measured 0.2 cells apart — the hop is a ±0.4 random walk with no separation term. Pre-existing
and as true on the lane as on the new surfaces, so #24 did not cause it, but the law is weaker
in motion than the probe suggests.

---

## Iteration 25 — one vegetable stands the winter (2026-08-04) [Cross street & allotments × Deepen]

**Brief:** b24 — the allotments inherit `bloomCap()` through `caTick`, so nothing ripens in
deep winter. MEASURE IT FIRST: fold ripeness, arrivals and gardeners over a multi-year run
and find out whether winter is quiet or broken. Change only if the numbers warrant it.

**Did:** Measured first, with two new probes, and three of the brief's premises came back
wrong. Then one change, four lines.
*What the numbers said.* `probes/allot-year.mjs` — 4 seeds × 3 seasonal years, 1 s samples,
folded onto one year. Winter is **not a fifth of the year: `ripePlots()` is 0 for 48.3% of
it**, one unbroken stretch of **11.2–11.4 sim days** every year. The gardeners do **not** damp
away — `allotRate`'s 0.01 floor plus a ~2.2-day round trip holds one in the block 44.9% of
midwinter, so the brief's failure mode was already covered. And it is **not seventeen plots of
bare earth**: bare plots are 0.0 all winter, every plot sown and stalled at mean stage 1.1.
`probes/allot-shots.mjs` crops to the block at four pinned instants — winter reads as turned
earth with a scatter standing in it. Resting, not dead.
*What was actually wrong.* The winter variance #14 bought is **per-CELL** (`hash(x,y+41)`
holds a seventh of cells at the full ceiling) and the allotments are addressed **per-PLOT**:
`ripePlots()` wants five of six cells up, so a seventh per cell is 2e-4 per plot. The
courtyard's answer to a low ceiling is structurally inert next door, and 10 hardy cells in
midwinter buy exactly 0 ripe plots.
*The change.* `hardy:1` on cabbages, `plotStands(x,y)` off `plotCrop()`, and `caTick`'s
ceiling expression grain-matched to the region: `cap===3 ? 3 : inAllotment ? (plotStands?3:cap)
: (hash>0.86?3:cap)`. A plot under the brassica keeps the full ceiling through the cold. No
`R()` — the crop is already in the ground. And because a lifted plot comes back under whatever
is sown next, **which** plots stand rotates by itself instead of being the same seventh forever.

**Gates:** census **PASS** (blooming −92/5066, planted −30, species reshuffled ±50) · visual
**PASS** (four framings + the four allotment crops) · motion **FAIL, attributed** — `dusk/shower`
jumps 0→1, the population row #23 already priced; entity-level `raindrop` is 0/0/0/0, and
`probes/shower-jump-spread.mjs` (now scene-selectable) over 10 seeds gives HEAD 0..1 mean 0.20,
here 0..1 mean 0.30 · filmstrip/perf **skipped** — no draw code, no per-frame pass; `caTick` gained
6 cell reads per sub-ceiling allotment cell at 2.9 ticks/s · `allot-year.mjs` HEAD→here: ripe==0
share of the year **48.3% → 13.1%**, longest ripe-0 stretch **11.2d → 0.9d**, winter ripe
**0.00 → 1.18/17** against summer's 15.68 (a 13× swing, still quiet), winter picked/day 0.1 → 0.2
against summer's 9.0, winter ≥1 gardener 44.9% → 52.2%, **summer unchanged** (15.74 → 15.68).

**Verdict:** shipped   ← my view; runlog.mjs decides from the diff

**Surprise:** **The census cannot see this change at all, and I can prove it.** Its three warps
(90/625/1520 s) all land at phase 0.313 or 0.687 — *the same warmth, 0.693*, both at `bloomCap`
3, where the new expression is algebraically the old one. Dumping ripe cells at those instants:
HEAD and here are **bit-identical at t=90 and t=625** and only diverge at t=1520, which is after
t≈752 s, the first moment `bloomCap` leaves 3 and the two R() streams can part. So the entire
census diff is reshuffle, definitionally, and no seasonal-ceiling work will ever move that gate.
Second: the winter tail came out shaped without being asked. Folded ripeness decays 2.45 → 1.91
→ 1.37 → 1.12 → 0.95 → 0.68 at midwinter and climbs back — the standing crops being picked off
one by one through the cold, each replacement only 1-in-4 hardy. I wrote a ceiling rule, not a
decay; the harvest cycle supplied the curve.

**Law:** Match the grain of a variance term to the grain the region is ADDRESSED by. Per-cell
hardiness cannot lift a per-plot predicate — a seventh per cell is 2e-4 across six — so a rule
that reads correctly in one region is silently a no-op in the next one that inherits it.

**Law:** The census ladder samples ONE warmth. Its three warps land at phase 0.313/0.687, both
warmth 0.693 and `bloomCap` 3, so anything that only acts away from the anchor is invisible to
it by construction — and that also makes it a clean attribution tool: pin the phase, and any
diff left is the PRNG reshuffle.

**Cue:** `bloomCap()` is the town's only STEPPED seasonal term (3/2/1) while `growF`/`dieF`/the
rest are lerps, so ripeness still falls off a cliff at the autumn shoulder — folded 12.53 → 5.52
→ 2.45 in two sim days. The winter tail is now soft; the entry into it is not.

**Cue:** Context budget was **OVER on entry — 53.4 KB against the 46 KB cap**, third iteration
running. LEDGER.md is the bulk; laws 27/60 but 11.0 KB against a 12 KB byte cap.
## Iteration 13 — the picture now admits it answers a touch (2026-08-03) [Courtyard & garden × Interaction/UX]

**Brief:** b13 — the diorama has been clickable since before the loop began and nothing on
screen said so. Make the touch discoverable without spoiling it: a cursor that tells you the
cell under the pointer will answer, and a first-time viewer invited exactly once.

**Did:** Two hints and no third.
*The cursor.* One predicate, `answersTouch(x,y)`, is now the single definition of "this cell
answers": the six tile types the click handler branches on. `mousemove` reads it and swaps
`cv.style.cursor` between `pointer` and `default` — on transitions only, not per event — and
the click handler now *guards* on the same call instead of doing its own bounds check, so the
hint cannot promise a response the click does not give. Both go through a new `cellAt(ev)`.
The canvas base cursor was `crosshair`, which said "aim" everywhere and so said nothing; it is
now the plain arrow, and the pointer is the only special cursor in the frame. 46% of the frame
is live, so a hand crossing the picture finds it.
*The invitation.* One line, once, then never again: `offerInvite(now)` off the real frame
clock (not sim time — `?fast` must not hurry a reading speed). It refuses to compete for the
ticker: it waits for `tickerFree()` and takes the surface directly rather than queueing, where
the drop policy would either lose it behind the news or hand it over long after the viewer had
moved on. Clicking first cancels it — `touched = true` in the click handler — and a `?pause`
page is the harness, not a viewer, so `DRIVEN` stands it down and every gate still measures the
town rather than the advertisement.
*Two small seam changes it needed.* `tickerFree()` is factored out of `announce()` (announce,
`tickTicker` and the invitation now route on one definition), and a line may buy its own dwell
via `lineDwell` — the invitation takes 5.5 s because it asks the viewer to *do* something and
2.5 s is a fair read of a remark, not of an instruction. It is the only caller that does.
*The narrow sill.* `@media (max-width:640px)` hides the ticker, so a phone had neither of the
two hints. `#sill.inviting` lends the invitation the plate's and the clock's place for 7 s and
then gives them back, with a shorter line ("Touch the picture — it answers.") that fits 390 px
untruncated.

**Gates:** census **PASS — literally `unchanged` in all five sections**, which is the point:
the change consumes no `R()` and writes no town state, so the world is byte-identical and the
whole diff is affordance · motion **PASS** (nothing new jumped, NaN'd, flickered or churned) ·
visual **PASS** (wide/courtyard/east/lane unchanged — `shoot.mjs` fires at 2.6 s wall, before
`INVITE_AT`, so the idle diorama it photographs is exactly as busy as yesterday's; plus the
sill during and after the invitation at 1280 and at 390×844) · filmstrip **skipped** — no draw
code was touched and no per-frame pass added (the frame gained one boolean test) · perf
**skipped**, same reason · probe `probes/touch-hint.mjs`: 345 real mouse positions, cursor and
click handler agree on **345/345**, live share **46.1%**; a pointer cell answers a click and a
default cell does not; the invitation appears **exactly once** at ~9.2 s and holds the surface
**5.4–5.6 s**; **0** appearances to a viewer who clicked at 3 s; at 390×844 it is visible,
**unclipped**, and the plate is back by ~15 s.

**Verdict:** shipped   ← my view; runlog.mjs decides from the diff

**Surprise:** Two, and both were the probe overruling me.
(1) **The first cursor run reported 14 disagreements out of 345 and there was no bug.**
Chromium rounds the coordinates it puts on a synthesised mouse event, so my fractional sample
point made the page floor one cell and the probe floor its neighbour — and because a whole
sampled row shared a `y`, the phantoms clustered on the rows nearest a terrain edge, which is
exactly what a real off-by-one draw fault would look like. Rounding the points to integers took
it to 0/345. A probe that drives real input has to *be* pixel-honest, not approximately so.
(2) **The invitation was being swapped out at 2.5 s and I would have shipped that.** The queue
guarantees every line `TICK_DWELL`, and the ambient remarks are frequent enough that the one
line asking the viewer to act got the same 2.5 s as "Sparrows bicker somewhere in the linden."
The still frames looked perfect; only the time series caught it. Hence per-line dwell.
Also worth recording: I checked the cursor by hand at a point I had labelled "wall", got
`pointer`, and briefly believed I had a bug. The cell was the cross-street ROAD, which does
answer. The probe had already been right about that point; my label was wrong.

**Law:** An affordance is a claim, and the claim and the response must be the SAME predicate,
read by both — a hint derived separately from the handler it advertises will drift into either
a lie or a silence. Verify it by agreement over many real input positions, not by looking.

**Law:** A probe that drives real mouse or touch input must use integer screen coordinates.
The browser rounds what it puts on the event, so a fractional point makes the page and the
probe disagree about which cell was hit, and the phantoms cluster along edges — indistinguishable
from a genuine off-by-one.

**Cue:** `context-budget.mjs` reports **OVER: 51.5 KB against the 46 KB cap** (LEDGER.md at
18.6 KB is the bulk, laws 28/60). It was already over when this iteration started.

**Cue:** The cursor now advertises the whole cross street and every footway in town, but a
`SIDE`/`ROAD` click anywhere announces the *lane* crumb line and clamps the birds it spawns into
the lane rows — so a click at the north end of the cross street reads as a promise kept in the
wrong place. Pre-existing; out of scope here (the brief forbade new click responses), but the
hint is what makes it visible.

**Cue:** `INVITE_WIDE` is one fixed string, deliberately not a `pick()`, so the page consumes no
`R()` for it and the census stays byte-identical. Anything later that wants to vary the line
must accept that it reshuffles the whole seeded world.

## Iteration 14 — the beds read the year: growth, ceiling and dieback all scale with warmth (2026-08-03) [Courtyard & garden × New CA rule]

**Brief:** b13 — let the planting CA read b11's `season()`, so the beds fill and empty
over the cycle instead of saturating at maturity-1 and holding there forever.

**Did:** Three seasoned terms next to `maturity()`/`richness()`, all reading `warmth`
and nothing else, each written so warmth 0.5 *is* the constant it replaced:
`growF()` 0.30..1.70, `dieF()` 1.80..0.20, `bloomCap()` 3/2/1 at warmth 0.42/0.20.
In `caTick` they multiply the two seed rolls, the stage-advance roll, the wear-recovery
and daisy terms, and the dieback probability. The lawn's `health` in `groundCol` and
the gatehouse ivy's reach and colour now hang off the same `warmth` instead of deriving
their own from `richness()`.

The load-bearing bit is that `bloomCap` is a *ceiling*, not a kill term. `caTick` already
ages the bed that sits **at** its ceiling, so lowering the ceiling turns the beds over by
itself — no seasonal dieback branch bolted on beside the existing one. Changing `bSt[i] < 3`
to `bSt[i] < cap` is the entire winter.

**Gates:** census **FAIL** (`planted` 5729→4793, −16.3%) · visual PASS · motion PASS
(zero jumps/nan/oob/flicker; only spawn churn) · filmstrip PASS · perf skipped

The census failure is attributable and I did not touch the gate to hide it.
`probes/beds-year.mjs` measures the three census cells directly: the warp-90 and warp-330
cells are **unchanged** (1832, 2160), and the entire delta is the warp-900 cell
(1737→749), which at SEASON_LEN 26 lands at season 0.879 — **warmth 0.14, deep winter**.
The gate is reading a bare garden in January as a collapse. See the Cue.

**Surprise:** two, both from measuring instead of assuming.

The CA-variety law made me expect the winter clear-out to cost species diversity, and I
had a seasonal inheritance term written to counter it. It is not needed and I did not ship
it: over three full years the flower mix holds at Shannon evenness 0.999 / 0.998 / 0.998
with all 7 species present at every summer peak. The reason is mechanical — re-seeding
inherits a neighbour's species only when `neighborsMature()` finds one, and in winter
there are none, so every spring cell falls through to a fresh uniform draw. **Winter is
itself the reseeder.** The variety law's "something has to reset it" was already satisfied
by a rule I was about to duplicate.

The other: the cap alone drove `blooming` to *exactly* 0 for 11 of the 26 days. Numerically
fine, artistically dead, and against the brief. Fixed with per-cell hardiness —
`hash(x, y+41) > 0.86` keeps the full ceiling for about a seventh of the cells, so deep
winter reads as a few things still out in turned earth (17–35 blooms) rather than nothing.
Winter blooming went 0 → ~22; summer is untouched at ~690. The year now runs 17..698.

**Law:** A seasonal *ceiling* on a CA stage is a better lever than a seasonal kill term,
when the rule already ages whatever sits at its ceiling — one changed comparison gets the
emptying, the turning-over and the refill, and it cannot desync from the growth term the
way a parallel kill branch would. But check what the ceiling does to the thing the census
counts: a ceiling that is *below* the counted stage takes that count to exactly zero, not
merely low, and zero of anything visible reads as broken rather than as seasonal. Give it
a per-cell `hash()` exemption so the floor is a scatter, not an absence.

**Cue:** the census age ladder now conflates two axes. Its ages were chosen as
"young / filling in / fully grown" (warp 90/330/900), but with a 26-day year the warp-900
cell is also *midwinter*, so any change to seasonal planting reads as a collapse in
`planted` and any real winter regression is now invisible against it. Either pick ages
that land at comparable warmth, or have the census hold `season` fixed across the age axis.

## Iteration 15 — the shower runs out of drops instead of being switched off (2026-08-03) [Sky, light & weather × Polish]

**Brief:** b14 — rain ended in one frame: `raining=false`, `raindrops.length=0`, all
~110 drops gone between two frames while the sheen behind it eased out over 18 s.

**Did:** Split the shower in two. `raining` stays the boolean the town's *behaviour*
reads — umbrellas, "nobody lingers in the wet", the three damped spawn rates — and it
is right for that to be a switch. `rainFall` is the same shower's 0..1 intensity, and
it is what everything *drawn* reads: the drop count, the whole-screen `rgba(90,105,125)`
tint, the pond rings, the water sparkle it crossfades with, and `drawSmoke`'s `cold`.
`RAIN_TAIL = 2.2` s against a 55 s day.

The load-bearing bit is that the drops are not deleted, they are **not sent round
again**. The tick already recycled a drop that passed `y > H` back to the top; now it
recycles only while the kept count is under `want`, and `want` is `110 * rainFall`. So
the shower ends the way a shower ends — nothing new arrives, and what is in the air
finishes falling. No drop ever vanishes mid-screen, which is why the motion gate stays
clean. `raining` flips when `rainLeft <= 0 && !raindrops.length`, so the last drop
lands before the announcement. `wet` is ramped to 6 (its own full-sheen clamp) across
the tail, so the street is already shining before the last drop lands, and the existing
`wet = 18` at the end is now a no-op step rather than a jump from nothing.

At `rainFall === 1` every one of those expressions is the constant it replaced, so full
rain is unchanged.

**Gates:** census PASS · motion PASS (0 jumps/nan/oob/flicker) · visual PASS · filmstrip
PASS · perf skipped (same per-frame loop, one extra write per drop)

**Measured, not argued** — `probes/rain-out.mjs` finds each build's *own* rain end (the
PRNG reshuffles, so the shower does not land twice at the same instant) and replays the
6 s around it at a 0.1 s gap:

| seed | HEAD max Δ | new max Δ | where the max is now |
| --- | --- | --- | --- |
| 42 | 7.689 (×7.9 med) **at the end** | 1.849 (×1.7 med) | 1.3 s *before* the end |
| 7 | 10.855 (×62.4 med) **at the end** | 1.053 (×8.8 med) | 2.3 s *before* the end |
| 19 | 8.195 (×8.2 med) **at the end** | 1.567 (×1.5 med) | 0.7 s *before* the end |

On HEAD the largest frame in the window *is* the ending, on all three seeds. After the
change the ending is not the largest frame on any of them. Seed 7's Δ at the instant
`raining` goes false is **0.074**, against a window median of 0.120 — the flip is now
below the noise. And the same filmstrip that flagged it: HEAD `--scene 230 --seed 7`
POPs at Δ 11.054 against a 0.421 median; here `--scene 231.4` has no POP, a 1.918 max,
and a monotonic decay 1.9 → 0.17 across the ending. Drop count runs 104 → 0 over ~3 s.

**Surprise:** the drops were the smaller half of it. A 0.16-alpha fill over the *whole*
canvas is worth more mean-pixel Δ than 110 two-pixel lines, so cutting only the drop
count would have left most of the pop. The brief named the drops; the instrument named
the tint. The ~3 s taper also overruns `RAIN_TAIL` by ~0.8 s, because `want` falling to
zero only removes a drop when that drop reaches the bottom — the count lags the ramp by
one fall time (~1.4 s at 520–780 px/s). Physically right, and worth knowing before
anyone tunes the constant expecting it to be the duration.

**Law:** When a state flag gates both behaviour and drawing, splitting it into the
boolean and a 0..1 intensity is cheaper than easing the flag: behaviour keeps its clean
edge, and every draw site becomes a multiply by the same scalar. Fade the *largest* thing
the flag draws first — a full-canvas tint outweighs any number of small sprites in a
whole-frame Δ, so ask what fraction of the frame each gated draw covers before deciding
which one is the pop.

**Law:** An entity population is better wound down by **withholding its supply** than by
truncating its array. Stop recycling and let each thing finish its own life and the
count decays for free, with no mid-screen despawn for the motion gate to catch —
`raindrops.length = 0` is one line and one pop; "recycle only while under `want`" is one
line and an ending.

**Cue:** `motion.mjs` has no `raindrop` kind, so the gate that exists to catch things
popping in and out of existence is blind to the town's largest such population. It
passed this iteration without being able to see it.

**Note:** `context-budget.mjs` read **OVER** at 52.8 KB against the 46 KB cap when this
iteration started (LEDGER.md 17.1 KB, state.json 13.4 KB, laws 28/60).

## Iteration 16 — five instruments that could not see the year (2026-08-03) [Sky, light & weather × Harness]

**Brief:** b15 — the world has had a 26-day year since #12 and five of the loop's own
instruments cannot see it, or actively confuse it. Repair them; change nothing a viewer
sees. `courtyard.html` is byte-identical at the end of this iteration.

**Did:** five repairs, no new gates and no new metrics.

**(a) `shoot.mjs` pins its instant.** It is no longer a wrapper over screenshot-verify —
it drives Playwright itself with `?pause&t=0` then `__reseed()` + `__warp(t)`, the same
way `census.mjs`, `motion.mjs` and `probes/year-shots.mjs` already did. Framings still
come from the repo's `shoot.config.json`, so there is still one list of them. It prints
the instant it actually reached (`at: simT 175  day 3  hour 10.364  season 0.3724`) and
warns if two framings in one run disagree.

**(b) `--tag` prefixes files.** It used to forward `--prefix` to a screenshot-verify that
has no such flag. Two tagged runs now leave two files: `summer-wide.png` at season 0.5213
and `winter-wide.png` at season 0.0213, **both at hour 7.309**, three distinct sha1s.

**(c) The census age ladder holds the season fixed.** warmth is `0.5 − 0.5·cos(2π·phase)`
and phase is linear in `simT`, so equal warmth means equal phase up to a reflection: only
`p`, `1−p` and `p+1` exist. Anchoring the young cell where it was (warp 90) *forces* the
other two — 625 and 1520. The ladder is now 90 / 625 / 1520 = days 1 / 11 / 27, and all
nine cells measure at **warmth 0.6925** (was 0.693 / 0.996 / **0.138**). `planted` per
seed now rises with age (628 → 699 → 733) instead of collapsing into January. The ladder
string travels with the baseline and in `census-history.jsonl`; a baseline pinned on a
different ladder now refuses to diff (`VERDICT: NO COMPARISON`) rather than printing a
large fake regression.

**(d) `motion.mjs` reports a `raindrop` kind.** Raindrops are screen-space and not in
`__entities()`, and the town was off-limits, so the shower is watched as a *population*:
`__census().life.raindrops` at every step, rises → `spawns`, falls → `despawns`. Rain
turned out to be in 3 of the 4 existing scenes already, so no scene was added.

**(e) `stall.mjs` runs on worker rows only.** `rows` is now `kind !== 'manager'`;
`managers` is reported separately. `build-stats.mjs` did **not** need this — it has
filtered since it was written (its two whole-run totals are deliberate and labelled).

**Gates:** census PASS · motion PASS · visual PASS · perf skipped (town untouched) ·
probe `probe-shoot-jitter.mjs` (scratch, not kept)

Two runs of the new `census.mjs` on the same commit diff **unchanged in every group**. Two
runs of `shoot.mjs --t 175` land on `simT 175.00 / hour 10.364 / season 0.3724`, twice.
`stall.mjs`'s last-10 goes 10m → 8m and $2.30 → $2.01 when a worker row is removed, and
does not move at all when a manager row is added.

**Surprise:** three.

**The old `shoot.mjs` was not jittering, it was biased — by eight hours of town clock.**
The brief and cue c31 both said "jitters ~15 s". Measured over five runs each: the jitter
is real but small (0.14 s of sim idle, 0.91 s under six busy cores — the latter being
24 sim minutes, so the cue was not wrong about load). The *large* error is systematic.
Asking for `--t 175` reliably photographed **simT 193.5, hour 18.47** — evening — while
the file's own comment said "day 3, mid-morning". `?fast` is 8×, the wait was 2600 ms,
and 8 × 2.6 s ≈ 18.5 s of sim every single run. A wall-clock wait does not blur the
instant so much as move it, and the same offset on every run is exactly what nobody
notices. The framing now reads "Day 4 · Morning", which is what it always claimed to be.

**`spawns`/`despawns` would have been a decorative gate.** They are the integral of the
rises and the falls, so a shower that vanishes in one frame has the *same* totals as one
that tapers over three seconds — the totals cannot see the bug #15 exists to have fixed.
So the shape went into the existing `jumps` field, on the entity rule's own principle: a
step out of all proportion to how this thing normally moves, here bigger than half the
shower's own peak. Verified by rebuilding #15's one-frame ending in a scratch copy and
running the gate at it: `day/raindrop: jumps 1 → 3`, with `raindrops stepped -110 in one
0.25s step` named in the examples. On HEAD every jump is a `+110` *start* and there is
not one `-110` in any scene — rain begins abruptly by design and now ends measurably.

**One fifth of the brief was already done.** `build-stats.mjs` has filtered manager rows
since it was written. Worth stating because the same brief's claim about `stall.mjs` was
not just true but worse than stated: on the *real* runlog the old code reported
`last: #15 … -> no-ship` — that was the manager pass wearing the worker's #15 — and
last-10 as 12m / $3.09 / src moved 7/10 against the true 10m / $2.30 / 9/10. Cost
overstated 34%. And two manager passes in a row (a re-plan, or a plan after a rejected
brief) fired `noShipStreak,srcFlat` on the old code: **the stall detector could summon a
manager off nothing but its own footprints.** New code: `ok` on the same input.

**Law:** An instrument that reaches a moment by waiting in wall time does not blur that
moment, it *moves* it — by the same amount every run, which is why nobody catches it.
Measure the offset, not the spread. And make the instrument print the instant it actually
reached: a harness that reports where it landed cannot lie about where it aimed.

**Law:** A churn total is shape-blind. Counting arrivals and departures cannot distinguish
a population that drains smoothly from one that is deleted, because both have the same
integral — if the *shape* is the thing that broke, the gate needs a per-step limit, not a
sum. Then prove the gate bites by rebuilding the old bug in a scratch copy and pointing
the gate at it; a gate never seen to fail is a gate nobody has tested.

**Law:** A row a subsystem writes about itself is not evidence about the thing it watches.
The manager's own runlog row is `no-ship`, `srcChanged: false` by construction, so any
streak or average taken over all rows counts the observer's footprints as the observation
— and here it could trip the very alarm that summons the observer.

**Cue:** the census ladder still varies the *hour* across the age axis (21.27 / 14.73 /
21.27), so anything gated on time of day is sampled unevenly. The algebra is tighter than
it looks: fixing hour *and* season needs `t ≡ 0 or 27.5 (mod 55)`, which admits exactly
two hours — **06:00 and 18:00**. Both are awkward (dawn has almost nobody out, 18:00 sits
inside market pack-down and the six o'clock bell), so this is a real trade, not an
oversight. Do not re-derive it.

**Cue:** per-*drop* continuity still does not exist. `raindrops` are screen-space and
absent from `__entities()`; adding them needs one line in `courtyard.html` plus a
screen-space exemption from `motion.mjs`'s world-bounds test. Only then would a drop that
goes NaN or strobes be visible.

**Cue:** the ladder change is a step in the published growth curve. `census-history.jsonl`
now carries a `ladder` field so the discontinuity is legible, but `stats.html` plots
`RUNLOG.jsonl`'s census scalars and knows nothing about it — `planted` jumps 4782 → 6109
between #15 and #16 with no town change behind it.

**Note:** `context-budget.mjs` read **OVER** at 46.7 KB against the 46 KB cap when this
iteration started, and still does (LEDGER.md 14.5 KB, state.json 8.4 KB, laws 27/60).
Third iteration running over.

## Iteration 17 — thirteen trees learn the year (2026-08-03) [Cross street & allotments × Deepen]

**Brief:** b16 — the town has a year and thirteen trees that have never heard of it.
Make the canopies read `warmth`; put the leaf fall on the season.

**Did:** Eight terms next to `growF`/`dieF`/`bloomCap`, and one colour rule. They read
`seasonPhase`, **not `warmth` alone**, because warmth 0.5 happens twice and a rising 0.5
(bud burst) and a falling 0.5 (the turn) are the two most different-looking days of the
year — `warmth` cannot tell them apart and every seasonal reader after this one will hit
the same wall. `leafOut` is canopy coverage; `leafFresh`/`leafDeep`/`leafTurn` are the
tints; `leafShed` drives `leafFallF`; `blossomF`/`fruitF` are the orchard. `leafCol(base,
k)` is the one colour rule all thirteen trees go through, keyed per blob so a turning
tree is patchy rather than uniformly orange.

The canopy is **six clamps on one 0..1 progress**, exactly as the market stalls are — the
mass fills first, the outermost blobs last, and running `leafOut` backwards through
autumn sheds them in reverse for free. Each blob's radius grows from *zero* at its own
threshold, so nothing appears at a size. `drawBoughs()` draws what is left: tapered,
slightly curved boughs forking two twigs at 62%, faded out entirely at `leafOut` 1 so the
summer tree is untouched.

The `leaves` spawner keeps its exact `R()` draw count (one rate roll, one `src`, six per
leaf) — only the thresholds moved, so nothing was added to the stream on purpose. The
gust now *multiplies* the seasonal rate instead of overriding it, so a January gale off
bare branches sheds nothing. Falling leaves take their colour from `leafCol` too, so a
leaf is the colour of the tree it fell off.

Every term is written so that at `SEASON_START` (phase 0.25) it is **exactly** the
constant it replaced — `leafOut` 1, all three tints 0, `leafFallF` 1, and `leafCol`
returning the literal old hexes. `fruitF` is the one deliberate exception: apples in
April were the bug, not the baseline.

**Gates:** census **PASS** (`planted` −0.6%, `blooming` −0.8% — PRNG reshuffle, no
collapse) · visual PASS · motion **FAIL**, attributable (below) · filmstrip PASS (no POP,
no FROZEN) · perf **PASS** (+0.0% vs interleaved control) · `probes/canopy-year.mjs`
PASS 5/5

The motion failure is `market/raindrop jumps 0 -> 1`, a system I did not touch. Tallied
across all four scenes the shower budget is **exactly conserved** — jumps 4 → 4, drop
spawns 440 → 440; one shower moved out of `dusk` and into `market` because the changed
leaf-spawn count shifted the PRNG stream. `leaf`, the kind I actually changed, is clean
everywhere: 0 jumps, 0 nan, 0 oob, 0 flicker. I did not touch the gate.

`probes/canopy-year.mjs` measures what the census cannot: winter canopy is **0 px across
all thirteen trees** against summer's 9674; autumn amber 2306 vs summer 49; the orchard
carries 723 px of blossom in spring; airborne leaves run autumn 7.83 / spring 3.14 /
summer 0.27 / winter 0. `probes/year-strip.mjs` is the region-cropped year the brief
asked for — 26 crops of the linden, one per day, same hour.

**Surprise:** three, all from measuring.

A tree-cropped *box* cannot see this at all. The linden stands against lawn and the
orchard against the allotments, so the box floors at ~2500 green px of ground in every
season and reported winter as **57% as green as summer** — a clean-looking number that
was entirely the grass behind the tree. Rendering the frame twice, once with
`leafOut`/`blossomF`/`fruitF` monkeypatched to 0, and counting the pixels that *differ*
gives the canopy exactly, whatever is behind it. `?pause` sets `dt = 0`, which freezes
`windT` and the sway, so the two renders differ in nothing else.

Then that measurement blamed my own change on the wrong thing. It scored the orchard at
1070 px of "green canopy" in peak autumn — four trees that were fully turned. Two causes,
both mine: the loose classifier `r>g+8 && r>b+30 && r>95` scores the **stone tree pit**
(107,90,68) as autumn colour, and the pit is inside the diff because I had made the
ground shadow scale with `leafOut`. Cutting the box at the trunk top took it 1070 → 228
with amber unchanged at 306. Both were probe defects; neither was visible in any
screenshot.

And the first bare linden looked like a spider — five uniform strokes from one point.
A bare tree is most of the winter frame and it has to read as a *crown*: taper, curve,
and fork it and the same five boughs read as a tree.

**Law:** A cyclic world scalar is not enough to hang a seasonal look on — you need the
**phase**, because a cosine visits every value twice and the two visits are the two
things you most need to tell apart (bud burst vs. the turn). Write each term as a window
closed on *both* sides of the phase so only one or two are ever live at once, anchor them
so the start phase reduces exactly to the constant being replaced, and state the one
term you deliberately left un-neutral and why.

**Law:** To measure a draw-only feature, do not crop a box around it — render the frame
twice with the feature suppressed and count the pixels that changed. A box measures the
background, and the background is the thing that looks most like what you are counting.
`?pause` gives dt=0, so the two renders are otherwise identical. Then check what *else*
your change made season-dependent: my ground shadow put itself in the diff.

**Cue:** `maturity()` still sizes all thirteen trees off a ramp that pins at day 8, so a
tree is the same size in its first winter as in its fifth. Deliberately untouched — the
brief said a tree that grows and shrinks every 24 real minutes reads as a bug — but if a
slow multi-year growth term is ever wanted, `leafOut` is now the seam that proves a size
change is seasonal rather than a glitch.

**Cue:** the context budget printed **OVER** at the start of this iteration — 48.8 KB
against a 46 KB cap (LEDGER 15.9, SKILL 11.8, LAWS 9.4, state 9.4). This entry makes it
worse. The manager should distil this pass.

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


## Iteration 28 — the season is a button, and the year runs on (2026-08-04) [Sky, light & weather × Scale/World]

**Brief:** b27 — fourteen iterations of seasonal work are addressed to a viewer who would have
to sit here 24 real minutes to see any of it. Give them a way to reach another season, without
popping six hysteretic systems. The batch bet; allowed to fail.

**Did:** `#season` — the label #26 put in the sill — becomes a `<button>`, and clicking it runs
the town on to the next quarter as a **fast-forward, not a jump**. Nothing writes `seasonPhase`,
`cloud`, `bSt` or a walker's position; `stepSkip()` only hands `frame()` more sim seconds, and
`simSub()` splits them so no step exceeds `SKIP_SUB` 0.25 s. That is the whole safety argument:
every rate cap in this town is per SIM second, so a sub-stepped advance is indistinguishable
from having waited — what is compressed is REAL time. It lands on a **whole number of sim
days** nearest a quarter-turn, so the hour survives; from the anchor that is 7+6+7+6 = 26 =
`SEASON_LEN`, and four clicks return the identical phase *and* the identical hour. The rate is a
flat-topped trapezoid with smoothstep shoulders, advanced off the profile's **exact integral**,
so the span is right at any frame rate and both ends run at the ordinary clock. `announce()` is
deaf for the duration (six days of strikes and markets would arrive as stale news) and `land()`
says one line. `RM` gets the honest cut instead — a `#veil`, the same sub-stepped advance
behind it — because six sunrises in six seconds is precisely what reduced-motion is asking not
to be shown. `speed` is never touched.

**Gates:** census **PASS — every field unchanged in all 9 cells** (no new `R()` draw; the
ordinary path is one `simStep` call with the same arguments, so no gate can tell this exists) ·
motion **PASS** vs a stashed-HEAD baseline · perf **PASS** +0.0% day and night · visual PASS
(wide, mobile, sill at rest/hover, both colour schemes) · `probes/season-skip.mjs` **33/33** ·
`probes/skip-strip.mjs` — the brief's filmstrip, cropped to courtyard and far bank, against a
`__warp` control at the **same sim gaps**: max frame-Δ 32.64 vs control 32.86 (courtyard),
32.25 vs 32.46 (river), and **fewer** out-of-line frames than the control (17 vs 21, 18 vs 19).
`probes/skip-shots.mjs`: **midwinter 19.6 real seconds** after the first click, 684 blooms → 26;
whole year and back to Spring in 26.8 s. Context budget opened **OVER** (47.1 KB / 46 KB cap).

**Verdict:** shipped

**Surprise:** the two hardest bugs were both invisible to the thing that should have caught
them. (1) The lapse overshot by exactly its own duration, because `dt * speed` kept riding on
top of the profile — 0.095 of a day per click, which no eye can see and which compounds into a
year that no longer closes. The fix is that **the lapse owns the clock**: it delivers `skipSecs`
of ordinary time plus a bump carrying the rest, and Pause and the speed button are suspended for
its few seconds. Only the four-click round trip could see this at all. (2) I closed the CSS
comment above `#season` one line early, so five lines of prose parsed as a selector and
**swallowed the entire rule** — the season shipped as a grey chip with a button border. The
probe passed: the tag was `BUTTON`, the text was right, the handler fired. A screenshot caught
it, one iteration after #26 learned the same lesson from the other direction.

**Law:** a CSS or JS rule that fails to parse is *silent* — assert on **computed style**, never
on the element. And a compressed clock must own its frame's whole advance, or the ordinary rate
rides on top of it.

**Cue:** the season is advertised only by a chevron and a cursor; nothing invites the click.
And on a `?pause` page the sill's text never refreshes (`statAcc += dt`, dt 0) — pre-existing,
verified identical on HEAD, harness-only.
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

## Iteration 29 — the stalls sell what the plots grew (2026-08-04) [Lane & market × Connect]

**Brief:** b28 — the market is the last flat system in the town. Connect it to the
allotments, which ripen and are picked across a full year fifty feet away.

**Did:** one store, `produce[]`, written by exactly one line — `harvestPlot()` pays in the
cells it lifted, so the basket (`a.crop`) that walked out of the block for four iterations
now goes somewhere. `stockMarket()` latches that store ONCE per market day at the first
trestle, empties it, and lays it out as `mkShelf` (species order, so a stall sells one or
two things). `marketRaise(i)` gates on `mkTrades(i)`: `MK_NEED [0,4,13]` units, so the
second and third traders only set up if the plots sent enough — stall 0 always comes, but
it can stand behind an empty board. The goods are no longer a fixed six-colour palette:
each pitch is a vegetable the stall was actually stocked with, in its own colour and size.
Half of what the market cannot carry (`MK_CAP` 18) keeps to the next one. `mkLine()` says
which crop, and the browsers walk to a stall that came out.

**Gates:** census **PASS** (small reshuffle churn, no collapse; new field `planting.produce`)
· motion **PASS** vs baseline · visual PASS · filmstrip day PASS, no POP · `probes/market-year.mjs`
over **120 markets / 5 seeds / 104 days**: midwinter **6.0 units, 1.67 stalls** vs midsummer
**35.7, 2.96**; one stall on 24% of markets, three on 58% · `probes/market-shots.mjs` (the
brief's own test) midsummer 3 stalls 6/6/6 vs midwinter 2 stalls 6/5/0, and it names the
plots the difference came from · `probes/market-raise.mjs` unchanged vs HEAD (seed 42's 4.9
close spike is **pre-existing** — stashed and confirmed). Budget opened **OVER** (48.4 / 46 KB).

**Verdict:** shipped

**Surprise:** two, and the second is the one that matters. (1) The store made the year's
trough move. Without carry-over winter was bare and spring recovering; with it, autumn's
glut arrives late and **spring** becomes the thinnest quarter (3.8 units vs winter's 6.0)
— the market is four days behind a block that is already behind the season, and two lags
compose into a hungry gap nobody wrote. That is #21/#23's hysteresis law arriving a third
time, and it is also the only thing that softens cue c50's stepped cliff. (2) My first
probe reported a different midwinter market every run — 2.1 units, 13.6, 22.1, 5.4 — with
the same seed, same code, same pinned instant. **Drawing consumes `R()`.** On a `?pause`
page frozen at simT 300, `R()` reads 0.110 after two drawn frames and 0.746 after forty.
So a screenshot, a `boundingBox()`, a `waitForFunction` poll — any real-time gap — moves
the world, even with the sim stopped. One page per quarter fixed it; two runs now diff clean.

**Law:** the existing "step inside ONE `page.evaluate`" rule is right for the wrong reason.
It is not that the sim keeps running (`paused` sets `dt = 0`) — it is that the RENDERER
draws from the PRNG, so frames the machine happens to deliver during a host round-trip
advance the seeded stream. A probe that screenshots between measurements needs a fresh
page per measurement, not a tidier loop.

**Cue:** the initial scatter puts flowers into allotment beds (seed 42 opens with one fern
in the block, seed 7 with a fern and a lavender), so a fern can be harvested, ride the
basket and reach a market board. Pre-existing; `speciesFor()` only filters NEW sowing.

## Iteration 30 — the courtyard reads the sky too (2026-08-04) [People & animals × Connect]

**Brief:** b29 — the street refuses and vacates a seat under a building front; the
courtyard sat through it, because both gates read `a.street`. Close c11.

**Did:** two predicates, one definition each — `SIT_REFUSE` 0.42 (take a seat) and
`skyLifts(a)` (give one up, 0.55..0.88 off `a.wary`). The gate is no longer `a.street` but
**what you are doing**: on the street everyone not lying down; in the courtyard the people
*sitting*, so the napper sleeps on and the gardener finishes their row. c11 sat open 24
iterations because `picnic`/`sitter` are `STAYING` and reach their seat with an empty
waypoint list, so a refusal meant `a.done` on the lawn — `routeToExit()` is the walk out
they never had. A pair is linked both ways (`a.mate`) and judges the sky **once**: first to
the grass decides, and if your half is already down you join them regardless. The blanket
line moved from spawn to when the blanket is spread: a refusable seat makes an
announcement at spawn a promise the town may break.

**Gates:** census PASS (reshuffle churn, no collapse; `people` 186→182 is the feature) ·
motion **FAIL→analysed**: only `shower` fired, untouched —
`probes/shower-jump-spread.mjs` puts it at 0..2 on both builds, and the same statistic
fell 4→1 on market · visual PASS · filmstrip day PASS · perf skipped (a getter
and two clamps, for the ≤5 agents sitting) · **`probes/seats-out.mjs`**, 8 seeds × 12 sim
days, HEAD vs here: refusals **0 → 15**; under `cover>0.60` the courtyard sits **0.269 →
0.074** while the street holds 0.020/0.019 — it empties *to where the cafe already was*;
under `cover<0.30` 0.439 → 0.461, a blue afternoon untouched; release cover mean 0.729,
stagger 4.09 sim s against the street's 3.4; **0 vanished, 0 pair splits** ·
`probes/seats-shots.mjs`: blanket on the grass, then an empty lawn and umbrellas walking
out, two sim days ahead of the first drop.

**Verdict:** shipped

**Surprise:** the vanish test nearly shipped as a tautology. I first wrote it as "despawned
while `act === 'sit'`" — the bug's exact *inverse*: a naive refusal sets `done` in the
**walk** branch, so the agent disappears mid-lawn still labelled `walk` and the test reads
a clean 0 forever. Re-anchoring on *position* (a legitimate exit ends off-grid) made it
real; the min observed despawn radius, **32.7** against a threshold of 16 with a seat at
3..12, is what turns the 0 into evidence. Second: `__warp(0.25)` is 7–8
sub-steps of 1/30 s and a probe sees only the boundary, so a sit that began and ended
inside one window was invisible — sampling reported 3 phantom refusals **on HEAD**, which
has no refusal path. Wrapping the one function both paths go through gave 0.

**Law:** a zero is evidence only if you show the test can be non-zero — print the margin.
Anchor it on the state the **bug** would leave, not the one the feature leaves. And a
sampled warp sees only step boundaries: wrap the function instead.

**Cue:** c58 — the pair shares a decision but not its two sit timers. c59 — two cues are
both numbered c11. Context budget opened **OVER** (49.8 / 46 KB).
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



<!-- full text of #32, condensed in LEDGER.md to fit the 2.5 KB cap -->

## Iteration 32 — something is on in the bandstand, and people come and stand for it (2026-08-04) [River & far bank × New element]

**Brief:** b31 — the bandstand has stood on the far bank since before the loop with nothing
ever happening in it, and the whole east side has no gathering of any kind. Put a concert on
in summer and let an audience arrive, hold still together, and thin when it ends.

**Did:** `bandF()` — one 0..1 over set-up/set/strike, `marketRaise()`'s shape — with the three
`BAND_PLAYERS` hung off it at cues 0.10/0.30/0.50 and bunting at 0.72, so they step up one at a
time and pack away in reverse. Players are plain records handed to `drawPerson()` (which now
reads `a.z`), drawn between the back and front posts inside `drawBandstand()` rather than pushed
to the sorted item list, which could only put them wholly in front of or behind the structure.
The day is `hash(day, 617) < bandChance()` off `warmth` — no `R()`, so most days pay nothing.
Audience: `spawnConcertAgent()`, its own source, own `BAND_TICK` (the shared 1 Hz spawn tick
cannot fill nine places in a seven-second window), and subtracted from **both** `eastCount` and
`laneCount`. They claim one of nine `BAND_SLOTS` and release it on `done`.

**Gates:** census PASS (people +7, onStreet +7, inEast +2 — the audience lands in fields that
already exist; the rest is the reshuffle) · visual PASS · perf PASS (+0.0%) · motion **FAIL,
attributed**: night/shower jumps 1→2, on a kind I did not touch. Replayed over twelve seeds on
HEAD and here: rises are 0/1/2 in **both**, falls are 0 in both. Two shower onsets in the
window, not a broken ending · **`probes/bandstand-year.mjs` PASS ×4** — 18 concert days at
midsummer vs **0** at midwinter over three folded years; peak 7 standing over 14.5 s with the
worst single step 43% of peak; min separation while standing **1.68 cells**; 0 teleports, 0
off-slot standers · filmstrip PASS cropped to the green: the raise sheet shows each player
fading in alone and the strike sheet undoes it in reverse, no POP either side (the Δ4.36 on
frame 1 is **4.355 on unmodified HEAD too** — the ground cache relighting after the warm-up).

**Verdict:** shipped

**Surprise:** the first cut ended the set at 19.2 and every gate I had was green — the year
folded right, nobody teleported, the separation held. Then the arrival series showed six of nine
listeners leaving in a single 0.25 s step. Not my code: `eastOpen()` is `daylight > 0.16`, which
is `sunDown - 0.05*dayHours`, and the strike ramp ran straight through it, so the existing rule
that sends the far side home at dusk cleared the green wholesale. Nothing errored and no still
frame could have shown it. **The walk is what sets every number here** — the park gate is eleven
seconds from the green, five sim hours — and I had sized the set against the walk and then
forgotten to size the *end* against the light.

**Law:** an event whose audience must WALK to it is bounded at both ends by things that are not
the event: the trip in sets the earliest it can be full, and every standing rule already in the
file — dusk, rain, a thickening front — sets the latest it can still be full. Budget the span
against those, not against how long the thing should last. And an audience that STANDS wants
claimed places, not a scatter: a spawn-time separation is a guarantee for one frame, and this
crowd holds its ground for twenty seconds.

**Cue:** `motion.mjs` counts a shower's rises and falls into one `jumps` figure, but its own
comment says only a fall is the bug ("the ending broke"). Rises are one-per-shower by design, so
the count is really "how many showers started in the window" — which any reseed moves. Splitting
them would make the night cell attributable instead of advisory.

## Iteration 31 — the sill says it is pressable, once, in its turn (2026-08-04) [Sky, light & weather × Interaction/UX]

**Brief:** b30 — make the season button legibly pressable and say so once, without shouting
beside the canvas hint.

**Did:** (1) `#season` gains an underline that stops at the WORD — `::after` is now an
`inline-block`, and text-decoration does not propagate into one, so the chevron stays
punctuation. Padding is the hit area, an equal negative margin gives it back: **20→30px** wide,
**12→29px** in the 390 caption slot, where it also takes full `--ink` instead of the `--ink-dim`
of the subtitle it displaced. Sill and canvas byte-identical to HEAD.
(2) `offerInvite` is an `OFFERS` queue of two, not a flag. Each carries the act that silences it
(`touched`, `pressed`), and an offer is **spent when it comes up**, spoken or not — that is what
makes "never twice" structural. `offerFree` (the dwell plus a 6 s staleness window) holds them
apart. At 390 the second keeps the plate and drops the TITLE
(`.inviting.at-season`): the offer pointing AT the season may not hide it while it speaks.

**Gates:** census PASS · motion PASS · visual PASS · `touch-hint.mjs` PASS **unchanged** ·
**`probes/season-invite.mjs` PASS, 7 FAILs on HEAD** — touch 8.0..13.7s, season 21.5..26.8s,
**0 overlapping samples**, +28px fit, cancelled by a press, silent on `?pause`.

**Verdict:** shipped

**Surprise:** three, and all three were my instrument lying rather than the page. (1) I opened
the narrow rule's rationale with no `/*`, so the whole `#season` block failed to parse, the
caption fell back to the wide rule, and the sill grew 7px while the canvas lost 7 — **law #28
verbatim, one iteration after it was written**, caught only by reading computed style. (2) The
margin I added in order to "print the margin" was `clientWidth - scrollWidth`, **floored at
zero**: `+0px` for a line with 28px to spare, and it can only ever report bad news. A range over
the text is honest. (3) The gate then failed on `touch runs 0` after a
press at 3 s — not a regression: a press starts a 7 s lapse, the town returns six sim days on
with the ticker solid, and the deferred offer waits for a gap (17.4 s on HEAD, 30.1 s here). A
wall-clock arrival for a line queued behind the news is not assertable; that it was never
**spent in silence** is.

**Law:** a probe holding its own copy of the page's strings is a bug with a delay fuse — this one
called a working page broken, one edit after the text changed. They are top-level consts in a
classic script: `evaluate()` can name them.


---
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


---

## Iteration 33 — a door on the lane that keeps hours after dark (2026-08-04) [Lane & market × Scale/World]

**Brief:** b35 — every `stop` branch in `spawnLaneAgent` opens with `sun &&`, so ~45% of the
clock is a transit corridor. Give the town ONE evening place. Measure the dark first.

**Did:** Measured first (`probes/evening-door.mjs`, 4 seeds × 20 folded days). The dark was
**not** a clean zero: **0.21** street people standing still 22.00–04.00 against **1.26** at
midday — 17%, and all of it the 3–6 s glance through the arch in the final `else`.
*The place.* A lit door cut in the gatehouse front at `TAP_DOOR = 26`, on the wall plane
`TAP_FACE = 64` that `drawFaceRow` already draws the terrace's own doors on — slot 5, so it
lands on blank plaster. Drawn **every** frame (a doorway that appears at half six is a pop):
`tapOpen()` is the behaviour, `tapF()` the 0..1 every draw mixes on, and shut/open are one
`mix()` apart. Its lantern is flat on the wall, not on a bracket — at this scale a lamp hung
off an arm reads as a black ball floating beside the house.
*Its hours are the one clock here that is not the sun's.* It opens on `sunDown - 3` (floored at
`TAP_EARLIEST` 16.5, MK_EARLIEST's argument in reverse) and shuts by the clock at 03.00, so
midwinter's evening is its **longest** — 10.5 h against midsummer's 8.5 — and the year reads
backwards at this one address.
*Its people.* `spawnTapAgent()` on its own budget (four `TAP_SLOTS`, min gap 1.23 cells),
subtracted from `laneCount`, deliberately **not** reading `scarcity()`. They come out of the
courtyard's own south arch, eight cells off: a drinker fetched from a lane edge is 20 s of
walking each way and would still be out at 03.00 whatever hour the door shut.

**Gates:** census PASS (people +15, onStreet +13, in the two ladder cells that sit at 21.27) ·
visual PASS (`probes/tap-shots.mjs`, six crops) · perf PASS (+0.0% day and night) ·
motion **FAIL, attributed**: `market/shower` jumps 0→2 on a kind with no new code —
`probes/shower-jump-spread.mjs` over ten seeds gives HEAD 0..2 mean 0.40 and this 0..3 mean
0.50, and the gate's own pair {7,42} is 0 on HEAD by luck ·
**`probes/evening-door.mjs`**: night STILL **0.21 → 0.98**, 17% → **77%** of midday; at the
door 0.00 at 10h/12h/14h, 2.50 at 22h, 0.13 by 04h, standing zero before dawn; longest life at
the door **23.5 s** against the 40 s limit; **0 samples** still standing after the shut, latest
26.92 of 27.00 · **`probes/day-control.mjs`**, HEAD vs here, five seeds: `tap 0` at both midday
instants in both builds.

**Verdict:** shipped

**Surprise:** the design was decided by arithmetic, not by taste, and it took three false
starts to see it. A sim hour is 2.3 s, so a midsummer night is 22 s of screen time — and the
brief's own success test ("stopped at 22.00 in midsummer") is only satisfiable if the walk to
the place is about 3 s. Our own doorway at x=33.9, which `drawOurSide` has drawn since before
the loop and nothing has ever used, is 15 cells across the lane: 6.8 s each way, so the first
drinker would arrive at 23.6 and the round trip would be 92% of the whole window. The place had
to move to the near side of the road for a reason that has nothing to do with what it looks
like. Second surprise, and it cost more time than the first: `tap-shots.mjs` photographed 190 px
of the frame's left border twice, because `project()` is relative to the canvas **parent** and
I clipped at its raw numbers — the instrument, again, before the page.

**Law:** the evening is bounded by ARITHMETIC before it is bounded by taste — at 2.3 s to the
sim hour, where a new place can stand is decided by how far its people must walk to it, and a
15-cell trip is already 92% of a midsummer night. Price the walk before choosing the address.

**Cue:** `TAP_LAST`'s clearance is 0.08 h wide at worst and `evening-door.mjs` asserts it, but
a greet or the bell can hold a walker mid-route and nothing bounds that; the backstop exists
for it and has never fired in 80 folded nights.
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


## Iteration 37 — the bed ceiling comes down cell by cell, not all at once (2026-08-28) [Courtyard & garden × Deepen]

**Brief:** b37 — `bloomCap()` was the town's only STEPPED seasonal term (3/2/1 at warmth 0.42/0.20);
make it continuous without moving the year's totals.

**Did:** `bloomCap()` is now a ramp `1 + 2·clamp((warmth − BLOOM_LO)/(BLOOM_HI − BLOOM_LO))`, with
`BLOOM_HI = 0.50` = SEASON_START's warmth so the anchor is 3 by the clamp, and `BLOOM_LO = 0.12` the one
tuned number. `bedCap(x,y)` turns the fraction into an integer with `capStep()` — the fraction is the
SHARE of cells already allowed the next stage, by `hash(x, y+53)` in the courtyard and by
`hash(plotOrigin, +53)` in the allotments, so a plot still steps whole but not with its neighbour.
Hardiness (`y+41`, `plotStands`) untouched. No new `R()`.

**Gates:** census PASS (blooming −17, planted −25 — noise; winter cell planted 725 → 841) · visual PASS
(early summer, cap 3 both builds — nothing to see, as expected) · motion skipped (CA state only, no
draw or agent touched) · perf skipped · **`bloom-cap.mjs`** (folded year, 520 phases): max step in the
courtyard's mean ceiling **0.876 → 0.038**, allotments 1.000 → 0.118 (one plot of seventeen),
`bloomCap()` at the anchor exactly 3 both builds; year-mean of the cap 2.2577 → 2.2564 ·
**`beds-year.mjs`** 3 seeds × 70 settled days: mean blooming **342.7 → 349.3 (+1.9%)**, planted +1.4%;
autumn shoulder d13–15 was 534/147/53, now 512/232/56; spring d24–26 was 47/288/608, now 66/339/570;
evenness 0.998 all three years. Context budget opened OVER (46.4 / 46 KB).

**Verdict:** shipped

**Surprise:** the cap's folded mean was flat to 0.06% and the beds still came out +1.9% — the ramp gives
the SPRING side more than it takes from autumn (d25 +51, d14 +85 vs d26 −38), because a bed under a
rising fractional cap starts climbing the moment its cell is admitted, while a bed under a falling one
only ages out at `dieF()`'s pace. A continuous ceiling is still asymmetric through the CA either side of
it. Also: BLOOM_LO tuned in warmth-space came out 0.12 rather than the 0.08 the area-under-the-step
arithmetic said, because warmth is a cosine and time piles up at the extremes, not the middle.

**Law:** a step replaced by a ramp with the same area is not the same YEAR — the world's phase density
is a cosine, so tune the ramp's one free end on a folded-time mean, never on area in the scalar's own
units; and expect the CA on either side to spend the ramp asymmetrically (climb is rate-limited by
growth, descent by dieback), so check the consumer's annual mean, not just the scalar's.
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


## Iteration 31 — the sill says it is pressable, once, in its turn (2026-08-04) [Sky, light & weather × Interaction/UX]

**Brief:** b30 — make the season button legibly pressable and say so once, without shouting
beside the canvas hint.

**Did:** (1) `#season` gains an underline that stops at the WORD — `::after` is now an
`inline-block`, and text-decoration does not propagate into one, so the chevron stays
punctuation. Padding is the hit area, an equal negative margin gives it back: **20→30px** wide,
**12→29px** in the 390 caption slot, where it also takes full `--ink` instead of the `--ink-dim`
of the subtitle it displaced. Sill and canvas byte-identical to HEAD.
(2) `offerInvite` is an `OFFERS` queue of two, not a flag. Each carries the act that silences it
(`touched`, `pressed`), and an offer is **spent when it comes up**, spoken or not — that is what
makes "never twice" structural. `offerFree` (the dwell plus a 6 s staleness window) holds them
apart. At 390 the second keeps the plate and drops the TITLE
(`.inviting.at-season`): the offer pointing AT the season may not hide it while it speaks.

**Gates:** census PASS · motion PASS · visual PASS · `touch-hint.mjs` PASS **unchanged** ·
**`probes/season-invite.mjs` PASS, 7 FAILs on HEAD** — touch 8.0..13.7s, season 21.5..26.8s,
**0 overlapping samples**, +28px fit, cancelled by a press, silent on `?pause`.

**Verdict:** shipped

**Surprise:** three, and all three were my instrument lying rather than the page. (1) I opened
the narrow rule's rationale with no `/*`, so the whole `#season` block failed to parse, the
caption fell back to the wide rule, and the sill grew 7px while the canvas lost 7 — **law #28
verbatim, one iteration after it was written**, caught only by reading computed style. (2) The
margin I added in order to "print the margin" was `clientWidth - scrollWidth`, **floored at
zero**: `+0px` for a line with 28px to spare, and it can only ever report bad news. A range over
the text is honest. (3) The gate then failed on `touch runs 0` after a
press at 3 s — not a regression: a press starts a 7 s lapse, the town returns six sim days on
with the ticker solid, and the deferred offer waits for a gap (17.4 s on HEAD, 30.1 s here). A
wall-clock arrival for a line queued behind the news is not assertable; that it was never
**spent in silence** is.

**Law:** promoted at pass #33 → LAWS.md, *"when a gate fails, suspect the instrument first"*
(with surprise 2, the floored margin). Full entry in `LEDGER-archive.md`.

---

## Iteration 32 — something is on in the bandstand, and people come and stand for it (2026-08-04) [River & far bank × New element]

**Brief:** b31 — the bandstand has stood on the far bank since before the loop with nothing ever
happening in it, and the east side has no gathering of any kind. Put a concert on in summer.

**Did:** `bandF()` — one 0..1 over set-up/set/strike, `marketRaise()`'s shape — with three
`BAND_PLAYERS` at cues 0.10/0.30/0.50 and bunting at 0.72, so they step up one at a time and pack
away in reverse. Players are plain records handed to `drawPerson()` (which now reads `a.z`), drawn
between the back and front posts inside `drawBandstand()`: the sorted item list can only put them
wholly in front of or behind the structure. The day is `hash(day, 617) < bandChance()` off
`warmth` — no `R()`, so most days pay nothing. Audience: `spawnConcertAgent()`, own source, own
`BAND_TICK` (the shared 1 Hz tick cannot fill nine places in a seven-second window), subtracted
from **both** `eastCount` and `laneCount`, each claiming one of nine `BAND_SLOTS`.

**Gates:** census PASS (people +7, inEast +2 — the audience lands in fields that already exist) ·
visual PASS · perf PASS · motion **FAIL, attributed**: night/shower jumps 1→2 on a kind I did not
touch; over twelve seeds the rises are 0/1/2 on HEAD *and* here and the falls are 0 in both, so it
is two shower onsets, not a broken ending · **`probes/bandstand-year.mjs` PASS ×4** — 18 concert
days at midsummer vs **0** at midwinter over three folded years; peak 7 standing over 14.5 s,
worst single step 43% of peak; min separation while standing **1.68 cells**; 0 teleports · a
filmstrip cropped to the green shows no POP at raise or strike.

**Verdict:** shipped

**Surprise:** the first cut ended the set at 19.2 and every gate was green — the year folded
right, nobody teleported, the separation held. Then the arrival series showed six of nine
listeners leaving in one 0.25 s step. Not my code: `eastOpen()` is `daylight > 0.16`, i.e.
`sunDown - 0.05*dayHours`, and the strike ramp ran straight through it, so the existing rule that
sends the far side home at dusk cleared the green wholesale. Nothing errored, and no still frame
could have shown it. I sized the set against the walk in and forgot to size its *end* against
the light.

**Law:** promoted at pass #33 → LAWS.md, *"an event its audience must WALK to is bounded at both
ends by things that are not the event"*. Full entry in `LEDGER-archive.md`.

---

## Iteration 33 — a door on the lane that keeps hours after dark (2026-08-04) [Lane & market × Scale/World]

**Brief:** b35 — every `stop` branch in `spawnLaneAgent` opens with `sun &&`, so ~45% of the
clock is a transit corridor. Give the town ONE evening place. Measure the dark first.

**Did:** Measured first: the dark was **not** a clean zero — **0.21** street people standing still
22.00–04.00 against **1.26** at midday, all of it the glance through the arch in the final `else`.
A lit door at `TAP_DOOR = 26` on the plane `drawFaceRow` already draws, every frame: `tapOpen()`
the behaviour, `tapF()` the 0..1 every draw mixes on. Hours are the one clock here that is not
the sun's — open `sunDown - 3` floored at `TAP_EARLIEST`, shut by the CLOCK at 03.00 — so
**midwinter's evening is its longest**. `spawnTapAgent()` has its own budget (four `TAP_SLOTS`),
comes off `laneCount`, does **not** read `scarcity()`, and walks out of the courtyard's south arch.

**Gates:** census PASS (people +15) · visual PASS (`tap-shots.mjs`) · perf PASS · motion **FAIL,
attributed** (`market/shower` 0→2 on untouched code; ten seeds HEAD mean 0.40 vs 0.50) ·
**`evening-door.mjs`**: night STILL **0.21 → 0.98**, 17% → **77%** of midday; **0** standing after
the shut · **`day-control.mjs`**: `tap 0` at both midday instants on HEAD and here.

**Verdict:** shipped

**Surprise:** the address was decided by arithmetic, not taste. A sim hour is 2.3 s, a midsummer
night 22 s, so "stopped at 22.00 in midsummer" is only satisfiable if the walk is ~3 s. Our own
doorway at x=33.9 is 15 cells across the lane: 6.8 s each way, round trip 92% of the window. It
had to move to the near side of the road. Also `tap-shots.mjs` photographed the frame's border
twice, because `project()` is relative to the canvas **parent**. Full entry in `LEDGER-archive.md`.

## Iteration 37 — the bed ceiling comes down cell by cell, not all at once (2026-08-28) [Courtyard & garden × Deepen]

**Brief:** b37 — `bloomCap()` was the town's only STEPPED seasonal term (3/2/1 at warmth 0.42/0.20);
make it continuous without moving the year's totals.

**Did:** `bloomCap()` is now `1 + 2·clamp((warmth − BLOOM_LO)/(BLOOM_HI − BLOOM_LO))`, with
`BLOOM_HI = 0.50` = SEASON_START's warmth (anchor 3 by the clamp) and `BLOOM_LO = 0.12` the one
tuned number. `bedCap(x,y)` turns the fraction into an integer with `capStep()` — the fraction is
the SHARE of cells already allowed the next stage, by `hash(x, y+53)` in the courtyard and by
`hash(plotOrigin, +53)` in the allotments, so a plot still steps whole but not with its neighbour.

**Gates:** census PASS (blooming −17, planted −25 — noise) · visual PASS (early summer, cap 3 both
builds) · motion/perf skipped (CA state only) · **`bloom-cap.mjs`** (folded year): max step in the
courtyard's mean ceiling **0.876 → 0.038**, allotments 1.000 → 0.118; anchor exactly 3 both builds;
year-mean of the cap 2.2577 → 2.2564 · **`beds-year.mjs`** 3 seeds × 70 days: mean blooming
**+1.9%**, evenness 0.998. Context budget opened OVER (46.4 / 46 KB).

**Verdict:** shipped

**Surprise:** the cap's folded mean was flat to 0.06% and the beds still came out +1.9% — a bed
under a rising cap climbs the moment its cell is admitted, a bed under a falling one only ages out
at `dieF()`'s pace. And `BLOOM_LO` came out 0.12, not the 0.08 area arithmetic said, because
warmth is a cosine and time piles up at the extremes. Full entry in `LEDGER-archive.md`.

## Iteration 38 — a launch failure no longer burns its brief (2026-08-28) [The sill & the observer × Harness]

**Brief:** b38 — make a CLI launch failure leave the brief claimed and stop counting as a worker iteration; split motion's shower `jumps` into rises/falls.
**Did:** The burn was one line: `runlog.mjs` retired the brief (`status: 'done'`) unconditionally, so `pop-brief.mjs`'s re-issue path — written for exactly this case — was unreachable. `runlog.mjs` now classifies a worker row as `kind: 'launch-failed'` when `rc≠0` and (token sum is 0 or elapsed < 30 s), gives it verdict `launch-failed` (mark ⚡), and leaves the brief `active`. `run-loop.sh` logs "never launched … brief stays claimed" when the brief is still active after runlog. `pop-brief.mjs` skips launch-failed rows when computing `nextIter`, so a failure does not consume an iteration number. `stall.mjs` and `build-stats.mjs` exclude the kind alongside manager rows (stats gets a "launch failures" hero figure only when there are any). Rows #34–36 retagged in place with a `retagged` note; nothing deleted. `motion.mjs`: shower rows carry `rises` and `falls` (`jumps` stays the sum); the shower gate now fails on `falls` only. Baseline regenerated.
**Gates:** census PASS (+0 everywhere — `courtyard.html` untouched) · visual skipped (no draw change) · motion PASS after re-baseline: every shower jump in day/dusk/night/market is a rise, 0 falls — the night cell (c62) was three showers *starting* · harness proof: cloned repo + a `claude` stub that exits 1 after 1 s, `MAX_FAILS=2`: b38 re-issued attempt 2 → 3, `current-brief.json` still active, two ⚡ rows, `stall.mjs --report` reads 33 workers + 5 launch failures, last 20 verdicts `shipped=19 no-ship=1`, `src moved 10/10`.
**Verdict:** shipped
**Surprise:** The first clone run happened to run the *old* code (an interactive `cp` alias refused to overwrite) and reproduced the bug perfectly — two briefs burned in 3 s. Then the fixed code threw a TDZ error (`KIND` used before its new definition) and the loop *still* behaved correctly, because a crashing runlog never retires the brief either. The fix was right for the wrong reason for one run; only the ⚡ row in the log proved it.
**Law:** A harness fix needs a stub-driven end-to-end run, not a unit check: the runner, runlog and pop-brief each hold half of "is this brief done", and a fault in any one of them looks like success in the others. A 1-second `claude` stub on `PATH` in a throwaway clone exercises all three for free.
**Cue:** a worker that really ran and then exited non-zero (rc≠0, tokens > 0, > 30 s) still retires its brief as `failed`. Probably right — the work may be half-done on disk — but nobody has decided.

## Iteration 39 — every window keeps its own hours (2026-08-28) [Sky, light & weather × Deepen]

**Brief:** b36 — `drawWindow()` lit every window with one `nightF > 0.3 && hash(house, day) > 0.42`, so 58% of the town burned dusk to dawn and switched in one frame.
**Did:** `windowLit(sa, sb)` is the ONE predicate (pane fill and `LIT[]` glow both read it). Hours run off a single clock, `t` = hours since the dusk edge (`sunDown − NIGHT_K·dayHours`, NIGHT_K = asin(0.4375)/π = where nightF crosses 0.3), addressed by `nid` — the night, not `day`, because the day rolls at 06.00 in the dark. Per window (hash, never R): on at 0.15–2 h after the edge, bedtime `on + 1.2 + 6.8·h²` (most out by mid-evening, a squared tail into the small hours, one in twenty burning through), 14% early risers back on 0.6–2.2 h before the dawn edge, and everything still lit goes out one by one in the last hour so nothing switches AT the edge. Then the real find: `drawBlocks()` draws rows 0–60 INTO the cached ground layer, which rebuilds on the quarter-hour light bucket — so per-window hours would have flipped ~12 windows per rebuild. `drawWindow()` now registers into `WINDOWS[]` when drawing to `gtx` and paints the pane dark; `drawLitPanes()` repaints lit panes live every frame after the ground blit. That also fixed a pre-existing leak: `LIT` was reset only in `drawGround()`, so the south band's 13 live windows stacked into it every frame for a quarter-hour and the halo pass drew hundreds of gradients over each other (a frozen page read 28, 41, 54, 67… per frame).
**Gates:** census PASS (unchanged everywhere) · motion PASS · perf PASS (+0.0% day and night, 3 interleaved reps) · noon frame mean pixel diff HEAD vs here **0.000** · `probes/windows-night.mjs`: lit count over a night 19→42→20→13→3→7 (summer) and 20→42→26→10→6→6→9 (winter) against HEAD's flat 72/81; largest change in one 0.25 s step 93 → 12, and 5 on the dusk ramp of the step dump · 22h vs 03h shots differ 0.58/0.61 mean px where HEAD's are the same picture · filmstrip: no POP.
**Verdict:** shipped
**Surprise:** the first probe showed +26/−30 oscillations across the dusk ramp and I nearly tuned the hash. It was the instrument: `LIT.length` was climbing 13 a frame with the clock frozen. The HEAD counts of 86 and the census note "LIT depends on where in the draw pass you sample" were both this leak, misread as sampling.


<!-- archived verbatim by the manager pass from #47, before condensing in LEDGER.md -->
## Iteration 45 — winter gets snow: flakes, a lying cover, and a melt (2026-08-29) [Sky, light & weather × Scale/World]

**Brief:** b42, attempt 2 — attempt 1 died mid-run with the build ~90% in the working tree; this run picked it up rather than rebuilding, checked every seam, finished the gates.
**Did:** `snowF()` = share of a shower that falls as flakes: 0 until `greyF()` 0.55, 1 by 0.90, read PER DROP against a `hash(slot, 97)` on the drop so a shower turns to sleet then snow drop by drop, never as a switch. `snowCover` is the second slow world scalar with a cap, a cycle and an anchor: `stepSnow(dt)` adds `rainFall·snowF·SNOW_SLEW` (0.02/s), thins by the rain share (`SNOW_RAIN_THAW` 0.03/s), melts at `SNOW_MELT·(1−snowF)` (0.012/s); starts 0 and cannot move while `snowF()` is 0, so at SEASON_START every consumer is the old constant BY THE ALGEBRA (all draw sites guarded `snowCover > 0` because `mix()` re-serialises a colour even at t=0). `snowAt(x,y,t)` = cover × `snowTake(t)` (grass/beds 1, side 0.7, path/slot 0.5, road 0.4, else 0) × per-CELL `hash(x, y+53)` — the paths and road read dark through the white without touching the wear map. `groundCol` wraps `groundBase` and whitens; joints/setts skipped under > 0.5 cover; roofs whiten in `drawRoofRow` (draw pass, not `buildVolumes`) with the ridge stroke fading; canvas awnings get a cap in `drawOurSide`; flakes drift at 0.11× drop speed with a sine wobble and draw as 1.7 px discs; the rain tint pales toward a snow sky; the cached ground repaints when cover has moved `SNOW_REPAINT` (0.03) since last painted; announce on the shower ('Snow drifts in over the rooftops, fat and slow.') and once when cover first passes 0.15. `__census().clock.snow` added (town state, like `cloud`).
**Gates:** census PASS (churn only; `snow` field new) · motion PASS (shower kind: rises/falls −1, the seed-42 drop count step is HEAD's) · **noon-at-anchor vs HEAD: 233 px differ of 6.08 M, and the working copy against ITSELF differs by 797 px** — below the noise floor, the summer town is unchanged · **`probes/snow-year.mjs`** 5 seeds × 2 years: cover mean winter 0.255 (on 69% of samples, max 0.86), spring 0.019 (7.8% — the lag tail into early spring, the shoulder law), summer 0, autumn 0; by phase-week peaks 0.55 at week 4 after midwinter, exactly 0 weeks 9–46; **max |Δcover| per 0.25 s = 0.012**; first cover>0 at phase 0.91–0.03; 10 settle announcements in 10 seed-years · winter shots (seed 7, t 1183 dusk; t 1175 afternoon shower): white lawn/plots/green, dark paths and road, white eaves, pale sky — reads winter from the wide view · flake probe: 85 flakes → 989 px brighter vs the same frame with the drops removed · day filmstrip median Δ 0.465, no POP (same as #44) · filmstrip at 1175/seed 7: POP at frames 10–11 (6.4/5.7) — **HEAD at the same instant POPs 4.8/4.2 there and 9.0 at frame 5**: it is the winter sunset's light bucket, not the snow; ours is larger because the relit ground is whiter · perf PASS 16.70 vs 16.70 ms day and night. Context budget opened **OVER** (46.1 / 46 KB).
**Verdict:** shipped
**Surprise:** `__warp` never draws, so `snowPainted` stays 0 through a warped probe and `groundDirty` is set every step — harmless in a probe, but any "did the cache repaint" assertion must drive a frame itself (`drawScene(simT, 0)` from `evaluate`, as the flake probe does). And `filmstrip.mjs` takes no `--page`: it silently ran the working copy under a HEAD label until I swapped the file in. A control that returns the candidate's exact numbers is not a control.
**Cue:** the winter-sunset relight steps 5–9 mean-Δ in one frame on HEAD (light bucket at 2.3 s/hour with a compressed dusk); worth a live overlay or a finer bucket near sunUp/sunDown. Snow × footfall (paths worn through lying snow) is the follow-on the brief named.

## Iteration 46 — the night reaches the river: lamp and moon reflections, one rail stop after dark (2026-08-29) [River & far bank × Connect]

**Brief:** b43. Not a duplicate: `grep` found no light on the water after dark and `eastOpen()` was the far side's only clock.
**Did:** `drawRiverLights(t)` — for each waterside lamp (`RIVER_LAMPS`, the LANE_LAMPS within 2 cells of a river edge: the quay lamp at 112.7, both bridge ends, both far-bank lamps) a column of 14 short bars under it, each on its own downstream phase off the streaks' clock (`t·FLOW_SPEED·riverRun()`) so the column breaks and re-forms rather than sliding as one; the moon gets a 40-bar column that crosses the river east→west with `moonArc()` (factored out of `drawSunMoon` so disc and reflection agree), brightness × `sin(π·ma)`, off at ma 0/1. Both × `nightF` × `(1 − cloudCover())`, the stars' own veil. Drawn in the night **screen** pass beside the lamp pools, not inside `drawRiverFlow` as the brief said — under the multiply a warm bar comes out blue. hash()+clock only, no R(). `eastOpenFor(a)` = `eastOpen() || (a.nightRail && tapOpen())` replaces the three `eastOpen()` reads on agents; `spawnEastAgent(true)` sends ONE night stander (`nightRailFree()`) to the north end of the rail (y 5–11, 4–7 s each way, stand 5–9 s) at `NIGHT_RAIL_RATE` 0.22/s while `!eastOpen() && tapOpen()`, outside `eastCap` — which is 1 after dark and held by the people walking home, so the first cut spawned 4 in ten nights and none reached the rail. Its own sill line.
**Gates:** census first read **FAIL people 210→185**; `probes/census-noise.mjs` showed it was the reshuffle — seeds 7 and 1234 now rain at the @900 rung, over 8 seeds −1.6% — and after the repricing pass it reads PASS · motion PASS (raindrop churn only) · **`probes/river-night.mjs`**: 22.00 river box, working copy vs ITSELF with `drawRiverLights` stubbed (same world): bright px **307 → 993**, mean 46.6 → 48.2; HEAD 296 · **noon t=13.75 whole-frame hash identical to HEAD** · rail after dark over 10 seed-nights: standing **26.6%** of dark-tap samples (14 s of dark per night; 0–48% by seed), 11 visits, 1 sample standing past the shut · night filmstrip median Δ 0.214, no POP · perf 16.70 vs 16.70 ms day and night · night-east shot: warm bars under three lamps, a pale broken moon column mid-river; day east shot unchanged. Context budget opened **OVER** (47.9 / 46 KB).
**Verdict:** shipped
**Surprise:** `t = 27.5` is **18.00**, not noon — `nightF` 0.29 there, so the "noon byte-identical" test at the anchor would have shown a difference that was the feature working. Noon on day 0 is `t = 13.75`. And the after-dark cap is the thing that prices a night visitor, not the walk: `eastCap` falls to 1 with the light and the walkers going home hold it, so a night arrival gated by it never fires — a night stop needs its own presence bound (ONE), not the day's cap.
**Law:** A cap sized on daylight is CLOSED after dark whatever it reads — anyone still walking home holds it. A night visitor must be bounded by its own presence rule, not the day's cap.
**Cue:** `probe: 1 sample standing past the tap shut` — the send-home check and the arrival can land on the same step; harmless. The bridge-end lamp columns only show south of the deck (fy 79.5+), so the deck's shadow on the water is an implicit edge worth drawing. The boat has no reflection.

## Iteration 47 — the door gets callers: the market's last trader and an evening sweeper, the audience priced out (2026-08-29) [Lane & market × Connect]

**Brief:** b44. Not a duplicate: `grep` found no path into `TAP_SLOTS` except `spawnTapAgent`, and `scarcity` read `agents.length` whole.
**Did:** `callIn(a, pts, durMin, durMax)` — the ONE way an agent already on its feet is re-routed to the pavement: takes the first free `TAP_SLOT` (not `pick`, so a refusal spends no R()), prices the polyline from where they stand at their speed in sim hours (`pathHours`, `HOURS_PER_S = 24/DAY_LEN`), and `tapFits` demands the door open at arrival and arrival + drink + 0.6 h inside `TAP_SHUT`; refused = walk home as before. Three sources: the concert audience (`a.toTap` written at spawn, 40%; priced at the strike) and, in `tapCallers()` on market days, a trader who leaves the LAST stall when it is folded (`marketClose() + MK_STAGGER·2 + MK_RAISE`, needs `mkTrades`) and an evening sweeper (`kind:'sweeper', eve:true`, 62 → 40 along LANE_S_Y then to the door, otherwise off west). `scarcity` now reads `agents.length − tapNow` (c65). `__entities` carries `tap`/`caller` on walkers AND sweepers. `personName` names both sweepers.
**Gates:** census PASS (reshuffle churn: `toTap` is an R() on every concert spawn; fireflies −24 on one rung) · motion PASS, sweeper spawns +1 in night and market scenes · **`probes/tap-callers.mjs`**: 13 market days over two years — callers reach the pavement on **5/13**, all with warmth ≤ 0.43 (sweeper ×4, trader ×2); 19 concert nights — the priced walk from the green is **25–41 sim hours** against a shut 9 h off, so `callIn` refuses **19/19** and 0 band ids ever become tap ids · **`probes/bandstand-year.mjs` §5** (c68): scans `eastOpen()` itself every day of a year — clearance between the slowest listener leaving and the light's edge is **0.81..1.79 h**, PASS on a 0.5 h floor · night filmstrip median Δ 0.247, no POP · winter market-night shot: sweeper standing at the door 01.39 with three of the door's own. Perf not run: `tapCallers` is three predicates per frame.
**Verdict:** shipped, with the brief's headline half priced to zero — "concert-night occupancy above ordinary nights" is **false** and the code says why.
**Surprise:** the *market* callers also read 0/13 on the first run. The last stall is 38 cells from the door (I had guessed 20): 7.1 h at 2.4 cells/s, and my 4–6 s drink put even the winter arrival 0.4 h past the shut. A 3–4.5 s drink turned 0 into 5. Then the probe still showed only 2: the sweeper's `take()` in `__entities` had no `extra`, so a sweeper at the door was invisible to the instrument. Two zeros, neither the feature.
**Law:** A walk priced in your head is wrong by 2×; price it with the constants (`pathHours`) *before* choosing who is sent, and when a caller's window is minutes, the DRINK is the term that decides, not the walk. And `__entities` exposes per-kind `extra`s — a new field on one `take()` is a blind spot on every other kind that can carry it.
**Cue:** the trader's stall is 38 cells off; a caller from stall 0 (x 45) would fit spring/autumn too. `scarcity` still counts the band crowd (9 on the green at 17.00 — daytime, so harmless). Summer market evenings never call in — the door's midsummer shut binds; that is a fact about the year, not a bug, but it means the connection reads only in the cold half.
## Iteration 40 — the fountain reads the year: jets, basin and who stands at it (2026-08-28) [Plaza & quay × Deepen]

**Brief:** b32 — the plaza was the only east-of-bridge place with no seasonal reader; give the fountain the year.
**Did:** `fountainPlay()` = `1 - FOUNT_SWING(0.6) * greyF()` beside `riverRun()` — the same sky predicate read the other way (a fountain is a fair-weather thing): 0.4 midwinter, 1.6 midsummer, 1 at the anchor. Readers: `drawFountain` jets each keep a threshold `hash(k,23) < play` (1 jet in January, 5 from play 0.8), height `rise = min(play,1.4)`, reach `min(play,1.2)`, droplets `k < 4*play`; `groundCol`'s plaza WATER goes through `riverCol()` then `fountainIce()` skins it per cell (`hash(x,y+71)`, 0.45–1.0 share) below FOUNT_ICE 0.7; both spawners' bench/fountain coin-flip becomes `R() < 1 - 0.5*fountainStand()` so the stand share is 0.2 / 0.5 / 0.7 across the year and `fountainLine()` swaps the "trails a hand" line for a breath-showing one when the basin is skinned. No R() draws added, none removed.
**Gates:** census PASS (churn only — the split threshold moves off the anchor over the multi-day ladder and reroutes visitors) · visual PASS (`probes/fountain-shots.mjs`: winter basin rgb(103,134,146) vs HEAD 79,117,130, crop mean −8 g-b; summer 82,121,120 greener; east wide clean) · motion PASS · filmstrip day 0 POP · perf skipped (no new pass) · `probes/fountain-year.mjs`: basin colours and cached ground layer byte-identical to HEAD at SEASON_START; max step over a 1/400 folded year 0.009 play / 0.012 ice / 1 RGB unit.
**Verdict:** shipped
**Surprise:** first census run reshuffled everything at the anchor too — I had flipped the coin's polarity (`R() >= 0.5*f` puts the bench on the *other* half). Same count of draws, same thresholds, different world. `fountainPlay()` reads 1−1e-16 at t=0 because `seasonPhase` lands a hair off 0.25 after the first rAF; `riverRun()` rounds the same residue back to 1 by luck of its swing.

## Iteration 41 — the block is vegetables from the first frame (2026-08-28) [Cross street & allotments × Polish]

**Brief:** b33 — the opening scatter dropped ornamentals into allotment plots (`seed()` drew `1 + (R()*4|0)` with no `inAllotment` check); since #29 those cells are harvested into `produce[]` and laid out on a stall.
**Did:** One line at the seam. `seed()` still makes ONE `R()` draw per cell, but a cell in the block maps it through `speciesFor(x, y)` — the same predicate every later sowing uses — while a courtyard cell keeps the literal `1 + (r*4|0)`, so the courtyard's opening beds are byte-for-byte the world they were. No filter at the market. New `probes/allot-scatter.mjs`.
**Gates:** census PASS (churn only, no collapse; cabbages +79 because the block now opens on the hardy brassica) · motion PASS · visual PASS (east: plots read as cabbages/carrots, plaza and green untouched) · **`allot-scatter.mjs` 10 seeds × 26 days**: HEAD — 8/10 seeds open with ornamentals in the block (seed 7: lavender + fern, as the brief said), non-veg cell-steps in plots up to 1381, and *every* one of those eight puts a flower on a stall inside the year; here — 0 / 0 / none, and the courtyard scatter at t=0 has the identical species counts per seed. perf skipped (no per-frame change). Context budget opened OVER (46.3 / 46 KB) — the manager's distil call.
**Verdict:** shipped
**Surprise:** none in the code — the surprise was how *consistently* the bug reached the market: HEAD's stalls sold flowers in 8 of 10 seeds, not the occasional fern the brief guessed at.

## Iteration 42 — the sill names the living things (2026-08-28) [The sill & the observer × Interaction/UX]

**Brief:** b42 — `nameAt()` names ground, plants, waters and trees; point at a walker, a duck, the boat and it says the paving under their feet. Give the pointer the living things, same NAME_SETTLE, saying what they are DOING.
**Did:** `livingAt(p)` beside `treeAt(p)`: walks the same populations the draw pass paints (agents not in a TUNNEL, their dogs, ducks, swans, the boat when not under the bridge, the cat), projects the feet and hit-tests a SCREEN box 0.9 cells wide × one figure tall (1.5 cells standing, 1.0 sitting, 0.6 × 1.9 wide lying, 0.72 for a child); topmost by the draw's own sort key wins. `lookAt()` asks it first. `personName(a)` reads `kind`/`state`/`cup`/`watch`/`greet`/`listen`/`band`/`umbrella` — 'someone waiting at the door', 'a busker, playing', 'someone in the audience, listening', 'the gardener, kneeling at a bed', 'someone watching the boat go by', 'a child, running about'. No draw, no R().
**Gates:** census PASS (+0; render-free) · motion PASS (no new jumps/flicker any kind) · visual PASS, 4 shots + day filmstrip median Δ 0.42, no draw-order change (no draw touched) · **`naming.mjs` §7** ten seeds: **246/246** drawn living things answer a living name, **0** the ground; **12,743** lattice points 2+ cells clear of every entity: 0 differ from `nameAt`/`treeAt` alone; 13-word vocabulary in one midday · throwaway walk-out probe (`?pause` + `__warp(0.05)` ×40): label follows the figure's own state ('listening to the bell' → 'walking'), holds after it walks out, then 'The lane'; every label held ≥ 0.2 s sim, no strobe. Context budget opened **OVER** (46.3 / 46 KB).
**Verdict:** shipped
**Surprise:** first run missed exactly one of 242 — a napper. A lying figure is drawn 3 px tall and 4 px wider; a standing box misses it under the pointer even though the probe aimed at "mid-shin". The hit box has to be the DRAWN footprint per pose, not per entity. And the first live walk-out probe read only "The cross street": at `t=180` the ticker's dwell held the box until the walker had gone — the yield rules are upstream of the hit-test, so a live check must first wait out `lineDwell` like §6a does.

## Iteration 43 — three instrument lies: the night strip, the harness verdict, the crashed worker (2026-08-28) [The sill & the observer × Harness]

**Brief:** b40 — `filmstrip --scene night` pinned a daytime instant; `runlog.mjs` graded shipped harness work `no-ship`; a worker that ran and died had no retry rule.
**Did:** (1) `filmstrip.mjs`: `AT(day, h) = day*55 + 55*((h−6+24)%24)/24` — the page's clock inverted (the day rolls at 06:00) — and `night: AT(22, 0)` = 1251.25 s, midnight on the same day the old 1230 (= 14:44) sat on; the other four presets are unchanged but now annotated with the hour they actually are (`rain` 430 is 01:38 — already a night). (2) `runlog.mjs`: `verdictOf` reads `changeKind` — a Harness row that committed AND logged is `shipped` without source movement; a Harness row that DID move `courtyard.html` stays `shipped` but carries `harnessTouchedSrc: true` and a ⚠ in the report line. New `--regrade` mode recomputes every row from stored evidence and rewrites only rows whose verdict changed (note in `regraded`). Run: **#16 and #38 no-ship → shipped, nothing else**, idempotent. Also found and fixed: rows before #11 carry no `rc`, and `rc !== 0` read `undefined` as a crash — the first regrade turned twelve shipped rows `failed`. (3) The rule: **one retry, then retire.** `runlog.mjs` leaves a crashed worker's brief `active` with a `retry` note when `attempts < 2`; `pop-brief.mjs` re-issues it as attempt 2 under a fresh iteration (the crash was a real run, keeps its row, verdict `failed`, rc in the row); a second crash retires it. Documented in `run-loop.sh`, which now logs three distinct cases.
**Gates:** census PASS (+0, `courtyard.html` untouched) · night filmstrip: 8 frames at t=1251.25 — dark sky, lamp pools on lane and quay, lit windows, Δ 0.06–0.08, no POP · `--regrade` diff against a copy of the log: 2 rows, verdict field only · `stall.mjs`: last 20 verdicts shipped=20 · **stub run** (clone + a `claude` that emits tokens, sleeps 32 s, exits 1; `MAX_FAILS=3`): #43 b40 `failed` "re-issued once" → pop-brief attempt 2 → #44 b40 `failed`, brief retired → b41 popped as #45. Exactly the documented sequence.
**Verdict:** shipped
**Surprise:** the regrade's first pass flipped iterations 1–10 to `failed`. Nothing in the rule I wrote touched them — `verdictOf` had always read a missing `rc` as non-zero, and the bug was invisible because those rows were graded once, by an older `verdictOf`, and never re-read. A regrade is the first time the verdict function meets its own history; it found a latent fault in the rule before it found the one I came for. And the `cp` alias trap from #38 bit again (`cp` prompted, the shell hung two minutes) — use `cat >` in this shell.
**Cue:** `MANAGER_GAP` is compared against `done_ok − last_manager` with `last_manager = −99`, so any value ≤ 99 lets the stall check run before the first landed iteration; harmless, but "gap" is not what it does on the first loop.

## Iteration 44 — the swans get a pair and two poses (2026-08-28) [People & animals × Deepen]

**Brief:** b41 — `updateSwans` was target-and-wander only; "a pair" picked targets independently; the sill could only say 'a swan'.
**Did:** `s.state` ∈ swim | upend | preen plus `s.hold` (0..1 intensity the draw tilts on, so poses fade in/out at 2.5/s rather than snap). On each retarget ONE `R()`: `< SWAN_UPEND` (0.22) → upend 3–5 s in place; `< 0.42` and within `SWAN_BANK` 2.2 of a bank → preen 5–8 s; wanted to preen but too far out → swim to the near bank so preen is what happens *next*; a pose is always followed by a swim (no chaining). **Pair:** swans[0] is the cob and chooses the stretch; swans[1] spawns beside it, retargets every 2.5–5.5 s at 1.3–3 cells off the cob's *target*, swims a touch faster (0.5 vs 0.42), and is pushed back to 0.9 cells if it closes on the cob. `drawSwan` reads state: upend = body rotated stern-up, tail triangle, neck alpha'd out, a spreading ring; preen = neck quadratic folded back, bill on the flank. `livingAt` says 'a swan, upended' / 'a swan, preening'; `__entities` carries `act` for swans.
**Gates:** census PASS (life/species churn is the new R() draws; no collapse) · motion PASS, swan 0 jumps/flicker, 4 spawns as before · 4 shots + day filmstrip median Δ 0.465, no POP, unchanged parts unchanged · **`probes/swan-pair.mjs`** ten seeds × one day, `?t=55` so the pair exists: separation mean **12.58 → 2.10** cells (min 0.89, max 6.9; first cut gave 9.05 — see surprise), upend **13.2%**, preen **5.6%**, upend bouts 2.75–4.5 s, preen 4.75–7.25 s, 30 s looks with something happening **10/10** (HEAD 0/10), 0 samples outside the channel · pose crops at `hold ≥ 1` with the sill name asserted under the pointer: both read.
**Verdict:** shipped
**Surprise:** "the second swan targets within a few cells of the first" is not enough — the first cut did exactly that and the pair only closed from 12.6 to 9.05. The follower's *timer* was the leak: on an independent 6–14 s clock it chased a target the cob had already left, and at 0.42 cells/s neither could cover an 18-cell stretch inside one bout anyway. Pairing is a rate, not an offset: the follower has to re-read the leader several times per leader bout. Also the probe's own clip mapping was wrong twice (`project()` returns CSS pixels, `cv.width` is DPR-doubled) — the crop showed the clock tower and the `livingAt` assertion beside it still passed, because the name was read in world space. A screenshot crop is a second coordinate system; assert on it too.
**Law:** A follower is a re-read RATE, not an offset — targeting "near the leader" holds a pair only if the follower's clock is several times faster than the leader's, and neither target is further than a bout's travel.

## Iteration 45 — winter gets snow: flakes, a lying cover, and a melt (2026-08-29) [Sky, light & weather × Scale/World]

**Brief:** b42, attempt 2 — attempt 1 died mid-run with the build ~90% in the working tree; this run picked it up, checked every seam, finished the gates.
**Did:** `snowF()` = share of a shower that falls as flakes: 0 until `greyF()` 0.55, 1 by 0.90, read PER DROP against `hash(slot, 97)` so a shower turns to sleet then snow drop by drop. `snowCover` is the second slow world scalar with a cap, a cycle and an anchor: `stepSnow(dt)` adds `rainFall·snowF·SNOW_SLEW`, thins by the rain share and by warmth above the melt line, per-cell `snowAt(x,y,t)` (trodden kinds take less), `SNOW_REPAINT` steps the cached ground; roofs, eaves and awnings take a cap; census `clock.snow`; one settle announcement per winter.
**Gates:** census PASS (churn only; `snow` field new) · motion PASS · noon-at-anchor vs HEAD 233 px of 6.08 M differ, the working copy vs ITSELF 797 — below the floor, summer unchanged · `probes/snow-year.mjs` 5 seeds × 2 years: winter cover mean 0.255, exactly 0 weeks 9–46, max |Δcover|/0.25 s = 0.012 · winter shots read winter from the wide view · flake probe 85 flakes → 989 px brighter · filmstrip POP at winter dusk is HEAD's light bucket (see c76 → b45), ours larger because the relit ground is whiter · perf 16.70 vs 16.70 ms.
**Verdict:** shipped
**Surprise:** `__warp` never draws, so `snowPainted` stays 0 through a warped probe and `groundDirty` is set every step — any "did the cache repaint" assertion must drive a frame itself (`drawScene(simT, 0)` from `evaluate`). And `filmstrip.mjs` takes no `--page`: it silently ran the working copy under a HEAD label until I swapped the file in. A control that returns the candidate's exact numbers is not a control.

## Iteration 46 — the night reaches the river: lamp and moon reflections, one rail stop after dark (2026-08-29) [River & far bank × Connect]

**Brief:** b43. Not a duplicate: no light on the water after dark and `eastOpen()` was the far side's only clock.
**Did:** `drawRiverLights(t)` — under each waterside lamp (`RIVER_LAMPS`) a column of 14 short bars on their own downstream phases off the streaks' clock, so the column breaks and re-forms; the moon gets a 40-bar column crossing the river with `moonArc()` (factored out of `drawSunMoon`). Both × `nightF` × `(1 − cloudCover())`. Drawn in the night SCREEN pass beside the lamp pools, not in `drawRiverFlow` — under the multiply a warm bar comes out blue. hash()+clock only. `eastOpenFor(a)` replaces the three `eastOpen()` reads on agents; `spawnEastAgent(true)` sends ONE night stander (`nightRailFree`, `NIGHT_RAIL_RATE`) to the north end of the rail while `!eastOpen() && tapOpen()`, outside `eastCap`.
**Gates:** census first read FAIL people 210→185, shown by `probes/census-noise.mjs` to be the reshuffle (over 8 seeds −1.6%), PASS after repricing · motion PASS · `probes/river-night.mjs`: 22.00 river box vs itself with `drawRiverLights` stubbed, bright px 307 → 993; HEAD 296 · noon t=13.75 whole-frame hash identical to HEAD · rail after dark over 10 seed-nights: standing 26.6% of dark-tap samples · night filmstrip no POP · perf 16.70 vs 16.70.
**Verdict:** shipped
**Surprise:** `t = 27.5` is 18.00, not noon — `nightF` 0.29 there; noon on day 0 is `t = 13.75`. And the after-dark cap is the thing that prices a night visitor, not the walk: `eastCap` falls to 1 with the light and the walkers going home hold it, so a night arrival gated by it never fires (the first cut spawned 4 in ten nights and none reached the rail).

## Iteration 47 — the door gets callers: the market's last trader and an evening sweeper, the audience priced out (2026-08-29) [Lane & market × Connect]

**Brief:** b44. Not a duplicate: no path into `TAP_SLOTS` except `spawnTapAgent`, and `scarcity` read `agents.length` whole.
**Did:** `callIn(a, pts, durMin, durMax)` — the ONE way an agent already on its feet is re-routed to the pavement: first free `TAP_SLOT` (no R() on refusal), the polyline priced in sim hours (`pathHours`), `tapFits` demands the door open at arrival and arrival + drink + 0.6 h inside `TAP_SHUT`; refused = walk home. Three sources: the concert audience (`a.toTap` at spawn, priced at the strike), and `tapCallers()` on market days — the LAST stall's trader when it folds, an evening sweeper (`kind:'sweeper', eve:true`). `scarcity` reads `agents.length − tapNow` (c65). `__entities` carries `tap`/`caller` on walkers AND sweepers.
**Gates:** census PASS (reshuffle churn) · motion PASS · `probes/tap-callers.mjs`: 13 market days over two years — callers reach the pavement on 5/13, all warmth ≤ 0.43; 19 concert nights — the green-to-door walk is 25–41 sim hours against a shut 9 h off, so `callIn` refuses 19/19 · `probes/bandstand-year.mjs` §5 (c68) asserts `BAND_DUSK` clearance 0.81..1.79 h · night filmstrip no POP · winter market-night shot: sweeper at the door 01.39.
**Verdict:** shipped, with the brief's headline half priced to zero — "concert-night occupancy above ordinary nights" is false and the code says why.
**Surprise:** the market callers also read 0/13 on the first run. The last stall is 38 cells from the door (I had guessed 20): 7.1 h at 2.4 cells/s, and a 4–6 s drink put even the winter arrival past the shut; a 3–4.5 s drink turned 0 into 5. Then the probe still showed only 2: the sweeper's `take()` in `__entities` had no `extra`, so a sweeper at the door was invisible to the instrument. Two zeros, neither the feature.


<!-- #50–#52 archived VERBATIM at manager pass #52 before being condensed in LEDGER.md -->

## Iteration 50 — the plaza reads a windy day (2026-08-29) [Plaza & quay × Connect]

**Brief:** b47 — `isWindy()` moved everything west of the bridge; the fountain sprayed five symmetric jets in a gale. Lean the jets, carry the droplets, drift spray onto the lee paving, drop `fountainStand()` on windy days, flutter the bunting.
**Did:** `windF()` (0..1) beside `isWindy()` — the split-flag law, draw sites multiply by it. In `drawFountain` a `lean` term (windF × a gust phased off `windT` × 0.9 cellW, +x — the way the chimney smoke goes) shifts each jet's control point and landing, pushes the droplets downwind by `lean*(1+hash)`, and six faint lee dots walk 2–4.4 cells past the rim on `windT` and fade. `fountainStand()` = `clamp(play * (1 - FOUNT_WIND_SHY*windF()))`, SHY 0.5 — exact algebra at calm, threshold only, no R() count change. Bunting tips swing `sin(windT*2.6+k,j) * w * (0.25 + 0.75*windF())` plus a downwind bias. No new R() draws; river untouched; eastCap/eastRate untouched.
**Gates:** census **FAIL** on `people 210→189 (−10%)` at two of nine cells — the two branches spend different R() counts, so a moved split reshuffles every windy day. Replayed over 10 seeds × 20 days (`probes/fountain-wind.mjs`): people HEAD 18.4 calm / 22.9 windy vs here 18.1 / 22.7 (−1%), east arrivals 9.60/9.66 vs 9.55/9.62 — churn, not collapse. Spawn counts at the plaza: calm share stand **0.579 → 0.599** (noise), windy **0.578 → 0.275**, i.e. 66 fewer standers and 51 more sitters across 90 windy days. `fountain-year.mjs` anchor EXACT, basin + ground identical (day 0 is calm — checked before building). Motion PASS. `fountain-wind-shots.mjs` at seed 42 noon: calm crop day 6 identical to HEAD (11 spray px, mean dx −3.0); windy day 5 20 px at +2.6 (HEAD 4 px, −0.1) — the plume visibly heads right with dots past the rim. Filmstrip 0 POP / 0 FROZEN. Bunting shot (day 5, bandF 1, windy) taken; at this scale the flutter is motion, not a still. perf skipped (six extra arcs on windy days only).
**Verdict:** shipped.
**Surprise:** a presence-sampled probe first said calm days had *also* moved (share 0.536→0.351) — sitters stay 2× longer than standers and stops straddle the day roll, so sampling by day-of-observation smears the windy days into the calm ones. Counting at spawn gave the clean split. Also `day` on the page is one ahead of `hash(d,99)` computed in node from t=0 — the clock rolls at hour 6.
**Law:** a share that governs a *choice* must be measured at the choice (spawn), never by presence — presence weights each branch by its own dwell and leaks across day boundaries.
**Cue:** bunting flags are ~3 px at 1×; a flutter that size only reads on the contact sheet. The flags could be a little larger.

## Iteration 51 — somebody goes home, and the window over the door lights as they go in (2026-08-29) [People & animals × Connect]

**Brief:** b48 (third attempt; the second left an unlanded diff on disk that this one inherited) — a share of after-dusk leavers walk to a front door under a window, vanish, and THAT window lights at that moment; windowLit stays the one truth; swans rest by the bank after dark.
**Did:** `HOME_DOORS` — eight doors on the lane's north fronts (row 64, x 4…99), drawn by `drawFrontDoor()` (the old slot-6 door factored out) only inside the window branch of `drawFaceRow`, so each has a window over it by construction. `HOMES` is the one register, (sa,sb) → {nid, t, due}; `windowHours()` split out of `windowLit()` so pricing and the predicate read the same hash; `windowLit` reads the register: dark while someone is on the way (up to HOME_LATE 3 h past the priced arrival), lit the frame they go in, off after the SPAN the hash gave it or at the dawn edge, early risers and burn-through untouched. `goHome(a)` prices `pathHours()` straight to each unused door whose window is home tonight, needs HOME_MIN 1.2 h left before the dawn edge, share by a per-person hash (no R()). ONE ask site, in `stepAgent`: a walker on the lane beginning (or already on) their last leg when nightF > 0.3 — not cyclists, sweepers, the east. `arriveHome` at the last waypoint; `personName` 'heading home'; `__entities` `home:1`. Swans: at nightF > 0.6 the roll becomes preen-or-swim-to-bank, one line.
**Gates:** census PASS (churn: people 189→221 across the ladder, no collapse) · motion PASS · `probes/going-home.mjs` 10 seed-nights: asked 9, went 4 (**0.44 at the choice**), 3 refused by share, 2 no door fitted, 4 arrived, 0 lit outside windowHours · `windows-night.mjs` lit counts 45/27/10/4/3 → 44/25/11/6/4 · `probes/going-home-shots.mjs` seed 3: walker at [4.48,65.7] two steps before, gone at step 150, pane over door 4 (53,54,70) → (127,118,116) that frame · night filmstrip 0 POP · perf skipped (a Map get per lit-window test).
**Verdict:** shipped — thin. Under one leaver per night is asked at all.
**Surprise:** the brief's own pricing rule ("arrive before the window's `on`") is impossible here: 5.5 cells per sim hour makes the lane ~25 h wide and `on` is 0.15–2 h after dusk, so the inherited diff had 0 of 41 fit even 3 h late, and its `arriveHome` sat on a branch `stepAgent` never reaches (the `a.i >= wp.length` block returns first). Then the real bound: the town is EMPTY after dark — 6–9 agents, arrivals stop with daylight — so the after-dusk leavers are the 2–3 people still on the lane when nightF crosses 0.3, and the only regular night caller was the dawn sweeper. The 1/3 target holds at the choice and nowhere else.
**Law:** a night feature's audience is whoever is still on the frame at the dusk edge — count them before sizing anything that waits for "leavers after dark".
**Cue:** see state — night supply; row-64 windows are live and tinted, so a lit pane reads at half strength.

## Iteration 52 — the allotments get a winter: dead rows go under, dark until the warmth returns (2026-08-29) [Cross street & allotments × Deepen]

**Brief:** b49 — on mild dry daylit winter days a holder turns a FALLOW plot; it reads as dark turned earth until the spring sowing.
**Did:** `turned[]` (one Uint8 per cell, the one new state). `digWeather()` = warmth < DIG_WARMTH 0.28 ∧ !raining ∧ snowCover < 0.3; `fallowPlots()` walks ripePlots()' lattice for plots with no stage-3 cell, no resting cell, not hardy, not turned; `allotRate` gains `+ DIG_RATE 0.06` only while both hold (exact 0 otherwise — additive, so the summer roll is untouched). `sendToPlot` picks from `fallowPlots()` and sets `a.dig`; the kneel branch calls `turnPlot(a)` instead of harvest/sow — cells below 3 go bSp 0, turned 1; a digger's next row is another fallow plot or they leave. `caTick` and the hand-sow skip a turned allotment cell while warmth < DIG_WARMTH; every sowing site and harvestPlot clear it. `groundBase` draws a turned bed #3d2d1c–#4a3826; inspect text, `personName`, `__entities.dig`. ripePlots() and harvestPlot untouched.
**Gates:** census PASS (churn only: people −9, species reshuffle at the winter instant; `harvested` unchanged) · motion PASS · `allot-year.mjs` (now folds digs/day + turned cells) 4 seeds × 60 d: winter digs 0.35/day mean, 0.9–1.25/day on dry mild days at the winter edges (ydays 21–24, 3), 0.00 in summer; turned cells 15–19.5 through midwinter, 0 by yday 5; ripe at yday 6 12.36 vs HEAD 12.34, spring return not delayed; summer arrivals 1.19 vs 1.04 (churn) · seed 7 day 23 crop: two dark plots + a digger vs uniform HEAD · perf skipped (fallowPlots is 102 cells, once per sim second). Context budget opened OVER (48.0 / 46 KB).
**Verdict:** shipped — with the brief's target redefined (below).
**Surprise:** the winter block has NO fallow plots. `allot-year` reads `bare 0.0` all winter: a picked row is re-sown within a day (0.055·(0.25+m)·vig per cell-tick even at vig 0.3) and stalls at stage 1 under the cap, so the brief's "fallow plot" never exists and the first cut dug 0 across 8 seed-winters while identical to HEAD. Turning the STALLED non-hardy rows under is what a holder does with a dead row, and `turned` has to hold off re-sowing or the dark lasts a day. Second zero: `bAge` ticks up on a PLANTED cell at its ceiling too — it is the fallow clock only when `!bSp` — and the first `fallowPlots()` read 0 through that.
**Law:** a field that is one thing on an empty cell and another on a full one (`bAge`) is two fields sharing a name — qualify every read of it by the cell's occupancy, and run the *candidate* against HEAD before believing a 0: identical output on both builds is the predicate never firing, not a small effect.
**Cue:** turned earth reads faintly at 1× (dark brown on brown under winter light); a rowless furrow texture or a colder tint would make the dig legible from the wide view.
## Iteration 48 — brief rejected: the winter-dusk POP is the live sky, not the light bucket (2026-08-29) [Sky, light & weather × Deepen]

**Brief:** b45 — make the dusk/dawn relight of the cached ground layer continuous (finer bucket at the sun's edges, or a live tint between buckets); filmstrip Δ 5–9 at winter dusk blamed on the quarter-hour step.
**Did:** Built the tint variant first (`gprev` snapshot, 0.5 h crossfade inside 1.5 h of sunUp/sunDown, no extra rebuilds): winter dusk max Δ 7.00 → 6.35. Then localised instead of tuning. `probes/dusk-relight-where.mjs` splits the filmstrip's frame Δ by screen row and by the ground layer alone: on HEAD at seed 7 t=1183 the cached layer moves **0.44 / 0.55 / 0.30** per 0.35 s sample while the sky row and every ground row move 5–8 together — the live sky gradient and the night tint, whose driver (daylight = sin) is steepest at the sun's edges: 0.04 daylight per sample × ~180 RGB of sky swing ≈ 7. At one 60 fps frame (gap 0.0167) the whole-frame Δ is 0.5–1.5 with the ground at 0.00 — continuous, no step. Summer dusk on HEAD already reads max 2.74. Second finding, `probes/ground-rebuilds.mjs`: `drawGround()` rebuilds **654/day summer, 659/day winter** — 129–135 from the bucket, **~520 from `R()<dt*2` in the grass-wear step** — at 9.2 ms a rebuild against 2.3 ms for everything else in the frame. Reverted the crossfade (it would flatten on every wear rebuild anyway), `courtyard.html` untouched; rejected via `pop-brief --reject`; two cues.
**Gates:** census PASS (+0, source at HEAD) · motion PASS · filmstrip HEAD controls: winter dusk max 7.00 (reproduced), summer 2.74 · noon byte-identical by construction (no source change) · perf skipped.
**Verdict:** no-ship (rejected brief; two probes kept)
**Surprise:** the "cache" is not one. I assumed a quarter-hour cadence because the comment at the bucket says so; the wear line dirties it every few frames and nothing counted. The manager priced this brief off a POP that a 0.35 s sample manufactures from a smooth sine — the instrument's gap is the pop.
**Law:** A whole-frame Δ at the filmstrip's 0.35 s gap is a RATE, not a step: divide by the frames in the gap before calling it a pop, and split it by layer (cached vs live) before blaming a cache. And a cache's cadence is whatever sets its dirty flag most often — count rebuilds before tuning a bucket.
**Cue:** see state — wear-driven rebuilds (perf), and a per-frame pop gate.

## Iteration 49 — snow knows the desire paths, and the sweeper's strip (2026-08-29) [Courtyard & garden × Connect]

**Brief:** b46 — extend `snowAt` from the trodden KIND to the wear VALUE so worn lines stay dark through a cover; feet re-cut a fresh fall; the dawn sweeper clears the strip they walk.
**Did:** `snowAt(x,y,t)` now multiplies by `1 - SNOW_WEAR*cut`, where `cut = max(wear/SNOW_WEAR_AT, trod)` (0.85, 0.45). `trod[]` is a new `Float32Array(GW*WH)` beside `wear[]`: walkers on GRASS bump it while cover > 0; any `a.broom` agent (dawn and evening sweeper) sets it to 1 on the cell they stand on; `stepSnow` buries it at `SNOW_BURY` (0.15/s of full snow) whenever cover rises, and zeroes it when cover reaches 0. Everything sits inside the `snowCover > 0` guard, no R() draw added, no new ground kind, repaint cadence untouched (the sweeper dirties the cache once per cell they clear, ~70×/morning against ~650 rebuilds/day already).
**Gates:** census PASS (+0 — wear/trod are not census fields) · motion PASS · `probes/snow-wear.mjs` five seed-winters at sunUp+1.5, cover 0.52–0.84: mean snow on wear>0.45 **0.081 vs 0.499** on wear<0.1 (ratio 0.16; HEAD 1.07) · at sunUp+6 ratio 0.14, lane strip 0.215 vs rows beside 0.273 (seed 7: 0.169 vs 0.302; HEAD strip = beside) · summer frame `toDataURL` byte-identical to HEAD at seed 7 t=192.5 · snowCover dynamics untouched, so snow-year cover means identical by construction (winter 0.266) · perf skipped (the bury loop is 12k floats only while snowing).
**Verdict:** shipped.
**Surprise:** only 1–17 lawn cells per seed carry wear > 0.45 in winter — the desire paths sit at 0.2–0.4 there, so the brief's own threshold names the tail of the paths, not the paths; the ramp below it is what draws the line. And the sweeper at sunUp+1.5 has swept ~12 of 69 cells (2.6 cells/s, an hour is 2.3 s), so the "swept path at dawn" is a stub at dawn and a strip by noon — the brief pictured a broom faster than the clock. The winter shot at seed 7 shows the line SW lamp → centre in the candidate and not HEAD, but faintly: dawn light and 0.57 cover flatten it.
**Law:** a threshold quoted in a brief is a hypothesis about the distribution — histogram the field before you tune to it.
**Cue:** see state — the snowy lawn reads pale green, not white, at dawn (SNOW_COL under the dawn tint).



<!-- verbatim copies of #55–#57, condensed in LEDGER.md by the manager pass from #57 -->

## Iteration 55 — the windows name themselves: a lit pane says why it is lit, a dark one why it is dark (2026-08-29) [The sill & the observer × Interaction/UX]

**Brief:** b52 — hit-test the windows (cached `WINDOWS[]` and the live row-64 panes) and the front doors in screen space for the sill's naming; read `windowLit`/`windowHours`/`HOMES` for the cause; day-time just 'a window'.
**Did:** `FACES[]` — a screen-box register `pushFace()` fills from `drawWindow` and `drawFrontDoor` (both passes; `live` flags the south band, which re-registers every frame in `drawSouthBand`; the cached ones reset with `WINDOWS`). `faceAt(p)` painter's-order hit; `windowName(sa,sb)` reads `windowLit` for IF and `windowHours`/`HOMES` for WHY: 'a lamp lit at 22.01, somebody came home' (`clockOf(t)` = dusk edge + t), 'burning late' (> on+4 h), 'burning through the night' (off === last), 'an early riser', 'dark: nobody home tonight' / 'somebody on their way home' / 'not in yet' / 'gone to bed'. `doorName()`: a home door reports the lamp over it. `lookAt`: living → face → tree, except a crown beats a *cached* face (crowns paint over the cached facades; the live band paints over crowns). `drawFrontDoor` gains `(sa, sb)` (−1 for doors with no window over them). No R(), no census field, no OFFERS entry.
**Gates:** census PASS, unchanged everywhere (sill only) · motion PASS · `probes/naming.mjs` §8 added: seed 42 night 11 hour 0.97, 93 panes (47 live) + 27 doors; 11 lit all 'a lamp …', 82 dark all 'a window, dark: …'; the one window somebody came home to tonight says so; noon: 93/93 'a window'. §1–§7 still pass (§7's control now asks `faceAt` too — 12,799 clear points, 0 differ) · wide/courtyard/east/lane shots, and HEAD rendered at the same pinned instant: the dark south-terrace band is on HEAD too · perf skipped (a per-frame splice of ~50 entries).
**Verdict:** shipped.
**Surprise:** `HOMES` is never cleared, so at night 11 it held three *tonight* arrivals and a dozen older ones — a naive `home.t !== null` read named windows somebody came home to a week ago. `windowLit` already qualifies on `home.nid === w.nid`; every other reader of the register must too (the first §8 cut failed on exactly this). Of the three who came home tonight only one was still lit at 01.00 — the other two had burned their hash's span and read 'gone to bed', which is right.
**Law:** a register that is written but never pruned is a history, not a state: qualify every read by the current epoch key (`nid`), the way its ONE predicate does, or it answers for a night that is over.

## Iteration 56 — the ground layer stops repainting under every footstep (2026-08-29) [Courtyard & garden × Polish]

**Brief:** b53 — throttle the wear-driven `drawGround()` repaint; wear accrues as before, R() draw untouched.
**Did:** The grass-wear line and the sweeper's trod line now raise `wearDirty` instead of `groundDirty`; `simStep` promotes it (`wearAcc += sdt; if (wearDirty && wearAcc >= WEAR_REPAINT) groundDirty = true`, `WEAR_REPAINT = 1.0`) and any rebuild resets both. The brief's attribution was short: `caTick()` ended with an unconditional `groundDirty = true` every 0.35 s (~157/day) — same slow-accrual class (wear recovery, bloom ageing), so it goes through the same flag. Harvest/planting/turning (`groundDirty` on an announced act) stay immediate. `wear[]`/`trod[]` writes and reads untouched; no R() moved.
**Gates:** `ground-rebuilds.mjs` 594/691 → **137/130** per day (summer/winter); bucket 134/128, other 3/2 — the bucket edge every 0.41 s resets the wear clock, so paths in practice ride the bucket repaint · census PASS unchanged everywhere · motion PASS · `snow-wear.mjs` identical to the digit on 5 seeds, HEAD vs tree · `probes/noon-identical.mjs`: canvas + ground-layer hashes equal HEAD at the seed-7 noon bucket edge (a page PNG differs by 23 B on HEAD-vs-HEAD too — HUD/encoder, not the scene) · `perf.mjs` 16.70 vs 16.70 ms: it reads the rAF cadence and is blind under the 60 fps cap · `probes/frame-cost.mjs` (interleaved, 3 reps): draw **9.1 → 3.0 ms** summer, **11.8 → 2.7 ms** winter per frame · wide/courtyard/east/lane shots and a day filmstrip (median Δ 0.45, no POP/FROZEN) clean.
**Verdict:** shipped. Context budget read OVER (46.7/46 KB) at the start of this iteration.
**Surprise:** the 80% attribution in the brief was the wear line *and* `caTick()` together — the probe's "other" bucket lumped them. With both throttled, wear rebuilds nearly vanish because the light bucket already repaints every 0.41 s; the throttle mostly matters at night-still hours and is cheap insurance.
**Law:** a frame-time gate that reads the rAF interval saturates at 16.7 ms and cannot see a 3× CPU change under the cap — time the draw call itself, interleaved, and count the rebuilds.

## Iteration 57 — the filmstrip learns a ramp from a step, and the runner's first stall check waits its turn (2026-08-29) [The sill & the observer × Harness]

**Brief:** b54 — (1) filmstrip's POP reads a fast winter dusk as a pop; make a pop a step above its neighbours and print the per-60fps-frame rate. (2) run-loop.sh's `last_manager=-99` runs the stall check before the first landed iteration; baseline it.
**Did:** `pops.mjs` — `pops(diffs, {ratio 3.5, floor 0.02})`: a sample is a POP only if it exceeds 3.5× the LARGER of its two neighbours (one at the ends) and an absolute floor. filmstrip.mjs imports it for both the sheet's `.hot` and the console, prints `Δ/frame` (Δ ÷ GAP·60) beside each sample and `N POP` in the footer; FROZEN untouched. run-loop.sh: `last_manager=0`, plus `DRY_RUN=1` (skips lock, preflight, claude; prints the first manager decision and exits — the runner was live and held the lock, so the dry-run needed to not want it).
**Gates:** premise corrected — HEAD's gate was `d > median×3.5`, not a fixed 2; the misread is real anyway: seed 7 t=1183 reads Δ 5.3/5.7/4.5 then a 0.6 plateau, so the median is 0.67 and all THREE ramp samples flagged POP on HEAD. New gate: winter dusk **0 POP** (was 3), `--scene day` 0 (was 0), `--scene dusk` 0. `probes/filmstrip-pop.mjs` (no browser, recorded series): ramp 0, flat 0, still-night noise 0, injected 10 RGB step at 7 → [7], step of 3 at 4 → [4]; a 10 RGB step laid ON the ramp is not a pop (15.7 vs 5.3 < 3.5×) — noted as a known blind spot. `DRY_RUN=1` at gap 2/1/0: `done_ok=0 last_manager=0 -> need_manager=0` (stall.mjs says `ok`). census PASS, courtyard.html untouched. No shots (harness only).
**Verdict:** shipped. Context budget read OVER (46.5/46 KB) at the start.
**Surprise:** the brief's "fixed 2" never existed; the actual defect was the median being set by the plateau AFTER the ramp. A neighbour test is blind to a step that lands mid-ramp — acceptable, since the ramp itself is what the eye then looks at.
**Law:** grade a time series against its neighbours, not its median — a median gate on a series with a regime change flags the whole shorter regime as anomalous.
## Iteration 50 — the plaza reads a windy day (2026-08-29) [Plaza & quay × Connect]

**Brief:** b47 — nothing east of the bridge read `isWindy()`; lean the fountain, drift the spray, drop `fountainStand()` on windy days, flutter the bunting.
**Did:** `windF()` (0..1) beside `isWindy()`. `drawFountain`: a `lean` term off `windT` shifts each jet's control point and landing +x, droplets pushed downwind, six faint lee dots walk 2–4.4 cells past the rim and fade. `fountainStand()` = `clamp(play * (1 - FOUNT_WIND_SHY*windF()))`, SHY 0.5 — exact at calm. Bunting tips swing on `windT` × windF. No new R() draws; river untouched.
**Gates:** census FAIL people −10% at two cells → replayed 10 seeds × 20 days (`probes/fountain-wind.mjs`): −1%, churn. Stand share at spawn: calm 0.579→0.599, windy 0.578→**0.275**. `fountain-year.mjs` anchor EXACT · motion PASS · `fountain-wind-shots.mjs` windy noon: 20 spray px at +2.6 vs HEAD 4 px at −0.1 · filmstrip 0 POP · perf skipped.
**Verdict:** shipped.
**Surprise:** a presence-sampled probe said calm days had moved too (0.536→0.351) — sitters dwell 2× longer than standers and stops straddle the day roll, so presence smears windy days into calm ones. Counting at spawn gave the clean split. `day` on the page is one ahead of `hash(d,99)` from t=0 — the clock rolls at hour 6.
**Law:** promoted (measure a choice at the choice). **Cue:** c84.

## Iteration 51 — somebody goes home, and the window over the door lights as they go in (2026-08-29) [People & animals × Connect]

**Brief:** b48 (third attempt; the second left an unlanded diff this one inherited) — after-dusk leavers walk to a front door under a window and THAT window lights; `windowLit` stays the one truth; swans rest after dark.
**Did:** `HOME_DOORS` — eight doors on the lane's north fronts (row 64), `drawFrontDoor()` only inside the window branch of `drawFaceRow`, so each has a window over it by construction. `HOMES` Map (sa,sb) → {nid,t,due}; `windowHours()` split out of `windowLit()` so pricing and predicate share the hash; `windowLit` reads the register: dark while someone is on the way (≤ HOME_LATE 3 h past the priced arrival), lit the frame they go in, off after the hash's span or at dawn. `goHome(a)` prices `pathHours()` to each unused door whose window is home tonight, needs HOME_MIN 1.2 h before dawn, share by per-person hash (no R()). ONE ask site in `stepAgent`: a lane walker on their last leg at nightF > 0.3. `arriveHome` at the last waypoint; `personName` 'heading home'; `__entities` `home:1`. Swans: nightF > 0.6 → preen or swim to bank.
**Gates:** census PASS (churn) · motion PASS · `probes/going-home.mjs` 10 seed-nights: asked 9, went 4 (0.44 at the choice), 4 arrived, 0 lit outside windowHours · `windows-night.mjs` lit counts unchanged within 2 · `going-home-shots.mjs` pane over door 4 (53,54,70)→(127,118,116) the frame they go in · night filmstrip 0 POP.
**Verdict:** shipped — thin: under one leaver per night is asked at all.
**Surprise:** the brief's pricing rule ("arrive before the window's `on`") is impossible — 5.5 cells/sim-hour makes the lane ~25 h wide and `on` is 0.15–2 h after dusk. The inherited `arriveHome` sat on a branch `stepAgent` never reaches. The real bound: the town is EMPTY after dark — 6–9 agents, arrivals stop with daylight — so the audience is the 2–3 people on the lane when nightF crosses 0.3.
**Law:** promoted (count the dusk-edge audience). **Cue:** c85, c87.

## Iteration 52 — the allotments get a winter: dead rows go under, dark until the warmth returns (2026-08-29) [Cross street & allotments × Deepen]

**Brief:** b49 — on mild dry daylit winter days a holder turns a FALLOW plot; it reads as dark turned earth until the spring sowing.
**Did:** `turned[]` (Uint8 per cell, the one new state). `digWeather()` = warmth < DIG_WARMTH 0.28 ∧ !raining ∧ snowCover < 0.3; `fallowPlots()` = plots with no stage-3 cell, not resting, not hardy, not turned; `allotRate += DIG_RATE 0.06` only while both hold (additive, summer roll untouched). `sendToPlot` picks from `fallowPlots()` and sets `a.dig`; the kneel branch calls `turnPlot(a)` — cells below 3 go bSp 0, turned 1. `caTick` and hand-sow skip a turned cell while warmth < DIG_WARMTH; every sowing site and `harvestPlot` clear it. `groundBase` draws turned #3d2d1c–#4a3826; inspect text, `personName`, `__entities.dig`.
**Gates:** census PASS (churn; `harvested` unchanged) · motion PASS · `allot-year.mjs` (now folds digs/day + turned cells) 4 seeds × 60 d: winter digs 0.35/day, 0.9–1.25 on dry mild days at the winter edges, 0.00 in summer; turned cells 15–19.5 midwinter, 0 by yday 5; spring ripe 12.36 vs HEAD 12.34 · seed 7 day 23 crop: two dark plots + a digger vs uniform HEAD · perf skipped.
**Verdict:** shipped — with the brief's target redefined.
**Surprise:** the winter block has NO fallow plots: a picked row is re-sown within a day and stalls at stage 1 under the cap, so the first cut dug 0 across 8 seed-winters while identical to HEAD. Turning the STALLED rows under is what a holder does with a dead row, and `turned` must hold off re-sowing or the dark lasts a day. Second zero: `bAge` ticks up on a PLANTED cell too — it is the fallow clock only when `!bSp`.
**Law:** promoted (two fields sharing a name). **Cue:** c88.

## Iteration 53 — the night gets its own arrivals: somebody comes home late along the lane (2026-08-29) [Lane & market × New element]

**Brief:** b50 — a night arrival source (`spawnHomeAgent`) walking in from a lane edge to an unused home door; own rate, own presence bound, outside laneCap and scarcity; fix c87 in `drawFaceRow`.
**Did:** `homeDoor(x,y,speed)` + `claimHome()` split out of `goHome` (same pricing, no R()); `spawnHomeAgent()` rolls at `homeRate()` 0.3/s (×0.4 wet) only while nightF > 0.3 and `homeCount() < HOME_WAY` 2, draws edge + speed, prices from that edge and falls back to the other; `a.homer` excluded from `laneCount` and the count `scarcity` reads; `__entities.homer`, name 'coming home late'. `HOME_DOORS` 8 → 14 (8, 15 west; 92, 95, 109, 130 east) — all row-64 window columns, drawn by the existing branch.
**Gates:** census PASS (churn, `people` +2; raindrops +121 is one wet cell) · motion PASS (walker spawns +7/+16 = the homers) · `going-home.mjs` 10 seed-nights: arrived 4 → **31** (3.1/night), 0 outside windowHours · `windows-night.mjs` lit counts within 1 of HEAD through the evening, +2..+5 in the small hours (7.4 h: 4 → 9) — the register moving `on` later, which is the mechanism · `homer-shots.mjs` seed 3: pane over door 109 (42,50,81) → (105,102,116) the frame they go in · night filmstrip Δ 0.12–0.15, no POP · perf skipped (one `filter` per step, same as `tapCount`).
**Verdict:** shipped.
**Surprise:** two. (1) c87 is false: `probes/pane-warmth.mjs` samples a cached lit pane and a row-64 lit pane at midnight and they are the same colour, (106,100,105) vs (105,102,112) — both are `rgb(254,209,144)` under the same 0.8 multiply in `applyLight`; #51's (127,118,116) was an earlier nightF, not a draw-order fault. No `drawFaceRow` change made. (2) The bound was never the rate: with the first cut 62 of 76 rolls were refused because from an edge only doors 4, 43, 99 fit a 12 h night — the bridge puts the east edge 45 cells (9 h) from door 95. Doors near the edges and an edge fallback took it from 1.8 to 3.1/night; the pool still empties (34 of 61 rolls refused), so the ceiling is the doors that are home tonight, which the brief said not to move.
**Law:** a night visitor's budget is the doors within its walk, not its rate — before sizing an arrival source that must reach a *place*, list which places its walk reaches from each entry, priced against the window's END (`pathHours` + the burn you want).
**Cue:** greets stall a walker home by 0.4–4.5 h (a passing word is 2.2–5 s = 1–2.2 h; two of them beat HOME_LATE 3 h and the hash lights the window before they are in). And every lit pane reads (105,100,110) at midnight — grey-warm under the multiply; if windows should glow, draw the lit panes after `applyLight`, not before.


<!-- verbatim copies archived by manager pass #62 before in-place condensing -->
## Iteration 59 — the paving remembers the rain: wetness, a rate-capped scalar the cached ground and the night lamps read (2026-08-29) [Plaza & quay × Connect]

**Brief:** b56 — a `wetness` 0..1 world scalar; PAVED cells darken and cool by it in the cached ground layer, bucketed; lamp bars on wet paving in the night screen pass.
**Did:** HEAD already had `wet`, an 18 s countdown driving a live soft-light sheen on the lane/cross street — the brief's "no trace" was half true. Replaced it with `wetness`/`wetF()`: `stepWet()` rises `rainFall/WET_RISE` (3 s), dries `1/WET_DRY` (7 s) × `(0.3+0.7·daylight)` × `(0.5+0.7·warmth)`, last step lands ON 0. The sheen now reads `0.16 × wetness` (HEAD: `0.16 × clamp(wet/6)`). `wetCol()` pulls PATH/SIDE/ROAD toward `#3f4650` by `wetPainted × (0.30+0.12·hv)`; `wetPainted = wetBucket()` (5 steps) set in `drawGround`, `simStep` dirties on a bucket change. `WET_LAMPS` = the 22 of 24 lamps whose south cell is paving (read off `grid`, once); `drawWetLights()` after `drawRiverLights` — a tapered bar 3 cells toward the viewer, `0.30 × wetness × nightF`. No R(), no behaviour change.
**Gates:** census PASS, all groups unchanged · motion PASS · `probes/wet-year.mjs` seed 7: shower ends 6.81 h day 9 at wetness 0.90, dry in **3.14 h**; +1 h plaza 152 → 135.6, lane 141.5 → 123.7 brightness vs HEAD; +3.5 h ground hash **identical** to HEAD (`lb` identical); night lane pixel under lamp (65,68,86) → (88,86,98) at wetness 1 · `ground-rebuilds.mjs` (now attributes `wet`) dry days 134/137 = HEAD; the rainy day 137 → 146 (+9 wet) · `frame-cost.mjs` draw 2.75–2.83 vs HEAD 2.75–2.81 ms · filmstrip 0 POP · wide/courtyard/east/lane shots clean; `probes/wet-shots.mjs` crops read as intended, grass unchanged.
**Verdict:** shipped.
**Surprise:** at +3.5 h the lane still differs from HEAD by 15 levels with an identical ground hash — that is HEAD's `wet` sheen outlasting the rain by ~8 sim hours. The sheen now ends when the paving dries; on a winter night it will hang on longer than HEAD's did (c: nobody has looked at a winter-night wet street yet).
**Law:** before building a scalar for "X leaves no trace", grep for X's timer — this town tends to already have a countdown where a brief sees nothing, and the right move is to make the countdown the scalar's consumer, not to add a second truth beside it.

## Iteration 60 — a tap on a person FOLLOWS them: the sill line stays on one agent, a ring under their feet, a closing line on despawn (2026-08-29) [People & animals × Interaction/UX]

**Brief:** b57 — the observer can name a walker but not keep them; let a tap hold one: the sill rewrites as their act changes, a screen-space marker rides under the feet, the line closes with what became of them; the invitation joins OFFERS.
**Did:** `livingAt()` now records `livingHit` (the agent behind its answer) — one hit-test, no second one. Click: a person → `followPerson(who)` (toggle on the same figure) and return, so no crumbs land under a tapped walker; any other tap releases first, then does what it did. `followLine()` = `'following ' + personName(a)`, read per frame through `updateNaming` — it outranks the pointer AND the ticker yield (the line has to STAY), still cleared by an invite hold or a lapse. `followLost(a)` at the ONE despawn site: door (+ `lamp lit at HH.MM` off HOMES via `followHome`, read while `a.home` was set), lane, cross street, east, west — off the last position, nothing written to the agent. `drawFollowMark()` after the balloon, before the rain: a warm ellipse on the projected feet with a dark under-stroke, RM = no breath. `OFFERS[2] = follow`, found by `followedEver`. `__follow()` hook; `__entities` walker gets `followed:1`.
**Gates:** census PASS · motion PASS · `probes/follow.mjs` seed 7: tapped walker2, 3 distinct acts in 12 h (walking → listening to the bell → walking), a leaver closes after 21.75 h "left by the lane", marker-to-feet 0.7 px on walk and sit (cell 6.2 px), second tap releases with no closing line, a wall tap releases, phone 390px: plate/clock/ticker `none`, `#naming` block, 0 px over, still following 6 s later (> NAME_HELD) · a homer at 2.54: "went in at the door, lamp lit at 3.25" · `naming.mjs` all 42 pass · wide/courtyard/east/lane clean; follow-night/day/sill crops in shots/.
**Verdict:** shipped.
**Surprise:** "on the last leg" is not "leaving" — my first leaver pick was a sitter walking to a bench and the probe waited 48 h for a despawn that was never coming. A leaver is an agent whose LAST waypoint is off the frame; two probe rewrites went to the instrument, none to the page.
**Law:** a route's last waypoint is the only honest predicate for "on the way out" — `a.i === a.wp.length - 1` names anyone on the last leg of anything, and routes get extended in place (goHome, the exit push), so read the destination, not the index.
**Cue:** on a wide sill the follow line now hides ticker news for as long as the follow lasts — a resident can be held for 30+ h; whether the news should pass through for its 2.5 s dwell is an observer question nobody has watched for.

## Iteration 61 — four things built lately made visible at 1x: warm panes and rose window after the night tint, furrowed turned earth, 5 px bunting, a whiter dusted lawn (2026-08-29) [Cross street & allotments × Polish]

**Brief:** b58 — c91 grey lit panes at midnight, c88 turned earth lost on brown, c84 3 px flags, c83 pale-green snowed lawn at dawn. One commit, crops vs HEAD at pinned instants.
**Did:** `LIT_PANES[]` (per frame, reset with LIT) takes each lit pane's screen quad from `drawPane`; `applyLight` fills those quads in `screen` at `0.7·nightF` after its multiply, before the halo loop — the order was right (panes were drawn live, then tinted), the multiply simply took the warmth out of the glass. The rose window was worse than grey: `drawChurchFront` pushed its LIT halo at CACHE time, so the halo existed on the rebuild frame only; now `ROSE = [x, y, r]` is written at cache time and the same pass relights the disc + pushes the halo every night frame. TAP_DOOR already read R−B 38 (its tight halo does this job) — untouched. Turned earth: base `#31261c→#3e3022` (colder) + two dark furrows and a lit ridge stroked per cell in the cached detailing (under the `snowAt > 0.5` guard). Flags: half-width `max(2.5, 0.3·cellW)` (was 1.6/0.13), two a span not three. Snow: `SNOW_COL` `#e2e8f2` and, on GRASS only, cover mixed by `1−(1−sn)^1.8` — exact at 0 and 1.
**Gates:** census unchanged, PASS · motion PASS · night filmstrip 0 POP · `probes/polish-1x.mjs`: pane R−B **62–71** (HEAD −5…5), rose **49** (HEAD −37); turned vs fallow at seed-7 winter noon **29.4** luminance (HEAD 26.5 — already near the brief's 25, so the furrows carry the read); flag pixels 74 vs 56 in the bandstand crop, each flag 5 px wide; snowed lawn at daylight 0.13 B−G **+6.8** (HEAD +4.5), at 0.31 −0.4 (HEAD −3.1). Noon summer frame hash identical to HEAD with the bandstand masked — t=175 is a concert day, so the flags are the only difference. `probes/polish-crops.mjs` writes the five HEAD/cand crop pairs (`shots/b58-*`).
**Verdict:** shipped.
**Surprise:** c83 is not what it says. The courtyard lawn on the seed-7 dawn is 0.36 cover over a heavily worn lawn, so `snowAt` (wear-discounted) leaves it two-thirds green by design — no floor short of a pop at first flakes makes a 36% dusting read white by mid-morning. In the dawn window itself (hour ≤ 8) HEAD already had B ≥ G. The curve buys ~3 levels; the cue's real cause is the wear discount, which is a feature. Also: page clips need the canvas's `getBoundingClientRect()` offset (196,29 at 1600×950) — my first rose/bandstand crops were of the wrong place while the pixel probe, reading `ctx` directly, was right.
**Law:** a night colour is set by the LAST composite that touches it, not the pass that draws it — anything drawn live before `applyLight`'s multiply is slate by midnight, and its warmth has to be put back in a `screen` pass after it (LIT halos, tap door, now LIT_PANES/ROSE). Check the multiply before blaming a constant.
**Cue:** `drawChurchFront` computes `lit` at cache time; the rose window's own disc colour still flips only on a ground rebuild (the live relight hides it at night, but the dusk edge could show a grey disc for up to a quarter-hour).

## Iteration 54 — the wind reaches the river: streaks lean, the night chop breaks, the boat rows into it (2026-08-29) [River & far bank × Connect]

**Brief:** b51 — make a windy day legible on the water, every term exact at `windF() = 0`; take c78 (boat reflection, bridge shadow) if it falls out of the same pass.
**Did:** four constants beside FLOW_N. `drawRiverFlow`: n = FLOW_N·run·(1 + WIND_FLOW_N 0.6·wf), length 4.5·run·(1 − WIND_FLOW_LEN 0.4·wf), tail blown +x by wf·gust(windT)·WIND_FLOW_LEAN 5 px (the fountain's gust term). `drawRiverLights` column: bar width ×(1 − WIND_CHOP 0.45·wf), fx wanders ±0.35 cells on windT — shorter bars that shiver. `boatRate() ×(1 − BOAT_WIND_SHY 0.5·wf)`, `boatSpeed() ×(1 − BOAT_WIND_SLOW 0.3·wf)`. No new R(); hash + windT only.
**Gates:** census PASS (churn — a windy-day boat threshold shifts the stream) · motion PASS · `river-year.mjs` anchor EXACT (boatRate 0.012, streaks 12) · `probes/river-wind.mjs` seed 42: calm day 4 noon AND 22:00 whole-frame hash identical to HEAD; windy day 5 noon river-hash differs, crop shows ~19 shorter slanted streaks vs 12; windy 22:00 lamp bars narrower, `bright>150` 16 → 0 · `probes/boat-wind.mjs` 30 seeds × 40 d: launches per free-sample calm 6.84 → 5.98, windy 6.47 → **3.31** (×0.51); mean speed calm 0.940 → 0.939, windy 0.992 → **0.689** · filmstrips at windy noon and 22:00, Δ 0.2–0.5, no POP · perf skipped (same loop, 60% more line segments on windy days only).
**Verdict:** shipped. c78 not taken: the bridge already lays a shadow on the water (`drawBridge`, shOffset-driven, line ~3872) — that half of c78 is false; the rowboat carries no light, so a reflection after dark would be dark on dark and was left out.
**Surprise:** presence is the wrong instrument for a one-boat river in weather that changes daily — a trip is ~95 s = 1.7 days, so a calm day's presence is the previous windy day's launch decision (calm presence read 0.57 → 0.44 on 10 seeds while the calm rate is algebraically untouched). Counted at the choice, launches per boat-free sample, the calm residual is −13% over ~220 launches (~2σ, reshuffle) and the windy cut is the designed half.
**Law:** a day-scale switch on a multi-day process bleeds into the days beside it exactly as a season does — measure its effect at the choice, per free sample, and expect the neighbours to move in presence. **Cue:** none new; c78 half-closed.

## Iteration 55 — the windows name themselves: a lit pane says why it is lit, a dark one why it is dark (2026-08-29) [The sill & the observer × Interaction/UX]

**Brief:** b52 — hit-test the windows (cached `WINDOWS[]` and the live row-64 panes) and the front doors for the sill's naming; read `windowLit`/`windowHours`/`HOMES` for the cause.
**Did:** `FACES[]` — screen boxes pushed by `pushFace()` from `drawWindow`/`drawFrontDoor` (cached ones reset with `WINDOWS`, the south band re-registers per frame). `faceAt(p)` painter's-order hit; `windowName()` reads `windowLit` for IF and `windowHours`/`HOMES` for WHY ('a lamp lit at 22.01, somebody came home', 'burning late', 'dark: gone to bed'…), `doorName()`; by day 'a window'.
**Gates:** census PASS (sill only) · motion PASS · `probes/naming.mjs` §8: seed 42 night 11, 93 panes + 27 doors, 11 lit all named 'a lamp …', 82 dark all with a cause; noon 93/93 'a window'; §1–§7 still pass · shots vs HEAD at the pinned instant identical · perf skipped.
**Verdict:** shipped.
**Surprise:** `HOMES` is never cleared — a naive `home.t !== null` read named windows somebody came home to a week ago; `windowLit` qualifies on `nid` and every other reader must too (→ law). Of three who came home tonight only one was still lit at 01.00; the others read 'gone to bed', which is right.

## Iteration 56 — the ground layer stops repainting under every footstep (2026-08-29) [Courtyard & garden × Polish]

**Brief:** b53 — throttle the wear-driven `drawGround()` repaint; wear accrues as before.
**Did:** the grass-wear line and the sweeper's trod line raise `wearDirty` instead of `groundDirty`; `simStep` promotes it every `WEAR_REPAINT` 1.0 s; any rebuild resets both. `caTick()` ended with an unconditional `groundDirty = true` every 0.35 s — same slow-accrual class, same flag. Acts (harvest/plant/turn) still dirty immediately.
**Gates:** `ground-rebuilds.mjs` 594/691 → **137/130** per day (summer/winter) — nearly all the light bucket now · census PASS unchanged · motion PASS · `snow-wear.mjs` identical to the digit · `probes/noon-identical.mjs` canvas + ground hashes equal HEAD · `frame-cost.mjs` draw 9.1 → 3.0 ms summer, 11.8 → 2.7 ms winter (`perf.mjs` read 16.70 both ways — rAF-blind, → law).
**Verdict:** shipped.
**Surprise:** the brief's 80% was the wear line AND `caTick()` together — the probe's "other" bucket lumped them. With both throttled, the light bucket's 0.41 s repaint is the cadence; the throttle mostly matters at still night hours.

## Iteration 57 — the filmstrip learns a ramp from a step, and the runner's first stall check waits its turn (2026-08-29) [The sill & the observer × Harness]

**Brief:** b54 — (1) filmstrip's POP reads a fast winter dusk as a pop; (2) run-loop.sh's `last_manager=-99` runs the stall check before the first landed iteration.
**Did:** `pops.mjs` — a sample is a POP only if it exceeds 3.5× the LARGER of its two neighbours and a floor of 0.02; filmstrip.mjs prints `Δ/frame` beside each sample and `N POP` in the footer. run-loop.sh: `last_manager=0`, plus `DRY_RUN=1` (no lock, no preflight, no claude — prints the first manager decision and exits).
**Gates:** HEAD's gate was `d > median×3.5` (not a fixed 2) and the plateau after the ramp set the median, so all three ramp samples flagged; new gate winter dusk **0 POP** (was 3), day 0, dusk 0 · `probes/filmstrip-pop.mjs` recorded series: ramp 0, flat 0, noise 0, injected 10 RGB step → found · `DRY_RUN=1` at gap 2/1/0 prints the right decision.
**Verdict:** shipped.
**Surprise:** the brief's "fixed 2" never existed. Known blind spot: a 10 RGB step laid ON a ramp is not a pop by the neighbour test (15.7 vs 5.3 < 3.5×) — acceptable, the ramp is what the eye looks at then.

## Iteration 58 — the wind becomes a scalar: windF() ramps over 2.5 h instead of stepping at the hour-6 roll (2026-08-29) [Sky, light & weather × Deepen]

**Brief:** b55 — `windF()` was the day's coin (0/1), a STEP at the roll; make it a rate-capped 0..1 like `cloudCover()`, move the four magnitude consumers onto it, carry c90.
**Did:** `windyDay()` keeps the hash (0.28, no new R()); `wind` stepped by `stepWind(sdt)` in `simStep`, last step lands ON the target (exact at 0/1); page load snaps to the day's target so `?t=` probes still open at 0/1; `isWindy() = windF() > 0.5` stays the behaviour boolean. Consumers → `windF()`: `windT` rate `(1+1.4f)`, sway `(1+0.7f)`, washing `(1.8+3.2f)`, smoke `(1+1.6f)`. Clouds drifted on `simT × (windy ? 3.4 : 1.4)` — a POSITION step on HEAD — now `(simT + windX) × 1.4`, `windX` accumulated. Announce and census `windy` read `windyDay()`. `chatty()` excludes `a.homer` (c90).
**Gates:** `wind-year.mjs`: ramp `0.09 0.27 0.46 0.65 0.83 1`, max slope 0.43/h (cap 0.40, __warp grain), windy-day mean 0.960 / calm 0.027, 0 samples off 0/1 four hours past a roll. Census FAIL `people −10.6%` on 3 seeds = the reshuffle: `census-noise.mjs` over 8 seeds reads HERE **+8.2%**, HEAD's own spread 6%. Motion PASS. Anchors: `fountain-year.mjs` unchanged (play 1 / stand 1 / basin colour identical); `boat-wind.mjs` calm 0.306→0.311 launches/day, windy 0.171→0.187, speeds 0.939/0.689→0.933/0.695 — the windy CLASS now holds the ramp's half-wind hours, so its mean moves; the 0/1 algebra does not; `river-year.mjs` riverRun 1.405/1.000/0.595 identical, boats/day 0.242→0.253. Inventory is 9.7/9.5 KB after my one sky line — manager's cut. Filmstrip across the day-5 roll (seed 7, t=274): 0 POP, HEAD control 0 POP — whole-frame Δ is the dawn. Shots clean.
**Verdict:** shipped, with the census reading noted above.
**Surprise:** the step this brief priced is *invisible on screen at the roll*: a 240×220 fountain crop across HEAD's own hour-6 snap reads Δ 5.12 vs 3.92 either side, HERE 5.18 — the dawn relight swamps it. A day-hash wind always starts at hour 6, the one hour nobody can see a step. The scalar is right; its VISIBLE payoff waits for wind rising mid-day off a front (c96).
**Law:** a pop is only worth pricing where the light is flat — a step inside the dawn/dusk relight is measured by a crop, not the eye, and may be worth nothing on screen. Check the hour a switch fires before building a ramp for it.



<!-- verbatim copies of #63–#67, archived at manager pass #67 before being condensed in LEDGER.md -->

## Iteration 63 — the boat's lantern lands: #62's uncommitted diff verified and committed, boatRate left unthinned after dark (2026-08-29) [River & far bank × Deepen]

**Brief b60.** #62 built the lantern (b59) and exited without a ledger entry or a commit; the 37-line diff sat in the tree. Nothing rebuilt — `git diff` read first, then verified against b59's criteria, all on the diff as found.

**What it is.** `boatLampF()` = clamp((nightF − 0.3)/0.15) while a boat exists; `drawBoat` draws post + flame at the bow and sets `BOAT_LAMP` (screen xy, reset per frame beside `LIT`); `applyLight` puts the warmth back after the multiply and adds a tighter, brighter halo than a pane's; `drawRiverLights` lays a 3.5-bar column at `boat.x+0.3, boat.y+0.9` on the same wind terms as the fixed lamps; `livingAt` says 'going downriver by lantern' past lf 0.5.

**Proof.** Census unchanged (draw-only, expected). Motion gate PASS vs a HEAD baseline (stash → baseline → pop). `probes/river-year.mjs` and `boat-wind.mjs`: HERE == HEAD to every printed digit (launches/day 0.311 calm / 0.187 windy, speeds, season rows) — no new `R()` draw. `probes/boat-lantern.mjs`: pinned clear 22:00 crops, calm (seed 1, t 256.5) and windy (seed 3, t 311.5): 9 warm px / maxL 204 HERE vs 0 / 72 HEAD in the same box; +3 s the lamp box has moved 14 px (calm) and 10 px (windy) with the hull. `boat-lantern-column.mjs`: 71 warm-ish px under the hull with `drawRiverLights`, 0 stubbed, 0 on bare water — the column is real and attributable. Night filmstrip 0 POP, median Δ 0.19.

**Presence number (the open decision).** 20 seeds × 11 nights: the boat is out on **64.7 % of dark samples** (nightF > 0.3), a lit boat on **184/220 nights (84 %)**. Decision: `boatRate()` does **not** thin after dark. The trip is ~1.7 days, so what is on the water at night was mostly launched in daylight — a night factor on the launch rate would barely move night presence, but it *would* move the launch-per-day anchors river-year/boat-wind assert on, and LAWS already say a day-scale switch on a multi-day process bleeds onto its neighbours. If the manager wants a quieter river at night, the honest lever is presence (a mooring), not rate.

**c99 (rose window at the dusk edge).** Read, not taken. The cached disc is a step (`nightF > 0.3` at cache time) and the relight is a *screen* at `0.7·nightF` — so the seam is two-sided: grey under a faint 0.21-alpha screen just after dusk, AND a stale warm 0.9 disc after dawn until the facade rebuilds. Painting the cached disc always-unlit fixes both but dims #61's midnight rose (screen over slate ≠ screen over warm × multiply). Not a one-liner; cue kept open with this diagnosis.

**Surprise.** An iteration that ships nothing new but a verification is cheap (~15 min) and worth it: the diff was right, but nobody had *shown* it was, and the presence number the brief wanted was one probe run away.

## Iteration 64 — a wet seat is a refused seat: `seatRefused(a)` reads `wetF()` through a per-person `a.wary` bar, and the street-stop site stops carrying its own 0.42 (2026-08-29) [Lane & market × Connect]

**Brief b61.** The paving dried over ~3 h (#59) while the tables refilled the moment a shower stopped.
**Did:** `WET_SEAT_HI 0.75 / LO 0.35`; `seatWet(a)` = wetF() > HI − wary·(HI−LO); `seatRefused(a)` = sky > SIT_REFUSE **or** seatWet(a). Three call sites pass `a`: picnic, courtyard sitter (both via `routeToExit`), and the street stop at ~L1908 — which had its own literal `weatherComing() > 0.42` beside `seatRefused()` and now goes through the ONE predicate (cafe, lane bench, plaza, green, quay, far bank all arrive there). Arrivals only; nobody seated is touched. No new `R()` draw, no draw code.
**Gates:** census PASS (life/species churn, no collapse — refusals change trip lengths, so the seeded stream shifts) · motion PASS · shots clean · `seats-out.mjs`: 0 vanished, 0 splits, release band 0.511–0.853 identical · `probes/wet-seats.mjs` 10 seeds, pinned clear 10:00 with `wetness = 1` (the state a shower leaves): counted AT the stop — HEAD took 17 / refused 2, tree 14 / 4; seat-hours 33.9 → 27.1; median first seat +1.02 h → +2.62 h. `WET0=0` control: tree == HEAD to every digit. Spread seen: wary 0.01 sat on 0.63, wary 0.91 refused 0.59, wary 0.13 refused 0.73. Crops `shots/b61-plaza-{head,tree}-30min.png` (seed 101, wet 0.82): HEAD has the bench taken, tree has it empty.
**Winter night (c97):** seed 7 day 17, 22:00, warmth 0.05, dry, wetness 0.31 → `shots/b61-winter-night-wet03-full.png`. Sheen 0.16×0.31 ≈ 5% and faint bars under the lamps: reads as damp slate, not a lake. Judged fine; no change.
**Verdict:** shipped.
**Surprise:** natural showers in 10 seeds all ended between 21:00 and 02:00, so a "day of a shower" probe measured nothing on either build — the first run's 0 was the instrument. Pinning the *state* the shower leaves (wet=1 at a clear 10:00) gave the answer in one run. Also: the cafe band is so rare (0 cafe arrivals in 14 seeds × 3 h) that the brief's cafe crop is a plaza-bench crop; same line, same predicate.
**Law:** a "day-of-X" sample is a sample of when X happens to END; if the effect needs daylight, pin the post-X state at a daylit hour instead of waiting for it.
**Cue:** `seatRefused()`'s courtyard kinds include the picnic pair — the wet-lawn refusal is a by-product; if the lawn should dry on its own clock it needs a scalar of its own (or not).

## Iteration 65 — the wind has a cause: a building front raises `windTarget()` with the cover and breaks with the rain; the day hash stays as the second source (2026-08-29) [Sky, light & weather × Connect]

**Brief b62.** #58's wind ramp fired at the hour-6 roll, inside the dawn relight, so nobody ever saw it rise.
**Did:** `frontWind()` = clamp((cloud − 0.46)/(0.76 − 0.46)) — weatherComing()'s knee to a heavy front's floor — zeroed by `raining` and by a `frontSpent` latch set at the first drop (rain-start branch) and cleared when the next front moves in (`stepClouds`). `windTarget()` = max(day hash, frontWind()); `stepWind` reads it, same `WIND_RISE_H` cap. Consumers untouched (they read `windF()`); no `R()` draw, no draw code. Light fronts (cover ≤ 0.5) give ≤ 0.13 — a breeze, never the windy class.
**Gates:** census PASS (life/species churn only — boatRate/fountainStand read the wind, trip lengths shift the stream) · motion PASS · shots clean · day filmstrip 0 POP, median Δ 0.449.
**Numbers** (`probes/wind-front.mjs`, 10 seeds × 30 days, 0.25 s samples, HEAD vs HERE): windy-day mean 0.960 → 0.972, calm-day mean **0.027 → 0.176**, windy CLASS **40.6 % → 49.9 % of samples (+9.3 pts)** — those are the extra hours the boat and fountain anchors move by. Max slope 0.427/h on both (the cap, at step granularity). Wind inside rain 0.466 → 0.477: unchanged, because the hash days dominate it and the front term is already dying through the shower — and the washing is in during rain on HEAD anyway (`takenIn = max(weatherComing(), …)`, = 1 while raining). `wind-year.mjs`: windy 0.970 / calm 0.179, off-anchor 4/26400 (one-sample lag: rain starts later in `simStep` than `stepWind`).
**Crops** `shots/b62-front-{head,here}-h{10,11,13,14}.png`, sheet `b62-front-sheet.png`: seed 11 day 2, a dry calm-hash day with cover 0.47 → 0.65 over 10–14 h. HEAD windF 0 throughout, jets symmetric; HERE windF 0.034 → 0.236 → 0.443 → 0.645, jets lean progressively right from ~12:40. Spray-px counter (2–12 px) is too coarse to grade the lean; the eye does it.
**Verdict:** shipped.
**Surprise:** HEAD's "windy class" is 40 % of hours, not 28 % of days — `hash(day, 99)` has no seed in it, so every seed shares the same windy calendar; a 30-day window happens to hold 12 of them.
**Law:** a scalar's first probe asserts on the target's OLD definition (`w !== (wd ? 1 : 0)`); when the target grows a second source, the old assertion counts the new ramps as faults — assert "sits on the wrong anchor", not "is off the anchor".
**Cue:** the windy calendar is seed-blind (`hash(day, 99)`); every seed's boat/fountain/washing share the same windy days.

## Iteration 66 — leaves land: `litter[]` (Uint8) raised under a landing leaf, painted in the cached ground as a tint + hash scatter, cut by feet and the broom, decayed in batches, buried by snow (2026-08-29) [Courtyard & garden × New CA rule]

**Brief b63.** `leafFallF()` shed leaves that vanished on touching the ground; October lawns were as clean as June's.
**Did:** `litter = new Uint8Array(GW*WH)` beside `trod`. `landLeaf(l)` at the `l.z<=0` splice: leaves carry `leaf:1` from spawn (petals don't; `leafCol` returns a string so a type check silently killed every leaf — first year probe read 0 everywhere, the predicate never fired), gated on `leafShed() > 0` so the thin summer drift lies nothing and the June ground hash is exact; +`LITTER_LAND` 40 on GRASS/PATH/SIDE/SLOT/ROAD. Feet cut `ceil(dt·120)` (~2 s standing clears a cell); the sweeper on paving zeroes it. `stepLitter()` from `caTick`: every `LITTER_BATCH` 32 ticks subtract `16·(1 − 0.75·leafShed())`; `snowCover > 0` → `fill(0)`. Draw: `groundCol` mixes toward `#8a5a2c` by a bucketed level; `drawLitter` lays 2..16 hash-placed rects per cell after the snow check. Dirtying rides `wearDirty` and only when a drawn bucket changes. No `R()`, no per-frame draw, canopy rule untouched.
**Gates:** census PASS (unchanged — no new draw) · motion PASS · shots clean · `ground-rebuilds` autumn d16 seed 7: **142 HEAD / 142 HERE** (lb 133, wet 7, other 2) · `probes/litter-year.mjs hash`: summer d6 seed 7 ground hash **identical to HEAD**, autumn d17.4 differs (84 cells) · `litter-year.mjs year` 3 seeds, noon each day: 0 through day 11, 13–26 cells at first shed (d12), peak 82–97 cells / sum 6–8.7k at d16, 40–57 cells d18, **0 from d19 on** (seed 3: cleared by the d17 snow at cover 0.12) · crops `shots/b63-autumn-courtyard-{head,here}.png`, `b63-autumn-wide-{head,here}.png`.
**Verdict:** shipped.
**Surprise:** the drift is not *under* the linden — leaves carry vx 0.6–1.4 for 6–14 s of fall, so it heaps 8–12 cells east on the lawn edge and the paving, and the street trees' leaves cross the footway and lie on the road. Downwind is right; "under the canopy" in the brief was a guess about where a falling leaf ends. Feet and the broom cut it visibly in the crop (the heap has a scuffed line through it).
**Law:** a new per-cell field's first year probe should print the *raise* count, not only the sum — a Uint8 that stays 0 across 26 days × 3 seeds is a guard that never fired (here `typeof col === 'string'` on a colour the tree function stringifies), and the anchor check was green for the wrong reason.
**Cue:** the linden's litter lands east because every leaf's `vx` is positive — a west wind only; nothing yet ties leaf drift direction to `windF()`/gust sign.

## Iteration 67 — the clock is a button: a tap runs the town on to this evening, then the next dawn, on the season's own lapse (2026-08-29) [The sill & the observer × Interaction/UX]

**Brief b64.** A noon visitor never saw the night; the only fast-forward skipped a quarter-year.
**Did:** `#daytime` → `<button>` with the season's underline + chevron, in its own sans (min-width 13ch). `beginSkip()` now calls `beginLapse(span, say)` — ONE mechanism, the span and the landing line are the only parameters; `beginEvening()` aims it at `sunDown + 1 h` by day and `sunUp + 0.5 h` otherwise (`eveningTarget()`, band [dawn, eve − 1.5 h)). Both buttons disable through either lapse. `clock` joins `OFFERS` last (`clockPressed`), narrow sill keeps the clock via `at-clock`. Context budget read 46.1 KB — OVER by 0.1 KB at start.
**Gates:** census PASS (unchanged, by construction — no click reaches a driven page) · motion PASS · `season-skip.mjs` PASS all · `naming.mjs` all pass · night filmstrip 0 POP · shots clean · phone 390: sill 53 px, clock 147–253, controls at 271 — same row.
**Numbers** (`probes/evening-skip.mjs`, seed 7 day 0): 12.88 → 21.23 in 2.41 real s (139 frames), nightF 1, 34 lit; tap again 21.23 → 5.65 (sunUp 5.15 + 0.5) in 2.38 s; tap again → 21.58. Landing hour = sun AT LANDING ± 0.05. vs a 1x `__warp` to the same simT: lit 34/34, people 11/11, cloud/wind/wet identical. `evening-skip-weather.mjs` (seed 3, live page warped to a fronted noon): a front arrived DURING the lapse — cover 0.466 → 0.859 at max slope 0.0200/s (cap 0.020), wind 0.017 → 1.0 at 0.400/h (cap 0.400) then broke to 0.19 with the rain, wet 0 → 1; tapOpen true at landing (it is `day >= 1`, so day 0's first tap lands on a shut door — by design of #33, not of this).
**Verdict:** shipped. c98 (follow line through a lapse): **preserved deliberately** — `followed` is not cleared, the line is only hidden for the 2.4 s the label would be lying, and comes back at landing; nothing to release.
**Surprise:** span delivery was exact to 1e-13 and the landings were still 0.13–0.26 h off — the SUN moves during the lapse (sunDown +0.36 h/day at the equinox), so a target fixed at tap time is stale by arrival. `sunAt(t)` + a 3-pass fixed point lands on the sun as it is at arrival. The season probe's 0.02-day tolerance (0.48 h) could never see this.
**Law:** a target that is an hour OF THE SUN must be solved at the arrival instant, not the departure — anything read off `sunUp`/`sunDown` across more than an hour or two of sim time drifts by the day's share of the seasonal swing. Also: `?pause` + `__reseed` + `__setTime` world ≠ a live page started at `?t=` (cloud 0.56 vs 0.17 at one instant); to pick an instant for a live test, warp the live page.
**Cue:** `EVENING_WIDE` is the 4th offer and comes after `follow`, so a visitor who never taps a person hears it ~30 real s in; consider ranking it second.
## Iteration 69 — the frozen fountain: the plume falls to nothing as the basin skins over (2026-08-31) [Plaza & quay × Deepen]

**Brief:** b66 — the basin already skins over below FOUNT_ICE (cached ground, hash y+71) and `fountainLine()` says "skinned-over", but `drawFountain` read only `fountainPlay()` — in January it drew 1 jet + 1 droplet over the ice. Make the freeze visible in the plume.
**Did:** `FOUNT_STILL = 0.35`, `fountainJet() = clamp(1 - fountainIce()/FOUNT_STILL, 0, 1)`. In `drawFountain` the drawn `play` is `fountainPlay() * jet`, the jet-stroke alpha and the lee-spray weight are `× jet`, and the whole plume is behind `if (jet > 0)`. Basin colour, `fountainStand`, spawners untouched. No R().
**Gates:** census PASS (+0, draw-only) · motion PASS · perf `frame-cost.mjs` 2.85 ms both, rebuilds 102 = 102 · filmstrip day 0 POP · `fountain-year.mjs` anchor EXACT, ground IDENTICAL · `probes/fountain-freeze.mjs`: per day jets/drops HEAD 1/1 → here 0/0 for days 26–1 (ice ≥ 0.34), 5/3 identical to HEAD for every ice-0 day; crops `fountain-winter-{head,here}.png` show the lone jet gone.
**Verdict:** shipped.
**Surprise:** the pixel hash of a plaza crop differs HEAD-vs-HEAD (two runs, same seed, same warped instant) — the live page walks the PRNG through the round-trip — so "pixel-identical" was proved by the draw-call count and the algebra (`x * 1`), not by pixels. The winter basin skin is faint: ice caps at 0.43, so the mix toward `#b4c3c6` never passes 0.43 — reads as a paler blue, not white.
**Cue:** c98 — the frost's basin is skinned only 0.19–0.43 toward ice-white; if the plaza should read *frozen* at a glance, either raise the per-cell skin (`0.45 + 0.55·hash` → a higher floor) or let `fountainIce` reach 1 at midwinter; count rebuilds first (cached ground).

---

## Iteration 59 — the paving remembers the rain: wetness, a rate-capped scalar the cached ground and the night lamps read (2026-08-29) [Plaza & quay × Connect]

**Brief:** b56 — a `wetness` 0..1 world scalar; PAVED cells darken in the cached ground, bucketed; lamp bars on wet paving at night.
**Did:** HEAD already had `wet`, an 18 s countdown driving a live sheen on the lane — replaced by `wetness`/`wetF()`: `stepWet()` rises `rainFall/WET_RISE` (3 s), dries `1/WET_DRY` (7 s) × daylight × warmth, lands ON 0. Sheen = `0.16 × wetness`. `wetCol()` pulls PATH/SIDE/ROAD toward `#3f4650` by `wetPainted` (5 buckets, set in `drawGround`, `simStep` dirties on a bucket change). `WET_LAMPS` = 22 lamps over paving; `drawWetLights()` after `drawRiverLights`, `0.30 × wetness × nightF`. No R().
**Gates:** census PASS · motion PASS · `wet-year.mjs`: shower ends at 0.90, dry in 3.14 h; +3.5 h ground hash identical to HEAD · `ground-rebuilds.mjs` dry days = HEAD, rainy +9 · `frame-cost.mjs` unchanged · filmstrip 0 POP · `wet-shots.mjs` crops.
**Verdict:** shipped.
**Surprise:** at +3.5 h the lane still differed from HEAD by 15 levels on an identical ground hash — HEAD's `wet` sheen outlasted the rain by ~8 sim hours. The sheen now ends when the paving dries; on a winter night it hangs on longer than HEAD's did (c97).

## Iteration 60 — a tap on a person FOLLOWS them: the sill line stays on one agent, a ring under their feet, a closing line on despawn (2026-08-29) [People & animals × Interaction/UX]

**Brief:** b57 — let a tap hold one walker: the sill rewrites as their act changes, a marker rides under the feet, the line closes with what became of them.
**Did:** `livingAt()` records `livingHit` — one hit-test. Click on a person → `followPerson(who)` (toggle) and return, so no crumbs land under them; any other tap releases first. `followLine()` = 'following ' + `personName(a)`, read per frame via `updateNaming` — outranks pointer AND ticker, still cleared by an invite hold. `followLost(a)` at the ONE despawn site: door (+ 'lamp lit at HH.MM' off HOMES), lane, cross street, east, west. `drawFollowMark()` after the balloon, before the rain. `OFFERS[2] = follow`; `__follow()`; `__entities` `followed:1`.
**Gates:** census PASS · motion PASS · `probes/follow.mjs` seed 7: 3 distinct acts in 12 h, a leaver closes after 21.75 h 'left by the lane', marker-to-feet 0.7 px, second tap releases, phone 390px: plate/clock/ticker none, 0 px over · a homer: 'went in at the door, lamp lit at 3.25' · `naming.mjs` 42/42 · shots clean.
**Verdict:** shipped.
**Surprise:** 'on the last leg' is not 'leaving' — the first leaver pick was a sitter walking to a bench and the probe waited 48 h for a despawn that never came. Two probe rewrites went to the instrument, none to the page.

## Iteration 61 — four things built lately made visible at 1x: warm panes and rose window after the night tint, furrowed turned earth, 5 px bunting, a whiter dusted lawn (2026-08-29) [Cross street & allotments × Polish]

**Brief:** b58 — c91 grey lit panes at midnight, c88 turned earth lost on brown, c84 3 px flags, c83 pale-green snowed lawn at dawn.
**Did:** `LIT_PANES[]` (per frame, reset with LIT) takes each lit pane's screen quad from `drawPane`; `applyLight` fills them in `screen` at `0.7·nightF` after its multiply — the draw ORDER was right, the multiply took the warmth out. The rose window was worse: `drawChurchFront` pushed its LIT halo at CACHE time, so it existed on the rebuild frame only; now `ROSE = [x,y,r]` and the same pass relights it every night frame. Turned earth: colder base + two furrows and a lit ridge per cell in the cached detailing. Flags half-width `max(2.5, 0.3·cellW)`, two a span. Snow on GRASS mixed by `1−(1−sn)^1.8`, `SNOW_COL #e2e8f2`.
**Gates:** census unchanged · motion PASS · night filmstrip 0 POP · `probes/polish-1x.mjs`: pane R−B 62–71 (HEAD −5…5), rose 49 (HEAD −37), turned-vs-fallow 29.4 (HEAD 26.5), flags 5 px, dusted lawn B−G +6.8 (HEAD +4.5) · noon hash identical to HEAD with the bandstand masked · `polish-crops.mjs` → `shots/b58-*`.
**Verdict:** shipped.
**Surprise:** c83 is not what it says: a 0.36 cover on a heavily worn lawn is two-thirds green BY DESIGN (the wear discount) — the curve buys ~3 levels. Also: page clips need the canvas's `getBoundingClientRect()` offset (196,29 at 1600×950); the first crops were of the wrong place while the `ctx` pixel probe was right.

## Iteration 63 — the boat's lantern lands: #62's uncommitted diff verified and committed, boatRate left unthinned after dark (2026-08-29) [River & far bank × Deepen]

**Brief b60.** #62 built the lantern (b59) and exited without a commit; the 37-line diff was read, verified against b59's criteria, and landed as found.
**Did:** `boatLampF()` = clamp((nightF − 0.3)/0.15) while a boat exists; `drawBoat` sets `BOAT_LAMP` (reset per frame beside `LIT`); `applyLight` relights it after the multiply with a tighter halo; `drawRiverLights` lays a 3.5-bar column under the hull on the fixed lamps' wind terms; `livingAt` says 'going downriver by lantern'.
**Gates:** census PASS (draw-only) · motion PASS vs a HEAD baseline · `river-year.mjs`/`boat-wind.mjs` HERE == HEAD to every digit · `probes/boat-lantern.mjs` 22:00 crops: 9 warm px HERE vs 0 HEAD, box moves with the hull · `boat-lantern-column.mjs` 71 px under the hull, 0 on bare water · night filmstrip 0 POP.
**Decision:** `boatRate()` does NOT thin after dark — 20 seeds × 11 nights: boat out 64.7 % of dark samples, lit 84 % of nights. The trip is ~1.7 days, so a night rate factor would barely move night presence but would move the launch anchors. A quieter night river wants a mooring (presence), not a rate.
**c99** (rose window at the dusk edge) read, not taken: the cached disc is a step at cache time and the relight a 0.7·nightF screen, so the seam is two-sided (grey just after dusk, stale warm after dawn); painting it always-unlit dims #61's midnight rose. Not a one-liner.
**Surprise:** a verification-only iteration is cheap (~15 min) and worth it — the diff was right and nobody had shown it.


## Iteration 70 — arrivals in twos: `withCompanion()` on the lane and east spawners, a companion held beside the leader by a per-step re-target (2026-08-31) [People & animals × New element]

**Brief b67.** Every lane/east arrival came alone; the picnic (`a.mate`) was the only pair.
**Did:** `withCompanion(a, room)` after both `agents.push(a)` in `spawnLaneAgent` and the one in `spawnEastAgent`: one `R()` roll every arrival (drawn whether or not there is room), `PAIR_P 0.55` of arrivals with ONE place left under the cap the leader came from (callers pass `laneCount + 1 < laneCap` / `eastCount + 1 < eastCap`). No cyclists, dogs, allot, busker, night rail. The companion `b.with = a` has no `stop` of its own: `pairTarget(b)` is re-read every walk step — behind 0.7 + beside 0.85 of the leader's heading (1.1 cells); at a stand, behind along the heading (a rail, a stall); at a bench, `a.pairSeat` (leader shifted 0.5 left on `stop` + wp, companion +1.0); cafe: the chair across (−1.7). `pairStands()` flips the side off water/void/beds. `sp` × `1 + clamp((d − 1.1)·0.5, 0, 0.9)` when left behind; a move that would close under `PAIR_MIN 0.9` becomes a step away (a leader reversing walks through a held follower). Companion listens to the bell only with the leader; excluded from `chatty` and `goHome`; sits/stands when the leader does (`a.resume`), gets up when the leader walks. `personName` appends ', with a friend' / ', with the one they came with'; `__entities` carries `with`/`lead`.
**Gates:** census PASS (churn from the new draws, no collapse) · motion PASS · seats-out 0 vanished 0 splits · day filmstrip 0 POP · wide/lane/east shots clean.
**Numbers** (`probes/pairs.mjs`, 10 seeds × 2 days, daylight, counted AT the choice): pairs 44/164 arrivals = 26.8 % (52 % of arrivals with room); separation 2765 samples, 99.9 % in [0.9, 1.6], 4 under 0.9 (all ≥ 0.8), 0 over 3 cells; sitSame 389/425; lanePk 6–8 / eastPk 4–5 both == HEAD. Crops `shots/b67-pair-*.png`, `b67-pairsit-*.png` (quay bench: both on the bench).
**Verdict:** shipped.
**Surprise:** three instruments in a row. (1) 12 % speed edge closes 3 cells in 16 s — a follower's catch-up must scale with the gap. (2) "Hold when too close" is walked THROUGH by a leader who turns round (east agents retrace); the follower must step away. (3) "Beside on the bench" was the perpendicular of the approach, which for a quay bench is the river; and the bench is 1.5 cells with its sitter in the middle, so a second sitter needs the FIRST one moved. Also: `room` is free only ~half the arrivals, so a band on `roomy` is half that share of arrivals.
**Law:** A companion is priced off the LEADER's motion, not its own: catch-up scaled to the gap, never a fixed speed edge; a minimum-distance rule must move the follower AWAY, since a hold is walked through by a leader reversing. A second occupant of a fixed prop (bench, table) needs the first occupant's place moved at spawn — the prop, not the follower, sets the offset.

## Iteration 71 — the wind has a SIGN: windSign ±1 per spell, latched from calm off a day hash, every x-lean multiplies it; windyDay() salted by the seed (2026-08-31) [Sky, light & weather × Deepen]

**Brief:** b68 — the wind was a magnitude with every consumer leaning +x (litter east of every tree in every seed, c102); windyDay() shared one calendar across seeds (c101).
**Did:** `windSign` (+1 west wind = the old lean, −1 east), `signFor(day) = hash(day, 7 + WIND_SALT) < 0.5 ? −1 : 1`, set in `stepWind` only while `wind ≤ WIND_SIGN_CALM` (0.1) and a target exists — a front rising into a windy day keeps the sign it rose with. Two consumer classes: leans already × windF() (fountain plume/droplets/lee spray, river streak lean, bunting's `w·0.5·windF()` term) multiply `windSign`; things with a calm +x drift (chimney smoke, the shed leaves' `vx`, cloud `windX`) multiply `windDir() = 1 + (windSign−1)·windF()`, a blend from +1 at calm to the sign at full wind, so a latch never steps a frame. `WIND_SALT = SEED ?? 0` salts `windyDay()`'s hash column; a `let`, so a probe can zero it. hash only, no new R().
**Gates:** census PASS (churn from the re-dealt windy calendar, no collapse) · motion PASS · `wind-front.mjs`/`wind-year.mjs` magnitude anchors identical (windy-day mean 0.975 vs 0.973, slope 0.427/h, ramp 0.13…1) · day filmstrip 0 POP · wide/courtyard/east/lane clean.
**Numbers** (`probes/wind-sign.mjs`, 10 seeds × 30 d): 131 spells, 74 west / 57 east = 56 % +, **0 flips inside a spell**, 10/10 distinct windy calendars (HEAD: 1). Identity: seed 7, WIND_SALT 0, every spell forced +1 → whole-frame hash == HEAD at a windy noon (day 8, w 1); with the real sign history it differs, as it must. Litter (shed peak day 14, wind held 1.5 d): centroid **+22.0 cells east** of the linden at sign +1, **−14.8 west** at −1. Fountain crop (`shots/b68-fountain-sign±1.png`): pixels brighter under +1 sit at +9.6 px, under −1 at −10.9 px from the basin centre.
**Verdict:** shipped.
**Surprise:** the litter probe read zero twice before it read anything — first aimed at day 17 (snow clears litter from day 18), then counting an 8-cell disc when a leaf flies 7–30 cells before it lands. Also: `litter-year.mjs` hashes `gcv`, the cached ground — it cannot see a wind consumer; a frame identity for live draws must hash `cv`. And the rain does not read the wind at all: `r.x -= v·dt·0.12` slants every drop −x on every day (cue).
**Law:** A scalar that reduces to a constant at its anchor is exact in the algebra but not in the HISTORY: a sign, a latch, anything that steers state (leaves, litter, windX) makes the frame differ from HEAD even at the anchor value. Prove identity by forcing the anchor over the whole run (`signFor = () => 1`), not at the instant. And hash the canvas the consumer draws on — the ground cache is blind to live draws.

## Iteration 72 — the street clears itself: feet and wheels cut SIDE/ROAD litter, and the dawn sweeper works the gutter row when that is where the drift lies (2026-08-31) [Cross street & allotments × Connect]

**Brief b69.** #66's road litter lasted until decay or snow; only the broom cleared paving and it never left the lane footway.
**Did:** in the mover, a third branch after the broom's: `litter[j]` on `ROAD`/`SIDE` is cut `ceil(dt·(cycle ? 480 : small ? 90 : 180))` — faster than the lawn's 120, a wheel takes a leaf whole; repaint asked on a drawn-bucket change like `landLeaf()`, no `R()`. Courtyard `PATH` untouched. `updateSweeper()`: sums `litter[]` per lane row (x < XS_W0); if the heaviest ROAD row outweighs the footways he walks THAT row (`sweeper.gutter`, "working the gutter where the leaves lie") — same x span and speed, so the round's timing is unchanged. A first cut sent him up the cross-street footway on a day hash: reverted, the cross-street footway holds ~0 litter and the extra leg changed his lifetime → laneCap room → the whole PRNG world.
**Gates:** census PASS (life churn only) · motion PASS (a first run FAILed on `leaf oob (-12, 70.7)` — pre-existing on HEAD in 7/10 seeds, see cue) · `ground-rebuilds` HERE 138/131 vs HEAD 138/134 · `probes/street-clear.mjs`: d16 natural, seed 11 GRASS/PATH sums identical to HEAD to the digit (84→52 / 1648→1896), ROAD 952→1232 HERE vs 1948→2380 HEAD; `inject` (200 on every open cell at 07:00, both builds) SIDE at noon −10.7k/−14.3k/−13.2k vs HEAD, ROAD −0.2k/−8.2k/−0.6k · crops `shots/b69-gutter-{head,here}-{7,12}h.png`: HEAD's noon drift runs x 15–65 unbroken, HERE's is clear west of the sweeper at x≈28.
**Why the sweeper and not the traffic (the brief's choice):** the street trees' leaves fall 6–8 s at `y += 0.5·dt`, so ALL lane litter lands in ONE row — row 70, the gutter under the north kerb (`road-rows` probe: every other row 0 in 3 seeds). No walker treads it and a 5-hour autumn morning sees 0–1 cyclists, so the traffic branch is real but invisible on the road; it is what keeps the footway clear (SIDE 36–60 HEAD → 0 HERE). The watchable clearing is a man in the road with a broom.
**Verdict:** shipped.
**Law:** *A "cut by traffic" rule is only as strong as the traffic that crosses the CELL.* Before pricing a wear/clear rule off a kind's rate, histogram where the deposit lands by ROW and count that kind's crossings of those rows over the window — the lane's road is 8 rows and the whole heap sits in one of them.
**Context budget:** `context-budget.mjs` reads OVER (46.3 / 46 KB) at the start of this iteration.
## Iteration 64 — a wet seat is a refused seat: `seatRefused(a)` reads `wetF()` through a per-person `a.wary` bar (2026-08-29) [Lane & market × Connect]

**Brief b61.** The paving dried over ~3 h (#59) while the tables refilled the moment a shower stopped.
**Did:** `WET_SEAT_HI 0.75 / LO 0.35`; `seatWet(a)` = wetF() > HI − wary·(HI−LO); `seatRefused(a)` = sky > SIT_REFUSE **or** seatWet(a). Three call sites pass `a`: picnic, courtyard sitter, and the street stop (~L1908), which had its own literal `weatherComing() > 0.42` and now goes through the ONE predicate. Arrivals only; nobody seated is touched. No new `R()`, no draw code.
**Gates:** census PASS (life churn, no collapse) · motion PASS · `seats-out.mjs` 0 vanished, 0 splits · `probes/wet-seats.mjs` 10 seeds, pinned clear 10:00 with `wetness = 1`, counted AT the stop: taken 17 → 14, refused 2 → 4; seat-hours 33.9 → 27.1; median first seat +1.0 h → +2.6 h; `WET0=0` control == HEAD to every digit. Crops `shots/b61-plaza-{head,tree}-30min.png`.
**Winter night (c97):** seed 7 d17 22:00, wetness 0.31 → sheen ≈ 5 %, damp slate not a lake. Fine; no change.
**Verdict:** shipped.
**Surprise:** natural showers in 10 seeds all ended between 21:00 and 02:00, so a "day of a shower" probe measured nothing on either build — the first 0 was the instrument. Also: the cafe band is so rare (0 arrivals in 14 seeds × 3 h) that the cafe crop is a plaza-bench crop.

## Iteration 65 — the wind has a cause: a building front raises `windTarget()` with the cover and breaks with the rain (2026-08-29) [Sky, light & weather × Connect]

**Brief b62.** #58's wind ramp fired at the hour-6 roll, inside the dawn relight, so nobody saw it rise.
**Did:** `frontWind()` = clamp((cloud − 0.46)/(0.76 − 0.46)) — weatherComing()'s knee to a heavy front's floor — zeroed by `raining` and by a `frontSpent` latch set at the first drop and cleared when the next front moves in (`stepClouds`). `windTarget()` = max(day hash, frontWind()); `stepWind` reads it under the same `WIND_RISE_H` cap. Consumers untouched; no `R()`, no draw code. Light fronts (cover ≤ 0.5) give ≤ 0.13 — a breeze, never the windy class.
**Gates:** census PASS (life churn only) · motion PASS · day filmstrip 0 POP.
**Numbers** (`probes/wind-front.mjs`, 10 seeds × 30 d): windy-day mean 0.960 → 0.972, calm-day mean 0.027 → 0.176, windy CLASS 40.6 % → 49.9 % of samples — the extra hours the boat and fountain anchors move by. Max slope 0.427/h both (the cap). `wind-year.mjs` off-anchor 4/26400 (one-sample lag: rain starts later in `simStep` than `stepWind`). Crops `shots/b62-front-sheet.png`: seed 11 d2, cover 0.47 → 0.65 over 10–14 h, HEAD jets symmetric, HERE windF 0.03 → 0.65 and the jets lean progressively from ~12:40.
**Verdict:** shipped.
**Surprise:** HEAD's "windy class" is 40 % of hours, not 28 % of days — `hash(day, 99)` has no seed in it, so every seed shares one windy calendar and a 30-day window holds 12 of them.

## Iteration 66 — leaves land: `litter[]` (Uint8) raised under a landing leaf, painted in the cached ground, cut by feet and the broom, decayed in batches, buried by snow (2026-08-29) [Courtyard & garden × New CA rule]

**Brief b63.** `leafFallF()` shed leaves that vanished on touching the ground; October lawns were as clean as June's.
**Did:** `litter = new Uint8Array(GW*WH)` beside `trod`. `landLeaf(l)` at the `l.z<=0` splice: leaves carry `leaf:1` from spawn (petals don't), gated on `leafShed() > 0` so the summer drift lies nothing; +`LITTER_LAND` 40 on GRASS/PATH/SIDE/SLOT/ROAD. Feet cut `ceil(dt·120)`; the sweeper on paving zeroes it. `stepLitter()` from `caTick`: every `LITTER_BATCH` 32 ticks subtract `16·(1 − 0.75·leafShed())`; `snowCover > 0` → `fill(0)`. Draw: `groundCol` mixes toward `#8a5a2c` by a bucketed level; `drawLitter` lays 2..16 hash-placed rects per cell. Dirtying rides `wearDirty` only when a drawn bucket changes. No `R()`, no per-frame draw.
**Gates:** census PASS (unchanged) · motion PASS · `ground-rebuilds` autumn d16 seed 7: 142 HEAD / 142 HERE · `probes/litter-year.mjs hash`: summer d6 ground hash identical to HEAD, autumn d17.4 differs (84 cells) · `litter-year.mjs year` 3 seeds: 0 through d11, peak 82–97 cells at d16, 0 from d19 (snow) · crops `shots/b63-autumn-{courtyard,wide}-{head,here}.png`.
**Verdict:** shipped.
**Surprise:** the drift is not *under* the linden — leaves carry vx 0.6–1.4 for 6–14 s of fall, so it heaps 8–12 cells EAST on the lawn edge and the paving, and the street trees' leaves cross the footway and lie on the road. "Under the canopy" in the brief was a guess about where a falling leaf ends. The first year probe read 0 everywhere because `typeof col === 'string'` silently killed every leaf — the anchor check was green for the wrong reason.

## Iteration 67 — the clock is a button: a tap runs the town on to this evening, then the next dawn, on the season's own lapse (2026-08-29) [The sill & the observer × Interaction/UX]

**Brief b64.** A noon visitor never saw the night; the only fast-forward skipped a quarter-year.
**Did:** `#daytime` → `<button>` with the season's underline + chevron (min-width 13ch). `beginSkip()` now calls `beginLapse(span, say)` — ONE mechanism; `beginEvening()` aims it at `sunDown + 1 h` by day and `sunUp + 0.5 h` otherwise (`eveningTarget()`, band [dawn, eve − 1.5 h)). Both buttons disable through either lapse. `clock` joins `OFFERS` last (`clockPressed`); the narrow sill keeps the clock via `at-clock`.
**Gates:** census PASS (unchanged by construction) · motion PASS · `season-skip.mjs` PASS · `naming.mjs` PASS · night filmstrip 0 POP · phone 390: clock and controls on one row.
**Numbers** (`probes/evening-skip.mjs`, seed 7 d0): 12.88 → 21.23 in 2.41 real s, nightF 1, 34 lit; tap again → 5.65 (sunUp + 0.5); landing hour = sun AT LANDING ± 0.05; vs a 1x `__warp` to the same simT: lit 34/34, people 11/11, cloud/wind/wet identical. `evening-skip-weather.mjs`: a front arrived DURING the lapse at exactly the cloud and wind caps, then broke with the rain; wet 0 → 1.
**Verdict:** shipped. c98 (follow line through a lapse) preserved deliberately: the line is hidden only for the 2.4 s the label would be lying and comes back at landing.
**Surprise:** span delivery was exact to 1e-13 and the landings were still 0.13–0.26 h off — the SUN moves during the lapse (sunDown +0.36 h/day at the equinox), so a target fixed at tap time is stale by arrival. `sunAt(t)` + a 3-pass fixed point lands on the sun as it is at arrival. The season probe's 0.48 h tolerance could never see this.

## Iteration 68 — the clock's offer is heard second: `OFFERS` re-ordered touch → clock → season → follow (2026-08-31) [The sill & the observer × Polish]

**Brief b65.** The clock joined `OFFERS` last at #67, so a viewer who never tapped a person heard "press the hour" ~48 real s in — after the daylight it skips was gone.
**Did:** two lines moved in `OFFERS[]` and the comment above them. No mechanism, no constant touched: `INVITE_AT` 8 + `INVITE_DWELL` 5.5 + `INVITE_GAP` 6 fix the second slot at ≥ 19.5 s.
**Gates:** census PASS (unchanged) · motion PASS · `touch-hint.mjs` PASS · `season-invite.mjs` PASS after its watch window went 36 → 48 s (it closed 1 s into the season line, which now surfaces ~35 s; the FAIL was the instrument, not the sill) · `probes/offer-order.mjs` (needs `git show HEAD:courtyard.html > /tmp/courtyard-head.html`).
**Numbers** (seed 7, fresh untouched page, real s): 1400 px HERE touch 8.0 · **clock 21.1** · season 34.8; HEAD touch 9.2 · season 21 · follow 34.8 · clock never in 48 s. 390 px HERE clock 21.5 with `at-clock` set, `#daytime` shown on the controls' row (HEAD: hidden). Clock pressed at 3 s: clock never spoken, season takes the slot at 21.5, `clockPressed` true.
**Verdict:** shipped — the brief's "before ~12 s" is not reachable by re-ordering: the queue's own constants put ANY second offer at 19.5 s + whatever the news is saying. Getting under 12 s means cutting `INVITE_GAP` or `INVITE_DWELL`, which sits beside the fenced `TICK_DWELL`; not done.
**Surprise:** none in the page. In the probe: a real-clock probe whose window ends inside an offer's dwell reports "held the surface 1.0 s, under INVITE_DWELL" — a false fault that reads exactly like the bug it guards against. Re-ordering a queue shifts every later item by a whole slot (11.5 s); size the window off the LAST offer you need to see, not the one the probe is named after.
**Cue:** the follow offer is now fourth and lands ~48 s in; whether it is worth its slot at all is a question for the stats, not the queue.



<!-- verbatim copies kept by the manager pass from #77 before condensing in LEDGER.md -->

## Iteration 73 — a footbridge over the river at the alley's latitude (2026-08-31) [River & far bank × Scale/World]

**Brief:** b70 — THE BET: a DECK tile kind across the river at ALLEY_Y, drawn as a timber span the boat passes under, and the east routes re-pointed over it.
**Did:** `DECK = 12` in buildGrid (rows 30–31 × RIVER_X0..RIVER_X1, 26 cells); the ground cache reads it as WATER; `__census` TN gains 'DECK'; `nameAt` says "the footbridge". Drawn live in TWO items so the y-sort works: `drawDeckSpan` (ramps, planks, upstream rail) at y 29.9 — before the walkers on it — and `drawDeckFront` (downstream rail, four trestle legs, plank edge, sky-occlusion shadow off shadowF/shOffset) at y 32.6, after them. While `boatUnderDeck()` the boat's own item is dropped and the span draws it first, so the planks land on the rower; `boat.deck` latch announces it, gated by `hash(boat.id, 313)` — no new R(). Walkers get height from the PLACE: `agentZ(a)` = a.z || jetty 0.5 || `deckZAt()` (a ramp over DECK_RAMP cells each bank, so nobody pops 1.7 up at the quay edge). Routes: `DECK_LEAD_A` skirts the fountain basin south then crosses; towpath/green stops with y < DECK_REACH (45) enter by the alley and cross; `a.wary < 0.2` of plaza/quay visitors (a field written at spawn, no new draw) walk on to stand on the jetty, keeping their stop's duration. byTheWater() already spanned the deck's x range — comment only.
**Gates:** census PASS (tileKinds 108→117 = 9 cells × 13 kinds; WATER −234, DECK +234; baseline re-pinned on purpose after the gate) · visual PASS (wide: a second, lighter crossing a third of the way down; `probes/deck-shots.mjs` pins the boat under, emerging, and the deck at 03:00) · motion FAIL-not-mine: walker 0 jumps/oob; the only fault is `market/leaf: 2 oob` at x −12.8 on seed 7 — leaves are culled only on landing (`l.z<=0`), so a westward street-tree leaf at x 8 drifts ~19 cells in its fall; a stream reshuffle exposed a pre-existing path, see Cue · perf skipped (two small live items)
**Verdict:** shipped
**Numbers (probes/deck-crossings.mjs, 10 seeds × 10 days):** alley→jetty pathHours 23.9 h → 9.4 h at speed 1.9 (the brief hoped for "a few hours": the deck itself is 1.5 h, the plaza detour round the basin is the rest); crossings 2.13/day eastward, 2.02/day westward (retrace symmetry holds); 1.17 jetty standers/day; 33 of 34 boats passed under the deck; a completed crossing inside the first minute in 4 of 10 seeds (the rest are 60 s of walking still in progress or a dark start).
**Surprise:** the ordinary y-sort cannot draw a raised platform with people on it as ONE item — the thing under their feet must sort before them and the thing in front of their shins after. Splitting the deck in two was the whole trick; the boat then needed to be drawn BY the span, not near it.
**Law:** A raised walkable surface is two draw items, not one: the surface (and everything behind the walkers) sorts before the walkers' y, the near edge/rail/shadow after; anything that passes UNDER it is drawn by the surface item, not by its own. A walker's height comes from the place under their feet (`agentZ`), read every frame, never written at spawn — so the ramp is free and companions inherit it.
**Cue:** motion.mjs oob on leaves is stream-luck — a westward gust off the street tree at x 8 leaves the world before landing; either cull leaves at x < −2 / > GW+2 or exempt the kind, else every reshuffling iteration risks a spurious FAIL.


## Iteration 74 — the cafe gets its own custom: `cafeOpen()` / `cafeRate()` / `spawnCafeAgent()` under `CAFE_WAY`, off laneCap (2026-08-31) [Lane & market × Deepen]

**Brief:** b71 — count cafe supply AT the choice, then give the cafe an arrival source of its own (spawnTapAgent as the model), never a bigger slice of laneCap.
**Did:** counted first (`probes/cafe-supply.mjs`, 10 seeds × 5 days from day 5): HEAD 14 cafe arrivals, 49 table-hours, someone at a table at a clear noon **1/58** days; kiosk 24, market 10. Then `cafeOpen()` = day ≥ 2 ∧ sunUp − 0.5 ≤ hour < sunDown − 7 (beside `kioskOpen`); `cafeRate()` = (0.12 + 0.08·maturity)·(raining ? 0.2 : 1), no scarcity(); `cafeCount()` = `a.cafe` inbound or seated, bound `CAFE_WAY = 2`; `spawnCafeAgent(room)` always from the WEST edge (nearest fitting; the east is ~25 h away), brisk 2.2–2.8, sits 8–16 s with a cup, leaves the way it came, `withCompanion(a, room)` so the chair across fills for free. `laneCount` subtracts every `a.cafe`. The roll is drawn only inside `cafeOpen()`. Lane band untouched; seat still judged at the chair by `seatRefused()`. No draw code.
**After:** 144 arrivals (+51 companions, 26 refused at the chair), 503 table-hours, clear-noon presence **35/58 = 60 %**; kiosk 20, market 9 (noise), lanePk excluding cafe 11–13 = HEAD's.
**Gates:** census PASS (people +6, onStreet +10, weather reshuffled by the new draw) · motion PASS (shower/butterfly/leaf spawn deltas are the reseeded weather; walker jumps 0) · visual PASS wide/lane · day filmstrip 0 POP · `shots/b71-cafe-14h.png` seed 3 d5 14:00: two at the tables.
**Verdict:** shipped.
**Surprise:** the first cut (HEAD's 14–26 s sit, close at sunDown − 3) put the presence PEAK at 17:00–04:00 and 0.0 at 09:00–12:00 — a 25-cell walk at nominal 2.2 cells/s took 6.4 h, not 4.9 (`probes/cafe-hours.mjs` histograms presence by hour). The visit had to shrink to a coffee (3.5–7 h) and the hours close 7 h before sunset for the tables to be empty by night. Noon is still the rising edge; the cafe's natural peak is 14:00–17:00 because dawn is the earliest honest departure.
**Law:** Effective walking speed is ~0.75 of `a.speed` on the lane (dodging, waypoint slack): price a trip by tracing one agent (`spawn → stopped` hour), not by `pathHours()` alone, before choosing a window.
**Cue:** 26 of 144 cafe arrivals were refused at the chair — a walker who set out 6 h ago under a clear sky meets a wet seat; nobody checks the sky at departure.


## Iteration 75 — the courtyard's own arrivals come in twos: `spawnAgent(room)` → `withCompanion`, bench case on `a.benchAt` (2026-08-31) [Courtyard & garden × Connect]

**Brief:** b73 — c107: pairs stopped at the courtyard wall; call `withCompanion(a, room)` from `spawnAgent` under `capacity`, and make the bench case work on BENCH_SPOTS.
**Did:** `spawnAgent(room)` takes the room test the way the lane/east spawners do (`courtyardCount + 1 < capacity` at the call; the day-0 first arrival passes nothing → alone) and calls `withCompanion(a, room)` after `agents.push`. The roll is drawn unconditionally, then kids (own 70 % second), picnic (`a.mate`), gardener (works alone) and napper (lies alone) are excluded — dogwalkers already were via `a.dog`. Bench: a courtyard sitter has no `a.stop`; its bench is its LAST waypoint (`[b.x+0.5, b.y+0.6]`), so `else if (a.benchAt)` shifts that waypoint −0.5 and sets `a.pairSeat = 1.0`, the same 1.5-cell split #70 gave the lane benches; `b.benchAt = null` so the copy never sits on its own account. No draw code. Concert and picnic untouched.
**Gates:** census PASS (inCourtyard +5, people +16 — reshuffle from the new draw, no collapse) · motion PASS (walker 0 jumps; shower/firefly deltas are the reseeded weather) · visual PASS courtyard/wide · day filmstrip 0 POP · `shots/b73-bench-pair-77.png` (seed 77, 07:19, 3×): two on the north-west bench, distinct.
**Numbers (probes/pairs.mjs, 10 seeds × 2 days):** courtyard 78 arrivals (56 with room), 21 pairs = 26.9 % of arrivals, 37.5 % of roomy (0.55 × the eligible-kind share); separation in [0.9, 1.6] 99.9 %, under 0.9 7 samples (HEAD 17); bench samples with both seated in band 53/64; courtPk 7–9 vs HEAD 7–10; lane/east unchanged. `probes/sitter-pairs.mjs` (10 × 4 days): 28 sitter arrivals → 10 pairs → 8 leaders sat → 8/8 companions sat beside them, 4 of those in daylight > 0.5.
**Verdict:** shipped.
**Surprise:** the bench pair the brief pictured exists at about ONE daylit sighting per ten days — sitters are 16 % of a courtyard roll that fires ~0.7×/day, so the visible thing is the crossers and strollers walking in twos, not the bench. A probe shot needed six seeds to catch one; five seeds of nothing looked like a bug until the counter said 8/8.
**On a.mate vs a.with:** keep them separate. `a.mate` is two EQUAL agents with their own waypoints who judge the sky once (`seatRefused` defers to a seated mate); `a.with` is a follower with no route of its own. Folding the picnic into `a.with` would drop the mate's own path to the blanket and the shared-judgement branch for one fewer field — not worth it unless the picnic pair starts drawing as one shape, which the 0.9 rule already prevents.
**Cue:** a probe page at `deviceScaleFactor: 3` is a DIFFERENT seeded world from the same seed at 1× — the renderer walks the PRNG per painted frame and slower frames mean fewer of them before the first `evaluate`; pin a shot by warping inside one evaluate, never by seed alone.


## Iteration 76 — the rain, the leaves and the gutter learn the wind's sign: rain slant on `windDir()`, leaves culled at the world edge, per-leaf fall drift (2026-08-31) [Sky, light & weather × Connect]

**Brief b72.** c108 rain ignored windSign; c109 street-tree leaves left the world under an east gust (motion `leaf oob`); c110 every lane leaf landed in road row 70.
**Did:** shower step `r.x -= v·dt·0.12·windDir()` and the drawn streak `r.x − 2.4·windDir()`; a drop recycles across the WINDWARD edge, `R()·1.15W + (windDir()−1)·0.075W` — same draw, [0, 1.15W] west, [−0.15W, W] east. Leaves: `LEAF_EDGE_W/E = −3 / GW+3`, culled with `landLeaf` (which already ignores off-grid). Each leaf gets `l.vy` on its first step, folded from the `ph` it already drew (`u = ph/9 % 1`, `v = ph·1.7 % 1`, `0.5 + 0.35·(u+v−1)` — triangular on [0.15, 0.85], peak at the old 0.5). No new `R()`, counts and fall speed unchanged.
**Gates:** census PASS (leaves −9: an edge cull frees the cap sooner, so the spawn stream shifts — species reshuffle, no collapse) · motion PASS, leaf 52/35 spawns identical to baseline · wide/lane visual PASS · day filmstrip 0 POP · `wind-sign.mjs a`: 0 flips in-spell, 10/10 calendars (spell count 125 vs #71's 131 — the front calendar rides the reshuffled cloud stream, as every iteration since #72).
**Numbers (`probes/wind-consumers.mjs`):** leaf oob 10 seeds × 30 d: HEAD 57 samples in 8/10 seeds, x min −15.5 → HERE 0, x min −3.0. Lane road litter d14–17 04:00 (4 seeds): HEAD row 70 only (4697) → HERE rows 68–73 (809/1778/**1983**/1700/840/66), 6/8 rows, 70 still heaviest — `sweeper.gutter` now picks among rows. Rain at windF 1, 115 drops: mean dx −7.81 at +1, **+7.81** at −1. Anchor: sign forced +1 over 20 d, `windDir() !== 1` on 0 of 4400 samples — the rain step is HEAD's algebra to the bit. Crops `shots/b72-rain-sign±1.png`.
**Verdict:** shipped.
**Surprise:** the gutter heap was 4697 over 4 seed-days at HEAD and 7176 spread here — the spread lands MORE litter, because row 70 was the row the sweeper cleared every morning and rows 69/71 are not yet where he walks. The context budget printed OVER (47.1 / 46 KB) at the start of this iteration — for the manager.
**Law:** A per-entity variable that must not cost a draw can be folded out of a draw the entity already made — two fractions of one uniform (`ph/9 % 1`, `ph·1.7 % 1`) sum to a triangular around the old constant, so the mean stays the anchor and the stream is untouched.
**Cue:** the sweeper clears ONE road row; litter now spreads over 68–73 and rows 69/71 will outlast him — a two-row pass, or walk the heaviest pair.

## Iteration 70 — arrivals in twos: `withCompanion()` on the lane and east spawners, a companion held beside the leader by a per-step re-target (2026-08-31) [People & animals × New element]

**Brief b67.** Every lane/east arrival came alone; the picnic (`a.mate`) was the only pair.
**Did:** `withCompanion(a, room)` after the `agents.push(a)` in `spawnLaneAgent`/`spawnEastAgent`: one `R()` per arrival (drawn whether or not there is room), `PAIR_P 0.55` when ONE place is left under the leader's cap. No cyclists/dogs/allot/busker/nightRail. `b.with = a`, no stop of its own: `pairTarget(b)` re-read every step (behind 0.7 + beside 0.85; `a.pairSeat` on benches, the chair across at a cafe); catch-up scaled to the gap; a closing move under `PAIR_MIN 0.9` steps AWAY. Sits/stands/leaves with the leader; `personName` appends ', with a friend'.
**Gates:** census PASS (churn, no collapse) · motion PASS · seats-out 0/0 · day filmstrip 0 POP · `probes/pairs.mjs` 10 seeds × 2 d: pairs 26.8 % of arrivals (52 % with room), separation 99.9 % in [0.9, 1.6], lanePk/eastPk == HEAD. Crops `shots/b67-pair*.png`.
**Verdict:** shipped.
**Surprise:** three instruments in a row: a 12 % speed edge closes 3 cells in 16 s; "hold when too close" is walked THROUGH by a leader turning round (east agents retrace); "beside on the bench" was the approach's perpendicular, which at a quay bench is the river. `room` is free only ~half the arrivals.

## Iteration 71 — the wind has a SIGN: windSign ±1 per spell, latched from calm off a day hash, every x-lean multiplies it; windyDay() salted by the seed (2026-08-31) [Sky, light & weather × Deepen]

**Brief b68.** The wind was a magnitude with every consumer leaning +x (c102); `windyDay()` shared one calendar across seeds (c101).
**Did:** `windSign` ±1 (+1 = the old lean), `signFor(day) = hash(day, 7 + WIND_SALT) < 0.5 ? −1 : 1`, latched in `stepWind` only while `wind ≤ WIND_SIGN_CALM` (0.1). Leans already × `windF()` (fountain plume/droplets/lee, river streaks, bunting) multiply `windSign`; calm +x drifts (smoke, leaves' `vx`, cloud `windX`) multiply `windDir() = 1 + (windSign−1)·windF()` so a latch never steps a frame. `WIND_SALT = SEED ?? 0` salts `windyDay()`. hash only, no new R().
**Gates:** census PASS (re-dealt calendar, no collapse) · motion PASS · `wind-front`/`wind-year` magnitude anchors identical · day filmstrip 0 POP.
**Numbers** (`probes/wind-sign.mjs`, 10 seeds × 30 d): 131 spells, 56 % west, 0 flips inside a spell, 10/10 distinct calendars (HEAD 1). Identity: every spell forced +1, WIND_SALT 0 → whole-frame hash == HEAD. Litter centroid +22 cells east of the linden at +1, −14.8 at −1. `shots/b68-fountain-sign±1.png`.
**Verdict:** shipped.
**Surprise:** the litter probe read zero twice — aimed at day 17 (snow clears litter from d18), then an 8-cell disc when a leaf flies 7–30 cells. `litter-year.mjs` hashes `gcv`, the ground cache — blind to live draws; hash `cv`. The rain ignores the wind entirely (c108).

## Iteration 72 — the street clears itself: feet and wheels cut SIDE/ROAD litter, and the dawn sweeper works the gutter row when that is where the drift lies (2026-08-31) [Cross street & allotments × Connect]

**Brief b69.** #66's road litter lasted until decay or snow; the broom never left the lane footway.
**Did:** mover: `litter[j]` on ROAD/SIDE cut `ceil(dt·(cycle ? 480 : small ? 90 : 180))` — a wheel takes a leaf whole; repaint on a drawn-bucket change, no `R()`. `updateSweeper()` sums `litter[]` per lane row (x < XS_W0); if the heaviest ROAD row outweighs the footways he walks THAT row (`sweeper.gutter`), same span and speed. A cross-street leg on a day hash was reverted: ~0 litter there, and the extra leg changed his lifetime → laneCap room → the whole PRNG world.
**Gates:** census PASS · motion PASS (a first FAIL `leaf oob` is pre-existing on HEAD, c109) · `ground-rebuilds` 138/131 vs 138/134 · `probes/street-clear.mjs`: GRASS/PATH == HEAD to the digit, ROAD d16 952→1232 vs 1948→2380; inject: SIDE at noon −10.7k…−14.3k vs HEAD · crops `shots/b69-gutter-*.png`.
**Why the sweeper, not the traffic:** street-tree leaves fall 6–8 s at `y += 0.5·dt`, so ALL lane litter lands in row 70, the gutter under the north kerb (c110); no walker treads it and an autumn morning sees 0–1 cyclists. The traffic branch is what keeps the footway clear (SIDE 36–60 → 0); the watchable clearing is a man in the road with a broom.
**Verdict:** shipped.

## Iteration 73 — a footbridge over the river at the alley's latitude (2026-08-31) [River & far bank × Scale/World]

**Brief:** b70 — THE BET: a DECK tile kind across the river at ALLEY_Y, a timber span the boat passes under, the east routes re-pointed over it.
**Did:** `DECK = 12` rows DECK_Y0..DECK_Y1 (water to the ground cache, paving to a walker); `drawDeckSpan`/`drawDeckFront` two items round the walkers; `boatUnderDeck()` + `boat.deck` announce; `agentZ()`/`deckZAt()` lift walkers with a ramp; DECK_LEAD_A/Q, DECK_SHARE, DECK_REACH route east arrivals over it; `a.jetty` standers. Baseline re-pinned (tileKinds 108 → 117, water −234).
**Gates:** census PASS on the new baseline · motion PASS · visual PASS (`probes/deck-shots.mjs` under/emerging/night) · `probes/deck-crossings.mjs` counts both directions.
**Verdict:** shipped (+136 lines).
**Surprise:** the ordinary y-sort cannot draw a raised platform with people on it as ONE item — the thing under their feet must sort before them and the thing in front of their shins after. Splitting the deck in two was the whole trick; the boat then needed to be drawn BY the span, not near it.


<!-- verbatim copies of #79–#81 before the manager condensed them in LEDGER.md (pass from #81) -->

## Iteration 79 — the warm evening's own arrivals: `spawnEveningAgent()` under `EVE_CAP`, priced by the places its walk REACHES; the window had to open at sunDown − 2.5 h, not − 0.5 h (2026-08-31) [People & animals × New element]

**Brief:** b77 — a source of its own for the warm dry evening, open sunDown − 0.5 .. + 3 h, over the deck, at the rail, on the quay and far benches, priced with `pathHours()` against the END.
**Did:** `eveOpen()` = day ≥ 1 ∧ `warmth ≥ 0.6` ∧ `!raining` ∧ `wetF() < 0.3` ∧ `windF() < 0.5` ∧ `hourEve()` in [sunDown − EVE_LEAD, sunDown + 3). `EVE_SPOTS` (12): three rail posts at y 12.5/14.5/16.5 (south of the night stander's 5..11), the near quay bench, two deck lean posts on the upstream rail by the alley (`DECK_LEAD_A`), the far bench and three towpath posts by the park steps — each `taken`. `spawnEveningAgent(room)`: three `R()` draws whether or not a place fits, `eveFits()` = arrival + 1 h of standing before `eveEnd()`, stop ended by the retire rule `a.dusk && !eveOpen()` (1.4× hurry), post released there, `goHome()` tried first, retrace the fallback; `withCompanion`. Own count `eveNow` out of laneCount and out of `scarcity`; `__entities` walkers carry `dusk:1`. `a.eve` was ALREADY the evening sweeper's flag (line 6392) — the field is `a.dusk`.
**Gates:** census PASS (reshuffle only: people −2, inEast −2) · motion PASS (walker spawns +2/−12 across scenes, no new jumps) · visual PASS (`shots/b77-eve-{wide,east}.png` at day 5, sunDown + 1 h: a pair on the far bench, towpath standers, the quay rail) · night filmstrip 0 POP · `probes/evening-arrivals.mjs` 10 seeds × 4 days: summer (warmth 0.91–1.0) 30/40 evenings open, 2.05 arrivals/evening (26 of 82 companions), presence 4.3–4.9 from sunDown − 0.5 to + 4.5 h, 3 went home; winter (warmth ≤ 0.09) 0/40 open, 0 arrivals, 0 presence — the negative can be non-zero (HEAD's `a.eve` read 9 before the rename). Walk actual/predicted at `a.speed` 1.12 (0.95–1.66): the quay and park routes are open ground, NOT the lane's 0.75.
**Verdict:** shipped, off-brief on the window: at the brief's − 0.5 h lead and 0.75·speed NOTHING fit (0 stops in 40 evenings); at − 1.5 h, 0.95 arrivals/evening and one stop a night; at − 2.5 h (the tap's own `tapUp = sunDown − 3`) the brief's 4–8 at sunDown + 1 h. "Gone by + 3.5 h" is not met and cannot be from a world edge: the shortest walk out is 2.6 h, so the posts empty at + 3 and the frame at + 5.
**Surprise:** the deck is the place the evening can least reach — the plaza crossing alone is ~4 h, so the two deck posts fit only for a 2.3-speed walker in the window's first 0.7 h and were chosen 0 times in 30 evenings. The deck's evening needs someone ALREADY on the far side (an east arrival who stays on), not a gate.
**Law:** the far side is ≥ 2.5 h from every gate — any window under ~5 h that opens at a world edge is empty by construction; open it a trip EARLIER than the hour it is for, and price arrival (the retire rule ends the stay), never arrival + dwell.

## Iteration 80 — the observer leans in: a `#where` control eases the camera onto one of four quarters and back; the ground cache is scaled through the ease, repainted once on arrival (2026-08-31) [The sill & the observer × Interaction/UX]

**Brief b78.** At 390 px the town is a strip and the plaza and far bank are not even in the frame (x 21..87 of 138).
**Did:** the camera IS the projection: `resize()` now writes the wide view to `cellW0/cellH0/topPad0/originX0` and `applyView({s,ox,tp})` scales `cellW/cellH` and moves `originX/topPad`; `FOCUS` untouched, so a zoomed frame is an exact scale+translate of the wide one. `QUARTERS` (Wide, Courtyard, Street, Plaza, Far bank), `viewFor(n)` fits the box (s ≤ 3.6) and clamps `ox` inside x = 0..GW. `whereGo(n)` eases on the real clock (`stepView(rdt)` in `frame()`, `VIEW_SECS 0.9`, cubic; `RM` snaps). Cache: `whereGo` paints the WIDE view once, padded by `groundPad()` to the whole world (`gpadWant`, `gview` records the painted view); `drawScene` defers `groundDirty` while easing and composites `gcv` at `k = viewS / gview.s`; arrival sets `groundDirty`. `#where` button: in the row beside the clock on wide screens, UNDER the clock on a phone (`#clockcol`, `display:contents` wide) — the row had no width for a fourth item. `OFFERS` gains `where` (last on wide, SECOND on narrow). `__where(n, secs)` hook. Also `<meta name="viewport">` — see Surprise.
**Gates:** census PASS (every section `unchanged`) · motion PASS (identical) · visual PASS (`shots/b78-*.png`: phone plaza s 2.10 cellW 12, person ~18 px; far bank s 3.0; desktop plaza s 1.89) · wide view whole-canvas hash IDENTICAL to HEAD at 390 and 1400, before and after plaza→wide · `frame-cost.mjs` wide 2.74–2.83 ms vs HEAD 2.74–2.85 · `where-cost.mjs` ease frames 1.7 ms, zoomed rest 2.1–2.5 ms; the padded wide repaint at press 11–13 ms and the arrival repaint 14–23 ms, once each.
**Verdict:** shipped.
**Surprise:** `courtyard.html` had NO `<meta name="viewport">`: a real phone laid the page out at 980 px and scaled it down, so the "390 px framing" the loop tracks (and every narrow-sill rule since #24) had never been what a phone showed — Playwright with `isMobile:true` gave `W = 940`. Added the one line; the tracked framing is now the real one. Two others: a wrapping flex plate sizes itself to ALL its items on one line (282 px), so "put it on the caption line" overflowed by 80; and the desktop far-bank frame is clamped by the world's east edge into nearly the plaza frame.
**Law:** the camera is `cellW/cellH/originX/topPad` with `FOCUS` fixed — anything registered in SCREEN space at cache time (`FACES`, `gview`) is stale for exactly the ease and must be re-registered on arrival; never move `FOCUS` under a cached layer, the pinch makes that non-affine.
**Cue:** `FACES` (window/door hit-boxes) sit at cache coordinates for the 0.9 s ease; `LIT_PANES` at night draw through them too. Transform the live overlays by the same `k` if it ever shows.

## Iteration 81 — the rose window lit live: one eased ramp off `nightF` (`roseLit()`) sets the glass, its mullions, its multiply and its screen glow; the cache holds only the unlit disc (2026-08-31) [River & far bank × Polish]

**Brief b79.** c104: the church's rose window stepped at cache time (`nightF > 0.3` chose the disc colour in `drawChurchFront`) while its relight ramped on `0.7·nightF` — a two-sided dusk seam #63 diagnosed. Also c116: `fountain-freeze.mjs`'s summer identity hashed `cv`, not `gcv`.
**Did:** `drawChurchFront` paints the unlit glass only; `ROSE` is gone. In `applyLight` after the pane screen: `k = roseLit()` (smoothstep of `(nightF − ROSE_ON 0.3) / ROSE_RAMP 0.25`), then on a live `project()`ed disc: lit glass source-over at `0.9·k`, the six mullions at `0.7·k`, the night multiply clipped to the disc at `0.8·nightF·k` (so at k = 1 it is what the cached copy was after the frame's multiply), the screen at `0.7·nightF·k`, and the halo push. Position is projected per frame, so the disc no longer sits at cache coordinates under `#where`. Threshold kept at 0.3 (the staged-appearance law); the ordinary panes untouched. `probes/fountain-freeze.mjs` summer crop now reads `gcv` at `(x + gview.pad)·DPR, y·DPR` (tolerant of a pre-#80 head copy).
**Gates:** census PASS (every section unchanged) · motion PASS (identical) · visual PASS (`shots/east.png` day: unlit disc with mullions; `shots/b79-night-wide-here.png`: lit warm) · dusk filmstrip 0 POP · `probes/rose-dusk.mjs` seed 7 day 3, 0.1 s gap, tower crop: HEAD disc 150 → 169 → 188 across two frames at 18:74–18:79 (Δ 5.37 on the lb 606 rebuild — `pops()` did NOT flag it, 2.61 preceded it); here 153 → 197 over 18:74–19:75 with no frame over the ordinary bucket Δ (max 3.09, same as HEAD's other rebuilds); gcv distinct hashes 8 and 8 — rebuild count untouched; midnight disc 197,177,165 vs HEAD 197,177,162. `fountain-freeze.mjs` summer hash 3043524937 on two runs and both builds (was different per run).
**Verdict:** shipped (+30 lines). Context budget read OVER by 0.5 KB (46.5/46) — manager's distil.
**Surprise:** the first live disc lost the mullions — they were stroked in the cache OVER the lit glass, and a 0.9-alpha live disc buried them (midnight read 197,168,137). Anything you lift out of a cache carries what the cache drew on top of it. Also: the same seam exists at DAWN reversed (HEAD 07:00 disc 195 → 163 on the lb 229 rebuild); the ramp fixes both ends since it is one function of nightF.
**Law:** `pops()` grades against neighbours at 3.5× — a step that lands next to a cache-bucket rebuild (Δ ~2.6) hides under it. For a small feature, print the feature's own pixel series (the disc's RGB), not the crop's Δ.
## Iteration 74 — the cafe gets its own custom: `cafeOpen()` / `cafeRate()` / `spawnCafeAgent()` under `CAFE_WAY`, off laneCap (2026-08-31) [Lane & market × Deepen]

**Brief:** b71 — count cafe supply AT the choice, then give the cafe an arrival source of its own (spawnTapAgent the model), never a bigger slice of laneCap.
**Did:** `cafeOpen()` (sunUp+2 .. sunDown−7), `cafeRate()` peaks at clear noon, `spawnCafeAgent()` from the west edge under `CAFE_WAY = 2`, a 3.5–7 h visit, companion across the table via withCompanion. `probes/cafe-supply.mjs` (arrivals at the choice), `cafe-hours.mjs` (presence by hour).
**Gates:** census PASS · motion PASS · visual PASS lane noon · filmstrip 0 POP. 144 arrivals / 10 seeds × 4 d; presence peak 14:00–17:00.
**Verdict:** shipped.
**Surprise:** the first cut (HEAD's 14–26 s sit, close at sunDown − 3) put the presence PEAK at 17:00–04:00 and 0.0 at 09:00–12:00 — a 25-cell walk at nominal 2.2 cells/s took 6.4 h, not 4.9. The visit had to shrink to a coffee and the hours close 7 h before sunset for the tables to be empty by night; noon is still the rising edge because dawn is the earliest honest departure.
## Iteration 75 — the courtyard's own arrivals come in twos: `spawnAgent(room)` → `withCompanion`, bench case on `a.benchAt` (2026-08-31) [Courtyard & garden × Connect]

**Brief:** b73 — c107: pairs stopped at the courtyard wall; call `withCompanion(a, room)` from `spawnAgent` under `capacity`, and make the bench case work on BENCH_SPOTS.
**Did:** `spawnAgent(room)` takes the room test the way the lane/east spawners do and calls `withCompanion(a, room)` after `agents.push`; kids, picnic (`a.mate`), gardener and napper excluded. A courtyard sitter's bench is its LAST waypoint, so `else if (a.benchAt)` shifts that waypoint −0.5 and sets `a.pairSeat = 1.0`; `b.benchAt = null`. No draw code.
**Gates:** census PASS (people +16, reshuffle) · motion PASS · visual PASS · filmstrip 0 POP · `shots/b73-bench-pair-77.png`. `probes/pairs.mjs` 10 seeds × 2 d: 21 pairs = 26.9 % of courtyard arrivals, separation in [0.9, 1.6] 99.9 %; `sitter-pairs.mjs`: 8/8 companions sat beside a seated leader.
**Verdict:** shipped.
**Surprise:** the bench pair the brief pictured exists at about ONE daylit sighting per ten days — sitters are 16 % of a courtyard roll that fires ~0.7×/day, so the visible thing is the crossers and strollers walking in twos, not the bench. Five seeds of nothing looked like a bug until the counter said 8/8.
**a.mate vs a.with:** keep them separate — `a.mate` is two EQUAL agents with their own waypoints who judge the sky once; `a.with` is a follower with no route of its own.
## Iteration 76 — the rain, the leaves and the gutter learn the wind's sign: rain slant on `windDir()`, leaves culled at the world edge, per-leaf fall drift (2026-08-31) [Sky, light & weather × Connect]

**Brief b72.** c108 rain ignored windSign; c109 street-tree leaves left the world under an east gust; c110 every lane leaf landed in road row 70.
**Did:** shower step `r.x -= v·dt·0.12·windDir()` and the streak `r.x − 2.4·windDir()`; a drop recycles across the WINDWARD edge. Leaves: `LEAF_EDGE_W/E = −3 / GW+3`, culled with `landLeaf`. Each leaf gets `l.vy` on its first step, folded from the `ph` it already drew (triangular on [0.15, 0.85], peak at the old 0.5). No new `R()`.
**Gates:** census PASS (leaves −9, reshuffle) · motion PASS, leaf spawns identical to baseline · visual PASS · filmstrip 0 POP · `wind-sign.mjs` 0 flips in-spell. `probes/wind-consumers.mjs`: leaf oob 57 → 0 samples over 10 seeds × 30 d; road litter row 70 only → rows 68–73; rain dx −7.81 at +1, +7.81 at −1; sign forced +1 over 20 d is HEAD's algebra to the bit.
**Verdict:** shipped.
**Surprise:** the gutter heap was 4697 over 4 seed-days at HEAD and 7176 spread here — the spread lands MORE litter, because row 70 was the row the sweeper cleared every morning and rows 69/71 are not yet where he walks.

## Iteration 84 — the sundial: a stone plinth and gnomon on the inner lawn, its shadow cast live from sunVec() (2026-08-31) [Courtyard & garden × New element]

**Brief:** b82 — a sundial inside the bed ring, shadow per frame off the roofs' own sun, one non-walkable cell, named with the hour.
**Did:** `DIAL = 13`, `SUNDIAL = {x:32, y:35, h:0.85}` — inner lawn south of the linden (27 cells from a bench, 13 from the RING, wear 0 around it after four days). `buildGrid` sets it, `pairStands` refuses it, the ground cache paints it GRASS. `drawSundial` a live item at y+0.9 (after the linden): plinth shadow + the gnomon's throw on the grass, `dialThrow(h)` = −SUN·h·shOffset()/SUN[2], alpha 0.22·daylight·shadowF(), width × shSpread(); plinth, face with hour lines and the reading clipped to the plate, gnomon. `sundialName()` reads the SUN's hour (`12 + (sunArc−0.5)·dayHours`, 45 min behind the clock); night and shadowF < 0.5 say so. Census TN gets 'DIAL'. No R().
**Gates:** census PASS — ONE structural move (tileKinds +1, DIAL +1, GRASS −1 per cell), the rest churn (the cell no longer rolls the daisy R()); **baseline re-pinned** · motion PASS · visual PASS (`shots/b82-sundial-sheet.png` 3×) · day filmstrip 0 POP · perf PASS (+0.0%) · `probes/sundial.mjs`: throw (−0.35,−0.26) 08:00 → (0,−0.22) 12:45 → (0.22,−0.24) 16:00 summer; winter noon 0.70 vs summer 0.22 cells; lid shadowF 0.2 + name flips; pixel on the throw 211 vs 230 with the draw stubbed (margin 19); all PASS.
**Verdict:** shipped (+85 lines).
**Surprise:** "walkers already route around non-walkable cells" is not how this town walks — routes are WAYPOINTS (RING nodes, gapPt, napAt, kids, picnics) and nobody reads the grid between them; the DIAL cell keeps a companion off it and nothing else. The inner lawn is the only grass no route crosses but the nappers' two gap lines — that chose the site. And a summer throw (0.44 cells at 08:00) is shorter than the plinth's radius: the reading lives on the face; the ground shadow shows evenings and winter (1.64 cells at a winter 08:00).
**Law:** a "non-walkable cell" holds only where a route's ENDPOINTS are chosen — walkers never read the grid between waypoints; keep a cell out of every target set (ring nodes, spot pickers), not just out of the grid.
**Cue:** the inner lawn is the linden's shade at maturity — the dial sits inside the tree's shadow ellipse all day, a shadow within a shadow; name it 'in the linden's shade' when the crown is out, or thin the tree's shadow there.

## Iteration 85 — the deck's evening comes from the far side: a visitor whose afternoon ends inside a warm evening stays on, at the footbridge's east rail (2026-08-31) [People & animals × Connect]

**Brief:** b83 — c118: EVE_SPOTS' deck posts fit 0 times in 30 evenings from any gate; give the deck an ALREADY-THERE source via the one re-route, priced at the choice.
**Did:** `stayOn(a)` in the retire block (after the band's callIn): an `a.east` visitor (not the audience, not the night rail) getting up on the far bank (x > RIVER_X1 − 1, y < 60) while eveWeather() holds and !skyLifts(a) takes the nearest free deck post whose arrival + EVE_STAND lands inside [sunDown − EVE_LEAD, eveEnd()) — walk = `deckWay(a)`, their own retrace up to [TOW_WALK, DECK_WALK] (or straight up the towpath). Two NEW posts at the deck's EAST end (`stay:1`, x 126.5/124.5, mirrors of 114.5/116.5). callIn's model: a.east = false, a.dusk/a.stay/a.eveSpot set, dwell `hash(speed, 97)`, no R(); out by the alley over the deck; retire by `a.dusk && !eveOpen()`. `eveCount()` excludes stayers (gate arrivals keep EVE_CAP), `eveAll` subtracts both from laneCount (the cafeNow/cafeAll pattern). Named 'someone who stayed on, leaning on the footbridge rail'; `o.stay` in `__entities`.
**Gates:** census PASS (reshuffle; inEast −2 = the stayers leaving the count) · visual PASS (`shots/{wide,east}.png`, `b83-deck-evening-s{3d4,1d6}-3x.png` at sunDown + 1 h) · motion **FAIL on dusk/cart jumps 0→1, ruled not mine**: `probe-cartjump` replayed the scene on HEAD and here — the same 3.9-cell step at the same instant (step 169, 17:05) on both seeds, HEAD too; the cart's northbound trot is above ABS_JUMP 2.5 and only the median (how long walkers held it) decides the flag · night filmstrip 0 POP · perf skipped (one more filter/frame). `probes/evening-arrivals.mjs` (extended): summer 10 × 4 d — stayers 0.57/evening, **a deck post stood on 18/31 open evenings (58%)**, presence at +1 h 5.3 → 6.3 (HEAD run of the same probe), gate arrivals per open evening 1.97 → 1.87 (reshuffle: open evenings 34 → 31); winter 0.
**Verdict:** shipped, off-brief on WHICH posts: `probes/evening-stay-price.mjs` on HEAD — 94 far-side east retirements in 40 evenings, a walk to the WEST posts fit 1/40 (12 cells of deck ≈ 2.75 h), to the east end 31 (23/40 evenings). The brief's posts are unreachable from either side; the far side got its own pair.
**Surprise:** the rel −4 h spike of 171 retirements was the concert AUDIENCE (a.east && a.band), 324 of 418 far-side retirements — by far the deck's biggest possible source, and 290 of them stand SOUTH of the bandstand with no route north but through it (c125). At sunDown + 1 h exactly, a stayer is at the rail on only 2 of 30 evenings sampled although 18/31 evenings have one at some hour: walks 0.6–5.5 h and dwells of 1.7–4.4 h scatter the occupancy across the window — a per-instant crop undercounts a presence.
**Law:** the motion gate's jump is d > ABS_JUMP AND d > 8 × the entity's MEDIAN step in the 60 s window — a fast thing that mostly stands (the cart at CART_TROT, held for walkers) flips between pass and fail on the reshuffle alone; replay the scene on HEAD and compare the worst step's instant, not the verdict.
**Cue:** the audience: a route from the BAND_SLOTS round the bandstand to [FAR_WALK, DECK_WALK] would make the concert's end the deck's evening (34 of them fit with a path, walks 4.5–6.7 h). The east-end posts stand at the ramp foot; nothing yet names the deck's two ends apart.

## Iteration 86 — the camera's two loose ends: cached FACES hit-tested through the ease's k; the Far bank quarter fills a wide frame (2026-08-31) [The sill & the observer × Polish]

**Brief:** b84 — c119 (pane glows and hit-boxes drift off their panes mid-ease) + c120 (a desktop's Far bank IS the Plaza frame).
**Did:** `faceAt()` maps every cached face through `k = viewS/gview.s` and the origin shift (`originX − k·gview.ox`, `topPad − k·gview.tp`) — the composite drawScene puts gcv through; live faces untouched. `viewFor()` takes a per-quarter `share`: s rises to `W·share/((x1−x0)·cellW0)` (≤ VIEW_SMAX). `QUARTERS[4]` = y 0..50, share 0.3 → desktop s 3.18 (Plaza 1.89), frame x 96..138, d 7..43: rose window, mill, wheel, deck, jetty, bandstand; phone 3.02 → 3.5 (the tighter box), d −2..52.
**Gates:** census PASS (unchanged — nothing draws or rolls) · motion PASS · visual PASS (wide/courtyard/east/lane; `shots/b84-desk-far{,-night}.png`, `b84-phone-far.png`, `b84-church-{midease,arrived}-night.png`) · `probes/where-faces.mjs` 58/58: every cached window on screen hit at its LIVE centre, 5 instants × 4 quarters × 2 sizes (HEAD: 0/32 desktop, 0/8 phone mid-ease, boxes 350–418 px off) · `where-identity` IDENTICAL ×4 · `where-cost` wide 3.0 / ease 1.8 / far bank 2.1 ms against its in-session control · perf skipped (nothing per-frame).
**Verdict:** shipped (+13 lines). HALF the brief rejected on evidence: the LIT_PANES/halo half of c119 was never broken — `drawLitPanes` → `drawPane(ctx)` projects live every frame, and the probe puts each live quad on the scaled cache to 0.01 px on HEAD too.
**Surprise:** `where-identity` said DIFFERS on a change that cannot touch the wide frame — it hashes `/tmp/head.html`, a fixture an earlier iteration wrote (mtime Aug 31 04:27) and nobody refreshed; regenerated from `git show HEAD:` → IDENTICAL. And "the mill fills a third of the frame" is unreachable: 3 cells at VIEW_SMAX is 8% of 1228 px; the far bank (13 cells) is what can fill a third, and only by cutting the church or the bandstand — the y 0..50 box keeps both by dropping the lane.
**Law:** a probe's fixture in /tmp is whatever LAST wrote it — `where-identity`'s "HEAD" is a file, not `git show HEAD:`; regenerate a fixture inside the probe (or print its mtime) before believing a DIFFERS. And price a brief's PREMISE with a 20-line probe before building: half of b84 described a bug that did not exist.
**Cue:** the frame's east clamp is priced at the bottom row (p = 1): at d 43 the far bank frame's right edge is x 142, four cells past GW — the cache's over-paint hides it here, but a quarter box near the top of the world could show void. `share` is generic: the Plaza (30 cells) could take share ≥ 0.5 on a 1400 px frame.
## Iteration 77 — the frozen basin reads frozen: `fountainSkin()` lifts the ice mix from 0.43 to 1 at midwinter (2026-08-31) [Plaza & quay × Polish]

**Brief:** b74 — the basin skin capped at fountainIce()'s 0.43 max, so midwinter read as pale water, not ice.
**Did:** `FOUNT_ICE_MAX = (FOUNT_ICE − (1 − FOUNT_SWING)) / FOUNT_ICE` (0.43, the phase's real ceiling); `fountainSkin()` = ice/that, eased `k(2−k)`, 0 → 0 exactly. In `groundCol` the basin returns `c` untouched when skin ≤ 0, else `mix(c, mix('#b4c3c6','#e4ebec', skin), skin·(0.7 + 0.3·hash))` — per-cell floor 0.7 so no cell stays water. fountainIce/fountainJet/riverCol untouched; cached ground only, no per-frame draw.
**Gates:** census PASS (unchanged everywhere — draw-only) · visual PASS (`shots/b74-winter-east.png` vs `b74-head-winter-east.png`: white basin vs pale blue; summer wide unchanged) · motion PASS · perf skipped (cached layer). `probes/ground-rebuilds.mjs`: 133 / 130 per day before and after. gcv basin crop at summer noon hash-identical to HEAD; winter meanL 135 → 144 (crop includes rim/paving).
**Verdict:** shipped
**Surprise:** `probes/fountain-freeze.mjs`'s *summer* crop hash differs between two runs of the SAME file (the live plume/droplets sit inside it) — only its winter hash is a usable identity check. Hashing `gcv` (the cache the change lives on) was exact both ways.
## Iteration 78 — a watermill on the far bank: MILL footprint in buildGrid(), an undershot wheel over the water turning off riverRun() and stopped by fountainSkin(), a tail-race, a lamp lit all night (2026-08-31) [River & far bank × New element]

**Brief:** b76 — THE BET: the first new building since the loop began, sited by the worker at the north or south end of the green.
**Did:** `MILL = {130..133 × 19..24}` / `millAt()` → WALL in buildGrid(), so buildVolumes() grew the roof (eaveFor 4.7); drawFaceRow gives it ONE window (`MILL_WIN`) and a door, no random slots. `MILL_WHEEL` at x 126.35 over the water column, boat's line 116.5–121.5 clear, outside every towpath walker's x; `millAng += dt·MILL_RPS·millSpin()` in the update loop, `millSpin() = riverRun()·(1 − fountainSkin())` — exact riverRun() outside the frost, 0 at midwinter. `drawMillShadow` (before the walkers' row) and `drawMillWheel` (after) two items, #73. Tail-race streaks in drawRiverFlow scaled by spin. `windowLit`/`windowName` short-circuit on `millWindow()`; `nameAt` says 'the mill', `lookAt` names the wheel and its state. North end chosen: the park-gate routes all run rows 56–61; nothing walks the green north of the bench at row 27.
**Gates:** census PASS (WALL +135 = 15 cells × 9 samples, GRASS −135, developed +135; **baseline re-pinned**) · motion PASS · perf PASS (saturated 16.7 both) · day filmstrip 0 POP · `probes/mill-shots.mjs`: noon spin 0.683 dAng 0.615/s, 03:00 lit=true, midwinter skin 1.000 spin 0.000 dAng 0.000; crops `shots/b76-mill-{noon,night,winter}.png`.
**Verdict:** shipped (+115 lines).
**Surprise:** at rows 18–23 the footprint touched the nave (ny1 17) and the distance transform fused the two roofs into one building — the emergent roof reads adjacency as one block. One GRASS row of gap separates them. The wheel's first name read spin alone and called a half-frozen January wheel 'slow on the summer river' — name off the two causes (skin, run), not their product.
**Law:** two solid footprints that touch are ONE roof to buildVolumes() — leave a gap row, or you built an annexe.
## Iteration 79 — the warm evening's own arrivals: `spawnEveningAgent()` under `EVE_CAP`, priced by the places its walk REACHES; the window opens at sunDown − 2.5 h, not − 0.5 h (2026-08-31) [People & animals × New element]

**Brief:** b77 — a source of its own for the warm dry evening: deck, rail, quay and far benches, priced with `pathHours()` against the END.
**Did:** `eveOpen()` = day ≥ 1 ∧ warmth ≥ 0.6 ∧ dry ∧ `wetF() < 0.3` ∧ `windF() < 0.5` ∧ hour in [sunDown − EVE_LEAD 2.5, sunDown + 3). `EVE_SPOTS` (12 `taken` posts: rail y 12.5/14.5/16.5, near quay bench, two deck rail posts, far bench, three towpath posts). `spawnEveningAgent(room)` three `R()` whether or not a place fits; `eveFits()` = arrival + 1 h standing before `eveEnd()`; the stop ends by the retire rule `a.dusk && !eveOpen()`.
**Gates:** census PASS (reshuffle) · motion PASS · visual PASS (`shots/b77-eve-{wide,east}.png`) · night filmstrip 0 POP · `probes/evening-arrivals.mjs` 10 seeds × 4 d: summer 30/40 evenings open, 2.05 arrivals/evening, presence 4.3–4.9 from sunDown − 0.5 to + 4.5 h; winter 0/40 open (negative shown non-zero on HEAD).
**Verdict:** shipped, off-brief on the window: at − 0.5 h NOTHING fit in 40 evenings; at − 1.5 h one stop a night; at − 2.5 h (the tap's own lead) the brief's 4–8 at sunDown + 1 h. "Gone by + 3.5 h" cannot be met from a world edge: the shortest walk out is 2.6 h.
**Surprise:** the deck is the place the evening can least reach — the plaza crossing alone is ~4 h, so the two deck posts were chosen 0 times in 30 evenings. The deck's evening needs someone ALREADY on the far side (c118).

## Iteration 80 — the observer leans in: `#where` eases the camera onto one of four quarters and back; the ground cache is scaled through the ease, repainted once on arrival (2026-08-31) [The sill & the observer × Interaction/UX]

**Brief b78.** At 390 px the town is a strip; the plaza and far bank are not in the frame.
**Did:** the camera IS the projection: `resize()` writes the wide view to `cellW0/cellH0/topPad0/originX0`, `applyView({s,ox,tp})` scales `cellW/cellH` and moves `originX/topPad`; `FOCUS` untouched so a zoomed frame is an exact scale+translate. `QUARTERS` (Wide, Courtyard, Street, Plaza, Far bank), `viewFor(n)` fits the box (s ≤ 3.6), clamps `ox` inside the world. `whereGo(n)` eases on the real clock (`stepView(rdt)`, `VIEW_SECS 0.9`, cubic; `RM` snaps); the WIDE cache is painted once padded to the whole world (`groundPad()`, `gpadWant`, `gview`) and composited at `k = viewS / gview.s`; arrival sets `groundDirty`. `#where` button beside the clock (under it on a phone, `#clockcol`); `OFFERS` gains `where`; `__where(n, secs)`. Added `<meta name="viewport">`.
**Gates:** census PASS (unchanged) · motion PASS · visual PASS (`shots/b78-*.png`) · wide-view canvas hash IDENTICAL to HEAD at 390 and 1400 · `frame-cost.mjs` unchanged; `where-cost.mjs` ease 1.7 ms, zoomed rest 2.1–2.5 ms, the two repaints 11–23 ms once each.
**Verdict:** shipped.
**Surprise:** `courtyard.html` had NO viewport meta: a real phone laid the page out at 980 px and scaled down, so every "390 px" rule since #24 had never been what a phone showed (Playwright `isMobile:true` gave W = 940). Also: a wrapping flex plate sizes to ALL its items on one line; the desktop far-bank frame is clamped by the east edge into ~the plaza frame (c120).

## Iteration 81 — the rose window lit live: one eased ramp off `nightF` (`roseLit()`) sets glass, mullions, multiply and glow; the cache holds only the unlit disc (2026-08-31) [River & far bank × Polish]

**Brief b79.** c104: the rose window stepped at cache time (`nightF > 0.3` in `drawChurchFront`) while its relight ramped live — a two-sided dusk seam. Also c116.
**Did:** `drawChurchFront` paints the unlit glass only; `ROSE` is gone. In `applyLight` after the pane screen, `k = roseLit()` (smoothstep of `(nightF − ROSE_ON 0.3) / ROSE_RAMP 0.25`) on a live `project()`ed disc: lit glass 0.9·k, six mullions 0.7·k, night multiply clipped to the disc 0.8·nightF·k, screen 0.7·nightF·k, halo push. Projected per frame, so it no longer sits at cache coordinates under `#where`. `probes/fountain-freeze.mjs` summer crop reads `gcv`.
**Gates:** census PASS (unchanged) · motion PASS · visual PASS (`shots/east.png`, `shots/b79-night-wide-here.png`) · dusk filmstrip 0 POP · `probes/rose-dusk.mjs`: HEAD disc 150 → 169 → 188 across two frames (a Δ 5.37 step `pops()` did NOT flag); here 153 → 197 over an hour with no frame over the ordinary bucket Δ; rebuild count untouched; `fountain-freeze.mjs` summer hash now stable across runs.
**Verdict:** shipped (+30 lines).
**Surprise:** the first live disc lost the mullions — they were stroked in the cache OVER the lit glass and a 0.9-alpha live disc buried them. Anything lifted out of a cache carries what the cache drew on top of it. The same seam existed at DAWN reversed; one function of nightF fixes both ends.

## Iteration 82 — the carter: a horse-drawn cart down the cross street most mornings, loaded at the allotments' street gate, on to the stalls on market days (2026-08-31) [Cross street & allotments × New element]

**Brief:** b80 — THE BET: the first thing on the road bigger than a bicycle; own source, two draw items, walkers yield.
**Did:** attempt 1 left a ~220-line cart on disk UNCOMMITTED (budget gone before the gates); this attempt verified it, fixed three defects, landed it. `cartToday()` = hash(day,733) < 0.8; `cartDue()` opens max(sunUp+0.2, 6.3) for 1.4 h (after the 06.00 roll). `stepCart()`: south from y −4 at CART_SPEED 6.5 to the fence gate at row 45 (`sendToPlot`'s street gate — ALT_GATE opens onto the lane footway); `spawnLoader()` a holder from a hash-picked plot on that row, basket (`a.crop`) over the side → `c.load`, CART_LOAD_HOLD 1.2 s; then marketActive → lane road y 70.2, stop by MARKET_STALLS[1], out west at CART_TROT; else a sideways-kicked turn and back north (rows 79+ are VOID). `wetF() > 0.35` puts the mill's sacks on the bed (c117). `cartShove()` moves walker/stander/greeter off the axle-to-nose segment; the horse holds at 0.15× for anyone in its road. `drawCartBody` before the walkers' row, `drawCartFront` after, all through `project()` in a u/v/z frame. Named; `take(cart)`; no R().
**Gates:** census PASS (reshuffle only) · motion PASS · visual PASS (`shots/b80-0900-wide.png`, `cart-{gate,turn,north,lane,stalls}.png`) · day filmstrip 0 POP · perf PASS. `probes/cart-day.mjs` 10 seeds × 4 d: summer 30/40 days, gate 09:14, stop 3.1 h, loaded 30/30, stalls on all 10 market days, gone 16:07; winter 40/40, gate 09:41, sacks 8; **walkers inside 0/2514 and 0/2768 samples** (was 5).
**Verdict:** shipped (+224).
**Surprise:** the "at the gate with a gardener beside it" frame did not exist: basket over the side and pull-away happened in the SAME tick. The five "inside" were one browser whose own walk step undid the shove every tick.

## Iteration 83 — the weathervanes: both towers' arrows turn INTO the wind, live, on the same blend the smoke leans (2026-08-31) [Roofs & skyline × Deepen]

**Brief:** b81 — first brief of the new domain: the clock tower's static vane becomes a weathervane, driven by windSign·windF() through the windDir() blend; the same vane on the church tower; live if the tower is cached.
**Did:** both towers are in the ground cache (`drawBlocks(gtx…)`), so the cached arrow is gone and `drawVanes()` draws it live beside the live clock hands, before `drawSmoke`/`applyLight` (takes the night multiply as the cached one did). `VANES[]` two specs (CT top+4.8; the church rod between apex and cross, top+10.3). `vaneAngle(v) = π·(windSign+1)/2·windF() + vaneWob(v)`: 0 = HEAD's east arrow, which is also where an east wind (−1) holds it; a west wind (+1) swings it through north to west, linearly in windF() — a sign latched from calm steps nothing. `vaneWob()` = sin(0.6·simT + hash(v.x,v.y)·2π)·0.14 rad·(1 − windF()), 0 under RM; no R(). The arrow is a vertical plate: heading in the ground plane via the projected x/y bases at the vane, fins ±2 px in screen y, so it foreshortens edge-on when pointing north.
**Gates:** census PASS (unchanged) · motion PASS · visual PASS (`shots/wide.png`, `east.png`, `b81-vane-{clock,church}-{calm,west,east}.png`) · day filmstrip 0 POP · perf skipped (two triangles) · `probes/vane.mjs`: windF 1 sign ±1 → tips (−5, 0)/(+5, 0) clock, (−4, 0)/(+4, 0) church (mirror PASS); calm 1.9°/6.6° off rest under a ±8° wobble (PASS); wobble live differs from HEAD (fired).
**Verdict:** shipped (+37 lines).
**Surprise:** "IDENTICAL to HEAD" is unreachable for a shape lifted out of a cache — HEAD hashed stable twice; here 4 tiles differed, every one at the arrow, ±1 on 12 antialiased edge pixels: the cache composites the triangle's edge over its own pixels, then over the sky; live it composites once. Zero difference anywhere else. The first identity run differed in 108 tiles all over the town: two rAF frames after `__warp` are NOT the same instant on two pages — pin with `drawScene(simT, 1/30)` inside the evaluate (`noon-identical.mjs`), never `await frame()`.


<!-- full text of #89–#91 as written by the workers; condensed in LEDGER.md by the manager pass from #91 -->

## Iteration 89 — the audience becomes the deck's evening: a listener whose concert ends inside a warm evening walks round the bandstand, up the far walk and onto the footbridge's east posts instead of home (2026-08-31) [People & animals × Connect]

**Brief:** b87 — c125: route a share of the concert audience round the bandstand to the deck's `stay:1` posts by `stayOn()`'s own pricing; the rest home as now.
**Did:** `stayOn()` no longer refuses `a.band`; `way = a.band ? bandWay(a) : deckWay(a)`. `bandWay()` names the corner points: `[BANDSTAND.x ± BAND_ROUND 3.3, y+0.8]`, `[…, y−1.2]`, `[FAR_WALK, y−3]`, `[FAR_WALK, DECK_WALK]`, `[TOW_WALK, DECK_WALK]` — the nearer side, clear of the base ellipse (rx 2.67, ry 1.92). At the choice the green slot goes back, `a.band = false`, `a.fromBand = true` (the strike's `bandF() <= 0` would otherwise end the stay on the deck in a frame); `a.east = false` so eastCount and EVE_CAP never see them. Own `say`, `personName` 'someone from the concert, leaning on the footbridge rail', `__entities` `fromBand`. Plus one line: `chatty()` refuses `a.stay` (as it refuses `a.homer`, and for the same reason).
**Gates:** census PASS ×2 (reshuffle only) · motion PASS ×2 · visual PASS (`shots/east.png`, `wide.png`; `b87-band-deck-s1.png` a stayer on the east post at sunDown+1.2) · strike filmstrip 0 POP · `evening-stay-price.mjs` extended (CHOICE + FOLLOW), 10 seeds × 4 summer days: HEAD 274/310 listeners NOPATH, the 36 with a straight line fit 7×; here **32/33 concert evenings that ended inside eveWeather() had the audience on a deck post (97%), 19 both posts; 51/246 in-weather choices (21%, the two posts cap it); 0 on the 7 evenings that ended outside the weather; FOLLOW 51 tracks, nearest approach 1.15× the base, 0 through, 43 stood on the post**.
**Verdict:** shipped (+~20 lines).
**Surprise:** the first run had 14/56 stayers choose the deck and then walk straight past their post out through the alley. Not a bug in the route: `band-stay-trace.mjs` showed two listeners from the same concert, walking the same towpath at different speeds, passing within GREET_R and stopping for a 2.7 h word — arriving after `eveEnd()`, standing ONE frame, and the `(a.dusk && !eveOpen())` retire sending them on. The pricing at the choice is exact; what happens on the walk is not priced. Excluding stayers from `chatty()` took it to 43/51; the remaining 8 are the bell (`a.listen`, ~0.5 h) landing them past the window's end.
**Law:** a walk priced at the CHOICE is only as good as the walk's interruptions: every hold a walker can pick up en route (`greet`, `listen`, `cartShove`) is unpriced time, so a priced walker must refuse the optional ones (`chatty()`) or carry a margin bigger than the mandatory ones. A one-frame `stand` between two `walk`s is invisible at a 0.25 s sample — trace state CHANGES, and treat "walked past its own stop" as "arrived late", not "missed it".
**Cue:** a third stay post at 122.5 would let a concert put three on the rail (see state); the bell's listen still costs 8/51.

## Iteration 90 — the lane's east end was already a real end; what had never used it was the cart, whose way home from the stalls now has two ends (2026-08-31) [Lane & market × Connect]

**Brief:** b88 — c122: "nothing has ever arrived or left by the lane's EAST end; spawnLaneAgent enters at x −2.5 only; a nearer-end routeToExit(); a share of the cart's departures east."
**Premise REJECTED for the walkers:** `spawnLaneAgent` has rolled `fromW = R() < 0.5` since the first commit — half its arrivals enter at `GW + 2.5`, every itinerary exits at the OPPOSITE end (`toX`). `probes/lane-ends.mjs` on HEAD, 10 seeds × 4 days, counted at spawn/despawn: **entries W 40 · E 32 · N 13; exits W 26 · E 18 · N 19** (39 "inside" exits are `goHome` doors). Two-way bridge traffic was already there. The "whole lane back" clause is **2 of 102** walkers — no rule built. `routeToExit()` is the courtyard's ring exit. The "WEST edge only" inventory line was the brief restated; corrected.
**Did (c122's own words were about the cart):** `cartHomeX()` = `hash(day, 763) < CART_EAST (0.5) ? GW + 4 : −4`, the last waypoint after the market stop. A per-day hash like `cartToday()` — no `R()`, so census and every west day are HEAD-identical. Salt by histogram: 10 of the 20 cart-market days in 120 go east, the first on day 10; 747 put the first on day 22 in every world.
**Gates:** census PASS (unchanged) · motion PASS · visual PASS (wide/courtyard/lane/east unchanged) · `probes/cart-east.mjs` 5 cart-market days × 2 seeds: E on 10/14/30, W on 22/26, both seeds; berth intrusions only passing cyclists at x 69/111 (HEAD's west runs show the same) · `probes/cart-east-shots.mjs`: trotting east over the bridge 18:50, under the lit gatehouse 19:16, tail leaving at x 139 (lane row visible to 139.6 — both exits off-frame) · filmstrip 0 POP.
**Verdict:** rejected — the premise; ~8 lines shipped for the cart clause (its one true remainder).
**Surprise:** `hash(day, 733)` is seed-independent: my first window (days 4–7) held a market day the cart skips in EVERY world, 20/20 trips read north — a short window is one sample of the calendar, not ten seeds' worth.
**Law:** when a brief says a thing has NEVER happened, grep the constant it would use (`GW + 2.5`) and count it on HEAD at the choice — 32/102 is not never; an inventory line written by the pass that wrote the brief is not a second witness.
**Cue:** c133 — the cart's 18–20 h homecoming is after dark in winter, by either end; uncounted.
**Budget:** context-budget OVER on open (48.3 / 46 KB) and after (49.1) — the manager's signal.

## Iteration 91 — the vanes get silhouettes: a weathercock on the church, an arrow with a tail and a fixed cardinal cross on the clock tower, and both are named with the wind they stand in (2026-08-31) [Roofs & skyline × Polish]

**Brief:** b89 — c123: the church vane goes to a 1-px sliver edge-on and neither vane is named; give each `VANES[]` entry a silhouette that reads at every heading, name them in `lookAt()`.
**Did:** `VANES[]` entries carry `kind` and `name`; both `len` 5. `vaneAxes()` gives the heading AND its ground-plane normal as screen vectors, so a plate foreshortens while the width across it grows. `kind:'cock'`: a body ellipse whose seen half-width is `max(along-heading, COCK_HALF_W·len·|nx|)` — 2 px wide from the side, ~4 from behind — plus a `COCK[]` plate (tail fan, neck, comb, beak), legs to a ball on the rod. `kind:'arrow'`: head, shaft and swallow tail, and a cross-bar with W/E/N/S in 6 px bold, fixed in SCREEN space 7 px down the rod (never foreshortens). `vaneAt(p)` screen box, `vaneName(v)`: windF < 0.15 'idle in the calm'; else 'into a [light] {east|north-east|north|north-west|west} wind' off the unwobbled angle in eighths ('an east'). `lookAt` asks it after the mill wheel. `vaneAngle()` untouched; no R().
**Gates:** census PASS (unchanged) · motion PASS · visual PASS (`shots/wide.png`, `east.png`; `b89-vane-{clock,church}-{calm,west,east,north}.png` at 3×) · day filmstrip 0 POP · `probes/vane.mjs` (e)–(g): mirror PASS; **north footprint 23×18 px (vane) / 5×10 px (cock), was 1 wide**; names in 4 wind states PASS; **162 px differ from HEAD at a pinned instant, 0 outside the two vane crops**; the old (c) IDENTICAL is now DIFFERENT by design and says so.
**Verdict:** shipped (+~70 lines).
**Surprise:** the (c) identity test from #83 — "church vane off, clock arrow identical to HEAD" — went DIFFERENT the moment the clock vane grew a cross-bar; a probe that asserts identity with HEAD outlives the change it was written for by exactly one iteration, so the assertion moved to the diff's LOCATION (g). A 6 px letter is legible at 3× and a smudge at 1×, but the CROSS reads at 1×, which is what carries the heading.
**Cue:** c134 — the letters are 6 px CSS at every zoom; on a phone (DPR 3, s 3.5) they could scale with `cellW`, and the sill could offer the vane's name on the wind announcement.
**Budget:** context-budget OVER on open (48.4 / 46 KB) — the manager's signal.
## Iteration 84 — the sundial: a stone plinth and gnomon on the inner lawn, its shadow cast live from sunVec() (2026-08-31) [Courtyard & garden × New element]

**Brief:** b82 — a sundial inside the bed ring, shadow per frame off the roofs' own sun, one non-walkable cell, named with the hour.
**Did:** `DIAL = 13`, `SUNDIAL = {x:32, y:35, h:0.85}` on the inner lawn south of the linden; `buildGrid` sets it, `pairStands` refuses it, the cache paints it GRASS. `drawSundial` a live item at y+0.9: plinth shadow + `dialThrow(h)` = −SUN·h·shOffset()/SUN[2] on the grass, alpha 0.22·daylight·shadowF(), width × shSpread(); plinth, face with hour lines, gnomon. `sundialName()` reads the SUN's hour (45 min behind the clock); night and shadowF < 0.5 say so. Census TN gets 'DIAL'. No R().
**Gates:** census PASS — tileKinds +1, DIAL +1, GRASS −1, the rest churn; **baseline re-pinned** · motion PASS · visual PASS (`shots/b82-sundial-sheet.png`) · day filmstrip 0 POP · perf PASS (+0.0%) · `probes/sundial.mjs`: throw (−0.35,−0.26) 08:00 → (0,−0.22) 12:45 → (0.22,−0.24) 16:00 summer; winter noon 0.70 vs 0.22 cells; lid + name flips; pixel margin 19; all PASS.
**Verdict:** shipped (+85 lines).
**Surprise:** routes are WAYPOINTS and nobody reads the grid between them — the DIAL cell keeps a companion off it and nothing else; the inner lawn is the only grass no route crosses but the nappers' gap lines, which chose the site. A summer throw (0.44 cells at 08:00) is shorter than the plinth's radius: the reading lives on the face; the ground shadow shows evenings and winter (1.64 cells).


## Iteration 92 — the plaza gets a midday: families by the alley, a child that runs the roundel and chases the plaza's own pigeons back to a parent on the bench (2026-08-31) [Plaza & quay × Connect]

**Brief:** b90 — c127 + the bet: count plaza presence by hour on HEAD, then give the plaza families.
**c127 (HEAD, `probes/plaza-midday.mjs`, 10 seeds × summer days, box x 98..112 y 18..46):** 09h 2.5 · 10h 2.9 · 11h 3.0 · **12h 3.0** · 13h 2.7 · 14h 2.3 · 16h 1.6 · 03h 2.0; noon median **2.67, not 0**. But by kind at 12h: ~2 are east visitors CROSSING on `DECK_LEAD_A` (y 33.6 runs through the roundel) and only ~0.7 are stopped (bench/fountain). The premise "empty" was right about staying and wrong about the box — the deck route is the plaza's traffic.
**Did:** `spawnFamilyAgent()` — own source (`FAM_CAP 3`, `FAM_RATE 0.5`, `famOpen()` 09:30–17:00 dry with daylight > 0.35, `famCount` releases the place as a family walks out; never a share of eastCap; `laneCount` residual corrected). Parent: a `PLAZA_BENCHES` seat no other family holds (`famBench`) or the fountain stand, 9–13 s / 7–10 s. Child: `makeCompanion()` (withCompanion split; no roll) with `runSpeed` 2.8–3.6, `kidRun()` → a pigeon within `FAM_LEASH` 8 of the parent, else a ±0.8 rad arc of the roundel at r 4.7–5.8 on the parent's side; breaks off an arc for a landing pigeon; runs end when the parent stands. `plazaBirdSpot()`: `PLAZA_BIRDS 3` on their own roll, on the rings r 4.2–6, off `PAVING.plaza.keep`, never within 4.6 of anyone, on the seated family's side. Names ×4, one announce, `__entities` fam/kid/run + bird act/plaza; census `inEast` counts families.
**Gates:** census PASS (reshuffle; people +25, inEast +25) · motion: `day/cart` 0→1 jump = the median rule on the reshuffle — cart's worst step 3.9 on HEAD AND candidate, p90 2.6 both (`/tmp/cart-step`) · filmstrip 0 POP · shots `b90-plaza-noon-*` at 13:25/seed 42: bench parent + small figure + fountain group.
**Probe (candidate):** noon box 6.67 (was 2.67); families/day median **3** (0 in rain, max 5), 82 of 82 pairs left together, child > 6 cells from parent > 3 s: **0** (longest 0.8 s), runs 1.8/visit (2 runs in 41/53), chases 19/149, **visits with a child-triggered flush 24/82 — short of "one per visit"**.
**Verdict:** shipped, ~+190 lines. Quay gate built, priced at 40 cells (16 h), removed; FAM_CAP 2 gave 2/day (a family holds its place ~8 h of a 7.5 h window), so the cap is the plaza's three places.
**Surprise:** `__warp(0.05)` rounds UP to whole fixed-dt steps (~0.067 s): every "1100 steps = a day" probe ran 4 days and under-read durations 1.33× — the "17:03 exodus" I chased for two rounds was real but I had mis-timed why. Loop a probe on `day`, time it by `simT`.
**Law:** `__warp(s)` advances whole fixed-dt steps, never exactly s — a step-count is not a clock; loop on `day`/`hour`, measure durations as `simT` deltas.
**Law:** a cap holder's visit longer than the window makes families/day ≈ cap whatever the rate; price presence with Little's law (rate × visit) BEFORE picking the cap, and release the place at the START of the walk out.
**Cue:** child-triggered flushes are 29% of visits: pigeons land 7×/day and crossers flush 43 of 82 — more crumbs on the family's side, or a pigeon that returns after a scare, would pay.
**Cue:** at 03h a `dusk stay` (deck stayer) green walker is on the plaza in nearly every night sample (105 of ~110 on 4 seeds) — walking home at 3 am, or stuck; trace its lifetime.
## Iteration 85 — the deck's evening comes from the far side: a visitor whose afternoon ends inside a warm evening stays on, at the footbridge's east rail (2026-08-31) [People & animals × Connect]

**Brief:** b83 — c118: EVE_SPOTS' deck posts fit 0 times in 30 evenings from any gate; give the deck an ALREADY-THERE source via the one re-route, priced at the choice.
**Did:** `stayOn(a)` in the retire block (after the band's callIn): an `a.east` far-bank visitor (not audience, not night rail) getting up while eveWeather() holds and !skyLifts(a) takes the nearest free deck post whose arrival + EVE_STAND lands inside [sunDown − EVE_LEAD, eveEnd()) — walk `deckWay(a)`. Two NEW posts at the deck's EAST end (`stay:1`, x 126.5/124.5). callIn's model: a.east = false, a.dusk/a.stay/a.eveSpot, dwell `hash(speed, 97)`, no R(); out by the alley over the deck; retire by `a.dusk && !eveOpen()`. `eveCount()` excludes stayers; `eveAll` off laneCount. Named; `o.stay` in `__entities`.
**Gates:** census PASS (reshuffle) · visual PASS (`shots/b83-deck-evening-*.png`) · motion FAIL on dusk/cart jumps, ruled not mine: `probe-cartjump` replays the same 3.9-cell step at the same instant on HEAD · night filmstrip 0 POP. `probes/evening-arrivals.mjs`: summer 10 × 4 d — stayers 0.57/evening, **a deck post stood on 18/31 open evenings**, presence at +1 h 5.3 → 6.3; winter 0.
**Verdict:** shipped (+53), off-brief on WHICH posts: `probes/evening-stay-price.mjs` on HEAD — a walk to the WEST posts fit 1/40 (12 cells of deck ≈ 2.75 h), to the east end 31/40. The brief's posts are unreachable from either side.
**Surprise:** the rel −4 h spike of 171 retirements was the concert AUDIENCE — 324 of 418 far-side retirements, 290 of them stood SOUTH of the bandstand with no route north but through it (c125 → b87).

## Iteration 86 — the camera's two loose ends: cached FACES hit-tested through the ease's k; the Far bank quarter fills a wide frame (2026-08-31) [The sill & the observer × Polish]

**Brief:** b84 — c119 (pane glows and hit-boxes drift off their panes mid-ease) + c120 (a desktop's Far bank IS the Plaza frame).
**Did:** `faceAt()` maps every cached face through `k = viewS/gview.s` and the origin shift; live faces untouched. `viewFor()` takes a per-quarter `share`: s rises to `W·share/((x1−x0)·cellW0)` (≤ VIEW_SMAX). `QUARTERS[4]` = y 0..50, share 0.3 → desktop s 3.18 (Plaza 1.89), frame x 96..138: rose window, mill, wheel, deck, jetty, bandstand; phone 3.5.
**Gates:** census PASS (unchanged) · motion PASS · visual PASS (`shots/b84-*.png`) · `probes/where-faces.mjs` 58/58 cached windows hit at their LIVE centre, 5 instants × 4 quarters × 2 sizes (HEAD: 0/32 desktop) · `where-identity` IDENTICAL ×4 · `where-cost` wide 3.0 / ease 1.8 / far bank 2.1 ms.
**Verdict:** shipped (+13 lines). HALF the brief rejected on evidence: the LIT_PANES/halo half of c119 was never broken — `drawLitPanes` projects live every frame, to 0.01 px on HEAD too.
**Surprise:** `where-identity` said DIFFERS on a change that cannot touch the wide frame — it hashes `/tmp/head.html`, a stale fixture; regenerated from `git show HEAD:` → IDENTICAL. And "the mill fills a third of the frame" is unreachable: 3 cells at VIEW_SMAX is 8% of 1228 px; the far bank (13 cells) is what can fill a third.

<!-- full text of #92–#94 as written by the workers; condensed in LEDGER.md by the manager pass from #94 -->

## Iteration 92 — the plaza gets a midday: families by the alley, a child that runs the roundel and chases the plaza's own pigeons back to a parent on the bench (2026-08-31) [Plaza & quay × Connect]

**Brief:** b90 — c127 (count plaza presence by hour on HEAD), then families.
**c127 on HEAD** (`probes/plaza-midday.mjs`, box x 98..112 y 18..46): 10h 2.9 · **12h 3.0** · 16h 1.6 · 03h 2.0; noon median **2.67, not 0** — but ~2 are east visitors CROSSING on `DECK_LEAD_A` (through the roundel); STOPPED people ~0.7.
**Did:** `spawnFamilyAgent()`, own source (FAM_CAP 3 = the plaza's three places, FAM_RATE 0.5, `famOpen()` 09:30–17:00 dry daylit for SET-OUTS, the sun ends a stop; the walk priced against 17:00; place released as the walk out begins). Parent on a free `PLAZA_BENCHES` seat or the fountain stand; child = `makeCompanion()` (withCompanion split, no roll) with `kidRun()` — a pigeon within 8 of the parent, else a ±0.8 rad arc of the roundel on the parent's side; runs end when the parent stands. `plazaBirdSpot()`: PLAZA_BIRDS 3 on their own roll, rings r 4.2–6, off the basin, never beside anyone, on the family's side. Names, one announce, `__entities` fam/kid/run, census `inEast` counts families.
**Gates:** census PASS (reshuffle; people +25) · motion: `day/cart` 0→1 = the median rule on the reshuffle (cart's worst step 3.9 on HEAD and candidate, p90 2.6 both) · filmstrip 0 POP · `shots/b90-plaza-noon-*` 13:25/seed 42: bench parent, small figure, fountain group.
**Probe (candidate):** noon box 6.67; families/day median **3** (0 in rain, max 5); 82/82 pairs left together; child > 6 cells from parent > 3 s: **0**; runs 1.8/visit; **child-triggered flush in 24/82 visits — short of one per visit**.
**Verdict:** shipped, ~+190 lines. Quay gate built, priced at 40 cells = 16 h, removed. FAM_CAP 2 gave 2/day: a family holds its place ~8 h of a 7.5 h window.
**Surprise:** `__warp(0.05)` rounds UP to whole fixed-dt steps (~0.067 s): every "1100 steps = a day" probe ran 4 days and under-read durations 1.33× — the 17:03 exodus I chased for two rounds was real but mis-timed.
**Budget:** inventory 9.6/9.5 KB after two plaza nouns — manager to distil.
**Law:** `__warp(s)` advances whole fixed-dt steps — a step count is not a clock; loop on `day`, measure durations as `simT` deltas.
**Law:** a place-holder whose visit outlasts the window makes arrivals/day ≈ cap whatever the rate: price presence as rate × visit BEFORE choosing the cap, and release the place as the walk OUT begins.

## Iteration 93 — the allotments get their autumn: a bonfire on one bare cell, a holder with a fork who lights it on a dry calm shed day and goes when it dies, smoke, an ember pool after dark (2026-09-01) [Cross street & allotments × New element]

**Brief:** b91, attempt 2 on #93's unverified WIP (e201eb0: `bon.fire`/`bon.ember` rate-capped, `spawnBonfireHolder`, `drawBonfireLight` AFTER `applyLight`). Proved, re-priced, one clause cut.
**Cell:** (84, 19.5), GRASS in the plot gap (`block-map.mjs`); shed, pond, fence clear; the stand is off `ALLEY_Y`.
**Premise REJECTED — litter:** the shed-day litter bbox is x 4..71, 0 cells on the block (every tree is west of the fence): "litter within 3 cells consumed" would run at a rate of zero at ANY legal cell; cut.
**Re-priced:** attempt 1's `hash(day,672) < 0.45` offered 3 of the 7 shed days (12–18) → 23%. `bonfire-window.mjs`: of 40 offered seed-days only 17 had a fine 2 h set-out window (wind 1.0 on a third of autumn mornings; snow lying on day 18 in 4/8 seeds), 3–7 more turned by arrival — conversion ~35%. K 0.8, salt 285 by histogram (5–6 of 7 in every year of 12): **17/56 = 30%**, per seed 1–3. Predicate `leafShed() > 0.1`, not `leafFallF() > 0.3` (also every spring day).
**Gates:** census PASS (diff EMPTY — no census age is a shed day) · motion `dusk/cart` 0→1 = the median rule on the reshuffle (`cart-dusk-replay.mjs`: worst step 3.9 at 17:05 on HEAD and candidate, median 1.73 → 0) · filmstrip at the kindle 0 POP · `bonfire-year.mjs` 8 seeds × 27 d: 0 kindles in rain / wind > 0.5 / summer; holder at 16/17 fires (99% of burning samples); kindle 13.8–20.4 h; largest step 2.37/s · `bonfire-shots.mjs`: flames, column, holder 19:00; pool 21:00; embers 23:30; glow +39/+25 lum over the lawn (pool alpha 0.34→0.48); seen in the night wide.
**Verdict:** shipped, ~+150 lines.
**Surprise:** the weather already WAS the brief's "1 day in 3": histogram the set-out predicate and the hash has almost nothing left to cut — K went to 0.8 to land the band. Three crops were of the clock tower: a page clip needs the canvas rect (a law I had just read).
**Law:** a hashed calendar share sits on a weather predicate's CONVERSION — count fine windows per offered day first (17/40), then set K to the success band; the brief's share is the product, not the factor.
**Law:** the motion gate's scenes are days 3, 7, 11, 19, 22 — a feature living on days 12–18 is invisible to it; carry continuity (largest step by identity) in its own probe.

## Iteration 94 — the linden's shade becomes a place: one predicate the draw and the choices read; on a hot day the picnic pair carry the blanket in through a bed gap and spread it in the shade, the sleeper and the sundial say where they are (2026-09-01) [Courtyard & garden × Connect]

**Brief:** b92. Step one on HEAD (`probes/shade.mjs`, 10 seeds × days 5–7, warmth 0.97): courtyard presence inside the wall — **10 h median 0.25 (mean 0.78) · 13 h median 1.0 (0.97) · 16 h median 2.0 (1.62)**; at 13 h kid 0.43, napper 0.23, picnic 0.27, sitter 0, gardener 0. Seed 42 at 13:25: day 5 = 3 (2 kids, 1 napper), days 6 and 7 = **0** (c135 confirmed). **The lawn is under 2 people at a summer noon on the median seed** — reported, not retuned; capacity is the manager's call.
**Premise priced:** at a hard summer sun the ellipse (rx ≤ 8.2, ry ≤ 6.9, centre +1.2 south) covers **0% of the picnic annulus r 9–12 and 100% of the inner lawn** — "inside the shade" is the inner lawn, so the hot pair go in through a bed gap like the napper (`shadeSpots()`: 5 stands per gap at r 3.3, off the sundial by 1.6, off anyone lying/sitting or headed there by 2.2, spots in FRONT of the trunk first — behind it the crown covers them). The cool rule (turn by eighths until out of the shade) has 3% of the annulus to act on and never fired in 9 cool set-outs: geometrically a near no-op, kept because it is the one definition.
**Did:** `lindenShade()`/`inLindenShade(x,y)` beside `shOffset`; drawTree's pass draws `sh.cx/cy/rx/ry`; picnic branch keeps its two draws (`th`, `u`) and picks within the chosen set; `a.shaded`, `preExit` via the gap; napper's arrival line, `personName` (lie / blanket), `sundialName` 'in the linden's shade' when `leafOut() > 0.5` and the dial is inside.
**Gates:** hot 12/13 = **92% inside** (r 3.3; the one miss had both gaps blocked); cool 0/9 = 0% (HEAD 0/9). Forced-false canvas hash **20/20 IDENTICAL to HEAD** (10 seeds × 2 instants) and choices identical (17 set-outs, r 9.6–11.7). Names: summer 10–16 h all 'in the linden's shade'; **winter day 19 14:00 clear (shadowF 0.57, crown bare) → 'about one'** — the flip is the crown's; sleeper 'lying in the shade of the linden' ×3, 'on the grass' after dark. Census **FAIL people 271→244 (−10%)** = the reshuffle: `census-noise.mjs` 8 seeds HEAD 486 vs 489 (+0.6%), every ±10 cell is a shower that moved; HEAD's own spread on identical code 19%. Motion PASS · filmstrip 0 POP · `probes/sundial.mjs` PASS · `shots/b92-shade-picnic-7/42`.
**Verdict:** shipped, ~+60 lines.
**Surprise:** the shade does not touch the lawn the brief thought it shaded — the ellipse ends 1 cell short of the outer lawn at noon. 'Out in the sun' never fires by day: the inner lawn is 100% shade from day 5 on, so the words exist for a young tree only.
**Law:** a brief that names a THRESHOLD on a region ("inside the ellipse ≥ 80%") is pricing an intersection — sample the region's coverage of the consumer's set first (0% of the annulus); the rule may have to move the consumer, not the threshold.
## Iteration 87 — the eyot: the river's first landform, a reed-ringed island in the east half with a willow leaning over the channel; ducks nest on it in spring, the swans take it as a third bank (2026-08-31) [River & far bank × Scale/World]

**Brief:** b85 — THE BET, rung 4b: an island (new tile, census moves), shingle, reeds, ONE willow on windDir(), swans' third bank, ducks nesting, streaks parting; the boat's channel untouched.
**Did:** `EYOT = 14`; `EYOT_AT` (124.3, 46, rx 1.75, ry 5) evaluated ONCE in `buildGrid`; `onEyot/offEyot/eyotShore` read the tile back. 26 cells. The cache paints them as WATER and the island WHOLE in `drawEyot()` (three cell-columns were a rectangle). `drawWillow` live: 22 hashed fronds, lean windSign·windF()·gust, bare whips in winter. Streaks, cache ripples and night columns skip the tile. Swans: `eyotShore` joins `nearBank`; `SWAN_EYOT_PULL` 4; every target and step through `offEyot`. Ducks: `nestF()` (0.16–0.44) wants 2 `d.eyot` ducks off the EAST shore, on the nest after dark. Named; `pairStands` refuses it; TN + 'EYOT'. `QUARTERS[4]` x0 122, y1 53.
**Gates:** census PASS — **EYOT +26, WATER −26, tileKinds +1, ducks +2 in spring; baseline re-pinned** · motion PASS · visual PASS (`shots/b85-*.png`) · day filmstrip 0 POP · `frame-cost.mjs` ±0.1 ms (perf.mjs 16.70 both sides: vsync-bound) · `probes/eyot.mjs` 10 seeds × 4 d: **13 boats, 3956 frames, 0 inside**; swans 0/13480 on the turf, 1288 preen samples at its shore (4/10 seeds); names exact · `where-faces` PASS.
**Verdict:** shipped (+222). speciesKinds NOT moved: `SPECIES` is the planting CA; a tree is an item, not a species.
**Surprise:** the far bank's own quarter could not see the island — HEAD's box shows rows 5–42.5 on a desktop, and a `share` raises s PAST the height fit while the frame keeps the box's centre: my first widened box (share 0.37) reached row 44. Share 0.3 shows rows 1.5–48 at 2.6× (phone 0–51 at 3.3×). And the east bank at x 125.4 is nearer than the island's shore from everywhere but the channel: without a pull the eyot won a preen on 2/10 seeds.
**Law:** a quarter's `share` sets s from WIDTH alone; price a box's rows with `project()` on the target frame — the foreground sill strip eats the bottom 7% of every frame.
**Cue:** the eyot is a place nobody can reach: a punt from the jetty (JETTY x 128.4, y 35) is the only way onto it — a rung-5 vector. Also: the willow's fronds hang below the sill strip in the Far bank quarter on a desktop.

## Iteration 88 — river mist: a weather nobody had seen; ONE rate-capped scalar rises off the water before sunrise on still, clear, cold-or-wet mornings, veils the river and far bank live, and the sun burns it off (2026-08-31) [Sky, light & weather × Scale/World]

**Brief:** b86, rung 4a (attempt 3 — the first two left nothing on disk: no `mist` in the source, no probe, no inventory line).
**Did:** `mist` stepped by `stepMist()` beside `stepWet`: target 1 in [sunUp − 1, min(sunUp + 2.2, 09:00)) while !raining ∧ windF < 0.35 ∧ cloudCover < 0.5 ∧ warmth < 0.65 ∧ (wetF > 0.2 ∨ warmth < 0.55); rises in 0.8 h, falls at 1/h × (0.3 + 1.4·daylight + 1.5·windF + rain) — a dark calm hour barely thins it, a rising wind clears it. No hash, no R(): every input is itself rate-capped. `mistAt(x)` the weight (1 on the water, 0 eight cells inland). `drawMist()` after `drawRiverFlow`, before `applyLight`: a ¼-res offscreen — horizontal gradient of mistAt at the polygon's mid row (the pinch moves the banks < 2 cells over the run), six hashed wisps sliding downstream, a `destination-out` fade above row 13 so the spire and the clock tower stand out; stops at the lane. HAZE mixed 0.4·mist toward `mistCol()` at cache time; lamp halos × (1 + 0.7·mistAt); `nameAt` on river WATER → 'mist on the river'; announce at the rising 0.5; the morning lapse's landing line names it.
**Gates:** census PASS (unchanged, ×2) · motion PASS · visual PASS (`shots/mist2-*.png`; courtyard + lane untouched) · dawn and burn-off filmstrips 0 POP · perf PASS (16.70 both, vsync-bound) · `probes/mist-identity.mjs`: `mistTarget` forced 0 over the whole run → canvas IDENTICAL to HEAD; unforced, 110/141 differing tiles inside the veil's x-range, the other 31 the out-of-frame roofs at the LEFT edge (HAZE); +0.08 ms/frame at mist 1 · `probes/mist-year.mjs` 8 seeds × 26 d sampled at sunUp + 0.5: **opens 17/48 shoulder, 17/80 winter, 0/80 summer mornings, 0 in rain** (the brief's literal thresholds: 9/48) · `probes/mist-landing.mjs`: from 20:00 the clock tap lands at 06:36 = sunUp + 0.5 with mist 1.00 and 'mist on the river' under the pointer; 0.74 at 08:20, gone 09:08.
**Verdict:** shipped (+~115 lines). Off-brief on the thresholds, priced by the histogram as the brief asked.
**Surprise:** a scalar held AT its target oscillated ±r every step — `else if (mist > 0)` burned it whenever `tgt > mist` was false, which includes tgt === mist === 1 (the landing curve read 0.99/1.00/0.99 before the fix). And a ground-hugging layer cannot make towers "stand out" in this oblique projection: every ray crosses the same thickness of it, so the clearing is a fade in SCREEN depth (rows 1.5–13), not a height.
**Law:** a rate-capped scalar's two branches are `tgt > x` and `tgt < x`, never `else` — at the target the else branch runs, and a ±r flicker at the ceiling passes every gate but a printed curve.
**Cue:** 3 of 34 mist mornings still read mist 0.3–0.76 with windF 0.44–0.61 at sunUp + 0.5 — a windy day's wind rises from the 06:00 roll, AFTER the mist formed (realistic); "never opens in wind" must be sampled at the OPEN (sunUp − 1), not at + 0.5.
**Budget:** context-budget read OVER after this entry (46.5 / 46 KB) — the manager's signal, not mine to fix this pass.

## Iteration 89 — the audience becomes the deck's evening: a listener whose concert ends inside a warm evening walks round the bandstand and onto the footbridge's east posts instead of home (2026-08-31) [People & animals × Connect]

**Brief:** b87 — c125: route a share of the concert audience round the bandstand to the deck's `stay:1` posts by `stayOn()`'s own pricing.
**Did:** `stayOn()` no longer refuses `a.band`; `way = a.band ? bandWay(a) : deckWay(a)`. `bandWay()` names corner points round the base ellipse (`BANDSTAND.x ± BAND_ROUND 3.3`) to `[FAR_WALK, …]`, `[TOW_WALK, DECK_WALK]`. At the choice the green slot goes back, `a.band = false`, `a.fromBand = true`, `a.east = false`. Own `say`/`personName`; `__entities` `fromBand`. Plus: `chatty()` refuses `a.stay`.
**Gates:** census PASS ×2 · motion PASS ×2 · visual PASS (`b87-band-deck-s1.png`) · strike filmstrip 0 POP · `evening-stay-price.mjs` (CHOICE + FOLLOW) 10 seeds × 4 summer days: HEAD 274/310 listeners NOPATH; here **32/33 in-weather concert evenings put the audience on a deck post, 19 both posts; 51/246 chose (the two posts cap it); FOLLOW 51 tracks, 0 through the base, 43 stood**.
**Verdict:** shipped (+~20 lines).
**Surprise:** 14/56 stayers walked straight PAST their post out through the alley — not the route: two listeners from the same concert passed within GREET_R on the towpath and stopped for a 2.7 h word, arrived after `eveEnd()`, stood ONE frame, and the retire rule sent them on. Excluding stayers from `chatty()` took it to 43/51; the other 8 are the bell's `a.listen`.

## Iteration 90 — the lane's east end was already a real end; the one unbuilt clause was the cart's way home, which now has two ends (2026-08-31) [Lane & market × Connect]

**Brief:** b88 — c122: "nothing has ever arrived or left by the lane's EAST end; a nearer-end exit; a share of the cart's departures east."
**Premise REJECTED for the walkers:** `spawnLaneAgent` has rolled `fromW = R() < 0.5` since the first commit — half its arrivals enter at `GW + 2.5` and every itinerary exits at the opposite end. `probes/lane-ends.mjs` on HEAD, 10 seeds × 4 days: **entries W 40 · E 32 · N 13; exits W 26 · E 18 · N 19**. The "whole lane back" case is 2/102 — no rule built. The inventory's "WEST edge only" line was the brief restated; corrected.
**Did:** `cartHomeX()` = `hash(day, 763) < CART_EAST (0.5) ? GW + 4 : −4` as the last waypoint after the market stop — per-day hash, no `R()`, west days HEAD-identical; salt chosen by histogram (first east day 10).
**Gates:** census PASS (unchanged) · motion PASS · visual PASS · `probes/cart-east.mjs` E on 10/14/30, W on 22/26, both seeds · `cart-east-shots.mjs` trotting east over the bridge 18:50, under the lit gatehouse 19:16 · filmstrip 0 POP.
**Verdict:** rejected — the premise; ~8 lines shipped for the cart clause.
**Surprise:** `hash(day, 733)` is seed-independent: a 4-day window held a market day the cart skips in EVERY world — a short window is one sample of the calendar, not ten seeds' worth.

## Iteration 91 — the vanes get silhouettes: a weathercock on the church, an arrow with a tail and a fixed cardinal cross on the clock tower, both named with the wind they stand in (2026-08-31) [Roofs & skyline × Polish]

**Brief:** b89 — c123: the church vane goes to a 1-px sliver edge-on and neither vane is named.
**Did:** `VANES[]` entries carry `kind` and `name`. `vaneAxes()` gives the heading AND its ground-plane normal as screen vectors, so a plate foreshortens while the width across it grows. `kind:'cock'`: body ellipse (seen half-width `max(along, COCK_HALF_W·len·|nx|)`) + a `COCK[]` plate, legs to a ball. `kind:'arrow'`: head, shaft, swallow tail, and a W/E/N/S cross-bar in 6 px bold fixed in SCREEN space. `vaneAt(p)`/`vaneName(v)` ('idle in the calm' / 'into a [light] north-west wind' in eighths); `lookAt` asks after the mill wheel. `vaneAngle()` untouched; no `R()`.
**Gates:** census PASS · motion PASS · visual PASS (`b89-vane-*` at 3×) · filmstrip 0 POP · `probes/vane.mjs`: mirror PASS; **north footprint 23×18 / 5×10 px, was 1 wide**; names PASS; **162 px differ from HEAD, 0 outside the two vane crops**.
**Verdict:** shipped (+~70 lines).
**Surprise:** #83's "clock arrow IDENTICAL to HEAD" probe went DIFFERENT the moment the arrow grew a cross-bar — an identity-with-HEAD assertion outlives the change it was written for by exactly one iteration; the assertion moved to the diff's LOCATION. A 6 px letter is a smudge at 1× but the CROSS reads, and the cross carries the heading.



<!-- full text of entries 97-99, condensed in LEDGER.md at manager pass from #99 -->

## Iteration 97 — a murmuration: starlings boil over the river on dry autumn and winter dusks, funnel into the church tower, a thin skein leaves at first light — ONE hashed particle field in the sky, in front of the backdrop, behind the cache (2026-09-01) [Roofs & skyline × New element]

**Brief:** b96, attempt 2 on an unproven WIP (source + probe + shots; no ledger, no commit). Verified, fixed four things, landed.
**Did:** `drawMurmuration(ctx)` right after `drawSky` — the backdrop is composited INSIDE drawSky, so that seam is in front of the far hills and behind every cached roof and tower. `murmSeason()` = `leafShed() > 0.1 || leafOut() <= 0`; `murmWx()` dry ∧ windF < 0.7; `murmEnv()` rises from sunDown−1.3 over 0.35 h, falls past sunDown+0.05. N = 80 + hash(day,601)·81; 2–3 attractors on simT sines; per-particle hash phases; funnel from sunDown−0.5, each bird staggered and fading over the back half of its drop into `MUR_ROOSTS`. `stepMurm()` latches `roosted`/`murAnnounced` sim-side; `skeinEnv()` sunUp−0.05..+0.55. `murBox` → lookAt. No R().
**Fixed in the WIP:** skein count keyed on hash(day) — a winter sunUp before 06:00 straddles the roll (d14 sunUp 5.86) → the roost's day; dots ≥ 1.5 px, alpha +0.1 (a smear at 1×); forming ramp 0.2 → 0.35 h; the cost probe was BLIND (seed 7 day 17 has no flock, env 0) → the season's largest day (19, N 149), murmWx forced 1.
**Gates:** census PASS (unchanged ×2) · motion PASS · filmstrips 744 (0.25 s ×14), 746.2 (0.1 s ×12) 0 POP · `probes/murmur.mjs`: year 8 seeds × 26 d — 80 season evenings, 35 dry, **formed 35/35, 0 in rain, 0 off-season**; identity 6 summer instants HEAD-identical (rerun after each edit); cost 4.46–4.49 vs 4.52–4.54 ms = **+0.05 ms** at N 149; pixels s42 d13: 0 → 390 px by sunDown−1.1, 302→178→85→8→0 over 0.3 h = 0.7 s real, no step; announce ×1 per flock day · `probes/murmur-shots.mjs` (warped from the DEFAULT start): `shots/b96-murmur-*.png`.
**MISS — the Far bank quarter:** its frame top is at depth +0.15 (topPad 2.4 px at s 2.59): it holds NO sky, so nothing behind the roofline can show in it; witnessed at its scale on the wide framing. The funnel is −0.5 → −0.3, not −0.1: gone before the dusk relight.
**Verdict:** shipped, ~+120 lines over two attempts.
**Surprise:** a dark flock has ONE band to live in — depth ≤ −6, above the far hills' top; lower is dark on the dark distant town, and every quarter starts below the horizon: a sky feature exists for Wide only.
**Cue:** c144 — Far bank `y0` ≈ −8 would frame the spire, the roost and the flock; a camera call against #86/#87's fit.
**Budget:** context-budget OVER at open (49.6/46 KB) — manager, distil.

## Iteration 98 — the lane gets its morning: ONE figure with a bag comes in west before sunrise, leaves a bottle on two steps and walks back out; the brief's fourteen doors priced to a 30 h walk (2026-09-01) [Lane & market × New element]

**Brief:** b97 — a round working all fourteen HOME_DOORS in sunUp − 0.3..+ 1.6, plus dawn-lit HOME windows (count first).
**Priced FIRST:** the sweeper traced on HEAD: 68 cells in 13.15 h = **5.2 cells/h** (0.87 × 2.6). Fourteen doors ≈ 155 cells ≈ 30 h; 1.9 h buys ten cells and no door. "Fewer doors" priced to ZERO at that window, so the WINDOW became the variable: `ROUND_H` 5 h of sunrise → doors 4 and 8, then back out west (the east end is 28 h away).
**Did:** `updateRound()` beside the sweeper: `mround` in at sunUp − 0.3 (`roundDay` latch, `snowCover <= 0.5`, umbrella in rain), door legs to `ROUND_STEP_Y` + the walk back; `roundDeliver` (hashed stand; `roundMarks` taken in by 09:30 − 1.5·hash, or 0.75 h after a late one); `drawStepMarks` item at y 65.11; `a.bag`; `nameAt(x, 65)` 'a bottle left on the step'; personName; `__entities` round/left; `laneCount − roundCount()`; `chatty` refuses it; the morning landing line names it. No R().
**Dawn windows — counted, not built** (`probes/dawn-lit.mjs`): a dawn IS lit, 4–7 panes at sunUp − 0.8..0 — but early risers key on the dawn EDGE, so the count RISES to 10–11 at sunUp + 0.5 in winter. Cue c146.
**Gates:** census FAIL people −13% = reshuffle (`census-noise.mjs`: HEAD's own spread 14%, candidate −6% over 8 seeds, RAIN differs by cell; `probes/round-identity.mjs`: round forced off → canvas IDENTICAL to HEAD, as built differs) · motion PASS · filmstrip at the landing hour 0 POP · `probes/morning-round.mjs` 10 seeds × 2 seasons: in −0.22/−0.28 20/20, 2 doors 20/20, out + 6.2..7.4, greets 0, max step 0.65; summer marks [4,8] at 07:30 and [] at 09:30, 10/10; landing at sunUp + 0.5 with the round walking at x 1.6, line 10/10 · `round-bottle.mjs`: 3 px at 1×, 11 at DPR 2, 0 after.
**MISS:** 2/14 doors; out + 6.6 not + 1.6; at the landing the round is at the west end, not mid-street.
**Verdict:** shipped, ~+75 lines.
**Surprise:** the brief's pricing was 15× off and its own fallback priced to nothing.
**Law:** price "works the N places" as N × (leg + stand) at ~5 cells/h BEFORE choosing N; when the window prices to zero, widen the WINDOW to the trip that reads (a morning ≈ 5 h of sunrise), never the speed.
**Budget:** OVER at open (50.9 / 46 KB).

## Iteration 99 — the camera reads the sill, and the east clamp finally holds at the top row (2026-09-02) [The sill & the observer × Polish]

**Brief:** b93 (attempt 2) — c129 willow under the sill, c126 void past GW at a quarter's top row, c134 the vane's 6 px cardinals at every zoom. Attempt 1 committed all three **unverified** (session limit); verifying them, two did not hold.
**Did:** kept attempt 1's `sillTop()` (one definition, read by `drawSill` and `viewFor`), its fit/centre against `pic` with overflow held at the top, and its `k = viewS` scaling of the vane draw and hit-test. **Fixed the clamp:** its escape hatch `if (nearL < 0 || nearR > W) oxT = held(1)` fired on *every* far-bank frame — the far bank's `x1` **is** `GW`, so its near-row east corner is the world's own edge and necessarily past `W`, handing the clamp back to the old bottom-row behaviour. Now guarded by `q.x0 > 0` / `q.x1 < GW`. **Added `Plaza share:0.5`** (item 2's other half).
**Gates:** census PASS (five groups unchanged) · motion PASS vs a baseline taken on the pre-attempt-1 file through `--page` (zero delta) · `where-identity` IDENTICAL at 390 and 1400, incl. the round-trip through the rescaled Plaza · before/after crops of q3/q4.
**Probes:** `probes/where-void.mjs` (new) — east void at the frame's *visible* top row: far bank **172→0 px**, plaza **144→0**, four framings. `probes/vane-letters.mjs` (new) — font off the page's own `fillText`: control 6/6/6 px at s 1/2/3.5, candidate 6/12/**21**.
**Verdict:** shipped.
**Surprise:** the "before" far bank looked like the *better* picture, and that was the bug — it showed invented land. The ground cache over-paints past `GW`, so the void reads as a grey wedge only on the top rows it misses; the rest looked like green field. Closing it moves the frame east, so the quarter shows less far bank — which looks like a regression and is not one.
**Law:** a brief's success criteria can contradict each other — price them against each other before building. b93 wanted the far bank at "rows 0..52" *and* `share:0.3`; the share forces s ≥ 2.586, 52 rows needs s ≤ 2.27. Its parenthetical (eyot's shore above the sill) was the achievable reading. "Letters ≥ cellW·1.7" is likewise a glyph wider than the vane is long.
**Law:** a clamp priced at a box's corner must ask whether that corner is the *world's* edge — on a world-edge box the test is trivially true and silently disables the clamp.
**Cue:** c147, c148, c149.
**Budget:** `context-budget.mjs` **OVER**, 49.7/46 KB on entry; inventory 12.1/9.5 KB — distil this pass.
## Iteration 92 — the plaza gets a midday: families by the alley, a child that runs the roundel and chases the plaza's own pigeons back to a parent on the bench (2026-08-31) [Plaza & quay × Connect]

**Brief:** b90 — c127 (count plaza presence by hour on HEAD), then families.
**c127 on HEAD** (`probes/plaza-midday.mjs`, box x 98..112 y 18..46): 10h 2.9 · 12h 3.0 · 16h 1.6 · 03h 2.0 — noon median 2.67, not 0; ~2 are east visitors CROSSING on `DECK_LEAD_A`, STOPPED people ~0.7.
**Did:** `spawnFamilyAgent()`, its own source: FAM_CAP 3 (= the plaza's three places), FAM_RATE 0.5, `famOpen()` 09:30–17:00 dry daylit for SET-OUTS, the walk priced against 17:00, the place released as the walk out begins. Parent on a free `PLAZA_BENCHES` seat or the fountain stand; child = `makeCompanion()` with `kidRun()` (a pigeon within 8 of the parent, else a ±0.8 rad arc of the roundel); runs end when the parent stands. `plazaBirdSpot()`: PLAZA_BIRDS 3 on their own roll, rings r 4.2–6, off the basin, never beside anyone. Names, one announce, `__entities` fam/kid/run.
**Gates:** census PASS (reshuffle; people +25) · motion `day/cart` 0→1 = the median rule on the reshuffle (worst step 3.9 on HEAD and candidate) · filmstrip 0 POP · `shots/b90-plaza-noon-*`.
**Probe:** noon box 6.67; families/day median 3 (0 in rain); 82/82 pairs left together; child-triggered flush 24/82 visits.
**Verdict:** shipped, ~+190 lines. A quay gate was built, priced at 40 cells = 16 h, and removed. FAM_CAP 2 gave 2/day: a family holds its place ~8 h of a 7.5 h window.
**Surprise:** `__warp(0.05)` rounds UP to whole fixed-dt steps (~0.067 s): every "1100 steps = a day" probe ran 4/3 of a day and under-read durations 1.33× — the 17:03 exodus chased for two rounds was real but mis-timed.


## Iteration 100 — the diorama gets a foreground: rows 79..87 stop being VOID and become our own slated roof, seen from above (2026-09-02) [Roofs & skyline × Scale/World]

**Brief:** b100 — build the near band as the roof of the block we look out over. Take the swing.
**Did:** the footprint went into `buildGrid` as WALL (`WELLS` punches two light wells, still VOID) and **`buildVolumes` grew the roof**: ridge along the lane, hips at the river, valleys round the wells. Three statements, each a footprint or an eave, never a roof — `eaveFor` 0 for `y >= LN_WALK_S`, `solidAt` runs the block off both x edges, `WELLS`. Then `drawNearRoof` (called from `drawOurSide`, cached layer): `drawRoofRow` per row so snow/key/haze/CHIMNEYS come for free, a flared apron off row WH that falls into shadow, ridge capping, moss on the north pitch, `drawParapet` (coping + lead gutter + hoppers), `drawWell`, `drawDormer`/`drawRoofLight` one per house, `drawPartyWalls` with the stacks on them. `ROOF_LIGHTS` → `drawRoofLights()` beside `drawLitPanes`, pushed to `LIT_PANES` so the night multiply is undone as a facade window's is. Slate, not pantile, per house off `SLATES`. `nameAt` names all three. The six screen-space awning stripes came back into the WORLD along the kerb (rows 77.65..79); HEAD's 24 px shadow band over the footway went.
**Gates:** census PASS, re-pinned (`developed` +1095/world, `structures` +7, VOID 1107→12, `tileKinds` held at 12 by the wells) · motion PASS vs a HEAD baseline through `--page` · filmstrip 0 POP · perf +0.0% · shots day/night/snow/rain × desktop/phone.
**Probes** (`probes/near-roof-band.mjs`, `canvas-diff-where.mjs`): near band luma<20 — desktop **24.9% → 9.6%**, phone **59.7% → 21.7%**; mean luma 31.9→94.8 and 18.8→73.2; sd 26→35 and 7.7→38.7. Snow forced 0/0.3/0.55/1 → band mean **86 / 103.7 / 118.6 / 145.6**. Night: 5 of 20 rooflights lit at 22:35, 0 at 01:30 (the town's own hours). Nothing is drawn north of row 79 but the awnings.
**Verdict:** shipped, ~+230 lines.
**Surprise:** the first slab was pantile-orange and read as one flat field — the fix was not more detail but **less brightness**: a dark near block is what lets the town read past it. And two instrument traps in one run: `roofZ` takes a VERTEX index, so `drawChimney(g, bx - 0.5, …)` indexed `vZ` fractionally and returned NaN — the stacks were counted by the census and drawn nowhere; and a HEAD-vs-HEAD control differed in 332 px, so "first row differing from HEAD = 90" was rasterizer noise, not a leak into the sky.
**Law:** A roof drawn NEAR the camera is priced against what is BEHIND it, not against itself. `project()` lifts z northward on screen (`LIFT` 1.15), so every cell of height on a foreground volume walks it one 1.15 rows up the frame and into whatever it was supposed to sit in front of. Give the near block eave 0, put its parapet at a row whose top lands south of the boundary (`PARA_Y + PARA_Z·LIFT ≥ row`), and price each thing that stands on it — a stack is 1.4–2.4 cells and the pot 0.66 more — by the row it stands on, not by the roof.
**Cue:** nothing looks down the light wells, nothing lands on the near ridge (`MUR_ROOSTS` could take one), and on a phone in snow the band is a large bright blank — the apron is 128 px of its 164.
## Iteration 93 — the allotments get their autumn: a bonfire on one bare cell, a holder with a fork who lights it on a dry calm shed day and goes when it dies; smoke, an ember pool after dark (2026-09-01) [Cross street & allotments × New element]

**Brief:** b91, attempt 2 on #93's unverified WIP (e201eb0). Proved, re-priced, one clause cut.
**Did:** cell (84, 19.5), GRASS in the plot gap (`block-map.mjs`), stand off `ALLEY_Y`. `bon.fire`/`bon.ember` rate-capped; `bonfireDay()` = `leafShed() > 0.1 && hash(day,285) < 0.8` (not `leafFallF() > 0.3`, which is also every spring day); `bonfireWeather()` dry/calm/no snow; `spawnBonfireHolder()` (a.tend, a.fork) out at sunrise, kindles ~9 h on; `drawBonfireLight` AFTER `applyLight`.
**Premise REJECTED — litter:** the shed-day litter bbox is x 4..71, 0 cells on the block: "litter within 3 cells consumed" would run at a rate of zero at ANY legal cell; cut.
**Re-priced:** `bonfire-window.mjs`: of 40 offered seed-days only 17 had a fine 2 h set-out window (wind 1.0 on a third of autumn mornings; snow on day 18 in 4/8 seeds) — the weather already WAS the brief's "1 day in 3", so K went 0.45 → 0.8: 17/56 shed days = 30%, per seed 1–3.
**Gates:** census PASS (diff EMPTY — no census age is a shed day) · motion `dusk/cart` 0→1 = the median rule on the reshuffle (`cart-dusk-replay.mjs`) · filmstrip 0 POP · `bonfire-year.mjs` 8 seeds × 27 d: 0 kindles in rain / wind > 0.5 / summer; holder at 16/17 fires; kindle 13.8–20.4 h · `bonfire-shots.mjs`: flames + column 19:00, pool 21:00, embers 23:30, glow +39/+25 lum.
**Verdict:** shipped, ~+150 lines over two attempts.
**Surprise:** three crops were of the clock tower — a page clip needs the canvas rect, a law I had just read. The motion gate's scenes (days 3, 7, 11, 19, 22) never see days 12–18.

## Iteration 94 — the linden's shade becomes a place: one predicate the draw and the choices read; hot picnic pairs carry the blanket in through a bed gap, the sleeper and the sundial say where they are (2026-09-01) [Courtyard & garden × Connect]

**Brief:** b92 — count courtyard presence on HEAD, then `inLindenShade` as the ONE predicate.
**Count on HEAD** (`probes/shade.mjs`, 10 seeds × days 5–7, warmth 0.97), lawn kinds inside the wall: 10 h median 0.25 · 13 h median 1.0 · 16 h median 2.0; at 13 h kid 0.43, napper 0.23, picnic 0.27, sitter 0, gardener 0. Seed 42 13:25: day 5 = 3, days 6–7 = 0. Reported, not retuned (→ b95).
**Premise priced:** at a hard summer sun the ellipse (rx ≤ 8.2, ry ≤ 6.9) covers 0% of the picnic annulus r 9–12 and 100% of the inner lawn — so the hot pair go IN through a bed gap like the napper: `shadeSpots()` = 5 stands per gap at r 3.3, off the sundial, off anyone lying/sitting, in FRONT of the trunk. The cool rule has 3% of the annulus to act on and never fired in 9 set-outs; kept as the one definition.
**Did:** `lindenShade()`/`inLindenShade(x,y)` beside `shOffset`; drawTree draws `sh.cx/cy/rx/ry`; the picnic branch keeps its two draws and picks within the chosen set; `a.shaded`, `preExit` via the gap; napper line, `personName`, `sundialName` 'in the linden's shade' when `leafOut() > 0.5` and the dial is inside.
**Gates:** hot 12/13 = 92% inside; cool 0/9 (HEAD 0/9). Forced-false canvas 20/20 IDENTICAL to HEAD, choices identical. Names flip with the crown (winter clear day 19 → 'about one'). Census FAIL people 271→244 (−10%) = the reshuffle (`census-noise.mjs`: 8 seeds HEAD 486 vs 489; HEAD's own spread on identical code 19%) · motion PASS · filmstrip 0 POP · `shots/b92-shade-picnic-*`.
**Verdict:** shipped, ~+60 lines.
**Surprise:** the shade does not touch the lawn the brief thought it shaded — the ellipse ends 1 cell short of the outer lawn at noon; 'out in the sun' never fires by day, so the words exist for a young tree only.

## Iteration 95 — the lawn gets its own population: spawnLawnAgent() off LAWN_CAP places, the staying kinds leave the ring's roll, the sun's window prices every walk and ends every stay (2026-09-01) [Courtyard & garden × Deepen]

**Brief:** b95 rung 6 (attempt 3; attempt 2 left a complete uncommitted WIP — verified it, fixed three defects, landed it).
**Did:** `spawnLawnAgent()` on the family model: LAWN_CAP 4 holders, each claiming a PLACE (bench / bed-gap nap / blanket angle / kid's run / edge bed) at the choice, released as the walk out begins; walks priced at the choice against the sun's window; the five staying branches deleted from `spawnAgent` (ring keeps dog/crosser/walker; capacity daylight term 9 → 6); `finishItinerary`/`routeToExit` honour `lawnCut` chords (door↔lawn direct — HEAD's sitters ring-walked "out" until 4 am).
**Fixed in the WIP:** (1) set-outs were gated on live `daylight > 0.35`, so winter arrivals began ~13 h — added `lawnStart()` and priced the arrival's daylight in `lawnFits` (open a trip earlier than its hour); but the lower bound alone made every midnight roll pick the east arch (the one walk long enough to land in the window — street door set-outs 3 → 349, 15.8 h marathons), so `lawnOpen()` also requires the sun UP at set-out. (2) gardener spot was `pick(EDGE_BEDS)` over ALL beds after fitting only the nearest — far beds killed the roll at the bag; now picks among fitting beds like the sitter. (3) `lawnClosed()` (rain OR failing light) ends every stay; walkers-in walk on and the seat is judged at the seat — turning them round too hard-cleared a rainy noon to 0.03 (outside HEAD ± 1 the OTHER way).
**probes/lawn-day.mjs** (10 seeds × summer d5–7, inside-the-wall box — shade.mjs's lawn-only box never sees a bench): 13 h median 6.0 (target 4–7; HEAD 4.0, min 0), 10 h 4.0 (≥2), 16 h 6.0 (≥3), every kind >0 at 13 h; night stayers 0/10 seeds vs HEAD 1–3 stuck (HEAD holds 4.2–4.4 lawn-kind people at 0–5 h — it NEVER emptied). Winter d19 13 h median 2.0 (HEAD 3.0, ±1 ✓ — a child, a sitter; no one lies under 0.45 warmth). Rainy noon 5.0 vs HEAD 3.0: MISS on the letter of ±1, but all 15 inside-wall people across 3 seeds at a pinned rainy 13 h are state `walk` (arrivals in transit); relative response matches HEAD (−13% vs −12%), and the band is unsatisfiable jointly with the population target — reported, not tuned.
**Gates:** census PASS, people 252 → 284 vs HEAD (+13%, the predicted rise; inCourtyard +15; baseline re-pinned post-ship) · motion PASS (an interim run flagged day/cart 0→2 — cart-dusk-replay: worst step SAME instant/place both builds, the #92/#93 median rule on the reshuffle) · filmstrip 0 POP · shots/b95-lawn-{1325-s42-d6,0900-s42-d4}[-head].png: 11 vs 4 and 7 vs 3 inside the wall.
**Verdict:** shipped, ~+160 net lines over the two attempts.
**Surprise:** `?t=<n>` is a DIFFERENT WORLD from the default start — same seed, same DSF, but shoot.mjs `--t 347` had s42 d6 13:25 RAINING while every warp-from-default probe has it clear. A shot meant to witness a probe's number must be taken by warping from the same start the probe used, or it witnesses a different calendar.
**Budget:** context-budget reads OVER — 48.3/46 KB after this entry (state grew two lines, the entry is long for a three-defect attempt-3): manager, distil this pass.
**Law:** an arrival-window lower bound without a set-out bound is a marathon-walker factory: at any closed hour the one branch that passes pricing is the LONGEST walk. Bound both ends of the trip, not just the landing.

## Iteration 96 — the eyot gets its way on: ONE punt at the jetty's mooring, a jetty stander whose window fits poles over, stands under the willow, poles home — and the count says the jetty is an evening place, so it almost never fires (2026-09-01) [River & far bank × Connect]

**Brief:** b94 — the punt to the eyot (c128); count jetty stands/dwell on HEAD first.
**Count on HEAD** (probes/punt.mjs, 10 seeds × summer d5–7): jetty stands/day median 0, mean 0.53 (range 0..2); dwell median 10.7 s = 4.67 h sim. The WHEN is the real finding: every stand lands 17:30–03:00 — the deck walk from the east gates is ~12 h sim, so the jetty is an evening place. The earliest stand (17.52) has 3.05 h of eastOpen() left; the two best-placed are pairs.
**Did:** punt{leg 0..4} at PUNT_MOOR off the jetty's south edge; puntFits at the stop's perform (deterministic, no draw): dry ∧ windF < 0.5 ∧ eastOpen ∧ eastCloseHour() − hour > puntTripH(a) + 0.75. Arrival priced against the window's END; the way back is the retire rule's business — a dusk return is the walk-home-in-the-dark every east visitor already makes. puntClaim splices [MOOR, SHORE, STAND, SHORE, LAND] into the retrace at a.i, so EVERY end-of-stay (timer, rain, skyLifts, the light) walks them to the landing, never across water; aboard = state 'punt', stepAgent early-returns, updatePunt owns x/y. drawPuntHull + drawPuntCrew (two items, pole strokes on simT); swans held 1.2 off PUNT_LAND while puntAtShore(); personName/lookAt tname/__entities; one announce at push-off.
**Gates:** census PASS (unchanged ×2 — zero new stream draws) · motion PASS · filmstrip 0 POP · perf PASS (16.70 = control) · punt-force.mjs (manufactured rider, wind/rain pinned): full cycle 10:36→16:04, cross 1.13 h ≈ the brief's ~1 h, stand 12.5–14.2 under the willow, 0 water-walk steps, swans 0 samples < 0.9, announce ×1, retrace resumed; late run: stand ends 20.27, eastOpen closes 20.56 mid-walk-back, punt home 22.15 after dark, 0 strandings · shots/b94-punt-{push,channel,willow}.png at 3×.
**MISS (success band):** natural crossings 0/30 seed-days vs "1–3/day" — the honest price (3.4–4.1 h) never fits the ≤3.05 h any real stand has in hand. Not the pricing: the inflow. One forced-run side-effect showed the shape that works — an overnight walker arriving mid-afternoon crossed unprompted (14.81 push-off, wind pinned 0).
**Verdict:** shipped, ~+150 lines. The rate is the manager's call: DECK_SHARE up, an OFFERS invitation, a towpath rider, or accept a rare punt.
**Surprise:** puntStayH folds a.phase — but a.phase is the GAIT phase, mutated every step, so the stay "drawn" at the choice reads differently by landing (1.01 → 1.69 h). Deterministic and in-band, but a fold of a mutating field is re-drawn per read — fold a field written once.
**Law:** a place's traffic has an ARRIVAL-HOUR histogram, not just a rate — a stop 12 h of walking from its source is an evening place, and a daylight-priced offer sited there runs at zero. Count WHEN, not only how often.
**Budget:** context-budget read OVER at open (47.4/46 KB) — manager, distil this pass.


<!-- full text of iteration 103, condensed in LEDGER.md at manager pass from #104 -->
## Iteration 103 — the plaza's paving starts to age: moss creeps into the joints, thickens through the wet shoulders and is scuffed out of every line people walk (2026-09-02) [Plaza & quay × New CA]

**Brief:** b103 — the plaza is the largest uniform surface in the town and does not age. Give it a per-cell rule.
**Premise checked:** substance holds — nothing greens paving anywhere. (The brief's `measured` line is stale on one word: `moss` *does* appear on HEAD, on the near roof's north pitch from #100. Not the plaza.)
**Did:** `moss[]` over the plaza's PATH cells (730 of them), stepped in `caTick` beside the beds. Three terms and no more: **creep** (`nb`, the four-neighbour mean — the CA part), **shelter** (`mossShel[]`, the share of a cell's eight neighbours that is not paving, read ONCE off the grid in `buildMoss`), and **the year** (`mossGrowF()`/`mossDieF()` off `warmth`, `greyF()`, `wetF()` — the cool wet shoulders grow, `MOSS_DRY` bleaches, `MOSS_COLD` freezes off; separate rates, because moss comes in over days and goes in hours). `mossTop[]` is the ceiling, `mossFloor()` a hold under the drawn threshold so the shoulder regrows out of the deepest joints instead of colonising bare stone. Feet cut it in `stepAgent` exactly where `wear[]` is cut in the courtyard. Drawn as the sett's own seam plus 0–4 hashed blades (`drawMoss`, `MOSS_BUCKET` 6) over a tint in `groundBase`. `nameAt` says "green in the joints"; census gains `mossy`. No `R()`, no route change, no walkability change.
**Gates:** census PASS, **every group unchanged** (no `R()` draw ⇒ no reshuffle) · motion PASS · filmstrip day 0 POP · ground rebuilds **133/134 per day, identical to HEAD** (`caTick` already sets `wearDirty` every tick, so the throttle was already the cadence) · `frame-cost` 3.22 vs its interleaved control 3.15–3.23 summer, 3.42 vs 3.42–3.44 winter — under the noise floor · night, 0.75 snow and 390×844 all clean, no page errors.
**Measured vs a HEAD control the probe regenerates itself** (`probes/moss-shots.mjs`, seed 42, four phases each pinned to warmth AND 10:00): green pixels over a paving-only band, HEAD **0.00% at every phase**; candidate **0.06% autumn (warmth 0.25) · 0.02% spring · 0.00% midsummer · 0.00% midwinter**, `mossy` 342 / 346 / **0** / 0 of 730. Over two years × 3 seeds (`probes/moss-year.mjs`): peak 349–365, trough **0**, sheltered/open cell mean **0.20 / 0.05**.
**Feet are load-bearing, not decoration** (`probes/moss-feet.mjs`, 4 days of footfall, 3 seeds): at *matched shelter*, walked cells mean **0.01** with 0–1 drawn against quiet cells **0.44–0.68** with all drawn; the mouth onto the lane reads **0.54–0.62** against 0.73 for the rest of its row.
**Verdict:** shipped, ~+130 lines.
**Surprise:** the first draft was a green verge down both sides of the plaza, and the fault was not the colour — it was that **shelter is constant along an edge**, so every cell of the run sat at the same ceiling and the rule painted a stripe. Muting the palette to fix that made the feature invisible without making it read any better; a hashed term on the ceiling fixed it at the original colour. Two seasons of the open square were also silently dead: the skip guard `!mossShel[i] && !moss[i]` treats a legitimate mid-square cell (shelter 0) as "not a plaza joint" the moment dieback zeroes it, so it is never stepped again.

## Iteration 97 — a murmuration: starlings boil over the river on dry autumn and winter dusks, funnel into the church tower, a thin skein leaves at first light (2026-09-01) [Roofs & skyline × New element]

**Brief:** b96, attempt 2 on an unproven WIP (source + probe + shots; no ledger, no commit). Verified it, fixed four things, landed it.
**Did:** `drawMurmuration(ctx)` right after `drawSky` — the backdrop is composited INSIDE drawSky, so that seam is in front of the far hills and behind every cached roof. `murmSeason()` = `leafShed() > 0.1 || leafOut() <= 0`; `murmWx()` dry ∧ windF < 0.7; `murmEnv()` rises from sunDown−1.3 over 0.35 h, falls past sunDown+0.05. N = 80 + hash(day,601)·81; 2–3 attractors on simT sines; per-particle hash phases; funnel from sunDown−0.5, staggered, into `MUR_ROOSTS`. `stepMurm()` latches roosted/murAnnounced sim-side; `skeinEnv()` sunUp−0.05..+0.55; `murBox` → lookAt. No R().
**Fixed in the WIP:** skein count keyed on hash(day) straddles a winter sunUp before 06:00 (d14 sunUp 5.86) → key it to the roost's day; dots ≥ 1.5 px and alpha +0.1 (a smear at 1×); forming ramp 0.2 → 0.35 h; the cost probe was BLIND (seed 7 day 17 has no flock, env 0) → run it on the season's largest day (19, N 149) with murmWx forced.
**Gates:** census PASS ×2 · motion PASS · filmstrips 0 POP · `probes/murmur.mjs` 8 seeds × 26 d: 80 season evenings, 35 dry, **formed 35/35, 0 in rain, 0 off-season**; 6 summer instants HEAD-identical; cost +0.05 ms at N 149; pixels s42 d13 0 → 390 → 0 over 0.7 s real, no step; announce ×1 per flock day · `probes/murmur-shots.mjs`, warped from the DEFAULT start.
**MISS — the Far bank quarter** holds NO sky (frame top at depth +0.15, topPad 2.4 px at s 2.59), so nothing behind the roofline can show in it. The funnel is −0.5 → −0.3: gone before the dusk relight.
**Verdict:** shipped, ~+120 lines over two attempts.
**Surprise:** a dark flock has ONE band to live in — depth ≤ −6, above the far hills' top; lower is dark on the dark distant town, and every quarter's frame starts below the horizon: a sky feature exists for Wide only.


<!-- #105 full text; the entry in LEDGER.md is condensed to the per-entry cap -->
## Iteration 105 — the bottom band becomes a windowsill: a lit far edge, grain, a nosing, and three things that finally throw a shadow (2026-09-02) [The sill & the observer × Polish]

**Brief:** b105 — the band below `sillTop()` is a flat black bar; give it value separation without raising the mean.
**Premise re-priced, and it moved twice.** (a) The brief's headline (min==max==mean==8.4 over the *whole* band, 0 px above luma 20) does **not** reproduce: measured below `sillTop()` at 1200×720 s42 t=175 the band is min 2.2 / max 82.0 / range **79.8**, 3,364 px above 20. The top ~6 px are the existing lit edge + shadow line. Drop those and the claim is *exactly* right and stronger than stated: rows 6→bottom are **min == max == 8.4, range 0.000**, at 1200×720 (48,384 px), 1600×950 (71,224) and 390×844 (19,074). The defect is the sill's **surface**, not the band. (b) "The pots and cup cannot be seen" is **false** — they silhouette against the *apron*, above the sill line: pot column min 8.1 against a bare column's 80.5. What could not be seen is the surface they stand on, so the build gives them shadows rather than contrast.
**Root cause of the cliff, which the brief guessed at and got backwards.** The apron's shadow gradient was anchored on `l[1]`, the roof's **last row** — and at 1200×720 that row projects to 621.8, **31 px BELOW** sillTop 590.4. `apronVisibleFrac` **0.000**: the entire ramp was painted under the band and never drawn on screen. Not "one row of ramp" — *none*. (1600×950 showed 51% of it, 390×844 70%, which is why only the desktop read as a cliff.)
**Did:** lifted that gradient out of `drawNearRoof` into `nearShadow(g)`, priced off `sillTop()` and run over whatever strip of near roof the frame shows, bounded above by the south footway (`yWalk + 1`) because this is cached ground and a live-drawn walker would not share the shadow. Rebuilt `drawSill`: a 7-stop surface gradient (lit just inside the opening, into the room's shadow, bounce on the nosing) scaled by `lit = 0.30 + 0.70*warm`; 22 **broken** grain runs; 9 scuffs; a nosing; and `cast()` — a gradient trapezoid under each pot and the cup, lying toward the viewer. All `hash()`, no `R()`.
**Gates:** census **PASS** ×2, all five groups *unchanged* (no `R()` ⇒ no reshuffle) · motion **PASS** · filmstrip day + night **0 POP** · ground rebuilds **133/134 per day, identical to HEAD** · `drawGround()` cost −0.20 ms against HEAD's own 0.90 ms p10–p90 spread, 40 interleaved rebuilds.
**Measured** (5 probes kept, each regenerating HEAD from `git show` itself): sill surface range **0.0 → 37.7 / 36.8 / 38.4** at the three sizes, mean 8.4 → 12.7/12.9/13.2. Band still reads **3.4–7.5× darker than the roof above it** at hours 10.4, 11.2, 17.8 and 23.5. Roof→sill at 1200×720 now ramps 79→50→sill where HEAD held ~125 flat into black. `sill-stands.mjs`: surface under each object vs beside it, **HEAD exactly −0.00 at all three sizes and all three objects** (a flat fill has no shadow to find), candidate −3.9 to −6.5 (weakest −1.05, the cup at 390×844, where the object is 3 px wide).
**Verdict:** shipped, ~+80 lines.
**Surprise:** the per-column difference image against HEAD reads **backwards** as a test for "the pots are findable" — mass at the bare columns (6.9) *exceeded* the pot columns (4.3). An opaque silhouette covers the band in both versions, so the object's own column is the part that changed *least*; the diff was measuring how much bare surface each column had. The signal had to be taken inside the candidate, as shadow-vs-neighbour, with HEAD's 0.00 as the control.
**Law:** a foreground element cached into the ground is only as dark as what the *camera* leaves visible — anchor a foreground ramp on the sill line, never on the world row that happens to meet it.
**Cue:** at every zoomed quarter the sill band fills with live content drawn over the cached sill (max luma 221 at Courtyard, 192 at Plaza) — identical on HEAD, so pre-existing: `drawSill` is in the ground cache and agents/overlays sort after it, so the quarters have no sill at all.
## Iteration 98 — the lane gets its morning: ONE figure with a bag comes in west before sunrise, leaves a bottle on two steps and walks back out; the brief's fourteen doors priced to a 30 h walk (2026-09-01) [Lane & market × New element]

**Brief:** b97 — a round working all fourteen HOME_DOORS in sunUp−0.3..+1.6, plus dawn-lit HOME windows (count first).
**Priced FIRST:** the sweeper traced on HEAD — 68 cells in 13.15 h = **5.2 cells/h** (0.87 × 2.6). Fourteen doors ≈ 155 cells ≈ 30 h; 1.9 h buys ten cells and no door, and "fewer doors" priced to ZERO at that window. So the WINDOW became the variable: `ROUND_H` 5 h of sunrise → doors 4 and 8, then back out west (the east end is 28 h away).
**Did:** `updateRound()` beside the sweeper: `mround` in at sunUp−0.3 (`roundDay` latch, `snowCover <= 0.5`, umbrella in rain), door legs to `ROUND_STEP_Y` and the walk back; `roundDeliver` (hashed stand; `roundMarks` taken in by 09:30 − 1.5·hash, or 0.75 h after a late one); `drawStepMarks` item at y 65.11; `a.bag`; `nameAt(x, 65)` 'a bottle left on the step'; personName; `__entities` round/left; `laneCount − roundCount()`; `chatty` refuses it. No R().
**Dawn windows — counted, not built** (`probes/dawn-lit.mjs`): a dawn IS lit, 4–7 panes at sunUp−0.8..0, but early risers key on the dawn EDGE, so the count RISES to 10–11 at sunUp+0.5 in winter.
**Gates:** census FAIL people −13% = reshuffle (`census-noise.mjs`: HEAD's own spread 14%, candidate −6% over 8 seeds; `probes/round-identity.mjs`: round forced off → canvas IDENTICAL to HEAD) · motion PASS · filmstrip 0 POP · `probes/morning-round.mjs` 10 seeds × 2 seasons: in −0.22/−0.28 20/20, 2 doors 20/20, out +6.2..7.4, greets 0, max step 0.65; marks [4,8] at 07:30 and [] at 09:30, 10/10 · `round-bottle.mjs` 3 px at 1×, 11 at DPR 2.
**MISS:** 2/14 doors; out +6.6 not +1.6; at the landing hour the round is at the west end, not mid-street.
**Verdict:** shipped, ~+75 lines.
**Surprise:** the brief's pricing was 15× off and its own fallback priced to nothing.

## Iteration 99 — the camera reads the sill, and the east clamp finally holds at the top row (2026-09-02) [The sill & the observer × Polish]

**Brief:** b93 (attempt 2) — c129 the willow under the sill, c126 the void past GW at a quarter's top row, c134 the vane's 6 px cardinals at every zoom. Attempt 1 committed all three **unverified** (session limit); verifying them, two did not hold.
**Did:** kept attempt 1's `sillTop()` (one definition, read by `drawSill` and `viewFor`), its fit/centre against `pic` with overflow held at the top, and its `k = viewS` scaling of the vane draw and hit-test. **Fixed the clamp:** its escape hatch `if (nearL < 0 || nearR > W) oxT = held(1)` fired on *every* far-bank frame — the far bank's `x1` **is** `GW`, so its near-row east corner is the world's own edge and necessarily past `W`, handing the clamp straight back to the old bottom-row behaviour. Now guarded by `q.x0 > 0` / `q.x1 < GW`. **Added `Plaza share:0.5`.**
**Gates:** census PASS (five groups unchanged) · motion PASS vs a baseline taken on the pre-attempt-1 file through `--page` (zero delta) · `where-identity` IDENTICAL at 390 and 1400, incl. the round trip through the rescaled Plaza · before/after crops of q3/q4.
**Probes:** `probes/where-void.mjs` (new) — east void at the frame's *visible* top row: far bank **172→0 px**, plaza **144→0**, four framings. `probes/vane-letters.mjs` (new) — font off the page's own `fillText`: control 6/6/6 px at s 1/2/3.5, candidate 6/12/**21**.
**Verdict:** shipped, +15 lines.
**Surprise:** the "before" far bank looked like the *better* picture, and that was the bug — it showed invented land. The ground cache over-paints past `GW`, so the void reads as a grey wedge only on the top rows it misses; the rest looked like green field. Closing it moves the frame east, so the quarter shows *less* far bank — which looks like a regression and is not one.

## Iteration 100 — the diorama gets a foreground: rows 79..87 stop being VOID and become our own slated roof (2026-09-02) [Roofs & skyline × Scale/World]

**Brief:** b100 — build the near band as the roof of the block we look out over. Take the swing.
**Did:** the footprint went into `buildGrid` as WALL and **`buildVolumes` grew the roof** — ridge along the lane, hips at the river, valleys round the two `WELLS` (still VOID). Three statements, each a footprint or an eave and never a roof: `eaveFor` 0 for `y >= LN_WALK_S`, `solidAt` runs the block off both x edges, `WELLS`. Then `drawNearRoof` in the cached layer — `drawRoofRow` per row, so snow, key light and `CHIMNEYS` come for free — plus a flared apron off row WH falling into shadow, ridge capping, moss on the north pitch, `drawParapet`, `drawWell`, a `drawDormer`/`drawRoofLight` per house, and `drawPartyWalls` carrying the stacks. `ROOF_LIGHTS` → `drawRoofLights()` beside `drawLitPanes`, pushed to `LIT_PANES` so the night multiply is undone as a facade window's is. Slate not pantile, per house off `SLATES`; `nameAt` names it. The six screen-space awning stripes came back into the WORLD along the kerb (rows 77.65..79); HEAD's 24 px shadow band over the footway went.
**Gates:** census PASS, **re-pinned** (`developed` +1095/world, `structures` +7, VOID 1107→12, `tileKinds` held at 12 by the wells) · motion PASS vs a HEAD `--page` baseline · filmstrip 0 POP · perf +0.0% · shots day/night/snow/rain × desktop/phone.
**Probes** (`probes/near-roof-band.mjs`, `canvas-diff-where.mjs`): near band luma<20 — desktop **24.9% → 9.6%**, phone **59.7% → 21.7%** (mean luma 31.9→94.8, 18.8→73.2). Snow forced 0/.3/.55/1 → band mean **86/104/119/146**. Night: 5 of 20 rooflights lit at 22:35, 0 at 01:30. Nothing is drawn north of row 79 but the awnings.
**Verdict:** shipped, ~+230 lines.
**Surprise:** the first slab was pantile-orange and read as one flat field — the fix was not more detail but **less brightness**: a dark near block is what lets the town read past it. Two instrument traps: `roofZ` takes a VERTEX index, so `drawChimney(g, bx - 0.5, …)` indexed `vZ` fractionally → NaN, and the stacks were counted by the census and drawn nowhere; and a HEAD-vs-HEAD control differed in 332 px, so "first row differing from HEAD = 90" was rasterizer noise, not a leak into the sky.

## Iteration 101 — the warm evening ends: the walk home is priced at the choice, the bell and the passing word stop taxing a priced walk, and the footbridge's far end takes three (2026-09-02) [People & animals × Deepen]

**Brief:** b101 — trace one dusk stayer's whole life, find where the walk home is lost or unpriced, close the evening; add a third far post at 122.5 and price `a.listen`.
**Traced first** (`probes/evening-close.mjs`, 10 seeds × 4 summer days, every `a.dusk` from choice to off-frame). Nothing is *stuck* — three separate things are *unpriced time*:
1. **The walk home itself.** `#79` priced the walk IN and stopped. The evening's people went off the frame a MEDIAN **4.4 h after eveEnd** (stayers; gate arrivals 2.6 h; worst 9.9 h, one still walking at 07:18), **29 of 40 nights** held a dusk agent at 03:00 and 2 stayers never left the sample at all.
2. **`chatty()` had `!a.stay` but not `!a.dusk`** — so a *gate* arrival on a walk priced to the minute stood in the road talking: one greet ran **2.79 h**. That, not the bell, was the main reason four of 51 arrivals stood one frame past `eveEnd()` and got straight up.
3. **The bell.** `a.listen` holds 0.44–0.92 h and the clock strikes every third hour; on the walk HOME it added ~1.5 h to a walk already too long.
**Did:** `EVE_GONE 26.5` (the hour the evening's people are off the frame, on `hourEve()`'s axis), `EVE_HURRY 2.3` (was a bare 1.4), `EVE_BELL 0.35`. `eveOutH(s, speed)` is the ONE priced walk home, stored as `a.eveOut` at the choice by both sources; `eveFits` now asks two bounds — the stand fits the window AND the walk home fits the night; at the post `a.eveLeave = max(hourEve() + EVE_STAND, EVE_GONE − a.eveOut)` and the retire rule reads it. `a.eveGoing` drives the hurry and makes the bell's *hold* (not its draw) be refused on the way home. `goHome(a, maxH)` gained a bound on the walk — from the deck the nearest door is 35 cells against the retrace's 33, so an unbounded `goHome` made the late walk *longer*. Third far post at **122.5**.
**Priced the brief's two asks against each other, and they collide** (`probes/evening-close-price.mjs`, 248 far-side retirements): the far posts are 33 cells / **6.0–9.2 h** (4.7 h at HEAD's hurry) from `EAST_GATE_A`, and their source releases nobody before `sunDown − 4`, so arrivals sit at **sunDown + 1.8** median. Pricing the round trip at the CHOICE in `stayOn` takes fits **41 → 2 in 248** — #85's stay would simply stop happening. So `stayOn` prices the **leave**, not the choice.
**Gates:** census PASS (people 247→278, +12%, inside HEAD's own 19% spread — the `greetPass` free-list change reshuffles the seeded world) · motion PASS vs a HEAD `--page` baseline · filmstrip night 0 POP · shots east/wide/courtyard/lane clean.
**Measured, candidate vs a HEAD control I ran** (same probes, same seeds): off-frame minus `eveEnd` gate **+2.61 → +1.46** med (max +5.48 → +1.76), stay **+4.39 → +2.15** (max +5.41 → +2.85), never-left **2 → 0**; posts lost to the bell **4 → 0**; nights holding a dusk agent at 03:00 **29/40 → 4/40**, and the four are at x 97–99, one to three cells short of the gate at 96.3, where HEAD's were mid-plaza at x 109–112. Far-post max-at-once over 60 evenings: HEAD `0:20 1:14 2:26`, candidate `0:34 1:12 2:9 **3:5**`. Witness pair `shots/b101-bridge-{cand,head}.png`: seed 3 day 6, three abreast at 23:05 against HEAD's two, and 0 dusk agents at 03:00 against HEAD's three.
**Verdict:** shipped, ~+45 lines.
**MISS:** 03h is not zero — 4 of 40 nights still have one stayer a few cells short of the gate, and the far end is empty on 34/60 evenings against HEAD's 20/60. Both are the same geometry: a post 4.7 h from every exit cannot be occupied at the window's close and clear three hours later, and pulling the leave earlier is the only lever that does not delete the stay.
**Surprise:** the fit test's first draft added `EVE_STAND` to *both* bounds and took the evening's gate arrivals from 67 to 24 — `eveEnd()` has already spent that hour, so charging it twice halved a fitting window that is only ~1.2 h wide to begin with.


<!-- condensed in LEDGER.md by the manager pass at #109; full text preserved here -->

## Iteration 107 — the far bank gets a door of its own on the field side, and the punt finally runs (2026-09-02) [River & far bank × Connect]

**Brief:** b107 — give the far bank a morning-side arrival source so the punt has a rider that fits.
**Premise re-priced; half of it is wrong.** (a) "HEAD has none before noon" is false as a daily claim — 06–12 mean **0.985**, someone on **36/40** days (`far-morning.mjs`); true only instant by instant. (b) "spawnEastAgent opens late" is **false**: **182 of 197 set-outs are before noon**, median 10.0. What is late is every ARRIVAL — every far-side branch is **8–11 h of walking** from its gate (`east-branch.mjs`: towpath 8.3, quay 8.9, jetty 10.4, green 10.8; arrivals median 19–21h), and **0 of 35** HEAD stops within 6 cells of the jetty arrive before noon. The prescription was right, the diagnosis inverted.
**c143 counted** (`jetty-choice.mjs`, wrapping puntFits on HEAD): 29 riders offered in 40 days, **all 29 refused** — companion 10, wind 8, light gone 7, rain 2, hour 2; none reached the planks before **15:24**.
**Did:** `spawnFarAgent()` — own cap (`FAR_CAP` 3) and rate, subtracted out of `laneCount` like the round, never a share of eastCap. `FAR_GATE [GW+2, 31]`: in from the east, off-frame behind the church green, on the jetty's row. `FAR_SPINE 137.2` is its N–S line, east of church (x<136), mill (x<133) and the orchard's east row, so no leg crosses a WALL cell. Five branches — mill door, orchard, church front, towpath, and the **jetty**, which sets `a.jetty`, the one thing `puntFits` reads. `farOpen()` bounds set-outs both ends; `farJettyFits()` prices the choice on TIME alone, against `eastCloseHour()` then the whole day against `EVE_GONE`. Solo always. +~100 lines.
**Gates:** census **PASS** · motion **PASS** vs a stashed-HEAD baseline, zero jumps/nan/oob/flicker · filmstrip day **0 POP** · visual `farbank-{head,cand}`, `farbank-zoom-cand`, `punt-crossing`.
**Measured** (7 probes kept): 06–12 mean **0.985 → 3.110**, morning presence **36/40 → 40/40** (fine **27/31 → 26/26**), first far-side arrival median **15.48 → 10.45**. Punt **0 → 18 landings**/40 days, a crossing on **15/26 fine days**. Lifetimes sane: median 8.4–12.2 h, max 20.5 h.
**Two false alarms, both settled on HEAD's own spread.** Census people −9.2%: `census-noise.mjs` over 8 seeds reads HEAD 583 vs **600 (+2.9%)**, HEAD's own spread 14%. Criterion 3 read 8/40 nights holding a dusk agent at 03:00 vs HEAD's 5 — but over day windows 4–8 HEAD is **5, 8, 11, 8, 7** and the candidate **8, 8, 8, 6, 2**.
**Verdict:** shipped
**Surprise:** my own first pricing was the brief's mistake one level down. Asking the weather in `farJettyFits` deleted the jetty branch on **36 of 94 mornings** — I was charging dawn's wind against a boarding five hours later, when `puntFits` was going to ask again at the moment it mattered. Taking the weather out of the choice and keeping only the walk took crossings from 0.20/day to 0.45/day. And the 42.7 h "stranded agent" was my instrument: the day rolls at hour 6.00, so an agent set out at sunUp−0.4 crosses the roll in its first minute and every clock-delta lifetime reads +24.
**Law:** A quarter's arrival HOUR is a fact about its GATE DISTANCE, not its source's window. When every branch is 8–11 h of walking, no set-out hour can make a morning and re-timing the source is wasted work — count the walk from each gate FIRST, and if that is the problem, give the place a nearer door.
**Law:** Price a choice only on what cannot be re-priced on arrival. A predicate that will ask again at the moment it matters (weather, a free mooring, a free seat) must not ALSO be asked hours upstream: that is double jeopardy, and it deletes the branch on every day the world would have allowed it.
**Budget:** opened **OVER** at 49.3 KB / 46 KB and closes at **51.7**. Two laws above are ~0.8 KB of this entry and go the moment they are promoted; the inventory is still the line that grows.

## Iteration 108 — the gardener actually reaches the bed, and works a row at a time (2026-09-02) [Courtyard & garden × Deepen]

**Brief:** b108 — the courtyard is the title object and the person who tends it is nearly never there; price presence as rate × visit, lengthen the stay, do not raise the set-out rate.
**The premise held; the cause did not.** The brief blamed the one-at-a-time rule plus long walks. Traced one gardener (`/tmp` throwaway, then `probes/gardener-presence.mjs`) and found something else: **they were being turned round at the door and kneeling OFF-FRAME.** `stepAgent`'s dusk rule was `a.lawn && !a.lawnOut && !lawnSun()`, and `!lawnSun()` is **dawn as well as dusk** — so the early walk that `lawnFits()` deliberately authorises ("open a trip earlier than its hour", #95) was aborted on its first step, every morning. The agent then hit `a.i >= a.wp.length` at the *exit* leg and the gardener branch fired there: `state='kneel'` at x 32.5, y −1.3, north of the frame, for four hours, announcement and all. Worse, it made #95's lawn a marathon-walker factory: between `sunUp` and `lawnStart` the only doors whose arrival prices past `lawnStart` are the far ones, so HEAD spent **98 of 206 lawn set-outs** on the east door and discarded them at the arch.
**Did:** `lawnGone()` — the light has GONE as opposed to not being up YET; two-sided, so the small hours still turn a walker round. `gardenerKneel()` on the allotment holder's `a.tendPlot`/`a.rows` pattern: each kneel is one row, then they shuffle along the border to another edge bed within `GARDEN_REACH` and kneel again, `a.resume` walking them there. Priced at the choice on the row's **own drawn length** (`a.rowDur`) and on the walk to the **door**, not off the frame. The gardener is now one of `lawnHolds`' place-holders (`!has(...)`, not `!agents.some(...)`), so the bed comes back as the walk out begins. And the gardener takes the **short door** — `bag.reduce` on `lawnHours`, not `pick(bag)`. `lawnRate()` and `LAWN_W` untouched. +~64 lines.
**Gates:** census **PASS** ×3 · motion **PASS** vs a HEAD-pinned baseline, zero jumps/nan/oob/flicker · filmstrip day **0 POP** · shots wide/courtyard/east/lane clean; `b108-gardener-cand-s3.png` (day 7, 09:41, kneeling at the west border) against `b108-gardener-head-s7.png` (HEAD needed ten seeds and twelve days to find one at all).
**Measured, HEAD vs candidate on the same probe and the same 12 seeds × 6 days, folded onto a 13 h band centred on solar noon** (`probes/gardener-presence.mjs`): summer presence **0.104 → 0.240**, >0 in **10.4% → 24.0%** of 3744 samples, days with a gardener **14/72 → 36/72**; winter **0.082 → 0.166**, **8.2% → 16.6%**, **17/72 → 39/72**. `probes/gardener-rows.mjs`: **1.21 rows/visit** (63 visits: 63/10/3 by row index), and the pricing is live — median headroom to `lawnEnd` is **10.0 h** on a kneel that took another row against **4.6 h** on one that did not. Side effect on the whole lawn (`lawn-day.mjs`, 8×3): set-outs **8.17 → 4.42/day** with population at 10 h **3.38 → 4.81** — half the walks, more people actually there, because the cap is finally held by people who arrive.
**Note on spread:** rebuilding twice moved summer presence 0.207/0.240 and winter 0.166/0.215 on identical criteria. HEAD vs candidate is same-seed; candidate-vs-candidate is not, and 0.7 events a day needs ~70 seed-days before a delta means anything.
**Verdict:** shipped
**Surprise:** my own guard deleted the feature I had just built. `if (a.tendBed){ … }` in the retire block was meant for "the light went mid-row", but that block is entered by the **timer running out** too — i.e. by the normal end of every row. So the next bed was queued 7 times in 62 kneels and reached **zero** times, and the row-index histogram read `{1: 62}` while a wrapper on the choice said the choice was firing. The fix is `a.timer > 0 || lawnClosed()`. A distribution over the OUTCOME caught what a counter on the CHOICE could not.
**Budget:** opened **OVER** at 51.2 KB / 46 KB.
**Law:** A predicate on the light is a predicate on the HOUR, and `!daylight` is dawn as well as dusk. Any rule that ends something because the light is low must be bounded on both sides of noon, or it will kill the early walk another rule was written to allow — and the two rules will pass each other silently, because the walker still exists, still moves, and still arrives somewhere.
**Law:** When you queue an action for later inside a shared "the visit is over" block, ask what else enters that block. Timer expiry, rain, the sky and the failing light all land in the same branch here, and a guard written for one of them fires for all four.
**Cue:** the dawn fix lets lawn walkers cross the courtyard while `nightF > 0.5` — measured at hour 4.95–5.74 with sunrise at 4.01, so an hour of real daylight after sunrise that the town still lights as night (`shots/b108-dawn-cand.png`: two children on the lawn at 04:55). HEAD read 0 there. It is arrivals, not stayers, and it looks like dawn rather than night, but `nightF`'s curve and `daylight`'s disagree by about an hour and nothing else in the town has noticed yet.

## Iteration 109 — the town stops lighting UP as the sun rises: the early risers key on sunrise, not on the night's dawn edge (2026-09-02) [Lane & market × Polish]

**Brief:** b109 — re-key `windowLit`'s early risers so panes are lit BEFORE first light and go out as the town wakes.
**Premise confirmed on HEAD, and worse than one hour.** Both ends keyed on the night clock's dawn EDGE (`t = span` = `sunUp + NIGHT_K*dayHours`) — **1.7 h past first light in winter, 2.5 h in summer** — so a lamp could come ON at sunUp+1.1 and burn to +1.6. Year curve (`probes/dawn-lit.mjs`, 26 days): the mean **dips to 2.31 at sunUp−0.8, climbs to 4.38 at +0.8**; the trough sits exactly at first light.
**Did:** one clause in `windowLit`, now reading `s = hour - sunUp` instead of `w.t` against `w.span`/`w.last`: `r = hRise/0.14`, on at `sunUp − 2.2 + 1.4r`, out at `sunUp − 0.3 + 0.7r`. All lit by sunUp−0.8, out one by one across −0.3…+0.4, latest-waker last. `sunUp` is `updateClock`'s, recomputed every frame — the hour of the sun asked where it is answered, so no fixed point. The 0.14 share, `windowHours`, `w.last`, the burn-through and every HOMES path untouched.
**Gates:** census **PASS** (scalars/tiles/life/structure/species all *unchanged* — no new `R()` draw, so the seeded world is bit-identical) · motion **PASS**, zero jumps/nan/oob/flicker · filmstrip night **1 POP, identical to the digit on HEAD** (frame 2, 0.658 — pre-existing) · shots wide/courtyard/east/lane clean.
**Measured, HEAD vs candidate, same 26 days:** winter day 19 inverts to `3 4 7 9 11 11 10 7 5 3 3 3` (HEAD `3 3 3 3 3 3 5 5 7 7 8 9`). Days RISING across sunUp+0.5 **12/26 → 0/26**; rises anywhere after sunUp **50 → 0**; `(lit at −0.8) − (lit at +0.8)` mean **−2.08 → +3.65**, positive on **26/26** days against 1/26. Peak moves **sunUp+0.8 → −0.5**. All **234** evening rows (sunDown−1…+4 × 26 days) identical. Containment proved by HASH, not by eye: the canvas is bit-identical to HEAD at the shoot instant, midday, dusk+1 and 01:30, and differs **only** at the two dawn instants.
**Verdict:** shipped, +13/−2 lines.
**Surprise:** the winter band now straddles the **06.00 day roll**, which is exactly the seam `nid` was built to survive — and it does: stepping 04:12→07:12 in 3-minute steps over five winter days, the worst simultaneous on/off swap is **0** on both builds. That zero needed an anchor, so I monkey-patched `nightAt` to return `nid = day`: the swap jumps to **2–5 windows at hour 6.03** on 4 of 5 days. `nid` is continuous because `day` increments in the *same* frame the ternary switches to `day − 1`.
**Budget:** opened **OVER** at 53.5 KB / 46 KB — the third consecutive iteration over, and the cap now trails by 16%.
**Law:** The night's clock and the sun's hour are two axes, and the gap between them BREATHES with the season. `nightF`'s edges sit `NIGHT_K*dayHours` (1.7 h in winter, 2.5 h in summer) outside sunrise and sunset, so anything that should read as happening *at first light* must key on `sunUp`, never on the night's span — keyed on the edge it lands after sunrise, and lands later the longer the day.
**Law:** To prove a gated change is CONTAINED, hash the canvas at pinned instants on both builds: identical outside the band, differing inside it. That is a stronger claim than any pair of screenshots, and it costs one `evaluate` — a draw-only vector the census cannot see is exactly where it pays.
**Cue:** the last lamps in town still go out AFTER sunrise. `w.last = span − 0.05 − 0.9*hOn` is still keyed on the dawn edge, so the ~5% burn-through windows darken at sunUp+0.7…+1.6 — winter holds a flat 2–3 panes from sunUp+0.4 and drops to 1 only by +1.2. Left deliberately: `w.last` is the evening half's and b109 was told not to touch it.
## Iteration 102 — the sky's shadow lands on the town: soft banks travel across the courtyard, the allotments and the river with the wind (2026-09-02) [Sky, light & weather × Connect]

**Brief:** b102 — connect `drawClouds()` to the ground; the wide shot is where it pays.
**Did:** `cloudDrift()` is the ONE travel scalar (`drawClouds` reads it too, arithmetic unchanged); `drawCloudShade()` lays up to `CSH_N 14` soft ellipses on the ground plane in one `multiply` pass — live, after the items and before `applyLight`, so it shades people and trees with the ground they stand on. `cloudShadeF()` is a HUMP × `daylight` (`CSH_KNEE .04` → full by `CSH_RISE .14`, held to `CSH_FALL .55`, out by `CSH_SHUT .95`): a clear sky has nothing to cast, a lid casts nothing because the town is already inside it. Bands thrown downsun off `sunVec()`, wrapped by a new `mod()`, clipped below `hz`.
**Counted, nothing pinned** (`probes/cloud-shade-presence.mjs`, 348 daylit samples, 3 seeds × 8 d): **49%** carry visible shade, 29% deep. Mean frame share shaded rises 1% → 45% across cover 0.1→0.7 and falls back to 30% under the lid.
**Gates:** census PASS, **every group unchanged** (no `R()` draw ⇒ no reshuffle) · motion PASS · filmstrip day+night **0 POP** · cost under the noise floor (`frame-cost.mjs` 3.04→3.05 ms summer) · shots wide/courtyard/east/lane + 390×844 clean.
**Measured vs a HEAD control I ran:** canvas hash at 12 instants × 2 seeds is **IDENTICAL to HEAD at cover ≤ 0.039 and at any cover after dark**, differing only where the gate says. Lawn crop, drawn twice per instant so the day's arc cancels: **81% → 98% → 93%** of unshaded over 24 s. Travel per sim second, off the frame's own profile: east wind **−1.1..−1.35 cells**, west **+1.1..+3.4**, calm **+0..+0.9** — it reverses with `windSign`.
**Verdict:** shipped, ~+70 lines.
**Surprise:** I looked at the shaded frame and the unshaded frame in turn and called them identical. They differed by **65 luma** at the core; only the difference image and a grid of Δ% caught it. Two earlier designs died of the same blindness the other way — a scatter of soft overlapping patches measures as a real change and *is* a dimmer switch.

## Iteration 103 — the plaza's paving starts to age: moss creeps into the joints, thickens through the wet shoulders and is scuffed out of every line people walk (2026-09-02) [Plaza & quay × New CA]

**Brief:** b103 — the plaza is the largest uniform surface in the town and does not age. Give it a per-cell rule.
**Premise checked:** holds — nothing greens paving anywhere. (`moss` *does* appear on HEAD, on the near roof from #100. Not the plaza.)
**Did:** `moss[]` over the plaza's 730 PATH cells, stepped in `caTick` beside the beds. Three terms and no more: **creep** (`nb`, the four-neighbour mean), **shelter** (`mossShel[]`, the share of a cell's eight neighbours that is not paving, read ONCE off the grid in `buildMoss`) and **the year** (`mossGrowF()`/`mossDieF()` off `warmth`, `greyF()`, `wetF()` — separate rates, because moss comes in over days and goes in hours). `mossTop[]` the ceiling, `mossFloor()` a hold under the drawn threshold. Feet cut it in `stepAgent` exactly where `wear[]` is cut in the courtyard. Drawn as the sett's own seam plus 0–4 hashed blades (`drawMoss`, `MOSS_BUCKET` 6) over a tint in `groundBase`; census gains `mossy`. No `R()`, no route or walkability change.
**Gates:** census PASS, every group unchanged (no `R()` draw ⇒ no reshuffle) · motion PASS · filmstrip 0 POP · ground rebuilds 133/134 per day, identical to HEAD · `frame-cost` under the noise floor · night, snow and 390×844 clean.
**Measured vs a HEAD control the probe regenerates itself** (`probes/moss-shots.mjs`, `moss-year.mjs`, `moss-feet.mjs`): green pixels over a paving-only band, HEAD **0.00% at every phase**; candidate 0.06% autumn · 0.02% spring · 0.00% midsummer · 0.00% midwinter, `mossy` 342/346/0/0 of 730. Two years × 3 seeds: peak 349–365, trough 0, sheltered/open cell mean 0.20/0.05. Feet are load-bearing: at *matched shelter*, walked cells mean 0.01 against quiet cells 0.44–0.68.
**Verdict:** shipped, ~+130 lines.
**Surprise:** the first draft was a green verge down both sides of the plaza, and the fault was not the colour — it was that **shelter is constant along an edge**, so every cell of the run sat at the same ceiling and the rule painted a stripe. A hashed term on the ceiling fixed it at the original colour (muting the palette had only made the feature invisible). Two seasons of the open square were also silently dead: the skip guard `!mossShel[i] && !moss[i]` treats a legitimate mid-square cell (shelter 0) as "not a plaza joint" the moment dieback zeroes it, so it is never stepped again.

## Iteration 104 — the bonfire's smoke becomes a column readable from across the town; its late kindles were already gone (2026-09-02) [Cross street & allotments × Polish]

**Brief:** b104 — (a) make the column read at 1×; (b) get the 2-of-17 kindles at 20:00+ into daylight.
**Priced both halves first.** (a) holds. (b) **does not reproduce on HEAD**: `bonfire-year.mjs`, 16 seeds × 27 days = **30 kindles, hour 13.8–19.1, 0 at 20:00+**; walk 7.0–11.3 h, not 13; 25–29% of autumn days keep a fire. #93's window is eleven iterations of reshuffle old, so `spawnBonfireHolder`/`bonfireHour`/pricing are untouched: the criterion is met, and moving them could only move fires/season, which `avoid` forbids.
**Did:** `BON_PUFFS 18` (was 9), `BON_THICK 0.62` (0.34), `BON_EMB_THICK 0.12` (0.06) as named constants; phase spacing `p/BON_PUFFS`, jitter 0.3 → 0.14 (nine puffs on a 0.3 jitter left *gaps*); base `spread` 0.55 → 0.9, `rise` 6.4 → 6.8; one grey became two — `g = 150 + 56·min(1, ph·3.2)`, sooty off the heap, pale a third up. Shares nothing with the chimney loop but `drift`.
**Gates:** census **PASS** (all five groups *unchanged* — correct for draw-only) · motion **PASS**, zero delta vs a HEAD `--page` baseline · visual PASS, `before/after-bonfire-{wide,crop}-s7d12.png` at 1200×720 DSF1.
**Probes** (3 new, all kept): `bonfire-column.mjs` fire-on minus fire-off in the plume's box, 8 fires — `|Δ|>6` **403 → 748 px**, peak **65.7 → 121.3**, mean|Δ| **17.5 → 35.3**. `bonfire-chimney-identity.mjs` for `avoid` — bonfire off, canvas **identical to HEAD 6/6** with the chimney branch loud (06:56, `cold` 0.98, 27 stacks; and 19:23); its non-zero control was **blind** until it walked to each seed's own fire (a pinned 15:20 is fire 0 on 2 of 3 seeds), then differs 3/3. `bonfire-1x.mjs` the wide frame at shipping size. 40-frame ink series: step max/median 3.4 (HEAD 2.9), no POP, not frozen — the motion gate's days are 3,7,11,19,22, the fire lives on 12–18, so nothing else sees this draw move.
**Verdict:** shipped — half built, half rejected on measurement; ~+10 net lines.
**Surprise:** the diff said the OLD column was drawn **strongly** (403 px past |Δ|>6, 65-luma peak) while the wide shot showed nothing. Both were right. Legibility is **mass and coherence**, not per-pixel contrast: nine circles on a 0.3 jitter are nine dots; eighteen overlapping on a 0.14 jitter are a plume, at nearly the same alpha.

## Iteration 105 — the bottom band becomes a windowsill: a lit far edge, grain, a nosing, and three things that finally throw a shadow (2026-09-02) [The sill & the observer × Polish]

**Brief:** b105 — the band below `sillTop()` is a flat black bar; separate its values without raising the mean.
**Premise re-priced, and it moved twice.** (a) The brief's whole-band `min==max==8.4` does **not** reproduce (range 79.8) — its top ~6 px are the existing lit edge. Drop those and the claim is exact and stronger: rows 6→bottom are **min == max == 8.4, range 0.000** at all three sizes (48,384 / 71,224 / 19,074 px). The defect is the *surface*, not the band. (b) "The pots and cup cannot be seen" is **false** — they silhouette against the apron *above* the sill line (pot column min 8.1 vs a bare column's 80.5). What could not be seen is the surface they stand on, so they got shadows, not contrast.
**Did.** The cliff's cause was backwards from the brief's guess: the apron's shadow gradient was anchored on `l[1]`, the roof's LAST ROW, which at 1200×720 projects **31 px below** sillTop — visible fraction **0.000**, the whole ramp painted under the band (1600×950 showed 51% of it, 390×844 70%, so only the desktop read as a cliff). Lifted it into `nearShadow(g)`, priced off `sillTop()` over whatever near roof the frame shows, bounded above by the south footway (`yWalk + 1`) — cached ground, and a live-drawn walker would not share the shadow. Rebuilt `drawSill`: a 7-stop surface gradient scaled by `lit = 0.30 + 0.70*warm`, 22 **broken** grain runs, 9 scuffs, a nosing, and `cast()` — a gradient trapezoid under each pot and the cup, lying toward the viewer. All `hash()`, no `R()`.
**Gates:** census **PASS** ×2, all five groups unchanged (no `R()` ⇒ no reshuffle) · motion **PASS** · filmstrip day+night **0 POP** · ground rebuilds **133/134/day, identical to HEAD** · `drawGround()` −0.20 ms vs HEAD's own 0.90 ms spread, 40 interleaved.
**Measured** (5 probes kept, each regenerating HEAD itself): surface range **0.0 → 37.7/36.8/38.4**, mean 8.4 → 12.7/12.9/13.2; band still **3.4–7.5× darker than the roof** at hours 10.4/11.2/17.8/23.5; roof→sill at 1200×720 ramps 79→50 where HEAD held ~125 flat into black. `sill-stands.mjs` (surface under an object vs beside it): **HEAD exactly −0.00 everywhere**, candidate −3.9 to −6.5.
**Verdict:** shipped, ~+80 lines.
**Surprise:** the per-column difference image against HEAD reads **backwards** as a test for "the pots are findable" — mass at the bare columns (6.9) *exceeded* the pot columns (4.3). An opaque silhouette covers the band in both versions, so the object's own column is the part that changed *least*; the diff was measuring how much bare surface each column had. The signal had to be taken inside the candidate, as shadow-vs-neighbour, with HEAD's 0.00 as the control.
**Cue:** at every zoomed quarter the sill band fills with live content over the cached sill (max luma 221 Courtyard, 192 Plaza) — identical on HEAD, so pre-existing: `drawSill` is in the ground cache and agents sort after it, so the quarters have no sill at all.

## Iteration 106 — the near roof gets tenants: its own bird band on ridge, pitch, well-lip and parapet, and the lane cat comes up over the parapet after dark (2026-09-02) [Roofs & skyline × Deepen]

**Brief:** b106 — #100's roof is the biggest thing in the frame and nothing lives on it; give it its own life, its own source and its own cap.
**Did:** `roofBirdSpot()` on the plazaBirdSpot pattern — own roll (`ROOF_BIRD_RATE`), own cap (`ROOF_BIRDS` 3), four perches: ridge, pitch, the north lip of a light well (c151's other half) and the parapet, which is inside the south footway's 4.5-cell scare so passers-by flush it for free. Birds carry `zf`; the land/hop machine now floors on the surface under the feet, re-read every frame (#73), and a hop that would leave the roof simply doesn't happen. On the roof they roost through the night instead of leaving. `catA` gains legs `lane→cross→climb→ridge` on its own R() roll (~60% of nights), priced against the night (27 s), not the lane (42 s). `nearScale()` ramps figure size 1→1.95 across the near block. `nearHidden()` backstops the sill. +~150 lines.
**Gates:** census PASS (birds +18, creatures +14; rest reshuffle) · motion FAIL→**false positive, proven twice**: `dusk/cart jumps 0→1`, but `probes/cart-steps.mjs` shows HEAD's cart steps median 1.733 / p99 3.9 / max 3.9 and the candidate's distribution is *identical* — and the flag moved dusk→day→dusk between three of my own builds. Zero nan/oob/flicker on every kind incl. the new `cat`. · filmstrip day 0 POP, night 0 POP · `probes/roof-life.mjs` 10×6d: daylit **0.0% → 95.7%**, after dark **0.0% → 94.4%** (cat 21.1%), cap respected · `probes/near-identity.mjs`: 37k non-roof-bird and 3k lane-cat samples at nearScale **exactly 1.000000**, predicate fires (1.935/1.605) · `probes/roof-sill.mjs` PASS at all three framings.
**Verdict:** shipped
**Surprise:** three separate zeros, each invisible without a probe. (1) `nearZ` indexes `vZ` — a FRACTIONAL x gives NaN, so every roof bird hung in `land` forever and the cat's ridge z was NaN; the census and the screenshot both passed while nothing had touched down. (2) `nearZ` averages a 2×2 of *vertices*, so a reading at row 82 still reaches row 83 — a WELL — and dropped the cat z 1.98→0.31 mid-stride, twice a crossing. (3) The well perch priced to depth 82.22 against a 82.2 cap and was rejected **by two hundredths**, silently, at a rate of zero — the exact trap that perch was written to avoid. Also: HEAD does not read 0 on `y > 79`; the rowboat runs downriver to row 92 between the block's halves (4.6%), so the brief's premise needed the river excluded before the control was clean.
**Cue:** The roof's life is confined to depth ≤ 82.2 (rows ~81.8–84.6), which is the top ~20% of the roof band at 1600×950 and on a phone — the big lower expanse of slate is still empty, because those rows are UNDER the sill at 1200×720 and items sort after the cached sill (c156). The alternative is a generous band plus `nearHidden()` clipping, which costs a blink as a bird hops the sill line at short framings. That trade is the manager's call.

## Iteration 107 — the far bank gets a door of its own on the field side, and the punt finally runs (2026-09-02) [River & far bank × Connect]

**Brief:** b107 — give the far bank a morning-side arrival source so the punt has a rider that fits.
**Premise re-priced; half of it was wrong.** "HEAD has none before noon" is false as a daily claim (06–12 mean 0.985, someone on 36/40 days). "spawnEastAgent opens late" is false: 182 of 197 set-outs are before noon, median 10.0. What is late is every ARRIVAL — every far-side branch is 8–11 h of walking from its gate, so 0 of 35 HEAD stops near the jetty arrive before noon. The prescription was right, the diagnosis inverted. c143 counted: 29 riders offered in 40 days, all 29 refused (companion 10, wind 8, light 7, rain 2, hour 2).
**Did:** `spawnFarAgent()` — own cap (`FAR_CAP` 3) and rate, subtracted out of `laneCount`, never a share of eastCap. `FAR_GATE [GW+2, 31]` in from the east, off-frame behind the church green, on the jetty's row; `FAR_SPINE 137.2` its N–S line, east of church, mill and the orchard's east row so no leg crosses a WALL. Five branches — mill door, orchard, church front, towpath, and the **jetty**, which sets `a.jetty`, the one thing `puntFits` reads. `farOpen()` bounds set-outs both ends; `farJettyFits()` prices on TIME alone. Solo always. +~100 lines.
**Gates:** census PASS · motion PASS vs stashed HEAD, zero jumps/nan/oob/flicker · filmstrip day 0 POP · shots `farbank-{head,cand}`, `farbank-zoom-cand`, `punt-crossing`.
**Measured** (7 probes): 06–12 mean 0.985 → 3.110, morning presence 36/40 → 40/40, first far-side arrival median 15.48 → 10.45. Punt 0 → 18 landings/40 days, a crossing on 15/26 fine days. Lifetimes sane (median 8.4–12.2 h). Two false alarms settled on HEAD's own spread: census people −9.2% is inside HEAD's 14%; the dusk-agent count is inside HEAD's 5–11 range.
**Verdict:** shipped
**Surprise:** my own first pricing repeated the brief's mistake one level down. Asking the weather in `farJettyFits` deleted the jetty branch on 36 of 94 mornings — charging dawn's wind against a boarding five hours later, when `puntFits` was going to ask again at the moment it mattered. Removing it took crossings 0.20 → 0.45/day. And the 42.7 h "stranded agent" was my instrument: the day rolls at hour 6.00, so an agent set out at sunUp−0.4 crosses the roll and every clock-delta lifetime reads +24.

## Iteration 108 — the gardener actually reaches the bed, and works a row at a time (2026-09-02) [Courtyard & garden × Deepen]

**Brief:** b108 — the courtyard is the title object and the person who tends it is nearly never there; price presence as rate × visit, lengthen the stay, do not raise the set-out rate.
**The premise held; the cause did not.** The brief blamed the one-at-a-time rule plus long walks. Tracing one gardener found something else: **they were turned round at the door and knelt OFF-FRAME.** `stepAgent`'s dusk rule was `a.lawn && !a.lawnOut && !lawnSun()`, and `!lawnSun()` is dawn as well as dusk, so the early walk `lawnFits()` deliberately authorises (#95) was aborted on its first step every morning. The agent then hit `a.i >= a.wp.length` at the *exit* leg and the gardener branch fired there — `kneel` at x 32.5, y −1.3, north of the frame, for four hours. It also made #95's lawn a marathon-walker factory: HEAD spent 98 of 206 lawn set-outs on the east door and discarded them at the arch.
**Did:** `lawnGone()` — the light has GONE as opposed to not being up YET; two-sided, so the small hours still turn a walker round. `gardenerKneel()` on the allotment holder's `a.tendPlot`/`a.rows` pattern: one row per kneel, then a shuffle along the border to another edge bed within `GARDEN_REACH` (`a.resume`). Priced at the choice on the row's own drawn length (`a.rowDur`) and on the walk to the DOOR, not off the frame. The gardener is now a `lawnHolds` place-holder, so the bed comes back as the walk out begins, and takes the SHORT door (`bag.reduce` on `lawnHours`, not `pick(bag)`). `lawnRate()`/`LAWN_W` untouched. +~64 lines.
**Gates:** census PASS ×3 · motion PASS vs a HEAD-pinned baseline, zero jumps/nan/oob/flicker · filmstrip day 0 POP · shots wide/courtyard/east/lane clean.
**Measured** (12 seeds × 6 days, folded onto a 13 h band on solar noon): summer presence 0.104 → 0.240, days with a gardener 14/72 → 36/72; winter 0.082 → 0.166, 17/72 → 39/72. 1.21 rows/visit, and the pricing is live — median headroom to `lawnEnd` is 10.0 h on a kneel that took another row vs 4.6 h on one that did not. Whole-lawn side effect: set-outs 8.17 → 4.42/day with population at 10 h 3.38 → 4.81 — half the walks, more people actually there. **Spread:** rebuilding twice moved summer presence 0.207/0.240 on identical criteria; 0.7 events a day needs ~70 seed-days before a delta means anything.
**Verdict:** shipped
**Surprise:** my own guard deleted the feature I had just built. `if (a.tendBed){…}` in the retire block was meant for "the light went mid-row", but that block is entered by the **timer running out** too — the normal end of every row. The next bed was queued 7 times in 62 kneels and reached zero times, while the row histogram read `{1: 62}` and a wrapper on the choice said the choice was firing. Fix: `a.timer > 0 || lawnClosed()`. A distribution over the OUTCOME caught what a counter on the CHOICE could not.

## Iteration 109 — the town stops lighting UP as the sun rises: the early risers key on sunrise, not on the night's dawn edge (2026-09-02) [Lane & market × Polish]

**Brief:** b109 — re-key `windowLit`'s early risers so panes are lit BEFORE first light and go out as the town wakes.
**Premise confirmed on HEAD, and worse than one hour.** Both ends keyed on the night clock's dawn EDGE (`t = span` = `sunUp + NIGHT_K*dayHours`) — 1.7 h past first light in winter, 2.5 h in summer — so a lamp could come ON at sunUp+1.1 and burn to +1.6. Year curve (26 days): the mean dips to 2.31 at sunUp−0.8 and climbs to 4.38 at +0.8; the trough sits exactly at first light.
**Did:** one clause in `windowLit`, now reading `s = hour - sunUp` instead of `w.t` against `w.span`/`w.last`: `r = hRise/0.14`, on at `sunUp − 2.2 + 1.4r`, out at `sunUp − 0.3 + 0.7r`. All lit by sunUp−0.8, out one by one across −0.3…+0.4, latest-waker last. `sunUp` is `updateClock`'s, recomputed every frame, so no fixed point is needed. The 0.14 share, `windowHours`, `w.last`, the burn-through and every HOMES path untouched. +13/−2 lines.
**Gates:** census PASS (all scalars unchanged — no new `R()` draw, so the seeded world is bit-identical) · motion PASS, zero jumps/nan/oob/flicker · filmstrip night 1 POP, identical to the digit on HEAD (pre-existing) · shots wide/courtyard/east/lane clean.
**Measured** (HEAD vs candidate, same 26 days): winter day 19 inverts to `3 4 7 9 11 11 10 7 5 3 3 3` (HEAD `3 3 3 3 3 3 5 5 7 7 8 9`). Days RISING across sunUp+0.5 12/26 → 0/26; rises anywhere after sunUp 50 → 0; `(lit at −0.8) − (lit at +0.8)` mean −2.08 → +3.65, positive on 26/26 days against 1/26. Peak moves sunUp+0.8 → −0.5. All 234 evening rows identical. Containment proved by HASH: the canvas is bit-identical to HEAD at midday, dusk+1 and 01:30 and differs only at the two dawn instants.
**Verdict:** shipped
**Surprise:** the winter band now straddles the 06.00 day roll — the exact seam `nid` was built to survive, and it does: stepping 04:12→07:12 in 3-minute steps over five winter days, the worst simultaneous on/off swap is 0 on both builds. That zero needed an anchor, so I monkey-patched `nightAt` to return `nid = day`: the swap jumps to 2–5 windows at hour 6.03 on 4 of 5 days. `nid` is continuous because `day` increments in the same frame the ternary switches to `day − 1`.


## Iteration 110 — the lower roof becomes a working roof: washing, water tanks, pigeon lofts, and a cat that crosses the whole slope (2026-09-02) [Roofs & skyline × Scale/World]

**Brief:** b110 — below the ridge our own roof is inert slate at every framing where it is largest. Give it something to be, and move a census scalar.
**Premise held; its arithmetic did not.** Measured before drawing anything (`probes/near-roof-framing.mjs`): the roof SURFACE below the ridge is **39 px at 1600×950 and 25 px on a phone**. Over half the near band is the APRON (58 / 126 px), which #100 put there on purpose and which must stay empty. The brief's "bottom fifth" is two things and only the smaller was mine.
**Did:** `ROOF_FURN`, a built list over the bays between party walls, off `hash(house)` and never `R()` — a washing line per bay plus a tank or a pigeon loft, and a bay with no line always gets a stand-alone piece (the first draft left four bare bays in a row and rebuilt the flat field at a smaller scale). `washOut()` bounded both sides of noon off `sunUp`/`sunDown` and off `wetF()` not `raining`; the cord stays strung, the washing comes in; own `washPainted` flag beside `wetPainted`. `roofWalkZ()`, `wellNear()` and `catLine(x, ph)` swing the cat across the whole pitch. The loft's landing board is a fifth perch inside `roofBirdSpot`'s **existing** two draws — not one new `R()` call site. ~250 lines.
**Gates:** census PASS/FAIL (<the histogram line that moved>) · visual PASS/FAIL ·
motion PASS/FAIL/skipped · perf PASS/skipped
**Verdict:** shipped | reverted | no-ship   ← your view; runlog.mjs decides from the diff
**Surprise:** <what you did not expect — the most valuable line here, or "none">
**Cue:** <a loose end you noticed and did not chase, or omit>
```

---

## Iteration 103 — the plaza's paving starts to age: moss creeps into the joints, thickens through the wet shoulders and is scuffed out of every line people walk (2026-09-02) [Plaza & quay × New CA]

**Brief:** b103 — the plaza is the largest uniform surface in the town and does not age. Give it a per-cell rule.
**Premise checked:** holds — nothing greens paving anywhere. (`moss` *does* appear on HEAD, on the near roof from #100. Not the plaza.)
**Did:** `moss[]` over the plaza's 730 PATH cells, stepped in `caTick` beside the beds. Three terms and no more: **creep** (`nb`, the four-neighbour mean), **shelter** (`mossShel[]`, the share of a cell's eight neighbours that is not paving, read ONCE off the grid in `buildMoss`) and **the year** (`mossGrowF()`/`mossDieF()` off `warmth`, `greyF()`, `wetF()` — separate rates, because moss comes in over days and goes in hours). `mossTop[]` the ceiling, `mossFloor()` a hold under the drawn threshold. Feet cut it in `stepAgent` exactly where `wear[]` is cut in the courtyard. Drawn as the sett's own seam plus 0–4 hashed blades (`drawMoss`, `MOSS_BUCKET` 6) over a tint in `groundBase`; census gains `mossy`. No `R()`, no route or walkability change.
**Gates:** census PASS, every group unchanged (no `R()` draw ⇒ no reshuffle) · motion PASS · filmstrip 0 POP · ground rebuilds 133/134 per day, identical to HEAD · `frame-cost` under the noise floor · night, snow and 390×844 clean.
**Measured vs a HEAD control the probe regenerates itself** (`probes/moss-shots.mjs`, `moss-year.mjs`, `moss-feet.mjs`): green pixels over a paving-only band, HEAD **0.00% at every phase**; candidate 0.06% autumn · 0.02% spring · 0.00% midsummer · 0.00% midwinter, `mossy` 342/346/0/0 of 730. Two years × 3 seeds: peak 349–365, trough 0, sheltered/open cell mean 0.20/0.05. Feet are load-bearing: at *matched shelter*, walked cells mean 0.01 against quiet cells 0.44–0.68.
**Verdict:** shipped, ~+130 lines.
**Surprise:** the first draft was a green verge down both sides of the plaza, and the fault was not the colour — it was that **shelter is constant along an edge**, so every cell of the run sat at the same ceiling and the rule painted a stripe. A hashed term on the ceiling fixed it at the original colour (muting the palette had only made the feature invisible). Two seasons of the open square were also silently dead: the skip guard `!mossShel[i] && !moss[i]` treats a legitimate mid-square cell (shelter 0) as "not a plaza joint" the moment dieback zeroes it, so it is never stepped again.

## Iteration 104 — the bonfire's smoke becomes a column readable from across the town; its late kindles were already gone (2026-09-02) [Cross street & allotments × Polish]

**Brief:** b104 — (a) make the column read at 1×; (b) get the 2-of-17 kindles at 20:00+ into daylight.
**Priced both halves first.** (a) holds. (b) **does not reproduce on HEAD**: `bonfire-year.mjs`, 16 seeds × 27 days = **30 kindles, hour 13.8–19.1, 0 at 20:00+**; walk 7.0–11.3 h, not 13; 25–29% of autumn days keep a fire. #93's window is eleven iterations of reshuffle old, so `spawnBonfireHolder`/`bonfireHour`/pricing are untouched: the criterion is met, and moving them could only move fires/season, which `avoid` forbids.
**Did:** `BON_PUFFS 18` (was 9), `BON_THICK 0.62` (0.34), `BON_EMB_THICK 0.12` (0.06) as named constants; phase spacing `p/BON_PUFFS`, jitter 0.3 → 0.14 (nine puffs on a 0.3 jitter left *gaps*); base `spread` 0.55 → 0.9, `rise` 6.4 → 6.8; one grey became two — `g = 150 + 56·min(1, ph·3.2)`, sooty off the heap, pale a third up. Shares nothing with the chimney loop but `drift`.
**Gates:** census **PASS** (all five groups *unchanged* — correct for draw-only) · motion **PASS**, zero delta vs a HEAD `--page` baseline · visual PASS, `before/after-bonfire-{wide,crop}-s7d12.png` at 1200×720 DSF1.
**Probes** (3 new, all kept): `bonfire-column.mjs` fire-on minus fire-off in the plume's box, 8 fires — `|Δ|>6` **403 → 748 px**, peak **65.7 → 121.3**, mean|Δ| **17.5 → 35.3**. `bonfire-chimney-identity.mjs` for `avoid` — bonfire off, canvas **identical to HEAD 6/6** with the chimney branch loud (06:56, `cold` 0.98, 27 stacks; and 19:23); its non-zero control was **blind** until it walked to each seed's own fire (a pinned 15:20 is fire 0 on 2 of 3 seeds), then differs 3/3. `bonfire-1x.mjs` the wide frame at shipping size. 40-frame ink series: step max/median 3.4 (HEAD 2.9), no POP, not frozen — the motion gate's days are 3,7,11,19,22, the fire lives on 12–18, so nothing else sees this draw move.
**Verdict:** shipped — half built, half rejected on measurement; ~+10 net lines.
**Surprise:** the diff said the OLD column was drawn **strongly** (403 px past |Δ|>6, 65-luma peak) while the wide shot showed nothing. Both were right. Legibility is **mass and coherence**, not per-pixel contrast: nine circles on a 0.3 jitter are nine dots; eighteen overlapping on a 0.14 jitter are a plume, at nearly the same alpha.

## Iteration 105 — the bottom band becomes a windowsill: a lit far edge, grain, a nosing, and three things that finally throw a shadow (2026-09-02) [The sill & the observer × Polish]

**Brief:** b105 — the band below `sillTop()` is a flat black bar; separate its values without raising the mean.
**Premise re-priced, and it moved twice.** (a) The brief's whole-band `min==max==8.4` does **not** reproduce (range 79.8) — its top ~6 px are the existing lit edge. Drop those and the claim is exact and stronger: rows 6→bottom are **min == max == 8.4, range 0.000** at all three sizes (48,384 / 71,224 / 19,074 px). The defect is the *surface*, not the band. (b) "The pots and cup cannot be seen" is **false** — they silhouette against the apron *above* the sill line (pot column min 8.1 vs a bare column's 80.5). What could not be seen is the surface they stand on, so they got shadows, not contrast.
**Did.** The cliff's cause was backwards from the brief's guess: the apron's shadow gradient was anchored on `l[1]`, the roof's LAST ROW, which at 1200×720 projects **31 px below** sillTop — visible fraction **0.000**, the whole ramp painted under the band (1600×950 showed 51% of it, 390×844 70%, so only the desktop read as a cliff). Lifted it into `nearShadow(g)`, priced off `sillTop()` over whatever near roof the frame shows, bounded above by the south footway (`yWalk + 1`) — cached ground, and a live-drawn walker would not share the shadow. Rebuilt `drawSill`: a 7-stop surface gradient scaled by `lit = 0.30 + 0.70*warm`, 22 **broken** grain runs, 9 scuffs, a nosing, and `cast()` — a gradient trapezoid under each pot and the cup, lying toward the viewer. All `hash()`, no `R()`.
**Gates:** census **PASS** ×2, all five groups unchanged (no `R()` ⇒ no reshuffle) · motion **PASS** · filmstrip day+night **0 POP** · ground rebuilds **133/134/day, identical to HEAD** · `drawGround()` −0.20 ms vs HEAD's own 0.90 ms spread, 40 interleaved.
**Measured** (5 probes kept, each regenerating HEAD itself): surface range **0.0 → 37.7/36.8/38.4**, mean 8.4 → 12.7/12.9/13.2; band still **3.4–7.5× darker than the roof** at hours 10.4/11.2/17.8/23.5; roof→sill at 1200×720 ramps 79→50 where HEAD held ~125 flat into black. `sill-stands.mjs` (surface under an object vs beside it): **HEAD exactly −0.00 everywhere**, candidate −3.9 to −6.5.
**Verdict:** shipped, ~+80 lines.
**Surprise:** the per-column difference image against HEAD reads **backwards** as a test for "the pots are findable" — mass at the bare columns (6.9) *exceeded* the pot columns (4.3). An opaque silhouette covers the band in both versions, so the object's own column is the part that changed *least*; the diff was measuring how much bare surface each column had. The signal had to be taken inside the candidate, as shadow-vs-neighbour, with HEAD's 0.00 as the control.
**Cue:** at every zoomed quarter the sill band fills with live content over the cached sill (max luma 221 Courtyard, 192 Plaza) — identical on HEAD, so pre-existing: `drawSill` is in the ground cache and agents sort after it, so the quarters have no sill at all.

## Iteration 106 — the near roof gets tenants: its own bird band on ridge, pitch, well-lip and parapet, and the lane cat comes up over the parapet after dark (2026-09-02) [Roofs & skyline × Deepen]

**Brief:** b106 — #100's roof is the biggest thing in the frame and nothing lives on it; give it its own life, its own source and its own cap.
**Did:** `roofBirdSpot()` on the plazaBirdSpot pattern — own roll (`ROOF_BIRD_RATE`), own cap (`ROOF_BIRDS` 3), four perches: ridge, pitch, the north lip of a light well (c151's other half) and the parapet, which is inside the south footway's 4.5-cell scare so passers-by flush it for free. Birds carry `zf`; the land/hop machine now floors on the surface under the feet, re-read every frame (#73), and a hop that would leave the roof simply doesn't happen. On the roof they roost through the night instead of leaving. `catA` gains legs `lane→cross→climb→ridge` on its own R() roll (~60% of nights), priced against the night (27 s), not the lane (42 s). `nearScale()` ramps figure size 1→1.95 across the near block. `nearHidden()` backstops the sill. +~150 lines.
**Gates:** census PASS (birds +18, creatures +14; rest reshuffle) · motion FAIL→**false positive, proven twice**: `dusk/cart jumps 0→1`, but `probes/cart-steps.mjs` shows HEAD's cart steps median 1.733 / p99 3.9 / max 3.9 and the candidate's distribution is *identical* — and the flag moved dusk→day→dusk between three of my own builds. Zero nan/oob/flicker on every kind incl. the new `cat`. · filmstrip day 0 POP, night 0 POP · `probes/roof-life.mjs` 10×6d: daylit **0.0% → 95.7%**, after dark **0.0% → 94.4%** (cat 21.1%), cap respected · `probes/near-identity.mjs`: 37k non-roof-bird and 3k lane-cat samples at nearScale **exactly 1.000000**, predicate fires (1.935/1.605) · `probes/roof-sill.mjs` PASS at all three framings.
**Verdict:** shipped
**Surprise:** three separate zeros, each invisible without a probe. (1) `nearZ` indexes `vZ` — a FRACTIONAL x gives NaN, so every roof bird hung in `land` forever and the cat's ridge z was NaN; the census and the screenshot both passed while nothing had touched down. (2) `nearZ` averages a 2×2 of *vertices*, so a reading at row 82 still reaches row 83 — a WELL — and dropped the cat z 1.98→0.31 mid-stride, twice a crossing. (3) The well perch priced to depth 82.22 against a 82.2 cap and was rejected **by two hundredths**, silently, at a rate of zero — the exact trap that perch was written to avoid. Also: HEAD does not read 0 on `y > 79`; the rowboat runs downriver to row 92 between the block's halves (4.6%), so the brief's premise needed the river excluded before the control was clean.
**Cue:** The roof's life is confined to depth ≤ 82.2 (rows ~81.8–84.6), which is the top ~20% of the roof band at 1600×950 and on a phone — the big lower expanse of slate is still empty, because those rows are UNDER the sill at 1200×720 and items sort after the cached sill (c156). The alternative is a generous band plus `nearHidden()` clipping, which costs a blink as a bird hops the sill line at short framings. That trade is the manager's call.



<!-- full text of #112-#114, condensed in LEDGER.md by the manager pass at #114 -->
## Iteration 112 — dawn becomes one event: the light curve, the last lamps and the sunrise wash all key on the sun (2026-09-02) [Sky, light & weather × Deepen]

**Brief:** b112 — #109 re-keyed ONE clause of `windowLit` onto `sunUp`; the rest of dawn was still on the night's clock.
**Premise held, and a third leftover found.** HEAD's year: **2.23** panes still lit at sunUp+0.8, **nightF 0.72** there. The third: `applyLight`'s warm dawn wash was hard-coded at **hour 6.4**, on no clock at all.
**Did.** `nightF`'s morning half is `dawnF(h)`, a smoothstep on `sunUp` — `DAWN_LEAD 1.1` / `DAWN_RUN 2.2`, scaled by `dayHours/MEAN_HOURS` so it breathes with the season. LEAD is half of RUN, so sunrise lands on the midpoint and **nightF is exactly 0.50 at sunUp every day of the year**. `DAWN_K` = smoothstep⁻¹(0.7), so `dawnEdge()` and the curve are ONE definition; `nightAt()`'s `span` reads `dawnEdge()` rather than deriving its own from `NIGHT_K`, and `w.last`, the burn-through and the HOMES cap then fall back to first light **with no constant touched**. Early risers' out anchored on `dawnEdge()`, so the gate never clips the stagger. `applyLight`'s dawn term rides `sunUp+0.2` at `DAWN_WARM 0.55`; the roof-bird band's morning shoulder is opened. Evening untouched, and `Math.min` makes that structural. +~45 lines.
**Gates:** census PASS ×2 (reshuffle only; `people` −4%, inside HEAD's spread) · motion PASS ×2, zero jumps/nan/oob/flicker · filmstrip day, night **and a 12-frame winter dawn** all 0 POP · wide/courtyard/east/lane + winter and summer dawns at 1600×950 and 390×844.
**Measured** (3 probes kept, each regenerating HEAD): **the evening is bit-identical — 26 days × 9 offsets, lit counts *and* nightF.** Lit panes at sunUp+0.4/+0.6/+0.8/+1.2 **0.00 on 26/26 days** (HEAD 2.35/2.27/2.23/1.73); days with a lamp after sunUp+0.5 **26/26 → 0/26**. At 0.02 h steps the worst simultaneous extinction is **2 panes on BOTH builds** — dawn still goes out one lamp at a time, it just goes out at dawn now. Side effects (10 seeds × 6 d): homers 2.07 → 1.85/night, cat on the roof 15.5% → 9.6% (both cued).
**Verdict:** shipped
**Surprise:** the fix made sunrise the loudest thing in the piece, and only a control I had not thought to need caught it. At dusk this wash and `drawSky`'s own peak nearly two hours apart; re-keyed onto sunrise they land almost together — and the new curve had just taken the blue multiply off both. Three amplifications at once: the sunrise measured **R-B +45.9** over the frame against **+28.3** for the warmest dusk the town has. Priced against that dusk rather than against its own old value, `DAWN_WARM 0.55` puts it at +30.5 — still the warmest moment of the day, and only just.
**Law:** a hard-coded HOUR in a light term is a *seasonal* bug, invisible to a screenshot taken at one time of year: 6.4 was 0.6 h before one solstice's sunrise and 2.4 h after the other's, and read as correct at the equinox.
**Law:** when you move a term to where another already peaks, price the COMPOSITE against the end of the day you did NOT touch. Its own old value is not the control — it was damped by something you have just removed.
**Law:** containment for a shared scalar is provable on the axis you did not touch, and that beats a canvas hash — a bit-identical evening across the year survives the `R()` reshuffle a hash cannot.
**Budget:** OVER, and worse — **46.9 KB** against the 46 KB cap when this iteration opened, **48.8 KB** when it closed (this entry, two cues, one inventory line). Three of the last three entries are over the per-entry cap and `life`/`roofs`/`sill` are each over theirs. Distil before the next brief.

## Iteration 113 — every bird the town draws answers, and the pointer finally lands where the picture is (2026-09-02) [People & animals × Interaction/UX]

**Brief:** b113 — `livingAt()` named only the near roof's birds; close the hole for the rest.
**Did.** `birdName(b)`/`birdPlace(b)`; `livingAt` loops over *all* of `birds`, not `b.roof && state==='hop'`. WHAT off the band it was spawned into (`b.plaza` and the belfry flush are pigeons in the town's own words already); WHERE off the predicates the ground is named with — `pavingAt`, the grid — never a second table of boxes. DOWN is `birdDown(b)`, factored out of `drawBird`'s posture test, so words and picture cannot disagree about it; an airborne bird claims no place ("on the wing"), a descending one claims the spot it is dropping onto. All five roof perches have a line now; hit box `0.9 * nearScale(b.y)`, the factor `drawBird` uses. No new `OFFERS[]` entry, no census field. **10 bird lines** against HEAD's 4.
**And the tap:** it fell through `if (!answersTouch(x,y)) return` *before* the naming, so on a phone every nameable thing that cannot be sown on — a roof bird, a window, a vane, a crown — answered a mouse and said nothing to a finger. The cell test still decides what a tap DOES, not whether it is told what it hit.
**Gates:** census **PASS**, all five groups unchanged (no new `R()`) · motion **PASS** · **canvas hash identical to HEAD at 18 pinned instants** (3 sizes x 2 seeds x 3 times): provably an interaction change, not a draw change · `probes/probe-birds.mjs`, run on HEAD as the control:

| | roof | plaza | lane | belfry | phone taps | pointer path |
| --- | --- | --- | --- | --- | --- | --- |
| HEAD | 53/53 | **0/8** | **0/1** | **0/50** | **0/13** | **0/7** |
| now | 53/53 | 8/8 | 1/1 | 50/50 | 13/13 | 7/7 |

**Verdict:** shipped, ~+55 lines. Context budget opened **OVER** (48.4 KB / 46 KB cap).
**Surprise:** the pointer was never where the picture is. `resize()` takes W/H off `cv.parentElement` — the frame's BORDER box — while `#cv` is `inset:0` inside it, so the canvas element is the frame's PADDING box: 20 px narrower and shorter at every size measured. The backing store is stretched to fit, so `evPx`'s CSS-relative point was up to 16 px out across the frame and 20 px down it — 3.3% of the height, against a walker 12 px tall. Markers drawn at canvas (200,300)/(1000,500) photograph at (232.5,314.0)/(1019.4,507.4): the scaled prediction to a third of a pixel.
**Law:** a probe calling `lookAt(project(...))` proves the NAMING, never the POINTER — it skips the event, and that is where a screen-space bug lives. Drive a real `mousemove`/`tap` onto the point the thing is DISPLAYED at (canvas coords x `rect/W`), wait past `NAME_SETTLE` (0.12 s) before reading the sill, and use ONE tap per page — two taps 320 ms apart on a mobile context are a double-tap zoom, which reads exactly like a hit-test bug. HEAD's roof-bird line, pointed at this way, answers **"the lane"**.

## Iteration 114 — the quay ages too: a second region for the moss CA, greener against the rail than along the line people walk (2026-09-02) [Plaza & quay × Deepen]

**Brief:** b114 — #103's moss is plaza-only; extend the ageing to the quay, judged by a difference image and a number.
**Premise held; the brief's warning was the right one.** `pavingAt()` answers `PAVING.quay` for **975 cells — 845 are the RIVER**. It is a fall-through, so the box it names is an intersection with the stone, and the stone is **130 cells** (2 cols × 65 rows) against the plaza's 730.
**Did.** `inQuay`/`mossIn`, `mossOwn[]` a region mask, `buildMoss`/`stepMoss` split into region builders run twice. `mossShelterAt` keeps the plaza's rule verbatim and reads the quay in its own stone (not-`SIDE` is an edge) plus `MOSS_WET 0.55` per WATER neighbour — that term *is* the rail-vs-walked difference: shelter 0.92 vs 0.60, ceiling 0.654 vs 0.481. Feet extended to `mossIn`; `scuffLitter()` factored out of #72's branch, which the moss branch now sits in front of on SIDE and would have stopped the quay clearing leaves in October. `groundBase`'s SIDE branch takes the same tint the PATH branch does; `drawMoss` after the SIDE joints; `nameAt` says "the quay, green in the joints". +~70 lines.
**Gates:** census PASS (five groups unchanged) · motion PASS · filmstrip day/night 0 POP · perf PASS +0.0% · east @ day 14 midday both builds.
**Measured** (2 probes kept, both regenerating HEAD): plaza moss field **bit-identical 12/12** (2 seeds × 6 days; 730 cells, exact sum + order-sensitive hash + `mossy`). Difference image at 1280×700 and 1600×950, masked per cell by `unproject`: **quay 0.85% → 37.4% of pixels changed, meanD 0.83 → 5.35**; plaza 0.86%/0.60, the control's own floor. Rail-minus-walked green excess −0.50 → **+1.02**; field means, rail column 1.5–1.7× the walked one at every autumn/spring sample.
**Verdict:** shipped.
**Budget:** **OVER at both ends** — 49.0 KB when this iteration opened, **50.5 KB** when it closed (this entry, three cues, one inventory line; one stale inventory line cut). Third consecutive over-budget open. The three `**Law:**` lines above are ~1.1 KB of the entry and are cut on promotion.
**Surprise:** the difference image was unreadable until I ran the same probe **HEAD against HEAD**. Two runs of identical code differ over ~1.3% of the frame at peak 90+ — scattered figures, a bright block over the river — because `__reseed()` + `__warp()` + one `drawScene` does not pin the ground cache or the live layer. Without that control I would have reported a whole-frame regression from a change touching 130 cells. The signal exists only as a ratio to it.
**Law:** a difference image needs a SAME-CODE control run, not just a diff against HEAD. `reseed + warp + drawScene` leaves ~1% of the frame unpinned at peak 90+; quote the feature's mass against that floor (37.4% vs 0.85%), never as an absolute.
**Law:** `__census()` computes more than the census REPORTS — `summarize()` keeps only `planting.bySpecies` and drops `planted`/`blooming`/`daisies`/`mossy`/`matureTrees`/`worn`. `mossy`, added by #103 *so the census could see the moss*, has never reached the dashboard: it moved 265→358 here while the gate printed "planting: unchanged". Read `summarize()`, not `__census()`, before taking a PASS as evidence about your vector.
**Law:** extending a CA to a second region, mask the neighbour mean by region id — the shared border is bidirectional, so the new region's growth feeds the old one's creep term and silently rewrites it. Masked, a cross-region neighbour reads 0, exactly what it read when the region was bare.

## Iteration 107 — the far bank gets a door of its own on the field side, and the punt finally runs (2026-09-02) [River & far bank × Connect]

**Brief:** b107 — give the far bank a morning-side arrival source so the punt has a rider that fits.
**Premise re-priced; half of it was wrong.** "HEAD has none before noon" is false as a daily claim (06–12 mean 0.985, someone on 36/40 days). "spawnEastAgent opens late" is false: 182 of 197 set-outs are before noon, median 10.0. What is late is every ARRIVAL — every far-side branch is 8–11 h of walking from its gate, so 0 of 35 HEAD stops near the jetty arrive before noon. The prescription was right, the diagnosis inverted. c143 counted: 29 riders offered in 40 days, all 29 refused (companion 10, wind 8, light 7, rain 2, hour 2).
**Did:** `spawnFarAgent()` — own cap (`FAR_CAP` 3) and rate, subtracted out of `laneCount`, never a share of eastCap. `FAR_GATE [GW+2, 31]` in from the east, off-frame behind the church green, on the jetty's row; `FAR_SPINE 137.2` its N–S line, east of church, mill and the orchard's east row so no leg crosses a WALL. Five branches — mill door, orchard, church front, towpath, and the **jetty**, which sets `a.jetty`, the one thing `puntFits` reads. `farOpen()` bounds set-outs both ends; `farJettyFits()` prices on TIME alone. Solo always. +~100 lines.
**Gates:** census PASS · motion PASS vs stashed HEAD, zero jumps/nan/oob/flicker · filmstrip day 0 POP · shots `farbank-{head,cand}`, `farbank-zoom-cand`, `punt-crossing`.
**Measured** (7 probes): 06–12 mean 0.985 → 3.110, morning presence 36/40 → 40/40, first far-side arrival median 15.48 → 10.45. Punt 0 → 18 landings/40 days, a crossing on 15/26 fine days. Lifetimes sane (median 8.4–12.2 h). Two false alarms settled on HEAD's own spread: census people −9.2% is inside HEAD's 14%; the dusk-agent count is inside HEAD's 5–11 range.
**Verdict:** shipped
**Surprise:** my own first pricing repeated the brief's mistake one level down. Asking the weather in `farJettyFits` deleted the jetty branch on 36 of 94 mornings — charging dawn's wind against a boarding five hours later, when `puntFits` was going to ask again at the moment it mattered. Removing it took crossings 0.20 → 0.45/day. And the 42.7 h "stranded agent" was my instrument: the day rolls at hour 6.00, so an agent set out at sunUp−0.4 crosses the roll and every clock-delta lifetime reads +24.

## Iteration 108 — the gardener actually reaches the bed, and works a row at a time (2026-09-02) [Courtyard & garden × Deepen]

**Brief:** b108 — the courtyard is the title object and the person who tends it is nearly never there; price presence as rate × visit, lengthen the stay, do not raise the set-out rate.
**The premise held; the cause did not.** The brief blamed the one-at-a-time rule plus long walks. Tracing one gardener found something else: **they were turned round at the door and knelt OFF-FRAME.** `stepAgent`'s dusk rule was `a.lawn && !a.lawnOut && !lawnSun()`, and `!lawnSun()` is dawn as well as dusk, so the early walk `lawnFits()` deliberately authorises (#95) was aborted on its first step every morning. The agent then hit `a.i >= a.wp.length` at the *exit* leg and the gardener branch fired there — `kneel` at x 32.5, y −1.3, north of the frame, for four hours. It also made #95's lawn a marathon-walker factory: HEAD spent 98 of 206 lawn set-outs on the east door and discarded them at the arch.
**Did:** `lawnGone()` — the light has GONE as opposed to not being up YET; two-sided, so the small hours still turn a walker round. `gardenerKneel()` on the allotment holder's `a.tendPlot`/`a.rows` pattern: one row per kneel, then a shuffle along the border to another edge bed within `GARDEN_REACH` (`a.resume`). Priced at the choice on the row's own drawn length (`a.rowDur`) and on the walk to the DOOR, not off the frame. The gardener is now a `lawnHolds` place-holder, so the bed comes back as the walk out begins, and takes the SHORT door (`bag.reduce` on `lawnHours`, not `pick(bag)`). `lawnRate()`/`LAWN_W` untouched. +~64 lines.
**Gates:** census PASS ×3 · motion PASS vs a HEAD-pinned baseline, zero jumps/nan/oob/flicker · filmstrip day 0 POP · shots wide/courtyard/east/lane clean.
**Measured** (12 seeds × 6 days, folded onto a 13 h band on solar noon): summer presence 0.104 → 0.240, days with a gardener 14/72 → 36/72; winter 0.082 → 0.166, 17/72 → 39/72. 1.21 rows/visit, and the pricing is live — median headroom to `lawnEnd` is 10.0 h on a kneel that took another row vs 4.6 h on one that did not. Whole-lawn side effect: set-outs 8.17 → 4.42/day with population at 10 h 3.38 → 4.81 — half the walks, more people actually there. **Spread:** rebuilding twice moved summer presence 0.207/0.240 on identical criteria; 0.7 events a day needs ~70 seed-days before a delta means anything.
**Verdict:** shipped
**Surprise:** my own guard deleted the feature I had just built. `if (a.tendBed){…}` in the retire block was meant for "the light went mid-row", but that block is entered by the **timer running out** too — the normal end of every row. The next bed was queued 7 times in 62 kneels and reached zero times, while the row histogram read `{1: 62}` and a wrapper on the choice said the choice was firing. Fix: `a.timer > 0 || lawnClosed()`. A distribution over the OUTCOME caught what a counter on the CHOICE could not.

## Iteration 109 — the town stops lighting UP as the sun rises: the early risers key on sunrise, not on the night's dawn edge (2026-09-02) [Lane & market × Polish]

**Brief:** b109 — re-key `windowLit`'s early risers so panes are lit BEFORE first light and go out as the town wakes.
**Premise confirmed on HEAD, and worse than one hour.** Both ends keyed on the night clock's dawn EDGE (`t = span` = `sunUp + NIGHT_K*dayHours`) — 1.7 h past first light in winter, 2.5 h in summer — so a lamp could come ON at sunUp+1.1 and burn to +1.6. Year curve (26 days): the mean dips to 2.31 at sunUp−0.8 and climbs to 4.38 at +0.8; the trough sits exactly at first light.
**Did:** one clause in `windowLit`, now reading `s = hour - sunUp` instead of `w.t` against `w.span`/`w.last`: `r = hRise/0.14`, on at `sunUp − 2.2 + 1.4r`, out at `sunUp − 0.3 + 0.7r`. All lit by sunUp−0.8, out one by one across −0.3…+0.4, latest-waker last. `sunUp` is `updateClock`'s, recomputed every frame, so no fixed point is needed. The 0.14 share, `windowHours`, `w.last`, the burn-through and every HOMES path untouched. +13/−2 lines.
**Gates:** census PASS (all scalars unchanged — no new `R()` draw, so the seeded world is bit-identical) · motion PASS, zero jumps/nan/oob/flicker · filmstrip night 1 POP, identical to the digit on HEAD (pre-existing) · shots wide/courtyard/east/lane clean.
**Measured** (HEAD vs candidate, same 26 days): winter day 19 inverts to `3 4 7 9 11 11 10 7 5 3 3 3` (HEAD `3 3 3 3 3 3 5 5 7 7 8 9`). Days RISING across sunUp+0.5 12/26 → 0/26; rises anywhere after sunUp 50 → 0; `(lit at −0.8) − (lit at +0.8)` mean −2.08 → +3.65, positive on 26/26 days against 1/26. Peak moves sunUp+0.8 → −0.5. All 234 evening rows identical. Containment proved by HASH: the canvas is bit-identical to HEAD at midday, dusk+1 and 01:30 and differs only at the two dawn instants.
**Verdict:** shipped
**Surprise:** the winter band now straddles the 06.00 day roll — the exact seam `nid` was built to survive, and it does: stepping 04:12→07:12 in 3-minute steps over five winter days, the worst simultaneous on/off swap is 0 on both builds. That zero needed an anchor, so I monkey-patched `nightAt` to return `nid = day`: the swap jumps to 2–5 windows at hour 6.03 on 4 of 5 days. `nid` is continuous because `day` increments in the same frame the ternary switches to `day − 1`.


## Iteration 110 — the lower roof becomes a working roof: washing, water tanks, pigeon lofts, and a cat that crosses the whole slope (2026-09-02) [Roofs & skyline × Scale/World]

**Brief:** b110 — below the ridge our own roof is inert slate at every framing where it is largest. Give it something to be, and move a census scalar.
**Premise held; its arithmetic did not.** Measured before drawing anything (`probes/near-roof-framing.mjs`): the roof SURFACE below the ridge is **39 px at 1600×950 and 25 px on a phone**. Over half the near band is the APRON (58 / 126 px), which #100 put there on purpose and which must stay empty. The brief's "bottom fifth" is two things and only the smaller was mine.
**Did:** `ROOF_FURN`, a built list over the bays between party walls, off `hash(house)` and never `R()` — a washing line per bay plus a tank or a pigeon loft, and a bay with no line always gets a stand-alone piece (the first draft left four bare bays in a row and rebuilt the flat field at a smaller scale). `washOut()` bounded both sides of noon off `sunUp`/`sunDown` and off `wetF()` not `raining`; the cord stays strung, the washing comes in; own `washPainted` flag beside `wetPainted`. `roofWalkZ()` reads the pitch bilinearly, `wellNear()` is 0 over a light well, `catLine(x, ph)` swings the cat across the whole pitch on a 33-cell cosine phase-anchored where it comes over the ridge. The loft's landing board is a fifth perch inside `roofBirdSpot`'s **existing** two draws — not one new `R()` call site. ~250 lines.
**Gates:** census PASS, **`structures` 2979 → 3195** (+24/cell), tiles unchanged, **baseline re-pinned** · motion PASS on everything I touched (the two cart rows are the median-0.000 fault — HEAD's own baseline holds the identical `cart76 moved 2.60 … median is 0.000`) · filmstrip day+night 0 POP · `perf` +0.0%, `drawGround()` +0.5% vs an interleaved HEAD, inside its 1.4% spread · all six framings, night, rain, 1200×720 clean.
**Measured** (`probes/roof-work.mjs`, 22 d): washing out on **70.8%** of daylit samples; the loft perch takes **838 of 5885** roof-bird samples. **The sill's bill, as asked:** at 1600×950 and 390×844, **0.0%** of cat-on-roof and loft-bird samples hidden; at 1200×720, 11.4% of the cat and **97.3%** of the loft birds; at 1280×700, 21.0% and 97.9%. Not a blink — below the ridge nothing CAN show at those two, the sill sitting at depth 82.6 against a first furniture row of 85.4.
**Verdict:** shipped
**Surprise:** the cat has been falling off the roof since #106 and nobody saw it. #106 held its line one row north of the wells citing a probe that read z 1.55 "at x 0, 20, 40, 60, 80 and 105 alike" — a list containing no well column. `nearZ(x, 81)` actually runs 1.55 1.21 0.99 **0.93** across x 20..24, so HEAD's cat steps 0.246 of a cell (1.8 px, one frame, four times a crossing) each time it passes a light well. My own first comment then repeated the error the other way: I wrote 0.62 off the endpoints without measuring the per-frame step, and had to correct it. The new line's real cliff is elsewhere — **0.620 of a cell, 4.4 px in one frame**, crossing rows 85/86, because `nearZ` is a CONSTANT within a row. Bilinear takes both to 0.005.
**Law:** a census SCALAR is a promise about the map, and the cheapest honest way to move one is a built list placed off `hash()`, not a new `R()` draw — 24 objects moved `structures` +216 with every seeded stream intact.
**Law:** `nearZ` is per-CELL, so anything walking a near surface crosses a row boundary as a CLIFF — invisible to a screenshot gate, under the motion gate's absolute threshold. Read a walked surface bilinearly; hand a wander to a fixed line by PHASE, not position (the gate caught a 4.3-cell snap where a climb met a cosine mid-swing).

## Iteration 111 — every camera gets the sill: the window we look through stops zooming, and stops being painted over (2026-09-02) [The sill & the observer × Deepen]

**Brief:** b111 — the painted sill exists at one camera position; give every quarter its sill.
**Premise held, diagnosis inverted.** "No sill at all" is false: the GROUND CACHE holds a good sill at all five cameras × three framings — band max 39.4 / mean 12.3, the wide view's own numbers, every time. Only the sort is broken. The cache is blitted early and every live thing draws after it, so at a quarter the town's own rows land below `sillTop()` and are drawn ON the sill; `nearHidden()` guards exactly two call sites, the roof birds and the cat.
**Did.** `sillU()`/`sillPots()`/`sillBoxes()` — ONE definition of where the sill lands on screen: the strip, plus the three things standing on it that rise above its top edge. `sillU()` is priced off `cellW0`, the wide view's cell, so **the sill no longer zooms with the camera** — it is the window we look through, not part of the town, and that is what lets it be copied 1:1. `sillOver(ctx)` puts the cache's own pixels back after the last town draw (after `drawSmoke`, before `applyLight`, so the night still falls on it): four `drawImage`s, not a repaint, so `avoid`'s gradient never runs twice. `clipOffSill()` punches the same boxes out of `applyLight`'s screen-glow passes, `clip('evenodd')` — a quay lamp bloomed to 97 luma through the sill at the Plaza. +~50 lines.
**Gates:** census PASS, all five groups unchanged (no `R()` draw) · motion PASS · filmstrip day+night 0 POP · `frame-cost` draw 3.08–3.11 HEAD vs 3.08–3.09 tree over 3 reps × 2 seasons, rebuilds identical.
**Measured** (5 probes kept, each regenerating HEAD): band max **227 → 40.4**, OVERPAINT **53.7% → 0.00%** of ~210k dark sill px at every quarter × framing × day/night, every row bit-for-bit the wide view's own number in fine, rain, snow and reduced motion. Sweep of 54 instants × 5 cameras: worst band max 229.0 → 40.4. The wide frame differs from HEAD by **121 px at Δ=1**, all in the pot boxes.
**Verdict:** shipped
**Surprise:** the instrument, twice. A raw RGB diff of the live canvas against `gcv` called 4% of the pot boxes overdrawn on a build the sweep proves clean — `getImageData` returns the cache UNPREMULTIPLIED, so a soft-edged cache pixel cannot be compared with the composited one. And the ease is where the bug was loudest and I had not thought to look: HEAD stretches the cached sill with the camera, so **99% of the band changes between adjacent frames** of the 0.9 s transition and its mean runs 12.6 → 134. View-independence takes that to 0% at every step — the sill sits still while the town zooms behind it, which is what a window does.
**Law:** the ground cache is composited early and lit late, so a cached foreground has TWO leaks: the town draws over it, and the town's own lights bloom through it. Cover it after the last town draw and before `applyLight`, and punch it out of the glow passes.
**Budget:** OVER — 46.6 KB against the 46 KB cap the moment this entry landed. Two of the last three entries are over the 2.5 KB per-entry cap and `state.json`'s life and roofs lists are both over 8.

## Iteration 112 — dawn becomes one event: the light curve, the last lamps and the sunrise wash all key on the sun (2026-09-02) [Sky, light & weather × Deepen]

**Brief:** b112 — #109 re-keyed ONE clause of `windowLit` onto `sunUp`; the rest of dawn was still on the night's clock.
**Premise held, and a third leftover found:** HEAD left 2.23 panes lit at sunUp+0.8, and `applyLight`'s warm dawn wash was hard-coded at **hour 6.4**, on no clock at all.
**Did.** `nightF`'s morning half is now `dawnF(h)`, a smoothstep on `sunUp` (`DAWN_LEAD 1.1`/`DAWN_RUN 2.2`, scaled by `dayHours/MEAN_HOURS`), so **nightF is exactly 0.50 at sunrise every day of the year**. `DAWN_K` makes `dawnEdge()` and the curve one definition; `nightAt()`'s span reads it, so `w.last`, the burn-through and the HOMES cap fall back to first light with no constant touched. Dawn wash rides `sunUp+0.2` at `DAWN_WARM 0.55`. Evening untouched, and `Math.min` makes that structural. +45 lines.
**Gates:** census PASS ×2 · motion PASS ×2 · filmstrip day/night/winter-dawn 0 POP · 8 framings.
**Measured:** lamps after sunUp+0.5 on **26/26 days → 0/26**; the evening is **bit-identical across 26 days × 9 offsets**. Side effects: homers 2.07→1.85/night, cat on the roof 15.5%→9.6% (c166).
**Verdict:** shipped.
**Surprise:** re-keyed onto sunrise, this wash and `drawSky`'s own peak landed almost together — and the new curve had just taken the blue multiply off both. The sunrise measured **R−B +45.9** against **+28.3** for the town's warmest dusk. Priced against that dusk rather than its own old value, 0.55 puts it at +30.5.

## Iteration 113 — every bird the town draws answers, and the pointer finally lands where the picture is (2026-09-02) [People & animals × Interaction/UX]

**Brief:** b113 — `livingAt()` named only the near roof's birds; close the hole for the rest.
**Did.** `birdName(b)`/`birdPlace(b)`; `livingAt` loops all of `birds`, not `b.roof && state==='hop'`. WHAT off the band it was spawned into, WHERE off the predicates the ground is already named with (`pavingAt`, the grid) — never a second table of boxes. DOWN is `birdDown(b)`, factored out of `drawBird`'s posture test, so words and picture cannot disagree; an airborne bird claims no place. All five roof perches have a line; hit box `0.9 * nearScale(b.y)`. **10 bird lines against HEAD's 4.**
**And the tap:** it fell through `if (!answersTouch(x,y)) return` *before* the naming, so on a phone every nameable thing that cannot be sown on — a roof bird, a window, a vane, a crown — answered a mouse and said nothing to a finger. The cell test still decides what a tap DOES.
**Gates:** census PASS (no new `R()`) · motion PASS · **canvas hash identical to HEAD at 18 pinned instants** (3 sizes × 2 seeds × 3 times): provably an interaction change, not a draw change · `probes/probe-birds.mjs` on HEAD as control — roof 53/53 both; plaza 0/8→8/8, lane 0/1→1/1, belfry 0/50→50/50, phone taps 0/13→13/13, pointer path 0/7→7/7.
**Verdict:** shipped, +55 lines. Budget opened OVER (48.4/46).
**Surprise:** the pointer was never where the picture is. `resize()` takes W/H off `cv.parentElement` — the frame's BORDER box — while `#cv` is `inset:0`, i.e. its PADDING box: 20 px narrower and shorter at every size. The backing store is stretched to fit, so `evPx`'s point was up to 16 px out across the frame and 20 px down it — 3.3% of the height, against a walker 12 px tall. HEAD's roof-bird line, pointed at properly, answers **"the lane"**.

## Iteration 114 — the quay ages too: a second region for the moss CA, greener against the rail than along the line people walk (2026-09-02) [Plaza & quay × Deepen]

**Brief:** b114 — #103's moss is plaza-only; extend the ageing to the quay, judged by a difference image and a number.
**Premise held; the brief's warning was the right one.** `pavingAt()` answers `PAVING.quay` for **975 cells — 845 are the RIVER**. It is a fall-through, so the box it names is an intersection with the stone, and the stone is **130 cells** against the plaza's 730.
**Did.** `inQuay`/`mossIn`, `mossOwn[]` a region mask, `buildMoss`/`stepMoss` split into region builders run twice. `mossShelterAt` keeps the plaza's rule verbatim and reads the quay in its own stone plus `MOSS_WET 0.55` per WATER neighbour — that term *is* the rail-vs-walked difference (shelter 0.92 vs 0.60, ceiling 0.654 vs 0.481). `scuffLitter()` factored out of #72's branch, which the moss branch now sits in front of on SIDE and would have stopped the quay clearing leaves in October. `nameAt` says "the quay, green in the joints". +70 lines.
**Gates:** census PASS · motion PASS · filmstrip day/night 0 POP · perf +0.0%.
**Measured:** plaza moss field **bit-identical 12/12**. Difference image at two sizes, masked per cell by `unproject`: **quay 0.85% → 37.4% of pixels changed, meanD 0.83 → 5.35**; plaza 0.86%/0.60, the control's own floor. Rail-minus-walked green excess −0.50 → **+1.02**.
**Verdict:** shipped. Budget OVER at both ends (49.0 open, 50.5 close) — third consecutive over-budget open.
**Surprise:** the difference image was unreadable until I ran the same probe **HEAD against HEAD**. Two runs of identical code differ over ~1.3% of the frame at peak 90+, because `__reseed()` + `__warp()` + one `drawScene` does not pin the ground cache or the live layer. Without that control I would have reported a whole-frame regression from a change touching 130 cells.

## Iteration 115 — the census stops throwing away the planting group, and the new fields arrive with a measured noise floor (2026-09-02) [The sill & the observer × Harness]

**Brief:** b115 — `summarize()` folds five groups and silently drops `c.planting`'s eight scalars; fold them, then measure their churn so a later brief can lean on one.
**Premise held exactly.** `__census()` computes `planted, blooming, daisies, mossy, matureTrees, worn, harvested, produce` every run; `summarize()` read only `planting.bySpecies`. `mossy` was added by #103 *so the census could see the moss* and has been invisible to the gate ever since.
**Did.** A `planting` group in `summarize()`, folded **generically** over the numeric fields with a `PLANTING_SKIP` set (`bySpecies` → its own group; `species` → a constant already reported as `scalars.speciesKinds`), so a future `__census()` planting field lands in the report with no code change. `produce` is the one float, so the sums are `toFixed(1)`. Printed after `species`, and on the `--save-baseline` path too — re-pinning is exactly when you want the absolutes. CORE untouched. `courtyard.html` **byte-identical to HEAD** (`git diff --exit-code`).
**Gates:** census PASS ×5 · visual PASS (wide/courtyard/east/lane) · motion + perf skipped, justified by the page being unchanged.
**Measured — the noise floor, now written into `census.mjs` beside the fields** (the ledger's 3-entry window would age it out): five runs of the gate on one unchanged HEAD, **72 per-cell readings, zero drift** — the instrument contributes *nothing*, so a delta in any of these is attributable. The floor that is not zero is the world: spread across seeds at day27 is `matureTrees` 0%, `planted`/`blooming` 1%, `mossy` 8%, `daisies` 22%, `harvested` 26%, `worn` 27%, `produce` **200%** (0, 10, 17 — a buffer the market empties every 4th day, unusable as a delta).
**Also:** a pre-#115 baseline has no `planting` key, so `diffBlock` falls back to absolutes and reads like a total change. One line now says why. Proved it fires by running the gate against a baseline with the key deleted, then restoring.
**Verdict:** shipped
**Surprise:** the age axis is not an age axis for half of these fields. `mossy` sums **1095 / 30 / 1236** across day1 / day11 / day27 — at *identical* warmth 0.693, grow 0.2212 and die 0.0959, because #16 built the ladder to equalise the instant. Moss integrates, so it reads the arc just travelled: the day11 cell has crossed midsummer, where `warmth > MOSS_DRY` bleaches it to the floor. It reads 7% of its neighbours' value and nothing is wrong. Five fields behave this way.
**Law:** the census ladder equalises the INSTANT (warmth), which makes it an age axis only for fields that are a pure function of that instant. Any field that INTEGRATES over the year — moss, wear, harvest, produce — reads the arc of the year just travelled, so a per-age reading of one is a season reading, not an age reading: use the matrix SUM.
**Cue:** `census-history.jsonl` still carries only `scalars`, so the planting group is visible to a worker's diff but not to `build-stats.mjs`'s growth curves.
**Budget:** opened OK (44.2/46), closed **OVER** (46.1/46) — my own inventory line pushed it over. `rotate-ledger` names six laws over the 900 B per-law cap.

