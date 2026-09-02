#!/usr/bin/env node
/* #121 — how many people are actually INSIDE the courtyard walls, over a whole year?
 *
 *   node probes/lawn-day.mjs [--seeds 7,42,1234] [--days 26]
 *                            [--cap N] [--rate R] [--sun S] [--label name] [--json]
 *
 * The courtyard is the town's namesake and its emptiest room. This measures PRESENCE
 * (LAW: presence, not a per-instant crop) inside the wall square — wallR() is
 * 27.5 / max(|cos|,|sin|), i.e. a square of half-width 27.5 about (CX, CY) — sampled
 * every sim second across a full SEASON_LEN year, per seed.
 *
 * Split three ways, because the brief's question is WHICH population is missing:
 *   lawn      the lawn's own source (a.lawn) — people who came here to do something
 *   transit   the ring's walkers passing THROUGH
 *   other     anyone else who happens to be inside the square
 * and the cap's own occupancy (lawnCount() vs LAWN_CAP) at every open sample, which
 * is the evidence for whether the CAP or the RATE is the binding lever.
 *
 * --cap/--rate/--sun rewrite the consts into a temp copy of the file, so the same
 * probe sweeps the levers both ways and reports the knee.
 */
import { homedir } from 'node:os';
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i < 0 ? d : argv[i + 1]; };
const SRC  = resolve(arg('--file', 'courtyard.html'));
const SEEDS = arg('--seeds', '7,42,1234').split(',').map(Number);
const DAYS = +arg('--days', 26);
const SET = argv.reduce((a, v, i) => (argv[i - 1] === '--set' ? a.concat(v.split(',')) : a), []);
const CAP  = arg('--cap', null), RATE = arg('--rate', null), SUN = arg('--sun', null);
const LABEL = arg('--label', CAP || RATE || SUN || SET.length ? `cap=${CAP ?? '-'} rate=${RATE ?? '-'} sun=${SUN ?? '-'} ${SET.join(' ')}` : 'HEAD');
if (!existsSync(SRC)) { console.error('no such file', SRC); process.exit(2); }

/* the variant, if any: one const line carries all three */
let FILE = SRC;
if (CAP || RATE || SUN || SET.length){
  let src = readFileSync(SRC, 'utf8');
  const before = src;
  if (CAP)  src = src.replace(/const LAWN_CAP = \d+(\.\d+)?/, `const LAWN_CAP = ${CAP}`);
  if (RATE) src = src.replace(/LAWN_RATE = [\d.]+/, `LAWN_RATE = ${RATE}`);
  if (SUN)  src = src.replace(/LAWN_SUN = [\d.]+/, `LAWN_SUN = ${SUN}`);
  for (const kv of SET){ const [k, v] = kv.split('='); const re = new RegExp(k + ' = [\\d.]+');
    if (!re.test(src)) { console.error('no such const', k); process.exit(2); } src = src.replace(re, `${k} = ${v}`); }
  if (src === before){ console.error('lever rewrite matched nothing — the const line moved'); process.exit(2); }
  FILE = join(dirname(SRC), `.lawn-probe-${process.pid}.html`);
  writeFileSync(FILE, src);
}

/* One seed, one year, sampled every sim second. Everything is aggregated inside the
 * page: the round trip is per seed, not per sample. */
