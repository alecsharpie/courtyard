# probes

Per-feature measurement scripts that earned their keep.

An ad-hoc probe is born at the repo root as `probe-*.mjs`, where `.gitignore`
ignores it. When a ledger entry cites one, `git mv` it in here and it becomes
tracked source like anything else.

That pattern exists because of a bug in the previous loop: its root ignore rule
was unanchored, so it matched at *every* depth, and every probe worth keeping
needed `git add -f`. For about twenty iterations the ledger cited probes the repo
did not actually contain. The rule here is anchored to the root — check
`.gitignore` before you move the next one.

**`git mv` it, don't just commit it where it lies.** Iteration 9 put
`parapet-and-boat.mjs` in a *second* `probes/` directory at the repo root. Nothing
ignored it — it was tracked the whole time — but it was not here, so #10 read it as
missing and blamed a `.gitignore` line that has never existed. Two directories with
the same name is its own failure mode. There is one `probes/`, and this is it.
Probes resolve the artifact as `../../../../courtyard.html`. (moved at #11)

- `shadow-cover.mjs` — the cast shadows against a forced cover ladder, measured as a
  DIFFERENCE IMAGE against an older build rather than a statistic of the frame (cover
  already recolours everything, so an absolute metric moves for reasons that are not
  yours). Also prints the main canvas's real-time noise floor, by running the ref
  against itself. (#22)
- `ground-relight.mjs` — is a new term drawn into the cached ground layer a worse
  staircase than the one `lightBucket` already imposes? Rides a front up on the real
  slew and sizes every rebuild jump, plus the ms cost of one relight. Reusable by any
  future ground-layer vector. (#22)

- `dusk-relight-where.mjs` — the filmstrip's dusk Δ split by screen row and by the cached
  ground layer alone (composited through any fade), at any gap down to one 60 fps frame.
  Localises a whole-frame number before anyone names a cause. (#48)
- `ground-rebuilds.mjs` — counts `drawGround()` rebuilds per sim day, summer and winter,
  attributed to light bucket / snow / other. (#48: ~650/day, 80% from grass wear)
- `where-camera.mjs` / `where-identity.mjs` / `where-live.mjs` / `where-cost.mjs` — the
  quarter camera (#80): scale, cache view and hit-test round trip per quarter at 390 and
  1400; whole-canvas hash identity with HEAD at the wide view before AND after a round
  trip; the real tap path on a phone (rAF ease, naming under zoom, resize mid-quarter,
  offer order); draw ms at rest, mid-ease and zoomed. `__where(n, secs)` is the seam.
- `shade.mjs` — the linden's shade as a place (#94): courtyard presence by kind and hour
  on 10 summer seed·days, the shade's coverage of the picnic annulus and the inner lawn,
  every picnic's blanket choice AT SPAWN (hot/cool, inside the ellipse), `--warmth W`
  pinned after `updateClock`, `--force-false` for the identity control, `--hash` for the
  canvas at two pinned instants, `--names` for the sundial's and a sleeper's names.
- `cloud-shade-*.mjs` — the sky's shadow on the town (#102). All five draw the frame TWICE
  per instant, once with `drawCloudShade` and once with it swapped for a no-op, so what is
  measured is the pass and nothing else; all capture inside the `evaluate` (a `cv.screenshot()`
  after it is unpinned — the rAF loop redraws with `cloud` slewed back off the pin).
  `-identity` a canvas hash against HEAD up a cover ladder — neutrality is byte-identity below
  the gate and after dark, and the expectation is derived from the page's own `daylight`, never
  from the case label. `-shot` a pinned pair plus an amplified DIFFERENCE image and a 12×6 grid
  of mean Δ%: the pair is what to look at, the grid is what to believe. `-strip` a contact
  sheet cropped to a world box with the crop's luma as a % of its own unshaded frame, so the
  day's arc cancels. `-wind` travel per sim second by cross-correlating the darkening's column
  profile (mean-subtracted — a non-negative profile's DC term reports "it did not move").
  `-presence` how often the town actually sees it, at natural cover, by cover band.

- `sill-*.mjs` (#111) — the sill at all five cameras. `-cameras` the gate: the BAND below
  `sillTop()` (max luma / mean / share over 40) and OVERPAINT, the share of the sill's own
  OPAQUE DARK pixels — cache luma < 20, alpha 255 — that read brighter than 40 live. Take the
  second measure only that way: a raw RGB diff of live against `gcv` calls 4% of the pot boxes
  overdrawn on a build where nothing is, because the cache's alpha there is 209–224 and
  `getImageData` returns it UNPREMULTIPLIED. Night rows are the control (the band must still
  darken). `-sweep` the blanket version — 54 instants × 5 cameras, worst band max, which is what
  catches anything drawn after `sillOver`. `-ease` samples the 0.9 s camera ease and reports the
  share of band pixels that changed per step: HEAD 99%, a fixed sill 0%. `-modes` reduced motion,
  rain and snow. `-containment` the wide frame against HEAD, bounding box and worst Δ.
  `-camera-shots` a bottom-band crop per quarter per framing.

- `pave-*.mjs` / `moss-pool.mjs` / `pool-cost.mjs` (#126) — the paving's memory.
  `pave-wear` the PREMISE: cell counts off the grid per region, foot-presence per cell over
  N days (the plaza's desire line exists on ~120 of its 730 cells, the quay's on ~90 of 130),
  and the paveWear distribution where it already accrues — that p99 is where `PW_FULL` came
  from. `pave-line` the RAMP alone, with no camera in the way: the RGB distance `groundBase()`
  moves each paved cell against the same cell drawn with its wear zeroed, and `--show/--full`
  rewrite the two consts so it sweeps. `pave-diff` the shipping-size gate, after `quay-diff`
  (#114): HEAD's frame carried into the candidate page and attributed by the page's own
  `unproject()` to plaza / quay / lane / other. It also prints a SIM FINGERPRINT (clock, wind,
  cloud, agent-position sum, blooms) — a `?pause`d page still runs rAF, and one run of this
  caught a frame read mid-flight and reported 18.7% of "elsewhere" changed where three
  repeats since read 0.84%. Trust the number only when the fingerprint says NONE.
  `moss-pool` walks a whole year and splits the 860 mossy cells by whether they pool, because
  a CEILING only binds in the growing season and a summer instant sees nothing. `pool-cost`
  the budget: `frame-cost.mjs` averages a whole sim-day and a day is mostly DRY, so
  `drawPuddles` returns on line 1 for most of it and the day mean cannot see a pool count at
  all. This pins the weather wet and times `drawScene` and `drawPuddles` alone, interleaved.

- `quota-gate.sh` — the only test of a HARNESS gate rather than of the town. `--additions`
  existed from #149 with no caller, so it bound nothing for thirty iterations; this extracts
  step 4 of `run-loop.sh` VERBATIM and runs it both ways — clean tree silent and exit 0,
  over-quota tree naming an offender on all three surfaces at exit 3. It fails if the block
  is deleted or renamed, which is the failure mode it exists for. Writes to `LEDGER.md` and
  `state.json` and restores them, so it refuses to start on a dirty one. (#153)

- `tenant-leads.mjs` — the tenant on the leads (#170/#171). Counts PEOPLE south of the
  lane against a HEAD control regenerated inside the probe, which is the exact witness for
  the brief's premise ("nobody has ever stood on our own block"): HEAD reads 0.00%, the
  candidate 17%. Also measures the three things a screenshot and the census both miss —
  CONTAINMENT (off their bay, north of the leads, and the shallowest depth they are
  DRAWN at, which must stay south of LN_WALK_S or a figure appears in the lane's footway),
  per-step CONTINUITY (motion.mjs folds tenants into `walker`, so it is silent about them
  rather than clean), and WHY the washing came in, read at the SPAWN — rain flips
  `washOut()` directly but `wetF() > 0.22` holds it false long after, so the weather
  during the walk is not the cause of the errand. Reusable by any near-block life vector.
- `leads-shots.mjs <act> [seed]` / `hatch-states.mjs` — the pictures the ledger cites.
  Both warp until the named act (or the open/shut lid) is actually happening, then pin the
  instant and read the canvas in the SAME evaluate as the draw.
