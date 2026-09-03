---
name: grow-courtyard
description: Grow The Courtyard by ONE briefed vector — implement it, verify it against the census and screenshots, log it, commit it, exit. The worker half of the autonomous loop; the manager decides WHAT to build, this decides HOW and proves it landed.
---

# grow-courtyard — the worker

You are **one iteration** of an autonomous loop that grows `courtyard.html`, a
living cellular-automata diorama of a courtyard, a lane and the town around it.

**You do not choose what to build.** A manager Claude read the accumulated stats,
the ledger and the town's state, and wrote you a brief. Your job is to build that
brief well, prove it landed, record what you learned, and exit. One vector. One
commit.

> If you were invoked by a human with no brief on disk, say so and run
> `/courtyard-manager` first — or, if they named a vector, treat their words as
> the brief and skip step 1.

---

## Read this much, and no more

A fresh process re-reads its whole context before doing any work, so what you read
*is* the cost of an iteration. The last incarnation of this loop let that grow
without limit: its laws file reached 62% of a 3,900-line skill file and was read in
full on every single run, and cost per iteration tripled while output fell. **The
budget below is load-bearing.**

| Read | Always | Why |
| --- | --- | --- |
| `current-brief.json` | ✅ | what to build |
| `LAWS.md` | ✅ | ~12 KB, capped — hard-won rules |
| `state.json` → `inventory`, `openCues` | ✅ | what the town *already has* |
| `LEDGER.md` last 2–3 entries | ✅ | what just happened |
| the **seam** of `courtyard.html` | ✅ | `grep -n`, then `Read` with offset/limit |
| `LEDGER-archive.md` | ❌ never | the manager reads it; you don't |
| the whole of `courtyard.html` | ❌ never | ~5,300 lines — a third of a fresh context |
| `stats.html` / `RUNLOG.jsonl` | ❌ never | the manager's inputs, not yours |

`node .claude/skills/grow-courtyard/context-budget.mjs` prints what you're about to
read. The TOTAL is the **manager's** number: if it says OVER, note it and move on — you
cannot fix it inside your own iteration. What is yours is `--additions`, run at step 5:
**one** ledger entry ≤ 1.8 KB, **at most one** inventory line and **one** cue, ≤ 250 B
each. Over that is not "trim it", it is **merge** — into the entry, line or cue already
there. That append is what the total is made of.

---

## The iteration

### 1. Take the brief

```bash
cat .claude/skills/grow-courtyard/current-brief.json
```

It carries `domain`, `kind`, `brief`, `seams`, `successLooksLike`, and a `budgetMin`
hint. The runner already popped it off the queue — it is yours.

**Check the brief against reality before you build it.** Read
`state.json`'s `inventory` and grep the named `seams`. If the thing already exists,
**do not build it again** — write a one-line ledger entry saying so, set
`briefRejected` with the evidence, and exit cleanly. A rejected brief is useful
information; a duplicated feature is waste. (The previous loop nearly shipped beach
towels onto a beach that already had them, then later burned seven whole iterations
independently re-discovering that everything it wanted already existed.)

### 2. Pin the baseline

```bash
node .claude/skills/grow-courtyard/census.mjs --save-baseline
```

Once, before you edit. It pins the seed × time matrix so any later diff is
attributable to your change.

### 3. Build it

One focused change, in the house style (see **Invariants**). Read the *seam*, not
the file:

```bash
grep -n 'marketActive\|MARKET_STALLS\|spawnLaneAgent' courtyard.html
```

then `Read` with `offset`/`limit` around the hits.

Small and shippable beats sweeping and broken — but if the brief says `risk: high`
or asks for a structural swing, take the swing. Both timidity and sprawl are
failure modes; the brief tells you which side to err on.

### 4. Prove it — all applicable gates

**Census (always).**

```bash
node .claude/skills/grow-courtyard/census.mjs
```

Exit 0 = no page errors, no headline collapse. Non-zero = a page threw or a core
aggregate cratered — **fix it before continuing.**

