#!/usr/bin/env node
/* #183 — WHERE does the plaza's second act die? c262 read 13 ARMED / 6 REACHED and
 * blamed the population. This instruments the RUNG instead: every clause of the
 * choice in plazaVisit(), in its own evaluation order, then every edge on the
 * ground between arming and standing at the second place.
 *
 *   offer -> door open -> the PLAZA_TWO coin -> a free place of another kind  = ARMED
 *   ARMED -> first stop MADE -> stop2 CONSUMED -> second place STOOD AT       = REACHED
 *
 * Everything is counted at the edge it happens on; the drop edge carries the state
 * that produced it, because the same `a.stop2 = null` is written by two clauses. */
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = homedir() + '/.claude/skills/screenshot-verify/node_modules/playwright/index.js';
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i < 0 ? d : argv[i + 1]; };
const SRC = resolve(arg('--file', 'courtyard.html'));
const SEEDS = arg('--seeds', '7,42,1234,555,90210').split(',').map(Number);
const DAYS = +arg('--days', 14);
const T = arg('--t', '2');
const b = await chromium.launch();
const rows = [];
for (const seed of SEEDS){
  const page = await b.newPage({ viewport: { width: 1280, height: 700 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(pathToFileURL(SRC).href + `?seed=${seed}&pause` + (T ? `&t=${T}` : ''));
  await page.waitForFunction('typeof __warp === "function"');
  const r = await page.evaluate(`(() => {
    __reseed();                                   // R is REASSIGNED here, so wrap AFTER
    const RO = R; let draws = null, rFired = 0;
    R = function(){ const v = RO(); rFired++; if (draws) draws.push(v); return v; };
    const PV = plazaVisit;
    const t = { offers:0, doorShut:0, coinLost:0, altEmpty:0, armed:0 };
    const recs = [];
    plazaVisit = function(a, scale, fit, two){
      const rec = (two === true);
      if (rec){ t.offers++; draws = []; }
      const v = PV(a, scale, fit, two);
      if (!rec) return v;
      const u = draws; draws = null;
      if (!v) t.doorShut++;
      else if (!(u[3] < PLAZA_TWO)) t.coinLost++;
      else if (!v.p2) t.altEmpty++;
      else { t.armed++;
        recs.push({ a, p1:v.p, p2:v.p2, k1:v.p.k, k2:v.p2.k, first:0, promoted:0, second:0,
                    end:null, at:null, day0:day }); }
      return v;
    };
    while (day < 1) __warp(1);
    const d0 = day;
    const snap = a => ({ stopped:!!a.stopped, state:a.state, act:a.stop && a.stop.act,
                         onP1:!!(a.stop && a.stop.place === undefined ? false : false),
                         i:a.i, wp:a.wp ? a.wp.length : 0, raining:!!raining,
                         hour:+hour.toFixed(2), pheld:!!a.pheld, done:!!a.done });
    const xArmed = new Set();
    while (day < d0 + ${DAYS}){
      __warp(0.1);
      for (const a of agents) if (a.stop2) xArmed.add(a);
      for (const rc of recs){
        if (rc.end) continue;
        const a = rc.a;
        if (!rc.first && a.stopped && a.stop && a.stop.place === rc.p1){ rc.first = 1; rc.wpAt1 = a.wp.length; rc.iAt1 = a.i; }
        // THE EDGE: the first act has ended (they are walking again) with stop2 still armed.
        // Whatever wrote that is the clause that kills the second act, and it is readable HERE
        // and nowhere later — routeToExit() rebuilds wp, so a post-mortem reads i:2 wp:2 always.
        if (rc.first && !rc.promoted && !rc.edge && a.state === 'walk'){
          rc.edge = { stop2:!!a.stop2, at:a.stop === null ? 'null' : (a.stop.place === rc.p1 ? 'p1' : a.stop.place === rc.p2 ? 'p2' : 'OTHER:' + (a.stop.act||'?') + '@' + a.stop.x.toFixed(1) + ',' + a.stop.y.toFixed(1)), kind:a.kind, timer:+a.timer.toFixed(2), i:a.i, wp:a.wp.length, wpAt1:rc.wpAt1, iAt1:rc.iAt1,
                      raining:!!raining, sky:!!skyLifts(a), dusk:!!a.dusk, east:!!a.east, fam:!!a.fam,
                      resume:!!a.resume, street:!!a.street, hour:+hour.toFixed(2), k1:rc.k1, k2:rc.k2 };
        }
        if (!rc.promoted && !a.stop2){
          // the edge: stop2 has just been written null by one of the two clauses
          if (a.stop && a.stop.place === rc.p2){ rc.promoted = 1; }
          else { rc.end = rc.first ? 'dropped-after-1st' : (a.stop && a.stop.act === 'sit' ? 'seat-refused-1st' : 'dropped-before-1st');
                 rc.at = snap(a); continue; }
        }
        if (rc.promoted && !rc.second && a.stopped && a.stop && a.stop.place === rc.p2){ rc.second = 1; rc.end = 'REACHED'; rc.at = snap(a); }
        else if (a.done && !rc.end){ rc.end = rc.promoted ? 'promoted-never-arrived' : 'stranded-armed'; rc.at = snap(a); }
      }
    }
    for (const rc of recs) if (!rc.end) rc.end = rc.promoted ? 'promoted-open' : 'open';
    const by = {}; for (const rc of recs) by[rc.end] = (by[rc.end] || 0) + 1;
    const k1 = {}; for (const rc of recs) k1[rc.k1] = (k1[rc.k1] || 0) + 1;
    const k1r = {}; for (const rc of recs) if (rc.end === 'REACHED') k1r[rc.k1] = (k1r[rc.k1] || 0) + 1;
    const ctx = recs.filter(rc => rc.end !== 'REACHED' && rc.edge).map(rc => ({ e:rc.end, ...rc.edge }));
    return { ...t, rFired, xArmed: xArmed.size, first: recs.filter(r=>r.first).length,
             promoted: recs.filter(r=>r.promoted).length,
             second: recs.filter(r=>r.second).length, by, k1, k1r, ctx };
  })()`);
  if (errs.length){ console.error('PAGE ERROR', errs[0]); process.exit(2); }
  if (!r.rFired){ console.error('INSTRUMENT DID NOT FIRE (R never called through the wrapper)'); process.exit(3); }
  rows.push({ seed, ...r });
  await page.close();
}
await b.close();
const S = k => rows.reduce((s, r) => s + (r[k] || 0), 0);
const pc = (n, d) => d ? (100 * n / d).toFixed(1) + '%' : '  -  ';
console.log(`\n=== plaza-rung  ${SEEDS.length} seeds x ${DAYS} days   [${SRC.split('/').pop()}] ===`);
const off = S('offers'), armed = S('armed');
console.log(`  THE CHOICE`);
console.log(`    offers (two=true)                ${off}`);
console.log(`    - door shut, no place at all     ${S('doorShut')}   ${pc(S('doorShut'), off)}`);
console.log(`    - PLAZA_TWO coin lost            ${S('coinLost')}   ${pc(S('coinLost'), off - S('doorShut'))} of those that got to it`);
console.log(`    - no free place of another kind  ${S('altEmpty')}   ${pc(S('altEmpty'), off - S('doorShut') - S('coinLost'))} of those that got to it`);
console.log(`    = ARMED                          ${armed}   ${pc(armed, off)} of offers`);
console.log(`  THE GROUND`);
console.log(`    first stop MADE                  ${S('first')}   ${pc(S('first'), armed)} of armed`);
console.log(`    stop2 PROMOTED                   ${S('promoted')}   ${pc(S('promoted'), S('first'))} of first stops`);
console.log(`    second place STOOD AT            ${S('second')}   ${pc(S('second'), S('promoted'))} of promoted`);
console.log(`    = REACHED                        ${S('second')}   ${pc(S('second'), armed)} of armed`);
const merge = k => { const o = {}; for (const r of rows) for (const [a, v] of Object.entries(r[k])) o[a] = (o[a] || 0) + v; return o; };
console.log(`  cross-check, plaza-visit's own ARMED (any agent ever seen with a.stop2): ${S('xArmed')}`);
console.log('  ends: ' + JSON.stringify(merge('by')));
console.log('  first act kind, all armed: ' + JSON.stringify(merge('k1')) + '   reached: ' + JSON.stringify(merge('k1r')));
console.log('  per seed offers/armed/first/promoted/second: ' + rows.map(r => `${r.seed}:${r.offers}/${r.armed}/${r.first}/${r.promoted}/${r.second}`).join('  '));
const allCtx = rows.flatMap(r => r.ctx);
console.log('  DEATHS in context (up to 24):');
for (const c of allCtx.slice(0, 24)) console.log('    ' + JSON.stringify(c));
const cls = c => c.timer > 0 ? (c.raining ? 'sky: RAIN' : c.sky ? 'sky: LIFTS' : 'other early end') : (c.i >= c.wp ? 'ROUTE EXHAUSTED (a.i >= a.wp.length)' : 'unexplained');
const tal = {}; for (const c of allCtx) tal[cls(c)] = (tal[cls(c)] || 0) + 1;
console.log('  WHY the second act was skipped at the edge: ' + JSON.stringify(tal));
