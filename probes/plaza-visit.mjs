#!/usr/bin/env node
/* #160 — does the widened door actually get WALKED? Counts, over whole days:
 *   - second acts ARMED at the choice vs REACHED on the ground (a stop2 that became a stop
 *     and then a stopped agent at that place),
 *   - how many of the fourteen places are ever used, and the spread of the people who are
 *     stopped in the square (the y sd of a stopped visitor, which is the "ranked along one
 *     arc" complaint made numeric),
 *   - and whether a pigeon comes to somebody scattering crumbs. */
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
const b = await chromium.launch();
const rows = [];
for (const seed of SEEDS){
  const page = await b.newPage({ viewport: { width: 1280, height: 700 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(pathToFileURL(SRC).href + `?seed=${seed}&pause`);
  await page.waitForFunction('typeof __warp === "function"');
  const r = await page.evaluate(`(() => {
    __reseed();
    /* the same three questions on either build: #160's claim is a.stop.place over
     * PLAZA_PLACES, HEAD's was a.fstand / a.pbench over two arrays. */
    const P160 = typeof PLAZA_PLACES !== 'undefined';
    const PLACES = P160 ? PLAZA_PLACES : FOUNT_STANDS.concat(PLAZA_BENCHES);
    const placeOf = a => P160 ? (a.stop && a.stop.place) : (a.fstand || a.pbench);
    const seen = new Map();            // agent -> Set of places it has actually STOOD/SAT at
    const armed = new Set();           // agents that were given a second act
    const used = new Set();
    let birdNearFeeder = 0, feederSamples = 0, birdNearOther = 0, otherSamples = 0;
    const ys = [];
    while (day < 1) __warp(1);
    const d0 = day;
    while (day < d0 + ${DAYS}){
      __warp(0.25);
      for (const a of agents){
        if (a.stop2) armed.add(a);
        const p = a.stopped && a.state !== 'walk' ? placeOf(a) : null;
        if (!p) continue;
        if (!seen.has(a)) seen.set(a, new Set());
        seen.get(a).add(p); used.add(p);
        ys.push(a.y);
        const near = birds.filter(q => q.plaza && birdDown(q) && Math.hypot(q.x - a.x, q.y - a.y) < 3.0).length;
        if (p.crumbs){ feederSamples++; birdNearFeeder += near; } else { otherSamples++; birdNearOther += near; }
        void 0;
      }
    }
    let reached = 0, visits = 0;
    for (const [, s] of seen){ visits++; if (s.size > 1) reached++; }
    const m = ys.reduce((s,v)=>s+v,0) / (ys.length || 1);
    return { visits, armed: armed.size, reached, used: used.size,
             build: P160 ? '#160' : 'HEAD', places: PLACES.length,
             ysd: +Math.sqrt(ys.map(v=>(v-m)**2).reduce((s,v)=>s+v,0)/(ys.length||1)).toFixed(2),
             ymean: +m.toFixed(2), n: ys.length,
             feeder: feederSamples ? +(birdNearFeeder/feederSamples).toFixed(3) : null,
             other: otherSamples ? +(birdNearOther/otherSamples).toFixed(3) : null,
             feederSamples, otherSamples };
  })()`);
  if (errs.length){ console.error('PAGE ERROR', errs[0]); process.exit(2); }
  rows.push({ seed, ...r });
  await page.close();
}
await b.close();
const S = k => rows.reduce((s, r) => s + (r[k] || 0), 0);
const M = k => +(rows.reduce((s, r) => s + (r[k] || 0), 0) / rows.length).toFixed(2);
console.log(`\n=== plaza-visit  ${SEEDS.length} seeds x ${DAYS} days   [${SRC.split('/').pop()}] ===`);
console.log(`  visits that reached a place        ${S('visits')}`);
console.log(`  second acts ARMED / REACHED        ${S('armed')} / ${S('reached')}`);
console.log(`  places ever used                   ${M('used')} of ${rows[0].places}`);
console.log(`  stopped visitors: mean y ${M('ymean')}  sd ${M('ysd')}   (n ${S('n')} person-samples)`);
console.log(`  pigeons within 3.0 cells: at a crumbs place ${M('feeder')} (n ${S('feederSamples')})   at any other ${M('other')} (n ${S('otherSamples')})`);
console.log('  per seed  visits/armed/reached/used: ' + rows.map(r => `${r.seed}:${r.visits}/${r.armed}/${r.reached}/${r.used}`).join('  '));
