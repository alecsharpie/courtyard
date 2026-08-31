# Laws

True of the NEXT vector too; what is true only of what you built goes in the ledger. Cap 60 / 12 KB.

## Inherited (Solvista)

- **The ledger is not the inventory.** Check `state.json`'s inventory *and* grep the source —
  including for a TIMER: the town usually already has a countdown where a brief sees "no trace"; make it the consumer. (#59)
- **Locate before you judge; compare against a control you RAN — and price the brief's
  PREMISE the same way.** Render one pinned instant in both builds. A gate that fails on HEAD is not a gate; a control
  returning the candidate's numbers is none; a `/tmp` fixture is whatever LAST wrote
  it — regenerate from `git show HEAD:` inside the probe. When a brief says a thing has NEVER
  happened, grep the constant it would use and COUNT it on HEAD — 32/102 is not never, and an
  inventory line written by the pass that wrote the brief is not a second witness. (#22, #45, #86, #90)
- **One predicate, one definition — read a footprint back off the grid, never re-derive it.**
  A second evaluation of one ellipse put 22 birds in the basin. `seed()` sows by the predicate the running rule uses. (#24, #41)

## This town

- **Every random draw goes through `R()`** (or `hash(x,y)` per-cell); `Math.random()` is
  invisible to `?seed=`. A per-day `hash(day, k)` is seed-INDEPENDENT: a 4-day window is one
  sample of the calendar in every world — salt by histogram over the year. (#90)
- **Two renderer traps.** `project()` pinches on *screen* depth (revert it and a black seam
  returns beside every wall); roofs are emergent from `buildVolumes()` — change a footprint,
  never a roof; two solid footprints that TOUCH are one roof. (#78)
- **Any new `R()` draw reshuffles the whole seeded world** — the census churns everywhere
  and a motion gate fires on a kind you never touched: read the census for *collapse*, not
  delta; run a stray gate on HEAD first. **Two seeds is not a sample** — replay ten.
  Keep each branch on the half of [0,1) it owned; a per-entity variable that must not cost a
  draw folds a uniform already drawn (`ph·1.7 % 1`). (#2, #4, #5, #23, #40, #76)
- **Time-compress everything you build.** A day is 55 s: ~2 s is state, a ~40 s trip is a
  resident. Caps set inflow, trip length sets population — floor the arrival *rate*,
  end a population by sending nobody new; measure **presence**, not a per-instant crop. A
  daylight cap is CLOSED after dark. Effective lane speed is ~0.75·`a.speed`: price a trip by
  tracing one agent spawn → stopped. (#2–#85)
- **A slow world scalar wants a cap, a cycle and an anchor.** Rate-cap it, so "it never
  steps" is one number — and step it with `tgt > x` / `tgt < x`, never `else`: AT the target the
  else branch runs and the scalar flickers ±r at its ceiling. Prefer a cosine of a phase to a ramp. Every term it replaces must
  reduce *exactly* to the old constant at the anchor, in the **algebra** — `x * f()` is exact,
  `x * (a + b*f())` is a float to defend; assert it **at** the anchor. Put the scalar on a
  consumer's **varying** term only; the fixed term is the floor. (#3–#22, #88)
- **Exact at the anchor is not exact in the HISTORY.** A sign, a latch, anything that steers
  state makes the frame differ from HEAD even at the anchor value: prove identity by forcing
  the anchor over the whole run (`signFor = () => 1`), and hash the canvas the consumer draws on (`gcv` is blind to live draws). A shape moved from a cache to a live
  pass differs ±1 on its own antialiased edges and nowhere else: assert the diff's LOCATION,
  not zero — an "IDENTICAL to HEAD" assertion outlives its change by exactly one iteration. (#71, #83, #91)
- **A slow thing's season is not the season it is in.** Anything carrying state across a
  phase boundary (a rate-capped scalar, a trip that is a fraction of the cycle, carried stock)
  drags the previous quarter with it: shoulders come out **unequal from symmetric code**, and
  **two lags compose into a trough nobody wrote**. Check the shoulder PAIR averages to the
  anchor; tune a seasonal term on a folded-time mean of its CONSUMER, never on area in its own units. (#21–#54)
- **When you turn a constant into a variable, hunt what was tuned against it — and the
  seam it now crosses.** The rest of the file keeps its hard-coded copy and nothing errors.
  The day rolls at `hour 6.00`: a window dragged across it sees its `day` predicates go false
  mid-window. `nightF > 0.3` is DAWN as well as dusk (0.36 at a summer 06:30) — an "after
  dark" rule on nightF alone fires in the morning; qualify with the hour. (#12, #18, #50, #82)
- **A ceiling is not a kill term, and a scalar is not a switch**: if a system ages out what
  sits at its ceiling, lowering the ceiling empties it. Give a scalar that can reach zero
  per-cell variance (`hash(x, y+k) > c`) at the grain the region is ADDRESSED by. Split a boolean
  for behaviour from the 0..1 intensity every draw site multiplies (`isWindy`/`windF`). (#7–#50)
- **Two figures nearer than ~0.9 cells render as one shape** — hold a queue or an audience
  apart; fit a scatter by moving its centre, not its members. A displacement must OWN the
  tick: `return` after the shove, or the walker's own step puts it back. (#4, #20, #82)
- **Routes are WAYPOINTS; nobody reads the grid between them.** A "non-walkable cell" holds
  only where a route's ENDPOINTS are chosen — keep it out of every target set (ring nodes,
  spot pickers, gap lines), not just out of the grid. (#84)
- **A raised walkable surface is two draw items, not one.** Surface and everything behind the walkers sort before their y; near edge, rail and shadow
  after; whatever passes UNDER it is drawn by the surface item. A walker's height is read off the place under the
  feet (`agentZ`) every frame, never written at spawn. (#73)
- **A follower is a re-read RATE priced off the LEADER, not an offset.** Re-target several times faster than the leader moves; scale catch-up to the gap; a minimum-distance rule must step AWAY (a hold is walked through by a reversing leader); a
  second seat occupant needs the FIRST one's place moved at spawn. (#44, #70)
- **A feature that exists may exist at a rate of zero — count before you build on it, and
  advertise it or nobody finds it.** A spawn band is a *share of a budget*, not a rate
  (`spawnLaneAgent` fires ~3.3×/day: a 4% band is one person per twelve days) — give a rare
  thing its own source. A new invitation joins `OFFERS`. (#7–#31)
- **Qualify every read by what the record currently IS.** `bAge` is the fallow clock only
  when `!bSp`; `HOMES` holds every night's arrivals, so read it by the current epoch key
  (`nid`) as `windowLit` does, or it answers for a night that is over. "On the way out" is a
  DESTINATION, never `a.i === a.wp.length-1` — routes are extended in place (`goHome`). A trait
  is a field written ONCE at spawn (`a.wary`); a countdown read as a threshold cycles. (#6–#60)
- **A walk is priced at its CHOICE and spent on its way.** From an edge only 3 of 11 doors fit
  a 12 h night; the far side is ≥ 2.5 h from every gate. List what each entry reaches, price
  ARRIVAL against the window's END (the retire rule ends the stay, never arrival + dwell), open
  it a trip EARLIER than the hour it is for — and remember every hold a walker can pick up en
  route (`greet`, `listen`, `cartShove`) is unpriced time: a priced walker refuses the optional
  ones (`chatty()`) or carries a margin. A one-frame `stand` between two `walk`s is invisible
  at a 0.25 s sample — trace state CHANGES; "walked past its own stop" means "arrived late". A
  dusk-edge audience is 2–3 people. (#32, #51, #53, #79, #89)
- **`drawBlocks`/`drawGround` are a CACHED layer whose cadence is whatever sets its dirty
  flag most often** (`ground-rebuilds.mjs`). A per-frame truth on a facade or the ground is a live overlay: register at cache time, repaint live (`drawLitPanes`); an accumulator
  a cache pass fills (`LIT[]`) is reset by that pass; what you lift out of a cache carries
  what the cache drew ON TOP of it (`frame-cost.mjs`, not `perf.mjs`). Anything registered in
  SCREEN space at cache time (`FACES`, `gview`) is stale for exactly the camera ease — map it
  through `k = viewS/gview.s` or re-register on arrival; never move `FOCUS` under a cached layer. (#39–#86)
- **A quarter's `share` sets s from WIDTH alone** — it raises s past the height fit while the
  frame keeps the box's centre. Price a box's ROWS with `project()` on the target frame; the
  foreground sill strip eats the bottom ~7% of every frame. (#87)
- **The sill is DOM, and DOM fails quietly.** A CSS rule that fails to parse is silent: assert computed style. A sill item that borrows
  space resizes the picture with no `resize` event: read screen coordinates off the frame. Hit-test a moving thing PER POSE. A timer a
  person races runs on the real clock, not sim `dt`. (#27, #28, #31, #42)
- **A probe's world is only as rewound as you make it.** `__reseed()`/`__setTime()` rewind the
  PRNG and clock, not latches or agents already spawned. The renderer draws from the PRNG: reseed, then step inside ONE
  `page.evaluate`; fresh page per screenshot. `__warp` never draws, and a canvas read after
  `requestAnimationFrame` is unpinned: call `drawScene(simT, 1/30)` yourself inside the
  evaluate. Warp the LIVE page, never `?pause`+`__setTime`; `deviceScaleFactor` 3 is a DIFFERENT
  world from 1×. `ls probes/` first. (#3–#83)
- **A zero is evidence only if you show the test can be non-zero, and a green anchor only
  if the predicate FIRED.** A negative result is also what a broken test says: anchor it on
  the state the **bug** would leave, print the margin AND the raise count, run it on HEAD. A
  candidate IDENTICAL to HEAD is a predicate that never fired. (#30, #52, #65, #66)
- **When a gate fails, suspect the instrument first** — three of #31's failures were the probe. A probe holding its own copy of the page's strings is a delayed bug:
  `evaluate()` can name the consts. Print a **range**, not a floored margin. Assert the structural, not the when. A field added to one `take()` is blind on every other `__entities` kind. The motion gate's jump is d > ABS_JUMP AND d > 8× the entity's MEDIAN step
  in 60 s — a fast thing that mostly stands (the cart) flips on the reshuffle alone; replay the
  scene on HEAD and compare the worst step's INSTANT, not the verdict. (#31, #47, #85)
- **Measure a share at the CHOICE, a threshold against the HISTOGRAM.** A share that governs
  a choice is counted at spawn, never by presence — presence weights each branch by its own
  dwell and leaks across the day roll. A threshold quoted in a brief is a hypothesis: histogram
  the field before you tune to it — a "cut by traffic" rule needs the histogram by ROW. (#49–#72)
- **Pin the instant, don't wait for it.** A wall-clock wait jitters by sim minutes: drive with `__warp(t)`. An instant is a *phase as well as an hour*: hold both fixed
  across any axis you vary, or the axis measures the season. The census ladder samples ONE
  warmth. A "day-of-X" sample is a sample of when X ENDS: pin the post-X state at a daylit hour. (#9–#64)
- **`filmstrip.mjs`'s Δ is a whole-frame mean at a 0.35 s gap — a RATE, not a step.** Blind under ~2% of the canvas, loud about anything global. Divide by frames in the gap, split cached from live, crop to your feature,
  grade against NEIGHBOURS (`pops.mjs`) — a step beside a cache-bucket rebuild hides under it,
  so print the FEATURE's own pixel series; a step inside the dawn/dusk relight is invisible. (#8–#81)
- **A night colour is set by the LAST composite that touches it, not the pass that draws
  it.** Anything drawn live before `applyLight`'s multiply is slate by midnight; put its
  warmth back in a `screen` pass after it (LIT halos, TAP_DOOR, `LIT_PANES`, `roseLit()`).
  A PAGE clip needs the canvas's `getBoundingClientRect()` offset; a `ctx` read needs none. (#61)
- **An hour OF THE SUN is solved at the arrival instant, not the departure.** Anything read off `sunUp`/`sunDown` hours away is stale by the day's share of the seasonal swing (0.36 h/day);
  fixed-point it on `sunAt(t)`. (#67)
