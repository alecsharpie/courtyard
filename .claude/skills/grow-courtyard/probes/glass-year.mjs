#!/usr/bin/env node
/* b116 — the glasshouse, proved two ways.
 *
 * A. DIFFERENCE IMAGE, masked by the page's own unproject() so every screen pixel is
 *    attributed to a ground cell: the span's footprint, the rest of the allotment block,
 *    and everywhere else. Quoted as a RATIO to a HEAD-vs-HEAD control run at the same
 *    seed and instant, because reseed+warp+drawScene leaves ~1% of the frame unpinned.
 *
 * B. THE WINTER CLAIM. Warp a year at a fixed hour and count stage-3 cells inside the
 *    span against the open plots outside it, with bloomCap() beside them; then step an
 *    evening and record the hours the lamp is lit.
 */
import { homedir } from 'node:os'; import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url'; import { writeFileSync, mkdirSync } from 'node:fs';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const argv = process.argv.slice(2); const arg=(k,d)=>{const i=argv.indexOf(k);return i<0?d:argv[i+1];};
const SEED = Number(arg('--seed', 7));
const CAND = arg('--cand', 'courtyard.html');
mkdirSync('shots', {recursive:true});

const PIN = `(d) => { __reseed(); __warp(d*55); __reseed(); drawScene(simT, 1/30); }`;

async function open(file, w, h){
  const b = await chromium.launch();
  const p = await b.newPage({viewport:{width:w,height:h}});
  await p.goto(pathToFileURL(resolve(file)).href + `?pause&seed=${SEED}`);
  await p.waitForFunction(() => typeof window.__warp === 'function');
  return [b, p];
}
async function frame(file, w, h, day){
  const [b, p] = await open(file, w, h);
  const url = await p.evaluate(([d,pin]) => { eval('(' + pin + ')')(d); return cv.toDataURL(); }, [day, PIN]);
  await b.close(); return url;
}

/* the mask. HEAD has no inGlass(), so the control spells the same box out literally —
 * otherwise the control is not running the same test as the candidate. */
const ANALYSE = `(headUrl, pin, day) => new Promise(res => {
  const IG = typeof inGlass === 'function' ? inGlass
           : (x, y) => x >= 84 && x <= 93 && y >= 34 && y <= 39;
  eval('(' + pin + ')')(day);
  const im = new Image();
  im.onload = () => {
    const oc = document.createElement('canvas'); oc.width = cv.width; oc.height = cv.height;
    const og = oc.getContext('2d'); og.drawImage(im, 0, 0);
    const A = og.getImageData(0,0,cv.width,cv.height).data;
    const B = cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;
    const sx = cv.width / W, sy = cv.height / H;
    const N={span:0,allot:0,other:0}, HIT={span:0,allot:0,other:0}, SUM={span:0,allot:0,other:0}, PK={span:0,allot:0,other:0};
    const out = new Uint8ClampedArray(cv.width * cv.height * 4);
    for (let py = 0; py < cv.height; py++) for (let px = 0; px < cv.width; px++){
      const i = (py * cv.width + px) * 4;
      const d = (Math.abs(A[i]-B[i]) + Math.abs(A[i+1]-B[i+1]) + Math.abs(A[i+2]-B[i+2])) / 3;
      const v = Math.min(255, d * 8); out[i]=v; out[i+1]=v; out[i+2]=v; out[i+3]=255;
      const [wx, wy] = unproject(px / sx, py / sy);
      const cx = Math.floor(wx), cy = Math.floor(wy);
      const ok = cx>=0 && cy>=0 && cx<GW && cy<WH;
      // the span's footprint is LIFTED up the frame by its own height, so the region has to
      // reach the rows the roof projects into, not just the rows the floor sits on
      const reg = ok && (IG(cx, cy) || (cx>=84 && cx<=93 && cy>=31 && cy<=40)) ? 'span'
                : ok && inAllotment(cx, cy) ? 'allot' : 'other';
      N[reg]++; SUM[reg]+=d; if (d>6) HIT[reg]++; if (d>PK[reg]) PK[reg]=d;
    }
    const oc2 = document.createElement('canvas'); oc2.width = cv.width; oc2.height = cv.height;
    const g2 = oc2.getContext('2d'); const idat = g2.createImageData(cv.width, cv.height);
    idat.data.set(out); g2.putImageData(idat, 0, 0);
    const stat = {}; for (const k in N) stat[k] = {px:N[k], changed:HIT[k],
      pct:+(100*HIT[k]/(N[k]||1)).toFixed(2), mean:+(SUM[k]/(N[k]||1)).toFixed(3), peak:+PK[k].toFixed(1)};
    res({stat, diff: oc2.toDataURL()});
  };
  im.src = headUrl;
})`;

