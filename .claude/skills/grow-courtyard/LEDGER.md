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

## Iteration 83 — the weathervanes: both towers' arrows turn INTO the wind, live, on the same blend the smoke leans (2026-08-31) [Roofs & skyline × Deepen]

**Brief:** b81 — first brief of the new domain: the clock tower's static vane becomes a weathervane, driven by windSign·windF() through the windDir() blend; the same vane on the church tower; live if the tower is cached.
**Did:** both towers are in the ground cache (`drawBlocks(gtx…)`), so the cached arrow is gone and `drawVanes()` draws it live beside the live clock hands, before `drawSmoke`/`applyLight` (takes the night multiply as the cached one did). `VANES[]` two specs (CT top+4.8; the church rod between apex and cross, top+10.3). `vaneAngle(v) = π·(windSign+1)/2·windF() + vaneWob(v)`: 0 = HEAD's east arrow, which is also where an east wind (−1) holds it; a west wind (+1) swings it through north to west, linearly in windF() — a sign latched from calm steps nothing. `vaneWob()` = sin(0.6·simT + hash(v.x,v.y)·2π)·0.14 rad·(1 − windF()), 0 under RM; no R(). The arrow is a vertical plate: heading in the ground plane via the projected x/y bases at the vane, fins ±2 px in screen y, so it foreshortens edge-on when pointing north.
**Gates:** census PASS (unchanged) · motion PASS · visual PASS (`shots/wide.png`, `east.png`, `b81-vane-{clock,church}-{calm,west,east}.png`) · day filmstrip 0 POP · perf skipped (two triangles) · `probes/vane.mjs`: windF 1 sign ±1 → tips (−5, 0)/(+5, 0) clock, (−4, 0)/(+4, 0) church (mirror PASS); calm 1.9°/6.6° off rest under a ±8° wobble (PASS); wobble live differs from HEAD (fired).
**Verdict:** shipped (+37 lines).
**Surprise:** "IDENTICAL to HEAD" is unreachable for a shape lifted out of a cache — HEAD hashed stable twice; here 4 tiles differed, every one at the arrow, ±1 on 12 antialiased edge pixels: the cache composites the triangle's edge over its own pixels, then over the sky; live it composites once. Zero difference anywhere else. The first identity run differed in 108 tiles all over the town: two rAF frames after `__warp` are NOT the same instant on two pages — pin with `drawScene(simT, 1/30)` inside the evaluate (`noon-identical.mjs`), never `await frame()`.

## Iteration 84 — the sundial: a stone plinth and gnomon on the inner lawn, its shadow cast live from sunVec() (2026-08-31) [Courtyard & garden × New element]

**Brief:** b82 — a sundial inside the bed ring, shadow per frame off the roofs' own sun, one non-walkable cell, named with the hour.
**Did:** `DIAL = 13`, `SUNDIAL = {x:32, y:35, h:0.85}` on the inner lawn south of the linden; `buildGrid` sets it, `pairStands` refuses it, the cache paints it GRASS. `drawSundial` a live item at y+0.9: plinth shadow + `dialThrow(h)` = −SUN·h·shOffset()/SUN[2] on the grass, alpha 0.22·daylight·shadowF(), width × shSpread(); plinth, face with hour lines, gnomon. `sundialName()` reads the SUN's hour (45 min behind the clock); night and shadowF < 0.5 say so. Census TN gets 'DIAL'. No R().
**Gates:** census PASS — tileKinds +1, DIAL +1, GRASS −1, the rest churn; **baseline re-pinned** · motion PASS · visual PASS (`shots/b82-sundial-sheet.png`) · day filmstrip 0 POP · perf PASS (+0.0%) · `probes/sundial.mjs`: throw (−0.35,−0.26) 08:00 → (0,−0.22) 12:45 → (0.22,−0.24) 16:00 summer; winter noon 0.70 vs 0.22 cells; lid + name flips; pixel margin 19; all PASS.
**Verdict:** shipped (+85 lines).
**Surprise:** routes are WAYPOINTS and nobody reads the grid between them — the DIAL cell keeps a companion off it and nothing else; the inner lawn is the only grass no route crosses but the nappers' gap lines, which chose the site. A summer throw (0.44 cells at 08:00) is shorter than the plinth's radius: the reading lives on the face; the ground shadow shows evenings and winter (1.64 cells).

## Iteration 85 — the deck's evening comes from the far side: a visitor whose afternoon ends inside a warm evening stays on, at the footbridge's east rail (2026-08-31) [People & animals × Connect]

