#!/usr/bin/env node
/* punt-supply — b141: WHY is the punt refusing, clause by clause in its own
 * evaluation order, and where does the ONE hull's busy time actually go?
 *
 *   node probe-punt-supply.mjs [--seeds 10] [--days 26] [--day0 5] [file]
 *
 * puntFits() is asked ONCE per jetty stander (stepAgent latches a.stopped), so an
 * "offer" is one arrival at the planks. The wrapper re-walks the same clauses over
 * the same globals and ASSERTS its verdict equals the real one, so the sim it
 * measures is the sim that ran. Busy time is sampled per leg in sim hours.
 */
import { homedir } from 'node:os'; import { resolve, join, dirname } from 'node:path'; import { pathToFileURL, fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const arg = (n, d) => { const i = process.argv.indexOf(n); return i !== -1 && process.argv[i + 1] ? +process.argv[i + 1] : d; };
const fileArg = process.argv.find((s, i) => i > 1 && !s.startsWith('--') && s.endsWith('.html'));
const FILE = resolve(fileArg || resolve(HERE, '../../../../courtyard.html'));
const NS = arg('--seeds', 10), NDAYS = arg('--days', 26), DAY0 = arg('--day0', 5);
const SEEDS = [3, 7, 11, 19, 23, 29, 42, 51, 64, 77].slice(0, NS);

const br = await chromium.launch();
const tot = {}, legH = {}, offerH = [], crossH = [], busyBlocks = [];
let offers = 0, crossings = 0, mism = 0, fired = 0, seedDays = 0, hulls = 1;
const LONG = [], STRAND = [];
const HULL = {min:9, near:0, both:0, ex:[], boat:[], swan:[]};
const STOOD = {yes:0, no:0, ex:[]};
for (const seed of SEEDS){
  const p = await br.newPage({ viewport:{ width:1600, height:950 } });
  p.on('pageerror', e => console.log('PAGEERROR', e.message));
  await p.goto(pathToFileURL(FILE).href + `?pause&seed=${seed}`, { waitUntil:'load' });
  await p.waitForFunction(() => typeof window.__warp === 'function');
  const out = await p.evaluate(new Function('A', 'const {DAY0,NDAYS}=A;' + `
  window.__reseed(); window.__warp(DAY0 * 55 - simT);
  const HULLS = typeof PUNTS !== 'undefined' ? PUNTS : [punt];
  const why = {}, legH = {}, offerH = [], crossH = [], blocks = [];
  let offers = 0, crossings = 0, mism = 0, fired = 0;
  const bump = k => why[k] = (why[k] || 0) + 1;
  const f0 = puntFits;
  puntFits = function(a){
    const v = f0(a); fired++;
    // the same clauses, in the same order, over the same globals
    let k;
    if (HULLS.every(h => h.leg !== 0)) k = 'BUSY';
    else if (a.with) k = 'COMPANION';
    else if (a.small) k = 'SMALL';
    else if (raining) k = 'RAIN';
    else if (windF() >= 0.5) k = 'WIND';
    else if (a.pairLead && (() => { const m = puntMate(a); return !m || m.small || Math.hypot(m.x - a.x, m.y - a.y) > 3; })()) k = 'MATE';
    else if (!HULLS.some(P => { if (P.leg !== 0) return false;
      const two = typeof puntStandFor === 'function';
      const d = two ? puntStandFor(P, false) : PUNT_STAND, n = two ? puntStandFor(P, true) : PUNT_NIGHT_STAND;
      return (d && (two ? puntDayFits(P, a, d) : puntDayFits(a))) || (n && (two ? puntNightFits(P, a, n) : puntNightFits(a)));
    })) k = (hour < SOLAR_NOON) ? 'TIME_AM' : (eastOpen() ? 'TIME_PM' : 'TIME_SHUT');
    else k = 'TAKEN';
    if ((k === 'TAKEN') !== !!v) mism++;
    // is this a stander at the PLANKS, or a rider already across re-asking at their stand?
    if (a.eyot || HULLS.some(h => h.rider === a || h.mate === a)) bump('reask@' + k);
    bump(k); offers++; offerH.push(+hour.toFixed(2));
    return v;
  };
  const lastLeg = HULLS.map(() => 0), blockStart = HULLS.map(() => null), blockT = HULLS.map(() => 0);
  const strand = []; const long = [];
  let hullMin = 9, hullNear = 0, hullBoth = 0, nearEx = [];
  const boatMin = HULLS.map(() => 9), swanMin = HULLS.map(() => 9);
  // a crossing that never stands is a crossing that means nothing: watch every landed
  // rider from leg 3 until their hull is free again, and record whether they ever stood
  const landed = new Map(); let stood = 0, notStood = 0, noStandEx = [];
  let t0 = simT;
  for (let i = 0; day < DAY0 + NDAYS; i++){
    window.__warp(0.05);
    const dh = (simT - t0) * HOURS_PER_S; t0 = simT;
    HULLS.forEach((h, hi) => {
      legH[h.leg] = (legH[h.leg] || 0) + dh;
      if (h.leg !== lastLeg[hi]){
        if (lastLeg[hi] === 0 && h.leg !== 0){ blockStart[hi] = hour; blockT[hi] = simT; }
        if (h.leg === 0 && lastLeg[hi] !== 0){
          if (blockStart[hi] !== null){
            const bh = +((simT - blockT[hi]) * HOURS_PER_S).toFixed(2);
            blocks.push(bh);
            if (bh > 12 && long.length < 6) long.push({hull:hi, start:+blockStart[hi].toFixed(2), h:bh, endLeg:lastLeg[hi]});
          }
          blockStart[hi] = null;
        }
        if (lastLeg[hi] === 4 && h.leg === 0){ crossings++; crossH.push(+hour.toFixed(2)); }
        lastLeg[hi] = h.leg;
      }
    });
    for (const h of HULLS){
      if (h.leg === 3 && h.rider && !landed.has(h.rider)) landed.set(h.rider, {stood:false, day, hour:+hour.toFixed(2), stand:h.stand});
      const rec = h.rider && landed.get(h.rider);
      if (rec && h.rider.eyot && h.rider.state === 'stand') rec.stood = true;
      if (rec && h.leg === 4){ (rec.stood ? 0 : 0); }
    }
    for (const [a, rec] of landed) if (a.done || !HULLS.some(h => h.rider === a)){
      if (rec.stood) stood++; else { notStood++; if (noStandEx.length < 4) noStandEx.push({day:rec.day, hour:rec.hour, stand:[rec.stand.x, rec.stand.y]}); }
      landed.delete(a);
    }
    HULLS.forEach((h, hi) => {   // a hull under way against the OTHER things on this river
      if (!h.leg) return;
      if (boat) boatMin[hi] = Math.min(boatMin[hi], Math.hypot(h.x - boat.x, h.y - boat.y));
      for (const w of swans) swanMin[hi] = Math.min(swanMin[hi], Math.hypot(h.x - w.x, h.y - w.y));
    });
    if (HULLS.length > 1 && HULLS.every(h => h.leg)){
      hullBoth++;
      const d = Math.hypot(HULLS[0].x - HULLS[1].x, HULLS[0].y - HULLS[1].y);
      if (d < hullMin) hullMin = d;
      if (d < 0.9){ hullNear++; if (nearEx.length < 4) nearEx.push({day, hour:+hour.toFixed(2), d:+d.toFixed(2),
        legs:[HULLS[0].leg, HULLS[1].leg], a:[+HULLS[0].x.toFixed(2), +HULLS[0].y.toFixed(2)], b:[+HULLS[1].x.toFixed(2), +HULLS[1].y.toFixed(2)]}); }
    }
    if (i % 20 === 0){
      // stranded: on the turf with every hull moored, or on it after the last hull could fetch them
      const isle = agents.filter(a => a.eyot && !a.aboard);
      if (isle.length && HULLS.every(h => h.leg === 0) && strand.length < 6)
        strand.push({day, hour:+hour.toFixed(2), n:isle.length, why:'a.eyot with every hull at its mooring'});
    }
  }
  return {why, legH, offers, crossings, mism, fired, offerH, crossH, blocks, long, strand, nh:HULLS.length,
          hullMin:+hullMin.toFixed(2), hullNear, hullBoth, nearEx,
          boatMin:boatMin.map(v => +v.toFixed(2)), swanMin:swanMin.map(v => +v.toFixed(2)),
          stood, notStood, noStandEx};`), { DAY0, NDAYS });
  hulls = out.nh;
  for (const k in out.why) tot[k] = (tot[k] || 0) + out.why[k];
  for (const k in out.legH) legH[k] = (legH[k] || 0) + out.legH[k];
  offers += out.offers; crossings += out.crossings; mism += out.mism; fired += out.fired;
  offerH.push(...out.offerH); crossH.push(...out.crossH); busyBlocks.push(...out.blocks);
  LONG.push(...out.long.map(o => ({seed, ...o}))); STRAND.push(...out.strand.map(o => ({seed, ...o})));
  HULL.min = Math.min(HULL.min, out.hullMin); HULL.near += out.hullNear; HULL.both += out.hullBoth;
  HULL.ex.push(...out.nearEx.map(o => ({seed, ...o})));
  STOOD.yes += out.stood; STOOD.no += out.notStood; STOOD.ex.push(...out.noStandEx.map(o => ({seed, ...o})));
  out.boatMin.forEach((v, i) => HULL.boat[i] = Math.min(HULL.boat[i] ?? 9, v));
  out.swanMin.forEach((v, i) => HULL.swan[i] = Math.min(HULL.swan[i] ?? 9, v));
  seedDays += NDAYS;
  console.log(`seed ${seed}: ${out.offers} offers, ${out.crossings} crossings, mismatches ${out.mism}`);
  await p.close();
}
await br.close();
const med = a => { const s = [...a].sort((x, y) => x - y); return s.length ? s[s.length >> 1] : 0; };
console.log(`\n=== ${FILE.split('/').pop()} · ${SEEDS.length} seeds x ${NDAYS} days = ${seedDays} seed-days · ${hulls} hull(s) ===`);
console.log(`wrapper fired ${fired} times, verdict mismatches ${mism}  ${mism === 0 && fired > 0 ? 'OK' : 'INSTRUMENT SUSPECT'}`);
console.log(`\n--- refusals, CLAUSE BY CLAUSE in evaluation order (${offers} offers) ---`);
for (const k of ['BUSY', 'COMPANION', 'SMALL', 'RAIN', 'WIND', 'MATE', 'TIME_AM', 'TIME_PM', 'TIME_SHUT', 'TAKEN'])
  if (tot[k]) console.log(`  ${k.padEnd(10)} ${String(tot[k]).padStart(5)}  ${(100 * tot[k] / offers).toFixed(1)}%` +
    (tot['reask@' + k] ? `   (${tot['reask@' + k]} of these are a rider ALREADY ACROSS, re-asking at their own stand)` : ''));
const reask = Object.keys(tot).filter(k => k.startsWith('reask@')).reduce((n, k) => n + tot[k], 0);
console.log(`  ---  ${reask} of ${offers} offers are RE-ASKS by someone already on the water or the island`);
const gen = offers - reask, genBusy = (tot.BUSY || 0) - (tot['reask@BUSY'] || 0);
console.log(`  genuine offers at the planks ${gen}; genuine BUSY ${genBusy} = ${(100 * genBusy / gen).toFixed(1)}%; take ${(100 * (tot.TAKEN || 0) / gen).toFixed(1)}%`);
console.log(`\ncrossings ${crossings} = ${(crossings / seedDays).toFixed(2)}/day  (offers ${(offers / seedDays).toFixed(2)}/day)`);
console.log(`take rate ${(100 * (tot.TAKEN || 0) / offers).toFixed(1)}%`);
console.log(`\n--- where the hull's time goes (sim hours over the whole run) ---`);
const totH = Object.values(legH).reduce((a, b) => a + b, 0);
const NAME = {0:'0 moored (FREE)', 1:'1 claimed, rider stepping down', 2:'2 poling out', 3:'3 BEACHED at the landing (the stand)', 4:'4 poling back'};
for (const k of Object.keys(legH).sort()) console.log(`  ${NAME[k].padEnd(38)} ${legH[k].toFixed(0).padStart(6)} h  ${(100 * legH[k] / totH).toFixed(1)}%`);
const busyH = totH - (legH[0] || 0);
console.log(`  busy total ${busyH.toFixed(0)} h of ${totH.toFixed(0)} = ${(100 * busyH / totH).toFixed(1)}%; leg 3 is ${(100 * (legH[3] || 0) / busyH).toFixed(1)}% of BUSY`);
const bq = [...busyBlocks].sort((a, b) => a - b);
console.log(`busy block quartiles h: ${[0.25, 0.5, 0.75, 0.9, 1].map(q => bq[Math.min(bq.length - 1, Math.floor(q * bq.length))].toFixed(1)).join(' / ')}  (p25/p50/p75/p90/max)`);
console.log(`blocks over 12 h: ${busyBlocks.filter(b => b > 12).length} of ${busyBlocks.length}${LONG.length ? '  e.g. ' + JSON.stringify(LONG.slice(0, 3)) : ''}`);
if (hulls > 1) console.log(`hull-to-hull while BOTH are off their moorings: ${HULL.both} samples, least distance ${HULL.min}, samples under 0.9 (the one-shape law): ${HULL.near}${HULL.ex.length ? '\n  e.g. ' + JSON.stringify(HULL.ex.slice(0, 3)) : ''}`);
console.log(`landed riders who actually STOOD on the eyot: ${STOOD.yes} of ${STOOD.yes + STOOD.no}${STOOD.ex.length ? '  no-stand e.g. ' + JSON.stringify(STOOD.ex.slice(0, 3)) : ''}`);
console.log(`least distance from a hull UNDER WAY to the rowboat: ${HULL.boat.map((v, i) => 'hull' + i + ' ' + v).join(', ')}  ·  to a swan: ${HULL.swan.map((v, i) => 'hull' + i + ' ' + v).join(', ')}`);
console.log(`STRANDED samples: ${STRAND.length}${STRAND.length ? ' ' + JSON.stringify(STRAND.slice(0, 3)) : ''}`);
console.log(`busy block length h: median ${med(busyBlocks)} range ${Math.min(...busyBlocks)}..${Math.max(...busyBlocks)} (n ${busyBlocks.length})`);
const hh = a => { const b = new Array(24).fill(0); for (const h of a) b[Math.floor(h) % 24]++; return b; };
const ho = hh(offerH);
console.log(`\noffer hour histogram (0..23): ${ho.map((n, i) => n ? i + ':' + n : null).filter(Boolean).join(' ')}`);
