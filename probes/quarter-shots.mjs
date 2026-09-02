#!/usr/bin/env node
/* quarter-shots.mjs — one screenshot per quarter CAMERA, at two framings, pinned.
 *
 *   node probes/quarter-shots.mjs --tag head --page head.html
 *
 * shoot.mjs photographs the WIDE view through viewport crops; this photographs what
 * #where actually shows. Each shot is its own page: reseed, warp, __where(n) to switch
 * and __where(n, 5) to run the ease out, then ONE drawScene inside the same evaluate. */
import { homedir } from 'node:os';
import { mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (n, d) => { const i = process.argv.indexOf(n); return i !== -1 && process.argv[i+1] ? process.argv[i+1] : d; };
const tag = arg('--tag', 'q'), T = +arg('--t', '175'), SEED = arg('--seed', '42');
const pg = arg('--page', 'courtyard.html');
const PAGE = pathToFileURL(resolve(REPO, pg)).href;
const OUT = join(REPO, 'shots'); mkdirSync(OUT, { recursive: true });
const SIZES = [{ n:'d', w:1600, h:950 }, { n:'m', w:390, h:844 }];
const NAMES = ['wide','courtyard','street','plaza','farbank'];
const browser = await chromium.launch();
for (const sz of SIZES) {
  for (let i = 0; i < 5; i++) {
    const ctx = await browser.newContext({ viewport:{width:sz.w,height:sz.h}, deviceScaleFactor:1 });
    const p = await ctx.newPage();
    p.on('pageerror', e => console.error('PAGE ERROR ' + e));
    await p.goto(`${PAGE}?pause&t=0&seed=${SEED}`);
    await p.waitForFunction(() => typeof window.__where === 'function');
    await p.evaluate(({t,n}) => { __reseed(); __warp(t); __where(n); __where(n,5); drawScene(simT, 1/30); }, {t:T,n:i});
    await p.screenshot({ path: join(OUT, `${tag}-${sz.n}-${i}-${NAMES[i]}.png`) });
    await ctx.close();
  }
}
await browser.close();
console.log('ok');
