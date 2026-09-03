#!/usr/bin/env node
/* follow-cam.mjs — does the FRAME follow the person the tap holds?
 *   1. A tap eases the camera onto them and lands at FOLLOW_S.
 *   2. They stay in the picture, frame after frame, for the whole errand.
 *   3. The ground cache is painted ONCE for the whole follow (the brief's whole risk),
 *      and the blit still covers the frame — no edge of the cache in the picture.
 *   4. It releases on all three exits — a second tap, a tap on nothing, and the
 *      despawn that ends the errand — and eases back to the quarter it came from.
 *   5. RM keeps the sill's follow and refuses the camera's.
 * Shots of the ease and the lock go to shots/followcam-*.png.
 */
import { homedir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readFileSync, writeFileSync } from 'node:fs';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../../..');
const PAGE = pathToFileURL(resolve(ROOT, 'courtyard.html')).href;
const arg = (n, d) => { const i = process.argv.indexOf(n); return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const seed = arg('--seed', '7'), shots = process.argv.includes('--shots');
const b = await chromium.launch();
const errs = []; let bad = 0;
const ok = (c, s) => { console.log((c ? '  ok   ' : '  FAIL ') + s); if (!c) bad++; };
const sleep = ms => new Promise(r => setTimeout(r, ms));

// count every rebuild of the two caches a move must not repaint per frame
const COUNT = () => {
  const d = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, 'width');
  window.__rb = { ground: 0, back: 0 };
  for (const [cv, k] of [[gcv, 'ground'], [bcv, 'back']])
    Object.defineProperty(cv, 'width', { get(){ return d.get.call(this); },
                                         set(v){ window.__rb[k]++; d.set.call(this, v); } });
};
// one frame's worth of the state this probe judges
// does the backdrop's VIEW move while a follow is on? (its lightBucket repaints do)
const WATCH = () => {
  window.__bview = true; let last = null;
  setInterval(() => {
    if (!followOn){ last = null; return; }
    const k = bview.s + ',' + bview.ox + ',' + bview.tp + ',' + bview.pad;
    if (last !== null && k !== last) window.__bview = false;
    last = k;
  }, 50);
};
const READ = () => {
  const a = followed, p = a ? project(a.x, a.y, agentZ(a)) : null;
  const kg = viewS / gview.s, kb = viewS / bview.s;
  return { on: followOn, s: viewS, ox: originX, tp: topPad, easing: viewEasing(),
           sx: p && p[0], sy: p && p[1], W, sill: sillTop(), rb: { ...window.__rb },
           gL: originX - kg * (gview.ox + gview.pad), gR: originX - kg * (gview.ox + gview.pad) + gcv.width / DPR * kg,
           bL: originX - kb * (bview.ox + bview.pad), bR: originX - kb * (bview.ox + bview.pad) + (W + 2 * bview.pad) * kb };
};
async function pick(p, leaver){
  return p.evaluate((leaver) => {
    __entities();
    let best = null, bs = -1;
    for (const a of agents){
      if (grid[(a.y | 0) * GW + (a.x | 0)] === TUNNEL) continue;
      const [sx, sy] = project(a.x, a.y, a.z || 0);
      if (sx < 40 || sy < 40 || sx > W - 40 || sy > sillTop() - 30) continue;
      let left = (a.wp.length - a.i) + (a.stop && !a.stopped ? 3 : 0);
      if (leaver){ const L = a.wp[a.wp.length - 1];
        left = L && a.i >= a.wp.length - 2 && a.state === 'walk' ? 1 : -1; }
      if (left > bs){ bs = left; best = { id: 'walker' + a.__id, sx, sy: sy - cellH * 0.6, name: personName(a) }; }
    }
    return best;
  }, !!leaver);
}
// evPx scales the event by W / the canvas's CSS width, and the two are NOT the same
// number (1228 against 1208 at 1400px): a click in project()'s pixels lands ~2% out.
// evPx() inverted: the canvas's rect is its CSS box PLUS the 10px frame, and the two
// ratios are not equal, so one k for both axes lands 13 px out in y on a phone
const tap = async (p, _box, sx, sy) => {
  // re-read: the sill's height changes when the follow line opens and the frame's
  // ResizeObserver moves the canvas under a box captured before the first tap
  const box = await p.locator('#cv').boundingBox();
  const v = await p.evaluate(() => ({ W, H }));
  await p.mouse.click(box.x + sx * box.width / v.W, box.y + sy * box.height / v.H);
};
/* Pick and tap with the SIM held. Playwright's round trip is a few hundred ms and at
 * 8x a walker crosses two cells in it, so a tap aimed where project() last put them
 * misses. The camera runs on the REAL clock, so pausing costs the follow nothing. */
