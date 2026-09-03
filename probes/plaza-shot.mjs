#!/usr/bin/env node
/* #148 — a crop of the plaza's roundel at a fine summer afternoon, where the families are. */
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i < 0 ? d : argv[i + 1]; };
const SRC = resolve(arg('--file', 'courtyard.html'));
const OUT = arg('--out', 'shots/plaza.png');
const T = +arg('--t', 3 * 55 + 55 * 14.5 / 24);     // day 3, ~14:30
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 950 }, deviceScaleFactor: 2 });
const errs = []; page.on('pageerror', e => errs.push(String(e)));
await page.goto(pathToFileURL(SRC).href + `?seed=${arg('--seed', 42)}&pause`);
await page.waitForFunction('typeof __warp === "function"');
const info = await page.evaluate(`(() => { __reseed(); __warp(${T}); drawScene(simT, 1/30);
  return { hour:+hour.toFixed(2), warmth:+warmth.toFixed(2), fam: famCount(),
           held: FOUNT_STANDS.filter(s => agents.some(o => o.fstand === s)).length,
           bench: PLAZA_BENCHES.filter(b => agents.some(o => o.pbench === b)).length };
})()`);
if (errs.length){ console.error('PAGE ERROR', errs[0]); process.exit(2); }
await page.screenshot({ path: OUT, clip: { x: 960, y: 300, width: 460, height: 400 } });
console.log(JSON.stringify(info), '->', OUT);
await browser.close();
