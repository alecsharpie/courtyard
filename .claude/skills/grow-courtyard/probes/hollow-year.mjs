#!/usr/bin/env node
/* b127 gate: does the allotments' fog EXIST, does it reach exactly ZERO on the mornings
 * it should, and is the RIVER's mist bit-for-bit HEAD's on every one of them?
 * Runs the same sweep on two files, so the containment claim has a control it RAN.
 *   node probe-hollow.mjs [--seeds 7,42,1234] [--days 365] [--file courtyard.html] [--head <f>]
 */
import { homedir } from 'node:os';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i < 0 ? d : argv[i + 1]; };
const SRC = resolve(arg('--file', 'courtyard.html'));
const HEAD = arg('--head', null);
const SEEDS = arg('--seeds', '7,42,1234').split(',').map(Number);
const DAYS = +arg('--days', 365);
const STEP = arg('--step', '0.5');

const SWEEP = (days, step = STEP) => `(async () => {
  // A ?pause'd page still runs rAF (#126), and that live loop steps the sim and draws R()
  // on the WALL clock, concurrently with __warp. It put a 441/12060 nondeterminism floor
  // under this gate. Stop it, drain the frame already scheduled, and the sweep is driven by
  // __warp alone -- which is the only way a containment claim can mean anything.
  window.requestAnimationFrame = () => 0;
  await new Promise(r => setTimeout(r, 80));
  __reseed();                      // frames drawn at page load move the PRNG (#3): rewind it
  __setTime(0);
  const HAS = typeof hollowMist !== 'undefined';
  const MARKS = [-2.0, -1.6, -0.5, 0.5, 1.5, 2.5, 3.0, 3.5, 4.0, 4.5];   // hours rel. sunUp
  const rows = [];
  while (day < 1) __warp(1);                   // let the world settle; day 0 is a partial day
  const d0 = day;
  let cur = -1, rec = null, lastH = 0, lastT = 0;
  const push = () => { if (rec) rows.push(rec); };
  // A \`day\` index runs 06:00 -> 06:00 (hour = simT/DAY_LEN*24 + 6, mod 24), so it holds TWO
  // dawns: the tail of one morning and the pre-dawn of the next. Bucketing on it reads the
  // weather off one morning and the veil off the other. Key on the MORNING, boundary at noon.
  const mornId = () => Math.floor(simT / DAY_LEN - 0.25);
  while (day < d0 + ${days}){
    __warp(${step});
    const mid = mornId();
    if (mid !== cur){ push(); cur = mid;
      rec = { day: mid, mk: MARKS.map(() => null), maxH: 0, maxM: 0,
              open: null, ghDE: 0, ghMist: 0, peakH: 0, roseShut: 0, roseShut2: 0 }; }
    const h = hour - sunUp;
    if (h < -2.4 || h > 5) continue;
    const hol = HAS ? hollowMist : 0;
    if (hol > rec.maxH){
      rec.maxH = hol; rec.peakH = +h.toFixed(2);
      rec.ghMist = +mistAt(88).toFixed(4);
      // the pane A/B, in the SAME instant: what the glass is, against what it would be
      // with the hollow switched off. Nothing else in the world moves between the two.
      const a = cparse(ghPane(88)); const sv = hollowMist; hollowMist = 0;
      const b = cparse(ghPane(88)); hollowMist = sv;
      rec.ghDE = Math.round(Math.hypot(a[0]-b[0], a[1]-b[1], a[2]-b[2]));
    }
    if (mist > rec.maxM) rec.maxM = mist;
    // the invariant that actually matters: the veil must never RISE while the guard is shut
    // A rise needs hollowTarget() > hollowMist, so with the guard shut it is structurally
    // impossible. What survives at dt granularity is the WITHIN-STEP lag: stepMist runs
    // before the weather advances, so one sample can show a rise beside a target that has
    // just closed. The invariant with meaning is a SUSTAINED shut guard: shut at both ends.
    if (HAS){ const ht = hollowTarget();
      if (ht === 0 && hol > lastH + 1e-9){ rec.roseShut++; if (lastT === 0) rec.roseShut2++; }
      lastH = hol; lastT = ht; }
    for (let i = 0; i < MARKS.length; i++)
      if (rec.mk[i] === null && h >= MARKS[i])
        rec.mk[i] = [+hol.toFixed(4), +mist.toFixed(4)];
    if (rec.open === null && h >= -1.6)
      rec.open = [+windF().toFixed(3), +cloudCover().toFixed(3), +warmth.toFixed(3), raining?1:0];
  }
  push();
  const K = HAS ? { calm: HOL_CALM, clear: HOL_CLEAR, cold: HOL_COLD } : null;
  // what the WEST half reads: 0 on HEAD by construction, the whole point on the candidate
  let west = 0, riv = 0;
  for (let x = 60; x < 100; x++) west += mistAt(x);
  for (let x = 100; x < 135; x++) riv += mistAt(x);
  return { rows, HAS, K, probe: { west:+west.toFixed(4), riv:+riv.toFixed(4) } };
})()`;

