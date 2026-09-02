#!/usr/bin/env node
/* #126 — what the extra pools cost, at the instant they exist. frame-cost.mjs measures a
 * whole sim-day, and a day is mostly DRY: drawPuddles returns on line 1 for most of it,
 * so the day mean cannot see a pool budget at all. This pins the weather WET and times
 * drawScene and drawPuddles alone, interleaved HEAD/tree in one session.
 *   node probe-pool-cost.mjs [--wet 0.75] [--reps 3]
 */
import { homedir } from 'node:os'; import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url'; import { execSync } from 'node:child_process';
import { writeFileSync, unlinkSync } from 'node:fs';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const arg=(k,d)=>{const i=process.argv.indexOf(k);return i<0?d:process.argv[i+1];};
const WET = +arg('--wet', 0.75), REPS = +arg('--reps', 3), N = 600;
const H='/tmp/head126p.html'; writeFileSync(H, execSync('git show HEAD:courtyard.html',{maxBuffer:1<<28}).toString());
const b = await chromium.launch();
async function run(file, night){
  const p = await b.newPage({ viewport:{width:1600,height:950} });
  await p.goto(pathToFileURL(resolve(file)).href + '?seed=7&pause');
  await p.waitForFunction(() => window.__warp);
  const r = await p.evaluate(([wet, n, night]) => {
    __reseed(); __warp(330); while (hour < (night ? 21 : 15)) __warp(0.25);
    raining = false; wetness = wet; wetPainted = wet;
    drawScene(simT, 1/30);                                   // warm the ground cache
    let scene = 0, pud = 0;
    for (let i = 0; i < n; i++){
      wetness = wet; wetPainted = wet;
      let a = performance.now(); drawScene(simT, 1/30); let b2 = performance.now();
      drawPuddles(); let c = performance.now();
      scene += b2 - a; pud += c - b2;
    }
    return { pools: PUDDLES.length, sceneMs:+(scene/n).toFixed(3), pudMs:+(pud/n).toFixed(3) };
  }, [WET, N, night]);
  await p.close(); return r;
}
console.log('wetness', WET, '·', N, 'frames/rep · 1600x950 · interleaved\n');
for (const night of [false, true]) for (let r = 0; r < REPS; r++){
  const h = await run(H, night), t = await run('courtyard.html', night);
  console.log((night?'night':'day  '), 'rep', r,
    ' HEAD pools', String(h.pools).padStart(4), 'scene', h.sceneMs.toFixed(3), 'puddles', h.pudMs.toFixed(3),
    ' | TREE pools', String(t.pools).padStart(4), 'scene', t.sceneMs.toFixed(3), 'puddles', t.pudMs.toFixed(3),
    ' | scene ' + ((t.sceneMs/h.sceneMs-1)*100).toFixed(1) + '%  puddles ' + ((t.pudMs/h.pudMs-1)*100).toFixed(1) + '%');
}
await b.close(); unlinkSync(H);
