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

## Iteration 40 — the fountain reads the year: jets, basin and who stands at it (2026-08-28) [Plaza & quay × Deepen]

**Brief:** b32 — the plaza was the only east-of-bridge place with no seasonal reader; give the fountain the year.
**Did:** `fountainPlay()` = `1 - FOUNT_SWING(0.6) * greyF()` beside `riverRun()` — the same sky predicate read the other way (a fountain is a fair-weather thing): 0.4 midwinter, 1.6 midsummer, 1 at the anchor. Readers: `drawFountain` jets each keep a threshold `hash(k,23) < play` (1 jet in January, 5 from play 0.8), height `rise = min(play,1.4)`, reach `min(play,1.2)`, droplets `k < 4*play`; `groundCol`'s plaza WATER goes through `riverCol()` then `fountainIce()` skins it per cell (`hash(x,y+71)`, 0.45–1.0 share) below FOUNT_ICE 0.7; both spawners' bench/fountain coin-flip becomes `R() < 1 - 0.5*fountainStand()` so the stand share is 0.2 / 0.5 / 0.7 across the year and `fountainLine()` swaps the "trails a hand" line for a breath-showing one when the basin is skinned. No R() draws added, none removed.
**Gates:** census PASS (churn only — the split threshold moves off the anchor over the multi-day ladder and reroutes visitors) · visual PASS (`probes/fountain-shots.mjs`: winter basin rgb(103,134,146) vs HEAD 79,117,130, crop mean −8 g-b; summer 82,121,120 greener; east wide clean) · motion PASS · filmstrip day 0 POP · perf skipped (no new pass) · `probes/fountain-year.mjs`: basin colours and cached ground layer byte-identical to HEAD at SEASON_START; max step over a 1/400 folded year 0.009 play / 0.012 ice / 1 RGB unit.
**Verdict:** shipped
**Surprise:** first census run reshuffled everything at the anchor too — I had flipped the coin's polarity (`R() >= 0.5*f` puts the bench on the *other* half). Same count of draws, same thresholds, different world. `fountainPlay()` reads 1−1e-16 at t=0 because `seasonPhase` lands a hair off 0.25 after the first rAF; `riverRun()` rounds the same residue back to 1 by luck of its swing.

## Iteration 41 — the block is vegetables from the first frame (2026-08-28) [Cross street & allotments × Polish]

**Brief:** b33 — the opening scatter dropped ornamentals into allotment plots (`seed()` drew `1 + (R()*4|0)` with no `inAllotment` check); since #29 those cells are harvested into `produce[]` and laid out on a stall.
**Did:** One line at the seam. `seed()` still makes ONE `R()` draw per cell, but a cell in the block maps it through `speciesFor(x, y)` — the same predicate every later sowing uses — while a courtyard cell keeps the literal `1 + (r*4|0)`, so the courtyard's opening beds are byte-for-byte the world they were. No filter at the market. New `probes/allot-scatter.mjs`.
**Gates:** census PASS (churn only, no collapse; cabbages +79 because the block now opens on the hardy brassica) · motion PASS · visual PASS (east: plots read as cabbages/carrots, plaza and green untouched) · **`allot-scatter.mjs` 10 seeds × 26 days**: HEAD — 8/10 seeds open with ornamentals in the block (seed 7: lavender + fern, as the brief said), non-veg cell-steps in plots up to 1381, and *every* one of those eight puts a flower on a stall inside the year; here — 0 / 0 / none, and the courtyard scatter at t=0 has the identical species counts per seed. perf skipped (no per-frame change). Context budget opened OVER (46.3 / 46 KB) — the manager's distil call.
**Verdict:** shipped
**Surprise:** none in the code — the surprise was how *consistently* the bug reached the market: HEAD's stalls sold flowers in 8 of 10 seeds, not the occasional fern the brief guessed at.

## Iteration 42 — the sill names the living things (2026-08-28) [The sill & the observer × Interaction/UX]

