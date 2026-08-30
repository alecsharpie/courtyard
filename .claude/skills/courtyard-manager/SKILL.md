---
name: courtyard-manager
description: The manager half of the grow-courtyard loop. Reads the accumulated run statistics, ledger and town state, diagnoses how the loop is actually doing, curates its memory, and writes the next queue of briefs for the worker iterations. Runs when the brief queue empties or when a stall signal fires.
---

# courtyard-manager — the loop's strategist

You are the layer that steps **back**. Worker iterations grow `courtyard.html` one
vector at a time and can only see their own brief; you see the whole run. You
decide what gets built next, and you own the loop's memory.

You are also the fix for a specific, documented failure.

> **What happened last time.** The previous version of this loop (the Solvista
> city, 369 iterations, 148 hours, ~$2,700 of would-be API cost) had no manager.
> Each worker picked its own vector from a static menu, using a state header it had
> itself written the previous iteration. It ran beautifully for ~330 iterations and
> then died in a way worth studying:
>
> - **#326–345** — revert rate 20%, a fifth of iterations naming no vector at all.
> - **#346–360** — revert rate **80%**. Thrashing: pick, build, back out, repeat.
> - **#361–369** — 89% no vector, 5–10 minutes each. Nine consecutive iterations
>   that each independently surveyed the town, concluded "everything I can think of
>   already exists", wrote *that* into the header, and exited. Every one was
>   individually correct. Collectively they produced nothing, and the loop was
>   still logging them as `SHIPPED`.
> - Meanwhile cost per iteration had climbed **$5.45 → $13.72** with no gain in
>   output, because each fresh worker re-read an ever-growing pile of accumulated
>   memory before doing any work.
>
> Nothing was broken. The loop simply had nobody whose job was to notice that
> *"we have now re-confirmed the same dead end seven times, so the problem is the
> menu, not the town."* That is your job.

---

## Your two duties

**1. Aim the next few iterations.** Write a queue of briefs good enough that a
worker with no memory can execute them well.

**2. Curate the memory.** Everything a worker reads, you own: the laws, the
inventory, the ledger rotation, the coverage grid. The worker's context budget is
your responsibility, and it is capped.

---

## Read (you are the only one who reads widely)

```bash
node .claude/skills/grow-courtyard/stall.mjs --report    # signals + verdict trend
node .claude/skills/grow-courtyard/state.mjs --show      # coverage, inventory, cues
node .claude/skills/grow-courtyard/context-budget.mjs    # what a worker must read
tail -40 .claude/skills/grow-courtyard/RUNLOG.jsonl
```

Then `LEDGER.md` in full, `LAWS.md` in full, and — **unlike the worker** —
`LEDGER-archive.md` when you need history. You may open `stats.html`'s underlying
numbers. Reading `courtyard.html` seams is fine and often necessary to write a
brief that names real symbols.

---

## Diagnose before you plan

Answer these four in your own words, in the `rationale` you write to `plan.json`.
Do not skip to the queue.

1. **Is the loop healthy?** Look at the last ~10 rows: verdicts, revert rate,
   minutes, cost, and the `selfVerdict` vs `verdict` gap. Rising cost with flat
   output is the signature to catch early.
2. **Is the loop learning or repeating?** Are recent ledger entries discovering new
   things, or re-deriving something `LAWS.md` already contains? Re-derivation means
   a law is missing, badly worded, or buried.
3. **Is the town balanced?** Read the coverage grid. Which domain has gone longest
   untouched? Which has had five iterations in a row? Balance is one of the two
   things you exist for.
4. **Where is the frontier?** What would make the biggest difference to somebody
   *looking at the diorama for thirty seconds* right now? Not what is easiest to
   measure — what is most missing.

---

## The escalation ladder

When work is landing cleanly, rung 1–2 is the default — but **not the permanent
address.** When a stall signal fires, you must move **up** the ladder. You may not
respond to a stall by re-planning the same rung.

| # | Move | Use when |
| --- | --- | --- |
| 1 | **Rotate** — different domain × kind | routine; balance the coverage grid |
| 2 | **Deepen / interconnect** — compound systems that already exist | the basics are in place; usually the highest-yield move |
| 3 | **Widen the menu** — add a new *domain* or a new *kind* to `state.json` | the existing menu's cells are all attempted |
| 4a | **Change the world in time** — a season, a longer cycle, weather, an hour nobody has seen | the current world has been fully mined |
| 4b | **Change the world in space** — extend the map: a new quarter, a second lane, a canal, a hall, a new kind of tile or species; something that moves `developed` / `structures` / `tileKinds` in the census | the map's shape has not changed; every rung-4 so far picked time |
| 5 | **Change the observer** — new framing, camera, time of day, interaction, a way to *read* the town | the town is rich but only one view of it exists |
| 6 | **Retire and rebuild** — take the weakest existing system and redo it properly | polish has diminishing returns everywhere |

The menu lives in `state.json`, not in a skill file, **precisely so that you can
extend it.** The previous loop could not: its domains and kinds were hardcoded
prose, so once every cell was attempted it had nowhere left to go and spent its
last thirty iterations proving that.

### Success is also a reason to climb

The ladder above was written to be climbed on *failure*, and the first 67
iterations proved that a run which never fails never leaves rung 2: five passes
running held rung 2 with a good local argument each time, diffs shrank from a mean
of +93 lines to +49, and the seven structural census scalars sat at their #2 values
throughout. `stall.mjs` now reports that shape as **advisory** signals — `~` in the
report, `smallDiff`, `mapFlat`, `rungHeld` — which do not wake you early but
**bind the pass you are in**:

- If any advisory signal is showing, this batch's rung is **at least** the one it
  names. "HELD RUNG 2 because …" is not an available sentence while one shows.
