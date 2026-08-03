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

## Iteration 8 — the market is put up and packed away (2026-08-03) [Lane & market × Deepen]

**Brief:** b7 — `marketActive()` gated the whole stall list, so three finished stalls
appeared between two frames at hour 8 and vanished the same way at 17. Give market day
a beginning and an end.
**Did:** A stall is no longer a boolean. `marketRaise(i)` is a 0..1 progress with a
per-stall stagger (`MK_RAISE` 0.62 h, `MK_STAGGER` 0.24 h), so the three go up one at a
time over 6.90→8.00 and come down over 17.00→18.10. The draw list pushes per stall on
`p > 0` and carries `p`; `drawMarketStall` stages it as four clamps on that one number —
the trader fades up crouched over the pitch (`arrive`), the trestle unfolds up to its
board and out to its full width (`table`), the frame rises on lengthening poles
(`pole`), the canvas rolls out from the left pole toward the right (`can`, a lerp of the
two right-hand corners; the stripes are anchored in screen x so they stand still and get
*revealed*), and the six goods come out one at a time over p 0.80..1.00. The trader
stands up as the canvas starts. Because every stage is a clamp on the same p, running p
backwards packs the stall down in exactly the reverse order — no second code path.
`marketActive()` is untouched, so `laneRate`'s ×1.7 and the browser roll still see the
same 8–17. The ticker now brackets the day: the opening line moved onto the first
trestle (6.92) and a new `marketClosed` flag fires at 17.00, on the first stall coming
down rather than after the last, which also keeps it an hour clear of the six o'clock
strike.
**Gates:** census PASS (**unchanged in every group** — the point: draw-only, and it
confirms no new `R()` draw) · visual PASS (wide/courtyard/east/lane at the pinned moment,
plus zoomed dsf-4 crops of the pitch across both windows: at 7.66 stall 0 is finished,
stall 1's canvas is half out and stall 2 is a bare frame) · motion PASS (0 jumps / 0 nan
/ 0 oob / 0 flicker in day, night, market) · filmstrip day clean, no POP, no FROZEN ·
perf skipped (no new per-frame pass; the stall loop is ≤ the old one) · probe
`probes/market-raise.mjs`, 4 seeds, crop of the market pitch stepped at 0.05 s: largest
single-step change **6.66 → 1.83** opening and **7.42 → 1.81** closing — and the 1.8s
are not mine, they are byte-identical in the HEAD control. A separate check confirms the
fully-open stall is **pixel-identical to HEAD** (weighted pixel sum 18852789 both), so
the raise adds no drift to the finished state.
**Verdict:** shipped   ← my view; runlog.mjs decides from the diff
**Surprise:** Two.
(1) **The filmstrip could not see the bug it was pointed at.** Run across the opening
window at 0.28 s gaps, HEAD and the work give the same frame deltas to two decimal
places (median 2.643 vs 2.654) and neither shows a POP. The market pitch is 148×72 px of
a 1152×667 canvas — 1.4% — so HEAD's 6.66 mean-channel spike inside it dilutes to 0.10
across the whole frame and drowns under a dawn sky that is repainting every frame
anyway. The gate is a whole-frame mean; anything smaller than a couple of percent of the
canvas is invisible to it however violently it pops. Cropping to the feature was not a
refinement of the filmstrip, it was the only way to measure this at all.
(2) My first probe reported the closing line firing at hour 6.00 and the opening line
never firing — a real-looking bug in code that was fine. `__setTime()` rewinds `simT` but
not the announce flags, and an earlier `grab()` in the same page had already set
`marketAnnounced = 2`. `__reseed()` was not enough. The fix was a fresh page per
measurement. This is the same shape as #3's unreseeded probe: the harness rewinds *some*
of the world, and the part it does not rewind is exactly where a false reading hides.
**Law:** `filmstrip.mjs`'s Δ is a whole-frame mean, so it is blind to anything under
~2% of the canvas. Before trusting a clean strip, ask what fraction of the frame your
change occupies; if it is small, crop to it (see `probes/market-raise.mjs`).
**Law:** `__reseed()` rewinds the PRNG and `__setTime()` rewinds the clock, but neither
rewinds module-level latches (`marketAnnounced`, `windAnnounced`, `bellSeen`, `lastStruck`).
Reuse a page for two measurements and the second one starts with the first one's flags
already tripped. One page per measurement, or the probe invents a bug.
**Law:** Stage an appearance as N clamps on one 0..1 progress rather than as timed
steps. Reversing the progress then packs the thing away in the reverse order for free,
and there is only one code path to get right.
**Cue:** The probe's crop goes flat — exactly 0.00 for ~0.9 s after hour 8.03, and again
before 16.84 — in **both** HEAD and the work. Nothing moves in that box: the ground is a
cached layer, a standing stall is static, and no walker is inside it. Worth knowing that
the busiest-looking part of the lane is genuinely still for a second at a time.
**Cue:** `marketRaise()` is the town's third staged-appearance ramp after the washing and
the umbrellas, and all three hand-roll their own clamp chain. If a fourth arrives, that
is the moment for a shared helper.

## Iteration 9 — the boat is watched, and the bridge is stood on (2026-08-03) [River & far bank × Deepen]

