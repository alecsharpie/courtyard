# The Courtyard — town build-out changelog

Working toward a full town section. Iterations alternate **addition** (new content) and
**improvement** (polish / fixes). Every iteration is verified with a rendered screenshot
before moving on.

## Iteration 1 — improvement: south wall clipping fix
- Plants in the courtyard's south edge beds were drawn over the south wall band
  (dynamic sprites always painted on top of the static wall layer).
- Moved the south wall (wall-top slabs, lane-facing face, ivy, arch) out of the static
  layer into the depth-sorted draw pass at sort depth y=65.2, so south-bed plants and
  people walking the arch tunnel now correctly disappear behind it.
- Verified: south beds in full bloom no longer bleed onto the wall; walkers vanish into
  the arch and re-emerge on the lane.

## Iteration 2 — addition: cross street + allotment gardens (world widened 64 → 96)
- Widened the world grid to 96 columns (renamed the width constant, re-centred the
  projection, resized the canvas fit).
- New cross street running north from a T-junction on the lane, along the courtyard's
  east side: two footways, a roadway, curbs, and three street lamps. The courtyard's
  east arch now tunnels through the building sliver onto the cross street, and both
  courtyard entries/exits route along it (north end or via the lane).
- New allotment-garden block east of the cross street: grass ground (with the same
  wear/desire-path CA), 21 soil plots in tidy rows for the planting CA, a timber fence
  with two gate gaps on the street side, a gated arch to the lane, and a shed.
- Lane extended across the full width with two more planters, two more awnings on our
  side, and lamps; lane walkers now also turn up/down the cross street.
- Fixed en route: two leftover compact `x<N` loop bounds left the whole east side
  unrendered (found by sampling the grid in Node, then the loops by grep).
- Verified: full block renders; street, junction, plots, fence, shed all present.

## Iteration 3 — improvement: give the new blocks proper elevation
- The new roof bands floated as slabs with darkness beneath. Added a street-facing
  facade for the building sliver (with the east-arch opening), and a south-facing
  facade with windows for the building row above the allotments.
- Distinguished the roadway tone from the footways so the street reads as asphalt-on-
  setts rather than more pavement.
- Verified: no more floating slabs; the cross street runs between real frontages.

## Iteration 4 — addition: allotment life
- Four vegetable species (carrots, cabbages, beans, pumpkins) that the planting CA
  uses only in allotment plots; flowers stay in the courtyard and lane planters.
- Allotmenteers: new agents who arrive via the street gates or the lane arch, kneel at
  a plot to plant a row, then leave the other way. Gardener/click planting is now
  area-aware too.
- Butterflies now also drift over the allotments once things bloom.
- Verified: day-6 plots full of distinct veg, tender kneeling mid-garden, street traffic
  using the junction.

## Iteration 5 — improvement: distinguish the greens
- Allotment grass is now a rougher, warmer meadow tone (patchier mix) so the two green
  spaces stop reading as one lawn; courtyard turf unchanged.
- Fireflies split between the courtyard and the allotments at night.
- Verified: dawn frame shows both grass characters and fireflies on both greens.

## Iteration 6 — addition: pavement café on the lane
- Three café tables (tops, legs, a spare chair each) on the south footway beneath the
  green awning; lane agents claim a free table, walk over, sit with a coffee cup, then
  release it. Occupancy tracked so tables never double-book; ticker lines for the café.

## Iteration 7 — improvement: street stops trigger at the destination
- Found via the iteration-6 frame: street agents performed their stop action at their
  final waypoint (the map edge) instead of at the destination — people sat down on bare
  pavement at the edge of the world.
- Replaced the per-kind end-of-route checks with one unified proximity stop: each street
  agent carries `{x, y, act, dur}` and performs it when actually within 0.6 cells.
  Café/bench/kiosk/busker/arch-peek all use it; announces moved to the moment of arrival.
- Verified: no more edge-sitters; browser pauses at the kiosk, cyclist passes through.

## Iteration 8 — addition: the duck pond
- Carved a pond into the allotments' south-east corner (plots politely relocated), with
  depth-shaded water. Three ducks (drakes get green heads) swim with little wakes,
  waddle out onto the bank, drift back at night, and occasionally argue about nothing.