- Regardless of signals: **no more than two consecutive passes on rung ≤ 2.** The
  third climbs to 3 or higher and says so in the log.
- `mapFlat` means rung **4b** specifically — a spatial change. A season or an
  evening does not clear it; only the census does.

### The rule that makes this work

**You may never write an empty queue, and "the town is saturated, pause" is not a
plan.** Saturation of a *rung* is a reason to climb, not to stop. If you find
yourself about to write "nothing left to build", that is the strongest possible
signal that you are on the wrong rung — go up one and plan from there.

Only a human ends the run (`touch STOP`). If you genuinely believe the run should
end, write the queue anyway **and** put your case in `plan.json`'s
`recommendStop` field with the evidence. The human will read it in the log. Your
job is to keep a good next move available; theirs is to decide when to stop.

---

## Write the plan

```jsonc
// plan.json — you own this file
{
  "generated": "<ISO>",
  "byIteration": 41,               // the iteration you planned from
  "rung": 2,                        // escalation ladder rung this batch sits on
  "diagnosis": {
    "health": "…one paragraph, honest…",
    "signals": ["revertStreak=2", "srcFlat=1"],
    "balance": "Lane untouched since #18; Far bank had 4 of the last 6."
  },
  "rationale": "…why THIS batch, now…",
  "queue": [
    {
      "id": "b42",
      "domain": "Lane & market",
      "kind": "Deepen",
      "brief": "Two to five sentences. Concrete. Name the observable outcome, not the implementation. Say why now.",
      "seams": ["marketActive", "MARKET_STALLS", "spawnLaneAgent"],
      "successLooksLike": "On a market morning the stalls draw a queue, and the queue thins by mid-afternoon.",
      "avoid": "Do not add a new stall type — there are three and the census says they're under-used.",
      "budgetMin": 25,
      "risk": "low"
    }
  ],
  "recommendStop": null
}
```

**Queue length: 3–5.** Long enough that you are not re-invoked constantly, short
enough that a stale plan cannot waste much. Every brief must be executable by a
worker that has never seen this conversation.

**A brief is good when it names a seam and an observable outcome.** "Improve the
lane" is not a brief. "The lane's awnings ignore wind — `isWindy()` exists and
nothing downstream reads it on the lane; make the awnings and washing lines respond,
so a windy day is legible from the wide shot" is a brief.

**Vary risk deliberately.** A queue of five low-risk polish jobs is how a loop
grinds to a halt in comfort. Include at least one brief that could fail — **the
bet** — and give it room to be big:

- `risk: "high"`, `budgetMin` **≥ 60**, and put it **first or second** in the queue,
  not last, so it is built while the plan is fresh rather than after four polish
  jobs have shifted the ground under it.
- Say in the brief that a 150–300-line diff is expected and welcome. The worker's
  skill tells it to take the swing when the brief says so; a bet whose brief reads
  like a polish job will be built like one (#58, #64, #65: the "bet" shipped at
  +31, +15 and +16 lines).
- A bet that adds a scalar or a sign to a scalar is not a bet. It is rung 2. A bet
  changes what a visitor sees from the wide shot within the first ten seconds.

---

## Curate the memory

Do all of these every time you run. This is not housekeeping; it is the other half
of why you exist.

**`LAWS.md` — distil, don't just append.** Capped at **60 laws / 12 KB**, and it is
read in full by every worker. When you promote a `**Law:**` out of a ledger entry:

- Check whether it **supersedes** an existing law. If so, replace it — don't stack.
- Merge near-duplicates into one sharper sentence.
- Delete laws whose subject no longer exists in the source.
- If you are at the cap, you must cut something to add something. Cutting the
  weakest law is a real decision — make it, and say which in your rationale.

The previous loop had no cap and no curator here. Its laws file grew to 62% of the
skill file and was re-read on every one of hundreds of iterations. Capping the
prose ledger alone did not help — it just pushed the growth into the file that was
read *more* often. **Cap the thing that is read most.**

**`state.json`:**
- `coverage` — record the completed iteration under its domain × kind.
- `inventory` — add what the town now contains, in the words a future brief would
  use. This is the direct antidote to "survey the town, discover it already has
  everything, exit". Keep it a list of *nouns*, not a history.
- `openCues` — promote a cue into a brief, or close it with a reason. A cue that
  survives ten manager passes is either a brief or a deletion.
- `menu` — extend it when you climb to rung 3.
- `saturation` — mark a domain × kind cell exhausted, with the iteration and why.

**Rotation:**
```bash
node .claude/skills/grow-courtyard/rotate-ledger.mjs
```
Moves ledger entries beyond the last 8 into `LEDGER-archive.md` and warns if
`LAWS.md` is over budget. Nothing is ever deleted from the archive.

**Check the worker's context budget** and, if it is OVER, fix it *this pass* —
by distilling, not by deferring.

---

## Before you exit

- `plan.json` has a non-empty queue of 3–5 executable briefs.
- `state.json` reflects everything that landed since your last pass.
- `LAWS.md` is inside budget and contains no duplicates.
- `context-budget.mjs` says OK.
- Append one line to `MANAGER-LOG.md`: the date, the iteration you planned from,
  the rung, the signals you saw, and the one-sentence reason for this batch. That
  file is the record of the loop's *decisions*, as opposed to its actions — it is
  what makes the experiment analysable afterwards. Keep it to one line per pass.
- Commit: `Manager: plan from #<N> (rung <R>) — <one line>`

Do not implement anything yourself. If you find a bug so glaring that it must be
fixed now, make it brief `b<next>` at the head of the queue with `risk: low` and
let the next worker do it — mixing planning and building is how the manager's
own cost becomes invisible in the statistics.
