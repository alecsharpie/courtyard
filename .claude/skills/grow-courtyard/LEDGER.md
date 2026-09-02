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

## Iteration 134 — the pools stop being drawn where nobody can see them (2026-09-02) [Lane & market × Harness]

**Brief:** b134 — cull `drawPuddles` to the visible frame, byte-identical output. Full entry in LEDGER-archive.md.
**Did.** `inFrameBox(sx,sy,rx,ry)` beside `project()`: ONE screen cull, on the CANVAS rect and deliberately not `sillTop()` — `drawPuddles` draws before the sill is composited and may legitimately paint under it, so the canvas is the only bound true of both callers, and the cull is exact by construction. `drawPuddleLights` calls the same one.
**Gates:** census unchanged · motion PASS · filmstrip 0 POP · `perf.mjs` ±0.0% and **blind** (vsync-locked at 16.70 ms over a mostly dry day).
**Proof** (seed 7, wet 0.75, 400 frames × 3 reps, interleaved): drawPuddles **−56% to −73%** at the four quarters, whole wet frame −8 to −12%; Wide ±2.5% both ways. Canvas hash **IDENTICAL 28 of 28**, fingerprint NONE.
**Verdict:** shipped
**Surprise:** the phone is the case that needed this most and the brief never named it. At 390×844 the **Wide** camera — the default, and effectively the only one a phone has — already culls **61%** of the wet pools, and Far bank there culls **100%**. At 1280×700 Courtyard **17 pools are kept only because the cull uses rx/ry** rather than the centre.

## Iteration 135 — the roadway is laid instead of hatched (2026-09-03) [Lane & market × New CA]

**Brief:** b135 — retire the carriageway's flat fill and three ruled hairlines; lay a bond that runs, a camber, a gutter and a repair.
**Did.** `settGrid(y)` on `slateGrid`'s model — the sett count is solved off the cell AS DRAWN (2×2 at 1600×950, coarsening to 1×1 on a phone), and `settRun` lays a GLOBAL lattice keyed on the world axis, so a sett straddling a cell edge is one stone in two halves. Courses run ACROSS the direction of travel, so the bond turns through a right angle at the junction. `camberZ` (crown to kerb, 0 at both) plus `CAMBER_L` in the light; `gutterF` silts the channel; `roadPatches()`/`patchAt` make the road good in tar with a sett-quantised rim; `KERB_RUN` breaks the kerb into stones. `wetRGB`/`trodRGB` are `wetCol`/`trodStone` in triples so a sett takes the wet and the wear its own cell takes. +235 lines, all in the ground cache.
**Gates:** census unchanged · motion PASS · filmstrip day/night 0 POP · `perf.mjs` ±0.0% and blind — `drawGround()` timed directly is **+11 to +21% (~+3 ms)** at three framings, the cost of 6,000 more `poly`+`fill`, not of arithmetic. Legible dry, wet, under snow 0.3, at night, and at 390×844.
**HEAD → cand** (seed 42, day 3, 10.4 h, 1600×950): ROAD sd/mean **0.081 → 0.150**, class mean **−1.62** of 126; the cross street 0.032 → 0.121. Camber crown−gutter 3.9 → **14.9**. Rut against its MIRROR band (same camber, same depth, no wheels) −0.6 → **−13.5**. Every changed pixel outside the ROAD class is within **2 px** of one — the kerb, where the old hatch's 0.7 px stroke used to bleed.
**Verdict:** shipped
**Surprise:** the REPAIR half of the brief was reading a field that is empty. `?t=` sets the clock and does not run the days, so paveWear[] is 0 on a fresh page — and warping twelve days only takes the carriageway to mean **0.0019**, max 0.065 against PW_FULL 0.45. Nobody walks on a road, and the one thing that uses it, **the cart, is not an agent**: the accrual site is inside `stepAgent`, so no wheel has ever touched the accumulator. So the rut went into the FABRIC, placed on a measured histogram rather than a guess — the cart is on row 70 for 88 of 90 lane samples and in column 71 for 613, and 82% of every pedestrian sample on any carriageway is inside the junction. The tap's crossing the brief expected does not exist: the tap's door is on row 65 and its drinkers never leave the footway.
**Law:** an accumulator is a rate as well as a field — a durable mark (a rut, a stain, a repair) whose source decays faster than it recurs belongs in the FABRIC, and only the recent term belongs in the CA.
**Law:** a bucket mean needs a control bucket the CANDIDATE did not define and that differs in ONE thing — the rut read −10.9 against "everywhere else" and −13.5 against its mirror image across the crown, and only the second is the rut.
**Cue:** `drawGround()` costs 22–25 ms before this and 25–27 ms after; the ground cache rebuild is now a dropped frame wherever it fires. `perf.mjs` cannot see it (vsync-locked over a whole day) — `probes/ground-cost.mjs` can.
**Cue:** the cart lays no `paveWear[]` at all. One line at its step would make the town's own memory carry the track that `rutF` now paints.

