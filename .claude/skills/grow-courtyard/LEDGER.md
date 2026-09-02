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

## Iteration 132 — the ticker learns where you are looking (2026-09-02) [The sill & the observer × Connect]

**Brief:** b132 — prefer a subject inside the frame; do not take the surface with a line about somewhere you cannot see. Full entry in LEDGER-archive.md.
**Did.** `inView(x,y)`, the only reader `whereN` has ever had: a cell projected through `viewFor(whereN)` against the frame and `sillTop()` — not the quarter's BOX and not `gview` (the ground CACHE's view). Intent beats the live camera: the ease is 0.9 s, a line lives 2.5–9. `sayAt(x,y,txt)` = announce with a SUBJECT, 33 sites. `AMBIENT_PLACES` 8 → 30 placed lines, `ambientHere()` preferring the in-frame ones and falling back to the WHOLE pool, never to silence.
**Premise correction, and it was the iteration.** That fallback was DEAD CODE: the roll wanted `tickerTimer < -8`, seventeen seconds of dead surface, and the town speaks every three — **0 ambient lines in 8 sim days, `tickerTimer` never once reaching 0**. Re-gated on `tickerFree()` (tested at the roll, so a blocked line is DROPPED not queued), restraint moved into the cadence, driven by `hash(ambIdx)` not `R()`.
**Gates:** census unchanged · motion PASS · filmstrip 0 POP · canvas **bit-identical to HEAD** at three pinned instants, fingerprint NONE.
**HEAD → cand** (3 seeds × 5 days × 5 quarters): off-frame subjects, fixed-place only — Courtyard **40/78 → 1/69**, Far bank **69/78 → 2/25**. In-frame share 19→33, 27→34, 14→25, 4→11%; Wide unchanged.
**Verdict:** shipped
**Surprise:** the roll self-balances unasked — ambient lines a day Wide 1.6, Courtyard 2.3, Far bank 3.4. The offer rate is flat and `tickerFree()` decides how many land, so the emptier suppression leaves a frame, the more the town murmurs about it.

## Iteration 133 — the cold gets out of the chimney and into the rooms (2026-09-02) [Sky, light & weather × Connect]

**Brief:** b133 — share `hearthF()`'s private `chill`, give it a reader indoors, fix the pop at the day roll. Full entry in LEDGER-archive.md.
**Did.** `chillF()` lifted verbatim out of `hearthF()` (the fire is bit-identical) and left OVERDRIVEN past 1 — 1.10 January, 1.35 under snow — because that saturation IS #124's winter fire; readers clamp at their own draw site. Its reader is the light the rooms throw out: the `LIT_PANES` screen fill and the window halo, both in the pass AFTER `applyLight`'s multiply. The lamp goes redder, not brighter — R held at full, the G and B the screen puts back falling away with the cold. Then `hearthIdx()` on `gardenIdx()`'s model at the other end of the clock (`HEARTH_ROLL 14`) and `HEARTH_FADE`, so a stack crosses its own threshold on a ramp. `DAY_ROLL` is now written once.
**Gates:** census unchanged · motion PASS · perf ±0.0% · filmstrip 0 POP · legible at 1600×950 and 390×844, winter dawn / winter night / summer night.
**HEAD → cand** (seed 7): worst single step **31 of 51 stacks flipping at hour 6.00 → 4 at 5.40**, worst alpha step L1 **5.690 → 0.360**. The glass, matched pane by pane over 32 deep nights a season: winter−summer R−B **+2.74 → +18.45**.
**Verdict:** shipped
**Surprise:** neither gate the brief named could see either thing. A mean over "whatever panes were lit" is mostly pane IDENTITY — the lit set is hashed per night, so HEAD reads winter *colder* than summer at one instant and *warmer* matched. The filmstrip is blind too: cropped to the roofline the roll frame reads Δ0.296 against a median of 0.296. It shows only as a difference BETWEEN the two builds' strips — that frame falls 0.296 → 0.248 while all ten others move ≤0.013.

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

