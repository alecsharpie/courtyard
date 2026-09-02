/* Who actually uses the carriageway, and what it remembers afterwards. Written for #135,
 * whose brief expected paveWear[] to be showing the cart's line and a crossing outside
 * the tap on dry stone. It shows neither, and this is why:
 *
 *   - `?t=` sets the CLOCK, it does not run the days, so a freshly loaded page has
 *     paveWear[] at 0 everywhere and both builds draw an unwalked road. You have to warp.
 *   - warp seven days and the carriageway's mean paveWear is still ~0.002 with its
 *     busiest single cell ~0.05, against PW_FULL 0.45. Nobody walks on a road.
 *   - the one thing that uses the road is the cart, and the cart is not an agent: the
 *     accrual site is inside stepAgent, so no wheel has ever touched the accumulator.
 *   - and PW_DECAY takes 46% back out a day against a cart that comes 0.8 days in 1.
 *
 * So the rut had to go in the FABRIC (rutF), and this probe is what says where: run it
 * before changing anything that claims to draw traffic on stone.
 *   node probes/road-traffic.mjs [file]    ·  DAYS=12 to run longer */
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const FILE = process.argv[2] || 'courtyard.html';
const DAYS = +(process.env.DAYS || 12), SEED = +(process.env.SEED || 42);
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport:{ width:1600, height:950 }, deviceScaleFactor:1 });
const p = await ctx.newPage();
await p.goto(pathToFileURL(resolve(process.cwd(), FILE)).href + `?seed=${SEED}&t=0&pause`, { waitUntil:'load' });
await p.waitForFunction(() => typeof window.__warp === 'function');
const r = await p.evaluate(({ DAYS }) => {
  __reseed();
  const feetX = new Float64Array(GW), feetY = new Float64Array(WH);
  const cartX = new Float64Array(GW), cartY = new Float64Array(WH);
  let feet = 0, cartLane = 0;
  const STEP = 0.25;
  for (let s = 0; s < DAYS * 55 / STEP; s++){
    __warp(STEP);
    for (const a of agents){
      const onLane = a.y >= LN_ROAD0 && a.y < LN_ROAD1 && a.x >= 0 && a.x < GW;
      const onXs = a.x >= XS_R0 && a.x < XS_R1 && a.y >= 0 && a.y < LN_ROAD0;
      if (onLane || onXs){ feetX[a.x | 0]++; feet++; }
      if (onLane) feetY[a.y | 0]++;
    }
    if (cart){
      if (cart.x >= 0 && cart.x < GW) cartX[cart.x | 0]++;
      if (cart.y >= LN_ROAD0 && cart.y < LN_ROAD1){ cartY[cart.y | 0]++; cartLane++; }
    }
  }
  // and what the stone remembers of all that
  let s = 0, n = 0, mx = 0, mxAt = null;
  const rows = [];
  for (let y = LN_ROAD0; y < LN_ROAD1; y++){
    let rs = 0, rn = 0;
    for (let x = 2; x < XS_W0; x++){ const v = paveWear[y * GW + x];
      rs += v; rn++; s += v; n++; if (v > mx){ mx = v; mxAt = [x, y]; } }
    rows.push([y, +(rs / rn).toFixed(4)]);
  }
  const top = (arr, k) => [...arr].map((v, i) => [i, Math.round(v)]).filter(z => z[1] > 0)
                                  .sort((a, b) => b[1] - a[1]).slice(0, k);
  return { feet, cartLane, feetByX:top(feetX, 10), feetByY:top(feetY, 10),
           cartByX:top(cartX, 5), cartByY:top(cartY, 5),
           wear:{ mean:+(s / n).toFixed(4), max:+mx.toFixed(3), maxAt:mxAt, rows },
           consts:{ CART_LANE_Y, CART_X, LN_ROAD0, LN_ROAD1, XS_R0, XS_R1, PW_FULL, PW_GAIN, PW_DECAY },
           at:{ day, hour:+hour.toFixed(2) } };
}, { DAYS });
await browser.close();
console.log(`${FILE}  seed ${SEED}  ${DAYS} sim days  ->  ${JSON.stringify(r.at)}`);
console.log(`\nconstants ${JSON.stringify(r.consts)}`);
console.log(`\nthe CART on the carriageway (${r.cartLane} lane samples)`);
console.log(`  by row: ${r.cartByY.map(z => z.join(':')).join('  ')}`);
console.log(`  by col: ${r.cartByX.map(z => z.join(':')).join('  ')}`);
console.log(`\nFEET on any carriageway (${r.feet} samples)`);
console.log(`  by col: ${r.feetByX.map(z => z.join(':')).join('  ')}`);
console.log(`  by row: ${r.feetByY.map(z => z.join(':')).join('  ')}`);
console.log(`\npaveWear[] on the lane's carriageway after ${DAYS} days`);
console.log(`  mean ${r.wear.mean}   max ${r.wear.max} at ${JSON.stringify(r.wear.maxAt)}   (PW_FULL ${r.consts.PW_FULL})`);
console.log(`  by row: ${r.wear.rows.map(z => z.join(':')).join('  ')}`);
