#!/usr/bin/env node
/* market-shots — the brief's own success test, made a picture.
 *
 * "Two market mornings pinned six months apart are visibly different stalls, and a
 * probe can name which plots the difference came from."
 *
 * Warps forward until it finds a market morning in each season quarter, holds the
 * SAME hour of the market in each (marketOpen() + 1, so every stall that is coming
 * out is fully up), crops to the market pitch and writes one PNG per quarter — plus
 * the stock that produced it, so the picture and the number are the same event.
 *
 * ONE PAGE PER QUARTER, and this is not fussiness. Drawing consumes R(): on a ?pause
 * page with the sim frozen at simT 300, R() reads 0.110 after two drawn frames and
 * 0.746 after forty. So every host round-trip — a screenshot, a boundingBox, a
 * waitForFunction poll — advances the PRNG by however many frames the machine
 * happened to deliver. An earlier draft of this probe took its four shots from one
 * page and reported a different midwinter market every run (2.1 units, 13.6, 22.1,
 * 5.4). Each quarter now gets a page that reseeds, warps to its own target inside a
 * single evaluate, and is photographed once.
 *
 *   node market-shots.mjs [pathToHtml] [tag]
 *   SEED=42 node market-shots.mjs
 */
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;

const FILE = resolve(process.argv[2] || fileURLToPath(new URL('../../../../courtyard.html', import.meta.url)));
const TAG = process.argv[3] ? '-' + process.argv[3] : '';
const OUT = resolve(fileURLToPath(new URL('../../../../shots', import.meta.url)));
const SEED = +(process.env.SEED || 42);
mkdirSync(OUT, { recursive: true });

const Q = ['midwinter', 'spring', 'midsummer', 'autumn'];
const browser = await chromium.launch();
const errs = [];
const found = [];
for (const q of [0, 1, 2, 3]) {
  // 3x, because the difference under test is a handful of 2px vegetables on a board
  const page = await browser.newPage({ viewport: { width: 1200, height: 750 }, deviceScaleFactor: 3 });
  page.on('pageerror', e => errs.push(String(e)));
  await page.goto(`${pathToFileURL(FILE).href}?pause&seed=${SEED}&t=0`, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof window.__warp === 'function');
  const hit = await page.evaluate(target => {
    window.__reseed();
    const qOf = p => Math.floor(((p + 0.125) % 1) * 4);
    for (let k = 0; k < 6000; k++) {
      window.__warp(1);
      if (isMarketDay() && qOf(seasonPhase) === target &&
          hour >= marketOpen() + 0.9 && hour < marketOpen() + 2.2) {
        return { day, hour: +hour.toFixed(2), phase: +seasonPhase.toFixed(3),
                 label: seasonLabel(), total: +mkTotal.toFixed(1), open: mkOpenCount(),
                 goods: [0, 1, 2].map(i => mkGoods(i)), ripe: ripePlots(),
                 raise: [0, 1, 2].map(i => +marketRaise(i).toFixed(2)),
                 shelf: [0, 1, 2].map(i => mkShelfFor(i).join('·')),
                 top: mkTop ? SPECIES[mkTop - 1].name : '—',
                 mix: SPECIES.map((s, i) => [s.name, +mkUnits[i].toFixed(1)])
                             .filter(r => r[1] > 0.05).map(r => `${r[0]} ${r[1]}`).join(', '),
                 line: mkLine() };
      }
    }
    return null;
  }, q);
  if (!hit) { console.log(`  ${Q[q]}: no market found`); await page.close(); continue; }
  // let the page paint the instant we stopped on, then crop to the market pitch. The
  // stock above was read BEFORE any of these frames, so the numbers are the picture's.
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  const box = await page.locator('canvas').boundingBox();
  await page.screenshot({ path: join(OUT, `market-${Q[q]}${TAG}.png`),
    clip: { x: box.x + 360, y: box.y + 455, width: 200, height: 115 } });
  found.push({ q, ...hit });
  await page.close();
}
await browser.close();
found.sort((a, b) => [2, 3, 0, 1].indexOf(a.q) - [2, 3, 0, 1].indexOf(b.q));   // in year order

console.log(`\nmarket-shots — seed ${SEED}   -> shots/market-<quarter>${TAG}.png\n`);
for (const f of found) {
  console.log(`  ${Q[f.q].padEnd(10)} day ${String(f.day).padStart(3)} h${f.hour}  ${f.label.padEnd(12)} ` +
              `stock ${String(f.total).padStart(5)}  stalls ${f.open}  pitches ${f.goods.join('/')}  ripePlots ${f.ripe}`);
  console.log(`             raise ${f.raise.join('/')}  shelf [${f.shelf.join('] [')}]`);
  console.log(`             from the plots: ${f.mix || '(nothing)'}`);
  console.log(`             ticker: ${f.line}`);
}
const w = found.find(f => f.q === 0), s = found.find(f => f.q === 2);
const differ = w && s && (w.open !== s.open || w.goods.join() !== s.goods.join());
console.log(`\n  midwinter vs midsummer differ in stalls or pitches: ${differ ? 'PASS' : 'FAIL'}`);
console.log(`  page errors: ${errs.length ? 'FAIL — ' + errs[0] : 'PASS'}\n`);
process.exit(errs.length || !differ ? 1 : 0);
