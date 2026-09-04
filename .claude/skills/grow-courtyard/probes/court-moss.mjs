#!/usr/bin/env node
/* b212 — price the premise BEFORE building the third moss region.
 *   1. GEOMETRY: how many PATH cells the courtyard's ring is, and what the PLAZA's own
 *      shelter rule (share of the 8 neighbours that is not PATH, /5) says about them.
 *      The plaza is 13 cells wide and has an OPEN middle; the courtyard's ring is a band
 *      between the wall beds and the lawn, and if every cell of it is an edge the ceiling
 *      is uniform and the region paints as one green field, not as damp corners.
 *   2. FEET: foot-seconds per cell per day, courtyard ring vs plaza, sampled off `agents`
 *      the way stepAgent rounds. MOSS_SCUFF is 1.6/s, so ~0.6 s of feet takes a cell to 0.
 *   3. THE PLAZA'S YEAR on HEAD: mean / mossy / max by season, sheltered vs open — the
 *      number the courtyard's must be quoted against.
 * Usage: node probe-court-moss.mjs [pathToHtml] [label]
 */
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const FILE = resolve(process.argv[2] || fileURLToPath(new URL('./courtyard.html', import.meta.url)));
const LABEL = process.argv[3] || 'HEAD';
const PAGE = pathToFileURL(FILE).href;
const SEEDS = (process.env.SEEDS || '7,42,1234').split(',').map(Number);
const DAY = 55;
const FEET_DAYS = +(process.env.FEET_DAYS || 6);
const YEAR_DAYS = +(process.env.YEAR_DAYS || 52);

/* the two boxes, named once. The courtyard is the inner block [3,61)^2; the plaza is
 * PLAZA_X0..X1 rows 3..61. Both intersected with PATH, off the grid. */
const GEOM = `(() => {
  const shel = (x, y) => { let n = 0;
    for (let dy=-1; dy<=1; dy++) for (let dx=-1; dx<=1; dx++){
      if (!dx && !dy) continue;
      const gx=x+dx, gy=y+dy;
      const g = (gx<0||gy<0||gx>=GW||gy>=WH) ? -1 : grid[gy*GW+gx];
      if (g !== PATH) n++;
    }
    return Math.min(1, n/5); };
  const box = (x0,x1,y0,y1) => {
    const hist = [0,0,0,0,0], out = []; let n = 0, sum = 0;
    for (let y=y0;y<y1;y++) for (let x=x0;x<x1;x++){
      if (grid[y*GW+x] !== PATH) continue;
      const s = shel(x,y); n++; sum += s; out.push(s);
      hist[Math.min(4, Math.floor(s*5))]++;
    }
    out.sort((a,b)=>a-b);
    return {n, mean:+(sum/n).toFixed(3), med:+out[n>>1].toFixed(3),
            zero:out.filter(v=>v<0.001).length, hist};
  };
  return {court: box(3,61,3,61), plaza: box(PLAZA_X0,PLAZA_X1,3,61)};
})()`;

const browser = await chromium.launch();
const page0 = await browser.newPage({ viewport: { width: 1200, height: 720 } });
await page0.goto(`${PAGE}?pause&seed=7&t=0`, { waitUntil: 'load' });
await page0.waitForFunction(() => typeof window.__warp === 'function');
const geom = await page0.evaluate(g => eval(g), GEOM);
await page0.close();

console.log(`=== ${LABEL}: b212 premise ===`);
console.log('1. GEOMETRY (the plaza\'s own shelter rule, applied to both boxes)');
for (const [k, v] of Object.entries(geom))
  console.log(`   ${k.padEnd(6)} PATH cells ${String(v.n).padStart(4)}  shelter mean ${v.mean} med ${v.med}  `
    + `cells at 0 (open middle): ${v.zero}  hist[0,.2,.4,.6,.8+] ${v.hist.join('/')}`);

