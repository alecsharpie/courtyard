// #86 c119: FACES[] are cached in the ground cache's view; faceAt() must map them through the
// composite's k through the ease. For each quarter and several ease instants: every cached
// window on screen, hit-tested at the LIVE centre of its pane -> must return that window.
// Also checks the lit glows sit on the scaled cache, and crops the church mid-ease at night.
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const b = await chromium.launch(); let fails = 0;   // probes/where-faces.mjs (#86)
for (const [w,h,dsf] of [[1400,800,1],[390,844,2]]){
  const p = await b.newPage({ viewport:{width:w,height:h}, deviceScaleFactor:dsf });
  p.on('pageerror', e => { console.log('PAGE ERROR', e.message); fails++; });
  await p.goto(pathToFileURL(resolve('courtyard.html')).href + '?seed=7&t=0&pause');
  await p.waitForFunction(() => window.__warp);
  const r = await p.evaluate(() => {
    window.__reseed(); window.__warp(330); while (nightF < 0.95) window.__warp(0.5);
    drawScene(simT, 0);
    const rows = [];
    const test = (label) => {
      drawScene(simT, 0);
      const k = viewS / gview.s; let n = 0, ok = 0, stale = 0, lit = 0, litOff = 0;
      const byKey = new Map(); for (const f of FACES) if (!f.live && !f.door) byKey.set(f.sa * 1000 + f.sb, f);
      for (const [wx, wy, zTop, hgt, sa, sb] of WINDOWS){
        const f = byKey.get(sa * 1000 + sb); if (!f) continue;
        const c = project(wx, wy, zTop - hgt / 2); if (c[0] < 0 || c[0] > W || c[1] < 0 || c[1] > H) continue;
        n++; const hit = faceAt(c); if (hit && hit.sa === sa && hit.sb === sb) ok++;
        if (Math.hypot(c[0] - (f.x0 + f.x1) / 2, c[1] - (f.y0 + f.y1) / 2) > 2) stale++;   // the raw box is elsewhere: the mapping is what hit
        if (windowLit(sa, sb)){ lit++; const mx = originX + k * ((f.x0 + f.x1) / 2 - gview.ox), my = topPad + k * ((f.y0 + f.y1) / 2 - gview.tp); litOff = Math.max(litOff, Math.hypot(c[0] - mx, c[1] - my)); }
      }
      rows.push({ label, k: +k.toFixed(2), onScreen: n, hit: ok, staleBoxes: stale, lit, litOffPx: +litOff.toFixed(2) });
    };
    test('wide rest');
    for (let q = 1; q <= 4; q++){
      window.__where(0); window.__where(undefined, 1); drawScene(simT, 0);   // back to wide, cache rebuilt by the next frame
      drawScene(simT, 0);
      window.__where(q);
      let at = 0;
      for (const du of [0.15, 0.15, 0.15, 0.15, 0.15]){ window.__where(undefined, du); at += du; test(QUARTERS[q].name + ' @' + at.toFixed(2) + 's'); }
      window.__where(undefined, 0.15); test(QUARTERS[q].name + ' arrived');   // test() draws: the cache rebuilds on this frame
      test(QUARTERS[q].name + ' rest');
    }
    return rows;
  });
  for (const row of r){
    const bad = row.hit !== row.onScreen || row.litOffPx > 0.5;
    if (bad) fails++;
    console.log((bad ? 'FAIL ' : 'ok   ') + w + 'px ' + row.label.padEnd(28) + JSON.stringify(row));
  }
  if (w === 1400){
    await p.evaluate(() => { window.__where(0); window.__where(undefined, 1); drawScene(simT, 0); drawScene(simT, 0); window.__where(4); window.__where(undefined, 0.45); drawScene(simT, 0); });
    const box = await p.evaluate(() => { const a = project(CHURCH.tx0 - 1, CHURCH.ty0, 12), c = project(MILL.x1 + 1, MILL.y1 + 1, 0); const r = cv.getBoundingClientRect(); return { x: r.left + a[0], y: r.top + a[1], width: c[0] - a[0], height: c[1] - a[1] }; });
    await p.screenshot({ path: 'shots/b84-church-midease-night.png', clip: box });
    await p.evaluate(() => { window.__where(undefined, 0.6); drawScene(simT, 0); drawScene(simT, 0); });
    const box2 = await p.evaluate(() => { const a = project(CHURCH.tx0 - 1, CHURCH.ty0, 12), c = project(MILL.x1 + 1, MILL.y1 + 1, 0); const r = cv.getBoundingClientRect(); return { x: r.left + a[0], y: r.top + a[1], width: c[0] - a[0], height: c[1] - a[1] }; });
    await p.screenshot({ path: 'shots/b84-church-arrived-night.png', clip: box2 });
  }
  await p.close();
}
await b.close();
console.log(fails ? 'FAIL ' + fails : 'PASS');
process.exit(fails ? 1 : 0);
