#!/usr/bin/env node
/* world-edge-framing.mjs — what each quarter camera actually CONTAINS.
 *
 *   node probes/world-edge-framing.mjs                    # HEAD or working tree
 *   node probes/world-edge-framing.mjs --page /tmp/head.html
 *
 * Two questions, both asked of the page's own project()/unproject() rather than of a
 * screenshot, so the answer is a number and not an opinion:
 *
 *  1. EXTENT. Where is the frame's west and east edge, in world x, at its TOP row —
 *     the row the PINCH makes worst? Past GW is the field edge #119 painted (the ground
 *     cache runs XLO..XHI, i.e. -12..GW+12); past XHI is real void.
 *  2. SUBJECTS. Is the thing a quarter is NAMED after inside the picture (the canvas
 *     above sillTop(), which drawSill paints over)? Reported per target, per quarter,
 *     per framing, with the margin in px so a near miss reads as a near miss.
 *
 * Also prints s per quarter and the cardinal letter size the arrow vane draws at
 * (6 * viewS px), which is c150's other half.
 */
import { homedir } from 'node:os';
import { existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');
const arg = (n, d) => { const i = process.argv.indexOf(n); return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const pageArg = arg('--page', join(REPO, 'courtyard.html'));
const PAGE = pathToFileURL(resolve(REPO, pageArg)).href;
const T = +arg('--t', '175');
const SEED = arg('--seed', '42');
if (!existsSync(resolve(REPO, pageArg))) { console.error('no such page: ' + pageArg); process.exit(1); }

const SIZES = [{ name: 'desktop', w: 1600, h: 950 }, { name: 'phone', w: 390, h: 844 }];

const browser = await chromium.launch();
let bad = 0;
for (const sz of SIZES) {
  const ctx = await browser.newContext({ viewport: { width: sz.w, height: sz.h }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  p.on('pageerror', e => { console.error('  PAGE ERROR: ' + e); bad++; });
  await p.goto(`${PAGE}?pause&t=0&seed=${SEED}`);
  await p.waitForFunction(() => typeof window.__where === 'function');
  const rows = await p.evaluate(async ({ t }) => {
    __reseed(); __warp(t);
    const out = [];
    for (let n = 0; n < QUARTERS.length; n++) {
      __where(n); __where(n, 5);                       // switch, then run the ease out
      const pic = sillTop();
      const targets = {
        'west wall (x=0)':      project(0, 30, 0),
        'field gate':           project(FIELD_GAP[0] + 0.9, FIELD_GAP[1], FIELD_H * 1.35),
        'track, out to field':  project(FIELD_X + 2.9, FIELD_GAP[1], 0.02),
        'hedge, north end':     project(FIELD_X - FIELD_D, FIELD_Y0, FIELD_H),
        'hedge, south end':     project(FIELD_X - FIELD_D, FIELD_Y1, FIELD_H),
        'arrow vane (CT)':      project(VANES[0].x, VANES[0].y, VANES[0].z),
        'weathercock (church)': project(VANES[1].x, VANES[1].y, VANES[1].z),
        'church tower top':     project((CHURCH.tx0 + CHURCH.tx1) / 2, CHURCH.ty1, 13.6),
        'murmuration roost':    [project(MUR_ROOSTS[0][0], 0, 0)[0], topPad + MUR_ROOSTS[0][1] * cellH],
        'bandstand':            project(BANDSTAND.x, BANDSTAND.y, 1.2),
        'eyot / willow':        project(124.3, 46, 0),
        'fountain':             project(105.5, 30, 0),
        'the linden':           project(32, 30, 0),
      };
      const hit = {};
      for (const k in targets) {
        const [x, y] = targets[k];
        const mx = Math.min(x, W - x), my = Math.min(y, pic - y);
        hit[k] = { x: +x.toFixed(0), y: +y.toFixed(0), in: mx >= 0 && my >= 0, m: +Math.min(mx, my).toFixed(0) };
      }
      // the frame's own world extent, at the top row (worst for BOTH edges under PINCH)
      const corner = (sx, sy) => unproject(sx, sy)[0];
      out.push({
        n, name: QUARTERS[n].name, s: +viewS.toFixed(3), cardPx: +(6 * viewS).toFixed(1),
        topRow: +unproject(0, 0)[1].toFixed(1),
        wTop: +corner(0, 0).toFixed(1), eTop: +corner(W, 0).toFixed(1),
        wBot: +corner(0, pic).toFixed(1), eBot: +corner(W, pic).toFixed(1),
        hit,
      });
    }
    return { rows: out, XLO, XHI, GW, pic: sillTop(), W, H };
  }, { t: T });
  console.log(`\n=== ${sz.name} ${sz.w}x${sz.h} ===  picture = 0..${rows.pic.toFixed(0)} of ${rows.H} px;  ground cache paints x ${rows.XLO}..${rows.XHI} (GW ${rows.GW})`);
  for (const r of rows.rows) {
    const void_ = (r.wTop < rows.XLO ? ' VOID-W' : '') + (r.eTop > rows.XHI ? ' VOID-E' : '');
    console.log(`\n  ${r.name.padEnd(10)} s=${String(r.s).padEnd(6)} cardinals ${r.cardPx}px   world x ${r.wTop} .. ${r.eTop} at top row ${r.topRow}  (${r.wBot} .. ${r.eBot} at the sill)${void_}`);
    for (const k in r.hit) {
      const h = r.hit[k];
      console.log(`      ${h.in ? ' in ' : 'OUT '} ${k.padEnd(22)} at (${String(h.x).padStart(5)},${String(h.y).padStart(5)})  margin ${String(h.m).padStart(6)} px`);
    }
  }
  await ctx.close();
}
await browser.close();
process.exit(bad ? 1 : 0);
