# Laws the loop derived

Read in full by **every** worker iteration — which is what makes a law worth having
and what makes it expensive. Capped at 60 laws / 12 KB; the binding constraint has
been **bytes, not count**, since pass #15, so a law needing six lines is a law not
yet distilled. Manager curates: merge and supersede, never just append.

A law belongs here only if it will be true of the **next** vector too. Anything
true only of the thing you just built belongs in `LEDGER.md`, which is archived and
never read again. Format: `- **Short name.** One or two sentences. (learned at #N)`

---

## Inherited — paid for by the previous loop (Solvista, 369 iterations)

- **Read the seam, not the file.** `courtyard.html` is ~3,900 lines; reading it
  whole burns a third of a fresh context. `grep -n` the symbol, then `Read` with
  `offset`/`limit`.
- **The ledger is not the inventory.** The town predates the loop. Check
  `state.json`'s inventory *and* grep the source before adding anything — the
  previous loop nearly shipped beach towels onto a beach that already had them.
- **Locate and probe before you judge.** When something looks wrong, find *where*
  it is drawn first — half of "this looks bad" is "this is drawn in the wrong
  pass" — then measure it. For a draw-only change a twenty-line probe beats a
  confident visual opinion: three agents once looked at one bug and all three named
  the wrong cause; a probe found it on the first run.
- **A screenshot cannot see motion.** Teleports, pop-in, flicker and draw-order
  strobing survive any number of stills. Use `motion.mjs` and `filmstrip.mjs` when
  your change touches anything that moves or is drawn per frame.
- **Judge frame time against an interleaved same-session control.** The machine
  swings ±30% with load, so a stored baseline measures yesterday's load.
- **One predicate, one definition.** If two places decide the same thing — is it
  market day, is it raining, does this cell answer a click — they will drift.
- **The census is a regression guard, not a growth score.** `+0` everywhere after a
  draw-only iteration is expected. Its fields are town state, never render state (a
  per-frame draw accumulator makes it non-reproducible), and you add a field only
  when a system moves nothing the hook already reports — the previous harness
  sprawled to ~15 bespoke metrics, which is grading your own homework.
- **Promote a law, don't just log it — and cap the thing that is read most.** The
  previous loop re-derived three of these independently for dozens of iterations
  before anyone wrote them down, then capped its prose ledger and merely pushed the
  growth into the file read on every single run.

## This town

- **Every random draw goes through `R()`** (or `hash(x,y)` per-cell). A bare
  `Math.random()` is invisible to `?seed=` and silently breaks the census.
- **Two renderer traps.** `project()` pinches on *screen* depth, not world depth —
  reverting that reintroduces a black seam beside every wall. And roofs are
  emergent: `buildVolumes()` lifts each roof vertex by its distance to the block
  edge, so change the footprint, never the roof.
