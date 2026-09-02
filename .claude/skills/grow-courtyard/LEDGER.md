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
**Cue:** <a loose end you noticed and did not chase, or omit>
```

---

## Iteration 111 — every camera gets the sill: the window we look through stops zooming, and stops being painted over (2026-09-02) [The sill & the observer × Deepen]

**Brief:** b111 — the painted sill exists at one camera position; give every quarter its sill.
**Premise held, diagnosis inverted.** "No sill at all" is false: the GROUND CACHE holds a good sill at all five cameras × three framings — band max 39.4 / mean 12.3, the wide view's own numbers, every time. Only the sort is broken. The cache is blitted early and every live thing draws after it, so at a quarter the town's own rows land below `sillTop()` and are drawn ON the sill; `nearHidden()` guards exactly two call sites, the roof birds and the cat.
**Did.** `sillU()`/`sillPots()`/`sillBoxes()` — ONE definition of where the sill lands on screen: the strip, plus the three things standing on it that rise above its top edge. `sillU()` is priced off `cellW0`, the wide view's cell, so **the sill no longer zooms with the camera** — it is the window we look through, not part of the town, and that is what lets it be copied 1:1. `sillOver(ctx)` puts the cache's own pixels back after the last town draw (after `drawSmoke`, before `applyLight`, so the night still falls on it): four `drawImage`s, not a repaint, so `avoid`'s gradient never runs twice. `clipOffSill()` punches the same boxes out of `applyLight`'s screen-glow passes, `clip('evenodd')` — a quay lamp bloomed to 97 luma through the sill at the Plaza. +~50 lines.
**Gates:** census PASS, all five groups unchanged (no `R()` draw) · motion PASS · filmstrip day+night 0 POP · `frame-cost` draw 3.08–3.11 HEAD vs 3.08–3.09 tree over 3 reps × 2 seasons, rebuilds identical.
**Measured** (5 probes kept, each regenerating HEAD): band max **227 → 40.4**, OVERPAINT **53.7% → 0.00%** of ~210k dark sill px at every quarter × framing × day/night, every row bit-for-bit the wide view's own number in fine, rain, snow and reduced motion. Sweep of 54 instants × 5 cameras: worst band max 229.0 → 40.4. The wide frame differs from HEAD by **121 px at Δ=1**, all in the pot boxes.
**Verdict:** shipped
**Surprise:** the instrument, twice. A raw RGB diff of the live canvas against `gcv` called 4% of the pot boxes overdrawn on a build the sweep proves clean — `getImageData` returns the cache UNPREMULTIPLIED, so a soft-edged cache pixel cannot be compared with the composited one. And the ease is where the bug was loudest and I had not thought to look: HEAD stretches the cached sill with the camera, so **99% of the band changes between adjacent frames** of the 0.9 s transition and its mean runs 12.6 → 134. View-independence takes that to 0% at every step — the sill sits still while the town zooms behind it, which is what a window does.
**Law:** the ground cache is composited early and lit late, so a cached foreground has TWO leaks: the town draws over it, and the town's own lights bloom through it. Cover it after the last town draw and before `applyLight`, and punch it out of the glow passes.
**Budget:** OVER — 46.6 KB against the 46 KB cap the moment this entry landed. Two of the last three entries are over the 2.5 KB per-entry cap and `state.json`'s life and roofs lists are both over 8.

## Iteration 112 — dawn becomes one event: the light curve, the last lamps and the sunrise wash all key on the sun (2026-09-02) [Sky, light & weather × Deepen]

**Brief:** b112 — #109 re-keyed ONE clause of `windowLit` onto `sunUp`; the rest of dawn was still on the night's clock.
**Premise held, and a third leftover found:** HEAD left 2.23 panes lit at sunUp+0.8, and `applyLight`'s warm dawn wash was hard-coded at **hour 6.4**, on no clock at all.
**Did.** `nightF`'s morning half is now `dawnF(h)`, a smoothstep on `sunUp` (`DAWN_LEAD 1.1`/`DAWN_RUN 2.2`, scaled by `dayHours/MEAN_HOURS`), so **nightF is exactly 0.50 at sunrise every day of the year**. `DAWN_K` makes `dawnEdge()` and the curve one definition; `nightAt()`'s span reads it, so `w.last`, the burn-through and the HOMES cap fall back to first light with no constant touched. Dawn wash rides `sunUp+0.2` at `DAWN_WARM 0.55`. Evening untouched, and `Math.min` makes that structural. +45 lines.
**Gates:** census PASS ×2 · motion PASS ×2 · filmstrip day/night/winter-dawn 0 POP · 8 framings.
**Measured:** lamps after sunUp+0.5 on **26/26 days → 0/26**; the evening is **bit-identical across 26 days × 9 offsets**. Side effects: homers 2.07→1.85/night, cat on the roof 15.5%→9.6% (c166).
**Verdict:** shipped.
**Surprise:** re-keyed onto sunrise, this wash and `drawSky`'s own peak landed almost together — and the new curve had just taken the blue multiply off both. The sunrise measured **R−B +45.9** against **+28.3** for the town's warmest dusk. Priced against that dusk rather than its own old value, 0.55 puts it at +30.5.

## Iteration 113 — every bird the town draws answers, and the pointer finally lands where the picture is (2026-09-02) [People & animals × Interaction/UX]

**Brief:** b113 — `livingAt()` named only the near roof's birds; close the hole for the rest.
**Did.** `birdName(b)`/`birdPlace(b)`; `livingAt` loops all of `birds`, not `b.roof && state==='hop'`. WHAT off the band it was spawned into, WHERE off the predicates the ground is already named with (`pavingAt`, the grid) — never a second table of boxes. DOWN is `birdDown(b)`, factored out of `drawBird`'s posture test, so words and picture cannot disagree; an airborne bird claims no place. All five roof perches have a line; hit box `0.9 * nearScale(b.y)`. **10 bird lines against HEAD's 4.**
**And the tap:** it fell through `if (!answersTouch(x,y)) return` *before* the naming, so on a phone every nameable thing that cannot be sown on — a roof bird, a window, a vane, a crown — answered a mouse and said nothing to a finger. The cell test still decides what a tap DOES.
**Gates:** census PASS (no new `R()`) · motion PASS · **canvas hash identical to HEAD at 18 pinned instants** (3 sizes × 2 seeds × 3 times): provably an interaction change, not a draw change · `probes/probe-birds.mjs` on HEAD as control — roof 53/53 both; plaza 0/8→8/8, lane 0/1→1/1, belfry 0/50→50/50, phone taps 0/13→13/13, pointer path 0/7→7/7.
**Verdict:** shipped, +55 lines. Budget opened OVER (48.4/46).
**Surprise:** the pointer was never where the picture is. `resize()` takes W/H off `cv.parentElement` — the frame's BORDER box — while `#cv` is `inset:0`, i.e. its PADDING box: 20 px narrower and shorter at every size. The backing store is stretched to fit, so `evPx`'s point was up to 16 px out across the frame and 20 px down it — 3.3% of the height, against a walker 12 px tall. HEAD's roof-bird line, pointed at properly, answers **"the lane"**.

