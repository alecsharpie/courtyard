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