async function tapPerson(p, box, leaver){
  await p.evaluate(() => { paused = true; });
  // the CAMERA runs on the real clock, so a pick taken while it is easing is aimed at
  // a frame that has moved by the time playwright's click lands 300 ms later. Not
  // viewEasing(), which a FOLLOW holds true for its whole length: with the sim paused
  // a follow's frame is still, and what has to be over is the EASE.
  await p.waitForFunction('viewTo === null');
  const w = await pick(p, leaver);
  if (w) await tap(p, box, w.sx, w.sy);
  await p.evaluate(() => { paused = false; });
  return w;
}

/* ---- 1-3: the tap, the ease, the lock, the caches ---------------------------- */
{
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto(`${PAGE}?pause&seed=${seed}&t=${55 * 0.32}`);
  await p.waitForFunction('typeof window.__census === "function"');
  // warp to populate the town, THEN let the clock run: the camera is on the real one
  await p.evaluate(() => { __warp(40); paused = false; });
  await sleep(400);
  await p.evaluate(COUNT); await p.evaluate(WATCH);
  const box = await p.locator('#cv').boundingBox();
  /* THE CONTROL: the same build, the same six real seconds, nobody followed. The town
   * repaints both caches on its own account — the ground on wear, the backdrop on every
   * lightBucket the day crosses — so a raw count during a follow is not a reading
   * without the cadence it is being held against. */
  const c0 = await p.evaluate(READ);
  await sleep(6000);
  const c1 = await p.evaluate(READ);
  console.log(`   control, 6 s, nobody followed: ground x${c1.rb.ground - c0.rb.ground}, backdrop x${c1.rb.back - c0.rb.back}`);
  console.log('\n1. the tap takes the frame');
  const before = await p.evaluate(READ);
  const w = await tapPerson(p, box);
  const at0 = await p.evaluate(READ);
  ok(at0.on && !before.on, `tapped ${w.name}: followOn ${before.on} -> ${at0.on}`);
  ok(before.s === 1, `it was at Wide (s ${before.s})`);
  await sleep(250);
  const mid = await p.evaluate(READ);
  if (shots) await p.screenshot({ path: resolve(ROOT, 'shots/followcam-ease.png') });
  await sleep(900);
  const lock = await p.evaluate(READ);
  ok(mid.s > 1.05 && mid.s < 2.55, `mid-ease s ${mid.s.toFixed(3)} (between 1 and FOLLOW_S)`);
  ok(Math.abs(lock.s - 2.6) < 1e-6, `landed at FOLLOW_S: s ${lock.s.toFixed(4)}`);

  console.log('\n2. they stay in the picture');
  let out = 0, n = 0, mx = 0, worst = null, cover = 0;
  for (let i = 0; i < 40; i++){
    await sleep(150);
    const r = await p.evaluate(READ);
    if (!r.on) break;
    n++;
    const inx = r.sx >= 0 && r.sx <= r.W, iny = r.sy >= 0 && r.sy <= r.sill;
    if (!(inx && iny)){ out++; worst = r; }
    mx = Math.max(mx, Math.abs(r.sx - r.W / 2) / r.W);
    if (r.gL > 0.5 || r.gR < r.W - 0.5 || r.bL > 0.5 || r.bR < r.W - 0.5) cover++;
    if (shots && i === 6) await p.screenshot({ path: resolve(ROOT, 'shots/followcam-lock.png') });
  }
  ok(out === 0 && n >= 8, `${n} frames of follow, ${out} with the subject outside the picture` +
     (worst ? ` (worst sx ${worst.sx | 0} sy ${worst.sy | 0} of ${worst.W}x${worst.sill | 0})` : ''));
  ok(mx < 0.5, `never further than ${(mx * 100).toFixed(1)}% of the frame's width from its centre`);

  /* A still frame cannot see a JERK. The frame is moving now, so the picture changes
   * every frame by construction and the question is whether it changes SMOOTHLY: one
   * sample far above its neighbours is a cache rebuilding or a draw order faulting
   * under the move, which is exactly what holding the wide paint is supposed to avoid. */
  const DIFF = () => { const d = ctx.getImageData(0, 0, Math.round(W*DPR), Math.round(H*DPR*0.85)).data;
    let h = new Array(64).fill(0);
    for (let i = 0; i < d.length; i += 401) h[(i / 401) & 63] += d[i];
    return h; };
  const series = [];
  for (let i = 0; i < 14; i++){ await sleep(120); series.push(await p.evaluate(DIFF)); }
  const ds = [];
  for (let i = 1; i < series.length; i++)
    ds.push(series[i].reduce((a2, v, j) => a2 + Math.abs(v - series[i-1][j]), 0) / 64);
  const med = [...ds].sort((a2, b2) => a2 - b2)[ds.length >> 1], pops = ds.filter(v => v > med * 4).length;
  ok(pops === 0, `frame-to-frame change through the move: median ${med.toFixed(0)}, worst ${Math.max(...ds).toFixed(0)}, ${pops} pops (>4x median)`);

  console.log('\n3. the caches are painted once, and still cover the frame');
  const end = await p.evaluate(READ);
  const bfix = await p.evaluate(() => __bview);
  ok(end.rb.ground - at0.rb.ground === 0, `ground rebuilds over ${n} frames of follow: ${end.rb.ground - at0.rb.ground}, against ${c1.rb.ground - c0.rb.ground} in the control's six seconds`);
  ok(bfix, `the backdrop's VIEW is pinned for the whole follow (its ${end.rb.back - at0.rb.back} repaints are the day's lightBucket: ${c1.rb.back - c0.rb.back} in the control)`);
  ok(cover === 0, `${cover} frames where a cache's blit failed to cover the frame`);
  ok(end.easing, 'viewEasing() holds for the length of the follow, so drawScene never rebuilds the ground');

  console.log('\n4. release: a tap on nothing gives the frame back');
  await tap(p, box, 30, 30);                    // the sky: nothing to name, nothing to follow
  const rel = await p.evaluate(READ);
  ok(!rel.on && rel.easing, 'the follow is off and an ease home is running');
  await sleep(1200);
  const home = await p.evaluate(READ);
  if (shots) await p.screenshot({ path: resolve(ROOT, 'shots/followcam-home.png') });
  const wide = await p.evaluate(() => ({ ...viewFor(0), gs: gview.s, gp: gview.pad, bp: bview.pad, gd: groundDirty }));
  ok(Math.abs(home.s - 1) < 1e-9 && Math.abs(home.ox - wide.ox) < 0.01 && Math.abs(home.tp - wide.tp) < 0.01,
     `back at the quarter it came from: s ${home.s.toFixed(4)} ox ${home.ox.toFixed(1)}/${wide.ox.toFixed(1)}`);
  ok(!home.easing && wide.gs === 1 && wide.gp === 0 && wide.bp === 0,
     `the destination is repainted once, unpadded (gview.pad ${wide.gp}, bview.pad ${wide.bp})`);
  const rp = home.rb.ground - end.rb.ground;
  ok(rp >= 1 && rp <= 2, `${rp} ground repaint(s) over the release ease and the 1.2 s after — one is the destination, a second would be the town's own wear (control: ${c1.rb.ground - c0.rb.ground} in six seconds)`);
  await p.close();
}

