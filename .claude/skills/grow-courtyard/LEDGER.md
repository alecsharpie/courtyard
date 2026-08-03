# The Courtyard — growth ledger

One entry per iteration, newest at the bottom. Kept to the last **8** entries by
`rotate-ledger.mjs`; older entries move to `LEDGER-archive.md`, which **only the
manager** reads.

This file is prose, deliberately. The numbers live in `RUNLOG.jsonl` and the state
lives in `state.json`; what belongs here is the part a schema cannot hold — what
you tried, what surprised you, and what you would tell the next iteration.

Pre-loop history (hand-driven iterations 1–31: the courtyard, the lane, the cross
street and allotments, the plaza and quay, the river and far bank) is in
`../../../CHANGELOG.md`.

## Template

```markdown
## Iteration <N> — <one line: what changed> (<date>) [<Domain> × <Kind>]

**Brief:** <id> — <one line of what you were asked to do>
**Did:** <what you actually built, concretely — symbols, not adjectives>
**Gates:** census PASS/FAIL (<the histogram line that moved>) · visual PASS/FAIL ·
motion PASS/FAIL/skipped · perf PASS/skipped
**Verdict:** shipped | reverted | no-ship   ← your view; runlog.mjs decides from the diff
**Surprise:** <what you did not expect — the most valuable line here, or "none">
**Law:** <only if it will be true of the NEXT vector too; the manager promotes it>
**Cue:** <a loose end you noticed and did not chase, or omit>
```

---

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

## Iteration 3 — the sky now tells you rain is coming (2026-08-03) [Sky, light & weather × Deepen]

