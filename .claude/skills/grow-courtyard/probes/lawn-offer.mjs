#!/usr/bin/env node
/* probe-lawn-offer — b168: how wide is each lawn kind's DOOR? Walks a year at a fixed
 * seed and, at every sample inside the open window, asks the five offer predicates
 * directly at a canonical speed — no lottery, no cap, no reshuffle. Build-independent:
 * the only thing that differs between two files is lawnFits() itself.
 *   node lawn-offer.mjs <file> [--seed 3] [--days 27]
 */
import { homedir } from 'node:os'; import { resolve, dirname } from 'node:path'; import { pathToFileURL, fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const PW = resolve(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const arg = (n, d) => { const i = process.argv.indexOf(n); return i !== -1 && process.argv[i+1] ? process.argv[i+1] : d; };
const file = resolve(process.argv[2]);
const DAYS = +arg('--days', 27);
const b = await chromium.launch();
const p = await b.newPage({ viewport:{width:1200, height:720} });
p.on('pageerror', e => console.log('PAGE ERROR', e.message));
await p.goto(pathToFileURL(file).href + `?pause&seed=${arg('--seed',3)}`);
await p.waitForFunction(() => window.__warp);
const out = JSON.parse(await p.evaluate(new Function('DAYS', `
  window.__reseed(); window.__setTime(55);
  const SP = 1.85, nap = g => [CX + Math.cos(g)*2.6, CY + Math.sin(g)*2.6];
  const K = { open:0,
    kid:      () => ENTR.some(e => lawnFits(e, [RING[e.k], [CX + (RING[e.k][0]-CX)*0.6, CY + (RING[e.k][1]-CY)*0.6]], 2.6)),
    napper:   () => GAP_ANGLES.some(g => ENTR.some(e => lawnFits(e, gapWay(e,g).concat([nap(g)]), SP*0.8))),
    picnicSh: () => GAP_ANGLES.some(g => ENTR.some(e => lawnFits(e, gapWay(e,g).concat([[CX + Math.cos(g)*3.3, CY + Math.sin(g)*3.3]]), SP))),
    picnicOp: () => ENTR.some(e => lawnFits(e, lawnWay(e, CX + (RING[e.k][0]-CX)*0.55, CY + (RING[e.k][1]-CY)*0.55), SP)),
    sitter:   () => BENCH_SPOTS.some(bs => ENTR.some(e => lawnFits(e, lawnWay(e, bs.x+0.5, bs.y+0.6), SP))) };
  const hit = { kid:0, napper:0, picnicSh:0, picnicOp:0, sitter:0 }, warm = { n:0 };
  let n = 0;
  for (let i = 0; i < 400000 && day < DAYS; i++){
    window.__warp(0.25);
    if (!lawnOpen()) continue;      // the set-out gate: dry, day>=1, sun up
    n++;
    for (const k of Object.keys(hit)) if (K[k]()) hit[k]++;
    if (warmth >= LAWN_LIE_WARMTH && snowCover < 0.2) warm.n++;
  }
  return JSON.stringify({ n, hit, warm });`), DAYS));
await b.close();
console.log(`file: ${file}   samples inside lawnOpen(): ${out.n}   of them warm enough to LIE: ${out.warm.n} (${(100*out.warm.n/out.n).toFixed(1)}%)`);
for (const [k, v] of Object.entries(out.hit)) console.log(`  ${k.padEnd(9)} offerable in ${String(v).padStart(6)} = ${(100*v/out.n).toFixed(1)}% of open samples`);
