#!/usr/bin/env node
/* punt-wind — b154: the punt's WIND refusal, swept.
 *
 *   node punt-wind.mjs [--seeds 10] [--days 26] [--day0 5] [--slow 0.45] [file]
 *
 * punt-supply.mjs (#141) counts puntFits' refusals clause by clause and names WIND
 * the top one. This one asks the next question: at WHAT wind, and what would a
 * higher bar actually buy? It records windF() at every offer, and — for the offers
 * the WIND clause deletes — re-asks the whole rest of the chain with the wind clause
 * suppressed, so "would this have been taken" is the real predicate's answer and not
 * a guess. The sweep is then arithmetic over the recorded distribution, which is why
 * one run answers every threshold at once instead of one run per constant.
 *
 * --slow k also re-prices the water leg at PUNT_SPEED*(1-k*windF()) inside the
 * counterfactual, so the table shows what a threshold buys once the wind is a COST
 * as well as a gate: a trip admitted at the bar but no longer fitting its window is
 * counted as refused by TIME, not by WIND.
 *
 * The wrapper ASSERTS its re-walk of the clauses agrees with the real verdict on
 * every call (LAW: suspect the instrument first). Installed AFTER __reseed().
 */
import { homedir } from 'node:os'; import { resolve, join, dirname } from 'node:path'; import { pathToFileURL, fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const arg = (n, d) => { const i = process.argv.indexOf(n); return i !== -1 && process.argv[i + 1] ? +process.argv[i + 1] : d; };
const fileArg = process.argv.find((s, i) => i > 1 && !s.startsWith('--') && s.endsWith('.html'));
const FILE = resolve(fileArg || resolve(HERE, '../../../../courtyard.html'));
const NS = arg('--seeds', 10), NDAYS = arg('--days', 26), DAY0 = arg('--day0', 5), SLOW = arg('--slow', 0.45);
/* --alt is the CONTROL seed set: the same build, ten other worlds. Any change that
 * moves what an R() draw is spent on reshuffles the calendar, so "offers fell" is only
 * a finding if it falls outside what HEAD does to ITSELF across seed sets. */
const SEEDS = (process.argv.includes('--alt') ? [5, 13, 17, 31, 37, 47, 59, 61, 71, 83]
                                              : [3, 7, 11, 19, 23, 29, 42, 51, 64, 77]).slice(0, NS);

const br = await chromium.launch();
const OFFERS = [], DAYW = [];
let fired = 0, mism = 0, seedDays = 0;
for (const seed of SEEDS){
  const p = await br.newPage({ viewport:{ width:1600, height:950 } });
  p.on('pageerror', e => console.log('PAGEERROR', e.message));
  await p.goto(pathToFileURL(FILE).href + `?pause&seed=${seed}`, { waitUntil:'load' });
  await p.waitForFunction(() => typeof window.__warp === 'function');
  const out = await p.evaluate(new Function('A', 'const {DAY0,NDAYS,SLOW}=A;' + `
  window.__reseed(); window.__warp(DAY0 * 55 - simT);
  const offers = [], dayW = []; let fired = 0, mism = 0;
  const f0 = puntFits;
  // the day/night fit, re-asked with the water leg re-priced: puntTripH's own algebra
  // with PUNT_SPEED scaled, so the counterfactual is the shipped predicate's shape.
  const tripH = (P, a, stand, k) => {
    const b = P.b, water = Math.hypot(b.land.x - b.moor.x, b.land.y - b.moor.y);
    const walk = 1.3 + Math.hypot(b.shore.x - b.land.x, b.shore.y - b.land.y)
                     + Math.hypot(stand.x - b.shore.x, stand.y - b.shore.y);
    return (walk / (0.75 * a.speed) + water / (PUNT_SPEED * (1 - k * windF()))) * HOURS_PER_S;
  };
  const fitsNoWind = (a, k) => {   // everything AFTER the wind clause, wind deleted
    if (a.pairLead){ const m = puntMate(a); if (!m || m.small || Math.hypot(m.x - a.x, m.y - a.y) > 3) return 'MATE'; }
    for (const P of PUNTS){
      if (P.leg !== 0) continue;
      const d = puntStandFor(P, false);
      if (d && eastOpen() && eastCloseHour() - hour > tripH(P, a, d, k) + PUNT_MIN_STAY_H) return 'TAKEN';
      const n = puntStandFor(P, true);
      if (n && hour >= SOLAR_NOON && hourEve() + 2 * tripH(P, a, n, k) + puntStayH(a, true) + EVE_BELL < EVE_GONE) return 'TAKEN';
    }
    return (hour < SOLAR_NOON) ? 'TIME_AM' : (eastOpen() ? 'TIME_PM' : 'TIME_SHUT');
  };
  puntFits = function(a){
    const v = f0(a); fired++;
    const w = windF();
    let k;
    if (PUNTS.every(h => h.leg !== 0)) k = 'BUSY';
    else if (a.with) k = 'COMPANION';
    else if (a.small) k = 'SMALL';
    else if (raining) k = 'RAIN';
    else if (typeof puntWindOK === 'function' ? !puntWindOK(a) : w >= 0.5) k = 'WIND';   // whatever THIS build's wind clause is
    else k = fitsNoWind(a, 0);
    if ((k === 'TAKEN') !== !!v) mism++;
    // for a WIND refusal: what the rest of the chain says, at the shipped speed and
    // at a wind-slowed one. Only offers that reach the wind clause can be bought back.
    let after = null, afterSlow = null;
    if (k === 'WIND'){ after = fitsNoWind(a, 0); afterSlow = fitsNoWind(a, SLOW); }
    offers.push({d:day, h:+hour.toFixed(2), w:+w.toFixed(3), k, after, afterSlow});
    return v;
  };
  let lastDay = -1;
  const lastLeg = PUNTS.map(() => 0);
  for (let i = 0; day < DAY0 + NDAYS; i++){
    window.__warp(0.05);
    if (day !== lastDay){ lastDay = day; dayW.push({d:day, windy:windyDay(), peak:0, cross:0}); }
    const D = dayW[dayW.length - 1];
    if (i % 4 === 0) D.peak = Math.max(D.peak, +windF().toFixed(3));
    // a CROSSING is a hull coming home: leg 4 -> 0, charged to the day it lands on
    PUNTS.forEach((P, hi) => { if (lastLeg[hi] === 4 && P.leg === 0) D.cross++; lastLeg[hi] = P.leg; });
  }
  for (const o of offers){ const D = dayW.find(d => d.d === o.d); if (D) D.offers = (D.offers || 0) + 1; }
  return {offers, dayW, fired, mism};`), { DAY0, NDAYS, SLOW });
  OFFERS.push(...out.offers.map(o => ({ seed, ...o })));
  DAYW.push(...out.dayW.map(o => ({ seed, ...o })));
  fired += out.fired; mism += out.mism; seedDays += NDAYS;
  console.log(`seed ${seed}: ${out.offers.length} offers, ${out.offers.filter(o => o.k === 'WIND').length} wind-refused`);
  await p.close();
}
await br.close();

const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s.length ? +s[Math.min(s.length - 1, Math.floor(p * s.length))].toFixed(3) : 0; };
console.log(`\n=== ${FILE.split('/').pop()} · ${SEEDS.length} seeds x ${NDAYS} days = ${seedDays} seed-days ===`);
console.log(`wrapper fired ${fired}, verdict mismatches ${mism}  ${mism === 0 && fired > 0 ? 'OK' : 'INSTRUMENT SUSPECT'}`);

