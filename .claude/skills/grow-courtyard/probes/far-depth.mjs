/* #150 — does the distance behind the town have DEPTH?
 * Grades the backdrop strip only (canvas top -> hz + 4*cellH, the bottom of the layer
 * drawSky fills), against a SAME-CODE control run and against HEAD.
 *   mass   — how much of the strip changed, as a ratio to the same-code control floor
 *   ladder — the luma histogram of the DRAWN pixels in the strip (a pixel is drawn if it
 *            is darker than its own row's MODE, which is the sky): one peak per readable
 *            distance, found without reference to any constant in the source
 *   below  — everything under the backdrop layer must be byte-identical to HEAD
 *   night  — lit glass by row, and where HEAD and the candidate differ after dark
 */
import { pathToFileURL } from 'node:url'; import { homedir } from 'node:os'; import { join } from 'node:path';
const { chromium } = (await import(pathToFileURL(join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js')).href)).default;
const b = await chromium.launch();
const CAND = pathToFileURL('courtyard.html').href, HEAD = pathToFileURL('/tmp/courtyard-HEAD.html').href;
const VW = 1600, VH = 950;

let VW2 = VW, VH2 = VH;
async function grab(url, t, w, h){
  const ctx = await b.newContext({ viewport:{width:w||VW,height:h||VH}, deviceScaleFactor:1 });
  const p = await ctx.newPage();
  await p.goto(`${url}?seed=42&t=0&pause`, { waitUntil:'load' });
  await p.waitForFunction(() => typeof window.__warp === 'function');
  const o = await p.evaluate((secs) => {
    window.__reseed(); window.__warp(secs);
    groundDirty = true; backKey = ''; drawScene(simT, 1 / 30);      // pin the frame inside the evaluate
    const cv = document.querySelector('canvas'), g = cv.getContext('2d');
    const dpr = cv.width / cv.getBoundingClientRect().width;
    const hz = topPad - 3.4 * cellH;
    return { w:cv.width, h:cv.height, dpr, yFoot: Math.round((hz + 4 * cellH) * dpr),
             hz: hz * dpr, cellH: cellH * dpr, hour:+hour.toFixed(2), nightF:+nightF.toFixed(3),
             px: Array.from(g.getImageData(0, 0, cv.width, cv.height).data),
             back: Array.from(btx.getImageData(0, 0, bcv.width, bcv.height).data) };   // the layer alone
  }, t);
  await ctx.close(); return o;
}
const L = (d,i) => 0.299*d[i] + 0.587*d[i+1] + 0.114*d[i+2];
function massDiff(a, c, y0, y1){
  let n = 0, tot = 0;
  for (let y = y0; y < y1; y++) for (let x = 0; x < a.w; x++){
    const i = (y*a.w + x)*4; tot++;
    if (Math.abs(L(a.px,i) - L(c.px,i)) >= 2) n++;
  }
  return +(100*n/tot).toFixed(3);
}
function bytesDiff(a, c, y0, y1){
  let n = 0;
  for (let y = y0; y < y1; y++) for (let x = 0; x < a.w; x++){
    const i = (y*a.w + x)*4;
    if (a.px[i]!==c.px[i] || a.px[i+1]!==c.px[i+1] || a.px[i+2]!==c.px[i+2]) n++;
  }
  return n;
}
function ladder(a, y0, y1){
  const x0 = Math.round(a.w*0.30), x1 = Math.round(a.w*0.70);   // clear of the mount at both edges
  const bins = new Array(128).fill(0); let tot = 0;
  for (let y = y0; y < y1; y++){
    const row = [], cnt = new Map();
    for (let x = x0; x < x1; x++){
      const v = Math.round(L(a.px, (y*a.w + x)*4)); row.push(v); cnt.set(v, (cnt.get(v)||0)+1);
    }
    let mode = 0, best = -1;
    for (const [v, n] of cnt) if (n > best){ best = n; mode = v; }
    for (const v of row) if (v < mode - 3){ bins[Math.min(127, Math.max(0, Math.round(v/2)))]++; tot++; }
  }
  if (!tot) return { drawn:0, peaks:[] };
  const sm = bins.map((_, i) => (bins[Math.max(0,i-1)] + bins[i] + bins[Math.min(127,i+1)]) / 3);
  const peaks = [];
  for (let i = 1; i < 127; i++)
    if (sm[i] > sm[i-1] && sm[i] >= sm[i+1] && bins[i]/tot > 0.02) peaks.push(`${i*2}:${(100*bins[i]/tot).toFixed(0)}%`);
  let sum = 0, s2 = 0;
  for (let i = 0; i < 128; i++){ sum += bins[i]*i*2; s2 += bins[i]*(i*2)**2; }
  const mean = sum/tot, sd = Math.sqrt(s2/tot - mean*mean);
  return { drawn: +(100*tot/((x1-x0)*(y1-y0))).toFixed(1), peaks,
           mean:+mean.toFixed(1), sd:+sd.toFixed(1), sdOverMean:+(sd/mean).toFixed(3) };
}
/* The layer ALONE, before the town covers it and before applyLight multiplies it: every
 * opaque pixel of bcv, by colour. One rung of the ladder per colour, with its area. */
function rungs(a){
  const c = new Map();
  for (let i = 0; i < a.back.length; i += 4){
    if (a.back[i+3] < 250) continue;
    const k = a.back[i]+','+a.back[i+1]+','+a.back[i+2];
    c.set(k, (c.get(k)||0)+1);
  }
  return [...c].filter(([,n]) => n > 400).sort((p,q) => {
    const lp = p[0].split(',').map(Number), lq = q[0].split(',').map(Number);
    return (0.299*lq[0]+0.587*lq[1]+0.114*lq[2]) - (0.299*lp[0]+0.587*lp[1]+0.114*lp[2]);
  }).map(([k,n]) => { const v = k.split(',').map(Number);
    return { luma:+(0.299*v[0]+0.587*v[1]+0.114*v[2]).toFixed(1), px:n }; });
}
/* and how much of each rung SURVIVES to the screen: the same colour, within 2 luma,
 * anywhere in the strip of the finished frame. */
function visible(a, rung, y0, y1){
  let n = 0;
  for (let y = y0; y < y1; y++) for (let x = 0; x < a.w; x++){
    const i = (y*a.w+x)*4;
    if (a.back[i+3] < 250) continue;                                   // the layer is not here
    if (Math.abs(L(a.back,i) - rung.luma) > 0.6) continue;             // a different rung
    if (Math.abs(L(a.px,i) - L(a.back,i)) < 2.5) n++;                  // and it survived to the screen
  }
  return n;
}
const warm = (d,i) => d[i] - d[i+2] > 14 && d[i] > d[i+1];
function litRows(a, y0, y1, src){                   // warm pixels per cellH row below hz
  const d = src === 'back' ? a.back : a.px, out = [];
  for (let k = -3; k <= 5; k++){
    const r0 = Math.max(y0, Math.round(a.hz + k*a.cellH)), r1 = Math.min(y1, Math.round(a.hz + (k+1)*a.cellH));
    let n = 0;
    for (let y = r0; y < r1; y++) for (let x = 0; x < a.w; x++){
      const i = (y*a.w+x)*4;
      if (src === 'back' && d[i+3] < 8) continue;
      if (warm(d, i)) n++;
    }
    out.push(n);
  }
  return out;
}

const T = 175;
const h1 = await grab(HEAD, T), h2 = await grab(HEAD, T), c1 = await grab(CAND, T);
console.log(`canvas ${h1.w}x${h1.h} dpr ${h1.dpr} · strip rows 0..${h1.yFoot} · hz ${h1.hz.toFixed(1)} cellH ${h1.cellH.toFixed(2)} · hour ${h1.hour}`);
console.log(`MASS in the strip   control(HEAD:HEAD) ${massDiff(h1,h2,0,h1.yFoot)}%   candidate ${massDiff(h1,c1,0,h1.yFoot)}%`);
console.log(`BELOW the foot      control ${bytesDiff(h1,h2,h1.yFoot,h1.h)} px   candidate ${bytesDiff(h1,c1,h1.yFoot,h1.h)} px  (must be 0)`);
console.log('LADDER of the drawn pixels in the strip (luma:share, peaks >=2%)');
console.log('  HEAD', JSON.stringify(ladder(h1, 0, h1.yFoot)));
console.log('  CAND', JSON.stringify(ladder(c1, 0, c1.yFoot)));
console.log('RUNGS of the backdrop layer itself (bcv, opaque pixels by colour, >400 px)');
for (const [nm, a] of [['HEAD', h1], ['CAND', c1]])
  console.log(`  ${nm}`, rungs(a).map(r => `L${r.luma} ${r.px}px drawn / ${visible(a, r, 0, a.yFoot)}px on screen`).join('  |  '));

console.log('\nNIGHT — warm (lit) pixels per cellH row, rows hz-3 .. hz+5');
for (const t of [615, 640, 660, 700, 730]){
  const hh = await grab(HEAD, t), cc = await grab(CAND, t);
  console.log(`  t=${t} hour ${cc.hour} nightF ${cc.nightF} mass ${massDiff(hh,cc,0,hh.yFoot)}%`);
  for (const [nm, a] of [['HEAD', hh], ['CAND', cc]])
    console.log(`     ${nm} layer ${JSON.stringify(litRows(a,0,a.yFoot,'back'))}  screen ${JSON.stringify(litRows(a,0,a.yFoot))}`);
}
console.log('\nBELOW the backdrop layer at every instant and both shipping sizes (must be 0)');
for (const [w,h,nm] of [[1600,950,'desktop'],[390,844,'phone']]){
  VW2 = w; VH2 = h;
  for (const t of [175, 400, 640, 700, 1069]){
    const hh = await grab(HEAD, t, w, h), cc = await grab(CAND, t, w, h);
    console.log(`  ${nm} t=${t} hour ${cc.hour}: ${bytesDiff(hh, cc, hh.yFoot, hh.h)} px differ below the foot; strip mass ${massDiff(hh, cc, 0, hh.yFoot)}%`);
  }
}
await b.close();
