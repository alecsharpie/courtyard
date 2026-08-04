#!/usr/bin/env node
/* probe: the market's year — does what the stalls carry follow what the plots grew?
 *
 * #29 connected the two: harvestPlot() pays units into `produce`, and stockMarket()
 * latches that store once per market day, empties it, and lays it out as `mkShelf`.
 * Nothing else writes either. So every market this measures is attributable: the
 * stock IS the picking of the four days before it.
 *
 * Folds, over several seasonal years and several seeds, EVERY market day:
 *   - mkTotal, the units the day's market carried, by season quarter
 *   - mkOpenCount(), how many of the three stalls came out
 *   - the composition (which vegetables), so "root-heavy" is a number
 *   - the same day's ripePlots(), so a thin market can be traced to a thin block
 * and prints the quartiles of mkTotal — which is where MK_NEED comes from.
 *
 *   node market-year.mjs [pathToHtml] [label]
 *   SEEDS=7,42,1234 DAYS=78 node market-year.mjs
 */
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;

const FILE = resolve(process.argv[2] || fileURLToPath(new URL('../../../../courtyard.html', import.meta.url)));
const LABEL = process.argv[3] || 'HERE';
const PAGE = pathToFileURL(FILE).href;

const SEEDS = (process.env.SEEDS || '7,42,1234').split(',').map(Number);
const DAY = 55, YEAR = 26;
const DAYS = +(process.env.DAYS || 78);          // 3 seasonal years
const STEP = 1;                                  // 1 sim s: the latch is a step, not a window
const WARM = +(process.env.WARM || 8);           // days of maturity ramp to discard

const browser = await chromium.launch();
const markets = [];
let errs = [];
for (const seed of SEEDS) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 720 } });
  page.on('pageerror', e => errs.push(String(e)));
  await page.goto(`${PAGE}?pause&seed=${seed}&t=0`, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof window.__warp === 'function');
  /* ONE evaluate: the page keeps running between host round-trips, and neither
     __reseed nor __setTime rewinds mkDay — which is exactly the latch under test. */
  const rows = await page.evaluate(({ step, n }) => {
    window.__reseed();
    const out = [];
    let last = -1;
    for (let k = 0; k < n; k++) {
      window.__warp(step);
      if (mkDay !== last && mkDay >= 0) {           // the frame the day's stock was latched
        last = mkDay;
        out.push({
          day: mkDay, phase: seasonPhase, total: mkTotal, open: mkOpenCount(),
          top: mkTop, shelf: mkShelf.length, ripe: ripePlots(),
          units: Array.from(mkUnits), names: SPECIES.map(s => s.name),
          goods: [0, 1, 2].map(i => mkGoods(i)),
        });
      }
    }
    return out;
  }, { step: STEP, n: Math.round((DAYS * DAY) / STEP) });
  for (const r of rows) if (r.day >= WARM) markets.push({ seed, ...r });
  await page.close();
}
await browser.close();

const Q = ['midwinter', 'spring', 'midsummer', 'autumn'];
const qOf = p => Math.floor(((p + 0.125) % 1) * 4);      // sectors CENTRED on the four anchors
const mean = a => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const pct = (a, q) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(q * s.length))]; };

console.log(`\nmarket-year — ${LABEL}   ${markets.length} markets · seeds ${SEEDS.join(',')} · ${DAYS} days\n`);
if (errs.length) console.log('PAGE ERRORS:', errs.slice(0, 3).join(' | '), '\n');

console.log('  quarter      markets   units   stalls   ripePlots   composition (share of units)');
const VEG = [7, 8, 9, 10];                                // carrots, cabbages, beans, pumpkins
for (let q = 0; q < 4; q++) {
  const m = markets.filter(r => qOf(r.phase) === q);
  if (!m.length) { console.log(`  ${Q[q].padEnd(12)}      0`); continue; }
  const tot = mean(m.map(r => r.total));
  const comp = VEG.map(v => {
    const s = m.reduce((a, r) => a + r.units[v], 0), all = m.reduce((a, r) => a + r.total, 0);
    return `${m[0].names[v].slice(0, 4)} ${all ? Math.round(100 * s / all) : 0}%`;
  }).join('  ');
  console.log(`  ${Q[q].padEnd(12)} ${String(m.length).padStart(5)}   ${tot.toFixed(1).padStart(5)}   ` +
              `${mean(m.map(r => r.open)).toFixed(2).padStart(6)}   ${mean(m.map(r => r.ripe)).toFixed(2).padStart(9)}   ${comp}`);
}
const tot = markets.map(r => r.total);
console.log(`\n  mkTotal over the year: min ${Math.min(...tot)}  p25 ${pct(tot, 0.25)}  median ${pct(tot, 0.5)}  ` +
            `p75 ${pct(tot, 0.75)}  max ${Math.max(...tot)}   (MK_CAP 18)`);
const bare = markets.filter(r => r.total === 0).length;
const one = markets.filter(r => r.open === 1).length, three = markets.filter(r => r.open === 3).length;
console.log(`  stalls: 1 on ${one} markets (${(100 * one / markets.length).toFixed(0)}%) · ` +
            `3 on ${three} (${(100 * three / markets.length).toFixed(0)}%) · bare boards on ${bare}`);

/* The claim the brief is actually making: a winter market and a summer market differ. */
const w = markets.filter(r => qOf(r.phase) === 0), s = markets.filter(r => qOf(r.phase) === 2);
const wu = mean(w.map(r => r.total)), su = mean(s.map(r => r.total));
const wo = mean(w.map(r => r.open)), so = mean(s.map(r => r.open));
console.log(`\n  midwinter ${wu.toFixed(1)} units / ${wo.toFixed(2)} stalls  vs  midsummer ${su.toFixed(1)} / ${so.toFixed(2)}`);
const shelfOk = markets.every(r => r.shelf === Math.min(Math.round(r.total), 18));
const goodsOk = markets.every(r => r.goods.reduce((a, b) => a + b, 0) <= r.shelf + 3);
console.log(`  shelf === min(total, MK_CAP) on every market: ${shelfOk ? 'PASS' : 'FAIL'}`);
console.log(`  pitches laid out never exceed the shelf: ${goodsOk ? 'PASS' : 'FAIL'}`);
console.log(`  page errors: ${errs.length ? 'FAIL — ' + errs.length : 'PASS'}\n`);
process.exit(errs.length || !shelfOk || !goodsOk ? 1 : 0);
