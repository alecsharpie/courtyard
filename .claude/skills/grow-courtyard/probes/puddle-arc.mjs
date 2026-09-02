/* #122 probe — the standing water is real, per-cell, and retreats to the trodden places.
 * Every reading is on a page driven by __reseed/__warp/__setTime at a pinned seed, with
 * the wetness scalar DRIVEN to a chosen value, so each row is a fact about a point on
 * the DRYING ARC rather than about whether the day happened to be wet. Pixels are read
 * in-page with getImageData, and every difference is quoted against a SAME-CODE control:
 * the identical reseed+warp+drawScene procedure run twice at the same instant (LAWS:
 * ~1% of the frame is unpinned, so an absolute is meaningless without it). */
import { homedir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const FILE = process.env.PAGE || 'courtyard.html';
const PAGE = pathToFileURL(join(REPO, FILE)).href;
const br = await chromium.launch();
const open = async (seed) => {
  const p = await br.newPage({ viewport:{width:1600,height:950}, deviceScaleFactor:1 });
  await p.goto(`${PAGE}?pause&seed=${seed}`);
  await p.waitForFunction('window.__warp && window.__census');
  return p;
};
console.log(`page: ${FILE}\n`);

/* ---- 1. the field ---- */
{
  const p = await open(7);
  const r = await p.evaluate(() => {
    let paved = 0;
    for (let y = 0; y < WH; y++) for (let x = 0; x < GW; x++) if (pavedAt(x, y)) paved++;
    const h = PUDDLES.map(q => q.hollow);
    return { paved, pools: PUDDLES.length, lo: Math.min(...h).toFixed(2), hi: Math.max(...h).toFixed(2) };
  });
  console.log(`FIELD  ${r.paved} paved cells in the lane + cross street; ${r.pools} of them hold water (${(100*r.pools/r.paved).toFixed(1)}%), hollow ${r.lo}..${r.hi}`);
  await p.close();
}

/* ---- 2. the drying arc ---- */
for (const days of [1, 6, 14]){
  const p = await open(7);
  const r = await p.evaluate((d) => {
    __reseed(); __warp(d * 55);
    const wear = Array.from(paveWear);
    const out = [];
    const was = wetness;
    for (const w of [1.0, 0.8, 0.6, 0.5, 0.4, 0.32, 0.26]){
      wetness = w;
      const held = PUDDLES.filter(q => pudDepth(q) > 0.03);
      out.push({ w, n: held.length,
        area: held.reduce((s,q) => s + pudDepth(q) * q.rx * q.ry, 0),
        meanWear: held.length ? held.reduce((s,q) => s + wear[q.i], 0) / held.length : 0 });
    }
    wetness = was;
    return { out, wearCells: wear.filter(v => v > 0.05).length,
             wearMax: Math.max(...wear).toFixed(2),
             poolWear: (PUDDLES.reduce((s,q)=>s+wear[q.i],0)/PUDDLES.length).toFixed(3) };
  }, days);
  console.log(`\nARC day ${days}  — ${r.wearCells} paving cells carry feet (max ${r.wearMax}); mean wear under a pool ${r.poolWear}`);
  console.log('   wetness   pools   water-area   mean paveWear of the pools still holding');
  for (const o of r.out)
    console.log(`     ${o.w.toFixed(2)}    ${String(o.n).padStart(4)}     ${o.area.toFixed(1).padStart(6)}        ${o.meanWear.toFixed(4)}`);
  await p.close();
}

/* ---- 3. the look, in pixels ----
 * The lane band already carried a GLOBAL soft-light sheen for any wetness > 0, so a
 * wet-vs-dry diff is ~50% of the crop on HEAD too and says nothing about pools. The only
 * honest control is HEAD ITSELF at the SAME wetness — regenerated from git inside this
 * probe — which leaves exactly the standing water. */
{
  const { execSync } = await import('node:child_process');
  const { writeFileSync, unlinkSync } = await import('node:fs');
  writeFileSync(join(REPO, 'head-tmp.html'), execSync('git show HEAD:courtyard.html', { cwd: REPO, maxBuffer: 1 << 28 }));
  const openAt = async (file, seed) => {
    const pg = await br.newPage({ viewport:{width:1600,height:950}, deviceScaleFactor:1 });
    await pg.goto(`${pathToFileURL(join(REPO, file)).href}?pause&seed=${seed}`);
    await pg.waitForFunction('window.__warp && window.__census');
    return pg;
  };
  const B = { x: 150, y: 545, w: 1330, h: 155 };            // the lane band at 1600x950, located off a shot
  // FRESH PAGE per reading. Repeated __reseed+__warp on one page accumulates ground state
  // (c180), which showed up here as a 0.63% floor on a comparison that is provably 0.00%
  // when each reading gets its own page — i.e. the instrument, not the code.
  const grab = async (file, w, h, day) => { const pg = await openAt(file, 7); const r = await pg.evaluate(([w, h, day, B]) => {
    // WARP to the hour, never __setTime to it: nightF/daylight are STEPPED by the sim, so a
    // clock jump leaves the light where it stood and a "dusk" reading comes back in daylight.
    __reseed(); __warp(day * 55);
    for (let k = 0; k < 4000 && !(hour >= h && hour < h + 0.25); k++) __warp(0.05);
    raining = false; rainFall = 0; raindrops.length = 0; wetness = w;
    // the people are not the measurement, and they are the one thing NOT pinned across two
    // pages (c180: __reseed rewinds the PRNG, not the agents alive from page-load frames)
    agents.length = 0; birds.length = 0; leaves.length = 0; butterflies.length = 0;
    drawScene(simT, 1/30);
    return Array.from(ctx.getImageData(B.x, B.y, B.w, B.h).data);
  }, [w, h, day, B]); await pg.close(); return r; };
  const cmp = (A, C) => {
    let n = 0, sum = 0, peak = 0;
    for (let i = 0; i < A.length; i += 4){
      const d = Math.abs(A[i]-C[i]) + Math.abs(A[i+1]-C[i+1]) + Math.abs(A[i+2]-C[i+2]);
      if (d > 6){ n++; sum += d; } if (d > peak) peak = d;
    }
    return `${(400*n/A.length).toFixed(2).padStart(6)}%  mean ${(n?sum/n:0).toFixed(1).padStart(5)}  peak ${String(peak).padStart(3)}`;
  };
  for (const [hour, label] of [[14, 'a wet afternoon'], [22, 'after dusk, under the lamps']]){
    console.log(`\nLOOK  lane band, day 6 @ ${hour}h (${label}), seed 7 — candidate vs HEAD at the SAME wetness`);
        console.log(`   CONTROL  HEAD | HEAD, two PAGES, dry                     ${cmp(await grab('head-tmp.html',0,hour,6), await grab('head-tmp.html',0,hour,6))}`);
    console.log(`   CONTROL  HEAD | HEAD, two PAGES, wetness 1.0             ${cmp(await grab('head-tmp.html',1,hour,6), await grab('head-tmp.html',1,hour,6))}`);
        for (const w of [1.0, 0.7, 0.5, 0.35, 0.25, 0.18])
      console.log(`   wetness ${w.toFixed(2)}  candidate | HEAD                       ${cmp(await grab('courtyard.html',w,hour,6), await grab('head-tmp.html',w,hour,6))}`);
    console.log(`   dry      candidate | HEAD  (must be the control)         ${cmp(await grab('courtyard.html',0,hour,6), await grab('head-tmp.html',0,hour,6))}`);
  }
  unlinkSync(join(REPO, 'head-tmp.html'));
}
await br.close();
