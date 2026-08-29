/* crops vs HEAD at pinned instants: midnight lane (panes), rose window, concert bandstand, winter noon allotments, snowy dawn lawn */
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const b = await chromium.launch();
for (const [tag, file] of [['head', '/tmp/head.html'], ['cand', resolve('courtyard.html')]]){
  const shot = async (q, setup, name, box) => { const p = await b.newPage({ viewport: { width: 1600, height: 950 }, deviceScaleFactor: 2 });
    p.on('pageerror', e => console.log('PAGE ERROR', e.message)); await p.goto(pathToFileURL(file).href + q); await p.waitForFunction(() => window.__warp);
    const r = await p.evaluate(setup); const clip = await p.evaluate(box); const cb = await p.evaluate(() => document.querySelector('canvas').getBoundingClientRect()); clip.x += cb.x; clip.y += cb.y;
    await p.screenshot({ path: `shots/b58-${name}-${tag}.png`, clip }); console.log(tag, name, JSON.stringify(r)); await p.close(); };
  await shot('?pause&seed=3', () => { __reseed(); __setTime(3 * 55 + 55 * 18 / 24); __warp(0.01); drawScene(0, 0.016); return { hour: +hour.toFixed(2) }; }, 'night-lane',
    () => { const [x, y] = project(60, LN_WALK_N, 3); return { x: x - 260, y: y - 60, width: 520, height: 160 }; });
  await shot('?pause&seed=3', () => { __reseed(); __setTime(3 * 55 + 55 * 18 / 24); __warp(0.01); drawScene(0, 0.016); return {}; }, 'night-rose',
    () => { const [x, y] = project((CHURCH.nx0 + CHURCH.nx1) / 2, CHURCH.ny1, 5.4); return { x: x - 120, y: y - 90, width: 240, height: 180 }; });
  await shot('?pause&seed=42&t=0', () => { const DAY = 55; __reseed(); let target = -1; for (let d = 2; d < 80; d++){ __setTime(d * DAY + 0.5 * DAY); if (isBandDay()){ target = d; break; } }
    __reseed(); __setTime(0); __setTime(target * DAY + 0.5 * DAY); let g = 0; while (bandF() < 0.99 && g++ < 4000) __warp(0.05); drawScene(0, 0.016); return { day: target }; }, 'bandstand',
    () => { const [x, y] = project(BANDSTAND.x, BANDSTAND.y, 0); return { x: x - 90, y: y - 130, width: 180, height: 160 }; });
  await shot('?pause&seed=7', () => { __reseed(); __setTime(0); for (let s = 0; s < 26 * 55 * 4; s++){ __warp(0.25); if (Math.abs(hour - 12) < 0.05){ let n = 0; for (let i = 0; i < GW * WH; i++) if (turned[i]) n++; if (n > 6) break; } }
    drawScene(0, 0.016); return { day, hour: +hour.toFixed(2) }; }, 'winter-noon-plots',
    () => { const [x, y] = project((XS_E1 + GW) / 2, 30, 0); return { x: x - 200, y: y - 120, width: 400, height: 240 }; });
  await shot('?pause&seed=7', () => { __reseed(); __setTime(0); for (let s = 0; s < 26 * 55 * 4; s++){ __warp(0.25); if (daylight > 0.3 && hour < 12 && snowCover > 0.3) break; }
    drawScene(0, 0.016); return { day, hour: +hour.toFixed(2), snow: +snowCover.toFixed(2), daylight: +daylight.toFixed(2) }; }, 'snow-dawn-lawn',
    () => { const [x, y] = project(CX, CY, 0); return { x: x - 160, y: y - 100, width: 320, height: 200 }; });
}
await b.close();