## Iteration 136 — a barge works the quay, and the horn gets a subject (2026-09-03) [Plaza & quay × New element]

**Brief:** b136 — bring a barge up the west channel on some days, let it work the quay, give the ticker's unplaced barge horn a subject. Full entry in LEDGER-archive.md.
**Did.** `BARGE_BOLLARDS`: five iron posts on the quay's edge — FABRIC, there every day, and what `structure.moorings` counts. Then `barge` on the PUNT's shape: own tick, own hash schedule, legs `in`/`work`/`out`, alongside at x 114.86 between the berth bollards at rows 20.6/27.4, south tip 26.8 against `boatUnderDeck`'s 28.7. Her crew are the BOAT's, not `agents` — a steerer at the cabin and a hand shuttling sacks quay→hold on a triangle wave, so the two stacks are the clock and no cap pays for anyone. Four `sayAt` lines at the hull; her lantern registers `BARGE_LAMP`. **Zero `R()` draws** — day, hour and load are `hash(day, …)`.
**Gates:** census PASS — `structures +45` and **nothing else** across 9 cells, so the seeded world is bit-identical beside her; baseline **re-pinned** · motion PASS · filmstrip 0 POP at the berth against a HEAD control of the same shape · `probes/frame-diff.mjs` (5 instants × 2 seeds, day and night): every changed pixel inside a **22–28 px column** of a 1228 px frame · `probes/barge-day.mjs`: 30.6% barge days over 520, 0 NaN, 0 teleports with a control that fires.
**Verdict:** shipped
**Surprise:** the horn was the easy half; the LAMP was the trap. Drawn in the item pass it is invisible at ten o'clock — `applyLight`'s multiply had made it slate — and the rowboat only escapes it by registering `BOAT_LAMP` for the pass after. The punt does not, so the last punt has carried an unlit lantern since #131. Second: at the **Plaza** quarter, the camera that frames the quay, the arrival line was the one of four never heard — at row 0.6 she is inside Wide but above Plaza's box (y0 2). Moved to row 5.0, all four land at both.
**Budget:** `context-budget.mjs` says **OVER** — 49.5 KB against the 46 KB cap (48.0 before this pass; state.json's inventory is 11.3 of its 9.5 KB). Distil next.
**Law:** a light drawn in the item pass is slate by midnight — anything meant to READ as a flame must register its point and be repainted after `applyLight`; "it is drawn" is not "it can be seen".

## Iteration 137 — the lane's cap starts counting the lane (2026-09-03) [People & animals × Scale/World]

**Brief:** b137 — presence per PLACE across whole days, sweep every cap, keep the knee. Full entry in LEDGER-archive.md.
**Premise right, cause was a membership bug.** `laneCount` was a RESIDUAL — everyone eleven subtractions did not remove — so it annexed every population added after it (the LAWN's five kinds, the pickers, the sweeper, the loader). Summer day: **17.00 against a cap of 6.77, binding 100%** of daylight samples, of which the lane's own were 0.08. `spawnLaneAgent` — the source for the plaza, quay, far green, parapet and allotment detour too — had been dead in daylight for a year of iterations with no line changed and no gate fired.
**Did.** `lane:true` on its object literal (every branch and `makeCompanion` inherit it); `laneCount = agents.filter(a => a.lane).length`. Then swept each cap alone, 3 seeds × 26 days (`probes/town-caps.mjs`): **capacity 6→10, laneCap 6.4→10, eastCap min(7,*6)→min(9,*8), FAR_CAP 3→5**; FAM_CAP kept 3, EVE_CAP kept 6, each with its reason at the site.
**Gates:** census PASS (`people +99`, baseline re-pinned) · motion PASS · 0 POP · visual PASS 1600×950 + 390×844. Town presence **36.03 → 50.19**, every place up (courtyard +13% smallest, lane +90% largest); crowded pairs per person flat 0.068 → 0.078.
**Verdict:** shipped
**Surprise:** two caps refused to be raised, for opposite reasons — **FAM_CAP has three places and only two are reserved** (past 3 the slack is two families drawing as one shape, c218), and **laneCap has no knee at all** up to 19, because each destination is 5–6% of one roll so past 10 every marginal arrival is a lane walker (c219). The branch share is the cap beneath the cap.

## Iteration 138 — the plots get their tools (2026-09-03) [Cross street & allotments × New element]

**Brief:** b138 — furniture for the seventeen plots, on ROOF_FURN's model, per plot off hash(plot). Full entry in LEDGER-archive.md.
**Did.** `ALLOT_FURN`/`PLOT_BOX`: shed, compost bay, water butt, barrow, bean canes, cloche — solved ONCE off `hash(plot)`, held in world coordinates, drawn into the ground cache before `drawGlassBack`, named by `allotFurnAt`/`allotFurnName` off the boxes the paint uses. **38 pieces over 15 plots**, zero `R()`. A plot owns x [ox, ox+4) y [oy, oy+3) — beds plus a south and east apron — leaving a whole cell of way in x and the WEST side clear, where `sendToPlot` lands its holder. Canes/cloche gated on the warm/cold half of `warmth` with per-plot slack; the barrow on somebody kneeling — live state under a cached surface, so `barrowKey()` drives `groundDirty` as `washPainted` does (2.5 extra rebuilds a sim day).
**Gates:** census PASS — `structures +342`, new `plotFurniture 342`, nothing else across 9 cells; baseline **re-pinned** · motion PASS · 0 POP · perf ±0.0%, `drawGround()` interleaved 34.00 → 34.10 ms · legible Street/Wide/390×844/night. `probes/plot-furniture.mjs` 0 geometry violations, all five clauses fire on a moved piece; `probes/plot-naming.mjs` drives a real mousemove, all six kinds named.
**Verdict:** shipped
**Surprise:** the brief's cane gate was a feature at a rate of zero, through DWELL. Beans are **3.1%** of standing allotment cells against cabbages 47.1 — not because they are rarely sown but because cabbages are the one `hardy` species and stand the winter. Canes on a presence test showed on 1.5% of a year; gated on the season they are up 49.7%.

## Iteration 139 — the gardener works the stretch the light allows (2026-09-03) [Courtyard & garden × Deepen]

**Brief:** b139 — re-price gardenerKneel's continuation so a gardener who has knelt finishes the bed. Full entry in LEDGER-archive.md.
**Premise confirmed, diagnosis wrong.** `probes/gardener-rows.mjs` (10 seeds × 26 days) reads the branch off the R() call count *inside* the call: a growing morning is **1.54 rows/visit**, exactly #129's number. But the refusals are ARITHMETICALLY HONEST — the cheapest legal continuation finishes 2.75 h after the lawn closes. Nothing was double-charged.
**Did.** The row was drawn BEFORE it was priced, so a drawn length that did not fit refused the *whole* continuation. Now `room` is what is left for the row once the shuffle and the walk home are paid, and the row takes `min(nd, room)`, floored at `GARDEN_ROW_MIN` 2.5 s. Draw COUNT unchanged in every branch.
**Gates:** census PASS, re-pinned · motion PASS · 0 POP · visual PASS at a *divergent* instant (my first HEAD/cand pair was byte-identical — the builds had not diverged there yet). Growing morning **1.54 → 1.79** rows/visit; continuation 33.4% → 42.1%; light refusals 10.6% → 0.7%; unspent light 2.38 → 1.19 h. Choice shares hold, latest departure identical.
**Verdict:** shipped — but the brief's **2.5 bar is not met and is not reachable**, and that is the finding.
**Surprise:** the bar was set without pricing the row. Window 12.0 h; walk in 3.4 h, already optimised; the nearest other edge bed is 4.08 cells so the shuffle is irreducible; a row is 2.91 h. From a 10.4 h first kneel the day holds 2.1 rows at best. Swept and rejected: halving the row buys +0.39 and costs the dwell; GARDEN_MORE 0.9 buys +0.05 — the roll is no longer the binder, the light is (c221).


## Iteration 140 — the buildings get their shadows (2026-09-03) [Roofs & skyline × Connect]

**Brief:** b140 — nine cast shadows and every one an object; give the BUILDINGS theirs. Full entry in LEDGER-archive.md.
**Did.** Two static grids beside `buildVolumes()`, one live pass beside `drawCloudShade()`. `shTop[]` is a solid cell's ROOF SURFACE, not its eave, so the far edge is #130's ragged skyline. `shOpen[]` — one south-to-north sweep per column carrying the deepest thing standing in FRONT of each cell — is the whole design. `buildSunShade()` marches each solid column down-sun (`dialThrow`'s solve, per cell of height) into a quarter-cell mask cached on a sun quantised to 1/64; `drawSunShade()` merges each row into runs and fills them as ONE path, ONCE. `shadowF()` fades it, `shOffset()` retracts the throw, `shSpread()` is the blur radius, zero at a clear sky.
**Gates:** census unchanged · motion PASS · filmstrip day/dusk/dawn 0 POP · `frame-cost.mjs` 4.18 → **4.31 ms** · the edge creeps 0 or +1 sub-cell (2.2 px) a frame, never more.
**HEAD → cand** (`probes/shade-diff.mjs`, seed 42, clear 16.9 h, 1600×950; same-code control 815 px): **25,343 px changed (2.40%)**, **94.8% open ground**, 4.6% the seam against the wall casting it, 37 px sky. Ground shaded **5.1%**; midwinter 10.5%; summer noon 0.1% — in under the eaves. No stacking (p0.1 luma 34→34). sd/mean: PATH.other **0.148→0.187**, ROAD.cross +16%, PATH.court +2.3%; CACHE 0.0%. 390×844: 1.20%.
**Verdict:** shipped — but "half the courtyard in shade" is not reachable, and that is the finding.
**Surprise:** the binder is `sunVec()`, not the shadow. Midday sun sits at 65–76°, so a throw is 0.33–1.0 × height: a 5.4-cell courtyard wall reaches TWO cells across a courtyard 58 wide — hence PATH.court +2.3% while the ten-cell cross street moves +16%. And ROAD.lane moved **0.0%**: the only volume south of the lane is our own block, whose eave is a fiction at 0.
**Law:** a cast shadow's TARGET SET is a visibility question before a geometry one — `project()` lifts a volume ~LIFT rows UP the frame, so a northward throw must be vetoed per column or it paints the caster's own roof; and price its EXTENT off `-S/S[2]` before briefing it, because `sunVec()` is a stylised HIGH sun.
**Law:** quads that must not double-darken are ONE path filled ONCE — overlapping subpaths wind to 2; per-quad fills seam and multiply twice.
**Note:** `context-budget.mjs` reads **OVER — 47.2 KB of 46 KB** after this entry, its laws and its two cues.

## Iteration 141 — a second punt, in its own lane, and the lantern gets lit (2026-09-03) [River & far bank × Scale/World]

**Brief:** b141 — answer the punt's SUPPLY; register `puntLampF()`'s lantern. Full entry in LEDGER-archive.md.
**Did.** Measured first (`probes/punt-supply.mjs`: `puntFits` wrapped clause by clause in its own evaluation order). The hull is MOORED 84% of the day and 57% of every busy block is leg 3, the boat BEACHED while its party stands — which prices the brief's two options: a ferryman poling home empty wins back 3.7 h of beaching and spends 2.3 h on the empty legs it costs (22%), against +100% for a hull. So: a hull. `PUNTS`/`PUNT_BERTHS`, `punt` still a name for hull A. `puntFits` returns an OFFER `{P, night, stand}`; `puntTripH(P, a, stand)` is SOLVED from the berth, not tabulated (hull A's night walk comes back 2.66, the old constant). Stands are a POOL of four on the island's spine, nearest FREE one to the hull's shore, so hull A alone is unchanged. `PUNT_LAMPS` beside `BOAT_LAMP`/`BARGE_LAMP`.
**Gates:** census PASS, tiles+structure unchanged · motion FAIL on `cart` alone, pre-existing (`probes/cart-jump.mjs`: the same 2.60-cell lane run 6× in every one of 8 seeds on HEAD *and* candidate, median 0) · filmstrip day+night 0 POP · `punt-force.mjs` PASS day and `--late`. **context-budget OVER, 48.3 of 46 KB: inventory 9.7/9.5.**
**HEAD → cand** (10 seeds × 26 days, genuine offers): BUSY **13.9% → 1.9%**, no longer top · take **27.1% → 38.4%** · crossings/day **0.44 → 0.64** · 166 claims / 166 completed, 0 strandings, 162 stood. Lantern at 22h: HEAD rgb(43,40,43), R−B **0**; cand rgb(227,204,157), **R−B 70**; water control rgb(20,32,59) on both.
**Verdict:** shipped
**Surprise:** the premise was an artifact of the bug the second hull exposed. `puntFits` is asked wherever a stop is PERFORMED, and the rider's stand on the eyot is a stop — so every rider re-asked from the island. One hull was its own guard (leg 3 is not leg 0) and refused it silently: **115 of HEAD's 174 BUSY refusals are one per crossing, by someone already across**; genuine BUSY was 13.9% and never the top refusal. With two hulls the free boat re-claimed a passenger standing on an island: 51 of 178 claims stopped completing. Then the channel — col 126 is the ONLY water between eyot and towpath and a hull is 0.52 across, so a landing further down it ran every crossing through the other hull's berth (505 of 6139 co-present samples under 0.9, least 0.04). Offsetting B's landing west by the same 0.95 as its berth makes the lanes parallel: swept end to end, least separation 0.95, 0 violations.
**Law:** a one-shot choice guarded only by the state it CONSUMES is re-entrant the moment that state is duplicated — end the membership positively at the claim, never by trusting the resource to refuse.
**Law:** two movers on a track share a CORRIDOR, not a point: sweep their whole paths against each other, and offset BOTH ends equally so the lanes are parallel by construction.
