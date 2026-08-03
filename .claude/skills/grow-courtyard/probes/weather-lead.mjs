/* weather-lead.mjs — does the town prepare BEFORE the rain, and does it cost anything?
 *
 * Sweeps many seeds on both HEAD and the working tree, sampling the standing population
 * *conditioned on the sky*. A census diff cannot answer this: it samples nine fixed
 * (seed, time) cells, so one cell happening to rain moves `people` by 12% and looks
 * exactly like a regression. Split by cloud band instead — if the town only thins under
 * heavy cover, that is a weather feature; if it thins under a blue sky, it is a bug.
 * Also measures the LEAD: sim seconds from the first sign of preparation to the first drop.
 *
 * Needs a HEAD copy to compare against:
 *     git show HEAD:courtyard.html > /tmp/head-courtyard.html
 *
 * Written for #6 (weatherComing). Re-point the `wash` lambda if the draw changes.
 */
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const { chromium } = (await import(pathToFileURL(
  join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js')).href)).default;

const SEEDS = [1, 5, 7, 9, 11, 13, 17, 19, 23, 29, 31, 37, 42, 47, 55, 59, 63, 67, 71, 73];
const STEP = 0.5, SPAN = 440;          // 8 days at 55 s/day — showers are rare, so sweep wide

async function sweep(page, file, seed){
  await page.goto(pathToFileURL(file).href + '?pause&seed=' + seed);
  await page.waitForFunction(() => typeof window.__warp === 'function');
  return page.evaluate(async ({ STEP, SPAN }) => {
    window.__reseed();
    const rows = [];
    for (let t = 0; t < SPAN; t += STEP){
      window.__warp(STEP);
      const c = window.__census();
      rows.push({
        t: +c.clock.simT.toFixed(2),
        cloud: c.clock.cloud,
        rain: c.clock.raining ? 1 : 0,
        daylight: +(typeof daylight === 'number' ? daylight : 0).toFixed(3),
        people: c.life.people,
        street: c.life.onStreet,
        sitting: agents.filter(a => a.state === 'sit').length,
        streetSit: agents.filter(a => a.street && a.state === 'sit').length,
        umb: agents.filter(a => a.umbrella).length,
        // the washing, counted the way the draw counts it
        wash: (function(){
          if (!(day >= 3 && hash(day, 55) < 0.6)) return -1;
          if (typeof weatherComing !== 'function') return daylight > 0.15 && !raining ? 10 : 0;
          if (!(daylight > 0.06)) return 0;
          const ti = Math.max(weatherComing(), Math.max(0, Math.min(1, (0.34 - daylight) / 0.19)));
          let n = 0;
          for (const [, sd] of [[15, 1], [87, 2]])
            for (let k = 0; k < 5; k++)
              n += Math.max(0, Math.min(1, (0.16 + hash(k + sd, day + 7) * 0.66 - ti) / 0.14));
          return +n.toFixed(2);
        })(),
      });
    }
    return rows;
  }, { STEP, SPAN });
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 760 } });
const out = {}, runs = {};                 // runs: per-seed, so no cross-seed comparisons
for (const [label, file] of [['HEAD', '/tmp/head-courtyard.html'],
                             ['WORK', process.cwd() + '/courtyard.html']]){
  runs[label] = [];
  for (const s of SEEDS) runs[label].push(await sweep(page, file, s));
  out[label] = runs[label].flat();
}
await browser.close();

const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN;
const band = (rows, lo, hi) => rows.filter(r => r.cloud >= lo && r.cloud < hi && !r.rain
                                             && r.daylight > 0.35);

console.log('daylit, non-raining samples, split by cloud cover');
console.log('cover band      n(HEAD)  people HEAD -> WORK    streetSit HEAD -> WORK');
for (const [lo, hi] of [[0, 0.35], [0.35, 0.5], [0.5, 0.6], [0.6, 0.7], [0.7, 1.01]]){
  const h = band(out.HEAD, lo, hi), w = band(out.WORK, lo, hi);
  if (!h.length && !w.length) continue;
  console.log(
    `${lo.toFixed(2)}-${hi.toFixed(2)}   ${String(h.length).padStart(8)}` +
    `   ${mean(h.map(r => r.people)).toFixed(2).padStart(6)} -> ${mean(w.map(r => r.people)).toFixed(2).padStart(6)}` +
    `        ${mean(h.map(r => r.streetSit)).toFixed(2).padStart(5)} -> ${mean(w.map(r => r.streetSit)).toFixed(2).padStart(5)}`);
}

console.log('\nall daylit samples:  people  ' +
  mean(out.HEAD.filter(r => r.daylight > 0.35).map(r => r.people)).toFixed(2) + ' -> ' +
  mean(out.WORK.filter(r => r.daylight > 0.35).map(r => r.people)).toFixed(2));
console.log('fraction of daylit samples with cover >= 0.55: ' +
  (out.WORK.filter(r => r.daylight > 0.35 && r.cloud >= 0.55).length /
   out.WORK.filter(r => r.daylight > 0.35).length).toFixed(3));

const med = a => a.length ? a.slice().sort((x, y) => x - y)[a.length >> 1] : NaN;

// LEAD: how long before the first drop does the town start getting ready?
console.log();
for (const label of ['HEAD', 'WORK']){
  const washLead = [], umbLead = [], sitLead = [];
  let showers = 0;
  for (const rows of runs[label]){
    for (let i = 1; i < rows.length; i++){
      if (!(rows[i].rain && !rows[i - 1].rain)) continue;    // a shower begins
      showers++;
      // walk back inside this seed's own run to the last fully-unprepared sample
      let wash0 = null, umb0 = null, sit0 = null;
      for (let j = i - 1; j >= 0 && i - j <= 100; j--){
        if (wash0 === null && rows[j].wash >= 9.5) wash0 = rows[j].t;
        if (umb0  === null && rows[j].umb === 0)   umb0  = rows[j].t;
        if (sit0  === null && rows[j].streetSit > 0) sit0 = rows[j].t;
      }
      if (wash0 !== null) washLead.push(rows[i].t - wash0);
      if (umb0  !== null) umbLead.push(rows[i].t - umb0);
      if (sit0  !== null) sitLead.push(rows[i].t - sit0);
    }
  }
  console.log(`${label}: ${showers} showers over ${SEEDS.length} seeds x ${SPAN}s`);
  console.log(`   median lead, full line -> first drop : ${med(washLead).toFixed(1)}s  (n=${washLead.length})`);
  console.log(`   median lead, 1st umbrella -> 1st drop: ${med(umbLead).toFixed(1)}s  (n=${umbLead.length})`);
  console.log(`   median lead, last sitter -> 1st drop : ${med(sitLead).toFixed(1)}s  (n=${sitLead.length})`);
}

// THE SUCCESS CRITERION: no single frame where the washing disappears all at once.
console.log();
for (const label of ['HEAD', 'WORK']){
  let worst = 0, at = null, hist = {};
  for (const rows of runs[label]){
    for (let i = 1; i < rows.length; i++){
      if (rows[i].wash < 0 || rows[i - 1].wash < 0) continue;
      const d = rows[i - 1].wash - rows[i].wash;
      if (d > 0.01) hist[Math.ceil(d)] = (hist[Math.ceil(d)] || 0) + 1;
      if (d > worst){ worst = d; at = rows[i].t; }
    }
  }
  console.log(`${label}: largest washing loss between two 0.5 s samples = ` +
    `${worst.toFixed(2)} garments (t=${at})   losses by size: ${JSON.stringify(hist)}`);
}
