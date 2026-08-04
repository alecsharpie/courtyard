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

## Iteration 26 — the sill names the season (2026-08-04) [Sky, light & weather × Interaction/UX]

**Brief:** b25 — nine systems read `season()` and the sill never said which season it was.
Name it, in the diorama's own register, without a second row.

**Did:** `seasonLabel()` beside `timeLabel()` — same idea one scale up, the hour off the
sun and the quarter off the phase. Eight names on `seasonPhase` (never `warmth`: 0.5 is
both bud burst and the turn), sectors of 1/8 **centred** on their phase rather than
starting at it, so midwinter straddles the wrap as one continuous name and `Spring` lands
exactly on `SEASON_START`. Winter and summer get an early/mid/late apiece because a cosine
dwells at its extremes; spring and autumn are the crossings and get one name each. New
`#season` in the sill, serif, written by `refreshStats()`. `probes/sill-year.mjs`.

**Gates:** census **PASS — every field unchanged in all 9 cells**, which is the real
assertion here: no new `R()` draw, so a DOM-only vector must reshuffle *nothing*, and for
once a `+0` census is a positive result rather than a blind one · visual PASS (wide +
mobile at early summer and at midwinter: "Midwinter · Day 20 · Dusk" over a bare, dark,
24-bloom town against "Early summer · Day 4 · Morning" over 464) · `probes/sill-year.mjs`
**41/41** across six widths · motion skipped — nothing drawn or moving was touched.

**Verdict:** shipped

**Surprise:** the screenshot caught what the probe swore was fine. My first fit gate read
`sill.scrollWidth - clientWidth` and passed at 390px; the mobile PNG showed
"Early summer" printed straight through "Day 4". Every sill item is `white-space:nowrap`
with default `flex-shrink:1`, so a squeezed item reports a **box that fits** while its
glyphs run out over its neighbour — container overflow is exactly 0 and the layout is
broken. `flex:none` on all of them made the number honest (0 → 26px over), and the gate
had to compare *text extents* between row-mates, exempting `#ticker` as the one item that
truncates by design. Second surprise: the fix wanted 80px the narrow row didn't have, and
the answer was not smaller type — `#plate` already has a caption slot that is
`display:none` on a phone, so below 640px the season moves **into** the plate and sits
under the title for zero horizontal cost, which is also the truest museum-label form.
Third: adding a sixth item exposed a band nobody had looked at. At 641px HEAD already gave
`#ticker` 71px of box; the season would have overflowed it outright. `#stats` now yields
below 860px, so that band gains a season *and* a ticker that reads better than before
(100px at 641, 222px at 768, against HEAD's 71 and 193).

**Law:** a flex row of `nowrap` items has two different fit questions and the container
answers only one — see `LAWS.md`.

**Cue:** the sill overflows at 320px on HEAD too (44px, pre-existing); 390 is the tracked
framing so I gated there and left it.

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
22.00–04.00 against **1.26** at midday, all of it the 3–6 s glance through the arch in the final
`else`. A lit door at `TAP_DOOR = 26`, on the plane `drawFaceRow` already puts the terrace's own
doors on, drawn **every** frame (a doorway that appears at half six is a pop): `tapOpen()` the
behaviour, `tapF()` the 0..1 every draw mixes on. Its hours are the one clock here that is not the
sun's — open `sunDown - 3` floored at `TAP_EARLIEST`, shut by the CLOCK at 03.00 — so
**midwinter's evening is its longest**, 10.5 h against midsummer's 8.5. `spawnTapAgent()` takes
its own budget (four `TAP_SLOTS`, min gap 1.23), comes off `laneCount`, does **not** read
`scarcity()`, and walks out of the courtyard's south arch eight cells away.

**Gates:** census PASS (people +15, onStreet +13 — two ladder cells sit at 21.27) · visual PASS
(`tap-shots.mjs`) · perf PASS (+0.0%) · motion **FAIL, attributed**: `market/shower` 0→2 on
untouched code, and `shower-jump-spread.mjs` over ten seeds gives HEAD 0..2 mean 0.40 against 0..3
mean 0.50 here · **`evening-door.mjs`**: night STILL **0.21 → 0.98**, 17% → **77%** of midday; at
the door 0.00 at 10h/12h/14h and 2.50 at 22h; longest life there **23.5 s** of a 40 s limit; **0**
standing after the shut, latest 26.92 of 27.00 · **`day-control.mjs`**: `tap 0` at both midday
instants on HEAD and here. Context budget opened OK and closes **OVER** (47.1 / 46 KB).

**Verdict:** shipped

**Surprise:** the address was decided by arithmetic, not taste, and it took three false starts to
see it. A sim hour is 2.3 s, so a midsummer night is 22 s of screen time, and the brief's own test
("stopped at 22.00 in midsummer") is only satisfiable if the walk is about 3 s. Our own doorway at
x=33.9 — which `drawOurSide` has drawn since before the loop and nothing has ever used — is 15
cells across the lane: 6.8 s each way, first arrival 23.6, round trip 92% of the window. It had to
move to the near side of the road for a reason with nothing to do with how it looks. Second:
`tap-shots.mjs` photographed 190 px of the frame's left border twice, because `project()` is
relative to the canvas **parent**. Full entry in `LEDGER-archive.md`.

**Law:** the evening is bounded by ARITHMETIC before taste — at 2.3 s to the sim hour, where a new
place can stand is set by how far its people must walk to it, and a 15-cell trip is already 92%
of a midsummer night. Price the walk before choosing the address.
