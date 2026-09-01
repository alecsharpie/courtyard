import { pathToFileURL } from 'node:url';
import { homedir } from 'node:os';
import { join } from 'node:path';
const { chromium } = (await import(pathToFileURL(join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js')).href)).default;
const b = await chromium.launch();
async function shot(url){
  const ctx = await b.newContext({ viewport: { width: 1600, height: 950 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.goto(`${url}?seed=42&t=0&pause`, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof window.__warp === 'function');
  const o = await p.evaluate(() => {
    window.__reseed(); window.__warp(175);
    const cv = document.querySelector('canvas'), g = cv.getContext('2d');
    return { px: Array.from(g.getImageData(0,0,cv.width,cv.height).data), w: cv.width, h: cv.height,
             topPad, cellH, cellW, originX, FOCUS, dpr: cv.width / cv.getBoundingClientRect().width };
  });
  await ctx.close(); return o;
}
const which = process.argv[2] || 'cand';
const a = await shot(pathToFileURL('/tmp/head-courtyard.html').href);
const c = await shot(pathToFileURL(which === 'control' ? '/tmp/head-courtyard.html' : 'courtyard.html').href);
console.log('control run:', which);
const rows = new Map();
let shown = 0;
for (let y = 0; y < a.h; y++) for (let x = 0; x < a.w; x++){
  const i = (y*a.w+x)*4;
  if (a.px[i]!==c.px[i]||a.px[i+1]!==c.px[i+1]||a.px[i+2]!==c.px[i+2]){
    rows.set(y, (rows.get(y)||0)+1);
    if (shown < 12 && y < 600){ console.log(`  y=${y} x=${x}  HEAD ${a.px[i]},${a.px[i+1]},${a.px[i+2]}  ->  ${c.px[i]},${c.px[i+1]},${c.px[i+2]}`); shown++; }
  }
}
const ys = [...rows.keys()].sort((p,q)=>p-q);
let above = 0, below = 0;
for (const [y, n] of rows) (y / a.dpr < 676 ? (above += n) : (below += n));
console.log(`differing pixels: ${above} above the lane line, ${below} below`);
console.log('rows with any diff, above the lane line:', ys.filter(y => y/a.dpr < 676).slice(0,40).join(','));
console.log('total differing rows:', ys.length, ' worldRow(y) = (y/dpr - topPad)/cellH ; topPad', a.topPad.toFixed(1), 'cellH', a.cellH.toFixed(2), 'dpr', a.dpr);
const top = ys.filter(y => y/a.dpr < 676).sort((p,q)=>rows.get(q)-rows.get(p)).slice(0,12);
for (const y of top){
  let x0=1e9,x1=-1;
  for (let x=0;x<a.w;x++){ const i=(y*a.w+x)*4; if (a.px[i]!==c.px[i]||a.px[i+1]!==c.px[i+1]||a.px[i+2]!==c.px[i+2]){ if(x<x0)x0=x; x1=x; } }
  console.log(`   y=${y} worldRow ${(((y/a.dpr)-a.topPad)/a.cellH).toFixed(2)}  ${rows.get(y)} px  x ${x0}..${x1}`);
}
await b.close();
