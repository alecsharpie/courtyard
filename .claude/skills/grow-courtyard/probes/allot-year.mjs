#!/usr/bin/env node
/* probe: the allotments' whole year.
 *
 * The allotments inherit `bloomCap()` through `caTick`, so in deep winter no cell can
 * reach stage 3, `ripePlots()` goes to zero, `harvestPlot()` stops and `spawnAllotAgent`
 * — whose rate IS ripeness — damps to its 0.01 floor. That is seasonally correct and
 * has never been measured. The census samples nine instants and cannot see it at all.
 *
 * Folds, over several seasonal years and several seeds:
 *   - ripePlots() and the state of all 17 plots (bare / sown / full, mean stage)
 *   - gardener ARRIVALS (spawnAllotAgent fires, counted by identity)
 *   - gardeners PRESENT (share of time at least one is in the block) — #23's law:
 *     on a channel this small, presence is what a viewer sees, not arrivals/day
 *   - harvested, the cumulative cells picked
 * by season quarter, and day by day through the spring return so the TIMING of the
 * comeback is visible rather than inferred.
 *
 *   node allot-year.mjs [pathToHtml] [label]
 *   SEEDS=7,42,1234 DAYS=104 node allot-year.mjs
 */
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;

const FILE = resolve(process.argv[2] || fileURLToPath(new URL('../../../../courtyard.html', import.meta.url)));
const LABEL = process.argv[3] || 'HERE';
const PAGE = pathToFileURL(FILE).href;

const SEEDS = (process.env.SEEDS || '7,42,1234,99').split(',').map(Number);
const DAY = 55, YEAR = 26;                       // SEASON_LEN 26 days
const DAYS = +(process.env.DAYS || 78);          // 3 seasonal years
const STEP = 1;                                  // 1 sim second: spawn rolls are 1/s, so no arrival is missed
const WARM = +(process.env.WARM || 8);           // days of maturity ramp to discard

const browser = await chromium.launch();
const runs = [];
for (const seed of SEEDS) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 720 } });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  await page.goto(`${PAGE}?pause&seed=${seed}&t=0`, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof window.__warp === 'function');
  /* ONE evaluate: the page keeps running between host round-trips, and neither
     __reseed nor __setTime rewinds module-level latches or the agents already out. */
  const series = await page.evaluate(({ step, n }) => {
    window.__reseed();
    const seen = new WeakSet();
    let arrivals = 0;
    const out = [];
    for (let k = 0; k < n; k++) {
      window.__warp(step);
      for (const a of agents) if (a.kind === 'allot' && !seen.has(a)) { seen.add(a); arrivals++; }
      // every plot, by the same lattice ripePlots() walks
      let bare = 0, sown = 0, full = 0, stageSum = 0, cells = 0;
      for (let oy = 8; oy <= 50; oy += 7) for (let ox = 80; ox <= 90; ox += 5) {
        let bed = 0, pl = 0, st = 0;
        for (let y = oy; y < oy + 2; y++) for (let x = ox; x < ox + 3; x++) {
          const i = y * GW + x;
          if (grid[i] !== BED) continue;
          bed++; if (bSp[i]) { pl++; st += bSt[i]; }
        }
        if (!bed) continue;
        cells += bed; stageSum += st;
        if (!pl) bare++; else if (pl < bed) sown++; else full++;
      }
      out.push([simT, seasonPhase, ripePlots(), agents.filter(a => a.kind === 'allot').length,
                arrivals, harvested, bare, sown, full, stageSum / Math.max(1, cells)]);
    }
    return out;
  }, { step: STEP, n: Math.round(DAYS * DAY / STEP) });
  if (errs.length) { console.error(`seed ${seed}: PAGE ERROR`, errs[0]); process.exitCode = 1; }
  runs.push({ seed, series });
  await page.close();
}
await browser.close();

