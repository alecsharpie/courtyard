#!/usr/bin/env node
/* #147 — a PLOT's crop vs its FIRST sown cell. A kneel scatters over seven cells and
 * crosses plot edges, so a plot holds two or three species; plotCrop() answered with
 * whichever the scan reached first, plotStands() turned that into "this plot is hardy",
 * and bedCap() handed the full winter ceiling to every cell in it. Count, over a year:
 *   - promotions to stage 3 IN THE COLD, split hardy / tender-in-the-open / under glass
 *   - tender cells sitting at stage 3 in the open while it is cold (the ride)
 *   - species per sown plot (does the block converge on one crop per row?)
 * The bar is the brief's: tender stalls with its neighbours, glass keeps going. */
import { homedir } from 'node:os'; import { join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const argv = process.argv.slice(2); const arg=(k,d)=>{const i=argv.indexOf(k);return i<0?d:argv[i+1];};
const SEEDS = arg('--seeds','7,42,1234').split(',').map(Number), DAYS=+arg('--days',26);
const FILE = pathToFileURL(join(process.cwd(), arg('--file','courtyard.html'))).href;
const S = d => `(async()=>{
  const HARDY = SPECIES.map(s=>!!s.hardy);
  const plots=[]; for(let oy=8;oy<=50;oy+=7) for(let ox=80;ox<=90;ox+=5) plots.push([ox,oy]);
  const PC = plots.map(o=>{ const out=[]; for(let y=o[1];y<o[1]+3;y++) for(let x=o[0];x<o[0]+4;x++){
    const i=y*GW+x; if(grid[i]===BED) out.push([i,x,y,inGlass(x,y)]); } return out; });
  const ALL = [].concat(...PC);
  const mk = () => ({n:0, ride:0, hardy3:0, glass3:0, up3h:0, up3t:0, up3g:0, plots:0, mixed:0, sp:0, ripe:0, cap:0});
  const D = mk(), W = mk(), M = mk();     // deep winter, shoulder, mild
  const prev = new Map();
  __reseed(); while(day<1) __warp(1); const d0=day;
  for (const [i] of ALL) prev.set(i, bSt[i]);
  while(day<d0+${d}){
    __warp(1);
    const bc = bloomCap(), B = bc < 1.5 ? D : bc < 3 ? W : M;
    B.n++; B.ripe += ripePlots(); B.cap += bloomCap();
    for (const [i,x,y,gl] of ALL){
      const was = prev.get(i), st = bSt[i], sp = bSp[i];
      if (st === 3 && was !== 3 && sp){ if (gl) B.up3g++; else if (HARDY[sp-1]) B.up3h++; else B.up3t++; }
      prev.set(i, st);
      if (st === 3 && sp){ if (gl) B.glass3++; else if (HARDY[sp-1]) B.hardy3++; else B.ride++; }
    }
    for (const cs of PC){
      const tal = new Set(); let sown = 0;
      for (const [i] of cs){ if (bSp[i]){ sown++; tal.add(bSp[i]); } }
      if (sown){ B.plots++; B.sp += tal.size; if (tal.size > 1) B.mixed++; }
    }
  }
  return {D, W, M, harvested, produce:[...produce]};
})()`;
const b = await chromium.launch(); const rows=[];
for(const s of SEEDS){ const p=await b.newPage({viewport:{width:1280,height:700}});
  const e=[]; p.on('pageerror',x=>e.push(String(x)));
  await p.goto(FILE+'?seed='+s+'&pause'); await p.waitForFunction('typeof __warp==="function"');
  rows.push(await p.evaluate(S(DAYS))); if(e.length){console.error('PAGE ERROR',e[0]);process.exit(2);} await p.close(); }
await b.close();
const add=(k,f)=>rows.reduce((a,r)=>a+f(r[k]),0);
const show=(k,label)=>{
  const n=add(k,b=>b.n), pl=add(k,b=>b.plots)||1;
  console.log(`  ${label} (${n} samples, mean bloomCap ${(add(k,b=>b.cap)/(n||1)).toFixed(2)}, mean ripePlots ${(add(k,b=>b.ripe)/(n||1)).toFixed(2)})`);
  console.log(`     promotions to stage 3:  hardy ${add(k,b=>b.up3h)}   TENDER in the open ${add(k,b=>b.up3t)}   under glass ${add(k,b=>b.up3g)}`);
  console.log(`     cell-samples at stage 3: hardy ${add(k,b=>b.hardy3)}   TENDER in the open ${add(k,b=>b.ride)}   under glass ${add(k,b=>b.glass3)}`);
  console.log(`     sown plots ${pl}   mixed(>=2 species) ${(100*add(k,b=>b.mixed)/pl).toFixed(1)}%   mean species/plot ${(add(k,b=>b.sp)/pl).toFixed(3)}`);
};
console.log(`[${arg('--label','?')}] ${SEEDS.length} seeds x ${DAYS} days (a year is 26)`);
show('D','DEEP WINTER   bloomCap<1.5');
show('W','SHOULDER      1.5<=bloomCap<3');
show('M','MILD          bloomCap=3');
console.log(`  harvested ${add('harvested',v=>v)}   produce total ${add('produce',v=>v.reduce((a,c)=>a+c,0)).toFixed(1)}`);