- **Any new `R()` draw reshuffles the whole seeded world.** The census churns
  everywhere, a motion gate fires on a kind you never touched, a shower lands on a
  different frame. Read a census diff for *collapse*, not delta; when a gate fires
  on something you did not build, measure that system's own distribution on HEAD
  before theorising, and if it was already on a threshold, move the system rather
  than the threshold. (#2, #4, #5)
- **Time-compress everything you build.** A day is 55 s, so "every third hour" is
  every ~7 s: an effect over ~2 s becomes state instead of an event, and a round
  trip over ~40 s leaves its walker permanently present whatever cap spawned it.
  Caps set inflow, trip length sets the standing population. Measure duration
  against the *day*. (#2, #5)
- **A slow world scalar wants a cap, a cycle and an anchor.** Rate-cap it, so "it
  never steps" is one measurable number. Prefer a cosine of a phase to a ramp — a
  ramp is an act that ends (`maturity()` and `richness()` had the whole town pinned
  at 1 by real minute 15) while a cycle is continuous through its own wrap. And
  write every term it replaces so that at the start phase it reduces *exactly* to
  the old constant, so day one is provably neutral and every gate failure is about
  the new range, not the new algebra. (#3, #12, #14)
- **When you turn a constant into a variable, hunt what was tuned against it.** The
  rest of the file does not know it moved — it keeps reading its own hard-coded
  number, and the two now disagree in a way nothing errors on. (#12)
- **A ceiling is not a kill term.** If a system already ages out whatever sits at
  its ceiling, lowering the ceiling empties it by itself; a removal term on top
  double-counts and reads as a cull. Give any global scalar that can approach zero
  per-cell variance (`hash(x, y+k) > c`) or the effect reads as a switch — ~1/7 of
  beds held at the full ceiling is what makes winter a scatter of blooms in turned
  earth instead of an empty grid. (#14)
- **Two figures nearer than ~0.9 cells render as one shape.** A queue, a bench, a
  haggle, a conversation — all have to hold people apart to read at all. (#4)
- **A feature that exists may exist at a rate of zero — count before you build on
  it.** A spawn band is a *share of a budget*, not a rate: `spawnLaneAgent` fires
  ~3.3×/day, so a 4% band is one person per twelve days. If it fires rarely, give
  it its own arrival source rather than widening a band — the town has three, so
  put a destination on the one whose front door it is. (#7, #9; paid for 3×)
- **An unadvertised affordance has a discovery rate of zero.** The same law one
  level up: the diorama answered six kinds of click for thirty-one iterations and
  nothing said so. One predicate both the cursor and the handler read; the
  invitation offered once ever, counted in **real** seconds (it is a reading speed,
  `?fast` must not hurry it), cancelled if the viewer finds it first, stood down on
  `?pause` — that is the harness driving, not somebody watching. (#13)
- **A per-agent trait must be a field written only at spawn.** `a.timer`, `a.greet`,
  `a.chatCool`, `a.watch` and `a.phase` all count down — read one as a stable
  personal threshold and it cycles the band several times a second, which looks
  like a stagger and is a flicker. Give the trait its own field (`a.wary`), then
  predict the fraction that should react and count the fraction that did. (#6)
- **Stage an appearance as N clamps on one 0..1 progress**, never as timed steps —
  run the progress backwards and it packs away in reverse order for free. Keep each
  crossfade window no wider than the lowest threshold it fades in from, or the
  first item sits permanently translucent: a 0.14 window against a band starting at
  0.10 left a garment at 71% alpha in perfect weather. (#6, #8)
- **Split a flag that gates both behaviour and drawing.** Keep the boolean for
  behaviour, add a 0..1 intensity beside it that every draw site multiplies by.
  End a population by not sending new members round again, not by deleting what is
  on screen. Fade the **largest** thing first: a full-canvas tint outweighs any
  number of small sprites in a whole-frame Δ. (#15)
- **A probe's world is only as rewound as you make it.** `__reseed()` rewinds the
  PRNG and `__setTime()` the clock; *neither* rewinds module-level latches
  (`marketAnnounced`, `bellSeen`, `lastStruck`) or the agents already spawned. So
  reseed before measuring, step inside ONE `page.evaluate` (the page keeps running
  between host round-trips), and take a fresh page each time. Skip any of the three
  and the probe doesn't error — it just reports a different plausible number every
  run. (#3, #6, #8)
- **Pin the instant, don't wait for it.** A harness that reaches a moment by
  sleeping in wall time lands somewhere else — a fixed wait jitters by many sim
  minutes, which is how two "same" shots came back a day apart. Drive with
  `?pause` + `__warp(t)`. And an instant is now a *phase as well as an hour*: hold
  season fixed across any axis you vary, or the axis measures the season. (#9, #14)
- **`filmstrip.mjs`'s Δ is a whole-frame mean** — blind under ~2% of the canvas,
  loud about anything global. Crop to your feature (`probes/market-raise.mjs`).
  When it POPs, reproduce its exact world first (it seeds `?t=0` then `__warp(t)`,
  which is not what `?t=<t>` gives you), then localise region-wise: a jump in every
  cell is weather or light, not your draw order. (#8, #9)
- **Read `probes/` before writing a probe.** It is part of the seam and not in the
  read budget, so every iteration is one `ls` from re-solving a solved measurement.
  Leave yours *inside the skill*, at `.claude/skills/grow-courtyard/probes/` — #9
  wrote to a second `probes/` at the repo root and the ledger cited a file the repo
  did not have. (#7, #9)
- **A CA rule that makes a region coherent makes it monotonous.** Check what
  neighbourhood inheritance does to *variety* over many cycles, not just the cycle
  in front of you — plot-coherent re-sowing was right and quietly lost two of the
  four vegetables. Something has to reset it. (#7)
- **A queued line that depends on another is not an independent entry.** Bind it as
  a follow-on enqueued at the *display* time of its antecedent, or a drop-oldest
  queue will eventually show the reply without the remark. (#10)
