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

**Keep an entry under 1.8 KB (≈26 lines).** A worker reads the last **three** entries in
full, every iteration, so entry length is charged to the loop three times over — three
2.5 KB entries were 18% of the whole read budget, which is why the cap tightened at pass
#120 (it was 3.5 KB and advisory at #20, 2.5 KB and measured at #99). `rotate-ledger.mjs`
names any entry over it. If yours does not fit, the excess is almost always a **law**
(true of the next vector → `LAWS.md`) or a **cue** (→ `state.json`), not a longer entry.
Write the *surprise* at full length and compress everything else; the surprise is the part
that cannot be reconstructed from the diff, and the gate numbers already live in
`RUNLOG.jsonl` and in your probe's own output. Once the manager has promoted your
`**Law:**` and `**Cue:**` lines they are cut from the entry — they live in the two files
that are read *instead* of this one.

```markdown
## Iteration <N> — <one line: what changed> (<date>) [<Domain> × <Kind>]

**Brief:** <id> — <one line of what you were asked to do>
**Did:** <what you actually built, concretely — symbols, not adjectives>
**Gates:** census PASS/FAIL (<the histogram line that moved>) · visual PASS/FAIL ·
motion PASS/FAIL/skipped · perf PASS/skipped
**Verdict:** shipped | reverted | no-ship   ← your view; runlog.mjs decides from the diff
**Surprise:** <what you did not expect — the most valuable line here, or "none">
**Cue:** <a loose end you noticed and did not chase, or omit>
```

---

## Iteration 167 — the quota measures itself, and state.json loses 78 KB (2026-09-03) [The sill & the observer × Harness]

**Brief:** b167 — 14 rows since #153 read `quota: null`; carry c252 with it.
**Re-counted.** 14, not 12, every one `preFrom: "runner"` — the runner calls runlog.mjs; it cannot pass a flag its own text predates.
**Did.** Three parts, one shape: a reading must not depend on its caller. (1) `runlog.mjs` measures it ITSELF given no `--quota-out` — the pre-blob fallback's commit scan is factored out as `preSha` and `--additions --since preSha` runs from here, its exit read off the throw. `readQuota()` returns **null** on "nothing to diff": no baseline measured nothing, so never a pass. `--pre-sha` added; run-loop.sh passes it and a handover still wins. (2) `build-stats.mjs`: three-valued `q` per row (`—`/ok/over), tile reads **measured-of-total**. (3) `rotate-ledger --prune-only`: `closedCues` past the last 40 to `closed-cues-archive.jsonl`, by ARRAY position — the order they were CLOSED. **state.json 120.0 -> 41.0 KB**; 232 = 192 + 40, item for item.
**Gates:** `courtyard.html` byte-identical — census PASS, six groups unchanged; four shots clean; `runlog-merge` 28/28.
**Proved** (`probes/quota-self.sh`, new): 9 assertions, staged repo. Clean -> `{rc:0,source:"self"}`; **HEAD's runlog.mjs on the same repo -> null**; three entries -> `{rc:3,over:1}` before and after commit; a handover wins with no second run; manager pass and unresolvable ref stay null.
**Verdict:** shipped
**Surprise:** `stall-quota.sh` failed 3 assertions on an untouched tree: its control is `git show HEAD:stall.mjs` and #164 LANDED, so HEAD is the candidate. Pinned to `Iter 164^`.
**Law:** a probe's control fetched at HEAD expires the moment its own change commits — pin a "before" control to a REF.

## Iteration 168 — the lawn's stay is priced at the walk home (2026-09-03) [Courtyard & garden × Deepen]

