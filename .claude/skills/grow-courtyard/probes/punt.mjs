#!/usr/bin/env node
/* punt — b94 / #96: the punt from the jetty to the eyot.
 *
 *   node punt.mjs [file] [--seeds 10] [--days 3] [--day0 5]
 *   node punt.mjs --strand            falsification: strand a rider, watch ORPHAN go red
 *   node punt.mjs --strand-late       falsification: strand them LATE, for OVERDUE
 *
 * On HEAD (no punt in the source) this is the brief's one count: jetty stands/day
 * (overDeck's a.jetty performing their stand) and their dwell. On the candidate it
 * also measures: claims, aborts, push-offs (with the sky at the instant: raining,
 * windF, eastOpen), completed round trips, strandings (defined below), the punt's
 * travelled y-range (never under DECK rows 30..32), its least distance to the
 * rowboat, and the swans' least distance to the landing while the punt lies there.
 *
 * THE STRANDING TEST, rewritten at #149 (c227). The original asked two questions and
 * both of them stopped being faults under later work, so this gate reported 15
 * strandings on a clean HEAD and had done since #141 — and a gate that fails on HEAD
 * is not a gate:
 *   - "a.eyot with the punt moored" assumed ONE hull. #141 added a second, so hull A
 *     lies at leg 0 while hull B is out carrying somebody, every time.
 *   - "a.eyot after eastOpen() closed" is the case #131 built ON PURPOSE: eastOpenFor()
 *     covers a night rider until a.puntBack, and the retire rule then walks them down
 *     to the landing. Being on the island in the dark is the FEATURE.
 * What is left is the fault itself, in two build-INDEPENDENT questions — neither asks a
 * predicate the punt defines, so neither can be satisfied by redefining the punt:
 *   ORPHAN   somebody is on the eyot and NO hull holds them as rider or mate, so
 *            nothing is coming for them. (puntFree() does not clear a.eyot, so a hull
 *            released with its passenger ashore leaves this true for good.)
 *   OVERDUE  somebody is still on the eyot at EVE_GONE — the hour the town calls the
 *            last one gone, and the hour puntNightFits() prices every crossing to be
 *            home BEFORE, with EVE_BELL in hand.
 * Strandings now EXIT NON-ZERO, and the two zeroes are each shown to be capable of being
 * non-zero, from OUTSIDE the source, each differing from HEAD in exactly one way:
 *   --strand       frees a hull the moment it beaches with its rider ashore — a ferryman
 *                  who poles home without his passenger. ORPHAN.
 *   --strand-late  holds the hull at leg 3 instead, so the rider is still HELD (which is
 *                  what masks ORPHAN) and simply never fetched. OVERDUE.
 */
