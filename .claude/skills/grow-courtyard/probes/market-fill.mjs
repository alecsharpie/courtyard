#!/usr/bin/env node
/* probe: is the board's fill a switch? (b207, c287)
 * At every market latch over 6 seeds x 4 seasonal years, records the day's stock
 * (mkTotal), the capacity of the traders who turned out (mkOpenCount()*MK_GOODS),
 * what actually reached the boards (mkShelf.length) and the crates behind them.
 * Prints how often `shelved` sits exactly at the cap, and what the day would have
 * on hand at the pitch if the crates counted.
 */
import { homedir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const FILE = resolve(process.argv[2] || join(REPO, 'courtyard.html'));
const LABEL = process.argv[3] || 'HERE';
const PAGE = pathToFileURL(FILE).href;
const SEEDS = (process.env.SEEDS || '7,42,1234,900,77,314').split(',').map(Number);
const DAY = 55, DAYS = +(process.env.DAYS || 104), WARM = 8;

const browser = await chromium.launch();
const M = []; const errs = [];
for (const seed of SEEDS) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 720 } });
  page.on('pageerror', e => errs.push(String(e)));
  await page.goto(`${PAGE}?pause&seed=${seed}&t=0`, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof window.__warp === 'function');
  const rows = await page.evaluate(({ n }) => {
    window.__reseed();
    const out = []; let last = -1;
    for (let k = 0; k < n; k++) {
      window.__warp(1);
      if (mkDay !== last && mkDay >= 0) {
        last = mkDay;
        /* the FILL CURVE, sampled at a tenth, a half and nine tenths of the market's own
           span. HEAD has no mkFill, so it reports the switch it is: 1 all day. The point
           of the histogram below is that the middle of the range is REACHED — the premise
           was that no board could ever stand half stocked at any hour of any market. */
        const fill = typeof mkFill === 'function'
          ? [0.1, 0.5, 0.9].map(u => { const h0 = marketOpen(), h1 = marketClose(), keep = hour;
              hour = h0 + u * (h1 - h0); const v = +mkFill().toFixed(3); hour = keep; return v; })
          : [1, 1, 1];
        out.push({ day: mkDay, phase: seasonPhase, total: +mkTotal.toFixed(2),
          open: mkOpenCount(), cap: mkOpenCount() * MK_GOODS, shelf: mkShelf.length,
          crates: mkCrates.length, over: +mkOver.toFixed(2), fill,
          span: +(marketClose() - marketOpen()).toFixed(2) });
      }
    }
    return out;
  }, { n: Math.round((DAYS * DAY) / 1) });
  for (const r of rows) if (r.day >= WARM) M.push({ seed, ...r });
  await page.close();
}
await browser.close();
if (errs.length) { console.error('PAGE ERRORS', errs.slice(0, 3)); process.exit(1); }

const Q = ['midwinter', 'spring', 'midsummer', 'autumn'];
const qOf = p => Math.floor(((p + 0.125) % 1) * 4);
const med = a => { const s = [...a].sort((x, y) => x - y); return s[s.length >> 1]; };
console.log(`\n=== ${LABEL}: ${M.length} markets, ${SEEDS.length} seeds x ${DAYS}d ===`);
const atCap = M.filter(m => m.shelf >= m.cap).length;
const bare = M.filter(m => m.total < 1).length;
console.log(`shelved == cap on ${atCap}/${M.length} = ${(100 * atCap / M.length).toFixed(1)}%   (bare days total<1: ${bare})`);
console.log(`under cap: ${M.filter(m => m.shelf < m.cap).map(m => `${m.shelf}/${m.cap}`).join(' ') || 'none'}`);
// histogram of stock / capacity
const B = [0.5, 1, 1.5, 2, 3, 4, 6, 8, 99];
const h = new Array(B.length).fill(0);
for (const m of M) { const r = m.cap ? m.total / m.cap : 0; h[B.findIndex(b => r < b)]++; }
console.log('stock / board capacity:');
B.forEach((b, i) => h[i] && console.log(`   <${b}x  ${String(h[i]).padStart(4)}  ${'#'.repeat(Math.round(60 * h[i] / M.length))}`));
console.log('\nby season eighth (phase*8):  n  medTotal medCap medShelf medCrates  medOnHand(shelf+6*crates) medSpan');
for (let e = 0; e < 8; e++) {
  const g = M.filter(m => Math.floor(((m.phase + 0.0625) % 1) * 8) === e);
  if (!g.length) continue;
  console.log(`  ${e}: n=${String(g.length).padStart(3)}  ${String(med(g.map(m => m.total))).padStart(6)} ${String(med(g.map(m => m.cap))).padStart(4)} ${String(med(g.map(m => m.shelf))).padStart(4)} ${String(med(g.map(m => m.crates))).padStart(4)}      ${String(med(g.map(m => m.shelf + 6 * m.crates))).padStart(4)}     ${med(g.map(m => m.span))}`);
}
const onh = M.map(m => m.shelf + 6 * m.crates).sort((a, b) => a - b);
const q = f => onh[Math.min(onh.length - 1, Math.floor(f * onh.length))];
console.log(`\non-hand at the pitch (shelf + crates): min ${onh[0]}  q1 ${q(0.25)}  med ${q(0.5)}  q3 ${q(0.75)}  d9 ${q(0.9)}  max ${onh[onh.length - 1]}`);
const sp = M.map(m => m.span).sort((a, b) => a - b);
console.log(`market span hours: min ${sp[0]}  med ${sp[sp.length >> 1]}  max ${sp[sp.length - 1]}`);

/* Is the fill a switch or a gradient? Every market's board, at a tenth, a half and nine
   tenths of its own span. HEAD answers 1.000 in all three columns on all 144 markets. */
const FB = [0.001, 0.15, 0.35, 0.55, 0.75, 0.95, 1.01];
console.log('\nboard fill through the market (0 = bare, 1 = full):');
console.log('   u        <0.15  <0.35  <0.55  <0.75  <0.95   full     mean');
[0.1, 0.5, 0.9].forEach((u, j) => {
  const v = M.map(m => m.fill[j]), h = new Array(FB.length).fill(0);
  for (const x of v) h[FB.findIndex(b => x < b)]++;
  const cells = [h[0] + h[1], h[2], h[3], h[4], h[5], h[6]].map(n => String(n).padStart(6)).join(' ');
  console.log(`  ${u.toFixed(1)}  ${cells}   ${(v.reduce((a, b) => a + b, 0) / v.length).toFixed(3)}`);
});
const mid = M.filter(m => m.fill.some(f => f > 0.05 && f < 0.95)).length;
console.log(`markets that stand PART stocked at one of the three hours: ${mid}/${M.length} = ${(100*mid/M.length).toFixed(1)}%`);
