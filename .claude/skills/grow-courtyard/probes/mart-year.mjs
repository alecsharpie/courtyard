/* probe: does the colony trace a YEAR — 0 in spring, a plateau, empty by autumn — and
 * are the nests CLUSTERED against a uniform control at the same count? */
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const FILE = resolve(process.argv[2] || fileURLToPath(new URL('../../../../courtyard.html', import.meta.url)));
const SEEDS = (process.env.SEEDS || '7,42,1234,99,5,271').split(',').map(Number);
const DAY = 55, DAYS = +(process.env.DAYS || 52), STEP = DAY / 2;
const browser = await chromium.launch();
const runs = [];
for (const seed of SEEDS){
  const page = await browser.newPage({ viewport: { width: 1200, height: 720 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(pathToFileURL(FILE).href + `?pause&seed=${seed}&t=0`, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof window.__warp === 'function');
  const r = await page.evaluate(({step, n}) => {
    window.__reseed();
    const out = [];
    let wetTicks = 0, seasonTicks = 0;
    for (let k = 0; k < n; k++){
      window.__warp(step);
      const nests = MART_NESTS.slice();
      out.push({ t:+simT.toFixed(1), p:+seasonPhase.toFixed(4), on:martOn, any:martAny,
                 here:+martHere().toFixed(3), wet:+wetF().toFixed(3),
                 birds: birds.filter(b=>b.mart).length,
                 rows: nests.reduce((a,i)=>{const y=(i/GW)|0; a[y]=(a[y]||0)+1; return a;},{}),
                 xs: nests.map(i=>[(i/GW)|0, i%GW]) });
    }
    return { out, cells: MART_CELLS.map(i=>[(i/GW)|0, i%GW]), seeds: MART_CELLS.filter(i=>martSeed[i]>0).map(i=>[(i/GW)|0,i%GW]) };
  }, { step: STEP, n: Math.round(DAYS*DAY/STEP) });
  if (errs.length){ console.error('seed',seed,'PAGE ERROR',errs[0]); process.exitCode=1; }
  runs.push({ seed, ...r });
  await page.close();
}
await browser.close();

/* clustering: mean run length of consecutive occupied cells along the eave line,
 * against a uniform control that scatters the SAME COUNT over the SAME eave line. */
function runsOf(set, cells){
  const key = new Set(set.map(c=>c[0]+','+c[1]));
  let runs = [], cur = 0, prev = null;
  for (const [y,x] of cells){
    const adj = prev && prev[0]===y && prev[1]===x-1;
    if (key.has(y+','+x)){ cur = adj ? cur+1 : 1; }
    else { if (cur) runs.push(cur); cur = 0; }
    prev = [y,x];
  }
  if (cur) runs.push(cur);
  return runs;
}
function meanRun(rs){ return rs.length ? rs.reduce((a,b)=>a+b,0)/rs.length : 0; }
// a simple LCG so the control is reproducible
let cs = 12345; const cr = () => (cs = (cs*1103515245+12345) & 0x7fffffff) / 0x7fffffff;
function control(cells, n){
  const idx = cells.map((_,i)=>i);
  for (let i=idx.length-1;i>0;i--){ const j=(cr()*(i+1))|0; [idx[i],idx[j]]=[idx[j],idx[i]]; }
  return idx.slice(0,n).map(i=>cells[i]);
}

console.log('== the colony over the year (nests built, martOn) ==');
const hdr = ['phase'].concat(SEEDS.map(s=>'s'+s));
console.log(hdr.map(h=>h.padStart(8)).join(''));
const N = runs[0].out.length;
for (let k = 0; k < N; k++){
  if (k % 2) continue;
  const row = [runs[0].out[k].p.toFixed(3)].concat(runs.map(r=>String(r.out[k].on)));
  console.log(row.map(h=>h.padStart(8)).join('') + '   here=' + runs[0].out[k].here.toFixed(2)
              + ' day' + Math.floor(runs[0].out[k].t/55));
}
console.log('\n== peak / plateau, and where the birds are ==');
for (const r of runs){
  const peak = r.out.reduce((a,b)=>b.on>a.on?b:a);
  const zeroAut = r.out.filter(o=>o.p>0.88&&o.p<0.98).every(o=>o.on===0);
  const spring0 = r.out.filter(o=>o.p>0.05&&o.p<0.27).every(o=>o.on===0);
  const rl = runsOf(peak.xs, r.cells), cl = control(r.cells, peak.xs.length);
  const rc = runsOf(cl, r.cells);
  console.log(`seed ${String(r.seed).padStart(5)}  founders ${String(r.seeds.length).padStart(2)}` +
    `  peak ${String(peak.on).padStart(3)} at p=${peak.p.toFixed(3)}  rows ${JSON.stringify(peak.rows)}` +
    `  runs ${rl.length} meanRun ${meanRun(rl).toFixed(2)} max ${Math.max(0,...rl)}` +
    `  | control runs ${rc.length} meanRun ${meanRun(rc).toFixed(2)} max ${Math.max(0,...rc)}` +
    `  | empty-in-autumn ${zeroAut} empty-in-late-winter ${spring0}`);
}
const wetShare = runs.map(r=>{
  const inS = r.out.filter(o=>o.here>0.5);
  return inS.length ? inS.filter(o=>o.wet>0).length/inS.length : 0;});
console.log('\nfraction of in-season samples with wetF>0 (the mud gate):',
  wetShare.map(v=>v.toFixed(2)).join(' '));
const bmax = runs.map(r=>Math.max(...r.out.map(o=>o.birds)));
console.log('max martins aloft at once per seed:', bmax.join(' '));
