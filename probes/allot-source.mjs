#!/usr/bin/env node
/* #137 — WHO is working the allotments? Two sources reach the block through the same
 * sendToPlot(): spawnAllotAgent, whose rate IS ripeness, and spawnLaneAgent's detour
 * branch, which is a flat 6% of the lane's roll. Both are gated on allotCount() < 3.
 * If the lane's roll gets busier, the flat source fills the block and the ripe-driven
 * one is starved without a line changing. Count the arrivals by source. */
import { homedir } from 'node:os'; import { join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const argv = process.argv.slice(2); const arg=(k,d)=>{const i=argv.indexOf(k);return i<0?d:argv[i+1];};
const SEEDS = arg('--seeds','7,42,1234').split(',').map(Number), DAYS=+arg('--days',26);
const FILE = pathToFileURL(join(process.cwd(), arg('--file','courtyard.html'))).href;
const S = d => `(async()=>{
  let own=0, detour=0, harvests=0, ripeAt=[];
  const oA = window.spawnAllotAgent, oL = window.spawnLaneAgent, oH = window.harvestPlot;
  window.spawnAllotAgent = function(...w){ own++; return oA(...w); };
  window.spawnLaneAgent  = function(...w){ const n = allotCount(); const r = oL(...w); if (allotCount() > n) detour++; return r; };
  window.harvestPlot     = function(...w){ harvests++; return oH(...w); };
  __reseed(); while(day<1) __warp(1); const d0=day;
  let full=0, n=0;
  while(day<d0+${d}){ __warp(1); n++; if (allotCount()>=3) full++; ripeAt.push(ripePlots()); }
  return { own, detour, harvests, atCap: 100*full/n, ripe: ripeAt.reduce((a,b)=>a+b,0)/ripeAt.length };
})()`;
const b = await chromium.launch(); const rows=[];
for(const s of SEEDS){ const p=await b.newPage({viewport:{width:1280,height:700}});
  const e=[];p.on('pageerror',x=>e.push(String(x)));
  await p.goto(FILE+'?seed='+s+'&pause'); await p.waitForFunction('typeof __warp==="function"');
  rows.push(await p.evaluate(S(DAYS))); if(e.length){console.error('PAGE ERROR',e[0]);process.exit(2);} await p.close(); }
await b.close();
const sum=k=>rows.reduce((a,r)=>a+r[k],0), avg=k=>sum(k)/rows.length;
console.log(`[${arg('--label','?')}] over ${SEEDS.length} seeds x ${DAYS} days:`);
console.log(`  arrivals  own(ripeness-driven) ${sum('own')}   lane detour ${sum('detour')}   own share ${(100*sum('own')/(sum('own')+sum('detour')||1)).toFixed(0)}%`);
console.log(`  harvestPlot calls ${sum('harvests')}   allotCount() at 3 for ${avg('atCap').toFixed(1)}% of samples   mean ripePlots ${avg('ripe').toFixed(2)}`);
