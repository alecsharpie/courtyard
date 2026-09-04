# The Courtyard — ledger archive

Entries rotated out of `LEDGER.md`. Append-only. **Only the manager reads this** —
a worker that opens it to "catch up" spends its whole context on history.

## Iteration 140 — the buildings get their shadows (2026-09-03) [Roofs & skyline × Connect]

**Brief:** b140 — nine cast shadows in this town and every one is an object; give the BUILDINGS theirs.
**Did.** Two static grids beside `buildVolumes()`, one live pass beside `drawCloudShade()`. `shTop[]` is each solid cell's ROOF SURFACE, not its eave, so the far edge is #130's ragged skyline and a ridge reaches past its own gutter. `shOpen[]` is one south-to-north sweep per column carrying the deepest thing standing in FRONT of each cell — and it is the whole design: a shadow is thrown north and north is exactly where `project()` has already drawn the caster, so without it the pass paints a house's shadow on that house's own slates. `buildSunShade()` marches every solid cell's column down-sun (`dialThrow`'s solve, held per cell of height) into a quarter-cell mask, cached on a sun quantised to 1/64 — ~200 solves a sim day at 0.14 ms. `drawSunShade()` merges each row into runs and fills them as ONE path, ONCE. `shadowF()` fades it, `shOffset()` retracts the throw, `shSpread()` is the blur radius and is zero at a clear sky.
**Gates:** census unchanged · motion PASS · filmstrip day/dusk/dawn 0 POP · `perf.mjs` blind, `frame-cost.mjs` interleaved **4.18 → 4.31 ms** summer, 4.60 → 4.69 winter · edge creeps 0 or +1 sub-cell (2.2 px) per frame, never more.
**HEAD → cand** (`probes/shade-diff.mjs`, seed 42, clear 16.9 h, 1600×950; same-code control 815 px): 25,343 px changed = 2.40% of canvas, **94.8% open ground**, 4.6% the antialiased seam where a shadow meets the wall casting it, 37 px sky. Ground cells shaded: **455/8,927 (5.1%)**; midwinter 16.0 h **933 (10.5%)**; summer noon **7 (0.1%)** — pulled in under the eaves. No stacking: open-ground luma p0.1 34→34, p50 144→144. Class sd/mean (`road-surface.mjs`, same-code control exactly 0.0%): PATH.other **0.148→0.187 (+27%)**, ROAD.cross +16%, SIDE.cross +14%, BED +9%, **PATH.court 0.0918→0.0939 (+2.3%)**. CACHE 0.0% everywhere. 390×844: 1.20% changed, mean |dL| 24.6.
**Verdict:** shipped — but "half the courtyard in shade" is not reachable, and that is the finding.
**Surprise:** the binder is `sunVec()`, not the shadow. This town's sun sits at 65–76° at midday, so a throw is 0.33–1.0 × height: a 5.4-cell courtyard wall reaches TWO cells across a courtyard 58 cells wide, which is why PATH.court moves 2.3% while the ten-cell cross street moves 16%. And the lane can never have one — ROAD.lane moved 0.0%, because the only volume south of it is our own block, whose eave is a fiction at 0.
**Law:** a cast shadow's TARGET SET is a visibility question before it is a geometry one — `project()` lifts a volume ~LIFT rows UP the frame, so the ground behind a house is drawn over by that house, and anything thrown northward must be vetoed against a per-column occlusion sweep or it paints the caster's own roof.
**Law:** many small quads that must not double-darken are ONE path filled ONCE — overlapping subpaths wind to 2 and a nonzero fill paints their union flat, where per-quad fills seam at every shared edge and multiply twice at every overlap.
**Law:** price a cast-shadow feature's EXTENT off `-S/S[2]` before briefing it. `sunVec()` is a stylised high sun (65–76° at midday, not 61°), so a throw is 0.33–1.0 × height and a shadow feature is a rim that lengthens toward evening and midwinter, never a wedge across a wide space.
## Iteration 133 — the cold gets out of the chimney and into the rooms (2026-09-02) [Sky, light & weather × Connect]

**Brief:** b133 — share `hearthF()`'s private `chill`, give it a reader indoors, fix the pop at the day roll. Full entry in LEDGER-archive.md.
**Did.** `chillF()` lifted verbatim out of `hearthF()` (the fire is bit-identical) and left OVERDRIVEN past 1 — 1.10 January, 1.35 under snow — because that saturation IS #124's winter fire; readers clamp at their own draw site. Its reader is the light the rooms throw out: the `LIT_PANES` screen fill and the window halo, both in the pass AFTER `applyLight`'s multiply. The lamp goes redder, not brighter — R held at full, the G and B the screen puts back falling away with the cold. Then `hearthIdx()` on `gardenIdx()`'s model at the other end of the clock (`HEARTH_ROLL 14`) and `HEARTH_FADE`, so a stack crosses its own threshold on a ramp. `DAY_ROLL` is now written once.
**Gates:** census unchanged · motion PASS · perf ±0.0% · filmstrip 0 POP · legible at 1600×950 and 390×844, winter dawn / winter night / summer night.
**HEAD → cand** (seed 7): worst single step **31 of 51 stacks flipping at hour 6.00 → 4 at 5.40**, worst alpha step L1 **5.690 → 0.360**. The glass, matched pane by pane over 32 deep nights a season: winter−summer R−B **+2.74 → +18.45**.
**Verdict:** shipped
**Surprise:** neither gate the brief named could see either thing. A mean over "whatever panes were lit" is mostly pane IDENTITY — the lit set is hashed per night, so HEAD reads winter *colder* than summer at one instant and *warmer* matched. The filmstrip is blind too: cropped to the roofline the roll frame reads Δ0.296 against a median of 0.296. It shows only as a difference BETWEEN the two builds' strips — that frame falls 0.296 → 0.248 while all ten others move ≤0.013.



## Iteration 141 — a second punt, in its own lane, and the lantern gets lit (2026-09-03) [River & far bank × Scale/World]

**Brief:** b141 — answer the punt's SUPPLY (a second hull, or a cheaper turnaround), and register `puntLampF()`'s lantern so it is not slate at night.
**Did.** Measured first (`probes/punt-supply.mjs`, `puntFits` wrapped clause by clause in its own evaluation order, 10 seeds × 26 days). The hull is MOORED 84% of the day; 57% of every busy block is **leg 3, the boat beached while its party stands**. That priced the brief's two options: a ferryman poling home empty wins back 3.7 h of beaching and spends 2.3 h on the two empty legs it costs — **22%** — against **+100%** for a hull. So: a hull.
`PUNTS`/`PUNT_BERTHS`; `punt` stays a name for hull A. Every `punt.*` reader takes the hull — tick, draw, swans, items, the pointer's `personName0`. `puntFits` returns an OFFER `{P, night, stand}`; `puntTripH(P, a, stand)` is **solved from the berth** instead of tabulated (hull A's night walk comes back 2.66, the old constant, to three figures). Stands are a POOL of four on the island's spine; a hull takes the nearest FREE one to its own shore, so hull A alone is unchanged. `PUNT_LAMPS` is a list beside `BOAT_LAMP`/`BARGE_LAMP`, pushed at the draw and repainted after `applyLight`.
**Gates:** census PASS, **tiles and structure unchanged** (`people +3`) · motion FAIL on `cart` only — proven pre-existing: `probes/cart-jump.mjs` finds the identical 2.60-cell lane run 6× in **every one of 8 seeds on HEAD and on the candidate**, against a median of 0 · filmstrip day and night **0 POP** · `punt-force.mjs` PASS day and `--late`.
**HEAD → cand** (10 seeds × 26 days, genuine offers at the planks): BUSY **13.9% → 1.9%** and no longer the top refusal · take rate **27.1% → 38.4%** · crossings/day **0.44 → 0.64**. 166 claims / **166** completed round trips, 0 strandings, 0 blocks over 12 h, 162 of 166 riders stood. Lantern at 22h: HEAD rgb(43,40,43), warmth R−B **0** — slate; candidate rgb(227,204,157), **R−B 70** — a flame, against a water control of rgb(20,32,59) on both.
**Verdict:** shipped
**Surprise:** the brief's premise was an artifact of the same bug the second hull exposed. `puntFits` is asked wherever a stop is PERFORMED, and the rider's stand on the eyot is a stop — so every rider re-asked from the island. With one hull the boat was its own guard (leg 3 is not leg 0) and the re-ask was silently refused as BUSY: **115 of HEAD's 174 BUSY refusals are one per crossing, by someone already across.** Genuine BUSY was 13.9%, never the top refusal. With two hulls the other boat is free and re-claimed a passenger standing on an island — 51 of 178 claims stopped completing and the median block went 6.2 h → 8.7 h with a 24 h tail. Second: the one-cell channel. Col 126 is the ONLY water between the eyot and the towpath and a hull is 0.52 across, so a second landing further down it put every crossing through the first hull's berth — 505 of 6139 co-present samples under 0.9 cells, least 0.04. The fix was to offset hull B's landing west by the same 0.95 as its berth: parallel lanes, swept end to end at **least separation 0.95**, 0 violations.
**Law:** a one-shot choice guarded only by the state it CONSUMES is re-entrant the moment that state is duplicated — clear the membership flag at the claim, positively, rather than trusting the resource to refuse.
**Law:** two movers on a track share a corridor, not a point: sweep their whole PATHS against each other, not their endpoints, and separate them by offsetting BOTH ends equally so the lanes are parallel by construction.
**Cue:** WIND is now the punt's top refusal at 32.9% of offers — `windF() >= 0.5` deletes a third of the crossings, and nobody has priced whether that threshold is right for a punt.
**Cue:** a swan gets to 1.05 cells of hull B under way. The give-way rule only pushes swans off a LANDING; nothing yields to a hull in the channel.
**Cue:** `probes/punt.mjs` still reports "strandings" for every night rider — it predates #131's exemption and its test is `a.eyot after eastOpen() closed`, which `eastOpenFor()` legitimately covers.
## Iteration 134 — the pools stop being drawn where nobody can see them (2026-09-02) [Lane & market × Harness]

**Brief:** b134 — cull `drawPuddles` to the visible frame, byte-identical output. Full entry in LEDGER-archive.md.
**Did.** `inFrameBox(sx,sy,rx,ry)` beside `project()`: ONE screen cull, on the CANVAS rect and deliberately not `sillTop()` — `drawPuddles` draws before the sill is composited and may legitimately paint under it, so the canvas is the only bound true of both callers, and the cull is exact by construction. `drawPuddleLights` calls the same one.
**Gates:** census unchanged · motion PASS · filmstrip 0 POP · `perf.mjs` ±0.0% and **blind** (vsync-locked at 16.70 ms over a mostly dry day).
**Proof** (seed 7, wet 0.75, 400 frames × 3 reps, interleaved): drawPuddles **−56% to −73%** at the four quarters, whole wet frame −8 to −12%; Wide ±2.5% both ways. Canvas hash **IDENTICAL 28 of 28**, fingerprint NONE.
**Verdict:** shipped
**Surprise:** the phone is the case that needed this most and the brief never named it. At 390×844 the **Wide** camera — the default, and effectively the only one a phone has — already culls **61%** of the wet pools, and Far bank there culls **100%**. At 1280×700 Courtyard **17 pools are kept only because the cull uses rx/ry** rather than the centre.


## Iteration 142 — the clock stops being the loudest voice in the room (2026-09-03) [The sill & the observer × Connect]