Then read the diff and confirm your change moved the thing you intended. The
census is a **regression guard, not a growth score.** A draw-only change (polish,
lighting, a new animation) legitimately reads `+0` everywhere. That is not failure
— it means the census can't see this vector, so you need the next gate.

**Do not add a census field per feature.** Add one only when a system moves nothing
the hook already reports. Grading your own homework with a bespoke metric is how a
dashboard sprawls to fifteen meaningless numbers.

**Visual (always).**

```bash
node .claude/skills/grow-courtyard/shoot.mjs --shots wide,courtyard,east,lane
```

Look at the PNGs. Then look at the *unchanged* parts too — the most common defect
in this codebase is a draw-order regression somewhere you weren't editing.

**Motion (whenever you touch anything that moves or is drawn per frame).**

A still frame proves the town looks right in one instant. It cannot see a walker
teleporting across the lane, a duck popping out of existence and back, a sprite
that strobes on alternate frames, or a leaf drifting off to `NaN`. Those are
exactly the bugs that survive a screenshot gate.

```bash
node .claude/skills/grow-courtyard/motion.mjs --save-baseline   # before your edit
node .claude/skills/grow-courtyard/motion.mjs                   # after
```

Numeric and deterministic: every moving thing is sampled by identity every 0.25 s
of warped sim time, and continuity becomes a measurement — `jumps`, `nan`, `oob`,
`flicker`, `spawns`, `despawns`, per kind, diffed against the baseline. Legitimate
teleports exist (rain recycles, birds respawn off-screen), so what fails the gate
is a kind that *started* jumping, not the existence of jumps.

Then look at the motion:

```bash
node .claude/skills/grow-courtyard/filmstrip.mjs --scene day --n 12
node .claude/skills/grow-courtyard/filmstrip.mjs --scene night --gap 0.1   # chase a flicker
```

One labelled contact sheet in `shots/`, plus the frame-to-frame pixel-difference
series. The numbers tell you which frame is suspicious — a `POP` flag is a change
far larger than its neighbours, usually a cached layer rebuilding or a draw-order
fault; `FROZEN` means nothing moved at all. Your eye then decides whether the thing
that changed was meant to. Frames are stepped with `__warp()` at a pinned seed, so
you can generate the same filmstrip before and after and compare frame for frame.

**Probe (when the census is blind).** For draw-only vectors, write a throwaway
`probe-*.mjs` at the repo root (gitignored) that measures the specific thing —
count the pixels, sample the colour, assert the entity moved. A twenty-line probe
beats a confident visual opinion: in the previous loop, three separate agents
looked at a bug and all three named the wrong cause; a short probe found it in one
run. If a probe earns its keep, `git mv` it into `probes/`.

**Perf (when the brief asks, or you added a per-frame pass).**

```bash
node .claude/skills/grow-courtyard/perf.mjs
```

Judge it against the **interleaved control it runs in the same session**, never a
stored baseline — this machine swings ±30% with load.

### 5. Land it

Whatever happened, record it. In order:

1. **Ledger entry** — append to `LEDGER.md` (see the template at its head). Be
   concrete and short. If you learned something that will be true of the *next*
   vector too, say so under `**Law:**` — the manager will promote it into
   `LAWS.md`. A finding logged in an entry gets archived and never read again; a
   promoted law is read forever. That distinction is the loop's whole memory model.
2. **State** — `node .claude/skills/grow-courtyard/state.mjs --add-inventory "…"`
   for anything the town now contains that a future brief could duplicate. Add
   `--cue "…"` for a loose end you noticed but did not chase.
3. **Quota** — `node .claude/skills/grow-courtyard/context-budget.mjs --additions`.
   It diffs the working tree against HEAD, so run it **before** you commit. Non-zero
   names the line that broke the quota: merge it and re-run. The runner re-runs it
   after your commit against the commit you started from, and records the breach in
   your RUNLOG row — it will not revert you, but the manager sees it.
