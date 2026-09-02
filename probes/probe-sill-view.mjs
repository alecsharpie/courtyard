#!/usr/bin/env node
/* probe-sill-view.mjs — does what the town SAYS know where you are LOOKING?
 *
 * Parks the camera at each of the five quarters, runs the same seeded days, and
 * records every line that takes the ticker surface. Then classifies each line by
 * the PLACE it is about and asks whether that place is in the frame.
 *
 *   The classifier is measured, not hand-written: at Wide nothing is suppressed, so
 * wrapping sayAt() there learns (text -> cell) for every placed line the town can
 * say, and AMBIENT_PLACES supplies the ambient pool's own cells. Visibility is then
 * answered by ONE implementation — the candidate's inView() — applied to BOTH
 * builds' line lists, so the control tests a build-independent fact.
 *
 *   node probe-sill-view.mjs [--days 6] [--seeds 7,42,1234]
 */
import { homedir } from 'node:os';
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execSync } from 'node:child_process';

const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const DAYS = +arg('days', 6);
const SEEDS = arg('seeds', '7,42,1234').split(',').map(Number);
const CHUNK = 1.0;                      // sim seconds between ticker samples; a line holds >= TICK_DWELL 2.5
const QN = ['Wide', 'Courtyard', 'Street', 'Plaza', 'Far bank'];
const VIEW = { width: 1280, height: 700 };

const HEAD = '/tmp/probe-head-courtyard.html';
execSync(`git show HEAD:courtyard.html > ${HEAD}`);
const BUILDS = { head: HEAD, cand: process.cwd() + '/courtyard.html' };

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: VIEW, deviceScaleFactor: 1 });

async function run(file, seed, q, learn){
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  await page.goto(pathToFileURL(file).href + '?pause&seed=' + seed);
  await page.waitForFunction(() => typeof window.__warp === 'function');
  const out = await page.evaluate(({ q, n, chunk, learn }) => {
    const places = {};
    if (learn){                                     // wrap sayAt: forward every arg AND the return
      const _sayAt = sayAt;
      window.sayAt = function(...a){ places[a[2]] = [a[0], a[1]]; return _sayAt(...a); };
    }
    __reseed(); __setTime(0); __where(q);
    const lines = []; let last = tickerEl.textContent;
    for (let i = 0; i < n; i++){
      __warp(chunk);
      const t = tickerEl.textContent;
      if (t !== last){ lines.push({ t: +simT.toFixed(1), txt: t }); last = t; }
    }
    const amb = (typeof AMBIENT_PLACES !== 'undefined') ? AMBIENT_PLACES : [];
    return { lines, places, amb: amb.filter(a => a.x !== undefined).map(a => [a.t, a.x, a.y]) };
  }, { q, n: Math.round(DAYS * 55 / CHUNK), chunk: CHUNK, learn: !!learn });
  await page.close();
  if (errs.length) throw new Error('page error: ' + errs[0]);
  return out;
}

/* ---- 1. learn the map, on the candidate at Wide where nothing is suppressed ---- */
const PLACE = new Map(), SEEN = new Map();
for (const seed of SEEDS){
  const r = await run(BUILDS.cand, seed, 0, true);
  for (const [txt, xy] of Object.entries(r.places)){
    PLACE.set(txt, xy);
    if (!SEEN.has(txt)) SEEN.set(txt, new Set());
    SEEN.get(txt).add(Math.round(xy[0]) + ',' + Math.round(xy[1]));
  }
  for (const [txt, x, y] of r.amb) PLACE.set(txt, [x, y]);
}
/* A line whose subject WALKS ('a dog tows its human') has a different cell every time
 * it is said, and the map can only hold one of them — so for such a line the classifier
 * is guessing, and any off-frame it reports may be its own error rather than the
 * build's. MOBILE names them, and the table reports the residual with them held out. */
const MOBILE = new Set([...SEEN].filter(([, c]) => c.size > 1).map(([t]) => t));
console.log(`classifier: ${PLACE.size} lines carry a place, ${MOBILE.size} of them a MOVING one\n`);

