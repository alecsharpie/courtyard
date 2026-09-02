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

## Iteration 142 — the clock stops being the loudest voice in the room (2026-09-03) [The sill & the observer × Connect]

**Brief:** b142 — price the strike against everything else in the queue. Full entry in LEDGER-archive.md.
**Did.** `background(rank, txt, then, until)` names the third rank the ticker always had. A MURMUR may never take a surface anyone holds *or is waiting for*; the CLOCK may also wait for a busy one, but only into an EMPTY queue — `announce()` makes room on a full queue by shifting the oldest line off, so that bound makes "the clock never displaces the town's own news" true by construction, for 1 line in 55. `announce()` gained `until`: a SIM time after which a line stops being TRUE, as against `TICK_STALE`, which is how long anyone will WAIT for it. `bellUntil` untouched — the bell still rings every third hour on hours the ticker never mentions. Second half: `CLOCK_SAID = [0, 9, 12, 18]`, the remark's cadence, keeping `answered` reachable.
**Gates:** census unchanged, all six groups (no `R()` spent) · motion PASS · visual PASS, nothing drawn changed · perf skipped.
**HEAD → cand** (`probes/ticker-price.mjs`, 6 days × 3 seeds, classed where each line is BORN, read at `showLine`). Courtyard: strike **46% → 20%**, the town's own places **118 → 164 lines (+39%)**, total 323 → 267. Wide: strike 30% → 8%, placed 53% → **71%**, total −9%, all four remarked hours sound. Lateness ≥1 h: **23% → 0%**, max 2.25 → 0.96 h.
**Verdict:** shipped
**Surprise:** the queue price alone cannot reach this, and the first cut proved it twice. At a quarter **there is nothing in the queue to price against** — `inView` withheld the competition, so a contention rule binds at Wide and slides off at Courtyard. And pure drop-if-busy makes the clock a function of how busy the *day* is: at Wide it was heard at midnight and 3 a.m. and **0 of 18 seed-days at six, nine, three and six again**.
**Law:** a contention price is only a price where there IS contention — a rule ranking callers on a shared surface cannot bind in a view that has already filtered the other callers out. There the CADENCE against the surface's CAPACITY is the whole answer: a 55 s day holds ~22 lines at `TICK_DWELL`, so eight strikes was a third of everything the town can say before one contest is lost. Count the slots before designing the queue.
**Law:** staleness and untruth are two clocks — `TICK_STALE` is how long anyone will WAIT for a line; one that names an instant needs a second bound at the instant it stops being TRUE, or it is shown contradicting a readout two inches above it.
**Note:** `context-budget.mjs` read OVER — 47.9 of 46 KB — before this entry.

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

**Brief:** b144 — `laneCap` has no knee because the east branches are 5–6% bands each: re-weight the roll so raising the cap REACHES the east; reserve the fountain stand and re-sweep `FAM_CAP`. Full entry in LEDGER-archive.md.
**Did.** Re-measured the premise on HEAD first (6 seeds x 14 days): cap 10 -> 16 buys the lane +3.05 and the east +0.17 plaza, **-0.28 quay, -0.12 far bank**. So `eastEdges(cap)`: the four east bands scale by `eastPull(cap)`, 1.0 below `EAST_CAP0` 6 and 2.0 at `EAST_CAP1` 14, the width taken from the PLAIN passer-by alone. Keyed on the CAP, not on fill — an east trip holds its `lane` slot for its whole ~40 s, so occupancy would feed back on itself. `FOUNT_STANDS`: three stands on the roundel's inner ring, each held by one party (`a.fstand`), shared by the family and the lane's plaza branch; a family that can get neither bench nor stand does not set out.
**Gates:** census PASS, structure unchanged, baseline **re-pinned** · motion PASS · visual PASS · filmstrip 1 POP at seed 42 = **rain onset**, uniform across all 16 blocks of a block map, and HEAD rains through that whole window; seed 7 0 POP · `probes/fount-stands.mjs` 10/10.
**HEAD -> shipped**, laneCap 10 -> 16: plaza **+0.17 -> +1.02**, quay -0.28 -> +0.08, far bank -0.12 -> +0.11; east half **9.73 -> 10.96** with the lane holding (17.38 -> 16.61). Plaza crowded pairs PER PERSON **0.237 -> 0.153**. Pull awake on 72.1% of daylit samples.
**Verdict:** shipped
**Surprise:** the family half was right about the crowding and wrong about the cap. Reserving the stand does what the brief predicted — HEAD at `FAM_CAP` 5 costs 0.193 -> **0.282** crowded pairs per person for +0.19 families, and the shipped build holds 0.145-0.159 across 3, 4, 5 and 7. But the higher cap still buys nobody: **5 and 7 return byte-identical numbers and bind 0.0%**, so past 4 the bound was never the places — it is `FAM_RATE` and the window, which the source comment had guessed and nobody had tested. Kept the knee, `FAM_CAP` 3 -> 4.
**Budget:** **OVER — 50.2 of 46 KB** before this entry (inventory 16.3 KB against a 9.5 KB cap). Fifth pass running over; #136, #141, #142, #143 all flagged it.
**Law:** a cap and a SHARE are two bounds and only one can be swept — when raising a ceiling buys only the branch nearest the source, re-weight the branch and re-sweep, because the sweep is what reveals the ceiling has stopped being a bound at all: identical numbers at two settings is a DEAD constant, not headroom.
**Law:** re-weighting a threshold cascade must name which band PAYS. Taking the width proportionally from a whole tail is invisible to presence per place — presence counts people, not what they are doing — so a variety a picture would miss is spent silently. Take it from the band whose people stop nowhere, and let that bound the pull.
