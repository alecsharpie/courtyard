#!/usr/bin/env node
/* #172 — the allotments' SUPPLY, counted on HEAD. The brief inherits "28 hand-acts a
 * year across six worlds" from #154, dated before #159 landed. Re-count it, and split
 * it the way the brief's success line asks: acts per PLOT, presence per PLOT, and the
 * two doors the supply passes through (the daylight window and allotCount() < 3).
 * Every act is counted at its CALL — turnPlot/harvestPlot/plotAct — never by presence. */
import { homedir } from 'node:os'; import { join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const argv = process.argv.slice(2); const arg=(k,d)=>{const i=argv.indexOf(k);return i<0?d:argv[i+1];};
const SEEDS = arg('--seeds','7,42,1234,55,900,31').split(',').map(Number), DAYS=+arg('--days',26);
const SET = arg('--set','');
const FILE = pathToFileURL(join(process.cwd(), arg('--file','courtyard.html'))).href;
const S = d => `(async()=>{
  ${SET.split(',').filter(Boolean).map(kv=>kv.trim()+';').join(' ')}
  __reseed(); while(day<1) __warp(1);          // instrument AFTER the reseed (LAWS: __reseed REASSIGNS R)
  const plots=[]; for(let oy=8;oy<=50;oy+=7) for(let ox=80;ox<=90;ox+=5){
    let bed=0; for(let y=oy;y<oy+2;y++) for(let x=ox;x<ox+3;x++) if(grid[y*GW+x]===BED) bed++;
    if (bed) plots.push(ox+','+oy); }          // a.plot is a BED CELL, not the origin: read the footprint back off plotOrigin()
  const key = p => { if(!p) return '?'; const o=plotOrigin(p[0],p[1]); return o[0]+','+o[1]; };
  const A = {turn:0, harv:0, act:0, actNil:0, spawnOwn:0, spawnLane:0, sendTo:0, rows:{}};
  const perPlot = {}, presPlot = {}, kneelPlot = {};
  for (const k of plots){ perPlot[k]=0; presPlot[k]=0; kneelPlot[k]=0; }
  const wrap = (name, tag) => { const f = window[name];
    window[name] = function(a){ const r = f.apply(this, arguments);
      const k = key(a && a.plot);
      if (tag==='act'){ if (r) { A.act++; if(k in perPlot) perPlot[k]++; } else A.actNil++; }
      else { if (r || tag!=='harv'){ A[tag]++; if (r && k in perPlot) perPlot[k]++; } }
      return r; }; return f; };
  wrap('turnPlot','turn'); wrap('harvestPlot','harv'); wrap('plotAct','act');
  const so = window.spawnAllotAgent; window.spawnAllotAgent = function(){ A.spawnOwn++; return so.apply(this,arguments); };
  const st = window.sendToPlot;      window.sendToPlot      = function(){ A.sendTo++;   return st.apply(this,arguments); };
  let fired = 0; const sa = window.stepAgent;   // assert the instrument is on the live path
  const CAP = typeof ALLOT_CAP !== 'undefined' ? ALLOT_CAP : 3;   // HEAD spells the cap as a literal 3; the candidate names it
  const d0 = day; let n=0, doorShut=0, atThree=0, dark=0, rateSum=0, ripeSum=0, present=0, kneeling=0;
  while(day<d0+${d}){
    __warp(0.25); n++;
    const ac = agents.filter(g=>g.kind==='allot' && !g.tend);
    if (ac.length >= CAP) doorShut++;          // the REFUSAL: the roll's door shut against the cap in force
    if (ac.length >= 3) atThree++;
    if (!(daylight > 0.3)) dark++;
    rateSum += (0.01 + 0.16*ripePlots()/17 + (digWeather() && fallowPlots().length ? DIG_RATE : 0)) * (raining?0.2:1);
    ripeSum += ripePlots();
    present += ac.length; if (ac.some(g=>g.state==='kneel')) kneeling++;
    for (const g of ac){ const k = key(g.plot); if (k in presPlot){ presPlot[k]++; if (g.state==='kneel') kneelPlot[k]++; } }
  }
  A.spawnLane = A.sendTo - A.spawnOwn;
  return {A, perPlot, presPlot, kneelPlot, n, doorShut, atThree, cap:CAP, dark, rateSum, ripeSum, present, kneeling, harvested};
})()`;
const b = await chromium.launch(); const rows=[];
for(const s of SEEDS){ const p=await b.newPage({viewport:{width:1280,height:700}});
  const e=[]; p.on('pageerror',x=>e.push(String(x)));
  await p.goto(FILE+'?seed='+s+'&pause'); await p.waitForFunction('typeof __warp==="function"');
  rows.push(await p.evaluate(S(DAYS))); if(e.length){console.error('PAGE ERROR',e[0]);process.exit(2);} await p.close(); }
await b.close();
const sum=f=>rows.reduce((a,r)=>a+f(r),0), NS=rows.length;
const acts = sum(r=>r.A.turn+r.A.harv+r.A.act);
console.log(`[${arg('--label','HEAD')}] ${NS} seeds x ${DAYS} days (a seed-year is 26 days)`);
console.log(`  ACTS (counted at the call)  total ${acts}   = ${(acts/NS).toFixed(1)} per seed-year`);
console.log(`     sow/tend rungs ${sum(r=>r.A.act)}   harvest ${sum(r=>r.A.harv)}   turn ${sum(r=>r.A.turn)}   plotAct returning 0 ${sum(r=>r.A.actNil)}`);
console.log(`  SUPPLY  spawnAllotAgent ${sum(r=>r.A.spawnOwn)}  (${(sum(r=>r.A.spawnOwn)/NS).toFixed(1)}/yr)   lane detour ${sum(r=>r.A.spawnLane)}  (${(sum(r=>r.A.spawnLane)/NS).toFixed(1)}/yr)`);
const n=sum(r=>r.n);
console.log(`  DOORS   samples ${n}   REFUSED (allotCount()>=cap ${rows[0].cap}) ${(100*sum(r=>r.doorShut)/n).toFixed(2)}%   >=3 holders ${(100*sum(r=>r.atThree)/n).toFixed(2)}%   daylight<=0.3 ${(100*sum(r=>r.dark)/n).toFixed(1)}%   mean allotRate ${(sum(r=>r.rateSum)/n).toFixed(4)}   mean ripePlots ${(sum(r=>r.ripeSum)/n).toFixed(2)}`);
console.log(`  PRESENCE  mean holders in block ${(sum(r=>r.present)/n).toFixed(3)}   samples with someone KNEELING ${(100*sum(r=>r.kneeling)/n).toFixed(2)}%`);
const KEYS = Object.keys(rows[0].perPlot);
const pp = KEYS.map(k=>sum(r=>r.perPlot[k])/NS).sort((a,b)=>a-b);
const pr = KEYS.map(k=>100*sum(r=>r.presPlot[k])/n).sort((a,b)=>a-b);
const kn = KEYS.map(k=>100*sum(r=>r.kneelPlot[k])/n).sort((a,b)=>a-b);
const q=(a,f)=>a[Math.min(a.length-1,Math.floor(f*a.length))];
console.log(`  PER PLOT (${KEYS.length} plots), acts per seed-YEAR:  min ${pp[0].toFixed(2)}  med ${q(pp,0.5).toFixed(2)}  max ${pp[pp.length-1].toFixed(2)}  mean ${(pp.reduce((a,c)=>a+c,0)/pp.length).toFixed(2)}`);
console.log(`     plots worked 0 times in an average year: ${pp.filter(v=>v<0.5).length}/${KEYS.length}`);
console.log(`  PER PLOT presence (% of samples a holder is ASSIGNED to it):  med ${q(pr,0.5).toFixed(3)}%  max ${pr[pr.length-1].toFixed(3)}%`);
console.log(`  PER PLOT kneeling (% of samples a hand is DOWN on it):        med ${q(kn,0.5).toFixed(3)}%  max ${kn[kn.length-1].toFixed(3)}%`);
console.log(`  harvested ${sum(r=>r.harvested)}${SET?'   [set '+SET+']':''}`);
