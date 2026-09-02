/* Does every quarter have its sill? Two measures, both taken on the LIVE canvas so no
 * unpremultiplied cache pixel can confuse them (a raw RGB diff against gcv reads 4% of the
 * pot boxes as "overdrawn" on a build where nothing is: alpha there is 209-224).
 *   BAND     — below sillTop(): max luma, mean, share over 40. The painted surface is ~12.
 *   OVERPAINT— of the sill's own OPAQUE DARK pixels (cache luma < 20, alpha 255: the
 *              surface and the pot/cup silhouettes), the share that reads brighter than 40
 *              in the live frame. That is exactly "something living is drawn on the sill".
 * Night rows are the control: the band must still take the night's multiply.
 * usage: node probe-sill-cameras.mjs <file> <label> */
import path from 'path'; import { homedir } from 'node:os'; import { pathToFileURL } from 'node:url';
const PW = path.join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const REPO = path.resolve(new URL('.', import.meta.url).pathname, '../../../..');

const ART = path.resolve(process.argv[2] || path.join(REPO, 'courtyard.html')); const LABEL = process.argv[3] || 'cand';
const DAYS = [30, 12, 47];                                  // three days, so one still frame is not the finding
const br = await chromium.launch();
for (const [w,h] of [[1200,720],[1600,950],[390,844]]){
  const p = await br.newPage(); await p.setViewportSize({ width:w, height:h });
  await p.goto('file://' + ART + '?seed=7&t=0&pause'); await p.waitForTimeout(400);
  const rows = await p.evaluate((DAYS) => {
    const boxesOf = () => typeof sillBoxes === 'function' ? sillBoxes() : (() => {
      const sy = sillTop(), u = Math.max(5, cellW*0.7), cw = u*0.62;   // HEAD: same rects, its own u
      return [[0,sy,W,H-sy], ...[[W*0.055,1],[W*0.945,0.85]].map(([px,s]) =>
        [px-u*3.3*s, sy-u*4.3*s, u*6.6*s, u*4.3*s]), [W*0.5-cw-2, sy-u*1.15, cw+u*1.5+4, u*1.15]]; })();
    const L = (d,i) => 0.299*d[i] + 0.587*d[i+1] + 0.114*d[i+2];
    const acc = {};
    for (const day of DAYS) for (const [ph, off] of [['day', 24], ['night', 3]])
    for (let n = 0; n < QUARTERS.length; n++){
      __reseed(); __setTime(day*55 + off); __warp(0); __where(n, 3);
      drawScene(1, 1/30); drawScene(1, 1/30);
      const sy = sillTop(), y0 = Math.ceil(sy) + 6, hh = H - y0;
      const d = ctx.getImageData(0, y0*DPR, Math.floor(W*DPR), Math.floor(hh*DPR)).data;
      let mx=0, sum=0, cnt=0, br40=0;
      for (let i=0;i<d.length;i+=4){ const v=L(d,i); if(v>mx)mx=v; sum+=v; cnt++; if(v>40)br40++; }
      let dark=0, lit=0;
      for (const [x,y,bw,bh] of boxesOf()){
        const x0=Math.max(0,Math.floor(x*DPR)), yy0=Math.max(0,Math.floor(y*DPR));
        const x1=Math.min(cv.width,Math.ceil((x+bw)*DPR)), y1=Math.min(cv.height,Math.ceil((y+bh)*DPR));
        if (x1<=x0||y1<=yy0) continue;
        const a=ctx.getImageData(x0,yy0,x1-x0,y1-yy0).data;
        const b=gtx.getImageData(gview.pad*DPR+x0,yy0,x1-x0,y1-yy0).data;
        for (let i=0;i<a.length;i+=4){ if (b[i+3]===255 && L(b,i)<20){ dark++; if (L(a,i)>40) lit++; } }
      }
      const k = ph + '|' + QUARTERS[n].name;
      const o = acc[k] || (acc[k] = { ph, q:QUARTERS[n].name, s:+viewS.toFixed(2), mx:0, sum:0, cnt:0, br:0, dark:0, lit:0 });
      o.mx = Math.max(o.mx, mx); o.sum += sum; o.cnt += cnt; o.br += br40; o.dark += dark; o.lit += lit;
    }
    return Object.values(acc).map(o => ({ ph:o.ph, q:o.q, s:o.s, max:+o.mx.toFixed(1),
      mean:+(o.sum/o.cnt).toFixed(2), p40:+(100*o.br/o.cnt).toFixed(2),
      over:+(100*o.lit/o.dark).toFixed(2), darkPx:o.dark }));
  }, DAYS);
  console.log(`\n=== ${LABEL} ${w}x${h} (${DAYS.length} days) ===`);
  for (const r of rows)
    console.log(`  ${r.ph.padEnd(5)} ${r.q.padEnd(10)} s=${String(r.s).padEnd(5)} BAND max ${String(r.max).padStart(5)} mean ${String(r.mean).padStart(6)} >40 ${String(r.p40).padStart(5)}%  |  OVERPAINT ${String(r.over).padStart(6)}% of ${r.darkPx} dark sill px`);
  await p.close();
}
await br.close();
