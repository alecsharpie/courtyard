#!/usr/bin/env node
/* plaza-midday — c127 / b90: who is on the plaza, by hour, and do families visit?
 *
 *   node .claude/skills/grow-courtyard/probes/plaza-midday.mjs [path-to-courtyard.html] [--seeds 10] [--days 3]
 *
 * 10 seeds × 3 summer days (days 5–7: seasonPhase ≈ 0.44–0.49, warmth ≈ 0.9+). Every
 * ~0.33 s of sim time (__warp rounds 0.05 s up to whole fixed-dt steps; the loop runs on `day`), counts the people standing in the plaza box (x 98..112, y 18..46),
 * bucketed by sim hour. Prints the histogram (mean + median across seed·days at each
 * hour) — on HEAD that is the c127 baseline; on the candidate it should lift at midday.
 * Then, for the family source (a.fam / a.famKid on the candidate; all zero on HEAD):
 *   families born per day · in rain / after dark · child > 6 cells from parent for > 3 s
 *   · child-triggered plaza flushes per visit · pairs that left together.
 */
import { homedir } from 'node:os'; import { resolve, join, dirname } from 'node:path'; import { pathToFileURL, fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const arg = (n, d) => { const i = process.argv.indexOf(n); return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const file = process.argv[2] && !process.argv[2].startsWith('--') ? resolve(process.argv[2]) : resolve(HERE, '../../../..', 'courtyard.html');
const NS = +arg('--seeds', 10), NDAYS = +arg('--days', 3), DAY0 = +arg('--day0', 5);
const SEEDS = [3, 7, 11, 19, 23, 29, 42, 51, 64, 77, 88, 91].slice(0, NS);
const b = await chromium.launch();
const hourRows = {};            // hour -> [presence samples per seed·day mean]
const noonSamples = [];         // per seed·day: mean presence 11:45..12:15
const fam = {born:0, rain:0, dark:0, farRuns:0, farMax:0, flushes:0, visitsWithFlush:0, visits:0, leftTogether:0, leftApart:0, byGate:{}, quay:0, perDay:[]};
for (const seed of SEEDS){
  const p = await b.newPage();
  p.on('pageerror', e => console.log('PAGE ERROR', e.message));
  await p.goto(pathToFileURL(file).href + `?pause&seed=${seed}`);
  await p.waitForFunction(() => window.__warp);
  const out = await p.evaluate(({DAY0, NDAYS}) => {
    window.__reseed();
    window.__warp(DAY0 * 55 - simT);                      // to 06:00 of DAY0
    const inPlaza = a => a.x >= 98 && a.x < 112 && a.y >= 18 && a.y < 46;
    const hours = {}, noon = [], perDay = [];
    let curDay = day, dayBorn = 0;
    const seen = new WeakSet(), kids = new Map(), runs = new WeakMap(); let runsN = 0, chasesN = 0;
    for (const a of agents) if (a.fam) seen.add(a);           // alive at the first sample: not this window's spawns          // kid -> {far:0 (s), farMax, flushed:0, gone}
    const parents = new Map();                             // parent -> {kid, doneT}
    let born = 0, rain = 0, dark = 0, farRuns = 0, farMax = 0, flushes = 0, visitsWithFlush = 0, visits = 0, together = 0, apart = 0, quay = 0;
    const byGate = {};
    const wasHop = new WeakMap();
    let noonAcc = 0, noonN = 0;
    let i = 0, lastT = simT;
    for (; day < DAY0 + NDAYS; i++){                        // __warp rounds to whole fixed-dt steps, so loop on the DAY, not a step count
      window.__warp(0.05); const dt = simT - lastT; lastT = simT;
      if (day !== curDay){ perDay.push(dayBorn); dayBorn = 0; curDay = day; if (noonN){ noon.push(noonAcc / noonN); noonAcc = 0; noonN = 0; } }
      for (const a of agents){
        if (a.fam && !a.famKid && !seen.has(a)){ seen.add(a); born++; dayBorn++; visits++;
          if (raining) rain++; if (daylight < 0.35) dark++; if (a.famQuay) quay++;
          byGate[a.famGate || '?'] = (byGate[a.famGate || '?'] || 0) + 1;
          parents.set(a, {kid:null, doneT:null}); }
        if (a.famKid && seen.has(a)) continue;
        if (a.famKid){ const r = runs.get(a); if (a.run && !r){ runsN++; if (a.chasing) chasesN++; } runs.set(a, !!a.run); }
        if (a.famKid && !kids.has(a)){ kids.set(a, {far:0, farMax:0, flushed:0, doneT:null, parent:a.with || a.famParent}); const pr = parents.get(a.with || a.famParent); if (pr) pr.kid = a; }
      }
      // child-triggered flushes: a plaza bird that went hop -> fly with a kid within 4.5
      for (const bd of birds){
        const was = wasHop.get(bd);
        if (bd.state === 'hop') wasHop.set(bd, true);
        else if (was && bd.state === 'fly'){ wasHop.set(bd, false);
          if (inPlaza(bd)){ for (const [k] of kids){ if (!k.done && Math.hypot(k.x - bd.x, k.y - bd.y) < 4.6){ flushes++; kids.get(k).flushed++; break; } } } }
      }
      for (const [k, r] of kids){
        if (r.doneT !== null) continue;
        if (k.done || !agents.includes(k)){ r.doneT = simT; continue; }
        const P = r.parent; if (!P) continue;
        const d = Math.hypot(k.x - P.x, k.y - P.y);
        if (d > 6){ r.far += dt; if (r.far > farMax) farMax = r.far; if (r.far > 3 && r.far - dt <= 3) farRuns++; } else r.far = 0;
      }
      for (const [P, r] of parents){ if (r.doneT === null && (P.done || !agents.includes(P))) r.doneT = simT; }
      if (i % 5) continue;
      const h = Math.floor(hour);
      const n = agents.filter(inPlaza).length;
      (hours[h] || (hours[h] = [])).push(n);
      if (hour >= 11.75 && hour < 12.25){ noonAcc += n; noonN++; }
    }
    perDay.push(dayBorn); if (noonN) noon.push(noonAcc / noonN);
    for (const [P, r] of parents){ if (r.kid){ const kr = kids.get(r.kid); if (kr.flushed) visitsWithFlush++;
      if (r.doneT !== null && kr.doneT !== null){ if (Math.abs(r.doneT - kr.doneT) < 4) together++; else apart++; } } }
    const hmean = {}; for (const h in hours){ hmean[h] = hours[h].reduce((s, v) => s + v, 0) / hours[h].length; }
    return {hmean, noon, born, runsN, chasesN, rain, dark, farRuns, farMax:+farMax.toFixed(2), flushes, visitsWithFlush, visits, together, apart, byGate, quay, perDay};
  }, {DAY0, NDAYS});
  for (const h in out.hmean){ (hourRows[h] || (hourRows[h] = [])).push(out.hmean[h]); }
  noonSamples.push(...out.noon);
  for (const k of ['born','rain','dark','farRuns','flushes','visitsWithFlush','visits','quay','runsN','chasesN']) fam[k] = (fam[k] || 0) + out[k];
  fam.leftTogether += out.together; fam.leftApart += out.apart; fam.farMax = Math.max(fam.farMax, out.farMax);
  fam.perDay.push(...out.perDay);
  for (const g in out.byGate) fam.byGate[g] = (fam.byGate[g] || 0) + out.byGate[g];
  await p.close();
}
await b.close();
const med = a => { const s = [...a].sort((x, y) => x - y); return s.length ? s[s.length >> 1] : NaN; };
console.log(`file: ${file}   seeds: ${SEEDS.join(',')}   days ${DAY0}..${DAY0 + NDAYS - 1} (summer)`);
console.log('plaza presence (x 98..112, y 18..46), mean of per-seed means by hour:');
let line = '';
for (let h = 0; h < 24; h++){ const r = hourRows[h] || []; const m = r.length ? r.reduce((s, v) => s + v, 0) / r.length : 0; line += `${String(h).padStart(2)}h ${m.toFixed(2)}  `; if (h % 6 === 5){ console.log('  ' + line); line = ''; } }
console.log(`noon (11:45–12:15) per seed·day: median ${med(noonSamples).toFixed(2)}  mean ${(noonSamples.reduce((s, v) => s + v, 0) / noonSamples.length).toFixed(2)}  n=${noonSamples.length}`);
console.log(`families: born ${fam.born} over ${fam.perDay.length} seed·days (per day: median ${med(fam.perDay)}, min ${Math.min(...fam.perDay)}, max ${Math.max(...fam.perDay)})  by gate ${JSON.stringify(fam.byGate)}  quay-share ${fam.quay}`);
console.log(`  spawned in rain ${fam.rain} · in daylight<0.35 ${fam.dark} · child >6 cells from parent for >3 s: ${fam.farRuns} runs (longest ${fam.farMax}s)`);
console.log(`  child runs ${fam.runsN} (${(fam.runsN / Math.max(1, fam.visits)).toFixed(1)}/visit), of them chases ${fam.chasesN}`);
console.log(`  child-triggered plaza flushes ${fam.flushes} · visits with ≥1 flush ${fam.visitsWithFlush}/${fam.visits} · left together ${fam.leftTogether} · apart ${fam.leftApart}`);
