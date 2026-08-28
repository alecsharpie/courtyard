#!/usr/bin/env node
/* probe: snowCover folded over the year — 0 outside winter, rising round phase 0,
 * max per-step movement, plus the light-bucket step of the cached ground. */
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const SEEDS = (process.env.SY_SEEDS || '1,7,13,29,42').split(',').map(Number);
const STEP = 0.25, DAY = 55, SEASON_LEN = 26, YEARS = +(process.env.SY_YEARS || 2), SPAN = DAY*SEASON_LEN*YEARS;
const BUCKETS = ['winter','spring','summer','autumn'];
const bucketOf = p => BUCKETS[Math.floor(((p + 0.125) % 1) * 4)];
const browser = await chromium.launch();
const B = {}; for (const b of BUCKETS) B[b] = { n:0, sum:0, on:0, max:0 };
let maxStep = 0, firstAt = [], flakes = 0, drops = 0, settles = 0;
const PH = new Array(52).fill(0), PN = new Array(52).fill(0);   // by half-week of phase
for (const seed of SEEDS){
  const page = await browser.newPage({ viewport: { width: 1200, height: 720 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(pathToFileURL(join(process.cwd(),'courtyard.html')).href + `?pause&seed=${seed}`, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof window.__warp === 'function');
  const out = await page.evaluate(({ step, span }) => {
    window.__reseed(); const out = []; let announced = 0;
    for (let t = 0; t < span; t += step){
      window.__warp(step); const c = window.__census();
      const nf = raining ? raindrops.filter(r => r.f < snowF()).length : 0;
      out.push([c.clock.season, c.clock.snow, snowF(), c.life.raindrops, nf, snowAnnounced ? 1 : 0]);
    }
    return out;
  }, { step: STEP, span: SPAN });
  await page.close();
  if (errs.length) console.log(`  ! page errors on seed ${seed}: ${errs[0]}`);
  let prev = 0, prevAnn = 0, first = null;
  for (const [ph, sn, sf, nd, nf, ann] of out){
    const b = B[bucketOf(ph)]; b.n++; b.sum += sn; if (sn > 0) b.on++; b.max = Math.max(b.max, sn);
    const i = Math.floor(ph*52); PH[i] += sn; PN[i]++;
    maxStep = Math.max(maxStep, Math.abs(sn - prev)); prev = sn;
    if (first === null && sn > 0) first = ph; drops += nd - nf; flakes += nf;
    if (ann && !prevAnn) settles++; prevAnn = ann;
  }
  firstAt.push(first);
}
await browser.close();
console.log(`${SEEDS.length} seeds x ${YEARS} years, ${STEP}s samples`);
console.log('bucket    mean-cover  on%   max');
for (const k of BUCKETS){ const b = B[k]; console.log(`${k.padEnd(9)} ${(b.sum/b.n).toFixed(3)}    ${(100*b.on/b.n).toFixed(1).padStart(5)}  ${b.max.toFixed(2)}`); }
console.log('by phase week (0 = midwinter, 13 = SEASON_START):');
console.log(PH.map((s,i)=> (s/(PN[i]||1)).toFixed(2)).join(' '));
console.log(`max |Δcover| per ${STEP}s step: ${maxStep.toFixed(4)}   first cover>0 at phase: ${firstAt.map(f=>f===null?'never':f.toFixed(3)).join(', ')}`);
console.log(`flake-samples ${flakes}  drop-samples ${drops}  settle announcements ${settles}`);
