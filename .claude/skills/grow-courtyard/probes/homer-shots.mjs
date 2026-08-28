/* the night's own arrival: seed 3 day 3 — the first homer, a midnight-ish wide frame with them on the lane, and
 * a crop of their door N steps before and after they go in (fresh page each). */
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const b = await chromium.launch();
const url = pathToFileURL(resolve('courtyard.html')).href + '?pause&seed=3';
const setup = `const DAY = 55, dayN = 3; window.__reseed();
  window.__setTime(dayN * DAY + DAY * (16 - 6) / 24); window.__warp(0.001);
  const duskAt = sunDown - NIGHT_K * dayHours;
  window.__setTime(dayN * DAY + DAY * (duskAt - 1 - 6) / 24); window.__warp(0.001);`;
let p = await b.newPage({ viewport: { width: 1600, height: 950 }, deviceScaleFactor: 1 });
p.on('pageerror', e => console.log('PAGE ERROR', e.message));
await p.goto(url); await p.waitForFunction(() => window.__warp);
const info = await p.evaluate(new Function(setup + `
  let door = null, spawnStep = -1;
  for (let i = 1; i < 800; i++){ window.__warp(0.05);
    if (door === null){ const h = agents.find(a => a.homer); if (h){ door = h.home.x; spawnStep = i; } continue; }
    const v = HOMES.get(door * 1000 + 64); if (v && v.t !== null) return { door, spawnStep, arriveStep: i }; } return null;`));
console.log('homer', JSON.stringify(info));
await p.close();
const mid = Math.round((info.spawnStep + info.arriveStep) / 2);
for (const [k, wide] of [[mid, true], [info.arriveStep - 2, false], [info.arriveStep, false], [info.arriveStep + 20, false]]){
  p = await b.newPage({ viewport: { width: 1600, height: 950 }, deviceScaleFactor: 1 });
  await p.goto(url); await p.waitForFunction(() => window.__warp);
  const box = await p.evaluate(new Function('A', setup + `const {N, D} = A;
    for (let i = 0; i < N; i++) window.__warp(0.05);
    drawScene(0, 0.016);
    const c = document.querySelector('canvas'); const r = c.getBoundingClientRect();
    const [sx, sy] = project(D + 0.5, 65, 0); const sc = r.width / c.width;
    const w = agents.find(a => a.homer);
    const [px, py] = project(D - 0.13 + 0.5, 65, 5.6 * 0.86 - 5.6 * 0.3 * 0.3);
    const d = ctx.getImageData(Math.round(px * DPR), Math.round(py * DPR), 1, 1).data;
    return { x: r.left + sx * sc, y: r.top + sy * sc, lit: windowLit(D, 64), pane: [d[0], d[1], d[2]], walker: w ? [+w.x.toFixed(2), +w.y.toFixed(2), w.state] : null, hour: +hour.toFixed(2), nightF: +nightF.toFixed(2) };`), { N: k, D: info.door });
  const f = wide ? 'shots/homer-wide.png' : `shots/homer-door-${k - info.arriveStep}.png`;
  if (wide) await p.screenshot({ path: f }); else await p.screenshot({ path: f, clip: { x: box.x - 70, y: box.y - 110, width: 160, height: 150 } });
  console.log(f, JSON.stringify(box));
  await p.close();
}
await b.close();
