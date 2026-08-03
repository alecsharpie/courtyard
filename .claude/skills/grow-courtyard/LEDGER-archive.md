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
