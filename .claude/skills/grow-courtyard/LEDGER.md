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

## Iteration 88 — river mist: a weather nobody had seen; ONE rate-capped scalar rises off the water before sunrise on still, clear, cold-or-wet mornings, veils the river and far bank live, and the sun burns it off (2026-08-31) [Sky, light & weather × Scale/World]

**Brief:** b86, rung 4a (attempt 3 — the first two left nothing on disk: no `mist` in the source, no probe, no inventory line).
**Did:** `mist` stepped by `stepMist()` beside `stepWet`: target 1 in [sunUp − 1, min(sunUp + 2.2, 09:00)) while !raining ∧ windF < 0.35 ∧ cloudCover < 0.5 ∧ warmth < 0.65 ∧ (wetF > 0.2 ∨ warmth < 0.55); rises in 0.8 h, falls at 1/h × (0.3 + 1.4·daylight + 1.5·windF + rain) — a dark calm hour barely thins it, a rising wind clears it. No hash, no R(): every input is itself rate-capped. `mistAt(x)` the weight (1 on the water, 0 eight cells inland). `drawMist()` after `drawRiverFlow`, before `applyLight`: a ¼-res offscreen — horizontal gradient of mistAt at the polygon's mid row (the pinch moves the banks < 2 cells over the run), six hashed wisps sliding downstream, a `destination-out` fade above row 13 so the spire and the clock tower stand out; stops at the lane. HAZE mixed 0.4·mist toward `mistCol()` at cache time; lamp halos × (1 + 0.7·mistAt); `nameAt` on river WATER → 'mist on the river'; announce at the rising 0.5; the morning lapse's landing line names it.
**Gates:** census PASS (unchanged, ×2) · motion PASS · visual PASS (`shots/mist2-*.png`; courtyard + lane untouched) · dawn and burn-off filmstrips 0 POP · perf PASS (16.70 both, vsync-bound) · `probes/mist-identity.mjs`: `mistTarget` forced 0 over the whole run → canvas IDENTICAL to HEAD; unforced, 110/141 differing tiles inside the veil's x-range, the other 31 the out-of-frame roofs at the LEFT edge (HAZE); +0.08 ms/frame at mist 1 · `probes/mist-year.mjs` 8 seeds × 26 d sampled at sunUp + 0.5: **opens 17/48 shoulder, 17/80 winter, 0/80 summer mornings, 0 in rain** (the brief's literal thresholds: 9/48) · `probes/mist-landing.mjs`: from 20:00 the clock tap lands at 06:36 = sunUp + 0.5 with mist 1.00 and 'mist on the river' under the pointer; 0.74 at 08:20, gone 09:08.
**Verdict:** shipped (+~115 lines). Off-brief on the thresholds, priced by the histogram as the brief asked.
**Surprise:** a scalar held AT its target oscillated ±r every step — `else if (mist > 0)` burned it whenever `tgt > mist` was false, which includes tgt === mist === 1 (the landing curve read 0.99/1.00/0.99 before the fix). And a ground-hugging layer cannot make towers "stand out" in this oblique projection: every ray crosses the same thickness of it, so the clearing is a fade in SCREEN depth (rows 1.5–13), not a height.
**Law:** a rate-capped scalar's two branches are `tgt > x` and `tgt < x`, never `else` — at the target the else branch runs, and a ±r flicker at the ceiling passes every gate but a printed curve.
**Cue:** 3 of 34 mist mornings still read mist 0.3–0.76 with windF 0.44–0.61 at sunUp + 0.5 — a windy day's wind rises from the 06:00 roll, AFTER the mist formed (realistic); "never opens in wind" must be sampled at the OPEN (sunUp − 1), not at + 0.5.
**Budget:** context-budget read OVER after this entry (46.5 / 46 KB) — the manager's signal, not mine to fix this pass.

## Iteration 89 — the audience becomes the deck's evening: a listener whose concert ends inside a warm evening walks round the bandstand and onto the footbridge's east posts instead of home (2026-08-31) [People & animals × Connect]

