#!/usr/bin/env node
/* gardener-rows — b108 / #108: how many ROWS a gardener works, and when.
 *
 *   node gardener-rows.mjs [file] [--seeds 12] [--days 6] [--day0 6]
 *
 * Wraps gardenerKneel() and records every kneel: the hour it starts, the row index,
 * lawnEnd() at that instant, and whether another row was taken. On HEAD the function
 * does not exist, so the answer there is 1 row by construction — this measures the
 * candidate's own distribution and, with it, whether the pricing is live or dead.
 */
import { homedir } from 'node:os'; import { resolve, join, dirname } from 'node:path'; import { pathToFileURL, fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const arg = (n, d) => { const i = process.argv.indexOf(n); return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const file = process.argv[2] && !process.argv[2].startsWith('--') ? resolve(process.argv[2]) : resolve(HERE, '../../../../courtyard.html');
const NS = +arg('--seeds', 12), NDAYS = +arg('--days', 6), DAY0 = +arg('--day0', 6);
const SEEDS = [3, 7, 11, 19, 23, 29, 42, 51, 64, 77, 88, 91].slice(0, NS);
const b = await chromium.launch(); const all = [];
for (const seed of SEEDS){
  const p = await b.newPage({ viewport:{width:1200, height:720} });
  p.on('pageerror', e => console.log('PAGE ERROR', e.message));
  await p.goto(pathToFileURL(file).href + `?pause&seed=${seed}`);
  await p.waitForFunction(() => window.__warp);
  all.push(...JSON.parse(await p.evaluate(new Function("A", "const {DAY0, NDAYS} = A;" + `
    if (typeof gardenerKneel !== 'function') return '[]';
    window.__reseed(); window.__warp(DAY0 * 55 - simT);
    const log = [], orig = gardenerKneel;
    gardenerKneel = function(a){ orig(a);
      log.push({h:+hour.toFixed(2), row:a.rows, durH:+(a.timer * HOURS_PER_S).toFixed(2), le:+lawnEnd().toFixed(2), more:!!a.tendBed}); };
    for (let i = 0; i < 40000 && day < DAY0 + NDAYS; i++) window.__warp(0.3);
    return JSON.stringify(log);`), {DAY0, NDAYS})));
  await p.close();
}
await b.close();
const med = a => { const s=[...a].sort((x,y)=>x-y); return s.length ? s[s.length>>1] : NaN; };
if (!all.length){ console.log(`file: ${file}  — gardenerKneel() absent (HEAD): 1 row per visit by construction`); process.exit(0); }
const firsts = all.filter(r => r.row === 1);
const dist = {}; for (const r of all) dist[r.row] = (dist[r.row]||0) + 1;
console.log(`file: ${file}  seeds ${SEEDS.length} x ${NDAYS} d from day ${DAY0}`);
console.log(`  kneels ${all.length} over ${firsts.length} visits = ${(all.length/firsts.length).toFixed(2)} rows/visit   distribution by row index ${JSON.stringify(dist)}`);
console.log(`  another row taken: ${all.filter(r=>r.more).length}/${all.length} kneels (${(100*all.filter(r=>r.more).length/all.length).toFixed(0)}%)`);
console.log(`  kneel starts at hour: median ${med(all.map(r=>r.h)).toFixed(2)}  (lawnEnd median ${med(all.map(r=>r.le)).toFixed(2)}, so median headroom ${(med(all.map(r=>r.le-r.h))).toFixed(2)} h)`);
console.log(`  row length h: median ${med(all.map(r=>r.durH)).toFixed(2)} min ${Math.min(...all.map(r=>r.durH))} max ${Math.max(...all.map(r=>r.durH))}`);
console.log(`  headroom on kneels that took another row: median ${med(all.filter(r=>r.more).map(r=>r.le-r.h)).toFixed(2)} h   on those that did not: ${med(all.filter(r=>!r.more).map(r=>r.le-r.h)).toFixed(2)} h`);
