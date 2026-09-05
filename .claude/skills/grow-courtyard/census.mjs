#!/usr/bin/env node
/* grow-courtyard census — the loop's numeric regression guard.
 *
 *   node census.mjs                  measure + diff against census-baseline.json
 *   node census.mjs --save-baseline  pin the current town as the baseline
 *   node census.mjs --json           machine-readable summary on stdout
 *   node census.mjs --ref <rev>      measure a PAST tree (read-only: writes nothing)
 *
 * Loads courtyard.html across a FIXED seed x age matrix and dumps window.__census().
 * The page is loaded PAUSED and the sim is advanced by __warp() with a fixed dt, so
 * the result is a pure function of (seed, warped seconds) — not of how many frames
 * the machine happened to deliver. Any delta is therefore attributable to a code
 * change.
 *
 * What it is NOT: a growth score. A draw-only change (lighting, polish, a new
 * animation) legitimately moves nothing here. It fails only on a page error or a
 * headline COLLAPSE. Growth is judged from the histogram diff plus screenshots.
 *
 * Exit 0 = pass. Exit 1 = a page threw, or a core aggregate cratered — in the summer
 * nine (CORE) or, since #205, in the winter row (WCORE), which has its own floors cut
 * from its own baseline.
 */
import { homedir } from 'node:os';
import { readFileSync, writeFileSync, existsSync, appendFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/* Borrow Playwright from the screenshot-verify skill — its browser is installed. */
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
if (!existsSync(PW)) {
  console.error('census: playwright not found at', PW);
  console.error('        install the screenshot-verify skill first (npm i in that directory).');
  process.exit(1);
}
const { chromium } = (await import(pathToFileURL(PW).href)).default;

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '../../..');
const baseFile = join(HERE, 'census-baseline.json');
const curFile = join(HERE, 'census-latest.json');
const histFile = join(HERE, 'census-history.jsonl');

const save = process.argv.includes('--save-baseline');
const asJson = process.argv.includes('--json');
/* A control fetched at HEAD expires the moment the change commits, so a claim about
 * what this gate COULD see before a given build has to be pinned to a REF. `--ref`
 * measures a past tree and writes NOTHING — no baseline, no latest, no history row —
 * because a reading of somebody else's build is not this build's position. */
const refI = process.argv.indexOf('--ref');
const REF = refI !== -1 ? process.argv[refI + 1] : null;
let pageFile = join(REPO, 'courtyard.html');
if (REF) {
  pageFile = `/tmp/census-ref-${REF.replace(/\W+/g, '_')}.html`;
  writeFileSync(pageFile, execFileSync('git', ['show', `${REF}:courtyard.html`], { cwd: REPO, maxBuffer: 1 << 28 }));
}
const PAGE = pathToFileURL(pageFile).href;

/* The matrix. Day length is 55 s: maturity() saturates around day 8, richness()
 * around day 16 — so these three ages are "young / filling in / fully grown".
 *
 * They are also all at the SAME SEASON, which is the only reason the age axis
 * measures age. The old ladder (90 / 330 / 900) was picked before the town had a
 * year; warp 900 lands at season 0.879, warmth 0.14 — midwinter — so the "fully
 * grown" cell was really the "midwinter" cell, and iteration 14 got a −16% FAIL on
 * `planted` for correctly emptying the beds in January.
 *
 * warmth = 0.5 − 0.5·cos(2π·phase) and phase = (0.25 + simT/(26·55)) % 1, so equal
 * warmth means equal phase up to a reflection: only `p`, `1−p` and `p+1` are
 * available. Anchoring the young cell where it already was (warp 90, phase 0.3129)
 * fixes the other two at warp 625 (phase 0.6871, the mirror) and warp 1520 (phase
 * 0.3129 again, exactly one year on). All three sit at warmth 0.6929. */
