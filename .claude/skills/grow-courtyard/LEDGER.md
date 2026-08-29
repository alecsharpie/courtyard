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
