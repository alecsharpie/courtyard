#!/usr/bin/env node
/* b131 — WHY the punt refuses, and by HOW MUCH. Instruments puntFits() at its own
 * seam, records every offer with its cause and, for a TIME refusal, the deficit in
 * hours: (puntTripH + PUNT_MIN_STAY_H) - (eastCloseHour() - hour). That deficit is
 * the price of opening the evening crossing — it says which end has to give.
 *
 *   node probe-punt-evening.mjs [--file f.html] [--days 14] [--label L]
 */
import { homedir } from 'node:os';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i < 0 ? d : argv[i + 1]; };
const SRC = resolve(arg('--file', 'courtyard.html'));
const SEEDS = arg('--seeds', '7,42,1234,5,99,404,777,2024,31337,8').split(',').map(Number);
const DAYS = +arg('--days', 14);
const LABEL = arg('--label', SRC.endsWith('courtyard.html') ? 'CANDIDATE' : SRC);
if (!existsSync(SRC)) { console.error('no such file', SRC); process.exit(2); }

const SWEEP = (days) => `(async () => {
  const offers = [];
  const orig = window.puntFits || puntFits;
  window.puntFits = function(a){
    const ok = orig(a);
    let why = 'ok';
    if (!ok){
      if (punt.leg !== 0) why = 'busy';
      else if (a.with || a.small) why = 'companion';
      else if (raining) why = 'rain';
      else if (windF() >= 0.5) why = 'wind';
      else if (!eastOpen()) why = (typeof puntNightFits === 'function' && hour >= SOLAR_NOON) ? 'bell' : 'dark';
      else if (a.pairLead && (()=>{const m = puntMate(a); return !m || m.small || Math.hypot(m.x-a.x,m.y-a.y) > 3;})()) why = 'mate';
      else why = 'time';
    }
    offers.push({ ok: ok?1:0, why, hour, day, far: a.far?1:0, east: a.east?1:0,
      trip: puntTripH(a), close: eastCloseHour(), sunDown, sunUp, jetty: a.jetty?1:0,
      // what the way HOME costs this offer, from where they stand: the rest of their
      // own route, at their own pace — the thing an evening trip has to fit in front of
      homeH: (()=>{ try { return pathHours(a.x, a.y, a.wp.slice(a.i), a.speed); } catch(e){ return -1; } })(),
      eve: hourEve(),
      need: puntTripH(a) + PUNT_MIN_STAY_H - (eastCloseHour() - hour) });
    return ok;
  };
  const trips = [];
  __reseed();
  let cur = null, lastLeg = 0, stranded = 0, lampsAt = [];
  while (day < 1) __warp(1);
  const d0 = day;
  while (day < d0 + ${days}){
    __warp(0.25);
    const leg = punt.leg, R = punt.rider, M = punt.mate || null;
    if (leg && !lastLeg){ cur = { day, hour, paired:0, crossed:0, land:0, home:0, boardH:hourEve(),
                                  offH:-1, backH:-1, dark:0, lamps:0, night: (punt.night?1:0), eyotOff:-1 }; trips.push(cur); }
    if (cur){
      if (M) cur.paired = 1;
      if (leg >= 2 && !cur.crossed){ cur.crossed = 1; cur.offH = hour; }
      if (leg >= 2 && !eastOpen()) cur.dark = 1;
      if (leg >= 2 && nightF > 0.3) cur.lamps = 1;
      if (leg === 3) cur.eyotOff = hourEve();
      if (leg === 3) cur.land = Math.max(cur.land, (R && !R.aboard ?1:0) + (M && !M.aboard ?1:0));
      if (!leg && lastLeg){ cur.home = 1; cur.backH = hourEve(); cur.endLeg = lastLeg; cur = null; }
    }
    // anyone left standing on the eyot with the boat moored and empty at the bell
    { const on = agents.filter(a => a.eyot && !a.done).length;
      if (on && hourEve() >= EVE_GONE) stranded++;
      if (on) lampsAt.push(hourEve()); }
    lastLeg = leg;
  }
  const late = agents.filter(a => a.eyot && !a.done).length;
  return { trips, offers, stranded, late, eyotLast: lampsAt.length ? Math.max(...lampsAt) : -1 };
})()`;

