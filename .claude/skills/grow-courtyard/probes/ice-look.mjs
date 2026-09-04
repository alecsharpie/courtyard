/* b210: what does the ground cache's ice LAG actually cost the picture? At a pinned
 * instant, paints the ground with the ice as it was D sim-seconds ago (rice[] swapped
 * around drawGround() alone, then restored, so the live pass and every other cached
 * thing are identical), composites, and diffs against the same frame with the ice CURRENT.
 * The Δ=0 row is the same-code control floor. Shipping size, whole canvas.
 *   node ice-look.mjs [file] [seeds] */
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const file = resolve(process.argv[2] || new URL('../../../../courtyard.html', import.meta.url).pathname);
const SEEDS = (process.argv[3] || '7,42').split(',').map(Number);
const MOMENTS = [['freeze', 1080], ['thaw', 1290]];
const DELTAS = [0, 0.35, 0.7, 1.4, 2.8, 5.6];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1600, height: 950 } });
p.on('pageerror', e => console.log('PAGE ERROR', e.message));
for (const seed of SEEDS){
  for (const [name, T0] of MOMENTS){
    await p.goto(pathToFileURL(file).href + '?seed=' + seed + '&t=0&pause');
    await p.waitForFunction(() => window.__warp);
    const out = await p.evaluate(({ T0, DELTAS }) => {
      const lvOf = r => { let s = 0; for (let k = 0; k < ICE_CELLS.length; k++){
        const v = r[ICE_CELLS[k]]; if (v > 0) s += Math.min(ICE_BUCKET - 1, (v / ICE_CAP) * ICE_BUCKET | 0); } return s; };
      window.__reseed(); window.__warp(T0 - simT);
      const A = rice.slice(), lvA = lvOf(A), rows = [];
      const cv = document.querySelector('canvas'), c2 = cv.getContext('2d');
      const shot = () => c2.getImageData(0, 0, cv.width, cv.height).data;
      let prev = 0;
      for (const d of DELTAS){
        window.__warp(d - prev); prev = d;
        const B = rice.slice();
        rice.set(A); drawGround(); groundDirty = false; rice.set(B); drawScene(simT, 0);
        const px1 = shot();
        rice.set(B); drawGround(); groundDirty = false; drawScene(simT, 0);
        const px2 = shot();
        let mass = 0, sum = 0, max = 0;
        for (let i = 0; i < px1.length; i += 4){
          const dl = Math.abs((px1[i] * 0.299 + px1[i+1] * 0.587 + px1[i+2] * 0.114) -
                              (px2[i] * 0.299 + px2[i+1] * 0.587 + px2[i+2] * 0.114));
          if (dl > 2){ mass++; sum += dl; if (dl > max) max = dl; }
        }
        rows.push({ dSec: d, levels: Math.abs(lvOf(B) - lvA), mass, meanD: mass ? +(sum / mass).toFixed(2) : 0, maxD: +max.toFixed(1) });
      }
      return { lvA, cells: ICE_CELLS.length, rows };
    }, { T0, DELTAS });
    console.log(`seed ${seed} ${name} T=${T0} lv=${out.lvA} of ${out.cells * 4} (${out.cells} cells)`);
    for (const r of out.rows) console.log(`   Δ${r.dSec}s  levels ${r.levels}  mass ${r.mass}px  mean ${r.meanD}  max ${r.maxD}`);
  }
}
await b.close();
