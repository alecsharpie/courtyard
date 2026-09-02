/* #119 containment. farOpen() needs day >= 1, so at day 0 neither build has spawned a
 * far agent and the two have made an IDENTICAL sequence of R() draws — the route change
 * cannot have shifted the stream yet. Anything that differs at day 0 is my DRAW. */
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const ROOT = process.cwd();
writeFileSync('/tmp/head-courtyard.html', execSync('git show HEAD:courtyard.html', { cwd: ROOT, maxBuffer: 1 << 26 }));
const B = { HEAD:'/tmp/head-courtyard.html', tree: join(ROOT,'courtyard.html') };
const b = await chromium.launch();
const grab = async (file, seed, T) => {
  const pg = await (await b.newContext({viewport:{width:1600,height:950}})).newPage();
  await pg.goto(pathToFileURL(file).href + `?pause&seed=${seed}`); await pg.waitForTimeout(700);
  const r = await pg.evaluate(T => { __reseed(); __setTime(0);
    while (simT < T - 0.02) __warp(Math.min(0.25, T - simT));
    drawScene(simT, 1/30);
    const g = cv.getContext('2d');
    return { day, hour:+hour.toFixed(2), far:agents.filter(a=>a.far).length,
             W:cv.width, H:cv.height, DPR,
             px: Array.from(g.getImageData(0,0,cv.width,cv.height).data) }; }, T);
  await pg.close(); return r;
};
const SEEDS = [7, 42, 3];
for (const seed of SEEDS){
  const T = 6;                                   // day 0, hour ~8.6 — full light, no far agent has ever existed
  const [h, t] = [await grab(B.HEAD, seed, T), await grab(B.tree, seed, T)];
  // per-pixel diff, bucketed by whether the pixel is inside the far-bank east strip
  const pg = await (await b.newContext({viewport:{width:1600,height:950}})).newPage();
  await pg.goto(pathToFileURL(B.tree).href + `?pause&seed=${seed}`); await pg.waitForTimeout(500);
  const box = await pg.evaluate(() => { const a = project(133,2,0), c = project(141.5,61,0);
    return {x0:Math.round(a[0]), y0:Math.round(a[1])-20, x1:Math.round(c[0]), y1:Math.round(c[1])}; });
  await pg.close();
  let inN=0, inC=0, outN=0, outC=0, outPeak=0, inSum=0;
  for (let i = 0, p = 0; i < h.px.length; i += 4, p++){
    const x = (p % h.W) / h.DPR, y = ((p / h.W) | 0) / h.DPR;
    const d = (Math.abs(h.px[i]-t.px[i]) + Math.abs(h.px[i+1]-t.px[i+1]) + Math.abs(h.px[i+2]-t.px[i+2]))/3;
    const inside = x >= box.x0 && x <= box.x1 && y >= box.y0 && y <= box.y1;
    if (inside){ inN++; inSum += d; if (d > 6) inC++; }
    else { outN++; if (d > 6) outC++; if (d > outPeak) outPeak = d; }
  }
  console.log(`seed ${String(seed).padStart(2)}  day ${t.day} hour ${t.hour}  far agents ${h.far}/${t.far}`);
  console.log(`   far-bank east strip : ${(100*inC/inN).toFixed(2)}% of ${inN} px changed, meanD ${(inSum/inN).toFixed(2)}`);
  console.log(`   ALL THE REST        : ${(100*outC/outN).toFixed(2)}% of ${outN} px changed, peak ${outPeak.toFixed(0)}`);
}
await b.close();
