#!/usr/bin/env node
/* #126 — the shipping-size gate for the roundel and the quay, after quay-diff.mjs (#114).
 * HEAD's frame is carried into the candidate page as a PNG and diffed there, so every
 * screen pixel is attributed to its ground cell by the page's OWN unproject() and
 * bucketed plaza / quay / lane / other. A bounding box will not do: the plaza's
 * projected box overlaps the quay's by 30 px.
 *
 * Two weathers, because this brief has two halves:
 *   --wet 0     a DRY afternoon — the desire line in the cached ground, nothing else
 *   --wet 0.42  an hour after a shower — the new standing water
 *   node probe-pave-diff.mjs [--days 12,22] [--wet 0] [--seed 7] [--cand file]
 */
import { homedir } from 'node:os'; import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url'; import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync, unlinkSync } from 'node:fs';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const argv = process.argv.slice(2); const arg=(k,d)=>{const i=argv.indexOf(k);return i<0?d:argv[i+1];};
const DAYS = arg('--days','12,22').split(',').map(Number), SEED = Number(arg('--seed', 7));
const WET = arg('--wet', '0'), CAND = arg('--cand', 'courtyard.html');
const SIZES = [[1280,700],[390,844]];
mkdirSync('shots', {recursive:true});
const HEADF = '/tmp/head126.html';
writeFileSync(HEADF, execSync('git show HEAD:courtyard.html', {maxBuffer:1<<28}).toString());

/* reseed AGAIN after the warp and before the draw (#114's law): the renderer draws from
 * the PRNG, so two builds that dirty the ground cache at different cadences reach
 * drawScene at different stream positions. The weather is PINNED after the warp so the
 * two halves of the brief can be graded apart. */
const PIN = `(d, wet) => { __reseed(); __warp(d*55); while (hour < 15) __warp(0.25);
  raining = false; wetness = wet; wetPainted = wet; groundDirty = true;
  __reseed(); drawScene(simT, 1/30); }`;

const FP = `() => ({ simT:+simT.toFixed(4), hour:+hour.toFixed(4), day, windT:+windT.toFixed(4),
  cloud:+cloudCover().toFixed(4), wetness:+wetness.toFixed(4), wetPainted:+wetPainted.toFixed(4),
  agents: agents.length, ax:+agents.reduce((s,a)=>s+a.x*7+a.y*13,0).toFixed(3),
  blooms: __census().planting.blooming, pools: PUDDLES.length })`;