const n = OFFERS.length, wind = OFFERS.filter(o => o.k === 'WIND');
console.log(`\noffers ${n}; WIND deletes ${wind.length} = ${(100 * wind.length / n).toFixed(1)}%`);
console.log(`windF at ALL offers   p10/25/50/75/90/max: ${[0.1, 0.25, 0.5, 0.75, 0.9, 0.999].map(p => q(OFFERS.map(o => o.w), p)).join(' / ')}`);
console.log(`windF at WIND refusals p10/25/50/75/90/max: ${[0.1, 0.25, 0.5, 0.75, 0.9, 0.999].map(p => q(wind.map(o => o.w), p)).join(' / ')}`);
const bins = new Array(11).fill(0);
for (const o of OFFERS) bins[Math.min(10, Math.floor(o.w * 10))]++;
console.log(`windF histogram (0.0..1.0 by 0.1): ${bins.map((v, i) => (i / 10).toFixed(1) + ':' + v).join(' ')}`);

console.log(`\n--- the day, ranked by its OWN wind (not by a seed) ---`);
const peaks = DAYW.map(d => d.peak || 0);
console.log(`day peak windF p25/50/75/90: ${[0.25, 0.5, 0.75, 0.9].map(p => q(peaks, p)).join(' / ')}  ` +
            `· days peaking >=0.5: ${(100 * peaks.filter(v => v >= 0.5).length / peaks.length).toFixed(1)}%  ` +
            `>=0.8: ${(100 * peaks.filter(v => v >= 0.8).length / peaks.length).toFixed(1)}%  ` +
            `=1.0: ${(100 * peaks.filter(v => v >= 0.999).length / peaks.length).toFixed(1)}%`);
