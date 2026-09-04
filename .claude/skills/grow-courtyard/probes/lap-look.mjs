#!/usr/bin/env node
/* #200 — the shipping-size look gate: a DIFFERENCE IMAGE and a number, with a same-code
 * control. HEAD's midwinter frame is carried into the candidate page and diffed there, so
 * every changed pixel is attributed through the page's OWN unproject() to the ground cell
 * under it and bucketed: LAP (the towpath column the high water lies on), MARGIN (the ice
 * that was already there — the containment claim: this must stay at the control's floor),
 * and ELSEWHERE.
 *   node probe-lap-look.mjs                              the change
 *   node probe-lap-look.mjs --cand /tmp/c200-head.html   the same-code control (all zero)
 */
import { homedir } from 'node:os'; import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url'; import { writeFileSync, mkdirSync } from 'node:fs';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const argv = process.argv.slice(2); const arg=(k,d)=>{const i=argv.indexOf(k);return i<0?d:argv[i+1];};
const CAND = arg('--cand', 'courtyard.html');
const REF  = arg('--ref', '/tmp/c200-head.html');
const WARP = Number(arg('--warp', 1220));
const SEEDS = (arg('--seeds','7,42,1234')).split(',').map(Number);
const SIZES = [[1600,950],[390,844]];
mkdirSync('shots', {recursive:true});
const PIN = `(w) => { __reseed(); __warp(w); __reseed(); drawScene(simT, 1/30); }`;

async function frame(file, w, h, seed){
  const b = await chromium.launch();
  const p = await b.newPage({viewport:{width:w,height:h}});
  await p.goto(pathToFileURL(resolve(file)).href + `?pause&seed=${seed}`);
  await p.waitForFunction(() => typeof window.__warp === 'function');
  const url = await p.evaluate(([w2,pin]) => { eval('(' + pin + ')')(w2); return cv.toDataURL(); }, [WARP, PIN]);
  await b.close(); return url;
}

const ANALYSE = `(headUrl, pin, w2) => new Promise(res => {
  // HEAD has no iceLap[]: spell the same set off the margin both builds share
  const LAP = typeof iceLap !== 'undefined' ? (i => !!iceLap[i]) : (i => bankWas[i] === SIDE && bankBed[i] !== 0);
  const MARG = new Set(ICE_CELLS.filter(i => !LAP(i)));
  eval('(' + pin + ')')(w2);
  const im = new Image();
  im.onload = () => {
    const oc = document.createElement('canvas'); oc.width = cv.width; oc.height = cv.height;
    const og = oc.getContext('2d'); og.drawImage(im, 0, 0);
    const A = og.getImageData(0,0,cv.width,cv.height).data;
    const B = cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;
    const sx = cv.width / W, sy = cv.height / H;
    const HIT = {lap:0, margin:0, other:0}, SUM = {lap:0, margin:0, other:0}, PK = {lap:0, margin:0, other:0};
    const AREA = {lap:0, margin:0, other:0};
    const out = new Uint8ClampedArray(cv.width * cv.height * 4);
    for (let py = 0; py < cv.height; py++) for (let px = 0; px < cv.width; px++){
      const i4 = (py * cv.width + px) * 4;
      const d = (Math.abs(A[i4]-B[i4]) + Math.abs(A[i4+1]-B[i4+1]) + Math.abs(A[i4+2]-B[i4+2])) / 3;
      const v = Math.min(255, d * 8); out[i4]=v; out[i4+1]=v; out[i4+2]=v; out[i4+3]=255;
      const [wx, wy] = unproject(px / sx, py / sy);
      const gx = wx|0, gy = wy|0;
      let k = 'other';
      if (gx >= 0 && gy >= 0 && gx < GW && gy < WH){
        const gi = gy * GW + gx;
        k = LAP(gi) ? 'lap' : MARG.has(gi) ? 'margin' : 'other';
      }
      AREA[k]++;
      if (d > 2){ HIT[k]++; SUM[k] += d; if (d > PK[k]) PK[k] = d; }
    }
    const oc2 = document.createElement('canvas'); oc2.width = cv.width; oc2.height = cv.height;
    oc2.getContext('2d').putImageData(new ImageData(out, cv.width, cv.height), 0, 0);
    res({HIT, SUM, PK, AREA, png: oc2.toDataURL()});
  };
  im.src = headUrl;
})`;

for (const seed of SEEDS){
  for (const [w, h] of SIZES){
    const headUrl = await frame(REF, w, h, seed);
    const b = await chromium.launch();
    const p = await b.newPage({viewport:{width:w,height:h}});
    await p.goto(pathToFileURL(resolve(CAND)).href + `?pause&seed=${seed}`);
    await p.waitForFunction(() => typeof window.__warp === 'function');
    const r = await p.evaluate(([u,pin,w2,an]) => eval('(' + an + ')')(u,pin,w2), [headUrl, PIN, WARP, ANALYSE]);
    await b.close();
    const f = (k) => `${k} hit ${String(r.HIT[k]).padStart(6)}  mass ${String(Math.round(r.SUM[k])).padStart(7)}  peak ${String(Math.round(r.PK[k])).padStart(3)}  (of ${r.AREA[k]} px)`;
    console.log(`seed ${String(seed).padStart(4)} ${w}x${h}   ` + ['lap','margin','other'].map(f).join('\n                       '));
    if (seed === SEEDS[0] && w === 1600)
      writeFileSync('shots/lap-diff.png', Buffer.from(r.png.split(',')[1], 'base64'));
  }
}
