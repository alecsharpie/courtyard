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
