# Laws
True of the NEXT vector; what is only true of what you built goes in the ledger.
Cap 60 laws / 12 KB — the binding one is BYTES. Claims here; examples in the source.

## Judging a claim

- **Price the brief's PREMISE on HEAD before you build on it.** Check the inventory *and* grep
  the source — the town usually already has what a brief sees "no trace" of — and COUNT every
  "never"; an inventory line written by the pass that wrote the brief is no witness.
- **Compare against a control you RAN.** A gate that fails on HEAD is not a gate; a control
  returning the candidate's numbers is none. A control tests a build-INDEPENDENT fact, never a
  predicate the candidate DEFINES, and differs from the thing measured in exactly ONE way.
- **A claim of SCARCITY is dated the day it is made** and rots as the town grows, where a
  structural claim does not: re-count every "nobody else", and when you refute a premise,
  DELETE the sentence that produced it.

## Definitions and the grid

- **One predicate, one definition — read a footprint back off the grid, never re-derive
  it.** A naming predicate is usually a FALL-THROUGH, so the box it answers with is not the
  surface: intersect the GRID before counting off it.
- **Routes are WAYPOINTS and nobody reads the grid between them.** A non-walkable cell
  holds only where a route's ENDPOINTS are chosen: keep it out of every target set.
- **A solve must hand its consumer the value it TESTED**, and a value stored for a DRAWING
  reason is read downstream as a fact about the WORLD: two consumers, two arrays.

## The seeded world

- **Every random draw goes through `R()`** (or `hash(x,y)` per cell); `Math.random()` is
  invisible to `?seed=`. `hash()` is NOT seeded, so the built FABRIC is one town in every
  world and only its life varies; a per-day `hash(day,k)` is one sample of the calendar in
  every seed — histogram the YEAR, and SALT it if the calendar should differ per world. A CANVAS-EXTENT
  population must not draw from `R()`, and no world event may wait on a screen-space one: the
  draws a frame spends are a fact about the WINDOW.
- **Any new draw reshuffles the whole seeded world.** Read the census for *collapse*, not
  delta; replay every stray gate on HEAD; keep each branch on the half of [0,1) it owned.
- **Two seeds is not a sample**; a bar on a BIMODAL scalar is a coin, and a COUNT of a rare
  seeded event cannot resolve a build — pool six seeds, and read nothing into 1 sd of the
  binomial. Histogram the value AT THE CALL before sweeping the constant.

## The renderer's six traps

- **(a) `project()` pinches on *screen* depth and LIFTS z NORTHWARD** — price a foreground
  against what is BEHIND it.
- **(b) Roofs are EMERGENT from `buildVolumes()`**: change a footprint, never a roof; two
  that TOUCH are one roof.
- **(c) Two figures nearer than ~0.9 cells render as one shape.** Move a scatter's centre,
  not its members, and let a displacement OWN the tick (`return` after the shove).
- **(d) Height is read off the place under the feet** (`agentZ`, `nearZ`, `roofWalkZ`)
  EVERY frame, never written at spawn — and a silhouette seen through an APERTURE takes its
  scale from the OPENING, not the body: bound the lateral by the aperture, sweep the head off
  that one scale, or a person in a 5x11 px pane comes out an egg.
- **(e) A world offset added to a PROJECTED coordinate is a PIXEL** and the projection is
  not linear in it — solve BOTH ends of a stroke in world space and project each.
- **(f) A cast image's TARGET SET is a VISIBILITY question before a geometry one.** Because
  (a) lifts a volume up the frame, a NORTHWARD throw must be vetoed per column or it paints the
  caster's own roof; price the RAY off `-S/S[2]`, then price where it LANDS. The MIRROR is the
  same solve with a NEGATIVE z, so a caster's own draw IS its image, and it reflects only what
  is solved with a REAL z — pixel offsets off a projected foot are blind to the sign.
  Shadow northward, image southward.

## Time, walks and populations

