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

## Iteration 115 — the census stops throwing away the planting group, and the new fields arrive with a measured noise floor (2026-09-02) [The sill & the observer × Harness]

**Brief:** b115 — `summarize()` folds five groups and silently drops `c.planting`'s eight scalars; fold them, then measure their churn so a later brief can lean on one.
**Premise held exactly.** `__census()` computes `planted, blooming, daisies, mossy, matureTrees, worn, harvested, produce` every run; `summarize()` read only `planting.bySpecies`. `mossy` was added by #103 *so the census could see the moss* and has been invisible to the gate ever since.
**Did.** A `planting` group in `summarize()`, folded **generically** over the numeric fields with a `PLANTING_SKIP` set (`bySpecies` → its own group; `species` → a constant already reported as `scalars.speciesKinds`), so a future `__census()` planting field lands in the report with no code change. `produce` is the one float, so the sums are `toFixed(1)`. Printed after `species`, and on the `--save-baseline` path too — re-pinning is exactly when you want the absolutes. CORE untouched. `courtyard.html` **byte-identical to HEAD** (`git diff --exit-code`).
**Gates:** census PASS ×5 · visual PASS (wide/courtyard/east/lane) · motion + perf skipped, justified by the page being unchanged.
**Measured — the noise floor, now written into `census.mjs` beside the fields** (the ledger's 3-entry window would age it out): five runs of the gate on one unchanged HEAD, **72 per-cell readings, zero drift** — the instrument contributes *nothing*, so a delta in any of these is attributable. The floor that is not zero is the world: spread across seeds at day27 is `matureTrees` 0%, `planted`/`blooming` 1%, `mossy` 8%, `daisies` 22%, `harvested` 26%, `worn` 27%, `produce` **200%** (0, 10, 17 — a buffer the market empties every 4th day, unusable as a delta).
**Also:** a pre-#115 baseline has no `planting` key, so `diffBlock` falls back to absolutes and reads like a total change. One line now says why. Proved it fires by running the gate against a baseline with the key deleted, then restoring.
**Verdict:** shipped
**Surprise:** the age axis is not an age axis for half of these fields. `mossy` sums **1095 / 30 / 1236** across day1 / day11 / day27 — at *identical* warmth 0.693, grow 0.2212 and die 0.0959, because #16 built the ladder to equalise the instant. Moss integrates, so it reads the arc just travelled: the day11 cell has crossed midsummer, where `warmth > MOSS_DRY` bleaches it to the floor. It reads 7% of its neighbours' value and nothing is wrong. Five fields behave this way.
**Law:** the census ladder equalises the INSTANT (warmth), which makes it an age axis only for fields that are a pure function of that instant. Any field that INTEGRATES over the year — moss, wear, harvest, produce — reads the arc of the year just travelled, so a per-age reading of one is a season reading, not an age reading: use the matrix SUM.
**Cue:** `census-history.jsonl` still carries only `scalars`, so the planting group is visible to a worker's diff but not to `build-stats.mjs`'s growth curves.
**Budget:** opened OK (44.2/46), closed **OVER** (46.1/46) — my own inventory line pushed it over. `rotate-ledger` names six laws over the 900 B per-law cap.

## Iteration 116 — a sixteenth tile, and the first thing in the town you can see through (2026-09-02) [Cross street & allotments × New element]

**Brief:** b116 — the material vocabulary has never moved in 114 iterations; build the first `GLASS` tile and one tender species on the allotments.
**Premise held, checked on HEAD:** no `GLASS`/`glasshouse`/`greenhouse` in 10,305 lines; `TN` 15 names, `SPECIES` 11.
**Did.** `GLASS = 15` (a ROOFED floor, TUNNEL's shape in `drawGround`, never a volume), `GH` x84–93 × y34–39, `tomatoes`, and a lamp that is one more `windowLit` address. Mechanics are in the diff and the inventory; **the decision worth keeping is that the span stands *over* two lattice plots rather than beside them** — (85,36) and (90,36) keep their BED cells, so `ripePlots`/`fallowPlots`/`pickPlot`/`sendToPlot`/`harvestPlot`/`plotOrigin` and the cart find it with **no line changed in any of them**. `bedCap` → 3 inside is the whole claim. Drawn in two halves split at the ridge (the footbridge's pattern): far slope cached, near slope live at `GH.y1+1.7`, because the crop is drawn live and must land *under* it. +209 lines.
**Gates:** census PASS — `tileKinds` 135→**144**, `speciesKinds` 99→**108**, the brief's exact numbers; GLASS +432 / GRASS −432 · motion PASS vs a HEAD-pinned baseline · filmstrip day+night 0 POP · perf +0.0% · shots clean.
**Measured.** Difference image at 1600×950 masked per pixel through `unproject`, against a same-code control: the span **0% → 73.3%** changed, meanD 0 → 27.1; the control is *exactly* zero there. A year at a fixed hour (`probes/glass-year.mjs`): with `bloomCap` down, 20 samples over two years, ripe share **62.5% under glass vs 21.2%** outside — deep winter runs 6–11 ripe of 90 open cells against 7–8 of 12 under the span. Lamp lit 18.6–20.34 on midwinter day 18; shot at 19.6 it is a warm pane with tomatoes beside it and every plot around it bare.
**Verdict:** shipped
**Surprise:** the frame *outside* the allotments changed too — 10.7% of it — and it is not damage. Taking 48 GRASS cells out removes 48 *conditional* `R()` draws per `caTick` from the daisy branch, shifting the whole stream. HEAD vs HEAD at six other seeds spans **2.7%–43.3%** on the same mask (`probes/reshuffle-scale.mjs`), so 10.7% sits well inside "the same world, drawn again". I nearly reported a town-wide regression from a change touching 60 cells.
**Law:** deleting cells of a tile whose CA branch calls `R()` *conditionally* is a stream shift exactly like adding a draw — changing the MAP reshuffles the seeded world even when you add no draw. Control it across SEEDS on the same mask; at ONE seed you get only the ~0.3% pinning floor, which makes every reshuffle look like damage.
**Budget:** opened **OVER** (47.7/46). Cues c177/c178 went to state.json rather than costing three worker reads.

## Iteration 117 — the hand goes where the words are: the working roof answers, and the sill stops naming what it hides (2026-09-02) [Roofs & skyline × Interaction/UX]

**Brief:** b117 — the cursor keyed on the SOWABLE-cell test, the 24 pieces of roof furniture said nothing, and `nearHidden` guarded the renderer but not the hit test. All three premises held on HEAD.
**Did.** (a) `cv.style.cursor` moved out of the `mousemove` listener into `updateNaming`, off `lookAt`'s own result — the affordance is the NAMING, not the sowing, and it costs nothing because `lookAt` already ran once a frame off that point. (b) `roofFurnName`/`roofFurnAt`: words read off what each piece IS (`washOut()` gates the cord's line as it gates the cloth; `snowCover` whitens the tank's lid; the loft counts birds through `birdDown()`). Hit-tested in WORLD space and projected live, so unlike `FACES` no screen box goes stale; `FURN_BOX` is one size definition for the draw and the hit test. (c) `nearHidden()` is read by the hit test too: in `lookAt` on the pointer's cell, and in `livingAt`'s `hit()` on the feet. +100 lines.
**Gates:** census PASS · motion PASS · shots clean · canvas hash bit-identical to HEAD at 18 pinned instants (3 sizes × 2 seeds × 3 times) — the proof it is an interaction change · `lookAt` 7.2 µs vs HEAD 7.3 µs.
**Measured** (`probes/affordance.mjs`, every reading a real `mousemove`/tap): hands at 1600×950 **HEAD 1/8 targets → 7/8**; on the three furniture targets HEAD named *the slates under them*. Phone 5/5. Behind the sill at 1280×700, where 20 of 24 pieces are covered, HEAD named "a pigeon on the loft's landing board" for a bird it refused to draw; the tree says nothing. All six branches of the cord fire over 40 days.
**Verdict:** shipped
**Surprise:** two instrument faults, zero code faults. The probe pointed into the void first — `ROOF_FURN[0]` sits at world x −7.5, off the west edge. Then the vane's words differed between builds **and survived a HEAD-vs-HEAD control**, which looked exactly like a regression. It was the run count: without `__reseed()` before the warp, HEAD's own `windF` at a pinned instant flips 0 / 0.339 across 8 runs, because frames drawn at page load move the PRNG. Two runs was too small a control to catch that the law had been broken.

## Iteration 118 — each bird band counts its own: the lawn and the lane get their three back (2026-09-02) [People × Deepen]

**Brief:** b118 — the ground band's cap read `birds.filter(b => !b.plaza).length < 3`, so #106's roof birds and the belfry's flush filled it. Premise re-measured on HEAD first (`probes/ground-birds.mjs`, 12 seeds × 6 days, 7,744 daylight dry samples): mean present **0.05** ground vs 2.67 roof, 1.24 plaza; gate open 15.1%, and — the sharpest number — **100% of shut samples were shut on birds of another band**. Not throttled, evicted.
**Did.** One predicate. The band's spawn carries `ground:true` and the cap counts `b.ground`, the way the other two already read themselves. The crumb birds a tap scatters are tagged too — they *were* members under `!b.plaza`, so tagging keeps the old behaviour instead of quietly handing the band a second budget. No new source, no new draw site; +9 lines, all comment.
**Re-priced, not inherited.** Same probe, sweeping the cap once the count meant what it says: **0.33 at 2 · 0.41 at 3 · 0.39 at 4 · 0.40 at 5**. The knee is exactly 3, because the limiter is now the **rate** `0.06*(0.5+m)`. Shipped: ground **0.05 → 0.41** mean, **4.6% → 34.0%** of daylight samples with a bird on lawn or lane; roof and plaza sit in reshuffle noise.
**Gates:** census PASS · shots clean plus a pinned instant with three ground birds · motion FAIL on one flag, `day/cart` 0→1 jumps, replayed on HEAD (`probes/cart-steps.mjs`): both builds median step 1.733. A cart trotting, not a teleport.
**Verdict:** shipped
**Surprise:** the cap was never the throttle it looked like — fixing membership moved the binding constraint to the rate in one step, and the whole 2..5 sweep lands inside 0.08 of a bird. A brief that had only raised the *number* would have measured nothing and concluded the band was fine.

## Iteration 119 — the far bank gets an edge: a hedge, a gate standing open, and a track worn to it (2026-09-02) [River & far bank × New element]

**Brief:** b119 — `FAR_GATE` is a bare world edge; give the far bank's morning something to come *through*.
**Premise held, and worse:** `drawGround` clamps `gx` to `GW-1`, painting the fields east of the world in grass, so `FAR_GATE` projects to **sx 1201 of a 1228-wide canvas** — on frame, on open grass, out of nothing.
**Did.** A boundary at `FIELD_X = GW`: a hedge (seasonal through `leafOut`/`leafCol`/`snowAt`, so it flushes, turns and goes bare with the orchard), a five-bar gate hung open in a gap on `FAR_GATE`'s own row, a track worn to it, `fieldEdgeName` in `nameAt`. **Drawn, never gridded** — a WALL cell here would be a footprint and get a roof; this is a ground-cache line like the allotment fence, so not TUNNEL-class, and `passages` did not move. `farWay` gains `FIELD_GAP` as its first waypoint; since `spawnFarAgent` reverses the lead to build the way home, the walk OUT came free. +85 lines.
**Gates:** census PASS (`structure: unchanged`) · motion PASS · shots clean. Perf out of scope — `drawFieldEdge` runs inside `drawGround`, cache-time.
**Measured** (`probes/far-gate-waypoints.mjs`, 10 seeds × 6 days): HEAD's 170 arrivals start at **39 distinct** points scattered down the bare spine x=137.2; the tree's **173/173** enter *and* leave at `[138, 31]`, all five branches intact. Containment: far-bank strip 3.68% changed, everything else bit-identical, peak 0. Hedge continuous at 40/40 samples.
**Verdict:** shipped — but built by attempt 2, which never committed. A WIP is UNPROVEN, so this pass re-measured rather than inherited; it held, and came back sharper.
**Surprise:** the world's east edge is off-canvas in **every camera but Wide** at desktop sizes — including the quarter *named* "Far bank" — and off-frame in all five on a phone. The bare arrival, and its fix, live in one of five cameras.

## Iteration 120 — the quarter cameras learn the world's real extent, and that a subject can stand UP (2026-09-02) [The sill & the observer × Scale/World]

**Brief:** b120 — the five cameras frame GROUND, not the town. It cites `probes/world-edge-framing.mjs`, which was not on disk; I wrote it, and it prints every number below on either build.
**Did.** (a) `WORLD_X0/WORLD_X1/FIELD_VIEW`: the camera's extent, no longer the grid's `0..GW`, and `drawFieldEdge`'s track now ends on `WORLD_X1` — one constant for the last drawn thing and the frame that must hold it. (b) **Vertical intent**: `air`, the DEPTH a quarter reaches up to, and `keep`, which end of the band survives an overflow. The height fit is priced on `air..y1`, and `tp` is one expression that is HEAD's *term for term* at `air = y0, keep = 1`, so a quarter declaring no intent cannot move. Street's `air −20.5, y1 44` keeps the band the height its box was: it slides UP into the air instead of zooming out of it. (c) the near-corner escape no longer *ends* at `held(1)` — that is now a candidate, held at the top row in its turn. +72/−24.
**Gates:** census PASS (camera only) · motion PASS · shots clean · ease sampled into Far bank, the scaled cache covers the frame · `probes/quarter-hash.mjs`, 3 sizes × 2 seeds × 3 instants: Wide moved at 1/18 against a **HEAD-vs-HEAD control at 2/18**, and is unchanged by construction — `viewFor` returns before every changed line.
**Measured, both framings:** arrow vane in Street OUT −204 px → **IN, cardinals 11.4 px**; weathercock in Far bank −404 → **IN +31**; field gate in NO quarter → **Far bank +21, Plaza +28**; Courtyard's west edge −8.6 cells → **0.0**.
**Verdict:** shipped
**Surprise:** **a quarter cannot reach the world's edge by zooming.** The frame's world x at a given row is a function of the hold's extent and the PINCH alone — `s` cancels — so the gate's row 31 is 3.1 cells short of the frame's top row at *every* zoom, and only the extent moves it. Which bounds the extent from the other side: the cache's east repeat is honest only where the edge column is, and column 137 is WALL for rows 0..2. Far bank must reach row 0 to reach the sky, so it carries ~5 cells of smeared block in its top corner; Plaza's band starts at row 3.6 and runs east to the gate over nothing but field. Two quarters, opposite constraints, one constant.

## Iteration 121 — the town's namesake stops being its emptiest room: the lawn's cap was the only lever, and it was binding two thirds of the year (2026-09-02) [Courtyard & garden × Scale/World]

**Brief:** b121 — measure courtyard presence over a full year, then find the binding lever: the cap, LAWN_RATE, the window, or a missing KIND.
**Premise corrected:** the brief's "4 inside the walls" is `lawnCount()` — the place-HOLDER count, which *is* LAWN_CAP and was at it. At the brief's own instant there are **10 people inside wallR()'s square, 7 of them the lawn's own**. The emptiness is RADIAL, not a headcount: only 3 were inside `gR()`.
**Did.** `probes/lawn-day.mjs` (new, kept), then **`LAWN_CAP` 4 → 8** and **`LAWN_BLANKETS` 2 → 3**. No behaviour line changed; the sweep is written into the source beside the consts.
**Measured.** HEAD sat AT its cap **66.5%** of every dry in-window sample of the year. `LAWN_RATE` is not a lever: swept **0.45 → 3.0**, afternoon presence moves 8.72 → 8.58. Sweeping the cap 2→12 instead, **the knee is 8** — grass +1.3 per pair of places below it, +0.4 above, and at 10 it binds only 12% of the time. Shipped: a dry summer afternoon 9.1 → 13.8 inside the wall, **3.3 → 6.0 on the grass**, share of the town 22.2% → 29.1%. Midwinter 2.8 → 2.9 and wet 2.6 → 2.8: the weather still owns it.
**Gates:** census PASS (`inCourtyard` 119 → 154) · visual PASS wide/courtyard/mobile pinned on a summer afternoon, midwinter and rain still empty · filmstrip 0 POP · perf +0.0% · motion FAIL `day/cart: jumps 0→1`, **dismissed on a HEAD control** — the cart's steps are identical on both builds (**2002 vs 2001** of 5819 moving steps already over `ABS_JUMP`, median 1.733): the vacuous-median case. No walker jumped.
**Verdict:** shipped. Budget closed **OVER at 47.4/46 KB** — four of the last five passes have.
**Surprise:** raising the cap fills the WALL, not the green. 4→8 put +3.4 people on the four benches (sitter 1.17 → 3.96) and only +2.4 on the grass, because `BENCH_SPOTS` is the largest sub-cap and the benches sit between the ring and the wall. `LAWN_BLANKETS` 2→3 moved that back at zero cost in total (picnic 2.54 → 3.71, grass 5.71 → 6.28) — and the blanket is also the only lawn kind legible from the WIDE shot, where a person is three pixels and a red rectangle on grass is not.
**Law:** a cap over place-holders is really a cap on the SUB-CAPS beneath it; when it stops binding the mix tips toward whichever sub-cap is largest — a composition change nobody asked for. Sweep the cap, then check WHICH kind absorbed the slack.

## Iteration 122 — the lane stops forgetting the rain: per-cell standing water (2026-09-02) [Lane & market × New element]

**Brief:** b122 — `wetF()` is one global scalar, so the hour after a shower looks like the hour before.
**Premise held; half of it was unbuildable as written.** No `puddle`/`wet[]` anywhere — but "where the feet wear the ground (`trod[]`/`wear[]`)" cannot be read: `wear[]` is written only on `grid===GRASS`, `trod[]` only under snow. The paving had forgotten everyone who ever crossed it, so this needed its own memory first.
**Did.** `paveWear[]`, feet on STONE, accrued in `stepAgent` as a *statement* — not another branch of the exclusive chain, where a cell holding litter would have skipped it. `PUDDLES[]` built once off the GRID ∩ lane ∩ cross street, fill threshold `hash + PUD_TROD·paveWear`, so a deep or trodden cell fills first and dries last. `drawPuddles()` live *before* `applyLight` (water at midnight *is* slate), `drawPuddleLights()` in the `screen` pass after. Retired the 8 ellipses that pulsed on `sin(t+k)`. +90 lines.
**Gates:** census PASS, all groups unchanged (no new `R()`) · motion PASS · filmstrip 0 POP · shots incl. mobile clean · `perf.mjs` PASS but **blind — 16.70 ms both sides is vsync**; timed directly, `drawPuddles` is **0.94 ms at 560 pools on a 2.0 ms frame**, exactly 0 below `PUD_LO`.
**Measured** (`probes/puddle-arc.mjs`, `dry-identical.mjs`): dry is **bit-identical to HEAD, whole canvas, 0 px**. Over the arc pools **560 → 17** while mean `paveWear` under those still holding rises monotonically **0.032 → 0.142**. Lane band vs HEAD at equal wetness **8.33% → 0.00%**, two-page HEAD|HEAD control exactly 0.00%.
**Verdict:** shipped. Budget **OVER at both ends** (47.5 open, 50.2 close) — five of the last six passes have opened over, and my own cues and inventory are 2.7 KB of the close.
**Surprise:** both failures were *uniformity*, at different scales. Flat-subtraction decay on an accumulator makes the map **binary** — a cell either out-earns the decay and pins at its cap or never leaves 0, measured 24 cells of 2,563 above 0.05 — while proportional decay gives each cell an equilibrium proportional to its traffic, which is what a desire line is. And one per-cell hash scatters pools *evenly*, which reads as leopard print rather than water; a street has a **fall**, so the fine hash had to sit inside a coarse one over a ~4×2-cell dip before the lane grew dry stretches and the pools looked like they had gathered somewhere.
**Law:** an accumulator-fed per-cell field needs **proportional** decay — subtractive decay has no stable interior and quantises it to {0, cap}. And one uniform hash is a texture, never a *place*: to make scattered things look gathered, gate a fine hash by a coarse one at the scale the gathering happens on.
