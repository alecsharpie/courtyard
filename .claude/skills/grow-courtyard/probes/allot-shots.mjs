#!/usr/bin/env node
/* probe: what the allotment block LOOKS like around its year, at pinned instants.
 * The numbers in allot-year.mjs say winter has 0 ripe plots and 0 bare plots — every
 * one of the 17 sown and stalled at stage 1. Whether that reads as a block resting or
 * a block that died is a question for the eye, so this crops to the allotments and
 * shoots the same seeded world at midsummer, at the two shoulders and at midwinter.
 *
 *   node allot-shots.mjs [label]        # label goes in the filenames
 *   HEAD=/tmp/courtyard-head.html node allot-shots.mjs head
 */
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;

const REPO = fileURLToPath(new URL('../../../../', import.meta.url));
const OUT = join(REPO, 'shots');
mkdirSync(OUT, { recursive: true });
const LABEL = process.argv[2] || 'here';
const FILE = process.env.HEAD || join(REPO, 'courtyard.html');
const url = pathToFileURL(FILE).href;

const noon = d => d * 55 + 13.75;
/* phase starts at 0.25, SEASON_LEN 26 d: phase = 0.25 + day/26.
   folded day 0 (midwinter) = day 19.5; folded 13 (midsummer) = day 6.5.
   allot-year.mjs's fold: ripe crosses 1 at folded day 5 (= day 24.5) and falls to
   0 after folded day 20 (= day 13.5). Both shoulders are shot. */
const SHOTS = [
  { name: 'summer-noon', t: noon(6) },          // folded 13 — peak
  { name: 'late-shoulder', t: noon(14) },       // folded 21 — the cliff, ripe 12 -> 0
  { name: 'winter-noon', t: noon(19) },         // folded 0  — midwinter
  { name: 'early-shoulder', t: noon(25) },      // folded 6  — the return
];

const browser = await chromium.launch();
for (const s of SHOTS) {
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 2 });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  await page.goto(`${url}?pause&seed=42&t=0`, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof window.__warp === 'function');
  const info = await page.evaluate(t => {
    window.__reseed(); window.__warp(t);
    // the block's screen box, read off project() rather than guessed
    const pts = [[79, 6], [97, 6], [79, 60], [97, 60]].map(([x, y]) => project(x, y, 0));
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const r = cv.getBoundingClientRect();
    const sx = r.width / cv.width * (window.devicePixelRatio || 1);
    let bare = 0, ripeCells = 0, planted = 0, st = 0, cells = 0;
    for (let oy = 8; oy <= 50; oy += 7) for (let ox = 80; ox <= 90; ox += 5) {
      let bed = 0, pl = 0;
      for (let y = oy; y < oy + 2; y++) for (let x = ox; x < ox + 3; x++) {
        const i = y * GW + x;
        if (grid[i] !== BED) continue;
        bed++; cells++; if (bSp[i]) { pl++; planted++; st += bSt[i]; if (bSt[i] === 3) ripeCells++; }
      }
      if (bed && !pl) bare++;
    }
    return { hour: +hour.toFixed(2), phase: +seasonPhase.toFixed(3), warmth: +warmth.toFixed(2),
             cap: bloomCap(), ripe: ripePlots(), bare, planted, cells, ripeCells,
             stage: +(st / Math.max(1, planted)).toFixed(2),
             box: { x: Math.min(...xs) * sx, y: Math.min(...ys) * sx,
                    w: (Math.max(...xs) - Math.min(...xs)) * sx,
                    h: (Math.max(...ys) - Math.min(...ys)) * sx } };
  }, s.t);
  await page.waitForTimeout(700);              // let the paused rAF paint the warped state
  const clip = { x: Math.max(0, info.box.x - 20), y: Math.max(0, info.box.y - 20),
                 width: Math.min(1400, info.box.w + 40), height: Math.min(900, info.box.h + 40) };
  await page.screenshot({ path: join(OUT, `allot-${LABEL}-${s.name}.png`), clip });
  console.log(`${s.name.padEnd(15)} hour ${String(info.hour).padStart(5)}  phase ${info.phase}  warmth ${info.warmth}  ` +
    `cap ${info.cap}  ripe ${String(info.ripe).padStart(2)}/17  bare ${info.bare}  ` +
    `planted ${info.planted}/${info.cells}  ripe cells ${info.ripeCells}  mean stage ${info.stage}` +
    (errs.length ? `  PAGE ERROR ${errs[0]}` : ''));
  await page.close();
}
await browser.close();