- **Time is compressed: a day is 55 s, so a ~40 s trip is a resident.** Caps set inflow,
  trip length sets population — floor the arrival *rate*, end a population by sending nobody
  new, and measure **presence**, not a per-instant crop. Walking is ~5.2 cells/h;
  price N places as N × (leg + stand).
- **A window is a SET-OUT bound or a PRESENCE bound and the two differ by a whole visit.**
  NAME which yours is, price presence as rate × visit BEFORE choosing the cap, and bound
  BOTH ends: a window with only a LANDING bound is a marathon-walker factory.
- **Price the WALK where it can be PAID — at the door when the place is near, at the STAY
  when the crossing costs a day's light.** A lower bound on ARRIVAL with no bound on the
  WALK is a wait a walker can pay by WALKING, so the door bag keeps only the DEAR doors; and a
  return leg charged at the DOOR fails as a POPULATION going to zero, never as a slower rate.

## Rates, caps and shares

- **A cap and a rate are two bounds, only one can be swept, and both are alive only if they
  bind at DIFFERENT times.** Re-weight the branch, then re-sweep: identical numbers at two
  settings is a DEAD constant and the SUPPLY was always the cap. Hang a modulating scalar on
  whichever bound is SLACK, and prove it by sweeping the AXIS — season, weather — not the
  constant. A spawn BAND is a share of a budget, not a rate: a rare thing needs its OWN source,
  and a feature that exists may exist at a rate of zero.
- **Measure a share at the CHOICE, never by presence, which weights a branch by its
  dwell** — and count ADMISSIONS apart from choices: a share widened at a destination with a
  FIXED NUMBER OF PLACES becomes overflow into its NEIGHBOUR, not presence. The refused
  fraction is the door — the one bound a sweep of the ceiling cannot see.
- **Define membership POSITIVELY at the source** — a flag on the spawn literal, inherited by
  every branch — never as a residual, which counts every later population that also satisfies
  it. End it positively at the CLAIM: a one-shot choice guarded only by the state it CONSUMES
  is re-entrant.
- **An act whose payoff is another population's BEHAVIOUR is bounded by that population's
  avoidance rule, not by the act: instrument the PAYOFF.** And instrument a compound
  predicate CLAUSE BY CLAUSE in its own evaluation order — the loudest refusal is usually the
  cheap boolean in front of the arithmetic. A fall-through ladder's lower rungs are bounded by
  its FIRST rung's HIT RATE, not by supply — more arrivals buy more of the first rung too — so
  instrument the RUNG, never the population. And attribute an EDGE-TRIGGERED event AT THE EDGE:
  by the time its consequence shows, a slower term has superseded the state that flipped it.
  And a conversion is not a LEAK until the DELIBERATE refusals — a fair coin, a weather guard —
  are subtracted: price the numerator's VOLUME, not the ratio.

## Scalars

- **A scalar is not a switch.** Split the behaviour boolean from the 0..1 intensity that
  draw sites multiply (`isWindy`/`windF`), give a scalar that can reach zero per-cell
  variance (`hash(x,y+k) > c`) at the grain the region is ADDRESSED by. A bar spelled as a
  MAGIC NUMBER over a bimodal input is a duplicate of the predicate that names it.

## The sun and the night

- **The night's clock and the sun's hour are two axes, and the gap between them BREATHES
  with the season.** `nightF`'s edges sit `NIGHT_K*dayHours` outside sunrise and sunset, so
  anything happening *at first light* keys on `sunUp`, never on the night's span.
- **`!daylight` / `nightF>0.3` is DAWN as well as dusk**: any rule ending something because
  the light is low must be bounded on BOTH sides of noon. And `day` rolls at hour 6, so it
  holds TWO dawns: a window past a day's LAST hour is also its NEXT morning's first, so split a
  late population by DIRECTION before quoting it.
- **A hard-coded HOUR in a light or warmth term is a seasonal bug invisible to a
  screenshot** — solve an hour OF THE SUN at the instant it applies; re-keying a term
  onto the sun moves its OFFSET, so hold its WIDTH fixed.

