#!/usr/bin/env node
/* #159 — does a HAND ever put a second crop in, and where is the rate lost?
 * Counted on an instrumented COPY of the file under test (identical logic + tallies).
 * plotAct()'s sow rung is the one path that can break the block's monoculture, and it is
 * guarded by a chain: reach the rung at all -> the plot already HAS a crop -> there is
 * ROOM for a minority drill -> the holder's share -> a species to offer. Instrumented
 * CLAUSE BY CLAUSE in its own evaluation order, because a compound predicate's loudest
 * refusal is rarely the one you would guess.
 * Also samples the block every sim second for: species per sown plot, mixed episodes and
 * how long they last, and the two invariants that must not move — no tomato outside the
 * glass span, no tender cell at stage 3 in the open in deep winter.  --file for HEAD. */
import { homedir, tmpdir } from 'node:os'; import { join } from 'node:path';
import { readFileSync, writeFileSync } from 'node:fs'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const argv = process.argv.slice(2); const arg=(k,d)=>{const i=argv.indexOf(k);return i<0?d:argv[i+1];};
const SEEDS = arg('--seeds','7,42,1234,5,99,2024').split(',').map(Number), DAYS=+arg('--days',26);
const SRC = readFileSync(join(process.cwd(), arg('--file','courtyard.html')), 'utf8');

const ANCHOR = `  let oth = 0, othCells = null;
  if (sow.length){
    let held = 0;`;
const TALLY = `  let oth = 0, othCells = null;
  __I.act++;
  if (sow.length){ __I.sowRung++; if (!crop) __I.noCrop++; }
  if (sow.length){
    let held = 0;`;
const A2 = `    if (k > 0){
      const opts = speciesFor(ox + 1, oy + 1).filter(s => s !== SPECIES[sp - 1]);
      if (opts.length){`;
const T2 = `    if (k > 0) __I.room++; else __I.noRoom++;
    __I.eligible++;
    if (k > 0){
      const opts = speciesFor(ox + 1, oy + 1).filter(s => s !== SPECIES[sp - 1]);
      if (!opts.length) __I.noOpts++;
      if (opts.length){
        __I.fired++; __I.kCells += k;`;
const PRE = `const __I = {act:0, sowRung:0, noCrop:0, eligible:0, room:0, noRoom:0, lostShare:0, share:0, noOpts:0, fired:0, kCells:0, pairs:{}, rung:{}};
`;
const A4 = `  if (!n) return 0;                           // no draw spent: the branch below still has its own`;
const T4 = `  __I.rung[n ? (a.act||'?') : '(fall-through)'] = (__I.rung[n ? (a.act||'?') : '(fall-through)']||0)+1;
  if (!n) return 0;                           // no draw spent: the branch below still has its own`;
const A3 = `        othCells = sow.slice(sow.length - k);   // the near end of the bed, contiguous: a drill, not a speckle`;
const T3 = `        othCells = sow.slice(sow.length - k);
        { const kk = SPECIES[sp-1].name + ' + ' + SPECIES[oth-1].name; __I.pairs[kk] = (__I.pairs[kk]||0)+1; }`;

let src = SRC;
const isCand = src.includes(ANCHOR);
if (isCand){
  for (const [a, t] of [[ANCHOR, TALLY], [A2, T2], [A3, T3], [A4, T4]]){
    if (src.split(a).length - 1 !== 1) { console.error('ANCHOR MISS:\n' + a); process.exit(2); }
    src = src.replace(a, t);
  }
}
src = src.replace('/* ============ noise & utils ============ */', PRE + '/* ============ noise & utils ============ */');
if (!src.includes('__I')) { console.error('instrument not installed'); process.exit(2); }
const f = join(tmpdir(), 'ic-' + (isCand ? 'cand' : 'head') + '.html');
writeFileSync(f, src);