**Brief:** b137 — presence per PLACE across whole days, sweep every cap, keep the knee.
**Premise right, cause was a membership bug.** `laneCount` was a RESIDUAL — everyone eleven subtractions did not remove — so it annexed every population added after it: the LAWN's five kinds (#95), the allotments' pickers, the sweeper, the loader. Summer day: **17.00 against a cap of 6.77, binding 100%** of daylight samples, of which the lane's own were **0.08**. `spawnLaneAgent` — the source for the plaza, quay, far green, parapet and allotment detour as well as the lane — had been dead in daylight for a year of iterations, no line changed, no gate fired.
**Did.** `lane:true` on its object literal (every branch and `makeCompanion` inherit it); `laneCount = agents.filter(a => a.lane).length`. Then swept each cap alone, 3 seeds x 26 days: **capacity 6->10**, **laneCap 6.4->10**, **eastCap min(7,*6)->min(9,*8)**, **FAR_CAP 3->5**; **FAM_CAP kept 3, EVE_CAP kept 6**, each with its reason written at the site.
**Gates:** census PASS (`people +99`, baseline re-pinned) · motion PASS · filmstrip 0 POP · visual PASS 1600x950 + 390x844.
**HEAD -> cand** (daylight dry): town **36.03 -> 50.19**, and every place up — the smallest gain is the courtyard's +13%, the largest the lane's +90%. Same pinned instant, same ticker line: **51 -> 60**. Crowded pairs 0.068 -> 0.078 *per person* — flat.
**Verdict:** shipped
**Surprise:** two caps refused to be raised, for opposite reasons. **FAM_CAP has three places and only two are reserved** — `famBench` locks a bench, the 1.6-cell fountain strip locks nothing — so 5 saturated the count at 2.41 while doubling plaza crowding 0.93 -> 1.66: past 3 the slack is not presence, it is two families drawing as one shape. **laneCap has no knee at all** up to 19 — it buys people linearly, but each destination is 5-6% of one roll, so past 10 every marginal arrival is a lane walker and the plaza stays flat (4.84 -> 4.68 -> 4.71). The branch share is the cap beneath the cap.
**Budget:** `context-budget.mjs` **OVER**, 49.4 KB before this pass, 52.5 after. Distil.
**Law:** a cap must count a membership it DEFINES; a residual annexes every later population and the original starves silently.
**Law:** a rate and a stock move opposite ways under one change — census `harvested -303`/`produce -83.8` looked like the allotments starving, but `probes/allot-source.mjs` says the lane detour is 6 of 76 arrivals and `harvestPlot` calls went UP 76->79. Count the CALLS before believing a census field about a stock.

## Iteration 138 — the plots get their tools (2026-09-03) [Cross street & allotments × New element]

