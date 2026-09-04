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

**Keep an entry under 1.8 KB (≈26 lines).** A worker reads the last **three** entries in
full, every iteration, so entry length is charged to the loop three times over — three
2.5 KB entries were 18% of the whole read budget, which is why the cap tightened at pass
#120 (it was 3.5 KB and advisory at #20, 2.5 KB and measured at #99). `rotate-ledger.mjs`
names any entry over it. If yours does not fit, the excess is almost always a **law**
(true of the next vector → `LAWS.md`) or a **cue** (→ `state.json`), not a longer entry.
Write the *surprise* at full length and compress everything else; the surprise is the part
that cannot be reconstructed from the diff, and the gate numbers already live in
`RUNLOG.jsonl` and in your probe's own output. Once the manager has promoted your
`**Law:**` and `**Cue:**` lines they are cut from the entry — they live in the two files
that are read *instead* of this one.

```markdown
## Iteration <N> — <one line: what changed> (<date>) [<Domain> × <Kind>]

**Brief:** <id> — <one line of what you were asked to do>
**Did:** <what you actually built, concretely — symbols, not adjectives>
**Gates:** census PASS/FAIL (<the histogram line that moved>) · visual PASS/FAIL ·
motion PASS/FAIL/skipped · perf PASS/skipped
**Verdict:** shipped | reverted | no-ship   ← your view; runlog.mjs decides from the diff
**Surprise:** <what you did not expect — the most valuable line here, or "none">
**Cue:** <a loose end you noticed and did not chase, or omit>
```

---

## Iteration 198 — the rain stops shutting the gate (2026-09-04) [Courtyard & garden × Connect]