const SEEDS = [7, 42, 1234];
const AGES = [{ name: 'day1', warp: 90 }, { name: 'day11', warp: 625 }, { name: 'day27', warp: 1520 }];
/* Two ladders are not comparable, so the ladder travels with the baseline. */
const LADDER = `${SEEDS.join(',')} x ${AGES.map(a => a.warp).join(',')}`;

/* THE WINTER ROW (#187). Everything above is one season by construction, which is
 * why #181 could add ICE — the 19th tile kind — and this gate report NOTHING in any
 * field: no cell in the matrix is ever cold. The fix is an ADDITION, never a re-cut:
 * the nine cells above stay bit-identical and keep their baseline, and winter is
 * summed into its own block with its own ladder string, so a baseline pinned before
 * this iteration still diffs the summer nine exactly as it always did.
 *
 * WHY warp 1220, and not the cold. Midwinter is phase 0, i.e. simT 1072.5 — but the
 * channel's skin is a CA integrating a growth rate, so it LAGS the cold by about nine
 * sim days. Measured across the three seeds at warp 1000..1340 (step 20/30): frozen is
 * 0/0/0 at 1040, still climbing at 1160, and flat across 1190..1250 at 318..333 /
 * 326..338 / 340..340 before the thaw takes it back to 0 by 1340. 1220 sits on that
 * plateau in ALL THREE seeds (333 / 337 / 340, snow 0.28 / 0.88 / 0.93), so the reading
 * is the STATE the winter reaches and not a sample of the path it took — the shape a
 * regression guard wants. The rate is probes/river-ice.mjs's job, not this one's.
 *
 * The seed axis is the same three, because the season is the only axis being added. */
const WINTER = [{ name: 'winter', warp: 1220 }];
const WLADDER = `${SEEDS.join(',')} x ${WINTER.map(a => a.warp).join(',')}`;

/* Headline aggregates. `CORE` are structural: if one of these craters the town has
 * genuinely broken, and that is the only thing this gate hard-fails on.
 *
 * CORE reads `cur.scalars` — the SUMMER nine, and ONLY those. See WCORE below. */
const CORE = ['developed', 'green', 'people', 'planted'];
const TOL = 0.08;   // an 8% dip in a core aggregate is the collapse threshold

/* THE WINTER FLOOR (#205, c280). #187 added the winter row and its report, but the
 * collapse check went on reading `cur.scalars` alone — the summer sum — so for 18
 * iterations the winter block could diff as loudly as it liked and the gate still
 * exited 0. A build that breaks the town only in February had no guard at all.
 *
 * CORE cannot be reused as-is, and not only because of scale: winter `planted` is
 * 720 against summer's 6583, so the same list against the same numbers is a floor
 * cut for a town that is not there. The winter row is also 3 cells, not 9, so every
 * live field in it is a third of the sample its summer twin is.
 *
 * `frozen` and `margin` come from the winter `ice` block, not from `scalars`: the
 * two aggregates that ONLY a cold cell can hold are the whole reason this row
 * exists, and no summer scalar can see either.
 *
 * THE FLOORS ARE CUT FROM DRIFT, NOT FROM SEED SPREAD. The spread across the three
 * seeds of one build is 0% on the grid fields and 9-13% on the live ones, but that
 * is not what a floor has to clear: what it has to clear is what an ORDINARY build
 * does to this row, and every iteration that adds an `R()` call reshuffles the whole
 * town. Measured over six committed builds, #189 -> #204, worst DOWNWARD step
 * (.claude/skills/grow-courtyard/probes/winter-drift.mjs):
 *
 *   developed -0.3%   green 0%   water 0%   passages 0%   structures 0%
 *   frozen    -0.9%   margin 0%                     <- grid and calendar facts
 *   people   -14.2%   planted -13.2%                <- live populations
 *   blooming -16.3%   creatures -16.7%              <- and these two are NOT floored
 *
 * So the live pair get 0.25 (1.8x the worst honest step) and the grid fields keep
 * CORE's 0.08 (27x). `blooming` and `creatures` are left out: they drift as hard as
 * the floored pair on a base a fifth the size, and a guard that cannot separate a
 * reshuffle from a regression is not a guard.
 *
 * `frozen` and `margin` are floored an order of magnitude tighter, because the
 * failure they exist to catch is SMALL: reverting #200's buildIceLap() takes the
 * margin 2118 -> 2040 and frozen 1064 -> 1014, i.e. -3.7% and -4.7%. At CORE's 0.08
 * that February-only breakage still walks through. Verified both ways in a scratch
 * worktree at #205: HEAD's census exits 0 on it, this one exits 1. */
