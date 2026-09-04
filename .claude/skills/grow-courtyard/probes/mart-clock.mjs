/* probe: the martins' CALENDAR, per world. The strand (bankDry, off riverLev()) is the
 * colony's second mud source (#202), and riverLev() is a pure cosine of season() — so on
 * HEAD the strand's year is bit-identical in every seed and a rainless colony founds on
 * the same day everywhere. Measures, per seed and per year: the day the strand opens, the
 * day it peaks, the day the first nest SETS, and the year's peak/mean colony.
 *
 * Measured 12 seeds x 2 years, #215: on HEAD strandOn was 0.4190 in ALL 24 (sd 0.0000) and
 * every rainless colony set its first nest inside 0.0026 of a year of the others. With
 * RIVER_SALT: strandOn sd 0.0102 over 0.4015..0.4374, the strand-led foundings 4x wider,
 * the found histogram the same shape, colony 75.9+-7.9 -> 78.0 peak. Run it against
 * /tmp/cy-head.html (git show HEAD:courtyard.html) for the control. */
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const FILE = resolve(process.argv[2] || fileURLToPath(new URL('../../../../courtyard.html', import.meta.url)));
const SEEDS = (process.env.SEEDS || '7,42,1234,99,5,271').split(',').map(Number);
const YEARS = +(process.env.YEARS || 3);
const browser = await chromium.launch();
const rows = [];
for (const seed of SEEDS){
  const page = await browser.newPage({ viewport: { width: 800, height: 500 } });
  await page.goto(pathToFileURL(FILE).href + `?pause&seed=${seed}&t=0`, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof window.__warp === 'function');
  const r = await page.evaluate((YEARS) => {
    window.__reseed();
    const out = [];
    for (let y = 0; y < YEARS; y++){
      let strandOn = null, strandPk = null, pkDry = -1, found = null, peak = 0, sum = 0, n = 0, wet = 0, hn = 0;
      for (let k = 0; k < 26 * 55 / 0.35; k++){
        window.__warp(0.35);
        const p = seasonPhase;
        if (strandOn === null && bankDry >= 5) strandOn = p;
        if (bankDry > pkDry){ pkDry = bankDry; strandPk = p; }
        if (found === null && martOn >= 1) found = p;
        if (martOn > peak) peak = martOn;
        const h = martHere();
        if (h > 0.15){ hn++; if (wetF() / 0.30 >= martStrandF()) wet++; }
        sum += martOn; n++;
      }
      out.push({ strandOn, strandPk, pkDry, found, peak, mean: sum / n, rainLed: wet / hn });
    }
    return out;
  }, YEARS);
  r.forEach((y, i) => rows.push({ seed, yr: i + 1, ...y }));
  await page.close();
}
await browser.close();
const f = v => v === null ? '  --  ' : v.toFixed(4);
console.log('seed   yr  strandOpen  strandPeak  pkDry   foundPhase  peak  meanNests  rainLed');
for (const r of rows)
  console.log(`${String(r.seed).padStart(4)}  ${r.yr}   ${f(r.strandOn)}      ${f(r.strandPk)}   ${String(r.pkDry).padStart(3)}    ${f(r.found)}     ${String(r.peak).padStart(3)}   ${r.mean.toFixed(2).padStart(6)}    ${r.rainLed.toFixed(2)}`);
const u = k => [...new Set(rows.filter(r => r[k] !== null).map(r => r[k].toFixed(4)))];
for (const k of ['strandOn', 'strandPk', 'found']){
  const vals = rows.filter(r => r[k] !== null).map(r => r[k]);
  const m = vals.reduce((a, b) => a + b, 0) / vals.length;
  const sd = Math.sqrt(vals.reduce((a, b) => a + (b - m) ** 2, 0) / vals.length);
  console.log(`${k.padEnd(9)} distinct=${u(k).length}/${vals.length}  mean=${m.toFixed(4)}  sd=${sd.toFixed(4)}  range=${Math.min(...vals).toFixed(4)}..${Math.max(...vals).toFixed(4)}`);
}
const pk = rows.map(r => r.peak), mn = rows.map(r => r.mean);
const av = a => a.reduce((x, y) => x + y, 0) / a.length;
console.log(`colony    meanPeak=${av(pk).toFixed(2)}  meanNests=${av(mn).toFixed(3)}  nFound=${rows.filter(r => r.found !== null).length}/${rows.length}`);
