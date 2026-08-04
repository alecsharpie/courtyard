#!/usr/bin/env node
/* probe: does the river have a year in it, and is the anchor still HEAD's river?
 *
 *   node probes/river-year.mjs [file …]        (default: HEAD snapshot + working copy)
 *
 * Two questions the census cannot answer.
 *
 * (1) NEUTRALITY, as an identity rather than a tolerance. At SEASON_START every new
 *     term must be exactly the constant it replaced: riverRun() 1, boatRate() 0.012,
 *     boatSpeed() 1.05, twelve streaks, riverCol(c) === c, and the cached ground
 *     layer byte-identical to HEAD's.
 *
 * (2) THE YEAR, as a distribution. A boat is a rare event on a river only one boat
 *     may occupy, so a single year is a sample: this folds SEEDS x YEARS into four
 *     season buckets and reports arrivals per day, the share of time a boat is
 *     actually on the water, and how many individual seasons saw none at all.
 *
 * Reproducibility rules from LAWS: reseed before measuring, step inside ONE
 * page.evaluate, fresh page per seed.
 */
import { homedir } from 'node:os';
import { resolve, join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const REPO = fileURLToPath(new URL('../../../../', import.meta.url));
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;

const FILES = process.argv.length > 2
  ? process.argv.slice(2)
  : ['/tmp/courtyard-head.html', join(REPO, 'courtyard.html')];

const SEEDS = (process.env.RY_SEEDS || '1,7,13,29,42,101,777,1234').split(',').map(Number);
const YEARS = +(process.env.RY_YEARS || 3);
const STEP = 1.0;                                  // sim seconds per sample
const DAY_LEN = 55, SEASON_LEN = 26;
const SPAN = DAY_LEN * SEASON_LEN * YEARS;

const BUCKETS = ['winter', 'spring', 'summer', 'autumn'];
const bucketOf = p => BUCKETS[Math.floor(((p + 0.125) % 1) * 4)];

const browser = await chromium.launch();

/* ---- (1) the anchor ---------------------------------------------------------- */
async function anchor(file) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 720 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(pathToFileURL(resolve(file)).href + '?pause&seed=42', { waitUntil: 'load' });
  await page.waitForFunction(() => typeof window.__warp === 'function');
  const out = await page.evaluate(() => {
    // land on SEASON_START exactly: ?pause freezes the clock, but a couple of rAFs
    // arrive before the first host round-trip and the phase has already moved
    window.__reseed(); window.__setTime(0); drawGround();
    const has = n => typeof window[n] === 'function' || typeof eval('typeof ' + n) === 'function';
    const r = {
      phase: seasonPhase,
      run: has('riverRun') ? riverRun() : 1,
      boatRate: has('boatRate') ? boatRate() : 0.012,
      boatSpeed: has('boatSpeed') ? boatSpeed() : 1.05,
      streaks: has('riverRun') ? Math.round(12 * riverRun()) : 12,
      grey: greyF(),
    };
    // the exact colour groundCol() hands back for the deepest river cell, and the
    // exact colour the flow streaks are stroked in, at this instant
    const RX = 120, RY = 30;                    // mid-channel, north of the bridge
    r.deepCell = groundCol(RX, RY, grid[RY * GW + RX], hash(RX, RY), maturity());
    r.tintIdentity = has('riverCol') ? (riverCol(r.deepCell) === r.deepCell) : true;
    const cold = nightF > 0.5, g = has('riverRun') ? greyF() : 0;
    r.flowRGB = [Math.round((cold ? 190 : 225) - 11 * g),
                 Math.round((cold ? 210 : 238) - 6 * g),
                 Math.round((cold ? 235 : 240) + 6 * g)];
    r.ground = gcv.toDataURL();
    return r;
  });
  await page.close();
  if (errs.length) console.log(`  ! page errors: ${errs[0]}`);
  out.groundHash = createHash('sha1').update(out.ground).digest('hex').slice(0, 12);
  delete out.ground;
  return out;
}

/* ---- (2) the year ------------------------------------------------------------ */
async function measure(file) {
  const rows = [];
  for (const seed of SEEDS) {
    const page = await browser.newPage({ viewport: { width: 1200, height: 720 } });
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto(pathToFileURL(resolve(file)).href + `?pause&seed=${seed}`, { waitUntil: 'load' });
    await page.waitForFunction(() => typeof window.__warp === 'function');
    const series = await page.evaluate(({ step, span }) => {
      window.__reseed();
      const hasRun = typeof riverRun === 'function';
      const out = [];
      for (let t = 0; t < span; t += step) {
        window.__warp(step);
        out.push([+seasonPhase.toFixed(5), boatSeq, boat ? 1 : 0,
                  hasRun ? +riverRun().toFixed(4) : 1]);
      }
      return out;
    }, { step: STEP, span: SPAN });
    await page.close();
    if (errs.length) console.log(`  ! page errors on seed ${seed}: ${errs[0]}`);
    rows.push({ seed, series });
  }
  return rows;
}

