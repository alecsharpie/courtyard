/* probe: the brief's success test is NOT a total — it is "a plot nobody has reached in a
 * fortnight reads differently from one worked yesterday". That is cross-plot variance AT
 * AN INSTANT, and the season's own swing will fake it in any year-pooled number. So:
 * restricted to the peak quarter, the histogram of per-plot rank across the 17 plots.
 *
 * NOTE (#209): the trailing `hoe` column counts the act STRING 'hoeing the plot clean',
 * which is plotAct's rung only. #209 added a second way a bed is cleared — the row too
 * rank to pick through, hoed by the same hand that lifts it inside harvestPlot — so this
 * column now UNDER-reports clearings by roughly two thirds. Left as it is on purpose:
 * the stored baselines above travel with it. For clearings measured off the WORLD and
 * not off either build's act names, use probes/allot-steer.mjs. */
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const FILE = resolve(process.argv[2] || fileURLToPath(new URL('../../../../courtyard.html', import.meta.url)));
const SEEDS = (process.env.SEEDS || '7,42,1234,99,5,3141').split(',').map(Number);
const DAYS = +(process.env.DAYS || 26), STEP = 2;
const SETS = JSON.parse(process.env.SWEEP || '[{}]');
const browser = await chromium.launch();
console.log('set                    | peak quarter: per-plot rank (0..6) histogram, share of plot-samples          | mean  sd  | both-ends%  hoe');
console.log('                       |   0-.3  .3-.9  .9-1.8  1.8-3  3-4.5  4.5-6                                  |           |');
for (const set of SETS){
  const H = new Array(6).fill(0); let N = 0, mean = 0, sq = 0, both = 0, bn = 0, hoe = 0;
  for (const seed of SEEDS){
    const page = await browser.newPage({ viewport: { width: 1200, height: 720 } });
    const errs=[]; page.on('pageerror', e=>errs.push(String(e)));
    await page.goto(pathToFileURL(FILE).href + `?pause&seed=${seed}&t=0`, { waitUntil: 'load' });
    await page.waitForFunction(() => typeof window.__warp === 'function');
    const r = await page.evaluate(({ step, n, set }) => {
      window.__reseed();
      const ev = eval;
      for (const k in set){ ev(k + ' = ' + set[k]); if (ev(k) !== set[k]) throw new Error('sweep dead: ' + k); }
      let hoe = 0; const f = window.plotAct;
      window.plotAct = function(a){ const r = f.apply(this, arguments); if (a && a.act === 'hoeing the plot clean' && r) hoe++; return r; };
      const plots = []; for (let oy = 8; oy <= 50; oy += 7) for (let ox = 80; ox <= 90; ox += 5) plots.push([ox, oy]);
      const B = [0.3, 0.9, 1.8, 3, 4.5, 6.01];
      const H = new Array(6).fill(0); let N = 0, mean = 0, sq = 0, both = 0, bn = 0;
      for (let k = 0; k < n; k++){
        window.__warp(step);
        if (Math.floor(season() * 4) !== 2) continue;         // the peak quarter only: midsummer -> autumn
        let lo = 0, hi = 0;
        for (const [ox, oy] of plots){
          const v = plotRank(ox, oy); N++; mean += v; sq += v * v;
          for (let b = 0; b < B.length; b++) if (v < B[b]){ H[b]++; break; }
          if (v < 0.3) lo++; if (v >= 3) hi++;
        }
        bn++; if (lo >= 3 && hi >= 3) both++;                 // 3 clean plots AND 3 gone-over plots, in the same frame
      }
      return { H, N, mean, sq, both, bn, hoe };
    }, { step: STEP, n: Math.round(DAYS * 55 / STEP), set });
    if (errs.length) console.error('PAGE ERROR', seed, errs[0]);
    r.H.forEach((v,j)=>H[j]+=v); N += r.N; mean += r.mean; sq += r.sq; both += r.both; bn += r.bn; hoe += r.hoe;
    await page.close();
  }
  const mu = mean/N, sd = Math.sqrt(Math.max(0, sq/N - mu*mu));
  const lbl = Object.keys(set).length ? Object.entries(set).map(([k,v])=>k.replace('WEED_','')+'='+v).join(' ') : 'as-built';
  console.log(`${lbl.padEnd(22)} | ` + H.map(v=>(100*v/N).toFixed(1).padStart(6)+'%').join(' ')
    + `   | ${mu.toFixed(2)} ${sd.toFixed(2)} | ${(100*both/bn).toFixed(1).padStart(5)}%  ${hoe}`);
}
await browser.close();
