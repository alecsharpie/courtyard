#!/usr/bin/env node
/* probe: does the year actually turn, does anything STEP as it turns, and what does
 * it cost the population at the bottom of it?
 *
 * The census samples nine instants. Population swings by a factor of ten over a
 * single day, so nine instants cannot tell a seasonal trough from a rainy Tuesday.
 * This walks a whole year at several seeds and reports the DAILY MEAN population,
 * against the same walk on HEAD.
 *
 *   node probe-season.mjs [pathToHtml] [label]
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
const DAY = 55, YEAR_DAYS = +(process.env.DAYS || 30);
const STEP = DAY / 20;                   // 20 samples a day

const browser = await chromium.launch();
const runs = [];
for (const seed of SEEDS) {
  // fresh page per measurement: __reseed() does not rewind module-level latches
  const page = await browser.newPage({ viewport: { width: 1200, height: 720 } });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  await page.goto(`${PAGE}?pause&seed=${seed}&t=0`, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof window.__warp === 'function');
  // ALL stepping inside one evaluate — the page keeps running between round-trips
  const series = await page.evaluate(({ step, n }) => {
    window.__reseed();
    const out = [];
    for (let i = 0; i < n; i++) {
      window.__warp(step);
      const c = window.__census();
      out.push([c.clock.simT, c.clock.season ?? -1, c.clock.hour,
                c.life.people, c.clock.raining ? 1 : 0,
                // the three arrival sources have separate budgets, so they are
                // allowed to breathe by different amounts — report them apart
                c.life.inCourtyard, c.life.onStreet - c.life.inEast, c.life.inEast]);
    }
    return out;
  }, { step: STEP, n: Math.round(YEAR_DAYS * DAY / STEP) });
  if (errs.length) { console.error(`seed ${seed}: PAGE ERROR`, errs[0]); process.exitCode = 1; }
  runs.push({ seed, series });
  await page.close();
}
await browser.close();

/* --- 1. continuity: the largest single-sample move in any seasoned quantity --- */
let maxDS = 0, maxDSat = null;
for (const { seed, series } of runs) {
  for (let i = 1; i < series.length; i++) {
    const a = series[i - 1][1], b = series[i][1];
    if (a < 0) continue;
    let d = Math.abs(b - a);
    if (d > 0.5) d = Math.abs(d - 1);            // the once-a-year phase wrap, not a step
    if (d > maxDS) { maxDS = d; maxDSat = `seed ${seed} @ t=${series[i][0].toFixed(1)}`; }
  }
}

/* --- 2. population by day of the year --- */
const byDay = new Map();
for (const { series } of runs) {
  for (const [t, s, , people] of series) {
    const d = Math.floor(t / DAY);
    if (!byDay.has(d)) byDay.set(d, { people: [], season: s });
    byDay.get(d).people.push(people);
  }
}
const days = [...byDay.keys()].sort((a, b) => a - b);
const rows = days.map(d => {
  const v = byDay.get(d);
  return { day: d, season: v.season, mean: v.people.reduce((a, b) => a + b, 0) / v.people.length,
           min: Math.min(...v.people) };
});

/* maturity() pins at day 8, so days 0-7 are the growth ramp, not the year.
   Judge the season on the days where growth is finished and only season moves. */
const settled = rows.filter(r => r.day >= 8);
const mean = settled.reduce((a, r) => a + r.mean, 0) / settled.length;
const trough = settled.reduce((a, r) => r.mean < a.mean ? r : a);
const peak = settled.reduce((a, r) => r.mean > a.mean ? r : a);
const floor = Math.min(...settled.map(r => r.min));

console.log(`\n=== ${LABEL}  (${FILE})`);
console.log(`seeds ${SEEDS.join(',')} · ${YEAR_DAYS} sim days · ${runs[0].series.length} samples/seed`);
console.log(`largest single-sample move in season(): ${maxDS.toExponential(2)}  ${maxDSat || '(no season field)'}`);
if (process.env.PERDAY) {
  console.log(`\n day  season   mean pop   min`);
  for (const r of rows) {
    const bar = '#'.repeat(Math.round(r.mean / 1.5));
    console.log(`  ${String(r.day).padStart(2)}  ${r.season < 0 ? '  -  ' : r.season.toFixed(3)}` +
                `   ${r.mean.toFixed(1).padStart(6)}  ${String(r.min).padStart(4)}  ${bar}`);
  }
}

/* Weather and market day swamp the season over a single year, so fold several years
   onto one and bin by phase. Only then is the seasonal term separable from the noise. */
const BINS = 8, bins = Array.from({ length: BINS }, () => []);
for (const { series } of runs) {
  for (const [t, s, , people, , court, lane, east] of series) {
    if (t < 8 * DAY || s < 0) continue;
    bins[Math.min(BINS - 1, Math.floor(s * BINS))].push([people, court, lane, east]);
  }
}
const col = (b, k) => b.reduce((a, c) => a + c[k], 0) / b.length;
if (bins.some(b => b.length)) {
  const NAME = ['midwinter', 'late winter', 'spring', 'late spring',
                'midsummer', 'late summer', 'autumn', 'early winter'];
  console.log(`\nfolded onto one year, ${BINS} bins by season phase (day>=8 only):`);
  console.log(` phase        season        n   mean pop   court   lane   east`);
  for (let i = 0; i < BINS; i++) {
    const b = bins[i];
    if (!b.length) continue;
    const m = col(b, 0);
    console.log(`  ${(i / BINS).toFixed(3)}-${((i + 1) / BINS).toFixed(3)}  ${NAME[i].padEnd(12)} ${String(b.length).padStart(4)}` +
                `   ${m.toFixed(2).padStart(6)}  ${col(b, 1).toFixed(2).padStart(6)} ${col(b, 2).toFixed(2).padStart(6)} ` +
                `${col(b, 3).toFixed(2).padStart(6)}  ${'#'.repeat(Math.round(m * 2))}`);
  }
  /* The headline the brief is judged on. Midwinter and midsummer are the two bins
     centred on the extremes of the year; everything between them is a phase lag. */
  const w = bins[0], s = bins[4];
  if (w.length && s.length) {
    console.log(`\nsummer:winter ratio (bin 4 / bin 0)`);
    for (const [k, name] of [[0, 'total'], [1, 'courtyard'], [2, 'lane'], [3, 'east']]) {
      const a = col(w, k), b = col(s, k);
      console.log(`  ${name.padEnd(10)} ${a.toFixed(2).padStart(6)} -> ${b.toFixed(2).padStart(6)}   x${(b / (a || 1)).toFixed(2)}`);
    }
  }
}
console.log(`\nsettled (day>=8): mean ${mean.toFixed(2)}`);
console.log(`  PEAK   day ${peak.day} (season ${peak.season.toFixed(3)}) mean ${peak.mean.toFixed(2)}`);
console.log(`  TROUGH day ${trough.day} (season ${trough.season.toFixed(3)}) mean ${trough.mean.toFixed(2)}`);
console.log(`  absolute floor across every sample: ${floor} people`);
