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
**Did.** `paveWear[]`, feet on STONE, accrued in `stepAgent` as a *statement* — not another branch of the exclusive chain, where a cell holding litter would have skipped it. `PUDDLES[]` built once off the GRID ∩ lane ∩ cross street, fill threshold `hash + PUD_TROD·paveWear`, so a deep or trodden cell fills first and dries last. `drawPuddles()` live *before* `applyLight` (water at midnight *is* slate), `drawPuddleLights()` in the `screen` pass after. +90 lines.
**Gates:** all PASS; dry is bit-identical to HEAD, whole canvas. `perf.mjs` PASS but **blind — 16.70 ms both sides is vsync**; timed directly, `drawPuddles` is 0.94 ms at 560 pools on a 2.0 ms frame.
**Verdict:** shipped
**Surprise:** both failures were *uniformity*, at different scales. Flat-subtraction decay on an accumulator makes the map **binary** — a cell either out-earns the decay and pins at its cap or never leaves 0 — while proportional decay gives each cell an equilibrium proportional to its traffic, which is what a desire line is. And one per-cell hash scatters pools *evenly*, which reads as leopard print rather than water; a street has a **fall**, so the fine hash had to sit inside a coarse one over a ~4×2-cell dip before the lane grew dry stretches and the pools looked gathered.

## Iteration 123 — the working roof stops being invisible at half the framings we ship (2026-09-02) [Roofs & skyline × Polish]

**Brief:** b123 — #110's 24 pieces are covered by the sill at short windows; bound them in DEPTH and place them accordingly.
**Premise held; both of the readings the brief asked me to reconcile were right.** On HEAD, 3 of 24 pieces are off-canvas in x at every desktop size (11 on a phone — `ROOF_FURN[0]` sits at world x −7.5); of the 21 on canvas, **0 were visible at 1280x700 and 1200x720**, 21 at 1600x950.
**Did.** `furnRow()` solves each piece's row from a DEPTH target instead of stating it: step north from the eaves, take the first row whose deepest DRAWN point clears the bound, reading `nearZ` at the same `floor(y)` the paint and the pointer read. Deepest point is per kind (`furnEdges`). Bounded at BOTH ends, `FURN_DMAX` 81.70 / `FURN_DMIN` 79.15. Draw order is load-bearing now — parapet → furniture → dormers → party walls.
**Gates:** all PASS. Drawn whole and answering the pointer for itself at all five tracked framings: 21/21 on-canvas, against 0/21 at two of them on HEAD.
**Verdict:** shipped
**Surprise:** the band does not fit. Between the parapet and the shortest framing's sill there is 2.55 of depth, and a water tank is **2.549** of depth tall — six thousandths to spare, which is why the scatter had to become per-kind. The first draft, bounded only at the sill, put twelve pieces' tops over the lane's footway, where live walkers draw on top of them. And the census churned everywhere on a change with no `R()` in it: pinning only the landing board's coordinates back to HEAD made all nine cells identical — the perch moving with its loft changes where a bird stands, which changes whether a *later* spot is rejected for proximity.

## Iteration 124 — the morning fire stops burning on midwinter's clock all year (2026-09-02) [Sky, light & weather × Connect]

