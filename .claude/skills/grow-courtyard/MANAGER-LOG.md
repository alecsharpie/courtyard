# Manager decisions

One line per manager pass. This is the record of what the loop *decided*, as
opposed to `LEDGER.md`, which records what it *did*. Keeping them apart is the
point: when a run goes wrong, the question is almost never "what did the workers
build" — it is "why did anyone think that was the right next thing", and the
previous loop had nowhere that answer was written down.

Format (parsed by `build-stats.mjs`, so keep the shape):

```
- <YYYY-MM-DD> planned from #<N>, rung <R> — <signals seen; one sentence of why this batch>
```

---

- 2026-08-03 planned from #0, rung 2 — cold start, no runlog, laws 16/60, budget 19.6/46 KB OK; the town has 31 iterations of nouns and one `connect` in its whole history, so the opening batch wires existing systems together (dead `bellUntil`, no clouds at all, no agent-to-agent code at all, east half starved of spawn budget) rather than adding an eighth kind of thing, led by a small brief to shake out the gates before the risky one.
