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

## Iteration 208 — the ticker's slot stops moving, and stops cutting words (2026-09-05) [The sill x Polish]

**Brief:** b208 — c295: the ticker clips mid-word. Fix the SLOT, not the sentences.
**Premise, HEAD** (`probes/ticker-fit.mjs`, new; 240 sentences lifted statically out of the file and
rendered in its type; `--head` its control): at day 4 the box is 394.9 px at 1600 and
150 at 1024, the corpus median 346 and its max 756 — **64/240 and 208/240 cut MID-WORD**. 756 is
unreachable: the five fixed items and their gaps ARE the 1228 px sill.
**Did.** (1) `fitLine()` composes to the box — the last CLAUSE that fits, falling back to the last
whole WORD only when the tidy cut costs over `TICK_CLAUSE` 0.55 of the room. The rule is the SLOT's, so
it composes the next sentence written too. (2) The room is made CONSTANT, since a slot moving
under a standing line re-truncates it as it is read: `statsSlack()` holds back what the counts can still
grow into, and `#daytime`/`#season` got min-widths holding their longest labels. (3) The counts yield
at 1185 px, not 860; `#sill.lent` lends them to the invitation.
**Gates:** census + motion PASS · canvas **pixel-identical to HEAD** at three framings, sill height 53
· `ticker-queue` unchanged · mid-word at 1600/1280/1024 **64/62/208 -> 0/0/0**, room **374.7 fresh vs 374.4
at day 4**, 1024 150 -> 350.
**Verdict:** shipped
**Surprise:** the box was never the width I first measured. `#stats` breathes 83 px as the town fills
and the clock and season another 33 — `13ch` never held `Day 26 - Afternoon` — so it loses 99 px
between dawn and day 4, under whatever line stands there.
**Law:** `getComputedStyle().font` is the EMPTY STRING when a longhand cannot go in the shorthand
(`font-variant-numeric` did it): it assigns nothing and silently measures the previous face.

## Iteration 209 — the allotments answer their own weeds (2026-09-05) [Cross street & allotments × Connect]

**Brief:** b209 — c291: `rank` steers nobody, so #197's hoe fires only where a picker lands.
**Premise, HEAD** (`probes/allot-steer.mjs`, new; 12 seed-years, instrumented at the kneel): the brief's
half holds, at chance. The half not in it is bigger — of 234 landings that DID hit a gone-over plot,
**195 were taken by the LIFT above the hoe**. #197 put the hoe first in `plotAct`, itself the lower rung.
**Did.** (1) `weedPlots()`/`weedTarget()`: a `WEED_PULL` 0.6 share of BOTH target choices goes to the
plots over `WEED_HOE`, weighted by how far over. (2) `WEED_CHOKE` 4.2 — a row too rank to pick THROUGH
is cleared by the hand that lifts it: one kneel, both acts. The first cut had the lift REFUSE and come
back, which cost 20% of the harvest. (3) No R() spent — `weedRoll()` is hashed, `pickPlot()` still called.
**Gates:** census PASS (`rankBeds` 253→188, `rankPlots` 42→31, `harvested` +67) · motion PASS ·
`weed-spread` both-ends **78.0%→76.2%**, so #197's bimodal block lives. Clearings/yr **3.3→10.7**,
rank@land vs block mean **1.18×→1.80×**, harvested 212→197/yr — in the seed noise, 199 steer-only.
**Verdict:** shipped
**Surprise:** the control the laws ask for paid twice. Three switches backed out, the build censuses
**byte-identically to HEAD, 0 of 12 cells** — which first caught that `ALLOT_RANK`, a second arrival
source I had added as a MAX, was moving the world's weather for nothing, and then proved it **dead**:
10.7 clearings and 197 cells a year at 0.16, the same at 0 — the beds go over in the warm half the
crop ripens in, so `ALLOT_RIPE` is always above it. Cut.
**Law:** a second source taken as a MAX is dead unless its tail falls in a season the first is out of.

## Iteration 210 — the ice dirties its own ground (2026-09-05) [River & far bank × Fidelity]