## Iteration 114 — the quay ages too: a second region for the moss CA, greener against the rail than along the line people walk (2026-09-02) [Plaza & quay × Deepen]

**Brief:** b114 — #103's moss is plaza-only; extend the ageing to the quay, judged by a difference image and a number.
**Premise held; the brief's warning was the right one.** `pavingAt()` answers `PAVING.quay` for **975 cells — 845 are the RIVER**. It is a fall-through, so the box it names is an intersection with the stone, and the stone is **130 cells** against the plaza's 730.
**Did.** `inQuay`/`mossIn`, `mossOwn[]` a region mask, `buildMoss`/`stepMoss` split into region builders run twice. `mossShelterAt` keeps the plaza's rule verbatim and reads the quay in its own stone plus `MOSS_WET 0.55` per WATER neighbour — that term *is* the rail-vs-walked difference (shelter 0.92 vs 0.60, ceiling 0.654 vs 0.481). `scuffLitter()` factored out of #72's branch, which the moss branch now sits in front of on SIDE and would have stopped the quay clearing leaves in October. `nameAt` says "the quay, green in the joints". +70 lines.
**Gates:** census PASS · motion PASS · filmstrip day/night 0 POP · perf +0.0%.
**Measured:** plaza moss field **bit-identical 12/12**. Difference image at two sizes, masked per cell by `unproject`: **quay 0.85% → 37.4% of pixels changed, meanD 0.83 → 5.35**; plaza 0.86%/0.60, the control's own floor. Rail-minus-walked green excess −0.50 → **+1.02**.
**Verdict:** shipped. Budget OVER at both ends (49.0 open, 50.5 close) — third consecutive over-budget open.
**Surprise:** the difference image was unreadable until I ran the same probe **HEAD against HEAD**. Two runs of identical code differ over ~1.3% of the frame at peak 90+, because `__reseed()` + `__warp()` + one `drawScene` does not pin the ground cache or the live layer. Without that control I would have reported a whole-frame regression from a change touching 130 cells.

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
**Did.** (a) `cv.style.cursor` moved out of the `mousemove` listener into `updateNaming`, off `lookAt`'s own result: the affordance is the NAMING, not the sowing. It costs nothing — `lookAt` already ran once a frame off that point, the DOM is still written only on a transition, and the per-event hit test is gone. (b) `roofFurnName`/`roofFurnAt`: words read off what each piece IS (`washOut()` gates the cord's line as it gates the cloth; `snowCover` is the term that whitens the tank's lid; the loft counts birds on its board through `birdDown()`). Hit-tested in WORLD space and projected live — the pieces are cached but HELD as world coords, so unlike `FACES` no screen box goes stale. `FURN_BOX` is one definition of each piece's size, read by the draw and the hit test alike. (c) `nearHidden()` is read by the hit test: once in `lookAt` on the pointer's cell, again in `livingAt`'s `hit()` on the feet — the argument `drawBird` passes. +100 lines.
**Gates:** census PASS (six groups unchanged) · motion PASS · shots clean · **canvas hash bit-identical to HEAD at 18 pinned instants** (3 sizes x 2 seeds x 3 times) — the proof it is an interaction change · `lookAt` 7.2 us vs HEAD 7.3 us interleaved, worst-case point.
**Measured** (`probes/affordance.mjs`; every reading a real `mousemove`/tap, HEAD regenerated and measured by the same code). Hands at 1600x950: **HEAD 1/8 targets, tree 7/8** (all but a blank wall). On the three furniture targets HEAD named *the slates under them*; the five it already named keep their exact words. Phone 390x844, one tap per page: 5/5. Behind the sill at 1280x700 — where **20 of 24 pieces are covered** — HEAD answered for the furniture and named *"a pigeon on the loft's landing board"* for a bird it had refused to draw; tree says nothing and shows no hand. Over 40 days all **six** branches of the cord fire (78 out to dry / 46 not pegged out / 36 blowing / 34 brought in / 25 wet / 21 under snow): no dead string.
**Verdict:** shipped
**Surprise:** two instrument faults, zero code faults. The probe pointed into the void first — `ROOF_FURN[0]` sits at world x -7.5, off the west edge, so "the first tank" was on canvas and "the first loft" was not, and three targets read as silent on *both* builds. Then the vane's words differed between builds **and survived a HEAD-vs-HEAD control**, which looked exactly like a regression. It was the run count: without `__reseed()` before the warp, HEAD's own `windF` at a pinned instant flips **0 / 0.339 across 8 runs** (5-3), because frames drawn at page load move the PRNG. With the reseed both builds are 8/8 identical. The law was already written; two runs was too small a control to catch that it had been broken.
**Budget:** opened **OVER** (49.2/46), the fourth consecutive over-budget open.

