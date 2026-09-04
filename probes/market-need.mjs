#!/usr/bin/env node
/* #193 — the SUPPLY the market actually sees, sampled AT THE LATCH.
 * MK_NEED is a ladder on mkTotal, and mkTotal is latched once per market inside
 * stockMarket(). `produce` and mkTotal are script-scope, so the latch is caught by
 * wrapping window.stockMarket and reading the store through __census() on the calls
 * where the day is a market day and the latch has not yet fired (mkTrades(0) is
 * exactly `mkDay === day`). The reconstruction is self-checked: after a latch above
 * MK_CAP the store holds MK_KEEP*(total-MK_CAP), so 2*after+18 must return `total`.
 * Nothing here reads MK_NEED, so the same probe grades HEAD and the candidate. */
import { homedir } from 'node:os'; import { join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const argv = process.argv.slice(2); const arg=(k,d)=>{const i=argv.indexOf(k);return i<0?d:argv[i+1];};
/* 104 days = 4 seed-years. Markets are day%4===2 and a year is 26 days, so the
   calendar offers exactly 13 positions in the year and the pattern repeats every 2
   years: 104 days samples each of the 13 twice, per seed. Fewer days aliases the
   seasons (78 d gave late winter 6 markets against early spring 24). */
const SEEDS = arg('--seeds','7,42,1234,55,900,31').split(',').map(Number), DAYS=+arg('--days',104);
const FILE = pathToFileURL(join(process.cwd(), arg('--file','courtyard.html'))).href;
const MK_CAP = 18, MK_GOODS = 6, MK_CRATE = 6;
/* Standing space on the pavement. MK_NEED rises with i, so the stalls that trade are
   exactly 0..open-1 and the spots in use are those keyed to one of them (#193). On a
   build where the cap is fixed this over-counts nothing: open is 3 on the markets that
   have crates at all. */
const MK_OVER_S = [0,1,1,2,0,2,0,2], MK_STACK = 2;
const crateMax = open => MK_OVER_S.filter(v => v < open).length * MK_STACK;

const S = d => `(async()=>{
  __reseed(); while(day<1) __warp(1);           // instrument AFTER the reseed (LAWS: __reseed REASSIGNS R)
  const mk = [];
  const f = window.stockMarket; let fired = 0, bad = 0, worst = 0;
  window.stockMarket = function(){
    const pre = (isMarketDay() && !mkTrades(0)) ? __census() : null;
    const r = f.apply(this, arguments);
    if (pre && mkTrades(0)){                     // the latch fired on THIS call
      fired++;
      const total = pre.planting.produce;
      const after = __census().planting.produce;
      let open = 0, goods = [];
      for (let i = 0; i < 3; i++){ if (mkTrades(i)) open++; goods.push(mkGoods(i)); }
      /* the CAP the build actually used, recovered from the store rather than assumed:
         produce keeps MK_KEEP*(1 - cap/total) of it, so cap = total - 2*after whenever
         the market was over its cap at all. Reading it back is what makes this probe
         grade HEAD and the candidate with one number instead of two. */
      const cap = after > 0 ? total - 2*after : null;
      if (cap !== null && Math.abs(cap - Math.round(cap)) > 0.16) bad++;   // toFixed(1) x3
      if (cap !== null) worst = Math.max(worst, Math.abs(cap - Math.round(cap)));
      mk.push({ day, season: pre.clock.season, total, open, goods, after, cap });
    }
    return r;
  };
  const d0 = day;
  while (day < d0 + ${d}) __warp(1);
  return { mk, fired, bad, worst, seedDays: day - d0 };
})()`;

const b = await chromium.launch(); const rows = [];
for (const s of SEEDS){
  const p = await b.newPage({ viewport:{width:1280,height:700} });
  const e=[]; p.on('pageerror', x=>e.push(String(x)));
  await p.goto(FILE+'?seed='+s+'&pause'); await p.waitForFunction('typeof __warp==="function"');
  const r = await p.evaluate(S(DAYS)); r.seed = s; rows.push(r);
  if (e.length){ console.error('PAGE ERROR', e[0]); process.exit(2); }
  await p.close();
}
await b.close();

const all = rows.flatMap(r => r.mk);
const bad = rows.reduce((a,r)=>a+r.bad,0), worst = Math.max(...rows.map(r=>r.worst));
const LABEL = arg('--label','HEAD');
console.log(`[${LABEL}] ${rows.length} seeds x ${DAYS} d  ->  ${all.length} markets   cap-recovery non-integers ${bad} (worst ${worst.toFixed(3)}, rounding floor 0.16)`);
if (!all.length){ console.error('no markets sampled'); process.exit(2); }

/* crates a market shows: its surplus over the cap the build used, in board-loads,
   capped by the spots the open pitches bring with them. */
const crates = m => Math.min(crateMax(m.open),
  Math.floor(Math.max(0, m.total - (m.cap === null ? m.total : m.cap)) / MK_CRATE));
const q=(a,f)=>{const s=[...a].sort((x,y)=>x-y);return s[Math.min(s.length-1,Math.floor(f*s.length))];};
const T = all.map(m=>m.total);
console.log(`  mkTotal AT THE LATCH   min ${q(T,0).toFixed(1)}  p10 ${q(T,0.10).toFixed(1)}  p25 ${q(T,0.25).toFixed(1)}  MED ${q(T,0.5).toFixed(1)}  p75 ${q(T,0.75).toFixed(1)}  p90 ${q(T,0.90).toFixed(1)}  max ${q(T,1).toFixed(1)}`);
const bins=[0,2,4,8,13,18,30,50,80,120,200,1e9];
console.log('  histogram  ' + bins.slice(0,-1).map((lo,i)=>`${lo}-${bins[i+1]>1e8?'∞':bins[i+1]}:${T.filter(v=>v>=lo&&v<bins[i+1]).length}`).join('  '));

/* the AXIS is the season. Phase 0 is midwinter; 8 eighths of the year, named. */
const NAMES=['midwinter','late winter','early spring','late spring','midsummer','late summer','early autumn','late autumn'];
const oct = m => Math.floor(((m.season%1)+1)%1*8);
console.log('  BY EIGHTH OF THE YEAR (phase 0 = midwinter)');
console.log('    eighth        n   mkTotal med   p25    p90    stalls open: 1 / 2 / 3    mean open   crates med');
for (let k=0;k<8;k++){
  const g = all.filter(m=>oct(m)===k); if(!g.length){ console.log(`    ${NAMES[k].padEnd(13)} 0`); continue; }
  const t = g.map(m=>m.total);
  const c = g.map(crates);
  const o = [1,2,3].map(n=>g.filter(m=>m.open===n).length);
  console.log(`    ${NAMES[k].padEnd(13)}${String(g.length).padStart(3)}  ${q(t,0.5).toFixed(1).padStart(8)} ${q(t,0.25).toFixed(1).padStart(6)} ${q(t,0.9).toFixed(1).padStart(6)}      ${o.map(v=>String(v).padStart(3)).join(' /')}      ${(g.reduce((a,m)=>a+m.open,0)/g.length).toFixed(2)}      ${q(c,0.5)}`);
}
const o=[0,1,2,3].map(n=>all.filter(m=>m.open===n).length);
console.log(`  STALLS OPEN over all ${all.length} markets:  0:${o[0]} (${(100*o[0]/all.length).toFixed(0)}%)  1:${o[1]} (${(100*o[1]/all.length).toFixed(0)}%)  2:${o[2]} (${(100*o[2]/all.length).toFixed(0)}%)  3:${o[3]} (${(100*o[3]/all.length).toFixed(0)}%)   mean ${(all.reduce((a,m)=>a+m.open,0)/all.length).toFixed(2)}`);
const C = all.map(crates);
console.log(`  CRATES (derived from mkTotal)  med ${q(C,0.5)}  mean ${(C.reduce((a,b)=>a+b,0)/C.length).toFixed(2)}  markets with 0 crates ${C.filter(v=>!v).length} (${(100*C.filter(v=>!v).length/C.length).toFixed(0)}%)  saturated: ${all.filter((m,i)=>C[i]===crateMax(m.open)&&C[i]>0).length}`);
const G = all.map(m=>m.goods.reduce((a,b)=>a+b,0));
console.log(`  GOODS ON BOARDS  med ${q(G,0.5)}  mean ${(G.reduce((a,b)=>a+b,0)/G.length).toFixed(1)} of ${MK_CAP}`);
/* CONSERVATION. Every unit the store hands the market must end up somewhere the eye can
   find it or somewhere the next market can: on a board, in a crate, or kept. What is
   left over is stock that left the world inside stockMarket() — the fixed-MK_CAP
   defect. Rounding costs at most a unit a board plus the crate remainder (< MK_CRATE). */
const capped = all.filter(m=>m.cap !== null);
const byOpen = [1,2,3].map(n=>{ const g = capped.filter(m=>m.open===n);
  return g.length ? (g.reduce((a,m)=>a+m.cap,0)/g.length) : null; });
console.log(`  CAP THE BUILD USED (recovered from the store), by stalls open:  1 -> ${byOpen[0]===null?'-':byOpen[0].toFixed(1)}   2 -> ${byOpen[1]===null?'-':byOpen[1].toFixed(1)}   3 -> ${byOpen[2]===null?'-':byOpen[2].toFixed(1)}    (n ${capped.length} of ${all.length} over cap)`);
/* THE DEFECT, directly. `shelved` is what stockMarket() takes off the store to put on
   boards; the boards can hold MK_GOODS each, and only the stalls that TRADE have one.
   Anything shelved above that is stock the market removed from `produce` and then put
   nowhere — not shown, not crated, not kept. Crates are NOT a third destination: they
   are a drawing of mkOver, half of which is the very stock `keep` carries forward. */
const stranded = all.map(m => {
  const capUsed = m.cap === null ? Math.round(m.total) : m.cap;
  return Math.max(0, Math.min(Math.round(m.total), capUsed) - m.goods.reduce((a,b)=>a+b,0));
});
console.log(`  STRANDED units per market (shelved, with no open board to hold them)`);
for (const n of [1,2,3]){ const idx = all.map((m,i)=>[m,i]).filter(([m])=>m.open===n).map(([,i])=>i);
  if(!idx.length) continue; const v = idx.map(i=>stranded[i]);
  console.log(`     ${n} stall${n>1?'s':''} open (n ${v.length}):  mean ${(v.reduce((a,b)=>a+b,0)/v.length).toFixed(1)}   max ${Math.max(...v)}`); }
const tot = stranded.reduce((a,b)=>a+b,0);
console.log(`     ALL: ${tot} units over ${all.length} markets = ${(tot/all.length).toFixed(2)} a market`);


/* THE SWEEP. MK_NEED is read in exactly one place (mkTrades) and reads nothing but
   mkTotal, so a candidate ladder is arithmetic on the samples above — no re-run, and
   every ladder is graded against the SAME measured supply rather than its own world. */
const LADDERS = (arg('--ladders','') || '0,4,13|0,6,12|0,12,18|0,12,36|0,15,48|0,12,44|0,10,40|0,18,54')
  .split('|').map(t=>t.split(',').map(Number));
const openWith = (L,t) => L.reduce((n,need)=>n+(t>=need?1:0),0);
console.log('\n  LADDER SWEEP — stalls open, same %d markets, by eighth of the year', all.length);
const hdr = NAMES.map(n=>n.slice(0,5).padStart(6)).join('');
console.log('    MK_NEED'.padEnd(20) + hdr + '   all: 1 / 2 / 3        mean');
for (const L of LADDERS){
  const per = [];
  for (let k=0;k<8;k++){ const g=all.filter(m=>oct(m)===k);
    per.push(g.length ? (g.reduce((a,m)=>a+openWith(L,m.total),0)/g.length).toFixed(2).padStart(6) : '     -'); }
  const o=[1,2,3].map(n=>all.filter(m=>openWith(L,m.total)===n).length);
  const mean = all.reduce((a,m)=>a+openWith(L,m.total),0)/all.length;
  console.log(('    ['+L.join(', ')+']').padEnd(20) + per.join('') +
    '   ' + o.map(v=>(100*v/all.length).toFixed(0).padStart(3)+'%').join(' /') + '   ' + mean.toFixed(2));
}

if (argv.includes('--dump')) console.log(JSON.stringify(all));