console.log(`windyDay() share ${(100 * DAYW.filter(d => d.windy).length / DAYW.length).toFixed(1)}% (the day hash's own 28%)`);

console.log(`\n--- SWEEP: raise the bar from 0.5 to T (offers bought back, of ${wind.length} wind-refused) ---`);
console.log(`  T      admitted  would be TAKEN   ... and TAKEN once the water leg is slowed by ${SLOW}`);
for (const T of [0.5, 0.6, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1.0, 1.01]){
  const adm = wind.filter(o => o.w < T);
  const t0 = adm.filter(o => o.after === 'TAKEN').length, t1 = adm.filter(o => o.afterSlow === 'TAKEN').length;
  console.log(`  ${T.toFixed(2)}   ${String(adm.length).padStart(5)}      ${String(t0).padStart(5)}  (+${(100 * t0 / n).toFixed(1)}% of offers)   ${String(t1).padStart(5)}  (+${(100 * t1 / n).toFixed(1)}%)`);
}
const why = {};
for (const o of wind) why[o.afterSlow] = (why[o.afterSlow] || 0) + 1;
console.log(`\nwhat the wind-refused offers hit NEXT (wind deleted, water slowed): ${JSON.stringify(why)}`);
const near = wind.filter(o => o.w >= 0.999);
console.log(`wind-refused at a FULL wind (windF >= 0.999): ${near.length} of ${wind.length} — a bar below 1.0 can never buy these`);

console.log(`\n--- the DAY, by its own peak wind (the day is the unit; offers and crossings are its own) ---`);
const CLASS = [['calm   peak <0.25', d => (d.peak || 0) < 0.25],
               ['fresh  0.25..0.75', d => (d.peak || 0) >= 0.25 && (d.peak || 0) < 0.75],
               ['windy  peak >=0.75', d => (d.peak || 0) >= 0.75]];
console.log(`  class                 days   offers/day   crossings/day   take%`);
for (const [name, f] of CLASS){
  const ds = DAYW.filter(f), o = ds.reduce((n, d) => n + (d.offers || 0), 0), c = ds.reduce((n, d) => n + (d.cross || 0), 0);
  console.log(`  ${name.padEnd(20)} ${String(ds.length).padStart(4)}   ${(o / (ds.length || 1)).toFixed(2).padStart(8)}   ${(c / (ds.length || 1)).toFixed(2).padStart(11)}   ${o ? (100 * c / o).toFixed(1) : '  -'}`);
}
const allO = DAYW.reduce((n, d) => n + (d.offers || 0), 0), allC = DAYW.reduce((n, d) => n + (d.cross || 0), 0);
console.log(`  ${'ALL'.padEnd(20)} ${String(DAYW.length).padStart(4)}   ${(allO / DAYW.length).toFixed(2).padStart(8)}   ${(allC / DAYW.length).toFixed(2).padStart(11)}   ${(100 * allC / allO).toFixed(1)}`);
console.log(`seeds: ${SEEDS.join(',')}`);
