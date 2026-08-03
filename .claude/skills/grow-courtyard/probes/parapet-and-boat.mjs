#!/usr/bin/env node
/* probes/parapet-and-boat.mjs — does anybody actually stop on the bridge, and does anybody
 * actually look at the boat?
 *
 * Both are invisible to the census (an agent kind and a transient head angle) and
 * a screenshot can only ever say "not in this frame". So: warp a pinned world
 * forward in fixed steps and count, off `__entities()`, which now carries each
 * person's `role`, `act` and `watch` alongside their position.
 *
 *   occupancy  — share of daylight samples with somebody stood at the parapet
 *   glances    — how many people turned their head per boat that went down the river
 *   hold       — the longest single watch, which must stay an event (< ~2 s)
 */
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;

const html = readFileSync(new URL('../../../../courtyard.html', import.meta.url));
const srv = createServer((_, res) => { res.writeHead(200, {'Content-Type':'text/html'}); res.end(html); }).listen(0);
const port = srv.address().port;

const SEEDS = [42, 7, 13, 99];
const STEP = 0.25, SPAN = 55 * 12;      // twelve days per seed

const browser = await chromium.launch();
let occ = 0, samples = 0, boats = 0, glances = 0, maxHold = 0, quayGlances = 0;

for (const seed of SEEDS){
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${port}/?seed=${seed}&pause`);
  await page.waitForFunction(() => typeof window.__warp === 'function');
  const r = await page.evaluate(({ STEP, SPAN }) => {
    __reseed();                                  // a paused frame still burns PRNG draws
    let occ = 0, n = 0, quay = 0;
    const boatIds = new Set(), held = new Map();
    for (let t = 0; t < SPAN; t += STEP){
      __warp(STEP);
      const hour = __census().clock.hour;
      const ents = __entities();
      const day = hour > 7 && hour < 19;
      if (day){ n++; if (ents.some(e => e.role === 'parapet' && e.act === 'stand')) occ++; }
      for (const e of ents){
        if (e.kind === 'boat') boatIds.add(e.id);
        if (e.watch){
          held.set(e.id, (held.get(e.id) || 0) + STEP);
          if (e.x < 114) quay++;                  // watching from our side of the water
        }
      }
    }
    let hold = 0;
    for (const v of held.values()) hold = Math.max(hold, v);
    return { occ, n, boats: boatIds.size, glances: held.size, hold, quay };
  }, { STEP, SPAN });
  occ += r.occ; samples += r.n; boats += r.boats; glances += r.glances;
  quayGlances += r.quay > 0 ? 1 : 0;
  maxHold = Math.max(maxHold, r.hold);
  console.log(`seed ${String(seed).padStart(3)}  parapet occupied ${(100 * r.occ / r.n).toFixed(1)}% of daylight` +
              `   boats ${r.boats}   glances ${r.glances}   longest ${r.hold.toFixed(2)}s`);
  await page.close();
}

console.log('-'.repeat(70));
console.log(`parapet occupied      ${(100 * occ / samples).toFixed(1)}% of daylight samples`);
console.log(`boats down the river  ${boats}`);
console.log(`glances at the boat   ${glances}   (${(glances / boats).toFixed(1)} per boat)`);
console.log(`longest single watch  ${maxHold.toFixed(2)} s   (an event only while < ~2 s)`);

await browser.close();
srv.close();
