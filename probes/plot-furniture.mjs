#!/usr/bin/env node
/* #138 — the plots' furniture, checked as GEOMETRY before it is judged as a picture.
 * Three claims, each a count, none of them a matter of opinion:
 *   1. every piece's BOX lies inside its own plot's rectangle, x [ox, ox+4) y [oy, oy+3)
 *   2. no piece touches the ways (x >= ox+4) or the glasshouse footprint
 *   3. no piece stands on the west approach sendToPlot walks (x < ox, or the two bed
 *      rows' own kneel line at [plot-0.6, plot+0.5])
 * Plus: the set is the same in every seed (it is hash, not R()), and the state-gated
 * pieces do turn on and off over a year rather than being permanently one or the other. */
import { homedir } from 'node:os'; import { join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const FILE = pathToFileURL(join(process.cwd(), 'courtyard.html')).href;

const GEOM = `(()=>{
  const bad = [], byKind = {};
  for (const f of ALLOT_FURN){
    const b = PLOT_BOX[f.kind];
    byKind[f.kind] = (byKind[f.kind]||0) + 1;
    const x0 = f.x - b.w, x1 = f.x + b.w, y0 = f.y - b.d, y1 = f.y + b.d;
    if (x0 < f.ox)        bad.push([f.kind, f.ox, f.oy, 'west of plot', +x0.toFixed(2)]);
    if (x1 >= f.ox + 4)   bad.push([f.kind, f.ox, f.oy, 'into the x way', +x1.toFixed(2)]);
    if (y0 < f.oy)        bad.push([f.kind, f.ox, f.oy, 'north of plot', +y0.toFixed(2)]);
    if (y1 >= f.oy + 3)   bad.push([f.kind, f.ox, f.oy, 'into the y way', +y1.toFixed(2)]);
    for (let gx = Math.floor(x0); gx <= Math.floor(x1); gx++)
      for (let gy = Math.floor(y0); gy <= Math.floor(y1); gy++)
        if (inGlass(gx, gy)) bad.push([f.kind, f.ox, f.oy, 'inside the glasshouse', gx+','+gy]);
    // the kneel line: sendToPlot lands them at [cell-0.6, cell+0.5] for each of the 6 cells
    for (let cy = f.oy; cy < f.oy + 2; cy++) for (let cx = f.ox; cx < f.ox + 3; cx++){
      const kx = cx - 0.6, ky = cy + 0.5;
      if (kx > x0 - 0.30 && kx < x1 + 0.30 && ky > y0 - 0.30 && ky < y1 + 0.30)
        bad.push([f.kind, f.ox, f.oy, 'on a kneel spot', kx+','+ky]);
    }
  }
  const plots = new Set(ALLOT_FURN.map(f => f.ox+','+f.oy));
  return { n: ALLOT_FURN.length, byKind, bad, plots: plots.size,
           sig: ALLOT_FURN.map(f=>f.kind+f.x.toFixed(3)+','+f.y.toFixed(3)).join('|') };
})()`;

/* the state gates over a whole year, at one sample a sim day */
const YEAR = `(async()=>{
  __reseed(); while(day<1) __warp(1);
  const on = {canes:0, cloche:0, barrow:0}, tot = {canes:0, cloche:0, barrow:0};
  let n = 0, workedDays = 0;
  const d0 = day;
  while (day < d0 + 26){
    __warp(0.5); n++;
    let anyBarrow = 0;
    for (const f of ALLOT_FURN){
      if (!(f.kind in tot)) continue;
      tot[f.kind]++; if (allotFurnOn(f)){ on[f.kind]++; if (f.kind==='barrow') anyBarrow=1; }
    }
    workedDays += anyBarrow;
  }
  return { n, on, tot, workedShare: 100*workedDays/n };
})()`;

const b = await chromium.launch();
const sigs = [];
for (const seed of [7, 42, 1234]){
  const p = await b.newPage({viewport:{width:1280,height:700}});
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto(FILE + '?seed=' + seed + '&pause');
  await p.waitForFunction('typeof __warp==="function"');
  const g = await p.evaluate(GEOM);
  if (errs.length){ console.error('PAGE ERROR', errs[0]); process.exit(2); }
  sigs.push(g.sig);
  if (seed === 7){
    console.log('pieces', g.n, 'over', g.plots, 'plots  ', JSON.stringify(g.byKind));
    console.log('geometry violations:', g.bad.length);
    for (const r of g.bad.slice(0, 12)) console.log('   ', r.join('  '));
    /* The control. A zero is evidence only if the test can be non-zero, so every clause
     * is re-run against a piece deliberately put where it must not be. All five have to
     * fire, or the clause that stayed silent was never testing anything. */
    const ctl = await p.evaluate(`(()=>{
      const f0 = ALLOT_FURN[0], keep = {x: f0.x, y: f0.y};
      const run = () => ${GEOM}.bad.length;
      const out = {};
      for (const [tag, dx, dy] of [['west of plot', -3, 0], ['into the x way', 3, 0],
                                   ['north of plot', 0, -3], ['into the y way', 0, 3],
                                   ['on a kneel spot', -(f0.x - f0.ox) + 0.4, -(f0.y - f0.oy) + 0.5]]){
        f0.x = keep.x + dx; f0.y = keep.y + dy;
        out[tag] = run() > 0 ? 'FIRES' : 'SILENT';
      }
      f0.x = keep.x; f0.y = keep.y;
      out['restored'] = run();
      return out;
    })()`);
    console.log('control — each clause against a piece put where it must not be:');
    for (const k in ctl) console.log('   ', k.padEnd(18), ctl[k]);
    const y = await p.evaluate(YEAR);
    const pc = k => (100 * y.on[k] / y.tot[k]).toFixed(1).padStart(5) + '% of its slots, ' +
                    (y.on[k] / y.n).toFixed(2) + ' visible per sample';
    console.log('state-gated pieces over 26 sim days at 2 samples/day (n=' + y.n + '):');
    for (const k of ['canes','cloche','barrow']) console.log('   ', k.padEnd(7), pc(k));
    console.log('    some plot being worked on', y.workedShare.toFixed(1) + '% of samples');
  }
  await p.close();
}
await b.close();
console.log('same set in 3 seeds:', sigs.every(s => s === sigs[0]) ? 'YES (hash, not R())' : 'NO — SEEDED DRAW');