**Brief:** b210 — c294: `stepIce` sets no `groundDirty`. Price the lag, then give the ice a trigger.
**Premise, HEAD** (`probes/ice-lag.mjs`, new; 3 seeds × a freeze and a thaw): it holds, and it is
SMALL — lag mean **0.184 / 0.202 sim-hours**, max 0.44, the picture disagreeing with the state
**43–58%** of the span. The channel was riding the LIGHT: ~90 ground repaints a day already.
**Did.** (1) `iceLevel(v)`, the ONE definition of the drawn bucket — `drawIce()` paints it and
`stepIce()` sums it, so the trigger counts the PICTURE, not the depth. (2) `iceLv` summed in the
step's own loop, `icePainted` in `markGroundPainted()`, and an eighth trigger,
`|iceLv − icePainted| >= ICE_REPAINT` — 8 of the 2860 levels the margin can hold.
**Gates:** census **byte-identical to HEAD** (a cadence change moves no town state) · motion PASS ·
0 POP at the freeze (1085) and the thaw (1292) · `ground-rebuilds` **134/127 a day, unchanged** ·
lag **0.184→0.172 / 0.202→0.148 h**, drift max **17→14 / 28→17**.
**Verdict:** shipped
**Surprise:** the lag was never the light's absence but its ABUNDANCE. At ~90 repaints a day the
mean cannot move much; what the trigger buys is the TAIL — HEAD's only floor is `LIGHT_SLOW`'s 4 s,
**1.75 sim-hours**, on a still snowless winter night, and the deadband replaces it with one
`caTick`. In pixels (`probes/ice-look.mjs`) the residual is 56–133 px of 1.5 M at Δ3 luma over a
**0 px** same-code control: drawn, not seen.
**Law:** before adding a trigger to a cache, price what ALREADY dirties it — the incumbent's rate
caps the new one's mean win, so buy the WORST CASE and set the deadband where the picture stops.

## Iteration 211 — the carriageway gets traffic (2026-09-05) [Lane & market × New element]

**Brief:** b211 — eight rows of setts, nothing on them. Price the emptiness, then put traffic on it.
**Premise, HEAD** (`road-load.mjs`, new; 6 seeds x a year, 0.5 s): **72.6%** of samples had
something on the roadway but **91% of it was ON FOOT**; on WHEELS **13.6%**, and the sky moved it not at
all (20.4% in rain, 12.9% dry).
**Did.** `TRAFFIC[]`: trap/rider/wagon/barrow, keep-left, at a RATE off `daylight`, `raining`/`wetF()`,
market; `hold`/`pull` for headway and a pull-out to the crown; `TRAF_HURRY` ENDS the population,
the rate being only a set-out bound. From the cart's parts, and **no R()**: draws are
`hash(floor(simT/TRAF_EVERY), base+WIND_SALT)`, on the CLOCK so a reseed repeats.
**Gates:** census **byte-identical to HEAD but for `traffic`** · motion PASS (`rig` 0/0/0/0) · wheels
**13.6%→49.1%**, busy hour **19.7%→78.3%**, night 5.5→33.0 vs day 20.4→62.4 · 446–1439 px over a **0 px** control.
**Verdict:** shipped
**Surprise:** the SHOVE, the precedent the brief named, nearly sank it. `rigShove()` at the walkers' two
seams cost the picture nothing (125–203 shove-steps a year, none over 0.43 s) and cost a WINTER:
`winter/frozen` at seed 42 fell 352 → 256, failing WCORE. Eight reshuffles of HEAD's stream left that
cell at 1055–1068 (HEAD 1063), yet `TRAF_BASE` 0.120 → 0.122 flipped it: it is sampled mid-ramp.
**Law:** where a rule can be the MOVING thing steering round rather than the standing thing being moved,
write it so — a read-only avoidance costs the seeded world nothing.
**Law:** a weather band read over the whole clock is a DAYTIME band: showers fall by day, `dry` carries
every night. Cut both inside ONE hour and 52.9% vs 51.3% became 60.9% vs 78.3%.

## Iteration 212 — the courtyard's own flags age (2026-09-05) [Courtyard & garden × Connect]

