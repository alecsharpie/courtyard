#!/usr/bin/env node
/* b126 premise: does a desire line EXIST on the plaza/quay, and what does paveWear
 * actually reach where it already accrues?  Run on HEAD before building.
 *   node probe-pave.mjs [--seeds 7,42,1234] [--days 6] [--file courtyard.html]
 */
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i < 0 ? d : argv[i + 1]; };
const SRC = resolve(arg('--file', 'courtyard.html'));
const SEEDS = arg('--seeds', '7,42,1234').split(',').map(Number);
const DAYS = +arg('--days', 6);

const SWEEP = (days) => `(async () => {
  // --- region cell counts, off the GRID (never off a naming box) ---
  const cnt = { pavedNow: 0, plazaPath: 0, quaySide: 0 };
  const plaza = [], quay = [];
  for (let y = 0; y < LN_WALK_S; y++) for (let x = 0; x < GW; x++){
    if (pavedAt(x, y)) cnt.pavedNow++;
    if (inPlaza(x, y)) { cnt.plazaPath++; plaza.push(y*GW+x); }
    if (inQuay(x, y))  { cnt.quaySide++;  quay.push(y*GW+x); }
  }
  // --- how many pools each region WOULD build under buildPuddles' own two-grain hash ---
  const wouldPool = (cells) => cells.filter(i => {
    const x = i % GW, y = (i / GW) | 0;
    return 0.45*hash(x, y+PUD_K) + 0.55*hash(x>>2, (y>>1)+PUD_DIP) > PUD_CUT;
  }).length;
  cnt.plazaPools = wouldPool(plaza); cnt.quayPools = wouldPool(quay);
  cnt.poolsNow = PUDDLES.length;

  // --- do feet actually cross the roundel?  accumulate presence per cell ---
  const foot = new Float32Array(GW*WH);
  while (day < 1) __warp(1);
  const d0 = day; let steps = 0;
  while (day < d0 + ${days}){
    __warp(0.25); steps++;
    for (const a of agents){
      const gx = Math.round(a.x - .5), gy = Math.round(a.y - .5);
      if (gx>=0 && gy>=0 && gx<GW && gy<WH) foot[gy*GW+gx] += 0.25;
    }
  }
  const top = (cells) => { const s = cells.map(i => [i, foot[i]]).filter(v => v[1] > 0)
      .sort((a,b) => b[1]-a[1]);
    return { touched: s.length, of: cells.length,
             secs: s.reduce((t,v)=>t+v[1],0),
             top: s.slice(0,12).map(([i,v]) => [i%GW, (i/GW)|0, +v.toFixed(1)]) }; };
  // --- what paveWear reaches where it ALREADY accrues (lane + cross) ---
  const pw = []; for (let y=0;y<LN_WALK_S;y++) for (let x=0;x<GW;x++) if (pavedAt(x,y)) pw.push(paveWear[y*GW+x]);
  pw.sort((a,b)=>a-b);
  const q = f => +pw[Math.min(pw.length-1, Math.floor(f*pw.length))].toFixed(4);
  return { cnt, plaza: top(plaza), quay: top(quay), steps,
           pw: { n: pw.length, max: +pw[pw.length-1].toFixed(4),
                 p50: q(0.5), p75: q(0.75), p90: q(0.9), p99: q(0.99),
                 over05: pw.filter(v=>v>0.05).length, over20: pw.filter(v=>v>0.20).length,
                 over50: pw.filter(v=>v>0.50).length } };
})()`;

const browser = await chromium.launch();
const runs = [];
for (const seed of SEEDS){
  const page = await browser.newPage({ viewport: { width: 1280, height: 700 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(pathToFileURL(SRC).href + `?seed=${seed}&pause`);
  await page.waitForFunction('typeof __warp === "function"');
  const r = await page.evaluate(SWEEP(DAYS));
  if (errs.length){ console.error('PAGE ERROR', errs[0]); process.exit(2); }
  runs.push({ seed, ...r }); await page.close();
}
await browser.close();
const m = a => a.reduce((s,x)=>s+x,0)/a.length;
console.log('file:', SRC, '· seeds', SEEDS.join(','), '·', DAYS, 'days\n');
const c = runs[0].cnt;
console.log('CELLS   pavedAt now ' + c.pavedNow + '  ·  plaza PATH ' + c.plazaPath + '  ·  quay SIDE ' + c.quaySide);
console.log('POOLS   now ' + c.poolsNow + '  ·  plaza would add ' + c.plazaPools + '  ·  quay would add ' + c.quayPools
  + '   -> ' + (c.poolsNow + c.plazaPools + c.quayPools) + ' (+' + ((c.plazaPools+c.quayPools)/c.poolsNow*100).toFixed(0) + '%)');
console.log('\nFEET on the roundel / quay (HEAD, no paveWear accrues there at all):');
for (const r of runs){
  console.log('  seed ' + String(r.seed).padStart(5) + '  plaza ' + String(r.plaza.touched).padStart(3) + '/' + r.plaza.of
    + ' cells, ' + r.plaza.secs.toFixed(0) + ' person-sec  ·  quay ' + r.quay.touched + '/' + r.quay.of
    + ', ' + r.quay.secs.toFixed(0) + ' person-sec');
}
console.log('  busiest plaza cells (seed ' + runs[0].seed + '):', JSON.stringify(runs[0].plaza.top));
console.log('  busiest quay  cells (seed ' + runs[0].seed + '):', JSON.stringify(runs[0].quay.top));
console.log('\npaveWear where it ALREADY accrues, after ' + DAYS + ' days (n=' + runs[0].pw.n + '):');
for (const k of ['max','p50','p75','p90','p99','over05','over20','over50'])
  console.log('  ' + k.padEnd(8) + runs.map(r => String(r.pw[k]).padStart(9)).join(''));
