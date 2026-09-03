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
