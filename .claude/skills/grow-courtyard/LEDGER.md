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
