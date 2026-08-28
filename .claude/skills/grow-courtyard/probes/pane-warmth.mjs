/* c87: sample the centre pixel of a lit cached pane (row < 61) and a lit row-64 pane at midnight, seed 3 day 3,
 * and again with applyLight stubbed, to see where the row-64 pane loses its warmth. */
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const file = resolve(process.argv[2] || 'courtyard.html');
const b = await chromium.launch();
for (const stub of [false, true]){
  const p = await b.newPage({ viewport: { width: 1600, height: 950 }, deviceScaleFactor: 1 });
  p.on('pageerror', e => console.log('PAGE ERROR', e.message));
  await p.goto(pathToFileURL(file).href + '?pause&seed=3');
  await p.waitForFunction(() => window.__warp);
  const r = await p.evaluate((stub) => {
    const DAY = 55; window.__reseed(); window.__setTime(3 * DAY + DAY * (24 - 6) / 24); window.__warp(0.01);
    if (stub) applyLight = () => {};
    drawScene(0, 0.016);
    const out = { hour: +hour.toFixed(2), nightF: +nightF.toFixed(2), cached: [], south: [] };
    const sample = (wx, wy, zTop, hgt) => { const [sx, sy] = project(wx - 0.13, wy, zTop - hgt * 0.3);
      const d = ctx.getImageData(Math.round(sx * DPR), Math.round(sy * DPR), 1, 1).data; return [d[0], d[1], d[2]]; };
    for (const [wx, wy, zTop, hgt, sa, sb] of WINDOWS) if (windowLit(sa, sb) && out.cached.length < 4) out.cached.push([sa, sb, sample(wx, wy, zTop, hgt)]);
    // row 64: recompute the window geometry the way drawFaceRow does
    for (let x = 0; x < GW; x++){ const y = 64; if (!solidM[y * GW + x] || solidC(x, y + 1)) continue;
      const e = Math.min(roofZ(x, y + 1), roofZ(x + 1, y + 1)); if (e < 2.4) continue; const slot = x % 7;
      if ((slot === 1 || slot === 4) && hash(x, y * 7) > 0.12 && windowLit(x, y)) out.south.push([x, y, homeDoorAt(x, y) ? 'door' : '', sample(x + 0.5, y + 1, e * 0.86, e * 0.30)]); }
    return out;
  }, stub);
  console.log(stub ? 'applyLight STUBBED' : 'full frame', JSON.stringify(r));
  await p.close();
}
await b.close();
