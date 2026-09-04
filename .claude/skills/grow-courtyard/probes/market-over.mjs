#!/usr/bin/env node
/* b184 — the market's overflow: does the surplus have a VISIBLE destination, and is it
 * absent when there is no surplus?
 *
 * Part 1, the year: every market's latched mkTotal, mkOver and crate count, by season
 * quarter, over 3 seasonal years x 3 seeds. This is the world state — no drawing.
 * Part 2, the look: at the year's fattest and thinnest markets, at hour 13, the wide
 * frame is drawn FULL and then again with mkCrates emptied — a SAME-CODE control, so the
 * difference is the crates and nothing else. The floor is the same frame drawn twice.
 *   node probe-mkover.mjs [--seed 7]
 */
import { homedir } from 'node:os'; import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url'; import { writeFileSync, mkdirSync } from 'node:fs';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const argv = process.argv.slice(2); const arg=(k,d)=>{const i=argv.indexOf(k);return i<0?d:argv[i+1];};
const SEEDS = (arg('--seeds','7,42,1234')).split(',').map(Number);
const DAYS = +arg('--days', 78), FILE = resolve(arg('--file','courtyard.html'));
mkdirSync('shots', {recursive:true});
const PAGE = pathToFileURL(FILE).href;
const HOUR13 = (13 - 6) * 55 / 24;

/* ---------- part 1: the year ---------- */
const browser = await chromium.launch();
const rows = []; const errs = [];
for (const seed of SEEDS){
  const page = await browser.newPage({viewport:{width:1280,height:700}});
  page.on('pageerror', e => errs.push(String(e)));
  await page.goto(`${PAGE}?pause&seed=${seed}&t=0`, {waitUntil:'load'});
  await page.waitForFunction(() => typeof window.__warp === 'function');
  const out = await page.evaluate(({n}) => {
    window.__reseed();
    const res = []; let last = -1;
    for (let k = 0; k < n; k++){
      window.__warp(5);
      if (mkDay !== last && mkDay >= 0){
        last = mkDay;
        res.push({day:mkDay, phase:seasonPhase, total:+mkTotal.toFixed(1), over:+mkOver.toFixed(1),
                  crates:mkCrates.length, open:mkOpenCount(), shelf:mkShelf.length, line:mkLine()});
      }
    }
    return res;
  }, {n: Math.round(DAYS * 55 / 5)});
  for (const r of out) if (r.day >= 8) rows.push({seed, ...r});
  await page.close();
}
const mean = a => a.length ? a.reduce((x,y)=>x+y,0)/a.length : 0;
const Q = ['midwinter','spring','midsummer','autumn'];
const qOf = p => Math.floor(((p + 0.125) % 1) * 4);
console.log(`\nmkover — ${rows.length} markets · seeds ${SEEDS.join(',')} · ${DAYS} d\n`);
if (errs.length) console.log('PAGE ERRORS:', errs.slice(0,3).join(' | '), '\n');
console.log('  quarter      mkts   mkTotal   shelf   mkOver   crates   markets with 0 crates');
for (let q = 0; q < 4; q++){
  const m = rows.filter(r => qOf(r.phase) === q);
  if (!m.length){ console.log(`  ${Q[q].padEnd(12)}   0`); continue; }
  const z = m.filter(r => r.crates === 0).length;
  console.log(`  ${Q[q].padEnd(12)} ${String(m.length).padStart(4)}   ${mean(m.map(r=>r.total)).toFixed(1).padStart(7)}   ` +
    `${mean(m.map(r=>r.shelf)).toFixed(1).padStart(5)}   ${mean(m.map(r=>r.over)).toFixed(1).padStart(6)}   ` +
    `${mean(m.map(r=>r.crates)).toFixed(2).padStart(6)}   ${z} (${(100*z/m.length).toFixed(0)}%)`);
}
const cr = rows.map(r=>r.crates);
console.log(`\n  crates over the year: 0 on ${cr.filter(c=>!c).length}/${cr.length} markets · ` +
  `median ${[...cr].sort((a,b)=>a-b)[cr.length>>1]} · saturated on ${cr.filter(c=>c>=12).length}`);
console.log(`  mkTotal === 0 on ${rows.filter(r=>r.total===0).length} markets (min ${Math.min(...rows.map(r=>r.total))})`);
const fat = rows.reduce((a,b)=> b.crates > a.crates ? b : a);
const thin = rows.reduce((a,b)=> b.total < a.total ? b : a);
console.log(`\n  fattest: seed ${fat.seed} day ${fat.day} — ${fat.total} units, ${fat.crates} crates`);
console.log(`     "${fat.line}"`);
console.log(`  thinnest: seed ${thin.seed} day ${thin.day} — ${thin.total} units, ${thin.crates} crates`);
console.log(`     "${thin.line}"`);

