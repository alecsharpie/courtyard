/* Draw CPU per frame over one sim-day (simStep + drawScene at 1/30), HEAD vs tree, interleaved.
 * perf.mjs reads the 16.7 ms rAF cadence and cannot see work under the cap. #56: 9.1->3.0 ms
 * summer, 11.8->2.7 ms winter.   node frame-cost.mjs   (expects HEAD at /tmp/head.html) */
// CPU cost of one sim-day of frames (simStep + drawScene at 1/30), HEAD vs tree, interleaved.
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const b = await chromium.launch();
async function run(file, T0){
  const p = await b.newPage({ viewport:{width:1600, height:950} });
  await p.goto(pathToFileURL(resolve(file)).href + '?seed=7&t=0&pause');
  await p.waitForFunction(() => window.__warp);
  const r = await p.evaluate((T0) => { window.__reseed(); window.__warp(T0);
    let rebuilds = 0, draw = 0, sim = 0; const n = 55 * 30;
    for (let i = 0; i < n; i++){ let a = performance.now(); simStep(1/30, 1/30); let b2 = performance.now(); if (groundDirty) rebuilds++; drawScene(simT, 1/30); let c = performance.now(); sim += b2 - a; draw += c - b2; }
    return { rebuilds, simMs: +(sim/n).toFixed(2), drawMs: +(draw/n).toFixed(2) }; }, T0);
  await p.close(); return r;
}
for (const [name, T0] of [['summer', 330], ['winter', 1155]]) for (let rep = 0; rep < 3; rep++){
  console.log(name, 'rep', rep, 'HEAD', JSON.stringify(await run('/tmp/head.html', T0)), 'TREE', JSON.stringify(await run('courtyard.html', T0)));
}
await b.close();
