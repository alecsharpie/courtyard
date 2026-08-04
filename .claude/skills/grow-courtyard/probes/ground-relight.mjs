#!/usr/bin/env node
/* Anything drawn into the CACHED ground layer is a STAIRCASE IN TIME even when the
 * term driving it is perfectly smooth: the layer only relights when `lightBucket`
 * changes, and that bucket carries the hour at 1/4 h and cover at 1/6. So the real
 * question for any new ground-layer term is never "is it smooth" — it is "is MY
 * staircase worse than the one already there". Ride a front up on the real slew and
 * measure the luma jump at every rebuild, against the same ride in an older build.
 * Also times one relight clear vs lidded: a cached pass is not free, it is amortised,
 * and a rebuild lands a couple of times a second.
 *
 *   node ground-relight.mjs [ref]        default ref HEAD; a git rev or a path  */
import { homedir, tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { writeFileSync, existsSync } from 'node:fs';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;

const REPO = fileURLToPath(new URL('../../../../', import.meta.url));
const REF = process.argv[2] || 'HEAD';
let refFile = resolve(REF);
if (!existsSync(refFile)){
  refFile = join(tmpdir(), `courtyard-${REF.replace(/\W/g, '_')}.html`);
  writeFileSync(refFile, execFileSync('git', ['show', `${REF}:courtyard.html`], { cwd: REPO }));
}

async function run(file){
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1600, height: 950 } });
  p.on('pageerror', e => console.log('PAGE ERROR', file, e.message));
  await p.goto(pathToFileURL(file).href + '?seed=42&t=0&pause');
  await p.waitForFunction(() => window.__warp);
  /* __warp does no drawing, so the cached layer only relights on a real frame —
   * round-trip to rAF between steps. Safe here because ?pause freezes the sim
   * between round-trips, so nothing advances that this probe is measuring. */
  await p.evaluate(() => { window.__reseed(); window.__warp(175); cloud = 0.30; cloudTgt = 1.0; });
  const rows = [];
  for (let i = 0; i < 90; i++){
    rows.push(await p.evaluate(() => {
      frontLeft = 1e9;                       // no new front: ride this one all the way up
      window.__warp(0.5);
      return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => {
        const d = gtx.getImageData(0, 0, gcv.width, gcv.height).data;
        let s = 0, n = 0;
        for (let k = 0; k < d.length; k += 4 * 37){ s += 0.299*d[k] + 0.587*d[k+1] + 0.114*d[k+2]; n++; }
        r([+cloud.toFixed(3), +(s/n).toFixed(3)]);
      })));
    }));
  }
  // …and what one relight COSTS, clear vs lidded — the blur is per-rebuild, not per
  // frame, but a rebuild happens a couple of times a second, so it still has to be free
  const cost = await p.evaluate(() => {
    const out = {};
    for (const c of [0.10, 0.95]){
      cloud = cloudTgt = c;
      drawGround();                                   // once to warm
      const t0 = performance.now();
      for (let i = 0; i < 40; i++) drawGround();
      out[c] = +((performance.now() - t0) / 40).toFixed(2);
    }
    return out;
  });
  await b.close();
  return { rows, cost };
}

const A = await run(refFile), C = await run(join(REPO, 'courtyard.html'));
const a = A.rows, c = C.rows;
const steps = r => r.slice(1).map((v, i) => Math.abs(v[1] - r[i][1])).filter(v => v > 0.0005);
const sa = steps(a).sort((x, y) => y - x), sc = steps(c).sort((x, y) => y - x);
console.log('cover 0.30 -> 1.00 on the real slew, ground layer sampled every 0.5s sim');
console.log(`${REF.padEnd(4)}  rebuild jumps: n=${sa.length}  max ${sa[0].toFixed(3)}  p90 ${sa[Math.floor(sa.length*0.1)].toFixed(3)}  median ${sa[sa.length>>1].toFixed(3)}`);
console.log(`here  rebuild jumps: n=${sc.length}  max ${sc[0].toFixed(3)}  p90 ${sc[Math.floor(sc.length*0.1)].toFixed(3)}  median ${sc[sc.length>>1].toFixed(3)}`);
console.log(`\nground relight cost, ms/rebuild:  ${REF} ${A.cost[0.1]} (clear) / ${A.cost[0.95]} (lid)   here ${C.cost[0.1]} / ${C.cost[0.95]}`);
console.log(`\ncover   ${REF} luma   here luma`);
for (let i = 0; i < a.length; i += 6) console.log(`${a[i][0].toFixed(3)}  ${a[i][1].toFixed(2).padStart(10)}  ${c[i][1].toFixed(2).padStart(10)}`);
