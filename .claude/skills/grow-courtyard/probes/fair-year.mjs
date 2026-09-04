#!/usr/bin/env node
/* #194 — the plaza's fair day, measured as PRESENCE over a whole year.
 * For every seed: step a year at a fixed 0.5 s and, at every sample, count the people
 * standing in four boxes — the plaza, the lane, the courtyard and the quay. The control
 * is the SAME HOURS on a day that is not a fair: fairStart()/fairEnd() are pure
 * functions of the sun and do not read isFairDay(), so the window is defined on every
 * day of the year and the two populations differ in exactly one way. */
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
const STEP = +arg('--step', 0.5);
const b = await chromium.launch();
const all = [];
for (const seed of SEEDS){
  const page = await b.newPage({ viewport: { width: 1280, height: 700 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(pathToFileURL(SRC).href + `?seed=${seed}&pause&t=2`);
  await page.waitForFunction('typeof __warp === "function"');
  const r = await page.evaluate(`(() => {
    __reseed();
    while (day < 2) __warp(1);
    const d0 = day, out = [], slots = [];
    const has = typeof isFairDay === 'function';
    if (has) for (const s of FAIR_SLOTS) slots.push({x:+s.x.toFixed(2), y:+s.y.toFixed(2),
      inPlaza: inPlaza(s.x|0, s.y|0), tile: grid[(s.y|0)*GW + (s.x|0)]});
    const box = (x0,x1,y0,y1) => agents.reduce((n,a) => n + (a.x>=x0&&a.x<x1&&a.y>=y0&&a.y<y1 ? 1 : 0), 0);
    while (day < d0 + ${DAYS}){
      __warp(${STEP});
      /* the window and the day are computed from PRIMITIVES here, not from the build's own
         predicates, so the same lines run on the pinned HEAD (where neither exists) and
         label exactly the same days and hours. Asserted against the build's own below. */
      const e = Math.min(sunDown - 2.6, 17.6), s = Math.max(e - 6.5, 9.4);
      const fair = (day > 1 && hash(day, 907 + WIND_SALT) < 0.2) ? 1 : 0;
      if (has && (fair !== (isFairDay()?1:0) || Math.abs(s - fairStart()) > 1e-9)) throw new Error('probe window != build');
      out.push({ day, hour:+hour.toFixed(2), fair,
        win: (hour >= s - 1.6 && hour < e + 1.5) ? 1 : 0,
        plaza: box(99,112,3,61), quay: box(112,114,0,63), lane: box(0,96,62,70),
        court: box(3,61,3,61), fairN: has ? fairCount() : 0,
        stood: agents.reduce((n,a)=>n+((a.stopped&&a.state!=='walk'&&a.x>=99&&a.x<112&&a.y>=3&&a.y<61)?1:0),0) });
    }
    return { out, slots, agentsLeft: agents.length };
  })()`);
  if (errs.length) console.log('SEED', seed, 'ERRORS', errs.slice(0,3));
  if (!all.length) console.log('slots:', JSON.stringify(r.slots));
  all.push({ seed, ...r });
  await page.close();
}
await b.close();
const mean = a => a.length ? a.reduce((x,y)=>x+y,0)/a.length : 0;
const sel = (rows, f) => rows.filter(f);
let fairDays = 0, ordDays = 0;
const F = { plaza:[], lane:[], court:[], quay:[], stood:[] }, O = { plaza:[], lane:[], court:[], quay:[], stood:[] };
const peaks = [];
for (const s of all){
  const byDay = new Map();
  for (const r of s.out){ if (!byDay.has(r.day)) byDay.set(r.day, []); byDay.get(r.day).push(r); }
  for (const [d, rows] of byDay){
    const w = rows.filter(r => r.win);
    if (!w.length) continue;
    const T = w[0].fair ? F : O;
    for (const k of Object.keys(T)) T[k].push(mean(w.map(r => r[k])));
    if (w[0].fair){ fairDays++; peaks.push(Math.max(...w.map(r=>r.fairN))); } else ordDays++;
  }
}
const p = (n, v) => console.log('  ' + n.padEnd(10), v.map(x => x.toFixed(2)).join('  '));
console.log(`\nseeds ${SEEDS.length} x ${DAYS} d   fair days ${fairDays}  ordinary ${ordDays}  (${(100*fairDays/(fairDays+ordDays)).toFixed(1)}%)`);
console.log('presence in the fair WINDOW, mean people in the box   [fair day]  [ordinary]  [x]');
for (const k of ['plaza','stood','quay','lane','court'])
  console.log('  ' + k.padEnd(7), mean(F[k]).toFixed(2).padStart(6), mean(O[k]).toFixed(2).padStart(6),
              '   x' + (mean(F[k]) / (mean(O[k]) || 1)).toFixed(2));
console.log('slots filled at peak, per fair day:', peaks.join(' '), ' mean', mean(peaks).toFixed(2));
console.log('agents left on the frame at the end:', all.map(s=>s.agentsLeft).join(' '));
