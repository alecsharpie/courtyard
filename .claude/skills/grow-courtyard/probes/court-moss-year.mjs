#!/usr/bin/env node
/* b212 — the build's two questions, one run, against a REF checkout of HEAD.
 *   A. IDENTITY: are the plaza's 730 cells and the quay's 130 byte-identical to HEAD?
 *      An order-sensitive checksum over each region, sampled at the same warped days at
 *      the same seeds. mossOwn[] is a mask; a third owner must not leak into either.
 *   B. THE COURTYARD'S YEAR: mean moss by season, split WALL BAND (dWall < WALL_H, the
 *      cells MOSS_WALL reaches) against OPEN COURT, and the ring's own desire lines —
 *      how much greener the unwalked flags are than the walked ones.
 * Usage: node probe-court-moss-year.mjs [pathToHtml] [label]
 */
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const FILE = resolve(process.argv[2] || fileURLToPath(new URL('./courtyard.html', import.meta.url)));
const LABEL = process.argv[3] || 'HERE';
const SEEDS = (process.env.SEEDS || '7,42,1234').split(',').map(Number);
const DAYS = (process.env.DAYS || '4,9,14,19,23,25,30,35,40,45,49,51').split(',').map(Number);

/* one sample. Every region is read off mossOwn[] where it exists and off the GRID where
 * it does not, so the same string runs on HEAD (two regions) and on the candidate. */
const SAMPLE = `(() => {
  const sum = (pred) => { let n=0,s=0,mossy=0,h=0,shel=0,top=0;
    for (let y=0;y<WH;y++) for (let x=0;x<GW;x++){ const i=y*GW+x; if(!pred(x,y,i)) continue;
      const v = moss[i]; n++; s+=v; shel+=mossShel[i]; top+=mossTop[i];
      h = (h*31 + Math.round(v*1e6)) % 2147483647;
      if (v > 1/MOSS_BUCKET) mossy++; }
    return {n, mean:+(s/(n||1)).toFixed(5), mossy, hash:h, shel:+(shel/(n||1)).toFixed(3), top:+(top/(n||1)).toFixed(3)}; };
  const hasCourt = typeof MOSS_COURT !== 'undefined';
  const inC = (x,y,i) => hasCourt ? mossOwn[i] === MOSS_COURT
                                  : (x>=3&&x<61&&y>=3&&y<61&&grid[i]===PATH);
  const wall = (x,y) => Math.min(x-3,60-x,y-3,60-y) < WALL_H;
  return {
    day, label: seasonLabel(), warmth:+warmth.toFixed(3),
    plaza: sum((x,y,i)=>inPlaza(x,y)),
    quay:  sum((x,y,i)=>inQuay(x,y)),
    court: sum(inC),
    courtWall: sum((x,y,i)=>inC(x,y,i) && wall(x,y)),
    courtOpen: sum((x,y,i)=>inC(x,y,i) && !wall(x,y)),
    censusMossy: __census().planting.mossy,
  };
})()`;

async function run(file){
  const b = await chromium.launch();
  const out = [];
  for (const seed of SEEDS){
    const page = await b.newPage({ viewport: { width: 1200, height: 720 } });
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto(pathToFileURL(resolve(file)).href + '?pause&seed=' + seed);
    await page.waitForFunction('typeof __warp === "function"');
    // ONE evaluate: reseed, then every warp and every sample inside it (quay-moss's law)
    const rows = await page.evaluate(([days, sample]) => {
      __reseed();
      const res = []; let at = 0;
      for (const d of days){ __warp(d * 55 - at); at = d * 55; res.push(eval(sample)); }
      return res;
    }, [DAYS, SAMPLE]);
    for (const r of rows) out.push({ seed, ...r });
    if (errs.length) console.log('  PAGE ERROR', errs[0]);
    await page.close();
  }
  await b.close();
  return out;
}

