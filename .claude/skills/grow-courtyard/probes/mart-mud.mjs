/* probe: the build GATE, clause by clause. Why does a colony miss its first year in
 * most seeds — is there no mud, or is the rate too slow to use the mud there was? */
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const FILE = resolve(process.argv[2] || fileURLToPath(new URL('../../../../courtyard.html', import.meta.url)));
const SEEDS = (process.env.SEEDS || '7,42,1234,99,5,271').split(',').map(Number);
const browser = await chromium.launch();
console.log('seed  year  wet-ticks-in-season   sum(here*mud)   peak nests that year');
for (const seed of SEEDS){
  const page = await browser.newPage({ viewport: { width: 800, height: 500 } });
  await page.goto(pathToFileURL(FILE).href + `?pause&seed=${seed}&t=0`, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof window.__warp === 'function');
  const r = await page.evaluate(() => {
    window.__reseed();
    const yrs = [];
    for (let y = 0; y < 2; y++){
      let wet = 0, integ = 0, peak = 0, n = 0;
      for (let k = 0; k < 26 * 55 / 0.35; k++){
        window.__warp(0.35);
        const h = martHere();
        if (h > 0.15){ n++; const m = martMudF(); if (m > 0) wet++; integ += h * m; }
        if (martOn > peak) peak = martOn;
      }
      yrs.push([wet, +integ.toFixed(1), peak, n]);
    }
    return yrs;
  });
  r.forEach((y, i) => console.log(`${String(seed).padStart(4)}  ${i+1}     ${String(y[0]).padStart(5)} of ${y[3]}        ${String(y[1]).padStart(7)}         ${y[2]}`));
  await page.close();
}
await browser.close();
