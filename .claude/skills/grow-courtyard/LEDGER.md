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

## Iteration 149 — two gates that lied, and one of them now binds the worker (2026-09-03) [The sill & the observer × Harness]

**Brief:** b149 — bound what ONE iteration ADDS; fix or retire `probes/punt.mjs`. Full entry in LEDGER-archive.md.
**Budget.** `--additions` diffs the tree against a ref (`--since`, default HEAD) over the three surfaces a worker writes and every open re-reads: entries, inventory lines, cues. Quota: 1 entry ≤ 1.8 KB, ≤ 1 inventory line, ≤ 1 cue, 250 B each; exit 3, **naming** the offender.
**Punt (c227).** Both stranding tests had stopped being faults. `punt.leg === 0` assumed ONE hull; #141's second leaves A moored while B carries. `!eastOpen()` is the case #131 BUILT. Replaced by two questions no punt predicate can satisfy: ORPHAN (`a.eyot`, no hull holds them) and OVERDUE (`a.eyot` at `EVE_GONE`). Exits 1 now; also wrapped a trip length that read negative past midnight.
**Gates:** `courtyard.html` **byte-identical** — census unchanged in all six blocks, shots clean. `--additions` 0/exit 0 on HEAD; staged over-quota state + a 2.35 KB entry → 6 named failures/exit 3. `punt.mjs` HEAD 0/exit 0; `--strand` 2475 ORPHAN/exit 1; `--strand-late` 14 OVERDUE at 02:54/exit 1.
**Surprise:** `state.inventory` holds a `note` **string** beside its nine domain arrays — iterated as a list it yields one "line" per CHARACTER. Only the falsification found it; HEAD was a clean, plausible zero.
**Note:** `run-loop.sh` never calls `--additions`, so the quota binds only if the worker obeys SKILL.md (open cue).
