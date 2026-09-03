#!/usr/bin/env node
/* #148 — the plaza's families, priced as RATE x VISIT before either is moved.
 *
 *   node probes/fam-window.mjs [--file f.html] [--seeds 7,42,1234,5] [--days 14]
 *        [--rate R] [--h0 H] [--h1 H] [--label name] [--json]
 *
 * Three things the census cannot say:
 *  (a) THE PRICE. leg-in + dwell + leg-out for each of the five plaza places, in HOURS,
 *      against the window's length. A place-holder whose visit outlasts its window makes
 *      arrivals/day ~ cap whatever the rate (LAW) — so the price is read BEFORE the sweep.
 *  (b) OCCUPANCY per PLACE, geometrically: a place is HELD when anyone stopped is within
 *      HOLD_R of it, family or lane visitor, because "held" is what a picture shows.
 *  (c) THE REFUSALS, clause by clause in the source's own order: no place free, or too
 *      late in the day. Instrumented AFTER __reseed() (which REASSIGNS globals) and
 *      asserted to have fired.
 */
import { homedir } from 'node:os';
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i < 0 ? d : argv[i + 1]; };
const SRC = resolve(arg('--file', 'courtyard.html'));
const SEEDS = arg('--seeds', '7,42,1234,5').split(',').map(Number);
const DAYS = +arg('--days', 14);
const K = { rate: arg('--rate', null), h0: arg('--h0', null), h1: arg('--h1', null), dwell: arg('--dwell', null), sun: arg('--famsun', null) };
const any = Object.values(K).some(v => v !== null);
const LABEL = arg('--label', any ? Object.entries(K).filter(([, v]) => v !== null).map(([k, v]) => `${k}=${v}`).join(' ') : 'as-built');

let FILE = SRC;
if (any){
  let src = readFileSync(SRC, 'utf8'); const before = src;
  const sub = (re, to) => { if (!re.test(src)){ console.error('rewrite matched nothing:', re); process.exit(2); } src = src.replace(re, to); };
  if (K.rate) sub(/FAM_RATE = [\d.]+/, `FAM_RATE = ${K.rate}`);
  if (K.h0)   sub(/FAM_H0 = [\d.]+/, `FAM_H0 = ${K.h0}`);
  if (K.h1)   sub(/FAM_H1 = [\d.]+/, `FAM_H1 = ${K.h1}`);
  if (K.sun) sub(/FAM_SUN = [\d.]+/, `FAM_SUN = ${K.sun}`);
  if (K.dwell) sub(/const durB = 9 \+ R\(\) \* 4, durS = 7 \+ R\(\) \* 3;/,
    `const durB = ${K.dwell} * (9 + R() * 4), durS = ${K.dwell} * (7 + R() * 3);`);
  if (src === before){ console.error('no rewrite applied'); process.exit(2); }
  FILE = join(dirname(SRC), `.fam-probe-${process.pid}.html`);
  writeFileSync(FILE, src);
}

