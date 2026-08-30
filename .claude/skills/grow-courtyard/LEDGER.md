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
