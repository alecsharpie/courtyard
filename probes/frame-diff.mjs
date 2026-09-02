/* frame-diff.mjs — every changed pixel, HEAD -> working tree, at a pinned instant.
 *
 * The census proves the town's STATE is bit-identical; this proves the DRAW is too
 * everywhere but where you meant to change it — which is the one thing a census cannot
 * see and the regression this codebase actually suffers from (a draw-order fault
 * somewhere you were not editing). Both builds are rendered by the same script in the same session,
 * __reseed()ed and __warp()ed identically, and the canvas is read in the SAME evaluate
 * as the draw: a ?pause'd page still runs rAF, so a screenshot taken after it is a later
 * frame. A sim FINGERPRINT is carried through and the run is refused unless it matches.
 *
 * The verdict is a block map rather than a box test. #136's first version projected the
 * new draws' own bounding boxes and asked whether every changed pixel fell inside them;
 * it flagged all 768 as strays, and the fault was the INSTRUMENT — project()'s answers
 * are not the canvas pixels the frame is finally composited at. The block map assumes
 * nothing: it just says which sixteenth of the picture moved.
 *
 *   node probes/frame-diff.mjs [seed] [simT] [vpW] [vpH]
 */
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;

/* the HEAD fixture is REGENERATED from git on every run rather than read out of a
 * scratch copy: a stale fixture is a control that tests nothing (LAW). */
writeFileSync('.probe-head.html', execFileSync('git', ['show', 'HEAD:courtyard.html']));
const files = { HEAD: '.probe-head.html', cand: 'courtyard.html' };
const seed = +(process.argv[2] || 7), t = +(process.argv[3] || 175);
const W = +(process.argv[4] || 1600), H = +(process.argv[5] || 950);
if (!Number.isFinite(seed) || !Number.isFinite(t)){ console.log('usage: probe-barge-diff.mjs <seed> <simT> [w] [h]'); process.exit(1); }
const b = await chromium.launch();
const grab = async (path, tag) => {
  const tmp = `/tmp/probe-render-${tag}.html`;          // a URL apiece: chromium caches file://
  writeFileSync(tmp, readFileSync(path, 'utf8'));
  const pg = await b.newPage({ viewport: { width: W, height: H } });
  const errs = []; pg.on('pageerror', e => errs.push(String(e)));
  await pg.goto(pathToFileURL(tmp).href + `?pause&seed=${seed}&t=0`);
  await pg.waitForFunction('window.__census');
  const out = await pg.evaluate((t) => {
    window.__reseed(); window.__warp(t);
    drawScene(window.__census().clock.simT, 1 / 30);
    const c = document.querySelector('canvas');
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height);
    const bg = window.__entities().find(o => o.kind === 'barge');
    return { w: c.width, h: c.height, data: Array.from(d.data),
             barge: bg ? bg.act + ' y=' + bg.y.toFixed(2) : 'none',
             fp: JSON.stringify(window.__census().clock) };
  }, t);
  await pg.close();
  if (errs.length){ console.log('PAGE ERROR in ' + path + ': ' + errs[0]); process.exit(1); }
  return out;
};
const A = await grab(files.HEAD, 'head'), B = await grab(files.cand, 'cand');
await b.close();
if (A.fp !== B.fp){ console.log('FINGERPRINT DIFFERS — refusing:\n  HEAD ' + A.fp + '\n  cand ' + B.fp); process.exit(1); }
console.log(`seed ${seed}  simT ${t}  viewport ${W}x${H}  canvas ${A.w}x${A.h}`);
console.log('fingerprint identical: ' + A.fp);
console.log('barge  HEAD: ' + A.barge + '   cand: ' + B.barge);
let n = 0, x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
const diff = (i) => A.data[i] !== B.data[i] || A.data[i+1] !== B.data[i+1] || A.data[i+2] !== B.data[i+2];
for (let i = 0; i < A.data.length; i += 4) if (diff(i)){
  n++; const p = (i / 4) | 0, px = p % A.w, py = (p / A.w) | 0;
  if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py;
}
console.log(`changed pixels: ${n} of ${A.w * A.h} (${(100 * n / (A.w * A.h)).toFixed(3)}%)`);
if (!n){ console.log('IDENTICAL — the moorings did not draw either; check the instant'); process.exit(0); }
console.log(`bounding box: x ${x0}..${x1} (${x1-x0+1} px of ${A.w})  y ${y0}..${y1} (${y1-y0+1} px of ${A.h})`);
const BX = 16, BY = 12, map = [];
for (let by = 0; by < BY; by++){ let row = '';
  for (let bx = 0; bx < BX; bx++){
    let hit = 0;
    const px0 = Math.floor(bx * A.w / BX), px1 = Math.floor((bx + 1) * A.w / BX);
    const py0 = Math.floor(by * A.h / BY), py1 = Math.floor((by + 1) * A.h / BY);
    for (let py = py0; py < py1 && !hit; py++) for (let px = px0; px < px1; px++)
      if (diff((py * A.w + px) * 4)){ hit = 1; break; }
    row += hit ? '#' : '.'; }
  map.push(row); }
console.log('block map, 16 x 12 over the whole picture (# = some pixel moved):');
for (const r of map) console.log('  ' + r);
