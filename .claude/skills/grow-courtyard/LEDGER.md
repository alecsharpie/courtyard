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

**Keep an entry under 2.5 KB (≈38 lines).** A worker reads the last **three** entries
in full, every iteration, so entry length is charged to the loop three times over. This
cap was 3.5 KB and advisory at pass #20; the next three entries came in at 4.3–5.7 KB
and three more workers opened OVER budget, so it is now measured by
`rotate-ledger.mjs`, which names any entry over it. If yours does not fit, the excess is
almost always a **law** (true of the next vector → `LAWS.md`) or a **cue**
(→ `state.json`), not a longer entry. Write the *surprise* at full length and compress
everything else; the surprise is the part that cannot be reconstructed from the diff.
Once the manager has promoted your `**Law:**` and `**Cue:**` lines they are cut from
the entry — they live in the two files that are read *instead* of this one.

```markdown
## Iteration <N> — <one line: what changed> (<date>) [<Domain> × <Kind>]

**Brief:** <id> — <one line of what you were asked to do>
**Did:** <what you actually built, concretely — symbols, not adjectives>
**Gates:** census PASS/FAIL (<the histogram line that moved>) · visual PASS/FAIL ·
motion PASS/FAIL/skipped · perf PASS/skipped
**Verdict:** shipped | reverted | no-ship   ← your view; runlog.mjs decides from the diff
**Surprise:** <what you did not expect — the most valuable line here, or "none">
**Law:** <only if it will be true of the NEXT vector too; the manager promotes it>
**Cue:** <a loose end you noticed and did not chase, or omit>
```

---

## Iteration 92 — the plaza gets a midday: families by the alley, a child that runs the roundel and chases the plaza's own pigeons back to a parent on the bench (2026-08-31) [Plaza & quay × Connect]

