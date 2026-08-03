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
- **Rate-cap a slow world scalar, don't ease it.** A cap makes "it never steps" one
  measurable number (max delta per sample = the cap), so continuity is proved by a
  probe instead of argued from a screenshot. (#3)
- **Two figures nearer than ~0.9 cells render as one shape.** Anything that puts
  people in the same spot — a queue, a bench, a haggle, a conversation — has to
  hold them apart to read at all. (#4)
- **A feature that exists may exist at a rate of zero — count before you build on
  it.** A spawn band is a *share of a budget*, not a rate: `spawnLaneAgent` fires
  ~3.3×/day, so a 4% band is one person per twelve days, and the allotment
  gardeners ran at 0.06–0.22/day. Measure how often the thing actually fires; if
  the answer is "rarely", give it its own arrival source rather than widening a
  band. Rate is a design parameter, not an implementation detail. The town has
  three arrival sources with separate budgets — put a destination on the one whose
  front door it is. (#7, #9 — and a watch note at #0; paid for three times)
- **A per-agent trait must be a field written only at spawn.** `a.phase` is the
  walk cycle, and `a.timer`, `a.greet`, `a.chatCool`, `a.watch` all count down —
  read any of them as a stable personal threshold and the value cycles the whole
  band several times a second, which looks like a stagger and is a flicker. Give
  the trait its own field (`a.wary`), then predict the fraction that should react
  and count the fraction that did. (#6)
- **Stage an appearance as N clamps on one 0..1 progress**, never as timed steps —
  running the progress backwards then packs the thing away in reverse order for
  free, with one code path to get right. Keep each crossfade window no wider than
  the lowest threshold it fades in from, or the first item sits permanently
  translucent: a 0.14 window against a band starting at 0.10 left a garment at 71%
  alpha in perfect weather for four gate runs. (#6, #8)
- **A probe's world is only as rewound as you make it.** `__reseed()` rewinds the
  PRNG, `__setTime()` rewinds the clock, and *neither* rewinds module-level latches
  (`marketAnnounced`, `windAnnounced`, `bellSeen`, `lastStruck`) or the agents
  already spawned. So: reseed before you measure; do all stepping inside ONE
  `page.evaluate`, because the page keeps running its entity loop between host
  round-trips; and take a fresh page per measurement. Skip any of the three and the
  probe does not error — it reports a different plausible number every run, or
  invents a bug in code that is fine. (#3, #6, #8)
- **`filmstrip.mjs`'s Δ is a whole-frame mean** — blind to anything under ~2% of the
  canvas, loud about anything global. Ask what fraction of the frame your change
  occupies and crop to it (`probes/market-raise.mjs`). When it does POP, reproduce
  its exact world first — it seeds `?t=0` then `__warp(t)`, which is not the world
  `?t=<t>` gives you — then localise with a region-wise diff before theorising: a
  jump in every cell is weather or light, not your draw order. (#8, #9)
- **Read `probes/` before writing a probe.** It is part of the seam and it is not in
  the worker's read budget, so every iteration is one `ls` away from re-solving a
  solved measurement. Leave yours there too, inside the skill — an unanchored
  `.gitignore` line at the repo root will otherwise swallow it. (#7, #9)
- **A CA rule that makes a region coherent makes it monotonous.** When a cell
  inherits state from its neighbourhood, check what the inheritance does to
  *variety* over many cycles, not just to the cycle in front of you — plot-coherent
  re-sowing was right and quietly lost two of the four vegetables. Something has to
  reset it. (#7)
- **A queued line that depends on another line is not an independent entry.** Bind
  it as a follow-on enqueued at the *display* time of its antecedent, or the drop
  policy will eventually show the reply without the remark. Any drop-oldest queue
  will, given enough traffic, break exactly the pairs you added it to protect. (#10)