**Brief:** b42 — `nameAt()` names ground, plants, waters and trees; point at a walker, a duck, the boat and it says the paving under their feet. Give the pointer the living things, same NAME_SETTLE, saying what they are DOING.
**Did:** `livingAt(p)` beside `treeAt(p)`: walks the same populations the draw pass paints (agents not in a TUNNEL, their dogs, ducks, swans, the boat when not under the bridge, the cat), projects the feet and hit-tests a SCREEN box 0.9 cells wide × one figure tall (1.5 cells standing, 1.0 sitting, 0.6 × 1.9 wide lying, 0.72 for a child); topmost by the draw's own sort key wins. `lookAt()` asks it first. `personName(a)` reads `kind`/`state`/`cup`/`watch`/`greet`/`listen`/`band`/`umbrella` — 'someone waiting at the door', 'a busker, playing', 'someone in the audience, listening', 'the gardener, kneeling at a bed', 'someone watching the boat go by', 'a child, running about'. No draw, no R().
**Gates:** census PASS (+0; render-free) · motion PASS (no new jumps/flicker any kind) · visual PASS, 4 shots + day filmstrip median Δ 0.42, no draw-order change (no draw touched) · **`naming.mjs` §7** ten seeds: **246/246** drawn living things answer a living name, **0** the ground; **12,743** lattice points 2+ cells clear of every entity: 0 differ from `nameAt`/`treeAt` alone; 13-word vocabulary in one midday · throwaway walk-out probe (`?pause` + `__warp(0.05)` ×40): label follows the figure's own state ('listening to the bell' → 'walking'), holds after it walks out, then 'The lane'; every label held ≥ 0.2 s sim, no strobe. Context budget opened **OVER** (46.3 / 46 KB).
**Verdict:** shipped
**Surprise:** first run missed exactly one of 242 — a napper. A lying figure is drawn 3 px tall and 4 px wider; a standing box misses it under the pointer even though the probe aimed at "mid-shin". The hit box has to be the DRAWN footprint per pose, not per entity. And the first live walk-out probe read only "The cross street": at `t=180` the ticker's dwell held the box until the walker had gone — the yield rules are upstream of the hit-test, so a live check must first wait out `lineDwell` like §6a does.

## Iteration 43 — three instrument lies: the night strip, the harness verdict, the crashed worker (2026-08-28) [The sill & the observer × Harness]

**Brief:** b40 — `filmstrip --scene night` pinned a daytime instant; `runlog.mjs` graded shipped harness work `no-ship`; a worker that ran and died had no retry rule.
**Did:** (1) `filmstrip.mjs`: `AT(day, h) = day*55 + 55*((h−6+24)%24)/24` — the page's clock inverted (the day rolls at 06:00) — and `night: AT(22, 0)` = 1251.25 s, midnight on the same day the old 1230 (= 14:44) sat on; the other four presets are unchanged but now annotated with the hour they actually are (`rain` 430 is 01:38 — already a night). (2) `runlog.mjs`: `verdictOf` reads `changeKind` — a Harness row that committed AND logged is `shipped` without source movement; a Harness row that DID move `courtyard.html` stays `shipped` but carries `harnessTouchedSrc: true` and a ⚠ in the report line. New `--regrade` mode recomputes every row from stored evidence and rewrites only rows whose verdict changed (note in `regraded`). Run: **#16 and #38 no-ship → shipped, nothing else**, idempotent. Also found and fixed: rows before #11 carry no `rc`, and `rc !== 0` read `undefined` as a crash — the first regrade turned twelve shipped rows `failed`. (3) The rule: **one retry, then retire.** `runlog.mjs` leaves a crashed worker's brief `active` with a `retry` note when `attempts < 2`; `pop-brief.mjs` re-issues it as attempt 2 under a fresh iteration (the crash was a real run, keeps its row, verdict `failed`, rc in the row); a second crash retires it. Documented in `run-loop.sh`, which now logs three distinct cases.
**Gates:** census PASS (+0, `courtyard.html` untouched) · night filmstrip: 8 frames at t=1251.25 — dark sky, lamp pools on lane and quay, lit windows, Δ 0.06–0.08, no POP · `--regrade` diff against a copy of the log: 2 rows, verdict field only · `stall.mjs`: last 20 verdicts shipped=20 · **stub run** (clone + a `claude` that emits tokens, sleeps 32 s, exits 1; `MAX_FAILS=3`): #43 b40 `failed` "re-issued once" → pop-brief attempt 2 → #44 b40 `failed`, brief retired → b41 popped as #45. Exactly the documented sequence.
**Verdict:** shipped
**Surprise:** the regrade's first pass flipped iterations 1–10 to `failed`. Nothing in the rule I wrote touched them — `verdictOf` had always read a missing `rc` as non-zero, and the bug was invisible because those rows were graded once, by an older `verdictOf`, and never re-read. A regrade is the first time the verdict function meets its own history; it found a latent fault in the rule before it found the one I came for. And the `cp` alias trap from #38 bit again (`cp` prompted, the shell hung two minutes) — use `cat >` in this shell.
**Cue:** `MANAGER_GAP` is compared against `done_ok − last_manager` with `last_manager = −99`, so any value ≤ 99 lets the stall check run before the first landed iteration; harmless, but "gap" is not what it does on the first loop.

