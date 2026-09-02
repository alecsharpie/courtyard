#!/usr/bin/env node
/* #128 — how many punt crossings carry TWO people, and do the two ever draw as one?
 *
 *   node probes/punt-pair.mjs [--file f.html] [--seeds 7,42,...] [--days 14] [--label L]
 *
 * The punt is the town's one boat and the eyot its one place reachable only by water.
 * This counts, per seed over `days`:
 *   offers    a jetty stander reached its stop and puntFits() was asked
 *   claims    puntFits() said yes  (leg 0 -> 1)
 *   crossings the punt actually poled off  (leg -> 2)
 *   paired    crossings carrying a companion as well as the rider
 *   landed2   crossings where BOTH were ashore on the eyot
 *   home2     crossings where BOTH got back off the punt at the mooring
 *   alone     crossings where one of the two ended up walking home without the other
 * and the MINIMUM separation between rider and companion over the whole trip — the
 * 0.9-cell law: two figures nearer than that render as one shape.
 *
 * Sampled every 0.25 s of sim time, which is finer than any leg lasts.
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
  /* the CHOICE is instrumented at its own seam, so an offer that puntFits refuses is
   * counted with its reason — presence would only ever see the yeses */
  const offers = [];
  const origFits = window.puntFits || puntFits;
  window.puntFits = function(a){
    const ok = origFits(a);
    offers.push({ ok: ok ? 1 : 0, lead: a.pairLead ? 1 : 0, hour, day });
    return ok;
  };
  const trips = [];
  __reseed();                       // frames drawn at page load move the PRNG (LAW)
  let cur = null, lastLeg = 0;
  /* the CONTROL: every ordinary pair in the town, sampled the same way. The 0.9-cell
   * law is enforced by a shove on the FOLLOWER's step, and the leader walks on
   * regardless, so the town has a floor of its own — a punt number is only a defect
   * if it is below THAT. */
  const ctrl = { min: 99, n: 0, under: 0 };
  while (day < 1) __warp(1);
  const d0 = day;
  while (day < d0 + ${days}){
    __warp(0.25);
    const leg = punt.leg, R = punt.rider, M = punt.mate || null;
    if (leg && !lastLeg){ cur = { day, hour, paired: 0, crossed: 0, land: 0, home: 0,
                                  minSep: 99, sepN: 0, ridDone: 0, mateDone: 0 }; trips.push(cur); }
    if (cur){
      if (M) cur.paired = 1;
      if (leg >= 2) cur.crossed = 1;
      if (R && M && !R.done && !M.done){
        const s = Math.hypot(R.x - M.x, R.y - M.y);
        if (s < cur.minSep) cur.minSep = s;
        // WHERE the closest approach happens: the boat's own business, or the walking
        // the town already does with every other pair
        const ph = punt.seating ? 'seating' : leg === 1 ? 'toBoat' : (leg === 2 || leg === 4) ? 'aboard' : 'ashore';
        if (!cur.ph || s < cur.phSep){ cur.ph = ph; cur.phSep = s; }
        cur.sepN++;
      }
      if (leg === 3) cur.land = Math.max(cur.land, (R && !R.aboard ? 1 : 0) + (M && !M.aboard ? 1 : 0));
      if (!leg && lastLeg) { cur.home = 1; cur.endLeg = lastLeg; cur = null; }
    }
    for (const o of agents){
      if (!o.with || o.done || o.with.done || o.aboard || o.boarding) continue;
      if (punt.rider && (o === punt.mate || o.with === punt.rider)) continue;   // the boat's pair is the thing under test
      const s = Math.hypot(o.x - o.with.x, o.y - o.with.y);
      ctrl.n++; if (s < 0.9) ctrl.under++; if (s < ctrl.min) ctrl.min = s;
    }
    lastLeg = leg;
  }
  /* did the pair leave TOGETHER? the companion is only released when its leader is
   * done, so measure it directly: any far agent still on the frame whose leader is
   * gone, or the other way round */
  return { trips, offers, ctrl, still: agents.filter(a => a.far).length };
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
const crossed = trips.filter(t => t.crossed);
const paired = crossed.filter(t => t.paired);
const seps = paired.filter(t => t.sepN > 0).map(t => t.minSep);
const f2 = x => x.toFixed(2);
console.log(`\n=== punt pairs — ${LABEL} · ${SEEDS.length} seeds x ${DAYS} days ===`);
console.log(`  offers        ${offers.length}  (yes ${offers.filter(o => o.ok).length}, of which pair-leaders ${offers.filter(o => o.ok && o.lead).length}; refused pair-leaders ${offers.filter(o => !o.ok && o.lead).length})`);
console.log(`  claims        ${trips.length}`);
console.log(`  crossings     ${crossed.length}   (${f2(crossed.length / SEEDS.length / DAYS)} / day)`);
console.log(`  people carried ${crossed.length + paired.length}   (the cap is unchanged, so a pair is two of the same three)`);
console.log(`  PAIRED        ${paired.length}   ${crossed.length ? (100 * paired.length / crossed.length).toFixed(1) : '0.0'}% of crossings`);
console.log(`  both ashore   ${paired.filter(t => t.land === 2).length} of ${paired.length}`);
console.log(`  came home     ${paired.filter(t => t.home).length} of ${paired.length}`);
console.log(`  min sep       ${seps.length ? `${f2(Math.min(...seps))} cells (worst of ${seps.length} pairs; median ${f2(seps.sort((a,b)=>a-b)[seps.length>>1])})` : '—'}   [PAIR_MIN 0.9]`);

const phs = {}; for (const t of paired){ const p = t.ph; if (!phs[p] || t.phSep < phs[p]) phs[p] = t.phSep; }
console.log(`  closest, by phase  ${Object.entries(phs).map(([k, v]) => k + ' ' + f2(v)).join(' · ')}   (boat code: seating/aboard; the town's own rule: toBoat/ashore)`);
const boat = Object.entries(phs).filter(([k]) => k === 'seating' || k === 'aboard').map(([, v]) => v);
if (boat.length && Math.min(...boat) < 0.9) console.log(`  ** the BOAT put them under PAIR_MIN — they draw as one shape **`);
const C = runs.map(r => r.ctrl);
console.log(`  CONTROL       ordinary pairs: min ${f2(Math.min(...C.map(c => c.min)))} cells, ` +
            `${(100 * C.reduce((s,c)=>s+c.under,0) / Math.max(1,C.reduce((s,c)=>s+c.n,0))).toFixed(1)}% of ` +
            `${C.reduce((s,c)=>s+c.n,0)} samples under 0.9`);
console.log(`  left on frame ${runs.map(r => r.still).join(',')}  (far agents still walking at the end of the window)`);