const WCORE = {
  developed: 0.08, green: 0.08, water: 0.08, passages: 0.08, structures: 0.08,
  people: 0.25, planted: 0.25,
  frozen: 0.03, margin: 0.02,
};

/* WHICH `structures` REGISTERS CAN MOVE (#205, c284).
 *
 * `scalars.structures` is `Object.values(structure).reduce(sum)` — twenty registers
 * of two completely different kinds added into one number. Most are the `.length` of
 * an array built once at load (CHIMNEYS, EDGE_BEDS, MART_CELLS…) or a pure function
 * of a build-time hash (`leadsKitN()`); three are live counts that the sim moves.
 * Each one added to the census DILUTES the aggregate: #189's `eaveLine` is 217 a
 * sample, and took the summer sum 4059 -> 6314 without adding a single number that
 * can ever change. The constants are there for a good reason — a `martinNests: 0`
 * beside `eaveLine: 217` is evidence of an empty summer rather than of a missing
 * system — but they must not be counted as if the aggregate were watching them.
 *
 * So: declare both halves, print them apart, and AUDIT the declaration against the
 * matrix on every run (constAudit below), so a register that changes character —
 * or a twenty-first that arrives — is named instead of silently absorbed.
 *
 * CONSTANT — `.length` of a build-time array, or a pure function of the built town.
 * Verified against the source at #205: none of these arrays is pushed to, popped
 * from or spliced outside a build*() call.
 *   chimneys roofFurniture roofHatches terraceFabric plotFurniture ringNodes
 *   edgeBeds arcadeBays eaveLine allotBeds benches cafeTables marketStalls
 *   treePits orchard plazaPits moorings
 * `cafeTables` and `marketStalls` belong here despite naming live systems: what
 * the census reports is the array LENGTH, and the shopkeeper's `tb.p` and the
 * market's open/shut both ride on properties inside a fixed-length array.
 *
 * LIVE — a count the sim recomputes: the martin colony, and the weed CA's two rungs.
 *   martinNests rankBeds rankPlots */
const STRUCT_CONST = new Set(['chimneys', 'roofFurniture', 'roofHatches', 'terraceFabric',
  'plotFurniture', 'ringNodes', 'edgeBeds', 'arcadeBays', 'eaveLine', 'allotBeds', 'benches',
  'cafeTables', 'marketStalls', 'treePits', 'orchard', 'plazaPits', 'moorings',
  'yardFurniture']);
const STRUCT_LIVE = new Set(['martinNests', 'rankBeds', 'rankPlots']);

/* total, and the share of it that cannot move. `unclassified` is the important
 * return: a register in neither set is a new one, and nobody has said which it is. */
function structSplit(structure) {
  let constant = 0, live = 0; const unclassified = [];
  for (const k in structure) {
    if (STRUCT_CONST.has(k)) constant += structure[k];
    else { live += structure[k]; if (!STRUCT_LIVE.has(k)) unclassified.push(k); }
  }
  return { constant, live, total: constant + live, unclassified };
}

/* The declaration is a claim about the source; this is the check against the data.
 * A "constant" that differs between two cells of the same matrix was never one. */
