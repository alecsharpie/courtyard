#!/usr/bin/env node
/* probe: the wind as a SCALAR. windF() used to be the day's coin (0 or 1, stepping at
 * the hour-6 roll); now it is rate-capped. Walk several seeds through many sim days,
 * sampling every 0.25 s of warped time, and print: windF's mean on windy vs calm days
 * (by windyDay(), the hash), its max slope per sim hour, how many samples sit strictly
 * between 0 and 1 (the ramps), and whether it ever lands off 0/1 once settled. Also
 * prints the first calm->windy roll it finds per seed, for the filmstrip.
 *
 *   node .claude/skills/grow-courtyard/probes/wind-year.mjs [file]
 */
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const PAGE = pathToFileURL(process.argv[2] || join(process.cwd(), 'courtyard.html')).href;

const SEEDS = [1, 7, 42, 1234];
const STEP = 0.25, DAYS = 30;
const browser = await chromium.launch();
const tot = { windy: [0, 0], calm: [0, 0], mid: 0, n: 0, slope: 0, off: 0 };
for (const seed of SEEDS) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 720 } });
  await page.goto(`${PAGE}?pause&seed=${seed}&t=0`, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof window.__warp === 'function');
  const r = await page.evaluate(({ STEP, DAYS }) => {
    window.__reseed(); window.__setTime(0);
    const o = { windy: [0, 0], calm: [0, 0], mid: 0, n: 0, slope: 0, off: 0, roll: null, ramp: [] };
    let prev = windF(), prevDay = -1, settle = 0;
    const hoursPerStep = STEP * 24 / DAY_LEN;
    for (let i = 0; i < DAYS * 55 / STEP; i++) {
      window.__warp(STEP);
      const w = windF(), wd = windyDay();
      o[wd ? 'windy' : 'calm'][0] += w; o[wd ? 'windy' : 'calm'][1]++; o.n++;
      if (w > 0 && w < 1) o.mid++;
      o.slope = Math.max(o.slope, Math.abs(w - prev) / hoursPerStep);
      if (day !== prevDay) { if (o.roll === null && prevDay >= 0 && !prevWd && wd) o.roll = { day, t: +(simT).toFixed(2) }; prevDay = day; settle = 0; }
      settle += hoursPerStep;
      const tg = typeof windTarget === 'function' ? windTarget() : (wd ? 1 : 0);   // #65: a front is the second target
      if (settle > 4 && w !== tg && (w === 0 || w === 1)) o.off++;   // 4 h past the roll a wind SITTING on an anchor must be the target's (a ramp between is a front rising or dying)
      if (o.roll && day === o.roll.day && o.ramp.length < 40 && i % 4 === 0) o.ramp.push(+w.toFixed(2));
      prev = w; var prevWd = wd;
    }
    return o;
  }, { STEP, DAYS });
  console.log(`seed ${seed}: windy-day mean ${(r.windy[0] / r.windy[1]).toFixed(3)} (${r.windy[1]} samples)  calm-day mean ${(r.calm[0] / r.calm[1]).toFixed(3)}  max slope ${r.slope.toFixed(3)}/h  mid ${r.mid}/${r.n}  off-anchor after 4h: ${r.off}  first calm->windy roll: ${JSON.stringify(r.roll)}`);
  console.log(`   ramp (every 1 s from the roll): ${r.ramp.join(' ')}`);
  for (const k of ['windy', 'calm']) { tot[k][0] += r[k][0]; tot[k][1] += r[k][1]; }
  tot.mid += r.mid; tot.n += r.n; tot.slope = Math.max(tot.slope, r.slope); tot.off += r.off;
  await page.close();
}
await browser.close();
console.log(`\nALL  windy-day mean ${(tot.windy[0] / tot.windy[1]).toFixed(3)}  calm-day mean ${(tot.calm[0] / tot.calm[1]).toFixed(3)}  max slope ${tot.slope.toFixed(3)}/h (cap ${(1 / 2.5).toFixed(3)})  ramp samples ${tot.mid}/${tot.n}  off-anchor ${tot.off}`);
