/* far-depth.mjs — what is actually IN the sky strip above hz, measured against
 * same-code controls that draw the strip with pieces of it turned off.
 *
 * The strip is the band from the top of the canvas down to the far horizon. One page,
 * one pinned instant, N renders of the SAME build differing in exactly one drawn thing:
 *
 *   BARE     no hill tiers, no far ranks, no clouds — the gradient, the sun, and nothing
 *   SKY      the clouds back, still no backdrop      NOB   the hills, no far town
 *   TIER k   the k-th hill tier ALONE (furthest first)   FULL   the picture as shipped
 *
 * Every number is a pixel count off those masks, never a re-derivation of a constant:
 * the page reports the hz and cellH it DREW with, and a silhouette is the topmost row at
 * which a mask fires. Two facts this exists to keep straight:
 *   · the strip is NOT a constant height in cellH — topPad swallows the window's spare,
 *     so it runs 12.3 cellH at 1200x700 to 52.2 at 390x844;
 *   · the strip's other tenant is the LIVE cloud layer, which the backdrop is composited
 *     OVER. A backdrop-only mask cannot see it, so "empty gradient" must be quoted
 *     against BARE (total occupancy), or a tier that merely occludes cloud reads as gain.
 *
 *   node probes/far-depth.mjs [seed] [simT] [file|HEAD]
 */
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;

const seed = +(process.argv[2] || 7), T = +(process.argv[3] || 175), FILE = process.argv[4] || 'courtyard.html';
const SIZES = [[1600, 950], [1200, 700], [900, 560], [390, 844]];

let src = FILE === 'HEAD' ? execFileSync('git', ['show', 'HEAD:courtyard.html'], { maxBuffer: 1 << 28 }).toString() : readFileSync(FILE, 'utf8');
const patch = (a, b) => { if (!src.includes(a)){ console.log('PATCH MISS: ' + a.slice(0, 70)); process.exit(1); } src = src.replace(a, b); };
patch('function drawBackdrop(g, hz, low){\n  FAR_WIN.length = 0;',
      'function drawBackdrop(g, hz, low){\n  FAR_WIN.length = 0;\n  window.__hz = hz; window.__cellH = cellH;\n  window.__topPad = topPad; window.__rI = -1;');
// the tiers, whatever there are of them: an index per call, kept or skipped by the probe
patch('  const ridge = (', '  const ridge = (...ARGS) => { const i = ++window.__rI; window.__rN = i + 1;\n    if (!window.__ridgeOnly || window.__ridgeOnly.indexOf(i) >= 0) ridge0(...ARGS); };\n  const ridge0 = (');
patch('  for (let i = 0; i < FAR_BANDS.length; i++){\n    const b = FAR_BANDS[i], base = hz + b.base * cellH, houses = [];',
      '  for (let i = 0; i < FAR_BANDS.length && !window.__noBands && i <= (window.__bandMax == null ? 9 : window.__bandMax); i++){\n    const b = FAR_BANDS[i], base = hz + b.base * cellH, houses = [];');
patch('  if (nightF > 0.3){\n    const n = nightAt();', '  if (nightF > 0.3 && !window.__noBands){\n    const n = nightAt();');
patch('      if (b.lit <= 0) continue;', '      if (b.lit <= 0 || !roofs[i]) continue;');   // a truncated rank set lights nothing
patch('  drawClouds(g, hz);', '  if (!window.__noClouds) drawClouds(g, hz);');
const tmp = `/tmp/probe-far-depth-${FILE === 'HEAD' ? 'head' : 'cand'}.html`;
writeFileSync(tmp, src);

