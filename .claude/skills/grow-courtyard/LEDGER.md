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

## Iteration 77 — the frozen basin reads frozen: `fountainSkin()` lifts the ice mix from 0.43 to 1 at midwinter (2026-08-31) [Plaza & quay × Polish]

**Brief:** b74 — the basin skin capped at fountainIce()'s 0.43 max, so midwinter read as pale water, not ice.
**Did:** `FOUNT_ICE_MAX = (FOUNT_ICE − (1 − FOUNT_SWING)) / FOUNT_ICE` (0.43, the phase's real ceiling); `fountainSkin()` = ice/that, eased `k(2−k)`, 0 → 0 exactly. In `groundCol` the basin returns `c` untouched when skin ≤ 0, else `mix(c, mix('#b4c3c6','#e4ebec', skin), skin·(0.7 + 0.3·hash))` — per-cell floor 0.7 so no cell stays water. fountainIce/fountainJet/riverCol untouched; cached ground only, no per-frame draw.
**Gates:** census PASS (unchanged everywhere — draw-only) · visual PASS (`shots/b74-winter-east.png` vs `b74-head-winter-east.png`: white basin vs pale blue; summer wide unchanged) · motion PASS · perf skipped (cached layer). `probes/ground-rebuilds.mjs`: 133 / 130 per day before and after. gcv basin crop at summer noon hash-identical to HEAD; winter meanL 135 → 144 (crop includes rim/paving).
**Verdict:** shipped
**Surprise:** `probes/fountain-freeze.mjs`'s *summer* crop hash differs between two runs of the SAME file (the live plume/droplets sit inside it) — only its winter hash is a usable identity check. Hashing `gcv` (the cache the change lives on) was exact both ways.
## Iteration 78 — a watermill on the far bank: MILL footprint in buildGrid(), an undershot wheel over the water turning off riverRun() and stopped by fountainSkin(), a tail-race, a lamp lit all night (2026-08-31) [River & far bank × New element]

**Brief:** b76 — THE BET: the first new building since the loop began, sited by the worker at the north or south end of the green.
**Did:** `MILL = {130..133 × 19..24}` / `millAt()` → WALL in buildGrid(), so buildVolumes() grew the roof (eaveFor 4.7); drawFaceRow gives it ONE window (`MILL_WIN`) and a door, no random slots. `MILL_WHEEL` at x 126.35 over the water column, boat's line 116.5–121.5 clear, outside every towpath walker's x; `millAng += dt·MILL_RPS·millSpin()` in the update loop, `millSpin() = riverRun()·(1 − fountainSkin())` — exact riverRun() outside the frost, 0 at midwinter. `drawMillShadow` (before the walkers' row) and `drawMillWheel` (after) two items, #73. Tail-race streaks in drawRiverFlow scaled by spin. `windowLit`/`windowName` short-circuit on `millWindow()`; `nameAt` says 'the mill', `lookAt` names the wheel and its state. North end chosen: the park-gate routes all run rows 56–61; nothing walks the green north of the bench at row 27.
**Gates:** census PASS (WALL +135 = 15 cells × 9 samples, GRASS −135, developed +135; **baseline re-pinned**) · motion PASS · perf PASS (saturated 16.7 both) · day filmstrip 0 POP · `probes/mill-shots.mjs`: noon spin 0.683 dAng 0.615/s, 03:00 lit=true, midwinter skin 1.000 spin 0.000 dAng 0.000; crops `shots/b76-mill-{noon,night,winter}.png`.
**Verdict:** shipped (+115 lines).
**Surprise:** at rows 18–23 the footprint touched the nave (ny1 17) and the distance transform fused the two roofs into one building — the emergent roof reads adjacency as one block. One GRASS row of gap separates them. The wheel's first name read spin alone and called a half-frozen January wheel 'slow on the summer river' — name off the two causes (skin, run), not their product.
**Law:** two solid footprints that touch are ONE roof to buildVolumes() — leave a gap row, or you built an annexe.
## Iteration 79 — the warm evening's own arrivals: `spawnEveningAgent()` under `EVE_CAP`, priced by the places its walk REACHES; the window opens at sunDown − 2.5 h, not − 0.5 h (2026-08-31) [People & animals × New element]

**Brief:** b77 — a source of its own for the warm dry evening: deck, rail, quay and far benches, priced with `pathHours()` against the END.
**Did:** `eveOpen()` = day ≥ 1 ∧ warmth ≥ 0.6 ∧ dry ∧ `wetF() < 0.3` ∧ `windF() < 0.5` ∧ hour in [sunDown − EVE_LEAD 2.5, sunDown + 3). `EVE_SPOTS` (12 `taken` posts: rail y 12.5/14.5/16.5, near quay bench, two deck rail posts, far bench, three towpath posts). `spawnEveningAgent(room)` three `R()` whether or not a place fits; `eveFits()` = arrival + 1 h standing before `eveEnd()`; the stop ends by the retire rule `a.dusk && !eveOpen()`.
**Gates:** census PASS (reshuffle) · motion PASS · visual PASS (`shots/b77-eve-{wide,east}.png`) · night filmstrip 0 POP · `probes/evening-arrivals.mjs` 10 seeds × 4 d: summer 30/40 evenings open, 2.05 arrivals/evening, presence 4.3–4.9 from sunDown − 0.5 to + 4.5 h; winter 0/40 open (negative shown non-zero on HEAD).
**Verdict:** shipped, off-brief on the window: at − 0.5 h NOTHING fit in 40 evenings; at − 1.5 h one stop a night; at − 2.5 h (the tap's own lead) the brief's 4–8 at sunDown + 1 h. "Gone by + 3.5 h" cannot be met from a world edge: the shortest walk out is 2.6 h.
**Surprise:** the deck is the place the evening can least reach — the plaza crossing alone is ~4 h, so the two deck posts were chosen 0 times in 30 evenings. The deck's evening needs someone ALREADY on the far side (c118).

## Iteration 80 — the observer leans in: `#where` eases the camera onto one of four quarters and back; the ground cache is scaled through the ease, repainted once on arrival (2026-08-31) [The sill & the observer × Interaction/UX]

**Brief b78.** At 390 px the town is a strip; the plaza and far bank are not in the frame.
**Did:** the camera IS the projection: `resize()` writes the wide view to `cellW0/cellH0/topPad0/originX0`, `applyView({s,ox,tp})` scales `cellW/cellH` and moves `originX/topPad`; `FOCUS` untouched so a zoomed frame is an exact scale+translate. `QUARTERS` (Wide, Courtyard, Street, Plaza, Far bank), `viewFor(n)` fits the box (s ≤ 3.6), clamps `ox` inside the world. `whereGo(n)` eases on the real clock (`stepView(rdt)`, `VIEW_SECS 0.9`, cubic; `RM` snaps); the WIDE cache is painted once padded to the whole world (`groundPad()`, `gpadWant`, `gview`) and composited at `k = viewS / gview.s`; arrival sets `groundDirty`. `#where` button beside the clock (under it on a phone, `#clockcol`); `OFFERS` gains `where`; `__where(n, secs)`. Added `<meta name="viewport">`.
**Gates:** census PASS (unchanged) · motion PASS · visual PASS (`shots/b78-*.png`) · wide-view canvas hash IDENTICAL to HEAD at 390 and 1400 · `frame-cost.mjs` unchanged; `where-cost.mjs` ease 1.7 ms, zoomed rest 2.1–2.5 ms, the two repaints 11–23 ms once each.
**Verdict:** shipped.
**Surprise:** `courtyard.html` had NO viewport meta: a real phone laid the page out at 980 px and scaled down, so every "390 px" rule since #24 had never been what a phone showed (Playwright `isMobile:true` gave W = 940). Also: a wrapping flex plate sizes to ALL its items on one line; the desktop far-bank frame is clamped by the east edge into ~the plaza frame (c120).

## Iteration 81 — the rose window lit live: one eased ramp off `nightF` (`roseLit()`) sets glass, mullions, multiply and glow; the cache holds only the unlit disc (2026-08-31) [River & far bank × Polish]

**Brief b79.** c104: the rose window stepped at cache time (`nightF > 0.3` in `drawChurchFront`) while its relight ramped live — a two-sided dusk seam. Also c116.
**Did:** `drawChurchFront` paints the unlit glass only; `ROSE` is gone. In `applyLight` after the pane screen, `k = roseLit()` (smoothstep of `(nightF − ROSE_ON 0.3) / ROSE_RAMP 0.25`) on a live `project()`ed disc: lit glass 0.9·k, six mullions 0.7·k, night multiply clipped to the disc 0.8·nightF·k, screen 0.7·nightF·k, halo push. Projected per frame, so it no longer sits at cache coordinates under `#where`. `probes/fountain-freeze.mjs` summer crop reads `gcv`.
**Gates:** census PASS (unchanged) · motion PASS · visual PASS (`shots/east.png`, `shots/b79-night-wide-here.png`) · dusk filmstrip 0 POP · `probes/rose-dusk.mjs`: HEAD disc 150 → 169 → 188 across two frames (a Δ 5.37 step `pops()` did NOT flag); here 153 → 197 over an hour with no frame over the ordinary bucket Δ; rebuild count untouched; `fountain-freeze.mjs` summer hash now stable across runs.
**Verdict:** shipped (+30 lines).
**Surprise:** the first live disc lost the mullions — they were stroked in the cache OVER the lit glass and a 0.9-alpha live disc buried them. Anything lifted out of a cache carries what the cache drew on top of it. The same seam existed at DAWN reversed; one function of nightF fixes both ends.

## Iteration 82 — the carter: a horse-drawn cart down the cross street most mornings, loaded at the allotments' street gate, on to the stalls on market days (2026-08-31) [Cross street & allotments × New element]

**Brief:** b80 — THE BET: the first thing on the road bigger than a bicycle; own source, two draw items, walkers yield.
**Did:** attempt 1 left a ~220-line cart on disk UNCOMMITTED (budget gone before the gates); this attempt verified it, fixed three defects, landed it. `cartToday()` = hash(day,733) < 0.8; `cartDue()` opens max(sunUp+0.2, 6.3) for 1.4 h (after the 06.00 roll). `stepCart()`: south from y −4 at CART_SPEED 6.5 to the fence gate at row 45 (`sendToPlot`'s street gate — ALT_GATE opens onto the lane footway); `spawnLoader()` a holder from a hash-picked plot on that row, basket (`a.crop`) over the side → `c.load`, CART_LOAD_HOLD 1.2 s; then marketActive → lane road y 70.2, stop by MARKET_STALLS[1], out west at CART_TROT; else a sideways-kicked turn and back north (rows 79+ are VOID). `wetF() > 0.35` puts the mill's sacks on the bed (c117). `cartShove()` moves walker/stander/greeter off the axle-to-nose segment; the horse holds at 0.15× for anyone in its road. `drawCartBody` before the walkers' row, `drawCartFront` after, all through `project()` in a u/v/z frame. Named; `take(cart)`; no R().
**Gates:** census PASS (reshuffle only) · motion PASS · visual PASS (`shots/b80-0900-wide.png`, `cart-{gate,turn,north,lane,stalls}.png`) · day filmstrip 0 POP · perf PASS. `probes/cart-day.mjs` 10 seeds × 4 d: summer 30/40 days, gate 09:14, stop 3.1 h, loaded 30/30, stalls on all 10 market days, gone 16:07; winter 40/40, gate 09:41, sacks 8; **walkers inside 0/2514 and 0/2768 samples** (was 5).
**Verdict:** shipped (+224).
**Surprise:** the "at the gate with a gardener beside it" frame did not exist: basket over the side and pull-away happened in the SAME tick. The five "inside" were one browser whose own walk step undid the shove every tick.
**Law:** a displacement must OWN the tick — return after the shove or the walker steps back in. `nightF > 0.3` is dawn as well as dusk (0.36 at 06:30, summer): an "after dark" rule on nightF alone fires in the morning — qualify with the hour.
**Cue:** the loader pops in/out beside a plot; a holder already kneeling with a crop could load instead. Nothing leaves by the lane's EAST end. "Slow walking pace" is 6.5 cells/s: at 5 the stalls were reached at 15:45 — dusk on a winter market day.

## Iteration 83 — the weathervanes: both towers' arrows turn INTO the wind, live, on the same blend the smoke leans (2026-08-31) [Roofs & skyline × Deepen]

**Brief:** b81 — first brief of the new domain: the clock tower's static vane becomes a weathervane, driven by windSign·windF() through the windDir() blend; the same vane on the church tower; live if the tower is cached.
**Did:** both towers are in the ground cache (`drawBlocks(gtx…)`), so the cached arrow is gone and `drawVanes()` draws it live beside the live clock hands, before `drawSmoke`/`applyLight` (takes the night multiply as the cached one did). `VANES[]` two specs (CT top+4.8; the church rod between apex and cross, top+10.3). `vaneAngle(v) = π·(windSign+1)/2·windF() + vaneWob(v)`: 0 = HEAD's east arrow, which is also where an east wind (−1) holds it; a west wind (+1) swings it through north to west, linearly in windF() — a sign latched from calm steps nothing. `vaneWob()` = sin(0.6·simT + hash(v.x,v.y)·2π)·0.14 rad·(1 − windF()), 0 under RM; no R(). The arrow is a vertical plate: heading in the ground plane via the projected x/y bases at the vane, fins ±2 px in screen y, so it foreshortens edge-on when pointing north.
**Gates:** census PASS (unchanged) · motion PASS · visual PASS (`shots/wide.png`, `east.png`, `b81-vane-{clock,church}-{calm,west,east}.png`) · day filmstrip 0 POP · perf skipped (two triangles) · `probes/vane.mjs`: windF 1 sign ±1 → tips (−5, 0)/(+5, 0) clock, (−4, 0)/(+4, 0) church (mirror PASS); calm 1.9°/6.6° off rest under a ±8° wobble (PASS); wobble live differs from HEAD (fired).
**Verdict:** shipped (+37 lines).
**Surprise:** "IDENTICAL to HEAD" is unreachable for a shape lifted out of a cache — HEAD hashed stable twice; here 4 tiles differed, every one at the arrow, ±1 on 12 antialiased edge pixels: the cache composites the triangle's edge over its own pixels, then over the sky; live it composites once. Zero difference anywhere else. The first identity run differed in 108 tiles all over the town: two rAF frames after `__warp` are NOT the same instant on two pages — pin with `drawScene(simT, 1/30)` inside the evaluate (`noon-identical.mjs`), never `await frame()`.
**Law:** a probe that reads the canvas after `requestAnimationFrame` is reading a frame it did not pin — the live loop's own dt; call `drawScene()` yourself. A pixel identity gate on a shape moved between a cache and a live pass passes at ±1 on its edge pixels and nowhere else — assert the diff's LOCATION, not zero.
**Context:** `rotate-ledger` reports the inventory OVER (11.0/9.5 KB, 48 entries; the carter line 363 B) — it was over before this iteration; a manager condense.

## Iteration 84 — the sundial: a stone plinth and gnomon on the inner lawn, its shadow cast live from sunVec() (2026-08-31) [Courtyard & garden × New element]

**Brief:** b82 — a sundial inside the bed ring, shadow per frame off the roofs' own sun, one non-walkable cell, named with the hour.
**Did:** `DIAL = 13`, `SUNDIAL = {x:32, y:35, h:0.85}` — inner lawn south of the linden (27 cells from a bench, 13 from the RING, wear 0 around it after four days). `buildGrid` sets it, `pairStands` refuses it, the ground cache paints it GRASS. `drawSundial` a live item at y+0.9 (after the linden): plinth shadow + the gnomon's throw on the grass, `dialThrow(h)` = −SUN·h·shOffset()/SUN[2], alpha 0.22·daylight·shadowF(), width × shSpread(); plinth, face with hour lines and the reading clipped to the plate, gnomon. `sundialName()` reads the SUN's hour (`12 + (sunArc−0.5)·dayHours`, 45 min behind the clock); night and shadowF < 0.5 say so. Census TN gets 'DIAL'. No R().
**Gates:** census PASS — ONE structural move (tileKinds +1, DIAL +1, GRASS −1 per cell), the rest churn (the cell no longer rolls the daisy R()); **baseline re-pinned** · motion PASS · visual PASS (`shots/b82-sundial-sheet.png` 3×) · day filmstrip 0 POP · perf PASS (+0.0%) · `probes/sundial.mjs`: throw (−0.35,−0.26) 08:00 → (0,−0.22) 12:45 → (0.22,−0.24) 16:00 summer; winter noon 0.70 vs summer 0.22 cells; lid shadowF 0.2 + name flips; pixel on the throw 211 vs 230 with the draw stubbed (margin 19); all PASS.
**Verdict:** shipped (+85 lines).
**Surprise:** "walkers already route around non-walkable cells" is not how this town walks — routes are WAYPOINTS (RING nodes, gapPt, napAt, kids, picnics) and nobody reads the grid between them; the DIAL cell keeps a companion off it and nothing else. The inner lawn is the only grass no route crosses but the nappers' two gap lines — that chose the site. And a summer throw (0.44 cells at 08:00) is shorter than the plinth's radius: the reading lives on the face; the ground shadow shows evenings and winter (1.64 cells at a winter 08:00).
**Law:** a "non-walkable cell" holds only where a route's ENDPOINTS are chosen — walkers never read the grid between waypoints; keep a cell out of every target set (ring nodes, spot pickers), not just out of the grid.
**Cue:** the inner lawn is the linden's shade at maturity — the dial sits inside the tree's shadow ellipse all day, a shadow within a shadow; name it 'in the linden's shade' when the crown is out, or thin the tree's shadow there.

## Iteration 85 — the deck's evening comes from the far side: a visitor whose afternoon ends inside a warm evening stays on, at the footbridge's east rail (2026-08-31) [People & animals × Connect]

**Brief:** b83 — c118: EVE_SPOTS' deck posts fit 0 times in 30 evenings from any gate; give the deck an ALREADY-THERE source via the one re-route, priced at the choice.
**Did:** `stayOn(a)` in the retire block (after the band's callIn): an `a.east` visitor (not the audience, not the night rail) getting up on the far bank (x > RIVER_X1 − 1, y < 60) while eveWeather() holds and !skyLifts(a) takes the nearest free deck post whose arrival + EVE_STAND lands inside [sunDown − EVE_LEAD, eveEnd()) — walk = `deckWay(a)`, their own retrace up to [TOW_WALK, DECK_WALK] (or straight up the towpath). Two NEW posts at the deck's EAST end (`stay:1`, x 126.5/124.5, mirrors of 114.5/116.5). callIn's model: a.east = false, a.dusk/a.stay/a.eveSpot set, dwell `hash(speed, 97)`, no R(); out by the alley over the deck; retire by `a.dusk && !eveOpen()`. `eveCount()` excludes stayers (gate arrivals keep EVE_CAP), `eveAll` subtracts both from laneCount (the cafeNow/cafeAll pattern). Named 'someone who stayed on, leaning on the footbridge rail'; `o.stay` in `__entities`.
**Gates:** census PASS (reshuffle; inEast −2 = the stayers leaving the count) · visual PASS (`shots/{wide,east}.png`, `b83-deck-evening-s{3d4,1d6}-3x.png` at sunDown + 1 h) · motion **FAIL on dusk/cart jumps 0→1, ruled not mine**: `probe-cartjump` replayed the scene on HEAD and here — the same 3.9-cell step at the same instant (step 169, 17:05) on both seeds, HEAD too; the cart's northbound trot is above ABS_JUMP 2.5 and only the median (how long walkers held it) decides the flag · night filmstrip 0 POP · perf skipped (one more filter/frame). `probes/evening-arrivals.mjs` (extended): summer 10 × 4 d — stayers 0.57/evening, **a deck post stood on 18/31 open evenings (58%)**, presence at +1 h 5.3 → 6.3 (HEAD run of the same probe), gate arrivals per open evening 1.97 → 1.87 (reshuffle: open evenings 34 → 31); winter 0.
**Verdict:** shipped, off-brief on WHICH posts: `probes/evening-stay-price.mjs` on HEAD — 94 far-side east retirements in 40 evenings, a walk to the WEST posts fit 1/40 (12 cells of deck ≈ 2.75 h), to the east end 31 (23/40 evenings). The brief's posts are unreachable from either side; the far side got its own pair.
**Surprise:** the rel −4 h spike of 171 retirements was the concert AUDIENCE (a.east && a.band), 324 of 418 far-side retirements — by far the deck's biggest possible source, and 290 of them stand SOUTH of the bandstand with no route north but through it (c125). At sunDown + 1 h exactly, a stayer is at the rail on only 2 of 30 evenings sampled although 18/31 evenings have one at some hour: walks 0.6–5.5 h and dwells of 1.7–4.4 h scatter the occupancy across the window — a per-instant crop undercounts a presence.
**Law:** the motion gate's jump is d > ABS_JUMP AND d > 8 × the entity's MEDIAN step in the 60 s window — a fast thing that mostly stands (the cart at CART_TROT, held for walkers) flips between pass and fail on the reshuffle alone; replay the scene on HEAD and compare the worst step's instant, not the verdict.
**Cue:** the audience: a route from the BAND_SLOTS round the bandstand to [FAR_WALK, DECK_WALK] would make the concert's end the deck's evening (34 of them fit with a path, walks 4.5–6.7 h). The east-end posts stand at the ramp foot; nothing yet names the deck's two ends apart.

## Iteration 86 — the camera's two loose ends: cached FACES hit-tested through the ease's k; the Far bank quarter fills a wide frame (2026-08-31) [The sill & the observer × Polish]

**Brief:** b84 — c119 (pane glows and hit-boxes drift off their panes mid-ease) + c120 (a desktop's Far bank IS the Plaza frame).
**Did:** `faceAt()` maps every cached face through `k = viewS/gview.s` and the origin shift (`originX − k·gview.ox`, `topPad − k·gview.tp`) — the composite drawScene puts gcv through; live faces untouched. `viewFor()` takes a per-quarter `share`: s rises to `W·share/((x1−x0)·cellW0)` (≤ VIEW_SMAX). `QUARTERS[4]` = y 0..50, share 0.3 → desktop s 3.18 (Plaza 1.89), frame x 96..138, d 7..43: rose window, mill, wheel, deck, jetty, bandstand; phone 3.02 → 3.5 (the tighter box), d −2..52.
**Gates:** census PASS (unchanged — nothing draws or rolls) · motion PASS · visual PASS (wide/courtyard/east/lane; `shots/b84-desk-far{,-night}.png`, `b84-phone-far.png`, `b84-church-{midease,arrived}-night.png`) · `probes/where-faces.mjs` 58/58: every cached window on screen hit at its LIVE centre, 5 instants × 4 quarters × 2 sizes (HEAD: 0/32 desktop, 0/8 phone mid-ease, boxes 350–418 px off) · `where-identity` IDENTICAL ×4 · `where-cost` wide 3.0 / ease 1.8 / far bank 2.1 ms against its in-session control · perf skipped (nothing per-frame).
**Verdict:** shipped (+13 lines). HALF the brief rejected on evidence: the LIT_PANES/halo half of c119 was never broken — `drawLitPanes` → `drawPane(ctx)` projects live every frame, and the probe puts each live quad on the scaled cache to 0.01 px on HEAD too.
**Surprise:** `where-identity` said DIFFERS on a change that cannot touch the wide frame — it hashes `/tmp/head.html`, a fixture an earlier iteration wrote (mtime Aug 31 04:27) and nobody refreshed; regenerated from `git show HEAD:` → IDENTICAL. And "the mill fills a third of the frame" is unreachable: 3 cells at VIEW_SMAX is 8% of 1228 px; the far bank (13 cells) is what can fill a third, and only by cutting the church or the bandstand — the y 0..50 box keeps both by dropping the lane.
**Law:** a probe's fixture in /tmp is whatever LAST wrote it — `where-identity`'s "HEAD" is a file, not `git show HEAD:`; regenerate a fixture inside the probe (or print its mtime) before believing a DIFFERS. And price a brief's PREMISE with a 20-line probe before building: half of b84 described a bug that did not exist.
**Cue:** the frame's east clamp is priced at the bottom row (p = 1): at d 43 the far bank frame's right edge is x 142, four cells past GW — the cache's over-paint hides it here, but a quarter box near the top of the world could show void. `share` is generic: the Plaza (30 cells) could take share ≥ 0.5 on a 1400 px frame.
