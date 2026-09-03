#!/usr/bin/env node
/* pane-figures.mjs — is anybody at a window, and how many at once?
 *
 * The subject is RENDER state (LIT_PANES is a screen register, rebuilt per frame), so the
 * census cannot see it and must not: census fields are town state (LAWS). This probe asks
 * the two questions the brief asks. It draws ONCE to fill WINDOWS[]/ROOF_LIGHTS[] — the
 * pane addresses — then sweeps the clock with __setTime and evaluates windowLit() and
 * paneFigure() directly, which is the predicate under test and costs no frames.
 *
 *   node probes/pane-figures.mjs [days] [seeds...]
 */
import { homedir } from 'node:os';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DAYS = +(process.argv[2] || 30);
const SEEDS = process.argv.slice(3).map(Number);
const seeds = SEEDS.length ? SEEDS : [42, 7, 101, 2024];
const DAY = 55;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1600, height: 950 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
page.on('pageerror', e => { console.error('  PAGE ERROR: ' + e); process.exitCode = 1; });

const rows = [];
for (const seed of seeds) {
  await page.goto(pathToFileURL(resolve(REPO, 'courtyard.html')).href + `?pause&t=0&seed=${seed}`);
  await page.waitForFunction(() => typeof window.__warp === 'function');
  const r = await page.evaluate(({ DAYS, DAY }) => {
    __reseed(); __warp(30); drawScene(simT, 1 / 30);          // fill WINDOWS[] / ROOF_LIGHTS[]
    const addrs = WINDOWS.map(w => [w[4], w[5]]).concat(ROOF_LIGHTS.map(r => [r[1], r[2]]));
    const STEP = DAY / 240;                                    // 0.1 sim-hours
    let litSum = 0, figSum = 0, n = 0, maxFig = 0, dayLit = 0, dayFig = 0, dayN = 0;
    const hist = new Array(12).fill(0);
    const nights = new Map();                                  // nid -> figure-samples
    for (let t = 0; t < DAYS * DAY; t += STEP) {
      __setTime(t);
      let lit = 0, fig = 0;
      for (const [sa, sb] of addrs) if (windowLit(sa, sb)) { lit++; if (paneFigure(sa, sb)) fig++; }
      if (nightF > 0.3) {
        litSum += lit; figSum += fig; n++; if (fig > maxFig) maxFig = fig;
        hist[Math.min(fig, 11)]++;
        const nid = nightAt().nid;
        nights.set(nid, (nights.get(nid) || 0) + fig);
      } else { dayLit += lit; dayFig += fig; dayN++; }
    }
    const emptyNights = [...nights.values()].filter(v => v === 0).length;
    return { hist, lit: litSum / n, fig: figSum / n, maxFig, n, panes: addrs.length,
             dayLit: dayLit / dayN, dayFig: dayFig / dayN, nights: nights.size, emptyNights };
  }, { DAYS, DAY });
  rows.push([seed, r]);
}
await browser.close();

console.log(`\n  ${DAYS} sim days x ${seeds.length} seeds, sampled every 0.1 sim-hour. ${rows[0][1].panes} pane addresses.\n`);
console.log('  seed     lit/night   figures/night   max at once   nights   EMPTY nights   lit by day   figs by day');
let anyEmpty = 0, anyDay = 0;
for (const [seed, r] of rows) {
  anyEmpty += r.emptyNights; anyDay += r.dayFig;
  console.log(`  ${String(seed).padEnd(7)} ${r.lit.toFixed(2).padStart(8)} ${r.fig.toFixed(2).padStart(14)} ${String(r.maxFig).padStart(13)} ${String(r.nights).padStart(8)} ${String(r.emptyNights).padStart(14)} ${r.dayLit.toFixed(2).padStart(12)} ${r.dayFig.toFixed(2).padStart(13)}`);
}
console.log('\n  share of night time with N panes occupied (seed ' + rows[0][0] + '):');
console.log('   N   ' + rows[0][1].hist.map((_, i) => String(i).padStart(6)).join(''));
console.log('   %   ' + rows[0][1].hist.map(v => (100 * v / rows[0][1].n).toFixed(1).padStart(6)).join(''));
console.log(`\n  daylight figures ${anyDay.toFixed(2)} (must be 0.00) · empty nights ${anyEmpty} (must be 0)`);
process.exit(anyDay > 0 || anyEmpty > 0 ? 1 : (process.exitCode || 0));
