/* probe: the weed CA's YEAR and its SPREAD. Two numbers decide this build:
 *   (a) share of allotment cells rank, by season quarter — is there a rhythm, or is the
 *       block uniformly over / uniformly clean?
 *   (b) SPREAD across the 17 plots at one instant — the brief's success test is that a
 *       plot nobody has reached reads DIFFERENTLY from one worked yesterday, which is a
 *       variance across plots, not a total.
 * Sweeps whichever constants are named in SWEEP. */
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
console.log('  set                          rank%  hoe  |  by season quarter (midwtr->spr / spr->midsum / midsum->aut / aut->midwtr)  | plots rank: mean  sd  p10..p90  | all-clean%  all-rank%');
for (const set of SETS){
  const acc = { n:0, rank:0, cells:0, hoe:0, q:[0,0,0,0], qn:[0,0,0,0], pm:0, pv:0, ps:0, clean:0, over:0, hist:new Array(18).fill(0) };
  for (const seed of SEEDS){
    const page = await browser.newPage({ viewport: { width: 1200, height: 720 } });
    const errs=[]; page.on('pageerror', e=>errs.push(String(e)));
    await page.goto(pathToFileURL(FILE).href + `?pause&seed=${seed}&t=0`, { waitUntil: 'load' });
    await page.waitForFunction(() => typeof window.__warp === 'function');
    const r = await page.evaluate(({ step, n, set }) => {
      window.__reseed();
      /* a top-level `let` is a LEXICAL binding, not a window property: window.X = v
         silently creates a second name the page never reads (the first cut of this sweep
         printed five identical rows). Indirect eval assigns in global scope. */
      const ev = eval;
      for (const k in set){ ev(k + ' = ' + set[k]); if (ev(k) !== set[k]) throw new Error('sweep did not take: ' + k); }
      let hoe = 0;
      const f = window.plotAct;
      window.plotAct = function(a){ const r = f.apply(this, arguments); if (a && a.act === 'hoeing the plot clean' && r) hoe++; return r; };
      const plots = [];
      for (let oy = 8; oy <= 50; oy += 7) for (let ox = 80; ox <= 90; ox += 5) plots.push([ox, oy]);
      let rankC = 0, cells = 0, samples = 0;
      const q = [0,0,0,0], qn = [0,0,0,0], hist = new Array(18).fill(0);
      let pm = 0, ps = 0, clean = 0, over = 0;
      for (let k = 0; k < n; k++){
        window.__warp(step); samples++;
        let rc = 0; for (const i of WEED_CELLS){ cells++; if (rank[i] > WEED_SEED) { rankC++; rc++; } }
        const qi = Math.min(3, Math.floor(season() * 4));   // 0 winter->spring, 1 ->midsummer, 2 ->autumn, 3 ->midwinter
        q[qi] += rc / WEED_CELLS.length; qn[qi]++;
        let np = 0; for (const [ox, oy] of plots) if (plotRank(ox, oy) >= WEED_HOE) np++;
        hist[np]++; pm += np; ps += np * np;
        if (np === 0) clean++; if (np >= plots.length - 1) over++;
      }
      const mean = pm / samples;
      return { rankC, cells, hoe, q, qn, mean, sd: Math.sqrt(Math.max(0, ps / samples - mean * mean)),
        hist, clean: clean / samples, over: over / samples, samples };
    }, { step: STEP, n: Math.round(DAYS * 55 / STEP), set });
    if (errs.length) console.error('PAGE ERROR', seed, errs[0]);
    acc.rank += r.rankC; acc.cells += r.cells; acc.hoe += r.hoe; acc.n++;
    for (let j=0;j<4;j++){ acc.q[j] += r.q[j]; acc.qn[j] += r.qn[j]; }
    acc.pm += r.mean; acc.pv += r.sd; acc.clean += r.clean; acc.over += r.over;
    r.hist.forEach((v,j)=>acc.hist[j]+=v);
    await page.close();
  }
  const tot = acc.hist.reduce((a,b)=>a+b,0);
  let c = 0, p10 = 0, p90 = 0;
  for (let j=0;j<18;j++){ c += acc.hist[j]; if (!p10 && c >= tot*0.1) p10 = j; if (!p90 && c >= tot*0.9) p90 = j; }
  const lbl = Object.keys(set).length ? Object.entries(set).map(([k,v])=>k.replace('WEED_','')+'='+v).join(' ') : 'HEAD-of-branch';
  console.log(`  ${lbl.padEnd(26)} ${(100*acc.rank/acc.cells).toFixed(1).padStart(5)}% ${String(acc.hoe).padStart(4)}  |  `
    + acc.q.map((v,j)=>(100*v/Math.max(1,acc.qn[j])).toFixed(1).padStart(5)+'%').join(' ')
    + `  | ${(acc.pm/acc.n).toFixed(2).padStart(5)} ${(acc.pv/acc.n).toFixed(2).padStart(5)}  ${p10}..${p90}  | `
    + `${(100*acc.clean/acc.n).toFixed(1).padStart(5)}%   ${(100*acc.over/acc.n).toFixed(1).padStart(5)}%`);
}
await browser.close();