## Caches and composites

- **The ground is a CACHE.** `drawBlocks`/`drawGround` rebuild at whatever cadence sets the
  dirty flag most often, so a per-frame truth on a facade or the ground is a live overlay:
  register at cache time, repaint live. Quantize the QUANTITY, never a clock standing in for it:
  N roundings of a clock fire N times for ONE change in the thing it stands for. What you lift out of a cache carries what was drawn
  ON TOP of it; anything registered in SCREEN space at cache time (`FACES`) goes stale
  through the camera ease — map it through `k = viewS/gview.s`.
- **The night is a COMPOSITE, set by the LAST thing that touches it.** Anything warm
  arriving before `applyLight`'s multiply is slate by midnight, so it must REGISTER in the
  SAME rebuild as the image and be repainted in a `screen` pass after.

## The frame

- **The FRAMING decides what exists: bound the near world in DEPTH, and anchor it on the
  sill.** `sillTop()` eats the bottom ~7% of every frame. No world-space ROW bound is safe at every size:
  bound a near band in DEPTH (`y − z·LIFT`, world state) for the SHORTEST framing you
  support.

## Instruments

- **A probe's world is only as rewound as you make it.** `__reseed()`/`__setTime()` rewind the
  PRNG and clock, not latches or spawned agents. Reseed, then step inside ONE `page.evaluate`. **`__reseed()` REASSIGNS `R`** rather than rewinding it, so a
  monkeypatch installed before it is silently eaten: instrument AFTER the reseed and assert it
  fired. PIN `?t=` — the default entry is a DIFFERENT world, ~2 s of un-reseeded sim in — and PIN the
  instant AND the dt (`drawScene(simT, 0)`): a redraw is not a re-read, a draw pass given a dt
  ADVANCES the phases it draws, so N draws of one pinned state are N pictures. Read the canvas in the SAME evaluate as
  the draw: a `?pause`d page still runs rAF.
- **Suspect the INSTRUMENT first, and a gate's PASS is only evidence about the fields it
  REPORTS — its LADDER can be blind to a whole AXIS by design** (the census's three ages all
  sit at one warmth, so a winter-only tile is invisible there): price a predicted field against
  the ladder BEFORE you promise it, and give a seasonal system its own probe. Read the reporter, not the producer: `perf.mjs` is vsync-locked over a whole sim day and
  blind to a pass expensive only in a rare weather: time the FUNCTION, in its weather, at
  every camera. A probe driving a real EVENT must invert the page's own mapping term for term
  and assert the event LANDED — a synthetic miss takes the other branch, it does not fail.
- **A ZERO is evidence only if you show the test can be non-zero**, a green anchor only if
  the predicate FIRED — and a FIELD is not a READING: a gate wired into a row can sit at
  `null` for ever. Separate NOT MEASURED from CLEAN.
- **A gate is a claim about a BUILD**: a change redefining a gate's SUBJECT must re-run
  every gate that READS it, not only the one briefed; a control fetched at HEAD expires the
  moment the change commits, so pin a "before" to a REF.

## Judging a look

- **Judge a look from a DIFFERENCE IMAGE and a number, never two pictures in turn — and
  grade it at the SHIPPING size.** A diff answers "is it drawn", not "can it be seen":
  legibility is MASS and COHERENCE, not peak Δ. Absolute luma sd under a wash is not a
  property of what you DREW: grade a MID-TONE on **sd/mean**, never a near-black one — it divides
  by ~nothing. Under mean 40 luma, quote sd and RANGE.
- **A diff needs a SAME-CODE control run**: quote the feature's mass as a ratio to that
  floor, never as an absolute. And a cached layer drawn OVER a live one SUBTRACTS from it:
  price the live layer's SURVIVING mass (`FULL` minus `FULL`-without-it), never the cache's
  own gain.
- **One uniform hash is a texture, never a PLACE.** To make scattered things look gathered,
  gate a fine hash by a coarse one at the scale the gathering happens on.