const run = async (browser, file) => {
  const out = [];
  for (const seed of SEEDS){
    const page = await browser.newPage({ viewport: { width: 1280, height: 700 } });
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto(pathToFileURL(resolve(file)).href + `?seed=${seed}&pause`);
    await page.waitForFunction('typeof __warp === "function"');
    const r = await page.evaluate(SWEEP(DAYS));
    if (errs.length){ console.error('PAGE ERROR', file, errs[0]); process.exit(2); }
    out.push({ seed, ...r }); await page.close();
  }
  return out;
};

const browser = await chromium.launch();
const cand = await run(browser, SRC);
const head = HEAD ? await run(browser, HEAD) : null;
await browser.close();

const K = cand[0].K || { calm: NaN, clear: NaN, cold: NaN };  // a HEAD-vs-HEAD control has no guards
console.log('file:', SRC, '· seeds', SEEDS.join(','), '·', DAYS, 'days');
console.log('guards: HOL_CALM', K.calm, '· HOL_CLEAR', K.clear, '· HOL_COLD', K.cold, '\n');

// ---- A. does it fire, and how often ----
console.log('A. MORNINGS  (a "morning" = the scalar reached 0.5)');
console.log('  seed     days   hollow   river   both  hollowOnly  riverOnly   noneAtAll');
let allH = 0, allD = 0;
for (const r of cand){
  const H = r.rows.filter(x => x.maxH >= 0.5).length, M = r.rows.filter(x => x.maxM >= 0.5).length;
  const B = r.rows.filter(x => x.maxH >= 0.5 && x.maxM >= 0.5).length;
  allH += H; allD += r.rows.length;
  console.log('  ' + String(r.seed).padStart(5) + String(r.rows.length).padStart(9)
    + String(H).padStart(9) + String(M).padStart(8) + String(B).padStart(7)
    + String(H-B).padStart(12) + String(M-B).padStart(11)
    + String(r.rows.filter(x => x.maxH < 0.5 && x.maxM < 0.5).length).padStart(12));
}
console.log('  -> the hollow fogs on ' + (allH/allD*100).toFixed(1) + '% of days');

// ---- B. can it reach exactly zero, and does it obey its own guards ----
console.log('\nB. ZERO  (the veil must be able to be absent, and only where the guards allow)');
let viol = [], zero = 0, n = 0, warmDays = 0, warmFog = 0;
for (const r of cand) for (const x of r.rows){
  n++; if (x.maxH === 0) zero++;
  if (!x.open) continue;
  const [w, c, wa, rn] = x.open;
  if (wa >= K.cold){ warmDays++; if (x.maxH >= 0.5) warmFog++; }
  // a morning that OPENS outside every guard must never raise the veil at all
  if (x.maxH > 0 && (rn || w >= K.calm || c >= K.clear || wa >= K.cold)
      && x.mk[0] && x.mk[0][0] === 0) viol.push([r.seed, x.day, w, c, wa, rn, x.maxH]);
}
console.log('  days with hollowMist EXACTLY 0 all morning: ' + zero + '/' + n
  + '  (' + (zero/n*100).toFixed(1) + '%)');
console.log('  warm-season mornings (warmth >= HOL_COLD): ' + warmDays + ', of which fogged: ' + warmFog);
console.log('  mornings that opened shut and still raised a veil: ' + viol.length
  + (viol.length ? '  ' + JSON.stringify(viol.slice(0,4)) : '   <- the guard holds'));