const S = d => `(async()=>{
  const TOM = SPECIES.findIndex(s=>s.glass)+1, BEANS = SPECIES.findIndex(s=>s.name==='beans')+1;
  const HARDY = SPECIES.map(s=>!!s.hardy);
  const plots=[]; for(let oy=8;oy<=50;oy+=7) for(let ox=80;ox<=90;ox+=5) plots.push([ox,oy]);
  const PC = plots.map(o=>{ const out=[]; for(let y=o[1];y<o[1]+2;y++) for(let x=o[0];x<o[0]+3;x++){
    const i=y*GW+x; if(grid[i]===BED) out.push([i,x,y,inGlass(x,y)]); } return out; });
  let n=0, sown=0, spSum=0, mixed=0, tomOut=0, tender3=0, winterN=0;
  let climbNoBeans=0, climbNotCrop=0, climbs=0;
  const open=new Array(PC.length).fill(0), lives=[];
  __reseed(); while(day<1) __warp(1); const d0=day;
  while(day<d0+${d}){
    __warp(1); n++;
    const deep = bloomCap() < 1.5; if (deep) winterN++;
    for (let p=0;p<PC.length;p++){
      const cs=PC[p]; const set=new Set(); let s=0;
      for (const [i,x,y,gl] of cs){
        const sp=bSp[i]; if(!sp) continue; s++; set.add(sp);
        if (sp===TOM && !gl) tomOut++;
        if (deep && !gl && !HARDY[sp-1] && bSt[i]===3) tender3++;
      }
      if (s){ sown++; spSum+=set.size; if(set.size>1) mixed++; }
      if (set.size>1){ open[p]++; } else if (open[p]){ lives.push(open[p]); open[p]=0; }
      const ox=plots[p][0], oy=plots[p][1];
      if (plotClimbs(ox,oy)){ climbs++; if(!set.has(BEANS)) climbNoBeans++; if(plotCrop(ox,oy)!==BEANS) climbNotCrop++; }
    }
  }
  for (const v of open) if (v) lives.push(v);
  return {n, sown, spSum, mixed, tomOut, tender3, winterN, climbs, climbNoBeans, climbNotCrop,
          lives, I: (typeof __I!=='undefined'? __I : null), harvested};
})()`;

const b = await chromium.launch(); const rows=[];
for(const s of SEEDS){ const p=await b.newPage({viewport:{width:1280,height:700}});
  const e=[]; p.on('pageerror',x=>e.push(String(x)));
  await p.goto(pathToFileURL(f).href+'?seed='+s+'&pause'); await p.waitForFunction('typeof __warp==="function"');
  rows.push(await p.evaluate(S(DAYS))); if(e.length){console.error('PAGE ERROR',e[0]);process.exit(2);} await p.close(); }
await b.close();
const sum=f=>rows.reduce((a,r)=>a+f(r),0);
const lives=[].concat(...rows.map(r=>r.lives));
console.log(`[${isCand?'CAND':'HEAD'}] ${SEEDS.length} seeds x ${DAYS} days`);
console.log(`  sown plot-samples ${sum(r=>r.sown)}   mixed ${sum(r=>r.mixed)} (${(100*sum(r=>r.mixed)/sum(r=>r.sown)).toFixed(2)}%)   mean species/plot ${(sum(r=>r.spSum)/sum(r=>r.sown)).toFixed(4)}`);
console.log(`  mixed EPISODES ${lives.length}   mean life ${(lives.reduce((a,c)=>a+c,0)/(lives.length||1)).toFixed(1)} sim s   longest ${Math.max(0,...lives)}`);
console.log(`  INVARIANTS  tomato outside the span ${sum(r=>r.tomOut)}   tender at stage 3 in the open in deep winter ${sum(r=>r.tender3)} (over ${sum(r=>r.winterN)} deep-winter samples)`);
console.log(`  CANES  plot-samples with canes-worthy beans ${sum(r=>r.climbs)}   of them plotCrop!==beans ${sum(r=>r.climbNotCrop)}   with no bean cell at all ${sum(r=>r.climbNoBeans)}`);
if (rows[0].I){
  const I = k => sum(r=>r.I[k]);
  console.log(`  FUNNEL  plotAct ${I('act')} -> sow rung ${I('sowRung')} (no crop yet ${I('noCrop')}) -> eligible ${I('eligible')}`);
  console.log(`          eligible (sow rung, room solved) ${I('eligible')} -> ROOM ${I('room')} (no room ${I('noRoom')}) -> FIRED ${I('fired')}, ${I('kCells')} cells (no species to offer ${I('noOpts')})`);
  const pairs = {}; for (const r of rows) for (const k in r.I.pairs) pairs[k]=(pairs[k]||0)+r.I.pairs[k];
  console.log('          pairs ' + (Object.entries(pairs).sort((a,b)=>b[1]-a[1]).map(([k,v])=>k+' x'+v).join(', ') || '(none)'));
  const rung = {}; for (const r of rows) for (const k in r.I.rung) rung[k]=(rung[k]||0)+r.I.rung[k];
  console.log('          rungs ' + (Object.entries(rung).sort((a,b)=>b[1]-a[1]).map(([k,v])=>k+' x'+v).join(', ') || '(none)'));
}
console.log(`  harvested ${sum(r=>r.harvested)}`);
