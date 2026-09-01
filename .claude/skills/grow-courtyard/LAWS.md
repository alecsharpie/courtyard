# Laws
True of the NEXT vector; what is only true of what you built goes in the ledger. Cap 60 / 12 KB.

## Inherited (Solvista)
- **Locate before you judge; compare against a control you RAN — and price the brief's PREMISE
  the same way.** Check `state.json`'s inventory *and* grep the source, incl. for a TIMER: the town
  usually already has the countdown a brief sees "no trace" of. Qualify every read by what the
  record currently IS — `bAge` is the fallow clock only when `!bSp`, `HOMES` needs the epoch key
  `nid`, a countdown read as a threshold cycles, "on the way out" is a DESTINATION and never
  `a.i === a.wp.length-1`. A gate that fails on HEAD is not a gate;
  a control returning the candidate's numbers is none; a `/tmp` fixture is whatever LAST wrote it,
  so regenerate from `git show HEAD:` inside the probe. When a brief says a thing has NEVER
  happened, COUNT it on HEAD (32/102 is not never); an inventory line by the pass that wrote the
  brief is not a second witness; a brief's criteria can CONTRADICT each other. An uncommitted WIP
  is UNPROVEN. (#6–#99)
- **One predicate, one definition — read a footprint back off the grid, never re-derive it**. Routes are WAYPOINTS and nobody
  reads the grid between them, so a non-walkable cell holds only where a route's ENDPOINTS are
  chosen: keep it out of every target set. (#24, #41, #84)

## This town
- **Every random draw goes through `R()`** (or `hash(x,y)` per-cell); `Math.random()` is invisible
  to `?seed=`. A per-day `hash(day, k)` is seed-INDEPENDENT: a 4-day window is one sample of the
  calendar in every world — salt by histogram over the year. A hashed calendar share sits on a
  weather predicate's CONVERSION: count fine windows per offered day (17/40), then set K to the
  band — the share is the product, not the factor. N free `hash` draws leave a gap at the bottom
  of [0,1): stratify `(k + hash(k,s)) / N` when a threshold must be reachable at every level of
  what it gates. (#90–#102)
- **Any new `R()` draw reshuffles the whole seeded world** — the census churns everywhere (HEAD's
  own spread on identical code is 19%) and a motion gate fires on a kind you never touched: read
  the census for *collapse*, not delta, and run a stray gate on HEAD first. **Two seeds is not a
  sample** — replay ten. Keep each branch on the half of [0,1) it owned, and a per-entity variable that
  folds an already-drawn uniform must fold a field written ONCE, not a mutated one. (#2–#96)
- **Two renderer traps.** `project()` pinches on *screen* depth and LIFTS z NORTHWARD: every cell
  of height on a near volume walks it ~1.15 rows UP the frame, into what it should stand in front
  of — price a foreground against what is BEHIND it (eave 0), and price anything standing on it by
  its own row. Roofs are emergent from `buildVolumes()` — change a footprint, never a roof; two
  solid footprints that TOUCH are one roof. And two figures nearer than ~0.9 cells render as one
  shape: hold a queue or an audience apart, fit a scatter by moving its centre, not its members,
  and let a displacement OWN the tick (`return` after the shove, or the walker's step undoes it).
  (#4–#100)
- **A raised surface is two draw items, not one:** the surface and everything behind the walkers
  sorts before their y, near edge/rail/shadow after, and whatever passes UNDER it is drawn by the
  surface item. Height is read off the place under the feet (`agentZ`) every frame, never written
  at spawn. (#73)
- **Time-compress everything you build.** A day is 55 s: ~2 s is state, a ~40 s trip is a resident.
  Caps set inflow, trip length sets population — floor the arrival *rate*, end a population by
  sending nobody new, and measure **presence**, not a per-instant crop. A place-holder whose visit
  outlasts its window makes arrivals/day ≈ cap whatever the rate: price presence as rate × visit
  BEFORE choosing the cap, and release the place as the walk OUT begins. A daylight cap is CLOSED
  after dark. Lane speed is ~0.75·`a.speed`; trace one agent. (#2–#92)
- **A walk is priced at its CHOICE and spent on its way.** Price ARRIVAL against the window's END
  (the retire rule ends the stay, never arrival + dwell) and open it a trip EARLIER than its hour.
  Bound BOTH ends: a window with only a LANDING bound is a marathon-walker factory — at a closed
  hour the one branch that passes pricing is the longest walk (set-outs 3 → 349). A window's END is
  the hour the last person is GONE, not the hour they start walking, so price the walk home at the
  choice too — but do not charge one hour twice, as the window's own end has already spent it.
  Every hold en route (`greet`, `listen`, `cartShove`) is unpriced: a priced walker refuses the
  optional ones (`chatty()`) or carries a margin. Price "works the N places" as N × (leg + stand) at
  ~5.2 cells/h BEFORE choosing N (fourteen doors = 30 h); when a window prices to zero, widen the
  WINDOW, not the speed. An hour OF THE SUN is solved at the ARRIVAL instant —
  `sunUp`/`sunDown` read hours ahead is stale by the seasonal swing (0.36 h/day): fixed-point it on
  `sunAt(t)`. A one-frame `stand` is invisible at 0.25 s — trace state CHANGES. (#32–#101)
- **A feature that exists may exist at a rate of zero — count before you build on it, and
  advertise it or nobody finds it.** A spawn band is a *share of a budget*, not a rate
  (`spawnLaneAgent` fires ~3.3×/day: a 4% band is one person per twelve days) — a rare thing
  needs its own source; a new invitation joins `OFFERS`. Traffic has an ARRIVAL-HOUR histogram, not just
  a rate: a stop 12 h of walking from its source is an *evening* place, and a daylight-priced offer
  sited there runs at zero however well priced. Count WHEN. Measure a share
  at the CHOICE — at spawn, never by presence, which weights each branch by its dwell and leaks
  across the day roll. A threshold in a brief is a hypothesis: histogram the field first — and a
  threshold on a REGION is an intersection, so sample the region's coverage of the consumer's set
  before believing it. (#7–#96)
- **A slow world scalar wants a cap, a cycle and an anchor — and exact at the anchor is not exact
  in the HISTORY.** Rate-cap it, so "it never steps" is one number; step it with `tgt > x` /
  `tgt < x`, never `else` (AT the target the else branch runs and it flickers ±r at its cap).
  Every term it replaces must reduce *exactly* to the old constant at the anchor, in the
  **algebra**; put it on a consumer's **varying** term only, tuned on a folded-time mean, since
  state across a phase boundary makes shoulders unequal from symmetric code. But a
  sign or a latch steers state, so the frame differs from HEAD even AT the anchor: force the anchor
  over the whole run (`signFor = () => 1`) and hash the canvas. (#3–#91)

- **A ceiling is not a kill term, and a scalar is not a switch**: a system that ages out what sits
  at its ceiling is emptied by lowering it. Give a scalar that can reach zero per-cell variance
  (`hash(x, y+k) > c`) at the grain the region is ADDRESSED by, and split the boolean for behaviour
  from the 0..1 intensity draw sites multiply (`isWindy`/`windF`). A ceiling built from GEOMETRY is
  constant along the edge it follows, so a rule capped by it paints a stripe, not a texture — give
  the ceiling its own `hash` term. A skip guard must test the REGION, never a field legitimately
  zero inside it: `!shelter && !value` means "not my cell" only until the value first reaches
  zero, after which the cell is dead forever. (#7–#103)

- **When you turn a constant into a variable, hunt what was tuned against it** — the rest of the
  file keeps its hard-coded copy and nothing errors. The day rolls at `hour 6.00`, so a window
  dragged across it sees its `day` predicates go false mid-window; `nightF > 0.3` is DAWN too
  (0.36 at 06:30 in summer). (#12–#82)
- **`drawBlocks`/`drawGround` are a CACHED layer whose cadence is whatever sets its dirty flag most
  often** (`ground-rebuilds.mjs`). A per-frame truth on a facade or the ground is a live overlay:
  register at cache time, repaint live (`drawLitPanes`); an accumulator a cache pass fills
  (`LIT[]`) is reset by it; what you lift out of a cache carries what was drawn ON TOP of it (`frame-cost.mjs`,
  not `perf.mjs`). Anything registered in SCREEN space at cache time (`FACES`, `gview`) is stale for
  the camera ease — map it through `k = viewS/gview.s`. (#39–#86)
- **A night colour is set by the LAST composite that touches it, not the pass that draws it.**
  Anything drawn live before `applyLight`'s multiply is slate by midnight; put its warmth back in a
  `screen` pass after it (LIT halos, TAP_DOOR, `LIT_PANES`, `roseLit`, `drawBonfireLight`). (#61, #93)
- **A quarter's `share` sets s from WIDTH alone** — it raises s past the height fit while the frame
  keeps the box's centre. Price a box's ROWS with `project()` on the target frame; the foreground
  sill strip eats the bottom ~7% of every frame. A clamp priced at a box's CORNER must ask whether
  that corner is the *world's* edge — on a world-edge box (far bank `x1 === GW`) the test is
  trivially true and silently disables the clamp. The sill is half DOM and DOM fails quietly: a CSS
  rule that fails to parse is silent (assert computed style), and a sill item that borrows space
  resizes the picture with no `resize` event — read screen coordinates off the frame. (#27–#99)

## Instruments
- **A probe's world is only as rewound as you make it, and you PIN the instant rather than wait for
  it.** `__reseed()`/`__setTime()` rewind the PRNG and clock, not latches or spawned agents.
  The renderer draws from the PRNG: reseed, then step inside ONE `page.evaluate`; fresh page per
  screenshot. `__warp` never draws and a canvas read after `requestAnimationFrame` is unpinned —
  call `drawScene(simT, 1/30)` inside the evaluate. A wall-clock wait jitters by sim minutes;
  `__warp(t)` advances whole fixed-dt steps (~0.067 s), so a step count is not a clock: loop on
  `day`, measure durations as `simT` deltas. An instant is a *phase as well as an hour* — hold both
  fixed across any axis you vary, or the axis measures the season. `deviceScaleFactor` 3 is a
  DIFFERENT world from 1×, `?t=<n>` a different world from a warp off the default start. A PAGE clip needs
  `getBoundingClientRect()`'s offset AND `project()`'s CSS px scaled by
  `r.width / (canvas.width / devicePixelRatio)`; a `ctx` read needs neither. `ls probes/`. (#3-#101)
- **A zero is evidence only if you show the test can be non-zero; a green anchor only if the
  predicate FIRED.** Anchor a negative on the state the **bug** would leave, print the margin and
  the raise count, run it on HEAD; a candidate IDENTICAL to HEAD is a predicate that never fired.
  Suspect the INSTRUMENT first: a probe holding its own copy of the page's strings is a delayed
  bug (`evaluate()` can name the consts); print a **range**, not a floored margin; a field added
  to one `take()` is blind on every other `__entities` kind. The motion gate's jump is d > ABS_JUMP AND
  d > 8× the entity's MEDIAN step in 60 s, so a fast thing that mostly stands flips on the reshuffle
  alone — replay on HEAD. Its scenes are days 3, 7, 11, 19, 22: a feature on days 12–18 is
  invisible to it. (#31–#93)
- **Judge a look from a DIFFERENCE IMAGE and a number, never two pictures in turn — and grade it at
  the SHIPPING size.** The eye normalises: frames 65 luma apart at the core read as identical
  side by side. But a diff answers "is it drawn", not "can it be seen": legibility is MASS and
  COHERENCE, not peak Δ (nine puffs on a 0.3 jitter are nine dots; eighteen on 0.14 are a plume, at
  the same alpha), and what reads as weather is CONTRAST — present-or-absent with sun between, not
  all present at different strengths. Cross-correlating non-negative profiles is DC-dominated and
  answers "it did not move": mean-subtract. `filmstrip.mjs`'s Δ is a whole-frame mean at a
  0.35 s gap — a RATE, blind under ~2% of the canvas and loud about anything global: divide by
  frames in the gap, split cached from live, crop to your feature, and grade against NEIGHBOURS
  (`pops.mjs`). (#8–#104)
