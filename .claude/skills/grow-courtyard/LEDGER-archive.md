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

