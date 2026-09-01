# Laws

True of the NEXT vector too; what is true only of what you built goes in the ledger. Cap 60 / 12 KB.

## Inherited (Solvista)

- **Locate before you judge; compare against a control you RAN — and price the brief's
  PREMISE the same way.** Check `state.json`'s inventory *and* grep the source, including for a
  TIMER: the town usually already has the countdown a brief sees "no trace" of. A gate that fails
  on HEAD is not a gate; a control returning the candidate's numbers is none; a `/tmp` fixture is
  whatever LAST wrote it — regenerate from `git show HEAD:` inside the probe. When a brief says a
  thing has NEVER happened, COUNT it on HEAD (32/102 is not never), and an inventory line by the
  pass that wrote the brief is not a second witness. A brief's criteria can CONTRADICT each other
  — price them against each other first. An uncommitted WIP from a cut-off attempt is UNPROVEN:
  verify it from zero; #95, #97 and #99 each found 2–4 real defects in one. (#22–#99)
- **One predicate, one definition — read a footprint back off the grid, never re-derive it.**
  A second evaluation of one ellipse put 22 birds in the basin. Routes are WAYPOINTS and nobody
  reads the grid between them, so a non-walkable cell holds only where a route's ENDPOINTS are
  chosen — keep it out of every target set (ring nodes, spot pickers, gap lines). (#24, #41, #84)
## This town

- **Every random draw goes through `R()`** (or `hash(x,y)` per-cell); `Math.random()` is
  invisible to `?seed=`. A per-day `hash(day, k)` is seed-INDEPENDENT: a 4-day window is one
  sample of the calendar in every world — salt by histogram over the year. A hashed calendar
  share sits on a weather predicate's CONVERSION: count fine windows per offered day (17/40),
  then set K to the band — the brief's share is the product, not the factor. (#90, #93)
- **Two renderer traps.** `project()` pinches on *screen* depth; roofs are emergent from
  `buildVolumes()` — change a footprint, never a roof; two solid footprints that TOUCH are one
  roof. (#78)
- **Any new `R()` draw reshuffles the whole seeded world** — the census churns everywhere (HEAD's
  own spread on identical code is 19%) and a motion gate fires on a kind you never touched: read
  the census for *collapse*, not delta, and run a stray gate on HEAD first. **Two seeds is not a
  sample** — replay ten. Keep each branch on the half of [0,1) it owned; a per-entity
  variable that must not cost a draw folds a uniform already drawn (`ph·1.7 % 1`) — but only a
  field written ONCE: `a.phase` is the GAIT, mutated every step, so a fold of it is re-drawn on
  every read. (#2–#96)
- **Time-compress everything you build.** A day is 55 s: ~2 s is state, a ~40 s trip is a
  resident. Caps set inflow, trip length sets population — floor the arrival *rate*, end a
  population by sending nobody new; measure **presence**, not a per-instant crop. A place-holder
  whose visit outlasts its window makes arrivals/day ≈ cap whatever the rate: price presence as
  rate × visit BEFORE choosing the cap, and release the place as the walk OUT begins. A daylight
  cap is CLOSED after dark. Effective lane speed ~0.75·`a.speed`; trace one agent to price a
  trip. (#2–#92)
- **A slow world scalar wants a cap, a cycle and an anchor.** Rate-cap it, so "it never steps" is
  one number — and step it with `tgt > x` / `tgt < x`, never `else`: AT the target the else branch
  runs and it flickers ±r at its ceiling. Every term it replaces must reduce *exactly* to the old
  constant at the anchor, in the **algebra** (`x * f()` is exact, `x * (a + b*f())` is a float to
  defend); assert it **at** the anchor. Put the scalar on a consumer's **varying** term only, and tune it on a folded-time mean of that
  consumer — state carried across a phase boundary makes shoulders unequal from symmetric code. (#3–#88)
- **Exact at the anchor is not exact in the HISTORY.** A sign or a latch steers state, so the
  frame differs from HEAD even at the anchor value: force the anchor over the whole run
  (`signFor = () => 1`) and hash the canvas the consumer draws on. A shape moved from a cache to a
  live pass differs ±1 on its own antialiased edges and nowhere else: assert the diff's LOCATION,
  not zero — "IDENTICAL to HEAD" outlives its change by exactly one iteration. (#71, #83, #91)
- **When you turn a constant into a variable, hunt what was tuned against it — and the seam it
  now crosses.** The rest of the file keeps its hard-coded copy and nothing errors. The day rolls
  at `hour 6.00`: a window dragged across it sees its `day` predicates go false mid-window.
  `nightF > 0.3` is DAWN too (0.36 at a summer 06:30): qualify "after dark" with the hour. (#12–#82)
- **A ceiling is not a kill term, and a scalar is not a switch**: a system that ages out what
  sits at its ceiling is emptied by lowering it. Give a scalar that can reach zero per-cell
  variance (`hash(x, y+k) > c`) at the grain the region is ADDRESSED by, and split the boolean
  for behaviour from the 0..1 intensity draw sites multiply (`isWindy`/`windF`). (#7–#50)
- **Two figures nearer than ~0.9 cells render as one shape** — hold a queue or an audience apart;
  fit a scatter by moving its centre, not its members. A displacement must OWN the tick: `return`
  after the shove, or the walker's own step puts it back. (#4–#82)
- **A raised walkable surface is two draw items, not one.** Surface and everything behind the
  walkers sort before their y; near edge, rail and shadow after; whatever passes UNDER it is
  drawn by the surface item. A walker's height is read off the place under the feet (`agentZ`)
  every frame, never written at spawn. (#73)
- **A feature that exists may exist at a rate of zero — count before you build on it, and
  advertise it or nobody finds it.** A spawn band is a *share of a budget*, not a rate
  (`spawnLaneAgent` fires ~3.3×/day: a 4% band is one person per twelve days) — give a rare thing
  its own source. A new invitation joins `OFFERS`. A place's traffic has an ARRIVAL-HOUR
  histogram, not just a rate: a stop 12 h of walking from its source is an *evening* place, and a
  daylight-priced offer sited there runs at zero however well priced. Count WHEN. (#7–#96)
- **Qualify every read by what the record currently IS.** `bAge` is the fallow clock only when
  `!bSp`; `HOMES` holds every night's arrivals — read it by the epoch key (`nid`), as
  `windowLit` does. "On the way out" is a DESTINATION, never `a.i === a.wp.length-1`: routes are
  extended in place (`goHome`). A countdown read as a threshold cycles. (#6–#60)
- **A walk is priced at its CHOICE and spent on its way.** The far side is ≥ 2.5 h from every
  gate. Price ARRIVAL against the window's END
  (the retire rule ends the stay, never arrival + dwell), open it a trip EARLIER than its hour —
  and every hold en route (`greet`, `listen`, `cartShove`) is unpriced time: a priced walker
  refuses the optional ones (`chatty()`) or carries a margin. A one-frame `stand` is invisible at
  a 0.25 s sample — trace state CHANGES. Bound BOTH ends: a window with only a LANDING bound is a
  marathon-walker factory, since at a closed hour the one branch that passes pricing is the
  longest walk (set-outs 3 → 349). Price "works the N places" as N × (leg + stand) at the lane's
  ~5.2 cells/h BEFORE choosing N (fourteen doors = 30 h); when the window prices to zero, widen
  the WINDOW, never the speed. (#32–#98)
- **`drawBlocks`/`drawGround` are a CACHED layer whose cadence is whatever sets its dirty flag
  most often** (`ground-rebuilds.mjs`). A per-frame truth on a facade or the ground is a live
  overlay: register at cache time, repaint live (`drawLitPanes`); an accumulator a cache pass
  fills (`LIT[]`) is reset by it; what you lift out of a cache carries what was drawn ON TOP of it
  (`frame-cost.mjs`, not `perf.mjs`). Anything registered in SCREEN space at cache time (`FACES`,
  `gview`) is stale for exactly the camera ease — map it through `k = viewS/gview.s`. (#39–#86)
- **A quarter's `share` sets s from WIDTH alone** — it raises s past the height fit while the
  frame keeps the box's centre. Price a box's ROWS with `project()` on the target frame; the
  foreground sill strip eats the bottom ~7% of every frame. A clamp priced at a box's CORNER must
  ask whether that corner is the *world's* edge — on a world-edge box (far bank `x1 === GW`) the
  test is trivially true and silently disables the clamp. (#87, #99)
- **The sill is DOM, and DOM fails quietly.** A CSS rule that fails to parse is silent: assert
  computed style. A sill item that borrows space resizes the picture with no `resize` event: read
  screen coordinates off the frame. Hit-test a moving thing PER POSE; a timer a person races runs
  on the real clock, not sim `dt`. (#27–#42)
- **A probe's world is only as rewound as you make it.** `__reseed()`/`__setTime()` rewind the
  PRNG and clock, not latches or agents already spawned. The renderer draws from the PRNG: reseed,
  then step inside ONE `page.evaluate`; fresh page per screenshot. `__warp` never draws and a
  canvas read after `requestAnimationFrame` is unpinned: call `drawScene(simT, 1/30)` inside the
  evaluate. `deviceScaleFactor` 3 is a DIFFERENT world from 1×, and `?t=<n>` a different world
  from a warp off the default start. A PAGE clip needs the canvas's `getBoundingClientRect()`
  offset; a `ctx` read needs none. `ls probes/` first. (#3–#95)
- **A zero is evidence only if you show the test can be non-zero; a green anchor only if the
  predicate FIRED.** Anchor a negative on the state the **bug** would leave, print the margin and
  the raise count, run it on HEAD; a candidate IDENTICAL to HEAD is a predicate that never fired.
  And suspect the INSTRUMENT first: a probe holding its own copy of the page's strings is a
  delayed bug — `evaluate()` can name the consts. Print a **range**, not a floored margin. A field added to one `take()` is blind on every other `__entities` kind. The motion
  gate's jump is d > ABS_JUMP AND d > 8× the entity's MEDIAN step in 60 s, so a fast thing that
  mostly stands (the cart) flips on the reshuffle alone: replay the scene on HEAD and compare the
  worst step's INSTANT. Its scenes are days 3, 7, 11, 19, 22 — a feature living on days 12–18 is
  invisible to it. (#31, #47, #85, #93)
- **Measure a share at the CHOICE, a threshold against the HISTOGRAM.** A share that governs a
  choice is counted at spawn, never by presence — presence weights each branch by its dwell and
  leaks across the day roll. A threshold in a brief is a hypothesis: histogram the field first. A
  threshold on a REGION ("inside the ellipse ≥ 80%") is an intersection — sample the region's
  coverage of the consumer's set (0% of the annulus); the rule may have to move the consumer. (#49–#94)
- **Pin the instant, don't wait for it.** A wall-clock wait jitters by sim minutes: drive with
  `__warp(t)` — which advances whole fixed-dt steps (~0.067 s), so a step count is not a clock:
  loop on `day`, measure durations as `simT` deltas. An instant is a *phase as well as an hour*:
  hold both fixed across any axis you vary, or the axis measures the season. A "day-of-X" sample is a sample of when X ENDS: pin the post-X state at a
  daylit hour. (#9–#92)
- **`filmstrip.mjs`'s Δ is a whole-frame mean at a 0.35 s gap — a RATE, not a step.** Blind under
  ~2% of the canvas, loud about anything global. Divide by frames in the gap, split cached from
  live, crop to your feature, grade against NEIGHBOURS (`pops.mjs`), and print the FEATURE's own
  pixel series — a step beside a cache rebuild or inside the dawn/dusk relight hides. (#8–#81)
- **A night colour is set by the LAST composite that touches it, not the pass that draws it.**
  Anything drawn live before `applyLight`'s multiply is slate by midnight; put its warmth back in
  a `screen` pass after it (LIT halos, TAP_DOOR, `LIT_PANES`, `roseLit`, `drawBonfireLight`). (#61, #93)
- **An hour OF THE SUN is solved at the arrival instant, not the departure.** Anything read off
  `sunUp`/`sunDown` hours away is stale by the seasonal swing (0.36 h/day): fixed-point it on
  `sunAt(t)`. (#67)