async function frame(file, w, h, day){
  const b = await chromium.launch();
  const p = await b.newPage({viewport:{width:w,height:h}});
  await p.goto(pathToFileURL(resolve(file)).href + `?pause&seed=${SEED}`);
  await p.waitForFunction(() => typeof window.__warp === 'function');
  const r = await p.evaluate(([d,pin,wet,fp]) => { eval('(' + pin + ')')(d, wet); return { url: cv.toDataURL(), fp: eval('(' + fp + ')')() }; }, [day, PIN, +WET, FP]);
  await b.close(); return r;
}
const ANALYSE = `(headUrl, pin, day, wet, FPS) => new Promise(res => {
  eval('(' + pin + ')')(day, wet);
  const im = new Image();
  im.onload = () => {
    const oc = document.createElement('canvas'); oc.width = cv.width; oc.height = cv.height;
    oc.getContext('2d').drawImage(im, 0, 0);
    const A = oc.getContext('2d').getImageData(0,0,cv.width,cv.height).data;
    const B = cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;
    const sx = cv.width / W, sy = cv.height / H;
    const K = ['plaza','quay','lane','other'];
    const N={}, HIT={}, SUM={}, PK={}; for (const k of K){N[k]=0;HIT[k]=0;SUM[k]=0;PK[k]=0;}
    const out = new Uint8ClampedArray(cv.width * cv.height * 4);
    for (let py = 0; py < cv.height; py++) for (let px = 0; px < cv.width; px++){
      const i = (py * cv.width + px) * 4;
      const d = (Math.abs(A[i]-B[i]) + Math.abs(A[i+1]-B[i+1]) + Math.abs(A[i+2]-B[i+2])) / 3;
      const v = Math.min(255, d * 8); out[i]=v; out[i+1]=v; out[i+2]=v; out[i+3]=255;
      const [wx, wy] = unproject(px / sx, py / sy);
      const cx = Math.floor(wx), cy = Math.floor(wy);
      const ok = cx>=0 && cy>=0 && cx<GW && cy<WH;
      const reg = !ok ? 'other' : inPlaza(cx,cy) ? 'plaza' : inQuay(cx,cy) ? 'quay'
                : (cy >= LN_WALK_N && cy < LN_WALK_S) ? 'lane' : 'other';
      N[reg]++; SUM[reg]+=d; if (d>6) HIT[reg]++; if (d>PK[reg]) PK[reg]=d;
    }
    const oc2 = document.createElement('canvas'); oc2.width=cv.width; oc2.height=cv.height;
    const g2 = oc2.getContext('2d'), idat = g2.createImageData(cv.width, cv.height);
    idat.data.set(out); g2.putImageData(idat,0,0);
    const stat={}; for (const k of K) stat[k]={px:N[k], changed:HIT[k],
      pct:+(100*HIT[k]/(N[k]||1)).toFixed(2), mean:+(SUM[k]/(N[k]||1)).toFixed(3), peak:+PK[k].toFixed(1)};
    res({stat, fp: eval('(' + FPS + ')')(), diff: oc2.toDataURL(), day, phase:+season().toFixed(2), label:seasonLabel(),
         pools: PUDDLES.length, mossy: __census().planting.mossy, wh:[cv.width, cv.height]});
  };
  im.src = headUrl;
})`;
for (const day of DAYS) for (const [w,h] of SIZES){
  const headR = await frame(HEADF, w, h, day); const headUrl = headR.url;
  const b = await chromium.launch();
  const p = await b.newPage({viewport:{width:w,height:h}});
  const errs=[]; p.on('pageerror', e => errs.push(e.message));
  await p.goto(pathToFileURL(resolve(CAND)).href + `?pause&seed=${SEED}`);
  await p.waitForFunction(() => typeof window.__warp === 'function');
  const r = await p.evaluate(([u,pin,d,an,wet,fp]) => eval('(' + an + ')')(u, pin, d, wet, fp), [headUrl, PIN, day, ANALYSE, +WET, FP]);
  if (errs.length){ console.error('PAGE ERROR', errs[0]); process.exit(2); }
  const tag = CAND === 'courtyard.html' ? '' : '-CONTROL';
  writeFileSync(`shots/diff126-w${WET}-${w}x${h}-d${day}${tag}.png`, Buffer.from(r.diff.split(',')[1],'base64'));
  console.log(`\n=== day ${r.day} (${r.label}) ${w}x${h} · wetness ${WET} · pools ${r.pools} · mossy ${r.mossy}${tag} ===`);
  const keys = new Set([...Object.keys(headR.fp), ...Object.keys(r.fp)]);
  const drift = [...keys].filter(k => JSON.stringify(headR.fp[k]) !== JSON.stringify(r.fp[k]));
  console.log('  sim fingerprint drift:', drift.length ? drift.map(k => k+' '+headR.fp[k]+'->'+r.fp[k]).join('  ') : 'NONE (identical sim state)');
  for (const k of ['plaza','quay','lane','other']){ const s=r.stat[k];
    console.log(`  ${k.padEnd(6)} ${String(s.px).padStart(8)} px  changed ${String(s.changed).padStart(7)} (${String(s.pct).padStart(6)}%)  meanD ${String(s.mean).padStart(7)}  peak ${s.peak}`); }
  await b.close();
}
unlinkSync(HEADF);