const T = 0, PH = 1, RIPE = 2, HERE = 3, ARR = 4, HARV = 5, BARE = 6, SOWN = 7, FULL = 8, STAGE = 9;
const warmthOf = p => 0.5 - 0.5 * Math.cos(2 * Math.PI * p);
const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
/* phase 0 is midwinter, so the quarters are centred on the solstices/equinoxes */
const SEASONS = ['winter', 'spring', 'summer', 'autumn'];
const seasonOf = p => SEASONS[Math.floor(((p + 0.125) % 1) * 4)];

const settled = runs.map(r => ({ seed: r.seed, s: r.series.filter(v => v[T] >= WARM * DAY) }));

console.log(`\n=== ${LABEL}  (${FILE})`);
console.log(`${SEEDS.length} seeds x ${DAYS} days (${(DAYS / YEAR).toFixed(1)} seasonal years), 1 s samples, first ${WARM} days discarded`);

/* --- 1. the year by season quarter ------------------------------------------------ */
console.log('\nseason   warmth  cap  ripe/17   arrivals/day  present  >=1 gardener   plots: bare sown full   stage  picked/day');
const rows = {};
for (const name of SEASONS) rows[name] = [];
for (const { s } of settled) for (const v of s) rows[seasonOf(v[PH])].push(v);
const capOf = w => w > 0.42 ? 3 : w > 0.20 ? 2 : 1;
for (const name of SEASONS) {
  const v = rows[name];
  // arrivals and harvest are cumulative counters: rate = total delta / total sampled time
  let dArr = 0, dHarv = 0, secs = 0;
  for (const { s } of settled) {
    let prev = null;
    for (const r of s) {
      if (seasonOf(r[PH]) === name) {
        if (prev) { dArr += r[ARR] - prev[ARR]; dHarv += r[HARV] - prev[HARV]; secs += r[T] - prev[T]; }
      }
      prev = r;
    }
  }
  const days = secs / DAY;
  const w = mean(v.map(r => warmthOf(r[PH])));
  console.log(`${name.padEnd(8)} ${w.toFixed(2)}    ${capOf(w)}   ${mean(v.map(r => r[RIPE])).toFixed(2).padStart(5)}` +
    `        ${(dArr / days).toFixed(2).padStart(5)}       ${mean(v.map(r => r[HERE])).toFixed(2)}     ` +
    `${(100 * v.filter(r => r[HERE] > 0).length / v.length).toFixed(1).padStart(5)}%       ` +
    `${mean(v.map(r => r[BARE])).toFixed(1).padStart(4)} ${mean(v.map(r => r[SOWN])).toFixed(1).padStart(4)} ${mean(v.map(r => r[FULL])).toFixed(1).padStart(4)}   ` +
    `${mean(v.map(r => r[STAGE])).toFixed(2)}     ${(dHarv / days).toFixed(1).padStart(5)}`);
}

/* --- 2. the year day by day, folded on the seasonal year -------------------------- */
console.log('\nthe fold: one seasonal year, day by day (phase 0 = midwinter)');
console.log('yday  phase  warmth  ripe   arr/day  present  bare  stage   ripe bar');
const fold = new Map();
for (const { s } of settled) for (const v of s) {
  const yd = Math.floor((((v[PH] % 1) + 1) % 1) * YEAR);
  if (!fold.has(yd)) fold.set(yd, []);
  fold.get(yd).push(v);
}
// arrivals per folded day, from the counter deltas
const foldArr = new Map(), foldSec = new Map();
for (const { s } of settled) {
  let prev = null;
  for (const r of s) {
    if (prev) {
      const yd = Math.floor((((r[PH] % 1) + 1) % 1) * YEAR);
      foldArr.set(yd, (foldArr.get(yd) || 0) + (r[ARR] - prev[ARR]));
      foldSec.set(yd, (foldSec.get(yd) || 0) + (r[T] - prev[T]));
    }
    prev = r;
  }
}
for (let yd = 0; yd < YEAR; yd++) {
  const v = fold.get(yd) || [];
  if (!v.length) continue;
  const ph = yd / YEAR, w = warmthOf(ph);
  const ripe = mean(v.map(r => r[RIPE]));
  const arr = (foldArr.get(yd) || 0) / ((foldSec.get(yd) || 1) / DAY);
  console.log(`${String(yd).padStart(3)}  ${ph.toFixed(3)}   ${w.toFixed(2)}  ${ripe.toFixed(2).padStart(5)}` +
    `   ${arr.toFixed(2).padStart(5)}    ${mean(v.map(r => r[HERE])).toFixed(2)}    ${mean(v.map(r => r[BARE])).toFixed(1).padStart(4)}  ` +
    `${mean(v.map(r => r[STAGE])).toFixed(2)}   ` + '#'.repeat(Math.round(ripe * 2)));
}

