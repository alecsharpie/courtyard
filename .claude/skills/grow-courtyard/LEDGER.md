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

## Iteration 33 — a door on the lane that keeps hours after dark (2026-08-04) [Lane & market × Scale/World]

**Brief:** b35 — every `stop` branch in `spawnLaneAgent` opens with `sun &&`, so ~45% of the
clock is a transit corridor. Give the town ONE evening place. Measure the dark first.

**Did:** Measured first: the dark was **not** a clean zero — **0.21** street people standing still
22.00–04.00 against **1.26** at midday, all of it the glance through the arch in the final `else`.
A lit door at `TAP_DOOR = 26` on the plane `drawFaceRow` already draws, every frame: `tapOpen()`
the behaviour, `tapF()` the 0..1 every draw mixes on. Hours are the one clock here that is not
the sun's — open `sunDown - 3` floored at `TAP_EARLIEST`, shut by the CLOCK at 03.00 — so
**midwinter's evening is its longest**. `spawnTapAgent()` has its own budget (four `TAP_SLOTS`),
comes off `laneCount`, does **not** read `scarcity()`, and walks out of the courtyard's south arch.

**Gates:** census PASS (people +15) · visual PASS (`tap-shots.mjs`) · perf PASS · motion **FAIL,
attributed** (`market/shower` 0→2 on untouched code; ten seeds HEAD mean 0.40 vs 0.50) ·
**`evening-door.mjs`**: night STILL **0.21 → 0.98**, 17% → **77%** of midday; **0** standing after
the shut · **`day-control.mjs`**: `tap 0` at both midday instants on HEAD and here.

**Verdict:** shipped

**Surprise:** the address was decided by arithmetic, not taste. A sim hour is 2.3 s, a midsummer
night 22 s, so "stopped at 22.00 in midsummer" is only satisfiable if the walk is ~3 s. Our own
doorway at x=33.9 is 15 cells across the lane: 6.8 s each way, round trip 92% of the window. It
had to move to the near side of the road. Also `tap-shots.mjs` photographed the frame's border
twice, because `project()` is relative to the canvas **parent**. Full entry in `LEDGER-archive.md`.

## Iteration 37 — the bed ceiling comes down cell by cell, not all at once (2026-08-28) [Courtyard & garden × Deepen]

**Brief:** b37 — `bloomCap()` was the town's only STEPPED seasonal term (3/2/1 at warmth 0.42/0.20);
make it continuous without moving the year's totals.

**Did:** `bloomCap()` is now `1 + 2·clamp((warmth − BLOOM_LO)/(BLOOM_HI − BLOOM_LO))`, with
`BLOOM_HI = 0.50` = SEASON_START's warmth (anchor 3 by the clamp) and `BLOOM_LO = 0.12` the one
tuned number. `bedCap(x,y)` turns the fraction into an integer with `capStep()` — the fraction is
the SHARE of cells already allowed the next stage, by `hash(x, y+53)` in the courtyard and by
`hash(plotOrigin, +53)` in the allotments, so a plot still steps whole but not with its neighbour.

**Gates:** census PASS (blooming −17, planted −25 — noise) · visual PASS (early summer, cap 3 both
builds) · motion/perf skipped (CA state only) · **`bloom-cap.mjs`** (folded year): max step in the
courtyard's mean ceiling **0.876 → 0.038**, allotments 1.000 → 0.118; anchor exactly 3 both builds;
year-mean of the cap 2.2577 → 2.2564 · **`beds-year.mjs`** 3 seeds × 70 days: mean blooming
**+1.9%**, evenness 0.998. Context budget opened OVER (46.4 / 46 KB).

**Verdict:** shipped

**Surprise:** the cap's folded mean was flat to 0.06% and the beds still came out +1.9% — a bed
under a rising cap climbs the moment its cell is admitted, a bed under a falling one only ages out
at `dieF()`'s pace. And `BLOOM_LO` came out 0.12, not the 0.08 area arithmetic said, because
warmth is a cosine and time piles up at the extremes. Full entry in `LEDGER-archive.md`.

## Iteration 38 — a launch failure no longer burns its brief (2026-08-28) [The sill & the observer × Harness]

