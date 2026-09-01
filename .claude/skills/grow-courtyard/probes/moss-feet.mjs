#!/usr/bin/env node
/* probe: do FEET keep the plaza's walked lines clean, or is the shelter ceiling doing all
 * the work? Runs the world to a mossy autumn, then compares moss[] on cells people
 * actually crossed against cells of the SAME shelter they did not — the confound the
 * whole rule turns on. Footfall is counted by sampling every agent's cell each step. */
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const FILE = resolve(fileURLToPath(new URL('../../../../courtyard.html', import.meta.url)));
const SEEDS = (process.env.SEEDS || '7,42,1234').split(',').map(Number);
const browser = await chromium.launch();
for (const seed of SEEDS){
  const page = await browser.newPage({ viewport: { width: 1200, height: 720 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(pathToFileURL(FILE).href + `?pause&seed=${seed}&t=0`, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof window.__warp === 'function');
  const r = await page.evaluate(() => {
    window.__reseed();
    window.__warp(2100);                                    // into the second year's growing shoulder
    const foot = new Float32Array(GW * WH);
    for (let k = 0; k < 1200; k++){                         // ~4 days, counting where feet go
      window.__warp(0.2);
      for (const a of agents){
        const x = Math.round(a.x - .5), y = Math.round(a.y - .5);
        if (x >= PLAZA_X0 && x < PLAZA_X1 && y >= 3 && y < 61 && grid[y * GW + x] === PATH) foot[y * GW + x]++;
      }
    }
    // bucket by shelter, then split walked vs not — like against like
    const B = [[0, 0.2], [0.2, 0.5], [0.5, 1.01]], out = [];
    for (const [lo, hi] of B){
      let wS = 0, wN = 0, uS = 0, uN = 0, wDrawn = 0, uDrawn = 0;
      for (let y = 3; y < 61; y++) for (let x = PLAZA_X0; x < PLAZA_X1; x++){
        const i = y * GW + x;
        if (grid[i] !== PATH || mossShel[i] < lo || mossShel[i] >= hi) continue;
        if (foot[i] > 8){ wS += moss[i]; wN++; if (moss[i] > 1/MOSS_BUCKET) wDrawn++; }
        else if (!foot[i]){ uS += moss[i]; uN++; if (moss[i] > 1/MOSS_BUCKET) uDrawn++; }
      }
      out.push({ shel: lo + '..' + hi, walked: wN, wMean: wN ? +(wS/wN).toFixed(3) : null, wDrawn,
                 quiet: uN, uMean: uN ? +(uS/uN).toFixed(3) : null, uDrawn });
    }
    // and the mouth onto the lane specifically: row 60, the gateway columns vs the rest
    const rowMean = (xs) => { let s = 0, n = 0; for (const x of xs){ const i = 60 * GW + x; if (grid[i] === PATH){ s += moss[i]; n++; } } return n ? +(s/n).toFixed(3) : null; };
    const gate = [], side = [];
    for (let x = PLAZA_X0; x < PLAZA_X1; x++) (x >= 102 && x < 108 ? gate : side).push(x);
    return { rows: out, warmth: +warmth.toFixed(3), simT: +simT.toFixed(0),
             mouthGate: rowMean(gate), mouthSide: rowMean(side),
             footTotal: foot.reduce((a, b) => a + b, 0) };
  });
  console.log(`seed ${seed}  t ${r.simT} warmth ${r.warmth}  footfall samples ${r.footTotal}` + (errs.length ? '  ERRORS ' + errs[0] : ''));
  for (const b of r.rows)
    console.log(`  shelter ${b.shel.padEnd(9)} walked n=${String(b.walked).padStart(3)} mean ${String(b.wMean).padStart(5)} drawn ${String(b.wDrawn).padStart(3)}  |  quiet n=${String(b.quiet).padStart(3)} mean ${String(b.uMean).padStart(5)} drawn ${String(b.uDrawn).padStart(3)}`);
  console.log(`  the mouth onto the lane (row 60): gateway cols ${r.mouthGate}  vs  the rest of the row ${r.mouthSide}`);
  await page.close();
}
await browser.close();
