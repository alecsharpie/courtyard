#!/usr/bin/env node
/* probe: does the bonfire's SMOKE COLUMN read at 1x? (b104)
 *
 * The census cannot see a draw-only vector, and a screenshot is an opinion. So: warp to a
 * burning instant on a real kindle day, draw the frame, then draw the SAME frame with
 * bon.fire/bon.ember forced to 0 — the only difference is the fire. Count pixels in the
 * column's own box (z 2.5..7.5 over the heap, i.e. above the flames and the halo) whose
 * luma moved, and by how much.
 *
 *   node bonfire-column.mjs [pathToHtml] [label]
 *
 * Reads at deviceScaleFactor 1 on purpose: this is the "at 1x" question.
 */
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const FILE = resolve(process.argv[2] || fileURLToPath(new URL('../../../../courtyard.html', import.meta.url)));
const LABEL = process.argv[3] || 'HERE';
const PAGE = pathToFileURL(FILE).href;
// seed/day pairs that HEAD's bonfire-year run reports as real kindles
const CASES = (process.env.CASES || '7:12,3:12,11:12,21:12,42:12,99:13,1234:15,21:13').split(',')
  .map(s => { const [seed, day] = s.split(':').map(Number); return { seed, day }; });
const DAY = 55;

const browser = await chromium.launch();
const rows = [];
for (const { seed, day } of CASES) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 720 }, deviceScaleFactor: 1 });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(`${PAGE}?pause&seed=${seed}&t=0`, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof window.__warp === 'function');
  const r = await page.evaluate(({ targetDay }) => {
    window.__reseed();
    // walk to the moment this day's fire is at full flame
    let guard = 0;
    while (guard++ < 4000 && !(day === targetDay && bon.fire > 0.85)) window.__warp(0.5);
    if (!(bon.fire > 0.85)) return { ok: false };
    const at = { hour: +hour.toFixed(2), fire: +bon.fire.toFixed(3), ember: +bon.ember.toFixed(3),
                 night: +nightF.toFixed(3), day };
    // the column's own box: the plume's world extent at z 2.5..7.5, generously in x
    const pts = [];
    for (const z of [2.5, 7.5]) for (const dx of [-3.5, 3.5]) pts.push(project(BONFIRE.x + dx, BONFIRE.y - 0.5, z));
    const x0 = Math.max(0, Math.floor(Math.min(...pts.map(p => p[0])))), x1 = Math.min(cv.width, Math.ceil(Math.max(...pts.map(p => p[0]))));
    const y0 = Math.max(0, Math.floor(Math.min(...pts.map(p => p[1])))), y1 = Math.min(cv.height, Math.ceil(Math.max(...pts.map(p => p[1]))));
    const w = x1 - x0, h = y1 - y0;
    const grab = () => { drawScene(simT, 1 / 30); return ctx.getImageData(x0, y0, w, h).data; };
    const withFire = grab();
    const f = bon.fire, e = bon.ember, on = bon.on;
    bon.fire = 0; bon.ember = 0; bon.on = false;
    const noFire = grab();
    bon.fire = f; bon.ember = e; bon.on = on;
    let n2 = 0, n6 = 0, n12 = 0, sum = 0, peak = 0;
    for (let i = 0; i < withFire.length; i += 4) {
      const la = 0.299 * withFire[i] + 0.587 * withFire[i + 1] + 0.114 * withFire[i + 2];
      const lb = 0.299 * noFire[i] + 0.587 * noFire[i + 1] + 0.114 * noFire[i + 2];
      const d = Math.abs(la - lb);
      if (d > 2) { n2++; sum += d; }
      if (d > 6) n6++;
      if (d > 12) n12++;
      if (d > peak) peak = d;
    }
    return { ok: true, at, box: [x0, y0, w, h], px: w * h, n2, n6, n12, peak: +peak.toFixed(1), mean: +(sum / Math.max(1, n2)).toFixed(2) };
  }, { targetDay: day });
  if (errs.length) { console.error(`seed ${seed}: PAGE ERROR`, errs[0]); process.exitCode = 1; }
  rows.push({ seed, day, ...r });
  await page.close();
}
await browser.close();

console.log(`\n=== ${LABEL}  (${FILE})   column box at 1x, fire-on minus fire-off`);
console.log('seed  day  hour  fire   box(px)   |d|>2   |d|>6  |d|>12   peak  mean|d|');
const agg = { n2: [], n6: [], n12: [], peak: [] };
for (const r of rows) {
  if (!r.ok) { console.log(`${String(r.seed).padStart(4)} d${r.day}  — no fire reached`); continue; }
  console.log(`${String(r.seed).padStart(4)} d${r.day}  ${r.at.hour.toFixed(1).padStart(5)}  ${r.at.fire.toFixed(2)}  ${String(r.px).padStart(7)}  ${String(r.n2).padStart(6)}  ${String(r.n6).padStart(6)}  ${String(r.n12).padStart(6)}  ${String(r.peak).padStart(5)}  ${String(r.mean).padStart(6)}`);
  agg.n2.push(r.n2); agg.n6.push(r.n6); agg.n12.push(r.n12); agg.peak.push(r.peak);
}
const med = a => { const s = [...a].sort((x, y) => x - y); return s.length ? s[s.length >> 1] : 0; };
console.log(`\nmedian: |d|>2 ${med(agg.n2)} px · |d|>6 ${med(agg.n6)} px · |d|>12 ${med(agg.n12)} px · peak ${med(agg.peak)}`);
console.log(`A column a person can see from across the town wants a few hundred px past |d|>6, not a handful.`);
