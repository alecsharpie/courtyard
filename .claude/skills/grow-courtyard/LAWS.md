# Laws
True of the NEXT vector; what is only true of what you built belongs in the ledger.
Cap 60 laws / 12 KB; BYTES bind. Claims here, examples in the source.

## Judging a claim

- **Price the brief's PREMISE on HEAD before you build on it.** Grep the source as well as the
  inventory — the town usually already has what a brief sees "no trace" of — and COUNT every
  "never". A claim of SCARCITY is dated the day it was made, so an inventory line written by
  the pass that wrote the brief is no witness; when you refute a premise, DELETE the sentence
  that produced it.
- **Compare against a control you RAN.** A gate that fails on HEAD is not a gate. A control
  tests a build-INDEPENDENT fact, never a predicate the candidate DEFINES, and differs from the
  thing measured in exactly ONE way.

## Definitions and the grid

- **One predicate, one definition — read a footprint back off the grid, never re-derive
  it,** and hand a consumer the value you TESTED: a value stored for a DRAWING reason is read
  downstream as a fact about the WORLD, so two consumers want two arrays. A naming predicate is
  usually a FALL-THROUGH, so the box it answers with is not the surface — intersect the GRID
  before counting off it, and bound what it answers for a screen REGION by whatever rises
  THROUGH that region, or the tallest things in the town get called "the sky".
  Routes are WAYPOINTS and nobody reads the grid between them, so a non-walkable cell holds
  only where a route's ENDPOINTS are chosen: keep it out of every target set.

## The seeded world

- **Every random draw goes through `R()`** (or `hash(x,y)` per cell); `Math.random()` is
  invisible to `?seed=`. `hash()` is NOT seeded, so the built FABRIC is one town in every
  world; a per-day `hash(day,k)` is one sample of the calendar in every seed — histogram the
  YEAR, and SALT it if the calendar must differ per world. A CANVAS-EXTENT population must not
  draw from `R()`: the draws a frame spends are a fact about the WINDOW, and no world event may
  wait on one.
- **Any new draw reshuffles the whole seeded world.** Read the census for *collapse*, not
  delta, replay every stray gate on HEAD, and keep each branch on the half of [0,1) it owned.
- **Two seeds is not a sample**, a bar on a BIMODAL scalar is a coin, and a COUNT of a rare
  seeded event cannot resolve a build: pool six seeds and read nothing into 1 sd of the
  binomial. Histogram the value AT THE CALL before sweeping the constant. And a per-day event
  judged against "the other days" of a SHORT run reads the town's own RAMP (maturity,
  `day >= N`) as its effect — pool a YEAR, and label the days off PRIMITIVES so a pinned ref
  labels the same ones.

## The renderer's four traps

- **(a) `project()` pinches on *screen* depth and LIFTS z NORTHWARD** — price a foreground
  against what is BEHIND it. It is not linear, so a world offset added to a PROJECTED
  coordinate is a PIXEL: solve BOTH ends of a stroke in world space and project each.
- **(b) Roofs are EMERGENT from `buildVolumes()`**: change a footprint, never a roof; two
  that TOUCH are one roof. A FACE is drawn only where the SOUTH neighbour is open, so a hole
  cut in any other side of a volume is never seen, and `eaveFor()` is 0 below `LN_WALK_S` by
  design — a CASTING height is not that eave.
- **(c) A silhouette seen through an APERTURE takes its scale from the OPENING, not the
  body**: bound the lateral by the aperture and sweep the head off that one scale, or a person
  in a 5x11 px pane comes out an egg.
- **(d) A cast image's TARGET SET is a VISIBILITY question before a geometry one.** Because
  (a) lifts a volume up the frame, a NORTHWARD throw must be vetoed per column or it paints the
  caster's own roof: price the RAY off `-S/S[2]`, then where it LANDS. The MIRROR is the same
  solve with a NEGATIVE z, so a caster's own draw IS its image — shadow north, image south.

## Time, walks and populations