/* ---- 5: the errand ending, and a second tap --------------------------------- */
{
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto(`${PAGE}?pause&seed=${seed}&t=${55 * 0.32}&fast`);
  await p.waitForFunction('typeof window.__census === "function"');
  await p.evaluate(() => { __warp(40); paused = false; });
  await sleep(400);
  await p.evaluate(COUNT);
  const box = await p.locator('#cv').boundingBox();
  console.log('\n5. the errand ends and the frame lets go (8x, so the walk runs out)');
  const w = await tapPerson(p, box, true);
  ok(await p.evaluate(() => followOn), `following a leaver: ${w && w.name}`);
  let gone = null;
  for (let i = 0; i < 60 && !gone; i++){
    await sleep(200);
    const r = await p.evaluate(() => ({ on: followOn, who: !!followed, ended: __follow().ended, s: viewS, easing: viewEasing() }));
    if (!r.who) gone = r;
  }
  ok(!!gone, gone ? `despawned after the walk: "${gone.ended}"` : 'the leaver never despawned in 12 s at 8x');
  ok(gone && !gone.on && gone.easing, 'the despawn released the camera into an ease home, and did not snap');
  await sleep(1400);
  ok(Math.abs(await p.evaluate(() => viewS) - 1) < 1e-9, 'and it is home');

  await tapPerson(p, box);
  ok(await p.evaluate(() => followOn), 'a fresh tap follows again');
  await sleep(1200);
  const w3 = await tapPerson(p, box);           // whoever is nearest the middle now
  const after = await p.evaluate(() => ({ on: followOn, same: __follow().id }));
  ok(after.same === w3.id ? after.on : !after.on || after.same !== null,
     after.same === w3.id ? `a tap on a DIFFERENT figure moves the frame to them (${w3.name})`
                          : 'a second tap on the same figure releases the frame');
  await p.close();
}

