# Laws
True of the NEXT vector; what is only true of what you built goes in the ledger.
Cap 60 laws / 12 KB — the binding one is BYTES. Claims here; examples in the source.

## Inherited (Solvista)
- **Locate before you judge; compare against a control you RAN — and price the brief's PREMISE the
  same way.** Check the inventory *and* grep the source: the town usually already has what a brief
  sees "no trace" of, and a read means what the record IS, not what its name says. A gate that fails
  on HEAD is not a gate; a control returning the candidate's numbers is none; regenerate fixtures
  from HEAD inside the probe. When a brief says a thing has NEVER happened, COUNT it on HEAD. An
  inventory line written by the pass that wrote the brief is no second witness; an uncommitted WIP is
  UNPROVEN. A control must test a build-INDEPENDENT fact, never a predicate the candidate DEFINES,
  or it hands back its own definition. An instrument built around a REGION clips the work done at its
  EDGE — measure a worker by POSITION relative to their own workplace, never by a box round it. And a
  mean over a set whose MEMBERSHIP is drawn per sample measures the membership, not the property:
  match the members across conditions first. (#6–#133)
- **One predicate, one definition — read a footprint back off the grid, never re-derive it.** Routes
  are WAYPOINTS and nobody reads the grid between them, so a non-walkable cell holds only where a
  route's ENDPOINTS are chosen: keep it out of every target set. A naming predicate is usually a
  FALL-THROUGH, so the box it answers with is not the surface — `pavingAt()` calls 845 river cells
  "quay". Any count, spot-picker or CA seeded off such a box without intersecting the GRID is wrong
  by that factor. A solve must hand its consumer **the value it TESTED**: a `-= 0.01` walk drifts to
  81.99999999, which floors to 81 in the predicate and 82 on the way out. And widening a shared
  helper's SIGNATURE changes every caller: grep them all, because the missing argument arrives
  `undefined` and a colour off NaN still paints something plausible. (#24–#130)

## This town
- **Every random draw goes through `R()`** (or `hash(x,y)` per cell); `Math.random()` is invisible to
  `?seed=`. `hash()` is NOT seeded — `?seed=` swaps `R()` alone, so the built FABRIC is one town in
  every world and only its life varies; a per-day `hash(day,k)` is one sample of the calendar in
  every seed, so histogram the year. When a USER input starts gating what the town says or draws,
  key its schedule to `hash()`, never `R()`, or where someone looks spends the seeded stream.
  **Any new draw reshuffles the whole seeded world**: the census churns everywhere and motion gates
  fire on kinds you never touched — read it for *collapse*, not delta, replay every stray gate on
  HEAD, and keep each branch on the half of [0,1) it owned. **Two seeds is not a sample** — run ten
  on the same mask. A stream shift can still be proved CONTAINED: measure BEFORE its first
  divergence — a gate needing `day >= 1` leaves day 0 bit-identical. (#2–#132)
- **The renderer's four traps.** (a) `project()` pinches on *screen* depth and LIFTS z NORTHWARD:
  each cell of height on a near volume walks it ~1.15 rows UP the frame — price a foreground against
  what is BEHIND it. (b) Roofs are emergent from `buildVolumes()`: change a footprint, never a roof,
  and two solid footprints that TOUCH are one roof. (c) Two figures nearer than ~0.9 cells render as
  one shape — move a scatter's centre, not its members, and let a displacement OWN the tick (`return`
  after the shove); a stop needs PAIR_GAP of margin all round, not just legal ground under itself, or
  it puts its COMPANION in the river. (d) Height is read off the place under the feet (`agentZ`,
  `nearZ`) EVERY frame, never written at spawn, and a 2×2 vertex average reaches a row past the cell asked
  about. (#4–#131)
- **Time is compressed, and a walk is priced at its CHOICE and spent on its way.** A day is 55 s:
  ~2 s is state, a ~40 s trip is a resident. Caps set inflow, trip length sets population — floor the
  arrival *rate*, end a population by sending nobody new, and measure **presence**, not a per-instant
  crop. A place-holder whose visit outlasts its window makes arrivals/day ≈ cap whatever the
  rate: price presence as rate × visit BEFORE choosing the cap. Price ARRIVAL against the window's END,
  open it a trip EARLIER than its hour, and bound BOTH ends — a window with only a LANDING bound is a
  marathon-walker factory. Its END is the hour the last person is GONE — price the walk home at the choice
  too. Walking is ~5.2 cells/h and en-route holds are unpriced: price N places as
  N × (leg + stand) before choosing N; when a window prices to zero, widen the WINDOW, not the speed.
  An arrival HOUR is a fact about GATE DISTANCE, not the source's window. Price a choice only on what
  cannot be re-priced on ARRIVAL: a predicate that asks again when it matters (weather, a free seat)
  must not ALSO be asked hours upstream — that double jeopardy deletes the branch on every day the
  world allows it. (#2–#107)
- **A feature that exists may exist at a rate of zero — count before you build on it.** A spawn band
  is a *share of a budget*, not a rate, so a rare thing needs its OWN source. Measure a share at the
  CHOICE, never by presence, which weights a branch by its dwell — but histogram the OUTCOME too: the
  block your choice lands in is SHARED, so a guard written for the timer also fires for rain, dusk and
  a full seat. Watch the CAP's membership the same way: a band capped on `things.filter(p).length`
  counts every later population that also satisfies `p`, and the original starves without a line
  changing — so once membership is fixed, SWEEP the cap and keep the KNEE. A cap over PLACE-HOLDERS
  is really a cap on the sub-caps beneath it: when it stops binding, the mix tips toward whichever
  sub-cap is largest, so check which KIND absorbed the slack. And instrument a compound predicate
  CLAUSE BY CLAUSE in its own evaluation order — a refusal total says nothing about which clause to
  loosen, and the loudest is usually the cheap boolean in front of the arithmetic. (#7–#131)
- **A ceiling is not a kill term, and a scalar is not a switch**: a system that ages out what sits at
  its ceiling is emptied by lowering it. Give a scalar that can reach zero per-cell variance
  (`hash(x,y+k) > c`) at the grain the region is ADDRESSED by, and split the behaviour boolean from
  the 0..1 intensity draw sites multiply (`isWindy`/`windF`). A skip guard tests the REGION, never a
  field legitimately zero inside it. A slow world scalar wants a rate cap and `tgt > x` / `tgt < x`,
  never `else` — AT the target the else branch runs and it flickers ±r. An accumulator-fed per-cell
  field needs **PROPORTIONAL** decay — flat subtraction has no stable interior and quantises the map
  to {0, cap}. And two named scalars are often ONE axis (`greyF()` *is* `1 - 2*warmth`): read the
  definition before you multiply by both. (#3–#124)
- **The night's clock and the sun's hour are two axes, and the gap between them BREATHES with the
  season.** `nightF`'s edges sit `NIGHT_K*dayHours` (1.7 h winter, 2.5 h summer) outside sunrise and
  sunset, so anything happening *at first light* keys on `sunUp`, never on the night's span. A
  predicate on the LIGHT is a predicate on the HOUR, and `!daylight` / `nightF>0.3` is DAWN as well as
  dusk: any rule ending something because the light is low must be bounded on BOTH sides of noon, or
  it silently kills the early walk another rule allows. A **hard-coded HOUR in a light or warmth term
  is a seasonal bug invisible to a screenshot** — 7.00 is *exactly* midwinter's sunrise and three
  hours late in July; an hour OF THE SUN is solved at the instant it applies, never read hours ahead.
  And `day` rolls at hour 6, so it holds TWO dawns: index anything keyed to a morning off its own
  counter. (#12–#124)
- **The ground is a CACHE and the night is a COMPOSITE.** `drawBlocks`/`drawGround` rebuild at
  whatever cadence sets the dirty flag most often, so a per-frame truth on a facade or the ground is a
  live overlay: register at cache time, repaint live. An accumulator a cache pass fills (`LIT[]`) is
  reset by it; what you lift out of a cache carries what was drawn ON TOP of it (`frame-cost.mjs`, not
  `perf.mjs`); anything registered in SCREEN space at cache time (`FACES`) goes stale through the
  camera ease — map it through `k = viewS/gview.s`. A night colour is set by the LAST composite that
  touches it: anything drawn live before `applyLight`'s multiply is slate by midnight, so put its
  warmth back in a `screen` pass after it. (#39–#93)
- **The FRAMING decides what exists: bound the near world in DEPTH, and anchor it on the sill.**
  `sillTop()` eats the bottom ~7% of every frame, and the world depth it lands at is a function of the
  window, not a constant (81.7 at 1280×700 through 120 on a phone). No world-space ROW bound is safe
  at every size: bound a near band in DEPTH (`y − z·LIFT`, world state) for the SHORTEST framing you
  support, with a render-side guard after it — never in rows. A SCREEN cull is different: exact
  against the CANVAS rect, never the picture above `sillTop()` (a pass drawing before the sill
  composite may legitimately paint under it), and its margin is the DRAWN extent, never the centre.
  And **a quarter cannot reach the world's edge by zooming**: its `share` sets s from WIDTH alone, so
  `s` cancels — move the extent, not the zoom. (#27–#134)
- **A probe's world is only as rewound as you make it — and suspect the INSTRUMENT first.**
  `__reseed()`/`__setTime()` rewind the PRNG and clock, not latches or spawned agents; frames drawn at
  page load move the PRNG, so without `__reseed()` even HEAD's own `windF` flips across runs. Reseed,
  then step inside ONE `page.evaluate`, fresh page per screenshot. PIN the instant rather than wait
  for it — call `drawScene(simT, 1/30)` inside the evaluate; `__warp(t)` advances whole fixed-dt
  steps, so a step count is not a clock; an instant is a *phase as well as an hour* and is
  VIEWPORT-dependent, so `simT` at 1280×700 is not the weather at 1600×950. Read the canvas in the
  SAME evaluate as the draw (`toDataURL()`, not a screenshot after it): a `?pause`d page still runs
  rAF. Carry a SIM FINGERPRINT (clock, wind, cloud, agents) through any before/after and refuse it
  unless it says NONE A probe calling
  `lookAt(project(...))` proves the NAMING, never the POINTER — drive a real `mousemove`/tap where the
  thing is DISPLAYED (canvas coords × `rect/W`), ONE tap per page. **A gate's PASS is only evidence
  about the fields it REPORTS** — read the reporter (`summarize()`), not the producer. `perf.mjs` is
  vsync-locked at 16.70 ms over a whole sim day and is blind to a pass expensive only in a rare
  weather: time the FUNCTION, in its weather, at every camera. And a ZERO is evidence only if you show the test can be non-zero,
  a green anchor only if the predicate FIRED: anchor a negative on the state the **bug** would leave,
  print the margin, and run it on HEAD. (#3–#134)
- **Judge a look from a DIFFERENCE IMAGE and a number, never two pictures in turn — and grade it at
  the SHIPPING size.** A diff answers "is it drawn", not "can it be seen": legibility is MASS and
  COHERENCE, not peak Δ, and what reads as weather is CONTRAST. Absolute luma sd under a compositing
  wash is not a property of what you DREW — `nearShadow` scales contrast with luma, so sd must fall
  toward the viewer whatever the surface is: grade a foreground on **sd/mean**. A diff needs a
  **SAME-CODE control run**: quote the feature's mass as a ratio to that floor, never as an absolute.
  `filmstrip.mjs`'s Δ is a whole-frame RATE, blind under ~2% of the canvas and loud about anything
  global — crop to your feature and grade against NEIGHBOURS. And **one uniform hash is a texture, never a PLACE**:
  to make scattered things look gathered, gate a fine hash by a coarse one at the scale the gathering
  happens on. (#8–#122)
