# Laws
True of the NEXT vector; what is only true of what you built goes in the ledger.
Cap 60 laws / 12 KB — the binding one is BYTES. Claims here; examples in the source.

## Inherited (Solvista)
- **Locate before you judge; compare against a control you RAN — and price the brief's PREMISE the
  same way.** Check the inventory *and* grep the source: the town usually already has what a brief
  sees "no trace" of. Qualify every read by what the record IS, not what its name suggests. A
  gate that fails on HEAD is not a gate; a control returning the candidate's numbers is none;
  regenerate any fixture from `git show HEAD:` inside the probe. When a brief says a thing has NEVER
  happened, COUNT it on HEAD — 32/102 is not never. An inventory line written by the pass that wrote
  the brief is no second witness; an uncommitted WIP is UNPROVEN. (#6–#99)
- **One predicate, one definition — read a footprint back off the grid, never re-derive it.** Routes
  are WAYPOINTS and nobody reads the grid between them, so a non-walkable cell holds only where a
  route's ENDPOINTS are chosen: keep it out of every target set. And a naming predicate is usually a
  FALL-THROUGH, so the box it answers with is not the surface — `pavingAt()` calls 975 cells "quay",
  845 of them river; lane/towpath/cross are the same shape. Any count, spot-picker or CA seeded
  off such a box without intersecting the GRID is wrong by that factor. (#24–#114)

## This town
- **Every random draw goes through `R()`** (or `hash(x,y)` per cell); `Math.random()` is invisible to
  `?seed=`. A per-day `hash(day,k)` is seed-INDEPENDENT, so a 4-day window is one sample of the
  calendar in every world — histogram the year. (#90–#102)
- **Any new `R()` draw reshuffles the whole seeded world.** The census churns everywhere and motion
  gates fire on kinds you never touched (the size of the churn is in state.json's watch): read it
  for *collapse*, not delta, and replay every stray gate on HEAD. **Two seeds is not a sample** — run
  ten. Keep each branch on the half of [0,1) it owned. A change that shifts the stream can still be
  proved CONTAINED: measure at an instant BEFORE its first divergence — a gate needing `day >= 1`
  leaves day 0 bit-identical, and there the diff is pure draw. (#2–#119)
- **The renderer's four traps.** (a) `project()` pinches on *screen* depth and LIFTS z NORTHWARD:
  each cell of height on a near volume walks it ~1.15 rows UP the frame — price a foreground against
  what is BEHIND it, and anything standing on it by its own row.
  (b) Roofs are emergent from `buildVolumes()`: change a footprint, never a roof, and two solid
  footprints that TOUCH are one roof. (c) Two figures nearer than ~0.9 cells render as one shape —
  move a scatter's centre, not its members, and let a displacement OWN the tick (`return` after the
  shove). (d) Height is read off the place under the feet (`agentZ`, `nearZ`) EVERY frame, never
  written at spawn, and a stencil averaging a 2×2 of vertices reaches a row past the cell asked
  about. (#4–#106)
- **Time-compress everything you build.** A day is 55 s: ~2 s is state, a ~40 s trip is a resident.
  Caps set inflow, trip length sets population — floor the arrival *rate*, end a population by
  sending nobody new, and measure **presence**, not a per-instant crop. A place-holder whose visit outlasts
  its window makes arrivals/day ≈ cap whatever the rate: price presence as rate × visit BEFORE
  choosing the cap, and release the place as the walk OUT begins. (#2–#92)
- **A walk is priced at its CHOICE and spent on its way.** Price ARRIVAL against the window's END
  (the retire rule ends the stay, not arrival + dwell) and open it a trip EARLIER than its hour.
  Bound BOTH ends: a window with only a LANDING bound is a marathon-walker factory — at a closed
  hour the one branch that passes pricing is the longest walk. A window's END is the hour the last
  person is GONE, so price the walk home at the choice too, without charging one hour twice.
  Holds en route (`greet`, `listen`) are unpriced: a priced walker refuses them or carries a margin.
  Price "works the N places" as N × (leg + stand) at ~5.2 cells/h BEFORE choosing N; when a window
  prices to zero, widen the WINDOW, not the speed. A quarter's arrival HOUR is a fact about its GATE
  DISTANCE, not its source's window — count from each gate first, and give it a nearer door if that
  is the problem. Price a choice only on what cannot be re-priced on ARRIVAL: a predicate that will
  ask again when it matters (weather, a free seat) must not ALSO be asked hours upstream, or that
  double jeopardy deletes the branch on every day the world would have allowed it. (#32–#107)
- **A feature that exists may exist at a rate of zero — count before you build on it, and advertise
  it or nobody finds it.** A spawn band is a *share of a budget*, not a rate (`spawnLaneAgent` fires
  ~3.3×/day: a 4% band is one person per twelve days), so a rare thing needs its OWN source, and a new
  invitation joins `OFFERS`. Measure a share at the CHOICE, never by presence, which weights a
  branch by its dwell — but histogram the OUTCOME too, because the block your choice lands in is
  SHARED: timer expiry, rain, the sky and the failing light all reach one "the visit is over" branch,
  so a guard written for one fires for all four and the feature runs at zero while the counter says
  it fired. Watch the CAP's membership the same way: a band capped on
  `things.filter(p).length` counts every later population that also satisfies `p`, and the original
  starves without a line changing — so once membership is fixed, SWEEP the cap both ways and keep the
  KNEE: a ceiling that was binding through a bug is usually non-binding after it, and the limiter
  moves to the rate. (#7–#118)
- **A ceiling is not a kill term, and a scalar is not a switch**: a system that ages out what sits at
  its ceiling is emptied by lowering it. Give a scalar that can reach zero per-cell variance
  (`hash(x, y+k) > c`) at the grain the region is ADDRESSED by, and split the behaviour boolean from
  the 0..1 intensity draw sites multiply (`isWindy`/`windF`). A ceiling built from GEOMETRY is
  constant along its edge, so a rule capped by it paints a stripe, not a texture; a skip guard tests
  the REGION, never a field legitimately zero inside it. A slow world scalar wants a rate cap and
  `tgt > x` / `tgt < x`, never `else` — AT the target the else branch runs and it flickers ±r.
  Extending a CA to a SECOND region, mask the neighbour mean by region id: the shared border is
  bidirectional, so the new region's growth feeds the old one's creep term. (#3–#114)
- **The night's clock and the sun's hour are two axes, and the gap between them BREATHES with the
  season.** `nightF`'s edges sit `NIGHT_K*dayHours` (1.7 h winter, 2.5 h summer) outside sunrise and
  sunset, so anything happening *at first light* keys on `sunUp`, never on the night's span. One level down: a predicate on the LIGHT is a predicate on the HOUR, and `!daylight`
  / `nightF>0.3` is DAWN as well as dusk. Any rule that ends something because the light is low must
  be bounded on BOTH sides of noon, or it silently kills the early walk another rule was written to
  allow — the two pass each other without erroring. And a **hard-coded HOUR in a light or warmth term
  is a seasonal bug invisible to a screenshot**: 6.4 reads as correct at the equinox and sits 0.6 h
  before one solstice's sunrise, 2.4 h after the other's. An hour OF THE SUN is solved at the instant
  it applies; `sunUp` read hours ahead is stale by the seasonal swing. (#12–#112)
- **The ground is a CACHE and the night is a COMPOSITE.** `drawBlocks`/`drawGround` rebuild at
  whatever cadence sets the dirty flag most often, so a per-frame truth on a facade or the ground is
  a live overlay: register at cache time, repaint live. An accumulator a cache pass fills (`LIT[]`)
  is reset by it; what you lift out of a cache carries what was drawn ON TOP of it (`frame-cost.mjs`,
  not `perf.mjs`); anything registered in SCREEN space at cache time (`FACES`) goes stale
  through the camera ease — map it through `k = viewS/gview.s`. A night colour is set by the LAST composite
  that touches it: anything drawn live before `applyLight`'s multiply is slate by midnight, so put
  its warmth back in a `screen` pass after it. (#39–#93)
- **The FRAMING decides what exists: bound the near world in DEPTH, and anchor it on the sill.**
  `sillTop()` eats the bottom ~7% of every frame, and the world depth it lands at is a function of
  the window, not a constant (81.7 at 1280×700 through 120 on a phone). No world-space ROW bound on
  the near block is safe at every size: bound the band in DEPTH (`y − z·LIFT`, world state) for the
  SHORTEST framing you support, with a render-side guard after it — never in rows, because around a
  light well the same row is 1.7 of depth lower than on the pitch. A foreground cached into the
  ground is only as dark as what the CAMERA leaves visible: anchor its ramp on the sill line. A
  quarter's `share` sets s from WIDTH alone, so price a box's ROWS with `project()` on the target
  frame. (#27–#106)
- **A probe's world is only as rewound as you make it, and you PIN the instant rather than wait for
  it.** `__reseed()`/`__setTime()` rewind the PRNG and clock, not latches or spawned agents. The
  renderer draws from the PRNG: reseed, then step inside ONE `page.evaluate`, fresh page per
  screenshot. `__warp` never draws and a canvas read after `requestAnimationFrame` is unpinned — call
  `drawScene(simT, 1/30)` inside the evaluate. `__warp(t)` advances whole fixed-dt steps, so a step
  count is not a clock: loop on `day`, measure as `simT` deltas. An instant is a *phase as well as an
  hour* — hold both fixed across any axis you vary. And a probe calling `lookAt(project(...))` proves
  the NAMING, never the POINTER: it skips the event, which is where a screen-space bug lives. Drive a
  real `mousemove`/tap at the point the thing is DISPLAYED (canvas coords × `rect/W`), wait past
  `NAME_SETTLE` 0.12 s, ONE tap per page (two taps 320 ms apart on mobile are a double-tap zoom,
  which reads exactly like a hit-test bug). (#3–#113)
- **A zero is evidence only if you show the test can be non-zero; a green anchor only if the
  predicate FIRED.** Anchor a negative on the state the **bug** would leave, print the margin and the
  raise count, and run it on HEAD — a candidate IDENTICAL to HEAD is a predicate that never fired.
  Suspect the INSTRUMENT first: a probe holding its own copy of the page's strings is stale
  (`evaluate()` can name the consts), and **a gate's PASS is only evidence about the fields it
  REPORTS** — read the reporter (`summarize()`), not the producer (`__census()`). The motion gate's
  jump test is `d > ABS_JUMP AND d > 8× that kind's MEDIAN step in 60 s`, and at median **0.000**
  the second clause is vacuous — so real motion by a thing that mostly stands reads as a teleport;
  histogram its steps on HEAD. Its scenes are days 3, 7, 11, 19, 22. (#31–#114)
- **Judge a look from a DIFFERENCE IMAGE and a number, never two pictures in turn — and grade it at
  the SHIPPING size.** A diff answers "is it drawn", not "can it be seen": legibility is MASS and
  COHERENCE, not peak Δ, and what reads as weather is CONTRAST. A diff needs a **SAME-CODE control
  run**: `reseed + warp + drawScene` leaves ~1% of the frame unpinned at peak 90+, so quote the
  feature's mass as a ratio to that floor, never as an absolute. `filmstrip.mjs`'s Δ
  is a whole-frame mean at a 0.35 s gap — a RATE, blind under ~2% of the canvas and loud about
  anything global: divide by frames in the gap, split cached from live, crop to your feature, grade
  against NEIGHBOURS (`pops.mjs`). Moving a term to where another already peaks, price the COMPOSITE
  against the end of the day you did NOT touch — its own old value was damped by what you removed. To prove a gated change is CONTAINED, hash the canvas at pinned instants on
  both builds — better still, show the untouched AXIS is bit-identical across the year, which an
  `R()` reshuffle cannot fake. (#8–#114)
