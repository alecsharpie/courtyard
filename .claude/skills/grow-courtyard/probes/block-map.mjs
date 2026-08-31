/* probe: an ASCII map of the allotment block's tiles at a shed-day noon, with litter cells
 * marked # and the litter bbox for the whole town — what proved no leaf lands on the block (#93). */import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
const REPO = fileURLToPath(new URL('../../../../', import.meta.url));
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const PAGE = pathToFileURL(resolve(REPO, 'courtyard.html')).href;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 720 } });
page.on('pageerror', e => console.log('PAGE ERROR', String(e)));
await page.goto(`${PAGE}?pause&seed=42&t=0`, { waitUntil: 'load' });
await page.waitForFunction(() => typeof window.__warp === 'function');
const r = await page.evaluate(() => {
  window.__reseed();
  const names = ['GRASS','PATH','SIDE','SLOT','ROAD','BED','CBED','WALL','TUNNEL','WATER','FENCE','SHED','DECK','EYOT','SOIL','EARTH','DIRT','CURB','TREE','HEDGE','STONE','PAVE','QUAY','GRAVEL','ALLOT','GATE','BRIDGE','RIVER','MILL','EMPTY','VOID'];
  const map = {}; for (const n of names){ try { const v = eval(n); if (typeof v === 'number') map[v] = n; } catch(e){} }
  // warp to a shed day noon: day 15
  while (!(day === 15 && Math.abs(hour - 13) < 0.1)) window.__warp(1);
  const rows = [];
  for (let y = 4; y <= 56; y++){ let s = String(y).padStart(2) + ' ';
    for (let x = 74; x <= 97; x++){ const j = y*GW+x; const g = grid[j]; const n = map[g] || ('?'+g);
      let c = n[0].toLowerCase(); if (g === BED) c = bSp[j] ? 'B' : 'b';
      if (x === 84 && y === 19) c = '*';
      if (litter[j]) c = '#';
      s += c; }
    rows.push(s); }
  let litCells = 0, litOnBlock = 0, bbox = [999,999,-1,-1];
  for (let y = 0; y < WH; y++) for (let x = 0; x < GW; x++){ const j=y*GW+x; if (litter[j]){ litCells++; if (x>=78&&x<96&&y>=3&&y<61) litOnBlock++; bbox=[Math.min(bbox[0],x),Math.min(bbox[1],y),Math.max(bbox[2],x),Math.max(bbox[3],y)]; } }
  const cellName = map[grid[19*GW+84]], cellNameAt = nameAt(84,19);
  return { map, rows, litCells, litOnBlock, bbox, cellName, cellNameAt, leafShed: leafShed(), day, hour, simT, dayLen: DAY_LEN, phase: seasonPhase };
});
console.log(JSON.stringify(r.map)); console.log('day', r.day, 'hour', r.hour.toFixed(2), 'leafShed', r.leafShed.toFixed(2), 'phase', r.phase.toFixed(3));
console.log('cell (84,19) tile:', r.cellName, '| nameAt:', r.cellNameAt);
console.log('litter cells total', r.litCells, 'on block', r.litOnBlock, 'bbox', r.bbox);
console.log('   ' + Array.from({length:24},(_,i)=>String((74+i)%10)).join(''));
r.rows.forEach(s => console.log(s));
await browser.close();
