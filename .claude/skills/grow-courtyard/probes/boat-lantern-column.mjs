import { homedir } from 'node:os'; import { join } from 'node:path'; import { pathToFileURL } from 'node:url';
// #62 control for boat-lantern.mjs: the column under the hull vs a fixed lamp bar box vs bare water, each with drawRiverLights stubbed. A zero is evidence only if the test can be non-zero.
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const br = await chromium.launch();
const page = await br.newPage({ viewport:{width:1200,height:720} });
await page.goto(pathToFileURL(new URL('../../../../courtyard.html', import.meta.url).pathname).href + `?pause&seed=1&t=0`, { waitUntil:'load' });
await page.waitForFunction(() => typeof window.__warp === 'function');
const r = await page.evaluate(() => { window.__reseed(); window.__warp(256.5); drawScene(simT, 0);
  const cv=document.querySelector('canvas'), g=cv.getContext('2d');
  const stat=(B)=>{ const d=g.getImageData(B[0]*DPR,B[1]*DPR,B[2]*DPR,B[3]*DPR).data; let w=0, warmish=0, sum=0; for (let i=0;i<d.length;i+=4){ const L=(d[i]+d[i+1]+d[i+2])/3; sum+=L; if (d[i]-d[i+2]>40 && L>70) w++; if (d[i]-d[i+2]>15) warmish++; } return {warm:w, warmish, meanL:(sum/(d.length/4)).toFixed(1)}; };
  const [lx,ly]=BOAT_LAMP; const under=[Math.round(lx-1.5*cellW), Math.round(ly+0.6*cellW), Math.round(3*cellW), Math.round(3.5*cellH)];
  const L=RIVER_LAMPS[0]; const [px,py]=project(L[0],L[1]+0.4,0); const fixed=[Math.round(px-1.5*cellW), Math.round(py), Math.round(3*cellW), Math.round(6*cellH)];
  // and a bare-water control box far from any lamp
  const [wx,wy]=project((RIVER_X0+RIVER_X1)/2, 12, 0); const water=[Math.round(wx-1.5*cellW), Math.round(wy), Math.round(3*cellW), Math.round(3.5*cellH)];
  const before = {under:stat(under), fixed:stat(fixed), water:stat(water)};
  drawRiverLights = () => {}; drawScene(simT, 0);
  const stub = {under:stat(under), fixed:stat(fixed), water:stat(water)};
  return {cellW, cellH, veil:(1-cloudCover()).toFixed(2), lamps:RIVER_LAMPS.length, before, stub}; });
console.log(JSON.stringify(r, null, 1)); await br.close();
