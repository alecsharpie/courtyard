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
