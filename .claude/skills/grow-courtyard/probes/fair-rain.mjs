#!/usr/bin/env node
/* b204 — of the fair days that fill 0 slots, how many were raining AT THE RAISE and dry
 * for the rest of the window? Per fair day: peak slots, the wet share of the GATHERING
 * window (fairStart-FAIR_UP .. fairStart+FAIR_GATHER), the wet share of the whole fair,
 * and the dry hours left inside the fair after the gathering closes. */
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
const STEP = +arg('--step', 0.25);
const b = await chromium.launch();
const days = [];
for (const seed of SEEDS){
  const page = await b.newPage({ viewport: { width: 1280, height: 700 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(pathToFileURL(SRC).href + `?seed=${seed}&pause&t=2`);
  await page.waitForFunction('typeof __warp === "function"');
  const r = await page.evaluate(`(() => {
    __reseed();
    while (day < 2) __warp(1);
    const d0 = day, out = [];
    while (day < d0 + ${DAYS}){
      __warp(${STEP});
      /* window off PRIMITIVES, so a pinned HEAD labels the same hours (fair-year.mjs) */
      const e = Math.min(sunDown - 2.6, 17.6), s = Math.max(e - 6.5, 9.4);
      const fair = (day > 1 && hash(day, 907 + WIND_SALT) < 0.2) ? 1 : 0;
      if (fair !== (isFairDay()?1:0) || Math.abs(s - fairStart()) > 1e-9) throw new Error('probe window != build');
      out.push({ day, hour:+hour.toFixed(3), fair, s, e, rain: raining?1:0,
        gath: (hour >= s - 1.6 && hour < s + 1.0) ? 1 : 0,
        win:  (hour >= s - 1.6 && hour < e) ? 1 : 0,
        fairN: fairCount(),
        stood: agents.reduce((n,a)=>n+((a.fair&&a.stopped)?1:0),0),
        plaza: agents.reduce((n,a)=>n+(a.x>=99&&a.x<112&&a.y>=3&&a.y<61?1:0),0) });
    }
    return out;
  })()`);
  if (errs.length) console.log('SEED', seed, 'ERRORS', errs.slice(0,3));
  const byDay = new Map();
  for (const row of r){ if (!byDay.has(row.day)) byDay.set(row.day, []); byDay.get(row.day).push(row); }
  for (const [d, rows] of byDay){
    if (!rows[0].fair) continue;
    const g = rows.filter(x => x.gath), w = rows.filter(x => x.win);
    if (!g.length || !w.length) continue;
    const after = w.filter(x => x.hour >= x.s + 1.0);
    days.push({ seed, day: d,
      peak: Math.max(...w.map(x => x.fairN)),
      stoodMean: w.reduce((n,x)=>n+x.stood,0) / w.length,
      stoodPeak: Math.max(...w.map(x => x.stood)),
      plazaPeak: Math.max(...w.map(x => x.plaza)),
      gathWet: g.filter(x => x.rain).length / g.length,
      winWet:  w.filter(x => x.rain).length / w.length,
      dryAfter: after.filter(x => !x.rain).length * STEP * 24 / 55,
      afterH:   after.length * STEP * 24 / 55 });
  }
  await page.close();
}
await b.close();
const n = days.length, zero = days.filter(d => d.peak === 0);
const f = x => x.toFixed(2);
console.log(`\n${SEEDS.length} seeds x ${DAYS} d   fair days ${n}   filling 0 slots ${zero.length} (${(100*zero.length/n).toFixed(1)}%)`);
console.log('  peaks:', days.map(d => d.peak).join(' '));
console.log('\nthe ZERO days — gathering wet share / whole-window wet share / dry hours after the gathering closes');
for (const d of zero) console.log(`  seed ${String(d.seed).padStart(5)} day ${String(d.day).padStart(3)}  gathWet ${f(d.gathWet)}  winWet ${f(d.winWet)}  dryAfter ${f(d.dryAfter)} of ${f(d.afterH)} h`);
const rescuable = zero.filter(d => d.dryAfter > 1.5);
console.log(`\nzero days with > 1.5 dry hours left after the gathering: ${rescuable.length} of ${zero.length}`);
console.log('non-zero days, gathWet:', days.filter(d=>d.peak>0).map(d=>f(d.gathWet)).join(' '));
for (const d of days.filter(x => x.gathWet > 0.25))
  console.log(`  WET RAISE seed ${d.seed} day ${d.day}  gathWet ${f(d.gathWet)}  winWet ${f(d.winWet)}  peak ${d.peak}  plazaPeak ${d.plazaPeak}  dryAfter ${f(d.dryAfter)}`);
const part = days.filter(d => d.gathWet > 0 && d.gathWet < 1);
console.log(`days with a PARTLY wet gathering: ${part.length}  peaks ${part.map(d=>d.peak).join(' ')}`);
const mean = a => a.length ? a.reduce((x,y)=>x+y,0)/a.length : 0;
console.log(`STANDERS on fair days: mean ${f(mean(days.map(d=>d.stoodMean)))}  peak ${f(mean(days.map(d=>d.stoodPeak)))}`);
console.log(`mean peak  all ${f(mean(days.map(d=>d.peak)))}   dry gathering ${f(mean(days.filter(d=>d.gathWet===0).map(d=>d.peak)))} (n ${days.filter(d=>d.gathWet===0).length})`);
