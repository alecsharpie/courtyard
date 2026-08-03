#!/usr/bin/env node
/* b20's success criterion: a pinned January afternoon and a pinned July afternoon on
 * the same seed must be obviously different skies.
 *
 * Not the same thing as `year-shots.mjs`, which pins summer/winter NOON on two files
 * to diff a build against HEAD. This one holds one file, sweeps SEEDS, and prints the
 * sky state (cover, raining, drops) at each — because a single instant of a stochastic
 * sky is a sample, not a result, and one cherry-picked pair proves nothing.
 *
 * The instant has to be pinned as a PHASE AND an hour, and the weather at it is the
 * product of the whole seeded history — so `?t=` is no good (it moves the clock but
 * leaves cover at its initial 0.16). Every shot warps from zero at a pinned seed.
 *
 * hour 14.00 => simT % 55 == 18.333.  Midwinter (phase ~0) is day 19, midsummer
 * (phase ~0.5) day 6, so both land on the same hour of a comparable day.
 */
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;

const REPO = fileURLToPath(new URL('../../../../', import.meta.url));
const OUT = join(REPO, 'shots');
mkdirSync(OUT, { recursive: true });
const FILE = process.argv[2] || join(REPO, 'courtyard.html');
const TAG = process.argv[3] || 'here';
const SEEDS = (process.argv[4] || '7,42,1234').split(',').map(Number);

const AFTERNOON = 18.3333;
const WHEN = [
  { name: 'jan', t: 19 * 55 + AFTERNOON },     // phase ~0.99 — midwinter
  { name: 'jul', t: 6 * 55 + AFTERNOON },      // phase ~0.49 — midsummer
];

const browser = await chromium.launch();
for (const seed of SEEDS) {
  for (const w of WHEN) {
    const p = await browser.newPage({ viewport: { width: 1600, height: 950 } });
    p.on('pageerror', e => console.log('PAGE ERROR', e.message));
    await p.goto(pathToFileURL(FILE).href + `?seed=${seed}&t=0&pause`);
    await p.waitForFunction(() => window.__warp);
    const info = await p.evaluate(t => {
      window.__reseed();
      window.__warp(t);
      const c = window.__census().clock;
      return { hour: c.hour, season: c.season, cloud: c.cloud, raining: c.raining,
               drops: window.__census().life.raindrops, people: c.day };
    }, w.t);
    await p.waitForTimeout(120);              // let one rAF draw the warped state
    await p.screenshot({ path: join(OUT, `sky-${TAG}-${w.name}-${seed}.png`) });
    await p.close();
    console.log(`${TAG} ${w.name} seed ${seed}: phase ${info.season.toFixed(3)} hour ${info.hour.toFixed(2)}` +
                `  cover ${info.cloud.toFixed(2)}${info.raining ? `  RAINING (${info.drops} drops)` : ''}`);
  }
}
await browser.close();
