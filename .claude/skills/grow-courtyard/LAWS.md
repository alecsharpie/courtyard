# Laws
True of the NEXT vector; what is only true of what you built goes in the ledger.
Cap 60 laws / 12 KB — the binding one is BYTES. Claims here; examples in the source.

## Inherited (Solvista)
- **Locate before you judge; compare against a control you RAN — and price the brief's PREMISE the
  same way.** Check the inventory *and* grep the source: the town usually already has what a brief
  sees "no trace" of, and a read means what the record IS, not what its name says. A gate that fails
  on HEAD is not a gate; a control returning the candidate's numbers is none. When a brief says a
  thing has NEVER happened, COUNT it on HEAD; an inventory line written by the pass that wrote the
  brief is no witness. A control must test a build-INDEPENDENT fact, never a predicate the
  candidate DEFINES, and must differ from the thing measured in exactly ONE way — a rut read against
  "everywhere else" is the road; read against its MIRROR across the crown it is the rut. And a mean over a set whose MEMBERSHIP is drawn per sample measures the membership, not the
  property. (#6–#135)
- **One predicate, one definition — read a footprint back off the grid, never re-derive it.** Routes
  are WAYPOINTS and nobody reads the grid between them, so a non-walkable cell holds only where a
  route's ENDPOINTS are chosen: keep it out of every target set. A naming predicate is usually a
  FALL-THROUGH, so the box it answers with is not the surface — `pavingAt()` calls river cells
  "quay": intersect the GRID before counting off it. A solve must hand its consumer **the value it TESTED**: a `-=` walk drifts below what the predicate floors. A lookup answering for a REGION off its FIRST matching cell (`plotCrop`)
  answers with whichever cell the loop reached first. And widening a shared helper's SIGNATURE
  changes every caller: grep them all — the missing argument arrives `undefined` and a colour off NaN
  still paints something plausible. (#24–#136)

## This town
- **Every random draw goes through `R()`** (or `hash(x,y)` per cell); `Math.random()` is invisible to
  `?seed=`. `hash()` is NOT seeded, so the built FABRIC is one town in every world and only its life
  varies; a per-day `hash(day,k)` is one sample of the calendar in every seed, so histogram the year.
  Key any schedule a USER input gates to `hash()`, never `R()`. **Any new draw reshuffles the whole seeded world**: the census churns everywhere and motion
  gates fire on kinds you never touched — read it for *collapse*, not delta, replay every stray gate
  on HEAD, and keep each branch on the half of [0,1) it owned. **Two seeds is not a sample.** A
  stream shift can still be proved CONTAINED by measuring BEFORE its first divergence. **At small n a
  threshold is not a share**: `h < 1/3` over fifteen members is a binomial and a run of seven is
  ordinary — when the COUNT is what you want, rank the members by their own hash and cut at the
  quantiles. (#2–#138)
- **The renderer's five traps.** (a) `project()` pinches on *screen* depth and LIFTS z NORTHWARD:
  each cell of height on a near volume walks it ~1.15 rows UP the frame — price a foreground against
  what is BEHIND it. (b) Roofs are emergent from `buildVolumes()`: change a footprint, never a roof,
  and two solid footprints that TOUCH are one roof. (c) Two figures nearer than ~0.9 cells render as
  one shape — move a scatter's centre, not its members, and let a displacement OWN the tick (`return`
  after the shove). (d) Height is read off the place under the feet (`agentZ`, `nearZ`) EVERY frame, never written at
  spawn, and a 2×2 vertex average reaches a row past the cell asked about. (e) A world offset added
  to a PROJECTED coordinate is a PIXEL and the projection is not linear in it — solve BOTH ends of a
  stroke in world space and project each. (#4–#138)
- **Time is compressed, and a walk is priced at its CHOICE and spent on its way.** A day is 55 s:
  ~2 s is state, a ~40 s trip is a resident. Caps set inflow, trip length sets population — floor the
  arrival *rate*, end a population by sending nobody new, and measure **presence**, not a per-instant
  crop. A place-holder whose visit outlasts its window makes arrivals/day ≈ cap whatever the rate:
  price presence as rate × visit BEFORE choosing the cap. Price ARRIVAL against the window's END,
  open it a trip EARLIER than its hour, and bound BOTH ends — a window with only a LANDING bound is a
  marathon-walker factory, and its END is the hour the last person is GONE, so the walk home is
  priced at the choice too. Walking is ~5.2 cells/h and en-route holds are unpriced: price N places
  as N × (leg + stand); when a window prices to zero, widen the WINDOW, not the speed. An arrival
  HOUR is a fact about GATE DISTANCE. Price a choice only on what cannot be re-priced on ARRIVAL: a predicate that asks again when it matters must not ALSO be asked hours
  upstream. **A unit of work DRAWN before it is PRICED makes the price all-or-nothing** — solve the
  room the unit has and take `min(drawn, room)` against a floor. (#2–#139)
- **A feature that exists may exist at a rate of zero — count before you build on it.** A spawn band
  is a *share of a budget*, not a rate, so a rare thing needs its OWN source; a linear cap with no
  knee buys only the branch nearest the source, so the SHARE, not the ceiling, is the cap beneath the
  cap. Measure a share at the CHOICE, never by presence, which weights a branch by its dwell — a
  species sown as often as three others can be 3% of what STANDS because it alone dies back — but
  histogram the OUTCOME too: the block your choice lands in is SHARED, so a guard written for the
  timer also fires for rain, dusk and a full seat. Watch the CAP's membership the same way: a band
  capped on `things.filter(p).length` counts every later population that also satisfies `p`, and the
  original starves without a line changing — **define membership POSITIVELY at the source (a flag on
  the spawn literal, inherited by every branch), never as a residual of subtractions** — then SWEEP
  the cap and keep the KNEE. A cap over PLACE-HOLDERS is a cap on the sub-caps beneath it, and a
  place that RESERVES nothing is not a place. Instrument a compound predicate CLAUSE BY CLAUSE in
  its own evaluation order: the loudest refusal is usually the cheap boolean in front of the
  arithmetic. (#7–#137)
- **A ceiling is not a kill term, and a scalar is not a switch**: a system that ages out what sits at
  its ceiling is emptied by lowering it. Give a scalar that can reach zero per-cell variance
  (`hash(x,y+k) > c`) at the grain the region is ADDRESSED by; split the behaviour boolean from
  the 0..1 intensity draw sites multiply (`isWindy`/`windF`). A slow world scalar wants a rate cap and `tgt > x` / `tgt < x`,
  never `else` — AT the target the else branch runs and it flickers ±r. An accumulator-fed per-cell
  field needs **PROPORTIONAL** decay; flat subtraction quantises the map to {0, cap}. **An
  accumulator is a RATE as well as a field**: a durable mark whose source recurs more slowly than the
  field decays never accrues, so the lasting part belongs in the FABRIC and only the recent part in
  the CA. And two named scalars are often ONE axis (`greyF()` *is* `1 - 2*warmth`). (#3–#135)
- **The night's clock and the sun's hour are two axes, and the gap between them BREATHES with the
  season.** `nightF`'s edges sit `NIGHT_K*dayHours` (1.7 h winter, 2.5 h summer) outside sunrise and
  sunset, so anything happening *at first light* keys on `sunUp`, never on the night's span. A
  predicate on the LIGHT is a predicate on the HOUR, and `!daylight` / `nightF>0.3` is DAWN as well as
  dusk: any rule ending something because the light is low must be bounded on BOTH sides of noon. A
  **hard-coded HOUR in a light or warmth term is a seasonal bug invisible to a screenshot** — an hour
  that is exactly midwinter's sunrise is three hours late in July; solve an hour OF THE SUN at the
  instant it applies, and fixing the MORNING half of such a term leaves the evening half wrong. And
  `day` rolls at hour 6, so it holds TWO dawns. (#12–#132)
- **The ground is a CACHE and the night is a COMPOSITE.** `drawBlocks`/`drawGround` rebuild at
  whatever cadence sets the dirty flag most often, so a per-frame truth on a facade or the ground is a
  live overlay: register at cache time, repaint live. An accumulator a cache pass fills (`LIT[]`) is
  reset by it; what you lift out of a cache carries what was drawn ON TOP of it (`frame-cost.mjs`, not
  `perf.mjs`); anything registered in SCREEN space at cache time (`FACES`) goes stale through the
  camera ease — map it through `k = viewS/gview.s`. A night colour is set by the LAST composite that
  touches it: anything drawn live before `applyLight`'s multiply is slate by midnight, so it must
  REGISTER its point and be repainted in a `screen` pass after — "it is drawn" is not "it can be
  seen". (#39–#136)
- **The FRAMING decides what exists: bound the near world in DEPTH, and anchor it on the sill.**
  `sillTop()` eats the bottom ~7% of every frame, and the world depth it lands at is a function of the
  window, not a constant (it moves ~40 cells across the sizes we ship). No world-space ROW bound is
  safe at every size: bound a near band in DEPTH (`y − z·LIFT`, world state) for the SHORTEST framing
  you support. A SCREEN cull is different: exact against the CANVAS
  rect, never the picture above `sillTop()`, and its margin is the DRAWN extent, never the centre.
  And a quarter cannot reach the world's edge by ZOOMING — move the extent, not the zoom. (#27–#134)
- **A probe's world is only as rewound as you make it — and suspect the INSTRUMENT first.**
  `__reseed()`/`__setTime()` rewind the PRNG and clock, not latches or spawned agents; frames drawn at
  page load move the PRNG, so without `__reseed()` even HEAD's own `windF` flips across runs. Reseed,
  then step inside ONE `page.evaluate`, fresh page per screenshot. **`__reseed()` REASSIGNS `R`, it
  does not rewind it** — a monkeypatch installed before it is silently eaten and the probe reports a
  clean, plausible, wrong attribution: instrument AFTER the reseed and assert it fired. PIN the
  instant (`drawScene(simT, 1/30)` inside the evaluate); `__warp(t)` advances
  whole fixed-dt steps, so a step count is not a clock; an instant is a *phase as well as an hour* and
  is VIEWPORT-dependent; and two builds can be BYTE-IDENTICAL at an instant they have not diverged at
  yet, so pick a divergent one. Read the canvas in the SAME evaluate as the draw (`toDataURL()`): a
  `?pause`d page still runs rAF. Carry a SIM FINGERPRINT through any before/after. A probe calling `lookAt(project(...))` proves the NAMING, never the POINTER — drive a
  real `mousemove`/tap where the thing is DISPLAYED, ONE tap per page. **A gate's PASS is only
  evidence about the fields it REPORTS** — read the reporter, not the producer. `perf.mjs` is
  vsync-locked over a whole sim day and blind to a pass expensive only in a rare weather: time the
  FUNCTION, in its weather, at every camera. And a ZERO is evidence only if you show the test can be
  non-zero, a green anchor only if the predicate FIRED. (#3–#139)
- **Judge a look from a DIFFERENCE IMAGE and a number, never two pictures in turn — and grade it at
  the SHIPPING size.** A diff answers "is it drawn", not "can it be seen": legibility is MASS and
  COHERENCE, not peak Δ, and what reads as weather is CONTRAST. Absolute luma sd under a compositing
  wash is not a property of what you DREW: grade a foreground on **sd/mean**. A diff needs a **SAME-CODE control run**: quote the feature's mass as a
  ratio to that floor, never as an absolute. `filmstrip.mjs`'s Δ is a whole-frame RATE, blind under
  ~2% of the canvas and loud about anything global — crop to your feature.  **One uniform hash is a texture, never a PLACE**: to make scattered things look
  gathered, gate a fine hash by a coarse one at the scale the gathering happens on. And a surface can
  be flat BY CONSTRUCTION rather than by accident — check whether its own hash term is scaled down
  before you decide it needs a new system. (#8–#135)
