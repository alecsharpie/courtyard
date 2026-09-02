#!/usr/bin/env node
/* #139 — how many ROWS does a gardener who knelt actually work, and what stops them?
 *
 *   node probes/gardener-rows.mjs [--seeds a,b,…] [--days 26] [--label name]
 *                                 [--set K=V,…] [--file courtyard.html]
 *
 * GARDEN_ROWS is 5 and GARDEN_MORE 0.8, so the continuation ROLL alone should give
 * E[rows] = 1 + .8 + .64 + .512 + .41 = 3.36. #129 measured 1.53. This finds out
 * which clause eats the difference, CLAUSE BY CLAUSE IN ITS OWN EVALUATION ORDER
 * (LAW: a refusal total says nothing about which clause to loosen).
 *
 * gardenerKneel's tail is three tests in this order:
 *      a.rows >= GARDEN_ROWS          -> 'cap'        (no draw: short-circuits)
 *   || R() >= GARDEN_MORE             -> 'moreRoll'   (one draw)
 *   then fit = EDGE_BEDS.filter(…)    -> 'lightFit'   (fit empty: two draws, no bed)
 *   else                                 'continued'
 * The probe reads the branch off the R() CALL COUNT inside the call plus a.tendBed
 * after it — no re-implementation of the predicate decides the attribution. The
 * cost DECOMPOSITION printed for a lightFit refusal IS a re-derivation, and is
 * labelled as the diagnostic it is; it sizes the fix, it does not attribute it.
 *
 * Also reported, because the brief's success bounds them:
 *   - rows per gardener VISIT (max a.rows over the agent's life), on a growing morning
 *   - whether the gardener was still holding a bed when lawnGone() went true
 *   - the lawn's other kinds counted AT THE CHOICE (spawnLawnAgent's outcome), not by
 *     presence, which weights a branch by its dwell
 */
import { homedir } from 'node:os';
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i < 0 ? d : argv[i + 1]; };
const SRC = resolve(arg('--file', 'courtyard.html'));
const SEEDS = arg('--seeds', '7,42,1234,5,99,404,777,31,2026,88').split(',').map(Number);
const DAYS = +arg('--days', 26);
const SET = argv.reduce((a, v, i) => (argv[i - 1] === '--set' ? a.concat(v.split(',')) : a), []);
const LABEL = arg('--label', SET.length ? SET.join(' ') : 'HEAD');
if (!existsSync(SRC)) { console.error('no such file', SRC); process.exit(2); }

let FILE = SRC;
if (SET.length){
  let src = readFileSync(SRC, 'utf8');
  for (const kv of SET){ const [k, v] = kv.split('='); const re = new RegExp(k + ' = [\\d.]+');
    if (!re.test(src)) { console.error('no such const', k); process.exit(2); } src = src.replace(re, `${k} = ${v}`); }
  FILE = join(dirname(SRC), `.gard-probe-${process.pid}.html`);
  writeFileSync(FILE, src);
}