## Iteration 118 — each bird band counts its own: the lawn and the lane get their three back (2026-09-02) [People × Deepen]

**Brief:** b118 — the ground band's cap read `birds.filter(b => !b.plaza).length < 3`, so #106's roof birds and the belfry's flush filled it. Premise re-measured on HEAD first (`probes/ground-birds.mjs`, 12 seeds x 6 days, 7,744 daylight dry samples): mean present **0.05** ground vs **2.67** roof, **1.24** plaza; gate open 15.1%, and — the sharpest number — **100% of shut samples were shut on birds of another band**. Not throttled, evicted.
**Did.** One predicate. The band's spawn carries `ground:true` and the cap counts `b.ground`, the way the other two already read themselves. The crumb birds a tap scatters are tagged too — they *were* members under `!b.plaza`, so tagging keeps the old behaviour instead of quietly handing the band a second budget. No new source, no new draw site; +9 lines, all comment.
**Re-priced, not inherited.** Same probe, sweeping the cap once the count meant what it says: **0.33 at 2 · 0.41 at 3 · 0.39 at 4 · 0.40 at 5**. The knee is exactly 3 — 2 costs a fifth of the presence, above 3 buys nothing, because the limiter is now the **rate** `0.06*(0.5+m)`. Shipped: ground **0.05 -> 0.41** mean, **4.6% -> 34.0%** of daylight samples with a bird on lawn or lane; roof 2.67->2.71 and plaza 1.24->1.22 sit in reshuffle noise — the count changed, not the world.
**Gates:** census **PASS** (structure unchanged; planting churns as an `R()` reshuffle should) · shots wide/courtyard/east/lane clean, plus a pinned instant (seed 7, t=187.5) with three ground birds on lane and lawn · motion **FAIL on one flag**, `day/cart` 0->1 jumps, replayed on HEAD with `probes/cart-steps.mjs`: both builds median step **1.733**, max **3.9**. A cart trotting, not a teleport.
**Verdict:** shipped
**Surprise:** the cap was never the throttle it looked like — fixing membership moved the binding constraint to the rate in one step, and the whole 2..5 sweep lands inside 0.08 of a bird. A brief that had only raised the *number* would have measured nothing and concluded the band was fine.
**Law:** when a cap's membership predicate is wrong, re-price the cap AFTER fixing it and sweep both ways — a ceiling that was binding through a bug is usually non-binding once the bug is gone, and the number to keep is the knee, not the old one and not a bigger one.
**Budget:** opened **OVER** (50.9/46), fifth consecutive. `state.json`'s inventory is 16.4 KB, now the largest line item — bigger than LAWS.md.
