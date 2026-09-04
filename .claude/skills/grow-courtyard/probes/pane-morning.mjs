#!/usr/bin/env node
/* pane-morning.mjs — is anybody behind the panes that burn BEFORE dawn?
 *
 * #190 lifted lampBurn() out of windowLit and made every offered visit land inside the
 * lamp's own EVENING burn. windowLit's other branch — the sunrise-keyed early risers —
 * was never offered a paneFigure at all, so first light is lit windows with nobody in
 * them. This probe splits the night in two and prices each half separately, so a change
 * to the morning can be shown not to have moved the evening #190 hand-tuned.
 *
 * The split is off PRIMITIVES, not off a constant this build defines: the morning burn's
 * widest possible extent is [span - D - 2.2, span] night-hours (D = dawnEdge() - sunUp),
 * so a sample with t >= span - 2.6 is MORNING and anything earlier is EVENING. Both HEAD
 * and the candidate label the same samples.
 *
 * A VISIT is a maximal run of samples where paneFigure() != null for one pane; it is
 * attributed to the half its FIRST sample fell in.
 *
 *   node .claude/skills/grow-courtyard/probes/pane-morning.mjs [days] [--file=path]   (git show <ref>:courtyard.html > .probe-head.html) [seeds...]
 */
import { homedir } from 'node:os';
import { resolve, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const REPO = fileURLToPath(new URL('../../../../', import.meta.url));
const argv = process.argv.slice(2);
const fileArg = (argv.find(a => a.startsWith('--file=')) || '').slice(7);
const rest = argv.filter(a => !a.startsWith('--'));
const DAYS = +(rest[0] || 104);
const seeds = rest.slice(1).map(Number).length ? rest.slice(1).map(Number) : [42, 7, 101, 2024, 5, 909];
const FILE = fileArg ? resolve(fileArg) : resolve(REPO, 'courtyard.html');
const DAY = 55;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1600, height: 950 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
page.on('pageerror', e => { console.error('  PAGE ERROR: ' + e); process.exitCode = 1; });

const agg = { ev: { lit: 0, fig: 0, n: 0, hist: [0, 0, 0, 0, 0, 0], visits: 0 },
              mo: { lit: 0, fig: 0, n: 0, hist: [0, 0, 0, 0, 0, 0], visits: 0 },
              nights: 0, moNightsAny: 0, panes: 0 };
for (const seed of seeds) {
  await page.goto(pathToFileURL(FILE).href + `?pause&t=0&seed=${seed}`);
  await page.waitForFunction(() => typeof window.__warp === 'function');
  const r = await page.evaluate(({ DAYS, DAY }) => {
    __reseed(); __warp(30); drawScene(simT, 1 / 30);           // fill WINDOWS[] / ROOF_LIGHTS[]
    const addrs = WINDOWS.map(w => [w[4], w[5]]).concat(ROOF_LIGHTS.map(r => [r[1], r[2]]));
    const STEP = DAY / 240;                                    // 0.1 sim-hours
    const ev = { lit: 0, fig: 0, n: 0, hist: [0, 0, 0, 0, 0, 0], visits: 0 };
    const mo = { lit: 0, fig: 0, n: 0, hist: [0, 0, 0, 0, 0, 0], visits: 0 };
    const lastU = new Map();                                   // pane -> u while a visit runs; a run
                                                               // ends at a dark pane as at an empty one
    const nights = new Set(), moNights = new Set();
    for (let t = 0; t < DAYS * DAY; t += STEP) {
      __setTime(t);
      if (!(nightF > 0.3)) { lastU.clear(); continue; }
      const n = nightAt();
      const half = n.t >= n.span - 2.6 ? mo : ev;
      let lit = 0, fig = 0;
      const seen = new Set();
      for (const [sa, sb] of addrs) {
        if (!windowLit(sa, sb)) continue;                        // a DARK pane ends a run too, so the
        lit++;                                                   // reset below is over EVERY key, not
                                                                 // only the lit ones — or a relight
                                                                 // reads as the same visit continuing
        const key = sa * 1000 + sb;
        const f = paneFigure(sa, sb);
        if (!f) continue;
        fig++; seen.add(key);
        if (!lastU.has(key)) { half.visits++; if (half === mo) moNights.add(n.nid); }
        lastU.set(key, f.u);
      }
      for (const key of [...lastU.keys()]) if (!seen.has(key)) lastU.delete(key);
      half.lit += lit; half.fig += fig; half.n++; half.hist[Math.min(fig, 5)]++;
      nights.add(n.nid);
    }
    return { ev, mo, nights: nights.size, moNightsAny: moNights.size, panes: addrs.length };
  }, { DAYS, DAY });
  for (const k of ['ev', 'mo']) {
    agg[k].lit += r[k].lit; agg[k].fig += r[k].fig; agg[k].n += r[k].n; agg[k].visits += r[k].visits;
    r[k].hist.forEach((v, i) => agg[k].hist[i] += v);
  }
  agg.nights += r.nights; agg.moNightsAny += r.moNightsAny; agg.panes = r.panes;
  const d = h => (h.n ? [(h.lit / h.n).toFixed(2), (h.fig / h.n).toFixed(2)] : ['-', '-']);
  console.log(`  seed ${String(seed).padEnd(6)} evening lit ${d(r.ev)[0]} fig ${d(r.ev)[1]}  ·  morning lit ${d(r.mo)[0]} fig ${d(r.mo)[1]}  ·  visits ${r.ev.visits} ev / ${r.mo.visits} mo`);
}
await browser.close();

const line = (name, h) => {
  const pct = h.hist.map(v => (100 * v / h.n).toFixed(0) + '%').join(' ');
  console.log(`  ${name.padEnd(8)} lit/sample ${(h.lit / h.n).toFixed(2).padStart(6)}   figures/sample ${(h.fig / h.n).toFixed(3).padStart(6)}` +
              `   density ${(h.fig / h.lit * (h.lit / h.n)).toFixed(2)} of ${(h.lit / h.n).toFixed(2)}   visits ${String(h.visits).padStart(5)}   N at once 0..5 ${pct}`);
};
console.log(`\n  ${FILE.replace(REPO + '/', '')} · ${DAYS} days x ${seeds.length} seeds · ${agg.panes} pane addresses · ${agg.nights} nights\n`);
line('EVENING', agg.ev); line('MORNING', agg.mo);
console.log(`\n  nights with at least one MORNING visit: ${agg.moNightsAny} of ${agg.nights}` +
            `   ·   total visits/year/seed ${((agg.ev.visits + agg.mo.visits) / seeds.length * 104 / DAYS).toFixed(0)}`);
