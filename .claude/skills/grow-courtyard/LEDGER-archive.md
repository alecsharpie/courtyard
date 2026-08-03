# The Courtyard — ledger archive

Entries rotated out of `LEDGER.md`. Append-only. **Only the manager reads this** —
a worker that opens it to "catch up" spends its whole context on history.

## Iteration 2 — the bell now moves the town (2026-08-03) [River & far bank × Connect]

**Brief:** b1 — `bellUntil` was written by `strikeClock()` and read by nothing. Make
the world visibly answer for the ~2.5 s it rings.
**Did:** `simStep()` reads `bellUntil` on the rising edge (`bellSeen`) and calls a new
`bellStartle()`. That puts the belfry roost up as `birds` in a new `'wheel'` state —
they fan out from the tower top, then climb away and despawn above z 22 — and sets
`a.listen = 1 + R()*1.1` on ~45% of walking agents. `stepAgent()` returns early while
`a.listen > 0`, which freezes the walk cycle mid-stride because `a.phase` only advances
with movement; `drawPerson()` tips the head back and away from facing. `drawBird()`
gained an optional `sz` and reads `ph2` for the wingbeat when present. `strikeClock()`
itself is untouched — it still owns when the bell rings.
**Gates:** census PASS (birds +15; the rest of the histogram is PRNG churn, see Law) ·
visual PASS (wide/courtyard/east/lane, no draw-order regression) · motion PASS (bird
spawns +51, zero jumps/nan/oob/flicker) · probe `probes/bell-startle.mjs`: 47% of
walkers listening, 5.4 pigeons per strike over 58 strikes · perf skipped
**Verdict:** shipped   ← my view; runlog.mjs decides from the diff
**Surprise:** Two.
(1) The church-answers branch in `strikeClock()` is **unreachable**. It is an `else if
((hInt === 9 || hInt === 18) && day >= 2)` hanging off `if (hInt % 3 === 0)` — and both
9 and 18 are divisible by 3, so the clock branch always wins. The brief described it as
live. I left it alone (the brief says `strikeClock` owns the bell) and raised it as a cue;
the fix has a real design question attached, because `announce()` overwrites, so firing
both lines in one frame would show only the second.
(2) Tuning this was entirely a *legibility* problem, not a behaviour problem. It worked
on the first run and still took four passes to see: the flock spawned over the near-black
belfry louvre, then it was too small a roost, then I over-corrected to pale pigeon-grey
against a pale sky. The town's time compression is the hidden constraint — the clock
strikes every ~7 real seconds, so a 5 s flight leaves pigeons airborne 75% of the time
and the "event" stops reading as one. A finite roost that refills at 0.85/s and a ~2.4 s
flight put the duty cycle at ~37%, which reads as an answer instead of as decor.
**Law:** Adding an `R()` draw to a per-tick path reshuffles the entire seeded world
downstream — the census histogram churns everywhere (here: marigolds −87, raindrops
−110) without anything being wrong. Read that diff for *collapse*, not for delta.
**Law:** A once-per-event effect must be tuned against the town's **time compression**,
not against the clock it hangs off. A day is 55 s, so "every third hour" is every ~7 s;
anything lasting more than ~2 s stops being an event and becomes state.
**Cue:** The `(hInt === 9 || hInt === 18)` church-answer branch is dead code (see above).
**Cue:** `updateBoat()` still runs the boat past a quay full of people who never look at
it — the same written-but-unread shape as `bellUntil`, and now there is a mechanism
(`a.listen`) that would fit it.

