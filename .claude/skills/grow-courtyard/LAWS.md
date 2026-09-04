# Laws
True of the NEXT vector; what is only true of what you built belongs in the ledger.
Cap 60 laws / 12 KB; BYTES bind. Claims here, examples in the source.

## Judging a claim

- **Price the brief's PREMISE on HEAD before you build on it.** GREP, don't trust the inventory:
  the town usually already has what a brief sees "no trace" of. COUNT every "never", and price
  BOTH HALVES of an array the premise names — "nothing shows X" is usually a claim about the
  branch you did not read. SCARCITY is dated the day it was claimed, so an inventory line written
  by the pass that wrote the brief is no witness; when you refute a premise, DELETE the sentence
  that produced it.
- **Compare against a control you RAN, and SMOKE it first** (`probe-smoke.mjs`, and mind its
  `--jobs`). A gate that fails on HEAD is not a gate, and an unrun probe breaks silently and
  stays broken. A control tests a build-INDEPENDENT fact, never a predicate the candidate
  DEFINES, and differs from the thing measured in exactly ONE way. A control that makes an
  input EXTREME is degenerate wherever the quantity it feeds SATURATES — replace the BRANCH.

## Definitions and the grid

- **One predicate, one definition — read a footprint back off the grid, never re-derive
  it,** and hand a consumer the value you TESTED: a value stored for a DRAWING reason is read
  downstream as a fact about the WORLD, so two consumers want two arrays.
  A list cut ONCE off a predicate is that predicate's HOSTAGE — widen the test and the list is
  silently un-completed — so grep a widened predicate's READERS, not its callers. Routes are
  WAYPOINTS and nobody reads the grid between them: a non-walkable cell holds only where a
  route's ENDPOINTS are chosen, so keep it out of every target set.

## The seeded world

- **Every random draw goes through `R()`** (or `hash(x,y)` per cell); `Math.random()` is
  invisible to `?seed=`. `hash()` is NOT seeded, so the built FABRIC is one town in every
  world; a per-day `hash(day,k)` is one sample of the calendar in every seed — histogram the
  YEAR, and SALT it if the calendar must differ per world. A CANVAS-EXTENT population must not
  draw from `R()`: the draws a frame spends are a fact about the WINDOW, and no world event may
  wait on one.
- **Any new draw reshuffles the whole seeded world.** Read the census for *collapse*, not
  delta, replay every stray gate on HEAD, and keep each branch on the half of [0,1) it owned.
  A CACHED DRAW is free to it, so the control to build is the candidate with its one BEHAVIOUR
  change backed out: that must census IDENTICALLY to HEAD but for its new fields.
- **Two seeds is not a sample**, a bar on a BIMODAL scalar is a coin, and a COUNT of a rare
  seeded event cannot resolve a build: pool six seeds and a YEAR, read nothing into 1 sd of the
  binomial, and histogram the value AT THE CALL before sweeping the constant.

## The renderer's traps

- **(a) `project()` pinches on *screen* depth and LIFTS z NORTHWARD** — price a foreground
  against what is BEHIND it. It is not linear, so a world offset added to a PROJECTED coordinate
  is a PIXEL: solve BOTH ends of a stroke in world space and project each.
- **(b) Roofs are EMERGENT from `buildVolumes()`**: change a footprint, never a roof; two
  that TOUCH are one roof. A FACE is drawn only where the SOUTH neighbour is open, so a hole
  cut in any other side of a volume is never seen, and a drawing height is not a CASTING one.

## Time, walks and populations

- **Time is compressed: a day is 55 s, so a ~40 s trip is a resident.** Caps set inflow, trip
  length sets population — floor the arrival *rate*, end a population by sending nobody new,
  and price N places at N × (leg + stand) on a walk of ~5.2 cells/h.
