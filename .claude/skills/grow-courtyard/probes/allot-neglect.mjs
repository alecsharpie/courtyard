#!/usr/bin/env node
/* probe: how much NEGLECT is actually readable in the allotments, and what a rank
 * cell is worth in pixels.  Run BEFORE building b197's weed CA.
 *
 *  A) per-cell state histogram over the 17-plot lattice, sampled through a year
 *     x N seeds:  sown / fallow (bAge>0) / bare (bAge==0, untouched) / turned
 *  B) the FALLOW CLOCK's own distribution — bAge on an empty cell, mean and max
 *  C) time since the crew last TOUCHED a plot (plotAct/harvestPlot/turnPlot
 *     monkeypatched after __reseed and asserted to have fired), as a histogram in
 *     sim DAYS, per plot-sample
 *  D) the longest continuous run, per cell, of "empty" and of "unworked"
 *  E) geometry: the screen area of one allotment BED cell at 1600x950, wide camera
 */
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const FILE = resolve(process.argv[2] || fileURLToPath(new URL('../../../../courtyard.html', import.meta.url)));
const LABEL = process.argv[3] || 'HEAD';
const PAGE = pathToFileURL(FILE).href;
const SEEDS = (process.env.SEEDS || '7,42,1234,99,5,3141').split(',').map(Number);
const DAYS = +(process.env.DAYS || 26);          // one seasonal year
const STEP = +(process.env.STEP || 2);           // sim seconds per sample

const browser = await chromium.launch();
const runs = [];
for (const seed of SEEDS){
  const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(`${PAGE}?pause&seed=${seed}&t=0`, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof window.__warp === 'function');
  const r = await page.evaluate(({ step, n }) => {
    window.__reseed();
    /* instrument AFTER the reseed (LAWS) and assert it fired */
    let hits = { act: 0, harv: 0, turn: 0 };
    const touched = new Float64Array(GW * WH).fill(-1e9);
    const stamp = (ox, oy) => { for (let y = oy; y < oy + 2; y++) for (let x = ox; x < ox + 3; x++) touched[y * GW + x] = simT; };
    const wrap = (name, key) => { const f = window[name]; window[name] = function(a){
      const p = a && a.plot; const r = f.apply(this, arguments);
      if (p){ hits[key]++; const o = plotOrigin(p[0], p[1]); stamp(o[0], o[1]); } return r; }; };
    wrap('plotAct', 'act'); wrap('harvestPlot', 'harv'); wrap('turnPlot', 'turn');

    /* the plot lattice, and its BED cells */
    const plots = [];
    for (let oy = 8; oy <= 50; oy += 7) for (let ox = 80; ox <= 90; ox += 5){
      const cells = [];
      for (let y = oy; y < oy + 2; y++) for (let x = ox; x < ox + 3; x++)
        if (grid[y * GW + x] === BED) cells.push(y * GW + x);
      if (cells.length) plots.push({ ox, oy, cells });
    }
    const allCells = [].concat(...plots.map(p => p.cells));

    const st = { sown: 0, fallow: 0, bare: 0, turned: 0, tot: 0 };
    let bAgeSum = 0, bAgeMax = 0, bAgeN = 0;
    const AGE_BINS = [0.25, 0.5, 1, 2, 3, 5, 7, 14, 1e9];  // sim DAYS since the crew touched the plot
    const ageHist = new Array(AGE_BINS.length).fill(0);
    let plotSamples = 0, ageSum = 0, ageMax = 0;
    const emptyRun = new Float64Array(GW * WH), emptyBest = new Float64Array(GW * WH);
    const unwRun   = new Float64Array(GW * WH), unwBest   = new Float64Array(GW * WH);
    let samples = 0;
    for (let k = 0; k < n; k++){
      window.__warp(step); samples++;
      for (const i of allCells){
        st.tot++;
        if (bSp[i]) st.sown++;
        else if (bAge[i] > 0){ st.fallow++; bAgeSum += bAge[i]; bAgeN++; if (bAge[i] > bAgeMax) bAgeMax = bAge[i]; }
        else if (turned[i]) st.turned++;
        else st.bare++;
        if (!bSp[i]){ emptyRun[i] += step; if (emptyRun[i] > emptyBest[i]) emptyBest[i] = emptyRun[i]; } else emptyRun[i] = 0;
      }
      for (const p of plots){
        let last = -1e9; for (const i of p.cells) if (touched[i] > last) last = touched[i];
        const ageD = (simT - last) / 55;
        plotSamples++; ageSum += Math.min(ageD, 1e4); if (ageD < 1e4 && ageD > ageMax) ageMax = ageD;
        for (let b = 0; b < AGE_BINS.length; b++) if (ageD < AGE_BINS[b]){ ageHist[b]++; break; }
        for (const i of p.cells){
          if (ageD > 1) { unwRun[i] += step; if (unwRun[i] > unwBest[i]) unwBest[i] = unwRun[i]; } else unwRun[i] = 0;
        }
      }
    }
    const runsE = allCells.map(i => emptyBest[i] / 55).sort((a, b) => b - a);
    const runsU = allCells.map(i => unwBest[i] / 55).sort((a, b) => b - a);

    /* (E) geometry — one bed cell on screen at this framing */
    const q = (x, y) => project(x, y, 0);
    const c = plots[8].cells[0], cx = c % GW, cy = (c / GW) | 0;
    const a = q(cx, cy), b = q(cx + 1, cy), d = q(cx + 1, cy + 1), e = q(cx, cy + 1);
    const area = Math.abs((a[0]*b[1]-b[0]*a[1]) + (b[0]*d[1]-d[0]*b[1]) + (d[0]*e[1]-e[0]*d[1]) + (e[0]*a[1]-a[0]*e[1])) / 2;
    const w = Math.hypot(b[0]-a[0], b[1]-a[1]), h = Math.hypot(e[0]-a[0], e[1]-a[1]);
    return { hits, st, plots: plots.length, cells: allCells.length, samples,
      bAgeMean: bAgeN ? bAgeSum / bAgeN : 0, bAgeMax, bAgeN,
      ageHist, ageMean: ageSum / plotSamples, ageMax, plotSamples,
      emptyTop: runsE.slice(0, 5), emptyMed: runsE[runsE.length >> 1],
      unwTop: runsU.slice(0, 5), unwMed: runsU[runsU.length >> 1],
      cellPx: { area, w, h, at: [cx, cy], corner: a } };
  }, { step: STEP, n: Math.round(DAYS * 55 / STEP) });
  if (errs.length) console.error('PAGE ERROR seed', seed, errs[0]);
  runs.push({ seed, ...r });
  await page.close();
}
await browser.close();