function constAudit(cells) {
  const seen = {};
  for (const key in cells) for (const k in cells[key].structure) (seen[k] ||= new Set()).add(cells[key].structure[k]);
  const moved = Object.keys(seen).filter(k => STRUCT_CONST.has(k) && seen[k].size > 1);
  const flat = Object.keys(seen).filter(k => STRUCT_LIVE.has(k) && seen[k].size === 1);
  return { moved, flat };
}

async function run() {
  const b = await chromium.launch();
  const cells = {}, wcells = {};
  let pageerrors = 0;
  const errors = [];
  /* The winter row is loaded exactly as the summer nine are — same seeds, same
   * paused-then-warped protocol — so the only thing that differs between the two
   * blocks is where in the year the clock stopped. */
  for (const [rows, into] of [[AGES, cells], [WINTER, wcells]]) {
    for (const seed of SEEDS) {
      for (const age of rows) {
        const p = await b.newPage();
        p.on('pageerror', e => { pageerrors++; errors.push(`${seed}@${age.name}: ${String(e)}`); });
        p.on('console', m => { if (m.type() === 'error') { pageerrors++; errors.push(`${seed}@${age.name}: console ${m.text()}`); } });
        await p.goto(`${PAGE}?seed=${seed}&t=0&pause`);
        await p.waitForTimeout(300);
        into[`${seed}@${age.name}`] = await p.evaluate(w => {
          window.__reseed();
          window.__warp(w);
          return window.__census();
        }, age.warp);
        await p.close();
      }
    }
  }
  await b.close();
  return { when: new Date().toISOString(), pageerrors, errors, cells, wcells };
}

/* `planting` carries both a per-species histogram and eight scalars of its own.
 * The histogram became the `species` group from the start; the scalars were folded
 * nowhere and so were invisible to the gate for 114 iterations. #103 added `mossy`
 * *so that the census could see the moss*, and at #114 it moved 265 -> 358 while
 * this reporter printed nothing — a gate's PASS is only evidence about the fields
 * it REPORTS. Folded generically, so a future `__census()` planting field arrives
 * here without a code change.
 *   bySpecies -> its own group already.
 *   species   -> a constant (SPECIES.length), already reported as scalars.speciesKinds.
 * `planted` and `blooming` are deliberately repeated from `scalars`: the group is
 * the planting system read whole, and the scalars copy is the one CORE watches.
 *
 * NOISE FLOOR, measured at #115 (three runs of this gate on one unchanged HEAD;
 * 72 per-cell readings, ZERO drift). The instrument adds nothing: a delta in any of
 * these is attributable to the code change. What is NOT zero is the world — any new
 * `R()` draw reshuffles it, so the honest floor is the spread ACROSS SEEDS at a
 * fixed age. At day27, seeds 7/42/1234:
 *
 *   matureTrees  0%   |  planted 1%  blooming 1%   <- a 2% move is real
 *   mossy        8%
 *   daisies     22%   |  harvested 26%   worn 27%  <- a quarter-scale move is noise
 *   produce    200%   (0, 10, 17)                  <- unusable as a delta, see below
 *
 * And a trap in the AGE axis. The ladder equalises WARMTH (see above), which makes
 * it an age axis only for fields that are a pure function of the instant. Five of
 * these INTEGRATE over the year, so they read the arc just travelled, not the age:
 * `mossy` sums 1095 / 30 / 1236 across day1 / day11 / day27 at identical warmth,
 * grow (0.2212) and die (0.0959) — the day11 cell has just crossed midsummer, where
 * warmth > MOSS_DRY bleaches it to the floor. Read mossy, daisies, worn, harvested
 * and produce as the MATRIX SUM; a per-age reading of one is a season reading.
 * `produce` is a buffer the market empties every 4th day, so it also samples the
 * market cycle — hence the 200%. */
const PLANTING_SKIP = new Set(['bySpecies', 'species']);

/* Sum a set of cells into scalars + summed histograms. Summing across the matrix is
 * deliberate: one cell is a sample, nine cells is a measurement. */
