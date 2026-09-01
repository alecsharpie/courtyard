#!/usr/bin/env node
/* gardener-presence — b108 / #108: is the courtyard visibly TENDED?
 *
 *   node gardener-presence.mjs [file] [--seeds 10] [--days 3] [--day0 6]
 *
 * PRESENCE over FOLDED time, not a per-instant crop (the brief, and the law: a
 * place-holder is measured by rate x visit). Every ~0.25 s of sim across a run,
 * count the gardeners INSIDE THE COURTYARD WALL and fold them onto the day's
 * 13 daylit hours (lawnStart-1 .. lawnEnd+1 is not it -- we fold onto a fixed
 * 13 h band centred on solar noon, so summer and winter are the SAME axis and
 * the number is comparable across the year).
 *
 *   presence   mean gardeners inside the wall over the 13 h band
 *   >0 share   share of samples with at least one
 *   setouts    gardener holders spawned per day  (rate)
 *   visit      hours each gardener spends inside the wall (the other factor)
 *   rows       kneels per visit
 *   first/last hour of the first and last sample that has a gardener
 *
 * SEASON: day0 6 is midsummer (SEASON_START .25 + d/26; phase .5 at day 6.5),
 * day0 19 is midwinter (phase ~.98). Both are run.
 */
import { homedir } from 'node:os'; import { resolve, join, dirname } from 'node:path'; import { pathToFileURL, fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const arg = (n, d) => { const i = process.argv.indexOf(n); return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const file = process.argv[2] && !process.argv[2].startsWith('--') ? resolve(process.argv[2]) : resolve(HERE, '../../../../courtyard.html');
const NS = +arg('--seeds', 10), NDAYS = +arg('--days', 3);
const DAY0S = arg('--day0', null) !== null ? [+arg('--day0', 6)] : [6, 19];
const SEEDS = [3, 7, 11, 19, 23, 29, 42, 51, 64, 77, 88, 91].slice(0, NS);
const BAND = 13;   // hours, centred on solar noon

const b = await chromium.launch();
const mean = a => a.length ? a.reduce((s, v) => s + v, 0) / a.length : NaN;
const med = a => { const s = [...a].sort((x, y) => x - y); return s.length ? s[s.length >> 1] : NaN; };
console.log(`file: ${file}  seeds ${SEEDS.join(',')}  ${NDAYS} d`);
for (const DAY0 of DAY0S){
  const P = { samp:0, hit:0, tot:0, setouts:0, days:0, visits:[], rows:[], hours:{}, firsts:[], lasts:[], phase:0, sun:[] };
  for (const seed of SEEDS){
    const p = await b.newPage({ viewport:{width:1200, height:720} });
    p.on('pageerror', e => console.log('PAGE ERROR', e.message));
    await p.goto(pathToFileURL(file).href + `?pause&seed=${seed}`);
    await p.waitForFunction(() => window.__warp);
    const out = await p.evaluate(new Function("A", "const {DAY0, NDAYS, BAND} = A;" + `
      const inYard = a => { const dx = a.x - CX, dy = a.y - CY; return Math.hypot(dx, dy) < wallR(Math.atan2(dy, dx)) - 0.5; };
      window.__reseed(); window.__warp(DAY0 * 55 - simT);
      const R2 = { samp:0, hit:0, tot:0, setouts:0, visits:[], rows:[], hours:{}, firsts:[], lasts:[], sun:[] };
      const seen = new WeakSet(); for (const a of agents) seen.add(a);
      const inside = new Map();   // agent -> {t0, rows}
      let dayNow = day, firstH = null, lastH = null;
      for (let i = 0; day < DAY0 + NDAYS; i++){
        window.__warp(0.25 / (24 / 55));   // 0.25 h of sim time
        if (day !== dayNow){
          if (firstH !== null){ R2.firsts.push(firstH); R2.lasts.push(lastH); }
          firstH = lastH = null; dayNow = day;
        }
        for (const a of agents){ if (seen.has(a)) continue; seen.add(a);
          if (a.kind === 'gardener' && a.lawnLead && !a.with) R2.setouts++; }
        // the 13 h band centred on solar noon, folded: same axis summer and winter
        const noon = (sunUp + sunDown) / 2, h = hour;
        const g = agents.filter(a => a.kind === 'gardener' && inYard(a));
        for (const a of g){ if (!inside.has(a)) inside.set(a, {t0:simT, rows:0}); }
        for (const a of agents) if (a.kind === 'gardener' && inside.has(a)) inside.get(a).rows = Math.max(inside.get(a).rows, a.rows || 0);
        for (const [a, r] of inside){ if (!g.includes(a)){ R2.visits.push((simT - r.t0) * 24 / 55); R2.rows.push(r.rows); inside.delete(a); } }
        if (Math.abs(h - noon) <= BAND / 2){
          R2.samp++; R2.tot += g.length; if (g.length) R2.hit++;
          const k = Math.round((h - noon) * 2) / 2;
          R2.hours[k] = (R2.hours[k] || 0) + g.length;
        }
        if (g.length){ if (firstH === null) firstH = +h.toFixed(2); lastH = +h.toFixed(2); }
        R2.sun.push(+(sunDown - sunUp).toFixed(2));
      }
      return {...R2, phase:+seasonPhase.toFixed(3), warmth:+warmth.toFixed(2), sunLen:+(sunDown - sunUp).toFixed(2), hasRows: typeof GARDEN_ROWS !== 'undefined'};`), {DAY0, NDAYS, BAND});
    P.samp += out.samp; P.hit += out.hit; P.tot += out.tot; P.setouts += out.setouts;
    P.visits.push(...out.visits); P.rows.push(...out.rows);
    P.firsts.push(...out.firsts); P.lasts.push(...out.lasts);
    for (const k in out.hours) P.hours[k] = (P.hours[k] || 0) + out.hours[k];
    P.phase = out.phase; P.warmth = out.warmth; P.sunLen = out.sunLen;
    await p.close();
  }
  const days = SEEDS.length * NDAYS, nH = P.samp ? P.samp / Object.keys(P.hours).length : 1;
  console.log(`\n=== day0 ${DAY0}  phase ${P.phase} warmth ${P.warmth} daylen ${P.sunLen} h  (${SEEDS.length} seeds x ${NDAYS} d) ===`);
  console.log(`  PRESENCE over the ${BAND} h band: mean ${(P.tot / P.samp).toFixed(3)}   >0 in ${P.hit}/${P.samp} samples (${(100 * P.hit / P.samp).toFixed(1)}%)`);
  console.log(`  set-outs ${(P.setouts / days).toFixed(2)}/day   visit median ${med(P.visits).toFixed(2)} h mean ${mean(P.visits).toFixed(2)} max ${P.visits.length ? Math.max(...P.visits).toFixed(2) : '-'} (n=${P.visits.length})   rate x visit = ${((P.setouts / days) * mean(P.visits) / BAND).toFixed(3)}`);
  console.log(`  kneels/visit median ${med(P.rows)} max ${P.rows.length ? Math.max(...P.rows) : '-'}`);
  console.log(`  first gardener of the day: median ${med(P.firsts)} h (n=${P.firsts.length} days of ${days})   last: median ${med(P.lasts)} h`);
  let line = '  by hour from solar noon: ';
  for (const k of Object.keys(P.hours).map(Number).sort((a, c) => a - c)) line += `${k > 0 ? '+' : ''}${k} ${(P.hours[k] / (P.samp / Object.keys(P.hours).length)).toFixed(2)}  `;
  console.log(line);
}
await b.close();
