#!/usr/bin/env node
/* b114 — two questions, one run.
 *   1. is the PLAZA's moss field bit-identical to HEAD? (the brief's hard constraint)
 *   2. does the quay's rail column end up greener than the column people walk?
 * Both builds are stepped through the same warped year at the same seeds. */
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const argv = process.argv.slice(2);
const arg=(k,d)=>{const i=argv.indexOf(k);return i<0?d:argv[i+1];};
const DAYS = (arg('--days','4,9,14,19,23,25')).split(',').map(Number);
const SEEDS = (arg('--seeds','7,42')).split(',').map(Number);

const SAMPLE = `(() => {
  // plaza: an order-sensitive checksum over every plaza cell, plus the raw count
  let pc = 0, psum = 0, ph = 0, pmossy = 0;
  for (let y = 3; y < 61; y++) for (let x = PLAZA_X0; x < PLAZA_X1; x++){
    if (!inPlaza(x, y)) continue;
    const v = moss[y * GW + x];
    pc++; psum += v; ph = (ph * 31 + Math.round(v * 1e6)) % 2147483647;
    if (v > 1 / MOSS_BUCKET) pmossy++;
  }
  // quay: per column, so 'against the rail' and 'the walked line' are separate numbers
  const col = {};
  for (let x = QUAY_X0; x < RIVER_X0; x++){
    let n = 0, sum = 0, mossy = 0, shel = 0, top = 0;
    for (let y = 0; y < LN_WALK_N; y++){
      const i = y * GW + x;
      if (typeof mossOwn === 'undefined' ? grid[i] !== SIDE : mossOwn[i] !== 2) continue;
      n++; sum += moss[i]; shel += mossShel[i]; top += mossTop[i];
      if (moss[i] > 1 / MOSS_BUCKET) mossy++;
    }
    col[x] = {n, mean:+(sum/(n||1)).toFixed(4), mossy, shel:+(shel/(n||1)).toFixed(3), top:+(top/(n||1)).toFixed(3)};
  }
  return {day, phase:+season().toFixed(3), label:seasonLabel(), warmth:+warmth.toFixed(3),
          plaza:{cells:pc, sum:+psum.toFixed(6), hash:ph, mossy:pmossy}, col,
          censusMossy: __census().planting.mossy};
})()`;

async function run(file){
  const b = await chromium.launch();
  const out = [];
  for (const seed of SEEDS){
    const page = await b.newPage({viewportSize:{width:1280,height:700}});
    await page.goto(pathToFileURL(resolve(file)).href + '?pause&seed=' + seed);
    await page.waitForFunction('typeof __warp === "function"');
    /* ONE evaluate: __reseed() first, then every warp and every sample inside it. The
     * renderer draws from the PRNG, so any rAF that lands between goto and a second
     * evaluate moves the stream by a wall-clock-dependent amount — which is what made
     * an earlier version of this probe report the plaza changed on seed 7 and not on
     * seed 42, from code that cannot depend on the seed at all. */
    const rows = await page.evaluate(([days, sample]) => {
      __reseed();
      const res = []; let at = 0;
      for (const d of days){ __warp(d * 55 - at); at = d * 55; res.push(eval(sample)); }
      return res;
    }, [DAYS, SAMPLE]);
    for (const r of rows) out.push({seed, ...r});
    await page.close();
  }
  await b.close();
  return out;
}
const [head, cand] = [await run('/tmp/head114.html'), await run('courtyard.html')];
let bad = 0;
console.log('seed day  | PLAZA head(cells/sum/hash/mossy)            vs cand                                   | same');
for (let i = 0; i < head.length; i++){
  const h = head[i], c = cand[i];
  const same = h.plaza.cells===c.plaza.cells && h.plaza.hash===c.plaza.hash && h.plaza.sum===c.plaza.sum && h.plaza.mossy===c.plaza.mossy;
  if (!same) bad++;
  console.log(`${h.seed}  ${String(h.day).padStart(3)} | ${h.plaza.cells}/${h.plaza.sum.toFixed(3)}/${h.plaza.hash}/${h.plaza.mossy}`.padEnd(58)
    + `| ${c.plaza.cells}/${c.plaza.sum.toFixed(3)}/${c.plaza.hash}/${c.plaza.mossy}`.padEnd(42) + `| ${same?'YES':'*** NO ***'}`);
}
console.log(`\nplaza bit-identical on ${head.length - bad}/${head.length} samples\n`);
console.log('QUAY (candidate) — col 112 = the walked line, col 113 = against the rail');
console.log('seed day phase warmth | 112 n/shel/top/mean/mossy      | 113 n/shel/top/mean/mossy      | mossy 113-112 | census mossy head->cand');
for (let i = 0; i < cand.length; i++){
  const c = cand[i], h = head[i];
  const a = c.col[112], b2 = c.col[113];
  console.log(`${c.seed} ${String(c.day).padStart(3)} ${c.phase.toFixed(2)}  ${c.warmth.toFixed(2)} | `
    + `${a.n}/${a.shel}/${a.top}/${a.mean}/${a.mossy}`.padEnd(30) + `| `
    + `${b2.n}/${b2.shel}/${b2.top}/${b2.mean}/${b2.mossy}`.padEnd(30) + `| ${String(b2.mossy - a.mossy).padStart(6)}        | ${h.censusMossy} -> ${c.censusMossy}`);
}
