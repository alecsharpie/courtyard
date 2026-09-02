#!/usr/bin/env node
/* #126 — how much colour does the desire line actually deliver, cell by cell?
 * Measures the RGB distance groundBase() moves for every paved cell at day N,
 * split by region, against the SAME cell drawn with paveWear zeroed. No screenshot:
 * this is the ramp itself, before the camera shrinks it.
 *   node probe-line.mjs [--days 12] [--seeds 7,42] [--show 0.62] [--full 0.45]
 */
import { homedir } from 'node:os';
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i < 0 ? d : argv[i + 1]; };
const SRC = resolve('courtyard.html'), DAYS = +arg('--days', 12);
const SEEDS = arg('--seeds', '7,42').split(',').map(Number);
const SHOW = arg('--show', null), FULL = arg('--full', null);
let FILE = SRC;
if (SHOW || FULL){
  let s = readFileSync(SRC, 'utf8');
  if (SHOW) s = s.replace(/PW_SHOW = [\d.]+/, `PW_SHOW = ${SHOW}`);
  if (FULL) s = s.replace(/PW_FULL = [\d.]+/, `PW_FULL = ${FULL}`);
  FILE = join(dirname(SRC), `.line-${process.pid}.html`); writeFileSync(FILE, s);
}
const RUN = (days) => `(() => {
  __reseed();
  while (day < ${days}) __warp(1);
  while (hour < 15) __warp(0.25);
  raining = false; wetness = 0; wetPainted = 0;
  const dE = (a, b) => { const p = c => c.match(/\\d+/g).map(Number);
    const A = p(a), B = p(b); return Math.hypot(A[0]-B[0], A[1]-B[1], A[2]-B[2]); };
  const rows = { plaza: [], quay: [], lane: [] };
  for (let y = 0; y < LN_WALK_S; y++) for (let x = 0; x < GW; x++){
    if (!pavedAt(x, y)) continue;
    const i = y*GW+x, w = paveWear[i], t = grid[i], hv = hash(x, y);
    const on = groundBase(x, y, t, hv, maturity());
    const save = paveWear[i]; paveWear[i] = 0;
    const off = groundBase(x, y, t, hv, maturity());
    paveWear[i] = save;
    const r = inPlaza(x,y) ? 'plaza' : inQuay(x,y) ? 'quay' : 'lane';
    rows[r].push([w, dE(on, off)]);
  }
  return { rows, consts: { PW_SHOW, PW_FULL, PW_TROD } };
})()`;
const browser = await chromium.launch();
const all = { plaza: [], quay: [], lane: [] }; let consts;
for (const seed of SEEDS){
  const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(pathToFileURL(FILE).href + `?seed=${seed}&pause`);
  await page.waitForFunction('typeof __warp === "function"');
  const r = await page.evaluate(RUN(DAYS));
  if (errs.length){ console.error('PAGE ERROR', errs[0]); process.exit(2); }
  consts = r.consts; for (const k of Object.keys(all)) all[k].push(...r.rows[k]);
  await page.close();
}
await browser.close(); if (FILE !== SRC) unlinkSync(FILE);
console.log('PW_SHOW', consts.PW_SHOW, '· PW_FULL', consts.PW_FULL, '· tone', consts.PW_TROD,
  '· day', DAYS, '· seeds', SEEDS.join(','), '\n');
console.log('region      cells   dE>2   dE>6  dE>12   dE>20    maxdE   meanW  (dE = RGB distance the line moves the cell)');
for (const k of ['plaza','quay','lane']){
  const a = all[k], d = a.map(v => v[1]);
  const c = t => d.filter(v => v > t).length;
  console.log('  ' + k.padEnd(8) + String(a.length).padStart(6)
    + String(c(2)).padStart(7) + String(c(6)).padStart(7) + String(c(12)).padStart(7) + String(c(20)).padStart(8)
    + Math.max(0,...d).toFixed(1).padStart(9)
    + (a.reduce((s,v)=>s+v[0],0)/a.length).toFixed(3).padStart(8));
}
