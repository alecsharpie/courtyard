#!/usr/bin/env node
/* #198 — the DRY world must be untouched, and this is the strongest form of that claim.
 * lawnAdmits() is the identity when !raining and LAWN_WET multiplies by 1, so with rain
 * forced off the two files are the same program: the same draws in the same order. So
 * pin a seed, hold `raining` false after every updateClock, warp N days, and hash the
 * whole agent set each day. Any difference at all is a difference on a fine afternoon.
 * (This is the ONE-WAY control LAWS asks for: it differs from the shipping build in
 * exactly one thing — whether it ever rains.)
 */
import { homedir } from 'node:os'; import { resolve } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = homedir() + '/.claude/skills/screenshot-verify/node_modules/playwright/index.js';
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i < 0 ? d : argv[i + 1]; };
const SEEDS = arg('--seeds', '7,42,1234,555,90210,31337').split(',').map(Number);
const DAYS = +arg('--days', 12);
const WET = argv.includes('--rain');
const files = [resolve(arg('--a', '/tmp/head198.html')), resolve(arg('--b', 'courtyard.html'))];
const b = await chromium.launch();
const run = async (file, seed) => {
  const page = await b.newPage({ viewport: { width: 1280, height: 700 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(pathToFileURL(file).href + `?seed=${seed}&pause&t=2`);
  await page.waitForFunction('typeof __warp === "function"');
  const r = await page.evaluate(`(() => {
    __reseed();
    const uc = updateClock; let dry = 0;
    if (!${WET}) updateClock = function(){ uc(); if (raining){ raining = false; rainLeft = 0; rainFall = 0; } dry++; };
    else dry = 1;   // --rain: the same test with the weather LEFT IN, to show the zero can be non-zero
    const rows = [];
    while (day < 1) __warp(1);
    const d0 = day;
    while (day < d0 + ${DAYS}){
      const to = day + 1;
      while (day < to) __warp(0.25);
      let h = 0; const str = agents.map(a => [a.kind, a.x.toFixed(3), a.y.toFixed(3), a.state, a.place ? 1 : 0, a.lawn?1:0].join(',')).sort().join('|');
      for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
      rows.push(day + ':' + agents.length + ':' + h);
    }
    return { rows, dry, cen: JSON.stringify(__census()) };
  })()`);
  await page.close();
  if (errs.length) console.error(file + ' seed ' + seed + ': ' + errs[0]);
  return r;
};
let same = 0, diff = 0;
for (const seed of SEEDS){
  const [A, B] = [await run(files[0], seed), await run(files[1], seed)];
  if (!A.dry || !B.dry) console.error('seed ' + seed + ': the dry patch NEVER FIRED');
  const bad = A.rows.filter((r, i) => r !== B.rows[i]);
  const cen = A.cen === B.cen;
  console.log(`  seed ${String(seed).padStart(6)}  days identical ${A.rows.length - bad.length}/${A.rows.length}  census identical ${cen}` +
    (bad.length ? '   first diff ' + bad[0] + ' vs ' + B.rows[A.rows.indexOf(bad[0])] : ''));
  if (!bad.length && cen) same++; else diff++;
}
await b.close();
console.log(`\n  ${same} of ${SEEDS.length} seeds byte-identical over ${DAYS} days with the rain ${WET ? 'LEFT IN' : 'held off'}; ${diff} differ`);
process.exit(diff ? 1 : 0);
