#!/usr/bin/env node
/* #138 — does the POINTER name the plots' furniture? A probe that calls lookAt(project(...))
 * proves the naming function and nothing about the pointer, so this drives a real
 * mousemove where each piece is DISPLAYED (canvas px -> CSS through the canvas rect, the
 * inverse of evPx) and reads back what the town then says. One page per piece, one move
 * per page, at the Street quarter — the camera that frames the block.
 *   Every kind is asked twice: once on the piece, and once on the bare grass a cell and a
 * half SOUTH of it. The second is the control — a hit box that answers everywhere is not
 * a hit box, and this is the exact failure roofFurnAt had at #123. */
import { homedir } from 'node:os'; import { join, resolve } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const arg=(n,d)=>{const i=process.argv.indexOf(n);return i!==-1&&process.argv[i+1]?process.argv[i+1]:d;};
const SEED = arg('--seed','42');
const FILE = pathToFileURL(resolve(process.cwd(), arg('--file','courtyard.html'))).href;

/* the sim time each kind wants: canes in the warm half, cloches in the cold one, the
 * barrow only while somebody kneels — warped to until one is on, then held. */
const CASES = [
  ['shed',   175], ['bay',    175], ['butt',   175],
  ['canes',  175], ['cloche', 1000], ['barrow', null],
];
const browser = await chromium.launch();
let fails = 0;
for (const [kind, T] of CASES){
  const ctx = await browser.newContext({viewport:{width:1600,height:950}, deviceScaleFactor:1});
  const p = await ctx.newPage(); const errs=[]; p.on('pageerror', e=>errs.push(String(e)));
  await p.goto(FILE + `?pause&t=0&seed=${SEED}`);
  await p.waitForFunction(() => typeof window.__where === 'function');
  // put the camera on the Street and get to an instant where this kind is showing
  const spot = await p.evaluate(({kind, T}) => {
    __reseed();
    if (T !== null) __warp(T);
    else { let n = 0; do { __warp(0.5); n++; } while (!ALLOT_FURN.some(f => f.kind==='barrow' && allotFurnOn(f)) && n < 6000); }
    __where(2); __where(2, 5); drawScene(simT, 1/30);
    const f = ALLOT_FURN.find(q => q.kind === kind && allotFurnOn(q));
    if (!f) return null;
    const b = PLOT_BOX[kind], d = DPR || 1, r = cv.getBoundingClientRect();
    // the inverse of evPx: canvas px -> CSS px through the canvas rect
    const toCss = q => [r.left + q[0] * (r.width || W) / W, r.top + q[1] * (r.height || H) / H];
    const mid = project(f.x, f.y, (b.hgt + (b.rid||0)) * 0.45);
    const off = project(f.x, f.y + 1.5, 0);
    return { on: toCss(mid), off: toCss(off), where: [f.ox, f.oy], hour: +hour.toFixed(2), season: +season().toFixed(3) };
  }, {kind, T});
  if (!spot){ console.log(kind.padEnd(7), 'NO PIECE SHOWING — cannot test'); fails++; await ctx.close(); continue; }
  await p.mouse.move(spot.on[0], spot.on[1]);
  const onName = await p.evaluate(() => lookAt(hoverPx));
  await p.mouse.move(spot.off[0], spot.off[1]);
  const offName = await p.evaluate(() => lookAt(hoverPx));
  const ok = onName && onName !== offName;
  if (!ok) fails++;
  console.log(kind.padEnd(7), (ok ? 'OK  ' : 'FAIL'),
              'plot', String(spot.where).padEnd(7), 'h' + spot.hour,
              '| on: "' + onName + '"  | 1.5 cells south: "' + offName + '"');
  if (errs.length){ console.error('PAGE ERROR', errs[0]); fails++; }
  await ctx.close();
}
await browser.close();
console.log(fails ? `\n${fails} FAILED` : '\nall six kinds named by a real pointer, each distinct from the ground beside it');
process.exit(fails ? 1 : 0);
