#!/usr/bin/env node
/* #172, c257 — the CART's and the DRAY's calendars, histogrammed over a year in
 * several worlds. hash(day,k) is not seeded, so before the salt every world sent the
 * cart down the cross street on exactly the same days and home by the same end.
 * The bar: two seeds must DIFFER, and the unseeded page must be untouched. */
import { homedir } from 'node:os'; import { join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const argv = process.argv.slice(2); const arg=(k,d)=>{const i=argv.indexOf(k);return i<0?d:argv[i+1];};
const FILE = pathToFileURL(join(process.cwd(), arg('--file','courtyard.html'))).href;
const SEEDS = arg('--seeds','7,42,1234,55').split(',');
const CODE = `(()=>{ const out={cart:[],east:[],dray:[],round:[],r811:[]};
  const d0 = day;
  for (let d=d0; d<d0+26; d++){ day = d;
    out.cart.push(cartToday()?1:0); out.east.push(cartHomeX()>0?1:0); out.dray.push(drayToday()?1:0);
    out.round.push((hash(day,619)*SKIN.length)|0); out.r811.push((hash(day,811+(typeof WIND_SALT!=='undefined'?0:0))*SKIN.length)|0); }
  day = d0; return out; })()`;
const b = await chromium.launch(); const got = {};
for (const s of SEEDS.concat(['none'])){
  const p = await b.newPage({viewport:{width:800,height:600}});
  const e=[]; p.on('pageerror',x=>e.push(String(x)));
  await p.goto(FILE + (s==='none' ? '?pause' : '?seed='+s+'&pause'));
  await p.waitForFunction('typeof __warp==="function"');
  got[s] = await p.evaluate(CODE); if(e.length){console.error('PAGE ERROR',e[0]);process.exit(2);} await p.close();
}
await b.close();
const str = (s,k) => got[s][k].join('');
let bad = 0;
for (const k of ['cart','east','dray']){
  console.log(`  ${k.padEnd(5)} 26-day calendar per world:`);
  for (const s of SEEDS.concat(['none'])) console.log(`     seed ${String(s).padEnd(5)} ${str(s,k)}  (${got[s][k].reduce((a,c)=>a+c,0)} days)`);
  const uniq = new Set(SEEDS.map(s=>str(s,k)));
  const ok = uniq.size === SEEDS.length;
  console.log(`     distinct calendars across ${SEEDS.length} seeds: ${uniq.size}  ${ok?'OK':'*** IDENTICAL ***'}`);
  if (!ok) bad++;
}
const same = new Set(SEEDS.concat(['none']).map(s=>str(s,'cart')+'|'+str(s,'dray')));
/* The morning round's skin came off hash(day, 811) — drayToday()'s OWN key. Partition
   the index by whether a dray came that day: on the shared key the two sets cannot
   overlap, because "a dray comes" IS "this hash is under 0.7". Shown for both keys. */
const lo = got[SEEDS[0]].dray;
for (const [k, rk] of [['811 (HEAD\'s key)', got[SEEDS[0]].r811], ['619 (now)', got[SEEDS[0]].round]]){
  const on = rk.filter((_,i)=>lo[i]), off = rk.filter((_,i)=>!lo[i]);
  const overlap = [...new Set(on)].filter(v=>off.includes(v));
  console.log(`  round SKIN off key ${k}: dray days [${on.join(',')}]  no-dray [${off.join(',')}]  shared values ${overlap.length}${overlap.length?'':'  *** PARTITIONED: the face was gated by the dray ***'}`);
}
process.exit(bad ? 1 : 0);