const SWEEP = (days) => `(async () => {
  const IN = a => Math.max(Math.abs(a.x - CX), Math.abs(a.y - CY)) < 27.5;   // wallR()'s own square
  const people = () => agents.filter(a => a.kind !== 'sweeper');
  let arrivals = 0;
  const orig = window.spawnLawnAgent;
  window.spawnLawnAgent = function(){ const n = agents.length; orig(); if (agents.length > n) arrivals++; };
  const out = [];
  while (day < 1) __warp(1);                       // day 0 is the town filling; the lawn opens at day >= 1
  const d0 = day;
  while (day < d0 + ${days}){
    __warp(1);
    const p = people(), inw = p.filter(IN);
    const open = lawnOpen(), lc = lawnCount();
    out.push({ day, hour, warmth, daylight, rain: raining ? 1 : 0,
               town: p.length, inWall: inw.length,
               lawn: inw.filter(a => a.lawn).length,
               transit: inw.filter(a => !a.lawn && !a.street).length,
               grass: inw.filter(a => Math.hypot(a.x - CX, a.y - CY) < gR(Math.atan2(a.y - CY, a.x - CX))).length,
               other: inw.filter(a => !a.lawn && a.street).length,
               kinds: ['gardener','kid','napper','picnic','sitter'].map(k => inw.filter(a => a.lawn && a.kind === k).length),
               holds: lc, open: open ? 1 : 0, atCap: open && lc >= LAWN_CAP ? 1 : 0,
               win: (hour > lawnStart() && hour < lawnEnd()) ? 1 : 0 });
  }
  return { samples: out, arrivals, cap: LAWN_CAP, rate: LAWN_RATE, sun: LAWN_SUN };
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
const all = runs.flatMap(r => r.samples);
const mean = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;
const med  = a => { if (!a.length) return 0; const b = [...a].sort((x, y) => x - y); return b[b.length >> 1]; };
const f2 = x => x.toFixed(2);

const FINE = s => !s.rain && s.win;                       // the window, dry
const AFT  = s => s.hour >= 12 && s.hour < 17;
const SUMMER = s => s.warmth > 0.72, WINTER = s => s.warmth < 0.28;

const row = (name, sel) => {
  const S = all.filter(sel);
  if (!S.length) return `  ${name.padEnd(26)} —  (no samples)`;
  const iw = S.map(s => s.inWall);
  return `  ${name.padEnd(26)} n=${String(S.length).padStart(5)}  inWall ${f2(mean(iw))} (med ${med(iw)}, max ${Math.max(...iw)})` +
         `  lawn ${f2(mean(S.map(s => s.lawn)))}  transit ${f2(mean(S.map(s => s.transit)))}` +
         `  grass ${f2(mean(S.map(s => s.grass)))}  town ${f2(mean(S.map(s => s.town)))}` +
         `  share ${(100 * mean(iw) / Math.max(1e-9, mean(S.map(s => s.town)))).toFixed(1)}%`;
};

const open = all.filter(s => s.open);
const capOcc = open.map(s => s.holds), CAPV = runs[0].cap;
const hist = {}; for (const h of capOcc) hist[h] = (hist[h] || 0) + 1;

console.log(`\n=== lawn-day  [${LABEL}]  seeds ${SEEDS.join(',')} x ${DAYS} days, ${all.length} samples ===`);
console.log(`  LAWN_CAP ${runs[0].cap}  LAWN_RATE ${runs[0].rate}  LAWN_SUN ${runs[0].sun}`);
console.log('\n-- presence inside the wall (people, mean over samples) --');
console.log(row('all hours, all year', () => true));
console.log(row('the window, dry', FINE));
console.log(row('summer afternoon, dry', s => FINE(s) && AFT(s) && SUMMER(s)));
console.log(row('summer, dry, whole window', s => FINE(s) && SUMMER(s)));
console.log(row('winter, dry, whole window', s => FINE(s) && WINTER(s)));
console.log(row('wet, in the window', s => s.rain && s.win));
console.log(row('night (window shut)', s => !s.win));

console.log('\n-- the cap: lawnCount() at every OPEN sample --');
console.log('  ' + Array.from({ length: CAPV + 2 }, (_, i) => `${i}:${((100 * (hist[i] || 0)) / open.length).toFixed(1)}%`).join('  '));
console.log(`  at cap ${(100 * mean(open.map(s => s.atCap))).toFixed(1)}% of open samples   mean holders ${f2(mean(capOcc))}`);
const winOpen = all.filter(s => s.open && s.win && !s.rain);
console.log(`  at cap ${(100 * mean(winOpen.map(s => s.atCap))).toFixed(1)}% of DRY IN-WINDOW samples (n=${winOpen.length})`);
const KN = ['gardener','kid','napper','picnic','sitter'];
const kindRow = (name, sel) => { const S = all.filter(sel); if (!S.length) return;
  console.log('  ' + name.padEnd(26) + KN.map((k, i) => k + ' ' + f2(mean(S.map(s => s.kinds[i])))).join('  ')); };
console.log('\n-- who is inside, by kind (mean people) --');
kindRow('summer afternoon, dry', s => FINE(s) && AFT(s) && SUMMER(s));
kindRow('winter, dry, window', s => FINE(s) && WINTER(s));
console.log(`  arrivals ${runs.map(r => r.arrivals).join('/')} = ${f2(mean(runs.map(r => r.arrivals)) / DAYS)} per day per seed`);

if (argv.includes('--json')) console.log('\nJSON ' + JSON.stringify({ label: LABEL, runs: runs.map(r => ({ seed: r.seed, arrivals: r.arrivals })),
  fine: mean(all.filter(FINE).map(s => s.inWall)),
  summerAft: mean(all.filter(s => FINE(s) && AFT(s) && SUMMER(s)).map(s => s.inWall)),
  atCap: mean(winOpen.map(s => s.atCap)) }));
