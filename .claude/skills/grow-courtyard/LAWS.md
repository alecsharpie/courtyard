# Laws

A law is true of the NEXT vector too; what is true only of what you built goes in
`LEDGER.md`. Cap 60 / 12 KB.

## Inherited (Solvista)

- **The ledger is not the inventory.** The town predates the loop. Check `state.json`'s
  inventory *and* grep the source — including for a TIMER: the town usually already has a
  countdown where a brief sees "no trace" (`wet` under `wetness`); make it the new scalar's
  consumer, never a second truth beside it. (#59)
- **Locate before you judge; compare against a control you RAN.** Half of "this looks bad"
  is "drawn in the wrong pass": render the same pinned instant in both builds. A gate that
  fails on unmodified HEAD is not a gate; a control returning the candidate's exact numbers
  is not a control (`filmstrip.mjs` takes no `--page`). (#22, #24, #45)
- **One predicate, one definition — read a footprint back off the grid, never re-derive
  it.** A second evaluation of one ellipse disagreed with `buildGrid()`'s by 2e-16 — a whole
  cell — put 22 birds in the basin. `seed()` must sow by the predicate the running rule
  uses. (#24, #41)

## This town

- **Every random draw goes through `R()`** (or `hash(x,y)` per-cell); a bare `Math.random()`
  is invisible to `?seed=`.
- **Two renderer traps.** `project()` pinches on *screen* depth (revert it and a black seam
  returns beside every wall); roofs are emergent from `buildVolumes()` — change a footprint,
  never a roof.
- **Any new `R()` draw reshuffles the whole seeded world** — the census churns everywhere
  and a motion gate fires on a kind you never touched. Read a census diff for *collapse*,
  not delta; a gate firing on what you did not build: run it on HEAD first. **Two seeds is not
  a sample** — replay over ten. Keep each branch on the half of [0,1) it owned. (#2, #4, #5, #23, #40)
- **Time-compress everything you build.** A day is 55 s: ~2 s is state, a ~40 s trip is a
  resident. Caps set inflow, trip length sets standing population — **a cap floor is not a
  population floor**: floor the arrival *rate*, end a population by sending nobody new. ONE
  object on a channel: measure **presence**. Price the walk with `pathHours()` before choosing
  who is sent (the lane is ~25 h wide); a daylight cap is CLOSED after dark. (#2, #5, #15, #23, #33, #46, #47, #51)
- **A slow world scalar wants a cap, a cycle and an anchor.** Rate-cap it, so "it never
  steps" is one number. Prefer a cosine of a phase to a ramp. Every term it replaces must reduce
  *exactly* to the old constant at the anchor, in the **algebra** — `x * f()` is
  exact, `x * (a + b*f())` is a float to defend. Assert it **at** the anchor. Put the scalar
  on a consumer's **varying** term only; the fixed term is the floor. (#3, #12, #14, #18, #19, #22)
- **Exact at the anchor is not exact in the HISTORY.** A sign, a latch, anything that steers
  state (leaves, windX) makes the frame differ from HEAD even at the anchor value: prove
  identity by forcing the anchor over the whole run (`signFor = () => 1`), and hash the canvas
  the consumer draws on — the ground cache `gcv` is blind to live draws. (#71)
- **Tune a seasonal term on a folded-time mean of its CONSUMER, never on area in the
  scalar's own units.** A symmetric ±x% on a slew-limited hold delivered +38% rain; time
  piles up at the extremes and the CA spends a ramp asymmetrically. (#21, #37)
- **A slow thing's season is not the season it is in.** Anything carrying state across a phase
  boundary — a rate-capped scalar, a trip that is a fraction of the cycle, stock
  carried forward — drags the previous quarter with it: shoulders come out **unequal from
  symmetric code**, and **two lags compose into a trough nobody wrote**. Check the shoulder
  **pair** averages to the anchor. A day-scale switch on a multi-day process (a per-day wind on
  a 1.7-day boat trip) bleeds the same: count at the choice per free sample. (#21, #23, #29, #54)
- **When you turn a constant into a variable, hunt what was tuned against it — and the
  seam it now crosses.** The rest of the file keeps its hard-coded copy and nothing errors
  on the disagreement. The day rolls at `hour 6.00`: a window dragged across that seam
  sees its `day` predicates go false mid-window. Not an error — a pop. (#12, #18, #50)
- **A ceiling is not a kill term**, and a global scalar is not a switch: if a system ages
  out what sits at its ceiling, lowering the ceiling empties it. Give a scalar that can
  reach zero per-cell variance (`hash(x, y+k) > c`) at the grain the region is ADDRESSED
  by — per-CELL was a no-op in per-PLOT allotments. (#14, #25)
- **Two figures nearer than ~0.9 cells render as one shape** — hold a queue, a bench, an
  audience apart; fit a scatter by moving its centre, not clamping members. (#4, #20)
- **A follower is a re-read RATE priced off the LEADER, not an offset.** Re-target several
  times faster than the leader moves; scale catch-up to the gap, never a fixed speed edge; a
  minimum-distance rule must step AWAY (a hold is walked through by a leader reversing); a
  second occupant of a bench or table needs the FIRST one's place moved at spawn. (#44, #70)
- **A feature that exists may exist at a rate of zero — count before you build on it,
  and advertise it or nobody finds it.** A spawn band is a *share of a budget*, not a
  rate: `spawnLaneAgent` fires ~3.3×/day, so a 4% band is one person per twelve days —
  give a rare thing its own arrival source. A new invitation joins `OFFERS`. (#7, #9, #13, #31)
- **A per-agent trait is a field written only at spawn.** `a.timer`/`a.greet`/`a.watch` count
  down — read as a threshold they cycle the band several times a second. Give the trait its
  own field (`a.wary`), predict the fraction that reacts, count it. (#6)
- **Qualify every read by what the record currently IS.** `bAge` is the fallow clock only
  when `!bSp` (two fields sharing a name); `HOMES` holds every night's arrivals, so read it
  by the current epoch key (`nid`) as its ONE predicate `windowLit` does, or it answers for
  a night that is over. (#52, #55)
- **A night arrival's budget is the places its walk REACHES, not its rate.** From an edge only
  3 of 11 doors fit a 12 h night: list what each entry reaches, `pathHours()` against the
  window's END, before sizing the source. (#53)
- **Stage an appearance as N clamps on one 0..1 progress**, never timed steps — run backwards
  it packs away for free. Keep each crossfade no wider than its own threshold, or the first
  item sits translucent at rest. (#6, #8)
- **Split a flag that gates behaviour and drawing** — a boolean for behaviour, a 0..1 intensity
  every draw site multiplies (`isWindy`/`windF`). (#15, #50)
- **`drawBlocks`/`drawGround` are a CACHED layer whose cadence is whatever sets its dirty
  flag most often** (`probes/ground-rebuilds.mjs` before tuning a bucket). A per-frame truth
  on a facade or the ground is a live overlay: register at cache time, repaint per frame
  (`drawLitPanes`); an accumulator a cache pass fills (`LIT[]`) is reset by that pass.
  `perf.mjs` saturates at 16.7 ms — time the draw call (`frame-cost.mjs`). (#39, #48, #56)
- **The sill is DOM, and DOM fails quietly.** A CSS rule that fails to parse is silent: assert
  on computed style. A sill item that borrows space resizes the picture with no `resize`
  event: read screen coordinates off the frame. Hit-test a moving thing PER POSE. A timer a
  person races runs on the real clock, not sim `dt`. (#27, #28, #31, #42)
- **A probe's world is only as rewound as you make it.** `__reseed()`/`__setTime()` rewind the
  PRNG and clock, not latches or agents already spawned. The renderer draws from the PRNG, so
  every frame in a host round-trip walks the stream: reseed, then step inside ONE
  `page.evaluate`; fresh page per screenshot. `__warp` never draws. `?pause`+`__reseed`+`__setTime`
  is NOT the world a live page reaches at `?t=`: warp the live page. `ls probes/` first — a
  probe is seam, not read budget. (#3, #6-#9, #29, #30, #67)
- **A zero is evidence only if you show the test can be non-zero, and a green anchor only
  if the predicate FIRED.** A negative result is also what a broken test says: anchor it on
  the state the **bug** would leave, print the margin AND the raise count (a Uint8 that stays
  0 across 26 days × 3 seeds is a guard that never fired), run it on HEAD. A candidate
  IDENTICAL to HEAD is a predicate that never fired. When a target grows a second source, an
  assertion on its OLD definition counts the new ramps as faults — assert "sits on the wrong
  anchor", not "is off the anchor". (#30, #52, #65, #66)
- **When a gate fails, suspect the instrument first** — three of #31's failures were the
  probe, none the page. A probe holding its own copy of the page's strings is a bug with a
  delay fuse: `evaluate()` can name the consts. Print a **range**, not a floored margin.
  Assert the structural, not the when. A field added to one `take()` is a blind spot on
  every other `__entities` kind. (#31, #47)
- **Measure a share at the CHOICE, a threshold against the HISTOGRAM.** A share that
  governs a choice is counted at spawn, never by presence — presence weights each branch
  by its own dwell and leaks across the day roll. A threshold quoted in a brief is a
  hypothesis about a distribution: `wear > 0.45` named the tail of the desire paths,
  not the paths. Histogram the field before you tune to it. A "cut by traffic" rule is only as strong as the
  traffic crossing the CELL: histogram the deposit by ROW and count crossings of those rows —
  the lane road is 8 rows and the whole heap sits in one. (#49, #50, #72)
- **An event its audience must WALK to is bounded at both ends by things that are not
  the event** — the trip in sets the earliest it can be full; dusk, rain, closing time set
  the latest. A night feature's audience is whoever is on the frame at the dusk edge (2–3
  people; arrivals stop with daylight) — **count them before sizing anything that waits
  for "leavers after dark"**. (#32, #51)
- **Pin the instant, don't wait for it.** A wall-clock wait jitters by sim minutes: drive
  with `?pause` + `__warp(t)`. An instant is a *phase as well as an hour*: hold both fixed
  across any axis you vary, or the axis measures the season (`t = 0` or `27.5` mod 55 are
  the only two hours that exist). Hence the census ladder samples ONE warmth — blind away
  from the anchor, a clean attribution tool. A "day-of-X" sample is a sample of when X
  happens to END (every natural shower ended 21:00–02:00): pin the post-X state at a daylit
  hour instead of waiting for it. (#9, #14, #16, #25, #64)
- **`filmstrip.mjs`'s Δ is a whole-frame mean at a 0.35 s gap — a RATE, not a step.** Blind
  under ~2% of the canvas, loud about anything global (the dusk sine reads 5–9). Divide by
  frames in the gap, split cached from live (`probes/dusk-relight-where.mjs`), crop to your
  feature, grade against NEIGHBOURS (`pops.mjs`), never the series median. A step inside the
  dawn/dusk relight is invisible: check the hour a switch fires before ramping it. (#8, #9, #48, #57, #58)
- **A CA rule that makes a region coherent makes it monotonous** — plot-coherent re-sowing lost
  two of four vegetables; check variety over many cycles. (#7)
- **A route's last waypoint is the only honest "on the way out".** `a.i === a.wp.length-1`
  names anyone on the last leg of anything (a sitter walking to a bench), and routes get
  extended in place (`goHome`, the exit push): read the DESTINATION, not the index. (#60)
- **A night colour is set by the LAST composite that touches it, not the pass that draws
  it.** Anything drawn live before `applyLight`'s multiply is slate by midnight; put its
  warmth back in a `screen` pass after it (LIT halos, TAP_DOOR, `LIT_PANES`/`ROSE`). Check the
  multiply before blaming a constant. A PAGE clip needs the canvas's
  `getBoundingClientRect()` offset; a `ctx` read needs none. (#61)
- **An hour OF THE SUN is solved at the arrival instant, not the departure.** Anything read
  off `sunUp`/`sunDown` across more than an hour or two of sim time is stale by the day's
  share of the seasonal swing (0.36 h/day); fixed-point it on `sunAt(t)`. (#67)