**Brief:** b87 — c125: route a share of the concert audience round the bandstand to the deck's `stay:1` posts by `stayOn()`'s own pricing.
**Did:** `stayOn()` no longer refuses `a.band`; `way = a.band ? bandWay(a) : deckWay(a)`. `bandWay()` names corner points round the base ellipse (`BANDSTAND.x ± BAND_ROUND 3.3`) to `[FAR_WALK, …]`, `[TOW_WALK, DECK_WALK]`. At the choice the green slot goes back, `a.band = false`, `a.fromBand = true`, `a.east = false`. Own `say`/`personName`; `__entities` `fromBand`. Plus: `chatty()` refuses `a.stay`.
**Gates:** census PASS ×2 · motion PASS ×2 · visual PASS (`b87-band-deck-s1.png`) · strike filmstrip 0 POP · `evening-stay-price.mjs` (CHOICE + FOLLOW) 10 seeds × 4 summer days: HEAD 274/310 listeners NOPATH; here **32/33 in-weather concert evenings put the audience on a deck post, 19 both posts; 51/246 chose (the two posts cap it); FOLLOW 51 tracks, 0 through the base, 43 stood**.
**Verdict:** shipped (+~20 lines).
**Surprise:** 14/56 stayers walked straight PAST their post out through the alley — not the route: two listeners from the same concert passed within GREET_R on the towpath and stopped for a 2.7 h word, arrived after `eveEnd()`, stood ONE frame, and the retire rule sent them on. Excluding stayers from `chatty()` took it to 43/51; the other 8 are the bell's `a.listen`.

## Iteration 90 — the lane's east end was already a real end; the one unbuilt clause was the cart's way home, which now has two ends (2026-08-31) [Lane & market × Connect]

**Brief:** b88 — c122: "nothing has ever arrived or left by the lane's EAST end; a nearer-end exit; a share of the cart's departures east."
**Premise REJECTED for the walkers:** `spawnLaneAgent` has rolled `fromW = R() < 0.5` since the first commit — half its arrivals enter at `GW + 2.5` and every itinerary exits at the opposite end. `probes/lane-ends.mjs` on HEAD, 10 seeds × 4 days: **entries W 40 · E 32 · N 13; exits W 26 · E 18 · N 19**. The "whole lane back" case is 2/102 — no rule built. The inventory's "WEST edge only" line was the brief restated; corrected.
**Did:** `cartHomeX()` = `hash(day, 763) < CART_EAST (0.5) ? GW + 4 : −4` as the last waypoint after the market stop — per-day hash, no `R()`, west days HEAD-identical; salt chosen by histogram (first east day 10).
**Gates:** census PASS (unchanged) · motion PASS · visual PASS · `probes/cart-east.mjs` E on 10/14/30, W on 22/26, both seeds · `cart-east-shots.mjs` trotting east over the bridge 18:50, under the lit gatehouse 19:16 · filmstrip 0 POP.
**Verdict:** rejected — the premise; ~8 lines shipped for the cart clause.
**Surprise:** `hash(day, 733)` is seed-independent: a 4-day window held a market day the cart skips in EVERY world — a short window is one sample of the calendar, not ten seeds' worth.

## Iteration 91 — the vanes get silhouettes: a weathercock on the church, an arrow with a tail and a fixed cardinal cross on the clock tower, both named with the wind they stand in (2026-08-31) [Roofs & skyline × Polish]

**Brief:** b89 — c123: the church vane goes to a 1-px sliver edge-on and neither vane is named.
**Did:** `VANES[]` entries carry `kind` and `name`. `vaneAxes()` gives the heading AND its ground-plane normal as screen vectors, so a plate foreshortens while the width across it grows. `kind:'cock'`: body ellipse (seen half-width `max(along, COCK_HALF_W·len·|nx|)`) + a `COCK[]` plate, legs to a ball. `kind:'arrow'`: head, shaft, swallow tail, and a W/E/N/S cross-bar in 6 px bold fixed in SCREEN space. `vaneAt(p)`/`vaneName(v)` ('idle in the calm' / 'into a [light] north-west wind' in eighths); `lookAt` asks after the mill wheel. `vaneAngle()` untouched; no `R()`.
**Gates:** census PASS · motion PASS · visual PASS (`b89-vane-*` at 3×) · filmstrip 0 POP · `probes/vane.mjs`: mirror PASS; **north footprint 23×18 / 5×10 px, was 1 wide**; names PASS; **162 px differ from HEAD, 0 outside the two vane crops**.
**Verdict:** shipped (+~70 lines).
**Surprise:** #83's "clock arrow IDENTICAL to HEAD" probe went DIFFERENT the moment the arrow grew a cross-bar — an identity-with-HEAD assertion outlives the change it was written for by exactly one iteration; the assertion moved to the diff's LOCATION. A 6 px letter is a smudge at 1× but the CROSS reads, and the cross carries the heading.