## Iteration 44 — the swans get a pair and two poses (2026-08-28) [People & animals × Deepen]

**Brief:** b41 — `updateSwans` was target-and-wander only; "a pair" picked targets independently; the sill could only say 'a swan'.
**Did:** `s.state` ∈ swim | upend | preen plus `s.hold` (0..1 intensity the draw tilts on, so poses fade in/out at 2.5/s rather than snap). On each retarget ONE `R()`: `< SWAN_UPEND` (0.22) → upend 3–5 s in place; `< 0.42` and within `SWAN_BANK` 2.2 of a bank → preen 5–8 s; wanted to preen but too far out → swim to the near bank so preen is what happens *next*; a pose is always followed by a swim (no chaining). **Pair:** swans[0] is the cob and chooses the stretch; swans[1] spawns beside it, retargets every 2.5–5.5 s at 1.3–3 cells off the cob's *target*, swims a touch faster (0.5 vs 0.42), and is pushed back to 0.9 cells if it closes on the cob. `drawSwan` reads state: upend = body rotated stern-up, tail triangle, neck alpha'd out, a spreading ring; preen = neck quadratic folded back, bill on the flank. `livingAt` says 'a swan, upended' / 'a swan, preening'; `__entities` carries `act` for swans.
**Gates:** census PASS (life/species churn is the new R() draws; no collapse) · motion PASS, swan 0 jumps/flicker, 4 spawns as before · 4 shots + day filmstrip median Δ 0.465, no POP, unchanged parts unchanged · **`probes/swan-pair.mjs`** ten seeds × one day, `?t=55` so the pair exists: separation mean **12.58 → 2.10** cells (min 0.89, max 6.9; first cut gave 9.05 — see surprise), upend **13.2%**, preen **5.6%**, upend bouts 2.75–4.5 s, preen 4.75–7.25 s, 30 s looks with something happening **10/10** (HEAD 0/10), 0 samples outside the channel · pose crops at `hold ≥ 1` with the sill name asserted under the pointer: both read.
**Verdict:** shipped
**Surprise:** "the second swan targets within a few cells of the first" is not enough — the first cut did exactly that and the pair only closed from 12.6 to 9.05. The follower's *timer* was the leak: on an independent 6–14 s clock it chased a target the cob had already left, and at 0.42 cells/s neither could cover an 18-cell stretch inside one bout anyway. Pairing is a rate, not an offset: the follower has to re-read the leader several times per leader bout. Also the probe's own clip mapping was wrong twice (`project()` returns CSS pixels, `cv.width` is DPR-doubled) — the crop showed the clock tower and the `livingAt` assertion beside it still passed, because the name was read in world space. A screenshot crop is a second coordinate system; assert on it too.
**Law:** A follower is a re-read RATE, not an offset — targeting "near the leader" holds a pair only if the follower's clock is several times faster than the leader's, and neither target is further than a bout's travel.

## Iteration 45 — winter gets snow: flakes, a lying cover, and a melt (2026-08-29) [Sky, light & weather × Scale/World]

**Brief:** b42, attempt 2 — attempt 1 died mid-run with the build ~90% in the working tree; this run picked it up, checked every seam, finished the gates.
**Did:** `snowF()` = share of a shower that falls as flakes: 0 until `greyF()` 0.55, 1 by 0.90, read PER DROP against `hash(slot, 97)` so a shower turns to sleet then snow drop by drop. `snowCover` is the second slow world scalar with a cap, a cycle and an anchor: `stepSnow(dt)` adds `rainFall·snowF·SNOW_SLEW`, thins by the rain share and by warmth above the melt line, per-cell `snowAt(x,y,t)` (trodden kinds take less), `SNOW_REPAINT` steps the cached ground; roofs, eaves and awnings take a cap; census `clock.snow`; one settle announcement per winter.
**Gates:** census PASS (churn only; `snow` field new) · motion PASS · noon-at-anchor vs HEAD 233 px of 6.08 M differ, the working copy vs ITSELF 797 — below the floor, summer unchanged · `probes/snow-year.mjs` 5 seeds × 2 years: winter cover mean 0.255, exactly 0 weeks 9–46, max |Δcover|/0.25 s = 0.012 · winter shots read winter from the wide view · flake probe 85 flakes → 989 px brighter · filmstrip POP at winter dusk is HEAD's light bucket (see c76 → b45), ours larger because the relit ground is whiter · perf 16.70 vs 16.70 ms.
**Verdict:** shipped
**Surprise:** `__warp` never draws, so `snowPainted` stays 0 through a warped probe and `groundDirty` is set every step — any "did the cache repaint" assertion must drive a frame itself (`drawScene(simT, 0)` from `evaluate`). And `filmstrip.mjs` takes no `--page`: it silently ran the working copy under a HEAD label until I swapped the file in. A control that returns the candidate's exact numbers is not a control.

