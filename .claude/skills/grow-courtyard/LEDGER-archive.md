# The Courtyard — ledger archive

Entries rotated out of `LEDGER.md`. Append-only. **Only the manager reads this** —
a worker that opens it to "catch up" spends its whole context on history.

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

## Iteration 183 — the plaza's second act has no leak (2026-09-04) [Plaza & quay × Deepen]

**Brief:** b183 — c262, marked STALE: re-measure arm-vs-reach first.
**Instrument.** `probes/plaza-rung.mjs` (new): wraps `plazaVisit` AFTER `__reseed()` (asserts it
fired) and reads the six `R()` it draws, so each clause of the choice is counted in its own order;
deaths are taken AT THE EDGE, since `routeToExit()` rebuilds `wp` and a post-mortem reads
`i:2 wp:2` for every corpse alike.
**Measured**, one probe, 5 seeds x 14 d, three PINNED refs (#171 `94feea8^` / #172 `2099f26^` / HEAD):
offers 35/20/37 · door shut **0.0/0.0/0.0%** · coin 45.7/65.0/32.4% · no alt kind 0/0/4% · ARMED
19/7/24 · first stop made **100%** everywhere · REACHED-of-armed **63.2/57.1/58.3%**.
**The premise is dead.** No gap: the conversion never moved, and c262's own 13/6 is not reproducible
on the build it was taken from (19/12 there). VOLUME moved — #172's allotment rung sits above the
plaza band in the same `roll` ladder and halved its offers 35 -> 20; #173 took them to 37. The coin
is a fair 0.5 on n 20-37; the sky is **7 of 7** deaths (rain 4, `skyLifts` 3), each with route
and clock still left.
**Did.** One line: the end block's `else` nulls `a.stop2` with `a.pheld` — 7 of 24 armed walkers left
the frame still armed, against the comment above it. Ladder bit-identical after; strandeds 7 -> 0.
**Gates:** census unchanged in EVERY field (no new `R()`) · motion · 4 shots — PASS
**Verdict:** shipped
**Surprise:** #160's fourteen-place door has refused **0 of 92 offers, ever**.
**Law:** a conversion is not a leak until the DELIBERATE refusals are subtracted — a fair coin and a
weather guard were 100% of this one. Price the numerator's VOLUME, not the ratio.

## Iteration 184 — the surplus is standing on the pavement (2026-09-04) [Lane & market × Connect]

**Brief:** b184 — `sold` goes nowhere; give the market's output a destination.
**Half the premise is dead.** `sold` is a local — what the boards can SHOW — and it IS drawn, by
mkShelf→mkBoards→drawMarketStall. The leak is one line up: the store hands the market a **median
53.1 units against MK_CAP 18** (51 mkts), **three stalls open on 86%**, and mkTotal 0
**cannot happen** (min 0.7) — the February test is unreachable. A probe killed my first design
too: shoppers carrying it off is **0.72 browsers a market, median 0** at the arrival edge. The
crowd is the bound, not the shelf.
**Did.** `mkOver` + `mkCrates`, cut from `mkUnits` exactly as `mkBoards` is; `drawMarketOver`
stands them on the footway, **two high, never three** — a third rises to the trestles' row.
**Measured** (`probes/market-over.mjs`, new): crates **0.67 spring · 1.87 winter · 5.33
summer · 11.44 autumn**; same-code control **0 px, every size**, glut **987 px**, a
0.7-unit market **0** — 10.4x the ink of all 18 pitches.
**Gates:** census unchanged in EVERY field (no new `R()`) · motion PASS vs a HEAD baseline · 4
shots · timed by hand at 1% of a frame; `perf.mjs` cannot see a 1-in-4-day pass
**Verdict:** shipped
**Surprise:** my own diff probe read a **750,000 px control**. Entered without `?t=`, and `__warp`
ADVANCES — three calls to one "pin" landed on three days. Pinned, it was still non-zero and GREW
per redraw: `drawScene(simT, 1/30)` steps per-frame phases, so draw 1 vs draw 3 is not one
picture. dt 0 took it to exactly 0.
**Law:** a redraw is not a re-read — a draw pass given a dt ADVANCES what it draws, so N draws of
one pinned state are N pictures. Pin dt to 0 or a same-code control carries the drift.

## Iteration 185 — the bonfire's sentence is true, and its fire count cannot resolve a build (2026-09-04) [Cross street & allotments × Fidelity]

**Brief:** b185 — c268: make BON_K's comment true, and bound the 37-vs-44 swing #178 left unpriced.
**The claim SURVIVES.** `probes/bonfire-gates.mjs` (new) takes the OFFER analytically (`hash()` is
unseeded, so one page IS every seed's calendar) and the GATES live: `bonfireWeather()`'s two call
sites are told apart by `bon.day === day`. **7 shed days in every year of 12, 5 or 6 offered
(mean 5.58), share 0.798 vs BON_K 0.8; the weather takes 0.674** — both numbers right.
**What it never said is that it is TWO gates**, the WIND at both: the WINDOW refuses 50.0% (rain 6,
wet 9, **wind 49**, snow 2, in the predicate's own order), the MATCH 34.8% (**23 of 23 wind**), and
`!skyLifts(a)` has refused **0 of 66**. 43 fires / 24 seed-years = 1.79 a year. Comment rewritten
to that; two independent counts agree (43 match records, 43 `bon.on` edges).
**Gates:** census PASS, unchanged in EVERY field (comments only) · 4 shots · motion n/a
**Verdict:** shipped
**Surprise:** the brief told me to read `probes/bonfire-year.mjs` first. It has **thrown on every
run since #178**, which deleted `bon.lit` out from under its `toFixed`. Fixed by latching the lit
time on the `bon.on` rising edge. Dead seven iterations; nothing runs probes/.
**Law:** a count of a rare seeded event cannot resolve a build. #178's 36 -> 43 fires is ALL
reshuffle: on the identical 132-offer calendar the two builds disagree at the WINDOW on **36.4%**
of days — a gate whose logic neither touched — and per seed the set-outs swing 16 -> 10 and 7 -> 12
where the pooled six move 68 -> 66. Pool six seeds; read nothing into 1 sd of the binomial.

## Iteration 186 — the garden is given a roof to stand under (2026-09-04) [Courtyard & garden × New element]

**Brief:** b186 — a COVERED WALK on one range; it must be used, and in rain.
**Did.** `ARCADE`, the 20th tile: the NORTH range's inner two rows, two runs either side of the
gateway, 96 cells / 16 bays. GLASS/LEADS shape — WALL to `buildVolumes`, own cache fill,
`developed` counts it. Openings drawn LIVE over the cached facade off `archAtY`; folk clipped
to the UNION of a run's arches, so a walker is occluded by a pier, not deleted between them.
Entered at the gate mouth, never over the border (`arcWay`/`arcOut`): the far bay is 25 cells
of colonnade off and the walk IS the visit. `stroll` at LAWN_W 0.12; `arcShelter`.
**The zero that mattered.** People STOPPED in the garden while it rains, 6 seeds x 26 d, one
predicate on both files (probes/arcade.mjs): **HEAD 2 tick-people, cand 1212**. 80 took the
walk, 102 refused it as too far (ARC_RUN_TO live), 55 gardeners worked on.
**Gates:** census PASS, re-pinned (`tileKinds` 162 -> **171** in all 3 ages, `structures` +144,
ARCADE 864 out of WALL, `developed`/`green`/`edgeBeds` flat) · motion · perf · 0 POP.
**Verdict:** shipped
**Surprise:** the first shelter guard was `raining` and it was offered **7 people in 28 days**.
`skyLifts()` empties the courtyard on the thickening front ~11 s BEFORE the first drop; and the
loud edge is not the stop branch but `seatRefused()` — somebody who walked here, turned from
the seat they came for. Both, on `weatherComing() > SIT_REFUSE`: 7 -> 237.
**Law:** a weather-ended stay has two edges, the loud one the arrival's REFUSAL; and a face is
drawn only on a SOUTH neighbour, so a hole cut in any other side is unseen.

## Iteration 187 — the gate is given a winter to read (2026-09-04) [Sill & observer × Fidelity]

**Brief:** b187 — the census cannot see winter; add a reading without re-cutting the ladder.
**Did.** An ADDITION, never a re-cut: `WINTER` is the same 3 seeds x warp 1220, summed into a `winter`
block under its own `winterLadder`, off a shared `groups(cells)`. `LADDER` is untouched,
so every RUNLOG row stays comparable and an old baseline diffs the summer nine as before. Also
`--ref <rev>`. 1220 is the ice PLATEAU, not the cold: the freeze lags ~9 days and midwinter is
nearly its emptiest instant (`probes/winter-window.mjs`, new).
**Proved on two REFs, not on HEAD.** `#181^ -> #181`: the summer key IDENTICAL both sides, all 7
scalars — the commit that added the 19th tile kind moved nothing. Winter moves: tileKinds
**18 -> 19**, frozen **0 -> 1003**, margin **0 -> 2040**; #181^ prints WEAK, 0 of 0.
**c266.** Seed 42 is now **0 of 5** wet at seed-identity's pins, 2 of 5 at #175: the drift the cue
predicted, here. Only 99 of 15 seeds is wet at 3, so the default is `--seed 42,99` and the
exemption differs at 3 of 15 where 42 gave 0.
**Gates:** census PASS, nine cells byte-identical · winter noise 0 over two runs on a fresh pin ·
2 shots · motion/perf skipped, the page untouched. mapFlat reads it from here: `runlog.mjs`
carries `census.winter`, `stall.mjs` keys winter `tileKinds`/`margin`.
**Verdict:** shipped
**Surprise:** the ladder was the SECOND blindness. `__census().ice` has been in the page since #181
and `summarize()` folded it NOWHERE, so a winter ladder alone would have reported only a tile
count. Suspect the reporter before the sample.
**Law:** extend a gate by ADDING a row under its own ladder string, never re-cutting the one the
baseline travels with.

## Iteration 188 — the sky is given something to say, and the balloon a day (2026-09-04) [Sky, light & weather × Interaction]

**Brief:** b188 — make the sky answer the pointer; land c265's balloon.
**Did.** (1) `skyAt(p)`, asked **LAST** because the sun and moon are drawn **FIRST**; `balloonAt`
asked first, being drawn after every ground light. `skyHz()` is now ONE horizon for draw and hit
test. (2) The moon has a month, on the CALENDAR, so it is one moon in every seed. Its bite is no
longer OVERLAID — the disc is clipped and filled even-odd MINUS the shadow, so the unlit limb is
never painted and the halo behind survives. (3) `balloonDown()` fires BAL_FALL's own width **in arc**
early, so the descent FINISHES at the arc where the light falls back through the light
`balloonOut()` set out in. Drift 0.9 -> 3.4 cells/s + wind.
**HEAD -> cand, 6 seeds x a year** (probes/balloon-day.mjs, run on both): aloft **3.11 -> 0.35 days**
(max 3.12 -> 0.54); night samples carrying one **28.1% -> 0.00%**; flights meeting any dark
**61 of 61 -> 0 of 138**; ended by coming DOWN 0/61 -> 138/138; one every 10.2 -> 4.5 days.
Coverage (probes/sky-name.mjs, 648 px above the horizon x 4 hours): **1/648 -> 648/648**.
**Gates:** census PASS (reshuffle, no collapse) · motion PASS, and it now SEES the balloon, 0 jumps ·
filmstrip day+night 0 POP · 8 framings, a flight, a month of moons.
**Verdict:** shipped
**Surprise:** the band above the horizon is not sky. project() lifts z northward, so the spire stands
**19 cellH above hz** and the clock tower's cap 14: a fall-through with no exception would have
called the two tallest drawn things in the town "the sky".
**Law:** a fall-through answering for a screen REGION is bounded by what rises THROUGH it: ask the
solids first, off geometry that already describes them.

## Iteration 189 — the eaves are given a colony (2026-09-04) [People & animals × New CA]

**Brief:** b189 — the life domain's first new-CA: a colony of martins over the eave line.
**Did.** `roofBirdSpot` and `nestF` are a PERCH and a rate; nothing here was fabric a bird MADE.
`MART_CELLS` is the eave line read off drawFaceRow's own test (solid, south neighbour open, less
church and mill) — 217 cells, two of them terraces: rows 2 and 64. stepIce's three terms in
`caTick`: a FOUNDER (`hash(house)` gating `hash(cell)`, salted per world), a CREEP off the
neighbours ALONG the line, a CEILING off the eave. MUD is the weather — `wetF()` gates the build, so
a dry fortnight stops the colony where it stands. `martHere()` p 0.27..0.70, and unrepaired it is 0 by 0.88. Zero R() in the
CA. `drawNest` rides in drawFaceRow; `birds[]` carries the martins on their own cap and roll.
**Measured**, 6 seeds x 2 years (probes/mart-{year,mud,mass,birds}.mjs). CURVE 0 -> plateau 33..94
-> 0, empty in autumn and in late winter 6 of 6. CLUSTERED: mean run **9.7..16.3** v a uniform
control at the same count on the same line, **1.26..1.78**. DRAWN: FULL minus FULL-with-`mart`-zeroed
is 371..776 px at 1600x950 on a same-code floor of **0**, 0 px empty. **0 of 682 clinging birds off
a nest.**
**Gates:** census PASS (`martinNests` 158, `eaveLine` 1953, winter 0) · motion PASS · perf +0.0% ·
filmstrip 0 POP · 6 framings.
**Verdict:** shipped
**Surprise:** the mud gate can starve a whole year. Two seeds of six saw **0 wet ticks of 1685**
between the birds arriving and leaving — no rain at all in season — and those eaves stayed bare for
the town's whole first year.
**Law:** the census's three ages equalise WARMTH, a cosine, so they sit at TWO phases: a season not
symmetric about midsummer reads on ONE cell of three.

## Iteration 190 — a visit at a window is offered inside the lamp's own hours (2026-09-04) [Roofs & skyline × Connect]

**Brief:** b190 — c275: a lamp goes out under a figure at s = 0.4
**MEASURED** (`probes/pane-truncation.mjs`, new: a RUN is a maximal stretch where `paneFigure` != null,
each sample also asked `windowLit`). Of **807 visits a year**: 158 CLEAN, **68 CUT SHORT** (half of
themselves, worst 97%), 55 LATE, **527 UNSEEN** (dark room all evening). **80% thrown away.**
**Did.** `lampBurn(sa,sb)`: windowLit's own body lifted out — this pane's evening burn `[on,off)`,
HOMES and all, written onto `windowHours()`'s fresh object so no other caller sees it. windowLit reads it
(lit/night **10.61 -> 10.61**: the lamp did not move). `paneFigure` reads it too and solves the
LENGTH before the hour, the last set-out being the one that finishes:
`t0 ∈ [max(FIG_T0,on), min(FIG_T1, span-0.8, off) - dur]`. After: **0 CUT, 0 LATE, 0 UNSEEN**.
**Re-priced.** Every accepted coin is now a WHOLE visit: density 0.91 -> **1.64**. `FIG_SHARE` 0.32 ->
**0.16** holds #182's hand-tuned look: **0.98 of 10.61** v HEAD's 0.91 of 10.61, 59/17/9% at 0/1/2 v
57/18/12. (The brief's 1.17 of 13.05 is #182's own, pre-drift.)
**Gates:** census PASS (unchanged: render state) · motion PASS · filmstrip 0 POP · 5 framings · look
probe 122 px on a 0 px same-code floor (HEAD 77) · perf skipped
**Verdict:** shipped
**Surprise:** the bug the brief named was the small half — 68 truncations against 527 visits offered
into dark rooms. The two clocks did not merely disagree at the END; they barely overlapped.
**Law:** two clocks over one subject: the one owning its EXISTENCE bounds the other. And a hand-tuned
SHARE prices the YIELD — a fix making each accepted coin pay must re-price the coin.

## Iteration 191 — the ledge reads the year and the weather (2026-09-04) [The sill & the observer × New element]

**Brief:** b191 — drawSill's one world input is `daylight`; make Feb and July two pictures.
**Did.** Six readers off `seasonPhase`, closed both sides: `gerLeaf` (stubs at 0.10
through the cold, never 0), `gerBloom`, `gerDrop`, `sillFrost`, `sillWet` (wetBucket x windF: the
wet is the town's, the REACH the wind's), `sillSnow`, `sillCup` (a salted per-day hash, likelier in
the cold, a whole day at a time so nothing can pop mid-afternoon). Stems, leaves and umbels
inside sillBoxes' unchanged box; rime, a snow lip and beads on the OUTER edge; what it drops lies
on it. `sillAt`/`gerName` name pots, cup and ledge FIRST in `lookAt` (c282). All of it stays in the
ground cache, reading only what it repaints for.
**Measured** (`probes/sill-calendar.mjs`, new), seed 7, hour 17.0. Feb v Jul in the band at
1600x950: **NEW 50200 px v HEAD 39964**, same-code control **0**. NEW v HEAD at ONE
instant **@Feb 9859, @Jul 638**; ABOVE the band **0 px, every size**.
**Gates:** census PASS (unchanged) · motion · filmstrip 0 POP day and night · 6 shots · rebuilds
**76.03 -> 76.03/day, 0.0%**, causes identical.
**Verdict:** shipped
**Surprise:** the isolation is **15:1 winter to summer** — HEAD's nine-leaf pot already WAS the
summer plant, and the sill lacked every other month. And my cleanest control failed by
design: pin `daylight` and HEAD's strip STILL moves 10638 px from February to July, because the band
is composited under `applyLight`, whose sun colour is seasonal. The function read one input; the
picture never did.
**Law:** a cached layer's inputs are not its PICTURE's inputs — what is composited over it after
the blit is an input too. Price a "reads nothing" premise on PIXELS, not the function body.

## Iteration 192 — the waterline moves with the year (2026-09-04) [River & far bank × New CA]

**Brief:** b192 — give the channel a LEVEL. Attempt 1 left 174 lines uncommitted; that design is
its own. I audited it and fixed two defects.
**Did.** `riverLev()` = greyF()'s cosine run `RIVER_LAG` 0.075 of a yr late, cashed by `stepBank()`
against `bankBed[]`, a hashed bank height per cell — negative in the channel, positive on the bank.
`BANK_CELLS` is #181's margin re-read as HEIGHT. New tile `SHOAL`, in neither `water` nor `green`;
`onChannel` widened so a lap is river to the cache.
**Defects.** (1) A REED cell flipping to SHOAL lost its rushes from the item loop — while REED_RUNS,
static since the sow, cast their image into the water still — and froze its stage (`blooming` +3);
`reedHere(i)`. (2) The BARGE ran aground: reedKeepOut clears the length she LIES alongside, not the
column she RUNS; lane cleared, 103 -> 90.
**Measured** (`probes/river-level.mjs`, new; 6 seeds x 26 d). A CURVE: shoal 0·0·0·0·6·25·40·50·**53**·
50·41·29·8·0…, lap peaking 26 at day 21; most cells crossing in ONE tick **3** (#181's 13). Uncovered
**9 of 27 days, exactly 0 on 18**; 0 entities on mud.
**Gates:** census PASS (summer `water` -72, `green`/`developed` UNCHANGED; winter SIDE -78 -> WATER
+78) · motion · 0 POP · frame-diff **0 of 1,054,852 px at the anchor** · look 2049/1417 px on a 0 px
floor · repaints +3.7%
**Verdict:** shipped
**Surprise:** the brief said the census could not see the low end and told me to say so in my own
words. It can: the three ages sit at two phases symmetric about midsummer, but riverLev is LAGGED,
so those two are no longer one number and the strand reads on one cell of three.
**Law:** #189's, backwards — a symmetric ladder CAN see a term whose extreme is off midsummer.

## Iteration 193 — the market's size tracks the year (2026-09-04) [Lane & market × Deepen]

**Brief:** b193 — re-measure the supply MK_NEED is set against; set the rungs on it.
**Measured** (`probes/market-need.mjs`, new; 6 seeds x 4 yrs = 156 markets, AT THE LATCH). Supply **0**, p25 20.0, MED **51.5**, p90 100 — #184's are stale both ways: 3 stalls on 82% not 86%,
and mkTotal **0 IS reachable** (8 of 156 under 2 units).
**Did.** `MK_NEED = [0, 2*MK_GOODS, 2*MK_CAP]` — two board-loads for a second trader, two market-loads
for a third. 4 and 13 were #30's quartile and median, and #172's crew has since doubled the store, so
both sat under today's p25. Mean pitches open, midwinter -> late autumn: 2.79 1.92 2.13 3 3 3 3 3
-> **1.88 1.25 1.58 2.92 3 3 3 2.75**; three-stall markets 82% -> 62%. Then the couplings a live rung
woke: capacity was the three pitches that EXIST and is off mkOpenCount() now (a control differing in
only that strands **5.2 units a 2-stall market**, candidate 0.02); and `tapCallers`, which stood the
evening trader down with stall 2, takes the last that traded.
**Gates:** census PASS (reshuffled — that trader walks every market now) · motion · 0 POP day and
night · lane, day 22, one seed: HEAD's three thin boards [5,5,5] -> two full [6,6,0], pavement bare.
**Verdict:** shipped
**Surprise:** the crate-spot guard for the same coupling measures **exactly 0** — 1343 footway cells
with and without: a market thin enough to close a pitch carries 3 crates at most, and the first 3
spots belong to the first 2 pitches.
**Law:** making a DEAD constant live wakes every coupling keyed to what it gated — capacity, a spawn
and a draw site all assumed the full set. Re-price them all, and spell a rung in the system's OWN
units, never as a quantile of a distribution that moves out from under it.
## Iteration 194 — the plaza gets a day of its own (2026-09-04) [Plaza & quay × New element]

**Brief:** b194 — a market, a concert, a bonfire and a cart on the calendar; the plaza none.
**Did.** `isFairDay()` = `hash(day, 907 + WIND_SALT) < 0.2`, ~5 days a 26-day year, salted.
`fairF()` is the concert's shape (up 1.6 h, hold, down 1.5 h) on hours off the sun and drives
all of it: `fairDress()` garlands the fountain rim and hangs two bunting swags between the
plaza trees; the CROWD is the concert's model — 10 claimed `FAIR_SLOTS` on an ellipse north and
south of the basin (13 cells of x: a full ring has nowhere to stand), own tick, own rate, own
budget, and nothing out of `PLAZA_PLACES` — a band in that ladder is a share, not a source.
In by the alley, priced like the families.
**Gates:** census PASS (the diff is the new `R()`'s reshuffle) · motion PASS · 4 shots + Plaza
camera + mobile · filmstrip 0 POP · dressing 2042/850 px on a same-code floor of **0 px**. `probes/fair-year.mjs`, 6 seeds × a year, 34 fair
days v 122: plaza presence in the window **15.51 v 9.81**, standers **3.00 v 1.35**; the pinned
ref `8682828`, on the SAME days, reads ×1.07 / ×1.43.
**Verdict:** shipped
**Surprise:** over 2 seeds × 8 days the fair "pulled" +40% into the LANE and the COURTYARD —
clean and wrong. Its days fell late in that run and this town RAMPS (maturity, `day >= N`), so
the comparison read the ramp. Over a year both go flat. Not noisy — biased.
**Law:** a per-day event judged against "the other days" of a short run reads the town's own
RAMP as its effect — pool a YEAR, and label the days from PRIMITIVES so a pinned ref labels the
same ones.
**Cue:** 4 of 34 fair days filled 0 slots — `fairGathering()` refuses on `raining` and that is
the only window, so a shower at the raise costs the whole day.
## Iteration 195 — how much of the shelf still runs (2026-09-04) [The sill & the observer × Harness]

**Brief:** b195 — smoke-run every probe; the NUMBER is the deliverable.
**Did.** `probe-smoke.mjs`: every `.mjs`/`.sh`/`.py` probe spawned with a timeout, N-way
→ PASS / THROW / TIMEOUT, timeouts split `partial`/`silent`. Manager cadence, not a gate.
**The number** (75 s, 7-way): **361 instruments — 230 pass, 35 throw, 96 time out**, 58 of
the 96 partial. skill 283 · root 56 · scratch 23.
**THREE trees, not two.** The third is a *tracked* `probes/` at the repo root: 56 files, 36
iterations, **#191/#192/#193 landed there**, named by no doc. SKILL.md's "`git mv` it into
`probes/`" is correct for the WRONG tree from the repo root; it now spells the path out.
**One cause owns 9 of the 32 .mjs throws:** `spawnSync git ENOBUFS`. courtyard.html crossed Node's
1 MiB default `maxBuffer` at **#181**, so every probe shelling `git show HEAD:courtyard.html`
without raising it has thrown for 13 iterations — the *control* pattern LAWS.md mandates, dead
across the shelf. Fixed the 2 where `maxBuffer` sat as a 3rd arg `execSync` never reads.
**Gates:** census PASS · visual PASS. HARNESS — courtyard.html is byte-identical to HEAD, so
`srcChanged:false` is expected.
**Verdict:** shipped
**Surprise:** `probes/README.md` closed this bug at **#11** — "There is one `probes/`, and this is
it." It held 102 iterations, reopened at #113, and has sat in the winning tree denying the loser
since. `bonfire-year.mjs`, the brief's motivating corpse, **passes**: #185 fixed it.
**Law:** an instrument is a build artifact too — nothing runs the shelf, so a probe breaks silently
and stays broken, and the cause is usually not the probe but the ARTIFACT crossing a limit it never
named. Smoke a control before you trust it.

## Iteration 196 — a moon to see by (2026-09-04) [Sky, light & weather × Connect]

**Brief:** b196 — #188 put a month on the calendar; no light in the town could see it.
**Did.** `moonLight()` = moonLit × ALTITUDE × (1 − cloudCover), RAMPED off nightF and gated on the
DISC's own `daylight`. INSIDE applyLight's night multiply, signed about MOON_REF so both ends open.
Then `drawMoonSheen()` in the screen pass — water, ice, snow, wet paving, the near slates — off the
GRID via cellRuns().
**Pivot MEASURED** (moon-light.mjs, 6 seeds × a lunation): mean **0.162**.
**HEAD → cand, same instants** (moon-night.mjs, 3 seeds × a lunation, 1,062 frames): mean **47.94 → 48.30 (+0.75%)**, RANGE **75.7 → 79.0**, **715
darker, 340 brighter**; new under cloud 49.71 → **45.23**, full and clear 38.43 → **57.44** (sd
20.9 → **29.2**). CONTROL, one instant, only MOON_START moved: **33.3 → 51.5, ×1.55**. The DAY frame
is **0 of 778,752 px** off HEAD; that test at night, 21.4%.
**Gates:** census PASS (unchanged — zero R()) · motion PASS · filmstrip 0 POP · 8 framings · not
in `lightNow()`: 98 ground rebuilds/day on BOTH builds.
**Verdict:** shipped
**Surprise:** the slate pass cost **2.641 ms of a 5.8 ms night frame — 47%** — and perf.mjs read
+0.0% straight through it, vsync-locked at 16.70. Not the arithmetic: baking every corner height
into a Float32Array changed **nothing**. It was 5,475 canvas path calls. The camera is still
on **599 of 600 frames** of play, so a Path2D keyed on project()'s own seven terms: **0.001 ms**.
**Law:** a lift taken out of a multiply's ALPHA moves every channel toward the un-multiplied
source, so it WARMS — only the COLOUR lifts and cools at once (50% off alpha: blue/red 1.27 v
HEAD's 1.90). A per-cell overlay's cost is the PATH BUILD, not the fill.

## Iteration 197 — the allotments are allowed to go over (2026-09-04) [Cross street & allotments × New CA]

**Brief:** b197 — a weed CA on the beds, founded on a cell fallow past some age.
**Premise half wrong** (allot-neglect/allot-age.mjs, 6 seeds x a year). bAge on an EMPTY bed
— the clock the brief named — counts DOWN: over 437,580 cell-samples its **max is 19.98 s**,
and it stands on 2.48% of them. Nothing is ever fallow *past* an age. Its OTHER branch, on a
PLANTED cell at its ceiling, counts UP unbounded and is cleared only by plotAct's weeding
rung — **max 232.8 s**. Right array, wrong half.
**Did.** `rank[]` in caTick beside the moss: FOUND on weedAge(i) (42..120 s, hashed, salted),
CREEP 0.5 along the drill / 0.22 across, SHADE off bSt, WORK off a climbing crop, COLD off
warmth. **Zero R().** The hoe rung goes FIRST in plotAct: the rung beside it fires **5x in 6
seed-years** — `up.length` takes almost every visit. Drawn in the GROUND CACHE with the moss.
**Gates:** census PASS (rankBeds 287, winter 0) · motion PASS on a HEAD-pinned baseline ·
filmstrip 0 POP · 6 framings · rebuilds and drawGround flat, interleaved. MASS **1,658-2,894
px at 1600x950**, same-code floor **0 of 18 rows**. SPREAD, peak quarter: **77.9%** of frames
hold 3+ clean plots AND 3+ gone right over.
**Verdict:** shipped
**Surprise:** WEED_WORK is the whole build. Without it the block goes **uniformly rank** — 66%
of plots pegged at the top, the middle bands empty — as dead a picture as uniformly tidy, just
inverted. What makes it read is that the HARVEST CYCLE holds weeds back: a plot being lifted
and re-sown is ground being worked, and one nobody reaches is not.
**Law:** a "nothing shows X" premise names a STATE, usually on the OTHER BRANCH of the array
named. Price both halves before calling a system absent.

## Iteration 198 — the rain stops shutting the gate (2026-09-04) [Courtyard & garden × Connect]

**Brief:** b198 — c279: the garden's inflow should read the weather.
**Neither named bound was the bound** (lawn-weather.mjs, 6x26, every sun-up tick classed
fair/coming/RAIN): rain is **11.7%** of the sun's window, `lawnOpen()` true on **0.0%** of
it, **0 of 1,221 set-outs**. Not the cap, not the rate — `!raining`, carried since #95,
when nothing in the garden had a roof.
**Did.** (1) `lawnAdmits(k)` = `lawnRoofed(k) || !raining`, asked at the CHOICE in
spawnLawnAgent; `lawnOpen()` keeps only the sun, so in rain the kind list is the arcade
alone. (2) `LAWN_WET 0.35` on `lawnRate()` — the SLACK bound: a wet tick is at LAWN_CAP
**10.8%** v a fair one's **27.0%**. Swept on the AXIS, six settings, in the source.
**Ref -> cand:** under the walk **0.404 -> 0.763 people per rain tick** (arcade.mjs); four
there at once in rain, **day 139 -> day 13**. #186's stroll-weight control 0.20/0.12/0.07:
**474/480/479 -> 514/490/501** (#186: 495/491/488) — new inflow, not off the benches. Fine
days untouched *exactly* (lawn-dry.mjs): rain held off, **6/6 seeds byte-identical over 12
days**, census too; rain left in, **0/3**.
**Gates:** census PASS · motion PASS (HEAD-pinned) · filmstrip 0 POP · 4 framings + the
arcade in rain · #168 lawn-dark flat per visit.
**Verdict:** shipped
**Surprise:** the gate was not it — the VISIT was. An arcade stay is released by the
weather (`a.arc`), not a timer, so at an unchanged rate a wet courtyard came out **fuller
than a fine one, 4.25 v 4.15.** A roof does not only admit people, it holds them.
**Law:** a place whose stay ends on a CONDITION turns inflow into presence at a different
rate from its timed neighbours — price presence as rate x visit before choosing the rate.

## Iteration 199 — somebody in the room before dawn (2026-09-04) [Roofs & skyline × Deepen]

**Brief:** b199 — c283: #190 fixed the EVENING burn; windowLit's sunrise branch was never
offered a paneFigure, so first light was lit panes with nobody in them.
**Premise** (`probes/pane-morning.mjs`, new, on HEAD): **4.55 lit panes** per pre-dawn sample,
**0 visits a year** — a third of the evening's lit population, not the two I guessed.
**Did.** (1) `lampBurn` gains `[rOn, rOff)` — the early-riser test lifted out, in the night's
units: `t = span - D + s`, `D = dawnEdge() - sunUp`, which `rOff` cancels exactly.
windowLit reads it: **0 disagreements over 2,595,892 pane-samples** (9.8% lit: not vacuous).
(2) One visit is offered over that burn — no band to intersect, the burn IS the offer, so only
the LENGTH is solved before the hour; `paneWalk()` factored out, told apart by `k = FIG_SLOTS`,
so the evening's coin is untouched. (3) A 9.4 h midsummer night leaves the evening band open at
that pane's `rOn`, so `mLo = max(rOn, hi)`: the morning starts no earlier than an evening visit
must END by, disjoint by construction.
**A year:** MORNING 0.006 -> **0.641** figures/sample of 4.55 lit, **0 -> 182** visits, nights
with one **0 -> 87/104**. EVENING identical: 1.152 of 11.95, 886 visits.
**Gates:** census PASS (render state) · motion PASS · filmstrip 0 POP · continuity 0 swaps both
sides · look 199 px on 0 px
**Verdict:** shipped
**Surprise:** the continuity gate reported **754 swaps/yr on HEAD** before I priced its
threshold. u moves 1.08 in 0.24*dur on the exit leg — 7.5 u/h — so 0.4 per 0.1 h flagged the
walk's own fastest phase. The instrument, not the build.
**Law:** a jump threshold is priced off the subject's FASTEST phase, not its mean; a swap only
SHOWS if both ends are inside the aperture.

## Iteration 200 — the lap freezes with its channel (2026-09-04) [River & far bank × Fidelity]

**Brief:** b200 — c286: `ICE_CELLS` is built from `onChannel()` at BUILD time, when the towpath's
first column was still SIDE. #192 widened `onChannel` so a winter lap is river; the list was frozen
already, so the water the flood lies over could never take ice.
**Premise, HEAD** (`probes/lap-ice.mjs`, 3 seeds x 3 warps): **26 lapped cells, 26 of them against
ice over ICE_SET, 0 in ICE_CELLS, 0 carrying any skin.**
**Did.** (1) `buildIceLap()`, once, after `buildBank()`: 35 cells read off BANK_CELLS
(`bankWas === SIDE`), never re-derived. Shelter 1.0, distance transform untouched, so every existing
`iceShel`/`iceTop` is byte-identical: it ADDS cells, it does not re-cut them. (2)
`iceHere(i)`, the one live test — step, `riverSkin()` and census all ask it, so `margin` is what was
walked. (3) `stepBank`'s `if (t === ICE) continue` was the coupling, now the STRAND's guard only: the
level owns a lap cell, skin and all, and water off the path clears `rice[i]` in the same tick.
**Gates:** census PASS, pre-edit baseline — **summer nine byte-identical**; winter ICE +57/WATER
-57, margin +78 · motion PASS incl. `night` (warp 1230), HEAD-pinned · 0 POP · look
**1324-1343 of 1805 lap px on a same-code floor of 0-24** · `lap-year.mjs` **0 violations**, 137/858.
**Verdict:** shipped
**Surprise:** frozen +19/+17/+21 is exactly the lapped cells iced. I expected the new neighbours to
feed `iceNb` and push the old margin's front in; not one channel cell crossed ICE_SET that had not
already. The front was at its ceiling.
**Law:** a build-time list derived from a predicate is a HOSTAGE to it — #192's widened `onChannel`
silently un-completed a set frozen at #181. Grep a widened predicate's READERS, not its callers.

## Iteration 201 — a terrace that is somebody's with nobody on it (2026-09-04) [Our block & the leads × Deepen]

**Brief:** b201 — price how often a tenant is up on the leads, then give the terrace FABRIC.
**Premise** (`probes/terrace-presence.mjs`, new, HEAD, 6 seeds × a year, 10,362 daylight samples):
**0.2102 tenants a sample, 18.57% with anybody up** — four daylight moments in five the frame's
foreground quarter is bare, and the supply is six bays, not the cap.
**Did.** `leadsKit(bay)`, every branch hash(house): pots, a crate stack, a chair, a mat, `tidy`,
`wash`. No two of six alike; 23 pieces. `drawLeadsFabric()` is in the GROUND CACHE before
drawRoofFurn so the cords hang over it, and reads only what that cache already repaints for:
`potLeaf`/`potBloom` closed both sides of seasonPhase, `chairTip()` a SCALAR folding the chair onto
its own seat as the wet and cold come in, litter that GATHERS into a corner. `freeBay(k, want)` pegs
only where a line hangs; a sun stay takes the chair.
**Gates:** census/motion PASS · 0 POP · drawGround **+0.20 ms on 27.1**, no new dirty reason ·
`probes/terrace-mass.mjs` **424/483/343 px at 1600x950, 104/131/77 at 390x844** on a same-code floor
of **0 px every row** · northmost drawn point **85.14** on the 84.93 bound · presence 0.2029 / 18.26%.
**Verdict:** shipped
**Surprise:** the fabric is FREE to the seeded world and it was PROVABLE. `probes/terrace-identity.mjs`
censuses the build with its one behaviour change backed out against HEAD: **6 field diffs over 3 seeds
× 300 s, all the new field and its subtotal.** Every other number in the histogram is
`freeBay`'s filter, one refused spawn.
**Law:** a cached draw is free to the seeded world, so a build with its one BEHAVIOUR change backed
out must census IDENTICALLY to HEAD but for its new fields.
## Iteration 202 — the martins get a second mud source: the river's strand (2026-09-04) [People & animals × Deepen]

**Brief:** b202 — the mud is on wetF() alone and two worlds in six see no rain in the birds' season.
**Priced first** (probes/mart-mud.mjs, 6 seeds x 2 yr): first-season integral 0, 8.1, 55, 64, 214, 222;
year-one peaks 0, 1, 24, 39, 63, 126. Premise holds — 2 of 6 towns open bare.
**Did.** `martStrandF() = MART_STRAND_K * clamp(bankDry / MART_STRAND, 0, 1)`;
`martMudF() = max(rain-mud, strand)`. `bankDry` is stepBank's uncovered river bed — mud by
definition — and riverLev() is a CALENDAR, not weather: the same in every seed, 0 cells until phase 0.40, 43
at midsummer, gone by 0.72, in a window of 0.27..0.70 (probes/mart-strand.mjs, new). So a rainless
colony is founded LATE, at midsummer. K=0.07 off the strand's own season
integral (~760 -> 53), between the two thinnest years that already grew one.
**Gates:** census PASS (reshuffled: nests arrive earlier, so martSpot()'s R() draws move) · motion PASS · 4 shots + a midsummer pair v HEAD · filmstrip 0 POP · mart-mass
130-719 px on a same-code floor of 0 · mart-birds offNest 0/6 · mart-year: year-one peaks -> 20, 24,
45, 56, 61, 108, **6 of 6 colonies**, meanRun 9.0-41.7 v a uniform control's 1.27-2.17, empty in late winter 6/6, all back to 0 by 0.923.
**Verdict:** shipped
**Surprise:** the wettest world got no denser — seed 99's peak 126 -> 125 — while the thin ones
converged UP (42: 39 -> 76, 271: 59 -> 85).
**Law:** where one quantity has two sources take the MAX, not the sum: it lifts the starved tail
without moving the head, which a threshold cannot do. Size the second off the TAIL's own missing
integral, never the mean. A SEASONAL driver is the same in every world — that is what makes it an antidote to a weather coin.

## Iteration 203 — the moon shows on the sky's terms, not the sun's (2026-09-04) [Sky, light & weather × Fidelity]

**Brief:** b203 — the disc is gated on `daylight`, which OVERLAPS nightF. Measure the hole, close it.
**Measured first** (probes/moon-hole.mjs, new, HEAD, 6 seeds x a year): **792 of 6,690** samples with
nightF > 0.5 and the moon up drew NO disc — 11.8%, ~27 h a year, all at DUSK in moonArc's 1.4 h lead on
sunset; and the river carried the glitter column in **810** of them with no moon in the sky.
**Did.** `moonShows() = nightF > MOON_ON && moonAlt() > 0` — ONE predicate for the disc, moonLight(), the
sheen and the river's column; sun and moon stop being exclusive. The fault it turned up: moonCells() cuts
water/wet/snow off a `grid` that MOVES all year — 89 px between bakes, and a bake under ice loses the river
for good; stepBank/stepIce un-bake it now.
**Gates:** census IDENTICAL · motion · perf +0.0% · probes/moon-frames.mjs (new) **DAY 0 px off HEAD**,
NIGHT/LATE 0, hole 792 -> **0**, glitter -> **0** · filmstrip at the crossing: HEAD steps **2.392** on its
0.824 median, the build **0.429**.
**Verdict:** shipped
**Surprise:** the disc is drawn and cannot be SEEN — drawSunMoon paints BEFORE the backdrop blit, so all
through the hole it is behind the distance: its own 377 px move <=4.5 luma, and a full moon forced onto the
instant moves them 4.7. What the hour gains is the LIGHT, 216,782 px over 4 luma at 21:09, because
moonLight() returning 0 was never "no moon" — it was mk = -MOON_REF, the darkest there is, on every dusk.
**Law:** a gate opened on a DRAWN thing is not a thing SEEN — price it on the subject's own pixels at its
strongest phase, or occlusion reads as faintness. A term signed about a measured pivot has no "off": a 0
into it is a claim, and the extreme one.

## Iteration 204 — the fair's gathering is a budget of DRY hours (2026-09-04) [Plaza & quay × Deepen]

**Brief:** b204 — a shower over the 2.6 h at the raise cost the whole fair day. Make the fair survive it.
**Measured** (probes/fair-rain.mjs, new, 6 seeds x a yr, HEAD): 4 of 34 fair days filled 0 slots and **all four were
raining for 100% of the gathering**; two had >2.7 dry hours left. Then the WALK (probes/fair-walk.mjs, new):
gate to slot is **1.2-8.6 h, median 4.4** — #194's comment said 0.8-2.9, the straight line and not the route.
**Did.** `FAIR_GATH_H` 2.6 h of DRY weather, `fairGathSpent` never refunded, so the offer still ENDS. The far end is no
longer a clock: `fairFits(s, plane, speed)` prices the route this walker will walk at the speed they will walk it (the
town's own `pathHours`), and takes a slot only if the arrival lands with FAIR_STAND_MIN of fairF() left.
**Gates:** census PASS (reshuffled) · motion · perf +0.0% · filmstrip 0 POP · 4 shots. v a control RUN on HEAD:
zero-slot fair days **4 -> 1**, the one left winWet 1.00; fill 8.12 -> 8.41; fair-year plaza presence 15.37 -> 16.15,
standers 3.05 -> 3.12. Six FRESH seeds: 0 of 29. FAIR_STAND_MIN is live: standers 2.16 at 0.5
and **2.35** at 1.0; 3.0 puts the zero days back to 4.
**Verdict:** shipped
**Surprise:** the walk is most of the fair. Ten slots fill but only ~3 are ever STANDING — the rest are on their feet
in the corridor for four hours of a six-and-a-half hour day. The fair is mostly a procession.
**Law:** a weather gate on a FIXED window spends the window on weather it cannot use: make the budget the RESOURCE it
needs and the far end becomes the WALK, priced per arrival or the rescue arrives to nothing. A route's cost is not the
distance between its ends — a lead down a corridor and round a ring is twice it.


## Iteration 205 — the winter row gets a floor (2026-09-04) [The sill & the observer × Harness]

**Brief:** b205 — three instrument cues. HARNESS: `courtyard.html` byte-identical to HEAD.
**Did.** (1) **WCORE**, the winter row's own collapse floor off its own baseline, one tolerance per field,
`frozen`/`margin` off the `ice` block, which no scalar sees. Cut from DRIFT, not seed spread
(probes/winter-drift.mjs, new; #189->#204, six builds): worst downward step -0.3% grid, -0.9% frozen,
**-14.2% people, -13.2% planted**. (2)
`STRUCT_CONST`/`STRUCT_LIVE` + `constAudit()`, printed under every structure block, audited each run. (3)
`maxBuffer` on the last **10** unbuffered `git show :courtyard.html` captures — 8 tracked, 2 scratch tree.
**Gates:** census **PASS exit 0** · **the differential**, scratch worktree with #200's `buildIceLap()` call
commented out: HEAD's census exits **0**, this one **1** — `winter/frozen 1064->1014 (-4.7%, floor 3%)`,
`winter/margin 2118->2040 (-3.7%, floor 2%)`; at CORE's 8% that February break still walks · probe-smoke,
389/75 s/7-way: **247 pass, 36 throw, 106 t/out** (#195: 361/230/35/96), all 7 ENOBUFS throws gone.
**Verdict:** shipped
**Surprise:** fixing the ENOBUFS did not raise PASS at the smoke's own settings. All 7 run now — but 6 hit the
75 s wall at `--jobs 7`, and at `--jobs 4` every one **passes in 6.7-61.1 s**: they had never once been
allowed to run, so nobody knew they were long sweeps and not wrecks. And winter `structures` is **2427 of
2427 constant**, 100% against summer's 93%.
**Law:** an aggregate SUMMING two kinds of register is diluted by every constant added: report the constant
share beside the total, or a floor on the sum watches a number 93% frozen. A TIMEOUT is the RUNNER's
concurrency before it is the instrument's.

## Iteration 206 — the wide view gets a vertical intent (2026-09-05) [The sill & the observer × Interaction/UX]

**Brief:** b206 — give WIDE, the framing everyone lands on, an intent priced on `sillTop()` and aspect.
**Measured first** (probes/wide-frame.mjs, new; 12 framings): HEAD at 390x844 is sky **27.5%** / TOWN
**43.4%** / near slate **21.7%**. The premise's other half: town share is `WH*cellH/pic` and nothing else
moves it — `topPad` only splits the slack between sky above and apron below, so the sky never competed for
those pixels, the LEAN did. And no lean that keeps the courtyard puts the plaza in a phone.
**Did.** (1) `WIDE_AIR 19.6217`/`WIDE_KEEP 0.5` — the band `-AIR..WH` laid out by viewFor()'s expression at
s=1; `4 + 9.6*cellH` and the 0.82/0.5 spare are gone. AIR is solved on HEAD at 1600x950, so that frame is
**0.00% changed** (control floor 0.00). (2) `WIDE_FILL 0.60`/`WIDE_SPAN 54` — a tall frame leans in
until the world's rows cover 60% of the picture, never past 54 columns, never below HEAD's 2.1x. (3) the
centre walks west with the lean, off `gardenWest()` read off the GRID — HEAD cut 8 of the lawn's 40 columns
on every portrait framing, the lean alone would have cut 16.
**390x844: 22.5 / 52.0 / 18.0%, lawn 19..50 -> 11..50**; landscape and tablet scale untouched.
**Gates:** census PASS · motion PASS (HEAD-pinned) · filmstrip day+night 0 POP · where-faces, where-void and
follow-cam as HEAD.
**Verdict:** shipped
**Surprise:** the quarters are fitted in cellW0-INVARIANT units — s falls exactly as cellW0 rises — so
re-pricing the whole wide view moved three of the four fits **0 px**; only Courtyard's moved, s already
1.0175.
**Law:** a frame's share is a function of the ZOOM alone — padding decides where the slack goes, not how
much there is.

## Iteration 207 — the market spends its day (2026-09-05) [Lane & market × Deepen]

**Brief:** b207 — c287: `shelved` is capped at the open boards' capacity, so a half-stocked pitch is unreachable.
**Premise priced on HEAD** (probes/market-fill.mjs, new; 6 seeds x 4 yrs, 144 markets): `shelved == cap` on
**140/144 = 97.2%**, the four exceptions deep winter. It binds by CONSTRUCTION — MK_NEED's rungs
0/12/36 sit at or above the capacity they unlock. The cap is RIGHT; the rate was missing.
**Did.** `mkStock` = boards + crates (med 60), spent at `mkDemand()` = MK_SELL x the market's own SPAN x
(stock/MK_STOCK_REF)^MK_DRAW, front-loaded. Boards refill from the crates until `MK_LAST_OUT` 0.6, then sell
away — decoupling the afternoon from the glut. `mkDeliver()` makes #82's line true. Mean fill
**0.961 / 0.803 / 0.281** at a tenth, half, nine tenths of the span; **144/144 stand PART stocked** where
HEAD was 1.000 on all 432 samples.
**Gates:** census PASS · motion PASS (HEAD-pinned) · filmstrip day+market 0 POP · 4 framings.
**Verdict:** shipped
**Surprise:** the model landed and the PICTURE nearly did not. The board's back row was drawn at the same x
as the front, so half its ink was redundant and emptying from the top removed pixels nobody could see: 46 of
222 device px at 16:07 for a board 59% gone. Staggering the six pitches across the trestle
(probes/market-hours.mjs, new) took visible ink 222 -> 297 px and the loss to 87 px / 29% — readable
magnified, still slight at the shipping size.
**Law:** a control making an input EXTREME is degenerate where the quantity it feeds SATURATES — control with
the BRANCH replaced. `getImageData` ignores the ctx transform: a `project()` band is CSS px, not device.
**Cue:** the overflow crates carry more readable ink (420 px) than the three trestles (297).

## Iteration 208 — the ticker's slot stops moving, and stops cutting words (2026-09-05) [The sill x Polish]

**Brief:** b208 — c295: the ticker clips mid-word. Fix the SLOT, not the sentences.
**Premise, HEAD** (`probes/ticker-fit.mjs`, new; 240 sentences lifted statically out of the file and
rendered in its type; `--head` its control): at day 4 the box is 394.9 px at 1600 and
150 at 1024, the corpus median 346 and its max 756 — **64/240 and 208/240 cut MID-WORD**. 756 is
unreachable: the five fixed items and their gaps ARE the 1228 px sill.
**Did.** (1) `fitLine()` composes to the box — the last CLAUSE that fits, falling back to the last
whole WORD only when the tidy cut costs over `TICK_CLAUSE` 0.55 of the room. The rule is the SLOT's, so
it composes the next sentence written too. (2) The room is made CONSTANT, since a slot moving
under a standing line re-truncates it as it is read: `statsSlack()` holds back what the counts can still
grow into, and `#daytime`/`#season` got min-widths holding their longest labels. (3) The counts yield
at 1185 px, not 860; `#sill.lent` lends them to the invitation.
**Gates:** census + motion PASS · canvas **pixel-identical to HEAD** at three framings, sill height 53
· `ticker-queue` unchanged · mid-word at 1600/1280/1024 **64/62/208 -> 0/0/0**, room **374.7 fresh vs 374.4
at day 4**, 1024 150 -> 350.
**Verdict:** shipped
**Surprise:** the box was never the width I first measured. `#stats` breathes 83 px as the town fills
and the clock and season another 33 — `13ch` never held `Day 26 - Afternoon` — so it loses 99 px
between dawn and day 4, under whatever line stands there.
**Law:** `getComputedStyle().font` is the EMPTY STRING when a longhand cannot go in the shorthand
(`font-variant-numeric` did it): it assigns nothing and silently measures the previous face.

## Iteration 209 — the allotments answer their own weeds (2026-09-05) [Cross street & allotments × Connect]

**Brief:** b209 — c291: `rank` steers nobody, so #197's hoe fires only where a picker lands.
**Premise, HEAD** (`probes/allot-steer.mjs`, new; 12 seed-years, instrumented at the kneel): the brief's
half holds, at chance. The half not in it is bigger — of 234 landings that DID hit a gone-over plot,
**195 were taken by the LIFT above the hoe**. #197 put the hoe first in `plotAct`, itself the lower rung.
**Did.** (1) `weedPlots()`/`weedTarget()`: a `WEED_PULL` 0.6 share of BOTH target choices goes to the
plots over `WEED_HOE`, weighted by how far over. (2) `WEED_CHOKE` 4.2 — a row too rank to pick THROUGH
is cleared by the hand that lifts it: one kneel, both acts. The first cut had the lift REFUSE and come
back, which cost 20% of the harvest. (3) No R() spent — `weedRoll()` is hashed, `pickPlot()` still called.
**Gates:** census PASS (`rankBeds` 253→188, `rankPlots` 42→31, `harvested` +67) · motion PASS ·
`weed-spread` both-ends **78.0%→76.2%**, so #197's bimodal block lives. Clearings/yr **3.3→10.7**,
rank@land vs block mean **1.18×→1.80×**, harvested 212→197/yr — in the seed noise, 199 steer-only.
**Verdict:** shipped
**Surprise:** the control the laws ask for paid twice. Three switches backed out, the build censuses
**byte-identically to HEAD, 0 of 12 cells** — which first caught that `ALLOT_RANK`, a second arrival
source I had added as a MAX, was moving the world's weather for nothing, and then proved it **dead**:
10.7 clearings and 197 cells a year at 0.16, the same at 0 — the beds go over in the warm half the
crop ripens in, so `ALLOT_RIPE` is always above it. Cut.
**Law:** a second source taken as a MAX is dead unless its tail falls in a season the first is out of.

