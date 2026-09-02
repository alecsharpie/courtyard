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

## Iteration 127 — the allotments get their own fog, and ghPane's dead term wakes up (2026-09-02) [Cross street & allotments × Connect]

**Brief:** b127 — a SECOND mist source over the allotments so `ghPane`'s `mistAt()` term, 0 every day of every year, reads something. Full entry in LEDGER-archive.md.
**Did.** Found b127 already built and uncommitted (attempt 2, no ledger entry): verified rather than rebuilt — "an uncommitted WIP is UNPROVEN". `hollowMist` is a second scalar in the `cloudCover()`/`wetF()` family, RADIATIVE where the river's is evaporative — stiller, clearer, cold-only, so a mild wet morning mists the river and not the beds. `MIST_SRC[]` makes a source a span+reach+weight, `mistAt` takes the strongest at that x, and the two never overlap; the announcement stays latched on the RIVER.
**Gates:** census PASS · motion PASS · visual PASS at 1600x950 and 390x844 · fogged frame +3.3%, unfogged byte-identical. Fogs 12.7% of mornings and 0 of 594 warm ones; `mistAt(88)` p50 0.82 vs HEAD's dead 0; exactly 0 change west of the allotments.
**Verdict:** shipped
**Surprise:** three of my four "failures" were my own instrument. A `day` index runs 06:00→06:00 and holds TWO dawns, so bucketing on it read the weather off one morning and the veil off the other, inventing a warm foggy day. And containment said 854/12060 diverged until HEAD-vs-HEAD gave 441: no `__reseed()`, so page-load frames left each run on a different PRNG offset. With it, both went to 0.

## Iteration 128 — the punt takes two (2026-09-02) [People & animals × Deepen]

**Brief:** b128 — let a pair cross to the eyot: seat two, land two, bring them home together (c160).
**Premise corrected:** `puntFits`' `pairLead` refusal was only half the lock. `spawnFarAgent` — the source the punt exists FOR — never called `withCompanion` at all ("Always solo", its own header); the 26 pair-leaders refused on HEAD all came from the OTHER jetty door, `overDeck`'s east agents, which land at 19–21h and were refused on TIME anyway.
**Did.** `spawnFarAgent(room)` + `withCompanion` — the far bank arrives in twos out of the SAME cap, the companion inheriting `far` so `farHolds` already counts it. `puntFits` drops `pairLead`. `punt.mate/pair/seating`; `PUNT_SEAT_Y −0.62` (the thwart) and `PUNT_POLE_Y +0.34` (the open end), both ends picked so neither walks THROUGH the other to a seat. `puntSeatStep`: the punt owns the passenger's tick from the moment the punter sits, and PAIR_MIN becomes a step ROUND, not a shove. +113 lines.
**Gates:** census PASS · filmstrip 0 POP · shots: the pair legible out/across/ashore/back at three framings incl. mobile · motion FAIL `dusk/cart 0→1` dismissed on a HEAD control. Paired crossings 0% → 50%; 21/21 landed both ashore and came home together.
**Verdict:** shipped
**Surprise:** the cap priced it for free. Crossings fell 62 → 42 but **people carried went 62 → 63** — a pair spends two of FAR_CAP's three, so fewer distinct walkers set out and the same humans reach the island, half now with someone. A companion keeps no clock of its own, so the trip is the leader's both ways.

## Iteration 129 — the gardener gets a schedule, and a walk that is bounded at both ends (2026-09-02) [Courtyard & garden × Deepen]

**Brief:** b129 — give the gardener its own source so someone works the beds on most growing mornings.
**Premise corrected, twice.** (a) The gardener is not short of ARRIVALS: HEAD lands 1.17 per growing day. (b) The 0.65 the brief priced off is `inWall`, and 13 of 204 EDGE_BEDS sit OUTSIDE `wallR()`'s square — the axis beds a near-door walk picks. By POSITION HEAD's gardener is in the beds 0.06 of a growing morning: not rare, never there while it matters. The limiter was the WALK, not the supply.
**Did.** `spawnLawnAgent(want)` takes a forced kind (fits unchanged — a schedule skips the lottery, not the pricing). `gardenDue()` on the bonfire's model: no roll, `hash(gardenIdx(), GARD_SALT) < GARD_K` over the beds' own season, off `gardenIdx()` because `day` rolls at hour 6. Outside `LAWN_CAP`. `gardenFits()` bounds the pre-dawn walk at BOTH ends; the bed is drawn from the near third by walk; `a.dawnWalk` licences the climb past `lawnGone()`.
**Gates:** census/perf/filmstrip/visual PASS · motion FAIL dismissed on a HEAD control. In the beds on a growing morning 0.06 → 0.22 (3.7×), 0.08 → 0.26 when the lawn is BUSY, nothing displaced.
**Verdict:** shipped
**Surprise:** every lever was already in the source one level up, unused. #108 fixed the gardener's DOOR and left the BED a flat `pick()` over all 204; the dawn start made that WORSE, because with the whole day ahead every bed passes `lawnFits` — the priced walk went 5.8 h → 9.2 h, all spent crossing the town. `lawnFits` bounds the LANDING only, which is all a visitor needs because none sets out before the lawn opens. Ranking beds by walk and bounding both ends turned 0.06 into 0.22; the schedule alone gave 0.08.

