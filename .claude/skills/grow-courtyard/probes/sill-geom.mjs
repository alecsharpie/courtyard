#!/usr/bin/env node
/* Where the near-roof apron actually lands relative to sillTop(), and how much of the
 * band is genuinely flat. The brief claims the whole band is uniform 8.4; check that. */
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
const REPO = fileURLToPath(new URL('../../../../', import.meta.url));
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const PAGE = pathToFileURL(resolve(REPO, process.argv[2] || 'courtyard.html')).href;
const SIZES = (process.env.SIZES || '1200x720,1600x950,390x844').split(',').map(s => s.split('x').map(Number));
const browser = await chromium.launch();
for (const [w, h] of SIZES) {
  const c = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const p = await c.newPage(); p.on('pageerror', e => console.log('PAGE ERROR', String(e)));
  await p.goto(`${PAGE}?seed=42&t=0&pause`, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof window.__warp === 'function');
  const r = await p.evaluate(() => {
    window.__reseed(); window.__warp(175); drawScene(simT, 1 / 30);
    const sy = sillTop(), dpr = DPR;
    // the apron's own geometry, for the first near span
    const [sx0, sx1] = NEAR_SPANS[0];
    const l = project(sx0, WH, 0), l4 = project(sx0, WH - 4, 0);
    const Lx = l[0] + (l[0] - l4[0]) * 4;
    // nearShadow's own span, recomputed here so the probe does not trust the page
    const rampTop = Math.max(project(0, LN_WALK_S, 0)[1] + 1,
      Math.min(project(0, WH, 0)[1] - cellH, sy - Math.max(cellH * 3.5, (H - sy) * 0.6)));
    // flatness of the band, excluding the lit edge + shadow line (top 6 css px)
    const y0 = Math.round((sy + 6) * dpr), y1 = Math.round(H * dpr);
    const img = ctx.getImageData(0, y0, Math.round(W * dpr), y1 - y0).data;
    let mn = 1e9, mx = -1e9, sum = 0, n = 0;
    for (let i = 0; i < img.length; i += 4) {
      const L = 0.299*img[i] + 0.587*img[i+1] + 0.114*img[i+2];
      mn = Math.min(mn, L); mx = Math.max(mx, L); sum += L; n++;
    }
    // pot visibility: is the geranium findable ABOVE the sill line?
    const px = (x, y) => { const d = ctx.getImageData(Math.round(x*dpr), Math.round(y*dpr), 1, 1).data;
                           return +(0.299*d[0] + 0.587*d[1] + 0.114*d[2]).toFixed(1); };
    const u = Math.max(5, cellW * 0.7), ph = u * 1.25;
    const potRow = [], bareRow = [];
    for (let x = 0; x < 90; x++) { potRow.push(px(W*0.055 - 45 + x, sy - 2)); bareRow.push(px(W*0.25 - 45 + x, sy - 2)); }
    return { W, H, sy: +sy.toFixed(1), band: +(H - sy).toFixed(1), cellH: +cellH.toFixed(2),
             apronTop: +l[1].toFixed(1), apronTopMinusSy: +(l[1] - sy).toFixed(1),
             rampTop: +rampTop.toFixed(1), rampPx: +(sy - rampTop).toFixed(1), rampGuardFires: rampTop >= sy - 1,
             u: +u.toFixed(2), ph: +ph.toFixed(2), potTop: +(sy - ph).toFixed(1), potBase: +(sy + 3).toFixed(1),
             flatSubBand: { min:+mn.toFixed(1), max:+mx.toFixed(1), mean:+(sum/n).toFixed(1), range:+(mx-mn).toFixed(1), n },
             potRowRange: +(Math.max(...potRow) - Math.min(...potRow)).toFixed(1),
             bareRowRange: +(Math.max(...bareRow) - Math.min(...bareRow)).toFixed(1),
             potRowMin: Math.min(...potRow), bareRowMin: Math.min(...bareRow) };
  });
  console.log(`\n=== ${w}x${h}`); console.log(JSON.stringify(r, null, 1));
  await c.close();
}
await browser.close();