const RUN = `(() => {
  const HOLD_R = 1.2;                    // a place is held by anyone stopped this near it
  const PLACES = PLAZA_BENCHES.map((b, i) => ({ k: 'bench' + i, x: b.x + 0.5, y: b.y + 1.0 }))
    .concat(FOUNT_STANDS.map((s, i) => ({ k: 'stand' + i, x: s.x, y: s.y })));

  /* (a) THE PRICE, read off the build's own pathHours at the build's own gate. */
  const SPD = 1.4 + 0.5 * 0.6;           // mean of 1.4 + R()*0.6
  const price = PLACES.map(p => {
    const legs = FAM_LEAD.concat([[p.x, p.y]]);
    const inH = FAM_WALK_MARGIN * pathHours(EAST_GATE_A[0], EAST_GATE_A[1], legs, SPD);
    const outH = pathHours(p.x, p.y, FAM_LEAD.slice().reverse().concat([EAST_GATE_A]), SPD);
    const dwell = p.k[0] === 'b' ? (9 + 13) / 2 : (7 + 10) / 2;    // seconds, from the spawn literals
    return { k: p.k, inH: +inH.toFixed(2), dwellH: +(dwell * HOURS_PER_S).toFixed(2),
             outH: +outH.toFixed(2), visitH: +(inH + dwell * HOURS_PER_S + outH).toFixed(2) };
  });

  __reseed();
  while (day < 1) __warp(1);

  /* (c) the refusals, wrapped AFTER the reseed */
  const ref = { calls: 0, spawned: 0, noplace: 0, toolate: 0 };
  const orig = window.spawnFamilyAgent;
  window.spawnFamilyAgent = function(){
    ref.calls++;
    const freeB = PLAZA_BENCHES.filter(b => !agents.some(o => o.pbench === b)).length;
    const freeS = FOUNT_STANDS.filter(s => !agents.some(o => o.fstand === s)).length;
    const n = agents.length;
    orig();
    if (agents.length > n) ref.spawned++;
    else if (freeB + freeS === 0) ref.noplace++;
    else ref.toolate++;
  };

  const d0 = day, out = [], visits = [], seen = new Map(), byKind = {};
  let clash = 0, claimed = 0;
  let openS = 0, capS = 0;
  while (day < d0 + ${DAYS}){
    __warp(1);
    const fams = agents.filter(a => a.fam && !a.famKid);
    for (const a of fams) if (!seen.has(a)) seen.set(a, { t: simT, h: hour, day });
    for (const [a, v] of seen) if (!agents.includes(a)){
      visits.push({ h0: +v.h.toFixed(2), lenH: +((simT - v.t) * HOURS_PER_S).toFixed(2) }); seen.delete(a);
    }
    const stopped = agents.filter(a => a.stopped && a.state !== 'walk');
    const occ = {};
    let doubled = 0;
    for (const p of PLACES){
      const on = stopped.filter(a => Math.hypot(a.x - p.x, a.y - p.y) < HOLD_R);
      occ[p.k] = on.length ? 1 : 0;
      /* TWO PARTIES ON ONE PLACE — what a reservation exists to stop. Companions are
       * excluded: a pair is one shape by design (PAIR_GAP). */
      const parties = on.filter(a => !on.some(o => o !== a && (a.with === o)));
      if (parties.length > 1) doubled++;
    }
    /* plaza crowding, PER PERSON: unrelated pairs inside PAIR_MIN, both in the plaza box */
    const inBox = agents.filter(a => a.x >= PLAZA_X0 && a.x < PLAZA_X1 && a.y >= 3 && a.y < 61);
    let over = 0, overFam = 0;
    for (let i = 0; i < inBox.length; i++) for (let j = i + 1; j < inBox.length; j++){
      const a = inBox[i], b = inBox[j];
      if (a.with === b || b.with === a) continue;
      if (Math.hypot(a.x - b.x, a.y - b.y) < PAIR_MIN){ over++; if (a.fam || b.fam) overFam++;
        const nm = o => o.famKid ? (o.run ? 'kidRun' : 'kid') : o.fam ? 'parent' : (o.kind || 'other');
        const key = [nm(a), nm(b)].sort().join('+'); byKind[key] = (byKind[key] || 0) + 1; }
    }
    /* the CLAIM itself: no two agents may ever hold the same bench or stand. This is the
     * thing a reservation IS, and it is separate from whether a third party stops nearby. */
    for (const b of PLAZA_BENCHES) if (agents.filter(o => o.pbench === b).length > 1) clash++;
    for (const t of FOUNT_STANDS) if (agents.filter(o => o.fstand === t).length > 1) clash++;
    for (const p of PLACES) claimed += (p.k[0] === 'b'
      ? agents.some(o => o.pbench && Math.hypot(o.pbench.x + 0.5 - p.x, o.pbench.y + 1.0 - p.y) < 0.01)
      : agents.some(o => o.fstand === FOUNT_STANDS[+p.k.slice(5)])) ? 1 : 0;
    const op = famOpen() ? 1 : 0; openS += op; if (op && famCount() >= FAM_CAP) capS++;
    out.push({ day, hour: +hour.toFixed(2), warmth: +warmth.toFixed(3), daylight: +daylight.toFixed(3),
      rain: raining ? 1 : 0, open: op, fam: famCount(), famAll: fams.length,
      occ, held: Object.values(occ).reduce((s, v) => s + v, 0),
      plaza: inBox.length, over, overFam, doubled, famBox: inBox.filter(a => a.fam).length });
  }
  return { price, samples: out, visits, ref, openS, capS, byKind, clash, claimed,
    K: { cap: FAM_CAP, rate: FAM_RATE, h0: FAM_H0, h1: FAM_H1, hps: HOURS_PER_S,
         roll: typeof FAM_ROLL === 'object' ? { open: +FAM_ROLL.open.toFixed(2), shut: +FAM_ROLL.shut.toFixed(2) } : null },
    keys: PLACES.map(p => p.k) };
})()`;

