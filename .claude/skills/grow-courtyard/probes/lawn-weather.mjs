#!/usr/bin/env node
/* #198 — the garden's inflow, split by the WEATHER it is offered in.
 *
 * Three classes at the ROLL's own tick, in the sun's window (day>=1, sunUp<hour<sunDown):
 *   FAIR    !raining && weatherComing() <= SIT_REFUSE
 *   COMING  !raining && weatherComing() >  SIT_REFUSE
 *   RAIN    raining
 * Per class: ticks, set-outs by kind (attributed at the tick they happen on), the mean
 * lawnCount(), the share of ticks AT LAWN_CAP (the cap-binding test), and the share of
 * ticks where lawnOpen() even lets the roll happen (the rate-binding test).
 * Plus the two refusal edges #186 named: seatRefused() and skyLifts() fires, and what
 * arcShelter did with them; and free bays, so "the cap" and "the places" are separable.
 */
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = homedir() + '/.claude/skills/screenshot-verify/node_modules/playwright/index.js';
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i < 0 ? d : argv[i + 1]; };
const SRC = resolve(arg('--file', 'courtyard.html'));
const SEEDS = arg('--seeds', '7,42,1234,555,90210,31337').split(',').map(Number);
const DAYS = +arg('--days', 26);
const CLS = ['fair', 'coming', 'rain'];

const b = await chromium.launch();
const T = { ticks:{}, open:{}, atCap:{}, sumN:{}, sumBays:{}, out:{}, seatRef:0, seatWetOnly:0, skyLift:0, arcTook:0, arcOffer:0, err:0, all:0, allK:{} };
for (const c of CLS){ T.ticks[c] = 0; T.open[c] = 0; T.atCap[c] = 0; T.sumN[c] = 0; T.sumBays[c] = 0; T.out[c] = {}; }
for (const seed of SEEDS){
  const page = await b.newPage({ viewport: { width: 1280, height: 700 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(pathToFileURL(SRC).href + `?seed=${seed}&pause&t=2`);
  await page.waitForFunction('typeof __warp === "function"');
  const r = await page.evaluate(`(() => {
    __reseed();
    const WETF = ${arg('--wet', 'null')}, SW = ${arg('--strollw', 'null')};
    if (SW !== null) LAWN_W.stroll = SW;
    if (WETF !== null){ const LR = lawnRate; lawnRate = () => LR() * (raining ? WETF / LAWN_WET : 1); }
    const CLS = ${JSON.stringify(CLS)};
    const t = { ticks:{}, open:{}, atCap:{}, sumN:{}, sumBays:{}, out:{}, seatRef:0, seatWetOnly:0, skyLift:0, arcTook:0, arcOffer:0, fired:0, all:0, allK:{} };
    for (const c of CLS){ t.ticks[c]=0; t.open[c]=0; t.atCap[c]=0; t.sumN[c]=0; t.sumBays[c]=0; t.out[c]={}; }
    const cls = () => raining ? 'rain' : (weatherComing() > SIT_REFUSE ? 'coming' : 'fair');
    // instrumented AFTER __reseed (LAW: __reseed reassigns R and eats a patch installed before it)
    const SL = spawnLawnAgent;
    spawnLawnAgent = function(w){ const n = agents.length; const v = SL(w); t.fired++;
      if (agents.length > n){ const k = agents[agents.length-1].kind, c = cls();
        t.all++; t.allK[k] = (t.allK[k]||0) + 1;
        t.out[c][k] = (t.out[c][k]||0) + 1; } return v; };
    const SR = seatRefused; seatRefused = function(a){ const v = SR(a);
      if (v){ t.seatRef++; if (!(weatherComing() > SIT_REFUSE)) t.seatWetOnly++; } return v; };
    const SK = skyLifts; skyLifts = function(a){ const v = SK(a); if (v) t.skyLift++; return v; };
    if (typeof arcShelter === 'function'){ const AS = arcShelter;
      arcShelter = function(a){ t.arcOffer++; const v = AS(a); if (v) t.arcTook++; return v; }; }
    while (day < 1) __warp(1);
    const d0 = day;
    while (day < d0 + ${DAYS}){
      __warp(0.25);
      if (!(day >= 1 && hour > sunUp && hour < sunDown)) continue;
      const c = cls(); t.ticks[c]++;
      if (lawnOpen()) t.open[c]++;
      const n = lawnCount(); t.sumN[c] += n; if (n >= LAWN_CAP) t.atCap[c]++;
      t.sumBays[c] += ARCADE_BAYS.filter(bb => !agents.some(o => o.place === bb && lawnHolds(o))).length;
    }
    return t;
  })()`);
  if (errs.length){ console.error('seed ' + seed + ' page error: ' + errs[0]); T.err++; }
  if (!r.fired) console.error('seed ' + seed + ': spawnLawnAgent patch NEVER FIRED');
  for (const c of CLS){ for (const k of ['ticks','open','atCap','sumN','sumBays']) T[k][c] += r[k][c];
    for (const kk of Object.keys(r.out[c])) T.out[c][kk] = (T.out[c][kk]||0) + r.out[c][kk]; }
  for (const k of ['seatRef','seatWetOnly','skyLift','arcTook','arcOffer','all']) T[k] += r[k];
  for (const kk of Object.keys(r.allK)) T.allK[kk] = (T.allK[kk]||0) + r.allK[kk];
  await page.close();
}
await b.close();
const pc = (a, b2) => b2 ? (100*a/b2).toFixed(1)+'%' : '   -  ';
console.log(`file ${SRC.split('/').pop()}   ${SEEDS.length} seeds x ${DAYS} days   (sun-up ticks, 0.25 s)   wet=${arg('--wet','build')} strollW=${arg('--strollw','build')}`);
console.log('  class     ticks   share  lawnOpen   mean lawnCount   at LAWN_CAP   free bays   set-outs');
let tot = 0; for (const c of CLS) tot += T.ticks[c];
for (const c of CLS){
  const n = T.ticks[c], so = Object.values(T.out[c]).reduce((s,v)=>s+v,0);
  console.log(`  ${c.padEnd(8)}${String(n).padStart(7)}  ${pc(n,tot).padStart(6)}  ${pc(T.open[c],n).padStart(7)}` +
    `   ${(T.sumN[c]/(n||1)).toFixed(2).padStart(12)}   ${pc(T.atCap[c],n).padStart(11)}   ${(T.sumBays[c]/(n||1)).toFixed(2).padStart(9)}   ${String(so).padStart(6)}  ` +
    Object.entries(T.out[c]).sort((p,q)=>q[1]-p[1]).map(([k,v])=>k+' '+v).join(' '));
}
console.log(`  seatRefused fires ${T.seatRef}  (of which wetness only, no front: ${T.seatWetOnly})`);
console.log(`  skyLifts fires    ${T.skyLift}`);
console.log(`  arcShelter        offered ${T.arcOffer}  took ${T.arcTook}`);
console.log(`  ALL lawn set-outs (arcade.mjs's denominator, incl. the pre-dawn gardener) ${T.all}   ` +
  Object.entries(T.allK).sort((p,q)=>q[1]-p[1]).map(([k,v])=>k+' '+v).join(' '));
