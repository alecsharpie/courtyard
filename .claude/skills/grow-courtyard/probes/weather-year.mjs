#!/usr/bin/env node
/* probe: what does a YEAR of weather look like, and is the total rain still HEAD's?
 *
 *   node probe-weather-year.mjs [file …]        (default: HEAD snapshot + working copy)
 *
 * The census sees `raining` and `cloud` at one instant. The question b20 asks is a
 * distribution over the year — is winter grey more of the time, does summer break
 * into rarer heavier showers, and did the annual rain total move? So this folds
 * several seeds x several years into four season buckets and reports the shape.
 *
 * Season phase: 0 = midwinter, 0.25 = SEASON_START (spring), 0.5 = midsummer.
 * Buckets are the quarters centred on those, so "winter" is the wrap-around one.
 *
 * Reproducibility rules from LAWS: reseed before measuring, step inside ONE
 * page.evaluate, fresh page per seed. A paused page still burns PRNG draws on every
 * rAF between load and the first call, and how many arrive is machine-dependent.
 */
import { homedir } from 'node:os';
import { resolve, join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const REPO = fileURLToPath(new URL('../../../../', import.meta.url));

const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;

const FILES = process.argv.length > 2
  ? process.argv.slice(2)
  : ['/tmp/courtyard-head.html', join(REPO, 'courtyard.html')];   // HEAD snapshot vs working copy

const SEEDS = (process.env.WY_SEEDS || '1,7,13,29,42').split(',').map(Number);
const STEP = 0.5;                 // sim seconds per sample
const DAY_LEN = 55, SEASON_LEN = 26;
const YEARS = +(process.env.WY_YEARS || 2);
const SPAN = DAY_LEN * SEASON_LEN * YEARS;

const BUCKETS = ['winter', 'spring', 'summer', 'autumn'];
const bucketOf = p => BUCKETS[Math.floor(((p + 0.125) % 1) * 4)];

const browser = await chromium.launch();

async function measure(file) {
  const rows = [];
  for (const seed of SEEDS) {
    const page = await browser.newPage({ viewport: { width: 1200, height: 720 } });
    const errs = [];
    page.on('pageerror', e => errs.push(String(e)));
    await page.goto(pathToFileURL(resolve(file)).href + `?pause&seed=${seed}`, { waitUntil: 'load' });
    await page.waitForFunction(() => typeof window.__warp === 'function');
    const series = await page.evaluate(({ step, span }) => {
      window.__reseed();
      const out = [];
      for (let t = 0; t < span; t += step) {
        window.__warp(step);
        const c = window.__census();
        out.push([c.clock.season, c.clock.cloud, c.clock.raining ? 1 : 0,
                  // `daylight` is a top-level `let` in a classic script, so it is a
                  // global lexical binding this evaluate() can read without a new hook
                  c.life.raindrops, +daylight.toFixed(3), +weatherComing().toFixed(3)]);
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
  const B = {}; for (const b of BUCKETS) B[b] = { n: 0, cover: 0, overcast: 0, wet: 0, starts: 0, darkStarts: 0, dropSum: 0, dropN: 0, lit: 0, brolly: 0 };
  const showers = [];                       // {bucket, len, peakDrops}
  let total = { n: 0, wet: 0, starts: 0, darkStarts: 0 };
  for (const { series } of rows) {
    let wasRain = 0, runLen = 0, runPeak = 0, runBucket = null;
    for (const [phase, cloud, rain, drops, dl, wc] of series) {
      const b = B[bucketOf(phase)];
      b.n++; total.n++;
      b.cover += cloud;
      if (cloud > 0.66) b.overcast++;
      /* The false promise: daylight hours in which weatherComing() is over the FLOOR of
       * the umbrella band (0.62 + wary*0.55) and it is not in fact raining. Cover has
       * risen in winter, so this is the side effect worth pricing — not a defect on its
       * own, but the number that says whether the town now waits for weather all winter. */
      if (dl > 0.15) { b.lit++; if (!rain && wc > 0.62) b.brolly++; }
      if (rain) { b.wet++; total.wet++; b.dropSum += drops; b.dropN++; }
      if (rain && !wasRain) {
        b.starts++; total.starts++;
        if (dl <= 0.15) { b.darkStarts++; total.darkStarts++; }
        runLen = 0; runPeak = 0; runBucket = bucketOf(phase);
      }
      if (rain) { runLen += STEP; runPeak = Math.max(runPeak, drops); }
      if (!rain && wasRain) { showers.push({ bucket: runBucket, len: runLen, peak: runPeak }); }
      wasRain = rain;
    }
  }
  return { B, showers, total };
}

const pct = x => (100 * x).toFixed(1).padStart(6);
const results = {};
for (const file of FILES) {
  console.log(`\n=== ${file} — ${SEEDS.length} seeds x ${YEARS} years, ${STEP}s samples ===`);
  const { B, showers, total } = fold(await measure(file));
  results[file] = { B, showers, total };
  console.log('  bucket     cover%  overcast%   wet%   showers  mean-len  mean-drops  brolly%');
  for (const k of BUCKETS) {
    const b = B[k];
    const sh = showers.filter(s => s.bucket === k);
    const len = sh.length ? (sh.reduce((a, s) => a + s.len, 0) / sh.length).toFixed(1) : '   –';
    const dr = b.dropN ? (b.dropSum / b.dropN).toFixed(0) : '  –';
    console.log(`  ${k.padEnd(9)}${pct(b.cover / b.n)}   ${pct(b.overcast / b.n)} ${pct(b.wet / b.n)}  ${String(b.starts).padStart(6)}  ${String(len).padStart(7)}  ${String(dr).padStart(9)} ${pct(b.brolly / (b.lit || 1))}`);
  }
  const peaks = showers.map(s => s.peak).sort((a, b) => a - b);
  console.log(`  ANNUAL     wet ${pct(total.wet / total.n)}%   showers ${total.starts}` +
              `   started in the dark ${total.darkStarts} (${(100 * total.darkStarts / (total.starts || 1)).toFixed(0)}%)` +
              `   median peak drops ${peaks.length ? peaks[peaks.length >> 1] : '–'}`);
}

if (FILES.length === 2) {
  const [a, b] = FILES.map(f => results[f]);
  const wa = a.total.wet / a.total.n, wb = b.total.wet / b.total.n;
  console.log(`\n  RAIN TOTAL: ${(100 * wa).toFixed(2)}% -> ${(100 * wb).toFixed(2)}%  (${((wb / wa - 1) * 100).toFixed(1)}%)`);
  const ov = k => [a.B[k].overcast / a.B[k].n, b.B[k].overcast / b.B[k].n];
  for (const k of BUCKETS) { const [x, y] = ov(k); console.log(`  overcast ${k.padEnd(7)} ${(100 * x).toFixed(1)}% -> ${(100 * y).toFixed(1)}%`); }
}

await browser.close();
