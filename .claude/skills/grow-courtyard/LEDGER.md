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
