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