**Brief:** b8 — closes c5 and c11. `updateBoat()` runs a boat past a quay nobody looks
up from, and no waypoint in the town ever stops anyone on the bridge the lane carries
across the river.
**Did:** Two halves.
(1) `boatWatch()`, called from `updateBoat()` while a boat exists. Every agent whose
`boat.y` draws level (±2.4 cells) *and* who can actually see the water — `byTheWater()`:
the quay and its rail, the bridge deck, the towpath — rolls once (72%) for
`a.watch = 1.0 + R()*0.8`. One glance per person per boat, gated on `a.sawBoat === boat.id`,
because the boat sits level with a quay bench for several seconds. `a.watch` ticks down at
the *top* of `stepAgent`, above every state branch, so a sitter on a bench runs it out the
same as a walker; unlike `a.listen` it never returns early, so a watch cannot hold anybody
anywhere. `drawPerson()` reads the live `boat` and offsets the head by
`clamp((boat.x - a.x)/5, ±1) * 2.2` with a `min(1, watch*3)` ease-out, so the head genuinely
*follows* rather than snapping to a stored angle. Standers also turn their body (`a.faceL`);
walkers keep their line. Two or more heads turning fires one ticker line per boat.
(2) A `parapet` stop: `PARAPET_Y = LN_WALK_N + 0.45`, x anywhere in the middle of the span.
Added to both `spawnLaneAgent` (roll 0.58–0.62) and `spawnEastAgent` (roll 0.72–0.85). And
`PARAPET_Z`: the upstream parapet stood at 1.5, measurably a head taller than anybody
crossing, so a person on the bridge read as standing at a wall. At 1.0 the head clears the
coping by 4.0 px against a 9.3 px person.
**Gates:** census PASS (no collapse; the histogram diff is PRNG churn) · visual PASS
(wide/courtyard/east/lane at seed 42 and seed 13 midday, plus 10× zooms on the parapet and
on three heads turning as the boat goes under) · motion PASS (zero jumps/nan/oob/flicker) ·
filmstrip: one POP at frame 7, **not mine** — see Surprise · probe
`probes/parapet-and-boat.mjs` over 4 seeds × 12 days: parapet occupied **12.0%** of daylight,
**2.1 glances per boat**, longest single watch **1.75 s** · perf skipped (one O(agents) pass
per sim step while a boat exists; three arithmetic terms per person per frame)
**Verdict:** shipped   ← my view; runlog.mjs decides from the diff
**Surprise:** Three.
(1) The first build put the parapet stop only in `spawnLaneAgent`, at 4% of the roll. The
probe measured **one** person on the bridge in twelve days. A role census over the same span
showed why: `spawnLaneAgent` fires ~3.3 times a day, so every late roll band is starved —
cyclist 1, lanesitter 1, browser 2 over twelve days, against quay 27 and green 23 from the
*east* spawner. That is the exact trap the east quarter was built to escape, re-entered from
the other side: I had reasoned about band width and never about the budget the band is a
share of. Moving the stop to `spawnEastAgent` took occupancy from 1.1% to 12%.
(2) The filmstrip POP at frame 7 (Δ10.99 against a 0.48 median) is not a draw-order fault
and not mine. HEAD has no POP in that window, which is exactly the misleading shape: my new
`R()` draws moved the shower, so the rain now *ends* inside the twelve frames, and 110
raindrops plus the wet-ground sheen go in one frame. A 3×3 region diff showed the jump is
global (7–15 in every cell), and a clock trace showed `raining true → false` between 6 and 7.
Reproducing the filmstrip's exact world mattered: it does `?t=0` then `__warp(175)`, and my
first probe used `?t=175`, which is a different world and showed nothing at all.
(3) Getting a figure to read as *looking over* the parapet rather than standing at it was a
2-px problem I could not settle by eye across three zoom levels. Four lines of arithmetic in
the page — coping screen-y against head-top screen-y — settled it in one run: 0.4 px of
clearance at the old height, 4.0 px at 1.0. My first attempt, drawn forearms up onto the
coping, was worse than nothing at 10× zoom: they merged with the head into a raised-arms
blob. Dropped.
**Law:** A roll band is a share of a budget, not a rate. Before widening or adding one, count
what its *spawner* actually fires per day — `spawnLaneAgent` runs ~3.3×/day, so a 4% band is
one person per twelve days. The town already has three arrival sources with separate budgets;
put a destination on the one whose front door it is.
**Law:** When a filmstrip POPs, reproduce its exact world before diagnosing — it seeds with
`?t=0` then `__warp(t)`, which is not the same world as `?t=<t>`. Then localise before you
theorise: a region-wise diff separates a global light or weather step from a draw-order fault
in one run.
**Cue:** Rain ends in a single frame — `raining = false` drops all ~110 raindrops and the wet
sheen at once, while the cover behind it eases away over half a day. The arrival is ramped and
the departure is a cut.
**Cue:** `byTheWater()` names the three places a person can see the river. Nothing else uses
it yet, but it is the predicate any future river event (a swan taking off, ice, a barge) would
want, and it should stay the only definition of that.

## Iteration 10 — the ticker holds its line, and the church finally answers (2026-08-03) [People & animals × Polish]

