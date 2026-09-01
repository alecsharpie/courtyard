// Does any VISIBLE scanline of a quarter show world past GW (east) or before 0 (west)?
// The frame is the picture: rows above screen y=0 and below sillTop() are not visible, so the
// clamp is only wrong if the void lands on a row you can actually SEE (c126).
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const file = process.argv[2] || 'courtyard.html';
const b = await chromium.launch();
for (const [w, h] of [[1400, 900], [1400, 800], [390, 844], [1024, 768]]){
  const p = await b.newPage({ viewport:{width:w,height:h} });
  p.on('pageerror', e => console.log('PAGE ERROR', e.message));
  await p.goto(pathToFileURL(resolve(file)).href + '?seed=7&t=0&pause');
  await p.waitForFunction(() => window.__warp);
  const r = await p.evaluate(() => {
    window.__reseed(); window.__warp(336); drawScene(simT, 0);
    const sill = window.sillTop ? window.sillTop() : H - Math.max(26, H * 0.075);   // control predates sillTop()
    const out = [];
    for (let n = 1; n < QUARTERS.length; n++){
      const q = QUARTERS[n], v = viewFor(n);
      const cur = { s: viewS, ox: originX, tp: topPad }; applyView(v);
      // walk every world row; keep the ones whose screen y is inside the picture
      let eastGap = -1e9, westGap = -1e9, eastRow = null, westRow = null, seen = 0;
      for (let ry = 0; ry <= WH; ry += 0.25){
        const sy = project(0, ry, 0)[1];
        if (sy < 0 || sy > sill) continue;                    // not in the picture
        seen++;
        const e = W - project(GW, ry, 0)[0];                  // >0 = void past the east edge
        const wv = project(0, ry, 0)[0];                      // >0 = void before the west edge
        if (e > eastGap){ eastGap = e; eastRow = ry; }
        if (wv > westGap){ westGap = wv; westRow = ry; }
      }
      out.push({ name: q.name, s: +v.s.toFixed(2), rowsSeen: seen,
        eastVoidPx: +eastGap.toFixed(0), atRow: eastRow, westVoidPx: +westGap.toFixed(0), westRow,
        OK: eastGap <= 0.5 && westGap <= 0.5 });
      applyView(cur);
    }
    return { W, H, sill:+sill.toFixed(0), out };
  });
  console.log(w + 'x' + h, 'W=' + r.W, 'H=' + r.H.toFixed(0), 'sill=' + r.sill);
  for (const e of r.out) console.log('    ', e.OK ? 'ok  ' : 'VOID', JSON.stringify(e));
  await p.close();
}
await b.close();
