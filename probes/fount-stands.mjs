#!/usr/bin/env node
/* #144 — the plaza's third place, and the east's share of the lane roll.
 *
 * Two assertions the census cannot make:
 *  (a) every FOUNT_STANDS entry is LEGAL GROUND — PATH under the feet, off the basin
 *      (PAVING.plaza.keep), inside the plaza box — and every pair is at least
 *      PAIR_GAP + PAIR_MIN apart, because a party at a stand is a parent AND a child.
 *  (b) eastEdges() at pull 1 is EXACTLY the cascade HEAD was written with. A green
 *      anchor is only evidence if the predicate can also be non-green, so the same
 *      call is made at the top of the range and must differ.
 */
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = `${homedir()}/.claude/skills/screenshot-verify/node_modules/playwright/index.js`;
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const SRC = resolve(process.argv[2] || 'courtyard.html');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 700 } });
const errs = []; page.on('pageerror', e => errs.push(String(e)));
await page.goto(pathToFileURL(SRC).href + '?seed=7&pause');
await page.waitForFunction('typeof __warp === "function"');
const r = await page.evaluate(`(() => {
  const kp = PAVING.plaza.keep;
  const stands = FOUNT_STANDS.map(s => {
    const gx = Math.floor(s.x), gy = Math.floor(s.y);
    return { x:+s.x.toFixed(2), y:+s.y.toFixed(2), tile: grid[gy*GW+gx],
      isPath: grid[gy*GW+gx] === PATH,
      inBasin: s.x > kp.x0 - 0.6 && s.x < kp.x1 + 0.6 && s.y > kp.y0 - 0.6 && s.y < kp.y1 + 0.6,
      inPlaza: s.x >= PLAZA_X0 && s.x < PLAZA_X1 && s.y >= 3 && s.y < 61 };
  });
  let least = 1e9;
  for (let i=0;i<FOUNT_STANDS.length;i++) for (let j=i+1;j<FOUNT_STANDS.length;j++)
    least = Math.min(least, Math.hypot(FOUNT_STANDS[i].x-FOUNT_STANDS[j].x, FOUNT_STANDS[i].y-FOUNT_STANDS[j].y));
  // nearest bench SEAT to any stand: a family at a stand must not merge with one on a bench
  let leastBench = 1e9;
  for (const s of FOUNT_STANDS) for (const b of PLAZA_BENCHES)
    leastBench = Math.min(leastBench, Math.hypot(s.x-(b.x+0.5), s.y-(b.y+1.0)));
  return { stands, least:+least.toFixed(3), leastBench:+leastBench.toFixed(3),
    basin: {x0:kp.x0,x1:kp.x1,y0:kp.y0,y1:kp.y1},
    need: PAIR_GAP + PAIR_MIN, pairMin: PAIR_MIN,
    edgesRest: eastEdges(EAST_CAP0).map(v => +v.toFixed(4)),
    edgesLow:  eastEdges(2).map(v => +v.toFixed(4)),
    edgesFull: eastEdges(EAST_CAP1).map(v => +v.toFixed(4)),
    edgesPeak: eastEdges(16).map(v => +v.toFixed(4)),
    eastShareRest: +(eastPull(EAST_CAP0)*0.20).toFixed(4),
    eastShareFull: +(eastPull(EAST_CAP1)*0.20).toFixed(4) };
})()`);
await browser.close();
if (errs.length){ console.error('PAGE ERROR', errs[0]); process.exit(2); }

const HEAD_EDGES = [0.48, 0.53, 0.58, 0.62, 0.68, 0.74];
let fail = 0;
const ok = (c, msg) => { console.log(`  ${c ? 'PASS' : 'FAIL'}  ${msg}`); if (!c) fail++; };
console.log(`\n=== fount-stands  ${SRC} ===\n\n-- (a) the stands are places --`);
console.log(`  basin box  x ${r.basin.x0}..${r.basin.x1}  y ${r.basin.y0}..${r.basin.y1}`);
for (const s of r.stands) console.log(`  stand (${s.x}, ${s.y})  tile ${s.tile}  path ${s.isPath}  inBasin ${s.inBasin}  inPlaza ${s.inPlaza}`);
ok(r.stands.every(s => s.isPath), 'every stand is on PATH');
ok(r.stands.every(s => !s.inBasin), 'no stand is in the basin');
ok(r.stands.every(s => s.inPlaza), 'every stand is inside the plaza box');
ok(r.least >= r.need, `least stand-to-stand ${r.least} >= PAIR_GAP+PAIR_MIN ${r.need.toFixed(2)}`);
ok(r.leastBench >= r.need, `least stand-to-bench-seat ${r.leastBench} >= ${r.need.toFixed(2)}`);

console.log('\n-- (b) the roll cascade --');
const same = (a, b) => a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) < 1e-9);
console.log(`  HEAD          ${HEAD_EDGES.join(' ')}`);
console.log(`  cap 2         ${r.edgesLow.join(' ')}`);
console.log(`  cap EAST_CAP0 ${r.edgesRest.join(' ')}`);
console.log(`  cap EAST_CAP1 ${r.edgesFull.join(' ')}`);
console.log(`  cap 16 (peak) ${r.edgesPeak.join(' ')}`);
ok(same(r.edgesRest, HEAD_EDGES), 'at rest the cascade is EXACTLY HEAD\'s six numbers');
ok(same(r.edgesLow, HEAD_EDGES), 'below the knee it is HEAD\'s too (the night floor is untouched)');
ok(!same(r.edgesFull, HEAD_EDGES), 'the control fires: at a full cap the edges DIFFER');
ok(same(r.edgesFull, r.edgesPeak), 'the pull is clamped — cap 16 is cap EAST_CAP1');
ok(r.edgesPeak[5] < 1 && r.edgesPeak.every((v, i, A) => i === 0 || v > A[i-1]), 'edges stay ordered and inside [0,1)');
console.log(`  east share of the roll  ${r.eastShareRest} at rest -> ${r.eastShareFull} at a full cap`);
console.log(`\n${fail ? 'FAIL ' + fail : 'ALL PASS'}\n`);
process.exit(fail ? 1 : 0);
