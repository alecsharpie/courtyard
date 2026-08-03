#!/usr/bin/env node
/* probe: does cloud cover actually arrive BEFORE the rain, and does it move
 * continuously rather than in steps? The census can see `raining`; it cannot see
 * whether the sky told you first. Walks several seeds through many sim days,
 * sampling every 0.5 s of warped time.
 *
 *   node probe-cloud.mjs
 */
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const PAGE = pathToFileURL(join(process.cwd(), 'courtyard.html')).href;

const SEEDS = [1, 7, 13, 29];
const STEP = 0.5;
const SPAN = 55 * 14;                       // fourteen sim days per seed

const browser = await chromium.launch();
const all = [];
for (const seed of SEEDS) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 720 } });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  await page.goto(`${PAGE}?pause&seed=${seed}`, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof window.__warp === 'function');
  const series = await page.evaluate(({ step, span }) => {
    /* A paused frame still evaluates `R() < dt * k` before comparing, so every rAF
     * delivered between load and here has burned PRNG draws — and how many arrive
     * is machine-dependent. Rewind to the seeded start or this probe is not
     * reproducible: uncontrolled, the same code gave 9, 11 and 16 rain starts. */
    window.__reseed();
    const out = [];
    for (let t = 0; t < span; t += step) {
      window.__warp(step);
      const c = window.__census().clock;
      out.push([+c.simT.toFixed(2), c.cloud, c.raining ? 1 : 0, +c.hour.toFixed(2)]);
    }
    return out;
  }, { step: STEP, span: SPAN });
  if (errs.length) { console.error(`seed ${seed}: PAGE ERRORS`, errs.slice(0, 3)); process.exitCode = 1; }
  all.push({ seed, series });
  await page.close();
}
await browser.close();

let worstRainCover = 1, maxJump = 0, rainStarts = 0, leadSum = 0, noLead = 0;
const leads = [];
const hist = new Array(10).fill(0);

for (const { seed, series } of all) {
  let prevRain = 0, prevC = series[0][1];
  for (let i = 0; i < series.length; i++) {
    const [t, c, r] = series[i];
    hist[Math.min(9, Math.floor(c * 10))]++;
    if (r) worstRainCover = Math.min(worstRainCover, c);
    maxJump = Math.max(maxJump, Math.abs(c - prevC));
    if (r && !prevRain) {                      // rising edge of rain
      rainStarts++;
      // walk back to the last sample where cover was below 0.5
      let j = i;
      while (j > 0 && series[j][1] >= 0.5) j--;
      const lead = series[j][1] < 0.5 ? t - series[j][0] : null;
      if (lead === null) noLead++; else { leads.push(lead); leadSum += lead; }
    }
    prevRain = r; prevC = c;
  }
}

const cov = all.flatMap(a => a.series.map(s => s[1]));
const mean = cov.reduce((a, b) => a + b, 0) / cov.length;
leads.sort((a, b) => a - b);

console.log(`seeds ${SEEDS.join(',')} · ${SPAN}s each · ${cov.length} samples\n`);
console.log(`cover: mean ${mean.toFixed(3)}  min ${Math.min(...cov).toFixed(3)}  max ${Math.max(...cov).toFixed(3)}`);
console.log('histogram ' + hist.map((n, i) => `${(i / 10).toFixed(1)}:${n}`).join(' '));
console.log(`\nrain starts: ${rainStarts}`);
console.log(`lowest cover observed while raining: ${worstRainCover.toFixed(3)}   (must be > 0.6)`);
console.log(`largest cover change in one ${STEP}s sample: ${maxJump.toFixed(4)}   (rate cap => <= 0.013)`);
if (leads.length) {
  console.log(`lead time 0.5 -> first drop: median ${leads[leads.length >> 1].toFixed(1)}s  ` +
    `min ${leads[0].toFixed(1)}s  max ${leads[leads.length - 1].toFixed(1)}s  mean ${(leadSum / leads.length).toFixed(1)}s`);
  console.log(`  (a day is 55s, so ${(leads[leads.length >> 1] / 55).toFixed(2)} days of warning)`);
}
if (noLead) console.log(`rain starts with no observed sub-0.5 crossing in window: ${noLead}`);

const fails = [];
if (worstRainCover <= 0.6) fails.push(`cloudless rain: cover ${worstRainCover.toFixed(3)}`);
if (maxJump > 0.014) fails.push(`step change in cover: ${maxJump.toFixed(4)}`);
if (rainStarts === 0) fails.push('rain never started — the gate is too tight');
if (mean > 0.75 || mean < 0.15) fails.push(`cover stuck: mean ${mean.toFixed(3)}`);
if (leads.length && leads[0] < 5) fails.push(`rain arrived only ${leads[0].toFixed(1)}s after cover built`);
console.log('\n' + (fails.length ? 'FAIL: ' + fails.join(' · ') : 'PASS'));
process.exitCode = fails.length ? 1 : (process.exitCode || 0);
