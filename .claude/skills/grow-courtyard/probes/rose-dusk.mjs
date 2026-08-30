/* The rose window at dusk: crop the tower, step 0.1 s through nightF 0.2 → 0.7, print the
 * crop's frame Δ (live) and the gcv hash (cache), grade with pops(). node probe-rose-dusk.mjs [file] */
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
import { pops } from '../pops.mjs';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const file = resolve(process.argv[2] || new URL('../../../../courtyard.html', import.meta.url).pathname); const GAP = +(process.argv[3] || 0.1);
const b = await chromium.launch(); const p = await b.newPage({ viewport:{width:1600, height:950} });
p.on('pageerror', e => console.log('PAGE ERROR', e.message));
await p.goto(pathToFileURL(file).href + '?seed=7&t=0&pause'); await p.waitForFunction(() => window.__warp);
const out = await p.evaluate(async GAP => {
  const cv = document.querySelector('canvas'), x = cv.getContext('2d');
  const frame = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  const hashG = () => { const d = gcv.getContext('2d').getImageData(0, 0, gcv.width, gcv.height).data; let s = 0; for (let i = 0; i < d.length; i += 97) s = (s * 31 + d[i]) >>> 0; return s; };
  window.__reseed(); window.__warp(3 * 55); await frame();
  // walk to the evening: nightF 0.2
  while (hour < 12 || nightF < 0.2) window.__warp(0.2);
  await frame();
  const mx = (CHURCH.nx0 + CHURCH.nx1) / 2, [rx, ry] = project(mx, CHURCH.ny1, 5.4), r = cellW * 2;
  const crop = () => x.getImageData((rx - r) * DPR, (ry - r) * DPR, 2 * r * DPR, 2 * r * DPR).data;
  const disc = () => { const d = x.getImageData((rx - 2) * DPR, (ry - 2) * DPR, 4 * DPR, 4 * DPR).data; let R = 0, G = 0, B = 0, n = 0; for (let i = 0; i < d.length; i += 4){ R += d[i]; G += d[i+1]; B += d[i+2]; n++; } return [R/n|0, G/n|0, B/n|0]; };
  let pc = crop(); const rows = [];
  while (nightF < 0.7 && rows.length < 80){
    window.__warp(GAP); await frame();
    const c = crop(); let t = 0; for (let k = 0; k < c.length; k += 4) t += (Math.abs(c[k]-pc[k])+Math.abs(c[k+1]-pc[k+1])+Math.abs(c[k+2]-pc[k+2]))/3;
    rows.push({ hour: +hour.toFixed(3), nightF: +nightF.toFixed(3), d: +(t / (c.length/4)).toFixed(3), disc: disc(), g: hashG(), lb: lightBucket });
    pc = c;
  }
  return rows;
}, GAP);
const ds = out.map(r => r.d); const P = pops(ds);
for (const [i, r] of out.entries()) console.log(`${String(i).padStart(2)} h${r.hour.toFixed(2)} nF ${r.nightF.toFixed(3)} Δ ${r.d.toFixed(2).padStart(6)} disc ${r.disc.join(',').padEnd(11)} lb ${r.lb} g ${r.g}${P.has(i) ? '  POP' : ''}`);
console.log('pops', [...P], 'gcv distinct', new Set(out.map(r => r.g)).size, 'max Δ', Math.max(...ds).toFixed(2));
await b.close();
