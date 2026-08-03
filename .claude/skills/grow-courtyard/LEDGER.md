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

**Keep an entry under ~3.5 KB (≈55 lines).** A worker reads the last **three** entries
in full, every iteration, so entry length is charged to the loop three times over. At
pass #20 the last three had reached 15.3 KB between them and the read budget had been
OVER for four consecutive iterations; the manager condensed them and the full text went
to `LEDGER-archive.md`. If your entry does not fit, the excess is almost always a
**law** (true of the next vector, so it belongs in `LAWS.md`) or a **cue** (belongs in
`state.json`) — not a longer entry. Write the *surprise* at full length and compress
everything else; the surprise is the part that cannot be reconstructed from the diff.

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

## Iteration 16 — five instruments that could not see the year (2026-08-03) [Sky, light & weather × Harness]

**Brief:** b15 — the world has had a 26-day year since #12 and five of the loop's own
instruments cannot see it, or actively confuse it. Repair them; change nothing a viewer
sees. `courtyard.html` is byte-identical at the end of this iteration.

**Did:** five repairs, no new gates and no new metrics.

**(a) `shoot.mjs` pins its instant.** It is no longer a wrapper over screenshot-verify —
it drives Playwright itself with `?pause&t=0` then `__reseed()` + `__warp(t)`, the same
way `census.mjs`, `motion.mjs` and `probes/year-shots.mjs` already did. Framings still
come from the repo's `shoot.config.json`, so there is still one list of them. It prints
the instant it actually reached (`at: simT 175  day 3  hour 10.364  season 0.3724`) and
warns if two framings in one run disagree.

**(b) `--tag` prefixes files.** It used to forward `--prefix` to a screenshot-verify that
has no such flag. Two tagged runs now leave two files: `summer-wide.png` at season 0.5213
and `winter-wide.png` at season 0.0213, **both at hour 7.309**, three distinct sha1s.

**(c) The census age ladder holds the season fixed.** warmth is `0.5 − 0.5·cos(2π·phase)`
and phase is linear in `simT`, so equal warmth means equal phase up to a reflection: only
`p`, `1−p` and `p+1` exist. Anchoring the young cell where it was (warp 90) *forces* the
other two — 625 and 1520. The ladder is now 90 / 625 / 1520 = days 1 / 11 / 27, and all
nine cells measure at **warmth 0.6925** (was 0.693 / 0.996 / **0.138**). `planted` per
seed now rises with age (628 → 699 → 733) instead of collapsing into January. The ladder
string travels with the baseline and in `census-history.jsonl`; a baseline pinned on a
different ladder now refuses to diff (`VERDICT: NO COMPARISON`) rather than printing a
large fake regression.

**(d) `motion.mjs` reports a `raindrop` kind.** Raindrops are screen-space and not in
`__entities()`, and the town was off-limits, so the shower is watched as a *population*:
`__census().life.raindrops` at every step, rises → `spawns`, falls → `despawns`. Rain
turned out to be in 3 of the 4 existing scenes already, so no scene was added.

**(e) `stall.mjs` runs on worker rows only.** `rows` is now `kind !== 'manager'`;
`managers` is reported separately. `build-stats.mjs` did **not** need this — it has
filtered since it was written (its two whole-run totals are deliberate and labelled).

**Gates:** census PASS · motion PASS · visual PASS · perf skipped (town untouched) ·
probe `probe-shoot-jitter.mjs` (scratch, not kept)

Two runs of the new `census.mjs` on the same commit diff **unchanged in every group**. Two
runs of `shoot.mjs --t 175` land on `simT 175.00 / hour 10.364 / season 0.3724`, twice.
`stall.mjs`'s last-10 goes 10m → 8m and $2.30 → $2.01 when a worker row is removed, and
does not move at all when a manager row is added.

**Surprise:** three.

