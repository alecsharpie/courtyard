/* #174 (a) — do the BOATS have an image, is it theirs, and does it MOVE with them?
 *
 * The mirror's five casters are all STILL. The boats are the only things on the water
 * that move, and every one of them is a sprite drawn from a projected foot — invisible to
 * setMirror(-1), which is why they were left out (see spriteMirror). So three questions a
 * screenshot cannot answer:
 *
 *  1. MASS, as a ratio to a control that is RUN. The control is the same HEAD file against
 *     itself at the same warp: a ?paused page still runs rAF, so two loads of one build
 *     differ by a few pixels and every number below is quoted against that floor.
 *  2. WHOSE. Every changed pixel is attributed by inverting project() at z=0: it must be
 *     over the CHANNEL (onChannel, so the fountain and the pond are excluded by the same
 *     predicate the shade uses) and SOUTH of some hull's own row, because project() lifts
 *     z northward and an image therefore runs southward out of its caster's feet. A pixel
 *     NORTH of every hull is the fault this probe exists to catch.
 *  3. WHETHER IT MOVES. The same measurement two warp steps later: the image's centroid
 *     must travel with the punt's own projected foot, not sit where it was.
 *
 * A ?t= cannot reach a punt under way — a crossing is simulated state, not a clock — so
 * the instant is reached by __warp and named by its step count.
 *
 *   node probes/boat-mirror.mjs [seed] [steps] [w] [h]
 * seed 7 at 46 steps of 4 s is hour 15.3: punt A on leg 4 with her punter aboard, the
 * barge alongside at work, the rowboat at row 7.2 — all three classes at once.
 */
