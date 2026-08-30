import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const b = await chromium.launch();
for (const [w,h,dsf] of [[390,844,2],[1400,800,1]]){
  const p = await b.newPage({ viewport:{width:w,height:h}, deviceScaleFactor: dsf });
  p.on('pageerror', e => console.log('PAGE ERROR', e.message));
  await p.goto(pathToFileURL(resolve('courtyard.html')).href + '?seed=7&t=0&pause');
  await p.waitForFunction(() => window.__warp);
  const r = await p.evaluate(() => {
    window.__reseed(); window.__warp(330 + 6);      // summer, mid-morning
    const out = { wide: window.__where() };
    drawScene(simT, 0);
    // a person's screen height at each quarter + a hit-test round trip
    const walker = agents.find(a => a.x > 99 && a.x < 112 && a.y > 5 && a.y < 58) || agents[0];
    for (let n = 1; n <= 4; n++){
      const t0 = performance.now(); const v0 = window.__where(n); const t1 = performance.now();
      const mid = window.__where(undefined, 0.45); drawScene(simT, 0); const t2 = performance.now();
      const done = window.__where(undefined, 0.5); const t3 = performance.now(); drawScene(simT, 0); const t4 = performance.now();
      const [sx, sy] = project(walker.x, walker.y, 0); const [ux, uy] = unproject(sx, sy);
      out['q' + n] = { name: QUARTERS[n].name, s: +done.s.toFixed(2), cellW: +done.cellW.toFixed(1), padBuildMs: +(t1 - t0).toFixed(1),
        midEasing: mid.easing, midGview: mid.gview, arriveBuildMs: +(t4 - t3).toFixed(1), gviewAfter: done.gview,
        personPx: +(cellH * 2.1).toFixed(0), roundTrip: [+(ux - walker.x).toFixed(4), +(uy - walker.y).toFixed(4)],
        onScreen: sx > 0 && sx < W && sy > 0 && sy < H, label: document.getElementById('where').textContent };
    }
    window.__where(0); window.__where(undefined, 1); drawScene(simT, 0);
    out.back = window.__where();
    out.sill = ['plate','season','where','daytime','ctrl'].map(id => { const r = document.getElementById(id).getBoundingClientRect(); return id + ':' + Math.round(r.x) + '+' + Math.round(r.width); });
    return out;
  });
  console.log(w, JSON.stringify(r, null, 0));
  await p.close();
}
await b.close();
