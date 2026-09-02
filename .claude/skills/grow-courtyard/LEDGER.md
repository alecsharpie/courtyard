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

## Iteration 118 — each bird band counts its own: the lawn and the lane get their three back (2026-09-02) [People × Deepen]

**Brief:** b118 — the ground band's cap read `birds.filter(b => !b.plaza).length < 3`, so #106's roof birds and the belfry's flush filled it. Premise re-measured on HEAD first (`probes/ground-birds.mjs`, 12 seeds × 6 days, 7,744 daylight dry samples): mean present **0.05** ground vs 2.67 roof, 1.24 plaza; gate open 15.1%, and — the sharpest number — **100% of shut samples were shut on birds of another band**. Not throttled, evicted.
**Did.** One predicate. The band's spawn carries `ground:true` and the cap counts `b.ground`, the way the other two already read themselves. The crumb birds a tap scatters are tagged too — they *were* members under `!b.plaza`, so tagging keeps the old behaviour instead of quietly handing the band a second budget. No new source, no new draw site; +9 lines, all comment.
**Re-priced, not inherited.** Same probe, sweeping the cap once the count meant what it says: **0.33 at 2 · 0.41 at 3 · 0.39 at 4 · 0.40 at 5**. The knee is exactly 3, because the limiter is now the **rate** `0.06*(0.5+m)`. Shipped: ground **0.05 → 0.41** mean, **4.6% → 34.0%** of daylight samples with a bird on lawn or lane; roof and plaza sit in reshuffle noise.
**Gates:** census PASS · shots clean plus a pinned instant with three ground birds · motion FAIL on one flag, `day/cart` 0→1 jumps, replayed on HEAD (`probes/cart-steps.mjs`): both builds median step 1.733. A cart trotting, not a teleport.
**Verdict:** shipped
**Surprise:** the cap was never the throttle it looked like — fixing membership moved the binding constraint to the rate in one step, and the whole 2..5 sweep lands inside 0.08 of a bird. A brief that had only raised the *number* would have measured nothing and concluded the band was fine.

## Iteration 119 — the far bank gets an edge: a hedge, a gate standing open, and a track worn to it (2026-09-02) [River & far bank × New element]

**Brief:** b119 — `FAR_GATE` is a bare world edge; give the far bank's morning something to come *through*.
**Premise held, and worse:** `drawGround` clamps `gx` to `GW-1`, painting the fields east of the world in grass, so `FAR_GATE` projects to **sx 1201 of a 1228-wide canvas** — on frame, on open grass, out of nothing.
**Did.** A boundary at `FIELD_X = GW`: a hedge (seasonal through `leafOut`/`leafCol`/`snowAt`, so it flushes, turns and goes bare with the orchard), a five-bar gate hung open in a gap on `FAR_GATE`'s own row, a track worn to it, `fieldEdgeName` in `nameAt`. **Drawn, never gridded** — a WALL cell here would be a footprint and get a roof; this is a ground-cache line like the allotment fence, so not TUNNEL-class, and `passages` did not move. `farWay` gains `FIELD_GAP` as its first waypoint; since `spawnFarAgent` reverses the lead to build the way home, the walk OUT came free. +85 lines.
**Gates:** census PASS (`structure: unchanged`) · motion PASS · shots clean. Perf out of scope — `drawFieldEdge` runs inside `drawGround`, cache-time.
**Measured** (`probes/far-gate-waypoints.mjs`, 10 seeds × 6 days): HEAD's 170 arrivals start at **39 distinct** points scattered down the bare spine x=137.2; the tree's **173/173** enter *and* leave at `[138, 31]`, all five branches intact. Containment: far-bank strip 3.68% changed, everything else bit-identical, peak 0. Hedge continuous at 40/40 samples.
**Verdict:** shipped — but built by attempt 2, which never committed. A WIP is UNPROVEN, so this pass re-measured rather than inherited; it held, and came back sharper.
**Surprise:** the world's east edge is off-canvas in **every camera but Wide** at desktop sizes — including the quarter *named* "Far bank" — and off-frame in all five on a phone. The bare arrival, and its fix, live in one of five cameras.

## Iteration 120 — the quarter cameras learn the world's real extent, and that a subject can stand UP (2026-09-02) [The sill & the observer × Scale/World]

**Brief:** b120 — the five cameras frame GROUND, not the town. It cites `probes/world-edge-framing.mjs`, which was not on disk; I wrote it, and it prints every number below on either build.
**Did.** (a) `WORLD_X0/WORLD_X1/FIELD_VIEW`: the camera's extent, no longer the grid's `0..GW`, and `drawFieldEdge`'s track now ends on `WORLD_X1` — one constant for the last drawn thing and the frame that must hold it. (b) **Vertical intent**: `air`, the DEPTH a quarter reaches up to, and `keep`, which end of the band survives an overflow. The height fit is priced on `air..y1`, and `tp` is one expression that is HEAD's *term for term* at `air = y0, keep = 1`, so a quarter declaring no intent cannot move. Street's `air −20.5, y1 44` keeps the band the height its box was: it slides UP into the air instead of zooming out of it. (c) the near-corner escape no longer *ends* at `held(1)` — that is now a candidate, held at the top row in its turn. +72/−24.
**Gates:** census PASS (camera only) · motion PASS · shots clean · ease sampled into Far bank, the scaled cache covers the frame · `probes/quarter-hash.mjs`, 3 sizes × 2 seeds × 3 instants: Wide moved at 1/18 against a **HEAD-vs-HEAD control at 2/18**, and is unchanged by construction — `viewFor` returns before every changed line.
**Measured, both framings:** arrow vane in Street OUT −204 px → **IN, cardinals 11.4 px**; weathercock in Far bank −404 → **IN +31**; field gate in NO quarter → **Far bank +21, Plaza +28**; Courtyard's west edge −8.6 cells → **0.0**.
**Verdict:** shipped
**Surprise:** **a quarter cannot reach the world's edge by zooming.** The frame's world x at a given row is a function of the hold's extent and the PINCH alone — `s` cancels — so the gate's row 31 is 3.1 cells short of the frame's top row at *every* zoom, and only the extent moves it. Which bounds the extent from the other side: the cache's east repeat is honest only where the edge column is, and column 137 is WALL for rows 0..2. Far bank must reach row 0 to reach the sky, so it carries ~5 cells of smeared block in its top corner; Plaza's band starts at row 3.6 and runs east to the gate over nothing but field. Two quarters, opposite constraints, one constant.

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
