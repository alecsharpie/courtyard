/* b58: four 1x-visibility numbers — lit pane warmth at midnight, turned-vs-fallow luminance
 * at midwinter noon, snowed-lawn mean at a winter dawn, flag width. `node probe-polish.mjs [file]` */
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const file = resolve(process.argv[2] || 'courtyard.html');
const b = await chromium.launch();
const open = async (q) => { const p = await b.newPage({ viewport: { width: 1600, height: 950 }, deviceScaleFactor: 1 });
  p.on('pageerror', e => console.log('PAGE ERROR', e.message)); await p.goto(pathToFileURL(file).href + q);
  await p.waitForFunction(() => window.__warp); return p; };
// 1. panes, rose, tap door — seed 3 day 3 midnight
{ const p = await open('?pause&seed=3');
  const r = await p.evaluate(() => { const DAY = 55; __reseed(); __setTime(3 * DAY + DAY * 18 / 24); __warp(0.01); drawScene(0, 0.016);
    const px = (sx, sy) => { const d = ctx.getImageData(Math.round(sx * DPR), Math.round(sy * DPR), 1, 1).data; return [d[0], d[1], d[2]]; };
    const out = { hour: +hour.toFixed(2), nightF: +nightF.toFixed(2), tapF: +tapF().toFixed(2), panes: [] };
    for (const [wx, wy, zTop, hgt, sa, sb] of WINDOWS) if (windowLit(sa, sb) && out.panes.length < 6){ const [sx, sy] = project(wx - 0.13, wy, zTop - hgt * 0.3); out.panes.push(px(sx, sy)); }
    const mx = (CHURCH.nx0 + CHURCH.nx1) / 2, [rx, ry] = project(mx, CHURCH.ny1, 5.4); out.rose = px(rx, ry);
    const [tx, ty] = project(TAP_DOOR + 0.5, TAP_FACE, 0.5); out.tap = px(tx, ty);
    const rb = c => c[0] - c[2]; out.paneRB = out.panes.map(rb); out.roseRB = rb(out.rose); out.tapRB = rb(out.tap); return out; });
  console.log('panes', JSON.stringify(r)); await p.close(); }
// 2+3. seed 7: warp through the winter; sample turned/fallow at the first noon with turned plots, lawn at the first snowy dawn
{ const p = await open('?pause&seed=7');
  const r = await p.evaluate(() => { const DAY = 55; __reseed(); __setTime(0);
    const px = (sx, sy) => { const d = ctx.getImageData(Math.round(sx * DPR), Math.round(sy * DPR), 1, 1).data; return [d[0], d[1], d[2]]; };
    const lum = c => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    const mean = (cs) => cs.reduce((a, c) => [a[0] + c[0] / cs.length, a[1] + c[1] / cs.length, a[2] + c[2] / cs.length], [0, 0, 0]).map(v => +v.toFixed(1));
    const out = {};
    const lawn = (key) => { drawScene(0, 0.016); const L = [], S = [];
        for (let y = CY - 5; y <= CY + 5; y++) for (let x = CX - 7; x <= CX + 7; x++){ const i = y * GW + x; if (grid[i] !== GRASS) continue;
          const [sx, sy] = project(x + 0.5, y + 0.5, 0); const c = px(sx, sy); const sn = snowAt(x, y, GRASS); (sn > 0 ? S : L).push(c); }
        out[key] = { day, hour: +hour.toFixed(2), snow: +snowCover.toFixed(2), daylight: +daylight.toFixed(2), nSnowed: S.length, snowed: mean(S), BminusG: +(mean(S)[2] - mean(S)[1]).toFixed(1) }; };
    for (let s = 0; s < 26 * DAY * 4 && !(out.turn && out.morn); s++){ __warp(0.25);
      if (out.dawn && !out.dawn2 && daylight > 0.3 && hour < 12 && day === out.dawn.day) lawn('dawn2');
      if (out.dawn && !out.morn && daylight > 0.55 && hour < 12 && day === out.dawn.day) lawn('morn');
      if (!out.turn && Math.abs(hour - 12) < 0.05){ let nT = 0; for (let i = 0; i < GW * WH; i++) if (turned[i]) nT++;
        if (nT > 6){ drawScene(0, 0.016); const T = [], F = [];
          for (let y = 0; y < WH; y++) for (let x = 0; x < GW; x++){ const i = y * GW + x; if (grid[i] !== BED || x < XS_W0) continue;
            const [sx, sy] = project(x + 0.5, y + 0.5, 0); const c = px(sx, sy);
            if (turned[i]) T.push(c); else if (!bSp[i]) F.push(c); }
          out.turn = { day, hour: +hour.toFixed(2), snow: +snowCover.toFixed(2), nT, nF: F.length, turned: mean(T), fallow: mean(F), dLum: +(lum(mean(F)) - lum(mean(T))).toFixed(1) }; } }
      if (!out.dawn && daylight > 0.10 && daylight < 0.3 && hour < 12 && snowCover > 0.3){ drawScene(0, 0.016); const L = [], S = [];
        for (let y = CY - 5; y <= CY + 5; y++) for (let x = CX - 7; x <= CX + 7; x++){ const i = y * GW + x; if (grid[i] !== GRASS) continue;
          const [sx, sy] = project(x + 0.5, y + 0.5, 0); const c = px(sx, sy); const sn = snowAt(x, y, GRASS); (sn > 0 ? S : L).push(c); }
        out.dawn = { day, hour: +hour.toFixed(2), snow: +snowCover.toFixed(2), daylight: +daylight.toFixed(2), nSnowed: S.length, snowed: mean(S), bare: L.length ? mean(L) : null, BminusG: +(mean(S)[2] - mean(S)[1]).toFixed(1) }; } }
    return out; });
  console.log('winter', JSON.stringify(r)); await p.close(); }
// 4. flags: seed 42 concert — flag half-width in px and coloured pixels in a crop around the bandstand
{ const p = await open('?pause&seed=42&t=0');
  const r = await p.evaluate(() => { const DAY = 55; __reseed(); let target = -1;
    for (let d = 2; d < 80; d++){ __setTime(d * DAY + 0.5 * DAY); if (isBandDay()){ target = d; break; } }
    __reseed(); __setTime(0); __setTime(target * DAY + 0.5 * DAY); let g = 0; while (bandF() < 0.99 && g++ < 4000) __warp(0.05);
    drawScene(0, 0.016); const [bx, by] = project(BANDSTAND.x, BANDSTAND.y, 0);
    const x0 = Math.round(bx - cellW * 4), y0 = Math.round(by - cellH * 14), w = Math.round(cellW * 8), h = Math.round(cellH * 14);
    const d = ctx.getImageData(x0 * DPR, y0 * DPR, w * DPR, h * DPR).data; let red = 0, yel = 0, teal = 0;
    for (let i = 0; i < d.length; i += 4){ const [r, g_, b_] = [d[i], d[i + 1], d[i + 2]]; if (r > 150 && g_ < 110 && b_ < 100) red++; else if (r > 180 && g_ > 150 && b_ < 110) yel++; else if (r < 100 && g_ > 100 && b_ > 100 && g_ > r + 30) teal++; }
    return { day: target, bandF: +bandF().toFixed(2), cellW: +cellW.toFixed(2), halfW: +Math.max(1.6, cellW * 0.13).toFixed(2), crop: [x0, y0, w, h], red, yel, teal }; });
  console.log('flags', JSON.stringify(r)); await p.close(); }
await b.close();
