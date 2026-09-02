#!/usr/bin/env node
/* #126 — "the moss reads greener along [the low joints] than across the middle."
 * The ceiling only BINDS in the growing season (a ceiling is not a kill term), so one
 * summer instant cannot see it: this walks a whole year and splits the 860 mossy cells
 * by whether they POOL, on HEAD and on the tree. HEAD has no pudHollow[], so the probe
 * recomputes buildPuddles' own two-grain hash from the page's own consts on both.
 *   node probe-moss-pool.mjs [--seeds 7,42] [--days 26]
 */
import { homedir } from 'node:os'; import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url'; import { execSync } from 'node:child_process';
import { writeFileSync, unlinkSync } from 'node:fs';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const arg=(k,d)=>{const i=process.argv.indexOf(k);return i<0?d:process.argv[i+1];};
const SEEDS = arg('--seeds','7,42').split(',').map(Number), DAYS = +arg('--days', 26);
const H='/tmp/head126m.html'; writeFileSync(H, execSync('git show HEAD:courtyard.html',{maxBuffer:1<<28}).toString());
const RUN = (days) => `(() => {
  __reseed();
  const hol = new Float32Array(GW*WH);            // buildPuddles' own hash, off the page's consts
  for (let y=0;y<LN_WALK_S;y++) for (let x=0;x<GW;x++){
    const h = 0.45*hash(x,y+PUD_K) + 0.55*hash(x>>2,(y>>1)+PUD_DIP);
    if (h > PUD_CUT) hol[y*GW+x] = (h-PUD_CUT)/(1-PUD_CUT);
  }
  const cells = []; for (let i=0;i<GW*WH;i++) if (mossOwn[i]) cells.push(i);
  const deep = cells.filter(i => hol[i] > 0.40), dry = cells.filter(i => hol[i] === 0);
  const out = [];
  for (let d = 0; d < ${days}; d++){
    __warp(55);
    const mn = a => a.reduce((s,i)=>s+moss[i],0)/a.length;
    out.push({ day, warmth:+warmth.toFixed(3), deep:+mn(deep).toFixed(4), dry:+mn(dry).toFixed(4),
               all:+mn(cells).toFixed(4), mossy: __census().planting.mossy });
  }
  return { n:{cells:cells.length, deep:deep.length, dry:dry.length}, out };
})()`;
const b = await chromium.launch(); const R = {};
for (const [tag, file] of [['HEAD', H], ['tree', 'courtyard.html']]){
  R[tag] = [];
  for (const seed of SEEDS){
    const p = await b.newPage({ viewport:{width:1280,height:700} });
    await p.goto(pathToFileURL(resolve(file)).href + `?seed=${seed}&pause`);
    await p.waitForFunction(() => window.__warp);
    R[tag].push(await p.evaluate(RUN(DAYS))); await p.close();
  }
}
await b.close(); unlinkSync(H);
const n = R.HEAD[0].n;
console.log(`mossy cells ${n.cells} — POOLING (hollow>0.40) ${n.deep} · never pools ${n.dry} · ${DAYS} days x ${SEEDS.length} seeds\n`);
const mean = (tag, k, sel) => { const v = R[tag].flatMap(r => r.out.filter(sel).map(s => s[k]));
  return v.reduce((a,x)=>a+x,0)/v.length; };
const ALL = () => true, GROW = s => s.warmth < 0.55, PEAK = s => s.warmth < 0.35;
for (const [name, sel] of [['whole year', ALL], ['growing season (warmth<0.55)', GROW], ['cold shoulder (warmth<0.35)', PEAK]]){
  console.log(name);
  for (const k of ['deep','dry']){
    const h = mean('HEAD',k,sel), t = mean('tree',k,sel);
    console.log('  ' + (k==='deep'?'pools    ':'never    ') + ' HEAD ' + h.toFixed(4) + '   tree ' + t.toFixed(4)
      + '   ' + (t>h?'+':'') + ((t/h-1)*100).toFixed(1) + '%');
  }
  const gapH = mean('HEAD','deep',sel) - mean('HEAD','dry',sel), gapT = mean('tree','deep',sel) - mean('tree','dry',sel);
  console.log('  pools - never:  HEAD ' + gapH.toFixed(4) + '   tree ' + gapT.toFixed(4) + '   (x' + (gapT/gapH).toFixed(2) + ')\n');
}
console.log('census mossy, whole year mean:  HEAD ' + mean('HEAD','mossy',ALL).toFixed(1) + '   tree ' + mean('tree','mossy',ALL).toFixed(1));
