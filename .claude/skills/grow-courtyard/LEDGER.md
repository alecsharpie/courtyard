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

## Iteration 59 — the paving remembers the rain: wetness, a rate-capped scalar the cached ground and the night lamps read (2026-08-29) [Plaza & quay × Connect]

**Brief:** b56 — a `wetness` 0..1 world scalar; PAVED cells darken in the cached ground, bucketed; lamp bars on wet paving at night.
**Did:** HEAD already had `wet`, an 18 s countdown driving a live sheen on the lane — replaced by `wetness`/`wetF()`: `stepWet()` rises `rainFall/WET_RISE` (3 s), dries `1/WET_DRY` (7 s) × daylight × warmth, lands ON 0. Sheen = `0.16 × wetness`. `wetCol()` pulls PATH/SIDE/ROAD toward `#3f4650` by `wetPainted` (5 buckets, set in `drawGround`, `simStep` dirties on a bucket change). `WET_LAMPS` = 22 lamps over paving; `drawWetLights()` after `drawRiverLights`, `0.30 × wetness × nightF`. No R().
**Gates:** census PASS · motion PASS · `wet-year.mjs`: shower ends at 0.90, dry in 3.14 h; +3.5 h ground hash identical to HEAD · `ground-rebuilds.mjs` dry days = HEAD, rainy +9 · `frame-cost.mjs` unchanged · filmstrip 0 POP · `wet-shots.mjs` crops.
**Verdict:** shipped.
**Surprise:** at +3.5 h the lane still differed from HEAD by 15 levels on an identical ground hash — HEAD's `wet` sheen outlasted the rain by ~8 sim hours. The sheen now ends when the paving dries; on a winter night it hangs on longer than HEAD's did (c97).

## Iteration 60 — a tap on a person FOLLOWS them: the sill line stays on one agent, a ring under their feet, a closing line on despawn (2026-08-29) [People & animals × Interaction/UX]

**Brief:** b57 — let a tap hold one walker: the sill rewrites as their act changes, a marker rides under the feet, the line closes with what became of them.
**Did:** `livingAt()` records `livingHit` — one hit-test. Click on a person → `followPerson(who)` (toggle) and return, so no crumbs land under them; any other tap releases first. `followLine()` = 'following ' + `personName(a)`, read per frame via `updateNaming` — outranks pointer AND ticker, still cleared by an invite hold. `followLost(a)` at the ONE despawn site: door (+ 'lamp lit at HH.MM' off HOMES), lane, cross street, east, west. `drawFollowMark()` after the balloon, before the rain. `OFFERS[2] = follow`; `__follow()`; `__entities` `followed:1`.
**Gates:** census PASS · motion PASS · `probes/follow.mjs` seed 7: 3 distinct acts in 12 h, a leaver closes after 21.75 h 'left by the lane', marker-to-feet 0.7 px, second tap releases, phone 390px: plate/clock/ticker none, 0 px over · a homer: 'went in at the door, lamp lit at 3.25' · `naming.mjs` 42/42 · shots clean.
**Verdict:** shipped.
**Surprise:** 'on the last leg' is not 'leaving' — the first leaver pick was a sitter walking to a bench and the probe waited 48 h for a despawn that never came. Two probe rewrites went to the instrument, none to the page.

## Iteration 61 — four things built lately made visible at 1x: warm panes and rose window after the night tint, furrowed turned earth, 5 px bunting, a whiter dusted lawn (2026-08-29) [Cross street & allotments × Polish]

**Brief:** b58 — c91 grey lit panes at midnight, c88 turned earth lost on brown, c84 3 px flags, c83 pale-green snowed lawn at dawn.
**Did:** `LIT_PANES[]` (per frame, reset with LIT) takes each lit pane's screen quad from `drawPane`; `applyLight` fills them in `screen` at `0.7·nightF` after its multiply — the draw ORDER was right, the multiply took the warmth out. The rose window was worse: `drawChurchFront` pushed its LIT halo at CACHE time, so it existed on the rebuild frame only; now `ROSE = [x,y,r]` and the same pass relights it every night frame. Turned earth: colder base + two furrows and a lit ridge per cell in the cached detailing. Flags half-width `max(2.5, 0.3·cellW)`, two a span. Snow on GRASS mixed by `1−(1−sn)^1.8`, `SNOW_COL #e2e8f2`.
**Gates:** census unchanged · motion PASS · night filmstrip 0 POP · `probes/polish-1x.mjs`: pane R−B 62–71 (HEAD −5…5), rose 49 (HEAD −37), turned-vs-fallow 29.4 (HEAD 26.5), flags 5 px, dusted lawn B−G +6.8 (HEAD +4.5) · noon hash identical to HEAD with the bandstand masked · `polish-crops.mjs` → `shots/b58-*`.
**Verdict:** shipped.
**Surprise:** c83 is not what it says: a 0.36 cover on a heavily worn lawn is two-thirds green BY DESIGN (the wear discount) — the curve buys ~3 levels. Also: page clips need the canvas's `getBoundingClientRect()` offset (196,29 at 1600×950); the first crops were of the wrong place while the `ctx` pixel probe was right.

