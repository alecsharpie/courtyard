/* probe: is the weed DRAWN, and how much of the frame is it at the shipping size?
 * FULL minus FULL-with-rank-zeroed, same page, same instant — plus a SAME-CODE control
 * for the floor. Also reports the rank field so a 0 is separable from NOT MEASURED. */
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const FILE = resolve(process.argv[2] || fileURLToPath(new URL('../../../../courtyard.html', import.meta.url)));
const browser = await chromium.launch();
const VIEWS = [['wide', 1600, 950], ['phone', 390, 844], ['short', 1200, 720]];
const CASES = (process.env.CASES || '7:600,42:900,1234:1200,99:400,7:1350').split(',').map(s => s.split(':').map(Number));
console.log('view       seed  warp   rankBeds rankPlots  changed px   mean|d|   maxd   | control');
for (const [vn, W, H] of VIEWS){
  for (const [seed, warp] of CASES){
    const page = await browser.newPage({ viewport: { width: W, height: H } });
    const errs=[]; page.on('pageerror', e=>errs.push(String(e)));
    await page.goto(pathToFileURL(FILE).href + `?pause&seed=${seed}&t=0`, { waitUntil: 'load' });
    await page.waitForFunction(() => typeof window.__warp === 'function');
    const r = await page.evaluate(w => {
      const grab = () => Array.from(cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data);
      window.__reseed(); window.__warp(w);
      const cen = window.__census().structure;
      groundDirty = true; drawGround(); drawScene(simT, 0); const a = grab();
      groundDirty = true; drawGround(); drawScene(simT, 0); const ctl = grab();   // same code, same instant
      const keep = rank.slice();
      rank.fill(0); groundDirty = true; drawGround(); drawScene(simT, 0); const b = grab();
      rank.set(keep); groundDirty = true;
      const diff = (p, q) => { let n=0, sum=0, mx=0;
        for (let i=0;i<p.length;i+=4){
          const d = Math.abs(p[i]-q[i]) + Math.abs(p[i+1]-q[i+1]) + Math.abs(p[i+2]-q[i+2]);
          if (d > 6){ n++; sum += d; if (d>mx) mx=d; } }
        return [n, n?sum/n:0, mx]; };
      return { rb: cen.rankBeds, rp: cen.rankPlots, feat: diff(a,b), ctl: diff(a,ctl) };
    }, warp);
    if (errs.length) console.error('PAGE ERROR', errs[0]);
    console.log(`${vn.padEnd(8)} ${String(seed).padStart(5)} ${String(warp).padStart(5)}`
      + `   ${String(r.rb).padStart(6)} ${String(r.rp).padStart(7)}`
      + `   ${String(r.feat[0]).padStart(9)}  ${r.feat[1].toFixed(1).padStart(7)}  ${String(r.feat[2]).padStart(5)}`
      + `   | ${String(r.ctl[0]).padStart(6)}`);
    await page.close();
  }
}
await browser.close();
