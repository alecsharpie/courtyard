#!/usr/bin/env node
/* throwaway: motion.mjs's `shower` row is a POPULATION count, so a shower starting is
 * a jump by construction. It fired 2 -> 4 on the market scene after a change that adds
 * no weather term — so the question the laws demand is: what is that number's own
 * distribution on HEAD? This replays motion.mjs's exact world (same page setup, same
 * warm-up, same step, same |d| > peak/2 rule) across ten seeds instead of two. */
import { homedir } from 'node:os';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;

const FILES = process.argv.slice(2).length ? process.argv.slice(2)
  : ['/tmp/courtyard-head.html', 'courtyard.html'];
const SEEDS = [3, 7, 11, 19, 42, 63, 101, 404, 777, 1234];
// motion.mjs's scenes, verbatim. Default `market`; SCENE=dusk (or a raw t) for the others,
// since any of the four population rows can fire and each has its own distribution.
const SCENES = { day: 175, dusk: 1080, night: 1230, market: 605 };
const T = SCENES[process.env.SCENE] ?? +(process.env.SCENE || 605);
const STEP = 0.25, STEPS = 240;

const browser = await chromium.launch();
for (const file of FILES) {
  const url = pathToFileURL(resolve(file)).href;
  const out = [];
  for (const seed of SEEDS) {
    const page = await browser.newPage();
    await page.goto(`${url}?seed=${seed}&t=0&pause`);
    await page.waitForFunction(() => typeof window.__warp === 'function');
    const rain = await page.evaluate(({ t, step, steps }) => {
      window.__reseed(); window.__warp(t);
      const r = [];
      for (let i = 0; i < steps; i++) { window.__warp(step); r.push(window.__census().life.raindrops); }
      return r;
    }, { t: T, step: STEP, steps: STEPS });
    await page.close();
    const peak = Math.max(...rain);
    let jumps = 0;
    for (let i = 1; i < rain.length; i++)
      if (peak >= 8 && Math.abs(rain[i] - rain[i - 1]) > peak * 0.5) jumps++;
    out.push(jumps);
  }
  const pair = out[SEEDS.indexOf(7)] + out[SEEDS.indexOf(42)];
  console.log(file.split('/').pop().padEnd(22),
    'shower jumps per seed', JSON.stringify(out),
    '| motion.mjs pair {7,42} =', pair,
    '| range', Math.min(...out) + '..' + Math.max(...out),
    '| mean', (out.reduce((a, b) => a + b, 0) / out.length).toFixed(2));
}
await browser.close();
