#!/usr/bin/env node
/* #152 — what a KNEEL in the allotments actually DOES, counted on an instrumented copy
 * of the file under test (identical logic + tallies; no behaviour changed). Every
 * allotment visit ends in `state:'kneel'`, and the branch at stepAgent forks three ways:
 *   dig    -> turnPlot()      (the winter job)
 *   ripe   -> harvestPlot()   (the row comes up)
 *   else   -> the hand-sow loop, which plants into BARE cells only
 * The premise of b152 is that the third branch plants nothing, because caTick's infill
 * has already sown every cell of an unripe plot. This counts the three branches over a
 * year x N seeds and, for every hand-sow kneel, profiles the plot it happened at — what
 * the row was doing and what furniture the plot affords — so the replacement act can be
 * designed against the cases that actually occur.  --file to point at a candidate. */
import { homedir, tmpdir } from 'node:os'; import { join } from 'node:path';
import { readFileSync, writeFileSync } from 'node:fs'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const argv = process.argv.slice(2); const arg=(k,d)=>{const i=argv.indexOf(k);return i<0?d:argv[i+1];};
const SEEDS = arg('--seeds','7,42,1234').split(',').map(Number), DAYS=+arg('--days',26);
const SRC = readFileSync(join(process.cwd(), arg('--file','courtyard.html')), 'utf8');

/* ---- the instrument. Anchors are exact; a miss is fatal, never a silent zero. ---- */
const HEAD_A = `      if (a.kind === 'allot' && a.dig){ turnPlot(a); }
      else if (!(a.kind === 'allot' && a.plot && harvestPlot(a))){
        let planted = 0;`;
const CAND_A = `      if (a.kind === 'allot' && a.dig){ turnPlot(a); }
      else if (!(a.kind === 'allot' && a.plot && (harvestPlot(a) || plotAct(a)))){
        let planted = 0;`;
const NEW_A = `      const __dig = (a.kind === 'allot' && a.dig);
      const __hv = (!__dig && a.kind === 'allot' && a.plot) ? harvestPlot(a) : 0;
      const __pf = (!__dig && a.kind === 'allot' && a.plot && !__hv) ? __plotProfile(a) : null;
      __K.kneel++; if (a.kind === 'allot') __K.allot++;
      if (__hv) __K.harv++;
      if (!__dig && !__hv && a.kind === 'allot' && a.plot) a.act = '';
      const __ac = (!__dig && !__hv && a.kind === 'allot' && a.plot && typeof plotAct === 'function') ? plotAct(a) : 0;
      __lastAct = a.act || '?';
      if (__pf){ __pf.act = __ac ? __lastAct : ''; __pf.n = __ac; __K.profile.push(__pf); }
      if (__ac){ __K.act++; __K.actBy[__lastAct] = (__K.actBy[__lastAct]||0)+1; __K.actCells += __ac; }
      if (__dig){ const __n = turnPlot(a); __K.turn++; if (!__n) __K.turnZero++; }
      else if (!__hv && !__ac){
        if (a.kind === 'allot') __K.sow++; else __K.other++;
        let planted = 0;`;
const HEAD_B = `        if (planted) sayAt(a.x, a.y, 'Fresh ' + SPECIES[sp-1].name + ' go into the bed, patted down gently.');
      }`;
const NEW_B = `        if (planted) sayAt(a.x, a.y, 'Fresh ' + SPECIES[sp-1].name + ' go into the bed, patted down gently.');
        __K.cells += planted; if (a.kind === 'allot' && planted) __K.sowHit++;
      }`;