**Brief:** b142 — price the strike against everything else in the queue; do not gate SOUNDS on `inView`, do not dilute with new ambient places.
**Did.** Named the third rank the ticker always had. `background(rank, txt, then, until)` beside `announce()`: a **MURMUR** (the ambient roll, which already hand-rolled this test) may never take a surface anyone holds *or is waiting for*; the **CLOCK** may additionally wait for a busy surface, but only into an EMPTY queue — `announce()` makes room on a full one by shifting the oldest line off, so entering only on an empty queue makes "the clock never displaces the town's own news" true by construction (costs 1 line in 55). `announce()` gained `until`, a SIM time after which a line stops being **true** as against `TICK_STALE`, which is how long anyone will wait for it; `tickTicker()` drops on either. The strike buys the remainder of the hour it names and no more. `bellUntil` is untouched, so the bell still rings every third hour: pigeons off the belfry, walkers with their heads back, on hours the ticker never mentions.
**Gates:** census unchanged, all six groups (no `R()` spent — the seeded world is bit-identical) · motion PASS · visual PASS, nothing drawn changed · perf skipped, no per-frame pass.
**HEAD → cand** (`probes/ticker-price.mjs`, 6 sim days × 3 seeds, every line classified where it is BORN and read back at `showLine`). **Courtyard:** strike **46% → 20%**, the town's own places (placed + ambient) **118 → 164 lines, +39%**, total 323 → 267 (−17%, not a collapse). **Wide:** strike 30% → 8%, placed 53% → **71%**, total −9%, and all four remarked hours still sound. Strike lateness ≥1 h: **23% → 0%**, max 2.25 h → 0.96 h by construction.
**Verdict:** shipped
**Surprise:** the queue price alone cannot reach this, and the first cut proved it twice. **At a quarter camera there is nothing in the queue to price against** — `inView` has already withheld the competition, so a contention rule binds at Wide and slides off at Courtyard. Worse, pure drop-if-busy makes the clock a function of how busy the *day* is: at Wide it was then heard at midnight and three in the morning and **0 of 18 seed-days at six, nine, three and six again**. The binding number is arithmetic, not contention — a 55 s day holds ~22 lines at `TICK_DWELL`, and eight strikes is over a third of everything the town can say before a single contest is lost. So the second half is the **remark's** cadence: `CLOCK_SAID = [0, 9, 12, 18]`, the day's two poles and the two the church answers, chosen so `answered` stays wholly reachable.
**Law:** a contention price is only a price where there IS contention — a rule that ranks callers on a shared surface cannot bind in a view that has already filtered the other callers out, and there the CADENCE against the surface's capacity (a 55 s day × `TICK_DWELL` ≈ 22 slots) is the whole answer. Count the slots before designing the queue.
**Law:** staleness and untruth are two clocks. `TICK_STALE` is how long anyone will WAIT for a line; a line that names an instant needs a second bound at the instant it stops being TRUE, or it will be displayed contradicting a readout two inches above it.
**Cue:** at Wide the clock now lands 1.4 of 4 remarked strikes a day and 18h lands 5 of 18 seed-days everywhere — the evening is the town's busiest hour and the church's answer is the line most often lost with it.
**Note:** `context-budget.mjs` reads **OVER — 47.9 KB of 46 KB** before this entry.
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


## Iteration 143 — the evening's warm wash rides the sun, as the morning already did (2026-09-03) [Sky, light & weather × Connect]

**Brief:** b143 — `applyLight`'s dusk is `clamp(1 - |hour - 19|/1.8)`, a hard-coded hour in a light; #112 fixed the morning onto `sunUp` and left the evening.
**Did.** One line: `DUSK_OFF = -1.0`, peak at `sunDown + DUSK_OFF`, which at SEASON_START is **19.00 exactly** — `kioskOpen`'s construction, so the anchor day is provably the old evening. Half-width unchanged at 1.8 and deliberately unscaled (see the law). Morning untouched. No hard-coded hour is left in any light term.
**Gates:** census PASS, six groups unchanged (no `R()` spent) · motion PASS · visual PASS · filmstrip **0 POP** on a midwinter evening (t=1069) and a midsummer one (t=360), both a smooth amber→blue ramp · perf skipped.
**HEAD → cand.** `probes/dusk-year.mjs`, over the year at eight offsets from sunset: HEAD's spread **0.72–1.00 at every k**, candidate's **0.000 at all eight**. At sunset itself midwinter 0.722 → 0.444, midsummer **0.000 → 0.444**. `probes/dusk-frame.mjs`, R−B above `sillTop()`: midsummer sunset−1 **−0.47 → +19.39**, while midwinter's peak holds at +27.07 against the +28.3 #112 measured for the warmest dusk the town then had — the peak is the *same*, it just now happens on every evening instead of one. Both probes carry controls that came back byte-identical.
**Verdict:** shipped
**Surprise:** the town's other dusk already knew. `skyCols` has ridden `sunDown - 0.6` since #11 — so the note inside `applyLight` reading "at dusk this wash and the sky's own peak nearly two hours apart" was never a taste observation. It was **this bug, measured and written down and left**: the gap is 0.4 h at the anchor and 1.9 h at midsummer *because one term was on the sun and the other on the clock*. #112 read that sentence, used it to justify damping the morning to 0.55, and did not notice it was a symptom of the half it was leaving alone.
**Budget:** **OVER — 49.2 of 46 KB** before this entry. Fourth pass running over; #136, #141, #142 all flagged it.
**Law:** re-keying a term onto the sun moves its OFFSET, and its WIDTH must then stay fixed — scaling both makes the value at sunset+k a function of the season again, which was the fault. Scale a width only when the thing is the night's clock (`dawnF`), never when it is a wash read at an offset.
**Law:** a comment that measures two terms disagreeing is a BUG REPORT, not a description — when the source explains why a constant is damped, check what it is damped *against*.

## Iteration 144 — the east gets a share of the lane's roll, and the plaza gets a third place (2026-09-03) [Lane & market × Connect]

