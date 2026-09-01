#!/usr/bin/env node
/* HEAD vs candidate over the sill band: regenerates HEAD from git INSIDE the probe (a
 * /tmp fixture is whatever last wrote it), renders both at the same pinned instant, and
 * asks two questions the row profile cannot:
 *   (1) are the pots and the cup FINDABLE in the difference image — i.e. does the diff
 *       have mass at their columns and not merely everywhere;
 *   (2) at every hour sampled, does the band still read clearly darker than the roof.
 */
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
const TIMES = (process.env.TIMES || '175,205,232,247').split(',').map(Number);
const SIZES = (process.env.SIZES || '1200x720,390x844').split(',').map(s => s.split('x').map(Number));

async function grab(browser, page, w, h, T) {
  const c = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const p = await c.newPage(); p.on('pageerror', e => console.log('PAGE ERROR', String(e)));
  await p.goto(`${pathToFileURL(page).href}?seed=42&t=0&pause`, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof window.__warp === 'function');
  const r = await p.evaluate(T => {
    window.__reseed(); window.__warp(T); drawScene(simT, 1 / 30);
    const sy = Math.round(sillTop()), dpr = DPR;
    const band = ctx.getImageData(0, sy * dpr, Math.round(W * dpr), Math.round((H - sy) * dpr));
    // the roof strip just above the sill, for the "still darker than the roof" test
    const roof = ctx.getImageData(0, Math.round((sy - 26) * dpr), Math.round(W * dpr), Math.round(20 * dpr)).data;
    let rs = 0, rn = 0;
    for (let i = 0; i < roof.length; i += 4) { rs += 0.299*roof[i] + 0.587*roof[i+1] + 0.114*roof[i+2]; rn++; }
    return { sy, dpr, W: Math.round(W * dpr), Hb: Math.round((H - sy) * dpr),
             hour: +hour.toFixed(2), daylight: +daylight.toFixed(2),
             roofMean: +(rs / rn).toFixed(1), data: Array.from(band.data) };
  }, T);
  await c.close(); return r;
}
const browser = await chromium.launch();
for (const [w, h] of SIZES) {
  console.log(`\n##### ${w}x${h}`);
  for (const T of TIMES) {
    const A = await grab(browser, resolve(REPO, 'courtyard.html'), w, h, T);
    const Bh = await grab(browser, HEADP, w, h, T);
    const lum = d => { const o = new Float64Array(d.length / 4);
      for (let i = 0, j = 0; i < d.length; i += 4, j++) o[j] = 0.299*d[i] + 0.587*d[i+1] + 0.114*d[i+2]; return o; };
    const la = lum(A.data), lb = lum(Bh.data);
    const stat = l => { let mn = 1e9, mx = -1e9, s = 0; for (const v of l) { mn = Math.min(mn,v); mx = Math.max(mx,v); s += v; }
                        return { min:+mn.toFixed(1), max:+mx.toFixed(1), mean:+(s/l.length).toFixed(1), range:+(mx-mn).toFixed(1) }; };
    // per-column mean |diff|, to ask WHERE the change has mass
    const cols = A.W, rows = A.Hb, colD = new Float64Array(cols);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) colD[x] += Math.abs(la[y*cols+x] - lb[y*cols+x]);
    for (let x = 0; x < cols; x++) colD[x] /= rows;
    const at = f => +colD[Math.round(cols * f)].toFixed(1);
    const win = (f, halfPx) => { const c0 = Math.round(cols*f); let s = 0, n = 0;
      for (let x = Math.max(0,c0-halfPx); x < Math.min(cols,c0+halfPx); x++) { s += colD[x]; n++; } return +(s/n).toFixed(1); };
    const sa = stat(la), sb = stat(lb);
    console.log(`  t=${T} hour ${A.hour} daylight ${A.daylight}`);
    console.log(`    band  HEAD ${JSON.stringify(sb)}\n          CAND ${JSON.stringify(sa)}`);
    console.log(`    roof-above mean HEAD ${Bh.roofMean} CAND ${A.roofMean}  |  band mean CAND ${sa.mean}  -> roof/band ratio ${(A.roofMean/sa.mean).toFixed(1)}x`);
    console.log(`    per-column mean|d|: potL(5.5%) ${win(0.055, 18)}  cup(50%) ${win(0.5, 12)}  potR(94.5%) ${win(0.945, 18)}  |  bare(25%) ${win(0.25, 18)} bare(75%) ${win(0.75, 18)}`);
  }
}
await browser.close();