**Brief:** b168 — `lawnFits` has no return-leg term; count who is still crossing the courtyard for home after dark.
**Premise re-measured on HEAD** (`probes/lawn-dark.mjs`, new; 6 seeds x a year): holds, and bigger — **1.71 lawn people in the dark garden at any instant**, with a tail of 18.3 h that is a sitter crossing it at 4 am.
**Did.** Charged the return at the STAY, not the door: `lawnHome()` the one definition, `lawnStay = max(MIN_DWELL, min(drawn, lawnEnd − hour − lawnHome))` at the napper's, picnic's and sitter's arrival, the draw unmoved. A kid's run has no timer, so its waypoint LIST is cut. `gardWalk` → `lawnWalk`.
**HEAD → cand.** Dark inside the wall **1.71 → 0.97** (466 → 263 agent-h/seed-yr), per-late-visit med 3.38 → 2.18 h; furthest to go leaves first. Population flat. **The cost is stillness**: stopped on the grass 1.80 → 1.16, while lawn presence 9.00 → 8.89 and people inside the wall 19.03 → 19.20 hold. Inflow cannot buy it back (LAWN_RATE re-swept, at the constant).
**Gates:** census · shots (day + a 22 h pair) · motion — all PASS
**Verdict:** shipped
**Surprise:** the DOOR cannot carry the return leg, and the courtyard's SIZE is why. #157's gardener line, `arr + MIN_DWELL + w.out < lawnEnd`, was built, measured and thrown away: ~29 cells from a door to the linden is 8.7 h compressed, so the deep lawn cannot be crossed twice in one day's light. It shuts the napper's door (offerable 10.0% → 0.0%) and the shaded picnic's (23.9% → 0.0%).
**Law:** price a round trip where it can be PAID — at the door when the place is near, at the STAY when the crossing costs a day's light. At the door it fails as a POPULATION going to zero, never as a slower rate.

## Iteration 169 — the morning gets two errands of its own (2026-09-03) [Lane & market × Deepen]

**Brief:** b169 — the morning's shortfall is COMPOSITION; give it two kinds of its own. Counted on HEAD first (`lapse-pop.mjs`): **28.89 people, 12.02 kinds** v the evening's 39.63 / 14.09. It holds.
**Did.** (1) The **shopkeeper**: out of HOME_DOOR 22, sets the pavement tables out, goes in. Solved BACKWARDS from `cafeSetUp()` at a FIXED speed (`openerOut() = cafeSetUp() - pathHours(...)`), so she lands on the hour to the frame (7.98 v 7.98). `cafeOpen()` reads `cafeSetUp()` too: the shop opens when its chairs do, ONE definition, `sunUp - 0.5` unchanged. (2) The **delivery**: `hash(day,811) < 0.7`, up the lane ON the setts with a cask, 4.6 rows in — the cart's line is 2.2 ± a 1.7 berth, and a corridor is swept, not a point Two casks flank `TAP_DOOR` till `tapUp()`. Both `priced:true` → out of `chatty()` (#101).
**HEAD → cand.** Kinds **12.02 → 13.69**; the gap to the evening **2.07 → 0.64**; people → 30.28. Shopkeeper on **100%** of 162 days, delivery 81.5%. Cafe presence 33.92 → **34.03** agent-h/day: it cost the cafe nothing. Disable the two spawns: the census is byte-identical to HEAD.
**Gates:** census · motion · perf +0.0% · 0 POP day+night · 4 framings · `probes/open-cost.mjs` new
**Verdict:** shipped
**Surprise:** the frontage cannot be a pure clock and `marketRaise()`'s shape hid it — a lane-band cup runs to 11 sim hours, so a clock folding the tables at dusk had **16% of all seated samples at a table it had already packed away**.
**Law:** a raise whose FALL is bounded by an occupant is not a clock. `max(clock, taken)` over the DRAW holds it up under the guest and snaps it away as they leave; the occupancy belongs in the scalar's TARGET, which eases it back up (1223 → 0).

## Iteration 171 — the near block gets a top, and a tenant (2026-09-04) [Roofs & skyline × New element]

