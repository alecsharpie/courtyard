/* probe-mirror.mjs (#163) — does the reed fringe stand in the water, and does the
 * terrace's shade go INTO the near river? Two regions, two builds, one same-code floor.
 *
 *   node probe-mirror.mjs            # HEAD vs working tree, day + evening
 *   node probe-mirror.mjs --sweep    # which sim instants put shade on the water at all
 */
import { homedir } from 'node:os';
import { existsSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const REPO = process.cwd();
const CAND = pathToFileURL(resolve(REPO, 'courtyard.html')).href;
const HEADF = '/tmp/head-courtyard.html';
writeFileSync(HEADF, execSync('git show HEAD:courtyard.html', { maxBuffer: 1 << 28 }));
const HEAD = pathToFileURL(HEADF).href;

const REG = {                       // world boxes, as [x0,y0,x1,y1] in cells
  reeds: [113, 3, 128, 63],         // the fringe and the water south of it
  nearRiver: [113, 78, 128, 90],    // the reach the terrace throws across
};

const browser = await chromium.launch();
async function open(url){
  const ctx = await browser.newContext({ viewport:{width:1600,height:950}, deviceScaleFactor:1 });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto(`${url}?seed=42&t=0&pause`, { waitUntil:'load' });
  await p.waitForFunction(() => typeof window.__warp === 'function');
  return { ctx, p, errs };
}
/* One evaluate: reseed, warp, draw a PINNED frame, then read the canvas in the SAME
 * evaluate — a ?pause'd page still runs rAF and would repaint under us. */
async function shot(p, t, regions){
  return p.evaluate(({ t, regions }) => {
    window.__reseed(); window.__warp(t);
    drawScene(simT, 1/30);
    const g = document.getElementById('cv').getContext('2d');
    const dpr = DPR, out = {};
    for (const [name, [x0,y0,x1,y1]] of Object.entries(regions)){
      const a = project(x0, y0, 0), b = project(x1, y1, 0);
      const sx = Math.max(0, Math.round(Math.min(a[0],b[0]) * dpr));
      const sy = Math.max(0, Math.round(Math.min(a[1],b[1]) * dpr));
      const sw = Math.max(1, Math.round(Math.abs(b[0]-a[0]) * dpr));
      const sh = Math.max(1, Math.round(Math.abs(b[1]-a[1]) * dpr));
      out[name] = { sx, sy, sw, sh, px: Array.from(g.getImageData(sx, sy, sw, sh).data) };
    }
    // the two counts this iteration is about
    let wetSub = 0, drySub = 0, nearWet = 0, nearRows = [];
    for (let y = 0; y < WH; y++){ let nr = 0;
      for (let mx = 0; mx < BSH_W; mx++){
        if (!shMask[y*BSH_W+mx]) continue;
        const tt = grid[y*GW + ((mx/BSH_SUB)|0)];
        const CH = (typeof onChannel === 'function') ? onChannel : ((x,y,t)=>(t===WATER||t===16)&&x<RIVER_X1&&x>=(y>=LN_WALK_S?QUAY_X0:RIVER_X0));
        if (CH((mx/BSH_SUB)|0, y, tt)){ wetSub++; if (y >= LN_WALK_S){ nearWet++; nr++; } }
        else drySub++;
      }
      if (nr) nearRows.push(y + ':' + nr);
    }
    return { out, wetSub, drySub, nearWet, nearRows, f: sunShadeF(),
             casters: (typeof REED_CASTERS !== 'undefined' ? REED_CASTERS.length : 0),
             reedCells: (typeof REED_RUNS !== 'undefined' ? REED_RUNS.reduce((s,r)=>s+r.cells.length,0) : 0),
             hour: __census().clock.hour, day: __census().clock.day, season: __census().clock.season,
             wind: windF().toFixed(3) };
  }, { t, regions });
}
function diff(A, B){
  let n = 0, sum = 0;
  for (let i = 0; i < A.length; i += 4){
    const d = Math.max(Math.abs(A[i]-B[i]), Math.abs(A[i+1]-B[i+1]), Math.abs(A[i+2]-B[i+2]));
    if (d > 3){ n++; sum += d; }
  }
  return { px: n, mean: n ? +(sum/n).toFixed(1) : 0 };
}

if (process.argv.includes('--sweep')){
  const { p, ctx } = await open(CAND);
  console.log('  simT   day  h     season   f      wetSub  drySub');
  for (let t = 20; t < 1600; t += 20){
    const r = await shot(p, t, {});
    if (r.wetSub) console.log(`  ${String(t).padStart(5)}  ${r.day}  ${r.hour.toFixed(1).padStart(4)}  ${String(r.season).padEnd(8)} ${r.f.toFixed(3)}  ${String(r.wetSub).padStart(5)}  ${String(r.drySub).padStart(6)}`);
  }
  await ctx.close(); await browser.close(); process.exit(0);
}

const TIMES = (process.argv.includes('--t')
  ? [ +process.argv[process.argv.indexOf("--t")+1] ]
  : [175, 300, 1160]);

/* A FRESH page per instant, and this is not fussiness: the clock is paused but rAF keeps
 * running between host round-trips, so `windT` — which every reed blade leans on — drifts
 * by however long node took. Walking one page 175 -> 300 -> 1160 put 6183 px between two
 * runs of the SAME BUILD at the third sample. Suspect the instrument first. */
console.log('probe-mirror — seed 42, 1600x950, drawScene pinned, fresh page per instant\n');
for (const t of TIMES){
  const A = await open(CAND), B = await open(HEAD), C = await open(CAND);   // C is the same-code control
  const a = await shot(A.p, t, REG), b = await shot(B.p, t, REG), c = await shot(C.p, t, REG);
  console.log(`simT ${t}  day ${a.day} h${a.hour.toFixed(1)} ${String(a.season)}  wind ${a.wind}  sunShadeF ${a.f.toFixed(3)}`);
  console.log(`  reed casters ${a.casters} over ${a.reedCells} cells (HEAD ${b.casters}/${b.reedCells})`);
  console.log(`  shaded sub-cells  wet ${a.wetSub} dry ${a.drySub}   (HEAD wet ${b.wetSub} dry ${b.drySub})`);
  console.log(`  near river (y>=79) ${a.nearWet} sub-cells  [${a.nearRows.join(' ')}]`);
  for (const k of Object.keys(REG)){
    const ctl = diff(a.out[k].px, c.out[k].px);
    const d = diff(a.out[k].px, b.out[k].px);
    const box = a.out[k];
    console.log(`  ${k.padEnd(10)} ${box.sw}x${box.sh}px   control ${ctl.px}   cand-vs-HEAD ${d.px} px (mean d ${d.mean})` +
                `  = ${ctl.px ? (d.px/ctl.px).toFixed(1)+'x floor' : 'floor 0'}`);
  }
  for (const h of [A,B,C]){ if (h.errs.length) console.log('PAGE ERRORS', h.errs); await h.ctx.close(); }
  console.log('');
}
await browser.close();
