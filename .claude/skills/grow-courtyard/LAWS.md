# Laws the loop derived

Read in full by **every** worker iteration. That is what makes a law worth having
and what makes it expensive — so this file is **capped at 60 laws / 12 KB** and the
manager must distil, merge and supersede rather than append. `context-budget.mjs`
polices it.

Format: `- **Short name.** One or two sentences. (learned at #N)`

A law belongs here only if it will be true of the **next** vector too. Anything
that is only true of the thing you just built belongs in `LEDGER.md`, which is
archived and never read again.

---

## Inherited — paid for by the previous loop (Solvista, 369 iterations)

These were bought at real cost by the loop that came before this one. They are
here so this loop does not buy them twice.

- **Read the seam, not the file.** `courtyard.html` is ~3,000 lines. Reading it
  whole burns a third of a fresh context before you write a line. `grep -n` the
  symbol, then `Read` with `offset`/`limit`.
- **The ledger is not the inventory.** The town predates the loop. Before adding
  anything, check `state.json`'s inventory *and* grep the source — the previous
  loop nearly shipped beach towels onto a beach that already had them.
- **Probe before you judge.** For a draw-only change, a twenty-line probe beats a
  confident visual opinion. Three separate agents once looked at the same bug and
  all three named the wrong cause; a probe found it on the first run.
- **A screenshot cannot see motion.** Teleports, pop-in, flicker and draw-order
  strobing survive any number of still frames. Use `motion.mjs` (numeric) and
  `filmstrip.mjs` (contact sheet + frame diffs) when your change touches anything
  that moves or is drawn per frame.
- **Judge frame time against an interleaved same-session control**, never a stored
  baseline. The machine swings ±30% with load, so yesterday's baseline measures
  yesterday's load.
- **Locate, don't judge.** When something looks wrong, first find *where* it is
  drawn. Half of "this looks bad" is actually "this is drawn in the wrong pass".
- **One predicate, one definition.** If two places decide the same thing (is it
  market day? is it raining?), they will drift. Compute it once, read it twice.
- **The census is a regression guard, not a growth score.** A draw-only iteration
  reading `+0` everywhere is expected, not a failure.
- **Don't add a census field per feature.** Add one only when a system moves
  nothing the hook already reports. The previous harness sprawled to ~15 bespoke
  metrics, which is grading your own homework.
- **A killed iteration is often finished work.** The commit is the last thing an
  iteration does, so a dirty tree may be complete, gate-passing work that only
  missed its commit. Inspect before you discard.
- **Promote a law, don't just log it.** A finding that will be true of the next
  vector belongs here; an entry rotates into the archive and is never read again.
  The previous loop independently re-derived three of these laws for dozens of
  iterations before anyone promoted them.
- **Cap the thing that is read most.** Capping the prose ledger alone just pushed
  the growth into the file read on every single run. Budget by what is read, not
  by what is written.

## This town

- **Every random draw goes through `R()`** (or `hash(x,y)` per-cell). A bare
  `Math.random()` is invisible to `?seed=` and silently breaks the census.
- **Census fields are town state, never render state.** A per-frame draw
  accumulator makes the census non-reproducible — the lit-window list did exactly
  this and had to be removed. (learned at #0, building the harness)
- **`project()` pinches on screen depth**, not world depth. Reverting that
  reintroduces a black seam beside every wall.
- **Roofs are emergent.** `buildVolumes()` lifts each roof vertex by its distance
  to the block edge. Do not special-case a roof; change the footprint instead.
- **Any new `R()` draw reshuffles the whole seeded world.** Everything downstream
  moves: the census histogram churns everywhere, a motion gate fires on a kind you
  never touched, a shower lands on a different frame. Read a census diff for
  *collapse*, not for delta. When a gate fires on something you did not build,
  measure that system's own distribution on HEAD, or dump the page's state
  (`__census().clock`, the ticker) per frame — before you theorise. If a system was
  already sitting on a threshold, move the system, not the threshold. (#2, #4, #5)
- **Time-compress everything you build.** A day is 55 s. "Every third hour" is
  every ~7 s, so an effect lasting more than ~2 s stops reading as an event and
  becomes state; a round trip longer than ~40 s leaves its walker permanently
  present regardless of the cap that spawned it. Caps set the inflow, trip length
  sets the standing population and its phase. Measure duration against the *day*,
  never against the clock you hung it off. (#2, #5)
- **Reseed before you measure.** Any `?pause` + `__warp()` probe must call
  `__reseed()` first. A paused frame still consumes PRNG draws and the frame count
  before the first warp is machine-dependent, so an unreseeded probe does not
  error — it quietly reports a different plausible number every run. (#3)
- **Rate-cap a slow world scalar, don't ease it.** A cap makes "it never steps" one
  measurable number (max delta per sample = the cap), so continuity is proved by a
  probe instead of argued from a screenshot. (#3)
- **Two figures nearer than ~0.9 cells render as one shape.** Anything that puts
  people in the same spot — a queue, a bench, a haggle, a conversation — has to
  hold them apart to read at all. (#4)