/* 2. FEET */
const feetRuns = [];
for (const seed of SEEDS) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 720 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(`${PAGE}?pause&seed=${seed}&t=0`, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof window.__warp === 'function');
  const r = await page.evaluate(({ step, n }) => {
    window.__reseed();
    const foot = new Float32Array(GW * WH);
    for (let i = 0; i < n; i++) {
      window.__warp(step);
      for (const a of agents) {
        const gx = Math.round(a.x - .5), gy = Math.round(a.y - .5);
        if (gx < 0 || gy < 0 || gx >= GW || gy >= WH) continue;
        foot[gy * GW + gx] += (a.small ? 0.6 : 1) * step;
      }
    }
    const box = (x0, x1, y0, y1) => {
      const v = [];
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++)
        if (grid[y * GW + x] === PATH) v.push(foot[y * GW + x]);
      v.sort((a, b) => a - b);
      const q = p => v[Math.min(v.length - 1, Math.floor(p * v.length))];
      return { n: v.length, sum: v.reduce((a, b) => a + b, 0), clean: v.filter(k => k < 0.05).length,
               med: q(0.5), p90: q(0.9), max: v[v.length - 1] };
    };
    return { court: box(3, 61, 3, 61), plaza: box(PLAZA_X0, PLAZA_X1, 3, 61) };
  }, { step: 0.25, n: Math.round(FEET_DAYS * DAY / 0.25) });
  feetRuns.push({ seed, r, errs });
  await page.close();
}
console.log(`2. FEET — foot-seconds per cell per day, ${FEET_DAYS} days (MOSS_SCUFF 1.6/s: 0.63 s clears a full cell)`);
for (const { seed, r, errs } of feetRuns) {
  const f = k => { const b = r[k], d = FEET_DAYS;
    return `${k} mean ${(b.sum / b.n / d).toFixed(3)} med ${(b.med / d).toFixed(3)} p90 ${(b.p90 / d).toFixed(3)} `
         + `max ${(b.max / d).toFixed(2)} untouched ${(100 * b.clean / b.n).toFixed(0)}%`; };
  console.log(`   seed ${String(seed).padStart(4)}  ${f('court')}  |  ${f('plaza')}` + (errs.length ? '  ERRORS ' + errs[0] : ''));
}

/* 3. the plaza's year on HEAD */
const yearRuns = [];
for (const seed of SEEDS) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 720 } });
  await page.goto(`${PAGE}?pause&seed=${seed}&t=0`, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof window.__warp === 'function');
  const series = await page.evaluate(({ step, n }) => {
    window.__reseed();
    const out = [];
    for (let i = 0; i < n; i++) {
      window.__warp(step);
      let sum = 0, cells = 0, mossy = 0, mx = 0, shelS = 0, shelN = 0, openS = 0, openN = 0;
      for (let y = 3; y < 61; y++) for (let x = PLAZA_X0; x < PLAZA_X1; x++) {
        const i2 = y * GW + x;
        if (grid[i2] !== PATH) continue;
        cells++; sum += moss[i2]; if (moss[i2] > 1 / MOSS_BUCKET) mossy++;
        if (moss[i2] > mx) mx = moss[i2];
        if (mossShel[i2] > 0.35) { shelS += moss[i2]; shelN++; } else { openS += moss[i2]; openN++; }
      }
      out.push([day, seasonLabel(), +warmth.toFixed(3), mossy, +(sum / cells).toFixed(4),
                +(shelN ? shelS / shelN : 0).toFixed(4), +(openN ? openS / openN : 0).toFixed(4), +mx.toFixed(3)]);
    }
    return out;
  }, { step: DAY, n: YEAR_DAYS });
  yearRuns.push({ seed, series });
  await page.close();
}
await browser.close();
console.log(`3. THE PLAZA'S YEAR on ${LABEL} (${YEAR_DAYS} days, ${geom.plaza.n} cells) — second year only`);
for (const { seed, series } of yearRuns) {
  const yr = series.slice(series.length / 2);
  const bySeason = {};
  for (const s of yr) { (bySeason[s[1]] ||= []).push(s); }
  const line = Object.entries(bySeason).map(([k, v]) =>
    `${k} ${(v.reduce((a, b) => a + b[4], 0) / v.length).toFixed(3)}`).join('  ');
  const mo = yr.map(s => s[3]);
  console.log(`   seed ${String(seed).padStart(4)}  mean by season: ${line}  |  mossy ${Math.min(...mo)}..${Math.max(...mo)}  `
    + `shel/open ${(yr.reduce((a, b) => a + b[5], 0) / yr.length).toFixed(3)}/${(yr.reduce((a, b) => a + b[6], 0) / yr.length).toFixed(3)}`);
}
