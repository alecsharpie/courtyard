# Laws
True of the NEXT vector; what is only true of what you built goes in the ledger.
Cap 60 laws / 12 KB — the binding one is BYTES. Claims here, examples in the source.

## Inherited (Solvista)
- **Locate before you judge; compare against a control you RAN — and price the brief's PREMISE the
  same way.** Check the inventory *and* grep the source, incl. for a TIMER: the town usually already has the
  countdown a brief sees "no trace" of. Qualify every read by what the record currently IS,
  not what its name suggests. A gate that fails on HEAD is not a gate; a control returning the
  candidate's numbers is none; regenerate any fixture from `git show HEAD:` inside the probe. When a
  brief says a thing has NEVER happened, COUNT it on HEAD — 32/102 is not never. An inventory line
  written by the pass that wrote the brief is not a second witness, and an uncommitted WIP is
  UNPROVEN. (#6–#99)
- **One predicate, one definition — read a footprint back off the grid, never re-derive it.** Routes
  are WAYPOINTS and nobody reads the grid between them, so a non-walkable cell holds only where a
  route's ENDPOINTS are chosen: keep it out of every target set. (#24, #41, #84)

## This town
- **Every random draw goes through `R()`** (or `hash(x,y)` per cell); `Math.random()` is invisible to
  `?seed=`. A per-day `hash(day,k)` is seed-INDEPENDENT, so a 4-day window is one sample of the
  calendar in every world — histogram over the year instead. (#90–#102)
- **Any new `R()` draw reshuffles the whole seeded world.** The census churns everywhere (HEAD's own
  spread on identical code is 19%) and motion gates fire on kinds you never touched: read the census
  for *collapse*, not delta, and replay every stray gate on HEAD. **Two seeds is not a sample** — run
  ten. Keep each branch on the half of [0,1) it owned, (#2–#96)
- **The renderer's four traps.** (a) `project()` pinches on *screen* depth and LIFTS z NORTHWARD:
  every cell of height on a near volume walks it ~1.15 rows UP the frame, into what it should stand
  in front of — price a foreground against what is BEHIND it, and anything standing on it by its own
  row. (b) Roofs are emergent from `buildVolumes()`: change a footprint, never a roof, and two solid
  footprints that TOUCH are one roof. (c) Two figures nearer than ~0.9 cells render as one shape —
  move a scatter's centre rather than its members, and let a displacement OWN the tick (`return`
  after the shove, or the walker's step undoes it). (d) Height is read off the place
  under the feet (`agentZ`, `nearZ`) EVERY frame, never written at spawn — and a stencil averaging a
  2×2 of vertices reaches a row past the cell you asked about. (#4–#106)
- **Time-compress everything you build.** A day is 55 s: ~2 s is state, a ~40 s trip is a resident.
  Caps set inflow, trip length sets population — floor the arrival *rate*, end a population by
  sending nobody new, and measure **presence**, not a per-instant crop. A place-holder whose visit
  outlasts its window makes arrivals/day ≈ cap whatever the rate: price presence as rate × visit
  BEFORE choosing the cap, and release the place as the walk OUT begins. (#2–#92)
- **A walk is priced at its CHOICE and spent on its way.** Price ARRIVAL against the window's END
  (the retire rule ends the stay, never arrival + dwell) and open it a trip EARLIER than its hour.
  Bound BOTH ends: a window with only a LANDING bound is a marathon-walker factory, because at a
  closed hour the one branch that passes pricing is the longest walk. A window's END is the hour the
  last person is GONE, so price the walk home at the choice too — but do not charge one hour twice.
  Every hold en route (`greet`, `listen`, `cartShove`) is unpriced: a priced walker refuses the
  optional ones or carries a margin. Price "works the N places" as N × (leg + stand) at ~5.2 cells/h
  BEFORE choosing N; when a window prices to zero, widen the WINDOW, not the speed. An hour OF THE
  SUN is solved at the ARRIVAL instant — `sunUp` read hours ahead is stale by the seasonal swing, so
  fixed-point it on `sunAt(t)`. (#32–#101)
- **Two corollaries on pricing.** A quarter's arrival HOUR is a fact about its GATE DISTANCE, not its
  source's window: when every branch is 8–11 h of walking, no set-out hour can make a morning, so
  count the walk from each gate FIRST and give the place a nearer door if that is the problem. And
  price a choice only on what cannot be re-priced on ARRIVAL — a predicate that will ask again at the
  moment it matters (weather, a free mooring, a free seat) must not ALSO be asked hours upstream.
  That is double jeopardy, and it deletes the branch on every day the world would have allowed it.
  (#107)
- **A feature that exists may exist at a rate of zero — count before you build on it, and advertise
  it or nobody finds it.** A spawn band is a *share of a budget*, not a rate (`spawnLaneAgent` fires
  ~3.3×/day: a 4% band is one person per twelve days), so a rare thing needs its OWN source and a new invitation joins `OFFERS`. Traffic has an ARRIVAL-HOUR histogram, not just a rate: a daylight-priced
  offer sited 12 h of walking from its source runs at zero however well priced. Measure a share at
  the CHOICE — never by presence, which weights each branch by its dwell and leaks across the day
  roll. A threshold in a brief is a hypothesis: histogram the field first, (#7–#96)
- **A slow world scalar wants a cap, a cycle and an anchor — and exact at the anchor is not exact in
  the HISTORY.** Rate-cap it, so "it never steps" is one number; step it with `tgt > x` / `tgt < x`,
  never `else` (AT the target the else branch runs and it flickers ±r at its cap). But a sign or a latch steers state, so the frame differs
  from HEAD even AT the anchor: force the anchor over the whole run and hash the canvas. (#3–#91)
- **A ceiling is not a kill term, and a scalar is not a switch**: a system that ages out what sits at
  its ceiling is emptied by lowering it. Give a scalar that can reach zero per-cell variance
  (`hash(x, y+k) > c`) at the grain the region is ADDRESSED by, and split the boolean for behaviour
  from the 0..1 intensity draw sites multiply (`isWindy`/`windF`). A ceiling built from GEOMETRY is constant
  along its edge, so a rule capped by it paints a stripe, not a texture. A skip
  guard must test the REGION, never a field legitimately zero inside it: `!shelter && !value` means
  "not my cell" only until the value first reaches zero. (#7–#103)
- **The night's clock and the sun's hour are two axes, and the gap between them BREATHES with the
  season.** `nightF`'s edges sit `NIGHT_K*dayHours` (1.7 h in winter, 2.5 h in summer) outside
  sunrise and sunset, so anything that should read as happening *at first light* must key on `sunUp`,
  never on the night's span — keyed on the span it lands after sunrise, and later the longer the day.
  One level down: a predicate on the LIGHT is a predicate on the HOUR, and `!daylight` / `nightF>0.3`
  is DAWN as well as dusk. Any rule that ends something because the light is low must be bounded on
  BOTH sides of noon, or it silently kills the early walk another rule was written to allow — the two
  pass each other without erroring, because the walker still exists and still arrives somewhere.
  (#12, #82, #108, #109)
- **Ask what else enters a shared block before you queue anything inside it.** Timer expiry, rain,
  the sky and the failing light all land in the same "the visit is over" branch, so a guard written
  for one fires for all four — and the feature it protects runs at a rate of zero while a counter on
  the *choice* still says the choice is firing. Histogram the OUTCOME, not the choice. Same shape when you turn a constant into a variable: the
  rest of the file keeps its hard-coded copy and nothing errors, and the day rolls at `hour 6.00`
  (`nid` is the epoch key that survives that seam). (#12–#108)
- **The ground is a CACHE and the night is a COMPOSITE.** `drawBlocks`/`drawGround` rebuild at
  whatever cadence sets the dirty flag most often, so a per-frame truth on a facade or the ground is
  a live overlay: register at cache time, repaint live. An accumulator a cache pass fills (`LIT[]`)
  is reset by it; what you lift out of a cache carries what was drawn ON TOP of it (`frame-cost.mjs`,
  not `perf.mjs`); anything registered in SCREEN space at cache time (`FACES`, `gview`) is stale for
  the camera ease — map it through `k = viewS/gview.s`. And a night colour is set by the LAST
  composite that touches it: anything drawn live before `applyLight`'s multiply is slate by midnight,
  so put its warmth back in a `screen` pass after it. (#39–#93)
- **The FRAMING decides what exists: bound the near world in DEPTH, and anchor it on the sill.**
  `sillTop()` eats the bottom ~7% of every frame, and the world depth it lands at is a function of
  the window, not a constant (81.7 at 1280×700 through 120 on a phone). No world-space ROW bound on
  the near block is safe at every size: bound the band in DEPTH (`y − z·LIFT`, which is world state)
  for the SHORTEST framing you support, and put a render-side guard after it for the rest. Never in
  rows — around a light well the roof drops to nothing, so the same row is 1.7 of depth lower on a
  lip than on the pitch. A foreground element cached into the ground is only as dark as what the
  CAMERA leaves visible: anchor a foreground ramp on the sill line, never on the world row that
  happens to meet it. A quarter's `share` sets s from WIDTH alone, so price a box's ROWS with
  `project()` on the target frame; (#27–#106)
- **A probe's world is only as rewound as you make it, and you PIN the instant rather than wait for
  it.** `__reseed()`/`__setTime()` rewind the PRNG and clock, not latches or spawned agents. The
  renderer draws from the PRNG: reseed, then step inside ONE `page.evaluate`, fresh page per
  screenshot. `__warp` never draws and a canvas read after `requestAnimationFrame` is unpinned — call
  `drawScene(simT, 1/30)` inside the evaluate. `__warp(t)` advances whole fixed-dt steps, so a step
  count is not a clock: loop on `day`, measure durations as `simT` deltas. An instant is a *phase as
  well as an hour* — hold both fixed across any axis you vary, or the axis measures the season.
  `ls probes/`. (#3–#101)
- **A zero is evidence only if you show the test can be non-zero; a green anchor only if the
  predicate FIRED.** Anchor a negative on the state the **bug** would leave, print the margin and the
  raise count, and run it on HEAD — a candidate IDENTICAL to HEAD is a predicate that never fired.
  Suspect the INSTRUMENT first: a probe holding its own copy of the page's strings is a stale bug
  (`evaluate()` can name the consts), The motion gate's jump test is
  `d > ABS_JUMP AND d > 8× that kind's MEDIAN step in 60 s`, so a thing that mostly stands flips on
  the reshuffle alone — and when that median is exactly **0.000** the second clause is vacuous and
  any real motion reads as a teleport. Histogram that kind's steps on HEAD instead. Its scenes are days 3, 7, 11, 19, 22: a feature on days 12–18 is invisible. (#31–#106)
- **Judge a look from a DIFFERENCE IMAGE and a number, never two pictures in turn — and grade it at
  the SHIPPING size.** But a diff answers "is it drawn", not "can it be seen": legibility is MASS and COHERENCE, not
  peak Δ, and what reads as weather is CONTRAST — present-or-absent with sun between. A per-column
  diff over an OPAQUE object measures how much bare surface each column had, not whether the object
  is findable: take that signal inside the candidate, against a neighbour, with HEAD's 0.00 as
  control. `filmstrip.mjs`'s
  Δ is a whole-frame mean at a 0.35 s gap — a RATE, blind under ~2% of the canvas and loud about
  anything global: divide by frames in the gap, split cached from live, crop to your feature, grade
  against NEIGHBOURS (`pops.mjs`). To prove a gated change is CONTAINED, hash the canvas at pinned
  instants on both builds: identical outside the band, differing inside it — stronger than any pair
  of screenshots, and on a draw-only vector the census cannot see it is the whole gate. (#8–#109)
