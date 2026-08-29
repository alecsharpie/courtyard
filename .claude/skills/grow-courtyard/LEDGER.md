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