const browser = await chromium.launch();
const runs = [];
for (const seed of SEEDS){
  const page = await browser.newPage({ viewport: { width: 1280, height: 700 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(pathToFileURL(SRC).href + `?seed=${seed}&pause`);
  await page.waitForFunction('typeof __warp === "function"');
  const r = await page.evaluate(SWEEP(DAYS));
  if (errs.length) { console.error('PAGE ERROR', errs[0]); process.exit(2); }
  runs.push({ seed, ...r });
  await page.close();
}
await browser.close();

const trips = runs.flatMap(r => r.trips), offers = runs.flatMap(r => r.offers);
const crossed = trips.filter(t => t.crossed), paired = crossed.filter(t => t.paired);
const f2 = x => x.toFixed(2);
const med = a => a.length ? a.slice().sort((x,y)=>x-y)[a.length>>1] : NaN;
console.log(`\n=== punt: the evening crossing — ${LABEL} · ${SEEDS.length} seeds x ${DAYS} days ===`);
console.log(`  offers ${offers.length}   yes ${offers.filter(o=>o.ok).length}`);
const by = {};
for (const o of offers) if (!o.ok) by[o.why] = (by[o.why]||0)+1;
console.log(`  refused by cause: ${Object.entries(by).sort((a,b)=>b[1]-a[1]).map(([k,v])=>k+' '+v).join(' · ')}`);
const T = offers.filter(o=>!o.ok && o.why==='time');
console.log(`  TIME refusals ${T.length}  hour med ${f2(med(T.map(o=>o.hour)))} (p10 ${f2(med(T.map(o=>o.hour).sort((a,b)=>a-b).slice(0,Math.max(1,T.length/5))))})`);
console.log(`     deficit hours needed: med ${f2(med(T.map(o=>o.need)))}  min ${f2(Math.min(...T.map(o=>o.need)))}  max ${f2(Math.max(...T.map(o=>o.need)))}`);
for (const q of [0.25,0.5,0.75,1,1.5,2,3,4,6])
  console.log(`       within ${String(q).padStart(4)} h of fitting: ${T.filter(o=>o.need<=q).length}  (${(100*T.filter(o=>o.need<=q).length/Math.max(1,T.length)).toFixed(0)}%)`);
console.log(`  offer hour by source: far med ${f2(med(offers.filter(o=>o.far).map(o=>o.hour)))} (n ${offers.filter(o=>o.far).length}) · deck/east med ${f2(med(offers.filter(o=>!o.far).map(o=>o.hour)))} (n ${offers.filter(o=>!o.far).length})`);
console.log(`  eastCloseHour med ${f2(med(offers.map(o=>o.close)))}  sunDown med ${f2(med(offers.map(o=>o.sunDown)))}  tripH med ${f2(med(offers.map(o=>o.trip)))}`);
console.log(`  crossings ${crossed.length}  (${f2(crossed.length/SEEDS.length/DAYS)}/day)   people carried ${crossed.length+paired.length}  (${f2((crossed.length+paired.length)/SEEDS.length/DAYS)}/day)`);
const N = crossed.filter(t=>t.night);
console.log(`  EVENING crossings (boarded after eastOpen closed) ${N.length}   people carried on them ${N.length + N.filter(t=>t.paired).length}`);
console.log(`     boarding hourEve med ${f2(med(N.map(t=>t.boardH)))}  off the eyot med ${f2(med(N.filter(t=>t.eyotOff>=0).map(t=>t.eyotOff)))}  back at the mooring med ${f2(med(N.filter(t=>t.backH>=0).map(t=>t.backH)))}  came home ${N.filter(t=>t.home).length}/${N.length}`);
console.log(`     of them with the river lamps lit (nightF>0.3) ${N.filter(t=>t.lamps).length}`);
if (N.length) console.log(`     WORST: last boarding ${f2(Math.max(...N.map(t=>t.boardH)))}  last off the eyot ${f2(Math.max(...N.map(t=>t.eyotOff)))}  last back at the mooring ${f2(Math.max(...N.filter(t=>t.backH>=0).map(t=>t.backH)))}   [EVE_GONE 26.5, less EVE_BELL 26.15]`);
console.log(`  any crossing touching the dark ${crossed.filter(t=>t.dark).length}   lamps lit ${crossed.filter(t=>t.lamps).length}`);
console.log(`  board hour med ${f2(med(crossed.map(t=>t.boardH)))}  home hour med ${f2(med(crossed.filter(t=>t.backH>=0).map(t=>t.backH)))}  came home ${crossed.filter(t=>t.home).length}/${crossed.length}`);
const src = o => o.far ? 'far' : 'deck';
const tab = {};
for (const o of offers){ const k = src(o)+'/'+o.why; tab[k]=(tab[k]||0)+1; }
console.log('  cause x source: ' + Object.entries(tab).sort((a,b)=>b[1]-a[1]).map(([k,v])=>k+' '+v).join(' · '));
const D = offers.filter(o=>!o.far);
const H = {}; for (const o of D){ const b = Math.floor(o.hour); H[b]=(H[b]||0)+1; }
console.log('  deck offer hour histogram: ' + Object.keys(H).sort((a,b)=>a-b).map(h=>h+'h:'+H[h]).join(' '));
console.log(`  deck walk-home hours: med ${f2(med(D.map(o=>o.homeH)))}  p90 ${f2(med(D.map(o=>o.homeH).sort((a,b)=>a-b).slice(Math.floor(D.length*0.8))))}   (eveGone 26.5)`);
const fits = (t) => D.filter(o => o.eve + t + o.homeH < 26.5 - 0.35).length;
for (const t of [0,2,3,3.5,4,5,6.8]) console.log(`     deck offers whose eve+trip(${t}h)+walk home lands before the bell: ${fits(t)} of ${D.length}`);
console.log(`  STRANDED: samples with someone on the eyot at/after EVE_GONE ${runs.reduce((s,r)=>s+r.stranded,0)}  ·  latest hourEve anyone stood on the eyot ${f2(Math.max(...runs.map(r=>r.eyotLast)))}  ·  still there at window end ${runs.map(r=>r.late).join(',')}`);