**Brief:** b170 — cut a flat-lead terrace into the near block's level rows; put somebody on it.
**Found:** #170 built it and died before committing: 431 lines uncommitted, census obligation
met, baselines still pinned at HEAD. I verified the tree, not rebuilt it; its `#170` tags
are this entry.
**Did:** `LEADS` (tile 17) on rows 86..87 of 6 bays, sited by `leadsHouse()` off
`hash(house)`, clear of wells, river. `solidM` counts it WALL, so `buildVolumes()` never sees
it: no roof vertex moved. `drawLeadsCell`/`leadSheet` lay it into the cache, the apron carries it
off-frame. `buildLeads()` → 6 `HATCHES` + `LEADS_BAYS` + a cord each. The tenant has its OWN
source and cap (`tenantErrands`, `TEN_CAP` 2) and four acts — peg/take off the `washOut()` EDGE,
sun, lean; `drawHatch` is live, two states.
**Gates:** census PASS, re-pinned (`tileKinds` 153→162, `developed` held) · visual PASS (4 framings,
both lids) · motion PASS · probe `tenant-leads.mjs` counts the premise on HEAD:
a person on the block in 0.00% of samples vs 17.4%, contained, drawn no shallower
than 86.12 (`LN_WALK_S` 79).
**Verdict:** shipped
**Surprise:** rain is the MINORITY cause of the washing coming in — 9 errands of 58 against 49
for the light going. Sampling `raining` at the stand read 2 of 71 — wrong reading:
`washOut()` flips on `raining`, but `wetF() > 0.22` holds it false long after.
**Law:** Attribute an edge-triggered event AT THE EDGE — by the time its consequence shows,
the state that flipped the predicate has been superseded by a slower term.
**Law:** A worker dying before it commits leaves its iteration in the WORKING TREE
alone, invisible to ledger, runlog, census. Diff the tree before calling a brief unbuilt.

## Iteration 172 — the allotments get a crew (2026-09-04) [Cross street & allotments × Scale/World]

**Brief:** b172 — raise the allotments' SUPPLY, not the share; carry c257.
**Re-counted first** (`probes/allot-supply.mjs`, new; acts counted at the CALL):#154's "28 a year in six worlds" HOLDS and is `plotAct` ONLY: the ladder runs 32.0 acts a seed-year, 84% `harvestPlot`.
**The brief's named lever is the wrong one.** Swept at 6 seeds, the cap beat both the rate and the stay: tripling `allotRate` moved arrivals only 23.7 → 30.5 a year, because `allotCount() < 3` refused **49.6%** of samples at a presence of 2.20/3. 17 plots were one place with three slots.
**Did.** Named the five constants (`ALLOT_FLOOR/RIPE/CAP/ROWS/MORE`, `let`, so the probe sweeps them); left the RATE at HEAD's. CAP 3→5; ROWS/MORE 3/0.55 → 4/0.70, because a holder is resident **~2.1 sim DAYS a visit**, mostly crossing — the walk is priced at the stay. c257: `cartToday`/`cartHomeX`/`drayToday` salted with `WIND_SALT` (`probes/cart-calendar.mjs`, new: 1 calendar in 4 worlds on HEAD, 4 on cand; unseeded untouched).
**Gates:** census, motion (vs HEAD), filmstrip, visual, perf — all PASS.
**Measured, 12 seeds x a year:** acts/yr **32.0 → 58.6**, per-plot median **1.75 → 3.75**, refusal 49.6% → 30.8%.
**Verdict:** shipped — but the success line wanted tend-rungs in double figures; they went **4.25 → 8.83**, because more supply buys more harvests too.
**Surprise:** the morning round's skin was `hash(day, 811)` — `drayToday()`'s OWN key — so its index was PARTITIONED by whether a dray came: dray days {0,1,2}, dray-less {2,3,4}. Re-keyed to 619.
**Law:** a fall-through ladder's lower rungs are bounded by its FIRST rung's hit rate, not by supply — doubling arrivals doubles both. Instrument the rung, not the population.

## Iteration 173 — the plaza's doors become corridors, and the cap wakes (2026-09-04) [Plaza & quay × Deepen]

