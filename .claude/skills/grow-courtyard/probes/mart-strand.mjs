/* probe: the strand's own year — bankDry (stepBank's uncovered river bed) by season decile,
 * against martHere(). The evidence MART_STRAND/MART_STRAND_K were sized on (#202): the strand
 * is 0 cells until phase 0.40, 43 at midsummer, gone by 0.72, and it is the SAME in every
 * seed — riverLev() is the calendar, not the weather. */
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const FILE = resolve(process.argv[2] || fileURLToPath(new URL('../../../../courtyard.html', import.meta.url)));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 800, height: 500 } });
await page.goto(pathToFileURL(FILE).href + `?pause&seed=7&t=0`, { waitUntil: 'load' });
await page.waitForFunction(() => typeof window.__warp === 'function');
const r = await page.evaluate(() => {
  window.__reseed();
  const bins = Array.from({length: 20}, () => ({n:0, dry:0, h:0, min:1e9, max:-1}));
  for (let k = 0; k < 26 * 55 / 0.35; k++){
    window.__warp(0.35);
    const p = seasonPhase, b = Math.min(19, (p * 20) | 0), B = bins[b];
    B.n++; B.dry += bankDry; B.h += martHere();
    if (bankDry < B.min) B.min = bankDry; if (bankDry > B.max) B.max = bankDry;
  }
  return bins.map((B, i) => [ (i/20).toFixed(2), B.n, +(B.dry/B.n).toFixed(1), B.min, B.max, +(B.h/B.n).toFixed(2) ]);
});
console.log('phase  ticks  meanShoal  min  max  meanHere');
r.forEach(x => console.log(x.map(String).map(s=>s.padStart(6)).join(' ')));
await page.close(); await browser.close();