const PRE = `let __lastAct = '';
const __K = {kneel:0, allot:0, harv:0, turn:0, turnZero:0, sow:0, sowHit:0, other:0, cells:0, act:0, actCells:0, actBy:{}, profile:[]};
function __plotProfile(a){
  const [ox, oy] = plotOrigin(a.plot[0], a.plot[1]);
  const p = {ox, oy, bed:0, sown:0, bare:0, resting:0, turned:0, underCap:0, st:[0,0,0,0], glass:inGlass(ox+1,oy+1),
             warmth:+warmth.toFixed(2), wet:+wetF().toFixed(2), rain:raining?1:0, cap:+bloomCap().toFixed(2), furn:[]};
  for (let y = oy; y < oy + 2; y++) for (let x = ox; x < ox + 3; x++){
    const i = y * GW + x; if (grid[i] !== BED) continue;
    p.bed++; p.st[bSt[i]]++;
    if (bSp[i]){ p.sown++; if (bSt[i] < bedCap(x, y)) p.underCap++; }
    else { p.bare++; if (bAge[i] > 0) p.resting++; }
    if (turned[i]) p.turned++;
  }
  // exactly the hand-sow loop's own predicate, over exactly the cells it scans (7x7 about
  // the kneeler, rounded), minus its R()<0.6 — how many cells the sow COULD have taken
  p.elig = 0; p.eligPlot = 0;
  for (let dy=-3; dy<=3; dy++) for (let dx=-3; dx<=3; dx++){
    const x = Math.round(a.x+dx), y = Math.round(a.y+dy);
    if (x<0||y<0||x>=N||y>=WH) continue;
    const j = y*GW+x;
    if ((grid[j]===BED||grid[j]===CBED) && !bSp[j] && !bAge[j] && !(turned[j] && warmth < DIG_WARMTH)){
      p.elig++; if (x>=ox && x<ox+3 && y>=oy && y<oy+2) p.eligPlot++;
    }
  }
  p.spec = speciesFor(a.x, a.y).length;
  /* the SUBSETS a real act could touch, all off cells the plot already owns */
  p.adv = 0; p.age = 0; p.free = 0; p.crop = plotCrop(ox, oy);
  for (let y = oy; y < oy + 2; y++) for (let x = ox; x < ox + 3; x++){
    const i = y * GW + x; if (grid[i] !== BED) continue;
    if (bSp[i]){ if (bSt[i] < bedCap(x, y)) p.adv++; if (bAge[i] > 0) p.age++; }
    else if (!bAge[i] && !(turned[i] && warmth < DIG_WARMTH) && p.crop) p.free++;
  }
  p.union = p.adv + p.age + p.resting + p.free;
  for (const f of ALLOT_FURN) if (f.ox === ox && f.oy === oy && allotFurnOn(f)) p.furn.push(f.kind);
  return p;
}
function stepAgent(a, dt){`;

let src = SRC, hits = 0;
if (src.includes(HEAD_A)){ src = src.replace(HEAD_A, NEW_A); hits++; }
else if (src.includes(CAND_A)){ src = src.replace(CAND_A, NEW_A); hits++; }
if (src.includes(HEAD_B)){ src = src.replace(HEAD_B, NEW_B); hits++; }
if (src.includes('function stepAgent(a, dt){')){ src = src.replace('function stepAgent(a, dt){', PRE); hits++; }
if (hits !== 3){ console.error('INSTRUMENT MISS: only', hits, 'of 3 anchors matched'); process.exit(2); }
src = src.replace('</body>', '<script>window.__K = __K;</script></body>');
const OUT = join(tmpdir(), 'ck-kneel-' + Date.now() + '.html');
writeFileSync(OUT, src);

const S = d => `(async()=>{
  __reseed(); while(day<1) __warp(1); const d0=day;
  for (const k in __K) if (typeof __K[k] === 'number') __K[k]=0;
  __K.profile.length = 0; for (const k in __K.actBy) delete __K.actBy[k];
  while(day<d0+${d}) __warp(1);
  return {K:__K, harvested};
})()`;
const b = await chromium.launch(); const rows=[];
for(const s of SEEDS){ const p=await b.newPage({viewport:{width:1280,height:700}});
  const e=[]; p.on('pageerror',x=>e.push(String(x)));
  await p.goto(pathToFileURL(OUT).href+'?seed='+s+'&pause'); await p.waitForFunction('typeof __warp==="function"');
  const r = await p.evaluate(S(DAYS));
  if(e.length){console.error('PAGE ERROR',e[0]);process.exit(2);} rows.push(r); await p.close(); }
