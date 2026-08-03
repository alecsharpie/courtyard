#!/usr/bin/env node
/* probe: does the allotment actually turn over?
 *
 * The census can see `harvested` and the veg histogram, but not the shape of the
 * cycle — whether a plot goes bare and comes back, how long it rests, and whether
 * all four crops stay in rotation. This walks the sim at a pinned seed and reads
 * bSp/bSt/bAge directly (top-level `const` in a classic script is visible to an
 * evaluated function through the shared global lexical environment).
 *
 * Laws obeyed: ?pause + __reseed() first, and ALL stepping inside ONE evaluate.
 */
import { homedir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const HERE = dirname(fileURLToPath(import.meta.url));
const PAGE = pathToFileURL(join(resolve(HERE), 'courtyard.html')).href;

const SEEDS = [7, 42, 1234, 5];
const STEP = 2.5, STEPS = 400;          // 1000 s ≈ 18 days

const b = await chromium.launch();
const out = [];
for (const seed of SEEDS) {
  const p = await b.newPage();
  p.on('pageerror', e => console.error('PAGEERROR', String(e)));
  await p.goto(`${PAGE}?seed=${seed}&t=0&pause`);
  await p.waitForTimeout(300);
  out.push(await p.evaluate(([step, steps]) => {
    window.__reseed();
    const ORIG = [];
    for (let oy = 8; oy <= 50; oy += 7) for (let ox = 80; ox <= 90; ox += 5) {
      const cells = [];
      for (let y = oy; y < oy + 2; y++) for (let x = ox; x < ox + 3; x++) {
        const i = y * GW + x;
        if (grid[i] === BED) cells.push(i);
      }
      if (cells.length) ORIG.push(cells);
    }
    const series = [], bare = ORIG.map(() => 0), cycles = ORIG.map(() => 0);
    const wasFull = ORIG.map(() => false), bareRun = ORIG.map(() => 0), maxBare = ORIG.map(() => 0);
    let prevH = 0;
    for (let s = 0; s < steps; s++) {
      window.__warp(step);
      const c = window.__census();
      let vegPlanted = 0, vegMature = 0, fallowCells = 0;
      ORIG.forEach((cells, k) => {
        let pl = 0, mt = 0, fa = 0;
        for (const i of cells) { if (bSp[i]) { pl++; if (bSt[i] === 3) mt++; } else if (bAge[i] > 0) fa++; }
        vegPlanted += pl; vegMature += mt; fallowCells += fa;
        if (pl === 0) { bare[k]++; bareRun[k] += step; maxBare[k] = Math.max(maxBare[k], bareRun[k]); }
        else bareRun[k] = 0;
        // a cycle = the plot was fully grown, then went completely bare
        if (mt === cells.length) wasFull[k] = true;
        if (wasFull[k] && pl === 0) { cycles[k]++; wasFull[k] = false; }
      });
      const h = c.planting.harvested;
      series.push({ t: +(step * (s + 1)).toFixed(1), day: c.clock.day, h, dh: h - prevH,
                    vegPlanted, vegMature, fallowCells });
      prevH = h;
    }
    const last = window.__census().planting.bySpecies;
    return { plots: ORIG.length, cells: ORIG.reduce((a, c) => a + c.length, 0),
             series, bare, cycles, maxBare: maxBare.map(v => +v.toFixed(1)), last };
  }, [STEP, STEPS]));
  await p.close();
}
await b.close();

const VEG = ['carrots', 'cabbages', 'beans', 'pumpkins'];
console.log(`plots ${out[0].plots}, bed cells ${out[0].cells}, ${STEPS} samples x ${STEP}s = ${STEPS * STEP}s each, ${SEEDS.length} seeds\n`);
console.log('seed   harvested  cycles/plot  maxBare(s)  veg planted min..max (mean)  veg mature min..max');
for (let k = 0; k < SEEDS.length; k++) {
  const o = out[k], se = o.series;
  const vp = se.map(r => r.vegPlanted), vm = se.map(r => r.vegMature);
  const cyc = o.cycles.reduce((a, b) => a + b, 0) / o.plots;
  const mean = vp.reduce((a, b) => a + b, 0) / vp.length;
  console.log(`${String(SEEDS[k]).padStart(4)}   ${String(se[se.length - 1].h).padStart(9)}  ` +
    `${cyc.toFixed(2).padStart(11)}  ${Math.max(...o.maxBare).toFixed(1).padStart(10)}  ` +
    `${String(Math.min(...vp)).padStart(11)}..${String(Math.max(...vp)).padEnd(4)}(${mean.toFixed(1)})  ` +
    `${String(Math.min(...vm)).padStart(9)}..${Math.max(...vm)}`);
}
console.log('\nfinal veg mix per seed:');
for (let k = 0; k < SEEDS.length; k++)
  console.log(`  ${String(SEEDS[k]).padStart(4)}  ` + VEG.map(v => `${v} ${(out[k].last[v] || 0)}`).join('  '));

console.log('\nseed 7 trace (every 20th sample):');
console.log('    t  day  harvested  +  planted  mature  fallow');
out[0].series.forEach((r, i) => { if (i % 20 === 19)
  console.log(`${String(r.t).padStart(5)}  ${String(r.day).padStart(3)}  ${String(r.h).padStart(9)}  ${String(r.dh).padStart(1)}  ${String(r.vegPlanted).padStart(7)}  ${String(r.vegMature).padStart(6)}  ${String(r.fallowCells).padStart(6)}`); });
