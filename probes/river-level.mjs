#!/usr/bin/env node
/* b192 — the waterline at the margin, as a CURVE.
 *
 * riverLev() is a lagged cosine and stepBank() cashes it against a per-cell bed height,
 * so the question this answers is not "does a strand exist" but "does the margin move
 * like a river's does": a winter maximum of bank under water, a LATE-summer minimum of
 * water over bed, nothing at all in between, and no cell crossing in a lump.
 *
 * Six seeds x one year (26 days), sampled 4x a day. Per sample: bankDry / bankLap off
 * __census().bank, the tile histogram, and every moving thing asked whether it is standing
 * on mud. stepBank() is WRAPPED after __reseed() (and asserted to have fired) so a flip is
 * counted at the tick it happens on, not inferred from two samples a day apart.
 *
 *   node probes/river-level.mjs [--seeds 7,42,...] [--file f.html]
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
const SEEDS = arg('--seeds', '7,42,1234,5,99,404').split(',').map(Number);
if (!existsSync(SRC)) { console.error('no such file', SRC); process.exit(2); }

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 700 } });
page.on('pageerror', e => { console.error('PAGE ERROR', e.message); process.exitCode = 1; });

const runs = [];
for (const seed of SEEDS){
  // PIN ?t=0: the default entry is a different world, ~2 s of un-reseeded sim in
  await page.goto(pathToFileURL(SRC).href + '?pause&seed=' + seed + '&t=0');
  await page.waitForFunction('window.__census !== undefined');
  runs.push(await page.evaluate(() => {
    __reseed();
    /* instrument AFTER the reseed, and assert it fired */
    const orig = stepBank;
    let calls = 0, maxFlip = 0, flipTicks = 0, badIce = 0;
    const before = new Uint8Array(BANK_CELLS.length);
    stepBank = function(){
      for (let k = 0; k < BANK_CELLS.length; k++) before[k] = grid[BANK_CELLS[k]];
      orig();
      let n = 0;
      for (let k = 0; k < BANK_CELLS.length; k++){
        const i = BANK_CELLS[k];
        if (grid[i] !== before[k]) n++;
        if (grid[i] === SHOAL && rice[i] >= ICE_SET) badIce++;   // ice and strand may never share a cell
      }
      calls++;
      if (n){ flipTicks++; if (n > maxFlip) maxFlip = n; }
    };

    const anchor = { lev: +riverLev().toFixed(4), dry: bankDry, lap: bankLap, margin: BANK_CELLS.length };
    const samples = [];
    let onMud = 0, mudKinds = {}, mudWhere = [], mirrorMiss = 0;
    const STEP = DAY_LEN / 4;
    for (let s = 0; s < 26 * 4; s++){
      __warp(STEP);
      const c = __census();
      // anything that MOVES, asked whether the cell under it is uncovered bed
      for (const e of __entities()){
        if (e.x == null || e.y == null) continue;
        if (onShoal(e.x, e.y)){
          onMud++; mudKinds[e.kind] = (mudKinds[e.kind] || 0) + 1;
          if (mudWhere.length < 12) mudWhere.push({ kind:e.kind, x:+e.x.toFixed(2), y:+e.y.toFixed(2), day, lev:+riverLev().toFixed(3) });
        }
      }
      // the mirror must be cut wherever the strand is: shoalRuns emits a run per stretch
      if (bankDry > 0){
        const g = { beginPath(){}, moveTo(){}, lineTo(){}, closePath(){}, fill(){} };
        if (shoalRuns(g) === 0) mirrorMiss++;
      }
      samples.push({ day: day, lev: +riverLev().toFixed(3), dry: bankDry, lap: bankLap,
                     shoal: c.tiles.SHOAL || 0, water: c.scalars.water,
                     green: c.scalars.green, developed: c.scalars.developed,
                     reed: c.tiles.REED || 0, ice: c.tiles.ICE || 0 });
    }
    return { anchor, samples, calls, maxFlip, flipTicks, badIce, onMud, mudKinds, mudWhere, mirrorMiss };
  }));
}
await browser.close();

/* ---------- report ---------- */
const fmt = n => String(n).padStart(5);
console.log('probe: river-level  ·  ' + SEEDS.length + ' seeds x 26 days, 4 samples/day  ·  ' + SRC);
console.log('');
const A = runs[0].anchor;
console.log('ANCHOR (SEASON_START, before a single tick): riverLev ' + A.lev +
            '  ·  shoal ' + A.dry + '  ·  lap ' + A.lap + '  ·  margin ' + A.margin + ' cells');

