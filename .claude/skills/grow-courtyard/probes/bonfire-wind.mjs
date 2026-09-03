#!/usr/bin/env node
/* b178 — does a lit bonfire outlive the weather that lit it?
 * bonfireWeather() = !raining && wetF()<0.4 && !isWindy() && snowCover<=0, and it is
 * asked ONCE, at the match (agent 'tend' block). stepBonfire re-asks only the wet half
 * (`raining || snowCover > 0`), so the WIND clause has no re-ask at all: a fire lit in
 * a calm dawn burns on through an afternoon the same predicate would refuse.
 * Per fire, over seeded years, in sim HOURS:
 *   burn      hours with bon.on (being fed)
 *   refused   of those, hours where bonfireWeather() is false
 *   windy     of those, hours where isWindy() alone is the refusal
 *   wF@lit / wFmax   the wind at the match and at its worst while lit
 *   blown            ended by isWindy() rather than by its own fuel (candidate only)
 * The HEAD control is a REF, not a fetch (a law): regenerate the fixture with
 *   git show <ref>:courtyard.html > .probe-head.html   then pass --file .probe-head.html */
import { homedir } from 'node:os'; import { join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const argv = process.argv.slice(2); const arg=(k,d)=>{const i=argv.indexOf(k);return i<0?d:argv[i+1];};
const SEEDS = arg('--seeds','7,42,1234,2026').split(',').map(Number), DAYS = +arg('--days', 78);
const FILE = pathToFileURL(join(process.cwd(), arg('--file','courtyard.html'))).href;
const SAMP = +arg('--samp', 0.5);            // sim seconds between samples

const S = (d, samp) => `(async()=>{
  const H = ${samp} * 24 / DAY_LEN;          // sim hours per sample
  const fires = []; let cur = null;
  __reseed(); while (day < 1) __warp(1);
  const d0 = day, t0 = simT;
  while (simT - t0 < ${d} * DAY_LEN){
    __warp(${samp});
    const on = bon.on, wf = windF(), ok = bonfireWeather();
    if (on && !cur){ cur = {day, lit:+hour.toFixed(2), t0:+simT.toFixed(1), burn:0, refused:0, windy:0, wet:0, snow:0,
                            wfLit:+wf.toFixed(3), wfMax:wf, blown:false, tEnd:0}; fires.push(cur); }
    if (on && cur){
      cur.burn += H; cur.wfMax = Math.max(cur.wfMax, wf);
      if (!ok){ cur.refused += H;
        if (isWindy()) cur.windy += H;
        if (raining || wetF() >= 0.4) cur.wet += H;
        if (snowCover > 0) cur.snow += H; }
    }
    if (!on && cur){ cur.blown = !!bon.blown; cur.tEnd = +simT.toFixed(1); cur = null; }
  }
  return { fires, days:${d} };
})()`;

const b = await chromium.launch(); const all = [];
for (const s of SEEDS){
  const p = await b.newPage({ viewport:{ width:1280, height:700 } });
  const errs=[]; p.on('pageerror', x=>errs.push(String(x)));
  await p.goto(FILE + '?seed=' + s + '&t=0&pause');   // PIN the entry: a ?pause page still runs rAF, so the default start is ~2.2 s of un-reseeded world and HEAD/cand would be two different towns
  await p.waitForFunction('typeof __warp==="function"');
  const r = await p.evaluate(S(DAYS, SAMP));
  if (errs.length){ console.error('PAGE ERROR', errs[0]); process.exit(2); }
  for (const f of r.fires) all.push({ seed:s, ...f });
  await p.close();
  console.log(`seed ${s}: ${r.fires.length} fires over ${DAYS} days`);
}
await b.close();

const f2 = n => n.toFixed(2);
console.log(`\n  seed  day  lit-h  burn-h  refused-h  windy-h  wF@lit  wFmax`);
for (const f of all)
  console.log(`  ${String(f.seed).padStart(4)} ${String(f.day).padStart(4)} ${f2(f.lit).padStart(6)} ${f2(f.burn).padStart(7)} ${f2(f.refused).padStart(10)} ${f2(f.windy).padStart(8)} ${f2(f.wfLit).padStart(7)} ${f2(f.wfMax).padStart(6)}`);
const n = all.length, sum = k => all.reduce((a,f)=>a+f[k],0);
const outlived = all.filter(f => f.windy > 0.01), blown = all.filter(f => f.blown);
console.log(`\n  fires ${n} · total burn ${f2(sum('burn'))} h · refused ${f2(sum('refused'))} h · windy ${f2(sum('windy'))} h · wet ${f2(sum('wet'))} h · snow ${f2(sum('snow'))} h`);
console.log(`  FIRES THAT OUTLIVE THEIR WEATHER (windy while lit): ${outlived.length} / ${n} = ${(100*outlived.length/(n||1)).toFixed(1)}%`);
console.log(`  windy hours as a share of burn hours: ${(100*sum('windy')/(sum('burn')||1)).toFixed(1)}%`);
const mean = a => a.length ? sum2(a,'burn')/a.length : 0, sum2=(a,k)=>a.reduce((x,f)=>x+f[k],0);
console.log(`  ENDED BY THE WIND (bon.blown): ${blown.length} / ${n}  mean burn ${f2(mean(blown))} h vs ${f2(mean(all.filter(f=>!f.blown)))} h for the rest (all ${f2(mean(all))} h)`);
for (const f of blown) console.log(`    raked apart: seed ${f.seed} day ${f.day}  lit ${f2(f.lit)} h  burn ${f2(f.burn)} h  simT ${f.t0} -> ${f.tEnd}  wFmax ${f2(f.wfMax)}`);
if (outlived.length) console.log(`  worst: seed ${outlived.map(f=>f.seed+'/d'+f.day+' '+f2(f.windy)+'h @wF '+f2(f.wfMax)).join('  ')}`);