- **Time is compressed: a day is 55 s, so a ~40 s trip is a resident.** Caps set inflow,
  trip length sets population — floor the arrival *rate*, end a population by sending nobody
  new, measure **presence** not a per-instant crop, and price N places at N × (leg + stand) on
  a walk of ~5.2 cells/h.
- **A window is a SET-OUT bound or a PRESENCE bound, and the two differ by a whole visit.**
  NAME which yours is, price presence as rate × visit BEFORE choosing the
  cap, and bound BOTH ends. Where TWO clocks run over one subject the one owning its EXISTENCE
  bounds the other — solve the LENGTH inside that span before the hour, or the offers land
  where the subject is not there. Charge the WALK where it can be PAID — at the door when the
  place is near, at the STAY when the crossing costs a day's light: a bound on ARRIVAL with
  none on the walk is a wait a walker pays by walking, and it fails as a population going to
  ZERO, never as a slower rate.

## Rates, caps and shares

- **A cap and a rate are two bounds, only one can be swept, and both are alive only if they
  bind at DIFFERENT times.** Re-weight the branch, then re-sweep: identical numbers at two
  settings is a DEAD constant and the SUPPLY was always the cap. MAKING one live wakes every
  coupling keyed to what it gated — a capacity, a spawn, a draw site all assumed the full set —
  so re-price them all, and spell the rung in the system's OWN units, never as a quantile of a
  distribution that moves out from under it. Hang a modulating scalar on whichever bound is
  SLACK and prove it by sweeping the AXIS, season or weather, not the constant.
- **A spawn BAND is a share of a budget, not a rate**: a rare thing needs its OWN source, and a
  feature that exists may exist at a rate of zero. A hand-tuned SHARE prices the YIELD, so a
  fix that makes each accepted coin PAY must re-price the coin.
- **Measure a share at the CHOICE, never by presence, which weights a branch by its dwell**
  — and count ADMISSIONS apart from choices: a share widened at a destination with a FIXED
  NUMBER OF PLACES becomes overflow into its NEIGHBOUR. The refused fraction is the door, the
  one bound a sweep of the ceiling cannot see. END a one-shot choice AT THE CLAIM: guarded
  only by the state it CONSUMES, it is re-entrant.
- **An act whose payoff is another population's BEHAVIOUR is bounded by that population's
  avoidance rule, not by the act: instrument the PAYOFF**, clause by clause, in the predicate's
  own evaluation order — the loudest refusal is usually the cheap boolean in front of the
  arithmetic, and a stay ended by weather has TWO edges, the loud one the ARRIVAL that turned
  away before it stopped. A ladder's lower rungs are bounded by its FIRST rung's HIT
  RATE, not by supply. Attribute an EDGE-TRIGGERED event AT THE EDGE, and subtract the
  DELIBERATE refusals — a fair coin, a weather guard — before calling a conversion a LEAK:
  price the numerator's VOLUME.

## Scalars

- **A scalar is not a switch.** Split the behaviour boolean from the 0..1 intensity draw sites
  multiply (`isWindy`/`windF`), and give a scalar that can reach zero per-cell variance
  (`hash(x,y+k) > c`) at the grain the region is ADDRESSED by. One uniform hash is a texture,
  never a PLACE: to make scattered things read as gathered, gate a fine hash by a coarse one at
  the scale the gathering happens on.

## The sun and the night

- **The night's clock and the sun's hour are two axes, and the gap between them BREATHES
  with the season.** `nightF`'s edges sit `NIGHT_K*dayHours` outside sunrise and sunset, so
  anything happening *at first light* keys on `sunUp`, never on the night's span. A hard-coded
  HOUR in a light or warmth term is a seasonal bug invisible to a screenshot: solve the hour OF
  THE SUN at the instant it applies, and hold the term's WIDTH fixed as its OFFSET moves.
- **`!daylight` / `nightF>0.3` is DAWN as well as dusk** — a rule ending something because the
  light is low must be bounded on BOTH sides of noon.

## Caches and composites

