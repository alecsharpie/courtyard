#!/usr/bin/env node
/* b116 — is the 9.9% of the frame that changed OUTSIDE the allotments a regression, or is
 * it the seeded world being reshuffled? Removing 48 GRASS cells removes 48 conditional
 * R() draws per caTick from the daisy branch, which shifts the whole PRNG stream (LAWS).
 * The control for "a different draw of the same world" is HEAD against HEAD at a
 * DIFFERENT SEED: if that lands at the same scale, 9.9% is the reshuffle, not damage. */
import { homedir } from 'node:os'; import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const PIN = `(d) => { __reseed(); __warp(d*55); __reseed(); drawScene(simT, 1/30); }`;
const W_=1600, H_=950, DAY=4;
async function shot(file, seed){
  const b = await chromium.launch();
  const p = await b.newPage({viewport:{width:W_,height:H_}});
  await p.goto(pathToFileURL(resolve(file)).href + `?pause&seed=${seed}`);
  await p.waitForFunction(() => typeof window.__warp === 'function');
  const u = await p.evaluate(([d,pin]) => { eval('('+pin+')')(d); return cv.toDataURL(); }, [DAY, PIN]);
  await b.close(); return u;
}
const CMP = `(headUrl, pin, day) => new Promise(res => {
  eval('(' + pin + ')')(day);
  const im = new Image();
  im.onload = () => {
    const oc = document.createElement('canvas'); oc.width=cv.width; oc.height=cv.height;
    oc.getContext('2d').drawImage(im,0,0);
    const A = oc.getContext('2d').getImageData(0,0,cv.width,cv.height).data;
    const B = cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;
    const sx=cv.width/W, sy=cv.height/H;
    let n=0, hit=0, sum=0;
    for (let py=0; py<cv.height; py++) for (let px=0; px<cv.width; px++){
      const [wx,wy]=unproject(px/sx,py/sy); const cx=wx|0, cy=wy|0;
      if (cx>=78 && cx<96) continue;                       // outside the allotments only
      const i=(py*cv.width+px)*4;
      const d=(Math.abs(A[i]-B[i])+Math.abs(A[i+1]-B[i+1])+Math.abs(A[i+2]-B[i+2]))/3;
      n++; sum+=d; if (d>6) hit++;
    }
    res({px:n, pct:+(100*hit/n).toFixed(2), mean:+(sum/n).toFixed(3)});
  };
  im.src = headUrl;
})`;
async function diff(fileA, seedA, fileB, seedB, label){
  const a = await shot(fileA, seedA);
  const b = await chromium.launch();
  const p = await b.newPage({viewport:{width:W_,height:H_}});
  await p.goto(pathToFileURL(resolve(fileB)).href + `?pause&seed=${seedB}`);
  await p.waitForFunction(() => typeof window.__warp === 'function');
  const r = await p.evaluate(([u,pin,d,src]) => eval('('+src+')')(u,pin,d), [a, PIN, DAY, CMP]);
  await b.close();
  console.log(`  ${label.padEnd(42)} changed ${String(r.pct).padStart(6)}%  meanD ${r.mean}`);
}
console.log('\n=== the frame OUTSIDE the allotments (x < 78 or x >= 96), day 4, 1600x950 ===');
await diff('/tmp/head116.html', 7, '/tmp/head116.html', 7, 'HEAD s7 vs HEAD s7   (the noise floor)');
await diff('/tmp/head116.html', 7, '/tmp/head116.html', 8, 'HEAD s7 vs HEAD s8   (a reshuffle)');
for (const s2 of [9, 11, 13, 21, 42]) await diff('/tmp/head116.html', 7, '/tmp/head116.html', s2, `HEAD s7 vs HEAD s${s2}   (a reshuffle)`);
await diff('/tmp/head116.html', 7, 'courtyard.html',   7, 'HEAD s7 vs GLASSHOUSE s7');
