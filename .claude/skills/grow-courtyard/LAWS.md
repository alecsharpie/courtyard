# Laws the loop derived

Read in full by **every** worker iteration — which is what makes a law worth having
and what makes it expensive. Capped at 60 laws / 12 KB; **bytes bind, not count**. A
law belongs here only if it will be true of the **next** vector too; anything true
only of what you just built goes in `LEDGER.md`, archived and never read again.

## Inherited — paid for by the previous loop (Solvista, 369 iters)

- **Read the seam, not the file.** `courtyard.html` is ~4,500 lines; reading it whole
  burns a third of a fresh context. `grep -n` the symbol, then `Read` with `offset`.
- **The ledger is not the inventory.** The town predates the loop. Check
  `state.json`'s inventory *and* grep the source before adding anything — the previous
  loop nearly shipped beach towels onto a beach that already had them.
- **Locate and probe before you judge.** Find *where* a thing is drawn before deciding
  why it looks wrong — half of "this looks bad" is "this is drawn in the wrong pass" —
  then measure. Three agents once named three wrong causes for one bug that a
  twenty-line probe found on its first run.
- **Compare against a control you ran, not against a memory.** Frame time swings ±30%
  with load, so interleave the control in the same session. Pixels are worse: when a
  vector rides a scalar that already recolours everything (cover, season, daylight),
  no statistic of the frame is yours. Render the same pinned instant in *both* builds
  at the same value of that scalar, difference those, and get the noise floor the same
  way (ref against itself, two loads). Same for a red gate: **a gate that fails on
  unmodified HEAD is not a gate** — stash and run before attributing it. (#22, #24)
- **A screenshot cannot see motion.** Teleports, pop-in, flicker and draw-order
  strobing survive any number of stills. Use `motion.mjs` and `filmstrip.mjs` when your
  change touches anything that moves or is drawn per frame.
- **One predicate, one definition — and read a footprint back off the grid, never
  re-derive it.** Two places deciding the same thing (is it market day, is it raining,
  does this cell answer a click) will drift. A *geometric* test drifts worst: a second
  evaluation of the same ellipse disagreed with `buildGrid()`'s by 2e-16, which is a
  whole cell, and put 22 birds in the fountain basin. (#24)
- **The census is a regression guard, not a growth score.** `+0` everywhere after a
  draw-only iteration is expected. Its fields are town state, never render state (a
  per-frame accumulator is not reproducible); add one only when a system moves nothing
  the hook reports, or you are grading your own homework.

## This town

- **Every random draw goes through `R()`** (or `hash(x,y)` per-cell). A bare
  `Math.random()` is invisible to `?seed=` and silently breaks the census.
- **Two renderer traps.** `project()` pinches on *screen* depth, not world depth —
  reverting that reintroduces a black seam beside every wall. And roofs are emergent:
  `buildVolumes()` lifts each roof vertex by its distance to the block edge, so change
  the footprint, never the roof.
- **Any new `R()` draw reshuffles the whole seeded world** — the census churns
  everywhere, a motion gate fires on a kind you never touched, a shower lands on a
  different frame. Read a census diff for *collapse*, not delta. When a gate fires on
  something you did not build, measure that system's distribution on HEAD first, and if
  it was already on a threshold, move the system rather than the threshold. **A
  population count in a continuity gate is sample-sensitive and two seeds is not a
  sample** — replay over ten (`probes/shower-jump-spread.mjs`): the row that fired 2→4
  ranges 0..2 on HEAD. (#2, #4, #5, #23)
- **Time-compress everything you build.** A day is 55 s, so "every third hour" is every
  ~7 s: an effect over ~2 s becomes state instead of an event, and a round trip over
  ~40 s leaves its walker permanently present whatever cap spawned it. Caps set inflow,
  trip length sets standing population — so **a cap floor is not a population floor**:
  a budget cut anywhere in the day resurfaces hours later through walkers still
  finishing trips, in a term nobody edited. Floor the arrival *rate*. And on a channel
  holding exactly ONE object a rate change cannot show a season at all — occupancy
  bounds arrivals above, the floor that stops it vanishing bounds them below — so
  measure **presence**: the boat is 72% of summer against 32% of winter at a flat
  0.28/day. (#2, #5, #19, #23)
- **A slow world scalar wants a cap, a cycle and an anchor.** Rate-cap it, so "it never
  steps" is one measurable number. Prefer a cosine of a phase to a ramp — a ramp is an
  act that ends (`maturity()`, `richness()` pinned the town at 1 by real minute 15)
  while a cycle is continuous through its wrap. Every term it replaces must reduce
  *exactly* to the old constant at the anchor, bought in the **algebra** not the
  tuning: `x * f()` and `x - k*(1 - f())` are exact, while `x * (a + b*f())` makes
  `a + b` 0.32000000000000006 and turns your identity into a tolerance you must
  defend. Prove it *as* an identity — multipliers reading out of the page as exactly
  1, a cached layer byte-identical to the ref — and assert it at the anchor phase,
  never by scanning a day that sits on it. Where a consumer has a fixed share plus a
  varying one, put the scalar on the **varying** term only: the fixed term is then the
  floor by construction, and a deliberately flat peak caps your range (daylight is 1.0
  at noon in every season, so all it offers is the 17.5/11.5 duration ratio).
  (#3, #12, #14, #18, #19, #22)
- **A slow thing's season is not the season it is in.** Anything carrying state across
  a phase boundary — a rate-capped scalar, or an *object* whose trip is an appreciable
  fraction of the cycle — drags the previous quarter with it, so the phases either side
  of the anchor come out **unequal from code that is symmetric by construction** —
  spring inherits winter's lid, autumn a river with summer's boat still on it.
  Hysteresis, not an algebra bug: check the shoulder **pair** averages to the anchor
  rather than expecting each to. (#21, #23)
- **Making a state last longer is not the inverse of making it rarer.** A slew-limited
  scalar reaches further the longer it holds, so a symmetric ±x% on *duration* is a net
  increase in time at the extreme: a change reasoned to cut rain delivered +38%. Budget
  the annual total before tuning the contrast, on a folded multi-year probe — one year
  of a stochastic system is a sample. (#21)
- **When you turn a constant into a variable, hunt what was tuned against it — and find
  the discontinuity it now lives inside.** The rest of the file keeps reading its own
  hard-coded number and the two disagree in a way nothing errors on. Worse, the old
  constant was also *clear of* something: this world's day rolls at `hour 6.00`, so a
  window a variable drags across that seam evaluates against the previous day and its
  `day`-derived predicates go false mid-window. Not an error — a pop. Grep for what the
  constant was clear of, not only what read it. (#12, #18)
- **A ceiling is not a kill term.** If a system already ages out whatever sits at its
  ceiling, lowering the ceiling empties it by itself; a removal term on top
  double-counts and reads as a cull. Give any global scalar that can approach zero
  per-cell variance (`hash(x, y+k) > c`) or it reads as a switch — ~1/7 of beds held at
  the full ceiling is what makes winter a scatter of blooms in turned earth. But **match
  the grain of the variance to the grain the region is ADDRESSED by**: that per-CELL
  seventh is 2e-4 across a six-cell plot, so the rule was silently a no-op in the
  allotments, which are read per-PLOT. An inherited rule inherits the new region's
  grain, not its own meaning. (#14, #25)
- **Two figures nearer than ~0.9 cells render as one shape**, so a queue, a bench, a
  haggle, a conversation must hold people apart to read at all — and **fit a scatter by
  moving its centre, not by clamping its members.** Clamping N placements into a box
  independently collapses a deliberate spread into a heap at the box's edge, exactly
  where the code looks most careful. Fit the centre, then place relative to it.
  (#4, #20)
- **A feature that exists may exist at a rate of zero — count before you build on it,
  and advertise it or nobody finds it.** A spawn band is a *share of a budget*, not a
  rate: `spawnLaneAgent` fires ~3.3×/day, so a 4% band is one person per twelve days;
  if it fires rarely, give it its own arrival source rather than widening a band. Same
  law one level up is discovery — the diorama answered six kinds of click for
  thirty-one iterations and nothing said so. One predicate for both cursor and handler;
  the invitation offered once ever, in **real** seconds (a reading speed, `?fast` must
  not hurry it), cancelled if the viewer finds it first, stood down on `?pause`.
  (#7, #9, #13; paid for 3×)
- **A per-agent trait must be a field written only at spawn.** `a.timer`, `a.greet`,
  `a.chatCool`, `a.watch`, `a.phase` all count down — read one as a stable personal
  threshold and it cycles the band several times a second: a flicker that looks like a
  stagger. Give the trait its own field (`a.wary`), then predict the fraction that
  should react and count the fraction that did. (#6)
- **Stage an appearance as N clamps on one 0..1 progress**, never as timed steps — run
  the progress backwards and it packs away in reverse for free. Keep each crossfade
  window no wider than the lowest threshold it fades in from, or the first item sits
  permanently translucent at rest. (#6, #8)
- **Split a flag that gates both behaviour and drawing.** Keep the boolean for
  behaviour, add a 0..1 intensity beside it that every draw site multiplies by. End a
  population by not sending new members round again, not by deleting what is on screen.
  Fade the **largest** thing first: a full-canvas tint outweighs any number of sprites
  in a whole-frame Δ. (#15)
- **A probe's world is only as rewound as you make it.** `__reseed()` rewinds the PRNG
  and `__setTime()` the clock; *neither* rewinds module-level latches
  (`marketAnnounced`, `bellSeen`, `lastStruck`) or the agents already spawned. Reseed
  before measuring, step inside ONE `page.evaluate` (the page keeps running between
  host round-trips), take a fresh page each time. Skip any of the three and the probe
  doesn't error — it reports a different plausible number every run. And **`ls
  .claude/skills/grow-courtyard/probes/` before writing one** — it is part of the seam,
  not the read budget, and is where yours goes. (#3, #6, #7, #8, #9)
- **Pin the instant, don't wait for it.** A fixed wall-clock wait jitters by many sim
  minutes — two "same" shots once came back a day apart. Drive with `?pause` +
  `__warp(t)`. An instant is a *phase as well as an hour*: hold **both** fixed across
  any axis you vary or the axis measures the season. Pinning both needs `t = 0` or
  `27.5` (mod 55), the only two hours that exist — a known, priced trade, do not
  re-derive it. Consequence, both ways: **the census ladder samples ONE warmth** (all
  three warps land at 0.693, `bloomCap` 3), so anything acting only away from the
  anchor is invisible to it by construction — which also makes it a clean attribution
  tool, since with the phase pinned any diff left is the reshuffle. (#9, #14, #16, #25)
- **`filmstrip.mjs`'s Δ is a whole-frame mean** — blind under ~2% of the canvas, loud
  about anything global. Crop to your feature (`probes/market-raise.mjs`). When it POPs,
  reproduce its exact world first (it seeds `?t=0` then `__warp(t)`, which is not what
  `?t=<t>` gives you), then localise region-wise: a jump in every cell is weather or
  light, not your draw order. (#8, #9)
- **A CA rule that makes a region coherent makes it monotonous.** Check what
  neighbourhood inheritance does to *variety* over many cycles, not just the one in
  front of you — plot-coherent re-sowing was right and quietly lost two of the four
  vegetables. Something has to reset it. (#7)