- **The ground is a CACHE.** `drawBlocks`/`drawGround` rebuild at whatever cadence sets the
  dirty flag most often, so a per-frame truth on a facade or the ground is a live overlay:
  register at cache time, repaint live. Quantize the QUANTITY, never a clock standing in for
  it. A cached layer's inputs are not its PICTURE's — what is composited over it after
  the blit (`applyLight`'s seasonal sun) is an input too, so price a "reads nothing" premise on
  PIXELS, not the function body — and what you lift back OUT carries whatever was drawn on
  top. Anything registered in SCREEN space at cache time (`FACES`) goes stale through the
  camera ease: map it through `k = viewS/gview.s`.
- **The night is a COMPOSITE, set by the LAST thing that touches it.** Anything warm arriving
  before `applyLight`'s multiply is slate by midnight, so it must REGISTER in the SAME rebuild
  as the image and be repainted in a `screen` pass after.

## The frame and its instruments

- **The FRAMING decides what exists.** The sill eats the bottom ~7% of every frame
  (`sillTop()`), and no world-space ROW bound is safe at every size: bound a near band in DEPTH
  (`y − z·LIFT`, world state) for the SHORTEST framing you support.

- **A probe's world is only as rewound as you make it.** `__reseed()`/`__setTime()` rewind the
  PRNG and clock, not latches or spawned agents; reseed, then step inside ONE `page.evaluate`.
  `__reseed()` REASSIGNS `R`, so a monkeypatch installed before it is silently eaten —
  instrument AFTER it and assert it fired. PIN `?t=` (the default entry is a DIFFERENT world,
  ~2 s of un-reseeded sim in) and PIN the dt too (`drawScene(simT, 0)`): a pass given a dt
  ADVANCES the phases it draws, so N draws of one pinned state are N pictures. Read the canvas
  in the SAME evaluate as the draw: a `?pause`d page still runs rAF.
- **Suspect the INSTRUMENT first: a gate's PASS is evidence only about the fields it REPORTS,
  and its LADDER can be blind to a whole AXIS by design.** The census's three ages equalise
  WARMTH, a cosine, so they sit at TWO phases symmetric about midsummer — a winter-only tile is
  invisible and an extreme OFF midsummer reads on one cell of three, though a LAGGED term IS
  seen, the lag breaking the symmetry. Price a predicted field against the ladder BEFORE
  promising it; give a seasonal system its own probe; read the REPORTER, not the producer
  (`perf.mjs` is vsync-locked over a sim day and blind to a pass expensive only in a rare
  weather — time the FUNCTION, in its weather, at every camera). A probe driving a real EVENT
  must invert the page's mapping term for term and assert it LANDED: a synthetic miss takes the
  other branch, it does not fail.
- **An instrument is a build artifact too.** Nothing runs the shelf, so a probe breaks
  silently and stays broken, and the cause is usually not the probe but the ARTIFACT crossing a
  limit it never named (`courtyard.html` passed Node's 1 MiB `maxBuffer` at #181, killing every
  `git show` control on the shelf). Smoke a control before you trust it.
- **A ZERO is evidence only if you show the test can be non-zero**, and a green anchor only
  if the predicate FIRED. Separate NOT MEASURED from CLEAN.
- **A gate is a claim about a BUILD.** A change redefining a gate's SUBJECT must re-run every
  gate that READS it, not only the one briefed; a control fetched at HEAD expires the moment
  the change commits, so pin the "before" to a REF; and EXTEND a gate by ADDING a row under its
  own ladder string, never re-cutting the one every stored baseline travels with.

## Judging a look

- **Judge a look from a DIFFERENCE IMAGE and a number, never two pictures in turn, and grade
  it at the SHIPPING size.** A diff answers "is it drawn", not "can it be seen": legibility is
  MASS and COHERENCE, not peak Δ. Grade a MID-TONE on **sd/mean**, never a near-black one —
  it divides by ~nothing; under mean 40 luma quote sd and RANGE.
- **A diff needs a SAME-CODE control run**: quote the feature's mass as a ratio to that floor,
  never as an absolute. A cached layer drawn OVER a live one SUBTRACTS from it: price the live
  layer's SURVIVING mass (`FULL` minus `FULL`-without-it), not the cache's gain.
