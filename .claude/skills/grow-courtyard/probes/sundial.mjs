/* The sundial (#84): the DIAL cell and its neighbours; wear[] around it after four days
 * (no desire path crosses it); the gnomon's throw at 08:00 / solar noon / 16:00 on a
 * summer day swings west -> north -> east; a winter noon's throw is longer than a summer
 * one; under cloudCover 1 the shadow alpha falls to the floor; nameAt reads the hour;
 * the tip pixel on the grass is darker WITH drawSundial than without (the shadow is
 * really painted, live); crops.  node .claude/skills/grow-courtyard/probes/sundial.mjs */
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const HERE = resolve('courtyard.html');
const b = await chromium.launch();
async function open(dpr){ const p = await b.newPage({ viewport:{width:1600, height:950}, deviceScaleFactor: dpr || 1 });
  p.on('pageerror', e => console.log('PAGE ERROR', e.message));
  await p.goto(pathToFileURL(HERE).href + '?pause&seed=7&t=0'); await p.waitForFunction(() => window.__warp); return p; }
const DAY = 55, at = (day, hour) => day * DAY + ((hour - 6 + 24) % 24) / 24 * DAY;

// (a) the cell, the ring, the benches, wear after four days
{
  const p = await open();
  const r = await p.evaluate(() => {
    window.__reseed(); window.__warp(4 * 55);
    const j = SUNDIAL.y * GW + SUNDIAL.x, kinds = [], w = [];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++){ const k = (SUNDIAL.y + dy) * GW + SUNDIAL.x + dx; kinds.push(grid[k]); w.push(+wear[k].toFixed(3)); }
    const bench = Math.min(...BENCH_SPOTS.map(b => Math.hypot(b.x - SUNDIAL.x, b.y - SUNDIAL.y)));
    const ring = Math.min(...RING.map(q => Math.hypot(q[0] - SUNDIAL.x - .5, q[1] - SUNDIAL.y - .5)));
    const trunk = Math.hypot(SUNDIAL.x + .5 - CX, SUNDIAL.y + .5 - CY);
    return { kind: grid[j], DIAL, kinds, w, wearMax: Math.max(...w), bench: +bench.toFixed(1), ring: +ring.toFixed(1), trunk: +trunk.toFixed(2), tiles: __census().tiles.DIAL, tileKinds: __census().scalars.tileKinds };
  });
  console.log('cell', r.kind === r.DIAL ? 'DIAL' : 'NOT DIAL', '3x3 kinds', r.kinds.join(''), 'wear', r.w.join(' '), 'max', r.wearMax, r.wearMax < 0.08 ? 'PASS (no desire path)' : 'FAIL');
  console.log('nearest bench', r.bench, 'cells; nearest RING node', r.ring, 'cells; from the trunk', r.trunk, '; census tiles.DIAL', r.tiles, 'tileKinds', r.tileKinds);
  await p.close();
}
// (b) the throw through a summer day, a winter noon, and under the lid; the name at each
{
  const p = await open();
  const rows = await p.evaluate(() => {
    const at = (day, hour) => day * 55 + ((hour - 6 + 24) % 24) / 24 * 55;
    const out = [];
    const read = (label, t, lid) => {
      window.__reseed(); window.__setTime(t); window.__warp(1/30);
      if (lid) cloudCover = () => 1;
      const [dx, dy] = dialThrow(SUNDIAL.h), len = Math.hypot(dx, dy);
      out.push({ label, hour: +hour.toFixed(2), warmth: +warmth.toFixed(3), dx: +dx.toFixed(2), dy: +dy.toFixed(2), len: +len.toFixed(2),
                 shadowF: +shadowF().toFixed(2), alpha: +(0.22 * daylight * shadowF()).toFixed(3), name: nameAt(SUNDIAL.x, SUNDIAL.y) });
      if (lid) delete window.cloudCover;
    };
    read('summer 08:00', at(6, 8)); read('summer 12:45', at(6, 12.75)); read('summer 16:00', at(6, 16)); read('summer 19:30', at(6, 19.5));
    read('winter 12:45', at(19, 12.75)); read('winter 08:00', at(19, 8));
    read('summer 23:00', at(6, 23));
    return out;
  });
  for (const r of rows) console.log(r.label.padEnd(13), 'hour', r.hour, 'warmth', r.warmth, 'throw (' + r.dx + ', ' + r.dy + ') len', r.len, 'shadowF', r.shadowF, 'alpha', r.alpha, '→', r.name);
  const s8 = rows[0], s12 = rows[1], s16 = rows[2], w12 = rows[4];
  console.log('swings west → east:', s8.dx < -0.2 && Math.abs(s12.dx) < 0.15 && s16.dx > 0.2 && s8.dy < 0 && s12.dy < 0 && s16.dy < 0 ? 'PASS' : 'FAIL');
  console.log('winter noon longer than summer noon:', w12.len > s12.len * 2 ? 'PASS' : 'FAIL', '(' + w12.len + ' vs ' + s12.len + ')');
  await p.close();
}
// (b2) the lid, on a live page: cloudCover forced to 1 at a summer noon
{
  const p = await open();
  const r = await p.evaluate(() => { window.__reseed(); window.__setTime(6 * 55 + 6.75 / 24 * 55); window.__warp(1/30);
    const clear = { shadowF: +shadowF().toFixed(2), name: nameAt(SUNDIAL.x, SUNDIAL.y) };
    cloudCover = () => 1;
    return { clear, lid: { shadowF: +shadowF().toFixed(2), spread: +shSpread().toFixed(2), offset: +shOffset().toFixed(2), name: nameAt(SUNDIAL.x, SUNDIAL.y) } }; });
  console.log('clear', JSON.stringify(r.clear), 'lid', JSON.stringify(r.lid), r.lid.shadowF <= 0.2 && /no shadow/.test(r.lid.name) ? 'PASS' : 'FAIL');
  await p.close();
}
// (c) the pixel on the throw: darker with the sundial drawn than without — a WINTER 08:00, when the throw (1.6 cells) clears the plinth (r 0.44); in summer the morning throw is under the stone
{
  const p = await open();
  const r = await p.evaluate(() => {
    window.__reseed(); window.__setTime(19 * 55 + 2 / 24 * 55); window.__warp(1/30);
    const cx = SUNDIAL.x + .5, cy = SUNDIAL.y + .5, [qx, qy] = dialThrow(SUNDIAL.h);
    const tip = project(cx + qx * 0.7, cy + qy * 0.7, 0);        // on the line, short of the tip, clear of the plinth
    const px = () => { const d = ctx.getImageData(Math.round(tip[0] * DPR), Math.round(tip[1] * DPR), 1, 1).data; return d[0] + d[1] + d[2]; };
    drawScene(simT, 1/30); const withIt = px();
    const keep = drawSundial; drawSundial = () => {}; drawScene(simT, 1/30); const without = px(); drawSundial = keep;
    return { withIt, without, tip: tip.map(v => +v.toFixed(1)), throwPx: [+(project(cx + qx, cy + qy, 0)[0] - project(cx, cy, 0)[0]).toFixed(1), +(project(cx + qx, cy + qy, 0)[1] - project(cx, cy, 0)[1]).toFixed(1)] };
  });
  console.log('tip pixel sum with', r.withIt, 'without', r.without, 'throw px', r.throwPx, 'margin', r.without - r.withIt, r.withIt <= r.without - 6 ? 'PASS (shadow painted live)' : 'FAIL');
  await p.close();
}
// (d) crops
for (const [name, day, hour, lid] of [['s0800', 6, 8], ['s1245', 6, 12.75], ['s1600', 6, 16], ['w1245', 19, 12.75], ['lid1245', 6, 12.75, 1], ['night', 6, 23]]){
  const q = await open(3);                                   // 3x for legibility — a different world, shots only
  const box = await q.evaluate(async ([day, hour, lid]) => { window.__reseed(); window.__setTime(day * 55 + ((hour - 6 + 24) % 24) / 24 * 55); window.__warp(1/30);
    if (lid) cloudCover = () => 1;
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const r = document.querySelector('canvas').getBoundingClientRect(), c = project(SUNDIAL.x + .5, SUNDIAL.y + .5, 0);
    return { x: r.left + c[0] - 90, y: r.top + c[1] - 70, width: 180, height: 120 }; }, [day, hour, lid]);
  await q.screenshot({ path: `shots/b82-sundial-${name}.png`, clip: box });
  await q.close();
}
console.log('crops: shots/b82-sundial-{s0800,s1245,s1600,w1245,lid1245,night}.png');
await b.close();