function groups(cells) {
  const scalars = {}, tiles = {}, life = {}, structure = {}, species = {}, planting = {}, ice = {};
  for (const key in cells) {
    const c = cells[key];
    for (const k in c.scalars) scalars[k] = (scalars[k] || 0) + c.scalars[k];
    for (const t in c.tiles) tiles[t] = (tiles[t] || 0) + c.tiles[t];
    for (const t in c.life) life[t] = (life[t] || 0) + c.life[t];
    for (const t in c.structure) structure[t] = (structure[t] || 0) + c.structure[t];
    for (const t in c.planting.bySpecies) species[t] = (species[t] || 0) + c.planting.bySpecies[t];
    for (const t in c.planting) {
      if (PLANTING_SKIP.has(t) || typeof c.planting[t] !== 'number') continue;
      planting[t] = (planting[t] || 0) + c.planting[t];
    }
    /* The two states only a cold cell can hold. `__census().ice` has been in the page
     * since #181 and was folded NOWHERE, so the gate could not have seen the freeze
     * even if its ladder had one; `snowCover` rides here because it is the other thing
     * a summer cell reads as a structural zero. Reported in BOTH blocks on purpose —
     * the summer row's `frozen 0 / snowCover 0` beside a non-zero winter row is what
     * makes the summer zeros evidence rather than an absence. */
    for (const t in (c.ice || {})) ice[t] = (ice[t] || 0) + c.ice[t];
    ice.snowCover = (ice.snowCover || 0) + (c.clock ? c.clock.snow : 0);
  }
  /* `produce` is the one non-integer here; summing nine of them prints float dust. */
  for (const t in planting) planting[t] = +planting[t].toFixed(1);
  for (const t of ['skin', 'snowCover']) if (t in ice) ice[t] = +ice[t].toFixed(3);
  return { scalars, tiles, life, structure, species, planting, ice };
}

function summarize(data) {
  return { when: data.when, ladder: LADDER, winterLadder: WLADDER,
    pageerrors: data.pageerrors, errors: data.errors,
    ...groups(data.cells), winter: groups(data.wcells),
    cells: data.cells, wcells: data.wcells };
}

function diffBlock(label, now, was) {
  const keys = [...new Set([...Object.keys(now), ...Object.keys(was || {})])].sort();
  const lines = [];
  for (const k of keys) {
    const a = (was || {})[k] || 0, b = now[k] || 0, d = b - a;
    if (d === 0 && was) continue;
    const mark = !was ? ' ' : d > 0 ? '+' : d < 0 ? '-' : ' ';
    lines.push(`  ${mark} ${k.padEnd(16)} ${String(b).padStart(7)}${was ? `   (${d >= 0 ? '+' : ''}${d})` : ''}`);
  }
  if (!lines.length) return `${label}: unchanged`;
  return `${label}:\n${lines.join('\n')}`;
}

/* Print one block set — the summer nine, or the winter row — against `was` or as
 * absolutes. The winter row is a LATER ADDITION with its own ladder, so a baseline
 * pinned before #187 holds no `winter` key: say so and print absolutes, exactly as
 * a pre-#115 baseline is handled for `planting`. That is what keeps every census row
 * already in RUNLOG comparable — the summer nine never learn that winter exists. */
function report(now, was, tag) {
  console.log('\n' + diffBlock(tag + 'scalars', now.scalars, was && was.scalars));
  console.log(diffBlock(tag + 'tiles', now.tiles, was && was.tiles));
  console.log(diffBlock(tag + 'life', now.life, was && was.life));
  console.log(diffBlock(tag + 'structure', now.structure, was && was.structure));
  /* …and beside the register diff, what the ONE number folded out of it is made of.
   * `scalars.structures` moving by 3 means nothing until you know whether 3 came out
   * of the 5.6% of it that is allowed to. */
  const s = structSplit(now.structure);
  console.log(`    ${tag}structures ${s.total} = ${s.constant} build-time constant `
            + `(${(100 * s.constant / (s.total || 1)).toFixed(1)}%, can never move) + ${s.live} live`
            + (s.unclassified.length ? `   UNCLASSIFIED: ${s.unclassified.join(' ')} — add to STRUCT_CONST or STRUCT_LIVE` : ''));
  console.log(diffBlock(tag + 'species', now.species, was && was.species));
  console.log(diffBlock(tag + 'ice', now.ice, was && was.ice));
  if (was && !was.planting) console.log('planting: (baseline predates #115 and holds no planting group — absolutes, no deltas; re-pin to diff it)');
  console.log(diffBlock(tag + 'planting', now.planting, was && was.planting));
}

