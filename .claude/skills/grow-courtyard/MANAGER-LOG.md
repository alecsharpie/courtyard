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
