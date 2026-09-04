#!/usr/bin/env node
/* b214 — measure the terrace choice AT THE CHOICE, not by presence. Wraps freeBay()
 * and spawnTenant() after __reseed() and records, per call: the k, the OPEN list it
 * was handed, and which house it returned. */
import { homedir } from 'node:os';
import { resolve, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
const PW = homedir() + '/.claude/skills/screenshot-verify/node_modules/playwright/index.js';
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i < 0 ? d : argv[i + 1]; };
const SRC = resolve(ROOT, arg('--file', 'courtyard.html'));
const SEEDS = arg('--seeds', '7,42,1234,555,90210,31337').split(',').map(Number);
const DAYS = +arg('--days', 26);
const STEP = +arg('--step', 0.5);
const b = await chromium.launch();
const all = [];
for (const seed of SEEDS){
  const page = await b.newPage({ viewport: { width: 1600, height: 950 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(pathToFileURL(SRC).href + `?seed=${seed}&pause&t=2`);
  await page.waitForFunction('typeof __warp === "function"');
  const r = await page.evaluate(`(() => {
    __reseed();
    while (day < 2) __warp(1);
    const d0 = day;
    const calls = [], spawns = [], eligible = [];
    let fired = 0;
    const fb = freeBay;
    freeBay = function(k, want){
      const open = LEADS_BAYS.filter(b => !b.busy && (!want || want(b)));
      const r = fb(k, want);
      fired++;
      calls.push({k, day, open:open.map(b=>b.house), got:r ? r.house : null});
      return r;
    };
    const st = spawnTenant;
    spawnTenant = function(bay, act){ spawns.push({day, act, house:bay.house}); return st(bay, act); };
    let lastDay = -1;
    while (day < d0 + ${DAYS}){
      __warp(${STEP});
      if (day !== lastDay){ lastDay = day;
        eligible.push({day, wash:LEADS_BAYS.filter(bayWash).map(b=>b.house)}); }
    }
    return {fired, calls, spawns, eligible, houses:LEADS_BAYS.map(b=>b.house)};
  })()`);
  if (errs.length) console.log('SEED', seed, 'ERRORS', errs.slice(0, 3));
  if (!r.fired) console.log('SEED', seed, 'WARNING: wrapper never fired');
  all.push({ seed, ...r });
  await page.close();
}
await b.close();
const houses = all[0].houses;
const tab = (rows, key) => {
  const c = {}; for (const h of houses) c[h] = 0;
  let nul = 0;
  for (const r of rows){ if (r[key] === null || r[key] === undefined) nul++; else c[r[key]]++; }
  return houses.map(h => `h${h}:${String(c[h]).padStart(3)}`).join(' ') + (nul ? `  null:${nul}` : '');
};
console.log(`\nBAY CHOICE — ${SEEDS.length} seeds x ${DAYS} days`);
const calls = all.flatMap(s => s.calls), spawns = all.flatMap(s => s.spawns);
for (const k of [...new Set(calls.map(c => c.k))].sort()){
  const cs = calls.filter(c => c.k === k);
  console.log(`  freeBay(${k})  n=${String(cs.length).padStart(4)}  chose  ${tab(cs, 'got')}`);
  // how often was each house even IN the open list
  const inOpen = {}; for (const h of houses) inOpen[h] = 0;
  for (const c of cs) for (const h of c.open) inOpen[h]++;
  console.log(`               offered ${houses.map(h => `h${h}:${String(inOpen[h]).padStart(3)}`).join(' ')}`);
  const sz = {}; for (const c of cs) sz[c.open.length] = (sz[c.open.length]||0)+1;
  console.log(`               |open| ${JSON.stringify(sz)}`);
}
console.log(`\n  spawns by act:`);
for (const a of [...new Set(spawns.map(s => s.act))])
  console.log(`    ${a.padEnd(5)} n=${String(spawns.filter(s=>s.act===a).length).padStart(4)}  ${tab(spawns.filter(s=>s.act===a), 'house')}`);
console.log(`    ALL   n=${String(spawns.length).padStart(4)}  ${tab(spawns, 'house')}`);
const el = all.flatMap(s => s.eligible);
const ec = {}; for (const h of houses) ec[h] = 0;
for (const e of el) for (const h of e.wash) ec[h]++;
console.log(`\n  bayWash eligible on ${el.length} day-samples: ${houses.map(h=>`h${h}:${(100*ec[h]/el.length).toFixed(0)}%`).join(' ')}`);
