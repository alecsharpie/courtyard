/* probe: does anything steer the crew toward a plot that has gone over?
 *
 * Instrumented AT THE EDGE — every kneel that reaches a plot goes through
 * harvestPlot(a) || plotAct(a), so wrapping both globals catches every landing with
 * the world in exactly the state the act saw. For each landing we record the chosen
 * plot's rank, the block's rank at that instant (mean and max), and which rung fired.
 *
 *   node probe-allot-steer.mjs [file]        FILE=… SEEDS=… DAYS=…
 */
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const FILE = resolve(process.argv[2] || fileURLToPath(new URL('./courtyard.html', import.meta.url)));
const SEEDS = (process.env.SEEDS || '7,42,1234,99,5,3141').split(',').map(Number);
const DAYS = +(process.env.DAYS || 26), STEP = 5;
const SETS = JSON.parse(process.env.SWEEP || '[{}]');

const browser = await chromium.launch();
for (const set of SETS){
const T = { hoe: 0, pick: 0, land: 0, harv: 0, rLand: 0, rAll: 0, rMax: 0,
            overFrames: 0, frames: 0, landOver: 0, landOverHoed: 0, overHarv: 0, bothActs: 0, choke: 0, missed: 0, opp: 0 };
console.log(`${FILE.split('/').pop()}  ${SEEDS.length} seeds x ${DAYS} d`);
console.log('seed   | hoe  harvested | landings  onOver  missed | rank@land  rank(mean/max)  | supply%');
for (const seed of SEEDS){
  const page = await browser.newPage({ viewport: { width: 1200, height: 720 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(pathToFileURL(FILE).href + `?pause&seed=${seed}&t=0`, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof window.__warp === 'function');
  const r = await page.evaluate(({ step, n, set }) => {
    window.__reseed();
    const ev = eval;
    for (const k in set){ ev(k + ' = ' + set[k]); if (ev(k) !== set[k]) throw new Error('sweep dead: ' + k); }
    const plots = []; for (let oy = 8; oy <= 50; oy += 7) for (let ox = 80; ox <= 90; ox += 5) plots.push([ox, oy]);
    const s = { hoe: 0, pick: 0, land: 0, rLand: 0, rAll: 0, rMax: 0, landOver: 0, landOverHoed: 0, overHarv: 0, bothActs: 0, choke: 0, missed: 0, opp: 0 };
    const note = (a) => {
      if (!a || !a.plot) return null;
      const [ox, oy] = plotOrigin(a.plot[0], a.plot[1]);
      let mean = 0, max = 0;
      for (const [px, py] of plots){ const v = plotRank(px, py); mean += v; if (v > max) max = v; }
      const v = plotRank(ox, oy);
      s.land++; s.rLand += v; s.rAll += mean / plots.length; s.rMax += max;
      const over = v >= WEED_HOE, any = max >= WEED_HOE;
      if (any) s.opp++;
      if (over) s.landOver++; else if (any) s.missed++;
      if (typeof WEED_CHOKE !== 'undefined' && v >= WEED_CHOKE) s.choke++;
      return over;
    };
    /* A CLEARING, defined off the world and not off either build's act names: a kneel
       that found a plot at or over WEED_HOE and left it at nothing. HEAD's hoe rung and
       #209's clear-and-lift both answer it; neither build's string is asked. */
    const cleared = (a, inner, args) => {
      const [ox, oy] = plotOrigin(a.plot[0], a.plot[1]);
      const before = plotRank(ox, oy);
      const r = inner();
      s.wasCleared = before >= WEED_HOE && plotRank(ox, oy) < 0.05;
      if (s.wasCleared){ s.hoe++; s.landOverHoed++; }
      return r;
    };
    const hp = window.harvestPlot, pa = window.plotAct;
    window.harvestPlot = function(a){
      const over = note(a);
      const r = cleared(a, () => hp.apply(this, arguments));
      if (r){ s.pick += r; if (over) s.overHarv++; if (s.wasCleared) s.bothActs++; }
      return r;
    };
    window.plotAct = function(a){
      // only a landing harvestPlot refused reaches here — note() already saw it
      return cleared(a, () => pa.apply(this, arguments));
    };
    let overFrames = 0, frames = 0;
    for (let k = 0; k < n; k++){
      window.__warp(step);
      frames++; let any = 0;
      for (const [px, py] of plots) if (plotRank(px, py) >= WEED_HOE){ any = 1; break; }
      overFrames += any;
    }
    return { ...s, overFrames, frames, harv: harvested };
  }, { step: STEP, n: Math.round(DAYS * 55 / STEP), set });
  if (errs.length) console.error('PAGE ERROR', seed, errs[0]);
  for (const k of Object.keys(T)) T[k] += r[k] || 0;
  console.log(`${String(seed).padEnd(6)} | ${String(r.hoe).padStart(3)}  ${String(r.harv).padStart(9)} | `
    + `${String(r.land).padStart(8)}  ${String(r.landOver).padStart(6)}  ${String(r.missed).padStart(6)} | `
    + `${(r.rLand / Math.max(1, r.land)).toFixed(2).padStart(9)}  ${(r.rAll / Math.max(1, r.land)).toFixed(2)}/${(r.rMax / Math.max(1, r.land)).toFixed(2)}`
    + `        | ${(100 * r.overFrames / r.frames).toFixed(0)}%`);
  await page.close();
}
const n = SEEDS.length;
const lbl = Object.keys(set).length ? Object.entries(set).map(([k,v])=>k+'='+v).join(' ') : 'as-built';
console.log('-'.repeat(94));
console.log(`TOTAL  | ${String(T.hoe).padStart(3)}  ${String(T.harv).padStart(9)} | ${String(T.land).padStart(8)}  ${String(T.landOver).padStart(6)}  ${String(T.missed).padStart(6)} | `
  + `${(T.rLand / Math.max(1, T.land)).toFixed(2).padStart(9)}  ${(T.rAll / Math.max(1, T.land)).toFixed(2)}/${(T.rMax / Math.max(1, T.land)).toFixed(2)}        | ${(100 * T.overFrames / T.frames).toFixed(0)}%`);
console.log(`per seed-year: hoe ${(T.hoe / n).toFixed(1)}  harvested ${(T.harv / n).toFixed(0)}  landings ${(T.land / n).toFixed(1)}`);
console.log(`of ${T.opp} landings with SOME plot over WEED_HOE: ${T.landOver} were on one (${(100 * T.landOver / Math.max(1, T.opp)).toFixed(1)}%), ${T.missed} were not`);
console.log(`of ${T.landOver} landings on an over plot: ${T.landOverHoed} left it CLEARED (${(100 * T.landOverHoed / Math.max(1, T.landOver)).toFixed(1)}%), ${T.overHarv} were taken by the lift above the hoe — ${T.bothActs} of those cleared the row in the same kneel`);
console.log(`SET ${lbl}: hoe/yr ${(T.hoe/n).toFixed(1)}  harvested/yr ${(T.harv/n).toFixed(0)}  rank@land ${(T.rLand/Math.max(1,T.land)).toFixed(2)} vs block mean ${(T.rAll/Math.max(1,T.land)).toFixed(2)} max ${(T.rMax/Math.max(1,T.land)).toFixed(2)}  chokeLandings ${T.choke}`);
}
await browser.close();