## Iteration 63 — the boat's lantern lands: #62's uncommitted diff verified and committed, boatRate left unthinned after dark (2026-08-29) [River & far bank × Deepen]

**Brief b60.** #62 built the lantern (b59) and exited without a commit; the 37-line diff was read, verified against b59's criteria, and landed as found.
**Did:** `boatLampF()` = clamp((nightF − 0.3)/0.15) while a boat exists; `drawBoat` sets `BOAT_LAMP` (reset per frame beside `LIT`); `applyLight` relights it after the multiply with a tighter halo; `drawRiverLights` lays a 3.5-bar column under the hull on the fixed lamps' wind terms; `livingAt` says 'going downriver by lantern'.
**Gates:** census PASS (draw-only) · motion PASS vs a HEAD baseline · `river-year.mjs`/`boat-wind.mjs` HERE == HEAD to every digit · `probes/boat-lantern.mjs` 22:00 crops: 9 warm px HERE vs 0 HEAD, box moves with the hull · `boat-lantern-column.mjs` 71 px under the hull, 0 on bare water · night filmstrip 0 POP.
**Decision:** `boatRate()` does NOT thin after dark — 20 seeds × 11 nights: boat out 64.7 % of dark samples, lit 84 % of nights. The trip is ~1.7 days, so a night rate factor would barely move night presence but would move the launch anchors. A quieter night river wants a mooring (presence), not a rate.
**c99** (rose window at the dusk edge) read, not taken: the cached disc is a step at cache time and the relight a 0.7·nightF screen, so the seam is two-sided (grey just after dusk, stale warm after dawn); painting it always-unlit dims #61's midnight rose. Not a one-liner.
**Surprise:** a verification-only iteration is cheap (~15 min) and worth it — the diff was right and nobody had shown it.

## Iteration 64 — a wet seat is a refused seat: `seatRefused(a)` reads `wetF()` through a per-person `a.wary` bar (2026-08-29) [Lane & market × Connect]

