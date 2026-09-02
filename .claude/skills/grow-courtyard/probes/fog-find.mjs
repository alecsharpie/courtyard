#!/usr/bin/env node
/* Find the sim instants where the allotments actually fog, so the visual gate can be
 * pointed AT the feature instead of at an average morning. Prints simT for ?t=. */
import { homedir } from 'node:os';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i < 0 ? d : argv[i + 1]; };
const SEEDS = arg('--seeds', '7,42,1234').split(',').map(Number);
const DAYS = +arg('--days', 90);
const browser = await chromium.launch();
for (const seed of SEEDS){
  // the FRAMING decides what exists, so weather at a given simT is viewport-dependent:
  // find the instant at the size the shot will be taken at, or it will not reproduce
  const page = await browser.newPage({ viewport: { width: +arg('--w',1600), height: +arg('--h',950) } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(pathToFileURL(resolve(arg('--file','courtyard.html'))).href + `?seed=${seed}&pause`);
  await page.waitForFunction('typeof __warp === "function"');
  const r = await page.evaluate(`(async () => {
    window.requestAnimationFrame = () => 0; await new Promise(r => setTimeout(r, 80));
    __reseed(); __setTime(0);
    const hits = [];
    while (day < 1) __warp(1);
    const d0 = day;
    while (day < d0 + ${DAYS}){
      __warp(0.1);
      if (hollowMist > 0.55) hits.push([+simT.toFixed(1), +hour.toFixed(2), +hollowMist.toFixed(2),
        +mist.toFixed(2), +mistAt(88).toFixed(2), +warmth.toFixed(2), +windF().toFixed(2), +cloudCover().toFixed(2), +daylight.toFixed(2)]);
    }
    // the densest hollow instant, and one where the RIVER is quiet so the two read apart
    const best = hits.slice().sort((a,b) => b[2]-a[2])[0] || null;
    const solo = hits.filter(h => h[3] < 0.15).sort((a,b) => b[2]-a[2])[0] || null;
    const lit = hits.slice().sort((a,b) => b[8]-a[8])[0] || null;
    return { n: hits.length, best, solo, lit, first: hits[0] || null };
  })()`);
  if (errs.length){ console.error('PAGE ERROR', errs[0]); process.exit(2); }
  console.log('seed ' + seed + '  fogged instants: ' + r.n);
  const fmt = (t, l) => t ? '  ' + l + ' simT=' + t[0] + ' hour=' + t[1] + ' hollow=' + t[2]
    + ' river=' + t[3] + ' mistAt88=' + t[4] + ' warmth=' + t[5] + ' wind=' + t[6] + ' cloud=' + t[7] : '  ' + l + ' none';
  console.log(fmt(r.best, 'densest   '));
  console.log(fmt(r.solo, 'hollow-only'));
  console.log(fmt(r.lit, 'brightest '));
  await page.close();
}
await browser.close();