**Brief:** b173 — re-price the `FAM_CAP` cue against #148's "DEAD past 4".
**Re-measured** (`town-caps`, 6 seeds x 12 d, paired): the cue HOLDS — 4 binds **86.5%** of open
daylight — and #148's reading is dead: #160's fourteen places woke a constant that had sat at a
rate of zero, and it is live to 12. But it buys CROWDING (0.117 pairs per plaza person at 4,
0.221 at 7), and `probes/plaza-crowd.mjs` (new) says what of: **93.6% of those pairs have a WALKER
in them** and **74% sit in the two 30-degree bins either side of the ALLEY** — whose lead was one
waypoint, duplicated in two branches, with four ring POINTS after it.
**Did.** `plazaLane(a)`, a golden-ratio SEQUENCE, no `R()`, so the seeded world is untouched. Off it:
`alleyRow/alleyGate/alleyLead`, the cut's 3.0 cells at BOTH ends, and
`ringNode(i,lane)` for `RING_NODES`; `plazaWay`/`famWalk` take the lane, so the price is the walk. Then FAM_CAP 4 -> 5. Plaza presence **10.05 -> 12.18**, crowded pairs
per person **0.117 -> 0.103**; the door still refuses 0.0%, quay flat.
**Verdict:** shipped
**Surprise:** motion failed `cart: jumps 0 -> 1` on a plaza-only change.
`probes/cart-step.mjs` (new): HEAD's cart takes **186 steps over ABS_JUMP 2.5 in 600 s, max 3.9** —
identical on both builds. CART_SPEED 6.5 x TROT 1.5 x a dusk 1.5 is 3.66 a step; the gate read 0
only because its windows had missed a trot. `ABS_JUMP_KIND={cart:4.5}`; HEAD still PASSES against the pinned baseline.
**Law:** many PLACES is not many WAYS IN — split crowded pairs WALKING vs STOPPED before widening.
**Law:** a jump threshold under a kind's cruising speed is a speedometer: its zero is a fact about
the sampling window, so the next reshuffle names the wrong change.

## Iteration 174 — the boats get their image; a premise dies (2026-09-04) [River & far bank × Deepen]

**Brief:** b173/#174 — the BOATS into the water; re-price #159's cue that the shade needs its sheen cut.
**(b) REFUTED, both halves** (`probes/water-sheen`, new; control 0 px). Not "1-86 px of change": at
h8.18, the year's largest wet mask, FULL vs NOSHADE moves **8138 channel px at d 7.4**, widening the
wet-vs-open luma gap 3.47 → **11.07**, ~1 sd of the open channel. `drawRiverFlow` killed outright moves
~2% of that; streaks cut inside `shMask`, **0-41 px**.
**(a) Did.** `spriteMirror(fy)`, then `drawBoatMirror` — live on `ctx` under `riverWaterPath`'s clip:
two punts + crew, the rowboat, the barge. One alpha per hull for the ramp (deepest image 1.17 cells vs
REFL_FADE's 3.6), no chop. The barge needs no flip (real z); `drawPerson` flips itself.
**Measured** (`probes/boat-mirror`, new; BEFORE = this source, members emptied): control **0 px**;
image **266 px** (punt 120, barge 85, boat 61), none north of a hull; the rowboat's image centroid
tracks her foot to **1.6 px** as she runs 21 px a step.
**Gates:** all PASS; the pass is 0.236 ms at Wide. **Verdict:** shipped
**Surprise:** giving the barge a reflection found a PERSON in the wrong place. Her shore hand is drawn
at `BARGE_HAND_Y`, the berth's shuttle line, and `bargeHandU` returns 1 off `'work'` — so her x followed
the hull and her y never did: on every barge day a figure stood in the open channel at row 25 for the
whole approach and departure. 74 px of image, her hull fifteen cells north.
**Law:** `project()` reflects only what is solved with a real z; a SPRITE — pixel offsets off a
projected foot — is blind to the mirror's sign and flips about ITS OWN foot. A reflection is a POSITION
test too: a stale anchor shows as ink in open water.

## Iteration 175 — the manager's files get the worker's rotation (2026-09-04) [The sill & the observer × Harness]

**Brief:** b174/#175 — bound the four files a manager opens, by rotation, never deletion.
**Premise half refuted.** A manager opens none whole: its SKILL.md `tail -40`s the runlog, and that
tail is FLAT — 36.4 KB at row 40, 38.5 at row 211, while the file went 191 → 204 KB. Its cost is no
read either (uncached `in` 64–178 tokens a pass; last six level at $3.40–$8.66), so the table's
"nothing caps these, and the manager reads all of them" is deleted.
**Did.** `archives.mjs`, the one place knowing a rotated file has halves. `rotate-ledger.mjs`
rolls LEDGER-archive.md past 60 entries → `LEDGER-deep.md`, RUNLOG.jsonl past 80 rows, MANAGER-LOG.md
past 16 passes into archives beside them, and measures MANAGER-LOG's unenforced "one line" (15 of 16
over 1.5 KB). `build-stats`/`stall` read both halves; `stall --report` prints **WORKER 46.3/46 KB
beside MANAGER 80.6/96**, each rule quoted from its script.
**Measured.** 993,951 B → 994,416: **+465 B, exactly the archive headers**. 211 rows / 257
entries / 36 passes, 0 unparseable. Live 1010.8 → **300.4 KB**; **stats.html is byte-identical
to HEAD** with 551 KB moved out from under it.
**Gates:** census PASS, six groups unchanged · courtyard.html byte-identical · visual PASS.
**Verdict:** shipped
**Surprise:** the check passed **while a row was being destroyed**. `byLine` measured offsets in
BYTES and gave them to `String.slice`; the cut fell inside an em-dash, split a row in two, every
reader dropped both fragments — 211 runs → 210 — and the bytes still balanced exactly.
**Law:** byte conservation is necessary, NOT sufficient — blind to a cut INSIDE a unit. Prove a
rotation on its READERS' output against a pre-rotation control.

