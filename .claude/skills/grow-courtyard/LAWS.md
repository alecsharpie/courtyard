# Laws
True of the NEXT vector; what is only true of what you built goes in the ledger.
Cap 60 laws / 12 KB — the binding one is BYTES. Claims here; examples in the source.

## Inherited (Solvista)
- **Locate before you judge; compare against a control you RAN — and price the brief's PREMISE the
  same way.** Check the inventory *and* grep the source: the town usually already has what a brief
  sees "no trace" of, and a read means what the record IS, not what its name says. A gate that fails
  on HEAD is not a gate; a control returning the candidate's numbers is none. When a brief says a
  thing has NEVER happened, COUNT it on HEAD; an inventory line written by the pass that wrote the
  brief is no witness. A control must test a build-INDEPENDENT fact, never a predicate the candidate
  DEFINES, and must differ from the thing measured in exactly ONE way. And **a comment that
  measures two terms disagreeing is a BUG REPORT, not a description** — when the source explains why
  a constant is damped, check what it is damped *against*. (#6–#143)
- **One predicate, one definition — read a footprint back off the grid, never re-derive it.** Routes
  are WAYPOINTS and nobody reads the grid between them, so a non-walkable cell holds only where a
  route's ENDPOINTS are chosen: keep it out of every target set. A naming predicate is usually a
  FALL-THROUGH, so the box it answers with is not the surface: intersect the GRID before counting off
  it. A solve must hand its consumer **the value it TESTED**: a `-=` walk drifts below what the
  predicate floors. A lookup answering for a REGION off its FIRST matching cell (`plotCrop`) answers
  with whichever cell the loop reached first. (#24–#136)

## This town
- **Every random draw goes through `R()`** (or `hash(x,y)` per cell); `Math.random()` is invisible to
  `?seed=`. `hash()` is NOT seeded, so the built FABRIC is one town in every world and only its life
  varies; a per-day `hash(day,k)` is one sample of the calendar in every seed, so histogram the year.
  **Any new draw reshuffles the whole
  seeded world**: the census churns everywhere and motion gates fire on kinds you never touched —
  read it for *collapse*, not delta, replay every stray gate on HEAD, and keep each branch on the
  half of [0,1) it owned. **Two seeds is not a sample**, and at small n a threshold is not a share:
  when the COUNT is what you want, rank the members by their own hash and cut at the quantiles.
  (#2–#138)
- **The renderer's six traps.** (a) `project()` pinches on *screen* depth and LIFTS z NORTHWARD: each
  cell of height on a near volume walks it ~1.15 rows UP the frame — price a foreground against what
  is BEHIND it, and a NEGATIVE z is the mirror of a positive one. (b) Roofs are emergent from
  `buildVolumes()`: change a footprint, never a roof, and two solid footprints that TOUCH are one
  roof. (c) Two figures nearer than ~0.9 cells render as one shape — move a scatter's centre, not its
  members, and let a displacement OWN the tick (`return` after the shove); two MOVERS on a track
  share a CORRIDOR, not a point, so sweep their whole paths against each other and offset BOTH ends
  equally. (d) Height is read off the place under the feet (`agentZ`, `nearZ`) EVERY frame, never
  written at spawn. (e) A world
  offset added to a PROJECTED coordinate is a PIXEL and the projection is not linear in it — solve
  BOTH ends of a stroke in world space and project each. (f) A cast image's TARGET SET is a
  VISIBILITY question before a geometry one: because (a) lifts a volume up the frame, a NORTHWARD
  throw must be vetoed per column or it paints the caster's own roof — and price its EXTENT off
  `-S/S[2]` first, since `sunVec()` is a stylised HIGH sun (65–76° at midday: a 5.4-cell wall reaches
  two cells). Quads that must not double-darken are ONE path filled ONCE. (#4–#140)
- **Time is compressed, and a walk is priced at its CHOICE and spent on its way.** A day is 55 s: a
  ~40 s trip is a resident. Caps set inflow, trip length sets population — floor the arrival *rate*,
  end a population by sending nobody new, and measure **presence**, not a per-instant crop. A
  place-holder whose visit outlasts its window makes arrivals/day ≈ cap whatever the rate: price
  presence as rate × visit BEFORE choosing the cap. Price ARRIVAL against the window's END, open it a
  trip EARLIER than its hour, and bound BOTH ends — a window with only a LANDING bound is a
  marathon-walker factory, and its END is the hour the last person is GONE, so the walk home is
  priced at the choice too. Walking is ~5.2 cells/h; price N places as N × (leg + stand). **A unit of work DRAWN before it
  is PRICED makes the price all-or-nothing** — solve the room the unit has and take `min(drawn,
  room)` against a floor. And **staleness and untruth are two clocks**: how long anyone will WAIT for
  a line is not when it stops being TRUE. (#2–#142)
- **A feature that exists may exist at a rate of zero — count before you build on it.** A spawn band
  is a *share of a budget*, not a rate, so a rare thing needs its OWN source; a linear cap with no
  knee buys only the branch nearest the source, so the SHARE, not the ceiling, is the cap beneath the
  cap. **A cap and a share are two bounds and only one can be swept**: re-weight the branch, then
  re-sweep, because the sweep is what reveals the ceiling has stopped binding at all — identical
  numbers at two settings is a DEAD constant, not headroom. Re-weighting a cascade must name which
  band PAYS — taken proportionally from a whole tail, a variety a picture would miss is spent
  silently. Measure a share at the CHOICE, never by presence, which weights a branch by its dwell.
  Watch the CAP's membership the same way: a band capped on `things.filter(p).length` counts every
  later population that also satisfies `p` — **define membership POSITIVELY at the source (a flag on
  the spawn literal, inherited by every branch), never as a residual**, and end it positively at the
  CLAIM: a one-shot choice guarded only by the state it CONSUMES is re-entrant the moment that state
  is duplicated. A place that RESERVES nothing is not a place. Instrument a compound predicate CLAUSE
  BY CLAUSE in its own evaluation order: the loudest refusal is usually the cheap boolean in front of
  the arithmetic. (#7–#144)
- **A ceiling is not a kill term, and a scalar is not a switch**: a system that ages out what sits at
  its ceiling is emptied by lowering it. Give a scalar that can reach zero per-cell variance
  (`hash(x,y+k) > c`) at the grain the region is ADDRESSED by; split the behaviour boolean from the
  0..1 intensity draw sites multiply (`isWindy`/`windF`). A slow world scalar wants a rate cap and
  `tgt > x` / `tgt < x`, never `else` — AT the target the else branch runs and it flickers ±r. An
  accumulator-fed per-cell field needs **PROPORTIONAL** decay; flat subtraction quantises the map to
  {0, cap}. **An accumulator is a RATE as well as a field**: a durable mark whose source recurs more
  slowly than the field decays never accrues, so the lasting part belongs in the FABRIC and only the
  recent part in the CA. (#3–#135)
- **The night's clock and the sun's hour are two axes, and the gap between them BREATHES with the
  season.** `nightF`'s edges sit `NIGHT_K*dayHours` (1.7 h winter, 2.5 h summer) outside sunrise and
  sunset, so anything happening *at first light* keys on `sunUp`, never on the night's span. `!daylight` / `nightF>0.3` is DAWN as well as
  dusk: any rule ending something because the light is low must be bounded on BOTH sides of noon. A
  **hard-coded HOUR in a light or warmth term is a seasonal bug invisible to a screenshot**: solve an
  hour OF THE SUN at the instant it applies, and fixing the MORNING half of such a term leaves the
  evening half wrong. Re-keying a term onto the sun moves its OFFSET, and its WIDTH must then stay
  FIXED — scaling both makes the value at sunset+k a function of the season again, which was the
  fault; scale a width only when the thing is the night's clock (`dawnF`). And `day` rolls at hour 6,
  so it holds TWO dawns. (#12–#143)
- **The ground is a CACHE and the night is a COMPOSITE.** `drawBlocks`/`drawGround` rebuild at
  whatever cadence sets the dirty flag most often, so a per-frame truth on a facade or the ground is a
  live overlay: register at cache time, repaint live. What you lift out of a cache carries what was drawn ON TOP of it (`frame-cost.mjs`, not
  `perf.mjs`); anything registered in SCREEN space at cache time (`FACES`) goes stale through the
  camera ease — map it through `k = viewS/gview.s`. A night colour is set by the LAST composite that
  touches it: anything drawn live before `applyLight`'s multiply is slate by midnight, so it must
  REGISTER its point and be repainted in a `screen` pass after — "it is drawn" is not "it can be
  seen". (#39–#136)
- **The FRAMING decides what exists: bound the near world in DEPTH, and anchor it on the sill.**
  `sillTop()` eats the bottom ~7% of every frame, and the world depth it lands at is a function of the
  window, not a constant (~40 cells across the sizes we ship). No world-space ROW bound is safe at
  every size: bound a near band in DEPTH (`y − z·LIFT`, world state) for the SHORTEST framing you
  support. A quarter cannot reach the world's edge by ZOOMING — move the extent, not
  the zoom. And the frame decides what COMPETES: **a contention price is only a price where there IS
  contention**, so a rule ranking callers on a shared surface binds at Wide and slides off at a
  quarter, where `inView` has already filtered the others out. There the CADENCE against the
  surface's CAPACITY is the whole answer — a 55 s day holds ~22 ticker lines at `TICK_DWELL`. Count
  the slots before designing the queue. (#27–#142)
- **A probe's world is only as rewound as you make it — and suspect the INSTRUMENT first.**
  `__reseed()`/`__setTime()` rewind the PRNG and clock, not latches or spawned agents; frames drawn at
  page load move the PRNG, so without `__reseed()` even HEAD's own `windF` flips across runs. Reseed,
  then step inside ONE `page.evaluate`, fresh page per screenshot. **`__reseed()` REASSIGNS `R`, it
  does not rewind it** — a monkeypatch installed before it is silently eaten and the probe reports a
  clean, plausible, wrong attribution: instrument AFTER the reseed and assert it fired. PIN the
  instant (`drawScene(simT, 1/30)` inside the evaluate); `__warp(t)` advances whole fixed-dt steps, so
  a step count is not a clock. Read the canvas in the SAME evaluate as the draw
  (`toDataURL()`): a `?pause`d page still runs rAF. **A gate's PASS is only evidence about the fields it REPORTS** — read
  the reporter, not the producer: `perf.mjs` is vsync-locked over a whole sim day and blind to a pass
  expensive only in a rare weather, so time the FUNCTION, in its weather, at every camera. A ZERO is
  evidence only if you show the test can be non-zero, a green anchor only if the predicate FIRED.
  (#3–#139)
- **Judge a look from a DIFFERENCE IMAGE and a number, never two pictures in turn — and grade it at
  the SHIPPING size.** A diff answers "is it drawn", not "can it be seen": legibility is MASS and
  COHERENCE, not peak Δ. Absolute luma sd under a compositing
  wash is not a property of what you DREW: grade a foreground on **sd/mean**. A diff needs a
  **SAME-CODE control run**: quote the feature's mass as a ratio to that floor, never as an absolute.
  `filmstrip.mjs`'s Δ is a whole-frame RATE, blind under ~2% of the canvas and loud about anything
  global — crop to your feature. **One uniform hash is a texture, never a PLACE**: to make scattered
  things look gathered, gate a fine hash by a coarse one at the scale the gathering happens on. And a
  surface can be flat BY CONSTRUCTION rather than by accident — check whether its own hash term is
  scaled down before you decide it needs a new system. (#8–#135)
