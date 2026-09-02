/* The near roofs SURFACE, measured: horizontal luma sd down the band, the bands mean
 * luma, and a changed-pixel share against a same-code control floor. The gate #125 was
 * written to. Regenerate the fixture first: git show HEAD:courtyard.html > /tmp/head.html
 *   node probes/near-roof-texture.mjs [fileA] [fileB]   (default /tmp/head.html courtyard.html)
 * Read sd/mean, not sd: nearShadows ramp reaches ~0.6 alpha by the sill and multiplies
 * contrast as well as luma, so absolute sd MUST fall toward the viewer whatever is drawn. */
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const A = process.argv[2] || '/tmp/head.html', B = process.argv[3] || 'courtyard.html';
const T = 345.47;                                 // day 6, phase 0.492 (midsummer), hour 12.75
const SIZES = [[1600, 950], [390, 844]];
const browser = await chromium.launch();

async function grab(file, w, h){
  const ctx = await browser.newContext({ viewport:{width:w, height:h}, deviceScaleFactor:1 });
  const p = await ctx.newPage();
  await p.goto(pathToFileURL(resolve(process.cwd(), file)).href + `?seed=42&t=${T}&pause`, { waitUntil:'load' });
  await p.waitForFunction(() => typeof window.__warp === 'function');
  const r = await p.evaluate(() => {
    __reseed(); drawScene(simT, 1/30);
    const g = cv.getContext('2d');
    // the band: the parapet's coping down to the sill, over the WEST half of the block
    const yTop = Math.round(project(60, PARA_Y, PARA_Z)[1]);
    const yBot = Math.round(sillTop());
    const rows = [];
    for (let f = 0.04; f < 1; f += 0.06){
      const py = Math.round(yTop + (yBot - yTop) * f);
      const wy = (py - topPad) / cellH;
      const x0 = Math.max(0, Math.round(project(1, wy, 0)[0]));
      const x1 = Math.min(cv.width - 1, Math.round(project(QUAY_X0 - 1, wy, 0)[0]));
      if (x1 - x0 < 40 || py < 0 || py >= cv.height) continue;
      const d = g.getImageData(x0, py, x1 - x0, 1).data;
      const L = []; for (let i = 0; i < d.length; i += 4) L.push(0.299*d[i] + 0.587*d[i+1] + 0.114*d[i+2]);
      const m = L.reduce((a,b)=>a+b,0) / L.length;
      const sd = Math.sqrt(L.reduce((a,b)=>a+(b-m)*(b-m),0) / L.length);
      rows.push({ f:+f.toFixed(2), py, n:L.length, mean:+m.toFixed(1), sd:+sd.toFixed(1) });
    }
    const box = { x:Math.max(0, Math.round(project(1, (yTop-topPad)/cellH, 0)[0])), y:yTop,
                  w:0, h:Math.max(1, yBot - yTop) };
    box.w = Math.min(cv.width, Math.round(project(QUAY_X0 - 1, (yBot-topPad)/cellH, 0)[0])) - box.x;
    const px = g.getImageData(box.x, box.y, box.w, box.h).data;
    let sum = 0; for (let i = 0; i < px.length; i += 4) sum += 0.299*px[i] + 0.587*px[i+1] + 0.114*px[i+2];
    return { rows, box, bandMean:+(sum / (px.length/4)).toFixed(2),
             dry: { snow:+snowCover.toFixed(3), raining, wet:+wetF().toFixed(3), warmth:+warmth.toFixed(2), hour:+hour.toFixed(2), day },
             px:[...px] };
  });
  await ctx.close();
  return r;
}
function diffShare(a, b){
  let n = 0, tot = a.px.length/4;
  for (let i = 0; i < a.px.length; i += 4){
    const dl = Math.abs((0.299*a.px[i]+0.587*a.px[i+1]+0.114*a.px[i+2]) - (0.299*b.px[i]+0.587*b.px[i+1]+0.114*b.px[i+2]));
    if (dl > 3) n++;
  }
  return +(100*n/tot).toFixed(1);
}
for (const [w, h] of SIZES){
  const a1 = await grab(A, w, h), a2 = await grab(A, w, h), b1 = await grab(B, w, h);
  console.log(`\n=== ${w}x${h} ===  dry:`, JSON.stringify(a1.dry), 'band', JSON.stringify(a1.box));
  console.log('  f     py       HEAD mean/sd   sd/mean      TREE mean/sd   sd/mean');
  for (let i = 0; i < a1.rows.length; i++){
    const r = a1.rows[i], t = b1.rows[i] || {};
    const cv = q => (q.sd / q.mean).toFixed(3);
    console.log(`  ${String(r.f).padEnd(5)} ${String(r.py).padEnd(5)} ${String(r.mean).padStart(7)} / ${String(r.sd).padStart(5)}   ${cv(r)}   ${String(t.mean).padStart(7)} / ${String(t.sd).padStart(5)}   ${cv(t)}`);
  }
  const sdA = a1.rows.map(r=>r.sd), sdB = b1.rows.map(r=>r.sd);
  const av = a => +(a.reduce((x,y)=>x+y,0)/a.length).toFixed(1);
  console.log(`  sd  HEAD min ${Math.min(...sdA)} max ${Math.max(...sdA)} mean ${av(sdA)}   TREE min ${Math.min(...sdB)} max ${Math.max(...sdB)} mean ${av(sdB)}`);
  console.log(`  band mean luma  HEAD ${a1.bandMean}  TREE ${b1.bandMean}   (must not RISE)`);
  console.log(`  changed-pixel share   control(HEAD vs HEAD) ${diffShare(a1,a2)}%   TREE vs HEAD ${diffShare(a1,b1)}%`);
}
await browser.close();