**Brief:** b144 — `laneCap` has no knee because the east branches are 5–6% bands each: re-weight the roll so raising the cap reaches the east. Reserve the fountain stand, then re-sweep `FAM_CAP`.
**Did.** Re-measured the premise on HEAD first (6 seeds × 14 days): cap 10 → 16 buys the lane +3.05 and the east +0.17 plaza, **−0.28 quay, −0.12 far bank**. So: `eastEdges(cap)` — the four east bands (0.06/0.05/0.05/0.04) scale by `eastPull(cap)`, 1.0 below `EAST_CAP0` 6 and 2.0 at `EAST_CAP1` 14, and the width comes out of the PLAIN passer-by alone. Keyed on the CAP, not on fill: an east trip holds its `lane` slot for its whole ~40 s, so occupancy would feed back on itself. `FOUNT_STANDS` — three stands on the roundel's inner ring, each held by one party via `a.fstand`, shared by the family and the lane's plaza branch; a family that can get neither bench nor stand does not set out. `spawnLaneAgent(room, cap)`, one caller.
**Gates:** census PASS, structure unchanged, baseline **re-pinned** (the reclassified roll legitimately reshuffles the seeded world) · motion PASS · visual PASS wide/east/lane/courtyard · filmstrip 1 POP at seed 42 — **rain onset**, `rain 0→1`, uniform across all 16 blocks of a block map; HEAD rains through that whole window so it never steps. Seed 7: 0 POP · `probes/fount-stands.mjs` 10/10, incl. the cascade being HEAD's exact six numbers at rest.
**HEAD → shipped**, laneCap 10 → 16: plaza **+0.17 → +1.02**, quay −0.28 → +0.08, far bank −0.12 → +0.11, bridge +0.27 → +0.26; east half **9.73 → 10.96** at cap 16 with the lane holding (17.38 → 16.61) and the town +1.27 fuller. Plaza crowded pairs PER PERSON **0.237 → 0.153** at cap 16, 0.193 → 0.125 at cap 10. The pull is awake on 72.1% of daylit samples, at max on 14.6%.
**Verdict:** shipped
**Surprise:** the family half's premise was right about the crowding and wrong about the cap. Reserving the stand does exactly what the brief predicted — HEAD at `FAM_CAP` 5 costs 0.193 → **0.282** crowded pairs per person for +0.19 families, and the shipped build holds 0.145–0.159 across 3, 4, 5 and 7. But the higher cap still buys nobody: 5 and 7 return **byte-identical** numbers and bind **0.0%** of open daylight, so past 4 the bound was never the places at all — it is `FAM_RATE` and the window, which the source comment had already guessed and nobody had tested. Kept the knee: `FAM_CAP` 3 → 4. Second: the east numbers could not see the first cut's real cost. Scaling the whole 0.38 tail took the cyclist and the dog from 0.06 of the roll to 0.028 at a full cap, and a lane holding its 16 people with a fifth of its bicycles measures exactly as full.
**Budget:** `context-budget.mjs` **OVER — 50.2 of 46 KB** before this entry (state.json's inventory is 16.3 KB against a 9.5 KB cap). Fifth pass running over; #136, #141, #142, #143 all flagged it.
**Law:** a cap and a SHARE are two different bounds and only one of them can be swept — when raising a ceiling buys only the branch nearest the source, re-weight the branch and then re-sweep, because the sweep is what tells you the ceiling has stopped being the bound at all (identical numbers at two settings is a DEAD constant, not a headroom).
**Law:** re-weighting a threshold cascade must name which band PAYS. Taking the width proportionally from a whole tail is invisible to presence per place — presence counts people, not what they are doing — so a variety a picture would miss is spent silently. Take it from the band whose people stop nowhere, and let that bound the pull.
**Cue:** the ceiling can now be raised profitably — the east responds to `laneCap` where #137 proved it did not. Re-pricing `laneCap`'s coefficient is the follow-up this iteration deliberately did not take (the brief forbade it).
## Iteration 137 — the lane's cap starts counting the lane (2026-09-03) [People & animals × Scale/World]

**Brief:** b137 — presence per PLACE across whole days, sweep every cap, keep the knee. Full entry in LEDGER-archive.md.
**Premise right, cause was a membership bug.** `laneCount` was a RESIDUAL — everyone eleven subtractions did not remove — so it annexed every population added after it (the LAWN's five kinds, the pickers, the sweeper, the loader). Summer day: **17.00 against a cap of 6.77, binding 100%** of daylight samples, of which the lane's own were 0.08. `spawnLaneAgent` — the source for the plaza, quay, far green, parapet and allotment detour too — had been dead in daylight for a year of iterations with no line changed and no gate fired.
**Did.** `lane:true` on its object literal (every branch and `makeCompanion` inherit it); `laneCount = agents.filter(a => a.lane).length`. Then swept each cap alone, 3 seeds × 26 days (`probes/town-caps.mjs`): **capacity 6→10, laneCap 6.4→10, eastCap min(7,*6)→min(9,*8), FAR_CAP 3→5**; FAM_CAP kept 3, EVE_CAP kept 6, each with its reason at the site.
**Gates:** census PASS (`people +99`, baseline re-pinned) · motion PASS · 0 POP · visual PASS 1600×950 + 390×844. Town presence **36.03 → 50.19**, every place up (courtyard +13% smallest, lane +90% largest); crowded pairs per person flat 0.068 → 0.078.
**Verdict:** shipped
**Surprise:** two caps refused to be raised, for opposite reasons — **FAM_CAP has three places and only two are reserved** (past 3 the slack is two families drawing as one shape, c218), and **laneCap has no knee at all** up to 19, because each destination is 5–6% of one roll so past 10 every marginal arrival is a lane walker (c219). The branch share is the cap beneath the cap.


## Iteration 145 — the town gets into its river (2026-09-03) [River & far bank × Deepen]

**Brief:** b145 — the water held the moon and one baked bank-smear and nothing else; put the standing things IN it, fade with depth, let windF break them. Take the swing.
**Did.** `MIRROR`/`setMirror()`: one SIGN in `project()` (`LIFTM = LIFT * MIRROR`, folded so the hot path keeps its single multiply). A negative z is the mirror, so **each caster's reflection is the caster's own draw** — no second geometry to drift. `drawWaterMirror` draws five casters into an offscreen with `setMirror(-1)`, dies each away from its own waterline (`destination-in`, REFL_FADE 3.6 cells), chops what's left into bars that drift on `FLOW_SPEED` and shiver on `windT` (`destination-out`), punches the eyot, and composites once under a water-path clip at REFL_A 0.42. Casters: the lane bridge (arches + balustrade, into the near water), the footbridge, the mill wheel, the jetty, the willow. Six one-line `MIRROR > 0` guards stand down the things drawn ON the water — four cast shadows, the wheel's foam, the boat under the deck, and the willow's `crowns` push.
**Premise half-wrong, and the geometry says so.** The clock tower is at **x 63.8–66.2**, fifty cells west of the channel, and the church at **x 131–136**: at LIFT 1.15 an image runs *southward* out of its caster's feet, so both fall on dry land. Named in the source comment with their coordinates.
**Gates:** census PASS, six groups unchanged (no `R()`) · motion PASS · filmstrip **0 POP** day and night · `probes/frame-diff.mjs` **0.362%** of the picture moved, bbox x 986–1125 — the river column and nothing else; Courtyard/lane/mobile **byte-identical** (the box cull is exact) · perf: `probes/refl-cost.mjs`, windy, five cameras, +0.32 ms Wide, **+0.57 ms Plaza** (worst), **+0.008 ms Courtyard**.
**HEAD → cand.** `probes/road-surface.mjs`: FRAME **WATER sd/mean 0.1737 → 0.1772**, every other class 0.0%, and the **CACHE unchanged everywhere** — nothing baked. Added mark 14 762 px against a same-code control floor of **450** (33×), and the shapes are the arches, the deck, the wheel. `probes/refl-band.py`: row-profile hf/mean **0.065 calm → 0.218 windy**. Frame-to-frame in the bridge's band: **0.000 calm, 1.4–2.0 windy** — a still river holds a still image.
**Verdict:** shipped
**Surprise:** the pass is not its draws. The five mirrored draws total **0.118 ms**; the other 0.41 ms is masking and compositing — and both "obvious" savings made it worse, clipping the offscreen to the water 0.689 ms and a full-canvas `destination-in` **1.48 ms**, against this arrangement's 0.57.
**Law:** a cast image's TARGET SET is southward at this camera, and a caster's own draw is its image — put the sign in `project()`, and make every draw that lands ON the plane read it.
**Cue:** the boats are the one caster class left out, and the rows-3-12 bank-smear is now the only un-live thing in the water.
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


## Iteration 147 — the allotments are monoculture, and the brief's bug does not exist (2026-09-03) [Cross street & allotments × Deepen]

**Brief:** b147 — make `plotCrop()` answer for the PLOT, not its first sown cell, so one cabbage stops lifting a plot's tender cells to the winter ceiling.
**Priced the premise first, and it is false.** A year x 3 seeds (`probes/allot-year.mjs`, 69,008 sown plot-samples): **0** held two species (species/plot **1.000**), so the first cell WAS the majority, and **0** had a hardy cell under a tender majority. In deep winter tender cells in the open reach stage 3 **0 times**, against hardy 21,474 and glass 10,191: `successLooksLike` already holds on HEAD, exactly. Monoculture because caTick's infill sows a bare cell with `plotCrop()` itself, `harvestPlot()` lifts the row whole, and the kneel plants nothing — none of it the read.
**The premise's source:** `plotClimbs()`'s comment claimed the first-cell read missed "a fifth of the plots that actually had beans". Re-counted, they agree **13,012 of 13,012**.
**Did.** Killed the false claim; wrote the measured invariant at `plotCrop()` — the three conditions holding it, and the successor read for the day one goes.
**Gates:** census **byte-identical** · visual PASS · motion/perf skipped: no draw, no `R()`.
**Verdict:** briefRejected — source corrected, feature not built.
**Surprise:** the hand-sow branch is dead. 101 allot kneels a year = 71 harvests + 15 turns + 15 hand-sows, and the hand-sows plant **0 cells** — a kneel only reaches an UNRIPE plot, and by then the infill has filled it. A holder comes in through the gate, kneels, plants nothing, says nothing, walks out.
**Law:** a stale source COMMENT is a brief generator — when you refute a premise, delete the sentence that produced it, or the loop pays for it again.

## Iteration 148 — the plaza's families are priced at both ends of a window the sun cuts (2026-09-03) [Plaza & quay × Scale/World]

**Brief:** b148 — price presence as rate × visit BEFORE moving either, then sweep the rate and the window and keep the knee. Do not raise `FAM_CAP`.
**Priced first, and the price was the whole answer.** `probes/fam-window.mjs` reads leg-in + dwell + leg-out off the build's own `pathHours`: the five places cost **7.7 to 12.6 h** apiece against a **7.5 h** window. The visit OUTLASTED the window, so no whole visit ever fit — and the "too late" clause ate **61.3%** of every call, against the cap's 9.8% and the places' 2.6%. Half of a family's day is WALKING (legs 4.2–7.8 h, dwell 3.7–4.8), which is why presence 2.43 only held 1.80 places.
**Did.** `famWalk()` — one definition of the two legs, called by both the roll's bounds and the set-out test. `famWin()` — `FAM_H0`/`FAM_H1` are now the hours the plaza HOLDS families (first ARRIVED, last GONE), cut to the sun: `daylight` is `sin(pi (hour−sunUp)/dayHours)`, so it passes `FAM_SUN` at `FAM_SUN_U` along the arc and that far from its end. `FAM_LEG` solves the roll's span once off the extremes. The fit is a FILTER on the free places, not a veto after the draw, and the dwell is CLIPPED to the room the day has left against `FAM_DWELL_MIN` — that is what keeps the 12.6 h far bench reachable at all. `freeBench()`/`a.pbench` beside `freeStand()`/`a.fstand`, and `makeCompanion` nulls both: a place is held by the party's LEAD.
**Gates:** census FAIL `people −10%` → **replayed: not a collapse.** Same ladder, 9 seeds, HEAD vs cand: ALL 1289→1241, **DRY cells 1084→1089**; the whole gap is 4 raining cells whose intensity moved. `town-caps` (2480 samples, dry daylight) **town 54.26→57.42**. Baseline re-pinned. · motion FAIL `cart jumps 0→1` → **replayed on HEAD: `cart85 moved 2.60` at seed 7, the identical jump, relocated by the reshuffle.** 0 nan/oob/flicker · filmstrip day 0 POP · wide/east/lane/courtyard and `probes/plaza-shot.mjs` clean · `fount-stands.mjs` ALL PASS · claim exclusive: 0 clashes ever.
**HEAD → shipped** (6 seeds × 14 days, fine summer 12–17): places **held 1.83 → 2.70 of 5**; bench0 51.2→54.3, **bench1 26.1→60.5**, stand0 52.3→53.7, stand1 30.8→45.7, **stand2 22.4→55.6**. Arrivals/day 2.46→4.05, families 2.38→2.57, `FAM_CAP` binds 11.3%→47.7%, plaza presence **5.88→8.59**.
**Verdict:** shipped — but the crowding bar is MISSED and that is the finding.
**Surprise:** the crowding did not come from the families. Plaza crowded pairs per person went 0.153→0.167 (0.141→0.184 on #144's own instrument), outside the brief's band — but per family they FELL, 0.204→0.192, and a control run with the family source off reads 0.114 on HEAD and 0.097 here. Classified by kind, the plaza's commonest crowded pair is **`parent+plaza` at 27%, on BOTH builds**: #144 put its three stands on the roundel's SOUTH arc, and everything approaches the plaza from the south. The 90° stand sits at (105.5, 33.5); the lane's plaza corridor is `ex2` 104–106 running due north through it, and a family's route to the far bench passes **0.4 cells** from it. Raising occupancy did not create the fault, it just made the town walk through it more often.
## Iteration 141 — a second punt, in its own lane, and the lantern gets lit (2026-09-03) [River & far bank × Scale/World]

**Brief:** b141 — answer the punt's SUPPLY; register `puntLampF()`'s lantern. Full entry in LEDGER-archive.md.
**Did.** Measured first (`probes/punt-supply.mjs`: `puntFits` wrapped clause by clause in its own evaluation order). The hull is MOORED 84% of the day and 57% of every busy block is leg 3, the boat BEACHED while its party stands — which prices the brief's two options: a ferryman poling home empty wins back 3.7 h of beaching and spends 2.3 h on the empty legs it costs (22%), against +100% for a hull. So: a hull. `PUNTS`/`PUNT_BERTHS`, `punt` still a name for hull A. `puntFits` returns an OFFER `{P, night, stand}`; `puntTripH(P, a, stand)` is SOLVED from the berth, not tabulated (hull A's night walk comes back 2.66, the old constant). Stands are a POOL of four on the island's spine, nearest FREE one to the hull's shore, so hull A alone is unchanged. `PUNT_LAMPS` beside `BOAT_LAMP`/`BARGE_LAMP`.
**Gates:** census PASS, tiles+structure unchanged · motion FAIL on `cart` alone, pre-existing (`probes/cart-jump.mjs`: the same 2.60-cell lane run 6× in every one of 8 seeds on HEAD *and* candidate, median 0) · filmstrip day+night 0 POP · `punt-force.mjs` PASS day and `--late`. **context-budget OVER, 48.3 of 46 KB: inventory 9.7/9.5.**
**HEAD → cand** (10 seeds × 26 days, genuine offers): BUSY **13.9% → 1.9%**, no longer top · take **27.1% → 38.4%** · crossings/day **0.44 → 0.64** · 166 claims / 166 completed, 0 strandings, 162 stood. Lantern at 22h: HEAD rgb(43,40,43), R−B **0**; cand rgb(227,204,157), **R−B 70**; water control rgb(20,32,59) on both.
**Verdict:** shipped
**Surprise:** the premise was an artifact of the bug the second hull exposed. `puntFits` is asked wherever a stop is PERFORMED, and the rider's stand on the eyot is a stop — so every rider re-asked from the island. One hull was its own guard (leg 3 is not leg 0) and refused it silently: **115 of HEAD's 174 BUSY refusals are one per crossing, by someone already across**; genuine BUSY was 13.9% and never the top refusal. With two hulls the free boat re-claimed a passenger standing on an island: 51 of 178 claims stopped completing. Then the channel — col 126 is the ONLY water between eyot and towpath and a hull is 0.52 across, so a landing further down it ran every crossing through the other hull's berth (505 of 6139 co-present samples under 0.9, least 0.04). Offsetting B's landing west by the same 0.95 as its berth makes the lanes parallel: swept end to end, least separation 0.95, 0 violations.
**Law:** a one-shot choice guarded only by the state it CONSUMES is re-entrant the moment that state is duplicated — end the membership positively at the claim, never by trusting the resource to refuse.
**Law:** two movers on a track share a CORRIDOR, not a point: sweep their whole paths against each other, and offset BOTH ends equally so the lanes are parallel by construction.

## Iteration 149 — two gates that lied, and one of them now binds the worker (2026-09-03) [The sill & the observer × Harness]

**Brief:** b149 — bound what ONE iteration ADDS; fix or retire `probes/punt.mjs`.
**Budget.** `--additions` diffs the tree against a ref (`--since`, default HEAD) over the three surfaces a worker writes and every open re-reads: entries, inventory lines, cues. Quota: 1 entry ≤ 1.8 KB, ≤ 1 inventory line, ≤ 1 cue, 250 B each; exit 3, **naming** the offender.
**Punt (c227).** Both stranding tests had stopped being faults. `punt.leg === 0` assumed ONE hull; #141's second leaves A moored while B carries. `!eastOpen()` is the case #131 BUILT — `eastOpenFor()` covers a rider to `a.puntBack`. Replaced by two questions no punt predicate can satisfy: ORPHAN (`a.eyot`, no hull holds them) and OVERDUE (`a.eyot` at `EVE_GONE`). Exits 1 now; also wrapped a trip length that read negative past midnight.
**Gates:** `courtyard.html` **byte-identical** — census unchanged in all six blocks, shots clean; no draw. `--additions` 0/exit 0 on HEAD; staged over-quota state + a 2.35 KB entry → 6 named failures/exit 3. `punt.mjs` HEAD 0/exit 0; `--strand` (hull freed at leg 3) 2475 ORPHAN/exit 1; `--strand-late` (held at leg 3) 14 OVERDUE at 02:54/exit 1.
**Surprise:** `state.inventory` holds a `note` **string** beside its nine domain arrays — iterated as a list it yields one "line" per CHARACTER. Only the falsification found it; HEAD was a clean, plausible zero.
**Law:** a gate is a claim about a BUILD. Both punt tests were RIGHT when written and were invalidated by a later feature that never re-ran them — so a change redefining a gate's subject must re-run every gate that READS it, not only the one briefed.
**Note:** total OVER, 49.7/46 KB (+506 B of it mine, SKILL.md). The manager's.
## Iteration 142 — the clock stops being the loudest voice in the room (2026-09-03) [The sill & the observer × Connect]

**Brief:** b142 — price the strike against everything else in the queue. Full entry in LEDGER-archive.md.
**Did.** `background(rank, txt, then, until)` names the third rank the ticker always had. A MURMUR may never take a surface anyone holds *or is waiting for*; the CLOCK may also wait for a busy one, but only into an EMPTY queue, so "the clock never displaces the town's own news" is true by construction. `announce()` gained `until`: when a line stops being TRUE, as against `TICK_STALE`, how long anyone will WAIT for it. `CLOCK_SAID = [0, 9, 12, 18]` is the remark's cadence.
**Gates:** census unchanged, all six groups (no `R()` spent) · motion PASS · visual PASS · perf skipped.
**HEAD → cand** (`probes/ticker-price.mjs`, 6 days × 3 seeds, classed where each line is BORN). Courtyard: strike **46% → 20%**, the town's own places **118 → 164 lines (+39%)**. Wide: strike 30% → 8%, placed 53% → **71%**, all four remarked hours sound. Lateness ≥1 h: **23% → 0%**.
**Verdict:** shipped
**Surprise:** the queue price alone cannot reach this. At a quarter **there is nothing in the queue to price against** — `inView` withheld the competition; and pure drop-if-busy made the clock a function of how busy the *day* was (0 of 18 seed-days at six, nine, three and six again). A 55 s day holds ~22 lines: eight strikes was a third of everything the town can say.

## Iteration 143 — the evening's warm wash rides the sun, as the morning already did (2026-09-03) [Sky, light & weather × Connect]

**Brief:** b143 — `applyLight`'s dusk was `clamp(1 - |hour - 19|/1.8)`, a hard-coded hour in a light; #112 fixed the morning onto `sunUp` and left the evening. Full entry in LEDGER-archive.md.
**Did.** One line: `DUSK_OFF = -1.0`, peak at `sunDown + DUSK_OFF`, which at SEASON_START is **19.00 exactly**, so the anchor day is provably the old evening. Half-width unchanged at 1.8 and deliberately unscaled. **No hard-coded hour is left in any light term.**
**Gates:** census PASS, six groups unchanged (no `R()` spent) · motion PASS · visual PASS · filmstrip **0 POP** at a midwinter evening (t=1069) and a midsummer one (t=360) · perf skipped.
**HEAD → cand.** `probes/dusk-year.mjs`, eight offsets from sunset over the year: HEAD's spread **0.72–1.00 at every k**, candidate's **0.000 at all eight**. `probes/dusk-frame.mjs`, R−B above `sillTop()`: midsummer sunset−1 **−0.47 → +19.39**, midwinter's peak holding at +27.07 — the peak is the *same*, it now happens on every evening instead of one.
**Verdict:** shipped
**Surprise:** the town's other dusk already knew. `skyCols` has ridden `sunDown - 0.6` since #11, so `applyLight`'s note reading "at dusk this wash and the sky's own peak nearly two hours apart" was never a taste observation — it was **this bug, measured and written down and left**. #112 read that sentence, used it to justify damping the morning to 0.55, and did not notice it was a symptom of the half it was leaving alone.

## Iteration 144 — the east gets a share of the lane's roll, and the plaza gets a third place (2026-09-03) [Lane & market × Connect]

**Brief:** b144 — re-weight the lane roll so raising `laneCap` REACHES the east; reserve the fountain stand and re-sweep `FAM_CAP`. Full entry in LEDGER-archive.md.
**Did.** Re-measured the premise on HEAD first (6 seeds × 14 days): cap 10 → 16 buys the lane +3.05 and the east +0.17 plaza, **−0.28 quay, −0.12 far bank**. So `eastEdges(cap)`: the four east bands scale by `eastPull(cap)`, 1.0 below `EAST_CAP0` 6 and 2.0 at `EAST_CAP1` 14, the width from the PLAIN passer-by alone — keyed on the CAP, not on fill, since an east trip holds its `lane` slot for its whole ~40 s. `FOUNT_STANDS`: three stands on the roundel's inner ring, one party each (`a.fstand`).
**Gates:** census PASS, structure unchanged, baseline **re-pinned** · motion PASS · visual PASS · filmstrip 1 POP at seed 42 = **rain onset**, uniform across a block map and HEAD rains through it · `probes/fount-stands.mjs` 10/10.
**HEAD → shipped**, laneCap 10 → 16: plaza **+0.17 → +1.02**, quay −0.28 → +0.08, far bank −0.12 → +0.11; east half **9.73 → 10.96**, the lane holding. Plaza crowded pairs PER PERSON **0.237 → 0.153**.
**Verdict:** shipped
**Surprise:** the family half was right about the crowding and wrong about the cap. Reserving the stand does what the brief predicted (0.145–0.159 crowded pairs per person across `FAM_CAP` 3, 4, 5 and 7, against HEAD's 0.282 at 5). But the higher cap buys nobody: **5 and 7 return byte-identical numbers and bind 0.0%**. Past 4 the bound was never the places — it is `FAM_RATE` and the 9.5–17 window, which the source comment had guessed and nobody had tested. Kept the knee, `FAM_CAP` 3 → 4.

## Iteration 145 — the town gets into its river (2026-09-03) [River & far bank × Deepen]

**Brief:** b145 — the water held the moon and one baked bank-smear; put the standing things IN it. Full entry in LEDGER-archive.md.
**Did.** One SIGN in `project()` — `MIRROR`, folded into `LIFTM = LIFT * MIRROR`. A negative z is the mirror, so **each caster's reflection is the caster's own draw** and nothing can drift out of register. `drawWaterMirror` runs five casters (bridge, footbridge, wheel, jetty, willow) into an offscreen at `setMirror(-1)`, fades each from its own waterline, chops the rest into bars on `FLOW_SPEED`/`windT`, punches the eyot, composites once under a water clip. Six `MIRROR > 0` guards stand down what is drawn ON the water: four shadows, the foam, the boat under the deck, the willow's `crowns` push.
**Premise half-wrong:** the clock tower is at **x 63.8-66.2**, the church at **x 131-136**; an image runs *southward* out of its caster's feet, so both fall on dry land.
**Gates:** census PASS, motion PASS, 0 POP day and night; `frame-diff.mjs` 0.362% moved, all the river column, courtyard/lane/mobile **byte-identical**; worst cost **+0.57 ms** (Plaza, windy).
**HEAD -> cand.** `road-surface.mjs`: FRAME **WATER sd/mean 0.1737 -> 0.1772**, every other class 0.0%, **CACHE unchanged**. `refl-band.py`: hf/mean 0.065 calm -> 0.218 windy; the bridge's band moves **0.000 a frame calm, 1.4-2.0 windy**.
**Verdict:** shipped
**Surprise:** the pass is not its draws - they total **0.118 ms**, the other 0.41 is compositing, and both obvious savings made it worse (offscreen water clip 0.689, full-canvas `destination-in` **1.48**).
**Law:** a cast image's TARGET SET is southward at this camera, and a caster's own draw is its image - put the sign in `project()`, and make every draw landing ON the plane read it.

## Iteration 146 — the two towers cast from their own height (2026-09-03) [Roofs & skyline × Deepen]

**Brief:** b146 — `shTop[]` is filled from the eave, and the tallest drawn things in town are not eaves. Give each tower its real height.
**Priced first, as asked, and the price is the finding.** `-S/S[2]` says a throw is long at a low sun; it does not say there is anywhere for it to GO. `sunVec()`'s `S[1]` is 0.32..0.58 at every hour of every season, so the throw is **always northward** — and both towers stand at the world's north edge (clock rows 1–2, church rows 4–7). A ray leaves the world at ~2 cells of height above the clock tower and ~5–22 above the church. Height past that is thrown into nothing.
**Did.** `CT` hoisted beside `CHURCH` (it was declared 5,600 lines below the grid that now needs it) and `CHURCH` given `tBase/tTop/tRise`, so `drawChurchTower`/`drawClockTower`/`VANES` read one definition instead of four literals. `SH_TOWERS` + `towerShTop()` beside `buildShadowGrid`: `shTop[i] = max(roofTopAt, towerShTop)`. Not an `eaveBand` branch — a tower is a thing standing ON a block, not the block's height. A spire is a CONE, so the height a cell casts from tapers on `1 − max(dx/hx, dy/hy)` from the cell's NEAREST point to the axis: only the axis column reaches 23.1, its flanks 18.7.
**Gates:** census PASS, unchanged · motion PASS · filmstrip day 0 POP · `frame-cost.mjs` summer 4.96→4.96 ms, winter 5.11→5.14, interleaved · wide/courtyard/east/lane clean · `shOpen[]` provably unmoved (rows north of both towers were already vetoed at the old height, so the northward veto could not regress).
**HEAD → cand** (`probes/tower-reach.mjs`, the tower's OWN mask contribution, held out against a mask built without its cells): midsummer 7 h reach **7.35 → 13.85 cells**, 36 → 100 sub-cells; equinox 7 h 10.85 → 14.6, 15 → 30; midwinter **0 → 0**. `shade-diff.mjs` t=387.3: **1,328 px** changed against a same-code control of **462** (2.9×), 96.6% open ground, p0.1 luma 33→33.
**Verdict:** shipped — but the brief's bar is unreachable and that is the finding.
**Surprise:** the clock tower gains **nothing, at any hour, in any season** — 0 novel sub-cells at both equinoxes and midwinter, ≤14 at midsummer. Its old 7.2 already saturated the two rows of world in front of it. And the church's win is not "across the far bank's green" but out onto the WATER: the spire's tip crosses the towpath at x 127 and lies on the river, and only in the warm half's morning — at midwinter the sun is steep enough (`uy` −1.27) that the whole throw is off the north edge by 5 cells of height.
**Law:** a caster's value is bounded by the OPEN WORLD downwind of it, not by its height — price the reachable GROUND before raising a caster, because `-S/S[2]` prices the ray and says nothing about where it lands.



## Iteration 154 — the punt's wind stops being a bar, and the swans give way to a track (2026-09-03) [River & far bank × Deepen]

**Brief:** b154 — instrument `puntFits` clause by clause, sweep the wind threshold, and make the give-way clear the whole track.
**Priced first, and the sweep is the finding.** WIND *is* the top refusal (136 of 446 offers, **30.5%**). But the threshold is a DEAD constant: `windTarget()` is `max(windyDay()?1:0, frontWind())`, so windF at an offer is **0 on 257 and exactly 1.0 on 134**, and **115 of the 136 refusals sit at a full wind**. Every bar in 0.5..0.999 buys ≤15 crossings of 446 (+3.4%). The threshold was never the price; the SHAPE was.
**Did.** So the bar stops being one. `PUNT_WIND_SLOW` 0.45 makes the wind a COST — `puntSpeed()` is what `puntTripH` prices *and* `updateOnePunt` spends, so a windy evening trip is refused by its own clock. `PUNT_WIND_SHY` 0.65 makes it a SHARE, cut at a quantile of `puntNerve(a)`. `a.wary` will not serve as that coordinate: overDeck cuts at `wary < DECK_SHARE` so its standers are the bold fifth, while the far bank's jetty kind takes the whole range — one hash decorrelates both to [0,1). No new `R()` draw. `puntGiveWay`/`segNear`: the given-way thing is the segment moor→land while a hull is off its mooring, so #96's landing rule is now one END of it — one rule where there were two.
**Gates:** census FAIL `people −10%` **replayed and dismissed** — on the gate's own ladder HEAD's 9-cell total spans **372..422 = 13% on identical code**, and over 8 seeds HEAD 1080 → 1117 (+3.4%) · motion PASS, 0 jumps · filmstrip **0 POP** day and night · shots clean · `punt.mjs` exit 0, `--strand` 5086 ORPHAN and `--strand-late` 72 OVERDUE both exit 1.
**HEAD → cand.** `punt-track.mjs` (new, 74k swan × hull-under-way samples): HEAD least **1.033**, 16 samples inside 1.2, every one on hull1 legs 2/4 — **exit 1**; candidate least **1.200000**, 0 inside, exit 0. Windy days over two disjoint 10-seed sets: take **24.7% → 32.1%**, same crossings from 20% fewer callers.
**Verdict:** shipped — the brief's "crossings per windy DAY rise" is missed, and that is the surprise.
**Surprise:** the supply fell, and it is not the punt's doing. Offers/day 1.65 → 1.35 in **both** seed sets, which looked causal until the control: `spawnEastAgent()` fires **1787 → 1784** and the east cap binds **0.0% on both builds**. Nobody is being crowded out — the reshuffle simply lands the `wary < DECK_SHARE` coin and the far-kind roll differently, 211→176 and 235→179. A per-day rate cannot see the change; the take rate can.
## Iteration 147 — the allotments are monoculture, and the brief's bug does not exist (2026-09-03) [Cross street & allotments × Deepen]

**Brief:** b147 — make `plotCrop()` answer for the PLOT, not its first sown cell. Full entry in LEDGER-archive.md.
**Priced the premise first, and it is false.** A year × 3 seeds (`probes/allot-year.mjs`, 69,008 sown plot-samples): **0** held two species (species/plot **1.000**), so the first cell WAS the majority, and **0** had a hardy cell under a tender majority. In deep winter tender cells in the open reach stage 3 **0 times**, against hardy 21,474 and glass 10,191: `successLooksLike` already holds on HEAD, exactly. Monoculture because caTick's infill sows a bare cell with `plotCrop()` itself, `harvestPlot()` lifts the row whole, and the kneel plants nothing.
**The premise's source:** `plotClimbs()`'s comment claimed the first-cell read missed "a fifth of the plots that actually had beans". Re-counted, they agree **13,012 of 13,012**.
**Did.** Killed the false claim; wrote the measured invariant at `plotCrop()` — the three conditions holding it, and the successor read for the day one goes.
**Gates:** census **byte-identical** · visual PASS · motion/perf skipped: no draw, no `R()`.
**Verdict:** briefRejected — source corrected, feature not built.
**Surprise:** the hand-sow branch is dead. 101 allot kneels a year = 71 harvests + 15 turns + 15 hand-sows, and the hand-sows plant **0 cells** — a kneel only reaches an UNRIPE plot, and by then the infill has filled it. A holder comes in through the gate, kneels, plants nothing, says nothing, walks out.

## Iteration 148 — the plaza's families are priced at both ends of a window the sun cuts (2026-09-03) [Plaza & quay × Scale/World]

**Brief:** b148 — price presence as rate × visit, then sweep and keep the knee. Full entry in LEDGER-archive.md.
**Priced first.** Five places at **7.7–12.6 h** apiece against a **7.5 h** window: no whole visit fit, "too late" ate **61.3%** of calls (cap 9.8%, places 2.6%), and half a family's day is walking.
**Did.** `famWalk()` — one definition of the two legs, called by the roll's bounds and the set-out test alike. `famWin()` — `FAM_H0`/`FAM_H1` are the hours the plaza HOLDS families, first ARRIVED to last GONE, cut to the sun. The fit is a FILTER on free places, not a veto after the draw; the dwell clips to the room left against `FAM_DWELL_MIN`. `freeBench()`/`a.pbench` beside `freeStand()`/`a.fstand`, both nulled in `makeCompanion`.
**Gates:** census FAIL `people −10%` and motion FAIL `cart 0→1` both **replayed and dismissed** — 9 seeds put the census gap entirely in 4 raining cells (DRY 1084→1089, re-pinned), and HEAD carries the identical `cart85 moved 2.60` at seed 7. Filmstrip 0 POP, shots clean.
**Shipped** (6 seeds × 14 days): **held 1.83 → 2.70 of 5**; bench1 26.1→60.5%, stand2 22.4→55.6%. Arrivals/day 2.46→4.05, cap binds 11.3→47.7%, plaza 5.88→8.59.
**Verdict:** shipped — the crowding bar is MISSED and that is the finding.
**Surprise:** the crowding is not the families'. Pairs per person went 0.153→0.167, outside the band — but PER FAMILY they fell, 0.204→0.192, and with the family source off the plaza reads 0.114 on HEAD and 0.097 here. By kind, the plaza's commonest crowded pair is **`parent+plaza`, 27%, on BOTH builds**: #144 put its stands on the roundel's SOUTH arc and everything approaches from the south. The 90° stand is at (105.5, 33.5), the lane's plaza corridor `ex2` is 104–106 running due north through it, and a family's route to the far bench passes **0.4 cells** from it. Occupancy did not create the fault; it made the town walk through it more often.


## Iteration 156 — the wind gets a strength, and its consumers finally have a middle (2026-09-03) [Sky, light & weather × Deepen]

**Brief:** b156 — windF was a coin (88% of samples at the two ends); give the day a real strength, then re-price the consumers.
**Did.** Two hash-only draws replace the coin's magnitude, so no `R()` and the seeded calendar keeps its column. `windDayF()` — HOW MUCH: `windyDay()` still picks which distribution (its 0.28 share untouched), the draw picks the strength — BLOW_LO 0.45..1 against STILL_LO 0.04..STILL_HI 0.30, non-overlapping, both skewed low by `h**1.6`. `windHourF()` — WHEN: one cosine on the SUN's hour, peak at `sunUp + 0.65*dayHours`, trough pre-dawn, continuous across the hour-6 roll. `isWindy`'s bar moved 0.5 -> WIND_BEHAVE **0.40**, which now sits BETWEEN the two ranges, so it is a statement about the day and not a coin on its hour. `windSign`'s latch was `wind <= 0.1` — the wind at rest, which no longer happens, so it would have latched once per world; it now asks about the SPELL, which is what it always meant.
**Consumers, each measured AT ITS OWN CALL** (`probe-wind-consumers`, 6 seeds x 26 d). Three sites — `bonfireWeather`, `EVE_WIND`, the washing's name — spelled `windF() < 0.5` by hand, which over a 0/1 input *was* `isWindy()`. All three routed back through it; the washing, which is a thing you SEE and not a behaviour, got a third rung on the town's own bands instead (fires on 3.4% of washing-hours — thin, and counted). `murmWx`'s 0.12-wide ramp was a step wearing a ramp's clothes: widened to WIND_STILL_HI..0.70, and a partial wx now takes BIRDS and loosens the cloud instead of making a starling translucent.
**Gates:** census PASS, tiles unchanged · shots clean · filmstrip day **0 POP**, dusk **0 POP** · motion FAIL `day/cart 0->1` **replayed and dismissed** — HEAD carries the identical `cart… moved 2.60 (median 0.000)` at t=340 (both seeds) and t=610.
**HEAD -> cand.** windF at the two end bins **86.9% -> 41.0%** (4 seeds x 26 d, target <=60%). The four intensity ramps go **15.9% -> 90.6% partial**. Murmuration at a pinned in-season dusk: at windF 0.10 **130 birds, identical to HEAD**; at 0.45/0.55/0.65 HEAD paints all 130 at fading alpha, cand paints **98/77/56**; at 0.80 both empty. Wind DELETED the flock on 47.4% of its dusks, now 29.8%. `probe-wind-diff` at a pinned instant, same-code control **0 px**: windF 0.40 -> 0.90 moves **12,555 px** — reeds, streaks, washing, vanes.
**Verdict:** shipped
**Surprise:** the four intensity ramps were **not** mis-tuned, and the brief predicted they would be. Their means moved by under 0.003 (boatRate 0.827 -> 0.829, puntWindOK 0.225 -> 0.223) while the share strictly inside (0,1) went 15.9% -> 90.6%. They were always tuned right — they had simply never once been asked a question with an answer in the middle. What actually drifted was the opposite: the bonfire, whose hand-spelled bar is read at a calm hour, is now offered a match on **58.4% of its hours against 40.2%**, because the wind has a pre-dawn trough and a coin does not.
**Law:** a bar spelled with a MAGIC NUMBER over a bimodal input is a silent COPY of the predicate that names it — the moment the input grows a middle, every copy becomes a coin on whatever hour its own consumer happens to ask at, and they drift apart. Grep the constant, not the predicate.
**Cue:** `bonfireWeather()` is asked only in the two-hour window the heap is offered a match; nothing re-asks it, so a fire lit in a calm dawn burns on through an afternoon gale that `isWindy()` would refuse.
## Iteration 149 — two gates that lied, and one of them now binds the worker (2026-09-03) [The sill & the observer × Harness]

**Brief:** b149 — bound what ONE iteration ADDS; fix or retire `probes/punt.mjs`. Full entry in LEDGER-archive.md.
**Budget.** `--additions` diffs the tree against a ref (`--since`, default HEAD) over the three surfaces a worker writes and every open re-reads: entries, inventory lines, cues. Quota: 1 entry ≤ 1.8 KB, ≤ 1 inventory line, ≤ 1 cue, 250 B each; exit 3, **naming** the offender.
**Punt (c227).** Both stranding tests had stopped being faults. `punt.leg === 0` assumed ONE hull; #141's second leaves A moored while B carries. `!eastOpen()` is the case #131 BUILT. Replaced by two questions no punt predicate can satisfy: ORPHAN (`a.eyot`, no hull holds them) and OVERDUE (`a.eyot` at `EVE_GONE`). Exits 1 now; also wrapped a trip length that read negative past midnight.
**Gates:** `courtyard.html` **byte-identical** — census unchanged in all six blocks, shots clean. `--additions` 0/exit 0 on HEAD; staged over-quota state + a 2.35 KB entry → 6 named failures/exit 3. `punt.mjs` HEAD 0/exit 0; `--strand` 2475 ORPHAN/exit 1; `--strand-late` 14 OVERDUE at 02:54/exit 1.
**Surprise:** `state.inventory` holds a `note` **string** beside its nine domain arrays — iterated as a list it yields one "line" per CHARACTER. Only the falsification found it; HEAD was a clean, plausible zero.
**Note:** `run-loop.sh` never calls `--additions`, so the quota binds only if the worker obeys SKILL.md (open cue).

## Iteration 150 — the distance gets six rungs, and the far town lights (2026-09-03) [Sky, light & weather × Scale/World]

**Brief:** b150 — the distance was ONE band, ONE base, ONE colour; give it depth.
**Did.** `FAR_BANDS`: four ranks, each with its own roofline range, house rhythm, tower scale, chimney share and haze. **Each band's foot is the next-nearer band's HIGHEST roofline**, so a farther rank can only appear ABOVE a nearer one: no floating feet, no gap, nothing below the old base. Rank 3 IS HEAD's — base, rhythm, hash addresses — plus chimneys and glass. A palest second ridge behind the hills, HEAD's lifted clear of the ranks. `farWindowLit` is `windowLit`'s shape on `nightAt()`: no HOMES, no risers, one clock for both towns.
**Gates:** census **unchanged, all six blocks** (no `R()`; it cannot see depth beyond the grid, as briefed) · motion PASS · filmstrip 0 POP day and night · perf +0%.
**Measured** (`probes/far-depth.mjs`). Rungs in the layer: HEAD **2** → **6** (L186 to L142, even steps), all six visible on screen. Strip mass against a **same-code control of 0.000%**: 7.11% desktop, 4.87% phone; below the foot **0 px differ**, 5 instants × 2 sizes. Night: rows hz−2/−1 go 0 → 31/74 warm px, the furthest rank dark, lit count 147→474→171.
**Verdict:** shipped
**Surprise:** HEAD's 80 "lit dots" were never lights. Painted into the cache, they meet the multiply last: 242 px in the layer, 61 in the frame, and the warm-pixel count above the roofline is **identical with them present and removed**. Dead since the layer was written.

## Iteration 151 — our own terrace throws a real shadow across the lane (2026-09-03) [Roofs & skyline × Connect]

**Brief:** b151 — the lane took 0.0% building shadow: `eaveFor()` zeroes our block for a DRAWING reason, and `shTop` believed it.
**Priced.** 27 daylit hours, 4 seasons, HEAD's own march held out: **0 lane sub-cells at every one**. Unlike the towers there is somewhere for it to go: shOpen is open over the whole lane, 1,122 ROAD + 791 SIDE cells.
**Did.** `shCast[]` beside `shTop[]`: the DRAWN height stays in the occlusion walk, the CAST one goes to the march, now `y < WH`. `NEAR_EAVE = eaveBand(0, LN_WALK_S)` = **5.6**, the gatehouse row's own band and so the far side of this same lane, its built `eaveM` mean **5.596**. Cast height is our emergent roof lifted bodily onto it, so ridge, hips and valleys stay the distance transform's.
**Gates:** census PASS, six groups unchanged (no `R()`) · motion PASS, identical · filmstrip day 0 POP · `frame-cost.mjs` x3 interleaved: +0.03 summer, +0.06 winter ms.
**HEAD → cand** (`probes/lane-shade.mjs`, new): **shOpen byte-identical**, the mask north of the lane too, over 12 instants. Lane SIDE **0 → 952-1,482** sub-cells at every hour of the year; ROAD 0 → 472-982 at a low sun, **0 at a summer noon**, the edge sliding 77→74 with the season. `shade-diff.mjs` t=1068: **43,004 px** on a same-code floor of 507, and its `behindAVolume` 22 / `ROOF/WALL` 16 *are* the floor's, so nothing lands on a roof.
**Verdict:** shipped
**Surprise:** the terrace's own GAPS came free. Rows 73-78 fill to 85-92%, never 100: the missing ~60 sub-cells are exactly the river's 15-cell gap in the block, a slot of sunlight where the terrace isn't.

## Iteration 152 — the kneel at an unripe plot now does something (2026-09-03) [People & animals × Deepen]

**Brief:** b152 — one arrival performs nothing: a hand-sow kneel plants 0 cells. Re-count on HEAD first.
**Re-counted** (`allot-kneel.mjs`, new: an instrumented COPY of the build). Year × 6 seeds: 110 allotment kneels — 73 harvest, 23 turn, **22 hand-sow planting 0**. Premise holds; the reason does not — the plots are not full, they are FALLOW (3.95 of 6 cells bare). It is `x >= N` in the sow loop: `N = 64` is the courtyard block, the allotments are x 80–93. **0 eligible cells at 22 of 22.** Deleted `plotCrop()`'s sentence saying otherwise.
**Did.** `plotAct(a)`, five rungs PARTITIONING the plot's six cells — a cover, not a guess (sow/water/thin/tend/rake, in the inventory). A ticker line each; `a.act` names it under the pointer. Spends **exactly the one `R()` draw** the branch it replaces spent.
**Gates:** census PASS but churning (an act moves caTick's draws) · filmstrip 0 POP · visual PASS · motion FAIL `dusk/cart 0→2`, **replayed on HEAD**: identical exit trot, HEAD's cart jumps at t=1083 — a phase shift.
**HEAD → cand.** Kneels performing nothing **22/22 → 0/33**, all five rungs firing. `allot-act-rungs.mjs` forces every rung + the documented fall-through, 9/9. Same-code pixel control **0**, a sown drill 24 px. Monoculture intact; harvest +9%.
**Verdict:** shipped
**Surprise:** the bug was a world-width CONSTANT, not the CA. `N = 64` predates the allotments: a loop written for the courtyard, inherited by a block past its bound. Two passes explained the zero with the simulation, not the loop's first line.

## Iteration 153 — the memory quota gets a caller (2026-09-03) [The sill & the observer × Harness]

**Brief:** b153 — `--additions` existed from #149 and `run-loop.sh` never called it. Wire it; report, never revert.
**Did.** A step 4 in the runner: `context-budget.mjs --additions --since "$PRE_SHA"`, its `✗` lines logged, then `runlog.mjs --quota-out/--quota-rc` folds them into the iteration's own row as `quota {rc, over[]}` and marks the console line. `verdictOf` does not read the field: a breach is priced by the manager, not by a runner throwing away gate-passed work over a 260 B cue.
**The baseline is not `HEAD~1`.** That is the right ref only when an iteration made exactly ONE commit, and `runlog.mjs`'s preBlob fallback exists because they do not. The runner takes `PRE_SHA` beside `PRE_BLOB` at the pop, so the diff is against the commit the worker started from — and one who never committed is measured too.
**Gates:** `courtyard.html` byte-identical — census PASS, six groups unchanged; shots clean. `--status` and `DRY_RUN=1` unchanged.
**Proved** (`probes/quota-gate.sh`, new: it extracts step 4 from `run-loop.sh` VERBATIM, so deleting the block fails the probe). Clean tree **silent, exit 0**. Staged over-quota tree **exit 3, 6 named offenders across all three surfaces** — 2.50 KB entry, 2 entries, 302 B line, 2 lines, 291 B cue, 2 cues. Merge: the worker's own runlog call writes `quota: null`, the runner's fills it, the row keeps it.
**Verdict:** shipped
**Surprise:** the runner is LIVE while I edit it (pid 29205). Bash re-reads a script by byte offset, but the whole `while :; do … done` is ONE parsed compound command, so the running loop finishes on the OLD text — **this gate does not bind until `run-loop.sh` is restarted.**

## Iteration 154 — the punt's wind is a share, not a bar; the swans give way to a track (2026-09-03) [River & far bank × Deepen]

**Brief:** b154 — sweep `puntFits`' wind threshold; clear the whole track. Full entry in LEDGER-archive.md.
**Priced first.** WIND is the top refusal (30.5% of 446 offers) and a dead constant: windF at an offer is **0 on 257 and exactly 1.0 on 134**, so any bar under 1.0 buys ≤15 crossings.
**Did.** `PUNT_WIND_SLOW` 0.45 makes wind a COST: `puntSpeed()` is what `puntTripH` prices *and* `updateOnePunt` spends, so a windy evening trip is refused by its own clock. `PUNT_WIND_SHY` 0.65 makes it a SHARE, at a quantile of `puntNerve(a)` — one hash of `a.wary`, since wary itself is two populations. `puntGiveWay`/`segNear` clear the segment moor→land: #96's landing is one END of it. No new `R()`.
**Gates:** census FAIL `people −10%` **dismissed on replay** (9 cells span 372..422 on identical code) · motion PASS · 0 POP day and night · `punt.mjs` 0, both `--strand` 1.
**HEAD → cand.** `punt-track.mjs` (new): HEAD least **1.033**, 16 inside 1.2, exit 1; cand **1.200000**, 0, exit 0. Windy days, 20 seeds: take **24.7% → 32.1%**.
**Verdict:** shipped — the per-DAY bar is missed, and that is the surprise.
**Surprise:** the supply fell and the punt did not do it. Offers/day 1.65 → 1.35 in **both** seed sets, which read as causal until the control: `spawnEastAgent()` fires **1787 → 1784** and the east cap binds **0.0% on both**. Nobody is crowded out — the reshuffle lands the `wary < DECK_SHARE` coin differently. A per-day RATE cannot see this change; the take rate can.

## Iteration 155 — the river gets an edge: a REED tile and a rush (2026-09-03) [River & far bank × Scale/World]

**Brief:** b155 — one tile, one species, in the shallows, on the bed CA.
**Did.** `REED` (tile 16) + `rushes` (SPECIES 13, `wild`: nobody sows it, offered 0/11). WHERE is read off the grid, never re-derived — `reedShallow()` is a river cell neighbouring the quay's SIDE, the towpath's SIDE or the eyot: 56 of 85. `reedKeepOut()` takes back everything the river WORKS with, each line naming what it protects; the punt's a SEGMENT (moor→land, both hulls), #154's track being a corridor. `drawReeds` is an ITEM: swans and punts sort against it.
**Zero R().** Placement is `hash()`, stage is `reedStage()` off the year, so caTick's REED branch spends nothing — and **every other census number is byte-identical.**
**Gates:** census PASS, the briefed arithmetic exactly — tileKinds 144→**153**, speciesKinds 108→**117**, REED +504 / WATER −504, planted +504, blooming +453. **`water` did not move and needed no re-pin:** a REED cell is shallow water, so `scalars.water` folds it in. motion PASS · 0 POP · both punt probes 0, at #154's identical 1.200000/0. River crop, same-code control **0 px**: summer **3.76%** Δ49, winter **1.74%** Δ25; wind 0→1, HEAD 691 px against **3424**.
**Verdict:** shipped
**Surprise:** the coarse run-gate that makes a long margin GATHER is a coin on a short one. Right on the 68-cell bank columns it was written for; on the eyot's 17-cell rim it kept **4**, in two lumps — the exact fault it exists to prevent. A ring round an island is already a place, so the rim takes the fine gate only: 16 of 17.
**Law:** a hash gate tuned as a SHARE over a long run is one COIN over a short one — split the population by the scale the gathering happens on before sweeping the constant.

## Iteration 156 — the wind gets a real strength (2026-09-03) [Sky, light & weather × Deepen]

**Brief:** b156 — windF was a coin, 88% at the ends. Full entry in LEDGER-archive.md.
**Did.** Two hash-only draws replace the coin's magnitude, no `R()`: `windDayF()` is HOW MUCH (`windyDay()` picks the distribution — 0.45..1 against 0.04..0.30), `windHourF()` is WHEN (a cosine on the sun's hour). `isWindy` 0.5 -> **0.40**, BETWEEN the ranges; `windSign`'s latch asked about the wind AT REST.
**Consumers, at the call.** `bonfireWeather`, `EVE_WIND` and the washing's name each spelled `windF() < 0.5` by hand, which over a 0/1 input IS `isWindy()`; all routed back through it. `murmWx`'s 0.12-wide ramp was a step in ramp's clothes: widened to 0.30..0.70, and a partial wx takes BIRDS, not opacity.
**Gates:** census PASS · shots clean · day and dusk **0 POP** · motion `day/cart` FAIL dismissed (HEAD hops too).
**HEAD -> cand.** End bins **86.9% -> 41.0%**; the four intensity ramps **15.9% -> 90.6% partial**. At a pinned dusk HEAD paints all 130 birds at fading alpha, cand **98/77/56** at windF .45/.55/.65.
**Verdict:** shipped
**Surprise:** the four intensity ramps were **not** mis-tuned, though the brief said they would be. Their means moved under 0.003 while the share inside (0,1) went 15.9% -> 90.6%: always tuned right, never once asked a question with an answer in the middle. What drifted was the opposite: the bonfire's bar is read at a CALM hour, now passing on **58.4% of hours against 40.2%**.
**Law:** a bar spelled with a MAGIC NUMBER over a bimodal input is a silent COPY of the predicate naming it; give the input a middle and each copy becomes a coin on its consumer's hour.
**Cue:** nothing re-asks `bonfireWeather()` once the heap is lit: a fire started in a calm dawn burns on through an afternoon gale.

## Iteration 157 — the gardener's walk is priced at both ends now (2026-09-03) [Courtyard & garden × Connect]

**Brief:** b157 — `gardenFits()` returns true unconditionally after sunrise; bound that landing as #148 bound the plaza's families. c221's premise re-measured on HEAD: "16 of 186" reads **15 of 193 (7.8%)**. It holds.
**Did.** #148's three pieces: `gardWalk()` the two legs, `gardWin()` the hours the BEDS hold a gardener, `gardNearest()` the cheapest walk to the border there is (once, at unit speed). `gardenFits` drops `lawnFits` and the sunrise branch for ONE anchor, `max(hour + gardNearest()/sp, h0) + GARD_LAND`: before the light clears that IS `lawnStart()`, so the line is #129 unchanged; after it, it bounds the WALK. The close is priced too: a row's floor plus the walk HOME, which the blind `LAWN_MIN_DWELL` never was.
**Gates:** census PASS · shots clean · motion `dusk/cart` 0->2 dismissed (`probes/cart-jump.mjs`: HEAD hops 3.9 cells on all 8 seeds)
**HEAD -> cand**, 12 seeds x a growing season: both-ends **7.8% -> 100%**; walk med **3.22 -> 1.93 h**, max **13.43 -> 2.29**; landing after the border cleared **2.58 -> 0.51 h**. Visits **193 -> 206**: the count did not fall, and kneeling at a bed 6-20 h went **0.356 -> 0.392**, into the morning (8 h 0.40->0.66).
**Verdict:** shipped
**Surprise:** the exemption was eaten by the population it excluded — 108 of the 123 SCHEDULED gardeners took it, not the 70 lottery ones. The lower bound refuses a near door at sunrise-minus-a-tick and the clause admits that walk a tick later, so the gardener bought the wait by WALKING it: 4.07 h at the median.
**Law:** a lower bound on ARRIVAL with no bound on the WALK is a wait a walker can pay by walking — the door bag keeps only the DEAR doors, and "the cheapest door" is the cheapest expensive one.

## Iteration 158 — laneCap HELD at 10; the cap beneath it is the plaza's DOOR (2026-09-03) [Lane & market × Scale/World]

**Brief:** b158 — re-sweep laneCap now #144 widened the east's share of its roll; a cue claimed cap 10 -> 16 buys +1.02 in the plaza.
**Did.** Swept laneCap 10/13/16/20, 7 seeds x 20 d, **paired per seed** (`town-caps.mjs`), then measured the share **at the CHOICE**, which nothing here did: `probes/plaza-door.mjs` (new) counts the roll per east branch in a temp copy. The two source comments carrying the refuted premise now hold the full numbers; the diff is **comments only**.
**Measured.** The cue does not reproduce: plaza +0.14 (t 0.7) at cap 20, **-0.06 at cap 16**, its claimed setting. No knee. Town +6.46 at 20 and the **lane takes 69%**; the east splits the other +1.33. Pairs per person 0.080 -> 0.084 — crowding is not the bound either.
**Why the plaza is deaf.** #144's share works (eastPull 1.61 -> 1.95, bands +65..80% of roll, TAIL flat) — but the plaza is behind a **five-place door**: choices 28.7 -> 48.6, **admissions only 12.4 -> 17.3**, refused 56.7% -> **64.4%**, all leaving by the `else` onto the quay rail. The quay's +0.61 IS the plaza's rejects.
**Gates:** census unchanged all six blocks · visual PASS · motion n/a (no executable line)
**Verdict:** shipped — a measurement, a refutation
**Surprise:** the first sweep ran four settings and printed four identical tables. In zsh an unquoted `$A` does **not** word-split, so `--cap-lane 13` arrived as ONE argv entry, matched nothing, and every run fell back to HEAD. Only the probe printing its own LABEL caught it.
**Law:** A share widened at a destination with a FIXED number of PLACES becomes overflow into its NEIGHBOUR, not presence: measure it at the CHOICE and count ADMISSIONS apart — the refused fraction is the cap.

## Iteration 159 — a plot can hold two crops, and plotCrop reads the majority (2026-09-03) [Cross street & allotments × Deepen]

**Brief:** b159 — a hand inter-crops; `plotCrop()` becomes the MAJORITY read #147 left ready.
**Did.** `plotCrop()` tallies the plot's six BED cells (ties to the lower species index: it feeds names and ceilings and must not flicker). `plotAct()`'s sow rung adds a second drill, capped so the first crop keeps a STRICT majority: `k = min(sow, ceil((held+sow)/2) - 1)`. No new `R()` — the species is a hash of the holder's seeded `wary`.
**Consumers.** `bedCap` SPLIT — `cellStands()` asks the CELL, the ceiling still STEPS by plot: the winter invariant survives a tender drill in a cabbage plot. `plotClimbs` stays per-cell **deliberately**: 92 samples now put beans up canes on a plot mostly under something else. `harvestPlot` paid PER CELL. `plotName` names the second crop.
**Gates:** census PASS (six blocks unchanged) · motion PASS · day 0 POP · `allot-act-rungs.mjs` **10/10** after re-writing its two SOW cases — my change moved that gate's subject.
**HEAD -> cand** (`probes/allot-intercrop.mjs`, new; 6 seeds x a year). Mixed plot-samples **0 -> 264 (0.19%)**, species/plot **1.0000 -> 1.0019**, 7 episodes averaging 37.7 s. Invariants identical: tomato outside the span 0, tender at stage 3 in deep winter **30 on both**.
**Verdict:** shipped
**Surprise:** the invariant I was told not to break already read non-zero — 30 tender samples at stage 3 in deep winter, and HEAD does it too. The brief's 0 was three seeds; three more found it.
**Law:** a share fitted on five samples is not a share. `INTER_SHARE` over the room bound, swept 0.40/0.70/1.00: 0.70 and 1.00 byte-identical. Deleted — the SUPPLY (11 sow-rung acts a year over six worlds) was always the cap.

## Iteration 160 — the plaza's door opens from five places to fourteen (2026-09-03) [Plaza & quay × Scale/World]

**Brief:** b160 — the plaza refuses 59% of its arrivals (#158). Open the door, spread it, give it more to do.
**Did.** `PLAZA_PLACES`: ONE table, ONE claim (`a.pheld`), three callers. 6 ring stands (60° apart, none in the mouth's columns), 6 benches (one per plaza tree, y 18 to 48), 2 `crumbs` places — a third act. `plazaWay()`/`plazaMouth()` make the approach a 3.9-cell corridor round the basin instead of a point. The lane's band alone takes a SECOND act (`a.stop2`). The **east branch reserved nothing before this**: it sat on claimed benches and stood in the strip #144 ruled was not a place.
**Gates:** census · perf · visual · 0 POP PASS · motion PASS (the first run's `day/cart 0→2` **replayed on HEAD**: max 3.9 on both) · `plaza-geom.mjs` (new): 14/14 on PATH, **366 route legs clear of the basin**.
**HEAD → cand.** Refused **59.1% → 0.0%**, admitted 3.86 → 8.71 (`plaza-door`). Plaza presence **8.55 → 10.43**, quay 2.26 → 2.11 (it did not pay), crowded pairs **0.178 → 0.117 per person** (`town-caps`). Visits 233 → 351, places used 5/5 → **14/14**, y sd of a stopped visitor **3.64 → 8.69** (`plaza-visit`, new).
**Verdict:** shipped
**Surprise:** the crumbs shipped DEAD and only the probe caught it. A pigeon flies up when any agent comes within 4.5 cells, so the one act whose point is a bird coming to you could never have one: 0.00 within 3 cells of a feeder — 0.0000 on HEAD too, the control that made it a fact. Excepting the crumbs from the scare took it to **0.95, against 0.01 elsewhere on the same build**.
**Law:** an act whose payoff is another population's BEHAVIOUR is bounded by that population's avoidance rule, not by the act — instrument the payoff.

## Iteration 161 — the morning lapse lands on a town, not on three figures (2026-09-03) [People & animals × Deepen]

**Brief:** b161 — give the morning lapse a population; COUNT IT ON HEAD FIRST.
**Counted** (`probes/lapse-pop.mjs`, new: presence at BOTH clock-button targets, 5 seeds x a year). sunUp+0.5 holds **mean 28.3 people, med 29, min 6, max 47** in **11.6 kinds of errand**, against the evening's 41.1 / 14.2; **125 of 125 mornings hold six or more**. The three the premise named are 2.4 of the 28.3 (sweeper 1.14, round 0.88, cart 0.40). Refuted; nothing built.
**Deleted the sentence that made it** — `courtyard.html:5844`, "with the sweeper, the cart and nobody else" — and the same claim in `state.watch[0]`; both now carry the count and name the probe.
**Suspected the instrument** (`probes/town-hourly.mjs`, new). Not a residue: median age at the sample is 15.7 sim h against a **26 h** world crossing (138 cells at ~5.2/h), and the 03.00 count saturates day over day instead of climbing. Control: an UNPAUSED, DRAWN 8x run reads 21-29 where the warped one reads 17-33.
**Gates:** census PASS, six groups unchanged · visual PASS (`probes/lapse-shots.mjs`, new: both targets, 2 seeds, 2 seasons) · motion skipped, nothing that moves was touched.
**Verdict:** no-ship (measurement)
**Surprise:** the premise was true when written — #98 described the town of #98, and sixty iterations of population made it false without touching that code.
**Law:** a claim of SCARCITY is dated the day it is made, priced against the town of its own iteration and rotting as the town grows, where a structural claim does not. Re-count every "nobody else", and treat `watch` as a brief generator with more force than a comment.
**Cue:** the honest gap at dawn is composition, not count.

## Iteration 162 — a third skyline tier, placed on the strip's own height (2026-09-03) [Roofs & skyline × Deepen]

**Brief:** b162 — re-price #150's two UNVERIFIED claims about the band above the roofline.
**Re-priced** (`probes/far-depth.mjs`, new: same-build renders with tiers/ranks/clouds switched off in turn). Claim 1 HOLDS and understates itself — the silhouette is a median 5.6 cellH at EVERY size, and the strip is not 9.6 cellH: `topPad` swallows the window's SPARE, so it runs 12.3 cellH at 1200x700 to 52.2 at 390x844; the shortest of all is a big SQUARE window, 7.75. Wide: **78.5% bare gradient**. Claim 2's arithmetic holds (0.70 is under band 0's lowest roof, 1.60; rank 0 crossed in 26.2% of its columns) — its CONSEQUENCE does not: the ranks draw OVER the hills, so the only defect is a roof against open SKY, 3.1%.
**Did.** Three tiers on `strip = hz/cellH`, `ex`/`sc` shallowing a short strip, not clipping it. The range is furthest and palest, the only tier with a `1 - |sin|` term: cusps make a summit read. The far ridge's min, 4.9 cellH, now clears every rank's ROOFLINE at every framing. Clouds moved to draw AFTER the backdrop.
**Gates:** census · motion · 0 POP PASS · frame-diff confined to y 54..148 · perf skipped (cached).
**HEAD → cand** (seed 7): occupancy **12.9 → 45.7%** wide, 10.6 → 42.3% mobile; a rank-0 roof against open sky **3.1 → 0.0%**.
**Verdict:** shipped
**Surprise:** the first range ATE the sky. The backdrop is composited OVER the live cloud layer, so a tier reaching mid-sky covered two thirds of the weather — 15.7% of the strip down to 5.4% — and the reorder recovered a loss HEAD already had.
**Law:** a cached layer drawn OVER a live one SUBTRACTS from it — price the live layer's SURVIVING mass (`FULL` minus `FULL`-without-it), not the cache's own gain.

## Iteration 163 — the reed fringe stands in the river, and the shade goes into it (2026-09-03) [River & far bank × Connect]

**Brief:** b163 — two things landed on the water since #145; `drawWaterMirror` knew neither.
**Did.** (a) 56 reed cells cut into 18 RUNS (`buildReedRuns`/`REED_CASTERS`) joining `riverCasters()` with `run:true` and `yS`. A run has a waterline per ROW, so #145's one-gradient-per-box fade cannot serve it: `reedInk()` puts the ramp in the STROKE, from the cell's own waterline to `REFL_FADE` beyond. #155's hand-drawn stub is gone — under MIRROR the clump's own path IS its image. (b) `onChannel()` + `sunShadeRuns(g, wet, bb)` PARTITION the one mask; the wet half is `drawWaterShade()`, drawn BEFORE the mirror and broken by `chopBars()`, so the image lies on the shade, not the reverse.
**Gates:** census PASS, six groups unchanged (no `R()`) · motion PASS · filmstrip 0 POP day and night · visual PASS at six framings incl. 390x844 · +7.7% Wide (probes/refl-cost).
**Measured** (probes/mirror-fringe, canvas-delta): same-code control **0** everywhere; reed images 869–963 px at mean d 7.6; near river 33–139 shaded sub-cells, rows 79–87. The fountain and the pond are WATER too — `onChannel` holds them on the land path, 0 px from HEAD where lifting it moves 282.
**Verdict:** shipped
**Surprise:** the fringe must NOT go through the offscreen. 18 runs each clipped and chopped in `rcv` cost **1.6 ms a frame at Plaza**; unclipped with one shared chop, 1.2; the identical 56 clumps on the VISIBLE canvas, **0.03** (probes/water-pass-cost).
**Law:** an offscreen 2D context is not the accelerated surface the visible one is. Only a draw needing its COMPOSITES (clip plus `destination-in`/`out`) belongs there; one wanting a clip and an alpha is a `save()` on `ctx`, two orders cheaper.

## Iteration 164 — stall.mjs reads the memory quota, and weighs the loop (2026-09-03) [The sill & the observer × Harness]

**Brief:** b164 — stall.mjs greps `quota` zero times; make a breach a signal, add the growth.
**Re-counted.** The brief says eight rows carry the quota. Eleven do — and **zero are MEASURED**, every one `quota: null`. #153's own surprise says why: bash parses the runner's `while` loop once, so the live runner still holds pre-#153 text. A breach streak alone would have been a signal that cannot fire, silent exactly as a clean run.
**Did.** One reader per absence runlog.mjs distinguished. `quotaBreach` (trigger, rung 2): ≥2 consecutive MEASURED breaches, surface tallied off `over[]`'s strings. `quotaUnmeasured` (advisory): ≥3 rows present-and-null — the gate at a rate of zero.
**The table.** `onDisk()`: sizes off disk, slope from git across 20 *Iter* commits. LEDGER-archive 667.9 KB **+2.65 KB/iter**, RUNLOG 185.2 +1.17, state.json 113.7 +0.21, MANAGER-LOG 79.3 +0.61 = **+93 KB/20 iterations**, none of it capped.
**Gates:** courtyard.html byte-identical — census PASS all six groups; shots clean; terse still `ok`.
**Proved** (`probes/stall-quota.sh`, new): three staged RUNLOGs, HEAD's stall.mjs as control. Breach → exit 2, `ledger x2, cue x2` at #163, HEAD prints **no line holding "quota"**; unmeasured → advisory, HEAD silent; measured-and-CLEAN → **neither fires**.
**Verdict:** shipped
**Surprise:** state.json is a fourth unbounded file the brief did not name — **closedCues is 79 KB of its 114**, 227 notes nothing prunes, in the file state.mjs rewrites whole each iteration.
**Law:** a field is not a reading — a gate wired into a row can sit at `null` for ever, and to a consumer counting only failures that is the same zero as a pass. Separate NOT MEASURED from CLEAN.

## Iteration 165 — the far distance moves with the frame (2026-09-03) [Sky, light & weather × Connect]

**Brief:** b165 — `backKey` carried no camera term: the live horizon eased, the cached hills did not.
**Did.** `drawBackdrop` generates in WIDE screen space; a scale+translate puts it into whichever view the cache is painted in. **At rest** that is the live view, unpadded — HEAD's canvas and cost. **Through a move** it is the wide view, padded by what the endpoint frames reach past it (`wpad`) and scaled by `k` like the ground: two paints a move, never one a frame. `FAR_WIN` mapped out of wide space in `applyLight`. The DESTINATION is crisper, and holds nothing an intermediate frame reaches past it — **9.27 Mpx of padding against a 1.52 Mpx frame**, where wide asks **zero** on a desktop (`probes/ease-pad.mjs`).
**Proved** (`probes/ease-back.mjs`, new): a GROUND-TRUTH build repainting in the live view every frame; 5 moves x 8 points. Sky-band MAD **0.10 vs HEAD 7.55**, worst frame **0.67% vs 62.1%**, drift **0 px vs 171**; control **0.00**.
**Gates:** census · motion · 0 POP day+night · `probes/wide-identity.mjs` (new): Wide byte-identical at 4 framings. +0.8 ms a repaint; eased frame 3.2 -> 3.5.
**Verdict:** shipped
**Surprise:** Wide came back 6202 px OFF at 900x560 and identical at the other three. `bcv.height/DPR` is not H — a canvas's height is an INTEGER, the frame there is 484.625 CSS px, and HEAD's `drawImage(bcv,0,0,W,H)` had been stretching the cache by 1.0013 to cover the remainder. Blitting the bitmap at its own size was the arithmetically honest thing and the wrong one.
**Law:** a cache's bitmap size is not its DESTINATION rect — `canvas.width/height` FLOOR, so blitting one back through `cv.width/DPR` loses the frame's fractional remainder. Blit the CSS rect the cache stands for.

## Iteration 166 — the camera comes off its quarters onto a person (2026-09-03) [The sill & the observer × Interaction/UX]

**Brief:** b166 — click a walker; the frame takes them and lets go on three exits.
**Did.** A quarter is DATA, so a follow is a quarter that MOVES: `followQuarter(a)`, a box on the feet sized so `viewFor`'s own width and height fits BOTH return `FOLLOW_S` 2.6. `viewFor` takes a box or an index, untouched otherwise; `inView` reads it, so the ticker carries THEIR errand. The cache was the risk, and a follow is an ease that never ARRIVES: `viewEasing()` holds for its length so the ground is never rebuilt, `holdWideGround` paints the padded wide cache once, `followPad()` prices the backdrop off the WORLD.
**Gates:** census · motion · 0 POP · perf +0.0% · `where-identity` IDENTICAL · `frame-cost` 108/108
**Proved** (`probes/follow-cam.mjs`, new): **0** ground rebuilds over 40 follow frames against **11** in a same-code 6 s control; 0 pops; 1 repaint on release. Price: **54.1%** of a frame repainted in its own view (control 1.0000).
**Verdict:** shipped
**Surprise:** `probes/follow.mjs` has been dead since #60 and its ten failures reproduce on HEAD. `evPx` maps x by `W/rect.width` and y by `H/rect.height`, and the rect is the CSS box PLUS the 10 px frame, so one k for both axes misses. Every assertion was reading a follow that never started, silently: a click on nobody is the RELEASE branch. It hid my own first bug: the follow line changes the sill's height, the frame's ResizeObserver fires `resize()`, and `viewSnap` dropped the follow in the frame it began.
**Law:** a probe driving the page through a real EVENT must invert the page's own mapping term for term, and assert the event LANDED before asserting what it did: a synthetic miss does not fail, it takes the other branch.

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

## Iteration 179 — the garden's walk is handed the leg it was priced for (2026-09-04) [Courtyard & garden × Deepen]

**Brief:** b179 — c256: `exitLeg` runs to `laneEdge`: a dusk sitter walks the dark town all night.
**CONFIRMED, then RE-AIMED** (`probes/lawn-exit.mjs`, new; 6 seeds x a year). The exit is real — longest **162.6 cells / 36.95 h** — but its 308 night-hours are of 813; the rest never reach `routeToExit`. `LAWN_OFF.south` is 40 cells — the WEST edge — and `entryLeg`'s coin hands half of them 108: **all 50 south arrivals overran, priced 9.63 h and walking 23.19.**
**Did.** One law, both ends: hand the consumer the leg it TESTED. (1) `laneEdge(nearX)` takes the near world edge for a leaver; the coin stays for a passer-by whose errand IS the crossing. `entryLeg`/`exitLeg` carry it, lawn-only, draw COUNT held. (2) `lawnGate()`: the door minimising the WHOLE way off the frame over that same `LAWN_OFF`, replacing `nearDoor()` (a chord's question) in `routeToExit`, `lawnHome` and the gardener's beds. (3) a kid already on its exit leg is not rebuilt from `a.exit` and sent 150 cells BACK.
**HEAD -> cand.** Out past EVE_GONE **0.874 -> 0.100**; longest exit **44.8 cells / 11.24 h**; dark lawn 2.714 -> 1.865. Presence: lawn 9.107 -> 8.908, **stopped on the grass 1.140 -> 1.144**, inside the wall 19.283 -> 19.242.
**Gates:** census PASS (`worn +104`, the new chords' desire lines) · motion PASS · 6 shots · 0 POP
**Verdict:** shipped
**Surprise:** `hourEve() >= EVE_GONE` is 2.30 to 6 am, so the next morning's set-outs share it: 0.713 of HEAD's 1.587 walked IN, not home. Unsplit it reads 47% where the vector moved 89%.
**Law:** a window past a day's LAST hour is also its NEXT morning's first — split a late population by DIRECTION before quoting it.

## Iteration 180 — the ground is relit when the light moves, not when the clock does (2026-09-04) [Sill & observer × Polish]

**Brief:** b180 — c258: cut the ground cache's rebuild rate; land the ease without the crisp.
**Half the premise REFUTED** (`probes/ground-rebuilds.mjs`, new): the rate has NOT grown 2.5x since
#138 — **107.50 at `Iter 138^` v 108.25 on HEAD**. What IS true: **90% was ONE term**,
`Math.floor(hour * 4)`, untouched since the loop began.
**Did.** (1) `lightNow`/`lightMoved`: an L1 DISTANCE from what was last PAINTED (daylight, nightF,
SUN[0], SUN[2], cover, mist), `LIGHT_MOVE` 0.12, the first two counted once at whichever moved
further, over a `LIGHT_SLOW` 4 s floor for the drift no light and no flag covers,
`markGroundPainted()` setting every mark in one place. (2) A landing DISSOLVES, not snaps:
`fadeCaches`/`fadeF`/`dropFade`, both caches, `VIEW_FADE` 0.30 s.
**HEAD -> cand.** Repaints/day **110.78 -> 75.14** (6 d x 6 seeds), light 98.17 -> 35.94; ground paint
2938 -> 2266 ms/sim day, ms per repaint FLAT. `ground-cost.mjs` (new)
prices asking less often as STALENESS: Pareto, not a trade — **max 1.11 -> 0.96, 0% over HEAD's**. `ease-land.mjs` (new): the frame after a landing was **2.5-3.8x** the last eased frame,
now **0.4-0.7x**, at four quarters.
**Gates:** census · motion · wide-identity 4x4 · filmstrip 0 POP · perf +0% · 5 framings · a follow
release, held at s=1 under 2.6x, dissolved on landing.
**Verdict:** shipped
**Surprise:** the first reading was **868 washing repaints a sim day** — the instrument cleared
`groundDirty` without setting `washPainted`, so that gate stayed true for ever.
**Law:** quantize the QUANTITY, never a clock standing for it — a clock spends a fixed budget on
something changing at a varying rate, and N roundings fire N times for ONE change.

## Iteration 181 — the river is given a winter it grows into (2026-09-04) [River & far bank × New CA]

**Brief:** b181 — seasonal colour and speed, no seasonal STATE.
**Did.** A skin CA over the margin, stepped in `caTick` beside the moss on its three terms. Shelter is an
L1 **distance transform out from every cell the channel is NOT**, so the REED shallows, the quay, the
eyot's laps and the footbridge's still water all fall out of it unnamed. `ICE_CURRENT` cuts the ceiling by
`riverMid(x)`; that, not a bound, keeps midstream open. Growth reads FROZEN NEIGHBOURS 5:1 against
nucleation, so it comes and goes as a FRONT. `iceSkinCol` is shared with the basin; zero R().
**Measured** (`probes/river-ice.mjs`, `probes/ice-step.mjs`, new; 4 seeds x a year). Days 19-24 only:
0 → 192/72/117 → 313 → 340 → **peak 341 of 680 margin cells** → 142 → 0 (976 water cells, not the brief's
8,784 — that is a census AGGREGATE), and not a switch: **at most 13 cells cross a drawn bucket in one
tick**, mean 2.5 over 559. Summer census identical to HEAD; 9 cells recoloured, all column 112.
**Gates:** census · motion (night t 1230 is in the freeze) · 8 shots · 0 POP · perf +0.0% · ground
+0.8 ms at 333 frozen — all PASS. Baselines re-pinned: winter forks the seed.
**Verdict:** shipped
**Surprise:** **the census cannot see winter, by design.** Its three AGES all sit at warmth 0.6929 — a
#14 fix, so the age axis measures age — so `tileKinds` 18→19 is invisible to it, and this brief's "the
census tileKinds must move" is unprovable there. Its one COLLAPSE (people −9.4%) was a crop of that fork:
mean people over a year, 3 seeds x 60, is **43.89 vs 43.91**.
**Law:** a gate's ladder can be blind to a WHOLE AXIS on purpose — price a predicted field against it
first; a seasonal system needs its own probe.

## Iteration 182 — somebody is at the window (2026-09-04) [Roofs & skyline × Deepen]

**Brief:** b182 — c267: ~20 panes light every night and nobody has ever been at one.
**Which register.** `LIT_PANES`, not `LIT[]` (a centre point, for the halo) and not `FACES` (a
CACHE-time register, stale through the camera ease, #86). It is the pane's own PER-FRAME screen
QUAD, projected with the glass it belongs to, so a figure solved in its (u,v) has no anchor that
can go stale and nothing to keep between frames. It carries `{q,sa,sb,room}` now: the ONE address
`windowLit()` hashes, so lit and occupied cannot drift apart.
**Did.** `paneFigure`: 2 slots a night, 0.32 taken, the accepted coin re-used as that slot's phase
(uniform GIVEN acceptance — one hash, not two); on `nid`, never `R()`. `drawPaneFigures()` is LAST, source-over,
with the moths and for their reason inverted: a moth CATCHES a light, a figure BLOCKS one.
**Measured** (`probes/pane-figures.mjs`, new; a 104-day year): occupied at once mean **1.17** of
13.05 lit, **52 / 18 / 12%** at 0 / 1 / 2, **0 empty nights, 0.00 by day**. Seeds 42 and 7 are
bit-identical: `hash()` is unseeded, so two seeds are one sample.
**Gates:** census unchanged in EVERY field (no `R()` draw) · motion · perf +0.0% · 0 POP.
**Verdict:** shipped
**Surprise:** the first build scaled the figure off the pane's HEIGHT and the pane just went dark.
These panes are **5 x 11 css px**: shoulders at 0.72 of that height are 90% of the width, and the
head came out an EGG, because `at(a,b)` scales `a` by the axis and `b` by the lateral. Bounding the
lateral by the APERTURE and sweeping the head as a circle off that one scale is the whole
difference between a person and a lamp going out.
**Law:** a silhouette's scale is a fact about the APERTURE it is seen through, not the body.

