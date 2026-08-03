#!/usr/bin/env node
/* probe: the thirteen trees are draw-only, so the census is blind to every part of
 * this vector. Three questions it answers that a screenshot cannot:
 *
 *   1. ANCHOR NEUTRALITY — at SEASON_START (phase 0.25) is every new term EXACTLY the
 *      constant it replaced? leafOut 1, all tints 0, leafFallF 1. If so, day one is
 *      provably the old town and any later difference is the new range, not new algebra.
 *   2. THE CURVE — leafOut / fresh / deep / turn / shed / blossom / fruit sampled every
 *      quarter-day over a full year, so the shape is a number and not an opinion.
 *   3. THE PICTURE — the canopy's own pixel footprint, at the same hour in four seasons.
 *      filmstrip's Δ is a whole-frame mean and will be loud about the winter sky
 *      whatever the trees do, so this has to be measured tree-locally. A tree-cropped
 *      BOX does not work either: the linden stands against lawn and the orchard against
 *      the allotments, so the box floors at ~2500 green px of ground in every season and
 *      says winter is 57% as green as summer. So instead the frame is rendered twice —
 *      once normally, once with leafOut/blossomF/fruitF monkeypatched to 0 — and the
 *      pixels that DIFFER are the canopy, exactly, whatever is behind it. `?pause` sets
 *      dt=0 so windT and the sway are frozen and the two renders are otherwise identical.
 *      Plus mean airborne leaf population per season, the other half of the brief.
 *
 *   node canopy-year.mjs [pathToHtml] [label]
 */
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;

const FILE = resolve(process.argv[2] || fileURLToPath(new URL('../../../../courtyard.html', import.meta.url)));
const LABEL = process.argv[3] || 'HERE';
const PAGE = pathToFileURL(FILE).href;
const SEEDS = (process.env.SEEDS || '7,42,1234').split(',').map(Number);

const DAY = 55, YEAR = 26 * DAY;
const noon = d => d * DAY + 13.75;
/* Same hour (13.75), same maturity (all past day 8), season is the only axis that
 * moves. Days chosen from the phase, not by eye: 24 -> 0.183 (bud burst, the flush
 * and the blossom), 32 -> 0.490 (midsummer), 41 -> 0.837 (peak turn), 45 -> 0.990
 * (midwinter). */
const SEASONS = [
  { name: 'spring', t: noon(24) },
  { name: 'summer', t: noon(32) },
  { name: 'autumn', t: noon(41) },
  { name: 'winter', t: noon(45) },
];

const browser = await chromium.launch();
const fresh = async (seed, t) => {
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  await page.goto(`${PAGE}?pause&seed=${seed}&t=0`, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof window.__warp === 'function');
  if (t) await page.evaluate(w => { window.__reseed(); window.__warp(w); }, t);
  return { page, errs };
};

/* ---- 1. anchor neutrality, and the curve ---- */
const { page: p0, errs: e0 } = await fresh(7, 0);
const anchor = await p0.evaluate(() => ({
  season: season(), warmth,
  leafOut: leafOut(), leafFresh: leafFresh(), leafDeep: leafDeep(),
  leafTurn: leafTurn(), leafShed: leafShed(), leafFallF: leafFallF(),
  blossom: blossomF(), fruit: fruitF(),
  lindenCol: leafCol([76, 122, 62], 0), fallCol: leafCol([168, 133, 60], 0),
}));
const curve = await p0.evaluate(({ step, n }) => {
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push([+season().toFixed(4), +leafOut().toFixed(3), +leafFresh().toFixed(3),
              +leafDeep().toFixed(3), +leafTurn().toFixed(3), +leafShed().toFixed(3),
              +leafFallF().toFixed(3), +blossomF().toFixed(3), +fruitF().toFixed(3)]);
    window.__warp(step);
  }
  return out;
}, { step: DAY / 4, n: Math.round(YEAR / (DAY / 4)) + 1 });
await p0.close();
if (e0.length) { console.error('PAGE ERROR', e0[0]); process.exitCode = 1; }

console.log(`\n=== ${LABEL}  ${FILE} ===`);
console.log('\n1. ANCHOR (t=0, phase 0.25) — every term must equal the constant it replaced');
const EXPECT = { leafOut: 1, leafFresh: 0, leafDeep: 0, leafTurn: 0, leafShed: 0, leafFallF: 1, blossom: 0 };
let neutral = true;
for (const [k, want] of Object.entries(EXPECT)) {
  const got = anchor[k], ok = Math.abs(got - want) < 1e-9;
  if (!ok) neutral = false;
  console.log(`   ${ok ? 'ok  ' : 'FAIL'} ${k.padEnd(10)} ${got}  (want ${want})`);
}
const colOk = anchor.lindenCol === 'rgb(76,122,62)' && anchor.fallCol === 'rgb(168,133,60)';
if (!colOk) neutral = false;
console.log(`   ${colOk ? 'ok  ' : 'FAIL'} colours   linden ${anchor.lindenCol} / falling ${anchor.fallCol}`);
console.log(`   fruit ${anchor.fruit} (deliberately 0 — apples in April were the bug, not the baseline)`);
console.log(`   => day one is ${neutral ? 'PROVABLY the old town' : 'NOT neutral'}`);

