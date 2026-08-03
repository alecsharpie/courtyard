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