**Brief:** b38 — make a CLI launch failure leave the brief claimed and stop counting as a worker iteration; split motion's shower `jumps` into rises/falls.
**Did:** The burn was one line: `runlog.mjs` retired the brief (`status: 'done'`) unconditionally, so `pop-brief.mjs`'s re-issue path — written for exactly this case — was unreachable. `runlog.mjs` now classifies a worker row as `kind: 'launch-failed'` when `rc≠0` and (token sum is 0 or elapsed < 30 s), gives it verdict `launch-failed` (mark ⚡), and leaves the brief `active`. `run-loop.sh` logs "never launched … brief stays claimed" when the brief is still active after runlog. `pop-brief.mjs` skips launch-failed rows when computing `nextIter`, so a failure does not consume an iteration number. `stall.mjs` and `build-stats.mjs` exclude the kind alongside manager rows (stats gets a "launch failures" hero figure only when there are any). Rows #34–36 retagged in place with a `retagged` note; nothing deleted. `motion.mjs`: shower rows carry `rises` and `falls` (`jumps` stays the sum); the shower gate now fails on `falls` only. Baseline regenerated.
**Gates:** census PASS (+0 everywhere — `courtyard.html` untouched) · visual skipped (no draw change) · motion PASS after re-baseline: every shower jump in day/dusk/night/market is a rise, 0 falls — the night cell (c62) was three showers *starting* · harness proof: cloned repo + a `claude` stub that exits 1 after 1 s, `MAX_FAILS=2`: b38 re-issued attempt 2 → 3, `current-brief.json` still active, two ⚡ rows, `stall.mjs --report` reads 33 workers + 5 launch failures, last 20 verdicts `shipped=19 no-ship=1`, `src moved 10/10`.
**Verdict:** shipped
**Surprise:** The first clone run happened to run the *old* code (an interactive `cp` alias refused to overwrite) and reproduced the bug perfectly — two briefs burned in 3 s. Then the fixed code threw a TDZ error (`KIND` used before its new definition) and the loop *still* behaved correctly, because a crashing runlog never retires the brief either. The fix was right for the wrong reason for one run; only the ⚡ row in the log proved it.
**Law:** A harness fix needs a stub-driven end-to-end run, not a unit check: the runner, runlog and pop-brief each hold half of "is this brief done", and a fault in any one of them looks like success in the others. A 1-second `claude` stub on `PATH` in a throwaway clone exercises all three for free.
**Cue:** a worker that really ran and then exited non-zero (rc≠0, tokens > 0, > 30 s) still retires its brief as `failed`. Probably right — the work may be half-done on disk — but nobody has decided.

## Iteration 39 — every window keeps its own hours (2026-08-28) [Sky, light & weather × Deepen]

**Brief:** b36 — `drawWindow()` lit every window with one `nightF > 0.3 && hash(house, day) > 0.42`, so 58% of the town burned dusk to dawn and switched in one frame.
**Did:** `windowLit(sa, sb)` is the ONE predicate (pane fill and `LIT[]` glow both read it). Hours run off a single clock, `t` = hours since the dusk edge (`sunDown − NIGHT_K·dayHours`, NIGHT_K = asin(0.4375)/π = where nightF crosses 0.3), addressed by `nid` — the night, not `day`, because the day rolls at 06.00 in the dark. Per window (hash, never R): on at 0.15–2 h after the edge, bedtime `on + 1.2 + 6.8·h²` (most out by mid-evening, a squared tail into the small hours, one in twenty burning through), 14% early risers back on 0.6–2.2 h before the dawn edge, and everything still lit goes out one by one in the last hour so nothing switches AT the edge. Then the real find: `drawBlocks()` draws rows 0–60 INTO the cached ground layer, which rebuilds on the quarter-hour light bucket — so per-window hours would have flipped ~12 windows per rebuild. `drawWindow()` now registers into `WINDOWS[]` when drawing to `gtx` and paints the pane dark; `drawLitPanes()` repaints lit panes live every frame after the ground blit. That also fixed a pre-existing leak: `LIT` was reset only in `drawGround()`, so the south band's 13 live windows stacked into it every frame for a quarter-hour and the halo pass drew hundreds of gradients over each other (a frozen page read 28, 41, 54, 67… per frame).
**Gates:** census PASS (unchanged everywhere) · motion PASS · perf PASS (+0.0% day and night, 3 interleaved reps) · noon frame mean pixel diff HEAD vs here **0.000** · `probes/windows-night.mjs`: lit count over a night 19→42→20→13→3→7 (summer) and 20→42→26→10→6→6→9 (winter) against HEAD's flat 72/81; largest change in one 0.25 s step 93 → 12, and 5 on the dusk ramp of the step dump · 22h vs 03h shots differ 0.58/0.61 mean px where HEAD's are the same picture · filmstrip: no POP.
**Verdict:** shipped
**Surprise:** the first probe showed +26/−30 oscillations across the dusk ramp and I nearly tuned the hash. It was the instrument: `LIT.length` was climbing 13 a frame with the clock frozen. The HEAD counts of 86 and the census note "LIT depends on where in the draw pass you sample" were both this leak, misread as sampling.

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