const b = await chromium.launch();
const run = async (W, H) => {
  const pg = await b.newPage({ viewport: { width: W, height: H } });
  const errs = []; pg.on('pageerror', e => errs.push(String(e)));
  await pg.goto(pathToFileURL(tmp).href + `?pause&seed=${seed}&t=0`);
  await pg.waitForFunction('window.__census');
  const out = await pg.evaluate((T) => {
    const cv = document.querySelector('canvas'), cx = cv.getContext('2d');
    /* ONE warp, then every variant drawn at the SAME instant: __warp ADVANCES, so
     * warping per variant renders a different sky and every mask fires everywhere. */
    window.__reseed(); window.__warp(T);
    const simT = window.__census().clock.simT;
    const draw = (flags) => {
      Object.assign(window, { __noBands: 0, __noClouds: 0, __bandMax: null, __ridgeOnly: null }, flags);
      backKey = '';                                     // the backdrop is a CACHE: force the rebuild
      drawScene(simT, 1 / 30);
      const hzPx = Math.max(1, Math.floor(window.__hz * DPR));
      return { px: cx.getImageData(0, 0, cv.width, hzPx).data, h: hzPx };
    };
    const FULL = draw({});
    const nT = window.__rN;                             // how many hill tiers this build has
    const BARE = draw({ __noBands: 1, __ridgeOnly: [], __noClouds: 1 });
    const SKY = draw({ __noBands: 1, __ridgeOnly: [] });
    const NOB = draw({ __noBands: 1 });
    const tiers = []; for (let k = 0; k < nT; k++) tiers.push(draw({ __noBands: 1, __ridgeOnly: [k] }));
    const C = [NOB]; for (let k = 0; k < 4; k++) C.push(draw({ __bandMax: k }));
    const FULLNC = draw({ __noClouds: 1 });      // the picture with the weather taken out:
    const FULL2 = draw({});                      // FULL - FULLNC is the cloud you can SEE
    const w = cv.width, h = SKY.h;
    const mask = (A, B) => {
      const top = new Int32Array(w).fill(-1); let n = 0;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){
        const i = (y * w + x) * 4;
        if (Math.abs(A.px[i] - B.px[i]) > 2 || Math.abs(A.px[i+1] - B.px[i+1]) > 2 || Math.abs(A.px[i+2] - B.px[i+2]) > 2){
          n++; if (top[x] < 0) top[x] = y;
        }
      }
      return { top: Array.from(top), n };
    };
    const pack = m => ({ top: m.top, n: m.n });
    return { w, h, dpr: DPR, hz: window.__hz, cellH: window.__cellH, topPad: window.__topPad, nT,
             total: pack(mask(FULL, BARE)), cloudN: mask(SKY, BARE).n, cloudVis: mask(FULL, FULLNC).n,
             all: pack(mask(FULL, SKY)), band: pack(mask(FULL, NOB)), ridge: pack(mask(NOB, SKY)),
             tiers: tiers.map(t => pack(mask(t, SKY))),
             bands: [0,1,2,3].map(k => pack(mask(C[k + 1], C[k]))),
             self: mask(FULL, FULL2).n, night: nightF, cover: cloudCover() };
  }, T);
  await pg.close();
  if (errs.length){ console.log('PAGE ERROR: ' + errs[0]); process.exit(1); }
  return out;
};

const stat = (a) => { const s = a.slice().sort((p, q) => p - q); return { min: s[0], med: s[s.length >> 1], max: s[s.length - 1], mean: a.reduce((p, q) => p + q, 0) / a.length }; };
const f2 = x => x.toFixed(2), pc = x => (100 * x).toFixed(1) + '%';

console.log(`far-depth  ${FILE}  seed ${seed}  simT ${T}`);
for (const [W, H] of SIZES){
  const o = await run(W, H);
  const up = v => (o.h - v) / (o.cellH * o.dpr), area = o.w * o.h, cols = o.w, strip = o.hz / o.cellH;
  const vis = [];                                   // columns our own towers do not cover
  for (let x = 0; x < cols; x++) if (o.total.top[x] >= 0 || o.all.top[x] >= 0) vis.push(x);
  const hOf = (m) => stat(vis.map(x => m.top[x] < 0 ? 0 : up(m.top[x])));
  console.log(`\n== ${W}x${H}  night ${f2(o.night)} cover ${f2(o.cover)}  canvas ${o.w}x${o.h}  cellH ${f2(o.cellH)}  strip ${f2(strip)} cellH  tiers ${o.nT}`);
  if (o.self) console.log(`   !! REDRAW NOT IDEMPOTENT: ${o.self} px — every mask below is suspect`);
  console.log(`   occupancy of the strip   TOTAL ${pc(o.total.n / area)}  =  backdrop ${pc(o.all.n / area)} over clouds ${pc(o.cloudN / area)}  ·  cloud STILL VISIBLE in the finished strip ${pc(o.cloudVis / area)}`);
  const sT = hOf(o.total), sA = hOf(o.all);
  console.log(`   silhouette above hz, cellH   backdrop med ${f2(sA.med)} max ${f2(sA.max)}   ·  anything-at-all med ${f2(sT.med)} max ${f2(sT.max)}   (strip ${f2(strip)})`);
  console.log(`   bare gradient above the backdrop silhouette ${pc(1 - sA.mean / strip)}   ·  above ANYTHING ${pc(1 - sT.mean / strip)}`);
  const tiersH = o.tiers.map(hOf);
  console.log('   hill tiers (furthest first): ' + tiersH.map((t, k) => `#${k} min ${f2(t.min)} med ${f2(t.med)} max ${f2(t.max)}`).join('  ·  '));
  const nearT = o.tiers[o.tiers.length - 1];        // the nearest hill tier
  for (let k = 0; k < 4; k++){
    let n = 0, oN = 0, bS = 0, hs = [];
    for (const x of vis){
      const bt = o.bands[k].top[x]; if (bt < 0) continue;
      n++; hs.push(up(bt));
      if (nearT.top[x] < 0 || bt < nearT.top[x]) oN++;
      if (o.ridge.top[x] < 0 || bt < o.ridge.top[x]) bS++;
    }
    if (!n){ console.log(`     rank ${k}: INVISIBLE`); continue; }
    const h = stat(hs);
    console.log(`     rank ${k}: ${pc(n / cols)} of cols  apex med ${f2(h.med)} max ${f2(h.max)}  ·  over the NEAREST hill ${pc(oN / n)}  ·  against open SKY ${pc(bS / n)}`);
  }
}
await b.close();
