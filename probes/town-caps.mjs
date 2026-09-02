#!/usr/bin/env node
/* #137 — presence per PLACE across whole days, and where each population cap stops binding.
 *
 *   node probe-town-caps.mjs [--seeds 7,42,1234] [--days 14] [--json]
 *                            [--cap-court K] [--cap-lane K] [--cap-east K] [--east-clamp C]
 *                            [--far N] [--eve N] [--fam N] [--label name]
 *
 * LAW: measure PRESENCE, not a per-instant crop. Every sim second of a whole run is
 * sampled, each person is put in exactly ONE place by position, and the caps are
 * recomputed the way the spawn block computes them so "at cap" is the sim's own
 * predicate and not a re-derivation.
 *
 * The knobs rewrite the cap EXPRESSIONS in a temp copy, so one probe sweeps both ways.
 * capacity / laneCap / eastCap are expressions, not consts: the swept number is the
 * DAYLIGHT HEADROOM coefficient, the only part of each that is not the night floor.
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
const SEEDS = arg('--seeds', '7,42,1234').split(',').map(Number);
const DAYS = +arg('--days', 14);
const K = { court: arg('--cap-court', null), lane: arg('--cap-lane', null), east: arg('--cap-east', null),
            eclamp: arg('--east-clamp', null), far: arg('--far', null), eve: arg('--eve', null), fam: arg('--fam', null) };
const any = Object.values(K).some(v => v !== null);
const LABEL = arg('--label', any ? Object.entries(K).filter(([, v]) => v !== null).map(([k, v]) => `${k}=${v}`).join(' ') : 'HEAD');

let FILE = SRC;
if (any){
  let src = readFileSync(SRC, 'utf8'); const before = src;
  const sub = (re, to) => { if (!re.test(src)){ console.error('rewrite matched nothing:', re); process.exit(2); } src = src.replace(re, to); };
  if (K.court)  sub(/const capacity = 2 \+ Math\.round\(maturity\(\) \* \(3 \+ [\d.]+ \*/, `const capacity = 2 + Math.round(maturity() * (3 + ${K.court} *`);
  if (K.lane)   sub(/const laneCap = 1 \+ Math\.round\(maturity\(\) \* \(1\.6 \+ [\d.]+ \*/, `const laneCap = 1 + Math.round(maturity() * (1.6 + ${K.lane} *`);
  if (K.east)   sub(/maturity\(\) \* [\d.]+ \* daylight \* yearBusy\(EX_EAST\)/, `maturity() * ${K.east} * daylight * yearBusy(EX_EAST)`);
  if (K.eclamp) sub(/const eastCap = Math\.min\([\d.]+,/, `const eastCap = Math.min(${K.eclamp},`);
  if (K.far)    sub(/const FAR_CAP = \d+/, `const FAR_CAP = ${K.far}`);
  if (K.eve)    sub(/const EVE_CAP = \d+/, `const EVE_CAP = ${K.eve}`);
  if (K.fam)    sub(/const FAM_CAP = \d+/, `const FAM_CAP = ${K.fam}`);
  if (src === before){ console.error('no rewrite applied'); process.exit(2); }
  FILE = join(dirname(SRC), `.caps-probe-${process.pid}.html`);
  writeFileSync(FILE, src);
}

/* One person is in exactly ONE place, decided by position, in this order. The names
 * are the town's own rooms; the bounds are the town's own constants. */
/* the lane's membership moved from a residual to a positive flag at #137: read which
 * definition the FILE under test actually uses, so one probe measures both builds. */
const SRCTXT = readFileSync(SRC, 'utf8');
const LANE_POSITIVE = /const laneCount = agents\.filter\(a => a\.lane\)/.test(SRCTXT);
/* LAW: read the value back off the build, never re-derive it. The three expression caps
 * are recomputed inside the page, so their coefficients must come from the FILE under
 * test — defaulting them to HEAD's numbers silently graded the candidate's counts against
 * the old ceilings and read court 84.8% binding where it actually binds 54.8%. */
const pull = (re, what) => { const m = SRCTXT.match(re); if (!m){ console.error('cannot read', what, 'out of', SRC); process.exit(2); } return m[1]; };
const SRCK = {
  court:  pull(/const capacity = 2 \+ Math\.round\(maturity\(\) \* \(3 \+ ([\d.]+) \*/, 'capacity'),
  lane:   pull(/const laneCap = 1 \+ Math\.round\(maturity\(\) \* \(1\.6 \+ ([\d.]+) \*/, 'laneCap'),
  east:   pull(/maturity\(\) \* ([\d.]+) \* daylight \* yearBusy\(EX_EAST\)/, 'eastCap'),
  eclamp: pull(/const eastCap = Math\.min\(([\d.]+),/, 'eastCap clamp'),
};
const SWEEP = (days) => `(async () => {
  const LANE_POSITIVE = ${LANE_POSITIVE};
  const PL = ['courtyard','nearCourt','crossSt','allot','plaza','quay','river','farBank','lane','bridge','south'];
  function placeOf(a){
    const x = a.x, y = a.y;
    if (y >= LN_WALK_S) return 'south';
    if (y >= LN_WALK_N) return (x >= RIVER_X0 && x < RIVER_X1) ? 'bridge' : 'lane';
    if (Math.max(Math.abs(x - CX), Math.abs(y - CY)) < 27.5) return 'courtyard';
    if (x < XS_W0) return 'nearCourt';
    if (x < XS_E1) return 'crossSt';
    if (x < DIV_X0) return 'allot';
    if (x < QUAY_X0) return 'plaza';
    if (x < RIVER_X0) return 'quay';
    if (x < 127.5) return 'river';
    return 'farBank';
  }
  __reseed();
  while (day < 1) __warp(1);
  const d0 = day, out = [];
  while (day < d0 + ${days}){
    __warp(1);
    const p = agents.filter(a => a.kind !== 'sweeper');
    const per = {}, ovr = {}; for (const k of PL){ per[k] = 0; ovr[k] = 0; }
    for (const a of p) per[placeOf(a)]++;
    /* CROWDING, the brief's "no place going from empty to crowded" gate. Two figures
     * nearer than PAIR_MIN render as one shape (LAW), so count the people whose nearest
     * OTHER person is inside it. A companion is excluded: makeCompanion seats it at
     * pairSeat 1.0 / PAIR_GAP 1.1 on purpose, so a pair is one shape by design. */
    let over = 0;
    for (let i = 0; i < p.length; i++) for (let j = i + 1; j < p.length; j++){
      const a = p[i], b = p[j];
      if (a.with === b || b.with === a) continue;
      if (Math.hypot(a.x - b.x, a.y - b.y) < PAIR_MIN){ over++; ovr[placeOf(a)]++; }
    }
    /* the caps, recomputed exactly as the spawn block does */
    const courtyardCount = agents.filter(a => !a.street && !a.lawn).length;
    const bandCount = agents.filter(a => a.band).length;
    const eastCount = agents.filter(a => a.east && !a.band).length;
    const tapNow = tapCount(), homeNow = homeCount();
    const eveNow = eveCount(), eveAll = eveNow + stayCount();
    const cafeAll = agents.filter(a => a.cafe).length;
    const famNow = famCount(), famAll = agents.filter(a => a.fam).length;
    const farNow = farCount();
    const laneCount = LANE_POSITIVE ? agents.filter(a => a.lane).length
      : agents.length - courtyardCount - eastCount - bandCount - tapNow - homeNow - cafeAll - eveAll - famAll - roundCount() - farNow;
    const capacity = 2 + Math.round(maturity() * (3 + ${K.court ?? SRCK.court} * daylight * yearBusy(EX_COURT)));
    const laneCap = 1 + Math.round(maturity() * (1.6 + ${K.lane ?? SRCK.lane} * daylight * yearBusy(EX_LANE)));
    const eastCap = Math.min(${K.eclamp ?? SRCK.eclamp}, 1 + Math.round(maturity() * ${K.east ?? SRCK.east} * daylight * yearBusy(EX_EAST)));
    out.push({ day, hour, warmth, daylight, rain: raining ? 1 : 0, town: p.length, per, ovr, over,
      c: { court: courtyardCount, lane: laneCount, east: eastCount, far: farNow, eve: eveNow, fam: famNow, lawn: lawnCount() },
      cap: { court: capacity, lane: laneCap, east: eastCap, far: FAR_CAP, eve: EVE_CAP, fam: FAM_CAP, lawn: LAWN_CAP },
      open: { far: farOpen()?1:0, east: eastOpen()?1:0, eve: eveOpen()?1:0, fam: famOpen()?1:0, lawn: lawnOpen()?1:0 } });
  }
  return { samples: out, caps: { far: FAR_CAP, eve: EVE_CAP, fam: FAM_CAP, lawn: LAWN_CAP } };
})()`;

const browser = await chromium.launch();
const runs = [];
for (const seed of SEEDS){
  const page = await browser.newPage({ viewport: { width: 1280, height: 700 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(pathToFileURL(FILE).href + `?seed=${seed}&pause`);
  await page.waitForFunction('typeof __warp === "function"');
  const r = await page.evaluate(SWEEP(DAYS));
  if (errs.length){ console.error('PAGE ERROR', errs[0]); process.exit(2); }
  runs.push({ seed, ...r });
  await page.close();
}
await browser.close();
if (FILE !== SRC) unlinkSync(FILE);

const all = runs.flatMap(r => r.samples);
const mean = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;
const f2 = x => x.toFixed(2);
const PL = ['courtyard','nearCourt','crossSt','allot','plaza','quay','river','farBank','lane','bridge','south'];
const DAYT = s => s.daylight > 0.25;
const DRY = s => !s.rain;

const table = (name, sel) => {
  const S = all.filter(sel); if (!S.length) return console.log(`  ${name.padEnd(22)} (no samples)`);
  console.log(`  ${name.padEnd(22)} n=${String(S.length).padStart(5)} town ${f2(mean(S.map(s => s.town))).padStart(5)}  ` +
    PL.map(k => `${k} ${f2(mean(S.map(s => s.per[k])))}`).join('  '));
};

const out = { label: LABEL, seeds: SEEDS, days: DAYS };
console.log(`\n=== town-caps  [${LABEL}]  seeds ${SEEDS.join(',')} x ${DAYS} days, ${all.length} samples ===`);
console.log('\n-- presence per PLACE (mean people in frame) --');
table('all hours', () => true);
table('daylight', DAYT);
table('daylight, dry', s => DAYT(s) && DRY(s));
table('summer day, dry', s => DAYT(s) && DRY(s) && s.warmth > 0.72);
table('winter day, dry', s => DAYT(s) && DRY(s) && s.warmth < 0.28);
table('night', s => !DAYT(s));

console.log('\n-- each cap: how often it BINDS (count >= cap), and the mean headroom --');
const KEYS = ['court','lane','east','far','eve','fam','lawn'];
const OPENSEL = { far: s => s.open.far, east: s => s.open.east, eve: s => s.open.eve, fam: s => s.open.fam, lawn: s => s.open.lawn,
                  court: () => true, lane: () => true };
for (const k of KEYS){
  const S = all.filter(OPENSEL[k]);
  const O = S.filter(DAYT);
  const bind = a => 100 * mean(a.map(s => s.c[k] >= s.cap[k] ? 1 : 0));
  const hist = {}; for (const s of S) hist[s.c[k]] = (hist[s.c[k]] || 0) + 1;
  const top = Object.keys(hist).map(Number).sort((a,b)=>a-b);
  console.log(`  ${k.padEnd(7)} cap ${String(all[0].cap[k]).padStart(2)}(peak ${Math.max(...all.map(s=>s.cap[k]))})  count mean ${f2(mean(S.map(s => s.c[k])))}` +
    `  BINDS ${bind(S).toFixed(1)}% of open  ${bind(O).toFixed(1)}% of open daylight  n=${S.length}` +
    `\n          hist ${top.map(v => `${v}:${(100*hist[v]/S.length).toFixed(0)}%`).join(' ')}`);
  out[k] = { count: +f2(mean(S.map(s => s.c[k]))), bindOpen: +bind(S).toFixed(1), bindDay: +bind(O).toFixed(1) };
}
const D = all.filter(s => DAYT(s) && DRY(s));
out.town = +f2(mean(D.map(s => s.town)));
out.places = Object.fromEntries(PL.map(k => [k, +f2(mean(D.map(s => s.per[k])))]));
out.over = +f2(mean(D.map(s => s.over)));
out.overs = Object.fromEntries(PL.map(k => [k, +f2(mean(D.map(s => s.ovr[k])))]));
console.log(`\n-- CROWDING: pairs of unrelated people closer than PAIR_MIN 0.9 (daylight, dry) --`);
console.log(`  total ${out.over}   ` + PL.filter(k => out.overs[k] > 0).map(k => `${k} ${out.overs[k]}`).join('  '));
console.log(`\n  TOWN (daylight, dry) mean ${out.town}`);
if (argv.includes('--json')) console.log('JSON ' + JSON.stringify(out));
