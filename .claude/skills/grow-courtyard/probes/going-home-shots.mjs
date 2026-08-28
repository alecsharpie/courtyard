/* the arrival: seed 3, day 3 — a lane walker reaches door 4 and the window over it lights.
 * Steps 0.05 s from an hour before the dusk edge until the register records the door-4
 * arrival, then crops around the door N steps before and after (fresh page each). */
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
const n0 = await p.evaluate(new Function(setup + `
  for (let i = 1; i < 800; i++){ window.__warp(0.05); const h = HOMES.get(4064); if (h && h.t !== null) return i; } return -1;`));
console.log('arrival step', n0);
await p.close();
for (const k of [-30, -2, 0, 20]){
  p = await b.newPage({ viewport: { width: 1600, height: 950 }, deviceScaleFactor: 1 });
  await p.goto(url); await p.waitForFunction(() => window.__warp);
  const box = await p.evaluate(new Function('N', setup + `
    for (let i = 0; i < N; i++) window.__warp(0.05);
    drawScene();
    const c = document.querySelector('canvas'); const r = c.getBoundingClientRect();
    const [sx, sy] = project(4.5, 65, 0); const sc = r.width / c.width;
    const w = agents.find(a => a.home && a.home.x === 4);
    return { x: r.left + sx * sc, y: r.top + sy * sc, lit: windowLit(4, 64), walker: w ? [+w.x.toFixed(2), +w.y.toFixed(2)] : null, hour: +hour.toFixed(2) };`), n0 + k);
  const f = `shots/home-door-${k < 0 ? 'before' : 'after'}${Math.abs(k)}.png`;
  await p.screenshot({ path: f, clip: { x: box.x - 70, y: box.y - 110, width: 160, height: 150 } });
  console.log(f, JSON.stringify(box));
  await p.close();
}
await b.close();