## Iteration 46 — the night reaches the river: lamp and moon reflections, one rail stop after dark (2026-08-29) [River & far bank × Connect]

**Brief:** b43. Not a duplicate: no light on the water after dark and `eastOpen()` was the far side's only clock.
**Did:** `drawRiverLights(t)` — under each waterside lamp (`RIVER_LAMPS`) a column of 14 short bars on their own downstream phases off the streaks' clock, so the column breaks and re-forms; the moon gets a 40-bar column crossing the river with `moonArc()` (factored out of `drawSunMoon`). Both × `nightF` × `(1 − cloudCover())`. Drawn in the night SCREEN pass beside the lamp pools, not in `drawRiverFlow` — under the multiply a warm bar comes out blue. hash()+clock only. `eastOpenFor(a)` replaces the three `eastOpen()` reads on agents; `spawnEastAgent(true)` sends ONE night stander (`nightRailFree`, `NIGHT_RAIL_RATE`) to the north end of the rail while `!eastOpen() && tapOpen()`, outside `eastCap`.
**Gates:** census first read FAIL people 210→185, shown by `probes/census-noise.mjs` to be the reshuffle (over 8 seeds −1.6%), PASS after repricing · motion PASS · `probes/river-night.mjs`: 22.00 river box vs itself with `drawRiverLights` stubbed, bright px 307 → 993; HEAD 296 · noon t=13.75 whole-frame hash identical to HEAD · rail after dark over 10 seed-nights: standing 26.6% of dark-tap samples · night filmstrip no POP · perf 16.70 vs 16.70.
**Verdict:** shipped
**Surprise:** `t = 27.5` is 18.00, not noon — `nightF` 0.29 there; noon on day 0 is `t = 13.75`. And the after-dark cap is the thing that prices a night visitor, not the walk: `eastCap` falls to 1 with the light and the walkers going home hold it, so a night arrival gated by it never fires (the first cut spawned 4 in ten nights and none reached the rail).

## Iteration 47 — the door gets callers: the market's last trader and an evening sweeper, the audience priced out (2026-08-29) [Lane & market × Connect]

**Brief:** b44. Not a duplicate: no path into `TAP_SLOTS` except `spawnTapAgent`, and `scarcity` read `agents.length` whole.
**Did:** `callIn(a, pts, durMin, durMax)` — the ONE way an agent already on its feet is re-routed to the pavement: first free `TAP_SLOT` (no R() on refusal), the polyline priced in sim hours (`pathHours`), `tapFits` demands the door open at arrival and arrival + drink + 0.6 h inside `TAP_SHUT`; refused = walk home. Three sources: the concert audience (`a.toTap` at spawn, priced at the strike), and `tapCallers()` on market days — the LAST stall's trader when it folds, an evening sweeper (`kind:'sweeper', eve:true`). `scarcity` reads `agents.length − tapNow` (c65). `__entities` carries `tap`/`caller` on walkers AND sweepers.
**Gates:** census PASS (reshuffle churn) · motion PASS · `probes/tap-callers.mjs`: 13 market days over two years — callers reach the pavement on 5/13, all warmth ≤ 0.43; 19 concert nights — the green-to-door walk is 25–41 sim hours against a shut 9 h off, so `callIn` refuses 19/19 · `probes/bandstand-year.mjs` §5 (c68) asserts `BAND_DUSK` clearance 0.81..1.79 h · night filmstrip no POP · winter market-night shot: sweeper at the door 01.39.
**Verdict:** shipped, with the brief's headline half priced to zero — "concert-night occupancy above ordinary nights" is false and the code says why.
**Surprise:** the market callers also read 0/13 on the first run. The last stall is 38 cells from the door (I had guessed 20): 7.1 h at 2.4 cells/s, and a 4–6 s drink put even the winter arrival past the shut; a 3–4.5 s drink turned 0 into 5. Then the probe still showed only 2: the sweeper's `take()` in `__entities` had no `extra`, so a sweeper at the door was invisible to the instrument. Two zeros, neither the feature.

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