**Brief:** b90 — c127 (count plaza presence by hour on HEAD), then families.
**c127 on HEAD** (`probes/plaza-midday.mjs`, box x 98..112 y 18..46): 10h 2.9 · 12h 3.0 · 16h 1.6 · 03h 2.0 — noon median 2.67, not 0; ~2 are east visitors CROSSING on `DECK_LEAD_A`, STOPPED people ~0.7.
**Did:** `spawnFamilyAgent()`, its own source: FAM_CAP 3 (= the plaza's three places), FAM_RATE 0.5, `famOpen()` 09:30–17:00 dry daylit for SET-OUTS, the walk priced against 17:00, the place released as the walk out begins. Parent on a free `PLAZA_BENCHES` seat or the fountain stand; child = `makeCompanion()` with `kidRun()` (a pigeon within 8 of the parent, else a ±0.8 rad arc of the roundel); runs end when the parent stands. `plazaBirdSpot()`: PLAZA_BIRDS 3 on their own roll, rings r 4.2–6, off the basin, never beside anyone. Names, one announce, `__entities` fam/kid/run.
**Gates:** census PASS (reshuffle; people +25) · motion `day/cart` 0→1 = the median rule on the reshuffle (worst step 3.9 on HEAD and candidate) · filmstrip 0 POP · `shots/b90-plaza-noon-*`.
**Probe:** noon box 6.67; families/day median 3 (0 in rain); 82/82 pairs left together; child-triggered flush 24/82 visits.
**Verdict:** shipped, ~+190 lines. A quay gate was built, priced at 40 cells = 16 h, and removed. FAM_CAP 2 gave 2/day: a family holds its place ~8 h of a 7.5 h window.
**Surprise:** `__warp(0.05)` rounds UP to whole fixed-dt steps (~0.067 s): every "1100 steps = a day" probe ran 4/3 of a day and under-read durations 1.33× — the 17:03 exodus chased for two rounds was real but mis-timed.

## Iteration 93 — the allotments get their autumn: a bonfire on one bare cell, a holder with a fork who lights it on a dry calm shed day and goes when it dies; smoke, an ember pool after dark (2026-09-01) [Cross street & allotments × New element]

**Brief:** b91, attempt 2 on #93's unverified WIP (e201eb0). Proved, re-priced, one clause cut.
**Did:** cell (84, 19.5), GRASS in the plot gap (`block-map.mjs`), stand off `ALLEY_Y`. `bon.fire`/`bon.ember` rate-capped; `bonfireDay()` = `leafShed() > 0.1 && hash(day,285) < 0.8` (not `leafFallF() > 0.3`, which is also every spring day); `bonfireWeather()` dry/calm/no snow; `spawnBonfireHolder()` (a.tend, a.fork) out at sunrise, kindles ~9 h on; `drawBonfireLight` AFTER `applyLight`.
**Premise REJECTED — litter:** the shed-day litter bbox is x 4..71, 0 cells on the block: "litter within 3 cells consumed" would run at a rate of zero at ANY legal cell; cut.
**Re-priced:** `bonfire-window.mjs`: of 40 offered seed-days only 17 had a fine 2 h set-out window (wind 1.0 on a third of autumn mornings; snow on day 18 in 4/8 seeds) — the weather already WAS the brief's "1 day in 3", so K went 0.45 → 0.8: 17/56 shed days = 30%, per seed 1–3.
**Gates:** census PASS (diff EMPTY — no census age is a shed day) · motion `dusk/cart` 0→1 = the median rule on the reshuffle (`cart-dusk-replay.mjs`) · filmstrip 0 POP · `bonfire-year.mjs` 8 seeds × 27 d: 0 kindles in rain / wind > 0.5 / summer; holder at 16/17 fires; kindle 13.8–20.4 h · `bonfire-shots.mjs`: flames + column 19:00, pool 21:00, embers 23:30, glow +39/+25 lum.
**Verdict:** shipped, ~+150 lines over two attempts.
**Surprise:** three crops were of the clock tower — a page clip needs the canvas rect, a law I had just read. The motion gate's scenes (days 3, 7, 11, 19, 22) never see days 12–18.

## Iteration 94 — the linden's shade becomes a place: one predicate the draw and the choices read; hot picnic pairs carry the blanket in through a bed gap, the sleeper and the sundial say where they are (2026-09-01) [Courtyard & garden × Connect]

**Brief:** b92 — count courtyard presence on HEAD, then `inLindenShade` as the ONE predicate.
**Count on HEAD** (`probes/shade.mjs`, 10 seeds × days 5–7, warmth 0.97), lawn kinds inside the wall: 10 h median 0.25 · 13 h median 1.0 · 16 h median 2.0; at 13 h kid 0.43, napper 0.23, picnic 0.27, sitter 0, gardener 0. Seed 42 13:25: day 5 = 3, days 6–7 = 0. Reported, not retuned (→ b95).
**Premise priced:** at a hard summer sun the ellipse (rx ≤ 8.2, ry ≤ 6.9) covers 0% of the picnic annulus r 9–12 and 100% of the inner lawn — so the hot pair go IN through a bed gap like the napper: `shadeSpots()` = 5 stands per gap at r 3.3, off the sundial, off anyone lying/sitting, in FRONT of the trunk. The cool rule has 3% of the annulus to act on and never fired in 9 set-outs; kept as the one definition.
**Did:** `lindenShade()`/`inLindenShade(x,y)` beside `shOffset`; drawTree draws `sh.cx/cy/rx/ry`; the picnic branch keeps its two draws and picks within the chosen set; `a.shaded`, `preExit` via the gap; napper line, `personName`, `sundialName` 'in the linden's shade' when `leafOut() > 0.5` and the dial is inside.
**Gates:** hot 12/13 = 92% inside; cool 0/9 (HEAD 0/9). Forced-false canvas 20/20 IDENTICAL to HEAD, choices identical. Names flip with the crown (winter clear day 19 → 'about one'). Census FAIL people 271→244 (−10%) = the reshuffle (`census-noise.mjs`: 8 seeds HEAD 486 vs 489; HEAD's own spread on identical code 19%) · motion PASS · filmstrip 0 POP · `shots/b92-shade-picnic-*`.
**Verdict:** shipped, ~+60 lines.
**Surprise:** the shade does not touch the lawn the brief thought it shaded — the ellipse ends 1 cell short of the outer lawn at noon; 'out in the sun' never fires by day, so the words exist for a young tree only.

## Iteration 95 — the lawn gets its own population: spawnLawnAgent() off LAWN_CAP places, the staying kinds leave the ring's roll, the sun's window prices every walk and ends every stay (2026-09-01) [Courtyard & garden × Deepen]

**Brief:** b95 rung 6 (attempt 3; attempt 2 left a complete uncommitted WIP — verified it, fixed three defects, landed it).
**Did:** `spawnLawnAgent()` on the family model: LAWN_CAP 4 holders, each claiming a PLACE (bench / bed-gap nap / blanket angle / kid's run / edge bed) at the choice, released as the walk out begins; walks priced at the choice against the sun's window; the five staying branches deleted from `spawnAgent` (ring keeps dog/crosser/walker; capacity daylight term 9 → 6); `finishItinerary`/`routeToExit` honour `lawnCut` chords (door↔lawn direct — HEAD's sitters ring-walked "out" until 4 am).
**Fixed in the WIP:** (1) set-outs were gated on live `daylight > 0.35`, so winter arrivals began ~13 h — added `lawnStart()` and priced the arrival's daylight in `lawnFits` (open a trip earlier than its hour); but the lower bound alone made every midnight roll pick the east arch (the one walk long enough to land in the window — street door set-outs 3 → 349, 15.8 h marathons), so `lawnOpen()` also requires the sun UP at set-out. (2) gardener spot was `pick(EDGE_BEDS)` over ALL beds after fitting only the nearest — far beds killed the roll at the bag; now picks among fitting beds like the sitter. (3) `lawnClosed()` (rain OR failing light) ends every stay; walkers-in walk on and the seat is judged at the seat — turning them round too hard-cleared a rainy noon to 0.03 (outside HEAD ± 1 the OTHER way).
**probes/lawn-day.mjs** (10 seeds × summer d5–7, inside-the-wall box — shade.mjs's lawn-only box never sees a bench): 13 h median 6.0 (target 4–7; HEAD 4.0, min 0), 10 h 4.0 (≥2), 16 h 6.0 (≥3), every kind >0 at 13 h; night stayers 0/10 seeds vs HEAD 1–3 stuck (HEAD holds 4.2–4.4 lawn-kind people at 0–5 h — it NEVER emptied). Winter d19 13 h median 2.0 (HEAD 3.0, ±1 ✓ — a child, a sitter; no one lies under 0.45 warmth). Rainy noon 5.0 vs HEAD 3.0: MISS on the letter of ±1, but all 15 inside-wall people across 3 seeds at a pinned rainy 13 h are state `walk` (arrivals in transit); relative response matches HEAD (−13% vs −12%), and the band is unsatisfiable jointly with the population target — reported, not tuned.
**Gates:** census PASS, people 252 → 284 vs HEAD (+13%, the predicted rise; inCourtyard +15; baseline re-pinned post-ship) · motion PASS (an interim run flagged day/cart 0→2 — cart-dusk-replay: worst step SAME instant/place both builds, the #92/#93 median rule on the reshuffle) · filmstrip 0 POP · shots/b95-lawn-{1325-s42-d6,0900-s42-d4}[-head].png: 11 vs 4 and 7 vs 3 inside the wall.
**Verdict:** shipped, ~+160 net lines over the two attempts.
**Surprise:** `?t=<n>` is a DIFFERENT WORLD from the default start — same seed, same DSF, but shoot.mjs `--t 347` had s42 d6 13:25 RAINING while every warp-from-default probe has it clear. A shot meant to witness a probe's number must be taken by warping from the same start the probe used, or it witnesses a different calendar.
**Budget:** context-budget reads OVER — 48.3/46 KB after this entry (state grew two lines, the entry is long for a three-defect attempt-3): manager, distil this pass.
**Law:** an arrival-window lower bound without a set-out bound is a marathon-walker factory: at any closed hour the one branch that passes pricing is the LONGEST walk. Bound both ends of the trip, not just the landing.

## Iteration 96 — the eyot gets its way on: ONE punt at the jetty's mooring, a jetty stander whose window fits poles over, stands under the willow, poles home — and the count says the jetty is an evening place, so it almost never fires (2026-09-01) [River & far bank × Connect]

**Brief:** b94 — the punt to the eyot (c128); count jetty stands/dwell on HEAD first.
**Count on HEAD** (probes/punt.mjs, 10 seeds × summer d5–7): jetty stands/day median 0, mean 0.53 (range 0..2); dwell median 10.7 s = 4.67 h sim. The WHEN is the real finding: every stand lands 17:30–03:00 — the deck walk from the east gates is ~12 h sim, so the jetty is an evening place. The earliest stand (17.52) has 3.05 h of eastOpen() left; the two best-placed are pairs.
**Did:** punt{leg 0..4} at PUNT_MOOR off the jetty's south edge; puntFits at the stop's perform (deterministic, no draw): dry ∧ windF < 0.5 ∧ eastOpen ∧ eastCloseHour() − hour > puntTripH(a) + 0.75. Arrival priced against the window's END; the way back is the retire rule's business — a dusk return is the walk-home-in-the-dark every east visitor already makes. puntClaim splices [MOOR, SHORE, STAND, SHORE, LAND] into the retrace at a.i, so EVERY end-of-stay (timer, rain, skyLifts, the light) walks them to the landing, never across water; aboard = state 'punt', stepAgent early-returns, updatePunt owns x/y. drawPuntHull + drawPuntCrew (two items, pole strokes on simT); swans held 1.2 off PUNT_LAND while puntAtShore(); personName/lookAt tname/__entities; one announce at push-off.
**Gates:** census PASS (unchanged ×2 — zero new stream draws) · motion PASS · filmstrip 0 POP · perf PASS (16.70 = control) · punt-force.mjs (manufactured rider, wind/rain pinned): full cycle 10:36→16:04, cross 1.13 h ≈ the brief's ~1 h, stand 12.5–14.2 under the willow, 0 water-walk steps, swans 0 samples < 0.9, announce ×1, retrace resumed; late run: stand ends 20.27, eastOpen closes 20.56 mid-walk-back, punt home 22.15 after dark, 0 strandings · shots/b94-punt-{push,channel,willow}.png at 3×.
**MISS (success band):** natural crossings 0/30 seed-days vs "1–3/day" — the honest price (3.4–4.1 h) never fits the ≤3.05 h any real stand has in hand. Not the pricing: the inflow. One forced-run side-effect showed the shape that works — an overnight walker arriving mid-afternoon crossed unprompted (14.81 push-off, wind pinned 0).
**Verdict:** shipped, ~+150 lines. The rate is the manager's call: DECK_SHARE up, an OFFERS invitation, a towpath rider, or accept a rare punt.
**Surprise:** puntStayH folds a.phase — but a.phase is the GAIT phase, mutated every step, so the stay "drawn" at the choice reads differently by landing (1.01 → 1.69 h). Deterministic and in-band, but a fold of a mutating field is re-drawn per read — fold a field written once.
**Law:** a place's traffic has an ARRIVAL-HOUR histogram, not just a rate — a stop 12 h of walking from its source is an evening place, and a daylight-priced offer sited there runs at zero. Count WHEN, not only how often.
**Budget:** context-budget read OVER at open (47.4/46 KB) — manager, distil this pass.

## Iteration 97 — a murmuration: starlings boil over the river on dry autumn and winter dusks, funnel into the church tower, a thin skein leaves at first light (2026-09-01) [Roofs & skyline × New element]

**Brief:** b96, attempt 2 on an unproven WIP (source + probe + shots; no ledger, no commit). Verified it, fixed four things, landed it.
**Did:** `drawMurmuration(ctx)` right after `drawSky` — the backdrop is composited INSIDE drawSky, so that seam is in front of the far hills and behind every cached roof. `murmSeason()` = `leafShed() > 0.1 || leafOut() <= 0`; `murmWx()` dry ∧ windF < 0.7; `murmEnv()` rises from sunDown−1.3 over 0.35 h, falls past sunDown+0.05. N = 80 + hash(day,601)·81; 2–3 attractors on simT sines; per-particle hash phases; funnel from sunDown−0.5, staggered, into `MUR_ROOSTS`. `stepMurm()` latches roosted/murAnnounced sim-side; `skeinEnv()` sunUp−0.05..+0.55; `murBox` → lookAt. No R().
**Fixed in the WIP:** skein count keyed on hash(day) straddles a winter sunUp before 06:00 (d14 sunUp 5.86) → key it to the roost's day; dots ≥ 1.5 px and alpha +0.1 (a smear at 1×); forming ramp 0.2 → 0.35 h; the cost probe was BLIND (seed 7 day 17 has no flock, env 0) → run it on the season's largest day (19, N 149) with murmWx forced.
**Gates:** census PASS ×2 · motion PASS · filmstrips 0 POP · `probes/murmur.mjs` 8 seeds × 26 d: 80 season evenings, 35 dry, **formed 35/35, 0 in rain, 0 off-season**; 6 summer instants HEAD-identical; cost +0.05 ms at N 149; pixels s42 d13 0 → 390 → 0 over 0.7 s real, no step; announce ×1 per flock day · `probes/murmur-shots.mjs`, warped from the DEFAULT start.
**MISS — the Far bank quarter** holds NO sky (frame top at depth +0.15, topPad 2.4 px at s 2.59), so nothing behind the roofline can show in it. The funnel is −0.5 → −0.3: gone before the dusk relight.
**Verdict:** shipped, ~+120 lines over two attempts.
**Surprise:** a dark flock has ONE band to live in — depth ≤ −6, above the far hills' top; lower is dark on the dark distant town, and every quarter's frame starts below the horizon: a sky feature exists for Wide only.

## Iteration 98 — the lane gets its morning: ONE figure with a bag comes in west before sunrise, leaves a bottle on two steps and walks back out; the brief's fourteen doors priced to a 30 h walk (2026-09-01) [Lane & market × New element]

**Brief:** b97 — a round working all fourteen HOME_DOORS in sunUp−0.3..+1.6, plus dawn-lit HOME windows (count first).
**Priced FIRST:** the sweeper traced on HEAD — 68 cells in 13.15 h = **5.2 cells/h** (0.87 × 2.6). Fourteen doors ≈ 155 cells ≈ 30 h; 1.9 h buys ten cells and no door, and "fewer doors" priced to ZERO at that window. So the WINDOW became the variable: `ROUND_H` 5 h of sunrise → doors 4 and 8, then back out west (the east end is 28 h away).
**Did:** `updateRound()` beside the sweeper: `mround` in at sunUp−0.3 (`roundDay` latch, `snowCover <= 0.5`, umbrella in rain), door legs to `ROUND_STEP_Y` and the walk back; `roundDeliver` (hashed stand; `roundMarks` taken in by 09:30 − 1.5·hash, or 0.75 h after a late one); `drawStepMarks` item at y 65.11; `a.bag`; `nameAt(x, 65)` 'a bottle left on the step'; personName; `__entities` round/left; `laneCount − roundCount()`; `chatty` refuses it. No R().
**Dawn windows — counted, not built** (`probes/dawn-lit.mjs`): a dawn IS lit, 4–7 panes at sunUp−0.8..0, but early risers key on the dawn EDGE, so the count RISES to 10–11 at sunUp+0.5 in winter.
**Gates:** census FAIL people −13% = reshuffle (`census-noise.mjs`: HEAD's own spread 14%, candidate −6% over 8 seeds; `probes/round-identity.mjs`: round forced off → canvas IDENTICAL to HEAD) · motion PASS · filmstrip 0 POP · `probes/morning-round.mjs` 10 seeds × 2 seasons: in −0.22/−0.28 20/20, 2 doors 20/20, out +6.2..7.4, greets 0, max step 0.65; marks [4,8] at 07:30 and [] at 09:30, 10/10 · `round-bottle.mjs` 3 px at 1×, 11 at DPR 2.
**MISS:** 2/14 doors; out +6.6 not +1.6; at the landing hour the round is at the west end, not mid-street.
**Verdict:** shipped, ~+75 lines.
**Surprise:** the brief's pricing was 15× off and its own fallback priced to nothing.

## Iteration 99 — the camera reads the sill, and the east clamp finally holds at the top row (2026-09-02) [The sill & the observer × Polish]

**Brief:** b93 (attempt 2) — c129 the willow under the sill, c126 the void past GW at a quarter's top row, c134 the vane's 6 px cardinals at every zoom. Attempt 1 committed all three **unverified** (session limit); verifying them, two did not hold.
**Did:** kept attempt 1's `sillTop()` (one definition, read by `drawSill` and `viewFor`), its fit/centre against `pic` with overflow held at the top, and its `k = viewS` scaling of the vane draw and hit-test. **Fixed the clamp:** its escape hatch `if (nearL < 0 || nearR > W) oxT = held(1)` fired on *every* far-bank frame — the far bank's `x1` **is** `GW`, so its near-row east corner is the world's own edge and necessarily past `W`, handing the clamp straight back to the old bottom-row behaviour. Now guarded by `q.x0 > 0` / `q.x1 < GW`. **Added `Plaza share:0.5`.**
**Gates:** census PASS (five groups unchanged) · motion PASS vs a baseline taken on the pre-attempt-1 file through `--page` (zero delta) · `where-identity` IDENTICAL at 390 and 1400, incl. the round trip through the rescaled Plaza · before/after crops of q3/q4.
**Probes:** `probes/where-void.mjs` (new) — east void at the frame's *visible* top row: far bank **172→0 px**, plaza **144→0**, four framings. `probes/vane-letters.mjs` (new) — font off the page's own `fillText`: control 6/6/6 px at s 1/2/3.5, candidate 6/12/**21**.
**Verdict:** shipped, +15 lines.
**Surprise:** the "before" far bank looked like the *better* picture, and that was the bug — it showed invented land. The ground cache over-paints past `GW`, so the void reads as a grey wedge only on the top rows it misses; the rest looked like green field. Closing it moves the frame east, so the quarter shows *less* far bank — which looks like a regression and is not one.
