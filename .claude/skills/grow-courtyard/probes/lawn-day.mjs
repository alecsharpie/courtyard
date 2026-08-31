#!/usr/bin/env node
/* lawn-day — b95 / #95: the lawn's own population.
 *
 *   node probe-lawn-day.mjs [file] [--seeds 10] [--days 3] [--day0 5] [--warmth W] [--rain]
 *
 * shade.mjs's box and kinds: people INSIDE the courtyard wall by kind (kid / napper /
 * picnic / sitter / gardener = the lawn kinds; walker / crosser / dogwalker = the ring's
 * transit), every ~0.33 s of sim, in ±15 min windows at 10/13/16 h — MEDIAN over
 * seed·days, and the per-kind share of seed·days that has > 0 at 13 h.
 * Night: lawn-kind people inside the wall at nightF > 0.5 who are not walking out
 * (state != walk, or walking with a.lawn && !a.lawnOut) — must be 0.
 * seed 42 at 13:25 each day (c135). --rain pins raining = true from 11 h to 14 h on
 * each day (the rainy-noon control). --warmth W pins warmth after updateClock.
 * Set-outs: how many spawnLawnAgent holders per day, by kind, and how many walked in
 * by which door (the pricing at the choice).
 */
import { homedir } from 'node:os'; import { resolve, join, dirname } from 'node:path'; import { pathToFileURL, fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const arg = (n, d) => { const i = process.argv.indexOf(n); return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const has = n => process.argv.includes(n);
const file = process.argv[2] && !process.argv[2].startsWith('--') ? resolve(process.argv[2]) : resolve(HERE, '../../../../courtyard.html');
const NS = +arg('--seeds', 10), NDAYS = +arg('--days', 3), DAY0 = +arg('--day0', 5), WARM = arg('--warmth', null), RAIN = has('--rain');
const SEEDS = [3, 7, 11, 19, 23, 29, 42, 51, 64, 77, 88, 91].slice(0, NS);
const LAWN = ['kid', 'napper', 'picnic', 'sitter', 'gardener'], RINGK = ['walker', 'crosser', 'dogwalker'];
const b = await chromium.launch();
const win = {10:[], 13:[], 16:[]}, winK = {}, ring = {10:[], 13:[], 16:[]}, c135 = [], night = [], setouts = {}, doors = {}, hourRows = {}, nightMax = [];
let openH = null, pred = [];
for (const seed of SEEDS){
  const p = await b.newPage({ viewport:{width:1600, height:950} });
  p.on('pageerror', e => console.log('PAGE ERROR', e.message));
  await p.goto(pathToFileURL(file).href + `?pause&seed=${seed}`);
  await p.waitForFunction(() => window.__warp);
  const out = await p.evaluate(new Function("A", "const {DAY0, NDAYS, WARM, RAIN, LAWN, RINGK} = A;" + `
    if (WARM !== null){ const uc = updateClock; updateClock = function(){ uc(); warmth = +WARM; }; }
    if (RAIN){ const uc = updateClock; updateClock = function(){ uc(); if (hour >= 11 && hour < 14){ raining = true; rainFall = 1; } }; }
    const inYard = a => { const dx = a.x - CX, dy = a.y - CY; return Math.hypot(dx, dy) < wallR(Math.atan2(dy, dx)) - 0.5; };   // INSIDE THE WALL (shade.mjs used gR − 0.5 = the lawn, which never sees a bench at r ~28)
    window.__reseed(); window.__warp(DAY0 * 55 - simT);
    const win = {10:[], 13:[], 16:[]}, winK = {}, ring = {10:[], 13:[], 16:[]}, c135 = [], night = [], setouts = {}, doors = {}, hours = {}, pred = [];
    const seen = new WeakSet(); for (const a of agents) seen.add(a);
    const wAcc = {}; let i = 0, nightMax = 0, openH = null;
    for (; day < DAY0 + NDAYS; i++){
      window.__warp(0.05);
      if (typeof lawnEnd === 'function' && openH === null) openH = [+lawnEnd().toFixed(2), +sunUp.toFixed(2), +sunDown.toFixed(2)];
      for (const a of agents){ if (seen.has(a)) continue; seen.add(a);
        if (a.lawn && a.lawnLead && !a.with){ const k = day + ':' + a.kind; setouts[k] = (setouts[k] || 0) + 1;
          const d = ENTR.find(e => Math.hypot(e.door[0] - a.wp[a.wp.length - 1][0], 0) < 99 && a.wp.some(p => p[0] === e.door[0] && p[1] === e.door[1]));
          const nm = a.wp[0][1] === -1.5 ? 'north' : a.wp[0][0] === -1.5 ? 'west' : a.wp[0][1] === LANE_N_Y ? 'lane' : 'street';
          doors[nm] = (doors[nm] || 0) + 1; if (a.pred !== undefined) pred.push(+a.pred.toFixed(2)); } }
      if (i % 5) continue;
      const inY = agents.filter(inYard), h = Math.floor(hour);
      const byK = {}; for (const k of LAWN.concat(RINGK)) byK[k] = inY.filter(a => a.kind === k).length;
      const lawnN = LAWN.reduce((s, k) => s + byK[k], 0), ringN = RINGK.reduce((s, k) => s + byK[k], 0);
      (hours[h] || (hours[h] = [])).push(lawnN);
      for (const H of [10, 13, 16]){ if (Math.abs(hour - H) <= 0.25){ const key = day + ':' + H;
        if (!wAcc[key]){ wAcc[key] = {n:0, tot:0, ring:0, k:{}}; } wAcc[key].n++; wAcc[key].tot += lawnN; wAcc[key].ring += ringN; for (const k of LAWN) wAcc[key].k[k] = (wAcc[key].k[k] || 0) + byK[k]; } }
      if (Math.abs(hour - 13.42) < 0.03 && !c135.some(c => c.day === day)) c135.push({day, hour:+hour.toFixed(2), ...Object.fromEntries(LAWN.map(k => [k, byK[k]])), lawn:lawnN, ring:ringN, raining, warmth:+warmth.toFixed(2)});
      if (nightF > 0.5){ const stuck = inY.filter(a => LAWN.includes(a.kind) && (a.state !== 'walk' || (a.lawn && !a.lawnOut)));
        nightMax = Math.max(nightMax, stuck.length); if (stuck.length && night.length < 6) night.push({day, hour:+hour.toFixed(2), who:stuck.map(a => a.kind + ':' + a.state + (a.with ? '/comp' : '') + (a.lawn ? (a.lawnOut ? '/out' : '/HOLD') : '/old'))}); }
    }
    for (const key in wAcc){ const H = key.split(':')[1], w = wAcc[key]; win[H].push(+(w.tot / w.n).toFixed(2)); ring[H].push(+(w.ring / w.n).toFixed(2)); for (const k of LAWN) (winK[H + ':' + k] || (winK[H + ':' + k] = [])).push(w.k[k] / w.n); }
    const hmean = {}; for (const h in hours) hmean[h] = hours[h].reduce((s, v) => s + v, 0) / hours[h].length;
    return {win, winK, ring, c135, night, nightMax, setouts, doors, hmean, pred, openH, warmth:+warmth.toFixed(2), hasLawn: typeof spawnLawnAgent === 'function'};`), {DAY0, NDAYS, WARM, RAIN, LAWN, RINGK});
  for (const H in out.win){ win[H].push(...out.win[H]); ring[H].push(...out.ring[H]); for (const k of LAWN){ const key = H + ':' + k; (winK[key] || (winK[key] = [])).push(...(out.winK[key] || [])); } }
  for (const h in out.hmean) (hourRows[h] || (hourRows[h] = [])).push(out.hmean[h]);
  if (seed === 42) c135.push(...out.c135);
  night.push(...out.night.map(n => ({seed, ...n}))); nightMax.push(out.nightMax);
  for (const k in out.setouts){ const kind = k.split(':')[1]; setouts[kind] = (setouts[kind] || 0) + out.setouts[k]; }
  for (const k in out.doors) doors[k] = (doors[k] || 0) + out.doors[k];
  pred.push(...out.pred); if (out.openH) openH = out.openH;
  if (seed === SEEDS[0]) console.log(`file: ${file}  warmth ${out.warmth}${WARM !== null ? ' (pinned)' : ''}${RAIN ? '  RAIN 11–14 h pinned' : ''}  source ${out.hasLawn ? 'spawnLawnAgent' : 'spawnAgent (HEAD)'}  days ${DAY0}..${DAY0 + NDAYS - 1}  seeds ${SEEDS.join(',')}` + (openH ? `  lawnEnd ${openH[0]} (sun ${openH[1]}–${openH[2]})` : ''));
  await p.close();
}
await b.close();
const med = a => { const s = [...a].sort((x, y) => x - y); return s.length ? s[s.length >> 1] : NaN; }, mean = a => a.length ? a.reduce((s, v) => s + v, 0) / a.length : NaN;
console.log('lawn kinds inside the wall, mean by hour:');
let line = ''; for (let h = 0; h < 24; h++){ const r = hourRows[h] || []; line += `${String(h).padStart(2)}h ${mean(r).toFixed(2)}  `; if (h % 6 === 5){ console.log('  ' + line); line = ''; } }
for (const H of [10, 13, 16]){
  const n = win[H].length;
  console.log(`${H}h ±15 min (n=${n}): LAWN median ${med(win[H]).toFixed(2)} mean ${mean(win[H]).toFixed(2)} min ${Math.min(...win[H]).toFixed(1)} · ring median ${med(ring[H]).toFixed(2)}  ` + LAWN.map(k => { const v = winK[H + ':' + k] || []; return `${k} ${mean(v).toFixed(2)} (>0 in ${v.filter(x => x > 0).length}/${n})`; }).join(' · '));
}
console.log('seed 42 at 13:25:', c135.map(c => JSON.stringify(c)).join('\n                 '));
console.log(`night (nightF > 0.5) lawn-kind stayers inside the wall not walking out: max per seed ${JSON.stringify(nightMax)}` + (night.length ? '\n  ' + night.map(n => JSON.stringify(n)).join('\n  ') : '  — none'));
const perDay = SEEDS.length * NDAYS;
console.log(`set-outs (holders) per seed·day: ` + Object.entries(setouts).map(([k, v]) => `${k} ${(v / perDay).toFixed(2)}`).join(' · ') + `  total ${(Object.values(setouts).reduce((s, v) => s + v, 0) / perDay).toFixed(2)}/day`);
console.log(`by door: ${JSON.stringify(doors)}  priced walk h: ` + (pred.length ? `min ${Math.min(...pred)} median ${med(pred)} max ${Math.max(...pred)}` : '–'));
