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

## Iteration 132 — the ticker learns where you are looking (2026-09-02) [The sill & the observer × Connect]

**Brief:** b132 — prefer a subject inside the frame; do not take the surface with a line about somewhere you cannot see.
**Did.** `inView(x,y)`, the only reader `whereN` has ever had: a cell projected through `viewFor(whereN)` against the frame and `sillTop()`. Not the quarter's BOX (the fit's input, and not one of them is what you see) and not `gview` (the ground CACHE's view). Intent beats the live camera: the ease is 0.9 s, a line lives 2.5–9. `sayAt(x,y,txt)` = announce with a SUBJECT, 33 sites. `AMBIENT_PLACES` 8 → 30 placed lines, `ambientHere()` preferring the in-frame ones and falling back to the WHOLE pool, never to silence.
**Premise correction, and it was the iteration.** That fallback was DEAD CODE: the roll wanted `tickerTimer < -8`, seventeen seconds of dead surface, and the town speaks every three — **0 ambient lines in 8 sim days at three quarters, `tickerTimer` never once reaching 0**, so no threshold on it was reachable at all. Re-gated on `tickerFree()` (tested at the roll, so a blocked line is DROPPED not queued), restraint moved into the cadence, driven by `hash(ambIdx)` not `R()`.
**Gates:** census unchanged in every field · motion PASS · filmstrip 0 POP · canvas **bit-identical to HEAD** at three pinned instants, fingerprint NONE. **context-budget OVER at 47.4 KB.**
**HEAD → cand** (`probes/probe-sill-view.mjs`, 3 seeds × 5 days × 5 quarters, both builds, one oracle): off-frame subjects, fixed-place only — Courtyard **40/78 → 1/69**, Far bank **69/78 → 2/25**, Street and Plaza to 2 and 1. In-frame share 19→33, 27→34, 14→25, 4→11%; Wide unchanged. HEAD says the same top five lines at every quarter.
**Verdict:** shipped
**Surprise:** the roll self-balances unasked — ambient lines a day Wide 1.6, Courtyard 2.3, Far bank 3.4. The offer rate is flat and `tickerFree()` decides how many land, so the emptier suppression leaves a frame, the more the town murmurs about it.
**Law:** when a USER input starts gating what the town says or draws, key its schedule to `hash()`, never `R()` — else where someone looks spends the seeded stream.
**Law:** read the canvas in the SAME evaluate as the draw (`toDataURL()`, not a screenshot after it) — a synchronous `drawScene` still races rAF, and three instants read DIFFERS one way and IDENTICAL the other at a fingerprint of NONE.




## Iteration 133 — the cold gets out of the chimney and into the rooms (2026-09-02) [Sky, light & weather × Connect]

**Brief:** b133 — share `hearthF()`'s private `chill`, give it a reader indoors, fix the pop at the day roll.
**Did.** `chillF()` lifted verbatim out of `hearthF()` (the fire is bit-identical) and left OVERDRIVEN past 1 — 1.10 January, 1.35 under snow — because that saturation IS #124's winter fire; readers clamp at their own draw site, as both of `drawSmoke`'s already did. Its reader is the light the rooms throw out: the `LIT_PANES` screen fill and the window halo, both in the pass AFTER `applyLight`'s multiply. The lamp goes redder, not brighter — R held at full, the G and B the screen puts back falling away with the cold. Then `hearthIdx()` on `gardenIdx()`'s model at the other end of the clock (`HEARTH_ROLL 14`, the lull between the two fires) and `HEARTH_FADE`, so a stack crosses its own threshold on a ramp. `DAY_ROLL` is now written once.
**Gates:** census unchanged in every field · motion PASS · perf ±0.0% · filmstrip 0 POP · legible at 1600×950 and 390×844, winter dawn / winter night / summer night. **context-budget OVER at 50.4 KB.**
**HEAD → cand** (`probes/chill.mjs`, seed 7): worst single step **31 of 51 stacks flipping at hour 6.00 → 4 at 5.40**, worst alpha step L1 **5.690 → 0.360**. The glass, matched pane by pane over 32 deep nights a season: winter−summer R−B **+2.74 → +18.45**, winter R +9.3 / B −9.4 against HEAD while summer moves under 2.
**Verdict:** shipped
**Surprise:** neither gate the brief named could see either thing. A mean over "whatever panes were lit" is mostly pane IDENTITY — the lit set is hashed per night, so HEAD reads winter *colder* than summer (44.1 vs 50.0 R−B) at one instant and *warmer* (52.8 vs 50.0) matched. The filmstrip is blind too: cropped to the roofline the roll frame reads Δ0.296 against a median of 0.296, under the dawn ramp. It shows only as a difference BETWEEN the two builds' strips — that frame falls 0.296 → 0.248 while all ten others move ≤0.013.
**Law:** a mean over a set whose MEMBERSHIP is drawn per sample measures the membership, not the property — match the members across conditions first.

## Iteration 134 — the pools stop being drawn where nobody can see them (2026-09-02) [Lane & market × Harness]

**Brief:** b134 — cull `drawPuddles` to the visible frame, byte-identical output. Full entry in LEDGER-archive.md.
**Did.** `inFrameBox(sx,sy,rx,ry)` beside `project()`: ONE screen cull, on the CANVAS rect and deliberately not `sillTop()` — `drawPuddles` draws before the sill is composited and may legitimately paint under it, so the canvas is the only bound true of both callers, and the cull is exact by construction. `drawPuddleLights` calls the same one, being the lamp on the pool the other drew. Both ellipses of each pass sit inside (sx±rx, sy±ry).
**Gates:** census unchanged in every field · motion PASS · filmstrip 0 POP · `perf.mjs` ±0.0% and **blind** (vsync-locked at 16.70 ms over a mostly dry day).
**Proof** (`probes/pool-cull-cost.mjs`, seed 7, wet 0.75, 400 frames × 3 reps, interleaved): drawPuddles **−56% to −73%** at the four quarters (0.28 → 0.08–0.12 ms), whole wet frame −8 to −12%; Wide ±2.5% both ways, so the cull's own tax is under the noise. Canvas hash **IDENTICAL 28 of 28** (5 cameras × day/night; 3 viewports × 3 instants × 2 cameras), fingerprint NONE.
**Verdict:** shipped
**Surprise:** the phone is the case that needed this most and the brief never named it. At 390×844 the **Wide** camera — the default, and effectively the only one a phone has, since `#where` is hidden under 640 px — already culls **61%** of the wet pools, and Far bank there culls **100%**. The margin is not theoretical either: at 1280×700 Courtyard **17 pools are kept only because the cull uses rx/ry** rather than the centre, and a centre test would have popped all seventeen at the frame edge (`probes/pool-cull-exact.mjs`).
**Law:** `perf.mjs` is vsync-locked at 16.70 ms over a whole sim day — blind to a pass expensive only in a rare weather. Time the FUNCTION, in its weather, at every camera.
**Law:** a screen cull is exact against the CANVAS rect, never the picture above `sillTop()`, and its margin is the DRAWN extent, never the centre.
**Budget:** context-budget OVER, 50.2 KB (cap 46).
