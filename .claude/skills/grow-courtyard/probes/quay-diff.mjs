#!/usr/bin/env node
/* b114 — the shipping-size gate: a DIFFERENCE IMAGE and a number.
 *
 * HEAD's frame is carried into the candidate page as a PNG and diffed there, so the
 * masking can use the page's OWN unproject(): every screen pixel is attributed to the
 * ground cell under it and bucketed as quay stone / plaza / elsewhere. A bounding box
 * will not do — the plaza's projected box overlaps the quay's by 30 px, so a "plaza
 * control" read off boxes is reading the thing it is meant to be a control for.
 *
 * Reports, per size: changed MASS per region (plaza must be 0.00 — that is the control),
 * and inside the candidate alone the green excess of the rail column against its
 * neighbour, the walked column, with HEAD's own gap as the zero.
 */
import { homedir } from 'node:os'; import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url'; import { writeFileSync, mkdirSync } from 'node:fs';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const argv = process.argv.slice(2); const arg=(k,d)=>{const i=argv.indexOf(k);return i<0?d:argv[i+1];};
const DAYS = (arg('--days','14,25')).split(',').map(Number), SEED = Number(arg('--seed', 7));
const CAND = arg('--cand', 'courtyard.html');   // --cand /tmp/head114.html is the HEAD-vs-HEAD control
const SIZES = [[1280,700],[1600,950],[390,844]];
mkdirSync('shots', {recursive:true});

/* reseed AGAIN after the warp and before the draw. The renderer draws from the PRNG, so
 * two builds that differ only in how often they dirty the ground cache reach drawScene
 * at different stream positions and scatter small differences over the whole frame that
 * have nothing to do with the change. Rewinding here makes the picture a function of the
 * sim state alone — which is the thing containment is a claim about. */
const PIN = `(d) => { __reseed(); __warp(d*55); __reseed(); drawScene(simT, 1/30); }`;

async function frame(file, w, h, day){
  const b = await chromium.launch();
  const p = await b.newPage({viewport:{width:w,height:h}});
  await p.goto(pathToFileURL(resolve(file)).href + `?pause&seed=${SEED}`);
  await p.waitForFunction(() => typeof window.__warp === 'function');
  const url = await p.evaluate(([d,pin]) => { eval('(' + pin + ')')(d); return cv.toDataURL(); }, [day, PIN]);
  await b.close(); return url;
}