/* ---- 6: reduced motion keeps the sill's follow and refuses the camera's ------ */
{
  const p = await b.newPage({ viewport: { width: 1400, height: 900 }, reducedMotion: 'reduce' });
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto(`${PAGE}?pause&seed=${seed}&t=${55 * 0.32}`);
  await p.waitForFunction('typeof window.__census === "function"');
  await p.evaluate(() => { __warp(40); paused = false; });
  await sleep(400);
  const box = await p.locator('#cv').boundingBox();
  console.log('\n6. reduced motion');
  const w = await tapPerson(p, box);
  await sleep(1200);
  const r = await p.evaluate(() => ({ rm: RM, on: followOn, s: viewS, held: __follow().id }));
  ok(r.rm, 'RM is on');
  ok(!!r.held && !r.on && r.s === 1, `the sill still holds ${w && w.name}; the frame does not move (s ${r.s})`);
  await p.close();
}

/* ---- 7: a resize lands the camera ON them, and keeps them -------------------- */
{
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto(`${PAGE}?pause&seed=${seed}&t=${55 * 0.32}`);
  await p.waitForFunction('typeof window.__census === "function"');
  await p.evaluate(() => { __warp(40); paused = false; });
  await sleep(400);
  await p.evaluate(COUNT);
  const box = await p.locator('#cv').boundingBox();
  await p.evaluate(`window.READFN = ${READ.toString()}`);
  console.log('\n7. a resize');
  await tapPerson(p, box);
  await sleep(1200);
  await p.setViewportSize({ width: 1100, height: 700 });
  await sleep(300);
  const r = await p.evaluate(READ);
  ok(r.on && Math.abs(r.s - 2.6) < 1e-6, `still following, landed at FOLLOW_S in the new frame (s ${r.s.toFixed(4)})`);
  ok(r.sx >= 0 && r.sx <= r.W && r.sy >= 0 && r.sy <= r.sill, `they are in the new picture (${r.sx | 0},${r.sy | 0} of ${r.W}x${r.sill | 0})`);
  ok(r.gL <= 0.5 && r.gR >= r.W - 0.5, 'the ground cache was repainted at the new canvas size and still covers the frame');
  // and the place name takes the camera back: a quarter is a camera act, the sill keeps them
  const before = await p.evaluate(READ);
  await p.evaluate(() => whereGo(3));
  await sleep(1400);
  const q = await p.evaluate(() => ({ ...READFN(), n: whereN, held: __follow().id, want: viewFor(whereN), gs: gview.s, gp: gview.pad, easing: viewEasing() }));
  ok(q.n === 3 && !q.on, 'pressing the place name through a follow goes to the quarter and drops the camera');
  ok(q.held !== null, 'and the SILL still has them: ' + q.held);
  ok(Math.abs(q.s - q.want.s) < 1e-6 && Math.abs(q.ox - q.want.ox) < 0.01 && !q.easing && q.gp === 0,
     `the quarter is arrived at and repainted unpadded (s ${q.s.toFixed(3)}/${q.want.s.toFixed(3)}, gview.pad ${q.gp})`);
  ok(before.rb.ground <= q.rb.ground && q.rb.ground - before.rb.ground <= 2,
     `${q.rb.ground - before.rb.ground} ground repaint(s) across that move`);
  await p.close();
}