const W_ = 1600, H_ = 950, DAY = 4;
console.log(`\n=== A. difference image  ${W_}x${H_}  seed ${SEED}  day ${DAY} ===`);
const headPng = await frame('/tmp/head116.html', W_, H_, DAY);
for (const [label, file] of [['CONTROL head-vs-head', '/tmp/head116.html'], ['CANDIDATE', CAND]]){
  const [b, p] = await open(file, W_, H_);
  const r = await p.evaluate(([u,pin,d,src]) => eval('(' + src + ')')(u,pin,d), [headPng, PIN, DAY, ANALYSE]);
  await b.close();
  console.log(`\n${label}`);
  for (const k of ['span','allot','other'])
    console.log(`  ${k.padEnd(6)} px ${String(r.stat[k].px).padStart(7)}  changed ${String(r.stat[k].pct).padStart(6)}%  meanD ${String(r.stat[k].mean).padStart(6)}  peak ${r.stat[k].peak}`);
  writeFileSync(`shots/glass-diff-${label.split(' ')[0].toLowerCase()}.png`,
    Buffer.from(r.diff.split(',')[1], 'base64'));
}

/* ---- B. the winter claim ------------------------------------------------------- */
const YEAR = `() => {
  __reseed();
  const rows = [];
  for (let k = 0; k < 52; k++){
    __warp(55);
    let gN=0, gRipe=0, gSown=0, oN=0, oRipe=0, oSown=0;
    for (let y = 3; y < 61; y++) for (let x = 78; x < 96; x++){
      const i = y*GW+x; if (grid[i] !== BED) continue;
      const g = inGlass(x, y);
      if (g){ gN++; if (bSp[i]) gSown++; if (bSt[i]===3) gRipe++; }
      else  { oN++; if (bSp[i]) oSown++; if (bSt[i]===3) oRipe++; }
    }
    const bs = __census().planting.bySpecies;
    rows.push({day, hour:+hour.toFixed(1), warmth:+warmth.toFixed(3), cap:+bloomCap().toFixed(2),
               gN, gSown, gRipe, oN, oSown, oRipe, ripePlots:ripePlots(), tom: bs.tomatoes || 0});
  }
  return rows;
}`;
{
  const [b, p] = await open(CAND, 1280, 700);
  const rows = await p.evaluate((src) => eval('(' + src + ')')(), YEAR);
  await b.close();
  console.log('\n=== B. a year at a fixed hour — stage 3 inside the span vs the open plots ===');
  console.log('  day  hour  warmth  bloomCap |  glass sown/ripe of 12 | open sown/ripe of 90 | ripePlots  tomatoes');
  let winterG = 0, winterO = 0, wn = 0;
  for (const r of rows){
    const cold = r.cap < 2.05;
    console.log(`  ${String(r.day).padStart(3)}  ${String(r.hour).padStart(4)}  ${String(r.warmth).padStart(6)}  ${String(r.cap).padStart(7)}  |   ${String(r.gSown).padStart(2)}/${String(r.gRipe).padStart(2)} of ${r.gN}        |  ${String(r.oSown).padStart(2)}/${String(r.oRipe).padStart(2)} of ${r.oN}       |    ${String(r.ripePlots).padStart(2)}      ${String(r.tom).padStart(3)}${cold ? '   <- cap down' : ''}`);
    if (cold){ winterG += r.gRipe / r.gN; winterO += r.oRipe / r.oN; wn++; }
  }
  if (wn) console.log(`\n  WITH THE CEILING DOWN (${wn} samples): ripe share under glass ${(100*winterG/wn).toFixed(1)}%  vs open plots ${(100*winterO/wn).toFixed(1)}%`);
}

/* the lamp, across one midwinter evening */
const LAMP = `() => {
  __reseed();
  let guard = 0;
  while (guard++ < 400){ __warp(55); if (season() < 0.06 || season() > 0.94) break; }   // midwinter
  const start = {day, season:+season().toFixed(3)};
  const on = [];
  for (let k = 0; k < 220; k++){
    __warp(0.25);
    if (windowLit(GH_LAMP.sa, GH_LAMP.sb)) on.push(+hour.toFixed(2));
  }
  return {start, first:on[0], last:on[on.length-1], n:on.length, nightF, cap:+bloomCap().toFixed(2)};
}`;
{
  const [b, p] = await open(CAND, 1280, 700);
  const r = await p.evaluate((src) => eval('(' + src + ')')(), LAMP);
  await b.close();
  console.log('\n=== B2. the glasshouse lamp, one midwinter day ===');
  console.log('  ' + JSON.stringify(r));
}
