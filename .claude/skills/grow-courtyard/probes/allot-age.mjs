#!/usr/bin/env node
/* probe (2): the brief names bAge on an EMPTY cell as "the fallow clock". Probe 1 shows
 * that clock counts DOWN and is dead inside 0.36 days. But caTick has a SECOND bAge:
 * on a PLANTED cell at its ceiling it counts UP (+0.35/tick, unbounded) and is zeroed
 * ONLY by plotAct's `age` rung — the crew weeding the row. That is a real, unread
 * "time since anybody came" clock. Measure it, and measure how many plots are NEVER
 * touched in a seeded year. */
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const FILE = resolve(process.argv[2] || fileURLToPath(new URL('../../../../courtyard.html', import.meta.url)));
const LABEL = process.argv[3] || 'HEAD';
const PAGE = pathToFileURL(FILE).href;
const SEEDS = (process.env.SEEDS || '7,42,1234,99,5,3141').split(',').map(Number);
const DAYS = +(process.env.DAYS || 26), STEP = 2;

const browser = await chromium.launch();
const runs = [];
for (const seed of SEEDS){
  const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(`${PAGE}?pause&seed=${seed}&t=0`, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof window.__warp === 'function');
  const r = await page.evaluate(({ step, n }) => {
    window.__reseed();
    let acts = 0, ageRung = 0;
    const touched = new Float64Array(GW * WH).fill(NaN);
    const f = window.plotAct;
    window.plotAct = function(a){
      const before = a && a.plot ? 1 : 0; const r = f.apply(this, arguments);
      if (a && a.plot && r){ acts++; if (a.act === 'weeding down the row' || a.act === 'tying the beans in') ageRung++;
        const o = plotOrigin(a.plot[0], a.plot[1]);
        for (let y = o[1]; y < o[1] + 2; y++) for (let x = o[0]; x < o[0] + 3; x++) touched[y * GW + x] = simT; }
      return r; };
    const plots = [];
    for (let oy = 8; oy <= 50; oy += 7) for (let ox = 80; ox <= 90; ox += 5){
      const cells = [];
      for (let y = oy; y < oy + 2; y++) for (let x = ox; x < ox + 3; x++) if (grid[y * GW + x] === BED) cells.push(y * GW + x);
      if (cells.length) plots.push({ ox, oy, cells });
    }
    const all = [].concat(...plots.map(p => p.cells));
    // bAge on a PLANTED cell, and on a planted cell AT its ceiling
    const BINS = [1, 2, 5, 10, 20, 40, 80, 160, 1e9];   // sim seconds
    const hp = new Array(BINS.length).fill(0), hc = new Array(BINS.length).fill(0);
    let np = 0, nc = 0, sp2 = 0, mx = 0;
    const perPlotMax = plots.map(() => 0);
    let touchedEver = 0, samples = 0;
    const plotRank = [];   // per-sample: max bAge over the plot's PLANTED cells
    for (let k = 0; k < n; k++){
      window.__warp(step); samples++;
      for (let j = 0; j < plots.length; j++){
        const p = plots[j]; let pm = 0;
        for (const i of p.cells){
          if (!bSp[i]) continue;
          np++; if (bAge[i] > mx) mx = bAge[i]; sp2 += bAge[i];
          for (let b = 0; b < BINS.length; b++) if (bAge[i] < BINS[b]){ hp[b]++; break; }
          const cap = bedCap(i % GW, (i / GW) | 0);
          if (bSt[i] >= cap){ nc++; for (let b = 0; b < BINS.length; b++) if (bAge[i] < BINS[b]){ hc[b]++; break; } }
          if (bAge[i] > pm) pm = bAge[i];
        }
        if (pm > perPlotMax[j]) perPlotMax[j] = pm;
        plotRank.push(pm);
      }
    }
    for (const p of plots){ let t = false; for (const i of p.cells) if (!isNaN(touched[i])) t = true; if (t) touchedEver++; }
    plotRank.sort((a, b) => a - b);
    const q = f2 => plotRank[Math.min(plotRank.length - 1, Math.floor(f2 * plotRank.length))];
    return { acts, ageRung, np, nc, hp, hc, mean: sp2 / Math.max(1, np), mx,
      perPlotMax: perPlotMax.map(v => +v.toFixed(1)), touchedEver, plots: plots.length, samples,
      q: [q(0.5), q(0.75), q(0.9), q(0.95), q(0.99)],
      over: [20, 40, 60, 80].map(t => plotRank.filter(v => v >= t).length / plotRank.length) };
  }, { step: STEP, n: Math.round(DAYS * 55 / STEP) });
  if (errs.length) console.error('PAGE ERROR', seed, errs[0]);
  runs.push({ seed, ...r }); await page.close();
}
await browser.close();
const S = k => runs.reduce((a, r) => a + r[k], 0);
const P = (a, b) => (100 * a / b).toFixed(2) + '%';
console.log(`\n== ${LABEL} — bAge on PLANTED cells, ${runs.length} seeds x ${DAYS} d ==`);
console.log(`plotAct fired ${S('acts')} (weeding/tying rung ${S('ageRung')})   plots touched at least once: ${runs.map(r=>r.touchedEver+'/'+r.plots).join(' ')}`);
const BL = ['<1','<2','<5','<10','<20','<40','<80','<160','160+'];
console.log(`\nbAge on a PLANTED cell   n ${S('np')}  mean ${(runs.reduce((a,r)=>a+r.mean*r.np,0)/S('np')).toFixed(2)} s  max ${Math.max(...runs.map(r=>r.mx)).toFixed(1)} s (${(Math.max(...runs.map(r=>r.mx))/55).toFixed(2)} d)`);
BL.forEach((b,j)=>console.log(`   ${b.padEnd(6)} ${String(S(r=>0)+runs.reduce((a,r)=>a+r.hp[j],0)).padStart(8)}  ${P(runs.reduce((a,r)=>a+r.hp[j],0), S('np'))}`));
console.log(`\n...restricted to a cell AT its bedCap ceiling   n ${S('nc')}  (${P(S('nc'), S('np'))} of planted)`);
BL.forEach((b,j)=>console.log(`   ${b.padEnd(6)} ${String(runs.reduce((a,r)=>a+r.hc[j],0)).padStart(8)}  ${P(runs.reduce((a,r)=>a+r.hc[j],0), S('nc'))}`));
console.log(`\nper plot-sample, MAX bAge over the plot's planted cells:`);
console.log(`   quantiles p50/p75/p90/p95/p99 = ${[0,1,2,3,4].map(j=>(runs.reduce((a,r)=>a+r.q[j],0)/runs.length).toFixed(1)).join(' / ')} s`);
[20,40,60,80].forEach((t,j)=>console.log(`   share of plot-samples with max bAge >= ${String(t).padStart(3)} s (${(t/55).toFixed(2)} d): ${(100*runs.reduce((a,r)=>a+r.over[j],0)/runs.length).toFixed(2)}%`));
console.log(`\nper-plot lifetime max bAge, seed ${runs[0].seed}: ${runs[0].perPlotMax.join(' ')}`);