console.log('\n2. THE CURVE over one year (quarter-day steps, every 4th row shown)');
console.log('   phase   out  fresh   deep   turn   shed   fall  bloss  fruit');
for (let i = 0; i < curve.length; i += 4) {
  const [ph, o, fr, dp, tn, sh, fa, bl, fu] = curve[i];
  const bar = '#'.repeat(Math.round(o * 20)).padEnd(20, '.');
  console.log(`   ${ph.toFixed(3)}  ${[o, fr, dp, tn, sh, fa, bl, fu].map(v => v.toFixed(2).padStart(5)).join('  ')}  ${bar}`);
}
const outs = curve.map(r => r[1]);
const bare = curve.filter(r => r[1] <= 0.02).length / curve.length;
const full = curve.filter(r => r[1] >= 0.98).length / curve.length;
console.log(`   leafOut range ${Math.min(...outs)}..${Math.max(...outs)} · bare ${(bare * 100).toFixed(0)}% of the year · full ${(full * 100).toFixed(0)}%`);
let maxStep = 0;
for (let i = 1; i < curve.length; i++) maxStep = Math.max(maxStep, Math.abs(curve[i][1] - curve[i - 1][1]));
console.log(`   largest leafOut step per quarter-day: ${maxStep.toFixed(3)} ${maxStep < 0.25 ? '(a ramp, not a switch)' : '(TOO STEEP — this will pop)'}`);

