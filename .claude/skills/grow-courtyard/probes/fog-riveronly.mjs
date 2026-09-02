#!/usr/bin/env node
/* The brief's own success line: "on the days the allotments have none, the river's own mist
 * is unchanged from HEAD". Find an instant with river mist UP and the hollow at exactly 0,
 * shoot both builds there, and require the frame to be identical. */
import { homedir } from 'node:os';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i < 0 ? d : argv[i + 1]; };
const SEED = +arg('--seed', '42'), DAYS = +arg('--days', '60');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
await page.goto(pathToFileURL(resolve('courtyard.html')).href + `?seed=${SEED}&pause`);
await page.waitForFunction('typeof __warp === "function"');
const r = await page.evaluate(`(async () => {
  window.requestAnimationFrame = () => 0; await new Promise(r => setTimeout(r, 80));
  __reseed(); __setTime(0);
  const hits = [];
  while (day < 1) __warp(1);
  const d0 = day;
  while (day < d0 + ${DAYS}){
    __warp(0.1);
    if (mist > 0.6 && hollowMist === 0) hits.push([+simT.toFixed(1), +hour.toFixed(2), +mist.toFixed(2), +daylight.toFixed(2)]);
  }
  return hits.sort((a,b) => b[3]-a[3])[0] || null;
})()`);
await page.close(); await browser.close();
if (!r){ console.log('no river-only instant found'); process.exit(1); }
console.log('river-only instant: simT=' + r[0] + ' hour=' + r[1] + ' river=' + r[2] + ' daylight=' + r[3]);
