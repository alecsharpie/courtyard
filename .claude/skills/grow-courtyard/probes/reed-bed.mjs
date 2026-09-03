/* Where the reed margins landed, and what the town says about them (#155).
 * Counts the shallows the grid offers BEFORE the two hash gates and after them, so the
 * gates' share is read rather than assumed; then names and taps one reed cell at four
 * warmths, which is the assertion that all three stages of the naming are reachable; then
 * asks speciesFor() at a courtyard bed and an allotment plot, which is the assertion that
 * `wild` holds and nobody can ever be offered a rush.   Run from the repo root.
 */
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const PAGE = pathToFileURL(join(process.cwd(), 'courtyard.html')).href;
const b = await chromium.launch();
const p = await b.newPage();
const errs = [];
p.on('pageerror', e => errs.push(String(e)));
p.on('console', m => { if (m.type() === 'error') errs.push('console ' + m.text()); });
await p.goto(PAGE + '?seed=7&t=0&pause');
await p.waitForTimeout(400);
const out = await p.evaluate(() => {
  // candidates BEFORE the two hash gates (the grid is already cut, so re-derive on WATER|REED)
  const isW = (x,y) => { const g = grid[y*GW+x]; return g === WATER || g === REED; };
  const shallow = (x,y) => { if (y<REED_Y0||y>=REED_Y1||x<RIVER_X0||x>=RIVER_X1) return false;
    if (!isW(x,y)) return false;
    for (const d of [-1,1,-GW,GW]){ const g = grid[y*GW+x+d]; if (g===SIDE||g===EYOT) return true; } return false; };
  let cand = 0, kept = 0, keptEyot = 0, candEyot = 0;
  const rim = (x,y) => { for (const d of [-1,1,-GW,GW]) if (grid[y*GW+x+d]===EYOT) return true; return false; };
  for (let y = REED_Y0; y < REED_Y1; y++) for (let x = RIVER_X0; x < RIVER_X1; x++){
    if (!shallow(x,y)) continue;
    if (reedKeepOut(x+0.5,y+0.5)) continue;
    cand++; if (rim(x,y)) candEyot++;
    if (grid[y*GW+x]===REED){ kept++; if (rim(x,y)) keptEyot++; }
  }
  const cells=[]; for (let y=0;y<WH;y++) for (let x=0;x<GW;x++) if (grid[y*GW+x]===REED) cells.push([x,y]);
  const byCol={}; for(const [x] of cells) byCol[x]=(byCol[x]||0)+1;
  return { cand, kept, candEyot, keptEyot, byCol, n: cells.length,
           water: window.__census().scalars.water,
           tileKinds: window.__census().scalars.tileKinds };
});
console.log(JSON.stringify(out));
// the words: one reed cell, named and tapped, at three warmths — the same stage the draw reads
const words = await p.evaluate(() => {
  const cell = (() => { for (let y=0;y<WH;y++) for (let x=0;x<GW;x++) if (grid[y*GW+x]===REED) return [x,y]; })();
  const out = [];
  for (const T of [1155, 1341, 1370, 250]){                       // deep winter, spring, high summer
    window.__reseed(); window.__setTime(0); window.__warp(T);
    const [x,y] = cell, j = y*GW+x;
    out.push({ T, warmth:+warmth.toFixed(3), stage:bSt[j], name:nameAt(x,y),
               tap:REED_WORDS[bSt[j]-1] });
  }
  // and nothing the gardener or the CA can offer is ever a rush
  const offered = speciesFor(32, 20).map(s=>s.name).concat(speciesFor(82, 10).map(s=>s.name));
  return { out, rushOffered: offered.filter(n=>n==='rushes').length, offered: offered.length };
});
console.log(JSON.stringify(words, null, 1));
console.log('errors:', errs.length, errs.slice(0,3));
await b.close();
