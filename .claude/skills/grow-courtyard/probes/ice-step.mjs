/* Does the front arrive as a STEP? Count cells crossing a DRAWN bucket per caTick
 * through the whole advance — a synchronised field would show one huge tick. */
import { homedir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const { chromium } = (await import(pathToFileURL(join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js')).href)).default;
const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const br = await chromium.launch();
const pg = await br.newPage({ viewport: { width: 1600, height: 950 } });
await pg.goto(pathToFileURL(join(REPO, 'courtyard.html')).href + '?pause&seed=42&t=0');
await pg.waitForFunction('window.__census');
const r = await pg.evaluate(() => {
  __reseed(); __setTime(0); __warp(1020);              // just before the front arrives
  const bkt = () => ICE_CELLS.map(i => Math.min(ICE_BUCKET - 1, (rice[i] / ICE_CAP) * ICE_BUCKET | 0));
  let prev = bkt(); const steps = []; let peak = 0, peakT = 0;
  for (let k = 0; k < 900; k++){                        // ~315 s of sim: the whole advance
    __warp(0.35);
    const b = bkt();
    let ch = 0; for (let j = 0; j < b.length; j++) if (b[j] !== prev[j]) ch++;
    steps.push(ch); prev = b;
    const on = ICE_CELLS.reduce((a, i) => a + (rice[i] >= ICE_SET ? 1 : 0), 0);
    if (on > peak){ peak = on; peakT = simT; }
  }
  const on = ICE_CELLS.filter(i => rice[i] >= ICE_SET).length;
  return { steps, on, cells: ICE_CELLS.length, peak, peakT: +peakT.toFixed(0), endT: +simT.toFixed(0) };
});
await br.close();
const s = r.steps, tot = s.reduce((a, b) => a + b, 0);
console.log('ticks', s.length, ' cells that ever changed bucket (sum of crossings)', tot);
console.log('max crossings in ONE tick', Math.max(...s), ' of', r.cells, 'margin cells');
console.log('ticks with any crossing', s.filter(x => x).length, ' mean when non-zero',
            (tot / (s.filter(x => x).length || 1)).toFixed(2));
console.log('peak frozen', r.peak, 'at simT', r.peakT, ' frozen at simT', r.endT, '=', r.on);
const hist = {}; for (const x of s) if (x) hist[x] = (hist[x] || 0) + 1;
console.log('crossings-per-tick histogram', JSON.stringify(hist));
