#!/usr/bin/env node
/* probe-gard-presence — b157: a gardener AT THE BEDS, sampled per sim second over a
 * growing season. Visits are inflow; what the courtyard shows is presence.
 *   node probe-gard-presence.mjs [file] [--seeds 6]
 */
import { homedir } from 'node:os'; import { resolve, join, dirname } from 'node:path'; import { pathToFileURL, fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const arg = (n, d) => { const i = process.argv.indexOf(n); return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const file = process.argv[2] && !process.argv[2].startsWith('--') ? resolve(process.argv[2]) : resolve(HERE, '../../../../courtyard.html');
const SEEDS = [3, 7, 11, 19, 23, 29, 42, 51].slice(0, +arg('--seeds', 6));
const b = await chromium.launch(); const all = [];
for (const seed of SEEDS){
  const p = await b.newPage({ viewport:{width:1200, height:720} });
  p.on('pageerror', e => console.log('PAGE ERROR', e.message));
  await p.goto(pathToFileURL(file).href + `?pause&seed=${seed}`);
  await p.waitForFunction(() => window.__warp);
  all.push(...JSON.parse(await p.evaluate(new Function(`
    window.__reseed(); window.__setTime(55);
    const s = [];
    for (let i = 0; i < 4000 && day < 14; i++){
      window.__warp(0.5);
      const g = agents.filter(a => a.kind === 'gardener');
      s.push({ h:+hour.toFixed(2), n:g.length,
               at:g.filter(a => a.state === 'kneel').length,
               wall:g.filter(a => Math.hypot(a.x - CX, a.y - CY) < 14).length });
    }
    return JSON.stringify(s);`))));
  await p.close();
}
await b.close();
const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
const day = all.filter(r => r.h >= 6 && r.h < 20);
console.log(`file: ${file}   seeds ${SEEDS.length} x growing season, per 0.5 sim s`);
console.log(`  samples ${all.length} (daylight 6-20 h: ${day.length})`);
console.log(`  a gardener ON FRAME     : all-day ${mean(all.map(r=>r.n)).toFixed(3)}   6-20 h ${mean(day.map(r=>r.n)).toFixed(3)}   any ${(100*all.filter(r=>r.n).length/all.length).toFixed(1)}% of samples`);
console.log(`  KNEELING at a bed       : all-day ${mean(all.map(r=>r.at)).toFixed(3)}   6-20 h ${mean(day.map(r=>r.at)).toFixed(3)}   any ${(100*day.filter(r=>r.at).length/day.length).toFixed(1)}% of daylight`);
const byh = {}; for (const r of day){ const k = Math.floor(r.h); (byh[k] = byh[k] || []).push(r.at); }
console.log('  KNEELING by hour: ' + Object.keys(byh).map(k => `${k}h ${mean(byh[k]).toFixed(2)}`).join('  '));
