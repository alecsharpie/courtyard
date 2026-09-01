#!/usr/bin/env node
/* probe: does the plaza's moss trace the YEAR, and do feet keep the walked lines clean?
 * The census's `mossy` is one number; this asks whether the number is a curve with a wet
 * shoulder and a summer trough, and whether the cells it lives in are the SHELTERED ones
 * rather than the roundel. Draw-only otherwise invisible.
 *   node probe-moss-year.mjs [pathToHtml] [label]
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
const DAY = 55, DAYS = +(process.env.DAYS || 52);      // two seasonal years

const browser = await chromium.launch();
const runs = [];
for (const seed of SEEDS) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 720 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(`${PAGE}?pause&seed=${seed}&t=0`, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof window.__warp === 'function');
  const series = await page.evaluate(({ step, n }) => {
    window.__reseed();
    const out = [];
    for (let i = 0; i < n; i++) {
      window.__warp(step);
      // read the plaza directly: total moss, mossy cells, and the split by shelter
      const r = (() => {
        let sum = 0, cells = 0, mossy = 0, shelSum = 0, shelN = 0, openSum = 0, openN = 0, mx = 0;
        for (let y = 3; y < 61; y++) for (let x = PLAZA_X0; x < PLAZA_X1; x++) {
          const i = y * GW + x;
          if (grid[i] !== PATH) continue;
          cells++; sum += moss[i]; if (moss[i] > 1 / MOSS_BUCKET) mossy++;
          if (moss[i] > mx) mx = moss[i];
          if (mossShel[i] > 0.35) { shelSum += moss[i]; shelN++; } else { openSum += moss[i]; openN++; }
        }
        return { sum, cells, mossy, shel: shelN ? shelSum / shelN : 0, open: openN ? openSum / openN : 0, mx };
      })();
      out.push([+__census().clock.simT.toFixed(1), +warmth.toFixed(3), +wetF().toFixed(3),
                +mossGrowF().toFixed(3), +mossDieF().toFixed(3),
                r.mossy, +(r.sum / r.cells).toFixed(4), +r.shel.toFixed(4), +r.open.toFixed(4), +r.mx.toFixed(3), r.cells]);
    }
    return out;
  }, { step: DAY / 2, n: DAYS * 2 });
  runs.push({ seed, series, errs });
  await page.close();
}
await browser.close();

console.log(`=== ${LABEL}: plaza moss over ${DAYS} days x ${SEEDS.length} seeds ===`);
const r0 = runs[0];
console.log(`plaza PATH cells: ${r0.series[0][10]}`);
console.log('  simT  warmth   wet  grow   die | mossy  mean  sheltered   open   max   ' + '(seed ' + r0.seed + ')');
for (const s of r0.series.filter((_, i) => i % 2 === 0))
  console.log('  ' + String(s[0]).padStart(5) + '  ' + String(s[1]).padStart(5) + '  ' + String(s[2]).padStart(5)
    + '  ' + String(s[3]).padStart(4) + '  ' + String(s[4]).padStart(4) + ' |'
    + String(s[5]).padStart(5) + String(s[6]).padStart(7) + String(s[7]).padStart(9) + String(s[8]).padStart(8) + String(s[9]).padStart(7));

for (const { seed, series, errs } of runs) {
  const mo = series.map(s => s[5]);
  const yr = series.slice(series.length / 2);            // second year: past the seeded start
  const peak = yr.reduce((a, b) => b[5] > a[5] ? b : a), trough = yr.reduce((a, b) => b[5] < a[5] ? b : a);
  console.log(`seed ${seed}: mossy ${Math.min(...mo)}..${Math.max(...mo)}  `
    + `yr2 peak ${peak[5]} @warmth ${peak[1]} · trough ${trough[5]} @warmth ${trough[1]}  `
    + `sheltered/open mean ${(yr.reduce((a,b)=>a+b[7],0)/yr.length).toFixed(3)}/${(yr.reduce((a,b)=>a+b[8],0)/yr.length).toFixed(3)}`
    + (errs.length ? '  ERRORS ' + errs[0] : ''));
}
