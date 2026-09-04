#!/usr/bin/env node
/* probe-pane-truncation.mjs — does a visit at a window get to FINISH?
 *
 * `windowLit()` owns the lamp's hours; `paneFigure()` solves the visit over its own
 * FIG_T0..FIG_T1 band. Neither asks the other, so a lamp can go out under a figure at
 * s = 0.4 and the figure does not leave — it ceases. This counts that.
 *
 * METHOD. Draw ONCE to fill WINDOWS[]/ROOF_LIGHTS[] (the pane addresses), then sweep the
 * clock with __setTime and ask the two predicates directly — no re-derivation of either,
 * the page's own functions answer. For each pane, a RUN is a maximal stretch of samples
 * where paneFigure() != null: one visit. A run is
 *   CLEAN     every sample of it lit         — the figure arrives and leaves
 *   CUT       lit at the start, dark at the end — the lamp went out under it
 *   LATE      dark at the start, lit later     — it pops in mid-crossing
 *   UNSEEN    never lit at all                 — offered to a dark room, never drawn
 * (CUT and LATE can both be true of one run; it is counted in both and once in `broken`.)
 *
 *   node probes/pane-truncation.mjs [days] [seeds...]
 */
import { homedir } from 'node:os';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DAYS = +(process.argv[2] || 26);
const SEEDS = process.argv.slice(3).map(Number);
const seeds = SEEDS.length ? SEEDS : [42, 7, 101, 2024, 5, 88];
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
    const STEP = DAY / 480;                                    // 0.05 sim-hours
    const open = new Map();                                    // pane key -> run in progress
    let clean = 0, cut = 0, late = 0, unseen = 0, broken = 0, runs = 0;
    let cutFrac = 0, worstCut = 0;                             // share of a cut run left undrawn
    // occupancy, on #182's own definition, so the cost of the fix is priced in its numbers
    let litSum = 0, figSum = 0, n = 0; const hist = new Array(6).fill(0);
    const nights = new Map();
    const closeRun = (key, run) => {
      runs++;
      const anyLit = run.lit > 0, headDark = !run.firstLit, tailDark = !run.lastLit;
      if (!anyLit) { unseen++; return; }
      const isCut = tailDark, isLate = headDark;
      if (isCut) { cut++; const f = run.tailDarkN / run.len; cutFrac += f; if (f > worstCut) worstCut = f; }
      if (isLate) late++;
      if (isCut || isLate) broken++; else clean++;
    };
    for (let t = 0; t < DAYS * DAY; t += STEP) {
      __setTime(t);
      const night = nightF > 0.3;
      let lit = 0, fig = 0;
      for (const [sa, sb] of addrs) {
        const key = sa * 1000 + sb;
        const isLit = night && windowLit(sa, sb);
        const f = night && paneFigure(sa, sb) ? 1 : 0;
        if (isLit) { lit++; if (f) fig++; }
        let run = open.get(key);
        if (f) {
          if (!run) { run = { len: 0, lit: 0, firstLit: isLit, lastLit: isLit, tailDarkN: 0 }; open.set(key, run); }
          run.len++; run.lastLit = isLit;
          if (isLit) { run.lit++; run.tailDarkN = 0; } else run.tailDarkN++;
        } else if (run) { closeRun(key, run); open.delete(key); }
      }
      if (night) {
        litSum += lit; figSum += fig; n++; hist[Math.min(fig, 5)]++;
        const nid = nightAt().nid; nights.set(nid, (nights.get(nid) || 0) + fig);
      }
    }
    for (const [key, run] of open) closeRun(key, run);
    const emptyNights = [...nights.values()].filter(v => v === 0).length;
    return { runs, clean, cut, late, unseen, broken, worstCut,
             cutFrac: cut ? cutFrac / cut : 0,
             lit: litSum / n, fig: figSum / n, hist: hist.map(h => h / n),
             nights: nights.size, emptyNights, panes: addrs.length };
  }, { DAYS, DAY });
  rows.push([seed, r]);
}
await browser.close();

const P = (a, k) => a.reduce((s, [, r]) => s + r[k], 0);
const M = (a, k) => P(a, k) / a.length;
console.log(`\n  ${DAYS} sim days x ${seeds.length} seeds, sampled every 0.05 sim-hour. ${rows[0][1].panes} pane addresses.\n`);
console.log('  seed     visits   CLEAN     CUT    LATE  UNSEEN   cut loses   lit/night   figs/night   0 / 1 / 2+');
for (const [seed, r] of rows) {
  const h = r.hist;
  console.log(`  ${String(seed).padEnd(7)} ${String(r.runs).padStart(7)} ${String(r.clean).padStart(7)}` +
    ` ${String(r.cut).padStart(7)} ${String(r.late).padStart(7)} ${String(r.unseen).padStart(7)}` +
    `   ${(100 * r.cutFrac).toFixed(1).padStart(6)}%   ${r.lit.toFixed(2).padStart(9)}   ${r.fig.toFixed(2).padStart(10)}` +
    `   ${(100 * h[0]).toFixed(0)}/${(100 * h[1]).toFixed(0)}/${(100 * (1 - h[0] - h[1])).toFixed(0)}%`);
}
const runs = P(rows, 'runs'), cut = P(rows, 'cut'), late = P(rows, 'late'), unseen = P(rows, 'unseen'), broken = P(rows, 'broken');
console.log(`\n  POOLED  ${runs} visits: ${P(rows, 'clean')} clean, ${cut} CUT SHORT (${(100 * cut / runs).toFixed(1)}%),` +
  ` ${late} LATE (${(100 * late / runs).toFixed(1)}%), ${unseen} UNSEEN (${(100 * unseen / runs).toFixed(1)}%)`);
console.log(`  BROKEN  ${broken} of ${runs} = ${(100 * broken / runs).toFixed(1)}%   ·   a cut visit loses ${(100 * M(rows, 'cutFrac')).toFixed(1)}% of itself on average, worst ${(100 * Math.max(...rows.map(([, r]) => r.worstCut))).toFixed(0)}%`);
console.log(`  COST    occupied ${M(rows, 'fig').toFixed(2)} of ${M(rows, 'lit').toFixed(2)} lit   ·   empty nights ${P(rows, 'emptyNights')} of ${P(rows, 'nights')}\n`);