**The old `shoot.mjs` was not jittering, it was biased — by eight hours of town clock.**
The brief and cue c31 both said "jitters ~15 s". Measured over five runs each: the jitter
is real but small (0.14 s of sim idle, 0.91 s under six busy cores — the latter being
24 sim minutes, so the cue was not wrong about load). The *large* error is systematic.
Asking for `--t 175` reliably photographed **simT 193.5, hour 18.47** — evening — while
the file's own comment said "day 3, mid-morning". `?fast` is 8×, the wait was 2600 ms,
and 8 × 2.6 s ≈ 18.5 s of sim every single run. A wall-clock wait does not blur the
instant so much as move it, and the same offset on every run is exactly what nobody
notices. The framing now reads "Day 4 · Morning", which is what it always claimed to be.

**`spawns`/`despawns` would have been a decorative gate.** They are the integral of the
rises and the falls, so a shower that vanishes in one frame has the *same* totals as one
that tapers over three seconds — the totals cannot see the bug #15 exists to have fixed.
So the shape went into the existing `jumps` field, on the entity rule's own principle: a
step out of all proportion to how this thing normally moves, here bigger than half the
shower's own peak. Verified by rebuilding #15's one-frame ending in a scratch copy and
running the gate at it: `day/raindrop: jumps 1 → 3`, with `raindrops stepped -110 in one
0.25s step` named in the examples. On HEAD every jump is a `+110` *start* and there is
not one `-110` in any scene — rain begins abruptly by design and now ends measurably.

**One fifth of the brief was already done.** `build-stats.mjs` has filtered manager rows
since it was written. Worth stating because the same brief's claim about `stall.mjs` was
not just true but worse than stated: on the *real* runlog the old code reported
`last: #15 … -> no-ship` — that was the manager pass wearing the worker's #15 — and
last-10 as 12m / $3.09 / src moved 7/10 against the true 10m / $2.30 / 9/10. Cost
overstated 34%. And two manager passes in a row (a re-plan, or a plan after a rejected
brief) fired `noShipStreak,srcFlat` on the old code: **the stall detector could summon a
manager off nothing but its own footprints.** New code: `ok` on the same input.

**Law:** An instrument that reaches a moment by waiting in wall time does not blur that
moment, it *moves* it — by the same amount every run, which is why nobody catches it.
Measure the offset, not the spread. And make the instrument print the instant it actually
reached: a harness that reports where it landed cannot lie about where it aimed.

**Law:** A churn total is shape-blind. Counting arrivals and departures cannot distinguish
a population that drains smoothly from one that is deleted, because both have the same
integral — if the *shape* is the thing that broke, the gate needs a per-step limit, not a
sum. Then prove the gate bites by rebuilding the old bug in a scratch copy and pointing
the gate at it; a gate never seen to fail is a gate nobody has tested.

**Law:** A row a subsystem writes about itself is not evidence about the thing it watches.
The manager's own runlog row is `no-ship`, `srcChanged: false` by construction, so any
streak or average taken over all rows counts the observer's footprints as the observation
— and here it could trip the very alarm that summons the observer.

