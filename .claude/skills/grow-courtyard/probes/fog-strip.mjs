#!/usr/bin/env node
/* The hollow's wisps drift and RECYCLE. A blob reappearing at the other end of its band is a
 * teleport that no still frame shows and the motion gate cannot see (wisps are hash+clock, not
 * entities). So: step frames at a fogged instant, crop to the allotments, and read the
 * frame-to-frame difference as a series. A wrap is a spike far above its neighbours.
 *   node probe-fog-strip.mjs --at 1326.1 --seed 1234 --n 60 --gap 0.1
 */
import { homedir } from 'node:os';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i < 0 ? d : argv[i + 1]; };
const AT = +arg('--at','1326.1'), SEED = +arg('--seed','1234'), N = +arg('--n','60'), GAP = arg('--gap','0.1');
const FILE = resolve(arg('--file','courtyard.html'));
const X0 = +arg('--x0','1700'), X1 = +arg('--x1','2100');   // the allotments, in device px

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1600, height: 950 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
const errs = []; p.on('pageerror', e => errs.push(String(e)));
await p.goto(pathToFileURL(FILE).href + `?seed=${SEED}&pause`);
await p.waitForFunction('typeof __warp === "function"');
const series = await p.evaluate(`(async () => {
  window.requestAnimationFrame = () => 0; await new Promise(r => setTimeout(r, 80));
  __reseed(); __setTime(0);
  while (day < 1) __warp(1);
  while (simT < ${AT} - 1e-6) __warp(0.1);
  const cv = document.querySelector('canvas');
  const g = cv.getContext('2d');
  const X0 = ${X0}, X1 = ${X1}, W = X1 - X0, H = cv.height;
  let prev = null; const out = [], hol = [];
  for (let i = 0; i < ${N}; i++){
    drawScene(simT, 1/30);
    const d = g.getImageData(X0, 0, W, H).data;
    if (prev){
      let sum = 0, mx = 0, cnt = 0;
      for (let k = 0; k < d.length; k += 4){
        const v = Math.max(Math.abs(d[k]-prev[k]), Math.abs(d[k+1]-prev[k+1]), Math.abs(d[k+2]-prev[k+2]));
        sum += v; if (v > mx) mx = v; if (v > 2) cnt++;
      }
      out.push([+(sum/(d.length/4)).toFixed(3), mx, cnt]);
    }
    prev = d.slice(); hol.push(+hollowMist.toFixed(3));
    __warp(${GAP});
  }
  return { out, hol, H, W };
})()`);
if (errs.length){ console.error('PAGE ERROR', errs[0]); process.exit(2); }
await browser.close();
const mean = series.out.map(o => o[0]);
const sorted = [...mean].sort((a,b)=>a-b);
const med = sorted[sorted.length>>1];
console.log('file:', FILE, '· crop x' + X0 + '..' + X1 + ' · ' + series.out.length + ' frame gaps · hollow '
  + series.hol[0] + ' -> ' + series.hol[series.hol.length-1]);
console.log('frame-to-frame mean|Δ| in the crop: median ' + med.toFixed(3)
  + '  max ' + Math.max(...mean).toFixed(3) + '  ratio ' + (Math.max(...mean)/(med||1)).toFixed(1) + 'x');
const pops = mean.map((v,i)=>[i,v]).filter(([i,v]) => v > med*4 && v > 0.5);
console.log('POP frames (>4x median): ' + (pops.length ? pops.map(([i,v])=>i+':'+v.toFixed(2)).join(' ') : 'none'));
console.log('series:', mean.map(v=>v.toFixed(2)).join(' '));