function fold(rows) {
  const B = {}; for (const b of BUCKETS) B[b] = { n: 0, arrivals: 0, present: 0, run: 0 };
  const cells = {};                                  // (seed,year,season) -> arrivals
  let total = { n: 0, arrivals: 0, present: 0 };
  const YEAR_SEC = SEASON_LEN * DAY_LEN;
  for (const { seed, series } of rows) {
    let prevSeq = series[0][1];
    series.forEach(([phase, seq, present, run], i) => {
      const name = bucketOf(phase);
      const b = B[name];
      const d = Math.max(0, seq - prevSeq); prevSeq = seq;
      b.n++; b.arrivals += d; b.present += present; b.run += run;
      total.n++; total.arrivals += d; total.present += present;
      // one cell per (seed, season, year) — a single lived season, not a fold
      const k = seed + '|' + name + '|' + Math.floor(i * STEP / YEAR_SEC);
      cells[k] = (cells[k] || 0) + d;
    });
  }
  return { B, total, cells };
}

function report(name, f) {
  const { B, total, cells } = f;
  const secPerSample = STEP;
  console.log(`\n  ${name}`);
  console.log('    season    boats/day   present%    riverRun');
  for (const b of BUCKETS) {
    const s = B[b];
    const days = s.n * secPerSample / DAY_LEN;
    console.log('    ' + b.padEnd(9) +
      (s.arrivals / days).toFixed(3).padStart(9) +
      (100 * s.present / s.n).toFixed(1).padStart(11) +
      (s.run / s.n).toFixed(3).padStart(12));
  }
  const days = total.n * secPerSample / DAY_LEN;
  console.log('    ' + 'YEAR'.padEnd(9) + (total.arrivals / days).toFixed(3).padStart(9) +
    (100 * total.present / total.n).toFixed(1).padStart(11));
  // how many individual (seed, season-instance) cells saw no boat at all
  const per = {}; for (const b of BUCKETS) per[b] = { z: 0, n: 0 };
  for (const [k, v] of Object.entries(cells)) {
    const b = k.split('|')[1]; per[b].n++; if (v === 0) per[b].z++;
  }
  console.log('    boatless season instances: ' +
    BUCKETS.map(b => `${b} ${per[b].z}/${per[b].n}`).join('  '));
  return { summer: B.summer, winter: B.winter };
}

console.log(`river-year — ${SEEDS.length} seeds x ${YEARS} years, ${STEP}s samples`);

console.log('\n(1) the anchor — SEASON_START must be HEAD exactly');
const anchors = [];
for (const f of FILES) anchors.push({ f, a: await anchor(f) });
for (const { f, a } of anchors) {
  console.log(`  ${f.split('/').pop().padEnd(22)} phase=${a.phase.toFixed(6)} grey=${a.grey.toFixed(6)}`);
  console.log(`    riverRun ${a.run}  boatRate ${a.boatRate}  boatSpeed ${a.boatSpeed}  streaks ${a.streaks}`);
  console.log(`    deep river cell ${a.deepCell}  tint-is-identity ${a.tintIdentity}`);
  console.log(`    flow streak rgb ${a.flowRGB.join(',')}  ground-layer sha1 ${a.groundHash}`);
}
if (anchors.length === 2) {
  const [h, w] = anchors.map(x => x.a);
  /* greyF() at the anchor is not 0 but 6.1e-17 — Math.cos(PI/2) is not exactly zero,
   * so every seasoned term in the file (HEAD's included) carries that residual. The
   * drawn things all round it away; a raw rate keeps it. So the rate is compared at a
   * relative 1e-12, and everything that reaches a pixel is compared for equality. */
  const rel = (a, b) => Math.abs(a - b) / b < 1e-12;
  const same = h.deepCell === w.deepCell && h.groundHash === w.groundHash &&
               h.flowRGB.join() === w.flowRGB.join() && w.run === 1 &&
               rel(w.boatRate, 0.012) && w.boatSpeed === 1.05 && w.streaks === 12 && w.tintIdentity;
  console.log(`  ANCHOR ${same ? 'IDENTICAL to HEAD' : 'DIFFERS from HEAD'}` +
    `  (boatRate residual ${(w.boatRate - 0.012).toExponential(2)}, from Math.cos(PI/2))`);
}

console.log('\n(2) the year');
for (const f of FILES) report(f.split('/').pop(), fold(await measure(f)));

await browser.close();
