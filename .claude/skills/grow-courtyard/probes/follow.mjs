#!/usr/bin/env node
/* follow.mjs — does a tap on a person FOLLOW them, and is the line TRUE over time?
 *   1. Tap a seed-pinned walker (the one nearest the courtyard door, so they have
 *      somewhere to go): __follow() holds their __entities id; warp on in quarter-hours,
 *      the sill line rewrites through >=3 distinct acts in order, and on despawn closes
 *      with what became of them.
 *   2. The marker's screen box sits on the projected feet, within a cell, per pose met.
 *   3. A second tap on the same figure releases; a tap on nothing releases.
 *   4. On a 640px phone the follow line is the one thing on the sill.
 * The invitation ('follow' in OFFERS) is only checked to exist and be spent by a tap.
 */
import { homedir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const HERE = dirname(fileURLToPath(import.meta.url));
const PAGE = pathToFileURL(resolve(HERE, '../../../..', 'courtyard.html')).href;
const arg = (n, d) => { const i = process.argv.indexOf(n); return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const seed = arg('--seed', '7');
const b = await chromium.launch();
const errs = []; let bad = 0;
const ok = (c, s) => { console.log((c ? '  ok   ' : '  FAIL ') + s); if (!c) bad++; };

async function pickAndTap(p, box, leaver){
  // the CAMERA runs on the real clock, so a pick taken while it is easing is aimed at
  // a frame that has moved by the time playwright's click lands 300 ms later. Not
  // viewEasing(), which a FOLLOW holds true for its whole length: with the sim paused
  // a follow's frame is still, and what has to be over is the EASE.
  await p.waitForFunction('viewTo === null');
  // a walker, in daylight, not in a tunnel; prefer one with the most route left (a.wp) so acts follow
  const w = await p.evaluate((leaver) => {
    __entities();                       // stamps __id
    let best = null, bs = -1;
    for (const a of agents){
      if (a.kind === 'sweeper' || a.kind === 'cyclist') continue;
      const g = grid[(a.y|0) * GW + (a.x|0)]; if (g === TUNNEL) continue;
      const [sx, sy] = project(a.x, a.y, a.z || 0);
      // the SILL covers the bottom of every frame and livingAt refuses a hit under it
      // (nearHidden), so a figure down there is picked and then cannot be tapped
      if (sx < 10 || sy < 10 || sx > W - 10 || sy > sillTop() - 20) continue;
      let left = (a.wp.length - a.i) + (a.stop && !a.stopped ? 3 : 0) + (a.kind === 'gardener' ? 3 : 0);
      if (leaver){ const L = a.wp[a.wp.length - 1];              // the last waypoint is OFF the frame
        left = L && a.i >= a.wp.length - 3 && a.state === 'walk' && (L[1] >= LANE_N_Y - 0.5 || L[1] < 0 || L[0] < 0 || L[0] >= GW) ? 1 : -1; }
      // HIT-TEST the point, don't trust the projection: a figure that is pickable is not
      // the same as a point that is tappable (something in front of them wins the box,
      // or the sill hides the feet), and a tap that lands on nobody RELEASES the follow
      const q = [sx, sy - cellH * 0.6]; livingAt(q); if (livingHit !== a) continue;
      if (left > bs){ bs = left; best = { id: 'walker' + a.__id, sx: q[0], sy: q[1], name: personName(a) }; }
    }
    return best;
  }, !!leaver);
  if (!w) return null;
  await click(p, box, w.sx, w.sy);
  return w;
}
/* project() answers in the canvas's OWN pixels; evPx() maps an event back through
 * `* W / rect.width` and `* H / rect.height`, and the canvas's rect is its CSS box
 * PLUS the 10px frame — 1208x791 against W,H 1228x811. So a click passed straight
 * through landed ~2% out and hit nobody, and every assertion below #60 had been
 * reading a follow that never started. The two ratios are also not EQUAL (0.984
 * against 0.975), so one k for both axes misses in y: on a 390px phone that is 13 px,
 * four times a person's whole box. This is evPx() inverted, term for term. */
async function click(p, _box, sx, sy){
  // the box is re-read: the SILL's height changes when the follow line opens, the
  // ResizeObserver on the frame fires, and a box captured before the first tap is
  // several pixels out for every one after it
  const box = await p.locator('#cv').boundingBox();
  const v = await p.evaluate(() => ({ W, H }));
  await p.mouse.click(box.x + sx * box.width / v.W, box.y + sy * box.height / v.H);
}

/* ---- 1–3: follow a walker through the day (1400px, hover) ------------------- */
{
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto(`${PAGE}?pause&seed=${seed}&t=${55 * 0.3}`);
  await p.waitForFunction('typeof window.__census === "function"');
  await p.evaluate(() => __warp(30));
  await p.waitForFunction('crowns.length > 0');
  const box = await p.locator('#cv').boundingBox();
  console.log('\n1. the tap holds a person');
  const offers = await p.evaluate(() => OFFERS.map(o => o.id));
  ok(offers.includes('follow'), 'OFFERS carries the invitation: ' + offers.join(', '));
  const w = await pickAndTap(p, box);
  ok(!!w, `tapped ${w && w.name} at (${w && w.sx | 0},${w && w.sy | 0})`);
  await p.waitForTimeout(250);
  let f = await p.evaluate(() => __follow());
  ok(f.id === w.id, `__follow() holds ${f.id} (tapped ${w.id})`);
  ok(f.line.toLowerCase().startsWith('following '), `sill reads "${f.line}"`);
  ok(await p.evaluate(() => __entities().filter(e => e.followed).length === 1), 'exactly one entity is flagged followed');

  // warp on in quarter sim-hours; the line is read straight off followLine() each step
  const STEP = 55 / 24 / 4;
  const acts = [], poses = new Map(); let ended = '', hours = 0;
  const bad2 = [];
  for (let i = 0; i < 24 * 4 * 0.5; i++){
    const r = await p.evaluate((st) => {
      __warp(st);
      const f = __follow();
      const e = __entities().find(x => x.followed);
      let feet = null;
      if (e){ const q = project(e.x, e.y, e.z); feet = { x: q[0], y: q[1], act: e.act }; }
      return { f, feet };
    }, STEP);
    hours += 0.25;
    if (r.f.id){
      if (!acts.length || acts[acts.length - 1] !== r.f.want) acts.push(r.f.want);
      const d = Math.hypot(r.f.mark.x - r.feet.x, r.f.mark.y - r.feet.y);
      const prev = poses.get(r.feet.act) || 0; poses.set(r.feet.act, Math.max(prev, d));
      if (d > 12) bad2.push(r.feet.act + ':' + d.toFixed(1));
    } else { ended = r.f.ended; break; }
  }
  console.log('   acts, in order:'); for (const a of acts) console.log('     · ' + a);
  ok(acts.length >= 3, `${acts.length} distinct acts over ${hours} sim h (want >=3)`);
  // the despawn: a leaver on the last leg out, followed until they are gone
  let lv = null, lw = 0;
  while (!lv && lw < 48){ lv = await pickAndTap(p, box, true); if (!lv){ await p.evaluate((st) => __warp(st), STEP); lw += 0.25; } }
  ok(!!lv && await p.evaluate(id => __follow().id === id, lv && lv.id),
     `tapped a leaver after ${lw} h: ` + (lv && lv.name));
  let lh = 0;
  for (let i = 0; i < 24 * 4 * 2 && !ended; i++){
    const r = await p.evaluate((st) => { __warp(st); return __follow(); }, STEP); lh += 0.25;
    if (!r.id) ended = r.ended;
  }
  ok(!!ended, `closed on despawn after ${lh} h: "${ended}"`);
  await p.waitForTimeout(300);
  const dom = await p.evaluate(() => ({ txt: document.getElementById('naming').textContent, on: sillEl.classList.contains('naming') }));
  ok(dom.on && dom.txt.toLowerCase().includes('following'), `the closing line is on the sill: "${dom.txt}"`);
  console.log('\n2. the marker rides under the feet');
  const ps = [...poses.entries()].map(([k, v]) => `${k} ${v.toFixed(1)}px`).join(', ');
  ok(bad2.length === 0, `max marker-to-feet gap per pose (cell ≈ ${await p.evaluate(() => cellH.toFixed(1))}px): ${ps}`);
  ok(await p.evaluate(() => OFFERS[2].found()), 'the invitation counts as found');

  console.log('\n3. release');
  const w2 = await pickAndTap(p, box);
  await p.waitForTimeout(100);
  ok(await p.evaluate(() => __follow().id !== null), `a fresh tap follows ${w2 && w2.name}`);
  await click(p, box, w2.sx, w2.sy);
  await p.waitForTimeout(100);
  ok(await p.evaluate(() => __follow().id === null && __follow().ended === ''), 'a second tap on the same figure releases, with no closing line');
  const w3 = await pickAndTap(p, box);
  await p.waitForTimeout(100);
  const wall = await p.evaluate(() => { for (let y = 20; y < 60; y++) for (let x = 0; x < GW; x++){ const q = project(x + .5, y + .5, 0); if (grid[y * GW + x] === WALL && q[0] > 5 && q[1] > 5 && q[0] < cv.width - 5 && q[1] < cv.height - 5) return q; } });
  await click(p, box, wall[0], wall[1]);
  await p.waitForTimeout(100);
  ok(await p.evaluate(() => __follow().id === null), 'a tap on nothing (a wall) releases');
  await p.close();
}

/* ---- 4: the phone --------------------------------------------------------- */
{
  console.log('\n4. the phone, 390x844');
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto(`${PAGE}?seed=${seed}&t=${55 * 0.3}`);
  await p.waitForFunction('typeof window.__census === "function"');
  await p.evaluate(() => __warp(30));
  await p.waitForFunction('crowns.length > 0');
  const box = await p.locator('#cv').boundingBox();
  const w = await p.evaluate(() => {
    /* Hit-TEST the point rather than trusting the projection. A person's box is
     * cellW*0.45 either side and cellW is 2.8 CSS px at 390 wide, so the target at
     * Wide on a phone is ~2.5 px: picking a figure is not the same as picking a point
     * that can be tapped, and this section used to assert the follow off a point that
     * missed. (What that costs the OFFER, which is made to phones, is c-follow-reach.) */
    for (const a of agents){ if (a.kind === 'sweeper') continue;
      if (grid[(a.y | 0) * GW + (a.x | 0)] === TUNNEL) continue;
      const [sx, sy] = project(a.x, a.y, a.z || 0);
      if (!(sx > 10 && sy > 10 && sx < W - 10 && sy < sillTop() - 20)) continue;
      const q = [sx, sy - cellH * 0.6];
      livingAt(q); if (livingHit === a) return { sx: q[0], sy: q[1], hw: cellW * 0.45 }; }
  });
  { const v = await p.evaluate(() => ({ W, H }));
    await p.touchscreen.tap(Math.round(box.x + w.sx * box.width / v.W),
                            Math.round(box.y + w.sy * box.height / v.H)); }
  await p.waitForTimeout(300);
  const t = await p.evaluate(() => {
    const cs = e => getComputedStyle(document.getElementById(e)).display;
    const n = document.getElementById('naming');
    return { id: __follow().id, txt: n.textContent, plate: cs('plate'), clock: cs('daytime'), ticker: cs('ticker'), naming: cs('naming'),
             fits: n.scrollHeight <= 40, sill: sillEl.scrollWidth - sillEl.clientWidth };
  });
  ok(!!t.id, `the tap follows: "${t.txt}"`);
  ok(t.plate === 'none' && t.clock === 'none' && t.ticker === 'none' && t.naming === 'block', 'the follow line is the one thing shown');
  ok(t.fits && t.sill <= 0, `it fits (${t.sill} px over)`);
  await p.waitForTimeout(6000);   // > NAME_HELD: a follow outlasts a tap's name
  ok(await p.evaluate(() => __follow().id !== null && sillEl.classList.contains('naming')), 'still following 6 s later');
  await p.close();
}
await b.close();
ok(errs.length === 0, errs.length ? 'page errors: ' + errs.join(' | ') : 'no page errors');
console.log(bad ? `\n${bad} FAILED` : '\nall ok');
process.exit(bad ? 1 : 0);
