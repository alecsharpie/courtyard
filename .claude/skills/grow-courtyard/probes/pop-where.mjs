/* popwhere — WHERE did the filmstrip's frame-7 POP happen?
 *
 *   node .claude/skills/grow-courtyard/probes/pop-where.mjs [path-to-courtyard.html]
 *
 * "Locate, don't judge": a mean-pixel Δ says a frame changed, not what changed.
 * This replays the filmstrip's stepping, grabs the canvas as raw pixels each frame,
 * and reports the per-frame Δ broken into a coarse grid so the POP can be pinned to
 * a region — courtyard, lane, plaza, far bank — before anyone names a cause.
 */
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;

const file = resolve(process.argv[2] || 'courtyard.html');
const b = await chromium.launch();
const p = await b.newPage({ viewport:{width:1200, height:750} });
p.on('pageerror', e => console.log('PAGE ERROR', e.message));
await p.goto(pathToFileURL(file).href + '?seed=42&t=0&pause');
await p.waitForFunction(() => window.__warp);

const out = await p.evaluate(async () => {
  const cv = document.querySelector('canvas');
  const g = document.createElement('canvas'), COLS = 8, ROWS = 6;
  g.width = 160; g.height = 100;
  const gx = g.getContext('2d', {willReadFrequently:true});
  const grab = () => { gx.drawImage(cv, 0, 0, g.width, g.height); return gx.getImageData(0, 0, g.width, g.height).data; };
  const frame = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

  window.__reseed();
  window.__warp(175);
  await frame();
  let prev = grab();
  const rows = [];
  for (let f = 1; f < 12; f++){
    window.__warp(0.35);
    await frame();
    const now = grab();
    const cell = new Array(COLS * ROWS).fill(0), cnt = new Array(COLS * ROWS).fill(0);
    let total = 0;
    for (let i = 0; i < now.length; i += 4){
      const px = (i / 4) % g.width, py = Math.floor((i / 4) / g.width);
      const d = Math.abs(now[i] - prev[i]) + Math.abs(now[i+1] - prev[i+1]) + Math.abs(now[i+2] - prev[i+2]);
      const c = Math.floor(px / g.width * COLS) + Math.floor(py / g.height * ROWS) * COLS;
      cell[c] += d; cnt[c]++; total += d;
    }
    rows.push({f, mean:+(total / (now.length / 4) / 3).toFixed(2),
               grid: cell.map((v, i) => +(v / cnt[i] / 3).toFixed(1))});
    prev = now;
  }
  return {rows, COLS, ROWS};
});
await b.close();

for (const r of out.rows){
  const flag = r.mean > 3 ? '  <-- POP' : '';
  console.log(`frame ${String(r.f).padStart(2)}  mean ${String(r.mean).padStart(6)}${flag}`);
  if (!flag) continue;
  for (let y = 0; y < out.ROWS; y++)
    console.log('   ' + r.grid.slice(y * out.COLS, (y + 1) * out.COLS).map(v => String(v).padStart(7)).join(''));
}