/* ---- 2. one visibility oracle, the candidate's own inView(), for both builds ---- */
const oracle = await ctx.newPage();
await oracle.goto(pathToFileURL(BUILDS.cand).href + '?pause&seed=7');
await oracle.waitForFunction(() => typeof window.__where === 'function');
const VIS = [];
for (let q = 0; q < 5; q++){
  VIS[q] = new Set(await oracle.evaluate(({ q, pts }) => {
    __where(q);
    return pts.filter(p => inView(p[1], p[2])).map(p => p[0]);
  }, { q, pts: [...PLACE].map(([txt, xy]) => [txt, xy[0], xy[1]]) }));
}
await oracle.close();

/* ---- 3. park at each quarter on each build and count what is said ---- */
const res = {};
for (const b of ['head', 'cand']) for (let q = 0; q < 5; q++){
  let total = 0, here = 0, away = 0, none = 0, awayFix = 0, fix = 0; const subj = new Map(), said = new Map();
  for (const seed of SEEDS){
    const r = await run(BUILDS[b], seed, q);
    for (const L of r.lines){
      total++;
      if (!PLACE.has(L.txt)) { none++; continue; }
      const mob = MOBILE.has(L.txt);
      if (!mob) fix++;
      if (VIS[q].has(L.txt)) here++; else { away++; if (!mob) awayFix++; }
      said.set(L.txt, (said.get(L.txt) || 0) + 1);
      const xy = PLACE.get(L.txt);
      const k = region(xy[0], xy[1]);
      subj.set(k, (subj.get(k) || 0) + 1);
    }
  }
  res[b + q] = { total, here, away, none, subj, awayFix, fix, said };
  process.stderr.write(`  ${b} ${QN[q]} done\n`);
}
// a coarse label for the histogram — the probe's own reading of the map, not the town's
function region(x, y){
  if (y >= 64) return 'lane/roofs';
  if (x < 63.5) return 'courtyard';
  if (x < 98) return 'street/allotments';
  if (x < 122) return 'plaza/quay';
  return 'river/far bank';
}
await browser.close();

/* ---- 4. report ---- */
const pc = (a, b) => b ? (100 * a / b).toFixed(0).padStart(3) + '%' : '   –';
console.log(`${SEEDS.length} seeds x ${DAYS} sim days per quarter per build, ${VIEW.width}x${VIEW.height}\n`);
console.log('lines that took the ticker surface, by where their subject STANDS:\n');
console.log('quarter        build   lines   in frame      off frame     no place    off frame,\n' +
            '                                                                        FIXED subject only');
for (let q = 0; q < 5; q++){
  for (const b of ['head', 'cand']){
    const r = res[b + q];
    console.log(`${QN[q].padEnd(14)} ${b.padEnd(6)} ${String(r.total).padStart(5)}   ` +
      `${String(r.here).padStart(4)} ${pc(r.here, r.total)}    ${String(r.away).padStart(4)} ${pc(r.away, r.total)}    ${String(r.none).padStart(4)} ${pc(r.none, r.total)}   ` +
      `${String(r.awayFix).padStart(4)} of ${String(r.fix).padStart(4)}`);
  }
}
console.log('\nthe five lines each quarter says most (placed lines only):');
for (let q = 0; q < 5; q++){
  for (const b of ['head', 'cand']){
    const top = [...res[b + q].said].filter(([t]) => PLACE.has(t)).sort((a, c) => c[1] - a[1]).slice(0, 5);
    console.log(`  ${QN[q].padEnd(10)} ${b.padEnd(5)} ` + top.map(([t, c]) => `${c}x ${t.slice(0, 44)}`).join('\n                    '));
  }
}
console.log('\nwhat each quarter TALKS ABOUT (placed lines only):');
for (let q = 0; q < 5; q++){
  console.log(`\n  ${QN[q]}`);
  const all = new Set([...res['head' + q].subj.keys(), ...res['cand' + q].subj.keys()]);
  for (const k of [...all].sort()){
    const h = res['head' + q].subj.get(k) || 0, c = res['cand' + q].subj.get(k) || 0;
    console.log(`    ${k.padEnd(20)} head ${String(h).padStart(4)}   ->   cand ${String(c).padStart(4)}`);
  }
}