**Brief:** b138 — furniture for the seventeen plots, on ROOF_FURN's model, per plot off hash(plot). Full entry in LEDGER-archive.md.
**Did.** `ALLOT_FURN`/`PLOT_BOX`: shed, compost bay, water butt, barrow, bean canes, cloche — solved ONCE off `hash(plot)`, held in world coordinates, drawn into the ground cache before `drawGlassBack`, named by `allotFurnAt`/`allotFurnName` off the boxes the paint uses. **38 pieces over 15 plots**, zero `R()`. A plot owns x [ox, ox+4) y [oy, oy+3) — beds plus a south and east apron — leaving a whole cell of way in x, four rows in y, and the WEST side clear, where `sendToPlot` lands its holder at `[cell-0.6, cell+0.5]`. Canes/cloche are gated on the warm/cold half of `warmth` with per-plot slack; the barrow on somebody kneeling — live state under a cached surface, so `barrowKey()` drives `groundDirty` as `washPainted` does (2.5 extra rebuilds a sim day).
**Gates:** census PASS — `structures +342`, new `plotFurniture 342`, **nothing else** across 9 cells; baseline **re-pinned** · motion PASS · filmstrip 0 POP · perf ±0.0%, `drawGround()` against HEAD interleaved **34.00 → 34.10 ms** · legible Street/Wide/390×844/night/cloches-out. `probes/plot-furniture.mjs`: 0 geometry violations, all five clauses FIRE on a moved piece, same set in 3 seeds. `probes/plot-naming.mjs` drives a **real mousemove**: all six kinds named, each distinct from the grass beside it.
**Verdict:** shipped
**Surprise:** the brief's cane gate was a feature at a rate of zero, through DWELL. Beans are **3.1%** of standing allotment cells against cabbages 47.1 — not because they are rarely sown (`speciesFor` offers four veg flat) but because cabbages are the one `hardy` species and stand the winter while the rest die back. Canes on a presence test showed on **1.5%** of a year. Gated on the season they are up 49.7%, and the crop now decides what the pointer SAYS instead of whether there is anything to point at.
**Budget:** `context-budget.mjs` **OVER at 51.7 KB** against 46 KB, before this pass; #136 and #137 are also over the entry cap and are the manager's to condense.
**Law:** at n = 15 a one-in-three hash threshold is not one in three — the first build put 7 sheds, 1 bay and 7 bare corners out, and a flat `h < 0.62` put a butt on all seven west plots (a 3.5% run, not a broken hash: 667 such lines in 20,000 against 704 expected). Rank the members by their own hash and cut at the quantiles.
**Law:** a world offset added to a PROJECTED coordinate is a pixel — 0.46 of a cell became 1.4 px, and the canes' eight tops landed on each other. Solve both ends of a stroke in world space and project each.

## Iteration 139 — the gardener works the stretch the light allows (2026-09-03) [Courtyard & garden × Deepen]

**Brief:** b139 — re-price gardenerKneel's continuation so a gardener who has knelt finishes the bed. Full entry in LEDGER-archive.md.
**Premise confirmed, diagnosis wrong.** `probes/gardener-rows.mjs` (10 seeds x 26 days) reads the branch off the R() call count *inside* the call: a growing morning is **1.54 rows/visit**, exactly #129's number. But the refusals are ARITHMETICALLY HONEST — the cheapest legal continuation finishes **2.75 h after the lawn closes**. Nothing was double-charged.
**Did.** The row is drawn BEFORE it is priced, so a drawn length that did not fit refused the *whole* continuation. Now `room` is what is left for the row once the shuffle and the walk home are paid, and the row takes `min(nd, room)`, floored at `GARDEN_ROW_MIN` 2.5 s. Draw COUNT unchanged in every branch.
**Gates:** census PASS, re-pinned · motion PASS · 0 POP · visual PASS at a *divergent* instant (s1234 t124) — my first HEAD/cand pair was byte-identical, the builds had not diverged there yet. Budget **OVER at 51.6 KB**.
**HEAD -> cand:** growing morning **1.54 -> 1.79** rows/visit; continuation 33.4% -> 42.1%; growing-morning light refusals **10.6% -> 0.7%**; unspent light 2.38 -> **1.19 h**; refusals with >1 h of room 64/186 -> **3/165**. Choice shares hold (no kind moves >2 pp); latest departure 19.61 h, identical.
**Verdict:** shipped — but the brief's **2.5 bar is not met and is not reachable**, and that is the finding.
**Surprise:** the bar was set without pricing the row. Window 12.0 h; walk in 3.4 h, already optimised (#108's door, #129's near third); the nearest *other* edge bed is **4.08 cells**, so the shuffle is irreducible; a row is 2.91 h. From a 10.4 h first kneel the day holds 2.1 rows at best. Swept and rejected: halving the row buys +0.39 and costs the dwell; GARDEN_MORE 0.9 buys **+0.05** — the roll is no longer the binder, the light is.
**Law:** a unit of work drawn BEFORE it is priced makes the price all-or-nothing — solve the test for the unit and take `min(drawn, room)`.
**Law:** `__reseed()` REASSIGNS `R` rather than rewinding it, so a monkeypatch on `R` installed before it is silently eaten — and the probe then reports a clean, plausible, wrong attribution.