const SWEEP = (days) => `(async () => {
  const kneels = [], visits = new Map(), choices = {};
  let pid = 0, stranded = 0, strandedSamples = 0;

  /* the lawn's other kinds AT THE CHOICE */
  const spawn0 = window.spawnLawnAgent;
  window.spawnLawnAgent = function(...w){ const n = agents.length; const r = spawn0(...w);
    if (agents.length > n){ const k = agents[agents.length - 1].kind; choices[k] = (choices[k] || 0) + 1; } return r; };

  /* every R() drawn INSIDE gardenerKneel, in order. INSTALLED AFTER __reseed(),
   * which reassigns R itself (makeR) and silently ate the first build of this probe. */
  let inK = 0, log = [];

  const gk0 = window.gardenerKneel;
  window.gardenerKneel = function(a){
    const hadDur = !!a.rowDur, rowsBefore = a.rows || 0, h0 = hour, x0 = a.x, y0 = a.y;
    inK = 1; log = [];
    gk0(a);
    inK = 0;
    const draws = log.length - (hadDur ? 0 : 1);      // drop the dur draw when it happened
    const reason = a.tendBed ? 'continued'
                 : draws <= 0 ? 'cap'
                 : draws === 1 ? 'moreRoll' : 'lightFit';
    const rec = { pid: a.__pid, day, hour: h0, rows: a.rows, rowsBefore, reason,
                  grow: growSeason() ? 1 : 0, warmth, le: lawnEnd(), ls: lawnStart() };
    /* DIAGNOSTIC ONLY (a re-derivation of the predicate, not the attribution): what the
     * cheapest legal continuation would have cost, and out of what. dur is a.timer,
     * which gardenerKneel has just set; nd is the draw after the more-roll. */
    if (reason === 'lightFit' || reason === 'continued'){
      const dur = a.timer, nd = GARDEN_ROW + log[log.length - (reason === 'continued' ? 2 : 1)] * GARDEN_ROW_R;
      const done = h0 + (dur + nd) * HOURS_PER_S;
      let best = Infinity, parts = null, nCand = 0, nFit = 0;
      for (const b of EDGE_BEDS){
        const d = Math.hypot(b.px - x0, b.py - y0);
        if (!(d > 1.2 && d < GARDEN_REACH)) continue;
        const sh = d / a.speed * HOURS_PER_S, dw = pathHours(b.px, b.py, [nearDoor(b.px, b.py).door], a.speed);
        nCand++; if (done + sh + dw < lawnEnd()) nFit++;
        if (done + sh + dw < best){ best = done + sh + dw; parts = { dur: dur * HOURS_PER_S, nd: nd * HOURS_PER_S, sh, dw, d }; }
      }
      rec.cost = best; rec.margin = best - lawnEnd(); rec.parts = parts;
      rec.nCand = nCand; rec.nFit = nFit;
      /* the room a TRUNCATED next row would have: everything but the row itself, at the
       * cheapest bed — this is what a fit-to-the-light continuation could still work */
      if (parts) rec.avail = lawnEnd() - (h0 + parts.dur + parts.sh + parts.dw);                       // how WIDE the reach draw is
      if (reason === 'continued') rec.tookD = Math.hypot(a.kneelAt[0] - x0, a.kneelAt[1] - y0);   // the shuffle actually drawn
    }
    kneels.push(rec);
  };

  __reseed();
  const R0 = R;
  R = function(){ const v = R0(); if (inK) log.push(v); return v; };
  while (day < 1) __warp(1);
  const d0 = day;
  while (day < d0 + ${days}){
    __warp(1);
    for (const a of agents){
      if (a.kind !== 'gardener') continue;
      if (a.__pid === undefined){ a.__pid = ++pid;
        visits.set(a.__pid, { seed: SEED, day, arrive: hour, hour, grow: growSeason() ? 1 : 0, warmth,
                              rows: 0, outAt: null, goneWhileHolding: 0, dawn: a.dawnWalk ? 1 : 0, ls: lawnStart(), le: lawnEnd() }); }
      const v = visits.get(a.__pid);
      v.rows = Math.max(v.rows, a.rows || 0);
      /* the zero-row visit: what state did it ever reach, and what was true when it
       * gave up? tendBed is the queued next bed; lawnClosed() is the stay-ending rule */
      if (a.state === 'kneel') v.knelt = 1;
      if (v.outAt === null){ v.lastState = a.state; v.lastHour = hour;
        v.closedNow = lawnClosed() ? 1 : 0; v.sunNow = lawnSun() ? 1 : 0;
        v.dToBed = a.kneelAt ? Math.hypot(a.x - a.kneelAt[0], a.y - a.kneelAt[1]) : -1; }
      if (a.lawnOut && v.outAt === null) v.outAt = hour;
      if (lawnGone() && !a.lawnOut){ v.goneWhileHolding = 1; stranded++; }
    }
    if (lawnGone()) strandedSamples++;
  }
  return { kneels, visits: [...visits.values()], choices, stranded, strandedSamples,
           rowsMax: GARDEN_ROWS, more: GARDEN_MORE, reach: GARDEN_REACH };
})()`;

