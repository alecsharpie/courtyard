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

## Iteration 100 — the diorama gets a foreground: rows 79..87 stop being VOID and become our own slated roof (2026-09-02) [Roofs & skyline × Scale/World]

**Brief:** b100 — build the near band as the roof of the block we look out over. Take the swing.
**Did:** the footprint went into `buildGrid` as WALL and **`buildVolumes` grew the roof** — ridge along the lane, hips at the river, valleys round the two `WELLS` (still VOID). Three statements, each a footprint or an eave and never a roof: `eaveFor` 0 for `y >= LN_WALK_S`, `solidAt` runs the block off both x edges, `WELLS`. Then `drawNearRoof` in the cached layer — `drawRoofRow` per row, so snow, key light and `CHIMNEYS` come for free — plus a flared apron off row WH falling into shadow, ridge capping, moss on the north pitch, `drawParapet`, `drawWell`, a `drawDormer`/`drawRoofLight` per house, and `drawPartyWalls` carrying the stacks. `ROOF_LIGHTS` → `drawRoofLights()` beside `drawLitPanes`, pushed to `LIT_PANES` so the night multiply is undone as a facade window's is. Slate not pantile, per house off `SLATES`; `nameAt` names it. The six screen-space awning stripes came back into the WORLD along the kerb (rows 77.65..79); HEAD's 24 px shadow band over the footway went.
**Gates:** census PASS, **re-pinned** (`developed` +1095/world, `structures` +7, VOID 1107→12, `tileKinds` held at 12 by the wells) · motion PASS vs a HEAD `--page` baseline · filmstrip 0 POP · perf +0.0% · shots day/night/snow/rain × desktop/phone.
**Probes** (`probes/near-roof-band.mjs`, `canvas-diff-where.mjs`): near band luma<20 — desktop **24.9% → 9.6%**, phone **59.7% → 21.7%** (mean luma 31.9→94.8, 18.8→73.2). Snow forced 0/.3/.55/1 → band mean **86/104/119/146**. Night: 5 of 20 rooflights lit at 22:35, 0 at 01:30. Nothing is drawn north of row 79 but the awnings.
**Verdict:** shipped, ~+230 lines.
**Surprise:** the first slab was pantile-orange and read as one flat field — the fix was not more detail but **less brightness**: a dark near block is what lets the town read past it. Two instrument traps: `roofZ` takes a VERTEX index, so `drawChimney(g, bx - 0.5, …)` indexed `vZ` fractionally → NaN, and the stacks were counted by the census and drawn nowhere; and a HEAD-vs-HEAD control differed in 332 px, so "first row differing from HEAD = 90" was rasterizer noise, not a leak into the sky.
**Law:** A foreground volume is priced against what is BEHIND it: `project()` lifts z northward, so every cell of height on the near block walks it 1.15 rows up the frame and into the thing it should sit in front of. Eave 0, and price everything standing on it by its own row.

## Iteration 101 — the warm evening ends: the walk home is priced at the choice, the bell and the passing word stop taxing a priced walk, and the footbridge's far end takes three (2026-09-02) [People & animals × Deepen]