/* the curve, pooled by day over every seed */
console.log('\nTHE CURVE — pooled over ' + SEEDS.length + ' seeds, mean per day');
console.log(' day   lev    shoal    lap   |  water   green   developed');
const byDay = new Map();
for (const r of runs) for (const s of r.samples){
  const b = byDay.get(s.day) || { n:0, lev:0, dry:0, lap:0, water:0, green:0, dev:0 };
  b.n++; b.lev += s.lev; b.dry += s.dry; b.lap += s.lap;
  b.water += s.water; b.green += s.green; b.dev += s.developed;
  byDay.set(s.day, b);
}
const days = [...byDay.keys()].sort((a, b) => a - b);
for (const d of days){
  const b = byDay.get(d), m = k => b[k] / b.n;
  const bar = '#'.repeat(Math.round(m('dry') / 2)) + '~'.repeat(Math.round(m('lap') / 2));
  console.log(String(d).padStart(4) + '  ' + m('lev').toFixed(2).padStart(5) + fmt(m('dry').toFixed(1)) +
              fmt(m('lap').toFixed(1)) + '   | ' + fmt(Math.round(m('water'))) + fmt(Math.round(m('green'))) +
              fmt(Math.round(m('dev'))) + '  ' + bar);
}

/* is it a curve or a switch */
console.log('\nSHAPE');
for (const r of runs){
  const dry = r.samples.map(s => s.dry), lap = r.samples.map(s => s.lap);
  const nz = a => a.filter(v => v > 0).length;
  const lv = new Set(dry.filter(v => v > 0)), ll = new Set(lap.filter(v => v > 0));
  console.log('  seed: shoal max ' + Math.max(...dry) + ' over ' + nz(dry) + '/' + dry.length +
              ' samples, ' + lv.size + ' distinct non-zero levels  ·  lap max ' + Math.max(...lap) +
              ' over ' + nz(lap) + ', ' + ll.size + ' levels  ·  most cells flipped in ONE tick ' +
              r.maxFlip + ' (of ' + r.flipTicks + ' ticks that flipped anything, ' + r.calls + ' calls)');
}

/* days fully covered */
console.log('\nDAYS');
for (const r of runs){
  const per = new Map();
  for (const s of r.samples) per.set(s.day, Math.max(per.get(s.day) || 0, s.dry));
  const on = [...per.values()].filter(v => v > 0).length;
  const perL = new Map();
  for (const s of r.samples) perL.set(s.day, Math.max(perL.get(s.day) || 0, s.lap));
  const onL = [...perL.values()].filter(v => v > 0).length;
  console.log('  seed: strand uncovered on ' + on + '/' + per.size + ' days, exactly 0 on ' +
              (per.size - on) + '  ·  bank lapped on ' + onL + '/' + perL.size);
}

/* the guards */
console.log('\nGUARDS');
let bad = 0;
for (const r of runs){
  if (!r.calls){ console.log('  FAIL: stepBank wrapper never fired'); bad++; }
  if (r.badIce){ console.log('  FAIL: ' + r.badIce + ' cell-ticks were SHOAL and frozen at once'); bad++; }
  if (r.onMud){ console.log('  FAIL: ' + r.onMud + ' entity-samples stood on uncovered bed: ' + JSON.stringify(r.mudKinds) + '  ' + JSON.stringify(r.mudWhere)); bad++; }
  if (r.mirrorMiss){ console.log('  FAIL: ' + r.mirrorMiss + ' samples had a strand and no mirror cut'); bad++; }
}
const totEnt = runs.reduce((a, r) => a + r.onMud, 0);
console.log('  stepBank fired ' + runs.reduce((a, r) => a + r.calls, 0) + ' times across the run');
console.log('  boats / ducks / swans / walkers on uncovered bed: ' + totEnt);
console.log('  SHOAL and ICE on one cell: ' + runs.reduce((a, r) => a + r.badIce, 0));
console.log('  strand drawn but mirror not cut: ' + runs.reduce((a, r) => a + r.mirrorMiss, 0));
console.log(bad ? '\nVERDICT: FAIL' : '\nVERDICT: PASS');
process.exitCode = bad ? 1 : process.exitCode;