const browser = await chromium.launch();
const runs = [];
for (const seed of SEEDS){
  const page = await browser.newPage({ viewport: { width: 1280, height: 700 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(pathToFileURL(FILE).href + `?seed=${seed}&pause`);
  await page.waitForFunction('typeof __warp === "function"');
  const r = await page.evaluate(SWEEP(DAYS));
  if (errs.length) { console.error('PAGE ERROR', errs[0]); process.exit(2); }
  runs.push({ seed, ...r });
  await page.close();
}
await browser.close();
if (FILE !== SRC) unlinkSync(FILE);

/* ---- report ---- */
const kn = runs.flatMap(r => r.kneels.map(k => ({ ...k, pid: r.seed + ':' + k.pid })));
const vis = runs.flatMap(r => r.visits);
const mean = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;
const f2 = x => x.toFixed(2);
const pct = (n, d) => d ? (100 * n / d).toFixed(1) + '%' : '—';

/* a MORNING as a share of the lawn's own window, never a hard-coded hour */
const MORN = s => s.hour < s.ls + (s.le - s.ls) * 0.4;
const GROW = s => s.grow;

console.log(`\n=== gardener-rows  [${LABEL}]  seeds ${SEEDS.join(',')} x ${DAYS} days ===`);
console.log(`  GARDEN_ROWS ${runs[0].rowsMax}  GARDEN_MORE ${runs[0].more}  GARDEN_REACH ${runs[0].reach}`);
console.log(`  roll-only expectation E[rows] = ${(() => { let e = 0, p = 1; for (let i = 1; i <= runs[0].rowsMax; i++){ e += p; p *= runs[0].more; } return e.toFixed(2); })()}`);

const visRow = (name, sel) => {
  const S = vis.filter(sel);
  const h = {}; for (const v of S) h[v.rows] = (h[v.rows] || 0) + 1;
  return `  ${name.padEnd(28)} n=${String(S.length).padStart(4)}  rows/visit ${f2(mean(S.map(v => v.rows)))}` +
         `   [${Array.from({ length: 6 }, (_, i) => `${i}:${h[i] || 0}`).join(' ')}]`;
};
console.log('\n-- rows per gardener VISIT --');
console.log(visRow('all visits', () => true));
console.log(visRow('growing-season', v => v.grow));
console.log(visRow('growing morning', v => v.grow && MORN(v)));
console.log(visRow('out of season', v => !v.grow));
console.log(visRow('growing, PRE-DAWN walk', v => v.grow && v.dawn));
console.log(visRow('growing, set out after sunUp', v => v.grow && !v.dawn));
{ const d = vis.filter(v => v.grow && v.dawn), n = vis.filter(v => v.grow && !v.dawn);
  console.log(`  arrive (agent spawned) at: pre-dawn walk ${f2(mean(d.map(v => v.arrive)))}h  ·  after sunUp ${f2(mean(n.map(v => v.arrive)))}h  ·  lawnStart ${f2(mean(vis.filter(v => v.grow).map(v => v.ls)))}h`); }

console.log('\n-- why a kneel did not continue (CLAUSE BY CLAUSE, evaluation order) --');
for (const set of [['all kneels', () => true], ['growing morning', s => GROW(s) && MORN(s)]]){
  const S = kn.filter(set[1]);
  const c = {}; for (const k of S) c[k.reason] = (c[k.reason] || 0) + 1;
  console.log(`  ${set[0].padEnd(18)} n=${String(S.length).padStart(4)}  ` +
    ['continued', 'moreRoll', 'lightFit', 'cap'].map(r => `${r} ${String(c[r] || 0).padStart(4)} (${pct(c[r] || 0, S.length)})`).join('  '));
}

const lf = kn.filter(k => k.reason === 'lightFit' && k.parts);
const co = kn.filter(k => k.reason === 'continued' && k.parts);
console.log('\n-- the light-fit refusals, priced (DIAGNOSTIC re-derivation) --');
if (lf.length){
  console.log(`  n=${lf.length}  refused at hour ${f2(mean(lf.map(k => k.hour)))}  lawnEnd ${f2(mean(lf.map(k => k.le)))}` +
              `  cheapest cost ${f2(mean(lf.map(k => k.cost)))}  OVER by ${f2(mean(lf.map(k => k.margin)))} h`);
  console.log(`  the four terms, hours: this row ${f2(mean(lf.map(k => k.parts.dur)))}  next row ${f2(mean(lf.map(k => k.parts.nd)))}` +
              `  shuffle ${f2(mean(lf.map(k => k.parts.sh)))}  walk to door ${f2(mean(lf.map(k => k.parts.dw)))}`);
  const h = {}; for (const k of lf) h[Math.round(k.hour)] = (h[Math.round(k.hour)] || 0) + 1;
  console.log('  refusal hour histogram: ' + Object.entries(h).sort((a, b) => a[0] - b[0]).map(([k, v]) => `${k}h:${v}`).join(' '));
  const wouldFit = t => lf.filter(k => k.cost - k.parts[t] < k.le).length;
  console.log(`  would fit if the DOOR walk were not charged: ${wouldFit('dw')}/${lf.length}` +
              `   if the SHUFFLE were not: ${wouldFit('sh')}/${lf.length}` +
              `   if THIS row were not: ${wouldFit('dur')}/${lf.length}`);
} else console.log('  none');
if (lf.length){
  const av = lf.map(k => k.avail);
  const bands = [0.5, 1.0, 1.5, 2.0, 2.5];
  console.log('  room left for a TRUNCATED next row (h): mean ' + f2(mean(av)) +
    '   ' + bands.map(b => `>${b}h ${lf.filter(k => k.avail > b).length}`).join('  ') + `  of ${lf.length}`);
  const g = lf.filter(k => k.grow);
  console.log('    growing season only (n=' + g.length + '): ' + bands.map(b => `>${b}h ${g.filter(k => k.avail > b).length}`).join('  '));
}
if (co.length) console.log(`  the REACH draw: ${f2(mean(co.map(k => k.nCand)))} beds within GARDEN_REACH, ${f2(mean(co.map(k => k.nFit)))} of them fit; the shuffle actually DRAWN ${f2(mean(co.map(k => k.tookD)))} cells (cheapest available ${f2(mean(co.map(k => k.parts.d)))})`);
if (co.length) console.log(`  (continuations that DID fit: n=${co.length}, spare ${f2(-mean(co.map(k => k.margin)))} h)`);

/* which population is the one-row visit? group the kneels by the VISIT they belong to */
const byPid = new Map(); for (const k of kn) { if (k.pid === undefined) continue; if (!byPid.has(k.pid)) byPid.set(k.pid, []); byPid.get(k.pid).push(k); }
console.log('\n-- the VISIT: first kneel, last kneel, and what ended it --');
for (const [nm, sel] of [['all', () => true], ['growing morning', v => v.grow && MORN(v)]]){
  const S = vis.filter(sel).map(v => byPid.get(v.__pid0)).filter(Boolean);
  void S;
}
{
  const rows = [];
  for (const [pid, ks] of byPid){
    ks.sort((a, b) => a.hour - b.hour);
    rows.push({ pid, n: ks.length, first: ks[0].hour, last: ks[ks.length - 1].hour,
                end: ks[ks.length - 1].reason, grow: ks[0].grow, ls: ks[0].ls, le: ks[0].le, hour: ks[0].hour });
  }
  const show = (nm, sel) => { const S = rows.filter(sel); if (!S.length) return console.log(`  ${nm.padEnd(22)} none`);
    const c = {}; for (const r of S) c[r.end] = (c[r.end] || 0) + 1;
    console.log(`  ${nm.padEnd(22)} n=${String(S.length).padStart(4)}  kneels/visit ${f2(mean(S.map(r => r.n)))}` +
      `  first kneel ${f2(mean(S.map(r => r.first)))}h (lawnStart ${f2(mean(S.map(r => r.ls)))})  ended by ` +
      ['moreRoll', 'lightFit', 'cap', 'continued'].map(k => `${k} ${c[k] || 0}`).join(' ')); };
  show('all visits', () => true);
  show('growing', r => r.grow);
  show('growing, 1 kneel', r => r.grow && r.n === 1);
  show('growing, 2+ kneels', r => r.grow && r.n >= 2);
  const g1 = rows.filter(r => r.grow && r.n === 1);
  const h = {}; for (const r of g1) h[Math.round(r.first)] = (h[Math.round(r.first)] || 0) + 1;
  console.log('  one-kneel visits, FIRST-kneel hour: ' + Object.entries(h).sort((a,b)=>a[0]-b[0]).map(([k,v])=>`${k}h:${v}`).join(' '));
  const ga = rows.filter(r => r.grow);
  const h2 = {}; for (const r of ga) h2[Math.round(r.first)] = (h2[Math.round(r.first)] || 0) + 1;
  console.log('  ALL growing visits,  FIRST-kneel hour: ' + Object.entries(h2).sort((a,b)=>a[0]-b[0]).map(([k,v])=>`${k}h:${v}`).join(' '));
}

console.log('\n-- the ZERO-row visit (never knelt): what ended it --');
{ const z = vis.filter(v => v.rows === 0);
  const g = (sel) => z.filter(sel).length;
  console.log(`  n=${z.length} of ${vis.length}   pre-dawn ${g(v => v.dawn)}  after sunUp ${g(v => !v.dawn)}   ever knelt ${g(v => v.knelt)}`);
  for (const v of z.slice(0, 12))
    console.log(`   dawn=${v.dawn} spawn ${f2(v.arrive)}h  lawnStart ${f2(v.ls)}  gave up ${f2(v.lastHour)}h state=${v.lastState}` +
                `  lawnClosed=${v.closedNow} lawnSun=${v.sunNow}  dist-to-bed ${f2(v.dToBed)}  out ${v.outAt === null ? '—' : f2(v.outAt)}`);
  const d1 = vis.filter(v => v.dawn && v.rows >= 1);
  console.log(`  pre-dawn visits that DID kneel: ${d1.length}, rows ${f2(mean(d1.map(v => v.rows)))}`);
}

console.log('\n-- the gardener still leaves before lawnGone() --');
console.log(`  visits still HOLDING a bed at a lawnGone() sample: ${vis.filter(v => v.goneWhileHolding).length}/${vis.length}` +
            `   (${runs.reduce((s, r) => s + r.stranded, 0)} samples of ${runs.reduce((s, r) => s + r.strandedSamples, 0)} gone-samples)`);
const outs = vis.filter(v => v.outAt !== null);
console.log(`  walked out: ${outs.length}/${vis.length}  mean out-hour ${f2(mean(outs.map(v => v.outAt)))}  latest ${f2(Math.max(0, ...outs.map(v => v.outAt)))}`);

console.log('\n-- the lawn AT THE CHOICE (spawnLawnAgent outcomes) --');
const ch = {}; for (const r of runs) for (const [k, v] of Object.entries(r.choices)) ch[k] = (ch[k] || 0) + v;
const tot = Object.values(ch).reduce((s, x) => s + x, 0);
console.log('  ' + Object.entries(ch).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v} (${pct(v, tot)})`).join('  ') + `   total ${tot}`);
console.log('');