const raw = await run();
const cur = summarize(raw);
if (!REF) writeFileSync(curFile, JSON.stringify(cur, null, 1));

if (save) {
  if (REF) { console.error('census: --save-baseline with --ref would pin somebody else\'s build. Refused.'); process.exit(1); }
  writeFileSync(baseFile, JSON.stringify(cur, null, 1));
  console.log(`census: baseline pinned — ${SEEDS.length}x${AGES.length} + ${SEEDS.length}x${WINTER.length} winter cells, ${cur.pageerrors} page errors.`);
  console.log(diffBlock('scalars', cur.scalars, null));
  console.log(diffBlock('planting', cur.planting, null));
  console.log(diffBlock('winter/ice', cur.winter.ice, null));
  const s0 = structSplit(cur.structure), s1 = structSplit(cur.winter.structure);
  console.log(`structures: summer ${s0.total} = ${s0.constant} constant + ${s0.live} live · winter ${s1.total} = ${s1.constant} constant + ${s1.live} live`);
  process.exit(cur.pageerrors ? 1 : 0);
}

let base = existsSync(baseFile) ? JSON.parse(readFileSync(baseFile, 'utf8')) : null;

/* A baseline pinned on a different seed x age matrix is a measurement of a
 * different town, and diffing across the two reads as a huge fake regression.
 * Say so and stop, rather than printing a diff that means nothing. */
let ladderChanged = false;
if (base && base.ladder !== LADDER) {
  ladderChanged = true;
  console.error(`census: BASELINE LADDER MISMATCH — baseline is "${base.ladder || '(unrecorded, pre-#16)'}", this run is "${LADDER}".`);
  console.error('        The two are not comparable. Re-pin with --save-baseline before using this as a gate.');
  base = null;
}

console.log(`census: ${SEEDS.length} seeds x ${AGES.length} ages = ${Object.keys(cur.cells).length} cells  [${LADDER}]` +
            `  +  ${Object.keys(cur.wcells).length} winter  [${WLADDER}]` + (REF ? `   REF ${REF}` : ''));
if (cur.pageerrors) { console.error(`\nPAGE ERRORS: ${cur.pageerrors}`); for (const e of cur.errors.slice(0, 10)) console.error('  ' + e); }
if (!base) console.log('\n(no baseline pinned — showing absolute values)');
if (REF && base) console.log(`\n(REF: the diff below is a PAST tree against TODAY's baseline — two builds, so a`
                           + `\n collapse line here is a measurement of the distance between them, not a verdict.)`);
report(cur, base, '');

/* The winter row diffs only against a baseline pinned on the SAME winter ladder. */
const wbase = base && base.winterLadder === WLADDER ? base.winter : null;
if (base && !wbase) console.log(`\n(baseline holds no winter row on ladder "${WLADDER}" — absolutes, no deltas; re-pin to diff it)`);
report(cur.winter, wbase, 'winter/');

/* One line per run, appended forever. Survives baseline overwrites, and is what
 * build-stats.mjs plots as the town's growth curve. The winter summary rides along
 * as its own key so that stall.mjs's mapFlat can watch a tile kind that only exists
 * in February; the summer `scalars` are untouched, so every row already written
 * stays comparable with every row written after. */
