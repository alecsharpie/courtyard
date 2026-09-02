#!/usr/bin/env node
/* quarter-hash.mjs — the camera's control. Hash the canvas at pinned instants, per
 * QUARTER, on two builds, and print which quarters moved and which are bit-identical.
 *
 *   node probes/quarter-hash.mjs --a head-courtyard.html --b courtyard.html
 *
 * The Wide view is the control: a camera change that touches it is a camera change that
 * touched the picture everyone sees first. Every instant is `__reseed()` then `__warp(t)`
 * then `__where(n)` + `__where(n, 5)` to run the ease out, then ONE `drawScene` inside the
 * same evaluate — a canvas read after requestAnimationFrame is unpinned (LAWS).
 */
import { homedir } from 'node:os';
import { createHash } from 'node:crypto';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (n, d) => { const i = process.argv.indexOf(n); return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const A = arg('--a', 'head-courtyard.html'), B = arg('--b', 'courtyard.html');
const SIZES = [[1600, 950], [1280, 700], [390, 844]];
const SEEDS = ['42', '7'], TIMES = [175, 640, 1210];
const NAMES = ['Wide', 'Courtyard', 'Street', 'Plaza', 'Far bank'];

async function run(page) {
  const browser = await chromium.launch();
  const out = {};
  for (const [w, h] of SIZES) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const p = await ctx.newPage();
    p.on('pageerror', e => { console.error(`  PAGE ERROR ${page} ${w}x${h}: ${e}`); process.exitCode = 1; });
    await p.goto(pathToFileURL(resolve(REPO, page)).href + '?pause&t=0&seed=42');
    await p.waitForFunction(() => typeof window.__where === 'function');
    for (const seed of SEEDS) for (const t of TIMES) for (let n = 0; n < 5; n++) {
      const url = pathToFileURL(resolve(REPO, page)).href + `?pause&t=0&seed=${seed}`;
      await p.goto(url); await p.waitForFunction(() => typeof window.__where === 'function');
      const d = await p.evaluate(({ t, n }) => {
        __reseed(); __warp(t); __where(n); __where(n, 5); drawScene(simT, 1 / 30);
        return document.getElementById('cv').toDataURL();
      }, { t, n });
      out[`${w}x${h}|${seed}|${t}|${n}`] = createHash('sha1').update(d).digest('hex').slice(0, 12);
    }
    await ctx.close();
  }
  await browser.close();
  return out;
}
const a = await run(A), b = await run(B);
const per = NAMES.map(() => ({ same: 0, diff: 0 }));
for (const k in a) { const n = +k.split('|')[3]; (a[k] === b[k] ? per[n].same++ : per[n].diff++); }
console.log(`\n  quarter      identical   moved     (${A} vs ${B}, ${SIZES.length} sizes x ${SEEDS.length} seeds x ${TIMES.length} instants)`);
for (let n = 0; n < 5; n++) console.log(`  ${NAMES[n].padEnd(12)} ${String(per[n].same).padStart(6)} ${String(per[n].diff).padStart(9)}`);
const wideMoved = per[0].diff;
console.log(`\n  WIDE IS THE CONTROL: ${wideMoved === 0 ? 'bit-identical to ' + A + ' at every instant' : 'MOVED at ' + wideMoved + ' instants — FAIL'}`);
process.exit(wideMoved ? 1 : (process.exitCode || 0));
