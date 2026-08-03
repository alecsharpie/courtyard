#!/usr/bin/env node
/* probe: do the beds trace a CURVE over the year, or a plateau — and does the mix of
 * species survive several years of that, or does the winter clear-out let one species
 * take the garden? The census samples nine instants and cannot tell either.
 *
 * Also answers the question the census gate raised: is the -19% `planted` drop the
 * whole year sagging, or is it the day16 cell landing in deep winter by construction?
 * So it reports per-day AND at the three census warps.
 *
 *   node probe-beds.mjs [pathToHtml] [label]
 */
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;

const FILE = resolve(process.argv[2] || fileURLToPath(new URL('../../../../courtyard.html', import.meta.url)));
const LABEL = process.argv[3] || 'HERE';
const PAGE = pathToFileURL(FILE).href;

const SEEDS = (process.env.SEEDS || '7,42,1234').split(',').map(Number);
const DAY = 55, DAYS = +(process.env.DAYS || 78);     // 3 seasonal years at SEASON_LEN 26
const STEP = DAY / 4;

const browser = await chromium.launch();
const runs = [];
for (const seed of SEEDS) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 720 } });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  await page.goto(`${PAGE}?pause&seed=${seed}&t=0`, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof window.__warp === 'function');
  const series = await page.evaluate(({ step, n }) => {
    window.__reseed();
    const out = [];
    for (let i = 0; i < n; i++) {
      window.__warp(step);
      const c = window.__census();
      out.push([c.clock.simT, c.clock.season ?? -1, c.planting.planted, c.planting.blooming,
                c.planting.daisies, c.planting.harvested, c.planting.bySpecies]);
    }
    return out;
  }, { step: STEP, n: Math.round(DAYS * DAY / STEP) });
  if (errs.length) { console.error(`seed ${seed}: PAGE ERROR`, errs[0]); process.exitCode = 1; }
  runs.push({ seed, series });
  await page.close();
}

/* the three census cells, measured the way census.mjs measures them */
const censusCells = [];
for (const seed of SEEDS) {
  for (const warp of [90, 330, 900]) {
    const page = await browser.newPage({ viewport: { width: 1200, height: 720 } });
    await page.goto(`${PAGE}?pause&seed=${seed}&t=0`, { waitUntil: 'load' });
    await page.waitForFunction(() => typeof window.__warp === 'function');
    const c = await page.evaluate(w => { window.__warp(w); const c = window.__census();
      return [c.clock.season, c.planting.planted, c.planting.blooming]; }, warp);
    censusCells.push({ seed, warp, season: c[0], planted: c[1], blooming: c[2] });
    await page.close();
  }
}
await browser.close();

const warmthOf = s => 0.5 - 0.5 * Math.cos(2 * Math.PI * s);

console.log(`\n=== ${LABEL}  (${FILE})`);

/* --- 1. the curve: planted + blooming by day, past the maturity ramp --- */
const byDay = new Map();
for (const { series } of runs) {
  for (const [t, s, planted, blooming, daisies] of series) {
    const d = Math.floor(t / DAY);
    if (!byDay.has(d)) byDay.set(d, { planted: [], blooming: [], daisies: [], season: s });
    const v = byDay.get(d);
    v.planted.push(planted); v.blooming.push(blooming); v.daisies.push(daisies);
  }
}
const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
const days = [...byDay.keys()].sort((a, b) => a - b).filter(d => d >= 8 && d < DAYS);
console.log('\nday   season warmth  planted blooming daisies   bloom bar');
for (const d of days) {
  const v = byDay.get(d), w = warmthOf(v.season);
  const bl = mean(v.blooming);
  console.log(`${String(d).padStart(3)}  ${v.season.toFixed(3)}  ${w.toFixed(2)}  ` +
    `${mean(v.planted).toFixed(0).padStart(7)} ${bl.toFixed(0).padStart(8)} ${mean(v.daisies).toFixed(0).padStart(7)}   ` +
    '#'.repeat(Math.round(bl / 12)));
}
const bl = days.map(d => mean(byDay.get(d).blooming));
const pl = days.map(d => mean(byDay.get(d).planted));
const span = (a) => `${Math.min(...a).toFixed(0)} .. ${Math.max(...a).toFixed(0)}` +
  `  (x${(Math.max(...a) / Math.max(1, Math.min(...a))).toFixed(1)})`;
console.log(`\nblooming over the settled year: ${span(bl)}`);
console.log(`planted  over the settled year: ${span(pl)}`);

/* --- 2. variety ACROSS cycles, not within one: does the winter clear-out let one
   species take the garden? Shannon evenness over the flower species at each summer
   peak, year by year. A falling series is the CA-variety law biting. --- */
const YEAR = 26;
console.log('\nsummer peak, year by year — flower mix (Shannon evenness 0..1):');
for (let yr = 0; yr * YEAR < DAYS; yr++) {
  const inYr = days.filter(d => Math.floor(d / YEAR) === yr);
  if (!inYr.length) continue;
  const peakDay = inYr.reduce((a, d) => mean(byDay.get(d).blooming) > mean(byDay.get(a).blooming) ? d : a, inYr[0]);
  // pull the species histogram at that day, summed over seeds
  const hist = {};
  for (const { series } of runs) {
    for (const [t, , , , , , bySp] of series) {
      if (Math.floor(t / DAY) !== peakDay) continue;
      for (const k in bySp) hist[k] = (hist[k] || 0) + bySp[k];
    }
  }
  const veg = new Set(['carrots', 'cabbages', 'beans', 'pumpkins']);
  const flowers = Object.entries(hist).filter(([k]) => !veg.has(k));
  const tot = flowers.reduce((a, [, v]) => a + v, 0);
  const H = -flowers.reduce((a, [, v]) => v > 0 ? a + (v / tot) * Math.log(v / tot) : a, 0);
  const even = flowers.length > 1 ? H / Math.log(flowers.length) : 0;
  console.log(`  year ${yr}  peak day ${peakDay}  species ${flowers.length}  evenness ${even.toFixed(3)}` +
    `   ${flowers.sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v}`).join(' ')}`);
}

/* --- 3. the census cells, so the gate's number is attributable --- */
console.log('\nthe census cells (seed x warp), with the season each one lands in:');
for (const c of censusCells) {
  console.log(`  seed ${String(c.seed).padStart(4)} warp ${String(c.warp).padStart(3)}  ` +
    `season ${c.season.toFixed(3)} warmth ${warmthOf(c.season).toFixed(2)}  ` +
    `planted ${String(c.planted).padStart(4)}  blooming ${String(c.blooming).padStart(4)}`);
}
const byWarp = {};
for (const c of censusCells) (byWarp[c.warp] ||= []).push(c.planted);
console.log('  planted summed per warp: ' + Object.entries(byWarp)
  .map(([w, v]) => `${w}s=${v.reduce((a, b) => a + b, 0)}`).join('  '));