/* ---- 3. the picture: tree-cropped pixel counts, four seasons ---- */
console.log('\n3. THE PICTURE — the canopy\'s own footprint (render minus canopy-suppressed render)');
console.log('   region      season   green  amber  white    red   |  airborne leaves (mean/30s)');
const rows = [];
for (const s of SEASONS) {
  const acc = {};
  let leafPop = 0;
  for (const seed of SEEDS) {
    const { page, errs } = await fresh(seed, s.t);
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    const shot = await page.evaluate(async () => {
      /* boxes follow the town's own geometry via project(), so they track the trees
         instead of being hard-coded screen rectangles. They only bound the search —
         what is COUNTED is the difference, so a generous box costs nothing. */
      /* The box bottom is the TRUNK TOP, not a symmetric margin. drawLaneTree's ground
         shadow is scaled by leafOut too, so it lands in the diff — and over the
         allotments that shadow falls on green crop, which scored 1070 px of "green
         canopy" for the orchard in peak autumn and made four fully-turned trees read as
         half still green. Cutting at project(.., h*0.55) keeps every blob and excludes
         the ground. */
      const box = (px, py, h, r) => {
        const [cx, cy] = project(px, py, h);
        const [, ty] = project(px, py, h * 0.55);
        const top = cy - r * cellW * 1.5;
        return [cx - r * cellW * 1.6, top, r * cellW * 3.2, Math.max(6, ty - top)];
      };
      const groups = {
        linden: [box(CX, CY + 0.5, 5.6, 2.4)],
        street: TREE_PITS.map(x => box(x + 1, 66.9, 4.5, 1.9)),
        plaza: PLAZA_PITS.map(([x, y]) => box(x, y + 0.4, 4.5, 1.9)),
        orchard: ORCHARD.map(([x, y]) => box(x, y + 0.4, 3.6, 1.6)),
      };
      const c = document.getElementById('cv'), g = c.getContext('2d');
      const grab = () => {
        const o = {};
        for (const [name, boxes] of Object.entries(groups)) {
          o[name] = boxes.map(([x, y, w, h]) => {
            const X = Math.max(0, Math.round(x)), Y = Math.max(0, Math.round(y));
            const W = Math.min(c.width - X, Math.round(w)), H = Math.min(c.height - Y, Math.round(h));
            return W <= 0 || H <= 0 ? null : g.getImageData(X, Y, W, H).data;
          });
        }
        return o;
      };
      const settle = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      await settle();
      const A = grab();
      // suppress everything the season hangs in the crowns, redraw, grab again
      const keep = [leafOut, blossomF, fruitF];
      leafOut = () => 0; blossomF = () => 0; fruitF = () => 0;
      await settle();
      const B = grab();
      leafOut = keep[0]; blossomF = keep[1]; fruitF = keep[2];
      await settle();

      const out = {};
      for (const name of Object.keys(groups)) {
        let green = 0, amber = 0, white = 0, red = 0, gr = 0, gg2 = 0, gb = 0;
        for (let bi = 0; bi < A[name].length; bi++) {
          const a = A[name][bi], b = B[name][bi];
          if (!a || !b) continue;
          for (let i = 0; i < a.length; i += 4) {
            // a pixel the canopy owns: it changed when the canopy was taken away
            const d = Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
            if (d < 12) continue;
            /* classify by hue, and tightly — a first cut at `r>g+8 && r>b+30 && r>95`
               scored the STONE TREE PIT as autumn colour (107,90,68 passes all three),
               and the pit is inside the diff because the tree's shadow over it thins
               with the canopy. Turned leaf is r>g>b with a wide g-b; apple is r>>g with
               a narrow one; pit and trunk are neither. */
            const r = a[i], gg = a[i + 1], bb = a[i + 2];
            if (gg > r + 8 && gg > bb + 12) { green++; gr += r; gg2 += gg; gb += bb; }
            else if (r > gg + 60 && gg - bb < 40 && r > 120) red++;
            else if (r > gg + 20 && gg > bb + 25 && r > 130) amber++;
            else if (r > 180 && gg > 175) white++;
          }
        }
        out[name] = { green, amber, white, red,
          gmean: green ? [Math.round(gr/green), Math.round(gg2/green), Math.round(gb/green)] : null };
      }
      return out;
    });
    for (const [k, v] of Object.entries(shot)) {
      acc[k] = acc[k] || { green: 0, amber: 0, white: 0, red: 0, gmean: null };
      if (v.gmean) acc[k].gmean = v.gmean;
      for (const m of ['green', 'amber', 'white', 'red']) acc[k][m] += v[m];
    }
    // airborne leaves: mean population over 30 s of sim from this instant
    leafPop += await page.evaluate(() => {
      let sum = 0, n = 0;
      for (let i = 0; i < 120; i++) { window.__warp(0.25); sum += window.__census().life.leaves; n++; }
      return sum / n;
    });
    if (errs.length) { console.error(`seed ${seed} ${s.name}: PAGE ERROR`, errs[0]); process.exitCode = 1; }
    await page.close();
  }
  for (const k of Object.keys(acc)) {
    for (const m of ['green', 'amber', 'white', 'red']) acc[k][m] = Math.round(acc[k][m] / SEEDS.length);
  }
  rows.push({ season: s.name, acc, leaves: +(leafPop / SEEDS.length).toFixed(2) });
}
for (const name of ['linden', 'street', 'plaza', 'orchard']) {
  for (const r of rows) {
    const a = r.acc[name];
    console.log(`   ${name.padEnd(10)} ${r.season.padEnd(7)} ${String(a.green).padStart(6)} ${String(a.amber).padStart(6)} ${String(a.white).padStart(6)} ${String(a.red).padStart(6)}` +
      (a.gmean ? `  gmean ${a.gmean}` : '') + (name === 'linden' ? `   |  ${r.leaves}` : ''));
  }
}

const winter = rows.find(r => r.season === 'winter'), summer = rows.find(r => r.season === 'summer');
const autumn = rows.find(r => r.season === 'autumn'), spring = rows.find(r => r.season === 'spring');
const wGreen = Object.values(winter.acc).reduce((s, v) => s + v.green, 0);
const sGreen = Object.values(summer.acc).reduce((s, v) => s + v.green, 0);
const aAmber = Object.values(autumn.acc).reduce((s, v) => s + v.amber, 0);
const sAmber = Object.values(summer.acc).reduce((s, v) => s + v.amber, 0);
console.log('\n   VERDICT');
const checks = [
  ['winter has no full green canopy', wGreen < sGreen * 0.12, `${wGreen} vs summer ${sGreen} (${(100 * wGreen / sGreen).toFixed(1)}%)`],
  ['autumn is visibly turned', aAmber > sAmber * 2.5 && aAmber > 400, `${aAmber} amber vs summer ${sAmber}`],
  ['spring orchard is in blossom', spring.acc.orchard.white > 120, `${spring.acc.orchard.white} white px`],
  ['leaves fall in autumn, not midsummer', autumn.leaves > summer.leaves * 3, `autumn ${autumn.leaves} vs summer ${summer.leaves}`],
  ['anchor is neutral', neutral, ''],
];
let pass = true;
for (const [what, ok, note] of checks) { if (!ok) pass = false; console.log(`   ${ok ? 'PASS' : 'FAIL'}  ${what.padEnd(38)} ${note}`); }
console.log(`\n   ${pass ? 'PROBE PASS' : 'PROBE FAIL'}\n`);
if (!pass) process.exitCode = 1;

await browser.close();