/* --- 3. the winter trough and the spring return, as single numbers ---------------- */
const all = settled.flatMap(r => r.s);
const dead = all.filter(r => r[RIPE] === 0).length / all.length;
const empty = all.filter(r => r[HERE] === 0).length / all.length;
const allBare = all.filter(r => r[BARE] === 17).length / all.length;
console.log(`\nshare of the whole year with ripe == 0        : ${(100 * dead).toFixed(1)}%`);
console.log(`share of the whole year with no gardener     : ${(100 * empty).toFixed(1)}%`);
console.log(`share of the whole year with all 17 plots BARE: ${(100 * allBare).toFixed(1)}%`);

/* longest continuous stretch, per seed-year, with no gardener at all, and with ripe 0 */
const runsOf = (s, pred) => { let best = 0, cur = 0; for (const r of s) { cur = pred(r) ? cur + STEP : 0; if (cur > best) best = cur; } return best; };
console.log('\nlongest unbroken stretch (sim s / sim days), per seed:');
for (const { seed, s } of settled) {
  const g = runsOf(s, r => r[HERE] === 0), rp = runsOf(s, r => r[RIPE] === 0), b = runsOf(s, r => r[BARE] === 17);
  console.log(`  seed ${String(seed).padStart(4)}  no gardener ${String(g).padStart(5)}s (${(g / DAY).toFixed(1)}d)` +
    `   ripe 0 ${String(rp).padStart(5)}s (${(rp / DAY).toFixed(1)}d)   all bare ${String(b).padStart(5)}s (${(b / DAY).toFixed(1)}d)`);
}

/* --- 4. does the spring return arrive on time? ------------------------------------ */
/* the first folded day, after the winter trough, at which ripe crosses 1 and at which a
   gardener is present more than a fifth of the time */
const foldRipe = [], foldHere = [];
for (let yd = 0; yd < YEAR; yd++) {
  const v = fold.get(yd) || [];
  foldRipe.push(v.length ? mean(v.map(r => r[RIPE])) : NaN);
  foldHere.push(v.length ? v.filter(r => r[HERE] > 0).length / v.length : NaN);
}
const firstAfter = (arr, from, pred) => { for (let k = 0; k < YEAR; k++) { const yd = (from + k) % YEAR; if (pred(arr[yd])) return yd; } return -1; };
const trough = foldRipe.indexOf(Math.min(...foldRipe.filter(x => !isNaN(x))));
console.log(`\ntrough of ripeness at folded day ${trough} (phase ${(trough / YEAR).toFixed(3)}, warmth ${warmthOf(trough / YEAR).toFixed(2)})`);
console.log(`  ripe crosses 1.0 again at day ${firstAfter(foldRipe, trough, x => x >= 1)}` +
  `   (bloomCap goes 1->2 at phase 0.148 = day ${Math.ceil(0.1476 * YEAR)}, 2->3 at phase 0.224 = day ${Math.ceil(0.2244 * YEAR)})`);
console.log(`  a gardener is present >20% of the time again at day ${firstAfter(foldHere, trough, x => x >= 0.2)}`);
console.log(`  peak ripeness ${Math.max(...foldRipe.filter(x => !isNaN(x))).toFixed(2)} at day ${foldRipe.indexOf(Math.max(...foldRipe.filter(x => !isNaN(x))))}`);
