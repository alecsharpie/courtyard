#!/usr/bin/env node
/* probe: the plaza, cropped, at a wet shoulder vs the end of a dry summer, and against
 * HEAD at the same instant. Warped from the same start at a pinned seed; the canvas is
 * drawn inside the evaluate so nothing is unpinned by rAF. */
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const SHOTS = fileURLToPath(new URL('../../../../shots/', import.meta.url));
const SEED = 42;
/* The control is regenerated HERE, every run: a /tmp fixture is whatever LAST wrote it,
 * and a control that is actually a stale candidate reports the candidate's numbers. */
const HEAD_FILE = '/tmp/moss-shots-head.html';
writeFileSync(HEAD_FILE, execFileSync('git', ['show', 'HEAD:courtyard.html'],
  { cwd: fileURLToPath(new URL('../../../../', import.meta.url)), maxBuffer: 1 << 26 }));
// warmth 0.44 rising into the wet shoulder vs warmth ~1 at the end of the dry summer
/* An instant is a PHASE as well as an hour: each of these warps to a target season and
 * then on to the next 10:00, so the four samples differ in the year and in nothing else. */
const WHEN = [['spring', 1347.5], ['midsummer', 1787.5], ['autumn', 2227.5], ['midwinter', 2502.5]];
/* two paving-only bands, so the seasonal comparison is not the plaza's four trees leafing
 * out: MID is open square between the north trees' crowns and the fountain, EDGE is the
 * sheltered strip along the south wall. HEAD reads ~0 green in both, at every phase. */
/* y 20..27 spans the square between the north trees' crowns and the fountain: its two
 * outer COLUMNS are the sheltered joints against the terrace and the quay, the rest is
 * open square. y 54..60 is open paving with one sheltered row at its foot. */
const BANDS = [['mid', 20, 27], ['open', 54, 60]];
const browser = await chromium.launch();
async function run(file, label){
  const errs = [];
  for (const [name, t] of WHEN){
    // __warp advances BY t, so one sample per page: reusing a page makes each target the
    // SUM of the ones before it, and the four samples land in four unrelated years
    const page = await browser.newPage({ viewport: { width: 1600, height: 950 }, deviceScaleFactor: 1 });
    page.on('pageerror', e => errs.push(String(e)));
    await page.goto(pathToFileURL(resolve(file)).href + `?pause&seed=${SEED}&t=0`, { waitUntil: 'load' });
    await page.waitForFunction(() => typeof window.__warp === 'function');
    const r = await page.evaluate(({ t, BANDS }) => {
      window.__reseed();
      window.__warp(t);
      let guard = 0;                                   // ...then on to the next 10:00, simulated, never jumped
      while (guard++ < 400 && !(hour > 10 && hour < 10.4)) window.__warp(0.2);
      groundDirty = true; drawScene(simT, 1 / 30);
      // crop the plaza in CANVAS space, and count green pixels in it
      const a = project(PLAZA_X0 - 0.5, 2.5, 0), b = project(PLAZA_X1 + 0.5, 61.5, 0);
      const x0 = Math.round(Math.min(a[0], b[0]) * DPR), y0 = Math.round(Math.min(a[1], b[1]) * DPR);
      const w = Math.round(Math.abs(b[0] - a[0]) * DPR), h = Math.round(Math.abs(b[1] - a[1]) * DPR);
      const cx = cv.getContext('2d');
      const isGreen = d => d[1] > d[0] + 6 && d[1] > d[2] + 16 && d[1] < 190;
      const d = cx.getImageData(x0, y0, w, h).data;
      let green = 0, n = 0;
      for (let i = 0; i < d.length; i += 4){ n++; if (isGreen(d.subarray(i, i + 4))) green++; }
      const bands = {};
      for (const [bn, by0, by1] of BANDS){
        const p = project(PLAZA_X0, by0, 0), q = project(PLAZA_X1, by1, 0);
        const bx = Math.round(Math.min(p[0], q[0]) * DPR), byy = Math.round(Math.min(p[1], q[1]) * DPR);
        const bw = Math.round(Math.abs(q[0] - p[0]) * DPR), bh = Math.round(Math.abs(q[1] - p[1]) * DPR);
        const bd = cx.getImageData(bx, byy, bw, bh).data;
        let g = 0, bnn = 0;
        for (let i = 0; i < bd.length; i += 4){ bnn++; if (isGreen(bd.subarray(i, i + 4))) g++; }
        bands[bn] = +(100 * g / bnn).toFixed(2);
      }
      let mossy = 0, sum = 0;
      if (typeof moss !== 'undefined')
        for (let y = 3; y < 61; y++) for (let x = PLAZA_X0; x < PLAZA_X1; x++){
          const i = y * GW + x; if (grid[i] !== PATH) continue;
          sum += moss[i]; if (moss[i] > 1/6) mossy++;
        }
      return { box: [x0/DPR, y0/DPR, w/DPR, h/DPR], green, n, bands, mossy, sum: +sum.toFixed(1),
               warmth: +warmth.toFixed(3), simT: +simT.toFixed(1), hour: +hour.toFixed(2),
               wet: +wetF().toFixed(2), snow: +snowCover.toFixed(2) };
    }, { t, BANDS });
    const rect = await page.evaluate(() => { const r = cv.getBoundingClientRect(); return { x: r.x, y: r.y }; });
    const buf = await page.screenshot({ clip: { x: rect.x + r.box[0], y: rect.y + r.box[1], width: r.box[2], height: r.box[3] } });
    writeFileSync(join(SHOTS, `b103-plaza-${name}-${label}.png`), buf);
    console.log(`${label.padEnd(5)} ${name.padEnd(10)} t ${String(r.simT).padStart(6)} warmth ${String(r.warmth).padStart(5)} hour ${r.hour} wet ${r.wet} snow ${r.snow} | `
      + `green px ${(100*r.green/r.n).toFixed(2)}%  mid ${String(r.bands.mid).padStart(5)}%  open ${String(r.bands.open).padStart(5)}%  mossy ${String(r.mossy).padStart(3)}  sum ${r.sum}`);
    await page.close();
  }
  if (errs.length) console.log('  ERRORS', errs[0]);
}
await run(HEAD_FILE, 'HEAD');
await run(fileURLToPath(new URL('../../../../courtyard.html', import.meta.url)), 'CAND');
await browser.close();