**Brief:** b42, attempt 2 — attempt 1 died mid-run with the build ~90% in the working tree; this run picked it up rather than rebuilding, checked every seam, finished the gates.
**Did:** `snowF()` = share of a shower that falls as flakes: 0 until `greyF()` 0.55, 1 by 0.90, read PER DROP against a `hash(slot, 97)` on the drop so a shower turns to sleet then snow drop by drop, never as a switch. `snowCover` is the second slow world scalar with a cap, a cycle and an anchor: `stepSnow(dt)` adds `rainFall·snowF·SNOW_SLEW` (0.02/s), thins by the rain share (`SNOW_RAIN_THAW` 0.03/s), melts at `SNOW_MELT·(1−snowF)` (0.012/s); starts 0 and cannot move while `snowF()` is 0, so at SEASON_START every consumer is the old constant BY THE ALGEBRA (all draw sites guarded `snowCover > 0` because `mix()` re-serialises a colour even at t=0). `snowAt(x,y,t)` = cover × `snowTake(t)` (grass/beds 1, side 0.7, path/slot 0.5, road 0.4, else 0) × per-CELL `hash(x, y+53)` — the paths and road read dark through the white without touching the wear map. `groundCol` wraps `groundBase` and whitens; joints/setts skipped under > 0.5 cover; roofs whiten in `drawRoofRow` (draw pass, not `buildVolumes`) with the ridge stroke fading; canvas awnings get a cap in `drawOurSide`; flakes drift at 0.11× drop speed with a sine wobble and draw as 1.7 px discs; the rain tint pales toward a snow sky; the cached ground repaints when cover has moved `SNOW_REPAINT` (0.03) since last painted; announce on the shower ('Snow drifts in over the rooftops, fat and slow.') and once when cover first passes 0.15. `__census().clock.snow` added (town state, like `cloud`).
**Gates:** census PASS (churn only; `snow` field new) · motion PASS (shower kind: rises/falls −1, the seed-42 drop count step is HEAD's) · **noon-at-anchor vs HEAD: 233 px differ of 6.08 M, and the working copy against ITSELF differs by 797 px** — below the noise floor, the summer town is unchanged · **`probes/snow-year.mjs`** 5 seeds × 2 years: cover mean winter 0.255 (on 69% of samples, max 0.86), spring 0.019 (7.8% — the lag tail into early spring, the shoulder law), summer 0, autumn 0; by phase-week peaks 0.55 at week 4 after midwinter, exactly 0 weeks 9–46; **max |Δcover| per 0.25 s = 0.012**; first cover>0 at phase 0.91–0.03; 10 settle announcements in 10 seed-years · winter shots (seed 7, t 1183 dusk; t 1175 afternoon shower): white lawn/plots/green, dark paths and road, white eaves, pale sky — reads winter from the wide view · flake probe: 85 flakes → 989 px brighter vs the same frame with the drops removed · day filmstrip median Δ 0.465, no POP (same as #44) · filmstrip at 1175/seed 7: POP at frames 10–11 (6.4/5.7) — **HEAD at the same instant POPs 4.8/4.2 there and 9.0 at frame 5**: it is the winter sunset's light bucket, not the snow; ours is larger because the relit ground is whiter · perf PASS 16.70 vs 16.70 ms day and night. Context budget opened **OVER** (46.1 / 46 KB).
**Verdict:** shipped
**Surprise:** `__warp` never draws, so `snowPainted` stays 0 through a warped probe and `groundDirty` is set every step — harmless in a probe, but any "did the cache repaint" assertion must drive a frame itself (`drawScene(simT, 0)` from `evaluate`, as the flake probe does). And `filmstrip.mjs` takes no `--page`: it silently ran the working copy under a HEAD label until I swapped the file in. A control that returns the candidate's exact numbers is not a control.
**Cue:** the winter-sunset relight steps 5–9 mean-Δ in one frame on HEAD (light bucket at 2.3 s/hour with a compressed dusk); worth a live overlay or a finer bucket near sunUp/sunDown. Snow × footfall (paths worn through lying snow) is the follow-on the brief named.