**Brief:** b101 — trace one dusk stayer's whole life, find where the walk home is lost or unpriced, close the evening; add a third far post at 122.5 and price `a.listen`.
**Traced first** (`probes/evening-close.mjs`, 10 seeds × 4 summer days, every `a.dusk` from choice to off-frame). Nothing is *stuck* — three separate things are *unpriced time*:
1. **The walk home itself.** `#79` priced the walk IN and stopped. The evening's people went off the frame a MEDIAN **4.4 h after eveEnd** (stayers; gate arrivals 2.6 h; worst 9.9 h, one still walking at 07:18), **29 of 40 nights** held a dusk agent at 03:00 and 2 stayers never left the sample at all.
2. **`chatty()` had `!a.stay` but not `!a.dusk`** — so a *gate* arrival on a walk priced to the minute stood in the road talking: one greet ran **2.79 h**. That, not the bell, was the main reason four of 51 arrivals stood one frame past `eveEnd()` and got straight up.
3. **The bell.** `a.listen` holds 0.44–0.92 h and the clock strikes every third hour; on the walk HOME it added ~1.5 h to a walk already too long.
**Did:** `EVE_GONE 26.5` (the hour the evening's people are off the frame, on `hourEve()`'s axis), `EVE_HURRY 2.3` (was a bare 1.4), `EVE_BELL 0.35`. `eveOutH(s, speed)` is the ONE priced walk home, stored as `a.eveOut` at the choice by both sources; `eveFits` now asks two bounds — the stand fits the window AND the walk home fits the night; at the post `a.eveLeave = max(hourEve() + EVE_STAND, EVE_GONE − a.eveOut)` and the retire rule reads it. `a.eveGoing` drives the hurry and makes the bell's *hold* (not its draw) be refused on the way home. `goHome(a, maxH)` gained a bound on the walk — from the deck the nearest door is 35 cells against the retrace's 33, so an unbounded `goHome` made the late walk *longer*. Third far post at **122.5**.
**Priced the brief's two asks against each other, and they collide** (`probes/evening-close-price.mjs`, 248 far-side retirements): the far posts are 33 cells / **6.0–9.2 h** (4.7 h at HEAD's hurry) from `EAST_GATE_A`, and their source releases nobody before `sunDown − 4`, so arrivals sit at **sunDown + 1.8** median. Pricing the round trip at the CHOICE in `stayOn` takes fits **41 → 2 in 248** — #85's stay would simply stop happening. So `stayOn` prices the **leave**, not the choice.
**Gates:** census PASS (people 247→278, +12%, inside HEAD's own 19% spread — the `greetPass` free-list change reshuffles the seeded world) · motion PASS vs a HEAD `--page` baseline · filmstrip night 0 POP · shots east/wide/courtyard/lane clean.
**Measured, candidate vs a HEAD control I ran** (same probes, same seeds): off-frame minus `eveEnd` gate **+2.61 → +1.46** med (max +5.48 → +1.76), stay **+4.39 → +2.15** (max +5.41 → +2.85), never-left **2 → 0**; posts lost to the bell **4 → 0**; nights holding a dusk agent at 03:00 **29/40 → 4/40**, and the four are at x 97–99, one to three cells short of the gate at 96.3, where HEAD's were mid-plaza at x 109–112. Far-post max-at-once over 60 evenings: HEAD `0:20 1:14 2:26`, candidate `0:34 1:12 2:9 **3:5**`. Witness pair `shots/b101-bridge-{cand,head}.png`: seed 3 day 6, three abreast at 23:05 against HEAD's two, and 0 dusk agents at 03:00 against HEAD's three.
**Verdict:** shipped, ~+45 lines.
**MISS:** 03h is not zero — 4 of 40 nights still have one stayer a few cells short of the gate, and the far end is empty on 34/60 evenings against HEAD's 20/60. Both are the same geometry: a post 4.7 h from every exit cannot be occupied at the window's close and clear three hours later, and pulling the leave earlier is the only lever that does not delete the stay.
**Surprise:** the fit test's first draft added `EVE_STAND` to *both* bounds and took the evening's gate arrivals from 67 to 24 — `eveEnd()` has already spent that hour, so charging it twice halved a fitting window that is only ~1.2 h wide to begin with.
**Law:** a window's end is the hour the last person is GONE, not the hour they start walking: price the walk home at the choice, or "the evening closes" only means the walking begins. And a hold on a priced walk must be refused or carried — `chatty()` is not the only one; the bell (`a.listen`) is a second, and a refusal must still spend both draws.
**Cue:** a page clip of a world box needs `r.x + project()·(r.width / (canvas.width / devicePixelRatio))` — `project()` returns CSS pixels, so dividing by the drawing-buffer width alone crops at half scale and lands on the wrong building.

## Iteration 102 — the sky's shadow lands on the town: soft banks travel across the courtyard, the allotments and the river with the wind (2026-09-02) [Sky, light & weather × Connect]

**Brief:** b102 — connect `drawClouds()` to the ground; the wide shot is where it pays.
**Did:** `cloudDrift()` is the ONE travel scalar (`drawClouds` reads it too, arithmetic unchanged); `drawCloudShade()` lays up to `CSH_N 14` soft ellipses on the ground plane in one `multiply` pass — live, after the items and before `applyLight`, so it shades people and trees with the ground they stand on. `cloudShadeF()` is a HUMP × `daylight` (`CSH_KNEE .04` → full by `CSH_RISE .14`, held to `CSH_FALL .55`, out by `CSH_SHUT .95`): a clear sky has nothing to cast, a lid casts nothing because the town is already inside it. Bands thrown downsun off `sunVec()`, wrapped by a new `mod()`, clipped below `hz`.
**Counted, nothing pinned** (`probes/cloud-shade-presence.mjs`, 348 daylit samples, 3 seeds × 8 d): **49%** carry visible shade, 29% deep. Mean frame share shaded rises 1% → 45% across cover 0.1→0.7 and falls back to 30% under the lid.
**Gates:** census PASS, **every group unchanged** (no `R()` draw ⇒ no reshuffle) · motion PASS · filmstrip day+night **0 POP** · cost under the noise floor (`frame-cost.mjs` 3.04→3.05 ms summer) · shots wide/courtyard/east/lane + 390×844 clean.
**Measured vs a HEAD control I ran:** canvas hash at 12 instants × 2 seeds is **IDENTICAL to HEAD at cover ≤ 0.039 and at any cover after dark**, differing only where the gate says. Lawn crop, drawn twice per instant so the day's arc cancels: **81% → 98% → 93%** of unshaded over 24 s. Travel per sim second, off the frame's own profile: east wind **−1.1..−1.35 cells**, west **+1.1..+3.4**, calm **+0..+0.9** — it reverses with `windSign`.
**Verdict:** shipped, ~+70 lines.
**Surprise:** I looked at the shaded frame and the unshaded frame in turn and called them identical. They differed by **65 luma** at the core; only the difference image and a grid of Δ% caught it. Two earlier designs died of the same blindness the other way — a scatter of soft overlapping patches measures as a real change and *is* a dimmer switch.
**Note for the manager:** `context-budget.mjs` opened this iteration at **49.0 KB / 46 KB — OVER**.
**Law:** What reads as weather is CONTRAST, not coverage — present-or-absent patches with sun between them, never all present at different strengths. N free hash draws leave a gap at the bottom of [0,1): stratify `(k + hash(k,s)) / N` when a threshold must be reachable at every level of what it gates.
**Law:** Judge a whole-frame change from a difference image and a number, never from two pictures looked at in turn — the eye normalises. Same trap in the instrument: cross-correlating non-negative profiles is DC-dominated and reports "it did not move"; mean-subtract, and take the per-term mean.
