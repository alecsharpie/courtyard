#!/usr/bin/env node
/* #173 — the motion gate flagged `cart jumps 0 -> 1` on a change that touches nothing but
 * the plaza. Is the CART fast, or is the GATE's threshold? ABS_JUMP is 2.5 world units per
 * 0.25 s step; CART_SPEED is 6.5 cells/s and CART_TROT multiplies it by 1.5 on the way home.
 * This samples the cart on its own, at the gate's own cadence, on whichever build it is
 * pointed at, and reports the step distribution — a build-independent fact about the cart. */
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = homedir() + '/.claude/skills/screenshot-verify/node_modules/playwright/index.js';
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i < 0 ? d : argv[i + 1]; };
const SRC = resolve(arg('--file', 'courtyard.html'));
const SEEDS = arg('--seeds', '7,42').split(',').map(Number);
const SECS = +arg('--secs', 600);
const b = await chromium.launch();
for (const seed of SEEDS){
  const page = await b.newPage({ viewport: { width: 1280, height: 700 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(pathToFileURL(SRC).href + `?seed=${seed}&t=0&pause`);
  await page.waitForFunction('typeof __warp === "function"');
  const r = await page.evaluate(`(() => {
    __reseed();
    const steps = [], big = [];
    let px = null, py = null, was = null;
    for (let i = 0; i < ${SECS} * 4; i++){
      __warp(0.25);
      if (!cart){ px = null; continue; }
      if (cart !== was){ was = cart; px = null; }
      if (px !== null){
        const d = Math.hypot(cart.x - px, cart.y - py);
        steps.push(d);
        if (d > 2.5) big.push({ d:+d.toFixed(2), state:cart.state, out:!!cart.out, hour:+hour.toFixed(1), night:+nightF.toFixed(2) });
      }
      px = cart.x; py = cart.y;
    }
    steps.sort((a,c)=>a-c);
    return { n: steps.length, med: +steps[steps.length>>1].toFixed(3), max: +steps[steps.length-1].toFixed(3),
             zero: steps.filter(d => d < 1e-9).length, over: steps.filter(d => d > 2.5).length, big: big.slice(0, 6) };
  })()`);
  if (errs.length){ console.error('PAGE ERROR', errs[0]); process.exit(2); }
  await page.close();
  console.log(`[${SRC.split('/').pop()} seed ${seed}] cart samples ${r.n}  median ${r.med}  max ${r.max}  ` +
              `parked ${(100*r.zero/r.n).toFixed(0)}%  steps over ABS_JUMP 2.5: ${r.over}`);
  for (const x of r.big) console.log(`    ${x.d} cells/step  state ${x.state}  out ${x.out}  hour ${x.hour}  nightF ${x.night}`);
}
await b.close();
