#!/usr/bin/env node
/* punt — b94 / #96: the punt from the jetty to the eyot.
 *
 *   node punt.mjs [file] [--seeds 10] [--days 3] [--day0 5]
 *
 * On HEAD (no punt in the source) this is the brief's one count: jetty stands/day
 * (overDeck's a.jetty performing their stand) and their dwell. On the candidate it
 * also measures: claims, aborts, push-offs (with the sky at the instant: raining,
 * windF, eastOpen), completed round trips, strandings (an a.eyot stander with the
 * punt at its mooring, or anybody a.eyot after eastOpen() closes), the punt's
 * travelled y-range (never under DECK rows 30..32), its least distance to the
 * rowboat, and the swans' least distance to the landing while the punt lies there.
 */
import { homedir } from 'node:os'; import { resolve, join, dirname } from 'node:path'; import { pathToFileURL, fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const arg = (n, d) => { const i = process.argv.indexOf(n); return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const file = process.argv[2] && !process.argv[2].startsWith('--') ? resolve(process.argv[2]) : resolve(HERE, '../../../../courtyard.html');
const NS = +arg('--seeds', 10), NDAYS = +arg('--days', 3), DAY0 = +arg('--day0', 5);
const SEEDS = [3, 7, 11, 19, 23, 29, 42, 51, 64, 77].slice(0, NS);
const b = await chromium.launch();
const stands = [], dwells = [], cross = [], perDay = {}, standPerDay = {};
let aborts = 0, strand = [], swanMin = Infinity, swanNear = 0, puntY = [Infinity, -Infinity], boatMin = Infinity, hasPunt = false;
for (const seed of SEEDS){
  const p = await b.newPage({ viewport:{width:1600, height:950} });
  p.on('pageerror', e => console.log('PAGE ERROR', e.message));
  await p.goto(pathToFileURL(file).href + `?pause&seed=${seed}`);
  await p.waitForFunction(() => window.__warp);
  const out = await p.evaluate(new Function('A', 'const {DAY0, NDAYS} = A;' + `
    const HAS = typeof updatePunt === 'function';
    window.__reseed(); window.__warp(DAY0 * 55 - simT);
    const stands = [], dwells = [], cross = [], strand = [];
    let aborts = 0, swanMin = Infinity, swanNear = 0, y0 = Infinity, y1 = -Infinity, boatMin = Infinity;
    const stood = new WeakSet(); let lastLeg = 0, cur = null;
    for (let i = 0; day < DAY0 + NDAYS; i++){
      window.__warp(0.05);
      for (const a of agents){
        if (a.jetty && a.state === 'stand' && !stood.has(a)){ stood.add(a);
          stands.push({day, hour:+hour.toFixed(2)}); if (a.stop) dwells.push(+a.stop.dur.toFixed(1)); }
      }
      if (!HAS) continue;
      if (punt.leg !== lastLeg){
        if (punt.leg === 1 && lastLeg === 0) cur = {day, claimH:+hour.toFixed(2)};
        if (punt.leg === 0 && lastLeg === 1 && cur){ aborts++; cur = null; }
        if (punt.leg === 2 && cur){ cur.offH = +hour.toFixed(2); cur.rain = raining; cur.wind = +windF().toFixed(2); cur.dark = !eastOpen(); }
        if (punt.leg === 3 && cur) cur.landH = +hour.toFixed(2);
        if (punt.leg === 4 && cur) cur.backH = +hour.toFixed(2);
        if (punt.leg === 0 && lastLeg === 4 && cur){ cur.homeH = +hour.toFixed(2); cross.push(cur); cur = null; }
        lastLeg = punt.leg;
      }
      if (punt.leg === 2 || punt.leg === 4){
        y0 = Math.min(y0, punt.y); y1 = Math.max(y1, punt.y);
        if (boat) boatMin = Math.min(boatMin, Math.hypot(punt.x - boat.x, punt.y - boat.y));
      }
      if (puntAtShore()) for (const s of swans){
        const d = Math.hypot(s.x - PUNT_LAND.x, s.y - PUNT_LAND.y);
        swanMin = Math.min(swanMin, d); if (d < 0.9) swanNear++;
      }
      if (i % 5) continue;
      const onIsle = agents.filter(a => a.eyot);
      if (onIsle.length && punt.leg === 0 && strand.length < 5)
        strand.push({day, hour:+hour.toFixed(2), why:'a.eyot with the punt moored'});
      if (onIsle.length && !eastOpen() && strand.length < 5)
        strand.push({day, hour:+hour.toFixed(2), why:'a.eyot after eastOpen() closed'});
    }
    return {HAS, stands, dwells, cross, aborts, strand, swanMin:+swanMin.toFixed(2), swanNear, y0:+y0.toFixed(1), y1:+y1.toFixed(1), boatMin:+boatMin.toFixed(1)};`), {DAY0, NDAYS});
  hasPunt = out.HAS;
  for (const s of out.stands){ const k = seed + ':' + s.day; standPerDay[k] = (standPerDay[k] || 0) + 1; }
  for (const c of out.cross){ const k = seed + ':' + c.day; perDay[k] = (perDay[k] || 0) + 1; }
  stands.push(...out.stands.map(s => ({seed, ...s}))); dwells.push(...out.dwells);
  cross.push(...out.cross.map(c => ({seed, ...c})));
  aborts += out.aborts; strand.push(...out.strand.map(s => ({seed, ...s})));
  swanMin = Math.min(swanMin, out.swanMin); swanNear += out.swanNear;
  puntY = [Math.min(puntY[0], out.y0), Math.max(puntY[1], out.y1)]; boatMin = Math.min(boatMin, out.boatMin);
  await p.close();
  console.log(`seed ${seed}: ${out.stands.length} jetty stands, ${out.cross.length} crossings, ${out.aborts} aborts`);
}
await b.close();
const med = a => { const s = [...a].sort((x, y) => x - y); return s.length ? s[s.length >> 1] : 0; };
const seedDays = SEEDS.length * NDAYS;
const standCounts = []; for (const s of SEEDS) for (let d = DAY0; d < DAY0 + NDAYS; d++) standCounts.push(standPerDay[s + ':' + d] || 0);
const crossCounts = []; for (const s of SEEDS) for (let d = DAY0; d < DAY0 + NDAYS; d++) crossCounts.push(perDay[s + ':' + d] || 0);
console.log(`\n=== jetty stands (${seedDays} seed-days) ===`);
console.log(`stands/day median ${med(standCounts)} (mean ${(stands.length / seedDays).toFixed(2)}, range ${Math.min(...standCounts)}..${Math.max(...standCounts)})`);
console.log(`dwell median ${med(dwells)} s real = ${(med(dwells) * 24 / 55).toFixed(2)} h sim (range ${Math.min(...dwells)}..${Math.max(...dwells)})`);
if (!hasPunt){ console.log('\n(no punt in this build — HEAD count only)'); process.exit(0); }
console.log(`\n=== crossings ===`);
console.log(`crossings/day median ${med(crossCounts)} (total ${cross.length} over ${seedDays} seed-days, range ${Math.min(...crossCounts)}..${Math.max(...crossCounts)}), aborts ${aborts}`);
const bad = cross.filter(c => c.rain || c.wind >= 0.5 || c.dark);
console.log(`push-offs in rain / wind>=0.5 / dark: ${bad.length}${bad.length ? ' ' + JSON.stringify(bad.slice(0, 3)) : ''}`);
const unreturned = cross.filter(c => c.homeH === undefined);
console.log(`round trips completed: ${cross.length - unreturned.length}/${cross.length}; strandings: ${strand.length}${strand.length ? ' ' + JSON.stringify(strand.slice(0, 3)) : ''}`);
if (cross.length){
  const c0 = cross[0];
  console.log(`sample trip: claim ${c0.claimH} off ${c0.offH} land ${c0.landH} back ${c0.backH} home ${c0.homeH} (seed ${c0.seed} day ${c0.day})`);
  const tripH = cross.filter(c => c.homeH).map(c => +(c.homeH - c.offH).toFixed(2));
  console.log(`trip length h: median ${med(tripH)} range ${Math.min(...tripH)}..${Math.max(...tripH)}`);
}
console.log(`\npunt y while out: ${puntY[0]}..${puntY[1]} (DECK rows 30..32 — must start > 33); least distance to rowboat ${boatMin === Infinity ? 'n/a (never co-present)' : boatMin}`);
console.log(`swans while punt at shore: least distance to landing ${swanMin === Infinity ? 'n/a' : swanMin}, samples < 0.9: ${swanNear}`);
