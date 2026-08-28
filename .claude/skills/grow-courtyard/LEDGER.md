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

## Iteration 27 — the pointer names what it is over (2026-08-04) [Courtyard & garden × Interaction/UX]

**Brief:** b26 — 64% of the frame answers a click and the cursor says so, but nothing says
*what* you are pointing at. Name it, read off the grid, correct as the season changes.

**Did:** one label in the sill, borrowing the **ticker's** box (upright, no full stop — the
ticker is prose the town says, this is a label for a thing). Everything in it is read, never
inferred: species off `bSp`, stage off `bSt` against `bedCap(x,y)` — lifted out of `caTick`
so the ceiling has one definition now a second reader wants it — allotments named per *plot*
off `plotCrop` at the row's best stage, paving and water off `pavingAt`/a new `WATERS` table
that also feeds the click's three water lines. Trees are hit-tested in **screen** space
against a `crowns[]` the draw pass records: a crown is painted cells north of its own trunk,
and a second derivation of that geometry is exactly what drifts. Manners: one read per
*frame* off the last pointer position, not per mousemove; `NAME_SETTLE` 0.12 s before a name
commits (a sweep crosses fifty 9-px cells), instant to clear; yields to a live ticker line,
never opens under `inviteHold`. A phone has no hover, so the **tap** names and holds 4.5 s.

**Gates:** census **PASS — every field unchanged in all 9 cells** (no new `R()` draw, so a
read-only vector must reshuffle nothing; `bedCap` is the old inline expression moved, and
the census proves it exactly) · motion **PASS** vs a HEAD baseline · visual PASS
(`probes/naming-shots.mjs`) · perf **PASS** (+0.0% day and night, 3 interleaved reps) ·
**probe PASS** `probes/naming.mjs` 24/24: 13 crowns each naming their own tree, **0 cells**
where `nameAt` and `answersTouch` disagree (9581 = 9581), 733 beds named with 0 wrong,
4 linden labels round the year, blossom *and* fruit found.

**Verdict:** shipped

**Surprise:** a feature that reads a screen *position* found a bug that #24 shipped and
nobody could see. The sill **borrows** space — one line where the plate was two — and that
changes the canvas's box with no `resize` event at all: measured **+16 px at 390 px**, a 2%
vertical stretch that is invisible in the picture and puts `unproject()` **two cells out at
the bottom of the frame**, because it is still working in the old geometry. The invitation
has resized the sill this way since #24; nothing read a position back then. A
`ResizeObserver` on the frame fixes it (0 px at 1400 — a phone-only shift). Second: the
naming waits for the ticker's line to be *read*, and `tickerAge` is bucketed off the sim's
`dt` — so on a **paused** page it waits forever. Reading is a real-time act, so `lineAt` is
stamped off `performance.now()`, as `TICK_DWELL` is documented to be.

**Law:** read a screen coordinate → observe the **frame**, not the window; a UI element that
borrows space resizes the picture silently. A timer a *person* races runs on the real clock.

**Cue:** c53 — the naming names places and plants, not people.

## Iteration 28 — the season is a button, and the year runs on (2026-08-04) [Sky, light & weather × Scale/World]

**Brief:** b27 — fourteen iterations of seasonal work addressed to a viewer who would have to
sit here 24 real minutes to see any of it. Reach another season without popping six hysteretic
systems. The batch bet.

**Did:** `#season` becomes a `<button>`; clicking it runs the town on to the next quarter as a
**fast-forward, not a jump**. Nothing writes `seasonPhase`, `cloud`, `bSt` or a position —
`stepSkip()` only hands `frame()` more sim seconds and `simSub()` splits them so no step exceeds
`SKIP_SUB` 0.25 s. That is the whole safety argument: every rate cap here is per SIM second, so a
sub-stepped advance is indistinguishable from having waited; what is compressed is REAL time. It
lands on a **whole number of sim days** nearest a quarter-turn, so the hour survives — 7+6+7+6 =
26 = `SEASON_LEN`, and four clicks return the identical phase *and* hour. Rate is a flat-topped
trapezoid advanced off the profile's **exact integral**. `announce()` is deaf throughout;
`land()` says one line. `RM` gets an honest cut behind a `#veil`. Full entry in the archive.

**Gates:** census **PASS — every field unchanged in all 9 cells** (no new `R()`) · motion PASS vs
a stashed-HEAD baseline · perf PASS +0.0% · visual PASS · `probes/season-skip.mjs` 33/33 ·
`probes/skip-strip.mjs` against a `__warp` control at the same sim gaps: max frame-Δ 32.64 vs
32.86, with **fewer** out-of-line frames than the control · `probes/skip-shots.mjs`: **midwinter
19.6 real seconds** after the first click, 684 blooms → 26. Budget opened **OVER** (47.1 / 46 KB).

**Verdict:** shipped

