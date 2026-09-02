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
  /* forward BOTH the argument and the return (#129). This wrapper used to call orig()
   * bare: it swallowed the scheduled source's forced kind and returned undefined, so the
   * latch that spends the morning never latched and the window re-fired every tick —
   * the probe was measuring a build that does not exist, at 10.4 arrivals/day. */
  window.spawnLawnAgent = function(...w){ const n = agents.length; const r = orig(...w); if (agents.length > n) arrivals++; return r; };
  const out = [];
  /* rewind the PRNG the page's own load frames already moved (#127): without this the
   * SAME build re-measures at a different offset and HEAD disagrees with itself —
   * gardener 0.61 vs 0.52 on a summer afternoon across two runs of one file. */
  __reseed();
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
               ls: lawnStart(), le: lawnEnd(), grow: growF() > dieF() ? 1 : 0,
               visitors: agents.filter(o => lawnHolds(o) && o.kind !== 'gardener').length,
               /* the gardener measured by POSITION, not by the wall square: 13 of the 204
                * EDGE_BEDS sit OUTSIDE wallR()'s half-width of 27.5 and they are the axis
                * beds nearest the doors, so inWall scores a gardener zero for working
                * exactly the border a near-door walk should take them to (#129). */
               gAny: agents.filter(a => a.kind === 'gardener').length,
               gWork: agents.filter(a => a.kind === 'gardener' && !a.lawnOut && a.kneelAt
                        && Math.hypot(a.x - a.kneelAt[0], a.y - a.kneelAt[1]) < 1.5).length,
               gKneel: agents.filter(a => a.kind === 'gardener' && a.state === 'kneel').length,
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
/* the beds' OWN growing season — growF() > dieF() is warmth > 0.5, the year's half in
 * which a bed gains more than it loses — and the MORNING as a share of the lawn's own
 * window, so neither selector is a hard-coded hour (#129) */
const GROW = s => s.grow;
const MORN = s => s.win && s.hour < s.ls + (s.le - s.ls) * 0.4;

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
console.log(row('growing-season morning, dry', s => !s.rain && GROW(s) && MORN(s)));
console.log(row('wet, in the window', s => s.rain && s.win));
console.log(row('night (window shut)', s => !s.win));

console.log('\n-- the cap: lawnCount() at every OPEN sample --');
console.log('  ' + Array.from({ length: CAPV + 2 }, (_, i) => `${i}:${((100 * (hist[i] || 0)) / open.length).toFixed(1)}%`).join('  '));
console.log(`  at cap ${(100 * mean(open.map(s => s.atCap))).toFixed(1)}% of open samples   mean holders ${f2(mean(capOcc))}`);
const winOpen = all.filter(s => s.open && s.win && !s.rain);
console.log(`  at cap ${(100 * mean(winOpen.map(s => s.atCap))).toFixed(1)}% of DRY IN-WINDOW samples (n=${winOpen.length})`);
const KN = ['gardener','kid','napper','picnic','sitter'];
/* "the lawn is busy" is a fact about the VISITORS, never about `holds` — the gardener is
 * one of the holders, so a busy/quiet split on `holds` is partly the subject measuring
 * itself, and on HEAD it read gardener 0.32 busy / 0.01 quiet out of that alone (#129). */
const LAWN_BUSY = Math.ceil(CAPV * 0.75);   // three quarters of the visitors' cap
const kindRow = (name, sel) => { const S = all.filter(sel); if (!S.length) return;
  console.log('  ' + name.padEnd(26) + KN.map((k, i) => k + ' ' + f2(mean(S.map(s => s.kinds[i])))).join('  ')); };
console.log('\n-- who is inside, by kind (mean people) --');
kindRow('summer afternoon, dry', s => FINE(s) && AFT(s) && SUMMER(s));
kindRow('winter, dry, window', s => FINE(s) && WINTER(s));
kindRow('growing morning, dry', s => !s.rain && GROW(s) && MORN(s));
kindRow('  … of it, lawn BUSY', s => !s.rain && GROW(s) && MORN(s) && s.visitors >= LAWN_BUSY);
kindRow('growing season, all window', s => FINE(s) && GROW(s));
kindRow('wet, in the window', s => s.rain && s.win);
/* the gardener is the subject: a scalar per slice, so a 3x claim is one number */
const gard = sel => { const S = all.filter(sel); return S.length ? mean(S.map(s => s.kinds[0])) : 0; };
console.log('\n-- the gardener alone (mean present) --');
const at = (k, sel) => { const S = all.filter(sel); return S.length ? mean(S.map(s => s[k])) : 0; };
console.log('  in the beds (at kneelAt, by position)   ' +
  [['growing morning', s => !s.rain && GROW(s) && MORN(s)],
   ['… lawn BUSY', s => !s.rain && GROW(s) && MORN(s) && s.visitors >= LAWN_BUSY],
   ['growing window', s => FINE(s) && GROW(s)],
   ['winter window', s => FINE(s) && WINTER(s)],
   ['wet window', s => s.rain && s.win]]
  .map(([n, sel]) => `${n} ${f2(at('gWork', sel))}`).join('  '));
console.log('  present anywhere                        ' +
  [['growing morning', s => !s.rain && GROW(s) && MORN(s)],
   ['… lawn BUSY', s => !s.rain && GROW(s) && MORN(s) && s.visitors >= LAWN_BUSY],
   ['growing window', s => FINE(s) && GROW(s)],
   ['winter window', s => FINE(s) && WINTER(s)],
   ['wet window', s => s.rain && s.win]]
  .map(([n, sel]) => `${n} ${f2(at('gAny', sel))}`).join('  '));
console.log(`  inside the wall square (the OLD ruler): growing morning ${f2(gard(s => !s.rain && GROW(s) && MORN(s)))}` +
            `   busy lawn ${f2(gard(s => !s.rain && GROW(s) && MORN(s) && s.visitors >= LAWN_BUSY))}` +
            `   quiet lawn ${f2(gard(s => !s.rain && GROW(s) && MORN(s) && s.visitors < LAWN_BUSY))}` +
            `   winter window ${f2(gard(s => FINE(s) && WINTER(s)))}` +
            `   wet window ${f2(gard(s => s.rain && s.win))}`);
console.log(`  arrivals ${runs.map(r => r.arrivals).join('/')} = ${f2(mean(runs.map(r => r.arrivals)) / DAYS)} per day per seed`);

if (argv.includes('--json')) console.log('\nJSON ' + JSON.stringify({ label: LABEL, runs: runs.map(r => ({ seed: r.seed, arrivals: r.arrivals })),
  fine: mean(all.filter(FINE).map(s => s.inWall)),
  summerAft: mean(all.filter(s => FINE(s) && AFT(s) && SUMMER(s)).map(s => s.inWall)),
  atCap: mean(winOpen.map(s => s.atCap)) }));