## Iteration 130 — the town gets houses, and the roofline stops being a ruled line (2026-09-02) [Roofs & skyline × Scale/World]

**Brief:** b130 — a house index per terrace, an eave per house, and what the step implies.
**Premise held.** HEAD had **4 distinct eaves along its whole north row, 1 along each side wall**.
**Did.** `houseAt(x,y)` indexes every terrace on `drawFaceRow`'s own 3.5-cell rhythm, counted the way the terrace RUNS: x for the long rows, y for the slivers. `houseLift` is a coarse hash (`runOf`, a builder's run of 1-6) with a fine one gated on it (one house in seven rebuilt). The step is **`roofZE(vx,vy,e)`**: a vertex read from INSIDE its own house, `e + SLOPE*min(vD)` — bit-identical to `vZ` in a block of one eave, different only where the town steps. Then its implications: `drawGable`, a party-wall line, `buildStacks` (a stack per party WALL, into `CHIMNEYS`). +213 lines.
**Gates:** census PASS, **structures +369 / chimneys 27→68 a run**, tiles and life unchanged · motion PASS · filmstrip 0 POP · perf ±0.0% · legible at 1600x950, 390x844, night. Terrace eaves 4→20 / 18 steps (north row), 1→7 and 1→11 on the walls. Baseline re-pinned.
**Verdict:** shipped
**Surprise:** the near roof, which I never touched, came back **23.4% changed**. `roofShade` gained an `e` parameter and the APRON called it with none, so every apron slate shaded off NaN. Eyeballing two framings missed it; a difference image against a same-code control (0.000%) found it in one run.
**Law:** widening a shared draw helper's SIGNATURE changes every caller — grep them all; the missing argument arrives `undefined`, and a colour off NaN still paints something plausible.
**Law:** `hash(x,y)` is NOT seeded; `?seed=` swaps `R()` alone. The built FABRIC is one town in every world; only its life varies.

## Iteration 131 — the last punt: the crossing runs on after the east half has closed (2026-09-02) [River & far bank × Deepen]

**Brief:** b131 — open the evening crossing; pick which end gives and price it.
**The premise was wrong in its detail, and that decided it.** Instrumented `puntFits` clause by clause in its own evaluation order (`probes/punt-evening.mjs`, 10 seeds × 14 days): of HEAD's 181 refusals only **8** die on the TIME term. The deck supply dies on a BOOLEAN — 39 on `!eastOpen()`, median arrival at the planks **20.47** against a close at **20.17**. Nothing done to a stay reaches past a hard gate, so the jetty is the end that gives.
**Did.** Two fits over the same state (the claim asks again which trip it is). The evening one stands on the eyot's north lawn instead of walking to the willow — out 2.99 h → 2.37 h, which lets the round trip be priced ONCE against `EVE_GONE`; `eastOpenFor`'s cover EXPIRES at `a.puntBack`, so the retire rule still brings them home. `eastOpen()` untouched.
**Gates:** census PASS · visual PASS ×6 · filmstrip 0 POP · motion FAIL on 2 rows, both replayed as HEAD's own. **context-budget OVER at 48.0 KB.**
**HEAD → candidate:** crossings 46 → **66**; **people carried 65 → 92**; boarded after the close **0 → 18**, carrying 25, **18/18 under lit lamps**; 66/66 home; nobody on the eyot at the bell; worst return 25.46 against the promised 26.15.
**Verdict:** shipped
**Surprise:** the first build forked on `!eastOpen()` and so refused an 18:30 stander while taking a 20:30 one — a step in the evening with nothing under it. Making the handover continuous (the short trip the moment the long one stops fitting, ~16.4) carried most of the gain: 52 → 66.
**Law:** instrument a compound predicate CLAUSE BY CLAUSE in its own evaluation order — a refusal total says nothing about which clause to loosen, and the loudest is usually the cheap boolean in front of the arithmetic.
**Law:** a stop needs PAIR_GAP of margin all round, not just legal ground under itself — the shore stand was on turf and put its COMPANION in the river on 9.9% of its samples.
