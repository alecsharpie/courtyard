#!/usr/bin/env node
/* probe: a contact sheet of ONE FULL SEASONAL YEAR, cropped to the courtyard linden —
 * 26 frames, one per sim day, all at the SAME hour, so season is the only axis that
 * moves. This is the "region-cropped filmstrip" a seasonal vector needs: filmstrip.mjs
 * measures a whole-frame mean and is loud about the sky and the light, both of which
 * swing hugely over a year, so it cannot tell you whether the TREES crossed smoothly.
 *
 * Two caveats worth knowing before you read the delta column:
 *   - the crop contains lawn, beds and walkers, so its frame-to-frame delta floors at
 *     ~3-11/255 of ordinary churn even when leafOut is pinned at 1.00. Read the SHEET
 *     for the canopy; the number is only good for spotting a step far above that floor.
 *   - samples are a full sim day apart (55 s), which is ~1/26 of the year. For the
 *     per-frame question, leafOut is piecewise linear in a phase that is linear in
 *     simT, and every blob radius grows from zero at its own threshold, so the crossing
 *     is continuous by construction — canopy-year.mjs reports the largest step.
 *
 *   node year-strip.mjs        -> shots/year-strip-linden.png
 */
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 950 }, deviceScaleFactor: 2 });
await page.goto(pathToFileURL(fileURLToPath(new URL('../../../../courtyard.html', import.meta.url))).href + '?pause&seed=42&t=0', { waitUntil: 'load' });
await page.waitForFunction(() => typeof window.__warp === 'function');
// 26 samples, one per day at the SAME hour (noon) = exactly one seasonal year
const N = 26, shots = [];
await page.evaluate(() => { window.__reseed(); window.__warp(24 * 55 + 13.75); });
for (let i = 0; i < N; i++) {
  if (i) await page.evaluate(() => window.__warp(55));
  const info = await page.evaluate(() => {
    const [cx, cy] = project(CX, CY + 0.5, 5.6);
    const c = document.getElementById('cv'), g = c.getContext('2d');
    const X = Math.round(cx - 78), Y = Math.round(cy - 62);
    return { season: +season().toFixed(3), out: +leafOut().toFixed(2), hour: +hour.toFixed(2),
             px: g.getImageData(X, Y, 156, 124).data.length ? [...g.getImageData(X, Y, 156, 124).data] : [] };
  });
  const clip = await page.evaluate(() => {
    const [cx, cy] = project(CX, CY + 0.5, 5.6);
    const r = document.getElementById('cv').getBoundingClientRect();
    return { x: r.x + cx - 78, y: r.y + cy - 62, width: 156, height: 124 };
  });
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  const buf = (await page.screenshot({ clip })).toString('base64');
  shots.push({ ...info, buf });
}
// crop-local frame-to-frame delta — the region-cropped filmstrip, as a number
console.log('  i  season   out   crop Δ (mean abs, 0..255) — CROPPED TO THE LINDEN');
let maxD = 0;
for (let i = 0; i < N; i++) {
  let d = 0;
  if (i) { const a = shots[i].px, b = shots[i - 1].px;
    let s = 0; for (let k = 0; k < a.length; k += 4) s += Math.abs(a[k] - b[k]) + Math.abs(a[k+1] - b[k+1]) + Math.abs(a[k+2] - b[k+2]);
    d = s / (a.length / 4) / 3; }
  maxD = Math.max(maxD, d);
  console.log(`  ${String(i).padStart(2)}  ${shots[i].season.toFixed(3)}  ${shots[i].out.toFixed(2)}  ${d.toFixed(2).padStart(6)} ${'#'.repeat(Math.round(d))}`);
}
console.log(`\n  max crop Δ between consecutive DAYS: ${maxD.toFixed(2)} / 255`);
// contact sheet
const html = `<body style="margin:0;background:#e9e4da;font:11px system-ui">
<div style="display:grid;grid-template-columns:repeat(7,156px);gap:4px;padding:6px">
${shots.map(s => `<div><img src="data:image/png;base64,${s.buf}" style="width:156px;display:block"><div style="text-align:center">ph ${s.season.toFixed(2)} · out ${s.out.toFixed(2)}</div></div>`).join('')}
</div></body>`;
const p2 = await browser.newPage({ viewport: { width: 1140, height: 600 } });
await p2.setContent(html);
await p2.waitForTimeout(400);
await p2.screenshot({ path: fileURLToPath(new URL('../../../../shots/year-strip-linden.png', import.meta.url)), fullPage: true });
await browser.close();
console.log('  -> shots/year-strip-linden.png');
