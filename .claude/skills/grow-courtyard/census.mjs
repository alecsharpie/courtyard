#!/usr/bin/env node
/* grow-courtyard census — the loop's numeric regression guard.
 *
 *   node census.mjs                  measure + diff against census-baseline.json
 *   node census.mjs --save-baseline  pin the current town as the baseline
 *   node census.mjs --json           machine-readable summary on stdout
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
 * Exit 0 = pass. Exit 1 = a page threw, or a core aggregate cratered.
 */
import { homedir } from 'node:os';
import { readFileSync, writeFileSync, existsSync, appendFileSync } from 'node:fs';
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
const PAGE = pathToFileURL(join(REPO, 'courtyard.html')).href;
const baseFile = join(HERE, 'census-baseline.json');
const curFile = join(HERE, 'census-latest.json');
const histFile = join(HERE, 'census-history.jsonl');

const save = process.argv.includes('--save-baseline');
const asJson = process.argv.includes('--json');

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

/* Headline aggregates. `CORE` are structural: if one of these craters the town has
 * genuinely broken, and that is the only thing this gate hard-fails on. */
const CORE = ['developed', 'green', 'people', 'planted'];
const TOL = 0.08;   // an 8% dip in a core aggregate is the collapse threshold

async function run() {
  const b = await chromium.launch();
  const cells = {};
  let pageerrors = 0;
  const errors = [];
  for (const seed of SEEDS) {
    for (const age of AGES) {
      const p = await b.newPage();
      p.on('pageerror', e => { pageerrors++; errors.push(`${seed}@${age.name}: ${String(e)}`); });
      p.on('console', m => { if (m.type() === 'error') { pageerrors++; errors.push(`${seed}@${age.name}: console ${m.text()}`); } });
      await p.goto(`${PAGE}?seed=${seed}&t=0&pause`);
      await p.waitForTimeout(300);
      cells[`${seed}@${age.name}`] = await p.evaluate(w => {
        window.__reseed();
        window.__warp(w);
        return window.__census();
      }, age.warp);
      await p.close();
    }
  }
  await b.close();
  return { when: new Date().toISOString(), pageerrors, errors, cells };
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

/* Sum the matrix into scalars + summed histograms. Summing across the matrix is
 * deliberate: one cell is a sample, nine cells is a measurement. */
function summarize(data) {
  const scalars = {}, tiles = {}, life = {}, structure = {}, species = {}, planting = {};
  for (const key in data.cells) {
    const c = data.cells[key];
    for (const k in c.scalars) scalars[k] = (scalars[k] || 0) + c.scalars[k];
    for (const t in c.tiles) tiles[t] = (tiles[t] || 0) + c.tiles[t];
    for (const t in c.life) life[t] = (life[t] || 0) + c.life[t];
    for (const t in c.structure) structure[t] = (structure[t] || 0) + c.structure[t];
    for (const t in c.planting.bySpecies) species[t] = (species[t] || 0) + c.planting.bySpecies[t];
    for (const t in c.planting) {
      if (PLANTING_SKIP.has(t) || typeof c.planting[t] !== 'number') continue;
      planting[t] = (planting[t] || 0) + c.planting[t];
    }
  }
  /* `produce` is the one non-integer here; summing nine of them prints float dust. */
  for (const t in planting) planting[t] = +planting[t].toFixed(1);
  return { when: data.when, ladder: LADDER, pageerrors: data.pageerrors, errors: data.errors,
    scalars, tiles, life, structure, species, planting, cells: data.cells };
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

const raw = await run();
const cur = summarize(raw);
writeFileSync(curFile, JSON.stringify(cur, null, 1));

if (save) {
  writeFileSync(baseFile, JSON.stringify(cur, null, 1));
  console.log(`census: baseline pinned — ${SEEDS.length}x${AGES.length} cells, ${cur.pageerrors} page errors.`);
  console.log(diffBlock('scalars', cur.scalars, null));
  console.log(diffBlock('planting', cur.planting, null));
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

console.log(`census: ${SEEDS.length} seeds x ${AGES.length} ages = ${Object.keys(cur.cells).length} cells  [${LADDER}]`);
if (cur.pageerrors) { console.error(`\nPAGE ERRORS: ${cur.pageerrors}`); for (const e of cur.errors.slice(0, 10)) console.error('  ' + e); }
if (!base) console.log('\n(no baseline pinned — showing absolute values)');
console.log('\n' + diffBlock('scalars', cur.scalars, base && base.scalars));
console.log(diffBlock('tiles', cur.tiles, base && base.tiles));
console.log(diffBlock('life', cur.life, base && base.life));
console.log(diffBlock('structure', cur.structure, base && base.structure));
console.log(diffBlock('species', cur.species, base && base.species));
if (base && !base.planting) console.log('planting: (baseline predates #115 and holds no planting group — absolutes, no deltas; re-pin to diff it)');
console.log(diffBlock('planting', cur.planting, base && base.planting));

/* One line per run, appended forever. Survives baseline overwrites, and is what
 * build-stats.mjs plots as the town's growth curve. */
appendFileSync(histFile, JSON.stringify({
  when: cur.when, ladder: LADDER, pageerrors: cur.pageerrors, scalars: cur.scalars,
  tileKinds: Object.keys(cur.tiles).length, lifeKinds: Object.keys(cur.life).length,
}) + '\n');

const collapsed = [];
if (base) for (const k of CORE) {
  const a = base.scalars[k] || 0, b = cur.scalars[k] || 0;
  if (a > 0 && (a - b) / a > TOL) collapsed.push(`${k} ${a} -> ${b} (-${(((a - b) / a) * 100).toFixed(1)}%)`);
}

if (asJson) console.log('\nJSON ' + JSON.stringify({ pageerrors: cur.pageerrors, collapsed, scalars: cur.scalars }));

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
console.log('\nVERDICT: PASS  (no page errors, no core collapse)');
console.log('Growth is judged from the histogram diff above + screenshots, not from this line.');
