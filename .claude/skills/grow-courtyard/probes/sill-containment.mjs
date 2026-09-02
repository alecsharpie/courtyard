/* Containment: where does the WIDE frame differ from HEAD at all? Prints the bounding box
 * and the worst pixel of the difference, so "the hash moved" becomes "these rows moved". */
import path from 'path'; import { homedir } from 'node:os'; import { pathToFileURL } from 'node:url';
const PW = path.join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
import { execSync } from 'node:child_process';
// the HEAD fixture regenerates itself: a stale /tmp copy is a control that is not a control
const REPO = path.resolve(new URL('.', import.meta.url).pathname, '../../../..');
const HEAD = '/tmp/head-courtyard.html';
execSync(`git -C ${REPO} show HEAD:courtyard.html > ${HEAD}`);
const br = await chromium.launch();
const grab = async (file, w, h, n) => {
  const p = await br.newPage(); await p.setViewportSize({ width:w, height:h });
  await p.goto('file://' + path.resolve(file) + '?seed=7&t=0&pause'); await p.waitForTimeout(350);
  const b = await p.evaluate((n) => { __reseed(); __setTime(30*55+24); __warp(0); __where(n,3);
    drawScene(1,1/30); drawScene(1,1/30);
    return Array.from(ctx.getImageData(0,0,cv.width,cv.height).data); }, n);
  const dims = await p.evaluate(() => ({ w: cv.width, h: cv.height, sy: sillTop(), dpr: DPR }));
  await p.close(); return { b, dims };
};
for (const [w,h] of [[1200,720],[1600,950]]) for (const n of [0]){
  const A = await grab(HEAD, w, h, n), B = await grab(path.join(REPO, 'courtyard.html'), w, h, n);
  let y0=1e9,y1=-1,x0=1e9,x1=-1,worst=0,cnt=0;
  for (let i=0;i<A.b.length;i+=4){
    const d = Math.max(Math.abs(A.b[i]-B.b[i]), Math.abs(A.b[i+1]-B.b[i+1]), Math.abs(A.b[i+2]-B.b[i+2]));
    if (d>0){ const px=(i/4)%A.dims.w, py=(i/4/A.dims.w)|0; cnt++;
      if(py<y0)y0=py; if(py>y1)y1=py; if(px<x0)x0=px; if(px>x1)x1=px; if(d>worst)worst=d; }
  }
  console.log(`${w}x${h} q${n}  sillTop=${A.dims.sy.toFixed(2)} dpr=${A.dims.dpr}  differing px ${cnt}  rows ${y0}..${y1}  cols ${x0}..${x1}  worst Δ ${worst}`);
}
await br.close();
