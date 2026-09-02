#!/usr/bin/env node
/* does the allotment cart take a >=2 cell single step on HEAD too? motion.mjs fired
 * cart392 at seed 42 on the candidate; the punt cannot touch the cart except through the
 * seeded stream, so the question is whether this is a PRE-EXISTING move the reshuffle
 * merely landed on. Same sampling as motion.mjs: 0.25 s of warped sim time. */
import { homedir } from 'node:os'; import { resolve, join, dirname } from 'node:path'; import { pathToFileURL, fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const arg = (n, d) => { const i = process.argv.indexOf(n); return i !== -1 ? +process.argv[i + 1] : d; };
const f = process.argv.find((s, i) => i > 1 && s.endsWith('.html'));
const FILE = resolve(f || resolve(HERE, '../../../../courtyard.html'));
const SEEDS = [7, 42, 1234, 3, 11, 19, 23, 29];
const br = await chromium.launch();
let big = 0, samples = 0; const worst = [];
for (const seed of SEEDS){
  const p = await br.newPage({ viewport:{ width:1600, height:950 } });
  p.on('pageerror', e => console.log('PAGEERROR', e.message));
  await p.goto(pathToFileURL(FILE).href + `?pause&seed=${seed}`, { waitUntil:'load' });
  await p.waitForFunction(() => typeof window.__warp === 'function');
  const o = await p.evaluate(`(() => {
    window.__reseed(); window.__warp(5 * 55 - simT);
    let prev = null, n = 0, hits = [], mx = 0;
    for (let i = 0; day < 5 + ${arg('--days', 12)}; i++){
      window.__warp(0.25); n++;
      if (!cart){ prev = null; continue; }
      if (prev){ const d = Math.hypot(cart.x - prev[0], cart.y - prev[1]);
        if (d > mx) mx = d;
        if (d >= 2 && hits.length < 6) hits.push({day, hour:+hour.toFixed(2), d:+d.toFixed(2),
                                                  from:[+prev[0].toFixed(1), +prev[1].toFixed(1)],
                                                  to:[+cart.x.toFixed(1), +cart.y.toFixed(1)]}); }
      prev = [cart.x, cart.y];
    }
    return {n, hits, mx:+mx.toFixed(2)};
  })()`);
  samples += o.n; big += o.hits.length; worst.push({seed, mx:o.mx, hits:o.hits.length});
  console.log(`seed ${seed}: max single step ${o.mx} cells, >=2-cell steps ${o.hits.length}` + (o.hits.length ? '  ' + JSON.stringify(o.hits[0]) : ''));
  await p.close();
}
await br.close();
console.log(`\n${FILE.split('/').pop()}: ${big} steps >= 2 cells over ${samples} samples x ${SEEDS.length} seeds; per-seed max ${worst.map(w => w.mx).join(' ')}`);