**Brief:** b9 — `announce()` overwrote `tickerEl.textContent` outright, so two events in one
frame showed only the second; fix that, then un-nest the unreachable church-answer branch.
**Did:** `announce()` is now a shallow ordered queue. `showLine()` owns the surface;
`TICK_DWELL = 2.5` real seconds is guaranteed to every line before the next may take it;
`tickTicker()` runs from the existing half-second stat bucket (no new per-frame work) and
ages, expires and drains the queue. The queue is capped at `TICK_QMAX = 2` and entries die at
`TICK_STALE = 6` s — a line that cannot be shown while it is still true is dropped, oldest
first, never shown late. In `strikeClock()` the `(hInt === 9 || hInt === 18)` branch is now
*inside* `hInt % 3 === 0` rather than an else-if against it, and `bellUntil` is one write
(`simT + (answered ? 2.6 : 2.2)`) so an answered strike is one longer flush, not two.
**Gates:** census PASS (unchanged, all 9 cells — no new `R()` draw, and the ticker is not
town state) · visual PASS · motion PASS (identical to baseline) · perf skipped (2 Hz, no new
per-frame pass) · probe `probes/ticker-queue.mjs` PASS on seeds 42/7/99/3
**Verdict:** shipped
**Surprise:** Two things the first cut got wrong, both invisible to a screenshot. (1) The
dwell was quantised to the 0.5 s stat bucket, so a line that went up mid-bucket was credited
with the whole of it and could be cut at 2.0 s; `tickerAge = -statAcc` at show time makes the
age equal real seconds on screen exactly. (2) Worse — at 18:00 a gardener line arrived in the
same window and shifted the *strike* out of the queue while its *answer* survived, so the
ticker read "The church bell answers…" with nothing to answer. Fixed by making the answer a
follow-on (`announce(txt, then)`) enqueued only when the strike is actually **displayed**, and
unshifted to the front. A dropped strike now takes its answer with it.
**Law:** A queued line that depends on another line is not an independent entry. Bind it as a
follow-on enqueued at *display* time of its antecedent, or the drop policy will eventually
show the reply without the remark. More generally: any drop-oldest queue will, given enough
traffic, break exactly the pairs you added it to protect.
**Cue:** iteration 9 left `probes/parapet-and-boat.mjs` at the repo root, matched by the
*unanchored* `parapet-and-boat.mjs` line in `.gitignore` — so it is cited in the ledger and
absent from the repo, which is the precise failure the anchored `/probe-*.mjs` comment above
it warns about. Either move it into `.claude/skills/grow-courtyard/probes/` and drop that
gitignore line, or delete it.

## Iteration 11 — the loop can finally see what an iteration costs (2026-08-03) [Sky, light & weather × Polish]

**Brief:** b10 — every worker row reads `secs=0 costUsd=0 turns=0 tokens=null`, so the one
metric this harness exists to catch cannot be read. Make the runner's call win; fix the
two-blob numstat; fall back to a HEAD~1 blob when `--pre-blob` is empty; deal with the stray
probe. Explicitly: do not touch `courtyard.html`.

**Did:** Four things, all in the harness.
(1) `runlog.mjs`'s "already recorded — nothing to append" guard is now a **merge**. An
iteration is legitimately recorded twice — the worker knows the ledger and the census, the
runner knows wall time, cost, turns and the true pre-blob — and neither call sees the whole
thing. The second call takes the more informative value field by field (`Math.max` for
secs/cost/turns/srcLines, OR for the monotone evidence booleans `srcChanged`/`committed`/
`logged`/`reverted`, keep-known-over-unknown for tokens/model/census), rewrites the row **in
place** by line index, and stamps `updated` + `merges`. It never appends a second line for the
same `iter`+`kind`. The verdict is no longer computed inline: `verdictOf(row)` is a pure
function of the *merged* evidence, so `rc` and `reverted` moved into `evidence` to be
mergeable at all. Lines the parser can't read are carried through the rewrite untouched.
(2) Dropped the `-- courtyard.html` pathspec from the blob-to-blob numstat. `git diff <blob>
<blob> -- <path>` is a **usage error, exit 129**, not a filtered diff — `git()` swallowed it,
so that branch returned `''` on every run since it was written.
(3) `--pre-blob` now falls back to the newest commit that is *not* part of this iteration
(`^Iter <N>`), not literally `HEAD~1` — which keeps it right when an iteration commits its
source and its runlog row separately, as every iteration here does. Worker only: for a manager
pass `HEAD~1` is the *previous worker's* commit, and the fallback would credit the manager
with the worker's diff.
(4) `probes/parapet-and-boat.mjs` → `.claude/skills/grow-courtyard/probes/`, path fixed to
`../../../../courtyard.html`. **No `.gitignore` change** — see Surprise.

**Gates:** census PASS (all five sections `unchanged`, which is the *correct* reading: the
artifact is byte-identical, blob `eeb2a879` before and after) · visual **n/a** and motion
**n/a**, not skipped-for-convenience — zero bytes of `courtyard.html` changed, so a screenshot
gate would be photographing HEAD · probe `probes/runlog-merge.mjs` **24/24 PASS**, run against
a scratch copy of the skill dir so the real `RUNLOG.jsonl` is never written: it asserts the
merge lands the metrics, produces no duplicate, keeps `when` as first-sighting, preserves
ledger evidence, recomputes the verdict, counts 68L from the two blobs where `HEAD~1` gives 0,
survives an unparseable line, and — case 5 — does not let a *bare* second call zero metrics a
first call already recorded · relocated `parapet-and-boat.mjs` re-run end to end and reproduces
#9's published figures exactly (12.0% occupancy, 2.1 glances/boat, longest watch 1.75 s), which
is both a move-didn't-break-it check and the first time that ledger citation has been backed by
a file in the right place.

