/* What the water mirror costs, at EVERY camera and in the weather it is loudest in.
 *
 * perf.mjs is vsync-locked and blind to a pass under the cap; frame-cost.mjs times the
 * whole day at Wide only. drawWaterMirror is a per-frame offscreen composite whose cost
 * is a function of WHICH quarter you are looking at — three of the five casters leave the
 * frame at Courtyard and Street, and all five leave it nowhere. So this times the whole
 * drawScene at each of the five WHERE slots, HEAD against the tree, interleaved in one
 * session, on a WINDY day (t 345 seed 42: windF 1, so the chop loop runs at full length).
 *
 *   node probes/refl-cost.mjs        (expects HEAD at /tmp/head.html)
 */
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const b = await chromium.launch();
const QUARTERS = ['Wide', 'Courtyard', 'Street', 'Plaza', 'Far bank'];
async function run(file, T0, q){
  const p = await b.newPage({ viewport:{width:1600, height:950} });
  await p.goto(pathToFileURL(resolve(file)).href + '?seed=42&t=0&pause');
  await p.waitForFunction(() => window.__warp);
  const r = await p.evaluate(([T0, q]) => {
    window.__reseed(); window.__warp(T0);
    window.__where(q); window.__where(q, 3);       // ease to the quarter and settle there
    let draw = 0; const n = 300;
    for (let i = 0; i < n; i++){ const a = performance.now(); drawScene(simT + i / 30, 1 / 30); draw += performance.now() - a; }
    return { drawMs: +(draw / n).toFixed(3), wind: +window.windF().toFixed(2) };
  }, [T0, q]);
  await p.close(); return r;
}
console.log('windy day (seed 42, t 345), 300 frames per cell, HEAD vs tree interleaved\n');
console.log('quarter        HEAD ms   TREE ms      d ms      d %');
for (let qi = 0; qi < QUARTERS.length; qi++){
  const h = [], t = [];
  for (let rep = 0; rep < 3; rep++){ h.push((await run('/tmp/head.html', 345, qi)).drawMs); t.push((await run('courtyard.html', 345, qi)).drawMs); }
  const med = a => a.slice().sort((x, y) => x - y)[1];
  const H = med(h), T = med(t);
  console.log(`${QUARTERS[qi].padEnd(12)} ${H.toFixed(3).padStart(9)} ${T.toFixed(3).padStart(9)} ${(T - H).toFixed(3).padStart(9)} ${((T / H - 1) * 100).toFixed(1).padStart(8)}%   head[${h}] tree[${t}]`);
}
await b.close();
