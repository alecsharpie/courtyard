/* Does the light RISE AND FALL over the courtyard as a bank crosses, or is it a dimmer?
 * Cover pinned, N frames stepped by __warp, each cropped to the garden and tiled into one
 * contact sheet — all inside the page, because a canvas read after a rAF is unpinned.
 * Prints the crop's mean luma series: a dimmer switch is a flat line.
 *   node probe-shade-strip.mjs [cover=0.45] [step=1.5] [n=10] [seed=42] [t=175]
 */
import { homedir } from 'node:os'; import { join, resolve } from 'node:path'; import { pathToFileURL, fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';
const REPO = fileURLToPath(new URL('../../../../', import.meta.url));
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const [COVER, STEP, N, SEED, T0] = [+(process.argv[2] || 0.45), +(process.argv[3] || 1.5), +(process.argv[4] || 10), +(process.argv[5] || 42), +(process.argv[6] || 175)];
const BOX = (process.argv[7] || '20,22,46,44').split(',').map(Number);   // world box to crop
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1600, height: 950 } });
p.on('pageerror', e => console.log('PAGE ERROR', e.message));
await p.goto(pathToFileURL(join(REPO, 'courtyard.html')).href + `?seed=${SEED}&t=0&pause`);
await p.waitForFunction(() => window.__warp);
const r = await p.evaluate(({ COVER, STEP, N, T0, BOX }) => {
  window.__reseed(); window.__warp(T0);
  const a = project(BOX[0], BOX[1], 0), c = project(BOX[2], BOX[3], 0);
  const bx = Math.round(a[0] * DPR), by = Math.round(a[1] * DPR);
  const bw = Math.round((c[0] - a[0]) * DPR), bh = Math.round((c[1] - a[1]) * DPR);
  const cols = N <= 8 ? 4 : 5, rows = Math.ceil(N / cols), sc = 0.5;
  const out = document.createElement('canvas');
  out.width = cols * bw * sc; out.height = rows * (bh * sc + 16);
  const o = out.getContext('2d');
  o.fillStyle = '#111'; o.fillRect(0, 0, out.width, out.height);
  const series = [], plainS = [], hours = [];
  const real = drawCloudShade;
  const crop = () => { const d = ctx.getImageData(bx, by, bw, bh).data; let s = 0, n = 0;
    for (let j = 0; j < d.length; j += 4 * 5){ s += 0.299 * d[j] + 0.587 * d[j+1] + 0.114 * d[j+2]; n++; } return s / n; };
  for (let i = 0; i < N; i++){
    cloud = cloudTgt = COVER;
    // the same instant twice — the day's own arc is in BOTH, so the ratio is the shadow alone
    drawCloudShade = () => {}; drawScene(simT, 1 / 30); plainS.push(+crop().toFixed(2));
    drawCloudShade = real;    drawScene(simT, 1 / 30); series.push(+crop().toFixed(2));
    hours.push(+hour.toFixed(2));
    const gx = (i % cols) * bw * sc, gy = Math.floor(i / cols) * (bh * sc + 16);
    o.drawImage(cv, bx, by, bw, bh, gx, gy + 16, bw * sc, bh * sc);
    o.fillStyle = '#eee'; o.font = '11px monospace';
    o.fillText(`${i} t+${(i * STEP).toFixed(1)}s h${hours[i]} ${(100 * series[i] / plainS[i]).toFixed(0)}% sun`, gx + 4, gy + 12);
    window.__warp(STEP);
  }
  return { png: out.toDataURL('image/png'), series, plainS, hours };
}, { COVER, STEP, N, T0, BOX });
writeFileSync(`${REPO}shots/b102-strip-c${COVER}-s${SEED}-${BOX.join('_')}.png`, Buffer.from(r.png.split(',')[1], 'base64'));
const rel = r.series.map((v, i) => 100 * v / r.plainS[i]);
console.log('lawn luma  (with shade):', r.series.join(' '));
console.log('lawn luma  (no shade)  :', r.plainS.join(' '));
console.log('% of the unshaded frame:', rel.map(v => v.toFixed(1)).join(' '));
console.log(`shaded down to ${Math.min(...rel).toFixed(1)}%, up to ${Math.max(...rel).toFixed(1)}% — swing ${(Math.max(...rel) - Math.min(...rel)).toFixed(1)} points`);
console.log(`-> shots/b102-strip-c${COVER}-s${SEED}-${BOX.join('_')}.png`);
await b.close();
