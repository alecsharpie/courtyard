#!/usr/bin/env node
/* probe: fold the year and read the bed ceiling. Two numbers per phase — bloomCap()
 * itself and the MEAN of bedCap(x,y) over every courtyard bed and every allotment bed —
 * then the largest step between adjacent samples (a cliff shows as a big one) and the
 * value exactly at SEASON_START. Pure clock + hash, no CA, so one page and no seeds.
 *
 *   node probe-bloomcap.mjs [pathToHtml] [label]
 */
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const FILE = resolve(process.argv[2] || 'courtyard.html');
const LABEL = process.argv[3] || 'HERE';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 720 } });
const errs = [];
page.on('pageerror', e => errs.push(String(e)));
await page.goto(`${pathToFileURL(FILE).href}?pause&seed=7&t=0`, { waitUntil: 'load' });
await page.waitForFunction(() => typeof window.__warp === 'function');
const r = await page.evaluate(() => {
  const N = 520, yearS = SEASON_LEN * DAY_LEN, rows = [];
  const court = [], allot = [];
  for (let y = 3; y < LN_WALK_S; y++) for (let x = 0; x < GW; x++){
    const t = grid[y * GW + x];
    if (t !== BED && t !== CBED) continue;
    (inAllotment(x, y) ? allot : court).push([x, y]);
  }
  const meanCap = cells => cells.reduce((a, [x, y]) => a + bedCap(x, y), 0) / cells.length;
  for (let i = 0; i < N; i++){
    // phase 0 is midwinter; SEASON_START sits at simT 0
    const t = ((i / N) - SEASON_START + 1) % 1 * yearS;
    window.__setTime(t);
    rows.push([i / N, warmth, bloomCap(), meanCap(court), meanCap(allot)]);
  }
  window.__setTime(0);
  const anchor = [seasonPhase, warmth, bloomCap(), meanCap(court)];
  return { rows, anchor, nCourt: court.length, nAllot: allot.length };
});
await browser.close();
if (errs.length){ console.error('PAGE ERROR', errs[0]); process.exit(1); }

const { rows, anchor } = r;
console.log(`\n=== ${LABEL}  (${FILE})  courtyard beds ${r.nCourt}, allotment beds ${r.nAllot}`);
console.log(`anchor: phase ${anchor[0]} warmth ${anchor[1]} bloomCap ${anchor[2]} mean bedCap(court) ${anchor[3].toFixed(3)}`);
const col = k => rows.map(r => r[k]);
const meanOf = a => a.reduce((x, y) => x + y, 0) / a.length;
const maxStep = a => { let m = 0, at = 0; for (let i = 1; i < a.length; i++){ const d = Math.abs(a[i] - a[i-1]); if (d > m){ m = d; at = i; } } return [m, rows[at][0]]; };
for (const [name, k] of [['bloomCap', 2], ['mean bedCap court', 3], ['mean bedCap allot', 4]]){
  const a = col(k), [m, at] = maxStep(a);
  console.log(`${name.padEnd(20)} year-mean ${meanOf(a).toFixed(4)}  min ${Math.min(...a).toFixed(3)}  max step ${m.toFixed(4)} at phase ${at.toFixed(3)}`);
}
console.log('\nphase  warmth  bloomCap  court  allot');
for (let i = 0; i < rows.length; i += 20){
  const [p, w, c, mc, ma] = rows[i];
  console.log(`${p.toFixed(3)}  ${w.toFixed(3)}   ${c.toFixed(3)}   ${mc.toFixed(3)}  ${ma.toFixed(3)}`);
}