- **A window is a SET-OUT bound or a PRESENCE bound, and the two differ by a whole visit.**
  NAME which yours is, measure PRESENCE and not a per-instant crop, price it as rate × visit
  BEFORE choosing the cap, and bound BOTH ends. Where TWO clocks run over one subject the one
  owning its EXISTENCE bounds the other: solve the LENGTH inside that span before the hour, or
  the offers land where the subject is not. Charge the WALK where it can be PAID — at the door
  when the place is near, at the STAY when the crossing costs a day's light: a bound on ARRIVAL
  with none on the walk fails as a population going to ZERO, never as a slower rate. A WEATHER gate on a fixed window spends the
  window on weather it cannot use — make the budget the RESOURCE, spent only when usable.

## Rates, caps and shares

- **A cap and a rate are two bounds, only one can be swept, and both are alive only if they
  bind at DIFFERENT times.** Re-weight the branch, then re-sweep: identical numbers at two
  settings is a DEAD constant and the SUPPLY was always the cap. MAKING one live wakes every
  coupling keyed to what it gated, so re-price them all, and spell the rung in the system's OWN
  units, never as a quantile that moves out from under it. Hang a modulating scalar on whichever
  bound is SLACK and prove it by sweeping the AXIS — season or weather — not the constant.
- **A spawn BAND is a share of a budget, not a rate**: a rare thing needs its OWN source and a
  feature that exists may exist at a rate of zero. Where one quantity has TWO sources
  take the MAX, not the sum: it lifts the starved tail without moving the head, which a
  threshold cannot do — size the second off the TAIL's own missing integral, never the mean, and
  prefer a SEASONAL driver, the same in every world and so the antidote to a weather coin.
  A second source taken as a MAX is DEAD unless its tail falls in a season the first is out of.
- **Measure a share at the CHOICE, never by presence, which weights a branch by its dwell** —
  and count ADMISSIONS apart from choices: widened at a destination with a FIXED NUMBER OF
  PLACES, a share becomes overflow into its NEIGHBOUR, and the refused fraction is the one
  bound a sweep of the ceiling cannot see. END a one-shot choice AT THE CLAIM.
- **An act whose payoff is another population's BEHAVIOUR is bounded by that population's
  avoidance rule, not by the act: instrument the PAYOFF**, clause by clause, in the predicate's
  own evaluation order — the loudest refusal is usually the cheap boolean in front of the
  arithmetic, and a stay ended by weather has TWO edges, the loud one the ARRIVAL that turned
  away. A rung nothing STEERS toward fires at its FIRST rung's hit rate, not at supply.
  Attribute an EDGE-TRIGGERED event AT THE EDGE and subtract the DELIBERATE refusals before
  calling a conversion a LEAK: price the numerator's VOLUME.

## Scalars

- **A scalar is not a switch.** Split the behaviour boolean from the 0..1 intensity draw sites
  multiply (`isWindy`/`windF`), and give a scalar that can reach zero per-cell variance
  (`hash(x,y+k) > c`) at the grain the region is ADDRESSED by. One uniform hash is a texture,
  never a PLACE — scattered things read as gathered only from a rule with a NEIGHBOURHOOD.

## The sun and the night

- **The night's clock and the sun's hour are two axes, and the gap BREATHES with the season.** `nightF`'s edges sit `NIGHT_K*dayHours` outside sunrise and sunset, so anything
  at *first light* keys on `sunUp`, never on the night's span. A hard-coded HOUR in a light or
  warmth term is a seasonal bug invisible to a screenshot: solve the hour OF THE SUN at the
  instant it applies, and hold the term's WIDTH fixed as its OFFSET moves. `!daylight` /
  `nightF>0.3` is DAWN as well as dusk — bound a low-light rule on BOTH sides of noon.

## Caches and composites

- **The ground is a CACHE**, and a system drawn into it that nothing DIRTIES repaints only when
  something else does. `drawBlocks`/`drawGround` rebuild at whatever cadence sets that flag most
  often, so a per-frame truth on a facade or the ground is a live overlay: register at cache
  time, repaint live, quantize the QUANTITY and never a clock standing in for it. Before adding a TRIGGER, price
  what ALREADY dirties that cache: the incumbent's rate caps the new one's mean win, so buy the
  WORST CASE and set the deadband where the picture stops. 