import { homedir } from 'node:os'; import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url'; import { readFileSync, writeFileSync } from 'node:fs';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const SEED = +(process.argv[2] || 7), STEPS = +(process.argv[3] || 46);
const VW = +(process.argv[4] || 1600), VH = +(process.argv[5] || 950);
const HEAD = '/tmp/head-174.html';
const b = await chromium.launch();
async function shoot(file, steps){
  const p = await b.newPage({ viewport: { width: VW, height: VH } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(pathToFileURL(resolve(file)).href + `?seed=${SEED}&pause`);
  await p.waitForFunction('typeof __warp === "function"');
  const r = await p.evaluate(n => {
    __reseed();
    for (let k = 0; k < n; k++) __warp(4);
    drawScene(simT, 1 / 30);
    const hulls = [];
    for (const P of PUNTS) hulls.push({ k: 'punt', y: P.y, x: P.x, leg: P.leg,
      crew: !!(P.rider && P.rider.aboard), sx: project(P.x, P.y, 0)[0], sy: project(P.x, P.y, 0)[1] });
    if (boat) hulls.push({ k: 'rowboat', y: boat.y, x: boat.x, sx: project(boat.x, boat.y, 0)[0], sy: project(boat.x, boat.y, 0)[1] });
    if (barge) hulls.push({ k: 'barge', y: barge.y, x: barge.x, leg: barge.leg,
      sx: project(barge.x, barge.y, 0)[0], sy: project(barge.x, barge.y, 0)[1] });
    return { url: cv.toDataURL(), hulls, hour: +hour.toFixed(2), day, wind: +windF().toFixed(3),
             rain: +rainFall.toFixed(3), daylight: +daylight.toFixed(2) };
  }, steps);
  if (errs.length) console.log('  PAGE ERRORS', file, errs.slice(0, 3));
  await p.close(); return r;
}
async function diff(aUrl, cUrl, hulls){
  const p = await b.newPage({ viewport: { width: VW, height: VH } });
  await p.goto(pathToFileURL(resolve('courtyard.html')).href + `?seed=${SEED}&pause`);
  await p.waitForFunction('typeof __warp === "function"');
  const r = await p.evaluate(async ([ua, ub, hs]) => {
    const load = async u => { const im = new Image(); await new Promise(r => { im.onload = r; im.src = u; });
      const c = document.createElement('canvas'); c.width = cv.width; c.height = cv.height;
      c.getContext('2d').drawImage(im, 0, 0); return c.getContext('2d').getImageData(0,0,cv.width,cv.height).data; };
    const A = await load(ua), B = await load(ub);
    const w = cv.width, h = cv.height, sx = w / W, sy = h / H;
    const by = {}; let sumX = 0, sumY = 0, n = 0, sum = 0, peak = 0, off = 0, north = 0, dry = 0;
    for (let py = 0; py < h; py++) for (let px = 0; px < w; px++){
      const i = (py * w + px) * 4;
      const d = (Math.abs(A[i]-B[i]) + Math.abs(A[i+1]-B[i+1]) + Math.abs(A[i+2]-B[i+2])) / 3;
      if (d <= 0.5) continue;
      const wy = (py / sy - topPad) / cellH;
      const wx = FOCUS + (px / sx - originX) / (cellW * (1 - PINCH * (1 - wy / WH)));
      const gx = wx | 0, gy = wy | 0;
      if (wy < 0 || gy >= WH || gx < 0 || gx >= GW){ off++; continue; }
      if (!onChannel(gx, gy, grid[gy * GW + gx])){ dry++; continue; }
      // whose, and is it SOUTH of them? an image runs out of its caster's feet downstream-of-eye
      let own = null;
      for (const H2 of hs) if (wy >= H2.y - 1.6 && wy <= H2.y + 6.0 && Math.abs(wx - H2.x) < 4.0)
        if (!own || Math.abs(wy - H2.y) < Math.abs(wy - own.y)) own = H2;
      if (!own){ north++; continue; }
      by[own.k] = by[own.k] || { px: 0, sum: 0, peak: 0, cx: 0, cy: 0 };
      by[own.k].px++; by[own.k].sum += d; by[own.k].peak = Math.max(by[own.k].peak, d);
      by[own.k].cx += px / sx; by[own.k].cy += py / sy;
      n++; sum += d; if (d > peak) peak = d;
      sumX += px / sx; sumY += py / sy;
    }
    for (const k in by){ by[k].meanD = +(by[k].sum / by[k].px).toFixed(2); by[k].peak = +by[k].peak.toFixed(1);
      by[k].cx = +(by[k].cx / by[k].px).toFixed(1); by[k].cy = +(by[k].cy / by[k].px).toFixed(1); delete by[k].sum; }
    return { channelPx: n, meanD: +(sum / (n || 1)).toFixed(2), peakD: +peak.toFixed(1),
             offWorld: off, dryOrOffChannel: dry, notNearAnyHull: north, by,
             cx: +(sumX / (n || 1)).toFixed(1), cy: +(sumY / (n || 1)).toFixed(1) };
  }, [aUrl, cUrl, hulls]);
  await p.close(); return r;
}
/* the BEFORE is not HEAD. HEAD also has the barge hand at a fixed row, which this pass is
 * what found — two changes in one diff. So the pass is measured against a build made from
 * THIS source with drawBoatMirror's member list emptied: same code, differing in exactly
 * the one way asked about. HEAD is reported separately, as the hand's own move. */
const NOPASS = '/tmp/bm-nopass.html';
{ const s = readFileSync('courtyard.html', 'utf8');
  const a = '  const ms = boatMirrors();';
  if (!s.includes(a)) throw new Error('pass anchor missing');
  writeFileSync(NOPASS, s.replace(a, '  const ms = []; boatMirrors();')); }
console.log(`seed ${SEED}  ${VW}x${VH}`);
for (const steps of (process.env.BM_STEPS ? process.env.BM_STEPS.split(',').map(Number) : [STEPS, STEPS + 3])){
  const N = await shoot(NOPASS, steps), Nc = await shoot(NOPASS, steps), C = await shoot('courtyard.html', steps);
  const A = await shoot(HEAD, steps);
  console.log(`\n--- ${steps} warp steps: hour ${C.hour} day ${C.day} daylight ${C.daylight} ` +
              `windF ${C.wind} rainFall ${C.rain}`);
  console.log('    hulls:', JSON.stringify(C.hulls.map(h => ({ k: h.k, leg: h.leg, crew: h.crew,
    y: +h.y.toFixed(1), sx: +h.sx.toFixed(0), sy: +h.sy.toFixed(0) }))));
  const fl = await diff(N.url, Nc.url, C.hulls);
  const im = await diff(N.url, C.url, C.hulls);
  const hd = await diff(A.url, N.url, C.hulls);
  console.log('    CONTROL  same code, twice :', JSON.stringify(fl));
  console.log('    IMAGE    the pass, on/off :', JSON.stringify(im));
  console.log('    mass x floor:', (im.channelPx / Math.max(1, fl.channelPx)).toFixed(0),
              ' image centroid (css px):', im.cx, im.cy);
  console.log('    HAND     HEAD vs no-pass  :', JSON.stringify({ channelPx: hd.channelPx,
    meanD: hd.meanD, peakD: hd.peakD, notNearAnyHull: hd.notNearAnyHull }));
}
await b.close();
