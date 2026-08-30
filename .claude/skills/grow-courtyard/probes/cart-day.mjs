/* the carter (#82): 10 seeds × 4 days. Per day: did the cart come, hour in, hour at
 * the gate, stop lengths, market stop, hour gone, whether it was out after dark, the
 * load; and every 0.25 s the count of walkers (loader excluded) within 1 cell of the
 * cart's axle-to-nose segment — the "nobody inside the cart" number, which must be 0.
 * `node cart-day.mjs head` runs the same on /tmp/courtyard-head.html (expects 0 carts). */
import { homedir } from 'node:os'; import { join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const FILE = process.argv[2] === 'head' ? '/tmp/courtyard-head.html' : new URL('../../../../courtyard.html', import.meta.url).pathname;
const br = await chromium.launch();
async function run(seed, day0, days){
  const page = await br.newPage({ viewport:{width:1200,height:720} });
  page.on('pageerror', e => console.log('PAGEERROR', e.message));
  await page.goto(pathToFileURL(FILE).href + `?pause&seed=${seed}&t=0`, { waitUntil:'load' });
  await page.waitForFunction(() => typeof window.__warp === 'function');
  const r = await page.evaluate(([day0, days]) => {
    window.__reseed(); window.__warp(day0 * 55);
    const H = () => +(hour).toFixed(2);
    const daysOut = []; let cur = null, inside = 0, samples = 0, maxStep = 0, last = null, loaderNear = 0, loaded = 0;
    for (let i = 0; i < days * 55 / 0.25; i++){ window.__warp(0.25);
      const c = typeof cart !== 'undefined' ? cart : null;
      if (c && !cur){ cur = {day, seed:0, inH:H(), gate:null, gateDur:0, mk:null, mkDur:0, outH:null, dark:0, load:0, sacks:c.sacks?1:0, wentLane:0}; last = null; }
      if (c){ samples++;
        if (c.state === 'stop'){ if (c.at === 'gate'){ if (cur.gate === null) cur.gate = H(); cur.gateDur += 0.25; } else { if (cur.mk === null) cur.mk = H(); cur.mkDur += 0.25; } }
        if (c.y > 66) cur.wentLane = 1;
        if (nightF > 0.3) cur.dark++;
        cur.load = c.load;
        if (last){ const st = Math.hypot(c.x - last[0], c.y - last[1]); if (st > maxStep) maxStep = st; }
        last = [c.x, c.y];
        for (const a of agents){ const px = a.x - c.x, py = a.y - c.y, u = Math.max(0, Math.min(CART_LEN, px * c.hx + py * c.hy));
          const qd = Math.hypot(px - c.hx * u, py - c.hy * u);
          if (qd < 1){ if (a.loader) loaderNear++; else inside++; } }
      } else if (cur){ cur.outH = H(); daysOut.push(cur); cur = null; }
    }
    if (cur){ cur.outH = 'still'; daysOut.push(cur); }
    return { daysOut, inside, samples, maxStep:+maxStep.toFixed(2), loaderNear, sunUp:+sunUp.toFixed(2), sunDown:+sunDown.toFixed(2) };
  }, [day0, days]);
  await page.close(); return r;
}
const seeds = [1,2,3,4,5,6,7,8,9,10];
for (const [label, day0] of [['summer d9-12', 9], ['winter d17-20', 17]]){
  let D = [], IN = 0, S = 0, MS = 0, LN = 0, su, sd;
  for (const seed of seeds){ const r = await run(seed, day0, 4); for (const d of r.daysOut) d.seed = seed; D.push(...r.daysOut); IN += r.inside; S += r.samples; MS = Math.max(MS, r.maxStep); LN += r.loaderNear; su = r.sunUp; sd = r.sunDown; }
  const n = seeds.length * 4;
  const gd = D.filter(d => d.gate !== null), mk = D.filter(d => d.mk !== null);
  const mean = a => a.length ? (a.reduce((x, y) => x + y, 0) / a.length).toFixed(2) : '–';
  console.log(`${label} sunUp ${su} sunDown ${sd}: carts ${D.length}/${n} days, in ${mean(D.map(d=>d.inH))}h, at gate ${mean(gd.map(d=>d.gate))}h (${gd.length}), gate stop ${mean(gd.map(d=>d.gateDur*24/55))}h, loaded ${D.filter(d=>d.load>0).length}, sacks ${D.filter(d=>d.sacks).length}`);
  console.log(`  market stop ${mk.length} (at ${mean(mk.map(d=>d.mk))}h, ${mean(mk.map(d=>d.mkDur*24/55))}h), went to lane ${D.filter(d=>d.wentLane).length}, gone ${mean(D.filter(d=>d.outH!=='still').map(d=>d.outH))}h, still at end ${D.filter(d=>d.outH==='still').length}, dark samples ${D.reduce((x,d)=>x+d.dark,0)}`);
  console.log(`  walkers inside the cart: ${IN} of ${S} samples (loader beside it: ${LN}); max step per 0.25 s ${MS}`);
  console.log('  by day: ' + D.map(d => `s${d.seed}d${d.day}:${d.inH}->${d.gate}->${d.mk ?? '-'}->${d.outH}`).join(' '));
}
await br.close();