**Brief:** b198 — c279: the garden's inflow should read the weather.
**Neither named bound was the bound** (lawn-weather.mjs, 6x26, every sun-up tick classed
fair/coming/RAIN): rain is **11.7%** of the sun's window, `lawnOpen()` true on **0.0%** of
it, **0 of 1,221 set-outs**. Not the cap, not the rate — `!raining`, carried since #95,
when nothing in the garden had a roof.
**Did.** (1) `lawnAdmits(k)` = `lawnRoofed(k) || !raining`, asked at the CHOICE in
spawnLawnAgent; `lawnOpen()` keeps only the sun, so in rain the kind list is the arcade
alone. (2) `LAWN_WET 0.35` on `lawnRate()` — the SLACK bound: a wet tick is at LAWN_CAP
**10.8%** v a fair one's **27.0%**. Swept on the AXIS, six settings, in the source.
**Ref -> cand:** under the walk **0.404 -> 0.763 people per rain tick** (arcade.mjs); four
there at once in rain, **day 139 -> day 13**. #186's stroll-weight control 0.20/0.12/0.07:
**474/480/479 -> 514/490/501** (#186: 495/491/488) — new inflow, not off the benches. Fine
days untouched *exactly* (lawn-dry.mjs): rain held off, **6/6 seeds byte-identical over 12
days**, census too; rain left in, **0/3**.
**Gates:** census PASS · motion PASS (HEAD-pinned) · filmstrip 0 POP · 4 framings + the
arcade in rain · #168 lawn-dark flat per visit.
**Verdict:** shipped
**Surprise:** the gate was not it — the VISIT was. An arcade stay is released by the
weather (`a.arc`), not a timer, so at an unchanged rate a wet courtyard came out **fuller
than a fine one, 4.25 v 4.15.** A roof does not only admit people, it holds them.
**Law:** a place whose stay ends on a CONDITION turns inflow into presence at a different
rate from its timed neighbours — price presence as rate x visit before choosing the rate.

## Iteration 199 — somebody in the room before dawn (2026-09-04) [Roofs & skyline × Deepen]

**Brief:** b199 — c283: #190 fixed the EVENING burn; windowLit's sunrise branch was never
offered a paneFigure, so first light was lit panes with nobody in them.
**Premise** (`probes/pane-morning.mjs`, new, on HEAD): **4.55 lit panes** per pre-dawn sample,
**0 visits a year** — a third of the evening's lit population, not the two I guessed.
**Did.** (1) `lampBurn` gains `[rOn, rOff)` — the early-riser test lifted out, in the night's
units: `t = span - D + s`, `D = dawnEdge() - sunUp`, which `rOff` cancels exactly.
windowLit reads it: **0 disagreements over 2,595,892 pane-samples** (9.8% lit: not vacuous).
(2) One visit is offered over that burn — no band to intersect, the burn IS the offer, so only
the LENGTH is solved before the hour; `paneWalk()` factored out, told apart by `k = FIG_SLOTS`,
so the evening's coin is untouched. (3) A 9.4 h midsummer night leaves the evening band open at
that pane's `rOn`, so `mLo = max(rOn, hi)`: the morning starts no earlier than an evening visit
must END by, disjoint by construction.
**A year:** MORNING 0.006 -> **0.641** figures/sample of 4.55 lit, **0 -> 182** visits, nights
with one **0 -> 87/104**. EVENING identical: 1.152 of 11.95, 886 visits.
**Gates:** census PASS (render state) · motion PASS · filmstrip 0 POP · continuity 0 swaps both
sides · look 199 px on 0 px
**Verdict:** shipped
**Surprise:** the continuity gate reported **754 swaps/yr on HEAD** before I priced its
threshold. u moves 1.08 in 0.24*dur on the exit leg — 7.5 u/h — so 0.4 per 0.1 h flagged the
walk's own fastest phase. The instrument, not the build.
**Law:** a jump threshold is priced off the subject's FASTEST phase, not its mean; a swap only
SHOWS if both ends are inside the aperture.

## Iteration 200 — the lap freezes with its channel (2026-09-04) [River & far bank × Fidelity]

**Brief:** b200 — c286: `ICE_CELLS` is built from `onChannel()` at BUILD time, when the towpath's
first column was still SIDE. #192 widened `onChannel` so a winter lap is river; the list was frozen
already, so the water the flood lies over could never take ice.
**Premise, HEAD** (`probes/lap-ice.mjs`, 3 seeds x 3 warps): **26 lapped cells, 26 of them against
ice over ICE_SET, 0 in ICE_CELLS, 0 carrying any skin.**
**Did.** (1) `buildIceLap()`, once, after `buildBank()`: 35 cells read off BANK_CELLS
(`bankWas === SIDE`), never re-derived. Shelter 1.0, distance transform untouched, so every existing
`iceShel`/`iceTop` is byte-identical: it ADDS cells, it does not re-cut them. (2)
`iceHere(i)`, the one live test — step, `riverSkin()` and census all ask it, so `margin` is what was
walked. (3) `stepBank`'s `if (t === ICE) continue` was the coupling, now the STRAND's guard only: the
level owns a lap cell, skin and all, and water off the path clears `rice[i]` in the same tick.
**Gates:** census PASS, pre-edit baseline — **summer nine byte-identical**; winter ICE +57/WATER
-57, margin +78 · motion PASS incl. `night` (warp 1230), HEAD-pinned · 0 POP · look
**1324-1343 of 1805 lap px on a same-code floor of 0-24** · `lap-year.mjs` **0 violations**, 137/858.
**Verdict:** shipped
**Surprise:** frozen +19/+17/+21 is exactly the lapped cells iced. I expected the new neighbours to
feed `iceNb` and push the old margin's front in; not one channel cell crossed ICE_SET that had not
already. The front was at its ceiling.
**Law:** a build-time list derived from a predicate is a HOSTAGE to it — #192's widened `onChannel`
silently un-completed a set frozen at #181. Grep a widened predicate's READERS, not its callers.

## Iteration 201 — a terrace that is somebody's with nobody on it (2026-09-04) [Our block & the leads × Deepen]

**Brief:** b201 — price how often a tenant is up on the leads, then give the terrace FABRIC.
**Premise** (`probes/terrace-presence.mjs`, new, HEAD, 6 seeds × a year, 10,362 daylight samples):
**0.2102 tenants a sample, 18.57% with anybody up** — four daylight moments in five the frame's
foreground quarter is bare, and the supply is six bays, not the cap.
**Did.** `leadsKit(bay)`, every branch hash(house): pots, a crate stack, a chair, a mat, `tidy`,
`wash`. No two of six alike; 23 pieces. `drawLeadsFabric()` is in the GROUND CACHE before
drawRoofFurn so the cords hang over it, and reads only what that cache already repaints for:
`potLeaf`/`potBloom` closed both sides of seasonPhase, `chairTip()` a SCALAR folding the chair onto
its own seat as the wet and cold come in, litter that GATHERS into a corner. `freeBay(k, want)` pegs
only where a line hangs; a sun stay takes the chair.
**Gates:** census/motion PASS · 0 POP · drawGround **+0.20 ms on 27.1**, no new dirty reason ·
`probes/terrace-mass.mjs` **424/483/343 px at 1600x950, 104/131/77 at 390x844** on a same-code floor
of **0 px every row** · northmost drawn point **85.14** on the 84.93 bound · presence 0.2029 / 18.26%.
**Verdict:** shipped
**Surprise:** the fabric is FREE to the seeded world and it was PROVABLE. `probes/terrace-identity.mjs`
censuses the build with its one behaviour change backed out against HEAD: **6 field diffs over 3 seeds
× 300 s, all the new field and its subtotal.** Every other number in the histogram is
`freeBay`'s filter, one refused spawn.
**Law:** a cached draw is free to the seeded world, so a build with its one BEHAVIOUR change backed
out must census IDENTICALLY to HEAD but for its new fields.
## Iteration 202 — the martins get a second mud source: the river's strand (2026-09-04) [People & animals × Deepen]

**Brief:** b202 — the mud is on wetF() alone and two worlds in six see no rain in the birds' season.
**Priced first** (probes/mart-mud.mjs, 6 seeds x 2 yr): first-season integral 0, 8.1, 55, 64, 214, 222;
year-one peaks 0, 1, 24, 39, 63, 126. Premise holds — 2 of 6 towns open bare.
**Did.** `martStrandF() = MART_STRAND_K * clamp(bankDry / MART_STRAND, 0, 1)`;
`martMudF() = max(rain-mud, strand)`. `bankDry` is stepBank's uncovered river bed — mud by
definition — and riverLev() is a CALENDAR, not weather: the same in every seed, 0 cells until phase 0.40, 43
at midsummer, gone by 0.72, in a window of 0.27..0.70 (probes/mart-strand.mjs, new). So a rainless
colony is founded LATE, at midsummer. K=0.07 off the strand's own season
integral (~760 -> 53), between the two thinnest years that already grew one.
**Gates:** census PASS (reshuffled: nests arrive earlier, so martSpot()'s R() draws move) · motion PASS · 4 shots + a midsummer pair v HEAD · filmstrip 0 POP · mart-mass
130-719 px on a same-code floor of 0 · mart-birds offNest 0/6 · mart-year: year-one peaks -> 20, 24,
45, 56, 61, 108, **6 of 6 colonies**, meanRun 9.0-41.7 v a uniform control's 1.27-2.17, empty in late winter 6/6, all back to 0 by 0.923.
**Verdict:** shipped
**Surprise:** the wettest world got no denser — seed 99's peak 126 -> 125 — while the thin ones
converged UP (42: 39 -> 76, 271: 59 -> 85).
**Law:** where one quantity has two sources take the MAX, not the sum: it lifts the starved tail
without moving the head, which a threshold cannot do. Size the second off the TAIL's own missing
integral, never the mean. A SEASONAL driver is the same in every world — that is what makes it an antidote to a weather coin.

## Iteration 203 — the moon shows on the sky's terms, not the sun's (2026-09-04) [Sky, light & weather × Fidelity]

**Brief:** b203 — the disc is gated on `daylight`, which OVERLAPS nightF. Measure the hole, close it.
**Measured first** (probes/moon-hole.mjs, new, HEAD, 6 seeds x a year): **792 of 6,690** samples with
nightF > 0.5 and the moon up drew NO disc — 11.8%, ~27 h a year, all at DUSK in moonArc's 1.4 h lead on
sunset; and the river carried the glitter column in **810** of them with no moon in the sky.
**Did.** `moonShows() = nightF > MOON_ON && moonAlt() > 0` — ONE predicate for the disc, moonLight(), the
sheen and the river's column; sun and moon stop being exclusive. The fault it turned up: moonCells() cuts
water/wet/snow off a `grid` that MOVES all year — 89 px between bakes, and a bake under ice loses the river
for good; stepBank/stepIce un-bake it now.
**Gates:** census IDENTICAL · motion · perf +0.0% · probes/moon-frames.mjs (new) **DAY 0 px off HEAD**,
NIGHT/LATE 0, hole 792 -> **0**, glitter -> **0** · filmstrip at the crossing: HEAD steps **2.392** on its
0.824 median, the build **0.429**.
**Verdict:** shipped
**Surprise:** the disc is drawn and cannot be SEEN — drawSunMoon paints BEFORE the backdrop blit, so all
through the hole it is behind the distance: its own 377 px move <=4.5 luma, and a full moon forced onto the
instant moves them 4.7. What the hour gains is the LIGHT, 216,782 px over 4 luma at 21:09, because
moonLight() returning 0 was never "no moon" — it was mk = -MOON_REF, the darkest there is, on every dusk.
**Law:** a gate opened on a DRAWN thing is not a thing SEEN — price it on the subject's own pixels at its
strongest phase, or occlusion reads as faintness. A term signed about a measured pivot has no "off": a 0
into it is a claim, and the extreme one.

## Iteration 204 — the fair's gathering is a budget of DRY hours (2026-09-04) [Plaza & quay × Deepen]

**Brief:** b204 — a shower over the 2.6 h at the raise cost the whole fair day. Make the fair survive it.
**Measured** (probes/fair-rain.mjs, new, 6 seeds x a yr, HEAD): 4 of 34 fair days filled 0 slots and **all four were
raining for 100% of the gathering**; two had >2.7 dry hours left. Then the WALK (probes/fair-walk.mjs, new):
gate to slot is **1.2-8.6 h, median 4.4** — #194's comment said 0.8-2.9, the straight line and not the route.
**Did.** `FAIR_GATH_H` 2.6 h of DRY weather, `fairGathSpent` never refunded, so the offer still ENDS. The far end is no
longer a clock: `fairFits(s, plane, speed)` prices the route this walker will walk at the speed they will walk it (the
town's own `pathHours`), and takes a slot only if the arrival lands with FAIR_STAND_MIN of fairF() left.
**Gates:** census PASS (reshuffled) · motion · perf +0.0% · filmstrip 0 POP · 4 shots. v a control RUN on HEAD:
zero-slot fair days **4 -> 1**, the one left winWet 1.00; fill 8.12 -> 8.41; fair-year plaza presence 15.37 -> 16.15,
standers 3.05 -> 3.12. Six FRESH seeds: 0 of 29. FAIR_STAND_MIN is live: standers 2.16 at 0.5
and **2.35** at 1.0; 3.0 puts the zero days back to 4.
**Verdict:** shipped
**Surprise:** the walk is most of the fair. Ten slots fill but only ~3 are ever STANDING — the rest are on their feet
in the corridor for four hours of a six-and-a-half hour day. The fair is mostly a procession.
**Law:** a weather gate on a FIXED window spends the window on weather it cannot use: make the budget the RESOURCE it
needs and the far end becomes the WALK, priced per arrival or the rescue arrives to nothing. A route's cost is not the
distance between its ends — a lead down a corridor and round a ring is twice it.


## Iteration 205 — the winter row gets a floor (2026-09-04) [The sill & the observer × Harness]

**Brief:** b205 — three instrument cues. HARNESS: `courtyard.html` byte-identical to HEAD.
**Did.** (1) **WCORE**, the winter row's own collapse floor off its own baseline, one tolerance per field,
`frozen`/`margin` off the `ice` block, which no scalar sees. Cut from DRIFT, not seed spread
(probes/winter-drift.mjs, new; #189->#204, six builds): worst downward step -0.3% grid, -0.9% frozen,
**-14.2% people, -13.2% planted**. (2)
`STRUCT_CONST`/`STRUCT_LIVE` + `constAudit()`, printed under every structure block, audited each run. (3)
`maxBuffer` on the last **10** unbuffered `git show :courtyard.html` captures — 8 tracked, 2 scratch tree.
**Gates:** census **PASS exit 0** · **the differential**, scratch worktree with #200's `buildIceLap()` call
commented out: HEAD's census exits **0**, this one **1** — `winter/frozen 1064->1014 (-4.7%, floor 3%)`,
`winter/margin 2118->2040 (-3.7%, floor 2%)`; at CORE's 8% that February break still walks · probe-smoke,
389/75 s/7-way: **247 pass, 36 throw, 106 t/out** (#195: 361/230/35/96), all 7 ENOBUFS throws gone.
**Verdict:** shipped
**Surprise:** fixing the ENOBUFS did not raise PASS at the smoke's own settings. All 7 run now — but 6 hit the
75 s wall at `--jobs 7`, and at `--jobs 4` every one **passes in 6.7-61.1 s**: they had never once been
allowed to run, so nobody knew they were long sweeps and not wrecks. And winter `structures` is **2427 of
2427 constant**, 100% against summer's 93%.
**Law:** an aggregate SUMMING two kinds of register is diluted by every constant added: report the constant
share beside the total, or a floor on the sum watches a number 93% frozen. A TIMEOUT is the RUNNER's
concurrency before it is the instrument's.

## Iteration 206 — the wide view gets a vertical intent (2026-09-05) [The sill & the observer × Interaction/UX]

**Brief:** b206 — give WIDE, the framing everyone lands on, an intent priced on `sillTop()` and aspect.
**Measured first** (probes/wide-frame.mjs, new; 12 framings): HEAD at 390x844 is sky **27.5%** / TOWN
**43.4%** / near slate **21.7%**. The premise's other half: town share is `WH*cellH/pic` and nothing else
moves it — `topPad` only splits the slack between sky above and apron below, so the sky never competed for
those pixels, the LEAN did. And no lean that keeps the courtyard puts the plaza in a phone.
**Did.** (1) `WIDE_AIR 19.6217`/`WIDE_KEEP 0.5` — the band `-AIR..WH` laid out by viewFor()'s expression at
s=1; `4 + 9.6*cellH` and the 0.82/0.5 spare are gone. AIR is solved on HEAD at 1600x950, so that frame is
**0.00% changed** (control floor 0.00). (2) `WIDE_FILL 0.60`/`WIDE_SPAN 54` — a tall frame leans in
until the world's rows cover 60% of the picture, never past 54 columns, never below HEAD's 2.1x. (3) the
centre walks west with the lean, off `gardenWest()` read off the GRID — HEAD cut 8 of the lawn's 40 columns
on every portrait framing, the lean alone would have cut 16.
**390x844: 22.5 / 52.0 / 18.0%, lawn 19..50 -> 11..50**; landscape and tablet scale untouched.
**Gates:** census PASS · motion PASS (HEAD-pinned) · filmstrip day+night 0 POP · where-faces, where-void and
follow-cam as HEAD.
**Verdict:** shipped
**Surprise:** the quarters are fitted in cellW0-INVARIANT units — s falls exactly as cellW0 rises — so
re-pricing the whole wide view moved three of the four fits **0 px**; only Courtyard's moved, s already
1.0175.
**Law:** a frame's share is a function of the ZOOM alone — padding decides where the slack goes, not how
much there is.