import { homedir } from 'node:os'; import { resolve, join, dirname } from 'node:path'; import { pathToFileURL, fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const arg = (n, d) => { const i = process.argv.indexOf(n); return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const file = process.argv[2] && !process.argv[2].startsWith('--') ? resolve(process.argv[2]) : resolve(HERE, '../../../../courtyard.html');
const NS = +arg('--seeds', 10), NDAYS = +arg('--days', 3), DAY0 = +arg('--day0', 5);
const STRAND = process.argv.includes('--strand');        // ferryman abandons them  -> ORPHAN
const LATE   = process.argv.includes('--strand-late');   // ferryman never returns   -> OVERDUE
const SEEDS = [3, 7, 11, 19, 23, 29, 42, 51, 64, 77].slice(0, NS);
const b = await chromium.launch();
const stands = [], dwells = [], cross = [], perDay = {}, standPerDay = {};
let aborts = 0, strand = [], nStrand = 0, swanMin = Infinity, swanNear = 0, puntY = [Infinity, -Infinity], boatMin = Infinity, hasPunt = false;
for (const seed of SEEDS){
  const p = await b.newPage({ viewport:{width:1600, height:950} });
  p.on('pageerror', e => console.log('PAGE ERROR', e.message));
  await p.goto(pathToFileURL(file).href + `?pause&seed=${seed}`);
  await p.waitForFunction(() => window.__warp);
  const out = await p.evaluate(new Function('A', 'const {DAY0, NDAYS, STRAND, LATE} = A;' + `
    const HAS = typeof updatePunt === 'function';
    window.__reseed(); window.__warp(DAY0 * 55 - simT);
    /* --strand: the ferryman poles home without his passenger. A REAL stranding, made
     * from outside the source, so the gate is shown red on a build that differs from
     * HEAD in exactly one way. Installed AFTER __reseed(), which reassigns globals. */
    if ((STRAND || LATE) && HAS) window.updatePunt = function(dt){
      for (const P of PUNTS){
        if (LATE && P.leg === 3) continue;          // beached, and nobody is coming back for them
        updateOnePunt(P, dt);
        if (STRAND && P.leg === 3 && P.rider && P.rider.eyot) puntFree(P);
      }
    };
    const stands = [], dwells = [], cross = [], strand = [];
    let aborts = 0, swanMin = Infinity, swanNear = 0, y0 = Infinity, y1 = -Infinity, boatMin = Infinity, nStrand = 0;
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
      for (const a of agents){
        if (!a.eyot) continue;
        const held = PUNTS.some(P => P.leg > 0 && (P.rider === a || P.mate === a));
        const why = !held ? 'a.eyot and no hull holds them' : hourEve() >= EVE_GONE ? 'a.eyot at EVE_GONE' : null;
        if (why){ nStrand++; if (strand.length < 5) strand.push({day, hour:+hour.toFixed(2), why}); }
      }
    }
    return {HAS, stands, dwells, cross, aborts, strand, nStrand, swanMin:+swanMin.toFixed(2), swanNear, y0:+y0.toFixed(1), y1:+y1.toFixed(1), boatMin:+boatMin.toFixed(1)};`), {DAY0, NDAYS, STRAND, LATE});
  hasPunt = out.HAS;
  for (const s of out.stands){ const k = seed + ':' + s.day; standPerDay[k] = (standPerDay[k] || 0) + 1; }
  for (const c of out.cross){ const k = seed + ':' + c.day; perDay[k] = (perDay[k] || 0) + 1; }
  stands.push(...out.stands.map(s => ({seed, ...s}))); dwells.push(...out.dwells);
  cross.push(...out.cross.map(c => ({seed, ...c})));
  aborts += out.aborts; strand.push(...out.strand.map(s => ({seed, ...s}))); nStrand += out.nStrand || 0;
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
/* This line used to call three weathers a fault and by #154 two of them were the
 * FEATURE: `dark` is #131's last punt and windF>=0.5 is #154's share of the bold. A
 * gate that reports what a build was built to do teaches its reader to skip it. RAIN
 * is the one the punt still refuses outright, so rain is what is named; the other two
 * are printed as counts, because their SHAPE is worth seeing and their presence is not
 * a fault. (LAW #149: a change to what a gate's subject IS must re-run the gate.) */
const wet = cross.filter(c => c.rain);
console.log(`push-offs in RAIN (still refused outright): ${wet.length}${wet.length ? ' ' + JSON.stringify(wet.slice(0, 3)) : ''}`);
const blow = cross.filter(c => c.wind >= 0.5), dark = cross.filter(c => c.dark);
console.log(`  legal, and counted for shape: ${dark.length} pushed off in the dark (#131), ${blow.length} at windF>=0.5 (#154)`);
const unreturned = cross.filter(c => c.homeH === undefined);
console.log(`round trips completed: ${cross.length - unreturned.length}/${cross.length}; strandings: ${nStrand} samples${nStrand ? ', e.g. ' + JSON.stringify(strand.slice(0, 3)) : ''}`);
if (cross.length){
  const c0 = cross[0];
  console.log(`sample trip: claim ${c0.claimH} off ${c0.offH} land ${c0.landH} back ${c0.backH} home ${c0.homeH} (seed ${c0.seed} day ${c0.day})`);
  // a trip that lands after midnight has homeH < offH on the 0..24 clock: wrap it, or
  // the gate prints a NEGATIVE trip length and is read as noise.
  const tripH = cross.filter(c => c.homeH).map(c => +((c.homeH - c.offH + 24) % 24).toFixed(2));
  console.log(`trip length h: median ${med(tripH)} range ${Math.min(...tripH)}..${Math.max(...tripH)}`);
}
console.log(`\npunt y while out: ${puntY[0]}..${puntY[1]} (DECK rows 30..32 — must start > 33); least distance to rowboat ${boatMin === Infinity ? 'n/a (never co-present)' : boatMin}`);
console.log(`swans while punt at shore: least distance to landing ${swanMin === Infinity ? 'n/a' : swanMin}, samples < 0.9: ${swanNear}`);
if (nStrand){
  console.log(`\nFAIL: ${nStrand} stranded samples. ORPHAN = on the eyot with no hull holding them;`);
  console.log('OVERDUE = still there at EVE_GONE. Neither is legal on any build.');
  process.exit(1);
}
console.log(STRAND || LATE ? '\nNOTE: a --strand mode was set and NOTHING was stranded — the gate is not reading.' : '\nOK — nobody stranded.');
if (STRAND || LATE) process.exit(1);