**Cue:** the census ladder still varies the *hour* across the age axis (21.27 / 14.73 /
21.27), so anything gated on time of day is sampled unevenly. The algebra is tighter than
it looks: fixing hour *and* season needs `t ≡ 0 or 27.5 (mod 55)`, which admits exactly
two hours — **06:00 and 18:00**. Both are awkward (dawn has almost nobody out, 18:00 sits
inside market pack-down and the six o'clock bell), so this is a real trade, not an
oversight. Do not re-derive it.

**Cue:** per-*drop* continuity still does not exist. `raindrops` are screen-space and
absent from `__entities()`; adding them needs one line in `courtyard.html` plus a
screen-space exemption from `motion.mjs`'s world-bounds test. Only then would a drop that
goes NaN or strobes be visible.

**Cue:** the ladder change is a step in the published growth curve. `census-history.jsonl`
now carries a `ladder` field so the discontinuity is legible, but `stats.html` plots
`RUNLOG.jsonl`'s census scalars and knows nothing about it — `planted` jumps 4782 → 6109
between #15 and #16 with no town change behind it.

**Note:** `context-budget.mjs` read **OVER** at 46.7 KB against the 46 KB cap when this
iteration started, and still does (LEDGER.md 14.5 KB, state.json 8.4 KB, laws 27/60).
Third iteration running over.

## Iteration 17 — thirteen trees learn the year (2026-08-03) [Cross street & allotments × Deepen]

**Brief:** b16 — the town has a year and thirteen trees that have never heard of it.
Make the canopies read `warmth`; put the leaf fall on the season.

**Did:** Eight terms next to `growF`/`dieF`/`bloomCap`, and one colour rule. They read
`seasonPhase`, **not `warmth` alone**, because warmth 0.5 happens twice and a rising 0.5
(bud burst) and a falling 0.5 (the turn) are the two most different-looking days of the
year — `warmth` cannot tell them apart and every seasonal reader after this one will hit
the same wall. `leafOut` is canopy coverage; `leafFresh`/`leafDeep`/`leafTurn` are the
tints; `leafShed` drives `leafFallF`; `blossomF`/`fruitF` are the orchard. `leafCol(base,
k)` is the one colour rule all thirteen trees go through, keyed per blob so a turning
tree is patchy rather than uniformly orange.

The canopy is **six clamps on one 0..1 progress**, exactly as the market stalls are — the
mass fills first, the outermost blobs last, and running `leafOut` backwards through
autumn sheds them in reverse for free. Each blob's radius grows from *zero* at its own
threshold, so nothing appears at a size. `drawBoughs()` draws what is left: tapered,
slightly curved boughs forking two twigs at 62%, faded out entirely at `leafOut` 1 so the
summer tree is untouched.

The `leaves` spawner keeps its exact `R()` draw count (one rate roll, one `src`, six per
leaf) — only the thresholds moved, so nothing was added to the stream on purpose. The
gust now *multiplies* the seasonal rate instead of overriding it, so a January gale off
bare branches sheds nothing. Falling leaves take their colour from `leafCol` too, so a
leaf is the colour of the tree it fell off.

Every term is written so that at `SEASON_START` (phase 0.25) it is **exactly** the
constant it replaced — `leafOut` 1, all three tints 0, `leafFallF` 1, and `leafCol`
returning the literal old hexes. `fruitF` is the one deliberate exception: apples in
April were the bug, not the baseline.

**Gates:** census **PASS** (`planted` −0.6%, `blooming` −0.8% — PRNG reshuffle, no
collapse) · visual PASS · motion **FAIL**, attributable (below) · filmstrip PASS (no POP,
no FROZEN) · perf **PASS** (+0.0% vs interleaved control) · `probes/canopy-year.mjs`
PASS 5/5

The motion failure is `market/raindrop jumps 0 -> 1`, a system I did not touch. Tallied
across all four scenes the shower budget is **exactly conserved** — jumps 4 → 4, drop
spawns 440 → 440; one shower moved out of `dusk` and into `market` because the changed
leaf-spawn count shifted the PRNG stream. `leaf`, the kind I actually changed, is clean
everywhere: 0 jumps, 0 nan, 0 oob, 0 flicker. I did not touch the gate.

`probes/canopy-year.mjs` measures what the census cannot: winter canopy is **0 px across
all thirteen trees** against summer's 9674; autumn amber 2306 vs summer 49; the orchard
carries 723 px of blossom in spring; airborne leaves run autumn 7.83 / spring 3.14 /
summer 0.27 / winter 0. `probes/year-strip.mjs` is the region-cropped year the brief
asked for — 26 crops of the linden, one per day, same hour.

**Surprise:** three, all from measuring.

A tree-cropped *box* cannot see this at all. The linden stands against lawn and the
orchard against the allotments, so the box floors at ~2500 green px of ground in every
season and reported winter as **57% as green as summer** — a clean-looking number that
was entirely the grass behind the tree. Rendering the frame twice, once with
`leafOut`/`blossomF`/`fruitF` monkeypatched to 0, and counting the pixels that *differ*
gives the canopy exactly, whatever is behind it. `?pause` sets `dt = 0`, which freezes
`windT` and the sway, so the two renders differ in nothing else.

Then that measurement blamed my own change on the wrong thing. It scored the orchard at
1070 px of "green canopy" in peak autumn — four trees that were fully turned. Two causes,
both mine: the loose classifier `r>g+8 && r>b+30 && r>95` scores the **stone tree pit**
(107,90,68) as autumn colour, and the pit is inside the diff because I had made the
ground shadow scale with `leafOut`. Cutting the box at the trunk top took it 1070 → 228
with amber unchanged at 306. Both were probe defects; neither was visible in any
screenshot.

And the first bare linden looked like a spider — five uniform strokes from one point.
A bare tree is most of the winter frame and it has to read as a *crown*: taper, curve,
and fork it and the same five boughs read as a tree.

**Law:** A cyclic world scalar is not enough to hang a seasonal look on — you need the
**phase**, because a cosine visits every value twice and the two visits are the two
things you most need to tell apart (bud burst vs. the turn). Write each term as a window
closed on *both* sides of the phase so only one or two are ever live at once, anchor them
so the start phase reduces exactly to the constant being replaced, and state the one
term you deliberately left un-neutral and why.

**Law:** To measure a draw-only feature, do not crop a box around it — render the frame
twice with the feature suppressed and count the pixels that changed. A box measures the
background, and the background is the thing that looks most like what you are counting.
`?pause` gives dt=0, so the two renders are otherwise identical. Then check what *else*
your change made season-dependent: my ground shadow put itself in the diff.

**Cue:** `maturity()` still sizes all thirteen trees off a ramp that pins at day 8, so a
tree is the same size in its first winter as in its fifth. Deliberately untouched — the
brief said a tree that grows and shrinks every 24 real minutes reads as a bug — but if a
slow multi-year growth term is ever wanted, `leafOut` is now the seam that proves a size
change is seasonal rather than a glitch.

**Cue:** the context budget printed **OVER** at the start of this iteration — 48.8 KB
against a 46 KB cap (LEDGER 15.9, SKILL 11.8, LAWS 9.4, state 9.4). This entry makes it
worse. The manager should distil this pass.

## Iteration 18 — the working day goes on the sun (2026-08-04) [Lane & market × Connect]

**Brief:** b17 — #11 moved sunrise and sunset across the year and nothing anybody DOES
followed. Put the working day on the sun, keeping each interval's relation to sunrise
and sunset rather than its number.

**Did:** every hour anybody works is now an offset from `sunUp`/`sunDown`, each chosen so
that at `SEASON_START` it reduces *exactly* to the constant it replaced. `kioskOpen()`
7.50–18.50 → `sunUp+2 .. sunDown-1.5`. `marketActive()` 8–17 → new one-definition
accessors `marketOpen()`/`marketClose()`, because three things read those ends — the
predicate, `marketRaise()`, and the pack-away line in `simStep()`. Sweeper 5.00–6.50 →
`sunUp-0.5 .. sunUp+1`. Wind announcement 7–9 → `sunUp+1.5 .. +3.5`. Two clamps, both
stated in the source: `MK_MIN_SPAN = 7`, because a pure offset hands midwinter a
six-hour market and that is a different feature; and `MK_EARLIEST = 7.2`, see **Surprise**.

**Gates:** census FAIL (attributable) · visual PASS (4 framings + a HEAD-beside-HERE pair
at two pinned instants) · motion PASS · filmstrip PASS · perf skipped ·
`probes/working-day.mjs` **34/34**. The probe is the gate that matters, because the census
cannot see a predicate: across four market days round the year every boundary holds its
offset from the sun at the moment of the flip (kiosk open `sunUp+2.02..2.05`) while the
clock times themselves move 2.2–2.9 h, and at `simT 0` all ten land on the old constant to
1e-9. The census FAIL is the PRNG reshuffle — `probes/census-noise.mjs` shows HEAD's own
9-cell total spans 8% on identical code just by changing seeds.

**Verdict:** shipped

**Surprise:** the sim day's rollover is a hidden tuning constant and it nearly ate the
feature. `hour` runs 6.00 → 6.00 and `day` rolls with it, so everything before 6.00 belongs
to the *previous* day's tail, where `isMarketDay()` is false. Stalls go up at
`marketOpen() - 1.10`; a midsummer opening at 6.50 puts that at 5.40, `marketRaise()`
returns 0 through the whole raise, and three near-finished stalls land in a single frame at
the rollover — exactly the pop `marketRaise()` was built to prevent, reintroduced by a
change that never touched it. The original source had already encoded this and I read past
it: the comment said the raise starts at "6.90", one decimal place from the boundary, and
did not say why that mattered. Second surprise, cheaper: my first neutrality assertion
failed and the code was right — I scanned day 26 rather than evaluating at the anchor
phase, and a day is 1/26 of this world's year, enough drift to fail a tolerance.

**Laws:** promoted — see the anchor law and the discontinuity law in `LAWS.md`.

**Cue:** the sweeper still starts half an hour before sunrise, where `daylight` is exactly
0. That is deliberate — "before the town wakes" is the point of him — but it is the seam
for anyone who later wants civil twilight as a real quantity rather than a clamped sine.

## Iteration 19 — the year is felt in how busy the town is (2026-08-04) [People & animals × Deepen]

**Brief:** b18 — a 52% swing in mean daylight was coming out as a ~15% swing in people.
Widen the breathing, let the three arrival sources breathe by different amounts, and hold
an absolute floor.

**Did:** *The compression.* `capacity`, `laneCap` and `eastCap` were each `k + span*(f +
(1-f)*d)`. Multiplied out, `k + span*f` is the share the sun never touches — 5 of the
courtyard's 14, 3 of the lane's 9 — and averaged over a day that fixed share is most of the
budget. Peak daylight is also 1.0 in *every* season by design (duration is the seasonal
lever, never midday brightness), so the honest swing available is bounded by the day-length
ratio, 17.5/11.5 = 1.52. So the year went onto the *varying* term as a multiplier and the
fixed term was left exactly alone. `yearBusy(ex)` is read off `daySpan()` rather than off
`warmth` — the same number, honest provenance, since what makes a July evening busy is that
it is still light. `ex` is exposure: `EX_COURT` 0.5 (walled), `EX_LANE` 1.0 (open),
`EX_EAST` 1.25 (you go out to it, across a bridge). `YEAR_SWING` 0.40. `eastCap` keeps
`Math.min(7, …)` because c10 says east agents retrace their inbound route and would queue
above seven, so summer spends its lift on reaching the ceiling *earlier in the day*.
*The rail.* `POP_FLOOR` 8 with `scarcity = 1 + 0.8 * clamp(POP_FLOOR - agents.length, 0,
6)`, multiplying the three arrival rates only — never the caps. Nobody pops into being.

**Gates:** census PASS (people 167→190) · visual PASS (`probes/year-shots.mjs`, five pinned
instants on HEAD and here: summer noon 23→28, winter noon 25→21, winter dusk 27→17; winter
night still legible) · motion: the only kind that moved is `raindrop` — the shower changed
scene under the reshuffle, and HEAD's own baseline records the same distribution;
**`walker`, the kind this iteration actually moved, is 0 jumps / 0 nan / 0 oob / 0 flicker
in all four scenes** · filmstrip clean, median Δ 0.410 · perf skipped · anchor assertion:
`yearBusy` is **exactly 1.0000** for all three exposures at `SEASON_START` and again one
full year on, so day one is provably the town as it was.

**Probe:** `probes/season-year.mjs` extended — 3 seeds × 60 sim days (~2.3 years) folded
onto one year, carrying `inCourtyard`, `onStreet - inEast` and `inEast` separately.
Summer:winter ratio — total 1.09 → **1.56**, courtyard 1.05 → 1.26, lane 1.04 → **1.94**,
east 1.40 → **2.10**. Settled mean 21.65 → 21.48: the year *redistributes* the town rather
than inflating it. Absolute floor across all 3,600 samples: 8 → **8**, equal to HEAD.

**Verdict:** shipped

**Surprise:** holding every night-time cap identical did not hold the night. The first build
left `capacity` and `laneCap` at `daylight` 0 byte-identical to HEAD in every season — and
the worst sample still fell from 8 people to 5. Most of a 03.00 population is not spawned at
03.00; it is daytime walkers still finishing forty-second trips, so an emptier winter
afternoon arrives at midnight as an emptier town, several sim hours later, through a term
nobody edited. That is also why the rail had to lift the *rate* rather than the cap: the
caps at night already permitted 5 + 3 = 8, and what was missing was arrivals to fill them.
The first rail (~1.25× at seven people) was too gentle and only reached 7.

**Laws:** promoted — see the cap/trip-length law and the flat-peak law in `LAWS.md`.

**Cue:** `scarcity` also fires in the first sim minute, when the town is legitimately empty,
so the opening fill is hurried compared with HEAD (day 4 mid-morning: 13 → 18 people).
`maturity()` still bounds it, but the very first minute is now a servo rather than a ramp.

## Iteration 20 — the paving learns which paving it is (2026-08-04) [Plaza & quay × Polish]

**Brief:** b19 — the click handler's `SIDE || ROAD` branch answers "You scatter crumbs onto
the lane" for the paving of five different quarters, and clamps its birds into
`LN_WALK_N..LN_WALK_S` so they land in the lane however far east you clicked.

**Did:** one table, `PAVING`, with six entries — `lane`, `bridge`, `cross`, `plaza`, `quay`,
`towpath` — each carrying its line *and* the box its crumbs' birds may land in, plus the
spread along each axis. `pavingAt(x, y)` is the single predicate that places a cell; it is
called only on a cell `answersTouch()` has already called SIDE or ROAD. The bridge deck is a
sixth place the brief did not name, found by walking the grid. No seventh KIND: still one
branch, still crumbs, still `birds.length < 4` and `daylight > 0.2`, still 3 birds and the
same two `R()` draws each. Bird placement moved out to `crumbSpot(p, x, y, k)`.

**Gates:** census PASS (scalars/tiles/life/structure/species all *unchanged* — a click
handler moves nothing the census watches, which is the point) · visual PASS (`east` and
`lane` byte-identical to pre-edit; `wide` differs but is **not reproducible run-to-run on
unmodified HEAD either**, so that diff is the harness) · motion PASS · perf skipped ·
**probe PASS** `probes/paving-places.mjs`.

**Verdict:** shipped

**Surprise:** the probe found two defects the brief did not contain, and I would have
shipped both. (1) The cross street and the quay run from **y = 0**, not y = 3 as I had
guessed from the towpath's `y < 3 ? WALL : SIDE`; 6+ cells were being named for a box they
sat outside. (2) Sampling three birds independently inside one small box put two of them
within 0.9 cells — the "renders as one shape" law — in **4 of 8** click cases, *including
the old lane behaviour*. So the pre-existing code had a second bug hiding under the one I
was sent to fix, and only a numeric check saw it. Staggering the three at fixed thirds of
the long axis with a ±s/12 jitter floors the gap at s/3.

**Law:** promoted — see the scatter law in `LAWS.md`.

**Cue:** the plaza's actual paving is `PATH`, and `answersTouch()` does not answer PATH — so
the plaza roundel around the fountain, and the whole courtyard path ring, are dead to the
cursor and to the click. `PAVING.plaza` only ever fires on the plaza's 6×4-cell **mouth**
onto the lane (24 cells of the world's 2903 paved ones).