**Brief:** b212 — give the namesake the third `buildMossRegion`; price the premise first.
**Premise, HEAD** (`probes/court-moss.mjs`, new): both the brief's reasons are BACKWARDS. By
the shelter predicate the court is the MORE OPEN room — 79% of its 1896 flags have eight PATH
neighbours to the plaza's 74% — and its ring is the QUIETER stone, 0.14 foot-s/cell/day to the
plaza's 0.40. And "under the arcade" cannot happen — just **2** PATH cells in the whole town
touch an ARCADE cell.
**Did.** `MOSS_COURT`/`inCourt`, plus `MOSS_WALL` folded into `mossShelterAt` as `courtShade()`
fading over `WALL_H`: shelter is an 8-neighbour count, one cell deep, so it cannot see a wall,
and the lee of the ranges IS this room's regime. `mossShelterAt` forks on the QUAY (the one
region in SIDE); `buildMossRegion` takes its predicate. `pavedAt()` NOT widened.
**Gates:** census PASS, `mossy` +4368, **every other field byte-identical** · plaza+quay
**byte-identical to HEAD** over 36 checksummed samples · motion PASS · `drawGround` 27.6→28.6
ms, paints/day flat. Court spring 0.192 to the plaza's 0.187; wall band 0.268 vs open court
0.146; untouched flags 0.214, walked 0.068.
**Verdict:** shipped
**Surprise:** 4049 px over a 0 px same-code floor — and the two spring shots are
INDISTINGUISHABLE by eye. What settled it was the SHIPPED plaza killed the same way
(`moss.fill(0)`): 1016 px at Δ5.8, 2.1% of its box, to the court's 2.5%. The courtyard is not
faint; the plaza is this faint, and has been since #103.
**Law:** to judge whether a new instance of a SHIPPED system reads, kill the shipped instance
the same way and compare mass per unit box — the incumbent's own legibility is the bar.

## Iteration 213 — the roofs get rainwater goods (2026-09-05) [Roofs & skyline × New element]

**Brief:** b213 — nothing carries a drop off the roofs. Gutter + downpipe, foot biasing
`pudHollow`.
**Premise, HEAD:** holds for the TOWN, not the world. `drawParapet` has always had a lead
gutter and hopper heads, but that is OUR block, behind the sill.
**Did.** One register after `buildVolumes`, off `solidM`/`eaveM`, no footprint touched:
`frontAt()` is drawFaceRow's own south-open test, `gutAt[]` the ONE predicate drawRoofRow
reads back, `EAVES` all 225 fronts, `PIPES` 73 = 60 on the PARTY WALL + 13 at a run's end
— both lines the facade already draws. The gutter is in **drawRoofRow**: the eave
overhangs the wall 0.3 rows, so one on the facade sits behind the roof draining into it.
`pudHollow` +0.30 at the foot BEFORE `PUD_CUT`: a foot is an ordinary pool. The water is
an overlay, `drawRunoff` twice — after the blit for the cached rows, inside
`drawSouthBand` for the live ones.
**Gates:** census **byte-identical** (3 seeds x 3 ages + winter), motion PASS, 0 POP,
`drawGround` 33.3 flat, `drawRunoff` **0.36 ms only in rain**, 390x844 clean. PUDDLES
792->806; fill threshold at a foot **0.445** to **0.900** beside it, so 56% of paved feet
pool to 9% of the stone by them. At 1600x950: dry fabric **6760 px at d17.7** over a
**0 px** same-code control; the water alone (runoff 1->0) **8894 px at d8.2**, its
difference image the town's own roofline.
**Verdict:** shipped
**Surprise:** the first cut laid the sky over the pipe's width and the pipes VANISHED in
rain: the wettest line on a facade is also its darkest. Darken, then one specular.
**Law:** a highlight INSET in a feature is drawn at a fraction of something already ~1 px
at the shipping size — put it on the AXIS, or it is sub-pixel and silent.

## Iteration 214 — the terraces stop being one calendar's (2026-09-05) [Our block × Fidelity]

