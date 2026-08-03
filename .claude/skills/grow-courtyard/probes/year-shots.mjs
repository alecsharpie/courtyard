#!/usr/bin/env node
/* probe: the standard shoot.mjs framing runs with `&fast` and a fixed wall-clock
 * wait, so its sim instant jitters by ~15 s of sim time between runs — fine as a
 * "does it still draw" check, useless for comparing two builds. This pins the
 * instant with ?pause + __warp(), so HEAD and HERE are photographed at the SAME
 * moment of the same seeded world.
 *
 * It shoots two sets:
 *   regression — the same instants on both files, to spot anything I did not mean
 *   year       — midsummer noon vs midwinter noon, the brief's success criterion
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
const FILES = { head: '/tmp/courtyard-head.html', here: join(REPO, 'courtyard.html') };

// noon of a given day = day*55 + 13.75 (hour = 6 + p*24)
const noon = d => d * 55 + 13.75;
// SEASON_LEN 26 d, phase starts at 0.25 -> midsummer (phase .50) at day 6, midwinter (phase ~1) at day 19
const SHOTS = [
  { name: 'mid-morning', t: 4 * 55 + 10 },     // what shoot.mjs was aiming at
  { name: 'summer-noon', t: noon(6) },
  { name: 'winter-noon', t: noon(19) },
  { name: 'summer-dusk', t: 6 * 55 + 33 },
  { name: 'winter-dusk', t: 19 * 55 + 33 },
];

const browser = await chromium.launch();
for (const [label, file] of Object.entries(FILES)) {
  const url = pathToFileURL(file).href;
  for (const s of SHOTS) {
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 2 });
    const errs = [];
    page.on('pageerror', e => errs.push(String(e)));
    await page.goto(`${url}?pause&seed=42&t=0`, { waitUntil: 'load' });
    await page.waitForFunction(() => typeof window.__warp === 'function');
    const info = await page.evaluate(t => {
      window.__reseed(); window.__warp(t);
      const c = window.__census();
      return { hour: +c.clock.hour.toFixed(2), season: c.clock.season ?? -1,
               people: c.life.people, cloud: c.clock.cloud };
    }, s.t);
    await page.waitForTimeout(700);            // let the paused rAF paint the warped state
    await page.screenshot({ path: join(OUT, `yr-${s.name}-${label}.png`) });
    console.log(`${label.padEnd(5)} ${s.name.padEnd(12)} t=${String(s.t).padStart(6)}  hour ${String(info.hour).padStart(5)}` +
                `  season ${info.season < 0 ? ' -  ' : info.season.toFixed(3)}  people ${String(info.people).padStart(3)}` +
                `  cloud ${info.cloud.toFixed(2)}${errs.length ? '  PAGE ERROR ' + errs[0] : ''}`);
    if (errs.length) process.exitCode = 1;
    await page.close();
  }
}
await browser.close();