**Surprise:** both hard bugs were invisible to the thing that should have caught them. (1) The
lapse overshot by exactly its own duration — `dt * speed` kept riding on top of the profile,
0.095 of a day per click, which no eye can see and which compounds into a year that no longer
closes; only the four-click round trip could see it. (2) I closed the CSS comment above `#season`
one line early, so five lines of prose parsed as a selector and **swallowed the whole rule** — it
shipped as a grey chip. The probe passed: tag `BUTTON`, right text, handler fired. A screenshot
caught it. (Both promoted to LAWS.md.)

## Iteration 29 — the stalls sell what the plots grew (2026-08-04) [Lane & market × Connect]

**Brief:** b28 — the market is the last flat system in the town. Connect it to the
allotments, which ripen and are picked across a full year fifty feet away.

**Did:** one store, `produce[]`, written by exactly one line — `harvestPlot()` pays in the
cells it lifted, so the basket (`a.crop`) that walked out of the block for four iterations
now goes somewhere. `stockMarket()` latches that store ONCE per market day at the first
trestle, empties it, and lays it out as `mkShelf` (species order, so a stall sells one or
two things). `marketRaise(i)` gates on `mkTrades(i)`: `MK_NEED [0,4,13]` units, so the
second and third traders only set up if the plots sent enough — stall 0 always comes, but
it can stand behind an empty board. Each pitch is a vegetable the stall was actually
stocked with, in its own colour and size. Half of what the market cannot carry (`MK_CAP`
18) keeps to the next one. `mkLine()` says which crop, and browsers walk to a stall that
came out.

**Gates:** census **PASS** (small reshuffle churn, no collapse; new field `planting.produce`)
· motion **PASS** · visual PASS · filmstrip day PASS, no POP · `probes/market-year.mjs` over
**120 markets / 5 seeds / 104 days**: midwinter **6.0 units, 1.67 stalls** vs midsummer
**35.7, 2.96**; one stall on 24% of markets, three on 58% · `probes/market-shots.mjs`
midsummer 3 stalls 6/6/6 vs midwinter 2 stalls 6/5/0, naming the plots the difference came
from · `probes/market-raise.mjs` unchanged vs HEAD (seed 42's spike is pre-existing,
stashed and confirmed). Budget opened **OVER** (48.4 / 46 KB).

**Verdict:** shipped