const ANALYSE = `(headUrl, pin, day) => new Promise(res => {
  // HEAD has no inQuay(): spell the same region out so the control can run at all
  const IQ = typeof inQuay === 'function' ? inQuay
           : (x, y) => x >= QUAY_X0 && x < RIVER_X0 && y < LN_WALK_N && grid[y * GW + x] === SIDE;
  eval('(' + pin + ')')(day);
  const im = new Image();
  im.onload = () => {
    const oc = document.createElement('canvas'); oc.width = cv.width; oc.height = cv.height;
    const og = oc.getContext('2d'); og.drawImage(im, 0, 0);
    const A = og.getImageData(0,0,cv.width,cv.height).data;
    const g = cv.getContext('2d');
    const B = g.getImageData(0,0,cv.width,cv.height).data;
    const sx = cv.width / W, sy = cv.height / H;              // backing store vs drawing space
    const R_ = {quay:0, plaza:0, other:0}, HIT = {quay:0, plaza:0, other:0}, SUM = {quay:0, plaza:0, other:0}, PK = {quay:0, plaza:0, other:0};
    const GA = {}, GB = {}, GN = {};
    const out = new Uint8ClampedArray(cv.width * cv.height * 4);
    for (let py = 0; py < cv.height; py++) for (let px = 0; px < cv.width; px++){
      const i = (py * cv.width + px) * 4;
      const d = (Math.abs(A[i]-B[i]) + Math.abs(A[i+1]-B[i+1]) + Math.abs(A[i+2]-B[i+2])) / 3;
      const v = Math.min(255, d * 8); out[i]=v; out[i+1]=v; out[i+2]=v; out[i+3]=255;
      const [wx, wy] = unproject(px / sx, py / sy);
      const cx = Math.floor(wx), cy = Math.floor(wy);
      const ok = cx>=0 && cy>=0 && cx<GW && cy<WH;
      const reg = ok && IQ(cx, cy) ? 'quay' : ok && inPlaza(cx, cy) ? 'plaza' : 'other';
      R_[reg]++; SUM[reg]+=d; if (d>6) HIT[reg]++; if (d>PK[reg]) PK[reg]=d;
      if (reg === 'quay'){                                    // green excess, per COLUMN
        const ge = a => a[i+1] - (a[i] + a[i+2]) / 2;
        GA[cx] = (GA[cx]||0) + ge(A); GB[cx] = (GB[cx]||0) + ge(B); GN[cx] = (GN[cx]||0) + 1;
      }
    }
    const oc2 = document.createElement('canvas'); oc2.width = cv.width; oc2.height = cv.height;
    const g2 = oc2.getContext('2d'); const idat = g2.createImageData(cv.width, cv.height);
    idat.data.set(out); g2.putImageData(idat, 0, 0);
    const stat = {}; for (const k in R_) stat[k] = {px:R_[k], changed:HIT[k],
      pct:+(100*HIT[k]/(R_[k]||1)).toFixed(2), mean:+(SUM[k]/(R_[k]||1)).toFixed(3), peak:+PK[k].toFixed(1)};
    const gre = {}; for (const c in GN) gre[c] = {n:GN[c], head:+(GA[c]/GN[c]).toFixed(3), now:+(GB[c]/GN[c]).toFixed(3)};
    res({stat, gre, diff: oc2.toDataURL(), day, phase:+season().toFixed(2), label:seasonLabel(), mossy:__census().planting.mossy,
         wh:[cv.width, cv.height]});
  };
  im.src = headUrl;
})`;

for (const day of DAYS) for (const [w,h] of SIZES){
  const headUrl = await frame('/tmp/head114.html', w, h, day);
  const b = await chromium.launch();
  const p = await b.newPage({viewport:{width:w,height:h}});
  await p.goto(pathToFileURL(resolve(CAND)).href + `?pause&seed=${SEED}`);
  await p.waitForFunction(() => typeof window.__warp === 'function');
  p.on('pageerror', e => console.error('PAGE ERROR:', e.message));
  p.on('console', m => { if (m.type()==='error') console.error('CONSOLE:', m.text()); });
  let r;
  try { r = await p.evaluate(([u,pin,d,an]) => eval('(' + an + ')')(u, pin, d), [headUrl, PIN, day, ANALYSE]); }
  catch (e) { console.error('EVALUATE FAILED:', e.message); await b.close(); continue; }
  writeFileSync(`shots/diff-quay-${w}x${h}-d${day}${CAND==='courtyard.html'?'':'-CONTROL'}.png`, Buffer.from(r.diff.split(',')[1], 'base64'));
  delete r.diff;
  console.log(`\n=== day ${r.day} (${r.label}, phase ${r.phase})  ${w}x${h}  canvas ${r.wh.join('x')}  mossy -> ${r.mossy} ===`);
  for (const k of ['quay','plaza','other']){
    const s = r.stat[k];
    console.log(`  ${k.padEnd(6)} ${String(s.px).padStart(7)} px   changed ${String(s.changed).padStart(6)} (${String(s.pct).padStart(6)}%)   meanD ${String(s.mean).padStart(7)}   peak ${s.peak}`);
  }
  const cols = Object.keys(r.gre).sort();
  console.log(`  green excess  ${cols.map(c => `col${c}(n=${r.gre[c].n})`).join('   ')}`);
  console.log(`    HEAD        ${cols.map(c => String(r.gre[c].head).padStart(12)).join('   ')}`);
  console.log(`    now         ${cols.map(c => String(r.gre[c].now).padStart(12)).join('   ')}`);
  if (cols.length === 2){
    const [a,b2] = cols;
    console.log(`    rail - walked:  HEAD ${(r.gre[b2].head - r.gre[a].head).toFixed(3)}   now ${(r.gre[b2].now - r.gre[a].now).toFixed(3)}`);
  }
  await b.close();
}
