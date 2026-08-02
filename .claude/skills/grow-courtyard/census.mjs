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
 * around day 16 — so these three ages are "young / filling in / fully grown". */
const SEEDS = [7, 42, 1234];
const AGES = [{ name: 'day1', warp: 90 }, { name: 'day6', warp: 330 }, { name: 'day16', warp: 900 }];

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

/* Sum the matrix into scalars + summed histograms. Summing across the matrix is
 * deliberate: one cell is a sample, nine cells is a measurement. */
function summarize(data) {
  const scalars = {}, tiles = {}, life = {}, structure = {}, species = {};
  for (const key in data.cells) {
    const c = data.cells[key];
    for (const k in c.scalars) scalars[k] = (scalars[k] || 0) + c.scalars[k];
    for (const t in c.tiles) tiles[t] = (tiles[t] || 0) + c.tiles[t];
    for (const t in c.life) life[t] = (life[t] || 0) + c.life[t];
    for (const t in c.structure) structure[t] = (structure[t] || 0) + c.structure[t];
    for (const t in c.planting.bySpecies) species[t] = (species[t] || 0) + c.planting.bySpecies[t];
  }
  return { when: data.when, pageerrors: data.pageerrors, errors: data.errors,
    scalars, tiles, life, structure, species, cells: data.cells };
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
  process.exit(cur.pageerrors ? 1 : 0);
}

const base = existsSync(baseFile) ? JSON.parse(readFileSync(baseFile, 'utf8')) : null;

console.log(`census: ${SEEDS.length} seeds x ${AGES.length} ages = ${Object.keys(cur.cells).length} cells`);
if (cur.pageerrors) { console.error(`\nPAGE ERRORS: ${cur.pageerrors}`); for (const e of cur.errors.slice(0, 10)) console.error('  ' + e); }
if (!base) console.log('\n(no baseline pinned — showing absolute values)');
console.log('\n' + diffBlock('scalars', cur.scalars, base && base.scalars));
console.log(diffBlock('tiles', cur.tiles, base && base.tiles));
console.log(diffBlock('life', cur.life, base && base.life));
console.log(diffBlock('structure', cur.structure, base && base.structure));
console.log(diffBlock('species', cur.species, base && base.species));

/* One line per run, appended forever. Survives baseline overwrites, and is what
 * build-stats.mjs plots as the town's growth curve. */
appendFileSync(histFile, JSON.stringify({
  when: cur.when, pageerrors: cur.pageerrors, scalars: cur.scalars,
  tileKinds: Object.keys(cur.tiles).length, lifeKinds: Object.keys(cur.life).length,
}) + '\n');

const collapsed = [];
if (base) for (const k of CORE) {
  const a = base.scalars[k] || 0, b = cur.scalars[k] || 0;
  if (a > 0 && (a - b) / a > TOL) collapsed.push(`${k} ${a} -> ${b} (-${(((a - b) / a) * 100).toFixed(1)}%)`);
}

if (asJson) console.log('\nJSON ' + JSON.stringify({ pageerrors: cur.pageerrors, collapsed, scalars: cur.scalars }));

if (cur.pageerrors || collapsed.length) {
  console.error('\nVERDICT: FAIL');
  for (const c of collapsed) console.error('  COLLAPSE ' + c);
  if (cur.pageerrors) console.error(`  ${cur.pageerrors} page error(s)`);
  process.exit(1);
}
console.log('\nVERDICT: PASS  (no page errors, no core collapse)');
console.log('Growth is judged from the histogram diff above + screenshots, not from this line.');
