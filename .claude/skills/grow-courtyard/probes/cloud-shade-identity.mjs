/* Two claims, both against a HEAD control I run:
 *   1. a CLEAR sky (cover below the gate) is HEAD's frame exactly — a canvas hash, not a
 *      tolerance, because the pass returns before it touches ctx;
 *   2. after dark it is HEAD's frame too, at any cover.
 * Frames are drawn inside the evaluate at a pinned seed; the hash is FNV over every byte.
 *   node probe-shade-identity.mjs
 */
import { homedir } from 'node:os'; import { join, resolve } from 'node:path'; import { pathToFileURL, fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process'; import { writeFileSync, existsSync } from 'node:fs';
const REPO = fileURLToPath(new URL('../../../../', import.meta.url));
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const HERE = join(REPO, 'courtyard.html'), REF = '/tmp/head.html';
if (!existsSync(REF)) writeFileSync(REF, execFileSync('git', ['show', 'HEAD:courtyard.html'], { cwd: REPO, maxBuffer: 1 << 28 }));
/* cover, how far to warp ON FROM THE LAST CASE. __reseed() rewinds the PRNG and the
 * world, NOT the clock, so these are cumulative — the hour each case actually lands on is
 * read back off the page and the expectation is derived from it, never from the label. */
const CASES = [[0.00, 175], [0.02, 175], [0.039, 285], [0.45, 205], [0.45, 190], [0.45, 168], [0.9, 175], [0.02, 160],
               [0.45, 220], [0.30, 150], [0.7, 200], [0.039, 240]];
async function run(file, seed){
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  p.on('pageerror', e => console.log('PAGE ERROR', file, e.message));
  await p.goto(pathToFileURL(file).href + `?seed=${seed}&t=0&pause`);
  await p.waitForFunction(() => window.__warp);
  const out = await p.evaluate(CASES => CASES.map(([cover, t]) => {
    window.__reseed(); window.__warp(t);
    cloud = cloudTgt = cover; groundDirty = true;
    drawScene(simT, 1 / 30);
    const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
    let h = 2166136261 >>> 0;
    for (let i = 0; i < d.length; i++){ h ^= d[i]; h = Math.imul(h, 16777619) >>> 0; }
    return { hash: h.toString(16), hour: +hour.toFixed(2), daylight: +daylight.toFixed(2) };
  }), CASES);
  await b.close(); return out;
}
let bad = 0;
for (const seed of [42, 7]){
  const a = await run(REF, seed), b2 = await run(HERE, seed);
  console.log(`\nseed ${seed}`);
  for (let i = 0; i < CASES.length; i++){
    const [cover] = CASES[i];
    const same = a[i].hash === b2[i].hash;
    const lit = b2[i].daylight > 0.06;
    const mustDiffer = cover > 0.04 && lit;        // the pass's own gate, and nothing else
    const ok = mustDiffer ? !same : same;
    if (!ok) bad++;
    console.log(`  cover ${cover.toFixed(3)} h${String(a[i].hour).padStart(5)} daylight ${String(a[i].daylight).padStart(4)}  `
      + `${same ? 'IDENTICAL to HEAD' : 'differs from HEAD'}  ${ok ? 'ok  ' : 'FAIL'}  expected ${mustDiffer ? 'a shadow' : 'HEAD exactly'}`);
  }
}
console.log(bad ? `\n${bad} case(s) FAILED` : '\nall cases as expected');
