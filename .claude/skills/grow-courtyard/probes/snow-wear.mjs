#!/usr/bin/env node
/* probe: does a lying cover know the desire paths? For each seed, warp into the first
 * winter until snowCover > 0.4 at ~1.5 h after sunrise (sweeper gone through), then read
 * snowAt over every GRASS cell bucketed by wear, and the sweeper's strip vs the lane row
 * above it. --page <file> runs the same instant on another build (HEAD control). */
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const argv = process.argv.slice(2);
const pageFile = argv.includes('--page') ? argv[argv.indexOf('--page') + 1] : 'courtyard.html';
const shotSeed = argv.includes('--shot') ? +argv[argv.indexOf('--shot') + 1] : -1;
const SEEDS = (process.env.SY_SEEDS || '1,7,13,29,42').split(',').map(Number);
const browser = await chromium.launch();
const tot = { lo: [0, 0], hi: [0, 0], strip: [0, 0], row: [0, 0] };
for (const seed of SEEDS){
  const page = await browser.newPage({ viewport: { width: 1200, height: 720 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(pathToFileURL(join(process.cwd(), pageFile)).href + `?pause&seed=${seed}`, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof window.__warp === 'function');
  const r = await page.evaluate(() => {
    window.__reseed();
    let t = 0, found = false;
    for (; t < 55 * 26 * 2; t += 0.25){
      window.__warp(0.25);
      if (snowCover > 0.4 && hour > sunUp + 1.3 && hour < sunUp + 1.7){ found = true; break; }
    }
    if (!found) return null;
    const acc = { lo: [0, 0], hi: [0, 0], strip: [0, 0], row: [0, 0] };
    for (let y = 0; y < WH; y++) for (let x = 0; x < GW; x++){
      const j = y * GW + x, g = grid[j];
      if (g === GRASS){
        const s = snowAt(x, y, g);
        if (wear[j] > 0.45){ acc.hi[0] += s; acc.hi[1]++; }
        else if (wear[j] < 0.1){ acc.lo[0] += s; acc.lo[1]++; }
      }
      if (g === SIDE && x >= 0 && x < 66){
        const s = snowAt(x, y, g);
        if (y === Math.round(LANE_N_Y)){ acc.strip[0] += s; acc.strip[1]++; }
        else if (y === Math.round(LANE_N_Y) - 1 || y === Math.round(LANE_N_Y) + 1){ acc.row[0] += s; acc.row[1]++; }
      }
    }
    groundDirty = true; drawScene && drawScene();
    return { t, cover: snowCover, hour, acc };
  });
  if (errs.length) console.log(`  ! page errors on seed ${seed}: ${errs[0]}`);
  if (!r){ console.log(`seed ${seed}: no winter morning with cover > 0.4 found`); await page.close(); continue; }
  const m = k => r.acc[k][1] ? (r.acc[k][0] / r.acc[k][1]).toFixed(3) : 'n/a';
  console.log(`seed ${seed}: t=${r.t.toFixed(1)} cover=${r.cover.toFixed(2)} hour=${r.hour.toFixed(2)}  lawn wear<0.1: ${m('lo')} (${r.acc.lo[1]})  wear>0.45: ${m('hi')} (${r.acc.hi[1]})  lane strip: ${m('strip')}  rows beside: ${m('row')}`);
  for (const k in tot){ tot[k][0] += r.acc[k][0]; tot[k][1] += r.acc[k][1]; }
  if (seed === shotSeed){
    const tag = pageFile === 'courtyard.html' ? 'cand' : 'head';
    await page.screenshot({ path: `shots/snow-wear-${tag}-seed${seed}.png` });
    console.log(`  shot -> shots/snow-wear-${tag}-seed${seed}.png`);
  }
  await page.close();
}
await browser.close();
const m = k => tot[k][1] ? (tot[k][0] / tot[k][1]).toFixed(3) : 'n/a';
console.log(`ALL: wear<0.1 ${m('lo')}  wear>0.45 ${m('hi')}  ratio ${(tot.hi[0]/tot.hi[1])/(tot.lo[0]/tot.lo[1])}  strip ${m('strip')} vs beside ${m('row')}`);