## Iteration 176 — the rain forked the seeded world (2026-09-04) [The sill & the observer × Fidelity]

**Brief:** b176 — `?seed=` does not name a world. Find the fork, name it, gate it.
**Premise CONFIRMED to the digit** (49 vs 48 people at simT 125; two skies by 700).
**It was the RAIN, and only the rain.** Mapping every `R()` to its enclosing function: the renderer
is already clean — all 24 draw-site hits are comments *saying* "no R()". Two forks, one block.
(1) The drop field is CANVAS space — spawned across W, recycled at `r.y > H`, culled by the frame
— and drew from the town's PRNG, so *the draws the sky spent* were a fact about the window.
(2) The shower's END was `rainLeft <= 0 && !raindrops.length`: a WORLD event waiting on a screen.
**Did** (50 lines): `RS` beside `R`; the field out of `if (raining)` into `stepDrops(dt)`, `RS`
only; the shower ends on `rainLeft <= 0` alone; `drawRain` gates on `raindrops.length`, so the tail
outlives the flag. Tail probe, H 950 vs 560: HEAD's `raining` ends LATER at a taller window; cand
ends at **132 at both**, its tail honestly H-shaped (3 drops vs 1).
**Gates:** `probes/seed-identity.mjs` (new) **FAILS on HEAD 12/12, PASSES on cand 15/15** · census
PASS (reshuffle, not collapse: 449→441) · shots · motion · perf +0.0% · baselines re-pinned.
**Verdict:** shipped
**Surprise:** the filmstrip's one POP at the shower's end — Δ7.35, 4.4x median — was **the next
shower arriving**: the census row carried `raining: true` at that very frame. The same measurement
on HEAD at *its own* shower end peaks at 18.1x median; both builds sit at 0.65 vs 0.71 dry.
**Law:** a canvas-extent population must never draw from the world's PRNG, and no world event may
wait on a screen-space one — the draws a frame spends are a fact about the WINDOW.

## Iteration 177 — the lamps get moths at them (2026-09-04) [People & animals × New element]