await b.close();
const sum = f => rows.reduce((a,r)=>a+f(r.K),0);
const P = [].concat(...rows.map(r=>r.K.profile));
console.log(`[${arg('--label','?')}] ${arg('--file','courtyard.html')} — ${SEEDS.length} seeds x ${DAYS} days (a year is 26)`);
console.log(`  kneels total ${sum(k=>k.kneel)}   of them allotment ${sum(k=>k.allot)}   courtyard/other ${sum(k=>k.other)}`);
console.log(`    HARVEST  ${sum(k=>k.harv)}`);
console.log(`    TURN     ${sum(k=>k.turn)}   of which turned 0 cells: ${sum(k=>k.turnZero)}`);
console.log(`    ACT      ${sum(k=>k.act)}   cells touched ${sum(k=>k.actCells)}   ${JSON.stringify(rows.reduce((a,r)=>{for(const k in r.K.actBy)a[k]=(a[k]||0)+r.K.actBy[k];return a;},{}))}`);
console.log(`    HAND-SOW ${sum(k=>k.sow)}   of which planted >=1 cell: ${sum(k=>k.sowHit)}   cells planted total (all kneels) ${sum(k=>k.cells)}`);
if (P.length){
  const m = f => (P.reduce((a,p)=>a+f(p),0)/P.length);
  const share = f => (100*P.filter(f).length/P.length).toFixed(0)+'%';
  console.log(`  the ${P.length} plots a hand-sow/act kneel found:`);
  console.log(`     mean bed cells ${m(p=>p.bed).toFixed(2)}  sown ${m(p=>p.sown).toFixed(2)}  bare ${m(p=>p.bare).toFixed(2)}  resting ${m(p=>p.resting).toFixed(2)}  turned ${m(p=>p.turned).toFixed(2)}`);
  console.log(`     fully sown ${share(p=>p.bare===0)}   any cell BELOW its bedCap ${share(p=>p.underCap>0)}   mean underCap ${m(p=>p.underCap).toFixed(2)}`);
  console.log(`     stage histogram over cells: ${[0,1,2,3].map(s=>s+':'+P.reduce((a,p)=>a+p.st[s],0)).join('  ')}`);
  console.log(`     under glass ${share(p=>p.glass)}   raining ${share(p=>p.rain)}   wet>0.35 ${share(p=>p.wet>0.35)}   warmth<0.5 ${share(p=>p.warmth<0.5)}`);
  const kinds = ['shed','bay','butt','barrow','canes','cloche'];
  console.log(`     furniture SHOWING on the plot: ${kinds.map(k=>k+' '+share(p=>p.furn.includes(k))).join('  ')}`);
  console.log(`     plot has NO furniture showing besides the barrow: ${share(p=>p.furn.filter(k=>k!=='barrow').length===0)}`);
  console.log(`     act SUBSETS per plot: advance ${m(p=>p.adv).toFixed(2)}  ageing-at-cap ${m(p=>p.age).toFixed(2)}  resting ${m(p=>p.resting).toFixed(2)}  free+crop ${m(p=>p.free).toFixed(2)}  UNION ${m(p=>p.union).toFixed(2)}   union EMPTY ${share(p=>p.union===0)}   plotCrop 0 ${share(p=>!p.crop)}`);
  console.log(`     butt+dry ${share(p=>p.furn.includes('butt')&&!p.rain&&p.wet<0.4)}   canes ${share(p=>p.furn.includes('canes'))}   any resting ${share(p=>p.resting>0)}   any free ${share(p=>p.free>0)}`);
  console.log(`     the sow loop's OWN predicate: mean eligible cells in its 7x7 scan ${m(p=>p.elig).toFixed(2)}  (in the plot ${m(p=>p.eligPlot).toFixed(2)})   kneels with ZERO eligible ${share(p=>p.elig===0)}   speciesFor() empty ${share(p=>p.spec===0)}`);
}
if (argv.includes('--dump')) for (const p of P) console.log('    ', JSON.stringify(p));
console.log(`  harvested cells ${rows.reduce((a,r)=>a+r.harvested,0)}`);