- **A cached layer's inputs are not its PICTURE's** — what is composited over it after the blit is an input
  too, so price a "reads nothing" premise on PIXELS, and what you lift OUT carries what was
  drawn on top. Anything registered in SCREEN space at cache time
  (`FACES`) goes stale through the camera ease: map it through `k = viewS/gview.s`.
- **The night is a COMPOSITE, set by the LAST thing that touches it.** Anything warm arriving
  before `applyLight`'s multiply is slate by midnight: REGISTER in the same rebuild as the image
  and repaint in a `screen` pass after.

## The frame and its instruments

- **The FRAMING decides what exists.** The sill eats the bottom ~7% of every frame
  (`sillTop()`), and no world-space ROW bound is safe at every size: bound a near band in DEPTH
  (`y − z·LIFT`, world state) for the SHORTEST framing you support. EVERY framing is a fitted box now
  (`viewFor()`), the wide one included, and a frame's SHARE of the picture is a function of
  the ZOOM alone: padding decides where the slack GOES, not how much of it there is.

- **A probe's world is only as rewound as you make it.** `__reseed()`/`__setTime()` rewind the
  PRNG and clock, not latches or spawned agents; reseed, then step inside ONE `page.evaluate`.
  `__reseed()` REASSIGNS `R`, so a monkeypatch installed before it is eaten — instrument AFTER it
  and assert it fired. PIN `?t=` (the default entry is a DIFFERENT world) and PIN the dt
  (`drawScene(simT, 0)`), or N draws of one pinned state are N pictures. Read the canvas in the
  SAME evaluate as the draw — a `?pause`d page still runs rAF.
- **Suspect the INSTRUMENT first: a gate's PASS is evidence only about the fields it REPORTS,
  and its LADDER can be blind to a whole AXIS by design** — the census's three ages equalise a
  cosine, so they sit symmetric about midsummer and a winter-only tile is invisible to them (the
  winter row and its own WCORE floor exist for that). Price a predicted field against the ladder
  BEFORE promising it. An aggregate SUMMING two kinds of register is diluted by every constant
  added, so report the constant share beside the total.
- **Read the REPORTER, not the producer.** `perf.mjs` is vsync-locked and blind to a pass costly
  only in a rare weather: time the FUNCTION, in its weather, at every camera, and an overlay's
  cost is the PATH BUILD, not the fill. A THRESHOLD is priced off the subject's FASTEST phase,
  never its mean. A probe driving a real EVENT must invert the page's mapping term for term and
  assert it LANDED — a synthetic miss takes the other branch, it does not fail.
- **A ZERO is evidence only if you show the test can be non-zero**, and a green anchor only
  if the predicate FIRED. Separate NOT MEASURED from CLEAN.
- **A gate is a claim about a BUILD.** A change redefining a gate's SUBJECT must re-run every
  gate that READS it, not only the one briefed; pin the "before" to a REF, since a control
  fetched at HEAD expires the moment the change commits; and EXTEND a gate by ADDING a row
  under its own ladder string, never re-cutting the one stored baselines travel with.

## Judging a look

- **Judge a look from a DIFFERENCE IMAGE and a number, never two pictures in turn, and grade it
  at the SHIPPING size.** A diff answers "is it drawn", not "can it be seen": legibility is MASS
  and COHERENCE, not peak Δ. Grade a MID-TONE on **sd/mean**, never a near-black one — it
  divides by ~nothing; under mean 40 luma quote sd and RANGE. A diff needs a SAME-CODE control
  run: quote mass as a RATIO to that floor, never as an absolute. A cached layer drawn OVER a
  live one SUBTRACTS from it — price the live layer's SURVIVING mass, not the cache's gain.
  Two silent liars when you measure INK: `getImageData` ignores the ctx transform, so a
  `project()`ed band is CSS px and not device; and `getComputedStyle().font` is EMPTY wherever a
  longhand cannot go in the shorthand, and measures the PREVIOUS face.