**Brief:** b177 — a nocturnal species, own source and cap, gathered AT the lights, not a second
firefly. **Premise held:** no `moth`/`bat` in the source, nothing keyed on a lamp.
**Did.** `moths[]`, `updateMoths/mothPos/mothRate`, `drawMoths`, `mothName`, `NIGHT_LAMPS` —
ONE lamp list, which the halo pass now reads too, so a lit lamp and an occupied lamp cannot
drift apart. A moth belongs to ONE lamp and orbits it on its own phases — no per-frame `R()`,
and a `^6` term on the radius that closes it right onto the glass.
**Gathered, not scattered.** `MOTH_JOIN` of arrivals join an occupied lamp, and both candidate
lists are pre-filtered to lamps under `MOTH_PER_LAMP`, so a knot saturates and the overflow
starts the next. 5 seeds x a year (`probes/moth-night.mjs`, new): **9.1 of 24 lamps occupied**,
busiest 2.97 — one speck each at 24 is nothing at 3 px. Daylight **0.00**, deep night 23.8,
**0 of 135 nights empty**.
**Gates:** census PASS (`moths +93`, `creatures +88`) · motion PASS (moth 0/0/0/0) · perf +0%
· filmstrip 0 POP · 6 framings incl. mobile · naming 31/32, same points, moths gone: 0.
**Verdict:** shipped
**Surprise:** the season was on the CEILING first, and the year came back **13.8 / 16.3 / 15.8
/ 15.1** across its four quarters — dead. At 1.5 arrivals/s the SUPPLY was the bound in every
season and the ceiling was decoration, which a sweep of the ceiling cannot see. Year and rain
onto the INFLOW, `MOTH_CAP` left a pure ceiling: **20.2 / 27.0 / 29.2 / 18.6**, cap
binding in midsummer, rate in winter and rain.
**Law:** a cap and a rate are both alive only if they bind at DIFFERENT times — put the
modulating scalar on whichever is SLACK, and prove it by sweeping the AXIS, not the constant.

## Iteration 178 — the bonfire re-asks its weather (2026-09-04) [Sky, light & weather × Deepen]

**Brief:** b178 — c244: `bonfireWeather()` is asked once, at the match, never again.
**Premise CONFIRMED, NARROWER.** `stepBonfire` already re-asked the WET half
(`raining || snowCover > 0`); the WIND clause had no re-ask at all, so every refused hour on HEAD
is wind, none wet: **3 of 37 fires, 3.49 of 129.60 fed hours** (probe-bonfire-wind, 6 seeds x 4 y).
**Did.** Both faces of one scalar, no new weather term. `isWindy()` ENDS the feeding at its edge
in `stepBonfire`, latching `bon.blown` (`bonfireName()` reads it) and a sayAt; the holder needs no
code — #93's `!bon.on && bon.fire < 0.15` walks them home. `windF()` HURRIES it: BON_BURN_H stops
being a clock (`simT - bon.lit`, deleted) and becomes a fuel budget `bon.spent` spent at
`1 + BON_WIND_HURRY * windF()` still-air hours, same rate on fall and embers.
**HEAD -> cand.** Outliving their weather **3/37 -> 0/44**, refused hours **3.49 -> 0.00**; 3 raked apart,
0.73 h mean vs 3.15 h; mean burn 3.50 -> 2.98 h, town fed hours flat.
**Gates:** census PASS (reshuffle, no collapse) · motion PASS · shots · filmstrip seed 42 t 2114,
0 POP: the plume climbs, thins as windF crosses 0.40, embers by #9.
**Verdict:** shipped
**Surprise:** the first HEAD/cand pair read **8/33 -> 0/33** and did not reproduce. A `?pause`
page still runs rAF, so entering without `?t=` starts ~2.2 s of un-reseeded world in, and
`__reseed()` rewinds neither `simT` nor the latches: same seed, same warp, windF **0.35 vs 0.94** at
the same clock hour. Two towns; `filmstrip.mjs`/`shoot.mjs` pin `?t=0`, so an unpinned probe
measures a world they cannot show.
**Law:** pin `?t=` on every probe page — the default entry is a DIFFERENT WORLD from `?t=0`.