4. **Commit** — subject line exactly:
   ```
   Iter <N>: <what changed> (<Domain> × <Kind>)
   ```
   Append ` (explored -> reverted)` if you backed the change out. `<N>` is
   `nextIter` from `current-brief.json`.

If the change did not work out, **revert the source and still commit the ledger
entry.** A negative result that is written down is worth more than a silent
rollback — the manager prices future briefs off it.

---

## Verdicts are not yours to declare

You write down what you did. `runlog.mjs` decides what it *was*, from evidence: did
`courtyard.html` actually change, did HEAD move, did the census shift. Your own
label is recorded alongside as `selfVerdict`, and the gap between the two is a
tracked statistic.

This exists because the last loop's final nine iterations are logged as `SHIPPED`
while their own ledger entries say `NO SHIP` in the title. Nobody was lying; the
verdict was simply parsed from prose the worker wrote about itself. So: describe
honestly, claim nothing, and let the diff speak.

---

## Invariants — do not regress these

- **`courtyard.html` stays a single self-contained file.** No build step, no
  external fetch, no CDN. It must open from `file://` and from GitHub Pages.
- **`buildVolumes()` is emergent, not hand-drawn.** A distance transform over the
  `WALL`/`TUNNEL` footprint lifts each roof vertex by its distance to the block
  edge, so ridges, hips, valleys and gap-free wall-to-eave joins fall out of the
  data. Do not special-case a roof.
- **Passages are typed.** `TUNNEL` = roofed (drawn as a clipped vaulted arch with
  the walkers inside). `SLOT` = an open cut, for east–west passages seen edge-on.
- **Three more you will find stated as laws** — `project()` pinching on *screen*
  depth, every draw going through `R()`, and census fields being town state and never
  render state. They are invariants; `LAWS.md` says why, so they are not repeated here.
- **Reduced motion is respected** (`RM`) and the page must stay usable on mobile
  (390×844 is a tracked framing).
- **The courtyard survives everything.** The garden at the centre is the thing this
  piece is *for*. Grow the town around it; never trade it away for the town.

## Debug hooks

| | |
| --- | --- |
| `?fast` | 8× speed |
| `?t=<seconds>` | start the clock at a sim time (day = 55 s) |
| `?seed=<n>` | deterministic world |
| `?pause` | freeze the clock; `__warp()` then owns all time |
| `__warp(secs)` | advance the sim synchronously, fixed dt, no drawing |
| `__reseed()` | rewind the PRNG to its seeded start |
| `__census()` | the structured count of everything the town contains |
| `__entities()` | every moving thing, with a stable id — the motion gate's seam |
| `__setTime(t)` | jump the clock |

## Files this skill owns

```
.claude/skills/grow-courtyard/
  SKILL.md              this — the worker protocol
  LAWS.md               capped, curated by the manager; read every iteration
  LEDGER.md             prose entries, last ~8; older → LEDGER-archive.md → LEDGER-deep.md
  state.json            town state: coverage grid, inventory, open cues, menu
  plan.json             the manager's brief queue
  current-brief.json    the brief you are working on right now
  RUNLOG.jsonl          one structured row per iteration (the meta-analysis data)
  census.mjs            numeric gate  ·  census-baseline.json / census-history.jsonl
  motion.mjs            continuity gate — teleports, NaN, flicker, churn
  filmstrip.mjs         contact sheet + frame-to-frame pixel diffs
  shoot.mjs             screenshots   ·  perf.mjs  frame-time gate
  state.mjs             read/update state.json from the command line
  context-budget.mjs    what a worker iteration must read, in bytes
  stall.mjs             stall signals from RUNLOG.jsonl (the manager's trigger)
  runlog.mjs            evidence-derived verdict → RUNLOG.jsonl
  build-stats.mjs       RUNLOG.jsonl → stats.html
  rotate-ledger.mjs     keeps LEDGER.md, LAWS.md and the manager's four inside budget
  archives.mjs          the one place that knows a rotated file has two halves
  pop-brief.mjs         queue → current-brief.json (the runner calls this)
  run-loop.sh           the runner
  probes/               probes that earned their keep
```