- Clicking the water tosses crumbs — the ducks arrive like a small navy.
- Verified: pond and ducks render; plots re-flowed around the corner.

## Iteration 9 — improvement: pond dressing
- Reeds sprout wherever bank meets water; low sun glints slide across the surface by
  day; expanding rain-rings dimple the pond in a shower.
- Verified with a zoomed crop: reed ring, duck wakes, glints all present.

## Iteration 10 — addition: the clock tower
- A stone clock tower now rises over the cross-street corner: tapered cap, ringed
  face, and live hands driven by simulation time (verified reading ~9:00 on a morning
  frame). It strikes every third hour in the ticker ("The clock over the lane strikes
  three."), and the face glows softly after dark.
- Interim publish at the halfway mark.

## Iteration 11 — improvement: night lighting pass
- Shopfront light now pools as flattened ellipses on the footway (previously floating
  orbs on the dark facade band), and covers the two new shopfronts too.
- Pond glints continue after dark as slower, colder moon-glints.
- Verified on a night frame: lit clock face, pooled light, fireflies over both greens.

## Iteration 12 — addition: market day
- Every fourth day is market day: three striped canvas stalls set up on the south
  footway from 8:00 to 17:00, each with a stallholder and goods. Lane foot traffic runs
  heavier, browsers stop to buy things, and the morning opens with a ticker line.
- Verified: day-3 frame with all three stalls trading and a customer mid-purchase.

## Iteration 13 — improvement: market & sweeper behaviour
- Market browsers were stopping in the roadway (stop point sat on the wrong side of the
  stall); they now stand on the footway beside the counter.
- The dawn sweeper was pacing so slowly he swept for two sim-days; brisker now.
- Verified with a lane crop: customers at stall fronts, all on the pavement.

## Iteration 14 — addition: weather variety
- Windy days (~1 in 4, deterministic per day): stronger sway everywhere, leaves stream
  from the linden and the street trees, petals get snatched off the flower beds, and a
  morning ticker line announces the gusts.
- After rain ends the streets keep a wet sheen for a while — a soft cool wash over lane
  and cross street plus drifting puddle gleams on the roadway.
- Verified: dusk frame renders cleanly with the new code paths live; rain-dependent
  sheen reviewed in code (weather is stochastic, rings verified in iteration 9).

## Iteration 15 — improvement: small screens
- Pond reeds (and their line weights) now scale with cell size — they were dominating
  the pond on phone-sized viewports.
- On narrow screens the sill keeps the Pause/speed controls and drops the stats line
  (previously the controls were pushed off the edge).
- Verified at 390x844 and 800x600.

## Iteration 16 — addition: washing lines over the lane
- On fair days (deterministic ~60% of days from day 4), two washing lines stretch
  across the lane from the courtyard wall to our building, hung with garments that sway
  gently — or flap hard on windy days. Laundry comes in for rain and nightfall.
- Verified: garments up on a day-4 frame; correctly absent on the night frame.

## Iteration 17 — improvement: sill and ticker life
- Stats now include the duck census ("9 people · 401 blooms · 3 ducks").
- When nothing has happened for a while, the ticker offers quiet ambient observations
  tuned to conditions — rain, night, wind, or an ordinary afternoon ("Bees work the
  lavender in slow circles.").
- Verified: sill shows the new census; ambient pool reviewed.

## Iteration 18 — addition: the balloon
- A rare fair-weather event from day 5: a striped hot-air balloon drifts across the
  whole block with a travelling ground shadow, basket and rigging, announced in the
  ticker. Verified with a temporarily boosted spawn rate (then restored to rare).

## Iteration 19 — improvement: window glass
- The diagonal glass-shine streak was cutting visibly across every scene; halved its
  strength in both themes so it reads as a hint of reflection, not a scratch.

## Iteration 20 — final soak test & publish
- Fast-forwarded to day 7 dusk with everything mature: 17 people across the block,
  market-day ticker chatter, lamps coming on, fireflies rising, ducks home on the pond.
  No rendering glitches or stalled agents observed.
- Published the finished town section.

---

## Iteration 21 — improvement: Alec's punch list
- **Roofs rethought**: the grey checkered wall-tops (which read as floor tiles) are now
  pitched terracotta roofs — each band has a ridge with two shaded slopes, a ridge
  highlight, and shingle seams running down the slope.
- **Real tunnels**: the arch corridors through buildings are now roofed passages — the
  roof runs unbroken over them (no more gap between roof and wall), the arch is a
  doorway-sized opening in the face, and people genuinely disappear through them and
  re-emerge on the far side.
- **Clock tower** re-seated on the building sliver — narrower, based into the roofline,
  no more overhang.
- **T-junction**: the lane's north curb now breaks at the cross-street mouth (the dark
  border across the junction is gone).
- **Balloon** now drawn above the lighting pass, so lit windows no longer glow in front
  of it.
- Verified: terracotta ridges read as roofs; junction clean; tunnel mouths tidy.

## Iteration 22-23 — addition: the river quarter (world widened 96 → 124)
- East of the allotments: a paved plaza with a playing fountain (stone rim, centre
  bowl, animated spray and splash), four plaza trees, two benches, and corner flower
  planters on the CA; the plaza opens onto the lane through a wide mouth.
- Beyond it, a quay with benches and a rail, and the river running the full height of
  the world and off the bottom of the frame. The lane crosses it on a bridge with
  railings — and casts a shadow on the water downstream.
- A rowboat drifts downstream now and then, oars dipping, and vanishes under the
  bridge ("A rowboat slips under the bridge and out the other side.").
- New destinations wired into street life: fountain gazers, plaza bench sitters, quay
  rail leaners. Lamps for plaza, quay, and bridge; new click actions (coin in the
  fountain, pebble in the river); new ambient ticker lines.
- Verified at day 1 and day 6: fountain playing, planters blooming, quay in use.

## Iteration 24 — night verification
- Full-town night frame: lamps across all districts, lit clock face, fireflies on both
  greens, moonlit river, and the dawn sweeper starting his round.

## Iteration 25 — improvement: the tunnels, for real this time
- Called out correctly by Alec: iteration 21 roofed the passages and hid walkers, but
  the mouths were still opaque black slabs — visually unchanged where it counted.
- Arch mouths are now vaulted: a dark outer ring, a deeper vault ring, a floor shadow,
  and daylight showing through at the far end of the passage. Verified with zoomed
  crops of the south and north arches.

## Iteration 26 — the buildings become real volumes
Alec's note was that the town still read as flat slabs: people flashed through walls,
roofs met each other end-on, and there were black gaps between wall and roof. So the
whole building layer was rebuilt from the footprint up.

- **Roofs are grown, not painted.** A distance transform over the building footprint
  lifts every roof *vertex* by its distance to the nearest edge of its block. Ridges,
  hips and valleys now fall out of the geometry, so the courtyard's four ranges hip
  into each other at the corners instead of butting flat. Shading comes from the real
  surface normal against a sun that tracks the hour.
- **Walls can no longer gap.** Each wall face is extruded from the ground to the roof
  height *at its own eave vertex*, so the "big black gap above the wall" between the
  plaza and the allotments — and the thinner one along the gatehouse row — are gone by
  construction, not by fudging a number. Eaves overhang and cast a shadow line on the
  wall beneath them.
- **The black square at the left end** was the south band's face starting at x=3.
  Everything now draws from twelve columns outside the frame on each side, hazed toward
  the sky, so the town continues past the edge instead of stopping in mid-air.
- **The projection was leaking seams.** The perspective pinch keyed off world depth, so
  anything standing up was scaled for a different row than the ground beside it — hence
  the black slivers alongside the courtyard walls. It now keys off *screen* depth, so
  elevated geometry lines up exactly with its neighbours.

## Iteration 27 — archways you can actually watch people walk through
- North/south gateways are roofed passages with a real vaulted mouth: six receding
  rings, a flagged floor that brightens toward the far end, a band of spill light at
  the far opening, and a stone surround with a keystone. Walkers inside the passage are
  drawn *clipped to the arch*, so they walk in, recede up the tunnel and are swallowed
  by the vault rather than vanishing at the wall.
- East/west passages (which are seen almost edge-on) are now open cuts through the
  block instead of arches — you look down into them and nobody disappears at all.

## Iteration 28 — the things that were bothering the eye
- **Clock tower**: rebuilt as a volume — shaft with string courses that have visible top
  ledges, a numbered dial, a louvred belfry, a projecting cornice, a three-faced pyramid
  cap and a weathervane, seated into the roofline with lead flashing.
- **The shed by the allotments** is a little building now: boarded front, gable, door,
  window, both roof slopes visible, a water butt and a cast shadow.
- **Plaza trees** were floating: they sit in stone tree pits with grilles, have root
  flares, and cast shadows that follow the sun. Lane trees got pits too.
- **Chimneys** on the ridges, with pots — and smoke drifting from them on cold mornings,
  damp afternoons and after dark.
- Terrace fronts are now separate houses: per-house plaster tones, brick fronts,
  party-wall lines, sash windows with sills and glazing bars, and front doors.
- Buildings cast real shadows on the ground, redrawn as the sun moves.

## Iteration 29 — sky, and a window to look out of
- A full sky: gradient by hour, stars, a sun and a crescent moon on the same arc,
  hazed hills and a silhouetted skyline of the rest of the town with its own lit
  windows. The black band above the roofs is gone.
- At the bottom, our own windowsill in silhouette — two pots of geraniums and a
  forgotten cup — so the near dark reads as the room we're looking out of.
- Night lighting retuned: lamps throw a tight glow plus a pooled ellipse instead of
  large white blobs; every lit window carries its own small halo.
- Washing lines now hang actual shirts and sheets rather than coloured blocks.

## Iteration 30 — addition: the far bank (world widened 124 → 138)
- Across the river: a stone bridge with three arches over the water, balustrade and
  coping; a towpath with mooring rings and a timber jetty; and a church green reached
  through a gate in the lane wall.
- **The church** has a nave, a tower with a louvred belfry, corner pinnacles, a slate
  spire and a cross, and a rose window over its west door. Its bell answers the clock
  at nine and six.
- On the green: an eight-post bandstand with an ogee roof and finial, an orchard of
  apple trees, benches, and lamps.
- A pair of swans work their way up and down the river.
- New street life: riverside strollers cross the bridge for the green or the towpath;
  an alley now cuts through the terrace between the allotments and the plaza.
- Also: cobbled setts on the roads, raised kerbs, a paved roundel radiating from the
  plaza fountain, stone embankments on both banks, and river ripples.

## Iteration 31 — improvement: a smooth sun, and honest tunnels
- **The sun was jumpy** because the sky was baked into the cached static layer, which
  only rebuilds every fifteen simulated minutes — so the sun hopped across the sky in
  steps. The sky is now painted fresh every frame *underneath* the static layer (which
  is left transparent above the roofline), and the slow parts of it — stars, hills, the
  far skyline — are cached in their own layer so the per-frame cost stays small.
- **Tunnel shading was backwards**: darkest at the mouth, which is exactly where light
  gets in. A passage is now lit at both ends and deepest in the middle, for both the
  vault and the floor.
- **The ground seen through a tunnel is now the real ground it leads to**: each arch
  samples the actual grid cell you'd be standing on once through and colours its far
  opening with that material, so the courtyard gateway shows courtyard paving and the
  allotment gate shows allotment grass, rather than a hand-picked beige.

### Where things ended up
One connected town, all one CA-driven diorama seen from your upstairs window — over
your own sill, past the washing lines, out to the hills: the original courtyard
(untouched at heart), the lane with kiosk, café, benches and market days, the cross
street with its clock tower, the allotment gardens with plots, shed and duck pond, the
plaza and its fountain, and across the bridge a church green with a bandstand, an
orchard and a towpath. Buildings are real volumes with hipped roofs, chimneys and
gateways you can watch people walk through. Weather (rain, wind, wet streets), a full
sky with sun, moon and stars, wildlife (ducks, swans, pigeons, butterflies, fireflies,
one night cat), and a rare hot-air balloon. Interactions: click beds to sow flowers,
plots to sow veg, grass for daisies, pavement for crumbs, pond to summon the duck navy,
the river for a pebble, the fountain for a wish.

Handy while working on it: `?fast` runs at 8×, `?t=<seconds>` jumps the clock
(day length is 55s), and the two can be combined.
