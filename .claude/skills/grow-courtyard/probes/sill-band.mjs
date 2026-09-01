#!/usr/bin/env node
/* probe: the bottom band. Reads the CANVAS (not the page) below sillTop() at a pinned
 * instant, and prints (a) whole-band luma min/max/mean/range, (b) a per-row profile
 * across the roof->apron->sill transition, (c) the pot and cup columns against a
 * bare-sill column, so "the pots cannot be seen" becomes a number.
 *   node probe-sill.mjs [pathToHtml] ; SIZES=1200x720,390x844 ; TIMES=175
 */
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
const REPO = fileURLToPath(new URL('../../../../', import.meta.url));
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const PAGE = pathToFileURL(resolve(REPO, process.argv[2] || 'courtyard.html')).href;
const SIZES = (process.env.SIZES || '1200x720,1600x950,390x844').split(',').map(s => s.split('x').map(Number));
const TIMES = (process.env.TIMES || '175').split(',').map(Number);
const browser = await chromium.launch();
for (const [w, h] of SIZES) for (const T of TIMES) {
  const c = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const p = await c.newPage(); p.on('pageerror', e => console.log('PAGE ERROR', String(e)));
  await p.goto(`${PAGE}?seed=42&t=0&pause`, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof window.__warp === 'function');
  const r = await p.evaluate(T => {
    window.__reseed(); window.__warp(T); drawScene(simT, 1 / 30);
    const sy = Math.round(sillTop()), dpr = DPR;
    const px = (x, y) => { const d = ctx.getImageData(Math.round(x*dpr), Math.round(y*dpr), 1, 1).data;
                           return 0.299*d[0] + 0.587*d[1] + 0.114*d[2]; };
    // (a) whole band
    const img = ctx.getImageData(0, sy*dpr, Math.round(W*dpr), Math.round((H-sy)*dpr)).data;
    let mn = 1e9, mx = -1e9, sum = 0, n = 0, above20 = 0;
    for (let i = 0; i < img.length; i += 4) {
      const L = 0.299*img[i] + 0.587*img[i+1] + 0.114*img[i+2];
      mn = Math.min(mn, L); mx = Math.max(mx, L); sum += L; n++; if (L > 20) above20++;
    }
    // (b) row profile through the transition, at a bare x (25% of W, between pot and cup)
    const bx = W * 0.25, rows = [];
    for (let y = sy - 14; y < H; y += 1) rows.push([y - sy, +px(bx, y).toFixed(1)]);
    // (c) columns: pot-left, cup-centre, bare
    const cols = {};
    for (const [name, x] of [['potL', W*0.055], ['cup', W*0.5], ['bare', W*0.25], ['potR', W*0.945]]) {
      const v = []; for (let y = sy - 12; y < H; y++) v.push(+px(x, y).toFixed(1));
      cols[name] = { min: Math.min(...v), max: Math.max(...v), range: +(Math.max(...v)-Math.min(...v)).toFixed(1) };
    }
    return { W, H, dpr, sy, bandPx: H - sy, bandPct: +((H-sy)/H*100).toFixed(1),
             hour: +hour.toFixed(2), daylight: +daylight.toFixed(2), nightF: +nightF.toFixed(2),
             cellW: +cellW.toFixed(2), u: +Math.max(5, cellW*0.7).toFixed(2),
             band: { min:+mn.toFixed(1), max:+mx.toFixed(1), mean:+(sum/n).toFixed(1), range:+(mx-mn).toFixed(1), n, above20 },
             rows, cols };
  }, T);
  console.log(`\n=== ${w}x${h} t=${T} hour ${r.hour} daylight ${r.daylight} nightF ${r.nightF} | sillTop ${r.sy} band ${r.bandPx}px ${r.bandPct}% | cellW ${r.cellW} u ${r.u}`);
  console.log('  BAND', JSON.stringify(r.band));
  console.log('  cols', JSON.stringify(r.cols));
  console.log('  row profile (dy from sillTop -> luma at x=0.25W):');
  console.log('   ', r.rows.map(([d, l]) => `${d}:${l}`).join(' '));
  await c.close();
}
await browser.close();