const rose = cand.reduce((s,r) => s + r.rows.reduce((t,x) => t + (x.roseShut||0), 0), 0);
const rose2 = cand.reduce((s,r) => s + r.rows.reduce((t,x) => t + (x.roseShut2||0), 0), 0);
console.log('  rises beside a shut guard: ' + rose + ' (within-step lag)  ·  with the guard shut'
  + ' at BOTH ends of the step: ' + rose2
  + (rose2 ? '   <- LEAK' : '   <- none: a shut guard can only burn it off'));

// ---- C. does it THIN ----
const MARKS = [-2.0, -1.6, -0.5, 0.5, 1.5, 2.5, 3.0, 3.5, 4.0, 4.5];
console.log('\nC. SHAPE  (mean hollowMist at sunUp+h, on the ' +
  cand.reduce((s,r)=>s+r.rows.filter(x=>x.maxH>=0.9).length,0) + ' mornings it fogged fully)');
const prof = MARKS.map((_, i) => { const v = [];
  for (const r of cand) for (const x of r.rows) if (x.maxH >= 0.9 && x.mk[i]) v.push(x.mk[i][0]);
  return v.length ? v.reduce((s,q)=>s+q,0)/v.length : 0; });
console.log('  h    ' + MARKS.map(m => String(m).padStart(6)).join(''));
console.log('  hol  ' + prof.map(v => v.toFixed(2).padStart(6)).join(''));
const pk = Math.max(...prof), last = prof[prof.length-1];
console.log('  peak ' + pk.toFixed(2) + ' -> h+4.5 ' + last.toFixed(2)
  + (last < pk * 0.5 ? '   <- it burns off' : '   <- IT DOES NOT BURN OFF'));

// ---- D. the glasshouse: is the dead term alive ----
console.log('\nD. ghPane  (mistAt(88) at the hollow peak, and the pane A/B at that instant)');
const de = [], gm = [];
for (const r of cand) for (const x of r.rows) if (x.maxH >= 0.5){ de.push(x.ghDE); gm.push(x.ghMist); }
de.sort((a,b)=>a-b); gm.sort((a,b)=>a-b);
const q = (a,f) => a.length ? a[Math.min(a.length-1, Math.floor(f*a.length))] : 0;
console.log('  mistAt(88) on fogged mornings: min ' + q(gm,0) + '  p50 ' + q(gm,0.5) + '  max ' + q(gm,0.999));
console.log('  pane dE vs hollow-off:        min ' + q(de,0) + '  p50 ' + q(de,0.5) + '  max ' + q(de,0.999)
  + '   (dE 0 = the term is still dead)');
console.log('  mistAt summed over x: west 60..99 = ' + cand[0].probe.west
  + '  ·  river 100..134 = ' + cand[0].probe.riv + '  (at the sweep\'s end instant)');

// ---- E. CONTAINMENT: is the river HEAD's, morning for morning ----
if (head){
  console.log('\nE. CONTAINMENT vs HEAD  (the river scalar, every sample, every day)');
  let diff = 0, tot = 0, worst = 0, hWest = 0, unpaired = 0;
  for (let s = 0; s < SEEDS.length; s++){
    // pair on the morning's absolute id, not on position: a run that buckets one morning
    // differently shifts every later row and reports a total flip that never happened
    const B = new Map(head[s].rows.map(r => [r.day, r]));
    for (const a of cand[s].rows){
      const b = B.get(a.day); if (!b){ unpaired++; continue; }
      const d = Math.abs(a.maxM - b.maxM); tot++; if (d > 1e-9){ diff++; worst = Math.max(worst, d); }
      for (let k = 0; k < a.mk.length; k++){
        if (!a.mk[k] || !b.mk[k]) continue;
        const e = Math.abs(a.mk[k][1] - b.mk[k][1]); tot++;
        if (e > 1e-9){ diff++; worst = Math.max(worst, e); }
      }
    }
    hWest += head[s].probe.west;
  }
  if (unpaired) console.log('  unpaired mornings: ' + unpaired);
  console.log('  river-mist samples differing from HEAD: ' + diff + ' / ' + tot
    + (diff ? '   worst |d| = ' + worst.toExponential(2) : '   <- identical'));
  console.log('  HEAD mistAt summed west 60..99: ' + hWest.toFixed(4)
    + '   (0 = the dead term the brief describes)');
}
