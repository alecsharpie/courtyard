#!/usr/bin/env node
/* Which world variable moves at the frame filmstrip flagged? The strip's Δ is a
 * whole-frame mean, so it is loud about anything global and says nothing about what.
 * This reproduces its exact world (seed 42, ?t=0, __warp to 1230, then 0.35s steps)
 * and prints the sky/ground state at every frame it photographed.
 */
import { homedir } from 'node:os';
import { resolve, join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;

const REPO = fileURLToPath(new URL('../../../../', import.meta.url));
const FILE = resolve(process.argv[2] || join(REPO, 'courtyard.html'));
const SEED = +(process.argv[3] || 42), T0 = +(process.argv[4] || 1230), GAP = 0.35, N = 12;

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1600, height: 950 } });
p.on('pageerror', e => console.log('PAGE ERROR', e.message));
await p.goto(pathToFileURL(FILE).href + `?seed=${SEED}&t=0&pause`);
await p.waitForFunction(() => window.__warp);
const rows = await p.evaluate(({ t0, gap, n }) => {
  window.__reseed();
  window.__warp(t0);
  const out = [];
  const snap = () => {
    const c = window.__census();
    return { hour: +c.clock.hour.toFixed(2), cloud: c.clock.cloud, rain: c.clock.raining ? 1 : 0,
             drops: c.life.raindrops, wet: +wet.toFixed(2), daylight: +daylight.toFixed(3),
             nightF: +nightF.toFixed(3), people: c.scalars.people, blooms: c.scalars.blooming };
  };
  out.push(snap());
  for (let i = 1; i < n; i++) { window.__warp(gap); out.push(snap()); }
  return out;
}, { t0: T0, gap: GAP, n: N });
await b.close();

console.log('frame  hour   cloud  rain drops    wet  daylight  nightF  people  blooms');
rows.forEach((r, i) => console.log(
  `${String(i).padStart(4)}  ${r.hour.toFixed(2)}  ${r.cloud.toFixed(3)}  ${r.rain}  ${String(r.drops).padStart(4)}  ` +
  `${r.wet.toFixed(2).padStart(5)}  ${r.daylight.toFixed(3).padStart(6)}  ${r.nightF.toFixed(3).padStart(6)}  ` +
  `${String(r.people).padStart(5)}  ${String(r.blooms).padStart(6)}`));
