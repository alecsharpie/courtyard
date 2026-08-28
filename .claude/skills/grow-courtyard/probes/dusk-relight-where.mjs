/* WHERE is the dusk Δ? Replays filmstrip's world (seed 7, ?t=0, __warp T0, then GAP steps) and
 * splits each frame's mean Δ into six screen rows AND into the cached ground layer alone,
 * so a whole-frame number can be pinned to sky / live tint / cache step. #48 used it to
 * show the 5–9 winter-dusk Δ is the live sky + night tint, not the bucket (ground ≈ 0.4).
 *   node dusk-relight-where.mjs [file] [T0=1183] [gap=0.35]   (gap 0.0167 = one 60fps frame) */
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const file = resolve(process.argv[2] || new URL('../../../../courtyard.html', import.meta.url).pathname); const T0 = +(process.argv[3] || 1183); const GAP = +(process.argv[4] || 0.35);
const b = await chromium.launch();
const p = await b.newPage({ viewport:{width:1600, height:950} });
p.on('pageerror', e => console.log('PAGE ERROR', e.message));
await p.goto(pathToFileURL(file).href + '?seed=7&t=0&pause');
await p.waitForFunction(() => window.__warp);
const out = await p.evaluate(async ([T0, GAP]) => {
  const cv = document.querySelector('canvas');
  const g = document.createElement('canvas'), ROWS = 6; g.width = 160; g.height = 96;
  const gx = g.getContext('2d', {willReadFrequently:true});
  const grabCv = () => { gx.clearRect(0,0,160,96); gx.drawImage(cv, 0, 0, 160, 96); return gx.getImageData(0,0,160,96).data; };
  const grabGround = () => { gx.clearRect(0,0,160,96); const f = (typeof groundFade==='function')?groundFade():1;
    if (f < 1){ gx.drawImage(gprev,0,0,160,96); gx.globalAlpha=f; gx.drawImage(gcv,0,0,160,96); gx.globalAlpha=1; } else gx.drawImage(gcv,0,0,160,96);
    return gx.getImageData(0,0,160,96).data; };
  const frame = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  window.__reseed(); window.__warp(T0); await frame();
  let pc = grabCv(), pg = grabGround(); const rows = [];
  for (let i = 1; i < 12; i++){
    window.__warp(GAP); await frame();
    const c = grabCv(), gr = grabGround();
    const rowD = new Array(ROWS).fill(0); let tot = 0, gt = 0;
    for (let k = 0; k < c.length; k += 4){ const y = Math.floor((k/4)/160), r = Math.floor(y/16);
      const d = (Math.abs(c[k]-pc[k])+Math.abs(c[k+1]-pc[k+1])+Math.abs(c[k+2]-pc[k+2]))/3; rowD[r] += d; tot += d;
      gt += (Math.abs(gr[k]-pg[k])+Math.abs(gr[k+1]-pg[k+1])+Math.abs(gr[k+2]-pg[k+2]))/3; }
    rows.push({ i, hour: hour.toFixed(3), lb: lightBucket, fade: (typeof groundFade==='function'?groundFade():1).toFixed(2), all: (tot/(160*96)).toFixed(2), ground: (gt/(160*96)).toFixed(2), rows: rowD.map(v => (v/(160*16)).toFixed(1)).join(' ') });
    pc = c; pg = gr;
  }
  return rows;
}, [T0, GAP]);
for (const r of out) console.log(JSON.stringify(r));
await b.close();