const sum = k => runs.reduce((a, r) => a + (typeof k === 'function' ? k(r) : r[k]), 0);
const pct = (a, b) => (100 * a / b).toFixed(2) + '%';
const tot = sum(r => r.st.tot);
console.log(`\n== ${LABEL} — allotment neglect, ${runs.length} seeds x ${DAYS} sim days, step ${STEP}s ==`);
console.log(`plots ${runs[0].plots}  bed cells/seed ${runs[0].cells}  samples/seed ${runs[0].samples}  cell-samples ${tot}`);
console.log(`patch fired: plotAct ${sum(r=>r.hits.act)}  harvestPlot ${sum(r=>r.hits.harv)}  turnPlot ${sum(r=>r.hits.turn)}`);
console.log('\nA) per-cell state');
for (const k of ['sown','fallow','bare','turned']) console.log(`   ${k.padEnd(7)} ${String(sum(r=>r.st[k])).padStart(8)}  ${pct(sum(r=>r.st[k]), tot)}`);
console.log('\nB) the fallow clock (bAge on an empty cell)');
console.log(`   n ${sum('bAgeN')}   mean ${(sum(r=>r.bAgeMean*r.bAgeN)/Math.max(1,sum('bAgeN'))).toFixed(2)} sim s   max ${Math.max(...runs.map(r=>r.bAgeMax)).toFixed(2)}  (= ${(Math.max(...runs.map(r=>r.bAgeMax))/55).toFixed(3)} days)`);
console.log('\nC) sim DAYS since the crew touched the plot (per plot-sample)');
const BINS = ['<0.25','<0.5','<1','<2','<3','<5','<7','<14','14+'];
const psum = sum('plotSamples');
BINS.forEach((b, j) => console.log(`   ${b.padEnd(6)} ${String(sum(r=>r.ageHist[j])).padStart(8)}  ${pct(sum(r=>r.ageHist[j]), psum)}`));
console.log(`   mean ${(sum(r=>r.ageMean*r.plotSamples)/psum).toFixed(2)} d   max(finite) ${Math.max(...runs.map(r=>r.ageMax)).toFixed(2)} d`);
console.log('\nD) longest continuous run per cell, sim days');
console.log(`   EMPTY    median ${median(runs.map(r=>r.emptyMed)).toFixed(3)}   top ${runs[0].emptyTop.map(v=>v.toFixed(2)).join(' ')}`);
console.log(`   UNWORKED median ${median(runs.map(r=>r.unwMed)).toFixed(3)}   top ${runs[0].unwTop.map(v=>v.toFixed(2)).join(' ')}   (unworked = plot age > 1 d)`);
console.log('\nE) one allotment BED cell on screen, 1600x950 wide');
const g = runs[0].cellPx;
console.log(`   cell ${g.at}  ${g.w.toFixed(1)} x ${g.h.toFixed(1)} px   area ${g.area.toFixed(0)} px^2   at ${g.corner.map(v=>v.toFixed(0)).join(',')}`);
function median(a){ a = a.slice().sort((x,y)=>x-y); return a[a.length>>1]; }