if (!REF) appendFileSync(histFile, JSON.stringify({
  when: cur.when, ladder: LADDER, pageerrors: cur.pageerrors, scalars: cur.scalars,
  tileKinds: Object.keys(cur.tiles).length, lifeKinds: Object.keys(cur.life).length,
  winterLadder: WLADDER,
  winter: { tileKinds: Object.keys(cur.winter.tiles).length, ...cur.winter.ice },
}) + '\n');

/* Does the declared split still hold on this build? Printed once, over both blocks —
 * the registers are the same twenty in every season. */
const audit = constAudit({ ...raw.cells, ...raw.wcells });
if (audit.moved.length) console.log(`\nSTRUCT: declared CONSTANT but moved across the matrix: ${audit.moved.join(' ')} — re-classify in STRUCT_CONST.`);
if (audit.flat.length) console.log(`\nSTRUCT: declared LIVE but flat across all 12 cells: ${audit.flat.join(' ')} — either the ladder cannot see it, or it is a constant now.`);

const collapsed = [];
if (base) for (const k of CORE) {
  const a = base.scalars[k] || 0, b = cur.scalars[k] || 0;
  if (a > 0 && (a - b) / a > TOL) collapsed.push(`${k} ${a} -> ${b} (-${(((a - b) / a) * 100).toFixed(1)}%)`);
}

/* The winter row's own collapse check, against its own baseline and its own floors.
 * It runs only when the baseline carries a winter row on THIS winter ladder — the
 * same condition the winter diff runs under, for the same reason: a pre-#187
 * baseline has nothing to compare and must not fail a build for it. */
const wnow = { ...cur.winter.scalars, frozen: cur.winter.ice.frozen, margin: cur.winter.ice.margin };
const wwas = wbase && { ...wbase.scalars, frozen: wbase.ice.frozen, margin: wbase.ice.margin };
if (wwas) for (const k in WCORE) {
  const a = wwas[k] || 0, b = wnow[k] || 0, tol = WCORE[k];
  if (a > 0 && (a - b) / a > tol) collapsed.push(`winter/${k} ${a} -> ${b} (-${(((a - b) / a) * 100).toFixed(1)}%, floor ${(tol * 100).toFixed(0)}%)`);
}

/* A ZERO is evidence only if the test could have been non-zero. The winter row exists
 * to exercise the seasonal state, so a run where nothing froze is not a clean run —
 * it is an unexercised one, and it says so rather than passing quietly. It is not a
 * FAIL: this gate hard-fails on a page error or a core collapse, and a town that
 * legitimately stops freezing is a build decision, not a broken page. */
const winterWeak = !cur.winter.ice.frozen;
if (winterWeak) console.log(`\nWEAK: the winter row froze 0 cells of ${cur.winter.ice.margin || 0} margin — the seasonal axis is not exercised; re-pin WINTER.`);

if (asJson) console.log('\nJSON ' + JSON.stringify({ pageerrors: cur.pageerrors, collapsed, scalars: cur.scalars,
  structures: structSplit(cur.structure), structAudit: audit,
  winter: { tileKinds: Object.keys(cur.winter.tiles).length, ...cur.winter.ice, weak: winterWeak,
            scalars: cur.winter.scalars, structures: structSplit(cur.winter.structure) } }));

if (ladderChanged) {
  console.error('\nVERDICT: NO COMPARISON — the age ladder moved, so there is nothing to diff against.');
  process.exit(1);
}
if (cur.pageerrors || collapsed.length) {
  console.error('\nVERDICT: FAIL');
  for (const c of collapsed) console.error('  COLLAPSE ' + c);
  if (cur.pageerrors) console.error(`  ${cur.pageerrors} page error(s)`);
  process.exit(1);
}
console.log(`\nVERDICT: PASS  (no page errors, no core collapse${winterWeak ? '; winter row WEAK' : ''})`);
console.log('Growth is judged from the histogram diff above + screenshots, not from this line.');