**Surprise:** two. (1) The store made the year's trough MOVE. Without carry-over winter was
bare and spring recovering; with it, autumn's glut arrives late and **spring** becomes the
thinnest quarter (3.8 units vs winter's 6.0) — two lags composing into a hungry gap nobody
wrote. (2) My first probe reported a different midwinter market every run — 2.1 units, 13.6,
22.1, 5.4 — same seed, same code, same pinned instant. **Drawing consumes `R()`**, so any
host round-trip walks the seeded stream even with the sim stopped. One page per quarter
fixed it. (Both promoted to LAWS.md.)

## Iteration 30 — the courtyard reads the sky too (2026-08-04) [People & animals × Connect]

**Brief:** b29 — the street refuses and vacates a seat under a building front; the
courtyard sat through it, because both gates read `a.street`. Close c11.

**Did:** two predicates, one definition each — `SIT_REFUSE` 0.42 (take a seat) and
`skyLifts(a)` (give one up, 0.55..0.88 off `a.wary`). The gate is no longer `a.street` but
**what you are doing**: on the street everyone not lying down; in the courtyard the people
*sitting*, so the napper sleeps on and the gardener finishes their row. c11 sat open 24
iterations because `picnic`/`sitter` are `STAYING` and reach their seat with an empty
waypoint list, so a refusal meant `a.done` on the lawn — `routeToExit()` is the walk out
they never had. A pair is linked both ways (`a.mate`) and judges the sky **once**. The
blanket line moved from spawn to when the blanket is spread: a refusable seat makes an
announcement at spawn a promise the town may break.

**Gates:** census PASS (reshuffle churn, no collapse; `people` 186→182 is the feature) ·
motion **FAIL→analysed**: only `shower` fired, untouched, and `probes/shower-jump-spread.mjs`
puts it at 0..2 on both builds · visual PASS · filmstrip day PASS · perf skipped ·
**`probes/seats-out.mjs`**, 8 seeds × 12 sim days, HEAD vs here: refusals **0 → 15**; under
`cover>0.60` the courtyard sits **0.269 → 0.074** while the street holds 0.020/0.019 — it
empties *to where the cafe already was*; under `cover<0.30` 0.439 → 0.461, a blue afternoon
untouched; **0 vanished, 0 pair splits** · `probes/seats-shots.mjs`: blanket on the grass,
then an empty lawn and umbrellas walking out.

**Verdict:** shipped

**Surprise:** the vanish test nearly shipped as a tautology. I first wrote it as "despawned
while `act === 'sit'`" — the bug's exact *inverse*: a naive refusal sets `done` in the
**walk** branch, so the agent disappears mid-lawn still labelled `walk` and the test reads a
clean 0 forever. Re-anchoring on *position* made it real; the min observed despawn radius,
**32.7** against a threshold of 16, is what turns the 0 into evidence. Second: `__warp(0.25)`
is 7–8 sub-steps and a probe sees only the boundary, so sampling reported 3 phantom refusals
**on HEAD**, which has no refusal path. Wrapping the one function both paths go through gave
0. (Promoted to LAWS.md.) Context budget opened **OVER** (49.8 / 46 KB).


## Iteration 31 — the sill says it is pressable, once, in its turn (2026-08-04) [Sky, light & weather × Interaction/UX]

**Brief:** b30 — make the season button legibly pressable and say so once, without shouting
beside the canvas hint.

**Did:** (1) `#season` gains an underline that stops at the WORD — `::after` is now an
`inline-block`, and text-decoration does not propagate into one, so the chevron stays
punctuation. Padding is the hit area, an equal negative margin gives it back: **20→30px** wide,
**12→29px** in the 390 caption slot, where it also takes full `--ink` instead of the `--ink-dim`
of the subtitle it displaced. Sill and canvas byte-identical to HEAD.
(2) `offerInvite` is an `OFFERS` queue of two, not a flag. Each carries the act that silences it
(`touched`, `pressed`), and an offer is **spent when it comes up**, spoken or not — that is what
makes "never twice" structural. `offerFree` (the dwell plus a 6 s staleness window) holds them
apart. At 390 the second keeps the plate and drops the TITLE
(`.inviting.at-season`): the offer pointing AT the season may not hide it while it speaks.

**Gates:** census PASS · motion PASS · visual PASS · `touch-hint.mjs` PASS **unchanged** ·
**`probes/season-invite.mjs` PASS, 7 FAILs on HEAD** — touch 8.0..13.7s, season 21.5..26.8s,
**0 overlapping samples**, +28px fit, cancelled by a press, silent on `?pause`.

**Verdict:** shipped

**Surprise:** three, and all three were my instrument lying rather than the page. (1) I opened
the narrow rule's rationale with no `/*`, so the whole `#season` block failed to parse, the
caption fell back to the wide rule, and the sill grew 7px while the canvas lost 7 — **law #28
verbatim, one iteration after it was written**, caught only by reading computed style. (2) The
margin I added in order to "print the margin" was `clientWidth - scrollWidth`, **floored at
zero**: `+0px` for a line with 28px to spare, and it can only ever report bad news. A range over
the text is honest. (3) The gate then failed on `touch runs 0` after a
press at 3 s — not a regression: a press starts a 7 s lapse, the town returns six sim days on
with the ticker solid, and the deferred offer waits for a gap (17.4 s on HEAD, 30.1 s here). A
wall-clock arrival for a line queued behind the news is not assertable; that it was never
**spent in silence** is.

**Law:** promoted at pass #33 → LAWS.md, *"when a gate fails, suspect the instrument first"*
(with surprise 2, the floored margin). Full entry in `LEDGER-archive.md`.

---

## Iteration 32 — something is on in the bandstand, and people come and stand for it (2026-08-04) [River & far bank × New element]

**Brief:** b31 — the bandstand has stood on the far bank since before the loop with nothing ever
happening in it, and the east side has no gathering of any kind. Put a concert on in summer.

**Did:** `bandF()` — one 0..1 over set-up/set/strike, `marketRaise()`'s shape — with three
`BAND_PLAYERS` at cues 0.10/0.30/0.50 and bunting at 0.72, so they step up one at a time and pack
away in reverse. Players are plain records handed to `drawPerson()` (which now reads `a.z`), drawn
between the back and front posts inside `drawBandstand()`: the sorted item list can only put them
wholly in front of or behind the structure. The day is `hash(day, 617) < bandChance()` off
`warmth` — no `R()`, so most days pay nothing. Audience: `spawnConcertAgent()`, own source, own
`BAND_TICK` (the shared 1 Hz tick cannot fill nine places in a seven-second window), subtracted
from **both** `eastCount` and `laneCount`, each claiming one of nine `BAND_SLOTS`.

**Gates:** census PASS (people +7, inEast +2 — the audience lands in fields that already exist) ·
visual PASS · perf PASS · motion **FAIL, attributed**: night/shower jumps 1→2 on a kind I did not
touch; over twelve seeds the rises are 0/1/2 on HEAD *and* here and the falls are 0 in both, so it
is two shower onsets, not a broken ending · **`probes/bandstand-year.mjs` PASS ×4** — 18 concert
days at midsummer vs **0** at midwinter over three folded years; peak 7 standing over 14.5 s,
worst single step 43% of peak; min separation while standing **1.68 cells**; 0 teleports · a
filmstrip cropped to the green shows no POP at raise or strike.

**Verdict:** shipped

**Surprise:** the first cut ended the set at 19.2 and every gate was green — the year folded
right, nobody teleported, the separation held. Then the arrival series showed six of nine
listeners leaving in one 0.25 s step. Not my code: `eastOpen()` is `daylight > 0.16`, i.e.
`sunDown - 0.05*dayHours`, and the strike ramp ran straight through it, so the existing rule that
sends the far side home at dusk cleared the green wholesale. Nothing errored, and no still frame
could have shown it. I sized the set against the walk in and forgot to size its *end* against
the light.

**Law:** promoted at pass #33 → LAWS.md, *"an event its audience must WALK to is bounded at both
ends by things that are not the event"*. Full entry in `LEDGER-archive.md`.

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
