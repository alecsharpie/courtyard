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

**Keep an entry under 2.5 KB (≈38 lines).** A worker reads the last **three** entries
in full, every iteration, so entry length is charged to the loop three times over. This
cap was 3.5 KB and advisory at pass #20; the next three entries came in at 4.3–5.7 KB
and three more workers opened OVER budget, so it is now measured by
`rotate-ledger.mjs`, which names any entry over it. If yours does not fit, the excess is
almost always a **law** (true of the next vector → `LAWS.md`) or a **cue**
(→ `state.json`), not a longer entry. Write the *surprise* at full length and compress
everything else; the surprise is the part that cannot be reconstructed from the diff.
Once the manager has promoted your `**Law:**` and `**Cue:**` lines they are cut from
the entry — they live in the two files that are read *instead* of this one.

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

## Iteration 98 — the lane gets its morning: ONE figure with a bag comes in west before sunrise, leaves a bottle on two steps and walks back out; the brief's fourteen doors priced to a 30 h walk (2026-09-01) [Lane & market × New element]

**Brief:** b97 — a round working all fourteen HOME_DOORS in sunUp−0.3..+1.6, plus dawn-lit HOME windows (count first).
**Priced FIRST:** the sweeper traced on HEAD — 68 cells in 13.15 h = **5.2 cells/h** (0.87 × 2.6). Fourteen doors ≈ 155 cells ≈ 30 h; 1.9 h buys ten cells and no door, and "fewer doors" priced to ZERO at that window. So the WINDOW became the variable: `ROUND_H` 5 h of sunrise → doors 4 and 8, then back out west (the east end is 28 h away).
**Did:** `updateRound()` beside the sweeper: `mround` in at sunUp−0.3 (`roundDay` latch, `snowCover <= 0.5`, umbrella in rain), door legs to `ROUND_STEP_Y` and the walk back; `roundDeliver` (hashed stand; `roundMarks` taken in by 09:30 − 1.5·hash, or 0.75 h after a late one); `drawStepMarks` item at y 65.11; `a.bag`; `nameAt(x, 65)` 'a bottle left on the step'; personName; `__entities` round/left; `laneCount − roundCount()`; `chatty` refuses it. No R().
**Dawn windows — counted, not built** (`probes/dawn-lit.mjs`): a dawn IS lit, 4–7 panes at sunUp−0.8..0, but early risers key on the dawn EDGE, so the count RISES to 10–11 at sunUp+0.5 in winter.
**Gates:** census FAIL people −13% = reshuffle (`census-noise.mjs`: HEAD's own spread 14%, candidate −6% over 8 seeds; `probes/round-identity.mjs`: round forced off → canvas IDENTICAL to HEAD) · motion PASS · filmstrip 0 POP · `probes/morning-round.mjs` 10 seeds × 2 seasons: in −0.22/−0.28 20/20, 2 doors 20/20, out +6.2..7.4, greets 0, max step 0.65; marks [4,8] at 07:30 and [] at 09:30, 10/10 · `round-bottle.mjs` 3 px at 1×, 11 at DPR 2.
**MISS:** 2/14 doors; out +6.6 not +1.6; at the landing hour the round is at the west end, not mid-street.
**Verdict:** shipped, ~+75 lines.
**Surprise:** the brief's pricing was 15× off and its own fallback priced to nothing.

## Iteration 99 — the camera reads the sill, and the east clamp finally holds at the top row (2026-09-02) [The sill & the observer × Polish]

**Brief:** b93 (attempt 2) — c129 the willow under the sill, c126 the void past GW at a quarter's top row, c134 the vane's 6 px cardinals at every zoom. Attempt 1 committed all three **unverified** (session limit); verifying them, two did not hold.
**Did:** kept attempt 1's `sillTop()` (one definition, read by `drawSill` and `viewFor`), its fit/centre against `pic` with overflow held at the top, and its `k = viewS` scaling of the vane draw and hit-test. **Fixed the clamp:** its escape hatch `if (nearL < 0 || nearR > W) oxT = held(1)` fired on *every* far-bank frame — the far bank's `x1` **is** `GW`, so its near-row east corner is the world's own edge and necessarily past `W`, handing the clamp straight back to the old bottom-row behaviour. Now guarded by `q.x0 > 0` / `q.x1 < GW`. **Added `Plaza share:0.5`.**
**Gates:** census PASS (five groups unchanged) · motion PASS vs a baseline taken on the pre-attempt-1 file through `--page` (zero delta) · `where-identity` IDENTICAL at 390 and 1400, incl. the round trip through the rescaled Plaza · before/after crops of q3/q4.
**Probes:** `probes/where-void.mjs` (new) — east void at the frame's *visible* top row: far bank **172→0 px**, plaza **144→0**, four framings. `probes/vane-letters.mjs` (new) — font off the page's own `fillText`: control 6/6/6 px at s 1/2/3.5, candidate 6/12/**21**.
**Verdict:** shipped, +15 lines.
**Surprise:** the "before" far bank looked like the *better* picture, and that was the bug — it showed invented land. The ground cache over-paints past `GW`, so the void reads as a grey wedge only on the top rows it misses; the rest looked like green field. Closing it moves the frame east, so the quarter shows *less* far bank — which looks like a regression and is not one.

## Iteration 100 — the diorama gets a foreground: rows 79..87 stop being VOID and become our own slated roof (2026-09-02) [Roofs & skyline × Scale/World]

**Brief:** b100 — build the near band as the roof of the block we look out over. Take the swing.
**Did:** the footprint went into `buildGrid` as WALL and **`buildVolumes` grew the roof** — ridge along the lane, hips at the river, valleys round the two `WELLS` (still VOID). Three statements, each a footprint or an eave and never a roof: `eaveFor` 0 for `y >= LN_WALK_S`, `solidAt` runs the block off both x edges, `WELLS`. Then `drawNearRoof` in the cached layer — `drawRoofRow` per row, so snow, key light and `CHIMNEYS` come for free — plus a flared apron off row WH falling into shadow, ridge capping, moss on the north pitch, `drawParapet`, `drawWell`, a `drawDormer`/`drawRoofLight` per house, and `drawPartyWalls` carrying the stacks. `ROOF_LIGHTS` → `drawRoofLights()` beside `drawLitPanes`, pushed to `LIT_PANES` so the night multiply is undone as a facade window's is. Slate not pantile, per house off `SLATES`; `nameAt` names it. The six screen-space awning stripes came back into the WORLD along the kerb (rows 77.65..79); HEAD's 24 px shadow band over the footway went.
**Gates:** census PASS, **re-pinned** (`developed` +1095/world, `structures` +7, VOID 1107→12, `tileKinds` held at 12 by the wells) · motion PASS vs a HEAD `--page` baseline · filmstrip 0 POP · perf +0.0% · shots day/night/snow/rain × desktop/phone.
**Probes** (`probes/near-roof-band.mjs`, `canvas-diff-where.mjs`): near band luma<20 — desktop **24.9% → 9.6%**, phone **59.7% → 21.7%** (mean luma 31.9→94.8, 18.8→73.2). Snow forced 0/.3/.55/1 → band mean **86/104/119/146**. Night: 5 of 20 rooflights lit at 22:35, 0 at 01:30. Nothing is drawn north of row 79 but the awnings.
**Verdict:** shipped, ~+230 lines.
**Surprise:** the first slab was pantile-orange and read as one flat field — the fix was not more detail but **less brightness**: a dark near block is what lets the town read past it. Two instrument traps: `roofZ` takes a VERTEX index, so `drawChimney(g, bx - 0.5, …)` indexed `vZ` fractionally → NaN, and the stacks were counted by the census and drawn nowhere; and a HEAD-vs-HEAD control differed in 332 px, so "first row differing from HEAD = 90" was rasterizer noise, not a leak into the sky.

## Iteration 101 — the warm evening ends: the walk home is priced at the choice, the bell and the passing word stop taxing a priced walk, and the footbridge's far end takes three (2026-09-02) [People & animals × Deepen]

**Brief:** b101 — trace one dusk stayer's whole life, find where the walk home is lost or unpriced, close the evening; add a third far post at 122.5 and price `a.listen`.
**Traced first** (`probes/evening-close.mjs`, 10 seeds × 4 summer days, every `a.dusk` from choice to off-frame). Nothing is *stuck* — three separate things are *unpriced time*:
1. **The walk home itself.** `#79` priced the walk IN and stopped. The evening's people went off the frame a MEDIAN **4.4 h after eveEnd** (stayers; gate arrivals 2.6 h; worst 9.9 h, one still walking at 07:18), **29 of 40 nights** held a dusk agent at 03:00 and 2 stayers never left the sample at all.
2. **`chatty()` had `!a.stay` but not `!a.dusk`** — so a *gate* arrival on a walk priced to the minute stood in the road talking: one greet ran **2.79 h**. That, not the bell, was the main reason four of 51 arrivals stood one frame past `eveEnd()` and got straight up.
3. **The bell.** `a.listen` holds 0.44–0.92 h and the clock strikes every third hour; on the walk HOME it added ~1.5 h to a walk already too long.
**Did:** `EVE_GONE 26.5` (the hour the evening's people are off the frame, on `hourEve()`'s axis), `EVE_HURRY 2.3` (was a bare 1.4), `EVE_BELL 0.35`. `eveOutH(s, speed)` is the ONE priced walk home, stored as `a.eveOut` at the choice by both sources; `eveFits` now asks two bounds — the stand fits the window AND the walk home fits the night; at the post `a.eveLeave = max(hourEve() + EVE_STAND, EVE_GONE − a.eveOut)` and the retire rule reads it. `a.eveGoing` drives the hurry and makes the bell's *hold* (not its draw) be refused on the way home. `goHome(a, maxH)` gained a bound on the walk — from the deck the nearest door is 35 cells against the retrace's 33, so an unbounded `goHome` made the late walk *longer*. Third far post at **122.5**.
**Priced the brief's two asks against each other, and they collide** (`probes/evening-close-price.mjs`, 248 far-side retirements): the far posts are 33 cells / **6.0–9.2 h** (4.7 h at HEAD's hurry) from `EAST_GATE_A`, and their source releases nobody before `sunDown − 4`, so arrivals sit at **sunDown + 1.8** median. Pricing the round trip at the CHOICE in `stayOn` takes fits **41 → 2 in 248** — #85's stay would simply stop happening. So `stayOn` prices the **leave**, not the choice.
**Gates:** census PASS (people 247→278, +12%, inside HEAD's own 19% spread — the `greetPass` free-list change reshuffles the seeded world) · motion PASS vs a HEAD `--page` baseline · filmstrip night 0 POP · shots east/wide/courtyard/lane clean.
**Measured, candidate vs a HEAD control I ran** (same probes, same seeds): off-frame minus `eveEnd` gate **+2.61 → +1.46** med (max +5.48 → +1.76), stay **+4.39 → +2.15** (max +5.41 → +2.85), never-left **2 → 0**; posts lost to the bell **4 → 0**; nights holding a dusk agent at 03:00 **29/40 → 4/40**, and the four are at x 97–99, one to three cells short of the gate at 96.3, where HEAD's were mid-plaza at x 109–112. Far-post max-at-once over 60 evenings: HEAD `0:20 1:14 2:26`, candidate `0:34 1:12 2:9 **3:5**`. Witness pair `shots/b101-bridge-{cand,head}.png`: seed 3 day 6, three abreast at 23:05 against HEAD's two, and 0 dusk agents at 03:00 against HEAD's three.
**Verdict:** shipped, ~+45 lines.
**MISS:** 03h is not zero — 4 of 40 nights still have one stayer a few cells short of the gate, and the far end is empty on 34/60 evenings against HEAD's 20/60. Both are the same geometry: a post 4.7 h from every exit cannot be occupied at the window's close and clear three hours later, and pulling the leave earlier is the only lever that does not delete the stay.
**Surprise:** the fit test's first draft added `EVE_STAND` to *both* bounds and took the evening's gate arrivals from 67 to 24 — `eveEnd()` has already spent that hour, so charging it twice halved a fitting window that is only ~1.2 h wide to begin with.

## Iteration 102 — the sky's shadow lands on the town: soft banks travel across the courtyard, the allotments and the river with the wind (2026-09-02) [Sky, light & weather × Connect]

**Brief:** b102 — connect `drawClouds()` to the ground; the wide shot is where it pays.
**Did:** `cloudDrift()` is the ONE travel scalar (`drawClouds` reads it too, arithmetic unchanged); `drawCloudShade()` lays up to `CSH_N 14` soft ellipses on the ground plane in one `multiply` pass — live, after the items and before `applyLight`, so it shades people and trees with the ground they stand on. `cloudShadeF()` is a HUMP × `daylight` (`CSH_KNEE .04` → full by `CSH_RISE .14`, held to `CSH_FALL .55`, out by `CSH_SHUT .95`): a clear sky has nothing to cast, a lid casts nothing because the town is already inside it. Bands thrown downsun off `sunVec()`, wrapped by a new `mod()`, clipped below `hz`.
**Counted, nothing pinned** (`probes/cloud-shade-presence.mjs`, 348 daylit samples, 3 seeds × 8 d): **49%** carry visible shade, 29% deep. Mean frame share shaded rises 1% → 45% across cover 0.1→0.7 and falls back to 30% under the lid.
**Gates:** census PASS, **every group unchanged** (no `R()` draw ⇒ no reshuffle) · motion PASS · filmstrip day+night **0 POP** · cost under the noise floor (`frame-cost.mjs` 3.04→3.05 ms summer) · shots wide/courtyard/east/lane + 390×844 clean.
**Measured vs a HEAD control I ran:** canvas hash at 12 instants × 2 seeds is **IDENTICAL to HEAD at cover ≤ 0.039 and at any cover after dark**, differing only where the gate says. Lawn crop, drawn twice per instant so the day's arc cancels: **81% → 98% → 93%** of unshaded over 24 s. Travel per sim second, off the frame's own profile: east wind **−1.1..−1.35 cells**, west **+1.1..+3.4**, calm **+0..+0.9** — it reverses with `windSign`.
**Verdict:** shipped, ~+70 lines.
**Surprise:** I looked at the shaded frame and the unshaded frame in turn and called them identical. They differed by **65 luma** at the core; only the difference image and a grid of Δ% caught it. Two earlier designs died of the same blindness the other way — a scatter of soft overlapping patches measures as a real change and *is* a dimmer switch.

## Iteration 103 — the plaza's paving starts to age: moss creeps into the joints, thickens through the wet shoulders and is scuffed out of every line people walk (2026-09-02) [Plaza & quay × New CA]

**Brief:** b103 — the plaza is the largest uniform surface in the town and does not age. Give it a per-cell rule.
**Premise checked:** holds — nothing greens paving anywhere. (`moss` *does* appear on HEAD, on the near roof from #100. Not the plaza.)
**Did:** `moss[]` over the plaza's 730 PATH cells, stepped in `caTick` beside the beds. Three terms and no more: **creep** (`nb`, the four-neighbour mean), **shelter** (`mossShel[]`, the share of a cell's eight neighbours that is not paving, read ONCE off the grid in `buildMoss`) and **the year** (`mossGrowF()`/`mossDieF()` off `warmth`, `greyF()`, `wetF()` — separate rates, because moss comes in over days and goes in hours). `mossTop[]` the ceiling, `mossFloor()` a hold under the drawn threshold. Feet cut it in `stepAgent` exactly where `wear[]` is cut in the courtyard. Drawn as the sett's own seam plus 0–4 hashed blades (`drawMoss`, `MOSS_BUCKET` 6) over a tint in `groundBase`; census gains `mossy`. No `R()`, no route or walkability change.
**Gates:** census PASS, every group unchanged (no `R()` draw ⇒ no reshuffle) · motion PASS · filmstrip 0 POP · ground rebuilds 133/134 per day, identical to HEAD · `frame-cost` under the noise floor · night, snow and 390×844 clean.
**Measured vs a HEAD control the probe regenerates itself** (`probes/moss-shots.mjs`, `moss-year.mjs`, `moss-feet.mjs`): green pixels over a paving-only band, HEAD **0.00% at every phase**; candidate 0.06% autumn · 0.02% spring · 0.00% midsummer · 0.00% midwinter, `mossy` 342/346/0/0 of 730. Two years × 3 seeds: peak 349–365, trough 0, sheltered/open cell mean 0.20/0.05. Feet are load-bearing: at *matched shelter*, walked cells mean 0.01 against quiet cells 0.44–0.68.
**Verdict:** shipped, ~+130 lines.
**Surprise:** the first draft was a green verge down both sides of the plaza, and the fault was not the colour — it was that **shelter is constant along an edge**, so every cell of the run sat at the same ceiling and the rule painted a stripe. A hashed term on the ceiling fixed it at the original colour (muting the palette had only made the feature invisible). Two seasons of the open square were also silently dead: the skip guard `!mossShel[i] && !moss[i]` treats a legitimate mid-square cell (shelter 0) as "not a plaza joint" the moment dieback zeroes it, so it is never stepped again.

## Iteration 104 — the bonfire's smoke becomes a column readable from across the town; its late kindles were already gone (2026-09-02) [Cross street & allotments × Polish]

**Brief:** b104 — (a) make the column read at 1×; (b) get the 2-of-17 kindles at 20:00+ into daylight.
**Priced both halves first.** (a) holds. (b) **does not reproduce on HEAD**: `bonfire-year.mjs`, 16 seeds × 27 days = **30 kindles, hour 13.8–19.1, 0 at 20:00+**; walk 7.0–11.3 h, not 13; 25–29% of autumn days keep a fire. #93's window is eleven iterations of reshuffle old, so `spawnBonfireHolder`/`bonfireHour`/pricing are untouched: the criterion is met, and moving them could only move fires/season, which `avoid` forbids.
**Did:** `BON_PUFFS 18` (was 9), `BON_THICK 0.62` (0.34), `BON_EMB_THICK 0.12` (0.06) as named constants; phase spacing `p/BON_PUFFS`, jitter 0.3 → 0.14 (nine puffs on a 0.3 jitter left *gaps*); base `spread` 0.55 → 0.9, `rise` 6.4 → 6.8; one grey became two — `g = 150 + 56·min(1, ph·3.2)`, sooty off the heap, pale a third up. Shares nothing with the chimney loop but `drift`.
**Gates:** census **PASS** (all five groups *unchanged* — correct for draw-only) · motion **PASS**, zero delta vs a HEAD `--page` baseline · visual PASS, `before/after-bonfire-{wide,crop}-s7d12.png` at 1200×720 DSF1.
**Probes** (3 new, all kept): `bonfire-column.mjs` fire-on minus fire-off in the plume's box, 8 fires — `|Δ|>6` **403 → 748 px**, peak **65.7 → 121.3**, mean|Δ| **17.5 → 35.3**. `bonfire-chimney-identity.mjs` for `avoid` — bonfire off, canvas **identical to HEAD 6/6** with the chimney branch loud (06:56, `cold` 0.98, 27 stacks; and 19:23); its non-zero control was **blind** until it walked to each seed's own fire (a pinned 15:20 is fire 0 on 2 of 3 seeds), then differs 3/3. `bonfire-1x.mjs` the wide frame at shipping size. 40-frame ink series: step max/median 3.4 (HEAD 2.9), no POP, not frozen — the motion gate's days are 3,7,11,19,22, the fire lives on 12–18, so nothing else sees this draw move.
**Verdict:** shipped — half built, half rejected on measurement; ~+10 net lines.
**Surprise:** the diff said the OLD column was drawn **strongly** (403 px past |Δ|>6, 65-luma peak) while the wide shot showed nothing. Both were right. Legibility is **mass and coherence**, not per-pixel contrast: nine circles on a 0.3 jitter are nine dots; eighteen overlapping on a 0.14 jitter are a plume, at nearly the same alpha.

## Iteration 105 — the bottom band becomes a windowsill: a lit far edge, grain, a nosing, and three things that finally throw a shadow (2026-09-02) [The sill & the observer × Polish]

**Brief:** b105 — the band below `sillTop()` is a flat black bar; separate its values without raising the mean.
**Premise re-priced, and it moved twice.** (a) The brief's whole-band `min==max==8.4` does **not** reproduce (range 79.8) — its top ~6 px are the existing lit edge. Drop those and the claim is exact and stronger: rows 6→bottom are **min == max == 8.4, range 0.000** at all three sizes (48,384 / 71,224 / 19,074 px). The defect is the *surface*, not the band. (b) "The pots and cup cannot be seen" is **false** — they silhouette against the apron *above* the sill line (pot column min 8.1 vs a bare column's 80.5). What could not be seen is the surface they stand on, so they got shadows, not contrast.
**Did.** The cliff's cause was backwards from the brief's guess: the apron's shadow gradient was anchored on `l[1]`, the roof's LAST ROW, which at 1200×720 projects **31 px below** sillTop — visible fraction **0.000**, the whole ramp painted under the band (1600×950 showed 51% of it, 390×844 70%, so only the desktop read as a cliff). Lifted it into `nearShadow(g)`, priced off `sillTop()` over whatever near roof the frame shows, bounded above by the south footway (`yWalk + 1`) — cached ground, and a live-drawn walker would not share the shadow. Rebuilt `drawSill`: a 7-stop surface gradient scaled by `lit = 0.30 + 0.70*warm`, 22 **broken** grain runs, 9 scuffs, a nosing, and `cast()` — a gradient trapezoid under each pot and the cup, lying toward the viewer. All `hash()`, no `R()`.
**Gates:** census **PASS** ×2, all five groups unchanged (no `R()` ⇒ no reshuffle) · motion **PASS** · filmstrip day+night **0 POP** · ground rebuilds **133/134/day, identical to HEAD** · `drawGround()` −0.20 ms vs HEAD's own 0.90 ms spread, 40 interleaved.
**Measured** (5 probes kept, each regenerating HEAD itself): surface range **0.0 → 37.7/36.8/38.4**, mean 8.4 → 12.7/12.9/13.2; band still **3.4–7.5× darker than the roof** at hours 10.4/11.2/17.8/23.5; roof→sill at 1200×720 ramps 79→50 where HEAD held ~125 flat into black. `sill-stands.mjs` (surface under an object vs beside it): **HEAD exactly −0.00 everywhere**, candidate −3.9 to −6.5.
**Verdict:** shipped, ~+80 lines.
**Surprise:** the per-column difference image against HEAD reads **backwards** as a test for "the pots are findable" — mass at the bare columns (6.9) *exceeded* the pot columns (4.3). An opaque silhouette covers the band in both versions, so the object's own column is the part that changed *least*; the diff was measuring how much bare surface each column had. The signal had to be taken inside the candidate, as shadow-vs-neighbour, with HEAD's 0.00 as the control.
**Budget:** opened at 44.0 KB, closes at **45.9 / 46 KB** — the cap is one entry away. This entry is 3.3 KB against the 2.5 KB per-entry cap and #103 is at 2.5; promoting the Law and Cue below cuts ~0.7 KB of it.
**Law:** a foreground element cached into the ground is only as dark as what the *camera* leaves visible — anchor a foreground ramp on the sill line, never on the world row that happens to meet it.
**Cue:** at every zoomed quarter the sill band fills with live content over the cached sill (max luma 221 Courtyard, 192 Plaza) — identical on HEAD, so pre-existing: `drawSill` is in the ground cache and agents sort after it, so the quarters have no sill at all.
