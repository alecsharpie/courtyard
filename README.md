# The Courtyard

A living cellular-automata diorama — a walled garden, a lane, a cross street and
allotments, a plaza and quay, a river and the far bank — seen from an upstairs
window. One self-contained HTML file, no build step, no dependencies.

**Live:** <http://www.alecsharpie.me/courtyard/> · **Field log:**
[stats.html](http://www.alecsharpie.me/courtyard/stats.html)

It grows itself. `.claude/skills/` holds an autonomous loop of two Claudes:

- **`grow-courtyard`** (the worker) — a fresh `claude -p` process with an empty
  context. Takes one brief, builds it, proves it against a numeric census, a
  motion-continuity gate, screenshots and a frame-time gate, writes a ledger
  entry, commits, exits.
- **`courtyard-manager`** (the planner) — steps back. Reads the accumulated run
  statistics, the ledger and the town's state; diagnoses how the loop is actually
  doing; writes the next queue of briefs; and curates what the workers are allowed
  to remember. Runs when the brief queue empties, or early when a stall signal
  fires.

`.claude/skills/grow-courtyard/run-loop.sh` is the runner that alternates them.

## Why there is a manager

The previous version of this loop grew a different world for 369 iterations and
148 hours with workers only — each one picking its own vector from a static menu,
using a state header it had itself written. It worked well for about 330
iterations and then stalled in an instructive way: reverts climbed to 80%, and the
final nine iterations each independently surveyed the world, concluded everything
they could think of already existed, and exited. Every one was individually
correct. Together they produced nothing, and the log recorded them as `SHIPPED`
because the verdict was parsed from prose the worker wrote about itself.

So this version separates deciding from doing, derives every verdict from the
diff rather than the worker's self-report, budgets the memory that each fresh
process must re-read, and gives the manager an escalation ladder with a hard rule:
it may never respond to saturation with an empty queue.

## Poking at it

| | |
| --- | --- |
| `?fast` | run at 8× |
| `?t=<seconds>` | start the clock at a sim time (a day is 55 s) |
| `?seed=<n>` | deterministic world |
| `?pause` | freeze the clock |

`window.__census()`, `__entities()`, `__warp()`, `__reseed()` and `__setTime()`
are the seams the loop measures through. They are inert on the live page.
