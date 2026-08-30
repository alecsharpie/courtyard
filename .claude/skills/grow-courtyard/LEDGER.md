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
