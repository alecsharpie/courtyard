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