**Verdict:** no-ship ← and that is the right answer, not a miss. The brief forbade touching
`courtyard.html` and I did not; `runlog.mjs` will score this row `no-ship` from the blob, the
two will agree, and nothing was done to the source to make the number look better.

**Surprise:** Two, and both are the same shape — a stale premise that had already been
promoted into memory as fact.
The brief (inheriting #10's cue) said an *unanchored* `.gitignore` line had swallowed the
parapet probe, so it was "cited in the ledger and absent from the repo". It was never absent.
`git log -p --all -- .gitignore | grep parapet` returns **zero occurrences ever**, `.gitignore`
has not been touched since `cc497f6`, and the file has been tracked since `f23c893`. What #9
actually did was create a **second `probes/` directory at the repo root** and commit the probe
into it. Nothing was ignored; it was in the wrong one of two identically-named directories, and
everyone downstream diagnosed the ignore rule that the `.gitignore` comment had already warned
them about. Deleting that anchored line — which the brief offered as an option — would have
removed a working guard to fix a bug it was not causing.
The second: the pathspec bug was invisible because the fallback masked it *perfectly*. Every
iteration commits its source in one commit and calls `runlog.mjs` before writing its second
commit, so at that instant `HEAD~1..HEAD` is exactly the right diff — nine rows of plausible,
correct line counts produced entirely by a fallback the comment above it calls unreliable, from
a primary path that had never once executed. A wrong mechanism and a right answer, agreeing for
nine iterations. That is why the probe asserts on the *number* the two blobs give and against
what `HEAD~1` gives in the same breath (68 vs 0 today): the two only diverge once HEAD has
moved on, which is precisely when nobody is looking.

**Law:** A guard that refuses a duplicate throws away whichever call is second — so if the two
callers know *different* things, the refusal silently discards one of them forever. Merge
field-by-field on an identity key instead, treating the empty value (0, null, '') as "not
measured" rather than as a measurement. Ten iterations reported $0.00.
**Law:** Before removing a guard a ledger cue blames, check the guard ever fired. `git log -p
-- <file> | grep <thing>` costs one command; the cue that sent you may have been written by
someone who also only read the comment. A promoted law inherits its evidence *and its
mistakes*, and is then read forever.
**Law:** `git diff <blob> <blob> -- <path>` is a usage error, not a filtered diff. Any git
call wrapped in a `try/catch { return '' }` needs its exit status checked at least once by
hand, or a permanently-failing command reads as a permanently-empty result.

**Cue:** `stall.mjs:110` and `build-stats.mjs` average `secs`/`costUsd` over *all* rows
including the nine zero-metric ones, so "last 10: avg 2m $0.48/iter" is a real total divided by
ten. Rows 2–10 stay zero on purpose (honest records of a broken instrument, per the brief), so
the means stay wrong for ten more iterations unless the aggregates skip rows with `secs === 0`.
Worth one line each; I left it because it is the manager's dashboard, not the worker's.
**Cue:** `~/Library/Logs/courtyard-grow.log` does hold real wall times for iterations 2–10
("landed in 1143s", etc.), so `secs` *could* be back-filled. Cost, turns and tokens cannot be —
they only ever existed in the discarded `--raw` stream. A half-back-fill would read as "20
real minutes for $0.00", which is worse than a visible zero. Left alone deliberately.
**Cue:** `LAWS.md`'s probe law states its reason as the unanchored `.gitignore` line. The
advice (probes live in the skill's `probes/`) is right; the stated cause is not. Manager may
want to reword it to "there is exactly one `probes/` directory" before it is re-derived again.

**Proof on this row (the brief's success criterion).** Call 1, the worker's own:
`○ Iter 11 … no-ship 0m00s $0.00 0L 6996159`. Call 2, runner-shaped, carrying
`--elapsed 857 --rc 0 --pre-blob`: `○ Iter 11 … no-ship 14m17s $0.00 0L 6996159
[merged +1]`. `grep -c '"iter":11'` = **1** before and after; the file went 12 → 13
rows for one new iteration. The row now carries `when` 04:57:28, `updated`
04:57:46, `merges: 1`, `secs: 857`, and `verdict` = `selfVerdict` = `no-ship`.
`stall.mjs --report` reads `#11 … 14m` where every worker row before it read `0m`.
**`costUsd` is still $0.00 on this row and that is honest, not a half-fix**: cost,
turns and tokens exist only inside the `--raw` stream-json capture that
`run-loop.sh` makes, and this iteration was hand-invoked, so no such stream exists
to read. Fabricating one to make the row look complete is the exact failure this
harness was built to stop. The `--raw` path is proved instead in
`probes/runlog-merge.mjs` cases 1, 5 and 6, against a stream the probe writes and
labels as synthetic. The first row with a real dollar figure will be #12, from the
runner.

**Cue:** `stall.mjs`'s `streak()` runs over *all* rows, and a manager pass is always
`verdict: no-ship` with `srcChanged: false`. With `MANAGER_GAP=2` a manager row sits
beside worker rows constantly, so a *single* no-ship worker iteration is enough to
fire both `noShipStreak` and `srcFlat` — which is precisely what happened on this
iteration, where no-ship was the brief's own instruction. The trigger that summons
the manager is counting the manager's own passes as evidence that the loop has
stalled. One-word fix (`streak` over `kind === 'worker'`), but it changes when the
manager runs, so I left it as the manager's call.

## Iteration 12 — the town has a year now (2026-08-03) [Sky, light & weather × Scale/World]

**Brief:** b12 — `maturity()` pins at day 8 and `richness()` at day 16, so every growth term
is spent by real minute 15 and there is no later act. Add ONE slow *cyclic* scalar `season()`
on the footing of `cloudCover()`, rate-capped, with at least two readers in the sky: the length
of the day, and the light. Set a floor and state the population trough.

**Did:** `SEASON_LEN = 26` days (× 55 s ≈ **23.8 real minutes** a year). `seasonPhase` advances
at exactly `1/(SEASON_LEN*DAY_LEN)` per sim second in `updateClock`, `warmth = 0.5 - 0.5*cos(2π·phase)`,
and `season()` is the accessor. The clock **starts at phase 0.25**, where warmth is exactly 0.5 —
and every seasoned expression below is written as a pair that *averages to the constant it
replaced*, so day 0 is the old town precisely and the year is a departure from it in both
directions. Phase 0 is midwinter, so the once-a-year wrap lands where nothing else happens and
`warmth` is continuous through it.
*Reader one, the day itself:* `dayHours = lerp(11.5, 17.5, warmth)` about a fixed `SOLAR_NOON`
12.75; `sunUp`/`sunDown` walk apart and back and `daylight` is the sine over that window.
`timeLabel()` hangs off the same two, or it reads "Morning" in the winter dark.
*Reader two, the light:* `sunVec()` drops its elevation and swings its azimuth with `warmth`
(shadow length `SUN[1]/SUN[2]` runs 0.83 at midwinter noon against 0.25 at midsummer); `skyCols()`
seasons the day, night and dusk palettes and hangs both dusk windows off `sunDown`/`sunUp`; the
roof `key` term scales 0.84..1.16. One `sunArc` in `updateClock` now feeds both the shading
vector and the drawn disc, which each used to derive their own from hard-coded hours.
Census carries `clock.season` and nothing else.

**Gates:** motion **PASS** ×2 (nothing teleported, NaN'd or flickered; the firefly/leaf spawn
churn is the reshuffle plus genuinely longer winter nights) · perf **PASS** +0.0% against the
interleaved same-session control · visual **PASS**, from `probes/year-shots.mjs` rather than
`shoot.mjs` — see Surprise · census **FAIL, investigated and overruled on measurement**, below.

**The census FAIL.** `COLLAPSE people 139 → 127 (-8.6%)`. It is not a collapse, and I did not
take that on faith:
- `probes/census-noise.mjs` runs the gate's own 9 cells on both builds and then widens to 8
  seeds. Over 8 seeds the diff is **-3.1%**, not -8.6% — and **HEAD's own 9-cell total moves
  139..147 (6%) purely by which three seeds you pick**. The gate's three seeds happen to be
  HEAD's *lowest* triple. Cell `42@900` alone is -6 and is a shower that landed on the sample
  instant (`cloud 0.23`, dry → `cloud 0.92`, RAIN); `19@900` *lost* its shower and gained +2.
- `probes/season-year.mjs` measures the thing the gate is proxying, at ~4,400 samples per build
  instead of 9: **settled (day ≥ 8) mean population 21.91 vs HEAD's 21.73.** The year costs the
  town nothing on average.

**The floor, as the brief asked.** Folding 3 years × 3 seeds onto one and binning by phase:
midwinter **20.35** · late winter 22.03 · spring 22.31 · late spring 22.69 · **midsummer 23.48** ·
late summer 21.95 · autumn 21.08 · early winter 21.68. So the population does breathe, by about
**15% trough-to-peak** — and the **absolute floor across every sample of every seed is 7 people**
(HEAD's is 8). Deep winter is never a dead diorama. This is deliberately gentle: I kept peak
`daylight` at 1.0 so *duration*, not midday brightness, is the seasonal lever on population, and
winter reads dim through the light instead. See the Law about why it could not be much larger.

**Surprise:** Three.
(1) **The sun did not know what month it was.** `sunVec()` seasons the *shading*, but the disc
in `drawSunMoon` had its own `sy = hz - sin(π·sa)·hz·0.74` — so at midwinter noon the sun sat at
exactly midsummer height and only the shadow lengths dissented. The one object in frame a viewer
looks straight at was the one thing not seasoned. Caught by putting the two noons side by side,
not by any gate. Fixed by riding the same elevation, plus a colour ramp (pale and cold → deep gold).
(2) **`shoot.mjs` cannot compare two builds.** It runs `&fast` (8×) with a fixed 2,600 ms wall
wait, so its sim instant lands anywhere across ~15 s of sim time — its comment says "day 3,
mid-morning" and it photographed Day 4 · Night twice tonight. Fine as a does-it-still-draw check,
useless for HEAD-vs-here. `probes/year-shots.mjs` pins the instant with `?pause` + `__warp()` and
shoots both builds at the same moment of the same seeded world; that pair is what actually cleared
the draw-order check.
(3) **The filmstrip POP was the instrument, not me.** `--gap 55` POPped at frames 3–4 (Δ 11.6,
12.9 against a 2.7 median). Running the *identical* filmstrip against HEAD in a scratch root
(`/tmp/fs-head/.claude/skills/grow-courtyard/`) POPs at **five** frames at the same Δ≈11 — and
HEAD's frame-1 POP is measurably a full rainstorm clearing (`cloud 0.92` + 110 drops → `cloud
0.12`). At a one-sim-day gap, Δ≈11 is what weather costs. My sheet is quieter than HEAD's.

**Law:** The census's `people` has a **~6% seed-choice noise floor against a 5% collapse
threshold**, so it can fire on nothing — and *any* change that moves `daylight` or a rain gate
reshuffles the PRNG as thoroughly as a new `R()` draw does, because those gate whether an `R()`
is drawn at all. Before believing a `people` FAIL, widen the seed set and measure the same
quantity densely; nine instants cannot tell a seasonal trough from a rainy Tuesday.
**Law:** When you season (or otherwise parameterise) an existing constant, write the new
expression as a pair that **averages to the old constant** at the mid-point of the new parameter,
and start the world there. Every gate then reads the unchanged town at t=0, so a diff is
attributable to the parameter and not to a new baseline — and the change is provably a departure
in both directions rather than a one-way shift.
**Law:** A screenshot tool that runs `?fast` with a wall-clock wait is not pinned, whatever its
`--t` says. Comparing two builds needs `?pause` + `__warp()`; anything else compares two moments.
**Law:** Before blaming your change for a `filmstrip` POP, run the identical filmstrip against
HEAD in a scratch root. The instrument has a baseline rate of POPs and nobody had measured it.

**Cue:** `0.25 + 0.75*daylight` in `capacity` (and `0.2 + 0.8`, `0.15 + 0.85` in the rates)
compresses hard, so mean daylight running 0.305 (winter) to 0.464 (summer) — a 52% swing — moves
`capacity` only 8 → 9. That compression, not the season, is why the population breathes 15% and
not 40%. Widening it is a People-&-animals vector with real risk to the floor, and it is the
manager's call, not a thing to slip into a sky iteration.
**Cue:** `stepClouds`'s heavy-front probability reads `richness()`, which pins at day 16 — the
weather is now the only slow system left that still has a one-way ramp in it. `season()` is
sitting right there.
**Cue:** `context-budget.mjs` reported **OVER (48.4 KB / 46 KB cap)** at the start of this
iteration, before I read anything. LAWS.md is at 28/60 laws and I am proposing four more.

## Iteration 13 — the picture now admits it answers a touch (2026-08-03) [Courtyard & garden × Interaction/UX]

**Brief:** b13 — the diorama has been clickable since before the loop began and nothing on
screen said so. Make the touch discoverable without spoiling it: a cursor that tells you the
cell under the pointer will answer, and a first-time viewer invited exactly once.

**Did:** Two hints and no third.
*The cursor.* One predicate, `answersTouch(x,y)`, is now the single definition of "this cell
answers": the six tile types the click handler branches on. `mousemove` reads it and swaps
`cv.style.cursor` between `pointer` and `default` — on transitions only, not per event — and
the click handler now *guards* on the same call instead of doing its own bounds check, so the
hint cannot promise a response the click does not give. Both go through a new `cellAt(ev)`.
The canvas base cursor was `crosshair`, which said "aim" everywhere and so said nothing; it is
now the plain arrow, and the pointer is the only special cursor in the frame. 46% of the frame
is live, so a hand crossing the picture finds it.
*The invitation.* One line, once, then never again: `offerInvite(now)` off the real frame
clock (not sim time — `?fast` must not hurry a reading speed). It refuses to compete for the
ticker: it waits for `tickerFree()` and takes the surface directly rather than queueing, where
the drop policy would either lose it behind the news or hand it over long after the viewer had
moved on. Clicking first cancels it — `touched = true` in the click handler — and a `?pause`
page is the harness, not a viewer, so `DRIVEN` stands it down and every gate still measures the
town rather than the advertisement.
*Two small seam changes it needed.* `tickerFree()` is factored out of `announce()` (announce,
`tickTicker` and the invitation now route on one definition), and a line may buy its own dwell
via `lineDwell` — the invitation takes 5.5 s because it asks the viewer to *do* something and
2.5 s is a fair read of a remark, not of an instruction. It is the only caller that does.
*The narrow sill.* `@media (max-width:640px)` hides the ticker, so a phone had neither of the
two hints. `#sill.inviting` lends the invitation the plate's and the clock's place for 7 s and
then gives them back, with a shorter line ("Touch the picture — it answers.") that fits 390 px
untruncated.

**Gates:** census **PASS — literally `unchanged` in all five sections**, which is the point:
the change consumes no `R()` and writes no town state, so the world is byte-identical and the
whole diff is affordance · motion **PASS** (nothing new jumped, NaN'd, flickered or churned) ·
visual **PASS** (wide/courtyard/east/lane unchanged — `shoot.mjs` fires at 2.6 s wall, before
`INVITE_AT`, so the idle diorama it photographs is exactly as busy as yesterday's; plus the
sill during and after the invitation at 1280 and at 390×844) · filmstrip **skipped** — no draw
code was touched and no per-frame pass added (the frame gained one boolean test) · perf
**skipped**, same reason · probe `probes/touch-hint.mjs`: 345 real mouse positions, cursor and
click handler agree on **345/345**, live share **46.1%**; a pointer cell answers a click and a
default cell does not; the invitation appears **exactly once** at ~9.2 s and holds the surface
**5.4–5.6 s**; **0** appearances to a viewer who clicked at 3 s; at 390×844 it is visible,
**unclipped**, and the plate is back by ~15 s.

**Verdict:** shipped   ← my view; runlog.mjs decides from the diff

**Surprise:** Two, and both were the probe overruling me.
(1) **The first cursor run reported 14 disagreements out of 345 and there was no bug.**
Chromium rounds the coordinates it puts on a synthesised mouse event, so my fractional sample
point made the page floor one cell and the probe floor its neighbour — and because a whole
sampled row shared a `y`, the phantoms clustered on the rows nearest a terrain edge, which is
exactly what a real off-by-one draw fault would look like. Rounding the points to integers took
it to 0/345. A probe that drives real input has to *be* pixel-honest, not approximately so.
(2) **The invitation was being swapped out at 2.5 s and I would have shipped that.** The queue
guarantees every line `TICK_DWELL`, and the ambient remarks are frequent enough that the one
line asking the viewer to act got the same 2.5 s as "Sparrows bicker somewhere in the linden."
The still frames looked perfect; only the time series caught it. Hence per-line dwell.
Also worth recording: I checked the cursor by hand at a point I had labelled "wall", got
`pointer`, and briefly believed I had a bug. The cell was the cross-street ROAD, which does
answer. The probe had already been right about that point; my label was wrong.

**Law:** An affordance is a claim, and the claim and the response must be the SAME predicate,
read by both — a hint derived separately from the handler it advertises will drift into either
a lie or a silence. Verify it by agreement over many real input positions, not by looking.

**Law:** A probe that drives real mouse or touch input must use integer screen coordinates.
The browser rounds what it puts on the event, so a fractional point makes the page and the
probe disagree about which cell was hit, and the phantoms cluster along edges — indistinguishable
from a genuine off-by-one.

**Cue:** `context-budget.mjs` reports **OVER: 51.5 KB against the 46 KB cap** (LEDGER.md at
18.6 KB is the bulk, laws 28/60). It was already over when this iteration started.

**Cue:** The cursor now advertises the whole cross street and every footway in town, but a
`SIDE`/`ROAD` click anywhere announces the *lane* crumb line and clamps the birds it spawns into
the lane rows — so a click at the north end of the cross street reads as a promise kept in the
wrong place. Pre-existing; out of scope here (the brief forbade new click responses), but the
hint is what makes it visible.

**Cue:** `INVITE_WIDE` is one fixed string, deliberately not a `pick()`, so the page consumes no
`R()` for it and the census stays byte-identical. Anything later that wants to vary the line
must accept that it reshuffles the whole seeded world.

## Iteration 14 — the beds read the year: growth, ceiling and dieback all scale with warmth (2026-08-03) [Courtyard & garden × New CA rule]

**Brief:** b13 — let the planting CA read b11's `season()`, so the beds fill and empty
over the cycle instead of saturating at maturity-1 and holding there forever.

**Did:** Three seasoned terms next to `maturity()`/`richness()`, all reading `warmth`
and nothing else, each written so warmth 0.5 *is* the constant it replaced:
`growF()` 0.30..1.70, `dieF()` 1.80..0.20, `bloomCap()` 3/2/1 at warmth 0.42/0.20.
In `caTick` they multiply the two seed rolls, the stage-advance roll, the wear-recovery
and daisy terms, and the dieback probability. The lawn's `health` in `groundCol` and
the gatehouse ivy's reach and colour now hang off the same `warmth` instead of deriving
their own from `richness()`.

The load-bearing bit is that `bloomCap` is a *ceiling*, not a kill term. `caTick` already
ages the bed that sits **at** its ceiling, so lowering the ceiling turns the beds over by
itself — no seasonal dieback branch bolted on beside the existing one. Changing `bSt[i] < 3`
to `bSt[i] < cap` is the entire winter.

**Gates:** census **FAIL** (`planted` 5729→4793, −16.3%) · visual PASS · motion PASS
(zero jumps/nan/oob/flicker; only spawn churn) · filmstrip PASS · perf skipped

The census failure is attributable and I did not touch the gate to hide it.
`probes/beds-year.mjs` measures the three census cells directly: the warp-90 and warp-330
cells are **unchanged** (1832, 2160), and the entire delta is the warp-900 cell
(1737→749), which at SEASON_LEN 26 lands at season 0.879 — **warmth 0.14, deep winter**.
The gate is reading a bare garden in January as a collapse. See the Cue.

**Surprise:** two, both from measuring instead of assuming.

The CA-variety law made me expect the winter clear-out to cost species diversity, and I
had a seasonal inheritance term written to counter it. It is not needed and I did not ship
it: over three full years the flower mix holds at Shannon evenness 0.999 / 0.998 / 0.998
with all 7 species present at every summer peak. The reason is mechanical — re-seeding
inherits a neighbour's species only when `neighborsMature()` finds one, and in winter
there are none, so every spring cell falls through to a fresh uniform draw. **Winter is
itself the reseeder.** The variety law's "something has to reset it" was already satisfied
by a rule I was about to duplicate.

The other: the cap alone drove `blooming` to *exactly* 0 for 11 of the 26 days. Numerically
fine, artistically dead, and against the brief. Fixed with per-cell hardiness —
`hash(x, y+41) > 0.86` keeps the full ceiling for about a seventh of the cells, so deep
winter reads as a few things still out in turned earth (17–35 blooms) rather than nothing.
Winter blooming went 0 → ~22; summer is untouched at ~690. The year now runs 17..698.

**Law:** A seasonal *ceiling* on a CA stage is a better lever than a seasonal kill term,
when the rule already ages whatever sits at its ceiling — one changed comparison gets the
emptying, the turning-over and the refill, and it cannot desync from the growth term the
way a parallel kill branch would. But check what the ceiling does to the thing the census
counts: a ceiling that is *below* the counted stage takes that count to exactly zero, not
merely low, and zero of anything visible reads as broken rather than as seasonal. Give it
a per-cell `hash()` exemption so the floor is a scatter, not an absence.

**Cue:** the census age ladder now conflates two axes. Its ages were chosen as
"young / filling in / fully grown" (warp 90/330/900), but with a 26-day year the warp-900
cell is also *midwinter*, so any change to seasonal planting reads as a collapse in
`planted` and any real winter regression is now invisible against it. Either pick ages
that land at comparable warmth, or have the census hold `season` fixed across the age axis.

## Iteration 15 — the shower runs out of drops instead of being switched off (2026-08-03) [Sky, light & weather × Polish]

**Brief:** b14 — rain ended in one frame: `raining=false`, `raindrops.length=0`, all
~110 drops gone between two frames while the sheen behind it eased out over 18 s.

**Did:** Split the shower in two. `raining` stays the boolean the town's *behaviour*
reads — umbrellas, "nobody lingers in the wet", the three damped spawn rates — and it
is right for that to be a switch. `rainFall` is the same shower's 0..1 intensity, and
it is what everything *drawn* reads: the drop count, the whole-screen `rgba(90,105,125)`
tint, the pond rings, the water sparkle it crossfades with, and `drawSmoke`'s `cold`.
`RAIN_TAIL = 2.2` s against a 55 s day.

The load-bearing bit is that the drops are not deleted, they are **not sent round
again**. The tick already recycled a drop that passed `y > H` back to the top; now it
recycles only while the kept count is under `want`, and `want` is `110 * rainFall`. So
the shower ends the way a shower ends — nothing new arrives, and what is in the air
finishes falling. No drop ever vanishes mid-screen, which is why the motion gate stays
clean. `raining` flips when `rainLeft <= 0 && !raindrops.length`, so the last drop
lands before the announcement. `wet` is ramped to 6 (its own full-sheen clamp) across
the tail, so the street is already shining before the last drop lands, and the existing
`wet = 18` at the end is now a no-op step rather than a jump from nothing.

At `rainFall === 1` every one of those expressions is the constant it replaced, so full
rain is unchanged.

**Gates:** census PASS · motion PASS (0 jumps/nan/oob/flicker) · visual PASS · filmstrip
PASS · perf skipped (same per-frame loop, one extra write per drop)

**Measured, not argued** — `probes/rain-out.mjs` finds each build's *own* rain end (the
PRNG reshuffles, so the shower does not land twice at the same instant) and replays the
6 s around it at a 0.1 s gap:

| seed | HEAD max Δ | new max Δ | where the max is now |
| --- | --- | --- | --- |
| 42 | 7.689 (×7.9 med) **at the end** | 1.849 (×1.7 med) | 1.3 s *before* the end |
| 7 | 10.855 (×62.4 med) **at the end** | 1.053 (×8.8 med) | 2.3 s *before* the end |
| 19 | 8.195 (×8.2 med) **at the end** | 1.567 (×1.5 med) | 0.7 s *before* the end |

On HEAD the largest frame in the window *is* the ending, on all three seeds. After the
change the ending is not the largest frame on any of them. Seed 7's Δ at the instant
`raining` goes false is **0.074**, against a window median of 0.120 — the flip is now
below the noise. And the same filmstrip that flagged it: HEAD `--scene 230 --seed 7`
POPs at Δ 11.054 against a 0.421 median; here `--scene 231.4` has no POP, a 1.918 max,
and a monotonic decay 1.9 → 0.17 across the ending. Drop count runs 104 → 0 over ~3 s.

**Surprise:** the drops were the smaller half of it. A 0.16-alpha fill over the *whole*
canvas is worth more mean-pixel Δ than 110 two-pixel lines, so cutting only the drop
count would have left most of the pop. The brief named the drops; the instrument named
the tint. The ~3 s taper also overruns `RAIN_TAIL` by ~0.8 s, because `want` falling to
zero only removes a drop when that drop reaches the bottom — the count lags the ramp by
one fall time (~1.4 s at 520–780 px/s). Physically right, and worth knowing before
anyone tunes the constant expecting it to be the duration.

**Law:** When a state flag gates both behaviour and drawing, splitting it into the
boolean and a 0..1 intensity is cheaper than easing the flag: behaviour keeps its clean
edge, and every draw site becomes a multiply by the same scalar. Fade the *largest* thing
the flag draws first — a full-canvas tint outweighs any number of small sprites in a
whole-frame Δ, so ask what fraction of the frame each gated draw covers before deciding
which one is the pop.

**Law:** An entity population is better wound down by **withholding its supply** than by
truncating its array. Stop recycling and let each thing finish its own life and the
count decays for free, with no mid-screen despawn for the motion gate to catch —
`raindrops.length = 0` is one line and one pop; "recycle only while under `want`" is one
line and an ending.

**Cue:** `motion.mjs` has no `raindrop` kind, so the gate that exists to catch things
popping in and out of existence is blind to the town's largest such population. It
passed this iteration without being able to see it.

**Note:** `context-budget.mjs` read **OVER** at 52.8 KB against the 46 KB cap when this
iteration started (LEDGER.md 17.1 KB, state.json 13.4 KB, laws 28/60).
