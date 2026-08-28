# Laws the loop derived

Read in full by **every** worker iteration. A law belongs here only if it will be true
of the **next** vector too; anything true only of what you just built goes in
`LEDGER.md`. One number per law, not three. Cap 60 laws / 12 KB / 900 B each.

## Inherited — paid for by the previous loop (Solvista, 369 iters)

- **The ledger is not the inventory.** The town predates the loop. Check `state.json`'s
  inventory *and* grep the source before adding anything.
- **Locate before you judge, then compare against a control you ran, not a memory.**
  Half of "this looks bad" is "drawn in the wrong pass". Frame time swings ±30%, so
  interleave the control; when a vector rides a scalar that recolours everything, render
  the same pinned instant in *both* builds at the same value of it. **A gate that fails
  on unmodified HEAD is not a gate**, and a control that returns the candidate's exact
  numbers is not a control (`filmstrip.mjs` takes no `--page`). (#22, #24, #45)
- **One predicate, one definition — and read a footprint back off the grid, never
  re-derive it.** A second evaluation of the same ellipse disagreed with `buildGrid()`'s
  by 2e-16 — a whole cell — and put 22 birds in the fountain basin. The OPENING state
  counts too: `seed()` must sow by the predicate the running rule uses. (#24, #41)
- **The census is a regression guard, not a growth score.** `+0` after a draw-only
  iteration is expected. Its fields are town state, never render state.

## This town

- **Every random draw goes through `R()`** (or `hash(x,y)` per-cell). A bare
  `Math.random()` is invisible to `?seed=` and breaks the census.
- **Two renderer traps.** `project()` pinches on *screen* depth (revert it and a black
  seam returns beside every wall); roofs are emergent from `buildVolumes()`, so change a
  footprint, never a roof.
- **Any new `R()` draw reshuffles the whole seeded world** — the census churns
  everywhere, a motion gate fires on a kind you never touched. Read a census diff for
  *collapse*, not delta; when a gate fires on something you did not build, measure it on
  HEAD first and if it was already on a threshold move the system, not the threshold.
  **Two seeds is not a sample** — replay a population gate over ten. Preserving the R()
  *count* is not preserving the world: keep each branch on the half of [0,1) it always
  owned. (#2, #4, #5, #23, #40)
- **Time-compress everything you build.** A day is 55 s: an effect over ~2 s is state,
  not an event; a round trip over ~40 s is a permanent resident. Caps set inflow, trip
  length sets standing population, so **a cap floor is not a population floor** — floor
  the arrival *rate*, and end a population by not sending new members round. On a
  channel holding ONE object measure **presence**. **Price the walk with `pathHours()`
  before choosing who is sent** — a guessed distance is wrong by 2× (the lane is ~25 h
  wide), and when the window is minutes the DRINK decides, not the walk. A cap sized on
  daylight is CLOSED after dark whatever it reads: a night visitor needs its own presence
  bound. (#2, #5, #15, #23, #33, #46, #47, #51)
- **A slow world scalar wants a cap, a cycle and an anchor.** Rate-cap it, so "it never
  steps" is one number. Prefer a cosine of a phase to a ramp (a ramp is an act that
  ends). Every term it replaces must reduce *exactly* to the old constant at the
  anchor, in the **algebra** not the tuning — `x * f()` and `x - k*(1 - f())` are
  exact, `x * (a + b*f())` is a float to defend. Assert it **at** the anchor. Put the
  scalar on a consumer's **varying** term only; the fixed term is then the floor by
  construction. (#3, #12, #14, #18, #19, #22)
- **Tune a seasonal term on a folded-time mean of its CONSUMER, never on area or duration
  in the scalar's own units.** A symmetric ±x% on a slew-limited hold delivered +38% rain;
  an equal-area ramp is not the same year (time piles up at the extremes), and the CA
  spends a ramp asymmetrically, so a cap flat to 0.06% still moved the beds +1.9%. (#21, #37)
- **A slow thing's season is not the season it is in.** Anything carrying state across a
  phase boundary — a rate-capped scalar, a trip that is a fraction of the cycle, stock
  carried forward — drags the previous quarter with it: shoulders come out **unequal from
  symmetric code**, and **two lags compose into a trough nobody wrote**. Check the
  shoulder **pair** averages to the anchor, not each alone. (#21, #23, #29)
- **When you turn a constant into a variable, hunt what was tuned against it — and the
  seam it now crosses.** The rest of the file keeps its hard-coded copy and nothing errors
  on the disagreement. The day rolls at `hour 6.00` (page `day` is one ahead of
  `hash(d,99)` computed from t=0): a window dragged across that seam sees its `day`
  predicates go false mid-window. Not an error — a pop. (#12, #18, #50)
- **A ceiling is not a kill term**, and a global scalar is not a switch. If a system
  already ages out what sits at its ceiling, lowering the ceiling empties it by itself.
  Give any scalar that can approach zero per-cell variance (`hash(x, y+k) > c`), and
  **match the variance's grain to the grain the region is ADDRESSED by** — a per-CELL
  seventh was a silent no-op in the per-PLOT allotments. (#14, #25)
- **Two figures nearer than ~0.9 cells render as one shape**, so a queue, a bench, a
  haggle, an audience must hold people apart to read at all — and **fit a scatter by
  moving its centre, not by clamping its members**, or a deliberate spread collapses
  into a heap at the box's edge. (#4, #20)
- **A follower is a re-read RATE, not an offset.** "Target near the leader" holds a pair
  only if the follower's clock is several times faster than the leader's and neither
  target is further than one bout's travel. (#44)
- **A feature that exists may exist at a rate of zero — count before you build on it,
  and advertise it or nobody finds it.** A spawn band is a *share of a budget*, not a
  rate: `spawnLaneAgent` fires ~3.3×/day, so a 4% band is one person per twelve days —
  give a rare thing its own arrival source. Same law one level up: the diorama answered
  six kinds of click for 31 iterations and nothing said so. A new invitation joins the
  `OFFERS` queue; it does not compete. (#7, #9, #13, #31; paid 4×)
- **A per-agent trait must be a field written only at spawn.** `a.timer`, `a.greet`,
  `a.watch` all count down — read one as a stable personal threshold and it cycles the
  band several times a second: a flicker that looks like a stagger. Give the trait its
  own field (`a.wary`), then predict the fraction that should react and count it. (#6)
- **A field that means one thing on an empty cell and another on a full one is two
  fields sharing a name.** `bAge` is the fallow clock only when `!bSp`; it ticks on a
  planted cell too. Qualify every read by the cell's occupancy. (#52)
- **Stage an appearance as N clamps on one 0..1 progress**, never as timed steps — run
  the progress backwards and it packs away in reverse for free. Keep each crossfade
  window no wider than the lowest threshold it fades in from, or the first item sits
  permanently translucent at rest. (#6, #8)
- **Split a flag that gates both behaviour and drawing** — a boolean for behaviour, a
  0..1 intensity beside it that every draw site multiplies by (`isWindy`/`windF`). (#15, #50)
- **`drawBlocks`/`drawGround` are a CACHED layer — and a cache's cadence is whatever sets
  its dirty flag most often.** The comment says a quarter sim-hour; the grass-wear line
  dirties it ~520×/day. Count rebuilds (`probes/ground-rebuilds.mjs`) before tuning a
  bucket. A per-frame truth on a facade or the ground needs a live overlay — register at
  cache time, repaint per frame (`drawLitPanes`). Any accumulator the cache pass fills
  (`LIT[]`) must be reset by the pass that fills it. (#39, #48)
- **The sill is DOM, and DOM fails quietly.** A CSS rule that fails to parse is
  *silent*: **assert on computed style**. A sill item that *borrows* space resizes the
  picture with **no `resize` event**, so read screen coordinates off the **frame**, not
  the window. Hit-test a moving thing against its drawn footprint PER POSE — the miss is
  always the odd pose. A timer a *person* races runs on the real clock: bucket it off sim
  `dt` and it waits forever on `?pause`. (#27, #28, #31, #42)
- **A probe's world is only as rewound as you make it.** `__reseed()` rewinds the PRNG
  and `__setTime()` the clock; *neither* rewinds module-level latches or agents already
  spawned. The **renderer draws from the PRNG**, so every frame delivered during a host
  round-trip walks the seeded stream, even on a *paused* page. Reseed before measuring,
  step inside ONE `page.evaluate`, fresh page per screenshot/`boundingBox()`. A sampled
  `__warp` sees only step boundaries (and never draws — a cache-repaint check must call
  `drawScene` itself). **`ls probes/`** before writing one: it is seam, not read budget.
  (#3, #6-#9, #29, #30)
- **A zero is evidence only if you show the test can be non-zero.** A negative result
  says a class of event did not happen, which is also what a broken test says. Anchor
  it on the state the **bug** would leave, print the **margin**, and run it on HEAD.
  A candidate whose numbers are IDENTICAL to HEAD is a predicate that never fired, not
  a small effect — #52 dug 0 across 8 seed-winters that way. (#30, #52)
- **When a gate fails, suspect the instrument first** — three of #31's failures were
  the probe, none the page. A probe holding **its own copy of the page's strings** is a
  bug with a delay fuse: they are top-level consts, `evaluate()` can name them. A
  margin computed with a floor can only report bad news — print a **range**. Assert
  what is structural, not when it happened. `__entities` exposes per-kind `extra`s — a
  field added to one `take()` is a blind spot on every other kind. (#31, #47)
- **Measure a share at the CHOICE, a threshold against the HISTOGRAM.** A share that
  governs a choice is counted at spawn, never by presence — presence weights each branch
  by its own dwell and leaks across the day roll. A threshold quoted in a brief is a
  hypothesis about a distribution: `wear > 0.45` named the tail of the desire paths,
  not the paths. Histogram the field before you tune to it. (#49, #50)
- **An event its audience must WALK to is bounded at both ends by things that are not
  the event.** The trip in sets the earliest it can be full; dusk, rain, a front, a
  closing time set the latest. Size the *end* against the light. And a night feature's
  audience is whoever is still on the frame at the dusk edge — 2–3 people, arrivals
  stop with daylight — so **count them before sizing anything that waits for "leavers
  after dark"**. (#32, #51)
- **Pin the instant, don't wait for it.** A fixed wall-clock wait jitters by many sim
  minutes. Drive with `?pause` + `__warp(t)`. An instant is a *phase as well as an
  hour*: hold **both** fixed across any axis you vary, or the axis measures the season.
  Pinning both needs `t = 0` or `27.5` (mod 55), the only two hours that exist.
  Consequence: **the census ladder samples ONE warmth** — blind to anything acting away
  from the anchor, and for the same reason a clean attribution tool. (#9, #14, #16, #25)
- **`filmstrip.mjs`'s Δ is a whole-frame mean at a 0.35 s gap — a RATE, not a step.**
  Blind under ~2% of the canvas, loud about anything global; a smooth sine at the sun's
  edges reads 5–9 there and 0.5–1.5 per 60 fps frame. Divide by the frames in the gap,
  split cached from live (`probes/dusk-relight-where.mjs`), crop to your feature; a
  jump in every cell is weather or light, not your draw order. (#8, #9, #48)
- **A CA rule that makes a region coherent makes it monotonous.** Check what
  neighbourhood inheritance does to *variety* over many cycles — plot-coherent re-sowing
  quietly lost two of four vegetables. (#7)