**Brief:** b124 — `drawSmoke`'s hearth term is `clamp(1 - |hour - 7|/3.5)`; key it on the sun and scale it with the cold.
**Premise held, and the hard-coded hour is worse than "a bit off".** 7.00 is *exactly* midwinter's sunrise here (`SOLAR_NOON` 12.75, `WINTER_HOURS` 11.5) — so HEAD was right in January by coincidence and three hours late in July, when the sun is up at 4.00. Sunrise runs **4.00 to 7.00**.
**Did.** `hearthF()` — one named definition, two consumers (the share of `CHIMNEYS` lit, each column's alpha). Morning term re-centred on `dawnEdge()`, solved at the instant it applies; half-width unchanged at `HEARTH_RUN` 3.5, so only the CENTRE moved. Height is the cold: `HEARTH_MIN` + `HEARTH_SWING`·(1−warmth) + `HEARTH_SNOW`·snowCover. Rain and the evening term copied through untouched.
**Gates:** all PASS, all six census groups unchanged (no new `R()`). Mean |peak − first light| across the year **1.26 h → 0.12 h**; at each build's own peak midsummer lights 24/27 stacks (07:00) → **5/27 (04:24)**.
**Verdict:** shipped
**Surprise:** the brief asked me to scale the fire by warmth *and* `greyF()`, and they are one axis — `greyF()` **is** `1 - 2*warmth`, so doing both would have squared the year rather than reading it twice. The season enters once; the honest second axis was the weather of the *day*, and `snowCover` is the one that says "cold house" when the calendar does not.

## Iteration 125 — the biggest thing in the picture stops being one flat quad a cell: the near block is slated (2026-09-02) [Roofs & skyline × New CA]

**Brief:** b125 — retire the near roof's flat fill; slate courses, staggered laps, per-slate variance, and let the surface AGE. Full entry in LEDGER-archive.md.
**Did.** `drawRoofRow` forks at `LN_WALK_S`. `slateRun` walks a lattice GLOBAL along the row, so a slate straddling a cell edge is two halves of one tone — subdividing per cell only rebuilds the boarding at finer pitch. Courses lap DOWNSLOPE (north on 79-83, south on 84-87), gapped at the tail only; that gap is the lap shadow. Ageing is per SLATE: lichen (fine hash gated by a coarse batch over a `damp` map), soot under the stacks on a per-stack prevailing lean, a slate replaced or slipped, snow lodging course by course.
**Gates:** census PASS, six groups unchanged (no new `R()`) · motion PASS · visual PASS at four framings and 390x844 · frame-cost 3.11→3.40 ms summer, 3.01→3.58 winter, rebuilds identical. `probes/near-roof-texture.mjs`: band sd 11.3→**20.3** at 1600x950, 9.0→**19.5** at 390x844; changed share **74/81%** on a same-code floor of **0.0%**; band mean luma **fell** 98.4→93.1, 89.6→81.5.
**Verdict:** shipped
**Surprise:** the APRON — the pitch running under us off row WH — is **62 px of a 119 px band**, more than the nine rows of roof above it. The first build slated the roof, measured +0 below f=0.52, and had only moved the boarding down.
**Law:** absolute luma sd under a compositing wash is not a property of what you drew. `nearShadow` reaches ~0.6 alpha by the sill and scales contrast with luma, so sd MUST fall toward the viewer whatever the surface is; grade a foreground on **sd/mean** — flat at 0.18-0.23 here against HEAD's collapse from 0.24 to 0.06.

## Iteration 126 — the plaza and the quay start remembering: a dry desire line, and stone that holds water (2026-09-02) [Plaza & quay × Connect]

**Brief:** b126 — `paveWear[]` is read only by `drawPuddles`, and `pavedAt()` never reaches the roundel or the quay. Premise held: feet cross 130/730 roundel and 91/130 quay cells in 6 days (`probes/pave-wear.mjs`), all of it unrecorded.
**Did.** (a) `pavedAt` widens onto `inPlaza`/`inQuay`, the **moss regions' own predicates**, so the stone that holds water is exactly the 860 cells `mossOwn[]` carries. (b) `trodStone()` in `groundBase`: `wear[]`'s idiom on the other surface, in the ground CACHE, exact at 0; `PW_FULL 0.45` is the measured p99. (c) the decay test is the WEAR, not the tile, plus a 6-cell sweep for quay rows 0–2. (d) `pudHollow[]` enters `mossTop` at `MOSS_POOL 0.45`.
**Gates:** census PASS, only `mossy 2298 → 2646` · motion PASS · filmstrip 0 POP · shots clean · perf +0.0% (vsync-capped, blind).
**Measured** vs HEAD-vs-HEAD controls: quay **51.4%** of its pixels changed dry (control 0%), plaza 6.7% (0.22%) dry, 16.4% wet; pools 560 → 792; over a year the pooling joints were LESS mossy than open stone on HEAD and are more so now — a sign flip — while cells that never pool moved +0.3%. Wet frame +5.5%.
**Verdict:** shipped
**Surprise:** the two halves were one line. Widening `pavedAt` bought the desire line *and* the water in one edit — what was missing was never the reader; `paveWear` had no way to accrue on a `PATH` cell at all. Only the DECAY needed saying twice: gated on the tile it would have pinned the lines forever.
**Law:** a `?pause`d page still runs rAF, so a canvas read is unpinned even after a synchronous draw — one run of the diff gate reported 18.7% of "elsewhere" changed where three repeats since read 0.84%. Carry a SIM FINGERPRINT (clock, wind, cloud, agent positions) through any before/after frame comparison and refuse it unless it says NONE.

## Iteration 127 — the allotments get their own fog, and ghPane's dead term wakes up (2026-09-02) [Cross street & allotments × Connect]

**Brief:** b127 — a SECOND mist source over the allotments so `ghPane`'s `mistAt()` term, 0 every day of every year, reads something. Full entry in LEDGER-archive.md.
**Did.** Found b127 already built and uncommitted (attempt 2, no ledger entry): verified rather than rebuilt — "an uncommitted WIP is UNPROVEN". `hollowMist` is a second scalar in the `cloudCover()`/`wetF()` family, RADIATIVE where the river's is evaporative — stiller, clearer, cold-only, so a mild wet morning mists the river and not the beds. `MIST_SRC[]` makes a source a span+reach+weight, `mistAt` takes the strongest at that x, and the two never overlap; the announcement stays latched on the RIVER, so a hollow-only morning is one the ticker does not name.
**Gates:** census PASS, six groups unchanged (no new `R()`) · motion PASS · visual PASS at 1600x950 and 390x844 · fogged frame +3.3%, unfogged byte-identical.
**Measured** (`probes/hollow-year.mjs`, 3 seeds x a year): fogs **12.7%** of mornings, **0** of the 594 warm ones. `mistAt(88)` p50 **0.82** vs HEAD's dead **0**; pane dE p50 **10**. Change confined to the allotments, **exactly 0** west of them; a river-only morning is **identical to HEAD, 0 of 6,080,000 px**.
**Verdict:** shipped
**Surprise:** three of my four "failures" were my own instrument. A `day` index runs 06:00→06:00 and holds TWO dawns, so bucketing on it read the weather off one morning and the veil off the other, inventing a warm foggy day. And containment said 854/12060 diverged until HEAD-vs-HEAD gave **441**: no `__reseed()`, so page-load frames left each run on a different PRNG offset. With it, both went to **0**.
**Law:** weather at a given `simT` is VIEWPORT-dependent — an instant found at 1280x700 does not reproduce at 1600x950.
**Budget:** context-budget OVER at 46.5 KB (cap 46). I compressed my own inventory line and cues; the rest is structural — laws and the last 3 entries. Manager: distil.

## Iteration 128 — the punt takes two (2026-09-02) [People & animals × Deepen]

**Brief:** b128 — let a pair cross to the eyot: seat two, land two, bring them home together (c160).
**Premise corrected:** `puntFits`' `pairLead` refusal was only half the lock. `spawnFarAgent` — the source the punt exists FOR — never called `withCompanion` at all ("Always solo", its own header); the 26 pair-leaders refused on HEAD all came from the OTHER jetty door, `overDeck`'s east agents, which land at 19–21h and were refused on TIME anyway.
**Did.** `spawnFarAgent(room)` + `withCompanion` — the far bank arrives in twos out of the SAME cap, the companion inheriting `far` so `farHolds` already counts it. `puntFits` drops `pairLead`. `punt.mate/pair/seating`; `PUNT_SEAT_Y −0.62` (the thwart) and `PUNT_POLE_Y +0.34` (the open end), 0.96 apart, both ends picked so neither walks THROUGH the other to a seat. `puntSeatStep`: the punt owns the passenger's tick from the moment the punter sits (`a.boarding` joins `a.aboard` in stepAgent's early return) and PAIR_MIN becomes a step ROUND, not a shove. +113 lines.
**Gates:** census PASS · filmstrip 0 POP · shots: the pair legible out/across/ashore/back, both inside the hull at three framings incl. mobile · motion FAIL `dusk/cart 0→1`, **dismissed on a HEAD control** — identical step distributions (max 3.90 both, 16/14 vs 17/16 over ABS_JUMP), only the MEDIAN moved.
**Measured** (`probes/punt-pair.mjs`, 10 seeds × 14 days): paired crossings **0% → 50%**; 21/21 landed both ashore and came home together; boat code never under PAIR_MIN (seating 0.90, by construction) against a town control floor of 0.67.
**Verdict:** shipped. Budget closed **OVER at 46.7/46 KB**.
**Surprise:** the cap priced it for free. Crossings fell 62 → 42 but **people carried went 62 → 63** — a pair spends two of FAR_CAP's three, so fewer distinct walkers set out and the same humans reach the island, half now with someone. Nothing needed re-pricing: a companion keeps no clock of its own, so the trip is the leader's both ways.
**Law:** a negative control must test a POSITION, not a PREDICATE. Mine first read 100% vs 3.7% — only because the control build's `pairStands` rejects EYOT *by definition*, so the instrument handed back its own definition. On a build-independent fact (is the cell underfoot WATER) the two are identical, and the fix I had written was worth nothing.
