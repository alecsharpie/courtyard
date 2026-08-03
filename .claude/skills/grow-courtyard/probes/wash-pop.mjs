/* wash-pop.mjs — does any single garment ever blink out?
 *
 * The general shape here is worth reusing for any "make it a transition, not a pop"
 * brief: sample the thing's OWN alpha (or size, or position) at 1/30 s and report the
 * largest single-frame change. weather-lead.mjs measures summed alpha over a 0.5 s
 * window, which cannot tell a smooth four-garment fade from a four-garment cliff —
 * aggregate-per-sample is the wrong resolution for a pop. A fade is small deltas; a pop
 * is a delta near 1. HEAD reads 1.000 here and the fix reads 0.116.
 *
 * Needs: git show HEAD:courtyard.html > /tmp/head-courtyard.html      (written for #6)
 */
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const { chromium } = (await import(pathToFileURL(
  join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js')).href)).default;

const SEEDS = [1, 7, 11, 17, 23, 31, 42, 55, 63, 71];
const STEP = 1 / 30, SPAN = 330;       // 6 days, one frame at a time

async function sweep(page, file, seed, head){
  await page.goto(pathToFileURL(file).href + '?pause&seed=' + seed);
  await page.waitForFunction(() => typeof window.__warp === 'function');
  return page.evaluate(async ({ STEP, SPAN, head }) => {
    window.__reseed();
    let worst = { d: 0, ctx: null };
    const out = [];
    let prev = null;
    for (let t = 0; t < SPAN; t += STEP){
      window.__warp(STEP);
      // reproduce the draw's own per-garment alpha, exactly
      let a;
      if (!(day >= 3 && hash(day, 55) < 0.6)) a = null;
      else if (head){
        const on = daylight > 0.15 && !raining ? 1 : 0;
        a = new Array(10).fill(on);
      } else if (!(daylight > 0.06)) a = new Array(10).fill(0);
      else {
        const ti = Math.max(weatherComing(),
                            Math.max(0, Math.min(1, (0.34 - daylight) / 0.19)));
        a = [];
        for (const sd of [1, 2])
          for (let k = 0; k < 5; k++)
            a.push(Math.max(0, Math.min(1,
              (0.16 + hash(k + sd, day + 7) * 0.66 - ti) / 0.14)));
      }
      if (a && prev){
        for (let g = 0; g < 10; g++){
          const d = Math.abs(prev[g] - a[g]);
          if (d > worst.d) worst = { d, ctx: { t: +simT.toFixed(2), g, day,
            hour: +hour.toFixed(2), cloud: +cloud.toFixed(3),
            daylight: +daylight.toFixed(3), raining: !!raining,
            from: +prev[g].toFixed(3), to: +a[g].toFixed(3) } };
          if (d > 0.25) out.push(+simT.toFixed(2));
        }
      }
      prev = a;
    }
    return { worst, bigFrames: out.length };
  }, { STEP, SPAN, head });
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 760 } });
for (const [label, file, head] of [['HEAD', '/tmp/head-courtyard.html', true],
                                   ['WORK', process.cwd() + '/courtyard.html', false]]){
  let worst = { d: 0, ctx: null }, big = 0;
  for (const s of SEEDS){
    const r = await sweep(page, file, s, head);
    if (r.worst.d > worst.d) worst = r.worst;
    big += r.bigFrames;
  }
  console.log(`${label}: largest single-garment alpha change in ONE frame = ${worst.d.toFixed(3)}`);
  console.log(`      frames with any garment moving >0.25: ${big}`);
  console.log(`      worst context: ${JSON.stringify(worst.ctx)}`);
}
await browser.close();
