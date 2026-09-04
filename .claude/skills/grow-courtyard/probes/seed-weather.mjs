#!/usr/bin/env node
/* seed-weather.mjs — which SEED is wet at seed-identity's pinned instants? (#187, c266)
 *
 *   node .claude/skills/grow-courtyard/probes/seed-weather.mjs 1,2,3,42,99,1234
 *
 * probes/seed-identity.mjs excludes `life.raindrops` by name, and that exemption is only
 * EARNED while the pinned instants actually rain — a dry run tests the exclusion against
 * nothing. Showers are rare and the world drifts under a pin, so the seed has to be
 * chosen FOR its weather and re-chosen when it stops raining. This is how.
 *
 * Measured 2026-09-04 over seeds 1..12, 42, 99, 1234 at simT 125/128/200/415/700: seed 42
 * is 0 of 5 (it was 2 of 5 at #175 — the drift c266 predicted), 8 and 1234 are 1 of 5, and
 * seed 99 is 3 of 5 including 125 and 128, the two instants written for the recycle branch.
 * Hence seed-identity's default `--seed 42,99`.
 */
import { homedir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const PAGE = pathToFileURL(join(REPO, 'courtyard.html')).href;
const INSTANTS = [125, 128, 200, 415, 700];
const SEEDS = (process.argv[2] || '1,2,3,4,5,6,7,8,9,10,11,12,42,99,1234').split(',').map(Number);
const b = await chromium.launch();
console.log(' seed  ' + INSTANTS.map(t => String(t).padStart(12)).join('') + '   wet  drops');
for (const seed of SEEDS){
  const p = await b.newPage();
  await p.goto(`${PAGE}?seed=${seed}&t=0&pause`);
  await p.waitForTimeout(200);
  const rows = await p.evaluate((INSTANTS) => {
    window.__reseed(); window.__setTime(0);
    const out = []; let at = 0;
    for (const t of INSTANTS){ window.__warp(t - at, 1/30); at = t;
      const c = window.__census();
      out.push({ raining: !!c.clock.raining, cloud: c.clock.cloud, drops: c.life.raindrops }); }
    return out;
  }, INSTANTS);
  const wet = rows.filter(r => r.raining).length;
  console.log(String(seed).padStart(5) + '  ' + rows.map(r => `${r.raining?'RAIN':'    '} ${r.cloud.toFixed(3)}`.padStart(12)).join('') +
              `  ${wet}/5  ${rows.reduce((a,r)=>a+r.drops,0)}`);
  await p.close();
}
await b.close();
