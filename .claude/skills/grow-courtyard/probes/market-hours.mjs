#!/usr/bin/env node
/* market-hours — the b207 success test as a picture: ONE market day, photographed at
 * mid-morning, after lunch and at four o'clock, cropped to the pitch.
 *
 * "On a market day the boards are visibly fuller at mid-morning than at four o'clock,
 * in the Street quarter, without needing a difference image to see it."
 *
 * One page per hour, for the reason market-shots.mjs spells out: drawing consumes R(),
 * so every host round-trip on a ?pause page moves the world. Each hour reseeds, warps
 * to its own instant inside a single evaluate, and is photographed once.
 *
 *   node market-hours.mjs [pathToHtml] [tag]     SEED=42 HOURS=10,13,16 node market-hours.mjs
 */
import { homedir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const FILE = resolve(process.argv[2] || join(REPO, 'courtyard.html'));
const TAG = process.argv[3] ? '-' + process.argv[3] : '';
const OUT = join(REPO, 'shots');
const SEED = +(process.env.SEED || 42);
const HOURS = (process.env.HOURS || '10,13,16').split(',').map(Number);
const DAY = +(process.env.MDAY || 10);
const DSF = +(process.env.DSF || 3);   // 1 = shipping pixels, 3 = the same crop magnified to read the pitches
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const errs = [], rows = [];
for (const h of HOURS) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 750 }, deviceScaleFactor: DSF });
  page.on('pageerror', e => errs.push(String(e)));
  await page.goto(`${pathToFileURL(FILE).href}?pause&seed=${SEED}&t=0`, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof window.__warp === 'function');
  const hit = await page.evaluate(({ h, d }) => {
    /* The SAME-CODE control (LAWS): the instant is drawn twice, once as it stands and
       once with the day's stock made inexhaustible — which is HEAD's picture exactly,
       a board refilled to capacity for as long as the market is open — and the mass
       that differs across the pitch band is the ink the afternoon has taken off. One
       input changed, one draw apart, dt pinned, read in the same evaluate as the draw. */
    const ink = () => {
      /* project() answers in CSS px because ctx carries setTransform(DPR,..); getImageData
         does NOT — it reads the backing store. The band is scaled into DEVICE px here or
         it lands up-left of the pitch, on blank wall, and reads 0 for everything. */
      const band = () => {
        const [ax, ay] = project(MARKET_STALLS[0].x - 2.6, MARKET_STALLS[0].y + 1, 0);
        const [bx] = project(MARKET_STALLS[2].x + 2.6, MARKET_STALLS[2].y + 1, 0);
        return { x: Math.floor(ax * DPR), y: Math.floor((ay - cellH * 2.4) * DPR),
                 w: Math.ceil((bx - ax) * DPR), h: Math.ceil(cellH * 2.2 * DPR) };
      };
      const B = band();
      const grab = () => { drawScene(simT, 0); return ctx.getImageData(B.x, B.y, B.w, B.h).data; };
      let bb = null;
      const mass = (a, b) => { let n = 0; bb = null;
        for (let i = 0; i < a.length; i += 4)
          if (Math.abs(a[i] - b[i]) + Math.abs(a[i+1] - b[i+1]) + Math.abs(a[i+2] - b[i+2]) > 24) {
            n++; const px = (i / 4) % B.w, py = (i / 4 / B.w) | 0;
            bb = bb ? [Math.min(bb[0], px), Math.min(bb[1], py), Math.max(bb[2], px), Math.max(bb[3], py)] : [px, py, px, py];
          }
        return n; };
      /* The control is HEAD's own board, not a bigger day. `mkStock = 1e9` looks like
         "an unspent day" and is not one: mkDemand() saturates at MK_STOCK_REF, so for
         any day already holding 60 units it leaves the afternoon's draw-down EXACTLY
         where it was and the diff reads a truthful 0 against a control that changed
         nothing. What HEAD drew is `nf = sh.length` — the board full for as long as the
         stall is up — so that is the one input moved here. The crates are stubbed out
         of the board comparison and measured on their own after, because mkStock feeds
         both pictures and the two bounds bind at different hours. */
      const overFn = window.drawMarketOver, leftFn = window.mkLeft, crFn = window.mkCrateLeft;
      window.drawMarketOver = () => {};
      const a = grab(), a2 = grab();                     // the FLOOR: same code, twice
      const fl = mass(a, a2);
      window.mkLeft = i => mkShelfFor(i).length;         // HEAD's board: never spent
      const b = grab(); window.mkLeft = leftFn;
      const boardPx = mass(a, b), boardBB = bb;
      /* the DENOMINATOR: a bare board. Most of a full board is behind the trader and the
         browsers standing at it, so "46 px" means nothing until you know how many pixels
         of goods this camera can see AT ALL. Measured against the same full board. */
      window.mkLeft = () => 0; const e = grab(); window.mkLeft = leftFn;
      const allPx = mass(b, e);
      window.drawMarketOver = overFn;                    // and now the stacks, boards live
      const c = grab();
      window.mkCrateLeft = () => mkCrates.length;        // HEAD's stacks: never carried in
      const d = grab(); window.mkCrateLeft = crFn;
      const cratePx = mass(c, d);
      drawScene(simT, 0);                                // leave the page showing the real thing
      return { px: boardPx, floor: fl, over: cratePx, all: allPx, of: B.w * B.h, box: B, bb: boardBB, cellH, cellW };
    };
    window.__reseed();
    for (let k = 0; k < 40000; k++) {
      window.__warp(0.25);
      if (day === d && isMarketDay() && hour >= h && hour < h + 0.25)
        return { day, hour: +hour.toFixed(2), open: +marketOpen().toFixed(2), close: +marketClose().toFixed(2),
                 stock: +mkStock.toFixed(1), board: +mkBoard().toFixed(2), reserve: +mkReserve().toFixed(2),
                 cap: mkShelf.length, crates: +mkCrateLeft().toFixed(2), nc: mkCrates.length,
                 pitch: [0, 1, 2].map(i => +mkLeft(i).toFixed(2)), ink: ink() };
    }
    return null;
  }, { h, d: DAY });
  if (!hit) { console.log(`  ${h}.00: no market day ${DAY} found`); await page.close(); continue; }
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  const box = await page.locator('canvas').boundingBox();
  await page.screenshot({ path: join(OUT, `mkhour-${h}${TAG}.png`),
    clip: JSON.parse(process.env.CLIP || '[340,450,260,135]').reduce((o, v, i) => (o[['x','y','width','height'][i]] = v + (i === 0 ? box.x : i === 1 ? box.y : 0), o), {}) });
  rows.push(hit); await page.close();
}
await browser.close();
if (errs.length) { console.error('PAGE ERRORS', errs.slice(0, 3)); process.exit(1); }
console.log(`\nseed ${SEED}, day ${DAY} — one market, three hours (shots/mkhour-*${TAG}.png)`);
console.log('hour   board/cap   crates   pitches per stall   board ink gone by this hour            (crate ink)');
for (const r of rows)
  console.log(`${String(r.hour).padStart(5)}   ${String(r.board).padStart(5)}/${r.cap}   ${String(r.crates).padStart(5)}/${r.nc}   ${r.pitch.join('  ')}   ${String(r.ink.px).padStart(4)} of ${String(r.ink.all).padStart(4)} px of VISIBLE board ink = ${(100*r.ink.px/r.ink.all).toFixed(0).padStart(3)}% (floor ${r.ink.floor})   crates ${String(r.ink.over).padStart(4)} px`);
if (rows.length > 1) {
  const a = rows[0], z = rows[rows.length - 1];
  console.log(`\n${a.hour} -> ${z.hour}: board ${a.board} -> ${z.board} units, crates ${a.crates} -> ${z.crates}`);
}