**Brief b61.** The paving dried over ~3 h (#59) while the tables refilled the moment a shower stopped.
**Did:** `WET_SEAT_HI 0.75 / LO 0.35`; `seatWet(a)` = wetF() > HI − wary·(HI−LO); `seatRefused(a)` = sky > SIT_REFUSE **or** seatWet(a). Three call sites pass `a`: picnic, courtyard sitter, and the street stop (~L1908), which had its own literal `weatherComing() > 0.42` and now goes through the ONE predicate. Arrivals only; nobody seated is touched. No new `R()`, no draw code.
**Gates:** census PASS (life churn, no collapse) · motion PASS · `seats-out.mjs` 0 vanished, 0 splits · `probes/wet-seats.mjs` 10 seeds, pinned clear 10:00 with `wetness = 1`, counted AT the stop: taken 17 → 14, refused 2 → 4; seat-hours 33.9 → 27.1; median first seat +1.0 h → +2.6 h; `WET0=0` control == HEAD to every digit. Crops `shots/b61-plaza-{head,tree}-30min.png`.
**Winter night (c97):** seed 7 d17 22:00, wetness 0.31 → sheen ≈ 5 %, damp slate not a lake. Fine; no change.
**Verdict:** shipped.
**Surprise:** natural showers in 10 seeds all ended between 21:00 and 02:00, so a "day of a shower" probe measured nothing on either build — the first 0 was the instrument. Also: the cafe band is so rare (0 arrivals in 14 seeds × 3 h) that the cafe crop is a plaza-bench crop.

## Iteration 65 — the wind has a cause: a building front raises `windTarget()` with the cover and breaks with the rain (2026-08-29) [Sky, light & weather × Connect]

**Brief b62.** #58's wind ramp fired at the hour-6 roll, inside the dawn relight, so nobody saw it rise.
**Did:** `frontWind()` = clamp((cloud − 0.46)/(0.76 − 0.46)) — weatherComing()'s knee to a heavy front's floor — zeroed by `raining` and by a `frontSpent` latch set at the first drop and cleared when the next front moves in (`stepClouds`). `windTarget()` = max(day hash, frontWind()); `stepWind` reads it under the same `WIND_RISE_H` cap. Consumers untouched; no `R()`, no draw code. Light fronts (cover ≤ 0.5) give ≤ 0.13 — a breeze, never the windy class.
**Gates:** census PASS (life churn only) · motion PASS · day filmstrip 0 POP.
**Numbers** (`probes/wind-front.mjs`, 10 seeds × 30 d): windy-day mean 0.960 → 0.972, calm-day mean 0.027 → 0.176, windy CLASS 40.6 % → 49.9 % of samples — the extra hours the boat and fountain anchors move by. Max slope 0.427/h both (the cap). `wind-year.mjs` off-anchor 4/26400 (one-sample lag: rain starts later in `simStep` than `stepWind`). Crops `shots/b62-front-sheet.png`: seed 11 d2, cover 0.47 → 0.65 over 10–14 h, HEAD jets symmetric, HERE windF 0.03 → 0.65 and the jets lean progressively from ~12:40.
**Verdict:** shipped.
**Surprise:** HEAD's "windy class" is 40 % of hours, not 28 % of days — `hash(day, 99)` has no seed in it, so every seed shares one windy calendar and a 30-day window holds 12 of them.

## Iteration 66 — leaves land: `litter[]` (Uint8) raised under a landing leaf, painted in the cached ground, cut by feet and the broom, decayed in batches, buried by snow (2026-08-29) [Courtyard & garden × New CA rule]

**Brief b63.** `leafFallF()` shed leaves that vanished on touching the ground; October lawns were as clean as June's.
**Did:** `litter = new Uint8Array(GW*WH)` beside `trod`. `landLeaf(l)` at the `l.z<=0` splice: leaves carry `leaf:1` from spawn (petals don't), gated on `leafShed() > 0` so the summer drift lies nothing; +`LITTER_LAND` 40 on GRASS/PATH/SIDE/SLOT/ROAD. Feet cut `ceil(dt·120)`; the sweeper on paving zeroes it. `stepLitter()` from `caTick`: every `LITTER_BATCH` 32 ticks subtract `16·(1 − 0.75·leafShed())`; `snowCover > 0` → `fill(0)`. Draw: `groundCol` mixes toward `#8a5a2c` by a bucketed level; `drawLitter` lays 2..16 hash-placed rects per cell. Dirtying rides `wearDirty` only when a drawn bucket changes. No `R()`, no per-frame draw.
**Gates:** census PASS (unchanged) · motion PASS · `ground-rebuilds` autumn d16 seed 7: 142 HEAD / 142 HERE · `probes/litter-year.mjs hash`: summer d6 ground hash identical to HEAD, autumn d17.4 differs (84 cells) · `litter-year.mjs year` 3 seeds: 0 through d11, peak 82–97 cells at d16, 0 from d19 (snow) · crops `shots/b63-autumn-{courtyard,wide}-{head,here}.png`.
**Verdict:** shipped.
**Surprise:** the drift is not *under* the linden — leaves carry vx 0.6–1.4 for 6–14 s of fall, so it heaps 8–12 cells EAST on the lawn edge and the paving, and the street trees' leaves cross the footway and lie on the road. "Under the canopy" in the brief was a guess about where a falling leaf ends. The first year probe read 0 everywhere because `typeof col === 'string'` silently killed every leaf — the anchor check was green for the wrong reason.

## Iteration 67 — the clock is a button: a tap runs the town on to this evening, then the next dawn, on the season's own lapse (2026-08-29) [The sill & the observer × Interaction/UX]

**Brief b64.** A noon visitor never saw the night; the only fast-forward skipped a quarter-year.
**Did:** `#daytime` → `<button>` with the season's underline + chevron (min-width 13ch). `beginSkip()` now calls `beginLapse(span, say)` — ONE mechanism; `beginEvening()` aims it at `sunDown + 1 h` by day and `sunUp + 0.5 h` otherwise (`eveningTarget()`, band [dawn, eve − 1.5 h)). Both buttons disable through either lapse. `clock` joins `OFFERS` last (`clockPressed`); the narrow sill keeps the clock via `at-clock`.
**Gates:** census PASS (unchanged by construction) · motion PASS · `season-skip.mjs` PASS · `naming.mjs` PASS · night filmstrip 0 POP · phone 390: clock and controls on one row.
**Numbers** (`probes/evening-skip.mjs`, seed 7 d0): 12.88 → 21.23 in 2.41 real s, nightF 1, 34 lit; tap again → 5.65 (sunUp + 0.5); landing hour = sun AT LANDING ± 0.05; vs a 1x `__warp` to the same simT: lit 34/34, people 11/11, cloud/wind/wet identical. `evening-skip-weather.mjs`: a front arrived DURING the lapse at exactly the cloud and wind caps, then broke with the rain; wet 0 → 1.
**Verdict:** shipped. c98 (follow line through a lapse) preserved deliberately: the line is hidden only for the 2.4 s the label would be lying and comes back at landing.
**Surprise:** span delivery was exact to 1e-13 and the landings were still 0.13–0.26 h off — the SUN moves during the lapse (sunDown +0.36 h/day at the equinox), so a target fixed at tap time is stale by arrival. `sunAt(t)` + a 3-pass fixed point lands on the sun as it is at arrival. The season probe's 0.48 h tolerance could never see this.
