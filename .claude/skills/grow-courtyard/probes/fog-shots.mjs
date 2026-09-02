#!/usr/bin/env node
/* The visual gate, pinned the SAME way the measurement was: kill rAF, reseed, setTime(0),
 * warp in the probe's own increments to the fogged instant, draw ONE frame synchronously,
 * shoot. Runs the identical instant on two files so the pair is an A/B and not two moments.
 *   node probe-fog-shots.mjs --at 769.9 --seed 42 --tag both
 */
import { homedir } from 'node:os';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { mkdirSync } from 'node:fs';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i < 0 ? d : argv[i + 1]; };
const AT = +arg('--at', '769.9'), SEED = +arg('--seed', '42'), TAG = arg('--tag', 'fog');
const W = +arg('--w','1600'), H = +arg('--h','950');
const OUT = resolve('shots'); mkdirSync(OUT, { recursive: true });
const FILES = [['cand', resolve('courtyard.html')], ['head', resolve(arg('--head', '/tmp/cy-head-127.html'))]];

const browser = await chromium.launch();
for (const [label, file] of FILES){
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto(pathToFileURL(file).href + `?seed=${SEED}&pause`);
  await p.waitForFunction('typeof __warp === "function"');
  const at = await p.evaluate(`(async () => {
    window.requestAnimationFrame = () => 0; await new Promise(r => setTimeout(r, 80));
    __reseed(); __setTime(0);
    while (day < 1) __warp(1);
    while (simT < ${AT} - 1e-6) __warp(0.1);
    drawScene(simT, 1/30);                       // pin the frame: no rAF, no drift
    return { simT: +simT.toFixed(2), hour: +hour.toFixed(2),
             hollow: typeof hollowMist === 'undefined' ? null : +hollowMist.toFixed(3),
             river: +mist.toFixed(3), m88: +mistAt(88).toFixed(3),
             wind: +windF().toFixed(2), cloud: +cloudCover().toFixed(2), warmth: +warmth.toFixed(2) };
  })()`);
  if (errs.length){ console.error('PAGE ERROR', label, errs[0]); process.exit(2); }
  await p.screenshot({ path: join(OUT, `${TAG}-${label}.png`) });
  console.log(label.padEnd(5), JSON.stringify(at));
  await ctx.close();
}
await browser.close();
console.log('-> shots/' + TAG + '-cand.png  vs  shots/' + TAG + '-head.png');