**Brief:** b83 — c118: EVE_SPOTS' deck posts fit 0 times in 30 evenings from any gate; give the deck an ALREADY-THERE source via the one re-route, priced at the choice.
**Did:** `stayOn(a)` in the retire block (after the band's callIn): an `a.east` far-bank visitor (not audience, not night rail) getting up while eveWeather() holds and !skyLifts(a) takes the nearest free deck post whose arrival + EVE_STAND lands inside [sunDown − EVE_LEAD, eveEnd()) — walk `deckWay(a)`. Two NEW posts at the deck's EAST end (`stay:1`, x 126.5/124.5). callIn's model: a.east = false, a.dusk/a.stay/a.eveSpot, dwell `hash(speed, 97)`, no R(); out by the alley over the deck; retire by `a.dusk && !eveOpen()`. `eveCount()` excludes stayers; `eveAll` off laneCount. Named; `o.stay` in `__entities`.
**Gates:** census PASS (reshuffle) · visual PASS (`shots/b83-deck-evening-*.png`) · motion FAIL on dusk/cart jumps, ruled not mine: `probe-cartjump` replays the same 3.9-cell step at the same instant on HEAD · night filmstrip 0 POP. `probes/evening-arrivals.mjs`: summer 10 × 4 d — stayers 0.57/evening, **a deck post stood on 18/31 open evenings**, presence at +1 h 5.3 → 6.3; winter 0.
**Verdict:** shipped (+53), off-brief on WHICH posts: `probes/evening-stay-price.mjs` on HEAD — a walk to the WEST posts fit 1/40 (12 cells of deck ≈ 2.75 h), to the east end 31/40. The brief's posts are unreachable from either side.
**Surprise:** the rel −4 h spike of 171 retirements was the concert AUDIENCE — 324 of 418 far-side retirements, 290 of them stood SOUTH of the bandstand with no route north but through it (c125 → b87).

## Iteration 86 — the camera's two loose ends: cached FACES hit-tested through the ease's k; the Far bank quarter fills a wide frame (2026-08-31) [The sill & the observer × Polish]

**Brief:** b84 — c119 (pane glows and hit-boxes drift off their panes mid-ease) + c120 (a desktop's Far bank IS the Plaza frame).
**Did:** `faceAt()` maps every cached face through `k = viewS/gview.s` and the origin shift; live faces untouched. `viewFor()` takes a per-quarter `share`: s rises to `W·share/((x1−x0)·cellW0)` (≤ VIEW_SMAX). `QUARTERS[4]` = y 0..50, share 0.3 → desktop s 3.18 (Plaza 1.89), frame x 96..138: rose window, mill, wheel, deck, jetty, bandstand; phone 3.5.
**Gates:** census PASS (unchanged) · motion PASS · visual PASS (`shots/b84-*.png`) · `probes/where-faces.mjs` 58/58 cached windows hit at their LIVE centre, 5 instants × 4 quarters × 2 sizes (HEAD: 0/32 desktop) · `where-identity` IDENTICAL ×4 · `where-cost` wide 3.0 / ease 1.8 / far bank 2.1 ms.
**Verdict:** shipped (+13 lines). HALF the brief rejected on evidence: the LIT_PANES/halo half of c119 was never broken — `drawLitPanes` projects live every frame, to 0.01 px on HEAD too.
**Surprise:** `where-identity` said DIFFERS on a change that cannot touch the wide frame — it hashes `/tmp/head.html`, a stale fixture; regenerated from `git show HEAD:` → IDENTICAL. And "the mill fills a third of the frame" is unreachable: 3 cells at VIEW_SMAX is 8% of 1228 px; the far bank (13 cells) is what can fill a third.

## Iteration 87 — the eyot: the river's first landform, a reed-ringed island in the east half with a willow leaning over the channel; ducks nest on it in spring, the swans take it as a third bank (2026-08-31) [River & far bank × Scale/World]

**Brief:** b85 — THE BET, rung 4b: an island (new tile, census moves), shingle, reeds, ONE willow on windDir(), swans' third bank, ducks nesting, streaks parting; the boat's channel untouched.
**Did:** `EYOT = 14`; `EYOT_AT` (124.3, 46, rx 1.75, ry 5) evaluated ONCE in `buildGrid`; `onEyot/offEyot/eyotShore` read the tile back. 26 cells. The cache paints them as WATER and the island WHOLE in `drawEyot()` (three cell-columns were a rectangle). `drawWillow` live: 22 hashed fronds, lean windSign·windF()·gust, bare whips in winter. Streaks, cache ripples and night columns skip the tile. Swans: `eyotShore` joins `nearBank`; `SWAN_EYOT_PULL` 4; every target and step through `offEyot`. Ducks: `nestF()` (0.16–0.44) wants 2 `d.eyot` ducks off the EAST shore, on the nest after dark. Named; `pairStands` refuses it; TN + 'EYOT'. `QUARTERS[4]` x0 122, y1 53.
**Gates:** census PASS — **EYOT +26, WATER −26, tileKinds +1, ducks +2 in spring; baseline re-pinned** · motion PASS · visual PASS (`shots/b85-*.png`) · day filmstrip 0 POP · `frame-cost.mjs` ±0.1 ms (perf.mjs 16.70 both sides: vsync-bound) · `probes/eyot.mjs` 10 seeds × 4 d: **13 boats, 3956 frames, 0 inside**; swans 0/13480 on the turf, 1288 preen samples at its shore (4/10 seeds); names exact · `where-faces` PASS.
**Verdict:** shipped (+222). speciesKinds NOT moved: `SPECIES` is the planting CA; a tree is an item, not a species.
**Surprise:** the far bank's own quarter could not see the island — HEAD's box shows rows 5–42.5 on a desktop, and a `share` raises s PAST the height fit while the frame keeps the box's centre: my first widened box (share 0.37) reached row 44. Share 0.3 shows rows 1.5–48 at 2.6× (phone 0–51 at 3.3×). And the east bank at x 125.4 is nearer than the island's shore from everywhere but the channel: without a pull the eyot won a preen on 2/10 seeds.
**Law:** a quarter's `share` sets s from WIDTH alone; price a box's rows with `project()` on the target frame — the foreground sill strip eats the bottom 7% of every frame.
**Cue:** the eyot is a place nobody can reach: a punt from the jetty (JETTY x 128.4, y 35) is the only way onto it — a rung-5 vector. Also: the willow's fronds hang below the sill strip in the Far bank quarter on a desktop.