const here = await run(FILE);
const REF = process.env.REF;
console.log(`=== ${LABEL} ===`);
if (REF){
  const ref = await run(REF);
  let bad = 0;
  for (let i = 0; i < here.length; i++){
    for (const k of ['plaza', 'quay']){
      const a = ref[i][k], c = here[i][k];
      if (a.n !== c.n || a.hash !== c.hash || a.mossy !== c.mossy){
        bad++;
        console.log(`  DIFF ${k} seed ${here[i].seed} day ${here[i].day}: `
          + `n ${a.n}->${c.n} hash ${a.hash}->${c.hash} mossy ${a.mossy}->${c.mossy} mean ${a.mean}->${c.mean}`);
      }
    }
  }
  const r0 = ref[0], h0 = here[0];
  console.log(`A. IDENTITY vs ${REF}: plaza ${r0.plaza.n} cells + quay ${r0.quay.n} cells, `
    + `${here.length} samples (${SEEDS.length} seeds x ${DAYS.length} days) — `
    + (bad ? `${bad} DIFFER` : 'BYTE-IDENTICAL (order-sensitive checksum)'));
  console.log(`   census mossy: HEAD ${ref.map(r=>r.censusMossy).reduce((a,b)=>a+b,0)/ref.length|0} mean `
    + `-> ${here.map(r=>r.censusMossy).reduce((a,b)=>a+b,0)/here.length|0} mean (the courtyard is the whole gain)`);
}

console.log(`B. THE COURTYARD'S YEAR (${here[0].court.n} flags; wall band = within WALL_H of a range)`);
console.log(`   shelter mean: court ${here[0].court.shel} (wall ${here[0].courtWall.shel} / open ${here[0].courtOpen.shel})`
  + `  vs plaza ${here[0].plaza.shel} · ceiling mean: court ${here[0].court.top} vs plaza ${here[0].plaza.top}`);
const bySeason = {};
for (const r of here) (bySeason[r.label] ||= []).push(r);
const av = (v, f) => +(v.reduce((a, b) => a + f(b), 0) / v.length).toFixed(4);
console.log('   season            court   wall   open  |  plaza   quay  | court mossy');
for (const [k, v] of Object.entries(bySeason))
  console.log('   ' + k.padEnd(16)
    + String(av(v, r => r.court.mean)).padStart(6) + String(av(v, r => r.courtWall.mean)).padStart(7)
    + String(av(v, r => r.courtOpen.mean)).padStart(7) + '  |'
    + String(av(v, r => r.plaza.mean)).padStart(7) + String(av(v, r => r.quay.mean)).padStart(7) + '  |'
    + String(Math.round(av(v, r => r.court.mossy))).padStart(8));

/* C. the DESIRE LINES. MOSS_SCUFF is the only memory the flags have of feet, so the claim
 * "the ring stays stone" is a claim that moss falls with footfall. Warp to the spring
 * peak, then step finely for two days accumulating foot-seconds per cell, and bucket the
 * courtyard's flags by what they carried. */
{
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: 1200, height: 720 } });
  await page.goto(pathToFileURL(FILE).href + '?pause&seed=7');
  await page.waitForFunction('typeof __warp === "function"');
  const r = await page.evaluate(() => {
    __reseed();
    __warp(49 * 55);                                   // spring, the green peak
    const foot = new Float32Array(GW * WH);
    for (let i = 0; i < 2 * 55 / 0.25; i++){
      __warp(0.25);
      for (const a of agents){
        const gx = Math.round(a.x - .5), gy = Math.round(a.y - .5);
        if (gx < 0 || gy < 0 || gx >= GW || gy >= WH) continue;
        foot[gy * GW + gx] += (a.small ? 0.6 : 1) * 0.25;
      }
    }
    const hasCourt = typeof MOSS_COURT !== 'undefined';
    const cut = [0.001, 0.25, 1, 4], rows = cut.map(() => ({ n: 0, s: 0, mossy: 0 }));
    const none = { n: 0, s: 0, mossy: 0 };
    for (let y = 3; y < 61; y++) for (let x = 3; x < 61; x++){
      const i = y * GW + x;
      if (hasCourt ? mossOwn[i] !== MOSS_COURT : grid[i] !== PATH) continue;
      const f = foot[i];
      let t = none;
      for (let k = cut.length - 1; k >= 0; k--) if (f >= cut[k]){ t = rows[k]; break; }
      t.n++; t.s += moss[i]; if (moss[i] > 1 / MOSS_BUCKET) t.mossy++;
    }
    return { none, rows, cut, day, label: seasonLabel() };
  });
  await b.close();
  const f = (lbl, t) => console.log('   ' + lbl.padEnd(22) + String(t.n).padStart(5)
    + String((t.s / (t.n || 1)).toFixed(4)).padStart(9) + String((100 * t.mossy / (t.n || 1)).toFixed(0) + '%').padStart(8));
  console.log(`C. DESIRE LINES — day ${r.day} (${r.label}), two days of feet at 0.25 s`);
  console.log('   foot-seconds/cell     cells     moss   drawn green');
  f('untouched', r.none);
  r.rows.forEach((t, k) => f('>= ' + r.cut[k], t));
}
