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

## Iteration 48 — brief rejected: the winter-dusk POP is the live sky, not the light bucket (2026-08-29) [Sky, light & weather × Deepen]

**Brief:** b45 — make the dusk/dawn relight of the cached ground layer continuous (finer bucket at the sun's edges, or a live tint between buckets); filmstrip Δ 5–9 at winter dusk blamed on the quarter-hour step.
**Did:** Built the tint variant first (`gprev` snapshot, 0.5 h crossfade inside 1.5 h of sunUp/sunDown, no extra rebuilds): winter dusk max Δ 7.00 → 6.35. Then localised instead of tuning. `probes/dusk-relight-where.mjs` splits the filmstrip's frame Δ by screen row and by the ground layer alone: on HEAD at seed 7 t=1183 the cached layer moves **0.44 / 0.55 / 0.30** per 0.35 s sample while the sky row and every ground row move 5–8 together — the live sky gradient and the night tint, whose driver (daylight = sin) is steepest at the sun's edges: 0.04 daylight per sample × ~180 RGB of sky swing ≈ 7. At one 60 fps frame (gap 0.0167) the whole-frame Δ is 0.5–1.5 with the ground at 0.00 — continuous, no step. Summer dusk on HEAD already reads max 2.74. Second finding, `probes/ground-rebuilds.mjs`: `drawGround()` rebuilds **654/day summer, 659/day winter** — 129–135 from the bucket, **~520 from `R()<dt*2` in the grass-wear step** — at 9.2 ms a rebuild against 2.3 ms for everything else in the frame. Reverted the crossfade (it would flatten on every wear rebuild anyway), `courtyard.html` untouched; rejected via `pop-brief --reject`; two cues.
**Gates:** census PASS (+0, source at HEAD) · motion PASS · filmstrip HEAD controls: winter dusk max 7.00 (reproduced), summer 2.74 · noon byte-identical by construction (no source change) · perf skipped.
**Verdict:** no-ship (rejected brief; two probes kept)
**Surprise:** the "cache" is not one. I assumed a quarter-hour cadence because the comment at the bucket says so; the wear line dirties it every few frames and nothing counted. The manager priced this brief off a POP that a 0.35 s sample manufactures from a smooth sine — the instrument's gap is the pop.
**Law:** A whole-frame Δ at the filmstrip's 0.35 s gap is a RATE, not a step: divide by the frames in the gap before calling it a pop, and split it by layer (cached vs live) before blaming a cache. And a cache's cadence is whatever sets its dirty flag most often — count rebuilds before tuning a bucket.
**Cue:** see state — wear-driven rebuilds (perf), and a per-frame pop gate.

## Iteration 49 — snow knows the desire paths, and the sweeper's strip (2026-08-29) [Courtyard & garden × Connect]

**Brief:** b46 — extend `snowAt` from the trodden KIND to the wear VALUE so worn lines stay dark through a cover; feet re-cut a fresh fall; the dawn sweeper clears the strip they walk.
**Did:** `snowAt(x,y,t)` now multiplies by `1 - SNOW_WEAR*cut`, where `cut = max(wear/SNOW_WEAR_AT, trod)` (0.85, 0.45). `trod[]` is a new `Float32Array(GW*WH)` beside `wear[]`: walkers on GRASS bump it while cover > 0; any `a.broom` agent (dawn and evening sweeper) sets it to 1 on the cell they stand on; `stepSnow` buries it at `SNOW_BURY` (0.15/s of full snow) whenever cover rises, and zeroes it when cover reaches 0. Everything sits inside the `snowCover > 0` guard, no R() draw added, no new ground kind, repaint cadence untouched (the sweeper dirties the cache once per cell they clear, ~70×/morning against ~650 rebuilds/day already).
**Gates:** census PASS (+0 — wear/trod are not census fields) · motion PASS · `probes/snow-wear.mjs` five seed-winters at sunUp+1.5, cover 0.52–0.84: mean snow on wear>0.45 **0.081 vs 0.499** on wear<0.1 (ratio 0.16; HEAD 1.07) · at sunUp+6 ratio 0.14, lane strip 0.215 vs rows beside 0.273 (seed 7: 0.169 vs 0.302; HEAD strip = beside) · summer frame `toDataURL` byte-identical to HEAD at seed 7 t=192.5 · snowCover dynamics untouched, so snow-year cover means identical by construction (winter 0.266) · perf skipped (the bury loop is 12k floats only while snowing).
**Verdict:** shipped.
**Surprise:** only 1–17 lawn cells per seed carry wear > 0.45 in winter — the desire paths sit at 0.2–0.4 there, so the brief's own threshold names the tail of the paths, not the paths; the ramp below it is what draws the line. And the sweeper at sunUp+1.5 has swept ~12 of 69 cells (2.6 cells/s, an hour is 2.3 s), so the "swept path at dawn" is a stub at dawn and a strip by noon — the brief pictured a broom faster than the clock. The winter shot at seed 7 shows the line SW lamp → centre in the candidate and not HEAD, but faintly: dawn light and 0.57 cover flatten it.
**Law:** a threshold quoted in a brief is a hypothesis about the distribution — histogram the field before you tune to it.
**Cue:** see state — the snowy lawn reads pale green, not white, at dawn (SNOW_COL under the dawn tint).

## Iteration 50 — the plaza reads a windy day (2026-08-29) [Plaza & quay × Connect]

**Brief:** b47 — nothing east of the bridge read `isWindy()`; lean the fountain, drift the spray, drop `fountainStand()` on windy days, flutter the bunting.
**Did:** `windF()` (0..1) beside `isWindy()`. `drawFountain`: a `lean` term off `windT` shifts each jet's control point and landing +x, droplets pushed downwind, six faint lee dots walk 2–4.4 cells past the rim and fade. `fountainStand()` = `clamp(play * (1 - FOUNT_WIND_SHY*windF()))`, SHY 0.5 — exact at calm. Bunting tips swing on `windT` × windF. No new R() draws; river untouched.
**Gates:** census FAIL people −10% at two cells → replayed 10 seeds × 20 days (`probes/fountain-wind.mjs`): −1%, churn. Stand share at spawn: calm 0.579→0.599, windy 0.578→**0.275**. `fountain-year.mjs` anchor EXACT · motion PASS · `fountain-wind-shots.mjs` windy noon: 20 spray px at +2.6 vs HEAD 4 px at −0.1 · filmstrip 0 POP · perf skipped.
**Verdict:** shipped.
**Surprise:** a presence-sampled probe said calm days had moved too (0.536→0.351) — sitters dwell 2× longer than standers and stops straddle the day roll, so presence smears windy days into calm ones. Counting at spawn gave the clean split. `day` on the page is one ahead of `hash(d,99)` from t=0 — the clock rolls at hour 6.
**Law:** promoted (measure a choice at the choice). **Cue:** c84.

## Iteration 51 — somebody goes home, and the window over the door lights as they go in (2026-08-29) [People & animals × Connect]

**Brief:** b48 (third attempt; the second left an unlanded diff this one inherited) — after-dusk leavers walk to a front door under a window and THAT window lights; `windowLit` stays the one truth; swans rest after dark.
**Did:** `HOME_DOORS` — eight doors on the lane's north fronts (row 64), `drawFrontDoor()` only inside the window branch of `drawFaceRow`, so each has a window over it by construction. `HOMES` Map (sa,sb) → {nid,t,due}; `windowHours()` split out of `windowLit()` so pricing and predicate share the hash; `windowLit` reads the register: dark while someone is on the way (≤ HOME_LATE 3 h past the priced arrival), lit the frame they go in, off after the hash's span or at dawn. `goHome(a)` prices `pathHours()` to each unused door whose window is home tonight, needs HOME_MIN 1.2 h before dawn, share by per-person hash (no R()). ONE ask site in `stepAgent`: a lane walker on their last leg at nightF > 0.3. `arriveHome` at the last waypoint; `personName` 'heading home'; `__entities` `home:1`. Swans: nightF > 0.6 → preen or swim to bank.
**Gates:** census PASS (churn) · motion PASS · `probes/going-home.mjs` 10 seed-nights: asked 9, went 4 (0.44 at the choice), 4 arrived, 0 lit outside windowHours · `windows-night.mjs` lit counts unchanged within 2 · `going-home-shots.mjs` pane over door 4 (53,54,70)→(127,118,116) the frame they go in · night filmstrip 0 POP.
**Verdict:** shipped — thin: under one leaver per night is asked at all.
**Surprise:** the brief's pricing rule ("arrive before the window's `on`") is impossible — 5.5 cells/sim-hour makes the lane ~25 h wide and `on` is 0.15–2 h after dusk. The inherited `arriveHome` sat on a branch `stepAgent` never reaches. The real bound: the town is EMPTY after dark — 6–9 agents, arrivals stop with daylight — so the audience is the 2–3 people on the lane when nightF crosses 0.3.
**Law:** promoted (count the dusk-edge audience). **Cue:** c85, c87.

## Iteration 52 — the allotments get a winter: dead rows go under, dark until the warmth returns (2026-08-29) [Cross street & allotments × Deepen]

**Brief:** b49 — on mild dry daylit winter days a holder turns a FALLOW plot; it reads as dark turned earth until the spring sowing.
**Did:** `turned[]` (Uint8 per cell, the one new state). `digWeather()` = warmth < DIG_WARMTH 0.28 ∧ !raining ∧ snowCover < 0.3; `fallowPlots()` = plots with no stage-3 cell, not resting, not hardy, not turned; `allotRate += DIG_RATE 0.06` only while both hold (additive, summer roll untouched). `sendToPlot` picks from `fallowPlots()` and sets `a.dig`; the kneel branch calls `turnPlot(a)` — cells below 3 go bSp 0, turned 1. `caTick` and hand-sow skip a turned cell while warmth < DIG_WARMTH; every sowing site and `harvestPlot` clear it. `groundBase` draws turned #3d2d1c–#4a3826; inspect text, `personName`, `__entities.dig`.
**Gates:** census PASS (churn; `harvested` unchanged) · motion PASS · `allot-year.mjs` (now folds digs/day + turned cells) 4 seeds × 60 d: winter digs 0.35/day, 0.9–1.25 on dry mild days at the winter edges, 0.00 in summer; turned cells 15–19.5 midwinter, 0 by yday 5; spring ripe 12.36 vs HEAD 12.34 · seed 7 day 23 crop: two dark plots + a digger vs uniform HEAD · perf skipped.
**Verdict:** shipped — with the brief's target redefined.
**Surprise:** the winter block has NO fallow plots: a picked row is re-sown within a day and stalls at stage 1 under the cap, so the first cut dug 0 across 8 seed-winters while identical to HEAD. Turning the STALLED rows under is what a holder does with a dead row, and `turned` must hold off re-sowing or the dark lasts a day. Second zero: `bAge` ticks up on a PLANTED cell too — it is the fallow clock only when `!bSp`.
**Law:** promoted (two fields sharing a name). **Cue:** c88.