**Brief:** b2 — `grep -i cloud` returned nothing. Give the sky cover as one slow value
on the same footing as `isWindy()`, and have both `skyCols()` and the rain roll read it.
**Did:** New `cloudCover()` over `cloud`/`cloudTgt`/`frontLeft`, stepped by `stepClouds(sdt)`
in `simStep`. A front picks a target (heavy 0.76–1.0 with p≈0.3+0.24·richness, else
`R()*R()*0.5`) and holds it 24–60 s; `cloud` eases toward it rate-capped at +0.02/−0.026 per
second, so it can never step. The rain roll is now gated `cloudCover() > 0.66` with a rate
that scales with how far above; rain pins the target to 0.92 and, on stopping, sets it to
0.1–0.38 so cover visibly breaks up behind the shower. Readers: `skyCols()` mixes both stops
toward grey *after* the dusk term (cloud mutes a sunset, it doesn't sit under one);
`drawClouds()` is a new per-frame pass of 11 hash-seeded banks that fade in one at a time as
cover thickens, drifting on `simT` and wind, drawn over the sun and under the hills;
`drawSunMoon` gets a `veil` factor; `drawBackdrop` puts the stars out; `drawRoofRow` flattens
its key light; `ambientLine()` gained two overcast tiers. Cover rides the existing
`lightBucket` (already ~1.75 rebuilds/s) rather than its own key, so it costs no extra
backdrop or ground rebuilds.
**Gates:** census PASS (raindrops +110 — a sampled cell now rains where it didn't; rest is
PRNG churn) · visual PASS (clear → building 0.44 → heavy 0.89 → raining, plus wide/courtyard/
east/lane and the 390×844 framing; the diagonal pale streak in every shot is the pre-existing
glass-glare overlay, confirmed against HEAD) · motion PASS (zero jumps/nan/oob/flicker) ·
filmstrip PASS (no POP; cover visibly breaks across 12 frames) · perf PASS (interleaved vs
HEAD, both at the 16.7 ms vsync cap) · probe `probes/cloud-cover.mjs`: over 4 seeds × 14 days,
lowest cover while raining **0.771**, largest change per 0.5 s **0.0130** (= the rate cap, so
no step changes anywhere), median lead from cover-0.5 to first drop **27 s** — half a day.
**Verdict:** shipped   ← my view; runlog.mjs decides from the diff
**Surprise:** The probe was nondeterministic and I nearly believed it. Three runs of
*unchanged* code gave 9, 11 and 16 rain starts, which I first misread as my draw-only cloud-
height tweak changing the simulation. The cause is that `R() < dt * k` evaluates `R()` before
comparing, so a paused frame still burns PRNG draws even though `dt` is 0 — and how many rAF
frames arrive between load and the first `__warp()` is machine-dependent. A controlled test
(identical `idle=0` runs giving cloud 0.883 vs 0.009, identical `idle=120` runs matching
exactly) pinned it. `census.mjs` and `motion.mjs` both already call `__reseed()` first and are
fine; my probe didn't. Adding it made three consecutive runs byte-identical. The near-miss is
the point: an unreseeded probe doesn't error, it just quietly reports a different plausible
number every run, which is exactly the shape of evidence that survives review.
**Law:** Any `?pause` + `__warp()` measurement must call `__reseed()` before it starts. A
paused frame still consumes PRNG draws, and the frame count before the first warp is
machine-dependent — without the rewind a probe reports a different plausible number each run.
**Law:** Rate-cap a slow world scalar instead of easing it. A cap makes "it never steps" a
single measurable number (max delta per sample = the cap), so continuity is proved by the
probe rather than argued from a screenshot.
**Cue:** `drawSunMoon`'s `veil` hides the disc, but the shadow direction and the fixed shadow
alphas at `SUN[0]/SUN[2]` call sites are unchanged — the town still casts hard sun shadows
under full overcast. Softening them is a wider diff across ~6 call sites.
**Cue:** Rain now only starts while `daylight > 0.15`, so a heavy front that peaks overnight
builds full cover, never rains, and breaks up by morning. It reads fine, but it means overcast
nights are more common than rain.

## Iteration 4 — people now notice each other (2026-08-03) [People & animals × Connect]

**Brief:** b3 — no agent-to-agent code existed anywhere. Give agents the barest social
awareness: two who pass close should occasionally stop and acknowledge each other.
**Did:** New `greetPass()` on a 0.5 s accumulator in `simStep()`, after the agent loop so
positions are current. It walks a filtered `free` list (`chatty()`: walking, not small, not
listening/greeting/cooling, not `sweeper` — working — and not `picnic`, who arrive as a pair
and would chatter the whole way in), axis-rejects on dx/dy before any hypot, and pairs on an
*annulus* `GREET_MIN 0.9 .. GREET_R 1.6` at `GREET_P 0.17`. Pairing sets `a.greet = b.greet =
2.2–5 s` (×0.45 in rain), opposite `faceL`, and `chatCool = greet + 16–26 s` on both.
`stepAgent()` returns early while `a.greet > 0`, clamped at 0, right beside the existing
`a.listen` branch — a countdown and nothing more, so `done` stays reachable and no table can
strand. `drawPerson()` gained `chatting`: legs go to the standing pose instead of freezing
mid-stride, and the head turns toward the other one and nods (`Math.sin(a.greet*4.4)`).
Factored the dog-follow out to `stepDog()` and called it from the greet *and* listen branches,
so a stopped owner no longer leaves a frozen dog beside them.
**Gates:** census PASS (`people` +10 — capacity-bound drift plus PRNG churn, not new spawns) ·
visual PASS (wide/courtyard/lane at night and morning, no draw-order regression) · motion PASS
(walker 0 jumps / 0 nan / 0 oob / 0 flicker in all four scenes) · filmstrip day PASS (Δ 0.28–0.64,
no POP, no FROZEN) · probe `probes/passing-word.mjs`: ~19 conversations per 10 seeded days,
2.4% of walker-ticks chatting, 10 different kinds involved, maxGreet 4.87 < 5, `stuck` empty ·
perf skipped (the pass is 0.5 s-throttled over a ≤20-item list)
**Verdict:** shipped   ← my view; runlog.mjs decides from the diff
**Surprise:** The motion gate failed on `day/butterfly: jumps 0 -> 1` — a system I never
touched. The tempting reads were "PRNG churn, ignore it" and "re-pin the baseline". Both were
wrong. `probes/butterfly-step.mjs` replayed the gate's own sampling over 12 seeds on HEAD and
found butterflies *already* taking 3.4–4.4-cell steps against a 0.55 median: `(b.tx-b.x)*dt*0.5`
flies a freshly-targeted butterfly across the courtyard faster than a person runs, and 4.4 sits
exactly on `ABS_JUMP 2.5 AND 8×median`. So the gate was a coin-flip on the random stream for
*every* iteration, not just mine. Clamped the approach to 3 cells/s; largest step over 12 seeds
is now 1.31 and the knife-edge is retired.
Second, smaller: at first the pair stopped wherever they happened to be, often 0.8 cells apart,
and a zoomed crop showed them rendering as a single blob. Hence `GREET_MIN`. Rate and
legibility turned out to be the same dial.
**Law:** When a gate fails on a kind you did not touch, measure that kind's own distribution on
HEAD before you either blame yourself or re-pin the baseline. Any change that consumes `R()`
shifts the whole stream, so a threshold that a system was already sitting on will flip at
random — the fix is to move the system off the threshold, not to move the threshold.
**Law:** Two figures nearer than ~0.9 cells render as one shape at this scale. Anything that
puts two people in the same spot (a queue, a bench, a haggle) has to hold them apart to read.
**Cue:** `chatCool` is decremented only inside `greetPass()`, so it is wall-clock-correct only
while that pass runs every 0.5 s. Fine today; a future early-out in the pass would freeze it.
