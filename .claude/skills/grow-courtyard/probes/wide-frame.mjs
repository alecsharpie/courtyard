/* #206 — how much of the WIDE frame is town?
 * Geometry (the page's own numbers) + a pixel skyline, per framing:
 *   sky   0..skyHz()              the band above the horizon
 *   town  skyHz()..y(LN_WALK_S)   everything between the far bank and our own roof
 *   near  y(LN_WALK_S)..sillTop() the near slate
 *   sill  sillTop()..H
 * plus the world x span at the frame's top/middle/near rows (is the plaza IN it?),
 * every quarter's fitted s/ox/tp (must not move), and the drawn skyline's top row
 * per column (clip0 = columns whose topmost drawn pixel is row 0 = something cut off).
 */
import { pathToFileURL } from 'node:url'; import { homedir } from 'node:os'; import { join } from 'node:path';
const { chromium } = (await import(pathToFileURL(join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js')).href)).default;
const arg = (n, d) => { const i = process.argv.indexOf(n); return i !== -1 && process.argv[i+1] ? process.argv[i+1] : d; };
const PAGE = pathToFileURL(arg('--page', 'courtyard.html')).href;
const T = +arg('--t', '175');
const FRAMES = (arg('--frames', '1600x950,390x844,1200x720,900x560,1600x1200,768x1024')).split(',')
  .map(s => { const [w,h] = s.split('x').map(Number); return { w, h }; });

const b = await chromium.launch();
const out = [];
for (const f of FRAMES){
  const ctx = await b.newContext({ viewport:{ width:f.w, height:f.h }, deviceScaleFactor:1 });
  const p = await ctx.newPage();
  await p.goto(`${PAGE}?seed=42&t=0&pause`, { waitUntil:'load' });
  await p.waitForFunction(() => typeof window.__warp === 'function');
  const o = await p.evaluate((secs) => {
    window.__reseed(); window.__warp(secs);
    groundDirty = true; backKey = ''; drawScene(simT, 1/30);
    const cv = document.querySelector('canvas'), g = cv.getContext('2d');
    const dpr = cv.width / cv.getBoundingClientRect().width;
    const hz = skyHz(), sTop = sillTop();
    const yRow = (r) => project(0, r, 0)[1];
    const spanAt = (sy) => { const a = unproject(0, sy)[0], b2 = unproject(W, sy)[0]; return [+a.toFixed(1), +b2.toFixed(1)]; };
    // a quarter's fit, in FOCUS-INVARIANT terms: what world it puts on the screen
    const quarters = QUARTERS.map((q, i) => { const v = viewFor(i);
      const sv = { s:viewS, cw:cellW, ch:cellH, ox:originX, tp:topPad }; applyView(v);
      const a = unproject(0, 0), b2 = unproject(W, sillTop());
      applyView(sv);
      return { n:q.name, s:+v.s.toFixed(4), x0:+a[0].toFixed(2), x1:+b2[0].toFixed(2),
               y0:+a[1].toFixed(2), y1:+b2[1].toFixed(2) }; });
    // pixel skyline: per column, the topmost row that is not this row's modal (sky) luma
    const d = g.getImageData(0, 0, cv.width, cv.height).data;
    const L = (i) => 0.299*d[i] + 0.587*d[i+1] + 0.114*d[i+2];
    const yb = Math.round(sTop * dpr);
    const top = new Array(cv.width).fill(-1);
    for (let y = 0; y < yb; y++){
      const cnt = new Map();
      for (let x = 0; x < cv.width; x += 4){ const v = Math.round(L((y*cv.width + x)*4)); cnt.set(v, (cnt.get(v)||0)+1); }
      let mode = 0, best = -1; for (const [v, n] of cnt) if (n > best){ best = n; mode = v; }
      for (let x = 0; x < cv.width; x++) if (top[x] < 0 && Math.abs(L((y*cv.width + x)*4) - mode) > 6) top[x] = y;
    }
    const drawn = top.filter(v => v >= 0);
    return { W, H, cellW:+cellW.toFixed(3), cellH:+cellH.toFixed(3), topPad:+topPad.toFixed(2),
      FOCUS, sillTop:+sTop.toFixed(1), skyHz:+hz.toFixed(1), yWalkS:+yRow(LN_WALK_S).toFixed(1),
      yWH:+yRow(WH).toFixed(1), y0:+yRow(0).toFixed(1),
      spanTop: spanAt(Math.max(0, hz)), spanMid: spanAt(sTop/2), spanNear: spanAt(sTop),
      quarters, dpr, lawn: (()=>{ let x0=999,x1=-1; for (let y=0;y<WH;y++) for (let x=0;x<GW;x++) if (grid[y*GW+x]===GRASS && x<70){ const sx=project(x,y,0)[0]; if (sx>=0&&sx<=W){ x0=Math.min(x0,x); x1=Math.max(x1,x);} } return [x0,x1]; })(),
      clip0: top.filter(v => v === 0).length, skyMinPx: drawn.length ? Math.min(...drawn) : -1,
      skyMedPx: drawn.length ? drawn.sort((a,b2)=>a-b2)[drawn.length>>1] : -1, cols: cv.width };
  }, T);
  await ctx.close();
  const sky = Math.max(0, o.skyHz), town = Math.max(0, o.yWalkS - Math.max(0, o.skyHz));
  const near = Math.max(0, o.sillTop - o.yWalkS), sill = o.H - o.sillTop;
  const pc = (v) => (100*v/o.H).toFixed(1) + '%';
  out.push({ f: `${f.w}x${f.h}`, o, sky, town, near, sill });
  console.log(`\n== ${f.w}x${f.h} ==  cellW ${o.cellW} cellH ${o.cellH} topPad ${o.topPad} FOCUS ${o.FOCUS} sillTop ${o.sillTop}`);
  console.log(`   rows: sky ${sky.toFixed(0)}px ${pc(sky)} | TOWN ${town.toFixed(0)}px ${pc(town)} | near ${near.toFixed(0)}px ${pc(near)} | sill ${sill.toFixed(0)}px ${pc(sill)}`);
  console.log(`   world x: top ${o.spanTop.join('..')}  mid ${o.spanMid.join('..')}  near ${o.spanNear.join('..')}   rows on screen: y(0) ${o.y0} y(WH) ${o.yWH}`);
  console.log(`   skyline: clip0 ${o.clip0}/${o.cols} cols, top drawn px min ${o.skyMinPx} med ${o.skyMedPx}`);
  console.log(`   lawn cols in frame: ${o.lawn.join('..')} (grid 11..50)`);
  console.log(`   quarters: ` + o.quarters.map(q => `${q.n} s=${q.s} x ${q.x0}..${q.x1} y ${q.y0}..${q.y1}`).join('\n             '));
}
await b.close();
if (process.argv.includes('--json')) console.log('JSON ' + JSON.stringify(out.map(r => ({ f:r.f, ...r.o }))));