const browser = await chromium.launch();
const runs = [];
for (const seed of SEEDS){
  const page = await browser.newPage({ viewport: { width: 1280, height: 700 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(pathToFileURL(FILE).href + `?seed=${seed}&pause`);
  await page.waitForFunction('typeof __warp === "function"');
  const r = await page.evaluate(RUN);
  if (errs.length){ console.error('PAGE ERROR', errs[0]); process.exit(2); }
  runs.push({ seed, ...r });
  await page.close();
}
await browser.close();
if (FILE !== SRC) unlinkSync(FILE);

const R0 = runs[0];
const mean = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;
const f2 = x => x.toFixed(2), f1 = x => x.toFixed(1);
const all = runs.flatMap(r => r.samples);
const ref = runs.reduce((s, r) => ({ calls: s.calls + r.ref.calls, spawned: s.spawned + r.ref.spawned,
  noplace: s.noplace + r.ref.noplace, toolate: s.toolate + r.ref.toolate }), { calls: 0, spawned: 0, noplace: 0, toolate: 0 });
if (!ref.calls && +runs[0].K.rate > 0){ console.error('INSTRUMENT NEVER FIRED — the wrap was eaten'); process.exit(2); }
const SAFE = Math.max(1, ref.calls);
const visits = runs.flatMap(r => r.visits);
const K0 = R0.K, KEYS = R0.keys;

console.log(`\n=== fam-window  [${LABEL}]  ${SRC.split('/').pop()}  seeds ${SEEDS.join(',')} x ${DAYS} days, ${all.length} samples ===`);
console.log(`  cap ${K0.cap}  rate ${K0.rate}/s  window ${K0.h0}-${K0.h1} (${f2(K0.h1 - K0.h0)} h = ${f2((K0.h1 - K0.h0) / K0.hps)} s of sim)`);

console.log('\n-- (a) THE PRICE: rate x visit, in hours, before anything moves --');
for (const p of R0.price)
  console.log(`  ${p.k.padEnd(7)} leg-in ${f2(p.inH)}  dwell ${f2(p.dwellH)}  leg-out ${f2(p.outH)}  VISIT ${f2(p.visitH)} h`);
const visitH = mean(R0.price.map(p => p.visitH)), winH = K0.h1 - K0.h0;
const setoutH = Math.max(0, winH - visitH);
console.log(`  mean visit ${f2(visitH)} h vs window ${f2(winH)} h  ->  set-out span if the WHOLE visit must fit: ${f2(setoutH)} h`);
console.log(`  rolls in that span ${f1(setoutH / K0.hps)}  x rate ${K0.rate} = ${f2(setoutH / K0.hps * K0.rate)} arrivals  (cap ${K0.cap})`);
console.log(`  presence ceiling = arrivals x visit / window = ${f2(setoutH / K0.hps * K0.rate * visitH / winH)}`);
if (visits.length) console.log(`  MEASURED visit ${f2(mean(visits.map(v => v.lenH)))} h (n=${visits.length}), set-out hours ${f2(Math.min(...visits.map(v => v.h0)))}-${f2(Math.max(...visits.map(v => v.h0)))}`);

/* the comparison window is BUILD-INDEPENDENT on purpose: famOpen() means "the roll is
 * live", which is a different set of hours in every candidate, so selecting occupancy on
 * it grades each build over its own hours. A fine summer day, and the brief's afternoon,
 * are facts about the WEATHER. */
const FINE = s => s.warmth > 0.72 && !s.rain && s.daylight > 0.25;
const AFT = s => FINE(s) && s.hour >= 12 && s.hour < 17;
const DAYW = s => FINE(s) && s.hour >= 9 && s.hour < 19;
const OPEN = s => s.open;
const row = (name, sel) => {
  const S = all.filter(sel); if (!S.length) return console.log(`  ${name.padEnd(20)} (no samples)`);
  console.log(`  ${name.padEnd(20)} n=${String(S.length).padStart(4)}  fam ${f2(mean(S.map(s => s.fam)))}  held ${f2(mean(S.map(s => s.held)))}/5  ` +
    KEYS.map(k => `${k} ${f1(100 * mean(S.map(s => s.occ[k])))}%`).join(' '));
};
console.log('\n-- (b) OCCUPANCY: how often each place is HELD by anyone stopped --');
row('roll open', OPEN);
row('fine summer 9-19', DAYW);
row('fine summer 12-17', AFT);

console.log('\n-- (c) THE REFUSALS, in the source\'s own order --');
console.log(`  spawnFamilyAgent called ${ref.calls}  ->  spawned ${ref.spawned} (${f1(100 * ref.spawned / SAFE)}%)  ` +
  `no place ${ref.noplace} (${f1(100 * ref.noplace / SAFE)}%)  too late ${ref.toolate} (${f1(100 * ref.toolate / SAFE)}%)`);
const openS = runs.reduce((s, r) => s + r.openS, 0), capS = runs.reduce((s, r) => s + r.capS, 0);
console.log(`  window open ${openS} sample-seconds; FAM_CAP binds ${f1(100 * capS / Math.max(1, openS))}% of them`);
console.log(`  arrivals per open day ${f2(ref.spawned / (SEEDS.length * DAYS))}`);

const D = all.filter(DAYW);
const outJ = { label: LABEL, cap: K0.cap, rate: K0.rate, h0: K0.h0, h1: K0.h1,
  visitH: +f2(mean(visits.map(v => v.lenH)) || 0), arrivals: +f2(ref.spawned / (SEEDS.length * DAYS)),
  famFine: +f2(mean(D.map(s => s.fam))), heldFine: +f2(mean(D.map(s => s.held))),
  famAft: +f2(mean(all.filter(AFT).map(s => s.fam))), heldAft: +f2(mean(all.filter(AFT).map(s => s.held))),
  bind: +f1(100 * capS / Math.max(1, openS)),
  noplace: +f1(100 * ref.noplace / SAFE), toolate: +f1(100 * ref.toolate / SAFE) };
/* crowded pairs PER PERSON in the plaza box — #144's band, the thing that must not regress */
const P = all.filter(s => s.plaza > 0 && AFT(s));
outJ.crowdPP = +(mean(P.map(s => s.over)) / mean(P.map(s => s.plaza))).toFixed(3);
outJ.crowdFam = +(mean(P.map(s => s.overFam)) / Math.max(1e-9, mean(P.map(s => s.famBox)))).toFixed(3);
console.log(`\n-- CROWDING in the plaza box: pairs per person ${outJ.crowdPP}  (#144 band 0.145-0.159, HEAD-before-#144 0.282)`);
console.log(`  pairs with a FAMILY in them, per family in the box: ${outJ.crowdFam}`);
outJ.clash = runs.reduce((s, r) => s + r.clash, 0);
console.log(`  CLAIM: two agents holding one bench or stand, ever: ${outJ.clash}  (must be 0)`);
outJ.doubled = +f2(100 * mean(all.filter(AFT).map(s => s.doubled ? 1 : 0)));
console.log(`  a place with TWO parties on it: ${outJ.doubled}% of fine summer afternoons`);
{ const bk = {}; for (const r of runs) for (const k in r.byKind) bk[k] = (bk[k] || 0) + r.byKind[k];
  const tot = Object.values(bk).reduce((s, v) => s + v, 0) || 1;
  console.log('  by KIND (whole run, all hours): ' + Object.entries(bk).sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k} ${(100 * v / tot).toFixed(0)}%`).join('  ') + `   n=${tot}`); }
console.log(`  plaza people (fine summer 12-17) ${f2(mean(all.filter(AFT).map(s => s.plaza)))}  of them family ${f2(mean(all.filter(AFT).map(s => s.famBox)))}\n`);
if (argv.includes('--json')) console.log('JSON ' + JSON.stringify(outJ));