/* ---------- part 2: the look ---------- */
/* ONE evaluate per frame set: __warp ADVANCES from wherever the clock is, so three
 * calls to a "pin" that warps d*55 land on three different days — the first run of this
 * probe read a 750k-pixel CONTROL and that is what it was measuring. The world is
 * warped once; the three canvases are three DRAWS of that one state, reseeded each
 * time so the picture is a function of the sim state alone. */
const SHOTS = `(d, h) => { __reseed(); __warp(d*55 + h); __reseed();
  drawScene(simT, 0); const A = cv.toDataURL();
  __reseed(); drawScene(simT, 0); const A2 = cv.toDataURL();
  const n = mkCrates.length; mkCrates.length = 0; __reseed(); drawScene(simT, 0);
  const B = cv.toDataURL();
  return {A, A2, B, crates:n, total:+mkTotal.toFixed(1), hour:+hour.toFixed(2), wh:[cv.width, cv.height]}; }`;
const DIFF = `(uA, uB) => new Promise(res => {
  const load = u => new Promise(r => { const im = new Image(); im.onload = () => r(im); im.src = u; });
  Promise.all([load(uA), load(uB)]).then(([a, b]) => {
    const W_ = a.width, H_ = a.height;
    const mk = im => { const c = document.createElement('canvas'); c.width=W_; c.height=H_;
      const g = c.getContext('2d'); g.drawImage(im,0,0); return g.getImageData(0,0,W_,H_).data; };
    const A = mk(a), B = mk(b);
    const out = new Uint8ClampedArray(W_*H_*4);
    let hit = 0, sum = 0, peak = 0, x0=1e9, x1=-1, y0=1e9, y1=-1;
    for (let py=0; py<H_; py++) for (let px=0; px<W_; px++){
      const i=(py*W_+px)*4;
      const d=(Math.abs(A[i]-B[i])+Math.abs(A[i+1]-B[i+1])+Math.abs(A[i+2]-B[i+2]))/3;
      const v=Math.min(255,d*8); out[i]=v; out[i+1]=v; out[i+2]=v; out[i+3]=255;
      sum+=d; if (d>peak) peak=d;
      if (d>6){ hit++; if(px<x0)x0=px; if(px>x1)x1=px; if(py<y0)y0=py; if(py>y1)y1=py; }
    }
    const c2=document.createElement('canvas'); c2.width=W_; c2.height=H_;
    const g2=c2.getContext('2d'); const id=g2.createImageData(W_,H_); id.data.set(out); g2.putImageData(id,0,0);
    res({hit, mean:+(sum/(W_*H_)).toFixed(4), peak:+peak.toFixed(1),
         box: hit ? [x0,y0,x1-x0+1,y1-y0+1] : null, wh:[W_,H_], diff:c2.toDataURL()});
  });
})`;

for (const [tag, r] of [['glut', fat], ['thin', thin]]){
  for (const [w,h] of [[1280,700],[390,844]]){
    const b = await chromium.launch();
    const p = await b.newPage({viewport:{width:w,height:h}});
    p.on('pageerror', e => console.error('PAGE ERROR:', e.message));
    await p.goto(`${PAGE}?pause&seed=${r.seed}&t=0`);   // the default entry is a DIFFERENT world
    await p.waitForFunction(() => typeof window.__warp === 'function');
    const f = await p.evaluate(([d,hh,ss]) => eval('('+ss+')')(d,hh), [r.day,HOUR13,SHOTS]);
    const ctl = await p.evaluate(([a,c,dd]) => eval('('+dd+')')(a,c), [f.A, f.A2, DIFF]);
    const sig = await p.evaluate(([a,c,dd]) => eval('('+dd+')')(a,c), [f.A, f.B, DIFF]);
    writeFileSync(`shots/mkover-${tag}-${w}x${h}.png`, Buffer.from(sig.diff.split(',')[1],'base64'));
    writeFileSync(`shots/mkover-${tag}-${w}x${h}-full.png`, Buffer.from(f.A.split(',')[1],'base64'));
    console.log(`\n  ${tag} seed ${r.seed} day ${r.day} hour ${f.hour} — ${f.total} units, ${f.crates} crates · ${w}x${h} (canvas ${f.wh.join('x')})`);
    console.log(`     control (same state drawn twice): ${ctl.hit} px changed, mean ${ctl.mean}`);
    console.log(`     the crates:                       ${sig.hit} px changed, mean ${sig.mean}, peak ${sig.peak}, box ${sig.box ? sig.box.join(',') : '-'}`);
    await b.close();
  }
}
console.log('');
