#!/usr/bin/env node
/* "Something is standing on it" is not a per-column DIFF against HEAD — at a pot column
 * the opaque silhouette covers the band in BOTH versions, so that column changed LESS
 * than a bare one and the test reads backwards. The signal is the CAST SHADOW: inside
 * the candidate, is the surface under a pot darker than the surface beside it, over the
 * same rows? Run on HEAD too, where the answer must be exactly 0 (one flat fill). */
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
const REPO = fileURLToPath(new URL('../../../../', import.meta.url));
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const HEADP = '/tmp/sill-head.html';
writeFileSync(HEADP, execFileSync('git', ['show', 'HEAD:courtyard.html'], { cwd: REPO, maxBuffer: 1 << 28 }));
const browser = await chromium.launch();
for (const [w, h] of [[1200,720],[1600,950],[390,844]]) {
  for (const [tag, page] of [['HEAD', HEADP], ['CAND', resolve(REPO,'courtyard.html')]]) {
    const c = await browser.newContext({ viewport:{width:w,height:h}, deviceScaleFactor:1 });
    const p = await c.newPage(); p.on('pageerror', e => console.log('PAGE ERROR', String(e)));
    await p.goto(`${pathToFileURL(page).href}?seed=42&t=0&pause`, { waitUntil:'load' });
    await p.waitForFunction(() => typeof window.__warp === 'function');
    const r = await p.evaluate(() => {
      window.__reseed(); window.__warp(175); drawScene(simT,1/30);
      const sy = sillTop(), B = H - sy, dpr = DPR;
      // the shadow zone: below the objects' feet, in the half the light still reaches
      const y0 = Math.round((sy + B*0.10)*dpr), y1 = Math.round((sy + B*0.48)*dpr);
      const img = ctx.getImageData(0, y0, Math.round(W*dpr), y1-y0);
      const cols = img.width, rows = img.height, d = img.data, cm = new Float64Array(cols);
      for (let y=0;y<rows;y++) for (let x=0;x<cols;x++){ const i=(y*cols+x)*4;
        cm[x] += 0.299*d[i]+0.587*d[i+1]+0.114*d[i+2]; }
      for (let x=0;x<cols;x++) cm[x] /= rows;
      const seg = (f, halfFrac) => { const c0 = cols*f, hw = cols*halfFrac; let s=0,n=0;
        for (let x=Math.max(0,Math.round(c0-hw)); x<Math.min(cols,Math.round(c0+hw)); x++){ s+=cm[x]; n++; }
        return +(s/n).toFixed(2); };
      // beside = the surface flanking each object, same rows
      return { sy:+sy.toFixed(1), B:+B.toFixed(1),
        potL: seg(0.055,0.010), potL_beside: (seg(0.115,0.012)+seg(0.0,0.008))/2,
        cup:  seg(0.500,0.006), cup_beside:  (seg(0.455,0.010)+seg(0.545,0.010))/2,
        potR: seg(0.945,0.010), potR_beside: (seg(0.885,0.012)+seg(1.0,0.008))/2 };
    });
    const f = (a,b) => `${a.toFixed(2)} vs beside ${b.toFixed(2)}  (delta ${(a-b).toFixed(2)})`;
    console.log(`${w}x${h} ${tag}  potL ${f(r.potL,r.potL_beside)} | cup ${f(r.cup,r.cup_beside)} | potR ${f(r.potR,r.potR_beside)}`);
    await c.close();
  }
}
await browser.close();