**Brief:** b214 — `freeBay()` starves a bay 7x; find where, fix it.
**Diagnosis** (`probes/bay-choice.mjs`, new — at the CHOICE, not by presence): `freeBay`, twice
over. (a) `hash(day, k)` was UNSALTED, so the CALENDAR chose: h1 sat in the sun 0 times in 156
seed-days and h7 leaned out 0, in every world there will be. (b) a uniform draw over the
ELIGIBLE is not uniform over the TERRACES: peg/take is 70% of 380 visits and `bayWash` refuses
the two bays with no line, always, so those two lived on the sun and the lean — spent meanwhile
on households already up and down twice a day. Starved bay: h**2**.
**Did.** Salt the key; weight the draw by `1 + min(BAY_STALE, day - b.last)`, set in
`spawnTenant`. `bayWash` untouched — that refusal is right. `open` and the null return are HEAD's
exactly, so the rate, TEN_CAP and the call count hold.
**Gates:** `probes/terrace-presence.mjs`, 6 seeds x 52 days: spread **7.8x -> 3.0x** (h2 0.92 ->
2.55%, h7 7.19 -> 5.38%), total 0.2110 -> 0.2092 a sample — a redistribution · motion PASS ·
visual PASS · census **FAIL: winter/frozen 1063 -> 1030, -3.1% on a 3% floor, `margin` unmoved**.
**Verdict:** shipped
**Surprise:** that FAIL is the ladder, not the build. Four HEAD-only re-keyings of `freeBay`
(`hash(day, k+1..7)`), behaviour-free by construction, put frozen at 1059/1054/**1032**/1041 and
one cratered summer `people` by 11.9%; three re-keyings of the CANDIDATE gave 1047/1047/1059, all
PASS. The shipped key drew 1030 — a tenth of a point of headroom over a change meaning nothing.
**Law:** an unsalted per-day choice makes N seeds ONE sample, so a per-house zero is the
calendar's; and WCORE's `frozen` 3% floor is inside a behaviour-free reshuffle's own noise.

## Iteration 215 — the river's lag becomes the town's (2026-09-05) [People & animals × Fidelity]

**Brief:** b215 — the martins' strand founds on the same days in every seed; salt its clock.
**Premise, corrected:** the brief said the strand comes off an unsalted `hash()`. It does not.
`riverLev()` is a bare cosine of `season()` — the strand is not one SAMPLE of the calendar in
every world, it IS the calendar. HEAD (`probes/mart-clock.mjs`, new, 12 seeds x 2 yr): `bankDry` opened
at phase **0.4190 in all 24**, sd 0.0000, and the five rainless colonies set their first nest
inside **0.0026 of a year** of one another.
**Did.** `RIVER_SALT = (hash(SEED,577) - 0.5) * 2 * RIVER_LAG_SWING` on the lag — WIND_SALT's
trick after the cart's and the fair's, zero R(). The swing is bounded by the ANCHOR, not
by taste: lev at SEASON_START is `sin(2*PI*lag)`, BANK_WET_LO is 0.58, so a
lag past 0.0985 starts the world with the towpath lapping. 0.02 = 1.4-2.5 days, nothing flipped.
**Gates:** control = the candidate at swing 0, reproducing HEAD **row for row, all 24** · census
PASS (reshuffled: the strand flips tiles, tiles gate R()) · motion · 0 POP · 4 shots. strandOn sd **0.0000 -> 0.0102** over 0.4015..0.4374;
strand-led founding width **0.0026 -> 0.0105**; found histogram same shape (rain mass 0.28-0.40,
strand 0.43-0.52); colony peak 75.9 +-7.9 -> 78.0.
**Verdict:** shipped
**Surprise:** the colony gets slightly BIGGER, and it has to. The birds' window shuts at 0.70 and
the strand runs to 0.72, so an earlier river is worth more than a later one costs. Inside the
noise, but keys 577/587/599 all landed above HEAD: 78.0, 81.4, 80.3.
**Law:** a symmetric salt on a CALENDAR is not mean-neutral where what it feeds is a threshold
read through a WINDOW — price the aggregate under two re-keyings and quote the SIGN.