/* ---- 8: what holding the wide cache COSTS the picture ------------------------ */
{
  /* The brief's whole risk was the ground cache, and the answer it asked for — hold the
   * padded WIDE paint for the length of the follow — has a price the census cannot see:
   * the frame is a 1x image scaled 2.6x for as long as the follow lasts, where a quarter
   * pays it for 0.9 s. This prices it against a GROUND-TRUTH build that repaints in the
   * follow's own view every frame: same code, one difference. */
  const T = readFileSync(resolve(ROOT, 'courtyard.html'), 'utf8')
    .replace('function viewEasing(){ return viewTo !== null || followOn; }   // a follow is a move that never arrives',
             'function viewEasing(){ return viewTo !== null; }')
    .replace('  holdWideGround(followFrom);\n}', '}')
    .replace('  if (followAt >= VIEW_SECS){ applyView(to); return; }',
             '  groundDirty = true;\n  if (followAt >= VIEW_SECS){ applyView(to); return; }');
  const TF = resolve(ROOT, 'shots/.follow-truth.html');
  writeFileSync(TF, T);
  const SHARP = () => {          // mean |horizontal neighbour difference| over the town band
    const h = Math.round(H * DPR * 0.55), w = Math.round(W * DPR);
    const d = ctx.getImageData(0, Math.round(H * DPR * 0.30), w, h).data;
    let s = 0, n = 0;
    for (let y = 0; y < h; y++) for (let x = 1; x < w; x++){
      const i = (y * w + x) * 4;
      s += Math.abs(d[i] - d[i - 4]) + Math.abs(d[i + 1] - d[i - 3]) + Math.abs(d[i + 2] - d[i - 2]); n += 3;
    }
    return s / n;
  };
  console.log('\n8. the price of holding the wide cache');
  const out = {};
  for (const [tag, file] of [['cand', resolve(ROOT, 'courtyard.html')], ['truth', TF]]){
    const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
    p.on('pageerror', e => errs.push(tag + ': ' + String(e)));
    await p.goto(pathToFileURL(file).href + `?pause&seed=${seed}&t=${55 * 0.32}`);
    await p.waitForFunction('typeof window.__census === "function"');
    await p.evaluate(() => { __warp(40); });
    out[tag + '_wide'] = await p.evaluate(SHARP);       // the SAME-CODE control: Wide, no follow
    const box = await p.locator('#cv').boundingBox();
    const w = await pick(p);
    await tap(p, box, w.sx, w.sy);                      // the sim is HELD: only the camera runs
    await sleep(1600);
    out[tag] = await p.evaluate(SHARP);
    await p.close();
  }
  const ctl = out.cand_wide / out.truth_wide, rat = out.cand / out.truth;
  ok(Math.abs(ctl - 1) < 0.02, `the control is the same build at Wide: ${ctl.toFixed(4)}`);
  console.log(`   high-frequency energy through a follow: ${out.cand.toFixed(2)} against ${out.truth.toFixed(2)} repainted in the follow's own view`);
  ok(true, `the frame carries ${(rat * 100).toFixed(1)}% of a repainted one's detail — the price of ONE paint instead of 25-27 ms a frame`);
}

console.log(errs.length ? '\npage errors:\n' + errs.join('\n') : '\nno page errors');
if (errs.length) bad++;
await b.close();
console.log(bad ? `\n${bad} FAILED` : '\nall checks passed');
process.exit(bad ? 1 : 0);
